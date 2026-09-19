# Step length: source and acceptance receipt

**Built, not published.** Chapter 4's mechanism excerpt for §"The learning rate",
adapted from the `LearningRate` scene of the DS 6050 Chapter 4 film. The insertion
point is `before-heading` → `The batch size` in
`chapters/part1/04-training-loss-sgd.qmd`, so the panel closes the learning-rate
section after the `fig-lr` cell and after the **Practical rule of thumb** callout,
immediately before the section on batch size:
`04-training-loss-sgd.html#step-length-excerpt`. The shared manuscript, its figure
and all frozen evidence are unchanged; nothing here is added to the PDF.

This is the sequel [the Chapter 1 bowl](downhill-bowl-excerpt.md) promised. That
scene owns "the step is `η` times the local slope" and says in as many words that
**no learning rate other than 0.25 is shown, and the panel makes no claim about what
a larger one would do** — the claim it deferred to this chapter. This panel is that
claim, and it is deliberately a different picture: the Chapter 1 scene is a contour
map of the `(w, b)` plane with a shelf of step-length bars beside it; this one is a
single-parameter cross-section, loss on the vertical axis, where a step is a slide
along a curve and an overshoot is a landing further up the opposite wall. Nothing of
the bowl scene's furniture — contours, the star, the bar shelf, the two-dimensional
plane — appears here.

## One mechanism and one question

**Three learning rates on one bowl, from one start. Is the largest one simply slower
to arrive — or does it never arrive at all?**

**The misconception.** Students read "too large" as "too fast": the iterate
overshoots a bit, wobbles, and still gets there — a rate is a speed dial with a
comfortable end and an uncomfortable end. It is not. Past a threshold every step
lands *further* from the bottom than the last, the loss rises every step, and it
rises geometrically. And the other side is misread too: "too small" reads as safe.
The chapter names its real cost in its first sentence about the knob — *too small
wastes your compute budget crawling* — and that cost is steps, not risk. The
chapter's own `fig-lr` is a semilog plot of loss against step index: three curves,
one of which goes up. It cannot show *where the ball is* when that happens, and a
reader who has not already internalised the geometry sees only that a line went the
wrong way.

**What moves, and what two frames would lose.** One ball on one declared quadratic
bowl, the parameter on the horizontal axis and the loss on the vertical, so a step is
a slide along the curve and "higher" is literally higher. `α` is the scene's one
control (rule 1's amendment: the mechanism *is* this parameter's effect), timeline-driven
through the chapter's three printed rates and then draggable. Three things only the
motion carries:

1. **The same arrow, three lengths, three fates.** A dashed arrow at the ball is the
   raw slope; a solid arrow on the ball's own level is `α` times it, and its tip is
   where the ball goes next. At 0.005 the solid arrow is shorter than the ball. At
   0.12 it is a comfortable fraction. At 1.1 it is *longer than the dashed one* and
   its tip is past the minimum, up the far wall. One rule, one slope, three arrows —
   and then the ball slides to each tip in turn. Two frames can show three arrow
   lengths; only the motion shows that the same rule drew all three.
2. **The climb, and the exit.** At 1.1 the ball crosses the valley and lands above
   the dotted line it started on, four times, each landing 1.44 times the height of
   the last, and then leaves the picture on the fifth step while the loss readout
   keeps climbing to 166.3958. A first frame and a last frame give "it started here
   and ended at the edge", which is exactly compatible with "it overshot once and is
   on its way back" — the misconception. The staircase is the refutation and the
   staircase is motion.
3. **The knife edge, found three ways in a row.** At `α = 1` the step lands exactly
   on the ring on the far wall: the bounce repeats for ever at the same height,
   neither growing nor shrinking. One beat later, at nine tenths of that, the ball
   still crosses the valley every step but each landing is lower. Growing, level,
   shrinking — three adjacent beats at three rates within 20 % of each other. No pair
   of frames can show that a boundary is *there*; and a reader who wants to find it
   for themselves drags the control and watches the eight landings recompute.

