"""Native audit fixtures: drift is explicit; malformed evidence stays blocking."""
from copy import deepcopy
import json
import os
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch

from audit_book_contract import native_portability_workflow_errors
from audit_execution_coverage import build_coverage_manifest, record_execution, validate_coverage_manifest
from audit_python_sources import FENCE_RE
from freeze_provenance import source_fingerprint, sha256
from report_native_portability import compare_unit, execute, finish, native_plan, summary, write_json

ROOT = Path(__file__).resolve().parents[1]


def frozen(value="metric: 1.0\n"):
    return {"result": {"markdown": (
        "::: {.cell execution_count=1}\n"
        "::: {.cell-output .cell-output-stdout}\n```\n" + value + "```\n:::\n:::\n"
    )}}


class NativePairTests(unittest.TestCase):
    def test_unsupported_text_schema_is_not_numeric_drift(self):
        result = compare_unit("chapters/fixture.qmd", [[1, "metric: 1.0\n"]], [[1, "other: 1.0\n"]])
        self.assertIn("unsupported output schema", result["validation_errors"][0])

    def test_numeric_change_keeps_failed_contract_distinct_from_validation(self):
        result = compare_unit("chapters/fixture.qmd", [[1, "metric: 1.0\n"]], [[1, "metric: 1.1\n"]])
        self.assertFalse(result["validation_errors"])
        self.assertTrue(result["contract_errors"])

    def test_cell_reassignment_is_blocking(self):
        result = compare_unit("chapters/fixture.qmd", [[1, "metric: 1.0\n"]], [[2, "metric: 1.0\n"]])
        self.assertTrue(result["validation_errors"])


class NativeReportTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.root = self.root.resolve()
        self.output = self.root / "build/native-portability"
        source = self.root / "chapters/fixture.qmd"
        source.parent.mkdir()
        source.write_text('# Fixture\n\n```{python}\nprint("metric: 1.0")\n```\n\n'
                          '```{python}\n#| echo: false\nunused = 2\n```\n')
        (self.root / "_quarto.yml").write_text("execute:\n  freeze: true\n")
        (self.root / "_quarto-execution.yml").write_text("project:\n  type: default\nuse-rsvg-convert: false\n")
        self.before = {"kind": "native-portability-probe", "source": {
            **source_fingerprint(self.root, "a" * 40), "dirty": False}}
        write_json(self.output / "before.json", self.before)
        self.plan = native_plan(self.root, self.before["source"])
        write_json(self.output / "execution-plan.json", self.plan)
        self.result_path = "_freeze/chapters/fixture/execute-results/html.json"
        write_json(self.output / "baseline-stdout.json", {self.result_path: [[1, "metric: 1.0\n"]]})
        write_json(self.root / self.result_path, frozen())
        self.coverage()

    def coverage(self, value="metric: 1.0\n"):
        provenance = self.output / "provenance"
        if provenance.exists():
            shutil.rmtree(provenance)  # Synthetic fixture proof only.
        notebook = self.root / "chapters/fixture.quarto_ipynb"
        bodies = [m.group(2) for m in FENCE_RE.finditer((self.root / "chapters/fixture.qmd").read_text())]
        write_json(notebook, {"cells": [
            {"cell_type": "code", "source": body, "execution_count": i,
             "outputs": [{"output_type": "stream", "name": "stdout", "text": value}] if i == 1 else []}
            for i, body in enumerate(bodies, 1)]})
        log = self.output / "unit.log"
        log.write_text("Executing 'fixture.quarto_ipynb'\n" + "".join(
            f"  Cell {i}/{len(bodies)}: ''...Done\n" for i in range(1, len(bodies) + 1)))
        row = record_execution(self.root, self.root / "_freeze", provenance,
                               "chapters/fixture.qmd", "html", log, notebook,
                               self.plan["units"]["chapters/fixture.qmd"])
        manifest = build_coverage_manifest(provenance, self.plan, self.root / "_freeze",
                                           self.before["source"]["files_sha256"], [row])
        write_json(provenance / "execution-coverage.json", manifest)

    def report(self, outcome="success", after=None):
        with patch("report_native_portability.observation", return_value=after or self.before):
            return finish(self.root, self.output, outcome)

    def test_matching_execution_passes_without_canonical_claim(self):
        report = self.report()
        self.assertEqual(report["status"], "pass")
        self.assertTrue(report["contract_passed"])
        self.assertFalse(report["canonical_identity_claim"])
        self.assertTrue((self.output / "fresh-stdout.json").exists())

    def test_drift_is_nonblocking_but_never_labeled_success(self):
        write_json(self.root / self.result_path, frozen("metric: 1.1\n"))
        self.coverage("metric: 1.1\n")
        report = self.report()
        self.assertEqual(report["status"], "drift")
        self.assertFalse(report["contract_passed"])
        self.assertFalse(report["blocking"])
        self.assertIn("contract did not pass", summary(report))
        self.assertTrue(list((self.output / "stdout-diffs").glob("*.diff")))

    def test_execution_failure_stays_blocking_and_keeps_raw_results(self):
        report = self.report("failure")
        self.assertTrue(report["blocking"])
        self.assertEqual(report["status"], "validation-error")
        self.assertTrue((self.output / "fresh-execution-json/chapters/fixture/execute-results/html.json").exists())

    def test_source_change_is_blocking(self):
        after = deepcopy(self.before)
        after["source"]["dirty"] = True
        self.assertTrue(self.report(after=after)["blocking"])

    def test_missing_unit_is_blocking(self):
        (self.root / self.result_path).unlink()
        self.assertTrue(self.report()["blocking"])

    def test_malformed_execution_json_is_blocking(self):
        (self.root / self.result_path).write_text("not JSON")
        self.assertTrue(self.report()["blocking"])

    def test_silent_hidden_cell_requires_retained_execution_not_rendered_cell(self):
        report = self.report()
        self.assertFalse(report["blocking"])
        manifest_path = self.output / "provenance/execution-coverage.json"
        manifest = json.loads(manifest_path.read_text())
        row = manifest["units"][0]
        self.assertEqual(row["native_ordinals"], [1, 2])
        self.assertEqual(row["rendered_ordinals"], [1])
        notebook = self.output / "provenance" / row["notebook"]["artifact"]
        raw = json.loads(notebook.read_text())
        raw["cells"].pop()
        write_json(notebook, raw)
        row["notebook"]["sha256"] = sha256(notebook)
        write_json(manifest_path, manifest)
        report = self.report()
        self.assertTrue(report["blocking"])
        self.assertIn("exact ordered native execution", " ".join(report["validation_errors"]))

    def test_missing_or_corrupt_original_evidence_is_blocking(self):
        provenance = self.output / "provenance"
        for kind in ("notebook", "log", "source"):
            with self.subTest(kind=kind):
                self.coverage()
                manifest = json.loads((provenance / "execution-coverage.json").read_text())
                (provenance / manifest["units"][0][kind]["artifact"]).unlink()
                self.assertTrue(self.report()["blocking"])
        self.coverage()
        (provenance / "execution-coverage.json").unlink()
        self.assertTrue(self.report()["blocking"])

    def test_html_only_proof_requires_explicit_report_purpose(self):
        manifest = json.loads((self.output / "provenance/execution-coverage.json").read_text())
        plan = deepcopy(self.plan)
        plan.pop("purpose")
        errors = validate_coverage_manifest(manifest, self.output / "provenance", plan,
                                            self.root / "_freeze", self.before["source"]["files_sha256"])
        self.assertIn("explicit HTML-only", " ".join(errors))

    def test_execute_archives_each_unit_before_cached_assembly(self):
        shutil.rmtree(self.root / "_freeze")
        shutil.rmtree(self.output / "provenance")
        calls = []
        def fake_run(command, log, work, env):
            calls.append(command)
            self.assertEqual(command[2], "chapters/fixture.qmd")
            self.assertIn("execution", command)
            self.assertIn("keep-ipynb:true", command)
            write_json(self.root / self.result_path, frozen())
            source = (self.root / "chapters/fixture.qmd").read_text()
            bodies = [m.group(2) for m in FENCE_RE.finditer(source)]
            write_json(self.root / "chapters/fixture.quarto_ipynb", {"cells": [
                {"cell_type": "code", "source": body, "execution_count": i,
                 "outputs": [{"output_type": "stream", "name": "stdout", "text": "metric: 1.0\n"}]
                 if i == 1 else []} for i, body in enumerate(bodies, 1)]})
            log.parent.mkdir(parents=True, exist_ok=True)
            log.write_text("Executing 'fixture.quarto_ipynb'\n  Cell 1/2: ''...Done\n  Cell 2/2: ''...Done\n")
        with patch("report_native_portability.source_fingerprint", return_value=self.before["source"]), \
             patch("report_native_portability.run_logged", side_effect=fake_run), \
             patch("guarded_assembly.guarded_render", return_value={"passed": True}) as assembly:
            execute(self.root, self.output)
        self.assertEqual(len(calls), 1)
        assembly.assert_called_once()
        self.assertFalse((self.root / "chapters/fixture.quarto_ipynb").exists())
        self.assertFalse(self.report()["blocking"])


