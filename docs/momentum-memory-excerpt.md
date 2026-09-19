# Momentum memory: source and acceptance receipt

**Built, not yet author-reviewed.** The scene is inserted immediately before Chapter 4's
level-2 heading *Adam: adaptive steps per knob*, so the panel closes the momentum section:
`04-training-loss-sgd.html#momentum-memory-excerpt`. The shared manuscript and every
frozen numerical result are unchanged; nothing in the QMD was edited for this panel.

## One mechanism and one question

**Question.** Momentum gives the update a memory, at the same step length. Does that speed
the iterate up in every direction?

**The misconception.** Students read momentum as "bigger steps" — a blanket speed-up, or a
learning rate in disguise. It is neither. The velocity is a *running sum*, so it is
**selective**: the components of the gradient that keep their sign accumulate against
their own history, and the components that reverse subtract from it. The zigzag damps and
the crawl accelerates from the same rule, at the same instant, with the same `α`.

**The picture.** A narrow quadratic valley (steep across, shallow along) runs left to
right with its bottom at the right, drawn as nested level curves. Below it, two rails on
**one shared scale** carry the two components of the velocity. On each rail the running
sum is written out term by term, head to tail, one term per row — so the tip of the chain
*is* the velocity component, by construction, and the whole history stays visible.

- **Beat 1** runs plain SGD for eight steps. The iterate zigzags across the steep
  direction and inches along the shallow one — the chapter's own sentence, literally true
  of this run: the across gradient flips sign at every single step (eight crossings of the
  floor in 3.3658 units of progress). Plain SGD is drawn as the *same* recursion with
  nothing kept, `β = 0`, so its rails carry one term that collapses to nothing before the
  next arrives.
- **Beat 2** resets to the same start with the same `α`, ghosts the plain path, empties
  both rails, and asks the reader to predict. The answer is withheld from the drawing, the
  caption, the SVG description and the scrubber text until the picture itself supplies it.
- **Beats 3–6** run momentum. Inside each step the picture performs the recursion in its
  printed order: the chain **shrinks by `β`**, then this step's gradient is **added to its
  tip**, and only then does the iterate move by `−α v`. The formula's two halves light in
  the same order.
- **Beat 7** overlays both paths with their step counts and how far each still is from the
  bottom.

**The payoff is step two, at 19.4 s.** Both rails hold exactly `10` after step one. Then
one rule fires on both at once: across, the shrunken `9` meets a contribution of `−10` and
the sum collapses to `−1`; along, the shrunken `9` meets `+9.5` and the sum climbs to
`18.5`. Nothing about the two directions differs except the sign of the term that arrives.

**First/last-frame test — honest verdict: passes, but by less than most scenes here.**
The last frame is unusually informative: the two finished chains are a frozen history, and
a reader who saw only the empty valley and the final frame would still see one chain folded
onto zero and the other marched out to three band-widths. What two frames cannot give is
the part the mechanism actually consists of: (a) that the two chains were *identical* after
step one, so nothing can be blamed on one direction having bigger gradients; (b) the
shrink-then-add order inside a step, which is the recursion; (c) the simultaneity of step
two, where one sum collapses and the other nearly doubles in the same instant; and (d) the
withheld prediction. The frames that carry this scene are neither the first nor the last:
they are 17.5 s → 19.4 s.

## The fixture

Everything the manuscript owns, mirrored verbatim, from
`chapters/part1/04-training-loss-sgd.qmd`:

| What | Lines | Form in the panel |
|---|---|---|
| The velocity recursion `@eq-momentum` | 337–340 | The one typeset formula line, linked as `#eq-momentum` |
| `β ∈ [0.9, 0.99]` | 342 | Named in the intro; the declared `β` is checked against it |
| "the iterate zigzags across the steep direction while inching along the shallow one" | 332–334 | Beat 1's caption and transcript item 2 |
| "in directions where gradients keep agreeing, speed builds; in directions where they flip sign every step, they cancel" | 342–345 | The mechanism the two rails draw |
| "give the update a memory … a running **velocity** that accumulates gradients" | 334–336 | The summary and the intro |
| `momentum=0.9` (the chapter's own race cell) | 401 | The declared `β`, and the scope says so |
| `plain SGD often starts around $\alpha = 0.1$` | 262–263 | Scope only: the declared `α` is not this number |

### Declared computed variants

The chapter's ill-conditioned race is seeded (`torch.manual_seed(6050)`) and never prints
an iterate, a velocity or a gradient, so no number in this picture could be mirrored from
it. Everything drawn is computed in the browser from the panel's `data-*` attributes.

1. **The valley.** A separable quadratic `L(w) = (40·across² + along²)/2`: curvature 40
   across and 1 along, a ratio of 40, so its level curves are `√40 ≈ 6.32` times longer
   than wide. The four rings drawn are the levels `51.25, 20, 5, 1.25`; the outermost is
   exactly `L` at the declared start, so the start sits on the valley's own wall and every
   point of both runs stays inside it.
2. **The start, `(0.25, 10)`.** Chosen so that both components of the first gradient are
   **exactly 10**: `40 × 0.25 = 10` and `1 × 10 = 10`. This is the fixture's whole point —
   it removes the confound that the steep direction merely has larger gradients. The band
   on each rail is that same `10`.
3. **The step length, `α = 0.05`, the same for both runs.** With curvature 40 this gives
   `αλ = 2` exactly, so plain SGD's across component sits on the oscillation boundary and
   neither grows nor dies: `±0.25` at every step, a perfect zigzag. Along, `αλ = 0.05`, a
   crawl. A smaller `α` would damp the zigzag *and* slow the crawl further, which is the
   one-dial problem momentum is for. The chapter's printed rule-of-thumb `α = 0.1` is a
   different number for a different (normalized) problem and is not used.
4. **`β = 0.9`,** the low end of the chapter's printed `[0.9, 0.99]` and the value its own
   race cell passes to `torch.optim.SGD`. At this setting the across gradient reverses
   about every second step rather than literally every step (plain SGD's reverses every
   step); the arithmetic of cancellation is the same either way, and the scope says so.
5. **Eight steps each.** Chosen so the along contribution keeps its sign at every one of
   the eight steps — the "keep agreeing" case, exactly — while momentum still reaches the
   bottom. The ninth step's gradient would finally reverse.

### The arithmetic the picture draws

Gradients and velocities under `β = 0.9`, all exact:

| step | `g` across | `g` along | `v` across | `v` along |
|---|---|---|---|---|
| 1 | 10 | 10 | 10 | 10 |
| 2 | −10 | 9.5 | −1 | 18.5 |
| 3 | −8 | 8.575 | −8.9 | 25.225 |
| 4 | 9.8 | 7.3137 | 1.79 | 30.0162 |
| 5 | 6.22 | 5.8129 | 7.831 | 32.8276 |
| 6 | −9.442 | 4.1716 | −2.3941 | 33.7164 |
| 7 | −4.6538 | 2.4857 | −6.8085 | 32.8305 |
| 8 | 8.9632 | 0.8442 | 2.8355 | 30.3916 |

- Across, the sign of `g` runs `+ − − + + − − +`: four reversals, and the sum never once
  outgrows the single first contribution of `10` (its largest magnitude *is* `10`, at
  step 1). Along, the sign never changes and the sum passes `30 = 3 × 10` at step 4,
  peaks at `33.7164`, then eases because its own gradient is dying.
- The chain a rail draws after `t` steps is the terms `β^(t−j) g(j)`, head to tail.
  At `t = 8`, across: `4.783, −5.3144, −4.7239, 6.4298, 4.5344, −7.648, −4.1884, 8.9632`,
  summing to `2.8355`. Along: `4.783, 5.0487, 5.0635, 4.7986, 4.2376, 3.379, 2.2372,
  0.8442`, summing to `30.3916`. Both sums are the velocity, checked against the
  recursion independently in the suite.
- After the same eight steps at the same `α`: plain SGD is `6.6342` from the bottom,
  momentum `0.6754` past it. Plain SGD crossed the valley floor eight times covering
  `3.3658`; momentum crossed it four times covering `10.6754`.

### Transfer check

> **Check yourself.** Raise `β` from 0.9 to 0.95 and hold `α`. One direction's gradient
> stays at 10 every step; another alternates between `+10` and `−10`. What does each
> direction's velocity settle to?
>
> The agreeing direction settles at `10/(1−β)`: 100 at `β = 0.9`, 200 at `β = 0.95` —
> doubled. The alternating one settles at `±10/(1+β)`: `±5.2632`, then `±5.1282` —
> slightly smaller. Raising `β` widens the gap from 19 times to 39 times. More memory does
> not mean bigger steps everywhere; it sharpens the selection.

Verifying arithmetic. A constant contribution `g` drives `v ← βv + g` to the fixed point
`g/(1−β)`: `10/0.1 = 100` and `10/0.05 = 200`. A contribution alternating `±g` drives it
to the two-cycle `±g/(1+β)`: `10/1.9 = 5.26315789…` and `10/1.95 = 5.12820512…`, printed
to four decimals. The ratio of the two limits is `(1+β)/(1−β)`: `1.9/0.1 = 19` and
`1.95/0.05 = 39`. The suite recomputes all six numbers twice — in closed form and by
iterating the recursion 4000 times — and asserts that none of `100`, `200`, `5.2632`,
`5.1282` is drawn anywhere on the picture at any beat, so the question cannot be answered
by reading the final frame. The scene carries no parameter control, so it cannot be
answered by dragging either.

## Beat timetable

| beat | s | what it does |
|---|---|---|
| 0 | 0–5 | The valley, the iterate at `(0.25, 10)`, the gradient split into two legs of equal length, each labelled `10`. |
| 1 | 5–10 | Plain SGD, eight steps: the zigzag across, the inch along, one term on each rail that is thrown away each step. |
| 2 | 10–15 | Reset to the same start; the plain path becomes a ghost; both rails empty; the prediction is posed. |
| 3 | 15–20 | Momentum steps 1 and 2. Step 2 is the payoff: across collapses to `−1`, along climbs to `18.5`. |
| 4 | 20–25 | Steps 3 and 4: two agreeing terms build the across sum to `−8.9`, the next reversal wipes it to `1.79`. |
| 5 | 25–30 | Steps 5 and 6: the along sum peaks at `33.7164`, above three contributions. |
| 6 | 30–35 | Steps 7 and 8. Eight terms on each rail; across `2.8355`, along `30.3916`. |
| 7 | 35–40 | Both paths, both step counts, and the distance each has left to the bottom. |

Within a momentum step (2.5 s): shrink by `β` to 36 %, add this step's gradient to 76 %,
move the iterate to 94 %, hold. The plain-SGD sweep uses the same sub-phases at
0.575 s per step with the memory set to zero. The gradient legs are pinned where the
gradient was taken — the step's own resting point — so the iterate slides off them during
the move rather than dragging a value it never measured there.

**Reduced motion** holds one still per beat, at `3, 9.8, 13, 19.9, 24.9, 29.9, 34.9, 38`
seconds: the state each caption describes, which for a moving beat is the state it ends
in. Every continuous quantity is derived from that rest time, so `registerBeatHoldTest`
finds exactly one drawn state per beat interval.

## Palette

The valley is parameter space, so both paths and the iterate are the learnable-parameter
orange `#c05621`; they are told apart by line and by label, not by hue (the plain run is
dashed and pale once it becomes the thing momentum is compared with). Every gradient is a
slope of the loss, so the two legs at the iterate and **every link of the running sum** —
each link *is* one step's gradient — are wine `#722f37`. The velocity is none of the five
roles: it is an accumulation of gradients rather than a loss, so the bar on each rail and
the number at its tip take the book's emphasis ink `#232d4b`. Scenery is grey. Every
number and name carries a white halo so it is read against white, never against a ring, a
band, a link or a path.

## Teaching boundary

The one visible sentence: *Momentum is not a larger learning rate: both runs here use the
same `α = 0.05`, and a quadratic valley is the easy case that real loss surfaces are not.*

Inside the closed **Scope and caveats** disclosure: that the valley, start, step length,
`β` and step count are declared and computed, and why none of them could come from the
chapter's seeded race; that `β = 0.9` is the low end of the printed range and reverses the
across gradient about every second step rather than literally every step; that plain SGD
is the same recursion with `β = 0` and that during its sweep the rail reads the gradient at
the drawn position; that `αλ = 2` exactly, so the zigzag neither grows nor dies, and a
smaller `α` would damp it *and* slow the crawl; the drawing devices (equal scale on both
parameter axes in the wide layout, about 2× across-magnification in the narrow one, one
declared 2.2 px-per-unit magnification shared by both gradient legs, one shared rail scale,
and the convention that `v` points uphill while the step is `−αv`); that the along
component keeps its sign at all eight steps and the eighth carries the iterate `0.6754`
*past* the bottom; that **nothing is trained, no loss is plotted**, and the step counts are
not a claim that one optimizer wins at a shared learning rate — the chapter's own
`fig-race` is that comparison and this panel is not it; and that **Nesterov** momentum and
**Adam** are named in the chapter and out of scope here.

## What was deliberately not imported from the film

The scene takes composition and reveal order only from §8 of `6050-Ch4/STORYBOARD.md`
(*Momentum*, 4:26–5:14): ask "what if the step remembers?", show the recursion, show that
persistent directions build, then that flipping directions cancel. Not imported:

- the film's **seeded race board** and its step/loss cards, and its measured losses
  (`SGD 2.250 / momentum 0.046 / Adam 0.046`) — the backlog rejects results plots and the
  chapter's `fig-race` already is one;
- the film's **three-dimensional geometry lens** over the loss surface, its focus-occlusion
  chrome, its attention pairs and its off-page narration;
- the film's own `MOM_LEDGER` sign totals (`Σ w1 = −34.3`, `Σ w2 = −4.2`) and its
  standardising ledger, which are its own measured quantities;
- the film's optimizer colour identity (`SGD` cyan, `momentum` green, `Adam` purple), which
  would contradict the book's palette: orange is reserved for learnable parameters;
- **Adam** entirely, which is a separate scene, deliberately deferred.

## How it differs from the two shipped descent scenes

`downhill-bowl` (Chapter 1) asks whether every step is the same length, and answers with a
walker on a contour map plus a shelf of step-length bars — one run, one rule, the payoff a
shrinking arrow. `sgd-zones` (this chapter) asks whether a batch direction is simply worse
everywhere, and answers with a fan of five arrows and a signal-versus-noise ruler under the
`(w, b)` plane. This scene declares a different problem — not step length, not gradient
noise, but the *sign structure* of one running sum — and draws a different picture: a
long narrow channel whose bottom is at the right, two runs of the same loop overlaid, and,
occupying the lower half of the frame, two term-by-term accumulators that neither sibling
has. There is no walker, no shelf, no arrow fan, no ruler, and no confusion region.

## Acceptance

`node --test scripts/test_momentum_memory_excerpt.cjs`: **42/42** pass. That is the
inherited 21 transport checks, the strict beat-hold check, the 6 grammar checks, and 14
scene checks of this scene's own arithmetic and drawing: a second implementation of both
runs and of the running sum; the declared loss differentiated by central differences; the
equality of the two first gradient components; `αλ = 2`; every sign-change count; that
every reversal shrinks the across sum below its own decayed history and every agreeing
term grows the along sum above it; that each drawn link is the term `β^(t−j) g(j)` at the
rail's declared scale and that the chain's tip is the published velocity; that the three
sub-phases happen in the recursion's printed order and that the formula lights the half
being performed; that the answer is withheld until 19.4 s in the drawing, the caption, the
SVG description and the scrubber text; the per-beat reveal table under reduced motion;
house-style numbers and no label collisions at seven widths; one reflow with equal parameter
scale in the wide layout; full published-state determinism under replay and reverse
seeking; static-print freshness with namespaced narrow ids at four-decimal precision; and
the boundary, scope, transfer answer and transcript wording.

Browser review at 1280 px and 375 px: figure width 713 / 302, no page overflow, no SVG text
outside the picture, no console errors, and the scripts-off fallback renders the narrow
print with readable TeX. This scene has **not** been through author review, and no PDF or
publishing verification is claimed.

## Source digests

Lecture paths are relative to
`/Users/hs9hd/Library/CloudStorage/Box-Box/Teaching/6050/Video_lectures/`.

| Source | SHA-256 |
|---|---|
| `chapters/part1/04-training-loss-sgd.qmd` | `400affc9c731f95b5d7be32f3e449f5fe8080bd010ffa6b7eab9145b0c0dd354` |
| `6050-Ch4/STORYBOARD.md` | `c5f8b635909b585d6c62f310ef2e16801c58421127d9ef6d536d7fbd331db9ce` |

`6050-Ch4/lecture.jsx` was not read; only the storyboard above was consulted, for
composition and reveal order.
