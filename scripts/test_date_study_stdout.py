#!/usr/bin/env python3
"""Synthetic regression fixtures for the date-table semantic gate; no training."""
from __future__ import annotations

import json
from pathlib import Path
import re
import random
import statistics
import subprocess
import sys
import tempfile
import unittest

from audit_date_study_stdout import (
    CHECKPOINTS, SEEDS, SLOTS, audit_freeze, compare_baseline, parameter_counts,
    parse_study,
)


# Deliberately mixed and sometimes poor outcomes: correctness must not require a winner.
FIXED = (0, 437, 219, 10, 87)
FREE = (1, 432, 221, 9, 86)
ATTENTION = (20, 200, 300, 437, 0)


def fixture(chapter: int, left=FIXED, right=None, curve_shift=0.0) -> str:
    """Use ordinary float/statistics formatting independently of the Decimal audit."""
    if right is None:
        right = FREE if chapter == 11 else ATTENTION
    names = ("TF", "FR") if chapter == 11 else ("fixed-state", "attention")
    lines = ["seed   TF errors   FR errors   TF accuracy   FR accuracy   FR-TF pp"
             if chapter == 11 else
             "seed   fixed errors   attention errors   fixed acc   attention acc   delta pp"]
    scores = [(1 - a / 437, 1 - b / 437) for a, b in zip(left, right)]
    for seed, a, b, (sa, sb) in zip(SEEDS, left, right, scores):
        lines.append(f"{seed}   {a:3d}/437     {b:3d}/437     "
                     f"{sa:9.2%}     {sb:9.2%}   {100 * (sb - sa):+8.3f}")
    lines.append("mean / sample SD across five training seeds (errors out of 437):")
    for col, counts in enumerate((left, right)):
        values = [row[col] for row in scores]
        lines.append(
            f"  {names[col]} errors: {statistics.mean(counts):.2f} / "
            f"{statistics.stdev(counts):.2f}; accuracy: "
            f"{statistics.mean(values):.3%} / {statistics.stdev(values):.3%}")
    differences = [100 * (b - a) for a, b in scores]
    contrast = "FR-TF" if chapter == 11 else "attention-fixed"
    lines.append(f"paired {contrast}: {statistics.mean(differences):+.3f} pp; "
                 f"sample SD {statistics.stdev(differences):.3f} pp")
    lines.append("paired initialization and schedule checks: 5/5" if chapter == 11
                 else "paired schedule checks: 5/5")
    lines.append("epoch   TF mean +/- SD        FR mean +/- SD (validation)" if chapter == 11
                 else "epoch   fixed mean +/- SD     attention mean +/- SD (validation)")
    for epoch in CHECKPOINTS:
        a = epoch / 30 + curve_shift
        b = epoch / 35
        lines.append(f"{epoch:2d}     {a:6.2%} +/- {0.03:6.2%}"
                     f"     {b:6.2%} +/- {0.01:6.2%}")
    if chapter == 11:
        lines.append("seed 6050 padding witness: naive errors 125/437; "
                     f"packed TF errors {left[0]}/437")
    else:
        lines.extend([
            "parameters: baseline 169,326; attention 269,550 (+59.2%)",
            "seed 6050 validation example: 'may 17, 1971' -> '1971-05-17' "
            "(truth 1971-05-17)",
            "validation year-region mass: 4.123%; top key in region: 0.000%",
            "maximum validation row-sum error: 2.38e-07",
        ])
    return "\n".join(lines) + "\n"


def freeze_json(chapter: int, study: str, ordinal_override: int | None = None) -> str:
    """Wrap fixtures as native-cell stdout; the production extractor does the parsing."""
    _, block, study_ordinal = SLOTS[chapter]
    ordinals = (1, 4, 7, 9, 11, 12) if chapter == 11 else (4, 5, 7, 9, 10, 12)
    chunks = []
    for index, ordinal in enumerate(ordinals, 1):
        text = study if index == block else "unrelated cell\n"
        if index == block:
            ordinal = ordinal_override if ordinal_override is not None else study_ordinal
        chunks.append(f"::: {{.cell execution_count={ordinal}}}\n"
                      "::: {.cell-output .cell-output-stdout}\n```\n"
                      f"{text}```\n:::\n:::\n")
    return json.dumps({"result": {"markdown": "\n".join(chunks)}})


