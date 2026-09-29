# Compatibility note (living document)

The book's PDF and HTML print **stable semantics**: shapes, masks, reductions,
train/eval mode, and numerical-stability choices. Everything **version-fragile**
lives here, where it can be updated without reprinting a chapter.

## Tested environment (last verified: September 2026, stable v1.3)

| Component | Version | Where it matters |
|---|---|---|
| Python | 3.12.14 in notebook CI; 3.12 locally | all executable cells |
| PyTorch | 2.12.1 (CPU) — **2.13.0 verified equivalent**, see below | all executable cells |
| Quarto | 1.10.18 | rendering only |
| MathJax | 4.1.3 (exact jsDelivr pin) | canonical HTML mathematics |
| OS | macOS 15 (arm64) / Ubuntu 24.04 x64 (notebook CI) | render + Execution Audit |

Working tree location: `~/Library/CloudStorage/Box-Box/Teaching/6050/dl-book` (in
Box, by the author's choice). The virtualenv is deliberately **outside** Box at
`~/.venvs/dl-book`; render with `QUARTO_PYTHON=$HOME/.venvs/dl-book/bin/python`.
GitHub is the source of truth — if Box ever corrupts git objects, re-clone rather
than repair in place.

The **Execution Audit** workflow re-executes every cell from scratch weekly. The public
notebook gate runs on the explicit `ubuntu-24.04` label with Python 3.12.14 and records
the resolved runner image, CPU, numerical libraries, and full package set. A green run
is the current compatibility statement. The Appendix A1 and Chapter 18 public/reference
pairs are launched with a recorded one-thread numerical-library environment, which keeps
the thread count out of their LAPACK calls without changing the seeded training
trajectories elsewhere. This setting removes one source of variation but is not a
determinism guarantee: Appendix A1's residual still flipped under it, from an
uninitialized `lstsq` pivot array (see the `lstsq` entry below), and the output
comparisons remain the proof. Chapter 18's hidden setup defaults to four threads in
manuscript builds and honors an asserted CI-only PyTorch override in notebook validation
and the weekly full-manuscript audit. That weekly audit overlays the same exact
numerical-runtime pins on the broader rendering requirements before it regenerates the
freeze. Reproduction policy: generated notebook and full manuscript reference output is
byte-identical within that one runtime; committed HTML/TeX freeze records are
byte-identical to each other. Across CPU backends, outputs must instead satisfy the
narrow, surface-specific portability ledger: every unlisted surface remains byte-exact
(see PyTorch's reproducibility notes).

### Verified version equivalence

**torch 2.13.0 (July 25, 2026).** A fresh environment pulled 2.13.0 rather than the
2.12.1 that built the caches. Re-executing Chapter 7 produced **no change whatsoever
to `execute-results/*.json`** — every printed number reproduced exactly. Six figure
binaries changed bytes while being **pixel-identical** (PNG/PDF metadata churn), and
were discarded rather than committed. That is the two-tier policy working as intended:
bit-identical where it is claimed, invariant-identical where it is not. Discard
metadata-only figure churn rather than committing it; it pollutes history and hides
real changes.

## Version-fragile engineering the chapters rely on

- **MathJax renderer pin:** canonical HTML loads
  `https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-chtml.js`; a floating major or minor
  is not allowed because it could change line breaking or glyph layout without a book
  revision. Its `ui/lazy` component defers off-screen inline and unnumbered output while
  numbered `span[id^="eq-"]` containers are always typeset on the first pass. That
  exception keeps authored equation tags in sequence and makes cold `@eq-*` links land
  on fully laid-out targets. The math-free `head` selector is the required sentinel for
  chapters with no numbered equations; removing it leaves MathJax's container list
  empty and aborts lazy processing. The release guard still compares the displayed equation
  sequence and exercises representative direct links and complete-scroll behavior on
  Chapters 14, 17, 19, and Appendix D. The three authored
  `.responsive-long-equation` displays remain the
  tested wrapping contract. MathJax 4's native `output.linebreaks` is a future
  replacement candidate, but enabling it is a book-wide rendering change and requires
  narrow-screen equation and cross-reference inspection first.
- **The reference machine** (the author's decision, September 28, 2026): every freeze is
  executed on an M1 MacBook Air (`MacBookAir10,1`, four performance cores) with
  `~/.venvs/dl-book` (Python 3.12, torch 2.12.1) and Quarto 1.10.18, at 4 CPU threads.
  Every executing chapter's setup cell pins `torch.set_num_threads(4)` unless it pins a
  count of its own for a stated reason: one thread for the LAPACK pairs below, in CI only
  (Chapter 18 reads the `DLBOOK_TORCH_NUM_THREADS` override and otherwise pins 4; Appendix
  A1 sets none, so CI's one-thread environment reaches it; the reference machine renders
  both at 4), and 6 threads in `16-vit-scaling.qmd` (six of its stdout blocks change at 4) and
  `17-peft-quantization.qmd` (its in-context coverage figure changes at 4). Moving
  either to 4 is a re-baseline, the author's call. The exported notebooks omit the
  sixteen reference-machine pins: in CI's two-core runners, 4 threads moved Chapters 6, 9,
  10, and 13 past their portable stdout contracts, which assume the platform's default. Thread-sensitive
  training moves with the count and the chip: on the reference machine
  `13-attention.qmd`'s year-region mass reads 96.649% to 97.469% for 1 to 8 threads, and a MacBook Pro gives
  96.582%, which no thread count here reproduces. A freeze made elsewhere is spliced
  (the paused numerical-runtime migration), never committed as a new execution.
- **Thread pinning:** the Appendix A1 and Chapter 18 notebook-validation pairs use one
  numerical thread, which keeps the thread count out of their LAPACK calls. It is a guard,
  not a demonstrated cure: the last-bit residual flip and the rounded-zero sign flip that
  prompted it both recurred under it, and both come from default-driver `lstsq` calls.
  Appendix A1's was traced to the pivot array (next entry); Chapter 18's is absorbed by
  `round(x, 6) + 0.0`. Chapter 18 explicitly reads and asserts the CI override after
  importing PyTorch; the weekly execution audit uses the same override when it
  regenerates the manuscript transcript for comparison.
  Selected heavy chapters independently use `torch.set_num_threads(...)` for predictable
  runtime on shared machines. Thread counts are machine choices, not semantic ones, and
  exact/typed output gates still decide whether a run is acceptable.
- **`torch.linalg.lstsq` driver (torch 2.12.1):** the default CPU driver, `gelsy`,
  allocates its column-pivot array without initializing it (`at::empty` in
  `aten/src/ATen/native/BatchLinearAlgebraKernel.cpp`), and LAPACK reads a nonzero entry
  as "move this column to the front". The last bits of the solution therefore depend on
  leftover heap memory, which differs from one process to the next. On September 28, 2026
  Appendix A1's normal-equation residual printed 6.661e-16 in one kernel and 1.790e-15 in
  the other, under the one-thread environment, and failed the exact public/reference gate
  on two runner CPU models (run 36498234082, attempts 1 and 2). On the reference machine,
  `torch.use_deterministic_algorithms(True)`, which fills uninitialized memory, moves the
  same call from 2.220e-15 to 6.661e-16. Appendix A1 now passes `driver="gels"` (plain QR,
  valid because its design has full column rank), which uses no pivot array; its residual
  reads 6.661e-16 on the reference machine, and the prose follows (the author's decision).
  Upstream zero-fills the array (PyTorch commit `8cb058b9e655`, PR #187436, issue
  #187411), first released in torch 2.14.0; 2.13.0 still has the bug. The remaining
  default-driver calls, three in `01-linear-regression.qmd`, one in
  `04-training-loss-sgd.qmd`, and two rank-deficient ones in `18-alignment.qmd`, pass the
  gate because their stdout is coarse or rounded (`round(x, 6) + 0.0` in Chapter 18,
  whose `.2e` line prints an exact zero because adding 37 absorbs the round-off) or, for
  the Chapter 1 bias-variance figure and the Chapter 4 SGD-zones figure, absent (the gate
  compares stdout only). A new cell that prints `lstsq` results to the last bits should name `driver="gels"` for a
  full-rank problem or `driver="gelsd"` for a rank-deficient one until the pin reaches
  2.14.0.
- **Determinism flags**: `torch.use_deterministic_algorithms(True)` where paired
  digests demand it (ch. 14/16). Some backends lack deterministic kernels; if a
  future version errors, the fallback is documented in the PyTorch determinism
  page — prefer restructuring over abandoning the digest checks.
- **Attention backends**: `F.scaled_dot_product_attention` selects a kernel
  (Flash, memory-efficient, math) by device/dtype/shape at runtime. The book's
  claims never depend on which backend ran; Appendix C says why calling the
  function proves nothing about the kernel.
- **Autocast / dtype policy**: Appendix C's audits print the observed policy for
  this build; expect different choices on other devices or releases.
- **Editable install**: `pip install -e ./code` provides `dlbook`; CI installs it
  via `requirements.txt`. If imports fail in a fresh clone, run that line.
- **Frozen PDF assets:** Quarto records executed PDF figures under `_freeze`, while
  LuaLaTeX resolves them through ignored `*_files/figure-latex` directories. Run
  `python scripts/materialize_frozen_pdf_assets.py` immediately before each PDF
  profile on a clean checkout. `scripts/render_pdf_profiles.py` does this before each
  local print proof because one profile may prune another profile's transient
  directories. CI builds no PDF.
- **Figures as data (press W2 phase 2, September 29, 2026):** `code/dlbook/book.mplstyle`
  is the one figure style, loaded by one exact line per page; the notebook manifest must
  ship it with that page's unit, or the notebook stops with "is not a valid package
  style". It names only matplotlib's bundled DejaVu fonts (a findfont fallback is fatal
  only on the Linux runners), writes SVG text as paths (`svg.fonttype: path`) with a
  fixed `svg.hashsalt` so element ids repeat, and embeds PDF fonts as TrueType
  (`pdf.fonttype: 42`). Writing a PDF with a mathtext prime (Cmsy10) makes fontTools log
  two "timestamp seems very low" lines; they are harmless and Quarto hides them.
  `_quarto.yml` sets `fig-format: svg` and `fig-dpi: 300` for HTML and states the PDF
  defaults (`pdf`, 300). Under `freeze: true` these keys reach a page only when it
  re-executes, and a cell's `fig-width`/`fig-height` does nothing under Jupyter: the
  code's figsize decides. Render a page with `scripts/render_chapter.sh`. It runs
  `quarto render <page> --no-execute-daemon` with `SOURCE_DATE_EPOCH=1790553600`, so
  matplotlib writes the book's content date (2026-09-28), not the clock, into each SVG
  `dc:date` and PDF `/CreationDate`, and a re-render of unchanged code reproduces the
  bytes; without the daemon the kernel inherits that environment. The render has no
  `--to`, so one run refreshes both html.json and tex.json, and then deletes the
  whole-book PDF it leaves in `_book`. Measured on 08-cnn, the cheaper pair `--to html`
  then `--to latex` (499 s against 900 s) gives the same html.json, SVGs and PDF bytes
  but is not equivalent: its tex.json names `figure-latex/` files, which are ignored by
  git, and `figure-pdf/` keeps the old PDFs. Quarto's freezer copies figure folders
  without deleting, so the wrapper prunes files no freeze JSON names
  (`scripts/figure_ledger.py prune`); `scripts/audit_book_contract.py` fails on such an
  orphan and on a freeze whose hash is not the md5 of its page, and
  `scripts/audit_html_assets.py` on a `_book/**/figure-html` file no page references.
  `scripts/postrender_html.py` writes width and height on every figure image (2 CSS px
  per pt for executed SVGs, natural size for TikZ): Quarto writes none for an SVG, whose
  lazy box would otherwise collapse to 0 x 0, and the phone pan-strip rule reads that
  drawn width.
- **Audited publication bundle:** the Pages publish step uses `render: false`. Rendering
  after the audits can silently replace the artifacts that were checked, so deployment
  must publish the existing `_book` directory unchanged.
- **Navigation disclosures and the HTML-only site:** Quarto 1.10.18 owns the
  `collapse-level: 1` sidebar state. The website serves HTML only: the retired PDF
  landing page (`download.html`, its stylesheet, and the WebP cover) must not return,
  and the asset audit fails on any PDF file in `_book` or any link to a PDF on this
  site. `disclosure-interactions.html` adds the keyboard role, focusability,
  Enter/Space activation, and hash-target opening that this renderer does not emit for
  collapsible callout headers and chapter-group controls. Recheck those contracts when
  Quarto changes its sidebar or callout markup.
- **Searchable code and deferred images:** collapsed Plan → Code lines use the browser's
  `hidden="until-found"`/`beforematch` path so native search can activate the owning
  numbered step. A scoped layout override is necessary because Bootstrap otherwise
  applies `display: none !important` to hidden content; browsers without `beforematch`
  retain the ordinary collapsed panel. The first content image in each document stays
  eager and all later images carry `loading="lazy"` plus `decoding="async"`.
  `figures/cover.png` remains the cover of local print proofs.
- **Public notebook pipeline:** `scripts/notebook_manifest.json` is the sole map for
  the 26 exported units and their required assets. The generated bootstrap pins Python
  3.12's numerical stack through `scripts/notebook_requirements.txt`, embeds a full Git
  commit, fetches assets only from that immutable revision, and rejects a SHA-256
  mismatch. Export tooling is pinned separately in
  `scripts/notebook_ci_requirements.txt`. CI generates the public source and a full
  Quarto-derived reference once, then executes both cleanly in six fixed shards. Their
  learner-visible stdout must match byte for byte on the same runner. A separate
  reviewed portability contract compares that evidence with the canonical HTML freeze;
  exact comparison is the default, and accepted deviations remain visible in the CI
  report. Only the unexecuted public source that passed both gates is published. This
  route deliberately omits hidden plotting harnesses and does not alter either PDF.

When a version bump changes any printed number or figure, the fix is: update the
pinned environment here, re-run the Execution Audit, refresh freeze caches
chapter-by-chapter, and record the change in the changelog — never hand-edit a
printed output.
