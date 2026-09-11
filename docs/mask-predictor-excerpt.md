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
The caption explicitly says the output uses the whole prefix, not only one token.

Hover-driven attention highlighting and a continuous distribution curve were
declined: the former adds a separate mechanism and touch/keyboard state, while
the latter misrepresents a categorical distribution and suggests numerical
evidence the scene does not have. Timeline highlights still connect the relevant
predictor/target pair with the mask and log-probability terms in the formula.
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
