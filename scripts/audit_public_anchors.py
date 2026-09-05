#!/usr/bin/env python3
"""Protect public chapter anchors in source and rendered HTML."""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "docs" / "public-anchors.md"
SITE_PREFIX = "https://shakeri-lab.github.io/dl-book/"
URL_RE = re.compile(r"https://shakeri-lab\.github\.io/dl-book/[^\s|]+#[A-Za-z0-9_-]+")
EXPECTED_COUNT = 11


def source_path(relative_html: str) -> Path:
    return ROOT / Path(relative_html).with_suffix(".qmd")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--rendered",
        type=Path,
        help="also verify files and fragment identifiers below this rendered-book root",
    )
    args = parser.parse_args()

    text = CONTRACT.read_text()
    urls = URL_RE.findall(text)
    errors: list[str] = []
    if len(urls) != EXPECTED_COUNT:
        errors.append(f"expected {EXPECTED_COUNT} public anchors, found {len(urls)}")
    if len(set(urls)) != len(urls):
        errors.append("duplicate URL in public-anchor contract")

    for url in urls:
        if not url.startswith(SITE_PREFIX):
            errors.append(f"wrong site prefix: {url}")
            continue
        parsed = urlparse(url)
        relative_html = parsed.path.removeprefix("/dl-book/")
        fragment = parsed.fragment
        source = source_path(relative_html)
        if not source.is_file():
            errors.append(f"missing source for {url}: {source.relative_to(ROOT)}")
            continue
        source_text = source.read_text()
        if f"#{fragment}" not in source_text and not re.search(
            rf"\bid=[\"']{re.escape(fragment)}[\"']", source_text
        ):
            errors.append(f"missing source identifier #{fragment}: {source.relative_to(ROOT)}")

        if args.rendered is not None:
            rendered = args.rendered / relative_html
            if not rendered.is_file():
                errors.append(f"missing rendered page for {url}: {rendered}")
                continue
            html = rendered.read_text(errors="replace")
            if not re.search(rf"\bid=[\"']{re.escape(fragment)}[\"']", html):
                errors.append(f"missing rendered fragment #{fragment}: {rendered}")

    if errors:
        raise SystemExit("\n".join(errors))
    mode = "source + rendered HTML" if args.rendered is not None else "source"
    print(f"public anchors ({mode}): pass ({len(urls)} interfaces)")


if __name__ == "__main__":
    main()
