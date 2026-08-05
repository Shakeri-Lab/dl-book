# Setting up on a new Mac

Everything the book needs that is **not** in git: the toolchain, the Python
environment, and the credentials. The repository itself carries the manuscript,
the committed data assets, and the freeze caches, so a fresh machine can render
the whole book without executing a single cell.

Budget about 30 minutes, most of it downloads.

---

## 0. Where to put the repo

The project lives in Box with the rest of the 6050 teaching material, so on a
machine signed into Box it arrives by sync:

```
~/Library/CloudStorage/Box-Box/Teaching/6050/dl-book
```

Wait for Box to finish downloading it before building (the folder should show as
fully synced, not "online only"). If you would rather work from a fresh clone —
faster, and immune to sync hiccups — that is equally valid, since GitHub is the
source of truth:

```bash
git clone https://github.com/Shakeri-Lab/dl-book.git ~/dl-book
```

**Either way, keep the virtualenv out of Box** (§3). It is ~1.1 GB of
platform-specific binaries, it is useless on another machine, and syncing 47,000
files of it will bog Box down for hours.

Two cautions that come with a cloud-hosted working tree, learned on this project:

- A Box-hosted git repo here corrupted three separate `git fetch` runs
  (`fatal: mmap failed`, `early EOF`, `invalid index-pack output`) and had to be
  repaired by transplanting `.git`. **The fix is always to re-clone from GitHub**,
  never to repair in place. Push often so there is nothing to lose.
- A cloud provider can hand back a stale or partially-materialised file. The place
  that would surface is a freeze cache — as a *wrong number in a printed chapter*
  rather than a crash. If a number ever looks off, re-render that chapter and
  diff (§5B) before believing it.

Sizes, for calibration: the manuscript is ~13 MB; `.git` is ~114 MB;
`_book` + `_freeze` are ~32 MB and are rewritten on every render; the excluded
`.venv` is ~1.1 GB.

---

## 1. Command-line basics

```bash
xcode-select --install                     # git, clang; skip if already present
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install poppler ghostscript gh python@3.12
```

| Tool | Used for |
|---|---|
| `poppler` (`pdftocairo`, `pdftotext`) | TikZ → SVG conversion; rasterising PDF pages for visual checks |
| `ghostscript` | PDF utilities behind the figure pipeline |
| `gh` | releases, CI status |
| `python@3.12` | the execution environment (3.12 is what the freeze caches were built with) |

`dvisvgm` is deliberately unused — its ghostscript linkage was broken on the old
machine, and `scripts/build_tikz.sh` goes through `pdftocairo` instead. Leave it
that way unless you enjoy debugging font paths.

---

## 2. Quarto

The old machine had no sudo, so Quarto was installed user-land at
`~/.local/bin/quarto`. On a machine where you are admin, the cask is simpler:

```bash
brew install --cask quarto        # or: download the tarball into ~/.local
quarto --version                  # expect 1.9.x — 1.9.38 built the current book
```

Then the LaTeX stack (LuaLaTeX is what renders the PDF):

```bash
quarto install tinytex            # lands in ~/Library/TinyTeX
```

If a later render complains about a missing LaTeX package:

```bash
tlmgr update --self && tlmgr install <package>
```

Add the tools to your PATH (in `~/.zshrc` if you want it permanent):

```bash
export PATH="$HOME/.local/bin:$HOME/Library/TinyTeX/bin/universal-darwin:/opt/homebrew/bin:$PATH"
```

---

## 3. Python environment

Create the environment **outside the Box folder**, then install from inside the
repo so the editable `-e ./code` entry resolves:

```bash
python3.12 -m venv ~/.venvs/dl-book
cd ~/Library/CloudStorage/Box-Box/Teaching/6050/dl-book    # or your clone
~/.venvs/dl-book/bin/pip install --upgrade pip
~/.venvs/dl-book/bin/pip install -r requirements.txt
```

Point Quarto at it (put this in `~/.zshrc` to make it permanent):

```bash
export QUARTO_PYTHON="$HOME/.venvs/dl-book/bin/python"
```

That last line also installs the book's own package in editable mode (the
`-e ./code` entry), which is what makes the canonical listings importable:

```bash
~/.venvs/dl-book/bin/python -c "from dlbook.supervised import fit_supervised; \
    from dlbook.training import fit_next_token; print('dlbook ok')"
```

The versions that produced the committed caches, for reference: Python 3.12.13,
torch 2.12.1, numpy 2.5.1, matplotlib 3.11.0. Newer point releases are normally
fine; see §6 before you trust a re-executed number.

