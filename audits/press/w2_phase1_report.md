# W2 phase 1 gate report: independence

Branch `press`, pushed at this gate. The author has chosen to merge all of `press` (W1 and
W2 phase 1) into `main` once the rulings below are recorded; the merge is the author's.
Every edit, shown inside its rendered paragraph, is in `w2_phase1_edits.md`; the receipts
are `edits/*.json`; the audit is `scripts/audit_independence.py`. Chapter numbers in this
report are the press numbers (`docs/chapter-numbering.md`); receipt ids keep the file
prefixes (09-I1-2 is in Chapter 10). The W1 changes the merge also publishes are in
`w1_report.md`.

## What phase 1 changed

- **46 receipts on 17 pages.** 38 change text that both editions show: course vocabulary
  removed (I1, 14 edits), the second volume cited as an outside work (I2, 11), the
  "non-examinable" labels read "optional" (I3, 10), two attributions stated by the narrator
  (I5, 2), and one duplicated word (R9, 1). The other 8 hide Preface blocks in the press
  build only (I6); the HTML Preface is unchanged by them.
- **Two changes without a receipt.** The feature-space replay panel's credit, "The lecture
  film supplied composition and reveal order only; its own wording, chrome and off-page
  narration are not imported.", became an HTML comment (commit `10d226e`), so HTML readers
  no longer see it. The W1 commit `6124e4b` changed two numbers in the pixel-skewer replay
  panel's HTML by hand.
- **Tooling.** The press profile (`_quarto-press.yml`), the independence audit (run in both
  workflows and required by `audit_book_contract.py`), and `pyyaml` in `requirements.txt`.
- **Scope of the audit.** It reads the press view of the chapter sources in the reading
  order, and that view names no course and cites the second volume only as an outside
  work. It does not read the press PDF's title page, which `tex/macros.tex` still sets
  with "A first-principles course in Python and PyTorch" and a verso that calls the PDF
  the HTML edition's print conversion (ruling 18).

## Added at this gate: the W1 follow-ups

A read-only review of what a merge would publish (four lenses, each checked by a separate
verifier; 57 findings kept, none refuted) found four problems. Two are fixed here, and two
are rulings below. A red team on this report (34 findings, none refuted) corrected it.

- **D-W1.3, ruled September 28: fixed in the merge.** This amends D-P2, which kept numbers
  inside code. Twenty stale numbers in 17 edits: the Epilogue's adaptation map labels
  in-context learning "Ch. 20" and RLHF and DPO "Ch. 21"; Chapter 16's rematch chart labels
  its baseline "Ch. 12 LSTM"; code comments name Listings 12.1 and 12.2, Figure 9.3, and
  Chapter 9's model; the `code/dlbook` docstrings printed on Chapter 12 name Chapters 12
  and 16; and `supervised.py`, printed on Chapter 4, names the chapters that import it, 6
  and 9 (the old list also named file 09, which defines its own trainer). Receipts: the
  rows "D-W1.3" in `w1/conversions.csv`. The replay receipts carry the new chapter hashes.
- **Notebook labels fixed.** The W1 conversion had left eight raw `@sec-` labels in the
  Plan cells of five exported notebooks (never published). The exporter now writes them as
  the book prints them ("Chapter 12's trainer"), and the notebook audit fails on any raw
  cross-reference in a markdown cell.
- **Typed-number guard (approved).** `scripts/audit_typed_numbers.py` runs in both
  workflows. It fails on a typed "Chapter N", "Ch. N", or float number in prose, callouts,
  and captions, and on a listing number, in prose or a code comment, that no chapter
  defines. It allows the Preface's revision notes, a link whose text matches its target,
  and the second volume's own chapters. It would have caught the nine typed numbers in the
  Chapter 12 and 13 revisions and the four stale listing comments, but not the other
  D-W1.3 numbers: numbers inside code, cell labels, alt text, and docstrings name no
  checkable target, so they stay a hand check after any reordering, and `--list` prints
  them (23 today, each read and correct).
- **Runbook.** `CLAUDE.md` puts Quarto 1.10.18 first on `PATH` and in the conversion step
  (the launcher in `~/.local/bin` is 1.9.38; CI pins 1.10.18) and states the label rule;
  `docs/style-guide.md` no longer describes unnumbered interludes; `docs/CONTINUING.md` and
  `docs/part3-sequence-plan.md` say that their numbers are file prefixes, while CHANGELOG
  entries keep the numbers printed at their time.
