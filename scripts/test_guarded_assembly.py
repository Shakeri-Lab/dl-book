"""Tiny real-Quarto cache tests, plus fail-closed inventory fixtures."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

from guarded_assembly import assembly_command, guarded_render, inventory, verify_assembly_inventory
from guarded_assembly import assemble_html, install_html, PDF_NAMES, validate_manuscript_inputs, verify_original_unchanged
from freeze_provenance import execution_plan, source_fingerprint
from run_canonical_freeze import execution_command


class AssemblyInventoryTests(unittest.TestCase):
    def test_only_disposable_presentation_libraries_may_change(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            path = root / "chapters/a/execute-results/html.json"
            path.parent.mkdir(parents=True)
            path.write_text("{}")
            before = inventory(root)
            library = root / "site_libs/clipboard.js"
            library.parent.mkdir()
            library.write_text("presentation")
            self.assertEqual(verify_assembly_inventory(before, root), ["site_libs/clipboard.js"])
            figure = root / "chapters/a/figure-latex/plot.pdf"
            figure.parent.mkdir()
            figure.write_bytes(b"changed figure")
            with self.assertRaisesRegex(ValueError, "canonical computations/assets"):
                verify_assembly_inventory(before, root)

    def test_execution_overrides_are_rejected(self):
        for flag in ("--execute", "--no-execute", "--cache-refresh"):
            with self.assertRaises(ValueError):
                assembly_command("quarto", ["--to", "html", flag])

    def test_installed_libraries_are_immutable_too(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            path = root / "_freeze/chapters/a/execute-results/html.json"
            path.parent.mkdir(parents=True)
            path.write_text("{}")
            before = inventory(root / "_freeze")
            library = root / "_freeze/site_libs/library.js"
            library.parent.mkdir()
            library.write_text("presentation")
            with self.assertRaisesRegex(ValueError, "Installed canonical freeze changed"):
                verify_original_unchanged(root, before)

    def test_html_install_preserves_both_pdfs_and_recoverable_old_bundle(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            old, new = root / "_book", root / "rendered"
            old.mkdir()
            new.mkdir()
            (old / "index.html").write_text("old")
            (new / "index.html").write_text("new")
            for name in PDF_NAMES:
                (old / name).write_bytes(b"verified PDF")
                (new / name).write_bytes(b"unverified resource PDF")
            backup = install_html(root, new)
            self.assertEqual((old / "index.html").read_text(), "new")
            self.assertEqual((backup / "index.html").read_text(), "old")
            for name in PDF_NAMES:
                self.assertEqual((old / name).read_bytes(), b"verified PDF")

    def test_main_only_publishing(self):
        import yaml
        workflow = yaml.safe_load((Path(__file__).resolve().parents[1] /
                                   ".github/workflows/publish.yml").read_text())
        steps = workflow["jobs"]["build-deploy"]["steps"]
        publish = next(step for step in steps if step["name"] == "Publish to GitHub Pages")
        self.assertEqual(publish["if"], "github.ref == 'refs/heads/main'")
        render_index = next(index for index, step in enumerate(steps)
                            if step["name"] == "Render canonical HTML bundle last")
        evidence_index = next(index for index, step in enumerate(steps)
                              if step["name"] == "Preserve HTML assembly evidence")
        self.assertGreater(evidence_index, render_index)
        self.assertEqual(steps[evidence_index]["if"], "always()")

    def test_failed_html_preflight_cannot_inherit_previous_success(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "build").mkdir()
            success = root / "build/html-assembly.json"
            log = root / "build/quarto-html-final-render.log"
            success.write_text('{"old_success": true}')
            log.write_text("old successful render")
            with patch("guarded_assembly.verify_installed_inputs", side_effect=ValueError("invalid proof")):
                with self.assertRaisesRegex(ValueError, "invalid proof"):
                    assemble_html(root)
            self.assertFalse(success.exists())
            self.assertFalse(log.exists())


class SourceIdentityTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.unit = self.root / "chapters/a.qmd"
        self.unit.parent.mkdir()
        self.unit.write_text("# Chapter\n\nOriginal prose.\n\n```{python}\nprint(1)\n```\n")
        for name in ("data/a.json", "container/policy.py"):
            path = self.root / name
            path.parent.mkdir()
            path.write_text("{}\n")
        source = source_fingerprint(self.root, "a" * 40)
        self.fingerprint = {"source": source, "execution_plan": execution_plan(self.root, source)}

    def test_unchanged_sources_pass_and_new_documentation_is_allowed(self):
        (self.root / "docs").mkdir()
        (self.root / "docs/report.md").write_text("Presentation notes only.")
        validate_manuscript_inputs(self.root, self.fingerprint)

    def test_prose_only_change_fails(self):
        self.unit.write_text(self.unit.read_text().replace("Original prose.", "Revised prose."))
        with self.assertRaisesRegex(ValueError, "Executable manuscript"):
            validate_manuscript_inputs(self.root, self.fingerprint)

    def test_new_executable_unit_fails(self):
        (self.root / "chapters/b.qmd").write_text("```{python}\nprint(2)\n```\n")
        with self.assertRaisesRegex(ValueError, "Executable manuscript"):
            validate_manuscript_inputs(self.root, self.fingerprint)

    def test_data_or_container_changes_fail(self):
        for name in ("data/a.json", "container/policy.py"):
            with self.subTest(name=name):
                path = self.root / name
                path.write_text("changed")
                with self.assertRaisesRegex(ValueError, "code/data/experiment/container"):
                    validate_manuscript_inputs(self.root, self.fingerprint)
                path.write_text("{}\n")


@unittest.skipUnless(os.environ.get("QUARTO_BIN"), "Set QUARTO_BIN for tiny actual Quarto tests")
class RealAssemblyTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="dlbook-assembly-smoke-")
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        (self.root / "chapters").mkdir()
        (self.root / "_quarto.yml").write_text(
            "project:\n  type: book\n  output-dir: _book\nbook:\n  title: Cached witness\n"
            "  chapters: [index.qmd, chapters/witness.qmd]\n"
            "execute:\n  freeze: true\nformat:\n  html: default\n  pdf: default\n")
        (self.root / "_quarto-execution.yml").write_text("project:\n  type: default\n")
        (self.root / "index.qmd").write_text("# Preface\n\nA tiny assembly witness.\n")
        (self.root / "chapters/witness.qmd").write_text(
            "# Frozen computation\n\n```{python}\nfrom pathlib import Path\n"
            "_ = Path('cell-executed.txt').write_text('yes')\n"
            "print('CACHED-STDOUT-WITNESS')\n```\n")
        self.env = {**os.environ, "QUARTO_PYTHON": sys.executable}
        for fmt in ("latex", "html"):
            result = subprocess.run(execution_command(os.environ["QUARTO_BIN"], "chapters/witness.qmd", fmt),
                                    cwd=self.root, env=self.env, capture_output=True, text=True, timeout=60)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        for marker in self.root.rglob("cell-executed.txt"):
            marker.unlink()

    def test_no_execute_omits_cached_output(self):
        result = subprocess.run([os.environ["QUARTO_BIN"], "render", "--to", "html", "--no-clean",
                                 "--no-execute", "--use-freezer"], cwd=self.root, env=self.env,
                                capture_output=True, text=True, timeout=60)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        page = (self.root / "_book/chapters/witness.html").read_text()
        self.assertNotIn("cell-output-stdout", page)

    def test_frozen_outputs_survive_with_kernel_execution_prohibited(self):
        result = guarded_render(self.root, ["--to", "html", "--no-clean"], self.env,
                                quarto=os.environ["QUARTO_BIN"])
        page = (self.root / "_book/chapters/witness.html").read_text()
        self.assertIn("cell-output-stdout", page)
        self.assertEqual(result["canonical_results_and_figures"], "byte-identical")
        self.assertFalse(list(self.root.rglob("cell-executed.txt")))

    def test_latex_assembly_thaws_tex_cache_without_execution(self):
        result = guarded_render(self.root, ["--to", "latex", "--no-clean"], self.env,
                                quarto=os.environ["QUARTO_BIN"])
        candidates = list(self.root.rglob("Cached-witness.tex"))
        self.assertEqual(len(candidates), 1)
        tex = candidates[0].read_text()
        self.assertIn("\\begin{verbatim}\nCACHED-STDOUT-WITNESS", tex)
        self.assertEqual(result["canonical_results_and_figures"], "byte-identical")
        self.assertFalse(list(self.root.rglob("cell-executed.txt")))

    def test_missing_freeze_cannot_execute_as_fallback(self):
        # Keep an unrelated cached result so this tests a cache miss, not the
        # earlier global empty-freeze check.
        spare = self.root / "_freeze/unrequested/execute-results/html.json"
        spare.parent.mkdir(parents=True)
        shutil.copy2(self.root / "_freeze/chapters/witness/execute-results/html.json", spare)
        (self.root / "_freeze/chapters/witness/execute-results/html.json").unlink()
        with self.assertRaisesRegex(ValueError, "code execution|canonical computations|assembly failed"):
            guarded_render(self.root, ["--to", "html", "--no-clean"], self.env,
                           quarto=os.environ["QUARTO_BIN"])
        self.assertFalse(list(self.root.rglob("cell-executed.txt")))


if __name__ == "__main__":
    unittest.main()
