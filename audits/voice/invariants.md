# Invariants I1 to I16 (Stage A)

Baseline `86ec60b`; pilot pages: Chapters 1, 6, 13, 17 and the test-time-regression
interlude. Source invariants compare each file with the baseline revision; rendered
invariants compare the baseline HTML snapshot with the Phase 5 render. Interpretations
(I1 caption options, I4 cross-reference numerals, I6 link instances) are explained in
`decisions_pending.md`, section 2.

| ID | Invariant | Evidence (saved output) | Result |
|---|---|---|---|
| I1 | Code cells identical per file, in order (caption and alt option lines masked) | `invariants_pilot` | I1   PASS  code cells byte-identical (caption/alt options masked) [chapters/part1/01-linear-regression.qmd: 1 cell(s) changed only in caption/alt options; chapters/part1/06-generalization-inductive-bias.qmd: 1 cell(s) changed only in caption/alt options; chapters/part4/13-attention.qmd: 1 cell(s) changed only in caption/alt options; chapters/part5/17-peft-quantization.qmd: 1 cell(s) changed only in caption/alt options] |
| I2 | Frozen outputs: every stdout block identical, HTML and TeX | `frozen_stdout` | PASS: 136 stdout blocks satisfy the book-wide HEAD exact snapshot across 27 baseline units; 27 HTML/TeX pairs match; 0 reviewed portability deviations |
| I3 | Math multiset per file identical | `invariants_pilot` | I3   PASS  math multiset identical per file |
| I4 | Numeric tokens in classes A to E identical (cross-reference numerals excluded) | `invariants_pilot` | I4   PASS  numeric tokens identical in classes A to E (cross-reference numerals excluded) |
| I5 | Anchor ids and labels identical; 10 protected anchors and 5 bounded pointers intact | `invariants_pilot + public_anchors` | I5   PASS  anchor ids and labels identical; cross-volume pointer lines byte-identical / public anchors (source): pass (10 interfaces) / public anchors (source + rendered HTML): pass (10 interfaces) |
| I6 | Link instances identical per target (declared S2 collapses excepted) | `invariants_pilot` | I6   PASS  link instances identical per target (declared S2 collapses excepted) |
| I7 | Heading sequence and levels identical except recap text (R1) | `invariants_pilot` | I7   PASS  heading sequence and levels identical (recap text under R1) [chapters/part1/01-linear-regression.qmd: recap heading 'Okay, so: what did we just build?' -> 'Okay, so: the smallest model tells the whole story'; chapters/part1/06-generalization-inductive-bias.qmd: recap heading 'Okay, so: the lesson of Part I' -> 'Okay, so: the missing ingredient is inductive bias'] |
| I8 | Figure files and references identical; alt text only under R6 | `invariants_pilot` | I8   PASS  figure references and alt text identical (alt text only under R6) |
| I9 | Exercises: book-wide count, tags, task text | `invariants_book` | I9   PASS  exercise text and tags identical / I9   PASS  exercise count over checked files 151 -> 151 |
| I10 | Sources identical | `invariants_pilot` | I10  PASS  Sources identical |
| I11 | Plan steps byte-identical; regenerated notebooks byte-identical to the baseline export | `invariants_pilot` | I11  PASS  Plan step text byte-identical / I11  PASS  23 of 26 regenerated notebooks byte-identical; 3 differ only in cell source_line metadata (06-generalization-inductive-bias.ipynb, 13-attention.ipynb, 17-peft-quantization.ipynb), with every cell source, plan step, and code line identical |
| I12 | Class A words per page within -8% and +5% | `invariants_pilot` | I12  PASS  01-linear-regression 2563->2571 (+0.3%); 06-generalization-inductive-bias 2407->2478 (+2.9%); 13-attention 2198->2193 (-0.2%); attention-as-test-time-regression 1387->1399 (+0.9%); 17-peft-quantization 3299->3343 (+1.3%) |
| I13 | Existing CI audits pass; no new HTML render warnings; both PDFs render | `several (below)` | see the I13 table |
| I14 | Voice lint: zero blocking violations on pages in scope | `voice_check` | PASS: book voice register rules R1 to R6 hold on 5 page(s) in VOICE_SCOPE; 54 density-band warning(s) (non-blocking) |
| I15 | Cross-volume references identical | `invariants_book` | I15  PASS  cross-volume references identical |
| I16 | Zero em dashes in classes A to F, H, and headings (D6 exceptions listed) | `invariants_pilot + voice_check` | I16  PASS  em dashes in classes A to F, H, T on checked pages: 01-linear-regression: 0 (0 exempt); 06-generalization-inductive-bias: 0 (0 exempt); 13-attention: 0 (0 exempt); attention-as-test-time-regression: 0 (0 exempt); 17-peft-quantization: 0 (2 exempt) |

