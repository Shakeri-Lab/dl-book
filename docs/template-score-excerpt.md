# Template score: source and acceptance receipt

**Built, not yet author-approved.** The scene is registered in
`interactives/manifest.json` as `template-score-excerpt` and inserted immediately
before the level-2 heading *The loss: what makes a hyperplane "bad"?* in
`chapters/part1/01-linear-regression.qmd`, so it closes the section
*The linear model and its geometry* rather than interrupting it. The shared
manuscript, `fig-linear-response` and all frozen evidence are unchanged; no QMD
is edited. Approval is the author's browser-review note, not this file.

## One mechanism and one question

**A large score: does it mean the input matches the template, or only that one of
them is long?**

The misconception the chapter's prose names and the static figure cannot show is
that a big dot product means alignment. The chapter says so in one sentence —
"a large dot product can mean strong alignment, large magnitude, or both" — and
then names the consequence: `w` is "a template whose direction and scale both
matter". A reader who has only `fig-linear-response` sees three arrows at three
angles and learns the *sign* story. Nothing in that picture separates the two
causes of the magnitude, and nothing in it shows that the bias is what the
prediction falls back to.

## What moves, and what two frames could not do

One picture. The template `w` is an orange arrow from the origin, the input `x` a
blue arrow from the same origin, and the **signed shadow** of `x` on `w`'s line is
a broad green bar lying on that line. Beside it (below it, on a phone) a
prediction meter reads `ŷ` against the dashed orange baseline `b`. The shadow and
the meter's bar are one number seen twice, so they are the same green and the same
weight.

- **Act one — direction.** `x` rotates about the origin at a fixed length of 2.00.
  The shadow slides along `w`'s line, shortens, and at the right angle collapses to
  a point; past it, it reappears on the far side and the prediction falls below
  `b`. The reader is stopped at 80° and asked what score to expect; the input is
  *frozen* there, so no glide has started toward the answer.
- **Act two — magnitude.** The angle freezes at 120° and the template's own length
  pulses 1.50 → 0.75 → 1.50. `cos θ` does not move at all — it reads `−0.50` for
  the whole beat — while the score halves and doubles. The formula's wash moves
  from the `cos θ` factor to the `‖w‖₂‖x‖₂` factor as it does.

**First/last-frame test: passes.** The first frame is two arrows 20° apart with no
score; the last is two arrows 120° apart with a score of `−1.50`. Side by side,
a student would read "different angle, different score" — which is exactly the
half-truth the scene exists to break. The whole point is that *one* number has
*two* independent causes, and that can only be seen by holding one cause still
while the other moves: the crossing of the right angle where the score is exactly
zero, and the length pulse where `cos θ` visibly does not budge. Neither is a
state a still frame can hold. The final frame is nevertheless made to carry the
comparison for a reader without scripts: three recorded readings stay on the
meter — `right angle`, `length 0.75`, `length 1.50` — so the static print still
shows one direction producing two predictions.

The exactness is the payoff and is exact, not approximate. `Math.cos(Math.PI/2)`
is `6.1 × 10⁻¹⁷`, so the player returns the quadrantal and third-turn cosines from
an exact table: at 90° the direction similarity is `0`, the score is `0`, the
prediction is `1.00 = b`, the shadow's two endpoints are the same point and the
meter's bar has zero length. The suite asserts each of those with `===`.

## Fixture

The chapter owns the identity and the sign behaviour. It prints **no coordinates**
for `fig-linear-response`, so every number in this scene is a **declared computed
variant**: schematic drawing geometry chosen to be legible and round, declared once
as data attributes on the panel root and recomputed from there.

Manuscript literals mirrored (verbatim, `chapters/part1/01-linear-regression.qmd`):

| Literal | Lines |
|---|---|
| `= \parameterpart{\vect{w}^\top}\featurepart{\vect{x}} + \parameterpart{b} .` | 119 |
| `The second term, $\parameterpart{b}$, is the model's default prediction when the input` / `carries no relevant information.` | 122–123 |
| `Aligned inputs raise the prediction above $\parameterpart{b}$, orthogonal inputs leave it at $\parameterpart{b}$, and opposing inputs lower it.` | 127 |
| `**a dot product is a similarity score.**` | 129 |
| `= \norm{\parameterpart{\vect{w}}}_2\norm{\featurepart{\vect{x}}}_2\cos\theta .` | 134 |
| `a large dot product can mean strong alignment, large magnitude,` / `or both.` | 140–141 |
| `A linear model is therefore a learned *pattern scorer*:` / `$\parameterpart{\vect{w}}$ is a template whose direction and scale both matter.` | 141–142 |

Declared computed variants, with their arithmetic:

