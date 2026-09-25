# Branch accumulation — `branch-blame-excerpt`

An optional, HTML-only mechanism excerpt for Chapter 5, inserted before the level-2
heading `` `torch.autograd` in practice: five rules `` and therefore immediately after the
scalar engine and its check, and immediately before **Rule 2 — gradients accumulate.**
The PDF is untouched: `filters/mechanism-excerpts.lua` returns `{}` for any non-HTML
format on its first executable line.

## The question, and the misconception it targets

> The chapter's squared error writes `a` twice, so blame comes back to it along two
> edges. Does the counter on `a` end up holding one arrival or the sum of both?

A reader who has followed the chain rule down a single path expects blame to arrive once
per node: the node's gradient *is* the derivative along "the" path back to the loss. The
chapter's own check quietly breaks that expectation on one line —

```python
loss = (a + (-0.3)) * (a + (-0.3))      # squared error vs target 0.3
```

— because `a` is a parent of two different nodes. The engine printed just above it
handles this with a single character:

```python
self.grad += out.grad                   # not  self.grad = out.grad
```

That `+=` is the multivariable chain rule, not a convenience. If it were `=`, the second
arrival would overwrite the first, and the chapter's `dL/dw` would print 0.168900 instead
of 0.337801 — exactly half. The factor of two in the derivative of a square is *made of*
the two arrivals.

`one-chain-excerpt`, in the same chapter, names branch accumulation as the thing it does
not show. This scene is that gap, and only that gap: it begins at `a` and puts the trunk
back only at the last beat, so the arithmetic can land on the number the chapter prints.

## What moves, and why two frames could not do it

One picture: the graph from `a` down, and a meter under it holding the counter on `a`.
The tracked object is a single wine packet of blame. It leaves the product node, travels
one branch's channel, and is **absorbed into the meter**, which grows by the amount the
packet carried. Then a second packet travels the other channel and is absorbed into the
*same* meter, which grows **again** rather than restarting.

The first and last frames side by side show an empty meter and a full one. They cannot
show that the full one was written twice, which is the entire mechanism — and they cannot
distinguish "one arrival of 0.8219" from "two arrivals of 0.4109", which is precisely the
confusion the scene exists to remove. The absorption is timed to be the addition: a packet
travels for the first seven tenths of its beat and the meter fills over the remaining
three, so the growth and the arrival are one event. A packet exists only while it is on
its way; once absorbed it is gone, because what it carried is now the meter's length.

The reader is asked to commit before the reveal. The fourth beat holds with one packet
landed and one still standing at the product node, the counter reading 0.4109, and the
total is on no part of the picture until the fifth beat lands it.

## The fixture

Everything is recomputed from the `data-*` attributes on the panel root — the one in-repo
mirror of the manuscript — using the chapter's own value of `e`. Nothing is retyped.

| attribute | value | chapter literal it mirrors |
|---|---|---|
| `data-w` `data-x` `data-bias` | 0.7, 2, −0.5 | `w, x, b = Value(0.7), Value(2.0), Value(-0.5)` |
| `data-target` | 0.3 | `loss = (a + (-0.3)) * (a + (-0.3))` |
| `data-e` | 2.718281828459045 | `s = 1 / (1 + 2.718281828459045 ** (-self.data))` |
| `data-uses` | 2 | the same line, which writes `a` twice |
| `data-printed` | 0.337801 | the frozen stdout of `micro-autograd-check` |

