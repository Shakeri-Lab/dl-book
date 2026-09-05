#!/usr/bin/env python3
"""Read-only, finite-sample least-squares repeatability diagnostic.

No manuscript execution, freeze writing, tolerance change, or promotion. The
parent uses stdlib only; each fresh child imports Torch after its dispatch and
thread environment is set. A complete report may observe nonrepeatability: this
is a diagnostic outcome, not permission to change the canonical protocol.
"""
from __future__ import annotations

import argparse
import ast
from collections import defaultdict
import hashlib
import importlib.metadata
import importlib.util
import json
import os
from pathlib import Path
import platform
import re
import subprocess
import sys


SCHEMA_VERSION = 1
BRANCHES = ("AVX2", "AVX2,STRICT", "COMPATIBLE")
DRIVERS = ("default", "gels", "gelsd", "gelss")
CASES = ("ch1-linear-regression", "ch4-sgd-zones")
DTYPES = ("float32", "float64")
LAYOUTS = ("authored", *(f"element-offset-{offset}" for offset in range(16)))
LAYOUT_REPEATS = 2
CHAPTERS = (
    "chapters/part1/01-linear-regression.qmd",
    "chapters/part1/04-training-loss-sgd.qmd",
)
DIAGNOSTIC_FILES = (
    "scripts/probe_lstsq_repeatability.py",
    ".github/workflows/canonical-probe.yml",
    ".github/workflows/execute-audit.yml",
)
POLICY = {
    "OMP_NUM_THREADS": "1", "OMP_DYNAMIC": "FALSE",
    "MKL_NUM_THREADS": "1", "MKL_DYNAMIC": "FALSE",
    "OPENBLAS_NUM_THREADS": "1", "VECLIB_MAXIMUM_THREADS": "1",
    "NUMEXPR_NUM_THREADS": "1", "DLBOOK_TORCH_NUM_THREADS": "1",
    "DLBOOK_TORCH_INTEROP_THREADS": "1", "ONEDNN_MAX_CPU_ISA": "AVX2",
    "PYTHONHASHSEED": "0", "CUDA_VISIBLE_DEVICES": "",
    "PYTHONDONTWRITEBYTECODE": "1",
}
LIMITATION = (
    "These are finite observations in one saved image on the recorded host, not "
    "a guarantee across hosts, releases, algorithms, or future runs. MKL dispatch "
    "settings are diagnostic interventions, not changes to the canonical policy. "
    "Cross-driver or cross-policy agreement is not required for repeatability."
)


def digest(path: Path) -> str:
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, indent=2, sort_keys=True, allow_nan=False) + "\n")


def observed_environment() -> dict[str, str]:
    # Explicit numerical/runtime prefixes only. Never archive arbitrary secrets.
    prefixes = ("OMP_", "MKL_", "KMP_", "OPENBLAS_", "ONEDNN_", "DNNL_", "ATEN_")
    names = set(POLICY) | {"SOURCE_DATE_EPOCH", "TZ", "LC_ALL", "LANG", "CUBLAS_WORKSPACE_CONFIG"}
    return {k: v for k, v in sorted(os.environ.items()) if k in names or k.startswith(prefixes)}


def worker_environment(branch: str) -> dict[str, str]:
    if branch not in BRANCHES:
        raise ValueError("Unknown MKL diagnostic branch")
    return {**os.environ, **POLICY, "MKL_CBWR": branch}


def tensor_record(tensor) -> dict:
    value = tensor.detach().cpu().contiguous()
    raw = value.numpy().tobytes(order="C")
    return {"dtype": str(value.dtype), "shape": list(value.shape),
            "byte_order": sys.byteorder, "bytes_hex": raw.hex(),
            "sha256": hashlib.sha256(raw).hexdigest(), "values": value.tolist()}


def layout_record(tensor) -> dict:
    return {"shape": list(tensor.shape), "stride": list(tensor.stride()),
            "contiguous": tensor.is_contiguous(), "storage_offset": tensor.storage_offset(),
            "data_ptr_mod_64": tensor.data_ptr() % 64}


