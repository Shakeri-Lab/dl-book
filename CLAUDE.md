# CLAUDE.md — Pipeline Runbook

This repo is *Deep Learning: Making It Learnable*, the Quarto companion textbook for
DS 6050 (Heman Shakeri, UVA). This file is the operating manual for working on it with
Claude Code. Read `docs/style-guide.md` before writing any prose — every chapter must
read like his lectures.

## Non-negotiables

- **Voice**: chapters are drafted from HIS materials (LaTeX seeds + lecture transcripts)
  per `docs/drafting-template.md`, never from generic textbook knowledge. Reuse his
  analogies (style guide §3); flag genuinely new material with `<!-- NOVEL: needs sign-off -->`.
- **No d2l.ai content, ever** — no `import d2l`, no copied prose/code. The local copy at
  `../Box-Box/Teaching/6050/Resources/D2L/` is reference-only (CC-BY-SA would contaminate
  our CC BY-NC-SA license).
- **Every cell runs**: CPU-only, seeded (`torch.manual_seed(6050)`), whole chapter < 60 s.
  Tiny/synthetic data only; nothing downloads at render time.
- **Numbers must match prose.** If a cell's printed output contradicts the surrounding
  narrative, fix the experiment or the narrative (see Chapter 1's ridge/lasso regime,
  tuned to n=25 so OLS genuinely overfits).

## Environment (this machine)

```bash
export PATH="$HOME/.local/bin:$HOME/Library/TinyTeX/bin/universal-darwin:/opt/homebrew/bin:$PATH"
```

| Tool | Where | Notes |
|---|---|---|
| quarto 1.9 | `~/.local/bin/quarto` | user-land tarball (brew cask needs sudo — unavailable) |
| pandoc | bundled: `quarto pandoc` | |
| TinyTeX | `~/Library/TinyTeX` | for PDF + TikZ; `tlmgr update --self` before `tlmgr install <pkg>` |
| Python venv | `.venv/` (python3.12, torch, matplotlib, sklearn) | always render with `QUARTO_PYTHON=.venv/bin/python` |
| TikZ→SVG | latexmk + `pdftocairo` (poppler) | dvisvgm is broken here (ghostscript linkage) — don't use it |
| gh | `/opt/homebrew/bin/gh` | not logged in; authenticate per-command: |

```bash
export GH_TOKEN=$(printf "protocol=https\nhost=github.com\n" | git credential fill | sed -n 's/^password=//p')
```

