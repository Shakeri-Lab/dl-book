# Backlog (author-requested, not yet scheduled)

Planned items from the author's chapter reviews. Pick these up only when he green-lights
them or a chapter naturally touches them.

## 1. Appendix: floating point and machine precision

Stub exists (`chapters/appendices/a4-floating-point.qmd`). Motivating hooks already in
the book: Chapter 5's depth experiment (sigmoid gradients remain nonzero in float64,
yet the corresponding float32 parameter updates can round away), `torch.linalg.solve` vs explicit
inverse in Chapter 1, fp16/bf16/quantization in Chapter 17, and Chapter 19's long
schedule product $\bar\alpha_t=\prod_{s\le t}\alpha_s$. The Chapter 19 hook should
distinguish a mathematically small coefficient from underflow and from an update that
rounds away. Content sketch: what a float is (sign/exponent/mantissa), machine epsilon,
why $0.1 + 0.2 \neq 0.3$, catastrophic cancellation, log-sum-exp as the fix pattern
(ties to softmax in Ch. 2), stable product accumulation, and mixed precision in
training.

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

## 5. GPU experiment queue (backlog-only; revised after Appendices A–B, July 14, 2026)

Do not place project-management placeholders in the published chapters. Keep these
experiments here until GPU access is available; then run them on Rivanna/Colab, pin the
numbers, and fold only completed results back into the relevant chapter.

Chapters 12–19 audit: the fixed-kernel, scaling, date-attention, tiny Transformer
book-corpus, controlled MLM-transfer, and five-seed CNN/ViT rematch experiments are
CPU-complete, as are Chapter 17's frozen-context, planted-rank LoRA, and controlled
quantization audits, and Chapter 18's completion-mask, scalar-preference, exact-policy,
DPO-identity, and five-seed proxy-coverage audits. Chapter 19's PCA/autoencoder,
decoder-ambiguity, Gaussian-ELBO, finite-GAN, schedule-coefficient, and five-seed scalar
diffusion studies are also CPU-complete. They require no GPU dependency or
project-management placeholder in the published chapters; the queue below remains the
private reminder for later access. Appendix A's linear-algebra demonstrations and
Appendix B's tensor-contract demonstrations are also CPU-complete; neither publishes a
GPU placeholder or infers hardware behavior. Chapters 13–14 discuss the structure of
dense matrix operations but make no unmeasured hardware-speed claim. Chapter 16 reports its tiny
scratch regime as a mechanism study, not as an architecture verdict. Chapter 17
separates payload and metadata but makes no kernel-speed or natural-language quality
claim. Chapter 18 calls its designed-utility study a finite planted mechanism, not
evidence that a natural-language model is aligned. Chapter 19 makes no natural-image
quality, family-ranking, or hardware-cost claim; all full-scale regime tests belong
here.

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
- **Ch. 15 masked-LM transfer, full scale**: use a licensed pretrained encoder and
  a natural-language target with a predeclared label-scarcity ladder. Compare
  scratch, frozen probe, and full fine-tuning across multiple end-to-end seeds;
  include a source-coverage mismatch control and shallow lexical baseline. Pin the
  corpus/license, split, tokenizer, checkpoint, total compute caveat, and per-seed
  results before replacing or supplementing the synthetic mechanism study.
- **Ch. 16 CNN/ViT regime ladder, full scale**: compare a modern convolutional
  family and a vision Transformer on a licensed natural-image dataset across a
  predeclared data ladder, with separate scratch and pretrained arms. Hold input
  resolution, augmentation, label budget, and evaluation shifts fixed within each
  comparison; repeat enough end-to-end seeds to estimate paired uncertainty. Pin
  architecture and checkpoint provenance, parameter counts, operation estimates,
  examples seen, wall-clock cost, and clean/shifted per-seed results. Do not call a
  parameter match a compute match, and do not let a pretrained-versus-scratch gap
  stand in for an architecture effect.
- **Ch. 17 natural-language adaptation and deployment ladder**: choose a licensed
  checkpoint and dataset, then compare a fixed prompt, retrieval, LoRA, and full
  fine-tuning under a predeclared coverage and label-budget ladder. Add quantized
  storage variants only with real kernels and supported hardware. Pin checkpoint,
  tokenizer, dataset license, task-state bytes, peak memory, realized quality,
  latency, throughput, and wall-clock cost separately; do not infer deployment speed
  from parameter count, nominal bit width, or the CPU mechanism studies.
- **Ch. 18 natural-language feedback and alignment study**: choose a licensed
  checkpoint, tokenizer, prompt dataset, and comparison dataset; predeclare the rubric,
  annotator or evaluator population, prompt and candidate coverage, and primary policy
  outcomes. Compare response-masked SFT, fixed-pair DPO, and either online policy
  optimization or best-of-$N$ under a matched, disclosed regime. Use independent blinded
  evaluation and report ties, uncertainty clustered by prompt, realized KL, response
  length and refusal shifts, retained capabilities, and relevant safety/domain slices.
  Audit reward-model calibration on held-out prompts and newer-policy candidates. Pin
  seeds, decoding settings, versions, licenses, sample counts, wall-clock cost, and
  per-run results; do not treat a rising proxy, judge score, or win rate as universal
  alignment.
- **Ch. 19 natural-image generative comparison, full scale**: choose a licensed
  natural-image dataset and declared train/validation/test split, then compare selected
  VAE, GAN, and diffusion families only under a predeclared, defensible regime. Audit
  fidelity, mode and subgroup coverage, memorization or nearest-neighbor overlap,
  conditioning adherence where applicable, and sampling/training cost separately.
  Repeat training and sampling seeds; pin dataset and checkpoint licenses, architecture
  and objective details, schedules, sample counts, evaluation-model provenance,
  wall-clock and hardware cost, and per-run uncertainty. Do not promote one metric into
  a family ranking, compare unmatched pretrained and scratch systems as though the
  difference were architectural, or add a chapter placeholder before results exist.