def layout_variant(torch, tensor, layout: str):
    if layout == "authored":
        return tensor
    offset = int(layout.removeprefix("element-offset-"))
    storage = torch.empty(tensor.numel() + offset, dtype=tensor.dtype)
    view = storage[offset:].view(tensor.shape)
    view.copy_(tensor)
    return view


def labeled_cell(text: str, label: str) -> str:
    cells = re.findall(r"^```\{python\}\n(.*?)^```\s*$", text, re.MULTILINE | re.DOTALL)
    matches = [cell for cell in cells if re.search(rf"^#\| label: {re.escape(label)}\s*$", cell, re.MULTILINE)]
    if len(matches) != 1:
        raise ValueError(f"Expected exactly one original cell {label}")
    return matches[0]


def selected_nodes(code: str, descriptions: tuple[str, ...]) -> list:
    found = []
    for description in descriptions:
        nodes = []
        for node in ast.parse(code).body:
            if description == "seed":
                match = isinstance(node, ast.Expr) and ast.dump(node.value) == ast.dump(ast.parse("torch.manual_seed(6050)").body[0].value)
            elif description.startswith("def:"):
                match = isinstance(node, ast.FunctionDef) and node.name == description[4:]
            else:
                match = (isinstance(node, ast.Assign) and len(node.targets) == 1
                         and ast.unparse(node.targets[0]) == description)
            if match:
                nodes.append(node)
        if len(nodes) != 1:
            raise ValueError(f"Missing/ambiguous original statement: {description}")
        found.append(nodes[0])
    return found


def extract_case_specs(root: Path) -> dict:
    """Narrow extraction: only the two named input prefixes, never solver/plot code."""
    ch1 = (root / CHAPTERS[0]).read_text()
    ch4 = (root / CHAPTERS[1]).read_text()
    nodes1 = selected_nodes(labeled_cell(ch1, "setup"), ("seed",))
    nodes1 += selected_nodes(labeled_cell(ch1, "synthetic-data"),
                             ("def:make_synthetic_data", "(true_w, true_b)", "(X, y)"))
    nodes1 += selected_nodes(labeled_cell(ch1, "closed-form"), ("X_aug",))
    nodes4 = selected_nodes(labeled_cell(ch4, "fig-sgd-zones"), ("seed", "x1", "y1", "A"))
    result = {}
    for case, nodes, path, outputs in ((CASES[0], nodes1, CHAPTERS[0], ("X_aug", "y")),
                                       (CASES[1], nodes4, CHAPTERS[1], ("A", "y1"))):
        module = ast.Module(body=nodes, type_ignores=[])
        code = ast.unparse(module) + "\n"
        result[case] = {"source_file": path, "source_sha256": digest(root / path), "code": code,
                        "ast_sha256": hashlib.sha256(ast.dump(ast.parse(code)).encode()).hexdigest(),
                        "outputs": list(outputs)}
    return result


def make_inputs(torch, case: str, specifications: dict):
    specification = specifications[case]
    code = specification["code"]
    if hashlib.sha256(ast.dump(ast.parse(code)).encode()).hexdigest() != specification["ast_sha256"]:
        raise ValueError("Extracted original input program changed")
    namespace = {"torch": torch}
    # These specific statements came from the authenticated original chapter
    # cells; no arbitrary expression, complete chapter, solve, or plot is run.
    exec(compile(code, specification["source_file"], "exec"), namespace)
    return tuple(namespace[name] for name in specification["outputs"])


def runtime_record(torch) -> dict:
    cpu = {}
    if Path("/proc/cpuinfo").is_file():
        first = Path("/proc/cpuinfo").read_text().split("\n\n", 1)[0]
        cpu = {k.strip(): v.strip() for line in first.splitlines() if ":" in line
               for k, v in [line.split(":", 1)]
               if k.strip() in {"vendor_id", "model name", "cpu family", "model", "stepping", "flags"}}
    from threadpoolctl import threadpool_info
    return {
        "pid": os.getpid(),
        "python": {"version": sys.version, "implementation": platform.python_implementation()},
        "machine": {"system": platform.system(), "machine": platform.machine(),
                    "release": platform.release(), "cpu": cpu},
        "torch": {"version": torch.__version__, "config": torch.__config__.show(),
                  "num_threads": torch.get_num_threads(),
                  "num_interop_threads": torch.get_num_interop_threads()},
        "packages": {item.metadata["Name"]: item.version for item in importlib.metadata.distributions()
                     if item.metadata.get("Name")},
        "loaded_threadpools": threadpool_info(), "environment": observed_environment(),
    }


