#!/usr/bin/env python3
"""Invariants I1 to I16 for a prose-only voice revision (VOICE.md, brief section 9).

Source-level invariants compare each manuscript file in the working tree with the
same file at a baseline Git revision. Rendered invariants compare two HTML renders.
Nothing here edits a file; every result is printed as a checklist row.

    python scripts/audit_voice_invariants.py --base 86ec60b \\
        [--files chapters/part1/01-linear-regression.qmd ...] \\
        [--html-before DIR --html-after DIR] \\
        [--notebooks-before DIR --notebooks-after DIR] \\
        [--exceptions audits/voice/invariant_exceptions.json]

Interpretations recorded in audits/voice/invariants.md:
  I1 masks `#| fig-cap`, `#| tbl-cap`, `#| fig-alt`, and `#| fig-subcap` option lines,
     because the brief treats captions (class B) and alt text (class H) as text even
     when Quarto stores them inside a code cell; those lines are checked by I8 and the
     receipts instead.
  I4 ignores numerals that belong to a cross-reference ("Chapter 11", "Figure 13.2"):
     S2 is required to rewrite some chapter mentions, and I6 protects the link targets.
"""

from __future__ import annotations

import argparse
import collections
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import audit_voice_ledger as ledger  # noqa: E402

FENCE_RE = re.compile(r"^(\s*)(`{3,}|~{3,})(.*)$")
COMMENT_RE = re.compile(r"<!--.*?-->", re.S)
DISPLAY_MATH_RE = re.compile(r"\$\$.*?\$\$", re.S)
INLINE_MATH_RE = re.compile(r"(?<![\\$])\$(?=\S)(?:\\\$|[^$\n])+?(?<=\S)\$(?!\d)")
HEADING_RE = re.compile(r"^(#{1,6})\s+(.*?)\s*$")
ANCHOR_RE = re.compile(r"\{#([A-Za-z][A-Za-z0-9_:-]*)")
LABEL_RE = re.compile(r"^\s*#\|\s*label:\s*(\S+)\s*$", re.M)
CAPTION_OPTION_RE = re.compile(r"^\s*#\|\s*(fig-cap|tbl-cap|fig-subcap|fig-alt)\s*:", re.M)
LINK_TARGET_RE = re.compile(r"\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)")
XREF_RE = re.compile(r"@((?:sec|fig|eq|tbl|exr|exfig|aefig|ttrfig|epfig|extbl|lst)-[A-Za-z0-9_-]+)")
URL_RE = re.compile(r"https?://[^\s)>\]\"']+")
NUMBER_RE = re.compile(r"\d[\d,]*\.?\d*%?")
CROSS_REF_PHRASE_RE = re.compile(
    r"\b(?:Chapters?|Sections?|Figures?|Tables?|Equations?|Exercises?|Listings?|Parts?|"
    r"Appendix|Appendices)\s+\d+(?:\.\d+)*(?:\s*(?:,|and|to|or|&)\s*\d+(?:\.\d+)*)*"
)
TRAINABLE_RE = re.compile(r"https://shakeri-lab\.github\.io/opt-book/[^\s)>\]\"']*|Making It Trainable")
EM_DASH = "\u2014"


# ------------------------------------------------------------------------- sources
def git_show(revision: str, path: str) -> str | None:
    result = subprocess.run(
        ["git", "show", f"{revision}:{path}"], cwd=ROOT, capture_output=True, text=True
    )
    return result.stdout if result.returncode == 0 else None


def manuscript_files() -> list[str]:
    return ledger.book_sources()


def split_front_matter(text: str) -> tuple[str, str]:
    if text.startswith("---\n"):
        end = text.find("\n---\n", 4)
        if end != -1:
            return text[: end + 5], text[end + 5:]
    return "", text


def segment(text: str) -> tuple[list[str], str]:
    """Return (fenced code blocks, text with each block replaced by a blank line)."""
    blocks: list[str] = []
    prose: list[str] = []
    lines = text.split("\n")
    index = 0
    while index < len(lines):
        match = FENCE_RE.match(lines[index])
        if match:
            fence = match.group(2)
            closer = re.compile(rf"^\s*{re.escape(fence[0])}{{{len(fence)},}}\s*$")
            block = [lines[index]]
            index += 1
            while index < len(lines) and not closer.match(lines[index]):
                block.append(lines[index])
                index += 1
            if index < len(lines):
                block.append(lines[index])
            blocks.append("\n".join(block))
            prose.append("")
            index += 1
            continue
        prose.append(lines[index])
        index += 1
    return blocks, "\n".join(prose)


