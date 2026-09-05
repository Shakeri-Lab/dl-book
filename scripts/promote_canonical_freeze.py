#!/usr/bin/env python3
"""Dry-run-first installation of an independently verified canonical freeze.

No numerical file is synthesized or edited. Only --apply writes: the previous
freeze is renamed into a unique build/freeze-backups transaction, and verified
copies replace it. Failed copies and rollback evidence are retained there.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import fcntl
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import sys
import tempfile
from typing import Any

from compare_freeze_runs import bundle_paths, compare_runs, validate_fingerprint
from freeze_provenance import (
    execution_plan, freeze_inventory, json_digest, sha256, source_fingerprint, write_json,
)

ROOT = Path(__file__).resolve().parents[1]


def _safe_path(path: Path) -> Path:
    """Reject symlink components before resolving, including broken symlinks.

    Use physical absolute paths on systems with /tmp or /var aliases; relative
    paths are anchored to the process's physical working directory.
    """
    absolute = Path(os.path.abspath(path))
    for component in (*reversed(absolute.parents), absolute):
        if component.is_symlink():
            raise ValueError(f"Symlink path component is forbidden: {component}; use its physical path")
    return absolute


def _regular_tree(path: Path) -> Path:
    root = _safe_path(path)
    if not root.is_dir():
        raise ValueError(f"Expected an existing directory: {root}")
    for directory, subdirs, files in os.walk(root, followlinks=False):
        for name in (*subdirs, *files):
            item = Path(directory) / name
            mode = item.lstat().st_mode
            if not (stat.S_ISDIR(mode) or stat.S_ISREG(mode)):
                raise ValueError(f"Non-regular or symlink artifact is forbidden: {item}")
    return root


def _git_toplevel(root: Path) -> Path:
    return Path(subprocess.check_output(
        ["git", "rev-parse", "--show-toplevel"], cwd=root,
        text=True, stderr=subprocess.DEVNULL).strip()).resolve()


def _overlap(left: Path, right: Path) -> bool:
    return left.is_relative_to(right) or right.is_relative_to(left)


def _current_source(root: Path, commit: str) -> dict[str, Any]:
    if _git_toplevel(root) != root:
        raise ValueError("--root must be the exact Git checkout root")
    current = source_fingerprint(root, commit)
    if current["dirty"] is not False:
        raise ValueError("Current source/input checkout must be clean")
    for name in current["files_sha256"]:
        path = _safe_path(root / name)
        if not path.is_file() or not path.is_relative_to(root):
            raise ValueError(f"Unsafe current source input: {name}")
    return current


def validate_promotion(first: Path, second: Path, root: Path,
                       source_commit: str) -> dict[str, Any]:
    """Read-only validation; no directory creation or evidence rewriting."""
    if not re.fullmatch(r"[0-9a-f]{40}", source_commit):
        raise ValueError("A full lowercase 40-character source commit is required")
    root = _safe_path(root)
    if not root.is_dir():
        raise ValueError("Repository root is missing")
    destination = _safe_path(root / "_freeze")
    backups = _safe_path(root / "build/freeze-backups")
    evidence = _safe_path(root / "provenance/canonical-freezes")
    if destination.exists():
        _regular_tree(destination)
    first, second = _regular_tree(first), _regular_tree(second)
    if _overlap(first, second):
        raise ValueError("Candidate bundles must be distinct, non-nested directories")
    documents, fingerprints, freezes = [], [], []
    for bundle in (first, second):
        if any(_overlap(bundle, path) for path in (destination, backups, evidence)):
            raise ValueError("Candidate bundle overlaps the destination, backup, or provenance area")
        freeze, fingerprint = bundle_paths(bundle)
        if freeze != bundle / "_freeze" or fingerprint != bundle / "provenance/fingerprint.json":
            raise ValueError("Promotion candidates must be complete run bundles with _freeze/ and provenance/")
        _regular_tree(freeze)
        if not _safe_path(fingerprint).is_file():
            raise ValueError(f"Candidate fingerprint is missing: {fingerprint}")
        documents.append(json.loads(fingerprint.read_text()))
        fingerprints.append(fingerprint)
        freezes.append(freeze)
    comparison = compare_runs(first, second, require_all_files=True)
    if not comparison["passed"]:
        raise ValueError("Independent full-freeze comparison failed:\n" + "\n".join(comparison["errors"]))
    current = _current_source(root, source_commit)
    for index, document in enumerate(documents, 1):
        for key in ("commit", "files_sha256", "input_sha256"):
            if document["source"][key] != current[key]:
                raise ValueError(f"Candidate {index} differs from current source/input identity: {key}")
        if document["execution_plan"] != execution_plan(root, current):
            raise ValueError(f"Candidate {index} differs from current full execution plan")
    fingerprint_hashes = [sha256(path) for path in fingerprints]
    identifier = source_commit + "-" + json_digest(fingerprint_hashes)[:16]
    proof_destination = _safe_path(evidence / identifier)
    if proof_destination.exists():
        raise ValueError(f"Promotion proof already exists; refusing to overwrite: {proof_destination}")
    return {
        "root": root, "first": first, "second": second,
        "freezes": freezes, "fingerprints": fingerprints, "documents": documents,
        "fingerprint_sha256": fingerprint_hashes, "comparison": comparison,
        "current_source": current, "destination": destination, "backups": backups,
        "proof_destination": proof_destination,
    }


def verify_installed(root: Path, proof_directory: Path) -> list[str]:
    """Re-audit an installed freeze using its explicit immutable proof receipt.

    No global search or mutable pointer is used, and source runtime fingerprints
    are never rewritten to insert a location. This checks installed artifacts,
    not whether a subsequently edited manuscript is still the executed source.
    """
    try:
        root, proof = _safe_path(root), _safe_path(proof_directory)
        expected_parent = root / "provenance/canonical-freezes"
        if proof.parent != expected_parent:
            raise ValueError("Installed proof must be directly inside repo/provenance/canonical-freezes")
        _regular_tree(proof)
        receipt = json.loads((proof / "promotion.json").read_text())
        if receipt.get("provenance") != {"first": "first/provenance", "second": "second/provenance"}:
            raise ValueError("Unsupported or unsafe provenance paths in promotion receipt")
        comparison_path = proof / "exact-repeat.json"
        if sha256(comparison_path) != receipt.get("comparison_sha256"):
            raise ValueError("Comparison proof differs from its promotion receipt")
        comparison = json.loads(comparison_path.read_text())
        if not (comparison.get("passed") is True and comparison.get("full_freeze_byte_identical") is True
                and comparison.get("policy") == "canonical-exact-all-files-repeat"):
            raise ValueError("Promotion receipt does not prove an all-files exact repeat")
        freeze = _regular_tree(root / "_freeze")
        installed_hash = sha256(freeze / "provenance.json")
        documents = []
        for index, label in enumerate(("first", "second")):
            provenance = proof / receipt["provenance"][label]
            fingerprint = provenance / "fingerprint.json"
            digest = sha256(fingerprint)
            if digest != receipt["fingerprint_sha256"][index] or (index == 0 and digest != installed_hash):
                raise ValueError(f"{label} fingerprint differs from installed/receipted bytes")
            document = json.loads(fingerprint.read_text())
            documents.append(document)
            if (document["source"]["commit"] != receipt.get("source_commit")
                    or document["source"]["input_sha256"] != receipt.get("source_input_sha256")):
                raise ValueError("Promotion source identity differs from its fingerprints")
            errors = validate_fingerprint(document, freeze, provenance_root=provenance)
            if errors:
                raise ValueError(f"{label} installed evidence: " + "; ".join(errors))
        if comparison.get("run_ids") != [document["run"]["id"] for document in documents]:
            raise ValueError("Comparison proof names different run identities")
    except (ValueError, KeyError, IndexError, TypeError, OSError) as exc:
        return [str(exc)]
    return []


def promote(first: Path, second: Path, *, root: Path = ROOT,
            source_commit: str, apply: bool = False) -> dict[str, Any]:
    validation = validate_promotion(first, second, root, source_commit)
    summary = {
        "schema_version": 1, "applied": False, "source_commit": source_commit,
        "destination": str(validation["destination"]),
        "proof_destination": str(validation["proof_destination"]),
        "source_input_sha256": validation["current_source"]["input_sha256"],
        "comparison": validation["comparison"],
    }
    if not apply:
        return summary

    backups = validation["backups"]
    backups.mkdir(parents=True, exist_ok=True)
    lock_path = _safe_path(backups / ".promotion.lock")
    if lock_path.exists() and not stat.S_ISREG(lock_path.lstat().st_mode):
        raise ValueError("Promotion lock path is not a regular file")
    flags = os.O_CREAT | os.O_RDWR | getattr(os, "O_NOFOLLOW", 0)
    with os.fdopen(os.open(lock_path, flags, 0o600), "a+") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as exc:
            raise ValueError("Another freeze promotion holds the local lock") from exc
        # Validate again inside the lock: the read-only preview grants no lease.
        validation = validate_promotion(first, second, root, source_commit)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        transaction = Path(tempfile.mkdtemp(prefix=f"{stamp}-{source_commit[:12]}-", dir=backups))
        incoming = transaction / "incoming-freeze"
        incoming_proof = transaction / "incoming-provenance"
        previous = transaction / "previous-freeze"
        destination = validation["destination"]  # No configurable destination.
        proof_destination = validation["proof_destination"]
        journal = transaction / "promotion.json"
        state = {**summary, "transaction": str(transaction), "status": "copying",
                 "fingerprint_sha256": validation["fingerprint_sha256"],
                 "candidates": [str(validation["first"]), str(validation["second"])],
                 "previous_freeze": str(previous) if destination.exists() else None}
        old_moved = installed = proof_installed = False
        try:
            write_json(journal, state)
            shutil.copytree(validation["freezes"][0], incoming)
            _regular_tree(incoming)
            # The only new file inside _freeze is the existing inventory's
            # expressly excluded metadata name. Numerical bytes are never edited.
            shutil.copy2(validation["fingerprints"][0], incoming / "provenance.json")
            incoming_proof.mkdir()
            for label, source, digest in zip(("first", "second"), validation["fingerprints"],
                                             validation["fingerprint_sha256"]):
                provenance = incoming_proof / label / "provenance"
                shutil.copytree(source.parent, provenance)
                _regular_tree(provenance)
                copied = provenance / "fingerprint.json"
                if sha256(copied) != digest:
                    raise ValueError(f"Candidate {label} fingerprint changed during copying")
                document = validation["documents"][0 if label == "first" else 1]
                if validate_fingerprint(document, incoming, provenance_root=provenance):
                    raise ValueError(f"Copied freeze or {label} evidence no longer matches its verified fingerprint")
            if sha256(incoming / "provenance.json") != validation["fingerprint_sha256"][0]:
                raise ValueError("Installed fingerprint copy differs from the verified first fingerprint")
            write_json(incoming_proof / "exact-repeat.json", validation["comparison"])
            write_json(incoming_proof / "promotion.json", {
                "schema_version": 1, "source_commit": source_commit,
                "source_input_sha256": state["source_input_sha256"],
                "fingerprint_sha256": validation["fingerprint_sha256"],
                "provenance": {"first": "first/provenance", "second": "second/provenance"},
                "comparison_sha256": sha256(incoming_proof / "exact-repeat.json"),
                "policy": "canonical-exact-all-files-repeat", "created_utc": stamp,
            })
            # Catch source edits or candidate changes while copies were made.
            final_validation = validate_promotion(first, second, root, source_commit)
            if final_validation["fingerprint_sha256"] != validation["fingerprint_sha256"]:
                raise ValueError("Candidate fingerprints changed during promotion preparation")
            proof_destination.parent.mkdir(parents=True, exist_ok=True)
            _safe_path(destination)
            _safe_path(proof_destination)
            if destination.exists():
                os.replace(destination, previous)
                old_moved = True
            os.replace(incoming, destination)
            installed = True
            if freeze_inventory(destination) != validation["documents"][0]["freeze_files_sha256"]:
                raise ValueError("Installed freeze differs from the verified inventory")
            if sha256(destination / "provenance.json") != validation["fingerprint_sha256"][0]:
                raise ValueError("Installed fingerprint differs from its verified bytes")
            os.replace(incoming_proof, proof_destination)
            proof_installed = True
            verification_errors = verify_installed(validation["root"], proof_destination)
            if verification_errors:
                raise ValueError("Installed evidence verification failed: " + "; ".join(verification_errors))
            state.update(applied=True, status="promoted")
            write_json(journal, state)
        except Exception as exc:
            rollback_error = None
            try:
                if proof_installed:
                    os.replace(proof_destination, transaction / "failed-provenance")
                if installed:
                    os.replace(destination, transaction / "failed-freeze")
                if old_moved:
                    os.replace(previous, destination)
            except Exception as rollback_exc:
                rollback_error = str(rollback_exc)
            state.update(applied=False, status="rollback-failed" if rollback_error else "rolled-back",
                         failure=str(exc), rollback_error=rollback_error)
            try:
                write_json(journal, state)
            except OSError:
                pass
            detail = f"; rollback also failed: {rollback_error}" if rollback_error else "; previous freeze restored or untouched"
            raise RuntimeError(f"Promotion failed: {exc}{detail}. Retained transaction: {transaction}") from exc
        return state


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("first", type=Path)
    parser.add_argument("second", type=Path)
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--source-commit", required=True)
    parser.add_argument("--apply", action="store_true", help="Install after validation; default is read-only")
    args = parser.parse_args()
    try:
        result = promote(args.first, args.second, root=args.root,
                         source_commit=args.source_commit, apply=args.apply)
    except (ValueError, OSError, RuntimeError, subprocess.CalledProcessError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1
    print("APPLIED" if result["applied"] else "DRY RUN: verified; no files changed")
    print(f"Destination: {result['destination']}")
    print(f"Comparison proof: {result['proof_destination']}")
    if result.get("previous_freeze"):
        print(f"Recoverable previous freeze: {result['previous_freeze']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
