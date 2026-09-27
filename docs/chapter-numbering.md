# Chapter numbering

Chapter numbers follow the reading order in `_quarto.yml`: Quarto numbers every chapter
whose title is not `.unnumbered`, in the order listed. Since the press program's W1
(September 2026) the three interludes are numbered chapters, so the chapter numbers from
7 on differ from the two-digit prefixes of the file names.

The rule: **file names and labels never change.** They are public URLs and anchors
(`docs/public-anchors.md` lists the ones the second volume links to). A chapter is named in
the manuscript only by its label: `@sec-08-cnn` renders "Chapter 9", `@sec-08-cnn's`
renders "Chapter 9's", and "Chapters [-@sec-07-filters-convolution] and [-@sec-08-cnn]"
renders "Chapters 8 and 9". Never type a chapter number into prose, a caption, or a
callout. Where a reference cannot resolve (a `code-summary` label, alt text, a replay
panel's HTML), write the number from the table below and check it after any reordering.

`scripts/chapter_numbers.py` derives `filters/chapter-numbers.json` from the reading
order; `filters/pdf-chapter-xrefs.lua` uses it to print chapter references in the PDF, and
`scripts/audit_book_contract.py` fails when the map is stale. Maintainer documents under
`docs/` and the file names keep the old two-digit numbers; hand-numbered listings follow
the chapter number (Listing 12.1 is in Chapter 12, file `10-sequences-rnn.qmd`).

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

The Preface, the Part pages' openers, the Epilogue, and the appendices are unnumbered or lettered as Quarto numbers them.
