# Greedy versus beam: the best next token can lose the sequence

September 13, 2026. **Author-approved for publication.** After approving
derivative gates, the author explicitly chose “Add the shared example, then
animate it.” The static Chapter 11 addition belongs to both HTML and PDF. The
optional animation explains that same example; it does not replace it.

The author reviewed the prefix-lessons revision and requested “push.” Publication
checks are recorded in `/tmp/dl-book-greedy-publication.VqOPxU/`; source approval
does not imply successful Pages deployment. The content date is September 13 and
both derived PDFs are rolling post-v1.3 builds. The v1.3 citation and tag stay fixed.

## The source gate is now explicit

Chapter 11's existing date-model outputs contain complete-sequence scores, not
the token probabilities needed to reconstruct a branching search. They are not
repurposed as a greedy-fails example. Instead, the author approved the small
constructed decoder from `SGreedyTree` and `toy_search_tree_evidence` in the
instructor materials. The source table `tbl-greedy-tree` names every conditional
and its complementary alternative. The optional player follows the existing
beam-search code, outside its Plan → Code panel, before the H3 **Search exposes
alternatives**. It uses the existing manifest heading insertion, not a new filter.

Independent rational arithmetic, checked with the `verify-math` helper, gives
`(3/5)(11/20)(4/5)=33/125=0.264` and
`(2/5)(19/20)(19/20)=361/1000=0.361`. At the second step, beam two retains
prefix masses `0.38` and `0.33`; aggregate omitted masses `0.27` and `0.02`
bound every competing prefix below those branches. Next, its EOS candidates
are `0.361` and `0.264`, above the omitted masses `0.066` and `0.019`.
Every completion below an unexpanded `other` branch has probability at most
that prefix's mass. The maximum such mass is `0.27`, below `0.361`. Grouping
unspecified alternatives therefore cannot change the demonstrated top-two choices.
This proves the winner for this tree, not a universal guarantee for finite beams.

## Motion and boundary

One branching picture, fixed decoder probabilities throughout. First follow the
greedy path and retain its discarded alternative in view. Reveal the complete
products only after traversing their factors. Then reset the inspection frontier,
not the decoder, and keep two prefixes alive through expansion and pruning.
The learner predicts: **can winning the next token lose the complete sequence?**

The film's composition and reveal order are ported as native SVG, not its React
runtime. Forty seconds, eight five-second beats, initially closed/paused, 1.5×,
silent, reduced-motion holds, shared keyboard/scrub/fullscreen controls, transcript
and generated wide/narrow static fallbacks. No parameter slider or training replay.
Phone layouts turn the two horizontal rails into two vertical rails instead of
shrinking a slide. Probabilities denote model predictions; labels and solid/dashed
paths must retain meaning without color. Raw arithmetic stays unrounded in state;
only SVG geometry and deliberately formatted display values are serialized.

### Seeds for later decoding topics (September 13 author feedback)

The revision replaces generic node/edge emphasis with three small cues on the
same tree: blue supplied-prefix nodes and `given A` / `given B` edge labels;
discrete depth labels beside the unchanged beam width; and one explicitly
**top choice** beside a **runner-up** when one answer is requested. The
timeline, fixture, arithmetic and controls do not change. The transcript makes
the consequence inspectable: the `0.95` on the B-to-y edge cannot be moved to
the A branch. No added parameter, invented probability or performance animation.
The chapter helper still returns its ranked list for inspection; the conditional
one-answer ending does not redefine that code's interface.

These are conceptual preparations, not assertions that beam search is speculative
decoding. Keep method names out of the early scene and record their eventual
payoff here. Primary sources checked on September 13, 2026:

