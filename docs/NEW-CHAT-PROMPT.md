# Bootstrap prompt for a fresh chat session

Paste everything between the rules into a new Claude Code session started in
`~/Library/CloudStorage/Box-Box/Teaching/6050/dl-book`. It orients the agent, pins the non-negotiables, and stops
it from editing before you have said what you want done.

Keep this file current: if a rule changes or the state moves, edit the prompt here
rather than re-deriving it in chat.

---

I'm Heman Shakeri (UVA School of Data Science). You're helping me with my
deep-learning textbook, **_Deep Learning: Making It Learnable_** — a Quarto book
rendering to HTML + PDF, the course text for DS 6050.

**Repo:** `~/Library/CloudStorage/Box-Box/Teaching/6050/dl-book` (in Box with the
rest of my 6050 material; the virtualenv is deliberately outside it). Remote `https://github.com/Shakeri-Lab/dl-book`, live at
`https://shakeri-lab.github.io/dl-book/`, PDF at
`https://shakeri-lab.github.io/dl-book/Deep-Learning--Making-It-Learnable.pdf`, and
continuous-screen PDF at
`https://shakeri-lab.github.io/dl-book/Deep-Learning--Making-It-Learnable--Continuous.pdf`.
Current stable release **v1.2.1** is the reciprocal-companion point release. The live
`main` revision is a rolling post-v1.2.1 build after the universal Plan → Code pass,
two Chapter 1 revisions,
the pacing/visual/full-scale experiment pass, the July 28 comprehensive book audit,
and the Chapter 15 editorial/figure pass. It contains chapters 1–20 plus three
interludes, five appendices, and an epilogue. The July 29 closeout adds the
epilogue's `E.` figure namespace, the explicit canonical-edition sentence, complete
interlude retrieval checks, the RMSProp provenance line, strict CI text-layer
tripwires, and the reviewed exercise bank. The Chapter 20 deep pass closes the
temperature arc with a learned-logit-scale bridge, a derivation and paired-study
exercise, and an exact paper-versus-reference-code source note. The final Part II
pass certifies Chapters 7–9, repairs Chapter 9's last two splice typos, and records
an exact source-level re-execution of Chapter 15's now CI-protected self-contained
lab. The v1.2 release also restores Chapter 16's post-hoc calibration exercise,
unnumbers the epilogue equations, and pins the final PDF text-layer regression.
The August 2 print-hardening pass adds an 88-column learner-visible Python guard,
print-side wrapping for code and frozen stdout, media-box geometry and PDF-outline
audits, a three-pass LaTeX minimum, and a copyright/title verso. The current derived
PDFs use a uniform 0.85-inch margin: the two-sided print edition is 536 pages and
the one-sided, open-any continuous-screen edition is 513 pages. Both contain no
off-paper text or missing glyphs; all 133 frozen stdout blocks remain byte-identical.
The August 6 coherence pass adds Appendix E as an optional statistical-contract
retrieval layer, replaces Chapter 1's bias--variance cartoon with a seeded
show-then-name experiment, separates representation, optimization, and generalization
evidence in Chapter 6, and bounds Chapter 18 alignment claims within a broader
sociotechnical audit. The current code contract covers 194 visible surfaces, 95
execution-only harnesses, and 285 executable cells. The August 8 presentation pass
adds interactive Plan → Code mapping, responsive wide-figure inspection, a repaired
Figure 9.1, and a complete Chapter 1 semantic-colour equation sweep.
The final August 8 web pass adds an audited favicon, social card, description,
citation metadata, exact MathJax 4.1.3 pin, AA-safe link color, branded 404 page,
interlude `Table EX.` namespace, per-panel **Show all code**, narrow-screen prose
output wrapping, and high-density exports for the two remaining soft figures.
The August 19 pass adds the author-supplied cover to both derived PDFs without
replacing the searchable title machinery, then closes the shared Preface with a
restrained support invitation. The complete book remains free at $0, contributions
unlock nothing, and one stable Buy Me a Coffee link leaves contribution amounts to
the external account without inventing amount-specific URLs.
The August 20 navigation pass closes root chapter groups and the two ancillary Preface
disclosures by default, and adds specific accessible names plus keyboard/deep-link
support for those controls. The sidebar PDF action now opens a cover-led static landing
page with direct free links to both editions, a $0 minimum, a suggested $20 optional
contribution linked directly to Buy Me a Coffee, and no local amount picker that cannot
transfer its choice. Download access is never gated. Narrative teaching callouts
remain open.
Nothing is mid-flight.

**Read before doing anything, in this order:**

1. `CLAUDE.md` (repo root) — environment and runbook.
2. `docs/CONTINUING.md` — start with the state block at the top, then **§9
   "Recent passes and open decisions"** (it supersedes older status text), then
   §2 the working protocol and §4 the standing author rules.
3. `docs/style-guide.md` — voice, plus the Editorial Contract governing code and
   pedagogy (equation/kernel/harness, Plan → Code panels, estimator discipline).
