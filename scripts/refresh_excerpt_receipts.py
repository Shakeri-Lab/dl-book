#!/usr/bin/env python3
"""Refresh chapter-hash rows in replay receipts after a reviewed prose edit.

audit_excerpt_fixtures.py fails when a chapter changes without its replay receipts
being re-read. After re-reading (no replay quotes the edited sentences, and every
fixture literal is still verbatim), this rewrites only the SHA-256 cells of
`chapters/*.qmd` rows in docs/*-excerpt*.md and docs/*-excerpts.md. It refuses to
run while any scene's fixture literal is missing from its chapter.
"""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROW_RE = re.compile(r"(\|\s*`)(chapters/[^`]+\.qmd)(`\s*\|\s*`)([0-9a-f]{64})(`\s*\|)")


def main() -> int:
    manifest = json.loads((ROOT / "interactives" / "manifest.json").read_text())
    for scene in manifest["scenes"]:
        chapter = (ROOT / scene["qmd"]).read_text()
        missing = [literal for literal in scene["fixture"]["literals"] if literal not in chapter]
        if missing:
            raise SystemExit(f"{scene['id']}: fixture literal missing: {missing[0][:60]!r}")
    digests: dict[str, str] = {}

    def digest(relative: str) -> str:
        if relative not in digests:
            digests[relative] = hashlib.sha256((ROOT / relative).read_bytes()).hexdigest()
        return digests[relative]

    changed = 0
    receipts = sorted({*ROOT.glob("docs/*-excerpt*.md"), *ROOT.glob("docs/*-excerpts.md")})
    for receipt in receipts:
        text = receipt.read_text()

        def refresh(match: re.Match[str]) -> str:
            nonlocal changed
            current = digest(match.group(2))
            if current == match.group(4):
                return match.group(0)
            changed += 1
            return match.group(1) + match.group(2) + match.group(3) + current + match.group(5)

        updated = ROW_RE.sub(refresh, text)
        if updated != text:
            receipt.write_text(updated)
    print(f"refreshed {changed} chapter-hash row(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
