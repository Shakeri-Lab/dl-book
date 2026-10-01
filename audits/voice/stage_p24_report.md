# Parts II and IV prose pass (P24): gate report

Branch `voice-coherence`, rebased onto `main` at `3ea96e3` after #15, #13 and #14 merged.
This batch carries W1 (colon leads and announcements), W6 (accounting words), W7 (links at
first mention) and W8 (worked instances for correspondence tables) on Chapters 8, 9, 10,
14, 15, 16, 18 and 19, one writer per page, with the rule-blind reader pass (P3) run on
the rendered pages. Ledgers, invariants, measures, the compiled-trace readings,
reader-mark counts and the I17 list are in `stage_p24_audit.md`. The PDFs built from this
commit keep `main`'s lengths: print 564 pages (399 outline entries), continuous 537, press
562.

The P24 records in `audits/voice/edits/` replay exactly: applied in order from `3ea96e3`
they reproduce each of the eight pages byte for byte.

## Section A: every changed or added sentence, in its paragraph

Pages in reading order. Each entry gives the edit, its rule, one line of intent, and the
paragraph as it now renders, with the new sentence in bold; a Removed or Replaced line
shows what went. A heading, captions, a table cell and a few paragraphs, which the gate
tool does not match to a rendered paragraph, show their source text instead. The
reader-pass mark and its resolution close each entry.

### 8 Filters and Convolution (Fixed Kernels)

`chapters/part2/07-filters-convolution.qmd`

**07-W1-1** (W1). Label before a colon becomes a clause; paired with the prescription.

> Part I ended with a diagnosis and a prescription. **The diagnosis was that our MLP’s templates span the whole frame, so they are blind to adjacency and brittle to position ( Chapter 6 ).** The prescription was make the template local, and slide it.
>
> Replaced: “The diagnosis: our MLP's templates span the whole frame, so they are blind to adjacency and brittle to position ( REF ).”

Reader pass: no mark.

**07-W1-2** (W1). Paired label becomes a clause; the italic prescription stays verbatim (the Part II page repeats it).

> Part I ended with a diagnosis and a prescription. The diagnosis was that our MLP’s templates span the whole frame, so they are blind to adjacency and brittle to position ( Chapter 6 ). **The prescription was make the template local, and slide it.**
>
> Replaced: “The prescription: make the template local, and slide it.”

Reader pass: no mark.

**07-W1-3** (W1). Noun-phrase label before a colon becomes a clause.

> **They suggest a strategy: instead of one massive network staring at the entire image, use a small detector that analyzes one patch at a time, and slide it across the image to look for its feature everywhere.** To understand what such detectors do, we first look at how vision experts used to design them by hand.
>
> Replaced: “The strategy they suggest: instead of one massive network staring at the entire image, use a small detector that analyzes one patch at a time, and slide it across the image to look for its feature everywhere.”

Reader pass: no mark.

**07-W1-4** (W1 (V4)). 'it is worth stating as' frame dropped; the recipe and its three lines stay.

> **The image version is the same idea with a small 2-D window. Its five-step recipe sits beside the three lines that carry it:**
>
> Replaced: “The image version is the same idea with a small 2-D window, and it is worth stating as the five-step recipe, set beside the three lines that carry it:”

Reader pass: no mark.

**07-W1-5** (W1 (V4)). The book's own habit goes unnamed; the check itself stays.

> Read the markers and one thing stands out: steps 2 and 5 share a line. The plan moves one window at a time; unfold places every window at once, and the next line scores them all in parallel. **That gap between a sequential plan and a vectorized kernel is where most tensor bugs live, which is why the last line checks this implementation against the framework’s own.**
>
> Replaced: “That gap between a sequential plan and a vectorized kernel is where most tensor bugs live, which is why the last line checks this implementation against the framework's own: the build-then-verify habit of this book.”

Reader pass: no mark.

**07-W1-6** (W1 (V4)). Announcement frame and its colon lead dropped; the handoff to Chapter 9 stays.

> **The output is smaller than the input.** A $k \times k$ kernel on an $n \times n$ image produces $(n - k + 1) \times (n - k + 1)$ outputs, because the window must stay inside the frame. What to do about that (and about sliding in bigger steps) is Chapter 9 ’s business.
>
> Replaced: “Also worth noticing before we move on: the output is smaller than the input.”

Reader pass: no mark.

**07-W1-7** (W1). A verbless gloss after a bold label gets its verb; one of a parallel set of three.

> **Blur uses uniform positive weights summing to 1, the 2-D moving average.**
>
> Replaced: “Blur: uniform positive weights summing to 1, the 2-D moving average.”

Reader pass: no mark.

**07-W1-8** (W1). Same set.

> **Sharpen amplifies each pixel’s difference from its neighbors.**
>
> Replaced: “Sharpen: amplify each pixel's difference from its neighbors.”

Reader pass: no mark.

**07-W1-9** (W1). Same set; the comma splice after *zero* becomes a sentence break. The sobel-split fixture literal follows (constraint 5).

> **Edge detection (Sobel) uses positive and negative weights summing to zero . Over any flat region the products cancel and the output is silent; over an edge, a sharp change in values, the sum swings large.** It answers one question: does intensity change here, in my direction?
>
> Replaced: “Edge detection (Sobel): positive and negative weights summing to zero, over any flat region the products cancel and the output is silent; over an edge, a sharp change in values, the sum swings large.”

Reader pass: no mark.

**07-W1-10** (W1). Verbless noun-phrase sentence before a colon becomes a clause.

> Edge detection (Sobel) uses positive and negative weights summing to zero . Over any flat region the products cancel and the output is silent; over an edge, a sharp change in values, the sum swings large. **It answers one question: does intensity change here, in my direction?**
>
> Replaced: “A detector that answers one question: does intensity change here, in my direction?”

Reader pass: no mark.

**07-W1-15** (W1). Author's wording: the two definitions become a list after 'Before going further, keep these two distinct:'; parentheses kept where the author's draft had an em dash (D6).

> **Before going further, keep these two distinct:**
>
> Replaced: “The two words will both matter: equivariant means the output moves along with the input (what convolution gives us); invariant means the output does not change at all (what a classifier ultimately wants: "boot", regardless of position).”

Reader pass: no mark.

**07-W1-14** (W1). Recast so the edited sentence shares no four-word run with Chapter 9's 'but it is a trade'.

> One more pair of glasses. Every output pixel is a dot product $\rightarrow$ the whole operation is linear $\rightarrow$ cross-correlation could be written as one enormous matrix multiplying the flattened image. **But that matrix has a rigid structure: almost everywhere zero (locality means each row touches only one patch), and the same nine numbers repeating along its diagonals (sharing means every row is the same template, relocated).**
>
> Replaced: “But it is a matrix with a rigid structure: almost everywhere zero (locality means each row touches only one patch), and the same nine numbers repeating along its diagonals (sharing means every row is the same template, relocated).”

Reader pass: no mark.

**07-W1-11** (W1 (V4)). 'One precision worth keeping sharp' frame dropped; its reason stays.

> **Before going further, keep these two distinct:** **Equivariant means the output moves along with the input (what convolution gives us).** **Invariant means the output does not change at all (what a classifier ultimately wants: "boot", regardless of position).** Equivariance is the raw material; in REF , pooling will spend some position information to buy local shift tolerance. Exact invariance is a stronger property and must be tested, not presumed.
>
> (source text of the paragraph; the gate tool does not match it to a rendered block)
>
> Replaced: “One precision worth keeping sharp, because the two words will both matter: equivariant means the output moves along with the input (what convolution gives us); invariant means the output does not change at all (what a classifier ultimately wants: "boot", regardless of position).”

Reader pass: no mark.

**07-W1-12** (W1). Noun label plus colon inside a parenthesis becomes a clause; no parenthesis added.

> One more pair of glasses. Every output pixel is a dot product MATH the whole operation is linear MATH cross-correlation could be written as one enormous matrix multiplying the flattened image. **But that matrix has a rigid structure: almost everywhere zero (locality means each row touches only one patch), and the same nine numbers repeating along its diagonals (sharing means every row is the same template, relocated).**
>
> (source text of the paragraph; the gate tool does not match it to a rendered block)
>
> Replaced: “But it is a matrix with a rigid structure: almost everywhere zero (locality: each row touches only one patch), and the same nine numbers repeating along its diagonals (sharing: every row is the same template, relocated).”

Reader pass: no mark.

**07-W1-13** (W1). Pair of 07-W1-12.

> One more pair of glasses. Every output pixel is a dot product MATH the whole operation is linear MATH cross-correlation could be written as one enormous matrix multiplying the flattened image. **But that matrix has a rigid structure: almost everywhere zero (locality means each row touches only one patch), and the same nine numbers repeating along its diagonals (sharing means every row is the same template, relocated).**
>
> (source text of the paragraph; the gate tool does not match it to a rendered block)
>
> Replaced: “But it is a matrix with a rigid structure: almost everywhere zero (locality means each row touches only one patch), and the same nine numbers repeating along its diagonals (sharing: every row is the same template, relocated).”

Reader pass: no mark.

### 9 CNNs: Making the Filters Learnable

`chapters/part2/08-cnn.qmd`

**08-W1-1** (W1). The brief's own example; a verb carries the sentence.

> **So we declare the kernel a parameter .** That single change is this chapter, and it is the whole revolution. Everything else here (channels, padding, stride, pooling) is the supporting cast that turns one learnable filter into a working network. By the end we will have assembled LeNet , the first great convolutional architecture, trained it on our garments, and re-run the cruelest experiment of Chapter 6 to see what the inductive bias actually bought.
>
> Replaced: “So: declare the kernel a parameter.”

Reader pass: no mark.

**08-W7-1** (W7). First mention of LeNet in running prose; same URL as the Sources entry (LeCun et al., 1998).

> So we declare the kernel a parameter . That single change is this chapter, and it is the whole revolution. Everything else here (channels, padding, stride, pooling) is the supporting cast that turns one learnable filter into a working network. By the end we will have assembled LeNet , the first great convolutional architecture, trained it on our garments, and re-run the cruelest experiment of Chapter 6 to see what the inductive bias actually bought.

Reader pass: no mark.