| Attribute | Value | What it is |
|---|---|---|
| `data-template-norm` | `1.5` | the template's length, `‖w‖₂` |
| `data-template-degrees` | `30` | the direction the template is drawn in, fixed all through |
| `data-input-norm` | `2` | the input's length, `‖x‖₂`, fixed all through |
| `data-bias` | `1` | the baseline `b` |
| `data-angles` | `20 80 90 120` | opening, predict hold, right angle, opposing |
| `data-pulse-norm` | `0.75` | the template's length at the bottom of act two |
| `data-norm-range` | `0.25 1.75` | the slider's range, and hence the meter's half-range |

Every readout is `score = ‖w‖ × ‖x‖ × cos θ` and `ŷ = b + score`:

- opening, `θ = 20°`: `1.50 × 2.00 × 0.9396926208 = 2.8190778624` → `+2.82`, `ŷ = +3.82`
- predict hold, `θ = 80°`: `1.50 × 2.00 × 0.1736481777 = 0.5209445330` → `+0.52`, `ŷ = +1.52`
- right angle, `θ = 90°`: `cos θ = 0` exactly → score `0.00`, `ŷ = +1.00 = b` exactly
- opposing, `θ = 120°`: `cos θ = −0.5` exactly → `1.50 × 2.00 × (−0.5) = −1.50`, `ŷ = −0.50`
- pulse bottom, `θ = 120°`, `‖w‖ = 0.75`: `0.75 × 2.00 × (−0.5) = −0.75`, `ŷ = +0.25`

The two act-two readings are exactly a factor of two apart, `0.75 / 1.50 = 0.5`,
with `cos θ` identical, which is the comparison the scene is for. The choice of
`‖x‖ = 2.00` with `cos 120° = −0.5` makes the score exactly the template's own
length (up to sign) for the whole of act two, so the halving is readable without
arithmetic. The meter's half-range is `‖x‖ × 1.75 = 3.5`, the largest score the
slider can reach, so a reader who drags the template to either end never pushes
the marker off its scale.

## Beat timetable

Duration 40 s; beats `0 5 10 15 20 25 30 35`, the manifest's and the pane's.

| Beat | Time | What moves | Readings |
|---|---|---|---|
| 0 | 0–5 | nothing; `w` and `x` stand 20° apart | score and meter withheld (`·`) |
| 1 | 5–10 | the shadow and the meter appear | `+2.82`, `ŷ +3.82`, `b 1.00` |
| 2 | 10–15 | `x` turns 20° → 80°, landing at 15 s | `+0.52` at the beat |
| 3 | 15–20 | frozen at 80°; the caption asks | answer withheld |
| 4 | 20–25 | `x` turns 80° → 90°, landing at 25 s | the shadow reaches the origin |
| 5 | 25–30 | frozen at exactly 90° | `0.00`, `ŷ +1.00 = b`, right-angle marker |
| 6 | 30–35 | `x` turns 90° → 120°, landing at 35 s | `−1.50`, `ŷ −0.50` |
| 7 | 35–40 | `‖w‖` 1.50 → 0.75 (to 36.5 s) → hold → 1.50 (at 40 s) | `cos −0.50` fixed; score `−1.50` ↔ `−0.75` |

Each glide finishes at the beat it leads into, so an arrow-key seek parks on the
finished picture its caption describes. The predict beat is a true freeze: the
suite walks `[15, 20)` at 0.05 s and requires `θ = 80` exactly, no right-angle
marker, no recorded reading, and no `zero` / `exactly b` / `0.00` anywhere in the
drawing, the picture's `aria-label` or the scrubber's value text.

## Reduced motion

One still per beat, with the object jumped to its beat position: beats rest at
`0, 5, 15, 15, 25, 25, 35, 36.5`. A glide beat rests on its *finished* state, so
each still is the picture its caption is about; the length beat rests at the short
template, where both of its recorded readings are already drawn. The strict
`registerBeatHoldTest` (0.05 s across the whole reduced timeline) passes.

## The one parameter control

The template's length is the scene's single `<input type="range">`, permitted
because the mechanism *is* that parameter's effect (rule 1's amendment). It is
orange, because the length belongs to the learnable `w`; its range is the declared
`0.25 … 1.75` in steps of `0.05`, with the two declared lengths on ticks; it is
hidden until the player mounts; the timeline sweeps it through act two so a passive
viewer sees the whole sweep; dragging it pauses playback and recomputes the entire
picture; and any timeline action — play, scrub, an arrow-key beat — restores the
timeline's own value, so a drag is a detour rather than a new default. Its own keys
never reach the pane's beat seeking, and it sits outside `[data-controls]`, so it
can never become the clock.

It earns its place at the right angle: dragging the template from 0.25 to 1.75
there moves the orange arrow and nothing else — the score stays exactly `0` and
the prediction exactly `b`. That is the identity, discovered rather than asserted,
and it is the one thing a reader can check for themselves.

## Palette

