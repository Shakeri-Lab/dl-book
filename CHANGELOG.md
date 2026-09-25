# Rolling post-v1.3 — Chapters 5 and 6 revised; published-source hygiene (September 25, 2026)

- **No authoring records in published pages.** Hidden provenance comments (lecture
  transcripts, seed files, and machine-local paths such as a local copy of a lecture PDF)
  reached the HTML page source because Pandoc passes raw HTML comments through. A new
  last-run filter, `filters/strip-html-comments.lua`, removes them from every page; the
  `.qmd` sources keep them for the drafting workflow. The filter acts only on HTML output
  and leaves Quarto's own `quarto-file-metadata` markers alone: stripping those in a
  first build cost the print PDF its appendix mode (Appendix A printed as Chapter 26).
- **Chapter 5, framing.** The inline pointer to the companion volume becomes a Sources
  entry (*Making It Trainable*, Chapter 11). The opening harvests Chapter 3's credit
  assignment problem. Section 5.2 is retitled "Sensitivity propagation: the four layer
  equations": $\delta^{(l)}$ is defined as the layer sensitivity, named as an adjoint, and
  the transpose in the recursion is derived by index. The "blame" metaphor is retired from
  the chapter, the Preface's engine figure and bullets, and the visible text of the two
  Chapter 5 replays (static frames regenerated).
- **Chapter 5, figures.** Figure 5.1 is redrawn with $a^{(l)}$, the values each node keeps,
  and the backward lane as running sensitivities in the book's semantic colours, which
  also resolves replay decision E1. The node-size network figure is replaced by a
  right-to-left pull-back figure ($\delta$, $\matr{W}^\top\delta$, gate, next $\delta$,
  executed values). Figure 5.3 uses a signed scale and traces one entry. A new TikZ figure
  (`figures/tikz-src/5_5_autograd_rules.tex`) shows four autograd rules in PyTorch syntax.
- **Chapter 5, mechanics.** Section 5.3 states the batch layout
  ($\matr{\Delta}^\top\matr{A}$ as a sum of per-example outer products), counts two
  backward matrix products per forward product, and adds the price of caching (activation
  memory against the network's 57 parameters, `torch.no_grad()`, gradient checkpointing
  with Chen et al. 2016 in Sources). Section 5.4 reframes the scalar engine around
  topological order and `+=` accumulation and gives the tensor vector–Jacobian pair for
  $\matr{Z}=\matr{A}\matr{W}^\top$. Rule 3 states the in-place update under
  `torch.no_grad()` and its three failure variants, each checked on PyTorch 2.13; Rule 5
  says that `backward()` frees cached activations while a kept tensor keeps its history.
- **Exercises.** Chapter 5's Exercise 7 is now the softmax vector–Jacobian product, which
  recovers Chapter 2's cross-entropy gradient and its Exercise 4 formula. The BatchNorm
  backward exercise moves to Chapter 9 as Exercise 7, where BatchNorm is introduced.
- **Chapter 6.** The opening states the chapter's claim instead of a trailer, and the
  section titles are retitled in the book's voice ("The baseline fit: empirical risk and
  clean validation", "Two experiments that challenge the baseline", "Inside the weights:
  full-frame matched filters", "Diagnosing the failure: capacity versus geometry",
  "Inductive bias: constraints as knowledge", "The pivot: toward local, shared
  detectors"). Three new executed cells: an edge-crop control (35.0% of validation
  images have ink in the two columns a shift crops, only 1.2% of all ink; zeroing them in
  place costs two points, so misalignment, not cropping, drives the collapse); the
  two-by-two protocol matrix (clean model on scrambled pixels 8.0%, retrained on shifted
  images 76.5%), presented in a callout; and a pixel-space check that a two-pixel shift
  moves 91.0% of validation images farther than their nearest training image. Section
  6.3 derives the permutation symmetry $\matr{W}_1\matr{P}^\top\matr{P}=\matr{W}_1$ and
  explains the full-frame templates from the batch gradient of Chapter 5. Section 6.5
  states the capacity price of augmentation in a dense network. The Deeper dive replaces
  a video citation with Hein, Andriushchenko, and Bitterwolf (CVPR 2019) on confident
  predictions far from the data. Exercise 1 now asks for the partial-permutation matrix of
  the shift and the distributional equivariance of training. A proposed note that
  garments keep a black margin was measured and found false for this dataset (Xiao et
  al. scale the longest edge to 28 pixels), so the crop control replaces it. The Chapter 6
  stdout contracts cover the three new blocks, and the shift-shuffle replay anchor follows
  the new heading. Section 6.3 now opens on the protocol distinction (a shift breaks the
  trained model; scrambling costs nothing upon retraining), and the shift-shuffle replay
  is retitled "retrained scramble versus zero-shot slide", with its question, slide beat,
  scope note, and lesson naming the protocol behind each comparison.
- **"Blame" retired book-wide.** A follow-up sweep replaced the metaphor with "gradient"
  language in Chapters 2 (a code comment), 8, 9, 10, 13, 17, and 18 and the epilogue.
  Chapter 10's section "Blame through time" is now "Gradients through time", and Chapter
  18's objective-and-location map labels its axes "Where may the gradient write?" and
  "What defines the loss?". Chapter 3 keeps "blame" in its statement of the credit
  assignment problem, where the word is literal.
- **Evidence.** Chapters 5 and 9 were re-executed with byte-identical printed stdout.
  Chapter 6 was re-executed: its four existing stdout blocks are byte-identical, and it
  gains the three new ones. The print PDF has 556 pages and the continuous PDF 530, each
  with 399 outline entries.

# Rolling post-v1.3 — Preface, Chapters 1–4, reference audit, and em-dash sweep (September 25, 2026)

- **Preface.** Rewritten around the author's Lecture 0: why this moment (scale as a design
  decision, pretraining, shared representation spaces) and the batched GEMM that carries
  most of the arithmetic, written in Appendix B's row-batch convention
  $\matr{X}\matr{W}^{\top}+\vect{1}\vect{b}^{\top}$; what the mechanics explain and what
  remains open theory (Chapter 6's double descent, Chapter 16's scaling laws); a
  continuation, not a fresh start; the forward and backward passes; the read → predict →
  run → audit loop with the five audit questions numbered and the estimator cases linked
  to Chapter 4. Two new TikZ schematics (`figures/tikz-src/0_0_preface_{ladder,engine}.tex`)
  replace a long arrow equation; they carry notes rather than numbered captions because the
  Preface is unnumbered. Route tables, edition statement, support block, and the archived
  v1.3 release are unchanged; the Phase B front-door and disclosure contracts pass.
