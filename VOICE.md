# VOICE.md: the narrator contract

One narrator speaks in every chapter of *Deep Learning: Making It Learnable*: a teacher
who orients the reader, derives what matters, and audits the evidence. The Preface and
Part I already speak in this voice; later chapters drifted toward an auditor's mix of
habits (dense caveats, chapter-number ledgers). This sheet is the contract that keeps
one voice. `scripts/audit_voice_ledger.py` measures it and CI enforces its mechanical
part. `docs/style-guide.md` remains the teaching guide; where the two disagree on
register, this sheet governs. Amended for Stage B and again for Stage B2 (2026-09-26):
where earlier text and this sheet differ, this sheet wins.

**Register.** Clear, precise, and formal enough for a Springer series. Warmth comes
from orientation (why this step, where it leads, what to expect, what to skip) and from
the chapter's own concrete objects. Never from exclamation, jokes, pop culture, or
evaluative adjectives. No em dashes anywhere, in the book or in this project's files;
to name the character, write U+2014.

**Standing rules.** Rules constrain the sentences this pass adds or recasts. Author
baseline text is never rewritten to satisfy a count: it is reported, and a conflict
between a rule and the page is a flag, not an edit. Restored passages are baseline. When
a rule cannot be met without a stiff sentence, leave the page alone and flag it.

## The kit is a set of jobs, not a set of phrasings

A device that recurs as the same words becomes a template, and a template is the
two-narrators problem again: the reader hears a formula instead of a person.

- **V1 Local vocabulary.** Every added sentence is built from the chapter's own objects
  and its own images, where the author's own lectures use them (the CNN chapter's detectives,
  the gradient superhighway, a model's input and output contract). A sentence that could
  be pasted into another chapter is not written yet. Under D11, bills, ledgers, report
  cards, IOUs and currencies are not the author's images.
- **V2 No shared phrasing among added sentences.** No four-word sequence in two added
  sentences from different chapters. No two added promise sentences (T1) share their
  first three words; that rule exists to stop "By the end" and "you will be able to".
  Vary by content, never distort a natural sentence to dodge the audit, and when two
  natural sentences collide, rewrite the one whose content is weaker. Only the book's
  question, "what if we made this learnable?", may recur verbatim in recap handoffs.
- **V3 Signature phrases are capped in added sentences** (table below). Baseline uses
  are reported, never rewritten to meet a cap.