**Verdict on the first/last-frame test: passes.** The first frame is a ball resting
on a bowl with one dashed arrow; the last is a ball at the bottom with nine landing
dots behind it and a ring on the far wall. Side by side a student gets "it went
down", loses the crawl entirely, loses the climb entirely, and loses the boundary
entirely — the ring in the last frame is unexplained furniture. The payoff is visible
to the eye (an arrow overshooting the bottom; a staircase of landings climbing
alternate walls; a bounce that repeats at one height), not a digit string, and the
one parameter the mechanism is about can be dragged.

## Fixture

Line numbers are in `chapters/part1/04-training-loss-sgd.qmd`.

| Quantity | Value | Chapter line |
|---|---|---|
| The knob and its asymmetric failure modes | "too small wastes your compute budget crawling; too large / overshoots the valley and diverges." | 223–225 |
| The update rule the scene steps by | `@eq-full-gd` | 47–49 |
| The three rates, with the figure's colours | `for lr, style, color in [(0.005, "-", "#5379AA"), (0.12, "-", "#E57200"), (1.1, "--", "#722F37")]:` | 254–255 |
| The start | `    w, b, out = torch.tensor(-0.5), torch.tensor(2.0), []` | 243 |
| The chapter's own step budget | `def losses_for(lr: float, steps: int = 60) -> list[float]:` | 242 |
| The experimental design the scene reuses | "Same problem, same steps, three learning rates. Too small crawls; too large overshoots back and forth and climbs; the middle one converges quickly." | 238 |
| The generating weight the bowl's minimum sits on | `y1 = 2.5 * x1 - 1.0 + 0.4 * torch.randn(80)` | 142 |
| The rule of thumb | "For the normalized toy problems here, plain SGD often starts around / $\alpha = 0.1$." | 265–266 |
| The reading rule | "crawling $\rightarrow$ consider raising it; oscillating or / exploding $\rightarrow$ lower it." | 268–269 |
| Decay schedules, named as out of scope here | "Later in training it often pays to *decay* the / learning rate so the fine-tuning steps get smaller; that is a **learning-rate / schedule**." | 269–272 |

The panel declares them as `data-*` attributes — `data-start`, `data-rates`,
`data-minimum`, `data-guide` — and the player and the tests read them rather than
retyping a number. Every rate the captions and the stage names speak is formatted
back out of `data-rates`, `data-guide` or the computed threshold, so no rate appears
twice as a literal anywhere in this scene.

### Declared computed variant: the bowl, and therefore the threshold

The chapter's `fig-lr` runs on the eighty seeded points of `fig-sgd-zones`
(`torch.manual_seed(6050)`), in two parameters, and neither the points nor the
resulting bowl is ever printed. So the panel declares its own one-parameter bowl:

```
data-curvature = 2      L(w) = ½ · 2 · (w − 2.5)² = (w − 2.5)²,   L'(w) = 2 (w − 2.5)
data-minimum   = 2.5    the chapter's generating weight (line 142)
data-start     = −0.5   the chapter's printed start (line 243)
data-steps     = 8      this panel's budget; the chapter's helper runs sixty
data-window    = −4 9   the drawn window, symmetric about the minimum
data-dial      = 0 1.25 the range of the one control
```

**Why curvature 2.** For a squared-error loss the curvature in `w` is
`2 · mean(x²)`, and the chapter's features are `torch.randn`, so `mean(x²) ≈ 1` and
the curvature of a *normalized* toy problem is about 2. That is the same word the
rule of thumb turns on, and it is why 0.1 is the advice: 2 is the curvature that puts
the wall at 1, and 0.1 is a tenth of it.

**The threshold, computed in the browser.** For `L(w) = ½c(w − w*)²`, one full-batch
step is `w − w* ↦ (1 − αc)(w − w*)`. The walk shrinks exactly when `|1 − αc| < 1`,
that is when `0 < α < 2/c`; at `α = 2/c` the factor is exactly `−1` and the iterate
oscillates for ever without growing or shrinking. Here `α★ = 2 ÷ 2 = 1`. **That the
threshold equals 1 is this curvature's coincidence, not a law**, and both the scope
note and the transfer check say so.

