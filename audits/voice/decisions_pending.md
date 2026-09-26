# Decisions pending (Stages A, B0, and B1)

Everything here waits for the author. Nothing in this file has been applied beyond the
five pilot pages, the B0 corrections, and Chapters 8 and 9. Section 7 holds the items
that B0 and B1 raised.

## 1. Recap headings (D1)

Settled by the Stage B brief (C10): D1 now allows `Okay, so: ` plus a phrase or a claim
of at most ten words, all 23 recap headings comply, and none changes further. The two
pilot changes (Chapters 1 and 6) stand. Explicit ids (`{#sec-NN-recap}`) are planned for
Stage B3 once the course site is checked for inbound links.

## 2. Rule interpretations that need sign-off

1. **S1 destinations and granularity.** The worked example for Chapter 13 keeps two
   different-claim guards in one subsection ("it does not normalize the vectors"
   stays), and valid destinations are scarce: only Trap or Note callouts count, their
   titles are frozen by I7, and a chapter may add one callout. The pilot therefore
   applied S1 as: always merge same-claim guards (prose with prose, prose with a
   caption, or prose with a callout that already states the claim) into one advice
   sentence before the evidence; move a different-claim extra only into a
   same-section Trap or Note callout whose title fits, or into the chapter's one new
   callout for its densest cluster; flag the rest. The interlude's body is a single
   `##` section with six `###` subsections, so S1 was applied per subsection.
2. **Captions stored as cell options.** Many captions and all code-figure alt texts
   live in `#| fig-cap:` and `#| fig-alt:` lines inside code cells (the brief's own
   Chapter 13 caption example is one). I1 masks exactly those option lines, so a
   caption edit does not count as a code change; I8 still freezes alt text, and the
   receipts list every caption edit.
3. **Cross-reference numerals in I4.** S2 rewrites some "Chapter N" mentions, which
   removes their numerals from the prose. I4 excludes numerals that belong to a
   cross-reference ("Chapter 11", "Figure 13.2", "Exercise 2"); I6 protects the link
   targets instead.
4. **D7 scope and idiom.** The brief's example ("The wine residual names each miss")
   is a colour word attached to a role noun, not a colour standing alone, so both
   forms were treated as in scope. Fixes use the Preface's own idiom ("shown in
   orange", or a parenthetical tag) and "dark red" rather than "wine", as the style
   guide requires for reader-facing prose.
5. **D2 against the style guide.** `docs/style-guide.md` lists "Let us" as a signature
   move. D2 removes it; a pointer at the top of the style guide now defers to
   `VOICE.md` on register.
6. **New callout titles.** The one new callout (Chapter 13, "Reading the heatmap") takes
   its title as an attribute (`title="..."`) so the heading sequence stays identical
   (I7). Rendered, it looks like every other titled callout.

## 3. Flags raised on the pilot pages