## I13 details

| audit | exit | last line |
|---|---:|---|
| `audit_plan_code.py` | 0 | PASS: 197 learner-visible Python surfaces use Plan → Code; 96 execution-only cells are exempt |
| `audit_book_contract.py` | 0 | PASS: 20 chapter retrieval/source contracts, canonical exercise tags, book voice and splice hygiene (with the VOICE.md register check wired into the rendered build), five prose-only part transitions, hidden display-only  |
| `audit_python_sources.py` | 0 | PASS: parsed 289 executable cells, 4 transclusions, and 25 Python modules/scripts; learner-visible lines are at most 88 columns and Chapter 15 remains self-contained |
| `audit_public_anchors.py` | 0 | public anchors (source): pass (10 interfaces) |
| `audit_public_anchors.py --rendered _book` | 0 | public anchors (source + rendered HTML): pass (10 interfaces) |
| `audit_excerpt_fixtures.py` | 0 | PASS: 41 mechanism excerpt(s) mirror 250 verbatim fixture literal(s) across 21 chapter(s), with 151 declared computed variant(s), current chapter digests in 35 receipt(s), live anchors, and one declared timeline each |
| `audit_frozen_stdout.py` | 0 | PASS: 136 stdout blocks satisfy the book-wide HEAD exact snapshot across 27 baseline units; 27 HTML/TeX pairs match; 0 reviewed portability deviations |
| `audit_html_assets.py _book` | 1 | FAILED: 0 Phase E/F source violation(s), 0 missing unique HTML support asset(s), 0 metadata/renderer violation(s), 0 navigation/disclosure violation(s), 0 rendered-content leak(s), and 0 image-alt violation(s), and 26 ca |
| `audit_pdf.py (print)` | 0 | PASS: PDF geometry, text layer, and retained LaTeX logs contain no print loss or missing glyphs |
| `audit_pdf.py (continuous)` | 0 | PASS: PDF geometry, text layer, and retained LaTeX logs contain no print loss or missing glyphs |
| `npm test --prefix scripts/html-tests` | 0 | ℹ tests 1972; ℹ pass 1972; ℹ fail 0 |
| `audit_voice_ledger.py --check` | 0 | PASS: book voice register rules R1 to R6 hold on 5 page(s) in VOICE_SCOPE; 54 density-band warning(s) (non-blocking) |

HTML render warnings: baseline and final render both report 26 `WARN` lines (all unresolved `notebooks/*.ipynb` links, which CI adds); the sorted lists are identical.

LaTeX health (retained `index.log` of each profile; pages from `pdfinfo`):

```
before
print: errors=0 warnings=9 overfull=423 underfull=54 pages=554
continuous: errors=0 warnings=10 overfull=423 underfull=54 pages=529
after
print: errors=0 warnings=9 overfull=423 underfull=54 pages=554
continuous: errors=0 warnings=10 overfull=423 underfull=54 pages=528
```

`audit_html_assets.py _book` reports the notebook download targets as missing locally, as it
does at baseline; CI adds the validated notebooks before that audit runs.

## Full outputs

### `invariants_pilot`

