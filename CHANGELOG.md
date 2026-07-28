
# Post-v1.1 main — book-wide audit and revision (July 2026)

Editorial and structure: repaired text-mode mathematical glyphs, established one
closing retrieval check per numbered chapter, removed off-page lecture narration,
standardized the three exercise modes, and promoted attention-as-test-time-regression
to its own interlude. The Transformer, BERT, generative-model, and performance
chapters gained compact mechanism-first bridges and diagrams without adding a GPU
experiment.

Production: interludes use independent figure namespaces in HTML and PDF; the build
checks the PDF text layer and LaTeX log for missing glyphs; callout icons carry empty
accessible replacement text; and release metadata now identifies v1.1 as the stable
502-page edition while `main` remains a rolling post-release build.

Acceptance: 194 learner-visible Plan → Code surfaces and 92 execution-only
harnesses pass the strengthened audit; 282 executable cells, four transclusions,
and eleven included modules/scripts parse; all 133 pre-existing stdout blocks remain
byte-identical across the structural move and between HTML and TeX; and the complete
post-v1.1 book renders in 544 pages, below the prior 560-page ceiling.

## Earlier post-v1.1 work — Chapter 1 and universal code-surface revision

Editorial: Chapter 1 now carries one semantic colour contract across equations,
nearby prose, and conceptual diagrams; Figure 1.1's first-row annotation is
corrected; the early visualization loop is distinguished from the complete
three-way implementation; and the regularization close is ridge-only, with the
Lasso comparison and Figure 1.9 removed.

Code: all 201 learner-visible Plan → Code surfaces use compact bracket-only
markers (`# [1]`, including fused forms such as `# [2][5]`). The audit rejects
descriptive marker suffixes; the 28 `echo: false` execution-only cells remain
exempt.

Acceptance: all 229 executable cells/modules parse, the accepted 266 frozen
stdout blocks remain byte-identical, and the complete HTML/PDF render remains
536 pages.

## v1.1 — the readable-code and estimator-discipline release (July 2026)

Pedagogy: the learned-feature-space figure (ch. 3); the forget-gate diagnostic
(ch. 10); seven predict-before-run prompts; two provenance notes on RMSProp and
weights-as-images; digit-embedding (Audit.) exercise
(ch. 13); mixture-of-experts in the epilogue's roads-not-taken.

Code: the equation/kernel/harness contract with the five-part visibility test
(style guide); canonical listings as tested source — dlbook module with Listing
4.1 (fit_supervised) and Listings 10.1/10.2, printed once via include, imported
by chs. 6/8/14 which show only their deltas; pure-harness cells folded.

Estimator discipline: "What a batch may estimate — and what it may not"
(ch. 4, three cases); case-named reminders at chs. 11/15/18/19/20; the ch. 19
"Why this batches" bridge and two verified (Audit.) traps (the β·D_x reduction
identity; the aggregate-posterior Jensen bias, β-TC-VAE cited).

Infrastructure: weekly Execution Audit (from-scratch re-execution of every
cell); include-code-files vendored; docs/compatibility.md is the living home of
version-fragile engineering (Appendix B points there).

Acceptance: every refactored chapter verified content-bit-identical against its
pre-change build. Page count 502 vs v1.0's 498: Plan-v2 changes net ≈ −1 page
(folds and dedup paid for the new sections); the +4 traces to the six
author-commissioned conceptual figures that preceded the plan's ceiling.
