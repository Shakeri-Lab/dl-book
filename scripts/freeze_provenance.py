#!/usr/bin/env python3
"""Capture auditable inputs and runtime observations beside a Quarto freeze.

The fingerprint binds an execution to its source, immutable image, wheel lock,
and resulting files. It is evidence, not a claim that ISA flags make PyTorch
cross-platform deterministic. Environment capture is deliberately allowlisted.
"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import platform
import re
import subprocess
import sys
import sysconfig
from typing import Any

SCHEMA_VERSION = 1
ENVIRONMENT_KEYS = (
    "OMP_NUM_THREADS", "OMP_DYNAMIC", "OMP_THREAD_LIMIT", "OMP_PROC_BIND",
    "OMP_PLACES", "MKL_NUM_THREADS", "MKL_DYNAMIC", "MKL_CBWR", "MKL_ENABLE_INSTRUCTIONS",
    "MKL_THREADING_LAYER", "KMP_DETERMINISTIC_REDUCTION", "KMP_AFFINITY",
    "OPENBLAS_NUM_THREADS", "VECLIB_MAXIMUM_THREADS", "NUMEXPR_NUM_THREADS",
    "ONEDNN_MAX_CPU_ISA", "DNNL_MAX_CPU_ISA", "ATEN_CPU_CAPABILITY",
    "ONEDNN_DEFAULT_FPMATH_MODE", "DNNL_DEFAULT_FPMATH_MODE",
    "DLBOOK_TORCH_NUM_THREADS", "DLBOOK_TORCH_INTEROP_THREADS",
    "PYTHONHASHSEED", "CUDA_VISIBLE_DEVICES",
    "CUBLAS_WORKSPACE_CONFIG", "SOURCE_DATE_EPOCH", "TZ", "LC_ALL", "LANG",
)
CI_KEYS = (
    "GITHUB_RUN_ID", "GITHUB_RUN_ATTEMPT", "GITHUB_JOB", "GITHUB_WORKFLOW",
    "GITHUB_SHA", "GITHUB_REF", "GITHUB_REPOSITORY", "RUNNER_OS", "RUNNER_ARCH",
)
INPUT_ROOTS = {
    "chapters", "code", "data", "figures", "scripts", "filters", "tex",
    "container", "parts", "docs", ".github", "experiments",
}
EXCLUDED_ROOTS = {"_freeze", "_book", ".git", ".quarto", "build", ".venv"}
EXCLUDED_SUFFIXES = {".pyc", ".aux", ".log", ".fls", ".fdb_latexmk"}


def sha256(path: Path) -> str:
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def json_digest(value: Any) -> str:
    return hashlib.sha256(json.dumps(
        value, sort_keys=True, separators=(",", ":"), ensure_ascii=True,
    ).encode()).hexdigest()


def write_json(path: Path, document: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(document, indent=2, sort_keys=True) + "\n")


def _command(args: list[str], *, cwd: Path | None = None) -> str:
    return subprocess.check_output(args, cwd=cwd, text=True, stderr=subprocess.DEVNULL).strip()


def _safe_source_name(name: str) -> bool:
    path = Path(name)
    return bool(path.parts) and not (
        path.is_absolute() or ".." in path.parts
        or path.parts[0] in EXCLUDED_ROOTS
        or "__pycache__" in path.parts or ".ipynb_checkpoints" in path.parts
        or any(part.endswith("_files") for part in path.parts)
        or path.suffix in EXCLUDED_SUFFIXES
        or name.endswith(".quarto_ipynb")
        or name.endswith((".html.md", ".pdf.md"))
        or (path.parts[0] == "chapters" and path.suffix == ".html")
        or (len(path.parts) == 1 and (name in {
            "index.html", "index.tex", "index.toc", "index.out", "index.fls",
        } or name.startswith("Deep-Learning--Making-It-Learnable") and path.suffix == ".tex"))
    )


def _is_input_name(name: str) -> bool:
    relative = Path(name)
    return _safe_source_name(name) and (
        relative.parts[0] in INPUT_ROOTS or len(relative.parts) == 1
    )


def source_fingerprint(root: Path, source_commit: str | None = None) -> dict[str, Any]:
    """Hash current inputs, including in-scope untracked files, never freeze outputs.

    Gitless container snapshots use the same explicit input-root policy. The
    caller supplies their source commit; a missing commit is never invented.
    """
    root = root.resolve()
    try:
        names = _command([
            "git", "ls-files", "--cached", "--others", "--exclude-standard", "-z",
        ], cwd=root).split("\0")
        commit = _command(["git", "rev-parse", "HEAD"], cwd=root)
        changed = _command(["git", "diff", "--name-only", "HEAD", "-z"], cwd=root).split("\0")
        new = _command(["git", "ls-files", "--others", "--exclude-standard", "-z"], cwd=root).split("\0")
        dirty: bool | None = any(_is_input_name(name) for name in filter(None, changed + new))
    except (subprocess.CalledProcessError, FileNotFoundError):
        names = [path.relative_to(root).as_posix() for path in root.rglob("*") if path.is_file()]
        commit, dirty = source_commit, None
    if source_commit and commit != source_commit:
        raise ValueError("Requested source commit differs from the checkout")
    if not re.fullmatch(r"[0-9a-f]{40}", str(commit or "")):
        raise ValueError("A full source commit is required, including for gitless snapshots")
    files = {}
    for name in sorted(set(filter(None, names))):
        relative = Path(name)
        if not _is_input_name(name):
            continue
        path = root / relative
        if not path.exists():
            continue  # A tracked deletion changes the inventory.
        if not path.is_file() or not path.resolve().is_relative_to(root):
            raise ValueError(f"Unsafe source input: {name}")
        if path.name.startswith(".env") or path.suffix in {".pem", ".key"}:
            raise ValueError(f"Secret-like file must not be a book input: {name}")
        files[name] = sha256(path)
    if not files:
        raise ValueError("Source input inventory is empty")
    return {"commit": commit, "dirty": dirty, "files_sha256": files,
            "input_sha256": json_digest(files)}


def cpu_observation() -> dict[str, Any]:
    result: dict[str, Any] = {"machine": platform.machine(), "system": platform.system(),
                              "release": platform.release(), "logical_cpus": os.cpu_count()}
    cpuinfo = Path("/proc/cpuinfo")
    if cpuinfo.is_file():
        records = []
        for block in cpuinfo.read_text().strip().split("\n\n"):
            fields = dict(line.split(":", 1) for line in block.splitlines() if ":" in line)
            fields = {key.strip(): value.strip() for key, value in fields.items()}
            records.append({"vendor": fields.get("vendor_id", fields.get("CPU implementer")),
                            "model": fields.get("model name", fields.get("CPU part")),
                            "flags": sorted(fields.get("flags", fields.get("Features", "")).split())})
        result["processors"] = list({json_digest(record): record for record in records}.values())
    elif platform.system() == "Darwin":
        def sysctl(name: str) -> str | None:
            try:
                return _command(["sysctl", "-n", name])
            except subprocess.CalledProcessError:
                return None
        result["processors"] = [{"vendor": sysctl("machdep.cpu.vendor"),
                                  "model": sysctl("machdep.cpu.brand_string"),
                                  "flags": sorted((sysctl("machdep.cpu.features") or "").split())}]
    else:
        result["processors"] = [{"vendor": None, "model": platform.processor(), "flags": []}]
    return result


def execution_plan(root: Path, source: dict[str, Any]) -> dict[str, Any]:
    """Bind the complete executable QMD inventory before any execution starts."""
    from audit_python_sources import FENCE_RE, INCLUDE_RE

    units = {}
    for name, digest in source["files_sha256"].items():
        if not name.endswith(".qmd"):
            continue
        text = (root / name).read_text()
        native = [hashlib.sha256(match.group(2).encode()).hexdigest()
                  for match in FENCE_RE.finditer(text)]
        includes = {}
        for include in INCLUDE_RE.findall(text):
            path = (root / name).parent / include
            if not path.is_file():
                path = root / include
            if not path.is_file() or not path.resolve().is_relative_to(root.resolve()):
                raise ValueError(f"Missing or unsafe included source: {name}: {include}")
            relative = path.resolve().relative_to(root.resolve()).as_posix()
            if source["files_sha256"].get(relative) != sha256(path):
                raise ValueError(f"Included source not bound by input inventory: {relative}")
            includes[relative] = sha256(path)
        if native:
            units[name] = {"source_sha256": digest, "native_cells_sha256": native,
                           "included_sources_sha256": includes}
        elif includes:
            raise ValueError(f"Included code has no executed native harness: {name}")
    if not units:
        raise ValueError("Execution plan has no executable QMD units")
    return {"schema_version": 1, "source_commit": source["commit"],
            "source_input_sha256": source["input_sha256"],
            "formats": ["html", "tex"], "units": units}


def runtime_observation() -> dict[str, Any]:
    """Observe this probe process; executed-kernel observations are stored separately."""
    import numpy  # noqa: F401 -- load the numerical libraries before observing them
    import torch
    from threadpoolctl import threadpool_info

    libraries = []
    for library in threadpool_info():
        path = Path(library["filepath"])
        libraries.append({**library, "binary_sha256": sha256(path)})
    packages = sorted(
        ({"name": re.sub(r"[-_.]+", "-", item.metadata["Name"]).lower(),
          "version": item.version} for item in importlib.metadata.distributions()),
        key=lambda item: (item["name"], item["version"]),
    )
    return {
        "scope": "fingerprint probe process, not an inference about executed kernels",
        "python": {"version": platform.python_version(), "full_version": sys.version,
                   "implementation": platform.python_implementation(),
                   "soabi": sysconfig.get_config_var("SOABI"), "executable": sys.executable},
        "packages": packages,
        "torch": {"version": torch.__version__, "config": torch.__config__.show(),
                  "num_threads": torch.get_num_threads(),
                  "num_interop_threads": torch.get_num_interop_threads()},
        "loaded_libraries": libraries,
        "environment": {key: os.environ.get(key) for key in ENVIRONMENT_KEYS},
    }


def freeze_inventory(freeze_root: Path) -> dict[str, str]:
    files = {}
    for path in sorted(freeze_root.rglob("*")):
        if not path.is_file() or path.name == "provenance.json":
            continue
        if not path.resolve().is_relative_to(freeze_root.resolve()):
            raise ValueError(f"Freeze file escapes its artifact root: {path}")
        files[path.relative_to(freeze_root).as_posix()] = sha256(path)
    if not any(name.endswith("/execute-results/html.json") for name in files):
        raise ValueError("Freeze has no HTML execution results")
    return files


def load_execution_probes(path: Path) -> list[dict[str, Any]]:
    paths = sorted(path.glob("*.json")) if path.is_dir() else [path]
    if not paths:
        raise ValueError("No executed-kernel probes were produced")
    return [{"artifact": item.name, "sha256": sha256(item),
             "observation": json.loads(item.read_text())} for item in paths]


def capture(args: argparse.Namespace) -> dict[str, Any]:
    root = args.root.resolve()
    source = source_fingerprint(root, args.source_commit)
    if args.source_before:
        before = json.loads(args.source_before.read_text())
        if before.get("commit") != source["commit"] or before["files_sha256"] != source["files_sha256"]:
            raise ValueError("Source/input inventory changed during execution")
    def input_record(name: str) -> dict[str, str]:
        path = root / name
        if not path.is_file() or not path.resolve().is_relative_to(root):
            raise ValueError(f"Missing or unsafe recipe/lock: {name}")
        return {"path": name, "sha256": sha256(path)}
    if args.kind == "canonical":
        for label, digest in (("container", args.container_digest), ("base image", args.base_image_digest)):
            if not re.fullmatch(r"(?:[^\s]+@)?sha256:[0-9a-f]{64}", digest or ""):
                raise ValueError(f"Canonical capture requires immutable {label} digest")
        if not args.execution_probes:
            raise ValueError("Canonical capture requires executed-kernel probes")
        if source["dirty"] is True:
            raise ValueError("Canonical capture rejects a dirty source checkout")
        if not args.source_before or not args.execution_plan:
            raise ValueError("Canonical capture requires pre-execution source and coverage plans")
        before = json.loads(args.source_before.read_text())
        if before.get("dirty") is not False:
            raise ValueError("Canonical pre-execution source must be verified clean")
        if source["dirty"] is None:
            # A gitless copy is authenticated by its clean parent snapshot.
            source["dirty"] = False
        if platform.system() != "Linux" or platform.machine() not in {"x86_64", "amd64"}:
            raise ValueError("Canonical capture requires Linux x86_64")
    plan = json.loads(args.execution_plan.read_text()) if args.execution_plan else None
    if plan is not None and plan != execution_plan(root, source):
        raise ValueError("Execution plan no longer matches source/input inventory")
    paired = None
    paired_manifest = getattr(args, "paired_evidence_manifest", None)
    if "docs/paired-evidence-plan.json" in source["files_sha256"]:
        if not paired_manifest:
            raise ValueError("Source declares paired evidence but no validated manifest was supplied")
        from audit_paired_evidence import audit_evidence
        recorded = json.loads(paired_manifest.read_text())
        verified = audit_evidence(paired_manifest.parent / "paired-evidence", root,
                                  root / "docs/paired-evidence-plan.json")
        if recorded != verified:
            raise ValueError("Paired evidence manifest differs from the observed source/sidecars")
        paired = {"manifest_sha256": sha256(paired_manifest), "manifest": verified}
    return {
        "schema_version": SCHEMA_VERSION, "kind": args.kind,
        "created_utc": datetime.now(timezone.utc).isoformat(),
        "run": {"id": args.run_id, "ci": {key: os.environ.get(key) for key in CI_KEYS}},
        "source": source,
        "container": {"digest": args.container_digest, "base_digest": args.base_image_digest,
                      "recipe": input_record(args.recipe), "wheel_lock": input_record(args.lock)},
        "runtime": runtime_observation(), "cpu": cpu_observation(),
        "execution_plan": plan,
        "execution_probes": load_execution_probes(args.execution_probes) if args.execution_probes else [],
        "paired_evidence": paired,
        "freeze_files_sha256": freeze_inventory(args.freeze_root),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    source = commands.add_parser("source", help="Snapshot input hashes before execution")
    source.add_argument("--root", type=Path, default=Path("."))
    source.add_argument("--source-commit")
    source.add_argument("--output", type=Path, required=True)
    plan = commands.add_parser("plan", help="Bind executable coverage before execution")
    plan.add_argument("--root", type=Path, default=Path("."))
    plan.add_argument("--source-commit")
    plan.add_argument("--output", type=Path, required=True)
    run = commands.add_parser("capture", help="Capture completed-run provenance")
    run.add_argument("--root", type=Path, default=Path("."))
    run.add_argument("--freeze-root", type=Path, required=True)
    run.add_argument("--output", type=Path, required=True)
    run.add_argument("--kind", choices=("canonical", "local"), default="canonical")
    run.add_argument("--source-commit")
    run.add_argument("--source-before", type=Path)
    run.add_argument("--recipe", default="container/Dockerfile")
    run.add_argument("--lock", default="container/requirements-linux-amd64.lock")
    run.add_argument("--container-digest")
    run.add_argument("--base-image-digest")
    run.add_argument("--run-id", required=True)
    run.add_argument("--execution-probes", type=Path)
    run.add_argument("--execution-plan", type=Path)
    run.add_argument("--paired-evidence-manifest", type=Path)
    args = parser.parse_args()
    try:
        if args.command in {"source", "plan"}:
            document = source_fingerprint(args.root, args.source_commit)
            if args.command == "plan":
                document = execution_plan(args.root, document)
        else:
            document = capture(args)
        write_json(args.output, document)
    except (ValueError, OSError, KeyError, subprocess.CalledProcessError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1
    print(f"Recorded {args.command} provenance: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
