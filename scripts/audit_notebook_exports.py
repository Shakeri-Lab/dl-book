#!/usr/bin/env python3
"""Audit the public notebook edition and its separately executed copies.

The source notebooks are publication artifacts: they must contain exactly the
learner-visible Plan -> Code surfaces, a commit-pinned bootstrap, and no saved
execution state.  When ``--executed-dir`` is supplied, this audit additionally
requires an executed copy of every selected notebook and compares its visible
stdout with the corresponding Quarto freeze record in source order.
"""

from __future__ import annotations

import argparse
import difflib
import fnmatch
import hashlib
import json
import re
import subprocess
from collections.abc import Iterable
from pathlib import Path
from typing import Any

from audit_frozen_stdout import stdout_blocks
from notebook_manifest import (
    NOTEBOOK_UNITS,
    PINNED_REQUIREMENTS,
    UNITS_BY_SLUG,
)

ROOT = Path(__file__).resolve().parents[1]


EXPECTED_UNIT_PAIRS = (
    ("01-linear-regression", "chapters/part1/01-linear-regression.qmd"),
    ("02-logistic-softmax", "chapters/part1/02-logistic-softmax.qmd"),
    ("03-nonlinearity-mlp", "chapters/part1/03-nonlinearity-mlp.qmd"),
    ("04-training-loss-sgd", "chapters/part1/04-training-loss-sgd.qmd"),
    ("05-backpropagation", "chapters/part1/05-backpropagation.qmd"),
    (
        "06-generalization-inductive-bias",
        "chapters/part1/06-generalization-inductive-bias.qmd",
    ),
    ("learning-by-experiment", "chapters/interludes/learning-by-experiment.qmd"),
    ("07-filters-convolution", "chapters/part2/07-filters-convolution.qmd"),
    ("08-cnn", "chapters/part2/08-cnn.qmd"),
    ("09-modern-cnns-transfer", "chapters/part2/09-modern-cnns-transfer.qmd"),
    ("making-pca-learnable", "chapters/interludes/making-pca-learnable.qmd"),
    ("10-sequences-rnn", "chapters/part3/10-sequences-rnn.qmd"),
    ("11-encoder-decoder", "chapters/part3/11-encoder-decoder.qmd"),
    ("12-kernel-regression", "chapters/part4/12-kernel-regression.qmd"),
    ("13-attention", "chapters/part4/13-attention.qmd"),
    (
        "14-self-attention-transformer",
        "chapters/part4/14-self-attention-transformer.qmd",
    ),
    (
        "attention-as-test-time-regression",
        "chapters/interludes/attention-as-test-time-regression.qmd",
    ),
    ("15-bert-pretraining", "chapters/part4/15-bert-pretraining.qmd"),
    ("16-vit-scaling", "chapters/part4/16-vit-scaling.qmd"),
    ("17-peft-quantization", "chapters/part5/17-peft-quantization.qmd"),
    ("18-alignment", "chapters/part5/18-alignment.qmd"),
    ("19-generative", "chapters/part5/19-generative.qmd"),
    ("20-multimodal", "chapters/part5/20-multimodal.qmd"),
    ("a1-linear-algebra", "chapters/appendices/a1-linear-algebra.qmd"),
    ("a2-tensors", "chapters/appendices/a2-tensors.qmd"),
    (
        "a3-precision-performance",
        "chapters/appendices/a3-precision-performance.qmd",
    ),
)
EXPECTED_VISIBLE_SURFACES = 193
EXPECTED_EXECUTABLE_SURFACES = 192
EXPECTED_INCLUDE_SURFACES = 4
EXPECTED_HIDDEN_CELLS = 93
REVISION_RE = re.compile(r"[0-9a-f]{40}")
RAW_REPO_PREFIX = "https://raw.githubusercontent.com/Shakeri-Lab/dl-book/"
SOURCE_REPO_PREFIX = "https://github.com/Shakeri-Lab/dl-book/blob/"
CI_REQUIREMENTS_PATH = ROOT / "scripts/notebook_ci_requirements.txt"


