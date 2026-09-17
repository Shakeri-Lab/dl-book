# Preference scores: a ruler without a fixed zero

September 13, 2026. **Author-approved for publication.** The author reviewed the
local scene and requested “push and do the next.” Publish this scene separately;
Chapter 17's scale-granularity scene is next for local review only. SVD was pushed
separately as `4fb86d4`, with serialization hotfix `9730659`.

## Question and placement

If both candidate scores increase by the same amount, does the preference change?

Place `18-alignment.html#preference-ruler-excerpt` immediately before “Train a
judge, then try to please the judge.” This keeps the scalar-consistency audit,
figure, cyclic counterexample and limitation together before the optional replay.
The existing manuscript remains authoritative; the filter is HTML-only.

## Source-owned example and scope

Chapter 18 constructs scores `[1,0,-1]` and verifies a common shift of 37. Use its
A/C pair: scores 1 and -1, gap 2, with probability
`sigmoid(2) = 0.8807970779778823` (the figure prints 0.881). After the shift the
scores are 38 and 36. All arithmetic is derived from that fixture, not a new
training run, new measurement or copied fitted floating-point result.

One ruler carries two labeled marks, their gap bracket, and the sigmoid reading.
The view follows the moving pair with equal tick spacing; the camera movement is
explicit. It never compresses 37 units into a falsely small gap. The probabilities
and raw reward scores are model outputs (green); the fixed translation and ruler
are neutral. Shapes and labels also carry meaning.

The lecture's `BradleyTerry` scene supplies the paired shift and reveal order,
not its five-card dashboard. The book version retains one mathematical picture
and the existing deferred native player, no lecture framework or video payload.

Only a common additive shift is invisible to these comparisons. Scaling the gap
changes its sigmoid; different shifts for the candidates do too. Scores do not
measure absolute goodness. This is not model training, generation, or policy
optimization, and it does not remove the scalar model's cyclic-preference limit.

## Acceptance

Local preview acceptance passed: 45 scene tests and 839 tests in the complete
interaction suite, including the separate SVD serialization regression
(`/tmp/preference-ruler-tests-first.log`,
`/tmp/preference-ruler-final-all-tests.log`). They cover independent pair-softmax
arithmetic, shift/scaling counterexamples, actual marker/bracket/tick geometry,
camera metric, probability fill and reference ring, deterministic scrubbing,
strict reduced-motion holds, and both generated static fallbacks.

Publication adds a targeted serialization regression (46 scene tests). A
controlled perturbation of `exp(-2)` by a few ULPs reproduced an exact-fallback
failure before the fix. Probability-derived SVG coordinates now serialize to nine
decimal places (superseded September 17, 2026: every drawing coordinate now serializes
to four; see the review pass below); the raw probability and strict mathematical tests
stay unchanged.
Both generated fallbacks pass the perturbation test. This demonstrates and removes
serialization sensitivity, not proof that a particular Linux backend produced it.
Red/green logs: `/tmp/preference-ruler-ulp-red.log` and
`/tmp/preference-ruler-tests-ulp-green.log`.
The final publication suite passes 840/840 tests:
`/tmp/preference-ruler-publication-all-tests.log`.

The full frozen HTML render (`/tmp/preference-ruler-html.log`) and all source,
Plan, fixture, Python, asset and public-anchor audits pass. All 133 stdout blocks
across 27 units and 27 HTML/TeX pairs remain unchanged against `4fb86d4`.
Chapter 18's Pandoc LaTeX with and without the HTML excerpt filters is identical:
`/tmp/preference-ruler-{plain,filtered}.tex`, SHA-256
`d5de0cc073241dcc7f6ffcb9b82c00f834ac6604be7cf4cb3802b80933e4da19`.

