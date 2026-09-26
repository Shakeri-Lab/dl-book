# Batch vote: source and acceptance receipt

The optional HTML-only mechanism excerpt inserted before Chapter 4's heading
*Momentum: give the ball some mass*, so it closes the batch-size section
(`chapters/part1/04-training-loss-sgd.qmd`, §"The batch size", lines 275–290, and its
subsection `#sec-04-estimator-cases`, line 292 onward). Panel id `batch-vote-excerpt`,
scene directory `interactives/batch-vote/`, shared transport, 40 s,
beats `0 5 10 15 20 25 30 35`.

Built to the binding contract in [animation authoring](animation-authoring.md): one
picture, one typeset formula line, one caption, one parameter control under rule 1's
amendment, and a closed transfer check.

## One mechanism and one question

**Question on the panel.** *Four times the batch costs four times as much. Does it buy
four times the gradient?*

**The misconception.** That the payoff scales with the cost — that a batch of four is
four times as good a gradient as a batch of one. It is not. The chapter prints the law
in one sentence, and a sentence is easy to read past: the standard deviation of the
estimate falls like `1/√B`, so the *fourth* doubling buys almost nothing, and the
finite-population factor `√((n−B)/(n−1))` drives the noise to exactly zero only at
`B = n`. The corollary students miss is that most of the noise reduction is bought by
the first few examples.

## What moves, and what two frames could not do

One picture holds a gradient plane and, beside it, a small chart of the same jitter
against every batch size at once.

* **Scenery that stays put.** Sixty-four per-example gradients as open grey squares,
  the two axes `∂L/∂w₁` and `∂L/∂w₂` through the origin, and the full-batch gradient
  `∇L = (7.50, 3.75)` as one bold wine arrow with a ring at its tip. Equal units on
  both axes, so a distance on the picture is an honest distance in the gradient plane.
* **The one object the eye tracks.** Sixty-four wine diamonds — the estimate each of
  sixty-four actual batches of the current size gives. At `B = 1` they sit exactly on
  the sixty-four squares, because a batch of one *is* an example. As `B` rises they
  contract together onto the ring, and at `B = n` they are all one point.
* **The cost, as ink.** The `B` examples of the batch drawn as an arrow are filled in;
  at `B = 16` sixteen squares are lit, at `B = 64` all of them.
* **The law, twice.** A jitter ruler down the left of the chart records each
  quadrupling the timeline reaches — `11.21`, `5.47`, `2.45`, `0.00` — with a bracket
  between neighbours carrying the computed ratio, `×0.49`, `×0.45`, `×0.00`. A solid
  curve is the exact law across all `B`; a dashed curve is the chapter's simpler
  independent-sampling rule `σ/√B`, which never reaches zero. The marker rides the
  solid curve at the reader's `B`.

**The first/last-frame test, honestly.** Frame one (`B = 1`, a wide spray) beside the
final frame (`B = 64`, one point, `0.00`) does teach the endpoints — and because the
levels accumulate, the final frame is a good summary of the decline. What two frames
cannot carry is the **rate**, which is the whole misconception: the eye has to watch
`1 → 2 → 3 → 4` move the cloud visibly, one example at a time, and then watch
`48 → 64` move it almost not at all, for "four times the cost, one halving" to become
something felt rather than read. The strongest form of the test here is not frame one
against frame eight but *equal doublings against each other*: `1 → 2` and `16 → 32`
cost the same multiple and buy wildly different amounts, and only motion — or the
reader's own hand on the slider — shows that. The scene passes on that ground, and it
is the reason `B` is draggable rather than stepped through four fixed panes.

## Fixture

### What the chapter owns, verbatim

| Manuscript literal | Line |
|---|---|
| `With independent sampling, gradient standard deviation scales like $1/\sqrt{B}$:` | 285 |
| `quadrupling the batch roughly halves the jitter. For a uniform subset without` | 286 |
| `$\sqrt{(n-B)/(n-1)}$; when $B=n$, the noise is exactly zero. For $B \ll n$ the` | 288 |
| `correction is near one, which is why the simpler rule is useful.` | 289 |
| `only a dial linking statistics and hardware.` | 290 |
| `Its variance includes the finite-population` / `correction $(n-B)/(n-1)$, which reaches zero at $B=n$.` | 90–91 |
| `a minibatch average is an unbiased` / `estimator of the full objective, and its gradient an unbiased estimator of the full` | 300–301 |
| `return 2 * A[idx].T @ residual / len(residual)` | 152 |