- **Chapter 1.** Section 1.3 names the residual colour "dark red". Section 1.4 shows the
  gradient $-\tfrac{2}{n}\matr{X}^{\top}\vect{e}$ before the normal equations, retitles the
  four computational facts (full column rank, rank deficiency, conditioning, cost), adds
  the subsection "Two sides of the same projection" with the hat matrix, and plants the
  target-mixing bridge to Part IV in plain language. Exercise 3 separates data seeds from
  model seeds and noise from variance; Exercise 5 asks for a logarithmic λ axis and a fixed
  seed; Exercise 1 asks for the derivation behind the displayed gradient. Frozen stdout is
  byte-identical to the previous freeze.
- **Chapter 2.** Names the **classification head** (Section 2.1 anchor, a callout after
  $\vect{o}=\matr{W}\vect{x}+\vect{b}$, and the logits contract in the PyTorch warning) and
  the backbone/head split that later chapters use; one-line callbacks join Chapters 3, 8, 9,
  and 15. Figure 2.1 gains an input-space panel: the $o=0$ boundary as a straight line
  between circles and squares, with parallel $\hat p$ contours. The "differentiable" box
  now opens on the cliff, names the temperature $\tau$ shown in Figure 2.3, and reads the
  temperature setting of text generators as an entropy dial. The information-theory box
  names the KL divergence, shows $H(P,Q)=H(P)+D_{\mathrm{KL}}(P\|Q)$ and the one-hot collapse,
  and gains a small decomposition figure. Exercises 1, 3, 4, and 5 are sharpened; Exercise
  4 states its loss and gives the verified softmax–MSE gradient. Kullback & Leibler (1951)
  and Blondel et al. (2020) join the chapter's Sources.
- **Chapter 3.** Section 3.1 is retitled "The four points no hyperplane can separate" and
  explains XOR's zero marginal correlation; the historical callout now centers credit
  assignment (Minsky 1961; Minsky and Papert 1969) instead of folklore. Region counts are
  called polynomial in width, and the composed-tent construction (Telgarsky 2016, $2^L$
  pieces from $2L$ units) grounds the depth claim. Section 3.7 drops its chapter
  trailer. Exercises 2, 4, and 6 are disambiguated.
- **Chapter 4.** The introduction no longer names Adam early. Section 4.4 opens on the
  signal/noise mechanism and Strang moves to Sources (§VI.4–VI.5). New paragraphs cover
  the hardware economics of the minibatch and derive momentum from the heavy-ball
  equation, with its low-pass reading. The regularizers gain subsections, AdamW is stated
  in the chapter's own notation, and the dropout ensemble note names the nonlinearity
  caveat. Exercises 2, 5, and 6 are disambiguated.
- **Chapter 14 evidence.** Re-execution restores agreement between the printed training
  trajectories and the prose: the published freeze printed 1.9306 and 0.0425 where the
  text says 1.9190 and 0.0309. Both runs sit inside the reviewed portability ledger.
- **Em dashes.** The author's rule is now "none unless genuinely necessary". The
  manuscript went from 707 to 6 em dashes; the rest sit in a cited title, printed output,
  figure text, or comments. Twenty-six files were edited in four batches and every
  change was reviewed: code, math, URLs, and comments were checked unchanged by script,
  parentheses balanced, and four defects (stripped list indentation, a broken YAML escape,
  two nested parentheticals) were fixed before merging. Recap headings now read
  "Okay, so: …"; four replay fixture literals and one replay anchor follow the new text.
- **Reference audit.** All 207 external links and every prose attribution were checked by
  two independent passes and every finding was verified by hand; no fabricated reference
  was found. Twelve
  defects are fixed: two dead NeurIPS links (Chapters 9 and 11), the epilogue's Table 3 →
  Table 4, the "Wang, Yang, Vidal" byline (four places), the LSTM forget gate credited to
  Gers, Schmidhuber & Cummins (2000), mixture of experts credited to Jacobs, Jordan, Nowlan
  & Hinton (1991), three title/link mismatches (Chapters 17 and 18, Appendix C), Neal's
  year, Chapter 16's EfficientNet product, and an internal file path in Chapter 4's
  Sources. Receipt: `docs/reference-audit-2026-09-25.md`.
- **Tooling.** `scripts/build_tikz.sh` supplies inert `\floatplacement` and `\chapter` so
  standalone figure builds work again after the August macro hooks. The PDF outline now
  has 395 entries.

# Rolling post-v1.3 — nine replays across Chapters 1 to 4 (September 19, 2026)

- The author reviewed the twenty-one lecture films and chose scenes to adapt. A survey of
  all 294 film scenes found few remaining candidates, so these were scoped one by one
  against the manuscript: eleven picks became nine scenes, with two dropped and one
  deferred for want of a printed fixture or because the evidence was a results plot.
- Chapter 2: `sigmoid-squash` (the boundary is where the score is zero; equal pushes buy
  0.2311 then 0.0294) and `surprise-loss` (cross-entropy is not a distance; every halving
  of the belief costs one more log 2, forever).
- Chapter 3: `feature-space` (the cut never bends — the space moves, and the wrong-side
  count falls ten to zero) and `hinge-lift` (one hinge lifts XOR out of the plane; the
  clearance budget is exactly minus the bias, positive only because the rectifier clips).
- Chapter 4: `sgd-zones` (the noise floor never moves; the signal collapses by 22),
  `batch-vote` (jitter falls as one over the root of B, exactly zero at B = n),
  `momentum-memory` (one running sum, two components: one cancels, one stacks) and
  `step-length` (past two over the curvature every landing is higher).
- Chapter 1: `decay-angle`. The author asked for this in Chapter 4 as a story about
  stalled training; the book makes no such claim and its Chapter 1 footnote explicitly
  disclaims it, so the scene shows what the footnote does state — the same nudge rotates
  a larger vector less — and carries that disclaimer.
- Three anchor traps found and fixed in shared tooling: `before-heading` targets are now
  compared in one normalized form on both sides (Pandoc renders smart quotes and strips a
  code span's backticks, so a heading containing either could satisfy neither the filter
  nor the audit), and the audit refuses class names in Quarto's reserved `column-*`
  layout namespace, which silently turn a panel into a full-width grid.
- HTML-only: no manuscript, freeze, filter guard, PDF setting or tag changed. Interaction
  suite: 1,277 to 1,681 tests; the fixture audit now binds 34 scenes.

# Rolling post-v1.3 — Chapter 1 mechanism replays (September 18, 2026)

- Adds the chapter's first three replays, adapted from the Chapter 1 film: a template
  scorer, the column-space projection, and the descent bowl. Each targets a misconception
  the static figures leave standing.
