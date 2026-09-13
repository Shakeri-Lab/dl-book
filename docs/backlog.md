# Backlog (author-requested, not yet scheduled)

Planned items from the author's chapter reviews. Pick these up only when he green-lights
them or a chapter naturally touches them.

## Focused animation roadmap — approved September 9, 2026

**Updated September 13, 2026:** twenty scenes are pushed through `e00d3c5`, including
the approved [LayerNorm/BatchNorm contrast](layernorm-axis-excerpt.md). Verify its
publishing run `34766825371` succeeded. [Chapter 5 derivative gates](derivative-gates-excerpt.md)
is author-approved after the requested network-first redesign: a large forward
activation remains visible as its local backward probe shrinks. Small activation
curves support the component picture; a ten-factor path isolates the sigmoid
ceiling with weights omitted, not set to one. Fresh validation passes 974 tests,
the six source/HTML audits, exact frozen stdout and desktop/phone inspection.
The earlier plot/log-ruler acceptance is superseded. Publish only this approved
scene after full checks; preserve the static manuscript and numerical evidence.
This finishes the ready Wave 4 queue. The author separately authorized adding a
small shared-manuscript greedy-versus-beam example, then animating it for local
review. Keep that Chapter 11 work out of the derivative-gates publication. This
does not authorize the deferred scenes or their training replays.

Prior checkpoint: nineteen scenes are pushed through `e5827cb`,
including [scale granularity](scale-granularity-excerpt.md); run `34764538563`
succeeded. [Chapter 14 LayerNorm axis](layernorm-axis-excerpt.md) is author-approved
for separate publication. It adds the requested BatchNorm grouping contrast and the
padding/length boundary; no new training study or PDF change. At the next shared
manuscript cut, clarify Chapter 9's “one image” evaluation explanation: spatial
positions can still supply BatchNorm2d statistics; running statistics are the
usual evaluation protocol, not a mathematical necessity caused by batch size one.
Chapter 5 derivative gates is next for local review; greedy tree still requires a manuscript fixture.
Preference run `34762857399` succeeded and its live publication is verified.

Prior checkpoint: seventeen scenes were pushed through `9730659`.
Same-subspace is deployed and verified (run `34727889922`). A1's
[SVD circle](svd-circle-excerpt.md) was pushed in `4fb86d4`; `9730659` fixes its
Linux static-SVG serialization failure. Run `34761906820` passed interactions but
failed the existing Chapter 18 notebook gate on signed zero; deployment is unverified.
Chapter 18's [preference ruler](preference-ruler-excerpt.md) is author-approved for
separate publication. Next: Chapter 17 scale granularity, local review only, using
the manuscript's quiet-row range rather than the film's invented sample dots.
The [animation guide](animation-authoring.md) is the current inventory; the
[Wave 1](wave1-excerpts.md) and [Wave 2](wave2-excerpts.md) receipts preserve their
review history. Source state is not deployment: verify the publishing run and live
anchors independently. The author approved the small repair pass and Chapter 18
mask/predictor for publication after review; both were pushed in `d08c41f`.
Reference tilt in Chapter 18 was separately pushed as `bc1133f`, beside
Figure 18.4 at `#reference-tilt-excerpt`; see [its receipt](reference-tilt-excerpt.md).
Check publishing run `34586598964` independently. Chapter 19's analytic score field
was separately pushed in `ec2e0f6`; see [its receipt](score-field-excerpt.md) and
publishing run `34589132667`.
It is not a full diffusion/training replay. Chapter 16's attention bill was pushed
separately as `061eff3` (run `34595314339`); see [its receipt](attention-bill-excerpt.md).
Chapter 13's mask-before-softmax is now author-approved for publication after
desktop/phone review and 705 passing tests, pushed as `6cde283` (run `34601697930`).
The autoencoder interlude's [same-subspace identity](same-subspace-excerpt.md) is
author-approved on September 12. A1's existing SVD example is next for local review.
Greedy tree remains blocked.
Later entries remain candidates.
Prioritize difficult mechanisms rather than animating every chapter.

### First wave (original priorities; current status explicit)

