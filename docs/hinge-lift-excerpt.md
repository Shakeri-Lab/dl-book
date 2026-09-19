# Hinge lift: the cut never bends, the space does

**Built, not yet author-approved.** The scene is registered in `interactives/manifest.json`
and inserted immediately after `cell-fig-neuron-hinge` in Chapter 3, outside Plan → Code:
`03-nonlinearity-mlp.html#hinge-lift-excerpt`. Implementation:
`interactives/hinge-lift/{panel.html,player.js,player.css}`,
`scripts/test_hinge_lift_excerpt.cjs`, and this receipt. The shared manuscript, its static
figures and all frozen evidence are unchanged; nothing in `chapters/` was edited for it.

## One mechanism and one question

**The panel asks:** *XOR beats every straight line. Does fixing it need a boundary that
curves?*

**The misconception.** Students read "XOR is not linearly separable" as "XOR needs a
curved boundary". It does not. XOR is unsolvable by a line *in the input plane*, and
becomes solvable by a **plane** the moment one hinge lifts the four points out of that
plane. The second thing they miss is *why* the hinge can do that: the rectifier's OFF
region is **flat**, so half the plane is pinned at zero, and that pinning is the only
asymmetry in the picture. Without it the four lifted points are coplanar and no cut of any
kind separates them.

## What moves, and why two frames could not do it

One picture: a genuine three-dimensional schematic under **one fixed axonometric camera**
(the Chapter 1 `column-space` form — no rotation, no camera control, no 3-D engine). A
parallelogram input plane with the unit square drawn on it, the four XOR corners, and a
vertical activation axis.

**Beats 0–1, the failure, kept short.** The chapter's own rule `x₁ + x₂ = 0.5` is drawn
across the corners with a wine ring on the one it gets wrong and a readout saying `3 of 4`.
The line then turns; the ringed corner changes, two are wrong at once partway round, the
readout falls to `2 of 4` and climbs back. It never reads 4. The turn comes to rest exactly
on this neuron's own threshold, so the line has stopped moving before beat 2 names it.

**Beats 3–4, the mechanism.** A third axis rises and each corner climbs to its *own*
activation — `0.00, 0.40, 0.75, 1.40`, evaluated from the chapter's printed `w` and `b`.
The ON half of the plane tilts up into a sheet and the corners ride on it; the silent
corner at `(0, 0)` stays pinned flat at zero. Then a hollow ghost drops out of that corner
to `−0.25`, the stimulus the rectifier threw away.

**Beats 5–7, the cut.** A flat plane arrives horizontal — a rule reading the activation and
nothing else — scoring `2 of 4`. It tilts, staying perfectly flat, bringing the two input
coordinates back in; the readout climbs to 3, then to 4, and stops. Where the cut crosses
the risen sheet, a line is drawn in the air and falls to the input plane. A second piece of
the boundary was already lying flat inside the OFF region. The input plane closes with a
two-piece boundary and its two class-0 corners shaded off.

**First/last-frame verdict: passes.** The first frame is four points and a failing line;
the last is a lifted cloud with a flat cut and a bent shadow. Side by side a student loses
all three things the scene exists for: that the third coordinate *is* the chapter's neuron
evaluated per point and not an arbitrary new dimension; that the corner which stays at zero
is what makes the lift asymmetric, worth exactly the `0.25` the rectifier clipped; and that
the plane never bends — the same readout that could not pass 3 reaches 4 while the cut
stays rigid. Two frames look like one picture swapped for another.

## Fixture and provenance

The chapter owns the data, the activation, the neuron and the failing rule. Everything else
is a **declared computed variant**, held in the panel's `data-*` attributes and nowhere else
in this repository, and recomputed by the suite from those attributes.

### Manuscript literals the panel mirrors

All verbatim in `chapters/part1/03-nonlinearity-mlp.qmd`.

