#!/usr/bin/env python3
"""Validate source-bound raw paired evidence; never write acceptance tolerances."""
from __future__ import annotations

import argparse
import hashlib
import itertools
import json
import math
from pathlib import Path
import re
import statistics

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PLAN = ROOT / "docs/paired-evidence-plan.json"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def numeric(value) -> bool:
    return type(value) in (int, float) and math.isfinite(value)


def validate_payload(payload: dict, specification: dict, study: str, fmt: str) -> None:
    require(payload.get("schema_version") == 1 and payload.get("study") == study,
            "Wrong evidence schema or study")
    require(payload.get("unit") == specification["unit"] and payload.get("format") == fmt,
            "Evidence unit/format does not match its declared execution")
    require(payload.get("seed_set") == specification["seeds"], "Missing/reordered seed panel")
    require(payload.get("protocol") == specification["protocol"], "Evidence protocol drift")
    expected = set(itertools.product(specification["seeds"], specification["conditions"], specification["metrics"]))
    records = payload.get("records", [])
    observed = []
    for row in records:
        require(set(row) == {"seed", "condition", "metric", "value"}, "Invalid evidence record schema")
        key = (row["seed"], row["condition"], row["metric"])
        require(key in expected and numeric(row["value"]), "Unexpected/nonfinite raw metric")
        observed.append(key)
        if row["metric"] == "test_errors":
            require(type(row["value"]) is int and 0 <= row["value"] <= 437, "Invalid integer error count")
        elif study != "ch19":
            require(0 <= row["value"] <= 1, "Accuracy outside [0, 1]")
    require(set(observed) == expected and len(observed) == len(expected), "Missing/duplicate paired records")
    lookup = {(row["seed"], row["condition"], row["metric"]): row["value"] for row in records}
    if study in {"ch11", "ch13"}:
        identities = payload.get("identities", [])
        pairs = {(row.get("seed"), row.get("condition")) for row in identities}
        wanted = set(itertools.product(specification["seeds"], specification["conditions"]))
        require(pairs == wanted and len(identities) == len(wanted), "Missing/duplicate protocol identities")
        for row in identities:
            require(set(row) == {"seed", "condition", "initialization", "schedule"}
                    and all(re.fullmatch(r"[0-9a-f]{64}", str(row.get(key, ""))) for key in ("initialization", "schedule")),
                    "Missing initialization/schedule digest")
        for seed in specification["seeds"]:
            pair = [row for row in identities if row["seed"] == seed]
            require(pair[0]["schedule"] == pair[1]["schedule"], "Unpaired schedule")
            if study == "ch11":
                require(pair[0]["initialization"] == pair[1]["initialization"], "Unpaired TF/FR initialization")
            for condition in specification["conditions"]:
                require(lookup[seed, condition, "test_accuracy"] == 1 - lookup[seed, condition, "test_errors"] / 437,
                        "Test accuracy does not derive from integer errors")
    if study == "ch11":
        witness = payload.get("padding_witness", {})
        require(witness.get("seed") == 6050 and type(witness.get("naive_errors")) is int
                and 0 <= witness["naive_errors"] <= 437, "Invalid padding witness")
    if study == "ch13":
        routing = payload.get("routing", {})
        require(routing.get("seed") == 6050, "Routing is a single predeclared seed, not five seeds")
        for key, count in (("year_mass", 1600), ("top_key_in_region", 1600), ("row_errors", 400)):
            values = routing.get(key, [])
            require(len(values) == count and all(numeric(value) for value in values), "Wrong routing population")
            if key == "top_key_in_region":
                require(all(type(value) is int and value in (0, 1) for value in values), "Top-key indicators must be binary")
            elif key == "row_errors":
                require(all(0 <= value < 1e-6 for value in values), "Normalization identity failed")
            else:
                require(all(0 <= value <= 1 + 1e-6 for value in values), "Year-region mass out of range")
        from date_study_schema import parameter_counts
        fixed, attention = parameter_counts()
        require(payload.get("parameters") == {"fixed": fixed, "attention": attention}, "Parameter identity changed")
    if study == "ch19":
        aggregates = payload.get("aggregates", [])
        wanted = set(itertools.product(specification["conditions"], specification["metrics"]))
        observed_aggregates = []
        for row in aggregates:
            require(set(row) == {"condition", "metric", "mean", "sample_sd"}, "Invalid aggregate schema")
            key = row["condition"], row["metric"]
            require(key in wanted and numeric(row["mean"]) and numeric(row["sample_sd"]), "Invalid aggregate")
            values = [lookup[seed, *key] for seed in specification["seeds"]]
            # Sanity-check retention only; this is not a cross-runtime tolerance.
            require(math.isclose(row["mean"], statistics.mean(values), rel_tol=1e-12, abs_tol=1e-15)
                    and math.isclose(row["sample_sd"], statistics.stdev(values), rel_tol=1e-12, abs_tol=1e-15),
                    "Aggregate does not summarize its declared seed panel")
            observed_aggregates.append(key)
        require(set(observed_aggregates) == wanted and len(observed_aggregates) == len(wanted), "Missing/duplicate aggregates")


def audit_evidence(evidence_root: Path, source_root: Path, plan_path: Path = DEFAULT_PLAN) -> dict:
    plan = json.loads(plan_path.read_text())
    require(plan.get("schema_version") == 1 and plan.get("safety_factor") == "2.0", "Undeclared evidence plan")
    files, sources, expected_paths, payloads = {}, {}, set(), {}
    for study, specification in plan["studies"].items():
        source = source_root / specification["unit"]
        require(source.is_file(), "Missing evidence source")
        require(f'#| label: {specification["export_cell"]}' in source.read_text(), "Export-cell/source mismatch")
        sources[specification["unit"]] = digest(source)
        for fmt in plan["formats"]:
            relative = Path(specification["unit"]).with_suffix("") / fmt / f"{study}.json"
            expected_paths.add(relative.as_posix())
            path = evidence_root / relative
            require(path.is_file() and not path.is_symlink()
                    and path.resolve().is_relative_to(evidence_root.resolve()),
                    f"Missing/unsafe paired evidence: {relative}")
            require(path.stat().st_size <= 250_000, "Evidence exceeds small-scalar-payload limit")
            payload = json.loads(path.read_text())
            validate_payload(payload, specification, study, fmt)
            payloads[study, fmt] = {key: value for key, value in payload.items() if key != "format"}
            files[relative.as_posix()] = digest(path)
        require(payloads[study, "latex"] == payloads[study, "html"], f"Cross-format raw evidence drift: {study}")
    actual = {path.relative_to(evidence_root).as_posix() for path in evidence_root.rglob("*.json")}
    require(actual == expected_paths, "Unexpected/missing evidence sidecars")
    return {"schema_version": 1, "passed": True, "plan_sha256": digest(plan_path),
            "source_sha256": sources, "files_sha256": files,
            "policy": "Raw paired evidence only; no tolerance changes or promotion"}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--evidence-root", type=Path, required=True)
    parser.add_argument("--source-root", type=Path, default=ROOT)
    parser.add_argument("--plan", type=Path, default=DEFAULT_PLAN)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    try:
        result = audit_evidence(args.evidence_root, args.source_root, args.plan)
    except (ValueError, OSError, KeyError, TypeError) as exc:
        parser.exit(1, f"FAIL: {exc}\n")
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n")
    print(f"PASS: {len(result['files_sha256'])} paired-evidence sidecars, exact HTML/LaTeX parity")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
