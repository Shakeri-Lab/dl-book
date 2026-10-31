"""Behavioral checks for print labels in HTML and Quarto search results."""

from copy import deepcopy
import json
from pathlib import Path
import tempfile
import unittest

from audit_print_companions import Document, audit_book
from print_companions import (
    GENERATED, SEARCH_MARKER, add_companions, add_search_companions, load_manifest,
)

PAGE = "chapters/part1/chapter.html"
SOURCE = "book/part1/ch01.tex"


def manifest(*entries, chapter_pages=None):
    return {
        "entries": list(entries) or [{
            "label": "Experiment 1.A", "page": PAGE, "anchor": "result", "source": SOURCE,
        }],
        "chapter_pages": chapter_pages or {SOURCE: PAGE},
    }


def page(body):
    return (
        '<!DOCTYPE html><html><head><title>Example</title></head><body>'
        '<main id="quarto-document-content"><header id="title-block-header">'
        '<h1>Chapter</h1></header>' + body + '</main></body></html>'
    )


def search_page(href=PAGE, title="Example chapter"):
    return {
        "objectID": href, "href": href, "title": title,
        "section": "", "text": "Original chapter introduction.", "crumbs": [title],
    }


def cross_manifest():
    origin = "chapters/part4/transformer.html"
    source = "book/part4/ch16.tex"
    entries = [
        {"label": "Experiment 16.A", "page": "chapters/part4/attention.html",
         "anchor": "scaled-dot", "source": source},
        {"label": "Experiment 16.B", "page": origin, "anchor": "own-result", "source": source},
        {"label": "Animation 16.A", "page": "chapters/interludes/replay.html",
         "anchor": "scene", "source": source},
    ]
    return manifest(*entries, chapter_pages={source: origin})


class HtmlLabelsTest(unittest.TestCase):
    def test_idempotent_and_preserves_original_html_and_ids(self):
        original = page('<section id="context"><div id="result">A &amp; B</div></section>')
        updated = add_companions(original, PAGE, manifest())
        self.assertEqual(add_companions(updated, PAGE, manifest()), updated)
        self.assertEqual(GENERATED.sub("", updated), original)
        self.assertEqual(set(Document(updated).ids), set(Document(original).ids))
        self.assertIn('href="#result">Experiment 1.A</a>', updated)

    def test_label_precedes_closed_details_target(self):
        original = page('<details id="result"><summary>Animation</summary><p>Frame</p></details>')
        updated = add_companions(original, PAGE, manifest())
        self.assertLess(updated.index('class="print-companion-label"'), updated.index('<details'))

    def test_nested_target_label_stays_outside_all_disclosures(self):
        for open_attribute in ("", " open"):
            with self.subTest(open_attribute=open_attribute):
                original = page(
                    f'<details id="outer"{open_attribute}><summary>Study</summary>'
                    '<details><summary>Data</summary><div id="result">Value</div></details></details>'
                )
                updated = add_companions(original, PAGE, manifest())
                self.assertLess(updated.index('class="print-companion-label"'), updated.index('<details'))
                self.assertEqual(GENERATED.sub("", updated), original)

    def test_labels_sharing_disclosure_follow_manifest_order(self):
        entries = [
            {"label": "Experiment 1.B", "page": PAGE, "anchor": "first", "source": SOURCE},
            {"label": "Animation 1.A", "page": PAGE, "anchor": "second", "source": SOURCE},
        ]
        original = page('<details><summary>Group</summary><div id="first"></div><div id="second"></div></details>')
        updated = add_companions(original, PAGE, manifest(*entries))
        self.assertLess(updated.index('>Experiment 1.B</a>'), updated.index('>Animation 1.A</a>'))
        self.assertLess(updated.index('>Animation 1.A</a>'), updated.index('<details'))

    def test_label_stays_outside_collapsible_quarto_callout(self):
        for initial_state in ("collapse", "collapse show"):
            with self.subTest(initial_state=initial_state):
                original = page(
                    '<div class="callout callout-note"><div class="callout-header">Study</div>'
                    f'<div class="callout-collapse {initial_state}"><div class="callout-body">'
                    '<img src="plot.png"><div id="result">Value</div></div></div></div>'
                )
                updated = add_companions(original, PAGE, manifest())
                self.assertLess(updated.index('class="print-companion-label"'), updated.index('class="callout callout-note"'))
                self.assertEqual(GENERATED.sub("", updated), original)
                self.assertEqual(add_companions(updated, PAGE, manifest()), updated)

    def test_missing_target_fails(self):
        with self.assertRaisesRegex(ValueError, "found 0"):
            add_companions(page('<div id="other"></div>'), PAGE, manifest())

    def test_duplicate_target_fails(self):
        with self.assertRaisesRegex(ValueError, "found 2"):
            add_companions(page('<div id="result"></div><div id="result"></div>'), PAGE, manifest())

    def test_unmapped_page_is_unchanged(self):
        original = page('<div id="other"></div>')
        self.assertEqual(add_companions(original, "other.html", manifest()), original)

    def test_cross_chapter_index_uses_destination_relative_links(self):
        data = cross_manifest()
        origin = data["chapter_pages"]["book/part4/ch16.tex"]
        updated = add_companions(page('<div id="own-result"></div>'), origin, data)
        index = next(n for n in Document(updated).nodes if n.has_class("print-companion-index"))
        actual = [(a.text(), a.attrs["href"]) for a in index.descendants("a")]
        self.assertEqual(actual, [
            ("Experiment 16.A", "attention.html#scaled-dot"),
            ("Experiment 16.B", "#own-result"),
            ("Animation 16.A", "../interludes/replay.html#scene"),
        ])
        self.assertEqual(add_companions(updated, origin, data), updated)
        self.assertLess(updated.index('</header>'), updated.index('class="print-companion-index"'))

    def test_cross_chapter_index_requires_title_block(self):
        data = cross_manifest()
        with self.assertRaisesRegex(ValueError, "title block missing"):
            add_companions('<div id="own-result"></div>', "chapters/part4/transformer.html", data)

    def test_cross_chapter_index_keeps_chapter_tools_beside_title(self):
        data = cross_manifest()
        origin = data["chapter_pages"]["book/part4/ch16.tex"]
        original = page(
            '\n\n<aside aria-label="Chapter tools" class="chapter-tools">'
            '<a href="lecture.html">Lecture</a></aside>\n<div id="own-result"></div>'
        )
        updated = add_companions(original, origin, data)
        self.assertLess(updated.index('</aside>'), updated.index('class="print-companion-index"'))
        self.assertLess(updated.index('class="print-companion-index"'), updated.index('id="own-result"'))
        self.assertEqual(GENERATED.sub("", updated), original)
        self.assertEqual(add_companions(updated, origin, data), updated)


