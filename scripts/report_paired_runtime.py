#!/usr/bin/env python3
"""Describe source-bound Linux/Mac paired evidence; never approve a tolerance.

This is an offline reporting tool. It neither executes the manuscript nor writes
its freeze, source, acceptance ledger, or runtime configuration. A successful
exit means the input evidence was valid and a report was written, NOT that the
two runtimes reproduced one another or passed the existing numerical gates.
"""
from __future__ import annotations

import argparse
from decimal import Decimal, ROUND_CEILING, localcontext
import json
from pathlib import Path
import sys

from audit_paired_evidence import audit_evidence, validate_payload
from compare_freeze_runs import validate_fingerprint
from freeze_provenance import json_digest, sha256, write_json
from paired_seed_drift import paired_report
from run_canonical_freeze import check_completed

D = Decimal
ROOT = Path(__file__).resolve().parents[1]
WARNING = (
    "Report-only proposals from these observed pairs, not universal error bounds, "
    "not canonical repeat verification, and not approval to change acceptance "
    "thresholds. Seed SD describes the fixed seed panel; it is not a tolerance."
)
PROTECTED = {
    "ch13_row_normalization": {"strict_upper_bound": "0.000001", "proposal": None},
    "ch19_existing_numeric_gate": {"absolute_tolerance": "0.000002", "changed": False},
    "source_protocol_seed_and_parameter_identities": "exact",
    "within_runtime_initialization_schedule_and_crosschapter_baseline": "exact",
    "cross_runtime_initialization_and_schedule_hashes": "recorded observations; determine interpretation, not report eligibility",
    "oracle_across_seed_sd": "identity/sanity statistic; no calibrated proposal",
    "canonical_repeat": "remains exact; this report cannot promote a freeze",
}


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def number(value) -> Decimal:
    result = D(str(value))
    require(result.is_finite(), "Nonfinite measurement")
    return result


def mean(values: list[Decimal]) -> Decimal:
    require(bool(values), "Empty measurement population")
    return sum(values, D(0)) / D(len(values))


def sample_sd(values: list[Decimal]) -> Decimal:
    require(len(values) > 1, "Sample SD requires actual replicate seeds")
    center = mean(values)
    return (sum(((value - center) ** 2 for value in values), D(0)) / D(len(values) - 1)).sqrt()


def field(name: str, canonical, local, *, statistic: str, unit: str,
          precision: int, population: str, seeds: list[int], origin: str,
          identity: bool = False, existing_gate: str | None = None) -> dict:
    before, after = number(canonical), number(local)
    delta = after - before
    quantum = D(1).scaleb(-precision)
    candidate = None if identity else (D(2) * abs(delta)).quantize(quantum, rounding=ROUND_CEILING)
    return {
        "name": name, "statistic": statistic, "unit": unit,
        "population": population, "seeds": seeds, "origin": origin,
        "canonical": str(before), "local": str(after),
        "signed_local_minus_canonical": str(delta), "absolute_difference": str(abs(delta)),
        "printed_quantum": str(quantum),
        "report_only_candidate_atol": None if candidate is None else str(candidate),
        "identity_or_sanity_field": identity,
        "identity_differs": identity and delta != 0,
        "existing_gate_retained": existing_gate,
        "candidate_exceeds_existing_gate": (candidate > D(existing_gate)
                                            if candidate is not None and existing_gate else None),
        "applied": False,
    }


def record_map(payload: dict) -> dict:
    return {(row["seed"], row["condition"], row["metric"]): number(row["value"])
            for row in payload["records"]}


def validate_within_runtime_baseline(payloads: dict) -> dict:
    """The Chapter 13 fixed baseline must reproduce Chapter 11 TF in each run.

    This is not a Linux/Mac equality gate. The same-runtime chapter callback is
    part of the experiment's internal control and stays exact, including the
    actual endpoint counts and checkpoint curves.
    """
    first, second = payloads["ch11"], payloads["ch13"]
    require(first["seed_set"] == second["seed_set"] and first["protocol"] == second["protocol"],
            "Within-runtime Chapter 11/13 baseline seed/protocol mismatch")
    identities = [{row["seed"]: {key: row[key] for key in ("initialization", "schedule")}
                   for row in payload["identities"] if row["condition"] == condition}
                  for payload, condition in ((first, "TF"), (second, "fixed"))]
    require(identities[0] == identities[1],
            "Within-runtime Chapter 11 TF / Chapter 13 fixed initialization/schedule mismatch")
    records = [{(row["seed"], row["metric"]): row["value"] for row in payload["records"]
                if row["condition"] == condition}
               for payload, condition in ((first, "TF"), (second, "fixed"))]
    require(records[0] == records[1],
            "Within-runtime Chapter 11 TF / Chapter 13 fixed errors/accuracy/curves mismatch")
    return {"passed": True, "seeds": first["seed_set"],
            "conditions": ["Chapter 11 TF", "Chapter 13 fixed"],
            "checked": ["protocol", "initialization", "schedule", "test_errors", "test_accuracy", "validation_curves"]}


