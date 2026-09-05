# Learning-loop revision — 2026-09-04

Baseline: `c058d1f401fd0ead3ae59a2a8730f95489a2d9aa` on `origin/main`.
The HTML edition remains canonical; v1.3 and its archived assets are unchanged.

## Scope

- Scope the likelihood interpretation of loss; compare probability MSE honestly.
- Show Chapter 12's three-point lookup before its formalism; consolidate the
  local-constant and research-frontier discussion in the existing TTR interlude.
- Replace generic Plan → Code helper inventories with mechanism-level steps.
- Export notebook orientation, predictions, and collapsed canonical support/figure
  cells in their original execution order, retaining regenerable visual evidence.
- Ask for predictions before the CNN rematch and generative/multimodal controls.
- Improve long equation layout and semantic color; pilot collapsed reasoning hints.
- Make the rolling-edition statement explicit.
- Include the deferred reproducible-PDF and KOMA part-opener pipeline in this cut.
- Follow-up review: qualify batch-independent SGD claims and the BatchNorm exception;
  repair the shoe-task exercise's comparison; separate transfer, recurrent-memory,
  and teacher-forcing observations from unisolated causal explanations.
- Give multi-head routing a small arithmetic witness; distinguish pretraining
  exposure from supervised holdout in the BERT lab; identify mechanism and full-study
  reading routes without implying that dependent cells run independently.
- Allow HTML readers to reveal printed evidence without expanding the implementation.

## Verification ledger

### Canonical migration integration check (not replacement evidence)

Source-only checkpoint `85e53849341daf8f1d20f3ae2cf7092cd9cba6d2` was pushed
to the working branch, not `main`. Actions run `33935907806` verified and built
the hash-locked container. It was then canceled: a nominal single-chapter LaTeX
render in a Quarto book expands to the whole book, so the driver's per-unit
kernel labels were invalid. The two corresponding Mac probes were interrupted
for the same reason. Their partial logs under
`build/portability-85e5384/{mac-one,mac-six}/` are diagnostic artifacts only.
No numerical freeze was committed or promoted. A unit-isolation regression
check must pass before fresh candidate runs restart.

The corrected source checkpoint is
`1da26e860d6fa76ae6b76dede273748b1439128c`. Its clean input manifest is
`build/canonical-source-1da26e8.json` (input SHA-256
`da091e7676b0a712ee864237a99833176eefc6f00d842191d6b070f1d97e432e`).
The real single-unit Quarto check passed before Actions run `33937390845`
started fresh execution. Independent run `33938819036` reuses that run's saved
image and executes the same source checkpoint. Its workflow is dispatched from
coordination-only commit `61c156ecd0290e600186fb97dc7364293a301be5`, which allows
the expensive executions to overlap and waits for the first run only before
comparison. Workflow revision and executed source revision are distinct records.
Neither run is yet declared passed here.

The two Mac runs use the same source checkpoint and retain evidence under
`build/portability-1da26e8/{mac-one,mac-six}/`. Their startup budgets are respectively
1/1 and 6/1 intra-op/inter-op threads. These are explicit new profiles, not the
earlier inter-op-14 diagnostic environment. Partial logs or sidecars must not be
used as completed calibration bundles. The reporter requires completed provenance
and distinguishes same-seed end-to-end differences from comparisons whose realized
initialization and batch-order hashes also match. Within-runtime paired controls
and the Chapter 11/13 baseline remain exact; no numerical gate is widened.

**September 5, 03:15 UTC: coverage-checker defect.** Both Mac runs completed
their 54 unit/format executions, then failed the same final native-cell audit.
The checker incorrectly required every executed cell to appear in frozen display
Markdown. The retained Mac-six logs show the complete ordered execution sequence;
the omitted cells in six units are explicitly `echo: false` and silent. A tiny
real-Quarto witness confirms that a silent setup can execute, supply a variable to
the next cell, and disappear from the frozen display while remaining in the
retained executed notebook. The corrected coverage contract must therefore bind
those notebooks to source, unit, format, and kernel, without exempting silent cells
from execution checks. Validation will run after each unit, not only at the end.

