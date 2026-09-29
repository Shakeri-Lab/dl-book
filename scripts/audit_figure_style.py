#!/usr/bin/env python3
"""Audit the book's figure style (press W2 phase 2, plan section J1; rulings D1 to D7, D11).

  audit_figure_style.py [--report | --strict] [--page QMD] [--fail-on CHECKS] [--json PATH]
  audit_figure_style.py --check-lock QMD

Style file (code/dlbook/book.mplstyle), always enforced:
  - its keys are exactly the audited set, none twice, and no forbidden key (figure.figsize,
    figure.dpi, savefig.dpi/format/bbox, backend, figure.constrained_layout.use,
    figure.autolayout, text.usetex, axes.spines.*);
  - it loads under warnings-as-errors with a WARNING handler on the matplotlib and
    fontTools loggers, and records nothing;
  - every font family resolves inside matplotlib's own mpl-data/fonts with
    findfont(..., fallback_to_default=False), in the normal and bold weights only;
  - the categorical cycle is colour only, in the D2 inks; label text is 1A1A1A or 4D4D4D;
    titles and labels (axes and figure) are 9 pt, ticks and legends 8 pt; SVG text is
    paths, PDF fonts are Type 42, and the SVG hash salt is set.

Pages (fatal under --strict, reported otherwise). A page "has figures" when its HTML
freeze names an executed figure; pages in docs/locks.md or audits/press/w2p2/deferred.txt
(a row names a page by its path or by a suffix of it) are reported as deferred.
  loader    the exact line of ruling D6 for the page's depth, once, unindented, in an
            evaluated Python cell (never `eval: false`), after the page's first
            `import matplotlib.pyplot as plt`, outside the notebook support delimiters,
            and at or before the page's first figure-drawing call. Two placements follow
            the rulings instead: chapters/part1/05-backpropagation.qmd puts it in a visible
            cell (figures drawn before it are listed), and
            chapters/part4/15-bert-pretraining.qmd in the hidden figure cell
            fig-visibility-corruption.
  rc        on a page with the loader, no Python cell changes rcParams after or around it:
            no `rcParams[...] =`, `rcParams.update`, `rc(...)`, `rc_context`, `rcdefaults`,
            `rc_file` or `style.context`.
  asset     a notebook unit ships code/dlbook/book.mplstyle (scripts/notebook_manifest.json)
            if and only if its source holds the loader.
  data      each figure of audits/press/w2p2/data_figures.txt (ruling D1, D2): an explicit
            figsize 4.6 or 3.07 in wide and at most 7.8 in tall; no fontsize literal under
            8 pt (named sizes small and below included), none from 8 to 10 (the text
            inherits the style) and none above 11 (x-large and larger included); in text
            calls `size=` counts as a fontsize, and set_fontsize/set_size are read too;
            strokes (lw, linewidth, linewidths, elinewidth, set_linewidth) of 0, 0.6, 1.0 or
            1.6 pt; no dpi= override or set_dpi (image content is embedded at fig-dpi 300);
            hexes only in the D2 inks and greys, the teal and magenta pair, or a role
            colour of tex/macros.tex; no chromatic named colour (in a colour keyword or in
            any list, tuple, set or dict), RGB tuple or format letter; font weights normal
            or bold. The feeders column names colour variables bound outside the figure
            cell: each is traced to the last cell before the figure that binds it at top
            level, and its binding gets the colour checks. A feeder listed in
            audits/press/w2p2/feeder_exemptions.txt (a shared hidden palette that phase 3
            redraws with its diagrams) is not audited itself; instead each use of it in
            the figure cell is checked against the value it binds.
  dash      no U+2014 in any figure cell.
  refs      every labelled figure is referenced (@fig-, @epfig-, @pfig-, or an interlude
            alias) somewhere in the running text: outside captions, code, comments,
            headings, Plan steps, and the Exercises and Sources sections (ruling D7).
Lines that a mechanism replay pins (fixture literals in interactives/manifest.json) are
exempt from the data, rc and dash checks and listed as pinned (ruling D11).

--report (the default) prints every finding and exits 0 when the style file holds;
--strict also exits 1 on any page finding. --fail-on CHECKS (comma-separated, e.g.
asset,loader,rc) exits 1 on any finding of those checks, and prints them under --quiet;
scripts/render_chapter.sh runs it that way for the page it rendered. --page limits the
page checks to one page (any path to it: relative to the repository or the working
directory, or absolute). --check-lock QMD exits 1 when docs/locks.md lists the page
(scripts/render_chapter.sh runs it before every render).
"""

from __future__ import annotations

import argparse
import ast
import json
import logging
import posixpath
import re
import sys
import warnings
from dataclasses import dataclass, field
from pathlib import Path

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
STYLE = ROOT / "code/dlbook/book.mplstyle"
STYLE_ASSET = "code/dlbook/book.mplstyle"
LOCKS = ROOT / "docs/locks.md"
DEFERRED = ROOT / "audits/press/w2p2/deferred.txt"
DATA_FIGURES = ROOT / "audits/press/w2p2/data_figures.txt"
FEEDER_EXEMPTIONS = ROOT / "audits/press/w2p2/feeder_exemptions.txt"
FIXTURES = ROOT / "interactives/manifest.json"
MACROS = ROOT / "tex/macros.tex"
LOADER_TEMPLATE = 'plt.style.use("{prefix}code/dlbook/book.mplstyle")  # the book\'s figure style'
PYPLOT_IMPORT = "import matplotlib.pyplot as plt"
CHECKS = ("loader", "rc", "asset", "data", "dash", "refs")

