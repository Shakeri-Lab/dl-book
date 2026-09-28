# W1 gate report: the interludes numbered as chapters

Branch `press` (cut from `main` at `c596579`, after the voice merge), pushed at this gate;
not merged. The three interludes are now Chapters 7, 11, and 17, and every chapter the
manuscript names is named by its label, so the rendered numbers follow the reading order.
File names, labels, anchors, and URLs are unchanged. Printed output is unchanged. The
evidence (validation, reader pass, reference check, code numbers, course-site labels) is in
`w1_audit.md`; the receipt is `w1/conversions.csv`, one row per conversion.

## The numbering

| Number | Title | File | Label |
|---:|---|---|---|
|  | Preface | `index.qmd` | `` |
| 1 | Linear Regression, the Mother Model | `chapters/part1/01-linear-regression.qmd` | `sec-01-linear-regression` |
| 2 | Linear Models that Classify: Logistic and Softmax | `chapters/part1/02-logistic-softmax.qmd` | `sec-02-logistic-softmax` |
| 3 | Nonlinearity and the MLP | `chapters/part1/03-nonlinearity-mlp.qmd` | `sec-03-nonlinearity-mlp` |
| 4 | Training: Loss and Stochastic Gradient Descent | `chapters/part1/04-training-loss-sgd.qmd` | `sec-04-training-loss-sgd` |
| 5 | Backpropagation | `chapters/part1/05-backpropagation.qmd` | `sec-05-backpropagation` |
| 6 | When It Fails: Generalization in Pictures, and Inductive Bias | `chapters/part1/06-generalization-inductive-bias.qmd` | `sec-06-generalization-inductive-bias` |
| 7 | Interlude: Who Trains the Trainer? Learning by Experiment | `chapters/interludes/learning-by-experiment.qmd` | `sec-learning-by-experiment` |
| 8 | Filters and Convolution (Fixed Kernels) | `chapters/part2/07-filters-convolution.qmd` | `sec-07-filters-convolution` |
| 9 | CNNs: Making the Filters Learnable | `chapters/part2/08-cnn.qmd` | `sec-08-cnn` |
| 10 | Modern CNNs and Transfer Learning | `chapters/part2/09-modern-cnns-transfer.qmd` | `sec-09-modern-cnns-transfer` |
| 11 | Interlude: Autoencoders: Making PCA Learnable | `chapters/interludes/making-pca-learnable.qmd` | `sec-interlude-autoencoders` |
| 12 | Sequences and Recurrence | `chapters/part3/10-sequences-rnn.qmd` | `sec-10-sequences-rnn` |
| 13 | Encoder–Decoder, Teacher Forcing, Beam Search | `chapters/part3/11-encoder-decoder.qmd` | `sec-11-encoder-decoder` |
| 14 | Kernel Regression: Attention Before It Was Learnable | `chapters/part4/12-kernel-regression.qmd` | `sec-12-kernel-regression` |
| 15 | Attention: Making the Kernel Learnable | `chapters/part4/13-attention.qmd` | `sec-13-attention` |
| 16 | Self-Attention and the Transformer | `chapters/part4/14-self-attention-transformer.qmd` | `sec-14-self-attention-transformer` |
| 17 | Interlude: Attention as Test-Time Regression | `chapters/interludes/attention-as-test-time-regression.qmd` | `sec-interlude-test-time-regression` |
| 18 | The BERT Moment: Pretraining as the New Regime | `chapters/part4/15-bert-pretraining.qmd` | `sec-15-bert-pretraining` |
| 19 | Vision Transformers and Scaling Laws | `chapters/part4/16-vit-scaling.qmd` | `sec-16-vit-scaling` |
| 20 | Adapting Pretrained Models: Prompting, PEFT, Quantization | `chapters/part5/17-peft-quantization.qmd` | `sec-17-peft-quantization` |
| 21 | Alignment and RL Fine-Tuning | `chapters/part5/18-alignment.qmd` | `sec-18-alignment` |
| 22 | Generative Models: From Codes to Samples | `chapters/part5/19-generative.qmd` | `sec-19-generative` |
| 23 | Multimodal Learning: One Space, Two Views | `chapters/part5/20-multimodal.qmd` | `sec-20-multimodal` |
|  | Epilogue: The Question Is Yours | `chapters/epilogue.qmd` | `sec-epilogue` |

