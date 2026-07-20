# Compatibility note (living document)

The book's PDF and HTML print **stable semantics**: shapes, masks, reductions,
train/eval mode, and numerical-stability choices. Everything **version-fragile**
lives here, where it can be updated without reprinting a chapter.

## Tested environment (last verified: July 2026, v1.1 cycle)

| Component | Version | Where it matters |
|---|---|---|
| Python | 3.12 | all executable cells |
| PyTorch | 2.12.1 (CPU) | all executable cells |
| Quarto | 1.9.38 | rendering only |
| OS | macOS 15 (arm64) / ubuntu-latest (CI) | render + Execution Audit |

The **Execution Audit** workflow re-executes every cell from scratch weekly on
`ubuntu-latest`; a green run is the current compatibility statement. Reproduction
policy: on this pinned environment, rendered outputs are expected byte-stable;
across versions and platforms, expect agreement within each figure's declared
invariants, not bitwise identity (see PyTorch's reproducibility notes).

## Version-fragile engineering the chapters rely on

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
