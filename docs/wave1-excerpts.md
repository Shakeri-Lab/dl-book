# Wave 1 mechanism excerpts — implementation receipt

Three new optional HTML explanations of existing book examples: `softmax-shift-excerpt`
(Chapter 2), `one-chain-excerpt` (Chapter 5), `gate-product-excerpt` (Chapter 10).

**Baseline.** Built on `main` at `4a7ea95` — *Add kernel and BERT mechanism animations
with authoring guide* — plus the Part 1 polish of the three already-shipped players and
the Wave 1 shared infrastructure (manifest-driven filter, scene template, shared test
harness, fixture-drift audit). Both of those sit in the working tree with this wave;
nothing in Wave 1 is committed or pushed, so `4a7ea95` is still `HEAD`.

**Author review (2026-09-10).** The author opened the first build of all three scenes in a
browser and rejected it ("too many boxes like a table … non-LaTeX encoding … very hard to
read"); the scenes were rebuilt under the visual grammar recorded in
`docs/animation-authoring.md`. The author then reviewed the rebuilt `softmax-shift` and
`one-chain` scenes and the design frames of `gate-product`, asked for five further changes to
`gate-product` (ratio badge, shared linear/log chart, retention river, concrete token, bias
slider — all built), and instructed: "After that, commit and push." That instruction is the
authorization for this publication; the final `gate-product` build was verified against the
author's five requests by frame review before the push. Item 12 of the pending list below
(live verification) is closed by the publishing run itself.

Ship order inside the wave was deliberate: `softmax-shift` first, because it is the
smallest of the three and its job was to prove the new manifest entry, the scene template
and the test harness before the heavier scenes used them. It did: nothing in the
scaffolding had to be changed to accept it.

For the explanation of every player and the reusable production rules, see
[Mechanism animations: reference and authoring contract](animation-authoring.md).

## Review locations

Serve `_book` on port 8777 and open the anchor. Each opens its optional panel **paused**,
not playing. An ordinary chapter visit leaves the panel closed and requests neither the
scene script nor the playback helper.

| Chapter | Anchor | Local URL |
|---|---|---|
| 2, *Linear models that classify* | immediately after `fig-softmax` (cell div `cell-fig-softmax`) | `http://localhost:8777/chapters/part1/02-logistic-softmax.html#softmax-shift-excerpt` |
| 5, *Backpropagation* | immediately after `fig-chain-graph` (cell div `cell-fig-chain-graph`), inside "One neuron, one chain" | `http://localhost:8777/chapters/part1/05-backpropagation.html#one-chain-excerpt` |
| 10, *Sequences and recurrence* | immediately after `fig-highway-time` (cell div `cell-fig-highway-time`), under "Watch what that buys" | `http://localhost:8777/chapters/part3/10-sequences-rnn.html#gate-product-excerpt` |

## Authority: the manuscript, and no `.qmd` edited

The shared manuscript owns the mathematics and the fixtures. **No `.qmd` was edited in
this wave.** The standing evidence is `scripts/audit_frozen_stdout.py --base HEAD`, which
still reports 133 unchanged stdout blocks across 27 baseline units with all 27 HTML/TeX
pairs matching; a single edit to any executed cell in these chapters would move it.

Digests recomputed with `shasum -a 256` while writing this receipt:

| Source | SHA-256 |
|---|---|
| `chapters/part1/02-logistic-softmax.qmd` | `f72c79714b91dac6788f7745272a104fae6c960544fb743a884165f3e573998e` |
| `chapters/part1/05-backpropagation.qmd` | `62b9791a5713f689a14b6275ea777a32a633f7c1a307c3221acabf7c8b5931ff` |
| `chapters/part3/10-sequences-rnn.qmd` | `43aff04a9e678f6dbeb00a4e04519ee4cc281cec197ac411f39d28fedff6e8ba` |
| `chapters/appendices/a3-precision-performance.qmd` | `f45440cf2f5988439066711a6722e4d6694ec528e7ae23a9f90bf2fabfcebcf9` |

The appendix is here because one witness `gate-product` displays is printed there and not
in Chapter 10; see *Where 8.27 × 10⁻²⁵ is printed* below.
`scripts/audit_excerpt_fixtures.py` re-reads the three chapter digests out of this table
and fails when one is stale, so a manuscript edit forces this file to be re-read rather
than letting a panel drift.

## Lecture sources adapted

Read-only instructor collection:
`/Users/hs9hd/Library/CloudStorage/Box-Box/Teaching/6050/Video_lectures/`. Its working
tree is dirty, so these are **file digests, never a commit**. These sources supply reveal
order and composition — choreography — and are never independent authority for a fixture,
a numerical claim, or a colour.

Digests recomputed with `shasum -a 256`. The digest column is the last column on
purpose: `scripts/audit_excerpt_fixtures.py` reads these rows out of this file, so a
third column between the path and the hash would silently stop the re-verification.

| Lecture source | SHA-256 |
|---|---|
| `6050-Ch2/lecture.jsx` | `025b275df2150cd71963358e332ff14d73d2a610d481b9606f6cc66ce5824eeb` |
| `6050-Ch2/STORYBOARD.md` | `16022632a6a90c8cb8f202ed8d51bd60490e040914fd732ef1e7090af9333e77` |
| `6050-Ch5/lecture.jsx` | `bf17cc90beb6552a8796a47aef03a05d81f25ca6528f6fd5add826955a1869d2` |
| `6050-Ch5/STORYBOARD.md` | `c71205ba9b7192393e8d1353a4c7f7b9366b0ed1a9aa31337b1f1784f03dfacc` |
| `6050-Ch10/lecture.jsx` | `3a2cabb00546067f5c3c0a3715c043ac96ec4f09faa298815428089689a22350` |
| `6050-Ch10/STORYBOARD.md` | `23204f3ef89ad845ee07ec11c6e618154391908294429381798f7c20de888902` |
| `6050-Ch10/ch10-data.js` | `f5c8ea517e49f3aa17a05441bfba0a41d95c783abc8d2d29f8ebd62ded7c2d45` |

What each scene took, and from where:

| Scene | Lecture source | Scene function, line range | Storyboard window |
|---|---|---|---|
| `softmax-shift` | `6050-Ch2/lecture.jsx` + `STORYBOARD.md` | `SSoftmax`, L1267–1354 | **Softmax**, 168–230 s (the ruler swap, 202–213 s, is the beat this excerpt reuses) |
| `one-chain` | `6050-Ch5/lecture.jsx` + `STORYBOARD.md` | `SOneChain`, L356–391 | row 3, **OneChain**, 0:46–1:30, "Turn one knob — how does the loss move?" |
| `gate-product` | `6050-Ch10/lecture.jsx` + `STORYBOARD.md` + `ch10-data.js` | `SMemoryHighway`, L487–520; `retentionByForgetGate` in `ch10-data.js` | row 8, **MemoryHighway**, 5:34–6:30, "open at half — how much of day one survives eighty steps?" |

Two line ranges differ from the ones the plan cites, and the difference is bookkeeping,
not a change of source. The plan's `SSoftmax` L1267–1359 runs three lines past the end of
the function to include the `SOFTEN_BAR_FROM`/`SOFTEN_BAR_TO` handoff constants (L1356–1358);
the function itself ends at L1354, and the excerpt adapts the function. The plan's
`SOneChain` L356–424 spans the neighbouring `SBlameFlow` (L393–418) and `MiniOuter`
(L421–424); the excerpt adapts `SOneChain` alone, L356–391.

`ch10-data.js` is listed as an **independent check**, never a source. Its `atHalf` and
`atSigmoidOne` (`8.271806125530277e-25` and `1.3066949645938375e-11`) were recomputed by
the lecture audit in float64 Python; this scene's own float64 JavaScript lands on the same
digits, which is a second arithmetic path agreeing rather than a number copied across.

`scripts/audit_excerpt_fixtures.py --lecture-tree <path>` re-verifies every digest above.
That check is off by default so publication never depends on a tree that is not checked
out; run today it re-verified all 14 recorded lecture sources.

### What was deliberately **not** imported

No React, Babel, KaTeX, webfont, lecture runtime, video payload, or general animation
engine enters the book from any of these files. Beyond that, these specific lecture
*numbers* were rejected in favour of the manuscript's:

- **Chapter 2.** The lecture's `SSoftmax` uses **three** logits, `2.0 / 0.5 / −1.0`,
  giving `0.79 / 0.18 / 0.04`, with raw exponentials `7.39 / 1.65 / 0.37` summing to
  `9.41`. The book's **four** logits govern and are the fixture this panel mirrors; not
  one lecture probability, exponential, or sum appears in the excerpt. Also not imported:
  the class-template machines, the Ken Burns move, the glow and focus-dim effects, and the
  τ sweep `[4, 1.5, 1, 0.55, 0.32]` (a later section of the same chapter, and a different
  question).
- **Chapter 5.** The lecture's rounded chain line `= 0.822 · 0.206 · 2 = 0.338` and its
  `ΔL = +0.0034` are not imported: the excerpt carries six decimals throughout and prints
  `0.337801` against `0.338046` precisely so that "agree to three decimals" is a visible
  claim rather than an artifact of rounding. Its Tape-scene `.grad` ladder
  (`1 → .822 → .169 → .338`) and op counts (`2 × 5 = 10` vs `5 + 7 = 12`) belong to a
  later scene and are out of scope. Its **orange backward arrows** and orange `b = −0.5`
  chip are not imported — see the palette note and open decision E1 below. Its
  `KenBurns` move, attention glow, focus-dim and pulse effects are not imported. And the
  lecture returns the knob to zero *before* the backward pass begins; this excerpt keeps
  it turned all the way through the backward beats, because a reader watching the cached
  values sit still under a moved `w` is the entire point.
- **Chapter 10.** The lecture's `f = 0.50` two-decimal rounding of the gate is not
  imported (the panel prints `0.500000` and `0.731059`, six decimals, because the whole
  scene is about what eighty multiplications do to a number). Its gold-on-dark palette is
  not imported. Its RNN-versus-LSTM gradient-lag chart is not imported at all: it is a
  *results* plot, which the selection rules exclude. Its PyTorch two-bias-slice code focus
  is not imported.

## `softmax-shift-excerpt` (Chapter 2)

**Question.** *Add 100 to every logit — which probability changes?* The reader answers
before the bars are drawn: through the whole first beat the four probability slots hold a
`?`, never a zero.

**Fixture.** `interactives/manifest.json` records four literals Chapter 2 must keep
verbatim; the line numbers are in `chapters/part1/02-logistic-softmax.qmd` at the digest
above.

| qmd lines | Literal |
|---|---|
| 136 | `logits = torch.tensor([2.0, 0.5, -1.0, 1.0])` |
| 137–138 | `softmax_cases = [(shift, torch.softmax(logits + shift, dim=0))` / `                 for shift in (0.0, 100.0)]` |
| 122–124 | the shift-invariance claim: "**invariant to constant shifts**: adding the same $c$ to every logit changes nothing, because $e^{o_j + c} = e^c e^{o_j}$ and the $e^c$ cancels top and bottom." |
| 273–274 | the numerical landmine: "shift invariance: subtract the max logit before exponentiating (the *log-sum-exp trick*), which changes nothing mathematically and everything numerically." |

The anchor is the `#| label: fig-softmax` cell at L144; the panel is inserted after the
`cell-fig-softmax` div Quarto derives from it.

The panel is the one in-repo mirror: it declares `data-logits="2.0 0.5 -1.0 1.0"` and
`data-shift="100"` on the root, and `interactives/softmax-shift/player.js` and
`scripts/test_softmax_shift_excerpt.cjs` both read those attributes rather than retyping a
number. A test renders the declared attributes back into the chapter's own source text
(`logits = torch.tensor([2.0, 0.5, -1.0, 1.0])`, `for shift in (0.0, 100.0)`), so drift
fails in both directions.

**Declared computed variants** (recorded in the manifest, repeated here):

1. The four probabilities are recomputed from the declared logits by @eq-softmax. The
   manuscript prints them only inside `fig-softmax`, whose bar labels are rendered with
   `f"{v:.2f}"` — 0.61, 0.14, 0.03, 0.22. The panel prints the same four numbers to four
   decimals: **0.6095, 0.1360, 0.0303, 0.2242**.
2. The exponentials shown are `e^(o − m)` with `m` the largest current score —
   1.0000, 0.2231, 0.0498, 0.3679, sharing the sum 1.6408 — because the scene evaluates
   softmax the way this chapter's numerical-landmine section prescribes. The manuscript
   prints neither `e^(o_j)` nor `e^(o_j − m)`; the ratio, and so every probability, is
   identical either way. Showing `e^(o_j)` instead would force the panel to display
   `e^102 ≈ 1.99 × 10^44` at the end of the sweep — a number the implementation
   deliberately never evaluates, so it is not displayed.
3. The shift `c` sweeps continuously 0 → 100 → 0 on the timeline rather than under a
   reader control. The manuscript evaluates only the endpoints 0.0 and 100.0; every
   intermediate `c` is recomputed from the same closed form and none of them is printed.

**Content time** (40 s; `data-duration="40"`, `data-beats="0 6 13 20 30 36"`, mirrored in
the manifest and checked against the markup by the fixture audit):

| From | Stage | What changes |
|---|---|---|
| 0 s | Ask | Four scores on the ruler; the four probability slots hold `?`. |
| 6 s | Exponentiate | `e^(o − m)` revealed: 1.0000, 0.2231, 0.0498, 0.3679, the largest exactly 1. Bars neutral. |
| 13 s | Normalize | One shared sum 1.6408 divides all four; bars shrink to the probabilities and turn green. |
| 20 s | Shift by c | `c` sweeps 0 → 100. The ruler slides with the scores, so the markers hold still; dashed marks appear at the c = 0 bar heights. |
| 30 s | Cancel | `c` holds at 100 while `e^c` is struck out of the numerator and of every term of the denominator. |
| 36 s | Hold | `c` returns to 0 over three seconds and rests there; the witness sentence stands. |

**Reduced motion.** Discrete reveals at beat boundaries: `c` is derived from the stage, not
from the clock, and takes exactly the two values the chapter evaluates — 0 for Ask,
Exponentiate and Normalize, the declared 100 for Shift by c and Cancel, and 0 again for
Hold. One state per whole beat, so the ruler arrives shifted rather than sliding, and no
intermediate `c` is ever drawn.

> **Corrected after review.** Until the post-review pass this scene quantised `c` into
> fifths of the shift (0, 20, 40, 60, 80, 100) and computed it from `time`, so the shift
> still stepped through six pictures *inside* beats 3 and 5. That satisfies the harness's
> sampled check — it compares `beat` with `beat + 0.01` — but not the plan's hard rule, and
> not `interactives/_template/player.js`, which prescribes deriving every continuous
> quantity from the stage. Fixed in `player.js` (`shiftFor(stage)`), and the escape is
> closed by `registerBeatHoldTest`, which walks the whole reduced timeline at 0.05 s and
> requires one drawn state per beat interval.

**Palette.** Blue (`#2b6cb0`) for the scores and the score axis — they are the inputs.
Green (`#2f855a`) for the probability bars once they are a distribution; neutral grey
(`#8994a2`) while they are still un-normalised exponentials, which is also what makes the
normalise beat visible; the mini-bar inside each class card follows the same rule, so
nothing is painted as a prediction before it is one. Neutral for the ruler, the sum and
the cancellation strike. **No orange anywhere**: this scene has no learnable parameter,
and orange is reserved for one. The bars carry printed values and the dashed marks are
geometric, so nothing depends on colour alone.

**Teaching boundary.** Four fixed scores, no training, no data, no learned quantity. `c`
moves on the timeline, not under a knob. Softmax is invariant to *adding* a constant, not
to *scaling* one — the panel says so, because the temperature/`τ` discussion later in the
same chapter is exactly the case where scaling does change the distribution.

**Independent checks** (`scripts/test_softmax_shift_excerpt.cjs`: 35 tests — 21 inherited
from `registerTransportTests`, 13 scene-specific, 1 integration). Every arithmetic
assertion recomputes softmax inside the test from the panel's declared attributes; it
never calls the player's own helper:

- positivity and normalisation at 401 scrubbed times;
- the probability vector equal to the c = 0 vector within 1e-12 at every c the sweep
  visits, and the argmax constant throughout;
- the max subtraction actually happens: `Math.exp` is instrumented inside the JSDOM window
  *before the player is evaluated in it*, and every argument it receives over 401 scrubbed
  times is ≤ 0 with maximum exactly 0, so `e^(o + c)` is never formed. The same test
  asserts `exp` was called more than 400 times, so it cannot pass vacuously;
- the same helper survives a fixture moved to `data-shift="1000"`, returning the same four
  finite probabilities within 1e-12, where an implementation without the subtraction would
  evaluate `e^1002` = `Infinity` and return four `NaN`s. For the record: `e^102` is
  1.99 × 10^44 and does **not** overflow float64 — only float32, which is the chapter's
  case — so the `c = 1000` probe is the one that actually bites in JavaScript, and the test
  records `Math.exp(2 + 1000) === Infinity` to make the chapter's landmine concrete;
- the dashed c = 0 marks are drawn only from the shift beat onward, one per class, and the
  figure names them in text rather than relying on the dash alone;
- the static, script-free panel already prints the four probabilities, and every readout in
  it — scores, terms, probabilities, the shift, the largest score, the shared sum, the
  formula, invariant, result and caption lines, the mini-bar classes and widths, and the
  two cancellation spans' visibility — is identical to the `t = 40` render. The panel as a
  whole is **not** byte-equal to that render, and no test claims it is: with script the
  stage strip's last label gains `is-current`, the two computed cells in each card gain an
  `aria-label`, and the figure's `<svg>` gains its drawing and a state-describing
  `aria-label` in place of its standing one. A second test, *the static panel differs from
  the `t = 40` render only where script must add*, subtracts exactly that list from the
  whole pane and asserts what is left is identical, so anything else script starts writing
  fails;
- the chapter still contains each declared literal, and the panel's numbers still agree
  with an independent evaluation of @eq-softmax on those literals.

**Fault injection.** 18 mutations, each a single broken source line in `player.js`,
`panel.html`, `_quarto.yml` or `filters/mechanism-excerpts.lua`, applied one at a time and
restored with a SHA-256 byte check before the next: **18 caught**. They cover dropping the
max subtraction, dividing by `total × 1.001`, scaling the shift per class, publishing the
argmax as the stage, a static witness rounded 0.6095 → 0.6094, a capped stage ladder, a
reduced-motion path left reading the clock, the removed `_quarto.yml` resource line, a logit the
chapter does not print, a hard-coded witness sentence, unrevealed cells printed as
`0.0000`, a reworded final formula sentence, a commented-out non-HTML guard, a never-hidden
cancellation identity, a sweep that never leaves 0, a mini-bar never marked normalised, a
dropped dashed-mark legend, and c = 0 marks drawn from the first beat.

One mutation initially caught nothing, and that is why a check exists for it now: removing
the dashed c = 0 marks' label was invisible, because the first pass asserted nothing about
them. `softmax: the c = 0 marks appear with the shift, one per class, and are named` was
added and the whole set re-run.

**Browser review** (headless Chrome 152.0.7977.83 driven over the DevTools protocol against
the rendered `_book` on :8777, at 1280 × 900 and 390 × 844):

- opens **paused** at the anchor (`open`, `ready`, `time = 0`, `playing = false`) at both
  widths; an ordinary visit with no hash leaves the panel closed and fetches **zero** scene
  assets — neither `softmax-shift/player.js` nor `shared/playback.js`;
- no horizontal overflow at either width — `document.scrollWidth == innerWidth`, pane and
  body `scrollWidth == clientWidth`, and no overflowing descendant except the
  `.mechanism-sr` clipped spans; the SVG viewBox re-measures 713 → 296;
- controls: play 44 × 44, fullscreen 44 × 44, speed 64 × 44 (58 at 390), scrubber 493 × 44
  (121 at 390) — all at least 44 px;
- Space plays, Escape pauses, arrow keys visit exactly 6, 13, 20, 30, 36, 40; the cancel
  beat shows two `<s>` elements with computed `line-through`; at `t = 40` the stage is 5,
  `c` is 0, the play button reads `data-state="replay"`, and the witness sentence stands;
- native fullscreen enters and exits **paused**;
- under `prefers-reduced-motion: reduce` the sweep visits exactly {0, 100} — re-measured
  after the post-review fix, 81 seeks across the whole timeline at 0.5 s: `c` is 0 for
  stages 0–2, 100 for stages 3–4 and 0 for stage 5, one value per stage;
- console **empty** at both widths and under reduced motion.

**What the browser review changed.** Two things only the rendered page showed, both now
held by tests: the dashed c = 0 marks carried no label (added `dashed = the c = 0 heights`
in the figure, per authoring rule 7 — the picture must read without colour), and the class
cards' mini-bars were green one beat before their values were probabilities (now neutral
until the shared sum divides them, and the static/`t = 40` parity test compares the class
as well as the width). The cancellation line was also enlarged to `.95rem` so the struck
`e^c` reads at body size.

