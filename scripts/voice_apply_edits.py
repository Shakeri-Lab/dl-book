#!/usr/bin/env python3
"""Apply reviewed voice edits and generate their receipts from the same lists.

Each page has one edit list under audits/voice/edits/ (JSON). An edit names its rule,
file, exact old text, new text, and a note; S1 edits also name the claim they limit
and where the guard went. The edit list is the single source of truth: `apply`
performs guarded replacements and records where each one landed, and `receipts`,
`guards`, and `flags` render audits/voice/receipts.md, guards_moved.md, and the flag
section of decisions_pending.md from the same data.

    python scripts/voice_apply_edits.py apply audits/voice/edits/13-attention.json --phase S
    python scripts/voice_apply_edits.py receipts audits/voice/edits/*.json \\
        --html-before BEFORE --html-after AFTER --out audits/voice/receipts.md
    python scripts/voice_apply_edits.py guards audits/voice/edits/*.json --out audits/voice/guards_moved.md
    python scripts/voice_apply_edits.py flags audits/voice/edits/*.json --out FILE
    python scripts/voice_apply_edits.py gate audits/voice/edits/*.json --stage B2 B2a \\
        --html RENDERED --out FILE      # Section A of a gate report (VOICE.md, P5)

Figure-code receipts (press W2 phase 2) live in the same lists and apply the same way:
exactly one match, every replay fixture literal intact. They add three keys:

    "kind": "figure-code",
    "figures": ["fig-cliff-rematch"],   # the figure labels the change redraws
    "files_changed": [...]              # the freeze files it changed (the figure ledger)

`apply` also requires a figure-code receipt's match to lie inside one executable Python
cell, with no fence line in its old or new text, and every named figure label to exist
in the file; it records that cell's label as "cell". That cell must be one of the
receipt's figures (its label, or the float div it sits in), or the cell that binds a
feeder the receipt declares:

    "feeds": ["scorecard_colors"]       # colour variables bound outside the figure cell

Each declared feeder must be listed for one of the receipt's figures in the feeders
column of audits/press/w2p2/data_figures.txt, and the match must sit in the last cell
before that figure that binds it (scripts/audit_figure_style.py resolves it the same
way). A receipt that only inserts the page's loader line may sit in any cell. An F8 (alt
text) receipt must carry whole alt-text options, so audit_voice_invariants.py can check
each alt change against it. `gate` lists figure-code and F8 receipts per figure, with
printed figure numbers read from the render, instead of looking for them inside a
paragraph: a figure-code receipt as a whole-line diff, with any changed line that is not
recognisably plotting code listed again for the author's review; an F8 receipt as its
alt text before and after.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import audit_figure_style as figure_style  # noqa: E402
import audit_voice_ledger as ledger  # noqa: E402

MANIFEST = ROOT / "interactives" / "manifest.json"
FENCE_RE = re.compile(r"^\s*(`{3,}|~{3,})")
FIGURE_CODE = "figure-code"
LABEL_OPTION_RE = re.compile(r"^\s*#\|\s*label:\s*(\S+)\s*$", re.M)
ANCHOR_ID_RE = re.compile(r"\{#([A-Za-z][A-Za-z0-9_:-]*)")


def is_figure_code(edit: dict) -> bool:
    return edit.get("kind") == FIGURE_CODE


def python_cells(text: str) -> list[tuple[int, int, str | None]]:
    """(body start, body end, label) character spans of each executable Python cell.

    The body runs from the line after the opening fence to the start of the closing
    fence line, so a replacement inside it can never touch a fence.
    """
    lines = text.split("\n")
    starts = []
    position = 0
    for line in lines:
        starts.append(position)
        position += len(line) + 1
    cells = []
    index = 0
    while index < len(lines):
        match = re.match(r"^\s*(`{3,}|~{3,})(.*)$", lines[index])
        if not match:
            index += 1
            continue
        fence, info = match.group(1), match.group(2).strip()
        closer = re.compile(rf"^\s*{re.escape(fence[0])}{{{len(fence)},}}\s*$")
        end = index + 1
        while end < len(lines) and not closer.match(lines[end]):
            end += 1
        if re.match(r"^\{python\b", info):
            body_start = starts[index + 1] if index + 1 < len(lines) else len(text)
            body_end = starts[end] if end < len(lines) else len(text)
            label = LABEL_OPTION_RE.search(text[body_start:body_end])
            cells.append((body_start, body_end, label.group(1) if label else None))
        index = end + 1
    return cells


def defined_labels(text: str) -> set[str]:
    return set(LABEL_OPTION_RE.findall(text)) | set(ANCHOR_ID_RE.findall(text))


def check_figure_code(edit: dict, text: str, index: int) -> str | None:
    """Guard one figure-code receipt before it is applied; return its cell's label."""
    figures = edit.get("figures")
    assert isinstance(figures, list) and figures and all(isinstance(f, str) for f in figures), (
        f"{edit['id']}: a figure-code receipt names its figures as a non-empty list of labels"
    )
    missing = sorted(set(figures) - defined_labels(text))
    assert not missing, f"{edit['id']}: figure label(s) not defined in {edit['file']}: {missing}"
    changed = edit.get("files_changed", [])
    assert isinstance(changed, list), f"{edit['id']}: files_changed must be a list"
    for side in ("old", "new"):
        assert not any(FENCE_RE.match(line) for line in edit[side].split("\n")), (
            f"{edit['id']}: figure-code {side} text must not contain a code fence"
        )
    end = index + len(edit["old"])
    span = next(((start, stop, label) for start, stop, label in python_cells(text)
                 if start <= index and end <= stop), None)
    if span is None:
        raise AssertionError(f"{edit['id']}: figure-code match is not inside one Python cell")
    body_start, _, label = span
    if loader_only(edit):
        return label  # the page's loader line, which may open any cell (ruling D6)
    start_line = text[:body_start].count("\n") + 1
    cells = figure_style.parse_cells(text)
    cell = next((c for c in cells if c.start == start_line), None)
    owners = {label, cell.figure if cell else None} - {None}
    if owners & set(figures):
        return label
    feeds = edit.get("feeds", [])
    assert isinstance(feeds, list) and all(isinstance(f, str) for f in feeds), (
        f"{edit['id']}: feeds must be a list of feeder names"
    )
    listed = {name for row in figure_style.data_figures()
              if row.page == edit["file"] and row.label in figures for name in row.feeders}
    undeclared = sorted(set(feeds) - listed)
    assert not undeclared, (
        f"{edit['id']}: feeds {undeclared} are not feeders of {figures} in "
        "audits/press/w2p2/data_figures.txt"
    )
    for name in feeds:
        for figure in figures:
            first = next((c.index for c in cells if c.figure == figure), None)
            resolved = figure_style.resolve_feeder(cells, name, first) if first is not None else None
            if resolved is not None and resolved[0].start == start_line:
                return label
    raise AssertionError(
        f"{edit['id']}: figure-code match is in cell {label or f'at line {start_line}'}, which is "
        f"neither a figure the receipt names {figures} nor the cell binding a feeder it declares "
        f"(feeds: {feeds})"
    )