## Conversions per page

267 conversions on 29 pages: 240 mechanical, 27 by hand.

| page | mechanical | by hand |
|---|---:|---:|
| `chapters/part4/13-attention.qmd` | 30 | 1 |
| `chapters/part2/08-cnn.qmd` | 29 | 1 |
| `chapters/part3/10-sequences-rnn.qmd` | 21 | 7 |
| `chapters/part4/14-self-attention-transformer.qmd` | 20 | 4 |
| `chapters/part4/12-kernel-regression.qmd` | 18 | 1 |
| `chapters/part2/09-modern-cnns-transfer.qmd` | 14 | 0 |
| `chapters/part4/15-bert-pretraining.qmd` | 13 | 0 |
| `chapters/appendices/a2-tensors.qmd` | 7 | 5 |
| `chapters/part3/11-encoder-decoder.qmd` | 10 | 0 |
| `chapters/part5/20-multimodal.qmd` | 10 | 0 |
| `chapters/part4/16-vit-scaling.qmd` | 8 | 1 |
| `chapters/interludes/attention-as-test-time-regression.qmd` | 8 | 0 |
| `chapters/part1/02-logistic-softmax.qmd` | 6 | 2 |
| `chapters/interludes/learning-by-experiment.qmd` | 7 | 0 |
| `chapters/appendices/a3-precision-performance.qmd` | 5 | 0 |
| `chapters/appendices/a4-notation.qmd` | 4 | 1 |
| `chapters/epilogue.qmd` | 4 | 1 |
| `chapters/part2/07-filters-convolution.qmd` | 5 | 0 |
| `chapters/part5/17-peft-quantization.qmd` | 5 | 0 |
| `chapters/part5/18-alignment.qmd` | 4 | 0 |
| `chapters/appendices/a5-statistical-learning.qmd` | 2 | 1 |
| `chapters/part5/19-generative.qmd` | 3 | 0 |
| `chapters/part1/06-generalization-inductive-bias.qmd` | 2 | 0 |
| `index.qmd` | 0 | 2 |
| `chapters/interludes/making-pca-learnable.qmd` | 1 | 0 |
| `chapters/part1/01-linear-regression.qmd` | 1 | 0 |
| `chapters/part1/03-nonlinearity-mlp.qmd` | 1 | 0 |
| `chapters/part1/04-training-loss-sgd.qmd` | 1 | 0 |
| `chapters/part1/05-backpropagation.qmd` | 1 | 0 |

## Sentences that changed beyond a number

The brief expected none. Nine did, each shown in its paragraph as it now renders, with the
changed sentence in bold.

**`chapters/appendices/a2-tensors.qmd`.** A range across two interludes became a list (old "Chapters 13–16").

> The entries in Table B.1 are contracts, not universal laws. An external library or dataset may choose a different order. Convert once at the boundary: assert the result, and then follow one convention internally. Chapter 9 establishes NCHW for images (Chapter 9); Chapter 12 establishes batch-first sequences (Chapter 12); **Chapters 15, 16, 18, and 19 extend that sequence convention to source positions, heads, masks, and image patches.**

**`chapters/appendices/a2-tensors.qmd`.** A range became a list, and the sentence's duplicated references ("… derive those modeling choices in Chapter 15, Chapter 16, and Chapter 18") merged into the list.

> The unscaled result shape is (B,N_h,T,S). After scaling and masking, attention softmax belongs on dim=-1: each query distributes weight over its S keys. A key-validity mask (B,S) becomes (B,1,1,S) so it broadcasts across heads and queries. A causal mask (T,S) broadcasts across batch and heads; changing either mask axis changes which information the model may use. **Chapters 15, 16, and 18 derive those modeling choices.**

**`chapters/appendices/a2-tensors.qmd`.** A range across an interlude became a list (old "Chapters 13–15").

