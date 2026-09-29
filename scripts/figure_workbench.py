#!/usr/bin/env python3
"""Figure workbench: execute one book page the way Quarto does, outside Quarto.

The pre-test tool of the figure pipeline (press W2 phase 2, plan section G). It never
writes into the repository: everything lands under --out, which must lie outside it.

  figure_workbench.py --page chapters/part2/08-cnn.qmd --out OUT
                      [--clone DIR] [--qmd EDITED.qmd] [--insert-loader [LABEL]]
                      [--style book.mplstyle | --style none]
                      [--form reference|public|both] [--preset book|quarto-html|quarto-pdf]

What it does (reference form, the default):
 1. Converts the page with Quarto's own conversion (`quarto convert`, Quarto 1.10.18 first
    on PATH, as scripts/export_notebooks.py does) and checks that every converted code
    cell keeps the page's Python. --qmd substitutes an edited copy of the page (to
    pre-test receipts); the clone still supplies the working directory, data, code/ and
    the freeze to compare against. --insert-loader writes a copy of the page with the
    book's loader line (ruling D6) after the import block that holds the first
    `import matplotlib.pyplot as plt` of the named cell (default: of the page; after the
    notebook support end marker when that import sits inside the support block; at the
    top of a named cell that imports nothing), so both forms run the style exactly as
    the page will once the loader lands. On the 23 pages of plan section B's placement
    table that need no named cell, the default reproduces the table's lines.
 2. Injects one hidden setup cell in front, like Quarto's kernel setup
    (share/jupyter/lang/python/setup.py): figure.figsize, figure.dpi, savefig.dpi
    "figure", matplotlib_inline formats, chdir to the page's directory, %reset. The
    `book` preset sets formats ("svg", "pdf") in ONE kernel, so each figure display
    carries both files; fig-dpi 300 (_quarto.yml) and Quarto's HTML default figsize
    7 x 5. With --style, the setup cell also runs plt.style.use(<absolute path>); leave
    it at `none` for a page that carries its loader line. Presets quarto-html (retina
    PNG, dpi 96) and quarto-pdf (PDF, dpi 300, 5.5 x 3.5) reproduce the pre-SVG freezes.
 3. Executes every code cell with nbclient in the page's directory, with Quarto's
    environment: the venv kernel, QUARTO_FIG_* variables, SOURCE_DATE_EPOCH, the clone's
    code/ first on PYTHONPATH, `#|` option lines stripped, `eval: false` skipped, and the
    page's own thread pin kept (Quarto keeps it; only the notebook exporter strips it).
    Stream outputs are merged as Quarto's fixupStreams does.
 4. Writes each figure as Quarto names it: <label>-output-N.{svg,pdf,png}, or
    cell-K-output-N for an unlabelled cell, with the bytes Quarto writes (an SVG keeps
    its trailing newline: Quarto joins the notebook's line list without trimming it).
    figures/figures.json records sizes, the figsize matplotlib reported, the smallest and
    median text at 120 mm, the lints below, and whether the file equals the committed
    freeze file of the same name.
 5. Captures every cell's stdout, stderr, text results and errors, and compares stdout
    (and text display results) per native cell with the clone's frozen html.json (exact
    equality of the block list), plus a parity check against tex.json.

Lints (report only; from the figure's own artists, read by a display formatter that
never draws or changes state):
  grayscale   series in one axes that grayscale cannot tell apart (ruling D2: every
              multi-series axes survives grayscale by linestyle or marker): two or more
              labelled series, or two or more lines of more than two points, in one ink
              and one style; two unmarked lines that share linestyle and width whatever
              their colours; any other pair that differs by colour alone. Scatter marker
              shapes are compared by path, so a diamond is not a circle. The CIE L* gap
              is reported for information only: a lightness gap is not a separation
              (thin equal-weight pairs merge).
  hue         artists in a role hex (tex/macros.tex), a site UVA hue, a default-cycle
              (tab10) hue, an Okabe-Ito hue, or any other chromatic colour outside the
              D2 teal and magenta pair; colormapped artists are not counted.
  text        text colours other than 1A1A1A and 4D4D4D; U+2014 in any text; image
              axes with 1 to 3 visible spines.

--form public also runs the public-notebook form of the unit: a local bootstrap (the
clone's code/ on sys.path, chdir to the page dir, `import torch`, the manifest's support
code), then only the executable visible surfaces, with no hidden cells, so a loader that
sits in a hidden cell is absent there and a visible loader runs as it will for a reader.
The form reports whether the style was active (font.size 9). Its stdout is reported, not
failed (the public notebooks run at the platform's thread default); any stderr in a
visible surface fails, except the declared 05 surface-007 warning contract.

Exit status: 0 when every executed cell's stdout matches the freeze, no cell errored,
and no stderr was written; 1 otherwise; 2 on a usage or tool error. Stderr is strict by
default. Exceptions: the declared 05 surface-007 non-leaf .grad warning (in both forms);
lines matching --stderr-ignore REGEX; with --allow-stderr-in-unchanged, cells whose
source equals the clone page's; and the known fontTools lines ("'created' timestamp
seems very low") that Type 42 subsetting of the Cmsy10 prime writes on the PDF path
(ruling D3), which are always tolerated. The kernel gets PYTHONDONTWRITEBYTECODE=1 so
nothing is written into the clone.

The module also holds the helpers that scripts/contact_sheet.py and
scripts/figure_ledger.py share: figure-folder manifests, SVG/PDF/PNG sizes, PDF text
sizes and fonts, PDF rasterization with PyMuPDF, and SVG rasterization in headless Chrome
(PyMuPDF mis-renders matplotlib SVG hatches and alpha fills, so it reads PDFs only).
"""

from __future__ import annotations

import argparse
import base64
import difflib
import hashlib
import json
import os
import re
import shutil
import statistics
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.dont_write_bytecode = True   # importing the clone's scripts must not write __pycache__ into it

QUARTO_BIN = Path.home() / ".local/quarto-1.10.18/bin"
VENV_PY = Path.home() / ".venvs/dl-book/bin/python"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DEFAULT_EPOCH = "1790553600"   # 2026-09-28T00:00:00Z, the book date (scripts/render_chapter.sh)
PRINT_WIDTH_MM = 120.0          # the press text block
PROOF_WIDTH_IN = 6.8            # the letterpaper proof block (margin 0.85 in)
COLUMN_PX = 749                 # HTML column: calc(800px - 3em) at 17 px root
MANIFEST = "figures.json"
LOADER_TEMPLATE = 'plt.style.use("{prefix}code/dlbook/book.mplstyle")  # the book\'s figure style'
PYPLOT_IMPORT = "import matplotlib.pyplot as plt"
SUPPORT_END = "# notebook-support-end"
PUBLIC_STDERR_ALLOWED = {("chapters/part1/05-backpropagation.qmd", 7)}  # notebook_stdout_contracts.py
PRESETS = {
    "book": {"formats": ["svg", "pdf"], "dpi": 300, "figsize": (7.0, 5.0)},
    "quarto-html": {"formats": ["retina"], "dpi": 96, "figsize": (7.0, 5.0)},
    "quarto-pdf": {"formats": ["pdf"], "dpi": 300, "figsize": (5.5, 3.5)},
}
FONTTOOLS_TIMESTAMP = re.compile(r"'(created|modified)' timestamp seems very low")
ANSI_RE = re.compile(r"\x1b\[[0-9;]*[A-Za-z]")
OPTION_RE = re.compile(r"^#\|\s*([\w-]+):\s*(.*?)\s*$")
MIME_EXT = {"image/svg+xml": "svg", "application/pdf": "pdf", "image/png": "png"}


def loader_line(page: str | Path) -> str:
    """The exact loader line for a page: one `../` per directory below the root."""
    depth = len(Path(page).parts) - 1
    return LOADER_TEMPLATE.format(prefix="../" * depth)


# ----------------------------------------------------------------------------- manifests
def load_manifest(folder: Path) -> dict[str, dict]:
    """Return {stem: record} for a figure folder; build one from file names if absent."""
    folder = Path(folder)
    path = folder / MANIFEST
    if path.is_file():
        data = json.loads(path.read_text(encoding="utf-8"))
        return data.get("figures", data)
    records: dict[str, dict] = {}
    for f in sorted(folder.iterdir()):
        if f.suffix.lower() in (".svg", ".pdf", ".png"):
            records.setdefault(f.stem, {"stem": f.stem})[f.suffix.lower()[1:]] = f.name
    return records


def write_manifest(folder: Path, figures: dict[str, dict], meta: dict) -> None:
    payload = {"meta": meta, "figures": figures}
    (Path(folder) / MANIFEST).write_text(json.dumps(payload, indent=1) + "\n", encoding="utf-8")


# ----------------------------------------------------------------------------- sizes
_LEN_RE = re.compile(r"^\s*([0-9.]+)\s*(pt|px|in|mm|cm)?\s*$")
_UNIT_PT = {"pt": 1.0, None: 0.75, "px": 0.75, "in": 72.0, "mm": 72 / 25.4, "cm": 72 / 2.54}


def svg_size_pt(path: Path) -> tuple[float, float]:
    """Width and height of an SVG root element in pt (matplotlib and pdftocairo write pt)."""
    head = Path(path).read_text(encoding="utf-8", errors="replace")[:4000]
    m = re.search(r"<svg\b[^>]*>", head, re.S)
    if not m:
        raise ValueError(f"no <svg> root in {path}")
    tag = m.group(0)

    def attr(name: str) -> float:
        a = re.search(rf'\b{name}="([^"]+)"', tag)
        if not a:
            raise ValueError(f"<svg> without {name} in {path}")
        v = _LEN_RE.match(a.group(1))
        if not v:
            raise ValueError(f"unparsed {name}={a.group(1)!r} in {path}")
        return float(v.group(1)) * _UNIT_PT[v.group(2)]

    return attr("width"), attr("height")