**The three chapter rates against that threshold**, factor `1 − αc`:

| Rate | Factor `1 − 2α` | Behaviour | After 8 steps |
|---|---|---|---|
| `0.005` | `0.99` | clearly too slow: 1 % of the distance per step | `w = −0.2682`, loss `7.6631` of the start's `9.0000` |
| `0.12` | `0.76` | healthy and monotone: no valley crossing at all | `w = 2.1661`, loss `0.1115` |
| `1.1` | `−1.2` | divergent: alternating sides, loss `× 1.44` each step | `w = −10.3995`, loss `166.3958` |

The scene adds two probe rates, both derived from the computed threshold rather than
invented: `α★ = 1` (factor exactly `−1`) and `0.9 α★ = 0.9` (factor `−0.8`:
oscillating, but converging).

**The cost of crawling, in the chapter's own currency.** To bring `|w − w*|` from 3
down to 0.01 needs `⌈ln(0.01/3) / ln|1 − 2α|⌉` steps: **568** at `α = 0.005` against
**21** at `α = 0.12`, about twenty-seven times the compute for the same answer. That
is "wastes your compute budget crawling" as a number.

**Where the picture stops and the numbers do not.** With the window `w ∈ [−4, 9]`
the `α = 1.1` walk keeps five landings inside the frame — `−0.5`, `6.1`, `−1.82`,
`7.684`, `−3.7208`, at losses `9`, `12.96`, `18.6624`, `26.8739`, `38.6984` — and
leaves on the sixth, at `9.96496`. From there the ball is pinned to the frame with a
chevron and the loss readout keeps the true value, ending at `166.3958`; landings
outside the window are not drawn. The clamp is a drawing device and the scope says so.

All of these are recomputed in `scripts/test_step_length_excerpt.cjs` by a second
implementation of the update rule, checked against the closed form
`w_k − w* = (w₀ − w*)(1 − αc)^k` and against a central difference of the declared
loss.

### Transfer check

> **Check yourself.** Leave the feature unnormalized so the bowl is ten times as
> curved, c = 20 instead of 2. Which of the chapter's three rates still converges?
>
> Only 0.005. The threshold falls to `2 ÷ 20 = 0.1`, so the chapter's middle rate is
> now past it: its factor is `1 − 0.12 × 20 = −1.4`, and the distance to the bottom
> grows by 1.4 every step. That is what the words *normalized toy problems* are doing
> in the rule of thumb.

Arithmetic. With `c = 20` the threshold is `2/c = 2 ÷ 20 = 0.1`. The factors are
`1 − 0.005 × 20 = 0.9` (|0.9| < 1, converges, and in fact faster than it did on the
shallower bowl), `1 − 0.12 × 20 = 1 − 2.4 = −1.4` (|−1.4| > 1, diverges; the loss,
which is the square of the displacement, grows by `1.4² = 1.96` a step), and
`1 − 1.1 × 20 = −21` (diverges violently). So exactly one of the three survives. The
reader cannot reach this by dragging: the control moves `α`, never `c`, and the final
frame shows only the `c = 2` bowl.

## Beat timetable

Duration 40 s, beats `0 5 10 15 20 25 30 35`, shared transport, closed and paused on
open, 1.5× default. Each running beat replays the same eight steps from the same
start; the rate and the ball reset discretely at the beat, as the caption does, so an
arrow-key seek lands on a beat whose rate and whose ball are both at their beginning.

