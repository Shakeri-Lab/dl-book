# VOICE.md: the narrator contract

One narrator speaks in every chapter of *Deep Learning: Making It Learnable*: a teacher
who orients the reader, derives what matters, and audits the evidence. The Preface and
Part I already speak in this voice. Later chapters drift toward an auditor's mix of
habits (dense caveats, chapter-number ledgers). This sheet is the contract that keeps
one voice; `scripts/audit_voice_ledger.py` measures it and CI enforces its mechanical
part. `docs/style-guide.md` remains the teaching guide; where the two disagree on
register, this sheet governs.

**Register.** Clear, precise, and formal enough for a Springer series. Warmth comes
from orientation: why this step, where it leads, what to expect, what to skip. Never
from exclamation, jokes, pop culture, or evaluative adjectives.

## Pronouns and tense

- **we** is author and reader together, doing the work.
- **you** appears at decision points, instructions, and promises ("you will be able
  to see...").
- **I** and **my** belong only to the Preface, the Acknowledgments, and the Epilogue.
  Elsewhere they are flagged for the author, never edited silently.
- Present tense for mechanisms and results; future tense only for promises and forward
  pointers; past tense for what an earlier chapter did.
- A paragraph never switches from "we" to "one" or "the reader".

## The kit (the only warm devices)

| Device | Form | Budget |
|---|---|---|
| K1 verdict | One sentence of at most twelve words right after a display equation, code output, or figure, saying what it amounts to. No new symbol, no new claim. ("That second clause is the whole game.") | One to three per chapter, at its load-bearing displays |
| K2 metaphor | One concrete image from the book's lexicon (knob, landscape, slope, downhill, hood, engine, relay, handoff, bottleneck, bridge, address, template, filter sliding, dial, referee, ruler), held for one paragraph, then dropped | At least one per chapter; one per paragraph |
| K3 promise | In the opener, one sentence naming what the reader will see or do by the end, tied to the section that delivers it | One per chapter |
| K4 aside | A short parenthetical naming the stakes or the feeling ("the cruel part") | At most one per section |
| K5 show-then-name | The figure or experiment precedes the name of what it shows | Only where it costs one sentence |

No other device: no rhetorical-question clusters, no "Let's dive in", no "In this
section we will", no emoji.

**Banned in prose:** "Let us", "aka", exclamation marks, contractions, em dashes,
"one can", "the reader", "it can be shown", "note that", "it is important to note",
"clearly", "obviously", "trivially", "of course", "easy to see", emphatic "simply" and
"just", and any evaluative adjective added by an edit.

## Where warmth goes

| Position | Warmth | Allowed |
|---|---|---|
| Chapter opener (before the first `##`) | highest | K3 promise, one K2 metaphor, at most two "Chapter N" mentions |
| Section transitions | medium | one orienting sentence: what was fixed, what becomes learnable, or why this next step |
| Derivations and definitions | none until the result | then exactly one K1 verdict |
| Figure captions | neutral | at most one orienting clause and at most one limiting clause of twelve words or fewer |
| Callouts | home of caveats | guards moved here under S1 |
| Recap | warm | numbered content unchanged; heading per D1; one closing sentence that hands the question forward |
| Exercises | stem may be warm, task neutral | task text frozen except R6 |
| Sources | neutral | frozen except R6 |
| Appendices, Part pages | neutral | mechanical and subtraction rules only |

## Decisions

- **D1 Recap headings.** `Okay, so: <one-line claim, at most eight words>`. A claim,
  never a question or a bare noun phrase. Anchors that target a recap heading move
  with it.
- **D2** No "Let us" in prose: a plain "we" statement or an imperative.
- **D3** No "aka": "also called" or "known as".
- **D4** No exclamation marks in prose, captions, callouts, exercises, sources, alt
  text, tables, or headings. Code comments are untouched.
- **D5** No contractions in prose, captions, callouts, exercises, or sources.
- **D6** No em dashes outside code: not in prose, headings, captions, callouts,
  exercises, plan steps, alt text, or tables. En dashes only in numeric ranges and
  compound names (encoder–decoder, query–key, Nadaraya–Watson). Em dashes inside
  cited titles and quoted material stay as the source wrote them.
- **D7** A colour word never identifies a role on its own: "the residual, drawn in
  dark red", not "the wine residual". Colour macros and figures are untouched.
- **D8** "I" and "my" outside the Preface, Acknowledgments, and Epilogue are flagged.
- **D9** R1 to R6 block CI on every page in scope; density bands warn only.
- **D10** Transplant rules (T1 to T4) apply to Chapters 1 to 20 and the three
  interludes. The Preface, Part pages, Epilogue, and Appendices receive mechanical
  and subtraction rules only.

## Rules in brief

Subtraction first, then transplant, then register; precedence on conflict is N, then
the invariants, then S, R, T.

- **S1** At most one guard ("X, not Y" limiting a claim) per section of running prose;
  merge duplicates into one sentence of advice placed before the evidence, or move the
  rest into the section's nearest callout. Captions keep one limiting clause of at
  most twelve words. No caveat is deleted.
- **S2** At most two "Chapter N" mentions in an opener and in any paragraph; rewrite
  the excess in content terms and keep one link.
- **S3** "one can" becomes "we" or "you"; "the reader" becomes "you"; "it can be
  shown" becomes the calculation or "a short calculation shows"; "note that" becomes a
  reason or disappears.
- **S4** Delete "clearly", "obviously", "trivially", "of course", "easy to see", and
  emphatic "simply" or "just" (keep them when they mean "only").
- **T1 to T4** One opener promise, one to three verdicts at load-bearing displays, one
  metaphor if the chapter has none, one recap sentence that hands the question forward
  ("what if we made this learnable?"). At most four further added sentences per chapter.
- **N1 to N5** Never change code, outputs, math, figures, plan steps, front matter,
  licenses, citations, exercise tasks, numbers, claims, or replay fixture literals.
  Edit sentences, not paragraphs. No bulk regex edits except reviewed R2, R3, R6 hits.

## Ledger

Measured on rendered HTML by `scripts/audit_voice_ledger.py`. Classes: A running
prose, B captions, C callouts (including Trap: and Check yourself), D exercises,
E sources, F plan steps, H alt text and tables, T headings, R replay panels (report
only). Code, outputs, and math are removed first. Rates are per 1,000 words of class A.

| Metric | Pattern (frozen after calibration, `audits/voice/calibration.md`) |
|---|---|
| guards | `, not (a\|an\|the\|every\|one\|any\|merely\|calibrated)`; `not (a\|an) (claim\|promise\|proof\|law\|guarantee\|mask\|substitute)`; `(is\|are) not (a\|an) `; `it does not (make\|isolate\|normalize\|prove\|establish\|claim)`; `neither ... nor`; `without any guarantee` |
| chapter_refs | `Chapters? N`; also opener total and maximum per paragraph |
| reader_address | you, your, yours, yourself |
| verdicts | complete sentence of 2 to 12 words opening the text after a display, output, or figure; not a transition, first-person plan, or forward reference |
| metaphor_hits | the K2 lexicon |
| register markers | Okay, Let us, aka, `!`, contractions, U+2014, note that, it can be shown, it is important to note, one can, the reader, intensifiers, simply/just |

**Part I reference profile** (medians of Chapters 1 to 6 at baseline `86ec60b`, per
1,000 words): reader_address 4.264, verdicts 1.622, metaphor_hits 5.822, guards_A
1.192, chapter_refs_A 5.911.

**Bands** for Chapters 1 to 20 and the interludes: warmth metrics at least 0.6 times
the profile (2.558, 0.973, 3.493); guards in prose at most 1.25 times (1.490);
chapter references at most 1.5 times (8.867), at most two in the opener, at most two
in any paragraph. Distance from the profile is the root-sum-square of the five
relative deviations.

## Enforcement

```bash
python scripts/audit_voice_ledger.py --check _book            # CI, build-deploy job
python scripts/audit_voice_ledger.py --ledger _book --csv audits/voice/ledger_after.csv
```

`--check` blocks on R1 to R6 for the pages listed in `VOICE_SCOPE` (the pages the
voice sweep has revised; the pilot: Chapters 1, 6, 13, 17 and "Attention as Test-Time
Regression") and prints every quoted-or-cited exemption. Band misses print as
warnings. When a page is revised, add it to `VOICE_SCOPE` in the same commit.