| literal | lines |
|---|---|
| the XOR table, `\| 0 \| 0 \| 0 \|` … `\| 1 \| 1 \| 0 \|` | 28–33 |
| `\mathrm{ReLU}(z) = \max(0, z), \qquad` and `f(\vect{x}) = \mathrm{ReLU}(\vect{w}^\top\vect{x} + b).` | 161–162 |
| `w, b = torch.tensor([1.0, 0.65]), -0.25` | 186 |
| `it draws a line through the plane: an OFF region and an ON region, with $\vect{w}$` / `perpendicular to the boundary.` | 216–217 |
| `a hard linear boundary can classify at most three of the` / `four points (75%)` | 108–109 |
| `Z = (grid.sum(1) - 0.5 > 0).float().reshape(gx.shape)`, the `"best linear rule (75%)"` | 132, 136 |
| `fig-neuron-hinge`, the figure this panel sits under | 193 |

### Declared computed variants, with their arithmetic

| panel attribute | value | what it is |
|---|---|---|
| `data-xor` | `[[0,0,0],[0,1,1],[1,0,1],[1,1,0]]` | the chapter's table as coordinates |
| `data-weights` / `data-bias` | `[1.0,0.65]` / `-0.25` | the chapter's neuron |
| `data-best-line` | `[1,1,0.5]` | the chapter's own rule, `x₁ + x₂ = 0.5` |
| `data-turn` | `-45` | the one declared far placement the turn passes through, in degrees |
| `data-flat-start` | `0.7` | the height of the cut before it tilts |
| `data-window` | `[-0.25,1.15]` | the drawn extent of the input plane |
| `data-azimuth` / `data-elevation` | `300` / `22` | the fixed camera, in degrees |
| `data-rise` | `0.7` | drawing units per unit of activation |

- **The four activations.** `z = 1.0·x₁ + 0.65·x₂ − 0.25` gives `−0.25, 0.40, 0.75, 1.40`
  at `(0,0), (0,1), (1,0), (1,1)`; `ReLU` clips the first to `0`, leaving heights
  `0, 0.40, 0.75, 1.40`. Exactly one corner is clipped.
- **The fold budget, and why the cut exists.** For *any* plane `h = p x₁ + q x₂ + r`, write
  each corner's signed vertical clearance as `+` for class 0 and `−` for class 1. The four
  clearances sum to `h₀₀ + h₁₁ − h₀₁ − h₁₀` whatever `p, q, r` are, because the coefficients
  of `p`, `q` and `r` each cancel over the four signed corners. That sum is
  `0 + 1.40 − 0.40 − 0.75 = 0.25`, which is exactly `−b`. It is positive **only because the
  rectifier clipped `(0,0)` from `−0.25` up to `0`**: on the unclipped stimuli the same sum
  is `−0.25 + 1.40 − 0.40 − 0.75 = 0`, so the four raw points are coplanar and every plane
  gives four clearances summing to zero — at least one is not positive, and nothing
  separates them. **The whole separability budget is the amount the bend threw away.**
- **The cut is solved, not fitted, and not typed in.** Setting all four clearances equal to
  one `m` is four linear equations in `(p, q, r, m)`; the player solves them by Gaussian
  elimination from the lifted corners and refuses to mount if `m ≤ 0`. Here
  `m = 0.25/4 = 0.0625`, `r = −0.0625`, `q = 0.40 + 2m = 0.525`, `p = 0.75 + 2m = 0.875`.
  The cut is `h = 0.875 x₁ + 0.525 x₂ − 0.0625`, and every corner is exactly `0.0625` from
  it: `0 − (−0.0625)`, `0.4625 − 0.40`, `0.8125 − 0.75`, `1.40 − 1.3375`. Class 0 above,
  class 1 below. It is therefore the unique plane of largest equal clearance, and `0.0625`
  is the best any plane can do.
- **The failing family.** Unit-normal lines `u(θ)·x = ρ` with `ρ = 0.5/√2 = 0.35355339…`,
  the chapter's own `x₁ + x₂ = 0.5`. At `θ = 45°` it misses `(1,1)`; at `θ = 0°` it misses
  `(0,1)` and `(1,1)` (2 of 4); at the declared `θ = −45°` it misses `(0,1)`. The turn then
  runs on to `θ = atan2(0.65, 1) = 33.0238…°`, `ρ = 0.25/‖w‖ = 0.2096109…`, which is this
  neuron's own threshold `x₁ + 0.65x₂ = 0.25` — also a 3-of-4 line. Each half of the turn
  eases in and out, so the reversal happens at zero speed.
