# Parts II and IV prose pass (P24): audit

Branch `voice-coherence` from `4828b2e`. Pages: Chapters 9, 14, 15, 16, 18 and 19 (`08-cnn`, `12-kernel-regression`, `13-attention`, `14-self-attention-transformer`, `15-bert-pretraining`, `16-vit-scaling`). Chapters 8 and 10 join after #13 and #14 merge. The gate report is `stage_p24_report.md`.

## Invariants

```text
I1   PASS  code cells byte-identical (caption/alt options masked) [chapters/part4/15-bert-pretraining.qmd: 2 cell(s) changed only in caption/alt options]
I3   FAIL  chapters/part4/12-kernel-regression.qmd: math removed [] added ['$q=3.5$', '$h=0.6$', '$(0.0002, 0.9413, 0.0585)$']
I4   FAIL  chapters/part4/12-kernel-regression.qmd: numbers removed {} added {'1': 1, '3': 1, '5': 1, '1.5': 1, '2.8': 1, '1.8': 1}; chapters/part4/13-attention.qmd: numbers removed {} added {'59.2%': 1}
I5   FAIL  chapters/part4/14-self-attention-transformer.qmd: anchors removed [] added ['the-position-debt']
I6   FAIL  chapters/part2/08-cnn.qmd: link instances removed {} added {'https://doi.org/10.1109/5.726791': 1}; chapters/part4/12-kernel-regression.qmd: link instances removed {'https://vita-group.github.io/TTC-Net/': 1} added {'https://doi.org/10.1137/1109020': 1, 'https://www.jstor.org/stable/25049340': 1, 'https://arxiv.org/abs/2501.12352': 1, 'https://proceedings.mlr.press/v267/sun25h.html': 1, 'https://proceedings.mlr.press/v139/schlag21a.html': 1, 'https://arxiv.org/abs/2501.00663': 1, 'https://arxiv.org/abs/2506.05233': 1, 'https://arxiv.org/abs/2603.09221': 2, 'sec-11-encoder-decoder': 1, 'sec-13-attention': 1}; chapters/part4/13-attention.qmd: link instances removed {} added {'https://aclanthology.org/D15-1166/': 1, 'https://papers.nips.cc/paper/7181-attention-is-all-you-need': 1, 'https://arxiv.org/abs/1409.0473': 1}; chapters/part4/14-self-attention-transformer.qmd: link instances removed {} added {'https://papers.nips.cc/paper_files/paper/2017/hash/3f5ee243547dee91fbd053c1c4a845aa-Abstract.html': 1, 'https://arxiv.org/abs/2104.09864': 1, 'https://arxiv.org/abs/1607.06450': 1, 'https://proceedings.neurips.cc/paper/2019/hash/1e8a19426224ca89e83cef47f1e7f53b-Abstract.html': 1, 'https://arxiv.org/abs/1904.09751': 1}; chapters/part4/15-bert-pretraining.qmd: link instances removed {} added {'https://aclanthology.org/N19-1423/': 1, 'https://aclanthology.org/N18-1202/': 1, 'https://aclanthology.org/P18-1031/': 1, 'https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf': 1, 'https://arxiv.org/abs/1907.11692': 1, 'https://aclanthology.org/P16-1162/': 1, 'https://github.com/google-research/bert/blob/master/run_pretraining.py': 1, 'https://www.jmlr.org/papers/v21/20-074.html': 1}; chapters/part4/16-vit-scaling.qmd: link instances removed {} added {'https://arxiv.org/abs/2010.11929': 1, 'https://openaccess.thecvf.com/content/ICCV2021/html/Liu_Swin_Transformer_Hierarchical_Vision_Transformer_Using_Shifted_Windows_ICCV_2021_paper.html': 1, 'https://proceedings.mlr.press/v139/touvron21a.html': 1, 'https://openaccess.thecvf.com/content/CVPR2022/html/Liu_A_ConvNet_for_the_2020s_CVPR_2022_paper.html': 1, 'https://proceedings.mlr.press/v97/tan19a.html': 1, 'https://arxiv.org/abs/2001.08361': 1, 'https://arxiv.org/abs/2203.15556': 1}
I7   FAIL  chapters/part4/14-self-attention-transformer.qmd: heading text changed 'The position debt' -> 'Self-attention does not see order {#the-position-debt}'
I8   PASS  figure references and alt text identical (alt text only under R6)
I9   FAIL  chapters/part2/08-cnn.qmd: exercise text changed
I10  FAIL  chapters/part4/12-kernel-regression.qmd: Sources changed
I11  FAIL  chapters/part4/15-bert-pretraining.qmd: plan steps changed
I15  PASS  cross-volume references identical
I9   PASS  exercise count over checked files 35 -> 35
I12  FAIL  chapters/part4/12-kernel-regression.qmd: class A words 1431 -> 1536 (+7.3%)
I16  PASS  em dashes in classes A to F, H, T on checked pages: 08-cnn: 0 (0 exempt); 12-kernel-regression: 0 (0 exempt); 13-attention: 0 (0 exempt); 14-self-attention-transformer: 0 (0 exempt); 15-bert-pretraining: 0 (0 exempt); 16-vit-scaling: 0 (0 exempt)
I17  PASS  121 added sentences on 14 page(s); no shared four-word sequence across chapters, no shared promise opening, no apparatus word
I18  FAIL  chapters/part4/12-kernel-regression.qmd: links removed {'https://vita-group.github.io/TTC-Net/': 1} ['Nadaraya, On Estimating Regression: the 1964 two-page paper introducing one side']; chapters/part4/15-bert-pretraining.qmd: mean sentence length 19.0->23.0 ['A learned summary token can gather a sequence for a downstream head; REF will gi']
```

