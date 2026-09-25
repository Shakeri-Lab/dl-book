# LayerNorm versus BatchNorm: who shares the ruler?

September 13, 2026. **Author-approved for separate publication.**
The author reviewed the BatchNorm contrast and requested “push and do next.”
Publish this Chapter 14 scene alone, then prepare Chapter 5 derivative gates for
local review. The comparison explains why variable-length sequences make shared
statistics awkward without claiming BatchNorm requires fixed sizes. No new
numerical experiment, manuscript edit, runtime migration, or release tag is authorized.

## Approved publication checks

September 13 approval run: all 929 interaction tests pass, including 47 focused
normalization checks (`/tmp/layernorm-publication-all-tests.log`). The complete
frozen HTML rebuild succeeds (`/tmp/layernorm-publication-html.log`); source,
structure, asset and public-anchor audits pass. Frozen stdout remains exact at
133 blocks across 27 units, with all 27 HTML/TeX pairs matching `e5827cb`.

Both full PDF profiles were rebuilt and stabilized on their second attempt.
Print remains 548 pages; continuous remains 519. All 390 outline entries per
edition, complete and per-page extracted text, page geometry, and all 1,067
page raster hashes match the prior PDFs. Both PDF audits pass, including glyph,
text-layer, print-loss and retained-log checks. Representative visual inspection
includes the cover, contents, Chapter 14 normalization pages, dense equations,
code, tables and final pages. Receipt:
`/tmp/dl-book-normalization-pdf-approval.mQ7NMn/`, especially `comparison.json`,
`baseline-fingerprint.json`, `render.log` and the two PDF audit logs.
HTML was rendered last. No QMD, freeze, numerical tolerance, PDF setting or tag
changed. Deployment must still be checked against the resulting commit.

## Question and source gate

Which numbers share the mean and variance, and why does the grouping matter?

Place `14-self-attention-transformer.html#layernorm-axis-excerpt` after the existing
`fig-transformer-block`. The shared manuscript's `layernorm-axis-audit` supplies
two examples, each with two tokens and four features:

```
[[[1, 3, 5, 7], [40, 50, 60, 70]],
 [[-3, 1, 5, 9], [2, 2.5, 3, 3.5]]]
```

Its call `nn.functional.layer_norm(audit, (4,))` normalizes only the final feature
axis. No affine weight or bias is supplied. The installed pinned torch 2.12.1
`torch.nn.functional.layer_norm` signature confirms default `eps=1e-5`.
The pin is `scripts/notebook_requirements.txt`; the inspected local source is
`/Users/hs9hd/.venvs/dl-book/lib/python3.12/site-packages/torch/nn/functional.py`.
SHA-256 of `inspect.getsource(F.layer_norm)`:
`b1034c3890e9ce8671a772ec9995b79833f1e0d90ffde7e3fdc893abd5ca464f`.
The browser evaluates that formula in double precision; it does not claim to
reproduce the float32 audit's last-bit stdout. Frozen evidence is unchanged.

Independent SymPy checks through the verify-math helper give row means
`4, 55, 3, 11/4` and population variances `5, 125, 20, 5/16` from this source.
After centering and division by `sqrt(v + eps)`, the real-arithmetic mean is zero
and variance is `v/(v+eps)`, not exactly one. Its deficit is `eps/(v+eps)`.
The learned affine transform may change both mean and variance; it is not applied
in this fixed witness. No new training run or numerical tolerance is introduced.

## Composition and boundary

The film's `LayerNormAxis` supplies the raw-to-normalized reveal and the
per-token feature grouping. Its card dashboard and RMSNorm detour are omitted.
The author-requested contrast first selects one vertical feature column of the
same tensor: ordinary temporal BatchNorm in training would pool that feature
across examples and token positions. An adjacent, explicitly schematic pair of
image feature maps shows the corresponding CNN rule: hold the channel fixed and
pool across examples and spatial positions. No pixel values, BatchNorm numerical
results, extra data fixture, or image performance claim is introduced.

