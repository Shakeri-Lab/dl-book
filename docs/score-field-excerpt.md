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
| `chapters/part5/19-generative.qmd` | `119e082afb38e582cf5227a122cb2863f416ac8cdb1955f4f22097cb142299bd` |
| `6050-Ch19/lecture.jsx` | `aadc9e924c40da695315f0db3b58dc69b9cd77f6c807e5b85dd8b48eb5591a98` |
| `6050-Ch19/STORYBOARD.md` | `6c0956d6e00f54428aa562527c602c8f521b66c52240ba2f776bdd5aa3f6643b` |
| `6050-Ch19/ch19-data.js` | `a82d1f350fb6da16f92f8322a6fd0c41c130c80394ddd7d181cb9ed3d1358110` |
| `audit-ch19-generative.py` | `221068fe2ea31d66d40b3c2b2b9e9e9ac74533cad6ff2e9f5ffcafbf5e93556c` |
