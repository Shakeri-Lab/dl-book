# Stage B2a gate report

Branch `voice-coherence` from baseline `86ec60b`, pushed at this gate; not merged. This
batch carries the B2 corrections (C14 to C20), the reader-pass resolutions on the seven
B0 and B1 pages under the author's rulings, S6 on the ten pages in scope, ten R9 slip
fixes, and B2a itself: the PCA interlude and Chapters 10 and 11. Ledgers, invariants,
phrase counts, the printed-number and taste-grade reports, reader-mark counts, and the
I17 list are in `stage_b2a_audit.md`. The print PDF built from this commit goes with
this report.

## Section A: every changed or added sentence, in its paragraph

Pages in reading order. Each entry gives the edit, its rule, one line of intent, and the
paragraph as it now renders, with the new sentence in bold; a Removed or Replaced line
shows what went. The reader-pass mark and its resolution close each entry.

### 1 Linear Regression, the Mother Model

`chapters/part1/01-linear-regression.qmd`

**01-B2-C19a, C19** (D7). The colour words are the legend for the figure on the page, not identifiers, so the author's sentence returns.

> where each $\featurepart{\vect{x}_i}\in\R^d$ is an input with $d$ features and $\targetpart{y_i}$ is the desired output, also called the supervision signal . **Stack the inputs as rows and you get the blue data matrix $\featurepart{\matr{X}}\in\R^{n\times d}$ : $n$ samples down, $d$ features across, with the purple targets collected in $\targetpart{\vect{y}}$ .**
>
> Replaced: “inputs as rows and you get the data matrix MATH , shown in blue: MATH samples down, MATH features across, with the targets, shown in purple, collected in MATH .”

Reader pass: no mark.

**01-B2-C19b, C19** (D7). 'Residual e' identifies the object; the colour is its legend.

> **The dark red residual $\residualpart{\vect{e}}$ names each miss; squaring and averaging those misses produces one neutral scalar.** The loss is the guiding principle of training: it translates model error into a score of failure, giving the optimizer a precise measure of how much corrective work remains. The choice of loss is not arbitrary, and we will justify this one at the end of the chapter.
>
> Replaced: “The residual MATH , shown in dark red, names each miss; squaring and averaging”

Reader pass: no mark.

**01-S6-1** (S6). The paragraph already shows why the closed form fails; the grade clause goes.

> **The exact characterization does not survive the move to deep networks.** Once a nonlinearity sits between layers, setting the gradient to zero gives a system of nonlinear equations with, in general, no closed-form solution. And with millions or billions of parameters, even the linear case hits the $d\times d$ wall above. We trade the one-shot solve for an iterative search: start with a guess, measure how bad it is, and make a local correction.
>
> Replaced: “The exact characterization is elegant, but it does not survive the move to deep networks.”

Reader pass: no mark.

**01-B2-C19c, C19** (D7). The distribution of predictions is named; green is its legend in the figure.

> Keep the fitting recipe fixed, but collect the data again. The observed points move, so the fitted line moves too. **At one fixed input, the green distribution of predictions has a center and a spread.** Its center can miss the black data-generating curve, and fresh outcomes still vary around that curve even if the prediction were perfect. Keep the output axis fixed between the first two panels: the middle panel is a literal vertical slice through the left one.
>
> Replaced: “At one fixed input, the distribution of predictions, shown in green, has a center and a spread.”

Reader pass: no mark.

**01-R9-1** (R9). An unambiguous typo or punctuation slip in baseline text (R9).

> (Code.) In make_synthetic_data , raise noise to 1.0 and draw 10 training sets with different seeds. Fit each with the closed form; the three implementations above land on the same weights, so one is enough. How much do the learned weights vary across training sets? The noise you raised sets the irreducible-noise term of Equation 1.5 . Which term measures the spread you just observed, and how does higher label noise inflate it?

Reader pass: no mark.

### 5 Backpropagation

`chapters/part1/05-backpropagation.qmd`

**05-B2-C18, C18** (V3). The author's promise returns; under the amended V3 a baseline 'By the end' does not count against the cap.

> Backpropagation answers it exactly. It computes all the partial derivatives in one backward sweep whose cost is a small constant multiple of the graph’s elementary operations. It is not a new kind of calculus. It is the chain rule, organized . **By the end of this chapter you will have derived it as a recursion on sensitivities, implemented it by hand on a batch, counted what it costs in arithmetic and in memory, and checked that torch.autograd agrees with you to machine precision.**
>
> Replaced: “The pages ahead derive it as a recursion on sensitivities, implement it by hand on a batch, count what it costs in arithmetic and in memory, and check that torch.autograd agrees with you to machine precision.”

Reader pass: no mark.

### 6 When It Fails: Generalization in Pictures, and Inductive Bias

`chapters/part1/06-generalization-inductive-bias.qmd`

**06-B2-C14, C14** (T1). The promise says what the templates will show and what fixes it, in the chapter's own words, without pointing at the book's apparatus.

> Yet high validation accuracy can conceal a complete absence of domain structure. By probing the fitted model with elementary geometric transformations, this chapter diagnoses the fundamental limitation of unconstrained models: flexibility without a spatial inductive bias memorizes pixel coordinates instead of learning image structure. **You will see the memorized coordinates in the first-layer templates themselves, each one stretched across the whole frame; the fix is two constraints, locality and translation structure, and Part II is built from them.**
>
> Replaced: “The memorized coordinates show up in the first-layer templates themselves, and the two constraints Part II builds in against them are named before the recap.”

Reader pass: no mark.

**06-B2-P3a, P3** (S1). The experiment's limitation, after the result, in the author's own sentence.

> Read it honestly. The left side of the cartoon is emphatically real: too little capacity underfits badly. But the dreaded right side barely materializes, with a whisper of an upturn at the small dataset and nothing at the larger one. This is exactly the caveat planted in Chapter 1 : the U is a helpful cartoon, not a law of nature. The optimizer, sample size, and data structure can all shape the curve. **A single seeded Adam sweep describes its own regime, so it cannot separate their effects, estimate a scaling law, or establish a $1/n$ variance law.**
>
> Replaced: “One seeded Adam sweep describes its own regime: it cannot separate their effects, estimate a scaling law, or establish a MATH variance law.”

