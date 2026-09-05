#!/usr/bin/env python3
"""Validate date-study arithmetic and same-build baseline parity, not portability.

No winner or historical accuracy is required. Integer errors are the evidence;
Decimal arithmetic checks their printed summaries at the authored precision.
Frozen stdout extraction remains owned by audit_frozen_stdout.stdout_records.
"""
from __future__ import annotations

import argparse
from dataclasses import dataclass
from decimal import Decimal, localcontext
from pathlib import Path
import re

from audit_frozen_stdout import stdout_records


ROOT = Path(__file__).resolve().parents[1]
SEEDS = tuple(range(6050, 6055))
DENOMINATOR = 437
CHECKPOINTS = (2, 4, 6, 8, 12, 16, 20, 25)
# (freeze unit, one-based stdout block, native execution ordinal)
SLOTS = {
    11: ("chapters/part3/11-encoder-decoder", 3, 7),
    13: ("chapters/part4/13-attention", 6, 12),
}
PERCENT2 = r"(\d+\.\d{2})%"
PERCENT3 = r"(\d+\.\d{3})%"
ROW = re.compile(
    rf"(\d{{4}})\s+(\d+)/437\s+(\d+)/437\s+{PERCENT2}\s+{PERCENT2}"
    r"\s+([+-]\d+\.\d{3})")
CURVE = re.compile(
    rf"(\d+)\s+{PERCENT2}\s+\+/-\s+{PERCENT2}\s+"
    rf"{PERCENT2}\s+\+/-\s+{PERCENT2}")


@dataclass(frozen=True)
class Study:
    errors: tuple[tuple[int, int], ...]
    # Each checkpoint: left mean, left SD, right mean, right SD, in percent.
    curves: tuple[tuple[Decimal, Decimal, Decimal, Decimal], ...]


def mean_sd(values: list[Decimal]) -> tuple[Decimal, Decimal]:
    mean = sum(values) / len(values)
    variance = sum((value - mean) ** 2 for value in values) / (len(values) - 1)
    return mean, variance.sqrt()


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def printed(actual: str, value: Decimal, digits: int, label: str,
            signed: bool = False) -> None:
    expected = format(value, f"{'+' if signed else ''}.{digits}f")
    # Floating reductions may print -0.000 for a mathematically zero mean.
    same_zero = Decimal(actual) == 0 and Decimal(expected) == 0
    require(actual == expected or same_zero,
            f"{label}: printed {actual}; derived {expected} from integer errors")


def parameter_counts() -> tuple[int, int]:
    """Counts from the declared 37/14 vocabularies, embedding 32, hidden 128."""
    source_vocab, target_vocab, embed, hidden, alignment = 37, 14, 32, 128, 128

    def lstm(inputs: int) -> int:
        return 4 * hidden * inputs + 4 * hidden * hidden + 8 * hidden

    embeddings = (source_vocab + target_vocab) * embed
    fixed = embeddings + 2 * lstm(embed) + (hidden + 1) * target_vocab
    scorer = 2 * hidden * alignment + alignment
    attentive = (embeddings + lstm(embed) + scorer + lstm(embed + hidden)
                 + (2 * hidden + 1) * target_vocab)
    return fixed, attentive


def parse_study(text: str, chapter: int) -> Study:
    require(chapter in SLOTS, f"Unsupported chapter {chapter}")
    with localcontext() as context:
        context.prec = 60
        return _parse_study(text, chapter)