**08-W1-16** (W1 (V4)). Frame dropped; the reason (Chapter 5's fan-out rule) becomes the sentence.

> **Backpropagation through the slide follows the same fan-out rule we met in Chapter 5 .** The same nine numbers are used at every position of the slide $\rightarrow$ every position contributes a gradient term to the shared kernel. Those contributions accumulate, then the loss reduction supplies its scale; F.mse_loss with the default reduction="mean" averages over batch, channel, and spatial elements. Weight sharing is not just a parameter economy. At training time every patch of every image teaches the one shared template.
>
> Replaced: “One backpropagation detail deserves a sentence, because it is the same fan-out rule we met in REF .”

Reader pass: P3 mark on the next, unedited sentence (the F.mse_loss reduction, 'different voice'): overruled; the reduction sets the gradient scale this paragraph explains.

**08-W1-2** (W1). The brief's own example; each label becomes a clause.

> **Out-channels add detectives.** A conv layer with 6 output channels owns 6 independent kernels and produces a stack of 6 feature maps.
>
> Replaced: “Out-channels: more detectives.” “In-channels: detectives read the whole stack.”

Reader pass: no mark.

**08-W1-21** (W1). Author's request: name the recipe instead of pointing to Chapter 3.

> which evaluates Equation 8.1 across every input channel, accumulates across $C_{\text{in}}$ , and adds the scalar channel bias $b_o$ ; a pointwise activation follows. **A convolutional layer is an MLP layer with a structured linear map: dot products $\rightarrow$ add bias $\rightarrow$ ReLU.** Nothing in the recipe changed; only the wiring of the linear part did.
>
> Replaced: “A convolutional layer is REF 's recipe with a structured linear map: dot products MATH add bias MATH ReLU.”

Reader pass: no mark.

**08-W1-17** (W1). Noun-phrase label before a colon becomes a clause; the stacked colon goes.

> **Think of nn modules as appliances : they have knobs and memory, and PyTorch carries their state around for you ( nn.Conv2d owns its kernels and biases as nn.Parameter s, registered for autograd and visible to the optimizer).** F functions are recipes : stateless, everything passed in by hand. In Chapter 8 the kernel was ours, so F.conv2d was the honest choice; now the kernel is the layer’s business, so nn.Conv2d is. Use appliances for anything with parameters, recipes for everything else ( F.relu , F.max_pool2d ).
>
> Replaced: “A useful analogy: nn modules are appliances: they have knobs and memory, and PyTorch carries their state around for you (nn.Conv2d owns its kernels and biases as nn.Parameters, registered for autograd and visible to the optimizer).”

Reader pass: no mark.

**08-W6-1** (W6). Literal test on 'administrative debt'.

> **Chapter 8 left a practical problem: a $k \times k$ kernel on an $n \times n$ image yields only $(n-k+1) \times (n-k+1)$ outputs, because the window must stay inside the frame.** For one layer, a nuisance. For a deep stack, fatal: $28 \rightarrow 24 \rightarrow 20 \rightarrow \cdots$ and the feature map shrinks toward nothing, with edge pixels contributing to ever fewer windows along the way.
>
> Replaced: “REF left an administrative debt: a MATH kernel on an MATH image yields only MATH outputs, because the window must stay inside the frame.”

Reader pass: no mark.

**08-W6-2** (W6). Literal test on 'the asset ... banked'.

> **Now for the deepest design decision in the network, and it starts from the property Chapter 8 established.** Under matched boundary rules, convolution is equivariant on the interior: shift the garment, and every feature map shifts in lockstep. The detective’s map of clues faithfully tracks the scene. But the network’s final job is not mapping clues; it is a verdict. Is this a trouser? The answer must not depend on where the trouser stands. The feature-finding stage wants equivariance (where things are matters); the decision stage wants invariance (only what was found matters). Equivariance is what we have; invariance is what the classifier head needs $\rightarrow$ something must reduce sensitivity to location.
>
> Replaced: “Now for the deepest design decision in the network, and it starts from the asset REF banked.”

Reader pass: no mark.

**08-W6-3** (W6). The seed (constraint 8), stated literally; harvested in Chapter 16 in this PR.

> Pooling can buy tolerance by throwing away position . After two rounds, the network knows a strong vertical edge exists in a region; it no longer knows exactly where. **For classification this is the right trade, but it is a trade, and it will matter twice more in this book.** Deeper in Part II, tasks that need precise locations will have to be more careful with resolution. And Part IV goes further: self-attention ( Chapter 16 ) is so thoroughly position-agnostic that we will have to put position back in explicitly. Remember, when we get there, that position was something we once discarded on purpose.
>
> Replaced: “For classification this is the right trade, but it is a trade, and it will come due twice in this book.”

Reader pass: no mark.

**08-W6-4** (W6). The seed phrase; Chapter 16's harvest now reads 'position has to be added back explicitly'. docs/arc-seeds.md row 34 follows.

> Pooling can buy tolerance by throwing away position . After two rounds, the network knows a strong vertical edge exists in a region; it no longer knows exactly where. For classification this is the right trade, but it is a trade, and it will matter twice more in this book. Deeper in Part II, tasks that need precise locations will have to be more careful with resolution. **And Part IV goes further: self-attention ( Chapter 16 ) is so thoroughly position-agnostic that we will have to put position back in explicitly.** Remember, when we get there, that position was something we once discarded on purpose.
>
> Replaced: “And in Part IV the tables turn completely: self-attention ( REF ) is so thoroughly position-agnostic that we will have to pay to put position back in.”

Reader pass: no mark.

**08-W1-20** (W1). Idiom 'the tables turn' (an apparatus word in an added sentence) becomes a plain clause.

> Pooling can buy tolerance by throwing away position . After two rounds, the network knows a strong vertical edge exists in a region; it no longer knows exactly where. For classification this is the right trade, but it is a trade, and it will matter twice more in this book. Deeper in Part II, tasks that need precise locations will have to be more careful with resolution. **And Part IV goes further: self-attention ( Chapter 16 ) is so thoroughly position-agnostic that we will have to put position back in explicitly.** Remember, when we get there, that position was something we once discarded on purpose.
>
> Replaced: “And in Part IV the tables turn completely: self-attention ( REF ) is so thoroughly position-agnostic that we will have to put position back in explicitly.”

Reader pass: no mark.

**08-W6-5** (W6). 'Ledger' replaced.

> From depth. A neuron in the first feature map sees a $5 \times 5$ patch of the image: its receptive field . A neuron one layer up sees a $5 \times 5$ patch of feature maps , each pixel of which already summarizes a patch below $\rightarrow$ its receptive field on the original image is wider. Pooling accelerates this: after a $2\times2$ /stride-2 pool, neighboring pixels in the pooled map stand two original pixels apart, so every later window covers twice the ground. **For our upcoming network the count runs: conv1 sees $5 \times 5$ $\rightarrow$ pooling nudges it to $6 \times 6$ $\rightarrow$ conv2’s $5\times5$ window, at stride-2 spacing, expands it to $14 \times 14$ $\rightarrow$ the final pool reaches $16 \times 16$ , over half the frame in every direction, from nothing but $5 \times 5$ looks.**
>
> Replaced: “For our upcoming network the ledger reads: conv1 sees MATH MATH pooling nudges it to MATH MATH conv2's MATH window, at stride-2 spacing, expands it to MATH MATH the final pool reaches MATH , over half the frame in every direction, from nothing but MATH looks.”

Reader pass: no mark.

**08-W6-6** (W6). Literal test on 'buys ... paying for it ... pay for it differently'.

> This is the compositional hierarchy of Chapter 3 given a strong architectural invitation. The MLP could represent features-of-features but nothing encouraged it to; locality and growing receptive fields encourage later layers to compose earlier responses. Learned channels often progress from edge-like patterns to textures and parts, but the architecture does not force those human labels. **The CNN reaches global sight gradually, through depth; hold that thought until Part IV, where attention reaches global sight in a single step, at a different cost ( Chapter 15 ).**
>
> Replaced: “The CNN buys global sight gradually, paying for it with depth; hold that thought until Part IV, where attention will buy global sight in a single step and pay for it differently ( REF ).”

Reader pass: no mark.

**08-W1-3** (W1). The colon did a verb's work; it now introduces the code.

> **Before training, we audit the parameters, because parameter economy was half of Chapter 8 ’s sales pitch and Chapter 6 ’s MLP is the yardstick:**
>
> Replaced: “Before training, the parameter audit (because parameter economy was half of REF 's sales pitch, and REF 's MLP is the yardstick):”

Reader pass: no mark.

**08-W1-4** (W1). Mid-paragraph label colon replaced by a comma.

> Two readings of this table. **Against the MLP, LeNet carries 61,706 parameters to the MLP’s 203,530 (less than a third) while performing far richer spatial computation.** Weight sharing is doing exactly what Chapter 8 ’s matrix view promised. Within LeNet, look where the parameters live. The two conv layers, the part that actually sees , own 2,572 parameters (about 4%) while the dense head hoards the rest. That imbalance is a design smell we will fix in Chapter 10 , where modern architectures go deeper in convolution and lighter in the head.
>
> Replaced: “Against the MLP: LeNet carries 61,706 parameters to the MLP's 203,530 (less than a third) while performing far richer spatial computation.”

Reader pass: no mark.

**08-W1-5** (W1). Mid-paragraph label colon replaced by a comma.

> Two readings of this table. Against the MLP, LeNet carries 61,706 parameters to the MLP’s 203,530 (less than a third) while performing far richer spatial computation. Weight sharing is doing exactly what Chapter 8 ’s matrix view promised. **Within LeNet, look where the parameters live.** The two conv layers, the part that actually sees , own 2,572 parameters (about 4%) while the dense head hoards the rest. That imbalance is a design smell we will fix in Chapter 10 , where modern architectures go deeper in convolution and lighter in the head.
>
> Replaced: “Within LeNet: look where the parameters live.”

Reader pass: no mark.

**08-W1-18** (W1). Stacked colons; the verbless gloss 'two numbers:' becomes the object.

> Chapter 6 convicted our MLP with one experiment: shift every validation garment two pixels right, and accuracy fell off a cliff; the full-frame templates kept scoring sleeves against background. We then promised that an architecture built on locality and weight sharing would face the same trial. **Before running, write down two predictions: LeNet’s clean accuracy and LeNet at a two-pixel shift.** Retrained here on the same schedule, the MLP scores 76% clean and 42% at two pixels.
>
> Replaced: “Write your predictions down before running: two numbers: LeNet's clean accuracy and LeNet at a two-pixel shift.”

Reader pass: P3 marks in this paragraph: the prose 76% against the printed 75.5% goes to B1; the double colon in the sentence before is fixed (08-R9-4).

**08-R9-4** (R9). Slip: two colons in one sentence; the second becomes a semicolon.

> **Chapter 6 convicted our MLP with one experiment: shift every validation garment two pixels right, and accuracy fell off a cliff; the full-frame templates kept scoring sleeves against background.** We then promised that an architecture built on locality and weight sharing would face the same trial. Before running, write down two predictions: LeNet’s clean accuracy and LeNet at a two-pixel shift. Retrained here on the same schedule, the MLP scores 76% clean and 42% at two pixels.
>
> Replaced: “REF convicted our MLP with one experiment: shift every validation garment two pixels right, and accuracy fell off a cliff: the full-frame templates kept scoring sleeves against background.”

Reader pass: P3 mark (punctuation slip): fixed.

**08-W6-7** (W1 (V4)). Announcement frame dropped (brief count: Chapter 9, two).

> **There is the payoff.** At two pixels the MLP falls from 75.5% to 42.0%, while LeNet falls from 74.5% to 57.5%. That is one deterministic validation split, not a sampling distribution, but the within-run contrast is large. The mechanism is everything this chapter built: the kernels travel with the garment (equivariance), so the features are still found ; pooling forgives some sub-window jitter (local insensitivity); only the coarse layout entering the head changes at all.
>
> Replaced: “There is the payoff, and it is worth stating precisely.”

Reader pass: no mark.

**08-W6-8** (W1 (V4)). Announcement frame dropped; its reason kept.

> **And yet LeNet’s curve falls too, and the fall teaches the architecture’s fine print.** Two rounds of 2× pooling buy tolerance measured in a few pixels, not unlimited; and after flatten(1) , the dense head reads the final $5 \times 5$ grid positionally : a four-pixel input shift moves features roughly one full cell in that grid, and the head is as brittle to cell-level shifts as Chapter 6 ’s MLP was to pixel-level ones. The inductive bias did not abolish the cliff; it moved it outward and flattened it into a slope. Reducing the remaining sensitivity is the next chapter’s business, where we revisit depth and the position-sensitive head.
>
> Replaced: “And yet LeNet's curve falls too.” “Also worth stating precisely, because it teaches the architecture's fine print.”

Reader pass: no mark.

**08-W1-19** (W1). Verbless sentence before a colon gets its verb; the Chapter 7 harvest stays.

> **Take one last look inside, because Chapter 6 also showed us what the MLP’s first layer looked like (global, smeared, garment-shaped templates) and promised that structure would change:**
>
> Replaced: “One last look inside, because REF also showed us what the MLP's first layer looked like (global, smeared, garment-shaped templates, REF ) and promised that structure would change:”

Reader pass: no mark.

**08-R9-5** (R9). P3 slip: Chapter 6 was cited twice in one sentence; the parenthesis drops the repeat.

> **Take one last look inside, because Chapter 6 also showed us what the MLP’s first layer looked like (global, smeared, garment-shaped templates) and promised that structure would change:**
>
> Replaced: “Take one last look inside, because REF also showed us what the MLP's first layer looked like (global, smeared, garment-shaped templates, REF ) and promised that structure would change:”

Reader pass: P3 mark (punctuation slip): fixed.

**08-W6-9** (W6). 'Ledger' replaced in the exercise that points at the renamed passage.

> (Pencil.) **Verify the receptive-field growth $5 \rightarrow 6 \rightarrow 14 \rightarrow 16$ .** (Track two numbers per stage: the field size, and the jump , the spacing in input pixels between neighboring units, which each stride-2 pool doubles.) Then show that no convolutional or pooling unit in LeNet ever sees the full $28 \times 28$ frame. Where does globality finally enter the network?
>
> Replaced: “Verify the receptive-field ledger MATH .”

Reader pass: no mark.

**08-FIG-1** (FIG). Author's request: Figure 9.3 names the receptive field and adds the 6×6 field after the first pool (the chapter's 5 → 6 → 14 → 16 count); orange, reserved for learnable parameters, gives way to ink and blue; pooling stages dotted. Redrawn with the standalone pipeline, which first reproduced the committed PNG byte for byte and PDF pixel for pixel.

> **Receptive fields by depth.** **Each box is the patch of the input that one unit sees after a stage, drawn concentric for comparison.** **On the coat, the nested fields cross visible sleeves, torso, and boundary.** **One unit sees a 5×5 patch after conv1, 6×6 after the first pool, 14×14 after conv2, and 16×16 after the final pool.** Local wiring earns increasingly global sight; the dense head then reads all 25 overlapping final views at once.
>
> (source text of the caption; the gate tool does not match it to a rendered block)
>
> Replaced: “What one neuron sees, by depth.” “A coat replaces the earlier sandal so the nested fields cross visible sleeves, torso, and boundary.” “Conv1 sees a 5×5 patch, conv2 sees 14×14, and the final pooled cell sees 16×16.”

Reader pass: no mark.

### 10 Modern CNNs and Transfer Learning

`chapters/part2/09-modern-cnns-transfer.qmd`

**09-W7-1** (W7). First mention of Ioffe and Szegedy; same URL as Sources. The IOU device itself is author-gated and unchanged.

