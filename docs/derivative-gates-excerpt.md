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
| 5 | Introduce a unit backward probe; it travels through the component during seconds 7–10. |
| 10 | Hold the transmitted sensitivity one quarter while the forward output remains one half. |
| 15 | After the seconds 12–15 input change to six, hold forward output approximately 0.9975 and send the same probe during seconds 17–20. |
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
and 1–100 gates. The pure evaluation uses `exp(-abs(z))/(1+exp(-abs(z)))^2`,
algebraically equal to the manuscript's derivative while avoiding cancellation.
At exactly zero the player uses the analytic identities `sigma(0)=1/2` and
`sigma'(0)=1/4`, with the declared ReLU convention zero. The quarter ceiling
therefore remains an exact binary fraction, rather than depending on a numerical
exponential evaluation at a point whose answer is known exactly.

Only SVG geometry is serialized to nine decimal places. Model quantities and
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
