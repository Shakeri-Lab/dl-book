# W1 audit

Evidence behind `w1_report.md`.

## Rendered validation (`w1_validate.py`: pre-W1 render against the final render)

# W1 validation (rendered)

- 1. Chapter cross-references rendered: 425; wrong number: 0
- 2. Unresolved references (?@...): 0
- 3. learning-by-experiment.html: chapter 7; captions 4, numbered 7.x: 4, old-style: 0
- 3. making-pca-learnable.html: chapter 11; captions 4, numbered 11.x: 4, old-style: 0
- 3. attention-as-test-time-regression.html: chapter 17; captions 2, numbered 17.x: 2, old-style: 0
- 4. Pages losing ids: 5; link instances lost: 8; link instances added: 285 (to chapter labels: 1)
- 5. Text differences beyond numbers: 52 (listed below)
- 6. PDF: 382 'Chapter N' strings; highest number 23; 'Chapter 1' count 44

## Failures

- ids lost: ('chapters/interludes/attention-as-test-time-regression.html', ['b28763e0', 'e40f3fc4', 'ttrfig-memory-capacity-spectrum-caption-0ceaefa1-69ba-4598-a22c-09a6ac19f8ca', 'ttrfig-solver-costs-caption-0ceaefa1-69ba-4598-a22c-09a6ac19f8ca'], 4)
- ids lost: ('chapters/interludes/learning-by-experiment.html', ['4072699b', 'e76cc503', 'exfig-experiment-estimands-caption-0ceaefa1-69ba-4598-a22c-09a6ac19f8ca', 'exfig-experiment-loop-caption-0ceaefa1-69ba-4598-a22c-09a6ac19f8ca', 'extbl-batchnorm-study-contract-caption-0ceaefa1-69ba-4598-a22c-09a6ac19f8ca'], 6)
- ids lost: ('chapters/interludes/making-pca-learnable.html', ['25c5907b', '31082051', '68298a2f', 'aefig-convolutional-denoising-ae-caption-0ceaefa1-69ba-4598-a22c-09a6ac19f8ca', 'aefig-decoder-ambiguity-caption-0ceaefa1-69ba-4598-a22c-09a6ac19f8ca'], 10)
- ids lost: ('chapters/part5/18-alignment.html', ['2d61ed0b', '303eb133', 'fb90463e'], 3)
- ids lost: ('chapters/part5/19-generative.html', ['f33d128a'], 1)
- link lost: ('chapters/interludes/attention-as-test-time-regression.html', '#ttrfig-solver-costs', 2)
- link lost: ('chapters/interludes/learning-by-experiment.html', '#extbl-experiment-claim-types', 2)
- link lost: ('chapters/interludes/learning-by-experiment.html', '#extbl-batchnorm-study-contract', 2)
- link lost: ('index.html', './chapters/part1/06-generalization-inductive-bias.html', 1)
- link lost: ('index.html', './chapters/part4/16-vit-scaling.html', 1)

## Text differences beyond numbers

- `chapters/appendices/a2-tensors.html`
  - before: begin with an error message. In the Chapter # Chapter #’s coding session, a prediction
  - after: begin with an error message. In Chapter #’s coding session, a prediction
