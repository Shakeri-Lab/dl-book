# Score field: source and acceptance receipt

**Author-approved for publication, September 11, 2026.** The author approved this
scene after browser review. Reference tilt was pushed separately as `bc1133f`;
deployment of this scene must be verified independently. The insertion is
immediately after `cell-fig-score-mixture` in Chapter 19, outside Plan → Code:
`19-generative.html#score-field-excerpt`. The shared manuscript and its static
figure remain authoritative; no QMD or frozen evidence changes.

## One mechanism and one question

At the midpoint, do the two pulls reinforce each other or cancel?

Follow one prescribed coordinate through the existing fixed two-Gaussian mixture.
The means are `[-2, 2]`, the shared standard deviation is `0.75`, the priors are
`[0.5, 0.5]`, and the coordinate range is `[-5, 5]`. These are literal inputs in
`chapters/part5/19-generative.qmd`, in the `fig-score-mixture` cell. Normalized
affinities become component responsibilities, which weight the two signed local
pulls. Their sum is the score, the derivative of log density.

The one-picture composition pairs the fixed field with a quiet, aligned density
strip. Each vertical quantity has its own label and scale; they are not comparable
heights. The midpoint pause earns the distinction: zero score can occur in a
low-density valley. Input coordinates are blue and computed responsibilities
green. Wine follows this static figure's local-score curve, a declared local
derivative palette rather than a training-loss claim. Fixed components and their
means are neutral, not learnable parameters. Labels and geometry carry meaning
without color.

## Source adaptation and mathematical boundary

The film's `ScoreField` in `6050-Ch19/lecture.jsx`, lines 137–141, and storyboard
§14, 9:52–10:40, supply only the first phase's static curve and moving probe.
The film framework and data bundle are not imported. Its later diffusion-time
slices use a different clean variance, `0.25`, and are omitted; the book's fixed
example has variance `0.75**2`. There is no noise schedule, learned network,
training replay, random step, or reverse-sampling animation.

The forty-second sweep pauses at `x=-1` (10–14 seconds), `x=0` (18–23), and
`x=1` (28–32), then ends at `x=5` (36–40). These are inspection coordinates,
not samples following the arrows. All affinities, probabilities, pulls, density,
and score are computed from the fixture at the actual coordinate. Moving the
probe does not change the mixture. No extra parameter control is introduced.

An independent analytic oracle for the exact fixture is

\[
g(x)=\frac{16}{9}\left[-x+2\tanh\left(\frac{32x}{9}\right)\right].
\]

At zero the responsibilities are exactly one half and the two weighted pulls
are `-16/9` and `+16/9`. Their sum is exactly zero, while `g'(0)=880/81>0`
shows that the symmetric density critical point is a minimum. The component
means are not exactly the mixture modes: `g(2)` is approximately
`-4.73483167039e-6`, not zero. These are analytic checks from the cell's fixture,
not newly measured experimental results. The full score axis uses `[-6,6]`;
the static manuscript's `[-2.4,2.4]` window would clip the sweep's tails.

## Acceptance contract

Use the existing deferred local SVG/JavaScript player, shared keyboard playback,
closed/paused initial state, default 1.5× speed, reduced motion, complete transcript,
and generated wide/narrow static final frames. No new browser dependency, video,
or generic animation engine is warranted.

`scripts/test_score_field_excerpt.cjs` independently checks the analytic score,
normalized responsibilities, density derivative, two signed pulls, odd/even
symmetry, exact holds, deterministic scrubbing, pause/replay, reduced motion,
responsive geometry, delayed answers, and static parity. The fixture audit pins
the sources below.

Local acceptance: **42/42** scene checks and **622/622** full interaction checks
pass. Full frozen HTML and structural/source/fixture/asset audits pass. All
133 frozen stdout blocks remain exact against `bc1133f`. Chapter 19's LaTeX is
byte-identical with and without the HTML-only filters. Actual 1280- and 390-pixel
browser views verified the midpoint, witness and tail values, readable geometry,
colored math, no overflow, deferred loading, direct anchor, replay/pause and
expanded view. Text halos are restricted to text: browser review exposed and
fixed their accidental application to arrow paths, now protected by a regression.
Wide/narrow static parity is generated and tested, not a claim of a browser-wide
JavaScript-off run. Logs and publication checks are in `docs/CONTINUING.md`.
Author approval is recorded; Chapter 16's attention bill is a separate next
local-review task, not part of this publication.