STYLE_KEYS = {
    "font.family", "font.sans-serif", "mathtext.fontset", "font.size", "axes.titlesize",
    "axes.labelsize", "figure.titlesize", "figure.labelsize", "xtick.labelsize",
    "ytick.labelsize", "legend.fontsize", "legend.title_fontsize", "text.color",
    "axes.labelcolor", "xtick.labelcolor", "ytick.labelcolor", "lines.linewidth",
    "lines.markersize", "axes.linewidth", "xtick.major.width", "ytick.major.width",
    "xtick.major.size", "ytick.major.size", "grid.linewidth", "grid.color", "legend.frameon",
    "legend.handlelength", "axes.prop_cycle", "savefig.pad_inches", "svg.fonttype",
    "svg.hashsalt", "pdf.fonttype",
}
TEXT_SIZES = {                                   # ruling D3, in pt
    "axes.titlesize": 9.0, "axes.labelsize": 9.0, "figure.titlesize": 9.0,
    "figure.labelsize": 9.0, "xtick.labelsize": 8.0, "ytick.labelsize": 8.0,
    "legend.fontsize": 8.0, "legend.title_fontsize": 8.0,
}
FORBIDDEN_KEYS = {
    "figure.figsize", "figure.dpi", "savefig.dpi", "savefig.format", "savefig.bbox",
    "backend", "figure.constrained_layout.use", "figure.autolayout", "text.usetex",
}
FORBIDDEN_PREFIXES = ("axes.spines.",)
INKS = {"1A1A1A", "4D4D4D", "7A7A7A", "949494"}
LABEL_TEXT = {"1A1A1A", "4D4D4D"}
PAIR = {"0EA1A1", "9A0669"}                      # ruling D2: teal and magenta
WEIGHTS = {"normal", "bold"}
STROKES = {0.0, 0.6, 1.0, 1.6}                   # ruling D1
WIDTHS = (4.6, 3.07)                             # ruling D1, in inches
MAX_HEIGHT = 7.8
MAX_FONTSIZE = 11.0                              # above this a literal is reported
SMALL_NAMED_SIZES = {"xx-small", "x-small", "small", "smaller"}   # under 8 pt at 9 pt
LARGE_NAMED_SIZES = {"x-large", "xx-large", "xxx-large"}         # above 11 pt at 9 pt
FONTSIZE_KEYS = {"fontsize", "labelsize", "title_fontsize", "titlesize"}
# Calls whose `size=` keyword is a font size (Text's alias); elsewhere `size` is a shape.
TEXT_CALLS = {"text", "annotate", "xlabel", "ylabel", "set_xlabel", "set_ylabel", "title",
              "set_title", "suptitle", "supxlabel", "supylabel", "figtext", "clabel",
              "bar_label", "FontProperties", "set_label_text"}
STROKE_KEYS = {"lw", "linewidth", "linewidths", "elinewidth"}
STROKE_SETTERS = {"set_linewidth", "set_linewidths", "set_lw"}
FONTSIZE_SETTERS = {"set_fontsize", "set_size"}
COLOUR_KEYS = {"color", "c", "colors", "facecolor", "edgecolor", "fc", "ec", "mfc", "mec",
               "markerfacecolor", "markeredgecolor", "ecolor", "labelcolor"}
PLOT_CALLS = {"plot", "semilogx", "semilogy", "loglog", "errorbar", "step"}
RC_OWNERS = {"plt", "mpl", "matplotlib", "pyplot"}
RC_CALLS = {"rc", "rc_context", "rcdefaults", "rc_file", "rc_file_defaults"}
FMT_RE = re.compile(r"^[-.:,ov^<>1-4sp*hH+xXDd|_]*[bgrcmykw]?[-.:,ov^<>1-4sp*hH+xXDd|_]*$")
HEX_RE = re.compile(r"^#([0-9A-Fa-f]{6})([0-9A-Fa-f]{2})?$|^#([0-9A-Fa-f]{3})$")
CYCLE_REF_RE = re.compile(r"^C\d+$")            # a cycle colour: an ink under the style
DRAW_RE = re.compile(r"\bplt\.(subplots|figure|subplot|subplot_mosaic|plot|imshow|scatter|bar|"
                     r"hist|show|matshow|axes)\(|\.add_subplot\(|\.subplots\(")
FENCE_RE = re.compile(r"^```\{python\}[ \t]*\n(.*?)^```[ \t]*$", re.S | re.M)
ANY_FENCE_RE = re.compile(r"^(`{3,})[^\n]*\n.*?^\1[ \t]*$", re.S | re.M)
DIV_OPEN_RE = re.compile(r"^(:{3,})\s*\{#((?:ep|p|ex|ae|ttr)?fig-[\w-]+)[^}]*\}\s*$", re.M)
PLAN_OPEN_RE = re.compile(r"^(:{3,})\s*\{[^}]*\.plan\}\s*$")
HEADING_RE = re.compile(r"^(#{1,6})\s")
APPARATUS_HEADING_RE = re.compile(r"^(#{1,6})\s+(?:Exercises|Sources)\b")
IMAGE_FIG_RE = re.compile(r"!\[(?:[^\]\\]|\\.)*\]\([^)]*\)\{#((?:ep|p)?fig-[\w-]+)[^}]*\}", re.S)
ALIAS_RE = re.compile(r'<span id="((?:ex|ae|ttr)fig-[\w-]+)" class="anchor-alias"></span>')
COMMENT_RE = re.compile(r"<!--.*?-->", re.S)
OPTION_RE = re.compile(r"^#\|\s*([\w-]+):\s*(.*?)\s*$")


def loader_line(page: str) -> str:
    return LOADER_TEMPLATE.format(prefix="../" * (len(Path(page).parts) - 1))


def normalize_page(arg: str) -> str:
    """A page path from the repository root, for any spelling of it (./x, absolute, cwd)."""
    path = Path(arg)
    candidates = [path] if path.is_absolute() else [Path.cwd() / path, ROOT / path]
    for candidate in candidates:
        candidate = candidate.resolve()
        if candidate.is_file() and candidate.is_relative_to(ROOT):
            return candidate.relative_to(ROOT).as_posix()
    return posixpath.normpath(path.as_posix())


def listed(page: str, rows) -> str | None:
    """The row that names a page, by its whole path or by a trailing part of it."""
    return next((row for row in rows if page == row or page.endswith("/" + row.lstrip("./"))), None)


# ----------------------------------------------------------------------------- inputs
def table_pages(path: Path) -> set[str]:
    """Pages named by backticked paths in a Markdown table (docs/locks.md)."""
    if not path.is_file():
        return set()
    return {m for line in path.read_text(encoding="utf-8").splitlines() if line.startswith("|")
            for m in re.findall(r"`((?:chapters/)?[\w./-]+\.qmd)`", line)}


def list_pages(path: Path) -> dict[str, str]:
    """{page: reason} from a tab-separated list with # comments."""
    out: dict[str, str] = {}
    if path.is_file():
        for line in path.read_text(encoding="utf-8").splitlines():
            if line.strip() and not line.startswith("#"):
                page, _, reason = line.partition("\t")
                out[page.strip()] = reason.strip()
    return out


@dataclass
class DataFigure:
    page: str
    label: str
    printed: str
    feeders: list[str]