The failures are the pass's declared changes, not slips:

- **I3, I4, I12** (Chapter 14): the W8 worked instance adds $q=3.5$, $h=0.6$, the weights $(0.0002, 0.9413, 0.0585)$ and the numbers 1, 3, 5, 1.5, 2.8, 1.8, all printed by the chapter's own table and `fixed-gaussian-attention` cell; class A words rise 7.3%. **I4** (Chapter 15): "59.2%" is repeated from the warning callout in recap item 5, replacing "the parameter/compute caveat stated in full".
- **I5, I7**: the Section 16.1 subsection heading is renamed and pinned to its old id `{#the-position-debt}`, which is the id it had before, so rendered anchors are unchanged (`audit_public_anchors.py --rendered` passes).
- **I6**: the W7 links at first mention (32), Chapter 14's Sources URL change, and the W8 paragraph's two cross-references (to Chapters 13 and 15).
- **I11**: Chapter 18's Plan step "five Boolean ledgers" → "five Boolean rows" (W6), matching its caption.
- **I9**: Chapter 9 Exercise 2, "receptive-field ledger" → "receptive-field growth" (W6).
- **I10**: Chapter 14's *Beyond Test-Time Memory* entry → arXiv:2603.09221 (W7).
- **I18**: the Sources URL above, read as a removed link; Chapter 18's closing paragraph, whose mean sentence length rises from 19 to 23 words when its shortest sentence, the dropped frame, goes.

## Measures before and after (rendered HTML, the author's definitions)

Rates are per 1,000 words of running prose. Hits are split by where they sit: prose, callout, or replay panel (panels are outside W1 and reported only). "Here is …" openers are counted but excluded by the author's ruling.

| ch | words | colon leads (per 1k) | accounting words | announcements (excl. "Here is") |
|---|---:|---:|---:|---:|
| 9 | 5632 → 5611 | 47 → 43 (8.3 → 7.7) | 7 → 1 | 2 → 0 |
| 14 | 2275 → 2379 | 8 → 8 (3.5 → 3.4) | 2 → 1 | 1 → 0 |
| 15 | 2915 → 2924 | 4 → 4 (1.4 → 1.4) | 3 → 0 | 0 → 0 |
| 16 | 5135 → 5127 | 14 → 14 (2.7 → 2.7) | 5 → 0 | 1 → 0 |
| 18 | 4849 → 4831 | 17 → 16 (3.5 → 3.3) | 2 → 2 | 0 → 0 |
| 19 | 3765 → 3751 | 8 → 8 (2.1 → 2.1) | 6 → 1 | 0 → 0 |

**Colon leads, by container**

| ch | callout | prose | replay |
|---|---:|---:|---:|
| 9 | 1 → 1 | 25 → 21 | 21 → 21 |
| 14 | 2 → 2 | 5 → 5 | 1 → 1 |
| 15 | 0 → 0 | 2 → 2 | 2 → 2 |
| 16 | 0 → 0 | 9 → 9 | 5 → 5 |
| 18 | 0 → 0 | 9 → 8 | 8 → 8 |
| 19 | 0 → 0 | 4 → 4 | 4 → 4 |

