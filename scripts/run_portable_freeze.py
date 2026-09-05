#!/usr/bin/env python3
"""Measure Mac portability from an exact source archive, without promotion.

The clean source manifest is the same one supplied to the canonical execution.
This driver may live outside that checkpoint: its own hash is retained, while
the execution helpers, startup policy, chapter inputs, and provenance collector
are loaded from the checkpoint. No canonical runtime assertion is made.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

from run_canonical_freeze import extract_source, file_hash, write_json

DEFAULT_PYTHON = "/Users/hs9hd/.venvs/dl-book/bin/python"


def load_execution_tools(work: Path):
    """Use the execution contract from the measured checkpoint, not a fork."""
    spec = importlib.util.spec_from_file_location(
        "portable_archived_execution", work / "scripts/run_canonical_freeze.py")
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


def make_kernel(jupyter: Path, python: Path, work: Path) -> list[str]:
    argv = [str(python), str(work / "container/kernel_start.py"), "-f", "{connection_file}"]
    write_json(jupyter / "data/kernels/python3/kernel.json", {
        "argv": argv, "display_name": "DL book Mac portability (isolated)",
        "language": "python", "metadata": {"debugger": False},
    })
    for name in ("config", "runtime"):
        (jupyter / name).mkdir(parents=True, exist_ok=True)
    return argv


def execution_environment(base: dict, *, keys: tuple, work: Path, jupyter: Path,
                          python: Path, probes: Path, threads: int, epoch: str) -> dict:
    if threads not in {1, 6} or not re.fullmatch(r"[1-9][0-9]*", epoch):
        raise ValueError("Mac profiles require one or six threads and a positive commit epoch")
    # Clear inherited numerical dispatch/thread settings before declaring this
    # profile. AVX2 controls belong to the Linux image, not Apple Silicon.
    env = {key: value for key, value in base.items() if key not in keys}
    env.update({
        "OMP_NUM_THREADS": str(threads), "MKL_NUM_THREADS": str(threads),
        "OPENBLAS_NUM_THREADS": str(threads), "VECLIB_MAXIMUM_THREADS": str(threads),
        "NUMEXPR_NUM_THREADS": str(threads), "OMP_DYNAMIC": "FALSE", "MKL_DYNAMIC": "FALSE",
        "DLBOOK_TORCH_NUM_THREADS": str(threads), "DLBOOK_TORCH_INTEROP_THREADS": "1",
        "SOURCE_DATE_EPOCH": epoch, "PYTHONHASHSEED": "0", "CUDA_VISIBLE_DEVICES": "",
        "MPLBACKEND": "Agg", "TZ": "UTC", "LC_ALL": "C", "LANG": "C",
        "QUARTO_PYTHON": str(python), "PYTHONPATH": str(work / "code"),
        "JUPYTER_PATH": str(jupyter / "data"), "JUPYTER_DATA_DIR": str(jupyter / "data"),
        "JUPYTER_CONFIG_DIR": str(jupyter / "config"), "JUPYTER_RUNTIME_DIR": str(jupyter / "runtime"),
        "JUPYTER_PREFER_ENV_PATH": "0", "DLBOOK_KERNEL_PROBE_DIR": str(probes),
        "PATH": str(python.parent) + os.pathsep + base.get("PATH", os.defpath),
    })
    env.pop("DLBOOK_EXECUTION_UNIT", None)
    env.pop("DLBOOK_EXECUTION_FORMAT", None)
    return env


def observe_selection(python: Path, quarto: str, argv: list[str], env: dict, work: Path) -> dict:
    code = ("import json, platform, sys; from jupyter_client.kernelspec import KernelSpecManager; "
            "print(json.dumps({'system': platform.system(), 'machine': platform.machine(), "
            "'python': platform.python_version(), 'implementation': platform.python_implementation(), 'executable': sys.executable, "
            "'kernel_argv': KernelSpecManager().get_kernel_spec('python3').argv}))")
    observed = json.loads(subprocess.check_output([str(python), "-c", code], cwd=work, env=env, text=True))
    if observed["system"] != "Darwin":
        raise ValueError("This entry point measures Mac portability, not canonical Linux execution")
    if Path(observed["executable"]).resolve() != python.resolve() or observed["kernel_argv"] != argv:
        raise ValueError("The selected Python/kernel differs from the explicit temporary registration")
    observed["quarto_version"] = subprocess.check_output([quarto, "--version"], env=env, text=True).strip()
    return observed


def validate_portable_probes(probes: Path, selection: dict, env: dict, keys: tuple, threads: int) -> None:
    """Require observed kernel policy, not just the launcher's requested flags."""
    expected_env = {key: env.get(key) for key in keys}
    identities = []
    for path in probes.glob("*.json"):
        probe = json.loads(path.read_text())
        torch = probe.get("torch", {})
        if (probe.get("schema_version") != 1 or torch.get("num_threads") != threads
                or torch.get("num_interop_threads") != 1 or probe.get("environment") != expected_env):
            raise ValueError(f"Observed Mac kernel policy differs from the declared profile: {path.name}")
        if probe.get("python") != {"version": selection["python"], "implementation": selection["implementation"]}:
            raise ValueError(f"Observed Mac kernel Python differs from the selected interpreter: {path.name}")
        identities.append((torch.get("version"), torch.get("config")))
    if not identities or not all(identities) or len(set(identities)) != 1 or any(not all(item) for item in identities):
        raise ValueError("Missing or inconsistent executed-kernel PyTorch identities")