The two failed statuses remain untouched. They are diagnostic evidence, not
accepted calibration or promotion bundles. A separate read-only check of
`build/portability-1da26e8/mac-six/_freeze/` found byte-identical HTML/TeX stdout
in all 133 blocks; its eight raw paired sidecars also passed source/protocol and
format-parity checks (`build/coverage-diagnosis/mac-six-paired-audit.json`). Those
checks do not replace the missing successful provenance. Final-source Linux and
Mac profiles must be rerun under the corrected coverage contract.

The repair retains a pre-execution runtime observation even on failure and uses
schema-2 completed fingerprints to bind the original source, executed notebooks,
completion logs, and frozen output. Every observed kernel must match the recorded
software/thread/environment policy; internally consistent kernels using the wrong
thread count are not sufficient. The weekly native reporter uses the same physical
coverage checks with an explicitly report-only HTML plan. It does not borrow the
canonical two-format identity claim. Host provenance tooling explicitly pins its
YAML parser, and real-Quarto smoke tests use writable system temporary directories
when the source mount is read-only.

Repair verification is recorded under `build/coverage-diagnosis/verification/`:
`scripts-unit.log` reports 264 tests with six opt-in integration skips;
`container-unit.log` reports 16 passing tests; `quarto-unit-smoke.log` runs both
real unit-isolation/silent-cell tests; `native-portability-real.log` runs all 15
native-report tests including actual execution followed by guarded assembly;
and `guarded-assembly-real.log` runs all 14 assembly tests, including deliberate
cache-miss refusal. The source/Plan/book/anchor audits also pass in that directory.
These are pipeline regression tests, not completion of the full-book migration.

**September 5, 04:27 UTC: first Linux diagnostic completed.** Actions run
`33937390845` also failed the old rendered-cell checker after executing all
54 planned unit/format combinations. Original source, logs, startup probes,
wheel records, and eight paired sidecars remain under
`build/canonical-1da26e8-33937390845/`, with the failed status intact and no
completed fingerprint. The read-only diagnostic inventory is
`build/diagnostic-linux-a-33937390845/diagnostic.json`; it verifies the source
archive SHA-256
`4b9bd1ab0e2cab94f4d9f0b3319a4d21ee109d88b090782e3ec6bebcbf53316a`,
251 source hashes, 68 exact wheel records, and 287 ordered native completions
per format. All 133 stdout blocks agree between HTML and TeX. Nineteen units
differ from the historical reference, including unquoted last-bit residuals.
This is diagnostic consistency, not acceptance under the repaired proof contract.
The actual image archive was not independently rehashed in this local inspection.

The diagnostic outputs guide a prose-only reconciliation before final-source
reruns. Exact per-unit JSON paths, native cells, hashes, and editing decisions
are recorded in `docs/reviews/2026-09-05-provisional-numerics.md` and the detailed
working reports `build/diagnostic-prose-33937390845-{root,early,late}.md`.
The key corrections preserve claim boundaries: Chapter 8 still establishes no
expected clean-accuracy ranking; Chapter 11's paired advantage is modest and
reverses in two seeds; Chapter 13's matching recomputed baseline removes the
historical inherited-number dependency; Chapter 16's CNN wins four, not five,
clean pairs. The experiment interlude rounds its prose contrasts to reflect
seed variation. Pinned Rivanna evidence and strict numerical identities remain
unchanged. No native numerical AST, random stream, control, or gate is changed
by this reconciliation. Final-source execution must confirm every revised quote.