Reader pass: written to satisfy a rule, different voice: recast in the author's own words

**06-R9-1** (R9). An unambiguous typo or punctuation slip in baseline text (R9).

> A constraint looks like a reduction in power: the constrained model is a strict subset of the MLP. That is exactly the point. By Chapter 1 ’s bias–variance lens, we are spending bias (assumptions we are confident of) to collapse the search space onto functions that respect the structure of images, slashing variance and sample complexity. Inductive bias is not merely a limitation of a model; done right, it is what you know about the world, cast into architecture, objective, training procedure, or data. **And it is a dial, not a dogma: give a weakly biased model enough data and it can win again: a trade we will meet at the frontier in Chapter 16 .**
>
> Replaced: “weakly-biased model”

Reader pass: no mark.

**06-R9-2** (R9). An unambiguous typo or punctuation slip in baseline text (R9).

> (Pencil.) Count the labelings of $N$ ordered points realizable by (a) positive rays on a line, (b) intervals on a line, and (c) affine linear separators for $N$ points in general position in two dimensions. Obtain $N+1$ , $N(N+1)/2+1$ , and $2\sum_{i=0}^{2}\binom{N-1}{i}$ , respectively. Compare each with $2^N$ . Do not invoke VC dimension: the point is to see, with arithmetic, how restricting the hypothesis menu changes its growth.

Reader pass: no mark.

### 8 CNNs: Making the Filters Learnable

`chapters/part2/08-cnn.qmd`

**08-S6-1** (S6). The grade becomes the reason the two disclaimers show: the real task has no known target.

> **Two honest disclaimers about the game, both of which make the real thing harder , not easier.** First, the game was rigged: the target came from a known kernel, so a perfect answer existed and the loss surface was a clean convex bowl (the output is linear in $V$ , and squared error in a linear map is Chapter 1’s setting all over again). Second, and more important: in a real CNN, nobody supplies the target feature maps. The only supervision is the classification loss at the far end of the network. The gradient flows backward through every layer (exactly the mechanics of Chapter 5 ) and the kernels that emerge are whatever detectors the task itself demands. We chose Sobel here; a trained network might discover it needs something no one has named.
>
> Replaced: “both of which make the real thing more remarkable, not less.”

Reader pass: no mark.

**08-R9-1** (R9). An unambiguous typo or punctuation slip in baseline text (R9).

> Chapter 7’s zoo can stage the story before any learning enters. **Give the first layer two hand-crafted experts (vertical and horizontal edge energy), then hand-build one second-layer kernel that reads both reports at once:**
>
> Replaced: “(vertical and horizontal edge energy) then hand-build”

Reader pass: no mark.

**08-R9-2** (R9). An unambiguous typo or punctuation slip in baseline text (R9).

> Now train both models under one shared optimization recipe: same fitting split, optimizer, minibatch size, number of epochs, and therefore number of parameter updates. The comparison does not match parameter count or floating-point work; a convolution and a dense layer spend different computation per update. **Architecture is the intended difference; compute is not controlled:**
>
> Replaced: “difference, compute is not controlled:”

Reader pass: no mark.

**08-R9-3** (R9). An unambiguous typo or punctuation slip in baseline text (R9).

> Chapter 6 convicted our MLP with one experiment: shift every validation garment two pixels right, and accuracy fell off a cliff: the full-frame templates kept scoring sleeves against background. We then promised that an architecture built on locality and weight sharing would face the same trial. **Write your predictions down before running: two numbers: LeNet’s clean accuracy and LeNet at a two-pixel shift.** The MLP managed 76% and 43%.
>
> Replaced: “LeNet's clean accuracy, and LeNet at a two-pixel shift.”

Reader pass: no mark.

### 9 Modern CNNs and Transfer Learning

`chapters/part2/09-modern-cnns-transfer.qmd`

**09-R9-1** (R9). An unambiguous typo or punctuation slip in baseline text (R9).

> **Can we design reusable blocks : optimized layer combinations we stack, keeping a bird’s-eye view instead of re-designing what already works?**
>
> Replaced: “optimized layer-combinations we stack”

Reader pass: no mark.

**09-B2-C17, C17** (V4). The note is stated, not announced; the caveat that follows is unchanged.

> **Chapter 8 already opened the 600-image holdout, and this chapter queries it repeatedly while comparing architectures, so we keep the familiar X_te name but treat it as the book’s fixed benchmark .** These comparisons are descriptive, not an unbiased estimate after model selection; a final claim would require a fresh, untouched test set.
>
> Replaced: “One evaluation label needs a note.” “Chapter 8 already opened the 600-image holdout, and this chapter queries it repeatedly while comparing architectures.” “We keep the familiar X_te name, but treat it as the book's fixed benchmark.”

Reader pass: written to satisfy a rule (test-set disclosure): kept; the disclosure is the author's, and C17 only folded the announcement into it

**09-S6-1** (S6). The grade becomes the answer itself, in the chapter's math style for kernel sizes.

> **VGG’s answer (Simonyan & Zisserman, 2014): never use a $5 \times 5$ kernel; stack $3 \times 3$ s until the field is as wide as you need.** Recall the receptive-field ledger of Chapter 8 : stacking grows the field. Two stacked $3 \times 3$ convolutions let the second layer see $5 \times 5$ of the input, the same receptive field as one $5 \times 5$ kernel. But compare the bills, for a layer with $C$ channels in and $C$ out:
>
> Replaced: “VGG's answer (Simonyan & Zisserman, 2014) is the cleanest idea in this chapter.”

Reader pass: no mark.

**09-R9-2** (R9). An unambiguous typo or punctuation slip in baseline text (R9).

> The $\gamma, \beta$ pair matters: normalization is a reset to a healthy scale , not a straitjacket. The network can learn to restore any mean and spread that helps, but it starts every layer from sane numbers. **In the printout above, the BN column holds a near-constant spread through all twelve layers: every layer trains from day one.** The standard placement we adopt is conv $\rightarrow$ BN $\rightarrow$ ReLU, with bias=False on the convolution, since $\beta$ already provides the shift.
>
> Replaced: “column holds near a constant spread”

