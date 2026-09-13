# SVD: from a circle to a line

September 13, 2026. **Author-approved for publication.** After reviewing the
local SVD preview, the author requested “push and do the next.” Publish this
scene separately, then prepare Chapter 18's preference ruler for local review.
This does not authorize publication of that next scene or the rest of the roadmap.

## Question and placement

Which input direction stretches most, and what disappears when we keep only one?

Place `a1-linear-algebra.html#svd-circle-excerpt` after `cell-fig-a1-svd`. The
static figure, equations and executable example remain authoritative in both
editions. The filter adds the optional player only to HTML; no QMD or freeze changes.

## Manuscript-owned fixture

The figure constructs `left_angle = pi/6`, `right_angle = -pi/4` and scales `(3,1)`:

\[
U=R(\pi/6),\quad V=R(-\pi/4),\quad
A=U\operatorname{diag}(3,1)V^\top.
\]

The panel mirrors those angles in degrees and the 361 perimeter samples from the
cell. It computes the factors and every transformed point from that one fixture;
there is no browser SVD, copied rounded matrix, training run, or new measurement.
The constructed factors may have different paired signs from the numerical SVD's
returned vectors. Both are valid; the matrix is unchanged.

Track one perimeter, with a circular mark on `v1` and a diamond on `v2`. Rotating
an unmarked circle would show nothing, so these two radii carry the transformation.
The fixed equal-unit ruler makes stretching visible. On phones the annotations
reflow below the plot rather than shrinking a complete lecture slide.

| Beat | Operation |
|---|---|
| 0 s | Predict which input direction will stretch most. |
| 5 s | Reveal the two perpendicular input directions. |
| 10 s | `V^T` aligns them with the coordinate axes. |
| 15 s | Scale the directions by 3 and 1. |
| 20 s | `U` turns the ellipse to its output orientation. |
| 25 s | Identify the short contribution before removing it. |
| 30 s | Collapse that contribution to zero, retaining a line segment. |
| 35 s | Compare with the full ellipse; the omitted semiaxis has length 1. |

The glides occupy 7–10, 12–15, 17–20 and 27–30 seconds. Reduced motion holds the
endpoint at each beat. The final view retains a dashed full-ellipse reference.
Inputs are blue, outputs green, fixed factors neutral and omitted/error direction
wine; marker shapes, labels and geometry also carry the distinctions.

## Boundaries and independent checks

These are rotations in a square two-dimensional example. Orthogonal factors can
also reflect; rectangular reduced SVD has dimensional changes not shown here.
The map remains rank two until the second scale reaches zero. The final errors
refer to `A - A1`, not the intermediate reveal maps or prediction accuracy.
The two matrix norms both equal 1 because there is exactly one omitted singular
value. A small singular direction is not thereby noise.

Independent SymPy checks verify orthogonality, `A vi = sigma_i ui`, eigenvalues
9 and 1 of `A^T A`, and rank-one residual with eigenvalues 1 and 0 for its Gram
matrix. Thus both operator and Frobenius errors are 1. The HTML and TeX frozen
stdout report those same values.

No SVD film exists in the scoped lecture tree, as the roadmap already records.
This uses the book's existing three-panel figure as its composition source
(Route C), with the established native player and no new drawing engine.

## Acceptance status

Local acceptance and author review completed September 13, 2026; publication
checks follow below. The 45 scene tests cover independent arithmetic, actual SVG geometry,
deterministic scrubbing, reduced motion, static fallback, native controls and label
gutters across seven widths. The full interaction suite has 793 tests. Logs:
`/tmp/svd-circle-tests-label-clearance.log` and `/tmp/svd-final-all-tests.log`.

The complete frozen HTML render (`/tmp/svd-final-html-edge.log`) passes the Plan,
Python-source, book-contract, fixture, asset and public-anchor audits. All 133
stdout blocks across 27 units and 27 HTML/TeX pairs remain byte-identical to
`2439557`. Appendix A's Pandoc LaTeX with and without the HTML filters is
byte-identical (SHA-256
`a3193295e3b6e31f5944f227996802e6c05df1014aa2ed2dca4ff8fcee475793`).

