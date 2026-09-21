# Mechanism animations: reference and authoring contract

Author-approved September 9, 2026. These are optional HTML explanations of existing
book examples, not videos, new experiments, or a replacement for the static book.
**Chapters 1 to 4 replays — September 19, 2026:** nine further scenes from the author's film
picks, each scoped against the manuscript before it was built. Two rules were reaffirmed by
dropping picks: a table is not a mechanism however it animates, and a scene whose evidence is
measured accuracy is a results plot. A third was added: when a pick's stated rationale is not
a claim the book makes, build the claim the book does make and carry its caveat — the
`decay-angle` scene shows steering, not stalling, and says so.

**Chapter 1 replays — September 18, 2026:** the author picked three film scenes for Chapter 1
(template scorer, column space, descent bowl); all three ship. Two rules follow from building
them: a `before-heading` target is compared in a normalized form, so plain ASCII quotes in the
manifest match the typographic ones Pandoc renders; and a scene may not coin a class in
Quarto's reserved `column-*` layout namespace — `scripts/audit_excerpt_fixtures.py` refuses
both mistakes.

**Value pass — September 18, 2026:** every scene was judged by the first/last-frame test
("Earn the animation", below); four failed and were redesigned, and every panel now closes
with a transfer check. See [the value-pass receipt](excerpt-value-pass.md).

**Review pass — September 17, 2026:** an independent review of the twelve newest scenes led to
fixes in all of them and to four contract changes below (prose budget, plain-text number
format, never spoil a prediction, four-decimal geometry). See
[the review-pass receipt](excerpt-review-pass.md). No new scene is authorized by it.

**Source state — September 21, 2026:** thirty-eight scenes are registered in
`interactives/manifest.json`, the four most recent being the film picks built together:
[branch accumulation](branch-blame-excerpt.md) (Chapter 5),
[search under a budget](halving-budget-excerpt.md) (the Trainer interlude),
[shift versus shuffle](shift-shuffle-excerpt.md) and
[distance concentration](distance-band-excerpt.md) (both Chapter 6). The same pass fixed
the accent typography named in rule 5 below. `docs/backlog.md` lists what remains scoped
and unbuilt from the author's picks.

**Prior source state — September 13, 2026:** twenty-one scenes are pushed through
`00c0730` (network-first derivative gates). Its publish run `34770754602` is
blocked by a bootstrap HTTP 503 and the known Chapter 18 signed-zero gate.
The twenty-second scene, [greedy versus beam](greedy-tree-excerpt.md), is
author-approved for publication. Its missing static fixture was authorized and added to
the shared manuscript before the animation. All historical numerical evidence
is unchanged. Shared content additions must rebuild both PDF profiles; an
HTML-only player does not make its prerequisite example HTML-only.

Prior checkpoint: twenty scenes were pushed through
`e00d3c5`, including the author-approved [LayerNorm/BatchNorm contrast](layernorm-axis-excerpt.md).
Its publishing run `34766825371` succeeded; verify live assets separately.
Scale run `34764538563` succeeded. Chapter 5 [derivative gates](derivative-gates-excerpt.md)
is author-approved for publication after the network-first revision. Rebuild and
verify before its ordinary push; approval is not deployment. This completes the
ready Wave 4 queue. Greedy tree remains gated on a shared-manuscript fixture.
The static manuscript and all frozen numerical evidence remain unchanged.

Prior source checkpoint: seventeen scenes were pushed on `main`
through `9730659`, including A1's [SVD circle](svd-circle-excerpt.md) and its
static-SVG serialization follow-up. Run `34761906820` passed interaction tests but
failed the existing Chapter 18 exact notebook gate on signed zero; do not bypass it.
Chapter 18's [preference ruler](preference-ruler-excerpt.md) is author-approved for
a separate publication. Chapter 17 scale granularity is next for local review. Their earlier
review history lives in the [Wave 1](wave1-excerpts.md) and [Wave 2](wave2-excerpts.md)
receipts. Check the publishing run and live anchors before treating committed source
as deployed. The current repair pass fixes LSTM equation links and four narrow-screen
static fallbacks. The author approved Chapter 18's mask/predictor for publication
after the shifted-target revision, then requested the next scene: reference tilt
in Chapter 18. That separate scene follows Figure 18.4 and is documented in
[its receipt](reference-tilt-excerpt.md). It was pushed in `bc1133f`; publishing run
`34586598964` is the independent deployment receipt. The analytic score-field
scene in Chapter 19 was separately pushed in `ec2e0f6`; see
[its receipt](score-field-excerpt.md) and publishing run `34589132667`.
Chapter 16's linked-patch attention bill was separately pushed in `061eff3`;
see [its receipt](attention-bill-excerpt.md) and publishing run `34595314339`.
Chapter 13's mask-before-softmax scene is author-approved for publication after
local review and pushed as `6cde283` (run `34601697930`); see
[its receipt](mask-before-softmax-excerpt.md).
The author approved [same subspace](same-subspace-excerpt.md) in the autoencoder
interlude on September 12. Publish it separately, then prepare A1's existing SVD
example for local review. Greedy tree remains gated on a shared-manuscript fixture.
Do not expand it into a full diffusion/training replay. The remaining roadmap is
not blanket authorization.