Remote: `https://github.com/Shakeri-Lab/dl-book` (push to `main` → CI renders and
publishes to `gh-pages` → https://shakeri-lab.github.io/dl-book/). Never commit to
`gh-pages` manually.

**Do not move this repo into Box.** Box's cloud filesystem times out on dense file I/O
(venv, `_book`). Course materials live in Box at
`/Users/setup/Library/CloudStorage/Box-Box/Teaching/6050/` (read-only inputs: `LaTeX/`
seeds, `dl-course-site/transcripts/`).

## Companion repo: dl-course-code (Manim animations)

`~/dl-course-code` (clone of https://github.com/Shakeri-Lab/dl-course-code, his
**constantly-evolving** working repo — `git pull` before each use, treat read-only).
Per-module `MODULE_NOTES.md` files are polished lecture spines — the preferred prose
source when drafting (they satisfy the traceability gate). `scenes/` shows his visual
compositions for figures. Full guide: `docs/dl-course-code.md`.

## Writing a chapter, end to end

1. **Pick the chapter.** Its stub in `chapters/partN/XX-*.qmd` lists the seed files and
   transcripts (the `draft-sources` comment). Part I order: 1 ✓ → 5 → 4 → 3 → 2 → 6
   (ch. 6 is the signature chapter — outline with the author first).
2. **Snapshot seeds** from Box into `sources/` (spaces → underscores):
   `cp "../…/LaTeX/Module 2-Backprop/2-1-backprop.tex" sources/2-1-backprop.tex`
3. **Mechanical conversion** (also extracts TikZ blocks into `figures/tikz-src/`):
   ```bash
   QUARTO_BIN=$HOME/.local/bin/quarto ./scripts/tex2qmd.sh sources/<seed>.tex drafts/partN/XX-raw.md
   ```
4. **Draft** per `docs/drafting-template.md`: read the style guide, the seed(s), the raw
   pandoc output, and the module transcripts
   (`…/dl-course-site/transcripts/*.txt`; `[coding]_` prefix = live-coding sessions —
   they define the code-narration style). Write the full `.qmd` over the stub. Keep the
   `<!-- lecture-source: … -->` provenance comment. Structure: motivation → concrete
   numbers → formalism → executable code → "Okay, so…" recap → 4–5 exercises.
5. **Audit** (separate pass/session when possible): every claim traceable to seed or
   transcript; math re-derived; NOVEL items flagged.
6. **Figures.** Data-driven → matplotlib cells (preferred). Architecture diagrams →
   `./scripts/build_tikz.sh <name-filter>` → reference `figures/generated/<name>.svg`.
   Reusable course SVGs are in `figures/static/`.
7. **Execute + render** (this refreshes the committed freeze cache — CI never executes):
   ```bash
   QUARTO_PYTHON=.venv/bin/python quarto render chapters/partN/XX-*.qmd --to html
   QUARTO_PYTHON=.venv/bin/python quarto render        # full book, HTML + PDF
   ```
8. **Verify before pushing**: grep the built HTML for the cells' printed numbers and
   confirm they support the prose; check the PDF built; skim for unrendered math.
9. **Commit `_freeze/` together with the chapter.** Push; then confirm CI:
   `gh run list -R Shakeri-Lab/dl-book -L 1` and spot-check the live URL (mind CDN
   cache, ~1 min).

## Math macros — three files, one truth

HTML renders via **MathJax** (`html-math-method: mathjax`), *not* KaTeX — KaTeX's
Quarto path can't take custom macros (learned the hard way). Adding a macro means
updating **both**:

- `tex/macros.tex` (PDF path, and prepended by `tex2qmd.sh` during conversion)
- `mathjax-config.html` (HTML path — `window.MathJax.tex.macros`; args form is
  `name: ["body", nargs]`)

Available: `\vect{}`, `\matr{}`, `\E`, `\Ex`, `\var`, `\cov`, `\norm{}`, `\argmax`,
`\argmin`, `\imp`, `\R`, `\dd`, `\loss`. Seed-local `\newcommand`s are carried over by
`tex2qmd.sh` automatically during conversion, but chapters should use the canonical set.

## Known failure modes

| Symptom | Cause / fix |
|---|---|
| CI error "no branch named gh-pages" | branch was initialized once; if it ever vanishes, push an orphan `gh-pages` with `.nojekyll` |
| `tlmgr install` terminates | run `tlmgr update --self` first |
| TikZ build fails "Can be used only in preamble" | source is a full document; `build_tikz.sh` extracts `tikzpicture` blocks — check the block itself compiles standalone |
| Equations unrendered / red on the site | a macro exists in `tex/macros.tex` but not `mathjax-config.html` |
| Render hangs or times out | you're probably in Box; work in `~/dl-book` |
| Subagents unavailable (spend limit) | draft inline: read seed + transcripts fully first, then write; audit-by-construction and verify code by executing |

## Backlog

Author-requested future work lives in `docs/backlog.md` (floating-point appendix — stub
at a4; per-chapter collapsed "Deeper dive" sections with further-reading papers; ch. 6
3Blue1Brown-inspired pacing). Check it before proposing new structural ideas.

## Related, but out of scope here

The course website (`…/6050/dl-course-site`, separate repo) will link mature chapters as
each module's canonical reading via a `bookChapter` field in `lib/module-extras.ts`,
demoting D2L to "alternative reading" — **only after the author has edited those
chapters**. Don't wire this up unilaterally.