## `one-chain-excerpt` (Chapter 5)

**Rebuilt on September 10, 2026** to the visual grammar (`docs/animation-authoring.md`,
"Visual grammar") after the author rejected the first build of this scene — an eight-tab
stage strip, a chip row, four framed cards with "cached" pills, three derivative cards, two
`<dl>` ledgers and Unicode math. Nothing of that build survives except its arithmetic, its
transport and its fixture wiring. The design it implements is the synthesis recorded in the
redesign mocks (`one-chain-minimal` as the base, five grafts from `one-chain-film`).

**Question.** *Turn `w` up by 0.01 — does the loss rise or fall, and by how much per unit
of `w`?* The reader answers before anything is computed: through the whole first beat `z`,
`a` and `L` read `·`, never a zero, and only the dial `w = 0.700` is on the line.

**Fixture.** `interactives/manifest.json` records five literals Chapter 5 must keep
verbatim; line numbers in `chapters/part1/05-backpropagation.qmd` at the digest above.

| qmd lines | Literal |
|---|---|
| 404–406 | `w, x, b = Value(0.7), Value(2.0), Value(-0.5)` / `a = ((w * x) + b).sigmoid()` / `loss = (a + (-0.3)) * (a + (-0.3))      # squared error vs target 0.3` |
| 414–415 | `print(f"micro-autograd: dL/dw = {w.grad:.6f}")` / `print(f"by hand:        dL/dw = {2 * (s - 0.3) * s * (1 - s) * 2.0:.6f}")` |
| 39–44 | `@eq-chain` itself, the display `∂L/∂w = ∂L/∂a · ∂a/∂z · ∂z/∂w` |
| 77–78 | "**The forward pass caches.** Computing $L$ produces the intermediate values ($z$, $a$) along the way; we keep them, because the backward pass will need them." |
| 79–80 | "**The backward pass reuses.** Each edge contributes one *local* derivative, and the derivative of $L$ with respect to anything is the product of local derivatives along" |

The fixture cell is `micro-autograd-check` (label at L401, cell L400–416). The anchor is
the `#| label: fig-chain-graph` cell at L47; the panel is inserted after the
`cell-fig-chain-graph` div. Because the fixture cell sits roughly three hundred and fifty
lines *below* this anchor, the panel intro names it, says that `x = 2` stands in the place
of the previous activation `a^(l−1)` the surrounding prose writes, and says that the four
nodes on the line are the four boxes of the figure above.

The panel is the one in-repo mirror: `data-w="0.7" data-x="2.0" data-b="-0.5"
data-y="0.3" data-nudge="0.01"` on the root, read by `interactives/one-chain/player.js`
and by `scripts/test_one_chain_excerpt.cjs`. The hand-typed TeX of the 27 typeset labels
is *not* a second copy: at mount the player regenerates every label's TeX from those five
attributes and compares it with the span (through `MathJax.startup.document.math` once a
span is typeset); a mismatch rewrites that span once, lists its name in
`data-fixture-rewritten`, and is re-typeset through its box. With the shipped fixture the
attribute is empty, and a test asserts it.

**Derived witness** (all recomputed, never transcribed):

| Quantity | Value |
|---|---|
| `z = wx + b` | 0.900 |
| `a = σ(z)` | 0.710950 |
| `L = (a − y)²` | 0.168879 |
| `∂L/∂a = 2(a − y)` | 0.821899 |
| `∂a/∂z = a(1 − a)` | 0.205500 |
| `∂z/∂w = x` | 2 |
| product | **0.337801** |
| `Δw`, `Δz`, `Δa`, `ΔL` at `Δw = +0.010` | +0.010, +0.020, +0.004093, +0.003380 |
| `ΔL/Δw` | **0.338046** |

**A binding stronger than a `.qmd` literal.** The product is not only recomputable, it is
*printed by the chapter itself*, and the test reads that printout rather than a number in
prose: the committed freeze
`_freeze/chapters/part1/05-backpropagation/execute-results/html.json` holds
`micro-autograd: dL/dw = 0.337801` and `by hand:        dL/dw = 0.337801`, and a test
asserts the panel's product equals that string. `0.168879` and `0.338046` are not printed
anywhere and are declared computed variants.

**Declared computed variants** (recorded in the manifest, repeated here):

1. `z`, `a` and `L` are recomputed from the declared inputs by the chapter's own forward
   pass. The chapter executes that pass but prints only its gradient.
2. The three local derivatives are the separate factors of the chapter's own hand check
   `2 * (s - 0.3) * s * (1 - s) * 2.0`, evaluated one at a time. Their product, 0.337801,
   is exactly what the chapter prints; the three factors are not printed on their own.
3. The finite difference is this scene's own measurement: the chapter runs none here.
   `Δw = +0.010` is declared once, on the panel; `Δz = +0.020`, `Δa = +0.004093`,
   `ΔL = +0.003380` and `ΔL/Δw = 0.338046` follow from one extra forward pass and are
   written at the four ghosts of the nudge.
4. The dial turns on the timeline, not under a reader control: `w` slides 0.700 → 0.710
   and back, and `z`, `a`, `L` are recomputed at every intermediate `w` the nudge has
   reached. None of those intermediates is printed, and the kept values stay at `w = 0.7`.
5. The bar heights (8,000 drawing units per unit of nudge in the wide layout, 4,000 in
   the narrow one) and the dial range (`w ∈ [0.68, 0.72]` across 120°, one tick per 0.01)
   are drawing scales chosen so the rescaling at each edge is legible; they are not
   numbers of the chapter.

