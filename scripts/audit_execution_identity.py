#!/usr/bin/env python3
"""Report computation changes separately from prose and Plan marker changes.

This is an identity check, not proof of reproducibility. Equal source can produce
different floating-point results on different runtimes. Never use this report to
silently replace a failed stdout comparison or to authorize artifact reuse.
"""

from __future__ import annotations

import argparse
import ast
import hashlib
import json
from pathlib import Path
import re
import subprocess

import yaml


ROOT = Path(__file__).resolve().parents[1]
CELL_RE = re.compile(r"^```\{python\}\s*\n(.*?)^```\s*$", re.M | re.S)
# Presentation options do not change what the interpreter executes. Figure size,
# DPI, cache, eval, and all unknown options deliberately remain part of identity.
PRESENTATION_OPTIONS = {
    "fig-cap", "fig-alt", "code-summary", "code-fold", "classes",
}
DEPENDENCY_ROOTS = ("code", "data", "experiments")
DEPENDENCY_FILES = (
    "requirements.txt", "scripts/notebook_requirements.txt",
    "scripts/notebook_manifest.json",
)


def digest(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def git_bytes(base: str, path: str) -> bytes:
    return subprocess.check_output(["git", "show", f"{base}:{path}"], cwd=ROOT)


def current_paths(root: Path) -> set[str]:
    """Include unstaged new inputs, not ignored build products or local caches."""
    return set(subprocess.check_output(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard"],
        cwd=root, text=True,
    ).splitlines())


def cell_signatures(source: str) -> list[dict[str, object]]:
    signatures = []
    for ordinal, match in enumerate(CELL_RE.finditer(source), 1):
        body = match.group(1)
        option_text = "\n".join(
            line[2:].lstrip() for line in body.splitlines() if line.startswith("#|")
        )
        options = yaml.safe_load(option_text) or {}
        if not isinstance(options, dict):
            raise ValueError(f"Cell {ordinal} options are not a mapping")
        code = "\n".join(
            line for line in body.splitlines() if not line.startswith("#|")
        )
        tree = ast.dump(ast.parse(code), include_attributes=False)
        signatures.append({
            "ordinal": ordinal,
            "label": options.get("label"),
            "ast_sha256": digest(tree.encode()),
            "execution_options": {
                key: value for key, value in options.items()
                if key not in PRESENTATION_OPTIONS
            },
        })
    return signatures


def changed_cells(before: str, after: str) -> list[int]:
    left, right = cell_signatures(before), cell_signatures(after)
    return [
        index + 1 for index in range(max(len(left), len(right)))
        if index >= len(left) or index >= len(right) or left[index] != right[index]
    ]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", required=True)
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    base = subprocess.check_output(
        ["git", "rev-parse", f"{args.base}^{{commit}}"], cwd=ROOT, text=True,
    ).strip()
    names = subprocess.check_output(
        ["git", "ls-tree", "-r", "--name-only", base], cwd=ROOT, text=True,
    ).splitlines()
    current_names = current_paths(ROOT)
    units = {}
    total = 0
    for name in sorted(set(names) | current_names):
        if not name.startswith("chapters/") or not name.endswith(".qmd"):
            continue
        before = git_bytes(base, name) if name in names else b""
        path = ROOT / name
        after = path.read_bytes() if path.is_file() else b""
        old_cells, new_cells = cell_signatures(before.decode()), cell_signatures(after.decode())
        if not old_cells and not new_cells:
            continue
        total += len(new_cells)
        units[name] = {
            "baseline_source_sha256": digest(before),
            "current_source_sha256": digest(after),
            "native_cells": len(new_cells),
            "changed_native_ordinals": changed_cells(before.decode(), after.decode()),
            "baseline_cells": old_cells,
            "current_cells": new_cells,
        }
    dependencies = {}
    for name in sorted(set(names) | current_names):
        if not (name.split("/")[0] in DEPENDENCY_ROOTS or name in DEPENDENCY_FILES):
            continue
        before = git_bytes(base, name) if name in names else b""
        path = ROOT / name
        after = path.read_bytes() if path.is_file() else b""
        dependencies[name] = {
            "baseline_sha256": digest(before), "current_sha256": digest(after),
            "identical": name in names and path.is_file() and before == after,
        }
    # Project-wide execution settings can change even if every cell is identical.
    before_config = yaml.safe_load(git_bytes(base, "_quarto.yml"))
    after_config = yaml.safe_load((ROOT / "_quarto.yml").read_text())
    config_identical = all(
        before_config.get(key) == after_config.get(key) for key in ("execute", "jupyter")
    )
    changed_units = {name: row["changed_native_ordinals"] for name, row in units.items()
                     if row["changed_native_ordinals"]}
    changed_dependencies = [name for name, row in dependencies.items() if not row["identical"]]
    result = {
        "baseline_commit": base,
        "scope": "native Python AST/order, cell execution options, baseline and current nonignored dependencies, project execution settings",
        "limitation": "Not a runtime/output identity proof; not authorization to reuse archived outputs.",
        "native_cells": total,
        "changed_units": changed_units,
        "changed_dependencies": changed_dependencies,
        "project_execution_identical": config_identical,
        "units": units,
        "dependencies": dependencies,
    }
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n")
    print(json.dumps({key: value for key, value in result.items()
                      if key not in {"units", "dependencies"}}, indent=2))
    return 1 if changed_units or changed_dependencies or not config_identical else 0


if __name__ == "__main__":
    raise SystemExit(main())
