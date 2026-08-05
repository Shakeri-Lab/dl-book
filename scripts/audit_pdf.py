#!/usr/bin/env python3
"""Fail on silent PDF glyph loss, exposed icon text, or off-page content."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

import fitz


TEXT_EDGE_WARNING = 4.0
MEDIA_BOX_TOLERANCE = 0.5
ROOT = Path(__file__).resolve().parents[1]


def configured_text_right_edge() -> float:
    """Read the shared uniform PDF margin from the Quarto configuration."""
    config = (ROOT / "_quarto.yml").read_text()
    match = re.search(r"^\s*-\s*margin=([0-9.]+)in\s*$", config, re.MULTILINE)
    if match is None:
        raise ValueError("Could not find a uniform inch margin in _quarto.yml")
    return 72 * (8.5 - float(match.group(1)))


def normalized_heading(text: str) -> str:
    text = text.casefold().replace("–", "-").replace("—", "-")
    return re.sub(r"[^0-9a-z]+", " ", text).strip()


def source_unit_titles() -> list[str]:
    """Read public unit titles without adding a YAML dependency to the audit."""
    config = (ROOT / "_quarto.yml").read_text()
    paths = re.findall(
        r"^\s*-\s+((?:index|chapters/[^\s]+)\.qmd)\s*$",
        config,
        re.MULTILINE,
    )
    titles: list[str] = []
    for relative_path in paths:
        for line in (ROOT / relative_path).read_text().splitlines():
            if not line.startswith("# "):
                continue
            title = re.sub(r"\s+\{[^}]*\}\s*$", "", line[2:]).strip()
            titles.append(title.replace("**", "").replace("`", ""))
            break
    return titles


def heading_pages(
    document: fitz.Document,
    title: str,
    destination: int,
    *,
    minimum_size: float,
) -> list[int]:
    """Find a rendered heading near its outline destination, ignoring running heads."""
    target = normalized_heading(title)
    pages: list[int] = []
    start = max(1, destination - 6)
    stop = min(len(document), destination + 6)
    for page_number in range(start, stop + 1):
        page = document[page_number - 1]
        for block in page.get_text("dict")["blocks"]:
            lines = block.get("lines", [])
            spans = [span for line in lines for span in line.get("spans", [])]
            if not spans or max(span["size"] for span in spans) < minimum_size:
                continue
            block_text = " ".join(
                "".join(span["text"] for span in line.get("spans", []))
                for line in lines
            )
            candidate = normalized_heading(block_text)
            if target == candidate or target in candidate:
                pages.append(page_number)
    return sorted(set(pages))


def audit_outline(document: fitz.Document, errors: list[str]) -> None:
    """Protect unit bookmarks and the late-book pagination regression sentinels."""
    outline = document.get_toc()
    by_title: dict[str, list[tuple[int, int, str]]] = {}
    for index, (_, title, destination) in enumerate(outline):
        by_title.setdefault(title, []).append((index, destination, title))

    for title in source_unit_titles():
        matches = by_title.get(title, [])
        if len(matches) != 1:
            errors.append(
                f"PDF outline: expected one unit bookmark for {title!r}, "
                f"found {len(matches)}"
            )
            continue
        _, destination, _ = matches[0]
        pages = heading_pages(
            document, title, destination, minimum_size=18.0
        )
        if not pages or min(abs(page - destination) for page in pages) > 1:
            errors.append(
                f"PDF outline: unit {title!r} points to page {destination}, "
                f"rendered heading pages near it are {pages or 'none'}"
            )

    chapter_20 = next(
        index for index, entry in enumerate(outline)
        if entry[1] == "Multimodal Learning: One Space, Two Views"
    )
    epilogue = next(
        index for index, entry in enumerate(outline)
        if entry[1] == "Epilogue: The Question Is Yours"
    )
    appendices = next(
        index for index, entry in enumerate(outline)
        if entry[1] == "Appendices"
    )
    sentinel_ranges = [
        (
            chapter_20,
            epilogue,
            {
                "Okay, so — two towers learn a comparison, not a world model",
                "Sources and further reading",
                "Exercises",
            },
        ),
        (
            epilogue,
            appendices,
            {
                "The ladder we climbed",
                "The choices no architecture makes for you",
                "Learning about learning",
                "From fitting the past to evaluating futures",
                "Roads this book did not take",
                "Sources and further reading",
                "One question, now with better follow-ups",
            },
        ),
    ]
    for start, stop, titles in sentinel_ranges:
        entries = [entry for entry in outline[start:stop] if entry[1] in titles]
        found = {entry[1] for entry in entries}
        for missing in sorted(titles - found):
            errors.append(f"PDF outline: missing pagination sentinel {missing!r}")
        for _, title, destination in entries:
            pages = heading_pages(
                document, title, destination, minimum_size=13.0
            )
            if not pages or min(abs(page - destination) for page in pages) > 1:
                errors.append(
                    f"PDF outline: {title!r} points to page {destination}, "
                    f"rendered heading pages near it are {pages or 'none'}"
                )


def audit_geometry(pdf: Path, errors: list[str]) -> None:
    """Inspect the un-clipped text layer so print loss cannot hide at an edge."""
    document = fitz.open(pdf)
    audit_outline(document, errors)
    text_right_edge = configured_text_right_edge()
    clip = fitz.Rect(-500, -500, 3000, 3000)
    hard: list[tuple[int, tuple[float, float, float, float], str]] = []
    soft_pages: dict[int, float] = {}

    for page_number, page in enumerate(document, start=1):
        media = page.rect
        for block in page.get_text("dict", clip=clip)["blocks"]:
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    content = span.get("text", "")
                    if not content.strip():
                        continue
                    x0, y0, x1, y1 = span["bbox"]
                    outside_media = (
                        x0 < media.x0 - MEDIA_BOX_TOLERANCE
                        or y0 < media.y0 - MEDIA_BOX_TOLERANCE
                        or x1 > media.x1 + MEDIA_BOX_TOLERANCE
                        or y1 > media.y1 + MEDIA_BOX_TOLERANCE
                    )
                    if outside_media:
                        hard.append((page_number, (x0, y0, x1, y1), content))
                    elif x1 > text_right_edge + TEXT_EDGE_WARNING:
                        soft_pages[page_number] = max(
                            soft_pages.get(page_number, 0.0), x1 - text_right_edge
                        )

    for page_number, bbox, content in hard:
        compact = " ".join(content.split())
        errors.append(
            f"PDF page {page_number}: text extends beyond the media box "
            f"at {tuple(round(value, 1) for value in bbox)}: {compact[:100]}"
        )

    if soft_pages:
        worst_page = max(soft_pages, key=soft_pages.get)
        print(
            "WARNING: "
            f"{len(soft_pages)} PDF page(s) place text more than "
            f"{TEXT_EDGE_WARNING:.0f} pt beyond the nominal text edge; "
            f"worst is page {worst_page} (+{soft_pages[worst_page]:.1f} pt). "
            "These spans remain on paper but merit visual review.",
            file=sys.stderr,
        )


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

    audit_geometry(args.pdf, errors)

    if b"\x00" in extracted:
        errors.append("pdftotext output contains U+0000")
    if "\ufffd" in text:
        errors.append("pdftotext output contains U+FFFD replacement glyph")
    if not re.search(r"σ\(0\)\s*≈\s*1\s*(?:[⁄/]\s*)?2", normalized_text):
        errors.append(r"repaired $\sigma(0)\approx\tfrac12$ text is missing")
    if "β-VAE" not in normalized_text:
        errors.append(r"repaired $\beta$-VAE text is missing")
    # These are intentionally invented words in the no-position Transformer sample.
    # Their presence proves that the page's embedded text remains searchable and
    # copyable even though the generated prose itself is supposed to be nonsense.
    for sample_token in ("Thrivofforical", "Xaysherd"):
        if sample_token not in normalized_text:
            errors.append(
                "known Transformer sample token is missing from the PDF text layer: "
                f"{sample_token}"
            )
    for prefix in ("EX", "AE", "TTR", "E"):
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
    print(
        "PASS: PDF geometry, text layer, and retained LaTeX logs contain no "
        "print loss or missing glyphs"
    )


if __name__ == "__main__":
    main()
