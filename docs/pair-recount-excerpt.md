**Author-approved for publication, September 29, 2026.** The author reviewed the local build of the rendered chapter and asked for it to be committed and pushed as built. The flags below stay open; "Notes for a future edit" says where each would be changed.

# Every round counts the pairs again: `pair-recount-excerpt`

An optional, HTML-only mechanism excerpt for Chapter 15 by file prefix
(`chapters/part4/15-bert-pretraining.qmd`), which prints as Chapter 18, in its fourth
numbered section, "From a Transformer encoder to BERT" (§15.4 by file prefix, printed
§18.4), inside the unsigned byte pair encoding bridge (l.401–480). It is placed
before the `bpe-mechanism` cell's Plan → Code wrapper (l.417), directly after the optional
Practice-bridge callout (closes l.415). The PDF is untouched: `filters/mechanism-excerpts.lua`
returns `{}` for any non-HTML format on its first executable line.

**Who asked.** The author asked on 2026-09-28 for the next replays from the films for the
next two chapters that have films, printed Chapters 16 and 18 (films `6050-Ch14` and
`6050-Ch15`), and chose this scene that day from a reviewed selection in which every
unshipped scene was assessed, attacked by three critics and fact-checked (brief:
`dl-book-prompts/dl-book-ch16-ch18-replays-prompt.md`, §2 "`pair-recount`"). On 2026-09-29
the author asked for it to be built, taking every recommended default:

| Decision | Taken |
|---|---|
| B1, scheduling | The brief's alternative, not its recommendation: built now on branch `ch16-ch18-replays` from `main` = `1bc62ab`, before the two earlier batches (`dl-book-four-replays-prompt.md` and `dl-book-ch14-bandwidth-share-prompt.md`) merged; neither is on `main` at `1bc62ab`. Rebase after they land, re-hashing any receipt whose chapter changed |
| B2 / P2, training replay | No: a five-round deterministic counting loop is not a deferred training replay |
| P1, build it at all | Build, with this receipt admitting the learner critic's objection |
| P3, the unsigned NOVEL block | Build now on the unsigned bridge. The precedent is the one the unmerged four-replays brief sets for `decoder-family`, which is not yet on `main` (see B1 and Scoping notes) |
| P4, anchor | before-cell `bpe-mechanism`, to be verified in the render |
| P5, formula line | The declared transcription of l.455–457 with the `pr-recount` wash |
| P6, the ask's premise | "At its first count, w+e has 8 … and l+o has 7", plus "Its first three merges each use 9 weighted occurrences" |
| P7, w+e after merge 5 | Retire the live bar, keep the ink ghost "w+e 8" |
| P8, beats | `0 5 10 15 22 30` |
| P9, stale counts | Fuse, snap and count as two steps (fuse 5.0, snap 5.8, count 6.4) |
| P10, the tally's colour | Ink |

## The question, and the misconception it targets

> Byte pair encoding merges the most frequent adjacent pair, then repeats. At its first
> count, w+e has 8, across newest and lower, and l+o has 7, across low and lower. Its first
> three merges each use 9 weighted occurrences. Which pair is merged fourth?

Answer: **l+o**. w+e's 8 is 6 from `newest` plus 2 from `lower`. Merge 1 (e+s) puts
`newest`'s e inside `es`, so the next count finds w+e only in `lower`: 2, in every round
from 2 to 5. In round 4, l+o and o+w tie at 7 and lexicographic order picks l+o (l.413–414,
l.459). lo+w follows, `lower`'s w goes inside `low`, and w+e never merges; `lower` ends
`low | e | r | </w>`, as the printed stdout shows. Each count in the question is tied to the
first count, so no sentence states the stale 8 as the count the fourth merge is chosen from.

**The misconception.** Pair counts are fixed at the start, so w+e's 8 still beats l+o's 7
once the nines are merged. Rerunning the chapter's loop with the round-1 counts held fixed
gives that reading's outcome: the merges e+s, s+t, t+</w>, w+e, l+o; `lower` ending
`lo | we | r | </w>`; `est</w>` never forming, and `newest` ending `n | e | w | es | t</w>`.
The chapter rules it out in its own words: l.409 says the algorithm "repeats", and l.454
builds a fresh `Counter()` inside `for _ in range(5):` (l.453), iterating over the current
segmentation (l.455). Each merge is chosen from counts redone on the current pieces, and a
merge removes another pair's support only where the two share a symbol occurrence (here
`newest`'s e). The panel never writes "merges are chosen round by round, not down a fixed
list": a learned merge list is applied in rank order at encoding time. The "-er suffix"
trap was dropped (e+r counts 2; nothing on the page invites it).