1. **Backpropagation — committed in `ab041af`**
   (Chapter 5, “One neuron, one chain,” beside `fig-chain-graph`; panel id
   `one-chain-excerpt`).
   Asks whether increasing the weight raises or lowers the loss. Traces the forward
   values and caches them, then reverses three rays to expose one local derivative each
   and their product. Reuses the manuscript's `micro-autograd-check` example (`w=0.7`,
   `x=2`, `b=-0.5`, target `0.3`) and its **full** squared error, not half-squared:
   the factor-of-two test computes the 0.168900 counterfactual explicitly and pins the
   scene off it. The product 0.337801 is bound to the chapter's own frozen stdout, and a
   measured finite difference (0.338046) is what the chain rule has to reproduce.
   Differentiation is not a parameter update, and one chain does not teach branch
   accumulation; the panel says both. Source composition: `6050-Ch5/lecture.jsx`,
   `SOneChain` L356–391, and the storyboard's **OneChain** scene, 0:46–1:30. The book's
   fixture and loss definition govern. One open decision for the author, E1: the panel
   draws the backward pass in wine and reserves orange for `w`, where the chapter's static
   `fig-chain-graph` draws its backward arrows orange.
2. **Kernel weighting — approved for publication (Chapter 12, beside `fig-kernel-lookup`).** Ask which
   observation gains influence as the query moves. Reveal distance, Gaussian
   affinity, normalized weights, weighted values, and their sum; then move only the
   query. Reuse `keys3=(1,3,5)`, `values3=(1.5,2.8,1.8)`, bandwidth `0.6`, and end at
   the manuscript's `q=3.5` witness. Check nonnegative weights summing to one and a
   prediction within the observed-value range. No bandwidth knob, learned similarity,
   uncertainty interpretation, or causal-explanation claim. Source composition:
   `6050-Ch12/lecture.jsx`, `FinalGaussianLookup`, storyboard **GaussianLookup**.
3. **BERT's masking ledger — revised and approved for publication (Chapter 15, beside `fig-mlm-policy`).** Ask whether an
   ordinary-looking selected token contributes to the loss. Follow the manuscript's
   twelve-token `mlm-policy-ledger` fixture through masked, random-replacement,
   unchanged-selected, and unselected sites. Keep corrupted input and original-target
   routes separate; keep paired originals and input copies visible, reveal the
   paths before the answer, and keep the five Boolean rows in a collapsed audit
   panel. Retain full nonpadding
   attention visibility. Check that the three corruption rows partition selection,
   selection is a subset of eligibility, and unchanged-selected sites still score.
   The small fixture is not an illustration of exact population proportions. Source
   composition: `6050-Ch15/lecture.jsx`, `FourLedgers`, with storyboard
   **FourLedgers/CorruptionPolicy**; do not copy the lecture's alternative grouping.

4. **Softmax shift — committed in `ab041af`**
   (Chapter 2, beside `fig-softmax`; panel id `softmax-shift-excerpt`). Added to the wave
   ahead of backpropagation on purpose: it is the smallest scene of the three, and its job
   was to prove the new manifest entry, the scene template and the shared test harness
   before a heavier scene depended on them. It did, without a change to any of them.
   Asks which probability changes when 100 is added to every logit. Reuses the
   `softmax-shift-audit` fixture — logits `(2.0, 0.5, −1.0, 1.0)`, shifts `(0.0, 100.0)` —
   and the chapter's own shift-invariance claim. Tests hold positivity, normalisation,
   equality with the `c = 0` vector to 1e-12 at every scrubbed shift, a constant argmax,
   and — the one that matters numerically — that the largest score is subtracted before
   exponentiating, proved by instrumenting `Math.exp` and by a `c = 1000` probe that would
   otherwise return four `NaN`s. Source composition: `6050-Ch2/lecture.jsx`, `SSoftmax`
   L1267–1354, storyboard **Softmax** 168–230 s; the lecture's three logits are not used,
   the book's four govern.
