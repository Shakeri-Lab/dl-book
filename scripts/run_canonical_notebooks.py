#!/usr/bin/env python3
"""Validate exported notebooks in the promoted freeze's exact sealed CPU image.

The host prepares a verified image locator. The image executes public/reference
twins offline with isolated, checksum-verified asset roots and records real kernel
observations. Native Ubuntu portability reports are a different workflow.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

from compare_freeze_runs import kernel_identity, runtime_identity
from freeze_provenance import cpu_observation, runtime_observation, sha256, write_json
from promote_canonical_freeze import _safe_path, verify_installed

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE_REPOSITORY = "shakeri-lab/dl-book"
DIGEST = re.compile(r"[0-9a-f]{64}")
ASSET_NAME = re.compile(r"[A-Za-z0-9][A-Za-z0-9._-]*")


def archive_locator(root: Path, fingerprint: dict) -> dict | None:
    """Read only an author-selected, content-addressed release locator.

    The provenance directory is outside the executable-input inventory. Creating
    this record never creates a release, changes a tag, or uploads an asset.
    """
    image_id = fingerprint["container"]["digest"]
    if not re.fullmatch(r"sha256:[0-9a-f]{64}", image_id):
        raise ValueError("Canonical image ID is invalid")
    path = _safe_path(root / "provenance/canonical-images" / f"{image_id[7:]}.json")
    if not path.exists():
        return None
    document = json.loads(path.read_text())
    if (document.get("schema_version") != 1 or document.get("image_id") != image_id
            or document.get("canonical_source_commit") != fingerprint["source"]["commit"]
            or document.get("repository") != ARCHIVE_REPOSITORY
            or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._/-]*", document.get("release_tag", ""))
            or not DIGEST.fullmatch(document.get("archive_sha256", ""))):
        raise ValueError("Invalid or mismatched immutable image archive locator")
    parts = document.get("archive_assets")
    if not isinstance(parts, list) or not 1 <= len(parts) <= 32:
        raise ValueError("Archive locator needs an ordered, bounded list of archive assets")
    assets = [*parts, document.get("manifest_asset")]
    names = []
    for asset in assets:
        if (not isinstance(asset, dict) or set(asset) != {"name", "sha256"}
                or not ASSET_NAME.fullmatch(asset.get("name", ""))
                or not DIGEST.fullmatch(asset.get("sha256", ""))):
            raise ValueError("Invalid release asset name or SHA-256")
        names.append(asset["name"])
    if len(set(names)) != len(names):
        raise ValueError("Release asset names must be unique")
    return document


def find_receipt(root: Path, fingerprint: dict, fingerprint_sha: str) -> Path:
    archive = _safe_path(root / "provenance/canonical-freezes")
    commit = fingerprint["source"]["commit"]
    if not re.fullmatch(r"[0-9a-f]{40}", commit):
        raise ValueError("Promoted fingerprint has no full source commit")
    matches = []
    for receipt in archive.glob(f"{commit}-*/promotion.json"):
        _safe_path(receipt)
        document = json.loads(receipt.read_text())
        hashes = document.get("fingerprint_sha256")
        if (document.get("source_commit") == commit and isinstance(hashes, list)
                and len(hashes) == 2 and hashes[0] == fingerprint_sha):
            matches.append(receipt.parent)
    if len(matches) != 1:
        raise ValueError(f"Expected one immutable proof receipt for the installed fingerprint; found {len(matches)}")
    errors = verify_installed(root, matches[0])
    if errors:
        raise ValueError("Installed canonical freeze/evidence is invalid: " + "; ".join(errors))
    return matches[0]


def prepare(root: Path) -> dict:
    root = _safe_path(root)
    path = _safe_path(root / "_freeze/provenance.json")
    fingerprint = json.loads(path.read_text())
    fingerprint_sha = sha256(path)
    proof = find_receipt(root, fingerprint, fingerprint_sha)
    source_commit = fingerprint["source"]["commit"]
    run_id = str(fingerprint["run"]["ci"].get("GITHUB_RUN_ID", ""))
    if not re.fullmatch(r"[0-9]+", run_id):
        raise ValueError("The first canonical run has no numeric Actions image-artifact run ID")
    publication_commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=root, text=True).strip()
    git_epoch = subprocess.check_output(["git", "show", "-s", "--format=%ct", source_commit],
                                        cwd=root, text=True).strip()
    epoch = fingerprint["runtime"]["environment"].get("SOURCE_DATE_EPOCH", "")
    if not isinstance(epoch, str) or not re.fullmatch(r"[1-9][0-9]*", epoch) or epoch != git_epoch:
        raise ValueError("Recorded canonical SOURCE_DATE_EPOCH does not match its original source commit")
    # Runtime helpers and the wheel/recipe inputs cannot change merely because
    # the generated freeze and notebook URL commit follow the execution commit.
    source_files = fingerprint["source"]["files_sha256"]
    recipe_names = {name for name in source_files if name.startswith("container/")}
    current_recipe = {path.relative_to(root).as_posix() for path in (root / "container").rglob("*")
                      if path.is_file() and path.suffix != ".pyc" and "__pycache__" not in path.parts}
    if recipe_names != current_recipe:
        raise ValueError("Current container recipe inventory differs from the executed image")
    for name in sorted(recipe_names | {"scripts/run_canonical_freeze.py"}):
        path = _safe_path(root / name)
        if not path.is_file() or sha256(path) != source_files.get(name):
            raise ValueError(f"Current canonical runtime input changed: {name}")
    # A Quarto freeze contains rendered manuscript Markdown, not only numerical
    # stdout. Even an editorial change to an executable unit needs a fresh freeze;
    # a publication-only commit may add proofs/export tooling, not stale prose.
    for name, specification in fingerprint["execution_plan"]["units"].items():
        path = _safe_path(root / name)
        if (not path.is_relative_to(root) or not path.is_file()
                or sha256(path) != specification["source_sha256"]):
            raise ValueError(f"Executable manuscript unit changed since canonical execution: {name}")
    return {
        "schema_version": 1, "canonical_source_commit": source_commit,
        "publication_commit": publication_commit, "image_run_id": run_id,
        "image_id": fingerprint["container"]["digest"], "source_date_epoch": epoch,
        "fingerprint_sha256": fingerprint_sha,
        "proof_directory": proof.relative_to(root).as_posix(),
        "archive_locator": archive_locator(root, fingerprint),
    }


def checked_context(root: Path, path: Path) -> tuple[dict, dict]:
    recorded = json.loads(path.read_text())
    current = prepare(root)
    if recorded != current:
        raise ValueError("Canonical notebook context changed since preparation")
    return current, json.loads((root / "_freeze/provenance.json").read_text())


def verify_image(root: Path, context: dict, archive: Path, manifest: Path) -> str:
    archive, manifest = _safe_path(archive), _safe_path(manifest)
    locator = context.get("archive_locator")
    if locator and (sha256(archive) != locator["archive_sha256"]
                    or sha256(manifest) != locator["manifest_asset"]["sha256"]):
        raise ValueError("Release image or original manifest differs from its selected archive locator")
    specification = importlib.util.spec_from_file_location("dlbook_image_artifact", root / "container/image_artifact.py")
    module = importlib.util.module_from_spec(specification)
    assert specification.loader is not None
    specification.loader.exec_module(module)
    image_id = module.verify(json.loads(manifest.read_text()), archive,
                             module.identity_inputs(root, context["canonical_source_commit"]))
    if image_id != context["image_id"]:
        raise ValueError("Saved image content ID differs from the promoted numerical fingerprint")
    return image_id


def fetch_image(root: Path, context: dict, output: Path) -> None:
    """Download explicitly named release assets on the host; never execute them."""
    locator = context.get("archive_locator")
    if locator is None:
        raise ValueError("No explicit durable archive locator; use the recorded Actions artifact")
    output = _safe_path(output)
    if (output / "image.tar.gz").exists() or (output / "image.json").exists():
        raise ValueError("Refusing to overwrite an existing image archive")
    output.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="image-download-", dir=output) as temporary:
        staging = Path(temporary)
        assets = [*locator["archive_assets"], locator["manifest_asset"]]
        for asset in assets:
            subprocess.run(["gh", "release", "download", locator["release_tag"],
                            "--repo", locator["repository"], "--pattern", asset["name"],
                            "--dir", str(staging)], check=True)
            path = _safe_path(staging / asset["name"])
            if not path.is_file() or sha256(path) != asset["sha256"]:
                raise ValueError(f"Release asset checksum mismatch: {asset['name']}")
        # Parts, when needed for release size limits, are concatenated in the
        # explicitly recorded order. This does not regenerate/recompress images.
        archive = staging / "assembled-image.tar.gz"
        if archive.exists():
            raise ValueError("Release asset name collides with the assembly path")
        with archive.open("wb") as target:
            for asset in locator["archive_assets"]:
                with (staging / asset["name"]).open("rb") as source:
                    shutil.copyfileobj(source, target)
        manifest = staging / locator["manifest_asset"]["name"]
        verify_image(root, context, archive, manifest)
        shutil.copy2(archive, output / "image.tar.gz")
        shutil.copy2(manifest, output / "image.json")


def stage_assets(root: Path, notebook: dict, runtime: Path, context: dict,
                 canonical_files: dict[str, str]) -> None:
    metadata = notebook["metadata"]["dlbook"]
    if metadata["revision"] != context["publication_commit"]:
        raise ValueError("Notebook asset URLs do not point to this publication commit")
    book_root = runtime / f"dl-book-{metadata['revision'][:12]}"
    for record in metadata["assets"]:
        name = Path(record["path"])
        if name.is_absolute() or ".." in name.parts or not name.parts:
            raise ValueError("Unsafe notebook asset path")
        source = _safe_path(root / name)
        if (canonical_files.get(name.as_posix()) != record["sha256"]
                or not source.is_file() or sha256(source) != record["sha256"]):
            raise ValueError(f"Notebook asset differs from the canonical execution: {name}")
        destination = book_root / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)


def check_kernel_probes(directory: Path, unit: str, form: str, expected: dict) -> None:
    observations = sorted(directory.glob("*.json"))
    if len(observations) != 1:
        raise ValueError(f"Expected exactly one actual startup probe for {unit}/{form}")
    document = json.loads(_safe_path(observations[0]).read_text())
    if (document.get("schema_version") != 1 or document.get("unit") != unit
            or document.get("format") != f"notebook-{form}"
            or document.get("scope") != "executed kernel startup, before chapter cells"
            or kernel_identity(document) != expected):
        raise ValueError(f"Actual {unit}/{form} kernel identity differs from canonical execution")


def execute(root: Path, context_path: Path, shard: int, shard_count: int) -> None:
    from notebook_manifest import UNITS_BY_SLUG, shard_slugs
    context, fingerprint = checked_context(root, context_path)
    if os.environ.get("SOURCE_DATE_EPOCH") != context["source_date_epoch"]:
        raise ValueError("Notebook SOURCE_DATE_EPOCH differs from the canonical source")
    observed = runtime_observation()
    if runtime_identity(observed) != runtime_identity(fingerprint["runtime"]):
        raise ValueError("Notebook driver software/thread/dispatch identity differs from the canonical image")
    build = root / "build/notebooks"
    evidence = build / "evidence"
    evidence.mkdir(parents=True, exist_ok=True)
    write_json(evidence / "runtime.json", {"runtime": observed, "cpu": cpu_observation(), "context": context})
    if shutil.which("git") is None:
        raise ValueError("Sealed notebook image must provide Git for the source-identity audit")
    # Complement the full planned-QMD hash gate with inventory, dependency and
    # execution-setting checks, including newly added cells or data/code inputs.
    subprocess.run([sys.executable, str(root / "scripts/audit_execution_identity.py"),
                    "--base", context["canonical_source_commit"],
                    "--report", str(evidence / "execution-identity.json")], cwd=root, check=True)
    units = tuple(UNITS_BY_SLUG[slug] for slug in shard_slugs(shard, shard_count))
    if not units:
        raise ValueError("Notebook shard has no units")
    audit_args = [argument for unit in units for argument in ("--slug", unit.slug)]
    source_audit = [sys.executable, str(root / "scripts/audit_notebook_exports.py"), str(build / "source"),
                    "--reference-source-dir", str(build / "reference-source")]
    # Refuse altered/missing/extra executable source before launching any study.
    subprocess.run([*source_audit, *audit_args], cwd=root, check=True)
    expected_kernel = kernel_identity(fingerprint["execution_probes"][0]["observation"])
    for unit in units:
        slug = unit.slug
        for form, source_dir, output_dir in (
            ("public", "source", "executed"),
            ("reference", "reference-source", "reference-executed"),
        ):
            original = build / source_dir / f"{slug}.ipynb"
            notebook = json.loads(original.read_text())
            if notebook["metadata"]["dlbook"]["source"] != unit.source:
                raise ValueError("Notebook source does not match the manifest unit")
            with tempfile.TemporaryDirectory(prefix=f"dlbook-{slug}-{form}-") as temporary:
                isolated = Path(temporary)
                runtime = isolated / "assets"
                stage_assets(root, notebook, runtime, context, fingerprint["source"]["files_sha256"])
                source = isolated / f"{slug}.ipynb"
                shutil.copy2(original, source)
                output = build / output_dir
                output.mkdir(parents=True, exist_ok=True)
                probes = evidence / "kernels" / slug / form
                probes.mkdir(parents=True, exist_ok=False)
                env = {key: value for key, value in os.environ.items() if key != "PYTHONPATH"}
                env.update(DLBOOK_NOTEBOOK_ROOT=str(runtime), DLBOOK_NOTEBOOK_CANONICAL="1",
                           DLBOOK_KERNEL_PROBE_DIR=str(probes), DLBOOK_EXECUTION_UNIT=unit.source,
                           DLBOOK_EXECUTION_FORMAT=f"notebook-{form}", PYTHONNOUSERSITE="1")
                log = evidence / f"{slug}-{form}.log"
                with log.open("w") as stream:
                    subprocess.run([sys.executable, "-m", "nbconvert", "--to", "notebook",
                                    "--execute", str(source), "--output", f"{slug}.ipynb",
                                    "--output-dir", str(output), "--ExecutePreprocessor.timeout=3600"],
                                   cwd=isolated, env=env, stdout=stream, stderr=subprocess.STDOUT, check=True)
                check_kernel_probes(probes, unit.source, form, expected_kernel)
    subprocess.run([*source_audit,
                    "--executed-dir", str(build / "executed"),
                    "--executed-reference-dir", str(build / "reference-executed"),
                    "--freeze-policy", "exact", "--failure-report", str(evidence / f"shard-{shard}.txt"),
                    *audit_args], cwd=root, check=True)
    validated = build / "validated"
    validated.mkdir(exist_ok=True)
    for unit in units:
        shutil.copy2(build / "source" / f"{unit.slug}.ipynb", validated / f"{unit.slug}.ipynb")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("prepare", "fetch-image", "verify-image", "execute"))
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--context", type=Path, required=True)
    parser.add_argument("--github-output", type=Path)
    parser.add_argument("--archive", type=Path)
    parser.add_argument("--manifest", type=Path)
    parser.add_argument("--output-dir", type=Path)
    parser.add_argument("--shard", type=int)
    parser.add_argument("--shard-count", type=int, default=6)
    args = parser.parse_args()
    root = _safe_path(args.root)
    try:
        if args.mode == "prepare":
            context = prepare(root)
            write_json(args.context, context)
            if args.github_output:
                with args.github_output.open("a") as stream:
                    for key in ("image_run_id", "image_id", "canonical_source_commit", "source_date_epoch"):
                        stream.write(f"{key}={context[key]}\n")
                    stream.write("image_source=" + ("release" if context["archive_locator"] else "actions") + "\n")
            print("Verified promoted freeze and immutable image locator")
        elif args.mode == "fetch-image":
            if not args.output_dir:
                parser.error("fetch-image requires --output-dir")
            context, _ = checked_context(root, args.context)
            fetch_image(root, context, args.output_dir)
        elif args.mode == "verify-image":
            if not args.archive or not args.manifest:
                parser.error("verify-image requires --archive and --manifest")
            context, _ = checked_context(root, args.context)
            print(verify_image(root, context, args.archive, args.manifest))
        else:
            if args.shard is None:
                parser.error("execute requires --shard")
            execute(root, args.context, args.shard, args.shard_count)
    except (ValueError, OSError, KeyError, subprocess.CalledProcessError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