Reader pass: no mark.

**09-B2-P3b, ruling** (R2). The clause announced the pause the next paragraphs take.

> The parameter story is a rout: 35,034 total, a 650-parameter head, six times smaller than VGGSmall. **The accuracy is 76.2%, and that dip is worth more attention than the win.** First, though, collect the promised payoff. Chapter 8 said the remaining shift-cliff was the flatten head’s fault: it reads the final grid positionally . GAP averages over positions, so the head no longer assigns a different weight to every location. What remains is Chapter 2’s classification head in its plainest form: one linear layer reading one averaged number per channel. The rematch of the rematch:
>
> Replaced: “worth more attention than the win, so we will not rush past it.”

Reader pass: announces: clause dropped by the author's ruling

**09-S6-2** (S6). The grade goes; the stance on magic stays, and the paragraph already shows the direct route.

> Read the right-hand side with Chapter 5 eyes. A gradient arriving at a block’s output reaches its input through two additive terms: the learned branch $\partial F /\partial x$ and the identity $I$ . The identity contribution gives gradient flow a direct route that does not itself multiply by the learned weights. **It is not magical: the learned Jacobian can still reinforce, distort, or even partly cancel that term.** Chapter 5 called ReLU’s open gate a gradient superhighway through a single unit; a skip connection builds a direct lane into every block. The block only needs to learn the residual , the correction on top of “pass it through,” and doing nothing is easy to represent: $F = 0$ .
>
> Replaced: “It is powerful, not magical:”

Reader pass: no mark.

**09-R9-3** (R9). An unambiguous typo or punctuation slip in baseline text (R9).

> Residual connections are not only a CNN trick. **They became a central design device in many deep architectures; when we assemble a transformer in Chapter 14 , every attention layer and every feedforward layer will be wrapped as $x + F(x)$ , and the freshly met layer normalization will sit beside each skip.** The picture to carry forward: a residual stream with direct additive routes through the network, each block reading from it and writing a correction back. Those routes improve conditioning without making the stream immune to learned-branch interactions. Attention will be one kind of correction. You now own both parts of that skeleton.
>
> Replaced: “the freshly-met layer normalization”

Reader pass: no mark.

**09-B2-P3d, P3** (S5). A colon after 'is' was a slip; 'this' gives the colon its noun.

> **The decision rule supported by the experiments is this: transfer pays when (your labels are scarce) and (the target task is feature-hungry) and (the pretraining data plausibly covers the target’s features at a matched scale).** At 224 pixels and 18 landmark classes (the course assignment), all three hold, and transfer is the winning move by a wide margin. At 28 pixels and 3 silhouettes, the conditions fail and scratch fights the superpower to a draw. Knowing which regime you are in is the skill; the mechanics ( requires_grad , learning-rate splits) are the easy part.
>
> Replaced: “supported by the experiments is: transfer”

Reader pass: punctuation slip (colon after 'is'): fixed

**09-B2-P3a, ruling** (T4). 'Diagnosing the regime is the skill.' ends the chapter; the Part II page and the interlude's opener carry the transition.

> Transfer learning = freeze + probe, or gently fine-tune. Our experiment found scratch and the ImageNet probe in a near tie across three seeds at 28-pixel scale. Pretraining is curriculum, gaps are taxed, and small targets may leave little room for imports. The pinned full-scale Rivanna runs report $88.79\% \pm 0.08\%$ for the frozen probe, $93.92\% \pm 0.12\%$ for fine-tuning, and $94.14\% \pm 0.08\%$ for scratch with ResNet-18. They illustrate a richer regime where adaptation repairs most of the feature mismatch. Diagnosing the regime is the skill.
>
> Removed: “The convolutional trunk travels on: the autoencoder interlude squeezes a whole image through it into one fixed-width code, and Part III starts where a single code runs out, with inputs of any length.”

Reader pass: apparatus, announces: removed by the author's ruling

**09-B2-P3c, ruling** (T2). The paragraph that follows already is the verdict; T2 never adds where one exists.

> (the paragraph could not be located; see the receipt)
>
> Removed: “Doing nothing is one weight setting away; the block learns the correction.”

Reader pass: different voice (a line the next paragraph repeats): removed by the author's ruling

### Interlude: Autoencoders: Making PCA Learnable

`chapters/interludes/making-pca-learnable.qmd`

**PCA-R2-1** (R2). An imperative in place of 'Let us' (D2), same content.

> **Set random sampling aside for a moment and ask a simpler question.** If an input has $d$ coordinates, can a network preserve its important structure using only $k<d$ numbers?
>
> Replaced: “Let us postpone random sampling for a moment and ask a simpler question.”

Reader pass: sets aside 'random sampling', which the page has not raised: kept; R2 changed only 'Let us', and the forward reference is the author's (Section B)

**PCA-R2-2** (R2). An imperative in place of 'Let us' (D2), same content.

> **Take a controlled curve with a known one-dimensional coordinate.** For $t\in[-1,1]$ , define
>
> Replaced: “Let us use a controlled curve with a known one-dimensional coordinate.”

Reader pass: no mark.

**PCA-T5-1** (T5). A prediction before the planted-curve rematch, in its own terms: the bend, one number per point, the same line.

> The alternating grid points form train and held-out sets. PCA and a tied linear autoencoder receive a one-dimensional bottleneck, as does a nonlinear $2\rightarrow24\rightarrow1\rightarrow24\rightarrow2$ autoencoder. The comparison is intentionally about representational shape, not parameter efficiency. The nonlinear model has far more adjustable knobs. **Before you run it, predict which map can follow the bend with one number per point, and whether PCA and the tied linear autoencoder will find the same line.**

Reader pass: no mark.

**PCA-S3-1** (S3). The callout keeps its option and drops the impersonal 'one can'.

