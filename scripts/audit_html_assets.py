#!/usr/bin/env python3
"""Audit rendered HTML support assets, identity metadata, and renderer pins."""

from __future__ import annotations

import argparse
from datetime import date
from html.parser import HTMLParser
import re
from pathlib import Path
from urllib.parse import quote, unquote, urljoin, urlsplit


def is_focusable(tag: str, values: dict[str, str | None]) -> bool:
    """Recognize the native and tabindex-based controls relevant to page order."""
    if "disabled" in values or values.get("tabindex") == "-1":
        return False
    if tag in {"a", "area"}:
        return bool(values.get("href"))
    if tag == "input":
        return values.get("type") != "hidden"
    if tag in {"button", "select", "summary", "textarea"}:
        return True
    tabindex = values.get("tabindex")
    return bool(tabindex and tabindex.lstrip("+").isdigit())


class SupportAssetParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.assets: list[tuple[str, str]] = []
        self.metadata: dict[str, list[str]] = {}
        self.mathjax_urls: list[str] = []
        self.download_pages: list[str] = []
        self.direct_pdf_links: list[tuple[str, bool]] = []
        self.support_links: list[str] = []
        self.cover_alts: list[str] = []
        self.coffee_icons: list[str | None] = []
        self.canonical_urls: list[str] = []
        self.body_depth = 0
        self.body_ids: set[str] = set()
        self.first_focusable: tuple[str, str | None, str] | None = None
        self.skip_links: list[str] = []
        self.edition_stamps: list[str] = []
        self.edition_stamp_links: list[list[str]] = []
        self._edition_stamp_depth = 0
        self._edition_stamp_parts: list[str] = []
        self._edition_stamp_links: list[str] = []
        self.main_depth = 0
        self.main_suppressed_depth = 0
        self.main_text_parts: list[str] = []
        self.main_images: list[tuple[str, str | None]] = []

    def handle_starttag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        values = dict(attrs)
        classes = (values.get("class") or "").split()
        if self._edition_stamp_depth:
            self._edition_stamp_depth += 1
            if tag == "a" and values.get("href"):
                self._edition_stamp_links.append(values["href"] or "")
        elif "edition-stamp" in classes:
            self._edition_stamp_depth = 1
            self._edition_stamp_parts = []
            self._edition_stamp_links = []

        if tag == "body":
            self.body_depth += 1
        elif self.body_depth:
            if identifier := values.get("id"):
                self.body_ids.add(identifier)
            if self.first_focusable is None and is_focusable(tag, values):
                self.first_focusable = (
                    tag,
                    values.get("href"),
                    values.get("class") or "",
                )
            if tag == "a" and "visually-hidden-focusable" in classes:
                self.skip_links.append(values.get("href") or "")

        if tag == "main":
            self.main_depth += 1
        elif self.main_depth:
            if tag in MAIN_TEXT_EXCLUDED_TAGS:
                self.main_suppressed_depth += 1
            elif self.main_suppressed_depth == 0 and tag in MAIN_TEXT_BREAK_TAGS:
                self.main_text_parts.append("\n")

            if tag == "img" and self.main_suppressed_depth == 0:
                self.main_images.append(
                    (values.get("src") or "<image without src>", values.get("alt"))
                )

        if tag == "link":
            relations = (values.get("rel") or "").split()
            if "canonical" in relations and (href := values.get("href")):
                self.canonical_urls.append(href)
            if "stylesheet" in relations and (href := values.get("href")):
                self.assets.append(("stylesheet", href))
            if "icon" in relations and (href := values.get("href")):
                self.assets.append(("icon", href))
        elif tag == "script" and (src := values.get("src")):
            self.assets.append(("script", src))
            if "mathjax" in src.lower():
                self.mathjax_urls.append(src)
        elif tag == "img" and (src := values.get("src")):
            self.assets.append(("image", src))
            if Path(urlsplit(src).path).name == "cover.png":
                self.cover_alts.append(values.get("alt") or "")
        elif tag == "meta" and (key := values.get("name") or values.get("property")):
            self.metadata.setdefault(key, []).append(values.get("content") or "")

        if tag == "a" and values.get("aria-label") == "Get the PDF":
            if href := values.get("href"):
                self.download_pages.append(href)
        if tag == "a" and (href := values.get("href")):
            if Path(urlsplit(href).path).name in {
                PRINT_PDF_NAME,
                CONTINUOUS_PDF_NAME,
            }:
                self.direct_pdf_links.append((href, "download" in values))
            if href == SUPPORT_URL:
                self.support_links.append(href)
        if (
            tag == "span"
            and "support-project-icon" in (values.get("class") or "").split()
        ):
            self.coffee_icons.append(values.get("aria-hidden"))

    def handle_endtag(self, tag: str) -> None:
        if self._edition_stamp_depth:
            self._edition_stamp_depth -= 1
            if self._edition_stamp_depth == 0:
                self.edition_stamps.append(
                    " ".join("".join(self._edition_stamp_parts).split())
                )
                self.edition_stamp_links.append(self._edition_stamp_links.copy())

        if tag == "main":
            self.main_depth = max(0, self.main_depth - 1)
        elif self.main_depth:
            if tag in MAIN_TEXT_EXCLUDED_TAGS:
                self.main_suppressed_depth = max(
                    0, self.main_suppressed_depth - 1
                )
            elif self.main_suppressed_depth == 0 and tag in MAIN_TEXT_BREAK_TAGS:
                self.main_text_parts.append("\n")
        if tag == "body":
            self.body_depth = max(0, self.body_depth - 1)

    def handle_data(self, data: str) -> None:
        if self._edition_stamp_depth:
            self._edition_stamp_parts.append(data)
        if self.main_depth and self.main_suppressed_depth == 0:
            self.main_text_parts.append(data)

    @property
    def main_text(self) -> str:
        return "".join(self.main_text_parts)


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
PRINT_PDF_NAME = "Deep-Learning--Making-It-Learnable.pdf"
CONTINUOUS_PDF_NAME = "Deep-Learning--Making-It-Learnable--Continuous.pdf"
DOWNLOAD_PAGE_NAME = "download.html"
SUPPORT_URL = "https://buymeacoffee.com/hshakeri"
EXPECTED_HTML_PAGES = 32
ROOT = Path(__file__).resolve().parents[1]
MAIN_TEXT_EXCLUDED_TAGS = {"script", "style", "pre", "code"}
MAIN_TEXT_BREAK_TAGS = {
    "address",
    "article",
    "aside",
    "blockquote",
    "br",
    "div",
    "figcaption",
    "figure",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "li",
    "p",
    "section",
    "td",
    "th",
    "tr",
}
RENDERED_LEAK_PATTERNS = {
    "raw {.unnumbered} attribute": re.compile(r"\{\.unnumbered\}"),
    "raw {#id} attribute": re.compile(r"\{#[A-Za-z]"),
    "raw Markdown heading": re.compile(r"(?m)^[ \t]*#{2,}[ \t]+\S"),
    "unresolved cross-reference": re.compile(
        r"(?<![/\w])@(fig|sec|eq|tbl|lst|exfig|aefig|ttrfig|epfig)-[\w-]+"
    ),
}


