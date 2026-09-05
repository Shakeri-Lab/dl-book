#!/usr/bin/env python3
"""Render both derived PDFs until their complete outlines reach a fixpoint."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

import pymupdf

from pdf_build_contract import (
    build_environment, consumed_inputs, input_manifest, manifest_digest,
    sha256, snapshot, source_state, tool_versions,
)


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


def run(command: list[str], env: dict[str, str]) -> int:
    return subprocess.run(command, cwd=ROOT, env=env).returncode


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


def render(profile: PdfProfile, max_attempts: int, env: dict[str, str]) -> None:
    build = ROOT / "build"
    build.mkdir(exist_ok=True)
    previous_signature: tuple[int, tuple[tuple[object, ...], ...], str] | None = None
    for attempt in range(1, max_attempts + 1):
        print(
            f"PDF outline fixpoint: {profile.name} attempt "
            f"{attempt}/{max_attempts}",
            flush=True,
        )
        if run([sys.executable, "scripts/materialize_frozen_pdf_assets.py"], env):
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
        if run(command, env):
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
        if run(audit, env) == 0:
            signature = output_signature(profile.output)
            if previous_signature == signature:
                page_count, outline, _ = signature
                print(
                    f"PDF outline fixpoint: {profile.name} stabilized on attempt "
                    f"{attempt} ({page_count} pages, {len(outline)} entries)",
                    flush=True,
                )
                record = {
                    "source": source_state(ROOT),
                    "profile": profile.name,
                    "pdf_sha256": sha256(profile.output),
                    "pages": page_count,
                    "outline_entries": len(outline),
                    "environment": {key: env[key] for key in (
                        "SOURCE_DATE_EPOCH", "FORCE_SOURCE_DATE", "TZ", "LC_ALL",
                        "PYTHONHASHSEED",
                    )},
                    "tools": tool_versions(ROOT, env),
                    "engine_inputs": consumed_inputs(ROOT),
                }
                (build / f"pdf-{profile.name}-manifest.json").write_text(
                    json.dumps(record, indent=2, sort_keys=True) + "\n"
                )
                # Keep both profiles' actual engine logs, not only whichever ran last.
                for suffix in ("log", "fls", "toc"):
                    retained = ROOT / f"index.{suffix}"
                    if retained.is_file():
                        shutil.copy2(retained, build / f"pdf-{profile.name}.{suffix}")
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


def retain_build_diagnostics(checkout: Path, destination: Path, number: int) -> None:
    """Retain available evidence before either worker success or temporary-tree cleanup."""
    candidates = [checkout / f"index.{suffix}" for suffix in ("log", "fls", "toc")]
    for pattern in ("quarto-*-render-attempt-*.log", "pdf-*.log", "pdf-*.fls", "pdf-*.toc"):
        candidates.extend(sorted((checkout / "build").glob(pattern)))
    for source in candidates:
        if source.is_file():
            shutil.copy2(source, destination / f"repro-{number}-{source.name}")


def verify_reproducible(selected: tuple[PdfProfile, ...], max_attempts: int) -> None:
    """Two fresh input trees, one toolchain, no inherited Quarto/LaTeX aux files."""
    state = source_state(ROOT)
    manifest = input_manifest(ROOT)
    env = build_environment(state)
    build = ROOT / "build"
    build.mkdir(exist_ok=True)
    success_record = build / "pdf-reproducibility.json"
    # A failed new attempt must not leave a previous attempt's success sentinel.
    success_record.unlink(missing_ok=True)
    with tempfile.TemporaryDirectory(prefix="dlbook-pdf-repro-") as temporary:
        results = []
        for number in (1, 2):
            checkout = Path(temporary) / f"build-{number}"
            snapshot(ROOT, checkout, manifest, state)
            profile_arg = selected[0].name if len(selected) == 1 else "all"
            command = [sys.executable, "scripts/render_pdf_profiles.py", "--profile",
                       profile_arg, "--max-attempts", str(max_attempts)]
            log = build / f"pdf-repro-build-{number}.log"
            print(f"Reproducible PDF gate: fresh build {number}/2 (log: {log})", flush=True)
            with log.open("w") as stream:
                outcome = subprocess.run(command, cwd=checkout, env=env,
                                         stdout=stream, stderr=subprocess.STDOUT)
            # Quarto/LaTeX may fail before a per-profile manifest can be written.
            # Keep their evidence while the isolated checkout still exists.
            retain_build_diagnostics(checkout, build, number)
            if outcome.returncode:
                raise SystemExit(
                    f"Fresh PDF build {number} failed; inspect {log} and "
                    f"available diagnostics in {build}/repro-{number}-*"
                )
            row = {}
            for profile in selected:
                filename = f"pdf-{profile.name}-manifest.json"
                record_path = checkout / "build" / filename
                row[profile.name] = json.loads(record_path.read_text())
                shutil.copy2(record_path, build / f"repro-{number}-{filename}")
                shutil.copy2(checkout / profile.output.relative_to(ROOT),
                             build / f"repro-{number}-pdf-{profile.name}.pdf")
            results.append(row)
        if input_manifest(ROOT) != manifest:
            raise SystemExit("Book inputs changed during reproducibility verification; restart")
        for profile in selected:
            first, second = (result[profile.name] for result in results)
            if first != second:
                raise SystemExit(
                    f"{profile.name} is not byte-reproducible under identical recorded inputs; "
                    f"compare build/repro-{{1,2}}-pdf-{profile.name}-manifest.json"
                )
        # Validate the complete selected set before replacing any installed PDF.
        # A mismatch in the second profile must leave both previous artifacts intact.
        for profile in selected:
            # Publish only the verified fresh artifact, never a stale local output.
            source = Path(temporary) / "build-2" / profile.output.relative_to(ROOT)
            profile.output.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, profile.output)
            shutil.copy2(Path(temporary) / "build-2" / "build" /
                         f"pdf-{profile.name}-manifest.json", build /
                         f"pdf-{profile.name}-manifest.json")
            for suffix in ("log", "fls", "toc"):
                retained = build / f"repro-2-pdf-{profile.name}.{suffix}"
                if retained.is_file():
                    shutil.copy2(retained, build / f"pdf-{profile.name}.{suffix}")
        success_record.write_text(json.dumps({
            "source": state,
            "input_sha256": manifest_digest(manifest),
            "fresh_builds": 2,
            "profiles": {name: record["pdf_sha256"] for name, record in results[0].items()},
        }, indent=2, sort_keys=True) + "\n")
    print("Both fresh builds agree byte-for-byte for every selected PDF profile.", flush=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--verify-reproducible",
        action="store_true",
        help="Build twice in fresh input trees, require exact hashes, then install verified PDFs.",
    )
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
    if args.verify_reproducible:
        verify_reproducible(selected, args.max_attempts)
    else:
        env = build_environment(source_state(ROOT))
        # An editable installation may point at a different (or offline) checkout.
        # Any unexpectedly unfrozen cell must import this snapshot's own code.
        env["PYTHONPATH"] = str(ROOT / "code")
        for profile in selected:
            render(profile, args.max_attempts, env)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
