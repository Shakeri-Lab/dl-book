# SGD zones: source and acceptance receipt

**Built, not published.** Chapter 4's mechanism excerpt for §"Stochastic gradient
descent" and §"The two zones of SGD", adapted from the `TwoZones` scene of the
DS 6050 Chapter 4 film. The insertion point is `before-heading` → `The learning
rate` in `chapters/part1/04-training-loss-sgd.qmd`, so the panel lands at the end
of §"The two zones of SGD", after the `fig-sgd-zones` cell and the paragraph that
follows it, and immediately before the section that introduces `α`:
`04-training-loss-sgd.html#sgd-zones-excerpt`. The shared manuscript, its figure
and all frozen evidence are unchanged; nothing here is added to the PDF.

This scene merges two of the author's picks — "the gradient descent and SGD +
batch directions" and "two noise zones and the region of confusion" — because the
first alone is thin and the second repeats its setup. One fan of batch arrows,
seen at two distances from the optimum, answers both.

## One mechanism and one question

**A batch of four instead of all twenty. Is its direction simply a worse one —
everywhere?**

**The misconception.** Students read "approximate gradient" as "worse gradient"
and conclude that SGD wanders because it is sloppy — that the estimate degrades
near the solution, or that the noise grows as the iterate settles. Neither is
true. The chapter's own decomposition says the minibatch gradient is the true
gradient **plus mean-zero noise**. Far from the optimum the signal dominates and
every batch points broadly downhill; near the optimum the signal vanishes and the
same, unchanged noise is all that is left. One mechanism, two zones — and the
chapter's `fig-sgd-zones` shows the two zones as two static panels, which cannot
show that the noise between them did not change.

**What moves, and what two frames would lose.** The one tracked object is the
iterate. Everything else is the mechanism seen at two distances from the optimum.

1. **The five tips are one rigid shape riding on one arrowhead.** Each batch
   arrow's tip is the full arrow's tip displaced by that batch's own noise
   vector. Because every declared batch carries the same four `x` levels, those
   five displacements are *exactly* the same vector at every `(w, b)` — the suite
   checks it at six parameter vectors inside and outside the window, to `10⁻¹²`.
   So the dashed outline through the tips is a rigid pentagon that only ever
   translates, and its centroid is the full arrow's own head: unbiasedness, drawn.
2. **The arrow shrinks under it.** As the iterate steps in, the full arrow
   shortens while that pentagon keeps its size and shape. The fan therefore opens
   — not because the noise grew, but because the thing it was a small perturbation
   of has gone. Two frames show a narrow fan and a wide fan, which is equally
   consistent with "the noise grew near the optimum", the exact misconception the
   scene exists to kill. Only the motion distinguishes the two.
3. **One mark on the ruler never moves.** Under the plane a wine mark reads
   `‖∇L‖` and an ink mark reads the typical `‖ξ‖`. The wine mark slides from
   2.8814 to about 0.13; the ink mark is drawn once and is at the same pixel at
   every one of the eighty times the suite samples. The shaded strip below it is
   the region of confusion expressed as a number, and the iterate crosses into it
   in plain sight one beat before any caption names it.

**Verdict on the first/last-frame test: passes.** Side by side, the first and last
frames say "the gradient got small and now the batches disagree" — and leave the
*cause* completely open. The rigid pentagon and the immovable ink mark are only
legible over time, and they are the whole claim. The payoff is visual (a fan that
opens while the shape inside it does not change; a wine mark sinking past an ink
one), not a digit string.

## Fixture

The mechanism, its notation and its numbers where the chapter prints them. Line
numbers are in `chapters/part1/04-training-loss-sgd.qmd`.

