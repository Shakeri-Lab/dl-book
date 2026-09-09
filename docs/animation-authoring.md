# Mechanism animations: reference and authoring contract

Author-approved September 9, 2026. These are optional HTML explanations of existing
book examples, not videos, new experiments, or a replacement for the static book.
The convolution player shipped in `304f3d4`; kernel weighting and the revised BERT
ledger are approved for the next publication. Check the publishing run and live
anchors before treating an approved source change as deployed.

## The three examples

| Location | What the reader follows | Teaching boundary |
|---|---|---|
| [Chapter 7: convolution](https://shakeri-lab.github.io/dl-book/chapters/part2/07-filters-convolution.html#convolution-excerpt) | Place a patch, multiply matching entries, add the products, write one output, then slide. | This is the existing Exercise 1 walkthrough. The kernel is fixed and unflipped; no training, padding, bias, or activation is added. |
| [Chapter 12: kernel weighting](https://shakeri-lab.github.io/dl-book/chapters/part4/12-kernel-regression.html#kernel-weighting-excerpt) | Distance becomes Gaussian affinity, then normalized influence, weighted values, and one prediction. Only afterward does the query move. | Observations and bandwidth remain fixed. These are computed weights, not learned similarity or uncertainty. |
| [Chapter 15: BERT masking](https://shakeri-lab.github.io/dl-book/chapters/part4/15-bert-pretraining.html#bert-ledger-excerpt) | Keep originals beside input copies; follow the input through prediction and the saved target separately into the loss. Compare masked, replaced, unchanged-selected, and unselected positions. | Selection, corruption, and attention visibility are distinct. No predicted token, probability, or measured loss is fabricated. |

### Convolution: expose the multiply-and-add

The manuscript's four-by-four input and three-by-three vertical Sobel kernel give
four valid output positions. A representative input/kernel pair sends rays into
an explicit multiplication point and then its product. The next phase draws all
nine product rays into an addition point and on to the current output. The entire
sum stays readable, including zero terms. Unwritten outputs are not shown as zeros.
Only the patch position moves continuously; arithmetic changes at phase boundaries.

The compact two-by-two arrangement reserves space for the operator nodes. Rays
are measured from the actual cell positions and remeasured after resize or
fullscreen. They disappear while the patch is being placed or moved.

Fixture, source hashes, phase order, and checks:
[convolution receipt](convolution-excerpt.md),
`chapters/part2/07-filters-convolution.qmd` (Exercise 1), and
`scripts/test_convolution_excerpt.cjs`.

### Kernel weighting: reveal the calculation before moving the query

Reuse the `fixed-gaussian-attention` witness from Chapter 12: keys `(1, 3, 5)`,
observed values `(1.5, 2.8, 1.8)`, and bandwidth `0.6`. Ask which observation gains
influence as the query moves. Reveal distances, affinities, their shared
denominator, normalized weights, products, and sum in that order. Then sweep the
query across the observations and return to the printed `q = 3.5` witness.

Every displayed quantity is recomputed from the current query using unrounded
weights. The tests independently check normalization and the observed-value-range
bound. Unrevealed values are withheld, not replaced by false zeros. Observation
circles, the prediction diamond, labels, and influence bars complement color.
At phone widths the calculation cards stack and the plot measures its container.

Fixture, source hashes, timing, and checks:
[kernel/BERT receipt](kernel-bert-excerpts.md),
`chapters/part4/12-kernel-regression.qmd`, and
`scripts/test_mechanism_excerpts.cjs`.

### BERT: separate what is read from what is scored

The existing twelve-token `mlm-policy-ledger` fixture supplies all five Boolean
rows. Keep the original above each input copy throughout. Corruption applies to
the whole sequence together; moving the outline changes the explanatory focus,
not the encoder's input. Masked `quiet`, randomly replaced `rose`, unchanged but
selected `today`, and unselected `bank` expose the different cases. The visible
replacement `bank` is explicitly illustrative, not an executed random sample.

Within each case, reveal three forward paths: input to prediction, saved original
to loss, and prediction to loss. Only after both loss routes arrive does the
answer appear. This lets the reader first predict whether an unchanged selected
token counts. The prediction card stays symbolic; the loss shows only its symbolic
negative-log-probability term. These rays explain dataflow, not backpropagation or
the time required to run BERT.

All nonpadding input copies remain available as context. “Chosen” labels are
reader/training bookkeeping, not extra model features. Original targets are not
additional encoder inputs; the unchanged branch deliberately leaves its answer
visible. Unselected positions supply context without a direct MLM term. `[SEP]`
is visible but ineligible; padding is blocked as an attention key. The miniature
fixture illustrates branches, not exact population percentages.

The five flags live in a secondary, closed **Inspect the five Boolean ledgers**
panel. Short captions remain stable as rays appear. The transcript, fixture,
source hashes, and checks are in the [kernel/BERT receipt](kernel-bert-excerpts.md),
`chapters/part4/15-bert-pretraining.qmd`, and
`scripts/test_mechanism_excerpts.cjs`.

## Reusable design rules

1. **One question, one mechanism.** Begin with a prediction; reveal its answer
   through a visible operation. Aim for about forty content seconds, not a slide
   deck condensed onto a web page. Timing is presentation, never performance data.
2. **The manuscript owns meaning.** Reuse its fixture, notation, loss convention,
   and boundary. Instructor scenes can guide composition and reveal order; record
   their exact source receipts. Do not import their framework or off-page narration.
3. **Keep the book light.** Use local HTML/CSS/SVG and small scene scripts. No video
   payload, iframe, frontend framework, animation engine, fonts, or analytics are
   needed. Load scene code only when the optional disclosure opens.
4. **Closed and paused initially.** Direct anchors open the relevant disclosure
   without autoplay. Keep one on-pane bar: Play/Pause (Replay at the end), scrubber,
   time, speed, and fullscreen. Default to 1.5x; retain keyboard navigation without
   taking native controls' keys. Pause on close, tab hiding, page exit, or Escape.
5. **Derive frames from time.** Scrubbing to a time must reconstruct the same values,
   focus, and geometry, regardless of playback history. Preserve fractional time
   through pause/speed changes. Use elapsed time, not an assumed frame rate.
6. **Reflow, then measure.** Stack cards or wrap token columns at narrow widths;
   remeasure ray endpoints after layout changes. Do not shrink a whole lecture
   slide. Reserve gutters so lines and operator nodes do not cover text.
7. **Keep meaning accessible.** Blue inputs, purple targets, green predictions,
   wine losses/errors, neutral fixed operators. Orange is reserved for learnable
   parameters. Labels, shapes, signs, and geometry must work without color. Provide
   named controls, focus visibility, reduced-motion discrete reveals, transcript,
   and a readable static fallback if scripts fail.
8. **Keep the PDF complete.** These filters are HTML-only and return immediately
   for other formats. Existing static explanations and figures remain authoritative
   in both editions. A browser frame is not automatically converted into the PDF.
   If a future animation introduces required content, first add its complete static
   example to the shared manuscript.

## Implementation map

- `interactives/convolution/`: the approved first player, left self-contained to
  avoid an unnecessary retrofit.
- `interactives/kernel-weighting/` and `interactives/bert-ledger/`: each scene's
  static panel, scoped styles, and computation/reveal logic.
- `interactives/shared/`: only demonstrably shared transport, compact controls,
  styles, and deferred loading for the second and third players. Each scene keeps
  its own arithmetic or Boolean state. Nested-disclosure anchors open their target
  as well as its ancestors.
- `filters/convolution-excerpt.lua` and `filters/mechanism-excerpts.lua`: insert
  the optional HTML at verified chapter locations and fail if a required insertion
  point is absent or duplicated.
- `scripts/html-tests/package.json`: test-only dependencies; the publishing
  workflow requires this interaction suite alongside notebook validation.

## Acceptance before another animation ships

Independently test arithmetic or Boolean invariants, every important reveal state,
deterministic seeking, pause/replay/speed, resize/fullscreen, keyboard isolation,
reduced motion, direct anchors, failed-script fallback, and the non-HTML guard.
Inspect desktop and phone widths in a real browser. Run the HTML/structural audits
and require unchanged frozen stdout. For publication, retain the existing complete
PDF-build and notebook-validation pipeline, compare PDF content and pagination,
obtain author review, push normally, and verify the actual deployed assets.

Current commands and source receipts live in the two linked implementation records.
Future candidates remain in [the existing animation roadmap](backlog.md#focused-animation-roadmap--approved-september-9-2026);
this document does not authorize additional scenes or a new stable edition.
