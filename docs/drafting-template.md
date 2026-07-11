# Chapter Drafting Template (AI session prompt)

Use this fixed prompt structure for every chapter-drafting session. One chapter per
session. Fill the ALL-CAPS slots.

---

## Prompt

You are drafting **Chapter N: TITLE** of *Deep Learning: Making It Learnable* — the
course-companion book for DS 6050 (UVA), written in Professor Heman Shakeri's voice.

**Inputs (read all, in this order):**
1. `docs/style-guide.md` — the voice calibration target. Follow it strictly (including
   the Book-Specific Writing Rules: em-dash reduction, deduction arrows, figure-rich,
   lean folded code).
2. `~/dl-course-code/<module>/MODULE_NOTES.md` — the **polished lecture spine** for this
   module (preferred over raw captions; see `docs/dl-course-code.md`). Also skim the
   module's `scenes/` for figure compositions to echo.
3. `sources/SEED_FILES` — his LaTeX lecture notes for this chapter (authoritative for
   math and structure).
4. `drafts/partN/XX-raw.md` — mechanical pandoc conversion of the seeds (use for LaTeX→md
   fidelity, never for structure).
5. Course transcripts: `TRANSCRIPT_FILES` (his spoken explanations, analogies, and
   worked examples — mine these for voice and examples; auto-captions, read for meaning).
6. Chapter contract: the abstract in `chapters/partN/XX-....qmd` (the stub).

**Output:** the complete chapter as a single `.qmd` file, replacing the stub.

**Requirements:**
- Structure: motivation/problem first (never notation first) → concrete example with
  numbers → formalism → executable code → "make it learnable" pivot where applicable →
  recap → exercises (3–5, mix of pencil and code).
- Math: MathJax-compatible in HTML and LaTeX-compatible in PDF; use the book macros
  (`\vect`, `\matr`, `\E`, `\norm`, …) and keep `mathjax-config.html` synchronized
  with `tex/macros.tex`;
  every symbol defined at first use with dimensions stated before matrix products.
- Code: executable Python cells (```{python}), CPU-only, with each cell under about
  4–5 minutes and training-heavy chapters typically 5–15 minutes total; seeded
  (`torch.manual_seed(6050)`), tensor shapes narrated in comments the way the
  `[coding]_` transcripts do. From-scratch NumPy before `torch` where the chapter calls
  for it. NO d2l imports, no copied D2L code.
- Callouts per the style guide mapping (note = definitions, tip = make-it-learnable
  pivots + hygiene, warning = pitfalls he actually flags).
- Cross-references: `@sec-...` to other chapters; immediately after the title, keep an
  HTML provenance comment (`<!-- lecture-source: … seeds: … -->`) listing the
  transcript and seed filenames used.
- Reuse HIS analogies from the style-guide inventory; do not invent new ones when his
  exist.
- Figures: matplotlib in-cell for anything data-driven; reference
  `figures/generated/*.svg` for architecture diagrams (list any new TikZ needed at the
  top of the draft as a TODO comment).

**Hard constraints:**
- Every technical claim must be traceable to the seeds or transcripts. If you add
  anything genuinely new (missing-gap material), wrap it in
  `<!-- NOVEL: needs sign-off -->` comments.
- No D2L-derived text or code (licensing).
- **Pedagogical efficiency rule.** The book's destination is attention and
  transformers. Before including any concept, name the later chapter where it pays off;
  if it never recurs on the arc, demote it to an exercise or cut it (precedent: lasso in
  Chapter 1 became an exercise rather than a main section). Conversely, plant forward seeds cheaply — one or two
  sentences that a later chapter can call back to (precedents: "a dot product is a
  similarity score" and "prediction as a weighted combination of training targets" in
  Chapter 1, both harvested by Chapter 12). Check the target chapter's stub abstract for
  the seeds it expects. **The authoritative seed/harvest contract is
  `docs/arc-seeds.md`** — consult it before drafting (harvest every due seed by
  name, plant contracted ones) and update it after shipping.

---

## After the draft: consistency audit (separate session)

Prompt a second, independent session:

> Audit `drafts/partN/XX-draft.qmd` against `sources/SEED_FILES` and
> `TRANSCRIPT_FILES`. For every technical claim, mark: SUPPORTED (cite where),
> NOVEL (flag for author sign-off), or CONTRADICTED (explain). Check all math for
> correctness independently. Check every code cell runs mentally (shapes, imports,
> seeds). Return the claim table + a fix list.

Then: his edit → `QUARTO_PYTHON=.venv/bin/python quarto render CHAPTER` (no `--to`
flag; this refreshes both freezes) → inspect both formats → full `quarto render` →
merge.
