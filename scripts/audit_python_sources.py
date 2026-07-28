#!/usr/bin/env python3
"""Parse every executable book cell and every included Python module."""

from __future__ import annotations

import ast
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
FENCE_RE = re.compile(r"^```(\{python\})\s*$\n(.*?)^```\s*$", re.MULTILINE | re.DOTALL)
INCLUDE_RE = re.compile(r'book-include="([^"]+)"')
START_RE = re.compile(r"start-line=(\d+)")
END_RE = re.compile(r"end-line=(\d+)")
INCLUDE_FENCE_RE = re.compile(
    r"^```(\{\.python [^}\n]*book-include=[^}\n]*\})\s*$\n.*?^```\s*$",
    re.MULTILINE | re.DOTALL,
)


def parse_source(source: str, label: str, errors: list[str]) -> None:
    try:
        ast.parse(source, filename=label)
    except SyntaxError as error:
        errors.append(f"{label}:{error.lineno}: {error.msg}")


def included_source(chapter: Path, opener: str) -> tuple[str, str]:
    include_match = INCLUDE_RE.search(opener)
    if include_match is None:
        raise ValueError("missing book-include path")
    include_path = (chapter.parent / include_match.group(1)).resolve()
    if not include_path.exists():
        include_path = (ROOT / include_match.group(1)).resolve()
    lines = include_path.read_text().splitlines()
    start_match = START_RE.search(opener)
    end_match = END_RE.search(opener)
    start = int(start_match.group(1)) - 1 if start_match else 0
    end = int(end_match.group(1)) if end_match else len(lines)
    return "\n".join(lines[start:end]) + "\n", str(include_path.relative_to(ROOT))


def main() -> None:
    errors: list[str] = []
    cell_count = 0
    include_count = 0
    for chapter in sorted((ROOT / "chapters").rglob("*.qmd")):
        text = chapter.read_text()
        for index, match in enumerate(FENCE_RE.finditer(text), start=1):
            cell_count += 1
            parse_source(
                match.group(2),
                f"{chapter.relative_to(ROOT)}:cell-{index}",
                errors,
            )
        for match in INCLUDE_FENCE_RE.finditer(text):
            include_count += 1
            # A displayed slice can intentionally stop at a function signature.
            # Resolve it here; the complete referenced module is parsed below.
            included_source(chapter, match.group(1))

    module_paths = sorted((ROOT / "code").rglob("*.py")) + sorted(
        (ROOT / "scripts").glob("*.py")
    )
    for path in module_paths:
        parse_source(path.read_text(), str(path.relative_to(ROOT)), errors)

    if errors:
        print("\n".join(errors), file=sys.stderr)
        print(f"FAILED: {len(errors)} Python parse failure(s)", file=sys.stderr)
        raise SystemExit(1)
    print(
        f"PASS: parsed {cell_count} executable cells, {include_count} transclusions, "
        f"and {len(module_paths)} Python modules/scripts"
    )


if __name__ == "__main__":
    main()