| Beat | Time | What the picture does | Caption |
|---|---|---|---|
| 0 | 0–5 | The bowl and the ball at `w = −0.5`, loss `9.0000`. The dashed slope arrow grows over 0.4–2.4 s to its full six units. No rate is shown yet. | The ball feels one slope: the dashed arrow. The rate decides how much of it to take. |
| 1 | 5–10 | The rate appears, the solid arrow with it, and the start-height line. Eight steps run over 3.2 s; the ball creeps to `−0.2682`. | A rate of 0.005 takes a hair of that arrow. Eight steps later the ball has barely moved. |
| 2 | 10–15 | Rate 0.12, reset, eight steps; the ball slides to `2.1661`, loss `0.1115`. Monotone: it never crosses the valley. | A rate of 0.12 takes more, and the same eight steps put the ball at the bottom. |
| 3 | 15–20 | Rate 1.1, reset, held still. The solid arrow now reaches past the dashed one and past the minimum; a dotted guide rises from its tip to the landing site at `6.1`. The prediction is asked. | A rate of 1.1 asks for more than the whole arrow. Its tip is past the bottom. Late, or never? |
| 4 | 20–23.2, held to 25 | The guide goes; the run plays. Four landings climb alternate walls, then the ball leaves the frame and is pinned there with a chevron while the readout climbs to `166.3958`. | Every landing sits higher than the last, and the ball climbs out of the picture. |
| 5 | 25–30 | Rate `α★ = 1`. The ring on the far wall and the wall's name appear on the picture, its shaded stretch on the control. The ball bounces between `−0.5` and `5.5`, always at loss `9.0000`. | At a rate of 1 the step lands exactly opposite. The bounce neither grows nor shrinks. |
| 6 | 30–35 | Rate `0.9 α★`. The ball still crosses every step, but the landings descend to `1.9967`, loss `0.2533`. | A tenth under that wall the ball still crosses, but each landing is lower. |
| 7 | 35–40 | The rate glides from 0.9 to the chapter's 0.12 over 1.5 s, the eight landings recomputing continuously — through `α = 0.5`, where all eight collapse onto the minimum — then holds. The rule-of-thumb mark `0.1` appears on the control. | Anywhere below the wall it arrives. The chapter starts near 0.1, a tenth of the wall. |

Beat 7 is the one glide inside a beat rather than into one: there the rate itself is
the moving object, its caption is true at every value it passes through, and it
finishes 3.5 s before the end so the frame an arrow-key seek rests on is the finished
picture.

## Reduced motion

One still per beat, held exactly: every continuous quantity is evaluated at a per-beat
rest time rather than at the clock, so the render at a beat and anywhere inside it is
the same picture. The rests are `4, 9, 14, 19, 24, 27.8, 34, 38.5`. Each is the state
its caption describes — for a running beat, the state it ends in. Beat 5's rest is
deliberately an **odd** step, `27.8 s`, so the still rests on the far wall inside the
ring rather than back at the start, where a perpetual bounce would look like nothing
having happened. `registerBeatHoldTest` walks the whole reduced timeline at 0.05 s and
requires exactly one drawn state in every beat interval.

## Withheld prediction

From `t = 15` until the run at `t = 20` the answer is absent from the drawing, from
the SVG `aria-label`, from the rate control's `aria-valuetext` and from the
scrubber's: only the start landing is drawn, the ring and the wall's name are
undrawn, the control's shaded stretch is undrawn, the escape chevron is undrawn, and
no accessible string matches
`diverg|explod|grow|climb|higher|worse|increas|escap|blow`. What beat 3 *does* show
is the evidence to reason from — an arrow whose tip is past the minimum — which is
exactly the misconception's own territory: one overshoot is what a student expects to
be survivable. A reader who drags the control during that window sees the outcome
live; that is the reader's own act, as it is in Chapter 5's derivative gates.

## Palette

| Mark | Colour | Why |
|---|---|---|
| The bowl, the start-height line, both arrows, the loss readout, the escape chevron, the control's unstable stretch | `#722f37` wine | The vertical axis is the loss; the arrows are its slope; the shaded stretch is where the loss grows. |
| The ball, every landing dot, the `w` axis name | `#c05621` orange | `w` is the learnable parameter, and the horizontal axis is parameter space. |
| The rate's readout, the wall's name, the ring on the far wall, the control's marks | `#232d4b` emphasis ink | A learning rate is a hyperparameter, not a learnable one, so orange would be a lie. |
| Frame, ticks, tick labels, the beat-3 landing guide | grey | Scenery. |

