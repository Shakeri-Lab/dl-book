#!/usr/bin/env python3
"""Report uncontainerized native execution without promoting a new reference.

Numerical drift is a failed portability contract, not a failed publication job.
Missing evidence, changed source, unsupported schemas, and execution errors stay
blocking. Runtime observations describe probe processes, not inferred kernels.
"""
from __future__ import annotations
import argparse
from contextlib import chdir
from datetime import datetime, timezone
import difflib
import json
import math
import os
from pathlib import Path
import subprocess
import sys
import traceback

from audit_frozen_stdout import git_html_paths, git_text, native_execution_ordinals, stdout_records
from freeze_provenance import (CI_KEYS, cpu_observation, execution_plan,
                               runtime_observation, source_fingerprint, write_json)
from notebook_manifest import UNITS_BY_SOURCE
from notebook_stdout_contracts import (STRUCTURAL_RULES, _number_parts,
                                      _structural_errors, compare_stdout_blocks)


def observation(root):
    return {"kind": "native-portability-probe", "created_utc": datetime.now(timezone.utc).isoformat(),
            "source": source_fingerprint(root), "runtime": runtime_observation(),
            "cpu": cpu_observation(), "ci": {key: os.environ.get(key) for key in CI_KEYS},
            "quarto": subprocess.check_output(["quarto", "--version"], text=True).strip()}


def prepare(root: Path, output: Path):
    before = observation(root)
    if before["source"]["dirty"] is not False:
        raise ValueError("Native audit requires a clean source checkout")
    write_json(output / "before.json", before)
    write_json(output / "execution-plan.json", execution_plan(root, before["source"]))
    baseline = {}
    with chdir(root):
        for path in git_html_paths(before["source"]["commit"]):
            raw = git_text(before["source"]["commit"], path)
            if raw is None:
                raise ValueError(f"Missing committed baseline: {path}")
            baseline[path.as_posix()] = stdout_records(raw)
            write_json(output / "baseline-execution-json" / path.relative_to("_freeze"), json.loads(raw))
    if not baseline:
        raise ValueError("Committed reference has no native HTML execution results")
    write_json(output / "baseline-stdout.json", baseline)


def compare_unit(source: str, baseline: list, current: list) -> dict:
    """Separate supported numerical drift from invalid/unknown output schemas."""
    expected = [text for _, text in baseline]
    actual = [text for _, text in current]
    expected_ordinals = [ordinal for ordinal, _ in baseline]
    actual_ordinals = [ordinal for ordinal, _ in current]
    result = {"validation_errors": [], "contract_errors": [], "accepted_deviations": []}
    if expected_ordinals != actual_ordinals or len(expected) != len(actual):
        result["validation_errors"].append(f"{source}: stdout block/ordinal coverage changed")
        return result
    unit = UNITS_BY_SOURCE.get(source)
    slug = unit.slug if unit else None
    current_date = False
    if slug in {"11-encoder-decoder", "13-attention"}:
        from date_study_schema import is_current_date_study, validate_date_stdout_schema
        current_date = is_current_date_study(slug, actual)
        if current_date:
            result["validation_errors"].extend(validate_date_stdout_schema(slug, actual, actual_ordinals))
            result["validation_errors"].extend(validate_date_stdout_schema(slug, expected, expected_ordinals))
    for index, (left, right) in enumerate(zip(expected, actual), 1):
        if left == right or current_date:
            continue
        key = (slug, index)
        if key in STRUCTURAL_RULES:
            # An unrecognized structural output cannot be excused as float drift.
            result["validation_errors"].extend(_structural_errors(slug, index, left, right, actual))
            continue
        left_schema, left_numbers = _number_parts(left)
        right_schema, right_numbers = _number_parts(right)
        if left_schema != right_schema or len(left_numbers) != len(right_numbers):
            result["validation_errors"].append(f"{source} block {index}: unsupported output schema change")
        elif any(not math.isfinite(float(value.replace(",", "").removesuffix("%"))) for value in right_numbers):
            result["validation_errors"].append(f"{source} block {index}: non-finite numerical output")
    if result["validation_errors"]:
        return result
    if slug:
        comparison = compare_stdout_blocks(slug, expected, actual,
                                            expected_ordinals=expected_ordinals,
                                            actual_ordinals=actual_ordinals)
        result["contract_errors"] = list(comparison.errors)
        result["accepted_deviations"] = list(comparison.accepted_deviations)
    elif baseline != current:
        result["contract_errors"].append(f"{source}: differs from exact committed stdout")
    return result


