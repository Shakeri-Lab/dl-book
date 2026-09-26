# Search under a budget — `halving-budget-excerpt`

An optional, HTML-only mechanism excerpt for the Trainer interlude, inserted before the
level-2 heading `Train, validation, and test have different jobs` and therefore
immediately after the successive-halving passage and the assumption the interlude states
about it. The PDF is untouched: `filters/mechanism-excerpts.lua` returns `{}` for any
non-HTML format on its first executable line.

The nearer heading, `A practical search order`, sits inside a `::: {.callout-tip}` block.
An anchor there would place the panel inside a callout, so the split section's heading is
the anchor instead; the integration test asserts both facts, so the reason survives.

## The question, and the misconception it targets

> Twenty-seven configurations, each deserving twenty-seven epochs, is 729 epoch-units.
> Successive halving still takes one of them all the way to 27 epochs. What does it spend?

The intuition a reader arrives with is that a cheap search is a *smaller* search — that
screening twenty-seven candidates properly must cost something close to training
twenty-seven candidates. The interlude's numbers say otherwise, and say it in one line:

> With resumed checkpoints, the cost is $27+9(2)+3(6)+1(18)=81$ epoch-units. Training all
> 27 for 27 epochs would cost 729.

What the expression does not show is *why* those four terms are nearly equal. They are
equal because the two factors move in opposite directions at the same rate: each round
keeps a third of the survivors and triples their budget, so the number of survivors times
their cumulative budget is 27 at every rung — 27 × 1, 9 × 3, 3 × 9, 1 × 27. The method is
not "spend less"; it is "spend the same each round, on ever fewer candidates, for ever
longer". That is a statement about a product, and a product is an area.

## What moves, and why two frames could not do it

One picture: configurations across the bottom, epochs up the side, so every rectangle's
**area is the epoch-units it costs**, and the whole 27 × 27 square is the 729 the
interlude names as the alternative. The tracked object is the frontier — the width of the
surviving population — drawn as a blue rule across the top of the paid staircase.

Each round has two halves and the picture does them in that order: in the first three
tenths of a beat the frontier narrows to a third of its width, and in the remaining seven
tenths the block behind it climbs. Width is traded for height in front of the reader, and
the area that results is the same each time.

Two stills — an empty square and a finished staircase — show the final allocation and lose
the trade that produced it. They also lose the running total: the fifth beat holds with
63 spent, one survivor left, and the answer withheld, so the reader commits before 81
appears.

## The fixture

Everything is recomputed from the `data-*` attributes on the panel root. The per-round
costs are derived from the schedule, not retyped.

| attribute | value | what the interlude says |
|---|---|---|
| `data-configs` | 27 | "27 configurations run for one epoch" |
| `data-rungs` | 1 3 9 27 | "nine continue to a cumulative three, three continue to nine, and one continues to 27" |
| `data-keep` | 27 9 3 1 | the same sentence, read as counts |
| `data-total` | 81 | `$27+9(2)+3(6)+1(18)=81$ epoch-units` |
| `data-full` | 729 | "Training all 27 for 27 epochs would cost 729" |

### Declared computed variants

| quantity | how it is derived | shown as |
|---|---|---|
| per-round cost | `keep[r] × (rungs[r] − rungs[r−1])` | 27, 18, 18, 18 — the chapter's four terms, one at a time |
| running total | partial sums of the same expression | 27, 45, 63, 81 |
| the rung invariant | `keep[r] × rungs[r]` | 27 at every rung |
| the ratio | 729 ÷ 81 | nine |

The chapter prints the expression and its value; it does not print the intermediate
totals, the per-round costs on their own, or the invariant. The picture prints no measured
result of any kind.

## Beats

Duration 40 s, beats `0 5 10 15 20 25 30 35`.

| beat | s | what happens | spent |
|---|---|---|---|
| 0 | 0–5 | the empty square: what training everything would cost | · |
| 1 | 5–10 | every configuration runs one epoch | 27 |
| 2 | 10–15 | the frontier narrows to nine; their budget reaches three | 45 |
| 3 | 15–20 | narrower and taller again: three configurations to nine epochs | 63 |
| 4 | 20–25 | hold: one survivor, about to run to the full depth | 63 |
| 5 | 25–30 | the survivor climbs to 27 epochs | 81 |
| 6 | 30–35 | the square lights: 729 for training all of them in full | 81 |
| 7 | 35–40 | the staircase is one ninth of the square | 81 |

Reduced motion holds each beat's finished state, so no block is caught part-grown.

## Palette

This scene has no model in it, so it has no blue input, no orange parameter and no green
prediction to colour. The paid budget is a neutral slate `#3f4a5f`; the frontier — the one
thing the reader tracks — is the book's blue `#2b6cb0`; the square that was never spent is
the pale scenery grey. Using a role colour here would claim a role the picture does not
have.

## Teaching boundary

> The saving assumes early rank predicts late rank well enough; a slow-starting
> configuration can be pruned before its advantage appears, which is why pruning policy is
> part of the method and must be logged.

That sentence is the interlude's own, and it is the visible one. The scope disclosure adds
three things. Nothing here is trained and no configuration is better than another: the
columns are places in a budget, not results, and which third survives is deliberately
unlabelled — the survivors are drawn at the left only so the staircase reads as one shape.
The staircase is the cost *with resumed checkpoints*, the interlude's own assumption;
without them the same schedule would pay the whole cumulative budget every round and the
four rungs would cost 27 each. And the square is drawn at the same scale as the staircase
precisely so that the comparison is area against area rather than a pair of numbers.

## The transfer check

> Same rule — keep a third, triple the budget — but start from 81 configurations at one
> epoch. How many rounds until one survives, what budget does it reach, and what does the
> whole search cost?

Five rounds, 81 epochs, 297 epoch-units. Counts 81, 27, 9, 3, 1 against budgets 1, 3, 9,
27, 81 give rounds of 81, then 54 four times. Training all 81 for 81 epochs would cost
6561, so the saving grows from nine times to about twenty-two. The point the check tests
is that the saving is not a fixed factor: it grows with the size of the space, because the
staircase adds one rung while the square squares.
`scripts/test_excerpt_checks.cjs` rebuilds the whole schedule from the panel's own
`data-keep` and recomputes all five numbers.

## What was deliberately not imported

No lecture film covers successive halving, so the choreography here is this panel's own.
The interlude's own figures — the experiment cycle and the BatchNorm learning-rate study —
are results, and `docs/backlog.md` rules results plots out of this genre; nothing from
them appears. No seed panel, no learning curve, and no claim that the survivor is the best
configuration.

## Source digests

| Source | SHA-256 |
|---|---|
| `chapters/interludes/learning-by-experiment.qmd` | `9936c4d81a249da9c2d393dbe27a1cf06faebb29923610d896eec3e21e67f17c` |
