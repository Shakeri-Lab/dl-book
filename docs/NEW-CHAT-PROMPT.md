# Bootstrap prompt for a fresh chat session

Paste everything between the rules into a new Claude Code session started in
`/Users/setup/dl-book`. It orients the agent, pins the non-negotiables, and stops
it from editing before you have said what you want done.

Keep this file current: if a rule changes or the state moves, edit the prompt here
rather than re-deriving it in chat.

---

I'm Heman Shakeri (UVA School of Data Science). You're helping me with my
deep-learning textbook, **_Deep Learning: Making It Learnable_** — a Quarto book
rendering to HTML + PDF, the course text for DS 6050.

**Repo:** `/Users/setup/dl-book` (local disk — never move it into Box; Box I/O
breaks builds). Remote `https://github.com/Shakeri-Lab/dl-book`, live at
`https://shakeri-lab.github.io/dl-book/`, PDF at
`https://shakeri-lab.github.io/dl-book/Deep-Learning--Making-It-Learnable.pdf`.
Current release **v1.1** — 502 pages, chapters 1–20 plus two interludes, four
appendices, and an epilogue. Nothing is mid-flight.

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
  tested source in `code/dlbook/` shown via `include=`. Never retype an "essence"
  version of real code.
- **Freeze discipline.** Any prose edit invalidates that chapter's freeze cache.
  Re-render the chapter with **no `--to` flag** (both formats), then the project —
  otherwise the PDF ships stale. Renders are slow: a heavy chapter is 20–40
  minutes, the full book about 40. Run them in the background and keep working.
- **Refactors must be content-bit-identical** on the frozen stdout. Snapshot the
  `cell-output-stdout` blocks from
  `_freeze/<chapter>/execute-results/html.json`, re-render, and diff.
- **Pre-test every experiment** before writing prose about its numbers, and put
  only measured numbers in captions.

**Environment:** `cd /Users/setup/dl-book && source .venv/bin/activate` (on a machine that has never built the book, `docs/NEW-MACHINE-SETUP.md` sets it up from bare); Quarto at
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
