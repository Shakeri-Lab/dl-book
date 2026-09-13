# Wave 2 plan — mechanism excerpts, and how to build them cheaply

Current work, September 13: [derivative gates](derivative-gates-excerpt.md) is
pushed as `00c0730`. Its publishing run `34770754602` has a bootstrap HTTP 503 and
the known Chapter 18 signed-zero failure; no contract was relaxed.
[Greedy tree](greedy-tree-excerpt.md) is now publication-approved: the author
authorized its missing fixture in the shared manuscript first. Both editions
receive a normalized conditional table and complete-path comparison; the optional
player follows the same bounded tree. No re-execution or changed date results.

Prior checkpoint: the approved [LayerNorm/BatchNorm scene](layernorm-axis-excerpt.md)
is pushed as `e00d3c5`; publishing run `34766825371` succeeded.
[Chapter 5 derivative gates](derivative-gates-excerpt.md) is a separate
network-first redesign approved by the author. Keep the forward sigmoid output
visible while the backward unit probe shrinks: large activity is not large local
sensitivity. The two small insets show actual activation functions, not derivative
plots. A brief active-ReLU substitution precedes a ten-component, best-case sigmoid
factor path. Weight contributions are omitted, not set to one; filled area encodes
sensitivity without a floor and the hollow ring locates a subpixel signal only.
The network-first redesign passes 974 tests, the six source/HTML audits, exact
frozen stdout and desktop/phone inspection. The old plot/log-ruler acceptance is
superseded. The author approved publication with “good. Push and do next.”
Rebuild and verify before pushing this scene. This finishes the ready Wave 4
queue. The author then authorized a small shared-manuscript greedy-versus-beam
example followed by its local animation; keep that work out of this publication.
Do not import the film's measured 30-layer training replay.

Prior checkpoint: [scale granularity](scale-granularity-excerpt.md) is
pushed as `e5827cb`, run `34764538563` succeeded. [Chapter 14 LayerNorm axis](layernorm-axis-excerpt.md)
is author-approved for separate publication, including the requested temporal
and spatial BatchNorm contrast. Variable length is a padding/pooling concern,
not a prohibition on BatchNorm. Chapter 5 derivative gates is next for local review.
Preference ruler was
pushed separately as `7aba6ea`; run `34762857399` succeeded and is live-verified.

Prior checkpoint: A1's [SVD circle](svd-circle-excerpt.md) was pushed in
`4fb86d4`, with pixel-serialization hotfix `9730659`. Publishing run `34761906820`
passed interactions but failed the existing Chapter 18 notebook signed-zero gate.
Chapter 18's [preference ruler](preference-ruler-excerpt.md)
is author-approved for separate publication. It reuses the existing transitive A/C
scores and common shift, not a new experiment or another control. Next local
preview: Chapter 17 scale granularity at fixed bit width, using the quiet-row
range from the manuscript rather than the film's illustrative sample values.

Prior status, September 11, 2026: four Wave 2 scenes are committed in `0674cab`.
The author approved repairs and mask/predictor for publication after local review,
then requested reference tilt as the next local-review scene. The approved pass
was pushed in `d08c41f`; reference tilt is now separately author-approved for push
([receipt](reference-tilt-excerpt.md)). Chapter 19's analytic score field is now
separately pushed as `ec2e0f6`, not a full diffusion/training replay. Chapter 16's
attention bill was separately pushed in `061eff3` ([receipt](attention-bill-excerpt.md),
publishing run `34595314339`, passed and verified live). Mask before softmax is
author-approved and pushed as `6cde283` (run `34601697930`) after desktop/phone review;
its seeded-fixture gate is closed by the existing figure's exact source row.
See [its receipt](mask-before-softmax-excerpt.md). The author approved
[same-subspace](same-subspace-excerpt.md) on September 12, using the existing
projector identity as a labeled schematic. A1's SVD is next for local review.
Greedy tree still has no manuscript branching fixture.
The other later
wave entries remain proposals. The
historical build-route discussion below does not authorize a new shared animation
kit; reuse existing transport and only extract helpers when actual duplication warrants it.

Original proposal status: `docs/animation-authoring.md` said it did not
authorize additional scenes; the author approves each wave by reviewing it in a browser.
Companion documents: `docs/wave1-excerpts.md` (what shipped and why), `docs/backlog.md`
(the roadmap), `docs/animation-authoring.md` (the contract and the visual grammar).

## 1. What Wave 1 taught, in numbers

Wave 1 shipped three scenes (`softmax-shift`, `one-chain`, `gate-product`) and cost, in
delegated-agent tokens: ≈ 6.5 M for the first build, ≈ 4.3 M for the redesign after the author
rejected that build, ≈ 3–4 M for the second redesign of `gate-product`, plus ≈ 4.7 M for the
polish of the three older players. Roughly **4–5 M tokens per accepted scene**. The waste was
not in the code; it was in *designing twice*: the first build inherited the card-and-readout
grammar of the older players, and the author's verdict ("too many boxes like a table … not
LaTeX … very hard to read") arrived only after the scenes existed.

