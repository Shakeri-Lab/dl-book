# Mask before softmax: source and review receipt

September 11, 2026. **Author-approved for publication** with “push and do next.”
Attention bill was separately pushed as `061eff3`; its run `34595314339` passed
all jobs and the live player and both PDFs were verified before this publication.

## One question, one normalization

Does giving a padded key a score of zero exclude it?

Placement: `chapters/part4/13-attention.qmd`, after `cell-fig-padding-mask`, at
`13-attention.html#mask-before-softmax-excerpt`. Four columns retain the two real
keys and two padded keys throughout. Follow their scores into exponentials, one
shared denominator, and normalized weights. Compare zeroed padded logits with
negative-infinity masking before softmax. The final witness is the existing
figure's second query, not a new architecture or training result.

The source-padding mask is not a target-loss mask and not a causal triangle. The
entire source is available to this recurrent decoder. An all-masked row must be
rejected before normalization; four zero weights are not a distribution.

## Closing the old fixture gate

The roadmap previously flagged seeded rather than printed pre-mask scores. The
selected inputs are now tied to the exact code already behind the adjacent
figure: `padding-mask-audit` at Chapter 13 lines 518–560, seed `6050133`, and
zero-based batch/query indices `[1,1]`. The chapter prints the final row inside
the heatmap, to two decimals. Intermediate scores and the zeroed-score
counterexample are explicitly computed variants, not new frozen stdout.

The tiny forward-only extraction below was executed on September 11 with
`/Users/hs9hd/.venvs/dl-book/bin/python` (torch `2.12.1`, one thread). No training,
rendered notebook, or frozen artifact was changed. The lecture snapshot records
the same chapter/frozen-HTML hashes and exactly matches these float32 scores and
weights despite its torch `2.13.0` runtime. This narrow check does not claim
general equivalence of those runtimes.

```python
import math
import torch

torch.set_num_threads(1)
g = torch.Generator().manual_seed(6050133)
Q = torch.randn(2, 2, 4, generator=g)
K = torch.randn(2, 4, 4, generator=g)
V = torch.randn(2, 4, 3, generator=g)
valid = torch.tensor([True, True, False, False])
scores = (Q @ K.transpose(-2, -1) / math.sqrt(K.shape[-1]))[1, 1]
correct = torch.softmax(scores.masked_fill(~valid, -torch.inf), dim=-1)
wrong = torch.softmax(scores.masked_fill(~valid, 0.0), dim=-1)
print(Q[1, 1].tolist(), K[1].tolist())
print(scores.tolist(), correct.tolist(), wrong[~valid].sum().item())
```

Source-derived float32 witnesses:

| Quantity | Values |
|---|---|
| Scaled scores | `[-0.3497923016548157, 0.018254060298204422, -0.23989452421665192, -0.25538283586502075]` |
| Correct weights | `[0.40901318192481995, 0.5909868478775024, 0.0, 0.0]` |
| Wrong padded mass, padded logits set to zero | `0.5371642708778381` |

The panel stores the selected float32 query and four keys once. JavaScript uses
double-precision arithmetic to derive the dot products and all following
quantities; it does not interpolate a table of weights. At display precision the
correct weights are `0.4090, 0.5910, 0, 0`, and the wrong padded mass is `0.5372`.
Independent checks use a float32 witness allowance of `1e-7`, separately from
double-precision algebraic checks at `1e-12`. These are local scene tests, not
changes to any numerical portability gate.

The verify-math SymPy helper confirmed that the two correctly normalized
exponentials sum to one, and that two zeroed padded logits contribute
`2 / (exp(a) + exp(b) + 2)` mass. The zero-pad counterexample changes logits, not
weights after softmax.

## Composition and timeline

Port the four-score mechanism from `6050-Ch13/lecture.jsx`, function `MaskBefore`
(scene name `MaskBeforeSoftmax`, source indices `MASK_B=1`, `MASK_Q=1`), and its
storyboard row. The film's longer shape-ledger/code-panel sequence is omitted.
Use the book's own semantic palette and compact shared transport, not React,
KaTeX, a video payload, or a general animation engine.

| Time | Reveal |
|---|---|
| 0 s | Predict from the four existing scores and validity marks. |
| 5 s | Set the two padded scores to zero (the mistake, printed in wine). |
| 10 s | Exponentiate: the four bars grow from their baselines for 3 s, then hold. The padded bars reach one, not zero. |
| 15 s | One bracket draws across all four contributions; the shared sum appears when it lands. |
| 20 s | Divide: weight bars grow for 3 s; one wine bracket names the padded share. |
| 25 s | Hold 2 s on the announced edit, then push the padded scores from 0 toward −∞ on the same picture, arriving exactly at 30 s. |
| 30 s | Hold the masked picture: padded contributions and share exactly zero, real weights sum to one. |
| 35 s | Retain the final witness and state the at-least-one-real-key guard. |

(Timeline as revised in the September 17, 2026 review pass, below. The first build
switched between two precomputed rows and cleared the stage at 25 s.)

