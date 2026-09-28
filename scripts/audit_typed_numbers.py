#!/usr/bin/env python3
"""Typed-number guard: the manuscript names chapters by label, never by typed number.

Chapter numbers follow the reading order (docs/chapter-numbering.md), so a number typed
into prose goes stale the moment the order changes. This audit reads every page in the
reading order as a reader sees it (prose, callouts, figure/table/listing captions; not
front matter, HTML comments, or code) and fails on a typed "Chapter N", "Chapters N",
"Ch. N", or typed float number ("Figure N.M" and the like). Allowed, and checked where
they can be:

- the Preface's revision notes, which keep the numbers of their time;
- a Markdown link whose text types the number of the chapter it links to (a section
  reference from an unnumbered page cannot be a cross-reference);
- the second volume's own chapters, cited after "Shakeri (2026)" or "Making It
  Trainable" in the same paragraph;
- hand-numbered listings, which must be defined (**Listing N.M**) on Chapter N's page
  and cited with that number, in prose or in a code comment.

Numbers inside code (comments, strings, plot labels), in `code-summary` labels and alt
text, and in the `code/dlbook` docstrings cannot be cross-references, and no script can
tell which chapter they mean. They are counted, not failed; `--list` prints them for the
hand check that docs/chapter-numbering.md asks for after any reordering.

Usage: audit_typed_numbers.py [--list]
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
TYPED = re.compile(r"\b(?:[Cc]hapters?\s+\d+|Ch\.\s*\d+)")
TYPED_FLOAT = re.compile(r"\b(?:Figure|Table|Equation|Section)s?\s+\d+\.\d+")
LISTING = re.compile(r"\bListings?\s+(\d+)\.(\d+)")
LISTING_DEFINITION = re.compile(r"\*\*Listing\s+(\d+)\.(\d+)\*\*")
LINK = re.compile(r"\[([^\]]*)\]\(([^)\s]+)\)")
SECOND_VOLUME = re.compile(r"Shakeri \(2026\)|Making It Trainable")
REVISION_NOTES = re.compile(r"^## Revision notes\b")
# Pandoc reads a line that starts with "@label." or "@label)" (or "(@label)") as an
# example-list marker, and the reference vanishes (CLAUDE.md, known failure modes).
EXAMPLE_MARKER = re.compile(r"^\s*(?:\(@[\w-]+\)|@[\w-]*\w[.)])(?:\s|$)")


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


def reader_view(relative: str, text: str) -> list[str]:
    """(reader-visible prose, code and cell-option lines), line for line."""
    lines = text.split("\n")
    if lines and lines[0].strip() == "---":
        end = lines.index("---", 1)
        lines = [""] * (end + 1) + lines[end + 1:]
    joined = re.sub(r"<!--.*?-->", lambda m: "\n" * m.group(0).count("\n"), "\n".join(lines), flags=re.S)
    out, code, in_code, in_notes = [], [], False, False
    for line in joined.split("\n"):
        if relative == "index.qmd" and line.startswith("## "):
            in_notes = bool(REVISION_NOTES.match(line))
        if re.match(r"^\s*(```|~~~)", line):
            in_code = not in_code
            out.append("")
            code.append("")
            continue
        if in_code:
            option = re.match(r"^#\|\s*(?:fig-cap|tbl-cap|lst-cap):\s*(.*)$", line)
            out.append(option.group(1) if option else "")
            code.append("" if option else line)
            continue
        out.append("" if in_notes else line)
        alt = re.findall(r'fig-alt="([^"]*)"', line)
        code.append(" ".join(alt))
    return out, code


def paragraphs(view: list[str]) -> list[tuple[int, str]]:
    """(first line number, text) of each blank-line-separated block."""
    blocks, start, current = [], None, []
    for number, line in enumerate(view, 1):
        if line.strip():
            if start is None:
                start = number
            current.append(line)
        elif current:
            blocks.append((start, "\n".join(current)))
            start, current = None, []
    if current:
        blocks.append((start, "\n".join(current)))
    return blocks


def main() -> int:
    numbers = json.loads((ROOT / "filters" / "chapter-numbers.json").read_text())
    number_of_page = {entry["html"].replace(".html", ".qmd"): int(entry["number"]) for entry in numbers.values()}
    errors: list[str] = []
    definitions: dict[str, str] = {}
    citations: list[tuple[str, str]] = []
    allowed = 0
    by_hand: list[str] = []
    for relative in reading_order():
        view, code = reader_view(relative, (ROOT / relative).read_text())
        for number, line in enumerate(code, 1):
            for match in LISTING.finditer(line):
                citations.append((f"{relative}:{number}", f"{match.group(1)}.{match.group(2)}"))
            for match in list(TYPED.finditer(line)) + list(TYPED_FLOAT.finditer(line)):
                by_hand.append(f"{relative}:{number}: {match.group(0)!r} :: {line.strip()[:110]}")
        for number, line in enumerate(view, 1):
            # Inside a list item (an indented line) or at a paragraph's start the marker opens
            # a list; in the middle of an unindented paragraph it cannot.
            opens = line[:1].isspace() or number == 1 or not view[number - 2].strip()
            if opens and EXAMPLE_MARKER.match(line):
                errors.append(f"{relative}:{number}: a line that begins with {line.strip()[:40]!r} is read "
                              f"as an example-list marker; move the reference off the line start")
        for first, block in paragraphs(view):
            where = lambda offset: f"{relative}:{first + block[:offset].count(chr(10))}"
            links = [(m.start(), m.end(), m.group(1), m.group(2)) for m in LINK.finditer(block)]
            cue = [m.start() for m in SECOND_VOLUME.finditer(block)]
            for match in TYPED.finditer(block):
                number = int(re.search(r"\d+", match.group(0)).group(0))
                link = next((l for l in links if l[0] <= match.start() < l[1]), None)
                if link is not None and not re.match(r"https?://", link[3]):
                    target = (Path(relative).parent / link[3].split("#")[0]).as_posix()
                    target = str(Path(target)).replace("\\", "/")
                    target = re.sub(r"(^|/)[^/]+/\.\./", r"\1", target)
                    if number_of_page.get(target) == number:
                        allowed += 1
                        continue
                    errors.append(f"{where(match.start())}: link text {match.group(0)!r} does not match "
                                  f"its target {link[3]} (Chapter {number_of_page.get(target)})")
                    continue
                if any(c < match.start() for c in cue):
                    allowed += 1
                    continue
                errors.append(f"{where(match.start())}: typed {match.group(0)!r}; name the chapter by its "
                              f"label (@sec-...), see docs/chapter-numbering.md")
            for match in TYPED_FLOAT.finditer(block):
                errors.append(f"{where(match.start())}: typed {match.group(0)!r}; use a cross-reference")
            for match in LISTING_DEFINITION.finditer(block):
                key = f"{match.group(1)}.{match.group(2)}"
                definitions[key] = relative
                if number_of_page.get(relative) != int(match.group(1)):
                    errors.append(f"{where(match.start())}: Listing {key} is defined on Chapter "
                                  f"{number_of_page.get(relative)}'s page")
            for match in LISTING.finditer(block):
                citations.append((where(match.start()), f"{match.group(1)}.{match.group(2)}"))
    for module in sorted((ROOT / "code" / "dlbook").glob("*.py")):
        for number, line in enumerate(module.read_text().split("\n"), 1):
            for match in list(TYPED.finditer(line)) + list(TYPED_FLOAT.finditer(line)):
                by_hand.append(f"{module.relative_to(ROOT)}:{number}: {match.group(0)!r} :: {line.strip()[:110]}")
            for match in LISTING.finditer(line):
                citations.append((f"{module.relative_to(ROOT)}:{number}", f"{match.group(1)}.{match.group(2)}"))
    if "--list" in sys.argv:
        for entry in by_hand:
            print(f"CHECK BY HAND {entry}")
    for place, key in citations:
        if key not in definitions:
            errors.append(f"{place}: Listing {key} is not defined anywhere")
    for error in errors:
        print(f"FAIL {error}")
    if errors:
        print(f"FAILED: {len(errors)} typed number(s) in the manuscript ({allowed} allowed)")
        return 1
    print(f"PASS: chapters are named by label; {allowed} typed number(s) allowed (links that match "
          f"their target, second-volume citations), {len(citations)} listing citation(s) resolve to "
          f"{len(definitions)} definition(s); revision notes keep the numbers of their time; "
          f"{len(by_hand)} number(s) in code, labels, alt text, and docstrings to check by hand "
          f"after any reordering (--list)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