```
I1   PASS  code cells byte-identical (caption/alt options masked) [chapters/part1/01-linear-regression.qmd: 1 cell(s) changed only in caption/alt options; chapters/part1/06-generalization-inductive-bias.qmd: 1 cell(s) changed only in caption/alt options; chapters/part4/13-attention.qmd: 1 cell(s) changed only in caption/alt options; chapters/part5/17-peft-quantization.qmd: 1 cell(s) changed only in caption/alt options]
I3   PASS  math multiset identical per file
I4   PASS  numeric tokens identical in classes A to E (cross-reference numerals excluded)
I5   PASS  anchor ids and labels identical; cross-volume pointer lines byte-identical
I6   PASS  link instances identical per target (declared S2 collapses excepted)
I7   PASS  heading sequence and levels identical (recap text under R1) [chapters/part1/01-linear-regression.qmd: recap heading 'Okay, so: what did we just build?' -> 'Okay, so: the smallest model tells the whole story'; chapters/part1/06-generalization-inductive-bias.qmd: recap heading 'Okay, so: the lesson of Part I' -> 'Okay, so: the missing ingredient is inductive bias']
I8   PASS  figure references and alt text identical (alt text only under R6)
I9   PASS  exercise text and tags identical
I10  PASS  Sources identical
I11  PASS  Plan step text byte-identical
I15  PASS  cross-volume references identical
I9   PASS  exercise count over checked files 27 -> 27
I12  PASS  01-linear-regression 2563->2571 (+0.3%); 06-generalization-inductive-bias 2407->2478 (+2.9%); 13-attention 2198->2193 (-0.2%); attention-as-test-time-regression 1387->1399 (+0.9%); 17-peft-quantization 3299->3343 (+1.3%)
I16  PASS  em dashes in classes A to F, H, T on checked pages: 01-linear-regression: 0 (0 exempt); 06-generalization-inductive-bias: 0 (0 exempt); 13-attention: 0 (0 exempt); attention-as-test-time-regression: 0 (0 exempt); 17-peft-quantization: 0 (2 exempt)
I11  PASS  23 of 26 regenerated notebooks byte-identical; 3 differ only in cell source_line metadata (06-generalization-inductive-bias.ipynb, 13-attention.ipynb, 17-peft-quantization.ipynb), with every cell source, plan step, and code line identical
```

### `invariants_book`

```
I1   PASS  code cells byte-identical (caption/alt options masked) [chapters/part1/01-linear-regression.qmd: 1 cell(s) changed only in caption/alt options; chapters/part1/06-generalization-inductive-bias.qmd: 1 cell(s) changed only in caption/alt options; chapters/part4/13-attention.qmd: 1 cell(s) changed only in caption/alt options; chapters/part5/17-peft-quantization.qmd: 1 cell(s) changed only in caption/alt options]
I3   PASS  math multiset identical per file
I4   PASS  numeric tokens identical in classes A to E (cross-reference numerals excluded)
I5   PASS  anchor ids and labels identical; cross-volume pointer lines byte-identical
I6   PASS  link instances identical per target (declared S2 collapses excepted)
I7   PASS  heading sequence and levels identical (recap text under R1) [chapters/part1/01-linear-regression.qmd: recap heading 'Okay, so: what did we just build?' -> 'Okay, so: the smallest model tells the whole story'; chapters/part1/06-generalization-inductive-bias.qmd: recap heading 'Okay, so: the lesson of Part I' -> 'Okay, so: the missing ingredient is inductive bias']
I8   PASS  figure references and alt text identical (alt text only under R6)
I9   PASS  exercise text and tags identical
I10  PASS  Sources identical
I11  PASS  Plan step text byte-identical
I15  PASS  cross-volume references identical
I9   PASS  exercise count over checked files 151 -> 151
```

### `voice_check`

