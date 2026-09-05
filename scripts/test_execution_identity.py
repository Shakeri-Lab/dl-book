"""Regression checks for the deliberately narrow computation-identity report."""

import unittest
from pathlib import Path
from unittest.mock import patch

from audit_execution_identity import changed_cells, current_paths


def cell(code: str, options: str = "#| label: witness") -> str:
    return f"```{{python}}\n{options}\n{code}\n```\n"


class IdentityTests(unittest.TestCase):
    def test_prose_and_bracket_comments_are_not_computation(self):
        self.assertEqual(changed_cells(
            "Before\n" + cell("x = 2 # [1]"),
            "After\n" + cell("# [2]\nx = 2"),
        ), [])

    def test_literal_change_is_not_excused_as_presentation(self):
        self.assertEqual(changed_cells(cell("x = '#111111'"), cell("x = '#222222'")), [1])

    def test_random_stream_and_order_changes_are_detected(self):
        a, b = cell("seed = 6050"), cell("sample = draw()", "#| label: sample")
        self.assertEqual(changed_cells(a + b, b + a), [1, 2])
        self.assertEqual(changed_cells(a, cell("seed = 6051")), [1])

    def test_caption_changes_only_are_allowed(self):
        self.assertEqual(changed_cells(
            cell("x = 2", "#| label: witness\n#| fig-cap: Before"),
            cell("x = 2", "#| label: witness\n#| fig-cap: After"),
        ), [])

    def test_eval_and_figure_generation_changes_are_detected(self):
        for option in ("eval: false", "fig-dpi: 300", "cache: true"):
            with self.subTest(option=option):
                self.assertEqual(changed_cells(
                    cell("x = 2"), cell("x = 2", "#| label: witness\n#| " + option),
                ), [1])

    def test_removed_cell_is_detected(self):
        self.assertEqual(changed_cells(cell("x = 2"), ""), [1])

    def test_inventory_includes_untracked_inputs(self):
        root = Path("/example/checkout")
        with patch("audit_execution_identity.subprocess.check_output", return_value=(
            "chapters/new-unit.qmd\ncode/new_module.py\ncode/tracked.py\n"
        )) as command:
            self.assertEqual(current_paths(root), {
                "chapters/new-unit.qmd", "code/new_module.py", "code/tracked.py",
            })
        command.assert_called_once_with(
            ["git", "ls-files", "--cached", "--others", "--exclude-standard"],
            cwd=root, text=True,
        )


if __name__ == "__main__":
    unittest.main()