class ManifestTest(unittest.TestCase):
    def read(self, data):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "manifest.json"
            path.write_text(json.dumps(data), encoding="utf-8")
            return load_manifest(path)

    def test_duplicate_label_or_target_fails(self):
        for duplicate_label in (True, False):
            with self.subTest(duplicate_label=duplicate_label):
                data = manifest()
                other = dict(data["entries"][0])
                other["anchor" if duplicate_label else "label"] = "other" if duplicate_label else "Animation 1.A"
                data["entries"].append(other)
                with self.assertRaisesRegex(ValueError, "Duplicate print companion"):
                    self.read(data)

    def test_missing_chapter_page_fails(self):
        data = manifest()
        data["chapter_pages"] = {}
        with self.assertRaisesRegex(ValueError, "Missing chapter page"):
            self.read(data)

    def test_invalid_destination_fails(self):
        for invalid in ("/absolute.html", "../outside.html"):
            with self.subTest(invalid=invalid):
                data = manifest()
                data["entries"][0]["page"] = invalid
                with self.assertRaisesRegex(ValueError, "Invalid companion page"):
                    self.read(data)

    def test_repository_manifest_is_valid(self):
        data = load_manifest()
        self.assertTrue(data["entries"])
        self.assertEqual(len({e["label"] for e in data["entries"]}), len(data["entries"]))