> Chapter 9 ended with a working machine and a report card. LeNet reads garments at 82.5% with 61,706 parameters; graceful under shift where the MLP cliff-dived. But the card has two demerits we wrote down explicitly: 96% of those parameters sit in the dense head rather than in the convolutions that do the seeing, and the shift cliff was softened, not abolished. And one IOU: batch normalization , promised for this chapter.

Reader pass: no mark.

**09-W7-2** (W7). First mentions of VGG, ResNet and NiN; same URLs as Sources.

> Each question has a famous answer ( VGG , ResNet , NiN ’s $1\times1$ + global pooling, and the block habit itself), and each answer is a constraint-shaped idea we can test on our own data. At the end, the practical superpower this sequence builds to, reusing a pretrained backbone, gets the most honest experiment in this book.

Reader pass: no mark.

**09-W1-1** (W1). Noun-phrase label before a colon becomes a clause.

> **The recipe has two small novelties, both because this chapter’s networks contain batch normalization: model.train() before each step and model.eval() before each evaluation.** Why that matters is the subject of the second section.
>
> Replaced: “Two small novelties in the recipe, both because this chapter's networks contain batch normalization: model.train() before each step and model.eval() before each evaluation.”

Reader pass: P3 mark on the next, unedited sentence ("Why that matters is the subject of the second section.", naming the book's structure): baseline borderline, listed in B3.2.

**09-W1-2** (W1). Noun-phrase label before a colon becomes a clause.

> **VGG (Simonyan & Zisserman, 2014) answers with a rule: never use a $5 \times 5$ kernel; stack $3 \times 3$ s until the field is as wide as you need.** Recall from Chapter 9 that stacking grows the receptive field. Two stacked $3 \times 3$ convolutions let the second layer see $5 \times 5$ of the input, the same receptive field as one $5 \times 5$ kernel. But compare the parameter counts, for a layer with $C$ channels in and $C$ out:
>
> Replaced: “VGG's answer (Simonyan & Zisserman, 2014): never use a MATH kernel; stack MATH s until the field is as wide as you need.”

Reader pass: no mark.

**09-W6-1** (W6). 'Ledger' in reader prose is always replaced; harvests Chapter 9's new 'the count runs'. The stacked-sight fixture literal follows (constraint 5).

> VGG (Simonyan & Zisserman, 2014) answers with a rule: never use a $5 \times 5$ kernel; stack $3 \times 3$ s until the field is as wide as you need. **Recall from Chapter 9 that stacking grows the receptive field.** Two stacked $3 \times 3$ convolutions let the second layer see $5 \times 5$ of the input, the same receptive field as one $5 \times 5$ kernel. But compare the parameter counts, for a layer with $C$ channels in and $C$ out:
>
> Replaced: “Recall the receptive-field ledger of REF : stacking grows the field.”

Reader pass: no mark.

**09-W6-2** (W6). Literal test: the bills are parameter counts.

> VGG (Simonyan & Zisserman, 2014) answers with a rule: never use a $5 \times 5$ kernel; stack $3 \times 3$ s until the field is as wide as you need. Recall from Chapter 9 that stacking grows the receptive field. Two stacked $3 \times 3$ convolutions let the second layer see $5 \times 5$ of the input, the same receptive field as one $5 \times 5$ kernel. **But compare the parameter counts, for a layer with $C$ channels in and $C$ out:**
>
> Replaced: “But compare the bills, for a layer with MATH channels in and MATH out:”

Reader pass: no mark.

**09-W6-3** (W6). Literal test; shorter.

> a 28% saving. The stacked pair also fires a ReLU twice where the big kernel fires once. Same sight, fewer parameters, more nonlinearity. **Three $3\times3$ s reach a $7\times7$ field for $27C^2$ against $49C^2$ : the deeper you take the idea, the larger the saving.**
>
> Replaced: “Three MATH s reach a MATH field for MATH against MATH : the deeper you take the idea, the better the deal gets.”

Reader pass: no mark.

**09-W6-4** (W6). Plan step, 'bill' replaced; 'C = 32' (a fixture literal) stays.

> **Count both designs’ parameters at C = 32.**
>
> Replaced: “Implement the parameter bill, C = 32.”

Reader pass: no mark.

**09-W1-3** (W1 (V4)). Announcement frame and its colon lead dropped; the constant-width caveat stays where the stacked-sight scope points to it.

> **The $18C^2 < 25C^2$ arithmetic assumes the channel width stays $C$ through the stack.** When a layer grows channels (as LeNet’s $6 \rightarrow 16$ did), splitting it into two growing $3\times3$ s can cost more, not less. VGG’s design sidesteps this by keeping width constant inside each block and changing it only between blocks, which is exactly the shape our code will take. (Exercise 1 makes you find the break-even point.)
>
> Replaced: “One caveat before you re-derive the field equations of vision from this: the MATH arithmetic assumes the channel width stays MATH through the stack.”

Reader pass: no mark.

**09-W1-20** (W1). Author's request ('day one'); the printout shows six depths, not twelve, and measures forward spread (B1 row 10 resolved).

> The $\gamma, \beta$ pair matters: normalization is a reset to a healthy scale , not a straitjacket. The network can learn to restore any mean and spread that helps, but it starts every layer from sane numbers. **In the printout above, the BN row holds a near-constant spread at every printed depth: the signal reaches each layer at a usable scale from the first step.** The standard placement we adopt is conv $\rightarrow$ BN $\rightarrow$ ReLU, with bias=False on the convolution, since $\beta$ already provides the shift.
>
> Replaced: “In the printout above, the BN row holds a near-constant spread through all twelve layers: every layer trains from day one.”

Reader pass: no mark.

**09-W1-4** (W1). Single-noun label becomes a clause; the batch-ruler test's sentence stays verbatim.

> At training time BN normalizes by the current batch’s statistics. At evaluation time there may be no batch (one image), so it uses running averages collected during training. model.train() and model.eval() switch between the two. Forgetting the switch is the classic BN bug: evaluate in train mode and your predictions depend on whatever else happens to be in the batch; train in eval mode and BN never learns its statistics. Our train_model recipe flips the switch in both directions; look for it. **It follows that BN needs real batches to estimate statistics, so it gets unreliable at tiny batch sizes.**
>
> Replaced: “Corollary: BN needs real batches to estimate statistics, so it gets unreliable at tiny batch sizes.”

Reader pass: no mark.

**09-W1-5** (W1). 'The good:' label becomes a phrase; paired with 09-W1-6.

> Two readings again. **On the good side, this VGG-style recipe reaches 86.7%, four points above LeNet in this run.** Because depth, width, normalization, kernel sizes, parameter count, and training duration all changed together, this comparison does not isolate which ingredient earned the gain. On the bad side, it carries 218,586 parameters, three and a half times LeNet’s total, and the head’s share got worse: 92% of the network is a dense layer reading a flattened grid. The convolutional diet succeeded and the total got fatter anyway. Which forces the third question: where do the parameters live, and where can we do the most damage to the count?
>
> Replaced: “The good: this VGG-style recipe reaches 86.7%, four points above LeNet in this run.”

Reader pass: no mark.

**09-W1-6** (W1). 'The bad:' label and its verbless gloss become a clause.

> Two readings again. On the good side, this VGG-style recipe reaches 86.7%, four points above LeNet in this run. Because depth, width, normalization, kernel sizes, parameter count, and training duration all changed together, this comparison does not isolate which ingredient earned the gain. **On the bad side, it carries 218,586 parameters, three and a half times LeNet’s total, and the head’s share got worse: 92% of the network is a dense layer reading a flattened grid.** The convolutional diet succeeded and the total got fatter anyway. Which forces the third question: where do the parameters live, and where can we do the most damage to the count?
>
> Replaced: “The bad: 218,586 parameters, three and a half times LeNet's total, and the head's share got worse: 92% of the network is a dense layer reading a flattened grid.”

Reader pass: no mark.

**09-W6-5** (W6). Literal test: the payoff is the benefit Chapter 9 promised.

> The parameter story is a rout: 35,034 total, a 650-parameter head, six times smaller than VGGSmall. The accuracy is 76.2%, and that dip is worth more attention than the win. **First, though, check the promised benefit.** Chapter 9 said the remaining shift-cliff was the flatten head’s fault: it reads the final grid positionally . GAP averages over positions, so the head no longer assigns a different weight to every location. What remains is Chapter 2 ’s classification head in its plainest form: one linear layer reading one averaged number per channel. The rematch of the rematch:
>
> Replaced: “First, though, collect the promised payoff.”

Reader pass: no mark.

**09-W7-3** (W7). First mention of Szegedy et al.; a new Sources entry (09-W7-9) carries the same URL.

> GoogLeNet ’s Inception block (2014) answers “which kernel size?” with “all of them”: parallel $1\times1$ , $3\times3$ , $5\times5$ , and pooling branches, concatenated. Its enabling trick is the $1\times1$ bottleneck : compress channels before the expensive spatial kernels. For one $5\times5$ branch at 256 channels: direct, $5^2 \times 256 \times 128 \approx 819$ k parameters; with a $1\times1$ squeeze to 32 first, $256 \times 32 + 5^2 \times 32 \times 128 \approx 111$ k, an 86% cut for the same nominal operation. We will not build Inception here (the principle, channel compression before spatial expense, is the transferable part), but Exercise 2 walks the arithmetic.

Reader pass: no mark.

**09-W1-7** (W1). Stacked colons and verbless glosses become clauses; the prediction prompt stays.

> **Predict before running. Two networks have identical parameter counts and twenty blocks each; one is plain, one residual.** Will the plain net merely trail, or fail to fit the training set at all?
>
> Replaced: “Predict before running: two networks, identical parameter counts, twenty blocks each: one plain, one residual.”

Reader pass: no mark.

**09-W1-8** (W1 (V4)). Importance frame dropped; the reading instruction stays.

> **Look at the training column first.** The plain 40-conv-layer network cannot even fit the 1,200 images it sees every epoch: 61% train accuracy, while its residual twin memorizes them and generalizes twenty-seven points better. This is an optimization failure in the same family as the degradation problem He et al. reported in 2015, where their 56-layer plain net trained worse than their 20-layer one. Our experiment isolates the residual rescue at one depth; a strict demonstration that adding depth degrades a plain network would also require a shallower plain control.
>
> Replaced: “Look at the training column first, because it carries the whole lesson.”

Reader pass: no mark.

**09-W1-9** (W1). Noun-phrase label becomes a clause; the identity-lane fixture literal follows (constraint 5).

> **The one change is that each block computes $F(x)$ and outputs $F(x) + x$ .** A residual connection lets the input skip over the block and adds it back.
>
> Replaced: “The one change: each block computes MATH and outputs MATH .”

Reader pass: no mark.

**09-W7-4** (W7). First mention of Huang et al.; same URL as Sources.

> The residual block above preserves an old representation by addition : $x_{\ell+1}=x_\ell+F_\ell(x_\ell)$ . A DenseNet block makes a different connectivity choice. If $x_j$ denotes layer $j$ ’s output feature map, layer $\ell$ receives the channel-wise concatenation $[x_0,x_1,\ldots,x_{\ell-1}]$ and contributes a small new group of feature maps for later layers. Earlier features therefore remain directly available instead of being recreated, while the channel axis grows; transition blocks compress channels and downsample between dense blocks. In Appendix B’s language, the defining operation is concatenation along the feature-channel axis, not another kind of residual addition ( Appendix B ).

Reader pass: no mark.

**09-MOVE-2** (MOVE). Author's request: the DenseNet bridge now follows the residual block it compares against; 'below' becomes 'above'.

> **The residual block above preserves an old representation by addition : $x_{\ell+1}=x_\ell+F_\ell(x_\ell)$ .** A DenseNet block makes a different connectivity choice. If $x_j$ denotes layer $j$ ’s output feature map, layer $\ell$ receives the channel-wise concatenation $[x_0,x_1,\ldots,x_{\ell-1}]$ and contributes a small new group of feature maps for later layers. Earlier features therefore remain directly available instead of being recreated, while the channel axis grows; transition blocks compress channels and downsample between dense blocks. In Appendix B’s language, the defining operation is concatenation along the feature-channel axis, not another kind of residual addition ( Appendix B ).

Reader pass: no mark.

**09-W1-10** (W1). Label before a colon becomes a clause; the seed (arc-seeds row 37) keeps its words.

> Residual connections are not only a CNN trick. They became a central design device in many deep architectures; when we assemble a transformer in Chapter 16 , every attention layer and every feedforward layer will be wrapped as $x + F(x)$ , and the freshly met layer normalization will sit beside each skip. **The picture to carry forward is a residual stream with direct additive routes through the network, each block reading from it and writing a correction back.** Those routes improve conditioning without making the stream immune to learned-branch interactions. Attention will be one kind of correction. You now own both parts of that skeleton.
>
> Replaced: “The picture to carry forward: a residual stream with direct additive routes through the network, each block reading from it and writing a correction back.”

Reader pass: no mark.

**09-W7-5** (W7). First mention of Xiao, Rasul and Vollgraf; same URL as Sources.

> The chapter’s small-data studies isolated mechanisms. The architecture comparison deserves the full task: all 60,000 Fashion-MNIST training images, split once into 50,000 for fitting and 10,000 for validation, with the official 10,000-image test set opened only after validation selected the checkpoint. We ran LeNet, NiN, VGG, and a nine-block residual network for three end-to-end seeds on Rivanna:

Reader pass: P3 mark on the paragraph's first, unedited sentence ("The chapter's small-data studies isolated mechanisms." against the page's caveats): baseline, listed in B2.

**09-W6-6** (W6). Literal test; shorter.

> The scale changes the verdict from the 1,200-image mechanism studies. **NiN’s global head no longer costs much clean accuracy, and all four architectures clear 92%.** The residual network leads this declared recipe, but the plot still has one horizontal axis too few: parameters measure storage, not optimizer steps, activation memory, or total training work.
>
> Replaced: “NiN's global head no longer pays a large clean-accuracy penalty, and all four architectures clear 92%.”

Reader pass: no mark.

**09-W1-11** (W1 (V4)). Announcement dropped; the stub label 'The task:' becomes a clause.

> **The task is to classify the three shoe classes (sandal, sneaker, ankle boot) from ten labeled examples each .** The 30-image regime is exactly where transfer should shine: too few labels to learn features, goes the story, so imported features should dominate. Three contenders:
>
> Replaced: “We will test the idea properly.” “The task: classify the three shoe classes (sandal, sneaker, ankle boot) from ten labeled examples each.”

Reader pass: no mark.

**09-W1-12** (W1). Telegraphic list items get verbs; a parallel set of three.

> **From scratch , our VGG-style trunk trains on the 30 images alone.**
>
> Replaced: “From scratch: our VGG-style trunk trained on the 30 images alone.”

Reader pass: no mark.

**09-W1-13** (W1). Same set.

> **Our own pretrained trunk is the same trunk pretrained on the seven non-shoe classes (863 images), then frozen under a linear probe.**
>
> Replaced: “Our own pretrained trunk: the same trunk pretrained on the seven non-shoe classes (863 images), frozen, linear probe.”

Reader pass: no mark.

**09-W1-14** (W1). Same set; also the first mentions of SqueezeNet and ImageNet (W7), same URLs as Sources.

> **A real pretrained backbone is SqueezeNet 1.1 trained on ImageNet (1.2 million photographs, 1,000 classes), loaded from weights committed with this book, frozen, and read by a linear probe on its 512-dimensional features.** (Fashion images get upsampled to 96×96 and repeated to three channels to fit its expectations. That awkwardness is part of the experiment.)
>
> Replaced: “A real pretrained backbone: SqueezeNet 1.1 trained on ImageNet (1.2 million photographs, 1,000 classes) loaded from weights committed with this book, frozen, linear probe on its 512-dimensional features.”

Reader pass: no mark.

**09-W1-15** (W1 (V4)). 'part of the lesson' frame dropped; the reason stays.

> A real pretrained backbone is SqueezeNet 1.1 trained on ImageNet (1.2 million photographs, 1,000 classes), loaded from weights committed with this book, frozen, and read by a linear probe on its 512-dimensional features. (Fashion images get upsampled to 96×96 and repeated to three channels to fit its expectations. **That awkwardness is part of the experiment.)**
>
> Replaced: “That awkwardness is part of the experiment, and part of the lesson.)”