```
warning: chapters/interludes/attention-as-test-time-regression.qmd: reader_address_per1k 0.715 low (<2.56)
warning: chapters/interludes/attention-as-test-time-regression.qmd: metaphor_hits_per1k 2.144 low (<3.49)
warning: chapters/interludes/attention-as-test-time-regression.qmd: guards_A_per1k 5.004 high (>1.49)
warning: chapters/interludes/learning-by-experiment.qmd: reader_address_per1k 0.0 low (<2.56)
warning: chapters/interludes/learning-by-experiment.qmd: verdicts_per1k 0.738 low (<0.97)
warning: chapters/interludes/learning-by-experiment.qmd: metaphor_hits_per1k 1.845 low (<3.49)
warning: chapters/interludes/learning-by-experiment.qmd: guards_A_per1k 2.583 high (>1.49)
warning: chapters/interludes/making-pca-learnable.qmd: reader_address_per1k 0.0 low (<2.56)
warning: chapters/interludes/making-pca-learnable.qmd: guards_A_per1k 3.413 high (>1.49)
warning: chapters/part1/03-nonlinearity-mlp.qmd: chapter_refs_max_paragraph 3 high (>2)
warning: chapters/part1/04-training-loss-sgd.qmd: guards_A_per1k 1.997 high (>1.49)
warning: chapters/part1/04-training-loss-sgd.qmd: chapter_refs_opener 3 high (>2)
warning: chapters/part1/04-training-loss-sgd.qmd: chapter_refs_max_paragraph 3 high (>2)
warning: chapters/part1/05-backpropagation.qmd: metaphor_hits_per1k 3.046 low (<3.49)
warning: chapters/part1/06-generalization-inductive-bias.qmd: reader_address_per1k 1.614 low (<2.56)
warning: chapters/part1/06-generalization-inductive-bias.qmd: guards_A_per1k 2.018 high (>1.49)
warning: chapters/part2/07-filters-convolution.qmd: reader_address_per1k 0.0 low (<2.56)
warning: chapters/part2/08-cnn.qmd: metaphor_hits_per1k 2.554 low (<3.49)
warning: chapters/part2/08-cnn.qmd: guards_A_per1k 1.824 high (>1.49)
warning: chapters/part2/08-cnn.qmd: chapter_refs_A_per1k 11.31 high (>8.87)
warning: chapters/part2/08-cnn.qmd: chapter_refs_max_paragraph 3 high (>2)
warning: chapters/part2/09-modern-cnns-transfer.qmd: metaphor_hits_per1k 1.371 low (<3.49)
warning: chapters/part3/10-sequences-rnn.qmd: verdicts_per1k 0.928 low (<0.97)
warning: chapters/part3/10-sequences-rnn.qmd: metaphor_hits_per1k 1.546 low (<3.49)
warning: chapters/part3/10-sequences-rnn.qmd: guards_A_per1k 2.474 high (>1.49)
warning: chapters/part3/11-encoder-decoder.qmd: chapter_refs_max_paragraph 4 high (>2)
warning: chapters/part4/12-kernel-regression.qmd: reader_address_per1k 0.0 low (<2.56)
warning: chapters/part4/12-kernel-regression.qmd: metaphor_hits_per1k 0.699 low (<3.49)
warning: chapters/part4/13-attention.qmd: reader_address_per1k 0.912 low (<2.56)
warning: chapters/part4/13-attention.qmd: guards_A_per1k 1.824 high (>1.49)
warning: chapters/part4/13-attention.qmd: chapter_refs_A_per1k 10.488 high (>8.87)
warning: chapters/part4/14-self-attention-transformer.qmd: reader_address_per1k 0.0 low (<2.56)
warning: chapters/part4/14-self-attention-transformer.qmd: metaphor_hits_per1k 0.34 low (<3.49)
warning: chapters/part4/14-self-attention-transformer.qmd: guards_A_per1k 2.383 high (>1.49)
warning: chapters/part4/14-self-attention-transformer.qmd: chapter_refs_opener 3 high (>2)
warning: chapters/part4/15-bert-pretraining.qmd: reader_address_per1k 0.0 low (<2.56)
warning: chapters/part4/15-bert-pretraining.qmd: metaphor_hits_per1k 0.962 low (<3.49)
warning: chapters/part4/15-bert-pretraining.qmd: guards_A_per1k 4.171 high (>1.49)
warning: chapters/part4/15-bert-pretraining.qmd: chapter_refs_max_paragraph 3 high (>2)
warning: chapters/part4/16-vit-scaling.qmd: reader_address_per1k 0.0 low (<2.56)
warning: chapters/part4/16-vit-scaling.qmd: metaphor_hits_per1k 1.964 low (<3.49)
warning: chapters/part4/16-vit-scaling.qmd: guards_A_per1k 4.255 high (>1.49)
chapters/part5/17-peft-quantization.qmd: R5 exempt (quoted or cited) [E] …Turpin et al., Language Models Don’t Always Say What They Think: Unfaithful Explanations in Chai…
chapters/part5/17-peft-quantization.qmd: R5 exempt (quoted or cited) [E] …Greshake et al., Not What You’ve Signed Up For: Compromising Real-World LLM-Integrated Appli…
warning: chapters/part5/17-peft-quantization.qmd: reader_address_per1k 0.299 low (<2.56)
warning: chapters/part5/17-peft-quantization.qmd: metaphor_hits_per1k 1.197 low (<3.49)
warning: chapters/part5/17-peft-quantization.qmd: guards_A_per1k 3.59 high (>1.49)
warning: chapters/part5/18-alignment.qmd: reader_address_per1k 0.0 low (<2.56)
warning: chapters/part5/18-alignment.qmd: metaphor_hits_per1k 2.044 low (<3.49)
warning: chapters/part5/18-alignment.qmd: guards_A_per1k 5.109 high (>1.49)
warning: chapters/part5/18-alignment.qmd: chapter_refs_max_paragraph 3 high (>2)
warning: chapters/part5/19-generative.qmd: reader_address_per1k 0.0 low (<2.56)
warning: chapters/part5/19-generative.qmd: metaphor_hits_per1k 0.43 low (<3.49)
warning: chapters/part5/19-generative.qmd: guards_A_per1k 2.582 high (>1.49)
warning: chapters/part5/20-multimodal.qmd: reader_address_per1k 0.0 low (<2.56)
warning: chapters/part5/20-multimodal.qmd: metaphor_hits_per1k 0.0 low (<3.49)
PASS: book voice register rules R1 to R6 hold on 5 page(s) in VOICE_SCOPE; 54 density-band warning(s) (non-blocking)
```

