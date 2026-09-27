# Invariants I1 to I19 (Stage B2a)

Baseline `86ec60b`; pages checked: every page edited since the baseline (Chapters 1, 5, 6,
7, 8, 9, 10, 11, 13, 17, and the PCA and test-time-regression interludes). Source
invariants compare each file with the baseline revision; rendered invariants compare the
baseline HTML snapshot with the B2a render. Earlier versions: `invariants.md` (Stage A)
and `invariants_b1.md` (B1).

| ID | Invariant | Evidence (saved output) | Result |
|---|---|---|---|
| I1 | Code cells identical per file, in order (caption and alt option lines masked) | `invariants_pages` | I1   PASS  code cells byte-identical (caption/alt options masked) [chapters/part1/06-generalization-inductive-bias.qmd: 1 cell(s) changed only in caption/alt options; chapters/part3/11-encoder-decoder.qmd: 1 cell(s) changed only in caption/alt options; chapters/part5/17-peft-quantization.qmd: 2 cell(s) changed only in caption/alt options] |
| I2 | Frozen outputs: every stdout block identical, HTML and TeX | `frozen_stdout` | PASS: 136 stdout blocks satisfy the book-wide HEAD exact snapshot across 27 baseline units; 27 HTML/TeX pairs match; 0 reviewed portability deviations |
| I3 | Math multiset per file identical | `invariants_pages` | I3   PASS  math multiset identical per file [chapters/part2/09-modern-cnns-transfer.qmd: declared math additions {'$5 \\times 5$': 1, '$3 \\times 3$': 1}] |
| I4 | Numeric tokens in classes A to E identical (cross-reference numerals excluded) | `invariants_pages` | I4   PASS  numeric tokens identical in classes A to E (cross-reference numerals excluded) |
| I5 | Anchor ids and labels identical; protected anchors and bounded pointers intact | `invariants_pages + public_anchors` | I5   PASS  anchor ids and labels identical; cross-volume pointer lines byte-identical / public anchors (source): pass (10 interfaces) / public anchors (source + rendered HTML): pass (10 interfaces) |
| I6 | Link instances identical per target (declared collapses and additions excepted) | `invariants_pages` | I6   PASS  link instances identical per target (declared S2 collapses excepted) |
| I7 | Heading sequence and levels identical except recap text and mechanical rules | `invariants_pages` | I7   PASS  heading sequence and levels identical (recap text under R1) [chapters/part1/01-linear-regression.qmd: recap heading 'Okay, so: what did we just build?' -> 'Okay, so: the smallest model tells the whole story'; chapters/part1/06-generalization-inductive-bias.qmd: recap heading 'Okay, so: the lesson of Part I' -> 'Okay, so: the missing ingredient is inductive bias'; chapters/part2/09-modern-cnns-transfer.qmd: R5 heading "BN is two different machines: tell PyTorch which one you're running" -> 'BN is two different machines: tell PyTorch which one you are running'] |
| I8 | Figure files and references identical; alt text only under R6 | `invariants_pages` | I8   PASS  figure references and alt text identical (alt text only under R6) |
| I9 | Exercises: book-wide count, tags, task text | `invariants_pages + invariants_book` | I9   PASS  exercise text and tags identical / I9   PASS  exercise count over checked files 67 -> 67 / I9   PASS  exercise text and tags identical / I9   PASS  exercise count over checked files 151 -> 151 |
| I10 | Sources identical | `invariants_pages` | I10  PASS  Sources identical |
| I11 | Plan steps byte-identical; regenerated notebooks identical to the baseline export | `invariants_pages` | I11  PASS  Plan step text byte-identical / I11  PASS  19 of 26 regenerated notebooks byte-identical; 7 differ only in cell source_line metadata (06-generalization-inductive-bias.ipynb, 07-filters-convolution.ipynb, 08-cnn.ipynb, 09-modern-cnns-transfer.ipynb, 13-attention.ipynb, 17-peft-quantization.ipynb, making-pca-learnable.ipynb), with every cell source, plan step, and code line identical |
| I12 | Class A words per page within -8% and +5% | `invariants_pages` | I12  PASS  01-linear-regression 2563->2558 (-0.2%); 05-backpropagation 2626->2626 (+0.0%); 06-generalization-inductive-bias 2407->2441 (+1.4%); 07-filters-convolution 1179->1216 (+3.1%); 08-cnn 2741->2783 (+1.5%); 09-modern-cnns-transfer 2917->2934 (+0.6%); making-pca-learnable 1465->1511 (+3.1%); 10-sequences-rnn 3234->3235 (+0.0%); 11-encoder-decoder 2280->2281 (+0.0%); 13-attention 2198->2157 (-1.9%); attention-as-test-time-regression 1387->1365 (-1.6%); 17-peft-quantization 3299->3315 (+0.5%) |
| I13 | Existing CI audits pass; no new HTML render warnings; both PDFs render | `several (below)` | see the I13 table |
| I14 | Voice lint: zero blocking violations on pages in scope; V3 caps; I17 | `voice_check` | I17: 61 added sentence(s) on 10 page(s); 0 shared-phrasing or apparatus violation(s); V3 caps on added sentences one_caution 0/0, that_is_the_whole 0/0, by_the_end 1/2, you_will_be_able_to 0/1, in_one_sentence 0/0, is_the_whole 0/0; book totals (reported) one_caution 0, that_is_the_whole 0, by_the_end 3, you_will_be_able_to 0, in_one_sentence 3, is_the_whole 4 PASS: book voice register rules R1 to R6 hold on 10 page(s) in VOICE_SCOPE; 39 density-band warning(s) (non-blocking) |
| I15 | Cross-volume references identical | `invariants_book` | I15  PASS  cross-volume references identical |
| I16 | Zero em dashes in classes A to F, H, and headings (D6 exceptions listed) | `invariants_pages` | I16  PASS  em dashes in classes A to F, H, T on checked pages: 01-linear-regression: 0 (0 exempt); 05-backpropagation: 0 (0 exempt); 06-generalization-inductive-bias: 0 (0 exempt); 07-filters-convolution: 0 (0 exempt); 08-cnn: 0 (0 exempt); 09-modern-cnns-transfer: 0 (0 exempt); making-pca-learnable: 0 (0 exempt); 10-sequences-rnn: 0 (0 exempt); 11-encoder-decoder: 0 (0 exempt); 13-attention: 0 (0 exempt); attention-as-test-time-regression: 0 (0 exempt); 17-peft-quantization: 0 (2 exempt) |
| I17 | Added sentences share no four-word sequence and no opening across chapters | `invariants_pages + voice_check` | I17  PASS  61 added sentences on 10 page(s); no shared four-word sequence across chapters, no shared promise opening, no apparatus word |
| I18 | Concreteness: no rise in nominalizations or parentheses, no sentence growth above 15%, no link or book-question removal | `invariants_pages` | I18  PASS  67 changed paragraph group(s) on 12 page(s): no rise in nominalizations or parentheses, no mean-sentence growth above 15%, no link or book-question removal (new material, relocated caveats, and restorations exempt) |
| I19 | Printed numbers (report only): prose percentages and counts that no printout or caption on the page shows | `numbers.md` | report only: 120 numbers listed. (`numbers.md`) |

