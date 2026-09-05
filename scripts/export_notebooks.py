#!/usr/bin/env python3
"""Export public notebooks and full internal execution references from QMD.

The HTML book remains canonical.  Each notebook contains the same Plan text and
learner-visible Python as one manuscript unit, plus one generated bootstrap cell
that pins the execution environment and fetches only the commit-pinned artifacts
needed by that unit. Canonical hidden cells also run in their original positions,
with their source collapsed, so readers can regenerate the figures. An optional
internal reference retains every
Quarto-converted cell in source order so CI can execute both forms in the same
pinned environment.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from functools import lru_cache
import fnmatch
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tempfile
import unicodedata
from typing import Any, Iterable
from urllib.parse import urljoin

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
HTML_ROOT = "https://shakeri-lab.github.io/dl-book/"
EXPECTED_VISIBLE_SURFACES = 194
EXPECTED_HIDDEN_CELLS = 94
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
    figure_id: str | None = None


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
    native_ordinal: int | None


@dataclass(frozen=True)
class ParsedDocument:
    """The notebook-relevant structure recovered from one QMD file."""

    source: Path
    title: str
    native_cells: tuple[NativeCell, ...]
    surfaces: tuple[Surface, ...]
    contexts: tuple["NotebookContext", ...] = ()

    @property
    def hidden_cells(self) -> int:
        return sum(cell.hidden for cell in self.native_cells)

    @property
    def included_surfaces(self) -> int:
        return sum(surface.include is not None for surface in self.surfaces)


@dataclass(frozen=True)
class NotebookContext:
    """A source-authored section or opt-in prediction, never a second manuscript."""

    source_line: int
    kind: str
    text: str
    anchor: str
    level: int = 2


def _heading_anchor(text: str) -> str:
    """Pandoc automatic identifiers for the prose headings used by this book."""
    text = re.sub(r"\[([^]]+)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"<[^>]+>", "", text).lower()
    text = "".join(
        character for character in text
        if character in "_- ." or character.isalnum() or character.isspace()
        or unicodedata.category(character).startswith("M")
    )
    text = re.sub(r"\s+", "-", text)
    return re.sub(r"^[^a-zA-Z\u0080-\uffff]+", "", text) or "section"


def _notebook_context(
    lines: list[str],
) -> tuple[tuple[NotebookContext, ...], dict[int, str]]:
    contexts: list[NotebookContext] = []
    figures: dict[int, str] = {}
    stack: list[tuple[str, str]] = []
    seen_anchors: dict[str, int] = {}
    section_anchor = ""
    index = 0
    while index < len(lines):
        line = lines[index]
        if line.lstrip().startswith("<!--"):
            while "-->" not in lines[index] and index + 1 < len(lines):
                index += 1
        elif CODE_OPEN_RE.match(line):
            if line == "```{python}":
                for _, attributes in reversed(stack):
                    match = re.search(r"#((?:exfig|aefig|ttrfig|epfig|fig)-[\w-]+)", attributes)
                    if match:
                        figures[index + 1] = match.group(1)
                        break
            index += 1
            while index < len(lines) and lines[index] != "```":
                index += 1
        elif (opener := DIV_OPEN_RE.match(line)):
            fence, attributes = opener.groups()
            if "notebook-prediction" in _classes(attributes):
                start = index
                nested = 1
                content: list[str] = []
                index += 1
                while index < len(lines):
                    if DIV_OPEN_RE.match(lines[index]):
                        nested += 1
                    elif re.fullmatch(r":{3,}\s*", lines[index]):
                        nested -= 1
                        if nested == 0:
                            break
                    content.append(lines[index])
                    index += 1
                if nested:
                    raise ValueError(f"Unclosed notebook prediction at line {start + 1}")
                contexts.append(NotebookContext(
                    start + 1, "prediction", "\n".join(content).strip(), section_anchor,
                ))
            else:
                stack.append((fence, attributes))
        elif stack and line.strip() == stack[-1][0]:
            stack.pop()
        elif not stack and (heading := re.match(r"^(#{2,4})\s+(.+)$", line)):
            text = heading.group(2)
            attributes = re.search(r"\s+\{([^}]*)\}\s*$", text)
            explicit = re.search(r"#([\w.-]+)", attributes.group(1)) if attributes else None
            text = re.sub(r"\s+\{[^}]*\}\s*$", "", text)
            base = explicit.group(1) if explicit else _heading_anchor(text)
            count = seen_anchors.get(base, 0)
            section_anchor = base if count == 0 else f"{base}-{count}"
            seen_anchors[base] = count + 1
            contexts.append(NotebookContext(
                index + 1, "section", text, section_anchor, len(heading.group(1)),
            ))
        index += 1
    return tuple(contexts), figures

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
    contexts, wrapper_figures = _notebook_context(lines)
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
                        figure_id=(
                            options.get("label")
                            if options.get("label", "").startswith("fig-")
                            else wrapper_figures.get(index + 1)
                        ),
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
                            native_ordinal=native_ordinal,
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
                        native_ordinal=None,
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
        contexts=contexts,
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
    reference: bool = False,
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
        "        # PEP 440 local labels (+cpu, +cu...) retain the pinned base version.",
        "        return package_version(name).split('+', 1)[0] == expected",
        "    except PackageNotFoundError:",
        "        return False",
        "",
        "_missing_requirements = [",
        "    item for item in _PINNED_REQUIREMENTS if not _installed_requirement(item)",
        "]",
        "if _missing_requirements:",
        "    if _bootstrap_os.environ.get('DLBOOK_NOTEBOOK_CANONICAL') == '1':",
        "        raise RuntimeError('Canonical notebook runtime is missing pinned requirements: '",
        "                           + ', '.join(_missing_requirements))",
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
        "        if _bootstrap_os.environ.get('DLBOOK_NOTEBOOK_CANONICAL') == '1':",
        "            raise RuntimeError('Canonical notebook asset is missing or changed: '",
        "                               + _record['path'])",
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
        (
            "# Canonical hidden cells follow in source order in this internal reference."
            if reference
            else "# Canonical setup and figure cells follow in manuscript order."
        ),
        (
            "# They are retained here as the execution control for the compact artifact."
            if reference
            else "# Their source is collapsed, but Run all executes each cell once."
        ),
        "import torch",
        "from torch import nn",
    ]
    if support:
        lines.extend(("", support))
    lines.extend(("", "assert _BOOK_ROOT.is_dir()"))
    return "\n".join(lines)


def _quarto_conversion(document: ParsedDocument) -> Any:
    """Return Quarto's notebook conversion after checking native Python parity."""

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
    return raw


