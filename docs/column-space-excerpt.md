# Column space: the prediction cannot leave the plane

Optional HTML-only scene for Chapter 1, inserted before the level-2 heading
*Finding the best weights, method 2: walk downhill* — so it lands just after
`fig-projection` and the paragraph that names the column space. Implementation:
`interactives/column-space/{panel.html,player.js,player.css}`,
`scripts/test_column_space_excerpt.cjs`, and the manifest entry
`column-space-excerpt`. Everything below is the record the fixture audit reads.

## The question and the misconception

**The panel asks:** *If you tune the weights hard enough, can the prediction reach the
target exactly?*

Students read "least squares finds the best fit" as *the model can reach the target if
you tune hard enough*. It cannot. Every prediction the model can make is
$\hat{\vect{y}} = \matr{X}\hat{\vect{w}} = \sum_j \hat w_j \matr{X}_{:j}$, so it lies in
the plane spanned by the feature columns; if $\vect{y}$ is off that plane, the residual
has a floor no choice of weights reaches below. The second misconception is *why* the
optimum sits where the residual is perpendicular — the chapter asserts it in one
sentence and draws it in one static figure, and a static figure cannot show that moving
away in any direction makes things worse.

## What moves, and why two frames could not do it

One picture: a fixed axonometric view of a genuine three-dimensional schematic. A
parallelogram plane (the column space, with a lattice of the two column directions), the
purple target above it, and a green candidate prediction inside it with the wine residual
drawn from the candidate to the target.

**The motion is the search.** The candidate slides around *within* the plane along a
declared path while the residual is redrawn at every instant and its length is read out
beside it. The reader is asked, before the sweep, where the residual is shortest; the
answer is withheld until the sweep reaches the foot at 20 s, where the right-angle mark
snaps on and the readout stops at `3.00`. The candidate then travels **past** that point
and the residual grows again, which is what makes the stop a minimum rather than the end
of an animation. It returns, and the scene closes on the leftover that no weights remove.

The first and last frames, side by side, are the same drawing with the candidate in two
places. They lose everything the scene is for: that the residual has a floor, that the
floor is reached exactly where the residual meets the plane at a right angle, and that
leaving that point in either direction lengthens it again. The static figure the chapter
already prints *is* the last frame; the scene earns its place only through the sweep.

The build beat carries the other half of the mechanism: the two blue column arrows scale
by their own weights and the second slides onto the head of the first, so
$\hat{\vect{y}} = w_1\matr{X}_{:1} + w_2\matr{X}_{:2}$ is assembled on the page instead of
asserted. That is why the weights are what slides the candidate: the reader sees the
cause, not just the effect.

## Fixture and provenance

The chapter owns the statement; it prints **no coordinates** for `fig-projection`, so the
geometry is a **declared computed variant**. The vectors are declared once, as data
attributes on the panel root, and the player solves everything else from them:

| panel attribute | value | what it is |
|---|---|---|
| `data-columns` | `[[2,-1,0],[0,1,-1]]` | the two feature columns $\matr{X}_{:1}, \matr{X}_{:2}$ |
| `data-target` | `[3,3,0]` | the target $\vect{y}$ |
| `data-path` | `1.9 1.9 1.9 2.4 0 0 -2.8 0 0` | the candidate's position at each beat, then at the end |
| `data-bow` | `0.18` | the in-plane curvature of the search path |
| `data-elevation` | `32` | the camera's elevation above the plane, in degrees |

Manuscript literals the panel mirrors, all verbatim in
`chapters/part1/01-linear-regression.qmd`:

| literal | lines |
|---|---|
| the normal equations $\matr{X}^\top\matr{X}\,\hat{\vect{w}} = \matr{X}^\top\vect{y}$ | 193–198 (`@eq-normal`) |
| $\hat{\vect{y}} = \matr{X}\hat{\vect{w}} = \sum_{j=1}^{d}\hat w_j\matr{X}_{:j}$ | 223–227 |
| "It must therefore live in the **column space** of $\matr{X}$. If $\vect{y}$ lies outside that space, the best prediction is its projection." | 229–230 |
| "perpendicular to the column space, so no adjustment of the weights can reduce it further." | 231–234 |
| rank deficiency and conditioning, named in the scope but not drawn | 206–215 |
| `fig-projection`, the static figure this scene follows | 249 |

### The declared computed variant, with its arithmetic

Everything here is recomputed by `scripts/test_column_space_excerpt.cjs` from the declared
attributes; no number below is typed into the player.

- **Gram matrix and right-hand side.**
  $\matr{X}^\top\matr{X} = \begin{bmatrix}5 & -1\\ -1 & 2\end{bmatrix}$ (dot products
  $(2,-1,0)\cdot(2,-1,0) = 5$, $(2,-1,0)\cdot(0,1,-1) = -1$, $(0,1,-1)\cdot(0,1,-1) = 2$)
  and $\matr{X}^\top\vect{y} = (3, 3)$ (from $6-3+0$ and $0+3+0$).
