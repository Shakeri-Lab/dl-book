# Kernel weighting and BERT masking — implementation receipt

Implemented September 9, 2026, against clean `main`
`304f3d4a73dd916f5a50fc2ca5cde66e2dbea656`. **Both are author-approved for
publication**, including the BERT revision after local feedback. Confirm the
publishing run and live assets for the commit containing this record before
reporting deployment. The author reprioritized these two roadmap candidates after
clarifying that they were planned rather than implemented. Backpropagation stays
in the backlog; it is not silently included in this work.

For the explanation of all three players and reusable production rules, see
[Mechanism animations: reference and authoring contract](animation-authoring.md).

## Review locations

- Chapter 12, immediately after `fig-kernel-lookup`:
  `chapters/part4/12-kernel-regression.html#kernel-weighting-excerpt`.
- Chapter 15, immediately after `fig-mlm-policy`:
  `chapters/part4/15-bert-pretraining.html#bert-ledger-excerpt`.

In the release checkout, serve `_book` on port 8770. These anchors open their
optional panels **paused**, not playing. Ordinary chapter visits leave both
panels closed and request neither the scene script nor the playback helper.

## Authority and source receipts

The shared manuscript owns the mathematics and fixtures. Neither QMD is edited.

| Source at baseline commit above | SHA-256 |
|---|---|
| `chapters/part4/12-kernel-regression.qmd` | `2817aff14f7b57b13c7042e027e11945d5a76b6fa893f763ed109a3dac0509cd` |
| `chapters/part4/15-bert-pretraining.qmd` | `cf0abd7650a25b84411df6fdedb4dd4de683c0dc3b058e1c1edbe00b05296cfd` |

Read-only instructor collection:
`/Users/hs9hd/Library/CloudStorage/Box-Box/Teaching/6050/Video_lectures/`.
The following sources supply reveal order and composition, not independent
authority for fixtures, numerical claims, or colors:

| Relative source | SHA-256 |
|---|---|
| `6050-Ch12/lecture.jsx` | `73394c0af87a6425bdbf2866871c349e14617a8d95a0386982633b7a6fe022af` |
| `6050-Ch12/STORYBOARD.md` | `65e8e471025eac7936be40a50fda0c0df4919a1665b3d9dec776d77572e1b031` |
| `6050-Ch15/lecture.jsx` | `6b4adf6ec2e1f9f2986e97acd7dfb15197dbd0e187efc50d50a2614a80ba2cfd` |
| `6050-Ch15/STORYBOARD.md` | `f05053b3d8b57c9240c0506df71a71f165b611eb649635ba6a414d47cb47724d` |

Adapted scenes: `FinalGaussianLookup` / **GaussianLookup** (1:52–2:50), and
`FourLedgers` plus **CorruptionPolicy** (1:06–1:58 and 3:32–4:30). No React, Babel,
KaTeX, fonts, lecture framework, video payload, or general animation engine is
imported. The book's five Boolean rows replace the lecture's alternative grouping.

## Kernel weighting

Question: **As the query moves, which observation gains influence?**

Reuse `fixed-gaussian-attention` / `fig-kernel-lookup`: keys `(1,3,5)`, observed
values `(1.5,2.8,1.8)`, fixed bandwidth `0.6`. The scene computes distances,
Gaussian affinities, their common denominator, weights, products, and prediction
from one current query. It reveals those steps before moving the query, and ends
at the chapter's `q=3.5` witness: rounded weights `(0.0002,0.9413,0.0585)` and
prediction `2.7412`. All displayed products use unrounded weights.

Content time: prediction question 0–4 s; distances 4–8; affinities 8–12;
normalization 12–16; products/sum 16–20; move to query 1 during 20–22; sweep to 5
during 22–32; return to 3.5 during 32–36; hold the printed witness until 40.
Reduced-motion mode quantizes the query to quarter-unit positions. There is no
bandwidth or parameter control. These are computed weights, not learned parameters
or calibrated uncertainty. The convex-hull bound is always displayed after mixing.

Blue denotes query/key coordinates; purple denotes observed values; green denotes
the prediction. Neutral bars show computed influence. Point/diamond shapes and
labels preserve the distinction without color. At phone widths the cards stack;
at the narrowest breakpoint their readouts become two columns. The plot measures
its real container width instead of scaling down a complete lecture slide.

## BERT masking ledger

Question: **An ordinary-looking token was selected. Does it still contribute to
the loss?**

Reuse `mlm-policy-ledger` / `fig-mlm-policy`, with zero-based positions:

```text
original:        [CLS] the quiet bank rose after the rain today [SEP] [PAD] [PAD]
eligible:       1,2,3,4,5,6,7,8
selected:       2,4,7,8
mask_sites:     2,7
random_sites:   4
unchanged_sites:8
visible keys:   0,1,2,3,4,5,6,7,8,9
```

