#!/usr/bin/env python3
"""Validate date-study arithmetic and same-build baseline parity, not portability.

Frozen stdout extraction remains owned by audit_frozen_stdout.stdout_records.
Pure date-study semantics live in date_study_schema to avoid import cycles.
"""
from __future__ import annotations

import argparse
from pathlib import Path

from audit_frozen_stdout import stdout_records
from date_study_schema import (
    CHECKPOINTS, DENOMINATOR, SEEDS, SLOTS, Study, compare_baseline,
    parameter_counts, parse_study, require,
)


ROOT = Path(__file__).resolve().parents[1]


def audit_freeze(freeze_root: Path, formats: tuple[str, ...] = ("html", "tex")) -> list[str]:
    failures, by_format = [], {}
    for fmt in formats:
        studies, texts = {}, {}
        for chapter, (unit, block, ordinal) in SLOTS.items():
            path = freeze_root / unit / "execute-results" / f"{fmt}.json"
            try:
                records = stdout_records(path.read_text())
                require(len(records) == 6, f"Expected six stdout blocks, got {len(records)}")
                actual_ordinal, text = records[block - 1]
                require(actual_ordinal == ordinal,
                        f"Study stdout moved from native cell {ordinal} to {actual_ordinal}")
                studies[chapter] = parse_study(text, chapter)
                texts[chapter] = text
            except (OSError, ValueError, KeyError, TypeError) as exc:
                failures.append(f"{path}: {exc}")
        if len(studies) == 2:
            try:
                compare_baseline(studies[11], studies[13])
            except ValueError as exc:
                failures.append(f"{fmt}: {exc}")
        by_format[fmt] = texts
    if "html" in by_format and "tex" in by_format:
        for chapter in SLOTS:
            html, tex = by_format["html"].get(chapter), by_format["tex"].get(chapter)
            if html is not None and tex is not None and html != tex:
                failures.append(f"Chapter {chapter}: HTML/TeX study stdout differs")
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--freeze-root", type=Path, default=ROOT / "_freeze")
    args = parser.parse_args()
    failures = audit_freeze(args.freeze_root)
    if failures:
        print("\n".join(failures))
        print(f"FAIL: {len(failures)} date-study contract violation(s)")
        return 1
    print("PASS: five-seed date arithmetic, same-build baseline, and HTML/TeX parity")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