def source_edition_metadata() -> tuple[str, str, str]:
    """Read expected publication metadata independently from rendered HTML."""
    config = (ROOT / "_quarto.yml").read_text(encoding="utf-8")
    index = (ROOT / "index.qmd").read_text(encoding="utf-8")
    site_match = re.search(r"^\s{2}site-url:\s*(\S+)\s*$", config, re.MULTILINE)
    date_match = re.search(
        r"^\s{2}date:\s*[\"']?([0-9]{4}-[0-9]{2}-[0-9]{2})[\"']?\s*$",
        config,
        re.MULTILINE,
    )
    version_match = re.search(
        r"^\s{2}version:\s*[\"']?([^\s\"']+)[\"']?\s*$",
        index,
        re.MULTILINE,
    )
    if not site_match or not date_match or not version_match:
        raise ValueError("Could not read site URL, book date, and citation version")
    rolling_date = date.fromisoformat(date_match.group(1))
    display_date = (
        f"{rolling_date.strftime('%B')} {rolling_date.day}, {rolling_date.year}"
    )
    return site_match.group(1).rstrip("/") + "/", display_date, version_match.group(1)


def expected_canonical(page: Path, root: Path, site_url: str) -> str:
    relative = page.relative_to(root).as_posix()
    if relative == "index.html":
        return site_url
    return urljoin(site_url, quote(relative, safe="/"))


