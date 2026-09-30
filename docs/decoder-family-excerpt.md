# Reconstruction pins the codes, not the space between them: `decoder-family-excerpt`

**Author-approved, September 29, 2026.** After reviewing the build and the revisions recorded below, the author asked to "commit and push".

An optional, HTML-only mechanism excerpt for the autoencoder interlude
(`chapters/interludes/making-pca-learnable.qmd`, "A code is not yet a distribution"). Its
anchor is `before-cell` on `decoder-ambiguity-audit`: the filter inserts the panel before
that cell's Plan → Code wrapper, directly after the sentence "The reconstructions agree on
every observed code, yet disagree elsewhere." The PDF is untouched:
`filters/mechanism-excerpts.lua` returns `{}` for any non-HTML format on its first
executable line.

The author scoped this scene among four on September 28, 2026 (with `detach-cut`,
`gru-blend` and `flat-line`) and asked for all four to be built.

## The question, and the misconception it targets

> Every decoder g_a(z) = z² + a z(z² − 1) reproduces the three observed codes. As the
> multiple a changes, does the reconstruction error move, and how far can the decoded value
> at the unsupported draw z = 0.5 travel?

The chapter's figure shows two decoders, g₁ and g₂, which read as two special cases. A
reader may take away that reconstruction training prefers one of them, or that it pins the
decoder down up to a small ambiguity. The anchor sentence already says that the two
disagree somewhere, so the question is about the whole family and about how far the value
at z = 0.5 can go. The motion answers it: a continuous family in which every member has
zero error at the codes, while the value at the draw slides along 0.25 − 0.375a for as long
as a moves, with no bound in either direction.

## What moves, and why two frames could not do it

One picture: the latent code z across, the decoded value up. Three purple rings stand at
the observed codes and their targets, (−1, 1), (0, 0) and (1, 1); a dashed ink line is the
unsupported draw z = 0.5. The tracked object is the decoded curve g_a in green, with a
green dot where it crosses the draw line and that value written beside it. In the second
beat the term z(z² − 1) is drawn dashed, its three zeros ringed on the zero line: exactly
the codes. Then the multiple sweeps 0 → 0.8 → −0.8 → 0. The curve swings between and
beyond the codes while every ring stays on it, the wine label "error at the codes: 0" never
changes, and the dot slides up and down the draw line. The curve leaves a dotted ghost at
each end of the sweep; once it is home, a bracket on the draw line marks the values the two
ghosts reached, and arrows then extend the bracket beyond both ends. Every curve is a cubic
in z, so each is drawn as one cubic Bezier segment, which is the curve itself rather than a
sampling of it; the suite reads each segment back through the axes the rings define.

Two frames are the chapter's figure again: two members, one agreeing and one disagreeing
at z = 0.5. They lose what the motion carries: that every member in between passes the
rings too, so the ambiguity is a continuum and not a pair; that the value at the draw moves
steadily with a and would keep moving past either end; and that the error at the codes
stays exactly zero throughout. The dial lets the reader try any multiple in the sweep.

## The fixture

| attribute | value | what it mirrors |
|---|---|---|
| `data-codes` | `-1 0 1` | `observed_codes = torch.tensor([-1.0, 0.0, 1.0])`; the prose's `$z\in\{-1,0,1\}$` |
| `data-multiple` | `0.8` | `g_2(z)=z^2+0.8z(z^2-1).` and the cell's `decoder_two` |
| `data-sweep` | `-0.8 0.8` | the dial's range and the two ends of the timeline's sweep: the chapter's 0.8 and its declared mirror |
| `data-draw` | `0.5` | `random_code = torch.tensor(0.5)` |
| `data-grid` | `-1.45 1.45` | `latent_grid = torch.linspace(-1.45, 1.45, 400)`: the range every curve is drawn over |
| `data-evidence-class` | `computed` | every drawn number is computed from the attributes above |

