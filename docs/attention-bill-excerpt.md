# Attention bill: source and acceptance receipt

**Approved for publication, September 11, 2026.** The author approved score field
for publication (`ec2e0f6`), requested this scene separately, then approved its
linked-patch revision with “push. Do next.” It follows Chapter 16's computational-price paragraph,
immediately before “A Fashion rematch, not a referendum,” without a QMD edit:
`16-vit-scaling.html#attention-bill-excerpt`.

## One mechanism and one question

Halve the patch width. What happens to the attention score grid?

The manuscript owns every endpoint: a fixed 224-by-224 image, patch widths 32 and
16, 49 and 196 patch tokens, and 2,401 and 38,416 score entries per head. This count
excludes `[CLS]`, exactly as the paragraph does. Diagonal query-key pairs count.
The player computes the number of patch rows and columns, multiplies them into
the token count, then squares that count for the ordered query-key pairs.

The author's follow-up review identified three gaps in the first draft: no
visible image-to-token bridge, ambiguous area tiles, and a cost comparison left
mostly to prose. The revision connects a schematic image's patch grid to a
query row and key column, then changes the patch grid discretely from seven to
fourteen patches along each image axis. Patch sizes and counts never interpolate.

One score square carries the area comparison at a fixed side scale. Its original
area remains highlighted while the other equal-area units stamp into the final
extent. Each tile represents **the area of the entire old score grid**, not one
token, an attention window, or a copy of its numerical scores. The tiles are a
counting aid; attention still includes every ordered query-key pair. A companion
length bar shows fourfold token-wise work beside sixteenfold mixing work, holding
model width and architecture fixed. The score square remains free of the fine
subpixel raster that produced moiré in the first browser review.

The compact movie transport stays: scrubbing selects a time, not a patch-size
hyperparameter. No P=8 example, parameter toggle, hover-only explanation, or
additional player dependency is added. Automatic tracing works on touch screens,
with the same meaning available in the transcript and static fallback.

The eight beats at 0, 5, 10, 15, 20, 25, 30, and 35 seconds separate prediction,
patch counting, tracing one patch into both score axes, counting the original
pairs, the discrete subdivision, area stamping, the two work terms, and their
scope boundary. The scene lasts forty seconds. Input-related
counts are blue; the score matrix and operators are neutral. Neither a colored
matrix nor a highlighted region denotes an attention probability or a learned
parameter. Labels and geometry carry the comparison independently of color.

## Source adaptation and boundary

The composition and reveal order come from `AttentionBill` in
`6050-Ch16/lecture.jsx:73` and `STORYBOARD.md:199` (3:20–4:04). The book's own
paragraph, `chapters/part4/16-vit-scaling.qmd:301–311`, is authoritative.
The lecture framework and data bundle are not imported. Its 1,024-pixel example
and other scaling-law scenes are not part of this excerpt.

At fixed width, attention mixing has a term of order `N²d`; block Q/K/V and output
projections and feedforward layers include terms of order `Nd²`. The input patch
embedding is excluded from this fourfold comparison: its raw per-patch input
width changes with patch size. Which term dominates is a
separate question. Counting a conceptual score matrix does not measure bytes,
total FLOPs, or wall-clock time, and does not imply every implementation stores
the full matrix. Nothing here is a training replay or benchmark.

The verify-math SymPy helper independently confirmed that halving patch width
multiplies token count by four and score count by sixteen. It also verified the
fixed-width factors of sixteen and four for the two displayed work terms.
It separately checked `NP²Cd = HWCd` for the patch-embedding operation count,
which is why the scene labels the linear bar as **block** projections / FFN.

## Acceptance

Reuse the existing deferred local SVG/JavaScript player: closed and paused
initially, silent, compact controls, 1.5× default, keyboard operation, reduced
motion, full transcript, and generated wide/narrow static fallback. No new
runtime dependency, engine, video, or shared transport change is needed.