def loader_only(edit: dict) -> bool:
    """True when a receipt's new text is its old text plus the page's loader line."""
    loader = figure_style.loader_line(edit["file"])
    old, new = edit["old"], edit["new"]
    return new.count(loader) == old.count(loader) + 1 and any(
        new.replace(piece, "", 1) == old for piece in (loader + "\n", "\n" + loader)
    )


def check_alt_receipt(edit: dict) -> None:
    """F8 receipts carry whole alt-text options (one or more), old and new alike."""
    import audit_voice_invariants as invariants

    old, new = invariants.alt_values(edit["old"]), invariants.alt_values(edit["new"])
    assert old and len(old) == len(new), (
        f"{edit['id']}: an F8 receipt must replace whole alt-text options "
        f"(found {len(old)} old and {len(new)} new)"
    )


def fixture_literals(qmd: str) -> list[str]:
    """Every verbatim literal a replay scene pins in this chapter source."""
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    scenes = manifest["scenes"] if isinstance(manifest, dict) else manifest
    literals: list[str] = []
    for scene in scenes:
        if scene.get("qmd") != qmd:
            continue
        fixture = scene.get("fixture") or {}
        values = fixture.values() if isinstance(fixture, dict) else [fixture]
        for value in values:
            if isinstance(value, str):
                literals.append(value)
            elif isinstance(value, list):
                literals.extend(item for item in value if isinstance(item, str))
    return literals


