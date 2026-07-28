#!/usr/bin/env python3
"""Fail on silent PDF glyph loss or exposed decorative callout icon text."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
import unicodedata
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", type=Path)
    parser.add_argument(
        "--log-root",
        type=Path,
        help="Recursively scan retained LaTeX logs beneath this directory.",
    )
    args = parser.parse_args()

    if not args.pdf.is_file():
        raise SystemExit(f"PDF not found: {args.pdf}")
    extracted = subprocess.run(
        ["pdftotext", "-enc", "UTF-8", str(args.pdf), "-"],
        check=True,
        capture_output=True,
    ).stdout
    text = extracted.decode("utf-8")
    normalized_text = unicodedata.normalize("NFKC", text)
    errors: list[str] = []

    if b"\x00" in extracted:
        errors.append("pdftotext output contains U+0000")
    if "\ufffd" in text:
        errors.append("pdftotext output contains U+FFFD replacement glyph")
    if not re.search(r"σ\(0\)\s*≈\s*1\s*(?:[⁄/]\s*)?2", normalized_text):
        errors.append(r"repaired $\sigma(0)\approx\tfrac12$ text is missing")
    if "β-VAE" not in normalized_text:
        errors.append(r"repaired $\beta$-VAE text is missing")
    for prefix in ("EX", "AE", "TTR"):
        if f"Figure {prefix}.1" not in normalized_text:
            errors.append(f"independent Figure {prefix}. namespace is missing")
        if re.search(rf"Figure {prefix}\.\d+\.\d+", normalized_text):
            errors.append(
                f"Figure {prefix}. namespace still inherits a chapter counter"
            )
    for icon_word in ("LIGHTBULB", "Exclamation-Triangle", "INFO"):
        if icon_word in text:
            errors.append(f"decorative callout icon leaked into text: {icon_word}")

    if args.log_root:
        for path in args.log_root.rglob("*.log"):
            if any(part in {".git", ".venv"} for part in path.parts):
                continue
            log_text = path.read_text(errors="replace")
            if "Missing character" in log_text:
                errors.append(f"{path}: LaTeX reported a missing character")

    if errors:
        print("\n".join(errors), file=sys.stderr)
        print(f"FAILED: {len(errors)} PDF text-layer violation(s)", file=sys.stderr)
        raise SystemExit(1)
    print("PASS: PDF text layer and retained LaTeX logs contain no missing glyphs")


if __name__ == "__main__":
    main()
