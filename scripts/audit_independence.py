#!/usr/bin/env python3
"""Independence audit (press program W2, rules I1 and I2).

The press manuscript must read without the course it grew from and without the second
volume: no course vocabulary anywhere its reader sees, and the second volume only as a
cited outside work. This audit builds the press view of every chapter in the reading
order (prose, captions, alt text, and the comments of printed code, minus everything
the sources hide from the `press` profile or show only in HTML) and fails on any term
that is not an allowed use.

Usage: audit_independence.py            scan the press view of the sources
       audit_independence.py --list     print every hit, allowed ones included
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]

# Words that always name the course or the second volume.
TERMS = re.compile(
    r"\b(courses?|course-site|lectures?|syllabus|semesters?|exams?|examinable|"
    r"non-examinable|instructors?|DS 6050|homework|enrolled|continue in|companion volume|"
    r"graduate companion|second book|graduate continuation|next volume)\b",
    re.IGNORECASE,
)
# Words with an ordinary technical sense, matched only in their course sense.
COURSE_SENSE = re.compile(
    r"\bModules? \d+\b|\bcourse modules?\b|\b(supplied|course|the course's)\s+(\w+\s+)?labs?\b|"
    r"\blabs? (session|exercise|notebook)s?\b|\b(course|homework|for-credit|graded|lab)\s+assignments?\b|"
    r"\bthe assignment\b|\bassignment (rules|deadline)s?\b|\bstudents\b|\blecture videos?\b|\bvideo lectures?\b"
)
# Allowed uses, matched against the text around a hit.
ALLOWED = [
    (r"\bof course\b", "the idiom"),
    (r"\bcourse of\b", "in the course of (a process)"),
    (r"Lecture 6\.5", "Tieleman and Hinton's cited RMSProp lecture"),
]
URL = re.compile(r"\]\([^)]*\)|<https?://[^>]*>|https?://\S+")


def reading_order() -> list[str]:
    book = yaml.safe_load((ROOT / "_quarto.yml").read_text())["book"]
    files: list[str] = []
    for entry in book["chapters"] + book.get("appendices", []):
        if isinstance(entry, str):
            files.append(entry)
        else:
            if entry.get("part"):
                files.append(entry["part"])
            files.extend(entry.get("chapters", []))
    return files


def strip_divs(lines: list[str]) -> list[str]:
    """Blank the fenced divs the press build omits (keep line numbers)."""
    out, stack = [], []
    for line in lines:
        opening = re.match(r"^(:{3,})\s*\{([^}]*)\}\s*$", line)
        closing = re.match(r"^(:{3,})\s*$", line)
        if opening:
            attrs = opening.group(2)
            hidden = ('content-hidden' in attrs and 'when-profile="press"' in attrs) or (
                'content-visible' in attrs and 'when-format="html"' in attrs)
            stack.append(hidden)
            out.append("")
            continue
        if closing and stack:
            stack.pop()
            out.append("")
            continue
        out.append("" if any(stack) else line)
    return out


def press_view(text: str) -> list[str]:
    lines = text.split("\n")
    if lines and lines[0].strip() == "---":
        end = lines.index("---", 1)
        lines = [""] * (end + 1) + lines[end + 1:]
    joined = re.sub(r"<!--.*?-->", lambda m: "\n" * m.group(0).count("\n"), "\n".join(lines), flags=re.S)
    lines = strip_divs(joined.split("\n"))
    out, in_code = [], False
    for line in lines:
        if re.match(r"^\s*(```|~~~)", line):
            in_code = not in_code
            out.append("")
            continue
        if in_code:
            option = re.match(r"^#\|\s*(fig-cap|tbl-cap|fig-alt|lst-cap):\s*(.*)$", line)
            if option:
                out.append(option.group(2))
            elif re.match(r"^\s*#(?!\|)", line) or "  # " in line:
                out.append(line[line.index("#"):])
            else:
                out.append("")
            continue
        out.append(line)
    text = "\n".join(out)
    for attrs in (r'\{\.content-hidden when-profile="press"\}', r'\{\.content-visible when-format="html"\}'):
        text = re.sub(r"\[((?:[^\[\]]|\[[^\]]*\])*)\]" + attrs, lambda m: "\n" * m.group(0).count("\n"), text, flags=re.S)
    return text.split("\n")


def main() -> int:
    show_all = "--list" in sys.argv
    hits, allowed = [], 0
    for relative in reading_order():
        lines = press_view((ROOT / relative).read_text())
        for number, line in enumerate(lines, 1):
            scan = URL.sub(lambda m: " " * len(m.group(0)), line)
            for match in list(TERMS.finditer(scan)) + list(COURSE_SENSE.finditer(scan)):
                reason = next((why for pattern, why in ALLOWED
                               if any(m.start() <= match.start() < m.end() for m in re.finditer(pattern, scan, flags=re.IGNORECASE))), None)
                if reason:
                    allowed += 1
                    if show_all:
                        print(f"allowed  {relative}:{number}: {match.group(0)!r} ({reason})")
                    continue
                hits.append(f"{relative}:{number}: {match.group(0)!r} in: {line.strip()[:140]}")
    for hit in hits:
        print(f"FAIL {hit}")
    if hits:
        print(f"FAILED: {len(hits)} independence hit(s) in the press view ({allowed} allowed uses)")
        return 1
    print(f"PASS: the press view names no course and cites the second volume only as an outside "
          f"work ({allowed} allowed uses)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