def cell_source(cell: dict[str, Any]) -> str:
    """Return a notebook cell's source with nbformat list/string parity."""
    source = cell.get("source", "")
    if isinstance(source, list):
        return "".join(source)
    return source if isinstance(source, str) else ""


def output_text(output: dict[str, Any]) -> str:
    text = output.get("text", "")
    return "".join(text) if isinstance(text, list) else str(text)


def tags(cell: dict[str, Any]) -> set[str]:
    raw = cell.get("metadata", {}).get("tags", [])
    return {str(item) for item in raw} if isinstance(raw, list) else set()


def load_notebook(path: Path, errors: list[str]) -> dict[str, Any] | None:
    try:
        document = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as error:
        errors.append(f"{path}: cannot read notebook JSON: {error}")
        return None
    if not isinstance(document, dict):
        errors.append(f"{path}: notebook root must be a JSON object")
        return None
    return document


def git_blob(revision: str, path: str) -> bytes | None:
    result = subprocess.run(
        ["git", "show", f"{revision}:{path}"],
        cwd=ROOT,
        capture_output=True,
        check=False,
    )
    return result.stdout if result.returncode == 0 else None


def revision_files(revision: str, errors: list[str], label: str) -> list[str]:
    result = subprocess.run(
        ["git", "ls-tree", "-r", "--name-only", revision],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        errors.append(f"{label}: cannot list files at revision {revision}")
        return []
    return result.stdout.splitlines()


def expanded_assets(
    patterns: Iterable[str], revision: str, errors: list[str], label: str
) -> list[str]:
    available = revision_files(revision, errors, label)
    paths: list[str] = []
    for pattern in patterns:
        matches = sorted(fnmatch.filter(available, pattern))
        if not matches:
            errors.append(f"{label}: manifest asset pattern matched nothing: {pattern}")
            continue
        paths.extend(matches)
    if len(paths) != len(set(paths)):
        errors.append(f"{label}: manifest asset patterns expand to duplicate paths")
    return sorted(set(paths))


def manifest_errors() -> list[str]:
    errors: list[str] = []
    actual = tuple((unit.slug, unit.source) for unit in NOTEBOOK_UNITS)
    if actual != EXPECTED_UNIT_PAIRS:
        errors.append(
            "scripts/notebook_manifest.json: notebook units differ from the exact "
            "26-unit public contract"
        )
    if len(UNITS_BY_SLUG) != len(EXPECTED_UNIT_PAIRS):
        errors.append(
            "scripts/notebook_manifest.json: duplicate or missing notebook slug"
        )
    if not PINNED_REQUIREMENTS:
        errors.append("scripts/notebook_requirements.txt: no pinned requirements")
    for requirement in PINNED_REQUIREMENTS:
        if not re.fullmatch(r"[A-Za-z0-9_.-]+==[^=\s]+", requirement):
            errors.append(
                "scripts/notebook_requirements.txt: requirement is not an exact pin: "
                f"{requirement}"
            )
    if not CI_REQUIREMENTS_PATH.is_file():
        errors.append("scripts/notebook_ci_requirements.txt: file is missing")
    else:
        ci_requirements = [
            line.strip()
            for line in CI_REQUIREMENTS_PATH.read_text(encoding="utf-8").splitlines()
            if line.strip() and not line.lstrip().startswith("#")
        ]
        if not ci_requirements:
            errors.append(
                "scripts/notebook_ci_requirements.txt: no pinned CI requirements"
            )
        for requirement in ci_requirements:
            if not re.fullmatch(r"[A-Za-z0-9_.-]+==[^=\s]+", requirement):
                errors.append(
                    "scripts/notebook_ci_requirements.txt: requirement is not "
                    f"an exact pin: {requirement}"
                )
    return errors


def visible_cells(document: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        cell for cell in document.get("cells", []) if "dlbook-visible" in tags(cell)
    ]


def audit_source_notebook(
    path: Path,
    unit: Any,
    surfaces: list[Any],
    support_code: str,
    errors: list[str],
) -> dict[str, Any] | None:
    document = load_notebook(path, errors)
    if document is None:
        return None

    label = path.as_posix()
    if document.get("nbformat") != 4:
        errors.append(f"{label}: nbformat must be 4")
    if (
        not isinstance(document.get("nbformat_minor"), int)
        or document["nbformat_minor"] < 5
    ):
        errors.append(f"{label}: nbformat_minor must support stable cell ids")
    cells = document.get("cells")
    if not isinstance(cells, list) or not cells:
        errors.append(f"{label}: notebook must contain cells")
        return document

    notebook_meta = document.get("metadata", {})
    if notebook_meta.get("kernelspec", {}).get("language") != "python":
        errors.append(f"{label}: kernelspec.language must be python")
    if notebook_meta.get("language_info") != {"name": "python", "version": "3.12"}:
        errors.append(f"{label}: language_info must pin the Python 3.12 contract")
    dlbook = notebook_meta.get("dlbook")
    if not isinstance(dlbook, dict):
        errors.append(f"{label}: missing metadata.dlbook object")
        return document

    revision = dlbook.get("revision")
    if not isinstance(revision, str) or REVISION_RE.fullmatch(revision) is None:
        errors.append(f"{label}: metadata.dlbook.revision must be a full commit SHA")
        revision = ""
    else:
        source_blob = git_blob(revision, unit.source)
        if source_blob is None:
            errors.append(f"{label}: source is unavailable at revision {revision}")
        elif source_blob != (ROOT / unit.source).read_bytes():
            errors.append(
                f"{label}: working manuscript differs from its pinned revision; "
                "commit it and re-export"
            )

    expected_source_url = f"{SOURCE_REPO_PREFIX}{revision}/{unit.source}"
    expected_metadata = {
        "source": unit.source,
        "slug": unit.slug,
        "revision": revision,
        "source_url": expected_source_url,
        "requirements": list(PINNED_REQUIREMENTS),
        "learner_visible_surfaces": len(surfaces),
    }
    if unit.support is None:
        expected_support = None
    else:
        expected_support = {
            "source": unit.source,
            "cell_label": unit.support.cell_label,
            "cell_ordinal": unit.support.cell_ordinal,
            "delimited": unit.support.delimited,
            "sha256": hashlib.sha256(support_code.encode("utf-8")).hexdigest(),
        }
    expected_metadata["support"] = expected_support
    for key, expected in expected_metadata.items():
        if dlbook.get(key) != expected:
            errors.append(
                f"{label}: metadata.dlbook.{key} is {dlbook.get(key)!r}; "
                f"expected {expected!r}"
            )

    expected_assets = expanded_assets(unit.assets, revision, errors, label)
    raw_assets = dlbook.get("assets")
    if not isinstance(raw_assets, list):
        errors.append(f"{label}: metadata.dlbook.assets must be a list")
        raw_assets = []
    actual_assets: dict[str, str] = {}
    for asset in raw_assets:
        if not isinstance(asset, dict):
            errors.append(f"{label}: malformed asset metadata {asset!r}")
            continue
        asset_path = asset.get("path")
        digest = asset.get("sha256")
        if not isinstance(asset_path, str) or not isinstance(digest, str):
            errors.append(f"{label}: asset entries need string path and sha256")
            continue
        if asset_path in actual_assets:
            errors.append(f"{label}: duplicate asset metadata for {asset_path}")
        actual_assets[asset_path] = digest
        blob = git_blob(revision, asset_path) if revision else None
        if blob is None:
            errors.append(f"{label}: asset is unavailable at {revision}: {asset_path}")
        elif hashlib.sha256(blob).hexdigest() != digest:
            errors.append(
                f"{label}: asset hash does not match {revision}: {asset_path}"
            )
    if sorted(actual_assets) != expected_assets:
        errors.append(
            f"{label}: pinned assets {sorted(actual_assets)} do not match manifest "
            f"expansion {expected_assets}"
        )

    bootstrap_cells = [cell for cell in cells if "dlbook-bootstrap" in tags(cell)]
    if len(bootstrap_cells) != 1 or bootstrap_cells[0] is not cells[0]:
        errors.append(f"{label}: cell 0 must be the one dlbook-bootstrap cell")
        bootstrap = cells[0]
    else:
        bootstrap = bootstrap_cells[0]
    if bootstrap.get("cell_type") != "code":
        errors.append(f"{label}: bootstrap must be a code cell")
    if bootstrap.get("id") != "bootstrap":
        errors.append(f"{label}: bootstrap cell id must be 'bootstrap'")
    if tags(bootstrap) != {"dlbook-bootstrap", "dlbook-support"}:
        errors.append(f"{label}: bootstrap tags differ from the publication contract")
    bootstrap_source = cell_source(bootstrap)
    if (
        bootstrap.get("metadata", {}).get("dlbook", {}).get("support")
        != expected_support
    ):
        errors.append(f"{label}: bootstrap support metadata differs from its source")
    if support_code and support_code not in bootstrap_source:
        errors.append(f"{label}: selected non-plot support is missing from bootstrap")
    for token in (
        *PINNED_REQUIREMENTS,
        revision,
        "_bootstrap_hashlib.sha256",
        "_bootstrap_urlrequest.urlretrieve",
        RAW_REPO_PREFIX,
    ):
        if token and token not in bootstrap_source:
            errors.append(f"{label}: bootstrap is missing pinned token {token!r}")
    if f"{RAW_REPO_PREFIX}main/" in bootstrap_source:
        errors.append(f"{label}: bootstrap fetches an asset from mutable main")
    for plotting_token in (
        "plt.figure(",
        "plt.subplots(",
        "plt.show(",
        ".add_patch(",
    ):
        if plotting_token in bootstrap_source:
            errors.append(
                f"{label}: plot-only hidden harness leaked into bootstrap: "
                f"{plotting_token}"
            )
    for asset_path, digest in actual_assets.items():
        for token in (asset_path, digest):
            if token not in bootstrap_source:
                errors.append(
                    f"{label}: bootstrap does not pin {asset_path} with {token!r}"
                )

    for index, cell in enumerate(cells):
        if not isinstance(cell.get("id"), str) or not cell["id"]:
            errors.append(f"{label}: cell {index} lacks a stable nbformat id")
        if cell.get("cell_type") == "code":
            if cell.get("execution_count") is not None:
                errors.append(
                    f"{label}: committed code cell {index} has execution_count"
                )
            if cell.get("outputs") != []:
                errors.append(f"{label}: committed code cell {index} has saved outputs")
    cell_ids = [cell.get("id") for cell in cells]
    if len(set(cell_ids)) != len(cell_ids):
        errors.append(f"{label}: notebook cell ids must be unique")

    plan_cells = [cell for cell in cells if "dlbook-plan" in tags(cell)]
    exported_visible = visible_cells(document)
    if len(plan_cells) != len(surfaces) or len(exported_visible) != len(surfaces):
        errors.append(
            f"{label}: expected {len(surfaces)} plan/visible pairs, found "
            f"{len(plan_cells)} plan and {len(exported_visible)} visible cells"
        )
    if len(cells) != 1 + 2 * len(surfaces):
        errors.append(
            f"{label}: expected bootstrap plus {len(surfaces)} plan/visible pairs "
            f"({1 + 2 * len(surfaces)} cells), found {len(cells)}"
        )

    checked_includes: set[str] = set()
    for ordinal, surface in enumerate(surfaces, start=1):
        plan_index = 2 * ordinal - 1
        visible_index = 2 * ordinal
        if visible_index >= len(cells):
            break
        plan_cell = cells[plan_index]
        visible = cells[visible_index]
        if plan_cell.get("id") != f"plan-{ordinal:03d}":
            errors.append(f"{label}: plan {ordinal} has an unstable cell id")
        if visible.get("id") != f"surface-{ordinal:03d}":
            errors.append(f"{label}: surface {ordinal} has an unstable cell id")
        if (
            "dlbook-plan" not in tags(plan_cell)
            or plan_cell.get("cell_type") != "markdown"
        ):
            errors.append(f"{label}: cell {plan_index} is not plan {ordinal}")
        if "dlbook-visible" not in tags(visible):
            errors.append(f"{label}: cell {visible_index} is not surface {ordinal}")

        surface_meta = visible.get("metadata", {}).get("dlbook", {})
        plan_meta = plan_cell.get("metadata", {}).get("dlbook", {})
        if surface_meta.get("surface_ordinal") != ordinal:
            errors.append(
                f"{label}: surface {ordinal} has ordinal "
                f"{surface_meta.get('surface_ordinal')!r}"
            )
        executable = bool(surface.executable)
        if surface_meta.get("executable") is not executable:
            errors.append(f"{label}: surface {ordinal} executable flag differs")
        include = surface.include
        if surface_meta.get("include") != include:
            errors.append(f"{label}: surface {ordinal} include metadata differs")
        if include is not None and include not in checked_includes and revision:
            checked_includes.add(include)
            include_blob = git_blob(revision, include)
            if include_blob is None:
                errors.append(
                    f"{label}: transcluded source is unavailable at {revision}: "
                    f"{include}"
                )
            elif include_blob != (ROOT / include).read_bytes():
                errors.append(
                    f"{label}: transcluded source differs from its pinned revision: "
                    f"{include}"
                )
        if surface_meta.get("source_line") != surface.source_line:
            errors.append(f"{label}: surface {ordinal} source_line differs")
        if surface_meta.get("label") != surface.label:
            errors.append(f"{label}: surface {ordinal} label differs")
        if plan_meta != surface_meta:
            errors.append(f"{label}: plan {ordinal} metadata differs from its surface")

        expected_plan = ("**Plan**\n\n" + surface.plan).strip()
        if cell_source(plan_cell).strip() != expected_plan:
            errors.append(f"{label}: plan {ordinal} differs from source Plan")
        expected_source = surface.code.strip()
        actual_source = cell_source(visible).strip()
        if executable:
            if visible.get("cell_type") != "code" or tags(visible) != {
                "dlbook-visible"
            }:
                errors.append(
                    f"{label}: executable surface {ordinal} is not a code cell"
                )
        else:
            if visible.get("cell_type") != "markdown" or tags(visible) != {
                "dlbook-visible",
                "dlbook-listing",
            }:
                errors.append(
                    f"{label}: non-executable surface {ordinal} is not a listing"
                )
            fence = re.fullmatch(r"```python\n(.*?)\n```", actual_source, re.DOTALL)
            actual_source = fence.group(1).strip() if fence else actual_source
        if actual_source != expected_source:
            errors.append(f"{label}: visible source {ordinal} differs from manuscript")
        if "#| echo: false" in actual_source or "#| echo:false" in actual_source:
            errors.append(f"{label}: hidden harness leaked into surface {ordinal}")

    extra_code = [
        index
        for index, cell in enumerate(cells)
        if cell.get("cell_type") == "code"
        and "dlbook-bootstrap" not in tags(cell)
        and "dlbook-visible" not in tags(cell)
    ]
    if extra_code:
        errors.append(f"{label}: unclassified code cells leak at indices {extra_code}")
    return document


def normalized_identity(cell: dict[str, Any]) -> tuple[Any, ...]:
    metadata = dict(cell.get("metadata", {}))
    metadata.pop("execution", None)
    return (
        cell.get("cell_type"),
        cell_source(cell),
        cell.get("id"),
        metadata,
    )


def visible_stdout(
    document: dict[str, Any], label: str, errors: list[str]
) -> list[str]:
    blocks: list[str] = []
    for index, cell in enumerate(document.get("cells", [])):
        if cell.get("cell_type") != "code" or "dlbook-visible" not in tags(cell):
            continue
        stdout = ""
        for output in cell.get("outputs", []):
            kind = output.get("output_type")
            if kind == "error":
                errors.append(
                    f"{label}: visible cell {index} raised "
                    f"{output.get('ename')}: {output.get('evalue')}"
                )
            elif kind == "stream" and output.get("name") == "stdout":
                stdout += output_text(output)
            elif kind == "stream" and output.get("name") == "stderr":
                stderr = output_text(output).strip()
                excerpt = stderr[:800]
                if len(stderr) > len(excerpt):
                    excerpt += "\n... stderr truncated ..."
                errors.append(
                    f"{label}: visible cell {index} emitted stderr"
                    + (f"\n{excerpt}" if excerpt else "")
                )
        if stdout:
            blocks.append(stdout)
    return blocks


def audit_executed_copy(
    source_path: Path,
    executed_path: Path,
    unit: Any,
    errors: list[str],
) -> None:
    source = load_notebook(source_path, errors)
    executed = load_notebook(executed_path, errors)
    if source is None or executed is None:
        return
    label = executed_path.as_posix()
    if executed.get("metadata", {}).get("dlbook") != source.get("metadata", {}).get(
        "dlbook"
    ):
        errors.append(f"{label}: execution changed notebook dlbook metadata")
    source_cells = source.get("cells", [])
    executed_cells = executed.get("cells", [])
    if len(source_cells) != len(executed_cells):
        errors.append(f"{label}: execution changed the cell count")
        return
    for index, (before, after) in enumerate(zip(source_cells, executed_cells)):
        if normalized_identity(before) != normalized_identity(after):
            errors.append(f"{label}: execution changed cell {index} source/identity")
        if after.get("cell_type") == "code" and after.get("execution_count") is None:
            errors.append(f"{label}: code cell {index} was not executed")
        for output in after.get("outputs", []):
            if output.get("output_type") == "error":
                errors.append(
                    f"{label}: cell {index} raised {output.get('ename')}: "
                    f"{output.get('evalue')}"
                )

    freeze_path = (
        ROOT
        / "_freeze"
        / Path(unit.source).with_suffix("")
        / "execute-results"
        / "html.json"
    )
    if not freeze_path.is_file():
        errors.append(f"{label}: missing frozen stdout source {freeze_path}")
        return
    expected = stdout_blocks(freeze_path.read_text(encoding="utf-8"))
    actual = visible_stdout(executed, label, errors)
    if actual != expected:
        expected_lines: list[str] = []
        actual_lines: list[str] = []
        for index, block in enumerate(expected, start=1):
            expected_lines.append(f"<<< stdout block {index} >>>\n")
            expected_lines.extend(block.splitlines(keepends=True))
        for index, block in enumerate(actual, start=1):
            actual_lines.append(f"<<< stdout block {index} >>>\n")
            actual_lines.extend(block.splitlines(keepends=True))
        diff_lines = list(
            difflib.unified_diff(
                expected_lines,
                actual_lines,
                fromfile="frozen HTML stdout",
                tofile="executed notebook stdout",
                n=2,
            )
        )
        max_diff_lines = 160
        if len(diff_lines) > max_diff_lines:
            diff_lines = [
                *diff_lines[:max_diff_lines],
                f"... diff truncated; {len(diff_lines) - max_diff_lines} "
                "line(s) omitted ...\n",
            ]
        errors.append(
            f"{label}: visible stdout differs from frozen HTML "
            f"({len(actual)} notebook block(s), {len(expected)} frozen block(s))\n"
            + "".join(diff_lines)
        )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "source_dir",
        nargs="?",
        type=Path,
        default=ROOT / "notebooks",
        help="directory containing unexecuted public notebooks",
    )
    parser.add_argument(
        "--executed-dir",
        type=Path,
        help="directory containing separately executed notebook copies",
    )
    parser.add_argument(
        "--slug",
        action="append",
        default=[],
        help="audit only this manifest slug; repeat for a matrix subset",
    )
    args = parser.parse_args()

    errors = manifest_errors()
    unknown = sorted(set(args.slug) - set(UNITS_BY_SLUG))
    if unknown:
        errors.append(f"unknown notebook slug(s): {', '.join(unknown)}")
    if len(args.slug) != len(set(args.slug)):
        errors.append("--slug values must not be repeated")
    selected_slugs = args.slug or [unit.slug for unit in NOTEBOOK_UNITS]
    selected = [UNITS_BY_SLUG[slug] for slug in selected_slugs if slug in UNITS_BY_SLUG]

    try:
        from export_notebooks import _support_code, collect_surfaces, parse_document
    except (ImportError, ModuleNotFoundError) as error:
        errors.append(f"cannot import notebook exporter: {error}")
        collect_surfaces = None
        parse_document = None
        _support_code = None

    total_surfaces = 0
    executable_surfaces = 0
    include_surfaces = 0
    hidden_cells = 0
    for unit in selected:
        path = args.source_dir / f"{unit.slug}.ipynb"
        if not path.is_file():
            errors.append(f"missing source notebook: {path}")
            continue
        if collect_surfaces is None:
            continue
        parsed = (
            parse_document(ROOT / unit.source) if parse_document is not None else None
        )
        surfaces = (
            list(parsed.surfaces)
            if parsed is not None
            else list(collect_surfaces(ROOT / unit.source))
        )
        support_code = (
            _support_code(parsed, unit.support)
            if parsed is not None and _support_code is not None
            else ""
        )
        if parsed is not None:
            hidden_cells += parsed.hidden_cells
        total_surfaces += len(surfaces)
        executable_surfaces += sum(bool(surface.executable) for surface in surfaces)
        include_surfaces += sum(surface.include is not None for surface in surfaces)
        audit_source_notebook(path, unit, surfaces, support_code, errors)

        if args.executed_dir is not None:
            executed_path = args.executed_dir / f"{unit.slug}.ipynb"
            if not executed_path.is_file():
                errors.append(f"missing executed notebook: {executed_path}")
            else:
                audit_executed_copy(path, executed_path, unit, errors)

    if not args.slug:
        actual_files = {path.name for path in args.source_dir.glob("*.ipynb")}
        expected_files = {f"{unit.slug}.ipynb" for unit in NOTEBOOK_UNITS}
        if actual_files != expected_files:
            errors.append(
                f"{args.source_dir}: notebook file set differs; missing "
                f"{sorted(expected_files - actual_files)}, extra "
                f"{sorted(actual_files - expected_files)}"
            )
        if total_surfaces != EXPECTED_VISIBLE_SURFACES:
            errors.append(
                f"notebook corpus has {total_surfaces} visible surfaces; "
                f"expected {EXPECTED_VISIBLE_SURFACES}"
            )
        if executable_surfaces != EXPECTED_EXECUTABLE_SURFACES:
            errors.append(
                f"notebook corpus has {executable_surfaces} executable surfaces; "
                f"expected {EXPECTED_EXECUTABLE_SURFACES}"
            )
        if include_surfaces != EXPECTED_INCLUDE_SURFACES:
            errors.append(
                f"notebook corpus has {include_surfaces} transclusions; "
                f"expected {EXPECTED_INCLUDE_SURFACES}"
            )
        if hidden_cells != EXPECTED_HIDDEN_CELLS:
            errors.append(
                f"notebook source corpus has {hidden_cells} hidden harness cells; "
                f"expected {EXPECTED_HIDDEN_CELLS}"
            )
        if args.executed_dir is not None:
            executed_files = {path.name for path in args.executed_dir.glob("*.ipynb")}
            if executed_files != expected_files:
                errors.append(
                    f"{args.executed_dir}: executed notebook file set differs; "
                    f"missing {sorted(expected_files - executed_files)}, extra "
                    f"{sorted(executed_files - expected_files)}"
                )

    if errors:
        for error in errors:
            print(error)
        print(f"FAILED: {len(errors)} notebook export contract violation(s)")
        return 1

    execution = (
        f"; executed stdout verified in {args.executed_dir}"
        if args.executed_dir is not None
        else ""
    )
    print(
        f"PASS: {len(selected)} notebook(s), {total_surfaces} visible surfaces "
        f"({executable_surfaces} executable, {include_surfaces} transcluded), "
        f"commit-pinned clean source artifacts{execution}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