def execute_snapshot(work: Path, output: Path, before: dict, commit: str, run_id: str,
                     python: Path, quarto: str, jupyter: Path, threads: int, epoch: str) -> dict:
    common = load_execution_tools(work)
    if (not callable(getattr(common, "execution_command", None))
            or not (work / "_quarto-execution.yml").is_file()):
        raise ValueError("Source checkpoint lacks the required unit-only execution profile/command")
    common.validate_execution_profile(work)
    source_tools = common.load_source_tools(work)
    current = source_tools.source_fingerprint(work, commit)
    common.validate_source(before, current, commit)
    provenance = output / "provenance"
    plan = source_tools.execution_plan(work, current)
    write_json(provenance / "execution-plan.json", plan)
    probes = provenance / "kernel-startup"
    argv = make_kernel(jupyter, python, work)
    env = execution_environment(os.environ, keys=source_tools.ENVIRONMENT_KEYS, work=work,
                                jupyter=jupyter, python=python, probes=probes, threads=threads, epoch=epoch)
    selection = observe_selection(python, quarto, argv, env, work)
    write_json(provenance / "runtime-selection.json", selection)
    write_json(provenance / "portable-profile.json", {
        "runtime": "mac-portability", "intra_op_threads": threads, "inter_op_threads": 1,
        "dispatch": "native Mac default; inherited numerical dispatch overrides cleared",
        "environment": {key: env.get(key) for key in source_tools.ENVIRONMENT_KEYS},
        "canonical_container": False, "promotion": "not performed",
    })
    from audit_execution_coverage import build_coverage_manifest, kept_notebook_path, record_execution
    wrapper = [str(python), str(work / "container/canonical_python.py")]
    common.run_logged(wrapper + [str(work / "scripts/freeze_provenance.py"), "preflight",
                      "--root", str(work), "--source-commit", commit, "--run-id", run_id,
                      "--runtime-kind", "local", "--output", str(provenance / "preflight.json")],
                      output / "logs/preflight.log", work, env)
    coverage = []
    for unit in sorted(plan["units"]):
        for fmt in ("latex", "html"):
            notebook = kept_notebook_path(work, unit)
            print(f"Fresh Mac portability execution ({threads} threads): {unit} ({fmt})", flush=True)
            log = output / "logs" / (unit.removesuffix(".qmd").replace("/", "--") + f"--{fmt}.log")
            evidence_dir = provenance / "paired-evidence" / Path(unit).with_suffix("") / fmt
            common.run_logged(common.execution_command(quarto, unit, fmt), log, work,
                              {**env, "DLBOOK_EXECUTION_UNIT": unit, "DLBOOK_EXECUTION_FORMAT": fmt,
                               "DLBOOK_PAIRED_EVIDENCE_DIR": str(evidence_dir)})
            coverage.append(record_execution(work, work / "_freeze", provenance, unit, fmt,
                                              log, notebook, plan["units"][unit]))
    write_json(provenance / "execution-coverage.json", build_coverage_manifest(
        provenance, plan, work / "_freeze", current["files_sha256"], coverage))
    checked = common.check_completed(work, work / "_freeze", plan, probes, current["files_sha256"])
    validate_portable_probes(probes, selection, env, source_tools.ENVIRONMENT_KEYS, threads)
    common.run_logged(wrapper + [str(work / "scripts/audit_date_study_stdout.py"),
                                "--freeze-root", str(work / "_freeze")],
                      output / "logs/date-study-semantics.log", work, env)
    evidence_manifest = provenance / "paired-evidence-manifest.json"
    common.run_logged(wrapper + [str(work / "scripts/audit_paired_evidence.py"),
                      "--source-root", str(work), "--evidence-root", str(provenance / "paired-evidence"),
                      "--output", str(evidence_manifest)], output / "logs/paired-evidence.log", work, env)
    shutil.copytree(work / "_freeze", output / "_freeze")
    common.run_logged(wrapper + [str(work / "scripts/freeze_provenance.py"), "capture", "--kind", "local",
                      "--root", str(work), "--source-commit", commit, "--freeze-root", str(output / "_freeze"),
                      "--source-before", str(provenance / "source-before.json"),
                      "--execution-plan", str(provenance / "execution-plan.json"),
                      "--output", str(provenance / "fingerprint.json"), "--run-id", run_id,
                      "--preflight", str(provenance / "preflight.json"),
                      "--execution-coverage-manifest", str(provenance / "execution-coverage.json"),
                      "--execution-probes", str(probes), "--paired-evidence-manifest", str(evidence_manifest)],
                      output / "logs/capture.log", work, env)
    return checked


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, required=True, help="Git repository used only to archive the exact commit")
    parser.add_argument("--source-before", type=Path, required=True, help="Authenticated clean source manifest from canonical preparation")
    parser.add_argument("--source-commit", required=True)
    parser.add_argument("--threads", type=int, choices=(1, 6), required=True)
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--python", type=Path, default=Path(DEFAULT_PYTHON))
    parser.add_argument("--quarto", default=shutil.which("quarto"))
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args(argv)
    if not re.fullmatch(r"[0-9a-f]{40}", args.source_commit):
        parser.error("--source-commit must be a full lowercase Git SHA")
    if not args.quarto or not args.python.is_file():
        parser.error("Explicit Python and Quarto executables must exist")
    # Keep the venv path, not its resolved base-interpreter symlink.
    python = args.python.absolute()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    if any(output.iterdir()):
        parser.error("--output must be a dedicated empty directory")
    provenance = output / "provenance"
    provenance.mkdir()
    status = {"passed": False, "runtime": "mac-portability", "canonical": False,
              "source_commit": args.source_commit, "run_id": args.run_id, "threads": args.threads,
              "promotion": "not performed", "started_utc": datetime.now(timezone.utc).isoformat(),
              "orchestrator_sha256": file_hash(Path(__file__)),
              "archive_helper_sha256": file_hash(Path(__file__).with_name("run_canonical_freeze.py"))}
    write_json(output / "status.json", status)
    try:
        before = json.loads(args.source_before.read_text())
        write_json(provenance / "source-before.json", before)
        archive = provenance / "source.tar"
        epoch = subprocess.check_output(["git", "show", "-s", "--format=%ct", args.source_commit],
                                        cwd=args.root, text=True).strip()
        if not re.fullmatch(r"[1-9][0-9]*", epoch):
            raise ValueError("Cannot resolve source commit timestamp")
        subprocess.run(["git", "archive", "--format=tar", "--output", str(archive), args.source_commit],
                       cwd=args.root, check=True)
        status.update({"source_date_epoch": epoch, "archive_sha256": file_hash(archive)})
        with tempfile.TemporaryDirectory(prefix="dlbook-mac-work-") as temporary, \
                tempfile.TemporaryDirectory(prefix="dlbook-mac-jupyter-") as isolated:
            work = Path(temporary)
            try:
                extract_source(archive, work)
                status["execution"] = execute_snapshot(work, output, before, args.source_commit, args.run_id,
                    python, args.quarto, Path(isolated), args.threads, epoch)
                status["passed"] = True
            finally:
                if (work / "_freeze").is_dir() and not (output / "_freeze").exists():
                    shutil.copytree(work / "_freeze", output / "_freeze")
    except (OSError, ValueError, RuntimeError, subprocess.CalledProcessError) as exc:
        status["error"] = str(exc)
        print(f"FAIL: {exc}", file=sys.stderr)
    finally:
        status["finished_utc"] = datetime.now(timezone.utc).isoformat()
        write_json(output / "status.json", status)
    if status["passed"]:
        print("Mac portability bundle complete. This is not canonical evidence or an approved tolerance change.")
    return 0 if status["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
