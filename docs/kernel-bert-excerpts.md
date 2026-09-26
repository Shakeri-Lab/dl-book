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
| `chapters/part4/12-kernel-regression.qmd` | `4b0fd2ce95b681a43280eedf53d07fa224473b149d97732683484ee4a20add73` |
| `chapters/part4/15-bert-pretraining.qmd` | `ee0c85c8f0c3d6bab01aff6cbb823a49afe062dcabaab6010eb4f2440258d0c4` |

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

### One audited mirror of each fixture

`interactives/manifest.json` indexes all three shipped scenes. Each entry records
the panel id, the scene directory, the chapter, the anchor (an executable cell's
`cell-<label>`, or an exact heading), the filter that ships it, whether it runs on
the shared transport or its own, the duration, the beats, the fixture literals the
chapter must keep verbatim, any declared computed variants, and the receipt that
hashes the chapter. `scripts/audit_excerpt_fixtures.py` joins the manuscript-contract
audit step of both the publishing and the execute-audit workflow, ahead of any render
or re-execution, and fails when a literal is no longer verbatim in its
chapter, when a receipt's recorded chapter digest is stale, when an anchor stops
resolving, when the named filter stops mentioning the scene or its target, when a
panel stops declaring its id, or when the manifest's duration or beats disagree with
what the panel markup declares. Given `--lecture-tree`, it also re-verifies the
lecture source hashes recorded above; that check is off by default so publication
never depends on a tree that is not checked out.

The chain is manuscript, then panel, then player, then tests, with exactly one
mirror inside the repository. Each panel declares its fixture as data attributes,
each player reads them instead of retyping numbers, and
`scripts/test_mechanism_excerpts.cjs` takes its reference values from the same
attributes and from the manifest. Two of its checks parse the chapters directly and
require each panel to declare exactly what its chapter prints, so the panel is a
checked mirror rather than a second source. The suite still recomputes the Gaussian
softmax and the Boolean partition itself and still lands on the manuscript's printed
`2.7412` and `(0.0002, 0.9413, 0.0585)`; that independent arithmetic is what keeps
the checks from being circular.

The manifest is repository build data, not a file a reader's browser fetches. Today
it is read from the project directory by `scripts/audit_excerpt_fixtures.py` and by
the interaction suite; a future manifest-driven filter is meant to read it the same
way. It is therefore deliberately **not** listed under `_quarto.yml` `resources:`,
which names the files a reader does fetch, and a test asserts both halves of that
decision: every scene's `player.js` is published, and `interactives/manifest.json`
is not.

## Kernel weighting

Question: **As the query moves, which observation gains influence?**

Reuse `fixed-gaussian-attention` / `fig-kernel-lookup`: keys `(1,3,5)`, observed
values `(1.5,2.8,1.8)`, fixed bandwidth `0.6`. The scene computes distances,
Gaussian affinities, their common denominator, weights, products, and prediction
from one current query. It reveals those steps before moving the query, and ends
at the chapter's `q=3.5` witness: rounded weights `(0.0002,0.9413,0.0585)` and
prediction `2.7412`. All displayed products use unrounded weights.

Those numbers reach the player through the panel rather than through the script.
The `<details>` declares `data-keys="1 3 5"`, `data-values="1.5 2.8 1.8"`,
`data-bandwidth="0.6"`, and `data-query="3.5"`, and `player.js` reads all four; the
sweep's endpoints are the outermost declared keys and the declared query, so no
fixture number is typed in the scene code at all. That includes the caption
sentences: the opening question interpolates the declared query, the affinity
caption interpolates the declared bandwidth, and the closing witness interpolates
the prediction the player has just computed, so a chapter edit that moved the query
or the bandwidth would move the spoken sentences with the panel instead of leaving
a stale number behind. Two tests hold that: one checks the captions against the
declared attributes, and one moves those attributes and asserts that `2.7412`
disappears from the caption. One collision is deliberate and documented in the
source: `data-query` is also the player's live-query readout, so the declared value
is read once at mount, and the tests assert that the live value returns to it when
the query comes to rest.