def top_level_sections(text: str) -> list[tuple[int, str]]:
    """(line, title) of each `## ` heading outside code and fenced divs."""
    sections = []
    fence: str | None = None
    depth = 0
    for number, line in enumerate(text.split("\n"), start=1):
        match = FENCE_RE.match(line)
        if fence is None and match:
            fence = match.group(1)
            continue
        if fence is not None:
            if re.match(rf"^\s*{re.escape(fence[0])}{{{len(fence)},}}\s*$", line):
                fence = None
            continue
        if re.match(r"^:{3,}\s*\{", line) or re.match(r"^:{3,}\s+\S", line):
            depth += 1
            continue
        if re.match(r"^:{3,}\s*$", line):
            depth = max(0, depth - 1)
            continue
        if depth == 0 and line.startswith("## "):
            sections.append((number, line[3:].strip()))
    return sections


def section_of(text: str, line: int) -> tuple[int, str]:
    index, title = 0, "(opener)"
    for position, (start, heading) in enumerate(top_level_sections(text), start=1):
        if start <= line:
            index, title = position, heading
    return index, title


def apply(path: Path, phase: str) -> int:
    data = json.loads(path.read_text(encoding="utf-8"))
    applied = 0
    by_file: dict[str, str] = {}
    for edit in data["edits"]:
        if edit["phase"] != phase or edit.get("applied"):
            continue
        target = ROOT / edit["file"]
        text = by_file.get(edit["file"]) or target.read_text(encoding="utf-8")
        count = text.count(edit["old"])
        assert count == 1, f"{edit['id']}: expected exactly one match, found {count}"
        literals = fixture_literals(edit["file"])
        before = {literal: text.count(literal) for literal in literals}
        index = text.index(edit["old"])
        cell_label = check_figure_code(edit, text, index) if is_figure_code(edit) else None
        if edit.get("rule") == "F8":
            check_alt_receipt(edit)
        line = text[:index].count("\n") + 1
        section_index, section_title = section_of(text, line)
        text = text.replace(edit["old"], edit["new"], 1)
        for literal, seen in before.items():
            assert text.count(literal) == seen, (
                f"{edit['id']}: replay fixture literal changed: {literal[:60]!r}"
            )
        by_file[edit["file"]] = text
        edit.update(line=line, section_index=section_index, section=section_title, applied=True)
        if is_figure_code(edit):
            edit.update(cell=cell_label)
        applied += 1
    for relative, text in by_file.items():
        (ROOT / relative).write_text(text, encoding="utf-8")
    path.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{path.name}: applied {applied} {phase} edit(s)")
    return 0


def cell(text: str) -> str:
    return text.replace("\n", " ").replace("|", "\\|").strip()


def receipts(paths: list[Path], before: Path | None, after: Path | None, out: Path) -> None:
    lines = [
        "# Voice-coherence receipts",
        "",
        "Generated by `scripts/voice_apply_edits.py receipts` from the edit lists in",
        "`audits/voice/edits/`, the same lists `apply` used for the guarded replacements.",
        "One row per prose edit. Line numbers are those of the text at the moment the edit",
        "was applied (Stage A in phase order S, T, R; then each Stage B batch in phase",
        "order). A stage in parentheses marks a Stage B edit. Section counts are measured on",
        "rendered HTML (class A guards / class A chapter references), before and after. The",
        "reader column holds the rule-blind reader's mark (VOICE.md, P3) and its resolution.",
        "",
    ]
    for path in paths:
        data = json.loads(path.read_text(encoding="utf-8"))
        page = data["page"]
        counts_before = counts_after = None
        if before and after:
            counts_before = ledger.section_counts(ledger.html_for(page, before), page)
            counts_after = ledger.section_counts(ledger.html_for(page, after), page)
        lines += [
            f"## {page}",
            "",
            "| rule | file:line | before | after | note | reader |",
            "|---|---|---|---|---|---|",
        ]
        for edit in data["edits"]:
            if not edit.get("applied"):
                continue
            note = edit.get("note", "")
            if counts_before and counts_after:
                k = edit["section_index"]
                if k < len(counts_before) and k < len(counts_after):
                    _, title, g0, r0 = counts_before[k]
                    _, _, g1, r1 = counts_after[k]
                    note = (note + " " if note else "") + (
                        f"[section '{edit['section']}': guards {g0}→{g1}, chapter refs {r0}→{r1}]"
                    )
            rule = edit["rule"] if "stage" not in edit else f"{edit['rule']} ({edit['stage']})"
            if edit.get("justification"):
                note = f"{note} [justification: {edit['justification']}]"
            lines.append(
                f"| {rule} | `{edit['file']}:{edit['line']}` | {cell(edit['old'])} | "
                f"{cell(edit['new'])} | {cell(note)} | {cell(edit.get('reader', ''))} |"
            )
        lines.append("")
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {out}")


