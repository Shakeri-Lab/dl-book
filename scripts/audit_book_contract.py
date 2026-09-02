#!/usr/bin/env python3
"""Audit book-wide editorial and authoring contracts."""

from __future__ import annotations

from datetime import date
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
CHAPTERS = sorted((ROOT / "chapters").glob("part[1-5]/*.qmd"))
PART_PAGES = {
    "chapters/parts/p1-lines-to-networks.qmd": "From Lines to Networks",
    "chapters/parts/p2-vision.qmd": "Vision: Learning the Filters",
    "chapters/parts/p3-sequences.qmd": "Sequences: Learning the Summary",
    "chapters/parts/p4-attention.qmd": "Attention: Learning the Similarity",
    "chapters/parts/p5-pretrained-era.qmd": (
        "The Pretrained Era: Learning What to Reuse"
    ),
}
LECTURE_MANIFEST = ROOT / "data/lectures.yml"
CHAPTER_TOOLS_FILTER = ROOT / "filters/chapter-tools.lua"
LECTURE_PLAYLIST_LABEL = "Lecture playlist"
EXPECTED_FALLBACK_LECTURE_SOURCES = {
    "index.qmd",
    "chapters/epilogue.qmd",
    "chapters/appendices/a4-notation.qmd",
}
EXPECTED_SPECIFIC_LECTURE_PAGES = 27
EXPECTED_CHAPTER_TOOL_PAGES = 30
EXPECTED_TOP_LEVEL_BOOK_UNITS = [
    "index.qmd",
    "chapters/parts/p1-lines-to-networks.qmd",
    "chapters/interludes/learning-by-experiment.qmd",
    "chapters/parts/p2-vision.qmd",
    "chapters/interludes/making-pca-learnable.qmd",
    "chapters/parts/p3-sequences.qmd",
    "chapters/parts/p4-attention.qmd",
    "chapters/parts/p5-pretrained-era.qmd",
    "chapters/epilogue.qmd",
]
OLD_ROUTE_TARGETS = {
    "chapters/part1/01-linear-regression.qmd",
    "chapters/part2/07-filters-convolution.qmd",
    "chapters/part3/10-sequences-rnn.qmd",
    "chapters/part4/12-kernel-regression.qmd",
    "chapters/part5/17-peft-quantization.qmd",
}
INTERLUDES = {
    "exfig": ROOT / "chapters/interludes/learning-by-experiment.qmd",
    "aefig": ROOT / "chapters/interludes/making-pca-learnable.qmd",
    "ttrfig": ROOT / "chapters/interludes/attention-as-test-time-regression.qmd",
}
EXPECTED_CUSTOM_FLOATS = {"exfig": 2, "aefig": 4, "ttrfig": 2}
EXPERIMENT_INTERLUDE = ROOT / "chapters/interludes/learning-by-experiment.qmd"
EXPECTED_EXPERIMENT_TABLES = 2
EPILOGUE = ROOT / "chapters/epilogue.qmd"
RMSPROP_PROVENANCE = (
    "- Tieleman and Hinton, “Lecture 6.5 — RMSProp,” *COURSERA: Neural Networks for"
)
CANONICAL_EDITION_SENTENCE = (
    "The HTML edition is canonical; the PDF is a derived print conversion."
)
EDITION_STATUS_RE = re.compile(
    r"^dlbook-edition-status:\s*(stable|rolling)\s*$",
    re.MULTILINE,
)
HTML_EDITION_STATUS_RE = re.compile(
    r"^dlbook-html-edition-status:\s*(stable|rolling)\s*$",
    re.MULTILINE,
)
SUPPORT_URL = "https://buymeacoffee.com/hshakeri"
SUPPORT_FREE_CONTRACT = (
    "This book is free to read and download at **$0**, and no contribution unlocks\n"
    "additional content."
)
SUPPORT_INVITATION = (
    "If it has been useful and you would like to help sustain ongoing\n"
    "corrections, new figures, and open releases, you may make an optional contribution\n"
    "here:"
)
COVER_PATH = ROOT / "figures/cover.png"
PDF_ASSET_MATERIALIZER = ROOT / "scripts/materialize_frozen_pdf_assets.py"
PDF_FIXPOINT_RENDERER = ROOT / "scripts/render_pdf_profiles.py"
PUBLISH_WORKFLOW = ROOT / ".github/workflows/publish.yml"
EXECUTION_WORKFLOW = ROOT / ".github/workflows/execute-audit.yml"
DISCLOSURE_SCRIPT = ROOT / "disclosure-interactions.html"
RESPONSIVE_SCRIPT = ROOT / "responsive-figures.html"
BOOK_STYLES = ROOT / "dlbook.scss"
DOWNLOAD_PAGE = ROOT / "download.html"
DOWNLOAD_STYLES = ROOT / "download.css"
NOT_FOUND_PAGE = ROOT / "404.html"
QUARTO_VERSION = "1.10.18"
NOTEBOOK_THREAD_DEFAULTS = (
    "OMP_NUM_THREADS",
    "OPENBLAS_NUM_THREADS",
    "MKL_NUM_THREADS",
    "VECLIB_MAXIMUM_THREADS",
    "NUMEXPR_NUM_THREADS",
)
DOWNLOAD_TOOL_CONFIG = (
    '    tools:\n'
    '      - icon: file-pdf\n'
    '        text: "Get the PDF"\n'
    '        aria-label: "Get the PDF"\n'
    '        href: download.html'
)
DOWNLOAD_RESOURCE_CONFIG = (
    "  resources:\n"
    "    - download.html\n"
    "    - download.css\n"
    "    - figures/cover.png"
)
PRINT_PDF_NAME = "Deep-Learning--Making-It-Learnable.pdf"
CONTINUOUS_PDF_NAME = "Deep-Learning--Making-It-Learnable--Continuous.pdf"
SIDEBAR_COLLAPSE_CONFIG = "    collapse-level: 1"
HTML_SOURCE_TOOL_CONFIG = (
    "    code-tools:\n"
    "      source: repo\n"
    "      toggle: false\n"
    '      caption: "Source"'
)
ABOUT_COLLAPSE_CONTRACT = (
    '::: {.callout-note collapse="true"}\n## About this edition'
)
REVISION_COLLAPSE_CONTRACT = (
    '::: {#revision-notes .callout-note collapse="true"}\n'
    '## Revision notes {.unnumbered}'
)
COFFEE_ICON_CONTRACT = (
    '<span class="bi bi-cup-hot-fill support-project-icon" '
    'aria-hidden="true"></span> Support this open book'
)
PART_III_LEARNABILITY_CALLBACK = (
    "Recurrence asks us to make the carried summary learnable:"
)
CHAPTER_20_TEMPERATURE_CALLBACK = "## What if the temperature were learnable?"
CHAPTER_16_CALIBRATION_EXERCISE = (
    "6. **(Code.)** Freeze one pinned Fashion CNN checkpoint from this chapter"
)
CHAPTER_16_CALIBRATION_BOUNDARY = (
    "This is post-hoc calibration of a frozen model, not\n"
    "   Chapter 20's training-time $\\gamma$."
)
CHAPTER_16_CALIBRATION_POINTER = "@sec-16-vit-scaling, Exercise 6"
CANONICAL_EXERCISE_TAGS = {"Pencil.", "Code.", "Audit."}
EXERCISE_RE = re.compile(r"\*\*\(([^)\n]+)\)\*\*")
EXERCISE_SECTION_RE = re.compile(
    r"^## Exercises[^\n]*\n(.*?)(?=^##\s|\Z)",
    re.MULTILINE | re.DOTALL,
)
NUMBERED_EXERCISE_RE = re.compile(r"^(\d+)\.\s+(.+)$", re.MULTILINE)
HINTON_COURSE_RE = re.compile(
    r"Hinton(?:'s|’s)\s+(?:Coursera\s+)?course|Lecture[- ]?6e|"
    r"Hinton(?:'s|’s)\s+lectures",
    re.IGNORECASE,
)
PUBLIC_RESIDUE_PATTERNS = {
    "reader-inaccessible instructor provenance": re.compile(
        r"\bInstructor\s+(?:coding transcripts?|lecture seeds?|course seeds?|notes?)\b",
        re.IGNORECASE,
    ),
    "off-page live-session reference": re.compile(
        r"\blive sessions?\b",
        re.IGNORECASE,
    ),
    "internal seed-note jargon": re.compile(
        r"\bseed(?:'s|’s)?\s+notes\b|\bthe\s+seed(?:'s|’s)\b",
        re.IGNORECASE,
    ),
    "derivation/follows-suit splice": re.compile(
        r"\bderivation\s+suit\.",
        re.IGNORECASE,
    ),
    "doubled sentence-head splice": re.compile(
        r"\bThe\s+(?:Here is|This)\b",
    ),
}
PYTHON_CELL_RE = re.compile(r"```\{python\}\n(.*?)\n```", re.DOTALL)
FIGURE_LABEL_RE = re.compile(r"^#\| label: fig-[A-Za-z0-9_-]+\s*$", re.MULTILINE)
SUBSTANTIVE_VISIBLE_TOKENS = ("print(", "assert ", "raise ", "def ", "class ")


