# Counting the window's stops: `out-size-excerpt`

An optional, HTML-only mechanism excerpt for Chapter 8's "Padding and stride: the
bookkeeping with a payoff", placed after the paragraph that reads @eq-outsize aloud ("the
numerator is the padded length minus the window ... $+1$ counts the starting position")
and before the `shapes` cell that checks it. The PDF is untouched.

## The question

> A window 3 wide slides along a row of 8. With a border of one zero on each side and a
> stride of 2, how many stops does it make?

The formula is read as a count, not memorized: the travel `n + 2p − k` is how far the
window's left edge can move, the floor of travel over stride counts whole hops, and the
+1 is the starting position. One dimension carries it because the formula acts on each
axis separately.

## What moves

One row of 8 input cells, a dashed border of zeros that fades in, and a window 3 wide that
slides, writing one green output per stop. A ruler under the row spans the travel and
ticks once per hop. The three regimes are the `shapes` cell's: (p, s) = (0, 1) gives
⌊5 / 1⌋ + 1 = 6, (1, 1) gives ⌊7 / 1⌋ + 1 = 8, (1, 2) gives ⌊7 / 2⌋ + 1 = 4. At stride 2 the
count is withheld while the caption asks, then the window hops, and the one padded cell no
window starts from is hatched: that is the floor.

## Fixture

| attribute | value | what it mirrors |
|---|---|---|
| `data-n`, `data-k` | 8, 3 | `x8 = torch.randn(1, 1, 8, 8)`, `torch.randn(1, 1, 3, 3)` |
| `data-regimes` | (0, 1), (1, 1), (1, 2) | `for p, s in [(0, 1), (1, 1), (1, 2)]:` |

Every count is what the cell prints for the formula and for torch. The transfer check's
14 is the formula at n = 28, k = 3, p = 1, s = 2.

## Beats

Duration 40 s, beats `0 5 10 15 20 25 30 35`: ask; no padding (6); the border added
(travel 7); padding at stride 1 (8); predict at stride 2 (withheld); the answer with the
floor (4); the three regimes side by side; summary. No control. Reduced motion holds each
beat's finished state.

## Palette

Blue input cells, dashed grey zeros, a neutral window and ruler, green outputs.

## Source digests

| Source | SHA-256 |
|---|---|
| `chapters/part2/08-cnn.qmd` | `1c6627aaabb366b100f755118506c331bb86b2525690a369d57ca20e5f4f605b` |
