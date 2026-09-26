# Phase 0: baseline (read-only)

Baseline commit: `86ec60b` (`main` fast-forwarded to `origin/main` on 2026-09-26, then
branched as `voice-coherence`). Every "before" measurement in this directory comes
from this commit.

## Section 1 facts, verified

| Brief says | Found | Evidence |
|---|---|---|
| Quarto `.qmd` manuscript with Preface, 20 chapters, 3 interludes, 5 Part pages, Epilogue, 5 appendices | Confirmed: 35 pages | `find . -name "*.qmd"` and the `book.chapters` block of `_quarto.yml` |
| Render with `QUARTO_PYTHON`, `quarto render --to html --no-clean`, `scripts/render_pdf_profiles.py` | Confirmed (README lines 47 to 50) | Note: `~/.local/bin/quarto` on this machine is 1.9.38; every render here used the pinned 1.10.18 (`~/.local/quarto-1.10.18/bin`) |
| An existing book-voice contract in CI | `scripts/audit_book_contract.py` ("book voice and splice hygiene": off-page lecture references, internal source paths, seed jargon, splice patterns, the Check-yourself-then-"Okay, so" order), run in the `build-deploy` job's "Audit manuscript contracts" step | `grep -ril voice scripts/ .github/` |
| 133 frozen stdout blocks | **136** blocks (three added with the Chapter 6 revision of 2026-09-25) | `python scripts/audit_frozen_stdout.py`: "136 stdout blocks ... 27 HTML/TeX pairs match" |
| Ten protected chapter anchors | Confirmed: 10 | `docs/public-anchors.md`, `scripts/audit_public_anchors.py` |
| Five bounded forward pointers to *Making It Trainable* | Confirmed: Chapter 5 (`c11`), Chapter 9 (`c15`), Chapter 14 (`beyond`), the experiment interlude (`c13`, `app-incident`), Appendix C (`c01`, `c03`); the Preface mentions the companion twice more | `grep -rn opt-book index.qmd chapters/` |
| 26 generated notebooks | Confirmed: 26 | `scripts/notebook_manifest.json` |
| 150 exercises | **151** (Chapter 9 gained Exercise 7 on 2026-09-25) | count of `N. **(Tag.)**` items in every Exercises section |
| Edit safety: `assert s.count(old) == 1` | Adopted in `scripts/voice_apply_edits.py` | |
| An em dash survives in Chapter 1's recap heading | **Not present**: the heading reads "Okay, so: what did we just build?" (colon since commit `412a0da`). The rendered em dashes are elsewhere: 102 in replay panels, 5 in Quarto's generated appendix titles ("Appendix A [em dash] ..."), and 1 inside a cited lecture title in Chapter 4's Sources | `scripts/audit_voice_ledger.py` class tags; `em_dash_R` column of `ledger_before.csv` |

## Section 2 diagnosis, re-verified on rendered HTML

**Chapter 1's kit is present.** "That second clause is the whole game." (line 40,
immediately after the goal display); knobs (lines 108 to 110, 539, 1088); the
blindfolded walk (lines 298 to 301); "with our own hands" (line 495); "(the cruel
part)" (lines 1032 to 1033); the promise "you will know exactly why" (line 13); and
show-then-name for bias and variance ("Now we can name what the picture separated",
line 923, after the three-panel figure).

**Chapter 13's counts.** Class A chapter references before Section 13.2: **9**
(opener 4, Section 13.1 5), matching the brief. Guards by the frozen patterns: **11**
(prose 6, captions 3, callouts 2). Hand-labelled, the true count is 12 to 14: the
patterns miss "not in less wall-clock time" and "We did not match parameter count",
so "more than a dozen" holds. Three of them sit on the sqrt(d_k) rule in one
subsection: "a variance-control rationale, not a promise ..." (prose), "seeded
synthetic draws about concentration, not a claim about ..." (caption), and "it does
not normalize the vectors" (prose).

**The drift in numbers** (`ledger_before.csv`, per 1,000 words of class A prose):
reader address ("you") is zero in Chapters 7 and 12 to 20 and in all three
interludes, against a Part I median of 4.26; prose guards run from 2.4 to 5.1 in
Chapters 13 to 18 and the interludes, against 1.19.

## Baseline builds

- **HTML**: `quarto render --to html --no-clean` (1.10.18, freeze true), snapshot
  copied to the session scratch area. Render log: 26 `WARN` lines, all "Unable to
  resolve link target: notebooks/<slug>.ipynb" (notebooks are added by CI).
- **PDF health** (`scripts/render_pdf_profiles.py --profile <p>`, the retained
  `index.log` of each profile, `pdfinfo`):

  | profile | LaTeX errors | warnings | overfull | underfull | pages |
  |---|---:|---:|---:|---:|---:|
  | print | 0 | 9 | 423 | 54 | 554 |
  | continuous | 0 | 10 | 423 | 54 | 529 |

- **Notebooks**: `scripts/export_notebooks.py --revision 86ec60b...` wrote 26
  notebooks; the same command after the pass must reproduce them byte for byte (I11).

## Found in passing (outside this pass)

Chapter 1 writes three notes as raw LaTeX `\footnote{...}` (bias augmentation, the
Gaussian-noise justification, the ridge rotation note). They appear in the PDF but the
canonical HTML drops them. Recorded in `decisions_pending.md`.
