#!/usr/bin/env python3
"""The figure-file ledger: which freeze figure files a render changed, and pruning.

The bookkeeping tool of the figure pipeline (press W2 phase 2, plan section I).

  figure_ledger.py prune QMD [QMD ...] | --all  [--dry-run] [--keep-book]
  figure_ledger.py record QMD [QMD ...] [--base REV] [--html-pixels]
  figure_ledger.py report [--csv PATH]

prune   Quarto's freezer copies a page's figure folders into _freeze without deleting
        anything, so a re-executed page keeps its old files beside the new ones (a PNG
        beside the SVG that replaced it, a renamed figure's old file). For each page,
        every file in _freeze/<page>/figure-html that html.json does not name, and in
        _freeze/<page>/figure-pdf that tex.json does not name, is removed with `git rm`
        (or deleted, when untracked). Stale files in the transient <stem>_files/figure-html
        and <stem>_files/figure-pdf beside the page, and in _book/<page dir>/<stem>_files/
        figure-html (unless --keep-book), go too; otherwise the next render copies them
        back or ships them. The gitignored figure-latex folders are left alone.
        scripts/audit_book_contract.py fails on any file this would remove.
record  For each page, compares the figure files the freeze named at --base (read with
        `git show`, with their committed bytes) with the ones it names now, pairing them
        by Quarto's stem (<label>-output-N). One row per figure file and format:
          identical      same bytes
          metadata-only  same drawing; only a date, a PDF offset table or an SVG date moved
          format         same stem, another file type (the PNG -> SVG switch)
          redrawn        same type, a different drawing
          new            named now, not at --base
          removed        named at --base, not now
          removed-orphan in the freeze folder at --base, named by no freeze JSON, gone now
        with sha256 and bytes on both sides, the gzipped size of an SVG, and a pixel
        metric (the share of pixels that differ by more than 8/255 when both files are
        rasterized at the same size: PDFs with PyMuPDF; the HTML files with headless
        Chrome only under --html-pixels). Rows replace the page's earlier rows in
        audits/press/w2p2/figure_files.csv. The ids of the page's figure-code receipts
        (audits/press/edits/<stem>.json edits with "kind": "figure-code" whose
        "figures" name the figure) go in each row, and each such receipt's
        "files_changed" lists the freeze files of its figures that changed.
report  Counts by class, per page and in all, plus SVG sizes, from the CSV.
"""

from __future__ import annotations

import argparse
import csv
import gzip
import hashlib
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
FREEZE = ROOT / "_freeze"
LEDGER = ROOT / "audits/press/w2p2/figure_files.csv"
EDITS = ROOT / "audits/press/edits"
KINDS = (("figure-html", "html"), ("figure-pdf", "tex"))
IMAGE_RE = re.compile(r"\]\(([^()\s]+)\)(\{[^}]*\})?")  # "](" so caption brackets never end it
FIELDS = ["page", "kind", "stem", "label", "class", "before_file", "before_bytes",
          "before_sha256", "after_file", "after_bytes", "after_sha256", "svg_gzip_bytes",
          "pixel_diff", "receipts"]


