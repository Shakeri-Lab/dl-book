# The vertical Sobel kernel, taken apart: `sobel-split-excerpt`

An optional, HTML-only mechanism excerpt for Chapter 7's "The filter zoo", placed after
the section's three bullets and before its code: the reader meets the vertical Sobel
kernel as two operations, then reads the code that applies it. The PDF is untouched:
`filters/mechanism-excerpts.lua` returns `{}` for any non-HTML format on its first
executable line.

This is the first scene to use a `before-cell` anchor (see "Placement" below).

## The question, and the misconception it targets

> The rectangle's left side and its top are both edges, where the image jumps from dark to
> bright. Which one does the vertical Sobel kernel see?

The chapter says the right things about Sobel: the weights sum to zero, flat regions
cancel, and the vertical detector "lights up on the rectangle's sides and stays silent on
its top and bottom". What it leaves the reader to reconstruct is *why* nine particular
numbers select one orientation. The misconception it leaves standing is that an edge
detector detects edges: a sharp change anywhere should make it fire. The top of the
rectangle is as sharp a change as its side, and the vertical kernel returns exactly zero
there.

The reason is one factorization:

$$
\begin{bmatrix}-1&0&1\\-2&0&2\\-1&0&1\end{bmatrix}
=\begin{bmatrix}1\\2\\1\end{bmatrix}\begin{bmatrix}-1&0&1\end{bmatrix}.
$$

The row (−1, 0, 1) takes the right pixel minus the left one and ignores the middle: a
difference *across*. The column (1, 2, 1) averages three rows with the middle counted
twice: the chapter's own moving average with uneven weights, running *along*. Sliding the
kernel is the same as taking a difference across each row and averaging the differences
down the column. On the rectangle's top edge every row is flat left to right, the dark
row and the bright rows alike, so every difference is zero before any averaging happens.

## What moves, and why two frames could not do it

One picture: an eight-by-eight crop of the chapter's `make_shapes()` rectangle at its
top-left corner, a three-by-three frame, and the arithmetic of the patch under it. The
tracked object is the frame. It carries its two factors in the margins (the column
weights −1, 0, +1 along the top of the image, the row weights ×1, ×2, ×1 down its left),
marks the subtracted and added columns inside itself, and shades the ignored middle.

