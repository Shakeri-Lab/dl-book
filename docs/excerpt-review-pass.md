# Mechanism replays: independent review pass

September 17, 2026. Baseline `c06892f` (twenty-two scenes). The author asked for an independent
review of the twelve scenes added since `0674cab`, then for the findings to be fixed. This
receipt records what the review found, what changed, and the evidence. It authorizes no new
scene, no manuscript edit and no release tag; nothing under `chapters/`, `_freeze/`, `tex/` or
the filters changed, so both PDF profiles are untouched.

## What the review checked

Every number on all twelve scenes was recomputed against its chapter and matched. At baseline
the interaction suite (1,018 tests), the fixture audit and the publishing run were green, and the
live pages showed no console error and no horizontal overflow at 1280 and 375 px. The defects
were in teaching and legibility, not arithmetic.

## What changed, by scene

| Scene | Defect | Fix |
|---|---|---|
| `derivative-gates` | The answer played out (× 0.25 sliding to × 0.002467) while the caption still asked for a prediction; the oracle copied the player's timing and could not see it. | The factor is withheld (`× ?`) from the moment the input moves until the probe crosses; the old packet fades, a fresh unit probe waits. DOM-level regression test over the whole window; `9.54 × 10⁻⁷` formatting; curve tables built once; `maxGates ≥ 2`. |
| `mask-before-softmax` | No motion at all: playback equalled reduced motion, the stage was wiped at 25 s, about fourteen live numbers. | One persistent picture recomputed from the padded contribution `c = exp(s)`: the padded scores slide to −∞, their bars shrink, the sum contracts and the freed weight visibly moves to the two real keys. PAD mass is wine while non-zero and neutral at zero; at most eight emphasised numbers. |
| `scale-granularity` | Final frame was four stacked text readouts; the "much narrower" zero bin was 0.58 px and hidden under a tick; a tick labelled 0.02 sat at 0.0197. | Storage is a byte-scale bar (codes 16,384 B; scales 4 B → 256 B with a hollow locator); the zero bin keeps its true width with a ring and leader; ticks at the values they name; the grid refines as motion. |
| `attention-bill` | The traced row and column were about 1.3 px; a link crossed a label; an arrow-key seek parked on 1 of 16 tiles. | An interior token is traced with hollow locators; labels wait for their beat; tiles finish stamping at the beat; ×16 sits on the square and ×4 on the bar, equal weight, on a white plate. |
| `preference-ruler` | The shift animated while the caption said "predict before the shift"; the ruler ran out of ticks in fullscreen. | The prediction beat is still; glides moved one beat later; tick count follows the ruler's pixel span (tested at 1000 px). |
| `reference-tilt` | Alt/Ctrl/Meta + arrow left a stale slider override that a resize then discarded; β, reward and KL were announced in three places; value labels sat on the reference outline. | The transport's modifier guard is mirrored and tested; one announcement; β drawn once; reward and KL are paired fixed-scale gauges; labels clear the outlines at every β and width. |
| `score-field` | `-4.5e-15` beside `weight 1: 0.0000`; reduced-motion captions contradicted their stills; seven live numbers. | U+2212 and `× 10ⁿ`; tiny is never a false zero; captions are true of each still (claims table in the suite); density readout dropped; curves cached in `layout()`. |
| `same-subspace` | Primes appeared three seconds before the side label switched; "basis V" as plain text; at the mid-turn hold the point sat on the turned axis, hiding the second coordinate. | One flag switches every label together; wording without symbols on the picture; the layout turn is 100° so both projections are visible at 50° and 100°. |
| `mask-predictor` | The tracked dot moved 17 px once; a stroke-width sine pulse; wine on neutral mask gates; a sentence inside the picture. | One ink marker rides the last prompt slot's output through its ×1 gate onto a score rail, and stops at a ×0 stop bar for an excluded output; gates are neutral. |
| `greedy-tree` | On a phone every joint-probability label was crossed by its incoming edge; the winner ring cut through "#1 p 0.361". | Labels sit on the outer side of each rail at native size; a geometric no-collision test covers eleven widths; older numbers mute as newer ones arrive. |
| `svd-circle`, `layernorm-axis` | Nine-decimal geometry serialisation left about twenty ulps of margin; ASCII minus on the picture; a phone label collision. | Four-decimal serialisation; U+2212; the mean label clears the last marker. |