**Accounting words, by container**

| ch | callout | prose | replay |
|---|---:|---:|---:|
| 9 | 1 → 0 | 6 → 1 | 0 → 0 |
| 14 | 1 → 1 | 1 → 0 | 0 → 0 |
| 15 | 0 → 0 | 3 → 0 | 0 → 0 |
| 16 | 0 → 0 | 5 → 0 | 0 → 0 |
| 18 | 0 → 0 | 0 → 0 | 2 → 2 |
| 19 | 2 → 0 | 4 → 1 | 0 → 0 |

**Announcements (all, "Here is" included), by container**

| ch | prose | replay |
|---|---:|---:|
| 9 | 4 → 2 | 0 → 0 |
| 14 | 2 → 1 | 0 → 0 |
| 15 | 1 → 1 | 0 → 0 |
| 16 | 3 → 2 | 0 → 0 |
| 18 | 0 → 0 | 1 → 1 |
| 19 | 0 → 0 | 0 → 0 |

The colon-lead measure counts candidates; each was then classified by hand (keep: a complete clause before the colon, or a list, display or code it introduces). The remaining prose hits are keeps. The remaining accounting hits are the author-gated devices (Chapter 9 "owed", Chapter 14 "price list", Chapter 19 "paid for") and the bert-ledger scene's text.

**Works named in running prose (author-name detector)**: unlinked at first mention, before → after: Ch 9 1 → 1, Ch 14 6 → 0, Ch 15 3 → 0, Ch 16 0 → 0, Ch 18 2 → 0, Ch 19 3 → 1. The detector keys on author names, so it misses works named by their method (the Transformer, RoPE, RMSNorm, nucleus sampling, BERT, T5, Swin); the hand classification found those, and all are linked. The one remaining hit, Chapter 19's "Hoffmann and colleagues", is the second mention of Chinchilla, linked where it is first named.

## Compiled-trace check, before and after

Before: one rule-aware reader per chapter (Form, Readability and the deletion test on the source and the rendered page). After: the same detectors on the chapter prose at `4828b2e` and now, and the before-reading's ledger rows checked against the new text. All six chapters scored Form 1, Readability 1 before (argument form). The after-reading finds no new ledger row and 11 fewer, with every evidence row intact, so the scores hold. Chapter 18's Boolean-ledger row covers its caption and Plan step; the bert-ledger replay keeps its wording (report, B3.3).

| ch | detector changes (before → after) | deletion-test ledger rows removed |
|---|---|---|
| 9 | Correction and self-debugging narratives 2 → 0; Harness 2 → 0 | 5 of 6 |
| 14 | Correction and self-debugging narratives 1 → 0 | 1 of 4 |
| 15 | File paths 4 → 3; Harness 1 → 0 | 1 of 5 |
| 16 | Harness 2 → 0 | 1 of 9 |
| 18 | Harness 1 → 0 | 3 of 5 |
| 19 | Harness 3 → 0 | 0 of 6 |

Ledger rows the pass leaves, all outside W1, W6, W7 and W8 (provenance narration, defensive negations, execution-budget notes), for a later pass:

- Ch 9, l.799-800 (defensive negation repeated a third time (after 624-625 and 768)): "this does not establish an expected clean-accuracy difference"
- Ch 14, l.377-379 (arithmetic reconciliation written out in prose): "In our finite 1,000-world ensemble, the analogous empirical decomposition closes to floati"
- Ch 14, l.446 (fig-bandwidth-fits caption) (defensive negation plus audit vocabulary in a caption): "The blue bandwidth is the grid minimum in the 1,000-world audit, not a hand-picked attract"
- Ch 14, l.680-681 (recap item 3) (recap repeats a four-decimal result already printed in the table and a): "Our fixed audit reached its grid-minimum MSE of $0.0236$ at $h=0.18$."
- Ch 15, l.502 (development provenance in reader prose): "Here is an independently written scaled-dot operator."
- Ch 15, l.885-886 (provenance narration (verification process of a frozen baseline)): "frozen from a byte-identical re-execution of that chapter's published baseline"
- Ch 15, l.1030-1031 (harness-artifact / self-debugging explanation (RNG draw order)): "constructing models with different parameter counts consumes different random draws before"
- Ch 15, l.1108-1110 (summary restates results with numbers): "attention reaches 93.25% validation exact match at epoch 6 and 100.0% on the final test au"
- Ch 16, l.1039-1040 (book-production provenance narrated to the reader): "The snapshot keeps later copyedits from moving the benchmark."
- Ch 16, l.1236-1239 (identifiers as grammatical subjects; implementation housekeeping): "`ModuleList` registers the two repeated blocks with the model. The nonpersistent position "
- Ch 16, l.1249-1250 (fingerprints/hashes as reported artifacts): "It also prints fingerprints for both artifacts."
- Ch 16, l.1315-1316 (harness artifact (execution budget) in reader prose): "called in separate cells so each substantial run stays within the chapter's execution budg"
- Ch 16, l.951-954 (defensive-negation register): "This is an implementation choice, not a universal theorem that post-LayerNorm fails or tha"
- Ch 16, l.966-968 (defensive negation against an unmade claim): "it does not imply universal superiority over LayerNorm. Architecture, optimizer, dtype, an"
- Ch 16, l.781-782 (defensive negation): "it does not guarantee that gradients can never vanish or explode."
- Ch 16, l.1603 (self cross-reference (text compiled from another location)): "The toy sampler in @sec-14-self-attention-transformer is wasteful"
- Ch 18, l.977 (Templated plan step that copies the code-summary and misdescribes its ): "4. Define full attention, the encoder, and the MLM head."
- Ch 18, l.854, 856, 974, 975, 1136, 1137 (Boilerplate plan labels): "Define the reusable helpers: `source_sentences` and `encode`. / Check the claimed identiti"
- Ch 19, l.564-566 (harness/execution narrative in main text): "The five paired runs use one cell per seed so that each training cell stays within the cha"
- Ch 19, l.330-331 (provenance statement echoing the source comment's provenance note): "The implementations below are derived independently from the chapter equations. There is n"
- Ch 19, l.453-454 (hash as audit device in prose): "The schedule hash makes that equality inspectable rather than aspirational."
- Ch 19, l.990-992 (correction narrative aimed at an upstream source (1.69 not yet introdu): "Kaplan's basic one-variable fits above do not contain an explicit additive $1.69$ floor; t"
- Ch 19, l.1039-1040 (defensive negation redundant with preceding sentence): "It is not a theorem that every language model has exactly three such terms."
- Ch 19, l.172, 853, 960, 1142 (captions) (templated defensive caption closer): "The displayed projection is random arithmetic, not a trained representation. / These are n"

## Edits by rule

| page | R9 | W1 | W6 | W7 | W8 | total |
|---|---:|---:|---:|---:|---:|---:|
| 08-cnn | 1 | 12 | 7 | 1 | 0 | 21 |
| 12-kernel-regression | 1 | 2 | 1 | 3 | 1 | 8 |
| 13-attention | 0 | 3 | 6 | 2 | 0 | 11 |
| 14-self-attention-transformer | 0 | 5 | 6 | 5 | 0 | 16 |
| 15-bert-pretraining | 0 | 5 | 4 | 6 | 0 | 15 |
| 16-vit-scaling | 0 | 5 | 5 | 5 | 0 | 15 |

## Rule-blind reader pass (P3)

One reader per rendered page, given only that page's HTML and VOICE.md's P3 instruction. Marks per page (ten listed plus the counted rest), by reason:

| page | contradicts | reads | announces | names | fragment | punctuation | grades | different |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 08-cnn | 5 | 15 | 0 | 24 | 0 | 3 | 1 | 3 |
| 12-kernel-regression | 3 | 4 | 1 | 9 | 0 | 1 | 1 | 4 |
| 13-attention | 4 | 9 | 1 | 5 | 2 | 0 | 1 | 0 |
| 14-self-attention-transformer | 5 | 4 | 2 | 7 | 2 | 6 | 1 | 2 |
| 15-bert-pretraining | 6 | 6 | 1 | 8 | 1 | 3 | 1 | 1 |
| 16-vit-scaling | 3 | 5 | 2 | 6 | 1 | 2 | 0 | 3 |

Nine marks fell on sentences this pass wrote or on edited paragraphs; B4 of the report resolves each. Seven number mismatches in baseline text go to B1; the other listed marks are baseline and are summarized in B2.

## I17: every added sentence (P24)

The I17 row above counts every stage's added sentences on the fourteen pages with edit lists; the P24 sentences are these.

**chapters/part2/08-cnn.qmd**

- `08-W1-1`: So we declare the kernel a parameter.
- `08-W1-2`: Out-channels add detectives.
- `08-W1-2`: In-channels let detectives read the whole stack.
- `08-W6-1`: REF left a practical problem: a MATH kernel on an MATH image yields only MATH outputs, because the window must stay inside the frame.
- `08-W6-2`: Now for the deepest design decision in the network, and it starts from the property REF established.
- `08-W6-3`: For classification this is the right trade, but it is a trade, and it will matter twice more in this book.
- `08-W6-5`: For our upcoming network the count runs: conv1 sees MATH MATH pooling nudges it to MATH MATH conv2's MATH window, at stride-2 spacing, expands it to MATH MATH the final pool reaches MATH , over half the frame in every direction, from nothing but MATH looks.
- `08-W6-6`: The CNN reaches global sight gradually, through depth; hold that thought until Part IV, where attention reaches global sight in a single step, at a different cost ( REF ).
- `08-W6-7`: There is the payoff.
- `08-W6-8`: And yet LeNet's curve falls too, and the fall teaches the architecture's fine print.
- `08-W1-3`: Before training, we audit the parameters, because parameter economy was half of REF 's sales pitch and REF 's MLP is the yardstick:
- `08-W1-4`: Against the MLP, LeNet carries 61,706 parameters to the MLP's 203,530 (less than a third) while performing far richer spatial computation.
- `08-W1-5`: Within LeNet, look where the parameters live.
- `08-W6-9`: Verify the receptive-field growth MATH .
- `08-W1-16`: Backpropagation through the slide follows the same fan-out rule we met in REF .
- `08-W1-17`: Think of nn modules as appliances: they have knobs and memory, and PyTorch carries their state around for you (nn.Conv2d owns its kernels and biases as nn.Parameters, registered for autograd and visible to the optimizer).
- `08-W1-18`: Before running, write down two predictions: LeNet's clean accuracy and LeNet at a two-pixel shift.
- `08-W1-19`: Take one last look inside, because REF also showed us what the MLP's first layer looked like (global, smeared, garment-shaped templates, REF ) and promised that structure would change:
- `08-W1-20`: And Part IV goes further: self-attention ( REF ) is so thoroughly position-agnostic that we will have to put position back in explicitly.

**chapters/part4/12-kernel-regression.qmd**

- `12-W6-2`: That is REF 's stable-softmax hygiene, applied to kernel scores.
- `12-W7-2`: Test-Time Training, the older Delta-style fast weights, Titans, MesaNet, and Wang and colleagues' Beyond Test-Time Memory differ in which part they change: the learned views of a token, the weighting of its history, the model or regularizer, or the online solver.
- `12-W8-1`: The opening example fills every kernel-regression role.
- `12-W8-1`: The query is the location MATH .
- `12-W8-1`: The keys are the stored locations 1, 3, and 5, and the values are their responses 1.5, 2.8, and 1.8.
- `12-W8-1`: Gaussian similarity at MATH , normalized, gives the weights MATH , and the output is the mixture MATH .
- `12-W8-1`: The sequence-memory roles have their own instance in REF 's date task.
- `12-W8-1`: When the decoder is about to write the year, its current state is the query; the encoder states at the source characters serve as keys to match and as values to read; and useful weights concentrate on the last four source characters, which spell the year.
- `12-W8-1`: REF measures how much weight lands there.
- `12-W1-7`: That is not a defect: the score defines what "similar" means.

**chapters/part4/13-attention.qmd**

- `13-W6-2`: For this date model, every shape is concrete:
- `13-W6-3`: REF warned that a model which throws away where must later put it back; REF does so with positional information.
- `13-W6-4`: REF 's differentiable-lookup promise is now kept: learned scores become a distribution over memory locations.
- `13-W1-7`: Remember REF 's sliding filter, which applied one learned rule everywhere.
- `13-W1-9`: Softmax over the wrong dimension would answer the wrong question.
- `13-W1-8`: Its year rows route 97.5% of validation weight to states indexed by the source-year region.
- `13-W1-8`: Parameter count and compute were not matched: the attentive model has 59.2% more parameters.
- `13-W6-5`: A CNN sees globally only by stacking local operations until its receptive field spans the input.
- `13-W6-6`: It reaches the whole input directly, at the cost of all query--key comparisons and, for now, of the RNNs that created those states sequentially.

**chapters/part4/14-self-attention-transformer.qmd**

- `14-W6-2`: In REF , convolution received locality “for free.
- `14-W6-2`: Global attention drops that built-in geometry, so position has to be added back explicitly.
- `14-W6-3`: Tensor shapes are the safest implementation guide:
- `14-W6-4`: REF returns to this MATH cost through Roofline analysis and FlashAttention's I/O-aware schedule.
- `14-W6-5`: REF introduced the residual stream: every block reads the stream and writes a correction back.
- `14-W6-6`: The rematch is not a referendum on all Transformers; it isolates what this small one gained and what it cost.
- `14-W6-7`: Sinusoidal clocks supply the sense of order that REF 's kernels had built in and global routing lacks, and their sine/cosine pairs turn relative shifts into rotations.
- `14-W1-8`: For frequency MATH , advancing by offset MATH is a rotation, so the geometric question has an algebraic answer:
- `14-W1-9`: This is REF 's normalization equation applied along a different axis.
- `14-W1-10`: The paired protocol is the experimental design:
- `14-W1-11`: … the body matches Listing 12.1; this chapter prints only what it changes.

**chapters/part4/15-bert-pretraining.qmd**

- `15-W1-1`: A [PAD] query row can still produce an output, which downstream computation ignores; real queries, however, can never retrieve padding as information.
- `15-W1-2`: All three share one idea: the vocabulary becomes a learned compromise between sequence length and reusable coverage.
- `15-W6-1`: Pretraining used BooksCorpus and English Wikipedia, about 3.3 billion words by the paper's count.
- `15-W1-3`: (The MLM loss is REF 's Case 1, a mean over exactly the selected positions.
- `15-W1-3`: The corruption policy defines the scored population, the batch mean estimates it without bias, and these counts make that denominator visible.
- `15-W1-4`: Did pretraining organize covered representations in a way that scarce labels could reuse, or did the classifier merely learn the tiny label set?
- `15-W6-2`: The combined T5 block summarizes the visibility of those separate sublayers; it is not one mask applied by the implementation.
- `15-W6-3`: Five Boolean rows keep BERT's controls separate.

**chapters/part4/16-vit-scaling.qmd**

- `16-W6-1`: Patchification silently changes sequence length, feature width, and the attention cost; one shape mistake propagates through the entire model.
- `16-W1-1`: ViT carries less image-specific bias, not none.
- `16-W6-2`: For one MATH image, a simple multiply–accumulate count gives about 1.19 million for the CNN and 1.16 million for the ViT, a 1.8% difference.
- `16-W6-3`: That count includes convolution, linear, and attention matrix products; it omits normalization, activations, softmax, pooling, memory traffic, and implementation effects.
- `16-W6-4`: REF supplies the missing count of bytes moved and the Roofline model, including why neither an operation count nor a dtype alone predicts elapsed time.
- `16-W6-5`: Their dot-product counts are close as well.
- `16-W1-2`: It demonstrates something narrower: the architecture ranking can reverse when the training regime changes.
- `16-W1-3`: The budget discipline outlasts the constants: when several resources jointly limit performance, scaling one while freezing the others can spend compute badly.

## Commands

```bash
python scripts/audit_voice_invariants.py --base 4828b2e --files <the six pages> \
  --html-before BASE --html-after _book --exceptions audits/voice/invariant_exceptions.json
python scripts/audit_voice_ledger.py --check _book
python scripts/audit_voice_ledger.py --phrases BASE _book --markdown PHRASES
python scripts/voice_apply_edits.py gate audits/voice/edits/*.json --stage P24 --html _book --out SECTION_A
python scripts/audit_frozen_stdout.py --base 4828b2e
python scripts/audit_excerpt_fixtures.py
npm test --prefix scripts/html-tests
```


## Freeze

No chapter re-executed. Each edit was spliced into the chapter source and into the
`result.markdown` of `_freeze/<chapter>/execute-results/html.json` and `tex.json`, and each
freeze `hash` was reset to the MD5 of the edited source (the documented prose-only
splice). `audit_frozen_stdout.py --base 4828b2e` passes: 137 stdout blocks and 1 text
display across 27 units, with 27 HTML/TeX pairs matching.