def data_figures() -> list[DataFigure]:
    rows = []
    for line in DATA_FIGURES.read_text(encoding="utf-8").splitlines():
        if line.strip() and not line.startswith("#"):
            page, label, printed, *rest = line.split("\t")
            feeders = rest[1].strip() if len(rest) > 1 else "-"
            names = [] if feeders in ("", "-") else [n.strip() for n in feeders.split(",") if n.strip()]
            rows.append(DataFigure(page, label, printed, names))
    return rows


def feeder_exemptions() -> dict[tuple[str, str], str]:
    """{(page, name): reason} from audits/press/w2p2/feeder_exemptions.txt."""
    out: dict[tuple[str, str], str] = {}
    if FEEDER_EXEMPTIONS.is_file():
        for line in FEEDER_EXEMPTIONS.read_text(encoding="utf-8").splitlines():
            if line.strip() and not line.startswith("#"):
                page, names, reason = (line.split("\t") + ["", ""])[:3]
                for name in names.split(","):
                    if name.strip():
                        out[(page.strip(), name.strip())] = reason.strip()
    return out


def pages_with_figures() -> list[str]:
    pages = []
    for html in sorted((ROOT / "_freeze").glob("**/execute-results/html.json")):
        markdown = json.loads(html.read_text(encoding="utf-8"))["result"]["markdown"]
        if "_files/figure-html/" in markdown:
            unit = html.parent.parent.relative_to(ROOT / "_freeze")
            pages.append(unit.with_suffix(".qmd").as_posix())
    return pages


def role_hexes() -> set[str]:
    text = MACROS.read_text(encoding="utf-8")
    return {h.upper() for h in re.findall(r"\\definecolor\{dl\w+\}\{HTML\}\{([0-9A-Fa-f]{6})\}", text)}


def pinned_lines(page: str, text: str) -> set[int]:
    """1-based lines of `page` covered by a mechanism replay's fixture literal (D11)."""
    lines: set[int] = set()
    if not FIXTURES.is_file():
        return lines
    for scene in json.loads(FIXTURES.read_text(encoding="utf-8")).get("scenes", []):
        if scene.get("qmd") != page:
            continue
        for literal in scene.get("fixture", {}).get("literals", []):
            start = text.find(literal)
            while start >= 0:
                first = text.count("\n", 0, start) + 1
                lines.update(range(first, first + literal.count("\n") + 1))
                start = text.find(literal, start + 1)
    return lines


@dataclass
class Cell:
    index: int                 # 0-based among the page's Python cells
    start: int                 # 1-based page line of the first body line
    lines: list[str]
    options: dict[str, str]
    figure: str | None         # its label (fig-*) or the float div it sits in
    hidden: bool
    evaluated: bool = True     # False under `#| eval: false`

    @property
    def code(self) -> str:
        return "\n".join(line for line in self.lines if not line.startswith("#|"))

    @property
    def name(self) -> str:
        return self.options.get("label") or self.figure or f"cell {self.index + 1} (line {self.start})"

    def page_line(self, body_line: int) -> int:
        return self.start + body_line - 1

    def tree(self) -> tuple[ast.Module | None, int]:
        """The cell's code parsed after its leading `#|` options, and that offset."""
        offset = 0
        while offset < len(self.lines) and self.lines[offset].startswith("#|"):
            offset += 1
        try:
            return ast.parse("\n".join(self.lines[offset:])), offset
        except SyntaxError:
            return None, offset


def parse_cells(text: str) -> list[Cell]:
    cells = []
    for m in FENCE_RE.finditer(text):
        body = m.group(1).rstrip("\n")
        lines = body.split("\n")
        opts = {}
        for line in lines:
            o = OPTION_RE.match(line)
            if o:
                opts[o.group(1)] = o.group(2).strip().strip('"').strip("'")
        figure = opts.get("label") if (opts.get("label") or "").startswith(("fig-", "epfig-")) else None
        if figure is None:
            before = text[:m.start()].rstrip()
            opener = list(DIV_OPEN_RE.finditer(before))
            if opener and not before[opener[-1].end():].strip():
                figure = opener[-1].group(2)
        cells.append(Cell(len(cells), text.count("\n", 0, m.start(1)) + 1, lines, opts, figure,
                          opts.get("echo", "true").lower() == "false",
                          opts.get("eval", "true").lower() != "false"))
    return cells


def draws(cell: Cell) -> int | None:
    """0-based body line of the cell's first figure-drawing call, if any."""
    for i, line in enumerate(cell.lines):
        if not line.lstrip().startswith("#") and DRAW_RE.search(line):
            return i
    return None


def loader_hits(page: str, cells: list[Cell]) -> list[tuple[Cell, int]]:
    """(cell, 0-based body line) of each exact, unindented loader in an evaluated cell."""
    line = loader_line(page)
    return [(c, i) for c in cells if c.evaluated for i, ln in enumerate(c.lines) if ln == line]


