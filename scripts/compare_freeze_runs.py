#!/usr/bin/env python3
"""Require independently executed canonical freezes to have identical stdout.

No portability tolerance is used here. The existing freeze parser preserves
native-cell ordinals; CPU identities are observations, never identity gates.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import re
import sys
from typing import Any

from audit_frozen_stdout import native_execution_ordinals, stdout_records
from freeze_provenance import SCHEMA_VERSION, freeze_inventory, json_digest, sha256, write_json

DIGEST_RE = re.compile(r"[0-9a-f]{64}")


def bundle_paths(path: Path) -> tuple[Path, Path]:
    if (path / "_freeze").is_dir():
        return path / "_freeze", path / "provenance" / "fingerprint.json"
    return path, path / "provenance.json"


def _required(document: dict[str, Any], *keys: str) -> Any:
    current: Any = document
    for key in keys:
        if not isinstance(current, dict) or key not in current or current[key] is None:
            raise ValueError("missing fingerprint field " + ".".join(keys))
        current = current[key]
    return current


def runtime_identity(runtime: dict[str, Any]) -> dict[str, Any]:
    libraries = []
    for item in _required(runtime, "loaded_libraries"):
        libraries.append({key: item.get(key) for key in (
            "user_api", "internal_api", "prefix", "version", "binary_sha256",
            "num_threads", "threading_layer",
        )})
    return {
        "python": {key: _required(runtime, "python", key)
                   for key in ("version", "full_version", "implementation", "soabi")},
        "packages": _required(runtime, "packages"),
        "torch": _required(runtime, "torch"),
        "loaded_libraries": sorted(libraries, key=json_digest),
        "environment": _required(runtime, "environment"),
    }


def kernel_identity(observation: dict[str, Any]) -> dict[str, Any]:
    # PID, kernel/session IDs, timestamps, and absolute paths are observations.
    return {
        "python": {key: _required(observation, "python", key)
                   for key in ("version", "implementation")},
        "torch": {key: _required(observation, "torch", key)
                  for key in ("version", "config", "num_threads", "num_interop_threads")},
        "environment": _required(observation, "environment"),
    }


def validate_fingerprint(document: dict[str, Any], freeze_root: Path, *,
                         provenance_root: Path | None = None) -> list[str]:
    errors = []
    try:
        if provenance_root is not None:
            archived_fingerprint = provenance_root / "fingerprint.json"
            if (not archived_fingerprint.is_file()
                    or json.loads(archived_fingerprint.read_text()) != document):
                raise ValueError("Explicit proof directory does not contain the original fingerprint")
        if document.get("schema_version") != SCHEMA_VERSION or document.get("kind") != "canonical":
            raise ValueError("canonical fingerprint schema/kind is missing or unsupported")
        if not _required(document, "run", "id"):
            raise ValueError("run identity is empty")
        _required(document, "run", "ci")
        _required(document, "created_utc")
        cpu = _required(document, "cpu")
        if cpu.get("machine") not in {"x86_64", "amd64"} or cpu.get("system") != "Linux" or not cpu.get("processors"):
            raise ValueError("Canonical CPU observation must identify Linux x86_64")
        if any(not processor.get("vendor") or not processor.get("model")
               or not isinstance(processor.get("flags"), list) or not processor["flags"]
               for processor in cpu["processors"]):
            raise ValueError("Canonical CPU vendor/model/flags observations are incomplete")
        source = _required(document, "source")
        if source.get("dirty") is not False:
            raise ValueError("Canonical source was not verified clean")
        if not re.fullmatch(r"[0-9a-f]{40}", str(source.get("commit", ""))):
            raise ValueError("source commit is missing or invalid")
        files = _required(source, "files_sha256")
        if not files or any(not DIGEST_RE.fullmatch(str(value)) for value in files.values()):
            raise ValueError("source input hashes are empty or invalid")
        if json_digest(files) != _required(source, "input_sha256"):
            raise ValueError("source input hash does not match its inventory")
        plan = _required(document, "execution_plan")
        if (plan.get("schema_version") != 1 or plan.get("source_commit") != source["commit"]
                or plan.get("source_input_sha256") != source["input_sha256"]
                or plan.get("formats") != ["html", "tex"] or not plan.get("units")):
            raise ValueError("Execution plan is absent or not bound to source identity")
        for unit, specification in plan["units"].items():
            if files.get(unit) != specification.get("source_sha256") or not specification.get("native_cells_sha256"):
                raise ValueError(f"Execution plan has invalid source/native coverage for {unit}")
            for name, digest in specification.get("included_sources_sha256", {}).items():
                if files.get(name) != digest:
                    raise ValueError(f"Included source identity differs: {name}")
        container = _required(document, "container")
        for key in ("digest", "base_digest"):
            if not re.fullmatch(r"(?:[^\s]+@)?sha256:[0-9a-f]{64}", str(container.get(key, ""))):
                raise ValueError(f"immutable container {key} is missing or invalid")
        for key in ("recipe", "wheel_lock"):
            record = _required(container, key)
            if files.get(record.get("path")) != record.get("sha256"):
                raise ValueError(f"container {key} is not bound to source inputs")
        runtime = runtime_identity(_required(document, "runtime"))
        if not runtime["packages"] or not runtime["torch"].get("config"):
            raise ValueError("package inventory or torch build configuration is empty")
        if not runtime["loaded_libraries"]:
            raise ValueError("loaded numerical libraries were not observed")
        for library in runtime["loaded_libraries"]:
            if not DIGEST_RE.fullmatch(str(library.get("binary_sha256", ""))):
                raise ValueError("loaded numerical library binary hash is missing")
        for key in ("num_threads", "num_interop_threads"):
            if not isinstance(runtime["torch"].get(key), int) or runtime["torch"][key] < 1:
                raise ValueError(f"invalid observed torch {key}")
        probes = _required(document, "execution_probes")
        if not probes:
            raise ValueError("executed-kernel observations are missing")
        identities = []
        probe_units = []
        for probe in probes:
            observation = _required(probe, "observation")
            identity = kernel_identity(observation)
            if identity["python"]["version"] != runtime["python"]["version"]:
                raise ValueError("kernel Python version differs from captured environment")
            if identity["torch"]["version"] != runtime["torch"]["version"]:
                raise ValueError("kernel torch version differs from captured environment")
            if identity["torch"]["config"] != runtime["torch"]["config"]:
                raise ValueError("kernel torch build differs from captured environment")
            for key in ("num_threads", "num_interop_threads"):
                if not isinstance(identity["torch"][key], int) or identity["torch"][key] < 1:
                    raise ValueError(f"kernel observed {key} is invalid")
            identities.append(identity)
            fmt = observation.get("format")
            probe_units.append((observation.get("unit"), "tex" if fmt == "latex" else fmt))
        if len({json_digest(identity) for identity in identities}) != 1:
            raise ValueError("executed kernels disagree on software/thread/dispatch identity")
        expected_pairs = {(unit, fmt) for unit in plan["units"] for fmt in plan["formats"]}
        if set(probe_units) != expected_pairs or len(probe_units) != len(expected_pairs):
            raise ValueError("Kernel probes do not cover exactly the planned unit/format pairs")
        expected = _required(document, "freeze_files_sha256")
        actual = freeze_inventory(freeze_root)
        if actual != expected:
            errors.append("freeze files differ from the recorded fingerprint inventory")
        if "docs/paired-evidence-plan.json" in files:
            evidence = _required(document, "paired_evidence")
            manifest = _required(evidence, "manifest")
            provenance = provenance_root if provenance_root is not None else freeze_root.parent / "provenance"
            manifest_path = provenance / "paired-evidence-manifest.json"
            if (not manifest_path.is_file() or sha256(manifest_path) != evidence.get("manifest_sha256")
                    or json.loads(manifest_path.read_text()) != manifest):
                raise ValueError("Paired evidence manifest is missing or differs from its fingerprint")
            if (manifest.get("passed") is not True
                    or manifest.get("plan_sha256") != files["docs/paired-evidence-plan.json"]):
                raise ValueError("Paired evidence is not bound to the source plan")
            if not manifest.get("source_sha256") or any(files.get(name) != value for name, value
                                                         in manifest["source_sha256"].items()):
                raise ValueError("Paired evidence source identities differ")
            sidecars = manifest.get("files_sha256", {})
            observed_sidecars = {path.relative_to(provenance / "paired-evidence").as_posix(): sha256(path)
                                for path in (provenance / "paired-evidence").rglob("*.json")}
            if len(sidecars) != 8 or sidecars != observed_sidecars:
                raise ValueError("Paired evidence sidecars are missing or differ from their fingerprint")
    except (ValueError, KeyError, TypeError, AttributeError, OSError) as exc:
        errors.append(str(exc))
    return errors


def compare_runs(left: Path, right: Path, *, require_all_files: bool = False) -> dict[str, Any]:
    report: dict[str, Any] = {
        "schema_version": 1,
        "policy": "canonical-exact-all-files-repeat" if require_all_files else "canonical-exact-stdout-repeat",
        "passed": False, "numerical_repeat_passed": False,
        "full_freeze_byte_identical": None, "freeze_file_differences": [],
        "errors": [], "stdout_blocks_checked": 0, "format_pairs_checked": 0,
    }
    documents, roots = [], []
    for label, path in (("first", left), ("second", right)):
        freeze_root, fingerprint = bundle_paths(path)
        try:
            document = json.loads(fingerprint.read_text())
        except (OSError, ValueError) as exc:
            report["errors"].append(f"{label}: missing/invalid fingerprint: {exc}")
            continue
        report["errors"].extend(f"{label}: {error}" for error in validate_fingerprint(document, freeze_root))
        documents.append(document)
        roots.append(freeze_root)
    if report["errors"] or len(documents) != 2:
        return report
    first, second = documents
    first_files, second_files = first["freeze_files_sha256"], second["freeze_files_sha256"]
    for name in sorted(first_files.keys() | second_files.keys()):
        if first_files.get(name) != second_files.get(name):
            category = ("execution-json" if "/execute-results/" in name and name.endswith(".json")
                        else "figure-asset" if Path(name).suffix.lower() in {".png", ".svg", ".pdf", ".jpg", ".jpeg", ".webp"}
                        else "other-freeze-file")
            report["freeze_file_differences"].append({
                "path": name, "category": category,
                "first_sha256": first_files.get(name), "second_sha256": second_files.get(name),
            })
    report["full_freeze_byte_identical"] = not report["freeze_file_differences"]
    if first["run"]["id"] == second["run"]["id"]:
        report["errors"].append("run IDs match; two independent execution records are required")
    identities = (
        ("source/input", first["source"]["files_sha256"], second["source"]["files_sha256"]),
        ("source commit", first["source"]["commit"], second["source"]["commit"]),
        ("execution plan", first["execution_plan"], second["execution_plan"]),
        ("raw paired evidence", first.get("paired_evidence"), second.get("paired_evidence")),
        ("container/recipe/wheel-lock", first["container"], second["container"]),
        ("software/thread/dispatch", runtime_identity(first["runtime"]), runtime_identity(second["runtime"])),
        ("executed-kernel", kernel_identity(first["execution_probes"][0]["observation"]),
         kernel_identity(second["execution_probes"][0]["observation"])),
    )
    for label, before, after in identities:
        if before != after:
            report["errors"].append(f"{label} identity differs")
    # Preserve CPU differences in the report, without turning hardware identity
    # into an excuse for changed bytes or rejecting an otherwise exact repeat.
    report["cpu_observations"] = [document["cpu"] for document in documents]
    report["run_ids"] = [document["run"]["id"] for document in documents]
    report["source_input_sha256"] = first["source"]["input_sha256"]
    record_sets = []
    for label, root, document in zip(("first", "second"), roots, documents):
        records = {}
        paths = sorted(root.glob("**/execute-results/*.json"))
        planned = {
            str(Path(unit).with_suffix("")) + f"/execute-results/{fmt}.json": specification
            for unit, specification in document["execution_plan"]["units"].items()
            for fmt in ("html", "tex")
        }
        if {path.relative_to(root).as_posix() for path in paths} != planned.keys():
            report["errors"].append(f"{label}: execution results do not cover exactly the predeclared QMD/format set")
        for path in paths:
            try:
                name = path.relative_to(root).as_posix()
                raw = path.read_text()
                records[name] = stdout_records(raw)
                if name in planned:
                    ordinals = list(range(1, len(planned[name]["native_cells_sha256"]) + 1))
                    if native_execution_ordinals(raw) != ordinals:
                        report["errors"].append(f"{label}: {name} native execution coverage differs from plan")
            except (ValueError, KeyError, TypeError) as exc:
                report["errors"].append(f"{label}: malformed execution result {path}: {exc}")
        for name in records:
            if name.endswith("/html.json"):
                tex = name.removesuffix("html.json") + "tex.json"
                if tex not in records:
                    report["errors"].append(f"{label}: missing TeX counterpart for {name}")
                elif records[name] != records[tex]:
                    report["errors"].append(f"{label}: HTML/TeX stdout differs for {name}")
                else:
                    report["format_pairs_checked"] += 1
        record_sets.append(records)
    before, after = record_sets
    if before.keys() != after.keys():
        report["errors"].append("executed result file set differs between independent runs")
    for name in sorted(before.keys() & after.keys()):
        expected, actual = before[name], after[name]
        if len(expected) != len(actual):
            report["errors"].append(f"{name}: stdout block count changed")
        for index, ((old_cell, old), (new_cell, new)) in enumerate(zip(expected, actual), 1):
            report["stdout_blocks_checked"] += 1
            if old_cell != new_cell:
                report["errors"].append(f"{name}: block {index} moved from native cell {old_cell} to {new_cell}")
            if old != new:
                report["errors"].append(f"{name}: stdout block {index} is not byte-identical")
    report["numerical_repeat_passed"] = not report["errors"]
    if require_all_files and not report["full_freeze_byte_identical"]:
        report["errors"].append("Full freeze is not byte-identical (including execution JSON and figure assets)")
    report["passed"] = not report["errors"]
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("first", type=Path)
    parser.add_argument("second", type=Path)
    parser.add_argument("--report", type=Path)
    parser.add_argument("--require-all-files", action="store_true",
                        help="Also require byte identity for every frozen JSON/figure/asset")
    args = parser.parse_args()
    report = compare_runs(args.first, args.second, require_all_files=args.require_all_files)
    if args.report:
        write_json(args.report, report)
    for error in report["errors"]:
        print(f"FAIL: {error}", file=sys.stderr)
    if report["passed"]:
        print(f"PASS: {report['stdout_blocks_checked']} stdout blocks are byte-identical; "
              "source, image, locked software, and execution identities match")
    if report["full_freeze_byte_identical"] is not None:
        print("FULL FREEZE: " + ("byte-identical" if report["full_freeze_byte_identical"] else "NOT byte-identical"))
        for difference in report["freeze_file_differences"]:
            print(f"  {difference['category']}: {difference['path']}")
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