Blue, green and purple do not appear: there is no `x`, no prediction and no `y` in
this picture. The figure's own per-rate colours (`#5379AA`, `#E57200`, `#722F37`) are
**not** reused — they would put input blue on a learning rate — and the rates are
distinguished by running one at a time with the value printed beside its arrow. Every
number on the picture carries a white halo (`paint-order: stroke`), restricted to
`<text>`.

The one formula line holds two identities in one grid cell, one shown at a time and
swapped by a class on the root, never by rewriting TeX: `span#eq-step-length-1` is
the update rule
`\( \parameterpart{w^{(t+1)}} = \parameterpart{w^{(t)}} - \class{sl-alpha}{\alpha}\,\class{sl-slope}{\residualpart{\loss'}\bigl(\parameterpart{w^{(t)}}\bigr)} \)`,
and from beat 5 `span#eq-step-length-2` is the same rule rearranged around the
minimum,
`\( \parameterpart{w^{(t+1)}} - w^{\star} = \class{sl-factor}{(1-\alpha c)}\bigl(\parameterpart{w^{(t)}} - w^{\star}\bigr) \)`,
where the factor that decides everything is a single washed sub-expression. Live
numbers are plain `<text>` on the picture, never inside the formula. The panel links
to `#eq-full-gd`, which the rendered chapter defines.

## Teaching boundary

The one visible sentence: *a quadratic bowl is the special case that makes a single
divergence threshold exist; a real loss surface has no such number, and nothing drawn
here is trained.* Inside the closed **Scope and caveats** disclosure:

- This is **full-batch** gradient descent on one parameter, **not the stochastic
  version this chapter is about**: no minibatch, no noise, no epoch, and no model is
  fitted. The three rates, the start and the rule of thumb are the chapter's; the
  bowl is this panel's.
- The bowl is **declared, not measured**: `(w − 2.5)²`, curvature 2 — the curvature a
  standardized feature gives a squared-error loss, which is why the chapter's advice
  is about *normalized* toy problems. Its threshold `2 ÷ 2 = 1` is computed from the
  declared curvature; a differently curved bowl has a different one, and **landing on
  1 is that curvature's coincidence, not a law**.
- **Eight steps per rate is this panel's budget**; the chapter's own helper runs
  sixty. The drawn window is `w ∈ [−4, 9]`; at `α = 1.1` the ball leaves it after
  five steps and the picture then **pins the ball to the frame while the readout
  keeps the true loss**. Landings outside the window are not drawn.
- The chapter's figure plots **loss against step index on a log axis**; this panel
  deliberately shows the geometry instead, so nothing here is that figure's curve and
  no step index is an axis. The figure's per-rate colours are not reused.
- **Decay schedules and warmup are named in the chapter's own rule-of-thumb callout
  and are out of scope here**: `α` is constant inside every run.
- The threshold governs this **full-batch quadratic** only; with minibatch noise a
  rate well below it can still fail to settle, which is the region of confusion
  §"The two zones of SGD" draws.

## Not imported from the film

The film's `LearningRate` (3:02–3:48) supplied composition and reveal order only: the
mandated three-second predict hold before any motion, the rates run on one shared
1-D bowl, the crawl/converge/diverge labels arriving only once each behaviour is
undeniable, and the guidance beat last. Deliberately omitted:

- **The three panes.** The film runs `α = 0.005`, `0.12` and `1.1` side by side in
  three panels. The visual grammar allows one picture and one tracked object, so the
  rates run one at a time on one bowl instead, and the comparison is carried by the
  start-height line, the landing dots and the reader's memory of the previous beat.