Content time: prediction question 0–4 s; distances 4–8; affinities 8–12;
normalization 12–16; products/sum 16–20; move to query 1 during 20–22; sweep to 5
during 22–32; return to 3.5 during 32–36; hold the printed witness until 40.
The stage strip now follows that timetable exactly: nothing is lit during the
prediction question, and each later stage lights only its own label. This corrected
an off-by-one that lit **Distance** before any distance had been drawn. The pane
declares `data-beats="0 4 8 12 16 20 22 32 36"` — the same nine boundaries — so the
arrow keys step between stages instead of by a fixed 2.5 seconds.
Reduced-motion mode quantizes the query to quarter-unit positions. There is no
bandwidth or parameter control. These are computed weights, not learned parameters
or calibrated uncertainty. The observed-value range displayed after mixing is
computed as the smallest and largest of the declared values, never a typed literal,
and the sentence the player renders at 40 seconds is byte-identical to the one the
static panel already carries.

Blue denotes query/key coordinates; purple denotes observed values; green denotes
the prediction. Neutral bars show computed influence. Point/diamond shapes and
labels preserve the distinction without color. At phone widths the cards stack;
at the narrowest breakpoint their readouts become two columns. The plot measures
its real container width instead of scaling down a complete lecture slide. It takes
that measurement once at mount and again only from the transport's layout callback —
resize, `ResizeObserver`, both fullscreen routes, and opening the panel — never
inside the per-frame render. The value axis carries a rotated **value** title, which
widened the plot's left margin from 34 to 46 without crowding the tick labels, and
the legend now names the query line and the distance bracket beside the observed
value and the prediction. Both new swatches inherit `currentColor` from the shared
input role, so a swatch cannot drift from the colour actually drawn.

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

The token rail is the one in-repo mirror of those rows. `[data-token-rail]` declares
`data-eligible`, `data-selected`, `data-mask-sites`, `data-random-sites`, and
`data-random-replacement`, and the twelve tokens are read from the rail's own
original cells. `unchanged_sites` is derived in the player exactly as the chapter
derives it, `selected & ~mask_sites & ~random_sites`, instead of naming position 8.

The random branch needs a visible replacement to distinguish input from target;
the excerpt explicitly labels **bank** at position 4 as one illustrative draw,
not an executed sample or a new measured result. That caveat used to sit in the
boundary paragraph far below the rail; it is now a footnote directly under the rail,
keyed to a `chosen*` marker on the position-4 cell, and the same sentence joins that
cell's accessible name once the corruption has been applied. Original **rose**
remains the target. All corruptions apply to the same sequence at once; changing
the focused position does not change what the encoder reads. No logits,
probabilities, or numeric losses are invented. The loss box displays only a
symbolic term in the chapter's selected-position mean.

Content time: question 0–4 s; reveal the original/input copies 4–8; masked position 2
8–14; randomly replaced position 4 14–20; unchanged selected position 8 20–26;
unselected position 3 26–32; visible/ineligible SEP 32–35; PAD 35–38; return to
unchanged selected today 38–40. The two boundary scenes were two seconds each —
about 1.3 seconds of wall clock at the 1.5x default — and arrived complete. They
now run three seconds and ramp their input route on the same rule the cases use, so
the SEP ray grows from nothing at 32 seconds to complete at 32.75. The closing recap
is deliberately not ramped: it is a held summary, complete on arrival, and a test
pins that difference. The pane declares `data-beats="0 4 8 14 20 26 32 35 38"`,
exactly those scene starts, and a test proves each declared beat is where the scene
title changes, so the two lists cannot drift apart.

Within each main case, rays progressively reveal
the input-to-prediction route, saved-target-to-loss route, then prediction-to-loss
route. The answer appears only after both loss routes arrive. Reduced motion uses
discrete ray reveals without moving dots. Original and input copies remain paired
throughout; all corruption is applied jointly at four seconds, not one focused
token at a time. Short captions stay stable while the paths reveal. The five
Boolean flags are a secondary, initially collapsed inspection panel rather than
the main visual. A direct anchor to that nested disclosure opens it, with the
player still paused. The twelve-column static figure above remains authoritative.
The no-script rail now shows the state the player shows at 40 seconds: `=` on the
nine unchanged columns, a down arrow and a changed mark at positions 2, 4, and 7,
and `chosen*` at position 4. Because `=` now appears in the fallback with nothing to
explain it, the rail's label says what both glyphs mean. A test projects the static
and rendered rails onto original token, input token, glyph, choice label, selection,
and change, and requires the two projections to be equal.
The tiny fixture does not
claim to reproduce the population's selection or corruption proportions.

