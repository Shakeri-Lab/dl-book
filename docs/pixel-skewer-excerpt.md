# A 1 × 1 convolution is one linear layer, run at every pixel: `pixel-skewer-excerpt`

An optional, HTML-only mechanism excerpt for Chapter 9's "Question 3: 1 × 1 convolutions,
and firing the flatten head", placed directly after the paragraph that introduces the
1 × 1 kernel ("a **linear model across the channels, run separately at every pixel**")
and before the Network-in-Network design that uses it. The PDF is untouched:
`filters/mechanism-excerpts.lua` returns `{}` for any non-HTML format on its first
executable line.

The author asked for "The Pixel Skewer": an interactive that shows why a one-pixel filter
is not a no-op, as an identical linear layer applied down the channel tube at every
coordinate, with a dial for the number of output channels. The author placed it in
Chapter 9, where the manuscript already introduces 1 × 1 convolutions, rather than in
Chapter 8. This is the first scene to use an `after-paragraph` anchor (see "Placement").

## The question, and the misconception it targets

> `nn.Conv2d(16, 16, 1)` slides a kernel one pixel wide over a 16-channel, 28 × 28 map.
> Is it a no-op? How many weights does it hold, and does each pixel get its own?

Two misreadings sit in the chapter's own words. "Odd-looking at first sight": a kernel
one pixel wide looks as if it can only rescale a pixel, and on a single channel that is
all it can do. And "run separately at every pixel" can be heard as *separately
parameterized*: one small network per pixel, a bill that grows with the image. Neither
holds. At each pixel the layer reads the whole column of channel values and writes a new
column through one matrix W, and every pixel uses that same W: 16 × 16 + 16 = 272
parameters for all 784 pixels, whatever the map's height and width.

## What moves, and why two frames could not do it

One picture: the input stack (16 channels of 28 × 28, a fixed-camera glass box), the
weights W with their biases b, and the output stack. The tracked object is the skewer, one
pixel's column. It is lifted out of the input and laid flat over W's columns; each row of
W reads it and writes one output, some clipped to zero by the ReLU; the outputs fly into
the output stack at the same pixel. The skewer then glides to another pixel, where a
different column passes through W, which does not move or change, and finally sweeps
every pixel while the output face fills. The dial then squeezes the output to 4 channels
and expands it to 32: W gains or loses rows, the output box thins or deepens, and the
map's footprint never changes.

Two stills, the input stack and the output stack, show that the depth changed. They lose
what the motion carries: that each output pixel came from its own column only, through
one W that never moved, and that the bill is per channel pair, not per pixel.

## The fixture

| attribute | value | what it mirrors |
|---|---|---|
| `data-channels` | 16 | `*nin_block(1, 16), nn.MaxPool2d(2),`: the first block's width |
| `data-size` | 28 | `# (1200, 1, 28, 28)`; the block's `padding=1` keeps the size |
| `data-out` | 16 | `nn.Conv2d(c_out, c_out, 1)`: NiN's own 1 × 1 layers are square |
| `data-out-range`, `data-out-sweep` | 1 to 32; 4 and 32 | declared: the dial's range and the timeline's squeeze and expansion |
| `data-pixels` | (10, 8), (10, 19) | declared positions on one row |
| `data-column-a`, `data-column-b` | 16 values each | declared illustrative toy |
| `data-weights`, `data-bias` | 32 × 16 and 32 | declared illustrative toy, row-major, one row per output channel |

