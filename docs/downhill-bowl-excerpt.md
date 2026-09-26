# Downhill bowl: source and acceptance receipt

**Built, not published.** Chapter 1's first mechanism excerpt, adapted from the
`SDescent` scene of the DS 6050 Chapter 1 film. The insertion point is
`before-heading` → `Build the complete model three ways` in
`chapters/part1/01-linear-regression.qmd`, so the panel lands after the
`fig-gd-path` cell and its follow-up paragraph, outside the Plan → Code wrapper:
`01-linear-regression.html#downhill-bowl-excerpt`. The shared manuscript, its
figure and all frozen evidence are unchanged; nothing here is added to the PDF.

## One mechanism and one question

**Twenty steps from one start, at one fixed learning rate. Will every step be the
same length?**

**The misconception.** Students read a descent path whose dots bunch up near the
minimum and conclude that gradient descent *slows down as it converges* — that
something decays the step, or that the algorithm can see the bottom coming. It
cannot see anything. The step vector **is** `η` times the local gradient, and near
the bottom that gradient is small. The chapter's own `fig-gd-path` shows a path
with shrinking steps but cannot show *why each step is the length it is*.

**What moves, and what two frames would lose.** The first frame is a walker alone
on a blank plane; the last is a complete path with a shelf of shrinking bars and
the contours lit. Side by side a student gets "it went there and the dots bunch
up" — which is equally consistent with a decaying schedule, and says nothing about
what the walker knew. Three things only the motion carries:

1. **The arrow becomes the step.** A dashed arrow of length `‖∇L‖` grows from the
   walker's feet; a solid arrow is drawn as its **first quarter**, with ticks at
   the quarters, because `η = 0.25`; then the walker slides along that solid arrow
   and stops exactly at its tip. A wine arrow — advice from the loss — turns into
   an orange segment of trail — history in the parameters. Two frames can show an
   arrow and a landing; only the motion shows they are the same object.
2. **The arrow shortens while the rule does not.** Nineteen more steps run at a
   uniform cadence in time, so the walker's visible deceleration is the shrinking
   step and never a slowing clock. Each completed step writes its own bar.
3. **The contours arrive last, as the reader's privilege.** For thirty seconds the
   bowl is not drawn at all: the honest picture of what the algorithm reads. Only
   after the walk has played do the rings appear — crowded where the walk began,
   open near the bottom — and only then does the caption make the causal claim.

**Verdict on the first/last-frame test: passes.** The motion is the operation
itself (scaling by `η` is a literal quartering of one ray; a step is a slide along
that ray to its tip), the payoff is visible to the eye (the bar shelf, and the
badge `× 172`), and the prediction is answered by watching rather than by reading
a digit.

## Fixture

Every structural constant is the chapter's own printed literal. Line numbers are
in `chapters/part1/01-linear-regression.qmd`.

| Quantity | Value | Chapter line |
|---|---|---|
| The blindfold image the scene opens on | "imagine standing on it *blindfolded* … you can feel the slope under your feet" | 257–260 |
| The loss landscape as a surface over the parameter plane | "With two parameters, $(w,b)$, this scalar becomes a surface over the parameter plane. / That surface is the **loss landscape**." | 183–184 |
| The update rule | `@eq-gd` | 265–271 |
| The MSE gradient | `@eq-gd-grad` | 275–291 |
| Generating line | `y1 = 2.5 * x1 - 1.0 + 0.3 * torch.randn(60)` | 314 |
| Start | `w, b, path = -0.5, 2.0, []` | 326 |
| Step count | `for _ in range(20):` | 327 |
| Learning rate and the `w` update | `    w -= 0.25 * float(2 * (err * x1).mean())` | 330 |
| The `b` update | `    b -= 0.25 * float(2 * err.mean())` | 331 |
| Grid extents | `np.linspace(-1.5, 5.5, 100)`, `np.linspace(-4.0, 3.0, 100)` | 320–321 |
| Contour level count | `levels=25` | 345 |
| The star | `ax2d.plot(2.5, -1.0, "k*", ms=12, label="data-generating parameters")` | 348 |
| The claim the scene explains | "Gradient descent needs only the local slope, not a view of the whole bowl." | 304 |

The panel declares them as `data-*` attributes — `data-start`, `data-rate`,
`data-steps`, `data-grid`, `data-generating`, `data-levels` — and the player and
the tests read them rather than retyping a number.

### Declared computed variant: the schematic dataset

The chapter's sixty points come from `torch.manual_seed(6050)` and are **never
printed**, so the figure's exact bowl cannot be reproduced. The panel therefore
declares eight points of its own, on the chapter's own generating line
`y = 2.5x − 1.0` with a small declared spread:

```
data-xs        = -0.8 -0.4 -0.1 0.2 0.5 0.9 1.3 1.6
data-residuals = 0.18 -0.22 0.1 -0.14 0.21 -0.09 -0.19 0.15
y_i            = 2.5 x_i − 1.0 + r_i
               = −2.82, −2.22, −1.15, −0.64, 0.46, 1.16, 2.06, 3.15
```

**The path drawn in this panel is this panel's, not the figure's.** The rule, the
start, the learning rate, the step count, the grid extents, the level count and
the generating parameters are the chapter's. Every quantity below is computed in
the browser from those eight declared points; nothing is transcribed.

Why these eight. `mean(x) = 0.4`, `mean(x²) = 0.77`, so the sample variance is
`0.61` and the Hessian of the mean squared error, `H = 2 [[0.77, 0.4], [0.4, 1]]`,
is positive definite with eigenvalues `2.602406` and `0.937594`. At the chapter's
own `η = 0.25` the per-step contraction factors are `1 − ηλ = 0.349398` and
`0.765602`: both strictly inside `(0, 1)`, so the walk converges monotonically
without oscillating, and the slow direction decays slowly enough that the
shrinking is legible across all twenty steps. The residuals sum to zero.

Computed witnesses, all recomputed in `scripts/test_downhill_bowl_excerpt.cjs`
by a second implementation of the chapter's loop:

| Quantity | Value |
|---|---|
| Loss at the start `(−0.5, 2.0)` | `8.6999` |
| `‖∇L‖` at the start | `4.219395757984785` |
| Step 1 length, `η‖∇L‖` | `0.25 × 4.219395757984785 = 1.0548489394961962` |
| Position after step 1 | `(0.0501875, 1.1)` |
| `‖∇L‖` at step 20 | `0.024532217760990276` |
| Step 20 length | `0.006133054440247569` |
| Ratio, printed as the badge `× 172` | `1.0548489394961962 / 0.006133054440247569 = 171.9940609973806` |
| Position after step 20 | `(2.4682188237996345, −0.9816385277849736)` |
| Least-squares minimum of the declared data | `(2.4842213114754097, −0.993688524590164)`, loss `0.02749813` |
| Offset of that minimum from the generating parameters | `0.0158` in `w`, `0.0063` in `b` |
| Max loss over the chapter's grid corners | `32.6154`; twenty-five levels give a gap of `1.303516` |

The contours are drawn from the closed form rather than from a sampled grid:
mean squared error is exactly quadratic, so `L = L_min + ½ (p − p*)ᵀ H (p − p*)`
and each level set is an exact ellipse, parameterised through the eigenvectors of
`H`. The suite inverts the drawn screen coordinates and checks that every sampled
vertex of every ring has that ring's loss to within `2 × 10⁻³`, and that the
twenty-four drawn levels are equally spaced.

### Transfer check

> **Check yourself.** Move the start twice as far from the minimum, along the same
> direction. How does the first step change, and does the walker need more steps to
> arrive?
>
> The first step doubles, to about `2.1097`, because on a quadratic bowl the
> gradient is proportional to the displacement from the minimum. Doubling the start
> doubles every step and every position, so twenty steps still cover the same
> fraction of the distance.

Arithmetic. The minimiser is `(2.4842213114754097, −0.993688524590164)`; the
chapter's start is displaced from it by `(−2.9842213114754097, 2.993688524590164)`.
Doubling that displacement gives the start `(−3.4842213114754097,
4.993688524590164)`, where `‖∇L‖ = 8.43879151596957` and
`η‖∇L‖ = 2.1096978789923924`, exactly `2 × 1.0548489394961962`. Because the
gradient of a quadratic is linear in the displacement, `p − p* ↦ (I − ηH)(p − p*)`
is the same linear map from any start, so every step and every position scales by
the same factor two and the number of steps to any fixed *relative* accuracy is
unchanged.

## Beat timetable

Duration 40 s, beats `0 5 10 15 20 25 30 35`, shared transport, closed and paused
on open, 1.5× default.

