**Author-approved for publication, September 29, 2026.** The author reviewed the local build of the rendered chapter and asked for it to be committed and pushed as built. The flags below stay open; "Notes for a future edit" says where each would be changed.

# A weight moves with its query's row and its key's column: `both-axes-excerpt`

An optional, HTML-only mechanism excerpt for `chapters/part4/14-self-attention-transformer.qmd`
(file-prefix Chapter 14, printed Chapter 16), in the section "Let the sequence query itself"
(printed §16.1). It is anchored `before-heading` "Self-attention does not see order": after the paragraph
ending "one new token at a time.", about twelve source lines below the
`fig-self-attention-read` cell, and above the slogan and the proof. The PDF is untouched:
`filters/mechanism-excerpts.lua` returns `{}` for any non-HTML format on its first
executable line.

**Who asked.** On 2026-09-28 the author asked for the next replays from the films for the
next two chapters that have films, printed Chapters 16 and 18. Every unshipped scene of
films `6050-Ch14` and `6050-Ch15` was judged by an assessor and three critics, and the
author chose this scene that day from the reviewed selection
(`dl-book-prompts/dl-book-ch16-ch18-replays-prompt.md`, §2 "`both-axes`"). On 2026-09-29
the author asked for it to be built and took the recommended default on every decision:
A1 the preview placement before "The position debt"; A2 build it, with the first/last-frame
test reported as marginal; A3 accept a second picture of `shift-shuffle`'s identity; A4
accept the overlap with Exercise 1 and Check yourself; A5 include the one-move glide; A6
value blocks directly under their key columns.

## The question, and the misconception it targets

> Reorder bank, by, the, river as by, river, bank, the. Bank's row of weights follows its
> query down to slot 2. The keys reorder too: does bank's 0.70 stay in column 3, or
> follow river's key?

It follows river's key to column 1. Bank's row then reads 0.05, 0.70, 0.20, 0.05; bank's
0.20 lands on the diagonal at (2, 2); and bank's output sits in slot 2, unchanged.

**The error: "rows only".** Readers treat attention as a row-wise map: reordering the
tokens reorders the grid's rows (queries) and nothing else. Under that belief 0.70 stays in
column 3 and bank's own 0.20 sits off the diagonal at (2, 0). The correction is that every
weight belongs to one query and one key. The same reordering moves the rows and the
columns, so each weight keeps its pair; the value blocks move with the columns, so each
output travels with its token unchanged.

**What the chapter already shows.** The algebra, after the anchor (l.179–204);
`fig-self-attention-read`, which draws the grid in one order; and `fig-permutation-debt`,
which draws token tiles and audit bars. No figure and no shipped replay draws the grid under
a reordering.

**Why the question sits on the column, not on the output.** Under the rows-only slip the
output is still right (P A V = P(A V), recomputed in the suite), so a question about the
output cannot catch the slip. Two outcome misreadings stay here as background only: "new
neighbours, so bank's output changes", and "nothing moves, so slot 0 keeps its output" (the
misreading the slogan at l.176 invites; the slogan comes just after the panel, so it cannot
prime a reader at the panel). The value-block slip (reorder the value blocks but not the
columns: 0.70 in column 3 then meets the's value block and bank's output changes,
P A · P V ≠ P(A V)) is described in the scope disclosure only and never drawn.

## What moves, and the first/last-frame test

One picture: a 4 × 4 grid of green cells at the figure's own opacity map; bank's row
outlined in ink with its four weights printed; fixed grey slot labels on both axes with a
blue token name beside each that rides with its row or column; a small ink tick in each
cell whose query and key are the same token; a blue value block under each key column; a
blue output block at the end of each row ("bank's output" outlined, the others faint).
What moves: the rows (queries) with their names and output blocks, and the columns (keys)
with their names and value blocks. The slot labels, the grid frame and the formula never
move. The staging reads l.182 left to right: rows first, then columns with values, then both
at once.

