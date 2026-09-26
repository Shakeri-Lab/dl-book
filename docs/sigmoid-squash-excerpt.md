# Sigmoid squash: source and acceptance receipt

**Built, not yet author-approved.** The scene is registered in
`interactives/manifest.json` as `sigmoid-squash-excerpt` and inserted immediately
after `cell-fig-sigmoid` in `chapters/part1/02-logistic-softmax.qmd`, so it closes
the section *From score to probability: the sigmoid* rather than interrupting it.
The shared manuscript, `fig-sigmoid` and all frozen evidence are unchanged; no QMD
is edited. Approval is the author's browser-review note, not this file.

Its sibling in the same chapter, [softmax shift](wave1-excerpts.md), sits further down
after `cell-fig-softmax` and is about a different thing: adding one constant to *every*
score and watching the probabilities refuse to move. This scene is the opposite case —
*one* score moving, and the probability responding by wildly different amounts depending
on where it moves.

## One mechanism and one question

**One example walks across the decision boundary. What is its probability at the moment
it touches the line — and does the next equal step buy as much?**

Two misconceptions, and the chapter names both of them in one sentence: "The sigmoid
does not bend the boundary; it grades our confidence on either side of it."

- Students read the sigmoid as *the thing that makes the boundary curved*. The curved
  object on the page is the graph of `σ`; the boundary is straight and fixed, and the
  sigmoid never moves it, because `σ` is monotone and `σ(0) = ½` exactly.
- Students expect the probability to move *in proportion to* the score. It does not.
  Near the boundary the curve is steep and the probability swings; out in the tail it
  saturates and the same push buys almost nothing.

`fig-sigmoid` draws the curve, its midpoint and the `o = 0` annotation. What it cannot
draw is the *other* side of the map: where the example actually is, and what happens to
its probability while it moves. That is the whole of this scene.

## What moves, and what two frames could not do

One picture, in two halves that are the same object twice. On the left (above, on a
phone) a small declared plane carries a class-0 cluster of open purple squares, a
class-1 cluster of filled purple discs, and one straight orange decision boundary. One
blue example travels along the boundary's own normal, from deep on the class-0 side,
across the line, and out into the class-1 side; a thick blue segment from its foot on
the boundary measures the signed distance the score is made of. On the right (below) the
chapter's sigmoid is drawn over the chapter's own range: the same example appears as a
blue tick on the score axis, a blue guide carries it up to the curve, and a green guide
carries the reading across to the probability axis. **Score, place and probability are
bound at every instant** — the drawn place is derived from the score, and the suite
recovers `w·x + b` back out of the drawn place and requires it to equal the number on
the axis to 1e-12, and the probability to be exactly `σ` of it.

- **The crossing.** The example is frozen one step short of the line and the caption
  asks the reader to predict. It is then released, and comes to rest exactly on the
  boundary — at which moment three dashed guides light up together: the boundary in the
  plane (its annotation completes to `o = 0`), the vertical `o = 0` on the score axis,
  and the horizontal `p̂ = ½` on the probability axis. One statement, seen three times.
- **The saturation.** Four *equal* pushes follow, each adding exactly 1 to the score and
  moving the example exactly `1 / ‖w‖₂ = 0.4` plane units further along the same line —
  the equal spacing is drawn as four equal ticks on the path. Each push leaves a rung on
  the probability axis and a bracket measuring what it bought: `+0.2311`, `+0.1497`,
  `+0.0718`, `+0.0294`. The pushes are identical; the brackets collapse.

**First/last-frame test: passes, and here is the honest accounting.** The last frame is
deliberately made to carry the four brackets, because a reader without scripts must get
the payoff — so a determined reader *can* compare `+0.2311` with `+0.0294` in the static
print. Two things are nevertheless unavailable to any pair of frames. The first is the
crossing itself: neither the opening frame (`o = −4`) nor the closing one (`o = +4`)
puts the example on the line, so `p̂ = ½` never appears in either, and the simultaneity
of the three guides — the thing that kills "the sigmoid bends the boundary" — is a
single instant, not a state. The second is that **the misconception under test is about
a rate**, and a rate is exactly what two stills cannot hold: "probability moves in
proportion to score" is refuted by watching the probability sprint through the middle of
its range while the example crawls, then stall while the example keeps moving at the
same pace. The brackets are the receipt of that; the motion is the evidence.