Input (blue) feeds encoder/prediction (green). The original target (purple) feeds
the loss (wine), never an extra encoder input. Unchanged selected tokens
deliberately expose their answer; the excerpt does not deny this. Unselected
nonpadding tokens can influence other predictions through context without a direct
MLM loss term. PAD is blocked as an attention **key**; the diagram makes no claim
that an implementation must skip computing every padding-position hidden state.

## Small shared transport; convolution on its own transport

`interactives/shared/playback.js` adapts the approved convolution player's
transport for these two scenes. It owns only timing and controls; scene arithmetic
and Boolean state stay in separate local scripts. The already-published
`interactives/convolution/` player keeps its own transport — retrofitting it onto
the shared helper stays deliberately out of scope — but it is no longer untouched.
It has taken two backports from this helper, ancestor-walking anchors and one
derived duration, along with the same action-button change described below. The
[convolution receipt](convolution-excerpt.md) lists them; read any earlier
"untouched" claim as superseded.

The common contract is silent, closed and paused initially, 40 content seconds,
1.5x default, one compact on-pane bar, keyboard/native-control isolation,
deterministic seeking, replay, pause on close/hidden tab/page exit, reduced-motion
support, native fullscreen with a same-pane dialog fallback, a transcript, and
readable static calculations/routes if scripts fail. The loader supports direct
anchors and retry after failure. The BERT review fixed one shared-loader edge case:
when the hash targets a nested `details` itself, open that target as well as its
ancestors. Dependencies in `scripts/html-tests` are test-only.
Each chapter defers just the common helper and its own scene script.

Three transport changes landed in the polish pass and apply to both scenes:

- **Duration and beats come from the markup.** `playback.js` reads `data-duration`
  from the pane, falling back to the scrubber's `max`, and writes that one number
  back into the scrubber's range, the printed clock, and `data-duration` on the
  panel root. When the pane declares `data-beats`, the arrow keys seek to the
  previous or next beat and clamp to zero and the duration at the ends; without it
  the fixed 2.5-second step is unchanged, as are Home and End. The clock lookup is
  scoped to the control bar on purpose: a pane may declare `data-duration`, and an
  unscoped query would then match the pane before the clock. No shipped pane
  overrides the markup range yet — both shared-transport panes declare only
  `data-beats` and fall back to the scrubber's `max` — so the scoping guards the
  mechanism, not a current panel. The convolution excerpt is not a third case: it has
  no `data-pane` element, does not run this transport, and keeps its own fixed
  2.5-second arrow step, computed in `interactives/convolution/player.js` from
  `phaseSeconds`. Its beats are declared only in `interactives/manifest.json`, where
  `scripts/test_convolution_excerpt.cjs` holds them equal to `(lastStep + 1)` phases
  of `phaseSeconds` and `scripts/audit_excerpt_fixtures.py` holds them to the uniform
  grid the declared duration implies.
- **Play and Fullscreen are action buttons, not toggles.** Neither writes
  `aria-pressed`. Their accessible names still change with what pressing them does,
  and CSS selects the icon from `data-state` (`play`, `pause`, `replay`, and
  `expand`, `contract`), which the transport sets on the native `fullscreenchange`
  path, on the dialog fallback, and on exit.
- **Captions are polite live regions, written only when they change.** Both scenes'
  captions carry `aria-live="polite"` and `aria-atomic="true"`, matching the
  convolution panel, so a caption change is announced once and whole. Because
  `render()` runs every animation frame, each player compares the new sentence with
  the one already in the node and writes nothing when they match: the kernel scene
  would otherwise rewrite an unchanged sentence about sixty times a second, and the
  BERT scene once per beat inside a single scene. A test counts caption mutations
  over a hundred delivered frames and requires exactly one per changed sentence.
- **The scrubber names the state; it does not repeat the caption.** Each `render()`
  returns the text spliced into the range's `aria-valuetext`, and that text now
  names the stage and the witness numbers rather than quoting the caption
  sentence — the kernel returns the stage-strip label plus the query and, once
  mixed, the prediction; BERT returns the focused position and its branch clause,
  the same clause the Boolean-ledger transcript shows. Scrubbing across a boundary
  therefore announces the sentence once, from the live region, and the position
  once, from the scrubber. A test asserts at every declared beat, in all three
  scenes, that the caption text is not a substring of `aria-valuetext`.

