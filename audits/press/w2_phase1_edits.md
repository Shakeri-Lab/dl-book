# W2 phase 1: every edit in its rendered paragraph

Appendix to `w2_phase1_report.md`. Section A below is generated from the receipts
(`edits/*.json`) and the rendered HTML by `scripts/voice_apply_edits.py gate --stage W2-P1`:
each changed sentence is shown in bold inside its paragraph, with the text it replaced.
Page titles carry the press numbers. The label edits (I3) change headings and bold lead-ins,
which the generator cannot place in a paragraph, so they are listed first.

## The ten label edits (I3)

| Receipt | Page | Before | After |
|---|---|---|---|
| 09-I3-1 | `chapters/part2/09-modern-cnns-transfer.qmd` | ## Architecture bridge (non-examinable): DenseNet concatenates the history | ## Architecture bridge (optional): DenseNet concatenates the history |
| 10-I3-1 | `chapters/part3/10-sequences-rnn.qmd` | ## Historical bridge (non-examinable): before contextual states | ## Historical bridge (optional): before contextual states |
| 10-I3-2 | `chapters/part3/10-sequences-rnn.qmd` | **Research bridge (non-examinable).** Keep a recurrence | **Research bridge (optional).** Keep a recurrence |
| 11-I3-1 | `chapters/part3/11-encoder-decoder.qmd` | **Research bridge (non-examinable).** Teacher forcing minimizes | **Research bridge (optional).** Teacher forcing minimizes |
| 14-I3-1 | `chapters/part4/14-self-attention-transformer.qmd` | ## Practice bridge (non-examinable): decoding is another model choice | ## Practice bridge (optional): decoding is another model choice |
| 15-I3-1 | `chapters/part4/15-bert-pretraining.qmd` | ## Practice bridge (non-examinable): make the vocabulary learnable | ## Practice bridge (optional): make the vocabulary learnable |
| 15-I3-2 | `chapters/part4/15-bert-pretraining.qmd` | ## Reading the learned pieces (non-examinable) | ## Reading the learned pieces (optional) |
| 17-I3-1 | `chapters/part5/17-peft-quantization.qmd` | ## Course-lab bridge (non-examinable): read PEFT through the algebra | ## Practice bridge (optional): read PEFT through a library's algebra |
| A2-I3-1 | `chapters/appendices/a2-tensors.qmd` | ## Practice bridge (non-examinable): from samples to batches | ## Practice bridge (optional): from samples to batches |
| A3-I3-1 | `chapters/appendices/a3-precision-performance.qmd` | ## Systems bridge (non-examinable): cache the past at generation time | ## Systems bridge (optional): cache the past at generation time |

## Section A

### 1 Linear Regression, the Mother Model

`chapters/part1/01-linear-regression.qmd`

**01-I1-1** (I1). The opening names the course; the book is the reader's frame.

> **The core task of everything we will do in this book is to teach a computer to learn a function from examples.** Before we can appreciate what is deep about deep learning, we need one complete, honest example of learning: a model, a loss, and an update rule. Linear regression is that example. It is the smallest model that contains the entire supervised learning story, and by the end of this chapter we will build it three ways: in closed form, by gradient descent from scratch, and with PyTorch modules. All three will agree, and you will know exactly why.
>
> Replaced: “The core task of everything we will do in this course is to teach a computer to learn a”

Reader pass: no mark.

### Deep Learning: Making It Learnable

`index.qmd`

**P-I6-1** (I6). Web-only: the course tagline.

> A first-principles course in Python and PyTorch.

Reader pass: no mark.

**P-I6-2** (I6). Web-only: the enrolled-students note.

> An assistant that writes code you cannot audit has cost you the competence you came here for. The standard throughout is that you own every line you run. The code is plain Python and PyTorch and runs on an ordinary laptop CPU: small data, honest experiments. **If you are taking the course, the lecture videos and course-site self-checks complement this loop.**
>
> Replaced: “If you are taking the course, the lecture videos and course-site self-checks complement this loop.”

Reader pass: no mark.

**P-I2-1** (I2). The second volume as an outside work the interested reader is referred to.

