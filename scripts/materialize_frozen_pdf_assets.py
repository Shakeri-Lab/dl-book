#!/usr/bin/env python3
"""Restore frozen PDF figures to Quarto's transient render directories."""

from __future__ import annotations

import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
FREEZE_ROOT = ROOT / "_freeze"


def copy_pdf(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)


def main() -> None:
    frozen_pdfs = sorted(FREEZE_ROOT.glob("**/figure-pdf/*.pdf"))
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
