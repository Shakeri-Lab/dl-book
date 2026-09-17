# Completion mask / next-token predictor receipt

Optional HTML-only Chapter 18 excerpt; author-approved for publication on
September 11, 2026 after the shifted-target revision. The shared manuscript,
frozen outputs and print edition are unchanged. Placement: immediately before
“A preference is a measurement, not a value,” after the completion-only audit.

## Source and boundary

Composition follows `MaskReceipt` in the instructor's Chapter 18 film (`lecture.jsx`,
line 87; storyboard row 4, 1:46–2:30). The manuscript owns the two seven-token rows
and Boolean masks. The film's independently generated sequence scores are not used.
The September 11 feedback pass replaces the small bar glyphs and returning arrows
with aligned input/shifted-target rows and symbolic log-probability nodes. No
probability distribution, score, or model output is invented.

The words are explicitly illustrative aliases, not tokenizer decoding:
`0:[PAD], 1:Explain, 2::, 3:why, 4:birds, 5:can, 6:fly, 7:how, 8:planes, 9:also`.
The exact ID arrays remain in the panel's fixture attributes. Each alias is shared
consistently by both sequences and by its input/target occurrences.

Predictor slot `i` reads target mask `i+1`: active predictors are `[2,3,4]` and
`[1,2,3,4]`. The last prompt predictor therefore counts. The final output has no
next target. Six predictor inputs therefore align with six shifted targets; padding
appears as the final target with a zero mask. Only excluded symbolic outputs change;
prompt inputs and included terms
remain fixed. The helper sums log probabilities; the SFT objective negates and
averages. Counts 3/4 and zero score change are the existing frozen audit's receipts.

## Reading order and checks

Forty seconds; beats at 0/5/10/15/20/26/32/36: predict, shift by one, count row A,
count row B, perturb excluded outputs, reveal zero change, revisit the prompt
boundary, hold. Captions stay under 20 words and last at least two seconds.
One sequence is visible at a time: A for the opening and first count, B for the
second count and entire perturbation/check, then A for the boundary callback.
The two earned counts remain in the receipt. Desktop uses six columns; phone
layout reflows into two strips of three. Each supplied target points upward into
its log-probability lookup, and a separate score path reaches its attached ×0/×1
gate. Muting applies only to excluded scoring branches, never to the input prefix.
The one-slot-shift caption (beat 1) says each output reads the whole prefix through
its slot. Correction, September 17, 2026: this receipt used to call an SVG text line
("Each output uses the prefix through its input slot.") "the caption". It was prose on
the picture, not the caption; the review pass deleted it and moved the idea into the
caption proper.

Hover-driven attention highlighting and a continuous distribution curve were
declined: the former adds a separate mechanism and touch/keyboard state, while
the latter misrepresents a categorical distribution and suggests numerical
evidence the scene does not have. The tracked marker (review pass, below) and the
formula's mask and log-probability highlights connect the relevant predictor/target
pair; the earlier focus box and 17 px dot are gone.
No additional controls, numerical experiment or dependency enters the website.

`scripts/test_mask_predictor_excerpt.cjs` covers independent
synthetic-logit invariance (test-only), wrong-offset detection, delayed visual and
accessible reveals, deterministic transport, reduced motion, narrow geometry, and
complete wide/narrow static-frame parity. Shared transport retains paused opening,
1.5× default, keyboard operation and failed-script fallback. Local desktop/phone
browser verification and the complete test build are recorded in
[the handoff](CONTINUING.md). Author review is complete; verify the containing
commit's publishing run and live anchor before treating the source as deployed.

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

## Review pass — September 17, 2026

Independent review findings, fixed in `interactives/mask-predictor/*` and pinned in
`scripts/test_mask_predictor_excerpt.cjs`. Fixture, beats (0/5/10/15/20/26/32/36),
duration and the A → B → A sequence windows are unchanged. Digests and sizes above are
not re-recorded here.

- **One tracked object.** The focus box plus a dot that moved 17 px in one beat is
  replaced by a single ink marker (ring with a core) that carries the question's answer:
  it rests under the last prompt input "why" (beats 0–1), moves to that slot's output and
  along the side path to the gate of the shifted target "birds" (parked there at beat 2),
  passes ×1 and lands on a new score rail. For contrast the same marker restarts at
  sequence B's prompt slot 0, carries its "changed" output to the ×0 gate and stops
  there, its core emptied (a shape change, not a colour), exactly at beat 5 when "0
  change" prints. On the return to sequence A it runs output → ×1 gate → score in one
  sweep, finishing at beat 7; the static fallback is that landed frame. Every glide that
  leads into a beat ends on it, so an arrow-key seek parks on a finished picture; glides
  inside beat 2 finish two seconds before the cut to B.
- **No flashing.** The sine pulse on the changed output boxes is gone. "changed" and the
  heavier stroke are one held step at beat 4. Inside any beat the only thing that moves
  is the marker (tested by comparing the picture with the marker removed).
- **Score rail and gate shapes.** Each strip has a `score` rail. An open gate's path runs
  through the target box into the rail with an arrowhead; a closed gate's path ends at a
  grey stop bar inside the box and never reaches the rail. Gates are neutral operators:
  ×1 ink, ×0 muted grey. The "0 change" receipt is ink. Wine (`#722f37`, `.mp-error`) is
  no longer used anywhere: neither a ×0 gate nor a zero change is a loss or an error.
- **Labels only on the picture.** The sentence "Each output uses the prefix through its
  input slot." was deleted from the SVG and both static prints; the beat-1 caption now
  reads "Each output reads the whole prefix through its slot. Its next target sits below
  and supplies the mask." (18 words). Role and index share one label ("prompt 2") so the
  marker has a clear resting place under the input box. The output label is "log prob":
  the hyphen in "log-prob." could be read as a minus sign. No hyphen-minus is printed on
  the picture.
- **Announce once.** The SVG `aria-label` describes the picture and no longer repeats the
  caption; the scrubber text names the beat and where the marker is; counts are spoken
  only by the captions ("Three targets count", "four targets count") and shown as the
  earned receipts `A: 3`, `B: 4`, which the player now derives from the declared masks
  (it refuses a fixture whose counts the captions would misdescribe).
- **Phone wrap.** The shifted target sits under its predictor, so the scored route
  (slot 2 → target "birds" → score) stays inside the first strip's third column and lands
  on the first strip's rail; input slot 3 begins the second strip, which has its own
  piece of the rail. Narrow height is 502 (was 482); wide stays 302.
- **Per-frame work.** Geometry, routes, rails and the marker's roads are computed in
  `layout()`; fixture facts (`data-active-predictors`, `data-excluded-predictors`,
  `data-counts`) are written once at mount; beat-dependent attributes are written when the
  beat changes. A frame inside a beat touches only the marker. Marker coordinates are
  serialised at four decimals; the fixture arithmetic is integer and unrounded.
- Transcript items 1–7 in `panel.html` were extended to describe the marker, the rail and
  the stop bar. The intro and boundary paragraphs are untouched.
- Not changed here (outside this pass's files): the Chapter 18 paragraph in
  `docs/animation-authoring.md` still says "Timeline highlighting carries the mechanism";
  it should now name the tracked marker and the score rail.
- **Less prose around the picture.** The boundary now shows one sentence; every remaining scope note,
  unchanged, sits in a closed "Scope and caveats" disclosure beside the transcript. New asset sizes
  and digests for this pass are recorded once in [the review-pass receipt](excerpt-review-pass.md).
