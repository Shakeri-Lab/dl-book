#!/usr/bin/env python3
"""Measure and enforce the narrator's voice on the rendered HTML book.

The contract lives in VOICE.md. This audit reads rendered pages, never sources, so
Quarto cross-references count the way a reader sees them ("Chapter 11", not
"@sec-11-encoder-decoder"). Text is split into classes before anything is counted:

  A running prose, B captions, C callouts, D exercises, E sources, F plan steps,
  H alt text and table cells, T headings, R replay panels (report only).

Code, cell outputs, and mathematics (class G) are removed before measurement.

Modes:
  --ledger HTML_ROOT --csv OUT.csv [--markdown OUT.md]
      Write one row of metrics per page (raw counts and rates per 1,000 words of
      class A prose) plus a Markdown table sorted by distance from the Part I profile.
  --delta BEFORE.csv AFTER.csv --markdown OUT.md
      Compare two ledgers page by page and report band status after the change.
  --check HTML_ROOT
      Block on the mechanical register rules R1 to R6 for every page in VOICE_SCOPE;
      print density-band warnings for chapters and interludes (never blocking).
  --sections HTML_PAGE
      Print guard and chapter-reference counts per level-2 section (receipt notes).
  --hits HTML_PAGE --metric NAME
      Print every hit of one metric with context (pattern calibration).
"""

from __future__ import annotations

import argparse
import csv
import itertools
import json
import math
import re
import statistics
import sys
from dataclasses import dataclass, field
from pathlib import Path

from bs4 import BeautifulSoup, Comment, NavigableString, Tag


ROOT = Path(__file__).resolve().parents[1]

# Pages whose register rules R1 to R6 block CI. The voice-coherence sweep adds pages
# here as each one is revised; VOICE.md records the same list.
VOICE_SCOPE: tuple[str, ...] = (
    "chapters/part1/01-linear-regression.qmd",
    "chapters/part1/06-generalization-inductive-bias.qmd",
    "chapters/part4/13-attention.qmd",
    "chapters/interludes/attention-as-test-time-regression.qmd",
    "chapters/part5/17-peft-quantization.qmd",
)

# Frozen Part I reference profile (medians of Chapters 1 to 6 in the baseline ledger,
# rates per 1,000 words of class A prose). VOICE.md, section "Ledger", holds the same
# numbers; change both together, and only as an explicit contract revision.
REFERENCE_PROFILE = {
    "reader_address_per1k": 4.264,
    "verdicts_per1k": 1.622,
    "metaphor_hits_per1k": 5.822,
    "guards_A_per1k": 1.192,
    "chapter_refs_A_per1k": 5.911,
    # Stage B: reader address counts sentence-initial imperatives as well as "you".
    "reader_address_total_per1k": 5.271,
}
WARMTH_FLOOR = 0.6
GUARD_CEILING = 1.25
CHAPTER_REF_CEILING = 1.5
OPENER_CHAPTER_REF_CAP = 2
PARAGRAPH_CHAPTER_REF_CAP = 2
RECAP_CLAIM_WORDS = 10  # D1 as amended for Stage B: a phrase or a claim of at most ten words
VERDICT_WORDS = 12

CLASSES = ("A", "B", "C", "D", "E", "F", "H", "T", "R")
REGISTER_CLASSES = ("A", "B", "C", "D", "E", "F", "H", "T")

# --------------------------------------------------------------------------- patterns
# Frozen after calibration on Chapters 1 and 13 (audits/voice/calibration.md).
GUARD_PATTERNS = (
    re.compile(r",\s*not\s+(?:a|an|the|every|one|any|merely|calibrated)\b"),
    re.compile(r"\bnot (?:a|an) (?:claim|promise|proof|law|guarantee|mask|substitute)\b"),
    re.compile(r"\b(?:is|are) not (?:a|an) "),
    re.compile(r"\bit does not (?:make|isolate|normalize|prove|establish|claim)\b", re.I),
    re.compile(r"\bneither\b.*?\bnor\b", re.I),
    re.compile(r"\bwithout any guarantee\b", re.I),
)
CHAPTER_REF_RE = re.compile(r"\bChapters?\s+\d+")
READER_RE = re.compile(r"\b(?:you|your|yours|yourself|yourselves)\b", re.I)
WE_RE = re.compile(r"\b(?:we|us|our|ours|ourselves)\b", re.I)
I_RE = re.compile(
    r"(?<!Part )(?<!Parts )(?<!Phase )(?<!Type )\bI\b(?![/IVX])|\b(?:[Mm]e|[Mm]y|[Mm]ine|[Mm]yself)\b"
)
METAPHOR_RE = re.compile(
    r"\b(?:knobs?|landscapes?|slopes?|downhill|hood|engines?|relays?|hand-?offs?|"
    r"bottlenecks?|bridges?|address(?:es)?|templates?|dials?|referees?|rulers?)\b"
    r"|\bfilter slid(?:es|ing)?\b|\bslid(?:e|es|ing) the filter\b"
    # Stage B additions: the book's own recurring images outside the first lexicon.
    r"|\b(?:bills?|ledgers?|prices?|price tags?|purchases?|purchased|currency|currencies|"
    r"tax(?:es)?|report cards?|demerits?|IOUs?|walls?|seeds?|contracts?|recipes?|"
    r"appliances?|detectives?|committees?|cliffs?|budgets?)\b",
    re.I,
)
# Reader-directed imperatives at the start of a class A sentence count as reader address.
IMPERATIVE_RE = re.compile(
    r"^(?:Run|Rerun|Try|Watch|Predict|Write|Change|Compare|Notice|Check|Count|Read|Pause|"
    r"Skip|Return|Test|Keep)\b"
)
# Cold-prose proxy (report only; I18 compares it before and after an edit).
NOMINALIZATION_RE = re.compile(r"\b[A-Za-z]{3,}(?:tion|sion|ity|ness|ment|ance|ence)s?\b")
# Words that end in those suffixes but are usually verbs or plain nouns here, not
# nominalizations of a verb ("implement it by hand", "the experiment", "a sentence").
NOMINALIZATION_EXCLUDE = {
    word + suffix
    for word in (
        "implement", "augment", "supplement", "complement", "document", "comment",
        "experiment", "segment", "advance", "enhance", "balance", "reference", "influence",
        "sentence",
    )
    for suffix in ("", "s")
}


