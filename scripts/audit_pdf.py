#!/usr/bin/env python3
"""Fail on silent PDF glyph loss, exposed icon text, or off-page content."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

import pymupdf as fitz


TEXT_EDGE_WARNING = 4.0
MEDIA_BOX_TOLERANCE = 0.5
ROOT = Path(__file__).resolve().parents[1]
SUPPORT_URL = "buymeacoffee.com/hshakeri"
EXPECTED_OUTLINE_ENTRIES = 390


def source_edition() -> tuple[str, str]:
    """Read the stable version and stable/rolling state from canonical source."""
    index = (ROOT / "index.qmd").read_text()
    version = re.search(
        r"^\s{2}version:\s*[\"']?([^\s\"']+)[\"']?\s*$",
        index,
        re.MULTILINE,
    )
    status = re.search(
        r"^dlbook-edition-status:\s*(stable|rolling)\s*$",
        index,
        re.MULTILINE,
    )
    if version is None or status is None:
        raise ValueError("Could not read PDF edition version and publication state")
    return version.group(1), status.group(1)


def configured_text_right_edge() -> float:
    """Read the shared uniform PDF margin from the Quarto configuration."""
    config = (ROOT / "_quarto.yml").read_text()
    match = re.search(r"^\s*-\s*margin=([0-9.]+)in\s*$", config, re.MULTILINE)
    if match is None:
        raise ValueError("Could not find a uniform inch margin in _quarto.yml")
    return 72 * (8.5 - float(match.group(1)))


def normalized_heading(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)
    text = text.casefold().replace("–", "-").replace("—", "-")
    # PDF outline strings can retain TeX commands while the page text contains
    # their rendered symbols. Compare their spoken payload, not the markup.
    text = re.sub(r"\\sqrt\s*\{([^{}]*)\}", r" \1 ", text)
    text = text.replace("_", "")
    text = text.replace("√", " ").replace("\\times", " ").replace("×", " ")
    text = re.sub(r"\\[a-zA-Z]+", " ", text)
    return re.sub(r"[^0-9a-z]+", " ", text).strip()


def source_unit_titles() -> list[str]:
    """Read public unit titles without adding a YAML dependency to the audit."""
    config = (ROOT / "_quarto.yml").read_text()
    paths = re.findall(
        r"^\s*-\s+(?:part:\s+)?((?:index|chapters/[^\s]+)\.qmd)\s*$",
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
    block_index: dict[int, list[tuple[float, str]]] | None = None,
) -> list[int]:
    """Find a rendered heading near its outline destination, ignoring running heads."""
    target = normalized_heading(title)

    def matches_heading(candidate: str) -> bool:
        """Accept only the exact heading, optionally with an explicit unit prefix."""
        numbered_target = re.fullmatch(
            rf"(?:[0-9]+|[a-e])(?:\s+(?:[0-9]+|[a-e]))*\s+{re.escape(target)}",
            candidate,
        )
        part_target = re.fullmatch(
            rf"part\s+[ivxlcdm]+\s+{re.escape(target)}",
            candidate,
        )
        return (
            candidate == target
            or numbered_target is not None
            or part_target is not None
        )

    pages: list[int] = []
    start = max(1, destination - 6)
    stop = min(len(document), destination + 6)
    for page_number in range(start, stop + 1):
        if block_index is None:
            blocks: list[tuple[float, str]] = []
            for block in document[page_number - 1].get_text("dict")["blocks"]:
                lines = block.get("lines", [])
                spans = [span for line in lines for span in line.get("spans", [])]
                if not spans:
                    continue
                block_text = " ".join(
                    "".join(span["text"] for span in line.get("spans", []))
                    for line in lines
                )
                blocks.append(
                    (max(span["size"] for span in spans), normalized_heading(block_text))
                )
        else:
            blocks = block_index[page_number]
        for size, candidate in blocks:
            if size < minimum_size:
                continue
            if matches_heading(candidate):
                pages.append(page_number)
        # A long part or chapter title can wrap into adjacent PDF text blocks.
        # Match only within uninterrupted runs of heading-sized blocks so body
        # prose cannot manufacture a false destination.
        heading_run: list[str] = []
        for size, candidate in [*blocks, (0.0, "")]:
            if size >= minimum_size:
                heading_run.append(candidate)
                continue
            for start_index in range(len(heading_run)):
                for stop_index in range(start_index + 1, len(heading_run) + 1):
                    joined = " ".join(heading_run[start_index:stop_index])
                    if matches_heading(joined):
                        pages.append(page_number)
            heading_run = []
    return sorted(set(pages))


def indexed_page_blocks(
    document: fitz.Document,
) -> dict[int, list[tuple[float, str]]]:
    """Index normalized text blocks once for the complete outline audit."""
    index: dict[int, list[tuple[float, str]]] = {}
    for page_number, page in enumerate(document, start=1):
        page_blocks: list[tuple[float, str]] = []
        for block in page.get_text("dict")["blocks"]:
            lines = block.get("lines", [])
            spans = [span for line in lines for span in line.get("spans", [])]
            if not spans:
                continue
            block_text = " ".join(
                "".join(span["text"] for span in line.get("spans", []))
                for line in lines
            )
            page_blocks.append(
                (max(span["size"] for span in spans), normalized_heading(block_text))
            )
        index[page_number] = page_blocks
    return index


OUTLINE_HEADING_MINIMUM_SIZE = {1: 18.0, 2: 13.0, 3: 11.5, 4: 11.5}
OUTLINE_STRUCTURAL_BOOKMARKS = {"Appendices"}


def audit_outline(document: fitz.Document, errors: list[str]) -> None:
    """Require every heading bookmark to land on its rendered heading page."""
    outline = document.get_toc()
    block_index = indexed_page_blocks(document)
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

    checked = 0
    for outline_index, (level, title, destination) in enumerate(outline):
        # KOMA's synthetic Appendices node groups the real appendix chapters but
        # has no printed heading of its own. Its contract is to share the first
        # appendix heading's destination. Every other outline node is a
        # reader-visible heading and must resolve exactly.
        if title.strip() in OUTLINE_STRUCTURAL_BOOKMARKS:
            if outline_index + 1 >= len(outline):
                errors.append(
                    f"PDF outline: structural bookmark {title!r} has no child"
                )
            else:
                child_level, child_title, child_destination = outline[outline_index + 1]
                if child_level <= level or destination != child_destination:
                    errors.append(
                        f"PDF outline: structural bookmark {title!r} points to page "
                        f"{destination}, but its first child {child_title!r} points "
                        f"to page {child_destination}"
                    )
            checked += 1
            continue
        minimum_size = OUTLINE_HEADING_MINIMUM_SIZE.get(level, 9.0)
        pages = heading_pages(
            document,
            title,
            destination,
            minimum_size=minimum_size,
            block_index=block_index,
        )
        checked += 1
        if destination not in pages:
            errors.append(
                f"PDF outline: level-{level} heading {title!r} points to page "
                f"{destination}, rendered heading pages near it are "
                f"{pages or 'none'}"
            )
    if checked != EXPECTED_OUTLINE_ENTRIES:
        errors.append(
            f"PDF outline: expected {EXPECTED_OUTLINE_ENTRIES} maintained entries, "
            f"checked {checked}"
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


def audit_cover(document: fitz.Document, errors: list[str]) -> None:
    """Require one near-full-page raster cover before the searchable title page."""
    first_page = document[0]
    media = first_page.rect
    image_rects = [
        rect
        for image in first_page.get_images(full=True)
        for rect in first_page.get_image_rects(image[0])
    ]
    covers_page = any(
        rect.width >= 0.95 * media.width and rect.height >= 0.98 * media.height
        for rect in image_rects
    )
    if not covers_page:
        errors.append(
            "PDF page 1: expected a near-full-page raster cover before the title page"
        )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", type=Path)
    parser.add_argument(
        "--log-root",
        type=Path,
        help="Recursively scan retained LaTeX logs beneath this directory.",
    )
    parser.add_argument(
        "--outline-only",
        action="store_true",
        help="Run only the exact full-outline destination invariant.",
    )
    args = parser.parse_args()

    if not args.pdf.is_file():
        raise SystemExit(f"PDF not found: {args.pdf}")
    if args.outline_only:
        errors: list[str] = []
        document = fitz.open(args.pdf)
        audit_outline(document, errors)
        if errors:
            print("\n".join(errors), file=sys.stderr)
            print(
                f"FAILED: {len(errors)} PDF outline violation(s)", file=sys.stderr
            )
            raise SystemExit(1)
        print("PASS: every reader-visible PDF outline entry lands on its heading")
        return

    extracted = subprocess.run(
        ["pdftotext", "-enc", "UTF-8", str(args.pdf), "-"],
        check=True,
        capture_output=True,
    ).stdout
    text = extracted.decode("utf-8")
    normalized_text = unicodedata.normalize("NFKC", text)
    errors: list[str] = []

    version, edition_status = source_edition()
    if edition_status == "stable" and f"Version {version}" not in normalized_text:
        errors.append(f"stable Version {version} is missing from the PDF text layer")
    if edition_status == "stable" and "Rolling post-" in normalized_text:
        errors.append("stable PDF still identifies itself as a rolling manuscript")

    document = fitz.open(args.pdf)
    audit_cover(document, errors)
    audit_geometry(args.pdf, errors)

    if b"\x00" in extracted:
        errors.append("pdftotext output contains U+0000")
    if "\ufffd" in text:
        errors.append("pdftotext output contains U+FFFD replacement glyph")
    if not re.search(r"σ\(0\)\s*≈\s*1\s*(?:[⁄/]\s*)?2", normalized_text):
        errors.append(r"repaired $\sigma(0)\approx\tfrac12$ text is missing")
    if "β-VAE" not in normalized_text:
        errors.append(r"repaired $\beta$-VAE text is missing")
    if SUPPORT_URL not in normalized_text:
        errors.append("optional support URL is missing from the PDF text layer")
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