Real-browser inspection covers desktop and 390-CSS-pixel layouts, 40-second
playback, deterministic keyboard seeking, fullscreen entry/exit, direct anchors,
and a normal visit's closed/deferred initial state. The final phone stretch frame
retains over 23 CSS pixels between the right marker label and the SVG edge; the
page has no horizontal overflow. The rank-one endpoint and math are legible.
The review tab is left paused at zero with its temporary viewport override reset.

After the serialization fix below, the three local scene assets total 71,846
bytes before compression; the player is 14,746 bytes, SHA-256
`1cbc36a8082c305c0ef4a33f95e98896430fe4a7765d9b41415be72167578ea2`.
Preview: `http://127.0.0.1:8770/chapters/appendices/a1-linear-algebra.html?preview=svd-circle-final#svd-circle-excerpt`.

Publication verification on September 13 rebuilt both complete PDF profiles. Each
stabilized on attempt 2: 548 print pages and 519 continuous pages, with 390 outline
entries each. Complete and per-page text, page geometry, outlines and all 1,067
low-resolution page raster hashes match the pre-SVD snapshots. Both PDF audits
pass, including retained-log missing-character and text-layer checks. Rendered
SVD pages, cover, contents, long title, dense equations/table and final page were
visually inspected. Receipt and logs:
`/tmp/dl-book-svd-pdf-approval.ztG1Xr/`, notably `comparison.json`, `render.log`,
`print-audit.log` and `continuous-audit.log`.

The final full frozen HTML render is `/tmp/svd-approved-publication-html.log`;
HTML asset and rendered-anchor audits pass. The publication suite remains 793/793
(`/tmp/svd-publication-all-tests.log`). Existing scheduled monitoring, runtime
migration, numerical tolerances, release tags and PDF configuration stay untouched.

## Publication follow-up: SVG serialization

Commit `4fb86d4` was normally pushed to `main`. Run `34761426323` caught one
interaction failure (792/793 passing): unrestricted SVG coordinate strings differ
in their last bits across macOS and Linux. The exact fallback comparison remained
blocking; no bypass or numerical-ledger change was made. Log:
`/tmp/dl-book-svd-pdf-approval.ztG1Xr/svd-live.LJzjc5/interaction-job.log`.

A regression test first reproduced unequal final SVG strings with identical
fixtures/layouts and four-ulp perturbations of `sin`, `cos` and `hypot`. The fix
serializes drawing coordinates to nine decimal places (at most half a billionth
of a pixel rounding). Mathematical matrices, singular values and errors remain
unrounded and retain their original checks. Exact fallback equality remains the
contract; both static frames are regenerated. The scene suite now has 46 tests,
including the perturbation test. The scoped publication suite is recorded at
`/tmp/svd-hotfix-publication-tests.log`; the final frozen HTML render is
`/tmp/svd-hotfix-preference-final-html.log` (also includes the uncommitted next preview).

## Source digests

| Source | SHA-256 |
|---|---|
| `chapters/appendices/a1-linear-algebra.qmd` | `8874006c2ea4dc14720fc4ea20b1c899603e6099987e6f8b9cad923c17b9af48` |
| `sources/misc_svd.tex` | `90c4e1c5da7a712661426c7094c293e8a8f6daa54bc1d9ccb6d23ef63169547a` |
| `sources/misc_LinAlg.tex` | `4ea1a4372ebb47bb2735c76060425dd463531ebbdaa0c711a5a93f0ed915f904` |
| `_freeze/chapters/appendices/a1-linear-algebra/execute-results/html.json` | `999ca511af7ddce799759dd184f0ca1d067c67f593622c5257d378a05c6330f9` |
| `_freeze/chapters/appendices/a1-linear-algebra/execute-results/tex.json` | `525f9def7e93b6b77599acf57a673e1b1ef2b1c9709e66e08d8dda4f94840388` |
| `_freeze/chapters/appendices/a1-linear-algebra/figure-html/fig-a1-svd-output-2.png` | `262a5e726f0dfc8c38f5f2794046cbe0eaf012f9020e7fabd9a1db5acc0ce943` |