def run_worker(branch: str, repeats: int, specifications: dict, evidence_prefix: Path | None = None) -> dict:
    # This function is invoked only in a fresh subprocess. No Torch monkeypatch,
    # kernel hook, training, or changed solve default is involved.
    if os.environ.get("MKL_CBWR") != branch:
        raise ValueError("Worker environment must be set before importing Torch")
    if any(os.environ.get(k) != v for k, v in POLICY.items()):
        raise ValueError("Worker thread/dispatch policy mismatch")
    import torch
    torch.set_num_threads(1)
    torch.set_num_interop_threads(1)
    if torch.get_default_dtype() != torch.float32:
        raise ValueError("The source cases require the original float32 default")
    if evidence_prefix:
        write_json(evidence_prefix.with_suffix(".preflight.json"), {"phase": "preflight-only", "runtime": runtime_record(torch)})
    input_evidence = {}
    records = []
    for case in CASES:
        source_A, source_y = make_inputs(torch, case, specifications)
        input_evidence[case] = {"A": tensor_record(source_A), "y": tensor_record(source_y)}
        if evidence_prefix:
            write_json(evidence_prefix.with_suffix(".inputs.json"), input_evidence)
        for dtype in DTYPES:
            # Float64 casts the same already-generated source data, isolating
            # solver precision from a change in the random-number generation.
            A, y = source_A.to(getattr(torch, dtype)), source_y.to(getattr(torch, dtype))
            for layout in LAYOUTS:
                trial_A, trial_y = layout_variant(torch, A, layout), layout_variant(torch, y, layout)
                inputs = {"A": tensor_record(trial_A), "y": tensor_record(trial_y)}
                for driver in DRIVERS:
                    observations = []
                    count = repeats if layout == "authored" else LAYOUT_REPEATS
                    for iteration in range(count):
                        kwargs = {} if driver == "default" else {"driver": driver}
                        solved = torch.linalg.lstsq(trial_A, trial_y, **kwargs)
                        solution = solved.solution
                        predictions = trial_A @ solution
                        loss = ((predictions - trial_y) ** 2).mean()
                        if not all(torch.isfinite(t).all().item() for t in (solution, predictions, loss)):
                            raise ValueError("Nonfinite solve/prediction/loss")
                        observations.append({"iteration": iteration,
                                             "solution": tensor_record(solution),
                                             "predictions": tensor_record(predictions),
                                             "mse": tensor_record(loss),
                                             "layouts": {"A": layout_record(trial_A), "y": layout_record(trial_y),
                                                         "solution": layout_record(solution),
                                                         "predictions": layout_record(predictions)}})
                    if inputs != {"A": tensor_record(trial_A), "y": tensor_record(trial_y)}:
                        raise ValueError("Solver mutated its input tensors")
                    records.append({"case": case, "dtype": dtype, "driver": driver, "layout": layout,
                                    "inputs": inputs, "observations": observations})
    return {"schema_version": SCHEMA_VERSION, "branch": branch, "repeats": repeats,
            "runtime": runtime_record(torch), "records": records}


def checked_tensor(record: dict) -> str:
    """Reject corrupted evidence before comparing exact bytes."""
    raw = bytes.fromhex(record["bytes_hex"])
    if hashlib.sha256(raw).hexdigest() != record["sha256"]:
        raise ValueError("Tensor byte/hash mismatch")
    if record["byte_order"] not in ("little", "big"):
        raise ValueError("Missing byte order")
    size = {"torch.float32": 4, "torch.float64": 8}.get(record["dtype"])
    if size is None:
        raise ValueError("Unsupported tensor dtype")
    for dimension in record["shape"]:
        if not isinstance(dimension, int) or dimension < 0:
            raise ValueError("Invalid tensor shape")
        size *= dimension
    if size != len(raw):
        raise ValueError("Tensor byte length differs from shape/dtype")
    return json.dumps({k: record[k] for k in ("dtype", "shape", "byte_order", "bytes_hex")}, sort_keys=True)


