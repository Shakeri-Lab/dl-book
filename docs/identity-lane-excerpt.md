# The shortcut adds a lane; it does not guarantee a gradient: `identity-lane-excerpt`

**Author-approved, September 29, 2026.** After reviewing the build, the author kept its one open choice as built ("defaults") and asked to "commit and push".

An optional, HTML-only mechanism excerpt for Chapter 10 (`chapters/part2/09-modern-cnns-transfer.qmd`;
file prefix 09, the number older receipts use), "Question 2: going deeper, and the wall you
hit". It is anchored `after-cell` on `cell-fig-residual-stream`: right after the residual-block
figure and before the paragraph "Read the right-hand side with ... eyes", so the prose's "It is
not magical" caveat comes after the panel's prediction, not before it. The PDF is untouched:
`filters/mechanism-excerpts.lua` returns `{}` for any non-HTML format on its first executable
line.

The author asked on September 28, 2026 for replays from the Advanced CNN chapter; this scene
was scoped then, and on September 29 the author asked for it to be built ("make them"). In
document order it is the last of the chapter's four panels, after `stacked-sight-excerpt`,
`batch-ruler-excerpt` (built alongside it) and `pixel-skewer-excerpt`; it shares no object
with them and no anchor.

## The question, and the misconception it targets

> A block's learned branch has local slope −0.9, and the shortcut adds the identity. How much
> of a gradient of 1 arriving at the block's output reaches its input: all of it, 1.9, or 0.1?

The residual equation's gradient line, ∂L/∂x = ∂L/∂H (∂F/∂x + I), invites two misreadings.
One takes the "+ I" as a guarantee: the identity lane carries the gradient through, so all of
it arrives. The other adds magnitudes: 1 from the lane and 0.9 from the branch make 1.9. The
chapter's own caveat, placed right after the panel, is the answer: "the learned Jacobian can
still reinforce, distort, or even partly cancel that term". In one dimension the bracket is 1
plus the slope, so a slope of −0.9 leaves 0.1.

## What moves, and why two frames could not do it

One picture: the block laid left to right as the chapter's figure lays it, x, the learned
branch F (a box outlined in orange, since it holds the learned weights), the sum and H(x), with
the identity lane arcing from x over F to the sum. The one tracked object is the gradient, a
wine arrow whose length is its value on one shared scale (60 drawing units per unit wide, 30
narrow) and whose direction is its sign: a positive copy points along its route toward x, a
negative one back toward the output. It arrives at H(x) as 1 and splits at the sum into two
copies, the same gradient seen twice. The lane's copy rides back unchanged; the other crosses
F, slowing while the branch rescales it: it shrinks, vanishes at slope 0, and at a negative
slope shrinks through nothing and grows back pointing the other way. Under x the copies are
laid head to tail on a short scale, the lane's copy from the origin, the other from the lane's
head, and what reaches x is drawn on the scale as the length they leave: 1.5, 1, 0.1.

Two stills, a long arrow at the output and a stub under x, show that most of the gradient was
lost and lose the reason: the flip inside F, against a lane copy that never changed. The motion
carries both, and the dial then shows that every slope simply adds to the lane's 1.

## The fixture

| attribute | value | what it mirrors |
|---|---|---|
| `data-incoming` | 1 | declared: the gradient ∂L/∂H arriving at H(x), one unit |
| `data-slopes` | 0.5, 0, −0.9 | declared: the branch's local slope ∂F/∂x at the timeline's three stops, the chapter's "reinforce" and "partly cancel", and 0 its "to represent: $F = 0$." |
| `data-range` | −1 to 1 | declared: the dial's range |
| `data-evidence-class` | `declared-toy` | the chapter prints no Jacobian |

