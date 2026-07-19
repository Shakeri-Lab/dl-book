# Style Guide: Heman Shakeri's Deep Learning Teaching Voice

## Voice in One Paragraph

Professor Shakeri's teaching voice is fundamentally principle-first and concrete. He begins with intuition and motivation—often a problem that needs solving or a limitation of the previous approach—then builds the mathematical formalism only when its necessity is clear. He favors analogies to physical systems or common tools before jumping to abstraction; the "magnifying glass" for convolution kernels, the "master chef vs. sous-chefs" for CPU vs. GPU, and the "ball rolling downhill" for momentum all emerge from lived experience rather than invented metaphors. He poses questions back to students ("why do you think we need bias in linear regression?"), pauses for students to think, then reveals the answer with careful step-by-step algebra. His code narration mirrors this: he explains *why* he's about to write something before typing it, narrates each line as he implements it, and pauses when errors appear to diagnose root cause rather than simply fixing and moving on. The voice is conversational but rigorous—he will not hand-wave; if something matters, he derives it or points to where the proof lives. He cares deeply about reproducibility, device placement, batch dimension preservation, and what he calls "coding hygiene"—these are not afterthoughts but core values in how he teaches practice.

## Signature Moves: Recurring Rhetorical Patterns

1. **The "Why this matters" setup.** Before introducing a new concept, he names the problem it solves.
   - *Example:* "Why this is a difficult problem? One main reason is f should be flexible like I said but at the same time we can have many f that can satisfy this condition. However we want one of them that maybe is most suited to our case."
   - *Use in book:* Introduce a limitation or open question before presenting the solution.

2. **"Let us..." + invitation to solve together.** A frequent opener that invites the reader into collaborative thinking.
   - *Example:* "Let us uh implement linear regression in a neural network form..." and "Let us add a couple of layers to our linear model."
   - *Use in book:* Start problem-driven sections with "Let us explore...", "Let us revisit...", "Let us build...", to create partnership with the reader.

3. **Geometric/visual grounding before symbols.** He sketches or describes a shape, then writes the math.
   - *Example:* "basically we have a hyperspace defined by our linear regression... the column space so of x give us a basis for this uh hyperspace."
   - *Use in book:* Describe spatial intuition (the linear subspace, the gradient landscape, the activation path) before or alongside the equations.

4. **"Remember that..." as a bridge between modules.** He frequently recalls earlier concepts to show continuity.
   - *Example:* "Remember that we want the loss to be minimized over all of this examples..."
   - *Use in book:* Consistently reference prior chapters with "Recall from Module X..." or "As we saw when learning about...".

5. **The "Here's what happens in practice vs. theory" move.** He notes the gap between mathematical proof (sampling with replacement) and reality (sampling without replacement), and explains why we do it anyway.
   - *Example:* "This proof is not real uh is uh for the case of uh sampling with replacement... this is a active field of research on how to make this more theoretically rigorous."
   - *Use in book:* Acknowledge practical deviations from ideal theory; call them out honestly.

6. **Detailing the "energy" or "flow" of signals.** He speaks of activations and gradients flowing through the network, with energy that can explode, vanish, or flow smoothly.
   - *Example:* "the signal the gradient signal that comes from the uh last layer to be very weak and it it cannot update basically the early layer efficiently."
   - *Use in book:* Use metaphor of signal flow, energy, highways, and bottlenecks to explain depth and gradient dynamics.

7. **"Good coding hygiene" as a value.** He pauses to emphasize defensive practices, type hints, device placement, and batch-shape preservation.
   - *Example:* "This is really a good practice in coding... just having the types that we are going to expect this variable to have uh and determining them here in the function will make it more readable."
   - *Use in book:* Flag "coding hygiene" moments—explicit callouts of defensive design patterns that prevent subtle bugs.

8. **The "Let me fix that" debugging moment.** Rather than hiding errors, he shows discovery and correction in real time.
   - *Example:* "Currently here the learning rate which is a correctly a tensor of this shape is multiplying by a two by 1,000 tensor. This is strange... So let's just take this here I want to compare it to the error here."
   - *Use in book:* In code walkthroughs, show the diagnosis process, not just the final clean code.

9. **Explicit naming of concepts at their first use.** When introducing a new term, he states it clearly and often notes alternative names.
   - *Example:* "We call this a batch and a batch is much smaller... We will call this situation a high bias situation... So we call this a regularization."
   - *Use in book:* Always name the concept on first introduction; list aliases if they exist.

