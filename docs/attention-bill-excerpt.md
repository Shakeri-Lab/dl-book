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
phone layouts, with readable labels, three correctly typeset math expressions,
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