def top_level_bindings(tree: ast.Module, name: str) -> list[ast.stmt]:
    """Top-level statements of a module that bind `name`."""
    found = []
    for stmt in tree.body:
        targets: list[ast.AST] = []
        if isinstance(stmt, ast.Assign):
            targets = list(stmt.targets)
        elif isinstance(stmt, (ast.AugAssign, ast.AnnAssign)):
            targets = [stmt.target]
        elif isinstance(stmt, (ast.For, ast.AsyncFor)):
            targets = [stmt.target]
        elif isinstance(stmt, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            if stmt.name == name:
                found.append(stmt)
            continue
        elif isinstance(stmt, (ast.Import, ast.ImportFrom)):
            if any((alias.asname or alias.name.split(".")[0]) == name for alias in stmt.names):
                found.append(stmt)
            continue
        if any(isinstance(n, ast.Name) and n.id == name for t in targets for n in ast.walk(t)):
            found.append(stmt)
    return found


def resolve_feeder(cells: list[Cell], name: str, before: int) -> tuple[Cell, list[ast.stmt], int] | None:
    """The last evaluated cell before cell index `before` that binds `name` at top level:
    (cell, binding statements, line offset of its parsed code)."""
    for cell in reversed(cells[:before]):
        if not cell.evaluated:
            continue
        tree, offset = cell.tree()
        if tree is None:
            continue
        stmts = top_level_bindings(tree, name)
        if stmts:
            return cell, stmts, offset
    return None


def bound_strings(stmts: list[ast.stmt], name: str) -> list[str]:
    """String values a simple binding gives `name` (`a = "x"`, `a, b = "x", "y"`)."""
    values = []
    for stmt in stmts:
        if not isinstance(stmt, ast.Assign):
            continue
        for target in stmt.targets:
            if isinstance(target, ast.Name) and target.id == name:
                if isinstance(stmt.value, ast.Constant) and isinstance(stmt.value.value, str):
                    values.append(stmt.value.value)
            elif isinstance(target, (ast.Tuple, ast.List)) and isinstance(stmt.value, (ast.Tuple, ast.List)):
                for t, v in zip(target.elts, stmt.value.elts):
                    if isinstance(t, ast.Name) and t.id == name and isinstance(v, ast.Constant) \
                            and isinstance(v.value, str):
                        values.append(v.value)
    return values


# ----------------------------------------------------------------------------- style file
class _Collect(logging.Handler):
    def __init__(self) -> None:
        super().__init__(logging.WARNING)
        self.records: list[str] = []

    def emit(self, record: logging.LogRecord) -> None:
        self.records.append(f"{record.name}: {record.getMessage()}")


def style_errors(path: Path = STYLE) -> list[str]:
    errors: list[str] = []
    if not path.is_file():
        return [f"{path.relative_to(ROOT)}: the style file is missing"]
    rel = path.relative_to(ROOT)
    keys: list[tuple[str, str]] = []
    for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        stripped = line.split("#", 1)[0].strip() if not line.lstrip().startswith("#") else ""
        if not stripped:
            continue
        key, sep, value = stripped.partition(":")
        if not sep:
            errors.append(f"{rel}:{number}: not a key: value line")
            continue
        keys.append((key.strip(), value.strip()))
    names = [k for k, _ in keys]
    values = dict(keys)
    for key in sorted({k for k in names if names.count(k) > 1}):
        errors.append(f"{rel}: key {key} set more than once")
    for key in sorted(set(names)):
        if key in FORBIDDEN_KEYS or key.startswith(FORBIDDEN_PREFIXES):
            errors.append(f"{rel}: forbidden key {key}")
        elif key not in STYLE_KEYS:
            errors.append(f"{rel}: key {key} is outside the audited set (add it here with its reason)")
    for key in sorted(STYLE_KEYS - set(names)):
        errors.append(f"{rel}: audited key {key} is missing")

    import matplotlib
    from matplotlib import font_manager
    from matplotlib import style as mstyle

    handler = _Collect()
    loggers = [logging.getLogger(n) for n in ("matplotlib", "fontTools")]
    for logger in loggers:
        logger.addHandler(handler)
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error")
            with matplotlib.rc_context():
                mstyle.use(str(path))
                rc = dict(matplotlib.rcParams)
                mpl_fonts = (Path(matplotlib.get_data_path()) / "fonts").resolve()
                families = rc["font.family"]
                resolved = []
                for family in families:
                    candidates = rc.get(f"font.{family}", [family]) if family in (
                        "sans-serif", "serif", "monospace", "cursive", "fantasy") else [family]
                    for weight in sorted(WEIGHTS):
                        found = font_manager.findfont(
                            font_manager.FontProperties(family=candidates[0], weight=weight),
                            fallback_to_default=False)
                        resolved.append(found)
                        if not Path(found).resolve().is_relative_to(mpl_fonts):
                            errors.append(f"{rel}: font {candidates[0]} ({weight}) resolves outside "
                                          f"matplotlib's bundled fonts: {found}")
                sizes = {key: font_manager.FontProperties(size=rc[key]).get_size_in_points()
                         for key in TEXT_SIZES}
    except Exception as exc:  # noqa: BLE001
        errors.append(f"{rel}: does not load cleanly under warnings-as-errors: {type(exc).__name__}: {exc}")
        rc = {}
    finally:
        for logger in loggers:
            logger.removeHandler(handler)
    if handler.records:
        errors.append(f"{rel}: loading logged {handler.records}")
    if rc:
        if rc.get("mathtext.fontset") not in ("dejavusans", "dejavuserif", "cm", "stix", "stixsans"):
            errors.append(f"{rel}: mathtext.fontset {rc.get('mathtext.fontset')} is not bundled")
        for key in ("font.weight", "axes.titleweight", "axes.labelweight", "figure.titleweight",
                    "figure.labelweight"):
            if str(rc.get(key)) not in WEIGHTS:
                errors.append(f"{rel}: {key} {rc.get(key)} (weights: normal and bold only)")
        cycle = rc["axes.prop_cycle"]
        if set(cycle.keys) != {"color"}:
            errors.append(f"{rel}: axes.prop_cycle cycles {sorted(cycle.keys)}; colour only")
        else:
            hexes = {str(c["color"]).lstrip("#").upper() for c in cycle}
            if not hexes <= INKS:
                errors.append(f"{rel}: axes.prop_cycle holds {sorted(hexes - INKS)}, outside the D2 inks")
        for key in ("text.color", "axes.labelcolor", "xtick.labelcolor", "ytick.labelcolor"):
            if str(rc.get(key)).lstrip("#").upper() not in LABEL_TEXT:
                errors.append(f"{rel}: {key} {rc.get(key)} (label text: 1A1A1A or 4D4D4D)")
        for key, want in TEXT_SIZES.items():
            if abs(sizes[key] - want) > 1e-6:
                errors.append(f"{rel}: {key} is {sizes[key]:g} pt (ruling D3: {want:g} pt)")
        if rc.get("svg.fonttype") != "path":
            errors.append(f"{rel}: svg.fonttype must be path")
        if rc.get("pdf.fonttype") != 42:
            errors.append(f"{rel}: pdf.fonttype must be 42")
        if not rc.get("svg.hashsalt"):
            errors.append(f"{rel}: svg.hashsalt must be set (stable SVG ids)")
        if values.get("font.size") and float(rc["font.size"]) != 9.0:
            errors.append(f"{rel}: font.size {rc['font.size']} (ruling D3: 9 pt)")
    return errors


# ----------------------------------------------------------------------------- page checks
@dataclass
class Finding:
    check: str
    page: str
    line: int | None
    message: str
    strict: bool = True

    def text(self) -> str:
        where = f"{self.page}:{self.line}" if self.line else self.page
        return f"[{self.check}] {where}: {self.message}"


@dataclass
class Report:
    findings: list[Finding] = field(default_factory=list)
    pinned: list[Finding] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)
    counts: dict[str, int] = field(default_factory=dict)
    exempt: dict[tuple[str, str], dict[str, set[str]]] = field(default_factory=dict)

    def add(self, *args, **kwargs) -> None:
        self.findings.append(Finding(*args, **kwargs))

    def place(self, finding: Finding, pinned: set[int]) -> None:
        (self.pinned if finding.line in pinned else self.findings).append(finding)


