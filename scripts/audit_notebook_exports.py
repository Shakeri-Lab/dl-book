#!/usr/bin/env python3
"""Audit public notebooks, canonical references, and executed copies.

The source notebooks are publication artifacts: they must contain exactly the
learner-visible Plan -> Code surfaces, ordered collapsed figure/support cells,
source-authored prediction prompts, a commit-pinned bootstrap, and no saved
execution state. When ``--executed-dir`` is supplied, this audit additionally
requires an executed copy of every selected notebook.  When full internal
references are supplied, the primary gate compares public and canonical
learner-visible stdout byte for byte inside the same clean runtime.  The
cross-platform comparison with Quarto's committed freeze remains distinct and
exact by default, with only reviewed per-surface portability contracts.
"""

from __future__ import annotations

import argparse
import base64
import difflib
import fnmatch
import hashlib
import io
import json
import re
import subprocess
import warnings
from collections.abc import Iterable
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlsplit
from xml.etree.ElementTree import ParseError

from defusedxml.ElementTree import fromstring as safe_xml_fromstring
from defusedxml.common import DefusedXmlException
from PIL import Image

from audit_frozen_stdout import stdout_records
from notebook_manifest import (
    NOTEBOOK_UNITS,
    PINNED_REQUIREMENTS,
    UNITS_BY_SLUG,
)
from notebook_stdout_contracts import (
    compare_stderr_outputs,
    compare_stdout_blocks,
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
EXPECTED_VISIBLE_SURFACES = 194
EXPECTED_EXECUTABLE_SURFACES = 193
EXPECTED_INCLUDE_SURFACES = 4
EXPECTED_HIDDEN_CELLS = 94
REVISION_RE = re.compile(r"[0-9a-f]{40}")
RAW_REPO_PREFIX = "https://raw.githubusercontent.com/Shakeri-Lab/dl-book/"
SOURCE_REPO_PREFIX = "https://github.com/Shakeri-Lab/dl-book/blob/"
CI_REQUIREMENTS_PATH = ROOT / "scripts/notebook_ci_requirements.txt"
MAX_DIFF_LINES = 160
MAX_FAILURE_REPORT_CHARS = 65_536


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


def _expected_assets(
    document: dict[str, Any],
    unit: Any,
    revision: str,
    label: str,
    errors: list[str],
) -> dict[str, str]:
    """Validate commit-pinned asset metadata shared by both notebook forms."""

    expected = expanded_assets(unit.assets, revision, errors, label)
    dlbook = document.get("metadata", {}).get("dlbook", {})
    raw_assets = dlbook.get("assets")
    if not isinstance(raw_assets, list):
        errors.append(f"{label}: metadata.dlbook.assets must be a list")
        raw_assets = []
    actual: dict[str, str] = {}
    for asset in raw_assets:
        if not isinstance(asset, dict):
            errors.append(f"{label}: malformed asset metadata {asset!r}")
            continue
        asset_path = asset.get("path")
        digest = asset.get("sha256")
        if not isinstance(asset_path, str) or not isinstance(digest, str):
            errors.append(f"{label}: asset entries need string path and sha256")
            continue
        if asset_path in actual:
            errors.append(f"{label}: duplicate asset metadata for {asset_path}")
        actual[asset_path] = digest
        blob = git_blob(revision, asset_path) if revision else None
        if blob is None:
            errors.append(f"{label}: asset is unavailable at {revision}: {asset_path}")
        elif hashlib.sha256(blob).hexdigest() != digest:
            errors.append(
                f"{label}: asset hash does not match {revision}: {asset_path}"
            )
    if sorted(actual) != expected:
        errors.append(
            f"{label}: pinned assets {sorted(actual)} do not match manifest "
            f"expansion {expected}"
        )
    return actual


def audit_source_notebook(
    path: Path,
    unit: Any,
    surfaces: list[Any],
    support_code: str,
    errors: list[str],
) -> dict[str, Any] | None:
    from export_notebooks import (
        HTML_ROOT, _orientation, learner_code, notebook_markdown, parse_document,
    )
    parsed = parse_document(unit.source)
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
        "canonical_url": HTML_ROOT + Path(unit.source).with_suffix(".html").as_posix(),
        "hidden_native_cells": parsed.hidden_cells,
        "figure_ids": [cell.figure_id for cell in parsed.native_cells if cell.figure_id],
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
    if len(bootstrap_cells) != 1 or len(cells) < 2 or bootstrap_cells[0] is not cells[1]:
        errors.append(f"{label}: cell 1 must be the one dlbook-bootstrap cell, after orientation")
        bootstrap = bootstrap_cells[0] if bootstrap_cells else cells[0]
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
    if support_code and support_code in bootstrap_source:
        errors.append(f"{label}: canonical support must not run twice via the bootstrap")
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
    canonical_url = expected_metadata["canonical_url"]
    if (tags(cells[0]) != {"dlbook-orientation"}
        or cell_source(cells[0]) != _orientation(parsed, canonical_url, expected_source_url)):
        errors.append(f"{label}: source-generated orientation is missing or changed")

    checked_includes: set[str] = set()
    for ordinal, surface in enumerate(surfaces, start=1):
        if ordinal > len(plan_cells) or ordinal > len(exported_visible):
            break
        plan_cell = plan_cells[ordinal - 1]
        visible = exported_visible[ordinal - 1]
        plan_index = cells.index(plan_cell)
        visible_index = cells.index(visible)
        if visible_index != plan_index + 1:
            errors.append(f"{label}: plan {ordinal} must immediately precede its code")
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
        if surface_meta.get("native_ordinal") != surface.native_ordinal:
            errors.append(f"{label}: surface {ordinal} native ordinal differs")
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
        and "dlbook-harness" not in tags(cell)
    ]
    if extra_code:
        errors.append(f"{label}: unclassified code cells leak at indices {extra_code}")

    native_expected = {cell.ordinal: cell for cell in parsed.native_cells}
    native_cells = [
        cell for cell in cells
        if "dlbook-harness" in tags(cell) or (
            "dlbook-visible" in tags(cell)
            and cell.get("metadata", {}).get("dlbook", {}).get("native_ordinal") is not None
        )
    ]
    actual_ordinals = [cell.get("metadata", {}).get("dlbook", {}).get("native_ordinal") for cell in native_cells]
    if actual_ordinals != list(native_expected):
        errors.append(f"{label}: native cells are missing, duplicated, or out of manuscript order")
    for cell in native_cells:
        meta = cell.get("metadata", {}).get("dlbook", {})
        native = native_expected.get(meta.get("native_ordinal"))
        if native is None:
            continue
        if meta.get("figure_id") != native.figure_id:
            errors.append(f"{label}: native cell {native.ordinal} has the wrong figure identity")
        if native.hidden:
            if tags(cell) != {"dlbook-harness", "hide-input"}:
                errors.append(f"{label}: hidden native {native.ordinal} is not a collapsed harness")
            if cell.get("metadata", {}).get("jupyter", {}).get("source_hidden") is not True:
                errors.append(f"{label}: hidden native {native.ordinal} source must start collapsed")
            if cell_source(cell) != learner_code(native.body):
                errors.append(f"{label}: hidden native {native.ordinal} differs from canonical source")
            if meta.get("source_line") != native.source_line or meta.get("label") != native.label:
                errors.append(f"{label}: hidden native {native.ordinal} lost source provenance")
            if cell.get("id") != f"harness-{native.ordinal:03d}":
                errors.append(f"{label}: hidden native {native.ordinal} lost its stable cell id")
            index = cells.index(cell)
            predecessor = cells[index - 1] if index else {}
            if "dlbook-harness-label" not in tags(predecessor):
                errors.append(f"{label}: hidden native {native.ordinal} lacks a readable label")
            elif native.figure_id and (
                "**Render this figure**" not in cell_source(predecessor)
                or f"{canonical_url}#{native.figure_id}" not in cell_source(predecessor)
            ):
                errors.append(f"{label}: {native.figure_id} lost its figure return link")
    predictions = [cell for cell in cells if "dlbook-prediction" in tags(cell)]
    expected_predictions = [context for context in parsed.contexts if context.kind == "prediction"]
    if len(predictions) != len(expected_predictions):
        errors.append(f"{label}: source-authored prediction count differs")
    for cell, context in zip(predictions, expected_predictions):
        if cell_source(cell) != notebook_markdown(context.text, canonical_url):
            errors.append(f"{label}: prediction at source line {context.source_line} differs")
        if cell.get("metadata", {}).get("dlbook", {}) != {
            "source_line": context.source_line, "anchor": context.anchor,
        }:
            errors.append(f"{label}: prediction at source line {context.source_line} lost provenance")
    ordered_lines = [
        cell.get("metadata", {}).get("dlbook", {}).get("source_line")
        for cell in cells
        if tags(cell).intersection({"dlbook-visible", "dlbook-harness", "dlbook-prediction"})
    ]
    if any(not isinstance(line, int) for line in ordered_lines) or ordered_lines != sorted(ordered_lines):
        errors.append(f"{label}: predictions and executable surfaces are out of manuscript order")
    section_contexts = {context.anchor: context for context in parsed.contexts if context.kind == "section"}
    expected_sections = []
    for line in sorted(ordered_lines) if all(isinstance(line, int) for line in ordered_lines) else []:
        context = next((context for context in reversed(list(section_contexts.values())) if context.source_line < line), None)
        if context is not None and (not expected_sections or expected_sections[-1] != context.anchor):
            expected_sections.append(context.anchor)
    actual_sections = [cell.get("metadata", {}).get("dlbook", {}).get("anchor") for cell in cells if "dlbook-section" in tags(cell)]
    if actual_sections != expected_sections:
        errors.append(f"{label}: executable sections lost their source headings or order")
    for cell in cells:
        if "dlbook-section" in tags(cell):
            anchor = cell.get("metadata", {}).get("dlbook", {}).get("anchor")
            if anchor not in section_contexts or f"{canonical_url}#{anchor}" not in cell_source(cell):
                errors.append(f"{label}: section lost its canonical HTML return link")
        if cell.get("cell_type") == "markdown" and not tags(cell).intersection({
            "dlbook-orientation", "dlbook-section", "dlbook-prediction", "dlbook-plan",
            "dlbook-visible", "dlbook-harness-label",
        }):
            errors.append(f"{label}: unclassified narrative cell {cell.get('id')}")
    return document


