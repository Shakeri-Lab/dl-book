# Mechanism replays: educational-value pass

September 18, 2026. Baseline `030fcf7`. After the review pass the author asked the harder
question of one scene — "does that even help?" — and then asked for the weak and middling scenes
to be improved or retired, so that no replay costs a reader attention without teaching.
Nothing under `chapters/`, `_freeze/`, `tex/` or the filters changed; both PDF profiles are
untouched. No scene is added or removed by this pass; retirement remains the author's decision.

## The test

Put a scene's first and last frames side by side. If a student loses nothing, the motion is not
carrying the mechanism. A scene earns its place when the motion is the operation itself, the
reader commits to a prediction before a withheld reveal, the payoff is visible to the eye rather
than a digit string or a sub-pixel dot, the reader can drag the one parameter when the mechanism
is that parameter's effect, and the panel closes by asking the reader to apply the mechanism to
a case it did not show. This is now in `animation-authoring.md` ("Earn the animation", the
transfer-check rule). No learner data exists yet; these are design judgements, and the closing
questions are written so they can double as exit-ticket items for DS 6050.

## Triage of the twenty-two scenes

| Verdict at baseline | Scenes | Action |
|---|---|---|
| Passes: motion is the mechanism | convolution, softmax shift, kernel weighting, mask before softmax, score field, reference tilt, pooling bins, same subspace, gate product, preference ruler, SVD circle | transfer check added |
| Passes on a second look | one chain (nudge bars scale edge by edge), LSTM valves (travelling packet scaled at each valve), quantization grid (has its bit-width control) | transfer check added |
| Adequate after the review pass | attention bill, scale granularity, greedy tree, BERT ledger | transfer check added |
| Fails | derivative gates, mask/predictor, LayerNorm axis, hinge bump | redesigned, below |

## The four redesigns

| Scene | Why it failed | What the motion now carries |
|---|---|---|
| `derivative-gates` | Two frames (`× 0.25`, `× 0.002467`) said everything; the reason lived in a 94 × 42 px inset; the ten-gate payoff was a dot that vanished after gate three. | The component's face is its own activation curve with a tilting tangent tied to the backward multiplier (`× slope`). `z` is the one control, so the reader finds the gate widest at zero and dead on both sides, and ReLU's kink rule. Depth is ten equal steps on a log ruler against an active-ReLU mark that stays at 1. Two acts share one constant viewBox, so there is no reserved empty band. |
| `mask-predictor` | The target row appeared already shifted and masked; the one operation that causes the off-by-one was never shown. | A copy of the token cards, each carrying its prompt/response tag, slides one slot left to become the targets; "birds · response" comes to rest under the last prompt slot before any gate appears. Sequence B repeats the slide one slot earlier. |
| `layernorm-axis` | The BatchNorm/LayerNorm contrast was a static bracket swap and the closing beats showed four coincident profiles; the consequence of the axis choice was never demonstrated. | One highlight turns: the rectangle sweeps from BatchNorm's column to LayerNorm's row about the cell they share, and the column stays as a muted ghost until the closing test, where a neighbour token doubles, the pooled BatchNorm mean slides 10 → 20, and the token's LayerNorm mean and profile do not move. Only that BatchNorm statistic is computed; no BatchNorm output is drawn. |
| `hinge-bump` | The three partial sums were shown but "−2" arrived as a given. | A slope ledger (+1, 1 + c, 2 + c) and one control, the middle coefficient: the sum's tail swings like a lever and lies flat on zero only at c = −2, which the reader predicts first. Every other c is a declared computed variant. |

Each redesign keeps its duration, beats and manuscript fixture; new on-screen values are
deterministic computations from that fixture, declared in `interactives/manifest.json`.

The author reviewed all four in the rendered book on September 18 and approved them, asking only
that LayerNorm's axis change stop being a hard swap: "currently it's sudden and we are losing the
contrast." The turn and the persistent ghost column are that revision.

## The transfer checks

Every panel now ends with one closed `details.mechanism-check`. `scripts/test_excerpt_checks.cjs`
recomputes the numbers in all twenty-two answers from the declared fixtures, independently of
any player, and requires the question to be closed by default, placed before the transcript,
within a word budget, and free of ASCII minus signs and e-notation.

