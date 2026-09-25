# Scale granularity: one loud row can erase a quiet one

September 13, 2026. **Author-approved for publication.**
The author reviewed the final local scene and requested “push and do the next.”
Publish this scene separately from the next Chapter 14 LayerNorm-axis preview.
The preference ruler was previously pushed as `7aba6ea`.

## Question and placement

Can a perfectly valid 8-bit grid turn an entire nonzero row into zeros?

Place `17-peft-quantization.html#scale-granularity-excerpt` immediately before
“What a quantization workflow protects,” after the complete granularity argument
and its speed caveat. The older bit-width player stays after the figure. This scene holds precision fixed and
changes scale granularity; it does not repeat the bit-width dial.

The existing exact `before-heading` match now accepts level 3 as well as level 2,
still requiring exactly one match. The audit cell is inside the collapsible
Plan → Code wrapper, so inserting there would nest the player in code. Co-locating
two excerpts on one figure also complicates loader order. An initial before-cell
attempt failed the real-browser two-player check and was removed. The subsection
boundary keeps both independent without adding another anchor type, changing the
manuscript, moving the approved player, or adding a browser dependency.

## Manuscript-owned witness

The Chapter 17 audit constructs 64 rows by 256 columns, normalizes each row's
maximum absolute value, and applies row ranges from 0.01 to 10. At 8 bits,
`Q=127`. The global scale is `10/127`; its zero-rounding interval has half-width
`5/127`. The entire quiet-row interval `[-0.01,0.01]` lies strictly inside it.
Every value in that row therefore maps to zero. This needs only the declared
ranges, not a new run or a reconstruction of the seeded array.

A quiet-row scale is `0.01/127`, whose zero bin has half-width `1/25400`. Its
maximum-magnitude endpoint lies on code magnitude 127 and reconstructs exactly in
real arithmetic. That is an endpoint witness, not a fabricated signed sample or
a promise that every weight is recovered. The general nearest-grid error bound
remains half a local step, under maximum calibration and no clipping.

With 64 rows and one FP32 scale per row, metadata grows from 4 to 256 bytes; the
8-bit packed payload remains 16,384 bytes. No new layer-output error, task-accuracy
or runtime result is measured. This is the same representation bill as the audit.

Independent exact-rational verification uses SymPy: global/row scales `10/127`
and `1/12700`, strict quiet-range containment, endpoint reconstruction, scale
ratio 1000, and the source shape/FP32 byte arithmetic. All displayed quantities
derive from `quantization-audit` and `eq-symmetric-quantization`.

## Film adaptation and visual boundary

`GranularityDesign` supplies the order: predict, global erasure, per-row repair,
metadata. Its five schematic dots per row and 3-bit grid are deliberately omitted.
They are not manuscript observations. One fixed quiet-row zoom carries the range,
rounding interval and maximum-magnitude witness. Any skipped ticks are explicitly
sampled; a subpixel zero bin is not falsely widened. Weight and reconstructed
parameter marks are orange, errors wine, and grid structure neutral. (As first
published the local grid ticks were drawn orange and the subpixel bin was hidden
under the code-0 tick; both are corrected in the September 17 review pass below.)

Reuse the deferred native SVG player, with the existing compact controls, closed
and paused initially, 1.5× default, 40-second duration, transcript/static fallback
and strict reduced-motion beat holds. No new engine, video payload or parameter
control. The shared manuscript and static figure remain sufficient in both editions.

## Acceptance

Local acceptance passes 42 scene tests and 882/882 tests in the complete suite:
`/tmp/scale-granularity-accepted-all-tests.log`. Checks independently cover strict
interval containment, ties-to-even nearest rounding, exact endpoint versus generic
inexact weights, storage arithmetic, real SVG geometry at seven widths, and
full-precision state versus nine-decimal pixel serialization. The inherited
transport suite covers deterministic scrubbing, pause/replay, strict reduced-motion
holds, failed-script fallback, direct anchors and both generated static frames.