def guards(paths: list[Path], out: Path) -> None:
    lines = [
        "# Guards merged or moved (S1)",
        "",
        "Generated from the S1 entries of the edit lists. No caveat was deleted: each row",
        "names where its content now lives.",
        "",
        "| page | source (file:line) | action | destination | claim limited | guard text |",
        "|---|---|---|---|---|---|",
    ]
    for path in paths:
        data = json.loads(path.read_text(encoding="utf-8"))
        for edit in data["edits"]:
            guard = edit.get("guard")
            if edit["rule"] != "S1" or not guard or not edit.get("applied"):
                continue
            lines.append(
                f"| {Path(data['page']).stem} | `{edit['file']}:{edit['line']}` | {guard['action']} | "
                f"{cell(guard['destination'])} | {cell(guard['claim'])} | {cell(guard['text'])} |"
            )
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {out}")


def flags(paths: list[Path], out: Path) -> None:
    lines = ["| page | rule | location | text | reason |", "|---|---|---|---|---|"]
    for path in paths:
        data = json.loads(path.read_text(encoding="utf-8"))
        for flag in data.get("flags", []):
            lines.append(
                f"| {Path(data['page']).stem} | {flag['rule']} | `{cell(flag['location'])}` | "
                f"{cell(flag['text'])} | {cell(flag['reason'])} |"
            )
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {out}")


BLOCK_TAGS = ("p", "li", "figcaption", "td", "th", "dd", "blockquote")


def rendered_blocks(html_path: Path) -> list[str]:
    """Reader-visible paragraphs of a rendered page, in order, with math as $...$."""
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html_path.read_text(encoding="utf-8"), "html.parser")
    main_el = soup.find("main", id="quarto-document-content") or soup.find("main") or soup
    for hidden in main_el.select("div.cell-output, div.sourceCode, pre, script, style, nav"):
        hidden.decompose()
    blocks = []
    for element in main_el.find_all(BLOCK_TAGS):
        if element.find(BLOCK_TAGS):
            continue  # keep the innermost block only
        text = element.get_text(" ", strip=True)
        text = re.sub(r"\\\((.+?)\\\)", r"$\1$", text, flags=re.S)
        text = re.sub(r"\s+", " ", text).strip()
        if text:
            blocks.append(text)
    return blocks


def _words(text: str) -> list[str]:
    return [w for w in ledger.tokens(text) if w not in {"ref", "math", "code"}]


def locate(sentence: str, blocks: list[str]) -> tuple[int, str] | None:
    """The rendered paragraph that holds a source sentence, found by its longest run of
    plain words (math, cross-references, and code are rendered differently)."""
    runs, run = [], []
    for token in ledger.tokens(sentence):
        if token in {"ref", "math", "code"}:
            if run:
                runs.append(run)
            run = []
        else:
            run.append(token)
    if run:
        runs.append(run)
    if not runs:
        return None
    probe = " ".join(max(runs, key=len)[:12])
    for index, block in enumerate(blocks):
        if probe and probe in " ".join(_words(block)):
            return index, block
    return None


def emphasize(sentence: str, block: str) -> str:
    """Bold the rendered sentence of a block that best matches a source sentence."""
    target = set(_words(sentence))
    pieces = ledger.sentences(block) or [block]
    best = max(pieces, key=lambda piece: len(target & set(_words(piece))))
    return block.replace(best, f"**{best.strip()}**", 1) if best.strip() else block