- Template score: the input rotates at fixed length so the shadow slides through zero —
  at exactly 90 degrees the score is exactly zero and the prediction exactly b — then the
  angle freezes and only the template's length changes, so the cosine holds while the
  score halves. Template length is the scene's one control.
- Column space: a candidate prediction slides inside the plane dragging its residual;
  the length bottoms out where the right angle snaps on and grows again past the foot,
  so the minimum is earned rather than announced, and the leftover is unreachable.
- Downhill bowl: the contours stay hidden for thirty seconds — the walker only ever feels
  the local slope. The step is drawn as the first quarter of the gradient arrow, and the
  twenty step lengths collapse by a factor of 172 because the slope does, not a schedule.
- Two tooling bugs the chapter exposed, both fixed: the excerpt filter matched headings
  against Pandoc's rendered text while the fixture audit matched the raw source, so a
  heading containing quotes could satisfy neither; both now compare one normalized form.
  And Quarto reserves every `column-*` class for its own page-layout API — a scene
  stylesheet that coined one turned its panel into a full-width grid and the chapter
  scrolled sideways, so the audit now refuses that namespace.
- The three new suites join `npm test`. Interaction suite: 1,143 to 1,277 tests.
- HTML-only: no manuscript, freeze, PDF setting or tag changed. Receipts:
  `docs/{template-score,column-space,downhill-bowl}-excerpt.md`.

# Rolling post-v1.3 — mechanism replay value pass (September 18, 2026)

- Applies one test to all twenty-two replays: put the first and last frames side by side; if a
  student loses nothing, the motion is not the mechanism. Four scenes failed and were redesigned.
- Derivative gates: the component's face is its activation curve with a tilting tangent tied to
  the backward multiplier; `z` is draggable, so the gate is seen widest at zero and dead at both
  ends; depth is ten equal steps on a log ruler. Mask/predictor: the target row is built by
  sliding a tagged copy of the tokens one slot left. LayerNorm axis: a neighbour token doubles,
  BatchNorm's pooled mean moves and the token's LayerNorm profile does not. Hinge bump: a slope
  ledger and a draggable middle coefficient show why only −2 brings the sum back to zero.
- On author review, LayerNorm's axis change became one continuous turn — the highlight sweeps
  from BatchNorm's column to LayerNorm's row about the cell they share — and the column stays
  as a muted ghost until the closing test, so the contrast is never off screen.
- Every panel now closes with one hidden-answer transfer question; a new suite recomputes all
  twenty-two answers from the declared fixtures. Interaction suite: 1,087 → 1,139 tests.
- Contract: the first/last-frame test and the transfer-check rule join
  `docs/animation-authoring.md`; new on-screen values are declared computed variants.
- HTML-only: no manuscript, freeze, filter, PDF setting or tag changed. No scene added or
  retired. Receipt: `docs/excerpt-value-pass.md`. Verify the publishing run before claiming
  deployment.

# Rolling post-v1.3 — mechanism replay review pass (September 17, 2026)

- Independent review of the twelve replays added since `0674cab`, then fixes. Every number
  already matched its chapter; the defects were in teaching and legibility.
- Derivative gates no longer shows its answer while asking for a prediction. Mask-before-softmax
  now moves: the padded scores slide to negative infinity and the freed weight visibly lands on
  the real keys. Scale granularity draws storage as a byte-scale bar and makes its sub-pixel
  zero bin findable. Attention bill traces a visible token and puts ×16 and ×4 on their marks.
  Preference ruler, reference tilt, score field, same subspace, mask/predictor, greedy tree,
  SVD circle and LayerNorm axis receive the smaller fixes listed in the receipt.
- All nineteen grammar scenes now show one boundary sentence; every other caveat, unchanged,
  sits in a closed "Scope and caveats" disclosure. Three script-free phone prints that sat low
  over their formula are anchored. True minus signs and `× 10ⁿ` replace ASCII on the picture.
- Contract updates in `docs/animation-authoring.md` (prose budget, plain-text number format,
  never spoil a prediction, four-decimal geometry). Interaction suite: 1,018 → 1,087 tests.
- HTML-only: no manuscript, freeze, filter, PDF setting, numerical gate or tag changed.
  Receipt: `docs/excerpt-review-pass.md`. Verify the publishing run before claiming deployment.

# Rolling post-v1.3 — Chapter 11 greedy versus beam (September 13, 2026)

- Adds the author-approved shared probability table and complete-sequence
  counterexample before its optional animation. The static example belongs to
  HTML and both derived PDF profiles; the player is HTML-only.
- Keeps the predictor fixed, includes EOS in path probabilities, and bounds
  unspecified alternatives without inventing continuations. The existing date
  experiment remains separate and its numerical evidence unchanged.
- Reuses the compact deferred SVG player and native-width phone layout. No new
  browser dependency, training, numerical tolerance, runtime migration or tag.
- Plants later decoding lessons through visible prefix conditioning, distinct
  width/depth labels, and a top choice among two completed candidates when one
  answer is requested (the chapter code retains its ranked-list return contract).
  Keeps later architecture names in the research/arc notes, not the early scene;
  beam ranking is never relabeled as speculative verification. This follow-up
  does not alter the shared manuscript, numerical evidence or derived PDFs.
- Source and acceptance receipt: `docs/greedy-tree-excerpt.md`. Author-approved
  for publication; verify the publishing run before claiming deployment.
- Marks the derived PDFs as rolling and advances the deterministic content date
  to September 13. The stable v1.3 citation, archive, and tag remain unchanged.
- Full local repagination: print 548 → 548 pages; continuous 519 → 520.
  The new search subsection adds one outline entry (390 → 391 in each profile).
  Updates the rolling download count and that exact outline invariant; stable
  v1.3 artifacts and historical release counts remain untouched.

# Rolling post-v1.3 — scale granularity (September 13, 2026)

- Adds the author-approved Chapter 17 fixed-8-bit replay: the source audit's quiet
  row fits inside the shared grid's zero bin; a per-row scale resolves its range.
- Separates the maximum-magnitude endpoint witness from a general rounding bound,
  and scale metadata from unchanged packed payload. No fabricated film samples.
- Extends the exact heading insertion match to H3, keeping both Chapter 17 players
  independent and outside collapsed code. No new anchor type or shared runtime.
- Native, deferred SVG; no manuscript, frozen output, numerical gate, PDF setting
  or stable-tag change. Receipt: `docs/scale-granularity-excerpt.md`.
- Next: LayerNorm axis as a separate local preview, not part of this publication.

# Rolling post-v1.3 — preference ruler (September 13, 2026)

- Adds one author-approved Chapter 18 replay of its existing Bradley–Terry witness:
  move two scores together, track their unchanged gap, and read the same preference
  probability. The ruler follows the pair without changing its unit spacing.
