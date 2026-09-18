#!/usr/bin/env python3
"""Audit the mechanism-excerpt manifest against the manuscript it mirrors.

Every optional HTML excerpt replays numbers the manuscript owns. This audit is
the guard against those numbers drifting apart: it checks that each scene's
declared fixture literals still appear verbatim in its chapter source, that the
scene's receipt records that chapter's current SHA-256, that the anchor the
filter inserts at still exists, and that the timeline the manifest publishes is
the timeline the panel markup declares. Editing a chapter is allowed; editing it
without re-reading the excerpt it feeds is what this fails on.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "interactives" / "manifest.json"
SCHEMA_VERSION = 1
CONTROLS_PLACEHOLDER = "<!-- PLAYER_CONTROLS -->"

SCENE_KEYS = {
    "id",
    "scene",
    "qmd",
    "anchor",
    "filter",
    "transport",
    "duration",
    "beats",
    "fixture",
    "receipt",
}
ANCHOR_TYPES = {"after-cell", "before-heading"}
HEADING_RE = re.compile(r"^#{2,}\s+(.*?)\s*$", re.M)
# Pandoc's smart extension replaces ASCII quotes, apostrophes and dashes in the rendered
# heading, so both sides compare this form (mirrored in filters/mechanism-excerpts.lua).
TYPOGRAPHIC = str.maketrans({"\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"',
                             "\u2013": "-", "\u2014": "-"})


def normalize_heading(text: str) -> str:
    return text.translate(TYPOGRAPHIC)
TRANSPORTS = {"shared", "scene"}

# Receipts record provenance as one-row-per-source Markdown tables whose first
# backticked span is the path and whose last is the digest.
HASH_ROW_RE = re.compile(r"^\|\s*`([^`]+)`[^|]*\|\s*`([0-9a-f]{64})`\s*\|\s*$", re.M)
RANGE_INPUT_RE = re.compile(r"<input\b[^>]*type=\"range\"[^>]*>")
MAX_RE = re.compile(r"\bmax=\"([0-9.]+)\"")
DATA_BEATS_RE = re.compile(r"\bdata-beats=\"([^\"]*)\"")
DATA_DURATION_RE = re.compile(r"\bdata-duration=\"([^\"]*)\"")
# A filter that reads this manifest carries no scene name of its own; one that does not
# must still name the scene and the anchor it hard-codes.
MANIFEST_READ_RE = re.compile(r"manifest\.json")
LECTURE_PREFIX = "6050-"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def hash_rows(text: str) -> dict[str, str]:
    """Map every provenance row in a receipt to its recorded digest."""
    rows: dict[str, str] = {}
    for path, digest in HASH_ROW_RE.findall(text):
        rows.setdefault(path, digest)
    return rows


def composed_panel(scene_dir: Path) -> str:
    """Reproduce the markup the filter emits: panel plus shared controls."""
    markup = (scene_dir / "panel.html").read_text()
    if CONTROLS_PLACEHOLDER in markup:
        controls = (ROOT / "interactives" / "shared" / "controls.html").read_text()
        markup = markup.replace(CONTROLS_PLACEHOLDER, controls)
    return markup


def declared_duration(markup: str) -> float | None:
    """The duration the reader's transport starts from: the pane, else the scrubber."""
    declared = DATA_DURATION_RE.findall(markup)
    if declared:
        return float(declared[0])
    for tag in RANGE_INPUT_RE.findall(markup):
        found = MAX_RE.search(tag)
        if found:
            return float(found.group(1))
    return None


def declared_beats(markup: str) -> list[float] | None:
    declared = DATA_BEATS_RE.findall(markup)
    if not declared:
        return None
    return [float(value) for value in declared[0].split()]


# Quarto's layout pass claims every class beginning `column-` (column-margin,
# column-page, column-screen, ...). A scene stylesheet that coins one of its own turns
# the panel into a full-width grid and the chapter scrolls sideways, so the names are
# refused here rather than discovered in a render.
RESERVED_CLASS_RE = re.compile(r"""(?:class="|\.)(column-[A-Za-z0-9_-]+)""")
RESERVED_CLASS_ALLOWED = {"column-margin", "column-page", "column-screen", "column-body"}


def reserved_classes(scene_dir: Path) -> set[str]:
    found: set[str] = set()
    for name in ("panel.html", "player.css", "player.js"):
        path = scene_dir / name
        if path.exists():
            found |= {m for m in RESERVED_CLASS_RE.findall(path.read_text(encoding="utf-8"))}
    return found - RESERVED_CLASS_ALLOWED