### `frozen_stdout`

```
PASS: 136 stdout blocks satisfy the book-wide HEAD exact snapshot across 27 baseline units; 27 HTML/TeX pairs match; 0 reviewed portability deviations
```

### `export_notebooks`

```
notebook contract: notebooks=26, visible_surfaces=196, hidden_cells=94, included_surfaces=4, nonexecutable_listings=1
exported 01-linear-regression: 9 surfaces
exported 02-logistic-softmax: 6 surfaces
exported 03-nonlinearity-mlp: 8 surfaces
exported 04-training-loss-sgd: 5 surfaces
exported 05-backpropagation: 11 surfaces
exported 06-generalization-inductive-bias: 11 surfaces
exported learning-by-experiment: 3 surfaces
exported 07-filters-convolution: 5 surfaces
exported 08-cnn: 13 surfaces
exported 09-modern-cnns-transfer: 15 surfaces
exported making-pca-learnable: 3 surfaces
exported 10-sequences-rnn: 11 surfaces
exported 11-encoder-decoder: 9 surfaces
exported 12-kernel-regression: 5 surfaces
exported 13-attention: 7 surfaces
exported 14-self-attention-transformer: 15 surfaces
exported attention-as-test-time-regression: 4 surfaces
exported 15-bert-pretraining: 7 surfaces
exported 16-vit-scaling: 13 surfaces
exported 17-peft-quantization: 3 surfaces
exported 18-alignment: 6 surfaces
exported 19-generative: 5 surfaces
exported 20-multimodal: 4 surfaces
exported a1-linear-algebra: 5 surfaces
exported a2-tensors: 7 surfaces
exported a3-precision-performance: 6 surfaces
```

