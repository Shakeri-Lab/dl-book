#!/usr/bin/env python3
"""Restore frozen PDF figures to Quarto's transient render directories."""

from __future__ import annotations

import shutil
import hashlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
FREEZE_ROOT = ROOT / "_freeze"


def copy_pdf(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)


def frozen_pdf_sources(freeze_root: Path) -> list[Path]:
    """Accept genuine PDF or LaTeX executions; reject ambiguous stale siblings."""
    by_destination: dict[tuple[Path, str], Path] = {}
    for figure_dir in ("figure-pdf", "figure-latex"):
        for source in sorted(freeze_root.glob(f"**/{figure_dir}/*.pdf")):
            unit = source.parent.parent.relative_to(freeze_root)
            key = unit, source.name
            previous = by_destination.get(key)
            if previous is not None:
                if hashlib.sha256(previous.read_bytes()).digest() != hashlib.sha256(
                    source.read_bytes()
                ).digest():
                    raise ValueError(
                        f"conflicting frozen PDF/LaTeX figures: {previous} and {source}; "
                        "regenerate the unit in a clean freeze"
                    )
                continue
            by_destination[key] = source
    return sorted(by_destination.values())


def main() -> None:
    frozen_pdfs = frozen_pdf_sources(FREEZE_ROOT)
    if not frozen_pdfs:
        raise SystemExit("no frozen PDF figures found")

    for source in frozen_pdfs:
        unit = source.parent.parent.relative_to(FREEZE_ROOT)
        transient_root = (ROOT / unit).with_name(f"{unit.name}_files")
        for figure_dir in ("figure-pdf", "figure-latex"):
            copy_pdf(source, transient_root / figure_dir / source.name)

    generated_pdfs = sorted((ROOT / "figures/generated").glob("*.pdf"))
    mediabag = ROOT / "index_files/mediabag/figures/generated"
    for source in generated_pdfs:
        copy_pdf(source, mediabag / source.name)

    print(
        f"materialized {len(frozen_pdfs)} frozen figures into both PDF render "
        f"directories and {len(generated_pdfs)} generated PDFs into the mediabag"
    )


if __name__ == "__main__":
    main()
