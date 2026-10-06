# No straight line leaves less squared residual than PCA's flat one: `flat-line-excerpt`

**Author-approved, September 29, 2026.** After reviewing the build, the author asked to "commit and push".

An optional, HTML-only mechanism excerpt for the autoencoder interlude
(`chapters/interludes/making-pca-learnable.qmd`), placed immediately before the heading
"A code is not yet a distribution" (a `before-heading` anchor). It closes "What if the map
could bend?", after `fig-linear-nonlinear-ae` and the manifold-learning paragraph that ends
"true manifold or its preferred coordinates." The PDF is untouched:
`filters/mechanism-excerpts.lua` returns `{}` for any non-HTML format on its first
executable line.

The author scoped this scene among four on September 28, 2026 (`detach-cut`, `gru-blend`,
`decoder-family`, `flat-line`) and asked for all four to be built. Its peer in the same
chapter is `same-subspace-excerpt`, whose marks it reuses for the same objects: filled
points with a white edge, open rings for feet on a line, ink for fixed operators, grey
scenery.

## The question, and the misconception it targets

> Rank-one PCA laid a flat line through the curve. Tilt it about the center: can any other
> line leave less squared residual?

The chapter states the result ("Among all linear reconstruction maps of rank at most $k$,
this projector minimizes squared reconstruction error") and its figure draws the flat PCA
line with its residuals. What neither shows is a line that loses. A reader can reasonably
expect a line leaning along one arm of the U, or passing near more of the points, to fit
better, and behind that sits the hope that the right tilt would let a straight line follow
the bend. The sweep answers both. Every tilt adds residual: L climbs from 0.098 on the flat
line to 0.166 upright and comes back only when the line is flat again. At 45 degrees the
line hugs the right arm, so that arm's top point nearly touches it, but the far arm's
residuals grow long and L = 0.132. The flat line is the minimum among lines, and its
leftover 0.098 is the bend, which no line can follow: the opening for the nonlinear map the
chapter trains next to it.

## What moves, and why two frames could not do it

One picture. Sixteen points on the planted curve (grey scenery); the line through their
mean, orange, with a small ink cross at the pivot; each point's foot on the line, a green
open ring (the reconstruction x̂_i); a wine residual segment from each point to its foot;
the printed L in wine; and, small beside it, a plot titled "L against tilt" whose wine dot
sits at the current tilt and leaves a trace once the sweep begins. The tracked object is
the line with its residuals: it turns about the center and every residual is redrawn
perpendicular to it. The plot's dot is the same L seen a second time.

Two frames, flat and upright, show two numbers, 0.098 and 0.166. They lose what the motion
carries: that L rises the moment the line leaves flat and falls back only at flat, so no
tilt between them does better; that a lean along one arm trades that arm's short residuals
for the far arm's long ones; and, in the trace, that the whole half-turn is one hump over a
floor it touches only at 0 and 180 degrees. The dial lets the reader try any other
direction.

The value of L sits beside the flat line's right end, where the reader first meets it, and
stays there while the line turns. A label riding the turning end would have to orbit the
picture (right, top, left) and would cost the phone layout a third of its scale; fixed, it
never jumps and never touches the line or a residual, which the suite checks at every whole
tilt in both layouts.

## The fixture

| attribute | value | what it mirrors |
|---|---|---|
| `data-height` | 1.5 | the curve's height: `1.5\left(t^2-\frac{1}{3}\right)` in the display equation and `1.5 * (t.square() - 1.0 / 3.0)` in `planted_curve` |
| `data-points` | 16 | declared sample: the midpoints t = −1 + (2j + 1)/16, j = 0, …, 15, evenly spread and symmetric about zero |
| `data-sweep` | 0 180 | declared: the tilt range in degrees, from the flat line through a half-turn; the dial's range and the plot's axis |
| `data-evidence-class` | computed | every number the panel shows is computed from the three attributes above |

The chapter literals the manifest binds are the curve's display equation, `planted_curve`'s
return line, "PCA gives the best **flat** rank-$k$ reconstruction.", the projector
sentence's clause "linear reconstruction maps of rank at most $k$, this projector minimizes
squared", and the objective's normalization `=\frac{1}{nd}\sum_{i=1}^{n}`. The dimension
d = 2 is the curve's two coordinates, the second axis of `planted_curve`'s `dim=1` stack.

### Declared computed variants

| quantity | how it is derived | value |
|---|---|---|
| the pivot | the mean of the sixteen points (PCA centers the rows) | (0, −0.001953125) |
| the spreads | mean squared deviation from the mean along each axis | Sxx = 0.33203125, Syy = 0.19610595703125, cross term 0 |
| L at tilt θ | (1/(nd)) Σ ‖x_i − x̂_i‖² with n = 16 and d = 2, x̂_i the orthogonal foot on the line through the mean at θ from the horizontal | equals (Sxx sin²θ + Syy cos²θ)/2 |
| L on the flat line | θ = 0 or 180 | 0.098052978515625, printed 0.098 |
| L at a 45-degree tilt | θ = 45 | 0.1320343017578125, printed 0.132 |
| L upright | θ = 90 | 0.166015625, printed 0.166 |
| the check's doubled bend | height 3: Syy becomes four times larger | Syy = 0.784424; flat 0.392, vertical 0.166 |

L is printed with three decimals; the 181 whole tilts give 65 distinct printed values.

### The printed L is the drawn residuals' loss

An earlier attempt at this scene printed a loss that its drawn residuals did not add up to.
Here `fit()` in `player.js` computes, in one pass, the feet, the residual vectors and L from
those vectors alone, and `draw()` draws exactly those residuals and prints exactly that L.
`scripts/test_flat_line_excerpt.cjs` proves it from the drawing: it recovers the drawing's
scale from the drawn points against the declared sample (and checks the aspect is equal),
checks that each of the sixteen residual segments runs from its drawn point to its drawn
foot, that every foot lies on the drawn line and every residual is perpendicular to it,
recomputes L from the segments' endpoints with the chapter's 1/(nd), and compares it with
the printed text. It does so at all 181 whole tilts of the dial and at every quarter second
of the timeline, in the wide and the narrow layout, and again with the height doubled. The
only tolerance is the drawing's 0.0001 px precision, needed at 85 degrees, where
L = 0.1654993723 sits 6.3 × 10⁻⁷ from a rounding boundary; everywhere else the rounded
recomputation must equal the printed digits exactly.

## Beats

Duration 40 s, beats `0 5 10 15 20 25 30 35`.

| beat | s | what happens |
|---|---|---|
| 0 | 0–5 | the sixteen points, the flat line through their mean, every residual; L = 0.098; the plot holds one dot at 0 degrees |
| 1 | 5–10 | predict: the line stays flat, no trace, no other tilt or value drawn or spoken |
| 2 | 10–15 | the reveal: the line turns to upright (10–13 s), every residual redrawn perpendicular to it; L climbs to 0.166 and the trace draws; held 13–15 s |
| 3 | 15–20 | the second quarter-turn back to flat (15–18 s); L returns to 0.098 only at flat and the trace completes one hump; held 18–20 s |
| 4 | 20–25 | a 45-degree lean along the right arm (20–22.5 s); L = 0.132, held 22.5–25 s |
| 5 | 25–30 | back to flat (25–27.5 s); the flat line's 0.098 drawn as a dashed floor under the whole trace, touched at both ends |
| 6 | 30–35 | the residuals thicken and the formula's norm is washed: what is left, 0.098, is the bend |
| 7 | 35–40 | the final frame: flat line, L = 0.098, the full trace with "flat, 0.098" and "upright, 0.166" |

The timeline's tilt moves in whole degrees. At 20 s the dial's thumb goes from 180 back to
0: the same flat line, since a line's tilt is taken modulo 180 degrees, so the lean starts
from 0 and the dial reports 0 to 180. Every glide ends two seconds or more before its beat,
so each value it reaches holds long enough to read. Beats 2 and 4 caption in two steps:
the turn while the line moves, then its value once the line has arrived, so a caption never
names a value the drawing has not reached. The formula washes the
reconstruction's symbol while the feet move (beats 2 to 5) and the whole norm in beat 6.
The symbols x and x̂ label one point and its foot while the line is at rest (beats 0, 1, 6,
7). Reduced motion holds each beat's finished state: tilts 0, 0, 90, 180, 45, 0, 0, 0.

The dial is the scene's one parameter control, because the mechanism is that parameter's
effect: the line's direction, which is what the tied linear autoencoder learns. It is a
real `<input type="range" min="0" max="180" step="1">` outside the transport bar, with ticks
at 0, 45, 90, 135 and 180, the readout "tilt 0°", `aria-label` "Tilt of the line" and
`aria-valuetext` such as "tilt 45 degrees: L = 0.132"; hidden and inert until the player
mounts. The timeline drives it. Dragging pauses playback and redraws the whole picture at
the dragged tilt (line, feet, residuals, L and the plot's dot), while the trace and its
marks stay what the timeline has drawn so far, so a drag during the question shows only
what the reader dials. While dragging, the caption says what the dial does and names no
value, so the value is spoken once, by the slider. Any transport action (play from a pause,
a scrub, an arrow-key beat) returns to the timeline's tilt, and the slider's keys never
reach the pane's beat seeking.

## Palette

Blue the points; green their reconstructions, open rings on the line; wine the residuals,
L, the trace and the dot; orange the line, whose direction is the one learnable thing here,
and the dial that turns it; ink the pivot cross and the plot's floor; grey the planted
curve and the plot's axes. Colour is never the only carrier: points are filled, feet are
rings on the line, residuals are segments ending at the rings, and each value is labelled.
The chapter's figure draws its PCA line and its residuals in its house orange (`#E57200`);
the panel follows the book palette instead, orange for the line alone and wine for the
residuals and the loss.

## Teaching boundary

> Sixteen evenly spaced points stand in for the chapter's grid, and the sweep compares
> straight lines only, which is why the bend's residual survives every tilt.

The closed "Scope and caveats" adds: the sample's midpoints; the chapter's normalization,
with every residual in L drawn; that the line turns in whole degrees, the plot records each
degree swept, and L stays beside the flat line's right end; that every line pivots at the
sample mean because PCA centers the rows; why the minimum sits at the flat line (the curve
is symmetric, so there is no cross term, and its horizontal spread 0.332 exceeds its
vertical spread 0.196); that the chapter's cell measures its own held-out grid and prints
its own mean squared error, which this sample does not reproduce digit for digit; and the
palette key, including the chapter figure's own orange.

Deliberately left out. The chapter's prediction prompt before the experiment (which map
can follow the bend with one number per point, and whether PCA and the tied linear
autoencoder find the same line) is answered by the chapter's figure and prose before the
panel appears; the panel draws no nonlinear autoencoder and no training run, and its dial
is a direction, not an optimizer. Exercise 2, "Audit the bend", asks about extrapolation
beyond the training interval: the panel draws the curve on t ∈ [−1, 1] only and says
nothing about extrapolation. Exercise 1 (untie the linear maps) is untouched. No held-out
mean squared error is printed.

## The transfer check

> Double the bend: the same sixteen points on (t, 3(t² − 1/3)). Which line through the
> center leaves the least residual now, and what is its L?

The vertical line, L = 0.166. Doubling the height makes the vertical spread four times
larger, from 0.196 to 0.784, which now exceeds the horizontal 0.332; a line leaves the
spread across it as residual, so the best line runs along the larger spread, and the flat
line would leave 0.392. `scripts/test_excerpt_checks.cjs` recomputes 0.098 (the scene's own
flat line), 0.166, 0.196, 0.784, 0.332 and 0.392 from the panel's `data-height` and
`data-points`. It is transfer, not recall: the scene never changes the height, and at the
chapter's 1.5 the vertical line is the worst tilt, not the best.

## What was imported from the film, and what was not

The film `6050-Interlude-Autoencoders`, scene `PCAFlat` (100 to 160 s): `lecture.jsx` lines
386 to 408 (`SPCAFlat`, with its `CurvePlot` helper and `CURVE_PTS`), its storyboard row 4,
and its captions for that scene. Imported: the planted curve with orthogonal feet dropped
to a flat line while a squared-residual readout changes, and the captions' intent (which
flat map loses the least; PCA minimizes squared orthogonal residuals). Not imported: the
film's held-out MSE readout and every film number, its red residual colour (wine here), its
equation card, its 65 display points, and its point-by-point sweep of one active residual
along a fixed line. The turning line with all sixteen residuals always drawn, and the
L-against-tilt trace, are this panel's own.

## Source digests

Lecture paths are relative to the lecture repository root.

| Source | SHA-256 |
|---|---|
| `chapters/interludes/making-pca-learnable.qmd` | `506f34a3c10b503c17a74eb147abca056d4050b49524d4d951276ad5744eb1ed` |
| `6050-Interlude-Autoencoders/lecture.jsx` | `2d2a0d2bd4c9a8314a79e9bb7ea0afa98077a6ec30ab5e4eb7613fa6e64e91f4` |
| `6050-Interlude-Autoencoders/STORYBOARD.md` | `3d5686f60c10edb6e5b83236adeebccb933811718e3b08d86d10fe6b2921ddba` |