The exactness is the payoff and it is exact, not approximate. `Math.exp(-0)` is exactly
`1`, so `σ(0)` is exactly `0.5`; the declared crossing point satisfies
`1.5·0 + 2·0.25 − 0.5 = 0` in IEEE doubles, and the player refuses to mount if it does
not. The suite asserts the score `=== 0`, the probability `=== 0.5`, the drawn place
`===` the declared crossing point and the recovered `w·x + b === 0`, with `===`.

## Fixture

The chapter owns the sigmoid, its midpoint, the boundary identity and the score range.
It prints **no input-space coordinates at all** — no weight vector, no bias, no data —
so the plane and everything on it is a **declared computed variant**: schematic drawing
geometry chosen to be legible and round, declared once as data attributes on the panel
root and recomputed from there.

Manuscript literals mirrored (verbatim, `chapters/part1/02-logistic-softmax.qmd`):

| Literal | Line |
|---|---|
| `\sigma(o) = \frac{1}{1 + e^{-o}}` | 40 |
| `o = torch.linspace(-6, 6, 300)` | 56 |
| `the decision boundary $\hat{p} = \tfrac{1}{2}$ is exactly` | 75 |

Three more sentences the scene is built to make visible, bound by the suite rather than
by the manifest: "an unbounded score" (36), the figure caption's "its confident regions
saturate at the tails" (65), the figure's own `"decision boundary\n$o = 0$"` annotation
(69), and "The sigmoid does not bend the boundary; it grades our confidence on either
side of it." (78–79).

Declared computed variants, with their arithmetic:

| Attribute | Value | What it is |
|---|---|---|
| `data-weights` | `1.5 2` | the weight vector `w`; `‖w‖₂ = 2.5` and `‖w‖₂² = 6.25`, both exact |
| `data-bias` | `-0.5` | the bias `b` |
| `data-cross` | `0 0.25` | where the example crosses; `1.5·0 + 2·0.25 − 0.5 = 0` exactly |
| `data-domain` | `-3 3 -2.4 2.4` | the plane, drawn at one unit per axis |
| `data-score-range` | `-6 6` | **the chapter's**, from its own `linspace` |
| `data-samples` | `300` | **the chapter's**, the same 300 samples |
| `data-journey` | `-4 -1 0` | opening score, predict hold, the crossing |
| `data-step` / `data-pushes` | `1` / `4` | four equal pushes of one unit of score |
| `data-class0` | five points | every one scores below zero |
| `data-class1` | five points | every one scores above zero |
| `data-class-labels` | `-2.55 -1.95 2.55 2.05` | where `y = 0` and `y = 1` are written |

The example's place is **derived from its score**, never the other way round:

```
x(o) = c + (o / ‖w‖₂²) · w = (0.24 o,  0.25 + 0.32 o)
w·x(o) + b = (w·c + b) + o (w·w)/‖w‖₂² = 0 + o = o
```

and that identity holds bit-exactly in doubles at every integer score in `[−6, 6]`, which
the suite checks by reading the coordinates back out of the drawing.

Readings, all `p̂ = σ(o)`:

| beat | `o` | place | `p̂` | gain over the previous push |
|---|---|---|---|---|
| opening | `−4.00` | `(−0.96, −1.03)` | `0.0180` | — |
| predict hold | `−1.00` | `(−0.24, −0.07)` | `0.2689` | — |
| crossing | `0.00` | `(0, 0.25)` | `0.5000` (exact) | — |
| push 1 | `+1.00` | `(0.24, 0.57)` | `0.7311` | `+0.2311` |
| push 2 | `+2.00` | `(0.48, 0.89)` | `0.8808` | `+0.1497` |
| push 3 | `+3.00` | `(0.72, 1.21)` | `0.9526` | `+0.0718` |
| push 4 | `+4.00` | `(0.96, 1.53)` | `0.9820` | `+0.0294` |

