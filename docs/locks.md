# Chapter locks

Two writers work on the manuscript at once: the author on `main`, and the press program
on `press` (W2 and W3). A chapter the author is revising is locked for `press` from the
moment the author starts until the author's commit lands on `main`. While a chapter is
locked, `press` makes no edit to it and re-renders nothing of it; press work elsewhere
continues.

After each author chapter lands, `main` is merged into `press`. A conflicted freeze is
re-rendered, never text-merged: take the author's freeze, re-apply the press prose
changes (the frozen-Markdown refresh, verified by re-execution on the reference machine),
or re-execute the chapter there. The voice batches B2b to B3 wait until the press program
merges (the author's ruling 15, September 28, 2026).

| Chapter | File | Locked since | Released by |
|---|---|---|---|
| 15 | `chapters/part4/13-attention.qmd` | the merge of `press` into `main` (v1.4); ruling 13's pointer fix is the last press edit before it | the author's commit on `main` |

The first content commit on `main` after v1.4 returns the edition to rolling: set
`dlbook-edition-status` and `dlbook-html-edition-status` in `index.qmd` to `rolling`, bump
the `_quarto.yml` date and the `tex/macros.tex` date to match, and restore the "rolling
post-v1.4" wording of About this edition and the README, as after v1.3.

Add a row when the author starts a chapter; delete it when the commit lands and `main`
has been merged into `press`.