- **"At most three of four" is verified, not assumed — but the picture does not prove it.**
  The suite brute-forces 3600 normal directions crossed with every threshold between the
  projections and both orientations, and the maximum is 3. The scene shows a fan of
  placements; the claim is the chapter's.
- **The tilt.** `plane(f) = f·(0.875, 0.525, −0.0625) + (1−f)·(0, 0, 0.7)`, a plane at every
  `f`. At `f = 0` it is horizontal — a rule that reads the activation and nothing else — and
  scores `2 of 4`. `(1,0)` passes below it at `f = (0.75 − 0.7)/(0.875 − 0.0625 − 0.7) =
  0.05/0.1125 = 4/9`, and `(0,0)` passes above it at `f = (0 − 0.7)/(−0.0625 − 0.7) =
  0.7/0.7625 = 56/61`. The readout reads 2, then 3, then 4, and never falls.
- **The shadow.** On the silent half the sheet is at zero, so the boundary is
  `0.875 x₁ + 0.525 x₂ = 0.0625`. On the firing half it is where the cut meets the sheet:
  `x₁ + 0.65x₂ − 0.25 = 0.875x₁ + 0.525x₂ − 0.0625`, i.e. `0.125(x₁ + x₂) = 0.1875`, i.e.
  **`x₁ + x₂ = 1.5`**. The two arms are not parallel and meet, together with the crease, at
  `(−29/14, 25/7) = (−2.0714…, 3.5714…)` — one bent line whose corner lies far outside the
  drawn window, which is why inside the window the reader sees two separate straight
  pieces. The class-0 regions they cut off are the triangle at `(0,0)` and the triangle
  beyond `x₁ + x₂ = 1.5`; the two class-1 corners sit in the band between.
- **The camera.** One fixed axonometric projection built from the two declared angles:
  `right = (−sin 300°, cos 300°, 0)` lies in the input plane and `up = (cos 300° sin 22°,
  sin 300° sin 22°, cos 22°)` tilts from the activation axis toward it. They are exactly
  orthonormal, so the activation axis draws straight up the page and a vertical stem is a
  vertical stem. Nothing rotates and the reader cannot turn it.
- **The vertical scale.** The activation axis is drawn at `0.7` drawing units per unit of
  activation, so the picture fits; an affine rescaling of one axis changes no incidence
  fact — which corner is above which plane is unchanged — and the axis carries its own tick
  at `h = 1` so heights are read against it rather than against the two input axes.
- **Drawing devices, not chapter content:** the drawn window, the swept fan, the flat
  starting attitude of the cut, the unit-square outline, the `OFF`/`ON` words, the growing
  weight arrow, the stems and feet, the dashed droppers, and the placement rules that keep
  the axis names out of the corners' columns.

## Timetable

Duration 40 s, beats `0 5 10 15 20 25 30 35`, shared transport, closed and paused on open,
1.5× default.

| beat | s | stage | what happens | caption |
|---|---|---|---|---|
| 0 | 0 | No line | the four corners, the chapter's own rule, `(1,1)` wine-ringed, `3 of 4` | No straight line gets all four. Must the boundary itself bend to fix that? |
| 1 | 5 | Turn it | the line turns 45° → −45° → 33.02°; the ringed corner changes; `3 → 2 → 3` | Turn the line: the wrong point changes, and the count never reaches four. |
| 2 | 10 | One neuron | the resting line turns orange, the OFF half shades, the weight arrow grows across it, `OFF`/`ON` appear, the score is withheld | Hand that line to one neuron: silent on one side, firing on the other. |
| 3 | 15 | The lift | the axis appears, the ON half tilts into a sheet, the corners climb to `0.00, 0.40, 0.75, 1.40` | Each point rises by its own activation — and the silent corner stays at zero. |
| 4 | 20 | The clip | a ghost drops out of the pinned corner to `−0.25` | Unbent, that corner would drop to −0.25; the clip lifts it by exactly 0.25. |
| 5 | 25 | The cut | **the reveal**: a flat plane tilts from horizontal into the solved cut; the score climbs `2 → 3 → 4` | Now a flat plane tilts through the lifted points, and the count starts climbing. |
| 6 | 30 | The shadow | the crossing is drawn in the air and falls to the plane; the flat arm appears | Drop that cut back onto the input plane: the boundary arrives in two pieces. |
| 7 | 35 | Flat cut, bent boundary | the two class-0 regions shade in | The cut never bent. The space did, and that is what one hidden unit buys. |