| page | rule | location | text | reason |
|---|---|---|---|---|
| 01-linear-regression | T1-T4 | `chapters/part1/01-linear-regression.qmd` | Chapter 1 meets every density band at baseline. | Brief: 'If a chapter already meets the density bands, add nothing.' No transplant sentence added; the opener promise ('you will know exactly why'), the verdicts ('That second clause is the whole game.', 'Two lines, and we recover the truth up to the noise floor.'), the knob and blindfold metaphors, and the recap hand-off (the callout 'The first make it learnable step') already exist. |
| 01-linear-regression | S1 | `chapters/part1/01-linear-regression.qmd (fig-gd-path caption)` | Gradient descent needs only the local slope, not a view of the whole bowl. | Matches the guard pattern but is an explanatory contrast, not a limiting clause; it is also a replay fixture literal (downhill-bowl-excerpt). Kept. |
| 01-linear-regression | N1 | `chapters/part1/01-linear-regression.qmd (three \footnote{} notes)` | Raw LaTeX \footnote{...} notes (bias augmentation, the Gaussian-noise justification, the ridge rotation note) render in the PDF only; the canonical HTML drops them. | Pre-existing HTML/PDF content-parity defect outside this pass. Fixed on its own branch (`ch1-footnotes-html`, from `main`), as the Stage B brief's section 8 asks; this branch takes the I12 move when the fix merges. |
| 06-generalization-inductive-bias | S1 | `chapters/part1/06-generalization-inductive-bias.qmd (Diagnosing the failure)` | After the merge the section keeps three prose guards: 'the U is a helpful cartoon, not a law of nature' (the experiment's verdict and the Chapter 1 callback), the merged caution, and 'so this experiment is not their empirical distance distribution'. | The last is a replay fixture literal (distance-band-excerpt), as is its caption twin ('This is a controlled geometry example, not a claim that natural images fill the 784-dimensional cube uniformly'); S1 would merge the pair but the literals are frozen. No same-section Trap or Note callout exists for the verdict guard. |
| 06-generalization-inductive-bias | S1 | `chapters/part1/06-generalization-inductive-bias.qmd (Inductive bias: constraints as knowledge)` | 'These routes can work together, but they do not make identical promises...' carries one X-not-Y guard and three limitation sentences, one per lever. | Counted as one guard unit (it is the section's comparison of the three levers). Could move into the section's tip callout in Stage B if the author prefers; tips are not S1 destinations as written. |
| 06-generalization-inductive-bias | S2 | `chapters/part1/06-generalization-inductive-bias.qmd (opener)` | The opener rewritten at the author's request on 2026-09-25 changes only in how it cites Part I: its four '(Chapter N)' parentheticals become links on the ingredients themselves, in the original order. | Author visibility: this is recently approved text. |
| 06-generalization-inductive-bias | bands | `chapters/part1/06-generalization-inductive-bias.qmd` | reader_address stays below the 0.6 floor after T1 (about 2.1 per 1,000 words against 2.56). | The T budget and R8 do not justify converting inclusive 'we' sentences; see the rule-change paragraph. |
| 13-attention | S1 | `chapters/part4/13-attention.qmd (Scaled dot product)` | After the merge the section keeps three prose guards: the merged caution, 'it does not normalize the vectors', and 'The mechanisms belong in one conceptual family, not a single inevitable historical derivation.' | The worked example keeps the second in place. The third limits a historical claim; the section has no Trap or Note callout, and the chapter's one new callout went to Section 13.5's denser cluster. |
| 13-attention | T2 | `chapters/part4/13-attention.qmd (after Equation 13.3)` | Two matrix products with a scaled, masked softmax between them: that is the whole operator. | Used verbatim from the brief although it is 15 words against K1's 12-word cap. |
| 13-attention | S2 | `chapters/part4/13-attention.qmd` | Page total of chapter references stays above the band (warn only). | Later chapters legitimately cite history (brief, section 7). |
| 13-attention | bands | `chapters/part4/13-attention.qmd` | reader_address rises from 0 to 2 occurrences; still below the floor. | See the rule-change paragraph. |
| attention-as-test-time-regression | S1 | `chapters/interludes/attention-as-test-time-regression.qmd` | The interlude's body is one '##' section with six '###' subsections. | Read literally, S1 would allow one guard for the whole interlude. Applied per subsection instead, like the brief's worked example for Chapter 13's sqrt(d_k) subsection. Awaiting approval. |
| attention-as-test-time-regression | S1 | `chapters/interludes/attention-as-test-time-regression.qmd (One objective, four dials; Solver 3)` | Each keeps two guards on different claims ('Regularization ... is not, by itself, the same operation as forgetting' and 'an umbrella, not an equivalence theorem'; 'a fading-memory solver choice, not an algebraic consequence' and 'an interpretive bridge, not a claim that Mamba is literally obtained ...'). | No same-section Trap or Note callout; the page's one new callout was not needed elsewhere, but splitting a derivation's caveat from its equation would hurt the argument. |
| attention-as-test-time-regression | S1 | `chapters/interludes/attention-as-test-time-regression.qmd (Figure TTR.2 caption)` | Keys, values, order, queries, decoder, and state width are matched; stored data, side information, and inference arithmetic are not. | The caption's one remaining limiting clause is 20 words (cap 12). Shortening it would drop the matched-controls list the figure needs; kept and flagged. |
| 17-peft-quantization | S1 | `chapters/part5/17-peft-quantization.qmd` | Residual prose guards after the merges: Prompting section 7 (the ICL definition's 'not a checkpoint update', 'would outrun the evidence', the chain-of-thought faithfulness guard, 'Zero trainable parameters is not zero cost', 'without claiming to reproduce natural-language ICL', and the retrieval cluster); LoRA 4 ('capacity floor ... not a result estimated from the optimizer', 'The merged matrix is not therefore rank r', 'Rank 16 alone does not specify', the fashionable-adapter sentence); Quantization about 8; Choose 3; the closing section 1. | The chapter's subject is what each method does not buy. S1's destinations are too few: the sections' callouts are tips or plain warnings (not Trap or Note), callout titles are frozen by I7, and only one new callout is allowed. See the rule-change paragraph. |
| 17-peft-quantization | T3 | `chapters/part5/17-peft-quantization.qmd` | The chapter's organizing metaphor is three bills on one ledger. | 'bill' and 'ledger' are outside the K2 lexicon, so metaphor_hits reads low although the chapter has its metaphor; propose adding both to the lexicon. No metaphor added. |
| 17-peft-quantization | T4 | `chapters/part5/17-peft-quantization.qmd` | Recap item 7 already hands the question forward ('The next chapter will ask what the permitted update should optimize.'). | No sentence added. |
| 17-peft-quantization | R5 | `chapters/part5/17-peft-quantization.qmd (Sources)` | Contractions inside the cited titles of Turpin et al. and Greshake et al. | Cited titles are frozen (N1); the check exempts them and prints each exemption. |

## 4. D7 colour inventory (whole book)

Rendered classes A to F and headings, baseline `86ec60b`. "Fixed in pilot" and "fixed in
B1" rows are done; "Stage B" rows are proposals; everything else stays. Chapter 8's
"navy curve" showed that the Stage A colour list was incomplete, so B1 rescanned the
baseline with 37 more colour names (navy, gold, teal, cyan, magenta, and others); the
rows marked "widened scan" are what it found.

| page | class | colour | context | category | action |
|---|---|---|---|---|---|
| index | A | orange | …Each rung keeps the model below it and adds one move, shown in orange. The grey tags name the Part of the book where ea… | drawing note ("shown in") | keep |
| index | A | grey | …rung keeps the model below it and adds one move, shown in orange. The grey tags name the Part of the book where each move is… | figure element with its own noun | keep |
| index | A | orange | …itivities flow right to left. Every layer holds learnable parameters (orange), and the loss compares the prediction (green) wi… | parenthetical tag | keep |
| index | A | green | …learnable parameters (orange), and the loss compares the prediction (green) with the target (purple).… | parenthetical tag | keep |
| index | A | purple | …range), and the loss compares the prediction (green) with the target (purple).… | parenthetical tag | keep |
| 01-linear-regression | A | blue | …aka the supervision signal. Stack the inputs as rows and you get the blue data matrix MATH: MATH samples down, MATH feature… | colour labels a role | fixed in pilot (01-R7-1; B0 replaced its parentheses with commas, 01-B0-N6b) |
| 01-linear-regression | A | purple | …e data matrix MATH: MATH samples down, MATH features across, with the purple targets collected in MATH.… | colour labels a role | fixed in pilot (01-R7-1; B0 replaced its parentheses with commas, 01-B0-N6b) |
| 01-linear-regression | A | dark red | …The dark red residual MATH names each miss; squaring and avera… | colour labels a role (the brief's example) | fixed in pilot (01-R7-2) |
| 01-linear-regression | C | black | …p so you can recognize its shape. We use the three framework calls as black boxes here: Chapter 3 introduces modules, Chapter… | not a colour use | keep |
| 01-linear-regression | B | blue | …Figure 1.7: A linear model as a computation circuit: each blue input is scaled by an orange learnable weight, th… | colour labels a role | open: B0 restored the baseline caption (01-B0-N6c), because every fix adds parentheses or length, which N6 forbids; see section 7 |
| 01-linear-regression | B | orange | …inear model as a computation circuit: each blue input is scaled by an orange learnable weight, the signals and orange bias are… | colour labels a role | open: B0 restored the baseline caption (01-B0-N6c), because every fix adds parentheses or length, which N6 forbids; see section 7 |
| 01-linear-regression | B | orange | …h blue input is scaled by an orange learnable weight, the signals and orange bias are added, and the green prediction leaves t… | colour labels a role | open: B0 restored the baseline caption (01-B0-N6c), because every fix adds parentheses or length, which N6 forbids; see section 7 |
| 01-linear-regression | B | green | …ange learnable weight, the signals and orange bias are added, and the green prediction leaves the circuit.… | colour labels a role | open: B0 restored the baseline caption (01-B0-N6c), because every fix adds parentheses or length, which N6 forbids; see section 7 |
| 01-linear-regression | A | green | …ed points move, so the fitted line moves too. At one fixed input, the green distribution of predictions has a center and a sp… | colour labels a role | fixed in pilot (01-R7-3) |
| 01-linear-regression | A | black | …ion of predictions has a center and a spread. Its center can miss the black data-generating curve, and fresh outcomes still v… | non-role colour with its own noun | keep |
| 01-linear-regression | B | purple | …ssion recipe; the dotted line marks the slice at MATH. One dataset is purple, the mean prediction is green, and the data-gener… | predicate ("is purple") | keep |
| 01-linear-regression | B | green | …arks the slice at MATH. One dataset is purple, the mean prediction is green, and the data-generating curve is black. Middle:… | predicate | keep |
| 01-linear-regression | B | black | …urple, the mean prediction is green, and the data-generating curve is black. Middle: the same vertical output scale turns tha… | predicate | keep |
| 01-linear-regression | B | green | …istributions. Bias is the distance from truth to mean prediction; the green and gray arrows each span MATH sample standard de… | colour is the sole identifier | open: B0 restored the baseline caption (01-B0-N6d); see section 7 |
| 01-linear-regression | B | gray | …ns. Bias is the distance from truth to mean prediction; the green and gray arrows each span MATH sample standard deviation,… | colour is the sole identifier | open: B0 restored the baseline caption (01-B0-N6d); see section 7 |
| 05-backpropagation | B | blue | …Figure 5.1: Computation as a graph. The forward pass (top, blue) computes each value and keeps what the backward… | parenthetical tag | keep |
| 05-backpropagation | B | dark red | …d keeps what the backward pass will reuse. The backward pass (bottom, dark red) starts from MATH and multiplies one local deriva… | parenthetical tag | keep |
| 05-backpropagation | B | gray | …tivity back to every unit that fed it, then gate elementwise by MATH (gray). The numbers are the executed values; blue is ne… | parenthetical tag | keep |
| 05-backpropagation | B | blue | …gate elementwise by MATH (gray). The numbers are the executed values; blue is negative and dark red positive on one shared s… | colour scale | keep |
| 05-backpropagation | B | dark red | …ATH (gray). The numbers are the executed values; blue is negative and dark red positive on one shared scale, so the fading towar… | colour scale | keep |
| 05-backpropagation | B | blue | …l is built the same way. Sensitivities and gradients share the signed blue-to-dark-red scale; the activations, all positive,… | colour scale | keep |
| 05-backpropagation | B | red | …e same way. Sensitivities and gradients share the signed blue-to-dark-red scale; the activations, all positive, are green.… | colour scale | keep |
| 05-backpropagation | B | green | …the signed blue-to-dark-red scale; the activations, all positive, are green.… | predicate | keep |
| 06-generalization-inductive-bias | B | blue | …aped into images. The labeled scale runs from negative weights at the blue end through pale zero to positive weights at the… | colour scale | keep |
| 06-generalization-inductive-bias | B | red | …weights at the blue end through pale zero to positive weights at the red end; magnitude grows darker away from zero. Each… | colour scale | keep |
| 08-cnn | B | red | ….5: What LeNet learned to look for. Top: six first-layer 5×5 kernels (red positive, blue negative). Bottom: their feature m… | colour scale | keep |
| 08-cnn | B | blue | …learned to look for. Top: six first-layer 5×5 kernels (red positive, blue negative). Bottom: their feature maps on the same… | colour scale | keep |
| 08-cnn | A | navy | …And yet the navy curve falls too. Also worth stating precisely, because it t… | colour is the sole identifier (widened scan) | fixed in B1 (08-R7-1: "LeNet's curve") |
| 10-sequences-rnn | B | orange | …e first token survives to the readout. The default-initialized model (orange), same architecture and data, hovers near MATH at… | parenthetical tag | keep |
| 10-sequences-rnn | B | navy | …ed-6050 LSTMs from the table above. The task-solving model (navy) holds its gates flat around 0.76 for all eighty steps… | parenthetical tag (widened scan) | keep |
| 11-encoder-decoder | B | green | …ion source is encoded by the naive model; at its last real character (green) the state is exactly what the decoder should rec… | parenthetical tag | keep |
| 11-encoder-decoder | B | green | …ce-time encoder never produces. Packing simply stops the clock at the green dot.… | colour is the sole identifier | Stage B: "the marked dot (green)" |
| 11-encoder-decoder | B | navy | …way to its final drift, and each further step compounds it (navy); the decoder is handed the endpoint of the shaded excursio… | parenthetical tag (widened scan) | keep |
| 11-encoder-decoder | T, A, C, D | gold | "Teacher forcing: training on the gold rail", "the gold token", and five more | not a colour use: gold means ground truth (widened scan) | keep |
| 12-kernel-regression | B | blue | …and the broad rule erases the function’s smaller-scale structure. The blue bandwidth is the grid minimum in the 1,000-world… | colour is the sole identifier of a curve | Stage B: "the bandwidth drawn in blue" |
| 12-kernel-regression | C | black | …The known black curve is a laboratory privilege. On real data, ch… | non-role colour with its own noun | keep |
| 13-attention | B | orange | …ns are contextual encoder states indexed by source character, and the orange box marks the source year. The first four rows co… | drawing note with its own noun | keep |
| 13-attention | A | orange | …el from the last four source positions to the first four outputs. The orange block catches that movement, and across all 400 f… | colour is the sole identifier | fixed in pilot (13-R7-1) |
| 17-peft-quantization | A | brown | …Brown and colleagues found that few-shot gains often gr… | not a colour use (author name) | keep |
| 17-peft-quantization | E | brown | …Brown et al., Language Models are Few-Shot Learners: GP… | not a colour use (author name) | keep |
| 20-multimodal | B | green | …f three declared pairs, every image is scored against every text; the green diagonal marks the three pair relations supplied… | colour with a structural noun | optional in Stage B: "the diagonal (green)" |
| 20-multimodal | B | gray | …itialized towers (left) and by the trained paired model (right); each gray segment connects an image embedding to its declar… | non-role colour with its own noun | keep |

Alt text (class H, frozen by I8; colour words describe the image for non-visual readers): 01-linear-regression 10, 02-logistic-softmax 5, 04-training-loss-sgd 4, 05-backpropagation 9, 06-generalization-inductive-bias 2, 09-modern-cnns-transfer 1, 10-sequences-rnn 3, 11-encoder-decoder 2, 12-kernel-regression 1, 15-bert-pretraining 1, 19-generative 3, 20-multimodal 4, a1-linear-algebra 1, a3-precision-performance 1; total 47.

## 5. D8: "I" and "my" outside the Preface, Acknowledgments, and Epilogue

| Page | Text | Reading |
|---|---|---|
| Interlude, experiment | "finish the sentence: the claim I want this experiment to support is ..." | the reader's template sentence, not the narrator; keep |
| Ch 7 | "does intensity change here, in my direction?" | the detector's voice; keep |
| Ch 8 | "Here is a game. I have a feature detector (one of Chapter 7's zoo, but I won't tell you which). I will only show you what it does" | the narrator's guessing game; the amended D8 keeps its first person, and B1 removed the contraction in the brief's words (08-R5-1: "though I will not say which") |
| Ch 11 | the model may say "I'm done" | quoted speech; exempt |
| Ch 14 | a query asks "what am I looking for?" (and the key and value questions) | quoted personification; exempt |

## 6. Blocked or outside the brief's classes

- **Replay fixture literals (N1-like).** Scenes in `interactives/manifest.json` pin
  verbatim sentences. Two Chapter 6 guards are literals (distance-band-excerpt), so S1
  cannot merge that pair; Chapter 1's "Gradient descent needs only the local slope, not
  a view of the whole bowl" is a literal too. Changing a literal means re-authoring its
  replay.
- **Replay panels (class R).** 102 em dashes live in replay text (`interactives/*/`
  panels and players), for example 21 on Chapter 4's page. The brief's classes do not
  cover replays, and a parallel workstream is actively adding them; they are reported,
  not edited. Decide whether Stage B includes them.
- **Appendix titles.** Quarto renders "Appendix A [em dash] Linear Algebra and the SVD" from
  its default appendix delimiter. R6 in headings will need a project setting
  (`crossref: appendix-delim`), not a prose edit, when the appendices are swept.
- **Chapter 1's raw `\footnote{}` notes.** Three notes appear only in the PDF; the
  canonical HTML drops them. Converting them to `^[...]` adds HTML content (and moves
  I12), so the fix lives on its own branch, `ch1-footnotes-html`, as the Stage B brief's
  section 8 asks.
- **Stale brief facts.** 136 frozen stdout blocks (not 133), 151 exercises (not 150),
  and no em dash in Chapter 1's recap heading at baseline.

## 7. Items raised by B0 and B1

1. **C13 wording (Chapter 6 opener).** The brief quotes the restored list as ending
   "exact automatic differentiation". That phrase arrived with the September 25
   revision; the sentence before it (`389efe3^`) ends "gradients for anything", and C13
   restored that sentence verbatim, each phrase keeping its link (06-B0-C13). Either
   ending is a one-phrase change.
2. **Chapter 5's promise (V3).** The brief's cap on "By the end" is two, for Chapter 8's
   baseline opener and Chapter 13's promise (which C8 keeps), but the baseline had a
   third use: Chapter 5's September 25 opener. The cap blocks `--check`, so B0 rephrased
   Chapter 5's sentence with its four deliverables intact (05-B0-V3), although Chapter 5
   is outside B1. Chapter 5 still gets its full review in B2; say if you would rather
   restore its "By the end" and raise the cap to three.
3. **Chapter 1's captions: D7 against N6.** Every D7 fix for the Figure 1.7 and 1.8
   captions adds parentheses or lengthens the caption by more than 15 percent, which N6
   forbids, so B0 restored the baseline wording (01-B0-N6c, 01-B0-N6d). Choose one:
   accept colour as the identifier in these two captions, or allow one parenthetical
   colour tag per caption.
4. **Chapter 9's reader turn (T5).** The brief places "Predict before running" at the
   transfer experiment and asks for a turn at the depth wall; in the text it is the
   other way round. The one new turn went to the transfer experiment, which had none
   (09-T5-1). Confirm the placement.
5. **T5 on the pilot pages.** T5 arrived with Stage B. None of the five pilot pages has
   a body sentence that asks the reader to predict before a run or to rerun with a
   change (Chapter 13's one prompt sits in an exercise). Should B2 give each an
   experiment turn, within T5's limit of three, or leave the pilot pages as approved?
6. **Chapter 7's closing and opener.** Commit 872a326 (September 25) also replaced the
   chapter's closing, which carried the book's question ("What if the template were
   learnable?"). C11 did not list it, so it waits for B2's September 25 review. The
   restored "bare hands" paragraph carries "(@sec-08-cnn)", which puts three chapter
   mentions in the opener against the cap of two (warn only until Chapter 7 enters
   scope); B2's S2 pass can move that link onto "Part II's revolution" and keep it. The
   same paragraph's "is the whole point of the chapter" is the book's fourth "X is the
   whole Y" (report only, restored rather than added); say whether B2 should thin it.
7. **Chapter 8's guards.** Prose guards stay at about 1.8 per 1,000 words against Part
   II's ceiling of 1.5 (warn only). They are the experiments' closing limitations, in
   the place the book puts them. Accept, or name the ones to cut.
8. **Chapter 8's roadmap paragraphs (S2).** The LeNet paragraph ("Every line is a tool
   we already own ...") and the "LeNet, then and now" callout carry three chapter
   mentions each under the enumeration exemption; every other paragraph carries at
   most two, and the page total stays above the band (warn only).
9. **"honest" in a Chapter 9 heading.** "Transfer learning: the mechanics, and an honest
   experiment" keeps its "honest": I7 freezes heading text except recaps and the
   mechanical rules, and S5 is not one of them. It is one of the page's two remaining
   uses. Change it only if headings may take S5.
10. **The NOVEL marker in Chapter 9.** The DenseNet bridge still carries
    `<!-- NOVEL: needs sign-off -->`; this pass did not touch it.
11. **Course-site links (for B3).** The course site (`dl-course-site` at `4fd7616`) links
    book chapters by page URL only, in `lib/module-extras.ts`; no link carries a `#sec-`
    fragment. Explicit recap ids in B3 therefore break no inbound link.
