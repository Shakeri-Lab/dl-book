# Detach passes the value, not the gradient; reset passes neither: `detach-cut-excerpt`

**Author-approved, September 29, 2026.** After reviewing the build and the revisions recorded below, the author asked to "commit and push".

An optional, HTML-only mechanism excerpt for Chapter 10, *Sequences and Recurrence*,
`before-heading` "Engineering a memory: the LSTM". It closes the H3 "Training with a finite
horizon": the panel sits after the paragraph on fixed-window training, which ends "neither
creates gradients beyond the truncation horizon.", and before the LSTM heading, which
occurs once, after `### Training with a finite horizon` and before
`## GRU: the streamlined cousin`. The PDF is untouched: `filters/mechanism-excerpts.lua`
returns `{}` for any non-HTML format on its first executable line.

It is the chapter's first panel in reading order. `lstm-valves-excerpt` (after the
`fig-lstm-conveyor` cell) and `gate-product-excerpt` (after `fig-highway-time`) follow it
inside the LSTM section, and `gru-blend-excerpt`, built alongside it, in the GRU section.
This panel reuses the LSTM panels' marks for the same objects: every
carried value blue, fixed operators ink, a gradient travelling back in time wine, as
`one-chain-excerpt` draws its backward rays.

## Who asked

The author scoped this scene among four on September 28, 2026 and asked for all four to be
built.

## The question, and the misconception it targets

> Two lanes train on the same six-step stream, cut into chunks of three. One carries the
> state across the cut, detached; the other resets it to zero. What crosses the cut in
> each lane: the value going forward, the gradient coming back, both, or neither?

The chapter states the answer in one sentence, "The values cross the boundary; the gradient
graph does not.", and then contrasts truncated BPTT with the fixed-window recipe its final
experiment uses. Two misreadings survive that sentence:

- **Seeing is learning.** If step 6's state depends on step 2's input, the gradient of
  step 6's loss must be able to reach step 2 as well. It cannot: the value arrives through
  a detached state, and a detached state carries no graph back.
- **Detaching is resetting.** `h = h.detach()` looks like it throws the state away. It
  does not: the numbers cross the cut unchanged, so the model keeps its running context;
  only the gradient path is removed. Resetting to zero removes both.

## What moves, and why two frames could not do it

One picture: two lanes, one above the other, each a chain of six states h1 to h6 with an
input tick x1 to x6 under each, and one dashed ink cut crossing both lanes between steps 3
and 4. In the upper lane ("carry, detached") the arrow from h3 to h4 passes through an ink
"detach" tag on the cut; in the lower lane ("reset to zero") h3's arrow ends at the cut and
h4 is fed by an ink "0" start box.

The tracked object is a round trip. First the value, a round blue packet standing for
step 2's contribution to the state, climbs x2 into h2 and rides to h3 in both lanes; the
two lanes' copies share one position, so they are the same value seen twice. At the reveal
the carry copy passes through the detach tag and rides on to h6, shading each state it
reaches, while the reset copy halts against the cut and fades to a dashed ring, and step 4
starts from the zero box. Then the loss L6 appears, and its gradient, a pointed wine packet,
runs back along a rail under the states, through steps 6, 5 and 4 in both lanes, and stops
at the cut against a short ink bar. The value and the gradient never move at once.

Two frames, the empty lanes and the final picture, show where each path ends. They lose the
order that makes the misconception visible: the value arrives at step 6 first, and only
then does step 6's loss send a gradient back along the same steps, which halts one cut
short of the step the value came from. They also lose the proof that the cut is the only
difference between the lanes: the two copies of the value move as one until the reset lane
stops its copy.

## The fixture

| attribute | value | what it mirrors |
|---|---|---|
| `data-steps` | 6 | declared: the stream's length, two whole chunks |
| `data-chunk` | 3 | declared: the chunk length, so the one cut falls after step 3 |
| `data-source` | 2 | declared: the step whose contribution to the state the value packet carries |
| `data-loss` | 6 | declared: the step whose loss sends the gradient back |
| `data-evidence-class` | `schematic` | no measurement is drawn |