def anchor_present(anchor: dict, chapter: str) -> bool:
    target = anchor["target"]
    if anchor["type"] == "after-cell":
        # Quarto derives the div id `cell-<label>` from the executable cell's label.
        label = target[len("cell-"):] if target.startswith("cell-") else target
        return re.search(rf"^#\|\s*label:\s*{re.escape(label)}\s*$", chapter, re.M) is not None
    # Headings are compared in the normalized form filters/mechanism-excerpts.lua uses,
    # so a target written in plain ASCII still names a heading Pandoc renders with
    # typographic quotes, apostrophes or dashes.
    wanted = normalize_heading(target)
    return any(
        normalize_heading(re.sub(r"\s*\{.*\}\s*$", "", line).strip()) == wanted
        for line in HEADING_RE.findall(chapter)
    )


def audit_scene(scene: dict, index: int, errors: list[str]) -> None:
    where = f"scene[{index}]"
    if not isinstance(scene, dict):
        errors.append(f"{where}: not an object")
        return
    scene_dir = ROOT / "interactives" / str(scene.get("scene", ""))
    for name in sorted(reserved_classes(scene_dir)):
        errors.append(
            f"{scene.get('id', where)}: class {name!r} is in Quarto's reserved column-* "
            "layout namespace; rename it (the panel would become a full-width grid)"
        )
    identifier = scene.get("id", where)
    missing = SCENE_KEYS - set(scene)
    extra = set(scene) - SCENE_KEYS
    if missing:
        errors.append(f"{identifier}: missing key(s) {', '.join(sorted(missing))}")
    if extra:
        errors.append(f"{identifier}: unknown key(s) {', '.join(sorted(extra))}")
    if missing:
        return

    anchor = scene["anchor"]
    if not isinstance(anchor, dict) or set(anchor) != {"type", "target"}:
        errors.append(f"{identifier}: anchor must be {{type, target}}")
        anchor = None
    elif anchor["type"] not in ANCHOR_TYPES:
        errors.append(f"{identifier}: unknown anchor type {anchor['type']!r}")
        anchor = None
    if scene["transport"] not in TRANSPORTS:
        errors.append(f"{identifier}: unknown transport {scene['transport']!r}")

    fixture = scene["fixture"]
    if not isinstance(fixture, dict) or set(fixture) != {"literals", "computedVariants"}:
        errors.append(f"{identifier}: fixture must be {{literals, computedVariants}}")
        return
    if not fixture["literals"]:
        errors.append(f"{identifier}: declares no fixture literal")

    qmd = ROOT / scene["qmd"]
    if not qmd.is_file():
        errors.append(f"{identifier}: missing chapter source {scene['qmd']}")
        return
    chapter = qmd.read_text()

    # 1. The manuscript still prints the numbers the scene replays.
    for literal in fixture["literals"]:
        if literal not in chapter:
            head = literal.splitlines()[0][:72]
            errors.append(f"{identifier}: fixture literal absent from {scene['qmd']}: {head!r}")

    # 2. The receipt was re-read against the chapter as it stands today.
    receipt = ROOT / scene["receipt"]
    if not receipt.is_file():
        errors.append(f"{identifier}: missing receipt {scene['receipt']}")
    else:
        recorded = hash_rows(receipt.read_text()).get(scene["qmd"])
        current = sha256(qmd)
        if recorded is None:
            errors.append(
                f"{identifier}: {scene['receipt']} records no SHA-256 for {scene['qmd']}"
            )
        elif recorded != current:
            errors.append(
                f"{identifier}: {scene['receipt']} records {recorded[:12]}… for "
                f"{scene['qmd']}, which now hashes to {current[:12]}…"
            )

    # 3. The insertion point the filter asserts on still exists, in that filter.
    if anchor is not None and not anchor_present(anchor, chapter):
        errors.append(
            f"{identifier}: {anchor['type']} anchor {anchor['target']!r} not found in {scene['qmd']}"
        )
    lua = ROOT / scene["filter"]
    if not lua.is_file():
        errors.append(f"{identifier}: missing filter {scene['filter']}")
    else:
        source = lua.read_text()
        if MANIFEST_READ_RE.search(source):
            # A manifest-driven filter names no scene and no cell: this entry is its
            # input, so what it must still prove is that it can place an anchor of this
            # kind at all. A filter that hard-codes its scene keeps the older binding.
            if anchor is not None and f'"{anchor["type"]}"' not in source:
                errors.append(
                    f"{identifier}: {scene['filter']} reads the manifest but places no "
                    f"{anchor['type']!r} anchor"
                )
        else:
            for needle in filter(None, [scene["scene"], anchor and anchor["target"]]):
                if needle not in source:
                    errors.append(f"{identifier}: {scene['filter']} never mentions {needle!r}")

    # 4. The scene ships the assets the manifest names.
    scene_dir = ROOT / "interactives" / scene["scene"]
    for asset in ("panel.html", "player.js"):
        if not (scene_dir / asset).is_file():
            errors.append(f"{identifier}: missing interactives/{scene['scene']}/{asset}")
    if not (scene_dir / "panel.html").is_file():
        return

    # 5. One timeline: the manifest publishes what the panel markup declares.
    markup = composed_panel(scene_dir)
    if f'id="{scene["id"]}"' not in markup:
        errors.append(f"{identifier}: interactives/{scene['scene']}/panel.html declares no such id")
    duration = declared_duration(markup)
    if duration is None:
        errors.append(f"{identifier}: panel declares no duration and no scrubber range")
    elif duration != scene["duration"]:
        errors.append(
            f"{identifier}: manifest duration {scene['duration']} but panel declares {duration}"
        )
    beats = declared_beats(markup)
    if beats is not None:
        if beats != scene["beats"]:
            printed = [int(beat) if float(beat).is_integer() else beat for beat in beats]
            errors.append(
                f"{identifier}: manifest beats {scene['beats']} but panel declares {printed}"
            )
    elif scene["transport"] != "scene":
        # A shared-transport pane owns no timeline of its own: it must publish one.
        errors.append(
            f"{identifier}: shared-transport pane declares no data-beats, so the manifest's "
            f"{len(scene['beats'])} beat(s) are bound to nothing"
        )
    elif duration is not None:
        # A scene-transport player derives its beats from its own phase length, so there is
        # no markup to compare against. The manifest must still name that uniform grid: the
        # scene's own JSDOM test binds it to the player's `lastStep` and `phaseSeconds`.
        phases = len(scene["beats"])
        phase = duration / phases if phases else 0
        expected = [round(index * phase, 6) for index in range(phases)]
        if not phases or [round(float(beat), 6) for beat in scene["beats"]] != expected:
            errors.append(
                f"{identifier}: scene-transport beats {scene['beats']} are not the uniform "
                f"{phases}-phase grid its declared duration {duration} implies ({expected})"
            )


