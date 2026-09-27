# Stage B1 report: the B0 corrections and Chapters 8 and 9

Branch `voice-coherence` from baseline `86ec60b`; not merged into `main` and not deployed.
B0 applied the author's corrections to the five pilot pages, restored the September 25
regressions the brief lists in Chapters 6 and 7, and rephrased one Chapter 5 sentence to
meet a V3 cap; B1 revised Chapters 8 and 9. Everything below is measured on rendered HTML
unless it says otherwise. B2 has not started; it waits for your approval of this report
and of section 9 (also `decisions_pending.md`, section 7).

## Summary

- **Register:** R1 to R6 hold on all seven pages in `VOICE_SCOPE` (the five pilot pages
  and Chapters 8 and 9). Chapter 9 lost its five contractions, its one exclamation mark,
  and its "let's"; Chapter 8 lost its one contraction, and its guessing game keeps the
  first person under the amended D8.
- **Phrase caps (V3):** every blocking cap holds book-wide: "One caution" 0, "that is the
  whole" 0, "By the end" 2 (Chapters 8 and 13), "you will be able to" 0, "in one
  sentence" 3. Habit words fell where one page carried three or more: "honest" 38 to 32
  (Chapter 9 six to two), "deliberately" 36 to 32 (Chapter 17 six to two).
- **Added sentences (I17):** 66 sentences on eight pages (Chapter 7's B0 edits are all
  restorations, which I17 exempts); no two in different chapters share a four-word
  sequence or their first three words. Section 8 lists every one.
- **Concreteness (I18):** 48 changed paragraph groups; none adds a nominalization or a
  parenthesis, grows its mean sentence length by more than 15 percent, or drops a link or
  the book's question.
- **Invariants:** all of I1 to I18 hold on the nine edited pages. Printed output is
  byte-identical (136 stdout blocks, HTML and TeX); code, math, numbers, anchors, link
  instances, headings (apart from two recap headings and one R5 heading), alt text,
  exercises, sources, and plan steps are unchanged; 20 of 26 notebooks are byte-identical
  and 6 differ only in line-number metadata; all 40 regenerated figure PDFs were
  pixel-identical and keep their committed bytes.
- **Builds:** HTML renders with the same 26 expected warnings as baseline. The print PDF
  grows from 554 to 556 pages (restored and added prose) and `download.html` now says so;
  the continuous PDF is back at 529. LaTeX errors, warnings, and overfull counts are
  unchanged; underfull boxes fall from 54 to 52.
- **Edits:** 29 in B0 and 19 in B1 (section 2).

Commits:

- `6694b1b` Amend the voice contract for Stage B: jobs, concreteness, caps, I17, I18
- `ab48c5f` Apply the B0 corrections and restore concrete prose in Chapters 6 and 7
- `9ff70c2` Revise Chapters 8 and 9 under the Stage B rules
- (this commit) Validate B0 and B1 and record the B1 report: refreshed freeze for the
  nine pages, ledgers, phrase ledger, receipts, invariants

Chapter 1's PDF-only footnotes are not on this branch: they are pull request #5 from
`main` (branch `ch1-footnotes-html`), as the brief's section 8 asks.

## 1. Ledger before and after (the nine edited pages)

Baseline `86ec60b` against this commit, both measured with the amended ledger
(`ledger_baseline_b1.csv`, `ledger_b1.csv`); `ledger_delta_b1.md` ranks all 35 pages.
Rates per 1,000 words of class A prose; `a → b` marks a change. Reader address counts
"you" and sentence-initial imperatives. Bands (warn only): reader address at least 3.16
in Part I and 2.64 elsewhere, verdicts at least 0.97, metaphors at least 3.49, prose
guards at most 1.5 in Parts I to III and 2.5 in Parts IV and V and the interludes,
chapter references at most 8.87, and at most two in the opener and in any paragraph.

| page | prose words | reader address /1k | verdicts /1k | metaphors /1k | prose guards /1k | Ch. refs /1k | opener refs | max refs per paragraph | nominalizations /1k | bands missed after | distance |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Ch 1 | 2563 → 2570 | 4.682 → 4.669 | 2.731 → 2.724 | 7.803 → 7.782 | 0.78 → 0.778 | 2.341 → 2.335 | 0 | 2 | 48.381 → 48.249 | all ok | 1.039 → 1.037 |
| Ch 5 | 2626 → 2620 | 4.95 → 4.58 | 3.046 → 3.053 | 3.808 → 3.817 | 1.142 → 1.145 | 2.285 → 2.29 | 2 | 2 | 36.177 → 36.26 | all ok | 1.128 → 1.136 |
| Ch 6 | 2407 → 2430 | 2.908 → 2.881 | 1.246 → 1.235 | 7.894 → 8.23 | 2.493 → 2.058 | 6.232 → 4.527 | 4 → 0 | 4 → 2 | 58.995 → 55.556 | reader_address_total, guards_A | 1.255 → 1.008 |
| Ch 7 | 1179 → 1216 | 0.848 → 0.822 | 1.696 → 1.645 | 10.178 → 10.691 | 0.0 | 5.937 → 7.401 | 2 → 3 | 1 | 54.283 → 49.342 | reader_address_total, refs opener | 1.505 → 1.573 |
| Ch 8 | 2741 → 2784 | 4.013 → 3.592 | 1.824 → 2.155 | 9.121 → 10.057 | 1.824 → 1.796 | 11.31 → 11.135 | 2 | 3 | 36.848 → 36.638 | guards_A, refs A, refs max_paragraph | 1.228 → 1.333 |
| Ch 9 | 2917 → 2983 | 5.142 → 5.699 | 1.371 → 1.676 | 9.942 → 9.722 | 1.028 → 1.006 | 5.142 → 5.028 | 2 | 2 | 33.253 → 32.853 | all ok | 0.749 → 0.709 |
| Ch 13 | 2198 → 2205 | 0.455 → 2.268 | 1.82 → 1.814 | 7.734 → 7.71 | 2.73 → 1.814 | 11.829 → 10.431 | 4 → 2 | 3 → 2 | 58.69 → 57.143 | reader_address_total, refs A | 1.904 → 1.141 |
| Interlude (TTR) | 1387 → 1393 | 0.721 → 0.718 | 2.163 → 2.154 | 7.931 → 7.897 | 5.047 → 5.025 | 5.768 → 5.743 | 1 | 2 | 53.353 → 53.123 | reader_address_total, guards_A | 3.383 → 3.365 |
| Ch 17 | 3299 → 3344 | 0.303 → 0.598 | 3.031 → 2.99 | 3.334 → 4.785 | 4.547 → 3.589 | 3.031 → 2.691 | 3 → 2 | 3 → 2 | 54.562 → 54.426 | reader_address_total, guards_A | 3.16 → 2.423 |

