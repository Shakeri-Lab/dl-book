# Derivative gates: active forward, quiet backward

September 13, 2026. **Author-approved for publication.**
This is the next bounded scene after the author's approval of LayerNorm versus
BatchNorm, pushed as `e00d3c5`. The author requested a network-first redesign
after reviewing the earlier plot-first draft, then approved the network-first
version with “good. Push and do next.” Publication is limited to this scene and
its integration, tests and documentation. No manuscript, frozen evidence,
runtime contract or release tag changes.

## Source gate

Place `05-backpropagation.html#derivative-gates-excerpt` after `cell-fig-gates`.
Chapter 5 lines 28–43 define `a=sigma(z)` within the neuron; lines 512–570 own
the two activation derivatives and the activation-only
product argument. The `derivative-gates` cell uses `torch.linspace(-6, 6, 300)`,
`sig = torch.sigmoid(z)`, `sig * (1 - sig)` and `(z > 0).float()`. The prose gives the analytic quarter
maximum at zero, the PyTorch derivative convention at the ReLU kink, and ten
sigmoid factors. The panel mirrors only domain `[-6,6]`, samples `300`, and
maximum gate count `10`; the player derives all other quantities.

The even-sized source grid does not contain zero. Inspecting zero evaluates the
existing analytic function, rather than claiming the sampled plot attains its
maximum. Browser arithmetic evaluates the curve in double precision; the frozen
float32 plot and numerical stdout are neither replaced nor re-executed.

Independent SymPy verification through the `verify-math/verify.py` helper gives
the derivative `1/(4*cosh(z/2)**2)` and the identity
`sigma(z)*(1-sigma(z)) = 1/4 - (sigma(z)-1/2)**2`. Therefore the ceiling is exactly
one quarter. Ten factors give `1/1048576 = 9.5367431640625e-7`, below one millionth.
The endpoint derivative at either six-unit tail is approximately
`0.002466509291360048`. At zero, the forward activation is `0.5`; at six it is
`1/(1+exp(-6))`, approximately `0.9975273768433653`. The same source therefore
supports the central contrast: a large forward sigmoid output can coexist with
a tiny local backward derivative. ReLU at six has output six and derivative one.
These are analytic evaluations of this named source, not new measured network
gradients, loss values, or confidence estimates.

## Composition and scope

`GatePlot` and `SGates` in the instructor's Chapter 5 film (lines 535–580), and
the storyboard's Gates row (line 82), supply the link between a pre-activation,
its local gate, and repeated attenuation. The author's revision makes the
network component primary: a blue pre-activation enters one activation component,
a green forward output leaves it, and a wine unit sensitivity travels backward
through that same component. Its forward output stays visible while the local
backward multiplier shrinks the probe. This is the mechanism the plot-first
draft did not expose: forward activity and backward sensitivity are different
quantities.

Two small insets now show the actual sigmoid and ReLU activation functions,
not derivative curves. Their separate vertical axes are labeled; their markers
and tangent slopes follow the same pre-activation as the main component. At
positive six, sigmoid is near one and nearly flat. Active ReLU transmits the
unit backward probe unchanged when substituted at the same input. The unit probe
is a normalized local-sensitivity reference, not an observed loss gradient.

Filled signal area is proportional to sensitivity. There is no artificial
minimum-area floor: the canonical ten-factor endpoint remains positive but
subpixel. Its hollow ring marks location only, not signal magnitude. This
distinction is stated beside the animation and in the transcript.

The final component path isolates best-case sigmoid derivative factors. Every
component contributes its ceiling, one quarter; the weights and branching
contributions are omitted, not set to one or assumed harmless. The path is not
ten simulated forward activations, and its numbered components count factors in
backward traversal order, not measured network layers. On phones the path wraps
with connected arrows rather than miniaturizing ten labels onto one line. There
is no logarithmic strip in this redesign.

