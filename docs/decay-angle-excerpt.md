# Decay angle: source and acceptance receipt

**Built, not published.** A Chapter 1 scene for the angular-responsiveness footnote in
§"Regularization, briefly". The insertion is manifest-driven
(`filters/mechanism-excerpts.lua`, shared transport, 40 s, beats `0 5 10 15 20 25 30 35`).
The static manuscript is authoritative and unchanged; no QMD, figure or frozen evidence
is touched. **Open registration question:** the manifest's declared anchor,
`before-heading` → "Trap: the U-shaped curve is a cartoon, not a law of nature", resolves
to line 945 — a level-2 heading *inside* the `::: {.callout-warning}` block at lines
944–955, and *before* §"Regularization, briefly" at line 957. Inserted there the panel
lands inside the callout and ahead of the footnote it explains. See "Anchor" below.

## One mechanism and one question

One identical sideways nudge is applied to a short weight vector and to a long one.
Which turns further?

**The misconception.** A weight vector that grows just makes the model bigger; the update
still does its job. What actually degrades is *steering*. The same perpendicular nudge
turns a long vector through a smaller angle, so a layer whose weights have inflated
becomes progressively harder to redirect — while the gradient has not changed at all.
The chapter's honest corollary is carried verbatim in substance: this is not, by itself,
an explanation or a cure for stalled training.

**What moves.** One wine nudge arrow, of unchanging drawn length, is the object the eye
tracks for the whole forty seconds. It grows at the short tip and lifts that vector
through a wide angle; it detaches and rides along the shared direction to the long tip,
keeping its length exactly; it is applied again and the long vector barely turns; and
after weight decay slides the long tip back along its own ray, the same arrow turns it
much further. Both lifted tips always sit on one dashed line: the same sideways move, a
different angle.

**The first/last-frame test.** Passed, and the load-bearing part is the second half.
First frame: two orange vectors on one grey ray. Last frame: a shrunken long vector at
16.70°. Side by side, a student loses three things the motion carries. (1) That it is
*one* nudge — the picture never draws two arrows to compare, it carries one and the
suite proves its drawn length is constant at every sampled time and both layouts; a pair
of frames can only assert sameness in a caption. (2) That the shrink is *radial* — the
tip slides along its own ray without rotating, which a before/after pair would leave
readers free to misread as a rotation, exactly the confusion the chapter's "radial" is
guarding against. (3) That the long vector does **not** turn during the prediction hold:
the withheld answer is a five-second stretch of stillness, which has no still-frame
equivalent. The weaker half is the opening comparison, which a well-drawn single frame
could partly carry; the nudge's travel is what earns it.

## Anchor

The registered target is the callout heading at line 945, which precedes the section the
scene explains. The footnote the panel mirrors is at lines 977–984, inside
§"Regularization, briefly" (line 957), whose next level-2 heading is "Okay, so — what did
we just build?" at line 1043. A `before-heading` anchor on that heading would place the
panel at the close of §"Regularization, briefly", after the ridge experiment and its
check-yourself callout, which is where the brief describes it and where the footnote has
already been read. The manifest is the orchestrator's file; this receipt records the
discrepancy rather than resolving it. Every literal and line number below is independent
of which of the two anchors is chosen.

## Fixture: what the manuscript owns

All from `chapters/part1/01-linear-regression.qmd`, the footnote at lines 977–984.

| Manuscript literal | Lines |
|---|---|
| `\Delta\theta\approx` `\norm{\Delta\vect{w}_{\perp}}_2/\norm{\vect{w}}_2$: the same nudge rotates a larger vector less.` | 978–980 |
| `$\vect{w}\leftarrow(1-2\eta\lambda)\vect{w}` `-\eta\nabla\loss_{\mathrm{data}}$` (with "Here $L_2$ adds $2\lambda\vect{w}$") | 980–982 |
| `This radial shrink limits scale and can preserve angular responsiveness in a large layer; it does not by itself explain or cure stalled training.` | 982–984 |
| `We normally do not penalize that intercept.` | 986–987 |

