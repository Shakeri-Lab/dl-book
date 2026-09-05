#!/usr/bin/env python3
"""Finite, read-only saved-image dispatch diagnostic; never a canonical gate."""
from __future__ import annotations

import argparse
import ast
import contextlib
import hashlib
import io
import json
import math
import os
from pathlib import Path
import re
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
FORWARD_SOURCE = "chapters/part5/19-generative.qmd"
FORWARD_LABELS = ("generative-setup", "forward-diffusion-audit")
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


def selected_policies(forward_only: bool) -> tuple[str, ...]:
    return ("compatible-numpy",) if forward_only else tuple(POLICIES)


def source_spec(root: Path) -> dict:
    cells = {label: shared.labeled_cell((root / SOURCE).read_text(), label) for label in LABELS}
    forward = {label: shared.labeled_cell((root / FORWARD_SOURCE).read_text(), label) for label in FORWARD_LABELS}
    return {"source_file": SOURCE, "source_sha256": shared.digest(root / SOURCE), "cells": cells,
            "ast_sha256": {label: hashlib.sha256(ast.dump(ast.parse(code)).encode()).hexdigest()
                           for label, code in cells.items()},
            "forward": {"source_file": FORWARD_SOURCE, "source_sha256": shared.digest(root / FORWARD_SOURCE),
                        "cells": forward, "ast_sha256": {
                            label: hashlib.sha256(ast.dump(ast.parse(code)).encode()).hexdigest()
                            for label, code in forward.items()}}}


def array_record(value) -> dict:
    raw = value.tobytes(order="C")
    return {"dtype": str(value.dtype), "shape": list(value.shape), "byte_order": sys.byteorder,
            "bytes_hex": raw.hex(), "sha256": hashlib.sha256(raw).hexdigest(), "values": value.tolist()}


