#!/usr/bin/env python3
"""Regression tests for semantic-plan inventory and bracket-only markers."""

from pathlib import Path
import tempfile
import unittest

from audit_plan_code import audit, generic_plan_step


class PlanCodeAuditTests(unittest.TestCase):
    def test_known_generic_inventory_is_rejected(self):
        for text in (
            "Prepare the inputs and fixed settings for the example.",
            "Report or visualize the measured result.",
            "Check the claimed identities, shapes, or invariants.",
            "Define the reusable `train` helper.",
            "Define the reusable helpers: `TwoTower`, `pair_loss`, and `train_tower`.",
        ):
            with self.subTest(text=text):
                self.assertTrue(generic_plan_step(text))

    def test_specific_contracts_and_reports_remain_valid(self):
        for text in (
            "Load the fixed fitting and shared benchmark images.",
            "Report parameter count and clean benchmark accuracy.",
            "Check that future keys receive zero weight and each row sums to one.",
            "Declare one reusable interface for the model factory, data, and training budget.",
            "Round and reconstruct weights with a shared or per-row symmetric grid.",
        ):
            with self.subTest(text=text):
                self.assertFalse(generic_plan_step(text))

    def check_fixture(self, step: str, marker: str) -> tuple[int, int, list[str]]:
        with tempfile.TemporaryDirectory(prefix="plan-code-audit-") as directory:
            path = Path(directory) / "chapter.qmd"
            path.write_text(
                "Prepare the inputs and fixed settings for the example.\n\n"
                ":::: {.plan-code}\n::: {.plan}\n1. " + step
                + "\n:::\n\n```{python}\n#| code-fold: false\n"
                + marker + "\nx = 1\n```\n::::\n"
            )
            return audit(path)

    def test_inventory_tripwire_is_scoped_to_plan_items(self):
        visible, hidden, errors = self.check_fixture(
            "Fix the scalar witness value.", "# [1]"
        )
        self.assertEqual((visible, hidden, errors), (1, 0, []))
        _, _, errors = self.check_fixture(
            "Prepare the inputs and fixed settings for the example.", "# [1]"
        )
        self.assertEqual(len(errors), 1)
        self.assertIn("generic plan inventory", errors[0])

    def test_descriptive_marker_is_still_rejected(self):
        _, _, errors = self.check_fixture(
            "Fix the scalar witness value.", "# [1] Set the value"
        )
        self.assertEqual(len(errors), 1)
        self.assertIn("only bracketed indices", errors[0])


if __name__ == "__main__":
    unittest.main()