def loader_checks(page: str, text: str, cells: list[Cell], report: Report) -> bool:
    line = loader_line(page)
    hits = loader_hits(page, cells)
    hit_keys = {(c.index, i) for c, i in hits}
    in_cells = 0
    for c in cells:
        for i, ln in enumerate(c.lines):
            in_cells += ln.count(line)
            if (c.index, i) in hit_keys or ln.lstrip().startswith("#"):
                continue
            if ln.strip() == line:
                why = ("sits in an `eval: false` cell" if not c.evaluated else
                       "is indented; it must stand unindented at the top level of its cell")
                report.add("loader", page, c.page_line(i + 1), f"the loader {why}")
            elif "style.use(" in ln:
                report.add("loader", page, c.page_line(i + 1),
                           f"a style.use line that is not the loader: {ln.strip()}")
    outside = text.count(line) - in_cells
    if outside > 0:
        report.add("loader", page, None, f"the loader text appears {outside} time(s) outside Python cells")
    if len(hits) != 1:
        report.add("loader", page, None, f"expected the loader once, found {len(hits)}: {line}")
        return bool(hits)
    cell, at = hits[0]
    where = cell.page_line(at + 1)
    imports = [(c.index, i) for c in cells for i, ln in enumerate(c.lines) if ln.strip() == PYPLOT_IMPORT]
    if not imports or imports[0] > (cell.index, at):
        report.add("loader", page, where, f"the loader precedes the page's first `{PYPLOT_IMPORT}`")
    open_marker = [i for i, ln in enumerate(cell.lines) if ln.strip().startswith("# notebook-support-start")]
    close_marker = [i for i, ln in enumerate(cell.lines) if ln.strip() == "# notebook-support-end"]
    if open_marker and close_marker and open_marker[0] < at < close_marker[0]:
        report.add("loader", page, where, "the loader sits inside the notebook support delimiters")
    first_draw = min(((c.index, d) for c in cells if (d := draws(c)) is not None), default=None)
    if page == "chapters/part1/05-backpropagation.qmd":
        if cell.hidden:
            report.add("loader", page, where, "ruling D6: this page's loader goes in a visible cell")
        before = [c.figure or f"cell {c.index + 1}" for c in cells
                  if (d := draws(c)) is not None and (c.index, d) < (cell.index, at)]
        if before:
            report.notes.append(f"{page}: drawn before the loader by ruling D6: {', '.join(before)}")
    elif page == "chapters/part4/15-bert-pretraining.qmd":
        if cell.options.get("label") != "fig-visibility-corruption":
            report.add("loader", page, where, "ruling D6: this page's loader goes in the hidden "
                                             "figure cell fig-visibility-corruption")
    elif first_draw is not None and first_draw < (cell.index, at):
        report.add("loader", page, where, "the loader comes after the page's first figure-drawing call "
                                         f"(cell {first_draw[0] + 1})")
    return True


def _is_rcparams(node: ast.AST) -> bool:
    return (isinstance(node, ast.Attribute) and node.attr == "rcParams") or (
        isinstance(node, ast.Name) and node.id == "rcParams")


def _dotted(node: ast.AST) -> str:
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        return f"{_dotted(node.value)}.{node.attr}"
    return "?"


def rc_checks(page: str, cells: list[Cell], pinned: set[int], report: Report) -> None:
    """On a page with the loader, any rcParams change can silently undo the style."""
    for cell in cells:
        if not cell.evaluated:
            continue
        tree, offset = cell.tree()
        if tree is None:
            continue
        hits: list[tuple[int, str]] = []
        for node in ast.walk(tree):
            if isinstance(node, (ast.Assign, ast.AugAssign, ast.AnnAssign)):
                targets = node.targets if isinstance(node, ast.Assign) else [node.target]
                for target in targets:
                    if isinstance(target, ast.Subscript) and _is_rcparams(target.value):
                        hits.append((node.lineno, f"{_dotted(target.value)}[...] assignment"))
            elif isinstance(node, ast.Call):
                func = node.func
                if isinstance(func, ast.Attribute):
                    if func.attr in ("update", "setdefault", "__setitem__") and _is_rcparams(func.value):
                        hits.append((node.lineno, f"{_dotted(func)}(...)"))
                    elif func.attr in RC_CALLS and _dotted(func.value).split(".")[0] in RC_OWNERS:
                        hits.append((node.lineno, f"{_dotted(func)}(...)"))
                    elif func.attr == "context" and isinstance(func.value, ast.Attribute) \
                            and func.value.attr == "style":
                        hits.append((node.lineno, f"{_dotted(func)}(...)"))
                elif isinstance(func, ast.Name) and func.id in RC_CALLS - {"rc"}:
                    hits.append((node.lineno, f"{func.id}(...)"))
        for lineno, what in sorted(set(hits)):
            finding = Finding("rc", page, cell.page_line(offset + lineno),
                              f"{what} changes rcParams on a page that loads the book style (ruling D6)")
            report.place(finding, pinned)


def number(node: ast.AST) -> float | None:
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)) and not isinstance(node.value, bool):
        return float(node.value)
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub):
        v = number(node.operand)
        return -v if v is not None else None
    return None


def chromatic(colour, allowed_hex: set[str]) -> bool:
    """A named, hex or RGB(A) colour that is neither achromatic nor in the allowed set.

    `C0`, `C1`, ... are cycle colours: under the style they are inks, so they pass.
    """
    from matplotlib.colors import to_hex, to_rgb

    if isinstance(colour, str) and CYCLE_REF_RE.match(colour):
        return False
    try:
        hexc = to_hex(to_rgb(colour)).lstrip("#").upper()
    except (ValueError, TypeError):
        return False
    r, g, b = (int(hexc[i:i + 2], 16) for i in (0, 2, 4))
    return not (max(r, g, b) - min(r, g, b) <= 3 or hexc in allowed_hex)


def colour_name(value: str) -> bool:
    """A string that names a colour unambiguously (a single format letter does not)."""
    from matplotlib.colors import CSS4_COLORS

    return value.startswith(("tab:", "xkcd:")) or value.lower() in CSS4_COLORS


def rgb_tuple(node: ast.AST) -> tuple[float, ...] | None:
    """(r, g, b) or (r, g, b, a) of numeric literals in [0, 1], or None."""
    if isinstance(node, (ast.Tuple, ast.List)) and len(node.elts) in (3, 4):
        values = [number(e) for e in node.elts]
        if all(v is not None and 0.0 <= v <= 1.0 for v in values):
            return tuple(values)  # type: ignore[arg-type]
    return None