Across all nineteen grammar scenes the always-visible caveat paragraph (64–364 words) became one
visible sentence plus a closed "Scope and caveats" disclosure holding every other sentence
unchanged. Three scenes whose script-free phone print sat 100–190 px low, overlapping the
formula, are anchored with `preserveAspectRatio`. The contract changes are in
[`animation-authoring.md`](animation-authoring.md): the prose budget (rule 6), plain-text number
formatting (rule 5), never spoiling a prediction (rule 7) and four-decimal geometry (rule 9).

## Evidence

- Interaction suite after the pass: 1,087 tests, all passing (1,018 before); every changed scene suite gained
  regression tests that fail against the old player.
- `scripts/audit_excerpt_fixtures.py`, `audit_plan_code.py`, `audit_book_contract.py`,
  `audit_python_sources.py`, `audit_public_anchors.py` and `audit_frozen_stdout.py --base HEAD`
  (133 stdout blocks, 27 units) pass on the working tree.
- Every changed scene was rendered in Chromium at 1280 and 375 px, normal and reduced motion,
  through a standalone assembly equivalent to `filters/mechanism-excerpts.lua`; no page
  overflow, no svg text outside its picture, no console error. Frames were inspected by eye.
- Not done here: a VoiceOver pass, and the two PDF rebuilds (no shared source changed).
  Verify the publishing run and the live anchors before calling this deployed.

## Asset digests after this pass

Computed from the working tree at commit time with `shasum -a 256`; sizes in bytes.
These supersede the asset sizes and SHA-256 values recorded in the individual scene
receipts, which describe each scene as first accepted.