The manifest's two `fixture.literals` are the halving sentence and the
finite-population sentence; the rest of this table is the surrounding prose the panel
respects rather than mirrors. The chapter's own exercise (line 618) asks the reader to
compare a measured spread against `1/\sqrt{B}` "then include the finite-population"
factor — this scene is that comparison, drawn.

### The declared computed variant: the toy problem

The chapter prints no population, so the panel declares one and computes everything
from it. Two weights and no bias, squared error, and the chapter's own per-example
gradient convention `∇ℓᵢ = 2 rᵢ (aᵢ, bᵢ)` (line 152).

| Attribute | Value | Meaning |
|---|---|---|
| `data-features` | `-4 -3 -2 -1 1 2 3 4` | the eight feature values; the examples are all 64 pairs `(a, b)` |
| `data-coefficients` | `1.5 0.75` | the targets follow `y = 1.5a + 0.75b + t` |
| `data-offset` | `0.5` | `t`, a constant the two-weight model has no bias term to absorb |
| `data-parameters` | `2 1` | the parameter vector the gradients are evaluated at |
| `data-stops` | `1 4 16 64` | the quadruplings the timeline visits; the last must equal `n` |
| `data-shuffle-seed` | `2255` | seeds the one declared shuffle behind the sixty-four batches |

Everything below is recomputed by `player.js` from those six attributes and
independently recomputed by `scripts/test_batch_vote_excerpt.cjs`; no number is typed
twice.

* **Population.** `n = 8² = 64`. Residual `rⱼₖ = 0.5aⱼ + 0.25bₖ − 0.5`; gradient
  `2rⱼₖ(aⱼ, bₖ)`. Every component is an exact multiple of `0.5`, with
  `∂L/∂w₁ ∈ [−2, 28]` and `∂L/∂w₂ ∈ [−12, 28]`. Exactness matters: because every
  partial sum is exactly representable, the sum over all sixty-four is the same
  whatever order it is taken in, which is what makes the collapse at `B = n` exact in
  the code rather than nearly exact.
* **Full-batch gradient.** `∇L = (7.50, 3.75)`, exactly.
* **Population variance.** `σ² = 125.625` exactly; `σ = 11.208255885729947`.
* **The two laws.** `sd(ξ_B) = (σ/√B)·√((n−B)/(n−1))` and the chapter's simpler
  `σ/√B`. At `B = 1` the correction is `√(63/63) = 1` exactly, so the first reading is
  `σ` itself. At `B = n` the correction is `√(0/63) = 0`, so the product is exactly
  zero — not rounded to zero.

| `B` | correction | jitter | `σ/√B` | printed | ratio to previous stop |
|---|---|---|---|---|---|
| 1 | 1 | 11.208255885729947 | 11.21 | `11.21` | — |
| 4 | 0.9759000729485332 | 5.469068868254841 | 5.60 | `5.47` | `×0.49` (0.4879500364742666) |
| 16 | 0.8728715609439694 | 2.445841952609133 | 2.80 | `2.45` | `×0.45` (0.44721359549995787) |
| 64 | 0 | 0 | 1.40 | `0.00` | `×0.00` (exactly 0) |

Two quadruplings that roughly halve, then one that does not halve at all: at `B = n`
the finite-population factor annihilates the noise instead. That is the chapter's own
pair of sentences, drawn end to end.