def nominalizations(text: str) -> int:
    return sum(
        1 for word in NOMINALIZATION_RE.findall(text) if word.lower() not in NOMINALIZATION_EXCLUDE
    )
# V3 signature phrases: book-wide counts over every visible text class.
PHRASES = {
    "one_caution": re.compile(r"\bone caution\b", re.I),
    "that_is_the_whole": re.compile(r"\bthat is the whole\b", re.I),
    # The promise formula only; Chapter 10's "By the end of a sentence" is literal.
    "by_the_end": re.compile(r"\bBy the end(?=,| of (?:the|this) chapter\b| we\b| you\b)"),
    "you_will_be_able_to": re.compile(r"\byou will be able to\b", re.I),
    "in_one_sentence": re.compile(r"\bin one sentence\b", re.I),
    "deliberately": re.compile(r"\bdeliberately\b", re.I),
    "honest": re.compile(r"\bhonest(?:ly|y)?\b", re.I),
    "is_exactly": re.compile(r"\bis exactly\b", re.I),
    "here_is_the": re.compile(r"\bhere is the\b", re.I),
    "is_the_whole": re.compile(r"\bis the whole\b", re.I),
}
# Blocking caps, whole book (V3). The rest are report-only habit words (S5).
PHRASE_CAPS = {
    "one_caution": 0,
    "that_is_the_whole": 0,
    "by_the_end": 2,
    "you_will_be_able_to": 1,
    "in_one_sentence": 3,
}
PHRASE_CLASSES = ("A", "B", "C", "D", "E", "F", "H", "T")
REGISTER_PATTERNS = {
    "okay": re.compile(r"\bOkay\b", re.I),
    "let_us": re.compile(r"\b[Ll]et us\b"),
    "aka": re.compile(r"\baka\b|\ba\.k\.a\.", re.I),
    "exclamation": re.compile(r"!"),
    "contractions": re.compile(
        r"\b\w+n[’']t\b|\b(?:[Ww]e|[Yy]ou|[Tt]hey)[’'](?:ll|re|ve|d)\b"
        r"|\b(?:[Ii]t|[Tt]hat|[Tt]here|[Ll]et|[Hh]ere|[Ww]hat|[Ww]ho)[’'](?:s|ll|d)\b"
        r"|\bI[’'](?:ll|m|d|ve)\b"
    ),
    "em_dash": re.compile("\u2014"),
    "note_that": re.compile(r"\b[Nn]ote that\b"),
    "it_can_be_shown": re.compile(r"\b[Ii]t can be shown\b"),
    "it_is_important": re.compile(
        r"\b[Ii]t is (?:important|worth) (?:to note|noting)\b|\b[Ii]t should be noted\b"
    ),
    "one_can": re.compile(r"(?<!\bno )(?<!\bany )(?<!\bevery )\b[Oo]ne (?:can|may|might|sees|obtains)\b"),
    "the_reader": re.compile(r"\b[Tt]he reader\b"),
    "intensifiers": re.compile(r"\b(?:clearly|obviously|trivially|of course|easy to see)\b", re.I),
    "simply_just": re.compile(r"\b(?:simply|just)\b", re.I),
}
# Mechanical rules that block, and the classes each one governs (VOICE.md, D2 to D6).
BLOCKING = {
    "R2": ("let_us", ("A", "B", "C", "D", "E", "F", "H", "T")),
    "R3": ("aka", ("A", "B", "C", "D", "E", "F", "H", "T")),
    "R4": ("exclamation", ("A", "B", "C", "D", "E", "H", "T")),
    "R5": ("contractions", ("A", "B", "C", "D", "E")),
    "R6": ("em_dash", ("A", "B", "C", "D", "E", "F", "H", "T")),
}
RECAP_RE = re.compile(r"^Okay, so\b")
RECAP_TEMPLATE_RE = re.compile(r"^Okay, so: (?P<claim>[^!\u2014]+)$")

WORD_RE = re.compile(r"[A-Za-z0-9](?:[A-Za-z0-9'’\-]*[A-Za-z0-9])?")
SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])[\"”’)\]]*\s+(?=[A-Z“\"(\d])")
SENTENCE_END_RE = re.compile(r"[.!?][\"”’)\]]*$")
VERDICT_LEAD_IN_RE = re.compile(
    r"^(?:First|Second|Third|Next|Then|Now|Notice|Here|Recall|Consider|We|Let|Finally|"
    r"Before|After)\b"
)
FUTURE_RE = re.compile(r"\bwill\b", re.I)
MATH_TOKEN = "MATH"
CODE_TOKEN = "CODE"
DISPLAY_BREAK = "\u0000"
EM_OPEN, EM_CLOSE = "\u0001", "\u0002"

SKIP_TAGS = {
    "script", "style", "nav", "pre", "button", "svg", "mjx-container", "noscript",
    "iframe", "video", "audio", "canvas", "form", "input", "select", "textarea",
    "template",
}
SKIP_CLASSES = {
    "chapter-tools", "screen-reader-only", "visually-hidden", "code-copy-outer-scaffold",
    "cell-code", "sourceCode", "quarto-title-meta", "quarto-title-breadcrumbs",
    "header-section-number", "chapter-number", "quarto-appendix-contents",
    "callout-icon-container", "footnote-back",
}
OUTPUT_CLASSES = {
    "cell-output", "cell-output-stdout", "cell-output-stderr", "cell-output-error",
}
REPLAY_CLASSES = {"mechanism-excerpt", "conv-excerpt"}
TEXT_BLOCK_TAGS = {
    "p", "li", "dt", "dd", "h1", "h2", "h3", "h4", "h5", "h6", "figcaption",
    "caption", "td", "th", "summary",
}
CONTAINER_TAGS = {
    "div", "section", "article", "main", "header", "footer", "figure", "blockquote",
    "ul", "ol", "dl", "table", "thead", "tbody", "tfoot", "tr", "details", "aside",
    "span", "a", "center",
}
INLINE_BLOCK_BREAKERS = TEXT_BLOCK_TAGS | {
    "div", "section", "figure", "blockquote", "ul", "ol", "dl", "table", "pre",
    "details", "aside", "header",
}


