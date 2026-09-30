#!/usr/bin/env python3
"""Real-page check: Plan -> Code panels show their evidence with the code closed.

Loads every built page that has a Plan -> Code panel in headless Chromium, at each
requested width, and asserts with every panel in its initial, collapsed state that

  - every figure and rendered results table produced inside a panel is visible and has
    non-zero rendered size (an image must also have decoded: naturalWidth > 0);
  - the source of the cell that produced it is clipped out of view, and no printed
    text output (stdout, stderr) is visible;
  - the page itself does not scroll sideways;
  - the browser measured exactly as many evidence outputs as the HTML contains, so a
    probe that silently finds nothing fails.

No browser automation library is needed: each page is copied with a <base href> to its
own directory (or to the live site with --site), a small probe script is appended, and
Chrome's --dump-dom returns the probe's measurements.

    python scripts/audit_panel_evidence.py _book
    python scripts/audit_panel_evidence.py _book --site https://shakeri-lab.github.io/dl-book/
    python scripts/audit_panel_evidence.py _book --json build/panel-evidence.json

The browser is --chrome, else $CHROME_BIN, else the first of google-chrome,
google-chrome-stable, chromium, chromium-browser or chrome-headless-shell on PATH, the
macOS Google Chrome app, or a Playwright chrome-headless-shell. Without one the audit
fails (exit 2) rather than passing silently.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import glob
import html
import json
import os
import platform
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

from bs4 import BeautifulSoup

EVIDENCE = ".quarto-figure, figure, img, svg, canvas, table"
DEFAULT_WIDTHS = (1280, 375)
HEIGHT = 900

PROBE = """
<script>
window.addEventListener("load", () => setTimeout(async () => {
  const out = { vw: innerWidth, docW: document.documentElement.scrollWidth, items: [], errors: [] };
  try {
    const images = [...document.querySelectorAll(".plan-code img")];
    images.forEach((image) => { image.loading = "eager"; });
    await Promise.all(images.map((image) => (image.complete && image.naturalWidth) ? 0 :
      new Promise((done) => {
        image.addEventListener("load", done, { once: true });
        image.addEventListener("error", done, { once: true });
        setTimeout(done, 10000);
      })));
    await new Promise((done) => setTimeout(done, 600));
    const seen = (element) => element.checkVisibility
      ? element.checkVisibility({ checkVisibilityCSS: true, contentVisibilityAuto: true })
      : element.getClientRects().length > 0;
    for (const panel of document.querySelectorAll(".plan-code")) {
      const collapsed = panel.classList.contains("plan-code-code-collapsed");
      if (!collapsed) out.errors.push(`panel ${panel.id || "(no id)"} is not collapsed at load`);
      for (const output of panel.querySelectorAll(".cell-output")) {
        if (!output.querySelector(%(evidence)s)) continue;
        const target = output.querySelector("img, svg, canvas, table") || output;
        const box = target.getBoundingClientRect();
        const figure = output.querySelector(".quarto-figure");
        const cell = output.closest(".cell");
        const code = cell ? [...cell.querySelectorAll(":scope > .code-copy-outer-scaffold")] : [];
        out.items.push({
          id: (figure && figure.id) || output.id || "(no id)",
          kind: target.tagName.toLowerCase(),
          width: Math.round(box.width), height: Math.round(box.height),
          visible: seen(target), decoded: target.tagName !== "IMG" || target.naturalWidth > 0,
          collapsed, codeHidden: code.every((node) => node.getBoundingClientRect().width <= 1 || !seen(node)),
        });
      }
      for (const text of panel.querySelectorAll(".cell-output-stdout, .cell-output-stderr")) {
        if (collapsed && text.getBoundingClientRect().width > 1 && seen(text)) {
          out.errors.push(`printed text ${text.id || "(no id)"} is visible while the code is closed`);
        }
      }
    }
  } catch (error) { out.errors.push(String(error)); }
  const pre = document.createElement("pre");
  pre.id = "panel-evidence-probe";
  pre.textContent = JSON.stringify(out);
  document.body.appendChild(pre);
}, 300));
</script>
""" % {"evidence": json.dumps(EVIDENCE)}


def find_chrome(explicit: str | None) -> tuple[str, bool]:
    """Return (binary, is_headless_shell).

    chrome-headless-shell comes first: full Chrome's headless mode will not open a
    window narrower than 500 px, so it cannot measure a 375 px phone.
    """
    candidates = [explicit, os.environ.get("CHROME_BIN"), shutil.which("chrome-headless-shell")]
    for pattern in ("~/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell",
                    "~/.cache/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell",
                    "~/.cache/puppeteer/chrome-headless-shell/*/chrome-headless-shell-*/chrome-headless-shell",
                    "~/chrome-headless-shell/chrome-headless-shell/*/chrome-headless-shell-*/chrome-headless-shell"):
        candidates += sorted(glob.glob(os.path.expanduser(pattern)), reverse=True)
    candidates += [shutil.which(name) for name in (
        "google-chrome", "google-chrome-stable", "chromium", "chromium-browser")]
    candidates.append("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
    for candidate in candidates:
        if candidate and Path(candidate).is_file() and os.access(candidate, os.X_OK):
            return candidate, "headless-shell" in Path(candidate).name
    sys.exit("audit_panel_evidence: no Chrome or Chromium found; pass --chrome or set CHROME_BIN")


def pages_with_panels(book: Path) -> dict[str, int]:
    """Relative page path -> number of evidence outputs inside Plan -> Code panels."""
    pages = {}
    for page in sorted((book / "chapters").rglob("*.html")):
        text = page.read_text(encoding="utf-8")
        if 'class="plan-code' not in text:
            continue
        soup = BeautifulSoup(text, "html.parser")
        count = sum(1 for panel in soup.select("div.plan-code")
                    for output in panel.select(".cell-output") if output.select_one(EVIDENCE))
        pages[page.relative_to(book).as_posix()] = count
    return pages


def probe(chrome: str, shell: bool, source_html: str, base: str, width: int, workdir: Path) -> dict:
    page = re.sub(r"<head([^>]*)>", lambda m: f'<head{m.group(1)}><base href="{html.escape(base)}">',
                  source_html, count=1)
    page = page.replace("</body>", PROBE + "</body>", 1)
    handle, name = tempfile.mkstemp(suffix=".html", dir=workdir)
    with os.fdopen(handle, "w", encoding="utf-8") as stream:
        stream.write(page)
    command = [chrome, "--headless" if shell else "--headless=new", "--disable-gpu",
               "--hide-scrollbars", "--allow-file-access-from-files", "--no-first-run",
               f"--window-size={width},{HEIGHT}", "--virtual-time-budget=30000", "--dump-dom",
               Path(name).as_uri()]
    if platform.system() == "Linux":
        command.insert(1, "--no-sandbox")  # Ubuntu 24.04 runners restrict user namespaces
    result = subprocess.run(command, capture_output=True, text=True, timeout=180)
    match = re.search(r'<pre id="panel-evidence-probe">(.*?)</pre>', result.stdout, re.S)
    if not match:
        return {"errors": [f"probe did not report (exit {result.returncode}): {result.stderr.strip()[-300:]}"],
                "items": [], "vw": None, "docW": None}
    return json.loads(html.unescape(match.group(1)))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("book", type=Path, help="rendered book directory, e.g. _book")
    parser.add_argument("--site", help="check the live site at this URL instead of the local files")
    parser.add_argument("--width", type=int, action="append", help="viewport width (repeatable)")
    parser.add_argument("--chrome", help="Chrome or Chromium binary")
    parser.add_argument("--json", type=Path, help="write every measurement to this file")
    parser.add_argument("--jobs", type=int, default=4)
    args = parser.parse_args()
    widths = args.width or list(DEFAULT_WIDTHS)
    chrome, shell = find_chrome(args.chrome)
    pages = pages_with_panels(args.book)
    if not pages:
        print("audit_panel_evidence: no Plan -> Code panels found", file=sys.stderr)
        return 1

    def fetch(relative: str) -> tuple[str, str]:
        if args.site:
            url = args.site.rstrip("/") + "/" + relative
            with urllib.request.urlopen(url, timeout=60) as response:
                return response.read().decode("utf-8"), url.rsplit("/", 1)[0] + "/"
        page = (args.book / relative).resolve()
        return page.read_text(encoding="utf-8"), page.parent.as_uri() + "/"

    errors, record = [], {"chrome": chrome, "site": args.site, "widths": widths, "pages": {}}
    with tempfile.TemporaryDirectory(prefix="panel-evidence-") as tmp:
        sources = {relative: fetch(relative) for relative in pages}
        jobs = [(relative, width) for relative in pages for width in widths]
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.jobs) as pool:
            futures = {pool.submit(probe, chrome, shell, *sources[r], w, Path(tmp)): (r, w) for r, w in jobs}
            results = {futures[f]: f.result() for f in concurrent.futures.as_completed(futures)}
    total = 0
    for relative in pages:
        for width in widths:
            result = results[(relative, width)]
            where = f"{relative} @ {width}px"
            record["pages"].setdefault(relative, {})[str(width)] = result
            errors += [f"{where}: {message}" for message in result["errors"]]
            if result["vw"] is not None and result["vw"] != width:
                errors.append(f"{where}: the browser measured a {result['vw']}px viewport, not {width}px "
                              "(full Chrome will not go below 500 px; use chrome-headless-shell)")
            if result["docW"] is not None and result["vw"] is not None and result["docW"] > result["vw"]:
                errors.append(f"{where}: the page scrolls sideways ({result['docW']}px > {result['vw']}px)")
            items = result["items"]
            if len(items) != pages[relative]:
                errors.append(f"{where}: measured {len(items)} evidence outputs, the HTML has {pages[relative]}")
            for item in items:
                problems = [label for label, bad in (
                    ("zero size", item["width"] <= 0 or item["height"] <= 0),
                    ("not visible", not item["visible"]), ("image did not decode", not item["decoded"]),
                    ("panel open", not item["collapsed"]), ("source not hidden", not item["codeHidden"]),
                ) if bad]
                if problems:
                    errors.append(f"{where}: {item['id']} ({item['kind']}): {', '.join(problems)}")
            total += len(items)
            sizes = ", ".join(f"{i['id']} {i['width']}x{i['height']}" for i in items)
            print(f"{where} (viewport {result['vw']}px): {len(items)} evidence output(s): {sizes}")
    if args.json:
        args.json.parent.mkdir(parents=True, exist_ok=True)
        args.json.write_text(json.dumps(record, indent=1), encoding="utf-8")
    if errors:
        print("\n".join(errors), file=sys.stderr)
        print(f"FAILED: {len(errors)} panel-evidence violation(s)", file=sys.stderr)
        return 1
    count = sum(pages.values())
    print(f"PASS: {count} evidence output(s) in Plan -> Code panels on {len(pages)} page(s) are visible "
          f"with non-zero size and their code closed, at {', '.join(f'{w}px' for w in widths)} "
          f"({total} measurements; {Path(chrome).name}{'; ' + args.site if args.site else ''})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
