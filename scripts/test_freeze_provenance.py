"""Fail-closed fixture tests for source and canonical repeat provenance."""

from copy import deepcopy
from argparse import Namespace
import hashlib
import json
import io
from contextlib import redirect_stderr
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch

from compare_freeze_runs import compare_runs, validate_fingerprint
from audit_frozen_stdout import native_execution_ordinals, stdout_records
from freeze_provenance import SCHEMA_VERSION, execution_plan, freeze_inventory, json_digest, load_preflight, main, preflight_observation, sha256, source_fingerprint, write_json

SOURCE = "# Test\n\n```{python}\nprint('value: 1.234')\n```\n"
CONFIG = "execute:\n  freeze: true\n"


def bind_probes(freeze: Path, document: dict) -> None:
    for index, probe in enumerate(document["execution_probes"]):
        path = freeze.parent / "provenance/kernel-startup" / f"fixture-{index}.json"
        write_json(path, probe["observation"])
        probe.update(artifact=path.name, sha256=sha256(path))


def bind_preflight(freeze: Path, document: dict) -> None:
    observation = {"schema_version": 1, "kind": "execution-preflight", "promotion_eligible": False,
                   "runtime_kind": document["kind"], "created_utc": "2026-09-04T00:00:00Z",
                   "source": {key: document["source"][key] for key in ("commit", "input_sha256")},
                   "run": deepcopy(document["run"]), "cpu": deepcopy(document["cpu"]),
                   "runtime": deepcopy(document["runtime"])}
    path = freeze.parent / "provenance/preflight.json"
    write_json(path, observation)
    document["preflight"] = {"artifact": path.name, "sha256": sha256(path), "observation": observation}


def bind_coverage(freeze: Path, document: dict, *, source_root: Path | None = None) -> None:
    """Synthetic physical evidence, used only by isolated fixture tests."""
    from audit_execution_coverage import evidence_record
    from audit_python_sources import FENCE_RE
    provenance = freeze.parent / "provenance"
    config_path = provenance / "execution-sources/_quarto.yml"
    config_path.parent.mkdir(parents=True, exist_ok=True)
    config_path.write_text((source_root / "_quarto.yml").read_text() if source_root else CONFIG)
    rows = []
    for unit, specification in document["execution_plan"]["units"].items():
        source = (source_root / unit).read_text() if source_root else SOURCE
        path = provenance / "execution-sources" / unit
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(source)
        bodies = [match.group(2) for match in FENCE_RE.finditer(source)]
        for fmt in ("html", "tex"):
            raw_path = freeze / Path(unit).with_suffix("") / "execute-results" / f"{fmt}.json"
            if not raw_path.is_file():
                continue
            raw = raw_path.read_text()
            outputs = stdout_records(raw)
            notebook = provenance / "executed-notebooks" / Path(unit).with_suffix("") / f"{fmt}.ipynb"
            write_json(notebook, {"nbformat": 4, "nbformat_minor": 5, "metadata": {}, "cells": [
                {"cell_type": "code", "source": body, "metadata": {}, "execution_count": i,
                 "outputs": [{"output_type": "stream", "name": "stdout", "text": value}
                             for ordinal, value in outputs if ordinal == i]}
                for i, body in enumerate(bodies, 1)]})
            log = provenance / "execution-logs" / Path(unit).with_suffix("") / f"{fmt}.log"
            log.parent.mkdir(parents=True, exist_ok=True)
            log.write_text(f"Executing '{Path(unit).stem}.quarto_ipynb'\n" + "".join(
                f"  Cell {i}/{len(bodies)}: ''...Done\n" for i in range(1, len(bodies) + 1)))
            rows.append({"unit": unit, "format": fmt, "source": evidence_record(path, provenance),
                         "notebook": evidence_record(notebook, provenance), "log": evidence_record(log, provenance),
                         "freeze_sha256": sha256(raw_path), "native_ordinals": list(range(1, len(bodies) + 1)),
                         "rendered_ordinals": native_execution_ordinals(raw)})
    manifest = {"schema_version": 1, "passed": True, "config": evidence_record(config_path, provenance), "units": rows}
    path = provenance / "execution-coverage.json"
    write_json(path, manifest)
    document["execution_coverage"] = {"manifest_sha256": sha256(path), "manifest": manifest}


def execution(stdout: str = "value: 1.234\n", ordinal: int = 1) -> dict:
    return {"result": {"markdown": (
        f"::: {{.cell execution_count={ordinal}}}\n"
        "::: {.cell-output .cell-output-stdout}\n```\n" + stdout + "```\n:::\n:::\n"
    )}}