The chapter literals bound in the manifest are the paragraph that introduces the 1 × 1
kernel (its first sentence, the `C_in` / `C_out` sentence, the "linear model across the
channels" clause, the tiny-MLP sentence and the 64-into-32 compression), `nin_block`'s
signature and its 1 × 1 line, `NINSmall`'s first block, and the input's shape comment.

### The illustrative toy

The chapter trains NINSmall and prints none of its weights or activations. So the two
columns, the weights and the biases are made up, drawn once with numpy's
`default_rng(seed)` for seeds 1, 2, … and kept at the first seed, 97, that met every
legibility condition:

- column values from {0, 0.5, 1, 1.5, 2}, non-negative as after the block's ReLU, with
  at least three zeros in each column and the two columns differing by at least 8 in
  total;
- weights from {−1, −0.5, 0, 0.5, 1} and biases from {−0.5, 0, 0.5}, every input channel
  weighted somewhere in the first sixteen rows;
- among the first sixteen outputs, three to six clipped by the ReLU at each pixel, no
  pre-activation exactly zero, the two pixels' clipping patterns differing in at least
  three outputs, and the largest output between 3.5 and 5 (5 across all 32 rows).

The values are recorded in the panel, and every output is computed from them. The
panel's `data-evidence-class` is `declared-toy`, and the boundary says the values are
illustrative.

### Declared computed variants

| quantity | value |
|---|---|
| outputs at the first pixel, `ReLU(Wx + b)`, 16 channels | 0.5, 0, 2.25, 3.25, 1.75, 0.5, 2, 4.75, 0, 0, 3.25, 1.5, 1.25, 0, 3.75, 0 |
| outputs at the second pixel | 0, 0, 0.5, 1.5, 3.75, 0, 3, 0.75, 0, 0, 3.75, 0.25, 0, 0.25, 1.75, 3 |
| the bill at the timeline's 16 | 16 × 16 + 16 = 272, shared by 28 × 28 = 784 pixels |
| the bill on the dial | 16 × C + C: 68 at 4, 544 at 32 |
| shapes | 16 × 28 × 28 in, C × 28 × 28 out |

All outputs are multiples of a quarter, exact in binary floating point. The suite checks
them twice: as `nn.Linear` on each column, and as a C × 16 × 1 × 1 kernel slid over the
two declared pixels.

## Beats

Duration 40 s, beats `0 5 10 15 20 25 30 35`.

| beat | s | what happens |
|---|---|---|
| 0 | 0–5 | one channel: the 1 × 1 kernel on one pixel, which can only scale and shift it |
| 1 | 5–10 | the stack deepens to 16 channels; the pixel's column is lifted out and laid flat |
| 2 | 10–15 | predict: sixteen in, sixteen out; W withheld from the drawing and the description |
| 3 | 15–20 | W and b appear; each row reads the column into one output; ReLU zeros; the outputs fly into the output stack |
| 4 | 20–25 | another pixel: a new column through the same W; the bill, 272 parameters |
| 5 | 25–30 | the skewer sweeps all 784 pixels from where it stands; the output face fills |
| 6 | 30–35 | the dial squeezes the output to 4 channels, then expands it to 32 |
| 7 | 35–40 | home at 16: one linear layer across channels, the same at every pixel |

Reduced motion holds each beat's finished state. The dial is the scene's one parameter
control (rule 1's amendment): the timeline sweeps it; dragging pauses playback and draws
the finished picture at the dragged depth; any timeline action returns to the timeline's
own depth; its keys never reach the pane's beat seeking.

## Palette

Blue is the input column and the input stack, green the outputs and the output stack,
and orange the one learnable thing, W and b, drawn as a Hinton grid: a square's area is
the weight's size, filled when positive and hollow when negative. The skewer, the pixel
window, the row scan and the dial are neutral ink; the number of output channels is a
design choice, not a learned parameter. An exact zero is an open ring or an open bead,
so it reads as a measurement rather than as nothing.

## Teaching boundary

> The channel values and weights drawn here are illustrative: the chapter's network
> learns its own weights, and only the shapes and the counts are NINSmall's.

The scope disclosure states the shapes and where the toy comes from; states the identity
exactly (`nn.Conv2d(C_in, C_out, 1)` holds a C_out × C_in × 1 × 1 tensor and computes
`nn.Linear(C_in, C_out)` on every pixel's channel vector, with one bill that never
mentions height or width); contrasts the layer with Chapter 8's corner detector, which
read both detectives across a 5 × 5 neighbourhood, and points to the Inception
bottleneck later in the chapter as the same count put to use; and gives the key to the
Hinton grid.

Deliberately left out: the Inception arithmetic on the picture (it has its own callout
and Exercise 2), the depthwise-separable construction (Exercise 3), and any claim about
what NINSmall's trained 1 × 1 layers compute.

## The transfer check

> A sequence carries 64 numbers at every time step. How many parameters does
> `nn.Conv1d(64, 32, kernel_size=1)` hold, and what does it do at each step?

2,080: a 32 × 64 weight matrix and 32 biases, whatever the length of the sequence. At
every step it applies the same `nn.Linear(64, 32)` to that step's 64 numbers: the
chapter's 64 feature maps compressed into 32, run along time, which is how Chapter 14's
position-wise feedforward network treats every token. `scripts/test_excerpt_checks.cjs`
reads 64 and 32 from the chapter's compression sentence and recomputes the count.

## Placement: the `after-paragraph` anchor

The concept is introduced by one paragraph, and the next paragraph moves on to
Network-in-Network; no heading or cell sits between them. The new `after-paragraph`
anchor names a plain-text phrase from the paragraph ("each compression injects another
nonlinearity almost for free."), and the filter inserts the panel after the one
paragraph whose text contains it, compared in the same normalized form as heading
targets. Pandoc joins a paragraph's source lines with single spaces, so the phrase may
span a line break of the `.qmd`, as this one does. `scripts/audit_excerpt_fixtures.py`
refuses a target that carries markup (emphasis and math do not survive into a
paragraph's string form unchanged) and one that the chapter's whitespace-collapsed text
contains other than exactly once; the filter still fails closed on anything but one
insertion.

Verified locally by running the real filter through Quarto's pandoc on Chapter 9's
source, with a shim that supplies the two Quarto fields it reads: the panel is inserted
once, after the paragraph ending "almost for free." and before "That tool enables the
Network-in-Network design".

## Source digests

| Source | SHA-256 |
|---|---|
| `chapters/part2/09-modern-cnns-transfer.qmd` | `7c76dc4105900f675bf6057d227a6f0a0415c9f635b5d1decb3a49cf273fd45f` |