The manifest currently registers the first and third as `fixture.literals`. The shrink
rule is the panel's second typeset line and should be registered too; its verbatim form
is `"\\vect{w}\\leftarrow(1-2\\eta\\lambda)\\vect{w}\n-\\eta\\nabla\\loss_{\\mathrm{data}}$"`.
Chapter 4 prints the same rule as `w ← (1 − αλ)w − α∇L` (line 444); the panel cites
Chapter 1's form only, because Chapter 1 is this scene's chapter.

## Declared computed variants, with their arithmetic

The chapter prints no lengths, no nudge, and no learning rate or penalty for this
footnote. Everything below is declared on the panel root as a data attribute, and the
player and the suite both read it from there; nothing is retyped.

| Declared | Value | Where |
|---|---|---|
| Short and long weight lengths | `1` and `5` | `data-lengths` |
| Perpendicular nudge | `0.6` | `data-nudge` |
| Learning rate, penalty | `0.5`, `0.6` | `data-eta`, `data-lambda` |
| Slider domain, step | `[3, 6]`, `0.1` | `data-length-range`, `data-length-step` |
| Swept length | `3` | `data-sweep-length` |

Arithmetic, all recomputed in `scripts/test_decay_angle_excerpt.cjs`:

- Shrink factor `1 − 2ηλ = 1 − 2(0.5)(0.6) = 0.40`; the long weight goes `5.00 → 2.00`.
- `θ_short = arctan(0.6/1) = 0.5404195003 rad = 30.9637565321°`, printed `30.96°`.
- `θ_long  = arctan(0.6/5) = 0.1194289260 rad =  6.8427734126°`, printed `6.84°`.
- Ratio `θ_short/θ_long = 4.5250302275`, printed `4.53×`.
- Swept `θ(3.00) = arctan(0.2) = 11.3099324740°`, printed `11.31°`; ratio `2.74×`.
- Decayed `θ(2.00) = arctan(0.3) = 16.6992442340°`, printed `16.70°`.
- Decay gain `θ(2.00)/θ(5.00) = 2.4404204592`, printed `2.44×`.
- Slider extremes: `θ(6.00) = 5.7105931375°`, `θ(2.40) = 14.0362434679°`.

**Exact angle, not the chapter's approximation.** The chapter writes `≈`, because
`‖Δw_⊥‖/‖w‖` is the small-angle form. The picture draws and prints the exact
`arctan(‖Δw_⊥‖/‖w‖)`, and every tip really sits at `w + Δw_⊥`, so the drawn perpendicular
displacement is exactly the declared nudge at both lengths. The two agree where the
chapter applies them and part company where the nudge is not small:

| | exact `arctan(n/L)` | chapter's `n/L` | gap |
|---|---|---|---|
| long weight, `L = 5` | `6.8428°` | `6.8755°` | `0.033°` |
| short weight, `L = 1` | `30.9638°` | `34.3775°` | `3.414°` |

The scope disclosure states this, quotes all four numbers, and says which one the picture
draws. The same choice is why the drawn ratio is `4.53×` and not the `5×` the linear
relation predicts — a contrast the suite asserts rather than hides.

**The shrink factor is aggressive on purpose.** `1 − 2ηλ = 0.40` is one application of
the chapter's printed rule at declared `η = 0.5`, `λ = 0.6`. A realistic per-step factor
is far closer to one, so the contraction drawn here as a single step accumulates over
many; the scope says so, and the transfer check makes the reader do that arithmetic.

## Beat timetable

Every transition runs in the tail of the beat it leaves and finishes exactly on the beat
it leads into, so an arrow-key seek parks on a finished picture. The hold is 2.6 s and
the glide 2.4 s.

| Beat | Holds | Glide into the next beat |
|---|---|---|
| 0 s — Predict | two weights on one ray, `1.00` and `5.00`; no nudge | 2.6–5 s the nudge grows at the short tip and lifts it |
| 5 s — Nudge the short weight | `30.96°`, arc and value revealed | 7.6–10 s the one arrow rides to the long tip, length fixed |
| 10 s — Carry the same nudge | arrow poised at the long tip; long angle `·` | **none** — the prediction hold is still |
| 15 s — Nudge the long weight | `6.84°`, arc and value revealed | 17.6–20 s the dashed tie grows between the two tips |
| 20 s — Compare | tie, `4.53×` badge | 22.6–25 s the length sweeps `5.00 → 3.00` |
| 25 s — Shorten the weight | `11.31°`, `2.74×`; slider live | 27.6–30 s the length sweeps back `3.00 → 5.00` |
| 30 s — Weight decay | update rule shown, `× 0.40` chip | 32.6–35 s the tip slides radially `5.00 → 2.00` |
| 35 s — After the shrink | `16.70°`, `2.44×`, `before decay` stub | — holds to 40 s; this frame is the static fallback |