10. **The "Okay, so..." recapitulation.** After a long proof or code block, he summarizes what just happened.
    - *Example:* "Okay, so we discussed how we can minimize the loss function using the stochastic gradient descent algorithm."
    - *Use in book:* Use short recaps to anchor the reader after complex sections.

## Signature Analogies & Examples Inventory

| Analogy / Example | Source / Context | Use Case |
|---|---|---|
| **Master Chef vs. Sous-Chefs** (CPU vs. GPU) | ML_concepts_roadmap.tex; Lecture 0 | Explaining CPU's few powerful cores vs. GPU's thousands of simple cores; when to use each; why deep learning favors GPUs |
| **Gradient Superhighway** (ReLU) | Lecture 2 (Backpropagation) | Explaining how ReLU maintains gradient flow in deep networks vs. sigmoid's vanishing gradient problem |
| **Ball rolling downhill with momentum** | Lecture 1 & throughout; SGD momentum discussion | Explaining momentum's benefit: consistent direction accumulation, rolling through small bumps |
| **Memory bank vs. single vector** | Implied in RNN/LSTM discussion (Module 7 transcripts would contain this) | RNNs as distributed memory vs. single weight update; gating mechanisms as valves for memory flow |
| **Magnifying glass / detective expertise** | Coding transcript m04 (CNN lesson) | Convolution kernels as specialized detectors; one kernel per feature type; parameter sharing as reuse of same tool |
| **Valve/gate for LSTM** | Not yet in detailed transcripts; likely in Lecture 7 | LSTM forget/input/output gates controlling information flow through cell state |
| **Weight as a knob to turn** | Lecture 1 (foundational image) | Parameters as tuning knobs for the loss landscape; optimization as knob-turning |
| **Blame propagation** | Lecture 2 (Backpropagation) | Error signal flowing backward; delta as "blame signal" for each layer; "tell the network it's bad" |
| **House on a foundation** (super() init) | Coding transcript m03 (MLP lesson) | Building a class on top of nn.Module foundation; super().__init__() as laying groundwork |
| **Magnifying glass on full image** (MLP inefficiency) | Coding m04 (CNN) | Why MLPs flatten images and lose spatial structure; CNNs look locally |
| **Feature detectors talking to each other** (multi-channel convolution) | Coding m04 (CNN) | How output channels of one conv layer feed as input channels to the next; experts combining expertise |

## Math Exposition Rules

1. **Introduce the problem first, then the notation.** Never start with an equation. Describe what quantity you care about, what you want to minimize, what you're trying to find, *then* write the symbol.
   - *Example from transcripts:* "So what's the loss function? So basically we are minimizing the distance between our y and our prediction..." [Then writes $\text{MSE}$]

2. **Use both full-form and compact matrix notation.** Show the scalar case (element-wise) first, then the batch version. 
   - *Example:* $y = w^\top x + b$ (single sample), then $Y = WX + \mathbf{b}\mathbf{1}^T$ (batch)

3. **Chain rule as the unifying thread.** When explaining gradients, always show the chain explicitly: "how much did the knob change Z, how much did Z change A, how much did A change L?"
   - *Transcripts:* "So let's write this down in a chain rule... if I change the knob for W how much it changes Z then with the changes in Z how much it changes A with the changes of A how much it changes L."

4. **Prefer subscripts for layers over superscripts.** Use $L$ or $\ell$ for layer indices; reserve superscripts for powers or transpose.
   - *Observed in LaTeX files:* Uses $W^{(i)}$ in some places, but Shakeri leans on subscript clarity.

5. **Always define dimensionality before writing matrix products.** State "$A \in \mathbb{R}^{m \times d}$, $B \in \mathbb{R}^{d \times n}$" before writing $AB$.
   - *Coding transcripts:* "X is of course a 1,00 by 2. We expect a 1,00 2 matrix multiply by a column of size two... Uh so the answer will be a vector with this size."

6. **Use variance and "energy" language for initialization and normalization.**
   - *Example:* "To have a variance of Z to be one, we it's enough to have a a weight distribution that has an variance of 1 N."

7. **Derive, don't just assert. If you skip a derivation, say so explicitly.** 
   - *Example:* "If you plug this in, you will see that this sum will be this is basically the loss that we will deal with."

8. **Numbers before abstraction.** Show a numerical example (2 layers, 10 neurons, batch size 32) before writing the general form.

## Code Narration Rules (from `[coding]_` transcripts)

1. **Always state intent before writing.** 
   - *Pattern:* "Okay, so let's write a function that computes the accuracy of the network... it takes the output of the forward method which like I said uh the logits and the labels..."