Blue input `x`, orange the learnable parameters `w` and `b` (in this chapter they
genuinely are learnable), green the prediction and the signed displacement from `b`
that produces it, drawn twice — as the shadow on the template's line and as the
meter's bar — because it is one number. The recorded readings are the book's
emphasis ink, hollow-dashed, so they read as records rather than as a sixth
meaning. Scenery is grey. Every label has a white halo under its strokes, so a
number crossing an arrow stays legible; shapes, signs and geometry carry the
meaning without colour. Plain-text numbers use U+2212, and a score of exactly zero
prints `0.00` with no sign, since it is the payoff reading and not a small
positive or negative one.

## Teaching boundary

Visible sentence: *Nothing here is trained: one fixed template is scored against
one input, with the direction and the length varied one at a time.* In the closed
"Scope and caveats": the geometry is declared schematic and not chapter numbers;
**orthogonal means this feature adds nothing to *this* prediction, not that the
feature is useless** — a template pointing elsewhere would score the same input;
**a dot product is not cosine similarity** unless both lengths are divided out
first; the green appears twice because it is one number seen twice; and the slider
is a detour from the timeline.

## Transfer check

> **Check yourself.** Swap in an input of length 4.00 at 60 degrees from this same
> template, keeping the length of *w* at 1.50 and *b* at 1.00. What does the model
> predict?
>
> Exactly 4.00. The score is 1.50 × 4.00 × cos 60°, and cos 60° is 0.50, so the
> score is 3.00 and the prediction is 1.00 + 3.00. That beats the 3.82 this scene
> opened with, even though 60° is a far worse match than 20°.

It is not answerable from the final frame (which shows `‖x‖ = 2.00` at 120°) nor by
dragging the control (which moves `‖w‖` only): it varies the one factor the scene
holds fixed throughout. Arithmetic: `1.5 × 4 × 0.5 = 3` exactly; `1 + 3 = 4`
exactly; the opening reading is `1 + 1.5 × 2 × cos 20° = 3.8190778623577253`, and
`4.00 > 3.82`.

## What was deliberately not imported from the film

The choreography — the rotating input against a fixed template, the signed shadow,
the prediction meter against a dashed `b`, the predict hold before the right angle,
the gating of the "orthogonal" beat on the evidence rather than the clock, and the
`‖w‖` pulse with the angle frozen — comes from `SSimilarity` in
`6050-Ch1-enhanced/lecture.jsx` and row 3 of its storyboard's timed scene map. Not
imported: the film's framework and `KenBurns`/`FlowShot` motion; its Readout chip
column and card chrome; its own `SIM` numbers (`wMag 1.35`, `b0 0.8`, `wAngDeg 32`,
the `thetaT`/`thetaV` schedule and the `1.35 → 0.70 → 1.35` pulse), which are
replaced by the declared schematic above so the exact right-angle and half-length
identities are legible; its sign-coloured shadow (green above `b`, red below),
since wine is reserved for loss and the sign is carried by geometry and by a true
minus sign; its attention-pulse glow and baton chips; and all off-page narration.
No Chapter 1 experiment, dataset, fitted line or loss appears.

## Acceptance

`scripts/test_template_score_excerpt.cjs` — **45/45** pass: the 21 inherited
transport checks, the strict beat-hold check, the six grammar checks, and the
scene's own checks for the identity at 801 sampled times, the drawn shadow /
arrows / drop perpendicularity / meter bar at seven widths, the exact right angle
(including under a dragged length), the angle schedule and each glide's landing,
the withheld prediction across the whole predict beat, act two's frozen direction,
the reveal order of every mark and formula wash, the reduced-motion stills, the
slider's timeline-driven/detour/keyboard-isolated behaviour, label boxes inside
the picture and clear of each other at seven widths and 81 times, seek/resize
determinism, the narrow reflow, wide and narrow static parity, ten rejected
fixtures, the published state keys, and the boundary and transfer-check wording.

`scripts/test_excerpt_checks.cjs` will fail for this scene until the orchestrator
adds its transfer-check arithmetic; that file is the orchestrator's.

Frames were inspected at 1280 px and 375 px, in normal and reduced motion and with
scripts off, at `t = 2, 7, 13.5, 17, 22, 27, 32, 37, 39.9`. The preview reports no
page overflow, no SVG text outside the picture and no console errors at either
width.

## Source digests

Lecture paths are relative to
`/Users/hs9hd/Library/CloudStorage/Box-Box/Teaching/6050/Video_lectures/`.

| Source | SHA-256 |
|---|---|
| `chapters/part1/01-linear-regression.qmd` | `c9e53515d298f172ee8000d7b4790054cc9d9aa923eeb97cc285553092a583c9` |
| `6050-Ch1-enhanced/STORYBOARD.md` | `061e5954970c22dcb4dae6a353271e3e33237d31c90b6525577c1d01bcf0e28e` |
| `6050-Ch1-enhanced/lecture.jsx` | `0bb929f8b92b19fc6da96f8158edbe4734f82c4b569ecbdbb723551b93a62584` |