- **The weights.** $\det = 5\cdot2 - (-1)^2 = 9$, so
  $\hat{\vect{w}} = \tfrac19\begin{bmatrix}2 & 1\\ 1 & 5\end{bmatrix}(3,3) = \tfrac19(9, 18) = (1, 2)$.
  Exact integers, which is why the picture's weights settle on `× 1.00` and `× 2.00`.
- **The projection.** $\hat{\vect{y}} = 1\cdot(2,-1,0) + 2\cdot(0,1,-1) = (2, 1, -2)$.
- **The residual and its floor.** $\vect{e} = (3,3,0) - (2,1,-2) = (1, 2, 2)$, so
  $\|\vect{e}\| = \sqrt{1+4+4} = 3$ exactly — the `3.00` the readout stops at.
- **Perpendicularity is exact, not drawn.** $(2,-1,0)\cdot(1,2,2) = 2-2+0 = 0$ and
  $(0,1,-1)\cdot(1,2,2) = 0+2-2 = 0$, so $\matr{X}^\top\vect{e} = \vect{0}$.
- **Pythagoras closes.** $\|\hat{\vect{y}}\|^2 + \|\vect{e}\|^2 = 9 + 9 = 18 = \|\vect{y}\|^2$,
  so the target genuinely sticks out of the plane rather than being drawn that way.
- **The candidate's length.** A candidate at path parameter $\tau$ sits at
  $\hat{\vect{y}} + \tau\,\vect{r} - 0.18\,\tau^2\,\vect{d}$ for the camera's two in-plane
  orthonormal directions $\vect{r}, \vect{d}$, so
  $\|\vect{e}(\tau)\|^2 = 9 + \tau^2 + 0.18^2\tau^4$ — strictly increasing in $|\tau|$ and
  equal to 9 only at $\tau = 0$. The readout therefore reads `3.61` at the start,
  `4.34` at the far excursion, `3.00` at the foot, `3.98` past it, and `3.00` again.
- **No visual lie.** The *drawn* length is
  $\sqrt{\tau^2 + (3\cos\varphi + 0.18\,\tau^2\sin\varphi)^2}$, also strictly increasing in
  $|\tau|$, which is exactly why the path bows the way it does: an arbitrary path through
  the plane can shorten the drawn arrow while lengthening the true residual. The suite
  walks the whole timeline and requires the two to move in the same direction at every
  step, and both to be minimised only at the foot.
- **The camera.** One fixed axonometric projection, built from the fixture: the screen's
  horizontal direction is the in-plane direction bisecting the two columns' splay, and the
  screen's vertical tilts from the plane's unit normal by the declared 32°. Because the
  horizontal direction is perpendicular to the normal, the perpendicular residual draws
  exactly up the page — a consequence of the declared viewpoint, not a drawing choice.
- **The right-angle mark** is the drawn projection of a genuine three-dimensional square:
  equal-length legs along the plane's unit normal and along that in-plane direction, which
  are exactly orthogonal. The flat page foreshortens the square; the angle itself is exact.
- **Drawing devices, not chapter content:** the lattice of column directions, the search
  path itself, the parallelogram's extent, the labels `column 1` / `column 2` (`col 1` /
  `col 2` at phone widths), and the staggered placement of the two weight readouts.

## Timetable

Duration 40 s, beats `0 5 10 15 20 25 30 35`, shared transport, closed and paused on
open, 1.5× default.

| beat | stage | what happens | caption |
|---|---|---|---|
| 0 s | Predict | the plane, its lattice, the two columns, the target above it, one candidate inside it with its residual and length | Slide the prediction anywhere inside this plane. Where does the wine residual become shortest? |
| 5 s | One combination | the columns scale by their weights and the second slides onto the head of the first; the weights appear | Scale column one, scale column two, add them head to tail: one prediction. |
| 10 s | The search | the candidate slides away; the residual lengthens | Turn the weights and the prediction slides across the plane, dragging the residual with it. |
| 15 s | Closing in | the candidate travels to the foot, arriving exactly at 20 s | Still nothing leaves the plane, and the residual is getting shorter. |
| 20 s | Right angle | **the reveal**: the mark snaps on, the readout stops at `3.00`, the normal equations light up | Here the residual meets the plane at a right angle, and its length stops falling. |
| 25 s | Past the foot | the candidate carries on; the mark goes and the residual grows | Move the weights off that point and the residual grows again. |
| 30 s | Back to the foot | it returns, arriving exactly at 35 s | Come back, and the residual returns to the same shortest length. |
| 35 s | What is left over | the leftover is held: the target is the in-plane part plus the perpendicular part | This leftover points straight out of the plane. No weights can remove it. |

**The withheld prediction.** From 0 s to 20 s the right-angle mark is absent, and the
words *right angle*, *perpendicular*, *foot of* and *projection of* appear in no caption,
in no picture label, in the SVG's accessible name, or in the scrubber's value text. The
suite walks the timeline at 0.05 s and checks all of them. The question stands still for
its whole first beat, so the reader has five seconds to answer before anything moves.

