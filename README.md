# Deep Learning: Making It Learnable

The course-companion textbook for [DS 6050 Deep Learning](https://shakeri-lab.github.io/dl-course-site/)
(School of Data Science, University of Virginia), by [Heman Shakeri](https://shakeri-lab.github.io/).
Written in the open; every figure and result is produced by the code on the page —
native Python and PyTorch, CPU-friendly.

**Read it:** <https://shakeri-lab.github.io/dl-book/> (HTML) · PDF built from the same sources.

## The idea

Nearly every construct in modern deep learning is a classical idea made **learnable**:
linear regression → MLP; fixed image filters → CNNs; kernel regression → attention →
Transformers; and finally the pretrained era, where we adapt rather than train. The book
replays that one move, in his course's order and voice.

## Structure

- **Part I · From Lines to Networks** — linear/logistic regression, MLPs, training,
  backprop, and the signature chapter: *generalization failure in pictures → inductive bias*.
- **Part II · Vision** — filters → learnable filters (CNNs) → modern CNNs & transfer.
- **Part III · Sequences** — RNNs, encoder–decoder.
- **Part IV · Attention** — kernel regression → attention → self-attention → BERT → ViT/scaling.
- **Part V · The Pretrained Era** — PEFT/quantization, alignment, generative models.

## Building locally

```bash
python3.12 -m venv .venv && .venv/bin/pip install -r requirements.txt
quarto render            # HTML + PDF (needs `quarto install tinytex` once)
```

Execution uses Quarto **freeze** — CI never runs cells; refresh a chapter's cache with
`quarto render chapters/part1/01-linear-regression.qmd --execute` before committing.

## Authoring pipeline

Chapters are drafted from the instructor's LaTeX lecture notes (`sources/`), the course's
lecture transcripts, and his roadmap essay — see `docs/drafting-template.md` and
`docs/style-guide.md`. Mechanical conversion: `scripts/tex2qmd.sh`; TikZ figures:
`scripts/build_tikz.sh`. The full operational runbook (environment, per-chapter steps,
quality gates, failure modes) is in [CLAUDE.md](CLAUDE.md) — it is auto-loaded by Claude
Code sessions working in this repo.

## License

- **Text and figures:** [CC BY-NC-SA 4.0](LICENSE-text.md)
- **Code** (all code cells and `code/`): [MIT](LICENSE-code)

No content in this book is derived from *Dive into Deep Learning* (d2l.ai) or any other
textbook; the exposition and code are original to the course.