> **Readers who want the theory of training will find it in Shakeri (2026), Deep Learning: Making It Trainable , a separate, self-contained treatment of initialization, optimization dynamics, numerical contracts, and the spectra of high-dimensional data that shares this book’s notation.**
>
> Replaced: “Readers who want the theory of training can continue with Deep Learning: Making It Trainable, a separate, self-contained”

Reader pass: no mark.

**P-I6-3** (I6). Web-only: About this edition.

> This is the free, open book for DS 6050 Deep Learning at UVA’s School of Data Science. The course arc is published, and the book continues to receive corrections and teaching improvements. The current stable edition is v1.3 (September 2, 2026) ; its tagged source preserves a fixed version. The live book is a rolling post-v1.3 manuscript. The HTML edition on this website is the canonical text. Executable figures and numerical results are produced by code in the book’s source: experiments carry their executable code, revealed step by step or all at once, and concept diagrams fold theirs. Every printed snippet is the executed artifact; nothing on the page is retyped, and the repository’s checks re-execute the book’s notebooks. Source, provenance, and licenses remain visible in the repository.

Reader pass: no mark.

**P-I2-2** (I2). "The graduate companion" frames this book as the first half of two; the Preface already cites the other volume.

> *Text and figures licensed CC BY-NC-SA 4.0; all code MIT. Source on GitHub.*
>
> Removed: “The graduate companion is Deep Learning: Making It Trainable.”
>
> (The Preface's license footer, outside every press-hidden block. The generator placed this deletion in the suggested-citation paragraph; this entry is corrected by hand.)

Reader pass: no mark.

**P-I6-4** (I6). Web-only: the course route and its module table.

> The route is cumulative. Modules sometimes revisit a chapter because the course uses the same idea first as a mechanism and later as evidence. The appendices are just-in-time support, not a separate prerequisite block: A is linear algebra and the SVD, B is tensors in practice, C is numerical precision and hardware efficiency, D is notation, and E is statistical learning contracts.

Reader pass: no mark.

**P-I6-8** (I6). Web-only: the enrolled-readers paragraph (for-credit rules, the syllabus, course-site hints).

> The book supports both enrolled and self-paced readers. For-credit assignment rules on the course site and in the syllabus take precedence. To protect those assignments, the public book does not publish full worked solutions to overlapping graded work. Public Check yourself prompts are retrieval practice, not answer banks; the chapter recap and course-site self-check feedback provide the first layer of hints.

Reader pass: no mark.

**P-I6-5** (I6). Web-only: the enrolled-students note.

> When stuck, inspect the nearest Trap: or tip callout, write the expected shape or trend before running anything, and reduce the code to one batch or one example. **Enrolled students should use the course’s approved help channels for assignment-specific hints; complete graded solutions stay there rather than in the public text.**
>
> Replaced: “Enrolled students should use the course's approved help channels for assignment-specific hints; complete graded solutions stay there rather than in the public text.”

Reader pass: no mark.

**P-I6-6** (I6). Press Preface (D4): the acknowledgment names the course; the author writes the press version.

> To the students of DS 6050 at the University of Virginia School of Data Science, whose questions and debugging pauses shaped every explanation here.

Reader pass: no mark.

**P-I6-7** (I6). Web-only: the support invitation does not belong in a publisher's manuscript.

> This book is free to read at $0 , and no contribution unlocks additional content. Reading it, sharing it, or reporting a correction is already meaningful support. If it has been useful and you would like to help sustain ongoing corrections, new figures, and open releases, you may make an optional contribution here:

Reader pass: no mark.

### 5 Backpropagation

`chapters/part1/05-backpropagation.qmd`

**05-I2-1** (I2). The Sources entry keeps its citation; "companion volume" and "graduate" frame this book as incomplete.

> **Shakeri, Deep Learning: Making It Trainable , Chapter 11, “The Gradient Has a Memory: Reverse Accumulation and Checkpointing” (2026): a treatment of reverse accumulation as a memory and numerical diagnostic, including fan-out accumulation, vector–Jacobian products, retained state, and checkpoint replay.**
>
> Replaced: “(2026): the companion volume's graduate treatment of reverse accumulation as a memory”

Reader pass: no mark.

### 6 When It Fails: Generalization in Pictures, and Inductive Bias

`chapters/part1/06-generalization-inductive-bias.qmd`

**06-I1-1** (I1). "a course" frames the book as a course; the list that follows is a toolkit.

> **Part I has given us everything the standard toolkit promises: models with universal expressive power , losses grounded in maximum likelihood , an optimizer that scales , and gradients for anything .** Applied to Fashion-MNIST, this machinery reaches respectable validation accuracy in seconds.
>
> Replaced: “Part I has given us everything a course could promise:”

Reader pass: no mark.

### 7 Interlude: Who Trains the Trainer? Learning by Experiment

`chapters/interludes/learning-by-experiment.qmd`

**LBE-I2-1** (I2). The second volume as an outside work, referred to and cited.

> **Readers who want this protocol turned into a conditional-estimator and regime diagnostic and a reusable Incident Card will find both in Shakeri (2026), Chapter 13 and Appendix D.** The first asks what one batch estimates at the current state; the second prevents a training symptom from becoming a remedy-first story.
>
> Replaced: “For the graduate continuation, the companion volume turns this protocol into a conditional-estimator and regime diagnostic and a reusable Incident Card.”

Reader pass: no mark.

**LEARNING-I2-S** (I2). I2: the second volume cited in Sources by author, title, year, and URL.

> **Shakeri, Deep Learning: Making It Trainable (2026), Chapter 13 and Appendix D : this protocol turned into a conditional-estimator and regime diagnostic and a reusable Incident Card.**

Reader pass: no mark.

### 10 Modern CNNs and Transfer Learning

`chapters/part2/09-modern-cnns-transfer.qmd`

**09-I1-1** (I1). The clause points to a course assignment the reader cannot see.

> GoogLeNet’s Inception block (2014) answers “which kernel size?” with “all of them”: parallel $1\times1$ , $3\times3$ , $5\times5$ , and pooling branches, concatenated. Its enabling trick is the $1\times1$ bottleneck : compress channels before the expensive spatial kernels. For one $5\times5$ branch at 256 channels: direct, $5^2 \times 256 \times 128 \approx 819$ k parameters; with a $1\times1$ squeeze to 32 first, $256 \times 32 + 5^2 \times 32 \times 128 \approx 111$ k, an 86% cut for the same nominal operation. **We will not build Inception here (the principle, channel compression before spatial expense, is the transferable part), but Exercise 2 walks the arithmetic.**
>
> Replaced: “but Exercise 2 walks the arithmetic and the course assignment has you build the block itself.”

Reader pass: Reader: apparatus (the Exercise 2 pointer). Overruled: the pointer is baseline; the edit removed only the course clause.

**09-I1-2** (I1). The rule's high-resolution half rested on the course assignment, not on an experiment on this page.

> **The decision rule is this: transfer pays when (your labels are scarce) and (the target task is feature-hungry) and (the pretraining data plausibly covers the target’s features at a matched scale).** At 224 pixels and 18 landmark classes all three hold, and transfer should win by a wide margin. At 28 pixels and 3 silhouettes, the conditions fail, and on this page scratch fights the superpower to a draw. Knowing which regime you are in is the skill; the mechanics ( requires_grad , learning-rate splits) are the easy part.
>
> Replaced: “The decision rule supported by the experiments is this: transfer”

Reader pass: no mark.

**09-I1-3** (I1). No course evidence: the high-resolution case becomes the rule's prediction, and the low-resolution case stays the measured result.

> **The decision rule is this: transfer pays when (your labels are scarce) and (the target task is feature-hungry) and (the pretraining data plausibly covers the target’s features at a matched scale). **At 224 pixels and 18 landmark classes all three hold, and transfer should win by a wide margin.** At 28 pixels and 3 silhouettes, the conditions fail, and on this page scratch fights the superpower to a draw.** Knowing which regime you are in is the skill; the mechanics ( requires_grad , learning-rate splits) are the easy part.
>
> Replaced: “224 pixels and 18 landmark classes (the course assignment), all three hold, and transfer is the winning move by a wide margin.” “At 28 pixels and 3 silhouettes, the conditions fail and scratch fights the superpower to a draw.”

Reader pass: Reader: number. Overruled for this edit: 'to a draw' is baseline (scratch 86.6% mean, ImageNet probe 87.2%, fine-tuned 88.7%); it joins the Chapter 10 transfer claims the author reserved.

**09-I2-1** (I2). The author's model sentence: the second volume is an outside work the interested reader is referred to.

> BatchNorm re-standardizes every channel over the batch and spatial axes, then hands back two knobs ( $\gamma, \beta$ ); conv→BN→ReLU with bias=False ; train and eval are different machines , so flip the switch. Its per-token cousin, LayerNorm, awaits in Chapter 16 . **Readers who want normalization treated as a choice of invariance, finite-sample state, and derivative path will find that treatment in Shakeri (2026), Chapter 15, Normalization Chooses an Invariance .**
>
> Replaced: “For the graduate treatment of normalization as a choice of invariance, finite-sample state, and derivative path, continue in Normalization Chooses an Invariance.”

Reader pass: no mark.

**09-I2-S** (I2). I2: the second volume cited in Sources by author, title, year, and URL.

> **Shakeri, Deep Learning: Making It Trainable (2026), Chapter 15, “Normalization Chooses an Invariance” : normalization treated as a choice of invariance, finite-sample state, and derivative path.**

Reader pass: no mark.

**09-I3-1** (I3). I3: non-examinable becomes optional, consistently.

> (the paragraph could not be located; see the receipt)

Reader pass: no mark.

### 11 Interlude: Autoencoders: Making PCA Learnable

`chapters/interludes/making-pca-learnable.qmd`

**PCA-I1-1** (I1). The course's order becomes the book's.

> Part II gave neural networks a spatial prior: local kernels share one rule across an image. The next part must handle objects whose length is not known in advance. **Before we add a loop, the book takes a revealing detour: one that begins with a fixed-size object.** Could an encoder compress an object into a fixed-size code and a decoder recover what mattered?
>
> Replaced: “we add a loop, the course takes a revealing detour:”

Reader pass: no mark.

**PCA-I1-2** (I1). Module 6 is the course's name for this material.

> Appendix A computes PCA from a centered singular value decomposition. **Here we ask the more neural-network-shaped question: what if we replace that closed-form solve with weights and a reconstruction loss?** The answer begins with the precise statement PCA is a linear autoencoder . Let the training rows be centered, so their mean is zero. Let $\matr{V}_k\in\mathbb{R}^{d\times k}$ contain $k$ orthonormal principal directions:
>
> Replaced: “Module 6 asks the more neural-network-shaped question:”

Reader pass: Reader: apparatus ('This chapter asks'). Fixed: 'Here we ask', the author's own opener.

### 12 Sequences and Recurrence

`chapters/part3/10-sequences-rnn.qmd`

**10-I3-1** (I3). I3: non-examinable becomes optional, consistently.

> (the paragraph could not be located; see the receipt)

Reader pass: no mark.

**10-I3-2** (I3). I3: non-examinable becomes optional, consistently (the author's new Exercise 8, merged from main at 0070cc9).

> (the paragraph could not be located; see the receipt)
>
> Replaced: “Research bridge (non-examinable).”

Reader pass: no mark.

### 13 Encoder–Decoder, Teacher Forcing, Beam Search

`chapters/part3/11-encoder-decoder.qmd`

**11-I1-1** (I1). The course's pipeline is not on the page; a full translation pipeline is the general case.

> **Three special tokens run the show, the same conventions as a full translation pipeline: <pad> fills the short sequences of a batch out to a rectangle, <bos> tells the decoder “begin,” and <eos> lets the model say “I am done”: remember, the machine must be free to choose its output length.**
>
> Replaced: “the same conventions as the course's full translation pipeline:”

Reader pass: no mark.

**11-I3-1** (I3). I3: non-examinable becomes optional, consistently (the author's new Exercise 8, merged from main at 0070cc9).

> (Pencil.) **Research bridge (optional).** Teacher forcing minimizes per-token cross-entropy on gold prefixes, but the model is judged by a sequence-level score of its own outputs. For a score $R(\vect{y})$ of an output sampled from $p_\theta(\cdot\mid\vect{x})$ , show that the gradient of $\E_{\vect{y}}[R(\vect{y})]$ equals $\E_{\vect{y}}[R(\vect{y})\,\nabla_\theta\log p_\theta(\vect{y}\mid\vect{x})]$ , and that subtracting a baseline $b(\vect{x})$ from $R$ leaves it unchanged. (Code.) Starting from the teacher-forced date model, fine-tune on sampled outputs with exact match as $R$ and a running-average baseline, then compare test exact match and the residual errors with the teacher-forced model’s. What did training on its own outputs fix, and what did it cost? The papers listed for this exercise under Sources develop sequence-level training for translation; in the alignment chapter ( Chapter 21 ) the same gradient returns with a learned reward in place of exact match.
>
> Replaced: “Research bridge (non-examinable).”

Reader pass: no mark.

### 16 Self-Attention and the Transformer

`chapters/part4/14-self-attention-transformer.qmd`

**14-I2-1** (I2). The second volume as an outside work, cited by author and year.

> **Readers who want the diagnostic side of these mechanisms will find kernel geometry, exact I/O-aware algorithms, parallel recurrence, and feature-learning regimes in Shakeri (2026), Beyond This Volume .**
>
> Replaced: “exact I/O-aware algorithms, parallel recurrence, and feature-learning regimes in the companion volume's Beyond This Volume route.”

Reader pass: no mark.

**14-I2-S** (I2). I2: the second volume cited in Sources by author, title, year, and URL.

> **Shakeri, Deep Learning: Making It Trainable (2026), “Beyond This Volume” : kernel geometry, exact I/O-aware algorithms, parallel recurrence, and feature-learning regimes.**

Reader pass: no mark.

**14-I3-1** (I3). I3: non-examinable becomes optional, consistently.

> (the paragraph could not be located; see the receipt)

Reader pass: no mark.

### 18 The BERT Moment: Pretraining as the New Regime

`chapters/part4/15-bert-pretraining.qmd`

**15-I3-1** (I3). I3: non-examinable becomes optional, consistently.

> (the paragraph could not be located; see the receipt)

Reader pass: no mark.

**15-I3-2** (I3). I3: non-examinable becomes optional, consistently.

> (the paragraph could not be located; see the receipt)

Reader pass: no mark.

### 19 Vision Transformers and Scaling Laws

`chapters/part4/16-vit-scaling.qmd`

**16-I1-1** (I1). The analogy stays with the distillation roles (student, teacher) instead of a classroom's.

> DeiT makes a particularly human point. A teacher provides another target, but it does not replace the ground-truth label. **A student can outgrow its teacher: it listens, sees other evidence, and decides for itself.** In DeiT’s hard-distillation version, a distillation token learns from the teacher’s predicted class while [CLS] learns from the true class; the two heads are combined at inference. The teacher changes supervision, not the identity of the student.
>
> Replaced: “Students can become better than the instructor: they listen, see other evidence, and decide for themselves.”

Reader pass: no mark.

### 20 Adapting Pretrained Models: Prompting, PEFT, Quantization

`chapters/part5/17-peft-quantization.qmd`

**17-I1-1** (I1). The course lab and the model it used go; the algebra reading stands on its own.

> **A PEFT library expresses Equation 20.4 through a package wrapper.** Treat the wrapper’s names as a translation layer, not as new mathematics:
>
> Replaced: “Module 11's supplied Gemma/PEFT lab expresses REF through a package wrapper.”

Reader pass: no mark.

**17-I1-2** (I1). The lab becomes any configuration.

> **If the wrapper targets “all linear” modules, do not infer the adapter size from that phrase.** Inspect the selected module names and shapes, sum Equation 20.6 over exactly that set, and print the parameters that still have requires_grad=True . Then apply the four-part freeze audit below: the base stays unchanged, only permitted factors receive gradients, and merged and unmerged outputs agree within a declared numerical tolerance. Package calls and model identifiers can evolve; these algebraic checks are the stable contract.
>
> Replaced: “If the lab targets “all linear” modules,”

Reader pass: I18: 'a configuration' added a nominalization; 'the wrapper' names the thing the paragraph is about.

**17-I1-3** (I1). The lab becomes the general case.

> **When the base is also stored on a quantization grid, the result is QLoRA, not a different LoRA equation.** Keep the frozen base’s storage and compute dtypes separate from the factors’ trainable dtype, as Appendix C requires. The QLoRA section later in this chapter makes that composition explicit.
>
> Replaced: “When the lab also stores the base on a quantization grid,”

Reader pass: no mark.

**17-I5-1** (I5). The narrator states the point instead of attributing it.

> **A practical instinct remains useful: when a carefully evaluated prompt or retrieval pipeline solves the task, avoid fine-tuning merely because it is available.** Treat that as a search heuristic, not a law. A stable format change may fit a small adapter; genuinely new knowledge may belong in retrieval or further training; a severe source-coverage mismatch may defeat all of them.
>
> Replaced: “The instructor's practical instinct remains useful: when a carefully evaluated”

Reader pass: no mark.

**17-I3-1** (I3). D3 default: a practice bridge about reading PEFT through a library's names, with no lab or module.

> (the paragraph could not be located; see the receipt)

Reader pass: no mark.

### 21 Alignment and RL Fine-Tuning

`chapters/part5/18-alignment.qmd`

**18-I1-1** (I1). The description is the book's own; its source was the course.

> **In one line: train a judge, then try to please the judge .** The word judge matters. A reward model is a learned proxy for a feedback process, not the feedback process itself.
>
> Replaced: “This is the course's memorable description: train a judge, then try to please the judge.”

Reader pass: no mark.

**18-I5-1** (I5). The brief's form: the narrator states the analogy.

> **A model card is a model’s nutritional label, and the analogy works: record model and training details, intended users and uses, out-of-scope uses, data and feedback provenance, evaluation conditions, slice results, limitations, version, and contact.** A label helps a reader make an informed decision; it does not prevent misuse, prove that omitted groups are safe, or convert a conditional evaluation into a certificate.
>
> Replaced: “The instructor calls a model card a model's nutritional label; the analogy works:”

Reader pass: no mark.

**18-R9-1** (R9). Duplicated word.

> A model card is a model’s nutritional label, and the analogy works: record model and training details, intended users and uses, out-of-scope uses, data and feedback provenance, evaluation conditions, slice results, limitations, version, and contact. **A label helps a reader make an informed decision; it does not prevent misuse, prove that omitted groups are safe, or convert a conditional evaluation into a certificate.**
>
> Replaced: “it does does not prevent misuse,”

Reader pass: no mark.

### Appendix A: Linear Algebra and the SVD

`chapters/appendices/a1-linear-algebra.qmd`

**A1-I1-1** (I1). "course" as the thing the appendix is not; the contrast holds with textbook.

> Because the notation is compact enough to hide mistakes: a product can be legal while representing the wrong convention; an inverse can exist while being the wrong computation; and an SVD can be exact while its singular vectors are not uniquely identifiable. This appendix gathers the geometry and the PyTorch habits that let you audit those cases. **It is a working reference, not a compressed linear-algebra textbook.**
>
> Replaced: “It is a working reference, not a compressed linear-algebra course.”

Reader pass: no mark.

### Appendix B: Tensors in Practice

`chapters/appendices/a2-tensors.qmd`

**A2-I3-1** (I3). I3: non-examinable becomes optional, consistently.

> (the paragraph could not be located; see the receipt)

Reader pass: no mark.

### Appendix C: Numerical Precision and Hardware Efficiency

`chapters/appendices/a3-precision-performance.qmd`

**A3-I2-1** (I2). "first-course" and "graduate" frame this book as the lesser half; the second volume becomes a cited outside work.

> ****This appendix covers the mechanics this book uses.** Readers who want a diagnostic treatment will find it in Shakeri (2026), Chapter 1, The Count Is Not the Cost , and Chapter 3, The Grid Under the Update , which makes the precision contract quantitative.**
>
> Replaced: “This appendix owns the first-course mechanics.” “Readers who want the graduate diagnostic treatment in Deep Learning: Making It Trainable can begin with count versus cost, then make the precision contract quantitative.”

Reader pass: no mark.

**A3-I2-S** (I2). I2: the second volume cited in Sources by author, title, year, and URL.

> **Shakeri, Deep Learning: Making It Trainable (2026), Chapters 1 and 3 : arithmetic intensity and the memory hierarchy, and the precision contract made quantitative.**

Reader pass: no mark.

**A3-I3-1** (I3). I3: non-examinable becomes optional, consistently.

> (the paragraph could not be located; see the receipt)

Reader pass: no mark.