No thirty-layer measured NormPlot, measured slope, update-count cards, LSTM
comparison, film framework, or new numerical experiment is imported. This
complements One Chain: the earlier scene caches and composes derivatives at one
neuron; this one shows why a strongly active neuron can be locally insensitive.
Surrounding weight matrices and branching paths still scale the full network
Jacobian. The ceiling is not a bound on the complete gradient. Active ReLU
contributes one only for positive pre-activations; an inactive ReLU contributes
zero. At its nondifferentiable zero, PyTorch chooses zero for backpropagation.

## Timeline and implementation contract

| Beat | Held witness |
|---|---|
| 0 | Show sigmoid at zero: forward output one half. Predict its backward transmission. |
| 5 | Introduce a unit backward probe with the multiplier still reading `× ?`; it travels during seconds 7–9 and meets the multiplier at 8, which then prints `× 0.25`. |
| 10 | Hold the transmitted sensitivity one quarter while the forward output remains one half. From second 12 the input moves: the stale quarter fades where it lies, the multiplier returns to `× ?`, and a fresh unit probe is waiting at the output side by 15. |
| 15 | After the seconds 12–15 input change to six, hold forward output approximately 0.9975 with the factor withheld for two still seconds of prediction; send the same probe during seconds 17–19. It meets the multiplier at 18, the only moment the saturated factor is revealed. |
| 20 | Hold the tiny transmitted sensitivity approximately 0.002467 beside the still-large forward output. |
| 25 | Substitute active ReLU at six: output six and local backward factor one. |
| 30 | Return to the sigmoid witness and begin a separate best-case activation-factor chain; its probe crosses ten factors through second 35. |
| 35 | Hold the ten-factor ceiling and the complete-gradient boundary. |

Eight beats, forty seconds, silent, initially closed and paused, 1.5× default.
The existing shared transport owns keyboard controls, seeking and fullscreen.
No parameter slider is added. Reduced motion derives all quantities from the
preceding five-second beat and holds that state strictly.

`BookDerivativeGates.buildState(time, reducedMotion=false, source=fixture)` exposes
the unrounded analytic state, selected activation kind, forward output, local
probe progress, sampled activation values, and complete bound sequence. Alternate
fixtures require a finite domain straddling zero within `[-30,30]`, 2–2000 samples,
and 2–100 gates (one gate would leave the wide chain no spacing to divide). The pure evaluation uses `exp(-abs(z))/(1+exp(-abs(z)))^2`,
algebraically equal to the manuscript's derivative while avoiding cancellation.
At exactly zero the player uses the analytic identities `sigma(0)=1/2` and
`sigma'(0)=1/4`, with the declared ReLU convention zero. The quarter ceiling
therefore remains an exact binary fraction, rather than depending on a numerical
exponential evaluation at a point whose answer is known exactly.

Only SVG geometry is serialized, to four decimal places (0.0001 px; nine before the September 17 review pass). Model quantities and
root data receipts retain full precision. The wide and phone final-frame SVGs
are generated by the existing static-frame helper; phone labels retain their
native size. Static MathJax expressions are revealed by CSS classes, never
rewritten. Transcript and source/static fallback remain usable without playback.

## Source receipts

Manuscript and freeze paths are relative to the repository. Lecture paths are
relative to `/Users/hs9hd/Library/CloudStorage/Box-Box/Teaching/6050/Video_lectures`.

| Source | SHA-256 |
|---|---|
| `chapters/part1/05-backpropagation.qmd` | `e33fc6eaad7a46df148b79bdfd018ef59582128c00afc77d82211ffe5584511e` |
| `_freeze/chapters/part1/05-backpropagation/execute-results/html.json` | `e8845fd6db7ba6a880fb3c0d4b8af936eed225a7994b34ea1feda63ba03bce97` |
| `_freeze/chapters/part1/05-backpropagation/execute-results/tex.json` | `6e4c52785f505ae74fff06c9eeef9f76a423719f652b11695e515849f38593b0` |
| `6050-Ch5/lecture.jsx` | `bf17cc90beb6552a8796a47aef03a05d81f25ca6528f6fd5add826955a1869d2` |
| `6050-Ch5/STORYBOARD.md` | `c71205ba9b7192393e8d1353a4c7f7b9366b0ed1a9aa31337b1f1784f03dfacc` |