def audit_reference_notebook(
    path: Path,
    unit: Any,
    parsed: Any,
    converted: Any,
    errors: list[str],
) -> dict[str, Any] | None:
    """Audit one full, internal Quarto-converted execution reference."""

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
        errors.append(f"{label}: reference notebook must contain cells")
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

    expected_metadata = {
        "kind": "canonical-quarto-reference",
        "source": unit.source,
        "slug": unit.slug,
        "revision": revision,
        "source_url": f"{SOURCE_REPO_PREFIX}{revision}/{unit.source}",
        "requirements": list(PINNED_REQUIREMENTS),
        "native_cells": len(parsed.native_cells),
        "learner_visible_native_cells": sum(
            not cell.hidden for cell in parsed.native_cells
        ),
        "learner_visible_surfaces": len(parsed.surfaces),
    }
    for key, expected in expected_metadata.items():
        if dlbook.get(key) != expected:
            errors.append(
                f"{label}: metadata.dlbook.{key} is {dlbook.get(key)!r}; "
                f"expected {expected!r}"
            )
    actual_assets = _expected_assets(document, unit, revision, label, errors)

    bootstrap = cells[0]
    if bootstrap.get("cell_type") != "code":
        errors.append(f"{label}: reference cell 0 must be a code bootstrap")
    if bootstrap.get("id") != "reference-bootstrap":
        errors.append(f"{label}: reference bootstrap has an unstable cell id")
    if tags(bootstrap) != {"dlbook-reference-bootstrap"}:
        errors.append(f"{label}: reference bootstrap tags differ from contract")
    bootstrap_source = cell_source(bootstrap)
    for token in (
        *PINNED_REQUIREMENTS,
        revision,
        "_bootstrap_hashlib.sha256",
        "_bootstrap_urlrequest.urlretrieve",
        RAW_REPO_PREFIX,
        "Canonical hidden cells follow in source order",
    ):
        if token and token not in bootstrap_source:
            errors.append(f"{label}: reference bootstrap is missing {token!r}")
    for asset_path, digest in actual_assets.items():
        for token in (asset_path, digest):
            if token not in bootstrap_source:
                errors.append(
                    f"{label}: reference bootstrap does not pin {asset_path} "
                    f"with {token!r}"
                )

    expected_cells = list(converted.cells)
    if len(cells) != 1 + len(expected_cells):
        errors.append(
            f"{label}: expected bootstrap plus {len(expected_cells)} Quarto cells, "
            f"found {len(cells)}"
        )
    native_index = 0
    surface_by_native = {
        surface.native_ordinal: surface.ordinal
        for surface in parsed.surfaces
        if surface.native_ordinal is not None
    }
    for converted_index, (actual, expected) in enumerate(
        zip(cells[1:], expected_cells), start=1
    ):
        if actual.get("id") != f"reference-{converted_index:04d}":
            errors.append(
                f"{label}: converted cell {converted_index} has an unstable id"
            )
        if actual.get("cell_type") != expected.get("cell_type"):
            errors.append(
                f"{label}: converted cell {converted_index} type differs from Quarto"
            )
        if cell_source(actual) != cell_source(expected):
            errors.append(
                f"{label}: converted cell {converted_index} source differs from Quarto"
            )
        expected_metadata_cell = dict(expected.get("metadata", {}))
        if actual.get("cell_type") == "code":
            if native_index >= len(parsed.native_cells):
                errors.append(f"{label}: reference has an unexpected native code cell")
                continue
            native = parsed.native_cells[native_index]
            native_index += 1
            visibility_tag = (
                "dlbook-reference-hidden"
                if native.hidden
                else "dlbook-reference-visible"
            )
            expected_metadata_cell["tags"] = [
                "dlbook-reference",
                visibility_tag,
            ]
            expected_metadata_cell["dlbook"] = {
                "native_ordinal": native.ordinal,
                "surface_ordinal": surface_by_native.get(native.ordinal),
                "source_line": native.source_line,
                "label": native.label,
                "learner_visible": not native.hidden,
                "figure_id": native.figure_id,
            }
            if actual.get("execution_count") is not None:
                errors.append(
                    f"{label}: reference code cell {converted_index} has execution_count"
                )
            if actual.get("outputs") != []:
                errors.append(
                    f"{label}: reference code cell {converted_index} has saved outputs"
                )
        else:
            expected_metadata_cell["tags"] = ["dlbook-reference-narrative"]
            expected_metadata_cell["dlbook"] = {
                "learner_visible": False,
                "reference": True,
            }
        if actual.get("metadata", {}) != expected_metadata_cell:
            errors.append(
                f"{label}: converted cell {converted_index} metadata differs from "
                "the reference contract"
            )
    if native_index != len(parsed.native_cells):
        errors.append(
            f"{label}: reference contains {native_index} native cells; "
            f"expected {len(parsed.native_cells)}"
        )
    cell_ids = [cell.get("id") for cell in cells]
    if any(not isinstance(cell_id, str) or not cell_id for cell_id in cell_ids):
        errors.append(f"{label}: every reference cell must have a stable id")
    if len(set(cell_ids)) != len(cell_ids):
        errors.append(f"{label}: reference cell ids must be unique")
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