def tensor_hash(value) -> dict:
    """Explicitly hash-only: large RNG/state tensors are not exported as JSON arrays."""
    raw = value.detach().cpu().contiguous().numpy().tobytes()
    return {"hash_only": True, "dtype": str(value.dtype), "shape": list(value.shape),
            "byte_order": sys.byteorder, "nbytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest()}


def validate_record(record: dict) -> None:
    if record.get("hash_only"):
        sizes = {"torch.float64": 8, "torch.float32": 4, "torch.uint8": 1}
        shape = record.get("shape")
        if (set(record) != {"hash_only", "dtype", "shape", "byte_order", "nbytes", "sha256"}
                or record["hash_only"] is not True or record.get("dtype") not in sizes
                or not isinstance(shape, list) or any(type(n) is not int or n < 0 for n in shape)
                or record.get("byte_order") not in ("little", "big")
                or record.get("nbytes") != math.prod(shape) * sizes.get(record.get("dtype"), 0)
                or not re.fullmatch(r"[0-9a-f]{64}", record.get("sha256", ""))):
            raise ValueError("Invalid explicit hash-only tensor record")
    elif hashlib.sha256(bytes.fromhex(record["bytes_hex"])).hexdigest() != record["sha256"]:
        raise ValueError("Raw byte/hash mismatch")


def checked_ast(spec: dict, label: str) -> ast.Module:
    tree = ast.parse(spec["cells"][label])
    if hashlib.sha256(ast.dump(tree).encode()).hexdigest() != spec["ast_sha256"][label]:
        raise ValueError("Original authored cell changed")
    return tree


def forward_study(spec: dict, state: dict) -> None:
    """Execute untouched authored cells first; observations/control run only afterwards."""
    import torch
    trees = {label: checked_ast(spec, label) for label in FORWARD_LABELS}
    namespace, printed = {}, io.StringIO()
    with contextlib.redirect_stdout(printed):
        for label in FORWARD_LABELS:
            exec(compile(spec["cells"][label], spec["source_file"], "exec"), namespace)
    state["chapter19_stdout"] = printed.getvalue()
    state["forward_source"] = {key: spec[key] for key in ("source_file", "source_sha256", "ast_sha256")}
    state["forward_default_dtype"] = str(torch.get_default_dtype())
    rng_after_authored = torch.get_rng_state().clone()
    state["inputs"]["rng/after_authored_cell"] = tensor_hash(rng_after_authored)
    for name in ("audit_x0", "step_noises"):
        state["inputs"][f"authored/{name}"] = tensor_hash(namespace[name])
    def final_records(prefix):
        for name in ("sequential_state", "accumulated_noise", "direct_state", "effective_epsilon"):
            state["outputs"][f"{prefix}/{name}"] = tensor_hash(namespace[name])
        difference = namespace["sequential_state"] - namespace["direct_state"]
        state["outputs"][f"{prefix}/difference"] = tensor_hash(difference)
        state["outputs"][f"{prefix}/max_abs_difference"] = shared.tensor_record(difference.abs().max())
    final_records("authored")
    # Observe small coefficients after the original execution. Scalar sqrt calls
    # match its recurrence, unlike a vectorized substitute; no RNG is consumed.
    for name in ("diffusion_beta", "diffusion_alpha", "diffusion_alpha_bar", "diffusion_bars_with_zero"):
        state["outputs"][f"schedule/{name}"] = shared.tensor_record(namespace[name])
    for name in ("diffusion_beta", "diffusion_alpha", "diffusion_alpha_bar"):
        state["outputs"][f"schedule/scalar_sqrt_{name}"] = shared.tensor_record(
            torch.stack([torch.sqrt(item) for item in namespace[name]]))
    state["outputs"]["schedule/scalar_sqrt_one_minus_alpha_bar"] = shared.tensor_record(
        torch.stack([torch.sqrt(1.0 - item) for item in namespace["diffusion_alpha_bar"]]))
    # Fixed dyadic inputs with the original sizes/dtype and unchanged recurrence.
    namespace["audit_x0"] = ((torch.arange(namespace["audit_x0"].numel(), dtype=torch.int64) % 257) - 128).to(torch.float64) / 128
    shape = namespace["step_noises"].shape
    namespace["step_noises"] = (((torch.arange(math.prod(shape), dtype=torch.int64) % 509) - 254).to(torch.float64) / 256).reshape(shape)
    for name in ("audit_x0", "step_noises"):
        state["inputs"][f"rational/{name}"] = tensor_hash(namespace[name])
    body = trees[FORWARD_LABELS[1]].body
    starts = [i for i, node in enumerate(body) if isinstance(node, ast.Assign)
              and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name)
              and node.targets[0].id == "sequential_state"]
    if len(starts) != 1:
        raise ValueError("Authored recurrence boundary changed")
    rational_printed = io.StringIO()
    with contextlib.redirect_stdout(rational_printed):
        exec(compile(ast.Module(body=body[starts[0]:], type_ignores=[]), spec["source_file"], "exec"), namespace)
    final_records("rational")
    if not torch.equal(rng_after_authored, torch.get_rng_state()):
        raise ValueError("Post-run observations/control consumed RNG")
    state["rational_stdout"] = rational_printed.getvalue()
    state["rational_control"] = "Same-shape dyadic inputs; exact authored recurrence/report AST, no RNG. Not manuscript output."
    state["coefficient_observation"] = "Scalar sqrt coefficients recomputed after the untouched authored execution, not a trace of its internal calls."


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


def worker(policy: str, spec: dict, output: Path, forward_only: bool = False) -> dict:
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
        if forward_only:
            if policy != "compatible-numpy":
                raise ValueError("Forward-only diagnostic requires the existing current policy")
            forward_study(spec["forward"], state)
            state.update(status="completed", runtime_after=runtime(torch, np))
            return state
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


