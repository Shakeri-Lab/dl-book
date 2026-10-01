# In training mode, BatchNorm measures each value with its own batch's ruler: `batch-ruler-excerpt`

**Author-approved, September 29, 2026.** After reviewing the build, the author kept its one open choice as built ("defaults") and asked to "commit and push".

An optional, HTML-only mechanism excerpt for Chapter 9 (`chapters/part2/09-modern-cnns-transfer.qmd`,
printed as Chapter 10), in "The stabilizer we owe you: batch normalization". Its
`after-paragraph` anchor names "it starts every layer from sane numbers.", so the panel follows
the paragraph on the γ and β pair, which ends "since $\beta$ already provides the shift.", and
precedes the callout "BN is two different machines: tell PyTorch which one you are running",
which then states the answer after the reader has predicted it. The phrase occurs once in the
chapter's whitespace-collapsed text and carries no markup. Verified in a full `quarto render --to html` with Quarto 1.10.18, the CI pin: the panel is
inserted once, between the paragraph's closing `</p>` and the callout's section. The PDF is untouched:
`filters/mechanism-excerpts.lua` returns `{}` for any non-HTML format on its first executable
line.

The chapter carries three other panels: `stacked-sight-excerpt` and `pixel-skewer-excerpt`
earlier, and `identity-lane-excerpt` (after `cell-fig-residual-stream`), built alongside this
one. This panel reuses their marks for the same objects: carried values blue, as in
`pixel-skewer`'s input column, and fixed measuring devices ink. `layernorm-axis-excerpt`
(Chapter 16, `14-self-attention-transformer.qmd`) already animates centring, scaling and the
N, H, W pooling axes; none of those motions is repeated here.

## Who asked

The author asked on September 28, 2026 for replays from the Advanced CNN chapter; this scene
was scoped then, and on September 29 the author asked for it to be built ("make them").

## The question, and the misconception it targets

> In training mode, the same garment goes through BatchNorm twice, once with each of two
> batches of other garments. Its own value is 2 both times. Does its output change?

