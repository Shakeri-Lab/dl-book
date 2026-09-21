# Surprise loss: source and acceptance receipt

**Built, not yet author-approved.** The scene is registered in
`interactives/manifest.json` as `surprise-loss-excerpt` and inserted immediately
*before* the level-3 heading **The beautiful gradient** in
`chapters/part1/02-logistic-softmax.qmd`, so it closes the section *The loss:
cross-entropy from maximum likelihood* rather than interrupting it. The shared
manuscript, `@eq-bce` and all frozen evidence are unchanged; no QMD is edited.
Approval is the author's browser-review note, not this file.

Its sibling in the same chapter, [sigmoid squash](sigmoid-squash-excerpt.md), sits one
section above, after `cell-fig-sigmoid`, and is a different scene in three ways. It
tracks a **score** and asks what **probability** the sigmoid returns for it; this one
starts where a probability already exists and asks what **loss** that probability costs.
Its picture is an input plane plus the chapter's sigmoid; this one is a single loss
plot with two branches. Its payoff is *saturation* — equal steps in the score buying
less and less probability, gains collapsing toward zero. This one's payoff is the
opposite shape — equal steps down in belief costing more and more, without bound — and
the two must not be read as the same phenomenon: the sigmoid is bounded above by 1, the
loss is bounded by nothing. The third difference is in the palette: that scene's
boundary is orange because `w` and `b` are learnable, and **this scene has no orange at
all**, because nothing in it is a learnable parameter.

## One mechanism and one question

**One example is truly labelled 1, and the model's belief in it slides toward zero.
Equal steps down in belief — does every step cost the same?**

The misconception: students read cross-entropy as a **distance**, so that being wrong
by 0.4 costs about twice being wrong by 0.2, and being wrong by the most you can be
costs some finite worst case. Cross-entropy is not a distance. It is the surprise at
the truth — the chapter's own word — it is unbounded above, and it punishes *confidence*
in the wrong answer without mercy while a hedged wrong answer stays cheap. The
consequence students miss is the one this scene is built around: the gap between
`p̂ = 0.1` and `p̂ = 0.01` on a positive example costs far more than the gap between
`0.5` and `0.4`, even though the second step of belief is *smaller*.

`@eq-bce` states the loss and the paragraph after it states the reading. What the text
cannot do is make the *rate* visible: the equation is true at one belief at a time, and
a reader who believes the loss is a distance can read it and keep believing that.

## What moves, and what two frames could not do

One picture. The belief `p̂` runs along the bottom from 0 to 1; the loss runs up a ruler
on the left, in nats, to a stated top of 5. Two branches are drawn: the solid wine one
is `−log p̂`, the term a label of 1 selects, and the dashed pale one is `−log(1 − p̂)`,
the `y = 0` term, tagged `× 0` because its coefficient `(1 − y)` is zero here. They
cross at `p̂ = ½`, which *is* the hedge: both terms cost `log 2` there, so the picture
states "one half costs the same either way" as a geometric fact rather than a claim.

The one object the eye tracks is the belief, seen three times at once: a green dot on
the belief axis, a wine point on the active branch above it, and the **loss arm** joining
them — a thick wine bar whose *length* is the loss, read across a dashed guide onto the
ruler. The suite binds the three: the drawn arm's length equals `loss × height / 5` to
1e-3 of a pixel, and the published loss equals `−Math.log(belief)` exactly at every one
of 801 sampled instants.

The belief falls, and each step it lands on leaves one stair behind it — a **tread** as
wide as the step in belief and a **riser** as tall as what that step cost, labelled with
its own number:

- **Four equal treads** (0.20 of belief each, 0.9 → 0.7 → 0.5 → 0.3 → 0.1) leave risers
  of `+0.2513`, `+0.3365`, `+0.5108`, `+1.0986`. The treads are drawn the same width and
  the suite checks they are equal to 1e-12; the risers climb, and the last is
  `4.371465…` times the first. *Equal distance in belief is not equal cost.*
- **Three halving treads** (0.1 → 0.05 → 0.025 → 0.0125) leave risers of `+0.6931`,
  `+0.6931`, `+0.6931` — each exactly `log 2`, and each drawn exactly as tall as the
  hedge's own height above zero. The treads shrink to nothing against the left wall
  while the risers do not shrink at all.

Between the two ladders the belief is held at 0.10 and the caption asks the reader to
predict: *halve the belief, 0.10 to 0.05 — does the loss double?* A dashed guide marks
where the belief is going, with a `?` at its head; nothing marks where the loss will
land. It does not double. It adds `log 2`, as every halving does, anywhere on the curve;
it only *looks* like doubling at `p̂ = ½`, the one belief whose loss already equals
`log 2`. That is the whole scene in one sentence, and the reader has to commit before
hearing it.