@unittest.skipUnless(os.environ.get("DLBOOK_TEST_QUARTO") == "1", "opt-in tiny actual Quarto integration")
class NativeQuartoTests(unittest.TestCase):
    def test_actual_two_unit_execution_then_refusing_kernel_html_assembly(self):
        with tempfile.TemporaryDirectory(prefix="dlbook-native-smoke-") as directory:
            root = Path(directory).resolve()
            (root / "_quarto.yml").write_text(
                "project:\n  type: book\n  output-dir: _book\nbook:\n  title: Fixture\n"
                "  chapters: [index.qmd, second.qmd]\nexecute:\n  freeze: true\n"
                "format:\n  html: default\njupyter: python3\n")
            (root / "_quarto-execution.yml").write_text("project:\n  type: default\nuse-rsvg-convert: false\n")
            for name in ("index", "second"):
                (root / f"{name}.qmd").write_text(
                    f"# {name}\n\n```{{python}}\nprint('{name}')\n```\n\n"
                    "```{python}\n#| echo: false\nunused = 2\n```\n")
            before = {"source": {**source_fingerprint(root, "a" * 40), "dirty": False}}
            output = root / "build/native-portability"
            write_json(output / "before.json", before)
            write_json(output / "execution-plan.json", native_plan(root, before["source"]))
            with patch("report_native_portability.source_fingerprint", return_value=before["source"]):
                execute(root, output)
            manifest = json.loads((output / "provenance/execution-coverage.json").read_text())
            self.assertEqual([row["unit"] for row in manifest["units"]], ["index.qmd", "second.qmd"])
            self.assertTrue(all(row["native_ordinals"] == [1, 2] and row["rendered_ordinals"] == [1]
                                for row in manifest["units"]))
            self.assertTrue((root / "_book/index.html").is_file())
            self.assertTrue((root / "_book/second.html").is_file())


class NativeWorkflowTests(unittest.TestCase):
    def test_reporting_contract_is_enforced(self):
        text = (ROOT / ".github/workflows/execute-audit.yml").read_text()
        self.assertEqual(native_portability_workflow_errors(text), [])
        broken = text.replace("    name: Native Ubuntu portability report (not canonical)", "    continue-on-error: true")
        self.assertTrue(native_portability_workflow_errors(broken))
        self.assertIn("uses: ./.github/workflows/canonical-freeze.yml", text)
        self.assertTrue(native_portability_workflow_errors(text.replace(
            "report_native_portability.py execute", "quarto render --to html")))
        self.assertTrue(native_portability_workflow_errors(text.replace(
            "-r scripts/provenance_requirements.txt", "")))


if __name__ == "__main__":
    unittest.main()