**Recall analysis.** Nothing before the anchor states the counts, the merges or the
spelling of `lower`: at the anchor the reader has the algorithm (l.408–410) and the
tie-break (l.413–414), not the corpus, the printed merges or the stdout. The panel
previews the next cell's output, which is not a posed prediction. No figure, shipped
replay, Predict prompt, Check yourself item (callout at l.1702–1710) or Exercise (1–6)
touches tokenization; the chapter never mentions w+e, its 8, or its fall to 2.

## What moves, and why two frames could not do it

One picture: the four counted words as rows of tiles (characters plus `</w>`), each with
its frequency, and a count axis (right of the rows at 600 px and wider, under them below).
Tiles fuse at each merge; that fusion is the operation. The tracked object is w+e's
support: two ink arcs over `newest`'s and `lower`'s w-e seams and the tally bar they build
(segments "lower 2" and "newest 6", total 8). At merge 1, e and s fuse in `newest` and
`widest` together; `newest`'s arc then loses its right end and becomes a dashed stub; at
the round-2 count `newest`'s segment slides off the bar, leaving a dashed outline "w+e 8",
and the bar reads 2. `lower`'s tiles and arcs never move until merge 4. l+o (slate,
thinner) is scenery until round 4, when the level stands at 7 over "7: l+o, o+w" with w+e's
2 far below its own ghost. Merges 4 and 5 build `low` in both words, `lower`'s w+e arc
dissolves, and the bar's last 2 fades.

**The honest first/last-frame paragraph.** The book's own printed claim passes the
two-frame test: l.471–473 has `est</w>` from nine, `low` from seven, and `lower` as
`low | e | r | </w>`, and the stdout prints it directly under the next cell. What needs
motion, w+e's fall from 8 to 2, is a declared computed consequence of the l.453–461
recount, not a sentence the prose states. The learner critic refuted the pick on exactly
this ground. The case for building rests on two points: l.409's "repeats" and l.454's
`Counter()` inside the loop are the chapter's rule, and the panel shows that rule acting on
the chapter's own corpus; and the timing is what a static pair loses: `newest`'s 6 leaves
at merge 1, while w+e still outscores l+o and before its turn could come; the arc snaps as
e fuses into `es`, in a different word from the `lower` the reader tracks; the round-4
contest (l+o 7 against w+e 2) is held at the level; `est</w>`, and later `low`, form in two
words at once. The static print (frame 40) carries the final pieces, the ghost "w+e 8"
with no live bar, and the stub, from which a careful reader can infer that `newest`'s w-e
seam was lost to `est</w>`.

## The fixture

`data-evidence-class="computed"`: fresh computation from manuscript literals; nothing is a
declared toy. The player runs the chapter's loop (fresh count of the current pieces, the
maximum, the least tied pair compared element by element as Python compares tuples, then
`merge_pair`) on the attributes below and never retypes a count; the captions' numbers are
composed from that run.

| Attribute (on the `<details>` root) | Value | What it mirrors |
|---|---|---|
| `data-words` | `low lower newest widest` | l.449, the corpus line, in its order |
| `data-frequencies` | `5 2 6 3` | l.449 |
| `data-end-marker` | `&lt;/w&gt;` | l.450 (`tuple(word) + ("</w>",)`) and l.412 |
| `data-merges` | `5` | l.453, `for _ in range(5):` |
| `data-tie-break` | `lexicographic` | l.413–414 and l.459 (`min` over tied pairs) |
| `data-tracked` | `w e` | declared layout: the tracked pair |
| `data-rival` | `l o` | declared layout: the rival pair |
| `data-count-axis` | `0 10` | declared layout: the count axis domain, no tick labels |

