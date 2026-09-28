# Two 3 × 3s see what one 5 × 5 sees: `stacked-sight-excerpt`

An optional, HTML-only mechanism excerpt for Chapter 9's "Question 1: why 5 × 5? Stack
small kernels instead", placed after the paragraph ending "Same sight, fewer parameters,
more nonlinearity." and before the `kernel-economics` cell. The PDF is untouched.

## The question

> Two 3 × 3 convolutions are stacked. How much of the input can one output of the second
> layer see, and what does that sight cost against a single kernel?

The chapter asserts the equal receptive field by recalling Chapter 8's ledger; the motion
shows why. Traced back from one output pixel, the second convolution reads a 3 × 3 window
of the hidden map, and each of those nine hidden pixels read its own 3 × 3 window of the
input. Their union, swept one window at a time, is 5 × 5: 3 + (3 − 1). The single 5 × 5
kernel then lands on the same patch. Only after that does the cost question come.

## What moves

Two rows: input, hidden map and output for the stack; input and output for the single
kernel, each on a 7 × 7 crop (padding keeps every map's size, as in the cell). The tracked
object is the output pixel's receptive field. The kernels on the arrows are drawn as their
weights, one orange square each; the cost beat counts them at one pace for both rows, so
the stack's 18 run out while the single kernel counts on to 25. The totals are the cell's
printed counts at C = 32, biases included: 18,496 against 25,632; 1 − 18 / 25 is the
chapter's 28%. The last beat adds the ReLU count, two against one.

## Fixture

| attribute | value | what it mirrors |
|---|---|---|
| `data-small`, `data-large` | 3, 5 | `two_3x3` and `one_5x5` |
| `data-channels` | 32 | `C = 32` |
| `data-crop` | 7 | declared: the drawn crop around one output pixel |

The frozen output of `kernel-economics` prints "one 5x5:  25,632 parameters" and "two
3x3s: 18,496 parameters"; the suite recomputes both from the declared sizes.

## Beats

Duration 40 s, beats `0 5 10 15 20 25 30 35`: ask; the hidden window; the sweep back to
the input (5 × 5); the single 5 × 5 on the same patch; predict the cost (withheld); count
the squares; totals at C = 32; the ReLU count. No control. Reduced motion holds each beat's
finished state.

## Teaching boundary

> Equal sight is about which input pixels can reach an output, not about computing the
> same function.

The scope repeats the chapter's caveat: the saving assumes constant width through the
stack.

## Source digests

| Source | SHA-256 |
|---|---|
| `chapters/part2/09-modern-cnns-transfer.qmd` | `ac7e7793f742f0f7d8b4a7a641f667c2c1d9941a2b68b8018fe2195e38f814c1` |
