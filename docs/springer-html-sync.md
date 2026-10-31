# Springer–HTML language synchronization

This October 31, 2026 change carries the current Springer manuscript’s shared language
into the interactive HTML companion. It starts from remote `main`
`bcab25a610d86049b087e71318e02ddead97585d`, verified on October 31; the published site at
the start of the work was `e223e64a940a11d5e8770873d553e326ba593079`. These revisions are
on `codex/springer-html-language-sync` and have not been deployed. The saved Springer
PDF predates the latest source edits, so the comparison uses the current TeX source.
The commit identifiers and source hashes are recorded in the
[Springer snapshot](../audits/springer-sync-2026-10-31/springer-source-snapshot.json).

The manuscript governs shared wording. HTML retains executable evidence, interactive
plots and additional teaching material. Matching this repository’s HTML and TeX
execution freezes does not synchronize the independently edited Springer manuscript.
See [Format Authority](style-guide.md#format-authority) for the current maintenance rule.

## Disposition of the 21 audit findings

Springer paths below are relative to the separate manuscript repository. HTML paths are
relative to this repository; their filename numbers need not match printed chapter numbers.
“Carried” refers to source and corresponding cached prose, not deployment.

### Authority and shared language

| ID | Springer source | HTML destination | Disposition |
|---|---|---|---|
| D01 | Current author instruction | `index.qmd`; `docs/style-guide.md`, `CLAUDE.md`, `VOICE.md`, continuation docs and README | Springer governs shared language; executable output remains numerical evidence. Historical HTML-first instructions are explicitly superseded. |
| L01 | `book/frontmatter/preface.tex` | `index.qmd` | Current opener and feature-map explanation carried; web reading instructions retained. The former Q10 exception is superseded. |
| L02 | `book/part1/ch04.tex` | `chapters/part1/04-training-loss-sgd.qmd`; `interactives/momentum-memory/` | Admissible momentum range `0 ≤ β < 1` carried; replay settings remain separately identified as illustrative. |
| L03 | `book/part1/ch04.tex` | `chapters/part1/04-training-loss-sgd.qmd`; `interactives/sgd-zones/` | Stochastic-fluctuations terminology carried across prose, plotted labels, exercise, replay and transcript. |
| L04 | `book/part1/ch05.tex` | `chapters/part1/05-backpropagation.qmd` | ReLU mean-square bridge and symmetry/zero-mean-weight assumptions carried. |
| L05 | `book/part1/ch05.tex` | `chapters/part1/05-backpropagation.qmd`; `interactives/derivative-gates/`, `interactives/one-chain/` | Loss derivatives and local activation derivatives distinguished in prose, comments, diagrams and replay; internal IDs retained. |
| L06 | `book/part2/ch10.tex` | `chapters/part2/09-modern-cnns-transfer.qmd`; `interactives/batch-ruler/` | Convolutional BatchNorm observation axes carried; replay explicitly uses one value per image in one channel. |
| L07 | `book/part2/ch11.tex` | `chapters/interludes/making-pca-learnable.qmd`; `interactives/same-subspace/` | “Same subspace, different coordinates” carried; old heading anchor retained. The print companion’s older heading quotation is untouched. |
| L08 | `book/part2/ch11.tex` | `chapters/interludes/making-pca-learnable.qmd` | Kernel-size explanation added beside the decoder shape table, scoped to its stride, padding and dilation. |
| L09 | `book/part4/ch14.tex` | `chapters/part4/12-kernel-regression.qmd` | OLS “coefficients” carried into the Plan and inactive summary; internal variables and existing printed output retained. |
| L10 | `book/part2/part.tex` | `chapters/parts/p2-vision.qmd` | “Convolutions combine features across channels” carried. |
| L11 | `book/part3/part.tex` | `chapters/parts/p3-sequences.qmd` | Incremental-computation scope, teacher-forcing qualifier and single-state-handoff wording carried. |
| L12 | `book/frontmatter/preface.tex` | `index.qmd` | Laptop teaching experiments distinguished from full-data GPU studies; online-archive wording qualified to the available run records and outputs. |
| L13 | `book/part5/epilogue.tex` | `chapters/epilogue.qmd` | Current recurrence rationale and positional-representation wording carried; HTML’s additive LSTM cell-state explanation retained as companion detail. |
| L14 | `book/part4/ch17.tex` | `chapters/interludes/attention-as-test-time-regression.qmd` | Lower-load tradeoff and paired uncertainty carried beside the existing results. |
| L15 | `book/part4/ch16.tex` | `chapters/part4/14-self-attention-transformer.qmd` | Causal hedge and proposed unordered-multiset control carried; historical Q12/N25-1 hold superseded. |

### Companion navigation, promised material and notation

| ID | Springer source | HTML destination | Disposition |
|---|---|---|---|
| C01 | Companion lists across the manuscript; first example `book/part1/ch01.tex` | First example `chapters/part1/01-linear-regression.qmd`; all destinations in `data/print-companions.json` | Shared ledger supplies visible, searchable printed identifiers at existing targets: 200 active entries, comprising 147 Experiments and 53 Animations across 27 pages. Commented draft entries are excluded. |
| C02 | `book/part2/ch10.tex` | `chapters/part2/09-modern-cnns-transfer.qmd` | Full-data transfer recipe added from the pinned `experiments/rivanna/fashion_transfer.py` implementation, launcher and archived records; no new training. |
| C03 | `book/part1/ch04.tex` | `chapters/part1/04-training-loss-sgd.qmd`, cell `fig-race` | Comparison now prints least-squares loss and optimizer losses after 40 and 120 updates; disputed “about 40 steps” interpretation not copied. |
| C04 | `book/part4/ch16.tex` | `chapters/part4/13-attention.qmd` and `chapters/part4/14-self-attention-transformer.qmd` | HTML navigation repaired; Springer generic pointer unchanged. The Transformer page’s generated companion list includes the items located on the Attention page. |
| I01 | `book/part1/ch04.tex`; `book/part2/ch10.tex`; `book/part5/ch20.tex`; `book/part5/ch22.tex` | `interactives/momentum-memory/`, `step-length/`, `identity-lane/`, `quantization-grid/`, `score-field/` (each `panel.html`, plus relevant players) | Displayed learning rate `η`, residual sum `u`, quantization limit `q_max` and mixture scale `σ` aligned across formulas, labels and accessibility text. Internal variables and numeric fixtures retained; gate-product’s valid `L` unchanged. |

The navigation ledger records manuscript source paths, line numbers and hashes in
[data/print-companions.json](../data/print-companions.json). It is a destination mapping,
not an automatic conversion of manuscript prose. The labels and cross-page chapter list
are generated by [print_companions.py](../scripts/print_companions.py).

## Print-side issues deliberately left untouched

- **Optimizer timing:** `book/part1/ch04.tex` says momentum and Adam reach the floor
  after about 40 steps. The new `fig-race` diagnostic in
  [04-training-loss-sgd.qmd](../chapters/part1/04-training-loss-sgd.qmd) gives a
  least-squares loss of **0.0103**. At update 40, momentum is **0.1333** and Adam
  **0.0106**; at update 120, they are **0.0105** and **0.0104**. The actual output is
  recorded in [frozen-evidence-check.json](../audits/springer-sync-2026-10-31/frozen-evidence-check.json).
  HTML reports these diagnostics without importing the disputed timing assertion.
- **Score-mixture notation:** `book/part5/ch22.tex:592,596–600` uses `σ` in the
  equations, while its caption at lines 611–612 retains `s`. The HTML panel follows
  the shared equation; the inconsistent print caption awaits a manuscript edit.
- **Checkpoint archive promise:** `book/frontmatter/preface.tex:160–161` promises
  archived checkpoints online. The full-data study scripts retain selected states
  in memory and write result records, without serializing trained checkpoints.
  [fashion_transfer.py](../experiments/rivanna/fashion_transfer.py) and the
  [study README](../experiments/rivanna/README.md) support the narrower HTML wording,
  “archived run records and outputs.” No public trained-checkpoint archive was established.
- **Existing print pointers:** C04’s generic chapter URL and L07’s older quoted
  heading remain in Springer; working individual links and HTML navigation are preserved.

No Springer source was edited. The
[snapshot](../audits/springer-sync-2026-10-31/springer-source-snapshot.json) records
**119 source files** and verifies that all their hashes are unchanged.

## Preservation and cache method

The HTML-only RLHF chapter and the epilogue’s test-time-control/Riccati material are
preserved. Existing explicit section/cell IDs and panel IDs remain, including the PCA
heading’s legacy anchor. All 53 interactive scene IDs and their numerical fixtures are
retained. Wording changes also cover transcripts and accessible labels.

The [refresh record](../audits/springer-sync-2026-10-31/freeze-refresh.json) covers
**16 execution JSON files: paired HTML/TeX caches for eight chapters**. Cached prose
and code display were refreshed against the changed QMD; unrelated committed outputs
were retained. Four figure cells (`fig-sgd-zones`, `fig-race`, `fig-delta-pullback`,
`fig-gates`) and their minimal dependencies were executed to regenerate native PNG/PDF
assets and the new optimizer diagnostic. This was not a full-chapter or full-book
execution, and it did not rerun the archived GPU studies.

The [frozen-output comparison](../audits/springer-sync-2026-10-31/frozen-evidence-check.json)
records **137 original stdout blocks and one display result unchanged**, with one new
stdout block from `fig-race`. The
[selected-cell comparison](../audits/springer-sync-2026-10-31/selected-cell-numerics.json)
records **38 numeric arrays/state comparisons, all bit-exact** against the base under
the recorded interpreter and seeds. Preserved outputs and selected-cell checks have
different scopes; neither establishes a complete experimental rerun.

## Final validation

The [validation record](../audits/springer-sync-2026-10-31/validation.json) records:

- All 2,513 JavaScript interaction tests and 27 companion unit tests pass.
- Source, anchor, fixture, chapter-number and Plan-to-Code contracts pass.
- Quarto 1.10.18 renders the complete HTML site; all 36 pages pass asset, metadata,
  accessibility and navigation checks. The voice-register check passes.
- All 200 companion labels and direct search destinations resolve. At desktop and
  phone widths, all labels remain visible with disclosures closed, all 53 scenes
  load, and all ten changed scenes retain working playback controls. Figures and
  tables remain visible with their code closed; no page overflows horizontally.
- [Cache fidelity](../audits/springer-sync-2026-10-31/cache-fidelity.json) verifies
  source hashes, inter-cell prose and visible code summaries in both refreshed
  formats. The unchanged optimizer PDF is retained byte-for-byte after confirming
  that its fresh execution differed only in the creation-date metadata.

The local HTML asset check permits missing generated notebook downloads; publication
CI supplies those separately after clean execution. All 26 public notebook and internal
reference source exports pass their structure and commit-pin checks at source revision
`827622d3264d73eb75b5728a3615e04144578a5d`. No full notebook execution, GPU rerun, Springer
rebuild, merge or deployment is claimed by this local validation.