## Acceptance

Full publication receipt: `/tmp/dl-book-derivative-pdf-approval.j8b72q/`.
Both PDF profiles stabilized on the second render, retaining 548 print pages,
519 continuous pages and 390 outline entries each. `comparison.json` records
identical complete/per-page text, page geometry, outlines and all 1,067 page
rasters against the preceding build. Both `audit_pdf.py` passes found no print
loss or missing glyphs. Representative Chapter 5 pages were visually inspected.
The canonical HTML bundle was rendered last (`/tmp/derivative-publication-html.log`),
with HTML assets, public anchors and all 133 frozen stdout blocks passing again.
Desktop and 390px browser inspection verifies the final full-contrast insets;
the phone has no horizontal overflow or MathJax error.

The publication pass passes **974 interaction tests**, including 45 focused
tests. Receipts: `/tmp/derivative-publication-contrast-all-tests.log` and
`/tmp/derivative-publication-contrast-focused-tests.log`. The independent suite checks analytic
activation/derivative values, correctly scaled inset tangents, the explicit ReLU
zero vertex, actual forward/reverse component connections, true filled-area
scaling, constant locator rings, gate-crossing counts, one/two/three-row reflow,
native font sizes, deterministic scrubbing and full raw-state preservation.
Shared transport, strict reduced-motion holds and generated wide/narrow fallback
checks pass. Perturbing `exp` and `sqrt` by ±1/2/4 ULP leaves both static SVGs
byte-identical. Full-precision values remain on the root state, not redundantly
embedded in the static drawing; only geometry is rounded. No tolerance was widened.
The final accessibility check replaced whole-inset fading with a dashed inactive
curve. Labels and graphics retain full contrast; a regression rejects opacity
applied to the parent or text. The approved composition and static SVGs are unchanged.

The full frozen HTML build passes (`/tmp/derivative-network-final-html.log`). All
book, Plan → Code, Python, excerpt-fixture, HTML-asset and public-anchor audits
pass. The fixture audit covers 21 scenes, 127 literals and 75 computed variants,
with 54 lecture digests reverified. All 133 frozen stdout blocks across 27 units
match `e00d3c5` exactly, including all 27 HTML/TeX pairs. Chapter 5's Pandoc LaTeX
is byte-identical with and without the HTML-only filter:
`/tmp/derivative-network-{plain,filtered}.tex`, SHA-256
`11f5175106d215701449836087885afda4ba30f0ed4ae48a71ec9ffde62e07ab`.
Both direct Pandoc calls emit the same pre-existing implicit-div warning; the
complete Quarto render succeeds. The publication pass rebuilds both PDF profiles
and checks their print invariance; no manuscript, frozen evidence or print setting
changed.

Actual browser review at 1280px desktop and 390px phone verified the local
saturation witness, small function insets, readable wrapped chain, complete
1.5× playback to forty seconds and Replay, and expanded-mode entry/exit. The
phone page has no horizontal overflow, no SVG text outside the picture, and no
MathJax error. Ordinary navigation leaves the disclosure closed without loading
the player script; the direct anchor opens it paused at zero. The unit backward
probe becomes small while the large forward
value remains visible. Failed-script fallback is verified by the interaction
suite, not claimed as a browser-wide JavaScript-disabled test.

Assets total 65,591 bytes (panel 42,568; player 19,740; CSS 3,283), measured from
the three files under `interactives/derivative-gates/`. Player SHA-256:
`1618914ab009d5a4295b1c44f6c4e30316390c7bc745079212398808c2ad470d`.
Focused test SHA-256:
`db5421bfcb2264b3057dc6b3c1bdadb2438d7e89405f65e5180bbeffc981d80e`.
CSS SHA-256: `d1c4f1cbf39d968f85a82c57d502434ba47fc60700ca11e1893f5cb0c1f49576`.
No new library, framework, slider, training job or runtime dependency.
Local review:
`http://127.0.0.1:8770/chapters/part1/05-backpropagation.html?preview=network-components#derivative-gates-excerpt`.
The earlier plot/log-ruler acceptance is superseded by these checks, not reused.

