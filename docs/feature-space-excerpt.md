# Feature space: source and acceptance receipt

**Built, not yet author-approved.** The scene is registered in
`interactives/manifest.json` and inserted immediately after `cell-fig-feature-space` in
Chapter 3, outside Plan → Code: `03-nonlinearity-mlp.html#feature-space-excerpt`. The
shared manuscript, its two static figures and all frozen evidence are unchanged; nothing
in `chapters/` was edited for it.

## One mechanism and one question

**The MLP separates two moons that no single line can split. Did its boundary bend?**

**The misconception.** Students read `fig-moons` and conclude that a neural network draws
a *curved* boundary — that "nonlinear model" means "the line bends". It does not. The last
layer is still a straight cut. What the hidden layer learns is a re-drawing of the space in
which the same points become linearly separable. The chapter says exactly this at
`chapters/part1/03-nonlinearity-mlp.qmd:464-470` — the MLP "did not learn a curved
boundary; it learned a **space in which the boundary is straight**", with the boundary at
the exact coordinate `-b/‖w‖` — and `fig-feature-space` prints the two end states side by
side so the reader can see the start and the end.

**What two frames cannot do.** They are exactly what the book already prints, and a reader
looking at them still does not see that the left panel's 400 points and the right panel's
400 points are the *same* points. Nothing in the pair tells you which mark went where, and
nothing shows that the straight line on the right is the same straight line that was
failing on the left. The motion is the only thing that establishes identity: each point is
tracked continuously from the input plane into the feature plane while the cut stands
still. **First/last-frame verdict: passes, and it is the strongest case on the list** —
the two frames are literally the book's own figure, and the scene exists only to supply
what lies between them.

**The moving object.** One cloud of 32 declared points, travelling together, past a
stationary line. Everything else is scenery. The cause of the motion is shown, not
asserted: a small gauge in the corner draws the activation itself, whose negative side
turns from the diagonal (`λ = 1`, no bend, an affine layer) to flat (`λ = 0`, the chapter's
rectifier). Ten points cross the cut, one at a time, and a wine count falls from 10 to 0.

## Why the cut is carried through as a fixed line

The brief left the choice open. The boundary is drawn as one stationary vertical line for
the whole timeline, and the picture's horizontal coordinate is the readout coordinate
`ŵ·φ_θ(x)` at every value of the bend. This is more than a presentational preference:

- The classifier is `sign(w·φ + b)`, so its boundary *is* the coordinate `-b/‖w‖` on that
  axis, at every `λ`. Drawing the axis as the readout coordinate makes the line's
  stillness a consequence of the arithmetic rather than a claim laid over it.
- The declared layer is built so that at `λ = 1` those two drawn directions reproduce the
  input plane undistorted (see below). So the opening frame is the chapter's own input
  picture, the closing frame is its feature picture, and one screen mapping and one line
  serve both. A moving line would have needed a second mapping and would have invited
  precisely the misconception the scene exists to kill.
- The reader therefore watches points move past a line, which is the sentence "the space
  moved, not the boundary" made literal.

## The fixture: what is the chapter's, and what is declared

The chapter's points, its trained `φ_θ`, and its boundary coordinate all come from a
seeded training run (`torch.manual_seed(6050)`, `moons-models` at
`03-nonlinearity-mlp.qmd:410-444`, `learned-feature-space` at `:478-495`). None of them is
printed, so none is reproduced here. What the chapter *does* print, and what this panel
mirrors verbatim, is the moon shape and the sentence:

| manuscript literal | where |
|---|---|
| `moon1 = torch.stack([torch.cos(t), torch.sin(t)], 1) + 0.12 * torch.randn(n, 2)` | `:418` |
| `moon2 = torch.stack([1 - torch.cos(t), 0.4 - torch.sin(t)], 1)` | `:419` |
| `did not learn a curved boundary; it learned a **space in which the boundary is` | `:464-465` | 
| `straight**. Its readout is still a linear model, $\vect{w}^\top \phi_\theta(x) + b$` | `:466` |
| `the exact coordinate $-b/\lVert\vect{w}\rVert$, a straight line.` | `:468-469` |
| `resid = phi - a1[:, None] * w_hat` / `resid = resid - resid.mean(0)` | `:490-491` |
| `two interleaved moons, the classic shape no line can` + newline + `separate well.` | `:400-401` |