Notes. Chapter 8's distance from the profile rises (1.23 to 1.33) because the distance is
two-sided: the verdict after Equation 8.2 and the handoff's demerits, IOU, and cliff
(Chapter 9's own words, as the brief asks) lift verdicts and metaphors further above the
profile; its reader address falls by one "you" because the brief's wording for the game
("though I will not say which") drops "tell you". Chapter 7 rises (1.51 to 1.57) because
C11 restored author text with two chapter links, one of them in the opener, which now
holds three mentions (section 9, item 6). Chapter 5's reader address falls by one "you"
with the rephrased promise. Chapter 8 still sits above the Part II guard ceiling and the
chapter-reference band, as the brief expected (section 5).

LaTeX health (retained `index.log` of each profile; pages from `pdfinfo`):

```
before (86ec60b)
print: errors=0 warnings=9 overfull=423 underfull=54 pages=554
continuous: errors=0 warnings=10 overfull=423 underfull=54 pages=529
after (this commit)
print: errors=0 warnings=9 overfull=423 underfull=52 pages=556
continuous: errors=0 warnings=10 overfull=423 underfull=52 pages=529
```

## 2. Receipts

`receipts.md` holds one row per prose edit across every edit list (Stage A, then B0, then
B1; a stage in parentheses marks a Stage B edit), with the section's guard and
chapter-reference counts before and after. `guards_moved.md` lists every merged or moved
guard. Restorations carry a `restored: <commit>^` justification and author text an
`author text` one, so I17 and I18 can tell them from new phrasing.

| stage | page | S1 | S2 | S5 | V3 | V4 | V5 | T1 | T2 | T4 | T5 | R2 | R4 | R5 | R7 | N6 | total |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| B0 | Ch 1 | 0 | 1 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 7 |
| B0 | Ch 5 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| B0 | Ch 6 | 2 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 6 |
| B0 | Ch 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 3 |
| B0 | Ch 13 | 0 | 1 | 0 | 0 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 |
| B0 | Interlude (TTR) | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| B0 | Ch 17 | 2 | 0 | 4 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8 |
| B0 | total | 4 | 2 | 6 | 1 | 2 | 1 | 3 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 9 | 29 |
| B1 | Ch 8 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 1 | 1 | 0 | 5 |
| B1 | Ch 9 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 1 | 1 | 5 | 0 | 0 | 14 |
| B1 | total | 0 | 0 | 5 | 0 | 0 | 0 | 0 | 2 | 2 | 1 | 1 | 1 | 6 | 1 | 0 | 19 |

Rule counts per stage and page. B0's nine N6 edits are the restorations and the I18
repairs; B1's six R5 edits are Chapter 9's five contractions and Chapter 8's game.

## 3. Recap headings (D1)

D1 as amended (C10) allows `Okay, so: ` plus a phrase or a claim of at most ten words.
No recap heading changed in B0 or B1, and every one complies:

| page | recap heading | words after the colon | D1 |
|---|---|---:|---|
| 01-linear-regression | Okay, so: the smallest model tells the whole story | 7 | complies |
| 02-logistic-softmax | Okay, so: classification is regression plus a normalizer | 6 | complies |
| 03-nonlinearity-mlp | Okay, so: one bend changed everything | 4 | complies |
| 04-training-loss-sgd | Okay, so: the training loop | 3 | complies |
| 05-backpropagation | Okay, so: the chain rule, organized | 4 | complies |
| 06-generalization-inductive-bias | Okay, so: the missing ingredient is inductive bias | 6 | complies |
| learning-by-experiment | Okay, so: tune the contender, ablate the claim | 6 | complies |
| 07-filters-convolution | Okay, so: the machine before the learning | 5 | complies |
| 08-cnn | Okay, so: the kernel became learnable | 4 | complies |
| 09-modern-cnns-transfer | Okay, so: modern CNNs are an optimization story | 6 | complies |
| making-pca-learnable | Okay, so: PCA became a network, then the code became a bottleneck | 10 | complies |
| 10-sequences-rnn | Okay, so: weight sharing moved into time | 5 | complies |
| 11-encoder-decoder | Okay, so: the fixed-size handoff is the bottleneck | 6 | complies |
| 12-kernel-regression | Okay, so: attention is normalized memory mixing | 5 | complies |
| 13-attention | Okay, so: attention softens the address | 4 | complies |
| 14-self-attention-transformer | Okay, so: the Transformer routes, then computes | 5 | complies |
| attention-as-test-time-regression | Okay, so: the solver is part of the architecture | 7 | complies |
| 15-bert-pretraining | Okay, so: pretraining manufactures supervision | 3 | complies |
| 16-vit-scaling | Okay, so: patches become tokens, but regime still matters | 7 | complies |
| 17-peft-quantization | Okay, so: adaptation has three separate bills | 5 | complies |
| 18-alignment | Okay, so: where to update and what to optimize are separate | 9 | complies |
| 19-generative | Okay, so: generation needs a sampling contract | 5 | complies |
| 20-multimodal | Okay, so: two towers learn a comparison, not a world model | 9 | complies |

23 of 23 recap headings comply.

## 4. D7 colour inventory

The full inventory is `decisions_pending.md`, section 4. Chapter 8's "navy curve" showed
that the Stage A colour list was incomplete, so B1 rescanned the baseline with 37 more
colour names; B1 fixed the one bare colour identifier it found (08-R7-1), and the other
new rows are parenthetical tags or the "gold rail" idiom, which is not a colour use. B0
restored the baseline wording of two Chapter 1 captions because every D7 fix there adds
a parenthesis or lengthens the caption past N6's limit (section 9, item 3). The rows
that changed:

| page | class | colour | context | category | action |
|---|---|---|---|---|---|
| 01-linear-regression | A | blue | …aka the supervision signal. Stack the inputs as rows and you get the blue data matrix MATH: MATH samples down, MATH feature… | colour labels a role | fixed in pilot (01-R7-1; B0 replaced its parentheses with commas, 01-B0-N6b) |
| 01-linear-regression | A | purple | …e data matrix MATH: MATH samples down, MATH features across, with the purple targets collected in MATH.… | colour labels a role | fixed in pilot (01-R7-1; B0 replaced its parentheses with commas, 01-B0-N6b) |
| 01-linear-regression | B | blue | …Figure 1.7: A linear model as a computation circuit: each blue input is scaled by an orange learnable weight, th… | colour labels a role | open: B0 restored the baseline caption (01-B0-N6c), because every fix adds parentheses or length, which N6 forbids; see section 9 |
| 01-linear-regression | B | orange | …inear model as a computation circuit: each blue input is scaled by an orange learnable weight, the signals and orange bias are… | colour labels a role | open: B0 restored the baseline caption (01-B0-N6c), because every fix adds parentheses or length, which N6 forbids; see section 9 |
| 01-linear-regression | B | orange | …h blue input is scaled by an orange learnable weight, the signals and orange bias are added, and the green prediction leaves t… | colour labels a role | open: B0 restored the baseline caption (01-B0-N6c), because every fix adds parentheses or length, which N6 forbids; see section 9 |
| 01-linear-regression | B | green | …ange learnable weight, the signals and orange bias are added, and the green prediction leaves the circuit.… | colour labels a role | open: B0 restored the baseline caption (01-B0-N6c), because every fix adds parentheses or length, which N6 forbids; see section 9 |
| 01-linear-regression | B | green | …istributions. Bias is the distance from truth to mean prediction; the green and gray arrows each span MATH sample standard de… | colour is the sole identifier | open: B0 restored the baseline caption (01-B0-N6d); see section 9 |
| 01-linear-regression | B | gray | …ns. Bias is the distance from truth to mean prediction; the green and gray arrows each span MATH sample standard deviation,… | colour is the sole identifier | open: B0 restored the baseline caption (01-B0-N6d); see section 9 |
| 08-cnn | A | navy | …And yet the navy curve falls too. Also worth stating precisely, because it t… | colour is the sole identifier (widened scan) | fixed in B1 (08-R7-1: "LeNet's curve") |
| 10-sequences-rnn | B | navy | …ed-6050 LSTMs from the table above. The task-solving model (navy) holds its gates flat around 0.76 for all eighty steps… | parenthetical tag (widened scan) | keep |
| 11-encoder-decoder | B | navy | …way to its final drift, and each further step compounds it (navy); the decoder is handed the endpoint of the shaded excursio… | parenthetical tag (widened scan) | keep |
| 11-encoder-decoder | T, A, C, D | gold | "Teacher forcing: training on the gold rail", "the gold token", and five more | not a colour use: gold means ground truth (widened scan) | keep |

## 5. Flags

Every flag added since Stage A (the Stage A flags are in `stage_a_report.md`, section 5,
and `decisions_pending.md`, section 3; Chapter 1's footnote flag now points at pull
request #5). The ones that need a decision are in section 9.

| page | rule | location | text | reason |
|---|---|---|---|---|
| 01-linear-regression | D7 | `chapters/part1/01-linear-regression.qmd (Figure 1.7 and Figure 1.8 captions)` | 'each blue input is scaled by an orange learnable weight ...' and 'the green and gray arrows each span ...' | Every D7 fix adds a parenthesis or lengthens the caption more than 15 percent, which N6 forbids; the captions keep their baseline wording. |
| 06-generalization-inductive-bias | C13 | `chapters/part1/06-generalization-inductive-bias.qmd (opener)` | The brief quotes the older opener sentence as ending 'and exact automatic differentiation'; the pre-September-25 text ends 'and gradients for anything'. | Restored the actual older sentence (it also has one nominalization fewer under N6). Flip if the author prefers the quoted wording. |
| 07-filters-convolution | N6 | `chapters/part2/07-filters-convolution.qmd (closing)` | Commit 872a326 also replaced the chapter's closing ('An entire era of computer vision lived inside these constraints ...', 'You can hear the question coming ... Nine numbers ... What if the template were learnable? That question is Chapter 8 ...'). | Not in C11; queued for the B2 September 25 review of Chapter 7 (it removed the book's question). |
| 07-filters-convolution | S2/V3 | `chapters/part2/07-filters-convolution.qmd (opener)` | The restored 'bare hands' paragraph (07-B0-C11b) carries '(@sec-08-cnn)', so the opener holds three chapter mentions against the cap of two, and 'is the whole point of the chapter', the book's fourth 'X is the whole Y'. | Restored verbatim as C11 asks; neither blocks, because Chapter 7 enters VOICE_SCOPE in B2 and the verdict form is report-only. B2's S2 pass can move the link onto 'Part II's revolution' and keep it; the author may thin 'the whole point' there. |
| 08-cnn | T1/T3/T5 | `chapters/part2/08-cnn.qmd` | No promise, no opener verdict, no metaphor, and no reader turn added. | The opener already promises LeNet and the rematch; 'Nine numbers, nine knobs' and 'the whole revolution' are the model verdicts; the knob, detective, appliance, and currency images are the chapter's metaphors; the rematch already says 'Write your predictions down before running'. |
| 08-cnn | S1 | `chapters/part2/08-cnn.qmd` | Prose guards stay above the Part II ceiling (about 1.8 per 1,000 words against 1.5). | They are experiment-closing limitations in the book's own placement ('descriptive, not an uncertainty estimate ...'); the brief says leave them. |
| 08-cnn | S2 | `chapters/part2/08-cnn.qmd` | The LeNet paragraph ('Every line is a tool we already own ...') and the 'LeNet, then and now' callout carry three chapter mentions each. | Both are enumerations of where tools were introduced (roadmap exemption); every other paragraph carries at most two. The page total stays above the band, as a history-dense chapter's may. |
| 09-modern-cnns-transfer | T5 | `chapters/part2/09-modern-cnns-transfer.qmd` | The brief places 'Predict before running' at the transfer experiment and asks for a turn at the depth wall. | In the text the prediction prompt sits at the depth-wall experiment (Question 2); the transfer experiment had none, so the one new reader turn went there. |
| 09-modern-cnns-transfer | T1/T3 | `chapters/part2/09-modern-cnns-transfer.qmd` | No promise and no metaphor added. | The opener's report card, demerits, IOU, and four design questions already orient the reader; bills, superhighway, and curriculum are the chapter's images. |
| 09-modern-cnns-transfer | S5/I7 | `chapters/part2/09-modern-cnns-transfer.qmd (transfer heading)` | 'Transfer learning: the mechanics, and an honest experiment' keeps its 'honest'. | Heading text is frozen by I7 except recap and mechanical rules; it counts as one of the two kept uses. |
| 09-modern-cnns-transfer | report | `chapters/part2/09-modern-cnns-transfer.qmd (DenseNet bridge)` | The HTML comment 'NOVEL: needs sign-off' on the DenseNet bridge. | An author-facing note outside this pass; not touched. |
| attention-as-test-time-regression | C9 | `chapters/interludes/attention-as-test-time-regression.qmd (recap)` | The handoff 'The next chapter holds the architecture fixed and changes where supervision comes from: ...' stays. | It names the carried object (the architecture) and shares no structure with the Chapter 13 handoff; it is one of the two 'The next chapter' handoffs the cap allows (the other is Chapter 17's recap item 7). |

## 6. Invariant checklist (I1 to I18)

Full outputs: `invariants_b1.md`. Pages checked: Chapters 1, 5, 6, 7, 8, 9, 13, 17, and
the test-time-regression interlude, every page edited since the baseline.

| ID | Invariant | Evidence (saved output) | Result |
|---|---|---|---|
| I1 | Code cells identical per file, in order (caption and alt option lines masked) | `invariants_pages` | I1   PASS  code cells byte-identical (caption/alt options masked) [chapters/part1/06-generalization-inductive-bias.qmd: 1 cell(s) changed only in caption/alt options; chapters/part4/13-attention.qmd: 1 cell(s) changed only in caption/alt options; chapters/part5/17-peft-quantization.qmd: 2 cell(s) changed only in caption/alt options] |
| I2 | Frozen outputs: every stdout block identical, HTML and TeX | `frozen_stdout` | PASS: 136 stdout blocks satisfy the book-wide HEAD exact snapshot across 27 baseline units; 27 HTML/TeX pairs match; 0 reviewed portability deviations |
| I3 | Math multiset per file identical | `invariants_pages` | I3   PASS  math multiset identical per file |
| I4 | Numeric tokens in classes A to E identical (cross-reference numerals excluded) | `invariants_pages` | I4   PASS  numeric tokens identical in classes A to E (cross-reference numerals excluded) |
| I5 | Anchor ids and labels identical; protected anchors and bounded pointers intact | `invariants_pages + public_anchors` | I5   PASS  anchor ids and labels identical; cross-volume pointer lines byte-identical / public anchors (source): pass (10 interfaces) / public anchors (source + rendered HTML): pass (10 interfaces) |
| I6 | Link instances identical per target (declared collapses and additions excepted) | `invariants_pages` | I6   PASS  link instances identical per target (declared S2 collapses excepted) |
| I7 | Heading sequence and levels identical except recap text and mechanical rules | `invariants_pages` | I7   PASS  heading sequence and levels identical (recap text under R1) [chapters/part1/01-linear-regression.qmd: recap heading 'Okay, so: what did we just build?' -> 'Okay, so: the smallest model tells the whole story'; chapters/part1/06-generalization-inductive-bias.qmd: recap heading 'Okay, so: the lesson of Part I' -> 'Okay, so: the missing ingredient is inductive bias'; chapters/part2/09-modern-cnns-transfer.qmd: R5 heading "BN is two different machines: tell PyTorch which one you're running" -> 'BN is two different machines: tell PyTorch which one you are running'] |
| I8 | Figure files and references identical; alt text only under R6 | `invariants_pages` | I8   PASS  figure references and alt text identical (alt text only under R6) |
| I9 | Exercises: book-wide count, tags, task text | `invariants_pages + invariants_book` | I9   PASS  exercise text and tags identical / I9   PASS  exercise count over checked files 51 -> 51 / I9   PASS  exercise text and tags identical / I9   PASS  exercise count over checked files 151 -> 151 |
| I10 | Sources identical | `invariants_pages` | I10  PASS  Sources identical |
| I11 | Plan steps byte-identical; regenerated notebooks identical to the baseline export | `invariants_pages` | I11  PASS  Plan step text byte-identical / I11  PASS  20 of 26 regenerated notebooks byte-identical; 6 differ only in cell source_line metadata (06-generalization-inductive-bias.ipynb, 07-filters-convolution.ipynb, 08-cnn.ipynb, 09-modern-cnns-transfer.ipynb, 13-attention.ipynb, 17-peft-quantization.ipynb), with every cell source, plan step, and code line identical |
| I12 | Class A words per page within -8% and +5% | `invariants_pages` | I12  PASS  01-linear-regression 2563->2570 (+0.3%); 05-backpropagation 2626->2620 (-0.2%); 06-generalization-inductive-bias 2407->2430 (+1.0%); 07-filters-convolution 1179->1216 (+3.1%); 08-cnn 2741->2784 (+1.6%); 09-modern-cnns-transfer 2917->2983 (+2.3%); 13-attention 2198->2205 (+0.3%); attention-as-test-time-regression 1387->1393 (+0.4%); 17-peft-quantization 3299->3344 (+1.4%) |
| I13 | Existing CI audits pass; no new HTML render warnings; both PDFs render | `several (below)` | see the I13 table |
| I14 | Voice lint: zero blocking violations on pages in scope; V3 caps; I17 | `voice_check` | I17: 66 added sentence(s) on 8 page(s); 0 shared-phrasing violation(s); V3 caps one_caution 0/0, that_is_the_whole 0/0, by_the_end 2/2, you_will_be_able_to 0/1, in_one_sentence 3/3 PASS: book voice register rules R1 to R6 hold on 7 page(s) in VOICE_SCOPE; 41 density-band warning(s) (non-blocking) |
| I15 | Cross-volume references identical | `invariants_book` | I15  PASS  cross-volume references identical |
| I16 | Zero em dashes in classes A to F, H, and headings (D6 exceptions listed) | `invariants_pages` | I16  PASS  em dashes in classes A to F, H, T on checked pages: 01-linear-regression: 0 (0 exempt); 05-backpropagation: 0 (0 exempt); 06-generalization-inductive-bias: 0 (0 exempt); 07-filters-convolution: 0 (0 exempt); 08-cnn: 0 (0 exempt); 09-modern-cnns-transfer: 0 (0 exempt); 13-attention: 0 (0 exempt); attention-as-test-time-regression: 0 (0 exempt); 17-peft-quantization: 0 (2 exempt) |
| I17 | Added sentences share no four-word sequence and no opening across chapters | `invariants_pages + voice_check` | I17  PASS  66 added sentences on 8 page(s); no shared four-word sequence or opening across chapters |
| I18 | Concreteness: no rise in nominalizations or parentheses, no sentence growth above 15%, no link or book-question removal | `invariants_pages` | I18  PASS  48 changed paragraph group(s) on 9 page(s): no rise in nominalizations or parentheses, no mean-sentence growth above 15%, no link or book-question removal (new material, relocated caveats, and restorations exempt) |

I13 details:

| audit | exit | last line |
|---|---:|---|
| `audit_plan_code.py` | 0 | PASS: 197 learner-visible Python surfaces use Plan → Code; 96 execution-only cells are exempt |
| `audit_book_contract.py` | 0 | PASS: 20 chapter retrieval/source contracts, canonical exercise tags, book voice and splice hygiene (with the VOICE.md register check wired into the rendered build), five prose-only part transitions, hidden display-only  |
| `audit_python_sources.py` | 0 | PASS: parsed 289 executable cells, 4 transclusions, and 25 Python modules/scripts; learner-visible lines are at most 88 columns and Chapter 15 remains self-contained |
| `audit_public_anchors.py` | 0 | public anchors (source): pass (10 interfaces) |
| `audit_public_anchors.py --rendered _book` | 0 | public anchors (source + rendered HTML): pass (10 interfaces) |
| `audit_excerpt_fixtures.py` | 0 | PASS: 41 mechanism excerpt(s) mirror 250 verbatim fixture literal(s) across 21 chapter(s), with 151 declared computed variant(s), current chapter digests in 35 receipt(s), live anchors, and one declared timeline each |
| `audit_frozen_stdout.py` | 0 | PASS: 136 stdout blocks satisfy the book-wide HEAD exact snapshot across 27 baseline units; 27 HTML/TeX pairs match; 0 reviewed portability deviations |
| `audit_html_assets.py _book` | 1 | FAILED: 0 Phase E/F source violation(s), 0 missing unique HTML support asset(s), 0 metadata/renderer violation(s), 0 navigation/disclosure violation(s), 0 rendered-content leak(s), and 0 image-alt violation(s), and 26 ca |
| `audit_pdf.py (print)` | 0 | PASS: PDF geometry, text layer, and retained LaTeX logs contain no print loss or missing glyphs |
| `audit_pdf.py (continuous)` | 0 | PASS: PDF geometry, text layer, and retained LaTeX logs contain no print loss or missing glyphs |
| `npm test --prefix scripts/html-tests` | 0 | ℹ tests 1972; ℹ pass 1972; ℹ fail 0 |
| `audit_voice_ledger.py --check` | 0 | PASS: book voice register rules R1 to R6 hold on 7 page(s) in VOICE_SCOPE; 41 density-band warning(s) (non-blocking) |

HTML render warnings: baseline and B1 render both report 26 `WARN` lines (all unresolved `notebooks/*.ipynb` links, which CI adds); the sorted lists are identical.

LaTeX health (retained `index.log` of each profile; pages from `pdfinfo`):

```
before
print: errors=0 warnings=9 overfull=423 underfull=54 pages=554
continuous: errors=0 warnings=10 overfull=423 underfull=54 pages=529
after
print: errors=0 warnings=9 overfull=423 underfull=52 pages=556
continuous: errors=0 warnings=10 overfull=423 underfull=52 pages=529
```

`audit_html_assets.py _book` reports the notebook download targets as missing locally, as it
does at baseline; CI adds the validated notebooks before that audit runs.

Commands (run from the repository root with the book's virtualenv; `BASE` and `B1` are
the baseline and B1 HTML snapshots, and the notebook directories are fresh exports):

```bash
python scripts/audit_voice_invariants.py --base 86ec60b --files <the nine pages> \
  --html-before BASE --html-after B1 --notebooks-before NB_BASE --notebooks-after NB_B1 \
  --exceptions audits/voice/invariant_exceptions.json
python scripts/audit_voice_invariants.py --base 86ec60b --exceptions audits/voice/invariant_exceptions.json
python scripts/audit_voice_ledger.py --check B1
python scripts/audit_frozen_stdout.py
python scripts/audit_excerpt_fixtures.py
python scripts/audit_pdf.py _book/Deep-Learning--Making-It-Learnable.pdf --log-root .
python scripts/audit_pdf.py _book/Deep-Learning--Making-It-Learnable--Continuous.pdf --log-root .
npm test --prefix scripts/html-tests
python scripts/audit_voice_ledger.py --phrases BASE B1 --markdown audits/voice/phrases.md
```

The other I13 audits (`audit_plan_code.py`, `audit_book_contract.py`,
`audit_python_sources.py`, `audit_public_anchors.py` with and without `--rendered _book`,
`audit_html_assets.py _book`) run with no arguments beyond those shown in the I13 table.

## 7. Phrase ledger (V3)

From `phrases.md`, which also lists every page's count. "Before" is the baseline.

| phrase | cap | before | now | pages with 3+ now |
|---|---|---:|---:|---|
| "One caution" | blocking, 0 | 0 | 0 | none |
| "that is the whole" | blocking, 0 | 0 | 0 | none |
| "By the end" (promise formula) | blocking, 2 | 2 | 2 | none |
| "you will be able to" | blocking, 1 | 0 | 0 | none |
| "in one sentence" | blocking, 3 | 3 | 3 | none |
| "deliberately" | report only | 36 | 32 | 15-bert-pretraining 4 |
| "honest", "honestly", "honesty" | report only | 38 | 32 | 10-sequences-rnn 3, 11-encoder-decoder 4 |
| "is exactly" | report only | 23 | 22 | 03-nonlinearity-mlp 3, 11-encoder-decoder 3 |
| "Here is the" | report only | 13 | 13 | none |
| verdict form "X is the whole Y" | report only | 3 | 4 | none |

The one rise, the fourth "X is the whole Y", is restored author text in Chapter 7 ("is
the whole point of the chapter", C11), not an added sentence; section 9, item 6.

## 8. I17 output: every added sentence

`audit_voice_ledger.py --check` prints:

```
I17: 66 added sentence(s) on 8 page(s); 0 shared-phrasing violation(s); V3 caps one_caution 0/0, that_is_the_whole 0/0, by_the_end 2/2, you_will_be_able_to 0/1, in_one_sentence 3/3
```

The population it checks, as each sentence now reads (restorations are exempt from I17
and so are not listed; the Stage A sentences that B0 left in place are included, because
I17 is book-wide):

I17 checks 66 added sentences on 8 pages: no shared four-word sequence and no shared first three words across chapters.

| page | edit | added sentence (as it now reads) |
|---|---|---|
| 01-linear-regression | 01-R3-1 | where each MATH is an input with MATH features and MATH is the desired output, also called the supervision signal. |
| 01-linear-regression | 01-R7-2 | The residual MATH , shown in dark red, names each miss; squaring and averaging those misses produces one neutral scalar. |
| 01-linear-regression | 01-R7-3 | At one fixed input, the distribution of predictions, shown in green, has a center and a spread. |
| 01-linear-regression | 01-B0-C7 | We use the three framework calls as black boxes here: REF introduces modules, REF opens the optimizer, and REF explains what backward() computes. |
| 01-linear-regression | 01-B0-N6a | That is worth seeing, not just asserting. |
| 01-linear-regression | 01-B0-N6b | Stack the inputs as rows and you get the data matrix MATH , shown in blue: MATH samples down, MATH features across, with the targets, shown in purple, collected in MATH . |
| 01-linear-regression | 01-B0-N6c | A linear model as a computation circuit: each blue input is scaled by an orange learnable weight, the signals and orange bias are added, and the green prediction leaves the circuit. |
| 01-linear-regression | 01-B0-N6d | Bias is the distance from truth to mean prediction; the green and gray arrows each span MATH sample standard deviation, visualizing the spreads whose squared values enter prediction variance and irreducible noise. |
| 01-linear-regression | 01-B0-S5a | Two lines, and we recover the truth up to the noise floor. lstsq handles rank and conditioning more reliably than explicitly forming MATH . |
| 01-linear-regression | 01-B0-S5b | This is the regime where variance explodes and regularization shines: |
| 05-backpropagation | 05-B0-V3 | The pages ahead derive it as a recursion on sensitivities, implement it by hand on a batch, count what it costs in arithmetic and in memory, and check that torch.autograd agrees with you to machine precision. |
| 06-generalization-inductive-bias | 06-B0-C8 | The memorized coordinates show up in the first-layer templates themselves, and the two constraints Part II builds in against them are named before the recap. |
| 06-generalization-inductive-bias | 06-B0-C4b | One seeded Adam sweep describes its own regime: it cannot separate their effects, estimate a scaling law, or establish a MATH variance law. |
| 08-cnn | 08-S5-1 | Read the clean-validation column: the MLP scores 75.5% and LeNet 74.5% in this single seeded run. |
| 08-cnn | 08-T2-1 | Padding buys back what the window eats; stride skips stops on purpose. |
| 08-cnn | 08-T4-1 | LeNet leaves this chapter with two demerits and one IOU: most of its parameters sit in the dense head, its shift cliff was softened rather than abolished, and batch normalization is still owed. |
| 08-cnn | 08-R5-1 | I have a feature detector (one of Chapter 7's zoo, though I will not say which). |
| 08-cnn | 08-R7-1 | And yet LeNet's curve falls too. |
| 09-modern-cnns-transfer | 09-S5-1 | One evaluation label needs a note. |
| 09-modern-cnns-transfer | 09-S5-2 | One caveat before you re-derive the field equations of vision from this: the MATH arithmetic assumes the channel width stays MATH through the stack. |
| 09-modern-cnns-transfer | 09-S5-3 | The decision rule supported by the experiments is: transfer pays when (your labels are scarce) and (the target task is feature-hungry) and (the pretraining data plausibly covers the target's features at a matched scale). |
| 09-modern-cnns-transfer | 09-S5-4 | Our experiment isolates the residual rescue at one depth; a strict demonstration that adding depth degrades a plain network would also require a shallower plain control. |
| 09-modern-cnns-transfer | 09-S5-4 | Our experiment found scratch and the ImageNet probe in a near tie across three seeds at 28-pixel scale. |
| 09-modern-cnns-transfer | 09-T2-1 | Doing nothing is one weight setting away; the block learns the correction. |
| 09-modern-cnns-transfer | 09-T5-1 | Rank the three contenders before you run them, and write down how far ahead you expect the ImageNet backbone to finish. |
| 09-modern-cnns-transfer | 09-T4-1 | The convolutional trunk travels on: the autoencoder interlude squeezes a whole image through it into one fixed-width code, and Part III starts where a single code runs out, with inputs of any length. |
| 09-modern-cnns-transfer | 09-R2-1 | The accuracy is 76.2%, and that dip is worth more attention than the win, so we will not rush past it. |
| 09-modern-cnns-transfer | 09-R4-1 | At evaluation time there may be no batch (one image), so it uses running averages collected during training. model.train() and model.eval() switch between the two. |
| 09-modern-cnns-transfer | 09-R5-2 | We will not build Inception here (the principle, channel compression before spatial expense, is the transferable part), but Exercise 2 walks the arithmetic and the course assignment has you build the block itself. |
| 09-modern-cnns-transfer | 09-R5-3 | So push it: stack twenty of our two-conv blocks (with BN, per the recipe, on a MATH grid so the experiment fits a laptop) and compare against the identical stack with one change we will reveal after the numbers. |
| 09-modern-cnns-transfer | 09-R5-4 | MATH convolutions run Chapter 1's linear model across channels at every pixel: summarize channels, do not discard them. |
| 09-modern-cnns-transfer | 09-R5-5 | Depth can hit an optimization wall: our plain 40-layer net could not fit its own training set. |
| 13-attention | 13-S2-1 | An embedding can learn what lives at row 17, but fetching row 17 is still a rigid act of indexing: learned content behind a hard address. |
| 13-attention | 13-S2-1 | You already own the tool that softens it. |
| 13-attention | 13-S2-1 | Replace the one address with a distribution over addresses, let the gradient reach every score, and the model can learn which rows deserve weight. |
| 13-attention | 13-S2-1 | That is Chapter 2's softmax, keeping the promise that chapter made. |
| 13-attention | 13-S2-2 | Part III called the old handoff a finite-state bottleneck. |
| 13-attention | 13-S2-3 | Masking returns there as well: a causal mask will decide which future positions an autoregressive model may not see. |
| 13-attention | 13-S1-1 | Nothing forces trained projections to stay independent or unit-variance, so read the square-root factor as variance control under stated assumptions rather than a law about trained layers; the audit below tests exactly those assumptions. |
| 13-attention | 13-S4-1 | Additive attention remains useful and accelerator-compatible; scaled dot product maps more directly to the matrix operations modern numerical libraries optimize heavily. |
| 13-attention | 13-T1-1 | By the end of the chapter you will have built it twice, masked it correctly, and watched it carry a date's year to the front of the output. |
| 13-attention | 13-T4-1 | The recurrent networks that write the memory stay in place for now; Chapter 14 lets a sequence query itself, so every position learns where to look and recurrence becomes optional. |
| 13-attention | 13-R2-1 | Test both the variance and what softmax sees. |
| 13-attention | 13-R7-1 | The boxed region catches that movement, and across all 400 fixed validation examples, 97.5% of those four rows' mass lands on states indexed by the source-year region. |
| 13-attention | 13-B0-C1 | Compare in one product, mix in the other; softmax sets the weights. |
| 13-attention | 13-B0-C2 | In practice: compare one request with every stored candidate, normalize the scores, and blend the stored values with the resulting weights. |
| 17-peft-quantization | 17-S2-1 | BERT's recipe showed the conventional next step: fine-tuning changes every encoder weight. |
| 17-peft-quantization | 17-S1-1 | QLoRA composes the last two. |
| 17-peft-quantization | 17-S1-2 | These bills are related, but they are not interchangeable: every lever can affect more than one bill, and none removes all backbone storage or transient work. |
| 17-peft-quantization | 17-S1-4 | Brown and colleagues found that few-shot gains often grew with model scale in GPT-3, an empirical result over particular models and tasks that does not establish universal parameter thresholds. |
| 17-peft-quantization | 17-S1-4 | Those results constrain simple stories about copying examples. |
| 17-peft-quantization | 17-S1-6 | The experiment was also built from a low-rank shift; a task whose useful correction is not well captured at the chosen rank will retain error no matter how fashionable the adapter is. |
| 17-peft-quantization | 17-T2-1 | The weights never move; only the context does. |
| 17-peft-quantization | 17-R2-1 | Put those promises on one ledger. |
| 17-peft-quantization | 17-B0-C5 | None of the evidence below settles a universal causal mechanism for how a Transformer uses demonstrations. |
| 17-peft-quantization | 17-B0-C6a | Low rank is a hypothesis about the update, not a free compression theorem. |
| 17-peft-quantization | 17-B0-C6b | The point is inspectability rather than an impressive compression ratio; real LoRA savings depend on wide matrices, small ranks, and which layers are targeted. |
| 17-peft-quantization | 17-B0-C8 | Each method below must answer two questions on this ledger, which object it changes and which of the three bills it cuts, and the table under Choose by the bill you need to reduce answers both for every method. |
| 17-peft-quantization | 17-B0-S5a | Counts label trainable adapter values in this small layer. |
| 17-peft-quantization | 17-B0-S5b | \| Method \| Task state and permitted writes \| Main consequence \| \|---\|---\|---\| \| Hard prompt / ICL \| State in ordinary context; no gradients during use \| No learned task checkpoint; longer context \| \| RAG \| State in index and retrieved context; writes depend on design \| Fresher evidence; retrieval failure surface \| \| Prompt tuning \| State in continuous input vectors; write prompt  … |
| attention-as-test-time-regression | TTR-S1-2 | “Retains every row” does not mean “recalls every association exactly. |
| attention-as-test-time-regression | TTR-S1-2 | Softmax still returns a convex mixture whose quality depends on keys, temperature, and interference. |
| attention-as-test-time-regression | TTR-S1-3 | REF makes a prediction we can test without pretending to train a language model or benchmark a state-space model. |
| attention-as-test-time-regression | TTR-S1-4 | A sealed synthetic mechanism test. |
| attention-as-test-time-regression | TTR-T4-1 | The next chapter holds the architecture fixed and changes where supervision comes from: unlabeled text writes its own questions, and the representation it trains becomes worth reusing. |
| attention-as-test-time-regression | TTR-B0-C8 | The comparison reveals what each solver retains, what it costs, and which statistical contract it accepts. |

## 9. Decisions pending

These are also `decisions_pending.md`, section 7, which sits beside the Stage A items
that remain open.

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

## 10. What I would change about the rules before B2

Five changes, in order of impact.

1. **Count each cap's baseline with the tool, not in the brief.** The V3 cap on "By the
   end" assumed one baseline use; the phrase ledger found two (Chapter 5's September 25
   opener as well as Chapter 8's), so meeting the cap meant editing a chapter outside B1
   (item 2 of section 9). State each blocking cap as "the baseline count plus N" and let
   `phrases.md` supply the baseline, so the brief and the book cannot disagree.
2. **Separate an experiment's closing limitation from the guard count.** The Preface's
   acceptance criteria end every experiment with its limitation, and in an
   experiment-dense chapter those sentences are most of the guards: Chapter 8 keeps
   about 1.8 per 1,000 words against Part II's 1.5 with nothing left to merge. Count one
   closing limitation per experiment as its own metric and apply the ceiling to the rest;
   Chapters 4 and 10, at 2.0 and 2.5 per 1,000 words at baseline, will meet the same wall
   in B2.
3. **Give S5 and D7 a narrow licence in headings and captions.** I7 freezes heading text,
   so Chapter 9's "an honest experiment" keeps its habit word, and I18's parenthesis rule
   blocks the only D7 idiom that fits Chapter 1's two captions. Let S5 delete one habit
   word from a heading, as R4 and R5 now may edit headings, and let one parenthetical
   colour tag per caption pass I18.
4. **Sweep T5 once over the approved pages.** T5 arrived after the pilot, and none of the
   five pilot pages asks the reader to predict before a run. Allow B2 one turn per pilot
   page with an executable experiment, under the same V1 and V2 checks as every other
   added sentence.
5. **Keep the D7 colour list in the tool.** The Stage A inventory missed "navy" because
   its colour list lived in a one-off scan. Put the widened list in
   `audit_voice_ledger.py` so the inventory is reproducible and `--check` can warn when
   a colour alone names a figure element in class A prose.