# ----------------------------------------------------------------------------- pages
def page_category(source: str) -> str:
    if source == "index.qmd":
        return "preface"
    if source.startswith("chapters/parts/"):
        return "part"
    if source.startswith("chapters/part"):
        return "chapter"
    if source.startswith("chapters/interludes/"):
        return "interlude"
    if source == "chapters/epilogue.qmd":
        return "epilogue"
    if source.startswith("chapters/appendices/"):
        return "appendix"
    return "other"


def book_sources() -> list[str]:
    sources = ["index.qmd"]
    sources += sorted(
        path.relative_to(ROOT).as_posix()
        for path in (ROOT / "chapters").rglob("*.qmd")
        if not path.name.endswith(".pdf.qmd")
    )
    return sources


def html_for(source: str, html_root: Path) -> Path:
    return html_root / Path(source).with_suffix(".html")


def transplant_scope(source: str) -> bool:
    """D10: chapters 1 to 20 and the three interludes receive the T rules."""
    return page_category(source) in {"chapter", "interlude"}


def part_one(source: str) -> bool:
    return source.startswith("chapters/part1/")


def guard_ceiling(source: str) -> float:
    """S1 as amended: 1.5 per 1,000 words in Parts I to III, 2.5 in Parts IV and V and the interludes."""
    if source.startswith(("chapters/part1/", "chapters/part2/", "chapters/part3/")):
        return 1.5
    return 2.5


def reader_floor_factor(source: str) -> float:
    """Reader address floor: 0.6 of the Part I profile inside Part I, 0.5 elsewhere."""
    return WARMTH_FLOOR if part_one(source) else 0.5


# ------------------------------------------------------------------------ extraction
@dataclass
class Block:
    cls: str
    kind: str
    text: str
    marked: str
    opener: bool
    section: str
    after_event: str | None
    continuation: bool


@dataclass
class Page:
    source: str
    blocks: list[Block] = field(default_factory=list)
    sections: list[tuple[str, str]] = field(default_factory=list)


def has_class(tag: Tag, names: set[str]) -> bool:
    return bool(set(tag.get("class") or []) & names)


def is_skipped(tag: Tag) -> bool:
    if tag.name in SKIP_TAGS:
        return True
    if has_class(tag, SKIP_CLASSES):
        return True
    if tag.get("aria-hidden") == "true" and tag.name not in {"span", "a"}:
        return True
    return False


def is_output(tag: Tag) -> bool:
    return has_class(tag, OUTPUT_CLASSES) and not tag.find("figure")


def inline_text(tag: Tag, mark_emphasis: bool) -> str:
    """Flatten one text block, replacing math and code by tokens.

    Display mathematics becomes DISPLAY_BREAK so the caller can split a paragraph at
    an equation. Nested block children are skipped: they are blocks of their own.
    """
    parts: list[str] = []
    for child in tag.children:
        if isinstance(child, Comment):
            continue
        if isinstance(child, NavigableString):
            parts.append(str(child))
            continue
        if not isinstance(child, Tag):
            continue
        if child.name in INLINE_BLOCK_BREAKERS and child is not tag:
            continue
        classes = set(child.get("class") or [])
        if "math" in classes:
            parts.append(DISPLAY_BREAK if "display" in classes else MATH_TOKEN)
            continue
        if child.name == "mjx-container":
            parts.append(MATH_TOKEN)
            continue
        if child.name == "code":
            parts.append(CODE_TOKEN)
            continue
        if is_skipped(child):
            continue
        inner = inline_text(child, mark_emphasis)
        if mark_emphasis and child.name in {"em", "cite", "q", "i"}:
            inner = EM_OPEN + inner + EM_CLOSE
        parts.append(inner)
    return "".join(parts)


def normalize(text: str) -> str:
    return re.sub(r"[ \t\r\n ]+", " ", text).strip()


class Walker:
    def __init__(self, page: Page) -> None:
        self.page = page
        self.pending_event: str | None = None
        self.opener = True
        self.section = ""

    def event(self, kind: str) -> None:
        self.pending_event = kind

    def emit(self, cls: str, kind: str, raw: str, marked_raw: str) -> None:
        segments = raw.split(DISPLAY_BREAK)
        marked_segments = marked_raw.split(DISPLAY_BREAK)
        for index, segment in enumerate(segments):
            if index > 0:
                self.event("math")
            text = normalize(segment.replace(EM_OPEN, "").replace(EM_CLOSE, ""))
            marked = normalize(marked_segments[index]) if index < len(marked_segments) else text
            if not text:
                continue
            self.page.blocks.append(
                Block(
                    cls=cls,
                    kind=kind,
                    text=text,
                    marked=marked,
                    opener=self.opener,
                    section=self.section,
                    after_event=self.pending_event,
                    continuation=index > 0,
                )
            )
            self.pending_event = None

    def walk(self, tag: Tag, cls: str) -> None:
        for child in tag.children:
            if not isinstance(child, Tag):
                if isinstance(child, NavigableString) and not isinstance(child, Comment):
                    if tag.name in {"div"} and normalize(str(child)):
                        self.emit(cls, "div-text", str(child), str(child))
                continue
            self.visit(child, cls)

    def visit(self, tag: Tag, cls: str) -> None:
        classes = set(tag.get("class") or [])
        if tag.name == "section" and "level2" in classes:
            self.opener = False
            self.section = tag.get("id") or ""
            heading = tag.find(["h2"], recursive=False)
            title = normalize(inline_text(heading, False)) if heading else ""
            self.page.sections.append((self.section, title))
        if is_skipped(tag):
            if tag.name == "pre" and cls in {"A", "C"}:
                self.event("output")
            return
        if is_output(tag):
            self.event("output")
            return
        new_cls = cls
        if cls != "R":
            if classes & REPLAY_CLASSES:
                new_cls = "R"
            elif "plan" in classes:
                new_cls = "F"
            elif tag.name in {"figcaption", "caption"}:
                new_cls = "B"
            elif tag.name in {"td", "th"} and cls not in {"B"}:
                new_cls = "H"
            elif tag.name == "section" and tag.get("id") == "exercises":
                new_cls = "D"
            elif tag.name == "section" and tag.get("id") == "sources-and-further-reading":
                new_cls = "E"
            elif "callout" in classes:
                new_cls = "C"
            elif tag.name in {"h1", "h2", "h3", "h4", "h5", "h6"}:
                new_cls = "T"
        if tag.name == "img":
            alt = normalize(tag.get("alt") or "")
            if alt and new_cls != "R":
                self.page.blocks.append(
                    Block("H", "alt", alt, alt, self.opener, self.section, None, False)
                )
            return
        if "callout-title-container" in classes and new_cls != "R":
            self.emit("T" if cls == "C" else new_cls, "callout-title",
                      inline_text(tag, False), inline_text(tag, True))
            return
        if tag.name in TEXT_BLOCK_TAGS:
            self.emit(new_cls, tag.name, inline_text(tag, False), inline_text(tag, True))
            self.walk_nested_blocks(tag, new_cls)
            return
        if tag.name == "figure" or "quarto-float" in classes:
            self.walk(tag, new_cls)
            if tag.name == "figure":
                self.event("figure")
            return
        if tag.name == "div" and "cell" in classes:
            self.walk(tag, new_cls)
            return
        self.walk(tag, new_cls)

    def walk_nested_blocks(self, tag: Tag, cls: str) -> None:
        for child in tag.children:
            if isinstance(child, Tag) and child.name in INLINE_BLOCK_BREAKERS:
                self.visit(child, cls)


