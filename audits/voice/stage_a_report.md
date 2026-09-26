# Stage A report: voice-coherence pilot

Branch `voice-coherence` from baseline `86ec60b`, pushed as a branch at the author's request; not merged into `main` and not deployed. Pilot pages: Chapter 1,
Chapter 6, Chapter 13, Chapter 17, and the interlude "Attention as Test-Time
Regression". Everything below is measured on rendered HTML unless it says otherwise.
Stage B has not started; it waits for your approval of this report and of
`decisions_pending.md`.

## Summary

- **Register:** every blocking R1 to R6 violation on the five pages is gone (5 at baseline, 0 now), and the pages are in `VOICE_SCOPE`, so CI blocks regressions.
- **Ledger density:** every opener and paragraph on the pilot pages now carries at most two chapter mentions (Chapter 6's opener went from 4 to 0, Chapter 13's from 4 to 2, Chapter 17's from 3 to 2). Prose guard density fell on Chapter 6 (2.49 to 2.02 per 1,000 words), Chapter 13 (2.73 to 1.82), and Chapter 17 (4.55 to 3.59). Distance from the Part I profile fell on every pilot page (Chapter 13 1.92 to 1.23; Chapter 17 3.25 to 2.56).
- **Warmth:** every opener now makes one promise; Chapters 13 and 17 gained verdicts; three recaps now hand the question forward. Reader address rose from zero on Chapter 13, Chapter 17, and the interlude but stays below its floor on all four non-reference pages (section 7 explains why).
- **Invariants:** all of I1 to I16 hold. Printed output is byte-identical (136 stdout blocks, HTML and TeX); code, math, numbers, anchors, link instances, headings (apart from two recap headings), alt text, exercises, sources, and plan steps are unchanged; 23 of 26 notebooks are byte-identical and 3 differ only in line-number metadata; all 21 regenerated figure PDFs are pixel-identical and were restored to their baseline bytes.
- **Builds:** HTML renders with the same 26 expected warnings as baseline. The print PDF stays at 554 pages; the continuous PDF drops from 529 to 528. LaTeX errors, warnings, overfull and underfull counts are unchanged.
- **Edits:** 46 applied edits (16 S1, 8 S2, 1 S4, 4 T1, 2 T2, 3 T4, 2 R1, 3 R2, 1 R3, 6 R7), including two S2 corrections that restored link instances.

Commits, one per phase:

- `cf4db27` Record the voice-coherence baseline on rendered HTML
- `a690d6e` Add the narrator contract and enforce its register rules in CI
- `edfe3c4` Subtract guard and ledger density on the five pilot pages
- `597dd80` Transplant Chapter 1's kit into the other pilot pages
- `a8ad83a` Apply the register rules to the pilot pages and enforce them in CI
- `0916c58` Keep every link instance when S2 rewrites a chapter mention
- `f8260bc` Record the Stage A decisions pending and every moved guard
- (this commit) Validate the pilot and record the Stage A report: refreshed freeze for the five pages, ledgers, receipts, invariants

## 1. Ledger before and after (pilot pages)

Rates per 1,000 words of class A prose; `a → b` marks a change. Bands come from the
Part I profile frozen in `VOICE.md`. The whole-book ledgers are
`ledger_before.csv` and `ledger_after.csv`; `ledger_delta.md` ranks all 35 pages by
distance from the profile.

| metric | Ch 1 | Ch 6 | Ch 13 | Interlude (TTR) | Ch 17 |
|---|---|---|---|---|---|
| prose words | 2563 → 2571 | 2407 → 2478 | 2198 → 2193 | 1387 → 1399 | 3299 → 3343 |
| you /1k (floor 2.56) | 2.731 → 2.723 | 1.246 → 1.614 | 0.0 → 0.912 | 0.0 → 0.715 | 0.0 → 0.299 |
| verdicts /1k (floor 0.97) | 2.731 → 2.723 | 1.246 → 1.211 | 1.82 → 1.824 | 2.163 → 2.144 | 3.031 → 2.991 |
| metaphors /1k (floor 3.49) | 6.243 → 6.223 | 5.401 → 5.246 | 6.369 → 6.384 | 2.163 → 2.144 | 1.212 → 1.197 |
| prose guards /1k (ceiling 1.49) | 0.78 → 1.167 | 2.493 → 2.018 | 2.73 → 1.824 | 5.047 → 5.004 | 4.547 → 3.59 |
| caption guards | 3 | 2 | 3 → 2 | 1 → 0 | 0 |
| Ch. refs /1k (ceiling 8.87) | 2.341 → 2.334 | 6.232 → 4.439 | 11.829 → 10.488 | 5.768 → 5.718 | 3.031 → 2.692 |
| opener refs (cap 2) | 0 | 4 → 0 | 4 → 2 | 1 | 3 → 2 |
| max refs per paragraph (cap 2) | 2 | 4 → 2 | 3 → 2 | 2 | 3 → 2 |
| R2 to R6 hits (non-exempt) | 2 → 0 | 0 → 0 | 1 → 0 | 0 → 0 | 1 → 0 |
| bands missed after | all ok | reader_address, guards_A | reader_address, guards_A, refs A | reader_address, metaphor_hits, guards_A | reader_address, metaphor_hits, guards_A |
| distance from Part I profile | 1.042 → 0.981 | 1.324 → 1.001 | 1.921 → 1.234 | 3.459 → 3.38 | 3.247 → 2.56 |

Notes. Chapter 1 met every band before and after; its prose-guard rate rose from 0.78 to 1.17 only because the brief's own R2 replacement ("That deserves a demonstration, not an assertion.") matches a guard pattern. The interlude's guard rate barely moves because the guard it moved into a callout was not a pattern hit; its caption guard count fell from 1 to 0. Chapter 13's page total of chapter references stays above the ceiling (10.5 against 8.87), which the brief treats as a warning because later chapters cite more history. Metaphor rates on the interlude and Chapter 17 stay low because their images ("four dials" aside, the bills-on-a-ledger metaphor) sit outside the K2 lexicon.

LaTeX health (retained `index.log` of each profile; pages from `pdfinfo`):

```
before
print: errors=0 warnings=9 overfull=423 underfull=54 pages=554
continuous: errors=0 warnings=10 overfull=423 underfull=54 pages=529
after
print: errors=0 warnings=9 overfull=423 underfull=54 pages=554
continuous: errors=0 warnings=10 overfull=423 underfull=54 pages=528
```

## 2. Receipts

`receipts.md` holds one row per prose edit (rule, file:line, before, after, note, and
the section's guard and chapter-reference counts before and after), generated from the
same edit lists that applied the edits (`audits/voice/edits/*.json`). `guards_moved.md`
lists every merged or moved guard with its destination and the claim it limits.

| page | S1 | S2 | S4 | T1 | T2 | T4 | R1 | R2 | R3 | R7 | total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Ch 1 | 0 | 2 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 5 | 10 |
| Ch 6 | 3 | 2 | 0 | 1 | 0 | 1 | 1 | 0 | 0 | 0 | 8 |
| Ch 13 | 3 | 3 | 1 | 1 | 1 | 1 | 0 | 1 | 0 | 1 | 12 |
| Interlude (TTR) | 4 | 0 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 6 |
| Ch 17 | 6 | 1 | 0 | 1 | 1 | 0 | 0 | 1 | 0 | 0 | 10 |
| total | 16 | 8 | 1 | 4 | 2 | 3 | 2 | 3 | 1 | 6 | 46 |

Transplant load: at most four transplanted sentences per page (Chapter 13: promise, verdict, hand-off), about 1 to 2 percent of each page's sentences; Chapter 1 received none because it already met every band.

## 3. Recap headings for all twenty chapters (D1)

Template: `Okay, so: <one-line claim, at most eight words>`. Two headings changed in
the pilot; six more (five chapters and one interlude) need a new claim; the other
fifteen already comply and stay.

| Page | Current heading | Proposed | Status |
|---|---|---|---|
| Ch 1 | Okay, so: what did we just build? | Okay, so: the smallest model tells the whole story | applied (pilot) |
| Ch 2 | Okay, so: classification is regression plus a normalizer | unchanged | complies |
| Ch 3 | Okay, so: one bend changed everything | unchanged | complies |
| Ch 4 | Okay, so: the training loop | Okay, so: one loop trains every model | proposed (noun phrase) |
| Ch 5 | Okay, so: the chain rule, organized | Okay, so: backpropagation is the chain rule, organized | proposed (noun phrase) |
| Ch 6 | Okay, so: the lesson of Part I | Okay, so: the missing ingredient is inductive bias | applied (pilot) |
| Ch 7 | Okay, so: the machine before the learning | Okay, so: the machine works before it learns | proposed (noun phrase) |
| Ch 8 | Okay, so: the kernel became learnable | unchanged | complies |
| Ch 9 | Okay, so: modern CNNs are an optimization story | unchanged | complies |
| Ch 10 | Okay, so: weight sharing moved into time | unchanged | complies |
| Ch 11 | Okay, so: the fixed-size handoff is the bottleneck | unchanged | complies |
| Ch 12 | Okay, so: attention is normalized memory mixing | unchanged | complies |
| Ch 13 | Okay, so: attention softens the address | unchanged | complies (pilot) |
| Ch 14 | Okay, so: the Transformer routes, then computes | unchanged | complies |
| Ch 15 | Okay, so: pretraining manufactures supervision | unchanged | complies |
| Ch 16 | Okay, so: patches become tokens, but regime still matters | unchanged | complies (7 words) |
| Ch 17 | Okay, so: adaptation has three separate bills | unchanged | complies (pilot) |
| Ch 18 | Okay, so: where to update and what to optimize are separate | Okay, so: update location and objective are separate | proposed (9 words; echoes recap item 1) |
| Ch 19 | Okay, so: generation needs a sampling contract | unchanged | complies |
| Ch 20 | Okay, so: two towers learn a comparison, not a world model | Okay, so: two towers learn only a comparison | proposed (9 words and a guard; "only" keeps the boundary) |
| Interlude, experiment | Okay, so: tune the contender, ablate the claim | unchanged | complies |
| Interlude, autoencoders | Okay, so: PCA became a network, then the code became a bottleneck | Okay, so: PCA became a learnable bottleneck | proposed (10 words) |
| Interlude, test-time regression | Okay, so: the solver is part of the architecture | unchanged | complies (pilot) |

Before any recap heading changes, check `interactives/manifest.json` for a
`before-heading` anchor that targets it (Chapter 1's did; the anchor moved with it).

## 4. D7 colour inventory (whole book)

Rendered classes A to F and headings, baseline `86ec60b`. "Fixed in pilot" rows are
done; "Stage B" rows are proposals; everything else stays.

| page | class | colour | context | category | action |
|---|---|---|---|---|---|
| index | A | orange | …Each rung keeps the model below it and adds one move, shown in orange. The grey tags name the Part of the book where ea… | drawing note ("shown in") | keep |
| index | A | grey | …rung keeps the model below it and adds one move, shown in orange. The grey tags name the Part of the book where each move is… | figure element with its own noun | keep |
| index | A | orange | …itivities flow right to left. Every layer holds learnable parameters (orange), and the loss compares the prediction (green) wi… | parenthetical tag | keep |
| index | A | green | …learnable parameters (orange), and the loss compares the prediction (green) with the target (purple).… | parenthetical tag | keep |
| index | A | purple | …range), and the loss compares the prediction (green) with the target (purple).… | parenthetical tag | keep |
| 01-linear-regression | A | blue | …aka the supervision signal. Stack the inputs as rows and you get the blue data matrix MATH: MATH samples down, MATH feature… | colour labels a role | fixed in pilot (01-R7-1) |
| 01-linear-regression | A | purple | …e data matrix MATH: MATH samples down, MATH features across, with the purple targets collected in MATH.… | colour labels a role | fixed in pilot (01-R7-1) |
| 01-linear-regression | A | dark red | …The dark red residual MATH names each miss; squaring and avera… | colour labels a role (the brief's example) | fixed in pilot (01-R7-2) |
| 01-linear-regression | C | black | …p so you can recognize its shape. We use the three framework calls as black boxes here: Chapter 3 introduces modules, Chapter… | not a colour use | keep |
| 01-linear-regression | B | blue | …Figure 1.7: A linear model as a computation circuit: each blue input is scaled by an orange learnable weight, th… | colour labels a role | fixed in pilot (01-R7-4) |
| 01-linear-regression | B | orange | …inear model as a computation circuit: each blue input is scaled by an orange learnable weight, the signals and orange bias are… | colour labels a role | fixed in pilot (01-R7-4) |
| 01-linear-regression | B | orange | …h blue input is scaled by an orange learnable weight, the signals and orange bias are added, and the green prediction leaves t… | colour labels a role | fixed in pilot (01-R7-4) |
| 01-linear-regression | B | green | …ange learnable weight, the signals and orange bias are added, and the green prediction leaves the circuit.… | colour labels a role | fixed in pilot (01-R7-4) |
| 01-linear-regression | A | green | …ed points move, so the fitted line moves too. At one fixed input, the green distribution of predictions has a center and a sp… | colour labels a role | fixed in pilot (01-R7-3) |
| 01-linear-regression | A | black | …ion of predictions has a center and a spread. Its center can miss the black data-generating curve, and fresh outcomes still v… | non-role colour with its own noun | keep |
| 01-linear-regression | B | purple | …ssion recipe; the dotted line marks the slice at MATH. One dataset is purple, the mean prediction is green, and the data-gener… | predicate ("is purple") | keep |
| 01-linear-regression | B | green | …arks the slice at MATH. One dataset is purple, the mean prediction is green, and the data-generating curve is black. Middle:… | predicate | keep |
| 01-linear-regression | B | black | …urple, the mean prediction is green, and the data-generating curve is black. Middle: the same vertical output scale turns tha… | predicate | keep |
| 01-linear-regression | B | green | …istributions. Bias is the distance from truth to mean prediction; the green and gray arrows each span MATH sample standard de… | colour is the sole identifier | fixed in pilot (01-R7-5) |
| 01-linear-regression | B | gray | …ns. Bias is the distance from truth to mean prediction; the green and gray arrows each span MATH sample standard deviation,… | colour is the sole identifier | fixed in pilot (01-R7-5) |
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
| 10-sequences-rnn | B | orange | …e first token survives to the readout. The default-initialized model (orange), same architecture and data, hovers near MATH at… | parenthetical tag | keep |
| 11-encoder-decoder | B | green | …ion source is encoded by the naive model; at its last real character (green) the state is exactly what the decoder should rec… | parenthetical tag | keep |
| 11-encoder-decoder | B | green | …ce-time encoder never produces. Packing simply stops the clock at the green dot.… | colour is the sole identifier | Stage B: "the marked dot (green)" |
| 12-kernel-regression | B | blue | …and the broad rule erases the function’s smaller-scale structure. The blue bandwidth is the grid minimum in the 1,000-world… | colour is the sole identifier of a curve | Stage B: "the bandwidth drawn in blue" |
| 12-kernel-regression | C | black | …The known black curve is a laboratory privilege. On real data, ch… | non-role colour with its own noun | keep |
| 13-attention | B | orange | …ns are contextual encoder states indexed by source character, and the orange box marks the source year. The first four rows co… | drawing note with its own noun | keep |
| 13-attention | A | orange | …el from the last four source positions to the first four outputs. The orange block catches that movement, and across all 400 f… | colour is the sole identifier | fixed in pilot (13-R7-1) |
| 17-peft-quantization | A | brown | …Brown and colleagues found that few-shot gains often gr… | not a colour use (author name) | keep |
| 17-peft-quantization | E | brown | …Brown et al., Language Models are Few-Shot Learners: GP… | not a colour use (author name) | keep |
| 20-multimodal | B | green | …f three declared pairs, every image is scored against every text; the green diagonal marks the three pair relations supplied… | colour with a structural noun | optional in Stage B: "the diagonal (green)" |
| 20-multimodal | B | gray | …itialized towers (left) and by the trained paired model (right); each gray segment connects an image embedding to its declar… | non-role colour with its own noun | keep |

Alt text (class H, frozen by I8; colour words describe the image for non-visual readers): 01-linear-regression 10, 02-logistic-softmax 5, 04-training-loss-sgd 4, 05-backpropagation 9, 06-generalization-inductive-bias 2, 09-modern-cnns-transfer 1, 10-sequences-rnn 3, 11-encoder-decoder 2, 12-kernel-regression 1, 15-bert-pretraining 1, 19-generative 3, 20-multimodal 4, a1-linear-algebra 1, a3-precision-performance 1; total 47.

## 5. Flags

Every flag raised on the pilot pages, then the rule interpretations and blocked items
that need your decision (details in `decisions_pending.md`).

| page | rule | location | text | reason |
|---|---|---|---|---|
| 01-linear-regression | T1-T4 | `chapters/part1/01-linear-regression.qmd` | Chapter 1 meets every density band at baseline. | Brief: 'If a chapter already meets the density bands, add nothing.' No transplant sentence added; the opener promise ('you will know exactly why'), the verdicts ('That second clause is the whole game.', 'Two lines, and we recover the truth up to the noise floor.'), the knob and blindfold metaphors, and the recap hand-off (the callout 'The first make it learnable step') already exist. |
| 01-linear-regression | S1 | `chapters/part1/01-linear-regression.qmd (fig-gd-path caption)` | Gradient descent needs only the local slope, not a view of the whole bowl. | Matches the guard pattern but is an explanatory contrast, not a limiting clause; it is also a replay fixture literal (downhill-bowl-excerpt). Kept. |
| 01-linear-regression | N1 | `chapters/part1/01-linear-regression.qmd (three \footnote{} notes)` | Raw LaTeX \footnote{...} notes (bias augmentation, the Gaussian-noise justification, the ridge rotation note) render in the PDF only; the canonical HTML drops them. | Pre-existing HTML/PDF content-parity defect outside this pass. Converting to ^[...] adds visible HTML content and would move I12; flagged for a separate fix. |
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

Rule interpretations applied in the pilot and awaiting sign-off (`decisions_pending.md`, section 2):

1. **S1** merges same-claim guards always; a different-claim extra moves only into a
   same-section Trap or Note callout whose title fits, or into the page's one new
   callout; the rest are flagged. In the interlude, S1 counts per `###` subsection.
2. **S2** keeps every link instance: an excess "Chapter N" becomes a content term that
   carries the same link (`[the SGD chapter](04-training-loss-sgd.qmd#sec-04-...)`),
   the form the Preface already uses. A first pass dropped three link instances whose
   targets survived elsewhere on the page; commit `0916c58` restored them and I6 now
   fails on any undeclared removal.
3. **I1** masks `#| fig-cap`, `#| tbl-cap`, `#| fig-subcap`, and `#| fig-alt` option
   lines, because those captions and alt texts are text (classes B and H) stored inside
   code cells; I8 still freezes alt text.
4. **I4** ignores numerals that belong to cross-references, since S2 must rewrite some
   of them; I6 protects the links.
5. **D7** treats a colour word attached to a role noun as in scope (the brief's own
   example is of that kind) and fixes it with the Preface's idiom ("shown in orange" or a
   parenthetical tag), saying "dark red" rather than "wine" as the style guide requires.
6. **D2** contradicts the style guide's "Let us" signature move; the style guide now
   defers to `VOICE.md` on register.
7. **New callouts** take their title as an attribute so the heading sequence (I7) is
   unchanged.

Blocked or outside the brief's classes (`decisions_pending.md`, section 6): replay
fixture literals (two Chapter 6 guards, one Chapter 1 caption sentence); 102 em dashes
in replay panels (class R, reported only); Quarto's appendix-title em dash; Chapter 1's
three raw `\footnote{}` notes, which the canonical HTML drops (a pre-existing
HTML/PDF parity defect, to be fixed separately); and three stale facts in the brief
(136 stdout blocks, 151 exercises, no em dash left in Chapter 1's recap heading).

## 6. Invariant checklist

Commands and full outputs: `invariants.md`.

| ID | Invariant | Evidence (saved output) | Result |
|---|---|---|---|
| I1 | Code cells identical per file, in order (caption and alt option lines masked) | `invariants_pilot` | I1   PASS  code cells byte-identical (caption/alt options masked) [chapters/part1/01-linear-regression.qmd: 1 cell(s) changed only in caption/alt options; chapters/part1/06-generalization-inductive-bias.qmd: 1 cell(s) changed only in caption/alt options; chapters/part4/13-attention.qmd: 1 cell(s) changed only in caption/alt options; chapters/part5/17-peft-quantization.qmd: 1 cell(s) changed only in caption/alt options] |
| I2 | Frozen outputs: every stdout block identical, HTML and TeX | `frozen_stdout` | PASS: 136 stdout blocks satisfy the book-wide HEAD exact snapshot across 27 baseline units; 27 HTML/TeX pairs match; 0 reviewed portability deviations |
| I3 | Math multiset per file identical | `invariants_pilot` | I3   PASS  math multiset identical per file |
| I4 | Numeric tokens in classes A to E identical (cross-reference numerals excluded) | `invariants_pilot` | I4   PASS  numeric tokens identical in classes A to E (cross-reference numerals excluded) |
| I5 | Anchor ids and labels identical; 10 protected anchors and 5 bounded pointers intact | `invariants_pilot + public_anchors` | I5   PASS  anchor ids and labels identical; cross-volume pointer lines byte-identical / public anchors (source): pass (10 interfaces) / public anchors (source + rendered HTML): pass (10 interfaces) |
| I6 | Link instances identical per target (declared S2 collapses excepted) | `invariants_pilot` | I6   PASS  link instances identical per target (declared S2 collapses excepted) |
| I7 | Heading sequence and levels identical except recap text (R1) | `invariants_pilot` | I7   PASS  heading sequence and levels identical (recap text under R1) [chapters/part1/01-linear-regression.qmd: recap heading 'Okay, so: what did we just build?' -> 'Okay, so: the smallest model tells the whole story'; chapters/part1/06-generalization-inductive-bias.qmd: recap heading 'Okay, so: the lesson of Part I' -> 'Okay, so: the missing ingredient is inductive bias'] |
| I8 | Figure files and references identical; alt text only under R6 | `invariants_pilot` | I8   PASS  figure references and alt text identical (alt text only under R6) |
| I9 | Exercises: book-wide count, tags, task text | `invariants_book` | I9   PASS  exercise text and tags identical / I9   PASS  exercise count over checked files 151 -> 151 |
| I10 | Sources identical | `invariants_pilot` | I10  PASS  Sources identical |
| I11 | Plan steps byte-identical; regenerated notebooks byte-identical to the baseline export | `invariants_pilot` | I11  PASS  Plan step text byte-identical / I11  PASS  23 of 26 regenerated notebooks byte-identical; 3 differ only in cell source_line metadata (06-generalization-inductive-bias.ipynb, 13-attention.ipynb, 17-peft-quantization.ipynb), with every cell source, plan step, and code line identical |
| I12 | Class A words per page within -8% and +5% | `invariants_pilot` | I12  PASS  01-linear-regression 2563->2571 (+0.3%); 06-generalization-inductive-bias 2407->2478 (+2.9%); 13-attention 2198->2193 (-0.2%); attention-as-test-time-regression 1387->1399 (+0.9%); 17-peft-quantization 3299->3343 (+1.3%) |
| I13 | Existing CI audits pass; no new HTML render warnings; both PDFs render | `several (below)` | see the I13 table |
| I14 | Voice lint: zero blocking violations on pages in scope | `voice_check` | PASS: book voice register rules R1 to R6 hold on 5 page(s) in VOICE_SCOPE; 54 density-band warning(s) (non-blocking) |
| I15 | Cross-volume references identical | `invariants_book` | I15  PASS  cross-volume references identical |
| I16 | Zero em dashes in classes A to F, H, and headings (D6 exceptions listed) | `invariants_pilot + voice_check` | I16  PASS  em dashes in classes A to F, H, T on checked pages: 01-linear-regression: 0 (0 exempt); 06-generalization-inductive-bias: 0 (0 exempt); 13-attention: 0 (0 exempt); attention-as-test-time-regression: 0 (0 exempt); 17-peft-quantization: 0 (2 exempt) |

## 7. What I would change about the rules before the full sweep

Five changes, in order of impact. First, give S1 an explicit unit and more
destinations: count guards per smallest heading that holds prose (the interlude's
single `##` holds six `###` arguments), accept any callout whose frozen title fits
rather than only Trap and Note callouts, and allow one new callout per `##` section on
pages whose prose guards exceed twice the band; as written, S1 can merge duplicates
but cannot move most extras, so Chapter 17 ends the pilot still well over the guard
band, and Chapters 15, 16, and 18 will too. Second, recalibrate the reader-address
floor: a page that starts with no "you" cannot reach 2.56 per 1,000 words inside the
transplant budget, so either count reader-directed imperatives ("Test both the
variance and what softmax sees", "Count what that costs") as address, or let R8 turn
"we" into "you" at genuine decision points and instructions. Third, add the book's own
recurring images to the K2 lexicon ("bill", "ledger", "budget", "price list", "valve",
"gate", "highway", "memory bank") and treat "template" and "filter" as technical
terms in Part II, so the metric counts metaphors rather than vocabulary. Fourth, let
K1 run to fifteen words or accept a verdict within two sentences of its display,
because many displays end in a "where ..." clause and the prescribed Chapter 13
verdict is fifteen words. Fifth, settle what the brief's classes leave open before
Stage B: state in S2 that link instances, not only link targets, survive (the pilot
now reads it that way); decide whether the 102 em dashes in replay panels are in
scope (their tests assert the text); plan Quarto's appendix-title delimiter; let R6
and R7 edit callout titles, which I7 freezes as headings; and consider computing the
Part I profile from Chapters 1 to 5, since Chapter 6's own guard density sat above
the ceiling it helped define.