## Reduced motion

One still per beat, with the candidate jumped to that beat's declared path position: the
suite checks that every quantity is read at `beats[stage]`, and the harness's strict
`registerBeatHoldTest` confirms exactly one drawn state per beat interval. Each still is
one its caption is true of — in particular the right-angle mark stands at beats 4, 5 and
7 (where the path parameter is zero) and nowhere else.

## Palette

Per rule 7 and visual-grammar rule 4, with the book's MathJax macro colours: blue
`#2b6cb0` for the feature columns and the lattice, orange `#c05621` for the weights
(learnable in this chapter, so orange is correct for them), green `#2f855a` for the
prediction, purple `#805ad5` for the target, wine `#722f37` for the residual, its readout
and the right-angle mark. Shape and position carry the same information without colour:
the residual is the only arrow leaving the plane, the prediction is the only filled green
mark, and the right angle is a drawn square. The scene overrides `.target-role` and
`.error-role` within its own root so the caption words match the formula.

## Teaching boundary

The panel's one visible sentence: *Three dimensions stand in for n examples and two
columns for d features: this is a schematic of the chapter's geometry, not its dataset,
and nothing is trained.* Everything else sits in the closed **Scope and caveats**
disclosure: the vectors are declared and the projection solved from them by
[the normal equations](#eq-normal) rather than fitted; the right angle is exact in that
arithmetic and only foreshortened on the page; the residual draws straight up the page
only because of the chosen viewpoint; the path is a drawing device, not an optimizer
trajectory; and the two facts the chapter names but this picture does not draw — rank
deficiency, where the projection stays unique while the weights do not, and conditioning,
where forming the normal equations squares the condition number.

## Transfer check

> **Check yourself.** Add a third feature column that is the sum of these two. Does the
> shortest residual drop below 3?
>
> No — it stays 3. The sum of two columns is already reachable, so the column space, the
> projection and the perpendicular leftover are all unchanged. What does change is the
> weights: with a dependent column they are no longer unique. The chapter calls that rank
> deficiency.

Verified by arithmetic, not by reading the final frame: the third column is
$(2,-1,0) + (0,1,-1) = (2,0,-1)$, and $(2,0,-1)\cdot(1,2,2) = 2 + 0 - 2 = 0$, so the
residual is still orthogonal to the enlarged column space and the projection and its
length are unchanged. Non-uniqueness is exhibited: $(1,2,0)$, $(0,1,1)$ and $(2,3,-1)$ all
give $\hat{\vect{y}} = (2,1,-2)$, each with $\|\vect{y} - \hat{\vect{y}}\| = 3$.

## What was deliberately not imported from the film

The film's `Projection` scene (cue 138 s) supplies composition and reveal order only: a
large centred column-space plane, named blue columns, live weights and a live gap
readout, with the normal equations arriving after the geometry. Not imported: the film's
`OUTPUT SPACE` kicker and corner chrome, its `METHOD 1` / `METHOD 2` baton cards and the
wipe between them, its `THE PRICE OF EXACT` cost card (d = 10², 10⁴, 10⁹ ⇒ d³), the
26-target column lifted out of the Loss thumbnail, its scene numbering and off-page
narration, and its bias column of ones. The film's own dataset and fitted optimum
(`w = 1.039`, `b = −0.187`) are a different example from a different plant and appear
nowhere in this panel. No 3-D engine, camera control or rotation was taken or added: the
backlog defers those, and this scene is a labelled schematic drawn through one fixed
projection.

## Source digests

| path | sha256 |
|---|---|
| `chapters/part1/01-linear-regression.qmd` | `8dd86f83455abd2e6e135282404aed8b6bfaffe67a4f690fa0505ff25cfd2498` |
| `Video_lectures/6050-Ch1-enhanced/STORYBOARD.md` | `061e5954970c22dcb4dae6a353271e3e33237d31c90b6525577c1d01bcf0e28e` |
| `Video_lectures/6050-Ch1-enhanced/lecture.jsx` | `0bb929f8b92b19fc6da96f8158edbe4734f82c4b569ecbdbb723551b93a62584` |

## Checks

`node --test scripts/test_column_space_excerpt.cjs` — 43 checks: the harness's 21
transport checks, the strict beat-hold check, the visual-grammar suite, and the scene's
own oracle, which recomputes the normal equations, the projection, the residual, the
camera and every drawn coordinate from the declared attributes and compares them against
the player's published state at 0.1 s over the whole timeline and at eight container
widths from 240 px to 713 px. It also checks the residual floor and the no-visual-lie
invariant, the withheld prediction at 0.05 s, the reveal order, reduced motion, seek and
resize determinism, label containment and label/mark collisions at 0.5 s and every width,
the wide and narrow script-free prints against a fresh render, and that an unusable
fixture — dependent columns, a target already in the plane, a short path, a degenerate
elevation — throws instead of mounting a player over the static print.