| Beat | Time | What the picture does | Caption |
|---|---|---|---|
| 0 | 0–5 | The walker alone at `(−0.5, 2.0)`. No contours, no star, no arrow: the blindfold. | Blindfolded on the loss surface: the walker knows where it stands and nothing else. |
| 1 | 5–10 | The dashed `−∇L` arrow grows from the walker's feet over 2.5 s; `‖∇L‖ 4.2194` prints only once it is drawn at true length. | All it can feel is the slope underfoot. This arrow points straight downhill. |
| 2 | 10–15 | The solid step arrow grows along the same ray to one quarter of it; three ticks mark the quarters; `η‖∇L‖ 1.0548`. | The step is that arrow scaled by the learning rate: one quarter of it, since it is 0.25. |
| 3 | 15–20 | The dashed arrow leaves; the walker slides along the solid arrow and lands on its tip, leaving the first orange segment. The prediction is asked. | The walker slides along the arrow and stops at its tip. Will the next nineteen steps be this long? |
| 4 | 20–25 | Steps 2–10, uniform in time. The shelf of bars appears and fills; `1.0548` labels the first bar. | Nine more steps, one rule, one learning rate. Each bar records the step it took. |
| 5 | 25–30 | Steps 11–20. The arrows at the head become shorter than the walker; `0.0061` labels the last bar. The contours cross-fade in over the final 0.6 s, finishing at the beat. | Ten more. The arrows are now too short to see, and the bars say so. |
| 6 | 30–35 | Contours and the star hold. The arrow and both readouts sit on the last step. | Now the contours the walker never saw: crowded and steep out there, open near the bottom. |
| 7 | 35–40 | The badge `× 172` appears on the shelf; the formula's `η` lights. | The step shrank because the slope did. Nothing was scheduled and nothing was seen. |

The contour cross-fade is the one glide that spans a beat boundary, and it
finishes **at** beat 6 rather than starting there, so an arrow-key seek parks on
the finished picture its caption describes.

## Reduced motion

One still per beat, held exactly: the player evaluates every continuous quantity
at a per-beat rest time rather than at the clock, so the render at a beat and
anywhere inside it is the same picture. Each rest is the state that beat's caption
describes — for a moving beat, the state it ends in: the arrow fully grown at beat
1, the first landing at beat 3, ten steps at beat 4, all twenty at beat 5. The
contours are off at beat 5 and on at beat 6; the rings are never partially faded
in reduced motion. `registerBeatHoldTest` walks the whole reduced timeline at
0.05 s and requires exactly one drawn state in every beat interval.

## Withheld prediction

From `t = 0` until the walk begins at `t = 20` the answer is absent from the
drawing, from the SVG `aria-label` and from the scrubber's value text: the shelf
and every bar are undrawn, the star and the badge are undrawn, the trail carries
at most the first step, and no accessible string matches
`shrink|shrank|shrinking|shorter|smaller|decreas…`. The suite asserts this at ten
times across the window, including each beat boundary and the instant before it.

## Palette

| Mark | Colour | Why |
|---|---|---|
| The `(w, b)` plane and its axis names, the walker, the trail | `#c05621` orange, plus a 4.5 % orange ground | `w` and `b` are the learnable parameters; in this chapter the plane *is* parameter space. |
| Contour rings, both arrows, the quarter ticks' subject, the bars, the badge | `#722f37` wine | Rings are level sets of the loss; the arrows are its slope; the bars are `η` times that slope. |
| The star at `(2.5, −1.0)` | `#232d4b` emphasis ink, plus a star glyph | Neither an input, a prediction, a target nor a loss; the chapter draws it black, and the shape carries it without colour. |
| Frame, ticks, quarter ticks, shelf rule | grey | Scenery. |

Blue, green and purple do not appear: no `x`, no prediction and no `y` is drawn in
this picture, which is parameter space only. Every number on the picture carries a
white halo (`paint-order: stroke`) so it is read against white rather than against
a ring or the tint; the halo is restricted to `<text>`.

The one typeset line is the chapter's rule,
`\( \parameterpart{(w,b)^{(t+1)}}=\parameterpart{(w,b)^{(t)}}-\class{db-eta}{\eta}\,\class{db-grad}{\nabla\residualpart{\loss}} \)`,
in `span#eq-downhill-bowl-1`. The TeX is never rewritten; `player.js` toggles
`db-shown`, `db-grad-lit` and `db-eta-lit` on the wrapper. Live numbers are plain
`<text>` on the picture, never inside the formula. The panel links to `#eq-gd` and
`#eq-gd-grad`, both of which the rendered chapter defines.

## Teaching boundary

The one visible sentence: *a quadratic bowl is the special case that makes mean
squared error easy; a deep network's loss surface has no such bowl, and nothing
drawn here is a measured training run.* Inside the closed **Scope and caveats**
disclosure:

- This is **full-batch** gradient descent over every declared point, not the
  stochastic version `@sec-04-training-loss-sgd` introduces.
- The contour view is a **drawing device for the reader**. The algorithm reads only
  the gradient at the point it stands on and never sees a ring; that is why the
  scene withholds the rings for thirty seconds.