def git(*args: str, check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(["git", "-C", str(ROOT), *args], capture_output=True, check=check)


def unit_of(qmd: str | Path) -> Path:
    """The page's freeze folder, relative to the repository root."""
    rel = Path(qmd)
    if rel.is_absolute():
        rel = rel.resolve().relative_to(ROOT)
    if rel.suffix != ".qmd":
        raise SystemExit(f"{qmd}: not a .qmd page")
    return Path("_freeze") / rel.with_suffix("")


def page_of(unit: Path) -> str:
    return unit.relative_to("_freeze").with_suffix(".qmd").as_posix()


def named_files(markdown: str, kind: str) -> dict[str, str | None]:
    """{file name: figure label or None} for the `<stem>_files/<kind>/` images a freeze names."""
    names: dict[str, str | None] = {}
    for m in IMAGE_RE.finditer(markdown):
        target, attrs = m.group(1), m.group(2) or ""
        if f"_files/{kind}/" not in target:
            continue
        ident = re.search(r"#([\w:.-]+)", attrs)
        names[target.rsplit("/", 1)[-1]] = ident.group(1) if ident else None
    return names


def freeze_names(unit: Path, fmt: str, kind: str, rev: str | None = None) -> dict[str, str | None] | None:
    rel = unit / "execute-results" / f"{fmt}.json"
    if rev:
        res = git("show", f"{rev}:{rel.as_posix()}", check=False)
        if res.returncode != 0:
            return None
        raw = res.stdout.decode("utf-8")
    else:
        path = ROOT / rel
        if not path.is_file():
            return None
        raw = path.read_text(encoding="utf-8")
    return named_files(json.loads(raw)["result"]["markdown"], kind)


def tracked(path: Path) -> bool:
    return git("ls-files", "--error-unmatch", "--", path.as_posix(), check=False).returncode == 0


def all_units() -> list[Path]:
    return sorted(p.parent.parent.relative_to(ROOT) for p in FREEZE.glob("**/execute-results/html.json"))


# ----------------------------------------------------------------------------- prune
def prune_unit(unit: Path, dry_run: bool, keep_book: bool) -> list[str]:
    actions: list[str] = []
    page = ROOT / page_of(unit)
    stem = page.stem
    for kind, fmt in KINDS:
        names = freeze_names(unit, fmt, kind)
        if names is None:
            continue
        folders = [(ROOT / unit / kind, True), (page.parent / f"{stem}_files" / kind, False)]
        if kind == "figure-html" and not keep_book:
            folders.append((ROOT / "_book" / page.parent.relative_to(ROOT) / f"{stem}_files" / kind, False))
        for folder, is_freeze in folders:
            if not folder.is_dir():
                continue
            for path in sorted(folder.iterdir()):
                if not path.is_file() or path.name in names:
                    continue
                rel = path.relative_to(ROOT)
                if is_freeze and tracked(rel):
                    actions.append(f"git rm {rel}")
                    if not dry_run:
                        git("rm", "-q", "--", rel.as_posix())
                else:
                    actions.append(f"rm {rel}")
                    if not dry_run:
                        path.unlink()
    return actions


def cmd_prune(args) -> int:
    units = all_units() if args.all else [unit_of(q) for q in args.qmd]
    if not units:
        raise SystemExit("give one or more .qmd pages, or --all")
    total = 0
    for unit in units:
        if not (ROOT / unit).is_dir():
            print(f"{page_of(unit)}: no freeze folder")
            continue
        actions = prune_unit(unit, args.dry_run, args.keep_book)
        total += len(actions)
        for action in actions:
            print(("would " if args.dry_run else "") + action)
    print(f"prune: {total} stale figure file(s) {'found' if args.dry_run else 'removed'} "
          f"across {len(units)} page(s)")
    return 0


# ----------------------------------------------------------------------------- record
def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def masked(data: bytes, suffix: str) -> bytes:
    if suffix == ".pdf":
        data = re.sub(rb"/CreationDate \(D:[^)]*\)", b"/CreationDate ()", data)
        data = re.sub(rb"/ModDate \(D:[^)]*\)", b"/ModDate ()", data)
        data = re.sub(rb"\nxref\n.*?trailer", b"\nxref trailer", data, flags=re.S)
        return re.sub(rb"startxref\n\d+", b"startxref", data)
    if suffix == ".svg":
        return re.sub(rb"<dc:date>[^<]*</dc:date>", b"<dc:date></dc:date>", data)
    return data


def raster_pdf(data: bytes, width_px: int):
    import pymupdf
    from PIL import Image

    with pymupdf.open(stream=data, filetype="pdf") as doc:
        page = doc[0]
        zoom = width_px / page.rect.width
        pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False)
        return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


def raster_html(chrome, data: bytes, suffix: str, width_px: int):
    from PIL import Image

    with tempfile.TemporaryDirectory(prefix="dlbook-ledger-") as tmp:
        src = Path(tmp) / f"figure{suffix}"
        src.write_bytes(data)
        out = Path(tmp) / "shot.png"
        chrome.rasterize(src, width_px, out)
        with Image.open(out) as im:
            return im.convert("RGB")


def pixel_diff(a, b) -> str:
    """Share of pixels differing by more than 8/255 in any channel, at a common size."""
    from PIL import ImageChops

    note = ""
    if a.size != b.size:
        note = f" (sizes {a.size[0]}x{a.size[1]} vs {b.size[0]}x{b.size[1]}; resampled)"
        b = b.resize(a.size)
    diff = ImageChops.difference(a, b).convert("L").point(lambda v: 255 if v > 8 else 0)
    changed = sum(diff.histogram()[255:])
    return f"{changed / (a.size[0] * a.size[1]):.4f}{note}"