def summarize(workers: list[dict], processes: int, repeats: int) -> dict:
    expected = {(case, dtype, driver, layout) for case in CASES for dtype in DTYPES
                for driver in DRIVERS for layout in LAYOUTS}
    groups = defaultdict(list)
    all_inputs = defaultdict(set)
    counts = defaultdict(int)
    for worker in workers:
        branch = worker["branch"]
        if branch not in BRANCHES or worker.get("schema_version") != SCHEMA_VERSION:
            raise ValueError("Unexpected worker schema/branch")
        counts[branch] += 1
        runtime = worker["runtime"]
        if runtime["torch"]["num_threads"] != 1 or runtime["torch"]["num_interop_threads"] != 1:
            raise ValueError("Observed Torch thread counts differ from 1/1")
        if any(runtime["environment"].get(k) != v for k, v in {**POLICY, "MKL_CBWR": branch}.items()):
            raise ValueError("Observed worker environment differs from declared policy")
        keys = [(r["case"], r["dtype"], r["driver"], r["layout"]) for r in worker["records"]]
        if set(keys) != expected or len(keys) != len(expected) or worker["repeats"] != repeats:
            raise ValueError("Missing/duplicate worker condition")
        for row in worker["records"]:
            key = (branch, row["case"], row["dtype"], row["driver"], row["layout"])
            inputs = tuple(checked_tensor(row["inputs"][k]) for k in ("A", "y"))
            all_inputs[(row["case"], row["dtype"])].add(inputs)
            observations = row["observations"]
            count = repeats if row["layout"] == "authored" else LAYOUT_REPEATS
            if [r["iteration"] for r in observations] != list(range(count)):
                raise ValueError("Missing/reordered solve repetition")
            for observation in observations:
                for field in ("solution", "predictions", "mse"):
                    checked_tensor(observation[field])
                for field in ("A", "y", "solution", "predictions"):
                    layout = observation["layouts"][field]
                    if (layout["shape"] != (row["inputs"] if field in ("A", "y") else observation)[field]["shape"]
                            or len(layout["stride"]) != len(layout["shape"])
                            or not 0 <= layout["data_ptr_mod_64"] < 64):
                        raise ValueError("Invalid tensor layout observation")
            groups[key].append(observations)
    if dict(counts) != {branch: processes for branch in BRANCHES}:
        raise ValueError("Incomplete independent-process inventory")
    inputs_identical = all(len(values) == 1 for values in all_inputs.values())
    rows = []
    for key, runs in sorted(groups.items()):
        row = dict(zip(("branch", "case", "dtype", "driver", "layout"), key))
        for field in ("solution", "predictions", "mse"):
            variants = [{checked_tensor(item[field]) for item in run} for run in runs]
            row[field] = {"distinct_byte_patterns": len(set.union(*variants)),
                          "within_process_changes": sum(len(values) > 1 for values in variants),
                          "first_repetition_patterns": len({checked_tensor(run[0][field]) for run in runs})}
        row["observed_bit_identical"] = all(row[f]["distinct_byte_patterns"] == 1
                                            for f in ("solution", "predictions", "mse"))
        rows.append(row)
    authored_rows = [row for row in rows if row["layout"] == "authored"]
    layout_rows = [row for row in rows if row["layout"] != "authored"]
    across_offsets = defaultdict(set)
    for key, runs in groups.items():
        if key[-1] != "authored":
            across_offsets[key[:-1]].update(checked_tensor(item["solution"]) for run in runs for item in run)
    repeatable = inputs_identical and all(row["observed_bit_identical"] for row in authored_rows)
    return {"schema_version": SCHEMA_VERSION, "purpose": "diagnostic-only-not-promotion-eligible",
            "completed": True, "processes_per_branch": processes, "repeats_per_condition": repeats,
            "all_input_bytes_identical_across_processes_and_policies": inputs_identical,
            "input_variants": {"/".join(k): len(v) for k, v in sorted(all_inputs.items())},
            "observed_repeatability": repeatable,
            "layout_control_repeatability": inputs_identical and all(row["observed_bit_identical"] for row in layout_rows),
            "solution_patterns_across_offsets": {"/".join(k): len(v) for k, v in sorted(across_offsets.items())},
            "status": ("observed-bit-identical" if repeatable else
                       "input-drift-inconclusive" if not inputs_identical else "observed-nonrepeatability"),
            "conditions": authored_rows, "layout_controls": layout_rows, "limitation": LIMITATION}


