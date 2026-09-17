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
| `chapters/part1/05-backpropagation.qmd` | `62b9791a5713f689a14b6275ea777a32a633f7c1a307c3221acabf7c8b5931ff` |
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
