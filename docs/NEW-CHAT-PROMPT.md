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
`https://shakeri-lab.github.io/dl-book/Deep-Learning--Making-It-Learnable.pdf`.
Current stable release **v1.1** is 502 pages. The post-release `main` revision is
a 544-page rolling build after the universal Plan → Code pass, two Chapter 1 revisions,
the pacing/visual/full-scale experiment pass, and the July 28 comprehensive
book audit. It contains chapters 1–20 plus three interludes, four appendices,
and an epilogue. Nothing is mid-flight.

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
- **Interlude numbering is independent.** Experiment, autoencoder, and test-time-
  regression figures use `EX.`, `AE.`, and `TTR.` namespaces in both formats;
  interlude display equations remain unnumbered.
- **PDF glyph hygiene is enforced.** Greek and relation symbols belong in math mode;
  code elisions are ASCII; the publish job audits LaTeX missing-character warnings,
  NUL/U+FFFD extraction, and decorative icon text.
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
