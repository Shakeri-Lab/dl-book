# The moving average, one window at a time: `box-average-excerpt`

An optional, HTML-only mechanism excerpt for Chapter 7, inserted after the
`cell-fig-moving-average` cell: under the chapter's moving-average figure and before
"To 2D: the recipe". The PDF is untouched: `filters/mechanism-excerpts.lua` returns `{}`
for any non-HTML format on its first executable line.

It opens a three-panel sequence in this chapter. This scene shows the slide in one
dimension with equal weights; the existing `convolution-excerpt` shows one 2-D patch
scored and slid; `sobel-split-excerpt`, placed before the zoo's code, shows what unequal,
signed weights do. The author asked for this scene so that the Sobel one arrives on
ground the reader has already walked.

## The question, and the misconception it targets

> A window nine samples wide slides along the signal, and each average lands at the
> window's centre. Which samples never get an average of their own?

The chapter's figure shows the result, a smooth curve over a noisy one, and its code
carries a detail every reader trips on: the averages are plotted against `t[4:-4]`, not
against `t`. That slice is the moving average's whole mechanism in miniature. An average
is local (it sees nine samples and nothing else), it belongs to the centre of its window,
and a window nine wide cannot centre itself on the first four samples or the last four.
Three hundred samples in, 300 − 9 + 1 = 292 averages out.

The misconception is that a smoothed curve is a global fit that simply has fewer wiggles.
It is not: each green point is a weighted sum of nine blue ones, and nothing else.

## What moves, and why two frames could not do it

One picture: the chapter's 300 samples, a window nine samples wide, and a magnified view
that travels with it. The tracked object is the window.

In the magnified view the nine covered samples are stems. When the window averages, each
stem shrinks to a ninth of its height and the nine pieces gather, head to tail, onto the
centre stem; what they add up to stands there in green: the average, drawn where the
centre sample was. When the window steps one sample right, the view moves a hair on the
page and its contents scroll one stem left, so the new sample enters on the right. After
five slow steps the view folds away and the window sweeps the signal, writing the curve.

The first and last frames, the noisy row and the row with its smooth curve, are the
chapter's figure. They lose which nine samples made each average, the equal weights, and
the reason the curve stops four samples short of each end. The motion carries all three.

The reader commits before the answer: the sixth beat pins the window against the end of
the signal, re-opens the magnified view on the last window (four samples right of its
centre and none beyond), and withholds the count.

## The fixture

| attribute | value | what it mirrors |
|---|---|---|
| `data-samples` | 300 values, seven decimals | the output of the `moving-average-values` cell |
| `data-width` | 9 | `kernel = torch.full((9,), 1 / 9)` |
| `data-t-over-pi` | 4 | `t = torch.linspace(0, 4 * torch.pi, 300)` |

The chapter literals the manifest binds are the cell's three seeded lines
(`torch.manual_seed(6050)`, the `linspace`, and `noisy = torch.sin(t) + 0.35 * torch.randn(300)`),
the kernel line, the `F.conv1d` line, the plotting line with `t[4:-4]`, and the sentence
that defines a moving average as "locality, with *uniform* weights".

### Declared computed variants

| quantity | how it is derived | value |
|---|---|---|
| the samples | the chapter's cell, executed with torch 2.12.1, transcribed at seven decimals | SHA-256 of the declared string `c875fc4baef583f0773c4af9bb4c3dc92ad38c1b27c0807599038b07ee9661b2` |
| every average | the mean of the nine covered samples | agrees with the chapter's `F.conv1d` to 1.2 × 10⁻⁷ |
| the first six | windows centred on samples 4 to 9 | 0.17, 0.20, 0.24, 0.27, 0.35, 0.39 |
| the last | window centred on sample 295 | −0.07 |
| the count | 300 − 9 + 1 | 292 |

The Chapter 7 lecture film's frozen data (`6050-Ch7/ch7-data.js`, `movingAverage.noisy`)
holds the same draw value for value; the suite binds the declared string to the hash the
manifest records, so a changed digit fails the build.

## Beats

Duration 40 s, beats `0 5 10 15 20 25 30 35`.

| beat | s | what happens | averages written |
|---|---|---|---|
| 0 | 0–5 | the window over the first nine samples | 0 |
| 1 | 5–10 | the magnified view opens: nine stems, weights of one ninth | 0 |
| 2 | 10–15 | the stems shrink to ninths and gather into the first average, 0.17 | 1 |
| 3 | 15–20 | five slow steps; the view scrolls and each new average lands | 6 |
| 4 | 20–25 | the view folds away and the window sweeps the signal | 292 |
| 5 | 25–30 | hold: the last window, pinned against the end; the count withheld | 292 |
| 6 | 30–35 | the four samples at each end are marked; 292 averages | 292 |
| 7 | 35–40 | keep the slide, change the nine numbers | 292 |

Reduced motion holds each beat's finished state.

## Palette

Blue is the input signal; green the averages the filter produces, matching the output
colour of `convolution-excerpt` in the same chapter. The window and its weights are
neutral ink because they are fixed: the book keeps orange for learned weights, which
begin in Chapter 8. The chapter's own figure draws its smooth curve orange, a matplotlib
choice outside the semantic palette; this panel follows the book's palette instead.

## Teaching boundary

> Nothing here is learned or tuned: the nine weights are fixed at one ninth, and the
> samples are the chapter's own seeded draw.

The scope disclosure adds that the magnified view is a drawing device, not a second
signal; that each average is drawn at the centre of its window, the convention the
chapter's plotting line uses; and that padding the ends would give them averages at the
price of inventing samples outside the signal, which neither the chapter nor this panel
does.

## The transfer check

> Make the window 25 samples wide. How many averages come out, and what slice of `t`
> would the plotting line need?

276, and `t[12:-12]`: a window 25 samples wide fits in 300 − 25 + 1 = 276 places, and its
centre never sits within 12 samples of either end. `scripts/test_excerpt_checks.cjs`
recomputes both from the panel's own samples. That suite now sets `<code>` spans aside
before its typography scan, so quoted code keeps the ASCII minus it is written with while
prose must still use a true one.

## What was imported from the film, and what was not

The film's MovingAverage scene (`6050-Ch7/STORYBOARD.md`, scene 3: "the nine-wide gold
window, blue samples, green mean point, and readout move as one pair") supplied the
choreography: the window and its average travel together and the curve is written one
window at a time. Not imported: the film's gold window (fixed operators are ink here),
its readout, its narration and its framework. The magnified view, the shrink-and-gather
motion, and the ends question are this panel's own.

## Source digests

Lecture paths are relative to the lecture repository root.

| Source | SHA-256 |
|---|---|
| `chapters/part2/07-filters-convolution.qmd` | `5506b4f0d5c67efc51800b1416951374c1ddc54451866ab0f004d0602800c06d` |
| `6050-Ch7/STORYBOARD.md` | `20c9ea57814657b4ac0756cc1c3e86c3065b968d93477ccec6da357a88130492` |
| `6050-Ch7/ch7-data.js` | `1951641e04287da57f7b08bf19eec8b9d9aa7e6207429c82071c0269b0227531` |