def mask_caption_options(block: str) -> str:
    """Blank caption and alt-text option lines (and their YAML continuations)."""
    out = []
    masking = False
    for line in block.split("\n"):
        if CAPTION_OPTION_RE.match(line):
            out.append("#| <caption-or-alt option>")
            masking = True
            continue
        if masking and re.match(r"^\s*#\|\s{2,}\S", line):
            continue
        masking = False
        out.append(line)
    return "\n".join(out)


def caption_options(block: str) -> list[tuple[str, str]]:
    options = []
    lines = block.split("\n")
    for index, line in enumerate(lines):
        match = CAPTION_OPTION_RE.match(line)
        if match:
            value = line.split(":", 1)[1].strip()
            follow = index + 1
            while follow < len(lines) and re.match(r"^\s*#\|\s{2,}\S", lines[follow]):
                value += " " + lines[follow].split("#|", 1)[1].strip()
                follow += 1
            options.append((match.group(1), value))
    return options


def without_comments(text: str) -> str:
    return COMMENT_RE.sub("", text)


def math_multiset(prose: str) -> collections.Counter:
    text = without_comments(prose)
    displays = DISPLAY_MATH_RE.findall(text)
    rest = DISPLAY_MATH_RE.sub(" ", text)
    inlines = INLINE_MATH_RE.findall(rest)
    return collections.Counter(displays + inlines)


def fenced_div(prose: str, class_name: str) -> list[str]:
    """Return the bodies of every `::: {.class_name}` div (outermost only)."""
    bodies = []
    lines = prose.split("\n")
    index = 0
    opener = re.compile(rf"^(:{{3,}})\s*\{{[^}}]*\.{re.escape(class_name)}\b[^}}]*\}}\s*$")
    while index < len(lines):
        match = opener.match(lines[index])
        if not match:
            index += 1
            continue
        depth = 0
        body = []
        index += 1
        while index < len(lines):
            line = lines[index]
            if re.match(r"^:{3,}\s*\{", line) or re.match(r"^:{3,}\s+\S", line):
                depth += 1
            elif re.match(r"^:{3,}\s*$", line):
                if depth == 0:
                    break
                depth -= 1
            body.append(line)
            index += 1
        bodies.append("\n".join(body))
        index += 1
    return bodies


def headings(prose: str) -> list[tuple[int, str]]:
    found = []
    for line in without_comments(prose).split("\n"):
        match = HEADING_RE.match(line)
        if match:
            found.append((len(match.group(1)), match.group(2)))
    return found


def level2_section(prose: str, title: str) -> str:
    match = re.search(
        rf"^## {re.escape(title)}[^\n]*\n(.*?)(?=^## |\Z)", prose, re.M | re.S
    )
    return match.group(1) if match else ""


def anchors(text: str) -> set[str]:
    return set(ANCHOR_RE.findall(text)) | set(LABEL_RE.findall(text))


XREF_PREFIXES = ("sec-", "fig-", "eq-", "tbl-", "exr-", "exfig-", "aefig-", "ttrfig-", "epfig-", "extbl-", "lst-")


def normalize_target(target: str) -> str:
    """`@sec-x`, `#sec-x`, and `file.qmd#sec-x` all name the cross-reference `sec-x`."""
    if "#" in target:
        fragment = target.rsplit("#", 1)[1]
        if fragment.startswith(XREF_PREFIXES):
            return fragment
    return target


def link_targets(prose: str) -> collections.Counter:
    """Every link instance, by normalized target (a multiset: S2 keeps link instances)."""
    text = without_comments(prose)
    targets = LINK_TARGET_RE.findall(text) + XREF_RE.findall(text)
    return collections.Counter(normalize_target(target) for target in targets)


def alt_texts(text: str, blocks: list[str]) -> list[str]:
    alts = [value for block in blocks for kind, value in caption_options(block) if kind == "fig-alt"]
    alts += re.findall(r'fig-alt="([^"]*)"', text)
    return alts


def captions(prose: str, blocks: list[str]) -> list[str]:
    caps = [value for block in blocks for kind, value in caption_options(block) if kind != "fig-alt"]
    caps += re.findall(r"^!\[(.*?)\]\(", prose, re.M | re.S)
    return caps


