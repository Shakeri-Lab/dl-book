#!/usr/bin/env python3
"""Execute a clean source archive in the pinned image; never promote its results.

The host supplies a source manifest from a clean checkout and that exact commit's
Git archive. Each native QMD/format gets its own kernel, including a startup
observation. LaTeX execution produces genuine tex.json/PDF figures without TeX
compilation. A separate independent-run comparison is the promotion prerequisite.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import platform
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
from datetime import datetime, timezone

GENERATED_ROOTS = {".git", ".quarto", "_book", "_freeze", "build", ".venv"}


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n")


def file_hash(path: Path) -> str:
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def extract_source(archive: Path, destination: Path) -> None:
    """Reject escaping members and omit inherited outputs, even if tracked."""
    with tarfile.open(archive, "r:*") as source:
        members = []
        for member in source.getmembers():
            path = PurePosixPath(member.name)
            if path.is_absolute() or ".." in path.parts:
                raise ValueError(f"Unsafe source archive member: {member.name}")
            if path.parts and path.parts[0] in GENERATED_ROOTS:
                continue
            if member.issym() or member.islnk() or not (member.isfile() or member.isdir()):
                raise ValueError(f"Source archive contains a non-regular input: {member.name}")
            members.append(member)
        source.extractall(destination, members=members, filter="data")


def load_source_tools(work: Path):
    sys.path.insert(0, str(work / "scripts"))
    spec = importlib.util.spec_from_file_location("canonical_source_tools", work / "scripts/freeze_provenance.py")
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


def validate_source(before: dict, current: dict, commit: str) -> None:
    if before.get("dirty") is not False or before.get("commit") != commit:
        raise ValueError("The host must supply a verified clean manifest for this exact source commit")
    for key in ("commit", "files_sha256", "input_sha256"):
        if before.get(key) != current.get(key):
            raise ValueError(f"Extracted source differs from the clean host snapshot: {key}")


def validate_runtime(config: dict, installed: Path) -> None:
    import torch
    if platform.system() != "Linux" or platform.machine() not in {"x86_64", "amd64"}:
        raise ValueError("Canonical execution requires Linux/x86-64; portability runs use another entry point")
    if platform.python_version() != config["python"] or torch.__version__ != config["torch"]:
        raise ValueError("Python/Torch runtime differs from the pinned recipe")
    if torch.version.cuda is not None:
        raise ValueError("The canonical recipe requires the CPU-only PyTorch wheel")
    if not re.fullmatch(r"[1-9][0-9]*", os.environ.get("SOURCE_DATE_EPOCH", "")):
        raise ValueError("SOURCE_DATE_EPOCH must be the exact source commit timestamp")
    if json.loads(installed.read_text()) != config:
        raise ValueError("Source runtime recipe differs from the one installed in this image")
    for key, expected in config["environment"].items():
        if os.environ.get(key) != expected:
            raise ValueError(f"Canonical policy differs for {key}")
    if subprocess.check_output(["quarto", "--version"], text=True).strip() != config["quarto_version"]:
        raise ValueError("Quarto version differs from the pinned archive")


def run_logged(command: list[str], log: Path, work: Path, env: dict) -> None:
    log.parent.mkdir(parents=True, exist_ok=True)
    with log.open("w") as stream:
        result = subprocess.run(command, cwd=work, env=env, stdout=stream, stderr=subprocess.STDOUT)
    if result.returncode:
        raise RuntimeError(f"Command exited {result.returncode}; retained log: {log}")


def check_completed(work: Path, freeze: Path, plan: dict, probes: Path) -> dict:
    # Use the existing native-ordinal parser, never a tolerance comparison.
    sys.path.insert(0, str(work / "scripts"))
    from audit_frozen_stdout import stdout_records, native_execution_ordinals
    expected = {str(Path(unit).with_suffix("")) + f"/execute-results/{fmt}.json"
                for unit in plan["units"] for fmt in ("html", "tex")}
    actual = {p.relative_to(freeze).as_posix() for p in freeze.glob("**/execute-results/*.json")}
    if actual != expected:
        raise ValueError(f"Fresh freeze coverage differs; missing={sorted(expected-actual)}, extra={sorted(actual-expected)}")
    blocks = 0
    for unit, specification in plan["units"].items():
        records = []
        for fmt in ("html", "tex"):
            path = freeze / Path(unit).with_suffix("") / "execute-results" / f"{fmt}.json"
            raw = path.read_text()
            wanted = list(range(1, len(specification["native_cells_sha256"]) + 1))
            if native_execution_ordinals(raw) != wanted:
                raise ValueError(f"Executed native-cell coverage differs: {unit} ({fmt})")
            records.append(stdout_records(raw))
        if records[0] != records[1]:
            raise ValueError(f"HTML/LaTeX stdout is not byte-identical: {unit}")
        blocks += len(records[0])
    observed = []
    for path in probes.glob("*.json"):
        probe = json.loads(path.read_text())
        observed.append((probe.get("unit"), {"latex": "tex"}.get(probe.get("format"), probe.get("format"))))
    wanted_pairs = {(unit, fmt) for unit in plan["units"] for fmt in ("html", "tex")}
    if set(observed) != wanted_pairs or len(observed) != len(wanted_pairs):
        raise ValueError("Kernel startup probes do not cover exactly one fresh kernel per unit/format")
    return {"units": len(plan["units"]), "formats": 2, "stdout_blocks_per_format": blocks,
            "html_tex_stdout_identical": True, "independent_repeat_verified": False}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-archive", type=Path, required=True)
    parser.add_argument("--source-before", type=Path, required=True)
    parser.add_argument("--source-commit", required=True)
    parser.add_argument("--container-digest", required=True)
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if not re.fullmatch(r"[0-9a-f]{40}", args.source_commit):
        parser.error("--source-commit must be a full lowercase Git SHA")
    if not re.fullmatch(r"sha256:[0-9a-f]{64}", args.container_digest):
        parser.error("--container-digest must be the verified Docker image ID")
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    if any(output.iterdir()):
        parser.error("--output must be a dedicated empty directory")
    provenance = output / "provenance"
    provenance.mkdir()
    before = json.loads(args.source_before.read_text())
    write_json(provenance / "source-before.json", before)
    status = {"passed": False, "source_commit": args.source_commit, "run_id": args.run_id,
              "container_digest": args.container_digest, "archive_sha256": file_hash(args.source_archive),
              "started_utc": datetime.now(timezone.utc).isoformat(), "promotion": "not performed"}
    write_json(output / "status.json", status)
    installed = Path(__file__).resolve().parent
    try:
        with tempfile.TemporaryDirectory(prefix="dlbook-canonical-") as temporary:
            work = Path(temporary)
            try:
                extract_source(args.source_archive, work)
                config = json.loads((work / "container/canonical-runtime.json").read_text())
                validate_runtime(config, installed / "canonical-runtime.json")
                source_tools = load_source_tools(work)
                current = source_tools.source_fingerprint(work, args.source_commit)
                validate_source(before, current, args.source_commit)
                plan = source_tools.execution_plan(work, current)
                write_json(provenance / "execution-plan.json", plan)
                shutil.copy2(installed / "wheel-install-report.json", provenance / "wheel-install-report.json")
                shutil.copy2(installed / "canonical-runtime.json", provenance / "canonical-runtime.json")
                probes = provenance / "kernel-startup"
                env = {**os.environ, "DLBOOK_KERNEL_PROBE_DIR": str(probes),
                       "PYTHONPATH": str(work / "code")}
                for unit in sorted(plan["units"]):
                    for fmt in ("latex", "html"):
                        print(f"Fresh canonical execution: {unit} ({fmt})", flush=True)
                        log = output / "logs" / (unit.removesuffix(".qmd").replace("/", "--") + f"--{fmt}.log")
                        run_logged(["quarto", "render", unit, "--to", fmt, "--no-clean", "--execute-daemon", "0"],
                                   log, work, {**env, "DLBOOK_EXECUTION_UNIT": unit, "DLBOOK_EXECUTION_FORMAT": fmt})
                status["execution"] = check_completed(work, work / "_freeze", plan, probes)
                run_logged([sys.executable, str(installed / "canonical_python.py"),
                            str(work / "scripts/audit_date_study_stdout.py"),
                            "--freeze-root", str(work / "_freeze")],
                           output / "logs/date-study-semantics.log", work, env)
                shutil.copytree(work / "_freeze", output / "_freeze")
                capture = [sys.executable, str(installed / "canonical_python.py"),
                           str(work / "scripts/freeze_provenance.py"), "capture",
                           "--root", str(work), "--source-commit", args.source_commit,
                           "--freeze-root", str(output / "_freeze"),
                           "--source-before", str(provenance / "source-before.json"),
                           "--execution-plan", str(provenance / "execution-plan.json"),
                           "--output", str(provenance / "fingerprint.json"),
                           "--recipe", "container/Dockerfile", "--lock", "container/requirements-linux-amd64.lock",
                           "--container-digest", args.container_digest,
                           "--base-image-digest", config["base_image_digest"], "--run-id", args.run_id,
                           "--execution-probes", str(probes)]
                run_logged(capture, output / "logs/capture.log", work, env)
                status["passed"] = True
            finally:
                # Preserve failure evidence before the fresh workspace disappears.
                if (work / "_freeze").is_dir() and not (output / "_freeze").exists():
                    shutil.copytree(work / "_freeze", output / "_freeze")
    except (OSError, ValueError, RuntimeError, subprocess.CalledProcessError) as exc:
        status["error"] = str(exc)
        print(f"FAIL: {exc}", file=sys.stderr)
    finally:
        status["finished_utc"] = datetime.now(timezone.utc).isoformat()
        write_json(output / "status.json", status)
    if status["passed"]:
        print("Candidate complete; a second independent same-image run must still match before promotion.")
    return 0 if status["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