def audit_lecture_sources(receipts: list[str], tree: Path, errors: list[str]) -> int:
    """Re-verify the lecture files each receipt hashed, when that tree is present."""
    checked = 0
    for relative in receipts:
        rows = hash_rows((ROOT / relative).read_text())
        for source, digest in rows.items():
            if not source.startswith(LECTURE_PREFIX):
                continue
            path = tree / source
            if not path.is_file():
                errors.append(f"{relative}: lecture source missing from tree: {source}")
                continue
            checked += 1
            current = sha256(path)
            if current != digest:
                errors.append(
                    f"{relative}: {source} recorded {digest[:12]}… but now hashes "
                    f"to {current[:12]}…"
                )
    return checked


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--lecture-tree",
        type=Path,
        help="also re-verify the lecture-source SHA-256s each receipt records",
    )
    args = parser.parse_args()

    errors: list[str] = []
    try:
        manifest = json.loads(MANIFEST.read_text())
    except (OSError, json.JSONDecodeError) as failure:
        print(f"unreadable manifest {MANIFEST.relative_to(ROOT)}: {failure}", file=sys.stderr)
        print("FAILED: 1 excerpt-fixture violation(s)", file=sys.stderr)
        raise SystemExit(1)

    if manifest.get("schemaVersion") != SCHEMA_VERSION:
        errors.append(
            f"manifest schemaVersion is {manifest.get('schemaVersion')!r}, "
            f"this audit understands {SCHEMA_VERSION}"
        )
    scenes = manifest.get("scenes") or []
    if not scenes:
        errors.append("manifest declares no scenes")

    for field in ("id", "scene"):
        seen = [scene.get(field) for scene in scenes if isinstance(scene, dict)]
        duplicates = sorted({value for value in seen if seen.count(value) > 1})
        for value in duplicates:
            errors.append(f"manifest: duplicate {field} {value!r}")

    for index, scene in enumerate(scenes):
        audit_scene(scene, index, errors)

    receipts = sorted({scene["receipt"] for scene in scenes if isinstance(scene, dict) and "receipt" in scene})
    lectures = 0
    if args.lecture_tree is not None:
        if not args.lecture_tree.is_dir():
            errors.append(f"lecture tree not found: {args.lecture_tree}")
        else:
            lectures = audit_lecture_sources(receipts, args.lecture_tree, errors)

    if errors:
        print("\n".join(errors), file=sys.stderr)
        print(f"FAILED: {len(errors)} excerpt-fixture violation(s)", file=sys.stderr)
        raise SystemExit(1)

    literals = sum(len(scene["fixture"]["literals"]) for scene in scenes)
    variants = sum(len(scene["fixture"]["computedVariants"]) for scene in scenes)
    chapters = len({scene["qmd"] for scene in scenes})
    lecture_note = (
        f"; {lectures} recorded lecture source(s) re-verified"
        if args.lecture_tree is not None
        else ""
    )
    print(
        f"PASS: {len(scenes)} mechanism excerpt(s) mirror {literals} verbatim fixture "
        f"literal(s) across {chapters} chapter(s), with {variants} declared computed "
        f"variant(s), current chapter digests in {len(receipts)} receipt(s), live "
        f"anchors, and one declared timeline each{lecture_note}"
    )


if __name__ == "__main__":
    main()
