# Wave 2 plan — mechanism excerpts, and how to build them cheaply

Status: proposal, not authorization. `docs/animation-authoring.md` still says it does not
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
| **C. Wave-1 process** | As B, with designers, judges, four lenses and skeptics. | ≈ 4–5 M tokens. | Retired except where no film scene exists (Ch11 greedy tree, A1 SVD circle). |

**Author decision (2026-09-10).** Not Route A: "we want to embed, but we want to use the
already developed ideas and not reinvent the wheels." So the excerpts stay native SVG players in
the book (no film runtime, no iframe, manuscript numbers), and **the design is lifted from the film
scene instead of being invented**: the picture, the object that moves, the reveal order, the
easing and the captions come straight from `lecture.jsx` and the storyboard row; only the fixture
values are re-bound to the manuscript and the grammar's 40-s budget is applied. No designer panel,
no judges — the film *is* the approved design. This is Route B, and it is the default for every
Wave 2–4 scene that has a film counterpart (all but Ch11 greedy tree and A1 SVD circle).

## 3. What "port the film scene" means, step by step (≈ 1 M tokens per scene)

1. Read the film scene function in `Video_lectures/6050-ChN/lecture.jsx` and its row in
   `STORYBOARD.md`: the marks it draws, the one quantity its clock drives, the caption cues.
   Film scenes are already SVG/HTML drawn from state as a pure function of time — the port is
   mostly mechanical (JSX → the player\'s `render(time)`), not a redesign.
2. Bind numbers to the manuscript: replace the film\'s seeded values with the chapter\'s printed
   fixture, declare in the receipt what the film showed instead (e.g. softmax: 3 logits → 4).
3. Draw with the shared kit, `interactives/shared/kit.js`, extracted from the three Wave 1
   players: bars with dashed ghosts, chain with a travelling nudge, belt with valves, log axis,
   colour band, token, parameter slider, ratio badge, formula class toggles. Each primitive is a
   pure function state → SVG attributes, so `render(time)` stays deterministic and the static
   fallback is the primitive\'s output at `t = duration` (`scripts/render_static_frames.cjs`).
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

Open decisions carried from the plan: E1 (Ch5 figure orange vs excerpt wine — resolved in the
receipt as a documented difference; the author may still ask for the figure's colour), E5 (Ch18
anchor), and the new one above: whether film clips (Route A) are admissible.

## 5. Waves 3–4 (unchanged from the approved plan)

Wave 3: Ch18 `reference-tilt` (port of `GibbsTilt`, β slider), Ch19 `score-field` (port of
`ScoreField`; needs the author's OK against the diffusion deferral), Ch16 `attention-bill` (port
of `AttentionBill`), Ch13 `mask-before-softmax` (port of `MaskBefore`; needs the pre-mask scores
decision), Ch11 `greedy-tree` (no manuscript numbers — needs a manuscript addition first). Wave 4:
PCA interlude `same-subspace` (port of `SSameSubspace`), A1 `svd-circle` (no film — Route C),
Ch18 `preference-ruler` (port of `BradleyTerry`), Ch17 `scale-granularity` (port of
`GranularityDesign`), Ch14 `layernorm-axis` (port of `LayerNormAxis`), Ch5 `derivative-gates`
(port of `SGates`; reuses Wave 1's log axis).

## 6. Per-wave acceptance (unchanged)

Suite green; `audit_excerpt_fixtures.py`; `audit_frozen_stdout --base HEAD` unchanged unless a
manuscript edit is declared; pandoc-to-LaTeX byte-identical with and without the filters for
every touched chapter; frames at 1280 and 390 px looked at against the visual grammar; receipt
with hashes; author browser review; push; live anchors verified.