def provenance(args) -> dict:
    if not re.fullmatch(r"[0-9a-f]{40}", args.original_source_commit):
        raise ValueError("Original image source must be a full commit")
    if not re.fullmatch(r"[0-9a-f]{40}", args.diagnostic_commit):
        raise ValueError("Diagnostic source must be a separate full commit identity")
    if not re.fullmatch(r"[0-9]+", args.image_run_id):
        raise ValueError("Image run ID must be numeric")
    # Use the original helper with its matching original source. In particular,
    # do not compare the old image recipe with today's diagnostic source tree.
    helper = args.original_source_root / "container/image_artifact.py"
    spec = importlib.util.spec_from_file_location("original_image_artifact", helper)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    manifest_path = args.image_artifact_dir / "image.json"
    manifest = json.loads(manifest_path.read_text())
    expected = module.identity_inputs(args.original_source_root, args.original_source_commit)
    verified_id = module.verify(manifest, args.image_artifact_dir / "image.tar.gz", expected)
    if verified_id != args.image_id:
        raise ValueError("Loaded image ID differs from the verified original archive")
    if manifest["docker_inspect"]["Os"] != "linux" or manifest["docker_inspect"]["Architecture"] != "amd64":
        raise ValueError("The saved diagnostic image must be Linux/amd64")
    if platform.system() != "Linux" or platform.machine() != "x86_64":
        raise ValueError("Saved-image diagnostic must actually run on Linux x86_64")
    if digest(Path(__file__).resolve()) != digest(args.diagnostic_root / DIAGNOSTIC_FILES[0]):
        raise ValueError("Executed script does not match the declared diagnostic source")
    return {
        "schema_version": SCHEMA_VERSION, "purpose": "diagnostic-only-not-promotion-eligible",
        "original_image": {"source_commit": args.original_source_commit,
                           "actions_run_id": args.image_run_id, "image_id": verified_id,
                           "manifest_sha256": digest(manifest_path), "manifest": manifest,
                           "verification_helper_sha256": digest(helper),
                           "chapter_files_sha256": {p: digest(args.original_source_root / p) for p in CHAPTERS}},
        "diagnostic": {"source_commit": args.diagnostic_commit,
                       "files_sha256": {p: digest(args.diagnostic_root / p) for p in DIAGNOSTIC_FILES},
                       "actions": {k: os.environ.get(k) for k in
                                   ("GITHUB_RUN_ID", "GITHUB_RUN_ATTEMPT", "GITHUB_REPOSITORY")}},
        "protocol": {"seed": 6050, "branches": list(BRANCHES), "drivers": list(DRIVERS),
                     "dtypes": list(DTYPES), "processes_per_branch": args.processes,
                     "repeats_per_condition": args.repeats, "thread_policy": POLICY,
                     "layout_control": {"element_offsets": list(range(16)), "repeats": LAYOUT_REPEATS,
                                        "contract": "Contiguous copies preserve A/y bytes; separate from authored-layout results."},
                     "dtype_contract": "Generate the original float32 data once per case; float64 casts A/y.",
                     "default_driver_contract": "Omit driver and rcond exactly as in the source; CPU default is gelsy.",
                     "cases": {CASES[0]: "X=randn(200,2); y=X@[2,-3.4]+4.2+0.1*randn(200); A=[X,ones]",
                               CASES[1]: "x=randn(80); y=2.5*x-1+0.4*randn(80); A=[x,ones]"}},
        "limitation": LIMITATION,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--worker", choices=BRANCHES)
    parser.add_argument("--case-spec", type=Path)
    parser.add_argument("--repeats", type=int, default=20)
    parser.add_argument("--processes", type=int, default=8)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--original-source-root", type=Path)
    parser.add_argument("--original-source-commit")
    parser.add_argument("--image-artifact-dir", type=Path)
    parser.add_argument("--image-id")
    parser.add_argument("--image-run-id")
    parser.add_argument("--diagnostic-root", type=Path)
    parser.add_argument("--diagnostic-commit")
    args = parser.parse_args()
    if not 2 <= args.repeats <= 100 or not 2 <= args.processes <= 16:
        parser.error("Use 2..100 repeats and 2..16 fresh processes per branch")
    if args.output.exists():
        parser.error("Output must be new; never overwrite prior diagnostic evidence")
    if args.worker:
        if not args.case_spec:
            parser.error("Worker requires the original-source extracted --case-spec")
        try:
            write_json(args.output, run_worker(args.worker, args.repeats,
                                               json.loads(args.case_spec.read_text()), args.output))
        except Exception as error:
            write_json(args.output.with_suffix(".failure.json"), {"completed": False, "error": f"{type(error).__name__}: {error}"})
            raise
        return 0
    for key in ("original_source_root", "original_source_commit", "image_artifact_dir",
                "image_id", "image_run_id", "diagnostic_root", "diagnostic_commit"):
        if getattr(args, key) is None:
            parser.error(f"--{key.replace('_', '-')} is required for the saved-image driver")
    args.output.mkdir(parents=True)
    try:
        identity = provenance(args)
        write_json(args.output / "provenance.json", identity)
        specifications = extract_case_specs(args.original_source_root)
        spec_path = args.output / "case-spec.json"
        write_json(spec_path, specifications)
        # Preserve the ORIGINAL manifest bytes, not only its parsed JSON values.
        (args.output / "original-image.json").write_bytes((args.image_artifact_dir / "image.json").read_bytes())
        workers = []
        raw = args.output / "workers"
        raw.mkdir()
        for branch_index, branch in enumerate(BRANCHES):
            for process_index in range(args.processes):
                stem = f"branch-{branch_index}-process-{process_index:02d}"
                path = raw / f"{stem}.json"
                with (raw / f"{stem}.log").open("w") as log:
                    subprocess.run([sys.executable, str(Path(__file__).resolve()), "--worker", branch,
                                    "--case-spec", str(spec_path.resolve()),
                                    "--repeats", str(args.repeats), "--output", str(path.resolve())],
                                   env=worker_environment(branch), stdout=log, stderr=subprocess.STDOUT,
                                   check=True, timeout=120)
                workers.append(json.loads(path.read_text()))
                print(f"Completed {branch} fresh process {process_index + 1}/{args.processes}", flush=True)
        report = summarize(workers, args.processes, args.repeats)
        report["provenance_sha256"] = digest(args.output / "provenance.json")
        report["case_spec_sha256"] = digest(spec_path)
        report["worker_files_sha256"] = {p.relative_to(args.output).as_posix(): digest(p)
                                         for p in sorted(raw.glob("*"))}
        write_json(args.output / "report.json", report)
        lines = ["# Saved-image least-squares diagnostic", "", f"Outcome: **{report['status']}**.", "",
                 f"Image source: `{args.original_source_commit}`; diagnostic source: `{args.diagnostic_commit}`.", "",
                 f"{args.processes} fresh processes per policy, {args.repeats} solves per condition in each process.", "",
                 "| MKL_CBWR | Case | Dtype | Driver | Solution / prediction / MSE byte patterns |",
                 "|---|---|---|---|---|"]
        for row in report["conditions"]:
            counts = " / ".join(str(row[f]["distinct_byte_patterns"]) for f in ("solution", "predictions", "mse"))
            lines.append(f"| {row['branch']} | {row['case']} | {row['dtype']} | {row['driver']} | {counts} |")
        lines.extend(["", f"Separately tagged offset-layout controls repeatable within each offset: {report['layout_control_repeatability']}.",
                      "Full offset results and per-sample alignment metadata are retained in report.json and worker files.",
                      "", LIMITATION, "", "No canonical settings, manuscript code, frozen outputs, or promotion gates were changed.", ""])
        (args.output / "summary.md").write_text("\n".join(lines))
        print(report["status"])
        return 0
    except Exception as error:
        write_json(args.output / "failure.json", {"completed": False, "promotion_eligible": False,
                                                   "error": f"{type(error).__name__}: {error}"})
        raise


if __name__ == "__main__":
    raise SystemExit(main())