Final-source preparation also exposed a source-audit scope bug: the thread-budget
inventory recursively counted retained diagnostic QMD copies under `build/`.
It now scans only the authored chapter tree and `index.qmd`, retaining the exact
nine-consumer contract. Six thread-policy tests check ignored artifact copies
and rejected new/missing manuscript consumers. Diagnostic files were not deleted
to silence the check. All 287 native Python ASTs still match source A, and the
source/Plan/book/anchor audits pass. An independent boundary review reran 45
provenance, 16 coverage, eight portable-driver, and 16 container tests, plus both
real-Quarto fixtures; no final-source launch blocker was found. A future
diagnostic improvement is to retain partial notebooks when Quarto itself exits
unsuccessfully, not only when semantic coverage fails after a completed render;
logs, preflight, and frozen partial artifacts already survive that failure.

**September 5, 04:44 UTC: option-normalization diagnostic.** The source-only
prose checkpoint is `97d070ff652e3e93645469903f2cb3505846060b`. Both new Mac
profiles stopped immediately after Appendix A's first LaTeX render: retained
notebook source/options did not byte-match the authored directive spelling.
Their original rejected bundles are `build/portability-97d070f/{mac-one,mac-six}/`;
the preserved preflight, notebook, source, and log reveal the cause directly.
Linux Actions run `33945331472` was canceled before numerical execution.

Pinned Quarto 1.10.18 reserializes the leading `#|` YAML and moves `fig-width`
and `fig-height` into cell metadata. The checker now compares complete parsed
option values, permits only those explicit metadata relocations, rejects
missing/extra/shadowed values, and preserves the exact remaining Python and
comments after Quarto's documented outer-empty-line normalization. It parses
only the leading directive block, so directive-like string content remains code.
An independent review caught and regression-tested Python's broader Unicode
line splitting; the checker uses the same CR/LF splitting as pinned Quarto.
The source hashes, execution counts/logs, actual stdout, and failed-run rejection
are unchanged. This is serialization handling, not a numerical tolerance change.

The lightweight witness `build/check_all_authored_options.py` runs synthetic
print-only bodies with all 287 authored option headers through both real formats;
`build/options-diagnosis/all-authored-options.log` records its pass. It trains
no book model and is not manuscript execution evidence. A corresponding
pre-training integration test prevents new option spellings from wasting a full
candidate run. New final-source executions are required; neither earlier failed
bundle is retroactively completed or promoted.

Option-repair verification: `build/options-diagnosis/scripts-unit.log` reports
273 script tests passing with seven opt-in integration skips. The focused
`container/test_unit_execution.py` invocation with pinned local Quarto/Python
runs all three real pre-training tests, including all authored headers and an
actual plotted cell with relocated dimensions; all pass. Independent review
confirms the changed-string regression fails as intended. The ordinary source,
Plan, book, anchor, and whitespace checks also pass. Complete book runs remain
the next gate; these fixtures do not certify their outcomes.

The final assembly path is being guarded separately: public/reference notebooks
use the exact canonical image, while HTML and PDF assembly reuse frozen output in
disposable snapshots with a refusing kernel. A source chapter's complete hash must
match its freeze, because frozen Markdown also contains prose. Presentation-only
library changes may occur in the disposable copy, never in installed evidence.
The original image, both complete run bundles, and the comparison proof still need
durable archiving; expiring Actions artifacts alone are not a release archive.

The numerical reference is the baseline's committed `_freeze/` stdout, checked by
`scripts/audit_frozen_stdout.py --base c058d1f401fd0ead3ae59a2a8730f95489a2d9aa`.
This was the reference for the original editorial-only pass. The subsequently
approved canonical-runtime migration below supersedes that plan: Chapters 11 and
13 now run paired five-seed studies, and a newly fingerprinted freeze must pass two
independent container runs before promotion. No GPU job is required.

The binary Brier identity was checked with the shared `verify-math/verify.py`:
`q*(1-p)**2+(1-q)*p**2 == (p-q)**2+q*(1-q)`; its derivative is `2*p-2*q`.
Source: Gneiting and Raftery (2007), DOI `10.1198/016214506000001437`, Example 1.

