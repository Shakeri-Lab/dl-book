#!/usr/bin/env python3
"""Finite, read-only saved-image dispatch diagnostic; never a canonical gate."""
from __future__ import annotations

import argparse
import ast
import contextlib
import hashlib
import io
import json
import os
from pathlib import Path
import subprocess
import sys

import probe_lstsq_repeatability as shared  # Stdlib-only until a worker starts.

POLICIES = {
    "baseline": {}, "aten-avx2": {"ATEN_CPU_CAPABILITY": "avx2"},
    "openblas-haswell": {"OPENBLAS_CORETYPE": "Haswell"},
    "both": {"ATEN_CPU_CAPABILITY": "avx2", "OPENBLAS_CORETYPE": "Haswell"},
    "compatible": {"ATEN_CPU_CAPABILITY": "avx2", "OPENBLAS_CORETYPE": "Haswell", "MKL_CBWR": "COMPATIBLE"},
    "compatible-numpy": {"ATEN_CPU_CAPABILITY": "avx2", "OPENBLAS_CORETYPE": "Haswell", "MKL_CBWR": "COMPATIBLE",
                         "NPY_DISABLE_CPU_FEATURES": "X86_V4,AVX512_ICL,AVX512_SPR"},
}
OPTIONAL_OVERRIDES = ("ATEN_CPU_CAPABILITY", "OPENBLAS_CORETYPE", "NPY_DISABLE_CPU_FEATURES")
SOURCE = "chapters/part1/01-linear-regression.qmd"
LABELS = ("setup", "synthetic-data", "closed-form")
LIMITATION = ("Finite observations on the recorded host/image, not a cross-host guarantee or a canonical "
              "admission decision. Policy differences identify witnesses, not a universal cause. The NumPy "
              "disable policy uses groups observed in the saved NumPy2.5.1 wheel; runtime dispatch is retained.")


def write(path: Path, document) -> None:
    shared.write_json(path, document)
    path.chmod(0o644)


def environment(policy: str) -> dict:
    env = {**os.environ, **shared.POLICY, "MKL_CBWR": "AVX2", "MPLBACKEND": "Agg"}
    for key in OPTIONAL_OVERRIDES:
        env.pop(key, None)
    return {**env, **POLICIES[policy]}


def source_spec(root: Path) -> dict:
    cells = {label: shared.labeled_cell((root / SOURCE).read_text(), label) for label in LABELS}
    return {"source_file": SOURCE, "source_sha256": shared.digest(root / SOURCE), "cells": cells,
            "ast_sha256": {label: hashlib.sha256(ast.dump(ast.parse(code)).encode()).hexdigest()
                           for label, code in cells.items()}}


def array_record(value) -> dict:
    raw = value.tobytes(order="C")
    return {"dtype": str(value.dtype), "shape": list(value.shape), "byte_order": sys.byteorder,
            "bytes_hex": raw.hex(), "sha256": hashlib.sha256(raw).hexdigest(), "values": value.tolist()}


def runtime(torch, np) -> dict:
    result = shared.runtime_record(torch)
    result["torch"]["cpu_capability"] = torch.backends.cpu.get_cpu_capability()
    result["environment"]["NPY_DISABLE_CPU_FEATURES"] = os.environ.get("NPY_DISABLE_CPU_FEATURES")
    stream = io.StringIO()
    with contextlib.redirect_stdout(stream):
        np.show_runtime()
    result["numpy_show_runtime"] = stream.getvalue()
    introspection = getattr(getattr(np.lib, "introspect", None), "opt_func_info", None)
    try:
        result["numpy_opt_func_info"] = introspection() if introspection else {"available": False}
    except Exception as error:
        result["numpy_opt_func_info"] = {"available": False, "error": repr(error)}
    return result