> **A deterministic autoencoder may still be used inside a generative system, and we can fit a separate distribution to its codes.** The narrower statement is the important one: ordinary reconstruction training supplies no built-in latent prior and no principled rule for arbitrary random draws. A code is not yet a probability distribution.
>
> Replaced: “generative system, and one can fit a separate distribution”

Reader pass: no mark.

**PCA-T5-2** (T5). A prediction before the clean-versus-denoising run, in the experiment's own words (arms, clean images, corrupted inputs).

> We can now make “same architecture, different training” measurable. Both models below use exactly the ledger above. One sees clean images and reconstructs clean images. The other receives Gaussian-corrupted images but is scored against the clean targets. The development file is split into 900 fit and 300 validation examples; the committed 600-example shared benchmark is evaluated only after validation has selected each checkpoint. Earlier chapters already use that benchmark, so this is an endpoint reuse, not a newly sealed test. Five seeds repeat training. Labels never enter the experiment. **Before the scores print, predict which arm reconstructs clean test images better and which copes better with the corrupted inputs.**

Reader pass: no mark.

### 10 Sequences and Recurrence

`chapters/part3/10-sequences-rnn.qmd`

**10-R5-1** (R5). Contraction expanded (D5).

> $\vect{h}_t$ is whatever $f$ chooses to remember about everything seen so far, compressed into one fixed-size vector. Feeding it back in makes a claim with a classical name, the Markov property : $\vect{h}_{t-1}$ and $\vect{x}_t$ together contain everything needed for the next step. Nothing else from the past gets a second look. **That claim buys streaming (process tokens as they arrive), any sequence length (the loop does not care), and, later in this chapter, the license to train on chopped-up chunks.** Its price is that the memory is finite , and this part of the book ends when we finally refuse to pay that price ( Chapter 12 ).
>
> Replaced: “sequence length (the loop doesn't care)”

Reader pass: no mark.

**10-R5-2** (R5). Contraction expanded (D5).

> **The Gated Recurrent Unit (Cho et al., 2014) folds the same ideas into a smaller box: cell and hidden state merged into one $\vect{h}_t$ , forget and input valves merged into a single update gate $\vect{z}_t$ (what you keep you do not overwrite, and vice versa), plus a reset gate $\vect{r}_t$ that can blank the past when a fresh start is called for:**
>
> Replaced: “(what you keep you don't overwrite, and vice versa)”

Reader pass: no mark.

**10-S5-1** (S5). The page carried 'honest' three times; this one becomes a plain word and the sentence still reads as a sentence (P4).

> **Read the output closely, because both halves of the verdict teach.** What it got : words, spacing, sentence rhythm, markdown furniture (asterisks, pipes, colons), and the book’s working vocabulary (training, batch, layer, convolution in various misspellings), all learned from raw characters by a one-layer recurrence reading 100-character chunks. What it lacks : meaning. Clauses trail off; equations open and never close; the prose has the book’s accent with none of its intent. Some of that is scale (a 150k-character corpus and 128 hidden units is a tiny language model), and some of it is the finite state. By the end of a sentence, the beginning has been squeezed through the LSTM’s two 128-dimensional states, $(\vect{h}, \vect{c})$ : 256 scalars in all. Both diagnoses point down the road this part of the book is traveling.
>
> Replaced: “Read the output honestly, because both halves of the verdict teach.”

Reader pass: no mark.

### 11 Encoder–Decoder, Teacher Forcing, Beam Search

`chapters/part3/11-encoder-decoder.qmd`

**11-R5-1** (R5). The one contraction the brief lists, inside the words given to <eos>.

> **Three special tokens run the show, the same conventions as the course’s full translation pipeline: <pad> fills the short sequences of a batch out to a rectangle, <bos> tells the decoder “begin,” and <eos> lets the model say “I am done”: remember, the machine must be free to choose its output length.**
>
> Replaced: “"I'm done": remember”

Reader pass: no mark.

**11-S5-1** (S5). One of four 'honest' forms becomes a plain word that keeps the point: free-running trains the way inference runs.

> **Free-running (“fr”) is the straightforward answer: feed the model’s own predictions back in, exactly as at inference.** But its flaws are structural. Early in training those predictions are garbage $\rightarrow$ the decoder learns conditioned on garbage $\rightarrow$ every sequence must be generated token-by-token in a Python loop, because step $t$ ’s input does not exist until step $t-1$ is computed. Slow, and unstable exactly when training is young.
>
> Replaced: “Free-running ("fr") is the honest answer:”

Reader pass: no mark.

**11-R9-1** (R9). An unambiguous typo or punctuation slip in baseline text (R9).

> The errors are plausible-looking digit substitutions and order slips. The decoder has learned a date-shaped language, but no hard mechanism forces each output field to copy the corresponding source fact. Off the gold rail, one wrong character can alter the context for every character after it. **Hold that thought for two sections.**
>
> Replaced: “Hold that thought two sections.”

Reader pass: no mark.

**11-R9-2** (R9). An unambiguous typo or punctuation slip in baseline text (R9).

> The engineered compromise (Bengio et al., 2015): during training, at each timestep flip a biased coin (probability $\epsilon$ of the gold token, $1 - \epsilon$ of the model’s own prediction) and anneal $\epsilon$ from 1 toward 0 as training matures. Early epochs enjoy the gold rail; late epochs practice recovery. **One design detail from the original paper worth repeating: flip per token, not per sequence ; committing a whole sequence to model predictions early in training lets consecutive errors amplify.** Exercise 3 has you build it.
>
> Replaced: “per sequence, committing”

Reader pass: no mark.

**11-S5-2** (S5). Second thinning; the sentence reads unchanged without the adjective (P4).

> Each displayed score is the sum of token log-probabilities along that one sequence, including <eos> when it was reached. These are raw joint log scores , not a normalized distribution over the printed beam, so exponentiating two of them and calling the result a 70/30 posterior would be wrong. Some pairs correspond cleanly to the month/day and day/month readings. **Others include a high-scoring hybrid that matches neither convention, a reminder that beam search searches the model; it does not install a calendar constraint.** The ranking still exposes alternatives that greedy search hides.
>
> Replaced: “an honest reminder that beam search searches the model”

Reader pass: contradicts the printed beams (one hybrid, and a valid calendar date): kept; S5 removed one word, and the content fix is the author's (Section B)

**11-R7-1** (R7). The caption named the point by colour alone while the plot has other dots; it now names the role, as its own first sentence does.

> (the paragraph could not be located; see the receipt)
>
> Replaced: “Packing simply stops the clock at the green dot.”

Reader pass: no mark.

### 13 Attention: Making the Kernel Learnable

`chapters/part4/13-attention.qmd`

**13-B2-P3a, P3** (V4). The sentence announced the move the next two sentences make.

> An embedding can learn what lives at row 17, but fetching row 17 is still a rigid act of indexing: learned content behind a hard address. Replace the one address with a distribution over addresses, let the gradient reach every score, and the model can learn which rows deserve weight. Compare one request with every stored candidate, normalize the scores, and blend the stored values with the resulting weights. That is Chapter 2’s softmax. This content-dependent weighted read is attention . By the end of the chapter you will have built it twice, masked it correctly, and watched it carry a date’s year to the front of the output.
>
> Removed: “You already own the tool that softens it.”

Reader pass: not marked; removed under the ruling on its partner, since it announced what the next sentences state (V4)

**13-B2-P3b, ruling** (S2). An imperative in step with the one before it; 'In practice:' read as a label.

> An embedding can learn what lives at row 17, but fetching row 17 is still a rigid act of indexing: learned content behind a hard address. Replace the one address with a distribution over addresses, let the gradient reach every score, and the model can learn which rows deserve weight. **Compare one request with every stored candidate, normalize the scores, and blend the stored values with the resulting weights.** That is Chapter 2’s softmax. This content-dependent weighted read is attention . By the end of the chapter you will have built it twice, masked it correctly, and watched it carry a date’s year to the front of the output.
>
> Replaced: “In practice: compare one request”

Reader pass: punctuation slip (the colon made 'In practice' a label): fixed by the author's ruling

**13-B2-P3c, ruling** (S2). The callback names the tool and stops; the promise bookkeeping goes.

> An embedding can learn what lives at row 17, but fetching row 17 is still a rigid act of indexing: learned content behind a hard address. Replace the one address with a distribution over addresses, let the gradient reach every score, and the model can learn which rows deserve weight. Compare one request with every stored candidate, normalize the scores, and blend the stored values with the resulting weights. **That is Chapter 2’s softmax.** This content-dependent weighted read is attention . By the end of the chapter you will have built it twice, masked it correctly, and watched it carry a date’s year to the front of the output.
>
> Replaced: “That is Chapter 2's softmax, keeping the promise that chapter made.”

Reader pass: refers to the book's apparatus, written to satisfy a rule: cut by the author's ruling

**13-B2-P3e, P3** (S2). States the fact in the chapter's own terms instead of pointing at where the book said it.

> Because the query comes from the decoder and the memory comes from the encoder, this is cross-attention . It bridges two sequences. The model still initializes the decoder from the encoder’s final state, but that fixed bridge is no longer the only path from source to output: every decoder step receives its own context $\vect{c}_t$ . **The old handoff was a finite-state bottleneck .** Chapter 12 kept the memory bank; this chapter completes that relay by learning its access rule.
>
> Replaced: “Part III called the old handoff a finite-state bottleneck.”

Reader pass: refers to the book's apparatus, written to satisfy a rule: recast in content terms

**13-B2-P3d, instruction 0** (T2). The paragraph already carries the display's verdict ('The hot path is two dense products'); the added one put 'softmax' twice in a row.

> where $\matr{K}^{\top}$ transposes the last two axes within each batch. Softmax runs over the last, key-position axis. The hot path is two dense products: $\matr{Q}\matr{K}^{\top}$ and $\matr{A}\matr{V}$ . Additive attention remains useful and accelerator-compatible; scaled dot product maps more directly to the matrix operations modern numerical libraries optimize heavily. Appendix C turns that intuition into a conditional performance model: dense products can earn high arithmetic intensity through reuse, but shapes, data movement, implementation, and hardware decide the actual regime ( Appendix C ).
>
> Removed: “Compare in one product, mix in the other; softmax sets the weights.”

Reader pass: not marked; removed under instruction 0 (a brief-quoted candidate that does not fit its paragraph)

**13-B2-P3f, P3** (S1). The author's caveat returns beside the rule; the merged sentence overclaimed what the audit tests.

> The score’s standard deviation grows as $\sqrt{d_k}$ . Dividing by that quantity returns the idealized variance to one. **This is a variance-control rationale, not a promise that trained projections remain independent or unit variance.**
>
> Replaced: “Nothing forces trained projections to stay independent or unit-variance, so read the square-root factor as variance control under stated assumptions rather than a law about trained layers; the audit below tests exactly those assumptions.”

Reader pass: written to satisfy a rule, apparatus, different voice, and an overclaim ('tests exactly those assumptions'): the author's two sentences restored

**13-B2-P3g, P3** (S1). The caption keeps its own limiting clause again.

> (the paragraph could not be located; see the receipt)
>
> Replaced: “weight near one quarter (0.24 in this draw)."”

Reader pass: no mark.

### Interlude: Attention as Test-Time Regression

`chapters/interludes/attention-as-test-time-regression.qmd`

**TTR-R9-1** (R9). An unambiguous typo or punctuation slip in baseline text (R9).

> Figure TTR. 1 makes a prediction we can test without pretending to train a language model or benchmark a state-space model. Store $N$ random unit key–value pairs, then query every stored key. Decode a read by the nearest stored value. Exact softmax attention keeps all pairs. A dense delta state has $d^2$ numbers regardless of $N$ . **A selective delta arm receives one extra priority bit and writes ordinary pairs at only one-tenth strength, so it can choose what to sacrifice.**
>
> Replaced: “at only one tenth strength”

Reader pass: no mark.

**TTR-B2-P3a, P3** (T4). Chapter 15's opener carries this transition in the same image ('Text can write its own questions'); the handoff also repeated the opener's 'holds X fixed and changes Y' frame.

> Selective retention spends a budget. The sealed recall study shows a gate trading ordinary recall for priority recall; it does not establish a universal architecture ranking.
>
> Removed: “The next chapter holds the architecture fixed and changes where supervision comes from: unlabeled text writes its own questions, and the representation it trains becomes worth reusing.”

Reader pass: announces; repeats the opener's frame: removed

### 17 Adapting Pretrained Models: Prompting, PEFT, Quantization

`chapters/part5/17-peft-quantization.qmd`

**17-B2-P3a, ruling** (T1). The opener already poses its own two questions; a promise posing different ones was worse than none.

> The useful organizing questions are therefore not simply “How many parameters?” They are where does task-specific information live, and which object does the method change? Hard prompts and retrieved documents place task information in context. Parameter-efficient fine-tuning (PEFT) places it in a restricted set of learned values. Quantization need not add task information at all; it changes the numerical representation of a base or adapter. QLoRA composes the last two.
>
> Removed: “Every method in this chapter answers the same two questions: which object it changes, and which of the three bills it cuts.”

Reader pass: announces, and poses different questions from the opener's: removed by the author's ruling

**17-B2-P3b, P3** (S1). The author's paragraph returns whole: the GPT-3 finding with its own limits, and the closing clause on mechanism.

> ****Brown and colleagues found that few-shot gains often grew with model scale in GPT-3, but that is an empirical result over particular models and tasks.** It does not establish universal parameter thresholds, nor does it settle the mechanism by which a Transformer uses demonstrations.** Attention makes earlier examples visible and routable; saying it literally “performs analogy” would outrun the evidence. Prompt order, label words, formatting, and example choice can all matter. Controlled ablations have found that demonstration inputs, the label space and its mapping, formatting, and ordering can contribute differently across tasks. **Those results constrain simple stories about copying examples, but they do not settle one universal causal mechanism for ICL.**
>
> Replaced: “None of the evidence below settles a universal causal mechanism for how a Transformer uses demonstrations.” “Brown and colleagues found that few-shot gains often grew with model scale in GPT-3, an empirical result over particular models and tasks that does not establish universal parameter thresholds.” “Those results constrain simple stories about copying examples.”

Reader pass: announces (the scope sentence) and hedge (the merged GPT-3 sentence): the author's paragraph restored

**17-B2-C20a, C20** (S5). The table cell differs from the baseline by one deleted word, as C20 requires.

> **State in continuous input vectors; write prompt vectors, plus any unfrozen head**
>
> Replaced: “write prompt vectors, plus any head left unfrozen |”

Reader pass: no mark.

**17-B2-C20b, C20** (S5). Same one-word thinning for the LoRA row.

> **State in $\matr{A},\matr{B}$ ; write factors, plus any unfrozen head**
>
> Replaced: “write factors, plus any head left unfrozen |”

Reader pass: no mark.

**17-B2-C20c, C20** (S5). Same one-word thinning for the QLoRA row.

> **State in $\matr{A},\matr{B}$ ; write factors, plus any unfrozen head**
>
> Replaced: “write factors plus any head left unfrozen |”

Reader pass: no mark.

**17-B2-C15, C15** (T1). The two questions themselves, plainly, in place of a sentence about where the answers sit.

> (the paragraph could not be located; see the receipt)
>
> Replaced: “Each method below must answer two questions on this ledger, which object it changes and which of the three bills it cuts, and the table under Choose by the bill you need to reduce answers both for every method.”

Reader pass: announces, different questions: removed (17-B2-P3a)

**17-B2-C16, C16** (S5). The thinned caption sentence reads as a sentence again (P4).

> (the paragraph could not be located; see the receipt)
>
> Replaced: “Counts label trainable adapter values in this small layer."”

Reader pass: no mark.

## Section B: decisions pending, and the reader marks that were resolved

### B1. Prose that contradicts a printed number

The printout is the source of truth; each fix is for the author to apply (several sit
inside math, which this pass may not touch).

| page | where | printed | prose | recommended fix |
|---|---|---|---|---|
| Chapter 8 | The rematch, before the run | MLP 42.0% at a two-pixel shift (the printout below; Chapter 6's own run printed 46.5%) | "The MLP managed 76% and 43%." | "43%" → "42%" |
| Chapter 13 | The matched-schedule rematch | 53.75% at epoch 6 | "$53.8\%$", beside a two-decimal "$93.25\%$" | "53.8" → "53.75" |
| Test-time-regression interlude | Solver 3 | a two-line aligned display | "gives the delta recurrence in three lines:" | "three" → "two" |
| Chapter 1 | Regularization, briefly | weight MSE 1.2347 → 0.4400 (2.8 times) | "cuts the damage several-fold" | "several-fold" → "nearly threefold" |
| Chapter 9 | Batch normalization | two rows, "without BN layer stds" and "with BN layer stds" | "the BN column holds a near-constant spread" | "column" → "row" |
| Chapter 17 | Make the rank bottleneck fail on purpose | 0.000000 at six decimals (below $5\times10^{-7}$) | "recover the target to below $10^{-7}$" | "$10^{-7}$" → "$10^{-6}$", or print more digits |
| Chapter 6 | Experiment 1 | 76.0% → 46.5%, a 39% relative drop | "Two pixels, and the accuracy is nearly cut in half." | no single token fits; "is nearly cut in half" → "loses nearly two-fifths" |
| Chapter 11 | Search exposes alternatives | one hybrid ('1995-09-20') among four beam pairs, and it is a valid calendar date | "Others include a high-scoring hybrid ... it does not install a calendar constraint" | "Others include" → "One pair includes"; "a calendar constraint" → "a rule that copies each source field" |
| Chapter 10 | The book reads itself | the printed sample shows `$$`, `##`, `\logit_i`, `$\rightarrow$`, "gradient", "optimized" | "markdown furniture (asterisks, pipes, colons), and the book's working vocabulary (training, batch, layer, convolution ...)" | no single token fits; name what the printout shows ("dollar signs, pound signs, backslashes"; "gradient, optimized") |
| Chapter 10 | The memory test | vanilla RNN 25% / 100% / 25% at lag 80 | "precisely where Equation 10.3 says the vanilla cell must fail" | "must fail" → "should fail" |

### B2. Content the readers raised outside the voice rules

Baseline text; default for each: leave, for the author to decide.

- **Chapter 1.** "a little bias, traded for a lot of variance" reads as the opposite of
  the section's "a little more bias for a lot less variance".
- **Chapter 6.** "Experiment 1 kept the clean model and changed only the test images":
  those were validation images (fix: "test" → "validation"). "The displayed arrays are
  not recognizable pictures anymore": the page shows no scrambled image. "No point on
  either curve survives a two-pixel shift": the width sweep measures no shift. Exercise
  4 cites "Table 6.1", which no table on the page carries.
- **Chapter 8.** "linear in $V$" uses $V$ before the page defines it (the plan calls the
  kernel `K`). The rematch asks the reader to predict LeNet's clean accuracy, which the
  previous section already printed (74.5%).
- **Chapter 9.** Without BN the spread "keeps sagging", but the printed values bottom at
  0.043 and climb to 0.061. "Every layer trains from day one" rests on a forward-pass
  measurement; the later gradient printout shows the plain stack with BN growing to
  8.3e+01 at its deepest setting, and no sentence reads that row. "One change we will reveal after the
  numbers" is named by the next paragraph, before the numbers. The transfer section's
  reason 1 says the shoe features collapse "into nearly the same point" while the probe
  scores 70.6% against a 33% chance. The decision-rule tip's "supported by the
  experiments" and "wide margin" rest on the course assignment, not on an experiment on
  the page. Exercise 5 compares the 30-image shoe task with the ten-class full-data
  results. Exercise 2 renders "1×1-plus- 5×5": a line break inside the exercise text,
  left because joining it changes the exercise's spacing.
- **Chapter 17.** "The query asks for another group's label" contradicts the example
  before it, whose query group already appears among the demonstrations. The sentence
  that names "the four-part freeze audit" lists three parts; the callout lists four. The
  adapter display ends in a comma, but a new sentence follows it (a math fix).
- **Test-time-regression interlude.** Recap item 2, "Softmax attention keeps a
  query-dependent dataset": the stored rows do not depend on the query; the fit does.
- **PCA interlude.** "Changing the corruption and target changes the function the same
  architecture is rewarded for learning": the target is clean in both arms; only the
  input changes (fix: "the corruption and target" → "the corruption"). "Different-domain
  input → target uses the same contract for translation" contradicts the next sentence,
  "Changing the input–target contract changes what the code must preserve". The opening
  sets aside "random sampling" before the page has raised it (the author's sentence; R2
  changed only "Let us").
- **Chapter 11.** The final test audit prints free-running at 99.1% against teacher
  forcing's 93.1%; the prose then calls teacher forcing the pragmatic default without
  naming that six-point gap. "You can see the shape of this failure in our model's rare
  residual errors" introduces errors that are final-digit slips and one order swap, not
  an early slip that derails the rest. Exercise 2 asks why greedy ($k = 1$) is not
  usable, while the page uses greedy throughout and calls it usually fine. Plan step
  "Implement the residual errors, up close." has a verb forced onto a title (plan steps
  are frozen; suggested: "Print three residual errors up close.").
- **Chapter 10.** "Chunk sampling *is* truncated backpropagation through time" contradicts
  the page's own definition two sections earlier ("fixed-window training, not truncated
  BPTT, because no state is carried between windows"); fix: "is fixed-window training".
  "The fixed-size state is about to face that rematch" points back to no rematch of the
  state. "The change in tokenization is audible: generated samples now contain full
  words" describes word-level samples the page does not print. Two plan steps are broken
  by the plan template ("Run a character-level LSTM trained on Chapters 1–9." on a cell
  that only loads the corpus, and "Run char lm train run."); plan steps are frozen.

### B3. Decisions pending, each with a default

1. **Chapter 10's guard ceiling.** The brief counts Chapter 10's guards at 1.9 per 1,000
   words "under the Part III ceiling"; VOICE.md sets that ceiling at 1.5 and the ledger
   measures 2.5 (8 guards in 3,234 words). The guards stay under the standing rule.
   *Default:* keep 1.5 as a warning and leave the guards; say if Part III should share the
   2.5 ceiling of Parts IV and V.
2. **The PCA interlude's guards.** Five prose guards (3.4 per 1,000 against 2.5): two in
   the frozen recap list, the caveat beside the PCA rule, the manifold-learning scope,
   and the endpoint-reuse disclosure. Rephrased candidates read no better. *Default:*
   leave.
3. **Reserved taste-grades.** "The beautiful gradient" (Chapter 2 heading and a code
   comment) and "a seductive story" (Chapter 3) are left for you, as asked. *Default:*
   leave until you decide; both pages come up in B2b.
4. **S6 elsewhere.** `grades.md` lists every taste-grade word left in the book. S6 ran
   on the ten pages in scope; Chapters 5 and 7 and the rest meet it in their batches.
   *Default:* sweep S6 with each batch.
5. **Plan steps broken by the plan template.** Chapter 10 ("Run a character-level LSTM
   trained on Chapters 1–9." on a cell that only loads the corpus; "Run char lm train
   run.") and Chapter 11 ("Implement the residual errors, up close."). Plan steps are
   frozen by I11. *Default:* you fix them, or authorize a one-commit plan-step
   correction outside the voice rules.
6. **`main` has moved past this branch.** At your request, `main` now carries #5 and
   #6 (merged in that order; #6 rebased onto #5 and Chapter 1 re-rendered), the
   HTML-only website (no PDF offered on the site or built in CI), and your Chapter 8 and
   9 replays (`b2a1ad0`). This branch still starts from `86ec60b`, so it still has the
   PDF download page and the old contract audits, and its print PDF is a local proof.
   *Default:* merge `main` into `voice-coherence` at the start of B2b and re-render
   Chapters 1, 8, and 9 there; expect conflicts in Chapter 1's source and freeze,
   `publish.yml`, `audit_book_contract.py`, and the replay receipts of Chapters 1, 8,
   and 9.
7. **The Equation 8.1 patch** (branch `author-corrections`, uncommitted in its worktree,
   not rendered). *Default:* hold it for the next patches and render once; say whether
   Equation 7.1 should also switch to $u, v$.
8. **The first-round reader marks** on the seven B0 and B1 pages were judged against a
   generic standard. *Default:* no further action on them; the calibrated instruction
   governs from B2a on.

### B4. Reader marks on edited sentences, as resolved

| page | edit | mark and resolution |
|---|---|---|
| 01-linear-regression | 01-B0-N6a | announces: kept; it carries the author's 'Let us see that, not just assert it' under D2 |
| 06-generalization-inductive-bias | 06-B0-C12a | fragment, announces: kept; restored author text |
| 06-generalization-inductive-bias | 06-B0-C4b | written to satisfy a rule, different voice: recast in the author's words (06-B2-P3a) |
| 06-generalization-inductive-bias | 06-B2-P3a | written to satisfy a rule, different voice: recast in the author's own words |
| 08-cnn | 08-S5-1 | apparatus ('column'), written to satisfy a rule: kept; the printout has a validation column, and 'in this single seeded run' is the author's |
| 09-modern-cnns-transfer | 09-B2-C17 | written to satisfy a rule (test-set disclosure): kept; the disclosure is the author's, and C17 only folded the announcement into it |
| 09-modern-cnns-transfer | 09-B2-P3a | apparatus, announces: removed by the author's ruling |
| 09-modern-cnns-transfer | 09-B2-P3b | announces: clause dropped by the author's ruling |
| 09-modern-cnns-transfer | 09-B2-P3c | different voice (a line the next paragraph repeats): removed by the author's ruling |
| 09-modern-cnns-transfer | 09-B2-P3d | punctuation slip (colon after 'is'): fixed |
| 09-modern-cnns-transfer | 09-R2-1 | announces: clause dropped by the author's ruling (09-B2-P3b) |
| 09-modern-cnns-transfer | 09-R5-2 | announces, apparatus: kept; R5 expanded one contraction in the author's sentence |
| 09-modern-cnns-transfer | 09-R5-3 | announces (the next paragraph gives the change away): kept; R5 only; the spoiled reveal is reported in Section B |
| 09-modern-cnns-transfer | 09-S5-3 | punctuation slip: fixed (09-B2-P3d) |
| 09-modern-cnns-transfer | 09-S5-4 | written to satisfy a rule, different voice: kept; S5 removed one word from the author's limitation |
| 09-modern-cnns-transfer | 09-T2-1 | different voice: removed by the author's ruling (09-B2-P3c) |
| 09-modern-cnns-transfer | 09-T4-1 | apparatus, announces: removed by the author's ruling (09-B2-P3a) |
| making-pca-learnable | PCA-R2-1 | sets aside 'random sampling', which the page has not raised: kept; R2 changed only 'Let us', and the forward reference is the author's (Section B) |
| 11-encoder-decoder | 11-S5-2 | contradicts the printed beams (one hybrid, and a valid calendar date): kept; S5 removed one word, and the content fix is the author's (Section B) |
| 13-attention | 13-B0-C1 | not marked; removed under instruction 0 (13-B2-P3d) |
| 13-attention | 13-B0-C2 | punctuation slip: fixed (13-B2-P3b) |
| 13-attention | 13-B2-P3a | not marked; removed under the ruling on its partner, since it announced what the next sentences state (V4) |
| 13-attention | 13-B2-P3b | punctuation slip (the colon made 'In practice' a label): fixed by the author's ruling |
| 13-attention | 13-B2-P3c | refers to the book's apparatus, written to satisfy a rule: cut by the author's ruling |
| 13-attention | 13-B2-P3d | not marked; removed under instruction 0 (a brief-quoted candidate that does not fit its paragraph) |
| 13-attention | 13-B2-P3e | refers to the book's apparatus, written to satisfy a rule: recast in content terms |
| 13-attention | 13-B2-P3f | written to satisfy a rule, apparatus, different voice, and an overclaim ('tests exactly those assumptions'): the author's two sentences restored |
| 13-attention | 13-S1-1 | written to satisfy a rule, apparatus, overclaim: the author's sentences restored (13-B2-P3f, 13-B2-P3g) |
| 13-attention | 13-S2-1 | 'That is Chapter 2's softmax, keeping the promise that chapter made' marked: cut (13-B2-P3c); its setup sentence removed (13-B2-P3a) |
| 13-attention | 13-S2-2 | apparatus, written to satisfy a rule: recast (13-B2-P3e) |
| 13-attention | 13-S4-1 | defensive hedge, different voice: kept; S4 only removed an intensifier from the author's sentence |
| 13-attention | 13-T1-1 | announces (a chapter roadmap): kept; C8 and B2 decision 2 keep this promise, which names what the reader will build |
| attention-as-test-time-regression | TTR-B0-C8 | announces: kept; restored author text (the original opener sentence) |
| attention-as-test-time-regression | TTR-B2-P3a | announces; repeats the opener's frame: removed |
| attention-as-test-time-regression | TTR-S1-3 | scope disclaimer: kept; the author's sentence, with a same-claim guard merged in (guards_moved.md) |
| attention-as-test-time-regression | TTR-T4-1 | announces, templated: removed (TTR-B2-P3a) |
| 17-peft-quantization | 17-B0-C5 | announces: restored away (17-B2-P3b) |
| 17-peft-quantization | 17-B2-C15 | announces, different questions: removed (17-B2-P3a) |
| 17-peft-quantization | 17-B2-P3a | announces, and poses different questions from the opener's: removed by the author's ruling |
| 17-peft-quantization | 17-B2-P3b | announces (the scope sentence) and hedge (the merged GPT-3 sentence): the author's paragraph restored |
| 17-peft-quantization | 17-R2-1 | apparatus ('promises'), announces: kept; R2 turned the author's 'Let us put those promises on one ledger' into an imperative |
| 17-peft-quantization | 17-S1-4 | hedge: restored away (17-B2-P3b) |