Local acceptance: **42/42** scene tests and **664/664** full interaction tests
pass. Tests independently enumerate complete, nonoverlapping patch grids and
ordered pairs, including rectangular fixtures; derive both trace endpoints from
the actual rectangles; check discrete states at fractional timeline positions;
and verify deterministic area stamping, fixed side scale, the fourfold length
and sixteenfold area, and the block-work scope. Nine responsive widths, transport,
strict reduced-motion holds, and both generated static prints are covered. An
anti-raster regression protects the browser-discovered moiré fix.

Full frozen HTML, asset/public-anchor, source/structure, and fixture audits pass.
All **133** stdout blocks across **27** units and their HTML/TeX pairs remain
exact against `ec2e0f6`. Chapter 16's plain-Pandoc LaTeX is byte-identical with
and without the HTML-only excerpt filters
(`/tmp/dl-book-attention-discrete-latex.ySNzmQ/`).
The publication check rebuilt both complete PDFs with the existing outline
fixpoint loop. Print remains **548 pages** and continuous remains **519 pages**,
with **390 outline entries** each. Complete/per-page text, page geometry,
outlines, and all **1,067** page raster hashes match the pre-build baseline.
Both PDF audits and representative visual checks pass. Receipt:
`/tmp/dl-book-attention-pdf-approval.enT0K2/` (`comparison.json`, `render.log`,
and both audit logs). Canonical frozen HTML is rendered last.

Browser review checked the trace and final comparison in desktop and 390-CSS-pixel
phone layouts, with readable labels (corrected September 17, 2026: that review missed
a near-invisible trace and a link drawn across the column label at beat 2; see the
review pass below), three correctly typeset math expressions,
and no clipped SVG text or horizontal page overflow. The view capability was
adjusted for the browser's existing zoom and the CSS width measured directly;
the phone drawing is approximately 297 by 630 CSS pixels. Single-patch highlights
retire before the area tiles appear. The length bar's old baseline is labeled.
A closed chapter loads no scene script; a direct anchor opens paused. Generated
static wide/narrow parity is tested, not a claim of a full browser-wide
JavaScript-off test. Real playback reached forty seconds; a separate replay
paused and held its time through expanded-view entry and exit. The viewport was
reset and the deliverable left at its paused opening state.
Logs: `/tmp/dl-book-attention-discrete-tests.log`,
`/tmp/attention-bill-tests-discrete-final.log`, and
`/tmp/dl-book-attention-discrete-final-html.log`.

Author browser review is complete; the linked-patch revision is approved for push.
Publication checks and the remote deployment are recorded separately in the handoff.
Manuscript, frozen stdout, PDF settings, numerical tolerances, release tags, and
the paused runtime migration remain unchanged.

## Source digests

Lecture paths are relative to
`/Users/hs9hd/Library/CloudStorage/Box-Box/Teaching/6050/Video_lectures/`.

| Source | SHA-256 |
|---|---|
| `chapters/part4/16-vit-scaling.qmd` | `75f24cfc9feab89d50a5cde238cea929d00fa24d20f98285291c47804b10791d` |
| `6050-Ch16/lecture.jsx` | `6b9cedc6ab0e407e9e62dfc3278ef35205cc0e9e7c61c9c64ff3093864cce057` |
| `6050-Ch16/STORYBOARD.md` | `7657e0372b2aa1861ae1bf7fa6f0a8bdcda7edb807ce0b6e1042ee9c3990d9a4` |
| `6050-Ch16/ch16-data.js` | `68881c89c2e85d85b821b7addb606bb11651dc4dd7a0fbcd45f07539dc5501ee` |
| `audit-ch16-vit-scaling.py` | `eb3312f4b07580a2a01177969364965c826796bd03d10003f49b6c822901ef84` |

## Review pass — September 17, 2026

An independent review found five defects. The counts, fixture, beats, and duration are
unchanged; every number on the picture is still computed from the panel's declared
224-by-224 image and patch widths 32 and 16.

