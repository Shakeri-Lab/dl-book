
# Post-v1.1 main — Chapter 1 and universal code-surface revision (July 2026)

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
(ch. 10); seven predict-before-run prompts; two provenance footnotes (RMSProp's
Lecture-6e lineage, weights-as-images); digit-embedding (Audit.) exercise
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
