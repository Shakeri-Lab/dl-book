# Compatibility note (living document)

The book's PDF and HTML print **stable semantics**: shapes, masks, reductions,
train/eval mode, and numerical-stability choices. Everything **version-fragile**
lives here, where it can be updated without reprinting a chapter.

## Tested environment (last verified: August 2026, rolling post-v1.2.1)

| Component | Version | Where it matters |
|---|---|---|
| Python | 3.12 | all executable cells |
| PyTorch | 2.12.1 (CPU) — **2.13.0 verified equivalent**, see below | all executable cells |
| Quarto | 1.10.18 | rendering only |
| MathJax | 4.1.3 (exact jsDelivr pin) | canonical HTML mathematics |
| OS | macOS 15 (arm64) / ubuntu-latest (CI) | render + Execution Audit |

Working tree location: `~/Library/CloudStorage/Box-Box/Teaching/6050/dl-book` (in
Box, by the author's choice). The virtualenv is deliberately **outside** Box at
`~/.venvs/dl-book`; render with `QUARTO_PYTHON=$HOME/.venvs/dl-book/bin/python`.
GitHub is the source of truth — if Box ever corrupts git objects, re-clone rather
than repair in place.

The **Execution Audit** workflow re-executes every cell from scratch weekly on
`ubuntu-latest`; a green run is the current compatibility statement. Reproduction
policy: on this pinned environment, rendered outputs are expected byte-stable;
across versions and platforms, expect agreement within each figure's declared
invariants, not bitwise identity (see PyTorch's reproducibility notes).

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
  revision. The three authored `.responsive-long-equation` displays remain the
  tested wrapping contract. MathJax 4's native `output.linebreaks` is a future
  replacement candidate, but enabling it is a book-wide rendering change and requires
  narrow-screen equation and cross-reference inspection first.
- **Thread pinning** (`torch.set_num_threads(...)` in heavy chapters): keeps CPU
  runs deterministic-in-time on shared machines and reduces nondeterministic
  parallel reductions. The count is a machine choice, not a semantic one.
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

When a version bump changes any printed number or figure, the fix is: update the
pinned environment here, re-run the Execution Audit, refresh freeze caches
chapter-by-chapter, and record the change in the changelog — never hand-edit a
printed output.
