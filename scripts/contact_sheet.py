#!/usr/bin/env python3
"""Contact sheets of the book's figures: one folder, or before and after side by side.

The review tool of the figure pipeline (press W2 phase 2, plan section H). Two steps:

  contact_sheet.py freeze --page chapters/part2/08-cnn.qmd --out DIR [--rev REV|WORKTREE]
  contact_sheet.py sheet DIR [DIR2] --out OUT [--names before,after] [--title TEXT]

`freeze` collects a page's committed freeze figures into a figure folder. It reads the
page's html.json and tex.json at --rev (default HEAD, through `git show`, so a later
render cannot leak into "before"; WORKTREE reads the working tree), takes every figure
file each one names (<stem>_files/figure-html/<name>.{png,svg} and
<stem>_files/figure-pdf/<name>.pdf), and copies the committed bytes to DIR. DIR/figures.json
records, per stem: the label, the HTML width and height Quarto wrote (a retina PNG's
display size in CSS px), the SVG and PDF page sizes, the text sizes at 120 mm, the
embedded font types, and sha256. The stems are Quarto's file names (<label>-output-N),
the same names scripts/figure_workbench.py writes, so a freeze folder and a workbench
folder pair by stem.

`sheet` draws the tiles and sheets. With two folders, rows pair the two sides by stem; a
stem present on one side only gets an "(absent)" cell. Tiles, per side and stem (SVGs go
through headless Chrome, never PyMuPDF, which mis-renders matplotlib hatches and alpha):
  html-display  SVG in Chrome at ruling D4's 2 CSS px per pt, capped at the 749 px column
                (max-width: 100%). A PNG (a retina freeze) is shown at its HTML width
                attribute, capped the same way: what the site serves.
  html-natural  SVG in Chrome at its natural size, 4/3 CSS px per pt (an SVG <img> with no
                width attribute), capped at the column. A PNG is shown as in html-display.
  print         the PDF in PyMuPDF at true print size, min(natural width, 120 mm), 200 dpi,
                so text on the tile is the size it prints (\\pandocbounded only scales down).
  <mode>-gray   PIL ImageOps.grayscale of each tile (Rec. 601 luma).
  <mode>-deutan each tile as a deuteranope sees it: the Machado, Oliveira and Fernandes
                (2009) deuteranomaly matrix at severity 1.0, applied in linear sRGB.
Tiles go to OUT/tiles/<side>/<mode>/<stem>.png; sheets to OUT/sheets/<mode>-NN.png (one
row per stem, sides side by side, each tile at 1:1 pixels, rows split by --rows-per-sheet).
Tile captions wrap to their column, so narrow tiles never overlap their neighbours.

Text-size report (OUT/text_sizes.csv and .json): PyMuPDF text spans on each PDF; smallest,
10th percentile and median span size in pt when the figure prints at 120 mm (and the
smallest at the 6.8 in proof block), the authored sizes, and the three smallest spans so
a reader can tell a math subscript from a tick label. OUT/index.json lists everything.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import subprocess
import sys
import time
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import figure_workbench as figtools  # noqa: E402

ROOT = figtools.ROOT
MODES = ("html-display", "html-natural", "print")
# Machado, Oliveira and Fernandes (2009), "A physiologically-based model for simulation of
# color vision deficiency", IEEE TVCG 15(6): deuteranomaly at severity 1.0, a matrix on
# linear RGB. Each row sums to 1, so greys (and the D2 inks) are unchanged.
MACHADO_DEUTAN_1 = (
    (0.367322, 0.860646, -0.227968),
    (0.280085, 0.672501, 0.047413),
    (-0.011820, 0.042940, 0.968881),
)


def deutan(image):
    """A PIL image as a deuteranope sees it (MACHADO_DEUTAN_1 in linear sRGB)."""
    import numpy as np
    from PIL import Image

    rgb = np.asarray(image.convert("RGB"), dtype=np.float64) / 255.0
    linear = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
    seen = np.clip(linear @ np.array(MACHADO_DEUTAN_1).T, 0.0, 1.0)
    srgb = np.where(seen <= 0.0031308, 12.92 * seen, 1.055 * seen ** (1 / 2.4) - 0.055)
    return Image.fromarray(np.round(srgb * 255.0).astype(np.uint8), "RGB")
IMG_RE = re.compile(r"\]\(([^()\s]+)\)(\{[^}]*\})?")  # "](" so caption brackets never end it


# ----------------------------------------------------------------------------- freeze
def git_bytes(clone: Path, rev: str, rel: str) -> bytes | None:
    res = subprocess.run(["git", "-C", str(clone), "show", f"{rev}:{rel}"], capture_output=True)
    return res.stdout if res.returncode == 0 else None


def read_rev(clone: Path, rev: str, rel: str) -> bytes | None:
    if rev == "WORKTREE":
        p = clone / rel
        return p.read_bytes() if p.is_file() else None
    return git_bytes(clone, rev, rel)


def image_refs(markdown: str, kind: str) -> list[dict]:
    """Figure files of one kind (figure-html or figure-pdf) a freeze's markdown names."""
    out = []
    for m in IMG_RE.finditer(markdown):
        target, attrs = m.group(1), m.group(2) or ""
        if f"/{kind}/" not in target:
            continue
        rec = {"file": target.rsplit("/", 1)[-1]}
        ident = re.search(r"#([\w:.-]+)", attrs)
        if ident:
            rec["label"] = ident.group(1)
        for key in ("width", "height"):
            v = re.search(rf"\b{key}=(\d+)", attrs)
            if v:
                rec[f"html_{key}"] = int(v.group(1))
        out.append(rec)
    return out


