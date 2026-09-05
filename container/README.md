# Canonical executed-artifact candidate

This recipe defines one new Linux/x86-64 CPU execution reference. It is **not** a
claim that seeds, single-thread execution, or ISA flags make all machines agree.
The former macOS/Accelerate artifacts and this CPU-wheel reference are different
numerical environments. A new reference must pass two independent same-image
Actions runs before its `_freeze` is considered for promotion.

## Exact inputs

`canonical-runtime.json` records the verified official source URLs and digests:

- CPython **3.12.14**, official `python:3.12.14-bookworm`, pinned to its
  **Linux/amd64 child-manifest digest**, not a floating tag or multiarch index.
  This Debian Bookworm userspace differs from the Ubuntu 24.04 host.
- PyTorch **2.12.1+cpu**, torchvision **0.27.1+cpu**, NumPy **2.5.1**,
  matplotlib **3.11.1**, and 64 other distributions. The 68 entries in
  `requirements-linux-amd64.lock` each select one exact official wheel URL and
  its published SHA-256. CPU-only PyTorch is deliberately not the older CI
  CUDA-wheel build. `pip --require-hashes --no-deps` checks every download;
  `pip check` validates the complete installed dependency set.
- Quarto **1.10.18**, with the official Linux/amd64 archive SHA-256 checked before
  extraction. The image does not run `apt`, resolve packages at execution time,
  install TinyTeX, or compile a final book PDF.

The Dockerfile uses the full pinned Python base to supply system libraries. The
exact saved image, not a later rebuild from a tag, is reused for the second run.
The image includes the pip installation report. The completed fingerprint records
the actual Python, packages, Torch build configuration, loaded numerical-library
binary hashes, CPU observations, source/data hashes, and dispatch/thread settings.
The same runtime is observed before execution in `provenance/preflight.json`.
That original observation survives a failed run; by itself it is never eligible
for promotion.

## Execution contract

The host first records input hashes from a clean checkout and archives that exact
commit. The runner extracts a fresh workspace without inherited `_freeze`,
`_book`, `.quarto`, or `build` outputs. It verifies the extracted input inventory
against the clean host manifest before executing anything. Execution has no
network access; the data and pinned study artifacts are repository inputs.

The predeclared execution plan includes **every executable QMD**, its native-cell
ordinals, and transcluded source hashes. Each unit runs in LaTeX and HTML format
with a new Jupyter kernel (`--execute-daemon 0`). The committed
`_quarto-execution.yml` profile changes only the project type to `default`, avoiding
book-mode LaTeX's expansion of a single-input command into the entire book; all
inherited execution and format settings remain in effect. This profile is part of
the source fingerprint and is never used to publish the complete editions.
LaTeX execution creates genuine
`tex.json` and PDF figure assets; it does not copy HTML results or compile TeX.
The later print build consumes these executed artifacts. The copied `code/`
directory is the only injected repository import path for native QMD helpers.

The image-owned kernel launcher explicitly sets Torch intra-op and inter-op
threads to **1/1**, without monkey-patching numerical functions. Authored setup
cells honor `DLBOOK_TORCH_NUM_THREADS`. OMP/MKL/OpenBLAS/NumExpr budgets are one;
`ONEDNN_MAX_CPU_ISA=AVX2` and `MKL_CBWR=AVX2` are recorded dispatch policies, not
proofs of universal bit identity. `SOURCE_DATE_EPOCH` comes from the exact source
commit timestamp, including when the image is reused. It fixes supported figure
metadata clocks without inventing a build date.

Every kernel writes a startup observation bound to its source unit and format.
These observations report startup state, not a claim to have continuously
monitored every cell. The portable `kernel_start.py` can also support explicitly
labeled Mac diagnostics with another thread budget; those are not canonical runs.

Each render retains Quarto's actual executed notebook before the next format can
overwrite it. An immediate per-unit audit checks source and cell options, ordered
execution counts, successful completion logs, and notebook stdout against the
frozen output. Silent `echo:false` cells still require execution evidence even
when Quarto omits them from rendered Markdown; visible-cell counts are not
execution counts. Disabled or cell-cached execution fails the audit. Raw
notebooks, source copies, and logs are retained even when that audit fails.