class DateStdoutTests(unittest.TestCase):
    def test_mixed_outcomes_are_valid_and_baselines_agree(self):
        a, b = parse_study(fixture(11), 11), parse_study(fixture(13), 13)
        compare_baseline(a, b)
        self.assertEqual(a.errors[2], (219, 221))
        self.assertEqual(parameter_counts(), (169326, 269550))

    def test_zero_errors_and_zero_sd_are_valid(self):
        zeros = (0,) * 5
        parse_study(fixture(11, zeros, zeros), 11)
        parse_study(fixture(13, zeros, zeros), 13)

    def test_declared_rounding_accepts_varied_integer_results(self):
        rng = random.Random(6050)
        for _ in range(50):
            left = tuple(rng.randrange(438) for _ in SEEDS)
            right = tuple(rng.randrange(438) for _ in SEEDS)
            for chapter in SLOTS:
                parse_study(fixture(chapter, left, right), chapter)

    def test_wrong_error_mean_fails(self):
        bad = re.sub(r"TF errors: \d+\.\d{2}", "TF errors: 99.99", fixture(11), count=1)
        with self.assertRaisesRegex(ValueError, "mean errors"):
            parse_study(bad, 11)

    def test_population_sd_cannot_replace_sample_sd(self):
        population_sd = statistics.pstdev(FIXED)
        bad = re.sub(r"(TF errors: \d+\.\d{2} / )\d+\.\d{2}",
                     lambda match: f"{match[1]}{population_sd:.2f}", fixture(11), count=1)
        with self.assertRaisesRegex(ValueError, "sample SD of errors"):
            parse_study(bad, 11)

    def test_wrong_denominator_and_missing_or_duplicate_seed_fail(self):
        original = fixture(11)
        variants = [original.replace("/437", "/436", 1),
                    "\n".join(line for line in original.splitlines()
                              if not line.startswith("6052")) + "\n",
                    original.replace("6052", "6051", 1)]
        for bad in variants:
            with self.subTest(text=bad[:150]), self.assertRaises(ValueError):
                parse_study(bad, 11)

    def test_wrong_accuracy_or_paired_delta_fails(self):
        original = fixture(13)
        variants = [original.replace("100.00%", "99.99%", 1),
                    re.sub(r"(paired attention-fixed: )[+-]\d+\.\d{3}",
                           r"\g<1>+99.999", original, count=1),
                    re.sub(r"sample SD \d+\.\d{3} pp", "sample SD 99.999 pp",
                           original, count=1)]
        for bad in variants:
            with self.subTest(text=bad[:150]), self.assertRaises(ValueError):
                parse_study(bad, 13)

    def test_pairing_claim_and_curve_schema_are_complete(self):
        original = fixture(13)
        variants = [original.replace("checks: 5/5", "checks: 4/5"),
                    original.replace("+/-  3.00%", "+/- nan%", 1),
                    original.replace("+/-  3.00%", "+/- 101.00%", 1),
                    original.replace(" 2      6.67%", " 3      6.67%", 1),
                    original + "unexpected extra metric: 1.0\n"]
        for bad in variants:
            self.assertNotEqual(bad, original)
            with self.subTest(text=bad[-250:]), self.assertRaises(ValueError):
                parse_study(bad, 13)

    def test_attention_counts_and_normalization_are_strict(self):
        original = fixture(13)
        for old, new in (("269,550", "269,551"), ("2.38e-07", "1.00e-06"),
                         ("2.38e-07", "nan"), ("4.123%", "100.001%")):
            with self.subTest(change=new), self.assertRaises(ValueError):
                parse_study(original.replace(old, new), 13)

    def test_stale_baseline_fails_even_when_each_table_is_internally_valid(self):
        a = parse_study(fixture(11), 11)
        changed = (1,) + FIXED[1:]
        b = parse_study(fixture(13, changed), 13)
        with self.assertRaisesRegex(ValueError, "Stale baseline at seed 6050"):
            compare_baseline(a, b)
        shifted = parse_study(fixture(13, curve_shift=0.01), 13)
        with self.assertRaisesRegex(ValueError, "Stale baseline validation"):
            compare_baseline(a, shifted)

    def write_freeze(self, root: Path) -> None:
        for chapter, (unit, _, _) in SLOTS.items():
            directory = root / unit / "execute-results"
            directory.mkdir(parents=True)
            for fmt in ("html", "tex"):
                (directory / f"{fmt}.json").write_text(freeze_json(chapter, fixture(chapter)))

    def test_real_stdout_extractor_and_cli_accept_a_complete_synthetic_freeze(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            self.write_freeze(root)
            self.assertEqual(audit_freeze(root), [])
            completed = subprocess.run(
                [sys.executable, str(Path(__file__).with_name("audit_date_study_stdout.py")),
                 "--freeze-root", str(root)], text=True, capture_output=True)
            self.assertEqual(completed.returncode, 0, completed.stdout + completed.stderr)
            self.assertIn("PASS:", completed.stdout)

    def test_moved_native_cell_and_format_mismatch_fail(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            self.write_freeze(root)
            path = root / SLOTS[13][0] / "execute-results/tex.json"
            path.write_text(freeze_json(13, fixture(13), ordinal_override=11))
            self.assertTrue(any("native cell 12" in error for error in audit_freeze(root)))
            changed = fixture(13, right=(0,) * 5)
            path.write_text(freeze_json(13, changed))
            self.assertTrue(any("HTML/TeX" in error for error in audit_freeze(root)))


if __name__ == "__main__":
    unittest.main()