At each stop the three row differences appear as bars (the middle row's twice as long,
because it counts twice) and slide end to end into one response. The frame visits a flat
patch inside the rectangle (0), glides onto the left side (every row climbs by 0.9;
weighted 1, 2, 1 that is 3.6), then onto the top edge, where the response is withheld
while the caption asks for a prediction, and then revealed: 0, because every row is flat.
Finally the frame sweeps every position and leaves its response behind as a map: a stripe
down the left side (0.9, 2.7, then 3.6 once the frame is inside the rectangle's rows) and
measured zeros along the top.

Two stills, the image before and the response map after, show *that* the side lights and
the top does not. They lose why: the per-row differences, the 1-2-1 weighting, and the
moment at the top edge where a sharp change produces nothing.

## The fixture

| attribute | value | what it mirrors |
|---|---|---|
| `data-kernel` | −1 0 1 −2 0 2 −1 0 1 | `"Sobel (vert.)": torch.tensor([[-1., 0., 1.], [-2., 0., 2.], [-1., 0., 1.]])` |
| `data-rect`, `data-level` | 10 26 8 30, 0.9 | `img[10:26, 8:30] = 0.9` in `make_shapes()` |
| `data-along`, `data-across` | 1 2 1, −1 0 1 | declared factors; the suite checks their product is the kernel |
| `data-crop` | 7 5 8 | declared: rows 7 to 14, columns 5 to 12 |
| `data-stops` | (5, 5), (5, 3), (3, 5) | declared: a flat patch, the left side, the top edge |

The manuscript literals bound in the manifest are the zoo's bullet on edge detection, the
`make_shapes` signature and its rectangle line, both Sobel kernel lines, and the sentence
after the zoo figure that says which edges each detector sees.

### Declared computed variants

Every value is recomputed from the attributes above and was checked against torch's
`conv2d` on the full 64-by-64 `make_shapes()` scene:

| quantity | value |
|---|---|
| the crop | pixels of 0 and 0.9 only; the rectangle's top at crop row 3, its left side at crop column 3; no disk, no stripes |
| flat patch, centre (5, 5) | 0 |
| left side, centre (5, 3) | 0.9 + 2 × 0.9 + 0.9 = 3.6 |
| top edge, centre (3, 5) | 0 |
| the map | 0.9, 2.7, 3.6, 3.6, 3.6 down crop columns 2 and 3; 0 at the other 26 centres |
| horizontal Sobel on the top edge (the check) | 3.6; on the left side, 0 |
| vertical Sobel on the rectangle's right side (scope) | −3.6 |

The chapter draws these responses in its gray zoo panels and prints none of them.

## Beats

Duration 40 s, beats `0 5 10 15 20 25 30 35`.

| beat | s | what happens | response |
|---|---|---|---|
| 0 | 0–5 | the corner and the frame, parked on a flat patch | |
| 1 | 5–10 | the two factors appear on the frame's margins; the formula lights its factorization | |
| 2 | 10–15 | flat patch: three zero differences | 0 |
| 3 | 15–20 | the frame glides onto the left side: three differences of 0.9, weighted 1, 2, 1 | 3.6 |
| 4 | 20–25 | the frame glides onto the top edge; the response is withheld | · |
| 5 | 25–30 | the top: three zero differences | 0 |
| 6 | 30–35 | the frame sweeps every position, leaving the response map; the panel becomes its legend | |
| 7 | 35–40 | average along the edge, difference across it | |

Reduced motion holds each beat's finished state; during the sweep the frame travels bare,
without its factors, so nothing it carries is mistaken for a reading.

## Palette

Blue is the input image (the rectangle's 0.9), green the kernel's response, and the kernel
itself neutral ink: it is fixed here, and the book keeps orange for weights that are
learned. A response of exactly zero is drawn as a small open ring, not as nothing, so the
silence along the top reads as a measurement.

## Teaching boundary

> This is the kernel's arithmetic on one corner of the chapter's synthetic scene: nothing
> is learned, and the boot and the other four kernels are left to the code below.

The scope disclosure states the factorization and ties the column factor to the moving
average; states the crop and that responses are drawn at patch centres (the code's valid
output is one pixel in from each edge, 62 by 62 for 64 by 64); and gives the right side's
−3.6, which is why that side prints dark and the left side bright in the zoo's gray panels.

## The transfer check

> The zoo's other Sobel kernel, [[−1, −2, −1], [0, 0, 0], [1, 2, 1]], is this one
> transposed. What does it give on this corner's top edge, and on its left side?

3.6 on the top edge and 0 on the left side: transposed, the kernel takes its difference
down each column, bottom minus top, and averages the columns 1, 2, 1. Transposing swaps
which edges it sees, which is the zoo figure's last column.
`scripts/test_excerpt_checks.cjs` builds the transpose from the declared factors and
recomputes both responses on the declared crop.

## Placement: the `before-cell` anchor

The zoo's code cell sits inside a Plan → Code wrapper, so an `after-cell` anchor would
place the panel inside the code panel, between the plan and the code. The new
`before-cell` anchor names the cell (`cell-fig-filter-zoo`) and inserts the panel before
the block that presents it: the Plan → Code wrapper when there is one, the bare cell
otherwise. `filters/mechanism-excerpts.lua` settles, once per document and before anything
moves, whether the cell is wrapped; `scripts/audit_excerpt_fixtures.py` checks the label
exactly as it does for `after-cell`.

Verified locally by running the real filter through Quarto's pandoc on Chapter 7's frozen
markdown, with a shim that supplies the two Quarto fields it reads: each new panel is
inserted exactly once; the moving-average panel follows the `cell-fig-moving-average`
div; this panel follows the zoo's bullet list and precedes the whole Plan → Code wrapper;
the shared stylesheet is emitted once with the first panel and the loader once after the
last. The convolution scene keeps its own filter and loader, which select a different
class, so the two coexist on the page.

## What was imported from the film, and what was not

The film's FilterZoo scene (`6050-Ch7/STORYBOARD.md`, scene 5) supplied the choice of
subject: "during the Sobel dwells the shapes strip shows the rectangle's sides vs
top/bottom firing categorically", and its predict hold on "one of these kernels sums to
zero". Not imported: the film's morph schedule between kernels, its signed red and blue
product display (blue is the input here), its gold kernel frame, and its narration. The
factorization, the three stops and the withheld top-edge response are this panel's own.

## Source digests

Lecture paths are relative to the lecture repository root.

| Source | SHA-256 |
|---|---|
| `chapters/part2/07-filters-convolution.qmd` | `5506b4f0d5c67efc51800b1416951374c1ddc54451866ab0f004d0602800c06d` |
| `6050-Ch7/STORYBOARD.md` | `20c9ea57814657b4ac0756cc1c3e86c3065b968d93477ccec6da357a88130492` |
