"""Source and tiny real-Quarto regressions for incidental freeze entropy."""

import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

from audit_python_sources import audit_stable_cell_identity
from run_canonical_freeze import execution_command


ROOT = Path(__file__).resolve().parents[1]


def errors_for(body):
    errors = []
    audit_stable_cell_identity("```{python}\n" + body + "```\n", "fixture.qmd", errors)
    return errors


class StableCellIdentityTests(unittest.TestCase):
    def test_silent_cells_also_require_stable_labels(self):
        self.assertTrue(errors_for("#| echo: false\nvalue = 1\n"))
        self.assertEqual(errors_for("#| label: silent-setup\n#| echo: false\nvalue = 1\n"), [])

    def test_label_must_be_in_leading_options_not_a_comment_or_string(self):
        self.assertTrue(errors_for("value = 1\n#| label: too-late\n"))
        self.assertTrue(errors_for('text = """\n#| label: not-an-option\n"""\n'))

    def test_label_spelling_and_duplicates_fail(self):
        self.assertTrue(errors_for("#| label: 123 not-stable\nvalue = 1\n"))
        errors = []
        cell = "```{python}\n#| label: repeated\nvalue = 1\n```\n"
        audit_stable_cell_identity(cell * 2, "fixture.qmd", errors)
        self.assertTrue(any("duplicate" in error for error in errors))

    def test_multiple_label_directives_fail(self):
        self.assertTrue(errors_for("#| label: first\n#| label: second\nvalue = 1\n"))

    def test_seed_call_keeps_rng_effect_without_displaying_returned_generator(self):
        prefix = "#| label: setup\nimport torch\n"
        self.assertTrue(errors_for(prefix + "torch.manual_seed(6050)\n"))
        self.assertEqual(errors_for(prefix + "_ = torch.manual_seed(6050)\n"), [])
        self.assertEqual(errors_for(prefix + "torch.manual_seed(6050)\nprint(42)\n"), [])

    def test_current_authored_cells_have_stable_labels(self):
        errors = []
        for path in sorted((ROOT / "chapters").rglob("*.qmd")):
            audit_stable_cell_identity(path.read_text(), str(path.relative_to(ROOT)), errors)
        self.assertEqual(errors, [])

    def test_real_stability_control_is_in_pretraining_image_gate(self):
        gate = (ROOT / "container/test_unit_execution.py").read_text()
        self.assertIn("from test_stable_cell_identity import RealQuartoStableIdentityTests", gate)


@unittest.skipUnless(os.environ.get("QUARTO_BIN") and os.environ.get("QUARTO_PYTHON"),
                     "Set QUARTO_BIN and QUARTO_PYTHON for the tiny real-Quarto fixture")
class RealQuartoStableIdentityTests(unittest.TestCase):
    def test_two_fresh_executions_keep_seeded_values_and_frozen_bytes_identical(self):
        # No book experiment runs. This exercises the exact setup return and
        # authored-label fixes through the pinned engine, in separate projects.
        source = '''# Stable cell identity

```{python}
#| label: stable-setup
import torch
_ = torch.manual_seed(6050)
```

```{python}
#| label: stable-result
print(torch.rand(3).tolist())
```

```{python}
#| label: stable-plot
#| echo: false
#| fig-width: 3
#| fig-height: 2
#| fig-alt: "A fixed line joins three specified coordinates."
import matplotlib.pyplot as plt
plt.plot([0, 1, 2], [0, 1, 0])
plt.show()
```
'''
        runs = []
        # A declared fixture clock, not a live build timestamp. Production uses
        # the actual source-commit timestamp rather than this synthetic constant.
        environment = dict(os.environ, SOURCE_DATE_EPOCH="1704067200")
        for _ in range(2):
            with tempfile.TemporaryDirectory(prefix="stable-cell-identity-") as temporary:
                root = Path(temporary)
                (root / "chapters").mkdir()
                (root / "chapters/target.qmd").write_text(source)
                (root / "_quarto.yml").write_text(
                    "project:\n  type: book\n  output-dir: _book\nbook:\n"
                    "  title: Stable fixture\n  chapters:\n    - chapters/target.qmd\n"
                    "execute:\n  freeze: true\nformat:\n  html: default\n  pdf: default\n")
                shutil.copy2(ROOT / "_quarto-execution.yml", root / "_quarto-execution.yml")
                for fmt in ("latex", "html"):
                    result = subprocess.run(
                        execution_command(os.environ["QUARTO_BIN"], "chapters/target.qmd", fmt),
                        cwd=root, env=environment, text=True, capture_output=True, timeout=90)
                    self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                    flavor = "tex" if fmt == "latex" else fmt
                    raw = (root / f"_freeze/chapters/target/execute-results/{flavor}.json").read_bytes()
                    markdown = json.loads(raw)["result"]["markdown"]
                    self.assertNotIn("Generator at 0x", markdown)
                    if fmt == "html":
                        self.assertIn("#stable-setup .cell", markdown)
                        self.assertIn("#stable-result .cell", markdown)
                frozen_unit = root / "_freeze/chapters/target"
                artifacts = {path.relative_to(frozen_unit).as_posix(): path.read_bytes()
                             for path in sorted(frozen_unit.rglob("*")) if path.is_file()}
                self.assertEqual({Path(name).suffix for name in artifacts}, {".json", ".png", ".pdf"})
                self.assertEqual(sum(name.endswith(".json") for name in artifacts), 2)
                self.assertTrue(any("figure-html/" in name for name in artifacts))
                self.assertTrue(any("figure-latex/" in name for name in artifacts))
                runs.append(artifacts)
        self.assertEqual(runs[0], runs[1])


if __name__ == "__main__":
    unittest.main()