Everything below is a **declared computed variant**, held in the panel's `data-*`
attributes and nowhere else in this repository, and recomputed by the suite.

### The cloud

`data-per-moon="16" data-radii="1.07 0.93" data-moon-offset="1 0.4"`. Point `j` of the
first moon is `r_j·(cos t_j, sin t_j)` with `t_j = jπ/15` and `r_j` alternating `1.07`,
`0.93`; the second moon is `(1, 0.4)` minus the same point — the chapter's own
parametrisation with the alternating radius standing in for its `0.12 * torch.randn`
jitter, which is seeded and unprinted. Thirty-two points, sixteen per moon. The
configuration is centrally symmetric about `(0.5, 0.2)`, which swaps the classes.

**No straight line separates them in the input plane, and this is certified, not assumed.**
The chord joining class-0 points 0 and 4 — `(1.07, 0)` to `(0.71597…, 0.795165…)` — crosses
the chord joining class-1 points 0 and 15 — `(-0.07, 0.4)` to `(1.93, 0.4)` — at
`(0.8919085…, 0.4)`, strictly inside both (parameters `0.503…` and `0.481…`). Two convex
hulls that meet cannot be separated by a hyperplane. The suite recomputes the crossing.

### The map

`data-hidden="[[1,-0.625],[4.625,2.125],[3.625,3.125],[0,-1.625]]"`,
`data-hidden-bias="1.125 -4.625 -1.5 -1.5"`, `data-readout="1 1 -1 -1"`,
`data-readout-bias="-0.5"`, `data-second-axis="0.5 -0.5 0.5 -0.5"`.

Four hidden units and a linear readout: the chapter's own architecture (`MLP`, `:388-397`)
at width four instead of sixteen, with the weights chosen by hand rather than trained.
From them the player derives, and the suite recomputes:

- `‖w‖ = 2` exactly, so `ŵ = (0.5, 0.5, -0.5, -0.5)` and the cut is
  `-b/‖w‖ = 0.5/2 = 0.25` exactly — the chapter's formula, evaluated.
- `Wᵀŵ = (1, 0)` and `Wᵀu = (0, 1)` exactly, with `u·ŵ = 0` and `‖u‖ = 1`. This is the
  scene's structural invariant and the player refuses to mount without it: with the bend
  fully open the layer is affine, and in these two drawn directions it is the identity on
  the input plane. So at `λ = 1` the drawn coordinates are `(x₁ + ŵ·c, x₂)` with
  `ŵ·c = -0.25`; the opening frame is the input plane itself, shifted a quarter unit, and
  the cut at `0.25` is the vertical line `x₁ = 0.5` — straight through the middle of the
  moons, where a straight cut fails most visibly.
- At `λ = 0` the same cut separates the classes: class 0 reaches `0.0975`, class 1 starts
  at `0.4025`, a clear channel of exactly `0.305` with the cut `0.1525` from each side.
  The suite pins both, and the channel drawn at beat 6 is that measured gap, not a
  decoration.
- **The separation is not an artefact of sampling 32 points.** Evaluated over the whole
  declared band — every radius in `[0.93, 1.07]` and every angle in `[0, π]` — the largest
  class-0 readout coordinate is `0.12385…` and the smallest class-1 coordinate is
  `0.4025`, so the same cut separates the two complete moons, not just the drawn marks.

### The bend

`φ_λ(z) = max(z, 0) + λ·min(z, 0)`, with `λ` running linearly from 1 at 10 s to 0 at 30 s.
`λ = 1` is the identity, so the two-layer stack collapses to a single linear map — the
chapter's opening equation, `@eq-collapse`, and the state its Exercise 5 asks the reader to
explain. `λ = 0` is the chapter's `torch.relu`. The intermediate values are a drawing
device for continuity, not an activation the chapter trains; each one is nonetheless a real
network whose real decision boundary is the line on screen, which is what makes "the
boundary never bends" a statement about classifiers rather than about a tween.

