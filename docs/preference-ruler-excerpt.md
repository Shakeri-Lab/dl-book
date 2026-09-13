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
decimal places; the raw probability and strict mathematical tests stay unchanged.
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