Every push is the same push: `1 / 2.5 = 0.4` plane units, four times, which the suite
checks as four equal strides between the four drawn place vectors. The first gain is
`0.2310585786 / 0.0294396632 = 7.849` times the last — "about an eighth", as the closing
caption says. The declared cluster scores are `−3.000, −4.375, −2.375, −3.750, −5.750`
for class 0 and `+2.375, +3.875, +2.500, +4.375, +3.375` for class 1; every point stands
at least 1.05 plane units off the example's path, so the travelling label never lands on
one. The two cluster names are text anchors rather than examples, and score `−8.225` and
`+7.425`. A fixture that puts any point — or either name — on the wrong side of its own
boundary, or a crossing point that does not score exactly zero, is refused at mount
rather than drawn.

## Beat timetable

Duration 40 s; beats `0 5 10 15 20 25 30 35`, the manifest's and the pane's.

| Beat | Time | What moves | Readings |
|---|---|---|---|
| 0 | 0–5 | nothing; the example stands deep on the class-0 side | `−4.00`, `0.0180` |
| 1 | 5–10 | it travels `−4 → −1` along the normal, landing at 10 s | `−1.00`, `0.2689` at the beat |
| 2 | 10–15 | frozen at `−1`; the caption asks | identity withheld |
| 3 | 15–20 | released, `−1 → 0`, landing at 20 s | it comes to rest on the line |
| 4 | 20–25 | frozen at exactly `0` | `0.00`, `0.5000`, three guides light together |
| 5 | 25–30 | push 1, `0 → 1` | `+1.00`, `0.7311`, bracket `+0.2311` |
| 6 | 30–35 | push 2, `1 → 2` | `+2.00`, `0.8808`, bracket `+0.1497` |
| 7 | 35–40 | push 3 (to 37.5 s) then push 4 (to 40 s) | `+3.00`/`0.9526` and `+4.00`/`0.9820` |

Each glide finishes at the beat it leads into, so an arrow-key seek parks on the finished
picture its caption describes. The predict beat is a true freeze: the suite walks
`[10, 15)` at 0.05 s and requires the score to be exactly `−1`, the probability `0.2689`,
no `o = 0` guide, no `½`, no crossing ring, no rung, and none of `½` / `0.5000` / `o = 0`
/ `one half` / `exactly zero` anywhere in the drawing, the picture's accessible name, the
scrubber's value text or the caption. The identity's own typeset line is present in the
DOM but `visibility: hidden` until its beat, so it reaches neither the eye nor a screen
reader; the suite asserts that it is hidden.

## Reduced motion

One still per beat, with the object jumped to its beat position: beats rest at
`0, 10, 10, 20, 20, 30, 35, 40`. A glide beat rests on its *finished* state, so each
still is the picture its caption is about — the predict beat rests one step short of the
line with the answer still absent, the crossing beat rests exactly on it, and the last
beat rests where all four brackets are already drawn. The strict `registerBeatHoldTest`
(0.05 s across the whole reduced timeline) passes.

## The one parameter control

The example's score is the scene's single `<input type="range">`, permitted because the
mechanism *is* that score's effect on the probability (rule 1's amendment). It is blue,
because the score belongs to the example the reader is moving; **its range is the
chapter's own `−6 … 6`**, not a range this scene invented. It is hidden until the player
mounts; the timeline sweeps it so a passive viewer sees the whole journey; dragging it
pauses playback and recomputes the plane, the axis and the curve from the dragged score;
and any timeline action — play, scrub, an arrow-key beat — restores the timeline's own
value, so a drag is a detour rather than a new default. Its own keys never reach the
pane's beat seeking, and it sits outside `[data-controls]`, so it can never become the
clock. A drag never earns a rung: the ladder is the timeline's record of what happened.

