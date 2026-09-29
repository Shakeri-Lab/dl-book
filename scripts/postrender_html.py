#!/usr/bin/env python3
"""Add source-derived canonical and edition metadata and figure image sizes to rendered HTML."""

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
# An attribute value may hold ">" (an alt text that names a token such as <bos>), so
# the attributes are read as quoted values, not up to the first ">".
LABELED_FIGURE_IMAGE_RE = re.compile(
    r'(?P<prefix><div\b(?=[^>]*\bid=["\'](?P<label>(?:fig|aefig|exfig|ttrfig|epfig)-[^"\']+)["\'])'
    r"[^>]*>(?:(?!</div>).)*?<img\b)(?P<attrs>(?:[^>\"']|\"[^\"]*\"|'[^']*')*)(?P<end>>)",
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
FIGURE_IMAGE_RE = re.compile(
    r"<img\b(?P<attrs>(?:[^>\"']|\"[^\"]*\"|'[^']*')*)>",
    re.IGNORECASE,
)
ATTRIBUTE_RE = re.compile(
    r"\s(?P<name>[\w:-]+)(?:\s*=\s*(?P<value>\"[^\"]*\"|'[^']*'|[^\s>]+))?",
)
SVG_ROOT_RE = re.compile(r"<svg\b[^>]*>", re.DOTALL)
SVG_LENGTH_RE = re.compile(r"^\s*([0-9.]+)\s*(pt|px|in|mm|cm)?\s*$")
SVG_UNIT_PT = {"pt": 1.0, None: 0.75, "px": 0.75, "in": 72.0, "mm": 72 / 25.4, "cm": 72 / 2.54}
# The author's ruling D4 (September 29, 2026): an executed matplotlib SVG displays at
# 2 CSS px per pt; any other SVG (the TikZ figures) at its natural 4/3 CSS px per pt.
EXECUTED_SVG_PX_PER_PT = 2.0
NATURAL_SVG_PX_PER_PT = 4 / 3


def source_metadata() -> tuple[str, str, str, str]:
    """Read the site URL, edition date, stable version, and publication state."""
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
        raise RuntimeError(
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


def edition_stamp(
    display_date: str, version: str, status: str, site_url: str
) -> str:
    revision_url = urljoin(site_url, "#revision-notes")
    if status == "stable":
        label = f"Stable edition v{version} · released {display_date}"
    else:
        label = (
            f"Rolling manuscript · content updated {display_date} · "
            f"stable edition v{version}"
        )
    return (
        "<!-- dlbook-edition-stamp:start -->\n"
        '<p class="edition-stamp">'
        f"{label} · "
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


def svg_size_pt(path: Path) -> tuple[float, float]:
    """Width and height of an SVG's root element in pt."""
    head = path.read_text(encoding="utf-8", errors="replace")[:4000]
    root = SVG_ROOT_RE.search(head)
    if not root:
        raise RuntimeError(f"{path}: no <svg> root element")
    sizes = []
    for name in ("width", "height"):
        value = re.search(rf'\b{name}="([^"]+)"', root.group(0))
        length = SVG_LENGTH_RE.match(value.group(1)) if value else None
        if not length:
            raise RuntimeError(f"{path}: <svg> {name} is not an absolute length")
        sizes.append(float(length.group(1)) * SVG_UNIT_PT[length.group(2)])
    return sizes[0], sizes[1]


def image_size_px(path: Path, source: str) -> tuple[int, int]:
    """The CSS size a figure image is drawn at (ruling D4 for SVG; pixels otherwise)."""
    if path.suffix.lower() == ".svg":
        width_pt, height_pt = svg_size_pt(path)
        scale = (
            EXECUTED_SVG_PX_PER_PT
            if "/figure-html/" in source
            else NATURAL_SVG_PX_PER_PT
        )
        return round(width_pt * scale), round(height_pt * scale)
    from PIL import Image

    with Image.open(path) as image:
        return image.size


def add_figure_dimensions(page_text: str, page: Path) -> str:
    """Give every figure image integer width and height attributes (ruling D4).

    Quarto writes them for retina PNGs but not for SVGs, whose lazy boxes then collapse to
    0 x 0 until they load. The attributes also carry the drawn width that the phone
    pan-strip rule reads (responsive-figures.html). Images that already carry both are
    left alone, so the transform is idempotent.
    """

    def replace(match: re.Match[str]) -> str:
        attrs = match.group("attrs")
        values = {
            item.group("name").lower(): (item.group("value") or "").strip("\"'")
            for item in ATTRIBUTE_RE.finditer(attrs)
        }
        if "figure-img" not in values.get("class", "").split():
            return match.group(0)
        if values.get("width", "").isdigit() and values.get("height", "").isdigit():
            return match.group(0)
        source = html.unescape(values.get("src", ""))
        path = (page.parent / source.split("#", 1)[0].split("?", 1)[0]).resolve()
        if not source or re.match(r"^[a-z]+:", source) or not path.is_file():
            # Left for scripts/audit_html_assets.py, which reports the missing file and
            # the missing size; a print render must not fail on a stale HTML page here.
            return match.group(0)
        width, height = image_size_px(path, source)
        if values.get("width", "").isdigit():
            height = round(int(values["width"]) * height / width)
            width = int(values["width"])
        elif values.get("height", "").isdigit():
            width = round(int(values["height"]) * width / height)
            height = int(values["height"])
        attrs = ATTRIBUTE_RE.sub(
            lambda item: ""
            if item.group("name").lower() in ("width", "height")
            else item.group(0),
            attrs,
        )
        trailing = "/" if attrs.rstrip().endswith("/") else ""
        attrs = attrs.rstrip().rstrip("/").rstrip()
        return f'<img{attrs} width="{width}" height="{height}"{trailing}>'

    return FIGURE_IMAGE_RE.sub(replace, page_text)


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
    updated = add_figure_dimensions(updated, page)
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

    site_url, display_date, version, status = source_metadata()
    stamp = edition_stamp(display_date, version, status, site_url)
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
        f"for {status} v{version}, {display_date}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
