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
timeline action restores the authored beta (as shipped on September 11 a modified
key that was *not* a timeline action also ended the drag; fixed in the review pass
below). The forty-second timeline reveals
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
probability digits was meant to keep dashed reference outlines from obscuring the
moving labels; the September 17 review showed it did not (a dashed top edge still
struck through a label whose bar was shorter than its reference), and label
placement now does that job — see the review pass below. Both PDF profiles were also rebuilt: 548 print pages and 519 continuous
pages, with unchanged text, outlines, geometry, and every page raster. Both full
PDF audits pass. Evidence paths are in the handoff. Author review
is complete. Verify the containing commit's publishing run and live anchor before
treating this approved source as deployed.

## Source digests

Lecture paths below are relative to
`/Users/hs9hd/Library/CloudStorage/Box-Box/Teaching/6050/Video_lectures/`.

| Source | SHA-256 |
|---|---|
| `chapters/part5/18-alignment.qmd` | `b06f6782462ebd46a0895d1db603d00790a0f675f6b38f71a005302c320e2b87` |
| `6050-Ch18/lecture.jsx` | `b6249e488ae52885878af68311b57b07e064a8e1d1ff97a333e1d94c62ebcd14` |
| `6050-Ch18/STORYBOARD.md` | `ab55d9c8a65e83d285dc6c9a5b68ddfad53022d04fa9901eaf9aca7fc67e11c2` |
| `6050-Ch18/ch18-data.js` | `6d2e39ae7ca6cad71629827bc7c951dfc6f1289f88a1da93aa24e55028e06b16` |
| `audit-ch18-alignment.py` | `5b95d365797a20e5e9948ebd866e921c35f482dac73596ef157cb09d7deb6224` |
| `_freeze/chapters/part5/18-alignment/execute-results/html.json` | `84458e0708a18161b43db7f3bcd36cfc2b57d69d6637b55ee3e63b983b0ae49d` |
| `_freeze/chapters/part5/18-alignment/execute-results/tex.json` | `815fa169d2acb4b8417a9fba0174f20551dc685a33b95333f987fe29c7eeb53f` |

## Review pass — September 17, 2026

Fixes for an independent review, made on top of `c06892f` (uncommitted working
tree at the time of writing). Fixture, `data-duration` (40), `data-beats`, the
boundary and intro paragraphs, and every witness value are unchanged. Digests and
byte sizes above are deliberately not re-recorded here; a later pass records them.

- **State bug.** The scene's capture-phase `keydown` handler cleared the slider
  override on Arrow/Home/End without the transport's guard
  (`interactives/shared/playback.js`: ignore `altKey`/`ctrlKey`/`metaKey`, and an
  auto-repeated Space/K). Alt+ArrowLeft therefore sought nothing, the panel still
  said `data-override="slider"`, and the next resize snapped beta back to the
  timeline. The handler now mirrors that guard exactly, so the drag ends only when
  the transport really acts. Shift+Arrow, which the transport does act on, still
  ends it.
- **One announcement.** Beta, expected proxy reward and KL used to be written every
  frame into the svg `aria-label`, the slider's `aria-valuetext` and the scrubber's
  value text. Only the slider's `aria-valuetext` carries them now (it also says what
  the value does). The svg label is one generic sentence before the reveal and one
  after, written only when it changes. The scrubber names the timeline's beat
  ("Hold at beta one", "Glide to beta one half", …) and nothing else, so it stays
  true while the dial is on a detour. The visible beta readout is `aria-hidden`
  while the player runs and readable in the script-free panel.
- **Fewer, quieter numbers.** Beta is drawn once, as `β = 0.50` beside its slider;
  the `Beta = …` label on the picture is gone. Because the slider is hidden and
  inert before the player mounts, only its track is hidden now: the readout stays
  visible and is what identifies the static prints' beta (hand-written `0.50` in
  `panel.html`, pinned by the suite to the final frame's readout). The two gauge
  numbers read to three decimals during a glide and whenever the dial is dragged,
  and to the manuscript's six only at the three witness holds (beta 4, 1, 0.5),
  where they match the figure caption and the frozen audit table. They are
  left-aligned so the three extra digits extend to the right without moving the
  digits already read. Probabilities stay at three decimals. At most seven live
  numbers are on screen.