def extract(html_path: Path, source: str) -> Page:
    soup = BeautifulSoup(html_path.read_text(encoding="utf-8"), "html.parser")
    main = soup.find("main", id="quarto-document-content") or soup.find("main")
    page = Page(source=source)
    if main is None:
        return page
    walker = Walker(page)
    header = main.find("header", id="title-block-header")
    if header is not None:
        title = header.find("h1")
        if title is not None:
            walker.emit("T", "h1", inline_text(title, False), inline_text(title, True))
        header.extract()
    walker.walk(main, "A")
    return page


# --------------------------------------------------------------------------- metrics
def words(text: str) -> int:
    return len(WORD_RE.findall(text))


def sentences(text: str) -> list[str]:
    return [piece for piece in SENTENCE_SPLIT_RE.split(text) if piece.strip()]


def guard_spans(text: str) -> list[tuple[int, int]]:
    spans: list[tuple[int, int]] = []
    for pattern in GUARD_PATTERNS:
        spans.extend(match.span() for match in pattern.finditer(text))
    spans.sort()
    merged: list[tuple[int, int]] = []
    for start, end in spans:
        if merged and start <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(end, merged[-1][1]))
        else:
            merged.append((start, end))
    return merged


def is_verdict(block: Block) -> bool:
    """K1 heuristic: a short, complete, present-tense sentence right after an event.

    Calibrated on Chapters 1 and 13: lead-ins that end at an equation, transitions
    ("First, ...", "Notice ..."), first-person plans, and forward references are not
    verdicts about the display they follow.
    """
    if block.cls != "A" or block.after_event is None:
        return False
    first = sentences(block.text)[0] if block.text else ""
    count = words(first)
    if not 2 <= count <= VERDICT_WORDS:
        return False
    head = first.lstrip("“\"(")
    if not head or not (head[0].isupper() or head[0].isdigit()):
        return False
    if head.startswith((MATH_TOKEN, CODE_TOKEN)):
        return False
    if not SENTENCE_END_RE.search(first.strip()):
        return False
    if VERDICT_LEAD_IN_RE.match(head) or FUTURE_RE.search(first):
        return False
    return True


def per1k(count: float, total_words: int) -> float:
    return round(1000.0 * count / total_words, 3) if total_words else 0.0


def quoted_or_cited(block: Block, index: int) -> bool:
    """D6 and N1: quoted material, and cited titles in Sources, stay as written.

    ``index`` is an offset into ``block.marked``, where italic, cite, and q
    elements are wrapped in sentinels. Quotation marks count in every class; an
    italic span counts only in Sources (class E), where it marks a cited title.
    """
    marked = block.marked
    if marked.count("“", 0, index) > marked.count("”", 0, index) and "”" in marked[index:]:
        return True
    if block.cls == "E" and marked.count(EM_OPEN, 0, index) > marked.count(EM_CLOSE, 0, index):
        return True
    return False


def plain(text: str) -> str:
    return text.replace(EM_OPEN, "").replace(EM_CLOSE, "")


def register_hits(page: Page) -> list[tuple[str, str, bool]]:
    """Return (marker, class, exempt) for every register-marker hit."""
    hits = []
    for block in page.blocks:
        if block.cls not in REGISTER_CLASSES:
            continue
        for marker, pattern in REGISTER_PATTERNS.items():
            for match in pattern.finditer(block.marked):
                hits.append((marker, block.cls, quoted_or_cited(block, match.start())))
    return hits