2. **Narrate each line as you type it, especially in live-coding.** 
   - *Example:* "And notice that uh this can be really a static method... So I could just use a static method here uh with a decorator but for now let's just go with this."

3. **Call out tensor shapes explicitly whenever they change.**
   - *Example:* "So currently the sample image has a shape of uh channel H and W. Right? And the standard uh shape for convolution must have the batch size also."

4. **Name your variables descriptively, then explain the choice.**
   - *Example:* "Uh we don't want that. Uh what does that mean? It means that I haven't defined what's tupal."

5. **Use torch.no_grad() and defensive guards as pedagogical moments.**
   - *Quote:* "this is a way for PyTorch to keep the parameters out uh updates outside of the autograd uh because otherwise memory usage will explode."

6. **Show the error, diagnose it, fix it.** Don't hide mistakes; show discovery.
   - *Example:* "Something went wrong here... Oh yeah, I want the kernel numpy... Okay. So that's that and went with that."

7. **Highlight "coding hygiene" bugs: shape mismatches, in-place ops, gradient accumulation.**
   - *Moves:* "Let's just be careful... Notice that here uh pytorch must uh be creative... so to avoid that we are going to cast this weights into the form that we know..."

8. **Device placement is a first-class citizen, not an afterthought.**
   - *Example:* "let's just specify the device and the reason is first we will make a small tiny MLP but then later we will add more layers. So we may need to use CUDA or GPU."

9. **Reproducibility: set seeds early, explain why.**
   - *Quote:* "Let's just fix the seating in our generators let's make a synthetic data."

10. **Live visualization of learned features.** After training, show what the model learned.
    - *Example:* "Here for example for this uh trouser image uh we see that how these features are um extracting what they are uh expert in which are really meaningful and shows clear structure like edges gradients corners."

## Do / Don't Table for Chapter Drafts

| ✓ Do | ✗ Don't |
|---|---|
| Start with a problem ("Why do we need nonlinearity?") or motivation | Open with abstract notation or "It is known that..." |
| Use analogies to physical intuition (rolling ball, magnifying glass, chef) | Use arbitrary or purely mathematical metaphors |
| Show tensor shapes at every major transformation | Let shapes be "obvious" or implicit |
| Explain *why* a choice exists before showing the code | Jump to "here's the code" without context |
| Use "remember from Module X..." to thread concepts | Treat each module as isolated |
| Write "$z$ is the pre-activation value, which we'll call..." and stick with it | Introduce notational variants without acknowledgment |
| Break long derivations into bullet-pointed steps | Present a wall of equations |
| Show a concrete numerical example before generalizing | Go straight to the general $n$-dimensional case |
| "Coding hygiene: always initialize seeds at the top of a training script" | Assume students know to set seeds |
| Acknowledge when theory diverges from practice ("Theoretically we should sample with replacement, but in practice...") | Claim the theory is perfect without caveats |
| Use direct address: "you will see," "you should remember," "let us build" | Use passive voice: "It is observed that..." "One might say..." |
| Define loss functions as minimizing distance/error *before* writing the formula | Write $\mathcal{L} = \frac{1}{n}\sum_i (y_i - \hat{y}_i)^2$ without explanation |
| Call out computational complexity: "This is $O(n^3)$, which is expensive for large $n$." | Mention complexity without grounding it in data size |
| Explain when to use which optimizer (Adam, SGD, RMSprop) with tradeoffs | List optimizers as equivalent options |
| Use "energy" / "flow" / "signal" language for gradients and activations | Use purely algebraic language ("the partial derivative flows backward") |
| Show residual connections as "an uninterrupted path for gradients" | Describe them only as "skip connections" |
| Celebrate when a deep network trains successfully (show loss curves, accuracy) | Treat success as expected |

## Callout Mapping: When to Use Quarto Callouts

Use **`callout-note`** for:
- Definitions of new terms ("Inductive bias is the set of assumptions...")
- Foundational concepts that appear in multiple contexts
- Notation clarifications ("We'll use $W^{(i)}$ to denote weights at layer $i$...")
- Historical context ("Before ReLU, sigmoid was standard; here's why it failed...")
- *Example from lectures:* Defining "bias" and "variance" as separate concepts

Use **`callout-tip`** for:
- The "make it learnable" pivot: when Shakeri switches from theory to practice
- Debugging strategies and good practices ("Always check tensor shapes when stacking layers")
- Rules of thumb and heuristics ("Start learning rates at 0.1, then adjust")
- Shortcuts to intuition ("Think of momentum as a ball rolling downhill...")
- Best practices in code ("Use torch.no_grad() when updating parameters manually")
- *Example from transcripts:* "Here's a rule of thumb: I would start with 0.1 and then adjust this based on the behavior of my training."

