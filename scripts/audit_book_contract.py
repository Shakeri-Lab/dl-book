#!/usr/bin/env python3
"""Audit book-wide editorial and authoring contracts."""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CHAPTERS = sorted((ROOT / "chapters").glob("part[1-5]/*.qmd"))
INTERLUDES = {
    "exfig": ROOT / "chapters/interludes/learning-by-experiment.qmd",
    "aefig": ROOT / "chapters/interludes/making-pca-learnable.qmd",
    "ttrfig": ROOT / "chapters/interludes/attention-as-test-time-regression.qmd",
}
EXPECTED_CUSTOM_FLOATS = {"exfig": 2, "aefig": 4, "ttrfig": 2}
CANONICAL_EXERCISE_TAGS = {"Pencil.", "Code.", "Audit."}
EXERCISE_RE = re.compile(r"\*\*\(([^)\n]+)\)\*\*")
HINTON_COURSE_RE = re.compile(
    r"Hinton(?:'s|’s)\s+(?:Coursera\s+)?course|Lecture[- ]?6e|"
    r"Hinton(?:'s|’s)\s+lectures",
    re.IGNORECASE,
)
PUBLIC_RESIDUE_PATTERNS = {
    "off-page live-session reference": re.compile(
        r"\blive sessions?\b",
        re.IGNORECASE,
    ),
    "internal seed-note jargon": re.compile(
        r"\bseed(?:'s|’s)?\s+notes\b|\bthe\s+seed(?:'s|’s)\b",
        re.IGNORECASE,
    ),
    "derivation/follows-suit splice": re.compile(
        r"\bderivation\s+suit\.",
        re.IGNORECASE,
    ),
    "doubled sentence-head splice": re.compile(
        r"\bThe\s+(?:Here is|This)\b",
    ),
}
PYTHON_CELL_RE = re.compile(r"```\{python\}\n(.*?)\n```", re.DOTALL)
FIGURE_LABEL_RE = re.compile(r"^#\| label: fig-[A-Za-z0-9_-]+\s*$", re.MULTILINE)
SUBSTANTIVE_VISIBLE_TOKENS = ("print(", "assert ", "raise ", "def ", "class ")


def without_html_comments(text: str) -> str:
    return re.sub(r"<!--.*?-->", "", text, flags=re.DOTALL)


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def main() -> None:
    errors: list[str] = []
    if len(CHAPTERS) != 20:
        fail(errors, f"expected 20 numbered chapters, found {len(CHAPTERS)}")

    for path in CHAPTERS:
        text = path.read_text()
        if text.count("## Check yourself") != 1:
            fail(errors, f"{path.relative_to(ROOT)}: expected one Check yourself")
        if text.count("## Sources and further reading") != 1:
            fail(errors, f"{path.relative_to(ROOT)}: expected one Sources section")
        headings = re.findall(r"^##\s+(.+)$", text, re.MULTILINE)
        check_index = next(
            (index for index, heading in enumerate(headings) if heading == "Check yourself"),
            None,
        )
        if (
            check_index is not None
            and (
                check_index + 1 == len(headings)
                or not headings[check_index + 1].startswith("Okay, so")
            )
        ):
            fail(
                errors,
                f"{path.relative_to(ROOT)}: Check yourself must immediately precede recap",
            )

    for path in sorted((ROOT / "chapters").rglob("*.qmd")):
        text = path.read_text()
        for tag in EXERCISE_RE.findall(text):
            if tag not in CANONICAL_EXERCISE_TAGS:
                fail(
                    errors,
                    f"{path.relative_to(ROOT)}: noncanonical exercise tag ({tag})",
                )

        visible = without_html_comments(text)
        for match in re.finditer(r"\blectures?\b", visible, re.IGNORECASE):
            line = visible.count("\n", 0, match.start()) + 1
            allowed = (
                path.name == "index.qmd"
                and "[lecture videos]" in visible.splitlines()[line - 1]
            )
            if not allowed:
                fail(
                    errors,
                    f"{path.relative_to(ROOT)}:{line}: public off-page lecture reference",
                )
        for match in re.finditer(r"(?:sources/)?[\w./-]+\.tex\b", visible):
            line = visible.count("\n", 0, match.start()) + 1
            fail(
                errors,
                f"{path.relative_to(ROOT)}:{line}: public internal TeX source path",
            )
        for description, pattern in PUBLIC_RESIDUE_PATTERNS.items():
            for match in pattern.finditer(visible):
                line = visible.count("\n", 0, match.start()) + 1
                fail(
                    errors,
                    f"{path.relative_to(ROOT)}:{line}: {description}",
                )

        for cell in PYTHON_CELL_RE.findall(text):
            is_figure = FIGURE_LABEL_RE.search(cell)
            is_hidden = re.search(r"^#\| echo: false\s*$", cell, re.MULTILINE)
            has_substantive_evidence = any(
                token in cell for token in SUBSTANTIVE_VISIBLE_TOKENS
            )
            if is_figure and not is_hidden and not has_substantive_evidence:
                label = FIGURE_LABEL_RE.search(cell).group(0).split(":", 1)[1].strip()
                fail(
                    errors,
                    f"{path.relative_to(ROOT)}: display-only figure cell {label} "
                    "must use an executed echo:false harness",
                )

    authored_files = [
        ROOT / "index.qmd",
        ROOT / "README.md",
        ROOT / "CHANGELOG.md",
        *sorted((ROOT / "chapters").rglob("*.qmd")),
        *sorted((ROOT / "docs").glob("*.md")),
    ]
    for path in authored_files:
        if HINTON_COURSE_RE.search(path.read_text()):
            fail(errors, f"{path.relative_to(ROOT)}: Hinton course reference remains")

    for key, path in INTERLUDES.items():
        text = path.read_text()
        if "Numbering note" in text:
            fail(errors, f"{path.relative_to(ROOT)}: obsolete numbering note")
        if "{#eq-" in text:
            fail(errors, f"{path.relative_to(ROOT)}: interlude equation is numbered")
        count = len(re.findall(rf"#({key})-[A-Za-z0-9_-]+", text))
        if count != EXPECTED_CUSTOM_FLOATS[key]:
            fail(
                errors,
                f"{path.relative_to(ROOT)}: expected {EXPECTED_CUSTOM_FLOATS[key]} "
                f"{key} floats, found {count}",
            )

    all_qmd = "\n".join(
        path.read_text() for path in sorted((ROOT / "chapters").rglob("*.qmd"))
    )
    if "sec-14-memory-spectrum" in all_qmd:
        fail(errors, "obsolete Chapter 14 memory-spectrum anchor remains")

    if errors:
        print("\n".join(errors), file=sys.stderr)
        print(f"FAILED: {len(errors)} book-contract violation(s)", file=sys.stderr)
        raise SystemExit(1)
    print(
        "PASS: 20 chapter retrieval/source contracts, canonical exercise tags, "
        "book voice and splice hygiene, hidden display-only figures, and three "
        "interlude namespaces"
    )


if __name__ == "__main__":
    main()