class SearchLabelsTest(unittest.TestCase):
    def test_dedicated_result_points_at_existing_target(self):
        original = [search_page()]
        updated = add_search_companions(original, manifest())
        self.assertEqual(updated[0], original[0])
        record = updated[1]
        self.assertEqual(record["href"], PAGE + "#result")
        self.assertEqual(record["objectID"], record["href"])
        self.assertEqual(record["section"], "Experiment 1.A")
        self.assertEqual(record["text"], "Experiment 1.A")
        self.assertEqual(record["title"], original[0]["title"])
        self.assertEqual(add_search_companions(updated, manifest()), updated)

    def test_existing_section_is_augmented_without_input_mutation(self):
        section = search_page(PAGE + "#result")
        section["section"] = "Original section heading"
        original = [search_page(), section]
        saved = deepcopy(original)
        updated = add_search_companions(original, manifest())
        self.assertEqual(original, saved)
        self.assertEqual(len(updated), len(original))
        self.assertEqual(updated[1]["section"], section["section"])
        self.assertEqual(updated[1]["text"], section["text"] + SEARCH_MARKER + "Experiment 1.A")
        self.assertEqual(add_search_companions(updated, manifest()), updated)

    def test_removed_and_renamed_labels_do_not_leave_stale_search_text(self):
        for existing_section in (False, True):
            with self.subTest(existing_section=existing_section):
                original = [search_page()]
                if existing_section:
                    original.append(search_page(PAGE + "#result"))
                updated = add_search_companions(original, manifest())
                renamed = manifest()
                renamed["entries"][0]["label"] = "Experiment 1.B"
                replaced = add_search_companions(updated, renamed)
                self.assertNotIn("Experiment 1.A", json.dumps(replaced))
                self.assertIn("Experiment 1.B", json.dumps(replaced))
                empty = manifest()
                empty["entries"] = []
                self.assertEqual(add_search_companions(replaced, empty), original)

    def test_missing_page_record_fails(self):
        with self.assertRaisesRegex(ValueError, "no page record"):
            add_search_companions([], manifest())

    def test_object_id_collision_fails(self):
        existing = search_page("other.html")
        existing["objectID"] = PAGE + "#result"
        with self.assertRaisesRegex(ValueError, "Duplicate search objectID"):
            add_search_companions([search_page(), existing], manifest())


class BuiltBookAuditTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.book = Path(self.temporary.name)
        self.data = cross_manifest()
        records = []
        for entry in self.data["entries"]:
            path = self.book / entry["page"]
            path.parent.mkdir(parents=True, exist_ok=True)
            rendered = add_companions(page(f'<div id="{entry["anchor"]}">Output</div>'), entry["page"], self.data)
            path.write_text(rendered, encoding="utf-8")
            records.append(search_page(entry["page"]))
        self.search = add_search_companions(records, self.data)
        (self.book / "search.json").write_text(json.dumps(self.search), encoding="utf-8")

    def test_complete_cross_chapter_fixture_passes(self):
        report = audit_book(self.book, self.data, check_search=True)
        self.assertEqual(report["errors"], [])
        self.assertEqual(report["labels_checked"], len(self.data["entries"]))
        self.assertEqual(report["cross_chapter_indexes_checked"], 1)
        self.assertEqual(report["search_checked"], len(self.data["entries"]))

    def test_wrong_relative_index_link_is_rejected(self):
        path = self.book / "chapters/part4/transformer.html"
        path.write_text(path.read_text().replace('../interludes/replay.html#scene', 'replay.html#scene'))
        self.assertTrue(any("relative targets" in e for e in audit_book(self.book, self.data)["errors"]))

    def test_hidden_badge_is_rejected(self):
        path = self.book / "chapters/part4/attention.html"
        text = path.read_text()
        match = GENERATED.search(text)
        self.assertIsNotNone(match)
        text = text[:match.start()] + '<details><summary>Hidden</summary>' + match.group() + '</details>' + text[match.end():]
        path.write_text(text)
        self.assertTrue(any("inside a collapsible" in e for e in audit_book(self.book, self.data)["errors"]))

    def test_badge_inside_quarto_callout_is_rejected(self):
        path = self.book / "chapters/part4/attention.html"
        text = path.read_text()
        match = GENERATED.search(text)
        text = text[:match.start()] + '<div class="callout-collapse collapse">' + match.group() + '</div>' + text[match.end():]
        path.write_text(text)
        self.assertTrue(any("inside a collapsible" in e for e in audit_book(self.book, self.data)["errors"]))

    def test_missing_page_is_rejected(self):
        (self.book / "chapters/interludes/replay.html").unlink()
        self.assertTrue(any("missing rendered page" in e for e in audit_book(self.book, self.data)["errors"]))

    def test_duplicate_target_and_duplicate_badge_are_rejected(self):
        path = self.book / "chapters/part4/attention.html"
        text = path.read_text()
        badge = GENERATED.search(text).group()
        path.write_text(text + '<div id="scaled-dot"></div>' + badge)
        errors = audit_book(self.book, self.data)["errors"]
        self.assertTrue(any("exactly one #scaled-dot" in e for e in errors))
        self.assertTrue(any("2 visible label elements" in e for e in errors))

    def test_search_label_must_match_whole_identifier(self):
        self.search[-1]["text"] = "Animation 16.AA"
        (self.book / "search.json").write_text(json.dumps(self.search))
        errors = audit_book(self.book, self.data, check_search=True)["errors"]
        self.assertTrue(any("Animation 16.A needs one searchable record" in e for e in errors))


if __name__ == "__main__":
    unittest.main()