def number_tokens(prose: str, blocks: list[str]) -> collections.Counter:
    """Numeric tokens in classes A to E (prose, captions, callouts, exercises, sources)."""
    text = without_comments(prose)
    text = DISPLAY_MATH_RE.sub(" ", text)
    text = INLINE_MATH_RE.sub(" ", text)
    for body in fenced_div(text, "plan"):
        text = text.replace(body, " ")
    kept = []
    for line in text.split("\n"):
        if line.lstrip().startswith("|"):
            continue
        kept.append(line)
    text = "\n".join(kept)
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)(\{[^}]*\})?", " ", text)
    text = re.sub(r"\]\([^)]*\)", "] ", text)
    text = re.sub(r"\{[^}]*\}", " ", text)
    text = XREF_RE.sub(" ", text)
    text = URL_RE.sub(" ", text)
    text += "\n" + "\n".join(captions(prose, blocks)).replace("\n", " ")
    text = CROSS_REF_PHRASE_RE.sub(" ", text)
    tokens = [token.rstrip(".,") for token in NUMBER_RE.findall(text)]
    return collections.Counter(token for token in tokens if token)


def plan_bodies(prose: str) -> list[str]:
    return fenced_div(prose, "plan")


def trainable_refs(text: str) -> collections.Counter:
    return collections.Counter(TRAINABLE_RE.findall(text))


# ------------------------------------------------------------------------ checks
class Checklist:
    def __init__(self) -> None:
        self.rows: list[tuple[str, str, str]] = []

    def add(self, invariant: str, ok: bool, detail: str) -> None:
        self.rows.append((invariant, "PASS" if ok else "FAIL", detail))

    def failed(self) -> bool:
        return any(status == "FAIL" for _, status, _ in self.rows)

    def print(self) -> None:
        for invariant, status, detail in self.rows:
            print(f"{invariant:4s} {status}  {detail}")


def counter_diff(before: collections.Counter, after: collections.Counter) -> tuple[dict, dict]:
    removed = dict(before - after)
    added = dict(after - before)
    return removed, added