def expected_chapter_tool_sources() -> set[str]:
    """Return the exact non-Part manuscript units that receive HTML tools."""
    sources = {"index.qmd", "chapters/epilogue.qmd"}
    sources.update(str(path.relative_to(ROOT)) for path in CHAPTERS)
    sources.update(
        str(path.relative_to(ROOT))
        for path in sorted((ROOT / "chapters/interludes").glob("*.qmd"))
    )
    sources.update(
        str(path.relative_to(ROOT))
        for path in sorted((ROOT / "chapters/appendices").glob("*.qmd"))
    )
    return sources


def parse_lecture_manifest(path: Path) -> dict[str, list[dict[str, str]]]:
    """Parse the deliberately small lectures.yml schema with the stdlib only.

    Keeping this parser narrow turns accidental extra keys or indentation changes
    into visible contract failures instead of silently accepting an unrendered field.
    """
    if not path.is_file():
        raise ValueError(f"{path.relative_to(ROOT)} is missing")

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
                    f"line {line_number}: previous lecture entry is missing url"
                )
            current_source = json.loads(source_match.group(1))
            if current_source in manifest:
                raise ValueError(
                    f"line {line_number}: duplicate source {current_source!r}"
                )
            manifest[current_source] = []
            continue
        label_match = label_re.fullmatch(raw_line)
        if label_match and current_source is not None and pending_label is None:
            pending_label = json.loads(label_match.group(1))
            continue
        url_match = url_re.fullmatch(raw_line)
        if url_match and current_source is not None and pending_label is not None:
            manifest[current_source].append(
                {"label": pending_label, "url": json.loads(url_match.group(1))}
            )
            pending_label = None
            continue
        raise ValueError(
            f"line {line_number}: expected a quoted source, label, or url in "
            "the lectures schema"
        )

    if not saw_root:
        raise ValueError("top-level 'lectures' map is missing")
    if pending_label is not None:
        raise ValueError("final lecture entry is missing url")
    return manifest


