#!/usr/bin/env python3
"""Compare frozen stdout against a Git revision and across render formats."""

from __future__ import annotations

import argparse
from collections import Counter
import json
import re
import subprocess
from pathlib import Path


STDOUT_RE = re.compile(
    r"::: \{\.cell-output \.cell-output-stdout\}\n"
    r"```\n(.*?)```\n:::",
    re.DOTALL,
)


def stdout_blocks(raw_json: str) -> list[str]:
    document = json.loads(raw_json)
    markdown = document["result"]["markdown"]
    return STDOUT_RE.findall(markdown)


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
    checked_pairs = 0
    stdout_total = 0
    current_snapshot: list[str] = []
    for unit_dir in unit_dirs:
        result_dir = unit_dir / "execute-results"
        html_path = result_dir / "html.json"
        tex_path = result_dir / "tex.json"
        if not html_path.exists():
            failures.append(f"{unit_dir}: missing html.json")
            continue

        html_blocks = stdout_blocks(html_path.read_text())
        stdout_total += len(html_blocks)
        current_snapshot.extend(html_blocks)

        if tex_path.exists():
            tex_blocks = stdout_blocks(tex_path.read_text())
            checked_pairs += 1
            if tex_blocks != html_blocks:
                failures.append(f"{unit_dir}: HTML/TeX stdout differs")

    if args.units:
        base_paths = [
            freeze_root / unit / "execute-results/html.json"
            for unit in args.units
        ]
    else:
        base_paths = git_html_paths(args.base)

    base_snapshot: list[str] = []
    checked_base = 0
    for base_path in base_paths:
        base_raw = git_text(args.base, base_path)
        if base_raw is not None:
            checked_base += 1
            base_snapshot.extend(stdout_blocks(base_raw))

    if Counter(base_snapshot) != Counter(current_snapshot):
        missing = Counter(base_snapshot) - Counter(current_snapshot)
        added = Counter(current_snapshot) - Counter(base_snapshot)
        failures.append(
            "book-wide stdout snapshot differs from "
            f"{args.base}: {sum(missing.values())} missing, "
            f"{sum(added.values())} added block(s)"
        )

    if failures:
        for failure in failures:
            print(failure)
        print(f"FAILED: {len(failures)} frozen-stdout contract violation(s)")
        return 1

    print(
        "PASS: "
        f"{stdout_total} stdout blocks match the book-wide {args.base} snapshot "
        f"across {checked_base} baseline units; "
        f"{checked_pairs} HTML/TeX pairs match"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
