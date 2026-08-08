#!/usr/bin/env python3
"""Fail when rendered HTML references a missing local stylesheet or script."""

from __future__ import annotations

import argparse
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


class SupportAssetParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.assets: list[tuple[str, str]] = []

    def handle_starttag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        values = dict(attrs)
        if tag == "link" and "stylesheet" in (values.get("rel") or "").split():
            if href := values.get("href"):
                self.assets.append(("stylesheet", href))
        elif tag == "script" and (src := values.get("src")):
            self.assets.append(("script", src))


def local_asset(page: Path, root: Path, raw_url: str) -> Path | None:
    parsed = urlsplit(raw_url)
    if parsed.scheme or parsed.netloc or raw_url.startswith(("//", "data:")):
        return None
    asset_path = unquote(parsed.path)
    if not asset_path:
        return None
    if asset_path.startswith("/"):
        return root / asset_path.lstrip("/")
    return page.parent / asset_path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "root",
        nargs="?",
        default="_book",
        type=Path,
        help="rendered HTML root (default: _book)",
    )
    args = parser.parse_args()
    root = args.root.resolve()
    pages = sorted(root.rglob("*.html"))
    if not pages:
        print(f"FAILED: no rendered HTML pages under {root}")
        return 1

    checked: set[Path] = set()
    missing: dict[tuple[str, Path], list[Path]] = {}
    for page in pages:
        html_parser = SupportAssetParser()
        html_parser.feed(page.read_text(encoding="utf-8"))
        for kind, raw_url in html_parser.assets:
            asset = local_asset(page, root, raw_url)
            if asset is None:
                continue
            resolved = asset.resolve()
            checked.add(resolved)
            if not resolved.is_file():
                missing.setdefault((kind, resolved), []).append(page.relative_to(root))

    if missing:
        for (kind, asset), affected_pages in sorted(
            missing.items(), key=lambda item: str(item[0][1])
        ):
            try:
                label = asset.relative_to(root)
            except ValueError:
                label = asset
            sample = ", ".join(str(page) for page in affected_pages[:3])
            if len(affected_pages) > 3:
                sample += ", …"
            print(
                f"missing {kind} {label} "
                f"({len(affected_pages)} page(s): {sample})"
            )
        print(
            f"FAILED: {len(missing)} missing unique HTML support asset(s) "
            f"across {len(pages)} page(s)"
        )
        return 1

    print(
        f"HTML support assets: pass ({len(pages)} pages, "
        f"{len(checked)} unique local stylesheets/scripts)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
