#!/usr/bin/env python3
"""Add source-derived canonical and edition metadata to rendered HTML pages."""

from __future__ import annotations

import ast
from datetime import date
import html
from pathlib import Path
import re
from urllib.parse import quote, urljoin


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_ROOT = ROOT / "_book"
CANONICAL_RE = re.compile(
    r"\s*<link\b(?=[^>]*\brel=[\"'][^\"']*\bcanonical\b)[^>]*>\s*",
    re.IGNORECASE,
)
STAMP_RE = re.compile(
    r"\s*<!-- dlbook-edition-stamp:start -->.*?"
    r"<!-- dlbook-edition-stamp:end -->\s*",
    re.DOTALL,
)
PYTHON_BLOCK_RE = re.compile(r"```\{python\}\n(?P<body>.*?)\n```", re.DOTALL)
CUSTOM_FIGURE_OPEN_RE = re.compile(
    r"^:{3,4}\s+\{#(?P<label>(?:ae|ex|ttr|ep)fig-[^}\s]+)[^}]*\}\s*$",
    re.MULTILINE,
)
LABELED_FIGURE_IMAGE_RE = re.compile(
    r'(?P<prefix><div\b(?=[^>]*\bid=["\'](?P<label>(?:fig|aefig|exfig|ttrfig|epfig)-[^"\']+)["\'])'
    r"[^>]*>(?:(?!</div>).)*?<img\b)(?P<attrs>[^>]*)(?P<end>>)",
    re.DOTALL | re.IGNORECASE,
)
ALT_ATTRIBUTE_RE = re.compile(
    r"\s+alt=(?P<quote>[\"'])(?P<value>.*?)(?P=quote)",
    re.DOTALL | re.IGNORECASE,
)
SKIP_LINK = (
    '<a class="visually-hidden-focusable" href="#quarto-document-content">'
    "Skip to main content</a>"
)
SKIP_LINK_RE = re.compile(
    r"\s*<a\b(?=[^>]*\bclass=[\"']visually-hidden-focusable[\"'])"
    r"(?=[^>]*\bhref=[\"']#quarto-document-content[\"'])[^>]*>"
    r"\s*Skip to main content\s*</a>\s*",
    re.IGNORECASE,
)
BODY_OPEN_RE = re.compile(r"<body\b[^>]*>", re.IGNORECASE)


def source_metadata() -> tuple[str, str, str]:
    """Read the site URL, rolling date, and stable version from source files."""
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
        raise RuntimeError("Could not read site URL, book date, and citation version")

    rolling_date = date.fromisoformat(date_match.group(1))
    display_date = (
        f"{rolling_date.strftime('%B')} {rolling_date.day}, {rolling_date.year}"
    )
    return site_match.group(1).rstrip("/") + "/", display_date, version_match.group(1)


def source_figure_alts() -> dict[str, str]:
    """Read standard and custom-float figure alts from the manuscript."""
    alternatives: dict[str, str] = {}
    for qmd in sorted(ROOT.rglob("*.qmd")):
        source = qmd.read_text(encoding="utf-8")
        for match in PYTHON_BLOCK_RE.finditer(source):
            cell_label = None
            alternative = None
            for line in match.group("body").splitlines():
                if not line.startswith("#|"):
                    break
                key, separator, raw_value = line[2:].strip().partition(":")
                if not separator:
                    continue
                value = raw_value.strip()
                if key == "label":
                    cell_label = value
                elif key == "fig-alt":
                    alternative = str(ast.literal_eval(value))
            labels = [cell_label] if cell_label else []
            preceding = list(CUSTOM_FIGURE_OPEN_RE.finditer(source, 0, match.start()))
            if preceding:
                candidate = preceding[-1]
                if not source[candidate.end() : match.start()].strip():
                    labels.append(candidate.group("label"))
            for label in labels:
                if not alternative:
                    continue
                previous = alternatives.setdefault(label, alternative)
                if previous != alternative:
                    raise RuntimeError(
                        f"Conflicting fig-alt text for source label {label!r}"
                    )
    return alternatives


def canonical_for(page: Path, site_url: str) -> str:
    relative = page.relative_to(OUTPUT_ROOT).as_posix()
    if relative == "index.html":
        return site_url
    return urljoin(site_url, quote(relative, safe="/"))