It earns its place at both payoffs. Dragging to `0` from anywhere lands on exactly the
same three readings — score `0`, probability `0.5`, the example standing on the line —
and dragging back and forth by the same amount near `0` and out at `5` is the saturation,
discovered rather than asserted.

## Palette

Blue is the input `x` and everything that **is** the input seen again: its place on the
plane, the reach that measures its distance from the boundary, its tick on the score
axis, and the guide that carries that score up to the curve. Green is the probability the
sigmoid returns: the dot on the curve, the guide across to the axis, the caret on it, and
the four brackets. Orange is the learnable pair `w` and `b`, which is exactly what the
boundary and the `o = 0` / `p̂ = ½` identity are made of — and it is the colour the
chapter's own figure annotates `"decision boundary\n$o = 0$"` in. Purple is the label `y`
the clusters carry, and the *shapes* carry that distinction without colour: open squares
are `y = 0`, filled discs are `y = 1`. The sigmoid itself is a fixed operator, so it is
the book's emphasis ink `#232d4b` — the colour `fig-sigmoid` plots it in. Scenery is grey.
Every label has a white halo under its strokes. Plain-text numbers use U+2212, and a
score of exactly zero prints `0.00` with no sign, since it is the payoff reading and not a
small positive or negative one.

## Teaching boundary

Visible sentence: *Nothing here is trained: the boundary is given, not learned, and the
sigmoid is monotone, so it grades distance from that boundary without ever moving it.*

In the closed "Scope and caveats": the plane, the clusters, `w` and `b` are declared
schematic geometry and not numbers this chapter prints, while the sigmoid, its midpoint,
the identity and the range `−6 … 6` are the chapter's; **a probability here is the
model's output, not a measured frequency** — no example on this plane has been counted;
the score is the signed distance times `‖w‖₂ = 2.5`, which is why equal steps along the
path are equal steps in `o`; blue appears three times because it is one example seen
three times; purple marks the labels `y`, with shape rather than colour carrying the
class; and the score slider is a detour from the timeline.

## Transfer check

> **Check yourself.** Double every weight and the bias — take *w* to (3.0, 4.0) and *b*
> to −1.0. Where does the decision boundary move, and what happens to the probability at
> the point that scored 1?
>
> The boundary does not move at all: doubling scales every score, so the set where the
> score is zero is the same straight line. But that point's score doubles to 2, and its
> probability rises from 0.7311 to 0.8808. Scaling sharpens confidence without bending
> the boundary.

It is not answerable from the final frame, which shows one fixed `w` and `b`, nor by
dragging the control, which moves the example and not the model. It varies the one thing
the scene holds fixed throughout, and it separates the two halves of the misconception:
the boundary is a *set*, and scaling cannot move it, while the probability is a *reading*
off a fixed curve, and scaling moves it a lot. Arithmetic: `2w·x + 2b = 2(w·x + b)`, so
`{x : 2(w·x + b) = 0} = {x : w·x + b = 0}` — the same line, exactly; the point at
`x = (0.24, 0.57)` scores `1.5(0.24) + 2(0.57) − 0.5 = 1` and then
`3.0(0.24) + 4.0(0.57) − 1.0 = 2`; `σ(1) = 0.7310585786300049` and
`σ(2) = 0.8807970779778823`, which print as `0.7311` and `0.8808`.

## What was deliberately not imported from the film