def collect_freeze(clone: Path, page: str, out: Path, rev: str) -> tuple[dict, list[str]]:
    freeze = Path("_freeze") / Path(page).with_suffix("")
    out.mkdir(parents=True, exist_ok=True)
    figures: dict[str, dict] = {}
    missing = []
    for fmt, kind in (("html", "figure-html"), ("tex", "figure-pdf")):
        raw = read_rev(clone, rev, (freeze / "execute-results" / f"{fmt}.json").as_posix())
        if raw is None:
            missing.append(f"{fmt}.json")
            continue
        doc = json.loads(raw)
        for ref in image_refs(doc["result"]["markdown"], kind):
            name = ref["file"]
            stem, suffix = name.rsplit(".", 1)
            data = read_rev(clone, rev, (freeze / kind / name).as_posix())
            rec = figures.setdefault(stem, {"stem": stem})
            if "label" in ref:
                rec.setdefault("label", ref["label"])
            if data is None:
                missing.append(f"{kind}/{name}")
                continue
            path = out / name
            path.write_bytes(data)
            rec[suffix] = name
            rec[f"{suffix}_bytes"] = len(data)
            rec[f"{suffix}_sha256"] = hashlib.sha256(data).hexdigest()
            if kind == "figure-html":
                for key in ("html_width", "html_height"):
                    if key in ref:
                        rec[key] = ref[key]
                if suffix == "png":
                    rec["png_px"] = list(figtools.png_size_px(path))
                elif suffix == "svg":
                    rec["svg_pt"] = [round(v, 2) for v in figtools.svg_size_pt(path)]
            if suffix == "pdf":
                rec["pdf_pt"] = [round(v, 2) for v in figtools.pdf_size_pt(path)]
                rec["text"] = figtools.pdf_text_sizes(path)
                rec["pdf_fonts"] = figtools.pdf_fonts(path)
    figtools.write_manifest(out, figures, {
        "source": "freeze", "clone": str(clone), "page": page, "rev": rev, "missing": missing})
    return figures, missing


def cmd_freeze(args) -> int:
    clone = args.clone.resolve()
    figures, missing = collect_freeze(clone, args.page, args.out, args.rev)
    print(f"{args.page} @ {args.rev}: {len(figures)} figures -> {args.out}"
          + (f"; missing {missing}" if missing else ""))
    for stem, rec in figures.items():
        t = rec.get("text", {})
        shown = (f"png {rec.get('png_px')} shown at {rec.get('html_width')}x{rec.get('html_height')} CSS px"
                 if rec.get("png") else f"svg {rec.get('svg_pt')} pt")
        print(f"  {stem}: {shown}; pdf {rec.get('pdf_pt')} pt; text at 120 mm min "
              f"{t.get('min_pt_120mm')} median {t.get('median_pt_120mm')}")
    return 1 if missing else 0


# ----------------------------------------------------------------------------- sheets
def font(size: int):
    from PIL import ImageFont
    import matplotlib

    path = Path(matplotlib.get_data_path()) / "fonts" / "ttf" / "DejaVuSans.ttf"
    return ImageFont.truetype(str(path), size)