def page_metrics(page: Page) -> dict[str, object]:
    by_class = {name: [block for block in page.blocks if block.cls == name] for name in CLASSES}
    prose = by_class["A"]
    words_by_class = {name: sum(words(b.text) for b in by_class[name]) for name in CLASSES}
    words_a = words_by_class["A"]

    guards = {name: sum(len(guard_spans(b.text)) for b in by_class[name]) for name in "ABC"}
    chapter_counts = [len(CHAPTER_REF_RE.findall(b.text)) for b in prose]
    opener_refs = sum(
        len(CHAPTER_REF_RE.findall(b.text)) for b in prose if b.opener
    )
    reader = sum(len(READER_RE.findall(b.text)) for b in prose)
    imperatives = sum(
        1
        for b in prose
        for sentence in sentences(b.text)
        if IMPERATIVE_RE.match(sentence.lstrip("“\"("))
    )
    nominal_count = sum(nominalizations(b.text) for b in prose)
    verdicts = sum(1 for b in prose if is_verdict(b))
    metaphors = sum(len(METAPHOR_RE.findall(b.text)) for b in prose)
    we = sum(len(WE_RE.findall(b.text)) for b in prose)
    first_person = sum(len(I_RE.findall(b.text)) for b in prose)

    row: dict[str, object] = {
        "page": page.source,
        "category": page_category(page.source),
        "transplant_scope": int(transplant_scope(page.source)),
        "voice_scope": int(page.source in VOICE_SCOPE),
    }
    for name in CLASSES:
        row[f"words_{name}"] = words_by_class[name]
    row.update(
        {
            "guards_A": guards["A"],
            "guards_A_per1k": per1k(guards["A"], words_a),
            "guards_B": guards["B"],
            "guards_C": guards["C"],
            "chapter_refs_A": sum(chapter_counts),
            "chapter_refs_A_per1k": per1k(sum(chapter_counts), words_a),
            "chapter_refs_opener": opener_refs,
            "chapter_refs_max_paragraph": max(chapter_counts, default=0),
            "reader_address": reader,
            "reader_address_per1k": per1k(reader, words_a),
            "imperatives": imperatives,
            "reader_address_total": reader + imperatives,
            "reader_address_total_per1k": per1k(reader + imperatives, words_a),
            "nominalizations": nominal_count,
            "nominalizations_per1k": per1k(nominal_count, words_a),
            "verdicts": verdicts,
            "verdicts_per1k": per1k(verdicts, words_a),
            "metaphor_hits": metaphors,
            "metaphor_hits_per1k": per1k(metaphors, words_a),
            "we_count": we,
            "we_per1k": per1k(we, words_a),
            "i_count": first_person,
        }
    )
    hits = register_hits(page)
    for marker in REGISTER_PATTERNS:
        marker_hits = [hit for hit in hits if hit[0] == marker and not hit[2]]
        row[marker] = len(marker_hits)
        row[f"{marker}_exempt"] = sum(1 for hit in hits if hit[0] == marker and hit[2])
        row[f"{marker}_by_class"] = " ".join(
            f"{name}:{sum(1 for hit in marker_hits if hit[1] == name)}"
            for name in REGISTER_CLASSES
            if any(hit[1] == name for hit in marker_hits)
        )
    replay_dashes = sum(b.text.count("\u2014") for b in by_class["R"])
    row["em_dash_R"] = replay_dashes
    for name, pattern in PHRASES.items():
        row[f"phrase_{name}"] = sum(
            len(pattern.findall(b.text)) for b in page.blocks if b.cls in PHRASE_CLASSES
        )
    return row


BAND_METRICS = (
    ("reader_address_total_per1k", "floor"),
    ("verdicts_per1k", "floor"),
    ("metaphor_hits_per1k", "floor"),
    ("guards_A_per1k", "ceiling"),
    ("chapter_refs_A_per1k", "ceiling"),
)


def reference_profile(rows: list[dict[str, object]] | None = None) -> dict[str, float]:
    if all(value is not None for value in REFERENCE_PROFILE.values()):
        return {key: float(value) for key, value in REFERENCE_PROFILE.items()}
    if rows is None:
        raise SystemExit("reference profile is not frozen; pass a baseline ledger")
    part = [row for row in rows if part_one(str(row["page"]))]
    return {
        key: round(statistics.median(float(row[key]) for row in part), 3)
        for key, _ in BAND_METRICS
    }


def band_status(row: dict[str, object], profile: dict[str, float]) -> dict[str, str]:
    status = {}
    source = str(row["page"])
    for key, direction in BAND_METRICS:
        if key not in row or row[key] in ("", None):
            continue
        value = float(row[key])
        reference = profile[key]
        if direction == "floor":
            factor = reader_floor_factor(source) if key.startswith("reader_address") else WARMTH_FLOOR
            limit = factor * reference
            status[key] = "ok" if value >= limit else f"low (<{limit:.2f})"
        elif key.startswith("guards"):
            limit = guard_ceiling(source)
            status[key] = "ok" if value <= limit else f"high (>{limit:.2f})"
        else:
            limit = CHAPTER_REF_CEILING * reference
            status[key] = "ok" if value <= limit else f"high (>{limit:.2f})"
    opener = int(row["chapter_refs_opener"])
    paragraph = int(row["chapter_refs_max_paragraph"])
    status["chapter_refs_opener"] = (
        "ok" if opener <= OPENER_CHAPTER_REF_CAP else f"high (>{OPENER_CHAPTER_REF_CAP})"
    )
    status["chapter_refs_max_paragraph"] = (
        "ok" if paragraph <= PARAGRAPH_CHAPTER_REF_CAP else f"high (>{PARAGRAPH_CHAPTER_REF_CAP})"
    )
    return status


def distance(row: dict[str, object], profile: dict[str, float]) -> float:
    total = 0.0
    for key, _ in BAND_METRICS:
        if key not in row or row[key] in ("", None):
            continue
        reference = profile[key] or 1.0
        total += ((float(row[key]) - profile[key]) / reference) ** 2
    return round(math.sqrt(total), 3)


# ------------------------------------------------------------------ added sentences (I17)
EDITS_DIR = ROOT / "audits" / "voice" / "edits"
BOOK_QUESTION = ("what", "if", "we", "made", "this", "learnable")
PARAGRAPH_BREAK = "\u2029"
CAPTION_OPTION_RE = re.compile(r'^\s*#\|\s*(?:fig-cap|tbl-cap|fig-subcap)\s*:\s*"?(.*?)"?\s*$')