5. **Gate product — committed in `ab041af` after the author's revisions**
   (Chapter 10, beside `fig-highway-time`, under "Watch what that buys"; panel id
   `gate-product-excerpt`). Asks how much of one word's gradient reaches step 80 through a
   forget gate held at one value. Reuses `@eq-lstm-highway`, the chapter's `σ(0) = ½` with
   `0.5^80 ≈ 10^−24`, its `+1` forget-bias recommendation, its "astronomically attenuated,
   not exactly zero", and the two mean gates its diagnostic caption reports (quoted in the
   boundary, never drawn). The picture, one SVG: a shared chart of `f^k` for `b_f = 0`
   (dashed) and `b_f` at the slider (solid, +1 by default), linear first — both curves plunge
   — then log (two straight lines, floor `10⁻²⁵`, a linear|log toggle in the plot); under it a
   signal-retention river, two bands whose ink is the same mapping as the chart's `y`; one
   token, the word `cat`, travelling both bands at once and drawn with its band's ink (`· · ·`
   below .05); at step 80 a ratio badge, `× 1.6 × 10¹³`, *sixteen trillion times larger* — the
   computed `(σ(1)/σ(0))^80 = 1.580 × 10¹³`, not the `10¹⁴` of subtracted roundings; and ONE
   parameter control, a real `b_f` slider the timeline sweeps (0 → +1, then +2 and back) and
   the reader may then drag, everything recomputing from the dragged value. The slider is the
   author-requested amendment to the shared contract below, recorded in
   `docs/animation-authoring.md` rule 1 on 2026-09-10; a test asserts the pane carries no
   other control. Boundary: real gates vary per unit and per step, the chapter writes `≈` and
   this panel makes the same approximation on purpose, the log floor and ink mapping are
   stated, the word's legibility at 80 is on that mapping and never "intact", nothing is
   trained, and the recall experiment remains the chapter's evidence. Source composition: `6050-Ch10/lecture.jsx`,
   `SMemoryHighway` L487–520, storyboard **MemoryHighway** 5:34–6:30; `ch10-data.js`
   `retentionByForgetGate` is used only as an independent arithmetic check, never as a
   source, and the lecture's gradient-lag chart is a results plot and is not imported.
   Note for whoever writes the audit next: this is the first scene whose printed witness
   lives in another file (`chapters/appendices/a3-precision-performance.qmd` prints
   `0.5^{80}=8.27\times10^{-25}`; Chapter 10 prints only the order of magnitude), and
   `scripts/audit_excerpt_fixtures.py` can only bind literals to a scene's own chapter.
   The binding is made in the scene's test instead.

The scene paths above are relative to the read-only instructor source collection
`Teaching/6050/Video_lectures/`. Inspect the current files and record exact source
hashes in each excerpt's receipt before adaptation. They supply choreography, not
authority to replace manuscript examples or colors.

### Wave 2 — four committed, mask/predictor approved for publication

Hinge bump, pooling bins, LSTM valves, and quantization grid are in `0674cab`.
The author approved mask/predictor after its shifted-target revision. Static figures remain the
shared HTML/PDF authority; these excerpts explain their mechanisms optionally.

- **Chapter 3, three hinges form a bump:** sweep the existing `hinge-bump-values`
  construction (`h1 − 2h2 + h3`, peak 2 at 0.5, zero outside `[−1.5, 2.5]`) and add its
  weighted terms; the `−2` is a reveal with a slope ledger, not a knob. Adapt **Bump**;
  no training claim.
- **Chapter 8, pooling boundaries:** movement within a fixed bin versus crossing its
  boundary; show alignment-dependent tolerance, not general translation invariance.
  Adapt **Pooling** using the existing `pool-invariance` fixture, with the shifted-down
  case as a declared computed variant. Reuses the convolution cell-measure and rays.
- **Chapter 10, LSTM retain/write/read:** distinguish stored cell state from exposed
  output; closing the read gate does not erase memory. Adapt **LSTMDesign** without
  inventing a trained gate trajectory from aggregate statistics. Keep this second
  Chapter 10 scene: state retention and gradient retention answer different questions.
- **Chapter 17, quantization grid:** eight weights onto a 3-bit grid; which survive
  unchanged, which two pairs collide, and the maximum error against the step. The
  lecture's nine schematic weights are not imported.
- **Chapter 18, response mask — reviewed and approved for publication:**
  follow predictor position `i` to the mask on target `i+1`. Change excluded output
  logits, not input tokens; keep the scored symbolic terms fixed. Anchor before
  “A preference is a measurement, not a value” without editing the QMD. The original
  two token/mask rows govern; the film's different numerical scores are not imported.
  See [the receipt](mask-predictor-excerpt.md).

### Next scene and later shortlist

Reference tilt (Chapter 18) and the bounded score field (Chapter 19) are pushed.
The linked-patch attention bill (Chapter 16) is separately pushed as `061eff3`.
Its follow-up revision connects image patches to both score axes, switches patch
states discretely, and labels the area tiles explicitly. A compact length bar
compares block projection/FFN work with mixing; patch embedding is excluded.
The movie transport remains the only control. No P=8 or hover-only mechanism is
part of this revision.
A full diffusion replay remains deferred; the film's time-varying mixture must not
replace the book's static mixture silently. Mask before
softmax (Chapter 13) is approved for publication. Its previous fixture gate is
closed by reconstructing the exact existing padding-mask figure's second query;
the new [receipt](mask-before-softmax-excerpt.md) records the computed intermediates.
No new manuscript fixture is introduced. Greedy
tree (Chapter 11) needs a shared-manuscript example first. The author requested
one next scene after approving mask-before-softmax: the next eligible candidate is
Wave 4's same-subspace identity, now author-approved. It uses a labeled schematic
rotation to illustrate the existing identity, not a new numerical experiment.
Other Wave 4 entries remain a shortlist, not permission to implement. See
[the source plan](wave2-plan.md).