- **The traced object could not be seen.** The scene traced token 0, whose query row and
  key column are strips about 1.3 px thick (1.1 px on a phone) lying under the score
  square's own border. It now traces an interior token (patch row 2, column 0: token 14 of
  49, a presentation choice, not manuscript data). The strips keep their true scale, since
  thin rows are the point; a hollow input-blue locator outline, 10 px across, is centred on
  each, and a locator supplies no magnitude. The link is heavier, starts at a dot in the
  highlighted patch, and ends in an arrowhead on the row's left end and the column's top.
  It leaves the image upward on a wide pane and leftward on a narrow one, so it crosses no
  caption; the wide "P = 32 pixels" line moved under the image for the same reason.
- **The column link crossed "49 key columns".** During the trace the square now carries
  only the two names the caption uses, "query row" beside the row and "key column" under
  the column, on the sides the link does not use. The counted brackets and their labels
  wait for beat 3, where the caption multiplies them. On the small square the column label
  and the entry count sit flush left, clear of the rotated row label. The narrow layout
  gained 10 px between the token count and the column label, which used to touch.
- **An arrow-key seek to beat 5 parked on one of sixteen tiles.** The stamping now leads
  into the beat: the new square holds two seconds (20–22 s), the tiles fade in one by one
  from 22 s, and the sixteenth is complete at 25 s. Beat 5's caption now reads "Count the
  equal-area tiles. …", which is true of that still. Under reduced motion beat 4 is the
  bare new square and beat 5 the full tiling. The transcript's sixth item says the same.
- **`ab-boundary` was toggled with no rule.** Removed.
- **The final frame was small print.** The two growth factors are now the picture: ×16 on
  the square and ×4 on the bar, one size and one weight (26 px, bold), each centred on its
  own mark, ink for the area and input blue for the length. The bar moved from the lower
  left to directly under the square and is exactly the square's side, with ruler ticks at
  each old length, so length ×4 and area ×16 are read off one ruler. The tile note belongs
  to beat 5 and is withdrawn afterwards; "38,416 entries / head", the bracket counts, the
  token count, and the image title turn grey; "fixed model width" left the picture (the
  beat-6 caption and the boundary carry it). "2,401 entries / head" at beat 3 now sits
  under the small square it counts instead of 220 px below it.
- Cross-cutting: the scrubber's value text names the beat only, and the counts are
  described once, in the picture's label. Geometry that depends only on the fixture and
  the width is placed in `layout()`; a frame whose stage and stamp progress are unchanged
  is not redrawn, and the 196 patch cells are rewritten only when the patch size changes.
  The scene never rounded coordinates with `toFixed(9)`: its geometry is exact rational
  arithmetic with no transcendental calls, so the 4-decimal serialisation rule was not
  needed and the 1e-12 geometry oracles stand.
- The pictures shrank: 713 × 450 wide and 296 × 558 narrow (were 458 and 630); the
  script-free aspect ratios in `player.css` follow.

Scene suite: **48/48**. New regressions: locator thickness, hollowness, and interior
placement at nine widths; a geometric no-overlap check of every visible label against
every other label, link segment, bracket, and locator, using the suites' 0.6 em per
character estimate; the arrow-key park at beat 5 in both motion modes; every class given
to the formula line has a rule; the final frame's two factors share size, weight, and
anchor, sit inside their marks, and everything else is muted; at most eight emphasised
numbers at any time. Two were mutation-checked: restoring the counted labels at beat 2, or
the old stamp timing, fails them. `audit_excerpt_fixtures.py` passes. Frames were reviewed
at 1280 and 375 CSS pixels (also 700 and 610), with and without reduced motion, and both
script-free prints with JavaScript disabled: no page overflow, no svg text outside the
picture, no console errors.
- **Less prose around the picture.** The boundary now shows one sentence; every remaining scope note,
  unchanged, sits in a closed "Scope and caveats" disclosure beside the transcript. New asset sizes
  and digests for this pass are recorded once in [the review-pass receipt](excerpt-review-pass.md).