**The one deliberate exception to the glide convention** is beat 2. Nothing glides toward
the withheld answer during it: the long weight is motionless for the whole five seconds,
and the reveal is the glide that begins at 12.6 s inside beat 3's own span. The suite
walks `[0, 12.6)` at 0.05 s and requires the long angle to be `·`, its arc absent, its
perpendicular offset exactly zero, and the answer absent from the picture's `aria-label`,
the scrubber's value text, the slider's value text and the caption.

## The one parameter control

The mechanism *is* the length's effect, so the scene carries one control (rule 1's
amendment): a real `<input type="range">` over `[3, 6]` in steps of `0.1`, orange because
`‖w‖` is the learnable weight's own magnitude, with ticks, a live readout and an
`aria-valuetext` that says what the value does. The timeline sweeps it by default
(beats 4→5→6); dragging pauses playback and recomputes the whole picture; any timeline
action — play, scrub, arrow-key beat — returns the length to the timeline's own value, so
the drag is a detour. Its keys never reach the pane's beat seeking, and the transport's
scrubber remains the only range inside `[data-controls]`.

## Reduced motion, layouts, palette

Reduced motion holds each beat's **finished** state: every continuous quantity is read at
`beats[stage]`, so a half-applied shrink or a half-carried nudge is unreachable, and the
strict beat-hold test sees exactly one drawn state per beat. The withheld answer is still
withheld in the still at beat 2.

The picture reflows rather than shrinking: `713 × 256` with the shared direction pointing
right, and `296 × 506` below 520 px with the same drawing stood on end, so the long
dimension follows the screen's. Angles are scale-free, so both prints show the same turn;
the narrow print moves the length and angle labels into two columns, the short weight's
and the long weight's, tied back to the tip by a leader, and drops the tie line's label,
which has no room. Both script-free prints are generated by
`scripts/render_static_frames.cjs` and pinned byte-for-byte by the suite.

Palette per grammar rule 4: orange `#c05621` for the weight vectors, their tips, ghosts,
lengths and the slider — they are the learnable parameter; wine `#722f37` for the nudge
arrow, its value, its record tick and, in the formula, both the numerator and the data
gradient — it is the update the loss gradient carries; ink `#232d4b` for the angle arcs,
their values, the shrink factor and the ratio badge — neutral measurements and operators;
grey for the shared direction, the origin, the leader and the `before decay` marker. The
formula's colours are the picture's: wine numerator over orange denominator. Colouring
`Δw_⊥` wine is this scene's decision, following Chapter 5's one-chain precedent that the
gradient path is wine and orange is reserved for `w`; it is recorded in the scope.

## Teaching boundary

The one visible sentence is the chapter's own disclaimer: the scene shows steering, not
stalling; the radial shrink limits scale and can preserve angular responsiveness, and it
does not by itself explain or cure stalled training. The closed scope disclosure adds:
the small-angle approximation and what was drawn instead, with all four numbers; that
decay changes scale and not direction; that nothing is trained, no data enters and no
gradient is measured; that the nudge is stipulated perpendicular while a real update is
only nearly so and does not hold its size fixed as weights grow; that the lengths, the
nudge, `η` and `λ` are declared computed variants and a realistic per-step factor is far
closer to one; that the chapter leaves the intercept unpenalized and bias and
normalization parameters are commonly exempted the same way; and the palette decision
above.

## Transfer check

> **Check yourself.** A layer's weights grow ten times longer while the gradient keeps the
> same size. With η = 0.1 and λ = 0.01, how many weight-decay steps alone would restore
> the original turning angle?
>
> About 1151 steps. Each multiplies the weight by 1 − 2ηλ = 0.998, and the angle follows
> one over the length, so the length must fall tenfold; repeated multiplication by 0.998
> first drops below one tenth at step 1151. The scene's single 0.40 factor stands in for
> that slow accumulation.