The BERT scene also serialises its three dataset blobs once, immediately before the
transport mounts, instead of rewriting them on every state change. They are still in
place before the first render, so every existing reader sees what it saw; what is
new is that nothing rewrites them afterwards.

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
python scripts/audit_excerpt_fixtures.py
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
normalization and observed-value-range bounds, final/no-script readout parity, every
Boolean branch and input/target route, joint corruption, resize ray endpoints,
deterministic scrubbing, fractional timing, replay/speed, keyboard isolation, native
and fallback fullscreen, deferred/failing-script recovery, direct anchors, and the
HTML-only insertion guard. The polish pass added the stage strip's timetable, the
computed observed-value range, measure-once layout, the value-axis title and the two
new legend entries, beat-aligned arrow seeking, a declared duration reaching the
scrubber and clock, the absence of `aria-pressed` on both icon buttons and the
`data-state` icon flip on both fullscreen routes, the ramped boundary scenes, beats
that equal the scene starts, static-rail parity at 40 seconds, the marker and
footnote on the illustrative replacement, the polite captions, and the
panel-declared fixtures checked against the chapters. Browser review additionally
checks the diagrams at desktop and phone widths, playback and compact controls.
Final local test/audit results are recorded in `docs/CONTINUING.md`; test results
alone do not imply deployment.
Both players have since received author approval. The publication run recorded
**86/86 tests**, including **43** checks in
`scripts/test_mechanism_excerpts.cjs`; the complete frozen HTML render and all six
audits listed at that time pass. Frozen stdout: **133** unchanged blocks across
**27** baseline units, with all **27** HTML/TeX pairs matching. Browser inspection
covered desktop and measured **390/300 CSS-pixel** widths. Neither excerpt introduces
horizontal page overflow. Console checks were clean, and final preview states are
open at their direct anchors, paused at time zero. The screenshots of native
fullscreen under viewport emulation were unreliable; native entry/exit, retained
state, and pane geometry were verified through the DOM and regression suite.

## Polish pass, September 9, 2026

What changed in these two scenes, beyond the shared transport changes above: the
kernel stage strip's off-by-one; the observed-value range computed from the declared
values and rendered in the same words as the static panel; the value-axis title and
the query-line and distance-bracket legend entries; measure-once plot layout; the
BERT retime with ramped boundary scenes; the `chosen*` marker, its footnote, and the
caveat's move out of the boundary paragraph; static-rail parity with the 40-second
rail and the reworded rail label that explains both glyphs; polite captions;
dataset blobs serialised once at mount; and both panels declaring their fixture for
the players and the tests to read.

Verified locally today:

- `npm test --prefix scripts/html-tests`: **125 passing, 0 failing**, **71** of them
  in `scripts/test_mechanism_excerpts.cjs` (43 before this pass) and 41 in
  `scripts/test_convolution_excerpt.cjs`. Every change above was mutation-checked
  against an isolated copy of the tree; reverting it fails at least one new check.
  One equivalent mutant is on record: retyping the computed observed-value range as
  the identical literal `[1.5, 2.8]` produces byte-identical output, so no test can
  see it. A drift in the values themselves is caught, because the test derives the
  range from what the panel declares.
  A dump of the rendered markup at the static state and at 4,013 seek positions, in
  both motion modes, is byte-identical before and after the panels began declaring
  their fixtures, apart from the newly declared attributes themselves.
- `python scripts/audit_excerpt_fixtures.py` passes, with and without
  `--lecture-tree`; all seven recorded lecture digests still match today's tree.
- `audit_public_anchors.py`, `audit_plan_code.py`, `audit_python_sources.py`, and
  `audit_book_contract.py` pass. `audit_frozen_stdout.py --base HEAD` reports 133
  unchanged blocks across 27 baseline units with all 27 HTML/TeX pairs matching,
  which is the standing evidence that neither chapter was edited.

**Pending for this pass, not yet verified:** the frozen HTML render and
`audit_html_assets.py`; the Pandoc LaTeX comparison with and without the filter;
and the browser and screen-reader review — the four kernel legend entries at 390,
360, and 320 pixels; the new BERT footnote and the longer rail label at those same
widths; that the retimed SEP and PAD scenes read as arrivals rather than flickers at
the 1.5x default; that the polite captions are announced once and whole; and that
neither panel introduces horizontal page overflow or console noise.
