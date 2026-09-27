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
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import audit_voice_ledger as ledger  # noqa: E402

MANIFEST = ROOT / "interactives" / "manifest.json"
FENCE_RE = re.compile(r"^\s*(`{3,}|~{3,})")


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
        line = text[:index].count("\n") + 1
        section_index, section_title = section_of(text, line)
        text = text.replace(edit["old"], edit["new"], 1)
        for literal, seen in before.items():
            assert text.count(literal) == seen, (
                f"{edit['id']}: replay fixture literal changed: {literal[:60]!r}"
            )
        by_file[edit["file"]] = text
        edit.update(line=line, section_index=section_index, section=section_title, applied=True)
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
        for edit in edits:
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
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {out}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)
    apply_parser = sub.add_parser("apply")
    apply_parser.add_argument("edits", type=Path)
    apply_parser.add_argument("--phase", choices=("S", "T", "R", "B0", "B2"), required=True)
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