The targets are the codes squared, 1, 0 and 1, computed as the cell computes
`observed_targets = observed_codes.square()`. The chapter literals the manifest binds are
the sentence naming the codes and g₁, the line "of a function that vanishes at all three
codes:", g₂'s display, and the cell's `latent_grid`, `observed_codes` and `random_code`
lines. The suite also reads the cell's frozen output (`largest decoder gap at observed
codes: 0.0`, `g1(0.5): 0.25`, `g2(0.5): -0.05`) and recomputes all three from the panel.

### Declared computed variants

| quantity | how it is derived | value |
|---|---|---|
| the family | g_a(z) = z² + a z(z² − 1), a over the declared sweep | holds g₁ (a = 0) and g₂ (a = 0.8) |
| the targets | the codes squared | 1, 0, 1 |
| error at the codes | the largest gap between g_a and the targets at the codes | 0 for every a (the cell prints 0.0) |
| the term at the draw | 0.5 × (0.25 − 1) | −0.375 |
| the value at the draw | g_a(0.5) = 0.25 − 0.375a | 0.25 at a = 0 (the cell's g1), −0.05 at 0.8 (its g2), 0.55 at −0.8 |
| the family on the grid | the sweep's ends at their extremes | −0.128 to 3.381, inside the drawn axis |

The decoded-value axis runs from −0.7 to 3.45 and the arrows are 30 units long (26 on a
phone); these are drawing devices, and no number on the picture comes from them. The axis
labels only 0 and 1, the two target values. The transfer check's −0.375 and its term
z(z² − 1)(z − 0.5) are listed in the manifest's computed variants.

## Beats

Duration 40 s, beats `0 5 10 15 20 25 30 35`.

| beat | s | what happens |
|---|---|---|
| 0 | 0–5 | the rings, z² through them, the draw line with 0.25 |
| 1 | 5–10 | the term z(z² − 1) dashed, its zeros ringed at the codes; "error at the codes: 0" appears |
| 2 | 10–15 | predict, held still: only z² and 0.25; no ghost, bracket or other value, drawn or spoken |
| 3 | 15–20 | the reveal: a glides 0 → 0.8 (15.0–17.8 s), the rings stay on the curve, the value slides to −0.05 |
| 4 | 20–25 | a ghost stays at 0.8; a glides to −0.8 (20.0–22.8 s); the value slides to 0.55 |
| 5 | 25–30 | a second ghost stays at −0.8; a glides home (25.0–27.8 s); the bracket marks −0.05 to 0.55 |
| 6 | 30–35 | arrows extend the bracket beyond both ends (30.0–31.2 s): no limit at z = 0.5 |
| 7 | 35–40 | the family at rest, the rings drawn heavier: pinned at the codes and nowhere else |

There is one caption per beat, except that beats 3 and 4 each split theirs so that a value
is stated only once the dot has arrived: "The multiple a rises from 0 to 0.8. Watch the
rings, and the value at z = 0.5." (15.0 s), then "At a = 0.8, the chapter's second decoder:
still zero error, and z = 0.5 decodes to −0.05." (17.8 s); "Now the multiple swings the
other way, down to a = −0.8." (20.0 s), then "At a = −0.8: zero error again, and z = 0.5
decodes to 0.55." (22.8 s). Each stands at least 2.2 s. The withholding is tested from the
DOM at 0.1 s steps from 10 s to 15 s: the drawing, the picture's `aria-label`, and both the
scrubber's and the dial's `aria-valuetext` name no value at the draw but 0.25, no other
multiple and no range, and the multiple stays at 0 until 15 s.

Reduced motion holds each beat's finished state: 0, 0, 0, 0.8, −0.8, 0, 0, 0 for the
multiple, with the term, ghosts, bracket, arrows and heavier rings of that beat's end.

The multiple a is the scene's one parameter control (rule 1's amendment), orange because it
is a decoder parameter: a real range from −0.8 to 0.8 in steps of 0.05, ticks at −0.8, 0
and 0.8, the readout "a = 0.00", the name "Multiple a of the vanishing term" and value text
such as "a = 0.80: zero error at the codes; z = 0.5 decodes to −0.05." It is disabled and
hidden until the player mounts. The timeline drives it; dragging pauses playback and redraws
the picture at the dragged multiple over the scenery the timeline has reached, with the two
ghosts' values set aside so the live value is never covered; any timeline action (play from
a pause, a scrub, an arrow-key beat) returns to the timeline's own multiple; its keys never
reach the pane's beat seeking. While dragged, the caption reads "Any multiple a keeps the
curve on all three codes; between and beyond them it moves." and the live values are spoken
only by the dial.

## Palette

Purple is the observed targets (the rings, and the word "observed"), green the decoded
curve, its dot and its value at the draw, orange the multiple a (the dial and the formula's
a), and wine the error. The term, the draw line, the ghosts, the bracket and its arrows are
neutral ink, told apart by dash pattern and weight; the axes are grey. The chapter's
matplotlib figure draws g₁ in its house navy, g₂ in its house orange, the encoded
observations green and the draw wine; this panel follows the book's palette instead, so
orange stays with the learnable multiple and green with the decoded value.

## Teaching boundary

> This family is the chapter's pencil example; a trained decoder is some other function,
> constrained by reconstruction only where codes were observed.

The scope disclosure adds that the family holds the chapter's two decoders (a = 0 is g₁,
a = 0.8 is g₂) and that the sweep's −0.8 mirrors the chapter's multiple; that the term is
exactly zero at the codes, so every member has zero reconstruction error, the audit cell
printing a largest observed-code gap of 0.0, while the value at the draw is 0.25 − 0.375a;
that any function vanishing at the three codes could be added, not only this one; that a
new sample needs a distribution over codes, which reconstruction does not supply, and that
Chapter 19 (`19-generative.qmd`, printed as Chapter 22) builds one; and the palette key.

Deliberately left out: any trained decoder, sampler or prior; the chapter's denoising and
convolutional material; and every exercise. Exercise 2 ("Audit the bend") asks what the
trained curve autoencoder does beyond its training range; the panel shows only that
reconstruction does not constrain a pencil family off the codes, and does not answer it.
The interlude's own prediction prompt belongs to the curve experiment and is not touched.

## The transfer check

> **Check yourself.** Observe a fourth code, z = 0.5, with target 0.25. Which multiples a
> of the term still reconstruct all four codes, and is the decoder then pinned down?
>
> Only a = 0: at z = 0.5 the term z(z² − 1) equals −0.375, so any other multiple misses the
> new target. The decoder is still not pinned down: z(z² − 1)(z − 0.5) vanishes at all four
> codes, and any multiple of it can be added.

The check moves the draw into the data, a case the picture never shows. It is not answered
by the final frame or by the dial: the dial only ever adds this one term, and the answer
needs a second function that vanishes at a fourth code. `scripts/test_excerpt_checks.cjs`
reads the panel's codes and draw, recomputes the term at the draw and at every code, and
looks for "Only a = 0", "−0.375" and "z(z² − 1)(z − 0.5)".

## What was imported from the film, and what was not

The interlude film's `DecoderAmbiguity` scene (316 to 368 s; `SDecoderAmbiguity` in
`6050-Interlude-Autoencoders/lecture.jsx`, its storyboard row, and its captions in
`transcripts/11-autoencoders-making-pca-learnable.timeline.json`) supplied the reveal order:
the guess held in stillness before anything moves toward z = 0.5, and the values stated
only after arrival. It also supplied the intent of two captions, "the codes agree — what
happens between them?" and "reconstruction supplies neither a prior nor a unique
off-support decoder", which the panel says in its own words.

Not imported: the film's two fixed curves in blue and orange, its purple probe line, the
grey band geometry, its card, its narration and its framework. In the film the moving
object is a probe travelling along z between two fixed decoders; here the moving object is
the family's own curve, swung by its multiple, and the dial, the ghosts, the bracket and
its arrows are this panel's own.

## Revisions after the author's first look (September 29, 2026)

The author proposed a latent density under the axis (three spikes at the codes against a
standard normal sampler), a draggable cursor to show the ambiguity growing beyond the codes,
a data-space panel of decoded digits, and a VAE toggle that blurs the rings into Gaussian
clouds. Taken, in the form the contract allows:

- Once both ends of the sweep are ghosts (from 25 s), the band between them is shaded. It is
  the whole family for multiples between −0.8 and 0.8, since g_a(z) is linear in a; it
  closes at the three codes and widens between and beyond them, fastest past the outer
  codes, where the added term grows like z cubed. This shows the ambiguity beyond the codes
  without a second control.

Not taken here: a second control (the cursor), because a scene carries at most one; the
normal sampler, because the chapter names no sampling distribution (it says reconstruction
supplies none) and a prior is Chapter 19's contract; a digit panel, because the chapter's
example is a one-dimensional polynomial and invented images are not a manuscript fixture;
and the VAE toggle, which is a second control and a second mechanism. The toggle's idea,
that noise around each code makes the vanishing term cost error so that only a near 0
survives, is a candidate for its own scene in Chapter 19's "Put probability around the
code".

## Source digests

Lecture paths are relative to the lecture repository root.

| Source | SHA-256 |
|---|---|
| `chapters/interludes/making-pca-learnable.qmd` | `237f853caf1bcadf3190cf81e5b823a05cf9d6bfa885e2aa9d23abdbdbf58cdf` |
| `6050-Interlude-Autoencoders/lecture.jsx` | `2d2a0d2bd4c9a8314a79e9bb7ea0afa98077a6ec30ab5e4eb7613fa6e64e91f4` |
| `6050-Interlude-Autoencoders/STORYBOARD.md` | `3d5686f60c10edb6e5b83236adeebccb933811718e3b08d86d10fe6b2921ddba` |