def _parse_study(text: str, chapter: int) -> Study:
    lines = iter(enumerate(text.splitlines(), 1))

    def take(pattern: str | re.Pattern, label: str) -> re.Match:
        try:
            number, line = next(lines)
        except StopIteration as exc:
            raise ValueError(f"Chapter {chapter}: missing {label}") from exc
        match = re.fullmatch(pattern, line.strip())
        require(match is not None,
                f"Chapter {chapter}, line {number}: invalid {label}: {line!r}")
        return match

    def literal(value: str) -> None:
        take(re.escape(value), value)

    names = ("TF", "FR") if chapter == 11 else ("fixed-state", "attention")
    header = ("seed   TF errors   FR errors   TF accuracy   FR accuracy   FR-TF pp"
              if chapter == 11 else
              "seed   fixed errors   attention errors   fixed acc   attention acc   delta pp")
    literal(header)
    errors = []
    for seed in SEEDS:
        row = take(ROW, f"seed {seed} row with denominator 437")
        require(int(row[1]) == seed, f"Chapter {chapter}: expected seed {seed}, got {row[1]}")
        left, right = int(row[2]), int(row[3])
        require(0 <= left <= DENOMINATOR and 0 <= right <= DENOMINATOR,
                f"Chapter {chapter}, seed {seed}: errors outside 0..437")
        errors.append((left, right))
        for col, error in enumerate((left, right)):
            accuracy = 100 * (1 - Decimal(error) / DENOMINATOR)
            printed(row[4 + col], accuracy, 2, f"seed {seed} {names[col]} accuracy")
        delta = 100 * Decimal(left - right) / DENOMINATOR
        printed(row[6], delta, 3, f"seed {seed} paired difference", signed=True)

    literal("mean / sample SD across five training seeds (errors out of 437):")
    for col, name in enumerate(names):
        summary = take(
            rf"{re.escape(name)} errors: (\d+\.\d{{2}}) / (\d+\.\d{{2}}); "
            rf"accuracy: {PERCENT3} / {PERCENT3}", f"{name} mean/sample SD")
        error_mean, error_sd = mean_sd([Decimal(row[col]) for row in errors])
        for actual, value, digits, quantity in (
            (summary[1], error_mean, 2, "mean errors"),
            (summary[2], error_sd, 2, "sample SD of errors"),
            (summary[3], 100 * (1 - error_mean / DENOMINATOR), 3, "mean accuracy"),
            (summary[4], 100 * error_sd / DENOMINATOR, 3, "sample SD of accuracy"),
        ):
            printed(actual, value, digits, f"{name} {quantity}")

    contrast = "FR-TF" if chapter == 11 else "attention-fixed"
    paired = take(rf"paired {contrast}: ([+-]\d+\.\d{{3}}) pp; "
                  r"sample SD (\d+\.\d{3}) pp", "paired mean/sample SD")
    differences = [100 * Decimal(left - right) / DENOMINATOR
                   for left, right in errors]
    delta_mean, delta_sd = mean_sd(differences)
    printed(paired[1], delta_mean, 3, "paired mean", signed=True)
    printed(paired[2], delta_sd, 3, "paired sample SD")
    literal("paired initialization and schedule checks: 5/5" if chapter == 11
            else "paired schedule checks: 5/5")
    literal("epoch   TF mean +/- SD        FR mean +/- SD (validation)" if chapter == 11
            else "epoch   fixed mean +/- SD     attention mean +/- SD (validation)")
    curves = []
    for epoch in CHECKPOINTS:
        row = take(CURVE, f"validation checkpoint {epoch}")
        require(int(row[1]) == epoch, f"Chapter {chapter}: missing/reordered epoch {epoch}")
        values = tuple(Decimal(row[i]) for i in range(2, 6))
        require(all(value.is_finite() and 0 <= value <= 100 for value in values),
                f"Chapter {chapter}, epoch {epoch}: nonfinite/out-of-range mean or SD")
        curves.append(values)

    if chapter == 11:
        witness = take(r"seed 6050 padding witness: naive errors (\d+)/437; "
                       r"packed TF errors (\d+)/437", "padding witness")
        require(0 <= int(witness[1]) <= DENOMINATOR, "Padding witness errors outside 0..437")
        require(int(witness[2]) == errors[0][0], "Padding witness is not seed 6050 TF")
    else:
        fixed, attentive = parameter_counts()
        increase = 100 * (Decimal(attentive) / fixed - 1)
        literal(f"parameters: baseline {fixed:,}; attention {attentive:,} (+{increase:.1f}%)")
        take(r"seed 6050 validation example: 'may 17, 1971' -> '[0-9?\-]{0,12}' "
             r"\(truth 1971-05-17\)", "predeclared validation example")
        alignment = take(rf"validation year-region mass: {PERCENT3}; "
                         rf"top key in region: {PERCENT3}", "alignment audit")
        require(all(0 <= Decimal(alignment[i]) <= 100 for i in (1, 2)),
                "Year-region proportions outside 0..100%")
        normalization = take(r"maximum validation row-sum error: (\d\.\d{2}e[+-]\d{2,})",
                             "normalization identity")
        row_error = Decimal(normalization[1])
        require(row_error.is_finite() and 0 <= row_error < Decimal("1e-6"),
                "Attention row-sum error must remain strictly below 1e-6")
    require(next(lines, None) is None, f"Chapter {chapter}: unparsed trailing stdout")
    return Study(tuple(errors), tuple(curves))


def compare_baseline(ch11: Study, ch13: Study) -> None:
    for seed, left, right in zip(SEEDS, ch11.errors, ch13.errors):
        require(left[0] == right[0],
                f"Stale baseline at seed {seed}: Chapter 11 TF has {left[0]}/437 "
                f"errors, Chapter 13 fixed-state has {right[0]}/437")
    for epoch, left, right in zip(CHECKPOINTS, ch11.curves, ch13.curves):
        require(left[:2] == right[:2],
                f"Stale baseline validation mean/SD at epoch {epoch}")


def audit_freeze(freeze_root: Path, formats: tuple[str, ...] = ("html", "tex")) -> list[str]:
    failures, by_format = [], {}
    for fmt in formats:
        studies, texts = {}, {}
        for chapter, (unit, block, ordinal) in SLOTS.items():
            path = freeze_root / unit / "execute-results" / f"{fmt}.json"
            try:
                records = stdout_records(path.read_text())
                require(len(records) == 6, f"Expected six stdout blocks, got {len(records)}")
                actual_ordinal, text = records[block - 1]
                require(actual_ordinal == ordinal,
                        f"Study stdout moved from native cell {ordinal} to {actual_ordinal}")
                studies[chapter] = parse_study(text, chapter)
                texts[chapter] = text
            except (OSError, ValueError, KeyError, TypeError) as exc:
                failures.append(f"{path}: {exc}")
        if len(studies) == 2:
            try:
                compare_baseline(studies[11], studies[13])
            except ValueError as exc:
                failures.append(f"{fmt}: {exc}")
        by_format[fmt] = texts
    if "html" in by_format and "tex" in by_format:
        for chapter in SLOTS:
            html, tex = by_format["html"].get(chapter), by_format["tex"].get(chapter)
            if html is not None and tex is not None and html != tex:
                failures.append(f"Chapter {chapter}: HTML/TeX study stdout differs")
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--freeze-root", type=Path, default=ROOT / "_freeze")
    args = parser.parse_args()
    failures = audit_freeze(args.freeze_root)
    if failures:
        print("\n".join(failures))
        print(f"FAIL: {len(failures)} date-study contract violation(s)")
        return 1
    print("PASS: five-seed date arithmetic, same-build baseline, and HTML/TeX parity")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