**The withheld prediction.** From 0 s to 25 s the cut is absent from the drawing, and the
words *flat* and *separat…*, and the reading `4 of 4`, appear in no caption, no picture
label, the SVG's accessible name or the scrubber's value text. The suite walks the
timeline at 0.05 s and checks all of them, and also that the swept score is never 4. The
question stands still for its whole first beat, so the reader has five seconds to answer.
The `4 of 4` arrives with the tilt, at `f = 56/61` (about 29.6 s), and then stands.

## Reduced motion

One still per beat, each the **finished** picture of that beat, so every caption is true of
the still it stands over: the turn rests on the neuron's threshold at 3 of 4, the lift rests
fully lifted, the ghost rests at `−0.25`, the tilt rests at 4 of 4. Beat scores are
`3, 3, 3, 3, 3, 4, 4, 4`. The harness's strict `registerBeatHoldTest` confirms exactly one
drawn state per beat interval.

## Palette

Per rule 7 and visual-grammar rule 4. The four corners are values of the target, so both
classes are purple `#805ad5` and are told apart by **shape** — hollow rings are the 0s,
filled squares the 1s — which carries the distinction without colour. Blue `#2b6cb0` is the
input space itself: the unit square and the two axis names. Orange `#c05621` is the
neuron's own parameters: its threshold line once the line is its, and the weight arrow.
Green `#2f855a` is the activation: the risen sheet, the stems, the heights, the ghost and
the `h` axis — matching the chapter's own green ReLU curve and Greens surface in
`fig-neuron-hinge`. Wine `#722f37` rings the corners a line gets wrong. The failing rule,
the cut, its shadow and the score are the book's emphasis ink `#232d4b`; the plane, its OFF
shading and the region words are scenery grey. The scene overrides `.target-role` and
`.error-role` within its own root.

## Teaching boundary

The panel's one visible sentence: *One fixed drawing angle, not a three-dimensional view
you can turn, and nothing here is trained: the chapter hands this neuron its w and b.*

Everything else sits in the closed **Scope and caveats** disclosure: the swept fan
*illustrates* the chapter's "at most three of the four points" and is not a proof; the third
axis is one neuron's activation, the same quantity the figure above contours, not a learned
embedding dimension, and it is drawn at its own vertical scale; the cut is solved, not
fitted, and its clearance is equal because the four clearances always sum to the same 0.25
the rectifier clipped; **the cut uses all three coordinates, and the horizontal start of
its tilt is exactly what a rule keeping only `h` would be — it gets two of four, so one
neuron alone does not do XOR and the chapter's next section builds boundaries out of
several hinges**; inside the window the final boundary reads as two straight pieces, which
are two arms of one bent line whose corner lies at `(−2.07, 3.57)`; and the window, the
fan, the flat start and the camera are drawing devices while the corners, their heights and
every intersection are exact.

## Transfer check

> **Check yourself.** Keep w = (1.0, 0.65) but set b = 0, so every corner is ON. Could a
> flat cut still separate the lifted points?
>
> No. With b = 0 the stimuli are 0, 0.65, 1.00 and 1.65 and nothing is clipped, so the
> heights are just a linear function of the inputs and all four lifted points lie on one
> plane: 0 + 1.65 = 0.65 + 1.00. The fold, not the third axis, is what separates them.

