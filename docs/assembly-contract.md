# Derived-edition assembly boundary

The canonical numerical freeze is installed only with its two-run provenance
proof. Assembly is presentation work, not a fallback execution venue. Run:

```sh
python scripts/guarded_assembly.py --verify-only
python scripts/render_pdf_profiles.py --verify-reproducible
python scripts/guarded_assembly.py
```

The PDF entry point always creates two disposable input snapshots, compares the
complete resulting PDF manifests, and installs only matching artifacts. The HTML
entry point creates a separate disposable snapshot and installs its verified
`_book`, retaining both previously verified PDFs. The previous HTML bundle remains
recoverable under `build/html-previous-*/_book`.

Before assembly, the original immutable promotion receipt and physical evidence
sidecars are revalidated. Every executable QMD must match its full canonical
source hash, including prose and captions: frozen Quarto Markdown contains those
words, not just cell outputs. The complete executable-unit inventory and protected
code, data, experiment, and container inputs must also match. The source-tree
execution-identity audit separately checks global execution configuration.
Presentation-only files and provenance/report tooling may change; manuscript
changes need a fresh canonical freeze, not output reweaving.

Assembly uses `--use-freezer` and a temporary, verified, refusing Python
kernelspec. A cache miss fails closed. It does **not** use `--no-execute`: the real
Quarto regression fixture demonstrates that this flag bypasses thawing and drops
cached stdout. The temporary refusal script is generated outside the repository
and is never committed. No kernel monkeypatching is involved.

Every cached execution-result JSON and figure asset must remain byte-identical
through assembly. Quarto may regenerate presentation libraries under
`_freeze/site_libs` only inside the disposable snapshot. The installed `_freeze`,
including those libraries and `provenance.json`, must remain completely unchanged.
PDFs emitted by native `latex` execution are materialized into transient
`figure-latex` and `figure-pdf` paths without editing their archived source assets.

Evidence is recorded in `build/html-assembly.json`,
`build/pdf-reproducibility.json`, per-profile manifests, and retained Quarto and
LaTeX logs. Same-toolchain PDF byte reproducibility is a separate check from the
canonical numerical two-run proof; neither implies cross-toolchain identity.
GitHub Pages publication is restricted to `refs/heads/main`; feature-branch
workflow dispatch may validate but cannot deploy.

Regression checks:

```sh
python scripts/test_pdf_build_contract.py
QUARTO_BIN=$(command -v quarto) python scripts/test_guarded_assembly.py
python scripts/test_frozen_pdf_assets.py
```

The tiny real-Quarto tests cover HTML and TeX cache preservation, deliberate cache
misses, and a cell-side execution sentinel. They do not execute book studies.