The preceding LayerNorm/BatchNorm scene was pushed as `e00d3c5`; publishing run
`34766825371` completed successfully. Its receipts remain separate. The author
approved an ordinary push of this derivative-gates revision, not a new tag,
scheduled task or runtime migration. The next candidate must pass its own
manuscript-source gate and local review before a separate publication.

## Review pass — September 17, 2026

An independent review found that the scene answered its own question early. Fixes,
confined to `interactives/derivative-gates/*`, the focused suite and this receipt;
duration, beats, fixture and the boundary/intro paragraphs are unchanged.

- **The prediction was spoiled.** Through seconds 12–15 the multiplier label tracked the
  moving input (`× 0.25` down to `× 0.002467`) and the delivered packet shrank with it,
  so the answer was printed before beat 15 asked the reader to predict it. Now one rule
  governs the lane: the multiplier prints its factor only when a probe has met it at
  the current input, and the delivered value is printed beside the packet only once it
  rests at the input side. From the instant the input moves, the multiplier and the
  delivered label read `?`, the stale quarter packet fades out in 0.6 s at its measured
  size (it is never redrawn smaller), and a whole unit probe fades in at the output side
  over the last 0.6 s before beat 15, so the beat is continuous with what precedes it.
  The forward story stays in view during the glide: the `z` and `a` labels, the inset
  dot, and the flattening tangent, which is the honest hint. The svg description says the
  factor is withheld; the scrubber text carries no numbers at all.
- **Probe timing.** Both probes now leave two seconds after their beat and take two
  seconds (7–9 and 17–19; previously 7–10 and 17–20), so each meets the multiplier one
  second in. The reader gets two still seconds to predict (the drawing is byte-identical
  from 15 to 17) and each revealed factor holds two seconds before the next caption,
  then through the following beat. The probe is drawn under the multiplier box and the
  chain probe under its gates: a packet goes in at one size and comes out at another, and
  the locator ring no longer crosses a printed factor. Caption 3 now describes its still:
  "The output is now almost one. Predict what happens to the backward signal."
- **Reduced motion.** Beat 2 holds `z = 0` with `× 0.25` delivered; beat 3 holds `z = 6`
  with the unit probe waiting and `× ?`; beat 4 shows the result.
- **Typeset numbers.** One scene-local formatter (the gate-product house style) prints
  every number: four significant figures, U+2212 for a minus, and `9.54 × 10⁻⁷` where
  `9.54e-7` and the raw `9.5367431640625e-7` used to appear (picture, both static prints,
  svg description). Numbers are announced on the picture and in its one description; the
  render return string, hence the scrubber's `aria-valuetext`, names the stage only.
- **Per-frame work.** The 300-point curve and the quarter-power table are built once per
  fixture and frozen; `data-curve`, `data-bounds` and `data-ceiling` are published at
  mount. Everything that depends on width alone (scenery, wires, inset curve paths, chain
  reflow, viewBox, `data-chain-points`) moved into `layout()`, which returns early when the
  width has not changed. Attribute, text and `hidden` writes are skipped when unchanged,
  so a frame inside a hold writes nothing to the drawing. Dropped unused dataset keys:
  `networkLeft/Right/Center`, `forwardY`, `backwardY`, `unitRadius`, `insetWidth/Height`.
- **Validation.** `maxGates = 1` made the wide chain divide by `columns − 1 = 0`. The
  fixture now requires 2–100 gates; a one-gate panel is refused before the static print
  is removed.