def _surface_metadata(surface: Surface) -> dict[str, Any]:
    return {
        "surface_ordinal": surface.ordinal,
        "source_line": surface.source_line,
        "label": surface.label,
        "include": surface.include,
        "executable": surface.executable,
        "native_ordinal": surface.native_ordinal,
    }


@lru_cache(maxsize=1)
def _crossref_targets() -> dict[str, str]:
    targets: dict[str, str] = {}
    for path in [PROJECT_ROOT / "index.qmd", *sorted((PROJECT_ROOT / "chapters").rglob("*.qmd"))]:
        if not path.is_file():
            continue
        url = HTML_ROOT + path.relative_to(PROJECT_ROOT).with_suffix(".html").as_posix()
        source = path.read_text(encoding="utf-8")
        labels = re.findall(r"\{[^}\n]*#([\w.-]+)[^}\n]*\}", source)
        labels += re.findall(r"^#\|\s*label:\s*([\w.-]+)", source, re.MULTILINE)
        for label in labels:
            targets[label] = f"{url}#{label}"
    return targets


@lru_cache(maxsize=1)
def _notebook_macros() -> dict[str, tuple[str, int]]:
    """Read HTML's paired macro authority; avoid another handwritten palette."""
    macros = {}
    source = (PROJECT_ROOT / "mathjax-config.html").read_text(encoding="utf-8")
    for match in re.finditer(r'^\s*(\w+):\s*(".*"|\[".*",\s*1\]),?\s*$', source, re.MULTILINE):
        value = json.loads(match.group(2))
        body, arguments = (value, 0) if isinstance(value, str) else value
        # Notebook frontends do not all enable MathJax's HTML-style extension.
        color = re.fullmatch(r"\\style\{color:rgb\((\d+),(\d+),(\d+)\)\}\{#1\}", body)
        if color:
            hex_color = "#" + "".join(f"{int(channel):02X}" for channel in color.groups())
            body = "{\\color{" + hex_color + "}#1}"
        macros[match.group(1)] = (body, arguments)
    return macros