The player derives the cut, the value's endpoints and the gradient's endpoints from these
four attributes, and the suite recomputes them from the same attributes. None is a chapter
number. The manifest literals bind the chapter sentences the schematic illustrates: the
truncated-BPTT recipe ("contiguous chunks carry the recurrent state forward but detach it
at each boundary. The values cross the boundary; the gradient graph does not."), the
fixed-window recipe that samples 100-character windows and starts each from zero state,
the sentence that neither recipe creates gradients beyond the truncation horizon, and the
recurrence `\vect{h}_t = f(\vect{h}_{t-1}, \vect{x}_t)`, which the formula line writes at
the first step after the cut.

### Declared computed variants

| quantity | how it is derived | value |
|---|---|---|
| the cut | after every `data-chunk` steps, below `data-steps` | after step 3 |
| the value's path | up the tick of step `data-source`, then along the states; carry: through every cut to the last step; reset: to the first cut | x2, h2, h3, then h4 to h6 (carry) or a halt at the cut (reset) |
| the gradient's path | from the loss back to the first step of the loss's chunk, ⌊(6 − 1) / 3⌋ × 3 + 1 | steps 6, 5 and 4, stopped at the cut in both lanes |
| the formula | the chapter's recurrence at the first step after the cut | h4 = f(detach(h3), x4) and h4 = f(0, x4) |
| the transfer check | cuts every three steps for nine steps | cuts after 3, 6 and 9; step 9's chunk starts at 7 |

These are the manifest's four `computedVariants`: the declared schematic (six steps in two
chunks of three, drawn as two lanes, where the chapter's recipes cut every 20 to 50 steps
or sample 100-character windows, and no number from either recipe is drawn); the two
packets and where each lane stops them; the check's arithmetic; and the eight five-second
beats, with no control.

## Beats

Duration 40 s, beats `0 5 10 15 20 25 30 35`. Every moving beat glides in its first half
and holds its second, so each reveal stands still for 2.5 s.

| beat | s | what happens |
|---|---|---|
| 0 | 0 to 5 | both lanes, the cut, the detach tag and the zero box; step 2's input marked; nothing moves (ask 1) |
| 1 | 5 to 10 | the value climbs x2 into h2 and rides to h3 in both lanes (5 to 7.5 s), then holds |
| 2 | 10 to 15 | reveal 1: carry, the value crosses through the detach tag to h6; reset, it halts at the cut and fades to a ring, and step 4 starts from the zero box; the formula lights both lanes |
| 3 | 15 to 20 | the loss L6 appears in both lanes; still (ask 2) |
| 4 | 20 to 25 | reveal 2: the gradient runs back through steps 6, 5 and 4 in both lanes (20 to 22.5 s) and stops at the cut against a short ink bar |
| 5 | 25 to 30 | verdicts on the cut: carry, "value crosses" and "gradient stops"; reset, "value stops" and "gradient stops" |
| 6 | 30 to 35 | the reset lane dims: step 6 uses step 2's value, yet its gradient stops at the cut |
| 7 | 35 to 40 | the final frame, both formula parts lit, the chapter's sentence |

The captions, at most 20 words each:

0. Two lanes, one stream, cut after step 3. What crosses the cut in each lane?
1. Step 2's input enters the state and rides to step 3 in both lanes.
2. Carry: the value crosses and reaches step 6. Reset: step 4 starts again from zero.
3. Step 6's loss sends its gradient back. How far does it travel in each lane?
4. The gradient runs back through steps 6, 5 and 4, then stops at the cut.
5. Detach passes the value but not the gradient. Reset passes neither.
6. Step 6 uses step 2's value, yet its loss cannot teach the model to keep it.
7. The values cross the boundary; the gradient graph does not.

Both predictions are withheld. From 0 to 10 s no value packet, trail or shaded state lies
beyond the cut in either lane, no verdict is drawn, and neither the picture's `aria-label`
nor the scrubber's value text says what crosses. From 15 to 20 s no gradient packet, trail
or stop bar exists, no verdict is drawn, and neither text mentions the gradient. The suite
checks both windows from the DOM at 0.1 s steps, with and without reduced motion.

Reduced motion holds each beat's finished state: the value at h3 in beat 1, at h6 and at
the cut in beat 2, the gradient against the stop bar in beat 4. No control: the mechanism
is a structural difference between two recipes, not one parameter's effect.

## Palette