- **Picture.** The reserved lower band for the factor chain is kept so the viewBox never
  jumps. Fixed what read as broken around it: on phones gate 5's number sat under the
  wire that drops to the second row (it now sits beside the gate); the resting locator
  ring overlapped gate 10 (chain margins 54/18 instead of 50/20); the backward lane's
  arrowhead sat inside the resting ring where the subpixel packet should be (moved
  clear); and the stage-6 note overflowed a 302 px pane ("Fill too small to see? Read
  the number.").
- **Suite.** The old oracle copied the player's stage and easing logic, so it could not
  see the spoiler. It is replaced by independent mathematics keyed on the input the
  player reports (`verifyMath`) plus literal named-time witnesses (`TIMELINE`, `STILLS`);
  geometry tests compare the drawing with the published state. New observable
  regressions: the answer is withheld from every visible text node, the svg description
  and the scrubber text from 12.05 s to the crossing, at both widths and in the reduced
  stills; no e-notation, hyphen-minus or raw double anywhere a reader meets a number;
  the scrubber repeats no number; tables and width-only geometry are not rewritten
  during playback; one- and two-gate fixtures. Reintroducing the old behaviour fails the
  new regression. 50 focused tests pass (45 before); `audit_excerpt_fixtures.py` passes.
  Frames were inspected at 1280 px and 375 px, with and without reduced motion, at
  2, 6, 8, 9, 11, 12.3, 13.5, 14.9, 15, 16.5, 17.8, 18, 18.3, 19, 21, 27, 32.5, 37 and
  39.9 s: no page overflow, no svg text outside the picture, no console errors.
- Byte sizes and SHA-256 values recorded above predate this pass; a later pass records
  the new ones.
- **Less prose around the picture.** The boundary now shows one sentence; every remaining scope note,
  unchanged, sits in a closed "Scope and caveats" disclosure beside the transcript. New asset sizes
  and digests for this pass are recorded once in [the review-pass receipt](excerpt-review-pass.md).

## Value redesign — September 18, 2026

The author asked of every excerpt "does that even help?", and the review's answer for this
scene was *not yet*: `z = 0, × 0.25` and `z = 6, × 0.002467` as two static frames said
everything. The reason (the tangent flattening) lived in a 94 × 42 px inset, the payoff was a
digit string beside a dot that goes sub-pixel, and in the ten-gate chain the dot was invisible
after about gate 3. This pass rebuilds the scene around that test. Edits are confined to
`interactives/derivative-gates/*`, the focused suite and this receipt. Duration (40 s), beats
(`0 5 10 15 20 25 30 35`), the fixture (`domain [-6,6]`, `samples 300`, `maxGates 10`), the
boundary's one lead sentence and the manuscript are unchanged. Everything in "Derivative
gates: activity is not sensitivity" still binds: the main picture is a component inside a
network with forward values held visible and a unit sensitivity crossing its derivative in
reverse; no large curve plot; filled area = sensitivity; a hollow locator never supplies
magnitude; the exact quarter at `z = 0`; an explicit ReLU zero vertex and no tangent at the
kink; best-case sigmoid factors, not a simulated network; weights omitted, not assumed harmless.

**Misconception targeted.** "An active neuron (large output) passes a strong gradient." The
truth: the backward factor is the activation's *slope* at the operating point, which dies on
**both** saturated sides; ReLU's slope is 1 wherever it is active.

**What the motion now carries that two static frames could not.**

- *The slope is the visible cause.* The component's face is its own activation curve (two
  dotted rails for the output's floor and ceiling, a zero tick, no grid, no axes; 164 × 84
  units on the desktop page, 84 × 84 on a phone). The operating point rides that curve; a
  wine tangent of one drawn length tilts with `σ′(z)`; a dashed slope link drops from the
  point to the multiplier on the backward lane, which reads `× slope = …`. During 12–15 s
  the point climbs the S and the needle tilts flat while the number stays `?`: the reader
  watches the cause before being asked for the effect. This replaces the two detached insets.