def notebook_markdown(text: str, canonical_url: str) -> str:
    """Resolve book-only macros and cross-references in copied prediction prose."""
    macros = _notebook_macros()
    for _ in range(20):
        changed = False
        def expand(match: re.Match[str]) -> str:
            nonlocal changed
            name = match.group(1)
            if name not in macros or macros[name][1]:
                return match.group(0)
            changed = True
            return macros[name][0]
        text = re.sub(r"\\([A-Za-z]+)\b", expand, text)
        for name, (body, arguments) in macros.items():
            if not arguments:
                continue
            pattern = re.compile(r"\\" + name + r"\s*\{")
            cursor = 0
            while match := pattern.search(text, cursor):
                depth, end = 1, match.end()
                while end < len(text) and depth:
                    if text[end] == "{" and text[end - 1] != "\\":
                        depth += 1
                    elif text[end] == "}" and text[end - 1] != "\\":
                        depth -= 1
                    end += 1
                if depth:
                    raise ValueError(f"Unbalanced macro in notebook prose: {name}")
                argument = text[match.end():end - 1]
                replacement = body.replace("#1", argument)
                text = text[:match.start()] + replacement + text[end:]
                cursor = match.start() + len(replacement)
                changed = True
        if not changed:
            break

    targets = _crossref_targets()
    def crossref(match: re.Match[str]) -> str:
        label = match.group(1)
        if label not in targets:
            raise ValueError(f"Unresolved notebook prediction reference: @{label}")
        kind = "equation" if label.startswith("eq-") else (
            "figure" if "fig-" in label else "section" if label.startswith("sec-") else "reference"
        )
        return f"[the {kind}]({targets[label]})"
    text = re.sub(r"(?<![\w/])@([\w-]+)", crossref, text)
    text = re.sub(
        r"\]\(([^)\s]+\.qmd(?:#[^)\s]+)?)\)",
        lambda match: "](" + urljoin(canonical_url, match.group(1).replace(".qmd", ".html")) + ")",
        text,
    )
    return text


def _collapsed_metadata(title: str) -> dict[str, Any]:
    return {
        "jupyter": {"source_hidden": True},
        "collapsed": True,
        "cellView": "form",
        "colab": {"name": title},
    }


