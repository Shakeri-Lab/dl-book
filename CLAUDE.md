# CLAUDE.md — Pipeline Runbook

This repo is *Deep Learning: Making It Learnable*, the Quarto companion textbook for
DS 6050 (Heman Shakeri, UVA). This file is the operating manual for working on it with
Claude Code. Read `docs/style-guide.md` before writing any prose — every chapter must
read like his lectures.

**Continuing the project (fresh session/account): read `docs/CONTINUING.md`** —
project status, the refined working protocol (pre-testing!), all standing author
rules, honesty-gate case law, and the completed-chapter maintenance roadmap. Then
`docs/arc-seeds.md` — the seed/harvest ledger and reading-order toolbox that every
chapter must respect. Those two files replace any account-local memory.

## Non-negotiables

- **Voice**: chapters are drafted from HIS materials (LaTeX seeds + lecture transcripts)
  per `docs/drafting-template.md`, never from generic textbook knowledge. Reuse his
  analogies (style guide §3); flag genuinely new material with `<!-- NOVEL: needs sign-off -->`.
- **No d2l.ai content, ever** — no `import d2l`, no copied prose/code. D2L book prose is
  CC BY-SA 4.0 and its sample/reference code uses a modified MIT license, but this
  project applies one stricter independent-provenance boundary to both. The local copy
  at `../Box-Box/Teaching/6050/Resources/D2L/` is reference-only.
- **Every cell runs**: CPU-only, seeded (`torch.manual_seed(6050)`). Tiny/synthetic
  or committed data only; nothing downloads at render time. Single cell ≤ ~5 min;
  training-heavy chapters may take 5–15 min total to execute (one-time local — CI
  uses the committed freeze). **Pre-test every experiment regime in a scratch
  script before writing prose** (see `docs/CONTINUING.md` §2 and §5).
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

1. **Pick the chapter or review pass.** Follow the status table and roadmap in
   `docs/CONTINUING.md`; every chapter lists its seed files and transcripts in the
   `draft-sources` comment. Chapters 1–20 and Appendices A–D are complete; change them
   only through an explicit review or correction pass, preserving planted harvests.
2. **Snapshot seeds** from Box into `sources/` (spaces → underscores), then apply the
   licensing boundary in `sources/README.md`: remove explicitly third-party-derived
   blocks with an honest omission marker rather than publishing or silently rewriting
   them. Never restore a D2L excerpt from a machine-local source.
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
   Reusable course SVGs are in `figures/static/`. Experiments, derivations, assertions,
   and numerical audits keep visible code. Pure concept-diagram drawing cells use
   `#| echo: false`; split mixed cells first so hiding coordinates never hides an
   implementation or evidence.
7. **Execute + render** (this refreshes the committed freeze cache — CI never executes):
   ```bash
   QUARTO_PYTHON=.venv/bin/python quarto render chapters/partN/XX-*.qmd  # NO --to flag!
   QUARTO_PYTHON=.venv/bin/python quarto render        # full book, HTML + PDF
   ```
   An `--to html` single-file render leaves the PDF freeze (`tex.json`) stale → the
   book PDF ships without your changes. Any later prose edit invalidates the freeze
   and re-executes the whole chapter — batch fixes before re-rendering.
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
| Book PDF missing latest chapter edits | stale `tex.json` from an `--to html` render — re-render the chapter with no `--to` flag, then full render |
| Book-corpus LM numbers move after a copyedit | the training cell read live chapter sources — Chapters 10 and 14 must read `data/book-corpus-ch1-9.txt`, whose length and SHA-256 are asserted; rebuild it only as an explicit benchmark revision |
| PDF chapter links all print as “Chapter 1” | chapter-level `sec-*` references were resolved in a chapter-local PDF pass — keep `filters/pdf-chapter-xrefs.lua` enabled and never begin an indented continuation line with `@sec-*` (Pandoc reads it as an example-list marker) |
| seq2seq/RNN mysteriously stuck at 40–60% | padding poisoning — `pack_padded_sequence` the encoder, `ignore_index=PAD` the loss (ch. 11 runs this as an experiment) |
| RNN/seq2seq training crawls | `clip_grad_norm_` threshold too tight (1.0 throttled ch. 11's task; 5.0 fine) |
| Eval numbers vary with batch contents | BatchNorm left in train mode — `model.eval()` before eval, `model.train()` in the loop |
| Live site serves old page for >10 min | Pages build wedged: `gh api repos/Shakeri-Lab/dl-book/pages/builds/latest`; requeue via `gh api -X POST .../pages/builds`; bust CDN with `?v=N` |
| CI job cancelled with zero steps run | GitHub runner capacity noise — `gh run rerun <id> --failed` |

More case law: `docs/CONTINUING.md` §5.

## Backlog

Author-requested future work lives in `docs/backlog.md` (Appendix C's future
device-profiling queue; per-chapter collapsed "Deeper dive" sections with
further-reading papers; ch. 6 3Blue1Brown-inspired pacing). Appendix D is complete.
Check the backlog and `docs/arc-seeds.md` before proposing new structural ideas.

## Course website integration

The course website (`…/6050/dl-course-site`, separate repo) links mature chapters as
primary readings via a `bookChapters` array in `lib/module-extras.ts`; one course
module can map to several book chapters. D2L remains an alternative reading. Keep the
author's edit gate distinct from the technical review/render gate, and verify the site
build after changing any mapping.

## Commit authorship (standing rule)

Never add AI attribution to commits in this repository: no `Co-Authored-By:
Claude ...` trailers and no "Generated with Claude Code" lines — in commit
messages, PR bodies, or release notes. Commits are authored solely under the
author's git identity. (Author instruction, July 2026; the pre-existing history
was rewritten to remove such trailers.)
