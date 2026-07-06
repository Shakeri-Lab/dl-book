#!/usr/bin/env bash
# First-pass mechanical conversion of a course LaTeX seed file to markdown.
# Output is a DRAFT INPUT for the AI restructure session — never ship it directly.
#
# Usage: scripts/tex2qmd.sh sources/1_1_lin_Recap.tex drafts/part1/01-raw.md
set -euo pipefail

SRC="$1"
OUT="$2"
QUARTO_BIN="${QUARTO_BIN:-$HOME/.local/bin/quarto}"
TMP=$(mktemp -d)

mkdir -p "$(dirname "$OUT")"

# 1. Extract tikzpicture blocks into figures/tikz-src/ before pandoc drops them.
python3 - "$SRC" "$TMP/stripped.tex" <<'PY'
import re, sys, pathlib
src, out = sys.argv[1], sys.argv[2]
text = pathlib.Path(src).read_text(errors="replace")
base = pathlib.Path(src).stem.replace(" ", "_")
figdir = pathlib.Path("figures/tikz-src")
figdir.mkdir(parents=True, exist_ok=True)
blocks = re.findall(r"\\begin\{tikzpicture\}.*?\\end\{tikzpicture\}", text, re.S)
for i, b in enumerate(blocks, 1):
    (figdir / f"{base}-fig{i:02d}.tex").write_text(b + "\n")
    text = text.replace(b, f"\n\\textbf{{[TIKZ FIGURE {base}-fig{i:02d} -- see figures/tikz-src/]}}\n", 1)
print(f"extracted {len(blocks)} tikz blocks")
pathlib.Path(out).write_text(text)
PY

# 2. Strip document preamble if present (keep body only), prepend canonical macros
#    plus any \newcommand/\DeclareMathOperator the seed defines locally.
python3 - "$TMP/stripped.tex" "$TMP/body.tex" <<'PY'
import sys, pathlib, re
text = pathlib.Path(sys.argv[1]).read_text(errors="replace")
m = re.search(r"\\begin\{document\}(.*)\\end\{document\}", text, re.S)
body = m.group(1) if m else text
preamble = text[: m.start()] if m else ""
local = "\n".join(
    ln for ln in preamble.splitlines()
    if re.match(r"\s*\\(newcommand|renewcommand|DeclareMathOperator)", ln)
)
macros = pathlib.Path("tex/macros.tex").read_text()
# canonical first, seed-local second (seed may shadow; pandoc takes the last def)
pathlib.Path(sys.argv[2]).write_text(macros + "\n" + local + "\n" + body)
PY

# 3. Pandoc: latex -> markdown (Quarto's bundled pandoc).
"$QUARTO_BIN" pandoc -f latex+raw_tex -t markdown-raw_html --wrap=none \
  --markdown-headings=atx "$TMP/body.tex" -o "$OUT"

rm -rf "$TMP"
echo "wrote $OUT"