def edition_stamp(display_date: str, version: str, site_url: str) -> str:
    revision_url = urljoin(site_url, "#revision-notes")
    return (
        "<!-- dlbook-edition-stamp:start -->\n"
        '<p class="edition-stamp">'
        f"Rolling manuscript · content updated {display_date} · "
        f"stable edition v{version} · "
        f'<a href="{revision_url}">Revision notes</a>'
        "</p>\n"
        "<!-- dlbook-edition-stamp:end -->"
    )


def add_stamp(page_text: str, stamp: str) -> str:
    page_text = STAMP_RE.sub("\n", page_text)
    center = re.compile(
        r'(<div class="nav-footer-center">)\s*(?:&nbsp;)?',
        re.IGNORECASE,
    )
    if center.search(page_text):
        return center.sub(rf"\1\n{stamp}", page_text, count=1)
    if "</footer>" in page_text:
        return page_text.replace("</footer>", f"{stamp}\n</footer>", 1)
    if "</main>" in page_text:
        return page_text.replace("</main>", f"{stamp}\n</main>", 1)
    raise RuntimeError("Rendered HTML page has no footer or main element")


def add_missing_source_alts(
    page_text: str, alternatives: dict[str, str]
) -> str:
    """Fill only empty labeled-figure image alts from their source cell options."""

    def replace(match: re.Match[str]) -> str:
        alternative = alternatives.get(match.group("label"))
        if not alternative:
            return match.group(0)
        attrs = match.group("attrs")
        alt_match = ALT_ATTRIBUTE_RE.search(attrs)
        if alt_match and alt_match.group("value").strip():
            return match.group(0)
        rendered = html.escape(alternative, quote=True)
        if alt_match:
            attrs = ALT_ATTRIBUTE_RE.sub(f' alt="{rendered}"', attrs, count=1)
        else:
            attrs += f' alt="{rendered}"'
        return match.group("prefix") + attrs + match.group("end")

    return LABELED_FIGURE_IMAGE_RE.sub(replace, page_text)


def move_skip_link_first(page_text: str) -> str:
    """Move Quarto's included skip link before its navigation controls."""
    if not SKIP_LINK_RE.search(page_text):
        return page_text
    updated = SKIP_LINK_RE.sub("\n", page_text)
    body = BODY_OPEN_RE.search(updated)
    if not body:
        raise RuntimeError("Rendered HTML page with a skip link has no body element")
    return updated[: body.end()] + "\n" + SKIP_LINK + updated[body.end() :]


def transformed_page(
    page_text: str,
    page: Path,
    site_url: str,
    stamp: str,
    figure_alts: dict[str, str],
) -> str:
    canonical = canonical_for(page, site_url)
    updated = CANONICAL_RE.sub("\n", page_text)
    link = f'<link rel="canonical" href="{canonical}">'
    if "</head>" not in updated:
        raise RuntimeError(f"{page}: rendered HTML page has no closing head tag")
    updated = updated.replace("</head>", f"{link}\n</head>", 1)
    updated = add_missing_source_alts(updated, figure_alts)
    updated = move_skip_link_first(updated)
    return add_stamp(updated, stamp)


def update_page(
    page: Path,
    site_url: str,
    stamp: str,
    figure_alts: dict[str, str],
) -> bool:
    original = page.read_text(encoding="utf-8")
    updated = transformed_page(original, page, site_url, stamp, figure_alts)
    # Native Quarto and standalone pages place their head/footer whitespace
    # differently. Converge within one invocation so repeated profile renders are
    # byte-idempotent rather than relying on a second post-render pass.
    updated = transformed_page(updated, page, site_url, stamp, figure_alts)
    if transformed_page(updated, page, site_url, stamp, figure_alts) != updated:
        raise RuntimeError(f"{page}: HTML metadata transform did not reach a fixpoint")
    if updated == original:
        return False
    page.write_text(updated, encoding="utf-8")
    return True


def main() -> int:
    if not OUTPUT_ROOT.is_dir():
        print("postrender HTML metadata: no _book directory; nothing to do")
        return 0

    site_url, display_date, version = source_metadata()
    stamp = edition_stamp(display_date, version, site_url)
    figure_alts = source_figure_alts()
    pages = sorted(
        page
        for page in OUTPUT_ROOT.rglob("*.html")
        if "site_libs" not in page.relative_to(OUTPUT_ROOT).parts
    )
    changed = sum(
        update_page(page, site_url, stamp, figure_alts) for page in pages
    )
    print(
        f"postrender HTML metadata: updated {changed} of {len(pages)} page(s) "
        f"for rolling {display_date}, stable v{version}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