Reader pass: no mark.

**09-W1-16** (W1 (V4)). Superlative frame dropped; the reason stays. 'Table' (an apparatus word in an added sentence) becomes 'those numbers'.

> **Read those numbers slowly, because they do not say what the textbook story predicts.** Training from scratch on thirty images fights the mighty ImageNet backbone to a dead heat: the means differ by less than a point, well inside seed noise. And our own pretrained trunk, perfectly competent on its source task per the printout above, transfers worse than nothing . Three reasons, each a general principle:
>
> Replaced: “Read that table slowly, because it does not say what the textbook story predicts, and the discrepancy is the best lesson in this chapter.”

Reader pass: no mark.

**09-W6-7** (W6). Fiscal metaphor replaced; the gift image stays. Recap mirror 09-W6-10.

> **Domain and resolution gaps shrink the donation.** SqueezeNet’s filters expect 224-pixel color photographs; we feed it 28-pixel grayscale icons inflated to 96. Its early layers hunt for detail that simply is not there. (The matching recipe, resize and normalize to match the pretraining pipeline , is doing real work; we complied as far as the data allows.)
>
> Replaced: “Domain and resolution gaps tax the donation.”

Reader pass: no mark.

**09-W1-17** (W1 (V4)). Pure announcement dropped.

> Transfer wins when the target is big relative to your labels, not small. Three shoe silhouettes at $28 \times 28$ is a small problem: thirty images genuinely suffice, so the scratch baseline is strong and there is little room for imported knowledge to help. The full ten-class task below is different: 50,000 fitting labels, 224-pixel inputs, and a ResNet-18-sized feature extractor.
>
> Removed: “This is the quiet one.”

Reader pass: no mark.

**09-W6-8** (W6). Named instance; literal test.

> Transfer wins when the target is big relative to your labels, not small. **Three shoe silhouettes at $28 \times 28$ is a small problem: thirty images genuinely suffice, so the scratch baseline is strong and there is little room for imported knowledge to help.** The full ten-class task below is different: 50,000 fitting labels, 224-pixel inputs, and a ResNet-18-sized feature extractor.
>
> Replaced: “Three shoe silhouettes at MATH is a small problem: thirty images genuinely suffice, so the scratch baseline is strong and there is little room for imported knowledge to pay rent.”

Reader pass: no mark.

**09-W1-18** (W1 (V4)). 'for completeness' frame dropped; its reason becomes the clause before the colon.

> **You will use the mechanics constantly from Part V onward: fine-tuning SqueezeNet’s last block with a two-learning-rate recipe (fresh head fast, pretrained layers slow):**
>
> Replaced: “The mechanics, for completeness, since you will use them constantly from Part V onward: fine-tuning SqueezeNet's last block with a two-learning-rate recipe (fresh head fast, pretrained layers slow):”

Reader pass: no mark.

**09-W6-9** (W6). Literal test inside the recap item.

> $1\times1$ convolutions run Chapter 1 ’s linear model across channels at every pixel: summarize channels, do not discard them. **With global average pooling they fire the flatten head: parameters collapse (218k $\rightarrow$ 35k) and position-specific weights leave the head, at a cost in clean accuracy that our small dataset makes visible.** Boundaries and downsampling still prevent exact invariance.
>
> Replaced: “With global average pooling they fire the flatten head: parameters collapse (218k MATH 35k) and position-specific weights leave the head, at a clean-accuracy price our small dataset makes visible.”

Reader pass: no mark.

**09-W6-10** (W6). Recap mirror of 09-W6-7.

> Transfer learning = freeze + probe, or gently fine-tune. Our experiment found scratch and the ImageNet probe in a near tie across three seeds at 28-pixel scale. **Pretraining is curriculum, gaps shrink what transfers, and small targets may leave little room for imports.** The pinned full-scale Rivanna runs report $88.79\% \pm 0.08\%$ for the frozen probe, $93.92\% \pm 0.12\%$ for fine-tuning, and $94.14\% \pm 0.08\%$ for scratch with ResNet-18. They illustrate a richer regime where adaptation repairs most of the feature mismatch. Diagnosing the regime is the skill.
>
> Replaced: “Pretraining is curriculum, gaps are taxed, and small targets may leave little room for imports.”

Reader pass: no mark.

**09-W7-9** (W7). New Sources entry for the work the chapter names; CVPR 2015, DOI 10.1109/CVPR.2015.7298594.

> **Szegedy et al., Going Deeper with Convolutions : GoogLeNet’s Inception block, parallel branches of several kernel sizes joined by channel concatenation.**

Reader pass: no mark.

**09-W7-10** (W7). Sources entry for the work the new caption names; verified against Crossref (ECCV 2016, pp. 630-645) and arXiv:1603.05027.

> **He et al., Identity Mappings in Deep Residual Networks : pre-activation residual blocks, which place BatchNorm and ReLU before each convolution in the learned branch and drop the ReLU after the sum, so the sum passes straight through.**

Reader pass: no mark.

**09-R9-9** (R9). P3 slip: a line-end hyphen rendered as "1×1-plus- 5×5".

> (Pencil.) Generalize the kernel-stacking arithmetic: $n$ stacked $3\times3$ layers versus one $(2n{+}1)\times(2n{+}1)$ kernel, at constant width $C$ . Then redo it for a layer that grows channels $C \rightarrow 2C$ : split into two $3\times3$ s ( $C \rightarrow C \rightarrow 2C$ and $C \rightarrow 2C \rightarrow 2C$ ) and find when the split stops saving parameters.

Reader pass: P3 mark (punctuation slip): fixed.

**09-W1-19** (W1). Noun-phrase topic label in an exercise becomes an imperative, like its neighbors.

> (Code.) **Try data augmentation as a third road: on the 30-image shoe task, train from scratch with random horizontal flips and ±3-pixel shifts ( Chapter 6 ’s exercise, now as a tool).** Does augmentation close the gap to the pinned full-data results further than transfer did? Why might augmentation and transfer help in different regimes?
>
> Replaced: “Data augmentation as a third road: on the 30-image shoe task, train from scratch with random horizontal flips and ±3-pixel shifts ( REF 's exercise, now as a tool).”

Reader pass: no mark.

**09-MOVE-1** (MOVE). Author's request: the DenseNet bridge leaves its place before the residual block (removal half).

> Heading now: `## Question 2: going deeper, and the wall you hit` (source; headings are not rendered paragraphs)
>
> Removed: “The residual block below preserves an old representation by addition: MATH .” “A DenseNet block makes a different connectivity choice.” “If MATH denotes layer MATH 's output feature map, layer MATH receives the channel-wise concatenation MATH and contributes a small new group of feature maps for later layers.” “Earlier features therefore remain directly available instead of being recreated, while the channel axis grows; transition blocks compress channels and downsample between dense blocks.” “In Appendix B's language, the defining operation is concatenation along the feature-channel axis, not another kind of residual addition ( REF ).”

Reader pass: no mark.

**09-FIG-1** (FIG). Author's request (Option 2, faithful to the code's `F.relu(y + x)`): identity stream drawn as the straight spine, learned branch F(x) below, output ReLU(x + F(x)); ink replaces orange; the caption states that the final ReLU gates the route and cites pre-activation ResNets. Redrawn with the standalone pipeline, which first reproduced the committed PNG byte for byte and PDF pixel for pixel.

> **A residual block in the original ResNet form, which Block implements.** **The identity stream carries MATH straight to the sum.** **The learned branch adds a correction MATH , so MATH , and a ReLU follows.** **The sum has no weights, so the shortcut is a direct route for activations and gradients wherever MATH is positive.** **Pre-activation ResNets move that ReLU into the branch and leave the route clean.**
>
> (source text of the caption; the gate tool does not match it to a rendered block)
>
> Replaced: “A residual block has two routes.” “The learned branch computes a correction MATH ; the identity branch carries MATH unchanged to the addition.” “Even when the learned branch has a difficult Jacobian, the shortcut leaves a direct route for activations and gradients.”

Reader pass: no mark.

### 14 Kernel Regression: Attention Before It Was Learnable

`chapters/part4/12-kernel-regression.qmd`

**12-W7-1** (W7). First mention of both 1964 papers; same URLs as Sources.

> This is the Nadaraya–Watson estimator , proposed independently by Nadaraya and Watson in 1964. For the strictly positive Gaussian, each $\alpha_i>0$ and $\sum_i\alpha_i=1$ . Scalar predictions remain between the smallest and largest observed values. Unlike OLS, this operator smooths locally while keeping every prediction inside the observed values’ convex hull.

Reader pass: no mark.

**12-W6-1** (W1 (V4)). Announcement frame dropped; the sentences state the endpoint behavior.

> As $h\to0^+$ , the weight concentrates on the unique nearest key; exact nearest-key ties split the mass. At $h=0$ the formula is undefined. As $h\to\infty$ , every finite distance looks alike and the weights approach $1/n$ .
>
> Removed: “The endpoint behavior is worth stating precisely.”

Reader pass: no mark.

**12-W7-2** (W7). C2: the six works linked at first mention with their Sources URLs; the 2026 entry now points to its arXiv record (2603.09221).

> The regression view you have just built is not only a teaching bridge. Work from 2024–26 uses a forward pass as test-time regression : the prefix supplies key–value training pairs, the current token supplies a query, and a memory operator fits or updates a predictor before answering. **Test-Time Training , the older Delta-style fast weights , Titans , MesaNet , and Wang and colleagues’ Beyond Test-Time Memory differ in which part they change: the learned views of a token, the weighting of its history, the model or regularizer, or the online solver.**
>
> Replaced: “Test-Time Training, Delta-style fast weights, Titans, MesaNet, and Wang and colleagues' Beyond Test-Time Memory differ in which part they change: the learned views of a token, the weighting of its history, the model or regularizer, or the online solver.”