**Nineteen literals** (manifest `fixture.literals`), each occurring exactly once in the qmd
at the digest below (the same digest `bert-ledger`'s receipt, `docs/kernel-bert-excerpts.md`
l.32, records; the scene test asserts "exactly once"): l.408–410 "counts adjacent pairs in
the training / corpus, merges the most frequent pair, and repeats until it reaches a chosen
vocabulary / budget."; l.412 "This original toy implementation starts from characters plus
an end-of-word marker."; l.413–414 the tie-break sentence; l.441 `merged.append("".join(pair))`;
l.449 the corpus line; l.450 the `words =` line; l.453 `for _ in range(5):`; l.454–456 the
`Counter()`, `for symbols, frequency` and `zip` lines with their leading spaces; l.457
`counts[pair] += frequency`; l.458 `maximum = max(counts.values())`; l.459 the `best = min(…)`
line; l.461 the `merge_pair` line; l.464 the `print("merges:", …)` line (the source of the
`e+s` notation); l.471–472 "The first three merges build `est</w>` from nine weighted
occurrences; the next two / build `low` from seven."; l.472–473 the `lower` sentence;
l.474–475 "This is the mechanism, not BERT's tokenizer: WordPiece uses a different
merge-scoring / criterion"; l.475–476 "practical byte-level tokenizers begin from bytes rather
than the toy / character alphabet."

**Frozen stdout binding** (not a qmd literal; the 9 and the 7 appear in the qmd only as
"nine" and "seven"). `scripts/test_pair_recount_excerpt.cjs` reads
`_freeze/chapters/part4/15-bert-pretraining/execute-results/html.json` read-only (the
`test_mask_predictor_excerpt.cjs` precedent) and asserts that each of
`merges: [('e+s', 9), ('es+t', 9), ('est+</w>', 9), ('l+o', 7), ('lo+w', 7)]` and
`lower: low | e | r | </w>` occurs once there, that the loop rerun from the panel's
attributes prints both, and that the merges read back out of the drawn tiles (each change of
the drawn pieces identified as one `merge_pair` step, counted on the pieces drawn just before)
print the same line.

### Declared computed variants

All from l.449 under l.453–461, confirmed by rerunning the chapter's loop (in Python and,
independently, in the scene test).

- **Round 1.** Fourteen distinct adjacent pairs (the pick said fifteen; the rerun gives
  fourteen). Maximum 9, tied e+s, s+t, t+</w>, so e+s. w+e 8 (newest 6 + lower 2); l+o 7
  (low 5 + lower 2); o+w 7 (low 5 + lower 2). Not drawn: e+w 6, n+e 6, w+</w> 5, d+e 3,
  i+d 3, w+i 3, e+r 2, r+</w> 2.
- **Rounds 2 to 5.** Maxima 9 {es+t, t+</w>} → es+t; 9 {est+</w>}; 7 {l+o, o+w} → l+o;
  7 {lo+w}. Merges: e+s 9, es+t 9, est+</w> 9, l+o 7, lo+w 7.
- **w+e and l+o.** w+e is 8 in round 1 and 2 in rounds 2 to 5; after merge 5 it is absent,
  and `lower`'s pair at that spot is low+e, counted 2 (not drawn). l+o is 7 in rounds 1 to 4.
- **Final pieces.** `low | </w>` ×5; `low | e | r | </w>` ×2; `n | e | w | est</w>` ×6;
  `w | i | d | est</w>` ×3.
- **Scope values.** Reverse tie order (largest tied pair wins): merges t+</w> 9, s+t</w> 9,
  e+st</w> 9, o+w 7, l+ow 7; w+e is 8 in rounds 1 to 3, 2 in round 4 and absent from round 5;
  the final pieces are the same. With `lower` counted 3: round 1 ties e+s, s+t, t+</w> and
  w+e at 9, and e+s wins in lexicographic order.
- **Check numbers** (`lower` counted 4): round 1 w+e 6 + 4 = 10, alone at the maximum; five
  pairs at 9 (e+s, l+o, o+w, s+t, t+</w>), with l+o and o+w at 5 + 4; round 2 e+s = 3, from
  `widest` alone.
- **Receipt only.** The fixed-list outcome under "The misconception" above.

**Precision.** Integers only; no decimal is ever printed. Frequencies print as "×5" with
U+00D7. Pieces print in the chapter's spelling, `</w>` included, escaped as `&lt;/w&gt;` in
every HTML and SVG source (the panel source holds no raw `</w>`; the test parses the static
prints and finds every marker tile). The svg `aria-label` speaks the marker as "end marker",
so no raw marker reaches an attribute.

### Declared layout and the recount invariant