**The factor of two.** The chapter's loss is `(a − y)²`, so `∂L/∂a = 2(a − y)`. A
half-squared error — the other common convention, and the one that makes this exact
example look almost right — would halve every local derivative in the chain and give
**0.168900**, a number close enough to the true loss 0.168879 to survive a careless read.
`scripts/test_one_chain_excerpt.cjs` computes that counterfactual explicitly, asserts it
equals 0.168900, asserts the scene's product is not it, asserts the scene's product is
exactly twice it, asserts `0.5 × L = 0.084440`, asserts the chapter's own loss line
carries no `0.5` and no `/2`, and asserts 0.168900 appears nowhere on the rendered panel.

**The picture.** One SVG: the chain `w → z → a → L` as four nodes on one line, `w` drawn
as a dial with five ticks (one per 0.01) and a needle. Above each edge sits its typeset
map — `z = wx + b`, `a = σ(z)`, `L = (a − y)²`, letters in the macro colours — and, above
the edges they enter, the three constants written once: `x = 2` and `b = −0.5`, `y = 0.3`.
Under each node its letter and its live value (plain SVG text, tabular digits, `·` until
computed). **The one object the eye tracks is the nudge**: one orange bar, 12 units wide,
whose height *is* the size of the nudge. It is born on the dial's rim as the dial turns,
travels the three edges and is rescaled at each — ×2 (80 → 160 units), ×0.2046
(160 → 32.7), ×0.826 (32.7 → 27.0) — with the height interpolated geometrically so the
operation reads as a scaling, not a slide. At every node it leaves a dashed ghost of the
height it had there and a Δ label, so the still frame keeps the four heights side by side.
The bar stays orange for the whole trip (it is the `w`-nudge propagated); the Δ *labels*
take the colour of the quantity they measure (`Δw` orange, `Δz` ink, `Δa` green, `ΔL`
wine). The backward beat is the same line seen the other way: one wine ray runs
right-to-left along the same edges and, on arriving at each node, writes that edge's
factor under the edge — `× 0.821899` (wine), `× 0.205500` (green), `× 2` (blue) — each
with its derivation `= 2(a − y)`, `= a(1 − a)`, `= x`. Under `L`, stacked: `ΔL/Δw =
0.338046`, then `∂L/∂w = 0.337801`. Under the picture, one typeset formula line
(`@eq-chain`'s three factors, symbolic then numeric, then the product, each factor wrapped
in `\class{oc-f3|oc-f2|oc-f1}{…}` and the product in `\class{oc-prod}{…}`), and one
caption of at most twenty words. Forward ink carries no arrowheads; after the sweep each
edge carries exactly one wine head at its left end.

Every mathematical mark on the picture is typeset: 25 `<foreignObject>` labels, each a
`<span id="eq-one-chain-…">\( … \)</span>` on MathJax's `lazyAlwaysTypeset` list, so they
scale with the viewBox, reflow with the narrow layout and go fullscreen with the drawing,
with no absolutely positioned overlays. Two formula spans (`eq-one-chain-1`, one line;
`eq-one-chain-1n`, a three-row `aligned` form) carry the same three literals and the
product; a test asserts they agree factor for factor, and the stylesheet shows exactly one
of them by `[data-layout]` (and by a `max-width: 600px` media query when script is off).
Live-changing numbers are never inside a formula. The TeX is never rewritten during
playback: the formula is animated by `is-shown`, `is-f3`, `is-f2`, `is-f1`, `is-prod` on
the wrapper, with the dimming gated on `[data-ready]` so the static fallback is fully lit.

> **This supersedes the Wave 1 brief's "no MathJax inside the panel" line** and open
> decision E17 below: rule 5 of the visual grammar requires typeset math, the page's own
> MathJax 4.1.3 typesets these spans eagerly even inside the closed disclosure, and the
> player makes one guarded `typesetPromise` call after mount (none when the lazy
> typesetter has already finished; `data-typeset` reports `mathjax` or `none`, and the
> TeX source stays readable when MathJax is absent or rejects).

**Content time** (40 s; `data-duration="40"`, `data-beats="0 5 12 21 24 27 30 34 37"`,
mirrored in the manifest and checked against the markup by the fixture audit; at the 1.5×
default multiply by ⅔):

| From | Beat | What moves (exactly one thing) | What is written |
|---|---|---|---|
| 0 s | Ask | nothing | dial at 0.700, edges dim, maps and constants, letters, `·` for `z`, `a`, `L` |
| 5 s | Forward | blue ink runs left to right, one edge at a time (5.5–7, 7–8.5, 8.5–10) | each dot lights and its value appears when its edge is fully inked: 0.900, 0.710950, 0.168879 |
| 12 s | Nudge | 12–13.5 the dial turns 0.700 → 0.710 (ghost needle at home) and the bar grows to 80 on the rim; hops 14–15.3, 16.3–17.6, 18.6–19.9 with a dwell between; the value at each node ticks as `forward(w₀ + Δw·p)` while the bar arrives | 13.5 ghost + `Δw = +0.010`; 15.3 `Δz = +0.020` (z reads 0.920); 17.6 `Δa = +0.004093` (0.715042); 19.9 `ΔL = +0.003380` (0.172260) |
| 21 s | Measured | nothing (bar parked at `L`) | `ΔL/Δw = 0.338046` under `L` |
| 24 s | ∂L/∂a | 24–25 the dial returns, every value ticks back, the bar fades where it stands, the ghosts dim; **then** 25.2–27 the wine ray `L → a` | 25.0 the formula line, all factors dim; 27.0 `× 0.821899`, `= 2(a − y)`, `oc-f3` lit |
| 27 s | ∂a/∂z | 27.4–29.2 ray `a → z` | 29.2 `× 0.205500`, `= a(1 − a)`, `oc-f2` |
| 30 s | ∂z/∂w | 30.4–32.2 ray `z → w` | 32.2 `× 2`, `= x`, `oc-f1` |
| 34 s | Chain | nothing | `∂L/∂w = 0.337801` under the ratio, `oc-prod` lit |
| 37 s | Hold | nothing | the hold caption |

Nine beats, not six: with the stage strip gone a beat costs no UI space, each backward
factor keeps its own beat so reduced motion reveals them one at a time and an arrow-key
reader can stop on each arrival, and the hold caption ("Nothing was updated. Forward
computes and keeps; backward reuses and multiplies.") is a beat of its own, separate from
"three decimals agree". Holds at the default speed: the measured ratio 2.0 s, the product
2.0 s, the hold 2.0 s, the forward values 1.3 s before the dial turns, the third factor
1.2 s before the product lands; a test pins each.

**Reduced motion.** The same picture at each of the nine beats with the object jumped to
its beat position: the continuous picture at the instant each beat's last reveal has
happened (`SNAP = [0, 11.99, 20.99, 23.99, 27, 29.2, 32.2, 34, 40]`). So the bar stands
parked at `L` with all four ghosts and Δ labels for beats 2–3 and is gone from beat 4, the
dial reads 0.710 only in beats 2–3, and each ray has arrived whole at its own beat. The
harness's beat-hold test (one drawn state per whole beat) passes.

**Layout.** `layout()` is the only measurement: it reads the pane width once per resize,
fullscreen or toggle and chooses `wide` (viewBox 1100 × 430, 8,000 units per unit of
nudge) at 600 px and above or `narrow` (480 × 320, 4,000 per unit, closer nodes) below;
`render()` never measures (a test spies on `getBoundingClientRect` across fifty seeks).
The narrow layout drops the three derivation sub-labels (the formula line directly under
the picture shows the same three factors in the same colours) and writes the four
increments as the bare signed numbers `+0.010`, `+0.020`, `+0.004093`, `+0.003380` — the
full `Δa = +0.004093` does not fit between two ghosts at that width in Latin Modern — so
the panel carries both forms as separate spans (`dw`…`dL`, `dw-n`…`dL-n`) sharing one
reveal state. Below 340 px the formula shrinks to 0.8 rem so its numeric row fits a 300 px
phone.

**Palette, and one deliberate divergence.** One orange, the `\parameterpart` macro's
`#c05621` — the dial, its ticks and needle, `w` and its value, the bar and its four ghosts,
`Δw`, the caption words `w`, `0.01`, `nudge`. Blue `#2b6cb0` (`\featurepart`) for `x`, the
forward ink, `× 2`, `= x`; green `#2f855a` (`\predictionpart`) for `a`, its value, `Δa`,
`× 0.205500`, `= a(1 − a)`, `σ′(z)`; purple `#805ad5` (`\targetpart`) for `y`; wine
`#722f37` (`\residualpart`) for `L`, its value, `ΔL`, the wine ray and its heads,
`× 0.821899`, `= 2(a − y)`, both ratios and the caption's loss numbers. `z`, `b`, `Δz` and
the plain operators are ink; scenery is grey. The shared `.target-role` (`#7950b8`) and
`.error-role` (`#9b2c4c`) are overridden within `#one-chain-excerpt` (intro, caption and
boundary prose included) so a caption word matches its formula part; moving the shared
roles to the macro values is recommended as a follow-up that touches the other scenes.
The rejected build's `#B45309` is gone.

> **Open decision for the author (E1), unchanged.** The chapter's static `fig-chain-graph`,
> directly above this panel, draws its backward arrows in `#E57200` — the same orange it
> uses for the weight. This panel reserves orange for the learnable parameter and draws
> the backward pass in wine, so the two pictures of the same chain use different colours
> for the same arrows, a few centimetres apart. The panel's boundary paragraph says so in
> words. Three ways out, none taken here: (a) accept the divergence as documented; (b)
> repaint the excerpt's backward rays orange and drop the wine-for-blame convention in this
> one scene; (c) change `fig-chain-graph`'s `bwd` colour to the wine used here — a `.qmd`
> edit, out of scope for this wave, and it would also change the PDF. **(a) is what ships
> unless the author says otherwise.**

**Deliberate choices, recorded.** (i) Rule 5 supersedes the brief's no-MathJax line (above).
(ii) One orange, the macro's, with scoped role overrides. (iii) E1 stands. (iv) The bar
stays orange for the whole trip; the Δ labels take the colour of the quantity they measure.
(v) No tangent/secant inset: over `Δw = 0.01` the tangent (0.337801) and the secant
(0.338046) differ by 7 × 10⁻⁴ relative and the curve leaves its tangent by ≈ 2 × 10⁻⁶
against a rise of 3.4 × 10⁻³, so at any honest scale the two lines are one line and the
inset would teach the opposite of the payoff; the two stacked numbers carry the
distinction. (vi) Nine beats, for the reasons above. (vii) Forward ink without arrowheads;
one wine head per edge. (viii) The dial range `[0.68, 0.72]` over 120° is a drawing choice
(the film's `[0.65, 0.75]` gave a 12° turn, too small to read). (ix) Derivation sub-labels
and the `Δ· =` prefixes are dropped at narrow width. (x) The mount-time TeX provenance
check exists so the hand-typed literals are never a second fixture copy. (xi) Values are
set in the body font beside Latin Modern labels, the pairing the chapter's prose uses.
(xii) The intro's last sentence now says "the four nodes on the line are the four boxes of
the figure above" (it said "four boxes" when the panel drew boxes).

The picture reads without colour: the SVG's `<title>` and its live `aria-label` are
composed from the fixture (the dial, the four values, the nudge's four increments, both
slopes), every factor and ratio is a typeset number with its derivation, the ghosts are
dashed outlines, and the transcript names the ghosts and every number.

**Teaching boundary.** One neuron, one example, one knob. Nothing is updated: no step, no
learning rate, and `w` ends exactly where it started. `∂L/∂b`, fan-out accumulation, and
`torch.autograd` are all later in the same chapter and are not touched. There is no
PyTorch in the panel. The panel says all of this.

**Static fallback.** `panel.html` ships the beat-8 frame, written by
`scripts/render_static_frames.cjs one-chain` from the player's own `t = 40` draw between
the `<!-- static-frame -->` markers (with the SVG title and `aria-label` the player
composes): dial at 0.700, three wine edges with one head each, the four values, four
dashed ghosts with their Δ labels, the three factors with their derivations, `ΔL/Δw =
0.338046` over `∂L/∂w = 0.337801`, the bar absent (`hidden`), every label visible, the
formula fully lit, the hold caption. Nothing reads `·`. A test pins the committed panel to
a fresh generator run. The `t = 40` render differs from the static panel only by what
script must add: `data-layout`, `data-typeset` and the published `data-*` state on the
root; the `is-*` classes on the formula wrapper; and the playback bar — a test subtracts
exactly that list from the whole pane and asserts what is left is identical.

**Independent checks** (`scripts/test_one_chain_excerpt.cjs`: 55 tests — 21 inherited from
`registerTransportTests`, 1 from `registerBeatHoldTest`, 6 from `registerGrammarTests`, 26
scene-specific, 1 integration). Every arithmetic and Boolean invariant of the rejected
build's suite is kept verbatim (the chapter literals, the factor-of-two guard with its
0.168900 counterfactual, the frozen-stdout product, 0.338046 against 0.337801 with the
> 1e-5 gap, three-decimal agreement and the `Δw/10` shrink, the dial-turn scan holding the
kept values, the locals and the product to 1e-12 across more than twenty positions with
`data-forward = reference(liveW)`, the fifty-times nudge leaving the locals and the product
untouched, factors revealed only on their ray's arrival in order 3 → 2 → 1, the product
never before the measurement with more than a hundred lone-measurement frames,
deterministic seeking across the published `data-*` and the pane, static readouts equal to
`t = 40`). New: the displayed value at each node equals a real forward pass at the `w` the
nudge has delivered there and the nudge reaches `z`, `a`, `L` in order and is back to zero
by 25.0; the bar's height is `inc[k] × 8000` at every dwell (±1e-6) and the geometric mean
of its two ends at each hop's midpoint, it only ever moves right, fades during the return
and is hidden after it; ghosts and Δ labels are written 0 → 1 → 2 → 3 → 4 at 13.5 / 15.3 /
17.6 / 19.9 with heights in the ratios 2 / ≈0.205 / ≈0.826, dimming from 0.7 to 0.45 at
25.0; blame leaves only once `liveW == W0` and nothing else translates while it walks; the
needle angle is `−60 + (w − 0.68)/0.04 × 120` at every 0.1 s with the ghost needle hidden
iff `w == W0`; the holds at the default speed; the 27 spans are delimited TeX with the
macro colours and the `\class{oc-…}` wrappers, each unchanged at every 0.05 s of the
timeline, the wide and narrow formulas agreeing factor for factor; the CSS the player
toggles exists and is gated on `[data-ready]`; the captions are prose within twenty words
carrying `oc-w`, `oc-L`, `oc-a`, `oc-x`; the layout follows the pane width and only
`layout()` measures; a rewritten label is re-typeset through its box and only that label;
the moved fixture (`w = 0`, `x = 1`, `b = 0`, `y = 0.5`) rewrites at least ten labels and
leaves no stale 0.337801, 0.338046, 0.821899, 0.205500, 0.710950, 0.168879, 0.003380,
0.004093 or 0.020 anywhere in the pane, TeX included; and the SVG's own `<text>` carries
digits, dots and the withheld mark only.

**Fault injection.** 35 mutations, one at a time, each restored and byte-verified by
SHA-256 before the next (`inject.py` in the redesign scratchpad): **35 caught**. Among
them: half-squared error (29 tests fail); `∂L/∂a` dropping the 2 (23); a backward pass
that reads the live weight (the dial-turn scan); the measured slope replaced by the
analytic derivative (15); withheld values printed as zeros; a factor written at the beat
rather than on arrival; the product revealed before the measurement; a dial that never
turns; reduced motion left sliding (7); the bar's height interpolated linearly instead of
geometrically; the bar scale changed; a ghost written before its arrival; blame leaving
while the dial is still returning; the ghost needle never shown; the needle's angle
scale; a formula factor lit before its ray arrives; `render()` measuring the DOM; a layout
that ignores the pane width; TeX rewritten during playback (17); a stale hand-typed
literal in the `∂L/∂w` label (6 — the mount-time provenance check rewrites it, and the
static-versus-`t = 40` parity, the shipped-fixture `data-fixture-rewritten = ""` check
and the TeX-source checks all fail); a stale static frame; the stage strip reintroduced;
a caption over budget; the hold caption changed; a player that stops publishing
`data-stage`; `typesetPromise` called twice; `data-typeset` lying; the fixture check
skipped; formula dimming not gated on `[data-ready]`; the rejected build's orange; wide
and narrow formulas disagreeing; a beat moved; the reduced-motion bar not parked at `L`; a
ghost lifted off the line; and a second wine head per edge. One race worth knowing about:
the sweep mutates the scene files in place, so a test run started while it is running can
fail on a mutation it did not make; run it alone.

**Browser review** (headless Chromium against the rendered `_book`, `shoot-excerpt.mjs`,
2× device scale): 20 frames at 1280 × 1000 and 20 at 390 × 1000 covering every beat and
every hop midpoint, the nine beats under `prefers-reduced-motion: reduce` at 1280, and two
frames at 300 px. Every label is typeset (`mjx-container` in each `eq-one-chain-*` span;
`data-typeset="mathjax"`), no label is under the bar at any time, no Δ label touches a
ghost or a map, one wine head per edge, the console is empty at every width. Three things
only the rendered page showed, all fixed and re-shot: MathJax 4's inline line-breaking
split `x = 2  b = −0.5` in a 110-unit box (the box is 150 wide now); the two-row narrow
formula clipped the product at 390 px (three rows now) and its numeric row at 300 px
(0.8 rem below 340 px); and the narrow `Δa = +0.004093` label overflowed its box and lost
its Δ (the bare-increment spans above).

Frames: the redesign scratchpad's `after/one-chain/` — `one-chain-excerpt-w1280-t*.png`,
`one-chain-excerpt-w390-t*.png`, `one-chain-excerpt-reduced-w1280-t*.png`,
`one-chain-excerpt-w300-t*.png`.

**Not done here.** `scripts/audit_excerpt_fixtures.py` does not yet recompute this scene's
eleven derived literals in Python (checklist item 15 g of the design); the JSDOM suite
holds that claim, and CI runs it. The shared `.error-role` / `.target-role` values are
overridden in this scene's stylesheet rather than moved in the shared one.

## `gate-product-excerpt` (Chapter 10)

> **Rebuilt a second time, 2026-09-10.** The first rebuild (two bare belts of eighty valves,
> one wine packet seen twice, the terminal numbers written at the belt ends) was mocked and
> shown to the author, who rejected it: *"the human eye cannot visually process the difference
> between 10⁻²⁵ and 10⁻¹¹ … the bars vanish into empty tick marks after step 6, the viewer sees
> two nearly identical empty timelines rather than a massive 13-order-of-magnitude divergence."*
> The belts carried the *number* but no *ink* proportional to it. He asked for five things, and
> this build is all five as ONE picture, still under the visual grammar. Rows in the acceptance
> record below that name belts, plates, packets, ghosts, stations or measured ticks describe the
> earlier builds and are kept as history; the tests they cite were replaced by the ones listed
> here. (The very first build — stage strip, slider ruler, log chart with legend, readout chips,
> ledger — is two builds back.)

**The author's five fixes, and the mark each became.**

1. **Ratio badge, not exponent subtraction.** At step 80 a badge between the two endpoints reads
   `× 1.6 × 10¹³` with the words *sixteen trillion / times larger* — the largest number on the
   frame. It is the computed `(σ(1)/σ(0))^80 = 1.580 × 10¹³`, **not** the `10¹⁴` that subtracting
   the rounded exponents −25 and −11 gives; the test pins `1.58e+13` to three figures and the
   words to the same number. At the sweep's far point, `b_f = +2`, it recomputes to
   `× 4.7 × 10¹⁹`, *forty-seven quintillion*.
2. **One shared semi-log chart with a linear|log toggle.** Both curves `f^k`, `k = 0…80`, on one
   axis. The timeline shows LINEAR first (both curves plunge to the floor: *"On a linear axis
   both look dead by step eighteen"*), then switches to LOG at 18 s (a 0.6 s morph; two straight
   lines of slope −0.301 and −0.136 decades per step). From that beat on, and whenever playback
   is paused, two `aria-pressed` pills inside the plot let the reader flip the axis; the choice
   stands until the timeline itself changes axis.
3. **Signal-retention river.** Two colour bands under the chart, `k = 1…80`, one per bias, whose
   ink is the SAME mapping as the chart's `y`: linear ink `f^k` (the `b_f = 0` band is white from
   step 8, the `b_f = +1` band from step 18 — that is honest); log ink `1 + log₁₀(f^k)/25` clipped
   to [0, 1] with the floor `10⁻²⁵` stated on the axis, in the beat-4 caption and in the
   boundary. On that mapping the `b_f = 0` band fades to nothing exactly at 80 (ink 0.037) and the
   `b_f = +1` band keeps a clear tint all the way (0.565). Each cell's `fill-opacity` is the
   mapping, verified per cell in both modes.