**First/last-frame test: passes, and here is the honest accounting.** The last frame is
made to carry all seven stairs, because a reader without scripts must get the payoff, so
a determined reader *can* compare `+0.2513` with `+1.0986` in the static print. What no
pair of frames holds is **speed**, and speed is what this scene is actually about. Through
the first ladder the belief drifts sideways at a constant 0.4 of belief per beat while
the arm's climb accelerates under it; through the second the sideways drift halves, and
halves again, and the arm climbs *exactly as far each time*. "The loss is a distance in
`p̂`" is a claim about a rate, and a rate is the one thing two stills cannot show. The
prediction beat is the second thing: the reader's commitment at 0.10 exists only in
time, and a static print that already shows `+0.6931` cannot ask for it.

## Fixture

The chapter owns the formula and the reading. It prints **no belief and no loss value
anywhere**, so the schedule of beliefs is a **declared computed variant**: eight beliefs
declared once as data attributes on the panel root, with every loss recomputed from the
chapter's own `−log p̂` and nothing retyped.

Manuscript literals mirrored (verbatim, `chapters/part1/02-logistic-softmax.qmd`):

| Literal | Line |
|---|---|
| `Read it as *surprise*` | 92 |
| `\loss_{\text{BCE}} = -\bigl[\, y \log \hat{p} + (1 - y)\log(1 - \hat{p}) \,\bigr].` | 89 |

Three more strings the scene is built to make visible, bound by the suite rather than by
the manifest: "exploding as the model's belief goes to zero." (93), "confident wrong
answer is punished without mercy" (93–94), and `\frac{\partial \loss}{\partial o} =
\hat{p} - y` (103) — the last one because the suite checks it is in the chapter and
*not* in this panel.

Declared computed variants, with their arithmetic:

| Attribute | Value | What it is |
|---|---|---|
| `data-label` | `1` | the true label `y`; a hard label is what makes `(1 − y) = 0` |
| `data-ladder` | `0.9 0.7 0.5 0.3 0.1` | five beliefs falling by an equal 0.20 each |
| `data-halved` | `0.05 0.025 0.0125` | three exact halvings; `0.1/2`, `0.05/2`, `0.025/2` are exact in doubles and the suite compares with `===` |
| `data-hedge` | `0.5` | where the two branches cross; `−log(0.5) = log 2` exactly |
| `data-loss-top` | `5` | the ruler's top, a drawing decision; `−log(0.01) = 4.6052 < 5`, so the arm cannot leave the ruler |
| `data-samples` | `240` | samples per branch |
| `data-belief-range` | `0.01 0.99` | the one control's span |
| `data-belief-step` | `0.0025` | its step; every declared belief is an integer multiple above the floor (`0.0125 → 1`, `0.025 → 6`, `0.05 → 16`, `0.1 → 36`, `0.3 → 116`, `0.5 → 196`, `0.7 → 276`, `0.9 → 356`) |

Every loss and every riser on the picture, computed as `−ln p̂`:

| belief `p̂` | loss (nats) | riser: what the step from the belief above cost |
|---|---|---|
| `0.9000` | `0.1054` | — |
| `0.7000` | `0.3567` | `+0.2513` |
| `0.5000` | `0.6931` | `+0.3365` |
| `0.3000` | `1.2040` | `+0.5108` |
| `0.1000` | `2.3026` | `+1.0986` |
| `0.0500` | `2.9957` | `+0.6931` |
| `0.0250` | `3.6889` | `+0.6931` |
| `0.0125` | `4.3820` | `+0.6931` |

Two identities the suite asserts rather than trusts. `−Math.log(0.5) === Math.log(2)`
bit-exactly, so the hedge is an identity in this arithmetic, not a rounding. And each
halving riser equals `log 2` to 1e-15: `2.995732273553991 − 2.302585092994046 =
0.693147180559945`, against `Math.log(2) = 0.6931471805599453`. The first ladder's ratio
is `1.0986122886681093 / 0.25131442828090617 = 4.371465244487029`, which is why the
caption may say "more than four times the first".

## Beat timetable

40 s, beats `0 5 10 15 20 25 30 35`, shared transport, closed and paused on open, 1.5×.

| beat | s | belief at the end | what changes |
|---|---|---|---|
| 0 A belief | 0–5 | `0.9000` | both branches, the `× 0` tag, an arm of `0.1054` |
| 1 Equal steps | 5–10 | `0.5000` | two equal treads land at 7.5 s and 10 s: `+0.2513`, `+0.3365` |
| 2 The hedge | 10–15 | `0.5000` | the crossing ring, the `log 2` rule and its name; the third formula line appears |
| 3 The same steps | 15–20 | `0.1000` | two more equal treads at 17.5 s and 20 s: `+0.5108`, `+1.0986` |
| 4 Predict | 20–25 | `0.1000` | the dashed guide to 0.05 and its `?`; the answer is withheld for five still seconds |
| 5 Halved | 25–30 | `0.0500` | the belief halves; the riser lands on the beat at 30 s |
| 6 Again | 30–35 | `0.0250` | `+0.6931` again, from a tread half as wide |
| 7 No ceiling | 35–40 | `0.0125` | `+0.6931` a third time; the final frame carries all seven stairs |

The suite walks the predict window at 0.05 s and requires that the loss after the
halving (`2.9957`), the riser `+0.6931`, and the words "doubling"/"same amount" are
absent from the drawn text a reader can see, from the picture's `aria-label`, and from
the scrubber's `aria-valuetext`. The caption is allowed to *ask* "does the loss double?";
nothing is allowed to answer it.

## Reduced motion

One still per beat, resting on the beat's finished state:
`0, 10, 10, 20, 20, 30, 35, 40` s. Beats 1 and 2 rest on the same belief and differ by
the hedge reveal; beats 3 and 4 rest on the same belief and differ by the prediction
guide — so every beat is a distinct picture whose own caption is true of it.
`registerBeatHoldTest` (exactly one drawn state per whole beat interval) passes.

## The one parameter control

The belief is the scene's one control (`docs/animation-authoring.md`, rule 1's
amendment): the mechanism *is* the belief's effect on the loss, so the reader may push
it toward zero and watch the loss run away. It is a real range over `[0.01, 0.99]` in
steps of `0.0025`, green because the belief is the model's own probability, inert and
hidden until the player mounts. The timeline sweeps it; dragging pauses playback and
recomputes the whole picture; any timeline action restores the timeline's own value, so
a drag is a detour. **A drag never earns a stair** — the staircase is the timeline's
record, not the reader's. Its keys never reach the pane's beat seeking.

## Palette

Green `#2f855a` is the belief `p̂`, a probability the model produced: the dot on the
axis, its number, and the control. Wine `#722f37` is the loss and everything that
measures it: both branches, the arm, the stairs, the readings. Purple `#805ad5` names
the label `y` — the branch tag `y = 1 term` and the `(1 − y)` in the prose. The hedge is
a reference level rather than any of the five roles, so its rule, ring and name are the
book's emphasis ink `#232d4b`; scenery is grey. **There is no orange and no blue.** No
orange because no quantity in this scene is learnable — the belief is handed to us, and
where it comes from is the sigmoid one section above. No blue because no input feature
enters this picture at all. Shape and text carry the same distinctions without colour:
the inactive branch is dashed and tagged `× 0`, the treads are dotted and the risers are
solid brackets.