def gate(paths: list[Path], stages: list[str], html_root: Path, out: Path) -> None:
    """Section A of a gate report (VOICE.md, P5): each changed or added sentence inside
    its rendered paragraph, by page in reading order, with rule, intent, and reader mark."""
    order = {source: index for index, source in enumerate(ledger.book_sources())}
    book_order = re.findall(r"^\s*-\s*(chapters/\S+\.qmd)\s*$", (ROOT / "_quarto.yml").read_text(), re.M)
    order.update({source: index for index, source in enumerate(book_order)})
    pages = []
    for path in paths:
        data = json.loads(path.read_text(encoding="utf-8"))
        edits = [
            e for e in data["edits"]
            if e.get("applied") and (e.get("stage") in stages or e.get("phase") in stages)
        ]
        if edits:
            pages.append((order.get(data["page"], 999), data["page"], edits))
    lines = []
    for _, page, edits in sorted(pages):
        html_path = ledger.html_for(page, html_root)
        blocks = rendered_blocks(html_path) if html_path.is_file() else []
        title = page
        if html_path.is_file():
            from bs4 import BeautifulSoup

            head = BeautifulSoup(html_path.read_text(encoding="utf-8"), "html.parser").find("h1")
            if head is not None:
                title = re.sub(r"\s+", " ", head.get_text(" ", strip=True))
        entries = []
        figure_edits = []
        for edit in edits:
            if is_figure_code(edit) or edit.get("rule") == "F8":
                figure_edits.append(edit)  # listed per figure below, not in a paragraph
                continue
            new_parts = ledger.prose_sentences(ledger.source_prose(edit["new"]))
            old_list = ledger.prose_sentences(ledger.source_prose(edit["old"]))
            old_parts = set(old_list)
            added = [part for part in new_parts if part not in old_parts]
            removed = [part for part in old_list if part not in set(new_parts)]
            found = None
            for part in (added or new_parts):
                found = locate(part, blocks)
                if found:
                    break
            if found:
                index, block = found
                shown = block
                for part in added:
                    if locate(part, [block]):
                        shown = emphasize(part, shown)
            else:
                index, shown = 10**6, "(the paragraph could not be located; see the receipt)"
            if removed and not added:
                shown += "\n>\n> Removed: " + " ".join(f"“{part}”" for part in removed)
            elif removed:
                shown += "\n>\n> Replaced: " + " ".join(f"“{part}”" for part in removed)
            entries.append((index, edit, shown))
        lines += [f"### {title}", "", f"`{page}`", ""]
        for index, edit, shown in sorted(entries, key=lambda item: item[0]):
            intent = edit.get("intent") or edit.get("note", "")
            label = edit["id"] + (f", {edit['brief']}" if edit.get("brief") else "")
            lines.append(f"**{label}** ({edit['rule']}). {intent}")
            lines.append("")
            lines.append("> " + shown)
            lines.append("")
            reader = edit.get("reader")
            lines.append(f"Reader pass: {reader}" if reader else "Reader pass: no mark.")
            lines.append("")
        if figure_edits:
            lines += figure_code_section(page, figure_edits, html_path)
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {out}")


def printed_figure_numbers(html_path: Path) -> dict[str, str]:
    """Label -> printed number ("Figure 9.4"), read from each float's own caption."""
    if not html_path.is_file():
        return {}
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html_path.read_text(encoding="utf-8"), "html.parser")
    numbers = {}
    for caption in soup.find_all("figcaption"):
        owner = caption.find_parent(id=True)
        text = re.sub(r"\s+", " ", caption.get_text(" ", strip=True).replace("\xa0", " "))
        match = re.match(r"(Figure [A-Z]?\d*(?:\.\d+)*)", text)
        if owner is not None and match:
            numbers.setdefault(owner["id"], match.group(1))
    return numbers


def full_lines(file: str, old: str, new: str) -> tuple[list[str], list[str], bool]:
    """The whole source lines a figure-code receipt changed, before and after.

    The receipt holds fragments; the current file supplies the rest of each line. When
    the new text is no longer in the file (a later receipt superseded it), the
    fragments are shown as they are.
    """
    source = ROOT / file
    text = source.read_text(encoding="utf-8") if source.is_file() else ""
    at = text.find(new) if new else -1
    if at < 0:
        return old.split("\n"), new.split("\n"), False
    start = text.rfind("\n", 0, at) + 1
    end = text.find("\n", at + len(new))
    end = len(text) if end < 0 else end
    after = text[start:end]
    before = after[: at - start] + old + after[at - start + len(new):]
    return before.split("\n"), after.split("\n"), True


