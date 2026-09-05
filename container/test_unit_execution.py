"""Optional real-Quarto single-unit regression, with unrequested failing units.

Run with QUARTO_BIN and QUARTO_PYTHON set. No book training is performed: the sole
requested cell prints a sentinel; both unrequested chapters deliberately raise.
"""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from run_canonical_freeze import execution_command
from audit_frozen_stdout import stdout_records
from test_execution_coverage import SilentCellExecutionTests  # Run in the same real-image smoke gate.


@unittest.skipUnless(os.environ.get("QUARTO_BIN") and os.environ.get("QUARTO_PYTHON"),
                     "Set QUARTO_BIN and QUARTO_PYTHON for the tiny real-Quarto fixture")
class UnitExecutionSmoke(unittest.TestCase):
    def test_only_requested_unit_executes_in_both_formats(self):
        with tempfile.TemporaryDirectory(prefix="dlbook-unit-isolation-") as temporary:
            root = Path(temporary)
            (root / "chapters").mkdir()
            (root / "_quarto.yml").write_text(
                "project:\n  type: book\n  output-dir: _book\n"
                "book:\n  title: Unit isolation fixture\n  chapters:\n"
                "    - index.qmd\n    - chapters/target.qmd\n    - chapters/forbidden.qmd\n"
                "execute:\n  freeze: true\nformat:\n  html: default\n  pdf: default\n"
            )
            shutil.copy2(ROOT / "_quarto-execution.yml", root / "_quarto-execution.yml")
            for name in ("index.qmd", "chapters/forbidden.qmd"):
                (root / name).write_text("# Unrequested\n\n```{python}\nraise RuntimeError('UNREQUESTED UNIT EXECUTED')\n```\n")
            (root / "chapters/target.qmd").write_text(
                "# Requested\n\n```{python}\nprint('ONLY REQUESTED UNIT')\n```\n"
            )
            records = []
            for fmt in ("latex", "html"):
                result = subprocess.run(execution_command(os.environ["QUARTO_BIN"], "chapters/target.qmd", fmt),
                                        cwd=root, env=os.environ, text=True, capture_output=True, timeout=60)
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                flavor = "tex" if fmt == "latex" else fmt
                raw = (root / f"_freeze/chapters/target/execute-results/{flavor}.json").read_text()
                records.append(stdout_records(raw))
            self.assertEqual(records, [[(1, "ONLY REQUESTED UNIT\n")]] * 2)
            units = {str(path.parent.parent.relative_to(root / "_freeze"))
                     for path in (root / "_freeze").glob("**/execute-results/*.json")}
            self.assertEqual(units, {"chapters/target"})


if __name__ == "__main__":
    unittest.main()