Source/key labels are blue, probabilities green, operators neutral, and the
wrong padded contribution wine: the padded score, its exponential bar, its weight
bar, the padded half of the sum bracket, and the PAD-share bracket, for exactly as
long as that contribution is non-zero. A padded share of exactly zero is neutral
ink, because zero leakage is not an error. Meaning also appears in labels and geometry.
Four columns remain aligned at phone widths; calculation levels reflow instead
of shrinking an entire slide. No hover-only interaction or new parameter control.
Default closed, paused, silent, 1.5× playback, keyboard/scrubbing/expanded view,
reduced-motion holds, transcript, and generated wide/narrow static fallback.

## Verification status

Implementation and automated acceptance pass: **41/41** independent scene tests
and **705/705** full interaction tests. The suite independently recomputes scores,
wrong/correct normalization and geometry, rejects all-masked input before any
exponential is evaluated, checks alternate fixtures and common shifts, and covers
deferred loading, deterministic scrubbing, pause/replay, resize/expanded view,
reduced motion, and generated wide/narrow fallback parity. A caught misuse of the
shared `data-value` marker was repaired in source, not by weakening the test.

Full frozen HTML was rendered last. HTML assets (37 pages, 153 assets), public
anchors, book/source/Plan contracts, and excerpt fixtures pass (15 scenes,
89 literals, 39 reverified lecture digests). All **133 stdout blocks / 27 units**
remain exact against `061eff3`, with matching HTML/TeX output pairs. Plain-Pandoc
Chapter 13 LaTeX is byte-identical with and without both excerpt filters; SHA-256
`f6d7d1db3ca41ccc41677136fdf2bc3642cd822f6c46dd13b41864eb88c998cf`, saved as
`/tmp/dl-book-mask-before-{plain,filtered}.tex`.

The publication pass rebuilt both complete PDF profiles, each stabilized on the
second pass: **548 print / 519 continuous pages**, 390 outline entries each.
Complete and per-page extracted text, page geometry, outlines, and all 1,067
36-dpi page rasters match the pre-publication baseline. The comparison and retained
build logs are in `/tmp/dl-book-mask-softmax-pdf-approval.6XHtCD/`.
Both PDF audits pass with retained LaTeX logs (no print loss or missing glyphs).
Rebuilt cover, contents, long-title samples and the Chapter 13 padding-mask pages
(print 283 / continuous 262) were visually inspected without new layout defects.
Canonical HTML was rendered last; log `/tmp/dl-book-mask-publication-html.log`.
No PDF page-count ledger requires repagination.

Isolated SVGs were rasterized directly, not through a browser, at widths 296 and
713 for opening, exponentiation, wrong-result, exclusion, and final frames.
The wrong/final phone drawings and desktop wrong-result drawing were visually
inspected: columns, values, sums, and labels are clear. These checks use an isolated
Arial rendering and do not substitute for actual chapter/browser layout.
The Mac was subsequently unlocked. Actual chapter review at 1280 and 390 CSS
pixels verified clear wrong/correct normalization, no horizontal overflow or
clipped SVG labels, working MathJax, real play/pause/replay and scrub endpoints.
Playback held at 19 seconds while paused through entering and exiting fullscreen.
A fresh chapter visit leaves the panel closed and its player unloaded; the direct
anchor opens it paused at zero. The viewport override was reset after review.
The publication rerun passed all 705 tests; log:
`/tmp/dl-book-mask-publication-tests.log`.

Local HTTP checks confirm the unique closed disclosure after the existing figure,
transcript and local links, deferred script, and exact served asset. Preview:
`http://127.0.0.1:8770/chapters/part4/13-attention.html?preview=mask-before-softmax#mask-before-softmax-excerpt`.
Logs: `/tmp/mask-before-softmax-tests-final.log`,
`/tmp/dl-book-mask-before-full-tests.log`, `/tmp/dl-book-mask-before-final-html.log`.
Isolated diagram frames: `/tmp/dl-book-mask-before-{296,713}-{0,10,15,25,40}.png`.
Manuscript, freeze, numerical tolerances, PDF configuration, tags, and paused
runtime migration stay unchanged. Attention-bill publication is tracked separately.

## Source digests

Lecture paths below are relative to
`/Users/hs9hd/Library/CloudStorage/Box-Box/Teaching/6050/Video_lectures/`.

| Source | SHA-256 |
|---|---|
| `chapters/part4/13-attention.qmd` | `0551a3b6fb6898e5ce42aedf3f70873c0041cf7d773ab5ebe3a8a4371973d557` |
| `_freeze/chapters/part4/13-attention/execute-results/html.json` | `bd3430e8768748960c9c4cfaac055d3aea351f218fe919937725392b398b7d85` |
| `6050-Ch13/lecture.jsx` | `9e6a849eeffad1b5e0e367a5b3aa5b4489136093e3979152e03c7b469f4f6501` |
| `6050-Ch13/storyboard.md` | `2a932bf1b8eafe5e029f20562a3091a54e4e3943373a0528947d271cb53e1dc8` |
| `6050-Ch13/ch13-data.js` | `9c6da18e1816c503809c6c89556d475868d5ecb44756ee0dcf761e1776137b75` |
| `audit-ch13-attention.py` | `59b18b88eb8db3de8ba4bfcc223bc24a01b96f33f6c9cd172a76958ebd6ce419` |

