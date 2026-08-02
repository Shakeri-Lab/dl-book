#!/usr/bin/env python3
"""Parse Python sources and enforce readable learner-visible listings."""

from __future__ import annotations

import ast
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CHAPTER_15 = ROOT / "chapters/part4/15-bert-pretraining.qmd"
REPO_IMPORT_ROOTS = {"dlbook"}
FENCE_RE = re.compile(r"^```(\{python\})\s*$\n(.*?)^```\s*$", re.MULTILINE | re.DOTALL)
INCLUDE_RE = re.compile(r'book-include="([^"]+)"')
START_RE = re.compile(r"start-line=(\d+)")
END_RE = re.compile(r"end-line=(\d+)")
INCLUDE_FENCE_RE = re.compile(
    r"^```(\{\.python [^}\n]*book-include=[^}\n]*\})\s*$\n.*?^```\s*$",
    re.MULTILINE | re.DOTALL,
)
VISIBLE_LINE_LIMIT = 88


def audit_visible_width(
    source: str,
    label: str,
    errors: list[str],
    *,
    line_offset: int = 0,
) -> None:
    """Reject long learner-visible source lines; Quarto directives are metadata."""
    for line_number, line in enumerate(source.splitlines(), start=1 + line_offset):
        if line.lstrip().startswith("#|"):
            continue
        if len(line.expandtabs(4)) > VISIBLE_LINE_LIMIT:
            errors.append(
                f"{label}:{line_number}: learner-visible source exceeds "
                f"{VISIBLE_LINE_LIMIT} columns ({len(line.expandtabs(4))})"
            )


def parse_source(source: str, label: str, errors: list[str]) -> None:
    try:
        ast.parse(source, filename=label)
    except SyntaxError as error:
        errors.append(f"{label}:{error.lineno}: {error.msg}")


def included_source(chapter: Path, opener: str) -> tuple[str, str, int]:
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
    return (
        "\n".join(lines[start:end]) + "\n",
        str(include_path.relative_to(ROOT)),
        start,
    )


def audit_chapter_15_self_containment(text: str, errors: list[str]) -> None:
    if INCLUDE_FENCE_RE.search(text):
        errors.append(
            f"{CHAPTER_15.relative_to(ROOT)}: must not transclude repository code"
        )
    for index, match in enumerate(FENCE_RE.finditer(text), start=1):
        try:
            tree = ast.parse(
                match.group(2),
                filename=f"{CHAPTER_15.relative_to(ROOT)}:cell-{index}",
            )
        except SyntaxError:
            continue
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                roots = {alias.name.split(".", 1)[0] for alias in node.names}
            elif isinstance(node, ast.ImportFrom):
                roots = (
                    {node.module.split(".", 1)[0]}
                    if node.module is not None
                    else set()
                )
                if node.level:
                    errors.append(
                        f"{CHAPTER_15.relative_to(ROOT)}:cell-{index}: "
                        "relative import violates the self-contained lab contract"
                    )
            else:
                continue
            local_roots = roots & REPO_IMPORT_ROOTS
            if local_roots:
                errors.append(
                    f"{CHAPTER_15.relative_to(ROOT)}:cell-{index}: repo-local "
                    f"import(s) violate the self-contained lab contract: "
                    f"{', '.join(sorted(local_roots))}"
                )


def main() -> None:
    errors: list[str] = []
    cell_count = 0
    include_count = 0
    for chapter in sorted((ROOT / "chapters").rglob("*.qmd")):
        text = chapter.read_text()
        for index, match in enumerate(FENCE_RE.finditer(text), start=1):
            cell_count += 1
            source = match.group(2)
            parse_source(
                source,
                f"{chapter.relative_to(ROOT)}:cell-{index}",
                errors,
            )
            if not re.search(r"^#\|\s*echo:\s*false\s*$", source, re.MULTILINE):
                source_line = text.count("\n", 0, match.start(2)) + 1
                audit_visible_width(
                    source,
                    str(chapter.relative_to(ROOT)),
                    errors,
                    line_offset=source_line - 1,
                )
        for match in INCLUDE_FENCE_RE.finditer(text):
            include_count += 1
            # A displayed slice can intentionally stop at a function signature.
            # Resolve it here; the complete referenced module is parsed below.
            source, label, line_offset = included_source(chapter, match.group(1))
            audit_visible_width(
                source,
                label,
                errors,
                line_offset=line_offset,
            )

    audit_chapter_15_self_containment(CHAPTER_15.read_text(), errors)

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
        f"and {len(module_paths)} Python modules/scripts; learner-visible lines are "
        f"at most {VISIBLE_LINE_LIMIT} columns and Chapter 15 remains self-contained"
    )


if __name__ == "__main__":
    main()