def png_size_px(path: Path) -> tuple[int, int]:
    from PIL import Image

    with Image.open(path) as im:
        return im.size


def pdf_size_pt(path: Path) -> tuple[float, float]:
    import pymupdf

    with pymupdf.open(path) as doc:
        r = doc[0].rect
        return r.width, r.height


def print_scale(width_pt: float, block_pt: float) -> float:
    """\\pandocbounded only scales down: a figure prints at min(natural, block) width."""
    return min(1.0, block_pt / width_pt) if width_pt else 1.0


def pdf_text_sizes(path: Path) -> dict:
    """Text span sizes of a one-page figure PDF, as authored and at print widths.

    Sizes are PyMuPDF span sizes (one span = one run of text in one font and size, so a
    mathtext sub- or superscript is its own span). Medians are over spans.
    """
    import pymupdf

    with pymupdf.open(path) as doc:
        page = doc[0]
        width_pt = page.rect.width
        spans = []
        for block in page.get_text("dict")["blocks"]:
            if block.get("type") != 0:
                continue
            for line in block["lines"]:
                for span in line["spans"]:
                    text = span["text"].strip()
                    if text:
                        spans.append((round(span["size"], 2), text, span["font"]))
    s120 = print_scale(width_pt, PRINT_WIDTH_MM / 25.4 * 72)
    s68 = print_scale(width_pt, PROOF_WIDTH_IN * 72)
    out = {
        "width_in": round(width_pt / 72, 3),
        "print_width_mm": round(min(width_pt / 72 * 25.4, PRINT_WIDTH_MM), 1),
        "scale_120mm": round(s120, 4),
        "n_spans": len(spans),
    }
    if spans:
        sizes = sorted(s for s, _, _ in spans)
        smallest = sorted(spans)[:3]
        out.update({
            "min_pt": sizes[0],
            "median_pt": round(statistics.median(sizes), 2),
            "min_pt_120mm": round(sizes[0] * s120, 2),
            "p10_pt_120mm": round(sizes[max(0, int(0.1 * (len(sizes) - 1)))] * s120, 2),
            "median_pt_120mm": round(statistics.median(sizes) * s120, 2),
            "min_pt_6p8in": round(sizes[0] * s68, 2),
            "smallest": [f"{t!r} {s} pt ({f})" for s, t, f in smallest],
            "fonts": sorted({f for _, _, f in spans}),
        })
    return out


def pdf_fonts(path: Path) -> list[str]:
    """Font types embedded in a PDF (Type3, TrueType, CIDFontType2 ...), like pdffonts."""
    import pymupdf

    with pymupdf.open(path) as doc:
        return sorted({f"{f[2]}/{f[1]}:{f[3]}" for f in doc[0].get_fonts(full=True)})


def rasterize_pdf(path: Path, out_png: Path, width_px: int | None = None, dpi: float = 200.0,
                  print_block_mm: float | None = PRINT_WIDTH_MM) -> dict:
    """Rasterize page 1 of a figure PDF with PyMuPDF at true print size.

    With print_block_mm, the figure is printed at min(natural width, block) and rendered
    at `dpi`, so text appears at its printed size.
    """
    import pymupdf

    with pymupdf.open(path) as doc:
        page = doc[0]
        w_pt = page.rect.width
        if width_px is None:
            target_in = w_pt / 72
            if print_block_mm:
                target_in = min(target_in, print_block_mm / 25.4)
            width_px = max(1, round(target_in * dpi))
        zoom = width_px / w_pt
        pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False)
        pix.save(str(out_png))
        return {"width_px": pix.width, "height_px": pix.height, "zoom": round(zoom, 5),
                "print_width_in": round(width_px / dpi, 3)}


