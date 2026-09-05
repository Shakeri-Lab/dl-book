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

The active uncommitted checkout is `/tmp/dl-book-phase-a.XE6WWb/repo`, branch
`pedagogy-roundtrip-20260904`, based on the baseline commit above. Do not resume in
the stale Box checkout or reset this branch. No commit, push, or tag was made.

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