def wrap(text: str, fnt, width: float) -> list[str]:
    """Greedy word wrap of a caption to a pixel width (a long word gets its own line)."""
    lines: list[str] = []
    for word in text.split():
        if lines and fnt.getlength(lines[-1] + " " + word) <= width:
            lines[-1] += " " + word
        else:
            lines.append(word)
    return lines or [""]


def html_width(rec: dict, folder: Path, mode: str, args) -> tuple[Path, float, str] | None:
    """(image, CSS width, description) for an HTML tile, or None."""
    cap = args.column_px or float("inf")
    if rec.get("svg"):
        path = folder / rec["svg"]
        w_pt, _ = figtools.svg_size_pt(path)
        k = args.px_per_pt if mode == "html-display" else args.natural_px_per_pt
        width = min(w_pt * k, cap)
        how = "D4 2 px/pt" if mode == "html-display" else "natural 4/3 px/pt"
        capped = " (column cap)" if w_pt * k > cap else ""
        return path, width, f"SVG {how}: {w_pt:.0f} pt -> {width:.0f} px{capped}"
    if rec.get("png"):
        path = folder / rec["png"]
        px_w, _ = figtools.png_size_px(path)
        attr = rec.get("html_width") or px_w / 2
        width = min(attr, cap)
        capped = " (column cap)" if attr > cap else ""
        return path, width, f"PNG as served: width attr {attr:.0f} -> {width:.0f} px{capped}"
    return None


def make_tiles(sides, args, out: Path) -> dict:
    """tiles[side][mode][stem] = {"path", "desc"}; also gray and deutan copies."""
    from PIL import Image, ImageOps

    tiles: dict = {}
    chrome = None
    need_chrome = any(("html-display" in args.modes or "html-natural" in args.modes)
                      and any(r.get("svg") or r.get("png") for r in man.values())
                      for _, _, man in sides)
    if need_chrome:
        chrome = figtools.Chrome(dsf=args.dsf)
    try:
        for side, folder, man in sides:
            tiles[side] = {}
            for mode in args.modes:
                tdir = out / "tiles" / side / mode
                gdir = out / "tiles" / side / f"{mode}-gray"
                ddir = out / "tiles" / side / f"{mode}-deutan"
                for folder_ in (tdir, gdir, ddir):
                    folder_.mkdir(parents=True, exist_ok=True)
                tiles[side][mode], tiles[side][f"{mode}-gray"] = {}, {}
                tiles[side][f"{mode}-deutan"] = {}
                for stem, rec in man.items():
                    target = tdir / f"{stem}.png"
                    if mode == "print":
                        if not rec.get("pdf"):
                            continue
                        info = figtools.rasterize_pdf(folder / rec["pdf"], target, dpi=args.dpi,
                                                      print_block_mm=args.print_mm)
                        t = figtools.pdf_text_sizes(folder / rec["pdf"])
                        text = (f"; text min {t['min_pt_120mm']} / median {t['median_pt_120mm']} pt"
                                if t.get("n_spans") else "; no text")
                        desc = f"PDF at {info['print_width_in'] * 25.4:.0f} mm, {args.dpi:.0f} dpi{text}"
                    else:
                        spec = html_width(rec, folder, mode, args)
                        if spec is None:
                            continue
                        path, width, desc = spec
                        chrome.rasterize(path, width, target)
                    with Image.open(target) as im:
                        ImageOps.grayscale(im.convert("RGB")).save(gdir / f"{stem}.png")
                        deutan(im).save(ddir / f"{stem}.png")
                    tiles[side][mode][stem] = {"path": str(target), "desc": desc}
                    tiles[side][f"{mode}-gray"][stem] = {"path": str(gdir / f"{stem}.png"),
                                                         "desc": desc + "; grayscale"}
                    tiles[side][f"{mode}-deutan"][stem] = {
                        "path": str(ddir / f"{stem}.png"),
                        "desc": desc + "; deuteranopia (Machado 2009, severity 1.0)"}
    finally:
        if chrome:
            chrome.close()
    return tiles


