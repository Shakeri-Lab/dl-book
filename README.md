# Deep Learning: Making It Learnable

**What to learn, what to build in, and what to reuse** — a first-principles course in
Python and PyTorch, and the textbook for
[DS 6050 Deep Learning](https://shakeri-lab.github.io/dl-course-site/)
(School of Data Science, University of Virginia), by [Heman Shakeri](https://shakeri-lab.github.io/).
Written in the open; every figure and result is produced by code in the source.
Experiments show their code, while concept diagrams keep their drawing source in the
repository. The examples are written directly in Python and PyTorch and are CPU-friendly.

**Read it:** <https://shakeri-lab.github.io/dl-book/> (canonical HTML edition) ·
[print PDF](https://shakeri-lab.github.io/dl-book/Deep-Learning--Making-It-Learnable.pdf) ·
[continuous-screen PDF](https://shakeri-lab.github.io/dl-book/Deep-Learning--Making-It-Learnable--Continuous.pdf)

**Support it:** The complete book remains free at $0. Optional contributions toward
continued corrections, figures, and open releases are welcome at
[Buy Me a Coffee](https://buymeacoffee.com/hshakeri).

**Stable release:** [v1.3 (September 2, 2026)](https://github.com/Shakeri-Lab/dl-book/releases/tag/v1.3).
The live site currently matches this release.

## The idea

Nearly every construct in modern deep learning is a classical idea made **learnable**:
linear regression → MLP; fixed image filters → CNNs; kernel regression → attention →
Transformers; and finally the pretrained era, where we adapt rather than train. The book
replays that one move in the course's conceptual order and the book's
self-contained voice.

## Structure

- **Part I · From Lines to Networks** — linear/logistic regression, MLPs, training,
  backprop, and the signature chapter: *generalization failure in pictures → inductive bias*.
- **Part II · Vision: Learning the Filters** — filters → learnable filters (CNNs) → modern CNNs & transfer.
- **Interludes** — experimentation as a method; PCA → learnable linear and nonlinear
  autoencoders; attention as test-time regression and a spectrum of memory solvers.
- **Part III · Sequences: Learning the Summary** — RNNs, encoder–decoder.
- **Part IV · Attention: Learning the Similarity** — kernel regression → attention → self-attention → BERT → ViT/scaling.
- **Part V · The Pretrained Era: Learning What to Reuse** — PEFT/quantization, alignment, generative models,
  and multimodal contrastive learning, followed by an epilogue that hands the book's
  question to the reader.

## Building locally

```bash
python3.12 -m venv ~/.venvs/dl-book && ~/.venvs/dl-book/bin/pip install -r requirements.txt
export QUARTO_PYTHON="$HOME/.venvs/dl-book/bin/python"
"$QUARTO_PYTHON" scripts/render_pdf_profiles.py
quarto render --to html --no-clean
```

The helper renders both derived PDF profiles until every outline destination lands
on its heading. HTML is rendered last because it is the canonical edition.

Execution uses Quarto **freeze** — CI never runs cells; after exporting
`QUARTO_PYTHON`, refresh a chapter's cache with
`quarto render chapters/part1/01-linear-regression.qmd --execute`
before committing.

## Authoring pipeline

Chapters are drafted from the instructor's LaTeX lecture notes (`sources/`), the course's
lecture transcripts, and his roadmap essay — see `docs/drafting-template.md` and
`docs/style-guide.md`. Mechanical conversion: `scripts/tex2qmd.sh`; TikZ figures:
`scripts/build_tikz.sh`. The full operational runbook (environment, per-chapter steps,
quality gates, failure modes) is in [CLAUDE.md](CLAUDE.md) — it is auto-loaded by Claude
Code sessions working in this repo.

**Continuing or contributing?** Start with [docs/CONTINUING.md](docs/CONTINUING.md)
(project status, working protocol, standing author rules, and roadmap) and
[docs/arc-seeds.md](docs/arc-seeds.md) (the cross-chapter seed/harvest
ledger every new chapter must respect). These documents are the project's persistent
memory and are updated after every shipped chapter.

## Citation

Suggested citation: Shakeri, Heman. 2026. *Deep Learning: Making It Learnable*.
Version 1.3. <https://shakeri-lab.github.io/dl-book/>. The repository also provides
machine-readable metadata in [CITATION.cff](CITATION.cff).

## License

- **Text and figures:** [CC BY-NC-SA 4.0](LICENSE-text.md)
- **Code** (all code cells and `code/`): [MIT](LICENSE-code)
- **Third-party data, weights, and attributed teaching fragments:** see
  [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)

No content in this book is derived from *Dive into Deep Learning* (d2l.ai) or any other
textbook; the exposition and code are original to the course.