def receipt_ids(page: str) -> tuple[Path, dict | None, dict[str, list[str]]]:
    """(receipt path, receipt JSON, {figure label: [figure-code receipt ids]})."""
    path = EDITS / f"{Path(page).stem}.json"
    if not path.is_file():
        return path, None, {}
    data = json.loads(path.read_text(encoding="utf-8"))
    by_label: dict[str, list[str]] = {}
    for edit in data.get("edits", []):
        if edit.get("kind") == "figure-code":
            for label in edit.get("figures", []):
                by_label.setdefault(label, []).append(edit["id"])
    return path, data, by_label


def record_unit(unit: Path, base: str, chrome) -> list[dict]:
    page = page_of(unit)
    _, _, by_label = receipt_ids(page)
    rows = []
    for kind, fmt in KINDS:
        before = freeze_names(unit, fmt, kind, base) or {}
        after = freeze_names(unit, fmt, kind) or {}
        listed = git("ls-tree", "--name-only", f"{base}:{(unit / kind).as_posix()}", check=False)
        base_files = set(listed.stdout.decode().split()) if listed.returncode == 0 else set()
        orphans = {name: None for name in base_files - set(before)}
        stems: dict[str, dict] = {}
        for name, label in {**orphans, **before}.items():
            stems.setdefault(name.rsplit(".", 1)[0], {})["before"] = (name, label)
        for name, label in after.items():
            stems.setdefault(name.rsplit(".", 1)[0], {})["after"] = (name, label)
        for stem, sides in sorted(stems.items()):
            row = {k: "" for k in FIELDS}
            row.update({"page": page, "kind": kind, "stem": stem})
            b_name, b_label = sides.get("before", (None, None))
            a_name, a_label = sides.get("after", (None, None))
            label = a_label or b_label or stem.rsplit("-output-", 1)[0]
            row["label"] = label
            b_data = a_data = None
            if b_name:
                res = git("show", f"{base}:{(unit / kind / b_name).as_posix()}", check=False)
                b_data = res.stdout if res.returncode == 0 else None
                row["before_file"] = (unit / kind / b_name).as_posix()
                if b_data is not None:
                    row["before_bytes"], row["before_sha256"] = len(b_data), sha(b_data)
            if a_name:
                path = ROOT / unit / kind / a_name
                a_data = path.read_bytes() if path.is_file() else None
                row["after_file"] = (unit / kind / a_name).as_posix()
                if a_data is not None:
                    row["after_bytes"], row["after_sha256"] = len(a_data), sha(a_data)
                    if a_name.endswith(".svg"):
                        row["svg_gzip_bytes"] = len(gzip.compress(a_data, 9, mtime=0))
            if b_name and not a_name:
                row["class"] = "removed-orphan" if b_name in orphans else "removed"
            elif a_name and not b_name:
                row["class"] = "new"
            elif b_data == a_data:
                row["class"] = "identical"
            elif Path(b_name).suffix != Path(a_name).suffix:
                row["class"] = "format"
            elif masked(b_data or b"", Path(a_name).suffix) == masked(a_data or b"", Path(a_name).suffix):
                row["class"] = "metadata-only"
            else:
                row["class"] = "redrawn"
            if b_data and a_data and row["class"] not in ("identical",):
                try:
                    if kind == "figure-pdf":
                        row["pixel_diff"] = pixel_diff(raster_pdf(b_data, 1000), raster_pdf(a_data, 1000))
                    elif chrome is not None:
                        width = 800
                        row["pixel_diff"] = pixel_diff(
                            raster_html(chrome, b_data, Path(b_name).suffix, width),
                            raster_html(chrome, a_data, Path(a_name).suffix, width))
                except Exception as exc:  # noqa: BLE001
                    row["pixel_diff"] = f"error: {type(exc).__name__}"
            row["receipts"] = " ".join(by_label.get(label, []))
            rows.append(row)
    return rows


def fill_receipts(page: str, rows: list[dict]) -> str | None:
    path, data, by_label = receipt_ids(page)
    if data is None or not by_label:
        return None
    changed_by_label: dict[str, list[str]] = {}
    for row in rows:
        if row["class"] != "identical":
            changed_by_label.setdefault(row["label"], []).append(row["after_file"] or row["before_file"])
    touched = False
    for edit in data.get("edits", []):
        if edit.get("kind") != "figure-code":
            continue
        files = sorted({f for label in edit.get("figures", []) for f in changed_by_label.get(label, [])})
        if edit.get("files_changed") != files:
            edit["files_changed"] = files
            touched = True
    if touched:
        path.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        return path.relative_to(ROOT).as_posix()
    return None


