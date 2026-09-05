"""Native audit fixtures: drift is explicit; malformed evidence stays blocking."""
from copy import deepcopy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from audit_book_contract import native_portability_workflow_errors
from report_native_portability import compare_unit, finish, summary, write_json

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
        self.output = self.root / "build/native-portability"
        self.before = {"kind": "native-portability-probe", "source": {"commit": "a" * 40, "dirty": False}}
        write_json(self.output / "before.json", self.before)
        write_json(self.output / "execution-plan.json", {
            "units": {"chapters/fixture.qmd": {"native_cells_sha256": ["b" * 64]}}
        })
        self.result_path = "_freeze/chapters/fixture/execute-results/html.json"
        write_json(self.output / "baseline-stdout.json", {self.result_path: [[1, "metric: 1.0\n"]]})
        write_json(self.root / self.result_path, frozen())

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


class NativeWorkflowTests(unittest.TestCase):
    def test_reporting_contract_is_enforced(self):
        text = (ROOT / ".github/workflows/execute-audit.yml").read_text()
        self.assertEqual(native_portability_workflow_errors(text), [])
        broken = text.replace("    name: Native Ubuntu portability report (not canonical)", "    continue-on-error: true")
        self.assertTrue(native_portability_workflow_errors(broken))
        self.assertIn("uses: ./.github/workflows/canonical-freeze.yml", text)


if __name__ == "__main__":
    unittest.main()