def colour_findings(nodes: list[ast.AST], allowed_hex: set[str]) -> list[tuple[int, str]]:
    """Colour checks over some statements: hexes anywhere, named colours in colour keywords
    and in any list, tuple, set or dict, and RGB tuples given to a colour keyword."""
    found: list[tuple[int, str]] = []
    for root in nodes:
        for node in ast.walk(root):
            if isinstance(node, ast.Constant) and isinstance(node.value, str):
                m = HEX_RE.match(node.value)
                if m:
                    hexc = (m.group(1) or "".join(ch * 2 for ch in m.group(3))).upper()
                    r, g, b = (int(hexc[i:i + 2], 16) for i in (0, 2, 4))
                    if not (max(r, g, b) - min(r, g, b) <= 3 or hexc in allowed_hex):
                        found.append((node.lineno, f"hex {node.value} is outside the D2 inks, greys, "
                                                   "teal/magenta pair and role colours"))
            elif isinstance(node, (ast.List, ast.Tuple, ast.Set, ast.Dict)):
                elts = (list(node.keys) + list(node.values)) if isinstance(node, ast.Dict) else node.elts
                for elt in elts:
                    if isinstance(elt, ast.Constant) and isinstance(elt.value, str) \
                            and not HEX_RE.match(elt.value) and colour_name(elt.value) \
                            and chromatic(elt.value, allowed_hex):
                        found.append((elt.lineno, f"{elt.value!r} in a {type(node).__name__.lower()} "
                                                  "is a chromatic named colour"))
            elif isinstance(node, ast.keyword) and node.arg in COLOUR_KEYS:
                value = node.value
                if isinstance(value, ast.Constant) and isinstance(value.value, str):
                    if not HEX_RE.match(value.value) and chromatic(value.value, allowed_hex):
                        found.append((value.lineno, f"{node.arg}={value.value!r} is a chromatic named colour"))
                    continue
                tuples = [value] if rgb_tuple(value) else (
                    [e for e in value.elts if rgb_tuple(e)] if isinstance(value, (ast.List, ast.Tuple)) else [])
                for item in tuples:
                    rgb = rgb_tuple(item)
                    if chromatic(rgb, allowed_hex):
                        shown = ", ".join(f"{v:g}" for v in rgb)
                        found.append((item.lineno, f"{node.arg}=({shown}) is a chromatic RGB colour"))
    return found


def size_finding(what: str, v: float) -> str | None:
    if v < 8:
        return f"{what}: under 8 pt"
    if v <= 10:
        return f"{what}: a literal from 8 to 10 (inherit the style)"
    if v > MAX_FONTSIZE:
        return f"{what}: above {MAX_FONTSIZE:g} pt (titles and labels are 9 pt)"
    return None


def data_checks(fig: DataFigure, cell: Cell, allowed_hex: set[str], report: Report,
                pinned: set[int], exempt_values: dict[str, tuple[str, str]]) -> None:
    tag = f"{fig.label} (Figure {fig.printed})"
    tree, offset = cell.tree()
    if tree is None:
        report.add("data", fig.page, cell.start, f"{tag}: cell does not parse; not audited")
        return
    found: list[tuple[int, str]] = colour_findings([tree], allowed_hex)
    rebound = {n.id for n in ast.walk(tree) if isinstance(n, ast.Name) and not isinstance(n.ctx, ast.Load)}
    exempt_values = {k: v for k, v in exempt_values.items() if k not in rebound}
    figsizes = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Load) and node.id in exempt_values:
            value, where = exempt_values[node.id]
            if chromatic(value, allowed_hex):
                found.append((node.lineno, f"{node.id} is {value} from the shared palette in {where} "
                                           "(exempt there until phase 3); a data figure takes a D2 ink "
                                           "or the teal and magenta pair"))
        if not isinstance(node, ast.Call):
            continue
        func = node.func.attr if isinstance(node.func, ast.Attribute) else (
            node.func.id if isinstance(node.func, ast.Name) else "")
        if func == "set_size_inches" and len(node.args) >= 2:
            figsizes.append((node.lineno, number(node.args[0]), number(node.args[1])))
        if func in FONTSIZE_SETTERS and node.args:
            v = number(node.args[0])
            message = size_finding(f"{func}({v:g})", v) if v is not None else None
            if message:
                found.append((node.lineno, message))
        if func in STROKE_SETTERS and node.args:
            v = number(node.args[0])
            if v is not None and round(v, 3) not in STROKES:
                found.append((node.lineno, f"{func}({v:g}): strokes are 0.6, 1.0 or 1.6 pt (ruling D1)"))
        if func == "set_dpi":
            found.append((node.lineno, "set_dpi overrides fig-dpi 300 (ruling D5)"))
        if func in PLOT_CALLS:
            for arg in node.args:
                if isinstance(arg, ast.Constant) and isinstance(arg.value, str) and 0 < len(arg.value) <= 4 \
                        and FMT_RE.match(arg.value) and re.search(r"[bgrcmy]", arg.value):
                    found.append((node.lineno, f"format string {arg.value!r} carries a chromatic colour letter"))
        size_keys = FONTSIZE_KEYS | ({"size"} if func in TEXT_CALLS else set())
        for kw in node.keywords:
            if kw.arg == "figsize":
                if isinstance(kw.value, (ast.Tuple, ast.List)) and len(kw.value.elts) == 2:
                    figsizes.append((node.lineno, number(kw.value.elts[0]), number(kw.value.elts[1])))
                else:
                    figsizes.append((node.lineno, None, None))
            elif kw.arg == "dpi":
                found.append((node.lineno, "dpi= overrides fig-dpi 300 (ruling D5)"))
            elif kw.arg in size_keys:
                v = number(kw.value)
                message = size_finding(f"{kw.arg}={v:g}", v) if v is not None else None
                if message:
                    found.append((node.lineno, message))
                elif isinstance(kw.value, ast.Constant) and kw.value.value in SMALL_NAMED_SIZES:
                    found.append((node.lineno, f"{kw.arg}={kw.value.value!r}: under 8 pt at the 9 pt base"))
                elif isinstance(kw.value, ast.Constant) and kw.value.value in LARGE_NAMED_SIZES:
                    found.append((node.lineno, f"{kw.arg}={kw.value.value!r}: above {MAX_FONTSIZE:g} pt "
                                               "at the 9 pt base"))
            elif kw.arg in STROKE_KEYS:
                v = number(kw.value)
                if v is not None and round(v, 3) not in STROKES:
                    found.append((node.lineno, f"{kw.arg}={v:g}: strokes are 0.6, 1.0 or 1.6 pt (ruling D1)"))
            elif kw.arg in ("fontweight", "weight"):
                if isinstance(kw.value, ast.Constant) and str(kw.value.value) not in WEIGHTS:
                    found.append((node.lineno, f"{kw.arg}={kw.value.value!r}: weights are normal or bold"))
            if kw.arg in ("prop", "fontdict") and isinstance(kw.value, ast.Dict):
                for k, v in zip(kw.value.keys, kw.value.values):
                    if isinstance(k, ast.Constant) and k.value in ("size", "fontsize"):
                        n = number(v)
                        message = size_finding(f"{kw.arg} size {n:g}", n) if n is not None else None
                        if message:
                            found.append((node.lineno, message))
    if not figsizes:
        found.append((1, "no explicit figsize (ruling D1: author at print width)"))
    for lineno, w, h in figsizes:
        if w is None:
            found.append((lineno, "figsize is not a literal (width, height) pair"))
            continue
        if not any(abs(w - target) < 0.005 for target in WIDTHS):
            found.append((lineno, f"figsize width {w:g} in; the print widths are 4.6 and 3.07 in"))
        if h is not None and h > MAX_HEIGHT:
            found.append((lineno, f"figsize height {h:g} in exceeds {MAX_HEIGHT} in"))
    for lineno, message in sorted(set(found)):
        report.place(Finding("data", fig.page, cell.page_line(offset + lineno), f"{tag}: {message}"), pinned)


