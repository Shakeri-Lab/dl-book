# Final source-inventory capture failure

This is a pipeline diagnosis, not a changed teaching claim or an accepted freeze.
Source checkpoint: `eabfcc9efd62b78bb058a9944f4512d178c4fad9`.

## Original evidence

Both Mac portability profiles completed the planned native unit/format executions,
their retained-notebook coverage checks, the date-study semantic audit, and paired
sidecar validation. Final provenance capture then rejected the source inventory:
`Source/input inventory changed during execution`. The original failed status and
raw records remain unchanged; no completed fingerprint was produced.
The completed unit evidence is each bundle's
`provenance/execution-coverage.json`; the following checks are recorded in
`logs/date-study-semantics.log`, `logs/paired-evidence.log`, and
`logs/capture.log`.

- `build/portability-eabfcc9/mac-one/status.json`, SHA-256
  `f859a0c256501949f2f4632504d154357ce8ef49f4d4358efda8a15b320a33a2`;
- `build/portability-eabfcc9/mac-six/status.json`, SHA-256
  `5b7e1937f20866f9c17f65500bbd4727d12e6f052a7e421bc2330ee5bd37862e`.

The diagnostic command is
`python build/diagnose_capture_inventory.py`. It extracts the original source tar
into a disposable gitless workspace and executes the full Appendix A1 in both
formats, using the production notebook archival/removal lifecycle. Its report is
`build/diagnostic-eabfcc9-capture/production-lifecycle/inventory-replay.json`,
SHA-256 `87c7a167f107b518ed08c3356b313aab3366531f84386ca2c6cf18d69b7e371d`.
The script at this replay has SHA-256
`1aa3f3f562004a6eb76cac854b4c9b3dfd905ebc2c158c16a7bc0a1ad834906c`.

## Reproduced cause and limits

The real capture command reproduces the same rejection after this small replay.
The sole added input is
`chapters/appendices/figures/generated/1_1_lin_Recap-fig06.pdf`, with SHA-256
`ce847436ff2e80636ff9855c1b04e4968e13026f129ad7f7e7cb5721efb2fd2c`.
It is a byte-identical copy of the already-authored PDF under the repository's
top-level `figures/generated/`. No existing source input is changed or removed
in the replay.

Pinned Quarto 1.10.18's `share/filters/main.lua` adds the existing sibling PDF to
Pandoc's mediabag in `convert_svg` (lines 7352–7364), even when no conversion was
needed. Its final mediabag filter (lines 9192–9204) calls
`share/filters/modules/mediabag.lua` (lines 81–94), joining the mediabag directory
with the relative image path. The parent-directory components put the duplicate
under the chapter's directory, outside the ordinary generated-output locations.
The strict source inventory correctly refuses to silently accept that new file.

An earlier stand-alone replay also created a numbered `.quarto_ipynb_1` file,
because it omitted `record_execution` between formats. That was a defect in the
replay, not in the production lifecycle. The corrected replay archives/removes
the notebook exactly as the runner does. The stale-notebook refusal and source
input exclusions must remain strict.

The original final capture did not preserve a post-execution input inventory
before raising, and its disposable workspace is gone. The exact complete final
inventory therefore cannot be reconstructed from those original bundles. The
small reproduction establishes a sufficient failure mechanism, not permission
to manufacture a successful historical capture.

## Repair and acceptance boundary

The candidate repair uses the existing, source-bound PDF siblings directly in
the execution-only profile, bypassing the mediabag copy. It must first validate
that every authored SVG reference has its required sibling PDF. It does not
change the manuscript, study code, numerical runtime, or presentation profile,
and does not broaden exclusions for new source files.

A rejected capture now retains an explicitly ineligible `source-after.json` and
an added/removed/changed-path report before returning failure. Existing rejection
evidence is never overwritten by a retry. This records future failures; it does
not repair missing historical proof.

Before another full candidate cycle, a cheap real-Quarto fixture must execute the
full authored A1, including its image reference, through both formats and the
actual notebook lifecycle, then complete schema-2 capture with its own real
preflight. It is explicitly fixture-only, not a book candidate. A new clean
source still requires two independent full Linux executions and both Mac
profiles before any reference promotion.

## Local regression evidence

The complete pretraining suite passed in
`build/capture-boundary-suite.log`: six real-Quarto tests, including the full A1
capture lifecycle and two independent executions of all seven authored
least-squares sites. The retained reports are
`build/capture-boundary-verification/capture-lifecycle.json` and
`build/capture-boundary-verification/authored-lstsq.json`. The former validates
the physical schema-2 fingerprint and its retained notebook/log evidence; the
latter compares every generated JSON/PNG/PDF byte. These are fixture results,
not complete book acceptance.

The script regression suite also passed (302 tests, 11 optional integrations
skipped), recorded in `build/capture-boundary-script-tests.log`; the real-Quarto
integrations above were run separately. Source, Plan-to-Code, and book-contract
audits passed without manuscript or numerical-code changes. The independent
Linux pair and native Mac profiles must now rerun on the clean repaired source.