def finish(root: Path, output: Path, execution_outcome: str) -> dict:
    report = {"kind": "native-portability", "status": "validation-error", "blocking": True,
              "contract_passed": False, "canonical_identity_claim": False,
              "execution_outcome": execution_outcome, "validation_errors": [],
              "contract_errors": [], "accepted_deviations": [], "changed_units": [],
              "promotion": "not performed"}
    before = json.loads((output / "before.json").read_text())
    after = observation(root)
    write_json(output / "after.json", after)
    if before["source"] != after["source"]:
        report["validation_errors"].append("Source/input identity changed during native execution")
    if execution_outcome != "success":
        report["validation_errors"].append(f"Native execution did not succeed: {execution_outcome}")
    baseline = json.loads((output / "baseline-stdout.json").read_text())
    plan = json.loads((output / "execution-plan.json").read_text())
    expected_paths = {"_freeze/" + str(Path(unit).with_suffix("")) + "/execute-results/html.json"
                      for unit in plan["units"]}
    paths = sorted((root / "_freeze").glob("**/execute-results/html.json"))
    current = {}
    for path in paths:
        name = path.relative_to(root).as_posix()
        try:
            raw = path.read_text()
            write_json(output / "fresh-execution-json" / path.relative_to(root / "_freeze"), json.loads(raw))
            current[name] = stdout_records(raw)
            source = str(Path(name).relative_to("_freeze").parent.parent) + ".qmd"
            if source not in plan["units"]:
                raise ValueError(f"Unplanned native execution: {source}")
            wanted = list(range(1, len(plan["units"][source]["native_cells_sha256"]) + 1))
            if native_execution_ordinals(raw) != wanted:
                raise ValueError(f"Incomplete native-cell execution: {source}")
        except (OSError, ValueError, KeyError, TypeError) as exc:
            report["validation_errors"].append(str(exc))
    write_json(output / "fresh-stdout.json", current)
    if set(current) != expected_paths or set(baseline) != expected_paths:
        report["validation_errors"].append("Planned, committed, and freshly executed unit coverage differs")
    for name in sorted(set(current) & set(baseline)):
        # JSON roundtrip keeps both records in the same list-of-pairs form.
        records = json.loads(json.dumps(current[name]))
        source = str(Path(name).relative_to("_freeze").parent.parent) + ".qmd"
        if records != baseline[name]:
            report["changed_units"].append(source)
            def transcript(items):
                return "".join(f"[native cell {ordinal}]\n{text}" for ordinal, text in items).splitlines(keepends=True)
            diff = "".join(difflib.unified_diff(transcript(baseline[name]), transcript(records),
                                             fromfile="committed/" + source, tofile="native/" + source))
            target = output / "stdout-diffs" / (source.replace("/", "--") + ".diff")
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(diff)
        result = compare_unit(source, baseline[name], records)
        for key in ("validation_errors", "contract_errors", "accepted_deviations"):
            report[key].extend(result[key])
    if not report["validation_errors"]:
        report["blocking"] = False
        report["contract_passed"] = not report["contract_errors"]
        report["status"] = "pass" if report["contract_passed"] else "drift"
    report["units_checked"] = len(current)
    return report


def summary(report: dict) -> str:
    status = report["status"]
    if status == "pass":
        headline = "Native portability audit: reviewed stdout contracts satisfied"
    elif status == "drift":
        headline = "Native portability audit: DRIFT — contract did not pass (non-blocking)"
    else:
        headline = "Native portability audit: VALIDATION/EXECUTION ERROR (blocking)"
    lines = ["## " + headline, "", "This is uncontainerized Ubuntu evidence, not canonical same-image verification.",
             "No frozen reference or publication artifact was replaced.", "",
             "Download the native-portability-report artifact for before/after source/runtime/CPU observations, "
             "raw execution JSON, stdout, and diffs.", ""]
    for key in ("validation_errors", "contract_errors", "accepted_deviations"):
        if report.get(key):
            lines.extend([key.replace("_", " ").capitalize() + ":", ""])
            lines.extend("- " + message for message in report[key])
            lines.append("")
    if status == "drift":
        lines.append("Action: inspect the named fields and runtime changes; do not update the reference or widen tolerances automatically.")
    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("prepare", "finish"))
    parser.add_argument("--root", type=Path, default=Path("."))
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--execution-outcome", default="unknown")
    args = parser.parse_args()
    root, output = args.root.resolve(), args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    try:
        if args.mode == "prepare":
            prepare(root, output)
            return 0
        report = finish(root, output, args.execution_outcome)
    except Exception as exc:
        (output / "error.log").write_text(traceback.format_exc())
        report = {"kind": "native-portability", "status": "validation-error", "blocking": True,
                  "contract_passed": False, "canonical_identity_claim": False,
                  "validation_errors": [f"{type(exc).__name__}: {exc}"],
                  "contract_errors": [], "accepted_deviations": [], "promotion": "not performed"}
    write_json(output / "report.json", report)
    markdown = summary(report)
    (output / "summary.md").write_text(markdown)
    print(markdown)
    if os.environ.get("GITHUB_ACTIONS") == "true" and report["status"] == "drift":
        print("::warning title=Native portability contract drift::"
              "The reviewed stdout contract did not pass. Inspect the native-portability-report "
              "artifact and job summary; no reference was promoted.")
    return 2 if report["blocking"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