Verified by arithmetic, not by reading the final frame. With `b = 0` the stimuli are
`1.0·0 + 0.65·0 = 0`, `0.65`, `1.00` and `1.65`; all are `≥ 0`, so `ReLU` is the identity
on every one and `h(x) = x₁ + 0.65x₂` is affine. The fold budget is
`h₀₀ + h₁₁ − h₀₁ − h₁₀ = 0 + 1.65 − 0.65 − 1.00 = 0`, so for every plane the four signed
clearances sum to zero and cannot all be positive: no plane separates them. The suite
recomputes all of it.

## What was deliberately not imported from the film

`6050-Ch3`'s `Hinge` scene (storyboard §4, cue 86) supplies composition and reveal order
only: a truth-table hold before the sweep, a live misclassified counter beside a turning
line, a `w = (1.00, 0.65) · b = −0.25` caption under the input plane, and the idea of a
fold lens that lifts XOR corners out of the plane with the crease drawn on the floor.

Not imported: the film's board/rail chrome, its `Readout` chips, `PRE-ACTIVATION` and
`OPEN/SILENT` cards, scene numbering, kickers and off-page narration; its `XOR` scene's
400-step trained linear run, its soft probability raster, its four `p = …` readouts and
`BCE` chip, and its `BEST HARD ACCURACY 75%` card (this scene's `3 of 4` is computed from
the drawn line at every instant instead); its one-dimensional `z` clock and the
`neuronPointAt(z)` travelling point; its blue-circle class-0 colour coding, which would
collide with the book's blue-is-the-input rule. Most importantly, the film's fold lens
lifts with `ReLU(s)` and then `ReLU(−s)` for `s = x₁ − x₂` — **two** hinges, staged with a
`1 OF 2 LIFTED` tag — which is a different construction from the chapter's printed neuron;
this scene lifts with that one printed neuron and cuts with a plane that keeps the two
input coordinates, and says so in its scope. No 3-D engine, camera control or rotation was
taken from `geometry-3d.jsx` or added: the backlog defers elaborate 3-D scenes, and this is
a labelled schematic drawn through one fixed projection, exactly as Chapter 1's
`column-space` is.

## Source digests

Lecture paths are relative to
`/Users/hs9hd/Library/CloudStorage/Box-Box/Teaching/6050/Video_lectures/`.

| path | sha256 |
|---|---|
| `chapters/part1/03-nonlinearity-mlp.qmd` | `1ee61d4460c65d8f89205620408d42212ae602411b74d42e9bcf9d90877d4b1e` |
| `6050-Ch3/STORYBOARD.md` | `065d2f5e9054d0581b9909b52654fafce446352caa94724b4752f4a620aeee84` |
| `6050-Ch3/lecture.jsx` | `ec73751439013366e2ce867b9c6d076ee2a2798a88983defe6fdacbc8e6417b2` |
| `6050-Ch3/geometry-3d.jsx` | `a4738205a33ac5d717ac5edb75cfd28423a707d11241c6cdb9900e0584d2f6e8` |

## Checks

`node --test scripts/test_hinge_lift_excerpt.cjs` — **45 checks**: the harness's 21
transport checks, the strict beat-hold check, the six visual-grammar checks, and the
scene's own oracle. That oracle recomputes the activations, the fold budget, the separating
plane (by its own elimination, not the player's), the swept family, the tilt, both shadow
arms and every drawn coordinate from the declared attributes, and compares them against the
player's published state at 0.1 s over the whole timeline and at eight container widths
from 240 px to 713 px. It also proves that the gap identity holds for arbitrary planes,
that no line in the input plane gets four (3600 directions × every threshold × both
orientations), that the unclipped corner set is coplanar and unseparable, that the tilt is a
plane at every instant with crossings at exactly `4/9` and `56/61`, that the two shadow arms
lie only in their own regions and meet at `(−29/14, 25/7)`, that the answer is withheld at
0.05 s resolution, that the reveals arrive in order, that reduced motion rests on each
beat's finished picture, that seek and resize reproduce the frame, that no label leaves the
picture or crosses another label or a marker at 0.5 s and every width, that the picture
prints only U+2212 minus and no e-notation, that the wide and narrow script-free prints
match a fresh render, and that an unusable fixture — a neuron that clips nothing, one that
clips everything, a degenerate weight vector, a lopsided class split, a window that loses a
corner — throws instead of mounting a player over the static print.