Because `φ_λ` is affine in `λ`, so is every drawn coordinate: **each point travels a
straight segment and crosses the stationary cut at most once**, so the wrong-side count can
only fall. Ten of the 32 points cross, at these fractions of the morph (and times):

| crossings | 0.1547 | 0.2114 | 0.2720 | 0.3436 | 0.4327 | 0.4533 | 0.5830 | 0.5879 | 0.7600 | 0.7889 |
|---|---|---|---|---|---|---|---|---|---|---|
| time (s) | 13.09 | 14.23 | 15.44 | 16.87 | 18.65 | 19.07 | 21.66 | 21.76 | 25.20 | 25.78 |

The count reads 10 while the layer is affine and 0 from `t = 25.7785…` s. That moment is
the scene's reveal: until it arrives, neither the picture, nor the SVG `aria-label`, nor
the scrubber's value text says the classes end up separated, and the suite walks the
timeline at 0.1 s to prove it.

### The vertical coordinate

`u = (0.5, -0.5, 0.5, -0.5)` is a declared direction, not a measurement. Given `W` and `ŵ`,
the requirement that the linear end be undistorted determines it up to a binary choice; this
is the solution that keeps the moons the right way up. It is centred on the cloud's own mean
at every frame, exactly as the chapter centres its residual (`resid = resid - resid.mean(0)`)
before taking a principal component, and for the same reason: it is a nuisance direction,
and the cut does not live on it. The horizontal coordinate, which the cut does live on, is
never re-centred. The chapter's second axis is the top orthogonal principal component of a
trained `φ_θ`; this one is not, and the panel says so.

## Beat timetable

Duration 40 s, beats `0 5 10 15 20 25 30 35`, shared transport, closed and paused on open,
1.5× default.

| beat | s | λ | what changes |
|---|---|---|---|
| 0 | 0 | 1 | The 32 points in the input plane, the straight cut, 10 wine rings, the count. The question. |
| 1 | 5 | 1 | The cut is named `−b/‖w‖ = 0.25`; the readout and boundary formulas appear, the boundary lit. |
| 2 | 10 | 1 → 0.75 | The bend gauge appears and starts to close; the axes are renamed from `x₁`, `x₂` to the readout coordinate and the orthogonal direction; the points move. |
| 3 | 15 | 0.75 → 0.5 | Straight paths; four points have crossed. |
| 4 | 20 | 0.5 → 0.25 | The classes pull apart; eight have crossed. |
| 5 | 25 | 0.25 → 0 | The last two cross at 25.20 s and 25.78 s; the count reaches 0 and the picture says so. |
| 6 | 30 | 0 | The clear channel is drawn, `0.305` wide, with the cut inside it. |
| 7 | 35 | 0 | Dashed grey paths recall where the ten crossers began. |

Under reduced motion each beat holds its own λ — `1, 1, 1, 0.75, 0.5, 0.25, 0, 0` — giving
wrong-side counts `10, 10, 10, 8, 4, 2, 0, 0`. Every caption is true of its own still.

## Palette

Points are values of the target `y`, so both classes are purple and differ by fill —
filled `y = 1`, hollow `y = 0` — which also carries the distinction without colour; a small
key names them. The cut is built from the learnable `w` and `b`, so it is orange, and so is
its label. Wrong-side rings and their count are error, so they are wine. The bend gauge, the
frame and the dashed paths are drawing devices in the book's emphasis ink and scenery grey.
**This differs from the film, whose feature-space boundary is green**; green is reserved for
predictions here, and the boundary is a parameter object.

## Teaching boundary