def compose(mode: str, stems: list[str], sides, tiles, labels, out: Path, args) -> list[str]:
    from PIL import Image, ImageDraw

    f_head, f_small = font(18), font(13)
    pad, gap, head_h, line_h = 16, 24, 30, 17
    names = [s for s, _, _ in sides]
    sheets = []
    for start in range(0, len(stems), args.rows_per_sheet):
        chunk = stems[start:start + args.rows_per_sheet]
        col_w = []
        for side in names:
            ws = [Image.open(tiles[side][mode][s]["path"]).size[0]
                  for s in chunk if s in tiles[side].get(mode, {})]
            col_w.append(max(ws + [260]))
        captions: dict[tuple[str, str], list[str]] = {}
        rows = []
        for s in chunk:
            hs, n_lines = [], 1
            for side, cw in zip(names, col_w):
                cell = tiles[side].get(mode, {}).get(s)
                text = f"{side}: " + (cell["desc"] if cell else "(absent)")
                captions[(side, s)] = wrap(text, f_small, cw)
                n_lines = max(n_lines, len(captions[(side, s)]))
                if cell:
                    hs.append(Image.open(cell["path"]).size[1])
            rows.append((max(hs + [60]), n_lines * line_h + 6))
        title_h = 40
        width = pad * 2 + sum(col_w) + gap * (len(names) - 1)
        height = title_h + sum(head_h + desc_h + h + pad for h, desc_h in rows) + pad
        sheet = Image.new("RGB", (int(width), int(height)), "white")
        draw = ImageDraw.Draw(sheet)
        title = f"{args.title}  |  {mode}  |  " + "  vs  ".join(names)
        draw.text((pad, 10), title, fill="#1A1A1A", font=f_head)
        y = title_h
        for s, (h, desc_h) in zip(chunk, rows):
            draw.line([(pad, y), (width - pad, y)], fill="#BBBBBB", width=1)
            draw.text((pad, y + 6), f"{s}   {labels.get(s, '')}", fill="#1A1A1A", font=f_head)
            x = pad
            for side, cw in zip(names, col_w):
                cell = tiles[side].get(mode, {}).get(s)
                for i, text in enumerate(captions[(side, s)]):
                    draw.text((x, y + head_h + i * line_h), text, fill="#4D4D4D", font=f_small)
                ty = y + head_h + desc_h
                if cell:
                    with Image.open(cell["path"]) as im:
                        im = im.convert("RGB")
                        sheet.paste(im, (x, ty))
                        draw.rectangle([x - 1, ty - 1, x + im.size[0], ty + im.size[1]], outline="#DDDDDD")
                else:
                    draw.rectangle([x, ty, x + 240, ty + 50], outline="#DDDDDD")
                    draw.text((x + 10, ty + 16), "(absent)", fill="#4D4D4D", font=f_small)
                x += cw + gap
            y += head_h + desc_h + h + pad
        path = out / "sheets" / f"{mode}-{start // args.rows_per_sheet + 1:02d}.png"
        path.parent.mkdir(parents=True, exist_ok=True)
        sheet.save(path, optimize=True)
        sheets.append(str(path))
    return sheets


def text_report(sides, out: Path) -> list[dict]:
    rows = []
    for side, folder, man in sides:
        for stem, rec in man.items():
            if not rec.get("pdf"):
                continue
            t = figtools.pdf_text_sizes(folder / rec["pdf"])
            rows.append({
                "side": side, "stem": stem, "label": rec.get("label", ""),
                "width_in": t["width_in"], "print_width_mm": t["print_width_mm"],
                "scale_120mm": t["scale_120mm"], "n_spans": t["n_spans"],
                "min_pt": t.get("min_pt", ""), "median_pt": t.get("median_pt", ""),
                "min_pt_120mm": t.get("min_pt_120mm", ""), "p10_pt_120mm": t.get("p10_pt_120mm", ""),
                "median_pt_120mm": t.get("median_pt_120mm", ""), "min_pt_6p8in": t.get("min_pt_6p8in", ""),
                "smallest_spans": " | ".join(t.get("smallest", [])),
                "fonts": " ".join(figtools.pdf_fonts(folder / rec["pdf"])),
            })
    with open(out / "text_sizes.csv", "w", newline="", encoding="utf-8") as fh:
        if rows:
            w = csv.DictWriter(fh, fieldnames=list(rows[0]))
            w.writeheader()
            w.writerows(rows)
    (out / "text_sizes.json").write_text(json.dumps(rows, indent=1) + "\n", encoding="utf-8")
    return rows


