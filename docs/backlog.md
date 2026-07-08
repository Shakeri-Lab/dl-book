# Backlog (author-requested, not yet scheduled)

Planned items from the author's chapter reviews. Pick these up only when he green-lights
them or a chapter naturally touches them.

## 1. Appendix: floating point and machine precision

Stub exists (`chapters/appendices/a4-floating-point.qmd`). Motivating hooks already in
the book: Chapter 5's depth experiment (sigmoid gradients fall "beneath floating-point
precision" — that phrase deserves a real explanation), `torch.linalg.solve` vs explicit
inverse in Chapter 1, and forward: fp16/bf16/quantization in Chapter 17. Content sketch:
what a float is (sign/exponent/mantissa), machine epsilon, why $0.1 + 0.2 \neq 0.3$,
catastrophic cancellation, log-sum-exp as the fix pattern (ties to softmax in Ch. 2),
mixed precision in training.

## 2. Per-chapter "Deeper dive" section (collapsed by default)

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

Retrofit Chapters 1 and 5 first (Ch. 5's deeper dive: autograd internals + Baydin et al.
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
- Course-site integration (`bookChapter` field) once the author blesses Part I chapters.
