# Mac portability measurements

`scripts/run_portable_freeze.py` measures the existing Mac Python environment at
one or six intra-op threads, with one inter-op thread. These are portability
measurements, not canonical freezes. The script never copies results into the
repository, edits acceptance tolerances, or promotes an artifact.

Supply the exact commit and clean `source-before.json` manifest used to prepare
the canonical candidate. Each invocation creates its own Git archive and fresh
temporary source tree; pending worktree changes and inherited `_freeze` outputs
are not used. The manifest must match all extracted source inputs. The driver
may be external to the measured checkpoint; its own SHA-256 and the archive
helper's SHA-256 are retained in `status.json`.

```sh
/Users/hs9hd/.venvs/dl-book/bin/python scripts/run_portable_freeze.py \
  --root /absolute/path/to/repo \
  --source-commit FULL_SOURCE_COMMIT \
  --source-before /absolute/path/to/clean-source-before.json \
  --threads 1 --run-id mac-one-unique-run-id \
  --output /absolute/path/to/new-empty/mac-one
```

Run the other declared profile with `--threads 6` and a different run ID and
empty output directory. A full invocation executes the whole native book in
both formats; it is an expensive measurement, not a preview command. Do not
start it merely to test the driver. The lightweight fixtures are:

```sh
PYTHONPATH=scripts /Users/hs9hd/.venvs/dl-book/bin/python -m unittest scripts/test_portable_freeze.py
```

The temporary `python3` kernelspec invokes the checkpoint's
`container/kernel_start.py` directly, with no monkeypatch and no global kernel
installation. `JUPYTER_PATH`, configuration, and runtime directories are
isolated. Quarto and kernel selection are observed before execution. The
checkpoint's explicit startup policy sets and records actual PyTorch threads;
the driver rejects a probe that differs from its declared profile. Numerical
thread/dispatch overrides inherited from the launching shell are cleared,
then the Mac thread policy is applied. Linux AVX2 controls are not applied to
Apple Silicon. `SOURCE_DATE_EPOCH` comes from the source commit, not the clock.

The runner reuses the checkpoint's execution plan, native-cell coverage parser,
HTML/LaTeX exact-stdout check, and date-study semantic audit. Each unit/format
uses a fresh kernel. The shared command builder requires the committed
`execution` profile (`project: type: default`), preventing Quarto's book-mode
LaTeX render from silently expanding a single-unit request into the whole book.
Checkpoints before this profile and helper existed cannot use this driver.
Source `code/` is the only `PYTHONPATH` addition needed by
native manuscript cells; this does not change the independent notebook-export
self-containment contract. The provenance collector is also executed through
the same explicit startup policy, but labels its observations as a separate
probe process rather than a chapter kernel.

Outputs have the same bundle shape as canonical candidates:

- `_freeze/`: genuine HTML and LaTeX execution products, including figure assets.
- `provenance/`: source archive/manifest, execution plan, `kind: local`
  fingerprint, selected interpreter/kernel, declared Mac profile, and all
  per-kernel startup probes. Package versions and loaded numerical libraries
  are observations of the Mac environment; the Linux wheel lock is a source
  recipe reference, not a claim that those wheels ran on macOS.
- `logs/` and `status.json`: all commands' output and success/failure state.
  Partial freeze evidence is retained on failure.

Completion asserts source identity, execution coverage, observed startup policy,
and exact stdout agreement between this run's HTML and LaTeX executions. It
does **not** assert agreement with Linux, repeat-run identity, equivalence of
different thread budgets, or an approved portability tolerance. Paired-seed
calibration remains a separate report under a predeclared protocol; seed
standard deviations are not acceptance thresholds.
