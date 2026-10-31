"""Static, searchable Springer companion labels without changing target IDs."""

from __future__ import annotations

from collections import defaultdict
import html
from html.parser import HTMLParser
import json
from pathlib import Path, PurePosixPath
import posixpath
import re

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data/print-companions.json"
GENERATED = re.compile(
    r"<!-- print-companion:start -->.*?<!-- print-companion:end -->\n?",
    re.DOTALL,
)


def load_manifest(path: Path = MANIFEST) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    labels, targets = set(), set()
    for entry in data["entries"]:
        label, page, anchor = (entry[k] for k in ("label", "page", "anchor"))
        if label in labels or (page, anchor) in targets:
            raise ValueError(f"Duplicate print companion: {label} / {page}#{anchor}")
        if not re.fullmatch(r"(?:Experiment|Animation) (?:\d+|[A-E]|Ep)\.[A-Z0-9]+", label):
            raise ValueError(f"Invalid companion label: {label}")
        if PurePosixPath(page).is_absolute() or ".." in PurePosixPath(page).parts:
            raise ValueError(f"Invalid companion page: {page}")
        if not re.fullmatch(r"[a-zA-Z0-9_-]+", anchor):
            raise ValueError(f"Invalid companion anchor: {anchor}")
        if entry["source"] not in data["chapter_pages"]:
            raise ValueError(f"Missing chapter page for {entry['source']}")
        labels.add(label)
        targets.add((page, anchor))
    return data


class TargetPositions(HTMLParser):
    """Locate tags in original text so no unrelated HTML is reserialized."""

    def __init__(self, text: str):
        super().__init__(convert_charrefs=False)
        self.offsets = [0]
        for line in text.splitlines(keepends=True):
            self.offsets.append(self.offsets[-1] + len(line))
        self.positions: dict[str, list[int]] = defaultdict(list)
        self.label_positions: dict[str, list[int]] = defaultdict(list)
        self.containers: list[tuple[str, int, set[str], int | None]] = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        line, column = self.getpos()
        offset = self.offsets[line - 1] + column
        attributes = dict(attrs)
        classes = set(attributes.get("class", "").split())
        identifier = attributes.get("id")
        if identifier:
            self.positions[identifier].append(offset)
            # A nested target must remain findable when any enclosing disclosure
            # closes, including one that initially has the open attribute.
            self.label_positions[identifier].append(
                next((boundary for _, _, _, boundary in self.containers
                      if boundary is not None), offset)
            )
        boundary = offset if tag == "details" else None
        if "callout-collapse" in classes:
            # Quarto callouts collapse with Bootstrap rather than <details>.
            # Keep a nested target's label outside the entire callout box.
            boundary = next((start for _, start, names, _ in reversed(self.containers)
                             if "callout" in names), offset)
        if tag not in {"area", "base", "br", "col", "embed", "hr", "img", "input",
                       "link", "meta", "param", "source", "track", "wbr"}:
            self.containers.append((tag, offset, classes, boundary))

    def handle_endtag(self, tag):
        for index in range(len(self.containers) - 1, -1, -1):
            if self.containers[index][0] == tag:
                del self.containers[index:]
                break

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)


def generated(body: str) -> str:
    return f"<!-- print-companion:start -->{body}<!-- print-companion:end -->\n"


def add_companions(text: str, page: str, manifest: dict) -> str:
    """Insert labels outside targets, including outside closed animation details."""
    text = GENERATED.sub("", text)
    targets = TargetPositions(text)
    positions = targets.positions
    edits = []
    for entry in manifest["entries"]:
        if entry["page"] != page:
            continue
        anchor, label = entry["anchor"], entry["label"]
        found = positions.get(anchor, [])
        if len(found) != 1:
            raise ValueError(f"{page}: {label} needs exactly one #{anchor}; found {len(found)}")
        body = (
            '<p class="print-companion-label">'
            f'<a href="#{html.escape(anchor, quote=True)}">{html.escape(label)}</a>'
            '<span class="print-companion-origin"> · print companion</span></p>'
        )
        edits.append((targets.label_positions[anchor][0], generated(body)))

    # The print Transformer list also points to material on the Attention page.
    # Give a reader arriving at its general chapter URL the complete set of links.
    entries = [e for e in manifest["entries"]
               if manifest["chapter_pages"][e["source"]] == page]
    if any(e["page"] != page for e in entries):
        links = []
        for entry in entries:
            target = posixpath.relpath(entry["page"], posixpath.dirname(page))
            href = ("" if entry["page"] == page else target) + "#" + entry["anchor"]
            links.append(f'<li><a href="{html.escape(href, quote=True)}">'
                         f'{html.escape(entry["label"])}</a></li>')
        body = (
            '<details class="print-companion-index">'
            '<summary>Companion material for the printed chapter</summary>'
            '<p>These links include items presented on other chapter pages.</p>'
            '<ul>' + "".join(links) + '</ul></details>'
        )
        title = re.search(r'<header\b[^>]*\bid="title-block-header"[^>]*>.*?</header>',
                          text, re.DOTALL)
        if not title:
            raise ValueError(f"{page}: chapter title block missing")
        # The chapter-tools toolbar is required to remain the title's immediate
        # next element. Put the companion index after it when the page has one.
        toolbar = re.match(
            r'\s*<aside\b[^>]*\bclass=["\'][^"\']*\bchapter-tools\b[^"\']*["\'][^>]*>'
            r'.*?</aside>', text[title.end():], re.DOTALL,
        )
        index_position = title.end() + (toolbar.end() if toolbar else 0)
        edits.append((index_position, generated(body)))
    # Preserve manifest order when several targets share a disclosure boundary.
    for _, (offset, body) in sorted(
        enumerate(edits), key=lambda item: (item[1][0], item[0]), reverse=True
    ):
        text = text[:offset] + body + text[offset:]
    return text


SEARCH_MARKER = "\n\nPrint companion: "


def add_search_companions(records: list[dict], manifest: dict) -> list[dict]:
    """Return Quarto search records with direct, idempotent print-label matches.

    Existing target records keep their original text and metadata. Targets that
    have no section record receive a small dedicated record using their page's
    title and breadcrumbs. Generated metadata lets a later pass replace labels
    or remove obsolete entries without changing the ordinary search content.
    """
    result = []
    for record in records:
        if record.get("print_companion_generated"):
            continue
        record = dict(record)
        previous = record.pop("print_companion_label", None)
        if previous:
            record["text"] = record.get("text", "").removesuffix(
                SEARCH_MARKER + previous
            )
        result.append(record)

    by_href = {}
    object_ids = set()
    for record in result:
        href = record.get("href")
        if href in by_href:
            raise ValueError(f"Duplicate search href: {href}")
        by_href[href] = record
        object_ids.add(record.get("objectID"))

    for entry in manifest["entries"]:
        page, label = entry["page"], entry["label"]
        target = page + "#" + entry["anchor"]
        if target in by_href:
            record = by_href[target]
            record["text"] = record.get("text", "") + SEARCH_MARKER + label
            record["print_companion_label"] = label
            continue
        parent = by_href.get(page)
        if parent is None:
            raise ValueError(f"{label}: search index has no page record for {page}")
        if target in object_ids:
            raise ValueError(f"Duplicate search objectID: {target}")
        record = {
            "objectID": target,
            "href": target,
            "title": parent["title"],
            "section": label,
            "text": label,
            "crumbs": list(parent.get("crumbs", [])),
            "print_companion_generated": True,
        }
        result.append(record)
        by_href[target] = record
        object_ids.add(target)
    return result