(If you skip the `QUARTO_PYTHON` export and see `ModuleNotFoundError: No module named 'yaml'` during a
render, that is the symptom: Quarto found a Python without Jupyter.)

---

## 4. GitHub credentials

Either log in once:

```bash
gh auth login          # HTTPS, browser flow
```

…or use the per-command pattern the runbook uses, which reads the token from the
git credential helper and never prints it:

```bash
export GH_TOKEN=$(printf "protocol=https\nhost=github.com\n" | git credential fill | sed -n 's/^password=//p')
```

Pushing to `main` is what publishes: CI renders HTML + PDF and deploys to
`gh-pages`. Never commit to `gh-pages` by hand.

---

## 5. Verify the setup

**A. Build the book without executing anything.** The freeze caches are
committed, so this exercises Quarto, LuaLaTeX, and the filters, and should take a
few minutes rather than forty:

```bash
cd ~/Library/CloudStorage/Box-Box/Teaching/6050/dl-book
export QUARTO_PYTHON="$HOME/.venvs/dl-book/bin/python"
quarto render
ls -la _book/Deep-Learning--Making-It-Learnable.pdf     # expect ~5 MB
pdfinfo _book/Deep-Learning--Making-It-Learnable.pdf | grep Pages   # 524 on current main
QUARTO_PYTHON=$HOME/.venvs/dl-book/bin/python quarto render \
  --profile screen --to pdf --no-clean
pdfinfo _book/Deep-Learning--Making-It-Learnable--Continuous.pdf | grep Pages  # 502
```

**B. Execute one chapter and check it reproduces.** This is the real test of the
Python side — it re-runs a chapter's cells and compares the printed output against
what is committed:

```bash
python - <<'EOF'
import json, re, subprocess
ch = "chapters/part2/07-filters-convolution"
blocks = lambda md: re.findall(r'\.cell-output-stdout\}\n```\n(.*?)```', md, re.S)
before = blocks(json.loads(subprocess.run(
    ["git", "show", f"HEAD:_freeze/{ch}/execute-results/html.json"],
    capture_output=True, text=True).stdout)["result"]["markdown"])
print("committed output:", before)
EOF

quarto render chapters/part2/07-filters-convolution.qmd     # no --to flag: both formats
git diff --stat _freeze/chapters/part2/07-filters-convolution
```

A clean `git diff` means your machine reproduces the book exactly. Small
differences in the last digits are possible across platforms and library
versions — read §6 before deciding what to do about them.

**C. Figure pipeline** (only if you will touch TikZ sources):

```bash
scripts/build_tikz.sh 1_1_lin_Recap-fig06     # expect: ✓ ...svg (+ .pdf)
```

---

## 6. The one thing to be careful about

**Do not bulk-delete `_freeze/` on a new machine.** The caches are committed
precisely so that the printed numbers are stable; regenerating them all on
different hardware or library versions can shift low-order digits, and the prose
quotes those numbers.

The policy, stated fully in `docs/compatibility.md`: **bit-identical on a pinned
environment** (which is what the refactor acceptance tests rely on), and
**agreement within each figure's declared invariants** across versions and
platforms. So:

- Editing a chapter? Re-render *that chapter* (no `--to` flag — both formats, or
  the PDF ships stale), then the project, then diff its outputs.
- If a number moves, decide deliberately: either update the prose to the new
  measured value, or pin the environment. Never hand-edit a printed output.
- The weekly **Execution Audit** workflow does a from-scratch re-execution of
  everything in CI; a green run is the standing statement that the book still
  reproduces.

---

## 7. Companion material

```bash
git clone https://github.com/Shakeri-Lab/dl-course-code.git ~/dl-course-code
```

Read-only for the book's purposes; `git pull` before use. Its per-module
`MODULE_NOTES.md` files are the polished lecture spines and the preferred drafting
source (see `docs/dl-course-code.md`).

The course website repo and the raw teaching inputs (LaTeX seeds, transcripts)
live in Box under `Teaching/6050/`. Install Box Drive and sign in; the paths in
older notes assume
`~/Library/CloudStorage/Box-Box/Teaching/6050/`. Nothing in the book build depends
on Box being present — those are drafting inputs, not build inputs.

---

## 8. First session on the new machine

```bash
cd ~/Library/CloudStorage/Box-Box/Teaching/6050/dl-book
export QUARTO_PYTHON="$HOME/.venvs/dl-book/bin/python"
```

Then paste `docs/NEW-CHAT-PROMPT.md` into a fresh Claude Code session. It points
at `CLAUDE.md`, this file's siblings, and the current state and open decisions in
`docs/CONTINUING.md` §9.
