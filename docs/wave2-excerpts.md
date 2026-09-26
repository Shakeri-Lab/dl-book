# Wave 2 mechanism excerpts — implementation receipt

Five optional HTML explanations of existing book examples, each ported from the scene of the
DS 6050 lecture film that already draws it (`docs/wave2-plan.md`, Route B): `pooling-bins-excerpt`
(Chapter 8), `hinge-bump-excerpt` (Chapter 3), `lstm-valves-excerpt` (Chapter 10),
`quantization-grid-excerpt` (Chapter 17), `mask-predictor-excerpt` (Chapter 18). Each scene appends
its own section below as it is built; a scene without a section here is not built.

**Baseline.** Built on `main` at `ab041af` — *Polish the three mechanism excerpts and add Wave 1:
softmax shift, one chain, gate product* — the Wave 1 live baseline. Nothing in Wave 2 is committed
or pushed; `ab041af` is still `HEAD`.

**Author review.** Not yet. Nothing in this file authorizes publication: a wave is authorized only
by the author's browser-review note recorded here (`docs/animation-authoring.md`, "Acceptance").

**Method.** The film scene is the approved design — its picture, the one moving object, the reveal
order, the easing and the caption cues are ported; only the fixture values are re-bound to the
manuscript and the grammar's 40-s budget applied. No design panel, no redesign. Where a film's
seeded values differ from the printed fixture, the book's govern and the difference is declared in
the scene's section. For the explanation of every player and the reusable production rules, see
[Mechanism animations: reference and authoring contract](animation-authoring.md); for the receipt
format this file follows, [the Wave 1 receipt](wave1-excerpts.md).

## Review locations

Serve `_book` on port 8777 and open the anchor. Each opens its optional panel **paused**, not
playing. An ordinary chapter visit leaves the panel closed and requests neither the scene script
nor the playback helper.

| Chapter | Anchor | Local URL |
|---|---|---|
| 8, *CNNs: making the filters learnable* | immediately before the level-2 heading "How far a deep neuron sees" (§8.5), i.e. after the *Tolerance has a price tag* callout that follows the `pool-invariance` cell | `http://localhost:8777/chapters/part2/08-cnn.html#pooling-bins-excerpt` |
| 3, *Nonlinearity and the MLP* | immediately after the `fig-hinge-bump` figure cell (§3.3), before the paragraph "Follow the pieces" | `http://localhost:8777/chapters/part1/03-nonlinearity-mlp.html#hinge-bump-excerpt` |
| 17, *Adapting pretrained models* | immediately after the `fig-quantization-granularity` figure cell (§17.4), before the paragraph "The global 8-bit grid has only 2.13% relative output error" | `http://localhost:8777/chapters/part5/17-peft-quantization.html#quantization-grid-excerpt` |
| 10, *Sequences and recurrence* | immediately after the `fig-lstm-conveyor` figure cell (§10.4), before the paragraph "Two states now travel" — the chapter's **second** panel, the Wave 1 `gate-product-excerpt` still sitting after the `fig-highway-time` cell further down | `http://localhost:8777/chapters/part3/10-sequences-rnn.html#lstm-valves-excerpt` |

## Authority: the manuscript, and no `.qmd` edited

The shared manuscript owns the mathematics and the fixtures. **No `.qmd` and no `_freeze` was
edited in this wave.** The digest column is the last column on purpose:
`scripts/audit_excerpt_fixtures.py` reads these rows out of this file and fails when one is stale,
so a manuscript edit forces this file to be re-read rather than letting a panel drift.

Digests recomputed with `shasum -a 256` while writing this receipt:

| Source | SHA-256 |
|---|---|
| `chapters/part2/08-cnn.qmd` | `33aa5122d822dee6095852379dc924d09a65ad10aefbbbf8cc22301bc6d0ed71` |
| `chapters/part1/03-nonlinearity-mlp.qmd` | `86731b0e01caf92d1f2f3bc071ef95334f2aaba5cf606e66c2a900046cd5dde4` |
| `chapters/part5/17-peft-quantization.qmd` | `a937a5c5cbf4c681fcde41d25116dceeef50517ab00db68e20acda80f7751d4a` |
| `chapters/part3/10-sequences-rnn.qmd` | `8bf8e3cd4b3b5f7e6e623ed923791cfad448a173a4ae86c86d1da85a50f77e02` |

## Lecture sources adapted

Read-only instructor collection:
`/Users/hs9hd/Library/CloudStorage/Box-Box/Teaching/6050/Video_lectures/`. Its working tree is
dirty, so these are **file digests, never a commit**. These sources supply the design — picture,
object, reveal order, easing, caption cues — and are never independent authority for a fixture, a
numerical claim, or a colour. `scripts/audit_excerpt_fixtures.py --lecture-tree <path>` re-verifies
every digest below.

| Lecture source | SHA-256 |
|---|---|
| `6050-Ch8/lecture.jsx` | `23cc1659121304d8c3d92a403b2881a08a6b8235ce14e3f661aa6ad1c60e0690` |
| `6050-Ch8/STORYBOARD.md` | `99526e7701d536af96f678c1b2658cb76ca431e85f30bd8935a02a13360f0c32` |
| `6050-Ch8/ch8-data.js` | `e39c7bc21530acef7637644d6f5899e2d5dd568ebb9aa4b85fe55f6fca9f3d41` |
| `6050-Ch3/lecture.jsx` | `ec73751439013366e2ce867b9c6d076ee2a2798a88983defe6fdacbc8e6417b2` |
| `6050-Ch3/STORYBOARD.md` | `065d2f5e9054d0581b9909b52654fafce446352caa94724b4752f4a620aeee84` |
| `6050-Ch17/lecture.jsx` | `aba2a4a94a52f12d3d5ed113d5f3209b0604065fc328d10566e0979bb459d3cb` |
| `6050-Ch17/STORYBOARD.md` | `b36b1df0110b5d261ec232ed97af5ff402c67fe58db56fa2302aec71042f94fc` |
| `6050-Ch17/ch17-data.js` | `966d73e40d3d5ac8c9a14dfb0e039d6960321acf51b675d5736d8499bba913e1` |
| `6050-Ch10/lecture.jsx` | `3a2cabb00546067f5c3c0a3715c043ac96ec4f09faa298815428089689a22350` |
| `6050-Ch10/STORYBOARD.md` | `23204f3ef89ad845ee07ec11c6e618154391908294429381798f7c20de888902` |

| Scene | Lecture source | Scene function, line range | Storyboard window |
|---|---|---|---|
| `pooling-bins` | `6050-Ch8/lecture.jsx` + `STORYBOARD.md` + `ch8-data.js` | `SPooling`, L494–548; `constructedTolerance` and `crossBinCounterexample` in `ch8-data.js` | row 6, **Pooling**, 3:18–4:10, "The maps track the garment — the verdict must not: what converts one into the other?"; predict-then-reveal hold +33.5 → +36.5, "nudge the clue one more pixel — does the pooled value survive?" |
| `hinge-bump` | `6050-Ch3/lecture.jsx` + `STORYBOARD.md` | `SBump`, L777–815; `BumpBoard` and the hoisted `bumpH1/bumpH2/bumpH3/bumpSum`, `BUMP_Y`, `HINGE_DASH`, `bumpEndLabel`, L404–445; `EQ.bump` / `EQ.bumpRed`, L51–52; `MOTION`, L60–65 | row 5, **Bump**, 2:26–3:10, "what can three shifted hinges build together?"; caption cues 149.5 "shift three hinges to three different thresholds", 153.2 "scale the middle ramp by minus two", 160.5–164 "predict the sum before it draws", 165 "accumulate: climb, reverse, cancel", 178.8 "outside the interval, the ramps cancel", 184–190 "global hinges combine into one local bump" |
| `lstm-valves` | `6050-Ch10/lecture.jsx` + `STORYBOARD.md` | `SLSTMDesign`, L464–484; the `Valve` component (port, rotating vane, `open` label), L462–463; `EQ.lstmState` / `EQ.lstmRead`, L69–70; `enter` / `smooth`, the film's reveal easings | row 7, **LSTMDesign**, 4:22–5:34, "what would a memory lane that survives by default look like?"; caption cues 270 "Two memories: a long-term lane c, and the working state h", 277 "A forget valve decides what old state survives", 293 "An input valve decides what new content is written", 301 "what should the network expose at this step?", 309 "An output valve reads the lane into the short-term memory h", 326–333.5 "LSTM: a conveyor belt with learned valves"; baton `state-highway` |
| `quantization-grid` | `6050-Ch17/lecture.jsx` + `STORYBOARD.md` + `ch17-data.js` | `QuantGrid`, L74; `QDEMO`, `QMAXABS`, `qGrid`, L22–24; `EQ.payload` / `EQ.symmetric` / `EQ.affine`, L48; `smooth` (easeInOutCubic), L10 | row 12, **QuantGrid**, 8:42–9:32, "a billion reals — what happens when only fifteen grid points remain?"; caption cues 534 "payload is N times b over eight bytes — the grid is the price", 547 "round to the nearest tick, then rescale — reconstruction, not recovery"; glyph BITS, `GlyphBits`, "a tick-marked number line with weights dropping to grid points" |

## `pooling-bins-excerpt` (Chapter 8)

**Question.** *Both clues move one pixel right — does the pooled map change? And one pixel down?*
The reader answers before anything is pooled: through the whole first beat only the input grid
and its two clues stand, the output grid is absent, and once it appears its four cells read `·`
until each bin's ray has landed — never a zero.

**What the film gave, and what was taken.** `SPooling` shows a 4 × 4 `NumberGrid` with the two
nonzero cells highlighted, an orange arrow, and the 2 × 2 pooled grid; the clue grid snaps from
`original` to `shifted` at the midpoint of a six-second `move`; the storyboard holds at +33.5 s on
"nudge the clue one more pixel — does the pooled value survive?", then plays the cross-bin
counterexample and dwells ≥ 6 s on "local, alignment-dependent tolerance". Ported: the two-grid
picture with the clues as the object, the arrow, the *within-bin move → equality → predict-then-
reveal hold → cross-bin move → failure* order, and the closing dwell. Changed for the book: the
clues *slide* between pixels instead of snapping (motion is the mechanism; the film's snap at
`move > .5` becomes a 2.4-s smoothstep glide); the pooled map is unwritten while they slide; a ray
from each bin's largest value into the output cell (the convolution cell-measure idea) shows *which*
value each bin kept; and a dashed record of the first pooled map stands beside the live one, with
an `=` / `≠` sign between them, so the equality and the failure are both visible on one still frame
(the film relied on the viewer remembering the previous grid).

**Fixture.** The film's `constructedTolerance` is *the same grids as the book's* — `original`
= the chapter's `scene` (9 at row 1, column 0; 3 at row 2, column 2), `shifted` = the chapter's
`shifted`, both pooling to `[9, 0, 0, 3]` — so no film number had to be rejected there. The film's
`crossBinCounterexample` (a lone 9 at row 1, column 1 moving to column 2, pooling `[9, 0, 0, 0]` →
`[0, 9, 0, 0]`) is **not imported**: the book's declared computed variant moves *the chapter's own
two clues* one pixel **down** instead, which crosses a bin edge with the 9 and not with the 3. The
film's gold/red/orange palette, its `Card` chrome, its `SectionTitle`, its bridge beat (Chapter 7's
equivariance diagram and `EQ.equivariance`), and its exact max/average receipt on the 0–15 grid
(`P.max2x2 = [5, 7, 13, 15]`, a different section of the chapter) are not imported.

`interactives/manifest.json` records four literals Chapter 8 must keep verbatim; the line numbers
are in `chapters/part2/08-cnn.qmd` at the digest above.

| qmd lines | Literal |
|---|---|
| 396–398 | `scene = torch.zeros(1, 1, 4, 4)` / `scene[0, 0, 1, 0] = 9.0        # a strong clue, upper-left region` / `scene[0, 0, 2, 2] = 3.0        # a weaker clue, lower-right region` |
| 400–402 | `shifted = torch.zeros_like(scene)` / `shifted[0, 0, 1, 1] = 9.0      # both clues moved one pixel right` / `shifted[0, 0, 2, 3] = 3.0` |
| 405–406 | the two `print(f"pooled …: {F.max_pool2d(…, 2).squeeze().tolist()}")` lines |
| 409–411 | "Both clues moved, yet these particular pooled maps are *identical*: each isolated maximum stayed inside its $2 \times 2$ window. That equality belongs to this construction, not to max pooling in general." |

The anchor is the level-2 heading `## How far a deep neuron sees` (L429), `before-heading`:
the `pool-invariance` cell (label at L392) is executable but not a figure, so Quarto emits no
`cell-pool-invariance` div to anchor after; the panel is inserted immediately before the heading,
after the *Tolerance has a price tag* callout, and its intro says the grids are the cell "printed
above". A test asserts the heading occurs exactly once and the fixture cell precedes it.

The panel is the one in-repo mirror: `data-size="4" data-window="2" data-scene="1 0 9 2 2 3"`
(row, column, value triples) `data-right="0 1" data-down="1 0"` on the root, read by
`interactives/pooling-bins/player.js` and by `scripts/test_pooling_bins_excerpt.cjs`. A test
renders the declared attributes back into the chapter's own source text — `scene[0, 0, 1, 0] = 9.0`,
`shifted[0, 0, 1, 1] = 9.0`, `F.max_pool2d(scene,   2)` — and asserts the down-shifted clues
(`[0, 0, 2, 0] = 9.0`) appear **nowhere** in the chapter, so the variant stays declared rather than
quietly becoming a fixture.

**A binding stronger than a `.qmd` literal.** The pooled map is *printed by the chapter itself*,
and the test reads that printout: the committed freeze
`_freeze/chapters/part2/08-cnn/execute-results/html.json` holds
`pooled original: [[9.0, 0.0], [0.0, 3.0]]` and `pooled shifted:  [[9.0, 0.0], [0.0, 3.0]]`, and
the suite recomputes the 2 × 2 max-pool of each declared grid independently and asserts the
result, formatted the way `.tolist()` prints it, is those two strings.

**Declared computed variants** (recorded in the manifest, repeated here):

1. The pooled maps are recomputed by the player from the declared clues with `F.max_pool2d`'s
   rule — each 2 × 2 bin keeps its largest value; nothing is transcribed. The chapter prints
   them as floats (`9.0`, `0.0`); the panel writes the same four values as the integers 9, 0, 0, 3
   in reading order, because it declares the clues as the integers 9 and 3.
2. The down-shift is this panel's own case, declared as `data-down`: the same two clues moved one
   pixel down — 9 to row 2, column 0 and 3 to row 3, column 2 — pool to **0, 0, 9, 3**. The 9
   crosses from bin (0,0) into bin (1,0), so exactly those two pooled values change and the other
   two do not. The manuscript says a shift "can change which values share a window" (L411–412)
   but prints no such grid; the panel applies the manuscript's own rule to the manuscript's own
   clues and says so in its intro, its boundary and its transcript.
3. The clues slide continuously between whole-pixel positions on the timeline rather than under a
   control; while they are between pixels the pooled map is unwritten (`·`, never 0) and no
   intermediate value is computed or printed. The ray from each bin's largest value to its output
   cell, the dashed record of the first pooled map, the ring on a changed bin and the `=` / `≠`
   sign are drawing devices of this scene, not numbers of the chapter.
4. The formula line `h_{i,j} = max_{(a,b) ∈ W_{i,j}} x_{a,b}` is the film's `EQ.poolMax` written in
   the book's `\featurepart` macro; the chapter states max pooling in prose (L351–356), executes
   it as `F.max_pool2d`, and prints no symbol for the pooled map.

**The picture.** One SVG. Left, the 4 × 4 input grid with its sixteen resting zeros in faint grey,
row and column indices 0–3, and the four 2 × 2 bins drawn as heavier ink squares; typeset
`\featurepart{x}` above it. The two clues are white boxes with an ink outline carrying `9` and `3`
in blue, drawn at their home cells and translated as one body — **the one object the eye tracks**.
An arrow labelled `max` leads to the pooled map `\featurepart{h}`: a 2 × 2 grid whose cells are the
size of the bins they summarise, so a ray can leave its source at a corner and run *along a grid
line* into the output cell's edge without crossing a zero (wide: horizontal from the source's
top-right corner; narrow: vertical from its bottom-right corner). A bin whose four cells tie has
no single source; its ray leaves the bin's own corner. Each output cell reads `·` until its ray
lands, then its value in blue. From the first shift on, a dashed ink record of the first pooled map
stands beside the live map, labelled *recorded before the move*, with `=` (ink) or `≠` (wine)
between them; a bin whose value differs from the record is ringed in wine as its value lands.
Under the picture, the one typeset formula with `\class{pb-bin}{\mathcal{W}_{i,j}}` washed in ink
while the bins are read and in wine once a clue has crossed one; then one caption of at most
twenty words.

**Content time** (40 s; `data-duration="40"`, `data-beats="0 4 11 17 22 26 34"`, mirrored in
the manifest and checked against the markup by the fixture audit):

| From | Beat | What moves (exactly one thing) | What is written |
|---|---|---|---|
| 0 s | Ask | nothing | the grid, the two clues, the indices; no output grid |
| 4 s | Pool | four rays, one bin at a time (4.3–5.1, 5.5–6.3, 6.7–7.5, 7.9–8.7) | the output grid with four `·`; each value as its ray lands: 9, 0, 0, 3; formula shown, `W` washed |
| 11 s | Shift right | 11–11.6 the record fades in; 11.6–14.0 both clues glide one pixel right (rays hidden, outputs `·`); 14.3–16.6 rays land again, one bin at a time | 9, 0, 0, 3 again |
| 17 s | Same map | nothing | `=` between the live map and the record |
| 22 s | Ask again | 22.3–24.3 the clues glide home (rays hidden, outputs `·`); rays and values return at once on landing | the second question |
| 26 s | Shift down | 26.4–28.8 both clues glide one pixel down; 29.1–31.4 rays land, one bin at a time | 0, 0, 9, 3; bins (0,0) and (1,0) ringed as they land; `W` washed wine at 31.4 |
| 34 s | Changed | nothing | `≠` in wine; the closing caption |

Every schedule finishes before its beat ends, so a beat's end state is its whole state under
reduced motion. The `=` beat and the closing beat hold 5 s and 6 s; the predict-then-reveal hold
(*Ask again*) stands 1.7 s with the clues home before the down-glide starts.

**Reduced motion.** The same picture at each of the seven beats with the clues jumped to their
beat position: home (Ask, Pool), one pixel right (Shift right, Same map), home (Ask again), one
pixel down (Shift down, Changed) — **exactly three positions, never between**, one per beat, with
the record already in, the map already rewritten and the sign already up. The harness's strict
beat-hold test (one drawn state per whole beat) passes.