- *One control: `z ∈ [−6, 6]`*, the fixture's declared domain, a real range in the input's
  blue laid over a band the picture keeps clear directly under the lane it drives (so a
  dragging hand never covers the tangent). Timeline-driven by default exactly as before
  (0 → 6). Dragging pauses playback and recomputes operating point, tangent, `a`, multiplier
  and delivered packet area. What no pair of frames shows: the gate is widest at `z = 0` and
  dies symmetrically — at `z = −6` the neuron is quiet forward (`a = 0.0025`) *and* quiet
  backward (`× 0.002467`); at `z = +6` it is loud forward and equally quiet backward. On the
  ReLU beat the same drag shows slope 1 for `z > 0`, slope 0 and no delivered packet for
  `z < 0`, and at `z = 0` no tangent and `× 0 (kink rule)`.
- *Depth is perceptible.* Under the ten connected `×¼` components runs one ruler, stated on
  the picture as a log scale (ticks `1, 10⁻², 10⁻⁴, 10⁻⁶`). Its marker takes ten **equal**
  hops left, one per gate crossed, and leaves each hop behind as an arc, ending at
  `9.54 × 10⁻⁷`, just past the `10⁻⁶` tick. Multiplying by a constant is an equal step on a
  log ruler: that is the mechanism, and it stays countable on a still frame. A second mark,
  "active ReLU path: stays at 1", never moves. On the desktop layout the chain's entry and
  exit stand over the ruler's two ends, so the packet above and the marker below travel
  together. The filled-area packet and its hollow locator are kept, but no longer carry the
  message.

**Prediction discipline.** Both questions withhold their answer from the picture, the svg
description, the scrubber text and the z control's `aria-valuetext` until the probe meets the
multiplier (8 s and 18 s). Newly withheld: the ceiling formula `σ′(z) ≤ ¼`, which used to
appear at 5 s and answered the first question; it now appears with the first reveal. The
control's value text says what `z` does ("largest at z = 0 and dies toward both ends") only
when dragged or from beat 4 on. Once the reader drags `z` themselves the live slope shows:
that is their experiment; play, a scrub or a beat key returns to the timeline and its `?`.

| Beat | Held witness |
|---|---|
| 0 | Forward only: `z = 0`, `a = 0.5`, the point mid-curve. Would a larger output pass more gradient back? |
| 5 | The tangent, its slope link and the backward lane appear with `× slope = ?`; the unit probe crosses 7–9 s and meets the multiplier at 8: `× slope = 0.25`. |
| 10 | The quarter holds; from 12 s `z` rises, the point rides the S, the tangent tilts flat, the multiplier returns to `?`, the stale packet fades, a fresh unit probe waits by 15. |
| 15 | `z = 6`, `a = 0.9975`, tangent almost flat; two still seconds to predict; crossing 17–19 s, reveal at 18: `× slope = 0.002467`. |
| 20 | Loud forward, quiet backward. The caption invites the drag to `z = −6`. |
| 25 | ReLU at the same `z`: face, `a = 6`, `× slope = 1` (no prediction is asked, so it is shown at once); the probe crosses 27–29 s whole. |
| 30 | Sigmoid witness again; the chain and ruler appear; from 30.5 s the packet crosses ten gates (gate *k* at 30.275 + 0.45 *k* s) while the marker hops, the last hop landing on 35. |
| 35 | Ten equal hops, `10 factors: at most 9.54 × 10⁻⁷`, "Tiny is not zero. This is not the full gradient." |

Reduced motion holds one still per beat: each beat's first frame, except the ReLU beat
(its delivered probe, 29 s) and the depth beat (its halfway point, 32.75 s: five equal hops),
so every still shows what its caption says.

**Removed.** The two 94 × 42 px insets and "activation shapes · own vertical axes"; the grey
cache link (the slope link is that link, now tied to the tangent); the bare `× value` label;
the chain probe's eleven-segment timing from 30 s; the stage-6 note "Fill too small to see?
Read the number." — the ruler makes it unnecessary.