The two things that made the second attempt succeed are now infrastructure and cost nothing to
reuse: the visual grammar (one picture, one object, motion is the mechanism, colour = meaning,
typeset math) and the practice of judging **rendered frames** before writing code.

## 2. Where the pictures already exist: the HTML lecture films

Every candidate scene in Waves 2–4 already exists as a finished, author-approved, *browser-native*
picture in the DS 6050 lecture films (`Teaching/6050/Video_lectures/6050-ChN/lecture.jsx`): React
compositions that are a pure function of composition time `T`, with one moving object per scene,
the semantic palette, KaTeX equations, ends-only headers, and every number computed from seeded
data. Those films are the 3Blue1Brown-style versions of these mechanisms; the `gate-product`
redesign the author accepted is, in effect, the film's `SMemoryHighway` scene re-drawn by hand.
Wave 1 paid ≈ 4–5 M tokens per scene to reproduce pictures that already run in a browser.

**The film runtime can be driven from outside.** Its canvas listens for a seek event
(`data-om-seek-to-time-frame`, `{time, sync: true}` — `animations-v3.jsx:92, 544`) and the scene
table is published as `window.OM_SCENES`. So the book's own transport (`shared/playback.js`,
40-s clock, beats, reduced motion, keyboard) can be the controller and a film scene the renderer:
`render(t) = seek(sceneStart + t)`. Nothing in the film runtime needs editing.

Three routes, cheapest first:

| Route | What ships in the book | Cost per scene | What it gives up or relaxes |
|---|---|---|---|
| **A. Embed the film scene** | The chapter\'s `<details>` disclosure (question, intro, boundary, transcript from `Video_lectures/transcripts/`), the book transport bar, and inside the pane the film itself, mounted in an `<iframe>` from `interactives/films/<chapter>/excerpt.html` with `?scene=<Name>`; the iframe seeks on every tick, shows only that scene\'s window, and hides the film\'s own transport. Fallback: a poster frame (PNG captured at the scene\'s witness beat) plus the transcript. | ≈ 0 authoring tokens (one manifest entry: film, scene, anchor, question, boundary). One-time infrastructure ≈ 1 workflow. | Relaxes two rules the author wrote: (1) *no framework import* — React + ReactDOM (≈ 130 KB) + KaTeX (≈ 1.4 MB with fonts; a subset is possible) + the film\'s compiled scene code (100–300 KB) load **only when the disclosure opens**; Babel is avoided by precompiling the JSX once; (2) *the manuscript owns every number* — the film\'s seeded data differs from the printed fixture in some scenes (softmax: 3 logits vs 4; pooling: a different tensor; quantization: nine schematic weights vs eight printed values), so each embed declares the difference in its caption and receipt, and the chapter\'s static figure stays the authority. Also gives up per-scene controls (no slider) unless the film scene has one. |
| **B. Film port, kit-assisted** | An SVG player like Wave 1\'s, drawn with a shared kit of the primitives Wave 1 built three times (bars with ghosts, chain-nudge, belt, log axis, colour band, token, slider, badge, formula toggles) and choreographed from the film\'s storyboard row and `window.CH*_STORY` constants. | ≈ 0.8–1.5 M tokens (no design panel; film → build → one visual check). | Nothing the contract requires; still needs the fixture audit and tests. |
| **C. Wave-1 process** | As B, with designers, judges, four lenses and skeptics. | ≈ 4–5 M tokens. | Retired except where no film scene exists (A1 SVD circle). |

**Author decision (2026-09-10).** Not Route A: "we want to embed, but we want to use the
already developed ideas and not reinvent the wheels." So the excerpts stay native SVG players in
the book (no film runtime, no iframe, manuscript numbers), and **the design is lifted from the film
scene instead of being invented**: the picture, the object that moves, the reveal order, the
easing and the captions come straight from `lecture.jsx` and the storyboard row; only the fixture
values are re-bound to the manuscript and the grammar's 40-s budget is applied. No designer panel,
no judges — the film *is* the approved design. This is Route B, and it is the default for every
Wave 2–4 scene that has a film counterpart (all but A1 SVD circle). The September 13
source audit found `SGreedyTree` in `6050-Ch11/lecture.jsx` and its storyboard row;
its blocker was the missing manuscript fixture, not missing film composition.

## 3. What "port the film scene" means, step by step (≈ 1 M tokens per scene)

1. Read the film scene function in `Video_lectures/6050-ChN/lecture.jsx` and its row in
   `STORYBOARD.md`: the marks it draws, the one quantity its clock drives, the caption cues.
   Film scenes are already SVG/HTML drawn from state as a pure function of time — the port is
   mostly mechanical (JSX → the player\'s `render(time)`), not a redesign.
2. Bind numbers to the manuscript: replace the film\'s seeded values with the chapter\'s printed
   fixture, declare in the receipt what the film showed instead (e.g. softmax: 3 logits → 4).
3. Reuse the existing shared transport and test harness; keep the scene renderer a
   pure function of time and declared inputs. The proposed `shared/kit.js` was not
   required for the four implemented ports and is not a prerequisite for the fifth.
   Extract only demonstrably shared drawing code, not a general engine. Generate
   wide and narrow final-frame fallbacks with `scripts/render_static_frames.cjs`.
4. Typeset the film\'s KaTeX string through the book\'s MathJax with the book macros (the film
   already uses the same colour roles), wrapped in `<span id="eq-…">`.
