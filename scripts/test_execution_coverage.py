"""Tiny real-Quarto regression for executed cells omitted from visible Markdown."""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch

from audit_frozen_stdout import native_execution_ordinals, stdout_records
from audit_python_sources import FENCE_RE
from run_canonical_freeze import check_completed, execution_command
from audit_execution_coverage import (
    audit_execution_notebook, build_coverage_manifest, kept_notebook_path,
    record_execution, validate_coverage_manifest,
)

ROOT = Path(__file__).resolve().parents[1]
SOURCE = """# Silent cells

```{python}
#| echo: false
counter = 40
```

```{python}
#| label: fig-coverage-witness
#| code-summary: "Code: preserve quoted metadata"
#| fig-cap: "A quoted caption: one small figure."
#| fig-alt: "A line rising from zero to one."
#| fig-width: 3
#| fig-height: 2.0
import matplotlib.pyplot as plt
print(counter + 2)
plt.plot([0, 1], [0, 1])
plt.show()
```

```{python}
#| include: false
assert counter == 40
```
"""


def fixture_directory():
    # The image smoke gate mounts the source checkout read-only at /source.
    # All generated QMD, cache, notebook, and log artifacts belong in system temp.
    return tempfile.TemporaryDirectory(prefix="coverage-fixture-")


@unittest.skipUnless(os.environ.get("QUARTO_BIN") and os.environ.get("QUARTO_PYTHON"),
                     "Set QUARTO_BIN and QUARTO_PYTHON for the tiny real-Quarto fixture")
