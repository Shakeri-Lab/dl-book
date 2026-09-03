#!/usr/bin/env python3
"""Audit rendered HTML support assets, identity metadata, and renderer pins."""

from __future__ import annotations

import argparse
from datetime import date
from html.parser import HTMLParser
import json
import posixpath
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
        self.picture_sources: list[dict[str, str | None]] = []
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
        self.source_controls: list[dict[str, str | None]] = []
        self.source_control_texts: list[str] = []
        self.global_code_toggle_ids: list[str] = []
        self._source_control_depth = 0
        self._source_control_parts: list[str] = []
        self.chapter_tools: list[dict[str, str | None]] = []
        self.chapter_tool_links: list[dict[str, str | None]] = []
        self.chapter_tool_placeholders: list[dict[str, str | None]] = []
        self._chapter_tools_depth = 0
        self._chapter_tool_link_depth = 0
        self._chapter_tool_link_parts: list[str] = []
        self._chapter_tool_placeholder_depth = 0
        self._chapter_tool_placeholder_parts: list[str] = []
        self.main_depth = 0
        self.main_suppressed_depth = 0
        self.main_text_parts: list[str] = []
        self.main_images: list[tuple[str, str | None]] = []
        self.main_image_loading: list[dict[str, str | None]] = []

    def handle_starttag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        values = dict(attrs)
        classes = (values.get("class") or "").split()
        if tag == "aside" and "chapter-tools" in classes:
            self.chapter_tools.append(
                {"tag": tag, "aria_label": values.get("aria-label")}
            )
            self._chapter_tools_depth = 1
        elif self._chapter_tools_depth:
            self._chapter_tools_depth += 1
            if tag == "a":
                self.chapter_tool_links.append(
                    {
                        "class": values.get("class"),
                        "href": values.get("href"),
                        "data_kind": values.get("data-kind"),
                        "download": values.get("download"),
                        "has_download": "download" in values,
                        "target": values.get("target"),
                        "rel": values.get("rel"),
                        "text": None,
                    }
                )
                self._chapter_tool_link_depth = 1
                self._chapter_tool_link_parts = []
            if "chapter-tools__placeholder" in classes:
                self.chapter_tool_placeholders.append(
                    {
                        "tag": tag,
                        "class": values.get("class"),
                        "aria_disabled": values.get("aria-disabled"),
                        "href": values.get("href"),
                        "text": None,
                    }
                )
                self._chapter_tool_placeholder_depth = 1
                self._chapter_tool_placeholder_parts = []
            elif self._chapter_tool_placeholder_depth:
                self._chapter_tool_placeholder_depth += 1
            if self._chapter_tool_link_depth and tag != "a":
                self._chapter_tool_link_depth += 1
        identifier = values.get("id")
        if identifier in GLOBAL_CODE_TOGGLE_IDS:
            self.global_code_toggle_ids.append(identifier or "")
        if identifier == SOURCE_CONTROL_ID:
            self.source_controls.append(
                {
                    "tag": tag,
                    "type": values.get("type"),
                    "class": values.get("class"),
                    "source_url": values.get("data-quarto-source-url"),
                    "data_bs_toggle": values.get("data-bs-toggle"),
                }
            )
            self._source_control_depth = 1
            self._source_control_parts = []
        elif self._source_control_depth:
            self._source_control_depth += 1
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
                self.main_image_loading.append(
                    {
                        "src": values.get("src") or "<image without src>",
                        "loading": values.get("loading"),
                        "decoding": values.get("decoding"),
                    }
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
        elif tag == "source" and (srcset := values.get("srcset")):
            source = srcset.split(",", 1)[0].strip().split(" ", 1)[0]
            self.assets.append(("image source", source))
            self.picture_sources.append(
                {
                    "srcset": srcset,
                    "type": values.get("type"),
                }
            )
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
        if self._chapter_tool_link_depth:
            self._chapter_tool_link_depth -= 1
            if self._chapter_tool_link_depth == 0:
                self.chapter_tool_links[-1]["text"] = " ".join(
                    "".join(self._chapter_tool_link_parts).split()
                )
        if self._chapter_tool_placeholder_depth:
            self._chapter_tool_placeholder_depth -= 1
            if self._chapter_tool_placeholder_depth == 0:
                self.chapter_tool_placeholders[-1]["text"] = " ".join(
                    "".join(self._chapter_tool_placeholder_parts).split()
                )
        if self._chapter_tools_depth:
            self._chapter_tools_depth -= 1

        if self._source_control_depth:
            self._source_control_depth -= 1
            if self._source_control_depth == 0:
                self.source_control_texts.append(
                    " ".join("".join(self._source_control_parts).split())
                )

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
        if self._chapter_tool_link_depth:
            self._chapter_tool_link_parts.append(data)
        if self._chapter_tool_placeholder_depth:
            self._chapter_tool_placeholder_parts.append(data)
        if self._source_control_depth:
            self._source_control_parts.append(data)
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
DOWNLOAD_COVER_WEBP = "figures/cover.webp"
MAX_DOWNLOAD_COVER_BYTES = 250 * 1024
SUPPORT_URL = "https://buymeacoffee.com/hshakeri"
EXPECTED_REPO_URL = "https://github.com/Shakeri-Lab/dl-book"
EXPECTED_REPO_BRANCH = "main"
LECTURE_MANIFEST = Path(__file__).resolve().parents[1] / "data/lectures.yml"
NOTEBOOK_MANIFEST = Path(__file__).resolve().parent / "notebook_manifest.json"
LECTURE_PLAYLIST_LABEL = "Lecture playlist"
COLAB_NOTEBOOK_PREFIX = (
    "https://colab.research.google.com/github/Shakeri-Lab/dl-book/blob/"
    "gh-pages/notebooks/"
)
SOURCE_CONTROL_ID = "quarto-code-tools-source"
GLOBAL_CODE_TOGGLE_IDS = {
    "quarto-code-tools-menu",
    "quarto-show-all-code",
    "quarto-hide-all-code",
}
EXPECTED_SOURCE_PAGE_COUNT = 35
EXPECTED_CHAPTER_TOOL_PAGE_COUNT = 30
EXPECTED_NOTEBOOK_PAGE_COUNT = 26
EXPECTED_NOTEBOOK_PLACEHOLDER_COUNT = 4
MINIMUM_SPECIFIC_LECTURE_PAGES = 20
EXPECTED_SPECIFIC_LECTURE_PAGES = 27
EXPECTED_FALLBACK_LECTURE_PAGES = 3
EXPECTED_HTML_PAGES = 37
EXPECTED_PART_PAGES = {
    "chapters/parts/p1-lines-to-networks.html": "From Lines to Networks",
    "chapters/parts/p2-vision.html": "Vision: Learning the Filters",
    "chapters/parts/p3-sequences.html": "Sequences: Learning the Summary",
    "chapters/parts/p4-attention.html": "Attention: Learning the Similarity",
    "chapters/parts/p5-pretrained-era.html": (
        "The Pretrained Era: Learning What to Reuse"
    ),
}
EXPECTED_FIRST_CHAPTER_PART_LINKS = {
    "chapters/part1/01-linear-regression.html": (
        "../../chapters/parts/p1-lines-to-networks.html"
    ),
    "chapters/part2/07-filters-convolution.html": (
        "../../chapters/parts/p2-vision.html"
    ),
    "chapters/part3/10-sequences-rnn.html": (
        "../../chapters/parts/p3-sequences.html"
    ),
    "chapters/part4/12-kernel-regression.html": (
        "../../chapters/parts/p4-attention.html"
    ),
    "chapters/part5/17-peft-quantization.html": (
        "../../chapters/parts/p5-pretrained-era.html"
    ),
}
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
CROSS_VOLUME_NAMES = ("making it trainable", "companion volume")
CROSS_VOLUME_DEPENDENCY_CUES = (
    "defer",
    "relies on",
    "requires",
    "assumes",
    "does not repeat",
    "instead of",
    "prerequisite",
    "see the companion for the full",
)


def source_edition_metadata() -> tuple[str, str, str, str]:
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
    status_match = re.search(
        r"^dlbook-html-edition-status:\s*(stable|rolling)\s*$",
        index,
        re.MULTILINE,
    )
    if not site_match or not date_match or not version_match or not status_match:
        raise ValueError(
            "Could not read site URL, book date, citation version, and HTML edition status"
        )
    rolling_date = date.fromisoformat(date_match.group(1))
    display_date = (
        f"{rolling_date.strftime('%B')} {rolling_date.day}, {rolling_date.year}"
    )
    return (
        site_match.group(1).rstrip("/") + "/",
        display_date,
        version_match.group(1),
        status_match.group(1),
    )


def source_page_contract() -> dict[str, str]:
    """Map each configured Quarto input to its exact GitHub source URL."""
    config = (ROOT / "_quarto.yml").read_text(encoding="utf-8")
    repo_match = re.search(r"^\s{2}repo-url:\s*(\S+)\s*$", config, re.MULTILINE)
    branch_match = re.search(
        r"^\s{2}repo-branch:\s*(\S+)\s*$", config, re.MULTILINE
    )
    if repo_match is None:
        raise ValueError("Could not read the repository URL from _quarto.yml")
    source_paths = re.findall(
        r"^\s*-\s+(?:part:\s+)?([^\s#]+\.qmd)\s*$",
        config,
        re.MULTILINE,
    )
    if len(source_paths) != EXPECTED_SOURCE_PAGE_COUNT:
        raise ValueError(
            f"Expected {EXPECTED_SOURCE_PAGE_COUNT} configured QMD inputs, "
            f"found {len(source_paths)}"
        )
    repo_url = repo_match.group(1).rstrip("/")
    branch = branch_match.group(1) if branch_match else "main"
    if repo_url != EXPECTED_REPO_URL or branch != EXPECTED_REPO_BRANCH:
        raise ValueError(
            "Source links must target "
            f"{EXPECTED_REPO_URL}/blob/{EXPECTED_REPO_BRANCH}/"
        )
    if len(set(source_paths)) != len(source_paths):
        raise ValueError("Configured QMD inputs must be unique")
    return {
        str(Path(source).with_suffix(".html")): (
            f"{repo_url}/blob/{branch}/{source}"
        )
        for source in source_paths
    }


def parse_lecture_manifest(path: Path) -> dict[str, list[dict[str, str]]]:
    """Parse the intentionally narrow lectures.yml schema without PyYAML."""
    if not path.is_file():
        raise ValueError(f"Missing lecture manifest: {path}")

    manifest: dict[str, list[dict[str, str]]] = {}
    current_source: str | None = None
    pending_label: str | None = None
    saw_root = False
    source_re = re.compile(r'^  ("(?:[^"\\]|\\.)+"):\s*$')
    label_re = re.compile(r'^    - label:\s*("(?:[^"\\]|\\.)*")\s*$')
    url_re = re.compile(r'^      url:\s*("(?:[^"\\]|\\.)*")\s*$')

    for line_number, raw_line in enumerate(
        path.read_text(encoding="utf-8").splitlines(), start=1
    ):
        if not raw_line.strip() or raw_line.lstrip().startswith("#"):
            continue
        if raw_line == "lectures:" and not saw_root and not manifest:
            saw_root = True
            continue
        source_match = source_re.fullmatch(raw_line)
        if source_match:
            if pending_label is not None:
                raise ValueError(
                    f"data/lectures.yml line {line_number}: previous entry lacks url"
                )
            current_source = json.loads(source_match.group(1))
            if current_source in manifest:
                raise ValueError(
                    f"data/lectures.yml line {line_number}: duplicate source "
                    f"{current_source!r}"
                )
            manifest[current_source] = []
            continue
        label_match = label_re.fullmatch(raw_line)
        if label_match and current_source is not None and pending_label is None:
            pending_label = json.loads(label_match.group(1))
            continue
        url_match = url_re.fullmatch(raw_line)
        if url_match and current_source is not None and pending_label is not None:
            label = pending_label
            manifest[current_source].append(
                {
                    "label": label,
                    "url": json.loads(url_match.group(1)),
                    "kind": (
                        "fallback" if label == LECTURE_PLAYLIST_LABEL else "specific"
                    ),
                }
            )
            pending_label = None
            continue
        raise ValueError(
            f"data/lectures.yml line {line_number}: invalid lectures schema"
        )

    if not saw_root:
        raise ValueError("data/lectures.yml: top-level 'lectures' map is missing")
    if pending_label is not None:
        raise ValueError("data/lectures.yml: final lecture entry lacks url")
    if any(not entries for entries in manifest.values()):
        empty = sorted(source for source, entries in manifest.items() if not entries)
        raise ValueError(f"data/lectures.yml: empty resource lists for {empty}")
    return manifest


def notebook_page_contract(
    expected_source_pages: dict[str, str],
) -> dict[str, str]:
    """Map the exact public notebook manifest onto rendered HTML pages."""
    if not NOTEBOOK_MANIFEST.is_file():
        raise ValueError(f"Missing notebook manifest: {NOTEBOOK_MANIFEST}")
    document = json.loads(NOTEBOOK_MANIFEST.read_text(encoding="utf-8"))
    if not isinstance(document, dict) or document.get("schema_version") != 1:
        raise ValueError("scripts/notebook_manifest.json must use schema version 1")
    entries = document.get("notebooks")
    if not isinstance(entries, list) or len(entries) != EXPECTED_NOTEBOOK_PAGE_COUNT:
        found = len(entries) if isinstance(entries, list) else "a non-list value"
        raise ValueError(
            f"Expected {EXPECTED_NOTEBOOK_PAGE_COUNT} notebook entries, found {found}"
        )

    rendered: dict[str, str] = {}
    slugs: set[str] = set()
    for index, entry in enumerate(entries, start=1):
        if not isinstance(entry, dict):
            raise ValueError(f"Notebook manifest entry {index} must be an object")
        source = entry.get("source")
        slug = entry.get("slug")
        if not isinstance(source, str) or not isinstance(slug, str):
            raise ValueError(
                f"Notebook manifest entry {index} needs string source and slug fields"
            )
        if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", slug):
            raise ValueError(f"Notebook manifest entry {index} has invalid slug {slug!r}")
        page = str(Path(source).with_suffix(".html"))
        if page not in expected_source_pages:
            raise ValueError(f"Notebook source is not a configured book page: {source}")
        if page in EXPECTED_PART_PAGES:
            raise ValueError(f"Part page must not publish a notebook: {source}")
        if page in rendered:
            raise ValueError(f"Duplicate notebook source in manifest: {source}")
        if slug in slugs:
            raise ValueError(f"Duplicate notebook slug in manifest: {slug}")
        rendered[page] = slug
        slugs.add(slug)

    non_part_pages = set(expected_source_pages) - set(EXPECTED_PART_PAGES)
    if not set(rendered) < non_part_pages:
        raise ValueError("Notebook pages must be a proper subset of non-Part pages")
    unavailable = non_part_pages - set(rendered)
    if len(unavailable) != EXPECTED_NOTEBOOK_PLACEHOLDER_COUNT:
        raise ValueError(
            f"Expected {EXPECTED_NOTEBOOK_PLACEHOLDER_COUNT} explicit unavailable "
            f"notebook pages, found {len(unavailable)}: {sorted(unavailable)}"
        )
    return rendered


def notebook_download_href(page_name: str, slug: str) -> str:
    """Return the browser-relative public notebook URL for one rendered page."""
    parent = str(Path(page_name).parent).replace("\\", "/")
    if parent == ".":
        parent = ""
    return posixpath.relpath(f"notebooks/{slug}.ipynb", start=parent or ".")


def chapter_tools_page_contract(
    expected_source_pages: dict[str, str],
) -> tuple[dict[str, list[dict[str, str]]], int, int]:
    """Map manifest entries to rendered pages and count specific/fallback pages."""
    manifest = parse_lecture_manifest(LECTURE_MANIFEST)
    expected_pages = set(expected_source_pages) - set(EXPECTED_PART_PAGES)
    rendered_manifest = {
        str(Path(source).with_suffix(".html")): entries
        for source, entries in manifest.items()
    }
    if set(rendered_manifest) != expected_pages:
        missing = sorted(expected_pages - set(rendered_manifest))
        unexpected = sorted(set(rendered_manifest) - expected_pages)
        raise ValueError(
            "Chapter-tools manifest differs from the configured non-Part pages; "
            f"missing {missing}, unexpected {unexpected}"
        )
    if len(rendered_manifest) != EXPECTED_CHAPTER_TOOL_PAGE_COUNT:
        raise ValueError(
            f"Expected {EXPECTED_CHAPTER_TOOL_PAGE_COUNT} chapter-tools pages, "
            f"found {len(rendered_manifest)}"
        )

    for page_name, entries in rendered_manifest.items():
        seen_resources: set[tuple[str, str]] = set()
        for entry in entries:
            label = entry["label"]
            url = entry["url"]
            parsed = urlsplit(url)
            if not label or label != label.strip():
                raise ValueError(
                    f"{page_name}: lecture labels must be nonempty and unpadded"
                )
            if (
                not url
                or url != url.strip()
                or parsed.scheme != "https"
                or not parsed.netloc
            ):
                raise ValueError(
                    f"{page_name}: lecture resources must use nonempty HTTPS URLs"
                )
            resource = (label, url)
            if resource in seen_resources:
                raise ValueError(
                    f"{page_name}: duplicate lecture resource {label!r}"
                )
            seen_resources.add(resource)
        if any(entry["kind"] == "fallback" for entry in entries) and len(entries) != 1:
            raise ValueError(
                f"{page_name}: playlist fallback cannot be mixed with specific links"
            )

    specific_pages = sum(
        any(entry["kind"] == "specific" for entry in entries)
        for entries in rendered_manifest.values()
    )
    fallback_only_pages = sum(
        all(entry["kind"] == "fallback" for entry in entries)
        for entries in rendered_manifest.values()
    )
    return rendered_manifest, specific_pages, fallback_only_pages


def chapter_tools_follows_title(page_name: str, page_text: str) -> bool:
    """Require the tool strip to be the next element after Quarto's title header."""
    if page_name == "index.html":
        title_endings = list(
            re.finditer(
                r'<h1\b[^>]*\bclass="[^"]*\bunnumbered\b[^"]*"[^>]*>'
                r"\s*Preface\s*</h1>",
                page_text,
                re.DOTALL,
            )
        )
    else:
        title_endings = list(
            re.finditer(
                r'<header\b(?=[^>]*\bid="title-block-header")[^>]*>.*?</header>',
                page_text,
                re.DOTALL,
            )
        )
    asides = list(
        re.finditer(
            r'<aside\b(?=[^>]*\bclass="[^"]*\bchapter-tools\b[^"]*")[^>]*>',
            page_text,
        )
    )
    if len(title_endings) != 1 or len(asides) != 1:
        return False
    between = page_text[title_endings[0].end() : asides[0].start()]
    between = re.sub(r"<!--.*?-->", "", between, flags=re.DOTALL)
    return not between.strip()


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


def main_image_loading_errors(
    page_name: str, images: list[dict[str, str | None]]
) -> list[str]:
    """Require an eager first image and lazy, asynchronous later images."""
    errors: list[str] = []
    if not images:
        return errors

    first = images[0]
    if first["loading"] is not None or first["decoding"] is not None:
        errors.append(
            f"{page_name}: first content image must remain eager, found "
            f"loading={first['loading']!r}, decoding={first['decoding']!r} "
            f"for {first['src']}"
        )

    for index, image in enumerate(images[1:], start=2):
        if image["loading"] != "lazy" or image["decoding"] != "async":
            errors.append(
                f"{page_name}: content image {index} must use loading='lazy' "
                f"and decoding='async', found loading={image['loading']!r}, "
                f"decoding={image['decoding']!r} for {image['src']}"
            )
    return errors


def html_source_errors() -> list[str]:
    """Pin the source-side contracts behind Phase E and F HTML behavior."""
    errors: list[str] = []
    plan_script = (ROOT / "plan-code-interactions.html").read_text(encoding="utf-8")
    mathjax_config = (ROOT / "mathjax-config.html").read_text(encoding="utf-8")
    lazy_filter = ROOT / "filters/lazy-images.lua"
    chapter_tools = (ROOT / "filters/chapter-tools.lua").read_text(encoding="utf-8")
    quarto_config = (ROOT / "_quarto.yml").read_text(encoding="utf-8")

    if re.search(r"\bregion\.hidden\s*=", plan_script):
        errors.append(
            "plan-code-interactions.html: step regions must not collapse with "
            "region.hidden assignment"
        )
    for contract in (
        'setAttribute("hidden", "until-found")',
        'addEventListener("beforematch"',
        'setAttribute(\n          "aria-controls"',
        "collapseFocusTargets(mapping)",
        "openFocusTargets(mapping)",
        'querySelectorAll("pre.sourceCode, .code-copy-button")',
    ):
        if contract not in plan_script:
            errors.append(
                "plan-code-interactions.html: missing searchable-collapse contract "
                f"{contract!r}"
            )

    if not re.search(
        r"loader\s*:\s*\{\s*load\s*:\s*\[\s*[\"']ui/lazy[\"']\s*\]",
        mathjax_config,
        re.DOTALL,
    ):
        errors.append(
            "mathjax-config.html: pinned MathJax must load the ui/lazy extension"
        )
    if not re.search(
        r"lazyAlwaysTypeset\s*:\s*\[\s*['\"]head['\"]\s*,\s*"
        r"['\"]span\[id\^=['\"]eq-['\"]\]['\"]\s*\]",
        mathjax_config,
    ):
        errors.append(
            "mathjax-config.html: numbered equation containers must remain eager "
            "under lazy MathJax"
        )

    if not lazy_filter.is_file():
        errors.append("filters/lazy-images.lua: HTML lazy-image filter is missing")
    else:
        filter_text = lazy_filter.read_text(encoding="utf-8")
        for contract in (
            'FORMAT:match("^html")',
            'image.attributes.loading = "lazy"',
            'image.attributes.decoding = "async"',
        ):
            if contract not in filter_text:
                errors.append(
                    "filters/lazy-images.lua: missing image-loading contract "
                    f"{contract!r}"
                )

    for contract in (
        "- filters/lazy-images.lua",
        "- figures/cover.webp",
    ):
        if contract not in quarto_config:
            errors.append(f"_quarto.yml: missing Phase E contract {contract!r}")

    for contract in (
        'scripts", "notebook_manifest.json"',
        'data-kind="notebook-download"',
        'data-kind="colab"',
        'Notebook <span class="visually-hidden">(not available for this page)</span>',
        "gh-pages/notebooks/",
    ):
        if contract not in chapter_tools:
            errors.append(
                "filters/chapter-tools.lua: missing Phase F notebook contract "
                f"{contract!r}"
            )

    return errors


def cross_volume_advisories(page_name: str, main_text: str) -> list[str]:
    """Warn when a sibling-book pointer sounds like a prerequisite."""
    prose = " ".join(main_text.split())
    sentences = re.split(r"(?<=[.!?])\s+", prose)
    advisories: list[str] = []
    for sentence in sentences:
        folded = sentence.casefold()
        if not any(name in folded for name in CROSS_VOLUME_NAMES):
            continue
        if not any(cue in folded for cue in CROSS_VOLUME_DEPENDENCY_CUES):
            continue
        advisories.append(f"ADVISORY: {page_name}: {sentence}")
    return advisories


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
    parser.add_argument(
        "--allow-missing-generated-pdfs",
        action="store_true",
        help=(
            "Allow an HTML-only execution audit to omit generated PDF files while "
            "still checking both download links and every other landing-page contract"
        ),
    )
    parser.add_argument(
        "--allow-missing-generated-notebooks",
        action="store_true",
        help=(
            "Allow an HTML-only audit to omit generated notebook files while still "
            "checking all 26 routes and every rendered chapter-tools contract"
        ),
    )
    args = parser.parse_args()
    root = args.root.resolve()
    source_contract_errors = html_source_errors()
    expected_source_pages = source_page_contract()
    try:
        expected_chapter_tools, specific_lecture_pages, fallback_lecture_pages = (
            chapter_tools_page_contract(expected_source_pages)
        )
        expected_notebooks = notebook_page_contract(expected_source_pages)
    except (ValueError, json.JSONDecodeError) as error:
        print(f"FAILED: {error}")
        return 1
    if specific_lecture_pages < MINIMUM_SPECIFIC_LECTURE_PAGES:
        print(
            "WARNING: only "
            f"{specific_lecture_pages} chapter-tools pages have specific lecture "
            f"resources; expected at least {MINIMUM_SPECIFIC_LECTURE_PAGES}"
        )
    if (
        specific_lecture_pages != EXPECTED_SPECIFIC_LECTURE_PAGES
        or fallback_lecture_pages != EXPECTED_FALLBACK_LECTURE_PAGES
    ):
        print(
            "FAILED: expected chapter-tools coverage of "
            f"{EXPECTED_SPECIFIC_LECTURE_PAGES} specific-resource pages and "
            f"{EXPECTED_FALLBACK_LECTURE_PAGES} fallback-only pages; found "
            f"{specific_lecture_pages} and {fallback_lecture_pages}"
        )
        return 1
    site_url, display_date, stable_version, edition_status = (
        source_edition_metadata()
    )
    expected_stamp = (
        f"Stable edition v{stable_version} · released {display_date} · "
        "Revision notes"
        if edition_status == "stable"
        else f"Rolling manuscript · content updated {display_date} · "
        f"stable edition v{stable_version} · Revision notes"
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

    page_names = {str(page.relative_to(root)) for page in pages}
    expected_standalone_pages = {"404.html", DOWNLOAD_PAGE_NAME}
    if set(expected_source_pages) != page_names - expected_standalone_pages:
        missing_source_pages = sorted(set(expected_source_pages) - page_names)
        unexpected_pages = sorted(
            page_names - set(expected_source_pages) - expected_standalone_pages
        )
        print(
            "FAILED: rendered QMD/source-page contract differs; missing "
            f"{missing_source_pages}, unexpected {unexpected_pages}"
        )
        return 1
    missing_part_pages = sorted(set(EXPECTED_PART_PAGES) - page_names)
    if missing_part_pages:
        print(
            "FAILED: missing rendered part page(s): "
            + ", ".join(missing_part_pages)
        )
        return 1

    checked: set[Path] = set()
    missing: dict[tuple[str, Path], list[Path]] = {}
    metadata_errors: list[str] = []
    navigation_errors: list[str] = []
    rendered_content_errors: list[str] = []
    accessibility_errors: list[str] = []
    publication_errors: list[str] = []
    advisories: list[str] = []
    missing_notebooks = [
        root / "notebooks" / f"{slug}.ipynb"
        for slug in expected_notebooks.values()
        if not (root / "notebooks" / f"{slug}.ipynb").is_file()
    ]
    if missing_notebooks and not args.allow_missing_generated_notebooks:
        publication_errors.extend(
            f"missing published notebook {path.relative_to(root)}"
            for path in missing_notebooks
        )
    notebook_linked_pages = 0
    notebook_placeholder_pages = 0
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
        expected_source_url = expected_source_pages.get(page_name)
        if expected_source_url is not None:
            expected_source_control = {
                "tag": "button",
                "type": "button",
                "class": "btn code-tools-button",
                "source_url": expected_source_url,
                "data_bs_toggle": None,
            }
            if html_parser.source_controls != [expected_source_control]:
                navigation_errors.append(
                    f"{page_name}: expected one direct Source control for "
                    f"{expected_source_url}, found {html_parser.source_controls}"
                )
            if html_parser.source_control_texts != ["Source"]:
                navigation_errors.append(
                    f"{page_name}: source-control caption must be exactly 'Source', "
                    f"found {html_parser.source_control_texts}"
                )
            if html_parser.global_code_toggle_ids:
                navigation_errors.append(
                    f"{page_name}: global code toggle must stay disabled, found "
                    f"{html_parser.global_code_toggle_ids}"
                )
        elif html_parser.source_controls or html_parser.global_code_toggle_ids:
            navigation_errors.append(
                f"{page_name}: standalone support page unexpectedly carries "
                "a Quarto code tool"
            )

        expected_lecture_entries = expected_chapter_tools.get(page_name)
        if expected_lecture_entries is not None:
            expected_aside = {"tag": "aside", "aria_label": "Chapter tools"}
            if html_parser.chapter_tools != [expected_aside]:
                navigation_errors.append(
                    f"{page_name}: expected one accessible chapter-tools aside, "
                    f"found {html_parser.chapter_tools}"
                )
            expected_links = [
                {
                    "class": "chapter-tools__link",
                    "href": entry["url"],
                    "data_kind": entry["kind"],
                    "download": None,
                    "has_download": False,
                    "target": None,
                    "rel": None,
                    "text": entry["label"],
                }
                for entry in expected_lecture_entries
            ]
            notebook_slug = expected_notebooks.get(page_name)
            if notebook_slug is not None:
                notebook_linked_pages += 1
                expected_links.extend(
                    [
                        {
                            "class": "chapter-tools__link",
                            "href": notebook_download_href(page_name, notebook_slug),
                            "data_kind": "notebook-download",
                            "download": "",
                            "has_download": True,
                            "target": None,
                            "rel": None,
                            "text": "Download notebook",
                        },
                        {
                            "class": "chapter-tools__link",
                            "href": COLAB_NOTEBOOK_PREFIX
                            + f"{notebook_slug}.ipynb",
                            "data_kind": "colab",
                            "download": None,
                            "has_download": False,
                            "target": "_blank",
                            "rel": "noopener",
                            "text": "Open in Colab (opens in a new tab)",
                        },
                    ]
                )
            if html_parser.chapter_tool_links != expected_links:
                navigation_errors.append(
                    f"{page_name}: rendered chapter-tool links differ from manifests; "
                    f"expected {expected_links}, found {html_parser.chapter_tool_links}"
                )
            if notebook_slug is not None:
                if html_parser.chapter_tool_placeholders:
                    accessibility_errors.append(
                        f"{page_name}: notebook-enabled page must not retain an "
                        f"unavailable placeholder: {html_parser.chapter_tool_placeholders}"
                    )
            else:
                notebook_placeholder_pages += 1
                expected_placeholder = {
                    "tag": "span",
                    "class": "chapter-tools__placeholder",
                    "aria_disabled": "true",
                    "href": None,
                    "text": "Notebook (not available for this page)",
                }
                if html_parser.chapter_tool_placeholders != [expected_placeholder]:
                    accessibility_errors.append(
                        f"{page_name}: Notebook must be one honest, non-linking "
                        f"unavailable placeholder, found "
                        f"{html_parser.chapter_tool_placeholders}"
                    )
            if not chapter_tools_follows_title(page_name, page_text):
                navigation_errors.append(
                    f"{page_name}: chapter-tools aside must immediately follow the "
                    "title header"
                )
        elif (
            html_parser.chapter_tools
            or html_parser.chapter_tool_links
            or html_parser.chapter_tool_placeholders
        ):
            navigation_errors.append(
                f"{page_name}: Part or standalone page unexpectedly carries "
                "chapter tools"
            )

        if page_name in EXPECTED_PART_PAGES:
            title = EXPECTED_PART_PAGES[page_name]
            if page_text.count(f'<h1 class="title">{title}</h1>') != 1:
                navigation_errors.append(
                    f"{page_name}: expected one part-page title {title!r}"
                )
            prose = " ".join(html_parser.main_text.split())
            if len(prose) < len(title) + 240:
                rendered_content_errors.append(
                    f"{page_name}: part-page transition prose is unexpectedly short"
                )

        if page_name in EXPECTED_FIRST_CHAPTER_PART_LINKS:
            target = EXPECTED_FIRST_CHAPTER_PART_LINKS[page_name]
            previous = re.search(
                r'<div class="nav-page nav-page-previous">\s*'
                r'<a[^>]+href="([^"]+)"',
                page_text,
            )
            if previous is None or previous.group(1) != target:
                navigation_errors.append(
                    f"{page_name}: previous-page navigation must return to "
                    f"its part page {target}"
                )
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

        if page.name != DOWNLOAD_PAGE_NAME:
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
        advisories.extend(cross_volume_advisories(page_name, html_parser.main_text))
        accessibility_errors.extend(
            main_image_alt_errors(page_name, html_parser.main_images)
        )
        if page_name in expected_source_pages:
            accessibility_errors.extend(
                main_image_loading_errors(
                    page_name, html_parser.main_image_loading
                )
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
            expected_mathjax = (
                [] if page_name in EXPECTED_PART_PAGES else [PINNED_MATHJAX_URL]
            )
            if html_parser.mathjax_urls != expected_mathjax:
                metadata_errors.append(
                    f"{page_name}: expected MathJax URLs {expected_mathjax}, "
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
                if (
                    (target is None or not target.resolve().is_file())
                    and not args.allow_missing_generated_pdfs
                ):
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
            if html_parser.picture_sources != [
                {"srcset": DOWNLOAD_COVER_WEBP, "type": "image/webp"}
            ]:
                navigation_errors.append(
                    f"{page_name}: cover picture must prefer one WebP source, found "
                    f"{html_parser.picture_sources}"
                )
            cover_webp = root / DOWNLOAD_COVER_WEBP
            if (
                cover_webp.is_file()
                and cover_webp.stat().st_size > MAX_DOWNLOAD_COVER_BYTES
            ):
                navigation_errors.append(
                    f"{page_name}: WebP cover is {cover_webp.stat().st_size:,} bytes; "
                    f"limit is {MAX_DOWNLOAD_COVER_BYTES:,}"
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

            title_toggle_groups = re.findall(
                r'<a class="sidebar-item-text[^\"]*" '
                r'data-bs-toggle="collapse"[^>]*>\s*'
                r'<span class="menu-text">([^<]+)</span>',
                page_text,
            )
            if title_toggle_groups != ["Appendices"]:
                navigation_errors.append(
                    "index.html: only Appendices should use its title as the "
                    f"chapter-group control, found {title_toggle_groups}"
                )

            for part_path, title in EXPECTED_PART_PAGES.items():
                sidebar_href = "./" + part_path
                pattern = re.compile(
                    rf'<a\b(?=[^>]*\bclass="sidebar-item-text sidebar-link")'
                    rf'(?=[^>]*\bhref="{re.escape(sidebar_href)}")[^>]*>\s*'
                    rf'<span class="menu-text">{re.escape(title)}</span></a>'
                )
                if len(pattern.findall(page_text)) != 1:
                    navigation_errors.append(
                        f"index.html: expected one linked sidebar part {title!r} "
                        f"at {sidebar_href}"
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
                        'document.querySelectorAll(sidebarChevronSelector)',
                        'chevron.setAttribute("role", "button")',
                        '`Toggle chapters in ${title}`',
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

    if notebook_linked_pages != EXPECTED_NOTEBOOK_PAGE_COUNT:
        navigation_errors.append(
            f"expected {EXPECTED_NOTEBOOK_PAGE_COUNT} notebook-linked pages, found "
            f"{notebook_linked_pages}"
        )
    if notebook_placeholder_pages != EXPECTED_NOTEBOOK_PLACEHOLDER_COUNT:
        navigation_errors.append(
            f"expected {EXPECTED_NOTEBOOK_PLACEHOLDER_COUNT} honest unavailable "
            f"notebook placeholders, found {notebook_placeholder_pages}"
        )

    for advisory in advisories:
        print(advisory)

    if (
        source_contract_errors
        or missing
        or metadata_errors
        or navigation_errors
        or rendered_content_errors
        or accessibility_errors
        or publication_errors
    ):
        for error in source_contract_errors:
            print(error)
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
            f"FAILED: {len(source_contract_errors)} Phase E/F source violation(s), "
            f"{len(missing)} missing unique HTML support asset(s), "
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
        "searchable Plan-to-Code collapse, lazy math and non-first images, "
        f"{len(expected_source_pages)} direct source links with no global code "
        f"toggle, {len(expected_chapter_tools)} accessible chapter-tools strips "
        f"({specific_lecture_pages} specific, {fallback_lecture_pages} fallback), "
        f"{notebook_linked_pages} published notebook routes with "
        f"{notebook_placeholder_pages} honest unavailable placeholders, "
        "canonical URLs, edition stamps, skip links, image alternatives, "
        f"and leak-free rendered content; {len(advisories)} cross-volume "
        "advisory warning(s))"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