The selection then switches to a horizontal token row. Its profile
is centered and scaled on a fixed ruler. Other token rows are normalized separately.
Their near-coincident outputs are not displaced cosmetically. Raw values from
other rows do not enter a ruler sized for the first row.

The comparison is about reduction axes, not a fixed-size requirement. CNN channels
represent the same learned feature across spatial positions, making a shared
per-channel pool useful; fixed image size makes batching convenient but is not a
BatchNorm condition. Ordinary temporal BatchNorm includes padding in its statistics;
masking pads alone still gives longer sequences more contributions. Pooling future
positions is also inappropriate for causal training. Tokenwise LayerNorm avoids
these cross-position statistics, not the need for attention or loss masks. Its
input features may already contain context mixed by attention. Default BatchNorm
evaluation uses stored running statistics; tokenwise LayerNorm uses current-token
statistics in both modes. These are reduction-rule consequences, not a claim that
BatchNorm cannot be adapted to sequences or that LayerNorm always wins.

Use the shared deferred native SVG transport, closed and paused initially,
1.5× default, forty seconds, no parameter controls. MathJax is the page's existing
renderer. Transcript, wide/narrow static fallbacks, keyboard controls and strict
reduced-motion beat holds remain required. This optional HTML-only replay adds
no required example; the static manuscript remains complete in both PDFs.

## Acceptance before the BatchNorm contrast

First actual-browser review at 1280px desktop and 390px phone found two small
presentation defects: the centering formula was hidden until the scaling beat,
and the first normalized value crossed the y-axis. The formula now appears with
the mean, so its centering highlight is visible during translation. Thirty-pixel
endpoint gutters protect value labels without moving the ruler or changing data.

The initial full frozen HTML render passes source, Plan, Python, asset and public
anchor audits. All 133 stdout blocks/27 units and 27 HTML/TeX pairs remain exact
against `e5827cb`. Filtered and unfiltered Chapter 14 Pandoc LaTeX are byte-identical:
`/tmp/layernorm-axis-{plain,filtered}.tex`, SHA-256
`dddf5555bb3eee02c1adc214cadc49e64f24eb0598b7f26d9c3fde079334843cf`.
Direct Pandoc reports the same pre-existing implicit-div closure warnings in
both conversions; the complete Quarto HTML build succeeds and the replay is
outside any code panel or disclosure. No manuscript is changed to silence them.

Final acceptance: **925/925** interaction tests, including **43** independent
LayerNorm checks, pass in `/tmp/layernorm-axis-final-all-tests.log`. The suite
checks row-local statistics, constant-row behavior, changed valid tensors,
epsilon-qualified variance, actual SVG paths/markers/grouping at seven widths,
centering-formula visibility, endpoint label clearance, deterministic scrubbing,
strict reduced motion and static-frame parity under small math-library ULP changes.
Only drawing coordinates are serialized to nine decimal places; arithmetic is
not rounded. A final white text halo keeps guide lines from crossing value glyphs.

The final complete frozen HTML build is `/tmp/layernorm-axis-final-html.log`.
All source, fixture, HTML and anchor audits pass, including 52 lecture digests;
frozen stdout remains exact. Browser review covers 1280px desktop, 390px phone
(296px drawing), centering/scaling/final states and native fullscreen entry/exit.
No horizontal page overflow or MathJax errors; the replay is outside code panels.
One complete 40-second timeline ran to Replay at the default 1.5× speed. Ordinary
chapter navigation keeps the scene closed with no scene script loaded; its direct
anchor opens it paused at zero. The final review tab is left in that state, and
temporary viewport overrides are reset.
Wide and narrow script-free final frames are regenerated and checked against the
active final state. The static manuscript/PDF conversion remains unchanged.