Use **`callout-warning`** for:
- Common pitfalls he explicitly warns against
- Places where students often go wrong
- Shape mismatches, device placement bugs, gradient accumulation, in-place ops
- Vanishing/exploding gradient scenarios
- Why certain activation functions fail in depth
- *Example from transcripts:* "The sigmoid gate is at best only partially open and is often nearly closed. In a deep network uh these small derivative um that are multiplied together each layer... causes the gradient to shrink exponentially as it flows backward."
- Memory leaks from storing computation graphs unnecessarily
- When NOT to use certain techniques (e.g., "Residual connections are designed for very deep networks. For shallow networks this is not necessary and maybe even not helpful.")

### The collectible `Trap:` pattern

Use the existing warning callout, with a level-two heading that begins exactly
`Trap:`, for a compact misconception the reader should learn to recognize again in
later chapters. This is a heading convention, not a new callout class:

```markdown
::: {.callout-warning}
## Trap: validation accuracy is not test accuracy

Name the tempting inference, explain why it fails, and give the corrective check.
:::
```

Reserve `Trap:` for a false inference or recurring conceptual confusion. Keep an
ordinary descriptive warning heading for local coding hazards, numerical caveats, or
advice that is important but not a misconception. A trap should be short enough to
retrieve from memory: title the mistaken inference, then state the repair.

## Book-Specific Writing Rules (author feedback, July 2026)

1. **Fewer em dashes.** Use them sparingly, only where an aside genuinely helps. Prefer
   commas, colons, parentheses, or a new sentence. Where the em dash was expressing a
   *deduction* ("premise — so conclusion"), use a deduction arrow instead:
   `premise $\rightarrow$ conclusion`. Example (his):
   "We want the one that is most suited to our problem $\rightarrow$ the learning
   algorithm needs a nudge in the right direction." Short process chains may also use
   arrows: "(predict $\rightarrow$ measure $\rightarrow$ step)".
2. **Figure-rich.** Every core geometric or dynamical idea gets a figure (projection,
   descent paths, U-curves, gates, flows). Before designing one, check
   `~/dl-course-code/<module>/scenes/` for how his Manim animations compose the same
   idea, and echo that composition (see `docs/dl-course-code.md`). Verify TikZ
   conversions *visually* before embedding — captions must match content.
3. **Code: lean, typed, educational.** Keep type hints and shape comments (his hygiene),
   cut every comment that merely restates the line. One idea per cell. Experiments,
   derivations, assertions, and numerical audits show their code. Pure concept diagrams
   keep executable drawing source in the repository but set `#| echo: false`; split a
   mixed cell before hiding it so no implementation or evidence disappears with the
   coordinates.
4. **Code folded by default** (`code-fold: true` project-wide): visible code is one
   click away in HTML and prints in the PDF. Give visible figure cells a descriptive
   `#| code-summary`; use `echo: false` only for pure concept-diagram drawing cells.

## The Editorial Contract (Plan v2, July 2026)

The identity statement above everything here: **recognize the mechanism, read the
estimator, audit the evidence.** Every rule below serves a student who must do those
three things to code no human wrote.

### Pedagogy block

- **One instructional job, one primary representation, one check** per section. A
  section earns at most one new concept, carried by one primary artifact (figure,
  table, or listing), verified by one check the reader can perform.
- **Replace, do not append.** Any PR adding a figure, section, or experiment names
  what it displaces. Page count is a budget: v1.1 must not exceed v1.0.
- **The five-question chapter contract.** Every "Okay, so —" recap must answer:
  what was *Inherited*, what *Changed*, what was *Built in*, what was *Earned*
  (evidence), and what *Remaining debt* is carried forward. The questions govern
  content, not format — keep the numbered-narrative voice; do not use five headings.
- **Internals are visualized only under three conditions**: a predeclared claim,
  a falsifying control, and a caption that states what the figure does *not*
  establish. (Founding instance: the Ch. 10 forget-gate diagnostic.)
- **Prefer a rematch to a new benchmark.** New claims re-run existing tasks
  (the shift cliff, the date task, the book corpus) before importing new data.
- **The refusal ledger.** Topics deliberately not imported, with reasons, live at
  the end of this guide; future revisions inherit the refusals.

### Code block

- **Equation / kernel / harness.** Each experiment's code divides into the
  *equation* (the math being claimed), the *kernel* (the mechanism-bearing loop or
  transform), and the *harness* (setup, styling, bookkeeping). Print equation and
  kernel; fold the harness.