**Declared computed variants** (none is printed in the manuscript; all are deterministic
computations from the declared fixture and the chapter's formulas):

1. `σ(z)` and `σ′(z) = σ(z)(1 − σ(z))` at every `z` of the control's range `[−6, 6]` in steps
   of 0.1, and on the ReLU beat `max(0, z)` with the `(z > 0)` gate and PyTorch's 0 at the
   kink. Evaluated as `e/(1+e)²` with `e = exp(−|z|)`; exact identities at `z = 0`. The
   forward output is printed to four decimals (`0.9975`, `0.0025`), the multiplier to four
   significant figures. Witnesses: `σ′(±6) = 0.002466509291360048`, `σ(−6) ≈ 0.0024726`.
2. The log-ruler positions `log₁₀(¼ᵏ) = k·log₁₀(¼) ≈ −0.60206 k` for `k = 0 … 10`, ending at
   `log₁₀(9.5367431640625 × 10⁻⁷) ≈ −6.0206`; the tick exponents `0, −2, −4, −6`; the active
   ReLU mark at exponent 0. The ruler is a drawing device of this scene.
3. The tangent's drawn tilt, `atan(σ′(z)·s_y/s_x)` on the face's own scales. Each face uses
   its activation's own vertical scale (sigmoid 0–1, ReLU 0–6, stated by the top rail's
   label), so tilt compares slopes within one face only; the printed multiplier is the number.

**Manifest text.** `interactives/manifest.json` is outside this pass's write set and its third
`computedVariants` sentence is now false ("There is no logarithmic strip … parameter
control"). Replacement text for this scene's `computedVariants` was handed to the
orchestrator with this pass's report.

**Known trade-off.** The lower band for the chain and ruler is still reserved from the first
frame, as in the approved version, so the transport never jumps; it is empty for the first
thirty seconds (about 40% of the picture), and on a phone that puts the caption roughly one
screen below the component it prompts about. Opening the band only at 30 s, or placing the
caption above the picture on narrow panes, are the two alternatives; both change behaviour
shared with other scenes, so neither was taken here.

**Out of scope, still.** No measured thirty-layer NormPlot, no training replay, no weights or
branching in the product, no claim that tilt is comparable across the two faces, no second
control (the face swap belongs to the timeline), and no bound on the complete gradient.

**Suite.** `node --test scripts/test_derivative_gates_excerpt.cjs`: **58 tests pass** (50
before); `audit_excerpt_fixtures.py` passes. Every arithmetic and fixture invariant is kept.
Tests that pinned the insets and the old chain timing are replaced; new tests bind: the face
(curve through the declared 300 samples, point on the curve, tangent of constant length whose
endpoints satisfy the tangent-line equation and stay inside the component, slope link landing
on the multiplier, exactly one face by substitution); tilt strictly decreasing in `|z|` and
symmetric; the ruler read from its own ticks (marker rests at `log₁₀(¼ᵏ)` at literal times,
ten equal pixel steps, hops drawn progressively by dash offset and never by a rewritten path,
ReLU mark fixed at 1); both prediction windows at fine time steps including the ceiling
formula and the control's value text; the control contract (real range outside
`[data-controls]`, inert and hidden until mount, domain from the fixture, timeline-driven,
drag pauses and recomputes, symmetric death over all 121 values, clamping and step rounding,
every timeline action resumes, alt/ctrl/meta and key-repeat guards with a resize, keys on the
control never seek, live values announced by the control alone, one drag sentence per face
within the word budget, the static `aria-valuetext` equal to the final render); nothing under
the control's band; estimated-text-box collisions at eleven widths (240–713) on the timeline
and across the whole drag on both faces; static prints with all ten hops; ULP perturbation
now also of `hypot` and `log10`. Frames inspected in a real browser at 1280, 375 and 320 px
(2, 6, 8.3, 11, 13.5, 16, 18.5, 22, 27.5, 28.5, 32.75, 34, 40 s; reduced motion at 7, 17, 27,
32 s; script-free; mouse drag, modifier keys with a resize, slider arrows, both faces at
`z = −6, −3, −2, 0, 1.5, 2, 3`): no page overflow, no svg text outside the picture, no
console errors.