## Teaching boundary

Visible sentence (27 words): *Cross-entropy is not a distance and not a probability: the
belief is bounded by 1, the loss is not bounded at all, and nothing here is trained.*

In the closed **Scope and caveats** disclosure: the formula and the surprise reading are
the chapter's, the belief's journey and every loss value are declared computed variants;
the logarithm is **natural**, so a loss is in **nats**, and the chapter's
information-theory reading of the same quantity comes later — nothing here is called a
bit; **only one term is ever active for a hard label**, so the dashed curve is drawn to
be dismissed, not read; a loss is not a probability and a probability here is not a
measured frequency, since no example has been counted and no model fitted; **the ruler
stops at 5 because a drawing must stop somewhere and the loss does not**, which is the
whole point; nothing is orange because nothing here is learnable; and **the gradient of
this loss, `∂L/∂o = p̂ − y`, is the next section's business and is deliberately absent**
— the panel links to `@eq-bce-grad` rather than drawing it.

## Transfer check

> **Check yourself.** Two examples, both labelled 1. Model A believes 0.50 on each. Model
> B believes 0.90 on one and 0.10 on the other — the same average belief. Which model's
> total loss is lower?
>
> Model A, by a wide margin. Two hedges cost 0.6931 twice, 1.3863 in all. Model B pays
> 0.1054 for the belief of 0.90 and 2.3026 for the belief of 0.10, 2.4079 together — the
> one confident mistake costs more than both hedges. Averaging beliefs does not average
> the loss.

Question 33 words, answer 49. The arithmetic: `2 × 0.6931471805599453 =
1.3862943611198906`; `0.10536051565782628 + 2.302585092994046 = 2.407945608651872`;
`(0.9 + 0.1)/2 = 0.5 = (0.5 + 0.5)/2`; the gap is `1.0216512475319812`. It is transfer,
not recall: the picture never shows two examples, never sums, and never averages, and
neither `1.3863` nor `2.4079` appears anywhere in the panel's drawing.