def visible_streams(
    document: dict[str, Any],
    label: str,
    errors: list[str],
    *,
    visible_tag: str = "dlbook-visible",
) -> tuple[list[str], list[int], dict[str, str]]:
    """Collect visible stdout with native-cell ordinals and stable stderr keys."""

    blocks: list[str] = []
    native_ordinals: list[int] = []
    stderr_by_surface: dict[str, str] = {}
    for index, cell in enumerate(document.get("cells", [])):
        if cell.get("cell_type") != "code" or visible_tag not in tags(cell):
            continue
        dlbook = cell.get("metadata", {}).get("dlbook", {})
        surface_ordinal = dlbook.get("surface_ordinal")
        native_ordinal = dlbook.get("native_ordinal")
        if not isinstance(surface_ordinal, int) or surface_ordinal < 1:
            errors.append(f"{label}: visible cell {index} lacks a stable surface ordinal")
        stdout = ""
        stderr = ""
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
                stderr += output_text(output)
        if stdout:
            if not isinstance(native_ordinal, int) or native_ordinal < 1:
                errors.append(
                    f"{label}: stdout cell {index} lacks a native-cell ordinal"
                )
            blocks.append(stdout)
            native_ordinals.append(native_ordinal if isinstance(native_ordinal, int) else -1)
        if stderr:
            key = (
                f"surface-{surface_ordinal:03d}"
                if isinstance(surface_ordinal, int)
                else f"cell-{index:03d}"
            )
            stderr_by_surface[key] = stderr
    return blocks, native_ordinals, stderr_by_surface


