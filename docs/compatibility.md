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
pairs are launched with a recorded one-thread numerical-library environment; that removes
scheduling-dependent LAPACK reduction drift without changing the seeded training
trajectories elsewhere. This setting reduces one source of variation but is not itself a
blanket determinism guarantee—the output comparisons remain the proof. Chapter 18's
hidden setup defaults to six threads in manuscript builds and honors an asserted
CI-only PyTorch override in notebook validation and the weekly full-manuscript audit.
That weekly audit overlays the same exact numerical-runtime pins on the broader
rendering requirements before it regenerates the freeze. Reproduction policy: generated
notebook and full manuscript reference output is byte-identical within that one runtime;
committed HTML/TeX freeze records are byte-identical to each other. Across CPU backends,
outputs must instead satisfy the narrow, surface-specific portability ledger—every
unlisted surface remains byte-exact (see PyTorch's reproducibility notes).

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
- **Thread pinning:** the Appendix A1 and Chapter 18 notebook-validation pairs use one
  numerical thread because separate multithreaded LAPACK processes can differ in their
  final residual bits or the sign attached to a rounded zero. Chapter 18 explicitly reads
  and asserts the CI override after importing PyTorch; the weekly execution audit uses the
  same override when it regenerates the canonical transcript.
  Selected heavy chapters independently use `torch.set_num_threads(...)` for predictable
  runtime on shared machines. Thread counts are machine choices, not semantic ones, and
  exact/typed output gates still decide whether a run is acceptable.
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
  profile on a clean checkout. The publication workflow does this twice because one
  profile may prune another profile's transient directories.
- **Audited publication bundle:** the Pages publish step uses `render: false`. Rendering
  after the audits can silently replace the artifacts that were checked, so deployment
  must publish the existing `_book` directory unchanged.
- **Navigation disclosures and PDF landing:** Quarto 1.10.18 owns the depth-correct
  `download.html` sidebar-tool URL and `collapse-level: 1` sidebar state. The static
  landing source, stylesheet, and cover are copied through `project.resources`; both
  derived PDFs must already be present before the final HTML asset audit checks its
  free links. `disclosure-interactions.html` adds the keyboard role, focusability,
  Enter/Space activation, and hash-target opening that this renderer does not emit for
  collapsible callout headers and chapter-group controls. Recheck those contracts when
  Quarto changes its sidebar or callout markup.
- **Searchable code and deferred images:** collapsed Plan → Code lines use the browser's
  `hidden="until-found"`/`beforematch` path so native search can activate the owning
  numbered step. A scoped layout override is necessary because Bootstrap otherwise
  applies `display: none !important` to hidden content; browsers without `beforematch`
  retain the ordinary collapsed panel. The first content image in each document stays
  eager and all later images carry `loading="lazy"` plus `decoding="async"`. The static
  PDF landing page serves `figures/cover.webp` first and keeps `cover.png` as its
  fallback and as the derived-PDF cover source.
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