Blue is the carried value: its packet, its path, the marked input x2, the states it has
reached and its verdicts, matching every carried value in `lstm-valves-excerpt` and the
\featurepart macro in the formula. Wine is the loss and its gradient: the L6 box, the
pointed packet, its rail and its verdicts, as in `one-chain-excerpt` and
`gate-product-excerpt`. Ink is the cut, the detach tag, the zero start and the stop bar,
the design choices, washed in the formula line while each lane acts. The cells are grey.
Shape and text repeat every distinction: round packet on the line of states against
pointed packet on the rail beneath, and each verdict names its packet. The chapter's own
figures draw the hidden state in the house orange (the unrolled RNN's state arrows, the
LSTM conveyor's highway); this panel follows the book palette, which keeps orange for a
learnable parameter.

## Teaching boundary

> Inside a chunk the gradient still flows back and still trains the shared weights; the
> cut removes only the paths that cross it.

The scope disclosure adds, in four short paragraphs: that six steps and one cut after the
third are a schematic, while the chapter's recipes carry and detach state across chunks of
roughly 20 to 50 steps or sample 100-character windows that start from zero state; that in
code the carry lane is `h = h.detach()` between chunks and the reset lane starts each
window from a zero state; that cutting at random points and dividing each surviving term by its
survival probability, the unbiased alternative the chapter mentions, is not drawn, and that clipping is a separate tool that
moves no cut; and the palette key, with shape and text carrying the same distinctions.

Deliberately left out: the gradients that flow from each loss into the inputs and the
shared weights inside a chunk (the boundary sentence states them instead of drawing a
second network); the memory test and its recall numbers; the claim, which the chapter
makes, that a fixed horizon biases training toward short-range structure; and anything
Exercise 4 asks about a learned start state, since the reset lane's zero is the chapter's
own zero start and the panel says nothing about where a learned start's gradient comes
from. No exercise covers truncation, so the panel answers none.

## The transfer check

> Check yourself. Chunks of three steps, carried and detached, run for nine steps. The loss
> at step 9 depends on steps 5 and 7. Which of the two can its gradient reach?

Step 7, yes; step 5, no. The cuts fall after steps 3, 6 and 9, so steps 7, 8 and 9 share one
chunk and the gradient of step 9's loss stops at the cut after step 6. Step 5's value still
reaches step 9 through the carried state. The picture never shows a nine-step stream or a
dependence that skips a whole chunk, so the reader has to apply the rule, not read the
final frame. `scripts/test_excerpt_checks.cjs` recomputes the cuts and the chunk start from
the panel's declared `data-chunk` and `data-steps`.

## What was imported from the film, and what was not

The Chapter 10 lecture film's FiniteHorizon scene (218 to 262 s; `SFiniteHorizon` in
`6050-Ch10/lecture.jsx`, and its storyboard row) supplied the composition and the reveal
order: two lanes, carried-and-detached state above fixed windows that reset below, one
boundary crossing both lanes, and the caption intent, "carry the state value across the
boundary, detach the graph" and "the value crosses only in the first lane; the gradient
crosses in neither" (captions read from
`transcripts/12-sequences-and-recurrence.timeline.json`). Not imported: the film's purple
boundary and red detach mark (the cut and the tag are ink here, the book's colour for a
design choice), its contract cards and code card, its ten-cell and four-cell counts, its
narration and its section kicker. The film's lanes are static and show no moving value or
gradient, so both packets, the rail, the stop bar, the zero box's feed and the verdicts
are this panel's own.

## Revisions after the author's first look (September 29, 2026)

The author proposed a one-way gate at the cut, a distinct backward track, a visible stop of
the gradient that leaves steps 1 to 3 untouched, and colour-coded tokens blending into the
states. Taken:

- Every state the gradient reaches wears a wine ring as the gradient passes it: steps 6, 5
  and 4 in both lanes, never steps 1 to 3. The carry lane's step 2 and step 3 therefore hold
  the value (shaded blue) and carry no ring: the value was seen and nothing was learned.
- From the verdict beat (25 s) on, the carry lane's detach tag gains a forward point, so
  the tag and the stop bar beneath it read as one one-way gate. It appears only after both
  reveals: drawn from the start, a one-way gate would answer both of the scene's
  predictions before the reader makes them.

Already present, unchanged: the gradient runs on its own rail under the states, pointing
back, and stops against a bar at the cut. Not taken: distinct pastel tints per token
(yellow, teal, purple). The book's palette reserves purple for targets and has no hues for
token identity, and colour may not be the only carrier; the blue shading already marks the
states that hold step 2's value, and the reset lane's step 4 restarts from the zero box,
unshaded.

## Source digests

Lecture paths are relative to the lecture repository root.

| Source | SHA-256 |
|---|---|
| `chapters/part3/10-sequences-rnn.qmd` | `644efb97a2cc177b0bb6553e93529e4f74480763bac5eec66925fd91a4987137` |
| `6050-Ch10/lecture.jsx` | `3a2cabb00546067f5c3c0a3715c043ac96ec4f09faa298815428089689a22350` |
| `6050-Ch10/STORYBOARD.md` | `23204f3ef89ad845ee07ec11c6e618154391908294429381798f7c20de888902` |