# A changed line counts as plotting code when it names a figure object, calls a
# drawing or styling method, passes a plotting keyword (PEP 8 `key=value`, so an
# assignment `label = ...` does not count), or holds a hex colour. Anything else is
# listed again under its receipt for the author's review.
PLOTTING_LINE_RE = re.compile(
    r"\b(?:plt|fig|figs|axes|axs|ax|ax\d+|ax_\w+|\w+_ax|cbar|cb|legend|handles|mpl|matplotlib)\b"
    r"|\.(?:plot|scatter|imshow|matshow|pcolormesh|contour|contourf|bar|barh|hist|errorbar|"
    r"fill_between|fill_betweenx|axhline|axvline|axhspan|axvspan|hlines|vlines|text|annotate|"
    r"legend|colorbar|tick_params|grid|margins|invert_xaxis|invert_yaxis|twinx|twiny|add_patch|"
    r"add_artist|add_collection|tight_layout|subplots_adjust|suptitle|supxlabel|supylabel|"
    r"savefig|show|clabel|bar_label|semilogx|semilogy|loglog|quiver|subplots|add_subplot)\("
    r"|\.set_(?!num_threads|default_dtype|seed|grad_enabled|printoptions|flush_denormal)\w+\("
    r"|\.(?:spines|xaxis|yaxis)\b"
    r"|\b(?:color|colors|c|lw|linewidth|linewidths|ls|linestyle|linestyles|marker|ms|markersize|"
    r"mfc|mec|mew|alpha|label|labels|fontsize|fontweight|weight|size|figsize|cmap|vmin|vmax|"
    r"zorder|ha|va|loc|ncol|facecolor|edgecolor|fc|ec|bbox_to_anchor|frameon|rotation|dashes|"
    r"hatch|interpolation|aspect|extent|origin|labelpad|fraction|shrink|xytext|textcoords|"
    r"arrowprops|bbox|clip_on|rasterized|capsize|elinewidth|sharex|sharey|layout|"
    r"width_ratios|height_ratios|handlelength|borderaxespad|columnspacing|markevery)=(?!=)"
    r"|[\"']#[0-9A-Fa-f]{3,8}[\"']"
)
NEUTRAL_LINE_RE = re.compile(r"^\s*(?:#.*)?$|^[\s()\[\]{},:]*$")


def unreviewed_lines(rows: list[str], loader: str) -> list[str]:
    """Changed diff rows (+/-) that are not recognisably plotting code."""
    out = []
    for row in rows:
        if not row or row[0] not in "+-" or row.startswith(("+++", "---")):
            continue
        line = row[1:]
        if line == loader or NEUTRAL_LINE_RE.match(line) or PLOTTING_LINE_RE.search(line):
            continue
        out.append(row)
    return out


def unquoted(value: str) -> str:
    """An option value without the quotes that surround it in the source."""
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        return value[1:-1]
    return value


def receipt_figures(edit: dict, text: str) -> list[str]:
    """The figures a receipt belongs to: its "figures", else the figure whose cell,
    float div or image attributes hold its new (or old) text."""
    if edit.get("figures"):
        return list(edit["figures"])
    at = text.find(edit["new"]) if edit.get("new") else -1
    if at < 0:
        at = text.find(edit["old"]) if edit.get("old") else -1
    if at < 0:
        return []
    line = text[:at].count("\n") + 1
    for cell in figure_style.parse_cells(text):
        if cell.start <= line < cell.start + len(cell.lines):
            return [cell.figure] if cell.figure else []
    head = text[:at]
    attributes = head.rfind("{#")
    if attributes >= 0 and "}" not in head[attributes:]:
        match = re.match(r"\{#([\w:-]+)", head[attributes:])
        if match:
            return [match.group(1)]
    openers = list(figure_style.DIV_OPEN_RE.finditer(head))
    return [openers[-1].group(2)] if openers else []


