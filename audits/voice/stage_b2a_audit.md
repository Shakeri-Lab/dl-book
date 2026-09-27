# Stage B2a audit

The evidence behind `stage_b2a_report.md`. Baseline `86ec60b`; pages checked: every page
edited since the baseline. Full invariant outputs: `invariants_b2a.md`.

## Invariants I1 to I19

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

I13 details:

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

LaTeX health (retained `index.log` of each profile; pages from `pdfinfo`):

```
before (86ec60b)
print: errors=0 warnings=9 overfull=423 underfull=54 pages=554
continuous: errors=0 warnings=10 overfull=423 underfull=54 pages=529
after (this commit)
print: errors=0 warnings=9 overfull=423 underfull=54 pages=556
continuous: errors=0 warnings=10 overfull=423 underfull=54 pages=529
```

## Ledger before and after (the twelve edited pages)

Baseline `86ec60b` against this commit (`ledger_baseline_b2a.csv`, `ledger_b2a.csv`;
`ledger_delta_b2a.md` ranks all 35 pages). Rates per 1,000 words of class A prose.

| page | prose words | reader address /1k | verdicts /1k | metaphors /1k | prose guards /1k | Ch. refs /1k | opener refs | max refs per paragraph | nominalizations /1k | bands missed after | distance |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Ch 1 | 2563 → 2558 | 4.682 → 4.691 | 2.731 → 2.737 | 7.803 → 7.819 | 0.78 → 0.782 | 2.341 → 2.346 | 0 | 2 | 48.381 → 48.475 | all ok | 1.039 → 1.041 |
| Ch 5 | 2626 | 4.95 | 3.046 | 3.808 | 1.142 | 2.285 | 2 | 2 | 36.177 | all ok | 1.128 → 1.128 |
| Ch 6 | 2407 → 2441 | 2.908 → 3.277 | 1.246 → 1.229 | 7.894 → 8.193 | 2.493 → 2.048 | 6.232 → 4.506 | 4 → 0 | 4 → 2 | 58.995 → 56.125 | guards_A | 1.255 → 0.969 |
| Ch 7 | 1179 → 1216 | 0.848 → 0.822 | 1.696 → 1.645 | 10.178 → 10.691 | 0.0 | 5.937 → 7.401 | 1 | 1 | 54.283 → 49.342 | reader_address_total | 1.505 → 1.573 |
| Ch 8 | 2741 → 2783 | 4.013 → 3.593 | 1.824 → 2.156 | 9.121 → 10.061 | 1.824 → 1.797 | 11.31 → 11.139 | 2 | 3 | 36.848 → 36.651 | guards_A, refs A, refs max_paragraph | 1.228 → 1.334 |
| Ch 9 | 2917 → 2934 | 5.142 → 6.135 | 1.371 → 1.363 | 9.942 → 9.884 | 1.028 → 1.022 | 5.142 → 5.112 | 2 | 2 | 33.253 → 32.72 | all ok | 0.749 → 0.76 |
| PCA interlude | 1465 → 1511 | 0.0 → 0.662 | 5.461 → 5.295 | 12.287 → 11.913 | 3.413 → 3.309 | 0.0 | 0 | 0 | 47.099 → 45.665 | reader_address_total, guards_A | 3.508 → 3.338 |
| Ch 10 | 3234 → 3235 | 7.112 → 7.11 | 0.928 → 0.927 | 7.73 → 7.728 | 2.474 → 2.473 | 6.494 → 6.491 | 1 | 2 | 34.941 → 34.93 | verdicts, guards_A | 1.257 → 1.256 |
| Ch 11 | 2280 → 2281 | 4.386 → 4.384 | 2.193 → 2.192 | 7.456 → 7.453 | 1.316 → 1.315 | 5.263 → 5.261 | 2 | 4 | 37.719 → 37.703 | refs max_paragraph | 0.504 → 0.503 |
| Ch 13 | 2198 → 2157 | 0.455 → 1.854 | 1.82 → 1.854 | 7.734 → 7.881 | 2.73 → 2.318 | 11.829 → 10.663 | 4 → 2 | 3 → 2 | 58.69 → 57.487 | reader_address_total, refs A | 1.904 → 1.451 |
| TTR interlude | 1387 → 1365 | 0.721 → 0.733 | 2.163 → 2.198 | 7.931 → 8.059 | 5.047 → 5.128 | 5.768 → 5.861 | 1 | 2 | 53.353 → 52.015 | reader_address_total, guards_A | 3.383 → 3.452 |
| Ch 17 | 3299 → 3315 | 0.303 → 0.302 | 3.031 → 3.017 | 3.334 → 3.922 | 4.547 → 3.922 | 3.031 → 2.715 | 3 → 2 | 3 → 2 | 54.562 → 54.299 | reader_address_total, guards_A | 3.16 → 2.697 |