* **The sixty-four drawn batches.** One deterministic Fisher–Yates shuffle of the
  sixty-four examples, seeded by `data-shuffle-seed` through the linear-congruential
  recurrence `x ← (1664525x + 1013904223) mod 2³²`, and then the sixty-four **cyclic
  windows of length `B`** in that order. Three properties earn the choice, and the
  suite checks all three: every example sits in exactly `B` windows, so the cloud's
  centre is the full-batch gradient at every `B` (the chapter's `@eq-unbiased`, drawn);
  at `B = 1` the windows are exactly the sixty-four per-example gradients; at `B = n`
  and at `B = n − 1` the family's own spread equals the exact law, and at `B = n` every
  window is the whole population. Across `1 ≤ B ≤ 63` the drawn family's spread stays
  within **2.9 %** of the exact law, so the cloud the eye reads and the curve the
  marker rides tell the same story; the seed was chosen for that agreement and the
  suite pins it at 5 %.
* **The batch drawn as an arrow** is the window whose single example lies closest to
  one standard deviation from the full-batch gradient — a typical batch, computed from
  the population, not the worst one and not a hand-picked index.

## Beat timetable

| Beat | Time | `B` | What the reader sees |
|---|---|---|---|
| 0 | 0–5 s | 1 | The sixty-four gradients, their average as the bold arrow, one batch as the dashed arrow. The jitter scale is framed but has no reading. |
| 1 | 5–10 s | 1 | The jitter scale takes its first reading: `11.21`, the population's own spread. |
| 2 | 10–15 s | 1 | **Predict.** Frozen. "Quadruple the batch to four. How much of that jitter does four times the cost remove?" |
| 3 | 15–20 s | 1 → 4 | Released. The batch grows one example at a time; the cloud pulls in. |
| 4 | 20–25 s | 4 | The answer: `5.47`, `×0.49`. Both law curves are drawn. |
| 5 | 25–30 s | 4 → 16 | The second quadrupling; the marker slides toward the flat end of the curve. |
| 6 | 30–35 s | 16 | `2.45`, `×0.45`. The curve ahead is nearly flat. |
| 7 | 35–40 s | 16 → 64, held from 38 s | The cloud collapses onto the ring; jitter exactly `0.00`, `×0.00`, while the dashed law still reads `1.40`. |

The prediction is never spoiled: through beat 2 the batch is frozen at one, neither law
curve exists, no later level or ratio is drawn, and neither the picture's
`aria-label`, the scrubber's value text nor the slider's value text mentions the
answer. The suite walks that window at 0.05 s and asserts it.

A reading lands on the ruler when the timeline earns it *or* when the reader's own drag
takes the batch to that size — the same question answered by hand.

## Reduced motion

One still per beat, with the batch jumped to that beat's resting size: `1, 1, 1, 4, 4,
16, 16, 64`. A glide beat rests on its finished state, and the last beat rests on
`B = n`, where the cloud has collapsed and the jitter is exactly zero. The strict
`registerBeatHoldTest` walk confirms exactly one drawn state per beat interval.

## The one parameter control

Batch size `B`, a real `<input type="range">` over `1 … 64` in whole examples, with
ticks at the four stops, a live readout and an `aria-valuetext` that says what the
value does. It is hidden and inert until the player mounts. The timeline sweeps it, so
a passive viewer sees the whole climb; dragging pauses playback and recomputes the
population membership, the cloud, both arrows, the marker, the ruler and the formula
wash from the dragged value; any timeline action — play, scrub, arrow-key beat —
restores the timeline's own `B`. Its own keys never reach the pane's beat seeking, and
it sits outside `[data-controls]` so it can never become the clock.

This is rule 1's amendment: the mechanism *is* this parameter's effect. A second knob
would be a second scene.

## Palette

Every arrow, dot and curve in this scene is a gradient — a loss-derived quantity — so
wine `#722f37` (`\residualpart`) is the scene's one meaning colour, on the picture, in
the formula and on the caption word. The parameter vector the gradients are evaluated
at is named in orange `#c05621` in the panel's intro, and nothing else is orange:
`B` is a protocol setting, not a learnable parameter, so its slider and its recorded
readings are drawn in the book's emphasis ink `#232d4b`. The population, the axes, the
chart frame and the independent-sampling curve are scenery grey. Shape carries the
distinctions without colour: open squares are examples, filled squares are this
batch's examples, diamonds are batch estimates, a solid arrow with a hollow ring is the
true gradient and a dashed arrow with a filled head is one batch's.

## Teaching boundary

Visible sentence: *This is sampling noise in the gradient estimate at one fixed
parameter vector, not noise in the loss, and nothing here is trained.*

In the closed **Scope and caveats** disclosure:

* Both laws are the chapter's; the toy problem is a declared computed variant, so the
  population, `∇L`, `σ` and every jitter reading are computed from the panel's own
  attributes rather than printed anywhere in the book.
* The readout and both curves are the exact standard deviation over **all** uniform
  subsets of that size; the sixty-four diamonds are sixty-four actual batches from the
  declared family, exact at `B = 1` and `B = n` and close to, not identical with, the
  curve in between.
* This is the chapter's **Case 1** (`#sec-04-estimator-cases`): the loss is a mean of
  per-example terms, so a batch average is an unbiased estimate of the full gradient
  and `B` is a compute-and-noise dial, not a correctness dial. The scene does **not**
  claim a batch estimates what the chapter says it does not: a nonlinear functional of
  an aggregate is estimated with bias (Case 2), and where the batch defines the
  objective it is protocol rather than an estimator (Case 3).
* Unbiasedness here holds at a fixed parameter vector — what the scene shows. It is
  not a claim about successive reshuffled batches along a training run, which the
  chapter's "Honest fine print" callout separates out.
* Cost is the count of per-example gradients one step needs, not a measured time.
  Larger `B` costs proportionally more of them: the trade the chapter names.

## Transfer check

> **Check yourself.** A training set of one million examples, batch raised from 100 to
> 400. By what factor does the gradient's standard deviation change, and how much does
> the finite-population factor contribute?
>
> Almost exactly one half. One over the square root of four is 0.5; the correction
> moves only from 0.99995 at *B* equal to 100 to 0.99980 at 400, so the ratio is
> 0.49992. For *B* far below *n* the correction is near one — the chapter's simpler
> rule.

Arithmetic, at a population fifteen thousand times larger than the scene's own, so
neither the final frame nor the slider can answer it:

* `√((10⁶ − 100)/(10⁶ − 1)) = √(999900/999999) = 0.9999504987253118` → `0.99995`
* `√((10⁶ − 400)/(10⁶ − 1)) = √(999600/999999) = 0.9998004798963639` → `0.99980`
* ratio `= (1/√4) × 0.9998004798963639 / 0.9999504987253118 = 0.4999249868722806` →
  `0.49992`

## What was deliberately not imported from the film

The DS 6050 Chapter 4 lecture has a 38-second `BatchSize` scene (`§4.6 · choose the
vote`), which supplied the reveal order — subsets scattering around one computed mean
arrow, then `1/√B`, then the finite-population factor, then zero noise at full batch —
and the scene's name. Not imported:

* **Its four fixed panes** (`B = 4/16/64/128`) shown side by side. This scene is one
  picture with `B` as a control, because the misconception is about the *rate* between
  sizes, which four discrete panes state rather than show.
* **Its twenty seeded subsets per pane** and its per-pane "law circle" drawn over the
  scatter. The law here lives on its own small chart; nothing claims the drawn cloud's
  radius *is* the theoretical standard deviation.
* **Its numbers** — the `1.00 / 0.48 / 0.18 / 0` radii, the `n = 128` population, the
  whitened axes, the `NOISE = 0 · FINITE POPULATION EXHAUSTED` card. They belong to the
  film's own population; this panel computes its own.
* **Its three-case estimator banner**, its narration, kickers, timecodes and chrome.
  The three-case discipline is respected in the closed Scope disclosure instead, under
  the prose budget.
* The film's phrase "with replacement"; the manuscript's "With independent sampling" is
  the wording the panel follows.

## Acceptance

`node --test scripts/test_batch_vote_excerpt.cjs` — **47 tests, all passing**:
21 inherited transport checks (`registerTransportTests`), the strict reduced-motion
beat hold (`registerBeatHoldTest`), the six visual-grammar checks
(`registerGrammarTests`), and the scene's own nineteen:

* the chapter owns both laws and the estimator-case section is present;
* the declared toy gives an exactly representable population, `∇L = (7.50, 3.75)` and
  `σ² = 125.625`;
* both laws are recomputed at all sixty-four batch sizes, and the jitter is exactly
  zero at `B = n` while the independent law never is;
* the drawn family is balanced, its centre is the full-batch gradient, it is exactly
  the population at `B = 1`, exactly the truth at `B = n`, and within 5 % of the law
  throughout;
* the cloud, the population, the lit members and both arrows are the published numbers
  at seven pane widths;
* both curves, the marker, the levels and the drops parse back to the law;
* the brackets print the computed ratios `×0.49`, `×0.45`, `×0.00`;
* the batch is always a whole number and climbs through its declared stops;
* the answer is absent throughout the predict beat;
* every reveal waits for its own beat and a withheld reading prints a middle dot;
* reduced motion rests each beat on one still;
* the control is timeline-driven and a drag is a detour;
* no label leaves the picture or meets another at either layout;
* arbitrary seek and resize histories reproduce the published frame;
* the narrow layout is a reflow, `296 × 580`, not a shrunken copy;
* both script-free prints equal the final frame;
* twelve malformed fixtures are refused rather than mounting a different mechanism;
* the player exports nothing and publishes a fixed set of state keys;
* the boundary and the transfer check carry what they must.

Browser inspection at 1280 px and 375 px through
`scripts/render_static_frames.cjs` plus the preview harness: figure width 713 / 302,
zero page overflow, zero SVG text outside the picture, zero console errors at
`t = 2, 7, 12, 17, 22, 27, 32, 37, 39.9`.

## Source digests

| path | sha256 |
|---|---|
| `chapters/part1/04-training-loss-sgd.qmd` | `5a6cc94307f2ecb07b1cbf8274cab1fc80dc5d9d60198d380e5489864bc80059` |
| `6050-Ch4/STORYBOARD.md` | `c5f8b635909b585d6c62f310ef2e16801c58421127d9ef6d536d7fbd331db9ce` |