The author's rejection of dashboard-like first drafts established the
[one-picture visual grammar](#visual-grammar) below. The gate-product revision added
the parameter-control exception and the requirement to make tiny values visually
distinguishable before naming their numerical gap.

### Derivative gates: activity is not sensitivity

[Chapter 5's scene](derivative-gates-excerpt.md) complements One Chain's cached
calculus by exposing a distinction: a large forward activation can transmit very
little backward sensitivity. The author rejected the curve-primary draft because
it repeated the static figure and risked confusing activation shape with signal
decay. The main representation is now a component inside a network, with forward
values held visible while a separate unit sensitivity crosses its derivative in
reverse. Small activation-function insets explain the component; they are not
depth curves and carry their own vertical axes.

Filled packet area, not radius, represents sensitivity. A hollow locator may keep
a subpixel signal findable, but never supplies a minimum numerical magnitude.
An even-sized source grid can omit zero: an analytic witness there is not a sampled
maximum. Preserve the exact quarter identity and positive finite sigmoid tails.
The ReLU function has an explicit zero vertex; a tangent is omitted at its kink,
where PyTorch's backpropagation convention must not be called a classical derivative.

The September 18 value redesign keeps that network-first picture and makes the cause
visible inside it. The active component's box carries its own activation curve as its
face, with the operating point and a tangent of fixed drawn length; a link ties that
tangent to the backward multiplier, which reads `× slope`. `z` is the scene's one
control (timeline-driven, draggable over the declared domain), so the reader can find
what two frames cannot show: the gate is widest at zero and dies on both sides. On the
timeline the slope stays withheld until the probe crosses; a dragged `z` shows it live.

The continuation isolates best-case sigmoid factors in connected multiplier
components, with integer counts and explicit numerical readouts. Because a sub-pixel
packet cannot be the payoff, one log ruler under the path carries a marker through ten
equal steps to `9.54 × 10⁻⁷`, while an active-ReLU mark stays at 1. This is not a
simulated ten-layer forward network or a bound on the complete gradient. Weight
matrices and branching are omitted from that calculation, not assumed harmless.

### Greedy versus beam: search changes the frontier, not the predictor

One fixed tree supports two walks. The frontier first commits to the locally
stronger edge; only after its factors are traversed does the complete-path product
appear. Reset the frontier and carry two prefixes instead. Expansion exposes the
prefix ranking before pruning, so the winner is earned rather than announced.
The phone layout rotates the two rails into columns at native label size.

The shared table owns every conditional probability. An `other` branch aggregates
unspecified alternatives: show its mass as an upper bound on each omitted prefix
or completion, not as one invented token. Include EOS in each completed score,
sum conditional log scores, and do not renormalize over the displayed beam.
This tree certifies its winner; finite-width beam search has no such guarantee
in general. No claim about the date model is inferred from the constructed example.
Use the common transport, no extra parameter controls, and native-size phone reflow.

For later-topic seeds, expose a dependency already present rather than import the
later algorithm's vocabulary. Chapter 11 now colors supplied prefixes blue,
labels conditional edges with their own history, separates width from depth,
and distinguishes retained candidates from the top choice for one requested answer.
Keep the chapter helper's ranked-list return contract explicit. Those cues
prepare multi-token and speculative-decoding discussions without naming them in
the scene. Beam keep/prune is not draft accept/reject; a joint sequence score is
not an acceptance probability. Record the future harvest and primary sources in
the scene receipt and arc ledger, not in an extra dashboard or premature lecture.

## The first ten committed examples

| Location | What the reader follows | Teaching boundary |
|---|---|---|
| [Chapter 7: convolution](https://shakeri-lab.github.io/dl-book/chapters/part2/07-filters-convolution.html#convolution-excerpt) | Place a patch, multiply matching entries, add the products, write one output, then slide. | This is the existing Exercise 1 walkthrough. The kernel is fixed and unflipped; no training, padding, bias, or activation is added. |
| [Chapter 12: kernel weighting](https://shakeri-lab.github.io/dl-book/chapters/part4/12-kernel-regression.html#kernel-weighting-excerpt) | Distance becomes Gaussian affinity, then normalized influence, weighted values, and one prediction. Only afterward does the query move. | Observations and bandwidth remain fixed. These are computed weights, not learned similarity or uncertainty. |
| [Chapter 15: BERT masking](https://shakeri-lab.github.io/dl-book/chapters/part4/15-bert-pretraining.html#bert-ledger-excerpt) | Keep originals beside input copies; follow the input through prediction and the saved target separately into the loss. Compare masked, replaced, unchanged-selected, and unselected positions. | Selection, corruption, and attention visibility are distinct. No predicted token, probability, or measured loss is fabricated. |
| Chapter 2: softmax shift — `02-logistic-softmax.html#softmax-shift-excerpt` | Exponentiate four scores, divide by one shared sum, then add 100 to every score and watch the ruler slide while the probability bars hold under dashed marks; the `e^c` is struck out of numerator and denominator. | Four fixed scores; no training, no data, no learned quantity. Invariance is to *adding* a constant, not to scaling one. The shift moves on the timeline, not under a knob. |
| Chapter 5: one chain — `05-backpropagation.html#one-chain-excerpt` | Fill and cache `w → z → a → L`, turn the knob and measure a slope, then let three backward rays deliver one local derivative each and land their product beside the measurement. | One neuron, one example, one knob. Nothing is updated: no step, no learning rate, and `w` ends where it started. No `∂L/∂b`, no branch accumulation, no PyTorch. |
| Chapter 10: gate product — `10-sequences-rnn.html#gate-product-excerpt` | One word, `cat`, enters at step 1 and travels eighty steps on two bands at once, `b_f = 0` and `b_f = +1`, while its gradient `f^k` is traced on one shared chart; the axis switches linear → log, a ratio badge names the gap (`× 1.6 × 10¹³`, sixteen trillion), and the timeline sweeps the `b_f` slider the reader may then drag. | One constant gate multiplied eighty times, the approximation the chapter's own `≈` makes. Real gates vary per unit and per step. The log axis has a stated floor, `10⁻²⁵`, and the word's legibility at step 80 is on that mapping, never "intact". Nothing is trained; the recall experiment remains the chapter's evidence. `b_f` is the one parameter control (rule 1's amendment). |
| Chapter 3: hinge bump — `03-nonlinearity-mlp.html#hinge-bump-excerpt` | Add three ramps under a slope ledger, predict the middle coefficient, then watch (or drag) it: the sum's tail swings like a lever and lies flat on zero only at −2. | The existing fixed circuit is evaluated, not trained. The middle coefficient is the scene's one control; every value other than −2 is a declared computed variant. |
| Chapter 8: pooling bins — `08-cnn.html#pooling-bins-excerpt` | Shift clues inside pooling bins, then across a boundary; compare the resulting maps. | Local tolerance is not general translation invariance. |
| Chapter 10: LSTM valves — `10-sequences-rnn.html#lstm-valves-excerpt` | Retain, write, and expose a carried scalar; close the read valve while the stored value survives. | Illustrative gate openings, not measured trajectories. Complements the gradient-over-time scene rather than repeating it. |
| Chapter 17: quantization grid — `17-peft-quantization.html#quantization-grid-excerpt` | Round fixed weights onto a coarse grid, then separate collisions by increasing bit width. | Rounding-error bounds and ideal payload are not task accuracy or runtime speed. |

The four later scenes' fixtures, computed variants, and source hashes are in the
[Wave 2 receipt](wave2-excerpts.md). The mask/predictor excerpt for Chapter 18 is
approved for publication; see [its receipt](mask-predictor-excerpt.md). Its single
question is whether the last prompt predictor contributes to the response score.
The picture aligns predictor `i` above supplied target `i+1`, attaches ×0/×1 to
that target's score, then perturbs only excluded outputs. Readable words are
explicit illustrative aliases for the book's unchanged ID fixtures. One sequence
appears at a time; the phone layout wraps into two three-column strips. Counts
three and four remain earned receipts, and log-probability terms stay symbolic.
The helper's sequence sum is not the SFT objective's negative mean. No token is
removed from context. The shift itself is the opening motion: a copy of the token cards,
each carrying its own prompt/response tag, slides one slot left to become the target row, so
the reader sees a response target come to rest under the last prompt slot before any gate is
shown. One ink marker then carries the mechanism: it rides the last prompt
slot's output to its shifted target, passes the ×1 gate and lands on a score rail under
the targets; taken from an excluded output it stops at the ×0 gate's stop bar. Mask
gates are neutral operators, never wine. No hover-only attention paths and no
fabricated distribution plot.

### LayerNorm versus BatchNorm: show who shares the statistics

The approved Chapter 14 scene uses its existing two-example, two-token, four-feature
audit. The author-requested contrast first groups a feature column across examples
and token positions (temporal BatchNorm in training), then selects one complete
row (tokenwise LayerNorm). A separate schematic recalls CNN BatchNorm's per-channel
pool over images and spatial positions; the sequence tensor is not relabeled as
image data. No invented BatchNorm output is needed. Translate the token profile by its own mean, then divide
all four centered features by one local scale on a fixed ruler. Other rows remain
visible as excluded inputs to those statistics. Do not jitter nearly coincident marks.
The scene closes with a perturbation test rather than four coincident profiles: a
neighbour token doubles, the pooled BatchNorm column mean slides (10 → 20) and the
token's LayerNorm mean and profile do not move. Only that BatchNorm statistic is
computed; no BatchNorm output is drawn.

The normalized variance is `v/(v+epsilon)`, not exactly one; the illustrated call
has no affine transform. Keep this boundary separate from learning gamma/beta,
RMSNorm and pre/post-normalization architecture. The formula must be visible while
its centering term is highlighted, and endpoint value labels need horizontal
clearance from the plot axis. See [the receipt](layernorm-axis-excerpt.md).

Explain variable-length inconvenience through padding and pooling, not by saying
BatchNorm requires fixed-size data or cannot handle sequences. Name default running
statistics at evaluation and retain the need for attention/loss padding masks.

### SVD circle: keep the ruler fixed

The Appendix A preview tracks one perimeter and two distinct marked input radii
through the existing factorization. An unmarked rotating circle would reveal
nothing; the circle/diamond marks show `V^T` aligning its input directions. Scales
3 and 1 change lengths on a fixed equal-unit ruler before `U` sets the output
orientation. Removing the short contribution produces a line, not a smaller
ellipse. Its omitted semiaxis shows matrix error, not proof of noise removal.
Use the factors constructed in the manuscript, not a new browser decomposition
with potentially different singular-vector signs. No film or new engine is needed.

### Same subspace: coordinates are not the reconstructed object

The approved scene at `making-pca-learnable.html#same-subspace-excerpt` illustrates
the existing orthogonal-basis identity. Retain one point and one plane; turn only
the basis, read the changed projections, and add the new coordinate-weighted
vectors head to tail. The basis becomes `VQ`, so the encoder gives `Q^T z` and the
decoder uses `VQ`. Do not mix that convention with the film's opposite labeling.
Call the arrows a basis of the retained subspace, not necessarily individual
principal eigenvectors. This is a labeled schematic, not the following rank-one
experiment or optimizer motion. No new data or measured coordinates are supplied.

### Mask before softmax: zero score is not exclusion

The approved scene at `13-attention.html#mask-before-softmax-excerpt` uses the exact
four-key row already behind `fig-padding-mask`. Track two padded logits through
exponentiation and the common denominator. Setting those logits to zero leaves
two contributions of one; negative infinity instead leaves zero contribution.
The correct witness normalizes over the real keys. Keep four aligned key columns,
not a causal matrix or dashboard. An all-masked row is rejected, never illustrated
as a valid row of zero weights. Source-padding visibility and target-loss grading
remain distinct. Previously unprinted intermediates must have an exact source
extraction recipe, fixture checks, and a receipt; a seeded example alone is not
permission to invent a different mask. See [the receipt](mask-before-softmax-excerpt.md).

### Attention bill: count pairs before naming complexity

The approved revision at `16-vit-scaling.html#attention-bill-excerpt` follows the
chapter's 224-by-224 image example. Halving patch width from 32 to 16 multiplies
patch tokens by four. Show the image grid and trace one patch to a query row and
key column before counting pairs. Switch patch configurations discretely; the
timeline is not a patch-size control. One score square uses a fixed side scale,
revealing sixteen times as many entries. Stamp equal-area reference tiles and
label each as the entire original grid's area, not a token, attention window,
or duplicated score values. Pair that area with a token-length bar to distinguish
`O(N²d)` attention mixing from `O(Nd²)` block-projection/feedforward terms at fixed
width. The count excludes `[CLS]`, includes diagonal pairs, and is per head;
patch embedding is not part of the linear-work comparison. None of these factors
is a measured wall-clock ratio. The fixed manuscript owns the endpoints and argument;
the film supplies only composition and reveal order. See
[the receipt](attention-bill-excerpt.md) for scope and source hashes.

### Score field: local derivative, not a sample path

The approved scene lives at `19-generative.html#score-field-excerpt`,
after the existing Gaussian-mixture score figure. One blue inspection coordinate
moves across a fixed field. Computed responsibilities weight two signed pulls;
the pulls add to the local score. A quiet density strip shares the coordinate,
not the score's vertical units. The midpoint hold shows equal opposing pulls in
a density valley, so a zero derivative is not mistaken for high probability.
The scene evaluates the manuscript's means, standard deviation, and priors
continuously; it does not animate learning or follow a generated sample. The
lecture film's diffusion-time phase is deliberately omitted. See
[the source receipt](score-field-excerpt.md) for the analytic oracle and source hashes.

### Convolution: expose the multiply-and-add

The manuscript's four-by-four input and three-by-three vertical Sobel kernel give
four valid output positions. A representative input/kernel pair sends rays into
an explicit multiplication point and then its product. The next phase draws all
nine product rays into an addition point and on to the current output. The entire
sum stays readable, including zero terms. Unwritten outputs are not shown as zeros.
Only the patch position moves continuously; arithmetic changes at phase boundaries.

The compact two-by-two arrangement reserves space for the operator nodes. Rays
are measured from the actual cell positions and remeasured after resize or
fullscreen. They disappear while the patch is being placed or moved.

Fixture, source hashes, phase order, and checks:
[convolution receipt](convolution-excerpt.md),
`chapters/part2/07-filters-convolution.qmd` (Exercise 1), and
`scripts/test_convolution_excerpt.cjs`.

### Kernel weighting: reveal the calculation before moving the query

Reuse the `fixed-gaussian-attention` witness from Chapter 12: keys `(1, 3, 5)`,
observed values `(1.5, 2.8, 1.8)`, and bandwidth `0.6`. Ask which observation gains
influence as the query moves. Reveal distances, affinities, their shared
denominator, normalized weights, products, and sum in that order. Then sweep the
query across the observations and return to the printed `q = 3.5` witness.

Every displayed quantity is recomputed from the current query using unrounded
weights. The tests independently check normalization and the observed-value-range
bound. Unrevealed values are withheld, not replaced by false zeros. Observation
circles, the prediction diamond, labels, and influence bars complement color.
At phone widths the calculation cards stack and the plot measures its container.

Fixture, source hashes, timing, and checks:
[kernel/BERT receipt](kernel-bert-excerpts.md),
`chapters/part4/12-kernel-regression.qmd`, and
`scripts/test_mechanism_excerpts.cjs`.

### BERT: separate what is read from what is scored

The existing twelve-token `mlm-policy-ledger` fixture supplies all five Boolean
rows. Keep the original above each input copy throughout. Corruption applies to
the whole sequence together; moving the outline changes the explanatory focus,
not the encoder's input. Masked `quiet`, randomly replaced `rose`, unchanged but
selected `today`, and unselected `bank` expose the different cases. The visible
replacement `bank` is explicitly illustrative, not an executed random sample; the
cell carries a marker and the caveat is footnoted directly beneath the rail.

Within each case, reveal three forward paths: input to prediction, saved original
to loss, and prediction to loss. Only after both loss routes arrive does the
answer appear. This lets the reader first predict whether an unchanged selected
token counts. The prediction card stays symbolic; the loss shows only its symbolic
negative-log-probability term. These rays explain dataflow, not backpropagation or
the time required to run BERT.

All nonpadding input copies remain available as context. “Chosen” labels are
reader/training bookkeeping, not extra model features. Original targets are not
additional encoder inputs; the unchanged branch deliberately leaves its answer
visible. Unselected positions supply context without a direct MLM term. `[SEP]`
is visible but ineligible; padding is blocked as an attention key. The miniature
fixture illustrates branches, not exact population percentages.

The five flags live in a secondary, closed **Inspect the five Boolean ledgers**
panel. Short captions remain stable as rays appear. The transcript, fixture,
source hashes, and checks are in the [kernel/BERT receipt](kernel-bert-excerpts.md),
`chapters/part4/15-bert-pretraining.qmd`, and
`scripts/test_mechanism_excerpts.cjs`.

### Softmax shift: move the ruler, not the bars

Reuse the `softmax-shift-audit` fixture from Chapter 2: logits `(2.0, 0.5, −1.0, 1.0)` and
the chapter's own two cases, shift `0.0` and `100.0`. Ask which probability changes. Reveal
the exponentials, then the one shared sum that divides them, and only then start the shift.
The scores slide with the ruler so the markers hold still; dashed marks record the `c = 0`
bar heights; the `e^c` is struck out of the numerator and of every denominator term.

The probabilities are computed after subtracting the largest score, as the chapter
prescribes. The displayed exponentials are instead the raw `e^o`, so the shared
scale change is visible. During the shift their geometry is capped; it is not a
linear measurement of arbitrarily large exponentials. Tests instrument `Math.exp`
to verify that the unsafe shifted exponentials are never evaluated. Displayed
geometry and numerical evaluation have different jobs here; the receipt records both.

Fixture, source hashes, timing, and checks:
[Wave 1 receipt](wave1-excerpts.md), `chapters/part1/02-logistic-softmax.qmd`, and
`scripts/test_softmax_shift_excerpt.cjs`.

### One chain: cache once, reuse three times

Reuse the `micro-autograd-check` example from Chapter 5: `w = 0.7`, `x = 2`, `b = −0.5`,
target `0.3`, and its **full** squared error — never half-squared, which is the mistake the
factor-of-two test exists to catch. Ask whether turning `w` up raises or lowers the loss,
and by how much per unit. Fill the chain forward and drop `z`, `a` and `a − y` onto a
visible cache row. Then turn the knob and measure a real slope, so the chain rule has a
number to reproduce rather than a claim to assert.

`cache = forward(W0)` is computed once, outside the render, so the knob structurally cannot
move it; the cache chips sit still on screen while the live values move. Each of the three
local derivatives gets its own beat and fills only when its own ray arrives — which is what
lets reduced motion reveal them one at a time. The product lands beside the measurement,
never before it. The excerpt draws the backward pass in wine and reserves orange for `w`,
which differs from the chapter's static `fig-chain-graph`; that divergence is stated in the
panel and is an open decision in the receipt.

Fixture, source hashes, timing, and checks:
[Wave 1 receipt](wave1-excerpts.md), `chapters/part1/05-backpropagation.qmd`, and
`scripts/test_one_chain_excerpt.cjs`.

### Gate product: one word, eighty valves, one slider

Reuse Chapter 10's `@eq-lstm-highway`, its `σ(0) = ½` with `0.5^80 ≈ 10^−24`, its `+1`
forget-bias recommendation, and its "astronomically attenuated, not exactly zero". Ask how
much of a word's gradient reaches step 80. One picture, three ways of seeing the same
number `f^k`: a shared chart with a linear|log toggle (linear first — both curves plunge to
the floor and "both look dead"; then log — two straight lines of different slope), two
signal-retention bands under it whose ink IS the same mapping (linear ink `f^k`; log ink
`1 + log₁₀(f^k)/25` clipped to [0, 1], floor `10⁻²⁵`, stated), and a ratio badge that is
the largest number on the frame — `× 1.6 × 10¹³`, *sixteen trillion times larger*, the
computed `(σ(1)/σ(0))^80 = 1.580 × 10¹³` and not the `10¹⁴` that subtracting rounded
exponents gives. The one moving object is the word `cat`, in input blue, travelling both
bands at once with each band's ink at its position: `· · ·` at step 80 above, a faint but
legible `cat` below — legible on the log mapping, never "intact"; the caption says
"attenuated, not exactly zero", the chapter's words.

`b_f` is the one parameter control (rule 1's amendment): a real range, `[−2, +2]` in steps
of 0.05, orange because `b_f` is the learnable parameter, with live `σ(b_f)` beside it. The
timeline sweeps it — 0 → +1, then a brief excursion to +2 and back — so a passive viewer
sees the sweep; dragging pauses playback and recomputes every mark (curves, river, word,
endpoints, badge, labels, readout, formula highlight) from the dragged value; any timeline
action resumes the timeline's own `b_f`. Arrow keys on the slider move `b_f` and never
reach the pane's beat seeking. The measured means of the diagnostic caption are quoted in
the boundary as the chapter's measurement and never drawn; the figure's "about ten orders
of magnitude stronger" is a measured gradient norm at lag 60 against a vanilla RNN, a
different quantity, and the boundary says so.

Bindings: the published retention is `f^80` and the ratio `f^80 / 0.5^80` at every time;
both curves are `f^k`, verified by parsing each path back through the drawn axis in both
modes; every band cell's `fill-opacity` is the mapping; the word's opacity is its band's
ink; the badge is `1.58e+13` to three figures with the words computed from it; the five
slider ticks give `σ = 0.119203, 0.268941, 0.5, 0.731059, 0.880797` and `σ^80 = 1.27 × 10⁻⁷⁴
… 3.89 × 10⁻⁵`, all recomputed.

Four rules this scene added after its first review, each general enough to reuse. *A glide
finishes at the beat it belongs to:* the linear → log glide runs the 0.6 s before 18 s, the
curves, the band ink and both sets of axis labels (cross-faded) following one `mix`, so the
frame an arrow-key seek parks on is the finished picture its caption describes. *A mark on
a coloured field gets a luminance channel:* the word is drawn with a white halo under its
strokes (`paint-order: stroke`), so its blue at ink *a* is read against white at ink *a*,
not against wine at the same ink, and its contrast rises with the ink instead of falling.
*A tie mark needs two ends:* the bracket between the endpoints is drawn only when they are
visibly apart (≥ 2 px); the reference endpoint is a hollow ring and the live one a filled
dot, so two endpoints at one height are still two marks, and neither is ever offset from
its curve. *A static fallback that reflows ships two prints:* the final frame is drawn at
the desktop page's own figure width (713 units) and again in the narrow layout at a
phone's (296 units), both inside the one svg, the narrow print scaled into the wide viewBox
and chosen by a container query on the figure's width, the svg's height following its
viewBox; the player drops the narrow print when it mounts. Words for a number are spelt
from the number's own thousands group ("five point three trillion", "one hundred thirty
trillion"), never from a table that can run out.

Fixture, source hashes, timing, and checks:
[Wave 1 receipt](wave1-excerpts.md), `chapters/part3/10-sequences-rnn.qmd`,
`chapters/appendices/a3-precision-performance.qmd` (which prints `8.27 × 10^−25`), and
`scripts/test_gate_product_excerpt.cjs`.

## Reusable design rules

1. **One question, one mechanism.** Begin with a prediction; reveal its answer
   through a visible operation. Aim for about forty content seconds, not a slide
   deck condensed onto a web page. Timing is presentation, never performance data.
   No extra parameter knobs — with one amendment, requested by the author on
   September 10, 2026 for the gate product: **A scene may carry ONE parameter control
   when the mechanism IS that parameter's effect; the timeline sweeps it by default.**
   The control is a real `<input type="range">` with its ticks, a live readout and an
   `aria-valuetext` that says what the value does; it is inert (and hidden) until the
   player mounts; the timeline drives it for the passive viewer; dragging it pauses
   playback and recomputes the whole picture from the dragged value; any timeline action
   — play from a pause, a scrub, an arrow-key beat — resumes the timeline's own value, so
   the drag is a detour, not a new default; and its keys never reach the pane's beat
   seeking (the transport ignores keydown events whose target is not the pane, and binds
   its own scrubber inside `[data-controls]`, so a second range in the pane can never
   become the clock). A second knob is still a second scene.
2. **The manuscript owns meaning.** Reuse its fixture, notation, loss convention,
   and boundary. Instructor scenes can guide composition and reveal order; record
   their exact source receipts. Do not import their framework or off-page narration.
   The manuscript fixture is bound by `scripts/audit_excerpt_fixtures.py`, which
   requires each literal the manifest names to appear verbatim in its chapter and
   each receipt to hold that chapter's current digest. The static panel is the only
   in-repo mirror of the fixture: it declares the numbers as data attributes, scene
   scripts read them instead of retyping them, and the tests take their reference
   values from the same attributes.
3. **Keep the book light.** Use local HTML/CSS/SVG and small scene scripts. No video
   payload, iframe, frontend framework, animation engine, fonts, or analytics are
   needed. Load scene code only when the optional disclosure opens. Typeset math in a
   panel uses the MathJax the page already loads for the chapter's own equations, so
   it is not a new payload (see the visual grammar's recipe).
4. **Closed and paused initially.** Direct anchors open the relevant disclosure
   without autoplay. Keep one on-pane bar: Play/Pause (Replay at the end), scrubber,
   time, speed, and fullscreen. Default to 1.5x; retain keyboard navigation without
   taking native controls' keys. When the pane declares `data-beats`, the arrow keys
   seek between those scene boundaries rather than by a fixed step, so inspection
   lands where the mechanism changes; without them the fixed step stands. Pause on
   close, tab hiding, page exit, or Escape.
5. **Derive frames from time.** Scrubbing to a time must reconstruct the same values,
   focus, and geometry, regardless of playback history. Preserve fractional time
   through pause/speed changes. Use elapsed time, not an assumed frame rate.
6. **Reflow, then measure.** Stack cards or wrap token columns at narrow widths;
   remeasure ray endpoints after layout changes. Do not shrink a whole lecture
   slide. Reserve gutters so lines and operator nodes do not cover text.
7. **Keep meaning accessible.** Blue inputs, purple targets, green predictions,
   wine losses/errors, neutral fixed operators. Orange is reserved for learnable
   parameters. The exact values are the book's MathJax macro colours (visual grammar,
   rule 4). Labels, shapes, signs, and geometry must work without color. Provide
   named controls, focus visibility, reduced-motion discrete reveals, transcript,
   and a readable static fallback if scripts fail. A button whose name changes with
   what pressing it does — Play/Pause/Replay, Fullscreen/Exit — is an action, not a
   toggle: give it no `aria-pressed`, and drive its icon from a `data-state`
   attribute instead. Make the caption a polite, atomic live region so each change
   is announced once and whole, and announce a value in one place only.
8. **Keep the PDF complete.** These filters are HTML-only and return immediately
   for other formats. Existing static explanations and figures remain authoritative
   in both editions. A browser frame is not automatically converted into the PDF.
   If a future animation introduces required content, first add its complete static
   example to the shared manuscript.

## Visual grammar

Binding for every scene built or rebuilt from September 10, 2026, when the author
rejected the first build of the three Wave 1 scenes: "too many boxes like a table … we
need color coding, a better visualization, and simple things to track"; "non-LaTeX
encoding" of the math; "very hard to read". It replaces the dashboard grammar those
scenes inherited — stage tabs, framed cards, readout chips, side tables, Unicode-and-caret
math — and it is what `interactives/_template` encodes and the harness's
`registerGrammarTests()` checks.

1. **One picture.** The pane is a single inline SVG, not a grid of cards. No tab or stage
   strip, no side tables, no readout chips. A number that must be shown sits on the
   picture, next to the mark it measures, in that mark's colour.
2. **One object the eye tracks**, continuously, through the whole forty seconds: a nudge
   travelling down a chain, a group of bars translating together, a packet shrinking
   through gates. Everything else is scenery that stays put. If two things move at once
   they must be the same thing seen twice.
3. **Motion is the mechanism.** Adding a constant is a translation. Multiplying by a
   shared factor is the whole group scaling together. A derivative is a small nudge that
   is amplified or shrunk as it passes each stage. A product of gates is the same packet
   passing through the same valve again and again. Show the operation before naming it;
   then name it once.
   **Earn the animation.** Before building, name the misconception that static text
   or the existing figure leaves hard to see. Make the moving object resolve it.
   Then apply the **first/last-frame test**: put the first and last frames side by
   side. If a student loses nothing, the motion is not carrying the mechanism and the
   scene should be redesigned or retired — a weak scene costs the reader attention and
   can confuse. A scene passes when the motion is the operation itself (a shift is a
   slide, a product is a scaling, a slope is a tilting tangent), when the payoff is
   visible to the eye rather than a digit string or a sub-pixel dot, and, where the
   mechanism is one parameter's effect, when the reader can drag that parameter.
   If a mechanism is a network of operations, show components and transmission;
   do not substitute a second large curve plot. Supporting curves stay small and
   explicitly name their quantity so they cannot be mistaken for signal decay.
4. **Colour = meaning, everywhere at once.** Blue is the input `x`; orange is the
   learnable parameter (`w`, and nothing else); green is a prediction or probability;
   purple is the target `y`; wine is loss, error, blame. The same colour appears on the
   picture, inside the typeset formula, and on the caption word. The values are the
   book's own MathJax macros in `mathjax-config.html`: `\featurepart{}` blue `#2b6cb0`,
   `\parameterpart{}` orange `#c05621`, `\predictionpart{}` green `#2f855a`,
   `\targetpart{}` purple `#805ad5`, `\residualpart{}` wine `#722f37`. A shift or a
   ghost that is none of these is drawn in the book's emphasis ink `#232d4b`; scenery is
   grey. The shared `.target-role` and `.error-role` predate the grammar and differ
   slightly; a scene overrides them within its own root so the caption word matches the
   formula, rather than editing the shared sheet the older chapters also carry.
5. **Math is typeset, never ASCII.** The page loads MathJax 4 with the book's macros; a
   panel formula is written as `\( … \)` or `\[ … \]` and typesets like every other
   equation in the chapter. Animate a formula by toggling CSS classes on sub-expressions
   wrapped in `\class{name}{…}` — a wash, a strike — never by rewriting TeX during
   playback, and never with a live-changing number inside the formula: a changing number
   is plain `<text>` on the picture. The recipe is below. Plain text obeys the same rule:
   a minus sign is U+2212, never a hyphen, and a small number is `9.54 × 10⁻⁷`, never
   `9.54e-7` and never a raw double — on the picture, in both static prints, and in
   every `aria-label` or `aria-valuetext` (the gate product's formatter is the pattern).
   Suites that parse printed numbers parse the true minus back first.
   **A symbol wearing an accent is typeset, not spelled in Unicode.** The body sans face
   carries no mark positioning for the combining accents U+0302 and U+0303, so `p̂` and
   `c̃` set the mark beside the letter instead of over it: measured on the published page
   at 40 px, that face advances 18.24 for `c` and 20.41 for `c̃` — a spacing tilde — while
   the serif face advances 18.16 for both, which is what a composed mark looks like. In
   prose, say the symbol in TeX (`<span class="math inline">\( \predictionpart{\hat p} \)</span>`,
   exactly what Pandoc emits for the chapter's own `$\hat p$`) and let MathJax compose it.
   SVG `<text>` cannot be typeset, so there the accented symbol *alone* wears
   `class="mechanism-accent"`, which hands that one glyph to the serif face and leaves the
   prose around it in the body face. Precomposed letters — U+0177 `ŷ`, U+0175 `ŵ` — are
   single glyphs the sans face draws correctly and are left as they are.
6. **Text budget.** On the picture: labels only (`w`, `x`, `y`, `z`, `a`, `L`, a unit, a
   value). One typeset formula line under the picture. One caption line of at most twenty
   words saying what is happening now. The question above the pane, the boundary
   below it, and the transcript are prose, not the picture — but prose is budgeted too.
   The boundary shows **one** sentence (about thirty words at most): the single most
   important thing the scene does not claim. Every further qualifier — drawing devices,
   computed variants, colour decisions, what a later section measures — sits in a closed
   `details.mechanism-scope` disclosure, "Scope and caveats", beside the transcript. The
   September 17 review measured 70–360 words of always-visible caveats under forty-second
   pictures; on a phone the caveats were longer than the animation. Nothing was deleted:
   the wrapper keeps the `mechanism-boundary` class, so suites that read its text still
   bind every sentence.
   **Close with a transfer check.** Every panel ends with one closed
   `details.mechanism-check`: "Check yourself." plus a question that applies the
   mechanism to a case the picture did not show, its answer hidden until asked for.
   The answer's numbers follow from the declared fixture and are recomputed by
   `scripts/test_excerpt_checks.cjs`. A question the reader can answer by reading the
   final frame, or by dragging the scene's own control, is recall, not transfer.
7. **Stillness when the reader should read.** A reveal holds for at least two seconds.
   Nothing flashes. **A prediction is never spoiled:** from the moment a caption asks the
   reader to predict until the scene's own reveal — which follows at least two still
   seconds — the answer is absent from the drawing, the svg `aria-label` and the scrubber's
   value text, including a glide that has already started toward it. Test this from the
   DOM at fine time steps, not by re-implementing the player's timing.
8. **Reduced motion** is the same picture at each beat with the object jumped to its beat
   position.
9. **Static fallback** is the final frame drawn as static SVG inside the panel,
   carrying the witness values. A reflowing scene ships both wide and narrow prints,
   selected by scoped CSS without JavaScript; active playback removes the unused
   print. Generate them with `scripts/render_static_frames.cjs`. Local SVG IDs and
   references in the narrow print must be namespaced, including clip paths. Keep
   MathJax label IDs unique and give their existing labels narrow static geometry.
   Inspect actual phone-width type, not only the presence of a narrow group.
   Serialize computed drawing coordinates at an explicit subpixel precision before
   requiring byte-identical SVG fallbacks: four decimal places (0.0001 px). Nine places
   left the SVD scene's closest coordinate only about twenty ulps from a rounding
   boundary; four moves every coordinate roughly five orders of magnitude further away. Platform math libraries can differ in
   their last bits. Keep the underlying arithmetic unrounded and test it separately;
   a rendering precision contract must not loosen numerical-evidence gates.
10. **Native links inside raw panels.** HTML inserted by the excerpt filter does not
    resolve Quarto `@eq-…` references. Use a descriptive `<a href="#eq-…">` link and
    verify its target in the rendered chapter. Never print a guessed equation number.

### Typeset math in a panel: the verified recipe

Verified in the rendered page on September 10, 2026. The page loads MathJax 4.1.3
(`tex-chtml`) with `ui/lazy` and the macros in `mathjax-config.html`, and its
`lazyAlwaysTypeset` list includes `span[id^="eq-"]`. So:

- Wrap every panel formula as `<span id="eq-<scene>-<n>">\( … \)</span>`. It is typeset
  eagerly — no `<mjx-lazy>` placeholder — even inside the closed `<details>`. Probed:
  `\class{shift}{e^{c}}` produced two targetable `.shift` elements, and
  `\parameterpart{w}` produced the book's orange.
- `filters/mechanism-excerpts.lua` inserts `panel.html` as a raw HTML block, so the
  `\(` delimiters reach the page untouched.
- After the disclosure opens the player may call `MathJax.typesetPromise([root])` once,
  guarded by `window.MathJax` and only if no `mjx-container` exists yet, and publishes
  `data-typeset="mathjax"` or `"none"`. If MathJax is absent or the promise rejects, the
  TeX source stays readable — the no-JS behaviour everywhere else in the book.
- Animate by toggling classes or styles on the `\class{}` elements: a pale wash of the
  part's own colour, or a diagonal `::after` rule for a strike (`text-decoration` does not
  reach MathJax's inline-block boxes), scoped under `[data-ready]` so the static fallback
  is fully lit. Never mutate the TeX at runtime.
- JSDOM cannot run MathJax: test the TeX source string, the `eq-` ids, the `\class{}`
  names and the CSS toggles the player applies. The harness fixture's `mathjax` option
  (`'stub'`, `'typeset'`, `'reject'`) lets a suite prove the one guarded call.

This supersedes the earlier convention that panels carry Unicode-only text and no
MathJax — the "no MathJax inside the panel" line of the Wave 1 brief and open decision
E17 in the Wave 1 receipt, which is therefore **closed**: every rebuilt scene's formula is
typeset by the page's MathJax with the book's macros, and the caret-and-parenthesis
rendering E17 asked about no longer exists anywhere in a rebuilt panel. The MathJax is the
page's own, so rule 3 above stands.

### Scenes that predate the grammar

The convolution, kernel-weighting and BERT-ledger scenes were built and reviewed before
this grammar existed. They keep their stage strips, cards and Unicode text; their own
suites keep testing that shape; `registerGrammarTests()` is not applied to them; and the
`.mechanism-stages` rules stay in `interactives/shared/player.css` for them. They are
candidates for a later retrofit, which is the author's decision — nothing in the Wave 1
rebuild touches them.

## Implementation map

- `interactives/convolution/`: the approved first player. It keeps its own
  transport rather than being retrofitted onto the shared helper, but it is not
  frozen: it has taken that helper's ancestor-walking anchors and its
  derive-the-duration behaviour, and the action-button rule applies to it too.
- `interactives/kernel-weighting/` and `interactives/bert-ledger/`: each scene's
  static panel, scoped styles, and computation/reveal logic.
- `interactives/softmax-shift/`, `interactives/one-chain/`, `interactives/gate-product/`:
  the Wave 1 scenes, same three files each, all on the shared transport with no
  transport change of any kind. Two of them define an orange `…-parameter` class in
  their own stylesheet rather than in `shared/player.css`, deliberately: a rule added
  to the shared sheet is emitted into every chapter that carries a panel, including
  ones that do not use it.
- `interactives/shared/`: only demonstrably shared transport, compact controls,
  styles, and deferred loading for every scene on the shared transport. Each scene
  keeps its own arithmetic or Boolean state. Nested-disclosure anchors open their
  target as well as its ancestors. The transport finds its scrubber as
  `[data-controls] input[type="range"]` — inside its own bar — since the gate
  product's `b_f` slider put a second range in a pane (the one change the
  one-parameter-control amendment needed in shared code; every scene on the shared
  transport has exactly one range inside `[data-controls]`, so nothing else moved).
- `interactives/manifest.json`: the index of shipped scenes — panel id, scene
  directory, chapter, anchor (an executable cell's `cell-<label>` or an exact
  heading), the filter that ships it, whether it uses the shared transport or its
  own, duration, beats, the fixture literals its chapter must keep verbatim, any
  declared computed variants, and the receipt that hashes the chapter. It is
  repository build data — read from the project directory by the Lua filter, the
  fixture audit and the interaction suite — not a file the reader's browser fetches,
  so it is not listed as a published resource. A scene's entry is its whole
  registration: adding the three Wave 1 scenes required no edit to the filter.
- `scripts/audit_excerpt_fixtures.py`: the fixture-drift guard. It runs in the
  manuscript-contract audit step of both the publishing and the execute-audit
  workflow, ahead of any render or re-execution, and fails when a literal is no
  longer verbatim
  in its chapter, when a receipt's recorded chapter digest is stale, when an anchor
  stops resolving, when a manifest-driven filter can no longer place an anchor of the
  declared kind (or, for a filter that still hard-codes its scene, when it stops
  mentioning that scene or target), when
  a panel stops declaring its id, when the manifest's duration or beats disagree
  with the panel markup, when a shared-transport pane stops declaring `data-beats`
  at all, or when a scene-transport panel's manifest beats are not the uniform grid
  its declared duration implies. Given `--lecture-tree` it also re-verifies the
  recorded lecture digests. It reads both kinds of digest out of a receipt's Markdown
  tables, and the row shape it recognises is `| \`path\` | \`sha256\` |` — the digest
  must be the last column of a two-column row. A receipt that adds a third column
  between them does not fail the audit; it silently stops being checked, so keep
  descriptive columns in a separate table.
- Timeline source of truth: the pane's `data-duration`, falling back to the
  scrubber's `max`, and the pane's `data-beats`. The transport writes the duration
  into the scrubber range, the printed clock, and `data-duration` on the panel root,
  so the length is stated once; the manifest mirrors both and the audit keeps them
  equal wherever the panel declares them. A scene-transport player — today only
  convolution — runs its own transport, declares no `data-pane` and no `data-beats`,
  and derives its grid from its own phase length. Its manifest beats are bound
  instead by the audit, which requires the uniform grid the declared duration
  implies, and by `scripts/test_convolution_excerpt.cjs`, which deep-equals them
  against `(lastStep + 1)` phases of `phaseSeconds` read from the player source.
- `filters/mechanism-excerpts.lua`: manifest-driven. It decodes
  `interactives/manifest.json` with `pandoc.json.decode`, the same way
  `filters/chapter-tools.lua` reads `scripts/notebook_manifest.json`, and inserts every
  scene the manifest gives the document being rendered — after the div of an
  `after-cell` anchor, or immediately before the level-2/3 heading of a
  `before-heading` one — failing if a
  required insertion point is absent or duplicated. The shared stylesheet is emitted once
  per document, each scene adds its own `<style>`, and `shared/loader.js` is emitted once,
  after the last panel on the page, so it sees every root there.
  Keep a replay outside a cell's enclosing Plan → Code wrapper. Nonfigure labels
  need not acquire a `cell-` prefix. Do not use two `after-cell` entries on the
  same target: repeated insertion reverses their order. Use distinct insertion
  points and check both players initialize in actual document order.
  `filters/convolution-excerpt.lua` still names its own chapter and heading; it inserts
  the same way and fails the same way.
- `interactives/_template/`: the skeleton a new scene copies, in the visual grammar —
  one inline SVG that is both the static fallback (the final frame, with its witness
  values) and the drawing the player animates; one `eq-` formula line; one caption; a
  player that looks each `[data-mark]` up once, moves it by attributes from
  `render(time, reduced)`, toggles formula classes, measures only in `layout()`, and
  makes one guarded typeset call after mount; scoped styles declaring the macro
  colours; and a README naming the four places a scene must be registered (manifest
  entry, `_quarto.yml` resources, its test file, the wave receipt). Nothing here is
  rendered: no manifest entry names it. Run through the harness with placeholders
  substituted, it passes the transport, beat-hold and grammar suites as it stands.
- `scripts/html-tests/excerpt-harness.cjs`: test-only. The JSDOM fixture, the markup
  canonicalisers, the per-scene rectangle stub, and `registerTransportTests(sceneId)` —
  **21 transport checks** every shared-transport scene inherits, driven by the manifest's
  duration and beats, including the checks that each declared beat is a boundary the
  drawing crosses and that reduced motion holds each beat. It also exports
  `registerBeatHoldTest(sceneId)`, the **strict** form of the reduced-motion rule: it walks
  the whole reduced timeline at 0.05 s and requires exactly one drawn state per beat
  interval, where the inherited check samples only `beat` and `beat + 0.01`. A quantity
  quantised into several stops inside one beat passes the sampled check and fails this one.
  Every scene written from `interactives/_template` calls it. It is opt-in because
  `kernel-weighting` and `bert-ledger`, which shipped before this harness, do not hold
  their beats (measured: kernel beats 5/6/7 render 11/17/7 states, BERT beats 2–7 render
  4/4/4/2/2/2); making them hold is an author decision about two reviewed scenes, not a
  side effect of a test helper. `registerGrammarTests(sceneId)` is the opt-in visual
  grammar suite — one picture, one formula line, one caption, no strip and no tables;
  TeX in `eq-<scene>-` wrappers whose `\class{}` names the scene's stylesheet styles;
  playback that changes formula state without rewriting TeX; exactly one guarded
  typeset call after mount and none when the page already typeset; captions within
  the word budget and standing two seconds; a static fallback equal to the final frame.
  The fixture's `mathjax` option (`'stub'`, `'typeset'`, `'reject'`) exists for that
  suite, and `stageLabels()` returns `[]` for a panel without a strip: the stage strip
  is not part of the harness contract. A scene's own arithmetic and
  Boolean invariants stay in its own suite. One known gap: its deterministic-seek check
  canonicalises the pane's inner markup only, so state a player publishes on the panel
  root can drift with playback history undetected. `one-chain` covers its whole published
  surface in its own suite; that check belongs in the harness.
- `scripts/html-tests/package.json`: test-only dependencies; the publishing
  workflow requires this interaction suite alongside notebook validation.

## Acceptance before another animation ships

Independently test arithmetic or Boolean invariants, every important reveal state,
deterministic seeking, pause/replay/speed, resize/fullscreen, keyboard isolation,
reduced motion, direct anchors, failed-script fallback, and the non-HTML guard; for a
scene written to the visual grammar, also its grammar suite.
Inspect desktop and phone widths in a real browser. Run the HTML/structural audits
and require unchanged frozen stdout. Index the scene in `interactives/manifest.json`
and require the fixture-drift guard, `scripts/audit_excerpt_fixtures.py`, to pass, so
a later manuscript edit forces its receipt to be re-read instead of letting the panel
diverge in silence. For publication, retain the existing complete
PDF-build and notebook-validation pipeline, compare PDF content and pagination,
obtain author review, push normally, and verify the actual deployed assets.

Current commands and source receipts live in the linked implementation records:
[convolution](convolution-excerpt.md), [kernel and BERT](kernel-bert-excerpts.md), and
[Wave 1](wave1-excerpts.md).
Future candidates remain in [the existing animation roadmap](backlog.md#focused-animation-roadmap--approved-september-9-2026);
**this document does not authorize additional scenes or a new stable edition.** A wave is
authorized only by the author's browser-review note recorded in that wave's own receipt —
which is why the three Wave 1 scenes appear in the table above marked *built, not
published*.