Publication verification rebuilt both complete PDFs to 548 print / 519 continuous
pages. Text, outlines, page geometry, and all 1,067 low-resolution page raster
hashes are unchanged. Both full PDF audits and the final frozen HTML checks pass.
The receipt is `/tmp/dl-book-score-pdf-approval.CC5B76/`; source approval does not
by itself establish successful remote deployment.

## Source digests

Lecture paths are relative to
`/Users/hs9hd/Library/CloudStorage/Box-Box/Teaching/6050/Video_lectures/`.

| Source | SHA-256 |
|---|---|
| `chapters/part5/19-generative.qmd` | `8e2797b4c1f1ca3190342b2b8c480c95019c565c0a0ea53f5386a26c11c3e79f` |
| `6050-Ch19/lecture.jsx` | `aadc9e924c40da695315f0db3b58dc69b9cd77f6c807e5b85dd8b48eb5591a98` |
| `6050-Ch19/STORYBOARD.md` | `6c0956d6e00f54428aa562527c602c8f521b66c52240ba2f776bdd5aa3f6643b` |
| `6050-Ch19/ch19-data.js` | `a82d1f350fb6da16f92f8322a6fd0c41c130c80394ddd7d181cb9ed3d1358110` |
| `audit-ch19-generative.py` | `221068fe2ea31d66d40b3c2b2b9e9e9ac74533cad6ff2e9f5ffcafbf5e93556c` |

## Review pass — September 17, 2026

An independent review found five defects. The design, the fixture, `data-duration`
and `data-beats` are unchanged; every number is still evaluated from the declared
means, standard deviation and priors. The statement above that reduced motion was
verified was true only of the transport (one still per beat): until this pass the
stills for the four sweep beats sat under captions that described somewhere else.

- **Typeset numbers.** One formatter serves the picture, both static prints and the
  scrubber text: U+2212 for minus, four decimals while they can carry the value, and
  below that a mantissa with a Unicode power of ten. The final frame's first pull now
  prints `−4.5 × 10⁻¹⁵` (was `-4.5e-15`), and the weight that scales it prints
  `3.6 × 10⁻¹⁶` rather than a false `0.0000` beside it. Only the exact midpoint sum
  prints `0`. Axis and mean labels use U+2212.
- **Captions true of their stills.** Under reduced motion a hold rests on its witness
  and a sweep rests midway between its two ends (`x = −3, −0.5, 0.5, 3`), the
  coordinate its sentence is about. Four captions were reworded (each within twenty
  words) to be true of that still and of every frame of the sweep; the beat-7 caption
  is now a two-sided statement, since pull 2 still points right before the right mean.
  `CLAIMS` in the suite checks each caption against the printed pulls, weights and
  arrow directions, for every reduced-motion still and through normal playback.
- **Fewer live numbers.** The density readout is gone; the dot on the density curve
  carries it. `x` rides with the probe in the label row between the plots, and the
  guide is broken across that row so it no longer crosses the valley label, a mean
  label or its own coordinate. Each pull value and the sum sit just right of their
  arrow, never left of the shared origin, so the three read as a column sum; in the
  wide layout each weight sits under its own component mean. A weight sweep (beats 3,
  5) greys the pull values; the pull sweep (beat 7) greys the weights; holds show all
  six. At most four emphasised numbers change between frames.
- **Announced once.** The picture's `aria-label` now names what is drawn and carries
  no live values; the scrubber's value text is the one place they are announced.
- **Per-frame work.** Both 241-point paths, the axes, ticks, fixed labels, the valley
  mark, `at(0)` and the layout constants on the root are computed in `layout()`, once
  per width. `render()` moves only the probe, its six numbers and the three arrows.
- **Serialisation.** Drawing coordinates are written at 0.0001 px and the arrows no
  longer carry an unrounded `data-magnitude`, so the byte-compared prints hold no raw
  doubles. The unrounded state stays on the root's `data-pulls` and `data-score`.
- The picture grew by one label row: 713 × 492 wide, 296 × 518 narrow.

Local acceptance after this pass: **48/48** scene checks; the fixture audit passes.
Frames were inspected at 1280 and 375 pixels, with and without reduced motion, and
the script-free prints at both widths. Recorded digests above are left for the later
pass that re-records them.
- **Less prose around the picture.** The boundary now shows one sentence; every remaining scope note,
  unchanged, sits in a closed "Scope and caveats" disclosure beside the transcript. New asset sizes
  and digests for this pass are recorded once in [the review-pass receipt](excerpt-review-pass.md).