> Use selection when the desired object really is “all valid rows,” as when flattening only supervised positions for a loss. Use masked_fill or torch.where when later operations still need the original axes. **Attention masks in Chapters 15, 16, and 18 preserve the score grid;** padding-aware token losses often select or flatten supervised rows. The operation should follow the question, not habit.

**`chapters/appendices/a2-tensors.qmd`.** R9: the baseline read "In the Chapter 1 Chapter 1's coding session".

> Here is a PyTorch bug that did not begin with an error message. **In Chapter 1’s coding session, a prediction had shape (N,) while a noise column had shape (N, 1).** Adding them did not produce (N, 1). PyTorch compared the axes from the right, expanded both inputs, and legally returned (N, N). The calculation ran; the meaning was wrong.

**`chapters/part1/02-logistic-softmax.qmd`.** A range across an interlude became a list (old "Chapters 14 to 16").

> Later models split into two parts. A backbone (also called the trunk) turns raw inputs such as pixels or tokens into a representation \(\featurepart{\vect{h}} = \phi_{\theta}(\featurepart{\vect{x}})\), and a small head reads the task’s answer off that representation. **The backbone changes dramatically across the book, from multilayer perceptrons (Chapter 3) to convolutional stacks (Chapters 9 and 10) and Transformers (Chapters 16, 18, and 19);** the head usually stays this small linear map. Because the two are separate, either can be swapped. Adapting a pretrained model to new classes often keeps its backbone and trains only a fresh head (Chapters 10, 18, and 20), and one backbone can feed several heads at once: a softmax head for a label beside a linear-regression head for a coordinate.

**`chapters/part3/10-sequences-rnn.qmd`.** "one chapter ago" became "two chapters ago": the PCA interlude is now Chapter 11.

> Preserved by default. Repeated multiplication killed the signal \(\rightarrow\) make the carried state additive: \(\vect{c}_t = \vect{c}_{t-1} + \Delta_t\). A conveyor belt: information rides along untouched unless something deliberately intervenes. **You met this exact maneuver two chapters ago:** Chapter 10’s residual connection, \(H(x) = F(x) + x\), whose Jacobian’s identity term let gradients cross forty layers. Same trick, laid across time.

**`chapters/part3/10-sequences-rnn.qmd`.** "the nine chapters you have already read" became "nine of the chapters": the reader has read eleven.

> Time to put fixed windows, clipping, gates, and Chapter 2’s softmax over a vocabulary to work on real text. **In keeping with a book whose every experiment runs on its own pages, the training corpus is nine of the chapters you have already read:** their prose, stripped of code cells, about 150,000 characters. We commit that code-stripped text as a benchmark snapshot; later copyedits must not silently change the task. The task is the oldest one in language modeling: read a character, predict the next.

**`chapters/part4/14-self-attention-transformer.qmd`.** The corpus is the old Chapters 1 to 9, now Chapters 1–6 and 8–10.

> A fair rematch begins by preserving what can be preserved. **Chapter 12 trained on a committed snapshot of Chapters 1–6 and 8–10 with executable code cells and HTML comments removed:** 148,594 characters, vocabulary 104, a contiguous 90/10 split, 100-character windows, batch size 64, and 2,501 updates with Adam at learning rate 0.002 and gradient clipping at norm 1. The snapshot keeps later copyedits from moving the benchmark. The held-out metric resets state at each fixed window.

**`chapters/interludes/attention-as-test-time-regression.qmd`.** Unchanged source; the page is now numbered, so Quarto prints "Chapter 12" where it printed the target's number and title.

> **The fixed-size state could not hold everything in Chapter 12.** It still cannot. Now we know the price list on which that failure was one entry. Keeping the dataset buys uncompressed access at growing cost; sufficient statistics buy an exact stream for a restricted kernel; online updates buy a steerable fixed state and accept interference. The RNN state has returned as a statistical choice rather than a design we were supposed to declare dead.


## Found and fixed during W1

- **PDF numbers from label digits.** `filters/pdf-chapter-xrefs.lua` printed "Chapter 8" for
  `sec-08-cnn`. It now reads `filters/chapter-numbers.json`, which
  `scripts/chapter_numbers.py` derives from the reading order; the contract audit fails if
  the map is stale.
