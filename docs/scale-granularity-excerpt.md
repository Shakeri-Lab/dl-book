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
parameter marks are orange, errors wine, and grid structure neutral.

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
| `chapters/part5/17-peft-quantization.qmd` | `aea3c0f01f44bb56ff511bb84115408cad2b3b28e32daca9c267e85a017e03d3` |
| `6050-Ch17/lecture.jsx` | `aba2a4a94a52f12d3d5ed113d5f3209b0604065fc328d10566e0979bb459d3cb` |
| `6050-Ch17/STORYBOARD.md` | `b36b1df0110b5d261ec232ed97af5ff402c67fe58db56fa2302aec71042f94fc` |
| `6050-Ch17/ch17-data.js` | `966d73e40d3d5ac8c9a14dfb0e039d6960321acf51b675d5736d8499bba913e1` |