It applies the mechanism to a case the picture never shows, at an `η` and `λ` the fixture
never uses, and it cannot be answered from the final frame or by dragging the length.
Arithmetic: `1 − 2(0.1)(0.01) = 0.998`; `ln(0.1)/ln(0.998) = 1150.1408698021`, so the
first integer `k` with `0.998^k ≤ 0.1` is `1151`; `0.998^1150 = 0.1000282061 > 0.1` and
`0.998^1151 = 0.0998281497 ≤ 0.1`. As a check on the angle claim, at ten times the
scene's short length the same `0.6` nudge turns the weight `3.4336°`, and after 1151
steps `31.0073°`, just past the original `30.9638°`.

## Adaptation: what was deliberately not imported

Chapter 1's own film, `6050-Ch1-enhanced/STORYBOARD.md`, has no regularization,
ridge or weight-decay scene at all, so this scene takes no composition from it.

`6050-Ch4/STORYBOARD.md` does carry a weight-decay card, `ch4-guardrails-decay`. Nothing
from it is imported: not its loss bowl or decomposed descent step, not its `×6`
`DECAY_PULL_GAIN` display exaggeration, not its AdamW/coupling boundary card, and not its
accumulated `(1−αλ)^k` readout (`α = λ = 0.1`, `0.99^60 = 0.5472` at `k = 60`). That
card's per-step factor of `0.99` is cited in this receipt only as the realism anchor
behind the scope's note that a realistic per-step factor is far closer to one. The film's
framework, chrome and off-page narration are not imported either. This scene is built
from the Chapter 1 footnote, not from the Chapter 4 film.

The author's original request framed weight decay as preventing a stall — "the gradient
step will be small compared to the inflated weights and training will stall." The
manuscript does not make that claim and explicitly disclaims it, so the scene shows the
geometry the chapter *does* state, angular responsiveness, and carries the disclaimer as
its visible boundary sentence.

## Acceptance

Deferred local SVG/JavaScript player, shared keyboard transport, closed and paused on
open, 1.5× default, one guarded MathJax call after mount, reduced-motion stills,
transcript, and generated wide/narrow static final frames. No new dependency, video or
animation engine.

`scripts/test_decay_angle_excerpt.cjs` recomputes every angle, length, ratio and shrink
from the declared attributes and reads the drawn geometry back out of the SVG: the exact
arctangent at every beat and both layouts; the one nudge's constant drawn length and
perpendicularity at 700 sampled times; both lifted tips at one perpendicular offset; the
shrink monotone, radial and exactly `0.40`; the two badges; the withheld prediction in
drawing and in speech; the reveal schedule; reduced-motion stills; the slider as a
detour, clamped, pausing playback, and isolated from the transport's keys; determinism
across seek, drag, play and resize histories; label boxes neither overlapping nor leaving
the picture at nine widths, sixteen times and five dragged lengths; type never below
12 px; static parity; and plain-text number discipline. Local acceptance: **45/45** scene
checks (28 inherited from `registerTransportTests`, `registerBeatHoldTest` and
`registerGrammarTests`, 17 the scene's own). `scripts/audit_excerpt_fixtures.py` reports
no finding for this scene.

Frames were inspected at 1280 px and 375 px, with and without reduced motion, and
script-free at both widths: figure width 713 / 302, no page overflow, no text outside the
picture, no console errors. `scripts/test_excerpt_checks.cjs` does not yet recompute this
scene's transfer check; the arithmetic it needs is in "Transfer check" above.

## Source digests

Lecture paths are relative to
`/Users/hs9hd/Library/CloudStorage/Box-Box/Teaching/6050/Video_lectures/`.

| Source | SHA-256 |
|---|---|
| `chapters/part1/01-linear-regression.qmd` | `75f8209918e4fd01ff1e7c27628264aa085467d56be9cb8c9ca1b167b6d20f26` |
| `6050-Ch1-enhanced/STORYBOARD.md` | `061e5954970c22dcb4dae6a353271e3e33237d31c90b6525577c1d01bcf0e28e` |
| `6050-Ch4/STORYBOARD.md` | `c5f8b635909b585d6c62f310ef2e16801c58421127d9ef6d536d7fbd331db9ce` |