def worker(policy: str, spec: dict, output: Path) -> dict:
    import torch
    import numpy as np
    torch.set_num_threads(1)
    torch.set_num_interop_threads(1)
    state = {"schema_version": 1, "policy": policy, "status": "running",
             "promotion_eligible": False, "runtime_before": runtime(torch, np), "inputs": {}, "outputs": {}}
    write(output.with_suffix(".preflight.json"), state)
    def record(group, name, value):
        state[group][name] = shared.tensor_record(value) if isinstance(value, torch.Tensor) else array_record(value)
    try:
        for name in ("float32", "float64"):
            dtype = getattr(torch, name)
            x = torch.arange(-128, 128, dtype=dtype) / 32
            A = torch.arange(64, dtype=dtype).reshape(8, 8) / 64 + torch.eye(8, dtype=dtype) / 4
            target = torch.arange(8, dtype=dtype) / 8
            w = (torch.arange(8, dtype=dtype) / 32).requires_grad_()
            for label, value in (("x", x), ("A", A), ("target", target), ("initial_w", w)):
                record("inputs", f"torch/{name}/{label}", value)
            for label, value in (("exp", x.exp()), ("sigmoid", x.sigmoid()), ("tanh", x.tanh()), ("sum", x.sum()),
                                 ("mean", x.mean()), ("square_sum", x.square().sum()), ("matmul", A @ A.T)):
                record("outputs", f"torch/{name}/{label}", value)
            loss = ((A @ w).sigmoid() - target).square().mean()
            loss.backward()
            for label, value in (("autograd_loss", loss), ("gradient", w.grad), ("updated_w", w - .05 * w.grad)):
                record("outputs", f"torch/{name}/{label}", value)
            torch.manual_seed(6050)
            record("outputs", f"torch/{name}/seed6050_randn", torch.randn(128, dtype=dtype))
            record("outputs", f"torch/{name}/seed6050_uniform_after_randn", torch.rand(128, dtype=dtype))
            nx, nA = x.detach().numpy().copy(), A.detach().numpy().copy()
            record("inputs", f"numpy/{name}/x", nx)
            record("inputs", f"numpy/{name}/A", nA)
            for label, value in (("exp", np.exp(nx)), ("sin", np.sin(nx)), ("sum", np.sum(nx)),
                                 ("matmul", nA @ nA.T)):
                record("outputs", f"numpy/{name}/{label}", value)
            for label, value in zip(("svd_U", "svd_s", "svd_Vh"), np.linalg.svd(nA)):
                record("outputs", f"numpy/{name}/{label}", value)
        namespace, printed = {}, io.StringIO()
        with contextlib.redirect_stdout(printed):
            for label in LABELS:
                code = spec["cells"][label]
                actual = hashlib.sha256(ast.dump(ast.parse(code)).encode()).hexdigest()
                if actual != spec["ast_sha256"][label]:
                    raise ValueError("Original Chapter 1 cell changed")
                exec(compile(code, spec["source_file"], "exec"), namespace)
        for name in ("X_aug", "y"):
            record("inputs", f"chapter1/{name}", namespace[name])
        prediction = namespace["X_aug"] @ namespace["w_ols"]
        for name, value in (("solution", namespace["w_ols"]), ("prediction", prediction),
                            ("mse", (prediction - namespace["y"]).square().mean())):
            record("outputs", f"chapter1/{name}", value)
        state.update(status="completed", chapter1_stdout=printed.getvalue(), runtime_after=runtime(torch, np))
        return state
    except Exception as error:
        state.update(status="failed", error=repr(error))
        raise
    finally:
        write(output, state)