- **`LR_DIVERGE_FACTOR = |1 − 4 · 1.1| = 3.4`.** The film's bowl has curvature 4, so
  its divergent iterate grows 3.4× a step and is off-screen almost immediately; the
  film then clamps the trail and tells the truth in a loss readout. This panel
  declares curvature 2 instead, for the reason above and because a factor of `−1.2`
  is the *better* refutation of the misconception: the ball overshoots only a little,
  exactly as a student expects, and the little compounds. The film's number is not
  used anywhere here.
- **The film's stamps and chrome.** `DIVERGED · |x| ×3.4 PER STEP`, `TRAIL CLAMPED
  FOR DISPLAY`, `SAME 1-D BOWL, THREE RATES`, the `CRAWL`/`CONVERGE`/`OVERSHOOT`
  labels, the per-pane live `L` chips and the `EQ.step` anchor card. The clamp
  *device* is reused — an honest one — but named in the scope rather than stamped on
  the picture.
- **The film's guidance and decay beats as content.** The film's `+36` and `+41`
  beats speak the rule of thumb and then promise decay and warmup. The rule of thumb
  is the chapter's own sentence and appears in this panel's prose and final caption;
  decay and warmup are named in the scope as out of scope.
- **Any number the film computes.** No film fixture, path, readout or ratio appears
  here. Every quantity in this scene is computed in the browser from the panel's
  declared attributes.

## Acceptance

`scripts/test_step_length_excerpt.cjs` reruns the update rule independently, checks
it against the closed form and against a central difference of the declared loss, and
checks: the chapter literals verbatim and the anchor; the declared fixture; that
`|1 − αc| < 1` exactly on `(0, 2/c)` and that the chapter's three rates fall into the
three behaviours, with the crawl's 568-versus-21 step cost; that the drawn step arrow
is exactly `α` times the drawn slope arrow, both horizontal, and that at the
threshold its tip is the ring; that every drawn vertex of the bowl, every landing dot
and the ball itself satisfy the declared loss; that the divergent walk keeps five
landings and then marks its escape while the readout keeps the true loss; each beat's
reveal state under reduced motion, including beat 5's odd-step rest; the withheld
prediction across `[15, 20)` in the drawing and in every accessible string; that the
rate is a real control that pauses playback, recomputes the whole eight-step outcome,
never becomes the clock, and is ended by any timeline action; house-style numbers and
no text box leaving or colliding inside the picture at seven widths and eighteen
times; the single reflow with the declared window at both prints; deterministic
seeking of the whole published state including the root's class list, forwards,
backwards and after a drag; static parity with a fresh render, including namespaced
ids and four-decimal geometry in the narrow print; the boundary, scope and transfer
arithmetic; and the transcript's witnesses. With the three harness registrations
(`registerTransportTests`, `registerBeatHoldTest`, `registerGrammarTests`) the suite
is **43/43 passing**.

Rendered frames were inspected at 1280 px and 375 px at `t = 4, 7, 12, 17, 22, 27,
32, 36, 39.9`, in reduced motion at every beat, and with scripts off: figure width
713 / 302, page overflow 0, no SVG text outside the picture, no console errors.

`scripts/test_excerpt_checks.cjs` is the orchestrator's; this scene's transfer answer
is not recomputed there until it adds the entry.

## Source digests

Lecture paths are relative to
`/Users/hs9hd/Library/CloudStorage/Box-Box/Teaching/6050/Video_lectures/`.

| Source | SHA-256 |
|---|---|
| `chapters/part1/04-training-loss-sgd.qmd` | `400affc9c731f95b5d7be32f3e449f5fe8080bd010ffa6b7eab9145b0c0dd354` |
| `6050-Ch4/STORYBOARD.md` | `c5f8b635909b585d6c62f310ef2e16801c58421127d9ef6d536d7fbd331db9ce` |
| `6050-Ch4/lecture.jsx` | `d66583fdb68c4fa9e84ad1942c140e6f0118c3eb675d14dc40f3579d56567d48` |