Real-browser checks cover desktop and 390-CSS-pixel pages (296px drawing), the
unshifted and shifted endpoints, all 40 seconds of playback, keyboard scrubbing,
native desktop fullscreen, typeset math and ordinary closed/deferred loading.
(Correction, September 17, 2026: that fullscreen check missed a defect. At the expanded
view's 1000 px figure the fixed pool of 17 ticks left the ruler's right end bare; see
the review pass below.)
The phone has no horizontal page overflow or math errors. Fullscreen is inspected
without a temporary viewport override; emulated phone sizing and OS fullscreen
do not compose reliably in this browser. Temporary sizing is reset afterward.

Assets total 34,483 bytes, including both static frames. Player SHA-256:
`58c7c1e21f3f5296ec0b275263d97816472c0423432ae942b0dffe4381fbc594`.
Preview:
`http://127.0.0.1:8770/chapters/part5/18-alignment.html?preview=preference-ruler#preference-ruler-excerpt`.
The publication rebuild and comparison receipt is
`/tmp/dl-book-preference-pdf-approval.ueOB4R/`. Both complete profiles stabilized
on attempt two: print 548→548 pages, continuous 519→519, with 390 outline entries
each. Complete and per-page text, geometry, outlines and all 1,067 low-resolution
page rasters are identical (`comparison.json`). Both PDF audits and representative
PNG inspections pass; whole PDF binary identity is not claimed. The final frozen
HTML render (`/tmp/preference-ruler-publication-html.log`) passes the asset and
anchor audits; refreshed browser playback and endpoint rendering pass.

Prior SVD publishing run `34761906820` failed Chapter 18's exact notebook stdout
check on `[1.0, -0.0, -1.0]` versus `[1.0, 0.0, -1.0]`; its interaction tests passed.
Failure log: `prior-svd-shard4.log` in the same receipt directory. This unchanged
numerical gate is not bypassed or weakened for an HTML publication. Verify the new
run before describing this source as deployed. The HTML-only filter leaves the
shared manuscript, frozen output, numerical contracts and release tags untouched.

## Source receipts

Manuscript: `chapters/part5/18-alignment.qmd`, Bradley--Terry equation and
unidentified-origin paragraph; `preference-consistency-audit`; the figure's A/C
pair. Lecture root:
`/Users/hs9hd/Library/CloudStorage/Box-Box/Teaching/6050/Video_lectures/6050-Ch18/`.
`lecture.jsx` function `BradleyTerry`; `STORYBOARD.md` scene 6 (03:16–04:04).
Source digests recorded before implementation:

| Source | SHA-256 |
|---|---|
| `chapters/part5/18-alignment.qmd` | `f9c85024f240099323ba26351691546c2e5f39e461163a4f6c7f89be572d4df8` |
| `6050-Ch18/lecture.jsx` | `b6249e488ae52885878af68311b57b07e064a8e1d1ff97a333e1d94c62ebcd14` |
| `6050-Ch18/STORYBOARD.md` | `ab55d9c8a65e83d285dc6c9a5b68ddfad53022d04fa9901eaf9aca7fc67e11c2` |
| `6050-Ch18/ch18-data.js` | `6d2e39ae7ca6cad71629827bc7c951dfc6f1289f88a1da93aa24e55028e06b16` |

## Review pass — September 17, 2026

An independent review confirmed the numbers (gap 2, `sigmoid(2) = 0.880797`, printed
0.881; common shift +37 in two glides of +18.5) and found four defects. Fixes:

- **Motion before its cue.** Half of the shift used to run from 22 s to 25 s under the
  caption "Predict before the shift", with the "common shift" readout already climbing.
  The prediction beat (20–25 s) is now a still from its first frame to its last: no
  motion, no shift readout (the heading stays "reward scores"), no shift in the
  picture's `aria-label` or the scrubber text; only the ring and the `+c` formula line
  that pose the question appear. The two glides moved one beat later, each to the last
  three seconds of its own beat, so each still ends on the beat it leads into:
  27–30 s (arrow-key stop at 30 s shows +18.5) and 32–35 s (stop at 35 s shows +37).
  Each opens on two still seconds under its own caption. Captions 5–8 were reworded so
  each is true of the still an arrow key or reduced motion parks on: predict (the ring
  marks the probability now); "Now add one amount to both scores. Follow the gap bracket
  and the probability mark."; the halfway rest ("… Same gap, same probability. The shift
  continues."); and the endpoint with the cancellation. The former separate "compare
  endpoints" and "no zero" captions are merged into the last beat, which also holds
  after playback ends. The final caption was kept to three phone-width lines so the pane
  does not grow at 35 s. Transcript items 5–8 follow the new order.
- **The payoff.** From 25 s the two readouts that do not change, `gap 2` and `0.881`,
  carry bold weight (`.pr-invariant`), while the scores, the ticks and the shift change
  around them; the probability mark never leaves its ring. While a glide is under way the
  moving readouts print one decimal instead of three, so digits do not flicker; at rest
  they print the exact values (18.5, 19.5, 17.5; 37, 38, 36).
- **Ruler ran out in fullscreen.** The tick pool is now sized in `layout()` from the
  ruler's pixel span, the unit and the tick step (span ÷ spacing, plus one spare), and
  lives in its own group under the score marks. At 1000 px the final frame draws 28–45;
  before, tick 45 was never drawn. The suite's widths now include 1000 and assert, at
  every width and time, that visible ticks are consecutive and reach within one spacing
  (plus the 8 px end clearance) of both ruler ends. Checked in a real browser in the
  expanded view (figure 1000 px, 18 ticks, 28–45).
- **Coordinate serialization.** Tick, marker, label, bracket and connector coordinates
  bypassed the rounding, so the static print carried values such as
  `x1="-80.29999999999995"`. Every drawn coordinate now passes through `pixel()`, and the
  geometry-only rounding went from nine decimals to four (0.0001 px). Model state is
  still unrounded and still checked at 1e-12; positions read back from the SVG are
  checked at the serialization tolerance. Both static prints were regenerated; the ULP
  perturbation test still passes.
- **Number formatting.** Tick labels, score values, the gap and the `aria-label` printed
  ASCII hyphen-minus (`-1`, `-2`). All printed and spoken numbers now use U+2212, and the
  shift carries an explicit sign (`+37`, `−37` for a negative fixture). No e-notation or
  raw double reaches a reader.
- **One place for a value.** The picture's `aria-label` describes the live values; the
  scrubber's `aria-valuetext` now names only the stage (it used to repeat the probability
  and the shift).
- **Per-frame work.** Fixture- and width-only geometry, the static labels, the ring and
  the fixture half of the published `data-*` state are set in `layout()`; a held frame is
  not redrawn. The four unused visibility flags are no longer published on the root.
- **Tests.** The oracle no longer re-implements the easing: it recomputes the arithmetic
  from the shift the player publishes, and the clock is asserted at named times. New
  regressions: stillness and silence under every prediction caption (full and reduced
  motion); glides open on two still seconds, end on their beats, and never jump; rigid
  bracket and fixed probability mark through both glides at every width; U+2212 and sign
  formatting for shifts of either sign; stage-only scrubber text; four-decimal
  coordinates live and in both static prints; tick coverage at 1000 px. Each new test was
  confirmed red against the pre-review player. Scene suite: 52 tests, all passing;
  `scripts/audit_excerpt_fixtures.py` passes.

Not changed: `data-duration`, `data-beats`, the fixture, the boundary and intro
paragraphs, the camera rule, and the recorded SHA-256 and byte sizes above (a later pass
records new ones; the player and panel bytes did change).
- **Less prose around the picture.** The boundary now shows one sentence; every remaining scope note,
  unchanged, sits in a closed "Scope and caveats" disclosure beside the transcript. New asset sizes
  and digests for this pass are recorded once in [the review-pass receipt](excerpt-review-pass.md).
