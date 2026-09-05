"""Deterministic inputs and isolated snapshots for the derived PDF pipeline."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess

SOURCE_RECORD = ".dlbook-pdf-source.json"
PREVIEW_ROOTS = {
    "scripts", "filters", "tex", "chapters", "_freeze", "figures", "data", "code",
}
PREVIEW_SUFFIXES = {
    ".py", ".lua", ".tex", ".qmd", ".yml", ".yaml", ".json", ".png", ".svg",
    ".pdf", ".jpg", ".webp", ".js", ".css", ".scss", ".html", ".csv", ".txt", ".pt",
}


def git(root: Path, *args: str) -> str:
    return subprocess.check_output(["git", "-C", str(root), *args], text=True).strip()


def sha256(path: Path) -> str:
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def source_state(root: Path) -> dict[str, object]:
    """A snapshot carries the real base commit; a working tree is never called clean."""
    record = root / SOURCE_RECORD
    if record.is_file():
        state = json.loads(record.read_text())
    else:
        state = {
            "commit": git(root, "rev-parse", "HEAD"),
            "source_date_epoch": int(git(root, "show", "-s", "--format=%ct", "HEAD")),
            "dirty": bool(git(root, "status", "--porcelain")),
            "input_sha256": manifest_digest(input_manifest(root)),
        }
    if not re.fullmatch(r"[0-9a-f]{40}", str(state.get("commit", ""))):
        raise ValueError("PDF source record needs a full Git commit")
    if not isinstance(state.get("source_date_epoch"), int) or state["source_date_epoch"] < 0:
        raise ValueError("PDF source record needs a nonnegative Git commit timestamp")
    return state


def build_environment(state: dict[str, object]) -> dict[str, str]:
    env = os.environ.copy()
    # An inherited shell/CI clock override must not silently change one commit.
    env.update({
        "SOURCE_DATE_EPOCH": str(state["source_date_epoch"]),
        "FORCE_SOURCE_DATE": "1",
        "TZ": "UTC",
        "LC_ALL": "C",
        "PYTHONHASHSEED": "0",
    })
    return env


def input_manifest(root: Path) -> dict[str, str]:
    """Copy repository inputs, never .git credentials, caches, or arbitrary dotfiles."""
    tracked = git(root, "ls-files", "-z").split("\0")
    untracked = git(root, "ls-files", "--others", "--exclude-standard", "-z").split("\0")
    names = set(filter(None, tracked))
    for name in filter(None, untracked):
        relative = Path(name)
        if relative.parts[0] in PREVIEW_ROOTS and relative.suffix in PREVIEW_SUFFIXES:
            names.add(name)
        elif len(relative.parts) == 1 and (
            name.startswith("_quarto") and relative.suffix == ".yml"
            or relative.suffix in {".html", ".css", ".scss"}
        ):
            names.add(name)
    manifest = {}
    for name in sorted(names):
        path = root / name
        if not path.exists():  # A tracked deletion is part of the preview too.
            continue
        if not path.is_file() or not path.resolve().is_relative_to(root.resolve()):
            raise ValueError(f"Unsafe PDF snapshot input: {name}")
        manifest[name] = sha256(path)
    return manifest


def manifest_digest(manifest: dict[str, str]) -> str:
    return hashlib.sha256(json.dumps(manifest, sort_keys=True).encode()).hexdigest()


def snapshot(root: Path, destination: Path, manifest: dict[str, str], state: dict[str, object]) -> None:
    destination.mkdir(parents=True)
    for name, digest in manifest.items():
        target = destination / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(root / name, target)
        shutil.copymode(root / name, target)
        if sha256(target) != digest:
            raise ValueError(f"Source changed while snapshotting {name}; restart the gate")
    (destination / SOURCE_RECORD).write_text(json.dumps({
        **state, "input_sha256": manifest_digest(manifest),
    }, indent=2, sort_keys=True) + "\n")


def tool_versions(root: Path, env: dict[str, str]) -> dict[str, str]:
    versions = {}
    for name, command in (
        ("quarto", ["quarto", "--version"]),
        ("pandoc", ["quarto", "pandoc", "--version"]),
        ("path_lualatex", ["lualatex", "--version"]),
    ):
        versions[name] = subprocess.check_output(command, cwd=root, env=env, text=True).strip()
    return versions


def consumed_inputs(root: Path) -> dict[str, str]:
    """Hash the engine's actual fonts/packages/assets, preserving a portable root key."""
    recorder = root / "index.fls"
    if not recorder.is_file():
        raise ValueError("LuaLaTeX did not retain index.fls; use -recorder")
    result = {}
    for line in recorder.read_text(errors="replace").splitlines():
        if not line.startswith("INPUT "):
            continue
        path = Path(line[6:])
        path = (root / path).resolve() if not path.is_absolute() else path.resolve()
        if not path.is_file():
            continue
        # Transient aux state is intentionally regenerated, not part of the toolchain.
        if path.is_relative_to(root.resolve()):
            relative = path.relative_to(root.resolve())
            if relative.suffix in {".aux", ".toc", ".out", ".log", ".fls"}:
                continue
            key = "PROJECT/" + str(relative)
        else:
            key = str(path)
        result[key] = sha256(path)
    return dict(sorted(result.items()))
