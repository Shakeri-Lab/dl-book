#!/usr/bin/env python3
"""Export compact, self-contained public notebooks from the book's QMD sources.

The HTML book remains canonical.  Each notebook contains the same Plan text and
learner-visible Python as one manuscript unit, plus one generated bootstrap cell
that pins the execution environment and fetches only the commit-pinned artifacts
needed by that unit.  Plot-only ``echo: false`` harnesses are deliberately absent.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
import fnmatch
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tempfile
from typing import Any, Iterable

import nbformat

from notebook_manifest import (
    EXPECTED_NOTEBOOKS,
    NOTEBOOK_UNITS,
    PINNED_REQUIREMENTS,
    PROJECT_ROOT,
    UNITS_BY_SLUG,
    NotebookUnit,
    SupportSelector,
)


REPOSITORY = "Shakeri-Lab/dl-book"
EXPECTED_VISIBLE_SURFACES = 193
EXPECTED_HIDDEN_CELLS = 93
EXPECTED_INCLUDED_SURFACES = 4
SUPPORT_START = "# notebook-support-start"
SUPPORT_END = "# notebook-support-end"

DIV_OPEN_RE = re.compile(r"^(:{3,})\s+\{([^}]*)\}\s*$")
CODE_OPEN_RE = re.compile(r"^```(.*)$")
OPTION_RE = re.compile(r"^#\|\s*([\w-]+):\s*(.*?)\s*$", re.MULTILINE)
INCLUDE_RE = re.compile(r'book-include="([^"]+)"')
START_RE = re.compile(r"start-line=(\d+)")
END_RE = re.compile(r"end-line=(\d+)")


@dataclass(frozen=True)
class NativeCell:
    """One executable ``{python}`` cell in source order."""

    ordinal: int
    source_line: int
    body: str
    label: str | None
    hidden: bool


@dataclass(frozen=True)
class Surface:
    """One learner-visible Plan -> Code surface."""

    ordinal: int
    source_line: int
    plan: str
    code: str
    label: str | None
    include: str | None
    executable: bool


@dataclass(frozen=True)
class ParsedDocument:
    """The notebook-relevant structure recovered from one QMD file."""

    source: Path
    title: str
    native_cells: tuple[NativeCell, ...]
    surfaces: tuple[Surface, ...]

    @property
    def hidden_cells(self) -> int:
        return sum(cell.hidden for cell in self.native_cells)

    @property
    def included_surfaces(self) -> int:
        return sum(surface.include is not None for surface in self.surfaces)


def _classes(attributes: str) -> set[str]:
    return {
        token.removeprefix(".")
        for token in attributes.split()
        if token.startswith(".")
    }


def _cell_options(body: str) -> dict[str, str]:
    return dict(OPTION_RE.findall(body))


def learner_code(body: str) -> str:
    """Remove Quarto execution directives, which are not printed as code."""

    lines = [line for line in body.splitlines() if not line.startswith("#|")]
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    return "\n".join(lines)


def _included_code(source: Path, opener: str) -> tuple[str, str]:
    include_match = INCLUDE_RE.search(opener)
    if include_match is None:
        raise ValueError(f"Missing book-include path at {source}")
    relative = include_match.group(1)
    include_path = PROJECT_ROOT / relative
    if not include_path.is_file():
        raise FileNotFoundError(f"Included notebook source does not exist: {relative}")
    lines = include_path.read_text(encoding="utf-8").splitlines()
    start_match = START_RE.search(opener)
    end_match = END_RE.search(opener)
    first = int(start_match.group(1)) if start_match else 1
    last = int(end_match.group(1)) if end_match else len(lines)
    if first < 1 or last < first or last > len(lines):
        raise ValueError(
            f"Invalid include range {first}:{last} for {relative} ({len(lines)} lines)"
        )
    return "\n".join(lines[first - 1 : last]), relative


def _compiles(source: str) -> bool:
    try:
        compile(source, "<learner-visible-cell>", "exec")
    except SyntaxError:
        return False
    return True


def _title(lines: list[str], source: Path) -> str:
    for line in lines:
        if line.startswith("# "):
            return re.sub(r"\s+\{[^}]*\}\s*$", "", line[2:]).strip()
    raise ValueError(f"No level-one title in {source}")


def parse_document(source_path: str | Path) -> ParsedDocument:
    """Parse visible panels and native cells without interpreting manuscript prose."""

    source = Path(source_path)
    if not source.is_absolute():
        source = PROJECT_ROOT / source
    lines = source.read_text(encoding="utf-8").splitlines()
    native_cells: list[NativeCell] = []
    surfaces: list[Surface] = []

    panel_fence: str | None = None
    panel_line: int | None = None
    plan_lines: list[str] = []
    in_plan = False
    panel_surfaces = 0
    native_ordinal = 0
    index = 0

    while index < len(lines):
        line = lines[index]
        div_open = DIV_OPEN_RE.match(line)
        if div_open:
            classes = _classes(div_open.group(2))
            if "plan-code" in classes:
                if panel_fence is not None:
                    raise ValueError(f"Nested plan-code panel at {source}:{index + 1}")
                panel_fence = div_open.group(1)
                panel_line = index + 1
                plan_lines = []
                panel_surfaces = 0
                index += 1
                continue
            if panel_fence is not None and "plan" in classes:
                if in_plan:
                    raise ValueError(f"Nested plan at {source}:{index + 1}")
                in_plan = True
                index += 1
                continue

        if in_plan:
            if line == ":::":
                in_plan = False
            else:
                plan_lines.append(line)
            index += 1
            continue

        code_open = CODE_OPEN_RE.match(line)
        if code_open:
            opener = code_open.group(1).strip()
            close = index + 1
            while close < len(lines) and lines[close] != "```":
                close += 1
            if close == len(lines):
                raise ValueError(f"Unclosed code fence at {source}:{index + 1}")
            body = "\n".join(lines[index + 1 : close])
            is_native = opener == "{python}"
            is_include = opener.startswith("{.python ") and "book-include=" in opener

            if is_native:
                native_ordinal += 1
                options = _cell_options(body)
                hidden = options.get("echo", "true").lower() == "false"
                native_cells.append(
                    NativeCell(
                        ordinal=native_ordinal,
                        source_line=index + 1,
                        body=body,
                        label=options.get("label"),
                        hidden=hidden,
                    )
                )
                if not hidden:
                    if panel_fence is None:
                        raise ValueError(
                            f"Visible Python outside Plan -> Code at {source}:{index + 1}"
                        )
                    code = learner_code(body)
                    if not _compiles(code):
                        raise SyntaxError(
                            f"Visible native cell does not compile at {source}:{index + 1}"
                        )
                    panel_surfaces += 1
                    surfaces.append(
                        Surface(
                            ordinal=len(surfaces) + 1,
                            source_line=index + 1,
                            plan="\n".join(plan_lines).strip(),
                            code=code,
                            label=options.get("label"),
                            include=None,
                            executable=True,
                        )
                    )
            elif is_include:
                if panel_fence is None:
                    raise ValueError(
                        f"Included Python outside Plan -> Code at {source}:{index + 1}"
                    )
                code, include = _included_code(source, opener)
                panel_surfaces += 1
                surfaces.append(
                    Surface(
                        ordinal=len(surfaces) + 1,
                        source_line=index + 1,
                        plan="\n".join(plan_lines).strip(),
                        code=code,
                        label=None,
                        include=include,
                        executable=_compiles(code),
                    )
                )
            index = close + 1
            continue

        if panel_fence is not None and line == panel_fence:
            if not plan_lines:
                raise ValueError(f"Empty Plan at {source}:{panel_line}")
            if panel_surfaces != 1:
                raise ValueError(
                    f"Plan -> Code panel at {source}:{panel_line} has "
                    f"{panel_surfaces} visible surfaces"
                )
            panel_fence = None
            panel_line = None
            plan_lines = []
            panel_surfaces = 0
            index += 1
            continue

        index += 1

    if panel_fence is not None:
        raise ValueError(f"Unclosed Plan -> Code panel at {source}:{panel_line}")
    return ParsedDocument(
        source=source,
        title=_title(lines, source),
        native_cells=tuple(native_cells),
        surfaces=tuple(surfaces),
    )


def collect_surfaces(source_path: str | Path) -> tuple[Surface, ...]:
    """Public audit API: return the ordered learner-visible surfaces."""

    return parse_document(source_path).surfaces


def _support_code(document: ParsedDocument, selector: SupportSelector | None) -> str:
    if selector is None:
        return ""
    candidates = [
        cell
        for cell in document.native_cells
        if (
            selector.cell_label is not None
            and cell.label == selector.cell_label
        )
        or (
            selector.cell_ordinal is not None
            and cell.ordinal == selector.cell_ordinal
        )
    ]
    if len(candidates) != 1:
        raise ValueError(
            f"Support selector matched {len(candidates)} cells in {document.source}"
        )
    cell = candidates[0]
    if not cell.hidden:
        raise ValueError(
            "Notebook support must come from an echo:false cell: "
            f"{document.source}:{cell.source_line}"
        )
    code = learner_code(cell.body)
    if selector.delimited:
        lines = code.splitlines()
        starts = [i for i, line in enumerate(lines) if line == SUPPORT_START]
        ends = [i for i, line in enumerate(lines) if line == SUPPORT_END]
        if len(starts) != 1 or len(ends) != 1 or starts[0] >= ends[0]:
            raise ValueError(
                f"Expected one ordered notebook support delimiter pair in {document.source}"
            )
        code = "\n".join(lines[starts[0] + 1 : ends[0]]).strip()
    if re.search(r"(^|\W)print\s*\(", code):
        raise ValueError(f"Notebook support must remain silent: {document.source}")
    plotting_calls = ("plt.figure(", "plt.subplots(", "plt.show(", ".add_patch(")
    if any(call in code for call in plotting_calls):
        raise ValueError(f"Notebook support contains plotting work: {document.source}")
    if not _compiles(code):
        raise SyntaxError(f"Notebook support does not compile: {document.source}")
    return code


def _git(*arguments: str, binary: bool = False) -> str | bytes:
    result = subprocess.run(
        ["git", *arguments],
        cwd=PROJECT_ROOT,
        check=True,
        capture_output=True,
        text=not binary,
    )
    return result.stdout


def resolve_revision(revision: str) -> str:
    return str(_git("rev-parse", f"{revision}^{{commit}}")).strip()


def _revision_files(revision: str) -> tuple[str, ...]:
    listing = str(_git("ls-tree", "-r", "--name-only", revision))
    return tuple(line for line in listing.splitlines() if line)


def _asset_records(unit: NotebookUnit, revision: str) -> tuple[dict[str, str], ...]:
    revision_files = _revision_files(revision)
    selected: set[str] = set()
    for pattern in unit.assets:
        matches = sorted(fnmatch.filter(revision_files, pattern))
        if not matches:
            raise FileNotFoundError(
                f"Notebook asset pattern has no match at {revision}: {pattern}"
            )
        selected.update(matches)

    records = []
    for path in sorted(selected):
        payload = bytes(_git("show", f"{revision}:{path}", binary=True))
        records.append({"path": path, "sha256": hashlib.sha256(payload).hexdigest()})
    return tuple(records)


def _bootstrap_source(
    *,
    document: ParsedDocument,
    unit: NotebookUnit,
    revision: str,
    assets: tuple[dict[str, str], ...],
    support: str,
    repository: str,
) -> str:
    requirements = json.dumps(list(PINNED_REQUIREMENTS), indent=4)
    asset_json = json.dumps(list(assets), indent=4)
    source_dir = Path(unit.source).parent.as_posix()
    source_url = f"https://github.com/{repository}/blob/{revision}/{unit.source}"
    lines = [
        f"# {document.title}",
        "# Generated from the canonical HTML manuscript. Run this cell first.",
        f"# Source: {source_url}",
        "",
        "from importlib.metadata import PackageNotFoundError, version as package_version",
        "import hashlib as _bootstrap_hashlib",
        "import os as _bootstrap_os",
        "from pathlib import Path as _BootstrapPath",
        "import subprocess as _bootstrap_subprocess",
        "import sys as _bootstrap_sys",
        "import urllib.request as _bootstrap_urlrequest",
        "",
        f"_BOOK_REVISION = {revision!r}",
        f"_PINNED_REQUIREMENTS = {requirements}",
        f"_BOOK_ASSETS = {asset_json}",
        "",
        "def _installed_requirement(requirement: str) -> bool:",
        "    name, expected = requirement.split('==', 1)",
        "    try:",
        "        return package_version(name) == expected",
        "    except PackageNotFoundError:",
        "        return False",
        "",
        "_missing_requirements = [",
        "    item for item in _PINNED_REQUIREMENTS if not _installed_requirement(item)",
        "]",
        "if _missing_requirements:",
        "    _bootstrap_install = _bootstrap_subprocess.run(",
        "        [_bootstrap_sys.executable, '-m', 'pip', 'install', '--quiet',",
        "         *_missing_requirements],",
        "        check=False, capture_output=True, text=True,",
        "    )",
        "    if _bootstrap_install.returncode != 0:",
        "        raise RuntimeError(_bootstrap_install.stdout + _bootstrap_install.stderr)",
        "",
        "_bootstrap_base = _BootstrapPath(",
        "    _bootstrap_os.environ.get(",
        "        'DLBOOK_NOTEBOOK_ROOT',",
        "        '/content' if _BootstrapPath('/content').is_dir()",
        "        else str(_BootstrapPath.home() / '.cache'),",
        "    )",
        ")",
        "_BOOK_ROOT = _bootstrap_base / f'dl-book-{_BOOK_REVISION[:12]}'",
        f"_RAW_ROOT = 'https://raw.githubusercontent.com/{repository}/' + _BOOK_REVISION + '/'",
        "for _record in _BOOK_ASSETS:",
        "    _destination = _BOOK_ROOT / _record['path']",
        "    _destination.parent.mkdir(parents=True, exist_ok=True)",
        "    _valid = (",
        "        _destination.is_file()",
        "        and _bootstrap_hashlib.sha256(_destination.read_bytes()).hexdigest()",
        "        == _record['sha256']",
        "    )",
        "    if not _valid:",
        "        _temporary = _destination.with_suffix(_destination.suffix + '.part')",
        "        _bootstrap_urlrequest.urlretrieve(_RAW_ROOT + _record['path'], _temporary)",
        "        _digest = _bootstrap_hashlib.sha256(_temporary.read_bytes()).hexdigest()",
        "        if _digest != _record['sha256']:",
        "            _temporary.unlink(missing_ok=True)",
        "            raise RuntimeError(f\"Checksum mismatch for {_record['path']}\")",
        "        _temporary.replace(_destination)",
        "",
        "(_BOOK_ROOT / " + repr(source_dir) + ").mkdir(parents=True, exist_ok=True)",
        "_bootstrap_sys.path.insert(0, str(_BOOK_ROOT / 'code'))",
        "_bootstrap_os.chdir(_BOOK_ROOT / " + repr(source_dir) + ")",
        "",
        "# Hidden manuscript support required by later learner-visible cells.",
        "# Plot-only harnesses are not exported.",
        "import torch",
        "from torch import nn",
    ]
    if support:
        lines.extend(("", support))
    lines.extend(("", "assert _BOOK_ROOT.is_dir()"))
    return "\n".join(lines)


def _validate_quarto_conversion(document: ParsedDocument) -> None:
    with tempfile.TemporaryDirectory(prefix="dlbook-quarto-convert-") as directory:
        output = Path(directory) / (document.source.stem + ".ipynb")
        subprocess.run(
            ["quarto", "convert", str(document.source), "--output", str(output)],
            cwd=PROJECT_ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        raw = nbformat.read(output, as_version=4)
    raw_code = [cell for cell in raw.cells if cell.cell_type == "code"]
    if len(raw_code) != len(document.native_cells):
        raise ValueError(
            f"quarto convert emitted {len(raw_code)} code cells for "
            f"{document.source}, expected {len(document.native_cells)}"
        )
    for converted, native in zip(raw_code, document.native_cells, strict=True):
        if learner_code(converted.source) != learner_code(native.body):
            raise ValueError(
                f"quarto convert changed Python at {document.source}:{native.source_line}"
            )


def _surface_metadata(surface: Surface) -> dict[str, Any]:
    return {
        "surface_ordinal": surface.ordinal,
        "source_line": surface.source_line,
        "label": surface.label,
        "include": surface.include,
        "executable": surface.executable,
    }


def _support_metadata(unit: NotebookUnit, support: str) -> dict[str, Any] | None:
    if unit.support is None:
        if support:
            raise ValueError(f"Unselected notebook support found for {unit.source}")
        return None
    if not support:
        raise ValueError(f"Selected notebook support is empty for {unit.source}")
    return {
        "source": unit.source,
        "cell_label": unit.support.cell_label,
        "cell_ordinal": unit.support.cell_ordinal,
        "delimited": unit.support.delimited,
        "sha256": hashlib.sha256(support.encode("utf-8")).hexdigest(),
    }


def _build_notebook(
    unit: NotebookUnit,
    revision: str,
    *,
    repository: str = REPOSITORY,
) -> Any:
    """Build one unexecuted notebook from an already-resolved revision."""

    document = parse_document(unit.source)
    _validate_quarto_conversion(document)
    support = _support_code(document, unit.support)
    support_metadata = _support_metadata(unit, support)
    assets = _asset_records(unit, revision)
    source_url = f"https://github.com/{repository}/blob/{revision}/{unit.source}"

    metadata = {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3",
        },
        "language_info": {"name": "python", "version": "3.12"},
        "dlbook": {
            "source": unit.source,
            "slug": unit.slug,
            "revision": revision,
            "source_url": source_url,
            "requirements": list(PINNED_REQUIREMENTS),
            "assets": list(assets),
            "support": support_metadata,
            "learner_visible_surfaces": len(document.surfaces),
        },
    }

    bootstrap_source = _bootstrap_source(
        document=document,
        unit=unit,
        revision=revision,
        assets=assets,
        support=support,
        repository=repository,
    )
    if not _compiles(bootstrap_source):
        raise SyntaxError(f"Notebook bootstrap does not compile: {unit.source}")
    bootstrap = nbformat.v4.new_code_cell(
        bootstrap_source,
        metadata={
            "tags": ["dlbook-bootstrap", "dlbook-support"],
            "dlbook": {
                "executable": True,
                "learner_visible": False,
                "support": support_metadata,
            },
        },
    )
    bootstrap["id"] = "bootstrap"
    cells = [bootstrap]
    for surface in document.surfaces:
        surface_meta = _surface_metadata(surface)
        plan = nbformat.v4.new_markdown_cell(
            "**Plan**\n\n" + surface.plan,
            metadata={"tags": ["dlbook-plan"], "dlbook": surface_meta},
        )
        plan["id"] = f"plan-{surface.ordinal:03d}"
        cells.append(plan)
        if surface.executable:
            visible = nbformat.v4.new_code_cell(
                surface.code,
                metadata={"tags": ["dlbook-visible"], "dlbook": surface_meta},
            )
        else:
            visible = nbformat.v4.new_markdown_cell(
                "```python\n" + surface.code + "\n```",
                metadata={
                    "tags": ["dlbook-visible", "dlbook-listing"],
                    "dlbook": surface_meta,
                },
            )
        visible["id"] = f"surface-{surface.ordinal:03d}"
        cells.append(visible)

    notebook = nbformat.v4.new_notebook(cells=cells, metadata=metadata)
    notebook["nbformat_minor"] = 5
    for cell in notebook.cells:
        if cell.cell_type == "code":
            cell.execution_count = None
            cell.outputs = []
    return notebook


def build_notebook(
    unit: NotebookUnit,
    revision: str,
    *,
    repository: str = REPOSITORY,
) -> Any:
    """Build one unexecuted notebook node from a manifest unit."""

    return _build_notebook(
        unit,
        resolve_revision(revision),
        repository=repository,
    )


def validate_book_contract() -> dict[str, int]:
    """Assert that the checked manifest still describes the promised book surface."""

    documents = [parse_document(unit.source) for unit in NOTEBOOK_UNITS]
    counts = {
        "notebooks": len(documents),
        "visible_surfaces": sum(len(document.surfaces) for document in documents),
        "hidden_cells": sum(document.hidden_cells for document in documents),
        "included_surfaces": sum(document.included_surfaces for document in documents),
        "nonexecutable_listings": sum(
            not surface.executable
            for document in documents
            for surface in document.surfaces
        ),
    }
    expected = {
        "notebooks": EXPECTED_NOTEBOOKS,
        "visible_surfaces": EXPECTED_VISIBLE_SURFACES,
        "hidden_cells": EXPECTED_HIDDEN_CELLS,
        "included_surfaces": EXPECTED_INCLUDED_SURFACES,
        "nonexecutable_listings": 1,
    }
    if counts != expected:
        raise ValueError(f"Notebook surface contract changed: {counts}; expected {expected}")
    return counts


def export_notebooks(
    output_dir: str | Path,
    revision: str,
    slugs: Iterable[str] | None = None,
    *,
    repository: str = REPOSITORY,
) -> tuple[Path, ...]:
    """Export selected source notebooks without outputs or execution counts."""

    validate_book_contract()
    resolved = resolve_revision(revision)
    selected_slugs = list(slugs) if slugs is not None else [
        unit.slug for unit in NOTEBOOK_UNITS
    ]
    unknown = sorted(set(selected_slugs) - set(UNITS_BY_SLUG))
    if unknown:
        raise ValueError("Unknown notebook slug(s): " + ", ".join(unknown))
    if len(set(selected_slugs)) != len(selected_slugs):
        raise ValueError("Notebook slugs must not be repeated")

    destination = Path(output_dir)
    destination.mkdir(parents=True, exist_ok=True)
    written = []
    for slug in selected_slugs:
        unit = UNITS_BY_SLUG[slug]
        notebook = _build_notebook(unit, resolved, repository=repository)
        path = destination / f"{unit.slug}.ipynb"
        temporary = path.with_suffix(".ipynb.tmp")
        nbformat.write(notebook, temporary)
        temporary.replace(path)
        written.append(path)
        print(
            f"exported {unit.slug}: "
            f"{notebook.metadata['dlbook']['learner_visible_surfaces']} surfaces"
        )
    return tuple(written)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output-dir",
        default="build/notebooks/source",
        help="Directory for unexecuted public notebooks",
    )
    parser.add_argument(
        "--revision",
        default="HEAD",
        help="Git revision embedded in source and asset URLs (default: HEAD)",
    )
    parser.add_argument(
        "--slug",
        action="append",
        help="Export only this manifest slug; repeat to select more than one",
    )
    parser.add_argument(
        "--repository",
        default=REPOSITORY,
        help="GitHub owner/repository used for source and raw asset URLs",
    )
    args = parser.parse_args()
    counts = validate_book_contract()
    print(
        "notebook contract: "
        + ", ".join(f"{key}={value}" for key, value in counts.items())
    )
    export_notebooks(
        args.output_dir,
        args.revision,
        args.slug,
        repository=args.repository,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