def source_prose(text: str) -> str:
    """Reader-visible prose of a .qmd fragment or page, normalized for sentence matching.

    Code is dropped except caption options; headings, fenced-div markers, comments,
    and plan steps are dropped; math and cross-references become placeholders.
    """
    text = re.sub(r"<!--.*?-->", " ", text, flags=re.S)
    kept: list[str] = []
    fence: str | None = None
    in_plan = False
    for line in text.split("\n"):
        stripped = line.strip()
        if not stripped or re.match(r"^(?:[-*+]|\d+\.)\s", stripped):
            kept.append(PARAGRAPH_BREAK)  # paragraphs and list items never share a sentence
            line = re.sub(r"^\s*(?:[-*+]|\d+\.)\s+", "", line)
            stripped = line.strip()
        match = re.match(r"^(`{3,}|~{3,})", stripped)
        if fence is None and match:
            fence = match.group(1)
            continue
        if fence is not None:
            if re.fullmatch(rf"{re.escape(fence[0])}{{{len(fence)},}}", stripped):
                fence = None
                continue
            caption = CAPTION_OPTION_RE.match(line)
            if caption:
                kept.append(caption.group(1))
            continue
        if re.match(r"^:{3,}\s*\{[^}]*\.plan\b", stripped):
            in_plan = True
            continue
        if stripped.startswith(":::"):
            in_plan = False
            continue
        if in_plan or re.match(r"^#{1,6}\s", stripped):
            continue
        caption = CAPTION_OPTION_RE.match(line)
        kept.append(caption.group(1) if caption else line)
    text = " ".join(kept)
    text = re.sub(r"\$\$.*?\$\$", " MATH ", text, flags=re.S)
    text = re.sub(r"\$[^$]+\$", " MATH ", text)
    text = re.sub(r"!?\[([^\]]*)\]\([^)]*\)(\{[^}]*\})?", r"\1", text)
    text = re.sub(r"@(?:sec|fig|eq|tbl|exr|exfig|aefig|ttrfig|epfig|extbl|lst)-[A-Za-z0-9_-]+", " REF ", text)
    text = re.sub(r"\{[#.][^}]*\}", " ", text)
    text = text.replace("**", "").replace("*", "").replace("`", "").replace("\\\\", "\\")
    return re.sub(r"[ \t\r\n]+", " ", text).strip()


def prose_sentences(text: str) -> list[str]:
    """Sentences of a source_prose string; paragraph and list boundaries always split."""
    out = []
    for chunk in text.split(PARAGRAPH_BREAK):
        out.extend(piece.strip() for piece in sentences(chunk.strip()) if piece.strip())
    return out


def tokens(sentence: str) -> list[str]:
    return re.findall(r"[a-z0-9]+(?:'[a-z]+)?", sentence.lower().replace("’", "'"))


