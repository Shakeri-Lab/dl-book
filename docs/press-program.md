# Press program: plan of record

Branch `press`, cut from `main` after the voice merge (B2a). Four workstreams in order;
each ends at a gate (human report first, audit tables in an appendix file), pushed, never
merged by this work. The voice working rules apply throughout: one edit list per page
with receipts, the invariant suite after every page, one writer per page, a rule-blind
reader pass on every page whose prose changes, and no em dashes (U+2014) anywhere.

## Sequence

0. Close the B2a gate: merge `voice-coherence` into `main` (done before `press` exists).
1. W1 renumbering. Mechanical and first, so every later receipt uses the final numbers.
2. W2 presentation and independence, phases 0 to 4 (inventory, independence, figures as
   data, diagrams, press build).
3. W3 longevity of Chapters 18 to 23.
4. W4 press build and final gate.

## Who does what

- Antigravity (Gemini) teams, read-only, each in its own clone, writing only under
  `out/`: the judgment columns of the W2 inventories (figure class, role-colour misuse,
  caption issues, independence classes and missed hits), the W3 per-chapter audit, the
  Sources metadata check against canonical records, the rule-blind reader passes, and a
  red team on each gate report.
- Claude Code: every edit (one writer per page), the mechanical inventories as scripts,
  renders, the invariant suite, verification of every agent finding against the files
  before it enters a receipt, commits, pushes, and pull requests.

## Scope found while planning (verify in W1 phase 0)

- 263 literal "Chapter N" strings in prose and captions against 186 `@sec-` references.
- Renumbering also changes hand-numbered listings (Listing 10.1, 10.2, 14.x become 12.x
  and 16.x) and two literal "Figure N.M" references; W1 converts both.
- 18 chapter or listing numbers sit inside code cells (comments, strings, plot text,
  `code-summary` labels), and `code/dlbook/*.py` docstrings name Chapters 4, 10, and 14.
  Some are reader-visible (fold labels, transcluded listings).
- The interludes number their floats in custom kinds (`exfig`, `aefig`, `ttrfig`,
  `extbl`); once the interludes are numbered chapters those must number with the chapter
  and cannot share a counter with plain `fig-` floats.
- The brief's 18 unlabelled interlude and Epilogue figures do not match a source scan
  (every plotting cell is labelled or wrapped in a labelled float); W2 phase 0 counts the
  rendered pages instead and reports the difference.
- A dry run (`w1_inventory.py`) finds 296 numbered references in reader-visible text:
  251 convert mechanically (singular and possessive "Chapter N" to `@sec-`, pairs to
  "Chapters [-@a] and [-@b]", which Quarto renders "Chapters 9 and 10"); 45 need a
  person: 18 in code, 11 ranges and 3 lists (a range across an interlude cannot stay a
  range), 6 hand-numbered listings, 3 inside link text, 2 literal figure numbers, one
  second-volume citation, one alt text.
- `filters/pdf-chapter-xrefs.lua` prints the PDF chapter number from the label's
  digits (`sec-08-cnn` becomes "Chapter 8"). After renumbering that is wrong from
  Chapter 7 on, it ignores the prefix-suppressed form, and the interlude labels carry no
  digits. W1 replaces the digit parse with a label-to-number map built from
  `_quarto.yml`'s chapter order, and handles `[-@...]`.
- `data/book-corpus-ch1-9.txt` is a frozen benchmark whose name and content keep the
  old numbering; prose that says "Chapters 1 to 9" about it must be restated in new
  numbers, which changes a sentence beyond the number.

## Decisions added by this plan (defaults in parentheses)

- D-P1 The remaining voice batches (B2b to B3) pause until the press program merges,
  then resume on `main` with the final numbers (yes).
- D-P2 Reader-visible numbers in cell options (`code-summary`, captions) convert with
  the prose; numbers in code comments, strings, printed output, and the tested modules
  stay, as the brief says, and are listed for the author (yes). Amended September 28,
  2026 by the author's ruling on D-W1.3: the twenty stale numbers in code comments, plot
  labels, and `code/dlbook` docstrings are fixed before the merge into `main`; printed
  output still stays.
- D-P3 The interludes' custom float kinds become plain `fig-`/`tbl-` floats that number
  with their chapters; each old id stays as an anchor alias so no inbound link breaks
  (yes).
- D-P4 CI runs the independence audit on the press profile rendered to text, with no
  PDF build in CI; the press PDF is built locally at the gates and delivered to the
  author, never published (yes).
- D-P5 The publisher is not named in committed files; the profile is `press` (yes).

## The author's rulings at the W2 phase 1 gate (September 28, 2026)

All eighteen defaults of `audits/press/w2_phase1_report.md`, except:

- Ruling 2, amending D-P4: the independence audit warns in the publish run and fails in the
  execution audit and in the press build (a pre-render step of `_quarto-press.yml`); a
  read-only pull-request job runs the source audits; the rule is in `CLAUDE.md`.
- Ruling 3: the 224-pixel case is introduced as a hypothetical ("Picture a landmark task:
  224-pixel photographs, 18 classes, a few hundred labels each").
- Ruling 5: the feature-space credit reads "Composition and reveal order follow the
  author's original animation."
- Ruling 13: Chapter 15's pointer becomes Chapter 9's sliding filter now.
- Ruling 15: the voice batches wait until the press program merges (D-P1 stands). Two
  writers only: the author on `main`, `press` on W2 and W3, under `docs/locks.md`;
  `main` is merged into `press` after each author chapter, conflicted freezes re-rendered.
- Ruling 16: v1.4 is tagged on the merge commit after the live site verifies; the
  suggested citation names v1.4 and the revision note maps old numbers to new.
- Ruling 18: the PDF title-page tagline no longer names a course, and the independence
  audit reads the press title matter.
- F3 (phase 3, diagrams): Chapter 12's new GRU cell and unrolled-loop diagrams stay as the
  author drew them; phase 3 applies to the Transformer block and the older matplotlib
  diagrams only.

## Validation per workstream

- W1: a rendered-text comparison with the chapter-number map applied (old to new); zero
  literal "Chapter \d+" in prose outside the second-volume allowlist; every cross-reference
  resolves; anchors and links identical except the added reference links; printed outputs
  identical; both HTML and the press profile render.
- W2 and W3 prose edits: I1 to I19 against a base that carries only the non-voice,
  non-press changes, as at the B2a gate.
- Figure-code changes (F2 to F5): printed outputs identical; changed figure files listed
  in the receipt; contact sheets before and after, in color and grayscale.

## Renders

One full re-execution per gate (HTML, then the TeX freeze, then the final HTML), plus
freeze-patched previews for reader passes. The press PDF is rendered at the W2 phase 4
and W4 gates.