class SilentCellExecutionTests(unittest.TestCase):
    def test_all_authored_option_headers_survive_quarto_normalization(self):
        # Execute only synthetic sentinels. Keep every current authored header
        # (including its YAML spelling), never any numerical experiment body.
        entries = []
        for path in sorted((ROOT / "chapters").rglob("*.qmd")):
            for ordinal, match in enumerate(FENCE_RE.finditer(path.read_text()), 1):
                directives = []
                for line in re.split(r"\r\n?|\n", match.group(2)):
                    if not line.startswith("#|"):
                        break
                    directives.append(line)
                serial = len(entries) + 1
                directives = [re.sub(r"^#\| label:.*$", f"#| label: option-witness-{serial}", line)
                              for line in directives]
                entries.append("```{python}\n" + "\n".join(directives) + "\n"
                               + f"# Source options: {path.relative_to(ROOT)} native {ordinal}\n"
                               + f'print("option witness {serial}")\n' + "```\n")
        self.assertTrue(entries, "The source-mounted book must supply authored cell headers")
        source = "# Authored option normalization witness\n\n" + "\n".join(entries)
        with fixture_directory() as temporary:
            root = Path(temporary)
            (root / "chapters").mkdir()
            unit = "chapters/option-witness.qmd"
            (root / unit).write_text(source)
            (root / "_quarto.yml").write_text(
                "project:\n  type: book\n  output-dir: _book\nbook:\n"
                "  title: Option witness\n  chapters:\n    - chapters/option-witness.qmd\n"
                "execute:\n  freeze: true\nformat:\n  html: default\n  pdf: default\n")
            shutil.copy2(ROOT / "_quarto-execution.yml", root / "_quarto-execution.yml")
            plan = {"formats": ["html", "tex"], "units": {unit: {
                "source_sha256": hashlib.sha256(source.encode()).hexdigest(),
                "native_cells_sha256": [hashlib.sha256(m.group(2).encode()).hexdigest()
                                        for m in FENCE_RE.finditer(source)],
            }}}
            provenance = root / "provenance"
            coverage = []
            for fmt in ("latex", "html"):
                kept = kept_notebook_path(root, unit)
                result = subprocess.run(
                    execution_command(os.environ["QUARTO_BIN"], unit, fmt), cwd=root,
                    env=os.environ, text=True, capture_output=True, timeout=120)
                log = root / f"{fmt}.log"
                log.write_text(result.stdout + result.stderr)
                self.assertEqual(result.returncode, 0, log.read_text())
                coverage.append(record_execution(root, root / "_freeze", provenance,
                                                 unit, fmt, log, kept, plan["units"][unit]))
            hashes = {name: hashlib.sha256((root / name).read_bytes()).hexdigest()
                      for name in (unit, "_quarto.yml")}
            manifest = build_coverage_manifest(provenance, plan, root / "_freeze", hashes, coverage)
            self.assertEqual(validate_coverage_manifest(manifest, provenance, plan, root / "_freeze", hashes), [])
            self.assertEqual([row["native_ordinals"] for row in manifest["units"]],
                             [list(range(1, len(entries) + 1))] * 2)

    def test_completed_silent_setup_and_final_cell_are_not_skipped(self):
        with fixture_directory() as temporary:
            root = Path(temporary)
            (root / "chapters").mkdir()
            (root / "_quarto.yml").write_text(
                "project:\n  type: book\n  output-dir: _book\n"
                "book:\n  title: Coverage fixture\n  chapters:\n    - chapters/target.qmd\n"
                "execute:\n  freeze: true\nformat:\n  html: default\n  pdf: default\n"
            )
            shutil.copy2(ROOT / "_quarto-execution.yml", root / "_quarto-execution.yml")
            unit = "chapters/target.qmd"
            (root / unit).write_text(SOURCE)
            plan = {"formats": ["html", "tex"], "units": {unit: {"source_sha256": hashlib.sha256(SOURCE.encode()).hexdigest(), "native_cells_sha256": [
                hashlib.sha256(m.group(2).encode()).hexdigest() for m in FENCE_RE.finditer(SOURCE)
            ]}}}
            probes = root / "provenance/kernel-startup"
            probes.mkdir(parents=True)
            coverage = []
            for fmt in ("latex", "html"):
                kept = kept_notebook_path(root, unit)
                result = subprocess.run(execution_command(os.environ["QUARTO_BIN"], unit, fmt), cwd=root, env=os.environ,
                                        text=True, capture_output=True, timeout=60)
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                flavor = "tex" if fmt == "latex" else fmt
                raw = (root / f"_freeze/chapters/target/execute-results/{flavor}.json").read_text()
                self.assertEqual(stdout_records(raw), [(2, "42\n")])
                self.assertEqual(native_execution_ordinals(raw), [2])
                notebooks = list((root / "chapters").glob("target.quarto_ipynb*"))
                self.assertTrue(notebooks, "keep-ipynb must preserve actual execution evidence")
                notebook = json.loads(notebooks[-1].read_text())
                cells = [cell for cell in notebook["cells"] if cell["cell_type"] == "code"]
                self.assertEqual([cell["execution_count"] for cell in cells], [1, 2, 3])
                self.assertEqual(cells[1]["metadata"]["fig-width"], 3)
                self.assertEqual(cells[1]["metadata"]["fig-height"], 2)
                self.assertNotIn("#| fig-width:", "".join(cells[1]["source"]))
                (probes / f"{fmt}.json").write_text(json.dumps({"unit": unit, "format": fmt}))
                log = root / f"{fmt}.log"
                log.write_text(result.stdout + result.stderr)
                coverage.append(record_execution(root, root / "_freeze", probes.parent, unit, fmt,
                                                  log, kept, plan["units"][unit]))
            source_files = {name: hashlib.sha256((root / name).read_bytes()).hexdigest()
                            for name in (unit, "_quarto.yml")}
            manifest = build_coverage_manifest(probes.parent, plan, root / "_freeze", source_files, coverage)
            (probes.parent / "execution-coverage.json").write_text(json.dumps(manifest))
            self.assertTrue(check_completed(root, root / "_freeze", plan, probes, source_files)["html_tex_stdout_identical"])
            # Every silent execution is retained; neither presentation format
            # has been altered to manufacture a visible cell or printed output.
            self.assertEqual([row["native_ordinals"] for row in manifest["units"]], [[1, 2, 3]] * 2)
            notebook = probes.parent / manifest["units"][0]["notebook"]["artifact"]
            notebook.write_text("{}")
            self.assertTrue(validate_coverage_manifest(manifest, probes.parent, plan, root / "_freeze", source_files))


def frozen(cells):
    return json.dumps({"result": {"markdown": "".join(
        f"::: {{.cell execution_count={i}}}\n"
        + ("::: {.cell-output .cell-output-stdout}\n```\n" + output + "```\n:::\n" if output else "")
        + ":::\n" for i, output in cells)}})


