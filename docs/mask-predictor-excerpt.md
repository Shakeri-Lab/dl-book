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

## Value redesign — September 18, 2026

The author's test for every excerpt: replace the animation by its first and last frames side by
side; if a student loses nothing, the motion carries no mechanism. The September 17 scene failed
it. At beat 1 the whole target row appeared already shifted and already gated, and the only thing
that moved afterwards was a marker riding a finished diagram. The one operation that causes the
confusion, the shift, was never shown. Fixture, duration (40 s) and beats (0/5/10/15/20/26/32/36)
are unchanged; digests and sizes above are not re-recorded here.

**Misconception targeted.** "A prompt position has mask 0, so nothing computed at a prompt position
is trained" — the off-by-one of SFT code that reads `response_mask[:, :-1]`. The truth is that
targets are the inputs shifted left by one and the mask belongs to the *target*: the predictor at
the last prompt slot is scored because its target is the first response token.

**What the motion now carries that two stills could not.**

- *The shift is a slide.* In beat 1 a copy of every token card drops below the outputs (5.0–6.0 s),
  rests, and then the whole copy slides exactly one column pitch to the left as one rigid tape
  (6.6–7.8 s): "birds" travels from under slot 3 to under slot 2, "Explain" is cut off at the left
  end of the strip, and the fixture's seventh token `[PAD]` enters on the right. The slid copy then
  stands still for 2.2 s. Only at beat 2 do the copies turn target purple, the row label change
  from "copy" to "target (given)", and the ×0/×1 gates, the routes and the score rail appear.
- *The mask rides on the target.* Every card carries its own role tag (prompt, response, padding)
  inside the card, so the tag is in the group that moves: the reader watches "birds · response"
  come to rest under "why · prompt". At the reveal each gate is printed directly under the tag
  that travelled with it (response → ×1, otherwise ×0). Slot labels are now bare slot numbers; the
  former "prompt 2 / response 3" column headers, which attached the role to the *slot* and so
  restated the misconception, are gone.
- *Prediction before reveal.* The question stands through beat 0 and through the slide and its
  still moment. Until 10 s no gate, rail, route, target arrow, count, target colour or muting is
  drawn (muting is now scoped to a gated row in CSS, so an ungated picture cannot show which
  outputs are excluded), the formula line with its `i+1` is hidden, the marker does not move, and
  neither the svg `aria-label` nor the scrubber text names the answer. The intro sentence above the
  pane no longer says how ×0/×1 is read.
- *The boundary moves as motion too.* At beat 3 sequence B arrives already copied and repeats the
  same slide (15.8–17.0 s); its gates and the earned `B: 4` appear at 17.4 s. The scored predictor
  set visibly moves from slots 2–4 to slots 1–4 with the response start; slot 0 still sits over a
  prompt-tagged target with ×0.
- *Phone wrap.* Each three-slot strip is a window on the same tape. The copy of token 3 leaves the
  second strip by its left end, fading out, while its twin enters the first strip from the right,
  fading in by the same amount, both carrying the same word and role; a dotted ink return path
  (left end of strip 2 → right end of strip 1) is drawn under the tape while the copy is ungated.
  Judged on 375 px and 320 px frames: the hand-off reads as a line wrap.

**Kept from the September 17 pass.** One ink marker carries the last prompt slot's output through
its ×1 gate onto the score rail (now entirely inside beat 2: 10.4 → 13.0 s, then a 2 s hold);
sequence B's contrast; the perturb-excluded-outputs demonstration with the marker stopped, core
emptied, at a ×0 stop bar; neutral gate colours; earned counts `A: 3`, `B: 4`; symbolic
log-probabilities. Marker and tape never move at the same time.