## I13 details

| audit | exit | last line |
|---|---:|---|
| `audit_plan_code.py` | 0 | PASS: 197 learner-visible Python surfaces use Plan → Code; 96 execution-only cells are exempt |
| `audit_book_contract.py` | 0 | PASS: 20 chapter retrieval/source contracts, canonical exercise tags, book voice and splice hygiene (with the VOICE.md register check wired into the rendered build), five prose-only part transitions, hidden display-only  |
| `audit_python_sources.py` | 0 | PASS: parsed 289 executable cells, 4 transclusions, and 25 Python modules/scripts; learner-visible lines are at most 88 columns and Chapter 15 remains self-contained |
| `audit_public_anchors.py` | 0 | public anchors (source): pass (10 interfaces) |
| `audit_public_anchors.py --rendered _book` | 0 | public anchors (source + rendered HTML): pass (10 interfaces) |
| `audit_excerpt_fixtures.py` | 0 (after refresh_excerpt_receipts.py; the first run's 18 stale hashes are in excerpt_fixtures_before_refresh.txt) | PASS: 41 mechanism excerpt(s) mirror 250 verbatim fixture literal(s) across 21 chapter(s), with 151 declared computed variant(s), current chapter digests in 35 receipt(s), live anchors, and one declared timeline each |
| `audit_frozen_stdout.py` | 0 | PASS: 136 stdout blocks satisfy the book-wide HEAD exact snapshot across 27 baseline units; 27 HTML/TeX pairs match; 0 reviewed portability deviations |
| `audit_html_assets.py _book --allow-missing-generated-notebooks` | 0 (with --allow-missing-generated-notebooks; without it, only the 26 CI-supplied notebooks were missing) | HTML support assets and metadata: pass (37 pages, 183 unique local stylesheets/scripts/icons, exact MathJax pin, searchable Plan-to-Code collapse, lazy math and non-first images, 35 direct source links with no global cod |
| `audit_pdf.py (print)` | 0 | PASS: PDF geometry, text layer, and retained LaTeX logs contain no print loss or missing glyphs |
| `audit_pdf.py (continuous)` | 0 | PASS: PDF geometry, text layer, and retained LaTeX logs contain no print loss or missing glyphs |
| `npm test --prefix scripts/html-tests` | 0 | ℹ tests 1972; ℹ pass 1972; ℹ fail 0 |
| `audit_voice_ledger.py --check` | 0 | PASS: book voice register rules R1 to R6 hold on 10 page(s) in VOICE_SCOPE; 39 density-band warning(s) (non-blocking) |

HTML render warnings: the baseline and B2a renders both report 26 `WARN` lines (all unresolved `notebooks/*.ipynb` links, which CI adds); the sorted lists are identical.

LaTeX health (retained `index.log` of each profile; pages from `pdfinfo`):

```
before
print: errors=0 warnings=9 overfull=423 underfull=54 pages=554
continuous: errors=0 warnings=10 overfull=423 underfull=54 pages=529
after
print: errors=0 warnings=9 overfull=423 underfull=54 pages=556
continuous: errors=0 warnings=10 overfull=423 underfull=54 pages=529
```

`audit_html_assets.py` ran with `--allow-missing-generated-notebooks`. Without the flag it
reports only the 26 notebook download targets as missing, as at baseline; CI adds the
validated notebooks before that audit runs. The first `audit_excerpt_fixtures.py` run found
18 replay receipts recording chapter hashes from before the B2 and B2a edits. No receipt
quotes any of the 198 replaced sentences, and every fixture literal is still verbatim, so
`scripts/refresh_excerpt_receipts.py` rewrote 20 hash rows (ten edited chapters; Chapter
5's rows return to their baseline bytes) and the audit passes.

## Full outputs

### `invariants_pages`

```
I1   PASS  code cells byte-identical (caption/alt options masked) [chapters/part1/06-generalization-inductive-bias.qmd: 1 cell(s) changed only in caption/alt options; chapters/part3/11-encoder-decoder.qmd: 1 cell(s) changed only in caption/alt options; chapters/part5/17-peft-quantization.qmd: 2 cell(s) changed only in caption/alt options]
I3   PASS  math multiset identical per file [chapters/part2/09-modern-cnns-transfer.qmd: declared math additions {'$5 \\times 5$': 1, '$3 \\times 3$': 1}]
I4   PASS  numeric tokens identical in classes A to E (cross-reference numerals excluded)
I5   PASS  anchor ids and labels identical; cross-volume pointer lines byte-identical
I6   PASS  link instances identical per target (declared S2 collapses excepted)
I7   PASS  heading sequence and levels identical (recap text under R1) [chapters/part1/01-linear-regression.qmd: recap heading 'Okay, so: what did we just build?' -> 'Okay, so: the smallest model tells the whole story'; chapters/part1/06-generalization-inductive-bias.qmd: recap heading 'Okay, so: the lesson of Part I' -> 'Okay, so: the missing ingredient is inductive bias'; chapters/part2/09-modern-cnns-transfer.qmd: R5 heading "BN is two different machines: tell PyTorch which one you're running" -> 'BN is two different machines: tell PyTorch which one you are running']
I8   PASS  figure references and alt text identical (alt text only under R6)
I9   PASS  exercise text and tags identical
I10  PASS  Sources identical
I11  PASS  Plan step text byte-identical
I15  PASS  cross-volume references identical
I9   PASS  exercise count over checked files 67 -> 67
I12  PASS  01-linear-regression 2563->2558 (-0.2%); 05-backpropagation 2626->2626 (+0.0%); 06-generalization-inductive-bias 2407->2441 (+1.4%); 07-filters-convolution 1179->1216 (+3.1%); 08-cnn 2741->2783 (+1.5%); 09-modern-cnns-transfer 2917->2934 (+0.6%); making-pca-learnable 1465->1511 (+3.1%); 10-sequences-rnn 3234->3235 (+0.0%); 11-encoder-decoder 2280->2281 (+0.0%); 13-attention 2198->2157 (-1.9%); attention-as-test-time-regression 1387->1365 (-1.6%); 17-peft-quantization 3299->3315 (+0.5%)
I16  PASS  em dashes in classes A to F, H, T on checked pages: 01-linear-regression: 0 (0 exempt); 05-backpropagation: 0 (0 exempt); 06-generalization-inductive-bias: 0 (0 exempt); 07-filters-convolution: 0 (0 exempt); 08-cnn: 0 (0 exempt); 09-modern-cnns-transfer: 0 (0 exempt); making-pca-learnable: 0 (0 exempt); 10-sequences-rnn: 0 (0 exempt); 11-encoder-decoder: 0 (0 exempt); 13-attention: 0 (0 exempt); attention-as-test-time-regression: 0 (0 exempt); 17-peft-quantization: 0 (2 exempt)
I11  PASS  19 of 26 regenerated notebooks byte-identical; 7 differ only in cell source_line metadata (06-generalization-inductive-bias.ipynb, 07-filters-convolution.ipynb, 08-cnn.ipynb, 09-modern-cnns-transfer.ipynb, 13-attention.ipynb, 17-peft-quantization.ipynb, making-pca-learnable.ipynb), with every cell source, plan step, and code line identical
I17  PASS  61 added sentences on 10 page(s); no shared four-word sequence across chapters, no shared promise opening, no apparatus word
I18  PASS  67 changed paragraph group(s) on 12 page(s): no rise in nominalizations or parentheses, no mean-sentence growth above 15%, no link or book-question removal (new material, relocated caveats, and restorations exempt)
```

### `invariants_book`

```
I1   PASS  code cells byte-identical (caption/alt options masked) [chapters/part1/06-generalization-inductive-bias.qmd: 1 cell(s) changed only in caption/alt options; chapters/part3/11-encoder-decoder.qmd: 1 cell(s) changed only in caption/alt options; chapters/part5/17-peft-quantization.qmd: 2 cell(s) changed only in caption/alt options]
I3   PASS  math multiset identical per file [chapters/part2/09-modern-cnns-transfer.qmd: declared math additions {'$5 \\times 5$': 1, '$3 \\times 3$': 1}]
I4   PASS  numeric tokens identical in classes A to E (cross-reference numerals excluded)
I5   PASS  anchor ids and labels identical; cross-volume pointer lines byte-identical
I6   PASS  link instances identical per target (declared S2 collapses excepted)
I7   PASS  heading sequence and levels identical (recap text under R1) [chapters/part1/01-linear-regression.qmd: recap heading 'Okay, so: what did we just build?' -> 'Okay, so: the smallest model tells the whole story'; chapters/part1/06-generalization-inductive-bias.qmd: recap heading 'Okay, so: the lesson of Part I' -> 'Okay, so: the missing ingredient is inductive bias'; chapters/part2/09-modern-cnns-transfer.qmd: R5 heading "BN is two different machines: tell PyTorch which one you're running" -> 'BN is two different machines: tell PyTorch which one you are running']
I8   PASS  figure references and alt text identical (alt text only under R6)
I9   PASS  exercise text and tags identical
I10  PASS  Sources identical
I11  PASS  Plan step text byte-identical
I15  PASS  cross-volume references identical
I9   PASS  exercise count over checked files 151 -> 151
I17  PASS  61 added sentences on 10 page(s); no shared four-word sequence across chapters, no shared promise opening, no apparatus word
I18  PASS  67 changed paragraph group(s) on 12 page(s): no rise in nominalizations or parentheses, no mean-sentence growth above 15%, no link or book-question removal (new material, relocated caveats, and restorations exempt)
```

### `voice_check`

```
warning: chapters/interludes/attention-as-test-time-regression.qmd: reader_address_total_per1k 0.733 low (<2.64)
warning: chapters/interludes/attention-as-test-time-regression.qmd: guards_A_per1k 5.128 high (>2.50)
warning: chapters/interludes/learning-by-experiment.qmd: reader_address_total_per1k 1.845 low (<2.64)
warning: chapters/interludes/learning-by-experiment.qmd: verdicts_per1k 0.738 low (<0.97)
warning: chapters/interludes/learning-by-experiment.qmd: guards_A_per1k 2.583 high (>2.50)
warning: chapters/interludes/making-pca-learnable.qmd: reader_address_total_per1k 0.662 low (<2.64)
warning: chapters/interludes/making-pca-learnable.qmd: guards_A_per1k 3.309 high (>2.50)
warning: chapters/part1/03-nonlinearity-mlp.qmd: chapter_refs_max_paragraph 3 high (>2)
warning: chapters/part1/04-training-loss-sgd.qmd: guards_A_per1k 1.997 high (>1.50)
warning: chapters/part1/04-training-loss-sgd.qmd: chapter_refs_opener 3 high (>2)
warning: chapters/part1/04-training-loss-sgd.qmd: chapter_refs_max_paragraph 3 high (>2)
warning: chapters/part1/06-generalization-inductive-bias.qmd: guards_A_per1k 2.048 high (>1.50)
warning: chapters/part2/07-filters-convolution.qmd: reader_address_total_per1k 0.822 low (<2.64)
warning: chapters/part2/08-cnn.qmd: guards_A_per1k 1.797 high (>1.50)
warning: chapters/part2/08-cnn.qmd: chapter_refs_A_per1k 11.139 high (>8.87)
warning: chapters/part2/08-cnn.qmd: chapter_refs_max_paragraph 3 high (>2)
warning: chapters/part3/10-sequences-rnn.qmd: verdicts_per1k 0.927 low (<0.97)
warning: chapters/part3/10-sequences-rnn.qmd: guards_A_per1k 2.473 high (>1.50)
warning: chapters/part3/11-encoder-decoder.qmd: chapter_refs_max_paragraph 4 high (>2)
warning: chapters/part4/12-kernel-regression.qmd: reader_address_total_per1k 2.096 low (<2.64)
warning: chapters/part4/12-kernel-regression.qmd: metaphor_hits_per1k 0.699 low (<3.49)
warning: chapters/part4/13-attention.qmd: reader_address_total_per1k 1.854 low (<2.64)
warning: chapters/part4/13-attention.qmd: chapter_refs_A_per1k 10.663 high (>8.87)
warning: chapters/part4/14-self-attention-transformer.qmd: reader_address_total_per1k 0.34 low (<2.64)
warning: chapters/part4/14-self-attention-transformer.qmd: metaphor_hits_per1k 2.723 low (<3.49)
warning: chapters/part4/14-self-attention-transformer.qmd: chapter_refs_opener 3 high (>2)
warning: chapters/part4/15-bert-pretraining.qmd: reader_address_total_per1k 0.321 low (<2.64)
warning: chapters/part4/15-bert-pretraining.qmd: guards_A_per1k 4.171 high (>2.50)
warning: chapters/part4/15-bert-pretraining.qmd: chapter_refs_max_paragraph 3 high (>2)
warning: chapters/part4/16-vit-scaling.qmd: reader_address_total_per1k 0.655 low (<2.64)
warning: chapters/part4/16-vit-scaling.qmd: guards_A_per1k 4.255 high (>2.50)
chapters/part5/17-peft-quantization.qmd: R5 exempt (quoted or cited) [E] …Turpin et al., Language Models Don’t Always Say What They Think: Unfaithful Explanations in Chai…
chapters/part5/17-peft-quantization.qmd: R5 exempt (quoted or cited) [E] …Greshake et al., Not What You’ve Signed Up For: Compromising Real-World LLM-Integrated Appli…
warning: chapters/part5/17-peft-quantization.qmd: reader_address_total_per1k 0.302 low (<2.64)
warning: chapters/part5/17-peft-quantization.qmd: guards_A_per1k 3.922 high (>2.50)
warning: chapters/part5/18-alignment.qmd: reader_address_total_per1k 0.0 low (<2.64)
warning: chapters/part5/18-alignment.qmd: guards_A_per1k 5.109 high (>2.50)
warning: chapters/part5/18-alignment.qmd: chapter_refs_max_paragraph 3 high (>2)
warning: chapters/part5/19-generative.qmd: reader_address_total_per1k 0.43 low (<2.64)
warning: chapters/part5/19-generative.qmd: guards_A_per1k 2.582 high (>2.50)
warning: chapters/part5/20-multimodal.qmd: reader_address_total_per1k 0.935 low (<2.64)
I17: 61 added sentence(s) on 10 page(s); 0 shared-phrasing or apparatus violation(s); V3 caps on added sentences one_caution 0/0, that_is_the_whole 0/0, by_the_end 1/2, you_will_be_able_to 0/1, in_one_sentence 0/0, is_the_whole 0/0; book totals (reported) one_caution 0, that_is_the_whole 0, by_the_end 3, you_will_be_able_to 0, in_one_sentence 3, is_the_whole 4
PASS: book voice register rules R1 to R6 hold on 10 page(s) in VOICE_SCOPE; 39 density-band warning(s) (non-blocking)
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