The final complete frozen HTML build is `/tmp/scale-granularity-final-html.log`.
Source, Plan, Python, asset and rendered-anchor audits pass; 49 recorded lecture
digests re-verify. All 133 stdout blocks across 27 units and all 27 HTML/TeX pairs
are unchanged against `7aba6ea`. Chapter 17's filtered and unfiltered Pandoc LaTeX
are byte-identical: `/tmp/scale-granularity-{plain,filtered}.tex`, SHA-256
`c0467f15945dec61adeec2ef96adef0065ff669276088119eec91417598a7c0d`.

Actual browser review covers 1280px desktop and 390px phone pages (296px drawing),
global-bin containment, erasure and local-grid endpoints, a complete 40-second run,
keyboard operation, and native fullscreen entry/exit. Math renders without errors
or horizontal page overflow. After the placement correction both Chapter 17
players initialize; ordinary chapter navigation keeps both closed with neither
player script loaded. A direct anchor opens the new scene paused at time zero.
Temporary viewport overrides were reset after inspection.

Assets total 32,653 bytes, including both static fallbacks; the deferred script is
14,978 bytes, SHA-256
`5bc92e86cad633060ef8a19cc5bfe6dd0033b55994cad03e663b458f309d901f`.
Review:
`http://127.0.0.1:8770/chapters/part5/17-peft-quantization.html?preview=scale-granularity-final#scale-granularity-excerpt`.

Publication acceptance passes 882/882 tests again:
`/tmp/scale-granularity-publication-all-tests.log`. Both complete PDF profiles
rebuild at 548/519 pages, with 390 correct outlines each. Full/per-page text,
geometry, outlines and all 1,067 page rasters are identical to the baseline.
Glyph, retained-log, text-layer and geometry audits pass; representative pages,
including Chapter 17's equations, code and figure, were visually inspected.
Receipt: `/tmp/dl-book-scale-pdf-approval.MKXd82/` (`comparison.json`, profile
audit logs and rendered pages). The final complete frozen HTML render
`/tmp/scale-granularity-publication-html.log` passes asset and anchor audits;
133 stdout blocks/27 units remain exact. No QMD, frozen output or numerical gate
changed. Preference run `34762857399` completed successfully. Verify this new
publication's run and live assets independently; a push is not deployment.
No scheduled monitor is created.

## Source receipts

Manuscript: `chapters/part5/17-peft-quantization.qmd`, `eq-symmetric-quantization`,
`quantization-audit`, and the discussion around `fig-quantization-granularity`.
Lecture root:
`/Users/hs9hd/Library/CloudStorage/Box-Box/Teaching/6050/Video_lectures/6050-Ch17/`.
`lecture.jsx` function `GranularityDesign`; `STORYBOARD.md` scene 13 (9:32–10:18).

| Source | SHA-256 |
|---|---|
| `chapters/part5/17-peft-quantization.qmd` | `df5203bf7f8a059181ee9da004b4c3969f8d55a6e2b9a6c912624cd790b91ccd` |
| `6050-Ch17/lecture.jsx` | `aba2a4a94a52f12d3d5ed113d5f3209b0604065fc328d10566e0979bb459d3cb` |
| `6050-Ch17/STORYBOARD.md` | `b36b1df0110b5d261ec232ed97af5ff402c67fe58db56fa2302aec71042f94fc` |
| `6050-Ch17/ch17-data.js` | `966d73e40d3d5ac8c9a14dfb0e039d6960321acf51b675d5736d8499bba913e1` |

## Review pass — September 17, 2026

An independent review found the numbers right and the picture wrong: it read as
stacked text, not a mechanism. No fixture value, duration or beat changed.

- **Final frame was a text stack.** The five-line header and the four centred
  readouts under the ruler are gone. The header is two lines (which row sets the
  spacing; `s = max/127 = value`), in ink only on the beat where it is the news
  (1 and 4) and grey otherwise. The `8-bit · Q = 127 · 64 × 256` banner is removed.
- **Storage is a bar, not a sentence.** One bar on one byte scale (ruler width =
  16,384 + 256 B): codes light neutral, FP32 scales ink. The 4 B segment keeps its
  true sub-pixel width and gets a hollow locator below the bar; it grows to 256 B
  (about 1.5 % of the bar) and the locator goes once the segment is visible. Labels
  sit beside their marks: `8-bit codes: 16,384 B, unchanged` over the codes,
  `FP32 scales: 4 B → 256 B` under the scales end.