Pinned Quarto reserializes the leading YAML directives and relocates authored
figure dimensions into notebook metadata. The audit therefore checks complete
semantic option values with an explicit relocation allowlist, while preserving
exact non-option Python and comments after Quarto's outer-empty-line handling.
Unknown, missing, or shadowed options fail. Pre-training fixtures exercise all
authored option headers with synthetic print-only cells; they are pipeline
checks, not replacements for actual book execution.

After execution the source/input inventory must be unchanged, the native cells
and kernels must cover the entire predeclared plan, and HTML/LaTeX ordered stdout
must be byte-identical. The completed schema-2 fingerprint binds the original
preflight and physical `execution-coverage.json` proof, which is checked again
during comparison, promotion, and derived-edition assembly. Partial results and
logs survive failure, but a failed execution does not receive a completed
fingerprint. Never manufacture missing proof for a historical failed run.

## Two independent Actions runs

The reusable `.github/workflows/canonical-freeze.yml` accepts `source_revision`
and `image_run_id`. Its existing-workflow entry point is **Execution Audit**:

1. Dispatch `execute-audit.yml` on the candidate branch with
   `mode=canonical-candidate`, the full candidate source commit, and blank
   `image_run_id`. This builds and uploads `canonical-freeze-image`, then runs a
   fresh source snapshot and uploads `canonical-freeze-candidate`.
2. Start a **new workflow run**, on the same source commit, supplying the first
   run ID as `image_run_id`. This downloads the exact image archive, checks its
   SHA-256, source/recipe inventory and Docker content ID, and runs another fresh
   snapshot. It downloads the first candidate and calls
   `compare_freeze_runs.py --require-all-files`.
3. Inspect `canonical-freeze-comparison/exact-repeat.json`. The report separately
   identifies strict ordered-stdout identity and whole-freeze identity, including
   figures and execution JSON. Both must pass this workflow's promotion gate.
   A CPU-model difference is recorded, not used to excuse changed bytes.

Both run bundles contain `_freeze/`, `provenance/fingerprint.json`, the original
`preflight.json`, clean `source-before.json`, `execution-plan.json`, attributed
`kernel-startup/*.json`, `execution-coverage.json` with its physical notebooks,
source copies and logs, the wheel installation report, and status. Independent
notebook timing metadata need not match; authenticated source, execution
coverage, raw paired measurements, and every frozen file must. No job writes
to `main`, replaces the checkout's freeze, dispatches itself, or publishes Pages.
Source/data/recipe changes require a new first run and a matching independent
repeat; reusing an image built for another source is rejected.

Chapters 8, 11, 13, and 19 additionally export the predeclared per-seed raw records
in their existing hidden execution harnesses when `DLBOOK_PAIRED_EVIDENCE_DIR` is
set. Each format receives a separate directory beneath `provenance/paired-evidence`.
The source-bound `docs/paired-evidence-plan.json` defines the exact eight sidecars;
their validator checks protocol, counts, and cross-format raw equality before
fingerprinting. Their manifest and hashes accompany the candidate, so later
portability calibration does not have to reconstruct seeds from rounded means.
This export path does not change random streams, models, or printed output.

Actions artifacts expire after **30 days**. Before treating this as a durable
release, archive the exact image archive and its manifest, both candidate bundles,
and the comparison report alongside the stable release (or another durable
author-approved archive). The recipe alone does not replace the saved image's
content identity. Publication and release-tag decisions remain separate.

## Maintenance and lightweight tests

Changing the canonical dependencies is an explicit reference migration, never an
unattended install/update. `requirements.in` states direct dependency choices;
`requirements-linux-amd64.versions.txt` records the resolved transitive versions.
To propose a lock update:

```sh
uv pip compile container/requirements.in --python-version 3.12.14 \
  --python-platform x86_64-manylinux_2_36 --only-binary :all: \
  --no-header --no-annotate --output-file container/requirements-linux-amd64.versions.txt
python container/resolve_wheel_lock.py container/requirements-linux-amd64.versions.txt \
  container/requirements-linux-amd64.lock
python container/test_contract.py
```

The resolver is a maintenance tool, not a build step. It uses published file
hashes, allows only compatible binary wheels, and fails when a wheel is missing.
The focused tests check source isolation, exact wheel/policy pins, same-image
validation, and fail-closed unit/format/kernel coverage. The existing pre-training
Quarto smoke gate also runs a real silent-cell fixture in both formats. Docker image installation
and real execution still require the two CI runs; passing these fixtures is not
an execution claim.