The chapter literals bound in the manifest are the one-change sentence ("The one change is
that each block computes $F(x)$ and outputs $F(x) + x$."), `H(x) = F(x) + x`, the gradient line of the
residual equation, the two sentences of the "not magical" caveat, and "to represent: $F = 0$."
The panel's formula is the chapter's gradient line with its two bracketed terms wrapped in
`\class{il-branch}` and `\class{il-lane}`; the suite strips the wrappers and finds the chapter's
line.

### The illustrative toy

The chapter measures gradients at the stem of whole networks and prints no Jacobian, so the
numbers are a declared toy in one dimension, where the identity I is 1 and the branch's
Jacobian is a single number, its local slope. The incoming gradient is one unit so that every
copy's length reads directly as a multiple of it. The three stops follow the chapter's own
words: 0.5 reinforces the lane, 0 is F doing nothing, and −0.9 cancels most of it while leaving
a remainder, 0.1, large enough to see; the sweep then shows the exact cancellation at −1 as an
open ring. The dial moves in steps of 0.05, and the timeline's glides use the same grid, so
every value shown is one the reader could set.

### Declared computed variants

| quantity | value |
|---|---|
| the copy through F, 1 × slope | 0.5, 0 and −0.9 at the three stops |
| what reaches x, 1 × (slope + 1) | 1.5 at 0.5, 1 at 0, 0.1 at −0.9, 0 at −1; on the dial, anything from 0 to 2 |
| the question's wrong answers | all of it (1, the identity alone) and 1.9 (the magnitudes 1 and 0.9 added) |
| the transfer check | (1 + 0.5)(1 − 0.5) = 0.75 with shortcuts; 0.5 × (−0.5) = −0.25 without |

The manifest's computed variants state the first, second and fourth rows. The question's 1.9,
the magnitudes 1 and 0.9 added, is not yet among them; naming it there is a manifest change,
left to the manifest's owner.

## Beats

Duration 40 s, beats `0 5 10 15 20 25 30 35`.

| beat | s | what happens |
|---|---|---|
| 0 | 0–5 | the block, forward: x flows along both routes to the sum, which gives H(x) |
| 1 | 5–10 | a gradient of 1 arrives at H(x), reaches the sum and splits; one copy of 1 waits at each route's entrance |
| 2 | 10–15 | both copies travel back; the lane's keeps 1, the one through F scales to 0.5; laid head to tail under x, 1.5 is stated at 12.5 s, once they have arrived |
| 3 | 15–20 | the slope glides to 0 in 1.4 s: the copy through F shrinks to an open ring, and exactly 1 reaches x |
| 4 | 20–25 | the question: the slope is set at once to −0.9 (on F and on the dial); a gradient of 1 sits at H(x); nothing moves, and neither the copy through F nor anything under x is drawn |
| 5 | 25–30 | the reveal: the gradient splits again, the copy through F flips to −0.9, and head to tail with the lane's 1 it leaves 0.1, stated at 27.7 s |
| 6 | 30–35 | the dial sweeps −0.9 → 0.5 → −1 and rests at −1 from 33.5 s; what reaches x follows 1 plus the slope, 1.5 at 0.5 and 0 at −1 |
| 7 | 35–40 | the slope glides home to −0.9 (35 to 35.6 s); the final frame: copies 1 and −0.9, 0.1 reaching x; a route, not a guarantee |

The withholding runs from 20 s until 25 s: no copy under x, no "reaches x", no 0.1 or 1.9 on the
picture, in the picture's description, in the scrubber's value text or in the dial's, which
names only its slope at every moment. Each beat with a value to state says it in a second
caption only once the copies have arrived, and each stated value holds for at least two seconds
(2.5 s and 2.3 s). Reduced motion holds each beat's finished state: the block; the copies
waiting; 1.5 under x; 1 under x; the question; 0.1 under x; the sweep's end at −1, where nothing
reaches x; the final frame.

The dial is the scene's one parameter control (rule 1's amendment), the branch's local slope:
the timeline drives it; dragging pauses playback and draws the finished picture at the dragged
slope, with a caption that says what reaches x (the dial itself never does); any timeline
action (play from a pause, a scrub, an arrow-key beat) returns to the timeline's own slope; and
its keys never reach the pane's beat seeking. It is inert and hidden until the player mounts.

## Palette