**Removed or changed.** The target row no longer appears ready-made; role-and-slot column headers;
the beat-1 caption's prefix sentence (the idea stays in the boundary's lead sentence and the
transcript); the rule that reduced motion shows each beat's *first* frame. Reduced motion now
shows, per beat, the rest frame inside that beat at which what the caption describes has finished
(9 s, 14 s, 18.5 s for beats 1–3; the beat's first frame elsewhere), so the beat-1 still is the
slid, ungated copy and its caption is true. Captions 1–3 were rewritten (20 words each). The
formula gains `\class{mp-next}` on both `i+1` indices, underlined in ink from the reveal. Wide
height stays 302; narrow height is 510 (was 502). The output boxes are on the picture from beat 0
so that "the predictor" in the question has a referent; they are all drawn alike until the reveal.

**Declared computed variants and drawing devices.** No new number enters the scene.

- The ghost copies and their slide are a drawing device for the manuscript's existing
  shifted-target construction. The audit helper does not build a `labels` tensor; it states the
  shift by slicing: `chapters/part5/18-alignment.qmd` lines 186–187 gather
  `F.log_softmax(logits[:, :-1], dim=-1)` at `index=token_ids[:, 1:].unsqueeze(-1)`, and line 189
  returns `(next_token_logps * response_mask[:, 1:]).sum(dim=1)`. "Copy the tokens and slide the
  copy one slot left, mask attached" is `token_ids[:, 1:]` with `response_mask[:, 1:]` drawn as
  motion. No tensor moves at run time.
- Role tags are the declared mask rows spelt in words, computed at mount: mask 1 → `response`;
  mask 0 before the first response token → `prompt`; mask 0 after it → `padding` (the chapter,
  lines 141–143: "m_t=0 for prompt or padding positions"). A gate is ×1 exactly where the tag says
  response; the suite checks this against the declared masks.
- `[PAD]` entering on the right is the fixture's own seventh token (`token_ids[:, 6] = 0`,
  mask False), not an invented pad. It has no input card because slot 6's output has no next
  target, which is why it enters from outside the strip.
- Active predictors `[2,3,4]` / `[1,2,3,4]`, counts 3 / 4 and the zero change remain the frozen
  audit's receipts, as before. The bezel clip, the opacity cross-fade of the wrap hand-off and the
  dotted return path are drawing devices of the phone layout only.

**Out of scope, unchanged.** No numeric logits, probabilities or sequence scores; no training
trajectory; no attention-visibility claim; the helper's sum is not the SFT objective's negative
mean; the words remain illustrative aliases. No parameter control was added: the response start
takes only the two values the manuscript's fixture declares, so a slider would have to invent
mask rows. The grammar's "one tracked object" is relaxed by design of this brief: the tape is the
tracked object while the targets are built, the marker afterwards, and they never move together.

**Checks.** `node --test scripts/test_mask_predictor_excerpt.cjs`: 52 pass (24 scene tests plus the
inherited transport, beat-hold and grammar suites). New or rewritten tests pin, from the DOM at
named times: copies start exactly under the tokens they copy with the same word and role; the
slide is one rigid, monotone, jump-free leftward motion of exactly one column pitch over many
frames; the ≥ 2 s still; nothing that answers the question exists before 10 s at 0.05 s steps,
both layouts; sequence B's scored set read off the drawn gates; the phone hand-off (twin words and
roles, opacities summing to one, equal leftward offsets, return path in free channels); marker and
tape never moving together; reduced-motion stills that are real rest frames of their own beat and
match their captions; estimated-text-box collisions (labels, cards, routes, stop bars, marker,
picture edge) at seven widths; per-frame writes limited to the marker or the travelling copies;
four-decimal serialisation at a non-round width; both static prints byte-equal to a fresh render.
Nine single-line mutations of `player.js` (a 0.9-slot slide, gates half a second early, the role
read from the slot above, the slide as a cut, no hold, the marker leaving during the slide, no
hand-off fade, muting before the reveal, the unslid reduced still) each fail the suite.
`uv run --python 3.12 python scripts/audit_excerpt_fixtures.py` passes.

**Transfer check.** The panel gains the one closed `details.mechanism-check` that the concurrent
"Check yourself" pass expects of every scene (`scripts/test_excerpt_checks.cjs` requires the
strings "slot 0" and "one slot before" in this scene's answer). It asks whether slot 0 would be
scored if the response began at slot 1. It introduces no number; its visible question does not
settle the scene's own prediction, and the scene suite pins both facts. If that pass brings its
own wording, replace this block rather than adding a second one.

**Not changed here (outside this pass's files).** The Chapter 18 paragraph in
`docs/animation-authoring.md` and the manifest's `computedVariants` do not yet mention the
travelling copy; suggested sentences were handed to the author with this pass.