- **V4 Do not announce; state.** A merged caveat, a promise, or a handoff is written as
  its content, with no lead-in ("One caution ...", "Here is the ...", "In one sentence,
  ...").
- **V5 Handoffs name the carried object.** A recap handoff says what travels to the
  next page (Chapter 9's opener is the model: two demerits and one IOU). No two
  handoffs share a structure; "The next chapter ..." opens at most two in the book.
- **Apparatus words.** An added or recast sentence never names the book's machinery: no
  recap, section, subsection, table, callout, receipt, ledger (as the audit's name;
  Chapter 17's own bill ledger is fine), "the pages ahead", inline section title, or
  cross-reference to a section. "Chapter N" and "Part N" stay allowed as pointers,
  under S2. A citation of the delivering section belongs in the receipt.

## How sentences get written (P1 to P5)

The rules filter sentences; they never generate them. A sentence that exists because a
count needed it does not go in. A sentence quoted in a brief is a candidate, never text
to place: the page decides, and if the quoted sentence does not fit the paragraph it
lands in, write the one that does, or write nothing.

- **P1 One writer per page.** One agent writes all the prose edits of a page, in one
  sitting, after reading the whole page. Subagents may read, measure, render, and
  review; they never write prose.
- **P2 Page first, rules second.** For every T-rule sentence (promise, verdict,
  metaphor, handoff, reader turn) and every recast under S1, S3, or S5: read the section
  in full, draft three candidates in the chapter's own vocabulary, choose by ear, place
  the sentence, re-read the paragraph, and only then run the checks. The edit list keeps
  the candidates.
- **P3 Rule-blind reader pass.** After a page's edits and before the invariant suite, a
  separate reviewer that sees no rules, receipts, or edit lists reads the rendered page
  with one instruction: "Read this as a student. Mark every sentence that contradicts a
  printed number, figure, or caption on the page, reads as written to satisfy a rule,
  announces instead of states, refers to the book's own apparatus (recap, section,
  table, callout, receipt), is a fragment, has a punctuation slip, grades the material
  by taste instead of showing why, or sounds like a different person from the
  surrounding paragraph. Do not mark the author's habits:
  this author writes short verdict sentences, fragments, and 'Here is ...' openers on
  purpose. Mark a sentence only if it breaks from the paragraph around it, or is broken:
  contradicts a printed number, is a fragment where the paragraph is not, has a slip, or
  names the book's own apparatus. Rank your marks and give at most ten per page, with
  counts for the rest. Quote each one; do not fix." The writer fixes each mark on an
  edited or added sentence under P2, or overrules it with a one-line reason in the
  receipt's `reader` column; deleting a T-rule sentence is a valid fix. Number
  mismatches go to the gate's decisions with the printed value, the prose value, and a
  one-token fix for the author. Other marks on baseline text are counted per page and
  reason, with the five highest-ranked kept as examples.
- **P4 Thinning re-reads.** After removing a habit word, re-read the sentence as a
  sentence. If it needs recasting, recast it (with a receipt) or put the word back.
- **P5 Gate report for a human.** `audits/voice/stage_<batch>_report.md` opens with
  Section A: every changed or added sentence inside its paragraph as rendered, grouped
  by page in reading order, with the rule id, one line of intent, and the reader-pass
  mark and its resolution. Section B holds the decisions pending, each with a default.
  Everything else (ledgers, invariants with commands, phrase counts, the I17 list) goes
  to `audits/voice/stage_<batch>_audit.md`. The print PDF built from the batch goes with
  the report.

## Pronouns and tense

- **we** is author and reader together, doing the work.
- **you** appears at decision points, instructions, and promises.
- **I** and **my** belong to the Preface, the Acknowledgments, the Epilogue, and a
  framed game or thought experiment (Chapter 8's feature-detector game). Contractions
  inside a game still follow R5.
- Present tense for mechanisms and results; future tense only for promises and forward
  pointers; past tense for what an earlier chapter did.
- A paragraph never switches from "we" to "one" or "the reader".

## The kit (the only warm devices)

| Device | Job | Budget |
|---|---|---|
| K1 verdict (T2) | Right after a display, output, or figure, one sentence of at most twelve words that names what the thing buys, what it costs, or which earlier object it is. No new symbol, no new claim, no "whole", local vocabulary. | One to three per chapter, at load-bearing displays |
| K2 metaphor (T3) | One concrete image from the book's lexicon, held for one paragraph | At least one per chapter |
| K3 promise (T1) | Optional. In the opener, what the reader will see or do, in the chapter's objects; never where in the book it happens (the delivering section is cited in the receipt only) | At most one per chapter, and none where the opener already orients the reader (Chapter 8, Chapter 9) |
| K4 aside | A short parenthetical naming the stakes ("the cruel part") | At most one per section |
| K5 show-then-name | The figure or experiment precedes the name of what it shows | Only where it costs one sentence |
| K6 reader turn (T5) | For an experiment, one sentence in the chapter's own terms that asks the reader to predict before the run or to change something and watch after it ("Rerun this cell with `n = 100` and watch OLS become more stable") | At most three per chapter; none where the chapter already asks, checked against the page rather than a brief |

No other device: no rhetorical-question clusters, no "Let's dive in", no "In this
section we will", no emoji.

**Banned in prose:** "Let us", "aka", exclamation marks, contractions, em dashes,
"one can", "the reader", "it can be shown", "note that", "it is important to note",
"clearly", "obviously", "trivially", "of course", "easy to see", emphatic "simply" and
"just", announcing lead-ins (V4), and any evaluative adjective added by an edit.

## Where warmth goes

| Position | Warmth | Allowed |
|---|---|---|
| Chapter opener (before the first `##`) | highest | K3 promise, one K2 metaphor, at most two "Chapter N" mentions outside a roadmap sentence |
| Section transitions | medium | one orienting sentence: what was fixed, what becomes learnable, or why this next step |
| Derivations and definitions | none until the result | then one K1 verdict |
| Experiments | medium | a K6 reader turn before or after the run; the experiment ends with its one limitation |
| Figure captions | neutral | at most one orienting clause and one limiting clause of twelve words or fewer |
| Callouts | home of caveats | guards moved here under S1 |
| Recap | warm | numbered content unchanged; heading per D1; one handoff (V5) |
| Exercises | stem may be warm, task neutral | task text frozen except R6 |
| Sources | neutral | frozen except R6 |
| Appendices, Part pages, Epilogue | neutral | mechanical and subtraction rules only |

## Decisions

- **D1 Recap headings.** `Okay, so: ` plus a phrase or a claim of at most ten words.
  The 23 existing headings comply; change none. Give them explicit ids
  (`{#sec-NN-recap}`) so wording never moves an anchor (Stage B3; the course site links
  by URL only).
- **D2** No "Let us" in prose: a plain "we" statement or an imperative.
- **D3** No "aka": "also called" or "known as".
- **D4** No exclamation marks in prose, captions, callouts, exercises, sources, alt
  text, tables, or headings. Code comments are untouched.
- **D5** No contractions in prose, captions, callouts, exercises, sources, or headings.
- **D6** No em dashes outside code: not in prose, headings, captions, callouts,
  exercises, plan steps, alt text, tables, or replay panels (Stage B3). En dashes only in
  numeric ranges and compound names (encoder–decoder, query–key, Nadaraya–Watson). Em
  dashes inside cited titles and quoted material stay as the source wrote them.
- **D7** A colour word never identifies a role on its own. The test is whether the
  colour word is the sole identifier of the role: "the navy curve" fails it, while "the
  dark red residual $e$" and "the blue data matrix $X$" pass, because the role noun
  identifies them and the colour is their legend (Chapter 1 teaches the colour code with
  the figure on the page). Parenthetical tags ("(navy)") are legends too; keep them. A
  fix may not add a parenthesis (N6); where no fix keeps N6, leave the sentence and flag
  it. Colour macros, figures, and alt text are untouched.
- **D8** "I" and "my" outside the pages and games named above are flagged.
- **D9** R1 to R6, the V3 caps on added sentences, and I17 block CI; density bands warn
  only.
- **D10** Transplant rules (T1 to T5) apply to Chapters 1 to 20 and the three
  interludes. The Preface, Part pages, Epilogue, and Appendices receive mechanical and
  subtraction rules only.
- **D11 The author's voice (author's ruling, October 1, 2026).** "My voice is strongest when
  I put a problem in front of the reader, identify what changes, and follow the
  consequences." Prose never describes the book itself: no payoff announcements, no
  remarks on the exposition or on editorial choices, no flourishes, no assurances that an
  experiment is honest, and no arc vocabulary (promise, seed, harvest, IOU, debt, bill,
  ledger, price list, report card, figurative "contracts"). An image stays only if the author's
  own lecture transcripts or notes use it. The author's 51 rewrites and the book-wide pass are in
  `audits/voice/stage_p25_report.md`. D11 overrides R9's old note on announcements and
  the V1 metaphor list.

## Rules

Subtraction first, then transplant, then register; precedence on conflict is N, then
the invariants, then S, R, T.

- **S1 Guards.** Unit: the smallest heading that holds prose (`###` in the
  interludes). At most one guard per unit of running prose. Placement by kind: a rule
  or derivation carries its one caveat beside the rule; the book's own experiments end
  with their one limitation, after the result; a literature summary may lead with its
  scope statement. Guards that limit the same claim merge into one sentence, written as
  content (V4). Extra guards on different claims move into a same-section callout whose
  existing title fits; one new callout per `##` section only on pages whose prose
  guards exceed twice the band. An "X, not Y" guard may be rephrased as a positive
  scope statement ("holds when ...", "applies to ...") when that reads more clearly,
  content unchanged; never weaken a limit to read warmer. A negation that works as a
  verdict ("Zero trainable parameters is not zero cost") stays. Captions keep one
  limiting clause of at most twelve words. No caveat is deleted; `guards_moved.md`
  records every merge and move.
- **S2 Chapter mentions.** At most two "Chapter N" mentions in an opener and in any
  paragraph, except in a sentence that enumerates where things were or will be
  introduced (a roadmap, a tool inventory, a recap list). Rewrite the excess in content
  terms and keep every link instance: the link moves onto the content phrase
  (`[the SGD chapter](04-training-loss-sgd.qmd#sec-04-training-loss-sgd)`). Chapter
  mentions inside restored author paragraphs do not count against the opener cap; the
  ledger reports them separately.
- **S3** "one can" becomes "we" or "you"; "the reader" becomes "you"; "it can be shown"
  becomes the calculation; "note that" becomes a reason or disappears.
- **S4** Delete "clearly", "obviously", "trivially", "of course", "easy to see", and
  emphatic "simply" or "just" (keep them when they mean "only").
- **S5 Habit words.** Report the V3 counts per page; where one page carries three or
  more of the same habit word, thin it by replacing it with a plain word or deleting
  it, never changing a claim, with a receipt. Every thinned sentence is re-read as a
  sentence (P4).
- **S6 Show, don't grade.** Applies to baseline as well as added text. A sentence or
  clause whose content is the narrator's taste-grade of the material (cleanest, elegant,
  beautiful, remarkable, striking, satisfying, powerful, and their kin) is deleted when
  the paragraph already shows the reason, or replaced by the reason or by the thing
  itself, with a receipt. Stakes verdicts ("the whole game", "the deepest point", "most
  important") are not grades; they stay when the paragraph earns them. "Magic" used to
  say what the book refuses to treat as magic is a stance and stays. The ledger reports
  the remaining hits per page (`audit_voice_ledger.py --grades`).
- **T1 to T5** as the kit table says, written under P2. Budget: at most four added
  sentences per chapter beyond them; none on a page that already meets its bands. T1 is
  optional.
- **R1 to R8** Recap heading form (D1); "Let us" (D2); "aka" (D3); exclamation marks
  (D4) and contractions (D5), including headings and callouts; em dashes (D6); colour
  words (D7); pronouns as above.
- **R9 Slips.** An unambiguous typo or punctuation slip in baseline text may be fixed,
  each with a receipt: a hyphen after an -ly adverb, a comma splice, a stray comma, a
  line break that Pandoc misreads as a list marker. Never a fragment: that is this
  author's voice. Announcements are not (D11).
- **N1** Never change code, outputs, math, figures, plan steps, front matter, licenses,
  citations, exercise tasks, numbers, claims, or replay fixture literals.
- **N2** Edit sentences, not paragraphs. **N3** No device outside the kit.
  **N4** No bulk regex edits except reviewed R2, R3, R6 hits. **N5** Work on the
  `voice-coherence` branch; never edit a release tag or `gh-pages` by hand.
- **N6 Concreteness.** No edit may replace a sentence that names a person, a hand, a
  tool, a date, a place, or a promise with one that names a concept. No edit may raise
  a paragraph's count of nominalizations (words ending in -tion, -sion, -ization, -ity,
  -ness, -ment, -ance, -ence), raise its mean sentence length by more than 15 percent,
  add a parenthesis, remove a link, or remove the book's question. When another rule
  seems to require any of that, the other rule loses; flag instead.

## Ledger

Measured on rendered HTML by `scripts/audit_voice_ledger.py`. Classes: A running
prose, B captions, C callouts (including Trap: and Check yourself), D exercises,
E sources, F plan steps, H alt text and tables, T headings, R replay panels. Code,
outputs, and math are removed first. Rates are per 1,000 words of class A.

| Metric | Definition (patterns frozen; `audits/voice/calibration.md`) |
|---|---|
| guards | `, not (a\|an\|the\|every\|one\|any\|merely\|calibrated)`; `not (a\|an) (claim\|promise\|proof\|law\|guarantee\|mask\|substitute)`; `(is\|are) not (a\|an) `; `it does not (make\|isolate\|normalize\|prove\|establish\|claim)`; `neither ... nor`; `without any guarantee` |
| chapter_refs | `Chapters? N`; also opener total and maximum per paragraph |
| reader_address_total | "you" forms plus sentence-initial imperatives (Run, Rerun, Try, Watch, Predict, Write, Change, Compare, Notice, Check, Count, Read, Pause, Skip, Return, Test, Keep) |
| verdicts | complete sentence of 2 to 12 words opening the text after a display, output, or figure; not a transition, first-person plan, or forward reference |
| metaphor_hits | knob, landscape, slope, downhill, hood, engine, relay, handoff, bottleneck, bridge, address, template, filter sliding, dial, referee, ruler, bill, ledger, price, price tag, purchase, currency, tax, report card, demerit, IOU, wall, seed, contract, recipe, appliance, detective, committee, cliff, budget |
| nominalizations | words ending in -tion, -sion, -ity, -ness, -ment, -ance, -ence (report only; the cold-prose metric) |
| register markers | Okay, Let us, aka, `!`, contractions, U+2014, note that, it can be shown, it is important to note, one can, the reader, intensifiers, simply/just |

**Part I reference profile** (medians of Chapters 1 to 6 at baseline `86ec60b`, per
1,000 words): reader_address_total 5.271 ("you" alone 4.264), verdicts 1.622,
metaphor_hits 5.822, guards_A 1.192, chapter_refs_A 5.911.

**Bands** (warn only) for Chapters 1 to 20 and the interludes: reader address at least
0.6 times the profile in Part I and 0.5 times elsewhere (3.16 and 2.64); verdicts and
metaphors at least 0.6 times (0.97, 3.49); prose guards at most 1.5 per 1,000 words in
Parts I and II and 2.5 in Parts III to V and the interludes (B3.1); chapter references at most
1.5 times the profile (8.87), at most two in the opener and in any paragraph (roadmap
sentences exempt, by reading). Distance from the profile is the root-sum-square of the
relative deviations.

**V3 phrase caps** apply to added sentences (restorations are baseline); book-wide
counts over every visible class are reported in `audits/voice/phrases.md`:

| Phrase | Cap on added sentences |
|---|---|
| "One caution" | 0 (blocking) |
| "that is the whole" | 0 (blocking) |
| "By the end" as a promise ("By the end," / "of the chapter" / "we" / "you") | 2 (blocking) |
| "you will be able to" | 1 (blocking) |
| "in one sentence" | 0 (blocking; the three baseline uses stay) |
| "X is the whole Y" | 0 (blocking; Chapter 1's "whole game" and Chapter 8's "whole revolution" and "the whole machine" stay) |
| "deliberately", "honest" (and forms), "is exactly", "Here is the" | report only; thin baseline only where one page carries three or more |

## Invariants

I1 to I16 as in `audits/voice/invariants.md` (code, outputs, math, numbers, anchors,
link instances, headings, figures and alt text, exercises, sources, plan steps, word
counts, CI, voice lint, cross-volume references, em dashes), plus:

- **I17 Added-sentence audit (blocking).** Every sentence this pass added or recast
  (from the edit lists, kept while it is still in the book; restorations and the
  mechanical fixes R5 and R9 excluded) is
  checked against every other chapter's: no shared four-word sequence, and no two
  promise sentences with the same first three words (V2). The V3 caps hold on added
  sentences, and no added sentence uses an apparatus word. Runs in `--check`.
- **I18 Concreteness audit (blocking).** Every paragraph the edit lists touch is compared
  with the baseline: no rise in nominalizations or parentheses, mean sentence length up
  at most 15 percent, no link or book-question removed. New material (T rules, or an
  edit marked "new material"), S1 relocations, and restorations of earlier author text
  are exempt.
- **I19 Printed-number audit (report only).** Every percentage, and every count of three
  or more digits, in running prose that no printed cell output or caption on the same
  page shows at the prose's own precision, listed per page for the author
  (`audit_voice_ledger.py --numbers`). The printout is the source of truth.

## Enforcement

```bash
python scripts/audit_voice_ledger.py --check _book            # CI, build-deploy job
python scripts/audit_voice_invariants.py --base 86ec60b --files <pages>
python scripts/audit_voice_ledger.py --phrases BEFORE AFTER --markdown audits/voice/phrases.md
python scripts/audit_voice_ledger.py --numbers _book --markdown audits/voice/numbers.md   # I19
python scripts/audit_voice_ledger.py --grades _book --markdown audits/voice/grades.md     # S6 hits
```

`--check` blocks on R1 to R6 for the pages in `VOICE_SCOPE`, and on the V3 caps and I17
for the whole book; band misses print as warnings. When a page is revised, add it to
`VOICE_SCOPE` in the same commit.

Each batch ends at a gate: invariants after every page, I17 and I18 book-wide, a full
render, the P5 report, and a push of `voice-coherence` so the author can read the branch.
The author merges; this pass never merges to `main`.
