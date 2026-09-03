#!/usr/bin/env python3
"""Validated, language-neutral manifest for the public notebook edition."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
import json
from pathlib import Path
import re
from typing import Any


SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
MANIFEST_PATH = SCRIPT_DIR / "notebook_manifest.json"
REQUIREMENTS_PATH = SCRIPT_DIR / "notebook_requirements.txt"
EXPECTED_NOTEBOOKS = 26
EXPECTED_EXECUTION_SHARDS = 6


@dataclass(frozen=True)
class SupportSelector:
    """Select non-plot setup from one hidden executable source cell."""

    cell_label: str | None = None
    cell_ordinal: int | None = None
    delimited: bool = False


@dataclass(frozen=True)
class NotebookUnit:
    """One public notebook and the local artifacts needed to execute it."""

    source: str
    slug: str
    assets: tuple[str, ...] = ()
    support: SupportSelector | None = None


def _load_requirements() -> tuple[str, ...]:
    requirements = tuple(
        line.strip()
        for line in REQUIREMENTS_PATH.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.lstrip().startswith("#")
    )
    invalid = [
        item
        for item in requirements
        if not re.fullmatch(r"[A-Za-z0-9_.-]+==[^=\s]+", item)
    ]
    if invalid:
        raise ValueError(
            "Notebook requirements must be exact name==version pins: "
            + ", ".join(invalid)
        )
    return requirements


def _support_selector(raw: Any) -> SupportSelector | None:
    if raw is None:
        return None
    if not isinstance(raw, dict):
        raise TypeError("Notebook support selectors must be JSON objects")
    selector = SupportSelector(
        cell_label=raw.get("cell_label"),
        cell_ordinal=raw.get("cell_ordinal"),
        delimited=bool(raw.get("delimited", False)),
    )
    if (selector.cell_label is None) == (selector.cell_ordinal is None):
        raise ValueError(
            "Each support selector needs exactly one of cell_label or cell_ordinal"
        )
    if selector.cell_ordinal is not None and selector.cell_ordinal < 1:
        raise ValueError("Support cell ordinals are one-based positive integers")
    return selector


def _load_document() -> dict[str, Any]:
    document = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    if not isinstance(document, dict):
        raise TypeError("Notebook manifest must be a JSON object")
    if document.get("schema_version") != 1:
        raise ValueError("Unsupported notebook manifest schema")
    return document


def _load_units(document: dict[str, Any]) -> tuple[NotebookUnit, ...]:
    raw_units = document.get("notebooks")
    if not isinstance(raw_units, list):
        raise TypeError("Notebook manifest needs a top-level notebooks list")

    units = tuple(
        NotebookUnit(
            source=item["source"],
            slug=item["slug"],
            assets=tuple(item.get("assets", ())),
            support=_support_selector(item.get("support")),
        )
        for item in raw_units
    )
    if len(units) != EXPECTED_NOTEBOOKS:
        raise ValueError(
            f"Expected {EXPECTED_NOTEBOOKS} notebook units, found {len(units)}"
        )
    sources = [unit.source for unit in units]
    slugs = [unit.slug for unit in units]
    if len(set(sources)) != len(sources):
        raise ValueError("Notebook source paths must be unique")
    if len(set(slugs)) != len(slugs):
        raise ValueError("Notebook slugs must be unique")
    for unit in units:
        source_path = PROJECT_ROOT / unit.source
        if not source_path.is_file():
            raise FileNotFoundError(f"Notebook source does not exist: {unit.source}")
        if source_path.suffix != ".qmd":
            raise ValueError(f"Notebook source is not QMD: {unit.source}")
        if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", unit.slug):
            raise ValueError(f"Invalid notebook slug: {unit.slug}")
    return units


def _load_execution_shards(
    document: dict[str, Any], units: tuple[NotebookUnit, ...]
) -> tuple[tuple[str, ...], ...]:
    raw_shards = document.get("execution_shards")
    if (
        not isinstance(raw_shards, list)
        or len(raw_shards) != EXPECTED_EXECUTION_SHARDS
    ):
        raise ValueError(
            f"Notebook manifest needs exactly {EXPECTED_EXECUTION_SHARDS} execution shards"
        )
    shards: list[tuple[str, ...]] = []
    for index, raw in enumerate(raw_shards):
        if not isinstance(raw, list) or not raw:
            raise TypeError(f"Execution shard {index} must be a nonempty JSON list")
        if not all(isinstance(slug, str) for slug in raw):
            raise TypeError(f"Execution shard {index} contains a non-string slug")
        shards.append(tuple(raw))

    flattened = [slug for shard in shards for slug in shard]
    expected = [unit.slug for unit in units]
    if len(flattened) != len(set(flattened)):
        raise ValueError("Execution shards contain a duplicate notebook slug")
    if set(flattened) != set(expected):
        missing = sorted(set(expected) - set(flattened))
        extra = sorted(set(flattened) - set(expected))
        raise ValueError(
            f"Execution shards differ from notebook units; missing={missing}, extra={extra}"
        )
    return tuple(shards)


MANIFEST_DOCUMENT = _load_document()
PINNED_REQUIREMENTS = _load_requirements()
NOTEBOOK_UNITS = _load_units(MANIFEST_DOCUMENT)
EXECUTION_SHARDS = _load_execution_shards(MANIFEST_DOCUMENT, NOTEBOOK_UNITS)
UNITS_BY_SLUG = {unit.slug: unit for unit in NOTEBOOK_UNITS}
UNITS_BY_SOURCE = {unit.source: unit for unit in NOTEBOOK_UNITS}


def shard_slugs(index: int, count: int = EXPECTED_EXECUTION_SHARDS) -> tuple[str, ...]:
    """Return the checked, deterministic execution shard requested by CI."""

    if count != len(EXECUTION_SHARDS):
        raise ValueError(
            f"This manifest defines {len(EXECUTION_SHARDS)} shards, not {count}"
        )
    if index < 0 or index >= count:
        raise ValueError(f"Shard index must be in [0, {count - 1}], got {index}")
    return EXECUTION_SHARDS[index]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    output = parser.add_mutually_exclusive_group(required=True)
    output.add_argument(
        "--list-slugs",
        action="store_true",
        help="Print one selected notebook slug per line",
    )
    output.add_argument(
        "--list-slugs-json",
        action="store_true",
        help="Print selected notebook slugs as a compact JSON array",
    )
    output.add_argument(
        "--list-shards-json",
        action="store_true",
        help="Print all checked execution shards as compact JSON",
    )
    parser.add_argument("--shard-index", type=int)
    parser.add_argument("--shard-count", type=int)
    args = parser.parse_args()

    if args.list_shards_json:
        if args.shard_index is not None or args.shard_count is not None:
            parser.error("--list-shards-json cannot be combined with shard selection")
        print(json.dumps(EXECUTION_SHARDS, separators=(",", ":")))
        return 0

    if (args.shard_index is None) != (args.shard_count is None):
        parser.error("--shard-index and --shard-count must be supplied together")
    if args.shard_index is None:
        selected = tuple(unit.slug for unit in NOTEBOOK_UNITS)
    else:
        try:
            selected = shard_slugs(args.shard_index, args.shard_count)
        except ValueError as error:
            parser.error(str(error))

    if args.list_slugs_json:
        print(json.dumps(selected, separators=(",", ":")))
    else:
        print("\n".join(selected))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