- `chapters/appendices/a2-tensors.html`
  - before: establishes batch-first sequences (Chapter #); Chapters #–# extend that sequence convention to source
  - after: establishes batch-first sequences (Chapter #); Chapters #, #, #, and # extend that sequence convention to source
- `chapters/appendices/a2-tensors.html`
  - before: information the model may use. Chapters #–# derive those modeling choices in Chapter
  - after: information the model may use. Chapters #, #, and # derive those modeling choices. Read the
- `chapters/appendices/a2-tensors.html`
  - before: use. Chapters #–# derive those modeling choices in Chapter #, Chapter #, and Chapter #. Read the einsum string as an
  - after: #, and # derive those modeling choices. Read the einsum string as an
- `chapters/appendices/a2-tensors.html`
  - before: original axes. Attention masks in Chapters #–# preserve the score grid; padding-aware token
  - after: original axes. Attention masks in Chapters #, #, and # preserve the score grid; padding-aware token
- `chapters/interludes/attention-as-test-time-regression.html`
  - before:  Attention: Learning the Similarity Interlude: Attention as Test-Time Regression Interlude:
  - after:  Attention: Learning the Similarity # Interlude: Attention as Test-Time Regression #
- `chapters/interludes/attention-as-test-time-regression.html`
  - before: Similarity Interlude: Attention as Test-Time Regression Interlude: Attention as Test-Time Regression Source
  - after: # Interlude: Attention as Test-Time Regression # Interlude: Attention as Test-Time Regression Source
- `chapters/interludes/attention-as-test-time-regression.html`
  - before: and which statistical contract it accepts. One regression, three solvers The Transformer
  - after: and which statistical contract it accepts. # One regression, three solvers The Transformer
- `chapters/interludes/attention-as-test-time-regression.html`
  - before: ledger here. The price list Figure TTR.#: The solver map compares retained state
  - after: ledger here. The price list Figure #: The solver map compares retained state
- `chapters/interludes/attention-as-test-time-regression.html`
  - before: ledger. The asymptotic labels in Figure TTR.# name this dense educational setup, not
  - after: ledger. The asymptotic labels in Figure # name this dense educational setup, not
- `chapters/interludes/attention-as-test-time-regression.html`
  - before: recall under a fixed capacity Figure TTR.# makes a prediction we can test
  - after: recall under a fixed capacity Figure # makes a prediction we can test
- `chapters/interludes/attention-as-test-time-regression.html`
  - before: value MSE=#.43e-#; max trial MSE=#.55e-# Figure TTR.#: A sealed synthetic mechanism test. The
  - after: value MSE=#.43e-#; max trial MSE=#.55e-# Figure #: A sealed synthetic mechanism test. The
- `chapters/interludes/attention-as-test-time-regression.html`
  - before: state could not hold everything in # Sequences and Recurrence. It still cannot. Now we know
  - after: state could not hold everything in Chapter #. It still cannot. Now we know
- `chapters/interludes/attention-as-test-time-regression.html`
  - before: state overwrite as its load grows? Okay, so: the solver is part
  - after: state overwrite as its load grows? # Okay, so: the solver is part
- `chapters/interludes/learning-by-experiment.html`
  - before:  Interlude: Who Trains the Trainer? Learning
  - after:  # Interlude: Who Trains the Trainer? Learning
- `chapters/interludes/learning-by-experiment.html`
  - before: but they answer different questions. Figure EX.#: The two levels of learning. Inside
  - after: but they answer different questions. Figure #: The two levels of learning. Inside
- `chapters/interludes/learning-by-experiment.html`
  - before: each run it launches costs budget. Two levels of learning Recall the
  - after: each run it launches costs budget. # Two levels of learning Recall the
- `chapters/interludes/learning-by-experiment.html`
  - before: disappear when a library automates them. Start with the claim, not the
  - after: disappear when a library automates them. # Start with the claim, not the
- `chapters/interludes/learning-by-experiment.html`
  - before: types should not be mixed; Table EX.# separates them: Claim What is held
  - after: types should not be mixed; Table # separates them: Table #: Four claim
- `chapters/interludes/learning-by-experiment.html`
  - before: be mixed; Table EX.# separates them: Claim What is held fixed? What
  - after: be mixed; Table # separates them: Table #: Four claim types require different controls and support different conclusions. Claim What is held fixed? What
- `chapters/interludes/learning-by-experiment.html`
  - before: this performance in the declared regime.” Table EX.#: Four claim types require different controls and support different conclusions. A single seeded run can be
  - after: this performance in the declared regime.” A single seeded run can be
- `chapters/interludes/learning-by-experiment.html`
  - before: order has introduced for general use. A worked experiment: BatchNorm changes the
  - after: order has introduced for general use. # A worked experiment: BatchNorm changes the
- `chapters/interludes/learning-by-experiment.html`
  - before: we pin the contract in Table EX.#: Item Predeclared choice Development data #,#
  - after: we pin the contract in Table #: Table #: The predeclared contract for the paired BatchNorm study. Item Predeclared choice Development data #,#
- `chapters/interludes/learning-by-experiment.html`
  - before: accuracy; restore each run’s best checkpoint Table EX.#: The predeclared contract for the paired BatchNorm study. Notice what has not happened: we
  - after: accuracy; restore each run’s best checkpoint Notice what has not happened: we
- `chapters/interludes/learning-by-experiment.html`
  - before: question; the code preserves both. Figure EX.#: One experiment, several estimands. Left: mean
  - after: question; the code preserves both. Figure #: One experiment, several estimands. Left: mean
- `chapters/interludes/learning-by-experiment.html`
  - before: deviations across seeds, not confidence intervals. Ablation is an argument about cause
  - after: deviations across seeds, not confidence intervals. # Ablation is an argument about cause
- `chapters/interludes/learning-by-experiment.html`
  - before: shared recipe or equal tuning opportunity. Hyperparameter optimization is a budgeted outer
  - after: shared recipe or equal tuning opportunity. # Hyperparameter optimization is a budgeted outer
- `chapters/interludes/learning-by-experiment.html`
  - before: state instead of moving between them. Train, validation, and test have different
  - after: state instead of moving between them. # Train, validation, and test have different
- `chapters/interludes/learning-by-experiment.html`
  - before: untouched audit for the revised procedure. Seeds are a panel, not decoration
  - after: untouched audit for the revised procedure. # Seeds are a panel, not decoration
- `chapters/interludes/learning-by-experiment.html`
  - before: calibrated to a CPU-scale teaching regime. The experiment ledger If a result
  - after: calibrated to a CPU-scale teaching regime. # The experiment ledger If a result
- `chapters/interludes/learning-by-experiment.html`
  - before: cannot decide what the comparison means. A protocol for the rest of
  - after: cannot decide what the comparison means. # A protocol for the rest of
- `chapters/interludes/learning-by-experiment.html`
  - before: sequence: Name the question. Use Table EX.#: mechanism, fixed-protocol effect, tuned performance, or
  - after: sequence: Name the question. Use Table #: mechanism, fixed-protocol effect, tuned performance, or
- `chapters/interludes/learning-by-experiment.html`
  - before: or failure could reverse the conclusion? Okay, so: tune the contender, ablate
  - after: or failure could reverse the conclusion? # Okay, so: tune the contender, ablate
- `chapters/interludes/learning-by-experiment.html`
  - before: changing any other choice in Table EX.#. Do the selected rates land on
  - after: changing any other choice in Table #. Do the selected rates land on
- `chapters/interludes/making-pca-learnable.html`
  - before:  Interlude: Autoencoders: Making PCA Learnable Source
  - after:  # Interlude: Autoencoders: Making PCA Learnable Source
- `chapters/interludes/making-pca-learnable.html`
  - before: not yet a variable-length process. Figure AE.#: The encoder–decoder detour solves one problem
  - after: not yet a variable-length process. Figure #: The encoder–decoder detour solves one problem
- `chapters/interludes/making-pca-learnable.html`
  - before: updates as each new piece arrives. Compress, then reconstruct Set random sampling
  - after: updates as each new piece arrives. # Compress, then reconstruct Set random sampling
- `chapters/interludes/making-pca-learnable.html`
  - before: claim, not a consequence of \(k&lt;d\). Make PCA learnable Appendix A computes
  - after: claim, not a consequence of \(k&lt;d\). # Make PCA learnable Appendix A computes
- `chapters/interludes/making-pca-learnable.html`
  - before: state instead of moving between them. What if the map could bend?
  - after: state instead of moving between them. # What if the map could bend?
- `chapters/interludes/making-pca-learnable.html`
  - before: # # # # # Figure AE.#: A one-dimensional bottleneck behaves differently when
  - after: # # # # # Figure #: A one-dimensional bottleneck behaves differently when
- `chapters/interludes/making-pca-learnable.html`
  - before: true manifold or its preferred coordinates. A code is not yet a
  - after: true manifold or its preferred coordinates. # A code is not yet a
- `chapters/interludes/making-pca-learnable.html`
  - before: # g1(#): # g2(#): -# Figure AE.#: Reconstruction does not identify a latent
  - after: # g1(#): # g2(#): -# Figure #: Reconstruction does not identify a latent
- `chapters/interludes/making-pca-learnable.html`
  - before: changes what the code must preserve. Let the autoencoder see locally A
  - after: changes what the code must preserve. # Let the autoencoder see locally A
- `chapters/interludes/making-pca-learnable.html`
  - before: transposed-convolution adjoint relative gap #.15e-# Figure AE.#: The input–target contract determines what the
  - after: transposed-convolution adjoint relative gap #.15e-# Figure #: The input–target contract determines what the
- `chapters/interludes/making-pca-learnable.html`
  - before: same architecture is rewarded for learning. Why a one-shot encoder cannot be
  - after: same architecture is rewarded for learning. # Why a one-shot encoder cannot be
- `chapters/interludes/making-pca-learnable.html`
  - before: distribution or a variable-length update rule? Okay, so: PCA became a network,
  - after: distribution or a variable-length update rule? # Okay, so: PCA became a network,
- `chapters/part1/02-logistic-softmax.html`
  - before: # and #) and Transformers (Chapters # to #); the head usually stays this
  - after: # and #) and Transformers (Chapters #, #, and #); the head usually stays this
- `chapters/part3/10-sequences-rnn.html`
  - before: intervenes. You met this exact maneuver one chapter ago: Chapter #’s residual connection, \(H(x)
  - after: intervenes. You met this exact maneuver two chapters ago: Chapter #’s residual connection, \(H(x)
- `chapters/part3/10-sequences-rnn.html`
  - before: own pages, the training corpus is the nine chapters you have already
  - after: own pages, the training corpus is nine of the chapters you have already read:
- `chapters/part3/10-sequences-rnn.html`
  - before: pages, the training corpus is the nine chapters you have already read: their
  - after: training corpus is nine of the chapters you have already read: their
- `chapters/part4/14-self-attention-transformer.html`
  - before: a committed snapshot of Chapters #–# with executable code cells and HTML
  - after: a committed snapshot of Chapters #–# and #–# with executable code cells and HTML
- `index.html`
  - before: build · September #, # · HTML edition only The website now
  - after: build · September #, # · Interludes numbered as chapters The three interludes are now numbered chapters: Learning by Experiment is Chapter #, Making PCA Learnable is Chapter #, and Attention as Test-Time Regression is Ch


## Independent reference check (Antigravity, rule-blind)

Every chapter number in the 334 rendered paragraphs that name a chapter was checked against
the chapter it names by title: 16 entries were raised. The four real misses (split
references) are fixed; seven are revision notes, kept as history; one is the second
volume's chapter, correct; two are the baseline doubts of D-W1.5; the rest are revision
notes marked doubtful.

| verdict | page | number | sentence | reason |
|---|---|---:|---|---|
| mismatch | `chapters/part2/08-cnn.html` | 7 | Before training, the parameter audit (because parameter economy was half of Chapter 7’s sales pitch, and Chapter 6’s MLP | chapters/part2/08-cnn.qmd:540: Parameter economy via weight sharing was the sales pitch of Filters and Convolution (Chapter 8, old file 07-f |
| mismatch | `chapters/part2/09-modern-cnns-transfer.html` | 8 | Chapter 8 said the remaining shift-cliff was the flatten head’s fault: it reads the final grid positionally. | chapters/part2/09-modern-cnns-transfer.qmd:410: The flatten head and its shift-cliff failure mode were introduced and analyzed with LeNet in |
| mismatch | `chapters/part4/13-attention.html` | 11 | Numeric dates can be ambiguous, so we retain the same unambiguous subsets as Chapter 11. | chapters/part4/13-attention.qmd:685: The unambiguous date format benchmark was introduced for the seq2seq model in Encoder-Decoder, Teacher  |
| mismatch | `chapters/part4/15-bert-pretraining.html` | 16 | Pretraining is a regime, not an architecture; Chapter 16 will ask what changes when an encoder leaves text for images an | chapters/part4/15-bert-pretraining.qmd:1696: Applying encoders to image patches and studying scaling laws is the subject of Vision Transform |
| mismatch | `index.html` | 9 | Chapter 5 now develops backpropagation as a recursion on layer sensitivities, with redrawn figures, a new figure of four | index.qmd:366: BatchNorm is introduced in Modern CNNs and Transfer Learning (Chapter 10, old file 09-modern-cnns-transfer.qmd). Chapter 9 bu |
| mismatch | `index.html` | 7 | Chapter 7 now states directly why it builds convolution with fixed kernels first and what changes when the kernel is lea | index.qmd:372: Building convolution with fixed kernels first is the subject of Filters and Convolution (Fixed Kernels) (Chapter 8, old file  |
| mismatch | `index.html` | 14 | Printed experimental outputs are unchanged, except that Chapter 14’s training printout again matches the numbers its tex | index.qmd:378: Kernel regression in Chapter 14 is non-parametric and has no training loop or training printout. The training printout belong |
| mismatch | `index.html` | 11 | Chapter 11 now includes a small probability tree showing how the best next token can miss the best complete sequence. | index.qmd:383: The probability tree and beam search mechanism replay belong to Encoder-Decoder, Teacher Forcing, Beam Search (Chapter 13, ol |
| mismatch | `index.html` | 18 | The live post-v1.2.1 book adds Appendix E as an optional statistical-contract reference, replaces Chapter 1’s bias–varia | index.qmd:488: Alignment contracts and RL fine-tuning belong to Alignment and RL Fine-Tuning (Chapter 21, old file 18-alignment.qmd). Chapte |
| mismatch | `index.html` | 10 | It also pins the Chapter 1–9 corpus used by the Chapter 10/14 language-model rematch, completes the figure-description a | index.qmd:524: The language-model rematch baseline is the LSTM from Sequences and Recurrence (Chapter 12, old file 10-sequences-rnn.qmd). Ch |
| mismatch | `index.html` | 14 | It also pins the Chapter 1–9 corpus used by the Chapter 10/14 language-model rematch, completes the figure-description a | index.qmd:524: The language-model rematch evaluates the Transformer from Self-Attention and the Transformer (Chapter 16, old file 14-self-at |
| doubtful | `chapters/part1/05-backpropagation.html` | 11 | Shakeri, Deep Learning: Making It Trainable, Chapter 11, “The Gradient Has a Memory: Reverse Accumulation and Checkpoint | chapters/part1/05-backpropagation.qmd:953: The cited chapter is Chapter 11 of the companion volume (Deep Learning: Making It Trainable), not |
| doubtful | `index.html` | 14 | The canonical HTML repairs Chapter 14’s Sources heading and gives every figure an accessible description. | index.qmd:449: In release notes from this period, Chapter 14 refers to file 14-self-attention-transformer.qmd (Chapter 16). Although Chapter |
| doubtful | `index.html` | 1–9 | It also pins the Chapter 1–9 corpus used by the Chapter 10/14 language-model rematch, completes the figure-description a | index.qmd:523: The language-model training corpus spans Chapters 1-6 and 8-10 (omitting interlude Chapter 7). Naming it Chapter 1-9 uses old |
| doubtful | `chapters/part4/13-attention.html` | 8 | Remember Chapter 8’s sliding filter: one learned rule, applied everywhere. | chapters/part4/13-attention.qmd:175: Chapter 8 is explicitly titled "Fixed Kernels" and uses hand-crafted filters; the "learned rule" is int |
| doubtful | `chapters/appendices/a3-precision-performance.html` | 16 | In Chapter 16’s regression language, this is not a separate mysterious memory: the KV cache is the nonparametric estimat | chapters/appendices/a3-precision-performance.qmd:580: The regression language framing attention as a nonparametric estimator belongs to Chap |

## Rule-blind reader pass (Antigravity, the calibrated P3 instruction)

181 marks on the 334 paragraphs. Almost all are baseline style on sentences W1 did not
touch (apparatus 60, fragment 40, announces 21, rule 21, punctuation 18, number 15, voice
6); per the standing rule they are counted, not fixed. Acted on: the four split references
(marked "number"), the two counts, and the R9 slip. The full marks follow.

## chapters/appendices/a1-linear-algebra.html
1 | Low-rank factors limited an update in Chapter 20, and PCA supplied the flat reconstruction baseline in the autoencoder interlude. | apparatus
2 | It also explains why the autoencoder interlude compares PCA and a tied linear autoencoder through their projectors, not through individual basis vectors. | apparatus
Beyond ten: none

## chapters/appendices/a2-tensors.html
1 | In the Chapter 1 Chapter 1’s coding session, a prediction had shape (N,) while a noise column had shape (N, 1). | punctuation
3 | Chapter 5 develops that machinery in Chapter 5. | punctuation
4 | The entries in Table B.1 are contracts, not universal laws. | apparatus
4 | Chapter 9 establishes NCHW for images (Chapter 9); Chapter 12 establishes batch-first sequences (Chapter 12); Chapters 15, 16, 18, and 19 extend that sequence convention to source positions, heads, masks, and image patches. | punctuation
5 | Appendix A develops the geometry of these products in Appendix A. | punctuation
5 | Let | fragment
8 | Chapter 20 applies that distinction to stored and computed weights (Chapter 20), while Appendix C explains what a floating-point dtype can actually represent. | punctuation
9 | That separation turns Chapter 4’s minibatch symbol \(B\) into an explicit software boundary (Chapter 4). | punctuation
Beyond ten: none

## chapters/appendices/a3-precision-performance.html
10 | For one dense attention head, Chapter 15 and Chapter 16 compute | fragment
2 | Chapter 20 treats those choices as quantization policies rather than magical calls to tensor.to(...) (Chapter 20). | punctuation
6 | Chapter 12’s default forget-gate factor compounds to \(0.5^{80}=8.27\times10^{-25}\) (Chapter 12). | punctuation
9 | Chapter 20 adds this linear-size cache to the total-memory ledger (Chapter 20). | punctuation
2 | Two other names appear frequently in deep learning: TF32 is a matrix-compute mode, not a tensor storage dtype: supported operations keep FP32 storage and range while using reduced input precision for multiplication and wider accumulation. | punctuation
Beyond ten: none

## chapters/appendices/a4-notation.html
3 | Temperature: kernel bandwidth through \(\tau=2h^2\) in Chapter 14, attention sharpness, or contrastive-logit scale with \(\tau=e^{-\gamma}\) in Chapter 23 | fragment
1 | Appendix A develops the linear algebra behind the symbols (Appendix A), while Appendix B develops their tensor and PyTorch contracts (Appendix B). | punctuation
2 | The dictionary records recurring habits; it does not license skipping a section’s definitions. | apparatus
Beyond ten: none

## chapters/appendices/a5-statistical-learning.html
2 | For a label-preserving input map \(T\), the shifted risk is | fragment
1 | Come here when you want to audit the whole chain: | announces
Beyond ten: none

## chapters/epilogue.html
Beyond ten: none

## chapters/interludes/attention-as-test-time-regression.html
6 | For a query \(\vect{q}\), softmax attention solves the local-constant problem | fragment
3 | The views. | fragment
4 | The history weights. | fragment
5 | The model and regularizer. | fragment
Beyond ten: none

## chapters/interludes/learning-by-experiment.html
3 | Before running anything, we pin the contract in Table 7.2: | apparatus
4 | The 600-image file is not a globally sealed test set: Chapter 6 has already used the same book benchmark, and Chapters 9 and 10 will reuse it later. | rule
4 | Within this worked study, its values remain decision-inert; we do not inspect them until the designs and learning rates are locked, and we make no change afterward. | rule
4 | This is a demonstration of the protocol, not a claim that reused public data became untouched again. | rule
5 | The optimizer race in Chapter 4 is a fixed recipe, so it describes that recipe. | rule
5 | Chapter 6 uses one seeded sweep as a mechanism demonstration, not a scaling law. | rule
5 | The point is not to make every chapter a publication-scale benchmark. | rule
2 | Treat it as a labeled measuring instrument, not as a tool the reading order has introduced for general use. | rule
Beyond ten: none

## chapters/interludes/making-pca-learnable.html
1 | The experiment uses torch.linalg.svd only to compute PCA’s closed-form reference after the projection has been derived above; Appendix A opens that decomposition and its shape/centering contract. | apparatus
Beyond ten: none

## chapters/part1/01-linear-regression.html
1 | Chapter 6 will make that difference visible; Appendix E later gathers the full statistical contract in one reference. | apparatus
3 | That last idea gets its own chapter (Chapter 6). | apparatus
4 | That refinement (stochastic gradient descent) matters enough to get its own treatment in Chapter 4. | apparatus
6 | This cell shows the complete PyTorch training loop so you can recognize its shape. | apparatus
6 | Until then, the manual implementation above is the chapter’s working toolbox. | apparatus
8 | In classical fixed-dimensional, well-specified settings, variance often falls roughly like \(1/n\) as data grows; that rate is not a universal law for modern models. | rule
Beyond ten: none

## chapters/part1/02-logistic-softmax.html
5 | Figure 2.3: The softening move, in one row. | apparatus
6 | Appendix E compares KL with other ways to compare distributions. | apparatus
7 | This loss object is the only new framework tool introduced here: it evaluates logits and labels, while the manual loop above still supplies the gradient. | apparatus
7 | The framework version is two lines, with one trap worth a warning. | announces
9 | Next, we let the templates themselves be built out of other templates: Chapter 3 stacks these linear units into a backbone beneath the same head, and discovers why a bend between them is not optional. | announces
Beyond ten: none

## chapters/part1/03-nonlinearity-mlp.html
1 | Watch what happens: | announces
6 | Approximation is still not generalization; that distinction gets its own chapter (Chapter 6). | apparatus
7 | This is the preface’s central equation, drawn: | announces
8 | One honest footnote on the XOR network: in principle two hidden units suffice, but such minimal networks are temperamental; across random seeds they frequently get stuck at 50% accuracy with silent units (you will verify this in Exercise 3). | apparatus
Beyond ten: none

## chapters/part1/04-training-loss-sgd.html
3 | Gradient descent, as we left it in Chapter 1, updates with the full gradient: | fragment
7 | Case 2: nonlinear functionals of aggregates. | fragment
8 | Case 3: batch-defined objectives. | fragment
9 | The cell also uses backward() as the framework instrument previewed in Chapter 1. | apparatus
5 | Every gradient, noise vector, mean, spread, step and ruler reading is computed in the browser from those twenty points. | apparatus
5 | The decomposition, the unbiasedness statement, batch_size = 4 and the two zones are the chapter's. | apparatus
11 | Under Adam, the \(L_2\) term \(\lambda\vect{w}\) joins the gradient, passes through Adam’s moment estimates, and is divided by the coordinate-wise scale \(\sqrt{\hat{\vect{s}}^{(t)}} + \epsilon\) of Equation 4.6, so weights with a large gradient history are shrunk less. | apparatus
Beyond ten: none

## chapters/part1/05-backpropagation.html
2 | The single-example outer product of Equation 5.4 then becomes one matrix product that sums the per-example outer products, | fragment
5 | Shakeri, Deep Learning: Making It Trainable, Chapter 11, “The Gradient Has a Memory: Reverse Accumulation and Checkpointing” (2026): the companion volume’s graduate treatment of reverse accumulation as a memory and numerical diagnostic, including fan-out accumulation, vector–Jacobian products, retained state, and checkpoint replay. | apparatus
6 | (Code.) Comment out optimizer.zero_grad() in any training loop from Chapter 1 and describe what happens to the loss curve. | apparatus
Beyond ten: none

## chapters/part1/06-generalization-inductive-bias.html
4 | If \(T\) shifts an image while preserving its label, then | fragment
5 | Each row \(\vect{w}_j^\top\) of the first-layer matrix \(\matr{W}_1 \in \mathbb{R}^{256\times784}\) is a 784-vector, which means we can reshape it into a 28×28 image and look at it.1 | punctuation
1 | The model and training loop hold no surprises: an MLP from Chapter 3, trained exactly as in Chapter 4: | punctuation
12 | And it is a dial, not a dogma: give a weakly biased model enough data and it can win again: a trade we will meet at the frontier in Chapter 19. | punctuation
7 | We now have everything needed to test the cartoon on real data: a width sweep at two dataset sizes: | announces
8 | A single seeded Adam sweep describes its own regime, so it cannot separate their effects, estimate a scaling law, or establish a \(1/n\) variance law. | rule
10 | Weight penalties, dropout, and early stopping from Chapter 4 live here. | announces
13 | (Code.) The U-curve hunt used widths up to 256. | apparatus
Beyond ten: none

## chapters/part2/07-filters-convolution.html
4 | The failures of Chapter 6 tell us what knowledge to build in, the two principles from the mechanism: | announces
6 | That is translation equivariance, and it need not be taken on faith: | announces
9 | This is Chapter 6’s constraints-are-knowledge callout made concrete: locality zeroes out most of the matrix, equivariance ties the survivors together, and what remains is a linear map with almost nothing left to specify. | apparatus
10 | (Pencil.) Prove translation equivariance from Equation 8.1: substitute the shifted image \(X'_{i,j} = X_{i-s,j}\) and show \(H'_{i,j} = H_{i-s,j}\). | apparatus
Beyond ten: none

## chapters/part2/08-cnn.html
22 | Before training, the parameter audit (because parameter economy was half of Chapter 7’s sales pitch, and Chapter 6’s MLP is the yardstick): | number
11 | which evaluates Equation 8.1 across every input channel, accumulates across \(C_{\text{in}}\), and adds the scalar channel bias \(b_o\); a pointwise activation follows. | fragment
23 | Parameter audit, LeNet vs. Chapter 6’s MLP. | fragment
24 | Two readings of this table. | fragment
28 | One last look inside, because Chapter 6 also showed us what the MLP’s first layer looked like (global, smeared, garment-shaped templates, Chapter 6) and promised that structure would change: | punctuation
14 | A useful analogy: nn modules are appliances: they have knobs and memory, and PyTorch carries their state around for you (nn.Conv2d owns its kernels and biases as nn.Parameters, registered for autograd and visible to the optimizer). | punctuation
6 | Figure 9.1: The mystery-detector game. | apparatus
7 | Read that cell again, because the entire deep-learning revolution in vision is that cell writ large. | apparatus
20 | Every line is a tool we already own: Equation 9.1 twice, Equation 9.2 silently fixing padding=2, pooling twice, then Chapter 3’s MLP as the decision head. | apparatus
25 | A one-point difference is descriptive, not an uncertainty estimate, so it does not establish which architecture has higher expected clean accuracy. | rule
Beyond ten: apparatus: 2, fragment: 1, punctuation: 1, rule: 1

## chapters/part2/09-modern-cnns-transfer.html
9 | Chapter 8 said the remaining shift-cliff was the flatten head’s fault: it reads the final grid positionally. | number
1 | LeNet reads garments at 82.5% with 61,706 parameters; graceful under shift where the MLP cliff-dived. | fragment
8 | 2,080: a 32 × 64 weight matrix and 32 biases, whatever the length of the sequence. | fragment
9 | The rematch of the rematch: | fragment
10 | Figure 10.2: Chapter 9’s experiment, third round. | apparatus
15 | The BERT moment (Chapter 18) is this section’s idea, taken seriously at scale. | apparatus
5 | Remember Equation 10.1 when you meet it. | apparatus
19 | (Code.) Data augmentation as a third road: on the 30-image shoe task, train from scratch with random horizontal flips and ±3-pixel shifts (Chapter 6’s exercise, now as a tool). | apparatus
11 | On the full 60,000-image dataset, the book’s pinned Rivanna runs put NiN at \(92.78\% \pm 0.08\%\) across seeds 6050–6052. | voice
2 | These comparisons are descriptive, not an unbiased estimate after model selection; a final claim would require a fresh, untouched test set. | rule
Beyond ten: announces: 1

## chapters/part3/10-sequences-rnn.html
12 | You met this exact maneuver one chapter ago: Chapter 10’s residual connection, \(H(x) = F(x) + x\), whose Jacobian’s identity term let gradients cross forty layers. | number
17 | In keeping with a book whose every experiment runs on its own pages, the training corpus is the nine chapters you have already read: their prose, stripped of code cells, about 150,000 characters. | number
18 | Listing 12.1: the canonical next-token trainer: | apparatus
19 | Listing 12.2: the fixed-window evaluation protocol (state reset at every window boundary, so train and held-out numbers stay comparable across chapters): | apparatus
20 | Train it with fit_next_token (Listing 12.1). | apparatus
8 | Figure 12.1: Two drawings of the same machine. | apparatus
11 | Figure 12.2: How much gradient a freshly initialized vanilla RNN’s output sends back to its first input, as the lag between them grows. | apparatus
15 | Figure 12.4: The gradient-vs-lag experiment, rerun with an LSTM whose effective forget-gate bias is initialized to +1. | apparatus
17 | We commit that code-stripped text as a benchmark snapshot; later copyedits must not silently change the task. | voice
26 | (Code.) Sample the character model at temperatures 0.2, 0.8, and 1.5, and with the temperature near zero compare against picking the argmax at every step. | apparatus
Beyond ten: announces: 1, apparatus: 7

## chapters/part3/11-encoder-decoder.html
6 | Complexity \(O(V \cdot T)\), quality: usually fine, occasionally myopic. | fragment
7 | Time to stare at the handoff. | announces
8 | Choosing where to look, by similarity, on the fly: you have owned the primitive since Chapter 1’s dot product, and Chapter 2 promised you the “soft lookup” that makes it differentiable. | fragment
9 | Bahdanau, Cho, & Bengio, Neural Machine Translation by Jointly Learning to Align and Translate: removes the single-state bottleneck by learning where to look; Chapter 15 performs the full harvest. | apparatus
10 | (Pencil.) Count this chapter’s parameters: two embeddings, two LSTMs, one output layer (\(V_{\text{src}} = 37\), \(V_{\text{tgt}} = 14\), embed 32, hidden 128; an LSTM holds \(4\left[(e + h)h + 2h\right]\); derive that first). | apparatus
Beyond ten: none

## chapters/part4/12-kernel-regression.html
2 | 14.1 Chapter 1 already mixed old answers | fragment
5 | 14.3 Chapter 2’s scores-to-weights machine | fragment
6 | For any strictly positive kernel, | fragment
10 | Each one names a different job: | announces
11 | Chapter 1 also planted one more similarity primitive, the dot product: | announces
12 | We end Part IV’s opening chapter with the same question: | announces
16 | Bahdanau, Cho, & Bengio, Neural Machine Translation by Jointly Learning to Align and Translate: the neural-attention step that replaces one fixed context with learned soft alignment; Chapter 15 performs that harvest. | apparatus
9 | On real data, choose the bandwidth using a validation set, then report once on a sealed test set. | rule
9 | The known black curve is a laboratory privilege. | voice
Beyond ten: none

## chapters/part4/13-attention.html
15 | Numeric dates can be ambiguous, so we retain the same unambiguous subsets as Chapter 11. | number
12 | 15.5 Return to Chapter 13’s date task | fragment
26 | Vaswani et al., Attention Is All You Need: introduces scaled dot-product and multi-head attention in the architecture Chapter 16 builds. | apparatus
19 | Figure 15.5: Left: exact-sequence accuracy on Chapter 13’s fixed 400-source validation subset. | apparatus
17 | The full Chapter 13 validation curve below is frozen from a byte-identical re-execution of that chapter’s published baseline. | voice
13 | Changing them would end the running benchmark: | announces
16 | Notice what changed relative to Chapter 13. | announces
20 | We did not match parameter count, computation, or minibatch order: constructing models with different parameter counts consumes different random draws before their first permutation. | rule
17 | Chapter 13’s test endpoint is not globally sealed here because that chapter has already reported it; for this rematch it remains decision-inert, and we request one final scalar only after the attention choices are fixed: | rule
15 | Design decisions and the heatmap use validation only. | rule
Beyond ten: rule: 1

## chapters/part4/14-self-attention-transformer.html
25 | Sinusoidal clocks repay Chapter 8’s position debt, and their sine/cosine pairs turn relative shifts into rotations. | number
23 | The toy sampler in Chapter 16 is wasteful precisely because it rebuilds that dataset at every step; Appendix C separates caching from FlashAttention’s I/O schedule. | voice
21 | For next-token logits \(z_i\), temperature applies Chapter 2’s softmax dial (Chapter 2): | punctuation
7 | We add | fragment
8 | If a sublayer computes \(F(x)\), the residual update is | fragment
14 | The signature of the imported trainer, for reference: | fragment
15 | … body exactly as Listing 12.1: this chapter prints only what it changes. | fragment
16 | Chapter 12’s trainer, imported: only the deltas printed. | fragment
18 | Figure 16.5: Matched training curves (left) and fixed-window held-out loss (right). | apparatus
14 | Training and evaluation are Chapter 12’s canonical listings, imported. | apparatus
Beyond ten: rule: 2

## chapters/part4/15-bert-pretraining.html
11 | Pretraining is a regime, not an architecture; Chapter 16 will ask what changes when an encoder leaves text for images and scaling takes center stage. | number
4 | [CLS] begins the sequence, and [SEP] ends each span: | announces
5 | Its two published sizes were: | fragment
9 | This closes Chapter 10’s contract at toy scale: | fragment
12 | (Pencil.) For [CLS] the wug is calm [SEP] [PAD] [PAD], suppose wug is selected and replaced by [MASK]. | apparatus
13 | (Audit.) Reproduce paired gains for covered and control strings at all three budgets. | apparatus
14 | (Pencil.) Define the pseudo-log-likelihood \(\operatorname{PLL}(x)=\sum_{i=1}^{T}\log p(x_i\mid x_{\setminus i})\) and explain why ordinary masked scoring costs \(T\) forward passes. | apparatus
14 | (Code.) Score minimal sentence pairs from the controlled lab by masking each ordinary token once. | apparatus
8 | The five-seed MLM gain was small, faded as labels increased, and lost decisively to a weighted lexical-overlap baseline. | rule
8 | We rejected that task as the chapter’s affirmative experiment: the shallow baseline solved more of the problem than the representation story did. | rule
Beyond ten: apparatus: 9

## chapters/part4/16-vit-scaling.html
5 | With \(\matr{Z}_{\ell-1}\in\mathbb{R}^{B\times(N+1)\times d}\), | fragment
7 | Figure 19.2: Five parameter- and schedule-matched runs on the fixed Chapter 6 split. | apparatus
11 | (Code.) Freeze one pinned Fashion CNN checkpoint from this chapter and fit one positive scalar temperature \(T\) on validation logits by minimizing NLL. | apparatus
11 | Named wrong answer: “better ECE means a more accurate classifier”; this post-hoc dial changes confidence, not the predicted class. | apparatus
7 | The CNN’s flatter curve is consistent with its local sharing and pooling, not a causal isolation of any one component. | rule
8 | Still, the contrast is consistent across the five fitted pairs with what Chapters 8–10 built into the CNN: local sharing, pooling, and a position-discarding global-average head. | rule
9 | Now harvest Chapter 18’s second promise: pretraining is a regime, not an architecture. | announces
10 | Training-optimal is not serving-optimal. | rule
Beyond ten: none

## chapters/part5/17-peft-quantization.html
2 | For an instruction \(I\), demonstrations \((x_i,y_i)\), and a query \(x_\star\), a discrete prompted prediction can be written | fragment
6 | Appendix B will gather dtype, shape, stride, and physical layout in one place; Appendix C connects FP16, BF16, rounding, and mixed precision to the finite representations first encountered in Chapter 5. | apparatus
8 | Chapter 21 will keep the adaptation machinery and change the question from which parameters move? to which objective should move them? | punctuation
9 | (Audit.) For each of three cases (fresh facts with citations, a stable output format, and a target domain absent from the source data) choose a first experiment among prompting/RAG, PEFT, full tuning, and quantization. | apparatus
Beyond ten: none

## chapters/part5/18-alignment.html
5 | Chapter 21 changes the behavior of a generator; Chapter 22 studies the machinery that makes generation possible. | voice
2 | Let | fragment
3 | The corresponding negative log-likelihood is ordinary binary cross-entropy on a difference of scores: | announces
4 | Chapter 20’s axis remains orthogonal. | rule
Beyond ten: none

## chapters/part5/19-generative.html
1 | so a minibatch mean is an unbiased estimate of it (the same linearity-of-expectation license that justified SGD in Chapter 4). | fragment
1 | In the five-row template, Target: the population ELBO; Estimator: batch mean of per-example ELBOs; Reduction: sum over pixels and latent coordinates, mean over examples; Validity: the objective is a per-example sum (estimator case i); Boundary: any term defined through the aggregate posterior \(q_{\mathrm{agg}}(\vect{z}) = \frac{1}{N}\sum_i q_\phi(\vect{z}\mid\vect{x}_i)\) (as in total-correlation variants) is a nonlinear functional of the whole dataset (case ii), and naive per-batch code for it is silently biased. | apparatus
1 | Exercises 4 and 5 make both boundaries fail in your hands. | apparatus
3 | For a one-dimensional Gaussian mixture with component means \(\mu_j\), shared variance \(s^2\), and mixture weights \(\pi_j\), the same normalized-weight machine from Chapter 14 appears inside the score: | announces
4 | Then | fragment
Beyond ten: none

## chapters/part5/20-multimodal.html
2 | 23.1 Chapter 2 returns: scores become weights | fragment
3 | Write the inverse temperature as \(a=e^\gamma=1/\tau\): | announces
4 | It is not the post-hoc temperature scaling in Chapter 19, Exercise 6, where the model is frozen and validation labels calibrate its confidence after training. | apparatus
5 | Apply it across row \(i\): | announces
6 | Notice the exact reuse: Equation 23.3 is Chapter 2’s multiclass classifier, but the classes are the candidates currently in the batch. | apparatus
10 | (Audit.) State why this jointly trained sharpness parameter is not the post-hoc calibration temperature in Chapter 19, Exercise 6. | apparatus
Beyond ten: none

## index.html
8 | its BatchNorm exercise moved to Chapter 9, where BatchNorm is introduced. | number
8 | Chapter 7 now states directly why it builds convolution with fixed kernels first and what changes when the kernel is learned. | number
8 | Printed experimental outputs are unchanged, except that Chapter 14’s training printout again matches the numbers its text reports; the archived v1.3 release is unchanged. | number
9 | Chapter 11 now includes a small probability tree showing how the best next token can miss the best complete sequence. | number
10 | The canonical HTML repairs Chapter 14’s Sources heading and gives every figure an accessible description. | number
11 | The live post-v1.2.1 book adds Appendix E as an optional statistical-contract reference, replaces Chapter 1’s bias–variance cartoon with a seeded show-then-name experiment, separates representation, optimization, and generalization evidence in Chapter 6, and bounds Chapter 18’s alignment contract within a broader sociotechnical assessment. | number
12 | It closes the July 2026 structural and research-frontier revision with the complete twenty-chapter course arc, both bridge interludes, the epilogue, and four just-in-time appendices. | number
12 | It also pins the Chapter 1–9 corpus used by the Chapter 10/14 language-model rematch, completes the figure-description audit, and applies one presentation rule consistently: experiments expose their code, while pure concept diagrams keep executable drawing source in the repository without printing pages of coordinates. | number
2 | Estimator. | fragment
3 | Rolling build · September 26, 2026 · Chapter 1 setup cell | fragment
Beyond ten: apparatus: 3, fragment: 2


## Course-site labels (`Shakeri-Lab/dl-course-site`, `lib/module-extras.ts`, main at its August 27 push)

| line | label now | label with the new number |
|---:|---|---|
| 95 | Interlude · Who Trains the Trainer? Learning by Experiment | Ch. 7 · Interlude: Who Trains the Trainer? Learning by Experiment |
| 113 | Ch. 7 · Filters and Convolution | Ch. 8 · Filters and Convolution |
| 114 | Ch. 8 · CNNs: Making Filters Learnable | Ch. 9 · CNNs: Making Filters Learnable |
| 131 | Ch. 9 · Modern CNNs and Transfer Learning | Ch. 10 · Modern CNNs and Transfer Learning |
| 147 | Interlude · Autoencoders[U+2014]Making PCA Learnable | Ch. 11 · Interlude: Autoencoders[U+2014]Making PCA Learnable |
| 165 | Ch. 10 · Sequences and Recurrence | Ch. 12 · Sequences and Recurrence |
| 166 | Ch. 11 · Encoder–Decoder, Teacher Forcing, Beam Search | Ch. 13 · Encoder–Decoder, Teacher Forcing, Beam Search |
| 182 | Ch. 12 · Kernel Regression | Ch. 14 · Kernel Regression |
| 183 | Ch. 13 · Attention: Making Similarity Learnable | Ch. 15 · Attention: Making Similarity Learnable |
| 200 | Ch. 14 · Self-Attention and the Transformer | Ch. 16 · Self-Attention and the Transformer |
| 201 | Interlude · Attention as Test-Time Regression | Ch. 17 · Interlude: Attention as Test-Time Regression |
| 220 | Ch. 15 · BERT and Pretraining | Ch. 18 · BERT and Pretraining |
| 221 | Ch. 16 · Vision Transformers and Scaling | Ch. 19 · Vision Transformers and Scaling |
| 240 | Ch. 17 · Prompting, Retrieval, PEFT, and Quantization | Ch. 20 · Prompting, Retrieval, PEFT, and Quantization |
| 241 | Ch. 18 · Alignment and RL Fine-Tuning | Ch. 21 · Alignment and RL Fine-Tuning |
| 261 | Ch. 19 · Generative Models: From Codes to Samples | Ch. 22 · Generative Models: From Codes to Samples |
| 262 | Ch. 20 · Multimodal Learning: One Space, Two Views | Ch. 23 · Multimodal Learning: One Space, Two Views |