| Quantity | Value | Chapter line |
|---|---|---|
| The minibatch update | `@eq-sgd` | 62–64 |
| Batch size against dataset size | "think 32 examples against a million" | 60 |
| Unbiasedness | `@eq-unbiased` | 70–72 |
| What unbiasedness does and does not give | "Each estimate is noisy; its average direction is right." | 76 |
| The algorithm's shuffle | `1. Shuffle the training data.` | 80 |
| The decomposition the scene draws | `\nabla\loss_{\mathcal B}(\vect{w}) = \nabla\loss(\vect{w}) + \vect{\xi}_{\mathcal B}, \qquad \E[\vect{\xi}_{\mathcal B}]=\vect{0}.` | 109–112 |
| The far zone | "Far from the optimum, the full gradient is large relative to the batch noise …" | 115–116 |
| The near zone and the name | "Near the optimum, the full gradient shrinks while batches can still disagree ("go left" — "go right") … **region of confusion**" | 117–119 |
| Batch size | `batch_size = 4` | 147 |
| Equal batches partitioning the data | `batches = torch.randperm(len(x1)).reshape(-1, batch_size)` | 148 |
| Mean of batch directions is the full direction | `    assert torch.allclose(directions.mean(0), full_direction, atol=2e-6)` | 173 |
| Why the figure's own points cannot be reproduced | `torch.manual_seed(6050)`, `x1 = torch.randn(80)` | 140–141 |
| The section the scene hands off to | `## The learning rate` | 221 |

The panel declares its own numbers as `data-*` attributes — `data-xs`,
`data-residuals`, `data-batch`, `data-line`, `data-start`, `data-rate`,
`data-steps`, `data-order`, `data-window`, `data-arrow`, `data-span` — and the
player and the tests read them rather than retyping a number.

### Declared computed variant 1: the schematic dataset

The chapter's eighty points come from `torch.manual_seed(6050)` (line 140) and are
**never printed**, so the figure's exact bowl cannot be reproduced. The panel
declares twenty points of its own, as **five replicate measurements at each of
four `x` levels** — so a batch of the declared `batch_size = 4` is one replicate
across all four levels, and twenty points make exactly five batches:

```
data-xs        = -1.5 -0.5 0.5 1.5
data-line      = -2 1.5                      →  y = −2x + 1.5
data-residuals = -0.4 -0.15 0.05 0.22 | 0.42 0.35 0.18 0.17 | 0.22 -0.05 -0.16 -0.53
                 | 0 0.14 0.24 0.34 | -0.35 -0.3 0.04 -0.43
y_{k,j}        = −2 x_j + 1.5 + r_{k,j}
batch 0        =  4.10, 2.35, 0.55, −1.28        batch 3 =  4.50, 2.64, 0.74, −1.16
batch 1        =  4.92, 2.85, 0.68, −1.33        batch 4 =  4.15, 2.20, 0.54, −1.93
batch 2        =  4.72, 2.45, 0.34, −2.03
```

**How this differs from Chapter 1's `downhill-bowl`.** That scene declares eight
scattered points on the chapter's own generating line `y = 2.5x − 1.0`, draws
twenty-five contour rings over the grid `[−1.5, 5.5] × [−4, 3]`, walks one round
orange walker from `(−0.5, 2.0)` down and to the right to a star at `(2.5, −1.0)`,
and finishes with a vertical shelf of twenty step-length bars and a `× 172` badge.
This scene declares a **different problem** — twenty replicated points on
`y = −2x + 1.5`, a negative slope — over its **own window** `[−2.5, −0.6] ×
[0.1, 2.0]`, with **no contour rings at all**, a diamond iterate travelling up and
to the left, a fan of five arrows and a rigid dashed pentagon, a shaded ellipse
labelled *region of confusion*, and a horizontal two-mark ruler under the plane
instead of a bar shelf. The two pictures share only the fact that both are
parameter planes, which is what the chapter's own two figures share too.

Why these twenty. `mean(x) = 0` and `mean(x²) = 1.25`, so the Hessian of the mean
squared error is the constant `H = 2·diag(1.25, 1)`, positive definite with
eigenvalues `2.5` and `2`; at the declared `α = 0.12` the per-step contraction
factors are `1 − αλ = 0.70` and `0.76`, both strictly inside `(0, 1)`. The
residuals sum to zero (`Σ r = 0`) and their `x`-weighted sum is zero
(`Σ x r = 0`), which puts the **empirical optimum exactly on the declared line**,
at `(−2, 1.5)` — verified in the browser and in the suite rather than assumed.
Their sample standard deviation is `0.277741`.

**Why the noise is exactly constant here.** For least squares,
`∇L_B(θ) − ∇L(θ) = 2(M_B − M)θ − 2(v_B − v)`, and every declared batch carries
the same four `x` values, so `M_B = M` exactly and the first term vanishes. The
noise vectors are therefore the same at every `(w, b)`:

| batch | `ξ_k` | `‖ξ_k‖` | direction |
|---|---|---|---|
| 0 | `(−0.515, 0.14)` | `0.533690` | 164.8° |
| 1 | `(0.23, −0.56)` | `0.605392` | 292.3° |
| 2 | `(0.59, 0.26)` | `0.644748` | 23.8° |
| 3 | `(−0.28, −0.36)` | `0.456070` | 232.1° |
| 4 | `(−0.025, 0.52)` | `0.520601` | 92.8° |

`Σ ξ_k = 0` exactly, so the mean of the five batch gradients is the full gradient
at every parameter vector, to `10⁻¹²` — the chapter's own assertion (line 173) at
a far tighter tolerance than its `2e-6`. The noise floor the ruler prints is the
root mean square, `0.556067`. **This exactness is a property of the declared
partition, not a general law**, and the panel's scope says so.

### Declared computed variant 2: the walk and the two drawing scales

| Quantity | Value |
|---|---|
| Start | `(−1.1, 0.6)`, displacement `(0.9, −0.9)` from the optimum |
| `‖∇L‖` at the start | `2.881405906844782` |
| Signal-to-noise at the start | `2.881406 / 0.556067 = 5.181765` |
| Widest batch direction at the start | `10.19°` off the full descent direction |
| Learning rate | `0.12` (declared; the chapter's own `α = 0.1` is printed in the *next* section) |
| Steps | `25` = five epochs, each a declared permutation of the five batches |
| Declared order | `2 4 0 3 1` · `4 0 3 1 2` · `0 3 1 2 4` · `3 1 2 4 0` · `1 2 4 0 3` |
| Signal crosses the floor | between step 4 (`0.9298`) and step 5 (`0.5352`) |
| Landing after 25 steps | `(−1.948977, 1.490757)`, `‖∇L‖ = 0.128891` |
| Badge at the last frame | `÷ 22`, from `round(2.881406 / 0.128891) = round(22.355)` |
| Region of confusion | the exact set `‖∇L(θ)‖ ≤ 0.556067`, an ellipse with semi-axes `0.222427` in `w` and `0.278033` in `b` |
| Tail distance from the optimum (last ten steps) | `0.0558 0.0140 0.0796 0.0907 0.0713 0.0532 0.0327 0.0800 0.0866 0.0734` — never zero, never monotone |
| Arrow magnification `κ` | `0.25` parameter units per gradient unit, the same at every time |
| Ruler span | `3` gradient units across the drawn rule |

Two scales appear, and they are different things. The **arrows** are drawn at the
fixed magnification `κ = 0.25`, so their lengths compare across the whole
timeline; the **step** actually taken is `α = 0.12` times the batch gradient, a
shorter vector that is never drawn. The chapter's own figure instead normalises
its batch arrows to unit length and picks a different arrow length per panel
(`arrow_lengths = [0.72, 0.46]`), which makes the two zones incomparable by eye —
the one thing this scene needs.

### Transfer check

> **Check yourself.** Move the iterate to twice its opening displacement from the
> optimum: (1.8, −1.8) instead of (0.9, −0.9). Does the spread of the five batch
> directions open wider or close up?
>
> It closes to about half: the widest arrow sits 5.39° off the true direction
> instead of 10.19°. The five noise vectors never change; doubling the
> displacement doubles the full gradient, 2.8814 to 5.7628, so the same sideways
> push bends a direction half as far.

Arithmetic. `∇L(θ) = 2M(θ − θ*)` with the constant `M = diag(1.25, 1)`, so the
gradient is linear in the displacement. At the start, `θ − θ* = (0.9, −0.9)` gives
`∇L = (2.25, −1.8)` and `‖∇L‖ = 2.881405906844782`. At `θ − θ* = (1.8, −1.8)`,
that is `θ = (−0.2, −0.3)`, `∇L = (4.5, −3.6)` and `‖∇L‖ = 5.762811813689564` —
exactly twice, along the same unit descent direction
`u = (−0.780869, 0.624695)`. Batch 2 is the widest at both points. Its drawn
direction is `−(∇L + ξ₂)` with the unchanged `ξ₂ = (0.59, 0.26)`, and resolving
`−ξ₂` on `u` gives `+0.298292` along `u` and `+0.571596` across it. So the angle
off the true direction is

```
start:  atan2(0.571596, 2.881406 + 0.298292) = atan(0.571596 / 3.179698) = 10.190889°
twice:  atan2(0.571596, 5.762812 + 0.298292) = atan(0.571596 / 6.061104) =  5.387415°
```

the printed `10.19°` and `5.39°`. The across-component is identical in the two
lines because `ξ` does not depend on `θ`; only the along-component doubled, which
is the whole answer. `scripts/test_sgd_zones_excerpt.cjs` recomputes both from the
declared points and checks the panel prints them.

## Beat timetable

Duration 40 s, beats `0 5 10 15 20 25 30 35`, shared transport, closed and paused
on open, 1.5× default. The walk runs at a uniform cadence from beat 3 to beat 7,
25 steps over 20 s, so a visible change of pace is never mistaken for a change in
the rule.

| Beat | Time | Walk | What the picture does | Caption |
|---|---|---|---|---|
| 0 | 0–5 | 0 | The iterate at `(−1.1, 0.6)`; the full descent arrow grows over 2.5 s; the ruler's wine mark stands at 2.8814. No fan, no floor, no ellipse. | Far from the optimum. This wine arrow is the full gradient over all twenty examples. |
| 1 | 5–10 | 0 | Five thinner arrows grow from the same point over 2 s, with a hollow ring at each tip. | Five batches of four, five directions. They spread — and every one still heads down the bowl. |
| 2 | 10–15 | 0 | Ink legs join the full arrow's head to each tip, the dashed pentagon closes through them, a hollow ring marks their centroid on that head, and the ruler gains its fixed ink mark at 0.5561 with the shaded strip below it. | Each batch is that same gradient plus its own fixed noise. The five noise vectors cancel. |
| 3 | 15–20 | 0 → 6.25 | The legs retire; the iterate steps, the trail draws, the full arrow shortens, the pentagon translates without changing, the wine mark slides left past the ink one. The prediction is asked. | Now step toward the optimum. Will the five still agree once the iterate arrives? |
| 4 | 20–25 | 6.25 → 12.5 | More steps; the signal is now 0.4860, below the floor, and the fan has opened past a right angle. | The signal has dropped under the noise floor. The spread is opening past a right angle. |
| 5 | 25–30 | 12.5 → 18.75 | The ellipse and its label cross-fade in over the final 0.6 s before the beat; the iterate is inside it. | The region of confusion: batches disagree because the signal went, not because the noise grew. |
| 6 | 30–35 | 18.75 → 25 | The last steps: the trail knots inside the ellipse and never closes on the optimum. | Inside it the iterate mills around and never settles. Same rule, same noise throughout. |
| 7 | 35–40 | 25 | A hollow wine mark appears where the signal started, with a bracket to the current mark and the badge `÷ 22`; the ink mark has not moved. | The floor never moved; the signal collapsed. That is why the step must eventually shrink. |

The ellipse cross-fade is the one glide that spans a beat boundary, and it
finishes **at** beat 5 rather than starting there, so an arrow-key seek parks on
the finished picture its caption describes.

## Reduced motion

One still per beat, held exactly: the player evaluates every continuous quantity
at a per-beat rest time (`3, 8.5, 13.5, 20, 24.3, 30, 35, 38`) rather than at the
clock, so the render at a beat and anywhere inside it is the same picture. Each
rest is the state that beat's caption describes — for a moving beat, the state it
ends in: the arrow fully grown at beat 0, the fan fully grown at beat 1, 6.25
steps at beat 3, 11.625 at beat 4, all twenty-five at beat 6. Beat 4 rests at
24.3 s, just before the ellipse's 0.6 s glide begins, so the ellipse is fully off
at beat 4 and fully on at beat 5 and is never caught part way in. `registerBeatHoldTest` walks the whole reduced timeline at 0.05 s
and requires exactly one drawn state in every beat interval.

## Withheld prediction

Beat 3's caption asks whether the five will still agree once the iterate arrives,
and the answer is named at beat 4, five seconds later. From `t = 0` to `t = 20`
the region of confusion is undrawn and unnamed, the start ghost and the badge are
undrawn, and no accessible string — caption, SVG `aria-label`, scrubber value
text, or any drawn label — matches
`confus…|disagree…|every direction|opposite|bounce|mill…|useless`. Up to the
moment the prediction is posed (`t ≤ 15`) the published signal-to-noise is still
above one, so nothing contradicts the far zone before the walk begins. Between
15 s and 20 s the wine mark crosses the ink one in plain sight: that is the
operation, shown before it is named, as the grammar requires. The suite asserts
all of this at ten times across the window, including each beat boundary and the
instant before it.

## Palette

| Mark | Colour | Why |
|---|---|---|
| The axis names `w` and `b`, the iterate, its trail | `#c05621` orange | `w` and `b` are the learnable parameters; the plane *is* parameter space and the iterate *is* the parameter vector. |
| The full arrow, the five batch arrows and their tips, the confusion ellipse and its label, the ruler's signal mark, the start ghost and the `÷ 22` badge | `#722f37` wine | Every one of them is a gradient of the loss, a level set of its size, or a measurement of one. |
| The five noise legs, the dashed pentagon, the centroid ring, the mark for the optimum, the ruler's noise mark and its shaded strip | `#232d4b` emphasis ink | `ξ` is a *shift* between a batch's arrow and the true one — none of the five roles — and the grammar draws such a ghost in the book's emphasis ink. The optimum is likewise neither input, prediction, target nor loss, and carries a cross glyph so the shape works without colour. |
| Frame, ticks, tick labels, the rule itself, "at the start" | grey | Scenery. |

Blue, green and purple do not appear: no `x`, no prediction and no `y` is drawn in
this picture, which is parameter space only. Every label that can fall on an arrow
or the shaded strip carries a white halo (`paint-order: stroke`), so it is read
against white. The film draws its full gradient in **blue**; blue is the input
colour in this book's grammar, so the full gradient here is wine like every other
slope of the loss.

The one typeset line is the chapter's own decomposition,
`\( \residualpart{\nabla\loss_{\mathcal B}(\vect{w})}=\class{sz-signal}{\residualpart{\nabla\loss(\vect{w})}}+\class{sz-noise}{\vect{\xi}_{\mathcal B}},\qquad\E\bigl[\class{sz-noise}{\vect{\xi}_{\mathcal B}}\bigr]=\vect{0} \)`,
in `span#eq-sgd-zones-1`. The TeX is never rewritten; `player.js` toggles
`sz-shown`, `sz-signal-lit` and `sz-noise-lit` on the wrapper, so the signal term
is washed while it is the thing shrinking and the noise term is washed while it is
the thing that is left. Live numbers are plain `<text>` on the picture, never
inside the formula. The panel links to `#eq-sgd` and `#eq-unbiased`, both of which
the rendered chapter defines.

## Teaching boundary

The one visible sentence: *the minibatch gradient is unbiased, never a worse
gradient; near the optimum the noise does not grow, the signal vanishes, and
nothing in this panel is trained.* Inside the closed **Scope and caveats**
disclosure:

- The dataset is **schematic**, and deliberately not Chapter 1's declared line.
  Every gradient, noise vector, mean, spread, step and ruler reading is computed
  in the browser from the twenty declared points. The decomposition, the
  unbiasedness statement, `batch_size = 4` and the two zones are the chapter's.
- The **region of confusion is about the gradient estimate**, not the loss. It is
  the exact set where the full gradient is shorter than a typical batch noise
  vector; the loss inside it is near its minimum, not confused. Its ellipse is
  this panel's computed level set, whereas the chapter draws a circle of radius
  `0.82` chosen by hand.
- The five noise vectors are exactly constant here **because of this declared
  partition** — every batch carries the same four `x` values. In general a
  batch's noise varies with the parameters, and only its expectation is pinned to
  zero.
- The arrows are drawn at one declared magnification; the step actually taken is
  `α` times the batch gradient, a shorter vector that is never drawn.
- The batch order is a **declared deterministic list** of five epochs, each a
  permutation of the five batches. The chapter prescribes a shuffle, and its own
  honest fine print (lines 86–98) notes that after the first batch moves `w`, the
  next batch is no longer an independent unbiased draw at the *new* iterate; the
  one-line proof in `@eq-unbiased` does not cover that.
- Five batches stand in for the chapter's twenty. More batches would not narrow
  the spread; a **larger batch** would, which is the sibling scene's mechanism and
  not shown here.
- The remedy for the milling — letting the step size come down — belongs to
  §"The learning rate", which begins immediately below this panel, and is not
  shown. No learning rate other than `0.12` appears and the panel makes no claim
  about what another would do.
- Nothing is trained, no loss curve is plotted, and no measured run appears.

## Not imported from the film

`TwoZones` (2:08–3:02, 54 s) supplied composition and reveal order only: the far
point with all batch arrows drawn faint beneath the full gradient and the mean
overlapping it exactly; then the optimum, where the full gradient disappears and
the fan spreads; then the name. Specifically omitted:

- **The film's data and counts.** Its `ZDATA` is 80 rows and it draws **eight**
  batch arrows; this panel declares twenty points in five batches of the
  chapter's own `batch_size = 4`. None of the film's numbers appears.
- **The film's zone cards** — `FAR FROM THE MINIMUM · median batch cosine ≈ +0.98`
  and `REGION OF CONFUSION · direction spread ≈ 169°` — its kicker band, its
  right-hand `EQ.noise` column, its chrome and its narration. Those numbers come
  from the film's own seeded data and are not the chapter's.
- **The film's blue full gradient.** Blue is the input colour here; see the
  palette above.
- **The cut between the two zones.** The film jumps from `(−0.5, 2.0)` to the
  optimum, exactly as `fig-sgd-zones` does. This scene *walks* between them,
  which is the only way the rigid noise pentagon and the shrinking arrow can be
  seen to be independent — the whole point of the merge.
- **The `Minibatch` scene** (1:20–2:08): its scoop card, its eight batch arrows
  chained tip-to-tail at one eighth, its `BATCH n/8` readout. That is a second
  picture and the grammar allows one; unbiasedness is carried here by the tips'
  centroid landing on the full arrow's head, which is the same identity drawn in
  place.
- **The `BatchSize` scene** (3:48–4:26): the `1/√B` law and the
  finite-population factor `√((n−B)/(n−1))`. That is the batch-size mechanism, a
  different scene.

## Acceptance

`scripts/test_sgd_zones_excerpt.cjs` recomputes every gradient from the declared
points independently of the player, differentiates each batch loss by central
differences, and checks: the chapter literals verbatim and the anchor; five equal
batches whose residuals sum to zero unweighted and `x`-weighted, so the empirical
optimum is exactly the declared line, with a positive-definite Hessian and a
convergent contraction at `α = 0.12`; unbiasedness to `10⁻¹²` at six parameter
vectors inside and outside the window, against a second, numerical route to each
batch gradient; that the five noise vectors are identical at all six and sum to
zero; that the fan is inside 15° at the start and spans at least three quadrants
at the optimum; that the walk is the declared loop with every epoch a permutation
and every step exactly `−α` times one batch gradient, that the signal starts above
five times the floor and crosses it before half the steps, and that the tail never
reaches the optimum and is not monotone; that each drawn tip is the full arrow's
head displaced by that batch's noise at the drawing scale, identical at eight
times, with the tips' centroid on that head; that the drawn full arrow is `κ` times
the published signal; that the ruler's signal mark tracks `‖∇L‖` at eighty times
while the noise mark never moves a pixel, at both layouts; the withheld prediction
across `[0, 20)` in the drawing and in every accessible string; each beat's reveal
state; house-style numbers and no text box leaving or colliding inside the picture
at seven widths and ten times; the single reflow with equal scale on both axes;
deterministic seeking of the whole published state, forwards and backwards; and
static parity with a fresh render at four-decimal geometry. With the three harness
registrations (`registerTransportTests`, `registerBeatHoldTest`,
`registerGrammarTests`) the suite is **43/43 passing**.

Rendered frames were inspected at 1280 px and 375 px at `t = 2, 7, 12, 17, 22, 27,
32, 37, 39.9`, in reduced motion, and with scripts off: figure width 713 / 302,
page overflow 0, no SVG text outside the picture, no console errors.

`scripts/test_excerpt_checks.cjs` is the orchestrator's; this scene's transfer
answer is not recomputed there until it adds the entry.

## Source digests

Lecture paths are relative to
`/Users/hs9hd/Library/CloudStorage/Box-Box/Teaching/6050/Video_lectures/`.

| Source | SHA-256 |
|---|---|
| `chapters/part1/04-training-loss-sgd.qmd` | `400affc9c731f95b5d7be32f3e449f5fe8080bd010ffa6b7eab9145b0c0dd354` |
| `6050-Ch4/STORYBOARD.md` | `c5f8b635909b585d6c62f310ef2e16801c58421127d9ef6d536d7fbd331db9ce` |