- Keeps absolute goodness, scaling and cyclic preferences outside the invariant.
  No new experiment, control, dependency, manuscript, freeze or numerical gate.
- Stabilizes probability-derived drawing coordinates without rounding the raw
  probability; a controlled ULP regression protects both static fallbacks.
- Source, browser and publication receipts: `docs/preference-ruler-excerpt.md`.
  Chapter 17 scale granularity is next for separate local review, not this push.

# Rolling post-v1.3 — SVD circle (September 13, 2026)

- Adds one optional Appendix A view of the existing SVD fixture: follow two marked
  input directions through coordinate alignment, scaling and output rotation, then
  see rank-one truncation collapse the ellipse to its longer axis.
- Fixed equal-unit ruler, native SVG/shared playback, and matrix-error boundary.
  No new experiment, dependency, manuscript content, PDF or frozen output change.
- Same-subspace was separately approved and pushed as `2439557`; publishing run
  `34727889922` passed, with live player and unchanged PDFs verified. The author
  approved SVD with “push and do the next”; the preference ruler is next for
  separate local review.
- September 13 acceptance: 793 interaction tests, all source/HTML/fixture audits,
  unchanged frozen stdout/LaTeX, and desktop/phone playback and fullscreen checks.
- Source/verification receipt: `docs/svd-circle-excerpt.md`.
- Publication follow-up: Linux CI caught last-bit coordinate differences in the
  exact static-SVG comparison. Quantize drawing serialization, not SVD arithmetic;
  retain exact fallback equality and add a perturbed-math regression test. No
  manuscript or numerical-tolerance change.

# Rolling post-v1.3 — same subspace, different coordinates (September 12, 2026)

- Adds one author-approved optional autoencoder-interlude view of the existing orthogonal
  change-of-basis identity. Rotate the basis, read new coordinates, and add the
  new coordinate-weighted vectors back to the same reconstruction.
- Explicitly schematic, not the later rank-one training experiment. No new
  dependency, numerical experiment, manuscript fixture, PDF content or frozen output.
- Mask before softmax was separately approved and pushed as `6cde283`; publishing
  run `34601697930` passed and its live HTML/player/PDFs are verified.
- Greedy tree remains deferred: its per-token probability fixture is not in the
  manuscript. See `docs/same-subspace-excerpt.md` for source and review receipts.
- Local verification: 748 interaction tests, all source/HTML audits, unchanged
  frozen stdout and interlude LaTeX. Desktop/phone diagrams and playback inspected;
  native fullscreen entry/exit and layout also pass in the fresh in-app session.

# Rolling post-v1.3 — mask before softmax (September 11, 2026)

- Prepares a separate optional Chapter 13 normalization walkthrough from the
  exact four-key row already behind the source-padding-mask figure. Zeroed padded
  logits still contribute to the denominator; negative-infinity masking excludes
  them. The all-masked-row guard remains explicit.
- Closes the earlier seeded-fixture concern with an extraction recipe and exact
  source/snapshot receipts. No new example, training run, numerical gate, QMD,
  freeze, PDF configuration, or release tag is introduced.
- Reuses lightweight shared playback and responsive SVG. The author approved
  publication; `docs/mask-before-softmax-excerpt.md` tracks checks.
- Attention bill was separately pushed as `061eff3`; publishing run `34595314339`
  passed all jobs, with live player and both PDFs independently verified.
- Local verification passes 705 interaction tests (41 scene-specific), all
  existing source/HTML audits, and exact frozen stdout. Filtered Chapter 13 LaTeX
  is unchanged. Actual desktop and 390-CSS-pixel browser review verified layout,
  playback, pause, scrubbing, expanded view, and closed/deferred/direct-link states.
- Both complete PDF profiles were rebuilt with unchanged text, geometry, outlines,
  and every low-resolution page raster: 548 print / 519 continuous pages.

# Rolling post-v1.3 — attention bill (September 11, 2026)

- Adds a separate, optional Chapter 16 score-grid animation using the existing
  224-pixel / 32-to-16-pixel-patch example. Four times as many tokens require
  sixteen times as many query-key pairs per head, excluding `[CLS]`.
- The follow-up review replaces cosmetic continuous resizing with discrete image
  patch states, traces a patch into both score axes, labels each area tile as the
  entire old grid's area, and compares fourfold token-wise work with sixteenfold
  mixing work. Compact movie controls remain. This is not a time benchmark.
- Reuses shared deferred playback with no new dependency. Source and acceptance
  record: `docs/attention-bill-excerpt.md`. The author approved publication after
  reviewing the linked-patch revision.
- Score field was separately committed and pushed as `ec2e0f6`; this draft changes
  no manuscript, frozen evidence, PDF configuration, numerical gate, or stable tag.
- Local acceptance passes 664 interaction tests, including 42 independent scene
  tests, all existing source/HTML audits, and desktop/phone review. The first
  draft's moiré-prone raster was removed; exact counts and scale are unchanged.
  All 133 stdout blocks remain exact and filtered Chapter 16 LaTeX is unchanged.
- Publication rebuilds retain 548 print / 519 continuous pages and 390 outline
  entries each. Text, geometry, outlines, and every page raster match the baseline;
  both PDF audits pass. HTML remains canonical and is rendered last.

# Rolling post-v1.3 — analytic score field (September 11, 2026)

- Adds an optional Chapter 19 inspection sweep beside the existing fixed
  Gaussian-mixture score figure. Responsibilities weight two signed pulls; a
  midpoint hold shows their cancellation in a low-density valley.
- Keeps density and score vertically distinct, with shared input coordinates and
  an unclipped score range. The prescribed probe motion is not sampling or a
  diffusion replay. The film's changing-noise phase is not ported.
- Uses the existing deferred SVG/JavaScript transport, keyboard playback,
  reduced-motion beats, transcript, and generated responsive static fallbacks.
  The source/acceptance receipt is `docs/score-field-excerpt.md`.
- This author-approved scene is separate from reference tilt, pushed as `bc1133f`.
  No manuscript, freeze, PDF configuration, numerical gate, or release tag changes.
- Local acceptance passes 622 interaction tests (42 specific to this scene),
  frozen HTML/source/fixture audits, and desktop/phone browser review. All
  133 stdout blocks remain exact; Chapter 19's filtered LaTeX is unchanged.
  The author approved publication after browser review. Chapter 16's attention
  bill remains a separate next local-review task.
- Complete publication PDF rebuilds preserve 548 print / 519 continuous pages,
  with identical text, outlines, geometry, and all-page raster comparisons.
  Final frozen HTML and all existing structural/asset audits pass.

# Rolling post-v1.3 — reference tilt (September 11, 2026)

