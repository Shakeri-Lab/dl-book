#!/usr/bin/env python3
"""Derive each chapter's number from the book's reading order.

Quarto numbers the chapters of a book in the order `_quarto.yml` lists them,
skipping any whose title heading is `.unnumbered`. This script applies the same
rule and writes `filters/chapter-numbers.json` ({label: number}), which
`filters/pdf-chapter-xrefs.lua` uses to print chapter references in the PDF.
Labels and file names never change; numbers follow the order.

Usage: chapter_numbers.py            write the map
       chapter_numbers.py --check    fail if the committed map is stale
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
MAP = ROOT / "filters" / "chapter-numbers.json"


def chapter_files() -> list[str]:
    book = yaml.safe_load((ROOT / "_quarto.yml").read_text())["book"]
    files: list[str] = []
    for entry in book["chapters"]:
        if isinstance(entry, str):
            files.append(entry)
        else:
            files.extend(entry.get("chapters", []))
    return files


def chapter_numbers() -> dict[str, int]:
    numbers: dict[str, int] = {}
    count = 0
    for relative in chapter_files():
        title = next(line for line in (ROOT / relative).read_text().split("\n") if line.startswith("# "))
        label = re.search(r"\{[^}]*#(sec-[\w-]+)", title)
        if ".unnumbered" in title:
            continue
        count += 1
        if label is None:
            raise SystemExit(f"{relative}: numbered chapter title has no #sec- label")
        numbers[label.group(1)] = count
    return numbers


def main() -> int:
    text = json.dumps(chapter_numbers(), indent=2) + "\n"
    if "--check" in sys.argv:
        if not MAP.is_file() or MAP.read_text() != text:
            print("FAILED: filters/chapter-numbers.json is stale; run scripts/chapter_numbers.py")
            return 1
        print(f"PASS: chapter-number map matches the reading order ({len(json.loads(text))} chapters)")
        return 0
    MAP.write_text(text)
    print(f"wrote {MAP.relative_to(ROOT)} ({len(json.loads(text))} chapters)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