Build, visual-review, page-count, and deployment results will be recorded here
after validation, not inferred from source edits.

## Source verification

- `audit_book_contract.py`, `audit_python_sources.py`, `audit_plan_code.py`, and
  `audit_public_anchors.py` pass at the source stage: 194 visible Python surfaces,
  95 execution-only cells, 285 native executable cells, and four transclusions.
- AST comparison against the baseline covers all 285 cells. Only Chapter 12's
  second cell differs, solely through figure color strings. The experiments and
  their order are unchanged; the three-point witness moved across prose, not code.
- The duplicate local-constant exercise formerly in Chapter 12 is consolidated
  into TTR Exercise 1. Chapter 12's learnable-bandwidth exercise is now Exercise 6;
  the fixed v1.3 exercise numbering remains available in the archived edition.
- Thirteen notebook regression tests and the strengthened PDF contract tests pass.
  The image gate decodes PNG/JPEG pixels and safely parses SVG XML, with corrupt-image
  regression fixtures. The PDF gate checks all selected profiles before installing
  either artifact, detects changed/new inputs, and removes stale success metadata.
  The PDF smoke
  fixture covers all five Part transitions in both profiles and reproduces whole
  PDF hashes across two fresh directories (`build/pdf-smoke/results.json`).
- Four Plan → Code tripwire tests protect the known generic-plan regressions;
  semantic accuracy still requires reading each step beside the region it reveals.
- Eight DOM regression tests execute the actual Plan → Code interaction script,
  including independent results, mixed stdout/figure ordering, keyboard state,
  search events, and no-JavaScript behavior. A detached Chrome fixture of Chapter 15
  with the current script and styles passed desktop interaction checks. This is not
  a final rendered-book review. The Chapter 15 fixture also passed at 390 px:
  independent results leave source closed, opening code restores stdout in source
  order, and source listings retain local horizontal scrolling. Native Find itself
  remains unverified; the `beforematch` handler is covered by the DOM suite.
- Four responsive-table tests protect native table/caption identity, local overflow,
  conditional keyboard focus, resize/disclosure updates, and route/figure behavior.
  Phone inspection exposed a pre-existing wide-table problem and an inline example
  forced to `white-space: pre`. Local table frames and inline-only wrapping bring
  Chapter 15's fixture to a 390 px page at a 390 px viewport, with executable source
  still preformatted. This is an HTML presentation fix, not a manuscript change.
- Three prediction-fence regression tests cover the Chapter 16 missing blank line.
  Parsing the Quarto-engine markdown, rather than raw `.qmd`, identified that unit
  as the only real leaked prediction fence in the completed refresh. Source is fixed;
  its two frozen formats still require refreshing before final assembly.
- The first Chapter 1 execution refresh reproduced its frozen stdout exactly.
  Its initial assembly needed the documented frozen-PDF materialization helper;
  the complete final builds run through that helper automatically.
- The first Part I refresh stalled on a file read in an old editable package's
  Box checkout (`code/dlbook/__init__.py`), not on training. The exact Chapter 6
  first cell completed with baseline-identical stdout when imports were bound to
  this checkout. The blocked read is recorded in
  `build/diagnostic-ch6-kernel-sample.txt` and
  `build/diagnostic-ch6-manager-sample.txt`.
  Renders now set `PYTHONPATH` to the verified checkout's `code/`; isolated PDF
  workers bind it to their own snapshot. No user-wide environment was modified.

## Fresh execution discrepancy — publication gate still open

The directory-wide two-format refresh completed with exit code 0; its log is
`build/review-all-chapters-render.log`. The final stdout audit finds nine units
differing from the baseline exactly, with four outside existing portability limits.
HTML and TeX stdout agree with each other. Computational AST, cell execution
settings, and tracked code/data dependencies are unchanged at those sites:

- `_freeze/chapters/interludes/learning-by-experiment/execute-results/{html,tex}.json`:
  the two new executions agree with each other but differ in high-learning-rate
  results from the baseline. The existing per-study portability rules accept these
  differences; this is not exact reproduction of the historical artifact.