- [Gloeckle et al., *Better & Faster Large Language Models via Multi-token Prediction*](https://proceedings.mlr.press/v235/gloeckle24a.html)
  changes the prediction task to several future positions. The seed is the
  distinction between alternatives at one position and positions farther ahead.
  Beam width is neither the number of prediction heads nor a drafting horizon.
- [EAGLE, §§3.1/3.3](https://arxiv.org/html/2401.15077v2) separates feature-based
  drafting from target-model verification. [EAGLE-2, §4](https://arxiv.org/html/2406.16858v1)
  adapts the draft tree and restricts tree attention to ancestors. The seed is
  prefix ownership plus candidate-tree geometry, not an equivalence of algorithms.
- [DSpark, §§2.1/3](https://arxiv.org/html/2607.05147v1) couples a parallel backbone
  to lightweight sequential conditioning and schedules verification using
  estimated prefix survival and hardware cost. The seed is that future positions
  depend on the actual preceding choices; how far to compute and what work to
  retain are separate decisions. No timing or acceptance rate is inferred from
  Chapter 11's toy tree.

A later treatment must introduce the proposal/target distributions and the
verification/correction rule explicitly. Beam ranking changes the selected path;
exact speculative sampling preserves the target sampling distribution. Neither
`0.361` nor any other displayed joint probability is an acceptance probability.
Parallel-looking rails make no claim about model calls or wall-clock speed.
The three cues interpret the already shared example, so this pass changes no
QMD, frozen Markdown, or PDF content. The research harvest remains a backlog item.

`BookGreedyTree.buildState(time, reduced=false, source=fixture)` reads
`{root:[0.60,0.40], next:[0.55,0.95], eos:[0.80,0.95]}` from the panel. It derives
complements, prefix masses, cumulative log scores, pruning decisions and the
omitted-branch bound. No missing continuation is invented. Alternative fixtures
must satisfy the stated small-tree search contract; unsupported fixtures fail closed.

## Retained execution evidence, not a new training run

This is a static prose/table addition. A one-off guarded refresh inserted exactly
the same prose into the QMD and its two stored Quarto Markdown results, preserving
all executable cells, options, output blocks, image references and non-Markdown
metadata. Only the input hash was updated to Quarto's LF-normalized MD5.
The refresh is **not** claimed as re-execution or numerical regeneration.

Implementation and before/after receipt:
`/tmp/dl-book-greedy-draft.1B5W73/apply_retained_evidence_refresh.py`.
The same directory retains `wrap_equation.py` and `clarify_aggregate.py` for the
two mirrored review corrections. They preserve the same code/output boundaries.
The guards require the `00c0730` baseline, unique insertion anchors, exact reversal
of all insertions, all 13 QMD fences and all 16 frozen fences per format unchanged,
and unchanged non-Markdown serialization except that source hash. All 133 stdout
blocks across 27 units and all HTML/TeX pairs remain exact against `00c0730`.
No runtime, tolerance, scheduled task, release tag, or trained-model claim changes.

## Source receipts

Lecture paths are relative to
`/Users/hs9hd/Library/CloudStorage/Box-Box/Teaching/6050/Video_lectures`.

| Source | SHA-256 |
|---|---|
| `chapters/part3/11-encoder-decoder.qmd` | `ee14ea5a5425d09c46c101a02619bb5c4b7ac0a1bcb753cf76104eea282249f9` |
| `_freeze/chapters/part3/11-encoder-decoder/execute-results/html.json` | `429737532785f59bbdb71edb70c6c381395702a0451e482be84463676f0b85bf` |
| `_freeze/chapters/part3/11-encoder-decoder/execute-results/tex.json` | `6d238b86b8b33fc244264b3428996d795b56c8a331f4b460cdf5fee52031476a` |
| `6050-Ch11/lecture.jsx` | `00fc79dc8dee86830a59f74a91e43401c855e93638b9384a46395266b6d3271c` |
| `6050-Ch11/STORYBOARD.md` | `adc6589888ed6c7e76c1a88a43069ef2c54ab043edbf18274650894caea0358e` |
| `audit-ch11-encoder-decoder.py` | `31dbfd38476c00e7c971bf230a10308c6d3a6a612a3f06580b2c822450c49ba3` |

## Acceptance

The seed-cue revision passes 44 scene tests and 1,018 full-suite tests:
`/tmp/greedy-tree-seeds-all-tests.log`. The original preview's 40/1,014-test
receipts remain `/tmp/greedy-tree-final-tests.log` and `/tmp/greedy-tree-all-tests.log`.
Independent checks cover normalized conditionals, accumulated edge logs,
EOS accounting, omitted-prefix bounds, alternate fixtures, deterministic seek,
frontier/edge geometry, native-width reflow, shared transport, reduced motion,
deferred loading, keyboard operation and static fallback equality. New guards
bind the blue history and conditional labels to their actual parent path, separate
width from earned depth, and preserve the ranked-list helper contract while
showing a single top choice. No acceptance-probability semantics are introduced.

Plan → Code and Python audits pass (194 visible surfaces; 95 execution-only
cells; 285 parsed cells, four transclusions and 21 modules). Source book,
anchor and excerpt-fixture audits pass; the latter covers 22 scenes, 134 literals
and 78 computed variants. All 133 frozen stdout blocks and 27 HTML/TeX pairs
remain byte-exact against `00c0730`. Chapter 11 Pandoc LaTeX is byte-identical
with and without the HTML-only insertion filter:
`/tmp/greedy-tree-{plain,filtered}.tex`, SHA-256
`b4685101c45d1cb79a4ba8566da977075af7b1e472289b9011751b8d851ae5bb`.

Notebook export completes without executing anything. Its audit reports only
the two expected provenance guards for the uncommitted Chapter 11 source (public
and reference notebooks differ from their pinned `00c0730` source). Do not
disable the guard: re-export with the new commit SHA after author approval.
Logs: `/tmp/greedy-tree-notebooks-{export,audit}.log`. This is not a claim of
fresh numerical validation.

Both full PDF profiles pass the existing geometry, text-layer, missing-character
and retained-log audits. Print remains **548 pages**, with all 67 chapter/unit
starts unchanged. Continuous increases **519 → 520**; Chapter 11's physical span
extends 223–237 to 223–238, and later unit starts shift by one. Both outlines grow
390 → 391, and every destination is verified. The new search heading lands on
physical page 253 (print) and 235 (continuous). The exact outline invariant and
rolling download count follow these measured changes; stable v1.3 notes and tags
remain untouched. Complete receipts: `/tmp/dl-book-greedy-pdfs.3sJY0U/`, including
`page-review.json`, `unit-start-diff.json`, both audit logs and final page PNGs.

The main reviewer inspected print pages 251–253 and continuous pages 233–235 as
PNGs: the shared table, green four-line products, code and following heading are
clean. Final PDF SHA-256:

- Print: `071f1922cc7b615b32de76544036d231b475d2c0d2059b3a69dc8383563796ed`.
- Continuous: `d1e0bc3eda9b969c09b52f3d05ae9ddbde2c582c21a938090b531e96f167ed8c`.

Canonical HTML rendered last (`/tmp/greedy-tree-final-html.log`). The 37-page
asset/metadata and rendered-anchor audits pass. Browser review at 1280, 390 and
320 pixels confirms readable equations, native-width tree reflow, no page overflow
or MathJax errors, closed/deferred normal navigation and paused direct anchors.
A narrowly scoped table rule keeps token labels such as `<bos>` intact at 320px.
Greedy's missed path, the final beam ranking, complete 1.5× playback, Replay,
keyboard seek and native fullscreen entry/exit were inspected. The preview is
left paused at zero. No new browser runtime or dependency is introduced.

Follow-up seed-cue revision: canonical HTML rebuilt in
`/tmp/greedy-tree-seeds-html.log`; the seven source/rendered/stdout audits pass.
The QMD, both stored Markdown files and both PDF SHA-256 values above remain
exactly unchanged from the original preview. No new PDF render or numerical
execution is claimed for this HTML-only refinement.
The revised final and depth-two frames were visually inspected at desktop,
390px and 320px widths: no horizontal page overflow or MathJax errors.
(Corrected September 17, 2026: that inspection also recorded "no label
collisions", which the independent review showed to be false. On the phone
layout every vertical rail ran through the joint label above its node, and on
the desktop the winner ring cut `#1 p 0.361`. See the review pass below.) Real playback advances, pause preserves position, and fullscreen
controls work. The preview is left open at its direct anchor, paused at zero,
with the temporary viewport override cleared. Independent final review confirms
the ranked-list return contract and the absence of speculative-verification claims.

Review: `http://127.0.0.1:8770/chapters/part3/11-encoder-decoder.html?preview=prefix-lessons#greedy-tree-excerpt`.

Author review is complete; publication must pass the existing gates. Derivative gates was pushed
separately as `00c0730`; run `34770754602` failed before deployment: Chapter 8
bootstrap HTTP 503 and the known Chapter 18 exact-output signed-zero difference.
No retry or gate change; monitoring stopped. Receipt:
`/tmp/dl-book-derivative-pdf-approval.j8b72q/derivative-live.KO8Jo9/outcome.md`.

### Publication checks after author approval

The final suite passes 1,018 tests (`interactions-final.log`, including 44 focused
tests). Source, fixture and exact frozen-output audits pass (`source-audits.log`):
133 stdout blocks and 27 HTML/TeX pairs remain unchanged from `00c0730`.
These receipts live in `/tmp/dl-book-greedy-publication.VqOPxU/`.

Both complete PDF profiles stabilized after two renders, with 548 print pages,
520 continuous pages and 391 valid outline entries each. Geometry, text-layer,
accessible icon text and retained-log glyph checks pass (`print-audit.log` and
`continuous-audit.log`). Compared with the approved example preview, only the
title and preface changed: print pages 3/16 and continuous pages 2/13. All other
page rasters, word geometry, unit starts and outlines match (`comparison.json`).
The main reviewer inspected those four changed pages and the Chapter 11 example
and code pages in both profiles. No clipping or new layout defect was found.

Local publication PDF SHA-256 values (not a claim of cross-platform byte identity):

- Print: `280183b4b7b6c2a96b6c27c51e62efed8b444ed2fc4fa79d13d0943e9427c476`.
- Continuous: `6a858e66669e1ec9128b713989426c8c0575b2b7d916a0da14374cdd7c7619d3`.

The title and colophon now distinguish the rolling conversion from the fixed
v1.3 citation. Tags, experimental code, numerical gates and the paused runtime
migration remain untouched. Source publication and live deployment are separate
checks; a failed notebook job must not be bypassed to deploy this scene.

Canonical HTML was rendered last (`html-render.log`); all 37 pages pass support-
asset and metadata checks, public anchors resolve, and frozen stdout remains exact
(`rendered-audits.log`). Final browser inspection confirms the supplied-prefix
labels, top-choice/runner-up ending, working 1.5× playback/pause/reset, no math
errors, and no horizontal page overflow. The preview remains paused at zero.

## Review pass — September 17, 2026

An independent review found the scene sound and its numbers right, and listed four
presentation defects. Fixture, timeline (`data-duration` 40, eight beats), captions,
transcript, boundary paragraph and arithmetic are unchanged. No QMD, shared file,
manifest or other scene was touched.

- **Phone layout: edges struck through labels.** With the rails vertical, each joint
  label sat centred above its node, exactly where the incoming rail passes; the
  `0.60`/`0.40` labels sat on the BOS diagonals; `given A x` crossed its rail. Now
  every narrow label stands on the *outer* side of its rail (left of the left column,
  right of the right one) at native 13/12 px: the joint above the node beside the
  rail, the rank (`#1`, `#2`) as its own label beside the node, the edge factor and
  its `given …` context right- or left-aligned against the rail. First-token factors
  are pushed along the outward normal of their diagonal until the label box clears
  the line, in both layouts. Rails moved from 25 %/75 % to 28 %/72 % so the widest
  outer label (`given A x`) fits a 240 px picture; the two `other` stubs keep their
  text off both rails; the narrow depth guides stand just above their row, where two
  resting rings leave room. Desktop: joints are raised 5 px so the ring (r = 27)
  clears `p 0.361`, the rank follows the joint on its right (on the left it met the
  B diagonal), and the first column keeps at least 132 px from BOS so the B diagonal
  arrives under B's label at the narrowest wide pane.
- **Picture description.** The svg `aria-label` named candidates by internal ids
  (`Retained: ByEOS, AxEOS`). It now joins each candidate's tokens: `Retained: B y
  EOS, A x EOS`. `EOS`, not `<eos>`: it is what the node, the transcript and the same
  label's "If one answer is requested: B y EOS" already say, it reads aloud sensibly,
  and a raw `<` inside the attribute would break the `[^>]*` tag patterns in
  `render_static_frames.cjs`. The joint probabilities were also announced twice (svg
  label and scrubber `aria-valuetext`); the scrubber now names the beat and the
  number of retained candidates, and the picture alone speaks the numbers.
- **Clutter at the limit.** The final frame printed 22 probability labels, all green.
  Nothing was removed. A number now carries `data-emphasis`: the newest depth is
  `live` (green); older factors, joints and bounds stay but `muted` (grey, 12 px); at
  the two comparison beats only the completed scores, their ranks and `0.361 > 0.264`
  are `score` (green, bold). At most eight numbers are emphasised at any instant
  (beat 6: two factors, two joints, two ranks, two bounds); the limit frame
  emphasises five labels. `other` stubs remain bounds (`other 0.45`, `≤ 0.270`),
  never tokens. The blue `given …` cues keep their colour: blue is the supplied
  history, an author-approved cue, not a probability.
- **Formula line.** The product and log-sum spans wrap to two lines at 302 px and the
  log-sum breaks once more at 247 px. They sit in normal flow under the svg; the
  comparison and bound summary end 14 px inside the picture, so they cannot meet.
  The reserved `min-height` and `visibility: hidden` keep the caption from jumping.
- **Found while looking: the script-free phone print was displaced.** The static svg
  keeps the wide `713 × 490` viewBox while `player.css` reshapes its box to
  `296 / 650`; the default `xMidYMid` centred the viewBox in that tall box, leaving
  a blank band of about a third of the picture above the narrow print and pushing the
  same amount out of the bottom, over the formula and caption. The svg now declares
  `preserveAspectRatio="xMidYMin meet"` (the gate-product scene's remedy). Live
  playback is unaffected: its viewBox already matches its box.
- **Per-frame work.** The declared fixture is evaluated once and frozen; every printed
  number is written at mount; geometry is computed in `layout()` on a width change;
  stage-dependent visibility and emphasis are repainted only when the beat changes. A
  frame within a beat moves the frontier ring(s) and nothing else. The fixture-only
  `data-*` publications are written once, not re-serialised sixty times a second.
- **Coordinate serialisation.** Geometry-only rounding went from `toFixed(9)` to
  `toFixed(4)` (0.0001 px). The mathematical state is still never rounded. Churn: two
  tolerances in the edge-endpoint test moved from 1e-8 to 1e-3.

Tests: the scene suite grows from 44 to 52. New: a geometric regression over eleven
widths (240–1280, both layouts), twenty-one times and reduced motion — no estimated
label box within 2.5 px of any tree edge or `other` stub, none cut by a resting
frontier ring, none overlapping another label, none outside the picture — using the
gate-product suite's advance estimate (0.6 em a glyph at the label's CSS size) since
JSDOM lays nothing out; run against the pre-review player it reports exactly the
reviewed collisions (six joints, `0.60`/`0.40`, four contexts on the phone; the two
diagonal labels and the ring through `#1 p 0.361` on the desktop). Also new: beats
park every ring on a node; outer-side placement; the emphasis ledger per beat and the
"nothing removed" inventory; token-named, once-only announcements; only the frontier
moves within a beat; the comparison stays inside the picture; the script-free narrow
print is top-anchored. `scripts/audit_excerpt_fixtures.py` passes.

Looked at, not only tested: Chromium frames at 1280, 640, 375 and 320 px viewports
(figure 713, 546, 302, 247 px) at 2, 7, 12, 14, 17, 22, 24, 27, 32, 34, 37 and 39.9 s,
the same with reduced motion at 1280 and 375, and the script-free fallback at 1280
and 375. No page overflow, no svg text outside the picture, no console errors.
Recorded SHA-256 values and byte sizes above are left for the pass that records new ones.
- **Less prose around the picture.** The boundary now shows one sentence; every remaining scope note,
  unchanged, sits in a closed "Scope and caveats" disclosure beside the transcript. New asset sizes
  and digests for this pass are recorded once in [the review-pass receipt](excerpt-review-pass.md).