| File | Bytes | SHA-256 |
|---|---:|---|
| `interactives/_template/README.md` | 10,214 | `24615f5ea66633ecc81d9752567dcd6e9086a3e8c26db6bb5406fe424abc2b2e` |
| `interactives/_template/panel.html` | 6,973 | `aea40fa0ea9ba2356f91b13225fc2107c2e1b91c66cb46c5283ab7cd2a88875f` |
| `interactives/attention-bill/panel.html` | 86,163 | `1b48967fa03094133489a5279cdd56a1b550a4efb9e72fe07f0d3801f00fdc99` |
| `interactives/attention-bill/player.css` | 3,813 | `6ae21e43aea53e380e3d9bdef8abea9ed1ca10286f026effeaaeb992cb0643b4` |
| `interactives/attention-bill/player.js` | 18,289 | `49f7a5e32324e897a10c8650dc88abbd675aaca2a6e07044171b5ab4831aec17` |
| `interactives/derivative-gates/panel.html` | 36,503 | `82bbd626a5fd4e13cea42b7207ed79d3354ea742031bc7b72f3127a48968a384` |
| `interactives/derivative-gates/player.js` | 23,463 | `46516976ccb451728f4df85f8990c7c7cdb47203f7155a88c38de78e6851f369` |
| `interactives/gate-product/panel.html` | 67,730 | `195f2073212d7d8eeca6072e2259f644bcbcbda27d87ebe342dd205f34ef66c4` |
| `interactives/greedy-tree/panel.html` | 26,466 | `922982e7d396e9d9c19c270c4953cb8e38d08524820a1666de121621f239218e` |
| `interactives/greedy-tree/player.css` | 3,450 | `f24ff86b20efb2745d0ea169622df6a807599f0ba45c8edaa19cd5d2ab152ab6` |
| `interactives/greedy-tree/player.js` | 24,099 | `a459dc24b469194a13e60ce29ad5d5d54c272869462a566d0f4c5ac674646936` |
| `interactives/hinge-bump/panel.html` | 23,667 | `7a97d3d086473acb0684286e7b9b2a3051560352684f11d93bf985ab61dd0def` |
| `interactives/layernorm-axis/panel.html` | 36,771 | `89fcada470124a905b1a7e99b6dae9cef30aa219bd2eeb2f390193d566ebb4aa` |
| `interactives/layernorm-axis/player.js` | 22,670 | `e1e1eca293168f683920c51b9c848e74abc5333aec9e0f7d59ff36c440e22859` |
| `interactives/lstm-valves/panel.html` | 16,120 | `a09116ea67eb470acc9c6605cb1842905bd05e199022636d45e135aa0af8c4b4` |
| `interactives/mask-before-softmax/panel.html` | 17,364 | `56b16868e0edc338232d55506c993c67d1dead794dce8439da99a2fdbfe0725f` |
| `interactives/mask-before-softmax/player.css` | 3,970 | `03ef00012efaec2017116bfcb8718ec4301e14f71d0a5fd39add938c78a71ba7` |
| `interactives/mask-before-softmax/player.js` | 17,803 | `764837cea5a2dd20a6a0e6c02f47adadaec15ad62d758b180b6c7b995966db50` |
| `interactives/mask-predictor/panel.html` | 44,881 | `524133e17ab89c58d904377e2725f4ce3308c530ef03403afd77827d848882a0` |
| `interactives/mask-predictor/player.css` | 3,350 | `4c7c429acc6f835e11d197192f16657b08aa3872cdd909be4abaae9a6424a57a` |
| `interactives/mask-predictor/player.js` | 15,327 | `e86236eb294938245865e81dd4a99b9a29016e226c823b7dbedbc9dba446dbea` |
| `interactives/one-chain/panel.html` | 15,817 | `bf4f89bc51c0ae0ff11d4abfcdb2143a0769eb090f1cf6724b2ac927d61f6cc7` |
| `interactives/pooling-bins/panel.html` | 17,395 | `69f558e36984363d4333959ef719372fa3216c057f48e9d824e3658a4d3e05ea` |
| `interactives/preference-ruler/panel.html` | 14,709 | `e036eb363d8a606b3bc5fc67414c4a10c5db6f9e80165ccb8b0d5894a628c1e3` |
| `interactives/preference-ruler/player.css` | 2,441 | `67528cf41d9c7e0aeed75602984936a14d34a398ea7d822293dc5a4dbdc0d9a5` |
| `interactives/preference-ruler/player.js` | 15,267 | `25f2c5c6b5dda5b00e037cbfa26fedd5275533bc957b5940b05b713c1cc85ac5` |
| `interactives/quantization-grid/panel.html` | 15,403 | `ca2d2cd33b4dde494b49f2b8174c0d8bcb32b8ebdc5ca709ad692030655b1f2f` |
| `interactives/reference-tilt/panel.html` | 14,533 | `f5cb416e69f38d6025b5794fe54c8b27f52c1af838a8c91ca3343bf4d246a672` |
| `interactives/reference-tilt/player.css` | 3,081 | `9eba21984d9641ab016247740345a0d31043568df6eaa0d29380b0c594770665` |
| `interactives/reference-tilt/player.js` | 15,435 | `bc7e575659cbd014b373fba909f1cf1528c5afd5dd71995e829477b1b1129b58` |
| `interactives/same-subspace/panel.html` | 10,753 | `16495fbc90f479ef61238b0920274aca47cdd7f4aedaf799d666a149ce99e76a` |
| `interactives/same-subspace/player.css` | 3,384 | `b67e6804c518513c00d71afc268d93290c28e4f649fe3b4e9b00cb3f8a4f67a9` |
| `interactives/same-subspace/player.js` | 13,089 | `95f85c9e135842800dde3379035ad2561259cb3c8d9de7d9b117bcad6988ede1` |
| `interactives/scale-granularity/panel.html` | 14,691 | `93d5a4f2ca2515f430db4b50c236e71ff4ce478c057c2fc9e3057426a8b7e870` |
| `interactives/scale-granularity/player.css` | 2,441 | `99f5f959b53c122061092adfe893f2172f086b739a8bae8bd35a08605bf95cc8` |
| `interactives/scale-granularity/player.js` | 21,598 | `08d4cb73cc419779b1e4935915723a346d159b9c2ecf3bf911cb3499c376d3f7` |
| `interactives/score-field/panel.html` | 30,239 | `5729c908a4f3590e3e51f9594b703e826efd8b9bf026c39e92b09f61ec74a83d` |
| `interactives/score-field/player.css` | 3,019 | `25fe17b6c1dc274accd95c7ad19f59e8fec369e81d714960c8d55b218cd23e0d` |
| `interactives/score-field/player.js` | 16,559 | `9edd3e7a164f94bfe615f642f0b25a733a57451df8b959b61803e4f81ce1f063` |
| `interactives/shared/player.css` | 4,348 | `a2df223f36c0635c6107783b3088fd81a9c473027044f40c00759d94aa1a3812` |
| `interactives/softmax-shift/panel.html` | 12,070 | `dc5faed25dd6bef8261687f00bab4a4dc14e0cccc64022df8201830f22222a75` |
| `interactives/svd-circle/panel.html` | 39,417 | `5032c20ad688e2fe40119d350b43b593fdb4df29f946aa975fecec8aa5247385` |
| `interactives/svd-circle/player.js` | 14,765 | `16d5e8daa7dfa9e8d96d77942666257dafb92468823be5ebee52b837c144a391` |
| `scripts/test_attention_bill_excerpt.cjs` | 36,545 | `4a8072e4d229d3ff063779f605d0ce30489f950bf80c0ea2b5c030e88669169d` |
| `scripts/test_derivative_gates_excerpt.cjs` | 45,182 | `3123de51a867a6256939c9a345c806164246b6eb9431e0c29282759bfa4efd28` |
| `scripts/test_greedy_tree_excerpt.cjs` | 33,053 | `e3cd7411be56ae587ca6d9e26aac60d0519ee900ad319c7598aa03f1fcbaeedd` |
| `scripts/test_layernorm_axis_excerpt.cjs` | 31,792 | `7a0575b6d087e847250c17b95d8a74d9db7b6e60c8f549365c163a1fb804a2d6` |
| `scripts/test_mask_before_softmax_excerpt.cjs` | 34,629 | `e291286bf11021d72ff7ba8e296a0f92bc346bddce519506faabb3195e978956` |
| `scripts/test_mask_predictor_excerpt.cjs` | 27,780 | `7f6a399c28270d97c037e6ff34b0eb262819443cc192d5423940e3b4e67fb6fe` |
| `scripts/test_preference_ruler_excerpt.cjs` | 31,316 | `79d3268144cd0b08b6035694ad9b0be36999aef797191debe22a0b85e5449bc6` |
| `scripts/test_reference_tilt_excerpt.cjs` | 34,412 | `b8305fd449ca2b505f78737960c83283865f7272bee7ffab1ec8329768bbbbe5` |
| `scripts/test_same_subspace_excerpt.cjs` | 28,954 | `2eb93eba928efc4e8558782ca8988489e8d1782c5740c90b6d871432085d35b8` |
| `scripts/test_scale_granularity_excerpt.cjs` | 37,196 | `951f66155a155b16957e8d3d4bd61e4943b786c7bf3fe85eee7e09682a7b20b9` |
| `scripts/test_score_field_excerpt.cjs` | 34,421 | `a659c8542c44a12755a141372c52adf85b0c07674ef504c7d4b7d7f55814f54b` |
| `scripts/test_svd_circle_excerpt.cjs` | 22,665 | `aa4ed9efe9cc796ae31e1cea8f3c4aeb92291cfa6d303560e18d0b3097d50534` |