def source_invariants(base: str, files: list[str], exceptions: dict, checklist: Checklist) -> None:
    fails = collections.defaultdict(list)
    notes = collections.defaultdict(list)
    exercise_total = {"before": 0, "after": 0}
    for path in files:
        old = git_show(base, path)
        new = (ROOT / path).read_text(encoding="utf-8") if (ROOT / path).is_file() else None
        if old is None or new is None:
            fails["I1"].append(f"{path}: missing at base or in tree")
            continue
        old_fm, old_body = split_front_matter(old)
        new_fm, new_body = split_front_matter(new)
        if old_fm != new_fm:
            fails["I1"].append(f"{path}: front matter changed")
        old_blocks, old_prose = segment(old_body)
        new_blocks, new_prose = segment(new_body)

        # I1 code cells (caption and alt option lines masked)
        if [mask_caption_options(b) for b in old_blocks] != [mask_caption_options(b) for b in new_blocks]:
            fails["I1"].append(f"{path}: code blocks differ")
        changed_options = sum(
            1 for a, b in zip(old_blocks, new_blocks) if a != b
        )
        if changed_options:
            notes["I1"].append(f"{path}: {changed_options} cell(s) changed only in caption/alt options")

        # I3 math
        if math_multiset(old_prose) != math_multiset(new_prose):
            removed, added = counter_diff(math_multiset(old_prose), math_multiset(new_prose))
            fails["I3"].append(f"{path}: math removed {list(removed)[:3]} added {list(added)[:3]}")

        # I4 numbers
        removed, added = counter_diff(
            number_tokens(old_prose, old_blocks), number_tokens(new_prose, new_blocks)
        )
        allowed = exceptions.get("I4", {}).get(path, {})
        unexplained_removed = {k: v for k, v in removed.items() if allowed.get(k, 0) < v}
        if unexplained_removed or added:
            fails["I4"].append(f"{path}: numbers removed {unexplained_removed} added {added}")
        elif removed:
            notes["I4"].append(f"{path}: declared merged-guard tokens {removed}")

        # I5 anchors, protected anchors and pointers in context
        if anchors(old) != anchors(new):
            fails["I5"].append(
                f"{path}: anchors removed {sorted(anchors(old) - anchors(new))} "
                f"added {sorted(anchors(new) - anchors(old))}"
            )
        for line in old.split("\n"):
            if TRAINABLE_RE.search(line) and line not in new.split("\n"):
                fails["I5"].append(f"{path}: cross-volume pointer line changed: {line[:80]}")

        # I6 links: every link instance survives, except declared S2 collapses of two
        # links to one target inside one paragraph (exceptions file, key "I6").
        old_links, new_links = link_targets(old_prose), link_targets(new_prose)
        removed, added = counter_diff(old_links, new_links)
        declared = exceptions.get("I6", {}).get(path, {})
        unexplained = {k: v for k, v in removed.items() if declared.get(k, 0) < v}
        if unexplained or added:
            fails["I6"].append(f"{path}: link instances removed {unexplained} added {added}")
        elif removed:
            notes["I6"].append(f"{path}: declared S2 collapses {removed}")

        # I7 headings (recap heading text may change under R1)
        old_heads, new_heads = headings(old_prose), headings(new_prose)
        if len(old_heads) != len(new_heads):
            fails["I7"].append(f"{path}: heading count {len(old_heads)} -> {len(new_heads)}")
        else:
            for (lo, to), (ln, tn) in zip(old_heads, new_heads):
                if lo != ln:
                    fails["I7"].append(f"{path}: heading level changed at {to!r}")
                elif to != tn:
                    if to.startswith("Okay, so") and tn.startswith("Okay, so:"):
                        notes["I7"].append(f"{path}: recap heading {to!r} -> {tn!r}")
                    elif to.replace(EM_DASH, "") != to:
                        notes["I7"].append(f"{path}: R6 heading {to!r} -> {tn!r}")
                    else:
                        fails["I7"].append(f"{path}: heading text changed {to!r} -> {tn!r}")

        # I8 figures and alt text
        old_alts, new_alts = alt_texts(old, old_blocks), alt_texts(new, new_blocks)
        for a, b in zip(old_alts, new_alts):
            if a != b and EM_DASH not in a:
                fails["I8"].append(f"{path}: alt text changed: {a[:60]!r}")
        if len(old_alts) != len(new_alts):
            fails["I8"].append(f"{path}: alt text count {len(old_alts)} -> {len(new_alts)}")
        old_figs = re.findall(r"!\[[^\]]*\]\(([^)]+)\)", old_prose)
        new_figs = re.findall(r"!\[[^\]]*\]\(([^)]+)\)", new_prose)
        if old_figs != new_figs:
            fails["I8"].append(f"{path}: figure references changed")

        # I9 exercises, I10 sources
        old_ex = level2_section(old_prose, "Exercises")
        new_ex = level2_section(new_prose, "Exercises")
        exercise_total["before"] += len(re.findall(r"^\d+\.\s+\*\*\(", old_ex, re.M))
        exercise_total["after"] += len(re.findall(r"^\d+\.\s+\*\*\(", new_ex, re.M))
        if old_ex != new_ex and EM_DASH not in old_ex:
            fails["I9"].append(f"{path}: exercise text changed")
        if ledger_tags(old_ex) != ledger_tags(new_ex):
            fails["I9"].append(f"{path}: exercise tags changed")
        old_src = level2_section(old_prose, "Sources and further reading")
        new_src = level2_section(new_prose, "Sources and further reading")
        if old_src != new_src and EM_DASH not in old_src:
            fails["I10"].append(f"{path}: Sources changed")

        # I11 plan steps
        if plan_bodies(old_prose) != plan_bodies(new_prose):
            fails["I11"].append(f"{path}: plan steps changed")

        # I15 cross-volume references
        if trainable_refs(old) != trainable_refs(new):
            fails["I15"].append(f"{path}: Making It Trainable references changed")

    for invariant, name in (
        ("I1", "code cells byte-identical (caption/alt options masked)"),
        ("I3", "math multiset identical per file"),
        ("I4", "numeric tokens identical in classes A to E (cross-reference numerals excluded)"),
        ("I5", "anchor ids and labels identical; cross-volume pointer lines byte-identical"),
        ("I6", "link instances identical per target (declared S2 collapses excepted)"),
        ("I7", "heading sequence and levels identical (recap text under R1)"),
        ("I8", "figure references and alt text identical (alt text only under R6)"),
        ("I9", "exercise text and tags identical"),
        ("I10", "Sources identical"),
        ("I11", "Plan step text byte-identical"),
        ("I15", "cross-volume references identical"),
    ):
        detail = name if not fails[invariant] else "; ".join(fails[invariant])
        if notes[invariant] and not fails[invariant]:
            detail += " [" + "; ".join(notes[invariant]) + "]"
        checklist.add(invariant, not fails[invariant], detail)
    checklist.add(
        "I9",
        exercise_total["before"] == exercise_total["after"],
        f"exercise count over checked files {exercise_total['before']} -> {exercise_total['after']}",
    )