class NativeCoverageTests(unittest.TestCase):
    def test_fixture_never_writes_beneath_readonly_source(self):
        with patch.dict(fixture_directory.__globals__, ROOT=Path("/source")):
            with fixture_directory() as directory:
                self.assertFalse(Path(directory).is_relative_to(Path("/source")))
                self.assertTrue(Path(directory).is_dir())

    def setUp(self):
        self.source = SOURCE
        bodies = [m.group(2) for m in FENCE_RE.finditer(SOURCE)]
        self.spec = {"native_cells_sha256": [hashlib.sha256(body.encode()).hexdigest() for body in bodies]}
        self.notebook = {"cells": [{"cell_type": "code", "execution_count": i,
                                   "source": body.rstrip("\n"), "outputs": []}
                                  for i, body in enumerate(bodies, 1)]}
        self.notebook["cells"][1]["outputs"] = [{"output_type": "stream", "name": "stdout", "text": "42\n"}]
        self.raw = frozen([(2, "42\n")])
        self.log = "Executing 'target.quarto_ipynb'\n" + "".join(f"  Cell {i}/3: ''...Done\n" for i in range(1, 4))

    def audit(self, **changes):
        args = {"source": self.source, "notebook": self.notebook, "freeze_raw": self.raw,
                "log": self.log, "unit": "chapters/target.qmd", "defaults": {}, "specification": self.spec}
        args.update(changes)
        return audit_execution_notebook(**args)

    def test_silent_omission_is_not_an_execution_exemption(self):
        self.assertEqual(self.audit(), {"native_ordinals": [1, 2, 3], "rendered_ordinals": [2]})

    def test_missing_visible_cell_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "rendered-cell coverage"):
            self.audit(freeze_raw=frozen([]))

    def test_missing_hidden_cell_with_stdout_is_rejected(self):
        self.notebook["cells"][0]["outputs"] = [{"output_type": "stream", "name": "stdout", "text": "setup ran\n"}]
        with self.assertRaisesRegex(ValueError, "rendered-cell coverage"):
            self.audit()

    def test_missing_hidden_cell_with_a_figure_is_rejected(self):
        self.notebook["cells"][0]["outputs"] = [{"output_type": "display_data", "data": {"image/png": "payload"}}]
        with self.assertRaisesRegex(ValueError, "rendered-cell coverage"):
            self.audit()

    def test_missing_silent_last_cell_is_rejected(self):
        self.notebook["cells"].pop()
        with self.assertRaisesRegex(ValueError, "execution counts"):
            self.audit()

    def test_swapped_or_null_counts_are_rejected(self):
        for counts in ([2, 1, 3], [1, 2, None], [1, 2, 2]):
            with self.subTest(counts=counts):
                for cell, count in zip(self.notebook["cells"], counts):
                    cell["execution_count"] = count
                with self.assertRaisesRegex(ValueError, "execution counts"):
                    self.audit()

    def test_source_and_options_are_bound(self):
        self.notebook["cells"][0]["source"] = "#| echo: false\ncounter = 41"
        with self.assertRaisesRegex(ValueError, "source/options differ"):
            self.audit()

    def relocated_figure(self):
        cell = self.notebook["cells"][1]
        cell["source"] = (cell["source"]
            .replace('#| code-summary: "Code: preserve quoted metadata"', "#| code-summary: 'Code: preserve quoted metadata'")
            .replace('#| fig-cap: "A quoted caption: one small figure."', "#| fig-cap: 'A quoted caption: one small figure.'")
            .replace('#| fig-alt: "A line rising from zero to one."', '#| fig-alt: A line rising from zero to one.')
            .replace("#| fig-width: 3\n", "").replace("#| fig-height: 2.0\n", ""))
        cell["metadata"] = {"fig-width": 3, "fig-height": 2}
        return cell

    def test_quarto_yaml_reserialization_and_dimension_relocation(self):
        self.relocated_figure()
        self.assertEqual(self.audit(), {"native_ordinals": [1, 2, 3], "rendered_ordinals": [2]})

    def test_missing_changed_or_extra_relocated_option_is_rejected(self):
        for metadata in ({"fig-width": 3}, {"fig-width": 4, "fig-height": 2},
                         {"fig-width": 3, "fig-height": 2, "eval": False},
                         {"fig-width": 3, "fig-height": 2, "tags": ["remove-cell"]}):
            with self.subTest(metadata=metadata):
                cell = self.relocated_figure()
                cell["metadata"] = metadata
                with self.assertRaisesRegex(ValueError, "source/options differ"):
                    self.audit()

    def test_reserialized_options_do_not_license_changed_python_or_comments(self):
        cell = self.relocated_figure()
        original = cell["source"]
        for replacement in ("print(counter + 3)", "# changed non-option comment\nprint(counter + 2)",
                            "print( counter + 2 )"):
            with self.subTest(replacement=replacement):
                cell["source"] = original.replace("print(counter + 2)", replacement)
                with self.assertRaisesRegex(ValueError, "source/options differ"):
                    self.audit()

    def test_directive_like_string_content_is_not_discarded(self):
        source = self.source.replace("counter = 40", 'counter = 40\nnote = """kept\n#| echo: false\n"""')
        bodies = [m.group(2) for m in FENCE_RE.finditer(source)]
        spec = {"native_cells_sha256": [hashlib.sha256(body.encode()).hexdigest() for body in bodies]}
        self.notebook["cells"][0]["source"] = bodies[0].replace("#| echo: false\n\"\"\"", "#| echo: true\n\"\"\"")
        with self.assertRaisesRegex(ValueError, "source/options differ"):
            self.audit(source=source, specification=spec)

    def test_non_quarto_line_separators_in_strings_are_exact(self):
        for separator in ("\u2028", "\u2029", "\x85", "\f", "\v"):
            with self.subTest(separator=repr(separator)):
                source = self.source.replace("counter = 40", 'counter = 40\nnote = """a' + separator + 'b"""')
                bodies = [m.group(2) for m in FENCE_RE.finditer(source)]
                spec = {"native_cells_sha256": [hashlib.sha256(body.encode()).hexdigest() for body in bodies]}
                self.notebook["cells"][0]["source"] = bodies[0].replace(separator, "\n")
                with self.assertRaisesRegex(ValueError, "source/options differ"):
                    self.audit(source=source, specification=spec)

    def test_errors_are_not_hidden_by_include_false(self):
        self.notebook["cells"][2]["outputs"] = [{"output_type": "error", "ename": "AssertionError"}]
        with self.assertRaisesRegex(ValueError, "native-cell error"):
            self.audit()

    def test_stdout_is_crosschecked_against_actual_notebook(self):
        with self.assertRaisesRegex(ValueError, "Frozen stdout differs"):
            self.audit(freeze_raw=frozen([(2, "43\n")]))

    def test_disabled_or_cached_global_evaluation_is_rejected(self):
        for defaults in ({"eval": False}, {"cache": True}):
            with self.subTest(defaults=defaults), self.assertRaisesRegex(ValueError, "actual evaluation"):
                self.audit(defaults=defaults)

    def test_wrong_unit_missing_completion_and_duplicate_logs_fail(self):
        for log in (self.log.replace("target", "other"), self.log.replace("Cell 3/3: ''...Done", "Cell 3/3: ''..."), self.log + self.log):
            with self.subTest(log=log), self.assertRaisesRegex(ValueError, "execution log"):
                self.audit(log=log)

    def test_cell_eval_false_cannot_borrow_quarto_assigned_counts(self):
        source = self.source.replace("#| echo: false", "#| echo: false\n#| eval: false", 1)
        bodies = [m.group(2) for m in FENCE_RE.finditer(source)]
        spec = {"native_cells_sha256": [hashlib.sha256(body.encode()).hexdigest() for body in bodies]}
        self.notebook["cells"][0]["source"] = bodies[0].rstrip("\n")
        with self.assertRaisesRegex(ValueError, "disabled/cached"):
            self.audit(source=source, specification=spec)

    def test_unit_frontmatter_cannot_hide_a_disabled_execution_override(self):
        with self.assertRaisesRegex(ValueError, "Per-unit execution defaults"):
            self.audit(source="---\nexecute:\n  eval: false\n---\n" + self.source)

    def test_failed_coverage_keeps_raw_notebook_without_a_success_manifest(self):
        with tempfile.TemporaryDirectory(prefix="coverage-failure-") as temporary:
            root = Path(temporary).resolve()
            unit = "chapters/target.qmd"
            (root / "chapters").mkdir()
            (root / unit).write_text(self.source)
            (root / "_quarto.yml").write_text("execute:\n  freeze: true\n")
            kept = root / "chapters/target.quarto_ipynb"
            kept.write_text(json.dumps(self.notebook))
            log = root / "render.log"
            log.write_text(self.log)
            freeze = root / "_freeze"
            raw = freeze / "chapters/target/execute-results/html.json"
            raw.parent.mkdir(parents=True)
            raw.write_text(frozen([]))  # The visible cell has been lost.
            provenance = root / "provenance"
            spec = {**self.spec, "source_sha256": hashlib.sha256(self.source.encode()).hexdigest()}
            with self.assertRaisesRegex(ValueError, "rendered-cell coverage"):
                record_execution(root, freeze, provenance, unit, "html", log, kept, spec)
            archived = provenance / "executed-notebooks/chapters/target/html.ipynb"
            self.assertEqual(archived.read_bytes(), kept.read_bytes())
            self.assertEqual((provenance / "execution-logs/chapters/target/html.log").read_text(), self.log)
            self.assertFalse((provenance / "execution-coverage.json").exists())

    def test_stale_kept_notebook_cannot_be_reused(self):
        with tempfile.TemporaryDirectory(prefix="coverage-stale-") as temporary:
            root = Path(temporary)
            (root / "chapters").mkdir()
            (root / "chapters/target.quarto_ipynb").write_text(json.dumps(self.notebook))
            with self.assertRaisesRegex(ValueError, "Stale retained notebook"):
                kept_notebook_path(root, "chapters/target.qmd")


if __name__ == "__main__":
    unittest.main()
