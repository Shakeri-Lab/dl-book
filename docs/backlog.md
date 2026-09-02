# Backlog (author-requested, not yet scheduled)

Planned items from the author's chapter reviews. Pick these up only when he green-lights
them or a chapter naturally touches them.

## Cross-book reciprocity — COMPLETED 2026-08-02

The v1.2.1 point release declares and audits the ten stable anchors consumed by
*Deep Learning: Making It Trainable*. Five forward pointers and mutual colophon links
separate this volume's first-course mechanics from the graduate companion's diagnostic
extensions. Future anchor moves are coordinated interface changes, not local cleanup.

## Release stewardship — COMPLETED 2026-07-16

The stable v1.0 edition is fixed at July 16, 2026. The repository now carries validated
`CITATION.cff` metadata, an exact suggested citation, an HTML-only revision-notes
section, and a 498-page release PDF. The remaining pure concept schematics were folded
without hiding experiments or numerical audits; four protocol/reference tables gained
earned numbers. The `v1.0` tag and GitHub release are the stable archive for this
edition. Future changes belong to a later version rather than silently replacing that
asset.

## 1. Appendix C: numerical precision and hardware efficiency — COMPLETED 2026-07-15

Shipped as `chapters/appendices/a3-precision-performance.qmd`. It harvests Chapter 5's
rounded-away updates, Chapter 9's norm underflow, Chapter 10's $0.5^{80}$ attenuation,
Chapter 12's direct-kernel `0/0`, Chapter 17's storage/compute/trainable-state split,
and Chapter 19's long schedule products. The completed appendix covers binary formats,
range versus resolution, cancellation, stable softmax, mixed precision, loss scaling,
an explicitly synthetic Roofline analysis, and an I/O-aware exact-attention recap. It
makes no hardware-speed claim and publishes no GPU placeholder.

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

- **Dark mode remains deliberately deferred.** The executed PNG corpus uses white
  canvases. Do not add a dark theme until the figure pipeline can emit transparent or
  matched light/dark variants; otherwise the book becomes a field of glowing white
  rectangles. The current light theme and AA-safe link palette are the supported
  reading surface.
- **MathJax native line breaking is evaluation-only.** Version 4.1.3 is pinned and the
  three authored responsive wrappers are cheap and predictable. Revisit
  `output.linebreaks` only as a controlled replacement pass with phone-width visual
  regression tests; do not combine it with a dependency bump.
- **PDF hardening completed (2026-09-02):** visible Python has an 88-column
  audit, code/stdout wrap in the derived PDF, media-box geometry, a three-pass
  LaTeX minimum, and an exact all-outline fixpoint for both profiles. Stable v1.3
  uses a uniform 0.85-inch margin: the two-sided print conversion is 548 pages and
  the one-sided continuous-screen conversion is 519 pages after the September 2
  Part-page release, both with no off-paper text. Final page counts
  are recorded in the current build ledger after each repagination. The remaining index
  and tagged-PDF items below are editorial/print-era choices, not repairs to this gate.

- Run `scripts/fetch_notebooks.py` for the remaining Colab notebooks (m02-03 fetched
  2026-07-07; others pending) — provenance for later chapters' code.
- Course-site `bookChapters` mappings through Chapter 20 were completed in the July 15
  course-alignment pass, alongside the syllabus's native-PyTorch wording repair.
- Modules 8/9 research-lens readings and the Module 10 test-time regression/control
  outline, discussion prompt, and five explained self-checks were completed in the
  July 15 memory/control pass. Their prose remains in the general author edit gate.
- **PDF index:** technically supported by the current TinyTeX toolchain, but deferred
  to a dedicated editorial pass. Select useful terms, subentries, ranges, and
  `see`/`see also` relationships across the full manuscript before enabling it; HTML
  search remains the current navigation fallback. An editorial index is required
  before any print run.
- **Fully tagged PDF:** callout icons now carry empty replacement text and the build
  audits glyph extraction, but the complete PDF is not yet structurally tagged.
  Require heading, list, table, figure, and reading-order tags before claiming
  screen-reader-complete PDF accessibility.
- Package the controlled transfer (§15.6), ICL ceiling (§17.1.1), and the
  test-time-regression interlude's memory-capacity mechanism test as graded artifacts
  only after the author approves a shared
  autograder and submission contract.
- Consider a one-page protocol card after the experimentation interlude: claim type,
  predeclared contract, seed panel, endpoint rule, and ledger fields. Link it from later
  designed studies if adopted.
- **Statistical-learning reference completed (2026-08-06):** Appendix E collects
  empirical and population risk, transformed distributions, likelihood contracts,
  Gaussian residual assumptions, distribution comparisons, estimator cases, and
  uncertainty reporting. Chapters 1, 4, 6, and 18 carry only the notation needed in
  the main path and point to the appendix as an optional audit layer.
- Consider a compact coding-practice reference for reproducibility, shape contracts,
  testing, device placement, and the boundary between teaching kernels and production
  systems. Keep production scaffolding out of the conceptual cells unless it changes
  the chapter's claim.
- Consider reusing the epilogue's five closing questions as the final project or exam
  report frame. The v1.0 HTML revision notes now provide the page-reference migration
  guide for returning students.

## 5. GPU experiment queue (backlog-only; revised after the memory/control pass, July 15, 2026)