- **Freezes.** The Epilogue and Chapter 16 were re-executed on the reference machine in
  both formats: three labels in two figures change (the Epilogue's Figure E.2 and
  Chapter 16's rematch chart), the six other regenerated figure files are pixel-identical
  and keep their committed bytes, and printed output is identical (137 stdout blocks, 27
  HTML/TeX pairs). Chapters 9, 10, and 12 changed only in code comments; their frozen
  Markdown was refreshed for those lines, and re-executing them reproduced the refreshed
  freezes byte for byte.

## Rulings needed before the merge

Each has a default; a ruling of "default" applies it.

1. **"(non-examinable)" or "(optional)" (I3, ten labels, table in the appendix).** Both
   editions now read "optional", including the two research bridges merged from `main`.
   The Part III plan (decision 3) marks research bridges "(non-examinable)". After the
   merge the HTML edition reads "optional" too, unless a label keeps "non-examinable" in
   HTML only, as
   `[(non-examinable)]{.content-hidden when-profile="press"}[(optional)]{.content-visible when-profile="press"}`.
   *Default:* "optional" in both editions and in new chapters, with a note at decision 3.
2. **Whether the independence audit blocks publishing on `main`.** After the merge it runs
   before every publish. The text on `main` today fails it with 53 hits, so the first push
   that types course vocabulary outside a press-hidden block stops the site from updating
   (the run fails and names file, line, and word; the site keeps its previous version).
   The choices: (a) keep it blocking, and write course material on `main` only inside
   `content-hidden when-profile="press"` blocks; (b) run it only in the weekly execution
   audit, as a report; (c) warn in the publish run and fail only in the execution audit.
   Pull requests today run none of the manuscript audits (they sit in `build-deploy`,
   which skips pull requests), so the `press` pull request would rest on the local suite.
   *Default:* (a), with the rule added to `CLAUDE.md`'s non-negotiables, plus a
   pull-request job that runs the source audits (plan-code, contract, Python sources,
   anchors, excerpt fixtures, independence, typed numbers) with read-only permissions.
3. **Chapter 10's transfer rule (09-I1-2 and 09-I1-3), which the author reserved.** The
   rule's high-resolution half rested on "the course assignment" (224 pixels, 18 landmark
   classes), which the page does not run. Phase 1 keeps the three conditions and states the
   18-class case as the rule's prediction ("transfer should win by a wide margin") and the
   28-pixel case as the page's measurement ("on this page scratch fights the superpower to
   a draw": scratch 86.6% and ImageNet probe 87.2%, both three-seed means, fine-tuned
   88.7% from one run). The opening "The decision rule supported by the experiments is
   this" became "The decision rule is this". The page does run a 224-pixel case just above
   the rule, on full Fashion-MNIST with 50,000 labels, where transfer does not win (scratch
   94.14%, fine-tuning 93.92%, probe 88.79%, seeds 6050 to 6052); the rule's "labels
   scarce" condition separates it from the predicted case. *Default:* phase 1's wording in
   both editions. *Alternative:* keep the baseline sentences in the HTML edition and show
   phase 1's in the press build only, which leaves the reserved claim untouched in HTML.
4. **The colophon sentence (P-I2-2).** "The graduate companion is *Deep Learning: Making It
   Trainable*." was deleted from the Preface's license footer in both editions. The two
   volumes' colophons link to each other by design (`docs/backlog.md`, cross-book
   reciprocity). *Default:* restore it in the HTML edition and hide it in the press build.
5. **The feature-space film credit (no receipt).** The replay panels are HTML-only: the
   press build shows neither a panel nor its static frame today (a print path is planned,
   P2), so the credit never reached the press view. *Default:* restore it in the panel.
6. **Second-volume chapters named by "Shakeri (2026), Chapter N".** Three sentences (the
   learning-by-experiment interlude, Chapter 10's normalization pointer, and Appendix C)
   can read as this book's Chapter 13, 15, 1, or 3, or its Appendix D. Chapter 10's form is
   the brief's model sentence, used as given (09-I2-1). *Default:* name the volume in each
   ("in *Deep Learning: Making It Trainable* (Shakeri, 2026), Chapter 13 and Appendix D"),
   which amends the model form. *Alternative:* keep the model form everywhere.
7. **Chapter 20's bridge (D3).** "Course-lab bridge (non-examinable): read PEFT through the
   algebra" became "Practice bridge (optional): read PEFT through a library's algebra",
   with no lab or module reference. *Default:* as applied. *Alternative:* the baseline
   heading in HTML and the new one in the press build.
8. **The press Preface (D4).** In the press build the Preface hides the tagline, About this
   edition, the course route, the enrolled-readers paragraph, the enrolled-students notes,
   the support invitation, and the acknowledgment. The HTML acknowledgment names the
   course, so the press acknowledgment is the author's to write. *Default:* as applied; the
   author writes the press acknowledgment before W4.
9. **The audit's allowed uses.** "in the course of", "Lecture 6.5" (Tieleman and Hinton's
   cited RMSProp lecture), and "of course" (the idiom). The one idiom hit, Chapter 22's
   "During generation, of course, x0 is the unknown destination", breaks `VOICE.md` S4,
   which deletes "of course". *Default:* delete it under S4, with a receipt, and drop the
   idiom from the allowed uses.