def read_ledger(path: Path) -> list[dict]:
    if not path.is_file():
        return []
    with path.open(newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def write_ledger(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rows = sorted(rows, key=lambda r: (r["page"], r["kind"], r["stem"]))
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=FIELDS, lineterminator="\n")
        writer.writeheader()
        writer.writerows({k: r.get(k, "") for k in FIELDS} for r in rows)


def cmd_record(args) -> int:
    if git("rev-parse", "--verify", f"{args.base}^{{commit}}", check=False).returncode:
        raise SystemExit(f"unknown base revision {args.base}")
    chrome = None
    if args.html_pixels:
        sys.path.insert(0, str(ROOT / "scripts"))
        import figure_workbench

        chrome = figure_workbench.Chrome()
    try:
        ledger = read_ledger(args.csv)
        for qmd in args.qmd:
            unit = unit_of(qmd)
            page = page_of(unit)
            rows = record_unit(unit, args.base, chrome)
            ledger = [r for r in ledger if r["page"] != page] + rows
            counts: dict[str, int] = {}
            for r in rows:
                counts[r["class"]] = counts.get(r["class"], 0) + 1
            receipt = fill_receipts(page, rows)
            print(f"{page} vs {args.base}: {len(rows)} file row(s) "
                  + ", ".join(f"{k} {v}" for k, v in sorted(counts.items()))
                  + (f"; files_changed written to {receipt}" if receipt else ""))
        write_ledger(args.csv, ledger)
    finally:
        if chrome is not None:
            chrome.close()
    print(f"ledger: {args.csv.relative_to(ROOT) if args.csv.is_relative_to(ROOT) else args.csv}")
    return 0


# ----------------------------------------------------------------------------- report
def cmd_report(args) -> int:
    rows = read_ledger(args.csv)
    if not rows:
        print(f"no ledger rows in {args.csv}")
        return 0
    by_page: dict[str, dict[str, int]] = {}
    totals: dict[str, int] = {}
    svg_raw = svg_gz = svg_n = 0
    for r in rows:
        by_page.setdefault(r["page"], {})
        by_page[r["page"]][r["class"]] = by_page[r["page"]].get(r["class"], 0) + 1
        totals[r["class"]] = totals.get(r["class"], 0) + 1
        if r["after_file"].endswith(".svg") and r["after_bytes"]:
            svg_n += 1
            svg_raw += int(r["after_bytes"])
            svg_gz += int(r["svg_gzip_bytes"] or 0)
    for page, counts in sorted(by_page.items()):
        print(f"{page}: " + ", ".join(f"{k} {v}" for k, v in sorted(counts.items())))
    print(f"all pages ({len(by_page)}): " + ", ".join(f"{k} {v}" for k, v in sorted(totals.items())))
    if svg_n:
        print(f"SVG: {svg_n} file(s), {svg_raw / 1024:.0f} KB raw, {svg_gz / 1024:.0f} KB gzipped")
        big = sorted((int(r["after_bytes"]), r["after_file"]) for r in rows
                     if r["after_file"].endswith(".svg") and r["after_bytes"])[-5:]
        for size, name in reversed(big):
            print(f"  largest: {name} {size / 1024:.0f} KB")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="command", required=True)
    pr = sub.add_parser("prune", help="remove freeze figure files no freeze JSON names")
    pr.add_argument("qmd", nargs="*", help="pages (.qmd) to prune")
    pr.add_argument("--all", action="store_true", help="prune every frozen page")
    pr.add_argument("--dry-run", action="store_true", help="list, do not remove")
    pr.add_argument("--keep-book", action="store_true", help="leave _book alone")
    pr.set_defaults(func=cmd_prune)
    rc = sub.add_parser("record", help="write the page's rows of the figure-file ledger")
    rc.add_argument("qmd", nargs="+", help="pages (.qmd) to record")
    rc.add_argument("--base", default="453ace7", help="revision the phase started from (default 453ace7)")
    rc.add_argument("--csv", type=Path, default=LEDGER)
    rc.add_argument("--html-pixels", action="store_true",
                    help="also compare the HTML files pixel by pixel in headless Chrome")
    rc.set_defaults(func=cmd_record)
    rp = sub.add_parser("report", help="counts for the gate report")
    rp.add_argument("--csv", type=Path, default=LEDGER)
    rp.set_defaults(func=cmd_report)
    args = ap.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
