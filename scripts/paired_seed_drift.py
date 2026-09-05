#!/usr/bin/env python3
"""Report paired cross-platform discrepancies; never edit acceptance thresholds.

Input measurements contain one value per predeclared metric and seed, not only
five-seed averages. Each artifact binds the same computation/protocol and plan.
Identity metrics always retain a zero bound. Seed SD is not a portability bound.
"""

from __future__ import annotations

import argparse
from decimal import Decimal, InvalidOperation, ROUND_CEILING
import json
from pathlib import Path
import re
import sys
from typing import Any

from freeze_provenance import json_digest, sha256, write_json


def _value(raw: Any) -> Decimal:
    if not isinstance(raw, str):
        raise ValueError("Measurement values must be decimal strings")
    try:
        number = Decimal(raw)
    except InvalidOperation as exc:
        raise ValueError("Invalid decimal measurement") from exc
    if not number.is_finite():
        raise ValueError("Nonfinite measurement")
    return number


def paired_report(plan: dict[str, Any], canonical: dict[str, Any], local: dict[str, Any]) -> dict[str, Any]:
    """Derive descriptive candidate bounds from predeclared, complete pairs.

    No result from this function can pass the canonical repeat gate. The plan's
    metric identity flags and precision must be declared before measurement.
    """
    if plan.get("schema_version") != 1 or plan.get("safety_factor") != "2.0":
        raise ValueError("The predeclared plan must specify safety_factor as '2.0'")
    seeds = plan.get("seeds")
    metrics = plan.get("metrics")
    if (not isinstance(seeds, list) or not seeds
            or any(type(seed) is not int for seed in seeds) or len(set(seeds)) != len(seeds)):
        raise ValueError("Plan needs unique predeclared seeds")
    if not isinstance(metrics, dict) or not metrics:
        raise ValueError("Plan needs predeclared named metrics")
    for name, specification in metrics.items():
        if not isinstance(specification.get("identity"), bool):
            raise ValueError(f"{name}: identity-versus-measurement status must be explicit")
        precision = specification.get("decimal_places")
        if not isinstance(precision, int) or not 0 <= precision <= 20:
            raise ValueError(f"{name}: decimal_places must be predeclared")
        for key in ("unit", "population"):
            if not specification.get(key):
                raise ValueError(f"{name}: missing declared {key}")
        if specification.get("field_target") not in {"per-seed-value", "mean-over-declared-seeds"}:
            raise ValueError(f"{name}: declare the actual gated field_target")
    for key in ("computation_sha256", "protocol_sha256"):
        if not re.fullmatch(r"[0-9a-f]{64}", str(plan.get(key, ""))):
            raise ValueError(f"Plan needs {key}")
    pair_keys = {(seed, metric) for seed in seeds for metric in metrics}
    observations = []
    for label, artifact in (("canonical", canonical), ("local", local)):
        if artifact.get("plan_sha256") != json_digest(plan):
            raise ValueError(f"{label}: measurement does not bind the predeclared plan")
        for key in ("computation_sha256", "protocol_sha256"):
            if artifact.get(key) != plan[key]:
                raise ValueError(f"{label}: {key} differs; do not relax identity gates")
        if not re.fullmatch(r"[0-9a-f]{64}", str(artifact.get("fingerprint_sha256", ""))):
            raise ValueError(f"{label}: missing runtime fingerprint identity")
        rows = {}
        for row in artifact.get("rows", []):
            key = (row.get("seed"), row.get("metric"))
            if key in rows:
                raise ValueError(f"{label}: duplicate seed/metric pair")
            rows[key] = _value(row.get("value"))
        if rows.keys() != pair_keys:
            raise ValueError(f"{label}: incomplete or extra same-seed metric pairs")
        observations.append(rows)
    result = {
        "schema_version": 1, "policy": "report-only-paired-platform-drift",
        "plan_sha256": json_digest(plan), "safety_factor": "2.0",
        "warning": ("Descriptive bounds for these paired runs only, not universal guarantees "
                    "or automatic approval to change tolerances. Seed SD informs prose precision, "
                    "not portability acceptance. Canonical repeat and identity gates remain exact."),
        "metrics": {},
    }
    for metric, specification in metrics.items():
        pairs = [{"seed": seed, "canonical": str(observations[0][seed, metric]),
                  "local": str(observations[1][seed, metric]),
                  "absolute_difference": str(abs(observations[1][seed, metric] - observations[0][seed, metric]))}
                 for seed in seeds]
        maximum = max(Decimal(pair["absolute_difference"]) for pair in pairs)
        mean_difference = abs(
            sum(observations[1][seed, metric] - observations[0][seed, metric] for seed in seeds)
            / Decimal(len(seeds))
        )
        field_difference = (mean_difference if specification["field_target"] == "mean-over-declared-seeds"
                            else maximum)
        identity = specification["identity"]
        quantum = Decimal(1).scaleb(-specification["decimal_places"])
        candidate = Decimal(0) if identity else (field_difference * Decimal("2.0")).quantize(quantum, rounding=ROUND_CEILING)
        result["metrics"][metric] = {
            **specification, "pairs": pairs, "max_absolute_paired_difference": str(maximum),
            "absolute_difference_of_seed_means": str(mean_difference),
            "declared_field_absolute_difference": str(field_difference),
            "report_only_candidate_atol": str(candidate),
            "identity_violation": identity and maximum != 0,
        }
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--plan", type=Path, required=True)
    parser.add_argument("--canonical", type=Path, required=True)
    parser.add_argument("--local", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        report = paired_report(*(json.loads(path.read_text()) for path in (args.plan, args.canonical, args.local)))
        report["input_artifacts"] = {
            label: {"path": str(path), "sha256": sha256(path)}
            for label, path in (("plan", args.plan), ("canonical", args.canonical), ("local", args.local))
        }
        write_json(args.output, report)
    except (ValueError, KeyError, TypeError, OSError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1
    print("Recorded descriptive paired differences; no acceptance ledger was changed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