10. **Chapter 19's distillation analogy (16-I1-1)** keeps the distillation roles (student,
    teacher) and drops the classroom. *Default:* as applied.
11. **D-W1.1 and D-W1.2.** "Interlude:" stays in the numbered titles, and the Epilogue stays
    unnumbered with its own E. figure sequence. Both were applied as defaults. *Default:*
    confirm.
12. **D-W1.4, the duplicated references in the appendices.** Seven references in six
    sentences name a chapter and cite it again in parentheses, for example Appendix B's
    "Chapter 9 establishes NCHW for images (Chapter 9)". *Default:* drop the parentheticals,
    with receipts, before the merge.
13. **D-W1.5, two pointers older than the renumbering.** Chapter 15 says "Remember Chapter
    8's sliding filter: one learned rule, applied everywhere", but Chapter 8's filters are
    fixed and the learned rule is Chapter 9's. Appendix C says "In Chapter 16's regression
    language"; the regression reading of attention is Chapter 14's, and Chapter 16 states
    the same KV-cache sentence in Chapter 14's language. *Default:* Appendix C reads
    "Chapter 16's KV-cache reading of Chapter 14's regression language"; Chapter 15's
    pointer is the author's, in the coming Chapter 15 pass.
14. **D-W1.6, the course site.** Draft pull request
    [Shakeri-Lab/dl-course-site#2](https://github.com/Shakeri-Lab/dl-course-site/pull/2)
    relabels the 17 book links (Ch. 7 to Ch. 20 become 8 to 23; the three interludes gain
    7, 11, and 17). *Default:* merge it right after the book's merge is live, and not before.
15. **D-P1, the voice batches, and two branches at once.** After the merge `press` continues
    with W2 phase 2 while the author revises Part III on `main`; the voice batches B2b to
    B3 would add a third writer. *Default:* the voice batches resume on `main` after this
    merge; `main` is merged into `press` after each batch and each author chapter, with
    conflicted freezes re-rendered, never text-merged; W2 and W3 invariants run against a
    base rebuilt from the latest merge.
16. **The edition.** The merge changes every chapter number from 7 on, and the suggested
    citation still says Version 1.3, whose tag keeps the old numbers; a syllabus that cites
    "Version 1.3, Chapter 12" would then point at a different chapter on the live site.
    *Default:* set the content date at the merge and leave the version for W4, with a
    sentence in the revision note that chapter numbers from 7 on differ from v1.3's.
    *Alternative:* tag v1.4 at the merge.
17. **A deploy guard.** `build-deploy` runs on any non-pull-request event, so a manual run
    on another branch would publish that branch. *Default:* guard the publish step alone
    (`github.ref == 'refs/heads/main' && github.event_name == 'push'`), so the audits and
    the render still run on manual branch runs. *Alternative:* guard the whole job.
18. **The press title page (W4).** `tex/macros.tex` sets the PDF title page's tagline ("A
    first-principles course in Python and PyTorch") and a verso about the HTML edition;
    the press build inherits both. The HTML edition does not show them. *Default:* a
    press-profile header in W2 phase 4, and the independence audit extended to the press
    profile's title matter.

## After the rulings

The rulings are applied with receipts, the W2 phase 1 changes get a CHANGELOG entry and a
revision note, every page the rulings touch is refreshed, and the suite is rerun; then a
pull request from `press` to `main` carries this report's summary, the author merges, and
the live site is checked (the interlude titles 7, 11, and 17, the Chapter 12 listing
comments, the Epilogue's Figure E.2, the Chapter 16 chart, and one notebook Plan cell).
The course-site pull request merges after that, and `press` continues with W2 phase 2.

Chapter 15 (`13-attention.qmd`) is revised on `main` after the merge, so its pass starts
from the final numbers. Re-executed on the reference machine, it reproduces its committed
freeze byte for byte, so the pass needs no splice.