- The dataset is **schematic**, and the path shown is therefore this panel's, not
  the figure's. The rule, the start, the learning rate, the step count, the grid
  extents and the generating parameters are the chapter's.
- `w` and `b` are drawn at **equal scale**, so each arrow meets its contour at a
  right angle. The chapter's matplotlib panel does not preserve that; the equal
  scale is this panel's drawing choice, made so the perpendicularity is legible.
- Levels are **equally spaced in loss**, as `levels=25` makes them, so crowded
  rings mean a steep surface and the open middle is what a flat bottom looks like
  rather than missing data.
- The star is the **data-generating parameters**, not this dataset's least-squares
  minimum, which sits `0.0158` lower in `w` and `0.0063` higher in `b` — closer
  than one pixel at the drawn scale.
- Each bar carries the same number as the arrow beside the walker at that step;
  all twenty share one scale. The shelf is twenty step lengths, not a training
  curve: no epoch, no validation quantity and no experiment is plotted.
- **No learning rate other than 0.25 is shown**, and the panel makes no claim about
  what a larger one would do.

## Not imported from the film

The film's `SDescent` is a rich sixty-second scene. Composition and reveal order
were taken; its framework, chrome and off-page narration were not. Specifically
omitted:

- **The three-dimensional bowl.** The film's mesh surface, its `Z_CAP` ceiling, its
  droplines and its 8× magnifier are all absent; the backlog defers 3-D, and this
  scene's question does not need height.
- **The `η 0.24 → 0.9` stride beat.** The film's red ghost walker over-shoots and
  climbs the far wall — a striking payoff, and the one place an `η` slider would
  have been allowed under rule 1's parameter-control amendment. It is deliberately
  left out: that amendment permits a control *when the mechanism is that
  parameter's effect*, and this scene's mechanism is the **gradient's** effect. A
  draggable `η` would invite exactly the wrong answer to the scene's own question
  ("the steps shrink because `η` is small"), and learning-rate behaviour belongs to
  `@sec-04-training-loss-sgd`. The scene therefore carries no parameter control at
  all, and the scope says so in as many words.
- **The template-arrow inset.** The film's 1:1 top view in which the knob point is
  the augmented vector `w̃ = (w, b)` from the origin, with its cumulative angle and
  norm readout, is a second picture; the grammar allows one.
- **The data panel.** The film's scatter card with the fitted line whipping as the
  walk proceeds, the `STEP` / `MSE` chips, the `LOSS BY STEP` log-excess panel with
  its broken axis, the stride bar and the knob counter `2 → 10⁹`. The bar shelf
  here is a deliberately smaller, single-quantity substitute for the film's loss
  panel: it carries step length, which is what the scene's claim is about, and the
  caption names it as `η × ‖∇L‖` so it cannot be read as a results plot.
- **The film's numbers.** The film's `PATH`, `OPT_W/OPT_B`, `L_ZERO`, `GHOST_*` and
  its readouts come from the film's own seeded dataset and are not the chapter's;
  none of them appears here. Only the film's *reveal order* was reused — the
  blindfolded hold with the landscape dimmed, then the `−∇L` arrow arriving as the
  answer, then hop one worked in numbers under the update rule, then the walk.

## Acceptance

`scripts/test_downhill_bowl_excerpt.cjs` reruns the chapter's loop independently,
differentiates the loss by central differences at every path point, and checks:
the chapter literals verbatim and the anchor; the declared points on the
generating line with a positive-definite, well-conditioned Hessian and a
convergent contraction at `η = 0.25`; `step = −η∇L` and `‖step‖ = η‖∇L‖` at every
step, with a monotone decrease; that the drawn step arrow is exactly `η` times the
drawn gradient arrow and that the walker's landing is that arrow's tip; that every
drawn contour vertex has its declared level and that the levels are equally spaced;
that the bars are the step lengths on one shared scale at a constant pitch; the
withheld prediction across `[0, 20)` in the drawing and in every accessible string;
each beat's reveal state; house-style numbers and no text box leaving or colliding
inside the picture at seven widths and ten times; the single reflow with equal
scale on both axes; deterministic seeking of the whole published state, forwards
and backwards; and static parity with a fresh render, including namespaced ids and
four-decimal geometry in the narrow print. With the three harness registrations
(`registerTransportTests`, `registerBeatHoldTest`, `registerGrammarTests`) the
suite is **43/43 passing**.

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
| `chapters/part1/01-linear-regression.qmd` | `7934ebaf9224f7dd6f520c87152760501ca0cd368f0f05b49789acd475c89008` |
| `6050-Ch1-enhanced/STORYBOARD.md` | `061e5954970c22dcb4dae6a353271e3e33237d31c90b6525577c1d01bcf0e28e` |
