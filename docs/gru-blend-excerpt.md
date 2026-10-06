# The GRU's keep gate blends the old state with the candidate: `gru-blend-excerpt`

**Author-approved, September 29, 2026.** After reviewing the build and the revisions recorded below, the author asked to "commit and push".

An optional, HTML-only mechanism excerpt for Chapter 10's "GRU: the streamlined cousin",
inserted after the `cell-fig-gru-cell` cell: right under the GRU diagram and before "One
convention matters before you compare code." The PDF is untouched:
`filters/mechanism-excerpts.lua` returns `{}` for any non-HTML format on its first
executable line.

The author scoped this scene among four on September 28, 2026 (with `detach-cut`,
`decoder-family` and `flat-line`) and asked for all four to be built.

## The question, and the misconception it targets

> One coordinate of the state holds 0.80, and the candidate offers 0.30. With the keep gate
> fully open, the new state stays at 0.80. Halve the keep to 0.5: where does the new state
> land?

The misreading is to take the update gate for a forget gate alone: halve the keep, halve the
state, 0.40. In the GRU what is not kept is written by the candidate ("what you keep you do
not overwrite, and vice versa"), so the new state is 0.5 × 0.80 + 0.5 × 0.30 = 0.55, the
midpoint; for any keep it lies on the segment between the old state and the candidate,
because the two shares fill one whole.

## What moves, and why two frames could not do it

One picture: a number line over tanh's range, −1 to 1, with the old state h<sub>t−1</sub> as a
filled circle at 0.80 and the candidate h̃<sub>t</sub> as a hollow diamond at 0.30; above it one
bar split into the keep share z and the write share 1 − z. The tracked object is the new state
h<sub>t</sub>, a ring riding just under the line: at full keep it sits under the old state.
While the caption asks, the ring is gone. The reveal then builds it head to tail from 0: the
old state appears as an arrow from 0 to 0.80 and shrinks to its kept share, 0.40; the
candidate appears as a hollow arrow from 0 to 0.30, one row down, shrinks to its written share,
0.15, slides along its row and rises onto the kept arrow's tip; the ring lands at that tip,
0.55. The segment from 0.30 to 0.80 is marked, and the dial sweeps to full keep and to closed:
the kept arrow grows as the written one shrinks, and the ring slides along the segment without
ever leaving it.

The first and last frames, the ring on the old state at full keep and the ring at 0.55 at half
keep, show two answers. They lose the trade the motion carries: the keep's loss is the write's
gain on one dial, the candidate's share is added at the kept share's tip, and every keep lands
on the same segment. The reader can drag the dial to any keep.

## The fixture

| attribute | value | what it mirrors |
|---|---|---|
| `data-old` | 0.8 | declared toy: one coordinate of the old state, a round value inside tanh's range |
| `data-candidate` | 0.3 | declared toy: the same coordinate of the candidate, which tanh keeps "bounded and centered" |
| `data-keep` | 0.5 | the question's keep: the fully open gate halved |
| `data-range` | `-1 1` | tanh's range, which is also the drawn line |
| `data-evidence-class` | declared-toy | the chapter trains its gates and prints no state values |

The chapter literals the manifest binds are the update-gate clause ("valves merged into a
single **update gate** $\vect{z}_t$ (what you keep you do not"), the interpolation line of
`@eq-gru`, the two sentences of the keep convention ("This follows Cho et al.'s original
convention: $\vect{z}_t$ weights the old" and "state, so it reads as **keep**."), the opening of
`fig-gru-cell`'s caption, and "content is shaped by $\tanh$, keeping it bounded and centered."
The suite also checks that the panel's formula, with its colour wrappers and `\class` handles
taken off, is the chapter's interpolation line verbatim.

### The illustrative toy

The chapter trains its GRUs and prints no hidden-state values, so the old state and the
candidate are made up: round numbers strictly inside tanh's range, far enough apart that the
segment between them spans 66 px on a phone, with the kept and written shares at half keep
(0.40 and 0.15) exact in hundredths. The panel's `data-evidence-class` is `declared-toy` and its
boundary says the values are illustrative. The lecture film shows no state values, so none come
from it.

### Declared computed variants

| quantity | value |
|---|---|
| kept share at keep 0.5 | 0.5 × 0.80 = 0.40 |
| written share at keep 0.5 | 0.5 × 0.30 = 0.15 |
| new state at keep 0.5 | 0.40 + 0.15 = 0.55, the midpoint of 0.30 and 0.80 |
| full keep, closed | 0.80, 0.30 |
| any keep z on the dial | z × 0.80 + (1 − z) × 0.30 = 0.30 + 0.50 z, on the segment |

During the sweep and on the dial, every printed value is in hundredths: z rounded once, each
share rounded once from it, and the new state printed as their sum, so the numbers a reader
adds always agree; the ring itself is drawn at the unrounded blend, at most 0.01 away. The
suite recomputes all of it from the panel's attributes at every tenth of a second.

## Beats

Duration 40 s, beats `0 5 10 15 20 25 30 35`.

| beat | s | what happens |
|---|---|---|
| 0 | 0–5 | keep fully open: the bar all keep; the ring sits under the old state at 0.80 |
| 1 | 5–10 | the ask: the dial takes keep 0.5 and the bar's split glides to half (5 to 6.5 s), then holds 3.5 s; the ring and every new-state value are withheld |
| 2 | 10–15 | the old state as an arrow from 0 to 0.80 shrinks to its kept share (10.6 to 11.8 s), labelled 0.5 × 0.80 = 0.40 |
| 3 | 15–20 | the candidate as a hollow arrow from 0 to 0.30 shrinks to 0.15 (15.4 to 16.2 s), slides along its row, rises onto the kept arrow's tip (17.2 s); the ring lands at 0.55, and 0.5 × 0.30 = 0.15 is labelled. The caption names the written share first and says 0.55 only once the ring has landed |
| 4 | 20–25 | the segment from 0.30 to 0.80 is marked; the ring sits at its midpoint |
| 5 | 25–30 | the dial sweeps to full keep (25 to 27.5 s): the kept arrow grows to 0.80, the written one shrinks to a stub, the ring slides to 0.80 |
| 6 | 30–35 | the dial sweeps to closed (30 to 33 s): the ring slides the whole segment to 0.30 |
| 7 | 35–40 | home at keep 0.5 (35 to 37 s); the final frame carries 0.80, 0.30, 0.55, 0.40 and 0.15 |

Reduced motion holds each beat's finished state. The keep z is the scene's one parameter
control (rule 1's amendment): a real range from 0 to 1 in steps of 0.01 with ticks at 0, 0.5
and 1, a live readout "keep 0.50 · write 0.50", the name "Keep gate z", and a value text of
the form "keep 0.50, write 0.50" that names the gate's two shares and never the new state. The
timeline sweeps it; dragging pauses playback and redraws the finished picture at the dragged
keep, with the caption stating where the new state lands; any timeline action returns to the
timeline's own keep; its keys never reach the pane's beat seeking. At the ask the control takes
the halved keep at once and only the picture's bar glides there, so no keep between 1 and 0.5
is printed or spoken while the reader predicts: a continuous readout would have passed through
"keep 0.55", the answer's digits, and the suite now rules that out.

## Palette

Every value the cell carries is the book's `\featurepart` blue, told apart by shape: a filled
circle for the old state, a hollow diamond for the candidate, a ring for the new state, and
arrows filled or hollow like the mark each share comes from. The gate's bar, the dial and the
formula's washes (on `z_t` while the keep acts, on `1 − z_t` while the write acts) are the
emphasis ink: the keep is a gate the network computes, neither a carried value nor a parameter
the reader learns, the choice `lstm-valves` makes in the same chapter (carried values blue,
valves ink). There is no orange, green, purple or wine: nothing here is learned, predicted,
targeted or lost. The chapter's matplotlib diagram draws the state line in the house orange
(`#E57200`) and the gates in navy; this panel follows the book palette instead.

## Teaching boundary

> The values 0.80 and 0.30 are an illustrative toy: a real cell gives every coordinate its own
> keep, computed by a sigmoid from the input and the old state.

The scope disclosure adds that the two values are round numbers inside tanh's range and that
the chapter prints no state values; that a real state is a vector with one keep per
coordinate; that the reset gate shapes the candidate before the blend and is not drawn; that
the panel follows the chapter's convention (z weights the old state; some references swap the
roles, so compare the interpolation equation, not the gate's name); that PyTorch's reset-after
candidate changes how the candidate is computed, not the blend; and the palette key.

Deliberately left out, because the chapter asks the reader to predict or find them first: the
memory test's question whether the LSTM's +1 carries over to the GRU, and Exercise 3's audit,
whose named wrong answer is "σ(1) ≈ 0.73 is too leaky". The panel therefore shows no sigmoid
value, no bias, no +1 or +2, no gate value 0.73 or 0.88, no talk of leaking or decay over many
steps, and never multiplies a keep by itself; the suite scans every reader-facing string, over
the whole timeline and the dial, for those. Also left out: the manual-loop implementation and
the reset-after verification of Exercise 3, and the reset gate's own effect.

## The transfer check

> A GRU starts from h<sub>0</sub> = 0, and every candidate it writes is a tanh output inside
> (−1, 1). Can a coordinate of its state ever reach 1.2, whatever the gates do?

No. Each step lands the new state on the segment between the old state and the candidate,
since keep and write are shares of one whole. If both ends lie inside (−1, 1), so does the new
state, and from h<sub>0</sub> = 0 every state stays inside (−1, 1). The question carries the
one-step picture across every step, which neither the final frame nor the dial shows.
`scripts/test_excerpt_checks.cjs` reads the old state, the candidate, the keep and the range
from the panel, recomputes the 0.55 blend, checks that every keep in [0, 1] lands between the
two ends, and requires "No." and "inside (−1, 1)" in the answer.

## What was imported from the film, and what was not

The film's GRU scene (`6050-Ch10/lecture.jsx`, `SGRU`, lines 566 to 600; storyboard row 11,
"one gate, two jobs"; 482 to 518 s of the Chapter 10 lecture) supplied the composition: a
single keep dial driving one bar whose two shares always fill it, which the film labels "the
two coefficients always fill one bar", and the caption's intent that z weighs the old state,
1 − z weighs the candidate, and the two sum to one. Not imported: the film's purple old state
and its capsules, its reset valve, its code card, its free-running sine sweep of the keep, and
its section kicker. The film shows no state values: the number line, the arrows, and 0.80,
0.30 and 0.55 are this panel's own declared toy.

## Revisions after the author's first look (September 29, 2026)

The author noted that the bar and the dial pointed opposite ways (keep on the bar's left,
write-all on the dial's left), asked for the interpolation span to be marked, and proposed
colouring the two shares like the two values. Taken:

- The bar now puts write on the left and keep on the right, so the bar, the dial (0, write
  all, on the left; 1, keep all, on the right) and the number line (the candidate, 0.30, left
  of the old state, 0.80) share one orientation. Each share is named beside the mark of the
  value it weighs: a hollow diamond before "write 1 − z", a filled circle after "keep z".
- The segment from 0.30 to 0.80 is drawn heavier (a wider, darker band). It still appears
  only from the halfway beat on: marked during the question, it would rule out the wrong
  answer 0.40 before the reader commits.

Not taken: blue and orange fills for the shares. Both values are carried values, blue in
the book's palette, and orange is reserved for learnable parameters; the shares stay ink,
tied to their values by the marks beside their names.

## Source digests

Lecture paths are relative to the lecture repository root.

| Source | SHA-256 |
|---|---|
| `chapters/part3/10-sequences-rnn.qmd` | `70416bebb2d9a9e3384198151917d73b650fbc23704328e29df2fdd44bb35593` |
| `6050-Ch10/lecture.jsx` | `3a2cabb00546067f5c3c0a3715c043ac96ec4f09faa298815428089689a22350` |
| `6050-Ch10/STORYBOARD.md` | `23204f3ef89ad845ee07ec11c6e618154391908294429381798f7c20de888902` |
