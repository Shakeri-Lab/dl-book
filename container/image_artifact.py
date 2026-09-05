#!/usr/bin/env python3
"""Seal/verify a saved Docker image reused by independent Actions runs.

The saved image's content ID is authoritative. A mutable tag is only a local
handle, never the cross-run identity. Verification happens before docker load.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def identity_inputs(root, commit):
    if not re.fullmatch(r"[0-9a-f]{40}", commit):
        raise ValueError("Expected a full source commit")
    paths = sorted(path for path in (root / "container").rglob("*")
                   if path.is_file() and path.suffix != ".pyc" and "__pycache__" not in path.parts)
    paths.append(root / "scripts/run_canonical_freeze.py")
    return {"source_commit": commit,
            "recipe_files_sha256": {path.relative_to(root).as_posix(): digest(path) for path in paths}}


def verify(metadata, archive, expected):
    if metadata.get("schema_version") != 1:
        raise ValueError("Unsupported image artifact manifest")
    if any(metadata.get(key) != value for key, value in expected.items()):
        raise ValueError("Saved image was built for different source/recipe inputs")
    if not re.fullmatch(r"sha256:[0-9a-f]{64}", metadata.get("image_id", "")):
        raise ValueError("Saved image has no valid immutable content ID")
    if digest(archive) != metadata.get("archive_sha256"):
        raise ValueError("Saved image archive SHA-256 mismatch")
    return metadata["image_id"]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("seal", "verify"))
    parser.add_argument("--root", type=Path, default=Path("."))
    parser.add_argument("--commit", required=True)
    parser.add_argument("--archive", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--image")
    args = parser.parse_args()
    expected = identity_inputs(args.root, args.commit)
    if args.mode == "seal":
        if not args.image:
            parser.error("seal requires --image")
        inspected = json.loads(subprocess.check_output(["docker", "image", "inspect", args.image], text=True))[0]
        if inspected["Architecture"] != "amd64" or inspected["Os"] != "linux":
            raise ValueError("Saved image must be Linux/amd64")
        metadata = {"schema_version": 1, **expected, "image_id": inspected["Id"],
                    "archive_sha256": digest(args.archive), "docker_inspect": inspected}
        args.manifest.write_text(json.dumps(metadata, indent=2, sort_keys=True) + "\n")
    else:
        metadata = json.loads(args.manifest.read_text())
    print(verify(metadata, args.archive, expected))


if __name__ == "__main__":
    main()