4. **A concrete token.** The one moving object is the word `cat`, in input blue, entering at
   step 1 and travelling `k = 1 → 80` on BOTH bands at once, drawn with its band's ink at its
   position; under 0.05 it becomes the grey `· · ·` (the grammar's "unrevealed = ·", here "no
   longer legible"). At step 80 the top copy is `· · ·` and the bottom copy a faint but legible
   `cat` — legible **on the log mapping**, never "intact": the caption says *attenuated, not
   exactly zero* (the chapter's words, `10-sequences-rnn.qmd:552`) and *legible only on a log
   axis*; the boundary says the mapping in full.
5. **A bias slider.** A real `<input type="range">` for `b_f ∈ [−2, +2]`, step 0.05, ticks at
   −2, −1, 0, +1, +2, orange because `b_f` is the learnable parameter, with `b_f = +1.00 ·
   σ(b_f) = 0.731` live beside it. The timeline drives it (0 → +1 at 12–13.5 s; +1 → +2 → +1 at
   30–35 s) so a passive viewer sees the sweep; dragging pauses playback and everything — curves,
   river, word, endpoints, badge, band labels, readout, formula highlight — recomputes from the
   dragged value; any timeline action (play from a pause, a scrub, an arrow-key beat) resumes
   the timeline's own `b_f`. Arrow keys on the focused slider move `b_f` and are **not** seen by
   the pane's beat seeking. **This is an author-requested change to the shared contract** ("no
   extra parameter knobs"), recorded in `docs/animation-authoring.md` rule 1 as *"A scene may
   carry ONE parameter control when the mechanism IS that parameter's effect; the timeline
   sweeps it by default"*, and it needed one line of shared code: `interactives/shared/playback.js`
   now binds its scrubber as `[data-controls] input[type="range"]` (and the harness's
   `f.seek` the same), because a second range now lives in a pane.

**Question.** *A word enters at step 1 — how much of its gradient reaches step 80?* For the
whole first beat the chart is empty, both bands are white, the word waits at step 1 on each,
the slider sits at 0, and no number on the picture, in the caption or in the intro answers the
question. The endpoints carry **no text** until 24 s and the badge none until 25 s.

**The picture** (one inline SVG; the viewBox is the measured width by a fixed height — 400 px
wide, 462 px narrow — so one user unit is one CSS pixel and text keeps its size at every pane
width; the mock's fixed 1072-unit box would have shrunk 15 px labels to 10 px on the real
1280 px page, where the pane is ~713 px). Top: the chart, `k = 0…80` on `x`, `f^k` on `y`
(linear 0/0.5/1, or log `10⁰…10⁻²⁵` every five decades with `floor 10⁻²⁵` written at the
floor), the reference curve `f = σ(0)` dashed wine, the live curve `f = σ(b_f)` solid wine,
both traced by the word as it crosses its band; at `k = 80` two dots, their values
`8.27 × 10⁻²⁵` and `1.31 × 10⁻¹¹` in a right-hand column, a bracket, and the badge. Below: the
two bands with `b_f = 0 / f = 0.500` and `b_f = +1 / f = 0.731` at their left (orange / grey),
the word on each, and `step 1 … 80` under them. Under the SVG, in HTML: the slider row (label,
track spanning exactly the plot's `k = 0…80` — its grid columns are set from the same geometry
that draws the axis — tick labels, readout) and the one formula line. Nothing else: no legend,
no chips, no table, no stage strip.

**Fixture.** `interactives/manifest.json` records six literals Chapter 10 must keep verbatim,
at the digest in the authority table above (the chapter was not edited: `43aff04a…`, and
Appendix A3 `f45440cf…`). Five are unchanged from the earlier builds; the sixth is new.

| qmd lines | Literal |
|---|---|
| 419–424 | `@eq-lstm-highway` itself — the cell-chain gradient as a product of forget gates |
| 430–432 | "The practical corollary: *initialize the forget-gate bias positive* (say $+1$), so the cell starts life remembering by default." |
| 552 | "astronomically attenuated, not exactly zero" — the arrival caption's words |
| 555–557 | "A fresh LSTM's forget gates hover near $\sigma(0) = \tfrac12$, and $0.5^{80} \approx 10^{-24}$: a half-closed valve, compounded eighty times, is as fatal as no valve." |
| 588 | "The task-solving model (navy) holds its gates flat around 0.76 for all eighty steps" (the `fig-forget-gate-diagnostic` caption) |
| 588 | "The default-initialized model (orange), same architecture and data, hovers near $\sigma(0)\approx\tfrac12$ at about 0.56" (same caption) |

The anchor is the `#| label: fig-highway-time` cell at L461, under the prose "Watch what
that buys". The panel is the one in-repo mirror: `data-half="0.5" data-bias="1"
data-horizon="80" data-measured="0.76 0.56"` on the root, read by
`interactives/gate-product/player.js` and by `scripts/test_gate_product_excerpt.cjs`. The
slider's own markup (`min="-2" max="2" step="0.05"` and its five `<datalist>` ticks) is the
sweep's range: the timeline visits the slider's maximum and comes back, read from the markup.

**Derived witness** (all recomputed, never transcribed; three significant figures everywhere,
decision A3 of the earlier build stands):

| Quantity | Value |
|---|---|
| `σ(−2)`, `σ(−1)`, `σ(0)`, `σ(1)`, `σ(2)` | 0.119203, 0.268941, 0.5, 0.731059, 0.880797 |
| `σ(b_f)^80` at the five ticks | 1.27 × 10⁻⁷⁴, 2.36 × 10⁻⁴⁶, **8.27 × 10⁻²⁵**, **1.31 × 10⁻¹¹**, 3.89 × 10⁻⁵ |
| `(σ(1)/σ(0))^80` — the badge at +1 | **1.580 × 10¹³**, shown `× 1.6 × 10¹³`, *sixteen trillion times larger* |
| `(σ(2)/σ(0))^80` — the badge at +2 | 4.70 × 10¹⁹, shown `× 4.7 × 10¹⁹`, *forty-seven quintillion times larger* |
| log ink at `k = 80` | `b_f = 0`: 0.037 (fades to nothing exactly at 80); `b_f = +1`: 0.565 (a clear tint) |
| linear ink below a screen's least tint (1/255) | `b_f = 0` from step 8 (0.5⁸ = 0.0039); `b_f = +1` from step 18 (0.731¹⁸ = 0.0036) — the two linear captions' numbers, computed |
| `0.5^12`, `0.731^20` (transcript) | 2.44 × 10⁻⁴, 1.90 × 10⁻³ |
| `log10(σ(1)^80 / 0.5^80)` | 13.1986 → **13 orders of magnitude** (`data-orders`) |
| `0.76^80`, `0.56^80` | 2.92 × 10⁻¹⁰, 7.16 × 10⁻²¹ — computed in the test, printed nowhere |

**Where 8.27 × 10⁻²⁵ is printed.** Unchanged: Chapter 10 prints only `$0.5^{80} \approx
10^{-24}$`; the value is printed in `chapters/appendices/a3-precision-performance.qmd` L325 as
`$0.5^{80}=8.27\times10^{-25}$`, and the string at the reference endpoint is literally the
appendix's. Both roundings are computed (`round(log10)` and three figures) and bound to the
file that prints each; the attribution ("the number the chapter rounds to 10⁻²⁴ and Appendix A3
prints exactly") now lives in transcript item 5, because the arrival caption's twenty words are
spent on the ratio and on "not exactly zero".

**Honesty notes** (what the panel says, in the caption, the boundary or the transcript, so the
picture cannot be read as more than it is):

- *The log mapping.* The chart's log axis and the bands' log ink share a floor of `10⁻²⁵`; the
  ink is `1 + log₁₀(f^k)/25` clipped to [0, 1]. The floor is on the axis (`floor 10⁻²⁵`), in
  the beat-4 caption (*"On a log axis (floor 10⁻²⁵) the slopes differ"*), in transcript item 4
  with the formula, and in the boundary with the formula. A `b_f = −1` drag puts the live
  endpoint on the floor while its label still prints the true `2.36 × 10⁻⁴⁶`.
- *"Not exactly zero", never "intact".* At step 80 the `b_f = +1` word is legible **on the log
  mapping**; its gradient is `1.31 × 10⁻¹¹` of what entered. The arrival caption: *"Sixteen
  trillion times larger, yet 10⁻¹¹ of the gradient: attenuated, not exactly zero. Legible only
  on a log axis."* (19 words; the ratio words and the `10⁻¹¹` are computed). The boundary:
  *"legible on that mapping, not intact"*. A test asserts the panel never says "intact" of the
  word's arrival.
- *A different quantity, not conflated.* The figure above (`fig-highway-time`, L462) measures
  the gradient **norm at lag 60, at initialization, for this LSTM against a vanilla RNN** —
  "attenuated but alive, about ten orders of magnitude stronger". That is a measurement of a
  different quantity from the analytic `f^k`; the boundary names it as such and reproduces
  nothing from it. The diagnostic's mean gates 0.76 / 0.56 are quoted in the boundary as the
  chapter's measurement of trained gates (means over units and probes, one task and one seed
  each) and are never drawn and never raised to the eightieth power; `f` never visits either
  on the timeline or on the slider's grid.
- *The captions' step numbers are computed.* "By step eight the gradient is already invisible"
  and "both look dead by step eighteen" are the first steps at which linear ink falls below
  1/255, computed from the mapping — not the brief's eyeballed "twelve" and "twenty" (both of
  which were also true, but looser than the picture). The word blanks at a different
  threshold, ink .05: step 5 on the `b_f = 0` band and step 10 on the `b_f = +1` band; the
  content-time table below uses those two numbers, and a test reads both from the timeline.
- *The glide is finished at the beat.* The linear → log glide occupies the 0.6 s *before* 18 s,
  with the curves, the band ink and the axis labels (both sets, cross-faded) following one
  `mix`, so the frame an arrow-key seek lands on — exactly 18.000 s, paused — is the finished
  log picture the beat's caption describes. An earlier cut started the glide *at* 18 s and drew
  the axis in log from the first frame, so that landing frame showed linear curves and
  near-white bands under log labels and a caption about slopes differing.

**Declared computed variants** (recorded in the manifest, repeated here): (1) `0.5^80` and its
two roundings, with the appendix provenance; (2) `σ(1)` and `σ(1)^80`, derived from the
declared `+1`; (3) the ratio badge `1.580 × 10¹³` / *sixteen trillion*, and the `10¹⁴` trap;
(4) the five slider ticks' `σ` and `σ^80`, the continuous sweep, and `b_f` as the one parameter
control; (5) the log ink mapping and its floor as a drawing choice, with "not exactly zero";
(6) the measured means quoted and never drawn, and the figure's "ten orders" named as a
different quantity; (7) the 13 orders counted, not typed.

**The formula** (one line under the slider, typeset by the page's MathJax; TeX never
rewritten; the brief's line):

```
\residualpart{\frac{\partial L}{\partial c_{t-k}}} \;\approx\;
\class{gp-fk}{f^{\,k}}\,\residualpart{\frac{\partial L}{\partial c_{t}}},
\qquad f=\sigma(\class{gp-bias}{\parameterpart{b_f}})
```

One span, `eq-gate-product-1` (it stays one line at 390 px). `.gp-fk` starts at opacity .3
and lights at 4 s, once a word has been traced across a band; `.gp-bias` lights at 12 s, once
the slider has moved — or the moment the reader drags it. `data-formula-lit` publishes the
state (`""`, `gp-fk`, `gp-fk gp-bias`).

**Content time** (40 s; `data-duration="40"`, `data-beats="0 4 12 18 24 30 36"`, mirrored in
the manifest and checked against the markup by the fixture audit). Every caption is ≤ 20 words,
`b_f` is orange in it, and it is written only when it changes:

| # | t | axis | b_f | what moves (and only this) | caption |
|---|---|---|---|---|---|
| 1 | 0–4 | linear | 0 | nothing: chart empty, both bands white, `cat` at step 1 on each, slider at 0 | A word enters at step 1. How much of its gradient reaches step 80? (13) |
| 2 | 4–12 | linear | 0 | the top `cat` travels `k` 0 → 80 (10 steps/s); the dashed curve is its trace; cells paint as it passes; it turns to `· · ·` at step 5 (ink .031) | b_f = 0: the valve rests half open. By step eight the gradient is already invisible. (16) |
| 3 | 12–18 | linear, gliding to log over its last 0.6 s | 0 → +1 (12–13.5 s), then hold | the slider slides, `f = 0.731` and the label update; the bottom `cat` travels 13.5 → 18 s and the solid curve traces it; it is `· · ·` from step 10 (ink .044), and under a screen's least tint from step 18 — the caption's number, a different threshold; from 17.4 s the axis glides linear → log — the curves straighten, the bands re-tint, the two label sets cross-fade, all with one `mix` — so the glide is complete exactly at the beat | On a linear axis both look dead by step eighteen. (9) |
| 4 | 18–24 | **log** (finished at 18 s) | +1 | nothing: the log picture is complete on the beat's first frame — an arrow-key landing shows two straight lines, both bands re-mapped, the bottom `cat` back (ink .565), the top still `· · ·` (.037) — and holds | On a log axis (floor 10⁻²⁵) the slopes differ: the gap grows every step. (13) |
| 5 | 24–30 | log | +1 | endpoint dots + labels (24 s), bracket + badge (25 s); held 5 s | Sixteen trillion times larger, yet 10⁻¹¹ of the gradient: attenuated, not exactly zero. Legible only on a log axis. (19) |
| 6 | 30–36 | log | +1 → +2 (30–32.5) → +1 (32.5–35) | the slider sweeps; live curve, bottom band, its word, `f =`, the endpoint label, the badge (`× 4.7 × 10¹⁹` at +2) and `σ(b_f)` recompute per frame; the reference curve and band do not move | Drag b_f yourself: the valve's resting position decides what survives. (11) |
| 7 | 36–40 | log | +1 | nothing | (the beat-5 sentence) |

While the reader holds the slider the caption is the beat-6 sentence (true at every `b_f`);
the numbers are on the picture and in the slider's `aria-valuetext` (*"b_f = +2.00, σ(b_f) =
0.881; after 80 steps 3.89 × 10⁻⁵, forty-seven quintillion times the b_f = 0 value."*).

**Interaction contract.** *Toggle:* enabled from beat 4 and whenever paused (a microtask after
each render reads the transport's published `data-playing`); disabled while playing before
beat 4; flips `data-mode`, and chart `y`, band ink and word opacity all re-render from one
`ink(k, mode)`; the reader's choice stands until the timeline's own axis changes (the
glide's midpoint, 17.7 s) and is published as `data-mode-override`. *Slider:* `input` → read the value, pause
through the transport's own button if playing, set the override, re-render at the same time;
the override shows the complete picture (both traces to 80, endpoints, badge) in the current
axis mode; published as `data-override="slider"`; dropped by any change of time, by a scrub
(even to the same time), by Play from a pause and by Space/K/arrow keys on the pane. The
slider's value follows the timeline at rest (`0, +1, +2, +1` at 0 / 13.5 / 32.5 / 40 s).

**Reduced motion** — the same picture at each beat with the word jumped to the beat's end
position, the slider at the beat's value, the axis at the beat's mode; the sweep beat holds the
slider's **maximum** (+2) so a reduced-motion reader sees the third state, and beat 7 returns
to +1. One drawn state per beat interval (`registerBeatHoldTest` walks every 0.05 s); no morph.

| Beat | axis | b_f | top word | bottom word | endpoints + badge |
|---|---|---|---|---|---|
| Ask | linear | 0 | step 1 | step 1 | — |
| Half open | linear | 0 | `· · ·` at 80 | step 1 | — |
| Bias +1 | linear | +1 | `· · ·` | `· · ·` at 80 | — |
| Log axis | log | +1 | `· · ·` | `cat` (.565) | — |
| Arrival | log | +1 | same | same | on |
| Sweep | log | **+2** | same | `cat` (.824) | on, `× 4.7 × 10¹⁹` |
| Hold | log | +1 | same | `cat` (.565) | on, `× 1.6 × 10¹³` |

Published `data-bf ∈ {0, 1, 2}` and `data-top-k / data-bot-k ∈ {0, 80}` under reduced motion;
the unreduced timeline visits more than 20 intermediate `b_f` and more than 30 distinct `k`.

**Palette.** Colour = meaning, the same value on the picture, in the formula and on the caption
word: the gradient signal — both curves, both bands, the endpoints, the bracket and the badge —
is wine `#722F37` (`\residualpart{}`); `b_f` and only `b_f` — the two band labels, the slider,
its readout, the caption's `b_f`, `\parameterpart{b_f}` — is orange **`#C05621`**, the value
`\parameterpart{}` uses in `mathjax-config.html` (the mock's `#B45309` is the wave-1 brief's
value; grammar rule 4 fixes the colour to the macro); the word `cat` on the picture and in the
intro is input blue `#2B6CB0` (`\featurepart{}`), and the legible word sits on a white halo (a
3 px stroke painted under its glyphs, `paint-order: stroke`) so the blue at ink *a* is read
against white at ink *a*, not against wine at the same ink — blue on wine is nearly isoluminant
and, bare, got *harder* to read as the gate opened (1.43:1 at `b_f = +1`, 1.05:1 at `+2`, by
the picture's own compositing); with the halo the contrast rises with the ink (2.83:1 → 4.45:1),
which is what more ink should mean; axes, ticks, step marks, `f = …` labels and
the blank `· · ·` are greys; the toggle is the book's emphasis ink. The two bands share one hue
on purpose: the *extent* of ink is the comparison, not a colour code. No green or purple
appears; a test asserts orange only on the two band labels, blue only on the word, and none of
the other macro or shared-role hexes on the picture or in `player.css`.

**Element contract** (what the tests read). `[data-mark="axes"]` with `data-mode`, `[data-tick=
"x|y"]`, `[data-grid]`, `[data-mark="floor"]` (log only), `[data-mark="y-title"]`, `[data-mark=
"k"]`, `[data-axis-labels="linear|log"]` (one group, or both cross-faded by `opacity` while
the glide runs); `[data-mark="curve-ref"]` and `[data-mark="curve-live"]` paths with `data-k`;
`[data-mark="end-ref"]` (a hollow ring) / `[data-mark="end-live"]` (a filled dot) circles, on the
curves' last points; `[data-value="end-ref"]` /
`[data-value="end-live"]` texts (in the right column wide, inside the badge strip narrow);
`[data-mark="bracket"]` (only while the endpoints are ≥ 2 px apart); `[data-mark="badge"]` group with `data-ratio`, `[data-value="ratio"]`
and `[data-words="1|2"]`; `[data-band="0|1"]` groups with `data-f` and `data-mode`, `[data-cell=k]`
rects with `data-ink` and `fill-opacity` (a cell with ink ≤ 0.004 is not drawn),
`[data-band-label]` (orange) and `[data-gate-label]` (grey), `[data-token]` with `data-k`,
`data-ink` and `data-blank` when `· · ·`, and the halo `paint-order="stroke" stroke="#fff"
stroke-width="3"` whenever it is the word; `[data-step]`; static only, `[data-static-frame="narrow"]`
with `data-width`, `data-height` and its `transform`, removed on mount. HTML: `[data-bias-slider]`,
`[data-bias-readout]`, `[data-axis-toggle] button[data-axis][aria-pressed]`. The root publishes
`data-stage/mode/morph/bf/f/retention/ratio/top-k/bot-k/override/mode-override/floor/anchors/
orders/bias-set/formula-lit/layout/typeset`.

**Layout rules.** `geometry(W)`: wide (≥ 600 px) — plot `x` 108 … `W − 6 − badgeW − 120`
(badge 166 wide at ≥ 900 px, 150 below), `y` 28 … 250; endpoint labels start 10 past the plot,
part to a 16 px gap when the dots come within a line of each other and are kept above the
axis name; the reference endpoint a hollow ring (r 5.5, wine stroke) and the live one a filled
dot (r 4), each exactly on its curve's last point and never offset, so two endpoints at one
height are still two marks; the bracket in the right column, drawn only when the two endpoints
are ≥ 2 px apart (coincident endpoints — a linear axis, or a drag to `b_f = 0` — would collapse
it to a 6 px dash beside the ratio; a drag to `b_f = −1` leaves the live dot 8 px below the
reference on the floor, a gap the reader can see, and keeps the bracket); the badge vertically
centred between the endpoints and clamped above the bands; bands at `y` 300 and 346, 32 tall,
labels right-aligned at 84; fonts 15/13/12, word 16 on a 3 px white halo, badge 27/12.5. Narrow (< 600 px) — plot `x` 40 … `W − 22`
(22 px kept for the axis name `k`), `y` 24 … 200; endpoint dots only; the badge a full-width
strip under the chart carrying a third line `8.27 × 10⁻²⁵ → 1.31 × 10⁻¹¹`; bands at 344 and
412, 28 tall, labels above each band; the `y`-title start-anchored at the left edge; fonts
12/10, word 13, badge 26. The toggle is placed at the plot's top-right and the slider's grid
columns at the plot's `x0 / width` from the same geometry, in `layout()`; `render()` never
measures. A test walks eight widths (211 … 1280) × twelve times and requires every label inside
the picture, no two labels on one line overlapping (by the same arithmetic advance), the badge
beside (wide) or under (narrow) the plot and above the bands, every cell inside its band, and
the HTML controls on the plot's geometry.

**Static fallback.** `panel.html` ships the Hold frame as static SVG inside `<g data-drawing>`
between `static-frame` markers, written by `node scripts/render_static_frames.cjs gate-product`
— **twice**: the wide layout drawn at 713 units, the figure width a 1280 px page gives, in the
svg's own viewBox (`0 0 713 400`, `preserveAspectRatio="xMinYMin meet"`), and the same frame in
the narrow layout at 296 units, the figure a 390 px phone gives, inside a second group
`<g data-static-frame="narrow" data-width="296" data-height="462" transform="scale(2.4088)">`
between `static-frame-narrow` markers (the script reads the wide width from the svg's viewBox
and the narrow width from the group, renders each with the harness at that width, and scales
the narrow print into the wide viewBox). The svg's CSS height is `auto` — it follows the
viewBox, so nothing is letterboxed — and the figure is a size container: below 600 px of
figure width (the player's own layout line) `player.css` hides the wide print, shows the narrow
one and sets the svg's aspect to `296 / 462`, so a script-free reader on a phone sees the narrow
layout at its own 12–13 px type and a desktop reader sees the wide layout at one unit per pixel
(the earlier cut drew one 1100-unit frame into a fixed 400 px box: at 1280 it was scaled to
0.65 with 70 px of blank above and below, at 390 to 0.27 and unreadable). A browser without
container queries shows the wide print at every width; the player removes the narrow print
when it mounts, so the live pane is one drawing. Each print: the log axis, both curves, both
bands full, the endpoints `8.27 × 10⁻²⁵` / `1.31 × 10⁻¹¹`, the bracket (wide) or the strip
(narrow) and the badge `× 1.6 × 10¹³ / sixteen trillion / times larger`, the top `· · ·` and the
faint haloed `cat`; the slider at `+1` with its readout; the toggle at `log`; the TeX source of
the formula; the arrival caption; the SVG `<title>` and `aria-label` composed by the player from
the fixture. The slider and toggle are `visibility: hidden` until the player mounts (inert
controls are not exposed; their space is reserved so nothing jumps). A test regenerates both
prints and pins the committed markup to them; another compares every no-script readout —
drawing, caption, viewBox, title, endpoints, badge, slider value, readout, `aria-valuetext`,
`aria-pressed` — with the `t = 40` render at 713 px; a third pins the narrow print to the
296 px render and requires it gone once the player has mounted.

**Deliberately not kept** from the previous build: the belts, plates, packets, ghost stations,
the `k = n` counter, the measured ticks (no beat for them among the five fixes; the means are
quoted in the boundary instead), the two-span formula with the `\prod` (the brief's one line
replaces it), the Count-to-80 caption's Appendix A3 attribution (moved to the transcript). Not
imported from the mock: its `#B45309` orange and its fixed 1072-unit viewBox. The chapter's
`fig-highway-time` gradient-norm measurement is not reproduced; framework defaults
(`forget_bias=1.0`) and the Gers (2000) / Jozefowicz (2015) history stay out of the panel — the
manuscript owns meaning, and a paragraph is proposed to the author separately.

**Teaching boundary** (in the panel, tested). Real gates vary from unit to unit and from step
to step; the chapter writes ≈, not =, and the panel makes the same approximation on purpose —
one constant `f`, multiplied 80 times. Nothing here is trained, and nothing here is a claim
about training. The log floor and the ink formula; legible on that mapping, not intact;
attenuated, not exactly zero, the chapter's own wording. The figure above measures a different
quantity. The diagnostic's means are the chapter's measurement of trained gates. What shows
that the bias matters is the recall experiment — 24% / 26% / 26% against 100% / 100% / 100% —
bound to the committed freeze of the chapter's own cell.

**Round-1 review, fixed in place (2026-09-10).** Thirteen findings from the verify/skeptic round, all
fixed in this build and each pinned by a test: **V1/R2-2** the static fallback was one 1100-unit
frame forced into a 400 px box (letterboxed at 1280, unreadable at 390) — now two prints at
713 and 296 units, `height: auto`, chosen by a container query; **V2** the word's blue at ink
*a* on wine at ink *a* was nearly isoluminant and got harder to read as the gate opened — a
white halo under its strokes; **M1** the badge printed "undefined hundred trillion" whenever
the two-figure lead reached four digits (reached on the timeline's own sweep) — the words are
now the ratio to two figures against its thousands group, "five point three trillion", and a
test drags all 81 slider steps and seeks every hundredth of a second of the sweep beat in both
layouts; **m1** "one orders of magnitude" — singular; **M2/V5** the arrow-key landing at
18.000 s drew linear marks under log labels — the glide now runs 17.4–18 s with cross-faded
labels and is complete at the beat, and a test checks axes, bands and the recovered mapping
agree at every beat ± 1 ms; **V6** the bracket collapsed to a 6 px dash on a linear axis —
drawn only when the endpoints are ≥ 2 px apart, the reference dot hollow (the −1 stub is kept:
8 px apart is a gap the reader sees, and the dots are never offset from the curves); **T1**
every narrow-layout string (strip ratio, words, endpoints, band and gate labels) was unasserted
— the ratio-badge, five-ticks, drag and four-figure checks now run at 300, 713 and 1100 px;
**T2** the live endpoint's dot, label, bracket and badge box are now checked against the
curve's own last point at every tick and drag; **T5** the picture's `aria-label`, the badge's
`data-ratio` and every group's `data-mode` are pinned under drags and toggles; **V3** the
prose `f^k` (five places) is wrapped so its superscript clears the italic *f*; **m2** the
beat-3 row above conflated the word's blank threshold (step 10) with the caption's (step 18);
**R2-3** the backlog's stale "no gate control" contract is rewritten. The verifier's tree state
finding (**R2-1**) was a leftover fault injection in the shared work tree, restored from the
rendered copy before this round began.

**Independent checks** (`scripts/test_gate_product_excerpt.cjs`: **59 tests** — 21 inherited from `registerTransportTests`, 1 from `registerBeatHoldTest`, 6 from `registerGrammarTests`, 30 scene-specific, 1 integration; the whole suite **294 passing, 0 failing**). Kept from the
earlier builds, exactly: the declared attributes reproduce the chapter literals; `σ(1)` derived
(`0.731059`); `0.5^80 → 8.27e-25` and `σ(1)^80 → 1.307e-11` on the floats; the appendix binding
and Chapter 10's non-printing of `8.27`; the intro carries no spoiler (now including
"trillion"); both roundings computed and bound to the file that prints each, the transcript
carrying both; `data-retention === Math.pow(f, 80)` at every 0.05 s with more than 40 distinct
`f`; monotone in `f`, strictly across the opening, the `log10` ratio `13.1985738706`; the
measured products `2.918e-10` / `7.162e-21` on the floats, `0.76 > σ(1) > 0.56`, `f` never at
a measured level; reduced motion quantised; deterministic seek over 20 probes including the
published `data-*` and now including drags between probes; the boundary phrases; moving the
fixture moves every number (the reference band's bias is now *derived* — `logit(0.9) = +2.2`)
and leaves no stale one; the formula's TeX identical at every 0.05 s; the class toggles planted
in JSDOM; captions ≤ 20 words with `b_f` alone in the orange span. Added, one per item the
brief lists: the ratio `1.58e+13` to three figures, its badge text and words, the exponent 13
not 14, and its presence in transcript, title and slider name; `σ` and `σ^80` at the five ticks
driven through the slider, with the readout, the endpoint label, the `aria-valuetext` and the
transcript at each; both curves parsed back through the drawn axis and equal to `f^k` in both
modes at three widths, with the log slopes −0.301 / −0.136; every band cell's ink equal to the
mapping in both modes, cells absent exactly when ink ≤ 0.004, the word's opacity equal to its
band's ink at its cell (blank under .05), the 0.037 / 0.565 values at 80; the linear captions'
"eight" and "eighteen" equal to the computed 1/255 thresholds; the linear → log switch and the
0.6 s morph; the toggle flipping chart and river together, `aria-pressed`, enabled/disabled
per the rule, standing across seeks and yielding at 18 s; a drag pausing, taking over,
recomputing every mark from `σ(+2)` (curve, cells, word, endpoint `3.89 × 10⁻⁵`, badge
`× 4.7 × 10¹⁹` / *forty-seven quintillion*, labels, readout, formula) while the reference
marks do not move, a drag in the ask beat showing the answer, `b_f = 0` giving `× 1`, a seek
restoring the timeline's picture byte for byte, Play and Space resuming the timeline's `b_f`,
clamping, and the same under reduced motion; arrow keys, Home/End and Space on the slider
neither captured nor seeking while the same keys on the pane still do, the transport's and
the harness's scoped scrubber selector; the one-parameter-control contract (two ranges, one in
the bar, no third action, the timeline's `0 / +1 / +2 / +1`); two figure heights; label
extents and the HTML controls' placement at eight widths; every scientific number in the
static panel one of the computed set (five ticks, their ratios, `0.5^12`, `0.731^20`), the
measured products printed nowhere; endpoints and badge absent before their beats, no zero, no
dot but the blank word; the static fallback's slider/toggle/readouts equal to `t = 40`; the
integration test now also requiring the manifest's ratio, mapping and amendment variants and
the contract's amendment sentence.

**Fault injection.** 24 single-line mutations, applied one at a time to `player.js`,
`panel.html`, `manifest.json` or `shared/playback.js`, the scene suite run after each, the
file restored and its SHA-256 checked before the next (driver in this session's scratchpad,
`gate2/work/faultinject.py`; log beside it). **23 caught, 1 escaped, and the escape was
acted on.** Caught, with the first failing test named: the badge computed from rounded
exponents (the 10¹⁴ trap) — *ratio badge* + 6 more; the readout at two decimals — *five
ticks*; curve points not `f^k` — *curves*; log ink with the wrong floor — *river*; the
toggle ignored — *toggle*; a drag that sets nothing — *drag*; slider keys captured —
*arrow keys*; the word's opacity not its band's ink — *river*; the arrival caption at 21
words — *captions* (and the grammar suite); the words disagreeing with the number ("fifteen
trillion") — *ratio badge*; reduced motion without the sweep's far point — *reduced
motion*; the bias lit before the slider moves — *formula parts*; the static frame edited by
hand — *static frame*; manifest beats drifting — 7 tests; the transport binding the first
range in the pane (the slider) — 32 tests; no morph — *linear → log*; the caption's
threshold changed (1/100) — *step numbers*; endpoint labels to four figures — *anchors*
and 5 more; "not exactly zero" softened — *captions*; a scrub no longer dropping the drag —
*class toggles*; the reference band's bias typed as 0 instead of derived — *moved fixture*;
band cells drawn at a coarser threshold — *river* and 4 more; the published ratio not the
retention over the reference — *five ticks* and 3 more. **Escaped:** removing the
`time !== lastTime` rule in `render()` that also dropped the drag on a change of time —
because every timeline act (a scrub, an arrow-key beat, Play or Space from a pause) already
drops it in a listener that runs before the transport redraws, and a drag while playing
pauses first, so the running clock never carries an override. The rule was dead code; it
was removed and the comment says why. Negative control: the unmutated tree is 59/59.

**Browser review** (Playwright headless Chromium against the rendered `_book` on :8777,
`gate2/work/shoot.mjs`, device scale 2; frames in `gate2/after/`, 32 of them, **every one
looked at**): at **1280 px**, t = 2, 6, 9, 13, 16, 18.3, 21, 24.5, 27, 33, 35, 40, plus 27 s
with a drag to +2, a drag to −1 and the linear toggle, and reduced motion at 27 and 33 s; at
**390 px** the same twelve times, a drag to +2, the linear toggle, and reduced motion at
33 s (crops of the pane beside them). Opens paused at the anchor; `mjx-container` in the
formula span with the book's wine and orange; no page errors reported by the shoot script.
At 1280 the picture is the mock beat for beat — the reference curve traced by the word, the
band painting behind it, the mid-slide `b_f = +0.75 / f = 0.679`, the 18.3 s morph with both
curves half-straightened, the two straight lines, the endpoints, the bracket and the badge,
the sweep's `× 1.8 × 10¹⁹ / eighteen quintillion` at 33 s, the slider following the timeline
and the readout beside it; at 390 the badge strip carries the endpoints and the bands sit
under it with their labels above them. Eight defects the first frames surfaced, all fixed and
now tested: the toggle pills rendered at the page's type size because an invalid `font:`
shorthand was dropped whole (longhands now); the mid-slide label `b_f = +0.75` ran off the
left edge at 600–713 px (the label column is 84 wide, the plot starts at 108); the badge's
number would not fit a 150-px badge at 713 px (one badge width, 166, and every badge line
shrinks to fit by the same advance the labels use); after a drag to −1, or the linear toggle,
the parted endpoint labels sat on the axis name `k` (both are kept above the axis line);
at 211 px the `y`-title ran off the left edge (start-anchored at the edge in the narrow
layout), the axis name `k` off the right (22 px kept for it), and the one-line badge words
over the strip (two lines, shrink-to-fit); and the narrow layout's reserved strip space was
tightened (bands at 344 / 412, height 462). One trait is deliberate and recorded rather than
fixed: in the narrow layout the strip's space under the chart is reserved from the first
beat, so beats 1–4 show a blank band there — the alternative, sliding the bands and the word
down when the badge appears, would move scenery mid-scene. A VoiceOver pass and native
fullscreen remain on the pending list, as for the sibling scenes.

## What Wave 1 changed outside the three scenes

**The transport: one selector.** No Wave 1 step changed `shared/controls.html` or
`shared/player.css`, and until the gate product's second rebuild none changed
`interactives/shared/playback.js` either; the diffs those files carry in the working tree
are the Part 1 polish, described in [the kernel/BERT receipt](kernel-bert-excerpts.md).
Every transport feature these scenes rely on — the declared duration reaching the scrubber
and clock, beat-aligned arrow seeking, `data-state` on the action buttons, the polite
caption region, the scrubber's `aria-valuetext` — already existed before the wave started.
The one change, made for the author-requested `b_f` slider (the one-parameter-control
amendment in `docs/animation-authoring.md`, rule 1): `playback.js` now finds its scrubber as
`[data-controls] input[type="range"]` instead of the first range in the panel, and the
harness's `f.seek` and its duration check use the same selector. A second range in a pane
can therefore never become the clock; every scene on the shared transport has exactly one
range inside `[data-controls]`, so nothing else moved (the whole suite passes unchanged for
the other five scenes). All three scenes declare `data-duration` and `data-beats` on their
pane and inherit the shared transport; each therefore gets all 21 `registerTransportTests`
checks with no scene-specific option beyond a static witness and a nested help anchor.

**The manifest** (`interactives/manifest.json`) gained three entries, one per scene, each
recording `id`, `scene`, `qmd`, `anchor` (`{type: after-cell, target: cell-<label>}`),
`filter`, `transport: shared`, `duration`, `beats`, `fixture: {literals, computedVariants}`
and `receipt: docs/wave1-excerpts.md`. It now indexes six scenes across six chapters, with
27 verbatim literals and 19 declared computed variants (the gate product's second rebuild
added its "not exactly zero" literal and rewrote its variants). It stays repository build data —
read from the project directory by the Lua filter, the fixture audit and the interaction
suite — and is deliberately **not** listed under `_quarto.yml` `resources:`; a test asserts
both halves of that decision.

**The manifest-driven filter.** `filters/mechanism-excerpts.lua` decodes the manifest with
`pandoc.json.decode` — the same call `filters/chapter-tools.lua` uses for
`scripts/notebook_manifest.json` — selects the scenes whose `filter` is itself and whose
`qmd` is the document being rendered, and inserts each exactly once at its declared anchor,
failing the build if an insertion point is absent or duplicated. `after-cell` inserts after
the Div with that identifier; `before-heading` inserts immediately before the level-2
heading with that exact text (built in Wave 1, first *used* in Wave 3). The shared
stylesheet is emitted once per document, each scene adds its own `<style>`, and
`shared/loader.js` is emitted once after the last panel in document order so it sees every
root on the page. Verified in the render: each of the three chapters carries the shared
`.mechanism-excerpt` rule exactly once and one panel id. Adding the three scenes required
**no edit to the filter at all** — the manifest entry was the whole registration.

**The scene template.** `interactives/_template/{panel.html,player.js,player.css,README.md}`
is the skeleton a new scene copies; nothing in it is rendered or published, because no
manifest entry names it. Its README names the four places a scene must be registered:
the manifest entry, the `_quarto.yml` resource line, its own test file, and the wave
receipt. All three scenes were started with `cp -R interactives/_template interactives/<scene>`
and none of them had to change anything in the template to fit.

**The test harness.** `scripts/html-tests/excerpt-harness.cjs` (test-only, 360 lines)
exports the JSDOM `fixture()`, the markup canonicalisers `canonicalMarkup`/`drawnMarkup`,
the per-scene rect `configure()`, the manifest accessors, and
`registerTransportTests(scene)` — 21 transport checks driven by the manifest's duration and
beats: static fallback and dead controls, load-on-open-once-and-never-autoplay, two direct
anchors (including the nested help disclosure), failed transport and failed scene with
retry, malformed load not reported ready, 1.5× default with fractional pause and replay,
deterministic scrubbing, keyboard isolation, pause on close/hidden/exit, expanded view
retaining time and exiting paused, native fullscreen exit and denial recovery, resize and
reduced motion never starting the clock, no `aria-pressed`, `data-state` flip on both
fullscreen paths, one declared duration reaching scrubber/clock/readout, arrow keys visiting
exactly the declared beats, every declared beat being a boundary the drawing crosses,
reduced motion holding each beat, the caption written once per change, and the scrubber
naming the state without repeating the caption.

**The fixture audit.** `scripts/audit_excerpt_fixtures.py` runs in the manuscript-contract
step of both the publishing and the execute-audit workflow, ahead of any render. It failed
closed on a half-registered scene when that was tried deliberately during the softmax step.
It now covers 6 scenes / 26 literals / 16 variants / 3 receipts, and with
`--lecture-tree <path>` re-verifies 14 recorded lecture digests.

**`scripts/html-tests/package.json`** gained the three new test files in its `test` script.
That, plus the three `_quarto.yml` resource lines, is the entire footprint of the three
scenes outside their own directories, their own test files, the manifest and this receipt.

## Integration and format boundary

`filters/mechanism-excerpts.lua` keeps
`if not FORMAT:match("^html") then return {} end` as its **first executable line**, so
every non-HTML format gets an empty filter and the PDF is untouched. A test in each scene's
suite asserts that line's position, and a fault-injection mutation that displaces it fails.

`_quarto.yml` adds exactly three lines under `project.resources` —
`interactives/softmax-shift/player.js`, `interactives/one-chain/player.js`,
`interactives/gate-product/player.js` — and nothing else. No new `filters:` entry is needed;
the manifest-driven filter already runs for every chapter. Confirmed in the render: each
scene publishes **only** `player.js` under `_book/interactives/<scene>/`; `panel.html`,
`player.css` and `manifest.json` stay in the project directory, and `_book/interactives/shared/`
still publishes only `playback.js` (the loader and stylesheet are inlined by the filter).

**Pandoc → LaTeX, with and without both filters, is byte-identical for all three chapters.**
Re-run while writing this receipt:

| Chapter | LaTeX bytes, with filters | without filters | Result |
|---|---|---|---|
| `chapters/part1/02-logistic-softmax.qmd` | 23,244 | 23,244 | byte-identical |
| `chapters/part1/05-backpropagation.qmd` | 40,162 | 40,162 | byte-identical |
| `chapters/part3/10-sequences-rnn.qmd` | 54,868 | 54,868 | byte-identical |

That local-preview check is **not** a full PDF build. The full rebuild and page-count
comparison against the pre-wave artifacts remain pending; see below.

`quarto render --to html --no-clean` on the committed freeze exits 0 and does not re-execute
any cell. Chapters 7, 12 and 15 — the three already-shipped scenes — come out **byte-identical**
to the pre-wave snapshot, checked with `cmp`. No exercise, required claim, numbered figure,
notebook, frozen stdout, PDF setting, or release tag changes.

## Commands to reproduce

```sh
export PATH="$HOME/.local/bin:$HOME/Library/TinyTeX/bin/universal-darwin:/opt/homebrew/bin:$PATH"
export QUARTO_PYTHON="$HOME/.venvs/dl-book/bin/python"
PY="$HOME/.venvs/dl-book/bin/python"

# Interaction suite (JSDOM; test-only dependencies)
npm test --prefix scripts/html-tests

# Manuscript and fixture contracts
"$PY" scripts/audit_excerpt_fixtures.py
"$PY" scripts/audit_excerpt_fixtures.py \
  --lecture-tree "$HOME/Library/CloudStorage/Box-Box/Teaching/6050/Video_lectures"
"$PY" scripts/audit_book_contract.py
"$PY" scripts/audit_plan_code.py
"$PY" scripts/audit_public_anchors.py
"$PY" scripts/audit_python_sources.py
"$PY" scripts/audit_frozen_stdout.py --base HEAD     # must stay 133 blocks / 27 units

# Render and serve
quarto render --to html --no-clean
python3 -m http.server 8777 --directory _book

# Chapter digests quoted in the authority table
shasum -a 256 chapters/part1/02-logistic-softmax.qmd \
              chapters/part1/05-backpropagation.qmd \
              chapters/part3/10-sequences-rnn.qmd \
              chapters/appendices/a3-precision-performance.qmd

# PDF byte-identity for one chapter (repeat per chapter)
quarto pandoc chapters/part1/02-logistic-softmax.qmd -t latex -o /tmp/with.tex \
  -L filters/mechanism-excerpts.lua -L filters/convolution-excerpt.lua
quarto pandoc chapters/part1/02-logistic-softmax.qmd -t latex -o /tmp/without.tex
cmp /tmp/with.tex /tmp/without.tex
```

`scripts/audit_html_assets.py` and `scripts/audit_notebook_exports.py` fail in a local
checkout because they look for notebooks and PDFs another CI job builds. That is
pre-existing and unrelated; nothing in their output names a Wave 1 scene.

## Acceptance record

**Tests: 240 passing, 0 failing** (`npm test --prefix scripts/html-tests`, 23.3 s), verified
while writing this receipt. Growth across the wave, as each step recorded it: 125 after the
Part 1 polish → 130 with the shared infrastructure → 163 after `softmax-shift` → 200 after
`one-chain` → 236 after `gate-product` → 240 with the review round below. The brief's stated
baseline of 125 is the pre-wave number; only the 240 and the per-file split below were
re-measured here. Re-measured again after the 2026-09-10 rebuild of `gate-product` to the
visual grammar: **287 passing, 0 failing**, of which `scripts/test_gate_product_excerpt.cjs`
contributes 52 (21 transport, 1 beat-hold, 6 grammar, 23 scene, 1 integration). Re-measured
a third time after the **second** rebuild of `gate-product` from the author's critique of
its mock (the five fixes, the same day): **294 passing, 0 failing**, of which that file now
contributes **59** (21 transport, 1 beat-hold, 6 grammar, 30 scene, 1 integration); before
the rebuild the tree stood at 287 with 3 failing, all three in the belt build's own suite
against its stale static frame. The per-file table further down is from the first rebuild
and is kept as history; only the total and the gate-product row moved (40 → 52 → 59).

**Review round.** Three findings from the pre-publication review are fixed in this tree, each
with the test that pins it:

| Finding | Fix | Test |
|---|---|---|
| The gate-product plot's "80 factors…" annotation was one unwrappable `<text>` of fixed length, centred in a viewBox that shrinks with the pane: below about 480 px it painted over the decade labels and out of the panel, and at 320 px off the screen. | `interactives/gate-product/player.js` wraps that sentence to the plot's own inner width — one line at desktop, two from 296 units, three at 226 — with an arithmetic advance estimate, so `render()` still measures nothing. | *gate-product: the product annotation is wrapped to the plot, at every width* (11 widths, an independent advance bound, both plot edges) |
| For the first three seconds of the softmax Hold beat the caption's live region said "Back at c = 0" while the readout beside it still printed `Shift c = 100.0` and the scrubber agreed with the readout. | `interactives/softmax-shift/player.js` gives the Hold beat two sentences and swaps on arrival; neither carries a number that moves inside the beat. | *softmax: the caption never says "back at c = 0" while c is still on its way* (801 sampled times; the caption's claim and the printed `c` are asserted to be one statement) |
| This receipt claimed the static panels were "byte-equal to the `t = 40` render", including "every class", where the tests compare an enumerated list of readouts. | The two sentences now say what is actually held, and name what only script adds. | *the static panel differs from the `t = 40` render only where script must add*, one per scene: it subtracts exactly the named list from the whole pane and asserts the remainder is identical |

**Second review round.** Five further findings, all fixed in this tree. Two were defects in
what the panels *say*; three were defects in what nothing *checked*.

| Finding | Fix | Test |
|---|---|---|
| **The gate-product caption typed its two headline attributions.** The Count-to-80 sentence computed `8.272 × 10^−25` and then wrote `10^−24` and `8.27 × 10^−25` as literals. Mutating either left the suite green: a wrong appendix rounding would have shipped silently. The *intro's* copy was bound, which is why the earlier sweep read as clean. | `interactives/gate-product/player.js` derives both: `order(v)` rounds `log10` to the nearest integer (the chapter's own claim) and `sci(ANCHORS[0][1], 2)` is the appendix's rounding. | *gate-product: the count beat attributes the number it reaches, in both roundings* — each rounding bound to the file that prints it, the caption read at the end of the count beat and across the whole beat under reduced motion, plus a sweep requiring every `d.ddd × 10^−dd` in the static panel to be one of the five values the scene computes |
| **The gate-product intro printed the answer to the panel's own question,** three lines above it and visible the moment the disclosure opens — and imported it from ~95 lines later in the chapter (`10-sequences-rnn.qmd:556` against the anchor at L461). The player withheld the same numbers as `·`; the prose gave them away. | The intro declares only the approximation it is making and points at the beat that earns the number; the attribution lives in the Count-to-80 caption and in transcript item 3. | the same test asserts the intro contains neither rounding nor `0.5^80` |
| **`softmax-shift` still animated inside two of its beats under reduced motion.** It computed `c` from `time` and quantised it into fifths of the shift, so the shift stepped 0→20→40→60→80→100 *within* beats 3 and 5. The harness's inherited check samples only `beat` and `beat + 0.01`, which a quantiser satisfies. | `player.js` derives `c` from the stage (`shiftFor(stage)`), the way `interactives/_template/player.js` prescribes and the other two scenes already did. | new `registerBeatHoldTest(sceneId)` in the harness — the whole reduced timeline at 0.05 s, exactly one drawn state per beat interval — called by all three Wave-1 scenes; and a rewritten scene test asserting `c ∈ {0, 100}`, one value per stage, in the order 0, 0, 0, 100, 100, 0 |
| **`interactives/_template/README.md` documented a receipt row the audit cannot parse.** Step 4 showed a *three*-column provenance row; `HASH_ROW_RE`'s `[^|]*` cannot cross a pipe, so only a two-column row matches. An author following the README verbatim would have got `<id>: <receipt> records no SHA-256 for <qmd>`. | The README shows the two-column shape and states the rule, with the reason `docs/animation-authoring.md:234` already gives. | *integration: the template README documents a receipt row the fixture audit can read* — it **extracts `HASH_ROW_RE` from `scripts/audit_excerpt_fixtures.py`** and evaluates the README's own example against it, so the document is bound to the tool rather than to a copy of it |
| **A stale height in a source comment.** `interactives/gate-product/player.css:49-50` said the figure "stays 258px at every width"; the figure is 266 everywhere in the shipped code, and 258 appeared nowhere else. A maintainer would have acted on the comment. | Both sentences name 266 and say where it comes from (`HEIGHT`, and the svg rule above). | *gate-product: one figure height — the CSS, the static viewBox, and every render agree*, which also requires every comment in that file that discusses the height to name that number and no other |

Fault injection for the five: 11 mutations, applied alone and restored with a SHA-256 byte
check. All 11 caught. The negative control was run too: with the new attribution test
deleted and the caption's typed literal restored wrong by one in the last place
(`8.27 × 10^−25 → 8.28 × 10^−25`), the suite reported **245 pass / 0 fail** — the escape
reproduces exactly, so the coverage claim rests on a measurement rather than on the fix
looking right.

**Browser re-check of the two visible changes** (headless Chrome 152.0.7977.83 over CDP
against a freshly rendered `_book` on :8777; frames in this session's scratchpad under
`wave1/fix-r2/shots/`):

- `gate-product` at **1280 × 900 and 390 × 900**, `t = 0`: the intro carries no rounding and
  no `0.5^80`; the ledger's "reaches step 80" column is `·` in both rows and both readouts
  are `·`; the panel opens paused at `0:00`. At `t = 19.5` s — the end of the Count-to-80
  beat — the caption reads *"Eighty multiplications by 0.500000 leave 8.272 × 10^−25 — the
  number the chapter rounds to 10^−24 and Appendix A3 prints as 8.27 × 10^−25."* and the
  `σ(0)` ledger row fills at the same moment. Console empty at both widths.
- `softmax-shift` at 1280 × 900 with `prefers-reduced-motion: reduce` emulated, 81 seeks
  across the whole timeline at 0.5 s: `c` takes exactly one value per stage —
  `{0: 0, 1: 0, 2: 0, 3: 100, 4: 100, 5: 0}` — and the shifted column arrives whole rather
  than sliding. Console empty.

Also re-run after these edits: `quarto render --to html --no-clean` (exit 0), the audit set
(`audit_book_contract`, `audit_excerpt_fixtures`, `audit_plan_code`, `audit_public_anchors`,
`audit_python_sources` all PASS), `audit_frozen_stdout.py --base HEAD` **unchanged** (133
blocks / 27 units — no `.qmd` was touched), and `quarto pandoc … --to latex` with and
without both filters, byte-identical for Chapters 2 and 10 at the receipt's own byte counts
(23 244 and 54 868).

**Observed and deliberately not changed** (author's call, recorded rather than fixed):

1. `kernel-weighting` and `bert-ledger` — the two players that shipped before this harness —
   **do not hold their beats under reduced motion** either. Measured with the same probe:
   kernel beats 5/6/7 render 11, 17 and 7 distinct states; BERT beats 2–7 render 4, 4, 4, 2,
   2, 2. That is why `registerBeatHoldTest` is opt-in rather than part of
   `registerTransportTests`: making those two hold is a change to two already-reviewed
   scenes, not a side effect of a test helper.
2. Under reduced motion the softmax caption still says *"The ruler slides with them"*, and
   the figure label still reads *"on a ruler that slides with c"*, where the ruler now
   arrives in one step. The load-bearing claim (the markers hold still, the bars stay on
   their dashed marks) is true in both modes, and the wording predates this pass — the old
   quantiser stepped too. Making the sentence mode-aware is a prose decision.

| Test file | Passing | Of which |
|---|---|---|
| `scripts/test_plan_result_disclosure.cjs` | 9 | unchanged by this wave |
| `scripts/test_responsive_tables.cjs` | 4 | unchanged by this wave |
| `scripts/test_convolution_excerpt.cjs` | 41 | unchanged by this wave |
| `scripts/test_mechanism_excerpts.cjs` | 77 | kernel + BERT, moved onto the harness, not rewritten; + the template-README row check |
| `scripts/test_softmax_shift_excerpt.cjs` | 36 | 21 transport + 1 beat-hold + 13 scene + 1 integration |
| `scripts/test_one_chain_excerpt.cjs` | 39 | 21 transport + 1 beat-hold + 16 scene + 1 integration |
| `scripts/test_gate_product_excerpt.cjs` | 40 | 21 transport + 1 beat-hold + 17 scene + 1 integration |
| **Total** | **246** | |

**Fault injection: 79 single-line mutations across the three scenes and their
infrastructure** (18 + 21 + 29 pre-review, plus 11 in the post-review pass), each applied
alone and restored with a SHA-256 byte check before the next. Every one made at least one
test fail *as the suite now stands*. The honest history is that **three escaped, not two**:
the softmax dashed-mark label, the gate-product Appendix A3 attribution in the intro — and,
found only in review, the *same* attribution in the gate-product caption, which the earlier
sweep never mutated because it was not in the set. All three are covered now; the third is
written up under that scene's fault-injection heading. One further escape is covered for
`one-chain` only, because it belongs in the *shared* harness (pending item 10). The
injection drivers live in this session's scratchpad, not in the repository.

**Audits, all re-run here: PASS.** `audit_book_contract.py`; `audit_excerpt_fixtures.py`
(6 scenes, 26 literals, 16 variants, 3 receipts, live anchors, one declared timeline each),
and again with `--lecture-tree` (14 lecture digests re-verified); `audit_plan_code.py`
(194 learner-visible Python surfaces); `audit_public_anchors.py` (10 interfaces);
`audit_python_sources.py` (285 cells); `audit_frozen_stdout.py --base HEAD`
(**133 stdout blocks across 27 baseline units, 27 HTML/TeX pairs matching, unchanged**) —
which is the standing evidence that no `.qmd` was edited.

**Browser widths inspected: 1280 × 900 and 390 × 844, all three scenes**, in real headless
Chrome 152.0.7977.83 driven over the DevTools protocol against `_book` on :8777. At both
widths, for all three: opens paused at its anchor; a plain visit fetches no scene asset;
no horizontal overflow; every control at least 44 × 44; arrow keys visit exactly the
declared beats; console empty, including under `prefers-reduced-motion: reduce`.

A note for whoever repeats this: the embedded browser-preview pane returned blank
screenshot captures throughout (JavaScript evaluation in it worked), and no browser
extension was connected, so every visual check was made by driving headless Chrome over the
DevTools protocol instead. Expect to do the same in this environment.

## Pending — what the author's review has to close

Nothing in this list is done. It is written as pending because it is pending.

1. **Author browser review.** This is the approval gate. `docs/animation-authoring.md`
   still says it "does not authorize additional scenes", and the note that authorizes Wave 1
   belongs in this file and does not exist. Nothing is committed or pushed; `HEAD` is
   `4a7ea95`.
2. **Widths 360, 320 and 300 px** were not inspected. The plan's acceptance clause asks for
   desktop, 390 and 300 px (and Part 1 checked 1280/390/360/320). Only 1280 and 390 were
   measured for these three scenes.
3. **Screen-reader spot check** was not attempted; no interactive macOS session was
   available. The captions are polite atomic live regions, withheld cells carry
   `aria-label="not revealed yet"` / `"not computed yet"`, and the scrubber's
   `aria-valuetext` never repeats the caption — all three are covered by tests, and none of
   that substitutes for a VoiceOver pass.
4. **Full PDF rebuild** and comparison with the pre-wave artifacts (548 two-sided / 519
   one-sided pages, no figure renumbering) has not been run. Only the per-chapter Pandoc →
   LaTeX byte-identity above.
5. **Native fullscreen for `gate-product`** (both rebuilds) was not exercised natively (headless Chrome
   refuses `requestFullscreen` even for a trusted gesture); only the denial path was. The
   `softmax-shift` and `one-chain` native paths were exercised. A human should confirm the
   third.
6. **Open decision E1** — the backward-arrow colour divergence between `fig-chain-graph`
   and the Chapter 5 panel. Option (a) ships unless the author says otherwise; see the
   blockquote in the `one-chain` section.
7. **Open decision E12** — timeline-driven sweeps are not user knobs. `c` in Chapter 2 and
   `w` in Chapter 5 still move on the timeline only, and each panel says so. For Chapter 10
   the author answered the question himself on 2026-09-10 by asking for a `b_f` slider: the
   contract now carries the one-parameter-control amendment (`docs/animation-authoring.md`,
   rule 1), the gate product is its one instance, and its tests assert the timeline sweeps
   the slider by default and that the pane carries no other control. **Closed for Chapter
   10; the other two scenes are unchanged and remain as they were.**
8. **Open decision E17 — closed.** Unicode-only text where the chapter sets real math was
   the first build's convention; the author's rejection ("non-LaTeX encoding") and the visual
   grammar's rule 5 replaced it. Every rebuilt panel's formula is now typeset by the page's
   MathJax with the book's macros (`docs/animation-authoring.md`, "Typeset math in a panel:
   the verified recipe"); the caret-and-parenthesis rendering this decision asked about no
   longer exists in any rebuilt panel, and the grammar suite rejects it.
9. **Wave 1 shared-infrastructure item 6 is not done.** `.parameter-role { color: #B45309 }`
   was never added to `interactives/shared/player.css`, and `one-chain` and `gate-product`
   define `.one-chain-parameter` and `.gate-product-parameter` locally instead. That was
   deliberate, not an oversight: a rule added to the shared stylesheet is emitted into
   Chapters 12 and 15 as well, and would break the byte-identity those two pages currently
   hold against the pre-wave snapshot. Promoting it properly needs a decision to re-baseline
   those pages.
10. **The shared harness's deterministic-seek check is weaker than it looks.**
    `registerTransportTests` canonicalises only the pane's inner markup, so state a player
    publishes on the *panel root* can drift with playback history undetected. `one-chain`
    now has its own whole-surface check; `kernel-weighting`, `bert-ledger`, `convolution`
    and `softmax-shift` are still exposed. This belongs in the harness, not in one scene.
11. **`audit_excerpt_fixtures.py` cannot bind a cross-chapter literal.** It checks
    `fixture.literals` only against `scene['qmd']`, and `gate-product` is the first scene
    whose printed witness lives in another file (Appendix A3). It is bound in that scene's
    test instead, and the provenance is declared in the manifest's `computedVariants`. If a
    second cross-chapter scene appears, the schema should grow
    `fixture.alsoIn: [{qmd, literals}]` and the audit should check and hash those too. Not
    patched here: four other scenes depend on the current contract, and that is
    infrastructure work, not a scene.
12. **Live verification after publication** — the `html_interactions` CI job green, every
    new `player.js` URL fetched, and each of the three live anchors opened paused — cannot
    happen until something is pushed.