def visible_stdout(
    document: dict[str, Any],
    label: str,
    errors: list[str],
    *,
    visible_tag: str = "dlbook-visible",
) -> list[str]:
    """Backward-compatible stdout-only view used by local diagnostics."""

    stdout, _, _ = visible_streams(
        document,
        label,
        errors,
        visible_tag=visible_tag,
    )
    return stdout


def audit_executed_copy(
    source_path: Path,
    executed_path: Path,
    errors: list[str],
) -> dict[str, Any] | None:
    """Require execution to preserve source identity and execute every code cell."""

    source = load_notebook(source_path, errors)
    executed = load_notebook(executed_path, errors)
    if source is None or executed is None:
        return None
    label = executed_path.as_posix()
    if executed.get("metadata", {}).get("dlbook") != source.get("metadata", {}).get(
        "dlbook"
    ):
        errors.append(f"{label}: execution changed notebook dlbook metadata")
    source_cells = source.get("cells", [])
    executed_cells = executed.get("cells", [])
    if len(source_cells) != len(executed_cells):
        errors.append(f"{label}: execution changed the cell count")
        return executed
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
    audit_figure_outputs(executed, label, errors)
    return executed


def valid_figure_payload(mime: str, payload: str) -> bool:
    """Validate the actual image, without resolving XML entities or external DTDs."""
    if mime == "image/svg+xml":
        try:
            root = safe_xml_fromstring(
                payload, forbid_entities=True, forbid_external=True,
            )
        except (ParseError, DefusedXmlException, ValueError):
            return False
        return root.tag in {"svg", "{http://www.w3.org/2000/svg}svg"}
    formats = {"image/png": "PNG", "image/jpeg": "JPEG"}
    if mime not in formats:
        return False
    try:
        data = base64.b64decode("".join(payload.split()), validate=True)
        # open() identifies the header only. verify() checks file integrity;
        # reopening and load() also forces decoding of the complete pixel data.
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(data), formats=[formats[mime]]) as raster:
                if raster.width <= 0 or raster.height <= 0:
                    return False
                raster.verify()
            with Image.open(io.BytesIO(data), formats=[formats[mime]]) as raster:
                raster.load()
    except (
        OSError, ValueError, SyntaxError,
        Image.DecompressionBombError, Image.DecompressionBombWarning,
    ):
        return False
    return True