# ----------------------------------------------------------------------------- chrome
class Chrome:
    """Headless Chrome driven over the DevTools protocol (one browser for many tiles).

    Plain `--screenshot` works but, on the reference Mac, Chrome does not exit after
    writing the file, so one browser is started, driven over a websocket, and closed.
    """

    def __init__(self, chrome: str = CHROME, dsf: float = 1.0, timeout: float = 60.0):
        import websocket  # websocket-client, present in the book venv

        if not Path(chrome).exists():
            raise FileNotFoundError(chrome)
        self.dsf = dsf
        self.timeout = timeout
        self.profile = Path(tempfile.mkdtemp(prefix="dlbook-chrome-"))
        self.host_dir = Path(tempfile.mkdtemp(prefix="dlbook-raster-"))
        (self.host_dir / "raster.html").write_text(
            "<!doctype html><html><head><meta charset='utf-8'><style>"
            "html,body{margin:0;padding:0;background:#fff}img{display:block}"
            "</style></head><body><img id='i' alt=''></body></html>", encoding="utf-8")
        self.proc = subprocess.Popen(
            [chrome, "--headless=new", "--remote-debugging-port=0", "--remote-allow-origins=*",
             f"--user-data-dir={self.profile}", "--disable-gpu", "--hide-scrollbars",
             "--no-first-run", "--no-default-browser-check", "--disable-extensions",
             "--mute-audio", "--allow-file-access-from-files", "about:blank"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
        port_file = self.profile / "DevToolsActivePort"
        deadline = time.time() + timeout
        while not (port_file.is_file() and port_file.read_text().count("\n") >= 1):
            if time.time() > deadline or self.proc.poll() is not None:
                self.close()
                raise RuntimeError("headless Chrome did not start")
            time.sleep(0.1)
        port = int(port_file.read_text().splitlines()[0])
        targets = []
        while time.time() < deadline:
            try:
                with urllib.request.urlopen(f"http://127.0.0.1:{port}/json/list", timeout=5) as r:
                    targets = [t for t in json.load(r) if t.get("type") == "page"]
                if targets:
                    break
            except OSError:
                pass
            time.sleep(0.1)
        if not targets:
            self.close()
            raise RuntimeError("headless Chrome exposed no page target")
        self.ws = websocket.create_connection(targets[0]["webSocketDebuggerUrl"],
                                              timeout=timeout, suppress_origin=True)
        self._id = 0
        self.version = self.call("Browser.getVersion").get("product", "?")
        self.call("Page.enable")
        self._navigate((self.host_dir / "raster.html").as_uri())

    def call(self, method: str, params: dict | None = None) -> dict:
        self._id += 1
        mid = self._id
        self.ws.send(json.dumps({"id": mid, "method": method, "params": params or {}}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == mid:
                if "error" in msg:
                    raise RuntimeError(f"{method}: {msg['error']}")
                return msg.get("result", {})

    def _navigate(self, url: str) -> None:
        self._id += 1
        mid = self._id
        self.ws.send(json.dumps({"id": mid, "method": "Page.navigate", "params": {"url": url}}))
        got_reply = got_load = False
        while not (got_reply and got_load):
            msg = json.loads(self.ws.recv())
            if msg.get("id") == mid:
                got_reply = True
            elif msg.get("method") == "Page.loadEventFired":
                got_load = True

    def rasterize(self, image: Path, css_width: float, out_png: Path) -> dict:
        """Show `image` as an <img> at css_width CSS px (height by aspect) and screenshot it."""
        image = Path(image).resolve()
        w = max(1, int(round(css_width)))
        self.call("Emulation.setDeviceMetricsOverride",
                  {"width": w, "height": 16, "deviceScaleFactor": self.dsf, "mobile": False})
        expr = (
            "(async () => { const i = document.getElementById('i');"
            f" i.style.width = '{w}px'; i.style.height = 'auto';"
            f" i.src = {json.dumps(image.as_uri())};"
            " await i.decode();"
            " await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));"
            " const b = i.getBoundingClientRect();"
            " return [b.width, b.height, i.naturalWidth, i.naturalHeight]; })()"
        )
        res = self.call("Runtime.evaluate", {"expression": expr, "awaitPromise": True,
                                             "returnByValue": True})
        if "exceptionDetails" in res:
            raise RuntimeError(f"Chrome could not decode {image}: {res['exceptionDetails']}")
        bw, bh, nw, nh = res["result"]["value"]
        h = max(1, int(round(bh)))
        self.call("Emulation.setDeviceMetricsOverride",
                  {"width": w, "height": h, "deviceScaleFactor": self.dsf, "mobile": False})
        shot = self.call("Page.captureScreenshot",
                         {"format": "png", "clip": {"x": 0, "y": 0, "width": w, "height": h,
                                                    "scale": 1}, "fromSurface": True})
        Path(out_png).write_bytes(base64.b64decode(shot["data"]))
        return {"css_width": w, "css_height": h, "natural_css": [nw, nh], "dsf": self.dsf}

    def close(self) -> None:
        try:
            if getattr(self, "ws", None):
                try:
                    self.call("Browser.close")
                except Exception:  # noqa: BLE001
                    pass
                self.ws.close()
        finally:
            if self.proc.poll() is None:
                try:
                    os.killpg(self.proc.pid, 15)
                except OSError:
                    pass
                try:
                    self.proc.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    os.killpg(self.proc.pid, 9)
            shutil.rmtree(self.profile, ignore_errors=True)
            shutil.rmtree(self.host_dir, ignore_errors=True)

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.close()


# ----------------------------------------------------------------------------- helpers
def log(msg: str) -> None:
    print(f"[workbench {time.strftime('%H:%M:%S')}] {msg}", flush=True)


def text_of(value) -> str:
    return "".join(value) if isinstance(value, list) else (value or "")


def cell_options(source: str) -> dict[str, str]:
    opts = {}
    for line in source.splitlines():
        m = OPTION_RE.match(line)
        if m:
            opts[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    return opts


def strip_options(source: str) -> str:
    """Quarto executes a cell without its `#|` option lines (nb_strip_yaml_options)."""
    lines = source.split("\n")
    i = 0
    while i < len(lines) and lines[i].startswith("#|"):
        i += 1
    return "\n".join(lines[i:])


def auto_identifier(label: str) -> str:
    """A close enough copy of pandocAutoIdentifier(label, true) for cell labels."""
    s = label.strip().lower().replace(" ", "-")
    return re.sub(r"[^a-z0-9_.\-]", "", s)


def discardable(output: dict, have_image: bool) -> bool:
    """Quarto's isDiscardableTextExecuteResult."""
    if output.get("output_type") != "execute_result":
        return False
    data = output.get("data", {})
    if list(data) != ["text/plain"] or not have_image:
        return False
    lines = text_of(data["text/plain"]).splitlines() or [""]
    if len(lines) == 1:
        first = lines[0].strip()
        return bool(re.match(r"^([<(\[]).*?([>)\]])$", first) or re.match(r"^Text\([-\d]", first)
                    or (first.startswith("{") and "<matplotlib." in first))
    return any("<matplotlib." in line for line in lines)


def fixup_streams(outputs: list[dict]) -> list[dict]:
    """Quarto's fixupStreams: merge consecutive stream outputs of the same name."""
    merged: list[dict] = []
    for out in outputs:
        if (merged and out.get("output_type") == "stream"
                and merged[-1].get("output_type") == "stream"
                and merged[-1].get("name") == out.get("name")):
            merged[-1] = dict(merged[-1], text=text_of(merged[-1]["text"]) + text_of(out["text"]))
        else:
            merged.append(dict(out))
    return merged


def as_record(text: str) -> str:
    """The text a freeze code fence holds: ANSI stripped, ending in one newline."""
    text = ANSI_RE.sub("", text)
    return text if text.endswith("\n") else text + "\n"


def sha256(path: Path) -> str:
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def pdf_masked(data: bytes) -> bytes:
    data = re.sub(rb"/CreationDate \(D:[^)]*\)", b"/CreationDate ()", data)
    data = re.sub(rb"\nxref\n.*?trailer", b"\nxref trailer", data, flags=re.S)
    return re.sub(rb"startxref\n\d+", b"startxref", data)


def svg_masked(data: bytes) -> bytes:
    """An SVG without its date (dc:date follows SOURCE_DATE_EPOCH or the clock)."""
    return re.sub(rb"<dc:date>[^<]*</dc:date>", b"<dc:date></dc:date>", data)


def compare_to_freeze(new: Path, old: Path | None) -> str | None:
    """identical | masked-identical (metadata and offsets only) | pixel-identical | differs."""
    if old is None or not old.is_file():
        return None
    a, b = new.read_bytes(), old.read_bytes()
    if a == b:
        return "identical"
    if new.suffix == ".svg" and svg_masked(a) == svg_masked(b):
        return "masked-identical"
    if new.suffix == ".pdf":
        if pdf_masked(a) == pdf_masked(b):
            return "masked-identical"
        try:
            import pymupdf

            def pix(p):
                with pymupdf.open(p) as d:
                    pg = d[0]
                    return (pg.rect.width, pg.rect.height,
                            pg.get_pixmap(matrix=pymupdf.Matrix(1.5, 1.5), alpha=False).samples)
            if pix(new) == pix(old):
                return "pixel-identical"
        except Exception:  # noqa: BLE001
            pass
    return "differs"


# ----------------------------------------------------------------------------- freeze
def load_freeze_records(clone: Path, page: str, fmt: str, rev: str | None):
    """(stdout {ordinal: [text]}, displays {ordinal: [text]}, freeze hash) from a freeze JSON."""
    rel = Path("_freeze") / Path(page).with_suffix("") / "execute-results" / f"{fmt}.json"
    if rev:
        res = subprocess.run(["git", "-C", str(clone), "show", f"{rev}:{rel.as_posix()}"],
                             capture_output=True, text=True)
        if res.returncode != 0:
            return None, None, f"{rev}:{rel} not found"
        raw = res.stdout
    else:
        path = clone / rel
        if not path.is_file():
            return None, None, f"{path} not found"
        raw = path.read_text(encoding="utf-8")
    sys.path.insert(0, str(clone / "scripts"))
    try:
        from audit_frozen_stdout import display_records, stdout_records  # type: ignore
    except Exception as exc:  # noqa: BLE001
        return None, None, f"cannot import the clone's audit_frozen_stdout: {exc}"
    stdout: dict[int, list[str]] = {}
    for ordinal, text in stdout_records(raw):
        stdout.setdefault(ordinal, []).append(text)
    displays: dict[int, list[str]] = {}
    for ordinal, text in display_records(raw):
        displays.setdefault(ordinal, []).append(text)
    freeze_hash = json.loads(raw).get("hash")
    return stdout, displays, freeze_hash


# ----------------------------------------------------------------------------- conversion
def quarto_env() -> dict[str, str]:
    env = dict(os.environ)
    env["PATH"] = f"{QUARTO_BIN}:{env.get('PATH', '')}"
    env["QUARTO_PYTHON"] = str(VENV_PY)
    return env


def quarto_convert(clone: Path, source: Path, out_ipynb: Path):
    import nbformat

    env = quarto_env()
    version = subprocess.run(["quarto", "--version"], capture_output=True, text=True, env=env).stdout.strip()
    res = subprocess.run(["quarto", "convert", str(source), "--output", str(out_ipynb)],
                         cwd=clone, capture_output=True, text=True, env=env)
    if res.returncode != 0:
        raise RuntimeError(f"quarto convert failed:\n{res.stderr}")
    return nbformat.read(out_ipynb, as_version=4), version


def native_cells(nb) -> list[dict]:
    cells = []
    for cell in nb.cells:
        if cell.cell_type != "code":
            continue
        opts = cell_options(cell.source)
        ordinal = len(cells) + 1
        label = opts.get("label")
        cells.append({
            "ordinal": ordinal,
            "label": label,
            # Quarto names an unlabelled cell's figures cell-<code ordinal + 1>-output-N.
            "stem": auto_identifier(label) if label else f"cell-{ordinal + 1}",
            "hidden": opts.get("echo", "true").lower() == "false",
            "eval": opts.get("eval", "true").lower() != "false",
            "source": cell.source,
        })
    return cells


def parity_check(clone: Path, source: Path, cells: list[dict]) -> tuple[list[str], dict]:
    """export_notebooks.py's check: the converted Python equals the page's Python."""
    notes: list[str] = []
    info: dict = {}
    sys.path.insert(0, str(clone / "scripts"))
    try:
        import export_notebooks as ex  # type: ignore
    except Exception as exc:  # noqa: BLE001
        return [f"parity check skipped: cannot import export_notebooks ({exc})"], info
    try:
        doc = ex.parse_document(source)
    except Exception as exc:  # noqa: BLE001
        return [f"export_notebooks.parse_document refused the page: {exc}"], info
    if len(doc.native_cells) != len(cells):
        notes.append(f"quarto convert emitted {len(cells)} code cells, the page has {len(doc.native_cells)}")
        return notes, info
    for cell, native in zip(cells, doc.native_cells):
        cell["source_line"] = native.source_line
        if ex.learner_code(cell["source"]) != ex.learner_code(native.body):
            notes.append(f"quarto convert changed Python at line {native.source_line}")
    info["surfaces"] = [
        {"ordinal": s.ordinal, "native_ordinal": s.native_ordinal, "label": s.label,
         "executable": s.executable, "source_line": s.source_line}
        for s in doc.surfaces
    ]
    return notes, info


PY_FENCE_RE = re.compile(r"^```\{python\}\n(.*?)\n^```", re.S | re.M)


def insert_loader(page_text: str, page: str, cell_label: str | None) -> tuple[str, int]:
    """Return (page text with the loader line, 1-based line number of the new line).

    The line goes after the import block holding the first `import matplotlib.pyplot as
    plt` of the named cell (or of the page), or after the support end marker when that
    import sits inside the notebook support block; in a named cell with no such import
    (pyplot imported earlier), it opens the cell's code. A page that already carries
    the line is returned unchanged.
    """
    line = loader_line(page)
    if line in page_text:
        return page_text, page_text[:page_text.index(line)].count("\n") + 1
    for m in PY_FENCE_RE.finditer(page_text):
        body = m.group(1)
        label = cell_options(body).get("label")
        if cell_label and label != cell_label:
            continue
        lines = body.split("\n")
        if PYPLOT_IMPORT not in [ln.strip() for ln in lines]:
            if not cell_label:
                continue
            # A named cell that uses an earlier import (15-bert-pretraining.qmd's
            # fig-visibility-corruption): the line opens its code, after the options.
            if PYPLOT_IMPORT not in page_text[:m.start()]:
                raise ValueError(f"no `{PYPLOT_IMPORT}` before cell {cell_label}")
            at = 0
            while at < len(lines) and lines[at].startswith("#|"):
                at += 1
            lines.insert(at, line)
            start = m.start(1)
            text = page_text[:start] + "\n".join(lines) + page_text[m.end(1):]
            return text, page_text[:start].count("\n") + at + 1
        at = [ln.strip() for ln in lines].index(PYPLOT_IMPORT)
        # After the whole import block that holds the pyplot import, never inside it.
        depth = 0
        while at + 1 < len(lines):
            nxt = lines[at + 1].strip()
            if depth == 0 and not nxt.startswith(("import ", "from ")):
                break
            at += 1
            depth += nxt.count("(") - nxt.count(")")
        if SUPPORT_END in lines and at < lines.index(SUPPORT_END) and any(
                ln.strip().startswith("# notebook-support-start") for ln in lines[:at]):
            at = lines.index(SUPPORT_END)
        indent = re.match(r"\s*", lines[at]).group(0)
        lines.insert(at + 1, indent + line)
        new_body = "\n".join(lines)
        start = m.start(1)
        text = page_text[:start] + new_body + page_text[m.end(1):]
        return text, page_text[:start].count("\n") + at + 2
    raise ValueError(f"no cell{' ' + cell_label if cell_label else ''} imports pyplot on {page}")


# ----------------------------------------------------------------------------- execution
FACTS_MIME = "application/x-dlbook-figure-facts+json"
# Runs inside the kernel as its own module (so %reset cannot clear it). It adds one JSON
# mimetype to every figure display; it only reads the figure (no draw, no state change).
FACTS_MODULE = r'''
import hashlib
import matplotlib
from matplotlib.colors import to_hex, to_rgba
from matplotlib.markers import MarkerStyle
from IPython.core.formatters import JSONFormatter

_NAMED_MARKERS = ["o", "s", "^", "v", "<", ">", "D", "d", "x", "+", "*", "p", "h", "H",
                  "8", ".", "P", "X", "|", "_", "1", "2", "3", "4"]

def _hex(c):
    try:
        if to_rgba(c)[3] == 0:
            return None          # invisible (alpha 0), e.g. the facecolor of fill=False
        return to_hex(c, keep_alpha=False)
    except Exception:
        return None

def _path_key(path):
    import numpy as np
    v = np.asarray(path.vertices, dtype=float)
    if v.size == 0:
        return "empty"
    span = float(np.abs(v).max()) or 1.0
    v = np.round(v / span, 2)
    codes = path.codes.tobytes() if path.codes is not None else b""
    return hashlib.sha1(v.tobytes() + codes).hexdigest()[:10]

_MARKER_KEYS = {}
for _m in _NAMED_MARKERS:
    try:
        _ms = MarkerStyle(_m)
        # Scaled twins ('.' is a small 'o') share a key: the first-listed name wins.
        _MARKER_KEYS.setdefault(_path_key(_ms.get_path().transformed(_ms.get_transform())), _m)
    except Exception:
        pass

def _marker_of(collection):
    """The marker of a scatter (PathCollection), by its path: a named symbol or a key."""
    try:
        paths = collection.get_paths()
    except Exception:
        return None
    if not paths:
        return None
    key = _path_key(paths[0])
    return _MARKER_KEYS.get(key, "path:" + key)

def _ls(artist):
    try:
        ls = artist.get_linestyle()
    except Exception:
        return None
    if isinstance(ls, list):
        ls = ls[0] if ls else None
    if isinstance(ls, tuple):
        offset, dashes = ls
        return "solid" if not dashes else "dash" + ",".join(f"{d:.1f}" for d in dashes)
    return str(ls)

def facts(fig):
    eng = fig.get_layout_engine()
    out = {"figsize_in": [round(float(v), 4) for v in fig.get_size_inches()],
           "dpi": float(fig.dpi), "layout": type(eng).__name__ if eng else None,
           "texts": [], "axes": []}
    for t in fig.findobj(matplotlib.text.Text):
        s = t.get_text()
        if s and t.get_visible():
            out["texts"].append([s[:120], round(float(t.get_fontsize()), 2), _hex(t.get_color())])
    out["texts"] = out["texts"][:600]
    for ax in fig.axes:
        a = {"images": len(ax.images), "axis_on": bool(ax.axison),
             "spines_visible": int(sum(bool(sp.get_visible()) for sp in ax.spines.values())),
             "lines": [], "collections": [], "patches": []}
        for ln in ax.get_lines()[:80]:
            if not ln.get_visible():
                continue
            a["lines"].append([_hex(ln.get_color()), str(ln.get_linestyle()),
                               round(float(ln.get_linewidth()), 3), str(ln.get_marker()),
                               len(ln.get_xdata()) if hasattr(ln.get_xdata(), "__len__") else 1,
                               str(ln.get_label())[:60]])
        for c in ax.collections[:80]:
            if not c.get_visible():
                continue
            mapped = c.get_array() is not None
            fcs = [] if mapped else [_hex(v) for v in list(c.get_facecolor())[:3]]
            ecs = [] if mapped else [_hex(v) for v in list(c.get_edgecolor())[:3]]
            lws = [round(float(w), 3) for w in list(c.get_linewidth())[:1]] or [0.0]
            kind = type(c).__name__
            marker = _marker_of(c) if kind == "PathCollection" else None
            sizes = [round(float(s), 2) for s in list(getattr(c, "get_sizes", lambda: [])())[:1]]
            a["collections"].append([kind, fcs, ecs, marker, _ls(c), lws[0], sizes[0] if sizes else None,
                                     mapped, str(c.get_label())[:60]])
        for p in ax.patches[:120]:
            fc = _hex(p.get_facecolor()) if p.get_fill() else None
            ec = _hex(p.get_edgecolor()) if p.get_linewidth() > 0 else None
            a["patches"].append([type(p).__name__, fc, ec, str(p.get_hatch() or "")])
        out["axes"].append(a)
    return out

class FactsFormatter(JSONFormatter):
    format_type = "''' + FACTS_MIME + r'''"

def install(ip):
    from matplotlib.figure import Figure
    f = FactsFormatter(parent=ip.display_formatter)
    ip.display_formatter.formatters[f.format_type] = f
    f.for_type(Figure, facts)
'''


def preamble_source(preset: dict, style: Path | None, page_dir: Path, hashsalt: str | None) -> str:
    formats = ", ".join(repr(f) for f in preset["formats"])
    lines = [
        "# dlbook workbench setup cell (stands in for Quarto's kernel setup; not page code)",
        "import os as _wb_os, sys as _wb_sys, json as _wb_json",
        "import matplotlib as _wb_mpl",
        "import matplotlib.pyplot as _wb_plt",
        f"_wb_plt.rcParams['figure.figsize'] = {preset['figsize']!r}",
        f"_wb_plt.rcParams['figure.dpi'] = {preset['dpi']!r}",
        "_wb_plt.rcParams['savefig.dpi'] = 'figure'",
        "from matplotlib_inline.backend_inline import set_matplotlib_formats as _wb_formats",
        f"_wb_formats({formats})",
    ]
    if hashsalt:
        lines.append(f"_wb_plt.rcParams['svg.hashsalt'] = {hashsalt!r}")
    if style is not None:
        lines.append(f"_wb_plt.style.use({str(style)!r})")
    lines += [
        "import types as _wb_types",
        "_wb_facts = _wb_types.ModuleType('_dlbook_workbench_facts')",
        f"exec(compile({FACTS_MODULE!r}, '<dlbook-workbench-facts>', 'exec'), _wb_facts.__dict__)",
        "_wb_sys.modules['_dlbook_workbench_facts'] = _wb_facts",
        "_wb_facts.install(get_ipython())",
    ]
    lines += [
        f"_wb_os.chdir({str(page_dir)!r})",
        "print(_wb_json.dumps({'python': _wb_sys.executable, 'cwd': _wb_os.getcwd(),"
        " 'matplotlib': _wb_mpl.__version__, 'backend': _wb_mpl.get_backend(),"
        " 'SOURCE_DATE_EPOCH': _wb_os.environ.get('SOURCE_DATE_EPOCH'),"
        " 'rc': {k: str(_wb_plt.rcParams[k]) for k in ('figure.dpi', 'figure.figsize',"
        " 'font.size', 'lines.linewidth', 'pdf.fonttype', 'svg.hashsalt', 'text.color')}}))",
        "get_ipython().run_line_magic('reset', '-f')",
    ]
    return "\n".join(lines)


PROBE_SOURCE = """\
import sys as _wb_sys, json as _wb_json
_wb_probe = {}
if 'torch' in _wb_sys.modules:
    _wb_probe['torch_threads'] = _wb_sys.modules['torch'].get_num_threads()
    _wb_probe['torch'] = _wb_sys.modules['torch'].__version__
if 'numpy' in _wb_sys.modules:
    _wb_probe['numpy'] = _wb_sys.modules['numpy'].__version__
import matplotlib as _wb_mpl
_wb_probe['rc_font_size'] = _wb_mpl.rcParams['font.size']
_wb_probe['rc_lines_linewidth'] = _wb_mpl.rcParams['lines.linewidth']
_wb_probe['style_active'] = _wb_mpl.rcParams['font.size'] == 9 and _wb_mpl.rcParams['svg.hashsalt'] == 'dl-book'
print(_wb_json.dumps(_wb_probe))
"""


def kernel_env(args, preset: dict) -> dict[str, str]:
    env = dict(os.environ)
    fmt = preset["formats"][0]
    env["QUARTO_FIG_WIDTH"] = str(preset["figsize"][0])
    env["QUARTO_FIG_HEIGHT"] = str(preset["figsize"][1])
    env["QUARTO_FIG_DPI"] = str(preset["dpi"] * 2 if fmt == "retina" else preset["dpi"])
    env["QUARTO_FIG_FORMAT"] = "png" if fmt == "retina" else fmt
    env["QUARTO_PYTHON"] = str(VENV_PY)
    if args.source_date_epoch and args.source_date_epoch != "0":
        env["SOURCE_DATE_EPOCH"] = args.source_date_epoch
    else:
        env.pop("SOURCE_DATE_EPOCH", None)
    if not args.no_clone_code_path:
        env["PYTHONPATH"] = os.pathsep.join(
            [str(args.clone / "code")] + ([env["PYTHONPATH"]] if env.get("PYTHONPATH") else []))
    env.pop("MPLBACKEND", None)
    env["PYTHONDONTWRITEBYTECODE"] = "1"   # keep the clone free of __pycache__
    return env


def run_cells(code_cells: list[str], *, cwd: Path, env: dict, timeout: int, keep_going: bool,
              tags: list[str]):
    """Execute code cells in one fresh kernel; return (executed notebook, per-cell outputs, seconds)."""
    import nbformat
    from nbclient import NotebookClient

    nb = nbformat.v4.new_notebook()
    nb.metadata["kernelspec"] = {"name": "python3", "display_name": "Python 3", "language": "python"}
    nb.cells = [nbformat.v4.new_code_cell(src, metadata={"tags": [tag]})
                for src, tag in zip(code_cells, tags)]
    client = NotebookClient(nb, timeout=timeout, kernel_name="python3", allow_errors=True,
                            record_timing=False, resources={"metadata": {"path": str(cwd)}})
    results, seconds = [], []
    with client.setup_kernel(env=env):
        for index, cell in enumerate(nb.cells):
            start = time.time()
            fatal = False
            try:
                client.execute_cell(cell, index)
            except Exception as exc:  # timeout or dead kernel: record it as the cell's error
                cell.outputs.append(nbformat.v4.new_output(
                    "error", ename=type(exc).__name__, evalue=str(exc)[:2000], traceback=[]))
                fatal = True
            seconds.append(round(time.time() - start, 2))
            results.append(cell.outputs)
            errored = any(o.get("output_type") == "error" for o in cell.outputs)
            if fatal or (errored and not keep_going):
                for rest in nb.cells[index + 1:]:
                    rest.metadata["tags"] = rest.metadata.get("tags", []) + ["not-executed"]
                break
    return nb, results, seconds


def digest_outputs(outputs: list[dict]) -> dict:
    merged = fixup_streams(outputs)
    have_image = any(set(o.get("data", {})) & set(MIME_EXT) for o in merged)
    stderr = "".join(text_of(o["text"]) for o in merged
                     if o.get("output_type") == "stream" and o.get("name") == "stderr")
    kept = [o for o in merged
            if not (o.get("output_type") == "stream" and o.get("name") == "stderr")
            and not discardable(o, have_image)]
    stdout, displays, figures, errors = [], [], [], []
    for n, out in enumerate(kept, start=1):
        kind = out.get("output_type")
        if kind == "stream":
            stdout.append(as_record(text_of(out["text"])))
        elif kind in ("display_data", "execute_result"):
            data = out.get("data", {})
            images = {m: data[m] for m in MIME_EXT if m in data}
            if images:
                figures.append({"n": n, "data": images, "facts": data.get(FACTS_MIME),
                                "text_plain": text_of(data.get("text/plain", "")),
                                "metadata": out.get("metadata", {})})
            elif "text/plain" in data:
                displays.append(as_record(text_of(data["text/plain"])))
        elif kind == "error":
            errors.append({"ename": out.get("ename"), "evalue": out.get("evalue"),
                           "traceback": ANSI_RE.sub("", "\n".join(out.get("traceback", [])))})
    return {"stdout": stdout, "stderr": stderr, "displays": displays, "figures": figures,
            "errors": errors}


# ----------------------------------------------------------------------------- lints
ROLE_HEX = {"#2b6cb0": "feature", "#c05621": "parameter", "#805ad5": "target",
            "#2f855a": "prediction", "#722f37": "residual"}
UVA_HEX = {"#232d4b": "navy", "#e57200": "orange", "#2e7d32": "green", "#5379aa": "uni-blue",
           "#b45309": "amber", "#7a5195": "purple"}   # site chrome in dlbook.scss, not for series
TAB10 = {"#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2",
         "#7f7f7f", "#bcbd22", "#17becf"}
OKABE_ITO = {"#e69f00": "orange", "#56b4e9": "sky blue", "#009e73": "bluish green",
             "#f0e442": "yellow", "#0072b2": "blue", "#d55e00": "vermillion",
             "#cc79a7": "reddish purple"}
PAIR_HEX = {"#0ea1a1": "teal", "#9a0669": "magenta"}   # ruling D2's colour-blind-safe pair
INKS = ("#1a1a1a", "#4d4d4d", "#7a7a7a", "#949494")
LABEL_TEXT = {"#1a1a1a", "#4d4d4d"}                 # ruling D2: label text colours


def _lab(hexc: str) -> tuple[float, float, float]:
    """CIE L*a*b* (D65) of an sRGB hex."""
    rgb = [int(hexc[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb]
    x = (0.4124564 * lin[0] + 0.3575761 * lin[1] + 0.1804375 * lin[2]) / 0.95047
    y = 0.2126729 * lin[0] + 0.7151522 * lin[1] + 0.0721750 * lin[2]
    z = (0.0193339 * lin[0] + 0.1191920 * lin[1] + 0.9503041 * lin[2]) / 1.08883

    def f(t: float) -> float:
        return t ** (1 / 3) if t > (6 / 29) ** 3 else t / (3 * (6 / 29) ** 2) + 4 / 29
    return 116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))


def gray_lstar(hexc: str) -> float:
    """L* of the Rec. 601 gray a contact sheet prints (PIL ImageOps.grayscale)."""
    r, g, b = (int(hexc[i:i + 2], 16) for i in (1, 3, 5))
    y601 = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0
    lin = y601 / 12.92 if y601 <= 0.04045 else ((y601 + 0.055) / 1.055) ** 2.4
    f = lin ** (1 / 3) if lin > 216 / 24389 else (24389 / 27 * lin + 16) / 116
    return 116 * f - 16


def chroma(hexc: str) -> float:
    _, a, b = _lab(hexc)
    return (a * a + b * b) ** 0.5


NO_MARKER = ("None", "none", "", " ")


def _series(ax: dict) -> dict[tuple, dict]:
    """Group an axes' lines and scatters into series keyed by (colour, style signature).

    Each group counts its artists ("n"), their distinct legend labels, and its lines of
    more than two points ("multi": a data series, not a two-point guide). A marker of
    "", " " or "none" reads as no marker ("None").
    """
    groups: dict[tuple, dict] = {}
    for rec in ax["lines"]:
        colour, ls, lw, marker = rec[:4]
        marker = "None" if marker in NO_MARKER else marker
        if colour is None or (ls in ("None", "", " ") and marker == "None"):
            continue
        sig = ("line", ls, round(lw, 2), marker)
        g = groups.setdefault((colour, sig), {"n": 0, "labels": set(), "multi": 0})
        g["n"] += 1
        g["multi"] += int(len(rec) > 4 and (rec[4] or 0) > 2)
        if len(rec) > 5 and rec[5] and not str(rec[5]).startswith("_"):
            g["labels"].add(rec[5])
    for rec in ax["collections"]:
        kind, fcs, ecs = rec[:3]
        if kind != "PathCollection" or (len(rec) > 7 and rec[7]):
            continue          # scatters only; colormapped scatters are read by their colour bar
        colour = (fcs[0] if fcs and fcs[0] else (ecs[0] if ecs else None))
        if colour is None:
            continue
        marker = rec[3] if len(rec) > 3 else "o"
        size = rec[6] if len(rec) > 6 else None
        filled = bool(fcs and fcs[0])
        sig = ("scatter", marker, size, filled)
        g = groups.setdefault((colour, sig), {"n": 0, "labels": set(), "multi": 0})
        g["n"] += 1
        if len(rec) > 8 and rec[8] and not str(rec[8]).startswith("_"):
            g["labels"].add(rec[8])
    return groups


def _style(sig: tuple) -> str:
    if sig[0] == "line":
        return f"linestyle {sig[1]}, width {sig[2]}, marker {sig[3]}"
    return f"marker {sig[1]}, size {sig[2]}"


def grayscale_lint(facts: dict) -> list[str]:
    """Series in one axes that grayscale cannot tell apart (ruling D2).

    - one ink and one style shared by two or more labelled series, or by two or more
      lines of more than two points: identical in colour and in grayscale;
    - two lines with no marker that share linestyle and width, whatever their colours
      ("no two series in one axes share both linestyle and width");
    - any other pair of series that differ by colour alone.
    """
    flags = []
    for index, ax in enumerate(facts["axes"]):
        groups = _series(ax)
        for (colour, sig), g in groups.items():
            if g["n"] >= 2 and (len(g["labels"]) >= 2 or g["multi"] >= 2):
                labels = ", ".join(sorted(g["labels"])[:4]) or "unlabelled"
                flags.append(f"axes {index}: {g['n']} series share ink {colour} and {_style(sig)} "
                             f"({labels}; identical in colour and in grayscale)")
        keys = list(groups)
        for i, a in enumerate(keys):
            for b in keys[i + 1:]:
                dl = abs(gray_lstar(a[0]) - gray_lstar(b[0]))
                unmarked = (a[1][0] == b[1][0] == "line" and a[1][3] == b[1][3] == "None"
                            and a[1][1:3] == b[1][1:3])
                if unmarked:
                    flags.append(f"axes {index}: {a[0]} vs {b[0]} share linestyle {a[1][1]} and width "
                                 f"{a[1][2]} with no marker (gray dL* {dl:.1f})")
                elif a[1] == b[1] and a[0] != b[0]:
                    flags.append(f"axes {index}: {a[0]} vs {b[0]} share {_style(a[1])} "
                                 f"(colour only; gray dL* {dl:.1f})")
    return flags


def hue_lint(colours: set[str]) -> dict[str, list[str]]:
    out: dict[str, list[str]] = {}
    for c in sorted(colours):
        if c in ROLE_HEX:
            out.setdefault("role_hex", []).append(f"{ROLE_HEX[c]} {c}")
        elif c in UVA_HEX:
            out.setdefault("uva_hue", []).append(f"{UVA_HEX[c]} {c}")
        elif c in TAB10:
            out.setdefault("default_cycle_hex", []).append(c)
        elif c in OKABE_ITO:
            out.setdefault("okabe_ito_hex", []).append(f"{OKABE_ITO[c]} {c}")
        elif c in PAIR_HEX:
            out.setdefault("d2_pair", []).append(f"{PAIR_HEX[c]} {c}")
        elif chroma(c) > 12:
            out.setdefault("other_hue", []).append(c)
    return out


def figure_lints(facts: dict) -> dict:
    """Report-only checks from the figure's own artists."""
    colours: set[str] = set()
    for ax in facts["axes"]:
        for ln in ax["lines"]:
            if ln[0]:
                colours.add(ln[0])
        for rec in ax["collections"]:
            for c in list(rec[1]) + list(rec[2]):
                if c:
                    colours.add(c)
        for rec in ax["patches"]:
            for c in rec[1:3]:
                if c:
                    colours.add(c)
    text_colours = {t[2] for t in facts["texts"] if t[2]}
    lints: dict = dict(hue_lint(colours | text_colours))
    gray = grayscale_lint(facts)
    if gray:
        lints["grayscale_inseparable"] = gray
    dash = [t[0] for t in facts["texts"] if "\u2014" in t[0]]
    if dash:
        lints["u2014_in_text"] = dash[:5]
    half = [i for i, ax in enumerate(facts["axes"])
            if ax["images"] and ax["axis_on"] and ax["spines_visible"] not in (0, 4)]
    if half:
        lints["image_axes_with_partial_spines"] = half
    odd = sorted(c for c in text_colours if c not in LABEL_TEXT)
    if odd:
        lints["text_colours_outside_1A1A1A_4D4D4D"] = odd
    teal_text = [t[0] for t in facts["texts"] if t[2] == "#0ea1a1"]
    if teal_text:
        lints["teal_text"] = teal_text[:5]
    teal_weak = [f"axes {i}: {ln[1]} {ln[2]} pt" for i, ax in enumerate(facts["axes"])
                 for ln in ax["lines"] if ln[0] == "#0ea1a1" and (ln[2] < 1.0 or ln[1] == ":")]
    if teal_weak:
        lints["teal_thin_or_dotted"] = teal_weak
    sizes = [t[1] for t in facts["texts"]]
    if sizes:
        lints["text_pt_authored_min_max"] = [min(sizes), max(sizes)]
        small = sorted({s for s in sizes if s < 8})
        if small:
            lints["text_under_8pt_authored"] = small
    return lints


FIGSIZE_RE = re.compile(r"<Figure size (\d+(?:\.\d+)?)x(\d+(?:\.\d+)?) with (\d+) Axes>")


def write_figures(stem: str, figs: list[dict], fig_dir: Path, dpi: float, freeze_dir: Path,
                  default_figsize) -> list[dict]:
    records = []
    for fig in figs:
        name = f"{stem}-output-{fig['n']}"
        rec: dict = {"stem": name}
        for mime, payload in fig["data"].items():
            ext = MIME_EXT[mime]
            path = fig_dir / f"{name}.{ext}"
            text = text_of(payload)
            if mime == "image/svg+xml" and "<svg" in text:
                # Quarto reads the executed notebook from disk, where nbformat stores the
                # SVG as a list of lines, and joins that list without trimming it
                # (quarto.js mdImageOutput): the file keeps matplotlib's trailing newline.
                path.write_text(text, encoding="utf-8")
            else:
                path.write_bytes(base64.b64decode(text.replace("\n", "")))
            rec[ext] = path.name
            rec[f"{ext}_bytes"] = path.stat().st_size
            rec[f"{ext}_sha256"] = sha256(path)
            sub = "figure-html" if ext in ("png", "svg") else "figure-pdf"
            same = compare_to_freeze(path, freeze_dir / sub / path.name)
            if same:
                rec[f"{ext}_vs_freeze"] = same
        facts = fig.get("facts")
        m = FIGSIZE_RE.search(fig["text_plain"])
        if facts:
            w_in, h_in = facts["figsize_in"]
            rec.update({"figsize_in": [round(w_in, 3), round(h_in, 3)], "fig_dpi": facts["dpi"],
                        "layout": facts["layout"], "axes": len(facts["axes"])})
        elif m:
            w_in, h_in = float(m.group(1)) / dpi, float(m.group(2)) / dpi
            rec["figsize_in"] = [round(w_in, 3), round(h_in, 3)]
            rec["axes"] = int(m.group(3))
        if "figsize_in" in rec:
            w_in, h_in = rec["figsize_in"]
            rec["default_figsize"] = (abs(w_in - default_figsize[0]) < 1e-3
                                      and abs(h_in - default_figsize[1]) < 1e-3)
            rec["width_class"] = ("wide 4.6 in" if abs(w_in - 4.6) < 0.011 else
                                  "single 3.07 in" if abs(w_in - 3.07) < 0.011 else "other")
        if facts:
            rec["lints"] = figure_lints(facts)
        if "svg" in rec:
            w, h = svg_size_pt(fig_dir / rec["svg"])
            rec["svg_pt"] = [round(w, 2), round(h, 2)]
        if "png" in rec:
            meta = fig["metadata"].get("image/png", {})
            if meta.get("width"):
                rec["html_width"], rec["html_height"] = meta.get("width"), meta.get("height")
        if "pdf" in rec:
            pdf = fig_dir / rec["pdf"]
            rec["pdf_pt"] = [round(v, 2) for v in pdf_size_pt(pdf)]
            rec["text"] = pdf_text_sizes(pdf)
            rec["pdf_fonts"] = pdf_fonts(pdf)
        records.append(rec)
    return records


def block_diff(expected: list[str], actual: list[str]) -> str:
    diff = difflib.unified_diff("".join(expected).splitlines(), "".join(actual).splitlines(),
                                "freeze", "workbench", lineterm="", n=1)
    return "\n".join(list(diff)[:40])


# ----------------------------------------------------------------------------- forms
def run_reference(args, cells, page_dir, freeze, out: Path, original_cells) -> dict:
    preset = dict(PRESETS[args.preset])
    if args.formats:
        preset["formats"] = args.formats.split(",")
    if args.fig_dpi:
        preset["dpi"] = args.fig_dpi
    if args.figsize:
        preset["figsize"] = tuple(float(v) for v in args.figsize.split(","))
    style = None if args.style in (None, "none") else Path(args.style).resolve()
    hashsalt = None if args.hashsalt == "none" else args.hashsalt
    env = kernel_env(args, preset)
    sources = [preamble_source(preset, style, page_dir, hashsalt)]
    tags = ["workbench-setup"]
    for c in cells:
        sources.append(strip_options(c["source"]) if c["eval"] else "pass  # eval: false")
        tags.append(f"native-{c['ordinal']}")
    sources.append(PROBE_SOURCE)
    tags.append("workbench-probe")
    log(f"reference form: {len(cells)} native cells, preset {args.preset} {preset}, "
        f"style {style or 'none'}, cwd {page_dir}")
    start = time.time()
    nb, results, seconds = run_cells(sources, cwd=page_dir, env=env, timeout=args.timeout,
                                     keep_going=args.keep_going, tags=tags)
    wall = round(time.time() - start, 1)
    import nbformat
    nbformat.write(nb, out / "executed.ipynb")

    fig_dir = out / "figures"
    fig_dir.mkdir(parents=True, exist_ok=True)
    freeze_dir = args.clone / "_freeze" / Path(args.page).with_suffix("")
    setup = digest_outputs(results[0]) if results else {}
    setup_info = {}
    if setup.get("stdout"):
        try:
            setup_info = json.loads(setup["stdout"][0])
        except ValueError:
            setup_info = {"raw": setup["stdout"]}
    probe = {}
    if len(results) == len(sources):
        p = digest_outputs(results[-1])
        if p["stdout"]:
            probe = json.loads(p["stdout"][0])

    stdout_f, displays_f = freeze["stdout"], freeze["displays"]
    per_cell, manifest = [], {}
    executed = len(results) - 1
    for c in cells:
        rec = {k: c.get(k) for k in ("ordinal", "label", "stem", "hidden", "eval", "source_line")}
        orig = original_cells.get(c["ordinal"])
        rec["changed"] = orig is None or orig != c["source"]
        if c["ordinal"] > executed:
            rec["status"] = "not-executed"
            per_cell.append(rec)
            continue
        d = digest_outputs(results[c["ordinal"]])
        rec["seconds"] = seconds[c["ordinal"]]
        rec["stdout"] = d["stdout"]
        rec["stderr"] = d["stderr"]
        rec["displays"] = d["displays"]
        rec["errors"] = d["errors"]
        exp = stdout_f.get(c["ordinal"], []) if stdout_f is not None else None
        exp_d = displays_f.get(c["ordinal"], []) if displays_f is not None else None
        if exp is None:
            rec["stdout_vs_freeze"] = "no-freeze"
        else:
            rec["stdout_vs_freeze"] = "identical" if exp == d["stdout"] else "differs"
            rec["freeze_stdout_blocks"] = len(exp)
            if exp != d["stdout"]:
                rec["stdout_diff"] = block_diff(exp, d["stdout"])
                rec["stdout_text_equal"] = "".join(exp) == "".join(d["stdout"])
            rec["displays_vs_freeze"] = "identical" if exp_d == d["displays"] else "differs"
        figs = write_figures(c["stem"], d["figures"], fig_dir, preset["dpi"], freeze_dir,
                             preset["figsize"])
        for f in figs:
            f.update({"label": c["label"], "cell_ordinal": c["ordinal"], "hidden": c["hidden"],
                      "source_line": c.get("source_line")})
            manifest[f["stem"]] = f
        rec["figures"] = [f["stem"] for f in figs]
        per_cell.append(rec)
    write_manifest(fig_dir, manifest, {
        "source": "workbench", "page": args.page, "qmd": str(args.qmd or args.page),
        "style": str(style) if style else None, "preset": args.preset, "formats": preset["formats"],
        "fig_dpi": preset["dpi"], "figsize_default": list(preset["figsize"])})

    # Parity: tex.json stdout must match html.json stdout (both come from one source).
    tex_parity = None
    if freeze.get("tex_stdout") is not None and stdout_f is not None:
        tex_parity = freeze["tex_stdout"] == stdout_f
    return {"form": "reference", "preset": args.preset, "formats": preset["formats"],
            "fig_dpi": preset["dpi"], "figsize_default": list(preset["figsize"]),
            "style": str(style) if style else None, "wall_seconds": wall,
            "setup": setup_info, "probe": probe, "cells": per_cell,
            "figures": list(manifest), "freeze_tex_html_stdout_parity": tex_parity,
            "env": {k: env.get(k) for k in ("SOURCE_DATE_EPOCH", "PYTHONPATH", "QUARTO_FIG_FORMAT",
                                            "QUARTO_FIG_DPI", "QUARTO_FIG_WIDTH", "QUARTO_FIG_HEIGHT",
                                            "OMP_NUM_THREADS", "MKL_NUM_THREADS")}}


def run_public(args, source: Path, page_dir: Path, freeze, out: Path) -> dict:
    sys.path.insert(0, str(args.clone / "scripts"))
    import export_notebooks as ex  # type: ignore
    from notebook_manifest import UNITS_BY_SOURCE  # type: ignore

    unit = UNITS_BY_SOURCE.get(Path(args.page).as_posix())
    if unit is None:
        return {"form": "public", "skipped": f"{args.page} is not a notebook unit"}
    doc = ex.parse_document(source)
    support = ex._support_code(doc, unit.support)  # noqa: SLF001 (the exporter's own selector)
    boot = [
        "# dlbook workbench: local stand-in for the public notebook bootstrap",
        "import os as _bootstrap_os, sys as _bootstrap_sys",
        f"_bootstrap_sys.path.insert(0, {str(args.clone / 'code')!r})",
        f"_bootstrap_os.chdir({str(page_dir)!r})",
    ]
    if args.public_formats:
        boot += ["from matplotlib_inline.backend_inline import set_matplotlib_formats as _wb_f",
                 f"_wb_f({', '.join(repr(f) for f in args.public_formats.split(','))})"]
    boot += ["import torch", "from torch import nn"]
    if support:
        boot += ["", support]
    surfaces = [s for s in doc.surfaces if s.executable]
    loader = loader_line(args.page)
    visible_loader = [s.ordinal for s in surfaces if loader in s.code]
    sources = ["\n".join(boot)] + [s.code for s in surfaces] + [PROBE_SOURCE]
    tags = ["public-bootstrap"] + [f"surface-{s.ordinal}" for s in surfaces] + ["workbench-probe"]
    env = dict(os.environ)
    env.pop("MPLBACKEND", None)
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    if args.source_date_epoch and args.source_date_epoch != "0":
        env["SOURCE_DATE_EPOCH"] = args.source_date_epoch
    log(f"public form: bootstrap + {len(surfaces)} executable surfaces (support "
        f"{'present' if support else 'none'}; loader in visible surface {visible_loader or 'none'})")
    start = time.time()
    nb, results, seconds = run_cells(sources, cwd=page_dir, env=env, timeout=args.timeout,
                                     keep_going=args.keep_going, tags=tags)
    wall = round(time.time() - start, 1)
    import nbformat
    nbformat.write(nb, out / "executed-public.ipynb")
    fig_dir = out / "public-figures"
    fig_dir.mkdir(parents=True, exist_ok=True)
    rows = []
    boot_d = digest_outputs(results[0]) if results else None
    for i, s in enumerate(surfaces, start=1):
        rec = {"surface": s.ordinal, "native_ordinal": s.native_ordinal, "label": s.label,
               "source_line": s.source_line}
        if i >= len(results):
            rec["status"] = "not-executed"
            rows.append(rec)
            continue
        d = digest_outputs(results[i])
        rec.update({"seconds": seconds[i], "stderr": d["stderr"], "errors": d["errors"],
                    "stdout": d["stdout"]})
        exp = (freeze["stdout"] or {}).get(s.native_ordinal, [])
        rec["stdout_vs_freeze"] = "identical" if exp == d["stdout"] else "differs (info only)"
        rec["stderr_allowed"] = (Path(args.page).as_posix(), s.ordinal) in PUBLIC_STDERR_ALLOWED
        figs = write_figures(f"surface-{s.ordinal}", d["figures"], fig_dir, 100.0,
                             Path("/nonexistent"), (6.4, 4.8))
        rec["figures"] = [f["stem"] for f in figs]
        rows.append(rec)
    probe = {}
    if len(results) == len(sources):
        p = digest_outputs(results[-1])
        if p["stdout"]:
            probe = json.loads(p["stdout"][0])
    return {"form": "public", "unit": unit.slug, "wall_seconds": wall, "surfaces": rows,
            "visible_loader_surfaces": visible_loader, "probe": probe,
            "bootstrap_stderr": boot_d["stderr"] if boot_d else None,
            "bootstrap_errors": boot_d["errors"] if boot_d else None}


# ----------------------------------------------------------------------------- report
def split_stderr(text: str, ignore: list[re.Pattern]) -> tuple[str, list[str]]:
    """(stderr left after the ignore patterns, the ignored lines)."""
    kept, dropped = [], []
    for line in text.splitlines():
        (dropped if any(p.search(line) for p in ignore) else kept).append(line)
    return "\n".join(kept).strip(), dropped


def stderr_kind(text: str) -> str:
    if FONTTOOLS_TIMESTAMP.search(text):
        return ("fontTools Type 42 subsetting (PDF writing only; Quarto hides it with "
                "warning: false; the Cmsy10 prime fallback, ruling D3)")
    if "UserWarning" in text:
        return "Python warning"
    return "other"


def summarize(report: dict, allow_unchanged_stderr: bool, ignore: list[re.Pattern],
              contract_cells: set[int]) -> tuple[list[str], list[str]]:
    lines, failures = [], []
    ref = report.get("reference")
    if ref:
        cells = ref["cells"]
        ex = [c for c in cells if c.get("status") != "not-executed"]
        with_blocks = [c for c in ex if c.get("freeze_stdout_blocks")]
        same = [c for c in ex if c.get("stdout_vs_freeze") == "identical"]
        lines.append(f"reference form ({ref['preset']}, formats {ref['formats']}, fig-dpi {ref['fig_dpi']}, "
                     f"style {Path(ref['style']).name if ref['style'] else 'none'}): "
                     f"{len(ex)}/{len(cells)} native cells executed in {ref['wall_seconds']} s")
        n_freeze = sum(c.get("freeze_stdout_blocks", 0) for c in ex)
        n_run = sum(len(c.get("stdout", [])) for c in ex)
        lines.append(f"  stdout vs freeze: {len(same)}/{len(ex)} cells identical; "
                     f"{n_run} blocks run vs {n_freeze} frozen ({len(with_blocks)} cells print)")
        for c in ex:
            if c.get("stdout_vs_freeze") not in ("identical", "no-freeze"):
                failures.append(f"stdout differs in cell {c['ordinal']} ({c['label']})")
                lines.append(f"  DIFF cell {c['ordinal']} {c['label']}:\n" + c.get("stdout_diff", ""))
            if c.get("displays_vs_freeze") == "differs":
                failures.append(f"text display differs in cell {c['ordinal']} ({c['label']})")
            if c.get("errors"):
                failures.append(f"error in cell {c['ordinal']} ({c['label']}): "
                                f"{c['errors'][0]['ename']}: {c['errors'][0]['evalue']}")
            if c.get("stderr"):
                left, dropped = split_stderr(c["stderr"], ignore)
                c["stderr_kind"] = stderr_kind(c["stderr"])
                if not left:
                    tag = f"tolerated ({len(dropped)} known or ignored lines)"
                    tolerated = True
                elif c["ordinal"] in contract_cells:
                    tag, tolerated = "allowed by contract (05 surface-007 warning)", True
                elif allow_unchanged_stderr and not c["changed"]:
                    tag, tolerated = "tolerated (unchanged cell)", True
                else:
                    tag, tolerated = "FAIL", False
                lines.append(f"  stderr in cell {c['ordinal']} ({c['label']}) [{tag}; {c['stderr_kind']}]: "
                             + c["stderr"].strip().replace("\n", " | ")[:300])
                if not tolerated:
                    failures.append(f"stderr in cell {c['ordinal']} ({c['label']})")
        not_run = [c for c in cells if c.get("status") == "not-executed"]
        if not_run:
            failures.append(f"{len(not_run)} cells not executed after an error")
        stderr_cells = [c["ordinal"] for c in ex if c.get("stderr")]
        lines.append(f"  stderr: {'none' if not stderr_cells else stderr_cells}; "
                     f"errors: {sum(bool(c.get('errors')) for c in ex)}; "
                     f"changed cells vs clone page: {[c['ordinal'] for c in cells if c['changed']] or 'none'}")
        if ref.get("freeze_tex_html_stdout_parity") is not None:
            lines.append(f"  freeze parity (tex.json stdout == html.json stdout): {ref['freeze_tex_html_stdout_parity']}")
        lines.append(f"  kernel: {ref['setup'].get('python')} cwd {ref['setup'].get('cwd')}; "
                     f"probe {ref['probe']}")
        figs = report.get("figure_table", [])
        if figs:
            lines.append(f"  figures ({len(figs)}):")
            for f in figs:
                lines.append("    " + f)
    pub = report.get("public")
    if pub:
        if pub.get("skipped"):
            lines.append(f"public form: skipped ({pub['skipped']})")
        else:
            lines.append(f"public form ({pub['unit']}): {len(pub['surfaces'])} surfaces in "
                         f"{pub['wall_seconds']} s; loader in visible surfaces "
                         f"{pub.get('visible_loader_surfaces') or 'none'}; style active at the end: "
                         f"{pub.get('probe', {}).get('style_active')}")
            if pub.get("bootstrap_errors"):
                failures.append("public bootstrap errored")
            if pub.get("bootstrap_stderr"):
                failures.append("public bootstrap wrote stderr")
                lines.append("  bootstrap stderr: " + pub["bootstrap_stderr"][:300])
            for s in pub["surfaces"]:
                if s.get("status") == "not-executed":
                    failures.append(f"public surface {s['surface']} not executed")
                    continue
                if s.get("errors"):
                    failures.append(f"public surface {s['surface']} errored: {s['errors'][0]['evalue']}")
                if s.get("stderr"):
                    left, _ = split_stderr(s["stderr"], ignore)
                    ok = s["stderr_allowed"] or not left
                    lines.append(f"  stderr in surface {s['surface']} ({s['label']}) "
                                 f"[{'allowed' if ok else 'FAIL'}]: "
                                 + s["stderr"].strip().replace("\n", " | ")[:400])
                    if not ok:
                        failures.append(f"public surface {s['surface']} wrote stderr")
            same = sum(s.get("stdout_vs_freeze") == "identical" for s in pub["surfaces"])
            lines.append(f"  stdout identical to freeze (info only, thread pin absent): "
                         f"{same}/{len(pub['surfaces'])}; stderr surfaces: "
                         f"{[s['surface'] for s in pub['surfaces'] if s.get('stderr')] or 'none'}")
    return lines, failures


def figure_table(out: Path) -> list[str]:
    rows = []
    for stem, f in load_manifest(out / "figures").items():
        t = f.get("text", {})
        size = f.get("figsize_in")
        parts = [stem, f"figsize {size[0]}x{size[1]} in" if size else "figsize ?"]
        if f.get("default_figsize"):
            parts.append("DEFAULT figsize")
        if t.get("n_spans"):
            parts.append(f"text min {t['min_pt_120mm']} / median {t['median_pt_120mm']} pt at 120 mm")
        for ext in ("svg", "pdf", "png"):
            if ext in f:
                v = f.get(f"{ext}_vs_freeze")
                parts.append(f"{ext} {f[f'{ext}_bytes'] // 1024} KB" + (f" ({v} vs freeze)" if v else ""))
        if f.get("pdf_fonts"):
            parts.append("fonts " + ",".join(sorted({x.split(':')[0] for x in f['pdf_fonts']})))
        if f.get("width_class"):
            parts.append(f"width {f['width_class']}")
        lints = {k: v for k, v in f.get("lints", {}).items() if k != "text_pt_authored_min_max"}
        if lints:
            parts.append("lints " + json.dumps(lints))
        rows.append("; ".join(parts))
    return rows


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--clone", type=Path, default=ROOT,
                    help="checkout of dl-book to execute in (never written; default: this repository)")
    ap.add_argument("--page", required=True, help="page path relative to the clone, e.g. chapters/part2/08-cnn.qmd")
    ap.add_argument("--qmd", type=Path, help="edited copy of the page to execute instead of the clone's")
    ap.add_argument("--insert-loader", nargs="?", const="", metavar="CELL_LABEL",
                    help="run a copy of the page (or of --qmd) with the book's loader line after the "
                         "first pyplot import of CELL_LABEL (default: of the page)")
    ap.add_argument("--style", help="an .mplstyle file to apply in the setup cell, or 'none' (default)")
    ap.add_argument("--out", required=True, type=Path, help="output directory (created; must not be inside the clone)")
    ap.add_argument("--form", choices=["reference", "public", "both"], default="reference")
    ap.add_argument("--preset", choices=sorted(PRESETS), default="book")
    ap.add_argument("--formats", help="override the preset's matplotlib_inline formats, e.g. svg,pdf")
    ap.add_argument("--fig-dpi", type=float, help="override figure.dpi")
    ap.add_argument("--figsize", help="override the default figure.figsize, e.g. 7,5")
    ap.add_argument("--hashsalt", default="dl-book", help="svg.hashsalt set before the style ('none' to skip)")
    ap.add_argument("--source-date-epoch", default=DEFAULT_EPOCH, help="SOURCE_DATE_EPOCH for the kernel ('0' to unset)")
    ap.add_argument("--public-formats", help="matplotlib_inline formats in the public form (default: notebook default)")
    ap.add_argument("--no-clone-code-path", action="store_true",
                    help="do not put <clone>/code first on the kernel's PYTHONPATH")
    ap.add_argument("--freeze-rev", help="read the freeze JSONs from this git revision of the clone instead of its working tree")
    ap.add_argument("--timeout", type=int, default=1800, help="per-cell timeout in seconds")
    ap.add_argument("--keep-going", action="store_true", help="keep executing after a cell errors")
    ap.add_argument("--allow-stderr-in-unchanged", action="store_true",
                    help="do not fail on stderr in cells whose source equals the clone page's")
    ap.add_argument("--stderr-ignore", action="append", default=[], metavar="REGEX",
                    help="tolerate stderr lines matching REGEX (repeatable)")
    ap.add_argument("--no-fail", action="store_true", help="always exit 0 after writing the report")
    args = ap.parse_args()

    args.clone = args.clone.resolve()
    page_abs = args.clone / args.page
    if not page_abs.is_file():
        print(f"no page {page_abs}", file=sys.stderr)
        return 2
    out = args.out.resolve()
    if out.is_relative_to(args.clone):
        print("--out must not be inside the clone", file=sys.stderr)
        return 2
    if args.style not in (None, "none") and not Path(args.style).is_file():
        print(f"no style file {args.style}", file=sys.stderr)
        return 2
    out.mkdir(parents=True, exist_ok=True)
    for stale in ("figures", "public-figures"):
        shutil.rmtree(out / stale, ignore_errors=True)
    source = (args.qmd.resolve() if args.qmd else page_abs)
    if args.insert_loader is not None:
        try:
            text, at = insert_loader(source.read_text(encoding="utf-8"), args.page,
                                     args.insert_loader or None)
        except ValueError as exc:
            print(f"--insert-loader: {exc}", file=sys.stderr)
            return 2
        source = out / f"{page_abs.stem}.with-loader.qmd"
        source.write_text(text, encoding="utf-8")
        args.qmd = source
        log(f"loader inserted at line {at} of {source}")
        if args.style not in (None, "none"):
            log("note: --style is applied on top of the page's own loader")
    if Path(sys.executable).resolve() != VENV_PY.resolve():
        log(f"note: running under {sys.executable}, not {VENV_PY}")
    t0 = time.time()

    nb, qversion = quarto_convert(args.clone, source, out / "converted.ipynb")
    cells = native_cells(nb)
    notes, doc_info = parity_check(args.clone, source, cells)
    original_cells = {}
    if args.qmd:
        onb, _ = quarto_convert(args.clone, page_abs, out / "converted-original.ipynb")
        original_cells = {c["ordinal"]: c["source"] for c in native_cells(onb)}
        if len(original_cells) != len(cells):
            notes.append(f"the edited page has {len(cells)} code cells, the clone page "
                         f"{len(original_cells)} (rule: no new code cells)")
    else:
        original_cells = {c["ordinal"]: c["source"] for c in cells}
    inline = sum(len(re.findall(r"`\{python\}[^`]*`", c.source)) for c in nb.cells if c.cell_type == "markdown")
    if inline:
        notes.append(f"{inline} inline `{{python}}` expressions in markdown were not evaluated")
    log(f"converted with quarto {qversion}: {len(cells)} code cells ({time.time() - t0:.1f} s)")

    stdout_f, displays_f, freeze_hash = load_freeze_records(args.clone, args.page, "html", args.freeze_rev)
    tex_stdout, _, _ = load_freeze_records(args.clone, args.page, "tex", args.freeze_rev)
    if stdout_f is None:
        notes.append(f"freeze: {freeze_hash}")
    freeze = {"stdout": stdout_f, "displays": displays_f, "tex_stdout": tex_stdout}
    md5 = hashlib.md5(source.read_bytes()).hexdigest()
    report = {
        "clone": str(args.clone), "page": args.page, "qmd": str(source),
        "clone_head": subprocess.run(["git", "-C", str(args.clone), "rev-parse", "--short", "HEAD"],
                                     capture_output=True, text=True).stdout.strip(),
        "quarto": qversion, "qmd_md5": md5, "freeze_hash": freeze_hash,
        "freeze_current_for_qmd": freeze_hash == md5 if isinstance(freeze_hash, str) else None,
        "notes": notes, "doc": doc_info,
    }
    if args.form in ("reference", "both"):
        report["reference"] = run_reference(args, cells, page_abs.parent, freeze, out, original_cells)
        report["figure_table"] = figure_table(out)
    if args.form in ("public", "both"):
        report["public"] = run_public(args, source, page_abs.parent, freeze, out)
    report["total_seconds"] = round(time.time() - t0, 1)
    ignore = [FONTTOOLS_TIMESTAMP] + [re.compile(p) for p in args.stderr_ignore]
    contract_cells = {
        s["native_ordinal"] for s in doc_info.get("surfaces", [])
        if (Path(args.page).as_posix(), s["ordinal"]) in PUBLIC_STDERR_ALLOWED and s["native_ordinal"]
    }
    lines, failures = summarize(report, args.allow_stderr_in_unchanged, ignore, contract_cells)
    failures = [f"note: {n}" for n in notes if "not evaluated" not in n and "skipped" not in n] + failures
    report["failures"] = failures
    report["passed"] = not failures
    (out / "report.json").write_text(json.dumps(report, indent=1, default=str) + "\n", encoding="utf-8")
    header = [f"workbench: {args.page}" + (f" (edited copy {source})" if args.qmd else ""),
              f"clone {args.clone} @ {report['clone_head']}; quarto {qversion}; "
              f"qmd md5 {md5} vs freeze hash {freeze_hash}"]
    summary = "\n".join(header + lines + [f"total {report['total_seconds']} s",
                                          "PASS" if not failures else "FAIL:\n  " + "\n  ".join(failures)])
    (out / "report.txt").write_text(summary + "\n", encoding="utf-8")
    print(summary)
    if args.no_fail:
        return 0
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