- `_freeze/chapters/part2/08-cnn/execute-results/{html,tex}.json`:
  the LeNet clean endpoint changes from 82.5% to 81.2%, exceeding the existing
  1.1-percentage-point portability bound. Those numbers come from the baseline
  commit named above and this refresh's stdout block 9, respectively.
- `_freeze/chapters/part3/11-encoder-decoder/execute-results/{html,tex}.json`:
  stdout block 3 changes 93.1% to 95.4%, outside its 1-point portability limit.
- `_freeze/chapters/part4/13-attention/execute-results/{html,tex}.json`:
  stdout block 6 changes 97.469% to 96.582%, outside its 0.6-point portability limit.
  Both comparisons use the same baseline and `audit_frozen_stdout.py --policy
  portable`; neither is a manuscript algorithm change.
- `_freeze/chapters/part5/19-generative/execute-results/{html,tex}.json`:
  stdout block 5 field 20 changes from -0.001286332 to -0.001288524, just outside
  its absolute tolerance of 0.000002. The small magnitude does not waive the gate.

The completed fresh evidence is preserved before further rendering in ignored
`build/review-fresh-evidence/`: the entire `_freeze/` tree, per-file SHA-256 manifest,
render log, `runtime.json`, `execution-identity.json`, `stdout-exact.txt`, and
`stdout-portable.txt`. These are diagnostic artifacts, not replacement published
evidence. The final reports, not an in-flight mixed cache, are the source for this
tally. Runtime provenance includes the torch build and Accelerate backend; it does
not establish which historical environment difference caused the drift.

`scripts/audit_execution_identity.py --base c058d1f --report
build/review-execution-identity.json` records the identity evidence and explicitly
does **not** certify output equality or authorize reuse. Its regression tests cover
marker/prose-only edits, seeds, execution order, removed cells, execution options,
and literal code changes. The only changed native AST is Chapter 12 cell 2's
intentional figure-color strings. No numerical tolerance has been widened.

The earlier runtime record pins package versions but not enough OS/BLAS details to
attribute the fresh drift to one backend component. Publication remains pending the
numerical-evidence decision and the complete validation gate. Do not describe this
refresh as bit-identical or silently overwrite the book's numerical claims.

## Resume safely

The active in-progress checkout is `/tmp/dl-book-phase-a.XE6WWb/repo`, branch
`pedagogy-roundtrip-20260904`, based on the baseline commit above. Do not resume in
the stale Box checkout or reset this branch. Source-only checkpoints have been
committed and pushed on this working branch; no regenerated freeze has been
committed, and `main` and release tags remain unchanged.

The author has now approved a Linux/x86-64 canonical container and replacement
evidence, with a pinned base digest, Python, wheel hashes, and explicit thread and
dispatch environment. A fingerprint travels beside the freeze. Two independent
CI runs of the same source and exact image must agree on every stdout block before
the regenerated freeze is committed. The Mac joins the portability ledger at one
and six threads. Calibrate mutable-field gates from paired same-seed runtime
differences with a predeclared safety factor; seed SD governs prose precision.
Strict identities remain strict. Chapter 11 becomes a five-seed paired study and
Chapter 13 recomputes its own baseline. The thread diagnosis is recorded in
`docs/compatibility.md` and ignored `build/portability-diagnosis/README.md`.

The earlier execution-identity observation above predates these intentional study
and runtime-policy changes. Several source edits postdate their unit's execution;
the old Mac refresh is not final evidence. After canonical repeat validation and
paired portability calibration, reconcile dependent prose, run numerical and
notebook checks, build both PDF profiles twice through the reproducibility gate,
render HTML last, and finish visual/publication checks.

The interim HTML asset audit has no missing styles/scripts but correctly reports
the absent continuous PDF. The full two-profile build has not run; neither its
page counts nor deployment status can be declared final.