Add the author-approved optional Chapter 18 reference-tilt player after Figure 18.4.
Four exact policy probabilities move against fixed reference outlines as beta varies;
expected proxy reward and KL are recomputed from the manuscript's existing fixture.
The compact slider pauses playback, and timeline actions restore the authored sweep.
An explicit static beta label and white-backed probability digits keep the phone and
script-free views readable. Shared transport, generated fallbacks, transcript, and
41 independent tests require no new runtime dependency. The complete interaction
suite passes 580 tests. Manuscript, frozen evidence, PDF settings, and tags are unchanged.

The previous publishing run failed an existing Chapter 18 notebook signed-zero
comparison. This revision neither changes that numerical gate nor bypasses CI;
publication status must be checked separately from the source commit.

# Rolling post-v1.3 — animation repairs and response-mask excerpt (September 11, 2026)

Repair the LSTM equation links and give pooling, hinge-bump, quantization, and LSTM
readable phone-width static fallbacks, including when JavaScript is unavailable.
Enlarge quantization/LSTM narrow labels and keep the LSTM state and readout
equations on separate, semantically complete rows.
Update the animation inventory to the ten scenes in `0674cab` and distinguish
softmax's displayed exponential geometry from its max-subtracted computation.
Remove two machine-specific scratch scripts; they remain recoverable from Git.

Chapter 18's author-approved excerpt follows a predictor to the next token's
response mask. It distinguishes changing excluded output logits from changing the
prompt context. This is an optional HTML explanation of the existing audit, not new
numerical evidence. No manuscript, frozen stdout, PDF settings, or release tags change.
The feedback pass adds explicitly illustrative word aliases, aligned shifted
targets, target-attached ×0/×1 gates, and labeled symbolic scores. It keeps prompt
context visible, uses one sequence at a time, and wraps into three-column strips
on phones. No hover-only controls, distribution curves, or dependencies are added.

# Rolling post-v1.3 — kernel weighting and BERT masking (September 9, 2026)

Two optional HTML-only excerpts now accompany the existing Chapter 12 Gaussian
lookup and Chapter 15 Boolean masking ledger. Kernel weighting reveals the fixed
calculation before moving its query; BERT separates corrupted input from original
targets and shows why unchanged selected tokens still contribute to the loss.
Both use the manuscript's fixtures, the semantic palette, responsive layouts,
compact deferred playback, and transcripts/static fallbacks. A small common
transport supports both; the published convolution player is unchanged.

Kernel weighting is author-approved and unchanged. The BERT review adds paired
original/input tokens, progressive input/prediction/target rays, a delayed
unchanged-token payoff, and a collapsed Boolean inspection panel. Reduced motion
uses discrete reveals. Direct links now open a targeted nested disclosure itself.
All 86 interaction tests and the frozen-output checks pass.

Both players are approved for publication after local review. This is an HTML-only
rolling revision, not a new stable edition. The reusable reference in
`docs/animation-authoring.md` explains all three players and their acceptance rules.
No manuscript, frozen numerical evidence, PDF content, or stable tag changes.
Source receipts and the review anchors are in `docs/kernel-bert-excerpts.md`.

# Rolling post-v1.3 — Chapter 7 convolution walkthrough (September 9, 2026)

An optional, closed-by-default animation beside the 2-D recipe walks through one
patch, nine products, one sum, and the four output positions. It adapts the
instructor's existing PatchScore scene to the book's semantic palette and responsive
layout. The player loads only when opened and starts paused. Movie-style controls
offer Play/Pause, 0.5x–2x speed, continuous scrubbing, elapsed time, Replay, and
fullscreen (or an expanded modal view). Discrete keyboard controls remain available.
The window slides smoothly while products and sums stay tied to integer patches;
reduced-motion preferences disable interpolation. A static calculation and
transcript remain available if scripting is unavailable.
Playback defaults to 1.5x. On-diagram rays replace the position selector: a matched
pixel and fixed weight meet at a multiplication point, then reach their product.
In the next phase, all nine products feed an addition point and its outgoing ray
reaches the current output. The two-by-two matrix layout reserves space for these
connections; they reflow with the pane and clear during placement and sliding.
The transport is a single compact on-pane bar with accessible Play/Pause and
fullscreen icons, scrubber, clock, and speed. Play becomes Replay at completion;
keyboard stepping replaces the separate Previous/Next/Reset row.
It is labeled as a walkthrough of Exercise 1 so the answer is not presented as a
new experiment. No frontend dependency or video payload is added.

Approved for publication after local review. The publishing workflow now requires
the existing HTML interaction suite as well as notebook validation; its Node
dependencies are test-only. Manuscript sources, frozen numerical evidence,
notebook-generation rules, PDF settings, and stable tags are unchanged. The existing
pipeline still rebuilds and audits both PDF editions. Source and format boundaries
are recorded in `docs/convolution-excerpt.md`; the separately reviewed next-animation
roadmap is in `docs/backlog.md`.

# Rolling post-v1.3 — lighter HTML reading controls (September 8, 2026)

Plan → Code panels now offer **Reveal results** independently of source code.
Selecting a plan step or Show all code still restores the complete listing and
its original output order. Native browser search can reveal a printed result
without opening the code; Escape and keyboard controls retain their existing
behavior. Chapters 14 and 20 keep their prose-output wrapping in both views.

Wide tables now scroll inside the reading column, with a keyboard focus target
and inspection hint only when they actually overflow. Captions and native table
semantics remain intact. Inline code can wrap without changing source listings.
The changes reuse the existing browser scripts and add no browser dependency.

This is an HTML-only maintenance release, separate from the pending numerical
runtime migration. Manuscript sources, frozen results, notebook and publishing
pipelines, PDF settings, and stable release tags are unchanged. The content-date
stamp remains September 2: this pass changes the controls, not the manuscript.

# Rolling post-v1.3 — executable notebook path (September 2, 2026)

Twenty-six chapter, interlude, and foundational-appendix pages now offer both a
downloadable notebook and an Open in Colab route. The notebooks are generated from
the canonical manuscript at publication time: they retain the 193 learner-visible
Plan → Code surfaces, omit 93 hidden plotting and layout harnesses, and add one
commit-pinned bootstrap that installs exact runtime versions and verifies every
downloaded data or module artifact by SHA-256. The one intentionally partial API
listing remains a non-executable listing rather than being silently repaired.

Publication now executes both the compact notebook and a full Quarto-derived reference
from clean temporary directories in six checked shards. Their learner-visible stdout
must agree byte for byte on the same runner. A second, explicit portability ledger
compares that output with the committed HTML freeze: exact is the default, while only
reviewed numerical or structural differences may pass. Only the unexecuted source
notebooks that passed both checks enter the `gh-pages` bundle. The Preface, Epilogue,
and two non-executable appendices retain an honest unavailable placeholder; the five
Part transitions remain quiet. This is an HTML-only delivery change, so the fixed v1.3
PDFs remain unchanged at 548 and 519 pages.