def feeder_checks(fig: DataFigure, cells: list[Cell], first: int, allowed_hex: set[str],
                  exemptions: dict[tuple[str, str], str], report: Report,
                  pinned: set[int]) -> dict[str, tuple[str, str]]:
    """Audit each feeder's binding; return {name: (value, cell)} for the exempt ones."""
    tag = f"{fig.label} (Figure {fig.printed})"
    exempt_values: dict[str, tuple[str, str]] = {}
    for name in fig.feeders:
        resolved = resolve_feeder(cells, name, first)
        if resolved is None:
            report.add("data", fig.page, None, f"{tag}: feeder {name} is bound by no cell before the figure")
            continue
        cell, stmts, offset = resolved
        if (fig.page, name) in exemptions:
            values = bound_strings(stmts, name)
            if values:
                exempt_values[name] = (values[-1], cell.name)
            entry = report.exempt.setdefault((fig.page, cell.name), {"names": set(), "figures": set(),
                                                                     "reason": set()})
            entry["names"].add(name)
            entry["figures"].add(fig.printed)
            entry["reason"].add(exemptions[(fig.page, name)])
            continue
        for lineno, message in sorted(set(colour_findings(stmts, allowed_hex))):
            report.place(Finding("data", fig.page, cell.page_line(offset + lineno),
                                 f"{tag}: feeder {name} ({cell.name}): {message}"), pinned)
        report.counts["feeders_audited"] = report.counts.get("feeders_audited", 0) + 1
    return exempt_values


def reference_checks(page: str, texts: dict[str, str], corpus: str, report: Report) -> None:
    text = texts[page]
    labels: list[tuple[str, str | None]] = []
    for m in FENCE_RE.finditer(text):
        label = re.search(r"^#\|\s*label:\s*((?:ep)?fig-[\w-]+)\s*$", m.group(1), re.M)
        if label:
            labels.append((label.group(1), None))
    for m in DIV_OPEN_RE.finditer(text):
        before = text[:m.start()]
        alias = list(ALIAS_RE.finditer(before))
        near = alias[-1].group(1) if alias and not re.sub(r"```\{=html\}|```", "", before[alias[-1].end():]).strip() else None
        labels.append((m.group(2), near))
    for m in IMAGE_FIG_RE.finditer(text):
        labels.append((m.group(1), None))
    labels = list(dict.fromkeys(labels))
    missing = []
    for label, alias in labels:
        names = [label] + ([alias] if alias else [])
        if not any(re.search(rf"(?<![\w-])[@#]{re.escape(n)}(?![\w-])", corpus) for n in names):
            missing.append(label)
    report.counts["figures_labelled"] = report.counts.get("figures_labelled", 0) + len(labels)
    report.counts["figures_unreferenced"] = report.counts.get("figures_unreferenced", 0) + len(missing)
    for label in missing:
        report.add("refs", page, None, f"{label} has no reference in the running text (ruling D7)")


def running_text(text: str) -> str:
    """The prose of a page: no code, comments, figure divs, figure-image captions,
    headings, Plan steps, or Exercises and Sources sections (ruling D7)."""
    text = COMMENT_RE.sub("", text)
    text = ANY_FENCE_RE.sub("", text)
    text = IMAGE_FIG_RE.sub("", text)
    out, depth, apparatus = [], None, None
    for line in text.split("\n"):
        if depth is not None:
            if line.strip() == depth:
                depth = None
            continue
        heading = HEADING_RE.match(line)
        if heading:
            level = len(heading.group(1))
            if apparatus is not None and level <= apparatus:
                apparatus = None
            if apparatus is None and APPARATUS_HEADING_RE.match(line):
                apparatus = level
            continue
        if apparatus is not None:
            continue
        m = DIV_OPEN_RE.match(line) or PLAN_OPEN_RE.match(line)
        if m:
            depth = m.group(1)
            continue
        out.append(line)
    return "\n".join(out)