Wine is the gradient and its copies, and every number they carry. Orange is the learned
branch's weights and nothing else: only the outline of F wears it. Ink is the identity lane,
the sum, the slope written on F, the dial and the head-to-tail ties; blue is x and H(x), and the
forward pass in the first beat; the wires and the scale are grey. The formula washes, in ink,
the term each copy is travelling through, and only the branch's term while its slope moves.
The chapter's matplotlib figure, redrawn at the author's request, now draws the identity path
and the sum in ink as well; both follow the book palette and keep orange for the learned weights.

## Teaching boundary

> One number stands in for each Jacobian here; with matrices the learned term can also rotate
> the identity term, which a single dimension cannot show.

The closed "Scope and caveats" adds that the block and its numbers are a declared toy (the
chapter measures stem gradients over whole networks and prints no Jacobian); that the
chapter's block applies a ReLU after the sum, which the equation and this picture leave out;
that a stack multiplies these per-block factors, so many blocks keep a gradient near its size
only while their learned slopes stay small, and that the chapter's measurement, residual
gradients within one order of magnitude, is of whole networks rather than of any one factor
drawn here; the key to the arrows, the rings and the colours; and that the chapter's figure,
like this panel, draws the identity path in ink.

Deliberately left out: the depth sweep of stem gradients (the `fig-gradient-highway` chart, its
depth-48 values and the float32 note), the plain-versus-residual training experiment and its
accuracies, and the rotated case, which needs two dimensions. None of the chapter's exercises
concerns residual gradients, so the panel answers none of them.

## The transfer check

> Two residual blocks in a row have learned slopes 0.5 and then −0.5. What reaches the first
> block's input from a gradient of 1 at the output, and what would the same blocks pass without
> shortcuts?

0.75: each block multiplies what arrives by 1 plus its own slope, 1.5 × 0.5 = 0.75; without
shortcuts each passes only its slope, 0.5 × (−0.5) = −0.25, a quarter of the gradient with its
sign flipped. It chains two blocks, which the picture never does, and asks what the same
blocks would pass without their lanes. `scripts/test_excerpt_checks.cjs` reads the first slope from the
panel's `data-slopes`, negates it for the second block, and recomputes both products.

## What was imported from the film, and what was not

The chapter's lecture film (`6050-Ch9`, scene `ResidualHighway`, 312 to 374 s; `ResidualDiagram`,
`JacobianCase` and `SResidualHighway` in `lecture.jsx` lines 1629 to 1826; the storyboard's
scene-map row 8; the captions in `transcripts/10-modern-cnns-and-transfer-learning.timeline.json`)
supplied the order: the forward split first, then the backward split. It also supplied the
intent of two captions, "backward, the identity term is a one — can the learned branch still
hurt it?" and "reinforced · rotated · mostly cancelled — help, not a guarantee", which the
panel says in its own words.

Not imported: the film's gold lane and red gradient, its two-dimensional Jacobian cases and
their numbers (1.75, 1.65, 0.12), the depth-48 chart and its verdict cards (a results plot),
its readouts, cards, narration and framework. The film's moving objects are vectors in the
plane; here the moving object is the gradient packet, split at the sum and laid back together
under x, and the head-to-tail scale, the flip inside F and the slope dial are this panel's own.

## The author's decision (September 29, 2026)

The build left one choice open, and the author kept the default ("defaults"): the dial's
value text names only its slope ("slope −0.90"), never what reaches x, so that it cannot
announce the answer while the question stands. While the dial is dragged, the caption says
what reaches x instead.

## Source digests

Lecture paths are relative to the lecture repository root.

| Source | SHA-256 |
|---|---|
| `chapters/part2/09-modern-cnns-transfer.qmd` | `93439d38a1eed9ad7910dc42d6ed010bb4f14c3b2616bcfa439689ca1fec72eb` |
| `6050-Ch9/lecture.jsx` | `446a5c3f889149b46f5fe275c37414d3240bb1b4dc27b347e9212d9f0527402a` |
| `6050-Ch9/STORYBOARD.md` | `ebe6a9b53bd79c911bb967e84538a8c2a261d3db4db439313de291fc78f2ee5e` |
