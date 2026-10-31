#!/usr/bin/env python3
"""Check rendered print-companion labels, targets, chapter indexes and search."""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from html.parser import HTMLParser
import json
from pathlib import Path
import posixpath
import re
from urllib.parse import unquote, urlsplit

from print_companions import MANIFEST, ROOT, load_manifest

VOID_TAGS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr",
}


@dataclass
class Node:
    tag: str
    attrs: dict
    parent: Node | None = None
    children: list[Node | str] = field(default_factory=list)

    def text(self) -> str:
        return "".join(c.text() if isinstance(c, Node) else c for c in self.children)

    def has_class(self, name: str) -> bool:
        return name in self.attrs.get("class", "").split()

    def within_disclosure(self) -> bool:
        parent = self.parent
        while parent is not None:
            if parent.tag == "details" or parent.has_class("callout-collapse"):
                return True
            parent = parent.parent
        return False

    def descendants(self, tag: str) -> list[Node]:
        found = []
        for child in self.children:
            if isinstance(child, Node):
                if child.tag == tag:
                    found.append(child)
                found.extend(child.descendants(tag))
        return found


class Document(HTMLParser):
    """Small read-only tree; the audit never rewrites rendered HTML."""

    def __init__(self, text: str):
        super().__init__(convert_charrefs=True)
        self.root = Node("document", {})
        self.stack = [self.root]
        self.nodes = []
        self.ids = defaultdict(list)
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        node = Node(tag, dict(attrs), self.stack[-1])
        self.stack[-1].children.append(node)
        self.nodes.append(node)
        if "id" in node.attrs:
            self.ids[node.attrs["id"]].append(node)
        if tag not in VOID_TAGS:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID_TAGS:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def normalized(text: str) -> str:
    return " ".join(text.split())


def target_of(page: str, href: str) -> tuple[str, str] | None:
    url = urlsplit(href)
    if url.scheme or url.netloc or url.query or not url.fragment:
        return None
    target = (
        posixpath.normpath(posixpath.join(posixpath.dirname(page), unquote(url.path)))
        if url.path else page
    )
    return target, unquote(url.fragment)


def audit_book(book: Path, manifest: dict, *, check_search: bool = False) -> dict:
    errors = []
    entries = manifest["entries"]
    by_page = defaultdict(list)
    by_source_page = defaultdict(list)
    for entry in entries:
        by_page[entry["page"]].append(entry)
        by_source_page[manifest["chapter_pages"][entry["source"]]].append(entry)
    cross_pages = {
        page: items for page, items in by_source_page.items()
        if any(item["page"] != page for item in items)
    }
    documents = {}
    for page in sorted(set(by_page) | set(cross_pages)):
        path = book / page
        if not path.is_file():
            errors.append(f"{page}: missing rendered page")
            continue
        documents[page] = Document(path.read_text(encoding="utf-8"))

    labels_checked = 0
    for page, items in by_page.items():
        doc = documents.get(page)
        if doc is None:
            continue
        badges = [n for n in doc.nodes if n.has_class("print-companion-label")]
        expected_labels = {entry["label"] for entry in items}
        for badge in badges:
            links = badge.descendants("a")
            if len(links) != 1 or normalized(links[0].text()) not in expected_labels:
                errors.append(f"{page}: unexpected or malformed companion label")
        for entry in items:
            label, anchor = entry["label"], entry["anchor"]
            matches = [b for b in badges if any(
                normalized(a.text()) == label for a in b.descendants("a")
            )]
            if len(doc.ids.get(anchor, [])) != 1:
                errors.append(f"{page}: {label} requires exactly one #{anchor}")
            if len(matches) != 1:
                errors.append(f"{page}: {label} has {len(matches)} visible label elements")
                continue
            badge = matches[0]
            links = badge.descendants("a")
            if len(links) != 1 or target_of(page, links[0].attrs.get("href", "")) != (page, anchor):
                errors.append(f"{page}: {label} links to the wrong target")
            if badge.within_disclosure():
                errors.append(f"{page}: {label} is inside a collapsible disclosure")
            labels_checked += 1

    indexes_checked = 0
    for page, doc in documents.items():
        indexes = [n for n in doc.nodes if n.has_class("print-companion-index")]
        if page not in cross_pages:
            if indexes:
                errors.append(f"{page}: unexpected cross-chapter companion index")
            continue
        if len(indexes) != 1:
            errors.append(f"{page}: expected one cross-chapter index; found {len(indexes)}")
            continue
        index = indexes[0]
        if index.within_disclosure():
            errors.append(f"{page}: companion index is nested in another details element")
        expected = Counter(
            (entry["label"], (entry["page"], entry["anchor"]))
            for entry in cross_pages[page]
        )
        actual = Counter(
            (normalized(link.text()), target_of(page, link.attrs.get("href", "")))
            for link in index.descendants("a")
        )
        if actual != expected:
            errors.append(f"{page}: cross-chapter index labels or relative targets differ from manifest")
        indexes_checked += 1

    search_checked = 0
    if check_search:
        path = book / "search.json"
        if not path.is_file():
            errors.append("search.json: missing search index")
        else:
            records = json.loads(path.read_text(encoding="utf-8"))
            ids = [record.get("objectID") for record in records]
            if len(ids) != len(set(ids)):
                errors.append("search.json: duplicate objectID")
            for entry in entries:
                href = entry["page"] + "#" + entry["anchor"]
                matches = [r for r in records if r.get("href") == href]
                pattern = r"(?<!\w)" + re.escape(entry["label"]) + r"(?!\w)"
                if len(matches) != 1 or not re.search(pattern, matches[0].get("text", "")):
                    errors.append(f"search.json: {entry['label']} needs one searchable record at {href}")
                else:
                    search_checked += 1

    return {
        "entries_expected": len(entries),
        "target_pages_expected": len(by_page),
        "labels_checked": labels_checked,
        "cross_chapter_indexes_expected": len(cross_pages),
        "cross_chapter_indexes_checked": indexes_checked,
        "search_checked": search_checked,
        "errors": errors,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("book", nargs="?", type=Path, default=ROOT / "_book")
    parser.add_argument("--manifest", type=Path, default=MANIFEST)
    parser.add_argument("--check-search", action="store_true")
    parser.add_argument("--json", type=Path, help="write the machine-readable result")
    args = parser.parse_args()
    report = audit_book(args.book, load_manifest(args.manifest), check_search=args.check_search)
    if args.json:
        args.json.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    for error in report["errors"]:
        print(f"ERROR: {error}")
    print(
        f"print companions: {report['labels_checked']}/{report['entries_expected']} labels, "
        f"{report['cross_chapter_indexes_checked']}/{report['cross_chapter_indexes_expected']} "
        f"cross-chapter indexes; {len(report['errors'])} errors"
    )
    if args.check_search:
        print(f"search index: {report['search_checked']}/{report['entries_expected']} direct label records")
    return 1 if report["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