The choreography — the sigmoid as the scene's hero curve, a logit sweeping along its
axis with a dot riding the curve, and a 2-D input-space inset whose `o = 0` line stays
put while the confidence changes — comes from `SSigmoid` in `6050-Ch2/lecture.jsx`
(from line 1066) and the `Sigmoid` row of its storyboard's timed scene map (34–86 s,
"PICTURE 1 · squash one score"). Not imported: the film's framework and its
`FlowShot`/`MORPH` motion; its `Readout` chip column and card chrome; its own numbers —
`BIN_W = [1.2, 0.7]`, `BIN_B = 0`, the eighteen-point-per-class `BIN_DATA` at seed 2202,
the sweep `[-5, -2, 0, OUR_SCORE, 4, -1.5, 0.7]` and the handoff receipt
`1 / (1 + exp(−0.70)) = 0.67`, all replaced by the declared schematic above so that the
crossing and the equal-push identities are exact and legible; its `linearGradient`
confidence field, which would invite reading a colour wash as a measured density; its
`LogitAxis` morph from the previous scene; and all off-page narration. The film's later
softmax, temperature and classifier phases are out of scope — the softmax shift already
ships as its own scene further down this chapter, and nothing here duplicates it.

## Acceptance

`scripts/test_sigmoid_squash_excerpt.cjs` — **44/44** pass: the 21 inherited transport
checks, the strict beat-hold check, the six grammar checks, and the scene's own checks
for the manifest/anchor/fixture contract, the score–place–probability binding at 801
sampled times (including `o = ‖w‖₂ × signed distance`), the drawn plane / reach / score
tick / curve dot / guides at seven widths, the boundary clipped to the frame with every
endpoint scoring zero, the exact crossing (including after a drag to zero), the withheld
prediction across the whole predict beat, the four equal pushes and their shrinking
brackets, the reveal order of every mark and formula wash, the reduced-motion stills, the
slider's timeline-driven / detour / keyboard-isolated behaviour, label boxes inside the
picture and clear of each other at seven widths and 81 times, seek/resize determinism,
the narrow reflow with one unit per plane axis, wide and narrow static parity, thirteen
rejected fixtures, the published state keys, and the boundary and transfer-check wording.

Two registrations belong to the orchestrator and are not made here:
`scripts/html-tests/package.json` must add `../test_sigmoid_squash_excerpt.cjs` to its
`test` script, and `scripts/test_excerpt_checks.cjs` must add this scene's transfer-check
arithmetic — until it does, that suite fails for this scene, which is expected.

Frames were inspected at 1280 px and 375 px, in normal and reduced motion and with
scripts off, at `t = 2, 7, 12, 17, 22, 27, 32, 37, 39.9` and at `t = 40`. The preview
reports no page overflow, no SVG text outside the picture and no console errors at either
width.

## Source digests

Lecture paths are relative to
`/Users/hs9hd/Library/CloudStorage/Box-Box/Teaching/6050/Video_lectures/`.

| Source | SHA-256 |
|---|---|
| `chapters/part1/02-logistic-softmax.qmd` | `52b67ee4cccc87933257188f4f23f0badbb4a5bd22a21d3e86c40b80390b654e` |
| `6050-Ch2/STORYBOARD.md` | `16022632a6a90c8cb8f202ed8d51bd60490e040914fd732ef1e7090af9333e77` |
| `6050-Ch2/lecture.jsx` | `025b275df2150cd71963358e332ff14d73d2a610d481b9606f6cc66ce5824eeb` |

## Accent typography — September 21, 2026

The belief was spelled `p̂` (or `c̃`) as `p` plus the combining accent U+0302 (U+0303). The
body sans face carries no mark positioning for either, so the hat landed beside the letter
rather than over it: measured on the published page at 40 px, that face advances 18.24 for
`c` and 20.41 for `c̃` — a spacing tilde — while the serif face advances 18.16 for both.
Prose now says the symbol in TeX, exactly as the chapter does, and MathJax composes it. SVG
text cannot be typeset, so on the picture the accented symbol alone wears the new shared
class `.mechanism-accent`, which hands that one glyph to `Georgia, "Times New Roman", serif`
and leaves the word beside it in the body face. Nothing else moved: the static prints were
regenerated from the same geometry, and no fixture, timetable or caption changed.