def audit_figure_outputs(
    document: dict[str, Any], label: str, errors: list[str],
) -> None:
    """A figure must emit real image data, not merely contain drawing code."""
    found = []
    for cell in document.get("cells", []):
        if cell.get("cell_type") != "code":
            continue
        figure_id = cell.get("metadata", {}).get("dlbook", {}).get("figure_id")
        if not figure_id:
            continue
        found.append(figure_id)
        image_count = 0
        for output in cell.get("outputs", []):
            if output.get("output_type") not in {"display_data", "execute_result"}:
                continue
            for mime, payload in output.get("data", {}).items():
                payload = "".join(payload) if isinstance(payload, list) else payload
                if not isinstance(payload, str):
                    continue
                if valid_figure_payload(mime, payload):
                    image_count += 1
        if image_count == 0:
            errors.append(f"{label}: {figure_id} produced no valid PNG, JPEG, or SVG output")
    expected = document.get("metadata", {}).get("dlbook", {}).get("figure_ids")
    if expected is not None and found != expected:
        errors.append(f"{label}: executed figure identities differ from the source contract")
    if len(found) != len(set(found)):
        errors.append(f"{label}: duplicate executed figure identities")


class _HTMLIds(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.ids.update(value for name, value in attrs if name == "id" and value is not None)


def audit_html_backlinks(
    document: dict[str, Any], html_dir: Path, label: str, errors: list[str],
) -> None:
    """Check notebook return links against the rendered canonical edition."""
    from export_notebooks import HTML_ROOT
    cache: dict[Path, set[str]] = {}
    for cell in document.get("cells", []):
        if cell.get("cell_type") != "markdown":
            continue
        for match in re.finditer(r"\]\((https://shakeri-lab\.github\.io/dl-book/[^)\s]*)\)", cell_source(cell)):
            url = match.group(1)
            relative = url[len(HTML_ROOT):]
            parts = urlsplit(relative)
            path = html_dir / unquote(parts.path or "index.html")
            if not path.is_file():
                errors.append(f"{label}: missing canonical return page: {url}")
                continue
            if parts.fragment:
                if path not in cache:
                    parser = _HTMLIds()
                    parser.feed(path.read_text(encoding="utf-8"))
                    cache[path] = parser.ids
                if unquote(parts.fragment) not in cache[path]:
                    errors.append(f"{label}: missing canonical return anchor: {url}")


def _stdout_diff(
    expected: list[str],
    actual: list[str],
    *,
    expected_name: str,
    actual_name: str,
) -> str:
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
            fromfile=expected_name,
            tofile=actual_name,
            n=2,
        )
    )
    if len(diff_lines) > MAX_DIFF_LINES:
        omitted = len(diff_lines) - MAX_DIFF_LINES
        diff_lines = [
            *diff_lines[:MAX_DIFF_LINES],
            f"... diff truncated; {omitted} line(s) omitted ...\n",
        ]
    return "".join(diff_lines)