Defer training replays, diffusion, RoPE, and elaborate 3-D scenes until the smaller
excerpts demonstrate useful teaching value.

### Shared acceptance contract

- Follow the approved convolution player: optional and closed/paused initially,
  silent, compact on-pane controls, 1.5x default, keyboard/scrubbing/fullscreen,
  reduced-motion behavior, transcript, and static fallback. Aim for about forty
  seconds, one prediction, and one mechanism per excerpt; no extra parameter knobs, with the
  one-parameter-control amendment of 2026-09-10 — see `docs/animation-authoring.md` rule 1:
  a scene may carry ONE parameter control when the mechanism IS that parameter's effect, and
  the timeline sweeps it by default.
- Use deferred local HTML/SVG/JavaScript. Do not import the lecture's React/Babel/
  KaTeX runtime, video payloads, or a general animation framework. Extract only
  demonstrably shared playback code when building the second player.
- Apply the book's semantic palette, with labels and geometry independent of color.
  Reflow at phone widths instead of scaling down a complete lecture slide.
- Existing figures, prose, and code remain authoritative in both editions. Any new
  required example must enter the shared manuscript before publication. Optional
  motion does not excuse an HTML-only claim or an absent static explanation.
- **The manifest and the fixture guard are required for any new scene, not optional
  extras.** Index the scene in `interactives/manifest.json` — panel id, scene
  directory, chapter, anchor, filter, transport, duration, beats, the fixture
  literals its chapter must keep verbatim, any declared computed variants, and its
  receipt — and require `scripts/audit_excerpt_fixtures.py` to pass. Declare the
  fixture on the static panel and have the scene script read it; do not retype a
  manuscript number in JavaScript. That is what makes a later manuscript edit fail
  the build and force the receipt to be re-read, instead of leaving a panel quietly
  disagreeing with the chapter it illustrates. The manifest entry is the whole
  registration: the filter inserts every scene the manifest gives a document, so no
  new scene should require an edit to `filters/mechanism-excerpts.lua`. Start from
  `interactives/_template/` and satisfy all four of the registration points its README
  names — manifest entry, `_quarto.yml` resource line, test file wired into
  `scripts/html-tests/package.json`, and the wave receipt. Inherit the transport suite
  through `registerTransportTests` in `scripts/html-tests/excerpt-harness.cjs` rather
  than rewriting it, and keep the scene's own arithmetic in the scene's own suite.
- **Every number the panel shows must be a manuscript literal or a declared computed
  variant, described in the manifest and repeated in the receipt.** A number that is
  neither does not belong in the scene. Two Wave 1 lessons are worth carrying forward:
  the audit binds literals only to the scene's own chapter, so a witness printed in a
  different file has to be bound in the scene's test until the schema grows an
  `alsoIn`; and the audit reads receipt digests out of Markdown rows shaped
  `| \`path\` | \`sha256\` |`, so a receipt that puts a descriptive column between the
  path and the hash silently stops being checked rather than failing.
- Independently test every arithmetic/Boolean state, deterministic scrubbing,
  pause/replay, resize/fullscreen, failed-script fallback, and direct anchors. Require
  unchanged frozen stdout, the fixture-drift audit, structural/HTML audits, and
  narrow/desktop visual review.
- Do not restart the paused numerical-runtime migration or scheduled monitor, add a
  new GPU workload, change a numerical tolerance, or cut a stable tag for this queue.

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

- **Next PDF cut: one reproducibility-and-Part-opener pass.** Do not pull either change
  into HTML-only Phase E or notebook-only Phase F. In the next print-affecting cut,
  make both PDF profiles byte-reproducible from one commit and pinned toolchain
  (including timestamps, trailer IDs, metadata, compression, and bundled assets), then
  adopt KOMA-Script's `\setpartpreamble` for the five Part transitions so their short
  learnability arguments belong to the opener layout rather than ordinary chapter
  flow. Rebuild both profiles together, require identical hashes across two clean
  builds, rerun the full outline fixpoint, and record the resulting repagination.

- Run `scripts/fetch_notebooks.py` for the remaining legacy course-module Colab
  notebooks (m02-03 fetched 2026-07-07; others pending) when their independent
  provenance is needed. This is separate from the 26 manuscript-derived public
  notebooks now generated and validated by the Phase F publication pipeline.
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