def realized_input_comparison(study: str, canonical: dict, local: dict) -> dict:
    """Match seed labels, retaining rather than excusing realized-input changes."""
    observations = []
    if study in {"ch11", "ch13"}:
        by_key = [{(row["seed"], row["condition"]): row for row in payload["identities"]}
                  for payload in (canonical, local)]
        require(by_key[0].keys() == by_key[1].keys(), "Cross-runtime seed/condition labels differ")
        for key in sorted(by_key[0]):
            before, after = by_key[0][key], by_key[1][key]
            observations.append({"seed": key[0], "condition": key[1],
                                 "canonical": {name: before[name] for name in ("initialization", "schedule")},
                                 "local": {name: after[name] for name in ("initialization", "schedule")},
                                 "initialization_identical": before["initialization"] == after["initialization"],
                                 "schedule_identical": before["schedule"] == after["schedule"]})
    controlled = bool(observations) and all(row["initialization_identical"] and row["schedule_identical"]
                                            for row in observations)
    return {"pairing": "same predeclared seed and condition labels; no dropping or re-pairing seeds",
            "scope": ("recorded-initialization-and-schedule-controlled runtime difference" if controlled
                      else "same-seed end-to-end runtime difference"),
            "realized_initialization_and_schedule_recorded": bool(observations),
            "all_recorded_realizations_identical": controlled if observations else None,
            "observations": observations,
            "interpretation": ("Recorded initial parameter bytes and batch orders match. This does not by itself isolate roundoff "
                               "or prove every other random draw is identical." if controlled else
                               "The report includes changed realized initialization and/or batch order where flagged; "
                               "it is not a numerical-kernel-only or isolated-roundoff comparison." if observations else
                               "Initialization and batch-order hashes were not retained for this study; same seed labels "
                               "do not establish identical realized random inputs or isolated roundoff.")}


def raw_pairs(spec: dict, canonical: dict, local: dict, provenance: dict) -> dict:
    """Reuse the established same-seed pairing checks, not its per-seed bounds.

    Ch19's printed fields are stored aggregates, not the maximum raw seed drift.
    Consequently raw records deliberately carry no acceptance-bound proposal.
    """
    metrics = {f"{condition} / {metric}": {
        "identity": False, "decimal_places": 9, "unit": "raw retained units",
        "population": json.dumps(spec["protocol"], sort_keys=True),
        "field_target": "per-seed-value",
    } for condition in spec["conditions"] for metric in spec["metrics"]}
    plan = {"schema_version": 1, "safety_factor": "2.0", "seeds": spec["seeds"],
            "metrics": metrics, "computation_sha256": provenance["computation_sha256"],
            "protocol_sha256": json_digest(spec["protocol"])}
    artifacts = []
    for payload, label in ((canonical, "canonical"), (local, "local")):
        artifacts.append({"plan_sha256": json_digest(plan),
                          "computation_sha256": plan["computation_sha256"],
                          "protocol_sha256": plan["protocol_sha256"],
                          "fingerprint_sha256": provenance[f"{label}_fingerprint_sha256"],
                          "rows": [{"seed": row["seed"], "metric": f'{row["condition"]} / {row["metric"]}',
                                    "value": str(row["value"])} for row in payload["records"]]})
    paired = paired_report(plan, *artifacts)
    result = {}
    for key, item in paired["metrics"].items():
        pairs = item["pairs"]
        for pair in pairs:
            pair["signed_local_minus_canonical"] = str(D(pair["local"]) - D(pair["canonical"]))
        result[key] = {"pairs": pairs,
                       "max_absolute_paired_difference": item["max_absolute_paired_difference"],
                       "absolute_difference_of_seed_means": item["absolute_difference_of_seed_means"],
                       "unit": "raw retained units", "bound_proposed": False}
    return result