5. One visual check on rendered frames at 1280 and 390 px against the grammar, the fixture
   audit, the scene test (arithmetic invariants + the generic transport/grammar suites), then
   the receipt. Skeptic rounds only for scenes with a control (slider, probe).

## 4. Wave 2 scenes (route, anchor, film source, fixture)

| # | Scene | Route | Anchor (qmd) | Film scene | Manuscript fixture |
|---|---|---|---|---|---|
| 1 | Ch8 `pooling-bins` | B, port of `SPooling` | after `cell-pool-invariance` (08-cnn.qmd:392) | `6050-Ch8` `SPooling` | L396–406 grids; computed down-shift declared |
| 2 | Ch3 `hinge-bump` | B, port of `SBump` | after `cell-fig-hinge-bump` (03-nonlinearity-mlp.qmd:258) | `6050-Ch3` `SBump` | L248–252 `h1 − 2h2 + h3` |
| 3 | Ch10 `lstm-valves` | B, port of `SLSTMDesign` | after `cell-fig-lstm-conveyor` (10-sequences-rnn.qmd:355) | `6050-Ch10` `SLSTMDesign` | `@eq-lstm` L338–352; illustrative openings declared |
| 4 | Ch17 `quantization-grid` | B, port of `QuantGrid` (+ bit-width slider) | after `cell-fig-quantization-granularity` (17-peft-quantization.qmd:1123) | `6050-Ch17` `QuantGrid` | L1132–1134 eight values, `@eq-symmetric-quantization` |
| 5 | Ch18 `mask-predictor` | B, port of `MaskReceipt` | before H2 "A preference is a measurement…" (18-alignment.qmd:237) unless the author labels the audit cell | `6050-Ch18` `MaskReceipt` | L193–200 tokens and masks (symbolic terms) |

Resolved decisions: E1 (Ch5 figure orange vs excerpt wine) is a documented
difference in the receipt. E5 uses the before-heading anchor without a QMD edit.
Route A is rejected: the author wants native lightweight ports, not the film runtime.

## 5. Waves 3–4 (shortlist, not implementation authorization)

Current exception, September 11: reference tilt is pushed as `bc1133f` (verify
publishing run `34586598964`); the author approved score field after local
review. Its [receipt](score-field-excerpt.md) restricts the port to the fixed
analytic mixture and prescribed inspection sweep, omitting the film's time slices.
Score field was separately pushed in `ec2e0f6`; check run `34589132667` for deployment.
Chapter 16's linked-patch attention bill was separately pushed as `061eff3`. The
author requested the next scene afterward: mask before softmax. Its fixture is now
resolved against the source code of the adjacent figure; keep its local review
separate. This is not blanket approval for later candidates.
The author's follow-up review replaces elastic resizing with two discrete patch
states, links the image grid to query/key axes, identifies the sixteen reference
tiles as old-grid areas, and puts a token-length comparison beside the score area.
Keep the existing compact movie transport rather than adding architectural controls.

Wave 3: Ch18 `reference-tilt` (port of `GibbsTilt`, β slider), Ch19 `score-field` (port of
`ScoreField`; the author authorized the bounded analytic picture on September 11,
not a diffusion/training replay), Ch16 `attention-bill` (port
of `AttentionBill`), Ch13 `mask-before-softmax` (port of `MaskBefore`; source-bound
intermediate scores resolved, approved for publication), Ch11 `greedy-tree`
(shared-manuscript fixture authorized September 13; static example and player
now prepared locally for review, not yet pushed). Wave 4:
PCA interlude `same-subspace` (port of `SSameSubspace`; author-approved,
schematic `VQ` basis with `Q^T z` coordinates), A1 `svd-circle` (no film — Route C;
author-approved existing constructed factors, scales 3 and 1),
Ch18 `preference-ruler` (port of `BradleyTerry`), Ch17 `scale-granularity` (port of
`GranularityDesign`), Ch14 `layernorm-axis` (port of `LayerNormAxis`), Ch5 `derivative-gates`
(network-first adaptation of `SGates`: forward activity versus backward sensitivity,
then an activation-factor path; no logarithmic plot in the revised composition).

## 6. Per-wave acceptance (unchanged)

Suite green; `audit_excerpt_fixtures.py`; `audit_frozen_stdout --base HEAD` unchanged unless a
manuscript edit is declared; pandoc-to-LaTeX byte-identical with and without the filters for
every touched chapter; frames at 1280 and 390 px looked at against the visual grammar; receipt
with hashes; author browser review; push; live anchors verified.