## Evidence

- Interaction suite: 1,143 tests, all passing (1,087 before this pass); each redesigned
  scene's suite gained tests for the new mechanism (motion as the right function of time, the
  withheld prediction, control behaviour including modifier keys and resize, reduced-motion
  stills, label collisions at both layouts).
- `audit_excerpt_fixtures.py`, `audit_plan_code.py`, `audit_book_contract.py`,
  `audit_python_sources.py`, `audit_public_anchors.py`, `audit_frozen_stdout.py --base HEAD` pass.
- Every changed scene was rendered in Chromium at 1280 and 375 px (normal, reduced motion,
  scripts off, and dragged where there is a control) and inspected by eye.
- Not done: learner testing, a VoiceOver pass, the PDF rebuilds (no shared source changed).

## Asset digests after this pass

Computed from the working tree at commit time with `shasum -a 256`; sizes in bytes.
These supersede the asset sizes and SHA-256 values recorded in the individual scene
receipts, which describe each scene as first accepted.

| File | Bytes | SHA-256 |
|---|---:|---|
| `interactives/_template/panel.html` | 7,360 | `f1038a6f981ae6b559f2cbe056f56645f57e7e05b60f28ce1b8d40c4c70b054e` |
| `interactives/attention-bill/panel.html` | 86,574 | `b77645ee9bc5a968c2e044c3727e4fcfe2f9ffc776d3635c84b499ad25f00b83` |
| `interactives/bert-ledger/panel.html` | 9,670 | `e6de393cdd2781fa32147ef17b8b422032b01476cbbacb2a74626dd8e54f97a4` |
| `interactives/convolution/panel.html` | 7,868 | `e6a957130e881634abcc81a60557e3e91365b1321994190ab64953c06b5f9e0c` |
| `interactives/convolution/player.css` | 8,062 | `4d0736392ca00b12366ac782e0b9f1a6ff6d38273373e8e2e5c82a80b3c5b2de` |
| `interactives/derivative-gates/panel.html` | 44,626 | `d60286cd47806a90d619511d19471c6d36075acd9aaa1b065983db4c3062ab1a` |
| `interactives/derivative-gates/player.css` | 5,272 | `a4bf2dc073c8752865ed62bcef2ab50dd3804b5ff4fd0594e3f9d22f62f270b5` |
| `interactives/derivative-gates/player.js` | 42,835 | `1d616ab965ee0cfd99490501dfc20cf4265515f9a2ba5a8fc5f1c15901051457` |
| `interactives/gate-product/panel.html` | 68,173 | `abf93fa0506ef43a1b3bff7686c1fd6092a9b933058f2c9da1eb03046be8e06e` |
| `interactives/greedy-tree/panel.html` | 26,928 | `0b825b0778705be791a4a883ec9b40f3c9590e9ecd69eb0840d0194d441d0193` |
| `interactives/hinge-bump/panel.html` | 15,760 | `717cf5670863212a85022ce836f6b0a51bd44307d887cd9182618e8129a9d8ec` |
| `interactives/hinge-bump/player.css` | 10,445 | `e16c7032a8f98fefd34820b4d45cd86697f712f421cbee64d03009aff9a38050` |
| `interactives/hinge-bump/player.js` | 26,916 | `629ef01e54134622f3e5f0eed93aaf37c24c5f0764c2044acd23ade7f851a13e` |
| `interactives/kernel-weighting/panel.html` | 6,039 | `29cd5cd6b7a3603179bdc178c0dc4414dd2a6da0d81a4d475e3db68df77f77e7` |
| `interactives/layernorm-axis/panel.html` | 34,116 | `953295696054b2f94d8d7319a6b8250f0e9f2887be9c3010a5a74dde4945ee54` |
| `interactives/layernorm-axis/player.css` | 3,913 | `a35546f40907a7c51bd43c1f10d48136fc851e9cfe4bbf17079eacf9f8ab587b` |
| `interactives/layernorm-axis/player.js` | 33,704 | `9153f451d8ae3e42f4460000043e368c642eeac7df5f8bcd2a37c35b08159b0b` |
| `interactives/lstm-valves/panel.html` | 16,458 | `ffaec5634f6565fc4cdd267b8d33b29dd8c13b327294f588332be31e54f85f41` |
| `interactives/manifest.json` | 61,003 | `c3fbd5282f510d16963a2aa2a00dc770b76f7abf7afa6bd65e4235ea851399af` |
| `interactives/mask-before-softmax/panel.html` | 17,780 | `ab00d011d02c2c9bb4590c060c86ac42e55d9f09c370b7b5a54ecc770300873f` |
| `interactives/mask-predictor/panel.html` | 60,012 | `2724f9fcf798aa51374ee03fa094e06a60fed2b013b5826882fbbf08f89c9cfa` |
| `interactives/mask-predictor/player.css` | 4,551 | `fe8beec92e519e5792df79179b127d84cd339f8f8be235e9392183f20097fa8c` |
| `interactives/mask-predictor/player.js` | 23,017 | `fcaa18d279daeff7cd67c445ba137abddff800d891303f3a72681e3da0582c9c` |
| `interactives/one-chain/panel.html` | 16,244 | `aad45a72956276f6556933cd5854a1f335c39da10c4d106a6f5fbf67748d93bc` |
| `interactives/pooling-bins/panel.html` | 17,797 | `c307d83fd954a81cbc58e859577d5976d77a340f9a8adcd9a46b03ef00e0707f` |
| `interactives/preference-ruler/panel.html` | 15,091 | `1f7e4a9a3c22d751eeae08d1d3fc64cca71ed66f06d250d7f8eb2dc056fa9362` |
| `interactives/quantization-grid/panel.html` | 15,904 | `4203583ad495aea16b51952a6a5fb73e760ab3ab02e6ea88939889922199e094` |
| `interactives/reference-tilt/panel.html` | 15,002 | `f8d71e88d5eea8c382a49db754c29d71ab4e55911e4207b37b5c37e211493107` |
| `interactives/same-subspace/panel.html` | 11,190 | `a1542ca8568ea842e0935d6f5204cf0c9043968c4d374f458e77d1d0518b5509` |
| `interactives/scale-granularity/panel.html` | 15,172 | `49e0da721cb0eee5541ea10c8fda3f0ceed778870cc2710e2fcef7eeb4a951cf` |
| `interactives/score-field/panel.html` | 30,634 | `96d4982b9b9079043289bc587ee6edfc34bdc07bec024a7f26b75302ca58b863` |
| `interactives/shared/player.css` | 4,615 | `88cd6c6f950f96f1fc92e3dc03579913d62d9db63cf7167a69729f8402758f13` |
| `interactives/softmax-shift/panel.html` | 12,550 | `bf969b0994db152042d26212298452d859bd0e51dc0854f1fceb7a6cde962099` |
| `interactives/svd-circle/panel.html` | 39,866 | `90ec88cada6ac58d44f1ec1ca28c82e9f5bb8fc578ef9c690f57abf032ec0ad3` |
| `scripts/test_derivative_gates_excerpt.cjs` | 89,562 | `c7f3744be9625a7208607931207f3b5cdc8c332a24e41982337faf4dfbcc696e` |
| `scripts/test_excerpt_checks.cjs` | 8,543 | `8361d471dae4b6a0c49eb111ad5431c1d4ecc3a070706c920421fcdffb9b5b68` |
| `scripts/test_gate_product_excerpt.cjs` | 108,407 | `e7c109a36aeea9427de06103d8d2bb9c2585d7d8764788dc23b1f076484184da` |
| `scripts/test_hinge_bump_excerpt.cjs` | 79,731 | `0c7be7a25de70c02e89799b0bc6719022283aa78d500caf3dc1507edbcfdba1b` |
| `scripts/test_layernorm_axis_excerpt.cjs` | 66,515 | `c40c0da9f0bbca71d6d480e67a180d61949a497727729430f705811cd41e3961` |
| `scripts/test_mask_predictor_excerpt.cjs` | 54,744 | `9c9883a22ed26d8795b9a0f04b8a340a0853b92843b34c6ff48011f55ce7a53c` |