def summarize(workers: list[dict], processes: int) -> dict:
    grouped = {policy: [w for w in workers if w["policy"] == policy] for policy in POLICIES}
    if len(workers) != len(POLICIES) * processes or any(len(rows) != processes for rows in grouped.values()):
        raise ValueError("Incomplete policy/process inventory")
    expected_keys = {group: set(workers[0][group]) for group in ("inputs", "outputs")}
    for row in workers:
        if row["status"] != "completed":
            raise ValueError("A worker did not complete")
        for phase in ("runtime_before", "runtime_after"):
            observed = row[phase]
            if any(observed["torch"][key] != 1 for key in ("num_threads", "num_interop_threads")):
                raise ValueError("Actual thread policy is not 1/1")
            if any(observed["environment"].get(key) != value
                   for key, value in {**shared.POLICY, "MKL_CBWR": "AVX2", **POLICIES[row["policy"]]}.items()):
                raise ValueError("Observed fixed base environment differs from declared policy")
            for key in OPTIONAL_OVERRIDES:
                if observed["environment"].get(key) != POLICIES[row["policy"]].get(key):
                    raise ValueError("Observed dispatch override differs from declared policy")
            if (observed.get("machine", {}).get("machine") in ("x86_64", "amd64")
                    and POLICIES[row["policy"]].get("ATEN_CPU_CAPABILITY") == "avx2"
                    and observed["torch"]["cpu_capability"].upper() != "AVX2"):
                raise ValueError("Requested x86 Torch AVX2 capability was not observed")
        for group, keys in expected_keys.items():
            if set(row[group]) != keys or not keys:
                raise ValueError("Incomplete case inventory")
            for record in row[group].values():
                if hashlib.sha256(bytes.fromhex(record["bytes_hex"])).hexdigest() != record["sha256"]:
                    raise ValueError("Raw byte/hash mismatch")
    result = {"schema_version": 1, "promotion_eligible": False, "completed": True, "limitation": LIMITATION,
              "processes_per_policy": processes, "policies": {}, "input_variants_across_policies": {}}
    for name in sorted(expected_keys["inputs"]):
        result["input_variants_across_policies"][name] = len({row["inputs"][name]["sha256"] for row in workers})
    for policy, rows in grouped.items():
        result["policies"][policy] = {
            "observed_torch_capabilities": sorted({r["runtime_after"]["torch"]["cpu_capability"] for r in rows}),
            "within_policy_differences": {group: [name for name in sorted(keys)
                if len({row[group][name]["sha256"] for row in rows}) > 1] for group, keys in expected_keys.items()},
            "outputs_differing_from_baseline": [name for name in sorted(expected_keys["outputs"])
                if {r["outputs"][name]["sha256"] for r in rows} !=
                   {r["outputs"][name]["sha256"] for r in grouped["baseline"]}],
        }
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--worker", choices=POLICIES)
    parser.add_argument("--case-spec", type=Path)
    parser.add_argument("--processes", type=int, default=2)
    parser.add_argument("--output", type=Path, required=True)
    for key in ("original-source-root", "image-artifact-dir", "diagnostic-root"):
        parser.add_argument("--" + key, type=Path)
    for key in ("original-source-commit", "image-id", "image-run-id", "diagnostic-commit"):
        parser.add_argument("--" + key)
    args = parser.parse_args()
    os.umask(0o022)
    if args.output.exists() or args.output.is_symlink():
        parser.error("Use a new output path; existing evidence must not be overwritten")
    if args.worker:
        if not args.case_spec:
            parser.error("Worker needs --case-spec")
        worker(args.worker, json.loads(args.case_spec.read_text()), args.output)
        return 0
    if args.processes != 2:
        parser.error("This bounded protocol requires exactly two fresh processes per policy")
    for key in ("original_source_root", "image_artifact_dir", "diagnostic_root", "original_source_commit",
                "image_id", "image_run_id", "diagnostic_commit"):
        if getattr(args, key) is None:
            parser.error(f"Missing --{key.replace('_', '-')}")
    args.output.mkdir(parents=True, mode=0o755)
    args.output.chmod(0o755)
    try:
        args.repeats = 1  # Compatibility with the reused stdlib image-identity helper only.
        identity = shared.provenance(args)
        identity["diagnostic"]["files_sha256"]["scripts/probe_runtime_dispatch.py"] = shared.digest(Path(__file__))
        if shared.digest(Path(__file__)) != shared.digest(args.diagnostic_root / "scripts/probe_runtime_dispatch.py"):
            raise ValueError("Executed diagnostic source differs from declared source")
        identity.update(protocol={"policies": POLICIES, "processes_per_policy": 2,
                                  "fixed_base_policy": {**shared.POLICY, "MKL_CBWR": "AVX2"},
                                  "chapter1_labels": LABELS}, limitation=LIMITATION)
        write(args.output / "provenance.json", identity)
        original_manifest = args.output / "original-image.json"
        original_manifest.write_bytes((args.image_artifact_dir / "image.json").read_bytes())
        original_manifest.chmod(0o644)
        spec_path = args.output / "case-spec.json"
        write(spec_path, source_spec(args.original_source_root))
        workers = []
        for policy in POLICIES:
            for repeat in range(2):
                output = args.output / f"{policy}-{repeat}.json"
                log = output.with_suffix(".log")
                with log.open("w") as stream:
                    subprocess.run([sys.executable, str(Path(__file__).resolve()), "--worker", policy,
                                    "--case-spec", str(spec_path.resolve()), "--output", str(output.resolve())],
                                   env=environment(policy), stdout=stream, stderr=subprocess.STDOUT, check=True, timeout=60)
                workers.append(json.loads(output.read_text()))
                print(f"Completed {policy} process {repeat + 1}/2", flush=True)
        report = summarize(workers, 2)
        report["evidence_sha256"] = {p.name: shared.digest(p) for p in args.output.iterdir() if p.is_file()}
        write(args.output / "report.json", report)
        lines = ["# Saved-image dispatch diagnostic", "", LIMITATION, "",
                 "| Policy | Torch capability | Within-policy differing outputs | Differences from baseline |",
                 "|---|---|---:|---:|"]
        for policy, row in report["policies"].items():
            lines.append(f"| {policy} | {', '.join(row['observed_torch_capabilities'])} | "
                         f"{len(row['within_policy_differences']['outputs'])} | {len(row['outputs_differing_from_baseline'])} |")
        lines += ["", "Input cases differing across policies: " + ", ".join(
            name for name, count in report["input_variants_across_policies"].items() if count > 1),
            "", "Inspect raw values, input hashes, NumPy runtime/ufunc dispatch, and loaded-library details before attributing any difference.", ""]
        (args.output / "summary.md").write_text("\n".join(lines))
        return 0
    except Exception as error:
        write(args.output / "failure.json", {"completed": False, "promotion_eligible": False, "error": repr(error)})
        raise


if __name__ == "__main__":
    raise SystemExit(main())