The random branch needs a visible replacement to distinguish input from target;
the excerpt explicitly labels **bank** at position 4 as one illustrative draw,
not an executed sample or a new measured result. Original **rose** remains the
target. All corruptions apply to the same sequence at once; changing the focused
position does not change what the encoder reads. No logits, probabilities, or
numeric losses are invented. The loss box displays only a symbolic term in the
chapter's selected-position mean.

Content time: question 0–4 s; reveal the original/input copies 4–8; masked position 2
8–14; randomly replaced position 4 14–20; unchanged selected position 8 20–28;
unselected position 3 28–34; visible/ineligible SEP 34–36; PAD 36–38; return to
unchanged selected today 38–40. Within each main case, rays progressively reveal
the input-to-prediction route, saved-target-to-loss route, then prediction-to-loss
route. The answer appears only after both loss routes arrive. Reduced motion uses
discrete ray reveals without moving dots. Original and input copies remain paired
throughout; all corruption is applied jointly at four seconds, not one focused
token at a time. Short captions stay stable while the paths reveal. The five
Boolean flags are a secondary, initially collapsed inspection panel rather than
the main visual. A direct anchor to that nested disclosure opens it, with the
player still paused. The twelve-column static figure above remains authoritative.
The tiny fixture does not
claim to reproduce the population's selection or corruption proportions.

Input (blue) feeds encoder/prediction (green). The original target (purple) feeds
the loss (wine), never an extra encoder input. Unchanged selected tokens
deliberately expose their answer; the excerpt does not deny this. Unselected
nonpadding tokens can influence other predictions through context without a direct
MLM loss term. PAD is blocked as an attention **key**; the diagram makes no claim
that an implementation must skip computing every padding-position hidden state.

## Small shared transport; unchanged convolution

`interactives/shared/playback.js` adapts the approved convolution player's
transport for these two scenes. It owns only timing and controls; scene arithmetic
and Boolean state stay in separate local scripts. The already-published
`interactives/convolution/` assets and filter remain untouched.

The common contract is silent, closed and paused initially, 40 content seconds,
1.5x default, one compact on-pane bar, keyboard/native-control isolation,
deterministic seeking, replay, pause on close/hidden tab/page exit, reduced-motion
support, native fullscreen with a same-pane dialog fallback, a transcript, and
readable static calculations/routes if scripts fail. The loader supports direct
anchors and retry after failure. The BERT review fixed one shared-loader edge case:
when the hash targets a nested `details` itself, open that target as well as its
ancestors. Kernel scene assets and the playback helper are unchanged by this pass.
Dependencies in `scripts/html-tests` are test-only.
Each chapter defers just the common helper and its own scene script.

## Integration and format boundary

`filters/mechanism-excerpts.lua` inserts HTML after the two named figure cells and
fails closed if its insertion point is absent or duplicated. Its first executable
line returns an empty filter outside HTML. No exercise, required claim, numbered
figure, notebook, frozen stdout, PDF setting, or release tag changes. `_quarto.yml`
adds only that filter and the three local script resources. The asset audit follows
both deferred paths so missing resources fail publication checks.

Commands for local review:

```sh
quarto render --to html --no-clean
npm test --prefix scripts/html-tests
python scripts/audit_html_assets.py
python scripts/audit_public_anchors.py
python scripts/audit_plan_code.py
python scripts/audit_python_sources.py
python scripts/audit_book_contract.py
python scripts/audit_frozen_stdout.py --base HEAD
```

The HTML render uses the committed freeze; it must not retrain either chapter.
Direct Pandoc LaTeX comparisons with and without the new filter are byte-identical
for both source units. That local-preview check alone was not a full PDF build.
Publication retains the complete PDF rebuild and audits; see the final build
record in `docs/CONTINUING.md`. PDF content and settings stay unchanged, and the
numerical-runtime migration remains paused.

## Acceptance record

The test suite includes independent Gaussian/softmax arithmetic, a full query sweep,
normalization and convex-hull bounds, final/no-script readout parity, every Boolean
branch and input/target route, joint corruption, resize ray endpoints, deterministic
scrubbing, fractional timing, replay/speed, keyboard isolation, native and fallback
fullscreen, deferred/failing-script recovery, direct anchors, and the HTML-only
insertion guard. Browser review additionally checks the diagrams at desktop and
phone widths, playback and compact controls. Final local test/audit results are
recorded in `docs/CONTINUING.md`; test results alone do not imply deployment.
Both players have since received author approval. Final local run: **86/86 tests
pass**, including **43** checks in
`scripts/test_mechanism_excerpts.cjs`; the complete frozen HTML render and all six
audits listed above pass. Frozen stdout: **133** unchanged blocks across **27**
baseline units, with all **27** HTML/TeX pairs matching. Browser inspection covered
desktop and measured **390/300 CSS-pixel** widths. Neither excerpt introduces
horizontal page overflow. Console checks were clean, and final preview states are
open at their direct anchors, paused at time zero. The screenshots of native
fullscreen under viewport emulation were unreliable; native entry/exit, retained
state, and pane geometry were verified through the DOM and regression suite.