def audit_pages(only: str | None) -> tuple[Report, list[str]]:
    report = Report()
    sys.path.insert(0, str(ROOT / "scripts"))
    from notebook_manifest import UNITS_BY_SOURCE  # type: ignore

    rows = {**{p: "locked (docs/locks.md)" for p in table_pages(LOCKS)}, **list_pages(DEFERRED)}
    figure_pages = pages_with_figures()
    allowed_hex = INKS | PAIR | role_hexes()
    all_qmd = sorted(p.relative_to(ROOT).as_posix() for p in (ROOT / "chapters").rglob("*.qmd"))
    texts = {p: (ROOT / p).read_text(encoding="utf-8") for p in ["index.qmd", *all_qmd]}
    deferred = {p: rows[row] for p in texts if (row := listed(p, rows))}
    cells_of = {p: parse_cells(t) for p, t in texts.items()}
    pages = [p for p in figure_pages if only in (None, p)]
    with_loader: set[str] = set()
    for page in pages:
        if page in deferred:
            report.notes.append(f"{page}: deferred ({deferred[page]})")
            continue
        if loader_checks(page, texts[page], cells_of[page], report):
            with_loader.add(page)
            rc_checks(page, cells_of[page], pinned_lines(page, texts[page]), report)
    report.counts["pages_with_figures"] = len(figure_pages)
    report.counts["pages_audited"] = len([p for p in pages if p not in deferred])
    report.counts["pages_with_loader"] = len(with_loader)
    for source, unit in sorted(UNITS_BY_SOURCE.items()):
        if only not in (None, source):
            continue
        has_asset = STYLE_ASSET in unit.assets
        has_loader = bool(loader_hits(source, cells_of[source])) if source in cells_of else False
        if has_asset != has_loader:
            report.add("asset", source, None,
                       f"unit {unit.slug}: {'ships' if has_asset else 'lacks'} the {STYLE_ASSET} asset "
                       f"but its source {'lacks' if has_asset else 'holds'} the loader")
        report.counts["units_with_asset"] = report.counts.get("units_with_asset", 0) + has_asset
    exemptions = feeder_exemptions()
    for fig in data_figures():
        if only not in (None, fig.page) or fig.page in deferred:
            continue
        cells = [c for c in cells_of[fig.page] if c.figure == fig.label]
        if not cells:
            report.add("data", fig.page, None, f"{fig.label} (Figure {fig.printed}): no figure cell with this label")
            continue
        pinned = pinned_lines(fig.page, texts[fig.page])
        exempt_values = feeder_checks(fig, cells_of[fig.page], cells[0].index, allowed_hex, exemptions,
                                      report, pinned)
        for cell in cells:
            data_checks(fig, cell, allowed_hex, report, pinned, exempt_values)
        report.counts["data_figures_audited"] = report.counts.get("data_figures_audited", 0) + 1
    for (page, cell), entry in sorted(report.exempt.items()):
        report.notes.append(
            f"{page}: feeder(s) {', '.join(sorted(entry['names']))} in {cell} exempt until phase 3 "
            f"({'; '.join(sorted(entry['reason']))}); their uses in Figure(s) "
            f"{', '.join(sorted(entry['figures']))} are checked")
    for page in [p for p in figure_pages if only in (None, p) and p not in deferred]:
        pinned = pinned_lines(page, texts[page])
        for cell in cells_of[page]:
            if cell.figure is None and draws(cell) is None:
                continue
            for i, line in enumerate(cell.lines):
                if "\u2014" in line:
                    report.place(Finding("dash", page, cell.page_line(i + 1), "U+2014 in a figure cell"), pinned)
    corpus = "\n".join(running_text(t) for t in texts.values())
    for page in ["index.qmd", *all_qmd]:
        if only not in (None, page) or page in deferred:
            continue
        reference_checks(page, texts, corpus, report)
    return report, sorted(deferred)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    mode = ap.add_mutually_exclusive_group()
    mode.add_argument("--report", action="store_true", help="report page findings, exit 0 (default)")
    mode.add_argument("--strict", action="store_true", help="exit 1 on any page finding")
    mode.add_argument("--check-lock", metavar="QMD", help="exit 1 when docs/locks.md lists this page")
    ap.add_argument("--page", help="limit the page checks to one page")
    ap.add_argument("--fail-on", metavar="CHECKS",
                    help=f"exit 1 on any finding of these checks (comma-separated: {','.join(CHECKS)})")
    ap.add_argument("--json", type=Path, help="also write the findings as JSON")
    ap.add_argument("--quiet", action="store_true", help="print counts only (and --fail-on findings)")
    args = ap.parse_args()

    if args.check_lock:
        page = normalize_page(args.check_lock)
        row = listed(page, table_pages(LOCKS))
        if row:
            print(f"LOCKED: {page} is listed in docs/locks.md ({row}); no edit and no render until the "
                  "author's commit lands on main", file=sys.stderr)
            return 1
        print(f"not locked: {page}")
        return 0

    fail_on = {c.strip() for c in (args.fail_on or "").split(",") if c.strip()}
    if fail_on - set(CHECKS):
        ap.error(f"--fail-on: unknown check(s) {sorted(fail_on - set(CHECKS))}; known: {','.join(CHECKS)}")
    page = normalize_page(args.page) if args.page else None
    if page is not None and not (ROOT / page).is_file():
        ap.error(f"--page: no page {args.page}")
    style = style_errors()
    report, deferred = audit_pages(page)
    by_check: dict[str, int] = {}
    for f in report.findings:
        by_check[f.check] = by_check.get(f.check, 0) + 1
    fatal = [f for f in report.findings if f.check in fail_on]
    if not args.quiet:
        for f in report.findings:
            print(f.text())
        for f in report.pinned:
            print("[pinned, D11] " + f.text())
        for note in report.notes:
            print(f"note: {note}")
    else:
        for f in fatal:
            print(f.text())
    for error in style:
        print(f"STYLE: {error}")
    c = report.counts
    summary = (
        f"figure style: style file {'ok' if not style else f'{len(style)} error(s)'}; "
        f"loader on {c.get('pages_with_loader', 0)} of {c.get('pages_audited', 0)} audited pages with "
        f"figures ({c.get('pages_with_figures', 0)} in all, {len(deferred)} deferred); "
        f"{c.get('units_with_asset', 0)} unit(s) ship the style asset; "
        f"{c.get('data_figures_audited', 0)} data figure(s) audited "
        f"({c.get('feeders_audited', 0)} feeder binding(s)); "
        f"{c.get('figures_unreferenced', 0)} of {c.get('figures_labelled', 0)} labelled figures unreferenced; "
        f"findings by check {dict(sorted(by_check.items())) or 'none'}; {len(report.pinned)} pinned (D11)"
    )
    print(summary)
    if args.json:
        args.json.write_text(json.dumps({
            "style_errors": style, "counts": c, "deferred": deferred,
            "findings": [f.__dict__ for f in report.findings],
            "pinned": [f.__dict__ for f in report.pinned], "notes": report.notes,
        }, indent=1) + "\n", encoding="utf-8")
    if style:
        print("FAILED: the style file breaks its contract", file=sys.stderr)
        return 1
    if fatal:
        print(f"FAILED (--fail-on {','.join(sorted(fail_on))}): {len(fatal)} finding(s)", file=sys.stderr)
        return 1
    if args.strict and report.findings:
        print(f"FAILED (strict): {len(report.findings)} page finding(s)", file=sys.stderr)
        return 1
    print("PASS (report mode: page findings are listed, not failed)" if not args.strict else "PASS (strict)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