def compare_stdout(
    expected: list[str],
    actual: list[str],
    *,
    label: str,
    contract: str,
    expected_name: str,
    actual_name: str,
    errors: list[str],
    expected_ordinals: list[int] | None = None,
    actual_ordinals: list[int] | None = None,
) -> bool:
    """Apply an exact ordered-block stdout contract with bounded evidence."""

    ordinals_match = (
        expected_ordinals is None
        and actual_ordinals is None
        or expected_ordinals == actual_ordinals
    )
    if actual == expected and ordinals_match:
        return True
    expected_payload = json.dumps(expected, ensure_ascii=False, separators=(",", ":"))
    actual_payload = json.dumps(actual, ensure_ascii=False, separators=(",", ":"))
    expected_digest = hashlib.sha256(expected_payload.encode("utf-8")).hexdigest()
    actual_digest = hashlib.sha256(actual_payload.encode("utf-8")).hexdigest()
    digest_note = (
        f"sha256 {actual_digest} != {expected_digest}"
        if actual_digest != expected_digest
        else f"stdout sha256 {actual_digest} matches"
    )
    ordinal_note = (
        ""
        if ordinals_match
        else f"; native cells {actual_ordinals} != {expected_ordinals}"
    )
    errors.append(
        f"{label}: {contract} "
        f"({len(actual)} actual block(s), {len(expected)} expected block(s); "
        f"{digest_note}{ordinal_note})\n"
        + _stdout_diff(
            expected,
            actual,
            expected_name=expected_name,
            actual_name=actual_name,
        )
    )
    return False


def frozen_stdout(
    unit: Any, label: str, errors: list[str]
) -> tuple[list[str], list[int]] | None:
    freeze_path = (
        ROOT
        / "_freeze"
        / Path(unit.source).with_suffix("")
        / "execute-results"
        / "html.json"
    )
    if not freeze_path.is_file():
        errors.append(f"{label}: missing frozen stdout source {freeze_path}")
        return None
    records = stdout_records(freeze_path.read_text(encoding="utf-8"))
    return [text for _, text in records], [ordinal for ordinal, _ in records]


def compare_portability_stdout(
    expected: list[str],
    actual: list[str],
    expected_ordinals: list[int],
    actual_ordinals: list[int],
    *,
    label: str,
    policy: str,
    errors: list[str],
    accepted: list[str],
) -> bool:
    """Compare against the committed freeze under an explicit policy.

    The portable policy is exact by default. Its reviewed exceptions parse one
    complete stdout surface and preserve an explicit numerical or structural
    invariant; it never weakens the same-runtime public/reference gate.
    """

    if policy == "exact":
        return compare_stdout(
            expected,
            actual,
            label=label,
            contract="canonical reference stdout differs from frozen HTML",
            expected_name="frozen HTML stdout",
            actual_name="executed canonical reference stdout",
            errors=errors,
            expected_ordinals=expected_ordinals,
            actual_ordinals=actual_ordinals,
        )
    if policy != "portable":
        raise ValueError(f"Unsupported frozen-stdout policy: {policy}")
    result = compare_stdout_blocks(
        label,
        expected,
        actual,
        expected_ordinals=expected_ordinals,
        actual_ordinals=actual_ordinals,
    )
    errors.extend(result.errors)
    accepted.extend(result.accepted_deviations)
    if not result.passed and (
        expected != actual or expected_ordinals != actual_ordinals
    ):
        compare_stdout(
            expected,
            actual,
            label=label,
            contract="portable frozen-stdout contract rejected this transcript",
            expected_name="frozen HTML stdout",
            actual_name="executed canonical reference stdout",
            errors=errors,
            expected_ordinals=expected_ordinals,
            actual_ordinals=actual_ordinals,
        )
    return result.passed