def compare_study(study: str, spec: dict, canonical: dict, local: dict, provenance: dict) -> dict:
    """Pure statistics on already retained payloads, with schema/identity checks."""
    for payload in (canonical, local):
        validate_payload(payload, spec, study, "html")
    if study == "ch13":
        require(canonical["parameters"] == local["parameters"], "Parameter identity differs")
    if study == "ch19":
        for payload in (canonical, local):
            oracle = {row["value"] for row in payload["records"] if row["metric"] == "oracle MSE"}
            require(len(oracle) == 1,
                    "Fixed-evaluation oracle differs across seeds/conditions; inspect the identity, not a tolerance")
    with localcontext() as context:
        context.prec = 50
        result = _study_statistics(study, spec, canonical, local, provenance)
    result["realized_input_comparison"] = realized_input_comparison(study, canonical, local)
    return result


def _study_statistics(study: str, spec: dict, canonical: dict, local: dict, provenance: dict) -> dict:
    maps = [record_map(payload) for payload in (canonical, local)]
    seeds, fields = spec["seeds"], []
    conditions = spec["conditions"]
    common = {"seeds": seeds, "origin": "Recomputed descriptive statistic of retained raw records (Decimal arithmetic)"}

    def series(condition, metric, scale=D(1)):
        return [[mapping[seed, condition, metric] * scale for seed in seeds] for mapping in maps]

    def summaries(name, vectors, unit, precision, population):
        for statistic, operation in (("mean", mean), ("sample_sd_correction_1", sample_sd)):
            fields.append(field(name, *(operation(values) for values in vectors), statistic=statistic,
                                unit=unit, precision=precision, population=population, **common))

    if study == "ch08":
        require(seeds == [6050], "Chapter 8 has one actual seed, not an inferred panel")
        for condition in conditions:
            for metric in spec["metrics"]:
                population = ("1000 fit examples" if metric == "fit_accuracy" else
                              "600 sealed test examples after refit on 1200 development examples"
                              if metric.startswith("test_") else "200 validation examples")
                fields.append(field(f"{condition} / {metric}",
                                    *(mapping[6050, condition, metric] * 100 for mapping in maps),
                                    statistic="single_seed_value", unit="percentage points", precision=1,
                                    population=population, **common))
    elif study in {"ch11", "ch13"}:
        for condition in conditions:
            for metric, scale, unit, precision in (("test_errors", D(1), "errors", 0),
                                                  ("test_accuracy", D(100), "percentage points", 2)):
                values = series(condition, metric, scale)
                for index, seed in enumerate(seeds):
                    fields.append(field(f"{condition} / {metric}", values[0][index], values[1][index],
                                        statistic="per_seed_value", unit=unit, precision=precision,
                                        population="437 sealed unambiguous test dates", seeds=[seed],
                                        origin="Retained integer error count or its retained derived accuracy"))
                summaries(f"{condition} / {metric}", values, unit, 2 if metric == "test_errors" else 3,
                          "five fixed training seeds, each evaluated on the same 437 test dates")
            for metric in spec["metrics"]:
                if metric.startswith("validation_epoch_"):
                    summaries(f"{condition} / {metric}", series(condition, metric, D(100)),
                              "percentage points", 2, "five fixed seeds; 400 validation dates per checkpoint")
        contrasts = [[(mapping[seed, conditions[1], "test_accuracy"] -
                       mapping[seed, conditions[0], "test_accuracy"]) * 100 for seed in seeds] for mapping in maps]
        name = f"{conditions[1]} minus {conditions[0]} / paired test accuracy"
        for index, seed in enumerate(seeds):
            fields.append(field(name, contrasts[0][index], contrasts[1][index], statistic="per_seed_contrast",
                                unit="percentage points", precision=3, population="same-seed 437-date comparison",
                                seeds=[seed], origin="Difference of retained same-seed accuracies"))
        summaries(name, contrasts, "percentage points", 3, "five paired seed contrasts on 437 test dates")
        if study == "ch11":
            fields.append(field("naive padding / errors", canonical["padding_witness"]["naive_errors"],
                                local["padding_witness"]["naive_errors"], statistic="single_seed_witness",
                                unit="errors", precision=0, population="437 sealed test dates",
                                seeds=[6050], origin="Retained naive-padding witness"))
        else:
            for metric in ("year_mass", "top_key_in_region"):
                values = [mean([number(x) for x in payload["routing"][metric]]) * 100
                          for payload in (canonical, local)]
                fields.append(field(f"routing / {metric}", *values, statistic="mean_over_1600_year_positions",
                                    unit="percentage points", precision=3,
                                    population="1600 year positions from 400 validation dates; one trained model",
                                    seeds=[6050], origin="Retained 1600 masses or binary top-key indicators"))
            fields.append(field("routing / row error", *(max(payload["routing"]["row_errors"])
                                for payload in (canonical, local)), statistic="maximum_over_400_calls",
                                unit="absolute row-sum error", precision=8, population="400 validation calls",
                                seeds=[6050], origin="Retained normalization errors; both must be strictly <1e-6",
                                identity=True, existing_gate="0.000001"))
            fields[-1]["printed_quantum"] = None
            fields[-1]["printed_format"] = ".2e (scientific notation); no calibrated proposal"
    elif study == "ch19":
        aggregates = [{(row["condition"], row["metric"]): row for row in payload["aggregates"]}
                      for payload in (canonical, local)]
        for condition in conditions:
            for metric in spec["metrics"]:
                for statistic in ("mean", "sample_sd"):
                    fields.append(field(f"{condition} / {metric}",
                                        *(aggregate[condition, metric][statistic] for aggregate in aggregates),
                                        statistic=statistic, unit="raw retained metric units", precision=9,
                                        population=("five training seeds; noise metrics use 50000 evaluation draws; "
                                                    "generation metrics use 20000 generated/target samples per seed"),
                                        seeds=seeds, origin="Actual retained float64 Torch aggregate, not re-reduced raw rows",
                                        identity=(metric == "oracle MSE" and statistic == "sample_sd"),
                                        existing_gate="0.000002"))
    else:
        raise ValueError(f"Unsupported study: {study}")
    return {"study": study, "unit": spec["unit"], "seeds": seeds,
            "protocol": spec["protocol"], "fields": fields,
            "raw_seed_pairs": raw_pairs(spec, canonical, local, provenance),
            "notes": (["No cross-seed SD: only seed 6050 was run."] if study == "ch08" else
                      ["Routing's 1600 positions are not 1600 training replicates; routing uses only seed 6050."]
                      if study == "ch13" else
                      ["Within-sample standard deviation uses correction 0; across-training-seed sample SD uses correction 1.",
                       "Printed aggregate proposals use actual stored float64 reductions, never the largest individual seed drift."]
                      if study == "ch19" else []),
            "proposals_applied": False}