def _orientation(document: ParsedDocument, canonical_url: str, source_url: str) -> str:
    return (
        f"# {document.title}\n\n"
        f"[Read the canonical chapter]({canonical_url}) · [Pinned source snapshot]({source_url})\n\n"
        "**Read → predict → run → audit**\n\n"
        "Run the notebook **top to bottom on a CPU**. The first setup cell installs "
        "the pinned packages and checks any downloaded data; its first run can take "
        "time and needs an internet connection. A fresh Python 3.12 environment or "
        "Colab runtime is recommended. No GPU is required.\n\n"
        "For a short visit, stop at the first complete witness: record your prediction "
        "before running it, then inspect its checks and any figure. Complete training studies and "
        "multi-seed sweeps take longer; continue in order when you want their full "
        "evidence. Do not skip earlier setup when resuming a later section.\n\n"
        "The Plan and mechanism code match the book. **Render this figure** cells "
        "regenerate its plots from your current results; their drawing source starts "
        "collapsed where the notebook viewer supports it, but still runs with Run all. "
        "Expand it to inspect or modify the display. Section and figure links return "
        "to the explanation and the published result. Change one choice at a time, "
        "then compare the outcome with your prediction and the stated control."
    )


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
    document: ParsedDocument | None = None,
    converted: Any | None = None,
) -> Any:
    """Build one unexecuted notebook from an already-resolved revision."""

    document = document or parse_document(unit.source)
    if converted is None:
        _quarto_conversion(document)
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
            "canonical_url": HTML_ROOT + Path(unit.source).with_suffix(".html").as_posix(),
            "hidden_native_cells": document.hidden_cells,
            "figure_ids": [cell.figure_id for cell in document.native_cells if cell.figure_id],
        },
    }

    bootstrap_source = _bootstrap_source(
        document=document,
        unit=unit,
        revision=revision,
        assets=assets,
        support="",
        repository=repository,
    )
    if not _compiles(bootstrap_source):
        raise SyntaxError(f"Notebook bootstrap does not compile: {unit.source}")
    bootstrap = nbformat.v4.new_code_cell(
        bootstrap_source,
        metadata={
            **_collapsed_metadata("Environment setup"),
            "tags": ["dlbook-bootstrap", "dlbook-support"],
            "dlbook": {
                "executable": True,
                "learner_visible": False,
                "support": support_metadata,
            },
        },
    )
    bootstrap["id"] = "bootstrap"
    canonical_url = metadata["dlbook"]["canonical_url"]
    intro = nbformat.v4.new_markdown_cell(
        _orientation(document, canonical_url, source_url),
        metadata={"tags": ["dlbook-orientation"]},
        id="orientation",
    )
    cells = [intro, bootstrap]
    native_by_ordinal = {cell.ordinal: cell for cell in document.native_cells}
    events: list[tuple[int, str, Any]] = [
        (surface.source_line, "surface", surface) for surface in document.surfaces
    ]
    events += [(cell.source_line, "hidden", cell) for cell in document.native_cells if cell.hidden]
    events += [
        (context.source_line, "prediction", context)
        for context in document.contexts if context.kind == "prediction"
    ]
    sections = [context for context in document.contexts if context.kind == "section"]
    last_section: NotebookContext | None = None
    for source_line, kind, item in sorted(events, key=lambda event: event[0]):
        section = next((context for context in reversed(sections) if context.source_line < source_line), None)
        if section is not None and section != last_section:
            heading = nbformat.v4.new_markdown_cell(
                f"{'#' * section.level} {notebook_markdown(section.text, canonical_url)}\n\n"
                f"[Return to the explanation]({canonical_url}#{section.anchor})",
                metadata={"tags": ["dlbook-section"], "dlbook": {"anchor": section.anchor, "source_line": section.source_line}},
                id=f"section-{section.source_line:04d}",
            )
            cells.append(heading)
            last_section = section
        if kind == "prediction":
            cells.append(nbformat.v4.new_markdown_cell(
                notebook_markdown(item.text, canonical_url),
                metadata={"tags": ["dlbook-prediction"], "dlbook": {"source_line": source_line, "anchor": item.anchor}},
                id=f"prediction-{source_line:04d}",
            ))
            continue
        if kind == "hidden":
            native = item
            title = "Render this figure" if native.figure_id else "Experiment setup"
            description = (
                f"**{title}** · [Published figure and caption]({canonical_url}#{native.figure_id})\n\n"
                "Run this cell to display the current results. Expand its source to inspect the drawing."
                if native.figure_id else
                "**Experiment setup**\n\nThis source-authored support cell runs once here, before its dependent examples."
            )
            cells.append(nbformat.v4.new_markdown_cell(
                description,
                metadata={"tags": ["dlbook-harness-label"], "dlbook": {"native_ordinal": native.ordinal}},
                id=f"harness-label-{native.ordinal:03d}",
            ))
            cells.append(nbformat.v4.new_code_cell(
                learner_code(native.body),
                metadata={
                    **_collapsed_metadata(title),
                    "tags": ["dlbook-harness", "hide-input"],
                    "dlbook": {
                        "native_ordinal": native.ordinal,
                        "source_line": native.source_line,
                        "label": native.label,
                        "figure_id": native.figure_id,
                        "learner_visible": False,
                    },
                },
                id=f"harness-{native.ordinal:03d}",
            ))
            continue
        surface = item
        surface_meta = _surface_metadata(surface)
        if surface.native_ordinal is not None:
            surface_meta["figure_id"] = native_by_ordinal[surface.native_ordinal].figure_id
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