def without_html_comments(text: str) -> str:
    return re.sub(r"<!--.*?-->", "", text, flags=re.DOTALL)


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def workflow_job(text: str, name: str) -> str:
    """Return one top-level GitHub Actions job block from workflow source."""

    match = re.search(
        rf"(?ms)^  {re.escape(name)}:\n.*?(?=^  [A-Za-z0-9_-]+:\n|\Z)",
        text,
    )
    return match.group(0) if match else ""


def main() -> None:
    errors: list[str] = []

    author_review_files = [ROOT / "index.qmd"]
    author_review_files.extend(sorted((ROOT / "chapters").rglob("*.qmd")))
    author_review_files.extend(sorted((ROOT / "_freeze").rglob("*.json")))
    for path in author_review_files:
        if path.is_file() and "AUTHOR REVIEW" in path.read_text():
            fail(
                errors,
                f"{path.relative_to(ROOT)}: accepted AUTHOR REVIEW marker remains",
            )
    if len(CHAPTERS) != 20:
        fail(errors, f"expected 20 numbered chapters, found {len(CHAPTERS)}")

    expected_lecture_sources = expected_chapter_tool_sources()
    if len(expected_lecture_sources) != EXPECTED_CHAPTER_TOOL_PAGES:
        fail(
            errors,
            "chapter-tools source inventory: expected "
            f"{EXPECTED_CHAPTER_TOOL_PAGES} non-Part pages, found "
            f"{len(expected_lecture_sources)}",
        )
    try:
        lecture_manifest = parse_lecture_manifest(LECTURE_MANIFEST)
    except (ValueError, json.JSONDecodeError) as error:
        fail(errors, f"data/lectures.yml: {error}")
        lecture_manifest = {}

    manifest_sources = set(lecture_manifest)
    if manifest_sources != expected_lecture_sources:
        missing = sorted(expected_lecture_sources - manifest_sources)
        unexpected = sorted(manifest_sources - expected_lecture_sources)
        fail(
            errors,
            "data/lectures.yml: source inventory differs; "
            f"missing {missing}, unexpected {unexpected}",
        )
    included_part_sources = sorted(manifest_sources.intersection(PART_PAGES))
    if included_part_sources:
        fail(
            errors,
            "data/lectures.yml: Part transition pages must remain quiet: "
            + ", ".join(included_part_sources),
        )

    fallback_sources: set[str] = set()
    specific_sources: set[str] = set()
    for source, entries in lecture_manifest.items():
        if not entries:
            fail(errors, f"data/lectures.yml: {source} has no lecture resources")
            continue
        seen_resources: set[tuple[str, str]] = set()
        for index, entry in enumerate(entries, start=1):
            label = entry.get("label", "")
            url = entry.get("url", "")
            if not label or label != label.strip():
                fail(
                    errors,
                    f"data/lectures.yml: {source} entry {index} has an empty or "
                    "space-padded label",
                )
            parsed_url = urlsplit(url)
            if (
                not url
                or url != url.strip()
                or parsed_url.scheme != "https"
                or not parsed_url.netloc
            ):
                fail(
                    errors,
                    f"data/lectures.yml: {source} entry {index} must use a "
                    "nonempty HTTPS URL",
                )
            resource = (label, url)
            if resource in seen_resources:
                fail(
                    errors,
                    f"data/lectures.yml: {source} repeats resource {label!r}",
                )
            seen_resources.add(resource)

        playlist_entries = [
            entry for entry in entries if entry.get("label") == LECTURE_PLAYLIST_LABEL
        ]
        if playlist_entries:
            fallback_sources.add(source)
            if len(entries) != 1:
                fail(
                    errors,
                    f"data/lectures.yml: {source} mixes the playlist fallback "
                    "with specific resources",
                )
        else:
            specific_sources.add(source)

    if fallback_sources != EXPECTED_FALLBACK_LECTURE_SOURCES:
        fail(
            errors,
            "data/lectures.yml: expected playlist-only fallbacks for "
            f"{sorted(EXPECTED_FALLBACK_LECTURE_SOURCES)}, found "
            f"{sorted(fallback_sources)}",
        )
    if len(specific_sources) != EXPECTED_SPECIFIC_LECTURE_PAGES:
        fail(
            errors,
            "data/lectures.yml: expected "
            f"{EXPECTED_SPECIFIC_LECTURE_PAGES} pages with specific lecture "
            f"resources, found {len(specific_sources)}",
        )
    if not CHAPTER_TOOLS_FILTER.is_file():
        fail(errors, "filters/chapter-tools.lua: HTML chapter-tools filter is missing")

    part_paths = {ROOT / relative for relative in PART_PAGES}
    if part_paths.intersection(CHAPTERS):
        fail(errors, "part transition pages must remain outside the numbered chapters")
    for relative, title in PART_PAGES.items():
        path = ROOT / relative
        if not path.is_file():
            fail(errors, f"{relative}: part transition page is missing")
            continue
        text = path.read_text()
        headings = re.findall(r"^(#+)\s+(.+)$", text, re.MULTILINE)
        if headings != [("#", title)]:
            fail(errors, f"{relative}: expected one level-1 title {title!r}")
        body = re.sub(r"^#\s+.+$", "", text, count=1, flags=re.MULTILINE).strip()
        sentence_count = len(re.findall(r"[.!?](?=\s|$)", body))
        if not 4 <= sentence_count <= 6:
            fail(
                errors,
                f"{relative}: expected 4–6 transition sentences, found "
                f"{sentence_count}",
            )
        if "learnable" not in body.casefold():
            fail(errors, f"{relative}: part page must name its learnable move")
        if any(token in body for token in ("```", "![", "#|", "|---")):
            fail(errors, f"{relative}: part page must contain prose only")

    for path in CHAPTERS:
        text = path.read_text()
        if text.count("## Check yourself") != 1:
            fail(errors, f"{path.relative_to(ROOT)}: expected one Check yourself")
        if text.count("## Sources and further reading") != 1:
            fail(errors, f"{path.relative_to(ROOT)}: expected one Sources section")
        headings = re.findall(r"^##\s+(.+)$", text, re.MULTILINE)
        check_index = next(
            (index for index, heading in enumerate(headings) if heading == "Check yourself"),
            None,
        )
        if (
            check_index is not None
            and (
                check_index + 1 == len(headings)
                or not headings[check_index + 1].startswith("Okay, so")
            )
        ):
            fail(
                errors,
                f"{path.relative_to(ROOT)}: Check yourself must immediately precede recap",
            )

    for path in sorted((ROOT / "chapters").rglob("*.qmd")):
        text = path.read_text()
        for tag in EXERCISE_RE.findall(text):
            if tag not in CANONICAL_EXERCISE_TAGS:
                fail(
                    errors,
                    f"{path.relative_to(ROOT)}: noncanonical exercise tag ({tag})",
                )
        for section in EXERCISE_SECTION_RE.findall(text):
            for number, opening in NUMBERED_EXERCISE_RE.findall(section):
                if not EXERCISE_RE.match(opening):
                    fail(
                        errors,
                        f"{path.relative_to(ROOT)}: exercise {number} must begin "
                        "with a canonical tag",
                    )

        visible = without_html_comments(text)
        for match in re.finditer(r"\blectures?\b", visible, re.IGNORECASE):
            line = visible.count("\n", 0, match.start()) + 1
            line_text = visible.splitlines()[line - 1]
            allowed = (
                path.name == "04-training-loss-sgd.qmd"
                and line_text.startswith(RMSPROP_PROVENANCE)
            )
            if not allowed:
                fail(
                    errors,
                    f"{path.relative_to(ROOT)}:{line}: public off-page lecture reference",
                )
        for match in re.finditer(r"(?:sources/)?[\w./-]+\.tex\b", visible):
            line = visible.count("\n", 0, match.start()) + 1
            fail(
                errors,
                f"{path.relative_to(ROOT)}:{line}: public internal TeX source path",
            )
        for description, pattern in PUBLIC_RESIDUE_PATTERNS.items():
            for match in pattern.finditer(visible):
                line = visible.count("\n", 0, match.start()) + 1
                fail(
                    errors,
                    f"{path.relative_to(ROOT)}:{line}: {description}",
                )

        for cell in PYTHON_CELL_RE.findall(text):
            is_figure = FIGURE_LABEL_RE.search(cell)
            is_hidden = re.search(r"^#\| echo: false\s*$", cell, re.MULTILINE)
            has_substantive_evidence = any(
                token in cell for token in SUBSTANTIVE_VISIBLE_TOKENS
            )
            if is_figure and not is_hidden and not has_substantive_evidence:
                label = FIGURE_LABEL_RE.search(cell).group(0).split(":", 1)[1].strip()
                fail(
                    errors,
                    f"{path.relative_to(ROOT)}: display-only figure cell {label} "
                    "must use an executed echo:false harness",
                )

    authored_files = [
        ROOT / "index.qmd",
        ROOT / "README.md",
        ROOT / "CHANGELOG.md",
        *sorted((ROOT / "chapters").rglob("*.qmd")),
        *sorted((ROOT / "docs").glob("*.md")),
    ]
    for path in authored_files:
        if HINTON_COURSE_RE.search(path.read_text()):
            fail(errors, f"{path.relative_to(ROOT)}: Hinton course reference remains")

    for key, path in INTERLUDES.items():
        text = path.read_text()
        if not text.startswith("# Interlude:"):
            fail(errors, f"{path.relative_to(ROOT)}: title must begin 'Interlude:'")
        if text.count("## Check yourself") != 1:
            fail(errors, f"{path.relative_to(ROOT)}: expected one Check yourself")
        if "Numbering note" in text:
            fail(errors, f"{path.relative_to(ROOT)}: obsolete numbering note")
        if "{#eq-" in text:
            fail(errors, f"{path.relative_to(ROOT)}: interlude equation is numbered")
        count = len(re.findall(rf"#({key})-[A-Za-z0-9_-]+", text))
        if count != EXPECTED_CUSTOM_FLOATS[key]:
            fail(
                errors,
                f"{path.relative_to(ROOT)}: expected {EXPECTED_CUSTOM_FLOATS[key]} "
                f"{key} floats, found {count}",
            )

    experiment_text = EXPERIMENT_INTERLUDE.read_text()
    experiment_tables = len(
        re.findall(r"#extbl-[A-Za-z0-9_-]+", experiment_text)
    )
    if experiment_tables != EXPECTED_EXPERIMENT_TABLES:
        fail(
            errors,
            f"{EXPERIMENT_INTERLUDE.relative_to(ROOT)}: expected "
            f"{EXPECTED_EXPERIMENT_TABLES} extbl floats, found {experiment_tables}",
        )
    if re.search(r"(?:@|#)tbl-(?:experiment-claim-types|batchnorm-study-contract)", experiment_text):
        fail(
            errors,
            f"{EXPERIMENT_INTERLUDE.relative_to(ROOT)}: global interlude table label remains",
        )

    epilogue_text = EPILOGUE.read_text()
    if "Numbering note" in epilogue_text:
        fail(errors, f"{EPILOGUE.relative_to(ROOT)}: obsolete numbering note")
    if "{#eq-" in epilogue_text:
        fail(errors, f"{EPILOGUE.relative_to(ROOT)}: epilogue equation is numbered")
    if epilogue_text.count("## Sources and further reading") != 1:
        fail(errors, f"{EPILOGUE.relative_to(ROOT)}: expected one Sources section")
    epilogue_figures = len(re.findall(r"#epfig-[A-Za-z0-9_-]+", epilogue_text))
    if epilogue_figures != 2:
        fail(
            errors,
            f"{EPILOGUE.relative_to(ROOT)}: expected 2 epfig floats, "
            f"found {epilogue_figures}",
        )

    index_text = (ROOT / "index.qmd").read_text()
    edition_status_match = EDITION_STATUS_RE.search(index_text)
    html_edition_status_match = HTML_EDITION_STATUS_RE.search(index_text)
    if edition_status_match is None:
        fail(errors, "index.qmd: PDF stable/rolling edition status is missing")
    if html_edition_status_match is None:
        fail(errors, "index.qmd: HTML stable/rolling edition status is missing")
    if (
        edition_status_match is not None
        and html_edition_status_match is not None
        and edition_status_match.group(1) == "rolling"
        and html_edition_status_match.group(1) == "stable"
    ):
        fail(
            errors,
            "index.qmd: canonical HTML cannot be stable while its derived PDF is rolling",
        )
    if index_text.count(CANONICAL_EDITION_SENTENCE) != 1:
        fail(errors, "index.qmd: canonical HTML/PDF sentence must appear exactly once")
    if index_text.count(SUPPORT_URL) != 1:
        fail(errors, "index.qmd: optional support URL must appear exactly once")
    if index_text.count(SUPPORT_FREE_CONTRACT) != 1:
        fail(errors, "index.qmd: the $0/no-gated-content support contract is missing")
    if index_text.count(SUPPORT_INVITATION) != 1:
        fail(errors, "index.qmd: the amount-free optional-support invitation is missing")
    if index_text.count(ABOUT_COLLAPSE_CONTRACT) != 1:
        fail(errors, "index.qmd: About this edition must default closed in HTML")
    if index_text.count(REVISION_COLLAPSE_CONTRACT) != 1:
        fail(errors, "index.qmd: Revision notes must default closed in HTML")
    if index_text.count(COFFEE_ICON_CONTRACT) != 1:
        fail(errors, "index.qmd: the decorative support coffee icon is missing")
    for contract in (
        "This book is complete on its own terms.",
        "### Why this book {.unnumbered}",
        "### The route at a glance {.unnumbered}",
        "The failure that opens the next part",
    ):
        if index_text.count(contract) != 1:
            fail(errors, f"index.qmd: Phase B front-door contract missing: {contract}")
    if not COVER_PATH.is_file():
        fail(errors, "figures/cover.png: PDF cover asset is missing")
    if not PDF_ASSET_MATERIALIZER.is_file():
        fail(errors, "scripts/materialize_frozen_pdf_assets.py: helper is missing")
    if not PDF_FIXPOINT_RENDERER.is_file():
        fail(errors, "scripts/render_pdf_profiles.py: fixpoint helper is missing")
    workflow_text = PUBLISH_WORKFLOW.read_text()
    execution_workflow_text = EXECUTION_WORKFLOW.read_text()
    quarto_text = (ROOT / "_quarto.yml").read_text()
    chapter_block_match = re.search(
        r"^  chapters:\n(?P<body>.*?)^  appendices:\n",
        quarto_text,
        re.MULTILINE | re.DOTALL,
    )
    if chapter_block_match is None:
        fail(errors, "_quarto.yml: could not read the book chapter structure")
    else:
        chapter_block = chapter_block_match.group("body")
        top_level_units = [
            match.group(1).strip()
            for match in re.finditer(
                r"^ {4}- (?:part:\s+)?([^\n]+)$",
                chapter_block,
                re.MULTILINE,
            )
        ]
        if top_level_units != EXPECTED_TOP_LEVEL_BOOK_UNITS:
            fail(
                errors,
                "_quarto.yml: part pages or interludes are out of reading order",
            )
        for relative in PART_PAGES:
            if chapter_block.count(f"- part: {relative}") != 1:
                fail(
                    errors,
                    f"_quarto.yml: {relative} must configure exactly one file-backed part",
                )
        part4_start = chapter_block.find(
            "- part: chapters/parts/p4-attention.qmd"
        )
        part5_start = chapter_block.find(
            "- part: chapters/parts/p5-pretrained-era.qmd"
        )
        part4_block = chapter_block[part4_start:part5_start]
        if part4_block.count(
            "chapters/interludes/attention-as-test-time-regression.qmd"
        ) != 1:
            fail(errors, "_quarto.yml: test-time-regression interlude left Part IV")

    route_match = re.search(
        r"^### The route at a glance[^\n]*\n(?P<body>.*?)"
        r"^### Course route and dependencies",
        index_text,
        re.MULTILINE | re.DOTALL,
    )
    if route_match is None:
        fail(errors, "index.qmd: could not read the five-part route table")
    else:
        route_table = route_match.group("body")
        for relative, title in PART_PAGES.items():
            if route_table.count(f"]({relative})") != 1 or title not in route_table:
                fail(
                    errors,
                    f"index.qmd: route table must link once to {relative} with "
                    f"the synchronized title",
                )
        for target in OLD_ROUTE_TARGETS:
            if target in route_table:
                fail(
                    errors,
                    f"index.qmd: route table still bypasses its part page: {target}",
                )
    if "downloads: [pdf]" in quarto_text:
        fail(errors, "_quarto.yml: direct native PDF action bypasses the landing page")
    if quarto_text.count(DOWNLOAD_TOOL_CONFIG) != 1:
        fail(errors, "_quarto.yml: cover-led PDF landing-page action is missing")
    if quarto_text.count(DOWNLOAD_RESOURCE_CONFIG) != 1:
        fail(errors, "_quarto.yml: download-page resources are missing or duplicated")
    if quarto_text.count(SIDEBAR_COLLAPSE_CONFIG) != 1:
        fail(errors, "_quarto.yml: root chapter groups must default closed")
    if quarto_text.count(HTML_SOURCE_TOOL_CONFIG) != 1:
        fail(
            errors,
            "_quarto.yml: HTML source tool must use the repository, carry the "
            "Source caption, and disable the global code toggle",
        )
    if quarto_text.count("  - filters/chapter-tools.lua") != 1:
        fail(
            errors,
            "_quarto.yml: HTML chapter-tools filter must be configured exactly once",
        )
    if quarto_text.count("      - disclosure-interactions.html") != 1:
        fail(errors, "_quarto.yml: disclosure interaction include is missing")
    if not DISCLOSURE_SCRIPT.is_file():
        fail(errors, "disclosure-interactions.html: accessibility helper is missing")
    else:
        disclosure_text = DISCLOSURE_SCRIPT.read_text()
        for required in (
            'header.setAttribute("role", "button")',
            'header.setAttribute("tabindex", "0")',
            'header.setAttribute("aria-label", label)',
            'header.querySelector(":scope > .callout-title-container")',
            'copy.querySelectorAll(".screen-reader-only")',
            'event.key !== "Enter" && event.key !== " "',
            '"#quarto-sidebar .sidebar-item-section > .sidebar-item-container > "',
            'document.querySelectorAll(sidebarToggleSelector)',
            'document.querySelectorAll(sidebarChevronSelector)',
            'chevron.setAttribute("role", "button")',
            '`Toggle chapters in ${title}`',
            'chevron.setAttribute("aria-hidden", "true")',
            'chevron.setAttribute("tabindex", "-1")',
            'window.addEventListener("hashchange", revealHashTarget)',
        ):
            if required not in disclosure_text:
                fail(
                    errors,
                    "disclosure-interactions.html: keyboard/hash contract is incomplete",
                )
                break
    if not RESPONSIVE_SCRIPT.is_file():
        fail(errors, "responsive-figures.html: responsive helper is missing")
    else:
        responsive_text = RESPONSIVE_SCRIPT.read_text()
        for required in (
            '#the-route-at-a-glance > table',
            'responsive-route-table-frame',
            'Five-part route table. Scroll horizontally to inspect.',
        ):
            if required not in responsive_text:
                fail(
                    errors,
                    "responsive-figures.html: front-door route-table contract is "
                    "incomplete",
                )
                break
    if "responsive-route-table-frame" not in BOOK_STYLES.read_text():
        fail(errors, "dlbook.scss: responsive front-door route style is missing")
    if not DOWNLOAD_PAGE.is_file():
        fail(errors, "download.html: cover-led PDF landing page is missing")
    else:
        download_text = DOWNLOAD_PAGE.read_text()
        for required in (
            'src="figures/cover.png"',
            'alt="Cover of Deep Learning: Making It Learnable by Heman Shakeri"',
            PRINT_PDF_NAME,
            CONTINUOUS_PDF_NAME,
            SUPPORT_URL,
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
            if required not in download_text:
                fail(errors, f"download.html: required contract is missing: {required}")
        if not re.search(
            rf'<a class="price-support-link"\s+'
            rf'href="{re.escape(SUPPORT_URL)}">\$20</a>',
            download_text,
        ):
            fail(errors, "download.html: suggested $20 must link to the support page")
        for removed in (
            "Choose your PDF",
            "Choose an optional contribution",
            'name="contribution"',
        ):
            if removed in download_text:
                fail(errors, f"download.html: redundant picker copy remains: {removed}")
        if 'target="_blank"' in download_text:
            fail(errors, "download.html: support link must not open an unannounced new tab")
    if not DOWNLOAD_STYLES.is_file():
        fail(errors, "download.css: PDF landing-page styles are missing")
    elif ".contribution-picker" in DOWNLOAD_STYLES.read_text():
        fail(errors, "download.css: removed contribution-picker styles remain")
    if not NOT_FOUND_PAGE.is_file():
        fail(errors, "404.html: branded not-found page is missing")
    else:
        not_found_text = NOT_FOUND_PAGE.read_text()
        skip_link = (
            '<a class="visually-hidden-focusable" '
            'href="#quarto-document-content">Skip to main content</a>'
        )
        if not_found_text.count(skip_link) != 1:
            fail(errors, "404.html: expected one first-focusable skip link")
        if '<main id="quarto-document-content">' not in not_found_text:
            fail(errors, "404.html: skip-link target is missing")
    fixpoint_call = "python scripts/render_pdf_profiles.py"
    if workflow_text.count(fixpoint_call) != 1:
        fail(errors, "publish workflow must use the bounded PDF outline fixpoint")
    quarto_pin = f'version: "{QUARTO_VERSION}"'
    quarto_jobs = ("export_notebooks", "validate_notebooks", "build-deploy")
    if workflow_text.count(quarto_pin) != len(quarto_jobs) or any(
        workflow_job(workflow_text, job).count(quarto_pin) != 1
        for job in quarto_jobs
    ):
        fail(
            errors,
            "publish workflow must pin the validated Quarto "
            f"{QUARTO_VERSION} once in export, validation, and publication",
        )
    if execution_workflow_text.count(quarto_pin) != 1:
        fail(
            errors,
            f"execution audit must pin the validated Quarto {QUARTO_VERSION}",
        )
    validation_job = workflow_job(workflow_text, "validate_notebooks")
    a1_thread_block = (
        "            notebook_thread_env=()\n"
        + '            if [[ "$notebook_slug" == "a1-linear-algebra" ]]; then\n'
        "              notebook_thread_env=(\n"
        + "".join(
            f"                {variable}=1\n"
            for variable in NOTEBOOK_THREAD_DEFAULTS
        )
        + "              )\n"
        + "              printf 'notebook=%s numerical_thread_env=%s\\n' \\\n"
        + '                "$notebook_slug" "${notebook_thread_env[*]}" \\\n'
        + "                >> build/notebooks/evidence/environment.txt\n"
        + "            fi\n"
    )
    for required in (
        a1_thread_block,
        'if ! env "${notebook_thread_env[@]}" \\',
        '"torch_num_interop_threads": torch.get_num_interop_threads()',
    ):
        if required not in validation_job:
            fail(
                errors,
                "publish workflow does not scope and record the complete A1 "
                "one-thread numerical-library override",
            )
            break
    for variable in NOTEBOOK_THREAD_DEFAULTS:
        if workflow_text.count(variable) != 1:
            fail(
                errors,
                f"publish workflow must scope {variable} to A1 exactly once",
            )
        if variable in execution_workflow_text:
            fail(
                errors,
                f"execution audit must not globally pin {variable}",
            )
    html_only_flag = "--allow-missing-generated-pdfs"
    notebook_html_only_flag = "--allow-missing-generated-notebooks"
    if execution_workflow_text.count(html_only_flag) != 1:
        fail(
            errors,
            "execution audit must declare its HTML-only generated-PDF exemption",
        )
    if html_only_flag in workflow_text:
        fail(
            errors,
            "publish workflow must require both generated PDF download targets",
        )
    if execution_workflow_text.count(notebook_html_only_flag) != 1:
        fail(
            errors,
            "execution audit must declare its HTML-only generated-notebook exemption",
        )
    if notebook_html_only_flag in workflow_text:
        fail(
            errors,
            "publish workflow must require all generated notebook download targets",
        )
    for required in (
        "pull_request:",
        "python scripts/export_notebooks.py",
        "python scripts/audit_notebook_exports.py",
        "validated-notebooks-",
        "_book/notebooks",
        "github.event_name != 'pull_request'",
    ):
        if required not in workflow_text:
            fail(errors, f"publish workflow is missing notebook contract {required!r}")
    if PDF_FIXPOINT_RENDERER.is_file():
        renderer_text = PDF_FIXPOINT_RENDERER.read_text()
        for required in (
            "scripts/materialize_frozen_pdf_assets.py",
            '"--outline-only"',
            "max_attempts",
            "previous_signature",
            "st_mtime_ns",
            "toc_checksum",
            '"print"',
            '"continuous"',
        ):
            if required not in renderer_text:
                fail(
                    errors,
                    f"scripts/render_pdf_profiles.py: missing contract {required}",
                )
    if workflow_text.count("render: false") != 1:
        fail(errors, "publish workflow must deploy the audited bundle without re-rendering")
    if "chapters/ index.qmd download.html README.md" not in workflow_text:
        fail(errors, "publish workflow must include download.html in external-link checks")
    tex_macros = (ROOT / "tex/macros.tex").read_text()
    if tex_macros.count("\\extratitle{") != 1:
        fail(errors, "tex/macros.tex: KOMA PDF cover hook is missing or duplicated")
    if tex_macros.count("figures/cover.png") != 1:
        fail(errors, "tex/macros.tex: PDF cover asset reference must appear once")
    date_match = re.search(
        r'^\s{2}date:\s*["\']?([0-9]{4}-[0-9]{2}-[0-9]{2})["\']?\s*$',
        quarto_text,
        re.MULTILINE,
    )
    if date_match is None:
        fail(errors, "_quarto.yml: deterministic content-revision date is missing")
    else:
        content_date = date.fromisoformat(date_match.group(1))
        display_date = (
            f"{content_date.strftime('%B')} {content_date.day}, {content_date.year}"
        )
        version_match = re.search(
            r"^\s{2}version:\s*[\"']?([^\s\"']+)[\"']?\s*$",
            index_text,
            re.MULTILINE,
        )
        compact_macros = " ".join(tex_macros.split())
        if edition_status_match is None or version_match is None:
            pass
        elif edition_status_match.group(1) == "stable":
            expected_date = (
                f"Version {version_match.group(1)} "
                f"\\textperiodcentered{{}} {display_date}"
            )
            if expected_date not in compact_macros:
                fail(
                    errors,
                    "tex/macros.tex: stable PDF edition/date is out of sync with "
                    "index.qmd and _quarto.yml",
                )
        elif f"content updated {display_date}" not in compact_macros:
            fail(
                errors,
                "tex/macros.tex: PDF content-revision date is out of sync with "
                "_quarto.yml",
            )
    chapter4_text = (ROOT / "chapters/part1/04-training-loss-sgd.qmd").read_text()
    if chapter4_text.count(RMSPROP_PROVENANCE) != 1:
        fail(errors, "Chapter 4: RMSProp provenance must appear exactly once")
    chapter10_text = (ROOT / "chapters/part3/10-sequences-rnn.qmd").read_text()
    if chapter10_text.count(PART_III_LEARNABILITY_CALLBACK) != 1:
        fail(errors, "Chapter 10: Part III learnability callback must appear exactly once")
    chapter20_text = (ROOT / "chapters/part5/20-multimodal.qmd").read_text()
    if chapter20_text.count(CHAPTER_20_TEMPERATURE_CALLBACK) != 1:
        fail(errors, "Chapter 20: learnable-temperature callback must appear exactly once")
    chapter16_text = (ROOT / "chapters/part4/16-vit-scaling.qmd").read_text()
    if chapter16_text.count(CHAPTER_16_CALIBRATION_EXERCISE) != 1:
        fail(errors, "Chapter 16: post-hoc calibration must remain Exercise 6")
    if chapter16_text.count(CHAPTER_16_CALIBRATION_BOUNDARY) != 1:
        fail(errors, "Chapter 16: training-time/post-hoc temperature boundary is missing")
    if chapter20_text.count(CHAPTER_16_CALIBRATION_POINTER) != 2:
        fail(errors, "Chapter 20: Exercise 6 calibration pointers are stale or missing")

    all_qmd = "\n".join(
        path.read_text() for path in sorted((ROOT / "chapters").rglob("*.qmd"))
    )
    if "sec-14-memory-spectrum" in all_qmd:
        fail(errors, "obsolete Chapter 14 memory-spectrum anchor remains")

    if errors:
        print("\n".join(errors), file=sys.stderr)
        print(f"FAILED: {len(errors)} book-contract violation(s)", file=sys.stderr)
        raise SystemExit(1)
    print(
        "PASS: 20 chapter retrieval/source contracts, canonical exercise tags, "
        "book voice and splice hygiene, five prose-only part transitions, hidden "
        "display-only figures, interlude "
        "figure/table namespaces, the epilogue namespace and source contract, the Part III "
        "learnability callback, the complete temperature arc, and canonical-edition "
        "metadata, cover, free-PDF landing, optional-support, and collapsed-disclosure "
        "contracts; 30 non-Part HTML tool manifests (27 specific, 3 playlist-only)"
    )


if __name__ == "__main__":
    main()
