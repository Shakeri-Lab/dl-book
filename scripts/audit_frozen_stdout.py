#!/usr/bin/env python3
"""Compare frozen stdout against a Git revision and across render formats."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path

from notebook_manifest import UNITS_BY_SOURCE
from notebook_stdout_contracts import compare_stdout_blocks


DIV_OPEN_RE = re.compile(r"^(:{3,})\s+\{([^}]*)\}\s*$")
DIV_CLOSE_RE = re.compile(r"^(:{3,})\s*$")
# Info strings may be bare (```python / ```text), not only Quarto attributes.
# Missing an opener makes its closing fence swallow the following real cell.
CODE_FENCE_RE = re.compile(r"^(`{3,}|~{3,})")
EXECUTION_COUNT_RE = re.compile(r"(?:^|\s)execution_count=(\d+)(?:\s|$)")


def stdout_records(raw_json: str) -> list[tuple[int, str]]:
    """Return ``(native cell ordinal, stdout)`` records from a freeze JSON.

    Quarto writes each executed native cell as a fenced div whose
    ``execution_count`` follows source order. Keeping that ordinal prevents a
    newly empty or newly noisy cell from silently inheriting the next stdout
    block's portability rule.
    """

    document = json.loads(raw_json)
    markdown = document["result"]["markdown"]
    stack: list[tuple[int, int | None]] = []
    code_fence: tuple[str, int] | None = None
    pending_stdout: tuple[int, list[str]] | None = None
    capturing_stdout = False
    records: list[tuple[int, str]] = []

    for line in markdown.splitlines(keepends=True):
        stripped = line.rstrip("\r\n")
        if pending_stdout is not None:
            ordinal, buffer = pending_stdout
            if not capturing_stdout:
                if stripped == "```":
                    capturing_stdout = True
                elif stripped:
                    raise ValueError("stdout div does not begin with a plain code fence")
                continue
            if stripped == "```":
                records.append((ordinal, "".join(buffer)))
                pending_stdout = None
                capturing_stdout = False
            else:
                buffer.append(line)
            continue

        if code_fence is not None:
            marker, width = code_fence
            if re.fullmatch(
                rf"{re.escape(marker)}{{{width},}}\s*",
                stripped,
            ):
                code_fence = None
            continue
        code_match = CODE_FENCE_RE.match(stripped)
        if code_match:
            marker = code_match.group(1)
            code_fence = (marker[0], len(marker))
            continue

        opened = DIV_OPEN_RE.fullmatch(stripped)
        if opened:
            attributes = opened.group(2)
            count_match = EXECUTION_COUNT_RE.search(attributes)
            own_ordinal = int(count_match.group(1)) if count_match else None
            stack.append((len(opened.group(1)), own_ordinal))
            if ".cell-output-stdout" in attributes.split():
                ordinal = next(
                    (candidate for _, candidate in reversed(stack) if candidate is not None),
                    None,
                )
                if ordinal is None:
                    raise ValueError("stdout div is not nested in an executed cell")
                pending_stdout = (ordinal, [])
            continue

        closed = DIV_CLOSE_RE.fullmatch(stripped)
        if closed and stack:
            width = len(closed.group(1))
            if width < stack[-1][0]:
                raise ValueError("fenced div closes with too few colons")
            stack.pop()

    if pending_stdout is not None or capturing_stdout:
        raise ValueError("unterminated stdout block in freeze JSON")
    return records


def stdout_blocks(raw_json: str) -> list[str]:
    return [text for _, text in stdout_records(raw_json)]


def native_execution_ordinals(raw_json: str) -> list[int]:
    """Read every executed native cell, including cells with no stdout."""
    markdown = json.loads(raw_json)["result"]["markdown"]
    result, code_fence = [], None
    for line in markdown.splitlines():
        if code_fence:
            marker, width = code_fence
            if re.fullmatch(rf"{re.escape(marker)}{{{width},}}\s*", line):
                code_fence = None
            continue
        match = CODE_FENCE_RE.match(line)
        if match:
            code_fence = (match.group(1)[0], len(match.group(1)))
            continue
        opened = DIV_OPEN_RE.fullmatch(line)
        if opened and ".cell" in opened.group(2).split():
            count = EXECUTION_COUNT_RE.search(opened.group(2))
            if count:
                result.append(int(count.group(1)))
    return result


def git_text(revision: str, path: Path) -> str | None:
    result = subprocess.run(
        ["git", "show", f"{revision}:{path.as_posix()}"],
        capture_output=True,
        text=True,
        check=False,
    )
    return result.stdout if result.returncode == 0 else None


def git_html_paths(revision: str) -> list[Path]:
    result = subprocess.run(
        ["git", "ls-tree", "-r", "--name-only", revision, "_freeze"],
        capture_output=True,
        text=True,
        check=True,
    )
    return [
        Path(line)
        for line in result.stdout.splitlines()
        if line.endswith("/execute-results/html.json")
    ]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="HEAD")
    parser.add_argument(
        "--policy",
        choices=("exact", "portable"),
        default="exact",
        help="comparison policy against --base; portable is exact by default",
    )
    parser.add_argument(
        "units",
        nargs="*",
        help="Freeze unit directories relative to _freeze; default is every unit.",
    )
    args = parser.parse_args()

    freeze_root = Path("_freeze")
    if args.units:
        unit_dirs = [freeze_root / unit for unit in args.units]
    else:
        unit_dirs = sorted(
            path.parent.parent
            for path in freeze_root.glob("**/execute-results/html.json")
        )

    failures: list[str] = []
    accepted_deviations: list[str] = []
    checked_pairs = 0
    stdout_total = 0
    current_by_path: dict[Path, tuple[list[str], list[int]]] = {}
    for unit_dir in unit_dirs:
        result_dir = unit_dir / "execute-results"
        html_path = result_dir / "html.json"
        tex_path = result_dir / "tex.json"
        if not html_path.exists():
            failures.append(f"{unit_dir}: missing html.json")
            continue

        html_records = stdout_records(html_path.read_text())
        html_ordinals = [ordinal for ordinal, _ in html_records]
        html_blocks = [text for _, text in html_records]
        stdout_total += len(html_blocks)
        current_by_path[html_path] = (html_blocks, html_ordinals)

        if tex_path.exists():
            tex_records = stdout_records(tex_path.read_text())
            tex_ordinals = [ordinal for ordinal, _ in tex_records]
            tex_blocks = [text for _, text in tex_records]
            checked_pairs += 1
            if tex_blocks != html_blocks or tex_ordinals != html_ordinals:
                failures.append(f"{unit_dir}: HTML/TeX stdout differs")

    if args.units:
        base_paths = [
            freeze_root / unit / "execute-results/html.json"
            for unit in args.units
        ]
    else:
        base_paths = git_html_paths(args.base)

    checked_base = 0
    base_path_set = set(base_paths)
    current_path_set = set(current_by_path)
    if base_path_set != current_path_set:
        failures.append(
            "frozen stdout unit set differs from "
            f"{args.base}: missing {sorted(base_path_set - current_path_set)}, "
            f"extra {sorted(current_path_set - base_path_set)}"
        )
    for base_path in base_paths:
        base_raw = git_text(args.base, base_path)
        if base_raw is not None:
            checked_base += 1
            baseline_records = stdout_records(base_raw)
            baseline_ordinals = [ordinal for ordinal, _ in baseline_records]
            baseline = [text for _, text in baseline_records]
            current_record = current_by_path.get(base_path)
            if current_record is None:
                continue
            current, current_ordinals = current_record
            if baseline != current or baseline_ordinals != current_ordinals:
                relative_unit = base_path.parent.parent.relative_to(freeze_root)
                source = relative_unit.with_suffix(".qmd").as_posix()
                unit = UNITS_BY_SOURCE.get(source)
                portability = (
                    compare_stdout_blocks(
                        unit.slug,
                        baseline,
                        current,
                        expected_ordinals=baseline_ordinals,
                        actual_ordinals=current_ordinals,
                    )
                    if args.policy == "portable" and unit is not None
                    else None
                )
                if portability is not None and portability.passed:
                    accepted_deviations.extend(portability.accepted_deviations)
                    continue
                if portability is not None:
                    failures.extend(portability.errors)
                    continue
                if baseline == current and baseline_ordinals != current_ordinals:
                    failures.append(
                        f"{base_path}: stdout moved between native cells: expected "
                        f"{baseline_ordinals}, got {current_ordinals}"
                    )
                    continue
                first_difference = next(
                    (
                        index
                        for index, (before, after) in enumerate(
                            zip(baseline, current), start=1
                        )
                        if before != after
                    ),
                    min(len(baseline), len(current)) + 1,
                )
                failures.append(
                    f"{base_path}: ordered stdout differs from {args.base} "
                    f"at block {first_difference} "
                    f"({len(current)} current, {len(baseline)} baseline)"
                )

    if failures:
        for failure in failures:
            print(failure)
        print(f"FAILED: {len(failures)} frozen-stdout contract violation(s)")
        return 1

    for deviation in accepted_deviations:
        print(f"PORTABLE: {deviation}")

    print(
        "PASS: "
        f"{stdout_total} stdout blocks satisfy the book-wide {args.base} "
        f"{args.policy} snapshot "
        f"across {checked_base} baseline units; "
        f"{checked_pairs} HTML/TeX pairs match; "
        f"{len(accepted_deviations)} reviewed portability deviations"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
