
# Rolling post-v1.2.1 — quieter navigation and a free-PDF landing page (August 20, 2026)

The canonical HTML now starts ancillary surfaces closed: **About this edition**,
**Revision notes**, and the six root chapter groups. Quarto still opens the active
chapter's parent Part for orientation, while narrative tips, traps, and retrieval
checks remain visible. Collapsible callout headers and chapter groups are keyboard
operable, their controls carry specific accessible names, and a deep link opens the
disclosure containing its target.

The left sidebar now opens a cover-led PDF landing page directly below the book title,
with a depth-correct path from every nested chapter. Both the print and continuous
editions remain direct free downloads. The page states a $0 minimum, marks $20 as the
suggested optional contribution, and links that amount directly to Buy Me a Coffee.
It does not reproduce a redundant amount picker that cannot transfer the choice, and
support never gates either file. A small decorative coffee mark accompanies the
Preface support heading without adding assistive-text noise. These are HTML
presentation changes; both derived PDFs remain 536 and 513 pages with unchanged
manuscript content.

# Rolling post-v1.2.1 — PDF cover and open-book support (August 19, 2026)

Both derived PDF editions now open with the author-supplied cover. The artwork is a
presentation layer before the ordinary searchable title page and title verso; its
3:4 aspect ratio is preserved against a matching full-page background rather than
stretched to Letter proportions.

The end of the Preface now offers one optional way to support continued corrections,
new figures, and open releases. The contract is explicit in every format: the complete
book remains free to read and download at $0, contributions unlock no additional
content, and readers may contribute through one stable Buy Me a Coffee link.

The cover and support invitation repaginate the two-sided print PDF from 534 to 536
pages and the one-sided continuous-screen PDF from 511 to 513 pages. Both full
conversions pass the structural, cross-reference, geometry, text-layer, glyph,
accessibility, cover, and support-link audits; the canonical HTML passes its desktop
and phone-width responsive checks.

The clean-checkout publication path now self-updates TinyTeX before installing layout
packages and materializes committed frozen figures into Quarto's transient PDF
directories before each PDF profile. CI therefore no longer depends on ignored
workstation build residue. The Pages step publishes that audited bundle without a
second render.

# Rolling post-v1.2.1 — portable web identity and finishing pass (August 8, 2026)

The canonical HTML now carries a book favicon, a concise description, Open Graph and
Twitter-card metadata, a 1200×630 social card, and machine-readable citation fields on
every Quarto page. A branded `404.html` returns lost readers to the table of contents.
The MathJax URL is pinned exactly at 4.1.3, and the UVA link blue is darkened from
`#5379AA` to `#4A6E9D` so ordinary links clear WCAG AA on white. The landing-page
thesis line receives one restrained Rotunda-orange rule; the surrounding Cosmo/UVA
design remains unchanged.

The experiment interlude's tables now use the independent `EX.` namespace in both
formats, matching its figures. Each interactive Plan → Code panel remains closed at
first but adds an explicit **Show all code** control. Long prose-like stdout in
Chapters 14 and 20 wraps locally on narrow screens, while code retains horizontal
inspection. Two soft raster figures are re-exported at 1590×1215 and 1954×1368.
Public source lists no longer cite inaccessible instructor artifacts; hidden
provenance comments retain the audit trail. Dataset sources now receipt Fashion-MNIST,
ImageNet, SqueezeNet, and WikiText, and Appendix D records the recurring temperature
symbol alongside the book's other scalar knobs.

Acceptance: 194 learner-visible Plan → Code surfaces and 95 execution-only harnesses
pass; 285 executable cells, four transclusions, and thirteen modules/scripts parse;
all 133 frozen stdout blocks remain byte-identical. The complete canonical HTML and
both 0.85-inch PDF conversions pass structural, asset, cross-reference, text-layer,
glyph, geometry, and accessibility audits. The derived print PDF is 534 pages and the
continuous-screen PDF is 511 pages.

# Rolling post-v1.2.1 — interactive Plan → Code mapping (August 8, 2026)

The canonical HTML edition keeps each Plan visible while its Code region is closed.
Selecting a numbered plan item reveals the executed cell and highlights the source
region begun by its matching bracket-only marker; selecting it again or pressing
Escape closes the code. Mouse, Enter/Space, fused-marker, long-panel,
transcluded-listing, and narrow-screen paths share one implementation. Numbers,
focus, and an inset rule make the state legible without depending on colour.
The publication pipeline now renders the canonical HTML bundle after both derived
PDFs, then audits every page's local stylesheet and script references. This prevents
a PDF profile from pruning shared `site_libs` and leaving an otherwise valid website
unstyled.

