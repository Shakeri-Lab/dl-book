"""Fail-closed fixture tests for source and canonical repeat provenance."""

from copy import deepcopy
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch

from compare_freeze_runs import compare_runs, validate_fingerprint
from audit_frozen_stdout import native_execution_ordinals, stdout_records
from freeze_provenance import execution_plan, freeze_inventory, json_digest, sha256, source_fingerprint, write_json


def execution(stdout: str = "value: 1.234\n", ordinal: int = 1) -> dict:
    return {"result": {"markdown": (
        f"::: {{.cell execution_count={ordinal}}}\n"
        "::: {.cell-output .cell-output-stdout}\n```\n" + stdout + "```\n:::\n:::\n"
    )}}


def fingerprint(freeze: Path, run_id: str) -> dict:
    inputs = {"chapters/test.qmd": "a" * 64, "container/Dockerfile": "b" * 64,
              "container/requirements-linux-amd64.lock": "c" * 64}
    runtime = {
        "python": {"version": "3.12.12", "full_version": "Python 3.12.12 test",
                   "implementation": "CPython", "soabi": "cpython-312-x86_64-linux-gnu"},
        "packages": [{"name": "torch", "version": "2.12.1+cpu"}],
        "torch": {"version": "2.12.1+cpu", "config": "same build",
                  "num_threads": 1, "num_interop_threads": 1},
        "loaded_libraries": [{"binary_sha256": "f" * 64, "internal_api": "mkl",
                              "version": "test", "num_threads": 1}],
        "environment": {"OMP_NUM_THREADS": "1", "MKL_CBWR": "AVX2"},
    }
    return {
        "schema_version": 1, "kind": "canonical", "created_utc": "2026-09-04T00:00:00Z",
        "run": {"id": run_id, "ci": {"GITHUB_RUN_ID": run_id}},
        "source": {"commit": "a" * 40, "dirty": False, "files_sha256": inputs,
                   "input_sha256": json_digest(inputs)},
        "container": {"digest": "sha256:" + "d" * 64,
                      "base_digest": "sha256:" + "e" * 64,
                      "recipe": {"path": "container/Dockerfile", "sha256": "b" * 64},
                      "wheel_lock": {"path": "container/requirements-linux-amd64.lock", "sha256": "c" * 64}},
        "runtime": runtime,
        "cpu": {"machine": "x86_64", "system": "Linux", "processors": [{"vendor": "Intel", "model": "fixture A", "flags": ["avx2"]}]},
        "execution_plan": {"schema_version": 1, "source_commit": "a" * 40,
                           "source_input_sha256": json_digest(inputs), "formats": ["html", "tex"],
                           "units": {"chapters/test.qmd": {"source_sha256": "a" * 64,
                                                          "native_cells_sha256": ["e" * 64],
                                                          "included_sources_sha256": {}}}},
        "execution_probes": [{"observation": {
            "python": runtime["python"], "torch": runtime["torch"],
            "environment": runtime["environment"], "pid": 1,
            "unit": "chapters/test.qmd", "format": fmt,
        }} for fmt in ("html", "latex")],
        "freeze_files_sha256": freeze_inventory(freeze),
    }


class FreezeProvenanceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.bundles = [self.root / "one", self.root / "two"]
        for bundle, run_id in zip(self.bundles, ("run-1", "run-2")):
            result = bundle / "_freeze/chapters/test/execute-results"
            for fmt in ("html", "tex"):
                write_json(result / f"{fmt}.json", execution())
            write_json(bundle / "provenance/fingerprint.json", fingerprint(bundle / "_freeze", run_id))

    def mutate_fingerprint(self, fn):
        path = self.bundles[1] / "provenance/fingerprint.json"
        document = json.loads(path.read_text())
        fn(document)
        write_json(path, document)

    def compare(self):
        return compare_runs(*self.bundles)

    def assertFailure(self, text):
        report = self.compare()
        self.assertFalse(report["passed"])
        self.assertIn(text, "\n".join(report["errors"]))

    def test_identical_stdout_passes_with_different_cpu_identity(self):
        self.mutate_fingerprint(lambda document: document["cpu"]["processors"][0].update(
            {"vendor": "AMD", "model": "fixture B", "flags": ["avx2", "avx512f"]}))
        report = self.compare()
        self.assertTrue(report["passed"], report)
        self.assertEqual(report["stdout_blocks_checked"], 2)

    def add_paired_manifest(self, bundle):
        provenance = bundle / "provenance"
        sidecars = {}
        for index in range(8):
            path = provenance / "paired-evidence" / f"fixture-{index}.json"
            write_json(path, {"value": index})
            sidecars[path.name] = sha256(path)
        manifest = {"passed": True, "plan_sha256": "1"*64,
                    "source_sha256": {"chapters/test.qmd": "a"*64}, "files_sha256": sidecars}
        path = provenance / "paired-evidence-manifest.json"
        write_json(path,manifest)
        fingerprint_path = provenance / "fingerprint.json"
        document = json.loads(fingerprint_path.read_text())
        document["source"]["files_sha256"]["docs/paired-evidence-plan.json"] = "1"*64
        document["source"]["input_sha256"] = json_digest(document["source"]["files_sha256"])
        document["execution_plan"]["source_input_sha256"] = document["source"]["input_sha256"]
        document["paired_evidence"] = {"manifest_sha256": sha256(path),"manifest":manifest}
        write_json(fingerprint_path,document)

    def test_raw_evidence_is_bound_even_when_stdout_matches(self):
        for bundle in self.bundles:
            self.add_paired_manifest(bundle)
        self.assertTrue(self.compare()["passed"])
        write_json(self.bundles[1]/"provenance/paired-evidence/fixture-0.json",{"value":99})
        self.assertFailure("sidecars are missing or differ")

    def test_missing_paired_fingerprint_is_not_accepted(self):
        for bundle in self.bundles:
            self.add_paired_manifest(bundle)
        self.mutate_fingerprint(lambda document: document.pop("paired_evidence"))
        self.assertFailure("missing fingerprint field paired_evidence")

    def test_installed_freeze_revalidates_immutable_proof_directory(self):
        bundle = self.bundles[0]
        self.add_paired_manifest(bundle)
        original = json.loads((bundle/"provenance/fingerprint.json").read_text())
        proof = self.root/"immutable-proof/first/provenance"
        shutil.move(str(bundle/"provenance"),proof)
        self.assertEqual(validate_fingerprint(original,bundle/"_freeze",provenance_root=proof),[])
        write_json(proof/"paired-evidence/fixture-0.json",{"value":-1})
        self.assertIn("sidecars are missing or differ", "\n".join(
            validate_fingerprint(original,bundle/"_freeze",provenance_root=proof)))

    def test_explicit_proof_path_must_match_original_fingerprint(self):
        document = json.loads((self.bundles[0]/"provenance/fingerprint.json").read_text())
        errors = validate_fingerprint(document,self.bundles[0]/"_freeze",
                                      provenance_root=self.bundles[1]/"provenance")
        self.assertIn("original fingerprint", "\n".join(errors))

    def test_missing_fingerprint_fails_even_if_outputs_match(self):
        (self.bundles[1] / "provenance/fingerprint.json").unlink()
        self.assertFailure("missing/invalid fingerprint")

    def test_missing_kernel_observation_fails(self):
        self.mutate_fingerprint(lambda document: document.update(execution_probes=[]))
        self.assertFailure("executed-kernel observations are missing")

    def test_source_hash_mismatch_fails_even_with_identical_stdout(self):
        def change(document):
            document["source"]["files_sha256"]["chapters/test.qmd"] = "d" * 64
            document["source"]["input_sha256"] = json_digest(document["source"]["files_sha256"])
            document["execution_plan"]["source_input_sha256"] = document["source"]["input_sha256"]
            document["execution_plan"]["units"]["chapters/test.qmd"]["source_sha256"] = "d" * 64
        self.mutate_fingerprint(change)
        self.assertFailure("source/input identity differs")

    def test_source_inventory_digest_is_checked(self):
        self.mutate_fingerprint(lambda document: document["source"].update(input_sha256="0" * 64))
        self.assertFailure("source input hash does not match")

    def test_container_mismatch_fails_even_with_identical_stdout(self):
        self.mutate_fingerprint(lambda document: document["container"].update(digest="sha256:" + "0" * 64))
        self.assertFailure("container/recipe/wheel-lock identity differs")

    def test_package_and_thread_mismatch_fail(self):
        self.mutate_fingerprint(lambda document: document["runtime"]["packages"].append(
            {"name": "numpy", "version": "wrong"}))
        self.assertFailure("software/thread/dispatch identity differs")

    def test_cloned_run_id_is_not_independent(self):
        self.mutate_fingerprint(lambda document: document["run"].update(id="run-1"))
        self.assertFailure("two independent execution records")

    def test_drift_is_not_hidden_by_portability_tolerance(self):
        for fmt in ("html", "tex"):
            write_json(self.bundles[1] / f"_freeze/chapters/test/execute-results/{fmt}.json", execution("value: 1.234000000001\n"))
        self.mutate_fingerprint(lambda document: document.update(
            freeze_files_sha256=freeze_inventory(self.bundles[1] / "_freeze")))
        self.assertFailure("stdout block 1 is not byte-identical")

    def test_stdout_native_cell_movement_fails(self):
        for fmt in ("html", "tex"):
            write_json(self.bundles[1] / f"_freeze/chapters/test/execute-results/{fmt}.json", execution(ordinal=2))
        self.mutate_fingerprint(lambda document: document.update(
            freeze_files_sha256=freeze_inventory(self.bundles[1] / "_freeze")))
        self.assertFailure("moved from native cell")

    def test_changed_file_without_refingerprinting_fails(self):
        write_json(self.bundles[1] / "_freeze/chapters/test/execute-results/html.json", execution("other\n"))
        self.assertFailure("recorded fingerprint inventory")

    def test_format_parity_is_required(self):
        path = self.bundles[1] / "_freeze/chapters/test/execute-results/tex.json"
        write_json(path, execution("wrong format\n"))
        self.mutate_fingerprint(lambda document: document.update(
            freeze_files_sha256=freeze_inventory(self.bundles[1] / "_freeze")))
        self.assertFailure("HTML/TeX stdout differs")

    def test_missing_format_is_not_silently_skipped(self):
        (self.bundles[1] / "_freeze/chapters/test/execute-results/tex.json").unlink()
        self.mutate_fingerprint(lambda document: document.update(
            freeze_files_sha256=freeze_inventory(self.bundles[1] / "_freeze")))
        self.assertFailure("missing TeX counterpart")

    def test_source_inventory_gitless_ignores_outputs_includes_real_inputs(self):
        root = self.root / "sources"
        for name in ("chapters/test.qmd", "data/input.txt", "container/Dockerfile",
                     "index.tex", "chapters/test.html", "_freeze/result.json", "build/log.txt"):
            path = root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text("fixture")
        with patch("freeze_provenance._command", side_effect=FileNotFoundError):
            result = source_fingerprint(root, "a" * 40)
        self.assertEqual(set(result["files_sha256"]), {
            "chapters/test.qmd", "data/input.txt", "container/Dockerfile",
        })

    def test_preexecution_plan_binds_native_and_included_code(self):
        root = self.root / "plan-source"
        (root / "chapters").mkdir(parents=True)
        (root / "code").mkdir()
        (root / "code/helper.py").write_text("value = 2\n")
        (root / "chapters/test.qmd").write_text(
            '# Test\n```{python}\nprint(2)\n```\n'
            '```{.python book-include="code/helper.py"}\n```\n'
        )
        with patch("freeze_provenance._command", side_effect=FileNotFoundError):
            source = source_fingerprint(root, "a" * 40)
        plan = execution_plan(root, source)
        self.assertEqual(set(plan["units"]), {"chapters/test.qmd"})
        self.assertEqual(len(plan["units"]["chapters/test.qmd"]["native_cells_sha256"]), 1)
        self.assertEqual(plan["units"]["chapters/test.qmd"]["included_sources_sha256"], {
            "code/helper.py": source["files_sha256"]["code/helper.py"],
        })

    def test_preexecution_plan_rejects_changed_included_input(self):
        root = self.root / "changed-plan"
        (root / "chapters").mkdir(parents=True)
        (root / "code").mkdir()
        (root / "code/helper.py").write_text("value = 2\n")
        (root / "chapters/test.qmd").write_text(
            '```{python}\nprint(2)\n```\n'
            '```{.python book-include="code/helper.py"}\n```\n'
        )
        with patch("freeze_provenance._command", side_effect=FileNotFoundError):
            source = source_fingerprint(root, "a" * 40)
        (root / "code/helper.py").write_text("value = 3\n")
        with self.assertRaisesRegex(ValueError, "input inventory"):
            execution_plan(root, source)

    def test_kernel_thread_disagreement_is_not_excused_by_matching_stdout(self):
        def change(document):
            probe = deepcopy(document["execution_probes"][0])
            probe["observation"]["torch"]["num_threads"] = 6
            document["execution_probes"].append(probe)
        self.mutate_fingerprint(change)
        self.assertFailure("executed kernels disagree")

    def test_different_commit_does_not_pass_on_identical_files(self):
        def change(document):
            document["source"]["commit"] = "f" * 40
            document["execution_plan"]["source_commit"] = "f" * 40
        self.mutate_fingerprint(change)
        self.assertFailure("source commit identity differs")

    def test_dirty_source_is_rejected(self):
        self.mutate_fingerprint(lambda document: document["source"].update(dirty=True))
        self.assertFailure("verified clean")

    def test_noncanonical_platform_is_rejected(self):
        self.mutate_fingerprint(lambda document: document["cpu"].update(system="Darwin", machine="arm64"))
        self.assertFailure("Linux x86_64")

    def test_missing_execution_plan_is_rejected(self):
        self.mutate_fingerprint(lambda document: document.pop("execution_plan"))
        self.assertFailure("execution_plan")

    def test_identical_subsets_do_not_satisfy_planned_coverage(self):
        for bundle in self.bundles:
            path = bundle / "provenance/fingerprint.json"
            document = json.loads(path.read_text())
            document["source"]["files_sha256"]["chapters/missing.qmd"] = "f" * 64
            digest = json_digest(document["source"]["files_sha256"])
            document["source"]["input_sha256"] = digest
            document["execution_plan"]["source_input_sha256"] = digest
            document["execution_plan"]["units"]["chapters/missing.qmd"] = {
                "source_sha256": "f" * 64, "native_cells_sha256": ["a" * 64],
            }
            for fmt in ("html", "latex"):
                probe = deepcopy(document["execution_probes"][0])
                probe["observation"].update(unit="chapters/missing.qmd", format=fmt)
                document["execution_probes"].append(probe)
            write_json(path, document)
        self.assertFailure("predeclared QMD/format set")

    def test_empty_stdout_cannot_hide_skipped_native_cells(self):
        for fmt in ("html", "tex"):
            write_json(self.bundles[1] / f"_freeze/chapters/test/execute-results/{fmt}.json",
                       {"result": {"markdown": "empty render\n"}})
        self.mutate_fingerprint(lambda document: document.update(
            freeze_files_sha256=freeze_inventory(self.bundles[1] / "_freeze")))
        self.assertFailure("native execution coverage differs")

    def test_probe_must_be_bound_to_executed_unit(self):
        self.mutate_fingerprint(lambda document: document["execution_probes"][0]["observation"].update(unit="wrong.qmd"))
        self.assertFailure("planned unit/format pairs")

    def test_language_fence_does_not_swallow_following_stdout(self):
        document = execution()
        document["result"]["markdown"] = "```text\nexample\n```\n" + document["result"]["markdown"]
        self.assertEqual(stdout_records(json.dumps(document)), [(1, "value: 1.234\n")])
        self.assertEqual(native_execution_ordinals(json.dumps(document)), [1])

    def test_example_cell_inside_language_fence_is_not_execution(self):
        document = execution("genuine\n")
        example = execution("not executed\n", ordinal=99)["result"]["markdown"]
        document["result"]["markdown"] = "````python\n" + example + "````\n" + document["result"]["markdown"]
        self.assertEqual(stdout_records(json.dumps(document)), [(1, "genuine\n")])
        self.assertEqual(native_execution_ordinals(json.dumps(document)), [1])

    def test_json_metadata_difference_is_separate_from_exact_stdout(self):
        path = self.bundles[1] / "_freeze/chapters/test/execute-results/html.json"
        document = json.loads(path.read_text())
        document["metadata"] = {"a-presentation-field": "changed"}
        write_json(path, document)
        self.mutate_fingerprint(lambda document: document.update(
            freeze_files_sha256=freeze_inventory(self.bundles[1] / "_freeze")))
        report = self.compare()
        self.assertTrue(report["numerical_repeat_passed"])
        self.assertTrue(report["passed"])
        self.assertFalse(report["full_freeze_byte_identical"])
        self.assertEqual(report["freeze_file_differences"][0]["category"], "execution-json")
        strict = compare_runs(*self.bundles, require_all_files=True)
        self.assertFalse(strict["passed"])
        self.assertTrue(strict["numerical_repeat_passed"])

    def test_changed_figure_is_reported_even_with_identical_stdout(self):
        for bundle, content in zip(self.bundles, (b"first figure", b"second figure")):
            asset = bundle / "_freeze/chapters/test/figure-html/witness.png"
            asset.parent.mkdir(parents=True)
            asset.write_bytes(content)
            path = bundle / "provenance/fingerprint.json"
            document = json.loads(path.read_text())
            document["freeze_files_sha256"] = freeze_inventory(bundle / "_freeze")
            write_json(path, document)
        report = self.compare()
        self.assertTrue(report["numerical_repeat_passed"])
        self.assertFalse(report["full_freeze_byte_identical"])
        self.assertEqual(report["freeze_file_differences"][0]["category"], "figure-asset")


if __name__ == "__main__":
    unittest.main()