def summarize(workers: list[dict], processes: int, forward_only: bool = False) -> dict:
    policies = selected_policies(forward_only)
    grouped = {policy: [w for w in workers if w["policy"] == policy] for policy in policies}
    if len(workers) != len(policies) * processes or any(len(rows) != processes for rows in grouped.values()):
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
                validate_record(record)
    result = {"schema_version": 1, "promotion_eligible": False, "completed": True, "limitation": LIMITATION,
              "processes_per_policy": processes, "policies": {}, "input_variants_across_policies": {},
              "mode": "forward-only" if forward_only else "six-policy", "reference_policy": policies[0]}
    for name in sorted(expected_keys["inputs"]):
        result["input_variants_across_policies"][name] = len({row["inputs"][name]["sha256"] for row in workers})
    for policy, rows in grouped.items():
        result["policies"][policy] = {
            "observed_torch_capabilities": sorted({r["runtime_after"]["torch"]["cpu_capability"] for r in rows}),
            "within_policy_differences": {group: [name for name in sorted(keys)
                if len({row[group][name]["sha256"] for row in rows}) > 1] for group, keys in expected_keys.items()},
            "outputs_differing_from_baseline": [name for name in sorted(expected_keys["outputs"])
                if {r["outputs"][name]["sha256"] for r in rows} !=
                   {r["outputs"][name]["sha256"] for r in grouped[policies[0]]}],
        }
        if forward_only:
            result["policies"][policy]["stdout_variants"] = {
                key: len({row[key] for row in rows}) for key in ("chapter19_stdout", "rational_stdout")}
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--worker", choices=POLICIES)
    parser.add_argument("--case-spec", type=Path)
    parser.add_argument("--processes", type=int, default=2)
    parser.add_argument("--forward-only", action="store_true", help="Only the authored Chapter 19 witness and rational control under the current policy")
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
        worker(args.worker, json.loads(args.case_spec.read_text()), args.output, args.forward_only)
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
        identity["original_image"]["chapter_files_sha256"][FORWARD_SOURCE] = shared.digest(args.original_source_root / FORWARD_SOURCE)
        identity["diagnostic"]["files_sha256"]["scripts/probe_runtime_dispatch.py"] = shared.digest(Path(__file__))
        if shared.digest(Path(__file__)) != shared.digest(args.diagnostic_root / "scripts/probe_runtime_dispatch.py"):
            raise ValueError("Executed diagnostic source differs from declared source")
        policies = selected_policies(args.forward_only)
        identity.update(protocol={"policies": {key: POLICIES[key] for key in policies}, "processes_per_policy": 2,
                                  "fixed_base_policy": {**shared.POLICY, "MKL_CBWR": "AVX2", **(POLICIES["compatible-numpy"] if args.forward_only else {})},
                                  "mode": "forward-only" if args.forward_only else "six-policy",
                                  "executed_labels": FORWARD_LABELS if args.forward_only else LABELS,
                                  "source_file": FORWARD_SOURCE if args.forward_only else SOURCE}, limitation=LIMITATION)
        write(args.output / "provenance.json", identity)
        original_manifest = args.output / "original-image.json"
        original_manifest.write_bytes((args.image_artifact_dir / "image.json").read_bytes())
        original_manifest.chmod(0o644)
        spec_path = args.output / "case-spec.json"
        write(spec_path, source_spec(args.original_source_root))
        workers = []
        for policy in policies:
            for repeat in range(2):
                output = args.output / f"{policy}-{repeat}.json"
                log = output.with_suffix(".log")
                with log.open("w") as stream:
                    subprocess.run([sys.executable, str(Path(__file__).resolve()), "--worker", policy,
                                    "--case-spec", str(spec_path.resolve()), "--output", str(output.resolve()),
                                    *(["--forward-only"] if args.forward_only else [])],
                                   env=environment(policy), stdout=stream, stderr=subprocess.STDOUT, check=True, timeout=60)
                workers.append(json.loads(output.read_text()))
                print(f"Completed {policy} process {repeat + 1}/2", flush=True)
        report = summarize(workers, 2, args.forward_only)
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