The two accumulation rules the scene draws are the chapter's own, quoted in the manifest
as literals: `self.grad += out.grad` (the add node, which passes blame through unchanged)
and `self.grad += other.data * out.grad` (the product node, which sends each factor the
*other* factor's value). The seed is `self.grad = 1.0`.

### Declared computed variants

The chapter executes this forward pass but prints only the gradient, so every intermediate
below is computed here, not transcribed.

| quantity | how it is derived | shown as |
|---|---|---|
| `a` | σ(0.7 × 2 − 0.5) with the chapter's `e` | 0.7109 |
| `a − 0.3` | on both add nodes | 0.4109 |
| loss seed | the engine's `self.grad = 1.0` | `grad 1` |
| counter after one arrival | the product rule hands the upper branch the lower branch's value | 0.4109 |
| counter after two | `self.grad += …` applied twice | 0.8219 |
| σ′(z) | a(1 − a), the sigmoid's own slope | 0.2055 |
| `dL/dw` | 0.8219 × 0.2055 × 2 | 0.3378 — the chapter prints 0.337801 |
| the counterfactual | the same trunk from a single arrival | 0.1689, struck |

The loss's own forward value is deliberately never drawn: only its seed of 1 enters the
backward pass, and printing 0.1689 as a loss beside 0.1689 as a counterfactual gradient
would collide on the page for two unrelated reasons.

## Beats

Duration 40 s, beats `0 5 10 15 20 25 30 35`, declared once on the pane and mirrored in
`interactives/manifest.json`.

| beat | s | what happens | what is on the picture |
|---|---|---|---|
| 0 | 0–5 | the graph, the counter empty | `0.7109`, `0.4109` twice |
| 1 | 5–10 | the loss is seeded | `grad 1` |
| 2 | 10–15 | the first packet travels the upper channel and is absorbed | counter `0.4109` |
| 3 | 15–20 | hold: the second packet waits at the product node | counter still `0.4109` |
| 4 | 20–25 | the second packet travels and is absorbed into the same meter | counter → `0.8219` |
| 5 | 25–30 | a hollow bar slides back to `0.4109`: what assignment would have kept | the counterfactual |
| 6 | 30–35 | the trunk, `× 0.2055 × 2` | `∂L/∂w = 0.3378` |
| 7 | 35–40 | the comparison stands | `assignment: 0.1689`, struck |

Reduced motion holds each beat's **finished** state, so the still a reader sees is the one
its caption describes. No packet survives a still except at beat 3, whose caption says one
is waiting, and there it stands at the start of its channel rather than part-way along.

## Palette

Green `#2f855a` is the activation the chapter computes and the two nodes carrying its
shifted value; purple is the target 0.3 in the formula; wine `#722f37` is blame — the
channels, the packets, the meter and the gradient it produces; grey is the forward graph,
the trunk factor and the counterfactual. Orange appears nowhere on the picture: `w` is
learnable, but this scene never draws it, and the only orange in the panel would have been
a weight it does not show.

## Teaching boundary

> This is the backward pass of one already-written expression: nothing here is trained, no
> weight is updated, and the forward values are the chapter's own.

The scope disclosure adds three qualifications. First, the picture starts below the
neuron; the forward chain from `w`, `x` and `b` is `one-chain-excerpt`'s subject and the
trunk returns here only as one grey factor. Second, the two add nodes are drawn apart
because the chapter's line evaluates `(a + (-0.3))` twice and the engine therefore builds
two nodes — written once and squared, it would be one node with the same parent recorded
twice, and the accumulation would be identical, because the product rule adds one
contribution per recorded use and not one per line of source. Third, the hollow bar is a
counterfactual and is struck wherever its number is written, so it can never be read as a
result.

## The transfer check

> Change one digit so the second subtraction takes 0.1 away instead of 0.3 — the same
> activation, two different targets. What does the counter on `a` read now, and is it
> still twice one branch?

1.0219, and no. The product rule sends each branch the *other* branch's value, so the
upper edge carries 0.6109 = a − 0.1 and the lower carries 0.4109 = a − 0.3, and the counter
holds their sum, 1.0219. Doubling was never the rule; it was what equal branches happened
to give. The trunk then prints 1.0219 × 0.2055 × 2 = 0.4200 instead of 0.3378.
`scripts/test_excerpt_checks.cjs` recomputes all five of those numbers from the panel's
own attributes, and asserts that the moved target really does break the doubling.

## What was deliberately not imported

The Chapter 5 film's backward-pass scene colours the whole backward sweep orange; this
panel keeps orange for learnable parameters only and gives blame its own wine, as rule 7
of `docs/animation-authoring.md` requires. No film chrome, narration or framework is used,
and the choreography here — a channel per branch and one meter — is this panel's own,
because no film scene draws accumulation.

## Source digests

| Source | SHA-256 |
|---|---|
| `chapters/part1/05-backpropagation.qmd` | `fd3825ae9747ff6305ddb7f434fc0513d3d828d3fd878d8ea6a00cea8eee9b86` |