# Rolling post-v1.3 — searchable code and deferred web assets (September 2, 2026)

Collapsed Plan → Code panels now participate in native Find-in-page. A match inside
source code opens the owning panel and activates the plan step whose bracket marker
owns that line; matches in an output open the complete panel. The explicit Show-all,
Escape, keyboard, and no-JavaScript paths remain available, and browsers without
`hidden="until-found"` support retain the earlier collapsed behavior.

The exact MathJax 4.1.3 build now uses its lazy-typesetting component for inline and
unnumbered mathematics. Numbered equation containers remain eager so cold Quarto
cross-reference targets stay fully laid out; the heaviest mathematical pages guard
both the numbering sequence and complete-scroll behavior.
The first content image on each page remains eager while later images load and decode
lazily. The free-PDF landing page prefers a 230,262-byte WebP cover and keeps the
original PNG as both browser fallback and PDF source. This pass changes only the
canonical HTML; the fixed v1.3 PDFs remain unchanged at 548 and 519 pages.

# Rolling post-v1.3 — HTML source and lecture tools (September 2, 2026)

The canonical HTML now exposes one direct repository Source control on all 35 QMD
pages while leaving the book's stepwise Plan → Code interaction in sole control of
code visibility. Thirty non-Part reading pages also receive a compact chapter-tools
strip with public DS 6050 lecture resources and a reserved notebook slot. Twenty-seven
pages have a specific video, slide deck, or course segment; the Preface, Epilogue, and
notation appendix use the complete-course playlist rather than a false one-to-one
match. The five Part transitions remain quiet.

This is an HTML-only rolling build after v1.3. The tagged v1.3 edition remains the
fixed citation and outreach target, and both released PDF files remain unchanged.

# v1.3 — course-arc part pages and stable publication contract (September 2, 2026)

Five short transition pages now make the book's argument visible at Part scale. Each
names the fixed object entering the Part, the move that becomes learnable, the
structure deliberately built in, and the failure handed forward. Part III is now
**Sequences: Learning the Summary** and Part V is now **The Pretrained Era: Learning
What to Reuse**; the canonical HTML, sidebar, route table, PDF openers, contents, and
outline agree.

The stable release gathers the post-v1.2.1 front-door and publication work into one
fixed target. The HTML edition is canonical and exposes five linked Part pages among
37 rendered pages. Its two derived 0.85-inch PDFs contain 548 print pages and 519
continuous-screen pages. The 390 existing outline entries all resolve to their
rendered headings; the five Part bookmarks moved to the new openers rather than being
duplicated. The outline fixpoint now accepts wrapped multi-block titles without
weakening its page-level destination check.

The weekly execution workflow retains every download-page semantic check while
explicitly exempting only the two generated PDF files that its HTML-only job does not
build. Both execution and publication now pin Quarto 1.10.18. All 133 frozen stdout
blocks remain unchanged, and the complete structural, source, HTML, public-anchor,
cross-reference, glyph, text-layer, geometry, accessibility, and PDF-outline gates
pass for the release artifacts.

# Rolling post-v1.2.1 — independent front door and exact PDF navigation (September 2, 2026)

The Preface now states the book's self-contained scope, distinguishes its executable
read–predict–run–audit loop from several standard references, and gives readers a
compact five-part map of what becomes learnable and which failure opens the next part.
Cross-volume pointers are optional further routes rather than dependencies, with a
warning-only HTML advisory guarding that boundary. At phone widths, the route table
keeps readable columns inside a local keyboard-operable inspection region.

The web publication contract now requires source-authored alternatives for every main
figure, canonical metadata and a deterministic content-revision stamp on every page,
and a keyboard-first skip path on the branded 404 page. A narrow post-render shim fills
only alternatives that Quarto drops on frozen custom-float paths; it never overwrites
non-empty renderer output. Temporary review markers have been removed from both source
and sanctioned frozen artifacts.

Both PDFs now pass a general navigation invariant: every one of 390 outline entries
must land on the page containing its rendered heading. Starred headings create their
anchors after page breaking, and a bounded helper requires two consecutive renders
with identical page count, outline, and printed-ToC state while also rejecting stale
outputs. CI pins the validated Quarto 1.10.18 renderer so that this navigation contract
cannot drift under a silent toolchain update. The experiment interlude's two `EX.` tables remain in place without suppressing
the estimand derivation between them. The resulting 0.85-inch editions are 538 print
pages and 514 continuous-screen pages. All 133 frozen stdout blocks remain identical
to the pre-pass snapshot, and every HTML/TeX pair agrees.

# Rolling post-v1.2.1 — quieter navigation and a free-PDF landing page (August 20, 2026)

The canonical HTML now starts ancillary surfaces closed: **About this edition**,
**Revision notes**, and the six root chapter groups. Quarto still opens the active
chapter's parent Part for orientation, while narrative tips, traps, and retrieval
checks remain visible. Collapsible callout headers and chapter groups are keyboard
operable, their controls carry specific accessible names, and a deep link opens the
disclosure containing its target.

The left sidebar now opens a cover-led PDF landing page directly below the book title,
with a depth-correct path from every nested chapter. Both the print and continuous
editions remain direct free downloads. The page states a $0 minimum, marks $20 as the
suggested optional contribution, and links that amount directly to Buy Me a Coffee.
It does not reproduce a redundant amount picker that cannot transfer the choice, and
support never gates either file. A small decorative coffee mark accompanies the
Preface support heading without adding assistive-text noise. These are HTML
presentation changes; both derived PDFs remain 536 and 513 pages with unchanged
manuscript content.

# Rolling post-v1.2.1 — PDF cover and open-book support (August 19, 2026)

Both derived PDF editions now open with the author-supplied cover. The artwork is a
presentation layer before the ordinary searchable title page and title verso; its
3:4 aspect ratio is preserved against a matching full-page background rather than
stretched to Letter proportions.

The end of the Preface now offers one optional way to support continued corrections,
new figures, and open releases. The contract is explicit in every format: the complete
book remains free to read and download at $0, contributions unlock no additional
content, and readers may contribute through one stable Buy Me a Coffee link.

The cover and support invitation repaginate the two-sided print PDF from 534 to 536
pages and the one-sided continuous-screen PDF from 511 to 513 pages. Both full
conversions pass the structural, cross-reference, geometry, text-layer, glyph,
accessibility, cover, and support-link audits; the canonical HTML passes its desktop
and phone-width responsive checks.

