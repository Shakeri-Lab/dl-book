#!/usr/bin/env python3
"""Render both derived PDFs until their complete outlines reach a fixpoint."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
import hashlib
from pathlib import Path
import subprocess
import sys

import pymupdf


ROOT = Path(__file__).resolve().parents[1]


@dataclass(frozen=True)
class PdfProfile:
    name: str
    output: Path
    quarto_args: tuple[str, ...]


PROFILES = (
    PdfProfile(
        "print",
        ROOT / "_book" / "Deep-Learning--Making-It-Learnable.pdf",
        ("--to", "pdf"),
    ),
    PdfProfile(
        "continuous",
        ROOT / "_book" / "Deep-Learning--Making-It-Learnable--Continuous.pdf",
        ("--profile", "screen", "--to", "pdf"),
    ),
)


def run(command: list[str]) -> int:
    return subprocess.run(command, cwd=ROOT).returncode


def toc_checksum() -> str:
    """Hash the printed-ToC input retained by the no-clean render."""
    toc = ROOT / "index.toc"
    if not toc.is_file():
        raise SystemExit("PDF render did not retain index.toc")
    return hashlib.sha256(toc.read_bytes()).hexdigest()


def output_signature(pdf: Path) -> tuple[int, tuple[tuple[object, ...], ...], str]:
    """Capture page count, PDF outline, and printed-ToC input as one state."""
    with pymupdf.open(pdf) as document:
        outline = tuple(tuple(entry) for entry in document.get_toc())
        return len(document), outline, toc_checksum()


def render(profile: PdfProfile, max_attempts: int) -> None:
    build = ROOT / "build"
    build.mkdir(exist_ok=True)
    previous_signature: tuple[int, tuple[tuple[object, ...], ...], str] | None = None
    for attempt in range(1, max_attempts + 1):
        print(
            f"PDF outline fixpoint: {profile.name} attempt "
            f"{attempt}/{max_attempts}",
            flush=True,
        )
        if run([sys.executable, "scripts/materialize_frozen_pdf_assets.py"]):
            raise SystemExit("Failed to materialize frozen PDF assets")
        log = build / f"quarto-{profile.name}-render-attempt-{attempt}.log"
        command = [
            "quarto",
            "render",
            *profile.quarto_args,
            "--no-clean",
            "--debug",
            "--log",
            str(log),
        ]
        previous_mtime = (
            profile.output.stat().st_mtime_ns if profile.output.is_file() else None
        )
        if run(command):
            raise SystemExit(f"Quarto failed while rendering {profile.name} PDF")
        if not profile.output.is_file():
            raise SystemExit(f"Quarto did not create the {profile.name} PDF")
        current_mtime = profile.output.stat().st_mtime_ns
        if previous_mtime is not None and current_mtime == previous_mtime:
            raise SystemExit(
                f"Quarto did not freshly rewrite the {profile.name} PDF"
            )
        audit = [
            sys.executable,
            "scripts/audit_pdf.py",
            str(profile.output),
            "--outline-only",
        ]
        if run(audit) == 0:
            signature = output_signature(profile.output)
            if previous_signature == signature:
                page_count, outline, _ = signature
                print(
                    f"PDF outline fixpoint: {profile.name} stabilized on attempt "
                    f"{attempt} ({page_count} pages, {len(outline)} entries)",
                    flush=True,
                )
                return
            previous_signature = signature
            print(
                f"PDF outline fixpoint: {profile.name} passed attempt {attempt}; "
                "rendering once more to prove a stable PDF outline and printed ToC",
                flush=True,
            )
        else:
            previous_signature = None
    raise SystemExit(
        f"{profile.name} PDF outline did not stabilize after {max_attempts} renders"
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--max-attempts",
        type=int,
        default=3,
        help="Maximum full renders per profile (default: 3).",
    )
    parser.add_argument(
        "--profile",
        choices=("print", "continuous", "all"),
        default="all",
        help="Render one PDF profile or both (default: all).",
    )
    args = parser.parse_args()
    if args.max_attempts < 2:
        parser.error("--max-attempts must be at least 2 to prove a fixpoint")
    selected = (
        PROFILES
        if args.profile == "all"
        else tuple(profile for profile in PROFILES if profile.name == args.profile)
    )
    for profile in selected:
        render(profile, args.max_attempts)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