Figure 9.1 is rebuilt from its TikZ source with a compact component grid, separate
block-to-stack connectors, and a residual skip confined to its own row. The SVG
scales fluidly at ordinary widths; below phone width a reusable wide-figure rule
classifies unusually wide artwork by intrinsic aspect ratio and preserves legible
labels inside a local, keyboard-accessible horizontal inspection strip while the
caption and page continue to reflow. The standalone TikZ builder now supplies the
Quarto-created counters and accessibility placeholders expected by the shared book
preamble. Both derived formats pass the geometry, text-layer, missing-character, and
accessibility checks.

Figure 1.9 now makes its middle panel a literal vertical slice through Panel A:
both retain output on the vertical axis, Panel A marks $x_0=0.65$, and Panel B replaces
cosmetic jitter with seeded prediction and fresh-outcome density profiles. Separate
dimension columns identify bias, prediction variance, and irreducible noise; the
caption states that the spread arrows show $\pm 1$ sample standard deviation while the
decomposition uses squared bias and variances.

Chapter 1 completes its semantic-colour pass across the dataset contract,
empirical/population risk, MSE residual, gradient update, Gaussian likelihood, ridge
objective, bias--variance decomposition, and linear-to-neuron bridge. Inputs remain
blue, learnable parameters orange, targets purple, predictions green, and
residuals/errors wine in both the equations and their immediate explanations. Long
numbered displays use authored breaks plus a phone-width size adjustment, with local
horizontal scrolling retained as the no-clipping fallback. The combined August 8
revision repaginates the derived print PDF from 530 to 534 pages; the later web
finishing pass leaves print unchanged and brings the continuous-screen PDF from 508
to 511 pages.

# Rolling post-v1.2.1 — statistical-learning coherence pass (August 6, 2026)

Appendix E, **Statistical Learning Contracts**, now gathers the probability and
estimation contracts already used across the manuscript: empirical versus population
risk, transformed and deployment distributions, likelihood-derived losses, the
Gaussian assumption and its limits, KL/Jensen--Shannon/Wasserstein comparisons,
Monte Carlo estimator cases, and uncertainty reporting. The appendix is a retrieval
layer, not a prerequisite; Chapters 1, 4, 6, and 18 remain self-contained and point
there only when the full audit chain is useful. Prince's *Understanding Deep Learning*
served as a reference-only completeness crosscheck; the exposition, examples, and
exercises remain independently authored.

Chapter 1 replaces the static bias--variance cartoon with a seeded three-panel
show-then-name experiment. Chapter 6 separates representation, optimization, and
generalization claims before its failure demonstrations and strengthens its capacity
exercise with an evidence-boundary audit. Chapter 18 makes explicit that behavioral
alignment is one contract inside a broader ethics and governance assessment.

Acceptance: 194 learner-visible Plan → Code surfaces and 95 execution-only harnesses
pass; 285 executable cells, four transclusions, and thirteen included modules/scripts
parse; all 133 frozen stdout blocks remain byte-identical. The canonical HTML has no
page-level overflow at a 390-pixel viewport. At the shared 0.85-inch margin, the
derived print PDF is 530 pages and the continuous-screen PDF is 508 pages.

# Rolling post-v1.2.1 — compact PDF editions (August 5, 2026)

Both derived PDF editions now use a uniform 0.85-inch margin, reduced from 1.1
inches. The default two-sided print PDF repaginates from 560 to 524 pages. A new
one-sided, open-any continuous-screen PDF establishes a 539-page old-margin baseline
and repaginates to 502 pages at the shared 0.85-inch margin. HTML and manuscript
content are unchanged.

The continuous profile has its own output filename and is rendered, audited, and
published beside the print PDF. The PDF geometry audit now reads the configured
uniform margin rather than hard-coding the former text edge. Both editions retain
the three-pass LaTeX, outline, cross-reference, text-layer, missing-character,
media-box, and accessible-icon gates. Plan boxes use a locally scoped line-breaking
opportunity after underscores so long helper names wrap inside the text block rather
than crowding the physical page edge.

# Rolling post-v1.2.1 — print hardening (August 2, 2026)