def fingerprint(freeze: Path, run_id: str) -> dict:
    inputs = {"chapters/test.qmd": hashlib.sha256(SOURCE.encode()).hexdigest(),
              "_quarto.yml": hashlib.sha256(CONFIG.encode()).hexdigest(), "container/Dockerfile": "b" * 64,
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
    document = {
        "schema_version": SCHEMA_VERSION, "kind": "canonical", "created_utc": "2026-09-04T00:00:00Z",
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
                           "units": {"chapters/test.qmd": {"source_sha256": inputs["chapters/test.qmd"],
                                                          "native_cells_sha256": [hashlib.sha256(b"print('value: 1.234')\n").hexdigest()],
                                                          "included_sources_sha256": {}}}},
        "execution_probes": [{"observation": {
            "python": runtime["python"], "torch": runtime["torch"],
            "environment": runtime["environment"], "pid": 1,
            "unit": "chapters/test.qmd", "format": fmt,
        }} for fmt in ("html", "latex")],
        "freeze_files_sha256": freeze_inventory(freeze),
    }
    bind_preflight(freeze, document)
    bind_probes(freeze, document)
    bind_coverage(freeze, document)
    return document


class FreezeProvenanceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
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
        bind_preflight(self.bundles[1] / "_freeze", document)
        bind_probes(self.bundles[1] / "_freeze", document)
        if "execution_plan" in document:
            bind_coverage(self.bundles[1] / "_freeze", document)
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
                    "source_sha256": {"chapters/test.qmd": hashlib.sha256(SOURCE.encode()).hexdigest()}, "files_sha256": sidecars}
        path = provenance / "paired-evidence-manifest.json"
        write_json(path,manifest)
        fingerprint_path = provenance / "fingerprint.json"
        document = json.loads(fingerprint_path.read_text())
        document["source"]["files_sha256"]["docs/paired-evidence-plan.json"] = "1"*64
        document["source"]["input_sha256"] = json_digest(document["source"]["files_sha256"])
        document["execution_plan"]["source_input_sha256"] = document["source"]["input_sha256"]
        document["paired_evidence"] = {"manifest_sha256": sha256(path),"manifest":manifest}
        bind_preflight(bundle / "_freeze", document)
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

    def local_fixture(self):
        bundle = self.bundles[0]
        provenance = bundle / "provenance"
        document = json.loads((provenance/"fingerprint.json").read_text())
        document["kind"] = "local"
        document["cpu"] = {"machine":"arm64", "system":"Darwin"}
        document["source"]["dirty"] = None
        document["container"]["digest"] = None
        document["container"]["base_digest"] = None
        write_json(provenance/"source-before.json",{**document["source"],"dirty":False})
        write_json(provenance/"execution-plan.json",document["execution_plan"])
        for index,probe in enumerate(document["execution_probes"]):
            path = provenance/"kernel-startup"/f"fixture-{index}.json"
            write_json(path,probe["observation"])
            probe.update(artifact=path.name,sha256=sha256(path))
        bind_preflight(bundle / "_freeze", document)
        write_json(provenance/"fingerprint.json",document)
        return bundle,document

    def test_local_validation_is_opt_in_and_retains_native_identity(self):
        bundle,document = self.local_fixture()
        self.assertTrue(validate_fingerprint(document,bundle/"_freeze"))
        self.assertEqual(validate_fingerprint(document,bundle/"_freeze",allow_local=True),[])
        self.assertEqual(document["kind"],"local")
        self.assertEqual(document["cpu"]["machine"],"arm64")

    def test_local_dirty_parent_cannot_authenticate_gitless_source(self):
        bundle,document = self.local_fixture()
        path = bundle/"provenance/source-before.json"
        before = json.loads(path.read_text())
        before["dirty"] = True
        write_json(path,before)
        self.assertIn("clean parent manifest", "\n".join(
            validate_fingerprint(document,bundle/"_freeze",allow_local=True)))

    def test_local_missing_actual_plan_is_rejected(self):
        bundle,document = self.local_fixture()
        (bundle/"provenance/execution-plan.json").unlink()
        self.assertIn("execution plan file", "\n".join(
            validate_fingerprint(document,bundle/"_freeze",allow_local=True)))

    def test_actual_kernel_probe_tamper_fails_local_and_canonical(self):
        bundle,document = self.local_fixture()
        write_json(bundle/"provenance/kernel-startup/fixture-0.json",{"altered":True})
        self.assertIn("Executed-kernel artifact", "\n".join(
            validate_fingerprint(document,bundle/"_freeze",allow_local=True)))
        canonical = json.loads((self.bundles[1]/"provenance/fingerprint.json").read_text())
        canonical["execution_probes"][0].update(artifact="missing.json",sha256="a"*64)
        self.assertIn("Executed-kernel artifact", "\n".join(
            validate_fingerprint(canonical,self.bundles[1]/"_freeze")))

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
        self.assertFailure("Original executed source differs")

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
        self.assertFailure("rendered-cell coverage differs")

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
        self.assertFailure("every planned unit/format")

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
        self.assertFailure("differs from authenticated runtime")

    def test_all_kernels_must_match_driver_threads_and_dispatch(self):
        def change(document):
            for probe in document["execution_probes"]:
                probe["observation"]["torch"]["num_threads"] = 6
                probe["observation"]["environment"]["OMP_NUM_THREADS"] = "6"
        self.mutate_fingerprint(change)
        self.assertFailure("differs from authenticated runtime")

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
            bind_preflight(bundle / "_freeze", document)
            bind_probes(bundle / "_freeze", document)
            write_json(path, document)
        self.assertFailure("every planned unit/format")

    def test_empty_stdout_cannot_hide_skipped_native_cells(self):
        for fmt in ("html", "tex"):
            write_json(self.bundles[1] / f"_freeze/chapters/test/execute-results/{fmt}.json",
                       {"result": {"markdown": "empty render\n"}})
        self.mutate_fingerprint(lambda document: document.update(
            freeze_files_sha256=freeze_inventory(self.bundles[1] / "_freeze")))
        self.assertFailure("rendered-cell coverage differs")

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

    def test_preflight_only_is_never_a_completed_fingerprint(self):
        path = self.bundles[1] / "provenance/fingerprint.json"
        document = json.loads(path.read_text())
        write_json(path, document["preflight"]["observation"])
        self.assertFailure("schema/kind")

    def test_original_preflight_file_is_required(self):
        (self.bundles[1] / "provenance/preflight.json").unlink()
        self.assertFailure("Original preflight artifact")

    def test_preflight_runtime_cannot_be_rewritten_post_execution(self):
        path = self.bundles[1] / "provenance/fingerprint.json"
        document = json.loads(path.read_text())
        document["runtime"]["torch"]["num_threads"] = 6
        write_json(path, document)
        self.assertFailure("Original preflight observation differs")

    def test_missing_raw_executed_notebook_is_rejected(self):
        (self.bundles[1] / "provenance/executed-notebooks/chapters/test/html.ipynb").unlink()
        self.assertFailure("Unsafe/missing execution evidence")

    def test_actual_execution_log_is_required(self):
        (self.bundles[1] / "provenance/execution-logs/chapters/test/tex.log").write_text("failed execution")
        self.assertFailure("evidence checksum mismatch")

    def test_notebook_metadata_may_differ_between_exact_repeats(self):
        provenance = self.bundles[1] / "provenance"
        path = provenance / "fingerprint.json"
        document = json.loads(path.read_text())
        manifest = document["execution_coverage"]["manifest"]
        row = manifest["units"][0]
        notebook = provenance / row["notebook"]["artifact"]
        value = json.loads(notebook.read_text())
        value["metadata"] = {"kernel_id": "different-per-run-id"}
        write_json(notebook, value)
        row["notebook"]["sha256"] = sha256(notebook)
        coverage_path = provenance / "execution-coverage.json"
        write_json(coverage_path, manifest)
        document["execution_coverage"]["manifest_sha256"] = sha256(coverage_path)
        write_json(path, document)
        report = compare_runs(*self.bundles, require_all_files=True)
        self.assertTrue(report["passed"], report)

    def test_silent_hidden_cell_requires_real_notebook_execution(self):
        source_root = self.root / "hidden-source"
        (source_root / "chapters").mkdir(parents=True)
        source = SOURCE + "\n```{python}\n#| echo: false\nunused = 2\n```\n"
        (source_root / "chapters/test.qmd").write_text(source)
        (source_root / "_quarto.yml").write_text(CONFIG)
        for bundle in self.bundles:
            path = bundle / "provenance/fingerprint.json"
            document = json.loads(path.read_text())
            files = document["source"]["files_sha256"]
            files["chapters/test.qmd"] = sha256(source_root / "chapters/test.qmd")
            document["source"]["input_sha256"] = json_digest(files)
            document["execution_plan"] = execution_plan(source_root, document["source"])
            bind_preflight(bundle / "_freeze", document)
            bind_coverage(bundle / "_freeze", document, source_root=source_root)
            write_json(path, document)
        self.assertTrue(self.compare()["passed"])
        provenance = self.bundles[1] / "provenance"
        path = provenance / "fingerprint.json"
        document = json.loads(path.read_text())
        row = document["execution_coverage"]["manifest"]["units"][0]
        notebook_path = provenance / row["notebook"]["artifact"]
        notebook = json.loads(notebook_path.read_text())
        notebook["cells"].pop()  # Coherent hash rewrite must not hide skipped execution.
        write_json(notebook_path, notebook)
        row["notebook"]["sha256"] = sha256(notebook_path)
        coverage_path = provenance / "execution-coverage.json"
        write_json(coverage_path, document["execution_coverage"]["manifest"])
        document["execution_coverage"]["manifest_sha256"] = sha256(coverage_path)
        write_json(path, document)
        self.assertFailure("exact ordered native execution counts")

    def test_preflight_capture_preserves_actual_observations_without_claiming_success(self):
        source_root = self.root / "preflight-source"
        source_root.mkdir()
        (source_root / "index.qmd").write_text("# Before execution\n")
        args = Namespace(root=source_root, source_commit="a" * 40, run_id="started-only", runtime_kind="local")
        with patch("freeze_provenance.runtime_observation", return_value={"observed": "runtime"}), \
             patch("freeze_provenance.cpu_observation", return_value={"observed": "cpu"}):
            document = preflight_observation(args)
        self.assertFalse(document["promotion_eligible"])
        self.assertEqual(document["runtime"], {"observed": "runtime"})
        path = self.root / "preflight.json"
        write_json(path, document)
        bound = load_preflight(path, source=document["source"], kind="local", run_id="started-only")
        self.assertEqual(bound["sha256"], sha256(path))
        with self.assertRaisesRegex(ValueError, "not bound"):
            load_preflight(path, source=document["source"], kind="local", run_id="another-run")

    def test_capture_rejection_preserves_actual_source_after_and_file_diff(self):
        source_root = self.root / "capture-source"
        (source_root / "chapters").mkdir(parents=True)
        (source_root / "data").mkdir()
        chapter = source_root / "chapters/test.qmd"
        chapter.write_text(SOURCE)
        removed = source_root / "data/input.txt"
        removed.write_text("original input\n")
        provenance = self.root / "capture-proof"
        before_path = provenance / "source-before.json"
        write_json(before_path, source_fingerprint(source_root, "a" * 40))
        originals = {}
        for name, data in (("preflight.json", {"kind": "execution-preflight", "promotion_eligible": False}),
                           ("status.json", {"state": "running"})):
            path = provenance / name
            write_json(path, data)
            originals[path] = path.read_bytes()
        originals[before_path] = before_path.read_bytes()
        chapter.write_text(SOURCE + "\nChanged after execution.\n")
        removed.unlink()
        # Keep the real failure class: generated duplicate PDFs remain inputs.
        (source_root / "chapters/test.pdf").write_bytes(b"%PDF-1.7\ndiagnostic fixture\n")
        observed = source_fingerprint(source_root, "a" * 40)
        output = provenance / "fingerprint.json"
        argv = ["freeze_provenance.py", "capture", "--root", str(source_root),
                "--source-commit", "a" * 40, "--source-before", str(before_path),
                "--freeze-root", str(self.root / "unused-freeze"), "--kind", "local",
                "--run-id", "rejected-fixture", "--output", str(output),
                "--preflight", str(provenance / "preflight.json"),
                "--execution-coverage-manifest", str(provenance / "execution-coverage.json")]
        error = io.StringIO()
        with patch("sys.argv", argv), redirect_stderr(error):
            result = main()
        self.assertEqual(result, 1)
        self.assertIn("Source/input inventory changed during execution", error.getvalue())
        self.assertFalse(output.exists(), "Rejected capture must not produce a completed fingerprint")
        after_path = provenance / "source-after.json"
        self.assertTrue(after_path.is_file(), "Capture lost its rejecting source observation")
        after = json.loads(after_path.read_text())
        self.assertFalse(after["promotion_eligible"])
        self.assertEqual(after["kind"], "rejected-source-after")
        self.assertEqual(after["source"], observed)
        report = json.loads((provenance / "source-inventory-mismatch.json").read_text())
        self.assertFalse(report["promotion_eligible"])
        self.assertEqual(report["added"], ["chapters/test.pdf"])
        self.assertEqual(report["removed"], ["data/input.txt"])
        self.assertEqual(report["changed"], ["chapters/test.qmd"])
        self.assertEqual(report["after"]["sha256"], sha256(after_path))
        self.assertEqual(report["before"]["sha256"], sha256(before_path))
        for path, original in originals.items():
            self.assertEqual(path.read_bytes(), original)
        saved = {path: path.read_bytes() for path in
                 (after_path, provenance / "source-inventory-mismatch.json")}
        chapter.write_text(SOURCE + "\nA later, different failed capture.\n")
        with patch("sys.argv", argv), redirect_stderr(io.StringIO()):
            self.assertEqual(main(), 1)
        self.assertFalse(output.exists())
        for path, original in {**originals, **saved}.items():
            self.assertEqual(path.read_bytes(), original, "Retry rewrote original failure evidence")


if __name__ == "__main__":
    unittest.main()