Row order (the corpus line's); the two drawn pairs (w+e tracked, l+o rival); the count axis
[0, 10]; tile geometry (wide: character tile 26, marker tile 44, gap 6; narrow 296: 20, 38, 4;
monospace glyphs at 0.6 em advance, so fusing glyphs slide to exactly their places in the
merged piece); the stub and the ghost; the timeline: merges at 5.0–5.8, 10.0–10.6,
11.0–11.6, 22.0–22.6 and 23.0–23.6; drawn counts at 0 (round 1), 6.4–7.2 (round 2) and
15.0–16.0 (round 4); rounds 3 and 5 folded into their merges. A lost occurrence is drawn by
which side a merge absorbed: its right symbol (`newest`'s e) leaves a dashed stub on the
left end, 0.4 s after the merge; its left symbol (`lower`'s w) dissolves the arc, 0.4 s
after the merge; the rival's own merge spends its arcs and bar during the fusion.

The scene test checks, at every 0.1 s step, that each drawn total equals a fresh count of
the drawn tiles × `data-frequencies`, except in the declared lag windows between a fusion
and the count that follows it (w+e over [5.0, 7.2) and [23.0, 24.8), l+o over
[22.0, 22.6)), and that the level, whenever it is drawn at full opacity, carries the
maximum and the tied pairs of that fresh count in lexicographic order.

## Beats

`data-duration="40"`, `data-beats="0 5 10 15 22 30"`. Every caption is 20 words or fewer and
held 5 s or more; all glides share one smoothstep easing. Three of the default eight beats
(20, 25, 35) would fall inside holds, and arrow keys should land where the mechanism
changes (design rule 4); `softmax-shift` is the precedent for six beats.

| Beat | Motion | Caption |
|---|---|---|
| 0–5 s | Still: characters, ×5 ×2 ×6 ×3, w+e 8 (lower 2, newest 6), l+o 7 (low 5, lower 2), level 9 "9: e+s, s+t, t+</w>". Nothing moves before 5.0 s. | "At the first count w+e has 8 and l+o 7. Merges 1 to 3 each use 9. Which merges fourth?" |
| 5–10 s | 5.0–5.8 e and s fuse in `newest` and `widest`; the level fades as the merge spends it. 5.8–6.2 `newest`'s arc snaps to the stub. 6.4–7.2 the round-2 count: `newest`'s 6 slides off, the dashed outline "w+e 8" stays, the bar reads 2, the level returns at 9 "9: es+t, t+</w>", the wash comes on. Still 7.2–10.0. | "Merge 1 fuses e+s; newest's e now sits inside es. Counted again, w+e keeps only lower's 2." |
| 10–15 s | 10.0 wash off; 10.0–10.6 es+t fuse and the level fades; 11.0–11.6 est+</w> fuse, in both words at once. No level. Still 11.6–15.0. | "Merges 2 and 3 build est</w> in newest and widest at once; lower is untouched." |
| 15–22 s | 15.0–16.0 the level fades in at 7, "7: l+o, o+w"; l+o's bar meets it; wash on. Still 16.0–22.0, where the prediction resolves. | "Round 4 counts again: l+o and o+w tie at 7, w+e has 2. Lexicographic order picks l+o." |
| 22–30 s | 22.0 wash off; 22.0–22.6 l and o fuse in `low` and `lower`, l+o's bar and arcs are spent with the level; 23.0–23.6 lo+w fuse; 23.6–24.0 `lower`'s w+e arc dissolves; 24.0–24.8 the bar's last 2 fades, leaving the ghost. No level returns. Still 24.8–30.0. | "Merges 4 and 5 fuse l+o, then lo+w, in low and lower; lower's w joins low, and w+e is gone." |
| 30–40 s | Closing hold: `low | </w>`; `low | e | r | </w>`; `n | e | w | est</w>`; `w | i | d | est</w>`; the ghost "w+e 8", the stub and the axis. This frame is the static print, wide (713) and narrow (296). | "Counts are redone each round: e+s took newest's e, so w+e fell to 2 and l+o won." |

**Reduced motion** shows exactly one state per beat, the settled picture just before the
next beat: 0 as above, wash off; 5 `es` fused, stub, bar 2 with ghost 8, level 9
"9: es+t, t+</w>", wash on; 10 `est</w>` in both words, w+e 2, l+o 7, no level, wash off;
15 level at 7 "7: l+o, o+w", wash on; 22 `low` in both words, no l+o bar, no live w+e bar,
no level, wash off; 30 the same drawing with the closing caption.

**Formula line.** The chapter has no BPE equation, but the grammar requires one TeX line,
so the panel carries a declared transcription of l.455–457 (the `halving-budget` precedent
for a scene-made line that states the chapter's rule):
`\( \text{count}(a{+}b)=\sum_{\text{words}}\text{frequency}\times\#\bigl(a\ b\ \text{adjacent}\bigr),\quad \class{pr-recount}{\text{taken on the current pieces every round}} \)`.
The `pr-recount` wash is on over [6.4, 10.0) and [15.0, 22.0) and switches only at those
instants, so the formula is unchanged inside the holds; under reduced motion it is on in
states 5 and 15. No `<a href="#eq-…">` and no `@eq-`: there is no chapter equation to link.

## Palette

- **Tiles and frequencies:** blue `#2b6cb0` glyphs on white tiles with a 1 px `#d5dde5`
  border and a .25rem radius: `bert-ledger`'s token-tile mark, redrawn in SVG. `bert-ledger`
  is an HTML rail from before the 10 September grammar (built 9 September), so only the mark
  and its blue carry over; its tiles set text in the body face, while the monospace glyph
  here is this panel's own choice, matching the code's spelling of the pieces.
- **Ink `#232d4b`:** w+e's arcs, bar, total and label, the maximum level and its label, the
  fusion seam marks, the ghost outline and the stub. P10 rests on the contract's own rule:
  excerpt prompt §5 gives blue to inputs and carried values and ink to gates, shifts and
  ghosts, and §4 and §5 keep design choices and mask gates in neutral ink. A pair count is
  neither a model input nor a value carried through the computation: it is an operator
  quantity the loop makes and throws away each round, the neutral role §4 and §5 give ink,
  and ink keeps the tracked count distinct from the blue tiles it is counted from. The
  ghost "w+e 8" is ink under §5 directly. Pending cross-reference, not a precedent on
  `main`: the unmerged four-replays brief draws `decoder-family`'s c in ink for the same
  reason; re-check this line once that batch lands. Orange is excluded because merges are
  counted, not trained, and nothing learnable is drawn.
- **Slate `#596778`:** l+o's arcs and bar, drawn thinner (the grey `bert-ledger` and
  `kernel-weighting` already use); the two tallies are also told apart by label and
  position.
- **Grey:** row names, segment labels, the axis and its word "count".
- **Not used:** no orange; no green, purple or wine (no prediction, target or loss); none of
  the film's green, orange or blue cards, and not its orange `est`.

## Anchor

`before-cell` on the bare label `bpe-mechanism` (never `cell-bpe-mechanism`: a `cell-`
target would pass the audit, which strips the prefix, and then fail the build's
one-insertion assert). `#| label: bpe-mechanism` occurs once (l.428), and the frozen
markdown gives the div as `::: {#bpe-mechanism .cell execution_count=5}`, so the filter
finds it. The filter's plan-code branch places the panel before the `.plan-code` wrapper
(l.417), right after the Practice-bridge callout (closes l.415). This is the first
`before-cell` anchor on a non-figure cell (the only earlier `before-cell`, `sobel-split`,
targets a figure cell); the source-level integration test pins the filter branches, the
label, the wrapper position and the callout that follows the wrapper (opens l.468, heading
l.469), and the rendered-page check below is still owed. The panel sits in printed §18.4 (the fourth
numbered H2, l.390), inside the unsigned `<!-- NOVEL: needs sign-off - original BPE
mechanism bridge requested in the course review. -->` block (l.401–480).

Chapter 18 then carries two replays in different sections: `bert-ledger` (after-cell
`cell-fig-mlm-policy`, the cell at l.295–372, in §18.3) and this one in §18.4, about 45 source
lines apart. The filter emits the page's shared stylesheet with the first panel and its one
loader `<script>` after the last, so the loader moves from after `bert-ledger` to after this
panel; `bert-ledger` keeps the shared stylesheet. Check in the render that `bert-ledger`
still mounts. Fallback if before-cell fails: after-paragraph "the result is reproducible."
(l.414), which makes the panel the callout's last block. Never: after-cell `bpe-mechanism`
(inside the wrapper, directly under the printed `lower: low | e | r | </w>`), before-heading
"Reading the learned pieces (optional)", after-paragraph at l.398–399, or anything after
l.467.

The intro links "The loop below" to `#bpe-mechanism`; the id is confirmed in the frozen
markdown and must be confirmed in the rendered page.

## Scoping notes

- The whole fixture sits in the unsigned NOVEL block, one of 76 such markers in
  `chapters/`. This is an optional panel beside an optional bridge. The precedent for
  binding an unsigned NOVEL block is the one the four-replays brief sets for
  `decoder-family`; that batch is unmerged, so no shipped scene on `main` at `1bc62ab` binds
  one yet, and this scene may be the first to land that does. Re-check this note once that
  batch lands. Signing the bridge off or cutting it changes the qmd digest, and the fixture
  audit then forces this receipt to be re-read.
- A deterministic five-round counting loop is not a deferred training replay
  (`docs/backlog.md` l.218). It has no loss, gradient, optimizer or weights, even though
  plan step 3 says "Learn five subword merges" (l.422).
- The panel's lesson is a consequence of the chapter's loop. The chapter's own emphasis is
  the trade-off between sequence length and coverage (l.476–477).

## Teaching boundary

The one visible sentence (26 words): "Byte pair encoding on the chapter's four-word toy
corpus, recounted after every merge; not BERT's WordPiece, which scores merges differently,
and no real tokenizer is trained." It is the only place the tokenizer's name appears.
Everything else sits in the closed "Scope and caveats": every count computed from the corpus
line (the chapter's text names only the nine and the seven); the lesson not resting on the
tie-break (reverse order: same final pieces, fourth merge o+w, w+e still never merges);
`</w>` sorting before letters and deciding no tie here (every tie in the five rounds is
settled by the first piece); `lower` counted 3; fourteen distinct pairs, two drawn, rounds 3
and 5 folded; what an arc, a bar and the dashed outline are, and why the live w+e bar
retires after merge 5; low+e counted 2 where w+e stood; the panel previewing the next cell's
output, which remains the authority; BERT's own tokenizer and byte-level tokenizers; a
finished merge list applied in its own order; the five-merge budget; the palette.

## The transfer check

"Check yourself. Suppose lower were counted 4 times instead of 2, all else unchanged.
Which pair merges first, and what does e+s count in the round after?" (27 words.) Answer
(60 words): "w+e: 6 + 4 = 10 beats every 9, and five pairs now tie at 9, since l+o and o+w
rise to 5 + 4. The merge fuses w and e in newest and lower, so the next round counts e+s at
only the 3 from widest. A merge removes another pair only where the two share a symbol
occurrence." It is transfer, not recall: the panel has no control and the final frame shows
only the chapter's frequencies. `expected['pair-recount']` in `scripts/test_excerpt_checks.cjs`
parses `data-words`, `data-frequencies` and `data-end-marker`, sets `lower` to 4 (the check's
hypothetical, hard-coded as `convolution`'s entry hard-codes its 6), runs the loop for two
rounds, asserts the round-1 maximum 10 held by w+e alone, the five pairs at 9, l+o and o+w at
5 + 4 and round-2 e+s = 3 from `widest` alone, and requires the answer to contain
"6 + 4 = 10", "five pairs", "5 + 4" and "only the 3 from widest". The `lower` = 3 case is
mentioned only in Scope.

## What was imported from the film, and what was not

Film `6050-Ch15`, scene `BertInput` (`lecture.jsx` l.46, registered at l.79 as
`['BertInput',BertInput,'embedding-sum']`; `STORYBOARD.md` row 7 at l.188, 4:30–5:22; captions
cues 30–35 of `transcripts/17-the-bert-moment-pretraining-as-the-new-regime.timeline.json`,
270.8–321.8 s), BPE half only. **Route B**: the film shows no merge sequence. Its first 12
scene seconds hold three cards (`low` whole at ×5, `lower` whose gaps widen over t 2.5–6,
`newest` and `widest` in their final pieces with `est` in orange and `</w>` drawn as `·`)
and then fade into the embedding sum. No tile ever fuses, no pair is counted, and no merge
order appears. `ch15-data.js` `bpeMerges.steps` does hold all five merges (six entries: the
character start state, then one per merge), but the scene renders only the final `words`
and the ×5 and ×2 chips. The moving object here, w+e's arcs and tally under the chapter's
own loop, is this panel's own.

Taken (four things): the question first, then a still hold before any piece moves (cue 30
at 270.8 s; the gaps start widening only at scene t 2.5); pieces drawn as physical tiles
whose seams carry the segmentation (the film widens `lower`'s gaps; here tiles fuse); the
final composition, a frequent word whole (`low`), a rarer word in pieces (`lower`) and one
piece shared by two words (`est` in `newest` and `widest`), set in motion as `est</w>`
forming in both words in the same instant; and the intent of cue 31's closing clause
("lower becomes low | e | r"), delivered as the drawn final state with `</w>` kept.

Not taken: the question "store whole words, or reusable pieces?" (answered at l.398–399);
the three-card grid, the green, orange and blue cards, the orange `est` highlight and the ×5
and ×2 chips; "WordPiece" as a label for these pieces (cue 32, the
`data-tokenizer-contract` attribute and the footer line); the `</w>`-less `low|e|r` and the
`·` stand-in; the whole embedding-sum half (token, position and segment cards, the width-8
bars and every `inputEmbedding` value, `TokenRail`, the z_i focus card); the kicker and its
file-prefix section number; every `ch15-data.js` value, `bpeMerges.steps` included. No film
value is imported: every number is recomputed from l.449. `ch15-data.js` is hashed below
only because this receipt describes what `bpeMerges` holds.

## Departures from the brief, and where the contract decided

- **Segment order.** The brief names the w+e segments "newest 6" and "lower 2"; the bar
  lays segments in the corpus line's order, so "lower 2" comes first (0–2) and "newest 6"
  second (2–8). That lets `newest`'s segment slide off the bar's end while "lower 2" stays
  exactly where it was; l+o reads "low 5" then "lower 2".
- **The ghost's label** sits above the dashed outline's right end, centred on the count 8,
  between the positions of the level at 7 and at 9, so neither level line ever runs through
  it (tested). The live totals sit at their bar's end.
- **Fusion seams** are two short ink marks across the tiles' top and bottom edges, rising and
  falling with the fusion, rather than a line through the gap: sliding glyphs crossed a
  mid-height line in the first render.
- **Level label** is right-aligned at its line, above the tallies.
- **Axis.** Unlabelled unit ticks and a small grey axis word "count"; no count number beyond
  the two totals and the level's value.
- **Accessible text.** The svg `aria-label` describes the drawn state and spells `</w>` as
  "end marker": `scripts/render_static_frames.cjs` writes the player's `aria-label` into the
  panel verbatim, and the brief's one escaping rule forbids a raw `</w>` in the source.
- **Formula line at narrow widths.** The brief pins the TeX, and its `\quad` plus `\text`
  clause is one unbreakable run of about 20.5 em, so `player.css` shrinks the line's type
  in steps (.82rem at 480 px and below, .7rem at 390 px, .64rem at 344 px) and keeps the
  horizontal guard with `overflow-y: hidden` and bottom padding, so a MathJax-wrapped line
  never turns the box into a small vertical scroller. Measured with MathJax 4.1.3 on the
  published Chapter 18 page (gh-pages build, the panel spliced in where the filter puts
  it): no horizontal or vertical overflow of `[data-formula]` at 320 to 1280 px.
- **Scope** adds, beyond the brief's list, one paragraph on what an arc, a bar and the dashed
  outline are (and why the live w+e bar retires with no count after merge 5), and one
  sentence on the palette.
- **Contract over brief:** none needed. The brief's rendered-chapter integration checks
  (the raw block's order, `#bpe-mechanism` resolving, `bert-ledger` still mounting, §18.4 on
  the rendered page) require `quarto render`, which this build did not run; they remain
  open.

## Verification

From the repo root, at `1bc62ab` plus this batch's uncommitted files:
`node --test scripts/test_pair_recount_excerpt.cjs scripts/test_excerpt_checks.cjs
scripts/test_mechanism_excerpts.cjs`; `node scripts/render_static_frames.cjs pair-recount
--check` ("interactives/pair-recount/panel.html is current");
`"$QUARTO_PYTHON" scripts/audit_excerpt_fixtures.py --lecture-tree "$BOX/Video_lectures"`.
Rendered-page inspection at 1280 and 375 px is owed after the batch's `quarto render`.
A stand-in was checked before it: the published gh-pages Chapter 18 page with this panel
spliced in where the filter puts it (before the `.plan-code` wrapper, after the
Practice-bridge callout, the loader moved after this panel). There the panel mounts in
§18.4, `bert-ledger` still mounts, the "The loop below" link resolves to `#bpe-mechanism`,
and the formula line neither overflows nor scrolls at 320 to 1280 px. The stand-in is not
the render and does not close the render check.

## Notes for a future edit

Written for a later session that edits this scene without the conversation that built it. Read
this receipt, `docs/animation-authoring.md` (design rules and visual grammar) and the scene brief
it was built from (`dl-book-prompts/dl-book-ch16-ch18-replays-prompt.md` §2 "`pair-recount`", kept
in the author's Box folder `Teaching/6050/`) before changing anything.

- **Where things live.**
  - `interactives/pair-recount/panel.html` holds the fixture on the `<details>` root (`data-words`,
    `data-frequencies`, `data-end-marker`, `data-merges`, `data-tie-break`, and the declared
    `data-tracked`, `data-rival`, `data-count-axis`), the prose around the pane, the check, the
    transcript, and the static final frame.
  - `interactives/pair-recount/player.js` reruns the chapter's loop from those attributes
    (`countPairs`, `mergePair`, `HISTORY`). The timeline is `MERGE_AT` (one fusion window per merge),
    `COUNTS` (when the tally is redone) and `LOSS`, `RETIRE`, `SLIDE` (sub-steps). `STAGES` and
    `CAPTIONS` hold the beat names and lines for the beats `0 5 10 15 22 30`. `arcsOf` and `tallyOf`
    draw the tracked w+e support and its bar.
  - `interactives/pair-recount/player.css` holds the palette and the formula's phone font steps
    (480, 390 and 344 px).
  - The tests are `scripts/test_pair_recount_excerpt.cjs` (48 tests, including one that compares the
    player's merges with the frozen stdout of the `bpe-mechanism` cell in
    `_freeze/chapters/part4/15-bert-pretraining/execute-results/html.json`) and the check's numbers in
    `expected['pair-recount']` in `scripts/test_excerpt_checks.cjs`.
  - Registration is the scene's manifest entry and its `player.js` line in `_quarto.yml`.
- **Judgements the author left open when approving:**
  1. **The closing frame's count area is nearly empty.** After merge 5 the live bars retire and
     only the dashed "w+e 8" ghost stays (decision P7), and scripts-off readers see the same frame.
     The alternative P7 names is to relabel the spot as low+e 2. Keeping l+o's last bar is another
     option. Either way, change the retirement in `player.js`, rerun the static prints, and update
     the Beats section here.
  2. **The formula wraps to two lines on phones.** The font steps in `player.css` keep it free of
     scrollbars down to 320 px. The TeX itself stays as it is: its clause is the recount rule.
  3. **Two things move at once twice** (6.4 to 7.2 s, and 22.0 to 22.6 s). Each is one recount or
     merge event; sequence them if they read as two.
  4. **The intro prose and the formula line state the recount rule during the ask.** They do not
     give the answer, but they narrow it.
- **The unsigned bridge.** The scene lives inside the chapter's unsigned BPE bridge (`NOVEL` block,
  about l.401 to 480). If the author signs it off, revises it or cuts it, the digest below goes stale
  and the fixture audit fails. Re-read the nineteen literals, then run
  `scripts/refresh_excerpt_receipts.py`. If the corpus line or the loop changes, the frozen-stdout
  test fails until the panel's attributes follow.
- **After any change**, from the repo root:
  - `node scripts/render_static_frames.cjs pair-recount`, then the same with `--check`;
  - `node --test scripts/test_pair_recount_excerpt.cjs scripts/test_excerpt_checks.cjs scripts/test_mechanism_excerpts.cjs`;
  - `npm test --prefix scripts/html-tests`;
  - the fixture audit with `--lecture-tree`;
  - `quarto render --to html`;
  - a browser check of the anchor, which lands before the `bpe-mechanism` cell's Plan → Code wrapper,
    at 1280 and 375 px.

## Source digests

Lecture paths are relative to the lecture repository root; all film files were hashed from
`$BOX/Video_lectures` itself on 2026-09-29.

| Source | SHA-256 |
|---|---|
| `chapters/part4/15-bert-pretraining.qmd` | `b9de00ebfd0dd39782906888e23bfaf3d8c2c9cf72d4a1f8d7fdb8e71e3be807` |
| `6050-Ch15/lecture.jsx` | `6b4adf6ec2e1f9f2986e97acd7dfb15197dbd0e187efc50d50a2614a80ba2cfd` |
| `6050-Ch15/STORYBOARD.md` | `f05053b3d8b57c9240c0506df71a71f165b611eb649635ba6a414d47cb47724d` |
| `6050-Ch15/ch15-data.js` | `33c5e03b6f48e013bef42aa791e08a9bec8a16af03c3ab5dafd0149ed98bcc06` |