Visible: *the cloud and the map are declared schematics — four fixed hidden units evaluated
at a bend that opens, not a replay of the chapter's trained sixteen-unit network.* In the
closed scope: nothing is trained and no accuracy is claimed (the chapter's "about 90%"
belongs to its own seeded run); the intermediate bends are a drawing device; the vertical
axis is a declared direction, centred, not the chapter's measured principal component; **a
straight cut in this feature space is a bent, piecewise-linear boundary back in the input
plane — kinked wherever a hidden unit switches on or off, which is exactly the chapter's own
dashed contour and exactly the point**; and the two classes' convex hulls overlap in the
input plane, so the opening failure is not a badly placed line.

## Transfer check

> **Check yourself.** Double every readout weight and the readout bias together, leaving the
> hidden layer alone. Does the cut move? Does the picture?
>
> Neither moves. The drawn coordinate is `ŵ·φ`, and `ŵ = w/‖w‖` is unchanged by scaling; the
> cut is `-b/‖w‖ = 1/4 = 0.25`, exactly what `0.5/2` already gave. Doubling the readout
> doubles every score and changes no decision.

Arithmetic: `‖(1,1,-1,-1)‖ = √4 = 2` and `-(-0.5)/2 = 0.25`; `‖(2,2,-2,-2)‖ = √16 = 4` and
`-(-1)/4 = 0.25`; `(2,2,-2,-2)/4 = (0.5,0.5,-0.5,-0.5) = (1,1,-1,-1)/2`. The suite
recomputes both cuts from the declared attributes.

## What was deliberately not imported from the film

The film's Feature scene (storyboard §3.6, scene 8) supplied composition and reveal order
only: the same marks travelling from the input picture into the feature picture keeping
their fill and shape, and the boundary stated as an exact readout coordinate. Left behind:

- its **two-board composition** and the flight between boards — this scene is one picture
  with one fixed mapping, so the reader never has to believe two panels hold the same points;
- its **arcs and staggered flight**; the points here travel straight, because in this
  family the drawn coordinates really are affine in the bend;
- its **trained numbers** — 240 marks, the boundary readout `−0.083`, the accuracies
  `0.9042` and `1.000` — all from a seeded run and none of them reproduced;
- its **green boundary**, its chips, headers, series glyphs and off-page narration;
- its **input-plane `a₁` shading with the kinked orange contour**, which is a second
  picture; that fact is stated in the scope instead;
- its **terrain lens** (the 3-D surface from t=22.5), which the author's brief deferred and
  which adds nothing the morph does not already carry;
- the **loss-curve race** between the linear model and the MLP (film scene 7), a results
  plot the backlog rejects.

## Acceptance contract

Deferred local SVG/JavaScript player on the shared transport, closed and paused initially,
1.5× default, arrow keys on the declared beats, reduced motion holding one still per beat,
full transcript, generated wide and narrow script-free prints. No new dependency, no video,
no animation engine, no second control: the timeline is the only thing the reader drives.

`scripts/test_feature_space_excerpt.cjs` rebuilds the cloud, the layer and every drawn
coordinate from the panel's own attributes and checks: the exact cut, the undistorted linear
end, the non-separability certificate, the 10 → 0 count and the `0.305` channel, affinity in
λ and the monotone count, every drawn point against the oracle at both layouts, the cut's
stillness and verticality at eight widths, reveal order, the withheld answer at 0.1 s steps,
reduced-motion stills, seek-and-resize determinism, label containment and collisions at
eight widths and 41 times, the gauge's reserved corner, five refused fixtures, and static
parity for both prints. **43/43 pass** (16 scene checks, 21 transport, 1 beat-hold, 6
grammar). Frames were inspected at 1280 and 375 pixels, with and without reduced motion,
and script-free at both widths.

At narrow widths the picture drops the bend gauge rather than printing its label over the
points: the moons reach into every corner there, and the bend is still named by the formula
line, which every width carries.

## Sources

| path | sha256 |
|---|---|
| `chapters/part1/03-nonlinearity-mlp.qmd` | `1ee61d4460c65d8f89205620408d42212ae602411b74d42e9bcf9d90877d4b1e` |
| `6050-Ch3/STORYBOARD.md` | `065d2f5e9054d0581b9909b52654fafce446352caa94724b4752f4a620aeee84` |