def load_bundle(path: Path, *, source_root: Path, plan_path: Path, expected_kind: str) -> dict:
    path = path.resolve()
    provenance = path / "provenance"
    fingerprint_path = provenance / "fingerprint.json"
    document = json.loads(fingerprint_path.read_text())
    require(document.get("kind") == expected_kind, f"Expected {expected_kind} fingerprint: {fingerprint_path}")
    require(json.loads((path / "status.json").read_text()).get("passed") is True,
            f"Bundle does not record completed execution: {path}")
    errors = validate_fingerprint(document, path / "_freeze", provenance_root=provenance,
                                  allow_local=expected_kind == "local")
    require(not errors, f"Invalid {path}: {'; '.join(errors)}")
    completion = check_completed(source_root, path / "_freeze", document["execution_plan"],
                                 provenance / "kernel-startup")
    manifest = audit_evidence(provenance / "paired-evidence", source_root, plan_path)
    require(manifest == document["paired_evidence"]["manifest"], "Revalidated paired manifest differs")
    specification = json.loads(plan_path.read_text())
    payloads = {study: json.loads((provenance / "paired-evidence" / Path(spec["unit"]).with_suffix("") /
                                  "html" / f"{study}.json").read_text())
                for study, spec in specification["studies"].items()}
    completion["within_runtime_crosschapter_baseline"] = validate_within_runtime_baseline(payloads)
    return {"path": path, "fingerprint": document, "payloads": payloads,
            "completion": completion,
            "artifacts": {"fingerprint": {"path": str(fingerprint_path), "sha256": sha256(fingerprint_path)},
                          "manifest": {"path": str(provenance / "paired-evidence-manifest.json"),
                                       "sha256": sha256(provenance / "paired-evidence-manifest.json")},
                          "sidecars": [{"path": str(provenance / "paired-evidence" / relative), "sha256": value}
                                       for relative, value in sorted(manifest["files_sha256"].items())]}}


