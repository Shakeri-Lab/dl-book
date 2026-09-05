"""Check prediction boundaries through Pandoc without executing chapter cells.

Run: python scripts/test_prediction_fences.py
The preceding source line is deliberately retained: Pandoc does not recognize a
fenced div that continues an ordinary paragraph without a separating blank line.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
import re
import subprocess
import unittest


ROOT = Path(__file__).resolve().parents[1]
OPEN = re.compile(r"^(:{3,})[ \t]+\{[^}\n]*\.notebook-prediction[^}\n]*\}[ \t]*$")


def prediction_windows(source: str):
    lines = source.splitlines()
    for index, line in enumerate(lines):
        match = OPEN.fullmatch(line)
        if not match:
            continue
        closing = re.compile(rf"^:{{{len(match.group(1))},}}[ \t]*$")
        end = next((i for i in range(index + 1, len(lines))
                    if closing.fullmatch(lines[i])), None)
        if end is None:
            raise ValueError(f"Unclosed notebook prediction at line {index + 1}")
        yield index + 1, "\n".join(lines[max(0, index - 1):end + 1]) + "\n"


def parsed_prediction_count(source: str) -> tuple[int, int]:
    result = subprocess.run([
        os.environ.get("QUARTO_BIN", "quarto"), "pandoc",
        "--from", "markdown+fenced_divs", "--to", "json",
    ], input=source, text=True, capture_output=True, check=True)
    counts = [0, 0]

    def visit(node):
        if isinstance(node, dict):
            if node.get("t") == "Div" and "notebook-prediction" in node["c"][0][1]:
                counts[0] += 1
            if node.get("t") == "Str" and re.fullmatch(r":{3,}", node.get("c", "")):
                counts[1] += 1
            for value in node.values():
                visit(value)
        elif isinstance(node, list):
            for value in node:
                visit(value)

    visit(json.loads(result.stdout))
    return tuple(counts)


class PredictionFenceTests(unittest.TestCase):
    def test_missing_separator_reproduces_both_literal_fences(self):
        broken = "Sentence.\n::: {.notebook-prediction}\nPredict.\n:::\n"
        self.assertEqual(parsed_prediction_count(broken), (0, 2))

    def test_blank_line_separates_prediction_from_paragraph(self):
        fixed = "Sentence.\n\n::: {.notebook-prediction}\nPredict.\n:::\n"
        self.assertEqual(parsed_prediction_count(fixed), (1, 0))

    def test_real_prediction_contexts_are_fenced_divs_not_printed_markers(self):
        checked = 0
        for path in sorted((ROOT / "chapters").rglob("*.qmd")):
            for line, source in prediction_windows(path.read_text()):
                checked += 1
                with self.subTest(source=str(path.relative_to(ROOT)), line=line):
                    self.assertEqual(parsed_prediction_count(source), (1, 0))
        self.assertGreater(checked, 0, "No source-authored prediction prompts found")


if __name__ == "__main__":
    unittest.main()