Reader pass: P3 mark (the 2021 Delta rule listed as 2024-26 work): 'the older' dates it without a parenthesis.

**12-W6-2** (W6). Literal test: 'now paying rent again' is the shift applied here; the literal version is no longer.

> Notice the implementation never computes $\kappa_h$ and then takes its logarithm. It computes the log-score directly, subtracts the largest score in each row, and only then exponentiates. **That is Chapter 2 ’s stable-softmax hygiene, applied to kernel scores.**
>
> Replaced: “That is REF 's stable-softmax hygiene, now paying rent again.”

Reader pass: no mark.

**12-R9-1** (R9). Slip: a line-end hyphen rendered as 'stable- algorithm'.

> There is one numerical trap. A Gaussian is mathematically positive everywhere, but a distant query and small bandwidth can make every directly exponentiated kernel value underflow to zero. Normalizing those zeros produces 0/0 . The log-score version still has a largest entry, so the shifted softmax remains finite. **This is one of the stable-algorithm case studies reunited in Appendix C :**
>
> Replaced: “This is one of the stable- algorithm case studies reunited in REF :”

Reader pass: P3 mark (punctuation slip): fixed.

**12-W8-1** (W8). C3: the opening example walked through every row with the chapter's printed numbers (l.36-37 and the fixed-gaussian-attention output); one date-task instance for the right-hand column, no new numbers.

> **The opening example fills every kernel-regression role. The query is the location $q=3.5$ . The keys are the stored locations 1, 3, and 5, and the values are their responses 1.5, 2.8, and 1.8. Gaussian similarity at $h=0.6$ , normalized, gives the weights $(0.0002, 0.9413, 0.0585)$ , and the prediction is the mixture $2.7412$ . The sequence-memory roles have their own instance in Chapter 13 ’s date task. When the decoder is about to write the year, its current state is the query; the encoder states at the source characters serve as keys to match and as values to read; and useful weights concentrate on the last four source characters, which spell the year. Chapter 15 measures how much weight lands there.**

