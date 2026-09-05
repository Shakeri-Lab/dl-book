#!/usr/bin/env python3
"""Small real-Quarto proof of Part layout and two-directory PDF reproducibility.

This is a conversion smoke test, not a substitute for the complete book's audits.
It retains its tiny PDFs and first Part PNGs under build/pdf-smoke/ for inspection.
"""

from __future__ import annotations

import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

import pymupdf

from pdf_build_contract import build_environment, consumed_inputs, sha256, source_state

ROOT = Path(__file__).resolve().parents[1]


def normalized(text: str) -> str:
    return re.sub(r"\W+", " ", text.casefold()).strip()


def main() -> None:
    destination = ROOT / "build" / "pdf-smoke"
    destination.mkdir(parents=True, exist_ok=True)
    env = build_environment(source_state(ROOT))
    source_parts = sorted((ROOT / "chapters/parts").glob("*.qmd"))
    assert len(source_parts) == 5
    results = {}
    with tempfile.TemporaryDirectory(prefix="dlbook-pdf-smoke-") as directory:
        for run in (1, 2):
            root = Path(directory) / f"run-{run}"
            root.mkdir()
            (root / "filters").mkdir()
            (root / "tex").mkdir()
            shutil.copy2(ROOT / "filters/pdf-part-preamble.lua", root / "filters")
            shutil.copy2(ROOT / "tex/reproducible.tex", root / "tex")
            (root / "index.qmd").write_text("# Preface {.unnumbered}\n\nConversion fixture.\n")
            chapters = ["    - index.qmd"]
            for index, part in enumerate(source_parts, start=1):
                shutil.copy2(part, root / part.name)
                chapter = f"chapter-{index}.qmd"
                (root / chapter).write_text(f"# Chapter witness {index}\n\nThe body follows its Part.\n")
                chapters.extend([f"    - part: {part.name}", "      chapters:", f"        - {chapter}"])
            (root / "_quarto.yml").write_text(
                "project:\n  type: book\nbook:\n  title: PDF conversion fixture\n"
                "  author: Heman Shakeri\n  date: 2026-09-04\n  output-file: fixture\n"
                "  chapters:\n" + "\n".join(chapters) + "\n"
                "filters:\n  - path: filters/pdf-part-preamble.lua\n    at: pre-quarto\n"
                "format:\n  pdf:\n    documentclass: scrbook\n    pdf-engine: lualatex\n"
                "    pdf-engine-opts: ['-recorder']\n    keep-tex: true\n"
                "    latex-clean: false\n    latex-min-runs: 3\n"
                "    include-in-header: tex/reproducible.tex\n    geometry:\n      - margin=0.85in\n"
            )
            (root / "_quarto-screen.yml").write_text(
                "book:\n  output-file: fixture-continuous\nformat:\n  pdf:\n"
                "    classoption:\n      - oneside\n      - open=any\n"
            )
            for profile in ("print", "continuous"):
                command = ["quarto", "render", "--to", "pdf", "--no-clean"]
                if profile == "continuous":
                    command.extend(["--profile", "screen"])
                log = destination / f"{profile}-{run}.log"
                with log.open("w") as stream:
                    subprocess.run(command, cwd=root, env=env, stdout=stream,
                                   stderr=subprocess.STDOUT, check=True)
                name = "fixture" if profile == "print" else "fixture-continuous"
                pdf = root / "_book" / f"{name}.pdf"
                shutil.copy2(pdf, destination / f"{profile}-{run}.pdf")
                with pymupdf.open(pdf) as document:
                    for index, part in enumerate(source_parts):
                        title, body = part.read_text().split("\n", 1)
                        title = title.removeprefix("# ")
                        entry = next(row for row in document.get_toc() if row[1] == title)
                        page = document[entry[2] - 1]
                        page_text = normalized(page.get_text())
                        assert normalized(title) in page_text, entry
                        assert normalized(body) in page_text, (profile, title, "preamble separated or missing")
                        if index == 0:
                            page.get_pixmap(matrix=pymupdf.Matrix(1.3, 1.3)).save(
                                destination / f"{profile}-{run}-part1.png"
                            )
                    assert "Missing character" not in log.read_text()
                    assert "\ufffd" not in "".join(page.get_text() for page in document)
                    assert document.metadata["author"] == "Heman Shakeri"
                    results[f"{profile}-{run}"] = {
                        "sha256": sha256(pdf), "pages": len(document),
                        "engine_inputs": consumed_inputs(root),
                    }
        for profile in ("print", "continuous"):
            assert results[f"{profile}-1"] == results[f"{profile}-2"], profile
    (destination / "results.json").write_text(json.dumps(results, indent=2) + "\n")
    print("PASS: five Part paragraphs share their own outline-target pages in both profiles.")
    print("PASS: both profiles are byte-identical across fresh directories; metadata retained.")
    print(f"Inspect conversion fixtures: {destination}")


if __name__ == "__main__":
    main()
