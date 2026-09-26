# Channels say what, pooling says roughly where: `what-where-excerpt`

An optional, HTML-only mechanism excerpt for Chapter 8, inserted before the level-2
heading `LeNet: the whole machine`, whose first paragraph says the network "trades
'where' for 'what' stage by stage". The PDF is untouched: `filters/mechanism-excerpts.lua`
returns `{}` for any non-HTML format on its first executable line.

The author asked for an interactive that separates what a CNN detects (channels) from the
spatial tolerance pooling buys, in the spirit of the classic figure where each filter's
activation map is max-pooled on its own and the pooled maps are stacked for the next
layer. The chapter already stages that story with its own detectives: the
corner-detector cell builds two edge experts on a square and stacks their reports as two
channels. This panel takes those two reports one step further, through the pooling
LeNet applies after every convolution.

## The question, and the misconception it targets

> Two detectives report on the same square: one finds vertical edges, one horizontal.
> After max pooling shrinks their maps, can the network still tell the square's side from
> its top?

The confusion the chapter's two sections leave room for is that channels and pooling are
both "summaries", so pooling might summarize across detectives as well as across space.
It does not. A tensor of shape channels × height × width has two kinds of axis, and the
two operations act on different ones: the convolution adds depth (one map per detective),
and pooling shrinks height and width inside each map separately. So after pooling the
network still knows *what* was found at a block (its channels are intact) and only
roughly *where* inside the block.

The scene makes that concrete with numbers the chapter's own fixture produces. At a spot
on the square's left side the two reports read (4, 0); on its top, (0, 4). Pooled map by
map, the side block still reads (4, 0) and the top block (0, 4). One maximum taken across
both maps would read 4 at both, and nothing downstream could tell them apart.

## What moves, and why two frames could not do it

One picture: the input square (one channel), the two detectives' maps (two channels,
full size), and each map pooled (two channels, half size), with a probe that reads one
spot through the depth of the stack. The motion is three things:

- one three-by-three window sweeps the input, and at each stop *both* maps are written at
  the same place: one neighbourhood, two reports;
- a two-by-two pooling window runs through the two maps in step, one window per map,
  each keeping its own maximum;
- the probe reads the same spot in every map: side, top and corner at full size, then
  the side block and the top block after pooling.

Two stills, the input and the final four maps, show vertical stripes in one map and
horizontal stripes in the other. They lose which operation acted along which axis: that
the conv window wrote both maps at once and the pooling windows never crossed from one
map to the other. The prediction is withheld until the reader commits.

## The fixture

| attribute | value | what it mirrors |
|---|---|---|
| `data-size`, `data-square` | 28, 7 21 | `square = torch.zeros(28, 28)`, `square[7:21, 7:21] = 1.0` |
| `data-kernel` | −1 0 1 −2 0 2 −1 0 1 | `sobel_v`; the horizontal detective is `sobel_v.T` |
| `data-pool` | 2 | LeNet's `F.max_pool2d(..., 2)` and the chapter's 2 × 2, stride-2 configuration |
| `data-probes` | (14, 7), (7, 14), (7, 7) | declared: a spot on the side, on the top, at the corner |

The chapter literals bound in the manifest are the detectives bullet, the four lines of
the corner-detector cell that build the square, the kernel and the two reports, the
`experts` stacking line, the max-pooling bullet, the sentence on the common 2 × 2
configuration, and LeNet's two shape comments used by the transfer check.

### Declared computed variants

| quantity | value |
|---|---|
| the reports (`v`, `h`) | recomputed exactly as the cell does: values 0, 1, 3, 4 only |
| spot on the side, row 14 column 7 | (4, 0) |
| spot on the top, row 7 column 14 | (0, 4) |
| spot at the corner, row 7 column 7 | (3, 3) |
| pooled side block (7, 3) | (4, 0) |
| pooled top block (3, 7) | (0, 4) |
| one maximum across both maps, at either block | 4 |
| shapes | 1 × 28 × 28 → 2 × 28 × 28 → 2 × 14 × 14 |

The chapter never pools this stack; these pooled values are computed here, with torch's
`max_pool2d` giving the same maps.

## Beats

Duration 40 s, beats `0 5 10 15 20 25 30 35`.

| beat | s | what happens |
|---|---|---|
| 0 | 0–5 | the input square and two empty maps |
| 1 | 5–10 | one window sweeps the input; both maps are written in step |
| 2 | 10–15 | the probe reads the side (4, 0), the top (0, 4), the corner (3, 3) |
| 3 | 15–20 | a pooling window runs through each map in step; both maps halve |
| 4 | 20–25 | hold: the probe on the pooled side and top blocks, readings withheld |
| 5 | 25–30 | (4, 0) and (0, 4); the struck row shows one maximum across maps would read 4 and 4 |
| 6 | 30–35 | the shape ledger: convolution changed the depth, pooling the space |
| 7 | 35–40 | channels say what was found; pooling says roughly where |

Reduced motion holds each beat's finished state.

## Palette

Maps are drawn as dark fields, matching the chapter's gray panels for the same experts.
The input square is the book's input blue and every detective's report green, pooled or
not; the windows and the probe are neutral outlines. The counterfactual is grey and
struck so it never reads as a result.

## Teaching boundary

> Nothing here is trained: the two detectives are the chapter's hand-built edge experts,
> and the pooling is the fixed 2 × 2 maximum LeNet uses.

The scope disclosure says that the chapter reads this stack at full resolution with its
corner detector, so the pooled values are computed here; that pooling never compares
one detective's number with another's; that what pooling does lose is position inside a
block, which the chapter's pooling section and the `pooling-bins` replay treat
separately; and that LeNet has six first-layer detectives, not two, and learns them.

Deliberately left out: a second-layer reader. The chapter's corner-detector figure
already shows a kernel reading both channels at once, and running it on the pooled maps
would move its peak inward and blur the one distinction this panel exists to make.

## The transfer check

> LeNet's first layer hands its pool six maps of 28 × 28. What shape leaves the pool, and
> how deep is each of the second layer's kernels?

6 × 14 × 14, and each second-layer kernel is 6 × 5 × 5: pooling halves the height and
width of every map and leaves all six detectives in place, and the next convolution reads
the six together, which is why its kernels are six deep. The numbers are LeNet's own
(`# -> (N, 6, 14, 14)`, `nn.Conv2d(6, 16, 5)`); `scripts/test_excerpt_checks.cjs`
derives the pooled size from the panel's declared size and pool.

## Source digests

| Source | SHA-256 |
|---|---|
| `chapters/part2/08-cnn.qmd` | `33aa5122d822dee6095852379dc924d09a65ad10aefbbbf8cc22301bc6d0ed71` |