The misconception is that BatchNorm is a fixed function of its input, like a convolution: the
same 2 in, the same number out. In training mode it measures each value against the current
batch's mean and spread, so the batch-mates move the output: the garment reads 1 among 0, 0
and 2, and −1 among 2, 4 and 4. Evaluation mode uses stored running statistics, and the output
then depends on the input alone. The chapter states both halves in the callout that follows
("evaluate in train mode and your predictions depend on whatever else happens to be in the
batch"); the panel lets the reader commit before reading it.

## What moves, and why two frames could not do it

One picture: a value axis (grey scenery, labelled 0 to 4) carrying one channel of a batch of
four garments, one number each, as blue dots; marks sharing a value stack. Your garment is the
dot wearing a blue ring, labelled "your garment", at 2, and it never moves. Under the axis sits
the batch's ruler (ink): a bar whose 0 tick sits under the batch mean, marked on the axis by a
small ink triangle labelled "mean", with one tick per spread, labelled −2 to 2 in normalized
units. A thin ink drop falls from your garment to the ruler, and its reading is written beside
the foot in blue ("reads 1.00").

The tracked object is the ruler under a still garment. At the reveal the three batch-mates
glide from 0, 0 and 2 to 2, 4 and 4 (the cause, first); only after they arrive does the mean
triangle slide from 1 to 3 and the ruler after it (the effect). The drop has not moved, yet the
ruler's −1 now sits under it. Next the first batch's ruler is drawn again one row lower,
dotted, and the same drop meets it at 1: one input, two rulers, two readings. Then the batch
ruler fades and a dashed running ruler, pinned at mean 2 with ticks 1 apart, takes its place;
the mates glide back to the first batch and out again, and the reading stays 0. The mates and
the ruler never move at once.

The first and last frames, the first batch in training mode reading 1 and the second batch in
evaluation mode reading 0, show two numbers. They lose what the motion carries: that the input
stood still while its reading changed, that the change came from the ruler following the
batch, and that the running ruler ignores the same glides.

## The fixture

| attribute | value | what it mirrors |
|---|---|---|
| `data-garment` | 2 | declared toy: the tracked garment's one number, as in the question |
| `data-first` | `0 0 2` | declared toy: its first batch-mates, paired in order with the second |
| `data-second` | `2 4 4` | declared toy: its second batch-mates, each larger than its partner |
| `data-running` | `2 1` | declared: running mean and variance, the two batches' averages; the chapter's "running averages collected during training" |
| `data-affine` | `1 0` | γ and β at the layer's initial values, so y is the reading itself |
| `data-evidence-class` | `declared-toy` | the chapter prints no activation values for BatchNorm's two modes |

The manifest literals bind the chapter's N, H, W sentence ("the current minibatch **and both
spatial axes** ($N$, $H$, and $W$), normalizes the"), both lines of `@eq-batchnorm`, and the
callout's training and evaluation sentences, including "evaluate in train mode and your
predictions depend on whatever else happens to be in the batch". The suite checks that the
panel's formula, with its `\class` handles and colour wrappers taken off, is the chapter's
equation verbatim, and that the scope's "running averages collected during training" and "needs
real batches" are the chapter's words.

### The illustrative toy

The chapter's `bn-drift` cell prints per-layer activation spreads and no individual values, so
the four numbers are made up: small integers whose two batches share the spread 1, so the
ruler slides without stretching and every reading is a whole number (1, −1 and 0), exact in
binary floating point, and whose running statistics are the two batches' plain averages. Each
mate of the second batch is larger than its partner in the first, as the ask says. The
panel's boundary says the running statistics are declared, and its scope that the values are
an illustrative toy. The lecture film shows no garment values, so none comes from it.

### Declared computed variants

| quantity | value |
|---|---|
| first batch, 2, 0, 0, 2 | mean 1, variance 1 (the mean of the squared deviations), spread 1; the garment reads (2 − 1)/1 = 1 |
| second batch, 2, 2, 4, 4 | mean 3, variance 1, spread 1; the garment reads (2 − 3)/1 = −1 |
| evaluation, either batch | running mean 2, variance 1; the garment reads (2 − 2)/1 = 0 |
| ε | taken as 0; at PyTorch's default of 10⁻⁵ each reading moves by less than 10⁻⁵ and no drawn digit changes |
| output | y = γ x̂ + β = x̂, with γ = 1 and β = 0 |
| the transfer check | 4, 0, 0, 4: mean 2, spread 2, reading (4 − 2)/2 = 1 |

These are the manifest's five `computedVariants`: the declared toy, the two training-mode
readings with ε, the evaluation reading with γ and β, the check's arithmetic, and the eight
five-second beats, with no control. The player computes every mean, spread and reading from
the attributes, and the suite recomputes them independently, reads each drawn ruler back
through the drawn axis at every beat and at both widths, and checks the drop lands on the tick
whose value is the printed reading. The value-axis labels 0 to 4 and the ruler's −2 to 2 are
graduations of the drawing, not further quantities.

## Beats

Duration 40 s, beats `0 5 10 15 20 25 30 35`. Every moving beat moves in its first 2.5 s and
then holds, so each reveal stands still for at least 2.5 s.

| beat | s | what happens |
|---|---|---|
| 0 | 0 to 5 | training mode: the first batch, the batch ruler at mean 1, spread 1; the garment reads 1.00 |
| 1 | 5 to 10 | the ask: nothing moves; no second batch, no reading but 1.00 |
| 2 | 10 to 15 | the reveal: the mates glide to 2, 4 and 4 (10 to 11.2 s), then the mean mark and the ruler slide to 3 (11.2 to 12.5 s), the reading withheld while the ruler moves; from 12.5 s it reads −1.00 |
| 3 | 15 to 20 | the first batch's ruler drawn again below, dotted: the same drop reads 1.00 on it and −1.00 on the second batch's |
| 4 | 20 to 25 | evaluation mode: the batch ruler fades (20 to 21 s), the dashed running ruler comes in at mean 2 (21 to 22 s); from 22 s it reads 0.00; the formula's batch statistics are struck |
| 5 | 25 to 30 | the mates glide back to 0, 0 and 2 (25 to 26.5 s); the running ruler stays; the reading stays 0.00 |
| 6 | 30 to 35 | the mates glide to 2, 4 and 4 again (30 to 31.5 s); the reading still 0.00 |
| 7 | 35 to 40 | the final frame: evaluation mode, the running ruler, the reading 0.00 |

The captions, at most 20 words each:

0. In training mode, BatchNorm measures each value with its batch's own mean and spread.
1. Swap the other three garments for larger ones. Does your garment's output change?
2. The other three move, and the batch's ruler moves with them. Then, once the ruler has
   arrived (12.5 s): Your garment still holds 2, but now it reads −1.
3. Same input, opposite outputs: in training mode the output depends on the batch.
4. In evaluation mode BatchNorm uses running statistics collected during training.
5. Swap the batch back: the running ruler stays put, and the reading stays 0.
6. Any batch, the same reading: in evaluation mode the output depends on the input alone.
7. Two machines: training measures with the batch, evaluation with stored statistics.

The prediction is withheld. From 0 to 10 s the mates stand at 0, 0 and 2, one batch ruler
stands at mean 1, no reading other than 1.00 is drawn, the picture does not change from 5 s,
and neither the picture's `aria-label` nor the scrubber's value text mentions the second batch,
its values or its reading. The suite checks this from the DOM at 0.1 s steps, with and without
reduced motion. Reduced motion holds each beat's finished state: the reveal's beat shows the
ruler already at 3, the reading −1.00 and the second caption; the switch's beat shows the
running ruler whole. No control: the mechanism is a switch between two modes, not one
parameter's effect.

## Palette

Blue is the carried value: the four garments, your garment's ring and label, the drop's foot and
every reading, matching `pixel-skewer`'s input column in the same chapter. Ink is the measuring
device: the mean mark, the rulers and the drop, as a design choice rather than a quantity, and
the formula's batch statistics are washed in ink while the batch ruler measures, then dimmed
and struck in evaluation mode. Orange is γ and β, in the formula only: the learnable pair,
fixed here at their initial values. The value axis is grey. Dash style repeats what colour
cannot: the batch ruler solid, the running ruler dashed, the first batch's ruler, drawn again
for comparison, dotted. The chapter draws no figure for batch normalization, so there is no
house-colour figure to reconcile.

## Teaching boundary

> Each garment is one number here; BatchNorm2d pools every pixel of the channel as well, and
> the running statistics are declared, not trained.

The scope disclosure adds, in six short paragraphs: the toy values, and that the spread is the
square root of the variance, the mean of the squared deviations over the batch, as the formula
computes it; that ε is taken as 0 and PyTorch's default of 10⁻⁵ moves no drawn digit; that
γ = 1 and β = 0 are a new layer's values, so the output is the reading itself; that the running
statistics stand in for the chapter's running averages collected during training, declared as
the two batches' averages, and that PyTorch's own are momentum-weighted and track the unbiased
variance, so a trained layer would hold other values; that in this one-number toy a batch of one
garment would leave no spread to measure, the extreme case of the chapter's warning about tiny
batches; and the palette key.

Deliberately left out: the pooling over N, H and W and the centring and scaling motions, which
`layernorm-axis` animates; the running estimates' actual values under PyTorch's momentum-weighted
update, since the panel declares its running statistics rather than training them; the `bn-drift` printout's spreads and Exercise 4's question, whether training
itself fixes activation scales; and anything backward: Exercise 7 derives the gradient through
the batch statistics, and the panel draws the forward pass only. The panel does not answer
either exercise.

## The transfer check

> Check yourself. In training mode, every value in the first batch doubles, your garment's
> included: 4, 0, 0 and 4. What does BatchNorm output for your garment?

Still 1. The mean doubles to 2 and the spread to 2, so the garment reads (4 − 2)/2 = 1: in
training mode a rescaling shared by the whole batch cancels out. The picture never shows a
batch whose spread changes, so the reader has to apply the ruler, not read the final frame.
`scripts/test_excerpt_checks.cjs` recomputes the first reading and the doubled one from the
panel's `data-garment` and `data-first` and looks for "Still 1" and "(4 − 2)/2 = 1".

## What was imported from the film, and what was not

The BatchNorm scene of the lecture film `6050-Ch9` (58 to 114 s; `ScaleStrip` and `SBatchNorm` in
`6050-Ch9/lecture.jsx`, lines 759 to 934, and the storyboard's scene-map row 3) supplied the
closing switch between the two machines and its caption intent, "train uses the current batch ·
eval uses running statistics" (captions read from
`transcripts/10-modern-cnns-and-transfer-learning.timeline.json`). Not imported: the drift strips
of measured spreads, the channel histogram and its statistics (−0.345, 0.081), the example γ 1.6
and β 0.5, the N, H, W chips (the `layernorm-axis` panel shows the pooling axes), the film's
colours and cards, its narration and its section kicker. The film shows the switch as a card;
the ruler moving under a still garment, and the garment's reading changing with the batch, are
this panel's own.

## The author's decision (September 29, 2026)

The build left one choice open, and the author kept the default ("defaults"): evaluation
mode draws no mark for the running mean. The dashed running ruler's 0 sits under the axis's
2, and its label names the running statistics.

## Source digests

Lecture paths are relative to the lecture repository root.

| Source | SHA-256 |
|---|---|
| `chapters/part2/09-modern-cnns-transfer.qmd` | `1a2c710f3851b92e9122c1317389c1eb0c2e21e1b644721d91febfd1f2caef2c` |
| `6050-Ch9/lecture.jsx` | `446a5c3f889149b46f5fe275c37414d3240bb1b4dc27b347e9212d9f0527402a` |
| `6050-Ch9/STORYBOARD.md` | `159fdb5484a5c8877ff04e1b7f7981bbf8bf4987b31d75c57a0019be95143da8` |
