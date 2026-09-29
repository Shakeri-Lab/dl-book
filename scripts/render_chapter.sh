#!/usr/bin/env bash
# Execute one page on the reference machine and refresh both of its freezes
# (html.json and tex.json) in one run, the way the figure pipeline needs it
# (press W2 phase 2, plan section D):
#
#   scripts/render_chapter.sh chapters/part2/08-cnn.qmd
#
# - Refuses a page that docs/locks.md lists.
# - Renders with no --to flag, so one run executes the page for HTML and for PDF;
#   a `--to html` render alone leaves tex.json stale. Measured on 08-cnn (September 29,
#   2026): this run takes about 15 min, 11 of them compiling the whole-book PDF; the
#   cheaper pair `--to html` then `--to latex` (about 8 min) is not equivalent, because
#   its tex.json names figure-latex/ files and leaves figure-pdf/ unrefreshed
#   (docs/compatibility.md). The book PDF it leaves in _book is deleted here.
# - SOURCE_DATE_EPOCH fixes the date matplotlib writes into each figure (the SVG
#   dc:date, the PDF CreationDate), so a re-render of unchanged code gives the same
#   bytes; --no-execute-daemon starts a fresh kernel that inherits this environment.
# - Prunes the freeze figure files the new freeze no longer names (Quarto copies
#   without deleting), records the page in the figure-file ledger, and runs the audits
#   that a page render can break, the page's figure-style loader, notebook asset and
#   rcParams checks among them (a loader without its manifest asset fails the run).
#
# DLBOOK_INVARIANT_BASE names the revision the phase started from (default 453ace7).
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"
qmd="${1:?usage: scripts/render_chapter.sh <page.qmd>}"
base="${DLBOOK_INVARIANT_BASE:-453ace7}"
test -f "$qmd" || { echo "render_chapter: no page $qmd" >&2; exit 2; }

export PATH="$HOME/.local/quarto-1.10.18/bin:$HOME/.local/bin:$HOME/Library/TinyTeX/bin/universal-darwin:/opt/homebrew/bin:$PATH"
export QUARTO_PYTHON="$HOME/.venvs/dl-book/bin/python"
# A clone renders its own code/, not the venv's editable install of ~/dl-book/code.
export PYTHONPATH="$root/code${PYTHONPATH:+:$PYTHONPATH}"
export PYTHONDONTWRITEBYTECODE=1
export SOURCE_DATE_EPOCH=1790553600   # 2026-09-28T00:00:00Z, the book's content date
py="$QUARTO_PYTHON"

version="$(quarto --version)"
if [[ "$version" != "1.10.18" ]]; then
  echo "render_chapter: Quarto $version is first on PATH; the freeze needs 1.10.18" >&2
  exit 2
fi
if [[ "$(sysctl -n machdep.cpu.brand_string 2>/dev/null)" != "Apple M1" ]]; then
  echo "render_chapter: warning: not the reference machine (M1 Air); a freeze made" \
       "here is spliced, never committed as new evidence (docs/compatibility.md)" >&2
fi
"$py" scripts/audit_figure_style.py --check-lock "$qmd"
"$py" scripts/materialize_frozen_pdf_assets.py   # keeps a figure folder in <stem>_files

start=$(date +%s)
quarto render "$qmd" --no-execute-daemon
seconds=$(( $(date +%s) - start ))
rm -f _book/*.pdf   # the whole-book PDF of this run; the website ships HTML only

log=audits/press/w2p2/render_log.csv
mkdir -p "$(dirname "$log")"
[[ -f "$log" ]] || echo "page,seconds,command,finished_utc" > "$log"
echo "$qmd,$seconds,quarto render --no-execute-daemon,$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$log"
echo "render_chapter: $qmd rendered in ${seconds} s"

"$py" scripts/figure_ledger.py prune "$qmd"
"$py" scripts/figure_ledger.py record "$qmd" --base "$base"

failed=()
check() {
  if ! "$@"; then failed+=("$*"); fi
}
check "$py" scripts/audit_book_contract.py
check "$py" scripts/audit_frozen_stdout.py --base "$base"
check "$py" scripts/audit_frozen_stdout.py
check "$py" scripts/audit_excerpt_fixtures.py
# The page's loader, its notebook asset and any rcParams override are fatal here; its
# data findings stay a report until the page's data pass (--strict) is done.
check "$py" scripts/audit_figure_style.py --quiet --page "$qmd" --fail-on asset,loader,rc
if (( ${#failed[@]} )); then
  printf 'render_chapter: failed: %s\n' "${failed[@]}" >&2
  exit 1
fi
echo "render_chapter: $qmd done; commit the page, its _freeze, and the ledger together"