Assets after this pass: panel 44,334 bytes, player 39,097, CSS 5,272. The picture is 713 × 546
units on the desktop page and 296 × 624 in the phone layout (476 and 550 before): the face is
larger, and the control's band and the ruler are new. Earlier recorded sizes
and digests above are left as recorded.

### Two acts on one stage — same day, second pass

The coordinator's review of the pass above: the redesign works, but for thirty of forty
seconds about 40% of the picture was an empty reserved band, and on a phone the caption sat a
screen below the component. This pass removes the band without any layout jump; it supersedes
the "Known trade-off" paragraph above, the recorded picture sizes, and the beat-25 row's probe
times. Same write set; nothing shared changed.

- **One constant viewBox per width** (713 × 469 on the desktop page, 296 × 539 on a phone;
  546 and 624 before), identical at every time, through a drag and in both acts.
- **Act 1 (0–28.5 s):** the component picture (forward lane, face, backward lane, legend, the
  z control's band) is spaced over the whole stage. What the stage has beyond the picture's
  natural spacing is shared out with caps: a fifth to the face (at most 16 units wide, 28
  narrow), the rest to the gaps around the lane and the control, any remainder as equal
  margins. The face is 164 × 120 on the desktop page and 128 × 144 on a phone; the box stays
  under a quarter of the stage. On a phone the two values take the top corners so the face
  can be wider. No mark of the chain exists before 30 s.
- **The compression (28.5–30 s)** finishes on the depth beat, per the glide rule. It is a
  re-layout, not a scaled group: every measure of the component picture is interpolated
  between the two acts and every label keeps its native type size, so the strip stays
  legible (a uniform scale would have printed 13 px labels at about 7 px). The z control is
  an HTML range over the svg: its `top` follows the band on every frame of the glide, and in
  act 2 the band closes the strip, above the chain's title. So nothing else moves with it,
  the ReLU probe now leaves one second after its beat (26–28 s, no prediction is asked there)
  and rests delivered before the stage moves.
- **Act 2 (from 30 s):** the strip (face 164 × 56 desktop, 128 × 48 phone; still draggable,
  tangent still 45° at `z = 0` and flat at `±6`), then the ten gates and the log ruler in the
  freed area. The phone chain wraps to two rows as before.
- **Reduced motion:** act-1 layout for beats 0–5 (the ReLU still is its delivered probe at
  28 s), act-2 layout for the depth beats.
- **Static fallback:** the final frame, hence the act-2 layout; both prints regenerated,
  `preserveAspectRatio="xMinYMin meet"` kept, the phone print's aspect ratio updated in CSS.
- **Also fixed:** `1 factor: at most 0.25` (was "1 factors").

Suite: **59 tests pass**; `audit_excerpt_fixtures.py` passes. New test: at 713 and 296 the
viewBox is identical at every quarter second from 0 to 40 s and through a drag; before the
depth beat no chain mark is drawn, the component picture spans the stage and the tallest
empty band is under 14% of it; the compression is monotone and complete at 30 s; in act 2 the
strip (control band included) ends above the chain, both fit, type is native size and the
face still shows the tilt; reduced motion holds the act-1 layout for beats 0–5 and the act-2
layout after. Adapted: paths and label positions may be rewritten only inside the 1.5 s
compression, never in the chain, and nothing carries a `transform`; the face, control-band,
collision and tangent-inside-the-box checks now also run through the compression and on the
strip. Phone frames inspected at 2, 13.5, 18.5, 28, 29.2, 31, 34, 40 s (and 1280, 320 px,
reduced motion, script-free, real mouse drag): the caption now sits directly under the
control in act 1; no overflow, no text outside the picture, no console errors.

Assets after this pass: panel 44,213 bytes, player 42,835, CSS 5,272.
