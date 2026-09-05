#!/usr/bin/env python3
"""Current/legacy schema dispatch regressions; synthetic output only, no training."""
from __future__ import annotations

import importlib
import re
import subprocess
import sys
import unittest
from pathlib import Path

from date_study_schema import (
    CHAPTERS_BY_SLUG, STDOUT_ORDINALS, is_current_date_study,
    validate_date_stdout_schema,
)
from notebook_stdout_contracts import compare_stdout_blocks
from test_date_study_stdout import FIXED, fixture


def current_blocks(chapter: int, left=FIXED) -> list[str]:
    blocks = ["unchanged independent witness\n"] * 6
    if chapter == 13:
        blocks[4] = "fixed validation 400; final test 437\n"
        blocks[5] = fixture(13, left)
    else:
        blocks[2] = fixture(11, left)
        count = left[0]
        examples = [f"  'march {i + 1}, 2001' -> '?'   (truth 2001-03-{i + 1:02d})"
                    for i in range(min(3, count))]
        blocks[3] = "\n".join([
            f"{count} errors on 437 unambiguous test dates; a sample:", *examples]) + "\n"
        blocks[4] = "\n\n".join(
            f"'03/0{i}/2021'   truth: '2021-03-0{i}'   greedy: '2021-99-99'\n"
            "   beam: '2021-03-01'   joint log score = -0.25\n"
            "   beam: '2021-03-01'   joint log score = -0.50"
            for i in range(1, 5)) + "\n\n"
        blocks[5] = "beam-5 disagrees with greedy on 0 of 200 test dates\n"
    return blocks