The clean-checkout publication path now self-updates TinyTeX before installing layout
packages and materializes committed frozen figures into Quarto's transient PDF
directories before each PDF profile. CI therefore no longer depends on ignored
workstation build residue. The Pages step publishes that audited bundle without a
second render.

# Rolling post-v1.2.1 — portable web identity and finishing pass (August 8, 2026)

The canonical HTML now carries a book favicon, a concise description, Open Graph and
Twitter-card metadata, a 1200×630 social card, and machine-readable citation fields on
every Quarto page. A branded `404.html` returns lost readers to the table of contents.
The MathJax URL is pinned exactly at 4.1.3, and the UVA link blue is darkened from
`#5379AA` to `#4A6E9D` so ordinary links clear WCAG AA on white. The landing-page
thesis line receives one restrained Rotunda-orange rule; the surrounding Cosmo/UVA
design remains unchanged.

The experiment interlude's tables now use the independent `EX.` namespace in both
formats, matching its figures. Each interactive Plan → Code panel remains closed at
first but adds an explicit **Show all code** control. Long prose-like stdout in
Chapters 14 and 20 wraps locally on narrow screens, while code retains horizontal
inspection. Two soft raster figures are re-exported at 1590×1215 and 1954×1368.
Public source lists no longer cite inaccessible instructor artifacts; hidden
provenance comments retain the audit trail. Dataset sources now receipt Fashion-MNIST,
ImageNet, SqueezeNet, and WikiText, and Appendix D records the recurring temperature
symbol alongside the book's other scalar knobs.

Acceptance: 194 learner-visible Plan → Code surfaces and 95 execution-only harnesses
pass; 285 executable cells, four transclusions, and thirteen modules/scripts parse;
all 133 frozen stdout blocks remain byte-identical. The complete canonical HTML and
both 0.85-inch PDF conversions pass structural, asset, cross-reference, text-layer,
glyph, geometry, and accessibility audits. The derived print PDF is 534 pages and the
continuous-screen PDF is 511 pages.

# Rolling post-v1.2.1 — interactive Plan → Code mapping (August 8, 2026)

The canonical HTML edition keeps each Plan visible while its Code region is closed.
Selecting a numbered plan item reveals the executed cell and highlights the source
region begun by its matching bracket-only marker; selecting it again or pressing
Escape closes the code. Mouse, Enter/Space, fused-marker, long-panel,
transcluded-listing, and narrow-screen paths share one implementation. Numbers,
focus, and an inset rule make the state legible without depending on colour.
The publication pipeline now renders the canonical HTML bundle after both derived
PDFs, then audits every page's local stylesheet and script references. This prevents
a PDF profile from pruning shared `site_libs` and leaving an otherwise valid website
unstyled.

Figure 9.1 is rebuilt from its TikZ source with a compact component grid, separate
block-to-stack connectors, and a residual skip confined to its own row. The SVG
scales fluidly at ordinary widths; below phone width a reusable wide-figure rule
classifies unusually wide artwork by intrinsic aspect ratio and preserves legible
labels inside a local, keyboard-accessible horizontal inspection strip while the
caption and page continue to reflow. The standalone TikZ builder now supplies the
Quarto-created counters and accessibility placeholders expected by the shared book
preamble. Both derived formats pass the geometry, text-layer, missing-character, and
accessibility checks.

Figure 1.9 now makes its middle panel a literal vertical slice through Panel A:
both retain output on the vertical axis, Panel A marks $x_0=0.65$, and Panel B replaces
cosmetic jitter with seeded prediction and fresh-outcome density profiles. Separate
dimension columns identify bias, prediction variance, and irreducible noise; the
caption states that the spread arrows show $\pm 1$ sample standard deviation while the
decomposition uses squared bias and variances.

Chapter 1 completes its semantic-colour pass across the dataset contract,
empirical/population risk, MSE residual, gradient update, Gaussian likelihood, ridge
objective, bias--variance decomposition, and linear-to-neuron bridge. Inputs remain
blue, learnable parameters orange, targets purple, predictions green, and
residuals/errors wine in both the equations and their immediate explanations. Long
numbered displays use authored breaks plus a phone-width size adjustment, with local
horizontal scrolling retained as the no-clipping fallback. The combined August 8
revision repaginates the derived print PDF from 530 to 534 pages; the later web
finishing pass leaves print unchanged and brings the continuous-screen PDF from 508
to 511 pages.

# Rolling post-v1.2.1 — statistical-learning coherence pass (August 6, 2026)

Appendix E, **Statistical Learning Contracts**, now gathers the probability and
estimation contracts already used across the manuscript: empirical versus population
risk, transformed and deployment distributions, likelihood-derived losses, the
Gaussian assumption and its limits, KL/Jensen--Shannon/Wasserstein comparisons,
Monte Carlo estimator cases, and uncertainty reporting. The appendix is a retrieval
layer, not a prerequisite; Chapters 1, 4, 6, and 18 remain self-contained and point
there only when the full audit chain is useful. Prince's *Understanding Deep Learning*
served as a reference-only completeness crosscheck; the exposition, examples, and
exercises remain independently authored.

Chapter 1 replaces the static bias--variance cartoon with a seeded three-panel
show-then-name experiment. Chapter 6 separates representation, optimization, and
generalization claims before its failure demonstrations and strengthens its capacity
exercise with an evidence-boundary audit. Chapter 18 makes explicit that behavioral
alignment is one contract inside a broader ethics and governance assessment.

Acceptance: 194 learner-visible Plan → Code surfaces and 95 execution-only harnesses
pass; 285 executable cells, four transclusions, and thirteen included modules/scripts
parse; all 133 frozen stdout blocks remain byte-identical. The canonical HTML has no
page-level overflow at a 390-pixel viewport. At the shared 0.85-inch margin, the
derived print PDF is 530 pages and the continuous-screen PDF is 508 pages.

# Rolling post-v1.2.1 — compact PDF editions (August 5, 2026)

Both derived PDF editions now use a uniform 0.85-inch margin, reduced from 1.1
inches. The default two-sided print PDF repaginates from 560 to 524 pages. A new
one-sided, open-any continuous-screen PDF establishes a 539-page old-margin baseline
and repaginates to 502 pages at the shared 0.85-inch margin. HTML and manuscript
content are unchanged.

The continuous profile has its own output filename and is rendered, audited, and
published beside the print PDF. The PDF geometry audit now reads the configured
uniform margin rather than hard-coding the former text edge. Both editions retain
the three-pass LaTeX, outline, cross-reference, text-layer, missing-character,
media-box, and accessible-icon gates. Plan boxes use a locally scoped line-breaking
opportunity after underscores so long helper names wrap inside the text block rather
than crowding the physical page edge.

# Rolling post-v1.2.1 — print hardening (August 2, 2026)