def _build_reference_notebook(
    unit: NotebookUnit,
    revision: str,
    *,
    repository: str = REPOSITORY,
    document: ParsedDocument | None = None,
    converted: Any | None = None,
) -> Any:
    """Build the deterministic, non-public full Quarto execution reference."""

    document = document or parse_document(unit.source)
    if converted is None:
        converted = _quarto_conversion(document)
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
            "kind": "canonical-quarto-reference",
            "source": unit.source,
            "slug": unit.slug,
            "revision": revision,
            "source_url": source_url,
            "requirements": list(PINNED_REQUIREMENTS),
            "assets": list(assets),
            "native_cells": len(document.native_cells),
            "learner_visible_native_cells": sum(
                not cell.hidden for cell in document.native_cells
            ),
            "learner_visible_surfaces": len(document.surfaces),
        },
    }
    bootstrap_source = _bootstrap_source(
        document=document,
        unit=unit,
        revision=revision,
        assets=assets,
        support="",
        repository=repository,
        reference=True,
    )
    if not _compiles(bootstrap_source):
        raise SyntaxError(f"Reference bootstrap does not compile: {unit.source}")
    bootstrap = nbformat.v4.new_code_cell(
        bootstrap_source,
        metadata={
            "tags": ["dlbook-reference-bootstrap"],
            "dlbook": {"learner_visible": False, "reference": True},
        },
    )
    bootstrap["id"] = "reference-bootstrap"
    bootstrap.execution_count = None
    bootstrap.outputs = []

    cells = [bootstrap]
    surface_by_native = {
        surface.native_ordinal: surface.ordinal
        for surface in document.surfaces
        if surface.native_ordinal is not None
    }
    native_index = 0
    for converted_index, raw_cell in enumerate(converted.cells, start=1):
        cell = nbformat.from_dict(json.loads(json.dumps(raw_cell)))
        cell["id"] = f"reference-{converted_index:04d}"
        raw_metadata = dict(cell.get("metadata", {}))
        if cell.cell_type == "code":
            native = document.native_cells[native_index]
            native_index += 1
            visibility_tag = (
                "dlbook-reference-hidden"
                if native.hidden
                else "dlbook-reference-visible"
            )
            raw_metadata["tags"] = ["dlbook-reference", visibility_tag]
            raw_metadata["dlbook"] = {
                "native_ordinal": native.ordinal,
                "surface_ordinal": surface_by_native.get(native.ordinal),
                "source_line": native.source_line,
                "label": native.label,
                "learner_visible": not native.hidden,
                "figure_id": native.figure_id,
            }
            cell.execution_count = None
            cell.outputs = []
        else:
            raw_metadata["tags"] = ["dlbook-reference-narrative"]
            raw_metadata["dlbook"] = {"learner_visible": False, "reference": True}
        cell["metadata"] = raw_metadata
        cells.append(cell)

    if native_index != len(document.native_cells):
        raise ValueError(
            f"Reference retained {native_index} native cells for {unit.source}; "
            f"expected {len(document.native_cells)}"
        )
    notebook = nbformat.v4.new_notebook(cells=cells, metadata=metadata)
    notebook["nbformat_minor"] = 5
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


def build_reference_notebook(
    unit: NotebookUnit,
    revision: str,
    *,
    repository: str = REPOSITORY,
) -> Any:
    """Build one unexecuted full reference notebook from a manifest unit."""

    return _build_reference_notebook(
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
    reference_output_dir: str | Path | None = None,
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
    reference_destination = (
        Path(reference_output_dir) if reference_output_dir is not None else None
    )
    if reference_destination is not None:
        reference_destination.mkdir(parents=True, exist_ok=True)
    written = []
    for slug in selected_slugs:
        unit = UNITS_BY_SLUG[slug]
        document = parse_document(unit.source)
        converted = _quarto_conversion(document)
        notebook = _build_notebook(
            unit,
            resolved,
            repository=repository,
            document=document,
            converted=converted,
        )
        path = destination / f"{unit.slug}.ipynb"
        temporary = path.with_suffix(".ipynb.tmp")
        nbformat.write(notebook, temporary)
        temporary.replace(path)
        written.append(path)
        print(
            f"exported {unit.slug}: "
            f"{notebook.metadata['dlbook']['learner_visible_surfaces']} surfaces"
        )
        if reference_destination is not None:
            reference = _build_reference_notebook(
                unit,
                resolved,
                repository=repository,
                document=document,
                converted=converted,
            )
            reference_path = reference_destination / f"{unit.slug}.ipynb"
            reference_temporary = reference_path.with_suffix(".ipynb.tmp")
            nbformat.write(reference, reference_temporary)
            reference_temporary.replace(reference_path)
            print(
                f"exported {unit.slug} reference: "
                f"{reference.metadata['dlbook']['native_cells']} native cells"
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
        "--reference-output-dir",
        help=(
            "Optional directory for full Quarto-converted internal execution "
            "references"
        ),
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
        reference_output_dir=args.reference_output_dir,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
