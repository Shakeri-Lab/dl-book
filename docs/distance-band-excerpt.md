# Distance concentration — `distance-band-excerpt`

An optional, HTML-only mechanism excerpt for Chapter 6, inserted after the
`cell-fig-curse` cell — that is, immediately under the measured curve it explains, and
before the section that names the cure. The PDF is untouched:
`filters/mechanism-excerpts.lua` returns `{}` for any non-HTML format on its first
executable line.

## The question, and the misconception it targets

> Covering 784 dimensions densely would take 9<sup>784</sup> examples, so that route is
> closed. Then use the examples you have and trust the nearest ones — how near is the
> nearest, next to the farthest?

The chapter closes the first door with the counting argument (9, then 9², then 9^d) and
the second with a measurement: at *d* = 784 the average nearest-to-farthest ratio reaches
0.89. The measurement is convincing and completely opaque. A reader is entitled to think
it is a fact about that particular sample, or about `torch.manual_seed(6050)`, or about
300 being too few points.

It is none of those. It is a fact about the cube, and it has a closed form:

- For two points drawn uniformly from the unit cube, the squared distance has mean *d*/6
  and variance 7*d*/180.
- By the delta method the **distance** therefore has variance 7/120 — a constant, no *d*
  in it at all — while its mean grows like √(*d*/6).
- So the *relative* spread of distances is √(0.35/*d*), and 0.35 is 42/120.

Distances grow; their spread does not. The band of distances a cube allows therefore
collapses onto a single value, and it does so at a rate you can write down.

## What moves, and why two frames could not do it

One picture: the whole band of distances between two random points, drawn against the
typical distance, with its two extremes marked *nearest* and *farthest*. The tracked
object is that band, and the motion is its collapse as the dimension climbs the chapter's
own ladder.

Two stills — the band at ten dimensions and the band at five thousand — show a wide
rectangle and a sliver. What they lose is the **rate**: that closing the band by a factor
of ten costs a hundredfold in dimension, which is the reason no quantity of data reopens
it. Watching the edges rush together through 10, 100, 784 and 5000 is watching one over
the square root of *d*.

The reader commits before the reveal: the fourth beat holds with the ratio withheld and
the caption naming 784, and the number arrives only with the band.

## The fixture

| attribute | value | what it is |
|---|---|---|
| `data-dims` | 10 100 784 5000 | four of the chapter's own `dims = [2, 10, 100, 784, 5000]` |
| `data-points` | 300 | the chapter's `P = torch.rand(300, d)` |
| `data-focus` | 784 | the chapter's Fashion-MNIST dimension |
| `data-printed` | 0.89 | "At d=784 the ratio reaches 0.89." |
| `data-spread` | 0.35 | declared: 42/120, the relative variance of the distance |
| `data-extreme` | 2.7131 | declared: the standard normal quantile of 1 − 1/300 |

### Declared computed variants

Nothing here is sampled and no seed is used. The band's edges are placed at the expected
extreme of a sample of the chapter's own size, and everything else follows:

| *d* | band | nearest ÷ farthest |
|---|---|---|
| 10 | 0.49 to 1.51 | 0.33 |
| 100 | 0.84 to 1.16 | 0.72 |
| 784 | 0.94 to 1.06 | **0.89** |
| 5000 | 0.98 to 1.02 | 0.96 |

The value at 784 agrees to the printed digit with the 0.89 the chapter measures. That
agreement is the panel's whole claim, and the suite asserts it: it recomputes the ratio
from the two declarations and requires `ratio(784).toFixed(2) === data-printed`. It also
checks the declared extreme against its definition, using an error-function
approximation rather than trusting the number in the attribute.

## Beats

Duration 40 s, beats `0 5 10 15 20 25 30 35`.

| beat | s | what happens |
|---|---|---|
| 0 | 0–5 | the axis, measured against the typical distance; nothing drawn on it |
| 1 | 5–10 | *d* = 10: the band spans half to one and a half; ratio 0.33 |
| 2 | 10–15 | *d* = 100: the edges rush together; 0.72 |
| 3 | 15–20 | hold: 784 named, ratio withheld |
| 4 | 20–25 | *d* = 784: 0.89, beside the chapter's measured 0.89 |
| 5 | 25–30 | *d* = 5000: a sliver; 0.96 |
| 6 | 30–35 | the *d* = 10 band returns as a dashed outline behind it |
| 7 | 35–40 | the law: width falls as one over the square root of *d* |

Reduced motion holds each beat's finished state, and the suite checks that no still
catches the band between two rungs.

## Palette

The scene has no input, parameter, prediction or target in it — it is a fact about a
cube — so it uses none of those colours. The band is a neutral wash, the two extremes and
the ratio are the book's ink, and the reference outline is scenery grey.

## Teaching boundary

> This is the unconstrained cube, not natural images: the chapter says so plainly, and
> structured data may concentrate near a much lower-dimensional set where near neighbours
> still exist.

The scope disclosure adds two things. First, the band is a **closed-form estimate**, not
the chapter's run: the panel's numbers are what that run should find, and at 784 they
agree to the printed digit, but they are derived, not measured. Second, the ladder starts
at ten because the estimate is a large-*d* one — at the chapter's smallest dimension, two,
the relative spread is 0.42 and the band's lower edge would fall below zero, which marks
the approximation failing rather than a claim about distance. The suite asserts both: that
the band at *d* = 2 would go negative, and that at the first drawn rung it does not.

## The transfer check

> A dataset lives in 784 dimensions but every example actually lies on a smooth
> 12-dimensional surface inside it. Which number governs whether near neighbours still
> mean something — and by roughly how much does the band widen?

The intrinsic 12, not the ambient 784: the spread goes as one over the square root of the
dimension the data actually varies in, so the band is about eight times wider than the
ambient number suggests — √(784/12) = 8.08. That is the chapter's own escape hatch stated
as arithmetic, and it is why representation learning is worth what it is worth.

## What was deliberately not imported

`fig-curse` is a results plot, and `docs/backlog.md` rules those out of this genre; this
panel does not redraw it, does not sample, and prints no curve. The chapter's counting
argument (9, 9², 9^d) appears in the panel's question as the door it closes, and is not
drawn. The Chapter 6 film's treatment of the curse is narration over the same plot and
supplied nothing here.

## Source digests

| Source | SHA-256 |
|---|---|
| `chapters/part1/06-generalization-inductive-bias.qmd` | `9f568a6fa70206ff7f98f9a5637a7a02d1e9ec445a847fd08fbd13745bfb11af` |