def cmd_sheet(args) -> int:
    if len(args.dirs) > 2:
        raise SystemExit("give one or two figure folders")
    args.modes = [m for m in args.modes.split(",") if m]
    bad = [m for m in args.modes if m not in MODES]
    if bad:
        raise SystemExit(f"unknown modes {bad}")
    names = (args.names.split(",") if args.names else
             (["before", "after"] if len(args.dirs) == 2 else [args.dirs[0].name]))
    if len(names) != len(args.dirs):
        raise SystemExit("--names must name every folder")
    t0 = time.time()
    only = set(args.only.split(",")) if args.only else None
    sides = []
    for name, folder in zip(names, args.dirs):
        man = figtools.load_manifest(folder)
        if only:
            man = {k: v for k, v in man.items() if k in only}
        sides.append((name, folder.resolve(), man))
    stems: list[str] = []
    for _, _, man in sides:
        for s in man:
            if s not in stems:
                stems.append(s)
    labels = {}
    for _, _, man in sides:
        for s, r in man.items():
            if r.get("label"):
                labels.setdefault(s, r["label"])
    out = args.out.resolve()
    out.mkdir(parents=True, exist_ok=True)
    tiles = make_tiles(sides, args, out)
    t_tiles = time.time() - t0
    sheet_modes = (list(args.modes) + ([] if args.no_gray else [f"{m}-gray" for m in args.modes])
                   + ([] if args.no_deutan else [f"{m}-deutan" for m in args.modes]))
    sheets = {m: compose(m, stems, sides, tiles, labels, out, args) for m in sheet_modes}
    rows = text_report(sides, out)
    index = {"sides": [{"name": n, "folder": str(f), "figures": len(m)} for n, f, m in sides],
             "stems": stems, "sheets": sheets, "tiles": tiles, "text_sizes": str(out / "text_sizes.csv"),
             "settings": {"px_per_pt": args.px_per_pt, "natural_px_per_pt": args.natural_px_per_pt,
                          "column_px": args.column_px, "dsf": args.dsf, "print_mm": args.print_mm,
                          "dpi": args.dpi},
             "seconds": {"tiles": round(t_tiles, 1), "total": round(time.time() - t0, 1)}}
    (out / "index.json").write_text(json.dumps(index, indent=1) + "\n", encoding="utf-8")
    print(f"{len(stems)} stems x {len(sides)} sides; tiles {t_tiles:.1f} s, total {time.time() - t0:.1f} s")
    for m, paths in sheets.items():
        print(f"  {m}: " + ", ".join(Path(p).name for p in paths))
    print("  text sizes at 120 mm (min / median pt):")
    for r in rows:
        print(f"    {r['side']:>8} {r['stem']}: {r['min_pt_120mm']} / {r['median_pt_120mm']}"
              f"  (authored {r['min_pt']} / {r['median_pt']} pt, {r['width_in']} in wide)")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="command", required=True)

    fz = sub.add_parser("freeze", help="collect a page's freeze figures into a figure folder")
    fz.add_argument("--clone", type=Path, default=ROOT, help="checkout to read (default: this repository)")
    fz.add_argument("--page", required=True, help="page path relative to the clone")
    fz.add_argument("--out", required=True, type=Path)
    fz.add_argument("--rev", default="HEAD", help="git revision of the freeze, or WORKTREE")
    fz.set_defaults(func=cmd_freeze)

    sh = sub.add_parser("sheet", help="draw tiles and contact sheets for one or two figure folders")
    sh.add_argument("dirs", nargs="+", type=Path, help="one figure folder, or two (before after)")
    sh.add_argument("--out", required=True, type=Path)
    sh.add_argument("--names", help="comma-separated side names (default: before,after or the folder name)")
    sh.add_argument("--title", default="dl-book figures")
    sh.add_argument("--modes", default=",".join(MODES), help=f"subset of {','.join(MODES)}")
    sh.add_argument("--no-gray", action="store_true", help="skip the grayscale sheets (gray tiles are still written)")
    sh.add_argument("--no-deutan", action="store_true",
                    help="skip the deuteranopia sheets (deutan tiles are still written)")
    sh.add_argument("--px-per-pt", type=float, default=2.0, help="html-display CSS px per pt (ruling D4: 2)")
    sh.add_argument("--natural-px-per-pt", type=float, default=4 / 3)
    sh.add_argument("--column-px", type=float, default=figtools.COLUMN_PX, help="column cap in CSS px (0: none)")
    sh.add_argument("--dsf", type=float, default=1.0, help="Chrome device scale factor for HTML tiles")
    sh.add_argument("--print-mm", type=float, default=figtools.PRINT_WIDTH_MM)
    sh.add_argument("--dpi", type=float, default=200.0, help="print tile resolution")
    sh.add_argument("--rows-per-sheet", type=int, default=12)
    sh.add_argument("--only", help="comma-separated stems to include")
    sh.set_defaults(func=cmd_sheet)

    args = ap.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