def bounded_report(errors: list[str]) -> str:
    """Format CI evidence with a hard size limit."""

    report = "\n\n".join(errors)
    if len(report) <= MAX_FAILURE_REPORT_CHARS:
        return report
    omitted = len(report) - MAX_FAILURE_REPORT_CHARS
    return (
        report[:MAX_FAILURE_REPORT_CHARS]
        + f"\n... failure report truncated; {omitted} character(s) omitted ..."
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
        "--html-dir",
        type=Path,
        help="Optional rendered HTML root for canonical section/figure backlink checks",
    )
    parser.add_argument(
        "--executed-dir",
        type=Path,
        help="directory containing separately executed notebook copies",
    )
    parser.add_argument(
        "--reference-source-dir",
        type=Path,
        help="directory containing unexecuted canonical Quarto references",
    )
    parser.add_argument(
        "--executed-reference-dir",
        type=Path,
        help="directory containing separately executed canonical references",
    )
    parser.add_argument(
        "--freeze-policy",
        choices=("exact", "portable"),
        default="exact",
        help=(
            "canonical-reference/freeze policy; portable remains exact except "
            "for reviewed, typed per-surface contracts"
        ),
    )
    parser.add_argument(
        "--failure-report",
        type=Path,
        help="write bounded audit evidence here (also written on success)",
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
    if args.executed_reference_dir is not None and args.reference_source_dir is None:
        errors.append("--executed-reference-dir requires --reference-source-dir")
    if args.executed_reference_dir is not None and args.executed_dir is None:
        errors.append("--executed-reference-dir requires --executed-dir")
    selected_slugs = args.slug or [unit.slug for unit in NOTEBOOK_UNITS]
    selected = [UNITS_BY_SLUG[slug] for slug in selected_slugs if slug in UNITS_BY_SLUG]

    try:
        from export_notebooks import (
            _quarto_conversion,
            _support_code,
            collect_surfaces,
            parse_document,
        )
    except (ImportError, ModuleNotFoundError) as error:
        errors.append(f"cannot import notebook exporter: {error}")
        collect_surfaces = None
        parse_document = None
        _support_code = None
        _quarto_conversion = None

    total_surfaces = 0
    executable_surfaces = 0
    include_surfaces = 0
    hidden_cells = 0
    twin_checks = 0
    freeze_checks = 0
    accepted_deviations: list[str] = []
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
        source_document = audit_source_notebook(path, unit, surfaces, support_code, errors)
        if source_document is not None and args.html_dir is not None:
            audit_html_backlinks(source_document, args.html_dir, path.as_posix(), errors)

        reference_path: Path | None = None
        if args.reference_source_dir is not None:
            reference_path = args.reference_source_dir / f"{unit.slug}.ipynb"
            if not reference_path.is_file():
                errors.append(f"missing reference notebook: {reference_path}")
            elif parsed is not None and _quarto_conversion is not None:
                converted = _quarto_conversion(parsed)
                audit_reference_notebook(
                    reference_path,
                    unit,
                    parsed,
                    converted,
                    errors,
                )

        executed: dict[str, Any] | None = None
        if args.executed_dir is not None:
            executed_path = args.executed_dir / f"{unit.slug}.ipynb"
            if not executed_path.is_file():
                errors.append(f"missing executed notebook: {executed_path}")
            else:
                executed = audit_executed_copy(path, executed_path, errors)

        executed_reference: dict[str, Any] | None = None
        if args.executed_reference_dir is not None and reference_path is not None:
            executed_reference_path = (
                args.executed_reference_dir / f"{unit.slug}.ipynb"
            )
            if not executed_reference_path.is_file():
                errors.append(
                    f"missing executed reference notebook: {executed_reference_path}"
                )
            elif reference_path.is_file():
                executed_reference = audit_executed_copy(
                    reference_path,
                    executed_reference_path,
                    errors,
                )

        public_blocks: list[str] | None = None
        public_ordinals: list[int] | None = None
        public_stderr: dict[str, str] = {}
        if executed is not None:
            public_blocks, public_ordinals, public_stderr = visible_streams(
                executed,
                (args.executed_dir / f"{unit.slug}.ipynb").as_posix(),
                errors,
            )
        reference_blocks: list[str] | None = None
        reference_ordinals: list[int] | None = None
        reference_stderr: dict[str, str] = {}
        if executed_reference is not None:
            reference_blocks, reference_ordinals, reference_stderr = visible_streams(
                executed_reference,
                (
                    args.executed_reference_dir / f"{unit.slug}.ipynb"
                ).as_posix(),
                errors,
                visible_tag="dlbook-reference-visible",
            )

        for form, stderr in (
            ("public", public_stderr),
            ("reference", reference_stderr),
        ):
            if form == "reference" and executed_reference is None:
                continue
            if form == "public" and executed is None:
                continue
            stderr_result = compare_stderr_outputs(unit.slug, stderr)
            errors.extend(
                f"{form}: {message}" for message in stderr_result.errors
            )
            accepted_deviations.extend(
                f"{form}: {message}"
                for message in stderr_result.accepted_deviations
            )

        if public_blocks is not None and reference_blocks is not None:
            if compare_stdout(
                reference_blocks,
                public_blocks,
                label=unit.slug,
                contract=(
                    "public notebook stdout differs from the same-runtime "
                    "canonical Quarto reference"
                ),
                expected_name="executed canonical reference stdout",
                actual_name="executed public notebook stdout",
                errors=errors,
                expected_ordinals=reference_ordinals,
                actual_ordinals=public_ordinals,
            ):
                twin_checks += 1

        canonical_blocks = (
            reference_blocks if reference_blocks is not None else public_blocks
        )
        canonical_ordinals = (
            reference_ordinals
            if reference_ordinals is not None
            else public_ordinals
        )
        if canonical_blocks is not None and canonical_ordinals is not None:
            frozen = frozen_stdout(unit, unit.slug, errors)
            if frozen is not None:
                expected_blocks, expected_ordinals = frozen
                passed = compare_portability_stdout(
                    expected_blocks,
                    canonical_blocks,
                    expected_ordinals,
                    canonical_ordinals,
                    label=unit.slug,
                    policy=args.freeze_policy,
                    errors=errors,
                    accepted=accepted_deviations,
                )
                if passed:
                    freeze_checks += 1

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
        for directory, description in (
            (args.reference_source_dir, "reference notebook"),
            (args.executed_reference_dir, "executed reference notebook"),
        ):
            if directory is None:
                continue
            actual_files = {path.name for path in directory.glob("*.ipynb")}
            if actual_files != expected_files:
                errors.append(
                    f"{directory}: {description} file set differs; missing "
                    f"{sorted(expected_files - actual_files)}, extra "
                    f"{sorted(actual_files - expected_files)}"
                )

    if errors:
        report = bounded_report(errors)
        print(report)
        summary = f"FAILED: {len(errors)} notebook export contract violation(s)"
        if args.executed_reference_dir is not None:
            summary += (
                f"; same-runtime twin passes {twin_checks}/{len(selected)}; "
                f"{args.freeze_policy} freeze passes "
                f"{freeze_checks}/{len(selected)}"
            )
        print(summary)
        if args.failure_report is not None:
            args.failure_report.parent.mkdir(parents=True, exist_ok=True)
            args.failure_report.write_text(report + "\n" + summary + "\n", encoding="utf-8")
        return 1

    for deviation in accepted_deviations:
        print(f"PORTABLE: {deviation}")

    execution = (
        f"; executed stdout verified in {args.executed_dir}"
        if args.executed_dir is not None
        else ""
    )
    summary = (
        f"PASS: {len(selected)} notebook(s), {total_surfaces} visible surfaces "
        f"({executable_surfaces} executable, {include_surfaces} transcluded), "
        f"commit-pinned clean source artifacts{execution}"
    )
    if args.executed_reference_dir is not None:
        summary += (
            f"; {twin_checks} exact same-runtime public/reference stdout checks; "
            f"{freeze_checks} {args.freeze_policy} canonical-reference/freeze checks"
        )
    if accepted_deviations:
        summary += f"; {len(accepted_deviations)} reviewed portability deviations"
    print(summary)
    if args.failure_report is not None:
        args.failure_report.parent.mkdir(parents=True, exist_ok=True)
        evidence = [
            *(f"PORTABLE: {item}" for item in accepted_deviations),
            summary,
        ]
        args.failure_report.write_text("\n".join(evidence) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