- **PDF bookmarks.** A heading that opens with a chapter reference lost the reference in the
  PDF outline (the outline audit caught two). The filter now returns a Pandoc link, which
  keeps its words in the bookmark.
- **Unnumbered pages.** Quarto prints a chapter reference made from the Preface or the
  Epilogue as the target's number and full title ("6 When It Fails: … 's shift cliff"). The
  filter now writes "Chapter N" links there.
- **Heading anchors.** Four headings that now contain a reference keep their old slugs as
  explicit ids.
- **Bold text.** At the start of bold text an ASCII apostrophe after a reference breaks the
  bold markup; Chapter 14's recap item uses U+2019 (recorded in `docs/chapter-numbering.md`).
- **Split references.** The independent reference check found four references still showing
  old numbers; all had "Chapter" and its number on different source lines. A whole-text scan
  found 13 such splits, now converted.
- **Counts.** The reader pass found two counts the renumbering made wrong (Chapter 12's
  "one chapter ago" and "the nine chapters you have already read").
- **Floats.** The interludes' custom float kinds (EX., AE., TTR.) became plain figures and
  tables numbered with their chapter; the old ids stay as anchor aliases, and the two
  experiment tables keep their H placement. The PDF audit now requires the new captions.

## Decisions pending, each with a default

1. **D-W1.1** "Interlude:" stays in the numbered titles. *Applied as the default.*
2. **D-W1.2** The Epilogue stays unnumbered, with its E. figure sequence. *Applied.*
3. **D-W1.3 Numbers inside code.** Thirteen are now stale, and some are seen: the Epilogue
   figure draws "Ch. 17 ICL" and "(Ch. 18)", Chapter 16's bar chart labels "Ch. 10 LSTM",
   comments read "# Listing 10.1, imported", and the printed listings' docstrings name
   "Chapter 10" (seven in `code/dlbook/*.py`). *Default:* change them in W2 phase 2, where
   figure code changes by design and the figures regenerate.
4. **D-W1.4 Duplicated references in the appendices.** Eight sentences name a chapter and
   then point to it again in parentheses ("Chapter 20 treats those choices … (Chapter 20)");
   this was the appendices' convention before W1 and read the same way. *Default:* drop the
   parenthetical in W2 phase 1, with receipts.
5. **D-W1.5 Two baseline doubts from the reference check.** Chapter 15: "Remember Chapter
   8's sliding filter: one learned rule, applied everywhere" (Chapter 8's filters are fixed;
   the learned rule is Chapter 9's). Appendix C: "In Chapter 16's regression language"
   (the regression reading of attention is Chapter 14's). *Default:* yours to decide.
6. **D-W1.6 The course site** (`dl-course-site`, `lib/module-extras.ts`) labels its book
   links with the old numbers; the links work, but the labels are stale (list in
   `w1_audit.md`). *Default:* you change them there, or say so and I open a pull request.

## Not converted, by design

The Preface's revision notes keep the numbers of their time (a new note says so); numbers
inside code and printed output stay (D-W1.3); the second volume's chapter citation stays;
HTML and JavaScript comments in the replay panels are not shown to readers; and
`data/book-corpus-ch1-9.txt`, the frozen language-model corpus, keeps its name and text.

## Validation

Every rendered chapter reference (425) shows the number of the chapter it links to; no
reference is unresolved; the interludes' captions read Figure 7.1, Table 7.1, Figure 11.1,
and Figure 17.1; ids and link targets are a superset of the pre-W1 render, apart from
Quarto's internal caption ids and the links that now target the plain float ids; once
numbers are masked, the rendered text differs from the pre-W1 render only in the 52
places listed in `w1_audit.md` (interlude section numbers, dropped EX./AE./TTR. prefixes,
and the nine sentences above). Printed output is identical (136 stdout blocks, 27 HTML/TeX
pairs), every figure the W1 renders regenerated was pixel-identical to its committed
bytes (109 after the full re-execution, 35 after the last), and the
book contract, Plan to Code, Python sources, public anchors, replay fixtures, HTML assets,
notebook exports, the HTML interaction suite (2,130 tests), the voice register check, and
the PDF audit pass. The print PDF runs 554 pages (556 before W1) with 399 outline
entries.
