"""Pre-training capture lifecycle witness, not a canonical book candidate.

Run the full authored A1 chapter (no long study), with its real static SVG/PDF
pair, through the production notebook-retention and schema-2 capture path.
The one-unit project/commit identity is explicitly synthetic fixture data.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import time
import unittest

import yaml

from audit_execution_coverage import build_coverage_manifest, kept_notebook_path, record_execution
from audit_python_sources import FENCE_RE
from compare_freeze_runs import validate_fingerprint
from freeze_provenance import SCHEMA_VERSION, execution_plan, sha256, source_fingerprint, write_json
from run_canonical_freeze import check_completed, execution_command, validate_execution_profile
from test_lstsq_sources import kernel_environment

ROOT = Path(__file__).resolve().parents[1]
UNIT = "chapters/appendices/a1-linear-algebra.qmd"
IMAGE = "figures/generated/1_1_lin_Recap-fig06"
FIXTURE_COMMIT = "f" * 40
FIXTURE_EPOCH = "1704067200"


def prepare_fixture(work: Path) -> dict:
    """Copy authored inputs unchanged; only project scope is fixture-specific."""
    for directory in ("scripts", "container"):
        shutil.copytree(ROOT / directory, work / directory,
                        ignore=shutil.ignore_patterns("__pycache__", "*.pyc", "node_modules"))
    names = [UNIT, IMAGE + ".svg", IMAGE + ".pdf", "_quarto-execution.yml"]
    for name in names:
        destination = work / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / name, destination)
    # The shared stdout parser imports the complete public-notebook manifest,
    # which validates path existence eagerly. Its other units are explicitly
    # non-executable placeholders here, not copied or claimed as book evidence.
    manifest = json.loads((ROOT / "scripts/notebook_manifest.json").read_text())
    for unit in manifest["notebooks"]:
        if unit["source"] != UNIT:
            placeholder = work / unit["source"]
            placeholder.parent.mkdir(parents=True, exist_ok=True)
            placeholder.write_text("# Non-executable capture-fixture placeholder\n")
    authored = yaml.safe_load((ROOT / "_quarto.yml").read_text())
    config = {
        "project": {"type": "book", "output-dir": "_book"},
        "book": {"title": "Pre-training capture lifecycle fixture", "chapters": [UNIT]},
        "jupyter": "python3", "execute": authored["execute"],
        "format": {"html": "default", "pdf": "default"},
    }
    (work / "_quarto.yml").write_text(yaml.safe_dump(config, sort_keys=False))
    return {name: sha256(work / name) for name in names}


def run_tool(command: list[str], log: Path, work: Path, environment: dict) -> None:
    log.parent.mkdir(parents=True, exist_ok=True)
    with log.open("w") as stream:
        result = subprocess.run(command, cwd=work, env=environment,
                                stdout=stream, stderr=subprocess.STDOUT, timeout=120)
    if result.returncode:
        raise AssertionError(f"Exit {result.returncode}; {log}\n{log.read_text()}")


class CaptureLifecycleContractTests(unittest.TestCase):
    def test_pretraining_gate_imports_the_complete_capture_witness(self):
        self.assertIn("from test_capture_lifecycle import RealCaptureLifecycleTests",
                      (ROOT / "container/test_unit_execution.py").read_text())

    def test_fixture_keeps_all_authored_native_cells_and_static_image_pair(self):
        with tempfile.TemporaryDirectory(prefix="capture-source-") as temporary:
            work = Path(temporary)
            names = prepare_fixture(work)
            self.assertEqual(names, {name: sha256(ROOT / name) for name in names})
            self.assertEqual((work / UNIT).read_bytes(), (ROOT / UNIT).read_bytes())
            self.assertTrue(list(FENCE_RE.finditer((work / UNIT).read_text())))
            source = source_fingerprint(work, FIXTURE_COMMIT)
            self.assertEqual(set(execution_plan(work, source)["units"]), {UNIT})
            self.assertEqual(yaml.safe_load((work / "_quarto.yml").read_text())["execute"],
                             yaml.safe_load((ROOT / "_quarto.yml").read_text())["execute"])


@unittest.skipUnless(os.environ.get("QUARTO_BIN") and os.environ.get("QUARTO_PYTHON"),
                     "Set QUARTO_BIN and QUARTO_PYTHON for the full-A1 capture witness")
class RealCaptureLifecycleTests(unittest.TestCase):
    def test_full_authored_a1_reaches_valid_schema2_capture(self):
        started = time.monotonic()
        report = {"kind": "pretraining-capture-fixture", "promotion_eligible": False,
                  "synthetic_fixture_commit": FIXTURE_COMMIT,
                  "scope": "Full authored A1 only; synthetic one-unit project, not a book execution",
                  "status": "running"}
        report_path = os.environ.get("DLBOOK_CAPTURE_WITNESS_REPORT")
        with tempfile.TemporaryDirectory(prefix="capture-lifecycle-") as temporary:
            temporary_root = Path(temporary).resolve()
            if report_path:
                Path(report_path).parent.mkdir(parents=True, exist_ok=True)
                bundle = Path(tempfile.mkdtemp(prefix="capture-lifecycle-evidence-",
                                              dir=Path(report_path).parent)).resolve()
            else:
                bundle = temporary_root / "evidence"
                bundle.mkdir()
            work = temporary_root / "work"
            work.mkdir()
            provenance = bundle / "provenance"
            provenance.mkdir()
            report["evidence_directory"] = str(bundle)
            try:
                report["authored_inputs_sha256"] = prepare_fixture(work)
                validate_execution_profile(work)
                source = source_fingerprint(work, FIXTURE_COMMIT)
                # Synthetic clean fixture baseline, not an assertion about a real
                # archived book commit. The actual files and runtime are observed.
                before = {**source, "dirty": False}
                write_json(provenance / "source-before.json", before)
                plan = execution_plan(work, source)
                self.assertEqual(set(plan["units"]), {UNIT})
                write_json(provenance / "execution-plan.json", plan)
                environment = kernel_environment(temporary_root / "kernel",
                                                 os.environ["QUARTO_PYTHON"], FIXTURE_EPOCH)
                environment.update(PYTHONPATH=str(work / "code"),
                                   DLBOOK_KERNEL_PROBE_DIR=str(provenance / "kernel-startup"))
                wrapper = [os.environ["QUARTO_PYTHON"], str(work / "container/canonical_python.py")]
                run_id = "pretraining-full-a1-fixture"
                run_tool(wrapper + [str(work / "scripts/freeze_provenance.py"), "preflight",
                         "--root", str(work), "--source-commit", FIXTURE_COMMIT,
                         "--run-id", run_id, "--runtime-kind", "local",
                         "--output", str(provenance / "preflight.json")],
                         bundle / "logs/preflight.log", work, environment)
                records = []
                for fmt in ("latex", "html"):
                    notebook = kept_notebook_path(work, UNIT)
                    log = bundle / f"logs/a1-{fmt}.log"
                    run_tool(execution_command(os.environ["QUARTO_BIN"], UNIT, fmt), log, work,
                             {**environment, "DLBOOK_EXECUTION_UNIT": UNIT,
                              "DLBOOK_EXECUTION_FORMAT": fmt})
                    records.append(record_execution(work, work / "_freeze", provenance, UNIT,
                                                     fmt, log, notebook, plan["units"][UNIT]))
                    self.assertFalse(list((work / UNIT).parent.glob("*.quarto_ipynb*")))
                write_json(provenance / "execution-coverage.json", build_coverage_manifest(
                    provenance, plan, work / "_freeze", source["files_sha256"], records))
                report["execution"] = check_completed(work, work / "_freeze", plan,
                    provenance / "kernel-startup", source["files_sha256"])
                shutil.copytree(work / "_freeze", bundle / "_freeze")
                run_tool(wrapper + [str(work / "scripts/freeze_provenance.py"), "capture",
                    "--kind", "local", "--root", str(work), "--source-commit", FIXTURE_COMMIT,
                    "--run-id", run_id, "--freeze-root", str(bundle / "_freeze"),
                    "--source-before", str(provenance / "source-before.json"),
                    "--execution-plan", str(provenance / "execution-plan.json"),
                    "--preflight", str(provenance / "preflight.json"),
                    "--execution-probes", str(provenance / "kernel-startup"),
                    "--execution-coverage-manifest", str(provenance / "execution-coverage.json"),
                    "--output", str(provenance / "fingerprint.json")],
                    bundle / "logs/capture.log", work, environment)
                document = json.loads((provenance / "fingerprint.json").read_text())
                self.assertEqual(document["schema_version"], SCHEMA_VERSION)
                self.assertEqual(document["kind"], "local")
                self.assertEqual(document["source"]["files_sha256"], source["files_sha256"])
                self.assertEqual(validate_fingerprint(document, bundle / "_freeze", allow_local=True), [])
                report.update(status="passed", fingerprint_sha256=sha256(provenance / "fingerprint.json"))
            except BaseException as error:
                report.update(status="failed", error=repr(error))
                raise
            finally:
                report["elapsed_seconds"] = time.monotonic() - started
                if report_path:
                    write_json(Path(report_path), report)
                print(f"Full-A1 capture fixture: {report['status']} in {report['elapsed_seconds']:.1f}s", flush=True)


if __name__ == "__main__":
    unittest.main()