- **Error bound is attached to the bin.** `rounding error ≤ s/2 = 3.937 × 10⁻⁵`
  (wine) hangs from the local zero bin's callout instead of floating as a line.
- **The local zero bin can be found.** Its width is still the true `s·unit`
  (0.58 px wide layout, 0.22 px narrow; never inflated). It now extends beyond the
  code-0 tick, deepens in ink as it thins, and carries a hollow ring on the
  hairline with a leader to `zero bin: 1000× narrower`. A locator supplies no width.
- **Axis.** Ticks sit at the round weights they print (−0.02, 0, 0.02); the old
  tick at `s/4 = 0.019685` labelled "0.02" is gone. Bin edges are labelled `−s/2`
  and `s/2`, with the value once in `shared zero bin: ±s/2 = ±0.03937`.
- **No ASCII math.** One scene-local formatter (four significant figures, U+2212,
  `7.874 × 10⁻⁵`) serves the picture, both static prints and the svg `aria-label`.
  The scrubber value text carries no number, so a value is announced in one place.
- **Reduced-motion beat 4 was untruthful**: it parked the endpoint diamond on 0 of
  the local grid for five seconds. Every glide now ends on the beat it leads into
  (collapse 12→15, refinement 17→20, endpoint drop 22→25, scale bytes 29→30), so a
  beat seek and every reduced-motion still show the finished picture its caption
  describes. The diamond is drawn only while it drops from the row's maximum onto
  code 127, always above code 127's own position, and never at 0.
- **Tracked object and refinement.** The orange interval is on the ruler for the
  whole forty seconds: full, collapsed to a dot (`all 256 weights → code 0`),
  restored. Grid ticks and bins are neutral ink (the first build drew local ticks
  orange). From 17 s to 20 s the spacing shrinks geometrically from 10/127 to
  0.01/127: ticks stream in from the ruler ends, the stride doubles with a fade
  rather than a pop, the zero bin narrows at its true width, and the outermost
  code lands on the row's maximum. **The intermediate spacings and the restoring
  image are explanatory motion between the two declared scales, not additional
  quantizers**; text never shows an interpolated number. `← code −1` and
  `code 1 →` mark the shared grid's neighbours as off this zoom.
- **Captions** 1, 4 and 5 were rewritten to be true of their stills (at most 18
  words). On phones the caption reserves three lines so the pane height is constant.
- **Housekeeping.** Fixture-only state and static geometry are written at mount or
  in `layout()`; the per-frame dataset is six entries. Geometry is serialized with
  `toFixed(4)` (was 9); model state stays unrounded. Dead `.sg-ray` and
  `.sg-row-tick` rules removed. The static svg gained
  `preserveAspectRatio="xMinYMin meet"`: without it the script-free narrow print
  was centred in its taller box, started roughly 100 px low and overflowed the
  formula line (checked script-free at 375 px before and after).
- **Tests.** 49 pass in `scripts/test_scale_granularity_excerpt.cjs` (was 42).
  New regressions: hollow bin locator with unchanged true width; ticks at printed
  round values and `s/2` edge labels; endpoint marker never off code 127's
  position; reduced-motion beat-4 still; continuous refinement with no popping
  tick and no interpolated text; storage bar on one byte scale with a sub-pixel
  4 B segment and locator; header and loud-number budget; no hyphen-minus,
  e-notation or raw double in the picture, static prints, `aria-label` or value
  text. The oracle that re-implemented the player's smoothstep timing was replaced
  by exact-at-beats and monotone-inside-glides assertions.
  `scripts/audit_excerpt_fixtures.py` passes. Frames were inspected at 1280, 700,
  375 and 320 px, with and without reduced motion, plus the script-free prints.

The byte sizes and SHA-256 recorded under Acceptance describe the September 13
build; a later pass records the new ones. The Acceptance paragraph's "nine-decimal
pixel serialization" likewise describes that build.
- **Less prose around the picture.** The boundary now shows one sentence; every remaining scope note,
  unchanged, sits in a closed "Scope and caveats" disclosure beside the transcript. New asset sizes
  and digests for this pass are recorded once in [the review-pass receipt](excerpt-review-pass.md).
