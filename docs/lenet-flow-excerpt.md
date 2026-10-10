# LeNet's tensor, one layer at a time: `lenet-flow-excerpt`

An optional, HTML-only mechanism excerpt for Chapter 8's "LeNet: the whole machine",
placed after the paragraph that states the rhythm, *convolve, shrink, deepen; repeat;
then decide*, and before the `lenet` cell. The PDF is untouched.

## The question

> The text says the maps shrink 28 → 14 → 5. The second convolution has no padding: what
> size does it hand to the second pool?

The paragraph rounds the size path to three numbers; the code's shape comment says
`(N,6,14,14)->(N,16,10,10)`. Asking for that 10 makes the reader run @eq-outsize on the
one layer where padding is absent, and so see which layers change the size (pools, and
windows without padding) and which change the depth (convolutions: one map per kernel).

## What moves

One picture: each tensor as a glass box, face in proportion to height and width, depth to
channels, then the dense head as bars in proportion to their length. The newest tensor
grows out of the one before it at every layer; arrows name the operation and, in orange,
the learned count (6 kernels, 16 kernels, 120 × 400, 84 × 120, 10 × 84). A line under the
backbone evaluates the output-size formula for the layer at work: ⌊(28 + 4 − 5) / 1⌋ + 1 =
28, ⌊(28 + 0 − 2) / 2⌋ + 1 = 14, ⌊(14 + 0 − 5) / 1⌋ + 1 = 10 (withheld first),
⌊(10 + 0 − 2) / 2⌋ + 1 = 5, then flatten 16 × 5 × 5 = 400. The last frame reads the two
paths: size 28 → 28 → 14 → 10 → 5, depth 1 → 6 → 6 → 16 → 16.

## Fixture

| attribute | value | what it mirrors |
|---|---|---|
| `data-input` | 1, 28 | `(N,1,28,28)` |
| `data-convs` | (6, 5, 2), (16, 5, 0) | `nn.Conv2d(1, 6, 5, padding=2)`, `nn.Conv2d(6, 16, 5)` |
| `data-pool` | 2 | `F.max_pool2d(..., 2)` |
| `data-head` | 120, 84, 10 | `fc1`, `fc2`, `fc3` |

Every shape is computed and matches the cell's shape comments. The transfer check's
48,120 is fc1's 48,000 weights and 120 biases from the parameter audit, against its 2,572
convolutional parameters.

## Beats

Duration 40 s, beats `0 5 10 15 20 25 30 35`: input; conv1; pool; predict conv2's size
(withheld); 10 × 10; pool; flatten and the dense head; the two paths. No control. Reduced
motion holds each beat's finished state.

## Palette

Blue input, green computed tensors, orange learned counts and weight shapes, neutral
arrows. ReLU is named on arrows, not drawn: it changes no shape.

## Source digests

| Source | SHA-256 |
|---|---|
| `chapters/part2/08-cnn.qmd` | `2aa9b85bf5c293aeb9c52f8ea091feb458c734ee50f0ac72316140be8d938f68` |