Assets total 52,469 bytes, including both static prints. The deferred scene script
is 18,381 bytes, SHA-256
`d08c052dad15ba9f16c6760409e11f9dd0e5caa7830a4a53da45ba4ac67b5c53`.
Local review:
`http://127.0.0.1:8770/chapters/part4/14-self-attention-transformer.html?preview=layernorm-axis#layernorm-axis-excerpt`.
This scene remains uncommitted and unapproved for publication. Scale granularity
was pushed separately as `e5827cb`; publishing run `34764538563` has passed
interactions, notebook export and shards 2/3. Shards 0/1/4/5 are still running
without failures; build-deploy has not started. Monitoring is stopped; no
scheduled task exists. Live scale verification remains outstanding. Resume with
`/tmp/dl-book-scale-pdf-approval.MKXd82/scale-live.ZFLK0L/`.

## BatchNorm-contrast acceptance — September 13, 2026

The revised local scene passes **929/929** interaction tests, including **47**
focused checks. Logs: `/tmp/layernorm-bn-final-all-tests.log` and
`/tmp/layernorm-bn-final-tests.log`. New checks pin grouping membership and the
actual column/row highlight geometry, the separate nonnumeric spatial schematic,
and the padding/train/eval boundaries. The original LayerNorm arithmetic gates
are unchanged; all four within-row feature interventions affect that row while
other rows remain identical. Changing another row does not affect the selected row.

Full frozen HTML render: `/tmp/layernorm-bn-final-html.log`. Source, Plan, Python,
fixture, HTML asset and public-anchor audits pass. All 133 stdout blocks/27 units
and 27 HTML/TeX pairs remain exact against `e5827cb`. Chapter 14 filtered and plain
LaTeX still have SHA-256 `dddf5555bb3eee02c1adc214cadc49e64f24eb0598b7f26d9c3fde079334843cf`
in `/tmp/layernorm-bn-{plain,filtered}.tex`. No QMD, freeze, numerical gate, PDF
configuration or tag is changed; no full PDF recut was needed for this local review.

Actual-browser review at 1280px desktop and 390px phone covers the spatial schematic,
column-to-row switch and final normalized profiles, plus expanded mode entry/exit.
The narrow connecting ray is omitted so it cannot cross the persistent axis key;
the row selection and profile labels retain the mapping. Phone drawing is 296×582.
Both static prints are regenerated and exactly match the final live state. There
is no page-level overflow or MathJax error. Full playback reaches Replay at forty
seconds with the unchanged 1.5× default. Ordinary navigation leaves the panel closed
and loads no scene script; the direct anchor opens it paused at zero. Viewport
overrides are reset and the review tab is left at the direct anchor.

Assets: 63,584 bytes total; deferred script 22,650 bytes, SHA-256
`7495dd769da7ec8ddea77da6b70b8b9b69bf33578cc479056502d8ea92e801f7`.
No new runtime dependency or control was added. Updated review:
`http://127.0.0.1:8770/chapters/part4/14-self-attention-transformer.html?preview=batchnorm-contrast#layernorm-axis-excerpt`.
Still **local, uncommitted and not pushed**. The earlier scale publication status
above is historical; it was not rechecked as part of this comparison revision.

## Source receipts

Book source at scale publication `e5827cb`; chapter unchanged from `7aba6ea`.
Lecture root: `/Users/hs9hd/Library/CloudStorage/Box-Box/Teaching/6050/Video_lectures/`.
Scene: `6050-Ch14/lecture.jsx`, `LayerNormAxis`, and its storyboard axis/boundary
entries. The attempted direct file-URL visual inspection was blocked by browser
policy; source composition was inspected without routing around that restriction.