def rendered_leak_errors(page_name: str, main_text: str) -> list[str]:
    """Report raw authoring syntax that escaped into reader-visible main text."""
    errors: list[str] = []
    for label, pattern in RENDERED_LEAK_PATTERNS.items():
        for match in pattern.finditer(main_text):
            compact = " ".join(match.group(0).split())
            errors.append(f"{page_name}: {label}: {compact}")
    return errors


def main_image_alt_errors(
    page_name: str, images: list[tuple[str, str | None]]
) -> list[str]:
    """Require a non-empty text alternative for every image in main content."""
    return [
        f"{page_name}: main image has empty alt text: {source}"
        for source, alt in images
        if not alt or not alt.strip()
    ]


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
    site_url, display_date, stable_version = source_edition_metadata()
    expected_stamp = (
        f"Rolling build · {display_date} · stable edition v{stable_version} · "
        "Revision notes"
    )
    revision_url = urljoin(site_url, "#revision-notes")
    pages = sorted(
        page
        for page in root.rglob("*.html")
        if "site_libs" not in page.relative_to(root).parts
    )
    if not pages:
        print(f"FAILED: no rendered HTML pages under {root}")
        return 1
    if len(pages) != EXPECTED_HTML_PAGES:
        print(
            f"FAILED: expected {EXPECTED_HTML_PAGES} rendered HTML pages, "
            f"found {len(pages)}"
        )
        return 1

    checked: set[Path] = set()
    missing: dict[tuple[str, Path], list[Path]] = {}
    metadata_errors: list[str] = []
    navigation_errors: list[str] = []
    rendered_content_errors: list[str] = []
    accessibility_errors: list[str] = []
    publication_errors: list[str] = []
    for page in pages:
        page_text = page.read_text(encoding="utf-8")
        html_parser = SupportAssetParser()
        html_parser.feed(page_text)
        for kind, raw_url in html_parser.assets:
            asset = local_asset(page, root, raw_url)
            if asset is None:
                continue
            resolved = asset.resolve()
            checked.add(resolved)
            if not resolved.is_file():
                missing.setdefault((kind, resolved), []).append(page.relative_to(root))

        page_name = str(page.relative_to(root))
        canonical = expected_canonical(page, root, site_url)
        if html_parser.canonical_urls != [canonical]:
            publication_errors.append(
                f"{page_name}: expected one canonical URL {canonical}, "
                f"found {html_parser.canonical_urls}"
            )
        if html_parser.edition_stamps != [expected_stamp]:
            publication_errors.append(
                f"{page_name}: expected one source-derived edition stamp, "
                f"found {html_parser.edition_stamps}"
            )
        if html_parser.edition_stamp_links != [[revision_url]]:
            publication_errors.append(
                f"{page_name}: edition stamp must link once to {revision_url}"
            )

        if page.name not in {"404.html", DOWNLOAD_PAGE_NAME}:
            first = html_parser.first_focusable
            if (
                first is None
                or first[0] != "a"
                or first[1] != "#quarto-document-content"
                or "visually-hidden-focusable" not in first[2].split()
            ):
                publication_errors.append(
                    f"{page_name}: first focusable element is not the main-content "
                    f"skip link: {first}"
                )
            if html_parser.skip_links != ["#quarto-document-content"]:
                publication_errors.append(
                    f"{page_name}: expected one main-content skip link, "
                    f"found {html_parser.skip_links}"
                )
            if "quarto-document-content" not in html_parser.body_ids:
                publication_errors.append(
                    f"{page_name}: skip-link target #quarto-document-content is missing"
                )

        rendered_content_errors.extend(
            rendered_leak_errors(page_name, html_parser.main_text)
        )
        accessibility_errors.extend(
            main_image_alt_errors(page_name, html_parser.main_images)
        )

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
        if page.name not in {"404.html", DOWNLOAD_PAGE_NAME}:
            if html_parser.mathjax_urls != [PINNED_MATHJAX_URL]:
                metadata_errors.append(
                    f"{page_name}: expected exact MathJax pin {PINNED_MATHJAX_URL}, "
                    f"found {html_parser.mathjax_urls}"
                )
            if len(html_parser.download_pages) != 1:
                navigation_errors.append(
                    f"{page_name}: expected one PDF landing-page action, "
                    f"found {len(html_parser.download_pages)}"
                )
            else:
                raw_download = html_parser.download_pages[0]
                download = local_asset(page, root, raw_download)
                if Path(urlsplit(raw_download).path).name != DOWNLOAD_PAGE_NAME:
                    navigation_errors.append(
                        f"{page_name}: PDF action targets {raw_download}, not "
                        f"{DOWNLOAD_PAGE_NAME}"
                    )
                elif download is None or not download.resolve().is_file():
                    navigation_errors.append(
                        f"{page_name}: PDF action target does not exist: {raw_download}"
                    )
        elif html_parser.download_pages:
            navigation_errors.append(
                f"{page_name}: standalone page must not duplicate the sidebar PDF action"
            )

        if page.name == DOWNLOAD_PAGE_NAME:
            expected_pdfs = {PRINT_PDF_NAME, CONTINUOUS_PDF_NAME}
            linked_pdfs = {
                Path(urlsplit(href).path).name
                for href, _ in html_parser.direct_pdf_links
            }
            if linked_pdfs != expected_pdfs or len(html_parser.direct_pdf_links) != 2:
                navigation_errors.append(
                    f"{page_name}: expected one direct link to each PDF edition, found "
                    f"{sorted(linked_pdfs)}"
                )
            for raw_pdf, is_download in html_parser.direct_pdf_links:
                target = local_asset(page, root, raw_pdf)
                if target is None or not target.resolve().is_file():
                    navigation_errors.append(
                        f"{page_name}: direct PDF target does not exist: {raw_pdf}"
                    )
                if not is_download:
                    navigation_errors.append(
                        f"{page_name}: direct PDF link must carry download: {raw_pdf}"
                    )
            if html_parser.support_links != [SUPPORT_URL]:
                navigation_errors.append(
                    f"{page_name}: expected one stable Buy Me a Coffee link"
                )
            if html_parser.cover_alts != [
                "Cover of Deep Learning: Making It Learnable by Heman Shakeri"
            ]:
                navigation_errors.append(
                    f"{page_name}: cover must have one specific accessible description"
                )
            for contract in (
                "$0 · Free",
                "Suggested contribution",
                "$20",
                "Contribution and download are independent.",
                'id="download-options" tabindex="-1"',
                'class="price-support-link"',
                "Download Deep Learning: Making It Learnable",
                "downloadOptions.focus();",
                'downloadOptions.scrollIntoView({ block: "start" })',
            ):
                if contract not in page_text:
                    navigation_errors.append(
                        f"{page_name}: missing free/support contract: {contract}"
                    )
            if not re.search(
                rf'<a class="price-support-link"\s+'
                rf'href="{re.escape(SUPPORT_URL)}">\$20</a>',
                page_text,
            ):
                navigation_errors.append(
                    f"{page_name}: suggested $20 must link to the support page"
                )
            for removed in (
                "Choose your PDF",
                "Choose an optional contribution",
                'name="contribution"',
            ):
                if removed in page_text:
                    navigation_errors.append(
                        f"{page_name}: redundant picker copy remains: {removed}"
                    )
            if 'target="_blank"' in page_text:
                navigation_errors.append(
                    f"{page_name}: support link opens an unannounced new tab"
                )

        if page_name == "index.html":
            depth_one_groups = re.findall(
                r'<ul id="quarto-sidebar-section-\d+" class="([^"]*\bdepth1\b[^"]*)"',
                page_text,
            )
            open_groups = [classes for classes in depth_one_groups if "show" in classes.split()]
            if len(depth_one_groups) != 6 or open_groups:
                navigation_errors.append(
                    "index.html: expected six closed root chapter groups, found "
                    f"{len(depth_one_groups)} group(s) and {len(open_groups)} open"
                )

            sidebar_titles = re.findall(
                r'<a class="sidebar-item-text[^\"]*" '
                r'data-bs-toggle="collapse"[^>]*>\s*'
                r'<span class="menu-text">([^<]+)</span>',
                page_text,
            )
            if len(sidebar_titles) != 6:
                navigation_errors.append(
                    "index.html: expected six primary chapter-group controls, found "
                    f"{len(sidebar_titles)}"
                )

            for label in ("About this edition", "Revision notes"):
                label_at = page_text.find(label, page_text.find("<main"))
                prefix = page_text[max(0, label_at - 900):label_at]
                if (
                    label_at < 0
                    or 'data-bs-toggle="collapse"' not in prefix
                    or 'aria-expanded="false"' not in prefix
                ):
                    navigation_errors.append(
                        f"index.html: {label} must render as a closed disclosure"
                    )

            if not all(
                contract in page_text
                for contract in (
                    'header.setAttribute("aria-label", label)',
                        'header.querySelector(":scope > .callout-title-container")',
                        'copy.querySelectorAll(".screen-reader-only")',
                        'document.querySelectorAll(sidebarToggleSelector)',
                        'chevron.setAttribute("aria-hidden", "true")',
                        'chevron.setAttribute("tabindex", "-1")',
                    )
                ):
                    navigation_errors.append(
                        "index.html: disclosure and chapter-group controls must be "
                        "named and keyboard operable"
                    )

            if not html_parser.coffee_icons:
                navigation_errors.append(
                    "index.html: decorative support coffee icon is missing"
                )
            elif any(value != "true" for value in html_parser.coffee_icons):
                navigation_errors.append(
                    "index.html: support coffee icons must be hidden from assistive text"
                )

    if (
        missing
        or metadata_errors
        or navigation_errors
        or rendered_content_errors
        or accessibility_errors
        or publication_errors
    ):
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
        for error in navigation_errors:
            print(error)
        for error in rendered_content_errors:
            print(error)
        for error in accessibility_errors:
            print(error)
        for error in publication_errors:
            print(error)
        print(
            f"FAILED: {len(missing)} missing unique HTML support asset(s) and "
            f"{len(metadata_errors)} metadata/renderer violation(s), "
            f"{len(navigation_errors)} navigation/disclosure violation(s), "
            f"{len(rendered_content_errors)} rendered-content leak(s), and "
            f"{len(accessibility_errors)} image-alt violation(s), and "
            f"{len(publication_errors)} canonical/stamp/skip-link violation(s) across "
            f"{len(pages)} page(s)"
        )
        return 1

    print(
        f"HTML support assets and metadata: pass ({len(pages)} pages, "
        f"{len(checked)} unique local stylesheets/scripts/icons, exact MathJax pin, "
        "canonical URLs, edition stamps, skip links, image alternatives, "
        "and leak-free rendered content)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