**Layout.** `layout()` is the only measurement: it reads the pane width once per resize,
fullscreen or toggle and chooses `wide` (viewBox 860 × 300, 56-unit cells, output beside its
record) at 600 px and above or `narrow` (360 × 616, 44-unit cells, output then record stacked
under the input, rays turned vertical) below; `render()` never measures. The type steps down with
the cells in the narrow layout. The static fallback is the wide print only; a narrow print (the
gate product's two-print rule) is not shipped — see *Open*.

**Palette.** Blue `#2b6cb0` (`\featurepart`) for the clue values, the pooled values and the `x` /
`h` tags: the clues are inputs and the pooled map is a maximum of inputs. Ink `#232d4b` for the
clue outlines, the bin edges, the rays, the record and the `=` sign — the object and its
bookkeeping, none of which the grammar assigns a hue. Wine `#722f37` (`\residualpart`) for the
ring on a changed bin, the `≠` sign, the wine wash on `W` and the caption words *two bins changed*
— the film's red verdict in the book's error colour. Grey scenery. **No orange, green or purple
anywhere**: no learnable parameter, no prediction, no target, and the boundary says why. The
picture reads without colour: the ring is three times the stroke of an unchanged cell, the sign
is a glyph, the caption names *two bins changed*, and the SVG `<title>` and live `aria-label` say
which bins changed and whether the maps are equal.

**Teaching boundary** (the panel's own words): only the two clues move, on the timeline; the
bins, the window and the rule are fixed and no kernel is learned. The equality is this
construction's, as the chapter says — each isolated maximum stayed inside its 2 × 2 window — and
not translation invariance in general; the down-shift crosses a bin edge and changes two of the
four pooled values. How much tolerance pooling buys in a trained network is measured at the end of
the chapter, not assumed.

**Independent checks** (`scripts/test_pooling_bins_excerpt.cjs`: **45 tests** — 21 inherited from
`registerTransportTests`, 1 from `registerBeatHoldTest`, 7 from `registerGrammarTests`, 15
scene-specific, 1 integration; the whole suite went from 299 to **344**). Every arithmetic
assertion recomputes the 2 × 2 max-pool inside the test from the panel's declared attributes and
never calls the player's helper:

- `pool(scene) = [9, 0, 0, 3]`, `pool(shifted) = pool(scene)`, and both strings the chapter's
  frozen stdout prints; `pool(down) = [0, 0, 9, 3]`, differing from the record in exactly bins
  (0,0) and (1,0); every clue stays in its bin under the right shift and exactly the 9 crosses
  under the down shift; the player's published maps at beats 1, 3 and 6 equal these;
- output cells are `·` until their ray lands, land one bin at a time in reading order at four
  distinct moments, are `·` again throughout every glide (no ray drawn either), and a `0` is
  printed only where the pool is 0;
- reduced motion: 801 seeks at 0.05 s give one clue position per beat, exactly the three
  positions `[home, home, right, right, home, down, down]`, never moving; unreduced, the glide
  passes between the pixels with more than thirty distinct offsets;
- motion is the mechanism: at every 0.05 s both clue groups carry the same `translate`, equal to
  the published offset × 56, with `dr = 0` during the right glide and `dc = 0` during the down
  glide; each ray's endpoints equal the source's top-right corner and the output cell's left
  edge on the same grid line (`y1 = y2`, `(y1 − 40) mod 56 = 0`), and a ray mid-draw is short of
  the output;
- the record and the sign appear only when there is something to compare: absent through the
  Ask and Pool beats, fading in over 0.6 s and then constant, `=` only in stage 3, `≠` only in
  stage 6, the ring on exactly the bins whose written value differs from the record, and the
  wine wash only once all four landed values include a change;
- the static, script-free panel prints the final frame — record 9, 0, 0, 3; live 0, 0, 9, 3;
  clues 9 and 3; `≠`; no `·` — and every readout of it is identical to the `t = 40` render; the
  whole pane minus the control bar is byte-equal to that render; the committed static frame is
  the player's own `t = 40` drawing (`render_static_frames.cjs --check`);
- each beat toggles exactly its root classes; every class the player sets has a rule in
  `player.css`; no orange, green or purple hex in the stylesheet; the three formulas are TeX in
  `eq-pooling-bins-` wrappers with `\featurepart` only, no digit inside a formula, unchanged
  across 801 seeks; captions ≤ 20 words with the `input-role`, `bin-role` and `error-role` words,
  no chrome, and the scrubber wording never repeats the caption;
- the narrow layout: viewBox 360 × 616, output under the indices, record under the output,
  every rect and label inside the viewBox, every ray vertical on a grid line landing on its
  output cell's top edge; a resize flips the mode in place;
- the panel is the only fixture copy: moving `data-scene` to `0 0 7 1 0 2` moves the record to
  7, 0, 0, 0, the final map to 7, 0, 2, 0, the captions to "The 2 crosses a bin edge; the 7 does
  not" and "one bins changed", and no 9 or 3 survives on the picture;
- the filter's non-HTML guard is its first executable line, it decodes the manifest and names no
  scene, it can place a `before-heading` anchor, the `_quarto.yml` resource line exists and
  `panel.html` is not a resource, the anchor heading occurs exactly once after the fixture cell.

**Fault injection.** 18 mutations, each a single broken source line in `player.js`,
`panel.html`, `player.css`, `interactives/manifest.json` or `_quarto.yml`, applied one at a time
to a scratch copy of the repository and restored with a SHA-256 byte check before the next:
**18 caught** (12, 4, 10, 1, 2, 7, 3, 4, 11, 10, 6, 6, 4, 4, 9, 1, 1 and 1 failing tests
respectively). They cover: row and column offsets swapped in `grid()`; a tied bin given a single
source cell; the pooling window reading one row too many (bins overlap); a pooled value written
when its ray starts rather than lands; an unwritten cell printed as `0`; the ring compared with
the down map instead of the record; reduced motion reading the clock; the clue box translated by
the transposed offset; the down shift read from `data-right`; the record taken from the down map;
`=` shown on the last beat; the caption counting one changed bin too many; a ray landing half a
cell off; the static fallback's 9 at bin (1,0) reading 8; a declared clue the chapter does not
print (3 → 4); a manifest literal the chapter does not contain (3.0 → 3.5); the `_quarto.yml`
resource line removed; the ring styled like an unchanged cell. One first-round mutant —
`best` starting at 0 in `maxPool` — was *equivalent* (every value is ≥ 0, so nothing observable
changed) and was replaced by the overlapping-window mutant; it is recorded here so the count is
honest. Script and results: `<scratch>/wave2/pooling-bins/fault-inject.py`, `fault-results.json`.

**Browser review** (headless Chromium via Playwright against the rendered `_book` on :8777,
`quarto render --to html --no-clean` exit 0; the panel is inserted after the *Tolerance has a
price tag* callout and immediately before the §8.5 heading; page console **empty** at both
widths). Every beat and the mid-beat moments shot at 1280 × 1000 and 390 × 1000, 14 frames each
(`<scratch>/wave2/pooling-bins/frames/pooling-bins-excerpt-w{1280,390}-t{0000,0004,0006,0011,
0013,15.5,0017,0022,23.5,0026,0028,0031,0034,0040}.png`), and every frame looked at:

- 1280 px: one row — input grid, `max` arrow, bin-sized output, `=`/`≠`, dashed record; every
  ray lies on a grid line and lands with its dot on the output cell's left edge, no glyph is
  crossed, the arrow sits a quarter-cell under the bins' midline where no ray runs; output
  cells read `·` through the ask beat and through every glide; the wine rings and `≠` arrive
  with the down-shift; the formula's `W` is washed ink in the pooling beat and wine at the end.
- 390 px: the same row in 36-unit cells (viewBox 360 × 336) with the record under the output
  and the sign between them; nothing leaves the viewBox, the `max` label fits the 30-unit gap,
  no horizontal page overflow; type steps down with the cells and stays legible.
- Opens **paused** at the anchor at both widths (`data-ready`, `time = 0`, `playing = false`).

**What the frame review changed** (three rounds; each is a rule the test suite now holds):
(1) the first build's rays left each source's *centre* and struck through the row of resting
zeros, and their landing dot sat on the output value — rays now leave a *corner* and run along a
grid line, and output cells are bin-sized so the line reaches the cell's edge without crossing
anything; (2) the first narrow layout stacked the output under the input with vertical rays,
which crossed the column indices, the `h` tag and the arrow, and — once vertical along grid
lines — passed through the row-0 output cells' values on their way to row 1; the narrow layout
is now the wide row in smaller cells; (3) the `max` arrow lay on the bins' midline, which is
exactly the line the bin (1,0) ray runs along, so the two overprinted — the arrow moved a
quarter-cell down.

**Deliberate choices, recorded.** (i) Output cells the size of their bins, so rays run along grid
lines and the picture never strikes through a zero — the first build's rays did, and the second
build's corner-offset rays still grazed the zeros of the right-hand bins on their way down; the
test now asserts every ray lies on a grid line. (ii) The record and the sign: added to the film's
picture so that equality and failure are each visible on one still frame, which the static
fallback needs and the film did not. (iii) The down-shift rather than the film's lone-9 cross-bin
counterexample: the book's clues, the book's rule, declared. (iv) Integers on the picture where
the chapter prints floats (declared). (v) Rays hidden and outputs unwritten while the clues
glide: a pooled map of a half-moved clue is not a number the chapter has. (vi) The `h` / `W` / `x`
notation is the film's; the chapter has no symbol for the pooled map (declared).

**Open.** (a) No narrow static print: with scripts off, a phone shows the wide frame scaled to
296 px (cells ≈ 19 px, values ≈ 8 px). The gate product's two-print rule would fix it and is a
mechanical addition; left for the author's call on whether the rule is general. (b) The film's
bridge beat (equivariance → "the verdict must not move") is not ported; the chapter's own
paragraph before the cell carries it.

**Revision, September 10, 2026 — "make the point land at a glance."** The author looked at the
Wave 2 scenes and said they are correct but dense: *"we want them to help understanding the
subject via the animation while being simple and easy to see the point of the animations."* The
mechanism did not change and no number, invariant, literal or caveat was removed from the scene —
only from the picture. **Live full-weight numerals at the busiest instant: 34 → 6.** Where each cut
thing went:

| Cut from the picture | Where it went |
|---|---|
| The **sixteen resting `0` glyphs** (`.pb-zero`) and the **eight row / column index digits** (`.pb-index`) — twenty-four numerals doing the work of an empty cell and a coordinate no caption ever named. | Deleted as marks, and their CSS rules deleted with them so nothing can draw them again. The fact they carried is one grey two-line note under the grid, *empty cells are 0 · heavy squares are the 4 fixed 2 × 2 bins*, plus the intro's "blank cells are 0", the SVG `<title>` ("a 4 × 4 grid of zeros … every other cell is 0") and the transcript. The coordinates survive in the live `aria-label`, the transcript and the fixture table above. |
| **Three of the four rays.** | One ray at a time, from the winning cell of the bin the scene is about: its home bin at the pooling beat, the bin it moves into at the payoff. The other pooled values write without a ray; "each bin keeps its largest value" is still said by the formula line, the beat-2 caption and the transcript. |
| **The 2 × 2 dashed record panel beside the live map**, its label *recorded before the move*, and the 70 units of white between them. | A dashed **half-height record directly under the pooled map**, every recorded value in the same column as the live value it is compared with, and the same wine ring on both maps where they differ — the eye pairs ringed with ringed instead of tracking across a gap. |
| **The standing `=` / `≠` sign** (on screen from the first shift to the end). | Drawn only at a verdict: `=` at the *Same map* beat, `≠` from the moment the down-shifted map lands. A verdict that is always on screen is not a verdict. |
| **36 words of intro** (68 → 32). | The clue positions are on the picture from `t = 0`; the computed-variant provenance moved into the boundary paragraph, which now states in full how the down case is made and that the chapter does not print it. |
| **Caption length** (16–20 words → 7–12, budget 20 → 14), and beat 2's second sentence *"Where inside the bin the clue sat is thrown away"*, which answered the scene four beats early. | The dropped sentence is in the transcript; the dropped clause *"tolerance is local and alignment-dependent, not invariance"* is the boundary paragraph's, verbatim from the chapter. |

Four things were **added**, each one mark or one line, and three of them are the judge's grafts from
the rejected `pooling-bins-restage` storyboard: (1) **two dashed candidate paths on each clue at
`t = 0`**, → and ↓, with a `?` in each of the four output cells, so a reader who never presses play
sees both experiments and four unknowns rather than an empty stage — the picture, not the prose
heading, now states the question; (2) **both verdicts on the closing frame**, which is also the
static print: the down map ringed and `≠` against the record, and under the record the retired
verdict *before **=** after one pixel right*, so the "the right shift changed nothing" half of the
contrast no longer survives only in memory from `t = 17`; (3) the **annotated closing geometry** —
*stays inside its bin* on the ink rightward path, *crosses into the next bin* on the wine downward
path, both radiating from a marked origin in the 9's home cell with the crossed bin edge lit in
wine from the payoff beat — which replaces, rather than adds to, a caption sentence; (4) the grey
note above. The boundary paragraph gained the restage storyboard's sharper sentence, *"the 9
crosses from the upper-left bin into the lower-left one and the 3 does not, so exactly two of the
four pooled values change"*, and keeps every caveat it had.

**What this supersedes above.** The *picture*, *content time*, *layout* and *browser review*
paragraphs describe the first build. Now: the wide viewBox is **640 × 424** (52-unit input cells at
(40, 40), bin-sized 104-unit output cells at (380, 40), the record at (380, 280) in 104 × 52 cells,
the verdict glyph in the gutter beside it) and the narrow one **360 × 314**; the ray no longer runs
along a grid line but from the **middle of its source cell's right edge to the middle of its output
cell's left edge**, a short diagonal across cells that are now blank — the old routing existed only
to avoid the resting zeros, and with them gone it lands on the corner two output cells share, which
is exactly the ambiguity the payoff frame cannot afford. The beat grid, the duration, the four
chapter literals, the `data-size/-window/-scene/-right/-down` mirror and the declared computed
variants are unchanged; the third variant's wording now names the new drawing devices.

**Independent checks after the revision** (`scripts/test_pooling_bins_excerpt.cjs`: **45 → 53
tests**; the whole suite 483 → 491). Every arithmetic invariant the first build asserted is kept and
still recomputes the 2 × 2 max-pool inside the test. Rewritten: the ray assertion, which now binds
*which* output cell received the crossing clue's value (recomputed source cell, recomputed target
bin, landing strictly inside one cell's left edge, and that cell is one of the two whose pooled
value changed); the record, verdict and class tables, for the new schedule. New: a **live-numeral
budget** asserted at every 0.05 s seek (≤ 8 full-weight numerals, peak exactly 6, no `.pb-zero`, no
`.pb-index`, and no numeral anywhere inside the input grid but the two clue values); a **glyph
vocabulary** check (an output cell holds a numeral, `·` or `?` and nothing else, a `?` only before
the first pooling; the verdict slots hold only `=` or `≠`); the **ring indices recomputed inside the
test** as exactly the positions where `pool(down)` differs from `pool(scene)`, asserted on the live
map *and* the record; the **candidate and annotated paths** (both moves on both clues at `t = 0`,
the downward one again at the second question, none elsewhere; the closing paths recomputed from
the crossing clue's own cell and the bin edge it crosses); and the **word budgets** — intro ≤ 40,
every caption ≤ 14, plus a check that the boundary paragraph still contains all six caveats in the
chapter's wording and that no caption states a number the picture has not written yet. Two further
scene tests drive the panel's own fixture attributes to cases the chapter does not have, so the
code cannot be right by coincidence: two equal clues in one bin (the bin has no single largest
value, and the ray must leave the bin's own edge) and a clue whose *rightward* shift crosses an
edge (the retired label must then read `≠`, which is the only way to know it is a comparison).

**Fault injection after the revision.** 28 mutations, one broken source line at a time in a scratch
copy of the repository (`<scratch>/wave2b/faultrepo`), each restored with a SHA-256 byte check
before the next: **28 caught** (16, 1, 8, 1, 1, 8, 3, 4, 14, 12, 8, 6, 1, 2, 1, 4, 1, 1, 5, 4, 3, 1,
1, 4, 7, 1, 1 and 1 failing tests). They cover the twelve arithmetic mutants of the first build plus
the revision's own: the payoff ray leaving the bin the clue came *from*; the ray landing on the
corner two output cells share; the ray leaving the bin's corner rather than its winning cell; the
record's rings dropped; the retired label asserting an equality it never computed; only one of the
two candidate moves offered at the first beat; the closing paths drawn on the clue that stays
inside its bin; the sixteen resting zeros drawn again; a caption over fourteen words; the intro back
over forty; and the boundary's sharpened sentence deleted. One first-round mutant was *equivalent*
and was replaced: writing a pooled value when its reveal *starts* rather than finishes shifts each
of the four landings 0.4 s earlier and changes nothing observable, since a value's reveal is the
appearance of its glyph; it is recorded here so the count is honest, and the substitute (all four
values landing at once instead of one bin at a time) is caught. Script and results:
`<scratch>/wave2b/fault-inject-pooling.py`, `fault-results.json`.

**Browser review after the revision** (headless Chromium via Playwright against the rendered
`_book` on :8777, `quarto render --to html --no-clean` exit 0; page console **empty** at both
widths; the anchor still opens the panel paused). Every beat and the mid-beat moments shot at
1280 × 1000 and 390 × 1000, 16 frames each
(`<scratch>/wave2b/after/pooling-bins/pooling-bins-excerpt-w{1280,390}-t{0000,0004,0006,0009,0011,
0013,15.5,0017,0022,24.5,0026,0028,30.5,0031,0034,0040}.png`), and every frame looked at. Three
things the frames changed, each now in the tests or the stylesheet: (1) the two closing paths, drawn
from one point, read as a single elbow — "go right *then* down" — so they now radiate from a marked
hollow origin in the witness clue's home cell, each head straddling the line it is about (the thin
cell boundary it respects, the heavy bin edge it crosses); (2) both closing labels are written over
the grid, so they carry a white luminance channel (`paint-order: stroke`) and the grid lines stop
running through their strokes — the gate product's second rule, reused; (3) the record's cells were
drawn in dashed *ink*, and where two cells share an edge the out-of-phase dashes filled in and the
map read half-dashed — the record is now dashed grey, which is also the right colour for a retired
mark and makes the two wine rings the only per-cell outline on it. At 390 px the same picture
reflows into 36-unit cells (viewBox 360 × 314) with the record still directly under the pooled map
and the two closing labels still beside their arrows; the grey note stays legible at the pooling
beat, so a phone reader who skipped the intro can still see why three bins emit 0. The wide
picture reserves the record's band from `t = 0`, so nothing reflows mid-scene; that band is empty
for the first eleven seconds, which is the revision's one deliberate cost. **Open item (a) above is
unchanged**: there is still no narrow static print, so with scripts off a phone shows the wide frame
scaled.

## `hinge-bump-excerpt` (Chapter 3)

**Question.** *Three ramps that never come back down — how can their sum return to zero?* The
reader answers before anything is summed: through the whole first beat the three hinges draw on,
one after another, in one ink and three line styles, and no sum, no slope and no number stands on
the picture.

**What the film gave, and what was taken.** `SBump` opens on the ReLU polyline carried in from the
Hinge board and recoloured into h₁; h₂ draws unscaled at +7 s, the multiplier eases +1 → −2 over
+9–12 s (`Easing.easeInOutCubic`) while the dashed ramp turns over (`h2Scaled = mult2 · h2`); h₃
draws at +12–14 s; a predict hold at +14.5–18; the green running sum draws at +18 s as h₁ alone
and is then folded by two eased coefficients `m1`, `m2` (+23–27, +28.5–32.5) with an orange
marker at the breakpoint being folded; `EQ.bumpRed` fades the −2 to red at +23.5; the tag
`g(0.5) = 2` at +33; "the ramps cancel outside one interval" and "three global hinges → one
local feature" close. The three hinges are one non-role hue (cyan, "fixed, not learned") told
apart by line style solid / 10-6 / 4-6, named at the curve ends; board y-range −2.4…3.6 with
rules at −2…3 and the breakpoints as dashed rules. Ported: the picture (integer rules, heavier
zero line, dashed breakpoint rules, breakpoints as the x ticks), the three-line-style hinges in
one non-role colour, the reveal order *hinges → sum as h₁ → h₂ joins → coefficient eases +1 → −2
with the dashed ramp turning over → h₃ cancels → peak named*, the three easings (`MOTION.draw` =
easeInOutSine for a curve drawing on, easeInOutCubic for the three-second flip, easeOutCubic for
a mark entering), and the caption cues. Changed for the book: the film folds the sum *after* all
three hinges stand (two folds, `m1` then `m2`); here the sum is the one object from the climb
beat on and each ramp joins it continuously (the brief's *h₂ enters with coefficient +1, then the
coefficient morphs to −2 with a slope ledger, then h₃ enters*), so the coefficient is seen once,
on the sum and on the dashed ramp together; a slope ledger above the plot writes the slope of the
sum on each of its four pieces, live, which the film has nowhere; a blue probe slides −3 → 5
reading x, g(x) and the piece it is on, which the film has nowhere; the film's orange fold marker
is **not imported** (nothing here is learned, so no orange); the film's red −2 becomes an ink
wash on the formula's coefficient; the curve names sit at the foot of each ramp rather than at
the curve ends (see *What the frame review changed*); the film's carried-in polyline, its
`SceneTitle`, its `Card` chrome, the `SHIFT · SCALE · ADD` kicker and the three definition cards
are not imported.

**Fixture.** The film's hoisted `bumpH1/bumpH2/bumpH3/bumpSum` are *the chapter's own hinges*
(`Math.max(0, x + 1.5)`, `x − 0.5`, `x − 2.5`; `h1 − 2·h2 + h3`), so no film number had to be
rejected; the film's board runs x over −3…4 and the book's `xs` over −3…5, and the panel takes
the book's domain. The film's y-range −2.4…3.6 becomes −2.5…3.5 so the integer rules are the
plot's edges.

`interactives/manifest.json` records three literals Chapter 3 must keep verbatim; the line
numbers are in `chapters/part1/03-nonlinearity-mlp.qmd` at the digest above.

| qmd lines | Literal |
|---|---|
| 248–252 | `xs = torch.linspace(-3, 5, 400)` / `h1 = torch.relu(xs + 1.5)` / `h2 = torch.relu(xs - 0.5)` / `h3 = torch.relu(xs - 2.5)` / `bump = h1 - 2 * h2 + h3` |
| 240 | `1. Combine three shifted hinges into a compact bump.` |
| 272–275 | "Follow the pieces: before the first hinge, all units are silent and the output is zero. After the first breakpoint, $h_1$ starts the climb. The coefficient $-2$ on $h_2$ reverses the slope at the peak, and $h_3$ cancels that downward slope at the final breakpoint. Four linear pieces $\rightarrow$ one compact bump." |

The anchor is the figure cell `fig-hinge-bump` (label at L258), `after-cell` → Quarto's
`cell-fig-hinge-bump` div; the panel is inserted immediately after the figure and before the
paragraph "Follow the pieces". A test asserts the label occurs exactly once and the
`hinge-bump-values` cell precedes it.

The panel is the one in-repo mirror: `data-domain="-3 5" data-breaks="-1.5 0.5 2.5"
data-coefs="1 -2 1"` on the root, read by `interactives/hinge-bump/player.js` and by
`scripts/test_hinge_bump_excerpt.cjs`. A test renders the declared attributes back into the
chapter's own source text — `torch.linspace(-3, 5, 400)`, `h1 = torch.relu(xs + 1.5)`,
`bump = h1 - 2 * h2 + h3` — and asserts the chapter prints no `g(0.5)` and no `= 2`, so the peak
stays declared rather than quietly becoming a fixture.

**Declared computed variants** (recorded in the manifest, repeated here):

1. The peak g(0.5) = 2 and the four piece slopes 0, +1, −1, 0 are computed from the declared
   breakpoints and coefficients — the slope on piece k is the sum of the first k coefficients,
   the peak is the sum at the middle breakpoint. The chapter says the bump "peaks at the middle
   breakpoint", "returns to zero" and has "four linear pieces" (fig-alt L259, prose L272–275)
   but prints neither the value 2 nor the slopes.
2. The running sum is drawn as h₁ first; h₂ joins with coefficient +1 (the sum lifts
   continuously from h₁ to h₁ + h₂); the coefficient eases from +1 to −2 over three seconds with
   the dashed ramp scaled by the same coefficient and the ledger reading the live slope; h₃
   joins. The entry coefficient +1 and every intermediate coefficient are drawing devices of the
   timeline — a reveal, not a control — and no intermediate sum is a number of the chapter.
3. The curves are drawn through 161 samples, −3 + 8 i / 160, so the three breakpoints are
   sample points and every piece is drawn straight; the chapter's figure samples 400 points. The
   plot's y-range −2.5…3.5 clips the hinges where they leave it; the chapter's left panel shows
   them whole.
4. The probe's readouts x and g(x) to two decimals, the slope ledger, the peak tag, the underline
   on the piece being read and the bracket on [−1.5, 2.5] are drawing devices of this scene; g(x)
   at the probe is the declared sum evaluated at the probe's x.
5. The formula line g(x) = h₁ − 2 h₂ + h₃ is the chapter's `bump = h1 - 2 * h2 + h3` written with
   `\predictionpart` and `\featurepart`; the chapter's figure legend writes it as
   `$y = h_1 - 2h_2 + h_3$` (L268).

**The picture.** One SVG. The plot of x from −3 to 5: integer rules with the zero line heavier,
the three breakpoints as dashed vertical rules and as the bold x ticks (−3, **−1.5**, **0.5**,
**2.5**, 5), y ticks −2…3, the typeset `\featurepart{x}` at the axis end. The three hinges in ink
at 0.6 opacity — solid, dashed 10-6, dotted 4-6 — each named at its foot, just under the axis to
the left of its breakpoint, the middle name carrying the live coefficient (`h₂` → `+1 h₂` →
`−0.6 h₂` → `−2 h₂`). Over them, in green and four units wide, the running sum — **the one object
the eye tracks** — drawn on once and afterwards re-shaped by every coefficient that joins it.
Above the plot the slope ledger: `slope` in grey, then the slope of the sum on each of its four
pieces in green above the piece it measures, live while a coefficient moves, bold once named,
underlined while the probe reads it. The peak tag `g(0.5) = 2` in green to the upper left of the
peak, where no ramp passes. The probe: a blue dashed cursor across the plot, a blue dot riding
the green sum, and the readouts `x = …` (blue) and `g = …` (green) in a row under the ticks,
centred on the probe and clamped inside the picture. A green bracket under the plot from −1.5 to
2.5 at the end. Under the picture the one typeset formula `\predictionpart{g}(\featurepart{x}) =
h_1 \: \class{hb-coef}{-2} h_2 + h_3`, hidden until the reverse beat and with the `−2` washed in
ink for that beat; then one caption of at most twenty words.

**Content time** (40 s; `data-duration="40"`, `data-beats="0 4 9 14 20 25 30 36"`, mirrored in
the manifest and checked against the markup by the fixture audit):

| From | Beat | What moves (exactly one thing) | What is written |
|---|---|---|---|
| 0 s | Ask | h₁ draws on 0.4–1.4, h₂ 1.6–2.6, h₃ 2.8–3.8 (easeInOutSine, left to right); each name appears when its ramp is complete | the question; no sum, no ledger |
| 4 s | Climb | the green sum draws on as h₁, 4.4–6.4; the ledger fades in 6.8–7.3 | `0, +1, +1, +1` |
| 9 s | Add | the sum lifts from h₁ to h₁ + h₂ as the entry amount eases 0 → 1, 9.4–11.4 | `+1 h₂`; ledger `0, +1, +2, +2` |
| 14 s | Reverse | the coefficient eases +1 → −2, 14.5–17.5 (easeInOutCubic); the dashed ramp turns over and the sum folds with it | the coefficient live (`+0.4`, `−1.3`, …) then `−2 h₂`; ledger through 0 to `0, +1, −1, −1`; the formula appears, `−2` washed |
| 20 s | Cancel | h₃ joins as its amount eases 0 → 1, 20.4–22.4; the last piece flattens | ledger `0, +1, −1, 0`; wash off |
| 25 s | Name | the peak tag eases in 25.3–25.8; the ledger goes bold | `g(0.5) = 2` |
| 30 s | Probe | the probe slides −3 → 5 at constant speed, 30.4–35.4 | `x = …`, `g = …`; the piece under the probe underlined |
| 36 s | Local | nothing; the bracket appears | the closing caption |

Every schedule finishes before its beat ends, so a beat's end state is its whole state under
reduced motion. The Name beat and the closing beat hold 5 s and 4 s.

**Reduced motion.** The same picture at each of the eight beats with every ramp complete, every
coefficient at its beat value and the probe at its beat position: coefficients (0, 0, 0), (1, 0,
0), (1, +1, 0), (1, −2, 0), (1, −2, 1) ×4; probe absent through six beats, then at 5 — **never
between**. The harness's strict beat-hold test (one drawn state per whole beat) passes.

**Layout.** `layout()` is the only measurement: it reads the pane width once per resize,
fullscreen or toggle and chooses `wide` (viewBox 860 × 354, plot 762 × 252 units) at 600 px and
above or `narrow` (360 × 214, plot 292 × 142) below; `render()` never measures. The type steps
down with the plot in the narrow layout. The static fallback is the wide print only; a narrow
print (the gate product's two-print rule) is not shipped — see *Open*.

**Palette.** Green `#2f855a` (`\predictionpart`) for the running sum, the slope ledger, the peak
tag, the probe's g readout, the bracket and the caption words *sum* / *bump*: the sum is the
prediction. Blue `#2b6cb0` (`\featurepart`) for the probe, its x readout, the axis tag and the
caption word *probe*: x is the input. Ink `#232d4b` for the three hinges, their names, the
coefficient, the wash on the formula's −2 and the caption word *ramp*: the hinges are placed by
hand, so none of them is a quantity the grammar assigns a hue — the film's cyan "fixed, not
learned" hue becomes the book's ink. Grey scenery. **No orange, purple or wine anywhere**: no
learnable parameter, no target, no error, and the boundary says why. The picture reads without
colour: the hinges differ by line style, the sum by weight, the probe's piece is underlined, and
the SVG `<title>` and live `aria-label` name the coefficients, the slopes and the probe's reading.

**Teaching boundary** (the panel's own words): nothing here is learned — the three breakpoints
and the coefficients 1, −2, 1 are placed by hand, as the chapter places them, which is why
nothing on the picture is drawn in the colour reserved for a learnable parameter; the
coefficient's move from +1 to −2 is a reveal on the timeline, not a control the reader turns; one
bump is a construction, not an approximation theorem — how many hinges a target needs, and
whether training finds them, are the chapter's next questions and not this panel's claim.

**Independent checks** (`scripts/test_hinge_bump_excerpt.cjs`: **45 tests** — 21 inherited from
`registerTransportTests`, 1 from `registerBeatHoldTest`, 7 from `registerGrammarTests`, 15
scene-specific, 1 integration; the whole suite went from 344 to **389**). Every arithmetic
assertion recomputes the three hinges and their weighted sum inside the test from the panel's
declared attributes and never calls the player's helper:

- at 801 grid points on −3…5, `bump = h1 − 2 h2 + h3` term by term, zero (to 10⁻¹²) for x ≤ −1.5
  and x ≥ 2.5, positive between; the maximum is 2, attained only at 0.5; finite-difference
  slopes inside each piece are 0, +1, −1, 0; the slopes are the running sums of the
  coefficients; the player's published coefficients and slopes at t = 40 are these;
- at every 0.05 s of the timeline the drawn green path (161 samples, breakpoints among them) is
  the weighted sum of the declared hinges at the *published* coefficients, point by point to
  0.02 units, and the dashed ramp is m · h₂ for the displayed m; the coefficient path is
  (1, 0, 0) → (1, +1, 0) → (1, −2, 0) → (1, −2, 1), monotone through each move, continuous
  (> 60 distinct triples), with h₂ absent before it joins and h₃ absent before it joins;
- the ledger reads the finite-difference slopes of the drawn path on every piece at every
  frame it is present, fades in over 0.5 s and then holds; the coefficient name is `h₂`, then
  `+1 h₂`, a live one-decimal value mid-flip, then `−2 h₂`; ledger `0, +1, +2, +2` before the
  flip, `0, +1, −1, −1` after it, `0, +1, −1, 0` after the cancel;
- the hinges draw on one at a time in order during the ask beat, named only when complete, each
  name at the foot of its ramp; the sum is absent through the ask beat and draws on from the
  left inside the climb beat as h₁ alone; the peak tag exists only from the name beat, the
  probe only from the probe beat, the bracket only from the last, and the bracket spans exactly
  px(−1.5) … px(2.5);
- the probe slides monotonically from −3 to 5 (> 80 distinct positions), its dot at
  (px(x), py(g(x))) for the declared bump, its readouts the declared sum to two decimals, the
  underlined ledger entry exactly the piece containing x, the four pieces read in order, and
  the readout row clamped inside the picture;
- reduced motion: 801 seeks at 0.05 s give one coefficient triple and one probe position per
  beat, exactly the eight states above, never moving; unreduced, the flip passes between +1 and
  −2 with more than thirty distinct values;
- the static, script-free panel prints the final frame — ledger 0, +1, −1, 0; `−2 h₂`;
  `g(0.5) = 2`; `x = 5.00`, `g = 0.00`; the bracket — and every readout of it is identical to the
  t = 40 render; the whole pane minus the control bar is byte-equal to that render; the
  committed static frame is the player's own t = 40 drawing (`render_static_frames.cjs --check`);
- each beat toggles exactly its root classes (`show-formula` from the reverse beat, `wash-coef`
  in it alone); every class the player sets has a rule in `player.css`; no orange, purple or wine
  hex in the stylesheet; the two formulas are TeX in `eq-hinge-bump-` wrappers with
  `\predictionpart{g}(\featurepart{x})` and `\class{hb-coef}{-2}`, the only digits the identity's
  own, unchanged across 801 seeks; captions ≤ 20 words with the `prediction-role`, `input-role`
  and `hinge-role` words, no chrome, and the scrubber wording never repeats the caption;
- the narrow layout: viewBox 360 × 214, every label and every sample inside it, the sum still
  the bump in the narrow geometry, the axis tag inside the picture; a resize flips the mode in
  place;
- the panel is the only fixture copy: moving `data-breaks` to `-1 1 3` and `data-coefs` to
  `2 -4 2` moves the ledger to `0, +2, −2, 0`, the tag to `g(1) = 4`, the name to `−4 h₂`, the
  captions to `past 1 … falls at −2` and `Outside [−1, 3]`, and no `0.5`, `2.5` or `−1.5`
  survives on the picture;
- the filter's non-HTML guard is its first executable line, it decodes the manifest and names no
  scene, it can place an `after-cell` anchor, the `_quarto.yml` resource line exists and
  `panel.html` is not a resource, the anchor label occurs exactly once after the fixture cell.

**Fault injection.** 21 mutations, each a single broken source line in `player.js`,
`panel.html`, `player.css`, `interactives/manifest.json` or `_quarto.yml`, applied one at a time
to a scratch copy of the repository and restored with a SHA-256 byte check before the next:
**21 caught** (11, 9, 7, 4, 7, 4, 11, 2, 2, 4, 4, 4, 2, 7, 4, 3, 4, 8, 1, 1 and 1 failing tests
respectively). They cover: the breakpoints mirrored in `hinge()`; the coefficients ignored in
`sumAt()`; a non-cumulative ledger; the probe reading the piece after its own; the peak read at
the last breakpoint; h₂ in the sum before it joins; the coefficient flipping to +2; reduced
motion reading the clock; the green curve drawn at the final coefficients while the published
ones move; the dashed ramp not scaled; the probe's dot riding h₁; the g readout printing x; the
probe sliding the wrong way; the ledger negated; the bracket running to the end of the domain;
the wash never leaving; the static fallback's third slope reading +1; a declared breakpoint the
chapter does not print (2.5 → 2.4); a manifest literal the chapter does not contain; the
`_quarto.yml` resource line removed; the sum drawn in ink. No equivalent mutants. Script and
results: `<scratch>/wave2/hinge-bump/fault-inject.py`, `fault-results.json`.

**Browser review** (headless Chromium via Playwright against the rendered `_book` on :8777,
`quarto render --to html --no-clean` exit 0; the panel is inserted after the `fig-hinge-bump`
figure and before "Follow the pieces"; page console **empty** at both widths). Every beat and
the mid-beat moments shot at 1280 × 1000 and 390 × 1000, 16 frames each
(`<scratch>/wave2/hinge-bump/frames/hinge-bump-excerpt-w{1280,390}-t{0000,0002,0004,05.5,0009,
10.4,0014,0016,0020,21.4,0025,0030,32.6,0034,0036,0040}.png`), and every frame looked at:

- 1280 px: the plot with its ledger row above and its readout row below; the three ink ramps
  told apart at a glance; the green sum drawn on, lifted, folded and flattened; the live
  coefficient and ledger during the flip (`−0.5 h₂`, `+0.5`); the peak tag clear of h₁; the probe
  at the peak with `x = 0.52  g = 1.98` under the ticks and the `−1` underlined; at 5 the dot
  clear of the `x` tag; the bracket under the ticks.
- 390 px: the same plot in 292 × 142 units with 11-px type; every name, tick and readout inside
  the picture, no horizontal page overflow; the formula and caption wrap normally.
- Opens **paused** at the anchor at both widths (`data-ready`, `time = 0`, `playing = false`).

**What the frame review changed** (one round; each is a rule the test suite now holds): the
first build named the curves at their ends as the film does — on this smaller board the
`+1 h₂` name ran into `h₃` at 390 px, the mid-flip `−0.5 h₂` sat on its own dashed line at both
widths, and the settled `−2 h₂` (in the tick row, under where the ramp leaves the plot) touched
the `2.5` tick at 390 px; and the probe's dot at x = 5 touched the typeset `x` tag. The names now
sit at the foot of each ramp, under the axis to the left of the breakpoint, a corner that is
empty at every coefficient (the hinge is zero there and every other curve sits on or above the
axis); the plot's right edge was pulled in eight units so the dot clears the tag; the viewBox was
trimmed to the readout row. The test asserts the foot placement.

**Deliberate choices, recorded.** (i) The sum as the one object from the climb beat, each ramp
joining it continuously, rather than the film's draw-then-fold: the brief's order, and one
coefficient seen once rather than twice. (ii) The slope ledger and the probe: added to the film's
picture so the four pieces and the return to zero are read off the picture rather than remembered;
their numbers are computed from the fixture and declared. (iii) The coefficient's entry at +1
before it eases to −2: the reveal the brief asks for, declared as a drawing device. (iv) The
film's orange fold marker not imported: nothing here is learned. (v) The film's red −2 as an ink
wash: red is the book's error colour and no error is on this picture. (vi) Names at the feet of
the ramps rather than the film's curve ends (above).

**Open.** (a) No narrow static print: with scripts off, a phone shows the wide frame scaled to
296 px (type ≈ 5 px). The gate product's two-print rule would fix it and is a mechanical
addition; left for the author's call on whether the rule is general. (b) The film's predict hold
(+14.5–18, "predict the sum before it draws") is not a separate beat: the question above the pane
and the ask beat's caption carry it, and the sum begins at 4 s. (c) The film's bridge (the ReLU
polyline carried in from the Hinge scene) is not ported; the chapter's own §3.2 precedes the cell.

**Revision, September 10, 2026 — "make the point land at a glance."** The author looked at the
Wave 2 scenes and said they are correct but dense: *"we want them to help understanding the
subject via the animation while being simple and easy to see the point of the animations."* For
this scene the wave2b brief was specific: *lead with the finished bump greyed in as a target
silhouette, then build it; drop the slope ledger to only the slopes that matter at the moment they
matter; drop the probe unless it earns its 6 s.* The mechanism did not change and no number,
invariant, literal or caveat was removed from the scene — only from the picture, and every honest
qualifier that left the picture is in the boundary paragraph, the transcript, the SVG `<title>` or
the live `aria-label` below. **Timeline 40 s → 36 s, eight beats → five, intro 97 words → 38,
captions ≤ 20 words → ≤ 14, and numbers standing on the picture at the busiest instant 19 → 7.**
Where each cut thing went:

| Cut from the picture | Where it went |
|---|---|
| **The four-second draw-on of the three hinges** (the old *Ask* beat, 0–4 s), which left `t = 0` an empty plot — this scene's worst failure against the wave2b rule that the first five seconds must state the question visually. | **Deleted.** The three ramps, their names and the pale-green target already stand at `t = 0`, and a reader who never presses play sees three lines that only climb beside the bump they are supposed to make. Transcript item 1 is rewritten from "three hinges draw on" to "three hinges stand". |
| **The whole *Add* beat** (h₂ entering at coefficient **+1**, ledger `0, +1, +2, +2`) and the *Reverse* beat's three-second **+1 → −2** ease with its live fractional coefficients (`+0.4`, `−1.3`, `−0.6 h₂` …). | h₂ now **joins already at −2**, in a single eased amount (2 s, `easeInOutCubic`) that both swings the drawn dashed ramp from `+h₂` down to `−2 h₂` and admits it into the sum from 0 to −2 — the same motion seen twice. This is a net **honesty gain**: the invented intermediate coefficients stop being drawn, so declared computed variant 3 shrinks and the entry coefficient +1 stops having to be declared at all. The teaching content — *at +1 the sum would keep climbing; −2 is what turns it over* — is one sentence in the boundary paragraph, phrased as a remark about how the chapter's combination is built rather than as something the panel shows. |
| **The *Probe* beat** (30–36 s): blue cursor, riding dot, `x = …`, `g = …`, and the underline on the piece being read. Six seconds and two live numbers restating what the slope entries already wrote. | **Deleted.** The boundary paragraph keeps the claim in prose ("the finished bump has four straight pieces, of slopes 0, +1, −1, 0"); the transcript keeps the reading in order. Declared computed variant 5 shrinks to the slope entries, the peak numeral and the bracket. With the probe gone, blue (`\featurepart`) belongs to the typeset axis tag `x` alone, and no caption word is blue. |
| **The *Name* beat** as a beat of its own. | **Merged into the payoff**, where the peak eases in as h₃ lands, so the answer frame carries the height. |
| **The four-entry slope ledger** banked permanently in a row above the plot, with its states `0, +1, +2, +2` and `0, +1, −1, −1`, and the grey `slope` heading of its own. | **Reduced, not deleted.** At most **two** entries stand at once, each written against the piece it measures rather than in a top row, and each retired when its beat ends: `+1` at Climb, `+1` and `−1` at Fold, and at the payoff the single `0` of the flat piece the bump has returned to. The grey word `slope` rides the first entry instead of heading a row. The full list `0, +1, −1, 0` is in the transcript and in the live `aria-label`, and a test asserts both. |
| **The second `0`** at the payoff, on the right-hand flat piece. | Deleted: a piece that is visibly flat *on* the zero line, beside the `0` tick, does not need its slope written, and writing it twice spends a number on nothing. The left entry stays as the anchor for the four-slope claim. |
| **`g(0.5) = 2` as a written tag.** | A **bare green `2` at the apex**. `g` is named by the formula line directly beneath the picture and `0.5` is the tick directly beneath the peak, so the tag was spending three numbers on one fact. The sentence itself is in the SVG `<title>`, in the live `aria-label` (*"Peak g(0.5) = 2."*), in the transcript and in this receipt; the transport suite's witness regex still matches the panel's own text. Payoff numbers 8 → 7. |
| **Five of six y-tick numerals** (−2, −1, 1, 2, 3) and **two of five x-tick numerals** (−3, 5); the plot's y-range tightened from −2.5…3.5 to **−1.1…3.1**, which removes the dead band and makes the bump the largest thing on the picture. | **Deleted as scenery.** The faint integer rules stay, the zero line stays heavier, and the three breakpoints are the only x ticks. The domain −3…5 is in the fixture table above, in the SVG `<title>` and in the transcript; the bump's height is read off the green `2`. |
| **59 words of intro** (97 → 38): the three `relu` expressions, `xs from −3 to 5`, `bump = h1 - 2 * h2 + h3`, and the clause about the probe. | The expressions are already verbatim in the fixture-literal table above, in the SVG `<title>` and in the transcript, and the chapter's own figure plots them immediately above the panel. The probe clause is deleted because the probe is. |
| **The interval `[−1.5, 2.5]` from the payoff caption** ("the sum is zero outside [−1.5, 2.5]"). | The **bracket mark** states it, and the caption at the moment the reader is looking at the picture is plainer: *"The third ramp cancels the fall. The sum is flat at zero."* The interval is in the SVG `<title>` and in the live `aria-label` (*"The sum is nonzero only on [−1.5, 2.5]."*); a test asserts no caption ever prints a `[`. |

Four things were **added**, three of them the judge's grafts against the winning
`hinge-bump-restage` storyboard:

1. **The target silhouette** — the scene's one new drawn object, and the reason the payoff is on
   the picture at `t = 0`. It is the declared bump, evaluated at the same 161 samples, filled over
   [−1.5, 2.5] with a light dashed edge over the same span and the caption's own word `bump` on
   the fill. The build then chases it: the sum overshoots it at Climb, overshoots it the other way
   at Fold, and lands on it at Close, where it is consumed. It is *fill-dominant with a light
   stroke* and the sum is the only heavy line, so the two never read as two curves — the
   distinction is weight and texture, not colour, because they are deliberately the same green.
2. **Each ramp drawn from its own breakpoint**, and the silhouette's stroke clipped to the support.
   Before this, the three hinges' flat halves and the silhouette's flat ends laid four dash
   patterns along the zero line and the axis itself read as dashed. Nothing about `relu` is hidden:
   a ramp that visibly begins at its breakpoint *is* "zero up to the breakpoint", and the transcript
   and the `<title>` say so. A fault-injection mutant restores the old full-domain draw.
3. **The bracket moved into a row of its own, below the tick numerals** (it used to run through the
   row that holds `−1.5` and `2.5`). Same mark, same span, same colour, one row lower.
4. **A drawn-number budget, asserted.** No frame writes more than eight numbers on the picture,
   counting every text element on the drawing that carries a digit; the test also pins the exact
   per-beat maxima, so a regression that banks a row of numbers again fails as a number rather than
   as a judgement. The intro (≤ 40 words) and every caption (≤ 14 words) are pinned the same way.

**Content time after the revision** (36 s; `data-duration="36"`, `data-beats="0 6 14 22 30"`,
mirrored in the manifest and checked against the markup by the fixture audit). Every schedule
finishes before its beat ends, so a beat's end state is its whole state under reduced motion;
the holds are 6, 8, 8, 8 and 6 s and nothing flashes.

| From | Beat | What moves (exactly one thing) | Marks written | Marks retired | Numbers |
|---|---|---|---|---|---|
| 0 s | **Target** | nothing: the picture already asks the question | the three ramps and their names; the target silhouette and the word `bump`; the breakpoint rules and ticks `−1.5`, `0.5`, `2.5`; the y tick `0`; the typeset axis tag `x` | — | 4 |
| 6 s | **Climb** | the green sum draws on, left to right, as h₁ (6.4–8.6 s, `easeInOutSine`) | `slope +1` against the climbing piece (9.0–9.5 s) | the word `bump` (6.4–7.2 s) | 5 |
| 14 s | **Fold** | one eased amount (14.5–16.5 s, `easeInOutCubic`) swings the dashed ramp from `+h₂` down to `−2 h₂` **and** folds the sum with it | `−2 h₂` on the ramp's name and `−1` against the falling piece (17.0–17.5 s); the formula line appears with its `−2` washed | — | 7 |
| 22 s | **Close** — *payoff* | h₃'s amount eases 0 → 1 (22.4–24.4 s, `easeInOutSine`) and the last piece flattens **onto** the silhouette | `slope 0` (25.2–25.7 s); the peak `2` (25.7–26.2 s, `easeOutCubic`); the bracket drawing across (26.4–27.0 s) | the silhouette, consumed 24.4–25.2 s, having been reached; `+1` and `−1` at 25.2 s; the formula's wash | 7 |
| 30 s | **Hold** | the three ramps and their names fade to a ghost (group opacity 1 → 0.5, effective 0.29; 30.4–31.4 s) | — | — | 7 |

**Reduced motion after the revision.** Five pictures, one per beat: coefficients (0, 0, 0),
(1, 0, 0), (1, −2, 0), (1, −2, 1), (1, −2, 1); the drawn middle ramp at 1, 1, −2, −2, −2; the
target whole, whole, whole, gone, gone — **never in between**. The harness's strict beat-hold test
(one drawn state per whole beat) passes, and a scene test asserts the five states literally.

**Declared computed variants after the revision** (six; recorded in the manifest, and the reason
each moved):

1. Unchanged — the peak g(0.5) = 2 and the four piece slopes 0, +1, −1, 0 are computed from the
   declared breakpoints and coefficients; the chapter prints neither. Extended by one sentence:
   the picture now writes the peak as a bare numeral and the sentence lives in the title, the
   `aria-label` and the transcript.
2. **New** — the target silhouette is the declared bump *drawn ahead of its own construction*: a
   target to aim at, not a second measurement. A test proves it is the declared bump at every
   frame it is drawn, that it spans exactly the support and closes on the zero line, and that it
   is retired only once the published coefficients make the sum equal the bump at all 161 samples
   to 10⁻¹².
3. **Shrunk** — the entry amounts. One eased amount swings the ramp and admits h₂; h₃'s amount
   eases 0 → 1. No intermediate value of either is written anywhere on the picture, so the old
   variant's "+1 entry coefficient and every intermediate coefficient" is gone.
4. Extended — the 161 samples, plus *each ramp is drawn only from its own breakpoint rightwards*
   and the y-range is now −1.1…3.1.
5. **Shrunk** — the drawing devices are now the slope entries, the peak numeral and the bracket;
   the probe's two readouts and the underline are gone with the probe.
6. Unchanged — the formula line is the chapter's `bump = h1 - 2 * h2 + h3` in the book's macros.

**Independent checks after the revision** (`scripts/test_hinge_bump_excerpt.cjs`: **47 tests** —
21 inherited from `registerTransportTests`, 1 from `registerBeatHoldTest`, 6 from
`registerGrammarTests` (now called with a fourteen-word caption budget), 18 scene-specific and 1
integration; the suite went from 45 to 47 and the whole HTML suite to **493**). Every arithmetic
assertion of the first build survives; these are the ones that changed or are new:

- **unchanged** — at 801 grid points on −3…5, `bump = h1 − 2 h2 + h3` term by term, zero (to
  10⁻¹²) for x ≤ −1.5 and x ≥ 2.5, positive between; the maximum is 2, attained only at 0.5;
  finite-difference slopes inside each piece are 0, +1, −1, 0; the slopes are the running sums of
  the coefficients; at every 0.05 s the drawn green path (161 samples, breakpoints among them) is
  the weighted sum of the declared hinges at the *published* coefficients, point by point to 0.02
  units;
- **rewritten** — the coefficient path is now `(1, 0, 0) → (1, −2, 0) → (1, −2, 1)`, with the
  sum's h₂ coefficient **never positive** at any of the 721 sampled frames, monotone through each
  move and continuous (> 60 distinct states); the drawn middle ramp's scale is published
  separately, is `1` before the fold and `−2` from the close beat on, stays inside [−2, 1], and
  swings monotonically over the same two seconds — a test asserts both move and both land;
- **new** — each ramp's drawn path *starts at its own breakpoint* and runs to the domain's end,
  and its ordinates are `scale · relu(x − b)` for the published scale;
- **new (the silhouette contract)** — at every frame the target's stroke is the declared bump at
  the 81 samples of the support, spans exactly px(−1.5)…px(2.5), and its fill closes on the zero
  line at both ends; its opacity never increases; and it is below 1 only at frames where the
  published coefficients make the sum equal the declared bump at **all 161 samples to 10⁻¹²**. It
  is whole at beats 1–4 and gone at beat 5; the word `bump` retires as the sum starts, and the
  peak numeral is drawn at exactly the coordinates the word left;
- **new (the budget)** — at most two slope entries stand at any frame; each equals `signed()` of
  the finite-difference slope of the drawn green path on the piece it is written over, and sits
  within that piece's own span; the word `slope` is written exactly once; the sequence of entry
  sets across the timeline is exactly `{}`, `{1}`, `{1, 2}`, `{0}`; no frame writes more than
  eight numbers and the per-beat maxima are pinned at 4, 5, 7, 7, 7; the intro is ≤ 40 words
  (it is 38) and every caption ≤ 14 (they are 11, 12, 13, 12, 10); no caption prints a `[`;
- **new** — no coefficient other than the declared −2 is ever written on the picture, at any of
  the 721 sampled frames;
- **rewritten** — reduced motion: 721 seeks at 0.05 s give one coefficient triple, one ramp scale
  and one target opacity per beat, exactly five states, never moving; unreduced, the swing passes
  between +1 and −2 with more than thirty distinct values;
- **rewritten** — the static, script-free panel prints the Hold frame — `slope 0`; `−2 h₂`; the
  peak `2`; the bracket; the ramps ghosted — every readout of it is identical to the t = 36
  render, the whole pane minus the control bar is byte-equal to that render, and the committed
  static frame is the player's own t = 36 drawing (`render_static_frames.cjs --check`). The
  sentence the bare `2` stands for is asserted present in the `<title>` and the `aria-label`,
  as is `[−1.5, 2.5]`;
- **rewritten** — each beat toggles exactly its root classes (`show-formula` from the fold beat,
  `wash-coef` in it alone); the narrow layout is viewBox 360 × 192 with every label inside it, the
  sum still the bump in the narrow geometry, and the bracket still below the narrow tick row;
- **rewritten** — the fixture-mirror mutation: moving `data-breaks` to `-1 1 3` and `data-coefs`
  to `2 -4 2` moves the written slope, the peak numeral to `4`, the ramp name to `−4 h₂`, the
  `aria-label` to *"Peak g(1) = 4"* and *"nonzero only on [−1, 3]"*, and the captions to
  *"climbing at +2"* and *"joins at −4: past 1 … falls at −2"*, and no `0.5`, `2.5`, `−1.5` or
  bare `2` survives on the picture.

**Browser review after the revision** (headless Chromium via Playwright against the rendered
`_book` on :8777; `quarto render --to html --no-clean` exit 0 with no error line, no `.qmd` and no
`_freeze` touched; the panel is still inserted after the `fig-hinge-bump` figure and before "Follow
the pieces"). Every beat and the mid-beat moments shot at 1280 × 1000 and 390 × 1000, 15 frames
each (`<scratch>/wave2b/after/hinge-bump/hinge-bump-excerpt-w{1280,390}-t{0000,0003,0006,0009,
0012,0014,15.5,0018,0022,0024,0025,0027,0030,0031,0036}.png`), and every frame looked at. At both
widths the panel reports `data-ready="true"`, `data-typeset="mathjax"`, two `mjx-container`s, the
clock at `0:00 / 0:36`, **paused**, **console empty**, and no horizontal page overflow.

- **1280 px.** `t = 0` is the question with no prose: three ever-climbing ramps and the pale-green
  filled `bump` beside them, one grey zero line with nothing dashed on it, three breakpoint ticks
  and a single `0`. The Climb frame shows the sum overshooting the target; the mid-fold frame
  (`t = 15.5`) shows the dashed ramp swung to a shallow negative and the sum flat-topped, which is
  the clearest single frame of "the ramp turning over drags the sum down"; `t = 27`, the payoff, is
  complete on its own — bump landed, target gone, `slope 0`, the green `2` at the apex, the bracket
  in its own row under `−1.5 … 2.5`, and the typeset `g(x) = h₁ − 2h₂ + h₃` beneath.
- **390 px.** The same plot in 304 × 126 units with 11-px type; every name, tick, slope entry and
  the bracket inside the picture; the `slope` word and the `−2 h₂` name — the two collisions the
  judge predicted at this width — both clear, because the name sits at the ramp's foot left of its
  breakpoint and the entry sits over its own piece.
- **The ghost, and the static print.** The final frame is the Hold frame, so the static fallback
  carries the ramps at a ghost. The storyboard's mock read 0.16; that is too faint to survive
  print, so the group opacity is 0.5 against a base of 0.58 — **effective 0.29** — and the ghosted
  frame was looked at at both widths: the three line styles and the three names, `−2 h₂` included,
  are still readable, so the fallback keeps the Hold frame rather than falling back to Close.
- **Also changed by looking:** the viewBox was trimmed from 860 × 322 to **860 × 306** (360 × 192
  narrow) after the first shoot, because the bracket's own row left a band of dead white under the
  picture at every beat before the payoff.

**What this supersedes.** Everything above this paragraph in the `hinge-bump-excerpt` section
describes the first build and is kept as the record of it. Where the two disagree — the eight-beat
40-second timeline, the *Ask* / *Add* / *Reverse* / *Name* / *Probe* beats, the four-entry slope
ledger, the probe and its readouts, the `g(0.5) = 2` tag, the y ticks, the 97-word intro, the
`(1, 0, 0) → (1, +1, 0) → (1, −2, 0) → (1, −2, 1)` coefficient path, the 21-mutant fault run and
the *Open* item (b) about the predict hold — **this revision is authoritative**. Open item (a),
the missing narrow static print, still stands. Open item (c), the film's carried-in polyline, still
stands. One new open item: **(d)** the counterfactual *with +1 instead of −2 the sum would keep
climbing* is now a sentence in the boundary paragraph and is the one claim in this panel's prose
that its picture never demonstrates; the author may prefer it cut rather than asserted.

**Fault injection after the revision.** 37 mutations, each a single broken source line in
`player.js` (31), `panel.html` (2), `interactives/manifest.json` (2), `_quarto.yml` (1) or
`player.css` (1), applied one at a time to a scratch copy of the repository and restored with a
SHA-256 byte check before the next: **37 caught, 0 missed** (9, 9, 9, 6, 6, 5, 1, 10, 4, 4, 5, 5,
1, 4, 4, 1, 1, 1, 1, 5, 4, 9, 1, 1, 5, 4, 5, 2, 5, 3, 1, 6, 8, 1, 5, 1 and 1 failing tests
respectively, against a green baseline of 47). Every arithmetic assertion in the suite is covered
at least once. They are: the breakpoint mirrored in `hinge()`; a hinge made two-sided; the
coefficients ignored in `sumAt()`; a non-cumulative slope rule; every slope negated; the peak read
at the last breakpoint; the return level read inside the support; the middle ramp joining at +2;
h₂ in the sum before it joins; h₃ in the sum before it joins; the drawn ramp not swinging with the
coefficient it shares; the drawn ramp overshooting it; the green curve drawn at the final
coefficients while the published ones still move; the dashed ramp drawn unscaled; a ramp drawn
from the left edge again (the old zero-line overdraw); the target drawn from the running sum
rather than the declared bump; the target retired as h₃ begins to join, before the sum has reached
it; the target's stroke run over the whole domain; its fill left open; the target coming back
after it has been consumed; a slope entry written over the next piece along; the four-entry row
banked back; the second slope written before the swing that makes it true has finished; the live
coefficient written on the ramp mid-swing; the peak numeral printing the return level; the bracket
running to the end of the domain; the bracket drawn back up through the tick numerals; reduced
motion reading the clock; the ramps never stepping back; the wash never leaving the coefficient;
the long intro restored over the forty-word budget; a caption over the fourteen-word budget with
the interval spelled out again; a declared breakpoint the chapter does not print (2.5 → 2.4); a
manifest literal the chapter does not contain; the manifest timeline no longer the panel's; the
`_quarto.yml` resource line removed; the sum drawn in ink. **One first-round mutant was equivalent
and was replaced:** `const done = stage >= 3` for `stage >= 3 && held >= landed` changes nothing
observable, because the fade is clamped and the target still begins to go only at the moment the
sum lands; the replacement retires the target as h₃ *begins* to join, and is caught by the
silhouette contract. Script and results:
`<scratch>/wave2b/fault-inject-hinge.py`, `fault-results-hinge.json`.

## `quantization-grid-excerpt` (Chapter 17)

**Question.** *Eight values, seven grid points — which survive unchanged, which two pairs collide?*
The reader answers before any grid exists: through the whole first beat the eight values arrive on
a bare number line, one after another, each written above its dot, and no tick, error bar or
number is drawn.

**What the film gave, and what was taken.** `QuantGrid` draws one number line carrying nine seeded
schematic weights, disclosed on screen as `not the 64×256 study`; the 255-level 8-bit grid snaps
them with invisible error; at +24 s the grid drops to fifteen 4-bit ticks, the dots visibly move,
red per-weight error bars appear beneath, and four cards (bits, Q, payload · 1B values, role)
recompute in the same window; the equation focus at +40 shows `EQ.payload`, `EQ.symmetric` and
`EQ.affine`. Ported: the picture (one number line, the grid as ticks, the dots snapping to them,
the error bars beneath), the reveal order *values → fine grid, invisible error → coarser grid,
visible error → the numbers recompute*, the film's `smooth` easing (`Easing.easeInOutCubic`) on the
snap, the payload line, and the caption cues (534 "payload is N times b over eight bytes — the grid
is the price"; 547 "round to the nearest tick, then rescale — reconstruction, not recovery").
Changed for the book: the film's **nine seeded schematic weights are not imported** — the chapter's
eight printed values govern; the film drops to **4 bits (15 ticks)** where the book's printed
fixture is the **3-bit grid (7 ticks)**, so the timeline drops 8 → 3 and 4 becomes one stop of the
reader's control; the film's four cards become two stats lines and a payload line written on the
picture itself (no cards — visual grammar rule 1); the film's blue-then-green dots become **orange**,
because these values are the learnable parameters, and its red bars the book's wine; the film's
`Card` chrome, its `Scene` title and kicker, its `role: representation` card and its affine-equation
focus are not ported (the boundary paragraph carries the role, and the affine grid is the chapter's
next step). The one parameter control is this panel's own, on the gate product's precedent.

**Fixture.** The chapter's own left-hand panel of `fig-quantization-granularity`: `values`, and
`grid = np.arange(-3, 4) / 3`, which is exactly @eq-symmetric-quantization at *b* = 3 — codes −3…3,
*Q* = 2^{b−1} − 1 = 3, and *s* = max|W| / *Q* = 1/3 because the largest value is 1. A test proves
that identity from the declared attributes rather than assuming it.

`interactives/manifest.json` records seven literals Chapter 17 must keep verbatim; the line numbers
are in `chapters/part5/17-peft-quantization.qmd` at the digest above.

| qmd lines | Literal |
|---|---|
| 1132–1134 | `grid = np.arange(-3, 4) / 3` / `values = np.array([-1.00, -0.79, -0.54, -0.11, 0.08, 0.31, 0.72, 1.00])` / `rounded = np.clip(np.round(values * 3), -3, 3) / 3` |
| 963–965 | `Q=2^{b-1}-1,` / `\qquad` / `s=\frac{\max_{ij}|W_{ij}|}{Q}.` |
| 969–976 | the `clip(round(W/s), -Q, Q)` / `\widehat W_{ij}=s q_{ij}` block closing `$$ {#eq-symmetric-quantization}` |
| 982 | `rounding gives $|W_{ij}-\widehat W_{ij}|\le s/2$.` |
| 945–946 | `\text{payload}=\frac{Nb}{8}\ \text{bytes}.` closing `$$ {#eq-quant-payload}` |
| 948–949 | "One billion FP16 weights therefore require 2 GB in decimal units; an ideal packed 4-bit payload requires 0.5 GB." |
| 1124 | "A 3-bit symmetric example (left) rounds real values to seven levels." (the figure caption) |

The anchor is the figure cell `fig-quantization-granularity` (label at L1123), `after-cell` →
Quarto's `cell-fig-quantization-granularity` div; the panel is inserted immediately after the
figure and before the paragraph "The global 8-bit grid has only 2.13% relative output error". A
test asserts the label occurs exactly once and that both equations precede it.

The panel is the one in-repo mirror: `data-values="-1.00 -0.79 -0.54 -0.11 0.08 0.31 0.72 1.00"
data-grid="-3 4 3" data-bit-choices="2 3 4 8" data-timeline-bits="8 3" data-payload-values="1000000000"`
on the root, read by `interactives/quantization-grid/player.js` and by
`scripts/test_quantization_grid_excerpt.cjs`. A test renders the declared attributes back into the
chapter's own source text — `values = np.array([-1.00, …])`, `grid = np.arange(-3, 4) / 3` — and
asserts the chapter prints **none** of the numbers this panel computes (`0.667`, `0.1267`, `0.127`,
`0.375 GB`), so they stay declared computed variants rather than quietly becoming fixtures. A
declared grid that is not the chapter's symmetric one is refused by the player, loudly.

**Declared computed variants** (recorded in the manifest, repeated here):

1. The 3-bit reconstructions −1, −0.667, −0.667, 0, 0, 0.333, 0.667, 1 — the chapter's own
   `rounded = np.clip(np.round(values * 3), -3, 3) / 3`, which the cell computes and draws but never
   prints — the eight errors (0, 0.1233, 0.1267, 0.1100, 0.0800, 0.0233, 0.0533, 0), the largest
   error **0.1267 < s/2 = 0.1667**, and the two collisions (−0.79 and −0.54 onto −0.667; −0.11 and
   0.08 onto 0) are recomputed by the player and, independently, by the tests from the declared
   values with @eq-symmetric-quantization at *b* = 3. `np.round`'s half-to-even rule is kept, and a
   test asserts no declared value sits on a rounding half at any declared bit width, so the two
   roundings cannot disagree on this fixture.
2. The **8-bit grid** the timeline shows first: the chapter's own rule at *b* = 8 — *Q* = 127,
   *s* = 0.0079, 255 ticks, every error at most *s*/2 = 0.0039 (the largest 0.0035), no collision.
   The chapter names 8 bits only in its per-tensor/per-row audit; this grid on these eight values is
   computed here, and it is drawn as a **band carrying its tick count** wherever 255 ticks cannot be
   separated at the pane's width (a comb of 255 ticks at 2000 px, and a test proves both).
3. The reader-set grids **b = 2** (*Q* = 1, three ticks 1.000 apart, three collisions of 3, 3 and 2
   values, largest error 0.460 ≤ 0.500) and **b = 4** (*Q* = 7, fifteen ticks 0.143 apart, no
   collision, largest error 0.067 ≤ 0.071): the same rule at the two other stops of the one control.
   Neither is printed in the chapter.
4. The payload line applies @eq-quant-payload to *N* = 10⁹ at the current *b*: 0.375 GB at 3 bits,
   1 GB at 8, 0.5 GB at 4, 0.25 GB at 2. The chapter prints 2 GB for FP16 and 0.5 GB for 4-bit
   (L948–949), and a test asserts the same arithmetic gives those two.
5. The dots slide continuously from where the previous grid left them to their new ticks; while
   they slide, the bar beneath each is the distance it has moved so far, and no intermediate
   position is a number of the chapter. The basins (each tick's ±s/2 share of the line), the
   ±s/2 bracket, the rings and ×2 marks on a collision, the stacking of dots that share a tick,
   the ghost at each value's origin and the word *unchanged* are drawing devices of this scene.
6. The formula line is @eq-symmetric-quantization without its clip and its *ij* indices — the clip
   never acts here because the maximum is used for calibration (L979–981) — written with the book's
   `\parameterpart` macro on *w*.

**The picture.** One SVG: a number line from −1.00 to 1.00. Above it, the eight values in orange,
each over its dot; on it, the eight dots — **the one object the eye tracks** — which slide to their
nearest ticks and stack, one lift per dot, where two or three share a tick. The grid is 2*Q* + 1
ink ticks, or, where they cannot be separated, a pale band carrying `255 ticks`; its labels are
written every *k*-th code, *k* the smallest count whose spacing clears a label, with the two ends
always written and a `×2` in wine beside a tick that took two values. Under each moved value, in
its own lane, a **wine bar whose length is the move** — the reconstruction error drawn as the
distance it is; the value's ghost stays behind as an open orange ring wherever it would clear its
dot. Above the line, from the bound beat, each tick's basin washed alternately in wine and a wine
bracket across ±s/2 about zero (a single upright tick where the bound is finer than the line can
span — at 8 bits it is). Under the line: the survivors named *unchanged*, then
`Q = 3 · 7 ticks · s = 0.333` at the left with `max |error| = 0.127 ≤ s/2 = 0.167` in wine at the
right, then `payload = 0.375 GB per 10⁹ values at b = 3`. Below the picture the one control — a
four-stop range for *b* with its readout — then the one typeset formula
`\widehat{w} = \class{qg-s}{s}\,\operatorname{round}(\parameterpart{w}/\class{qg-s}{s})`,
`\class{qg-s}{s} = \max|\parameterpart{w}| / \class{qg-Q}{Q}`, `\class{qg-Q}{Q} = 2^{b-1}-1`,
and one caption of at most twenty words.

**Content time** (40 s; `data-duration="40"`, `data-beats="0 5 11 19 27 33 37"`, mirrored in the
manifest and checked against the markup by the fixture audit):

| From | Beat | What moves (exactly one thing) | What is written |
|---|---|---|---|
| 0 s | Ask | the eight dots arrive left to right, 0.4 + 0.3 k, half a second each (easeOutCubic) | the eight values; no grid, no number |
| 5 s | Eight bits | the band fades in 5.3–5.9; the dots snap 6.2–8.2 (easeInOutCubic); the bars and stats 8.4–8.9 | `Q = 127 · 255 ticks · s = 0.0079`; `max \|error\| = 0.0035 ≤ s/2 = 0.0039`; the formula appears |
| 11 s | Drop | *b* falls to 3 at 11.3 and the band crossfades to seven ticks by 12.0; each dot slides to its nearest tick 12.3–15.3; the error line returns 15.8–16.3 | `Q = 3 · 7 ticks · s = 0.333`; `Q` washed in the formula |
| 19 s | Bound | the basins and the ±s/2 bracket fade in 19.3–20.0 | `±s/2 = 0.167`; `max \|error\| = 0.127`; `s` washed |
| 27 s | Collide | the two rings and the two `×2` marks fade in 27.3–28.0 | the pairs, in the caption: −0.79 and −0.54 → −0.667; −0.11 and 0.08 → 0 |
| 33 s | Payload | the payload line fades in 33.3–33.9 | `payload = 0.375 GB per 10⁹ values at b = 3` |
| 37 s | Hold | the two *unchanged* tags fade in 37.3–37.8 | only ±1.00 survive; the slider is the reader's |

Every schedule finishes before its beat ends, so a beat's end state is its whole state under
reduced motion. The Bound and Collide beats hold 8 s and 6 s; the closing beat holds 3 s before the
timeline ends on the same picture.

**Reduced motion.** The same picture at each of the seven beats with the dots jumped to their
beat's ticks: *b* = 8 unsnapped, *b* = 8 snapped, then *b* = 3 snapped for the last five — **three
states, never between** — with the grid already swapped, the basins already washed, the rings,
payload and survivors already up. The harness's strict beat-hold test (one drawn state per whole
beat) passes.

**The one parameter control.** A four-stop range (`b ∈ {2, 3, 4, 8}`, stepped by index so the
stops are the bit widths and nothing between them). The timeline drives it — 8 through the first
two beats, 3 from 11.3 s on — and a drag pauses playback through the transport's own button, takes
over, and recomputes *every* mark from the chosen *b*: ticks or band, tick labels, dots and their
stacks, error bars and their lanes, basins, bracket, rings and `×2`, the survivors, `Q`, the tick
count, `s`, the largest error, the bound, the payload, the readout, the caption, the picture's
accessible name and both formula washes. A seek, Play, or Space hands *b* back to the timeline and
the picture returns byte-for-byte to the timeline's own. Arrow keys on the focused slider move *b*
by one stop and never reach the pane's beat seeking (the transport ignores keydown events whose
target is not the pane); the same keys on the pane still seek.

**Layout.** `measure()` is the only measurement: it reads the figure's width once per resize,
fullscreen or toggle and chooses `wide` (viewBox 860 × 236) at 600 px and above or `narrow`
(360 × 232) below, where the value labels stagger into two rows and the type steps down; it also
converts drawing units to CSS pixels, which is what decides whether a grid is drawn tick by tick or
as a band. `render()` never measures. The rows under the line are computed from the lanes the error
bars actually need, so the survivors' row, the stats rows and the payload line always sit below the
last bar. The static fallback is the wide print only; a narrow print (the gate product's two-print
rule) is not shipped — see *Open*.

**Palette.** Orange `#c05621` (`\parameterpart`) for the eight values, their dots, their ghosts, the
word *unchanged*, the slider and the caption word *weights*: **the values are the parameters**, and
they are the only learnable thing on the picture. Wine `#722f37` (`\residualpart`) for the error
bars, the basins, the ±s/2 bracket, the rings and `×2` on a collision, the `max |error|` line and
the caption words *error* / *collisions* / *merged*. Ink `#232d4b` for the grid, its labels, the
payload line and the washes on `s` and `Q` in the formula: the grid is a rule, not a thing that
learns. Grey scenery. **No blue, green or purple anywhere**: no input, no prediction, no target.
The picture reads without colour: a collision is a ring plus `×2` plus a stack, the moves are bars
of different lengths, and the SVG `<title>` and live `aria-label` name the grid, every
reconstruction, the largest error, the bound, the collisions and the payload.

**Teaching boundary** (the panel's own words): one tensor, one scale — *s* is set by the largest
value and every value shares it, which is why the two extremes are the only survivors; per-row
scales, zero-points and the affine grid are the chapter's next step; the 64 × 256 audit whose
errors the figure's other two panels report is **not** reproduced and nothing here measures it;
payload is the chapter's *Nb*/8 lower bound, bytes of codes, not a checkpoint size and not a speed.

**Independent checks** (`scripts/test_quantization_grid_excerpt.cjs`: **47 tests** — 21 inherited
from `registerTransportTests`, 1 from `registerBeatHoldTest`, 7 from `registerGrammarTests`, 17
scene-specific, 1 integration; the whole suite went from 389 to **436**). Every arithmetic assertion
recomputes symmetric quantization inside the test from the panel's declared attributes, with its own
rounding, and never calls the player's helper:

- at *b* = 2, 3, 4 and 8: *Q* = 1, 3, 7, 127; 2*Q* + 1 ticks; **every** |error| ≤ *s*/2 value by
  value; every code inside ±*Q*, so the clip never acts; both extremes reconstructed exactly; and
  no value on a rounding half, so half-to-even and half-up agree;
- at *b* = 3, the chapter's own two spellings of the rounding — `clip(round(values * 3), -3, 3) / 3`
  and `s · clip(round(w/s), -Q, Q)` — agree with each other and with −1, −0.667, −0.667, 0, 0,
  0.333, 0.667, 1; codes −3, −2, −2, 0, 0, 1, 2, 3; collisions exactly `{-2: [1,2]}` and
  `{0: [3,4]}`; largest error 0.1267 = 2/3 − 0.54, bound 0.1667, and the strict inequality between
  them; the survivors exactly the two extremes;
- the player publishes exactly those at every stop of the control;
- at every 0.05 s of the timeline each dot sits at its published snap between where the previous
  grid left it and its new tick, lifted by its rank; every error bar runs from the value to the dot
  in its lane; no bar under an unmoved value; no ghost half-swallowed by its dot; the slide is
  monotone and passes through more than thirty positions, halfway at its midpoint;
- the 8-bit grid is a band with `255 ticks` written once where the ticks cannot be separated and a
  comb of exactly 255 ticks at *s* apart where they can (2000 px), with hairline errors under
  1.5 drawing units; the outgoing grid writes no word at all during the 0.7 s crossfade, whose two
  opacities sum to one;
- the bound beat: seven contiguous alternating basins covering exactly the calibrated range, each
  value inside the basin of the tick it landed on, and the bracket spanning px(−s/2)…px(+s/2) — an
  upright tick instead wherever that span is under six drawing units, which at 8 bits it is;
- the collide beat: rings exactly on the collided codes, centred on their stacks, wide enough to
  enclose every dot in the stack and clear of the bracket above; `×2` on exactly those tick labels;
- the payload line is *Nb*/8 for a billion values at each stop, and the chapter's own 2 GB / 0.5 GB
  sentence is the same arithmetic at 16 and 4 bits;
- reduced motion: 801 seeks at 0.05 s give exactly one grid and one dot position per beat, the
  three states above, never moving; unreduced, the drop passes through more than thirty;
- each beat toggles exactly its root classes (`show-formula` from the 8-bit beat, `wash-q` in the
  drop beat alone, `wash-s` in the bound beat alone, both while the reader holds the slider); every
  class the player sets has a rule in `player.css`; no blue, green or purple hex in the stylesheet;
- the formula is one TeX span in an `eq-quantization-grid-` wrapper with `\parameterpart{w}` twice
  and `\class{qg-s}` / `\class{qg-Q}` toggles, whose only digits are the rule's own (2, 1, 1) —
  no live number inside the formula — unchanged across 801 seeks and every drag;
- captions ≤ 20 words, one per beat, each carrying a role word; the pane holds one picture, one
  control row, one formula, one caption and the control bar, no table and no card; the scrubber
  wording never repeats the caption;
- the static, script-free panel prints the final frame — `Q = 3 · 7 ticks · s = 0.333`,
  `max |error| = 0.127 ≤ s/2 = 0.167`, `±s/2 = 0.167`, the payload, both `×2`, both *unchanged* —
  and every readout of it is identical to the *t* = 40 render; the pane minus the control bar is
  byte-equal to that render; the committed static frame is the player's own *t* = 40 drawing
  (`render_static_frames.cjs --check`);
- the narrow layout: viewBox 360 × 232, every mark inside it, the value labels alternating between
  two rows, the 8-bit grid still a band, every other tick labelled at 4 bits, and a resize flips the
  mode in place without starting the clock;
- the panel is the only fixture copy: replacing `data-values` with five different numbers moves the
  reconstructions, the single collision, the largest error, the ring count and the caption, and no
  digit of the chapter's fixture survives on the picture;
- the filter's non-HTML guard is its first executable line, it decodes the manifest and names no
  scene, it can place an `after-cell` anchor, the `_quarto.yml` resource line exists and
  `panel.html` is not a resource, the anchor cell appears exactly once and both equations precede it.

**Fault injection.** 28 mutations, each a single broken source line in `player.js`, `panel.html`,
`player.css`, `interactives/manifest.json` or `_quarto.yml`, applied one at a time to a scratch copy
of the repository and restored with a SHA-256 byte check before the next: **28 caught** (11, 12, 12,
14, 5, 4, 7, 6, 3, 4, 2, 1, 2, 4, 3, 3, 1, 2, 2, 4, 1, 1, 1, 1, 1, 2, 1 and 2 failing tests
respectively). They cover: `round()` become `floor()`; *s* = max|W| / (*Q* + 1) — the 2^b-level
grid, not the chapter's; codes not rescaled by *s*; the clip one code too tight, so the extremes
move; a pair not counted as a collision; dots sharing a tick not stacked; the largest error halved;
the bound *s* instead of *s*/2; payload in bits; the drop never happening inside its own beat;
reduced motion reading the clock; the drop sliding from the value instead of from where the 8-bit
grid left the dot; the error bar starting at the tick; the wash on `Q` never leaving; the slider set
to *b* instead of its stop index; a drag reading the stop index as the bit width; a band labelled at
every clear tick, so its count collides; the basins shifted half a spacing; the stack not capped, so
a three-high stack reaches the bracket; the rows under the line ignoring the lanes, so a bar runs
through the survivors' row; a ghost drawn where its own dot swallows it; the outgoing grid writing
its labels through the incoming grid's; the survivors' names centred on the end dots and running off
the picture; the static fallback's largest error reading 0.172; a declared value the chapter does not
print (0.72 → 0.73); a manifest literal the chapter does not contain; the `_quarto.yml` resource line
removed; the values drawn in ink instead of the parameter's orange. No equivalent mutants. Script and
results: `<scratch>/wave2/quantization-grid/fault-inject.py`, `fault-results.json`.

**Browser review** (headless Chromium via Playwright against the rendered `_book` on :8777,
`quarto render --to html --no-clean` exit 0; the panel is inserted after the
`fig-quantization-granularity` figure and before "The global 8-bit grid…"; page console **empty** at
both widths, in every shoot). Every beat and the mid-beat moments shot at 1280 × 1000 and
390 × 1000, 17 frames each, plus the three reader-set grids at each width
(`<scratch>/wave2/quantization-grid/frames/quantization-grid-excerpt-w{1280,390}-t{0000,0002,0005,
0007,0009,0011,11.6,13.8,0016,0019,20.5,0027,28.5,0033,34.5,0037,0040}.png` and
`…-w{1280,390}-drag{0,2,3}.png` for *b* = 2, 4, 8; the cropped review copies are in
`<scratch>/wave2/quantization-grid/crop/`), and every frame looked at:

- 1280 px: one line across the pane with the values above it and the grid under it; at 8 bits a
  pale band labelled `255 ticks` — never a solid bar of fused hairlines, and no moiré; at 3 bits
  seven ink ticks with their labels and the two `×2`; the dots stacked in pairs and ringed; the
  error bars short, wine, and clearly subordinate to the dots; the basins a wash the dots sit on
  top of; the rows under the line — survivors, stats, payload — each clear of the bars.
- 390 px: the same line in 360 × 232 units, the value labels alternating between two rows, the
  tick labels legible, the slider and its `b = 3 bits · Q = 3 · 7 ticks` readout on their own line
  under the picture, no horizontal page overflow, nothing outside the viewBox.
- Opens **paused** at the anchor at both widths (`data-ready`, `time = 0`, `playing = false`).

**What the frame review changed** (two rounds; each is a rule the test suite now holds): (1) at
*b* = 2 a second-lane error bar was struck through the word *unchanged*, and at 390 px the two
*unchanged* labels, centred on the end dots, ran off the edges of the viewBox — the rows under the
line are now computed from the lanes the bars actually use, and the two end labels are anchored
inward; (2) at *b* = 2 the three-high stack's ring touched the ±s/2 bracket — the stack lift is now
capped (24 drawing units wide, 16 narrow), so a ring never reaches it; (3) a ghost whose value moved
less than a dot's width (0.31 → 0.333) sat half-swallowed by its own dot — a ghost is drawn only
where it clears its dot, which also removes eight invisible ghosts from the 8-bit beat; (4) during
the 0.7 s crossfade the outgoing 255-tick band wrote its count between the incoming grid's labels
(at 390 px it overprinted them) — a grid on its way out now writes nothing; (5) at *b* = 8 the
±s/2 bracket, 1.5 units wide, read as a stray glyph — the bound is drawn as an upright tick
wherever its span is under six units, which says the same thing and reads as a mark rather than a
blemish.

**Deliberate choices, recorded.** (i) Orange for the values: they *are* the parameters, which is
the one place in Wave 2 where the grammar's orange belongs to the data on the picture, and the
boundary says so. (ii) The 8-bit grid as a band with its count rather than 255 drawn ticks: at any
ordinary width 255 hairlines fuse into a bar, which would read as a solid object rather than as a
grid; the comb is drawn wherever the pane is wide enough, and the test pins both. (iii) The timeline
drops 8 → 3, not the film's 8 → 4, because 3 bits is the chapter's printed fixture; 4 is a stop of
the control. (iv) The error bars are drawn in their own lanes under the line rather than on it, so
a bar never crosses a dot; two bars that would overlap take different lanes. (v) The bound is shown
twice — as the basins the values fall into and as a bracket — because the wash alone does not say
where its edge is. (vi) The reader's *b* recomputes everything, including the captions and the
accessible name: the panel never shows a number the chosen grid did not produce.

**Open.** (a) No narrow static print: with scripts off, a phone shows the wide frame scaled to the
figure's width. The gate product's two-print rule would fix it and is a mechanical addition; left
for the author's call on whether the rule is general (the same note stands on the other two Wave 2
scenes). (b) The film's affine-grid equation focus is not ported: the affine grid is the chapter's
next subsection, and the panel's boundary defers to it. (c) The 8-bit bound is drawn as an upright
tick rather than a span; a reader who does not read the label may take it for a tick of the grid.

**Revision, September 11, 2026 — "make the point land at a glance."** The author looked at the
Wave 2 scenes and said they are correct but dense: *"we want them to help understanding the
subject via the animation while being simple and easy to see the point of the animations."* For
this scene the wave2b brief was specific: *lead with the 3-bit grid and the eight dots ALREADY
snapped, showing the two collisions immediately; then let the reader open the grid (8 bits) and
watch the collisions separate — the reverse of the current order, so the payoff is first. The intro
drops to one sentence. The ±s/2 basins, the Q row and the payload line each appear only in their
own beat.* The mechanism did not change and no number, invariant, literal or caveat was removed
from the scene — only from the picture, and every honest qualifier that left the picture is in the
boundary paragraph, the transcript, the SVG `<title>` or the live `aria-label`. **Seven beats → five
(`data-beats` `0 5 11 19 27 33 37` → `0 8 15 22 31`, duration still 40 s), intro 156 words → 33,
captions ≤ 20 words → ≤ 14, numerals standing in full ink on the picture at the busiest instant
~25 → 8, and the picture's box 860 × 236 → 860 × 176 drawing units (narrow 360 × 232 → 360 × 166).**
Where each cut thing went:

| Cut from the picture / intro | Where it went |
|---|---|
| **The whole *Ask* beat** (0–5 s: eight dots arriving on a bare line, no grid), and **the 8-bit warm-up beat** (5–11 s: snap onto 255 ticks, error invisible). Between them they spent eleven of forty seconds before the scene's point existed, and `t = 0` was a picture of the thing that does *not* change. | **Deleted as beats, and the 8-bit grid re-spent as the payoff.** At `t = 0` the seven ticks are drawn, the eight dots already stand on them and two pairs are already stacked; the rings close around them in the first 1.4 s. The 8-bit grid is now shown **once**, at 22 s, where it is the answer rather than a warm-up — same declared computed variant, same arithmetic, one appearance. Transcript item 1 is rewritten from "eight orange dots arrive on a bare number line" to "the picture opens on the answer-in-waiting". |
| **The `×2` tag** beside each collided tick. | **Deleted.** Two dots stacked inside a dashed ring already say "two landed here"; `×2` was a third mark for one fact. The ring is dashed and holds two dots at one *x*, so the claim survives without colour (the accessibility argument the palette paragraph needs). |
| **Five of the seven tick labels** (`−0.67`, `−0.33`, `0.00`, `0.33`, `0.67`). | **Deleted.** At three bits the ticks are countable, so labelling all seven was a third encoding of a fact the picture carries. The two ticks that matter keep their labels and are **rewritten as what the pairs became** — `−0.667` and `0`, in the error's wine — so "four distinct weights became two numbers" is on the picture from the first beat with both numbers. |
| **Six of the eight value labels** during play (`−1.00`, `0.31`, `0.72`, `1.00` and, outside their own beat, the four colliders). | `±1.00` are already written as the ends of the ruler; `0.31` and `0.72` move but do not collide, so their values are not evidence for this scene's point. The four that *do* collide are written only at the beat that argues from them (8–15 s) and again over their separated dots at the payoff. **All eight are back on the closing hold**, the six the ruler does not name as ghosts at 0.45 opacity, so the static fallback and any reader-set grid stay numerically complete. |
| **The two *unchanged* tags** on ±1.00. | **Boundary paragraph**, which says *s* is set by the largest weight "which is why ±1.00 are the only two the grid leaves alone". |
| **The `Q = 3 · 7 ticks · s = 0.333` stats row** and **`b` written on the picture** (it stood in the grid row, the payload row and the readout — three places for one value). | Compressed to one ink grid line, `7 ticks · s = 0.333`. *Q*'s numeric value goes to the slider's `aria-valuetext` and to this receipt; *Q* as a symbol is defined on the typeset formula. *b* is announced in **one place only** — the slider readout, now `b = 3 bits` alone — and a test walks the whole timeline asserting no `b =` is ever drawn on the picture. |
| **The `max |error| = 0.127 ≤ s/2 = 0.167` row** (the bound printed a second time, beside the bracket that already printed it). | The bound survives **once**, on the bracket (`s/2 = 0.167`); the largest move survives **once**, as `0.127` written under the bar that *is* it. The `≤` claim is the beat-3 caption. |
| **`10⁹` in the payload line.** | Written in words: `0.375 GB per billion weights`. The `Nb/8` identity and the "bytes of codes, not a checkpoint size, not a speed" caveat stay in the boundary paragraph. |
| **123 words of intro** (156 → 33): the symmetric-rule restatement with *Q* and *s*; the beat-by-beat narration of the old order; the slider mechanics; the full computed-variant disclosure. | The rule is the typeset formula directly under the picture. The order is shown, and the transcript keeps a beat-by-beat account. The slider mechanics are in the boundary paragraph *and* the keyboard-help paragraph. The disclosure is compressed to "Every other number here is computed from them" and stated in full in the boundary paragraph — **"the chapter prints none of them"** in bold — and in the manifest's declared-computed-variants list. |
| Caption: *"Now set b yourself"* mechanics, and the notation dumps (`Q = 127, 255 ticks, spacing 0.0079`, `Q = 3, seven ticks 0.333 apart`). | The mechanics are in the keyboard-help paragraph. Each caption is now one plain sentence of at most fourteen words carrying at most two numerals. |

Six things were **added**, five of them the judge's grafts against the winning
`quantization-grid-restage` storyboard:

1. **The empty socket, and its ties** — the payoff's whole argument, and the scene's one new drawn
   object. At three bits a colliding pair is a stack inside a dashed wine ring. When the grid opens
   the ring **stays where it was** and becomes an empty socket — a white disc punched out of the
   255-tick comb, still dashed and wine — with a short dashed wine tie from its edge to each of the
   two dots that left it. *Both were here; now they are here and here*, in one glance and without a
   number. A test pins the socket at the old shared tick, the tie's two ends (socket edge → near
   side of the dot) and its minimum length.
2. **The 8-bit grid drawn as 255 ticks** wherever the pane can separate them. The contrast between
   seven fat ticks and a 255-hairline comb *is* the payoff; the previous build always drew a band,
   which said the same thing in words. The band survives for widths where the comb cannot separate
   — a phone — and both cases are tested. Rendered at 1280 px the comb is 2.4 CSS px per tick and
   reads as a fine ruler; at 390 px it falls back to the band and `255 ticks` still stands once
   under the picture.
3. **A per-beat live-numeral ledger, asserted** (the judge's graft of the subtract storyboard's
   accounting, extended with an ink column). *Live* is a numeral in full ink on the picture for the
   beat that needs it. *Furniture* is the two ends of the ruler, which **are** the ruler; any
   numeral drawn as a ghost; the slider readout and its four stops; the transport clock; and the
   symbols inside the typeset formula. The test pins the exact per-beat rows and re-checks the cap
   at every 0.25 s of the timeline, so a regression that banks numbers again fails as a number
   rather than as a judgement.
4. **Retirement, applied to this scene's own devices.** A mark is dropped when its beat is over —
   not left standing at zero opacity. The four ghosts and the six error bars fade out across
   22.0–22.6 s and then **leave the drawing**, and so do the basins and the bracket; a test asserts
   that `[data-basins]`, `[data-bracket]`, `[data-longest]`, `[data-error]` and `[data-ghost]` are
   all absent at 22.6 s and on the closing hold. The rows under the line are anchored to the lanes
   the bars *would* need rather than the lanes drawn at this instant, so neither row moves while a
   bar is revealed or retired.
5. **Two lanes for a colliding pair's error bars**, keyed by the weight's rank at its tick rather
   than by overlap packing, so a pair converging on one tick reads as two measurements and not one
   long bar spanning both; and `0.127` written on the longest bar rather than in a stats row. Both
   angles of the design panel converged on these independently, which is recorded here as the
   reason they are settled rather than provisional.
6. **The question reframed with its price.** *"Eight weights, seven ticks: two pairs already share
   a tick. What pulls them apart, and what does that cost?"* The judge's concern was that "what
   pulls them apart?" invites the answer *more bits*, which is a parameter and not the chapter's
   position. The second clause makes beat 5 structurally undroppable, the payload line contrasts
   0.375 GB against 1 GB at eight bits, and the boundary paragraph says in prose that opening the
   grid is this panel's demonstration and **not** the chapter's remedy — whose next step is per-row
   scales and zero-points. A test asserts all three.

**Content time after the revision** (40 s; `data-duration="40"`, `data-beats="0 8 15 22 31"`,
mirrored in the manifest and checked against the markup by the fixture audit). Every schedule
finishes before its beat ends, so a beat's end state is its whole state under reduced motion; the
holds are 8, 7, 7, 9 and 9 s, with 5 s of complete stillness at the end, and nothing flashes.

| From | Beat | What moves (exactly one thing) | Marks written | Marks retired | Live numerals |
|---|---|---|---|---|---|
| 0 s | **Collide** | nothing: the picture already *is* the question. The two wine rings draw themselves around the two stacks, 0.6–1.4 s | seven ticks; eight dots, two pairs stacked; the ruler's ends `−1.00`, `1.00`; the shared ticks named `−0.667` and `0`; the grid line `7 ticks · s = 0.333` | — | 4 |
| 8 s | **Where they came from** | four orange ghosts rise at the four colliders (8.3–8.9 s, `easeOutCubic`), then a wine bar grows from each ghost to the tick it landed on (9.2–10.6 s) | `−0.79`, `−0.54`, `−0.11`, `0.08` above their own ghosts; four bars in two lanes | — | 8 |
| 15 s | **The bound** | the seven basins wash in alternately (15.3–16.0 s) and the bracket draws from the one free tick, `−0.333`, to the edge of its basin (16.3–17.0 s) | `s/2 = 0.167` on the bracket; `0.127` under the longest bar; the two remaining bars (0.31, 0.72) join the lanes; `s` washed in the formula | the four value labels (15.0–15.6 s) | 7 |
| 22 s | **Open the grid** — *payoff* | *b* rises 3 → 8 at 22.3; the grids crossfade (22.6–23.3 s) and each dot glides to its own 8-bit tick (23.5–26.0 s, `easeInOutCubic`), the stacks coming down with the same amount | the 255-tick comb; two **empty sockets** and four dashed ties; the four values relit over their separated dots (26.0–26.6 s); `255 ticks · s = 0.0079`; `Q` washed in the formula | the basins, the bracket, `0.127`, all six bars and all five ghosts (22.0–22.6 s) | 6 |
| 31 s | **The price** | *b* falls 8 → 3 at 31.3; the comb gives way to seven ticks and the dots glide home and re-stack inside the two rings (31.6–33.4 s) | the payload line `payload = 0.375 GB per billion weights, against 1 GB at eight bits` (34.4–35.0 s) | the sockets and ties, as the stacks rise; the four values dim to ghosts (33.4–34.0 s) and are joined by `0.31` and `0.72` | 6 |

**Reduced motion after the revision.** Three drawn states, never in between: the coarse grid
snapped, with each beat's own marks already up (beats 1–3); the open grid snapped, pairs apart
(beat 4); the coarse grid again, with the price written (beat 5). The harness's strict beat-hold
test (one drawn state per whole beat) passes, and a scene test asserts the three states literally
— `b`/`mix` = `3/0`, `3/0`, `3/0`, `8/1`, `3/0`, with the dots taking exactly two positions.

**Declared computed variants after the revision** (six; recorded in the manifest, and the reason
each moved):

1. Unchanged — the 3-bit reconstructions, the eight errors, the largest 0.1267 < s/2 = 0.1667 and
   the two collisions are recomputed from the declared values by the player and, independently, by
   the tests; `np.round`'s half-to-even rule is kept and a test asserts no value sits on a half at
   any declared bit width.
2. **Rewritten** — the 8-bit grid is no longer "the grid the timeline shows first" but "the grid
   the timeline opens to at the payoff beat", and it is drawn as its 255 ticks wherever the pane
   can separate them and as a band where it cannot, with the count written once under the picture
   either way.
3. Unchanged — the reader-set grids *b* = 2 and *b* = 4.
4. Unchanged — the payload line, `@eq-quant-payload` at N = 10⁹ and the current *b*.
5. **Rewritten** — the drawing devices. Added: the **empty socket** and its **ties**; the lane
   keyed by a weight's rank at its tick. Kept and now qualified: the ghost is drawn *only where it
   clears its own dot*; the basins and the bracket are *retired when their beat ends*. Removed with
   the marks themselves: the `×2` tag and the word *unchanged*.
6. Unchanged — the formula line is `@eq-symmetric-quantization` without its clip and its *ij*
   indices, with all three clauses kept. (The design panel's subtract angle proposed dropping the
   `Q = 2^{b−1} − 1` clause *and* `Q` from the readout; the judge's instruction was not to graft
   them together, because that would leave `Q` undefined in the `s = max|w| / Q` the panel still
   prints. The readout drops `Q`; the formula keeps it.)

**Independent checks after the revision** (`scripts/test_quantization_grid_excerpt.cjs`: **48 tests**
— 21 inherited from `registerTransportTests`, 1 from `registerBeatHoldTest`, 6 from
`registerGrammarTests` (now called with a fourteen-word caption budget), 19 scene-specific and 1
integration; the suite went from 47 to 48 and the whole HTML suite to **494**). **Every arithmetic
assertion of the first build survives unchanged** — the rule at *b* = 2, 3, 4, 8; every |error| ≤
s/2 value by value; the chapter's own `rounded = np.clip(np.round(values * 3), -3, 3) / 3` computed
both ways and equal; codes `−3, −2, −2, 0, 0, 1, 2, 3`; the two collisions; 0.1267 < 0.1667; the
8-bit grid (255 ticks, s = 0.0079, no error above 0.0039, no collision); *b* = 4 (15 ticks, no
collision, 0.067) and *b* = 2 (3 ticks, three groups, 0.46); the payload at all four stops and the
chapter's own 2 GB / 0.5 GB from the same `Nb/8`. Only the markup-shape and beat assertions were
rewritten. New this round:

- the intro is at most **40 words** (it is 33) and names no mechanism the picture shows;
- every caption is at most **14 words**, one per beat, with a role word in each;
- the per-beat live-numeral ledger `4, 8, 7, 6, 6` with the ruler's two ends counted separately and
  ghosts counted as furniture, plus a `live ≤ 8` check at every 0.25 s;
- the ink ledger `11, 19, 30, 17, 11`, which must *fall* from the bound beat to the closing hold;
- `b` appears nowhere on the picture at any time;
- the shared ticks are named by what the pairs became, and no interior tick is named for any other
  reason, at every bit width;
- the socket, the ties and the comb-or-band grid;
- the five-item transcript, the manifest beats and the panel's `data-beats` agreeing.

**Fault injection after the revision** (`<scratch>/wave2b/fault-inject-quant.py`,
`fault-results-quant.json`): **47 / 47 mutants caught**, one per arithmetic assertion plus the
budget, registration and palette assertions. Three first-round mutants were **equivalent on this
fixture** and were replaced, which is recorded rather than hidden: dropping the clip (the clip
never acts, because max|W| *is* the calibration point), rounding halves up instead of to even (no
value sits on a rounding half at any declared *b*, which a test asserts), and reading the scale off
`VALUES[0]` (which *is* the largest weight in magnitude). Their replacements — a clip one code too
tight, snapping every code to an even code, and reading the scale off the smallest weight — are
caught by 12, 12 and 12 tests.

**Browser review after the revision.** Every beat shot from `_book` on `:8777` at 1280 and 390 px,
17 times each — `<scratch>/wave2b/after/quantization-grid/quantization-grid-excerpt-w{1280,390}-t{0000,0002,0008,0010,0014,0015,0017,0021,0022,0023,0026,0027,0030,0031,0033,0035,0040}.png`
— and every frame looked at. The panel opens paused at the anchor, `data-typeset="mathjax"`, the
console is empty, and nothing overflows the page or the viewBox at either width. Looking changed
four things, each now held by the suite: (1) the seven 3-bit ticks read as thin dashes beside the
7-unit dots — stroke 2 → **2.6** drawing units, so "seven fat ticks" is countable and the contrast
with the 255-hairline comb is the payoff's; (2) `0.127` was printed **through** the bar it measures
— the gap under a lane grew 10 → **14** units (narrow 9 → 12); (3) at 390 px `0.127` and
`7 ticks · s = 0.333` were 1.5 units apart — the narrow grid row dropped 19 → **23** units; (4)
during the 0.7 s crossfade the ruler's two end labels blinked out entirely, because the outgoing
grid wrote no text at all — an outgoing grid now keeps **its two ends** (both grids put them at the
same *x*, so nothing moves) and drops only its interior labels, which would otherwise stand among
the incoming grid's.

**What this supersedes.** The "browser review" and "what the frame review changed" notes above
describe the seven-beat build. Items (1), (2) and (3) of that list — the rows computed from the
lanes actually used, the stack-lift cap, the ghost clearance — survive and are still tested. Item
(4), "a grid on its way out writes nothing", is **amended** to "writes only the ruler's two ends".
Item (5), the upright-tick bound at *b* = 8, survives but is no longer reached on the timeline: the
bracket belongs to the 3-bit beat and is retired before the grid opens, so only a reader who drags
to 8 bits would see it — and a dragged picture draws no bracket at all, which closes open decision
(c) below. Deliberate choice (ii) is **amended**: the 8-bit grid is drawn as 255 ticks wherever the
pane can separate them, and as a band only where it cannot. Deliberate choice (v) — "the bound is
shown twice, as basins and as a bracket" — stands, but both are now retired together at the end of
their beat. Open decision (a), the missing narrow static print, is unchanged and still the author's
call. Open decision (c) is **closed**.

## `lstm-valves-excerpt` (Chapter 10)

**Question.** *Close the read valve (`o_t` → 0) — is the memory erased?* The reader answers before
anything shuts: the read valve stands half open, the hidden state reads 0.38, and the belt's own
bar reads 1.00. Then the valve closes. This is the chapter's second panel; the Wave 1
`gate-product-excerpt` stays where it is, after the `fig-highway-time` cell, and the two are
anchored on different cells so the filter inserts each exactly once.

**What the film gave, and what was taken.** `SLSTMDesign` (row 7 of the Chapter 10 storyboard,
"A conveyor belt with learned valves") draws a horizontal additive highway with `long-term memory c`
at its head, a `+` node on it, and three valves — forget on the belt, write below feeding the `+`,
read below feeding a capsule labelled `short-term memory h` — each a port with a vane whose angle is
its opening and a number beneath it reading `open 0.86`. Its reveal order is forget (t + 17), write
(t + 29), read (t + 41), then the two equation cards `EQ.lstmState` and `EQ.lstmRead`, then an
equation focus. **All of that is ported**: the belt, the three valves as ports with vanes, the
numbers beneath them, the `+` node, the tanh branch, the two-state ending, the reveal order, and the
caption arc ("A forget valve decides what old state survives" → "An input valve decides what new
content is written" → "An output valve reads the lane into the short-term memory h" → "a conveyor
belt with learned valves").

**Not taken.** (i) **The film's valve values — 0.86, 0.78, 0.72 — are schematic and are not
imported.** They are hard-coded in `SLSTMDesign` (`const vals=[.5,.86,.78,.72]`), the scene is
marked `data-evidence-class="schematic"` in the film itself, and nothing in Chapter 10 prints them.
This panel declares its own illustrative openings instead and says so on the picture. (ii) The
film's gold `ADDITIVE CELL-STATE HIGHWAY · GOLD — INHERITED FROM CHAPTER 9'S SKIP ROUTE` banner and
its purple/blue/green per-valve palette: the book's grammar puts every carried value in one blue and
leaves the valves in the emphasis ink. (iii) The film's `Capsule` for `h` and its two equation
cards: this panel has one bar per carried value and one formula line. (iv) The film's vane mapping,
where `open = 0.5` lies flat along the flow: here the vane lies along the flow when the valve is
**open** and across it when **shut**, so the shape reads the opening without the number. (v) The
closing of the read valve is the book's, not the film's: the film opens all three and stops.

**Fixture.** The chapter's equation, and nothing else it prints — Chapter 10 gives no gate value
anywhere near `@eq-lstm`, which is why the openings here are declared illustrative rather than
transcribed. The literals the manifest names and `scripts/audit_excerpt_fixtures.py` keeps verbatim:

| qmd lines | Literal |
|---|---|
| 348–352 | `\vect{c}_t &= \vect{f}_t \odot \vect{c}_{t-1} \;+\; \vect{i}_t \odot \tilde{\vect{c}}_t` / `\vect{h}_t &= \vect{o}_t \odot \tanh(\vect{c}_t).` closing `$$ {#eq-lstm}` |
| 340–342 | the `\vect{f}_t` and `\vect{i}_t` sigmoid lines of `@eq-lstm` |
| 344–346 | the `\tilde{\vect{c}}_t` tanh line and the `\vect{o}_t` sigmoid line of `@eq-lstm` |
| 414–416 | "Two states now travel: the cell state $\vect{c}_t$ (long-term memory, the conveyor belt) and the hidden state $\vect{h}_t$ (working memory, playing the vanilla RNN's old role)." |
| 327–328 | "Install a valve: $\vect{f}_t \in (0,1)$ multiplying $\vect{c}_{t-1}$." |
| 329–330 | "New information enters through a second valve $\vect{i}_t$ scaling a candidate $\tilde{\vect{c}}_t$." |
| 331–332 | "**Readable on command.** Expose only what the current step needs, through a third valve $\vect{o}_t$." |
| 334 | "Each valve is a small learned layer squashed by a sigmoid" |
| 335 | "a number in $(0,1)$ read as *what fraction passes*" |
| 358 | "The LSTM cell as a conveyor belt with valves." (the figure caption) |
| 358 | "The upper additive route is the long-memory highway." (the same caption) |
| 588 | "holds its gates flat around 0.76 for all eighty steps" (the `fig-forget-gate-diagnostic` caption) |
| 588 | "hovers near $\\sigma(0)\\approx\\tfrac12$ at about 0.56" (the same caption) |

**Declared computed variants** (recorded in the manifest, repeated here):

1. **The valve openings are declared illustrative, not measured.** Three openings are declared —
   `1.0`, `0.5`, `0.0` — and each valve stands only at one of them: forget `1.0 → 0.5`, write
   `0.0 → 1.0`, read `0.0 → 0.5 → 0.0`. The union of what the three valves take is **exactly** that
   declared set, which a test asserts. The panel's intro, its boundary paragraph and the picture
   itself (a grey note reading `illustrative openings`) all say so; the player refuses to start if a
   stop is not a declared opening. A valve is between two stops only while it is visibly turning.
2. `c_{t−1} = 1.00` and the candidate `c̃_t = 0.50` are round numbers chosen to be read off the
   picture. The chapter prints neither. Real states are vectors; this panel draws one unit of them.
3. `c_t = f ⊙ c_{t−1} + i ⊙ c̃_t` and `h_t = o ⊙ tanh(c_t)` — `@eq-lstm`'s last two lines — are
   recomputed by the player and, independently, by `scripts/test_lstm_valves_excerpt.cjs` at every
   scrubbed time from the published openings. At the declared stops: `c_t` = 1.00, then 0.50 after
   the forget valve closes halfway, then 1.00 again once the write valve admits the candidate; `h_t`
   = 0.00, then 0.38 = 0.5 · tanh(1.00) when the read valve opens halfway, then 0.00 when it shuts.
   The chapter prints none of these.
4. **The answer is a recomputation, not an assertion.** With `o = 0` the read line gives `h_t = 0`
   for every `c_t`, while the cell-state line does not contain `o` at all, so `c_t` is bit-for-bit
   what it was before the valve shut. Both halves are asserted at every time. Separately, with
   `f = 0` — the third declared opening, reached by re-declaring the forget valve's stops on a fresh
   panel — the old content is gone while `i ⊙ c̃_t` still writes: `c_t` = 0.50.
5. **The chapter's two measured mean gate activations are quoted and never drawn.** About 0.76 for
   the task-solving model and about 0.56 for the default-initialized one (the
   `fig-forget-gate-diagnostic` caption: sixty-four probe sequences, eighty steps, one seed each)
   appear in the boundary paragraph as that experiment's measurement and nowhere else. Neither is a
   declared opening; no valve ever rests at either; no caption ever states either. A continuous turn
   from one declared opening to the next must pass through the numbers between them, so the binding
   the suite holds is sharper than "never printed": **any frame whose picture prints 0.76 or 0.56 is
   a frame where something is visibly in motion** (`data-moving="true"`), and no frame the scene
   comes to rest on — any beat, the state just after it, the end of the timeline, every
   reduced-motion state, the script-free panel — prints either. The scene's read trajectory
   (`0.0 → 0.5 → 0.0`, not `→ 1.0`) was chosen for this reason, and `tanh(c_t)` is deliberately an
   unnumbered operator: at rest it would read 0.76 and be mistaken for the measurement.
6. **The picture's devices are this scene's.** The carried value drawn as a bar whose height is its
   number; the bar sliding along the belt and taking whatever the belt holds where it stands
   (`c_{t−1}` before the forget valve, `f · c_{t−1}` between it and the sum, `c_t` after, blended
   across each node so the squeeze happens *at* the valve); the dashed ghost left at the inlet and
   the dashed ghost of the hidden state's open height, each drawn only where it clears the bar it is
   a ghost of; the word `unchanged` beside the cell state once the read valve has shut.

**The picture.** One SVG. Across the top, the belt: a heavy ink line left to right with the carried
value standing on it as a blue bar, the forget valve as a port on the line, the `+` node, and the
outlet. Below left, the write branch: the candidate's bar at its station, a lane through the write
valve, and a riser into the `+`. Below right, the read branch: a tap off the belt, a `tanh` box, the
read valve, and the hidden state's bar. Four station names under the lanes in the carried values'
blue (`c_{t−1}`, `c̃_t`, `c_t`, `h_t`), each valve's name and opening beneath it in ink, the grey
note `illustrative openings` at the foot, and one small typeset orange tag, `W_f, W_i, W_o are
learned`, in a `foreignObject` — the scene's only orange, and the only thing on the picture drawn in
the colour the book reserves for a learnable parameter. **The whole pathway is scenery from the
first frame**; what the second beat installs is the three valves.

**Content time** (40 s; `data-duration="40"`, `data-beats="0 4 10 16 23 28 33 37"`, mirrored in the
manifest and checked by the audit). One thing moves at a time:

| From | Beat | What moves (exactly one thing) | Openings | Written |
|---|---|---|---|---|
| 0 s | Ask | nothing; the bar stands at the inlet on the finished pathway | — | `c_{t−1}` 1.00 |
| 4 s | Valves | the three valves fade in over 1.8 s (easeOut), then the bar rides the belt from the inlet through the forget valve to mid-belt, 6.4 → 9.4 s (easeInOutCubic); the inlet's dashed ghost appears once the bar has cleared it by twice its own width | f 1.00, i 0.00, o 0.00 | belt 1.00, c̃ 0.50, h 0.00 |
| 10 s | Retain | the forget valve turns 1.00 → 0.50 over 3 s; the bar, standing downstream of it, halves in place | f 1.00 → 0.50 | belt 1.00 → 0.50 |
| 16 s | Write | the write valve turns 0.00 → 1.00 (16.4–18.4 s); the candidate's copy travels its lane through that valve to the riser (18.4–20.0 s); the belt's bar then crosses the `+` and grows (20.0–22.4 s) | i 0.00 → 1.00 | belt 0.50 → 1.00 |
| 23 s | Read | the read valve turns 0.00 → 0.50 (23.5–26.0 s); the hidden state's bar rises | o 0.00 → 0.50 | h 0.00 → 0.38 |
| 28 s | Close | the read valve turns 0.50 → 0.00 (28.5–30.5 s); the hidden state falls to zero, leaving a dashed mark at 0.38; the belt's bar does not move, and carries the word `unchanged` | o 0.50 → 0.00 | h 0.38 → 0.00, belt 1.00 |
| 33 s | Two states | `long-term` and `working` fade in under the two outlets | — | — |
| 37 s | Hold | the orange `W_f, W_i, W_o are learned` tag fades in | — | — |

**Reduced motion.** The same picture at each of the eight beats with every valve at its beat's
opening and the bar at its beat's station, never between: `(f, i, o)` = (1.00, 0.00, 0.00) at Ask
and Valves, (0.50, 0.00, 0.00) at Retain, (0.50, 1.00, 0.00) at Write, (0.50, 1.00, 0.50) at Read,
(0.50, 1.00, 0.00) thereafter; the bar at the inlet, then mid-belt for two beats, then the outlet.
`registerBeatHoldTest` walks the whole reduced timeline at 0.05 s and requires exactly one drawn
state per beat interval; a second test requires `data-moving="false"` at every reduced instant and
proves the unreduced close really does pass between 0.38 and 0.

**Layout.** `measure()` is the only measurement: it reads the figure's width once per resize, picks
the wide (`0 0 712 376`) or narrow (`0 0 360 330`) geometry, moves the typeset tag's
`foreignObject`, and re-renders. The narrow layout is the same topology in a smaller box — the belt
shortened, the read branch's tap moved left, the type stepped down by `player.css` — not a shrunken
copy; a test drives it explicitly and requires every label and every mark inside the narrow viewBox
and every bar still equal to its own value.

**Palette.** Blue `#2b6cb0` (`\featurepart`) for everything the cell carries — the previous cell
state, the candidate, the new cell state, the hidden state, their ghosts, their numbers, their
station names, and the caption words *cell state*, *candidate*, *belt*, *h*. Emphasis ink `#232d4b`
for the valves, the sum, the `tanh` box and the caption words *valve*, *forget valve*, *write
valve*, *read valve*: the reader turns nothing here and the panel trains nothing. Grey `#8994a2` for
the lanes, the role words and the illustrative note. Orange `#c05621` (`\parameterpart`) appears
once, on the typeset tag naming the learned weight matrices. No green, no purple, no wine: this
scene predicts nothing, has no target, and nothing in it fails — a test asserts none of those hex
values is in the stylesheet.

**Teaching boundary** (the panel's own words): the three openings are illustrative, not measured;
real gates are vectors, differ per unit and per step, and come from the sigmoid layers of `@eq-lstm`
applied to `[h_{t−1}, x_t]`, which this panel does not evaluate. The chapter's own measured gates —
about 0.76 and about 0.56 — are named as measurements of two trained models and appear nowhere on
the picture. Nothing is trained and no gradient is drawn: the cell-chain product
`∂c_t/∂c_{t−1} ≈ f_t`, the forget-bias recommendation and the recall experiment are the chapter's
next argument, and the GRU is out of scope.

**Independent checks** (`scripts/test_lstm_valves_excerpt.cjs`: **47 tests** — 21 inherited from
`registerTransportTests`, 1 from `registerBeatHoldTest`, 6 from `registerGrammarTests`, 18 of this
scene's own, and 1 integration). The scene's own arithmetic is recomputed in the suite, never read
back from the player: at every 0.05 s of the timeline the suite forms `f · c_{t−1} + i · c̃_t` and
`o · tanh(c_t)` from the openings the player publishes and compares them with what the player
published and what the picture printed. On top of that: the declared stops are exactly the declared
illustrative set and the chapter prints no opening for them to have copied; shutting the read valve
zeroes `h_t` and leaves `c_t` and its drawn bar bit-for-bit unchanged across the whole beat;
shutting the forget valve erases the old content while the write valve still writes; a valve already
standing part-open squeezes what passes through it, along the declared blend and not as a step; the
vane's angle is the opening at every instant; the pathway is scenery (five lanes, the sum, the
`tanh` box and four names) at every beat and the valves arrive at the second; each valve turns only
inside its own beat and monotonically; no resting frame prints a measured mean; the panel is the
only copy of the fixture (moving `c_{t−1}` and `c̃_t` moves every number, every caption and the
ghost); the static frame in `panel.html` is the player's own `t = 40` drawing; and the excerpt is
HTML-only, manifest-driven, and declared in `_quarto.yml` alongside Chapter 10's other panel.

**Fault injection.** 32 mutations, each a single broken source line in `player.js`, `panel.html`,
`interactives/manifest.json`, `_quarto.yml` or `player.css`, applied one at a time to a scratch copy
of the repository (`/private/tmp/dl-book-faultcopy`), with the file restored and its digest
re-checked after each: **32 caught, 0 missed** (median 3 failing tests, range 1–41). They include
every arithmetic assertion in turn — the write valve not gating the candidate, the forget valve
applied after the sum, the sum becoming a product, `tanh` applied after the read valve instead of
before it, the read branch dropping `tanh`, the read valve adding instead of multiplying (so
shutting it does not zero `h_t`), the cell state read through the read valve (so shutting it erases
the belt), a forget valve that cannot shut below a half — and the honesty constraints: a valve
standing at an undeclared opening, the read valve given the chapter's measured 0.76 as an opening, a
declared set that grows a value no valve takes, and the picture calling its illustrative openings
measured. The first round exposed four **equivalent** mutants, all of the same kind: the default
trajectory opens each valve *after* the thing it gates has passed, and `cellState(1, 0)` happens to
equal `cellState(0.5, 1)`, so the two node blends and the hidden state's ghost were unobservable.
The fix was a new test that re-declares the stops (`0.5 → 0.0` and `0.0 → 0.5`, still only declared
openings) so the squeeze happens at a valve, plus a ghost assertion on the moved fixture. Script and
per-mutant results: `<scratch>/wave2/lstm-valves/fault-inject.py`, `fault-results.json`.

**Browser review** (headless Chromium via Playwright against the rendered `_book` on :8777, device
scale 2). Round 1: 21 frames at 1280 px (0, 2, 4, 5.5, 7.5, 10, 12, 14, 16, 18, 19.5, 21.5, 23, 25,
28, 29.5, 31, 33, 35, 37, 40 s) and 7 at 390 px, in
`<scratch>/wave2/lstm-valves/frames1/`. Round 2: the same 21 at 1280 px and 13 at 390 px in
`frames2/`. Round 3: the travel re-shot at 5.5, 6.5, 7.5, 8.5, 10 s (1280 px) and 6.5, 7.5, 8.5 s
(390 px) in `frames3/`. Every frame was looked at. The console was empty at both widths in every
round.

**What the frame review changed** (two rounds; each is a rule the test suite now holds): (1) the
first beat opened on an almost empty board — one bar and one line in a 712 × 376 frame — because the
branches, the sum and the `tanh` box only arrived with the valves. The whole pathway is now scenery
drawn from the first frame and the second beat installs the valves on it, which is also the
chapter's own order of argument (the additive route first, the valves as the three commands). A test
counts the scenery at every beat and requires no valve before the beat that installs it. (2) The
inlet's ghost appeared as soon as the bar had cleared it by one bar width, so the two `1.00` labels
above them touched; the ghost now waits until the bar has cleared it by twice its own width, and a
test requires that gap wherever the ghost is drawn.

**Deliberate choices, recorded.** (i) The read valve's trajectory is `0.0 → 0.5 → 0.0` rather than
`0.0 → 1.0 → 0.0`: at `o = 1` the hidden state would read 0.76, the same two digits as the chapter's
measured mean gate, on a picture of an LSTM in the chapter that prints it. (ii) The valve numbers
are printed live while a valve turns, so a scrubbed frame mid-turn shows a number that is not a
declared opening; the alternative — blanking the number while the valve moves — hides the mechanism
the beat is about. The invariant the suite holds instead is that no *resting* frame shows anything
but a declared opening. (iii) The hidden state is drawn at 0.00 from the second beat rather than
withheld: with `o = 0` it genuinely is zero, and withholding a true value reads as a missing
measurement. The contrast the answer needs comes from the dashed ghost at 0.38, not from the number
appearing. (iv) The valves are ink, not orange, even though real gates are produced by learned
weights: what is learned is `W_f, W_i, W_o`, and that is exactly what the one orange tag says.

**Open.** (a) No narrow static print: with scripts off, a phone shows the wide frame scaled to the
column, as `pooling-bins` and `hinge-bump` do and `gate-product` does not. (b) The `+` and `tanh`
nodes carry no number, by design (operators are unnumbered here); a reader who wants `tanh(c_t)`
must take it from the formula. (c) Chapter 10 now carries two panels; whether two optional
disclosures in one chapter is one too many is the author's call, and the anchors are far apart
(§10.4's figure and the highway-time figure further down).

## Commands to reproduce

```sh
export PATH="$HOME/.local/bin:$HOME/Library/TinyTeX/bin/universal-darwin:/opt/homebrew/bin:$PATH"
export QUARTO_PYTHON="$HOME/.venvs/dl-book/bin/python"
PY="$HOME/.venvs/dl-book/bin/python"

npm test --prefix scripts/html-tests                       # 494 tests after the wave2b revisions
node scripts/render_static_frames.cjs pooling-bins --check
node scripts/render_static_frames.cjs hinge-bump --check
node scripts/render_static_frames.cjs quantization-grid --check
node scripts/render_static_frames.cjs lstm-valves --check
"$PY" scripts/audit_excerpt_fixtures.py
"$PY" scripts/audit_excerpt_fixtures.py \
  --lecture-tree "$HOME/Library/CloudStorage/Box-Box/Teaching/6050/Video_lectures"

quarto render --to html --no-clean                        # a single-file render ignores the freeze and re-executes
python3 -m http.server 8777 --directory _book

shasum -a 256 chapters/part2/08-cnn.qmd
shasum -a 256 chapters/part1/03-nonlinearity-mlp.qmd
shasum -a 256 chapters/part5/17-peft-quantization.qmd
shasum -a 256 chapters/part3/10-sequences-rnn.qmd

quarto pandoc chapters/part2/08-cnn.qmd -t latex -o /tmp/with.tex \
  -L filters/mechanism-excerpts.lua -L filters/convolution-excerpt.lua
quarto pandoc chapters/part2/08-cnn.qmd -t latex -o /tmp/without.tex
cmp /tmp/with.tex /tmp/without.tex                        # byte-identical, 43319 bytes

quarto pandoc chapters/part1/03-nonlinearity-mlp.qmd -t latex -o /tmp/with3.tex \
  -L filters/mechanism-excerpts.lua -L filters/convolution-excerpt.lua
quarto pandoc chapters/part1/03-nonlinearity-mlp.qmd -t latex -o /tmp/without3.tex
cmp /tmp/with3.tex /tmp/without3.tex                      # byte-identical, 33877 bytes

quarto pandoc chapters/part5/17-peft-quantization.qmd -t latex -o /tmp/with17.tex \
  -L filters/mechanism-excerpts.lua -L filters/convolution-excerpt.lua
quarto pandoc chapters/part5/17-peft-quantization.qmd -t latex -o /tmp/without17.tex
cmp /tmp/with17.tex /tmp/without17.tex                    # byte-identical, 73346 bytes

quarto pandoc chapters/part3/10-sequences-rnn.qmd -t latex -o /tmp/with10.tex \
  -L filters/mechanism-excerpts.lua -L filters/convolution-excerpt.lua
quarto pandoc chapters/part3/10-sequences-rnn.qmd -t latex -o /tmp/without10.tex
cmp /tmp/with10.tex /tmp/without10.tex                    # byte-identical, 54868 bytes
```

## Review pass — September 17, 2026

The boundary paragraphs of pooling bins, hinge bump, quantization grid and LSTM valves ran from 64 to 364 words, always visible under a
forty-second picture. Each boundary now shows one sentence; every remaining sentence, unchanged,
sits in a closed "Scope and caveats" disclosure beside the transcript (hinge bump's first
sentence was split at ", which is why" so its lead could stand alone). No player, fixture, beat
or static frame changed. Sizes and digests: [the review-pass receipt](excerpt-review-pass.md).

## Hinge bump value redesign — September 18, 2026

The author's test for every excerpt: replace the animation by its first and last frames; if a
student loses nothing, the motion is not carrying the mechanism. The September 17 hinge bump
showed its three partial sums well, but −2 arrived as a given: nothing let the reader see that
it is forced, and two frames (three ramps; the finished bump) lost little. The duration (36 s),
the beats (0, 6, 14, 22, 30), the fixture attributes and the manuscript are unchanged; the
player, the panel, the stylesheet and the suite were rewritten around one idea.

**Misconception targeted.** *"ReLU ramps only ever go up, so a sum of them cannot make something
local."* What the student should leave with is the slope ledger: each hinge, as x passes its
breakpoint, adds its coefficient to the running slope — +1, then +1 − 2 = −1, then −1 + 1 = 0 —
and therefore *why* the middle coefficient has to be exactly −2 (equal spacing, outer
coefficients 1) for the sum to come back to zero and stay there.

**What the motion now carries that two frames could not.**

1. *One control, the middle coefficient c on h₂.* A real `<input type="range">` outside
   `[data-controls]`, −3 … +1 in steps of 0.25, timeline-driven by default; dragging pauses
   playback and redraws the whole picture for the dragged value; any timeline action (play from a
   pause, a scrub, an arrow-key beat, Home/End) resumes the timeline's value; its own keys never
   reach the pane's beat seeking, and the pane listener mirrors the transport's alt/ctrl/meta and
   auto-repeat guard. The pattern is `interactives/reference-tilt/player.js`. It is drawn in the
   emphasis ink the hinges already use — nothing here is learned, so nothing is orange.
2. *The sweep is the operation.* c enters two running sums at once, so turning it turns the last
   two pieces of the green sum by the same amount: the middle piece about the apex (0.5, 2), the
   tail about (0.5, 0), a lever whose far end comes down from above the plot. With too little
   (c = −1) the sum plateaus and then climbs away; with too much (c = −3) it dives below zero for
   ever; only at −2 does the tail lie flat *on zero*, because the last slope 2 + c and the height
   at the last breakpoint 4 + 2c vanish together only there. The timeline sweeps +1 → −2 across
   the whole Fold beat and lands exactly at the Lock beat (a glide finishes at the beat it leads
   into); the reader can overshoot by hand.
3. *The ledger is on the picture and is written in x-order.* Above the plot, on top of each
   breakpoint's rule, the term that switches on there (`+1 h₁`, `c h₂` with c's live value in the
   control's heavier ink, `+1 h₃`); between the rules, the slope of the sum on that piece in the
   sum's green. In the Add beat a constant-speed pen draws the plain sum on, and each term gains
   its coefficient, and each slope is written, as the pen crosses that breakpoint: +1, +2, +3 —
   the misconception's own picture, "only up".
4. *The prediction is withheld.* The Predict beat asks which coefficient brings the sum back to
   zero to stay. Until the sweep has landed, −2 is absent from the drawing, the svg `aria-label`,
   the svg `<title>` (a hover tooltip), the scrubber's and the control's value text, the readout
   and the caption; the formula line shows a second static identity, g(x) = h₁ + *c* h₂ + h₃,
   and swaps to the chapter's g(x) = h₁ − 2h₂ + h₃ only once the sum has locked. Neither TeX
   source is ever rewritten; the swap is two root classes. The always-visible prose around the
   pane (question, intro, the boundary's lead) no longer names the coefficient either.
5. *The payoff is something the eye sees.* The pale target stands the whole time; when the sum
   lands on it the fill deepens, the dashed edge disappears under the sum, the peak numeral 2
   and the window bracket arrive, and the tail's slope reads 0. Dragged off −2, all of that goes
   away again and one of three captions says which side the reader is on.
6. *The dashed line is always the term.* c starts at +1 — a bare ramp — so the first frame's
   three plain hinges are exactly the three terms at the control's starting value and the dashed
   line is c·h₂ at every instant. The September 17 player swung the drawn ramp from +h₂ to
   −2h₂ while admitting 0 → −2 into the sum, a drawing device in which the dashed line was not
   the term being added; that device is gone. This is why the control runs to +1 rather than
   stopping at 0 as first briefed: at c = 0 the first frame's middle ramp would have to lie flat
   on the axis, or be drawn as something it is not.

**Beats (times unchanged; renamed).** *Ramps* 0–6: three ramps, the pale target, the question.
*Add* 6–14: the pen and the ledger. *Predict* 14–22: a hold; the caption asks. *Fold* 22–30: the
sweep. *Lock* 30–36: peak, bracket, the chapter's identity with its coefficient washed, then the
ramps step back to a ghost. Reduced motion: one still per beat — holds are themselves, Add is
its finished drawing, Fold is the finished swing; the coefficient stands at +1 or −2, never
between.

**Removed.** The close beat in which h₃ joined last; the eased entry amounts of h₂ and h₃; the
+h₂ → −2h₂ drawing device; the slope entries riding the pieces (they could not follow a piece
that leaves the plot); the ramp names at the feet of the ramps (the dragged sum passes through
that corner); the consumption of the target; the live coefficients in the svg `aria-label` and
in the scrubber's value text (the control announces them, once); the 161-sample paths (every
curve here is piecewise linear, so each is now the polyline through its own vertices, and
`panel.html` fell from 23,667 bytes at `030fcf7` to about 15 KB); two-decimal geometry (now
four).

**Declared computed variants** (none is a number of the chapter; the manifest text for them is
in the redesign report, since `interactives/manifest.json` is outside this change's limits):

1. The family g_c(x) = h₁ + c·h₂ + h₃ at each of the control's seventeen values
   c = −3, −2.75, …, +1, and at every intermediate c of the timeline's eased sweep from +1 to −2.
   Only c = −2 is the chapter's `bump`.
2. Its slopes on the four pieces, 0, 1, 1 + c, 2 + c — the running sums of the coefficients —
   of which the ledger writes the last three, at rest spelt short (−1.25, −0.5, 0) and during the
   sweep to two decimals.
3. The value at the right edge of the domain, g_c(5) = 4.5 (2 + c), announced only in the
   control's `aria-valuetext`; and the height at the last breakpoint, g_c(2.5) = 4 + 2c, named
   only in the closed scope text. The apex g_c(0.5) = 2 does not depend on c.
4. As before: the peak 2, the final slopes 0, +1, −1, 0, the target silhouette, the bracket on
   [−1.5, 2.5]. New: the second formula-line identity with the symbol c, which is this panel's
   notation and not the chapter's; the plot's y-range, now −1.1 … 3.6.

The suite recomputes all of it independently of the player: slopes by finite differences at
every stop, the end value, the height at 2.5, and that exactly one stop of the control is zero
outside [−1.5, 2.5].

**Boundary sentences the control made false, rewritten.** The lead keeps one sentence but no
longer prints the answer the pane now asks for: "Nothing here is learned: the three breakpoints
and the three coefficients are placed by hand, as the chapter places them." In the closed scope:
"this panel has no control to turn" → the one control turns the middle coefficient by hand, in
ink, and no optimizer touches it; "no intermediate coefficient is ever written" → the control's
range, the timeline's sweep, and the statement that every sum, slope and end value for c ≠ −2
is this panel's declared computed variant and not the chapter's; "it is consumed the moment the
sum reaches it" → it stays while the control can still miss it; "of which the panel writes at
most two at a time" → the ledger writes the last three; "that is … not something this panel
shows" → why −2 is forced (equal spacing, outer coefficients 1: 2 + c and 4 + 2c vanish
together). The closing sentence — one bump is a construction, not an approximation theorem — is
unchanged.

**Still out of scope.** Learning any of these numbers; unequal spacing or outer coefficients
other than 1 (where the forced value differs and a bump may need a different third coefficient);
more than one bump, tiling, and the approximation theorem; whether training finds such hinges.
A second knob would be a second scene.

**First/last-frame verdict.** Passes. The first frame (three ramps, a pale target) and the last
(the bump, the ledger +1, −1, 0) do not show that any other coefficient fails, nor that the two
later slopes are tied together; the sweep and the control do.

**Checks.** `node --test scripts/test_hinge_bump_excerpt.cjs`: 56 tests, 56 pass (the transport,
beat-hold and grammar suites it inherits, plus: the family's arithmetic at all seventeen stops
against the dragged DOM; the drawn sum against g_c at every 0.05 s; the two later pieces turning
together and the tail's line always through (0.5, 0); landing exactly at 30 s; the ledger
following the pen; the prediction withheld at 0.01 s steps across drawing, label, title, both
value texts, readout, caption and formula classes; drag, resize, fullscreen, speed, clamping,
every timeline action, and the alt/ctrl/meta/auto-repeat regression; one still per beat with a
true caption; estimated text boxes inside the picture, off each other and off every line at
both layouts for seventeen timed frames and all seventeen dragged values; four-decimal
geometry; static wide and narrow prints equal to the final render). Five mutations of the
player — full title before the landing, no modifier guard, a dashed ramp that is not c·h₂, a
sweep that lands a second early, lock marks off the lock — each fail it.
`uv run --python 3.12 python scripts/audit_excerpt_fixtures.py`: PASS.
`node scripts/render_static_frames.cjs hinge-bump --check`: current. Real frames at 1280 px and
375 px (normal, reduced motion, scripts off, mouse-dragged in Chromium): figure 713 / 302 px, no
page overflow, no svg text outside the picture, no console errors.

**Not done here, by the limits of this change.** `interactives/manifest.json` still carries the
September 17 computed-variant sentences, four of which the redesign makes false; and the panel
has no `details.mechanism-check` yet, which `scripts/test_excerpt_checks.cjs` expects.

## Accent typography — September 21, 2026

`lstm-valves` spelled the candidate `c̃` as `c` plus the combining tilde U+0303, and the body
sans face carries no mark positioning for it: measured on the published page at 40 px that
face advances 18.24 for `c` and 20.41 for `c̃` — a spacing tilde set beside the letter —
while the serif face advances 18.16 for both, which is what a composed mark looks like. SVG
text cannot be typeset, so the symbol alone now wears the new shared class
`.mechanism-accent`, which hands that one glyph to `Georgia, "Times New Roman", serif` and
leaves its subscript and the names around it in the body face. The static prints were
regenerated from the same geometry; no fixture, timetable or caption changed. The same pass
fixed `p̂` in `surprise-loss` and `sigmoid-squash`, where the symbol appears in prose and is
now said in TeX for MathJax to compose — see those receipts and rule 5 of
`docs/animation-authoring.md`.