class DateContractDispatchTests(unittest.TestCase):
    def test_imports_have_no_cycle_in_either_order(self):
        for modules in (
            "notebook_stdout_contracts; import audit_date_study_stdout; import audit_frozen_stdout",
            "audit_date_study_stdout; import notebook_stdout_contracts; import audit_frozen_stdout",
        ):
            run = subprocess.run([sys.executable, "-c", f"import {modules}"],
                                 cwd=Path(__file__).parent, text=True, capture_output=True)
            self.assertEqual(run.returncode, 0, run.stderr)
        pure = importlib.import_module("date_study_schema")
        self.assertNotIn("stdout_records", vars(pure))

    def test_identical_current_tables_pass_without_granting_portability(self):
        for slug, chapter in CHAPTERS_BY_SLUG.items():
            blocks = current_blocks(chapter)
            self.assertTrue(is_current_date_study(slug, blocks))
            self.assertEqual(validate_date_stdout_schema(slug, blocks, STDOUT_ORDINALS[chapter]), [])
            result = compare_stdout_blocks(slug, blocks, blocks,
                                           expected_ordinals=STDOUT_ORDINALS[chapter],
                                           actual_ordinals=STDOUT_ORDINALS[chapter])
            self.assertTrue(result.passed, result.errors)
            self.assertEqual(result.accepted_deviations, ())

    def test_identical_bad_arithmetic_still_fails(self):
        for slug, chapter in CHAPTERS_BY_SLUG.items():
            blocks = current_blocks(chapter)
            index = 2 if chapter == 11 else 5
            blocks[index] = re.sub(r"errors: \d+\.\d{2}", "errors: 99.99", blocks[index], count=1)
            result = compare_stdout_blocks(slug, blocks, blocks)
            self.assertFalse(result.passed)
            self.assertTrue(any("mean errors" in error for error in result.errors))

    def test_valid_changed_integer_measurements_remain_uncalibrated(self):
        changed = (1,) + FIXED[1:]
        for slug, chapter in CHAPTERS_BY_SLUG.items():
            before, after = current_blocks(chapter), current_blocks(chapter, changed)
            self.assertEqual(validate_date_stdout_schema(slug, after), [])
            result = compare_stdout_blocks(slug, before, after)
            self.assertFalse(result.passed)
            self.assertTrue(any("no reviewed portability calibration" in error for error in result.errors))
            self.assertEqual(result.accepted_deviations, ())

    def test_new_ch11_witness_gallery_and_beams_are_not_old_tolerance_slots(self):
        slug = "11-encoder-decoder"
        before = current_blocks(11, (3,) + FIXED[1:])
        variants = {
            1: before[1].replace("witness", "witness 0.001"),
            3: before[3].replace("-> '?'", "-> '2000-99-99'", 1),
            4: before[4].replace("-0.25", "-0.26", 1),
            5: before[5].replace("on 0 of", "on 1 of"),
        }
        for index, replacement in variants.items():
            after = list(before)
            after[index] = replacement
            self.assertEqual(validate_date_stdout_schema(slug, after), [])
            result = compare_stdout_blocks(slug, before, after)
            self.assertFalse(result.passed)
            self.assertTrue(any("no reviewed portability calibration" in error for error in result.errors))

    def test_gallery_truth_count_and_domain_are_semantic_not_outcome_constraints(self):
        slug = "11-encoder-decoder"
        for count in (0, 1, 2, 3, 437):
            blocks = current_blocks(11, (count,) + FIXED[1:])
            self.assertEqual(validate_date_stdout_schema(slug, blocks), [])
            for replacement in ("beam-5 disagrees with greedy on 200 of 200 test dates\n",):
                blocks[5] = replacement
                self.assertEqual(validate_date_stdout_schema(slug, blocks), [])
        before = current_blocks(11, (3,) + FIXED[1:])
        for index, bad in (
            (3, before[3].replace("3 errors", "4 errors")),
            (3, before[3].replace("truth 2001-03-01", "truth 2001-99-99")),
            (4, before[4].replace("-0.25", "0.25", 1)),
            (4, before[4].replace("-0.25", "-0.75", 1)),
            (5, before[5].replace("on 0 of", "on 201 of")),
        ):
            blocks = list(before)
            blocks[index] = bad
            self.assertTrue(validate_date_stdout_schema(slug, blocks))

    def test_same_wrong_ordinals_and_missing_population_are_rejected(self):
        slug = "13-attention"
        blocks = current_blocks(13)
        wrong_ordinals = (4, 5, 7, 9, 10, 11)
        result = compare_stdout_blocks(slug, blocks, blocks,
                                       expected_ordinals=wrong_ordinals, actual_ordinals=wrong_ordinals)
        self.assertFalse(result.passed)
        self.assertTrue(any("native stdout cells" in error for error in result.errors))
        blocks[4] = "fixed validation 399; final test 437\n"
        self.assertFalse(compare_stdout_blocks(slug, blocks, blocks).passed)

    def test_row_sum_bound_and_count_grid_remain_strict(self):
        slug = "13-attention"
        for old, new in (("2.38e-07", "1.00e-06"),
                         ("top key in region: 0.000%", "top key in region: 0.001%")):
            blocks = current_blocks(13)
            blocks[5] = blocks[5].replace(old, new)
            self.assertFalse(compare_stdout_blocks(slug, blocks, blocks).passed)
        blocks = current_blocks(13)
        # 203 / 1600 formatted as .3% is 12.687%, not exact-rational 12.688%.
        blocks[5] = blocks[5].replace("top key in region: 0.000%", "top key in region: 12.687%")
        self.assertTrue(compare_stdout_blocks(slug, blocks, blocks).passed)

    def test_malformed_header_cannot_downgrade_to_legacy_contract(self):
        slug = "13-attention"
        before, after = current_blocks(13), current_blocks(13)
        after[5] = "old or unsupported schema\n"
        result = compare_stdout_blocks(slug, before, after)
        self.assertFalse(result.passed)
        self.assertTrue(any("current date schema" in error for error in result.errors))

    def test_legacy_contract_self_tests_remain_unchanged(self):
        run = subprocess.run([sys.executable, str(Path(__file__).with_name("notebook_stdout_contracts.py"))],
                             text=True, capture_output=True)
        self.assertEqual(run.returncode, 0, run.stdout + run.stderr)


if __name__ == "__main__":
    unittest.main()