## What was deliberately not imported from the film

Chapter 2's film has a Surprise scene (`PICTURE 2 · surprise at the truth`, 112–168 s,
`SSurprise` in `lecture.jsx`) whose belief dot also rides `−log p`. Composition and
reveal order were taken from it; nothing else was.

- **Its gradient half is not here.** The film's scene continues into the chain rule, the
  annihilating factors, an `ALGEBRA` card against an independently `MEASURED SLOPE`
  (both `−0.1200` at `p = 0.88`), the logit strip and the slope stub. All of that is
  "The beautiful gradient", the section this panel sits immediately above, and it is
  left to the text.
- **Its handoff number is not here.** The film's belief starts at `0.67`, carried over
  from its Picture 1; this scene declares its own schedule and says so.
- **Its clipping is not here.** The film plots `-log(max(p, 0.01))`; this scene clips
  nothing. The ruler has a stated top and the control has a stated floor, and the
  boundary says the loss has neither.
- **Its colour for the loss is not here.** The film's `SURPRISE` readout is red; the
  book's wine `\residualpart` is used instead, so this panel matches the chapter's other
  scenes rather than the film.
- **Its trained numbers are not here.** The film's classifier metrics (`400/400`,
  cross-entropy `0.024`, `98.4%`) belong to a training run; nothing in this panel is
  trained.
- Its readout cards, kickers, glyph vocabulary, layout columns, caption band and
  off-page narration are all absent, as the grammar requires.

## Acceptance

- `node --test scripts/test_surprise_loss_excerpt.cjs` — **43 tests, 43 pass**: the 21
  inherited transport checks, `registerBeatHoldTest`, the seven `registerGrammarTests`
  checks, and fifteen of the scene's own (chapter binding; `loss === −Math.log(belief)`
  at 801 instants; equal treads and climbing risers, then halving treads and identical
  `log 2` risers; the arm, both branches and the ruler drawn from the published numbers
  at seven widths; the withheld prediction at 0.05 s resolution; per-beat reveals;
  reduced-motion stills; the one control and its detour; no label leaving the picture or
  meeting another at seven widths across the whole timeline; deterministic seek under an
  arbitrary play/resize/drag history; the narrow reflow; both script-free prints against
  a fresh render; fourteen unusable fixtures rejected before mount; the published key
  set; and the boundary and transfer arithmetic).
- `node scripts/render_static_frames.cjs surprise-loss` — wide print at 713 × 296 and
  narrow print at 296 × 396, both committed in `panel.html`.
- Browser review at 1280 px and 375 px, timeline and reduced motion and scripts-off:
  figure width 713 / 302, **no page overflow, no SVG text outside the picture, no
  console errors** in any pass.
- `scripts/audit_excerpt_fixtures.py` — passes for this scene once this receipt exists.
- Still owed by the orchestrator, outside this scene's files:
  `scripts/test_surprise_loss_excerpt.cjs` added to the `test` script in
  `scripts/html-tests/package.json`, and this scene's block added to
  `scripts/test_excerpt_checks.cjs`.

## Source digests

Lecture paths are relative to
`/Users/hs9hd/Library/CloudStorage/Box-Box/Teaching/6050/Video_lectures/`.

| Source | SHA-256 |
|---|---|
| `chapters/part1/02-logistic-softmax.qmd` | `f72c79714b91dac6788f7745272a104fae6c960544fb743a884165f3e573998e` |
| `6050-Ch2/STORYBOARD.md` | `16022632a6a90c8cb8f202ed8d51bd60490e040914fd732ef1e7090af9333e77` |
| `6050-Ch2/lecture.jsx` | `025b275df2150cd71963358e332ff14d73d2a610d481b9606f6cc66ce5824eeb` |

## Accent typography — September 21, 2026

The belief was spelled `p̂` (or `c̃`) as `p` plus the combining accent U+0302 (U+0303). The
body sans face carries no mark positioning for either, so the hat landed beside the letter
rather than over it: measured on the published page at 40 px, that face advances 18.24 for
`c` and 20.41 for `c̃` — a spacing tilde — while the serif face advances 18.16 for both.
Prose now says the symbol in TeX, exactly as the chapter does, and MathJax composes it. SVG
text cannot be typeset, so on the picture the accented symbol alone wears the new shared
class `.mechanism-accent`, which hands that one glyph to `Georgia, "Times New Roman", serif`
and leaves the word beside it in the body face. Nothing else moved: the static prints were
regenerated from the same geometry, and no fixture, timetable or caption changed.