| Source | SHA-256 |
|---|---|
| `chapters/part4/14-self-attention-transformer.qmd` | `62793eca45b4fed4d20f3f5d28baeae98f26370d31e18a0d0e7ae3fb761e8bd6` |
| `chapters/part2/09-modern-cnns-transfer.qmd` | `941f43b509fe977d6957d233edbf22418df9aea768c9294b4788350880272859` |
| `6050-Ch14/lecture.jsx` | `ac103ade3aecf01355955a24a1a2042cd9c58d6a434b39dd7ef6e680ee0fce93` |
| `6050-Ch14/STORYBOARD.md` | `cd493a87b78f9f2fcd705bd2385bf4f8651bb3a9472e44b120838fffa81b1324` |
| `6050-Ch14/ch14-data.js` | `df6cfab3b0b92b5e9eaf634ae82a229f42dfa32030600bc0016ef90d7b11ff39` |

BatchNorm contrast receipts, inspected September 13, 2026:

- Chapter 9, “The stabilizer we owe you,” lines 223–262: per-channel `N,H,W`
  reduction, train/eval distinction, and the planted LayerNorm callback.
- Chapter 14, “Layer normalization,” lines 635–657: token-local feature reduction,
  same train/eval computation, pre-affine approximation boundary.
- [PyTorch 2.12 BatchNorm2d](https://docs.pytorch.org/docs/2.12/generated/torch.nn.BatchNorm2d.html):
  spatial reduction, per-channel parameters, default running statistics.
- [PyTorch 2.12 BatchNorm1d](https://docs.pytorch.org/docs/2.12/generated/torch.nn.BatchNorm1d.html):
  temporal reduction over batch and length for each channel/feature. The book's
  `B,T,D` display corresponds to `B,D,T` input layout for this module.
- [PyTorch 2.12 LayerNorm](https://docs.pytorch.org/docs/2.12/generated/torch.nn.LayerNorm.html):
  final-axis reduction for a singleton normalized shape and input statistics in
  both training and evaluation.
- [Ba, Kiros and Hinton, Layer Normalization](https://arxiv.org/abs/1607.06450):
  per-case normalization and recurrent application. This is verification of the
  existing contrast, not copied figure composition.

Related prose follow-up for a future shared-manuscript/PDF cut: Chapter 9's
“there may be no batch (one image!)” wording is too broad. A single image still
has spatial positions for BatchNorm2d statistics; stored running statistics define
the usual evaluation protocol. The present HTML animation does not repeat that
wording and does not silently alter the shared chapter.

## Review pass — September 17, 2026

- **Status correction.** The two passages above that call this scene "uncommitted and
  unapproved" and "local, uncommitted and not pushed" describe the working tree before
  approval. The scene was pushed as `e00d3c5`; the header of this receipt is the current status.
- **Less prose around the picture.** The boundary now shows its first sentence; the remaining
  scope notes sit in a closed "Scope and caveats" disclosure, and the two author-requested
  explanations (why sharing fits a CNN; why token-local statistics fit variable lengths) sit
  in a closed "Why BatchNorm fits images and LayerNorm fits sequences" disclosure. Every
  sentence is unchanged and still in the panel; on a phone the caveats no longer outweigh
  the animation.
- **Geometry serialisation.** Drawing coordinates are now serialised to four decimal places
  (0.0001 px) instead of nine, so a last-bit math-library difference cannot flip a printed
  digit in the byte-compared static frames. Arithmetic is still unrounded; the suite's pixel
  tolerance follows the new step (`PIXEL_EPSILON = 5.1e-5`). Both static frames regenerated.
- New asset hashes are recorded once for the whole pass in
  [the review-pass receipt](excerpt-review-pass.md).

## Value redesign — September 18, 2026

The author asked of every excerpt, "does that even help?", and set the first/last-frame
test: if the animation can be replaced by its first and last frames with nothing lost, the
motion is not carrying the mechanism. This scene was judged middling: its centring and
scaling are congruent motion, but its BatchNorm-versus-LayerNorm contrast was a static
bracket swap, and its last two beats (four nearly coincident profiles, then a text summary)
showed no consequence of the axis choice.

**Misconception targeted.** "LayerNorm and BatchNorm are the same formula, so the difference
is cosmetic." The truth the chapter states in words and its figure cannot show: they differ
in *who shares the statistics*, and the consequence is **dependence**. A token's LayerNorm
output depends on that token alone; a BatchNorm training statistic depends on every other
example and position in the pool.

**What the timeline now does** (beats unchanged: `0 5 10 15 20 25 30 35`, duration 40).
Beats 0–25 are the approved sequence, tightened: BatchNorm's column, LayerNorm's row, the
mean, the translation by that mean, the one shared divisor, the normalized profile. Beat 30
is now a **perturbation test**. Both groups are outlined on the same tensor; under the plot
one fixed number line carries two pointers, the tracked token's own mean (above the line)
and feature 1's pooled mean (below it); the caption asks what will move when the neighboring
token doubles. After three seconds of stillness the question is withdrawn and the neighbor
row glides from (40, 50, 60, 70) to (80, 100, 120, 140), finishing exactly at the 35 s beat.
BatchNorm's pointer is placed, every frame, from the mean of the feature-1 column *as
drawn*, so it slides in lockstep with the one changed cell that lies inside its column
(40 → 80), leaving a hollow mark and a tie where it was. LayerNorm's pointer and the green
profile are read, every frame, from the same LayerNorm **re-run on the changed tensor**;
they do not move because no changed cell lies inside the token's row, not because the
player holds them still. Beat 35 states the consequence once, with both outlines, the
doubled row, the pointer's trail and the unmoved profile in view, "before learned scale
and shift".

**What the motion carries that two static frames could not.** (1) As before: subtraction is
one translation of the whole profile with its mean line, division is one shared rescale on
a fixed ruler. (2) New: a committed prediction, with the answer absent from the drawing,
the svg `aria-label`, the scrubber text and even hidden nodes until the glide has finished
(the suite scans every 0.05 s). (3) New: dependence shown as covariation. The pooled mean
follows the neighbor continuously through the glide while the token's statistics stay
pinned on the same scale; scrubbing 33–35 s lets the reader push the neighbor by hand. A
before/after pair gives two samples of that relation; the glide gives the relation.
Honest limit: the *conclusion* of the test (10 → 20 versus "did not move") is legible from
the final frame alone, by design, since that frame is also the script-free fallback.

**Removed.** The "each token, normalized separately" beat: three comparison profiles, twelve
comparison markers, four row-identity glyphs and four per-row brackets (the chapter's own
`fig-transformer-block` already prints the four coincident profiles). The closing text-only
beat and its two scope labels. The plot's `feature` axis title: the x positions are now
named `f1`–`f4`, the table's own column headings. Every other y-tick number (guides stay;
`−4, 0, 4, 8` are numbered). Emphasis: numerals a visible group pools are blue and
semibold (four through 25 s, seven during the test), the rest of the moving row plain blue,
everything else gray; before, all sixteen were one blue. Value labels for features under the
token's mean now sit below their marks (28 px), so no label rides the zero or mean line at
any rest state and none changes side during a glide; the mean and zero lines are drawn
under the haloed labels. The drawing falls from 135 elements to 95 (counted in the wide static print).

**Declared computed variants** (all deterministic functions of the panel's `data-fixture`;
the choice of neighbor, factor and pooled feature is declared in the panel's new
`data-variant='{"neighbor":[0,1],"factor":2,"feature":0}'`, which the player and the suite
both read; no number below is typed into `player.js`):

- Perturbed row: example 1, token 2, `(40, 50, 60, 70) × 2 = (80, 100, 120, 140)`. During
  the glide the factor runs 1 → 2; the numerals are rounded to whole numbers for reading
  while each `data-value-source` and the pointer use the unrounded value.
- BatchNorm's pooled feature-1 mean, before: `(1 + 40 − 3 + 2) / 4 = 10`. After:
  `(1 + 80 − 3 + 2) / 4 = 20`. Only this statistic is computed. No BatchNorm variance, no
  BatchNorm output and no running statistic is computed or drawn.
- Unchanged row statistics of the tracked token `(1, 3, 5, 7)`, recomputed on the changed
  tensor: mean `16/4 = 4`, population variance `(9 + 1 + 1 + 9)/4 = 5`, divisor
  `sqrt(5 + 1e-5) ≈ 2.236`, output `(−1.342, −0.447, 0.447, 1.342)`, output variance
  `5/(5 + 1e-5) ≈ 0.999998`. The suite requires bit-identical outputs before and after.
- For completeness (never drawn): the doubled token's own mean goes 55 → 110 and its
  variance 125 → 500; the other two tokens are untouched.
- Drawing device: the statistics line runs 0 to 25 in steps of 5, one step past the largest
  value, so its printed end is never the answer.

**Boundary and prose.** The lead boundary sentence is unchanged. In "Scope and caveats" the
phrase "and coincident profiles" was dropped (none are drawn now) and the variant, the
"only the pooled mean" rule, the rounding device and the "this token's features are held
fixed; attention may already have mixed context into them" caveat were added. The
author-requested "Why BatchNorm fits images and LayerNorm fits sequences" disclosure is
untouched. The question above the pane now poses the dependence question from the start, so
the three-second in-timeline prediction is a reminder rather than a first reading.
Transcript items 2, 7 and 8 were rewritten to the new beats; item 8 keeps every evaluation,
padding, masking and causal-pooling sentence.

**Out of scope, unchanged.** Learned gamma/beta, RMSNorm, pre- versus post-normalization,
any BatchNorm output or evaluation-mode running statistic, masked temporal pooling, any
new data or training run. The claim about sequence length is the pooling argument of the
closed explanation (a longer or padded sequence adds entries to BatchNorm's `B,T` pool); the
picture itself perturbs one other position's *values*, not the sequence's length. No reader
control was added: the perturbation is a probe of dependence at the end of the timeline,
not the scene's one parameter, and a neighbor-scale slider would be a second scene.

**Checks.** `node --test scripts/test_layernorm_axis_excerpt.cjs`: 54/54 (47 before; seven
new tests: the variant's arithmetic; pointer = mean of the drawn column at every 0.05 s
with LayerNorm's pointer, profile path, marks and labels byte-identical from 25 s to 40 s;
prediction withheld; reduced-motion stills equal the full-motion frames at their beats,
before at 30 s and after at 35 s; estimated-text-box collisions at eight widths, rest and
mid-glide; emphasis tiers and budget; transcript/boundary story). Both static prints are
regenerated and the suite requires each alone to tell the new story.
`scripts/audit_excerpt_fixtures.py` passes. Browser frames at 1280 px and 375 px (figure
713 and 302 units), plus `--reduced` and `--nojs`: no page overflow, no svg text outside the
picture, no console errors.

**For the shared files (not edited here).** `interactives/manifest.json` needs the new
computed-variant sentence, and its second and third existing sentences still describe the
retired comparison ("only their independently normalized outputs are compared";
"Near-coincident outputs remain unjittered"). The binding note in
`docs/animation-authoring.md` ("Only their independently normalized outputs later enter the
plot. Do not jitter the nearly coincident marks.") likewise describes the retired beat. The
transfer check `scripts/test_excerpt_checks.cjs` expects (`details.mechanism-check`) is not
part of this change.

### Author revision — the axis change is now a turn, September 18, 2026

Reviewing the redesign in the rendered book the author kept everything and asked for one
thing: "only if you can make the transition from batch norm to layernorm more smooth.
Currently it's sudden and we are losing the contrast." Both halves of that were true. At
t = 5 the BatchNorm column vanished and the LayerNorm row appeared in a single frame, and
between 5 s and 30 s no BatchNorm mark was on screen at all — the contrast the scene exists
for was absent for most of its run.

**One continuous turn.** Beat 1 (5–10 s) now holds a still for 2.5 s and then turns: over
7.5 → 10 s, on the existing smoothstep, **one rectangle** sweeps from BatchNorm's vertical
feature column to LayerNorm's horizontal token row. Its x, y, width and height are
interpolated between the two rectangles, which share one cell — the tracked token's own
feature 1 — and every interpolated rectangle still contains that cell, so the sweep reads
as a pivot about it: the same tensor, a different axis. The two ends are exact, not
rounded: at 7.5 s the highlight is the column, at 10 s it is the row the rest of the scene
uses. The glide finishes at the beat it leads into, as the other glides do. The side
bracket cross-fades with the band it names rather than morphing, which the author's note
allowed. The group label reads "temporal BN: training", then "BN column turning to LN row",
then "LN: across this token's features"; the axis key "BN ↓ B,T · LN → features" stands
under the table throughout as the legend of the turn. The CNN sketch now stands through the
beat-1 still and hands its space to the plot exactly as the turn starts, so the token's raw
profile arrives with the rectangle that selects its row and no space is ever dead.

**The contrast is never lost.** The column band the highlight leaves behind stays on the
picture as a muted ghost — no fill, a lighter dashed stroke, at the same coordinates as the
live band, so the column never appears to move. Live band and ghost cross-fade, their inks
summing to one, so neither flashes. The ghost stands from the turn through every LayerNorm
beat and the live band returns for the perturbation test. The ghost does **not**
re-emphasise its numerals: rows 2–4 of feature 1 stay grey, and only the live band or
LayerNorm's own row makes a numeral heavy (four heavy numerals before the turn, seven
during it while both groups are in play, four after, seven again at the test).

**Captions and reduced motion.** Beat 1's caption is now "One highlight turns: BatchNorm's
column becomes this token's row. Other rows supply no statistics." (14 words), and its
scrubber name "Turn the highlight to the feature axis"; the svg's accessible name describes
the turn and the ghost while they are on screen. Following this scene's existing convention
for a glide that occupies a beat's tail, reduced motion shows the pre-turn state at beats 0
and 1 (column, CNN sketch, no plot) and the finished turn from beat 2 (row, ghost, plot) —
the turn's two end states as two coherent stills, with no half-turned rectangle anywhere on
the reduced timeline.

**One determinism repair found by the suite.** Writing a node's `opacity` after toggling its
`hidden` made attribute order depend on playback history, so a seek no longer reproduced
byte-identical markup. Opacity is now written before visibility; the scrubbing-history test
passes again.

Nothing else changed: `data-duration`, `data-beats`, the fixture, the declared variant, the
perturbation test, every number, both static prints (the final frame is unchanged — the
ghost is hidden at t = 40) and the author's own `details.mechanism-check` block.

**Checks.** `node --test scripts/test_layernorm_axis_excerpt.cjs`: **58/58** (54 before).
Four new tests, and seven that pinned the hard swap rewritten: the highlight's four edges
are sampled every 0.05 s across 7.5–10 s at nine widths and must be monotone, within the
smoothstep's own per-step bound, easing in and out, always containing the shared cell, and
exactly equal to the column at 7.5 s and to the row at 10 s; the live-or-ghost column is
present at every quarter second of the whole timeline, with the ghost verified as
secondary (no fill, dashed, thinner stroke) and its numerals grey; the reduced stills are
the two end states; the transcript describes the turn. `render_static_frames.cjs
layernorm-axis --check` reports current and `audit_excerpt_fixtures.py` passes. Browser
frames at 1280 px and 375 px, times 2, 6, 8, 9, 9.5, 10, 12, 17, 24, 31, 34, 39.9 plus
`--reduced`: no page overflow, no svg text outside the picture, no console errors.