- **The five-part visibility test.** A line prints iff changing it changes the
  (1) function class, (2) objective, (3) estimator, (4) information visibility
  (masks, padding, causality), or (5) experimental claim. Canonical rulings:
  `pack_padded_sequence` prints (visibility); `ignore_index` prints (estimator);
  `set_to_none=True` folds (harness); `.eval()` is explained once, then prints only
  where train/eval mode is the claim.
- **First occurrence in full; thereafter the semantic delta.** Canonical numbered
  listings (the supervised update = Listing 4.1, masked softmax, padded
  cross-entropy, autoregressive decoding, seed-panel record) are printed once and
  cited by number. Later variants print only the lines that differ, introduced by
  a prose reference or `# … as Listing 4.1 …` elision comments.
- **Never abstract control flow that is the mechanism.** Teacher forcing, packed
  sequences, masked-token selection, contrastive batch construction, GAN
  alternation, diffusion timestep sampling, DPO masks, matched schedules stay
  printed even when a canonical listing exists — presented as deltas.
- **Every reduction names its axes.** Any `mean`/`sum` in printed code states, in
  a comment or adjacent prose, what is summed within an example and what is
  averaged across examples.
- **Every printed snippet is transcluded from tested source.** Printed code and
  executed code are the same artifact (executable cells or `#| file:`-included
  scripts); CI executes the notebooks. Nothing on the page is retyped.
- **Imported helpers carry a one-line contract** at first use per chapter
  (`fit_supervised: Listing 4.1 with best-checkpoint selection, Ch. 6`).
- **Stable semantics stay in the book; versioned engineering moves out.**
  Shape/mask/reduction/mode/numerical-stability semantics belong in chapters.
  Backend flags and version workarounds live in the repository's living
  compatibility note with a tested-environment statement.

### Estimator discipline

- The general discussion lives beside Ch. 4's batching license and names **three
  cases**: (i) decomposable per-example objectives (batch mean is an unbiased
  estimator), (ii) nonlinear functionals of aggregates (naive batching is biased —
  e.g., KL of the aggregate posterior, biased upward by Jensen), and
  (iii) batch-defined objectives (the batch is part of the definition — in-batch
  contrastive denominators; beam width is the decoding-side analogue; batch size
  is protocol, not estimation error).
- Later sites get one-to-two-sentence reminders using the five-row template:
  **Target / Estimator / Reduction / Validity / Boundary.**

### Exercise taxonomy

Three tags book-wide: **(Pencil.)**, **(Code.)**, and **(Audit.)** — judge-this-code
items where the reader predicts a defect's direction before deriving it. Every
(Audit.) exercise has a named wrong answer.

### Reading loop

The book's loop is **read → predict → run → audit**. Experiments state a
prediction before showing an outcome; recaps ask what evidence would falsify.

### Refusal ledger (named non-imports, with reasons)

- **Boltzmann machines, RBMs, wake–sleep** — answer a question the arc never asks
  (undirected generative pretraining); the pretraining question is answered in
  Ch. 15 in its modern form.
- **Hopfield networks, echo-state / liquid-state machines** — superseded on this
  arc; associative memory appears where it earns its keep (attention as soft
  lookup).
- **t-SNE / UMAP as additional projection tools** — the book standardizes on PCA
  projections; a second projection tool is stuffing.
- **Mixture-of-experts** — *not* refused as history: named in the epilogue's
  roads-not-taken as the Hinton-era topic that became a frontier default.

## Closing Notes

This guide reflects a teacher who believes:
1. **Concepts before code, intuition before formalism.** Every equation earns its presence.
2. **Concrete before abstract.** A specific 2D weight update before the $n$-dimensional general case.
3. **Honest about gaps.** Theory vs. practice divergences are named, not hidden.
4. **Debugging is teaching.** Errors are opportunities to show thinking, not embarrassments to skip.
5. **The reader is a collaborator.** Use "let us," pose questions, invite thinking.
6. **Technical precision matters.** Shapes, devices, and gradient flow are not minor details.

When drafting chapters in this voice, ask yourself:
- Could a student explain why we do this, not just how?
- Have I shown the problem before the solution?
- Can a student trace a tensor shape through every transformation?
- Is my notation consistent with what they learned in the prior module?
- Have I acknowledged the human experience of debugging?

The book should read like attending his lectures: rigorous but inviting, complete but never overwhelming, always with the sense that you are being taught by someone who has struggled through these concepts and wants you to really, truly understand them.