The derived PDF now wraps long learner-visible code and frozen stdout instead of
silently placing glyphs beyond the paper edge. Visible Python is also guarded at 88
columns, while pure execution harnesses and Quarto directives remain exempt. A new
geometry audit treats any text outside the media box as a release failure and reports
smaller text-block intrusions for visual review.

Three LaTeX passes are now the minimum for the full print conversion. The PDF audit
checks late-book outline destinations and unit namespaces, preventing stale Chapter 20
and epilogue pagination from shipping. The rolling title page identifies the build,
and the title verso records copyright, licenses, the canonical HTML edition, stable
citation guidance, and the UVA affiliation.

The same pass repairs the literal RNN cross-reference token, the Chapter 17 page-break
orphan, and the remaining `minibatch`, `color`, and `log-likelihood` terminology
stragglers. All 133 frozen stdout blocks remain byte-identical. The complete derived
PDF is 560 pages and contains no off-paper text or missing glyphs.

# v1.2.1 — reciprocal companion interface (August 2, 2026)

This point release establishes the cross-book contract with *Deep Learning: Making It
Trainable*. Ten public chapter anchors are declared in `docs/public-anchors.md` and
checked in both source and rendered HTML. Five bounded forward pointers separate the
first-course mechanics owned here—precision/performance, experiment discipline,
backpropagation, normalization, and attention/Transformer assembly—from their graduate
diagnostic continuations. The colophons now point in both directions.

# v1.2 — comprehensive audit and convention parity (July 29, 2026)

Editorial and structure: repaired text-mode mathematical glyphs, established one
closing retrieval check per numbered chapter, removed off-page lecture narration,
standardized the three exercise modes, and promoted attention-as-test-time-regression
to its own interlude. The Transformer, BERT, generative-model, and performance
chapters gained compact mechanism-first bridges and diagrams without adding a GPU
experiment.

Production: interludes use independent figure namespaces in HTML and PDF; the build
checks the PDF text layer and LaTeX log for missing glyphs; callout icons carry empty
accessible replacement text; and release metadata identifies v1.2 as the stable
552-page edition while `main` becomes a rolling post-release build. A follow-on
Chapter 15 editorial pass removes remaining off-page/session splice residue, adds a
strict leak-vocabulary tripwire, clarifies the original GRU gate convention, and adds
the controlled-lab schematic plus the three-family visibility triptych.

The July 29 closeout gives the epilogue its own `E.` figure namespace, states
explicitly that HTML is canonical and PDF is its derived print conversion, restores
the original RMSProp slide-deck provenance, and makes every interlude both visibly
named and retrieval-complete. A twelve-item exercise-bank review adds ten genuinely
new exercises and strengthens two existing ones across Chapters 3, 5, 6, 9, 11, 12,
15, 16, and 19 plus the experiment interlude.

The final July 29 receipt-and-callback follow-up extends Sources coverage through the
epilogue, grounding its test-time-control and mixture-of-experts claims in their
primary papers, and voices the book's learnability question explicitly in Part III:
recurrence makes the carried summary learnable.

The Chapter 20 deep pass closes the book's temperature arc. A compact bridge now
connects Chapter 12's bandwidth, Chapter 13's similarity scale, and CLIP's learned
logit scale; a three-part exercise derives the scale gradient, runs a paired
fixed-versus-learned comparison, and separates training sharpness from post-hoc
calibration. The source note distinguishes the cap reported in the CLIP paper from
the uncapped released reference implementation.

The closing Part II certification finds no mathematical defects in Chapters 7–9
and repairs Chapter 9's two remaining splice typos. An independent source-level
re-execution reproduces every printed Chapter 15 lab value; CI now preserves that
lab's self-contained design by rejecting repository-local imports or transclusions.

The release polish restores Chapter 16's already-authored post-hoc temperature
calibration exercise to both frozen editions, leaves epilogue equations unnumbered,
and standardizes `minibatch` and `feedforward` in authorial prose while preserving
exact paper titles and code identifiers. A targeted PDF regression check protects
the searchable text beneath the intentionally nonsensical no-position Transformer
sample on page 316.

Acceptance: 194 learner-visible Plan → Code surfaces and 94 execution-only
harnesses pass the strengthened audit; 284 executable cells, four transclusions,
and eleven included modules/scripts parse; all 133 pre-existing stdout blocks remain
byte-identical across the structural move and between HTML and TeX; and the complete
v1.2 book renders in 552 pages, below the prior 560-page ceiling.

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