4. `docs/arc-seeds.md` — the seed/harvest ledger and the reading-order toolbox.
   Read this before touching any chapter.

Then reply with: (a) two lines on where the book stands, (b) the decisions
waiting on me, and (c) what you would do first. **Do not edit anything until I
answer.**

**Hard rules — non-negotiable:**

- **No AI attribution anywhere in git history** — no `Co-Authored-By`, no
  "Generated with…" lines, in commits, PR bodies, or release notes, in this or any
  of my repositories.
- **No d2l.ai-derived text or code**, ever (licensing). The `sources/` snapshots
  are my own lecture material; `rnn_data_prep.py` is D2L-derived and must not be
  ported.
- **Printed code is executed code.** Every snippet is either an executed cell or
  tested source in `code/dlbook/` shown via project-root-aware `book-include=`.
  Never retype an "essence" version of real code. Every learner-visible code
  surface uses the Plan → Code panel; only `echo: false` execution support is
  exempt. Markers in code are bracket-only (`# [1]`, or fused `# [2][5]`);
  repeating plan prose after a marker is an audit failure.
- **Three exercise modes only.** Use `(Pencil.)`, `(Code.)`, or `(Audit.)`; split
  compound demands into explicitly tagged parts. Audit exercises test a claim,
  protocol, or implementation; when a defect is supplied, ask the reader to predict
  its direction before deriving it.
- **Book voice is self-contained.** Arguments, omissions, analogies, and evidence do
  not defer to an off-page narrator. Keep exact source paths in hidden provenance,
  not learner-facing Sources entries.
- **HTML is the source of truth.** Review and approve the canonical HTML edition
  first. The PDF is its derived print/offline conversion and may differ only where
  pagination, line breaking, float placement, or print-safe sizing requires it.
  Repair disagreements in the shared source or conversion layer; never create a
  substantively different PDF edition.
- **Unnumbered-section figures are independent.** Experiment, autoencoder, and
  test-time-regression figures use `EX.`, `AE.`, and `TTR.` namespaces; epilogue
  figures use `E.` in both formats. Experiment-interlude tables use `EX.` too.
  Interlude display equations remain unnumbered.
- **PDF glyph hygiene is enforced.** Greek and relation symbols belong in math mode;
  code elisions are ASCII; the publish job audits LaTeX missing-character warnings,
  NUL/U+FFFD extraction, and decorative icon text.
- **Print geometry is enforced.** Learner-visible Python is at most 88 columns.
  Print-side wrapping is a safety net, not permission for unreadable source. The PDF
  audit fails if text leaves the media box, reports text-block intrusions for visual
  review, and verifies late-book outline destinations after at least three LaTeX
  passes.
- **Semantic colour is a contract.** Blue is input/design data, orange is
  learnable parameters, purple is observed targets, green is predictions, and
  wine is residuals/errors. Carry a colour into nearby prose when it clarifies
  the same mapping, but never make meaning depend on colour alone.
- **Show, then name—including across chapters.** Plant a future mechanism in
  ordinary language, but do not reveal the later construction's name or finished
  interpretation before the reader has built enough behavior to earn it. Keep the
  destination in `docs/arc-seeds.md`, not in premature learner-facing slogans.
- **Box caution.** The working tree is in Box; GitHub is the source of truth. If git objects ever look corrupt, re-clone rather than repair in place, and never let a render run while Box is mid-sync of the same folder.
- **Freeze discipline.** Any prose edit invalidates that chapter's freeze cache.
  Re-render the chapter with **no `--to` flag** (both formats), then the project —
  otherwise the PDF ships stale. Renders are slow: a heavy chapter is 20–40
  minutes, the full book about 40. Run them in the background and keep working.
- **Refactors must be content-bit-identical** on the frozen stdout. Snapshot the
  `cell-output-stdout` blocks from
  `_freeze/<chapter>/execute-results/html.json`, re-render, and diff.
- **Pre-test every experiment** before writing prose about its numbers, and put
  only measured numbers in captions.

**Environment:** `cd ~/Library/CloudStorage/Box-Box/Teaching/6050/dl-book && export QUARTO_PYTHON="$HOME/.venvs/dl-book/bin/python"` (on a machine that has never built the book, `docs/NEW-MACHINE-SETUP.md` sets it up from bare); Quarto at
`~/.local/bin/quarto`; TinyTeX for PDF; `gh` at `/opt/homebrew/bin/gh`,
authenticated per command via
`export GH_TOKEN=$(printf "protocol=https\nhost=github.com\n" | git credential fill | sed -n 's/^password=//p')`
— never print that token. CI renders and deploys on push to `main`; a weekly
Execution Audit workflow re-executes every cell from scratch.

**Companion material** (read-only, `git pull` before use):
`~/dl-course-code` — my Manim repo, whose per-module `MODULE_NOTES.md` files are
the polished lecture spines and the preferred drafting source; guide at
`docs/dl-course-code.md`. Course site repo:
`~/Library/CloudStorage/Box-Box/Teaching/6050/dl-course-site` (module pages already
link the book chapters).

---