## Review pass — September 17, 2026

An independent review found that the scene had no motion: `render` used time only to pick
a stage, so playback equalled reduced motion; the wrong-regime frame carried about fourteen
live numbers; and at 25 s the stage was cleared and rebuilt, leaving a nearly blank picture
for five seconds. Fixture, duration (40 s) and beats (0 5 10 15 20 25 30 35) are unchanged.

- **One parameter drives the picture.** From 5 s on, everything is recomputed from `c`, the
  contribution one padded slot makes to the shared sum; its score is `s = ln c`. `c = 1` is
  the zeroed score, `c = 0` the mask. Sum, weights, bars and labels are the softmax at the
  current `c` every frame; nothing blends two tables of answers. Published as
  `data-pad-contribution`; `data-mode` is `raw`, `zeroed`, `pushing` or `masked`.
- **The mechanism is one glide on the same picture (25–30 s).** Nothing is cleared. After a
  2 s hold on the announced edit (label, push cue, `exp(−∞) = 0` shown unlit) the padded
  score label runs 0 → −∞, the padded exponential bars shrink, the sum counts down
  3.7233 → 1.7233 and travels with its bracket's centre, and the padded weight bars empty
  while the real ones grow to 0.4090 and 0.5910. The glide ends exactly at 30 s, so an
  arrow-key seek parks on the finished masked picture.
- **Refinement of the brief's "bracket retracts".** A bracket end sliding leftwards would,
  in a paused frame, show one padded column inside the sum and the other outside although
  both contribute the same `c`. Instead the bracket has an ink half over the real keys and a
  wine half over the padding; the wine half's ticks shrink and its line fades in step with
  `c`, identically for every padded slot, and is gone at `c = 0`.
- **Earlier beats move too.** Exponential bars (10–13 s) and weight bars (20–23 s) grow from
  their baselines; the sum bracket draws across (15–18 s). Each number appears when its
  mark arrives and then holds at least 2 s. Baselines are scenery from 0 s.
- **Fewer numbers.** The two padded weights are read as the one PAD share; numbers no longer
  in play turn grey and step down a size; a withheld number is blank as well as hidden. At
  most eight emphasised numbers at any sampled instant (tested).
- **Reduced motion** derives every quantity from the stage, never the clock: beat 5's still
  is the wrong picture with the edit announced (`c = 1`), beat 6's the finished mask.
  Captions were rewritten (at most 15 words) to be true of each still and of the motion
  that follows, and to keep the phone-width pane the same height at every beat.
- **Colour.** The receipt said the wrong padded contribution was wine; the code drew it
  neutral. Now it is wine while non-zero (corrected above) and the masked PAD share reads
  `0` in neutral ink. `exp(0) = 1` is lit only while `c = 1`; `exp(−∞) = 0` only when `c = 0`.
- **Minus is U+2212** in every drawn number, the static prints, and the scrubber text (the
  first build printed `-0.350` beside `−∞`). `data-shown-scores` keeps the machine string
  `-Infinity`; it is never read to a person.
- **One place for a live value.** The picture's `aria-label` is now a fixed structural
  description; live values are spoken only in the scrubber's value text.
- **Weight ruler.** The hard-coded `105/.65` overflowed for any weight above 0.65. Both
  rulers are now set by the largest value the declared fixture can reach; the suite checks
  bar bounds on the alternate fixtures, including a single real key with weight one.
- **Dead CSS.** `.mbs-excluded` was never applied. It now quiets a masked column's arrow
  (dashed, grey) while the column keeps its slot; a test fails on any unused `mbs-` rule.
- **Per-frame work.** Fixture-only facts are published once at mount, width-only geometry
  is placed in `layout()`, and DOM writes happen only on change: a held beat makes no
  mutations (tested). Drawing coordinates are serialised at 0.0001 px; state is not rounded.
- **Transcript** items 3–7 retell the new beats; every decimal in it is checked against the
  fixture's computed values.

Suite: `node --test scripts/test_mask_before_softmax_excerpt.cjs`, **50/50**. New checks:
weights sum to one and equal exp/sum throughout the glide; `c`, the PAD share and the sum
are monotone, held through 27 s and exactly finished from 30 s; the drawing differs at 26,
27.5 and 29 s while reduced motion holds one still per beat, each equal to the settled
normal frame; no hyphen-minus in any svg text. `scripts/audit_excerpt_fixtures.py` passes.
Frames were inspected in Chromium at 1280 and 375 CSS pixels, normal and reduced motion:
no overflow, no text outside the picture, no console errors, constant pane height. The
hashes, byte sizes and counts recorded above predate this pass and are left for a later
pass to refresh.
- **Less prose around the picture.** The boundary now shows one sentence; every remaining scope note,
  unchanged, sits in a closed "Scope and caveats" disclosure beside the transcript. New asset sizes
  and digests for this pass are recorded once in [the review-pass receipt](excerpt-review-pass.md).