def ledger_tags(section: str) -> list[str]:
    return re.findall(r"\*\*\((Pencil|Code|Audit)\.\)\*\*", section)


def rendered_invariants(before: Path, after: Path, files: list[str], checklist: Checklist) -> None:
    problems = []
    details = []
    for source in files:
        old_html, new_html = ledger.html_for(source, before), ledger.html_for(source, after)
        if not (old_html.is_file() and new_html.is_file()):
            continue
        old_words = ledger.page_metrics(ledger.extract(old_html, source))["words_A"]
        new_words = ledger.page_metrics(ledger.extract(new_html, source))["words_A"]
        change = (new_words - old_words) / old_words if old_words else 0.0
        details.append(f"{Path(source).stem} {old_words}->{new_words} ({change:+.1%})")
        if not -0.08 <= change <= 0.05:
            problems.append(f"{source}: class A words {old_words} -> {new_words} ({change:+.1%})")
    checklist.add("I12", not problems, "; ".join(problems) if problems else "; ".join(details))

    dash_rows = []
    for source in files:
        page = ledger.extract(ledger.html_for(source, after), source)
        errors, exemptions = ledger.blocking_violations(page)
        dashes = [e for e in errors if e.startswith("R6")]
        dash_rows.append(f"{Path(source).stem}: {len(dashes)} ({len(exemptions)} exempt)")
        if dashes:
            problems.append(source)
    checklist.add(
        "I16",
        not any(row.split(": ")[1].startswith(("1", "2", "3", "4", "5", "6", "7", "8", "9")) for row in dash_rows),
        "em dashes in classes A to F, H, T on checked pages: " + "; ".join(dash_rows),
    )


def without_source_lines(notebook: dict) -> dict:
    """Drop the exporter's `source_line` cell metadata (the .qmd line of each cell)."""
    for cell in notebook.get("cells", []):
        cell.get("metadata", {}).get("dlbook", {}).pop("source_line", None)
    return notebook


def notebook_invariant(before: Path, after: Path, checklist: Checklist) -> None:
    """Byte identity, or a proof by diff that only cell `source_line` metadata moved.

    Prose edits shift the .qmd line of later cells, so the exporter's provenance
    metadata changes while every Plan step, code line, and cell stays identical.
    """
    old = sorted(p.name for p in before.glob("*.ipynb"))
    new = sorted(p.name for p in after.glob("*.ipynb"))
    identical, line_only, differing = [], [], []
    for name in old:
        if not (after / name).is_file():
            differing.append(name)
            continue
        a_bytes, b_bytes = (before / name).read_bytes(), (after / name).read_bytes()
        if a_bytes == b_bytes:
            identical.append(name)
            continue
        a, b = (without_source_lines(json.loads(x)) for x in (a_bytes, b_bytes))
        (line_only if a == b else differing).append(name)
    ok = old == new and not differing
    checklist.add(
        "I11",
        ok,
        f"{len(identical)} of {len(new)} regenerated notebooks byte-identical; "
        f"{len(line_only)} differ only in cell source_line metadata ({', '.join(line_only)}), "
        "with every cell source, plan step, and code line identical"
        if ok else f"notebooks differ beyond source_line metadata: {differing or sorted(set(old) ^ set(new))}",
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--base", required=True)
    parser.add_argument("--files", nargs="*")
    parser.add_argument("--html-before", type=Path)
    parser.add_argument("--html-after", type=Path)
    parser.add_argument("--notebooks-before", type=Path)
    parser.add_argument("--notebooks-after", type=Path)
    parser.add_argument("--exceptions", type=Path)
    args = parser.parse_args()

    files = args.files or manuscript_files()
    exceptions = json.loads(args.exceptions.read_text()) if args.exceptions else {}
    checklist = Checklist()
    source_invariants(args.base, files, exceptions, checklist)
    if args.html_before and args.html_after:
        rendered_invariants(args.html_before, args.html_after, files, checklist)
    if args.notebooks_before and args.notebooks_after:
        notebook_invariant(args.notebooks_before, args.notebooks_after, checklist)
    checklist.print()
    return 1 if checklist.failed() else 0


if __name__ == "__main__":
    raise SystemExit(main())