## Edits by stage and rule

Stage B2 is this batch's corrections and resolutions on already-edited pages; stage B2a
is the three new pages. Every edit's receipt is in `receipts.md`.

| stage | page | S1 | S2 | S3 | S5 | S6 | V3 | V4 | T1 | T2 | T4 | T5 | R2 | R5 | R7 | R9 | D7 | total |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| B2 | Ch 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 3 | 5 |
| B2 | Ch 5 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| B2 | Ch 6 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 4 |
| B2 | Ch 8 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 4 |
| B2 | Ch 9 | 0 | 0 | 0 | 1 | 2 | 0 | 1 | 0 | 1 | 1 | 0 | 1 | 0 | 0 | 3 | 0 | 10 |
| B2 | Ch 11 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 2 |
| B2 | Ch 13 | 2 | 3 | 0 | 0 | 0 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 7 |
| B2 | TTR interlude | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 2 |
| B2 | Ch 17 | 1 | 0 | 0 | 4 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 7 |
| B2 | total | 4 | 3 | 0 | 5 | 4 | 1 | 2 | 3 | 2 | 2 | 0 | 1 | 0 | 0 | 12 | 3 | 42 |
| B2a | PCA interlude | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 2 | 0 | 0 | 0 | 0 | 5 |
| B2a | Ch 10 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 3 |
| B2a | Ch 11 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 4 |
| B2a | total | 0 | 0 | 1 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 2 | 3 | 1 | 0 | 0 | 12 |

## Phrase ledger (V3; caps apply to added sentences)

| phrase | cap on added | before | now | in added sentences | pages with 3+ now |
|---|---|---:|---:|---:|---|
| "One caution" | blocking, 0 | 0 | 0 | 0 | none |
| "that is the whole" | blocking, 0 | 0 | 0 | 0 | none |
| "By the end" (promise formula) | blocking, 2 | 2 | 3 | 1 | none |
| "you will be able to" | blocking, 1 | 0 | 0 | 0 | none |
| "in one sentence" | blocking, 0 | 3 | 3 | 0 | none |
| "deliberately" | report only | 36 | 32 | 1 | 15-bert-pretraining 4 |
| "honest", "honestly", "honesty" | report only | 38 | 29 | 1 | none |
| "is exactly" | report only | 23 | 22 | 0 | 03-nonlinearity-mlp 3, 11-encoder-decoder 3 |
| "Here is the" | report only | 13 | 13 | 0 | none |
| verdict form "X is the whole Y" | blocking, 0 | 3 | 4 | 0 | none |

## S6: taste-grade words remaining

