#!/usr/bin/env python3
"""Audit rendered HTML support assets, identity metadata, and renderer pins."""

from __future__ import annotations

import argparse
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


class SupportAssetParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.assets: list[tuple[str, str]] = []
        self.metadata: dict[str, list[str]] = {}
        self.mathjax_urls: list[str] = []

    def handle_starttag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        values = dict(attrs)
        if tag == "link":
            relations = (values.get("rel") or "").split()
            if "stylesheet" in relations and (href := values.get("href")):
                self.assets.append(("stylesheet", href))
            if "icon" in relations and (href := values.get("href")):
                self.assets.append(("icon", href))
        elif tag == "script" and (src := values.get("src")):
            self.assets.append(("script", src))
            if "mathjax" in src.lower():
                self.mathjax_urls.append(src)
        elif tag == "meta" and (key := values.get("name") or values.get("property")):
            self.metadata.setdefault(key, []).append(values.get("content") or "")


REQUIRED_SOCIAL_METADATA = {
    "description",
    "og:title",
    "og:description",
    "og:image",
    "twitter:card",
    "twitter:title",
    "twitter:description",
    "twitter:image",
}
REQUIRED_CITATION_METADATA = {
    "citation_title",
    "citation_author",
    "citation_publication_date",
    "citation_publisher",
    "citation_public_url",
}
PINNED_MATHJAX_URL = "https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-chtml.js"


def local_asset(page: Path, root: Path, raw_url: str) -> Path | None:
    parsed = urlsplit(raw_url)
    if parsed.scheme or parsed.netloc or raw_url.startswith(("//", "data:")):
        return None
    asset_path = unquote(parsed.path)
    if not asset_path:
        return None
    if asset_path.startswith("/"):
        return root / asset_path.lstrip("/")
    return page.parent / asset_path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "root",
        nargs="?",
        default="_book",
        type=Path,
        help="rendered HTML root (default: _book)",
    )
    args = parser.parse_args()
    root = args.root.resolve()
    pages = sorted(root.rglob("*.html"))
    if not pages:
        print(f"FAILED: no rendered HTML pages under {root}")
        return 1

    checked: set[Path] = set()
    missing: dict[tuple[str, Path], list[Path]] = {}
    metadata_errors: list[str] = []
    for page in pages:
        html_parser = SupportAssetParser()
        html_parser.feed(page.read_text(encoding="utf-8"))
        for kind, raw_url in html_parser.assets:
            asset = local_asset(page, root, raw_url)
            if asset is None:
                continue
            resolved = asset.resolve()
            checked.add(resolved)
            if not resolved.is_file():
                missing.setdefault((kind, resolved), []).append(page.relative_to(root))

        page_name = str(page.relative_to(root))
        absent_social = sorted(REQUIRED_SOCIAL_METADATA - html_parser.metadata.keys())
        if absent_social:
            metadata_errors.append(
                f"{page_name}: missing social metadata {', '.join(absent_social)}"
            )
        if page.name != "404.html":
            absent_citation = sorted(
                REQUIRED_CITATION_METADATA - html_parser.metadata.keys()
            )
            if absent_citation:
                metadata_errors.append(
                    f"{page_name}: missing citation metadata "
                    f"{', '.join(absent_citation)}"
                )
            if html_parser.mathjax_urls != [PINNED_MATHJAX_URL]:
                metadata_errors.append(
                    f"{page_name}: expected exact MathJax pin {PINNED_MATHJAX_URL}, "
                    f"found {html_parser.mathjax_urls}"
                )

    if missing or metadata_errors:
        for (kind, asset), affected_pages in sorted(
            missing.items(), key=lambda item: str(item[0][1])
        ):
            try:
                label = asset.relative_to(root)
            except ValueError:
                label = asset
            sample = ", ".join(str(page) for page in affected_pages[:3])
            if len(affected_pages) > 3:
                sample += ", …"
            print(
                f"missing {kind} {label} "
                f"({len(affected_pages)} page(s): {sample})"
            )
        for error in metadata_errors:
            print(error)
        print(
            f"FAILED: {len(missing)} missing unique HTML support asset(s) and "
            f"{len(metadata_errors)} metadata/renderer violation(s) across "
            f"{len(pages)} page(s)"
        )
        return 1

    print(
        f"HTML support assets and metadata: pass ({len(pages)} pages, "
        f"{len(checked)} unique local stylesheets/scripts/icons, exact MathJax pin)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