def figure_code_section(page: str, edits: list[dict], html_path: Path) -> list[str]:
    """Figure-code and F8 receipts grouped by the figure they belong to, in source order."""
    import difflib

    import audit_voice_invariants as invariants

    text = (ROOT / page).read_text(encoding="utf-8") if (ROOT / page).is_file() else ""
    numbers = printed_figure_numbers(html_path)
    loader = figure_style.loader_line(page)
    owners = {edit["id"]: receipt_figures(edit, text) for edit in edits}
    labels: list[str] = []
    for edit in edits:
        labels.extend(label for label in owners[edit["id"]] or [""] if label not in labels)

    def position(label: str) -> int:
        match = re.search(rf"(#\|\s*label:\s*|\{{#){re.escape(label)}\b", text) if label else None
        return match.start() if match else len(text)

    alt = any(not is_figure_code(edit) for edit in edits)
    lines = ["#### Figure code and alt text" if alt else "#### Figure code", ""]
    for label in sorted(labels, key=position):
        name = numbers.get(label, "Figure (number not found in the render)")
        lines += [f"**{name}** (`{label}`)" if label else f"**{name}** (no figure found)", ""]
        for edit in edits:
            if label not in (owners[edit["id"]] or [""]):
                continue
            intent = edit.get("intent") or edit.get("note", "")
            where = f"`{edit['file']}:{edit.get('line', '?')}`"
            if edit.get("cell"):
                where += f", cell `{edit['cell']}`"
            if edit.get("feeds"):
                where += ", feeds " + ", ".join(f"`{name_}`" for name_ in edit["feeds"])
            lines.append(f"- **{edit['id']}** ({edit['rule']}). {intent} {where}.")
            if not is_figure_code(edit):
                old_alts = invariants.alt_values(edit["old"])
                new_alts = invariants.alt_values(edit["new"])
                for before_alt, after_alt in zip(old_alts, new_alts):
                    lines.append(f"  Alt text before: “{unquoted(before_alt)}”")
                    lines.append(f"  Alt text after: “{unquoted(after_alt)}”")
                if not old_alts:
                    lines.append("  (No whole alt-text option found in the receipt.)")
                reader = edit.get("reader")
                lines += [f"  Reader pass: {reader}" if reader else "  Reader pass: no mark.", ""]
                continue
            changed = edit.get("files_changed") or []
            lines.append(
                "  Files changed: " + (", ".join(f"`{path_}`" for path_ in changed) if changed
                                       else "none recorded yet.")
            )
            before, after, found = full_lines(edit["file"], edit["old"], edit["new"])
            rows = list(difflib.unified_diff(before, after, lineterm="", n=0))[2:]
            diff = [row for row in rows if not row.startswith("@@")]  # drop hunk headers
            lines += ["", "  ```diff", *(f"  {row}" for row in diff), "  ```"]
            if not found:
                lines.append("  (Fragments only: the new text is no longer in the page.)")
            review = unreviewed_lines(diff, loader)
            if review:
                lines += ["", f"  **Author review:** {len(review)} changed line(s) are not plotting "
                              "code:", "", "  ```diff", *(f"  {row}" for row in review), "  ```"]
            lines.append("")
    return lines


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)
    apply_parser = sub.add_parser("apply")
    apply_parser.add_argument("edits", type=Path)
    apply_parser.add_argument("--phase", choices=("S", "T", "R", "B0", "B2", "W2", "C1", "AUTHOR"), required=True)
    receipts_parser = sub.add_parser("receipts")
    receipts_parser.add_argument("edits", type=Path, nargs="+")
    receipts_parser.add_argument("--html-before", type=Path)
    receipts_parser.add_argument("--html-after", type=Path)
    receipts_parser.add_argument("--out", type=Path, required=True)
    guards_parser = sub.add_parser("guards")
    guards_parser.add_argument("edits", type=Path, nargs="+")
    guards_parser.add_argument("--out", type=Path, required=True)
    flags_parser = sub.add_parser("flags")
    flags_parser.add_argument("edits", type=Path, nargs="+")
    flags_parser.add_argument("--out", type=Path, required=True)
    gate_parser = sub.add_parser("gate")
    gate_parser.add_argument("edits", type=Path, nargs="+")
    gate_parser.add_argument("--stage", nargs="+", required=True)
    gate_parser.add_argument("--html", type=Path, required=True)
    gate_parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    if args.command == "apply":
        return apply(args.edits, args.phase)
    if args.command == "receipts":
        receipts(args.edits, args.html_before, args.html_after, args.out)
    elif args.command == "guards":
        guards(args.edits, args.out)
    elif args.command == "gate":
        gate(args.edits, args.stage, args.html, args.out)
    else:
        flags(args.edits, args.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