def compare_bundles(canonical_path: Path, local_paths: dict[str, Path], source_root: Path, plan_path: Path) -> dict:
    plan = json.loads(plan_path.read_text())
    require(set(plan["studies"]) == {"ch08", "ch11", "ch13", "ch19"}, "Unknown study plan")
    require(plan["safety_factor"] == "2.0", "Changed proposal safety factor")
    canonical = load_bundle(canonical_path, source_root=source_root, plan_path=plan_path, expected_kind="canonical")
    require(local_paths, "At least one named native local bundle is required")
    comparisons = {}
    for label, path in local_paths.items():
        local = load_bundle(path, source_root=source_root, plan_path=plan_path, expected_kind="local")
        left, right = canonical["fingerprint"], local["fingerprint"]
        require(left["run"]["id"] != right["run"]["id"], "Canonical and local run IDs must differ")
        for name, before, after in (
            ("source commit", left["source"]["commit"], right["source"]["commit"]),
            ("source input", left["source"]["files_sha256"], right["source"]["files_sha256"]),
            ("execution plan", left["execution_plan"], right["execution_plan"]),
        ):
            require(before == after, f"{label}: {name} identity differs")
        provenance = {"computation_sha256": left["source"]["input_sha256"],
                      "canonical_fingerprint_sha256": canonical["artifacts"]["fingerprint"]["sha256"],
                      "local_fingerprint_sha256": local["artifacts"]["fingerprint"]["sha256"]}
        comparisons[label] = {
            "local_artifacts": local["artifacts"], "local_run_id": right["run"]["id"],
            "local_cpu": right["cpu"], "local_runtime": right["runtime"],
            "completion": local["completion"],
            "studies": {study: compare_study(study, spec, canonical["payloads"][study],
                                               local["payloads"][study], provenance)
                        for study, spec in plan["studies"].items()},
        }
    return {"schema_version": 1, "policy": "report-only-source-bound-paired-runtime-statistics",
            "evidence_validated": True, "numeric_parity_passed": None, "thresholds_modified": False,
            "warning": WARNING, "protected_gates": PROTECTED, "safety_factor": "2.0",
            "plan_interpretation": (
                "The plan's exact initialization/schedule controls apply within each runtime and to canonical repeats. "
                "For native cross-runtime reporting, seed/protocol/source identities remain exact, while hashes of "
                "the realized initial parameters and batch orders are retained and flagged. Differences include "
                "any flagged random-input realization changes; no numerical-only claim or tolerance change follows."),
            "source_commit": canonical["fingerprint"]["source"]["commit"],
            "source_input_sha256": canonical["fingerprint"]["source"]["input_sha256"],
            "source_files": [{"path": str(source_root / relative), "sha256": value}
                             for relative, value in canonical["fingerprint"]["paired_evidence"]["manifest"]["source_sha256"].items()],
            "plan": {"path": str(plan_path.resolve()), "sha256": sha256(plan_path)},
            "reporter": {"path": str(Path(__file__).resolve()), "sha256": sha256(Path(__file__)),
                         "field_statistics_schema": 1},
            "canonical_artifacts": canonical["artifacts"],
            "canonical_run_id": canonical["fingerprint"]["run"]["id"],
            "canonical_cpu": canonical["fingerprint"]["cpu"],
            "canonical_runtime": canonical["fingerprint"]["runtime"], "comparisons": comparisons}