Do not place project-management placeholders in the published chapters. Keep these
experiments here until GPU access is available; then run them on Rivanna/Colab, pin the
numbers, and fold only completed results back into the relevant chapter.

The July 25, 2026 Rivanna pass completed and published the Chapter 9 full-data
Fashion-MNIST scorecard, the Chapter 9 ImageNet ResNet-18 probe/fine-tune/scratch
rematch, and the Chapter 10 WikiText-2 word-LSTM scale study. Their 30 per-seed JSON
records, SLURM job identifiers, device/software metadata, and source digest live in
`experiments/rivanna/results/`; they are no longer backlog items.

The experimentation/HPO interlude's paired BatchNorm study is CPU-complete. The
autoencoder interlude's curve/projector, decoder-ambiguity, convolutional
reconstruction, and denoising studies are CPU-complete as well. Across Chapters 12–20,
the fixed-kernel, scaling, date-attention, tiny Transformer book-corpus, controlled
MLM-transfer, and five-seed CNN/ViT rematch experiments are CPU-complete, as are Chapter
17's frozen-context, planted-rank LoRA, and controlled quantization audits; Chapter 18's
completion-mask, scalar-preference, exact-policy, DPO-identity, and five-seed
proxy-coverage audits; and Chapter 19's Gaussian-ELBO, finite-GAN,
schedule-coefficient, and five-seed scalar-diffusion studies. They require no GPU
dependency or project-management placeholder in the published chapters. Chapter 20's
five-seed paired-versus-deranged cross-modal retrieval study is likewise CPU-complete.
Chapter 14's seed-6050 recall-under-capacity study is CPU-complete: its factorized
kernel traversal, delta recurrence, and selective-write trade are mechanism checks,
not long-context language-model or accelerator claims. At $N/d=8$, plain/gated
overall recall is 0.134/0.138; the gate changes priority/ordinary recall by
+0.387/-0.124, and softmax has 0/26,040 top-1 failures while retaining nonzero value
MSE. `docs/CONTINUING.md` preserves the full endpoint table.
The queue below remains the private reminder for later access. Appendix A's
linear-algebra demonstrations and
Appendix B's tensor-contract demonstrations are also CPU-complete; neither publishes a
GPU placeholder or infers hardware behavior. Appendix C's dtype probes, synthetic
Roofline, attention tensor ledger, and online-softmax parity check are complete as CPU
and analytical studies; its roofs are invented teaching coordinates rather than measurements.
Chapters 13–14 discuss the structure of
dense matrix operations but make no unmeasured hardware-speed claim. Chapter 16 reports its tiny
scratch regime as a mechanism study, not as an architecture verdict. Chapter 17
separates payload and metadata but makes no kernel-speed or natural-language quality
claim. Chapter 18 calls its designed-utility study a finite planted mechanism, not
evidence that a natural-language model is aligned. Chapter 19 makes no natural-image
quality, family-ranking, or hardware-cost claim; all full-scale regime tests belong
here.

- **Appendix C device profiling, when access exists:** measure dtype-specific compute
  roofs and sustainable memory bandwidth on one named accelerator; use profiler
  counters to place selected elementwise, GEMM, materialized-attention, and fused
  attention kernels on boundary-specific Rooflines. Record backend selection, shapes,
  masks, warmup, synchronization, software versions, traffic, latency, and throughput.
  Fold results into the appendix only after the numbers are pinned; until then keep
  this reminder here rather than adding a published callout.

- **Ch. 11 translation, full scale**: English→French with an independently written,
  packed encoder–decoder pipeline, bucketing, BLEU, and greedy-versus-beam decoding.
  Do not use the course's D2L-derived `rnn_data_prep.py`.
- **Ch. 14 long-context memory spectrum, full scale**: compare exact softmax with a
  KV cache, a factorized/linear-attention model, a delta or gated-delta model, and a
  selective SSM on one licensed language corpus. Predeclare quality and context-length
  ladders; match tokenizer, data, parameter scale, training tokens, optimizer effort,
  and output protocol where defensible. Report state and cache bytes, prefill and decode
  arithmetic, synchronized latency/throughput, realized kernel/backend, and
  quality-versus-context with multiple end-to-end seeds. Do not turn the CPU key--value
  mechanism test into a claim about Mamba, DeltaNet, or language modeling.
- **Epilogue test-time-control rematch, when a reproducible implementation and GPU
  access exist**: hold backbone, training data, prompts, sampling, hardware, and output
  caps fixed; meter the planner's internal horizon work as well as generated tokens.
  Allocate the same measured FLOPs or wall time to memory-only, longer-sampling, and
  self-consistency baselines; report quality versus total inference compute with
  uncertainty. Treat the paper's Table 2 as evidence to rematch, not a family-level
  verdict, and publish no TTC placeholder before that study is complete.
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
- **Ch. 20 multimodal retrieval, full scale**: use one licensed paired image–text
  corpus and predeclare entity-level deduplication, candidate pools, multi-positive
  handling, prompt templates, subgroup slices, and both retrieval directions. Compare
  true-pair training with a matched pair-breaking or nuisance-shortcut audit across
  end-to-end seeds. Record data provenance, checkpoint licenses, filtering, batch
  construction, measured compute, and per-seed results before adding any natural-data
  claim.