def added_sentences(include_restored: bool = False) -> dict[str, list[tuple[str, str]]]:
    """Per page: (edit id, full current sentence) for every sentence this pass added.

    A sentence counts as added when an applied edit's new text contains it and the
    edit's old text did not; it is expanded to the full sentence in the current page
    and kept only while it is still there (later edits can supersede earlier ones).
    Heading edits are skipped: every recap heading must begin "Okay, so:" (D1).
    """
    result: dict[str, list[tuple[str, str]]] = {}
    for path in sorted(EDITS_DIR.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        page = data["page"]
        current = prose_sentences(source_prose((ROOT / page).read_text(encoding="utf-8")))
        seen: set[str] = set()
        found: list[tuple[str, str]] = []
        for edit in data["edits"]:
            if not edit.get("applied") or re.match(r"^\s*#{1,6}\s", edit["new"]):
                continue
            if not include_restored and edit.get("justification", "").startswith("restored"):
                continue  # earlier author text put back verbatim is not new phrasing (V2)
            old_parts = set(prose_sentences(source_prose(edit["old"])))
            for part in prose_sentences(source_prose(edit["new"])):
                if part in old_parts or len(tokens(part)) < 2:
                    continue
                for sentence in current:
                    if part in sentence and sentence not in seen:
                        seen.add(sentence)
                        found.append((edit["id"], sentence))
        result[page] = found
    return result


def grams(sentence: str) -> set[tuple[str, ...]]:
    words_ = tokens(sentence)
    question = " ".join(BOOK_QUESTION)
    out = set()
    for index in range(len(words_) - 3):
        gram = tuple(words_[index:index + 4])
        if " ".join(gram) in question:
            continue
        out.add(gram)
    return out


def i17_violations(added: dict[str, list[tuple[str, str]]]) -> list[str]:
    """V2: no shared four-word sequence and no shared first three words across chapters."""
    problems = []
    flat = [(page, edit_id, sentence) for page, items in added.items() for edit_id, sentence in items]
    for (page_a, id_a, s_a), (page_b, id_b, s_b) in itertools.combinations(flat, 2):
        if page_a == page_b:
            continue
        shared = sorted(grams(s_a) & grams(s_b))
        if shared:
            problems.append(
                f"I17 shared four-word sequence {' '.join(shared[0])!r}: {id_a} {s_a[:90]!r} / {id_b} {s_b[:90]!r}"
            )
        head_a, head_b = tokens(s_a)[:3], tokens(s_b)[:3]
        if len(head_a) == 3 and head_a == head_b:
            problems.append(
                f"I17 shared first three words {' '.join(head_a)!r}: {id_a} {s_a[:90]!r} / {id_b} {s_b[:90]!r}"
            )
    return problems


def phrase_totals(rows: list[dict[str, object]]) -> dict[str, int]:
    return {name: sum(int(row[f"phrase_{name}"]) for row in rows) for name in PHRASES}


# ------------------------------------------------------------------------------ check
def recap_violations(page: Page) -> list[str]:
    if page_category(page.source) not in {"chapter", "interlude"}:
        return []
    recaps = [title for _, title in page.sections if RECAP_RE.match(title)]
    if len(recaps) != 1:
        return [f"R1 expected one 'Okay, so' recap heading, found {len(recaps)}"]
    match = RECAP_TEMPLATE_RE.match(recaps[0])
    if match is None:
        return [f"R1 recap heading must read 'Okay, so: <claim>': {recaps[0]!r}"]
    if words(match.group("claim")) > RECAP_CLAIM_WORDS:
        return [f"R1 recap claim exceeds {RECAP_CLAIM_WORDS} words: {recaps[0]!r}"]
    return []


def blocking_violations(page: Page) -> tuple[list[str], list[str]]:
    errors = recap_violations(page)
    exemptions = []
    for rule, (marker, classes) in BLOCKING.items():
        pattern = REGISTER_PATTERNS[marker]
        for block in page.blocks:
            if block.cls not in classes:
                continue
            for match in pattern.finditer(block.marked):
                context = plain(block.marked[max(0, match.start() - 60): match.end() + 60])
                if quoted_or_cited(block, match.start()):
                    exemptions.append(f"{rule} exempt (quoted or cited) [{block.cls}] …{context}…")
                    continue
                errors.append(f"{rule} [{block.cls}] …{context}…")
    return errors, exemptions


def run_check(html_root: Path) -> int:
    failures = 0
    warnings = 0
    profile = reference_profile()
    rows = []
    for source in book_sources():
        html = html_for(source, html_root)
        if not html.is_file():
            continue
        page = extract(html, source)
        rows.append(page_metrics(page))
        if source in VOICE_SCOPE:
            errors, exemptions = blocking_violations(page)
            for error in errors:
                print(f"{source}: {error}", file=sys.stderr)
            for exemption in exemptions:
                print(f"{source}: {exemption}")
            failures += len(errors)
        if transplant_scope(source):
            row = rows[-1]
            for key, status in band_status(row, profile).items():
                if status != "ok":
                    warnings += 1
                    print(f"warning: {source}: {key} {row[key]} {status}")
    totals = phrase_totals(rows)
    for name, cap in PHRASE_CAPS.items():
        if totals[name] > cap:
            failures += 1
            pages = ", ".join(
                f"{short(str(row['page']))} {row[f'phrase_{name}']}" for row in rows if int(row[f"phrase_{name}"])
            )
            print(f"V3 cap exceeded: {name} {totals[name]} > {cap} ({pages})", file=sys.stderr)
    added = added_sentences()
    problems = i17_violations(added)
    for problem in problems:
        print(problem, file=sys.stderr)
    failures += len(problems)
    count = sum(len(items) for items in added.values())
    print(
        f"I17: {count} added sentence(s) on {len(added)} page(s); {len(problems)} shared-phrasing "
        "violation(s); V3 caps " + ", ".join(f"{name} {totals[name]}/{cap}" for name, cap in PHRASE_CAPS.items())
    )
    scope = len(VOICE_SCOPE)
    if failures:
        print(
            f"FAILED: {failures} blocking voice violation(s) across {scope} page(s) in "
            "VOICE_SCOPE",
            file=sys.stderr,
        )
        return 1
    print(
        f"PASS: book voice register rules R1 to R6 hold on {scope} page(s) in VOICE_SCOPE; "
        f"{warnings} density-band warning(s) (non-blocking)"
    )
    return 0


# ----------------------------------------------------------------------------- ledger
def ledger_rows(html_root: Path) -> list[dict[str, object]]:
    rows = []
    for source in book_sources():
        html = html_for(source, html_root)
        if html.is_file():
            rows.append(page_metrics(extract(html, source)))
    return rows


def write_csv(rows: list[dict[str, object]], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def read_csv(path: Path) -> list[dict[str, object]]:
    with path.open(encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def short(source: str) -> str:
    return Path(source).stem


def ledger_markdown(rows: list[dict[str, object]], profile: dict[str, float]) -> str:
    lines = [
        "| page | A words | you /1k | verdicts /1k | metaphors /1k | guards A /1k | "
        "Ch. refs /1k | opener refs | max refs/para | distance | bands |",
        "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|",
    ]
    ordered = sorted(rows, key=lambda row: -distance(row, profile))
    for row in ordered:
        status = band_status(row, profile)
        flagged = [key for key, value in status.items() if value != "ok"]
        lines.append(
            f"| {short(str(row['page']))} | {row['words_A']} | {row['reader_address_per1k']} | "
            f"{row['verdicts_per1k']} | {row['metaphor_hits_per1k']} | "
            f"{row['guards_A_per1k']} | {row['chapter_refs_A_per1k']} | "
            f"{row['chapter_refs_opener']} | {row['chapter_refs_max_paragraph']} | "
            f"{distance(row, profile)} | {', '.join(flagged) if flagged else 'ok'} |"
        )
    return "\n".join(lines) + "\n"


def delta_markdown(
    before: list[dict[str, object]],
    after: list[dict[str, object]],
    profile: dict[str, float],
) -> str:
    before_by_page = {row["page"]: row for row in before}
    keys = [key for key, _ in BAND_METRICS] + [
        "reader_address_per1k", "nominalizations_per1k",
        "chapter_refs_opener", "chapter_refs_max_paragraph", "words_A",
        "let_us", "aka", "exclamation", "contractions", "em_dash",
    ]
    ordered = sorted(after, key=lambda row: -distance(row, profile))
    lines = [
        "| page | distance before → after | "
        + " | ".join(keys)
        + " | bands after |",
        "|---|---|" + "---|" * len(keys) + "---|",
    ]
    for row in ordered:
        old = before_by_page.get(row["page"], {})
        cells = []
        for key in keys:
            previous = old.get(key, "")
            current = row.get(key, "")
            cells.append(f"{previous} → {current}" if str(previous) != str(current) else f"{current}")
        status = band_status(row, profile)
        flagged = [f"{key}: {value}" for key, value in status.items() if value != "ok"]
        old_distance = distance(old, profile) if old else ""
        lines.append(
            f"| {short(str(row['page']))} | {old_distance} → {distance(row, profile)} | "
            + " | ".join(cells)
            + f" | {'; '.join(flagged) if flagged else 'ok'} |"
        )
    return "\n".join(lines) + "\n"


PHRASE_LABELS = {
    "one_caution": '"One caution"',
    "that_is_the_whole": '"that is the whole"',
    "by_the_end": '"By the end" (promise formula)',
    "you_will_be_able_to": '"you will be able to"',
    "in_one_sentence": '"in one sentence"',
    "deliberately": '"deliberately"',
    "honest": '"honest", "honestly", "honesty"',
    "is_exactly": '"is exactly"',
    "here_is_the": '"Here is the"',
    "is_the_whole": 'verdict form "X is the whole Y"',
}


def phrases_markdown(before: list[dict[str, object]], after: list[dict[str, object]]) -> str:
    """V3 ledger: book-wide phrase counts before and after, caps, and heavy pages (S5)."""
    lines = [
        "# Signature-phrase ledger (V3)",
        "",
        "Book-wide counts on rendered HTML over every visible text class (prose, captions,",
        "callouts, exercises, sources, plan steps, alt text and tables, headings; replay",
        "panels excluded). Blocking caps fail `audit_voice_ledger.py --check`; the other",
        "phrases are habit words (S5): thin them only where one page carries three or more.",
        "",
        "| phrase | cap | before | now | pages with 3+ now |",
        "|---|---|---:|---:|---|",
    ]
    total_before, total_after = phrase_totals(before), phrase_totals(after)
    for name in PHRASES:
        cap = PHRASE_CAPS.get(name)
        heavy = ", ".join(
            f"{short(str(row['page']))} {row[f'phrase_{name}']}"
            for row in after if int(row[f"phrase_{name}"]) >= 3
        )
        lines.append(
            f"| {PHRASE_LABELS[name]} | {'blocking, ' + str(cap) if cap is not None else 'report only'} | "
            f"{total_before[name]} | {total_after[name]} | {heavy or 'none'} |"
        )
    lines += ["", "## Pages that carry the phrases now", "", "| page | " + " | ".join(PHRASES) + " |",
              "|---|" + "---:|" * len(PHRASES)]
    for row in after:
        values = [int(row[f"phrase_{name}"]) for name in PHRASES]
        if any(values):
            lines.append(f"| {short(str(row['page']))} | " + " | ".join(str(v) for v in values) + " |")
    return "\n".join(lines) + "\n"


# ---------------------------------------------------------------------- diagnostics
def section_counts(html_path: Path, source: str) -> list[tuple[str, str, int, int]]:
    page = extract(html_path, source)
    ordered = [("", "(opener)")] + page.sections
    rows = []
    for section_id, title in ordered:
        blocks = [b for b in page.blocks if b.cls == "A" and b.section == section_id]
        rows.append(
            (
                section_id,
                title,
                sum(len(guard_spans(b.text)) for b in blocks),
                sum(len(CHAPTER_REF_RE.findall(b.text)) for b in blocks),
            )
        )
    return rows


METRIC_PATTERNS = {
    "guards": None,
    "chapter_refs": CHAPTER_REF_RE,
    "reader_address": READER_RE,
    "metaphor_hits": METAPHOR_RE,
    "we": WE_RE,
    "i": I_RE,
    **REGISTER_PATTERNS,
}


def print_hits(html_path: Path, source: str, metric: str, classes: str) -> None:
    page = extract(html_path, source)
    number = 0
    for block in page.blocks:
        if block.cls not in classes:
            continue
        if metric == "verdicts":
            if is_verdict(block):
                number += 1
                print(f"{number:3d} [{block.cls}] after {block.after_event}: {sentences(block.text)[0]}")
            continue
        if metric == "guards":
            spans = guard_spans(block.text)
        else:
            spans = [m.span() for m in METRIC_PATTERNS[metric].finditer(block.text)]
        for start, end in spans:
            number += 1
            context = block.text[max(0, start - 90): end + 60]
            print(f"{number:3d} [{block.cls}] {block.section or '(opener)'}: …{context}…")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--ledger", type=Path, metavar="HTML_ROOT")
    parser.add_argument("--csv", type=Path)
    parser.add_argument("--markdown", type=Path)
    parser.add_argument("--baseline", type=Path, help="ledger CSV that defines the Part I profile")
    parser.add_argument("--delta", nargs=2, type=Path, metavar=("BEFORE", "AFTER"))
    parser.add_argument("--check", type=Path, metavar="HTML_ROOT")
    parser.add_argument("--phrases", nargs=2, type=Path, metavar=("BEFORE_ROOT", "AFTER_ROOT"))
    parser.add_argument("--sections", type=Path, metavar="HTML_PAGE")
    parser.add_argument("--hits", type=Path, metavar="HTML_PAGE")
    parser.add_argument("--metric", default="guards")
    parser.add_argument("--classes", default="A")
    parser.add_argument("--source", help="source path for --sections/--hits (default: inferred)")
    args = parser.parse_args()

    def infer_source(page: Path) -> str:
        if args.source:
            return args.source
        parts = page.resolve().parts
        if "chapters" in parts:
            index = parts.index("chapters")
            return Path(*parts[index:]).with_suffix(".qmd").as_posix()
        return "index.qmd"

    if args.check:
        return run_check(args.check)
    if args.phrases:
        text = phrases_markdown(ledger_rows(args.phrases[0]), ledger_rows(args.phrases[1]))
        if args.markdown:
            args.markdown.write_text(text, encoding="utf-8")
        else:
            print(text)
        return 0
    if args.ledger:
        rows = ledger_rows(args.ledger)
        baseline = read_csv(args.baseline) if args.baseline else rows
        profile = reference_profile(baseline)
        if args.csv:
            write_csv(rows, args.csv)
        if args.markdown:
            args.markdown.write_text(
                "Part I reference profile (per 1,000 words of class A prose): "
                + ", ".join(f"{key} {value}" for key, value in profile.items())
                + "\n\n"
                + ledger_markdown(rows, profile),
                encoding="utf-8",
            )
        print(f"ledger: {len(rows)} pages; Part I profile {profile}")
        return 0
    if args.delta:
        before, after = (read_csv(path) for path in args.delta)
        profile = reference_profile(before)
        text = delta_markdown(before, after, profile)
        if args.markdown:
            header = (
                "# Voice ledger delta\n\n"
                f"`{args.delta[0].name}` to `{args.delta[1].name}`, one row per page, sorted by "
                "distance from the Part I profile after the change. Rates are per 1,000 words "
                "of class A prose; `a → b` marks a change. Part I profile: "
                + ", ".join(f"{key} {value}" for key, value in profile.items())
                + ". Bands: warmth at least 0.6 times the profile, guards at most 1.25 times, "
                "chapter references at most 1.5 times, at most two in the opener and in any "
                "paragraph.\n\n"
            )
            args.markdown.write_text(header + text, encoding="utf-8")
        else:
            print(text)
        return 0
    if args.sections:
        for section_id, title, guards, refs in section_counts(args.sections, infer_source(args.sections)):
            print(f"{section_id or '(opener)'}\t{guards}\t{refs}\t{title}")
        return 0
    if args.hits:
        print_hits(args.hits, infer_source(args.hits), args.metric, args.classes)
        return 0
    parser.print_help()
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