def markdown_report(report: dict) -> str:
    lines = ["# Paired runtime observations", "", report["warning"], "",
             f"Source: `{report['source_commit']}`. Evidence validated; numerical acceptance was not decided.", "",
             "Existing Chapter 19 `2e-6` gates and Chapter 13 strict row-normalization `<1e-6` remain unchanged.",
             "The JSON contains every named field and raw same-seed pair; this summary selects the largest field discrepancy per study.", ""]
    for label, comparison in report["comparisons"].items():
        cpu, runtime = comparison["local_cpu"], comparison["local_runtime"]
        lines += [f"## {label}", "",
                  f"Observed runtime: {cpu['system']} {cpu['machine']}; Python {runtime['python']['version']}; "
                  f"Torch {runtime['torch']['version']}; probe intra/inter-op threads "
                  f"{runtime['torch']['num_threads']}/{runtime['torch']['num_interop_threads']}.", "",
                  "| Study | Largest named field discrepancy | Absolute difference | Report-only proposal |",
                  "|---|---|---:|---:|"]
        for study, result in comparison["studies"].items():
            eligible = [item for item in result["fields"] if not item["identity_or_sanity_field"]]
            # Units differ within Ch11/13/19: choose by printed-quantum count,
            # not by comparing raw errors, probability points, and MSE directly.
            chosen = max(eligible, key=lambda item: D(item["absolute_difference"]) / D(item["printed_quantum"]))
            lines.append(f"| {study} | {chosen['name']} ({chosen['statistic']}) | "
                         f"{D(chosen['absolute_difference']):.6g} {chosen['unit']} | {chosen['report_only_candidate_atol']} |")
        lines += ["", "Selection uses discrepancy in units of each field's printed precision, not raw cross-metric magnitude.", "",
                  f"Local fingerprint: `{comparison['local_artifacts']['fingerprint']['path']}`",
                  f"SHA-256: `{comparison['local_artifacts']['fingerprint']['sha256']}`", ""]
        for study, result in comparison["studies"].items():
            scope = result["realized_input_comparison"]
            mismatches = sum(not row["initialization_identical"] or not row["schedule_identical"]
                             for row in scope["observations"])
            lines += [f"{study}: {scope['scope']}. " +
                      (f"{mismatches}/{len(scope['observations'])} seed/condition pairs have a changed recorded realization."
                       if scope["observations"] else "Realization hashes were not retained."), ""]
        exceeds = sum(item["candidate_exceeds_existing_gate"] is True
                      for study in comparison["studies"].values() for item in study["fields"])
        if exceeds:
            lines += [f"{exceeds} proposals exceed an existing protected gate. They require author review; none is applied.", ""]
    lines += ["## Provenance and limits", "",
              f"Canonical fingerprint: `{report['canonical_artifacts']['fingerprint']['path']}`",
              f"SHA-256: `{report['canonical_artifacts']['fingerprint']['sha256']}`", "",
              f"Analysis script SHA-256: `{report['reporter']['sha256']}`", "",
              "The JSON binds original fingerprint, manifest, and all eight raw-sidecar file hashes for every run. "
              "Source, protocols, seed panels, parameter identities, native-cell coverage, within-runtime "
              "TF/FR pairing and the Chapter 11 TF / Chapter 13 fixed baseline, and HTML/LaTeX parity were checked "
              "before comparison. Cross-runtime initialization and schedule hashes are recorded and flagged, "
              "not silently assumed equal. Even matching hashes do not establish isolated roundoff.", "",
              "No training, tolerance update, or freeze promotion was performed. Cross-platform observations "
              "do not prove a universal numerical bound. Chapter 8 and routing have only one actual training seed; "
              "Chapter 19 uses the retained float64 aggregate fields. Seed SD is descriptive, not an acceptance margin.", ""]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--canonical", type=Path, required=True)
    parser.add_argument("--local", action="append", required=True, metavar="LABEL=PATH")
    parser.add_argument("--source-root", type=Path, default=ROOT)
    parser.add_argument("--plan", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--markdown", type=Path)
    args = parser.parse_args()
    try:
        locals_ = {}
        for item in args.local:
            label, separator, path = item.partition("=")
            require(bool(separator and label and path) and label not in locals_, "Use unique --local LABEL=PATH pairs")
            locals_[label] = Path(path)
        plan = args.plan or args.source_root / "docs/paired-evidence-plan.json"
        report = compare_bundles(args.canonical, locals_, args.source_root, plan)
        write_json(args.output, report)
        target = args.markdown or args.output.with_suffix(".md")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(markdown_report(report))
    except (ValueError, KeyError, TypeError, OSError, ArithmeticError) as exc:
        print(f"FAIL: no calibration proposal accepted: {exc}", file=sys.stderr)
        return 1
    print(f"Recorded report-only proposals in {args.output}; no acceptance gate or manuscript was changed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