Reader pass: P3 mark (names the table's layout): recast to name the roles, not the column.

**12-W1-7** (W1 (V4)). Frame 'it is a reminder that' dropped; the reason stays.

> It is pure angular similarity only when the norms are controlled. If $\vect{q}=(1,0)$ , $\vect{k}_1=(1,0)$ , and $\vect{k}_2=(2,0)$ , both keys point in the same direction as the query, but their dot products are 1 and 2. Magnitude participates. **That is not a defect: the score defines what “similar” means.**
>
> Replaced: “That is not a defect; it is a reminder that the score defines what "similar" means.”

Reader pass: no mark.

**12-W7-3** (W7). The project page links an arXiv record; the Sources entry prefers the paper (verified: arXiv 2603.09221, Wang et al., 2026-03-10).

> Wang et al., Beyond Test-Time Memory: State-Space Optimal Control for LLM Reasoning (2026) : extends the regression framing toward test-time control; the epilogue treats that proposal as a frontier bet rather than settled equivalence.

Reader pass: no mark.

### 15 Attention: Making the Kernel Learnable

`chapters/part4/13-attention.qmd`

**13-W6-5** (W6). Harvest follows the Chapter 9 seed, which no longer 'buys' global sight (arc-seeds row 36).

> Chapter 9 made one other promise. **A CNN sees globally only by stacking local operations until its receptive field spans the input.** One cross-attention read can score every encoder position in a single layer. It reaches the whole input directly, at the cost of all query–key comparisons and, for now, of the RNNs that created those states sequentially.
>
> Replaced: “A CNN buys global sight by stacking local operations until its receptive field spans the input.”

Reader pass: no mark.

**13-W6-6** (W6). Same harvest; the purchase verb goes with its seed.

> Chapter 9 made one other promise. A CNN sees globally only by stacking local operations until its receptive field spans the input. One cross-attention read can score every encoder position in a single layer. **It reaches the whole input directly, at the cost of all query–key comparisons and, for now, of the RNNs that created those states sequentially.**
>
> Replaced: “It buys global access directly, at the cost of all query--key comparisons and, for now, of the RNNs that created those states sequentially.”

Reader pass: no mark.

**13-W1-7** (W1). Verbless gloss after a colon becomes a relative clause.

> The two projections put objects of different native sizes into one alignment space. The tanh creates match features, and $\vect{v}_a$ selects which of those features matter for the scalar score. The same parameters are reused for every decoder step $t$ and source position $i$ . **Remember Chapter 9 ’s sliding filter, which applied one learned rule everywhere.** Attention shares a compatibility rule across pairs.
>
> Replaced: “Remember REF 's sliding filter: one learned rule, applied everywhere.”

Reader pass: no mark.

**13-W1-9** (W1 (V4)). Importance frame and 'bookkeeping' dropped; the reason stays.

> Their sum produces $(B,n,d_a)$ match features. Reduction by $\vect{v}_a$ produces $(B,n)$ scores, softmax runs over the $n$ source positions, and the weighted read returns a $(B,d_e)$ context. **Softmax over the wrong dimension would answer the wrong question.**
>
> Replaced: “That last axis choice is not bookkeeping: softmax over the wrong dimension answers the wrong question.”

Reader pass: no mark.

**13-W7-1** (W7). First mentions of both works, linked with their Sources URLs.

> Luong and colleagues compared unscaled dot, general, and concat scores in recurrent translation. Vaswani and colleagues later introduced the $1/\sqrt{d_k}$ scaling in the Transformer formulation. The mechanisms belong in one conceptual family, not a single inevitable historical derivation.

Reader pass: no mark.

**13-W7-2** (W7). First prose mention of Bahdanau, Cho, and Bengio's paper.

> This timing follows the Bahdanau -style formulation. Luong-style variants often score with the current decoder state instead; both are valid, but silently mixing their indices makes an implementation impossible to audit.

Reader pass: no mark.

**13-W6-2** (W6). 'Ledger' in reader prose is replaced.

> **For this date model, every shape is concrete:**
>
> Replaced: “For this date model, the shape ledger is concrete:”

Reader pass: no mark.

**13-W6-3** (W6). Relay of the Chapter 9 seed, stated literally (the seed and its Chapter 16 harvest change in this PR).

> The Q/K/V operator itself does not care where its three inputs came from. What if every position in one sequence supplied queries, keys, and values to every other position? Using that operator in place of the RNN can remove recurrence within each layer, but it also removes the RNN’s built-in sense of order. **Chapter 9 warned that a model which throws away where must later put it back; Chapter 16 does so with positional information.** Masking returns there as well: a causal mask will decide which future positions an autoregressive model may not see.
>
> Replaced: “REF warned that throwing away where incurs a debt; REF pays it back with positional information.”

Reader pass: no mark.

**13-W6-4** (W6). A promise is kept, not paid.

> Attention softens the address. Chapter 13 learned embedding content while keeping lookup indices hard. **Chapter 2 ’s differentiable-lookup promise is now kept: learned scores become a distribution over memory locations.**
>
> Replaced: “REF 's differentiable-lookup promise is now paid: learned scores become a distribution over memory locations.”

Reader pass: no mark.

**13-W1-8** (W1 (V4)). Self-reference 'stated in full' replaced by the caveat itself (59.2% is printed in the Faster-convergence warning).

> The date rematch exposes learned access. Under the shared schedule, attention reaches 93.25% validation exact match at epoch 6 and 100.0% on the final test audit. **Its year rows route 97.5% of validation weight to states indexed by the source-year region. Parameter count and compute were not matched: the attentive model has 59.2% more parameters.**
>
> Replaced: “Its year rows route 97.5% of validation weight to states indexed by the source-year region, with the parameter/compute caveat stated in full.”

Reader pass: no mark.

**13-W6-1** (W6). Literal test: 'paying for' is the cost.

> REF made one other promise. **A CNN sees globally only by stacking local operations until its receptive field spans the input.** One cross-attention read can score every encoder position in a single layer. **It reaches the whole input directly, at the cost of all query--key comparisons and, for now, of the RNNs that created those states sequentially.**
>
> (source text of the paragraph; the gate tool does not match it to a rendered block)
>
> Replaced: “It buys global access directly, paying for all query--key comparisons and, for now, for the RNNs that created those states sequentially.”

Reader pass: no mark.

### 16 Self-Attention and the Transformer

`chapters/part4/14-self-attention-transformer.qmd`

**14-W7-1** (W7). First mention of Vaswani et al.; same URL as Sources.

> That substitution is the core of a Transformer . It is also easy to state too quickly. Removing recurrence creates a position problem. Splitting one attention operation into heads creates a bookkeeping problem. Stacking the resulting operations creates an optimization problem. This chapter solves each one, from the equations outward, then returns to the book-corpus benchmark from Chapter 12 with a deliberately small causal Transformer.

Reader pass: no mark.

**14-W6-2** (W6). C1: the harvest of the Chapter 9 seed, stated literally; the seed is rewritten in the same PR.

> **In Chapter 9 , convolution received locality “for free.**” A convolution knows which values are neighbors because its kernel is tied to nearby offsets. **Global attention drops that built-in geometry, so position has to be added back explicitly.**
>
> Replaced: “REF planted this debt when convolution received locality “for free.” “Global attention abandons that built-in geometry, so we must pay to put position back in.”

Reader pass: no mark.

**14-W1-8** (W1). Stacked colons; the verbless gloss becomes a clause.

> Why pair sine and cosine? **For frequency $\omega$ , advancing by offset $\delta$ is a rotation, so the geometric question has an algebraic answer:**
>
> Replaced: “For frequency MATH , advancing by offset MATH is a rotation: an algebraic answer to a geometric question:”

Reader pass: no mark.

**14-W7-2** (W7). First mention of RoFormer; same URL as Sources.

> The positional factor now depends on the relative offset $j-i$ . This construction is called rotary positional embedding (RoPE) . Content still matters through $\vect{q}_i$ and $\vect{k}_j$ ; RoPE changes how position enters their comparison.

Reader pass: no mark.

**14-W7-3** (W7). First mention of Ba, Kiros and Hinton; same URL as Sources.

> For $d=32$ , each position vector has norm $\sqrt{d/2}=4$ because every $\sin^2+\cos^2$ pair contributes one. Adding this vector does not preserve the norm of the combined token representation: the embedding and position vector can reinforce or cancel one another. Layer normalization will soon manage scale at the block level.

Reader pass: no mark.

**14-W6-3** (W6). 'Ledger' replaced.

> **Tensor shapes are the safest implementation guide:**
>
> Replaced: “The shape ledger is the safest implementation guide:”

Reader pass: no mark.

**14-W6-4** (W6). 'Ledger' replaced.

> The mask changes visibility, not dense computation. The implementation still forms all $n^2$ scores and stores $Bhn^2$ attention weights, alongside roughly $Bnd^2$ projection work and $Bndd_{ff}$ work in the FFN. Self-attention shortens the graph path between distant tokens to one routing step, but “one step away” is not “constant runtime.” **Appendix C returns to this $n^2$ cost through Roofline analysis and FlashAttention’s I/O-aware schedule.**
>
> Replaced: “REF returns to this MATH ledger through Roofline analysis and FlashAttention's I/O-aware schedule.”

Reader pass: no mark.

**14-W6-5** (W1 (V4)). C1 announcement: the frame 'with one durable sentence' is dropped, the content kept.

> **Chapter 10 introduced the residual stream: every block reads the stream and writes a correction back.** If a sublayer computes $F(x)$ , the residual update is
>
> Replaced: “REF introduced the residual stream with one durable sentence: every block reads the stream and writes a correction back.”

Reader pass: no mark.

**14-W1-9** (W1). Verbless gloss repeating the clause dropped.

> **This is Chapter 10 ’s normalization equation applied along a different axis.** Chapter 10 ’s BatchNorm2d used batch and spatial axes for each channel. LayerNorm flips to the feature axis of each token: it computes statistics across the features within one token, without aggregating statistics across other tokens or examples. Its calculation is the same at training and evaluation time. Before the learned $\gamma$ and $\beta$ , the vector is approximately zero mean and unit variance. After applying them, that claim need not remain true.
>
> Replaced: “This is REF 's normalization equation applied along a different axis: the same equation, different axis.”

Reader pass: no mark.

**14-W7-4** (W7). First mention of Zhang and Sennrich; same URL as Sources.

> RMSNorm keeps the scale control but omits mean subtraction:

Reader pass: no mark.

**14-W1-10** (W1 (V4)). 'worth printing in full' frame dropped; the reason stays (borderline case resolved by the frame rule).

> **The paired protocol is the experimental design:**
>
> Replaced: “The paired protocol is worth printing in full: it is the experimental design:”

Reader pass: no mark.

**14-W1-11** (W1). Verbless label before a colon becomes a clause.

> **… the body matches Listing 12.1; this chapter prints only what it changes.**
>
> Replaced: “… body exactly as Listing 12.1: this chapter prints only what it changes.”

Reader pass: no mark.

**14-W7-5** (W7). First mention of Holtzman et al.; same URL as Sources.

> Lower $T$ concentrates probability; higher $T$ flattens it. Top- $k$ sampling keeps the $k$ largest logits, sets the rest to negative infinity, then renormalizes. Nucleus (top- $p$ ) sampling first sorts the model probabilities and keeps the smallest prefix whose cumulative mass reaches $p$ , then renormalizes. The former fixes a candidate count; the latter lets that count adapt to the distribution’s shape. Neither changes the trained weights, and neither guarantees a better sample.

Reader pass: no mark.

**14-W6-6** (W6). Literal test on 'bought ... paid'.

> **The rematch is not a referendum on all Transformers; it isolates what this small one gained and what it cost.**
>
> Replaced: “The rematch is not a referendum on all Transformers; it isolates what this small one bought and what it paid.”

Reader pass: no mark.

**14-W6-7** (W6). C1 recap: stated literally, echoing the seed's 'position was something we once discarded on purpose'.

> Bare attention is permutation equivariant, not invariant. $\operatorname{SA}(PX)=P\operatorname{SA}(X)$ . **Sinusoidal clocks supply the sense of order that Chapter 9 ’s kernels had built in and global routing lacks, and their sine/cosine pairs turn relative shifts into rotations.**
>
> Replaced: “Sinusoidal clocks repay REF 's position debt, and their sine/cosine pairs turn relative shifts into rotations.”

Reader pass: P3 mark (recap said Chapter 9 discarded position; the page says attention drops what convolution had): recast to match the body.

**14-W6-1** (W6). C1 heading: names what attention lacks; the old anchor is pinned so links survive.

> Heading now: `### Self-attention does not see order {#the-position-debt}` (source; headings are not rendered paragraphs)

Reader pass: no mark.

### 18 The BERT Moment: Pretraining as the New Regime

`chapters/part4/15-bert-pretraining.qmd`

**15-W7-1** (W7). First mention of Devlin et al.; same URL as Sources.

> Bidirectional Encoder Representations from Transformers ( BERT ) uses a few special tokens. [CLS] is a learned summary placeholder, [SEP] marks a boundary, and [PAD] fills unused batch slots. Consider six positions:

Reader pass: no mark.

**15-W1-1** (W1 (V4)). 'the important guarantee is' frame dropped; the contrast stays.

> Only padding keys are blocked in the drawing. **A [PAD] query row can still produce an output, which downstream computation ignores; real queries, however, can never retrieve padding as information.**
>
> Replaced: “A [PAD] query row can still produce an output, but downstream computation ignores that row; the important guarantee is that real queries cannot retrieve padding as information.”

Reader pass: no mark.

**15-W7-2** (W7). First mentions of Peters et al., Howard and Ruder, Radford et al.; same URLs as Sources.

> ELMo demonstrated that a word’s useful vector should depend on its sentence. ULMFiT supplied a robust recipe for adapting a pretrained language model rather than freezing it. GPT paired Transformer pretraining with supervised fine-tuning. BERT’s decisive change was to pretrain every encoder layer with joint left-and-right context. The workflow mattered as much as the architecture: learn broadly from raw text first, then spend scarce labels on adaptation.

Reader pass: no mark.

**15-W6-4** (W6). 'Ledger' in reader-visible text is always replaced; the Plan step now matches the caption's 'rows'. The bert-ledger panel keeps its text for the scene wave.

> **Build and audit the five Boolean rows on one illustrative sequence.**
>
> Replaced: “Build and audit the five Boolean ledgers on one illustrative sequence.”

Reader pass: no mark.

**15-W7-3** (W7). First mention of Liu et al.; same URL as Sources.

> Original BERT pre-generated several masked versions of its training examples; RoBERTa later redrew masks as examples were presented. Our controlled lab uses the latter dynamic corruption choice: the same sentence can ask different questions on later passes. Reproducibility therefore requires a separate random generator. Seeding model initialization while leaving the corruption stream implicit is not an exact experiment.

Reader pass: no mark.

**15-W7-4** (W7). First mention of Sennrich, Haddow and Birch; the pair-recount literal from 'counts adjacent pairs' stays verbatim.

> Chapter 12 fixed its vocabulary at individual characters. A full-word vocabulary shortens sequences but gives every rare spelling its own entry. Subword tokenization chooses a middle contract. Byte Pair Encoding (BPE) begins with small symbols, counts adjacent pairs in the training corpus, merges the most frequent pair, and repeats until it reaches a chosen vocabulary budget.

Reader pass: no mark.

**15-W1-2** (W1 (V4)). 'is the important one' frame dropped; the contrast with the listed differences stays.

> The first three merges build est</w> from nine weighted occurrences; the next two build low from seven. The word lower is therefore represented as low | e | r | </w> even though the whole word was never granted its own token. This is the mechanism, not BERT’s tokenizer: WordPiece uses a different merge-scoring criterion, and practical byte-level tokenizers begin from bytes rather than the toy character alphabet. **All three share one idea: the vocabulary becomes a learned compromise between sequence length and reusable coverage.**
>
> Replaced: “The shared idea is the important one: the vocabulary becomes a learned compromise between sequence length and reusable coverage.”

Reader pass: no mark.

**15-W6-1** (W6). Literal test: 'accounting' is the paper's count.

> **Pretraining used BooksCorpus and English Wikipedia, about 3.3 billion words by the paper’s count.** The scale is historically important, but the reusable idea is the separation of stages:
>
> Replaced: “Pretraining used BooksCorpus and English Wikipedia, about 3.3 billion words in the paper's accounting.”

Reader pass: no mark.

**15-W7-5** (W7). First mention of the released implementation; same URL as Sources.

> The MLM decoder is deliberately untied from the input embedding table. The original released BERT code explicitly tied those weights, but tying would update an uncovered input row through the vocabulary softmax even when that token never appeared. The custom control is stricter: random replacements are drawn only from source tokens, and the code later asserts that every uncovered input embedding remains bitwise unchanged through pretraining. Untied decoder rows for the controls still participate as negative softmax classes, but they are discarded downstream and never expose a control token’s context or identity to the encoder input.

Reader pass: no mark.

**15-W1-3** (W1). Verbless label and stacked colons become clauses.

> Across 1,032,096 eligible positions, the five runs select 155,019 (15.020%). **The realized branches are 80.04% mask, 9.98% random, and 9.99% unchanged. **(The MLM loss is Section 4.6.1 ’s Case 1, a mean over exactly the selected positions.** The corruption policy defines the scored population, the batch mean estimates it without bias, and these counts make that denominator visible.**) Both scratch and pretrained models reach 100% on their tiny labeled training sets in every run; failure to fit the labels therefore does not explain the scratch result.
>
> Replaced: “(Estimator reading, per REF : the MLM loss is Case 1 over exactly the selected positions: the corruption policy defines the scored population, the batch mean estimates it without bias, and these counts are that denominator made visible.”

Reader pass: P3 mark (an undefined 'Case 1' label): the label now carries its meaning.

**15-W1-4** (W1 (V4)). 'Remember the question' frame dropped; the question stays.

> **Did pretraining organize covered representations in a way that scarce labels could reuse, or did the classifier merely learn the tiny label set?** The task, control, and geometry answer different parts.
>
> Replaced: “Remember the question: did pretraining organize covered representations in a way that scarce labels could reuse, or did the classifier merely learn the tiny label set?”

Reader pass: no mark.

**15-W7-6** (W7). First mention of Raffel et al.; same URL as Sources.

> T5 turns tasks into text-to-text problems and marks removed spans with learned sentinel tokens. Its encoder produces a sequence of memory states under full visibility; its causal decoder cross-attends to that sequence while generating the target. It does not squeeze the input into one fixed bottleneck vector. These families trade representation, generation, and input–output structure differently; they are not a ranking from old to new.

Reader pass: no mark.

**15-W1-5** (W1 (V4)). Announcement dropped; the three planted sentences stay verbatim.

> A learned summary token can gather a sequence for a downstream head; Chapter 19 will give that same pattern a sequence of image patches. Pretraining is a regime, not an architecture; Chapter 19 will ask what changes when an encoder leaves text for images and scaling takes center stage. Fine-tuning changed every encoder weight here; Chapter 20 will ask what adaptation remains when most, or all, of those weights must stay fixed.
>
> Removed: “The chapter closes with three forward seeds.”

Reader pass: P3 mark on the planted sentence after it ('repeats 18.7', names Chapter 19 twice): overruled; the three planted sentences stay verbatim for arc-seeds rows 64, 65 and 68.

**15-W6-2** (W6). 'Ledger' in reader prose is always replaced.

> Three pretraining families differ first in what each position may retrieve. A BERT-style encoder has full nonpadding self-attention; a GPT-style decoder has causal self-attention. T5 uses three routes in two stacks: full encoder self-attention, causal decoder self-attention, and decoder-to-encoder cross-attention. **The combined T5 block summarizes the visibility of those separate sublayers; it is not one mask applied by the implementation.**
>
> (source text of the caption; the gate tool does not match it to a rendered block)
>
> Replaced: “The combined T5 block is a visibility ledger for those separate sublayers, not one mask applied by the implementation.”

Reader pass: no mark.

**15-W6-3** (W6). 'Ledger' in reader prose is always replaced; the caption already calls them rows.

> **Five Boolean rows keep BERT's controls separate.** Eligibility excludes special and padding tokens; selection identifies direct loss targets; three disjoint corruption rows partition the selected sites into mask, random, and unchanged branches. Attention visibility remains full over nonpadding keys and is not encoded by any of these rows. The illustrated branch allocation is deliberately small; the 15% and 80/10/10 rates are population policies, not proportions to infer from twelve positions.
>
> (source text of the caption; the gate tool does not match it to a rendered block)
>
> Replaced: “Five Boolean ledgers keep BERT's controls separate.”

Reader pass: no mark.

### 19 Vision Transformers and Scaling Laws

`chapters/part4/16-vit-scaling.qmd`

**16-W7-1** (W7). First mention of Dosovitskiy et al.; same URL as Sources.

> Surprisingly little. Cut the image into patches, project each patch to a vector, and let the Transformer encoder read those vectors as tokens. That minimalist transplant is the Vision Transformer (ViT) . Its simplicity, and the freedom it creates, is also the source of the interesting question. A convolutional network arrives knowing that nearby pixels belong together and that one local detector should slide across the image. ViT arrives with a much weaker image-specific prescription. Which learner wins therefore depends not just on architecture, but on data, training, and scale.

Reader pass: no mark.

**16-W6-1** (W6). Literal test; the attention-bill scene keeps its id and text.

> Check that $P$ divides both spatial dimensions, assert the patch and token shapes, and compare unfold-plus-linear with the equivalent convolution to numerical roundoff. **Patchification silently changes sequence length, feature width, and the attention cost; one shape mistake propagates through the entire model.**
>
> Replaced: “Patchification silently changes sequence length, feature width, and the attention bill; one shape mistake propagates through the entire model.”

Reader pass: no mark.

**16-W1-1** (W1 (V4)). 'is the precise phrase' frame dropped; the content stays.

> **ViT carries less image-specific bias, not none.** Patchification is local, the same projection is shared over the grid, positions identify slots, and the usual optimizer and architecture choices contribute biases of their own. ViT did not remove assumptions. It changed which assumptions were paid for in code and which had to be learned from examples.
>
> Replaced: ““Less image-specific bias”, not “no bias”, is the precise phrase.”

Reader pass: no mark.

**16-W6-2** (W6). 'Ledger' in reader prose is always replaced.

> **For one $28\times28$ image, a simple multiply–accumulate count gives about 1.19 million for the CNN and 1.16 million for the ViT, a 1.8% difference.** That count includes convolution, linear, and attention matrix products; it omits normalization, activations, softmax, pooling, memory traffic, and implementation effects. It is a useful dot-product proxy, not measured FLOPs, speed, or energy. Appendix C supplies the missing count of bytes moved and the Roofline model, including why neither an operation count nor a dtype alone predicts elapsed time.
>
> Replaced: “For one MATH image, a simple multiply–accumulate ledger gives about 1.19 million for the CNN and 1.16 million for the ViT, a 1.8% difference.”

Reader pass: no mark.

**16-W6-3** (W6). 'Ledger' in reader prose is always replaced.

> For one $28\times28$ image, a simple multiply–accumulate count gives about 1.19 million for the CNN and 1.16 million for the ViT, a 1.8% difference. **That count includes convolution, linear, and attention matrix products; it omits normalization, activations, softmax, pooling, memory traffic, and implementation effects.** It is a useful dot-product proxy, not measured FLOPs, speed, or energy. Appendix C supplies the missing count of bytes moved and the Roofline model, including why neither an operation count nor a dtype alone predicts elapsed time.
>
> Replaced: “That ledger counts convolution, linear, and attention matrix products; it omits normalization, activations, softmax, pooling, memory traffic, and implementation effects.”

Reader pass: no mark.

**16-W6-4** (W6). 'Ledger' in reader prose is always replaced.

> For one $28\times28$ image, a simple multiply–accumulate count gives about 1.19 million for the CNN and 1.16 million for the ViT, a 1.8% difference. That count includes convolution, linear, and attention matrix products; it omits normalization, activations, softmax, pooling, memory traffic, and implementation effects. It is a useful dot-product proxy, not measured FLOPs, speed, or energy. **Appendix C supplies the missing count of bytes moved and the Roofline model, including why neither an operation count nor a dtype alone predicts elapsed time.**
>
> Replaced: “REF supplies the missing byte ledger and Roofline model, including why neither an operation count nor a dtype alone predicts elapsed time.”

Reader pass: no mark.

**16-W6-5** (W6). 'Ledger' in reader prose is always replaced.

> These runs match the data split, parameter scale, optimizer, update count, minibatch order, and seeds. **Their dot-product counts are close as well.** They do not match architecture-specific tuning, every operation, wall-clock cost, or pretraining. The five runs vary initialization and order while holding one split fixed, so they are not population uncertainty estimates. The 600-image benchmark was opened in earlier chapters and is descriptive, not a fresh final test. This experiment tells us what happened here; it does not rank CNNs and ViTs in general.
>
> Replaced: “Their dot-product ledgers are close as well.”

Reader pass: no mark.

**16-W1-2** (W1 (V4)). 'point' frame and the evaluative aside dropped; the scope contrast stays.

> That does not prove “attention scales forever” or that data erases every useful prior. **It demonstrates something narrower: the architecture ranking can reverse when the training regime changes.** Our 1,000-example scratch run and the paper’s large-source-pretraining run answer different questions.
>
> Replaced: “It demonstrates the narrower (and more valuable) point: the architecture ranking can reverse when the training regime changes.”

Reader pass: no mark.

**16-W7-3** (W7). First mention of Touvron et al.; same URL as Sources.

> DeiT makes a particularly human point. A teacher provides another target, but it does not replace the ground-truth label. A student can outgrow its teacher: it listens, sees other evidence, and decides for itself. In DeiT’s hard-distillation version, a distillation token learns from the teacher’s predicted class while [CLS] learns from the true class; the two heads are combined at inference. The teacher changes supervision, not the identity of the student.

Reader pass: P3 mark on the next, unedited sentence (an anthropomorphic student): baseline, kept, counted.

**16-W7-4** (W7). First mention of Liu et al. (ConvNeXt); same URL as Sources.

> ConvNeXt prevents a lazy conclusion in the opposite direction. Its study first modernized the training recipe, then progressively changed a ResNet toward design choices associated with contemporary Transformers. The training recipe alone raised the reported ResNet-50 ImageNet-1K accuracy from 76.1% to 78.8% before the architectural sequence was complete. Architecture, augmentation, optimization, and data interact: “CNN versus Transformer” is rarely a comparison between two isolated operators.

Reader pass: no mark.

**16-W7-5** (W7). First mentions of Tan and Le, Kaplan et al., Hoffmann et al.; same URLs as Sources.

> We have now used scaling in two different ways. EfficientNet asks how to enlarge one architecture family under a compute multiplier. Kaplan and Chinchilla ask how measured loss changes as parameters, data, and training compute grow. One is a design rule; the other is an empirical forecast.

Reader pass: no mark.

**16-W1-3** (W1 (V4)). 'lesson is' frame dropped; 'outlasts them' keeps the reason 'durable' carried.

> The constants are an empirical design choice from a particular search and model family, not a law that every network must obey. **The budget discipline outlasts the constants: when several resources jointly limit performance, scaling one while freezing the others can spend compute badly.**
>
> Replaced: “The durable lesson is the budget discipline: when several resources jointly limit performance, scaling one while freezing the others can spend compute badly.”

Reader pass: no mark.

**16-W1-4** (W1 (V4)). Announcement dropped; the numbers follow directly.

> Twice as many parameters multiplies the fitted parameter-limited loss by $2^{-0.076}=0.949$ , a 5.1% reduction. Doubling nonredundant data gives $2^{-0.095}=0.936$ , a 6.4% reduction. Doubling optimally allocated compute gives $2^{-0.050}=0.966$ , a 3.4% reduction. Comparing those percentages does not say that one parameter and one token have comparable cost or value; the units, constants, and constraints differ.
>
> Removed: “The doubling arithmetic is now pinned.”

Reader pass: no mark.

**16-W1-5** (W1 (V4)). Announcement dropped; the distinction is stated in the sentences that follow.

> The memorable 20 tokens per parameter comes from the near-balanced frontier estimated by the first approaches: their table gives about 20.2 billion tokens for 1 billion parameters, 205.1 billion for 10 billion, and 1.5 trillion for 67 billion. If we impose the rounded heuristic $D\approx20N$ at the $5.76\times10^{23}$ budget, Equation 19.6 gives
>
> Removed: “This distinction matters.”

Reader pass: no mark.

**16-W7-2** (W7). First mention of Liu et al. (Swin); same URL as Sources.

> | Routing | Swin Transformer | Shifted local windows and a hierarchy constrain attention and control resolution cost |
>
> (source text of the table cell; the gate tool does not match it to a rendered block) (a link is added; the words are unchanged)

Reader pass: no mark.

## Section B: decisions pending, and the reader marks that were resolved

### B1. Prose that contradicts a printed number

Each was raised by the rule-blind reader and checked against the printout. None is on a
sentence this pass wrote; each needs an author decision because it changes a number or a
claim. The default is the shortest fix. The author approved every default on September 30,
2026; row 9 takes its prose option ("prints as 0.0"), because the cell is frozen.

| # | page and place | prose says | printout says | default fix |
|---|---|---|---|---|
| 1 | Ch 9, §9.7, rematch paragraph | "the MLP scores 76% clean and 42% at two pixels" | `MLP    train 100.0%   validation 75.5%`; the chapter's own prose says 75.5% in §9.6 (l.624) and two paragraphs later (l.682) | "76%" → "75.5%" (**applied** September 30, 2026) |
| 2 | Ch 15, "Put the learned read inside the recurrent decoder" | "The packed encoder now returns two things" | `return memory, state, valid` (three values) | "two things" → "three things", and "plus a validity mask" → ", and a validity mask" (**applied** September 30, 2026) |
| 3 | Ch 15, "Why divide by $\sqrt{d_k}$?" | "the scaled value stays near $0.24$" | scaled max weight 0.241, 0.246, 0.246, 0.247 | "near $0.24$" → "between $0.24$ and $0.25$" (**applied** September 30, 2026) |
| 4 | Ch 16, "What this matched run can and cannot show" | "so the 0.4214 gap is a controlled case study" (the paragraph reports the LSTM's 0.0309 lead) | `position improvement: 0.4214 loss`; `positional Transformer minus LSTM: 0.0309 loss` | "the 0.4214 gap is" → "the 0.4214 and 0.0309 gaps are" (**applied** September 30, 2026) |
| 5 | Ch 16, "What did the heads route?" | "The maps obey the contract exactly: … every row sums to one" | `maximum row-sum error: 1.1920928955078125e-07` | delete "exactly" (**applied** September 30, 2026) |
| 6 | Ch 18, §18.1 | "The padding mask separately blocks the final slot as a key." | the corrupted sequence displayed just above has five slots and no `[PAD]` (the six-position example before it ends in `[PAD]`) | add `\ [\text{PAD}]` to the corrupted display (**applied** September 30, 2026) |
| 7 | Ch 19, §19.4 | "all five rows enter one analysis" | `run_paired_seed` appends a CNN row and a ViT row per seed, so `fashion_results` holds ten | "five rows" → "ten rows" (**applied** September 30, 2026) |
| 8 | Ch 8, Figure 8.3 caption and alt text | "so most entries are zero" / "contains mostly zeros" | the drawn matrix is $4\times6$ with three nonzero weights per row: 12 of 24 entries are zero | "most entries are zero" → "half the entries are zero here, and nearly all are for a real image" (**applied** September 30, 2026) |
| 9 | Ch 8, §8.6 | "Exactly zero on the compared interior." | the check prints `0.0` through `:.1f`, which cannot tell zero from anything under 0.05 (a re-run gives a bitwise zero, so the claim is true) | print the difference with `:.1e`, or say "prints 0.0" (the cell is frozen under N1, so the author decides) (**applied** September 30, 2026) |
| 10 | Ch 10, §10.2 | "the BN row holds a near-constant spread through all twelve layers" | `with BN    layer stds: 0.344  0.404  0.395  0.385  0.432  0.384` (six values) | **applied** at the author's request (09-W1-20): "at every printed depth: the signal reaches each layer at a usable scale from the first step" |
| 11 | Ch 10, §10.4 | "It is not a matched-head ablation: the trunks and training recipes differ too." | the page trains LeNet "same recipe" (`train_model(LeNet, epochs=150)`) and NINSmall with the same seed, optimizer, batch size and 75 + 75 epochs of the same loop | "the trunks and training recipes differ too" → "the trunks differ too" (**applied** September 30, 2026) |
| 12 | Ch 10, full-data rematch | "Scratch ends 0.22 points above fine-tuning, smaller than the run-to-run variation one would need…" | $93.92\% \pm 0.12\%$ and $94.14\% \pm 0.08\%$ across three seeds: the gap is about 1.8 times fine-tuning's spread and 2.75 times scratch's | "smaller than the run-to-run variation one would need to resolve as a family-level claim" → "larger than either arm's seed spread (0.12 and 0.08) but, across three seeds, too small for a family-level claim" (**applied** September 30, 2026) |
| 13 | Ch 10, §10.2 | "we need the tool Chapter 9 used and we deferred" | Chapter 9's LeNet (printed here as `# Chapter 9's model`) has no BatchNorm layer | "used and we deferred" → "promised and deferred" (**applied** September 30, 2026) |

### B2. Content the readers raised outside the voice rules

Baseline sentences, not edited by this pass. Listed for the author; the default is to leave
each until its chapter's own pass.

- **Ch 8 (second reading).** "The detector's report moves with the garment." follows a check that shifts the synthetic shapes scene, not a garment. "equivariance ties the survivors together" credits equivariance with what weight sharing does (the paragraph before and Figure 8.3's caption say sharing). Figure 8.1 draws the fixed moving average in orange and Figure 8.3 shades $v_2$ orange, against the palette's rule that orange marks learned weights; the box-average panel says so beside it. The replay panels spell "centre" and "neighbouring" where the prose writes American English.
- **Ch 8.** "precisely the “small network analyzing one patch” of our strategy" misquotes §8.1, which says "use a small detector that analyzes one patch at a time". "The failures of @sec-06… tell us what knowledge to build in, the two principles from the mechanism:" has no referent for *the mechanism*. The recap's "Locality and sharing are built in: as a matrix, convolution is almost-all-zero with nine numbers repeating: 615,000 weights collapsed to 9." chains two colons (recap content is frozen). The §8.8 sentence "Treating the kernel as a parameter tensor … yields the convolutional neural network." read as a different, nominal voice.
- **Ch 10 (second reading).** Figure 10.5's log axis places LeNet near $2\times10^5$ parameters, NiN near $7.7\times10^4$ and VGG near $2.9\times10^5$, while the page prints 61,706, 35,034 and 218,586 for the small-data models and never says the full-data models were resized. The opening's reason for `train_existing` ("this chapter's whole subject is training models it did not just construct") does not match how the probes and the fine-tune run their own loops. Exercise 2 points to "the callout". The summary's BatchNorm bullet ends with a third-person blurb for the companion book.
- **Ch 10.** "The chapter's small-data studies isolated mechanisms." sits against the page's own caveats ("does not isolate which ingredient earned the gain", "not a matched-head ablation"). "one change we will reveal after the numbers" is followed at once by the Predict prompt, which names the change ("one is plain, one residual") before any number prints. "its 64 features flatten sandals, sneakers, and boots into nearly the same point" sits beside a 70.6% probe mean on three classes. "because this chapter's whole subject is training models it did not just construct" overstates the section. Exercise 4's "the bn-drift cell" names an internal cell label.
- **Ch 9 (second reading).** "the head is as brittle to cell-level shifts as @sec-06…'s MLP was to pixel-level ones" does not match the rematch printout (LeNet loses 51.5 points at a 4-pixel shift; the MLP lost 11.5 at 1 pixel). "fires precisely when both experts agree" overstates Figure 9.2, whose corner reader also responds along all four sides (its caption says "fires hardest"). The recap's "Local wiring earns global sight gradually" sits beside the 16×16-of-28 count and Exercise 2, which place globality in the dense head. Figure 9.5's caption still compares the coat with "the earlier sandal", which is not on the page.
- **Ch 9.** "That converter is pooling." has no earlier *converter*, and it casts pooling as
  producing invariance where the pooling panel says "Not invariance". "Under the
  predeclared two-pixel shift, the gap becomes 41.8% versus 62.3%" gives two accuracies for
  one gap.
- **Ch 14.** "just as our one-dimensional example stores a location and its response
  together" read as a contradiction now that the worked instance lists keys and values
  separately; a literal alternative is "just as each observation in our one-dimensional
  example pairs a location with its response". Exercise 7 returns to Figure 14.1 for a
  train/held-out/sealed protocol that its three noiseless points cannot supply; the 60-key
  sample of Figures 14.2 and 14.3 can.
- **Ch 15.** "We have softened the hard." read as a fragment; it is the Chapter 2 callback
  (arc-seeds rows 23 and 50), so the default is to keep it.
- **Ch 16.** "Which three paths write into the residual stream?" (the page names two
  writers, attention and the FFN). "The toy sampler in @sec-14-self-attention-transformer"
  sits on that chapter's own page (default "The toy sampler above"). "temperature applies
  @sec-02-logistic-softmax's softmax dial (@sec-02-logistic-softmax)" names Chapter 2
  twice (default: drop the parenthetical).
- **Ch 18.** Plan step 4 ("Define full attention, the encoder, and the MLM head") and plan
  step 2 ("Define the reusable helpers: `source_sentences` and `encode`") do not match their
  code markers; plan text is frozen by I11, so this is the author's. "That move depends on
  the seed from @sec-14-self-attention-transformer" uses the development word *seed* on a
  page whose seeds are random seeds; it harvests arc-seeds row 60 by name. The gates drift
  inside the chapter: l.23 "feature-hungry" (matching Chapter 10), l.1527
  "representation-hungry" (default: "feature-hungry").
- **Ch 19.** Exercise 6 asks for "sealed-test reliability diagrams" on the 600-image
  benchmark the page calls already opened. The same exercise's "training-time γ" collides
  with EfficientNet's γ = 1.15 on this page.
- **Scene text** (for the scene owners, not this pass): Ch 8's box-average panel cites the figure's `t[4:-4]` plotting line, which sits in a drawing cell the page does not show, and its colour note ("the book keeps orange for weights that are learned") is repeated in the sobel-split panel; Ch 9's lenet-flow panel "The
  chapter's prose rounds the size path to 28, 14, 5"; Ch 16's layernorm-axis panel says a
  turn lasts two and a half seconds "ending at ten seconds" after starting at five; Ch 16's
  both-axes palette note spells "grey"; Ch 18's pair-recount panel notes.

### B3. Decisions pending, each with a default

Line numbers in this section are those of `4828b2e`, where the readings were taken.

1. **Organizing devices (W6, author-gated).** Listed, not rewritten. Default: keep each.
   The literal statement is what a rewrite would say.

   | device | where | literal statement |
   |---|---|---|
   | Pooling's tolerance trade | Ch 8 heading "The property we paid for: equivariance" (l.214) with l.216, 260, 362; Ch 9 "buy tolerance" (l.388, 419–420, 426, 688), callout title "Tolerance has a price tag" (l.424), recap "It is a purchase, and position is the currency." (l.794); Ch 10 "shift tolerance may be bought with positional information" (l.493); arc-seeds row 33 | pooling gains local shift tolerance by discarding some position |
   | LeNet's report card | Ch 9 "two demerits and one IOU … batch normalization is still owed" (l.804–806) ↔ Ch 10's opener ("And one IOU: batch normalization, promised for this chapter.", l.21, which now links the BN paper) and heading "The stabilizer we owe you: batch normalization" (l.171) | one open promise: batch normalization, still to come; "The stabilizer Chapter 9 deferred" |
   | The price list | Ch 14 "derives that price list" (l.173) ↔ interlude "### The price list", "Now we know the price list". The reader also found no antecedent for *that price list* on the Chapter 14 page | derives what each memory method keeps, what it costs, and what it guarantees |
   | Transfer's decision rule | Ch 18 "Transfer should pay when" (l.22) ↔ Ch 10 "transfer pays when" (l.1071); arc-seeds row 39 | transfer is worth its cost when; "help" drops the cost-versus-return sense Chapter 18 uses at l.622 and l.1536 |
   | The inductive-bias trade | Ch 19 l.19, 285, 287, 300 ("paid for in code"), 303 ("That freedom has a computational price", also the attention-bill scene's first literal), heading "Three places to buy back useful bias" (l.760), recap item 3 (l.1246); arc-seeds rows 29 and 61 | built-in structure is exchanged for flexibility |

2. **Borderline announcements.** Each frame carries a reason, a callback, or a count;
   default: keep each. Ch 9: "Two honest disclaimers about the game…" (l.154), "Both knobs
   live in one formula, worth memorizing because…" (l.313), "Two readings of this table."
   (l.571), "Now for the deepest design decision in the network" (l.346). Ch 14: "There is
   a piece of unfinished business from @sec-01…" (l.44), "Now harvest the second promise."
   (l.312), "There is one numerical trap." (l.563), "Now the Part II rhyme returns."
   (l.648), the Sources note "@sec-13-attention performs that harvest." (l.693). Ch 15:
   "The result is visible in the date task before we name all its parts." (l.82), "The
   abstraction has earned a real rematch." (l.601), "Notice what changed relative to
   @sec-11…" (l.876). Ch 16: "A precise proof is more useful than the slogan." (l.177),
   "“Visibility is a modeling decision” is the seed this chapter hands forward." (l.1596).
   Ch 8: "Read the markers and one thing stands out: …" (l.116), "Now collect the reward that @sec-06…'s MLP could never have." (l.216, tied to the gated heading), "One more pair of glasses." (l.265). Ch 10: "…gets the most honest experiment in this book." (l.36), "Why that matters is the subject of the second section." (l.120; the reader also marked it as naming the book's structure), "This is the point about VGG versus its hand-tuned predecessors: …" (l.274), "Pause on what that is: …" (l.335, a pixel-skewer literal follows), "that dip is worth more attention than the win" (l.410, paired with l.487), "You now own both parts of that skeleton." (l.754).
   Ch 18: "Let us pin the idea to shapes before writing code." (l.190), "The limits are
   concrete: …" (l.1535), "The separation in @tbl-pretraining-families matters during
   execution too." (l.1649). Ch 19: "The operation has a useful exact identity." (l.126),
   "This identity is more than a coding shortcut." (l.207), "The result is sharper than a
   one-number leaderboard; …" (l.714), "The historical comparison makes the allocation
   tangible." (l.1179).
3. **Ledger words in a panel.** Chapter 18's figure caption and its Plan step now say
   "five Boolean rows" (one of the two declared I11 failures; Chapter 10's Plan step is the other). The
   bert-ledger replay just below still says *ledger* ("Inspect the five Boolean ledgers",
   its `aria-label`, "The ledger and routes are readable without playback", "the selection
   ledger decides", "“Chosen” is our bookkeeping"); `scripts/test_mechanism_excerpts.cjs`
   reads the panel's `data-ledgers` attribute, so a rename touches that name too. Default: rename the panel's words to *rows* in the scene wave,
   keeping the scene id `bert-ledger` and the code names `ledger_tokens`, `ledger_rows` (a
   fixture literal and figure code). Chapter 10's stacked-sight replay still speaks of "the two
   weight bills" and its pixel-skewer replay of "Its bill" (whose test reads the `bill` value element),
   next to prose that now says *parameter counts*;
   default: the same scene wave.
4. **I18's two flags.** (a) Chapter 14's Sources entry for *Beyond Test-Time Memory* moves
   from the project page to arXiv:2603.09221 (the W7 correction; I18 reads it as a removed
   link). (b) Chapter 18's closing paragraph: dropping "The chapter closes with three
   forward seeds." removes its shortest sentence, so the mean sentence length rises from 19
   to 23 words while the three planted sentences stay verbatim. Default: accept both.
5. **One new Sources entry, and a choice about Fashion-MNIST.** W7 requires every work named
   in prose to be in its chapter's Sources. Chapter 10 names GoogLeNet's Inception block and
   gains Szegedy et al., *Going Deeper with Convolutions* (CVPR 2015, DOI
   10.1109/CVPR.2015.7298594), linked at its first mention. Chapters 8 (l.131, "a boot from
   our Fashion-MNIST subset") and 19 (l.73) also name Fashion-MNIST with no Sources entry, as
   Chapter 9 (in a Plan step) and the interludes do. Adding both entries was tried and
   reverted: the two entries carry the same paper title, and I17 counts that as a shared
   four-word run between added sentences. That blocks `audit_voice_ledger.py --check`,
   which the publish job runs. Default: add the entry (Xiao, Rasul and Vollgraf,
   arXiv:1708.07747, Chapter 10's URL) to each chapter that names the dataset, together with
   an I17 rule that skips Sources entries. Otherwise leave the book's mixed practice as it
   is.
6. **Two more I18 flags are artifacts.** I18 reports nominalizations rising in Chapter 8's
   opening paragraph (2 → 3) and Chapter 10's shoe-task paragraph (1 → 2). The raw counts
   do not rise (3 → 3 and 2 → 2). The audit's exemption filter drops a baseline sentence that
   an earlier exempt record replaced (Chapter 8: the B0 restoration 07-B0-C11a; Chapter 10:
   09-T5-1), which lowers the "before" side. Default:
   accept.
7. **Figures 9.5 and 10.3, from the author's review.** Figure 9.5's kernels (red positive,
   blue negative) need a shared colour bar, symmetric about zero. The figure is drawn from
   LeNet's trained weights, so it is redrawn on the reference machine with the next Part II
   execution. Figure 10.3 now follows the code (Option 2). The prose sentence before
   @eq-residual still reads "each block computes $F(x)$ and outputs $F(x) + x$" (a bound
   identity-lane literal), while `Block` returns `F.relu(y + x)`. Default: "and adds $x$ back
   before its final ReLU", with the scene literal moved in the same edit.
8. **Later passes.** The PCA interlude's "Here is one shape ledger." and Chapter 20's "The
   separate cost ledger below" are outside Parts II and IV. The epilogue's running-prose
   link to *Beyond Test-Time Memory* (`chapters/epilogue.qmd` l.315) still points at the
   TTC-Net project page; its Sources entry already uses arXiv:2603.09221.

### B4. Reader marks on edited sentences, as resolved

| page | mark | resolution |
|---|---|---|
| Ch 14 | "Walk the opening example through the middle column." names the table's layout | recast: "The opening example fills every kernel-regression role." and "The sequence-memory roles have their own instance …" |
| Ch 14 | "Work from 2024–26 …" then lists the 2021 Delta rule | "the older Delta-style fast weights" |
| Ch 14 | "stable- algorithm" (a line-end hyphen) | R9: "stable-algorithm" |
| Ch 16 | the recap said Chapter 9 discarded position, the body that attention drops what convolution had | "Sinusoidal clocks supply the sense of order that @sec-08-cnn's kernels had built in and global routing lacks" |
| Ch 18 | "(In the terms of @sec-04…, the MLM loss is Case 1 …" names an undefined label | "(The MLM loss is @sec-04-estimator-cases's Case 1, a mean over exactly the *selected* positions." |
| Ch 9 | two colons in "accuracy fell off a cliff: the full-frame templates …" (in an edited paragraph) | R9: the second colon becomes a semicolon |
| Ch 9 | the F.mse_loss reduction sentence after an edited sentence reads as a different voice | overruled: the reduction sets the gradient scale the paragraph explains |
| Ch 18 | the planted "Pretraining is a regime, not an architecture; …" repeats §18.7 and names Chapter 19 twice | overruled: the three planted sentences stay verbatim (arc-seeds rows 64, 65, 68) |
| Ch 19 | "A student can outgrow its teacher …" after the new DeiT link | baseline, kept, counted |
| Ch 10 | "The chapter's small-data studies isolated mechanisms." in the paragraph that gained the Fashion-MNIST link | baseline; listed in B2 |
| Ch 10 | "Why that matters is the subject of the second section." after the recast "The recipe has two small novelties" | baseline borderline; listed in B3.2 |
| Ch 9 | Figure 9.3's redrawn caption kept "A coat replaces the earlier sandal", which is not on the page | recast: "On the coat, the nested fields cross visible sleeves, torso, and boundary." |
| Ch 9 | "Take one last look inside, because @sec-06… also showed us … (…, @sec-06…)" cites Chapter 6 twice | R9: the parenthesis drops the repeat (08-R9-5) |
| Ch 10 | the identity-lane replay said the chapter's figure draws the identity path in orange, which the redraw made false | the panel note and its receipt now say both draw it in ink |
| Ch 10 | "Predict before running. … one is plain, one residual." gives away the change the paragraph before promises to reveal | the original prompt named it too; listed in B2 |
| Ch 10 | Exercise 2's "1×1-plus- 5×5" (a line-end hyphen) | R9: "1×1-plus-5×5" (09-R9-9) |
