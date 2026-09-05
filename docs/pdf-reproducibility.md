# Derived PDF build contract

HTML remains canonical. PDF reproducibility and Part-page composition are conversion
rules, not alternate manuscript content.

## Build and verify

Use the established book Python environment and the configured Quarto/TinyTeX path:

```bash
python scripts/test_pdf_build_contract.py
python scripts/test_pdf_smoke.py
python scripts/render_pdf_profiles.py --verify-reproducible
```

The first command is a fast unit test. The second compiles a small book containing
all five real Part paragraphs and placeholder chapters, in both profiles and two
fresh directories. It checks each paragraph against the page named by its outline
entry and retains preview PNGs in `build/pdf-smoke/`. It is not a full-book audit.

The third command is the publication gate. It snapshots the current repository
inputs twice, starts without inherited Quarto caches or LaTeX auxiliary files, and
runs both profiles to the existing outline/ToC fixpoint in each directory. It
requires identical PDF SHA-256 hashes **and identical recorded engine inputs**.
Only after every selected profile passes that comparison does it install the
verified PDFs in `_book/`. A new attempt removes the previous success ledger;
a failed profile comparison leaves both previously installed PDFs untouched.
`--profile print` or `--profile continuous` limits a diagnostic run; publication
requires the default, both profiles.

The snapshots contain tracked inputs and allowlisted new manuscript/pipeline assets.
They exclude `.git`, ignored credentials, build outputs, and arbitrary untracked
dotfiles. Files resolving outside the repository are rejected. A working-copy
preview carries the actual base commit, `dirty: true`, and an input-manifest digest;
it must not be represented as a clean tagged build. Inputs changing during the gate
cause a failure instead of a mixed-source artifact.

## Time, metadata, fonts, and compression

`SOURCE_DATE_EPOCH` comes from the source commit's committer timestamp, never the
wall clock or an inherited shell value. `FORCE_SOURCE_DATE=1` and `TZ=UTC` align
TeX's calendar, random seed, PDF creation/modification times, and timezone. This
machine timestamp is separate from the author-controlled visible edition date.

`tex/reproducible.tex` pins the LuaTeX stream/object compression settings. It
suppresses only optional PTEX provenance (including local file paths) and the
optional path-dependent trailer identifier. It preserves title, author, useful
engine metadata, hyperlinks, outlines, text mappings, and accessibility data.
There is no PDF-library rewrite, rasterization, or post-render metadata scrub.

Each profile retains `build/pdf-PROFILE-manifest.json` with the source state, PDF
hash, page/outline counts, deterministic environment, Quarto/Pandoc/engine versions,
and SHA-256 hashes of the actual engine-consumed fonts, packages, and figure assets
from LuaLaTeX's recorder. Project paths are normalized across the two temporary
directories. The two independent PDFs, manifests, build logs, and profile-specific
LaTeX logs are retained under `build/`, along with `pdf-reproducibility.json`, so a
failed hash comparison still leaves its actual artifacts available for diagnosis.
The publishing workflow archives the manifests and diagnostic logs even if its
gate fails; a missing success ledger is not evidence of a successful build.

**Scope:** this proves byte reproducibility with the same source and unchanged
recorded toolchain. It does not promise that installing TinyTeX afresh months later
will recover identical packages/fonts. The publishing workflow still obtains a
mutable TinyTeX installation. A future archival release requiring cross-date or
cross-platform reproduction must additionally preserve its TeX distribution or
container and use the recorded input hashes to verify that environment. Never
describe the two-directory check as a pinned-distribution guarantee.

## Part openers

The pre-Quarto `pdf-part-preamble.lua` filter moves only the prose inside a
file-backed `quarto-book-part` into KOMA-Script's `\setpartpreamble[u]`. Quarto
still owns the Part title, number, outline, and destination. The prose is emitted
once, below the title, in the same order as the canonical HTML. The filter is inert
for HTML and leaves the synthetic Appendices divider alone. Unexpected non-prose
content fails loudly rather than disappearing into a conversion-specific layout.

Technical references:

- [LuaTeX manual](https://mirrors.ctan.org/systems/doc/luatex/luatex.pdf), §§3.2.2
  and 4.4: optional PDF information and `SOURCE_DATE_EPOCH`.
- [KOMA-Script manual](https://tug.ctan.org/macros/latex/contrib/koma-script/doc/scrguide-en.pdf),
  `\setpartpreamble`: a Part's prose belongs to its title page, with authored spacing.

After the gate, run the complete structural, cross-reference, text-layer,
missing-character, geometry, and accessibility audits and inspect the changed full
book pages. Restore canonical HTML last, as in the existing publication workflow.
