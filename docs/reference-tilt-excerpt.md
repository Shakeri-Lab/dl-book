# Reference tilt: source and acceptance receipt

Optional HTML-only Chapter 18 scene, requested after publication of the approved
mask/predictor in `d08c41f`. The author **approved publication on September 11**
after inspecting the local preview, and requested the next scene separately.
Its anchor is `18-alignment.html#reference-tilt-excerpt`, inserted immediately
after `cell-fig-reference-tilt` (Figure 18.4), outside Plan → Code. The static
figure and shared manuscript remain authoritative in both editions.

## Source and teaching boundary

Composition follows `GibbsTilt` and `gibbsAt` in the instructor's Chapter 18
`lecture.jsx`, lines 99–100, and storyboard §10, 6:34–7:28. The manuscript's
`reference-tilt-audit` supplies the same positive reference `(0.55,0.25,0.15,0.05)`
and proxy rewards `(0,1,2,3)`. The film supplies composition and reveal order,
not its framework. Four probability bars share one zero baseline. Fixed gray
reference ghosts make movement inspectable; the exact policy is green. Beta
and proxy rewards use neutral ink: no learnable parameter is being adjusted.

One source defect is deliberately not ported: the film's first green bars already
show beta 4, although its opening caption calls them the reference. Here the
opening is reference-only; the exact beta-4 policy is revealed and labeled as
different. The film's additive bar-height offset is also removed.

The policy is evaluated stably as `softmax(log(reference) + reward / beta)`.
Expected proxy reward and KL are computed from that policy, not interpolated
between rounded endpoints. A single reader control varies beta from 0.25 to 4
in steps of 0.05, within the printed table's endpoints. Dragging pauses; a
timeline action restores the authored beta. The forty-second timeline reveals
beta 4, moves to 1, then 0.5, with exact witness holds. The probability axis
does not rescale to exaggerate movement.

The conclusion concerns **expected proxy reward and measured KL drift**.
Individual intermediate response probabilities need not move monotonically.
This is an exact finite-response optimization identity with a fixed prompt,
complete four-response set, positive reference, and fixed reward. It is not a
training replay, a sampling result, or a truth/safety guarantee. No new manuscript
example, numerical experiment, dependency, video payload, or animation engine
is introduced. The transcript and generated wide/narrow static frames retain
the explanation without the player.

## Verification contract

`scripts/test_reference_tilt_excerpt.cjs` independently evaluates the policy
through normalized `reference * exp(reward / beta)` on this bounded range.
It checks normalization, positivity, reward bounds, KL, six-decimal printed
witnesses, true bar heights, common-reward-shift invariance, and the finite
objective-gap identity against alternate policies. Interaction checks cover
deterministic seeking, slider restoration, native keys, reduced motion,
responsive geometry, static-frame parity, and the inherited shared transport.

The printed witness source is
`_freeze/chapters/part5/18-alignment/execute-results/html.json`:

| Beta | Expected proxy reward | KL |
|---|---|---|
| 4 | 0.925670 | 0.029159 |
| 1 | 1.768029 | 0.561398 |
| 0.5 | 2.559982 | 1.693801 |

Acceptance results and browser review are recorded in `docs/CONTINUING.md`.
Do not infer deployment from this local source or from the earlier scene's CI.

Local acceptance (September 11): **41/41** scene checks and **580/580** full
interaction checks pass. Full frozen HTML and structural/source/fixture audits
pass; all 133 frozen stdout blocks remain exact. The final 390-pixel phone and
1119-pixel desktop views, beta-one and final witnesses, native keyboard control,
real playback/pause, and deferred loading were inspected. A white stroke under
probability digits keeps dashed reference outlines from obscuring the moving
labels. Both PDF profiles were also rebuilt: 548 print pages and 519 continuous
pages, with unchanged text, outlines, geometry, and every page raster. Both full
PDF audits pass. Evidence paths are in the handoff. Author review
is complete. Verify the containing commit's publishing run and live anchor before
treating this approved source as deployed.

## Source digests

Lecture paths below are relative to
`/Users/hs9hd/Library/CloudStorage/Box-Box/Teaching/6050/Video_lectures/`.

| Source | SHA-256 |
|---|---|
| `chapters/part5/18-alignment.qmd` | `f9c85024f240099323ba26351691546c2e5f39e461163a4f6c7f89be572d4df8` |
| `6050-Ch18/lecture.jsx` | `b6249e488ae52885878af68311b57b07e064a8e1d1ff97a333e1d94c62ebcd14` |
| `6050-Ch18/STORYBOARD.md` | `ab55d9c8a65e83d285dc6c9a5b68ddfad53022d04fa9901eaf9aca7fc67e11c2` |
| `6050-Ch18/ch18-data.js` | `6d2e39ae7ca6cad71629827bc7c951dfc6f1289f88a1da93aa24e55028e06b16` |
| `audit-ch18-alignment.py` | `5b95d365797a20e5e9948ebd866e921c35f482dac73596ef157cb09d7deb6224` |
| `_freeze/chapters/part5/18-alignment/execute-results/html.json` | `84458e0708a18161b43db7f3bcd36cfc2b57d69d6637b55ee3e63b983b0ae49d` |
| `_freeze/chapters/part5/18-alignment/execute-results/tex.json` | `815fa169d2acb4b8417a9fba0174f20551dc685a33b95333f987fe29c7eeb53f` |