- **Label collision.** A probability label rode its live bar's top, so a bar
  shorter than its reference (B at 24 s, beta ≈ 0.9, "0.186") was struck through by
  the dashed outline. Each label now sits 7 px above `max(bar top, reference top)`.
  The rule is continuous in beta, so no label jumps during a glide. Checked at
  240–713 px for every slider value and along the timeline.
- **Gauges.** Expected proxy reward and KL are a stacked pair of horizontal gauges
  under the bars, sharing one origin and one length, so both fills visibly lengthen
  together as mass drains from A toward D. Scales are fixed and come from the
  declared fixture only: reward from the smallest to the largest declared score
  (`data-rewards`: 0 to 3), KL from 0 to `−ln(min π_ref)` (`data-reference`:
  `ln 20`, the least upper bound of KL to this reference). A dashed mark on each rail
  — drawn like the reference outlines — is the reference itself: its own expected
  score `Σ π_ref r` and zero drift. No scale end, and neither of those two derived
  values, is printed: the picture shows no number that is not already in the
  manuscript. The empty rails are scenery during the prediction beat; fills and
  numbers appear with the policy at 5 s. The final beat's two underlines were
  removed with the bare numbers they decorated. No second control was added.
- **Reduced motion.** A glide beat (10–18 s, 22–30 s) used to rest on the state it
  was leaving, under a caption about redistribution. It now rests on the finished
  glide (three decimals); the following hold adds the six-decimal witnesses.
- **Per-frame work and serialisation.** Everything that depends only on the fixture
  and the measured width (viewBox, axis, legend, reference outlines, labels, rails,
  reference marks) is placed at mount and on resize, not per frame. Drawing
  coordinates are serialised at 0.0001 px; they were raw doubles, which a last-bit
  `exp`/`log` difference could have changed in the byte-compared static prints. The
  published state (`data-beta`, `data-policy`, `data-reward`, `data-kl`) is
  unrounded, and the gauge scales are published on the root (outside the static
  print) as `data-gauge-scales`. Printed numbers go through one formatter that uses
  U+2212 for a minus sign; this fixture prints none.
- **Suite.** `node --test scripts/test_reference_tilt_excerpt.cjs`: **49/49** (41
  before). New tests: ignored keys (three modifiers × seven keys, auto-repeat, a
  key aimed at another control) followed by a resize; one-place announcement
  including a forced transport redraw mid-drag; beta drawn once and the 3/6-decimal
  rule on the timeline and the dragged path; label clearance and continuity; gauge
  geometry on the book's fixture, a permuted fixture and the +37 shift; room for
  gauge names and numbers at every width; reduced-motion rests; coordinate
  precision. Each new test was confirmed to fail against the corresponding old
  behaviour. `scripts/audit_excerpt_fixtures.py` passes and
  `render_static_frames.cjs reference-tilt --check` is current.
- **Seen.** Rendered in Chromium at 1280, 375 and 320 px viewports (figure 713, 302,
  247 px) at 2, 7, 11, 14, 17, 20, 24, 27, 31, 34, 37 and 39.9 s, with and without
  reduced motion; the script-free fallback at both widths; and a real mouse drag
  to beta 2.25 followed by Alt/Ctrl/Meta keys and a viewport resize, which left
  beta at 2.25. No page overflow, no svg text outside the picture, no console
  errors.
- **Less prose around the picture.** The boundary now shows one sentence; every remaining scope note,
  unchanged, sits in a closed "Scope and caveats" disclosure beside the transcript. New asset sizes
  and digests for this pass are recorded once in [the review-pass receipt](excerpt-review-pass.md).
