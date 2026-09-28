#!/usr/bin/env python3
"""Independence audit (press program W2, rules I1 and I2).

The press manuscript must read without the course it grew from and without the second
volume: no course vocabulary anywhere its reader sees, and the second volume only as a
cited outside work. This audit builds the press view of every chapter in the reading
order (prose, captions, alt text, and the comments of printed code, minus everything
the sources hide from the `press` profile or show only in HTML), and the press title
matter (the title-page macros in tex/macros.tex and the book metadata of _quarto.yml and
_quarto-press.yml), and fails on any term that is not an allowed use.

The author's ruling 2 (September 28, 2026): the publish run warns (--warn), while the
weekly execution audit and the press build (a pre-render step of _quarto-press.yml) fail.

Usage: audit_independence.py            scan; exit 1 on a hit
       audit_independence.py --warn     scan; report hits as warnings and exit 0
       audit_independence.py --list     print every hit, allowed ones included
"""
from __future__ import annotations

import os
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


TITLE_MACROS = ("title", "subtitle", "publishers", "date", "dedication", "subject", "titlehead",
                "uppertitleback", "lowertitleback", "extratitle")


def braced(text: str, start: int) -> str:
    """The balanced-brace argument that opens at text[start] == '{'."""
    depth = 0
    for index in range(start, len(text)):
        if text[index] == "{":
            depth += 1
        elif text[index] == "}":
            depth -= 1
            if depth == 0:
                return text[start + 1:index]
    return text[start + 1:]


def title_matter() -> list[tuple[str, str]]:
    """(place, text) of what the press PDF prints as title matter."""
    out = []
    macros = ROOT / "tex" / "macros.tex"
    lines = [re.sub(r"(?<!\\)%.*$", "", line) for line in macros.read_text().split("\n")]
    text = "\n".join(lines)
    for name in TITLE_MACROS:
        for match in re.finditer(r"\\" + name + r"\s*\{", text):
            line = text[:match.start()].count("\n") + 1
            argument = re.sub(r"\\[A-Za-z]+(\{\})?|[{}]", " ", braced(text, match.end() - 1))
            out.append((f"tex/macros.tex:{line} (\\{name})", re.sub(r"\s+", " ", argument)))
    for config in ("_quarto.yml", "_quarto-press.yml"):
        book = (yaml.safe_load((ROOT / config).read_text()) or {}).get("book", {})
        for key in ("title", "subtitle", "author", "description"):
            if isinstance(book.get(key), str):
                out.append((f"{config} (book.{key})", book[key]))
    return out


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
    warn = "--warn" in sys.argv
    hits, allowed = [], 0
    places = [(f"{relative}:{number}", line)
              for relative in reading_order()
              for number, line in enumerate(press_view((ROOT / relative).read_text()), 1)]
    places += title_matter()
    for place, line in places:
        scan = URL.sub(lambda m: " " * len(m.group(0)), line)
        for match in list(TERMS.finditer(scan)) + list(COURSE_SENSE.finditer(scan)):
            reason = next((why for pattern, why in ALLOWED
                           if any(m.start() <= match.start() < m.end() for m in re.finditer(pattern, scan, flags=re.IGNORECASE))), None)
            if reason:
                allowed += 1
                if show_all:
                    print(f"allowed  {place}: {match.group(0)!r} ({reason})")
                continue
            hits.append(f"{place}: {match.group(0)!r} in: {line.strip()[:140]}")
    label = "WARN" if warn else "FAIL"
    annotate = warn and os.environ.get("GITHUB_ACTIONS") == "true"
    for hit in hits:
        print(f"{label} {hit}")
        if annotate:
            # A GitHub Actions annotation, so a warning shows on the run and the pull request.
            where = re.match(r"([^:\s]+):(\d+)", hit)
            location = f" file={where.group(1)},line={where.group(2)}" if where else ""
            print(f"::warning{location}::independence: {hit}")
    if hits:
        print(f"{'WARNED' if warn else 'FAILED'}: {len(hits)} independence hit(s) in the press view "
              f"({allowed} allowed uses)")
        return 0 if warn else 1
    print(f"PASS: the press view and title matter name no course and cite the second volume only "
          f"as an outside work ({allowed} allowed uses)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
