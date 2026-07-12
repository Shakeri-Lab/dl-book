# Backlog (author-requested, not yet scheduled)

Planned items from the author's chapter reviews. Pick these up only when he green-lights
them or a chapter naturally touches them.

## 1. Appendix: floating point and machine precision

Stub exists (`chapters/appendices/a4-floating-point.qmd`). Motivating hooks already in
the book: Chapter 5's depth experiment (sigmoid gradients remain nonzero in float64,
yet the corresponding float32 parameter updates can round away), `torch.linalg.solve` vs explicit
inverse in Chapter 1, and forward: fp16/bf16/quantization in Chapter 17. Content sketch:
what a float is (sign/exponent/mantissa), machine epsilon, why $0.1 + 0.2 \neq 0.3$,
catastrophic cancellation, log-sum-exp as the fix pattern (ties to softmax in Ch. 2),
mixed precision in training.

## 2. Per-chapter "Deeper dive" section (collapsed by default) — PILOTED in ch. 6 (2026-07-08)

Author spec: each chapter may end with a **Deeper dive** section, collapsed by default,
containing (a) more digestible/extended treatments of the chapter's machinery (e.g., for
Ch. 5: autograd internals — grad_fn chains, dynamic vs static graphs, higher-order
gradients, checkpointing) and (b) **further reading for interested learners, including
papers** (with one-line why-read-this notes).

Implementation when activated: a standard pattern at chapter end —

```markdown
## Deeper dive {.unnumbered}

::: {.callout-note collapse="true"}
## For the curious: <topic>
...extended material...

**Further reading**
- Author, "Paper" (year) — one line on why.
:::
```

Pilot shipped in Chapter 6 (Zhang/Neal/Belkin/3b1b). If the author approves the pattern, retrofit Chapters 1 and 5 next (Ch. 5's deeper dive: autograd internals + Baydin et al.
autodiff survey, Rumelhart–Hinton–Williams 1986, Glorot & Bengio 2010, He et al. 2015).
Add the pattern to `docs/drafting-template.md` once the author approves the first one.

## 3. Chapter 6 inspiration

The signature chapter (generalization in pictures → inductive bias) is inspired by
3Blue1Brown's gradient-descent lesson: <https://www.3blue1brown.com/lessons/gradient-descent>.
Echo its visual-first pacing (watch a failure happen before naming it). Noted in the
chapter stub's draft-sources; revisit during the planned outline session with the author.

## 4. Standing smaller items

- Run `scripts/fetch_notebooks.py` for the remaining Colab notebooks (m02-03 fetched
  2026-07-07; others pending) — provenance for later chapters' code.
- Extend course-site `bookChapters` mappings as Chapters 12–19 become reviewed and
  substantive.

## 5. GPU experiment queue (backlog-only; revised after Chapter 13, July 12, 2026)

Do not place project-management placeholders in the published chapters. Keep these
experiments here until GPU access is available; then run them on Rivanna/Colab, pin the
numbers, and fold only completed results back into the relevant chapter.

Chapters 12–13 audit: the fixed-kernel, scaling, and date-attention experiments are
CPU-complete. They add no GPU-dependent experiment and no published GPU placeholder;
the queue below remains the reminder for later access. Chapter 13 discusses why
scaled dot product maps cleanly to dense matrix multiplication, but makes no unmeasured
hardware-speed claim.

- **Ch. 9 scorecard, full scale**: LeNet / VGG / NiN / deep ResNet on all 60k
  Fashion-MNIST images — reproduce the lecture frontier (≈89% / >90% / ≈90% @ 30k
  params / higher).
- **Ch. 9 transfer, full scale**: ImageNet ResNet-18 on full FashionMNIST at 224px —
  linear probe (≈93%) vs last-block fine-tune (≈94%) vs scratch baseline.
- **Ch. 10 language model, full scale**: word-level tokens, stacked LSTM layers, a
  larger licensed corpus, and a held-out loss comparison across model sizes; inspect
  when samples move beyond book-flavored character babble.
- **Ch. 11 translation, full scale**: English→French with an independently written,
  packed encoder–decoder pipeline, bucketing, BLEU, and greedy-versus-beam decoding.
  Do not use the course's D2L-derived `rnn_data_prep.py`.
