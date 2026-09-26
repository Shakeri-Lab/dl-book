# Shift versus shuffle — `shift-shuffle-excerpt`

*2026-09-25:* the summary now reads "Watch the mechanism: retrained scramble versus
zero-shot slide", and the question, the slide beat's caption, the scope note, and the
lesson name the protocol behind each comparison, matching the chapter's protocol matrix.
The animation, fixture, and timeline are unchanged.

An optional, HTML-only mechanism excerpt for Chapter 6, inserted before the level-2
heading `Inside the weights: full-frame matched filters` (retitled from `The autopsy, in pictures` on 2026-09-25) — that is, after both experiments and the diagnosis
they share, and before the chapter turns to the fitted weights. The PDF is untouched:
`filters/mechanism-excerpts.lua` returns `{}` for any non-HTML format on its first
executable line.

## The question, and the misconception it targets

> Scrambling every pixel position cost the retrained model nothing; sliding the image two
> pixels nearly halved it. Both rearrange the same pixels — why is only one of them free?

The chapter's two experiments land as a pair of surprises and the chapter reads them
together, correctly, as a statement about inductive bias. What it does not do — because
it is a chapter about generalization, not about arithmetic — is show the one line of
algebra underneath, which is small enough to draw:

- A **common permutation** applied to the weights as well as the pixels leaves
  $\sum_i w_{\sigma(i)} x_{\sigma(i)} = \sum_i w_i x_i$. Every term survives. Only the
  order of the addition changed, and addition does not care.
- A **shift** applied to the pixels alone leaves the weights where they were, so every
  term is a *different product*. The sum is not reordered; it is rebuilt.

The misconception the scene targets is the natural one: that both operations "move the
pixels around", so a model indifferent to one should be indifferent to the other. They are
not the same kind of move at all, and a reader who sees why will also see why the shuffle
experiment has to retrain and the shift experiment must not.

## What moves, and why two frames could not do it

One picture: a row of pixel bars, a row of weight bars beneath them, the product of each
pair beneath that, and the sum drawn as a length. The tracked object is a **column** — a
pixel, its weight and their product, travelling together.

Under the permutation, every column slides to a new slot **with its product intact**: the
product bars cross the picture and not one of them changes height. Under the slide, the
pixel bars move alone, the product row empties while the pairings are in flight, and a
different set of product bars rises when they land.

Two stills would show two scores, 0.39 and 1.40, and lose the only thing that decides the
question: whether the terms that made the first total are the same terms that made the
second. That is a claim about identity over time, and a still cannot carry it.

Both reveals are withheld. The score reads `·` through the two beats whose captions ask
for a prediction, and the score bar is removed with it, so there is nothing to read ahead.

## The fixture

The chapter prints two accuracies and no weight, so the row is a **declared schematic**
and the panel prints no accuracy at all. The two operations are the chapter's own.

| attribute | value | what it stands for |
|---|---|---|
| `data-weights` | 0.9, −0.4, 0.2, 0.7, −0.6, 0.3, 0.8, −0.1 | one dense unit's weights, declared |
| `data-pixels` | 0.2, 0.9, 0.1, 0.6, 0.8, 0.3, 0.7, 0.4 | eight pixels in place of the chapter's 784 |
| `data-permutation` | 4 0 6 2 7 1 5 3 | one fixed scrambling, declared; the chapter's is `torch.randperm(784)` |
| `data-shift` | 2 | the chapter's own `for px in [0, 2]` |

### Declared computed variants

| quantity | value |
|---|---|
| products in place | 0.18, −0.36, 0.02, 0.42, −0.48, 0.09, 0.56, −0.04 |
| score in place | 0.39 |
| score under the common permutation | 0.39, exactly — the same eight products, reordered |
| products after `shift_right` by two | 0.00, 0.00, 0.04, 0.63, −0.06, 0.18, 0.64, −0.03 |
| score after the slide | 1.40 |

The suite recomputes all of these from the declared row and checks the stronger claim as
well: the *multiset* of products under the permutation is identical, not merely the total.

## Beats

Duration 40 s, beats `0 5 10 15 20 25 30 35`.

| beat | s | what happens | score |
|---|---|---|---|
| 0 | 0–5 | pixels and weights, no products yet | · |
| 1 | 5–10 | each pair multiplied, the products drawn, the sum measured | 0.39 |
| 2 | 10–15 | hold: scramble the positions and retrain — predict | withheld |
| 3 | 15–20 | every column slides to a new slot, product and all | 0.39 |
| 4 | 20–25 | back in place; now slide only the pixels — predict | withheld |
| 5 | 25–30 | the pixels move two right, zeros enter, products remade | 1.40 |
| 6 | 30–35 | the score in place returns as a dashed reference bar | 1.40 |
| 7 | 35–40 | hold | 1.40 |

Reduced motion holds each beat's finished state; the suite checks that no column is caught
off the grid in a still.

## Palette

Blue is the pixel input, orange the learnable weights, green the score they produce. The
product belongs to neither row, so it is drawn in the picture's neutral ink. The empty
slots the slide leaves are drawn as small hollow rings rather than bars of height zero,
which would read as a measurement; the reference the comparison beat keeps is scenery
grey and dashed.

## Teaching boundary

> This is one unit's arithmetic, not the chapter's experiment: nothing here is trained, no
> accuracy is measured, and the eight weights and pixel values are a declared schematic row
> standing in for 784.

Three qualifications sit in the scope disclosure. **The permutation is free only because
it is applied to the weights as well** — which is what retraining on a scrambled world
does; permuting the pixels of an already fitted model breaks the pairing exactly as a
shift does, and that is what the transfer check asks. **The slide is one-dimensional
here**: a real 28 × 28 image flattened to 784 moves each pixel two positions *within its
row*, not two positions along the flat vector, and the row drops that detail to keep the
re-pairing visible. **Nothing here says how much accuracy either change costs**: the
chapter measures that, and the cost depends on what the fitted weights were doing.

## The transfer check

> Take the fitted model and permute only the validation pixels, leaving the weights as
> they were. Would that cost accuracy — and does a convolutional layer share the dense
> layer's indifference to a common permutation?

Yes, and no. Permuting the pixels alone re-pairs every term exactly as a shift does, so
the score changes and the accuracy collapses; the shuffle experiment is free only because
it retrains. A convolution is not permutation-indifferent at all: its weights are tied to
relative positions, so scrambling the grid destroys the adjacency it exists to exploit —
which is the point Chapter 7 is about to make. `scripts/test_excerpt_checks.cjs` verifies
the arithmetic behind the first half: permuting both rows is free to machine precision,
and permuting the pixels alone is not.

## What was deliberately not imported

The Chapter 6 film animates the shift cliff and the shuffle result as measured curves, and
`docs/backlog.md` rules results plots out of this genre; none of that appears. No accuracy
is drawn, no model is trained, and the chapter's own figures — the shift cliff, the
templates, the U-curve — are left where they are.

## Source digests

| Source | SHA-256 |
|---|---|
| `chapters/part1/06-generalization-inductive-bias.qmd` | `0111700a6d30908b5324701f5cbb776b35ede4354b11b715825149e55a0c30ff` |