**The honest limit: marginal, not a pass.** The first and last frames put the same sixteen
weights at new addresses; with labelled axes a careful reader can match them cell by cell,
and bank's 0.70 sits under river in both. A static strip of three grids (original, rows only,
final) would carry most of this panel. The motion adds continuous identity (each cell is
visibly the same cell throughout), the rows-only state in which every tick is off the
diagonal and the prediction is posed, the value blocks moving in lockstep with their
columns (the step the prose skips at l.199), and the one-move glide in which every tick
slides along the diagonal and never leaves it (l.191–192's "same simultaneous
row-and-column permutation"). The case for building it rests on two things: the kind of
confusion, a permutation and index confusion, P A against P A Pᵀ (P S against P S Pᵀ before
the softmax), which the selection ranked first; and the prediction posed at the rows-only
state.

## Staging

The grid shows weights, A = softmax(S), the figure's `A`. The rows-then-columns split is a
drawing decomposition of P A Pᵀ as (P A) Pᵀ, legitimate by associativity. P A (reordered
queries scored against keys still in their old order; equal to softmax(P S), because a
row-wise softmax commutes with reordering rows) is a real quantity, but it is not a stage in
computing SA(PX). The one-move glide (21–24 s) reconciles the staging with l.191–192: the
real operation moves rows and columns at once, every cell travels the straight segment from
its old address to its new one, and every tick stays on the diagonal line.

## Flags for the author

- The panel pictures the step the prose skips (l.199, "Putting the pieces together gives"),
  which Exercise 1 (l.1670–1672) asks readers to prove. It never states, labels or computes
  the cancellation; the lockstep stays pictorial (A4).
- It pictures the prose's answer to Check yourself l.1622 ("Why is bare self-attention
  permutation equivariant?"), stating no reason in words beyond the observed moves (A4).
- It previews a proof that starts five lines below it (A1).
- The question's premise and the early captions announce a column move before the ask
  ("The keys reorder too"), so the prediction narrows to "does a weight follow its key's
  label or stay at its address". Please judge whether that still reads as a real prediction.
- **The straight glides fold the grid, six times in all (A5).** The brief requires straight
  glides on one shared easing, and the declared order [1, 3, 0, 2] makes three pairs of
  tokens swap sides: bank with by, the with river, and bank with river. On a straight glide
  each such pair coincides once, and the first two pairs coincide at the same instant,
  a third of the way along the move. Measured from the drawn cells:
  - **About 6.5 s and 7.2 s (the row glide).** Bank's outlined row lies on by's row, and the
    row lies on river's; then bank's row lies on river's. Row names and output blocks overlap
    in pairs.
  - **About 15.2 s (the column glide, one third of the way).** The four columns fold into
    two: bank's with by's, the's with river's. Bank's four printed weights overprint in pairs:
    0.20 on by's 0.05, and the's 0.05 on 0.70.
  - **About 16.0 s (three quarters of the way).** Bank's and river's columns coincide, and
    0.20 overprints 0.70. So 0.70 is overprinted twice in the column move, not once.
  - **About 22.2 s (the one-move glide).** Rows and columns fold in pairs at the same
    instant. The sixteen cells sit on four spots, the four ticks coincide in pairs on two
    spots, and every row name, column name, value block and output block lies on a
    neighbour. At 296 px the digits read as a smear of two numbers.
  - **About 23.0 s.** Bank and river fold again, on both axes at once: four cells on one
    spot, and bank's and river's ticks on one spot.

  Each fold lasts a fraction of a second, and every hold the brief names is clean. But the
  brief's case for the motion rests on "continuous identity: each cell is visibly the same
  cell throughout", and the folds are where that is weakest. Any reordering folds under
  straight glides, since some pair of tokens must swap sides. Arc lanes (the film's device)
  were excluded by the brief, so there is no code change within it. **Please scrub to 22.2 s
  when you judge A5.** A5's documented alternative remains open: drop the one-move glide,
  hold the final state longer, and leave the reconciliation with l.191–192 to the receipt.
  That removes the 22.2 s and 23.0 s folds; the row and column folds stay.

## Precedent: `shift-shuffle`

`shift-shuffle` (printed Chapter 6) shows that a common reordering moves every product
without changing one. The key-and-value lockstep here is that identity carried into
attention: a weight and the value it multiplies travel together, so bank's weighted sum is
unchanged. This panel does not re-teach the sum. Its new content is the two-axis grid, and
its check targets an address, not a total (A3).

## The fixture

`data-evidence-class="computed"` on the `<details id="both-axes-excerpt">` root, which also
carries the three fixture attributes (never an SVG element, never text). The player reads
them and retypes no number; the captions are composed from them.

| attribute | value | what it mirrors |
|---|---|---|
| `data-tokens` | `bank by the river` | l.101 `tokens = ["bank", "by", "the", "river"]` |
| `data-weights` | `0.20 0.05 0.05 0.70; 0.15 0.40 0.25 0.20; 0.10 0.25 0.40 0.25; 0.45 0.10 0.10 0.35` | l.102–105, the figure cell's `A`; row 0 is also the l.94 fig-alt's "0.20, 0.05, 0.05, 0.70" |
| `data-order` | `1 3 0 2` | declared: slot i of the reordered sequence holds token order[i] (by, river, bank, the) |

Twenty literals are bound in the manifest, each occurring exactly once in the chapter at
`3653e3d` (unchanged at `1bc62ab`): the attention display (l.73–75); "Row $i$ contains the
scores from query position $i$ to every key position $j$." (l.78–79); the fig-cap's "the
numbers and shading are illustrative" (l.93); the fig-alt's top-row sentence (l.94); the
tokens line and the four rows of `A` (l.101–105); the opacity map
`(0.8 if hot else 0.6) * A[i, j] + 0.12` (l.133); the digit format `f"{A[0, j]:.2f}"`
(l.136); the slogan (l.176), which binds the line the anchor must stay above; the
definition of P (l.179); `Q'=PQ,\quad K'=PK,\quad V'=PV` (l.182); the simultaneous
row-and-column sentence (l.191–192); "Putting the pieces together gives" (l.199);
SA(PX) = P SA(X) (l.202–203); the naming sentence (l.206–207); Check yourself l.1622; and
Exercise 1's first line (l.1670).

**Declared layout.** The order [1, 3, 0, 2]: every token moves, it is not an involution and
it is not a cyclic shift. Slot labels are 0-based on both axes, as in `fig-permutation-debt`.
The staging: rows, then columns with values, the 0.8 s fade, then the one-move glide. Value
blocks under their key columns and output blocks at the row ends, both without numbers. The
self-weight ticks. The closing ghost and path.

**Rows 2 to 4 are never printed.** 0.15, 0.40, 0.25, 0.10, 0.45 and 0.35 appear in no text
node, aria attribute, static print, transcript, scope or check; the rows are shading and test
invariants only, as in the figure, whose cell is `echo: false`. 0.20 appears only as bank's
weight (by's weight on river is 0.20 too), and prose always says "bank's 0.20" or lists
bank's whole row. The suite scans every reader surface for these at every half second in
both motion modes.

### Declared computed variants

Recomputed by the player and by `scripts/test_both_axes_excerpt.cjs` from the literals and
`data-order`; nothing is taken from `ch14-data.js`.

| quantity | value |
|---|---|
| bank's and river's new slots | 2 and 1 |
| bank's 0.70 | (0, 3) → rows only (2, 3) → final (2, 1) |
| bank's 0.20 | (0, 0) → rows only (2, 0) → final (2, 2) |
| bank's row in the new column order | 0.05, 0.70, 0.20, 0.05 |
| rows only: self-weight cells | bank (2, 0), by (0, 1), the (3, 2), river (1, 3); none on the diagonal |
| rows only: the diagonal (receipt only, never printed) | 0.15, 0.10, 0.05, 0.25 |
| final: the diagonal (receipt only; only bank's 0.20 is printed) | 0.40, 0.35, 0.20, 0.40, the four self-weights |
| final grid, entrywise | (i, j) = A[order[i], order[j]] |
| rows-only grid, entrywise | (i, j) = A[order[i], j] |
| row sums | every row sums to 1 to within 10⁻¹² |
| bank's row shading, 0.8 × a + 0.12 | 0.28, 0.16, 0.16, 0.68 (other rows 0.6 × a + 0.12) |
| identities (tests only, generic V declared in the test) | P A V = P(A V); P A Pᵀ · P V = P(A V); P A · P V ≠ P(A V); P A Pᵀ · V ≠ P(A V) |
| check order [2, 3, 1, 0] (the, river, by, bank) | 0.70 → (3, 1); bank's 0.20 → (3, 3); row 0.05, 0.70, 0.05, 0.20 |
| check: rows-only trap | 0.70 at (3, 3), bank's 0.20 at (3, 0) |
| check: direction slip (order read backwards) | bank's row in slot 2, 0.70 at (2, 0) |

Weights print to two decimals, as the figure prints them (l.136) and the fig-alt states them
(l.94). Slot indices are integers. Geometry is serialized with `toFixed(4)`.

## Beats

Duration 40 s, `data-beats="0 5 10 14 20 26 31 36"`. All three glides share one easing
(smoothstep).

| beat | s | what happens | caption(s) |
|---|---|---|---|
| 0 | 0–5 | still, the chapter's order; bank's row 0.20 / 0.05 / 0.05 / 0.70; four ticks on the diagonal | "Bank's row: 0.70 on river's key, 0.20 on bank's own. Each tick marks a token's weight on itself." |
| 1 | 5–10 | the query rows glide over 5.5–8.0 with their names and output blocks; `ba-q` washes; bank's row lands in slot 2, bank's output with it; every tick leaves the diagonal | 5.0 "Reorder to by, river, bank, the. The query rows move first, each to its token's new slot."; 8.0 "Bank's row sits in slot 2, and bank's output rode with it. The columns have not moved." |
| 2 | 10–14 | the ask; nothing moves from 8.0 to 14.0 (6.0 s) | "Keys reorder too. Does bank's 0.70 stay in column 3, or follow river?" |
| 3 | 14–20 | the columns glide over 14.0–17.0 with their names, each value block beneath its column on the same timing; `ba-kt` and `ba-v` wash; 0.70 rides river's column to column 1, bank's 0.20 reaches (2, 2), every tick returns to the diagonal; bank's output neither moves nor changes; still over 17–20 | 14.0 "Each weight follows its key's column, and each value block slides along beneath it."; 17.0 "0.70 followed river to column 1, and river's value came along: bank's output is unchanged." |
| 4 | 20–26 | the drawing group fades out to 20.4, jumps to the chapter's order and fades back in by 20.8 (group opacity only; one grid, one set of ticks); one glide over 21.0–24.0 moves every cell straight to its new address, rows with outputs and columns with value blocks on one clock, all three washes on from 21.0 | 20.0 "Back to the start, then the same reordering in one move: rows with outputs, columns with value blocks."; 24.0 "Every tick slid along the diagonal and never left it." |
| 5 | 26–31 | still, final | "Queries moved the rows, keys moved the columns, and each value block moved with its key." |
| 6 | 31–36 | still, final | "Same four weights in bank's row, at new addresses; bank's output sits in slot 2, unchanged." |
| 7 | 36–40 | closing hold: an ink ghost outline of bank's row at slot 0 (no digits) and one thin straight ink path from 0.70's first cell (0, 3) towards (2, 1), stopping short of the printed 0.70; this 40 s frame is the static print, wide (713) and narrow (296) | "Bank's 0.20 is back on the diagonal, and 0.70 still meets river's value block." |

**Reduced motion** holds one state per beat: beat 0 the chapter's order; beats 5 and 10 rows
only; beat 14 final; beat 20 the chapter's order with the one-move caption; beats 26, 31 and
36 final (36 with the ghost and path). Each still carries its beat's opening caption, except
beat 14: its still is the finished state, so it carries the 17.0 reveal ("0.70 followed river
to column 1, and river's value came along: bank's output is unchanged.") for the whole beat.
The captions not shown under reduced motion are the 8.0 landing, the 14.0 slide description
(it describes a slide the reader never sees) and the 24.0 glide caption. The transcript
carries all eleven.

**Withholding.** From 0.0 to 14.0 s the drawing, the svg `aria-label`, the live caption and
the scrubber's `aria-valuetext` hold none of: 0.70 in any column but 3, the key names in the
new order, bank's row in the new column order, bank's 0.20 at (2, 2), or "column 1". No
column or value-block glide starts before 14.0. The svg's `aria-label` is a constant
description of the picture's structure; the scrubber's value text names the current row and
column orders and bank's row as read left to right. The closed transcript, the closed check
and the static prints hold the reveal by design.

## Palette

Blue `#2b6cb0`: token names on both axes, value blocks and output blocks, carried values
told apart by place and label. Green `#2f855a`: the weights, as probabilities, following
`mask-before-softmax` (key labels blue, probabilities green, operators neutral). Ink
`#232d4b`: bank's row outline and digits, the ticks, the closing ghost and path, and the
formula washes. Grey: slot labels, axis words and the grid frame. No orange (W_Q, W_K and
W_V are not drawn, and nothing learned moves), no purple, no wine, none of the film's colours.

**Departure from the figure's house colours**, declared in the scope disclosure: the figure
draws bank's query row, bank's weight cells and the row outline in `#E57200`, the other rows'
weight cells in `#9A9A9A`, V and the outputs in `#2E7D32`, and the token labels and Kᵀ
columns in navy `#232D4B`.

**Contrast with `kernel-weighting`** (printed Chapter 14): there the observed values are
purple and the prediction green. Here V is computed from X, not observed, so values and
outputs stay blue, and green stays with the weights. Please judge this contrast in review.

## Teaching boundary

> One reordering of the chapter's illustrative weights, in bare self-attention with no mask
> and no position signal; the proof that follows covers every reordering.

The closed "Scope and caveats" disclosure (no P and no "permutation" in it) states that the
reordering is declared, moves every token and does not reverse itself, and that the
chapter's audit reorders random vectors in another order and gives the panel none of its
numbers or its order; that the weights are the figure's illustrative ones with only bank's
row printed; that rows-then-columns is a drawing device, the rows-only grid a real quantity,
and the real operation moves both at once, as the one-move glide shows; the value-block
slip, never drawn; "one example, not a proof"; what "bare" means; and the palette
departure.

**Hard limits kept.** No P, Pᵀ, "permutation matrix", SA(PX) or the l.188 line anywhere in
the panel; no "permutation", "equivariant" or "invariant"; the panel says "reorder" and ends
on the observation that bank's output sits in slot 2, unchanged, leaving the naming to
l.206. Never "cancel", "inverse" or "transpose". No audit or film numbers (2.2 × 10⁻¹⁶,
1.581, the five-token sentence, the "." token, [2, 4, 0, 1, 3]), no pooled output, no mask,
triangle, position code, clock or sinusoid in the picture or the check. No token tiles,
cards, chips, tables or stage strips. Never "rematch". The formula mirrors the chapter's
display at l.73–75, which has no equation label, so the panel links no equation.

## The transfer check

> Reorder to the, river, by, bank. In which cells (row, column; slots 0 to 3) do bank's 0.70
> and bank's own 0.20 land, and how does bank's row read?

Row 3, bank's new slot: 0.70 follows river's key to (3, 1), and bank's 0.20 lands on the
diagonal at (3, 3). The row reads 0.05, 0.70, 0.05, 0.20. Moving the rows alone would leave
0.70 at (3, 3), on bank's own diagonal cell.

It is transfer, not recall: the order is a new 4-cycle (every token moves, not an
involution), reading it backwards puts bank's row in slot 2 and 0.70 at (2, 0), so a
direction slip shows, and the panel has no control and never shows this order or its cells.
`expected['both-axes']` in `scripts/test_excerpt_checks.cjs` hard-codes the order
[2, 3, 1, 0], reads `data-tokens` and `data-weights` from the root, recomputes "(3, 1)",
"(3, 3)" and "0.05, 0.70, 0.05, 0.20", asserts that 0.70's rows-only cell equals bank's
final self-weight cell, and asserts that the order moves every token, is not an involution
and differs from `data-order`. Masks, position codes, pooling and the bank/river swap (an
involution whose diagonal needs rows readers never see) stay out of the check.

## Placement

`before-heading` "Self-attention does not see order" (l.174; an exact, unique H3, renamed from "The position debt" in the
Parts II + IV prose pass and pinned to its old `{#the-position-debt}` id; the filter
places panels before level-2 and level-3 headings). It lands after the paragraph ending "one
new token at a time." (l.169–172), about twelve source lines below the
`fig-self-attention-read` cell (which ends at l.162), and above the slogan (l.176) and the
proof (l.179–204). This is a preview placement (A1): the proof follows within five lines and
stays authoritative. Every later anchor is recall (the slogan answers the question; the
proof, the name at l.206, the audit and `fig-permutation-debt` state or test it), and the
NOVEL block (l.217–539) is off limits.

Chapter 16 then carries two replays in different sections, about 745 source lines apart:
this one in §16.1, and `layernorm-axis` (after-cell `cell-fig-transformer-block`) in §16.4
"Build a Transformer block". To recheck in the render: the printed section numbers §16.1 and
§16.4 (the `## ` lines at l.433, l.1243, l.1423 and l.1523 are callout titles, not sections).

## What was imported from the film, and what was not

Film `6050-Ch14`, scene `PermutationDebt` (`lecture.jsx` l.42; registered in `SCENES` at
l.80; `OM_SCENES` dur 50, scene window 62–112 s; captions 62–111.8 s, cues 13–18 of
`transcripts/16-self-attention-and-the-transformer.timeline.json`). Route B: the film never
shows the quantity this panel asks about (a weight's address on two axes); its moving object
is a row of token cards, `fig-permutation-debt`'s left panel set in motion, and no weight
grid, weight, value row or output ever moves in it. The moving object here, bank's weight row
on the 4 × 4 grid of `fig-self-attention-read` with value and output blocks, is this panel's
own.

**Taken, and only these three:** the question-first still hold (STORYBOARD l.116–117, "the
permutation shuffle (62 → 64)"), re-posed on the column (cue 13's intent, "what happens to the
five outputs?"); the kicker's show-then-name reveal order, without its naming beat (the
chapter names the property at l.206, after its proof); and the intent of cue 14 ("Every
intermediate and output rematches under the same shuffle."), which the film asserts with an
error number and this panel draws on the grid.

**Not taken:** the arc-lane card shuffle; the 2.22 × 10⁻¹⁶ and 1.581 cards (audit receipts);
the pooled beat and cues 17–18 (the second half of Exercise 1); the proof focus card;
`CH14_DATA.permutationDebt` and every film number (five seeded width-8 tokens, the order
[2, 4, 0, 1, 3]); the "." token; the blue, purple, green and orange card states, glow pulses
and "X slot / P slot" mono labels; the title's "equivariant, not invariant" contrast and cue
16's wording; the word "rematch"; narration, the film runtime and React.

**`Matrix`** (`lecture.jsx` l.21), the film's weight-grid component (used in `SameSequence`,
`MultiHeadSplit` and `CausalMask`, never reordered), is cited only as the precedent for one
outlined query row on a shaded grid. The panel keeps the outline, in ink, and drops the
digits on the other rows, the orange and the glow pulse.

`ch14-data.js` was read and hashed only to record that nothing was taken from it.

## Departures from the brief, and why

- **Glide timings (the binding contract wins).** The brief's rows glide over 5.5–8.5 s with
  a caption at 8.5, and the one-move glide over 21.0–24.5 s with a caption at 24.5; each of
  those captions would stand 1.5 s before the fixed beat captions at 10 and 26, and the
  harness's grammar suite (`registerGrammarTests`, a caption must stand 2 s) fails that. The
  rows now land at 8.0 with their caption, and the one move lands at 24.0 with its caption.
  The ask therefore holds still for 6.0 s (8.0–14.0). Every window the brief names still
  holds, and the suite checks the wider ones (no tick on the diagonal over 8.0–14.0; every
  tick on it from 24.0; bank's output fixed over 8.0–20.0 and 24.0–40.0).
- **Column labels stack slot over token at every width**, not only at narrow widths. On one
  baseline, a moving token name would slide through the fixed slot labels during the column
  glides. Row labels sit side by side at every width, as the brief says ("beside each
  label"), with the slot labels and the token names in two separate lanes. A token name
  glides vertically past the other names but never through a fixed slot label. (The first
  build stacked the row labels below 560 px, and at phone widths a gliding name ran through
  the fixed "slot n" labels; that has been fixed.) Below 560 px the type and margins shrink,
  giving 40 px cells at 296 px, and the tracked output's label wraps to "bank's" over "output".
  The narrow print is 296 × 248.
- **Two added scenery words**, "values" beside the value-block row and "outputs" above the
  output column, small and grey like "queries" and "keys", so the blocks' roles are named on
  the picture.
- **Reduced-motion captions.** The brief removes only the glide caption under reduced
  motion. The contract's one state per beat allows one caption per beat, so two more drop
  out. The 8.0 landing sentence goes because beat 5 keeps "Reorder to by, river, bank, the.",
  the only caption that names the new order. The 14.0 slide sentence goes because beat 14
  carries the reveal, which describes the still it shows. The transcript carries all eleven.
- **Summary line and svg title** ("Watch the mechanism: reorder the tokens and follow bank's
  row"; "Bank's row of weights, before and after a reordering") are chosen so that neither
  states the answer above the question.
- **Tick placement.** Each tick sits in its cell's top-left quadrant, offset equally in x and
  y, because bank's digits hold the cell's centre; an equal offset keeps a tick on the
  diagonal line exactly when its cell is on the diagonal.
- **Shared transport text.** The shared control bar's scrubber is labelled "Playback
  position" (`interactives/shared/controls.html`, on every panel). The forbidden-word scan
  covers every panel surface and the scrubber's value text, and sets that shared label aside.

## Verification

- `node --test scripts/test_both_axes_excerpt.cjs scripts/test_excerpt_checks.cjs
  scripts/test_mechanism_excerpts.cjs`: 176/176. That is the scene's own 52 tests, including
  the transport, beat-hold and grammar suites, plus `both-axes: one closed transfer check
  whose numbers follow from the declared fixture`. One of the 52 is new: at 296, 375, 559,
  560 and 713 px, in 0.05 s steps over 5.5–8.0, 14.0–17.0 and 21.0–24.0 s, no moving label
  runs through a fixed one. It failed on the first build at 296 px, 5.8 s ("river" through
  "slot 3") and passes now. The ask's 4 s stillness is now measured from the drawn markup
  and the caption, not asserted as a constant.
- `node scripts/render_static_frames.cjs both-axes --check`: "interactives/both-axes/panel.html
  is current".
- `npm test --prefix scripts/html-tests`: 2232/2232.
- `audit_excerpt_fixtures.py --lecture-tree "$BOX/Video_lectures"`: "PASS: 47 mechanism
  excerpt(s) mirror 321 verbatim fixture literal(s) across 22 chapter(s), with 179 declared
  computed variant(s), current chapter digests in 41 receipt(s), live anchors, and one
  declared timeline each; 83 recorded lecture source(s) re-verified". This scene alone, run
  through the audit's `audit_scene` and `audit_lecture_sources`, gives no errors, 20 literals,
  7 computed variants and 3 film digests re-verified.
- Rasterised with headless Chrome at 2×. Scripts off: the wide print (713) and the narrow
  print (296 × 248). Live player at 296 px: 6.9, 7.2, 10, 15.2, 16, 22.2, 22.5, 23 and 40 s.
  Live at 375 px: 6.9, 22.5 and 40 s. Live at 559 px: 22.5 s. Live at 713 px: 22.2 and 40 s.
  - No fixed label is crossed at any of these frames.
  - All text stays inside the picture.
  - The rows-only frame (10 s) holds none of the answer.
  - At 15.2, 16, 22.2, 22.5 and 23 s, moving labels and digits overprint one another, at and
    near the folds flagged above.
- Not yet run: a full `quarto render --to html`, the rendered-site audits, the render checks
  of §16.1 and §16.4, and the browser inspection at 1280 and 375 px on the rendered page.

## Notes for a future edit

Written for a later session that edits this scene without the conversation that built it. Read
this receipt, `docs/animation-authoring.md` (design rules and visual grammar) and the scene brief
it was built from (`dl-book-prompts/dl-book-ch16-ch18-replays-prompt.md` §2 "`both-axes`", kept in
the author's Box folder `Teaching/6050/`) before changing anything.

- **Where things live.**
  - `interactives/both-axes/panel.html` holds the fixture on the `<details>` root
    (`data-tokens`, `data-weights`, `data-order`), the question, intro, boundary, scope, check and
    transcript, and the static final frame.
  - `interactives/both-axes/player.js` builds the picture once and moves it. `CAPTIONS` holds the
    caption lines; `T` and `SCHEDULE` hold the timetable inside the beats `0 5 10 14 20 26 31 36`;
    `REDUCED` holds the one still per beat under reduced motion; `motion(time, reduced)` places every
    mark.
  - `interactives/both-axes/player.css` scopes the palette and the narrow layout.
  - The tests are `scripts/test_both_axes_excerpt.cjs` (52 tests) and the check's numbers in
    `expected['both-axes']` in `scripts/test_excerpt_checks.cjs`.
  - Registration is the scene's entry in `interactives/manifest.json` (literals, computed variants,
    duration, beats) and its `player.js` line under `project.resources` in `_quarto.yml`.
- **Judgements the author left open when approving:**
  1. **The folds at about 22.2 s and 23.0 s** (the one-move glide; see the flags above). The cheapest
     change is A5's alternative: drop the one-move glide and hold the final state. That touches `T`,
     `SCHEDULE`, `CAPTIONS` and `REDUCED`. If the beat count changes, update the pane's `data-beats`,
     the manifest's `beats` and the Beats section here together.
  2. **The ask narrows to one choice**, "does 0.70 stay in column 3 or follow river", because the
     question and the 5 s caption say the keys reorder. A sharper ask would hold that clause back until
     after 14 s. That means the question in `panel.html`, the `rows` and `ask` captions, and the
     withholding tests.
  3. **Values and outputs are blue and weights green.** `kernel-weighting` draws values purple. A
     recolouring is a `player.css` change plus the Palette section here.
- **After any change**, from the repo root:
  - `node scripts/render_static_frames.cjs both-axes`, then the same with `--check`;
  - `node --test scripts/test_both_axes_excerpt.cjs scripts/test_excerpt_checks.cjs scripts/test_mechanism_excerpts.cjs`;
  - `npm test --prefix scripts/html-tests`;
  - `$HOME/.venvs/dl-book/bin/python scripts/audit_excerpt_fixtures.py --lecture-tree <Box>/Teaching/6050/Video_lectures`;
  - `quarto render --to html` (the full project; a single-chapter render re-executes the chapter);
  - a browser check of the anchor at 1280 and 375 px.
- **If the chapter changes**, the digest below goes stale and the fixture audit fails. Re-read the
  twenty literals against the new text, then run `scripts/refresh_excerpt_receipts.py`. The anchor
  depends on the H3 "Self-attention does not see order" keeping its exact text.

## Source digests

Lecture paths are relative to the lecture repository root (`$BOX/Video_lectures`), hashed
from that tree itself on 2026-09-29.

| Source | SHA-256 |
|---|---|
| `chapters/part4/14-self-attention-transformer.qmd` | `930032b18b611956da49d68dc51fa0971ad7e1505dde193c28faf65587faca63` |
| `6050-Ch14/lecture.jsx` | `ac103ade3aecf01355955a24a1a2042cd9c58d6a434b39dd7ef6e680ee0fce93` |
| `6050-Ch14/STORYBOARD.md` | `cd493a87b78f9f2fcd705bd2385bf4f8651bb3a9472e44b120838fffa81b1324` |
| `6050-Ch14/ch14-data.js` | `df6cfab3b0b92b5e9eaf634ae82a229f42dfa32030600bc0016ef90d7b11ff39` |
