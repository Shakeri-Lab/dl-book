#!/usr/bin/env bash
# Render figures/tikz-src/*.tex (bare tikzpicture blocks) to SVG in figures/generated/.
# Requires tinytex (quarto install tinytex) + poppler (brew install poppler).
#
# Usage: scripts/build_tikz.sh [name-filter]
set -euo pipefail

FILTER="${1:-}"
TEXBIN="$HOME/Library/TinyTeX/bin/universal-darwin"
export PATH="$TEXBIN:/opt/homebrew/bin:$PATH"

mkdir -p figures/generated
TMP=$(mktemp -d)

for f in figures/tikz-src/*.tex; do
  name=$(basename "$f" .tex)
  [[ -n "$FILTER" && "$name" != *"$FILTER"* ]] && continue
  # Extract bare tikzpicture block(s) — sources may be full documents.
  python3 - "$f" "$TMP/$name-body.tex" <<'PY'
import re, sys, pathlib
text = pathlib.Path(sys.argv[1]).read_text(errors="replace")
blocks = re.findall(r"\\begin\{tikzpicture\}.*?\\end\{tikzpicture\}", text, re.S)
pathlib.Path(sys.argv[2]).write_text("\n".join(blocks) if blocks else text)
PY
  cat > "$TMP/$name.tex" <<WRAP
\\documentclass[tikz,border=4pt]{standalone}
\\input{$(pwd)/tex/macros.tex}
\\usetikzlibrary{arrows.meta, chains, positioning, shapes.symbols, shapes.geometric, shadows, calc, backgrounds, fit, decorations.pathreplacing}
\\begin{document}
\\input{$TMP/$name-body.tex}
\\end{document}
WRAP
  (cd "$TMP" && latexmk -pdf -interaction=nonstopmode -quiet "$name.tex" >/dev/null)
  pdftocairo -svg "$TMP/$name.pdf" "figures/generated/$name.svg"
  cp "$TMP/$name.pdf" "figures/generated/$name.pdf"   # PDF sibling for the LaTeX book path
  echo "✓ $name.svg (+ .pdf)"
done
rm -rf "$TMP"