Per page; each hit with its context and reading is in `grades.md`. On the ten pages in
scope, the hits left are stances ("not magic"), a technical idiom ("graceful under
shift"), and a contrast that names what a demonstration is not about ("rather than an
impressive compression ratio").

| page | hits |
|---|---:|
| a3-precision-performance | 1 |
| epilogue | 1 |
| learning-by-experiment | 1 |
| 02-logistic-softmax | 2 |
| 03-nonlinearity-mlp | 3 |
| 04-training-loss-sgd | 1 |
| 05-backpropagation | 1 |
| 07-filters-convolution | 1 |
| 09-modern-cnns-transfer | 3 |
| 12-kernel-regression | 1 |
| 13-attention | 1 |
| 15-bert-pretraining | 1 |
| 16-vit-scaling | 3 |
| 17-peft-quantization | 1 |
| p5-pretrained-era | 1 |

## I19: prose numbers no printout on the page shows (report only)

Per page; each number with its context is in `numbers.md`. Most are design constants or
references to other pages; the confirmed contradictions are in the report's Section B.

| page | numbers |
|---|---:|
| a3-precision-performance | 2 |
| learning-by-experiment | 2 |
| making-pca-learnable | 3 |
| 02-logistic-softmax | 1 |
| 03-nonlinearity-mlp | 3 |
| 04-training-loss-sgd | 2 |
| 05-backpropagation | 1 |
| 06-generalization-inductive-bias | 7 |
| 07-filters-convolution | 4 |
| 08-cnn | 4 |
| 09-modern-cnns-transfer | 16 |
| 10-sequences-rnn | 7 |
| 11-encoder-decoder | 12 |
| 12-kernel-regression | 1 |
| 13-attention | 4 |
| 14-self-attention-transformer | 8 |
| 15-bert-pretraining | 6 |
| 16-vit-scaling | 18 |
| 17-peft-quantization | 11 |
| 18-alignment | 2 |
| 19-generative | 2 |
| 20-multimodal | 4 |

## Reader-pass marks

Two rounds. The seven B0 and B1 pages were read with the first instruction, which
judged against a generic standard (398 marks); the PCA interlude and Chapters 10 and 11
were read with the calibrated instruction (at most ten ranked marks per page, counts for
the rest). Marks on edited or added sentences were fixed under P2 or overruled; each
resolution is in the receipts' reader column and in the report's Section A. Number
mismatches and content findings are in the report's Section B. Unambiguous slips in
baseline text were fixed under R9. Everything else stays, default "leave". A mark can
carry several reasons, so the reason counts exceed the mark counts.

| page | marks | on edited sentences | fixed under R9 | reasons (rule / announces / apparatus / fragment / punctuation / voice / number) |
|---|---:|---:|---:|---|
| Chapter 1 | 41 | 1 (overruled) | 1 | 21 / 16 / 11 / 9 / 3 / 9 / 0 |
| Chapter 6 | 54 | 3 (1 fixed, 2 overruled) | 2 | 23 / 8 / 21 / 9 / 8 / 14 / 0 |
| Chapter 8 | 54 | 1 (overruled) | 3 | 32 / 9 / 9 / 13 / 9 / 9 / 0 |
| Chapter 9 | 124 | 8 (4 fixed, 4 overruled) | 3 | 43 / 23 / 46 / 26 / 16 / 28 / 1 |
| Chapter 13 | 33 | 6 (4 fixed, 2 overruled) | 0 | 25 / 6 / 12 / 1 / 6 / 12 / 0 |
| Test-time-regression interlude | 42 | 3 (1 fixed, 2 overruled) | 1 | 25 / 10 / 11 / 2 / 6 / 8 / 0 |
| Chapter 17 | 50 | 4 (all fixed) | 0 | 33 / 13 / 12 / 0 / 5 / 13 / 1 |
| PCA interlude (calibrated) | 29 (10 ranked) | 1 (overruled) | 0 | unranked 19: 7 / 5 / 4 / 0 / 2 / 1 / 0 |
| Chapter 10 (calibrated) | 45 (10 ranked) | 0 | 0 | unranked 35: 7 / 10 / 5 / 2 / 3 / 5 / 3 |
| Chapter 11 (calibrated) | 37 (10 ranked) | 1 (overruled) | 2 | unranked 27: 10 / 3 / 4 / 4 / 3 / 1 / 1, plus one logic slip |

Five examples of the baseline marks left in place, per page (default: leave):

- **Chapter 1.** "The rank-aware least-squares routine in Take 1 below is designed around the first three; the fourth is why we will soon stop solving exactly." (apparatus) · "Chapter 6 will make that difference visible; Appendix E later gathers the full statistical contract in one reference." (apparatus) · "Why do fitted predictions live in the column space of the design matrix?" (the page says "data matrix") · "We taught a computer a function from examples, completely:" (rule) · "Assume targets are generated by a linear process with additive Gaussian noise." (a display follows a period)
- **Chapter 6.** "The model and training loop hold no surprises: an MLP from Chapter 3, trained exactly as in Chapter 4:" (two colons) · "And it is a dial, not a dogma: give a weakly biased model enough data and it can win again: a trade we will meet at the frontier in Chapter 16." (two colons; the hyphen was fixed under R9) · "Look once more at the templates figure." (apparatus) · "Our MLP's failure is not a capacity problem or (fixably) a data problem." (the parenthesis carries the meaning) · "Close the book for one minute and retrieve the argument before reading the recap." (apparatus)
- **Chapter 8.** "Read that cell again, because the entire deep-learning revolution in vision is that cell writ large." (apparatus) · "Those contributions accumulate, then the loss reduction supplies its scale; ..." (a comma before "then"; fixing it needs a word) · "A useful analogy: nn modules are appliances: they have knobs and memory, ..." (two colons) · "... the end of this chapter measures it rather than assuming it." (apparatus) · "Here sealed is chapter-local." (apparatus)
- **Chapter 9.** "Why that matters is the subject of the second section." (apparatus) · "Look at the training column first, because it carries the whole lesson." (apparatus) · "In Appendix B's language, the defining operation is concatenation along the feature-channel axis, not another kind of residual addition (Appendix B)." (Appendix B named twice) · "Read that table slowly, because it does not say what the textbook story predicts, and the discrepancy is the best lesson in this chapter." (apparatus) · "The chapter's small-data studies isolated mechanisms." (the chapter's own caveats say they do not isolate)
- **Chapter 13.** "Appendix C turns that intuition into a conditional performance model: ... (Appendix C)." (Appendix C named twice) · "Changing them would end the running benchmark:" (the colon leads into code steps) · "For this date model, the shape ledger is concrete:" (apparatus) · "The full Chapter 11 validation curve below is frozen from a byte-identical re-execution of that chapter's published baseline." (provenance voice) · "Chapter 8 made one other promise." (announces)
- **Test-time-regression interlude.** "The fixed-size state could not hold everything in 10 Sequences and Recurrence." (on this unnumbered page the cross-reference renders as the chapter's number and title) · "Now we know the price list on which that failure was one entry." (apparatus) · "The study was designed on seed branches 0 and 1." (methods register) · "It exposes four dials the book already knows." (apparatus) · "This is the honest content behind 'Transformers are RNNs' for causal linear attention: the recurrent state returns, dignified, as a sufficient statistic of a regression." (voice)
- **Chapter 17.** "They are where does task-specific information live, and which object does the method change?" (questions run in without a colon) · "The instructor's practical instinct remains useful: ..." (the instructor in the third person) · "That last point harvests Chapter 9's full promise." (apparatus) · "The QLoRA section later in this chapter makes that composition explicit." (apparatus) · "Across runs, initialization, meta-training episodes, and the finite 8,192-episode evaluation bank all change." (the first comma makes "runs" read as a list item)
- **PCA interlude.** "Earlier chapters already use that benchmark, so this is an endpoint reuse, not a newly sealed test." (rule) · "The example is deliberately small enough to train during the book build:" (apparatus) · "Module 6 asks the more neural-network-shaped question: ..." (names the course) · "This chapter also groups it under unsupervised representation learning." (apparatus on an interlude) · "Both models below use exactly the ledger above." (apparatus)
- **Chapter 10.** "The fixed-size state is about to face that rematch: ..." (no earlier rematch) · "The listing lives in the support module as tested source ..." (maintainer's voice) · "We commit that code-stripped text as a benchmark snapshot; later copyedits must not silently change the task." (maintainer's voice) · "Windows of roughly 20–50 steps are a common practical horizon, not a universal vanilla-RNN ceiling." (recap; rule) · "The change in tokenization is audible: ..." (no word-level sample printed)
- **Chapter 11.** "(In the vocabulary of Section 4.6.1 this is Case 1 over real tokens, ...)" (apparatus) · "Honesty requires the other half of the report:" (announces) · "... Chapter 13 performs the full harvest." (apparatus, in Sources) · "One design detail from the original paper worth repeating: ..." (the comma splice after it was fixed under R9) · "You can see the shape of this failure in our model's rare residual errors:" (Section B)

## Flags added in this batch

| page | rule | location | text | reason |
|---|---|---|---|---|
| making-pca-learnable | S1 | `chapters/interludes/making-pca-learnable.qmd` | Five prose guards stay (3.4 per 1,000 words against the interlude ceiling of 2.5): two in the recap's numbered list (frozen), the caveat beside the PCA rule (where S1 puts it), 'The phrase names the goal, not a guarantee that every bottleneck recovers a true manifold or its preferred coordinates', and 'so this is an endpoint reuse, not a newly sealed test'. | The rephrase option was drafted for the last two ('The phrase names a goal; whether a given bottleneck recovers a true manifold, or its preferred coordinates, has to be checked.'; 'Earlier chapters already use that benchmark, so this experiment reuses an endpoint rather than sealing a new one.') and read no better than the author's sentences, so the page keeps them (standing rule). The brief's count of eleven includes captions and callouts; the ledger counts running prose. |
| making-pca-learnable | T5 | `chapters/interludes/making-pca-learnable.qmd` | The brief asks for turns at 'the reconstruction experiment' and at the 'What if the map could bend?' experiment. | Read as the convolutional clean-versus-denoising study (both arms are scored by reconstruction error) and the planted-curve rematch; neither had a reader turn. |
| making-pca-learnable | T1/T4 | `chapters/interludes/making-pca-learnable.qmd` | No promise and no handoff added. | The opener already says what the interlude does ('We will first learn its contract, then discover ...'), and the recap hands two questions forward. |
| making-pca-learnable | report | `chapters/interludes/making-pca-learnable.qmd (opener and 'Make PCA learnable')` | 'the course takes a revealing detour' and 'Module 6 asks the more neural-network-shaped question' refer to the course rather than the book. | Baseline author text outside the voice rules; reported, not edited. |
| 10-sequences-rnn | S1/bands | `chapters/part3/10-sequences-rnn.qmd` | Prose guards measure 2.5 per 1,000 words (8 in 3,234 words) against VOICE.md's Part III ceiling of 1.5. | The brief counts 1.9 and calls it under the Part III ceiling, and asks for no guard work; the guards stay (standing rule). The ceiling itself needs a decision: VOICE.md sets 1.5 for Parts I to III. |
| 10-sequences-rnn | T2 | `chapters/part3/10-sequences-rnn.qmd (after @eq-recurrence)` | No verdict added after the recurrence display. | The display sits inside a sentence, and the paragraph under it already carries its verdict ('This is the book's third weight sharing ...'). |
| 10-sequences-rnn | S4 | `chapters/part3/10-sequences-rnn.qmd (Watching the valves)` | 'the solver's mean forget gate should hold clearly above the half-open point' | A degree adverb (distinctly above), not an intensifier; kept. |
| 10-sequences-rnn | T4/T5 | `chapters/part3/10-sequences-rnn.qmd` | No handoff or reader turn added. | The recap's 'The next chapters will earn the mechanism that repays it' stays as the handoff; the memory test already asks the reader to predict the three rows. |
| 11-encoder-decoder | S2 | `chapters/part3/11-encoder-decoder.qmd ('The fixed-size state in the middle')` | The 'look back' paragraph carries four chapter mentions (1, 2, 12, 13); the embedding paragraph carries three (10, 1, 13). | Both are enumerations: the first names where the primitives came from and where the next two chapters take them, the second is a tool inventory; S2 exempts them. |
| 11-encoder-decoder | T1/T4/T5 | `chapters/part3/11-encoder-decoder.qmd` | No promise, handoff, or reader turn added. | The opener already promises the machine and its craft; 'Part IV is what happens when we stop throwing them away' is the handoff; the page meets its reader-address band. |
| 11-encoder-decoder | D7 | `chapters/part3/11-encoder-decoder.qmd` | 'gold rail' (seven uses) and the '(navy)' and '(green)' tags stay. | An idiom and legends (brief B2, decision 6). |

## I17: every added sentence

I17 checks 61 added sentences on 10 pages: no shared four-word sequence and no shared first three words across chapters.

| page | edit | added sentence (as it now reads) |
|---|---|---|
| 01-linear-regression | 01-R3-1 | where each MATH is an input with MATH features and MATH is the desired output, also called the supervision signal. |
| 01-linear-regression | 01-B0-C7 | We use the three framework calls as black boxes here: REF introduces modules, REF opens the optimizer, and REF explains what backward() computes. |
| 01-linear-regression | 01-B0-N6a | That is worth seeing, not just asserting. |
| 01-linear-regression | 01-B0-N6c | A linear model as a computation circuit: each blue input is scaled by an orange learnable weight, the signals and orange bias are added, and the green prediction leaves the circuit. |
| 01-linear-regression | 01-B0-N6d | Bias is the distance from truth to mean prediction; the green and gray arrows each span MATH sample standard deviation, visualizing the spreads whose squared values enter prediction variance and irreducible noise. |
| 01-linear-regression | 01-B0-S5a | Two lines, and we recover the truth up to the noise floor. lstsq handles rank and conditioning more reliably than explicitly forming MATH . |
| 01-linear-regression | 01-B0-S5b | This is the regime where variance explodes and regularization shines: |
| 01-linear-regression | 01-S6-1 | The exact characterization does not survive the move to deep networks. |
| 06-generalization-inductive-bias | 06-B2-C14 | You will see the memorized coordinates in the first-layer templates themselves, each one stretched across the whole frame; the fix is two constraints, locality and translation structure, and Part II is built from them. |
| 06-generalization-inductive-bias | 06-B2-P3a | A single seeded Adam sweep describes its own regime, so it cannot separate their effects, estimate a scaling law, or establish a MATH variance law. |
| 08-cnn | 08-S5-1 | Read the clean-validation column: the MLP scores 75.5% and LeNet 74.5% in this single seeded run. |
| 08-cnn | 08-T2-1 | Padding buys back what the window eats; stride skips stops on purpose. |
| 08-cnn | 08-T4-1 | LeNet leaves this chapter with two demerits and one IOU: most of its parameters sit in the dense head, its shift cliff was softened rather than abolished, and batch normalization is still owed. |
| 08-cnn | 08-R7-1 | And yet LeNet's curve falls too. |
| 08-cnn | 08-S6-1 | Two honest disclaimers about the game, both of which make the real thing harder, not easier. |
| 09-modern-cnns-transfer | 09-S5-2 | One caveat before you re-derive the field equations of vision from this: the MATH arithmetic assumes the channel width stays MATH through the stack. |
| 09-modern-cnns-transfer | 09-S5-4 | Our experiment isolates the residual rescue at one depth; a strict demonstration that adding depth degrades a plain network would also require a shallower plain control. |
| 09-modern-cnns-transfer | 09-S5-4 | Our experiment found scratch and the ImageNet probe in a near tie across three seeds at 28-pixel scale. |
| 09-modern-cnns-transfer | 09-T5-1 | Rank the three contenders before you run them, and write down how far ahead you expect the ImageNet backbone to finish. |
| 09-modern-cnns-transfer | 09-R4-1 | At evaluation time there may be no batch (one image), so it uses running averages collected during training. model.train() and model.eval() switch between the two. |
| 09-modern-cnns-transfer | 09-B2-C17 | Chapter 8 already opened the 600-image holdout, and this chapter queries it repeatedly while comparing architectures, so we keep the familiar X_te name but treat it as the book's fixed benchmark. |
| 09-modern-cnns-transfer | 09-B2-P3b | The accuracy is 76.2%, and that dip is worth more attention than the win. |
| 09-modern-cnns-transfer | 09-B2-P3d | The decision rule supported by the experiments is this: transfer pays when (your labels are scarce) and (the target task is feature-hungry) and (the pretraining data plausibly covers the target's features at a matched scale). |
| 09-modern-cnns-transfer | 09-S6-1 | VGG's answer (Simonyan & Zisserman, 2014): never use a MATH kernel; stack MATH s until the field is as wide as you need. |
| 09-modern-cnns-transfer | 09-S6-2 | It is not magical: the learned Jacobian can still reinforce, distort, or even partly cancel that term. |
| 10-sequences-rnn | 10-S5-1 | Read the output closely, because both halves of the verdict teach. |
| 11-encoder-decoder | 11-S5-1 | Free-running ("fr") is the straightforward answer: feed the model's own predictions back in, exactly as at inference. |
| 11-encoder-decoder | 11-S5-2 | Others include a high-scoring hybrid that matches neither convention, a reminder that beam search searches the model; it does not install a calendar constraint. |
| 11-encoder-decoder | 11-R7-1 | Packing simply stops the clock at the last real character. |
| 13-attention | 13-S2-1 | An embedding can learn what lives at row 17, but fetching row 17 is still a rigid act of indexing: learned content behind a hard address. |
| 13-attention | 13-S2-1 | Replace the one address with a distribution over addresses, let the gradient reach every score, and the model can learn which rows deserve weight. |
| 13-attention | 13-S2-3 | Masking returns there as well: a causal mask will decide which future positions an autoregressive model may not see. |
| 13-attention | 13-S4-1 | Additive attention remains useful and accelerator-compatible; scaled dot product maps more directly to the matrix operations modern numerical libraries optimize heavily. |
| 13-attention | 13-T1-1 | By the end of the chapter you will have built it twice, masked it correctly, and watched it carry a date's year to the front of the output. |
| 13-attention | 13-T4-1 | The recurrent networks that write the memory stay in place for now; Chapter 14 lets a sequence query itself, so every position learns where to look and recurrence becomes optional. |
| 13-attention | 13-R2-1 | Test both the variance and what softmax sees. |
| 13-attention | 13-R7-1 | The boxed region catches that movement, and across all 400 fixed validation examples, 97.5% of those four rows' mass lands on states indexed by the source-year region. |
| 13-attention | 13-B2-P3b | Compare one request with every stored candidate, normalize the scores, and blend the stored values with the resulting weights. |
| 13-attention | 13-B2-P3c | That is Chapter 2's softmax. |
| 13-attention | 13-B2-P3e | The old handoff was a finite-state bottleneck. |
| 17-peft-quantization | 17-S2-1 | BERT's recipe showed the conventional next step: fine-tuning changes every encoder weight. |
| 17-peft-quantization | 17-S1-1 | QLoRA composes the last two. |
| 17-peft-quantization | 17-S1-2 | These bills are related, but they are not interchangeable: every lever can affect more than one bill, and none removes all backbone storage or transient work. |
| 17-peft-quantization | 17-S1-3 | The separate cost ledger below is deliberately not column-matched. |
| 17-peft-quantization | 17-S1-6 | The experiment was also built from a low-rank shift; a task whose useful correction is not well captured at the chosen rank will retain error no matter how fashionable the adapter is. |
| 17-peft-quantization | 17-T2-1 | The weights never move; only the context does. |
| 17-peft-quantization | 17-R2-1 | Put those promises on one ledger. |
| 17-peft-quantization | 17-B0-C6a | Low rank is a hypothesis about the update, not a free compression theorem. |
| 17-peft-quantization | 17-B0-C6b | The point is inspectability rather than an impressive compression ratio; real LoRA savings depend on wide matrices, small ranks, and which layers are targeted. |
| 17-peft-quantization | 17-B2-C16 | The counts are the trainable adapter values in this small layer. |
| 17-peft-quantization | 17-B2-C20a | \| Method \| Task state and permitted writes \| Main consequence \| \|---\|---\|---\| \| Hard prompt / ICL \| State in ordinary context; no gradients during use \| No learned task checkpoint; longer context \| \| RAG \| State in index and retrieved context; writes depend on design \| Fresher evidence; retrieval failure surface \| \| Prompt tuning \| State in continuous input vectors; write prompt  … |
| attention-as-test-time-regression | TTR-S1-2 | “Retains every row” does not mean “recalls every association exactly. |
| attention-as-test-time-regression | TTR-S1-2 | Softmax still returns a convex mixture whose quality depends on keys, temperature, and interference. |
| attention-as-test-time-regression | TTR-S1-3 | REF makes a prediction we can test without pretending to train a language model or benchmark a state-space model. |
| attention-as-test-time-regression | TTR-S1-4 | A sealed synthetic mechanism test. |
| attention-as-test-time-regression | TTR-B0-C8 | The comparison reveals what each solver retains, what it costs, and which statistical contract it accepts. |
| making-pca-learnable | PCA-S3-1 | A deterministic autoencoder may still be used inside a generative system, and we can fit a separate distribution to its codes. |
| making-pca-learnable | PCA-T5-1 | Before you run it, predict which map can follow the bend with one number per point, and whether PCA and the tied linear autoencoder will find the same line. |
| making-pca-learnable | PCA-T5-2 | Before the scores print, predict which arm reconstructs clean test images better and which copes better with the corrupted inputs. |
| making-pca-learnable | PCA-R2-1 | Set random sampling aside for a moment and ask a simpler question. |
| making-pca-learnable | PCA-R2-2 | Take a controlled curve with a known one-dimensional coordinate. |

## Commands

```bash
python scripts/audit_voice_invariants.py --base 86ec60b --files <the twelve pages> \
  --html-before BASE --html-after B2A --notebooks-before NB_BASE --notebooks-after NB_B2A \
  --exceptions audits/voice/invariant_exceptions.json
python scripts/audit_voice_ledger.py --check B2A
python scripts/audit_voice_ledger.py --phrases BASE B2A --markdown audits/voice/phrases.md
python scripts/audit_voice_ledger.py --numbers B2A --markdown audits/voice/numbers.md
python scripts/audit_voice_ledger.py --grades B2A --markdown audits/voice/grades.md
python scripts/voice_apply_edits.py gate audits/voice/edits/*.json --stage B2 B2a --html B2A --out SECTION_A
```

## Gate close (September 27, 2026)

The branch merged `main` (PRs #5 and #6, the HTML-only website, the Chapter 8 and 9
replays) and `author-corrections` (Patch 1: `u, v` offsets in Equations 7.1 and 8.1),
then took three commits outside the voice rules on the author's instruction: the rulings
(B3.1 moves Part III to the 2.5 guard ceiling), the three plan steps (B3.5), and the
author corrections (`author_corrections_b2a.md`). Chapters 1, 6, 7, 8, 9, 10, 11, and
13, the PCA and test-time-regression interludes, and Chapter 17 were re-executed; the 47
regenerated figures were pixel-identical and keep their committed bytes.

The invariants ran against a base built from `86ec60b` with only the non-voice changes
applied (main, Patch 1, B3.5, the author corrections, and the five pre-merge review
fixes), so what remains is the voice work. That base was a local commit (`9fe94d8`,
first built as `863e391` before the review fixes); `invariant_base_b2a.patch` holds
its difference from `86ec60b` in the chapters, code, and Preface, so it can be rebuilt. Against it every invariant passes except three, each
explained by measurement:

- I2 (frozen output): Chapter 1's HTML freeze at the prior HEAD still showed the
  generator display PR #6 removed; the re-execution drops it. Nothing else differs.
- I11 (notebooks): the two exports pin different commits, and the exporter embeds the
  commit. With the commit and `source_line` normalized, all 26 notebooks are identical.
- I12 (words): Chapter 1 grows 7.3% against the `86ec60b` render because PR #5's three
  footnotes now render in HTML (200 words); without them the page is within 0.5%.

All other audits pass: book contract, Plan to Code, Python sources, public anchors in
source and rendered HTML, replay fixtures (45 excerpts), HTML assets (36 pages, no PDF),
the print PDF audit (556 pages), the HTML interaction suite, and the voice register check.