The derived PDF now wraps long learner-visible code and frozen stdout instead of
silently placing glyphs beyond the paper edge. Visible Python is also guarded at 88
columns, while pure execution harnesses and Quarto directives remain exempt. A new
geometry audit treats any text outside the media box as a release failure and reports
smaller text-block intrusions for visual review.

Three LaTeX passes are now the minimum for the full print conversion. The PDF audit
checks late-book outline destinations and unit namespaces, preventing stale Chapter 20
and epilogue pagination from shipping. The rolling title page identifies the build,
and the title verso records copyright, licenses, the canonical HTML edition, stable
citation guidance, and the UVA affiliation.

The same pass repairs the literal RNN cross-reference token, the Chapter 17 page-break
orphan, and the remaining `minibatch`, `color`, and `log-likelihood` terminology
stragglers. All 133 frozen stdout blocks remain byte-identical. The complete derived
PDF is 560 pages and contains no off-paper text or missing glyphs.

# v1.2.1 — reciprocal companion interface (August 2, 2026)

This point release establishes the cross-book contract with *Deep Learning: Making It
Trainable*. Ten public chapter anchors are declared in `docs/public-anchors.md` and
checked in both source and rendered HTML. Five bounded forward pointers separate the
first-course mechanics owned here—precision/performance, experiment discipline,
backpropagation, normalization, and attention/Transformer assembly—from their graduate
diagnostic continuations. The colophons now point in both directions.

# v1.2 — comprehensive audit and convention parity (July 29, 2026)

Editorial and structure: repaired text-mode mathematical glyphs, established one
closing retrieval check per numbered chapter, removed off-page lecture narration,
standardized the three exercise modes, and promoted attention-as-test-time-regression
to its own interlude. The Transformer, BERT, generative-model, and performance
chapters gained compact mechanism-first bridges and diagrams without adding a GPU
experiment.

Production: interludes use independent figure namespaces in HTML and PDF; the build
checks the PDF text layer and LaTeX log for missing glyphs; callout icons carry empty
accessible replacement text; and release metadata identifies v1.2 as the stable
552-page edition while `main` becomes a rolling post-release build. A follow-on
Chapter 15 editorial pass removes remaining off-page/session splice residue, adds a
strict leak-vocabulary tripwire, clarifies the original GRU gate convention, and adds
the controlled-lab schematic plus the three-family visibility triptych.

The July 29 closeout gives the epilogue its own `E.` figure namespace, states
explicitly that HTML is canonical and PDF is its derived print conversion, restores
the original RMSProp slide-deck provenance, and makes every interlude both visibly
named and retrieval-complete. A twelve-item exercise-bank review adds ten genuinely
new exercises and strengthens two existing ones across Chapters 3, 5, 6, 9, 11, 12,
15, 16, and 19 plus the experiment interlude.

The final July 29 receipt-and-callback follow-up extends Sources coverage through the
epilogue, grounding its test-time-control and mixture-of-experts claims in their
primary papers, and voices the book's learnability question explicitly in Part III:
recurrence makes the carried summary learnable.

The Chapter 20 deep pass closes the book's temperature arc. A compact bridge now
connects Chapter 12's bandwidth, Chapter 13's similarity scale, and CLIP's learned
logit scale; a three-part exercise derives the scale gradient, runs a paired
fixed-versus-learned comparison, and separates training sharpness from post-hoc
calibration. The source note distinguishes the cap reported in the CLIP paper from
the uncapped released reference implementation.

The closing Part II certification finds no mathematical defects in Chapters 7–9
and repairs Chapter 9's two remaining splice typos. An independent source-level
re-execution reproduces every printed Chapter 15 lab value; CI now preserves that
lab's self-contained design by rejecting repository-local imports or transclusions.

The release polish restores Chapter 16's already-authored post-hoc temperature
calibration exercise to both frozen editions, leaves epilogue equations unnumbered,
and standardizes `minibatch` and `feedforward` in authorial prose while preserving
exact paper titles and code identifiers. A targeted PDF regression check protects
the searchable text beneath the intentionally nonsensical no-position Transformer
sample on page 316.

Acceptance: 194 learner-visible Plan → Code surfaces and 94 execution-only
harnesses pass the strengthened audit; 284 executable cells, four transclusions,
and eleven included modules/scripts parse; all 133 pre-existing stdout blocks remain
byte-identical across the structural move and between HTML and TeX; and the complete
v1.2 book renders in 552 pages, below the prior 560-page ceiling.

## Earlier post-v1.1 work — Chapter 1 and universal code-surface revision

Editorial: Chapter 1 now carries one semantic colour contract across equations,
nearby prose, and conceptual diagrams; Figure 1.1's first-row annotation is
corrected; the early visualization loop is distinguished from the complete
three-way implementation; and the regularization close is ridge-only, with the
Lasso comparison and Figure 1.9 removed.

Code: all 201 learner-visible Plan → Code surfaces use compact bracket-only
markers (`# [1]`, including fused forms such as `# [2][5]`). The audit rejects
descriptive marker suffixes; the 28 `echo: false` execution-only cells remain
exempt.

Acceptance: all 229 executable cells/modules parse, the accepted 266 frozen
stdout blocks remain byte-identical, and the complete HTML/PDF render remains
536 pages.

## v1.1 — the readable-code and estimator-discipline release (July 2026)

Pedagogy: the learned-feature-space figure (ch. 3); the forget-gate diagnostic
(ch. 10); seven predict-before-run prompts; two provenance notes on RMSProp and
weights-as-images; digit-embedding (Audit.) exercise
(ch. 13); mixture-of-experts in the epilogue's roads-not-taken.

Code: the equation/kernel/harness contract with the five-part visibility test
(style guide); canonical listings as tested source — dlbook module with Listing
4.1 (fit_supervised) and Listings 10.1/10.2, printed once via include, imported
by chs. 6/8/14 which show only their deltas; pure-harness cells folded.

Estimator discipline: "What a batch may estimate — and what it may not"
(ch. 4, three cases); case-named reminders at chs. 11/15/18/19/20; the ch. 19
"Why this batches" bridge and two verified (Audit.) traps (the β·D_x reduction
identity; the aggregate-posterior Jensen bias, β-TC-VAE cited).

Infrastructure: weekly Execution Audit (from-scratch re-execution of every
cell); include-code-files vendored; docs/compatibility.md is the living home of
version-fragile engineering (Appendix B points there).

Acceptance: every refactored chapter verified content-bit-identical against its
pre-change build. Page count 502 vs v1.0's 498: Plan-v2 changes net ≈ −1 page
(folds and dedup paid for the new sections); the +4 traces to the six
author-commissioned conceptual figures that preceded the plan's ceiling.
