# Print revisions carried into the HTML edition (2026-10-19)

On October 19, 2026 the author had two sets of review corrections written to the Springer print master.
While carrying them, a gap came to light: the print changes made between the October 14 carry's source
and the October 18 carry's morning snapshot had never been carried. The October 18 carry compared the
master with its snapshot of the same morning, so everything written to print between October 14 and that
morning fell between the two carries. Chiefly that is the beta readers' edits of October 17 (Chapters 1 to
7, with the matching rename in Chapter 12) and of October 18 morning (Chapters 8 to 13), plus the author's
unrecorded print edits of October 18 afternoon to Chapter 14 and the Part I page. This carry takes both, on
branch `carry-2026-10-19`, built on PR #29's branch `print-revisions-2026-10-18` (record:
`print_revisions_2026-10-18.md`).

**Source.**
- The review corrections: the print project's `reports/decisions.md`, items "Review corrections of
  2026-10-19" and "Second set of corrections of 2026-10-19" (backups
  `overleaf-backup-review-20261019-102144` and `overleaf-backup-review2-20261019-125932`).
- The gap: for every print file changed after the October 14 carry, its state at the first backup taken
  after that carry was compared with the current master (October 18 21:46, or October 19 for the files the
  corrections touched). The baselines are the backups `beta-ch1-3` of October 17 14:24 (Chapters 1 to
  3), `beta-ch4-7` of October 17 15:31 (Chapters 4 to 7 and 12), `beta-ch8-13` of October 18 11:34
  (Chapters 8 to 11 and 13), `density` of October 18 21:46 (Chapter 15, whose file was untouched since
  October 14) and `notation-rules` of October 18 16:34 (Chapters 16 to 23, whose files still held the
  October 14 text). The whole-chapter reads below cover the window between the October 14 carry's source
  and each baseline; where the porters also diffed that window against the backup of October 14 morning,
  it held only edits the October 14 carry took and the readers' bracketed notes.
- Chapter 14 and the Part I page had no such backup and were compared paragraph by paragraph with this
  edition. For Chapter 14, print keeps the earlier chapter commented out after its live text; with the
  author's review notes stripped, that is the October 14 text.
- Where a delta mixes stages (beta readers, notation, rules, density, October 19), it was split with the
  intermediate backups (Chapters 10, 12 and 16), so rows the October 18 carry decided keep their outcome
  unless this record says otherwise. Each porter also read the whole print chapter against this edition. No other
  print change since the October 14 carry was found; every remaining difference is a recorded divergence.

**Method.** One porter per print chapter (23 chapters and the Part I page) applied what the rules below
allow and recorded every print change as an entry with its outcome. A reviewer then checked each unit for
fidelity, completeness, flow and mechanics, and a fixer applied the points it verified (17 units had a fix
pass). The replay check strings were updated centrally afterwards, and an independent check verified them.
Entry ids are the porters' own (for example `ch05-oct19-30`); ids such as `D10-16` are the row ids of the
print density registers.

## Rules applied

The author's decisions of October 16 (the October 14 carry):
1. The language goes everywhere, including sentences a replay or scene test quotes. Only the check strings
   follow it: fixture literals and anchor targets in `interactives/manifest.json`, and the scene tests'
   expected strings. No panel, player, timeline or visual changes.
2. The figures stay. No code cell changes, so plotted labels keep their wording. Captions and alt text in
   cell options (`fig-cap`, `fig-alt`) are prose and follow print, as in earlier carries.
3. This edition keeps its structure. Print's moves between and within chapters are not carried.
4. Print wording carried into unsigned `NOVEL: needs sign-off` blocks keeps the markers. Signed spans take
   print's language under decision 1 (precedent: U07-3, ch15-001, ch16-001 of October 14).

The rules of October 18 (the October 18 carry):
- This edition is the companion. Check digits, set-up details, training settings, printed samples and
  derivations that print moved to its Companion Experiments stay with this edition's cells.
- Figures, tables, boxes and sections stay, with the sentences that point to them. A print edit that only
  replaces a figure or table this edition keeps, or that a print-only figure justifies, is not carried.

Standing print-only categories: listings and listing notes; print's prose stand-ins for code cells;
companion lists and Companion Experiment tags; grey-figure wording; TikZ figures and their captions; and
layout (floats, `\FloatBarrier`, line breaks). `\chapref`, `\secref` and the like become `@` references or
links, `\cite` becomes a link on the authors' names, and `\expect` becomes `\E`.

New in this carry:
- **Kept passages take the beta-reader wording.** Where this edition keeps a passage that print's density
  pass later compressed, moved or deleted, the passage takes the beta readers' wording, the print text just
  before the October 18 passes. This applies in Chapter 10 (ch10-b04, -b08, -b10, -b13) and Chapter 12
  (ch12-o19-12, -24, -35, -42). A later carry that compares the master with this edition will find these
  passages in no current print form; this is why.
- **Earlier rulings revisited.** Where an earlier ruling rested on a premise this carry found false, or on a
  reason a later decision removed, the entry says so:
  - ch01-o19-40 reverses the October 5 ruling on the bias-variance set-up (print now states the procedure in
    the body), and ch03-b17-04 reverses part of the October 5 decision ch03-author-02 (the XOR set-up).
  - ch05-oct19-47 carries the sigmoid-derivative display held on October 8 only because a replay pinned it.
  - ch06-o19-50 to -52 carry the October 8 holds pol-14, pol-15 and rev-05, held only for NOVEL status or a
    fixture literal; ch11-o19-18 closes the paragraph part of the October 8 hold ch11-rev14-04.
  - ch04-d19-16 brings in "averaging coefficients", which the October 18 record listed as absent here;
    ch07-d7-01 carries density row D7-01, with ch07-b17-11 (the October 18 record carried nothing for
    Chapter 7).
  - D10-16 is now partly carried (ch10-d16); the October 18 record kept it whole.
  - ch16-o19-04 and -27 carry D16-28's caption sentence and its prose pointer. The October 14 ruling
    (ch16-012) assumed the minibatch losses appear in no output of this edition, but both training cells
    have printed the 250-step log since July (`3977a52`). ch16-o19-15 carries D16-02's closing sentence.
  - D19-02's shared sentence and D19-20's lead-in are now carried (ch19-o19-01, -19), and Exercise 3 points
    to `fig-fashion-rematch` (ch19-o19-23), superseding the October 14 note ch19-029.
  - D22-12 is kept for structure (ch22-r18-15); the October 18 record's "not in this edition" was
    inaccurate.

## The review corrections of October 19

These went into the worktree first, as uncommitted changes; the gap pass then found them in place and
recorded them as "already" (ch08-o19-11, ch10-r01, ch12-o19-15, ch16-o19-05).

- **Chapter 10** (`09-modern-cnns-transfer.qmd`, the full-data scorecard): the four full-data variants are
  named with their parameter counts, which match the run records
  (`experiments/rivanna/results/scorecard/*.json`, `parameter_count`, all three seeds): a LeNet with 16 and 32
  channels, 202,738; a NiN of three blocks, 76,698; a VGG of three two-convolution blocks with a
  global-average-pooling head, 288,170; a residual network of nine blocks, 1,084,010.
- **Chapter 12** (`10-sequences-rnn.qmd`, the vanishing-gradient paragraph): to preserve gradients over many
  steps, the cumulative Jacobian product must remain well scaled along the relevant directions, and near-unit
  gains at the individual steps are one way to achieve this.
- **Chapter 16** (`14-self-attention-transformer.qmd`):
  - the positional-encoding section states the initializer behind the $\sqrt d$ scaling: with token
    embeddings at coordinate standard deviation $1/\sqrt d$, as in the book-corpus experiment (print's
    Companion Experiment 16.H, linked here as `#the-book-reads-itself-again`), the scaled embedding's norm,
    about $\sqrt d$, is comparable to the positional vector's $\sqrt{d/2}$;
  - the rank-collapse box: the convex-hull statement holds per head, the output projection can move the
    result outside the hull of the original values, "A shared position-wise FFN cannot restore distinctions
    once token representations are identical.", and the cited result holds under its stated assumptions;
  - the Dong, Cordonnier, and Loukas Sources entry is qualified in the same way.
- **The Part IV page** (`parts/p4-attention.qmd`): the long sentence is split in two. The page now has 18
  sentences, so the book contract's part-page cap rises from 17 to 18 (`scripts/audit_book_contract.py`).
- **Chapter 8** (`07-filters-convolution.qmd`, print Listing 8.1): the `manual-conv` cell's `conv2d` ends
  with `[0, 0]` in place of `.squeeze()`, so a 1×1 output stays a 1×1 map. This is the carry's one code
  change. On the printed test the result is identical, so the printed output is unchanged.
- **Not carried as corrections.** Chapters 4 and 6 had no counterpart of the corrected sentences at the
  branch base. The gap pass then brought both sentences in from the current master, so they arrive in their
  corrected form: $\E[\vect{m}^{(1)}]$ is one tenth of the expected gradient (ch04-d19-16), and "The shift
  experiment exposes a mismatch between pixel distance and the tolerance the task requires." (ch06-o19-42).
  The reflow of Listing 15.1 is print layout.

## Outcomes

698 entries in 24 units. Outcomes:
- **applied**: print's wording is carried, adapted to this edition's labels, links and macros where needed;
- **partly**: part is carried and the rest is held under a named rule;
- **already**: the change was here before this pass (PR #29, the notation commit `1a9b356`, the worktree's
  October 19 port, or this edition's own wording);
- **not-carried**: a standing rule or an earlier ruling keeps it out, or the change is not in the print master
  (part1-part-07, ch07-r19-w1); the entry names the reason;
- **needs-author**: the rules do not settle it (listed below).

| Unit | File | Entries | Applied | Partly | Already | Not carried | Needs author |
|---|---|---|---|---|---|---|---|
| Part I page | `parts/p1-lines-to-networks.qmd` | 7 | 6 | 0 | 0 | 1 | 0 |
| Chapter 1 | `part1/01-linear-regression.qmd` | 55 | 47 | 2 | 0 | 6 | 0 |
| Chapter 2 | `part1/02-logistic-softmax.qmd` | 31 | 26 | 0 | 1 | 4 | 0 |
| Chapter 3 | `part1/03-nonlinearity-mlp.qmd` | 28 | 20 | 4 | 0 | 4 | 0 |
| Chapter 4 | `part1/04-training-loss-sgd.qmd` | 36 | 26 | 1 | 1 | 5 | 3 |
| Chapter 5 | `part1/05-backpropagation.qmd` | 50 | 34 | 2 | 1 | 9 | 4 |
| Chapter 6 | `part1/06-generalization-inductive-bias.qmd` | 53 | 45 | 1 | 4 | 3 | 0 |
| Chapter 7 | `interludes/learning-by-experiment.qmd` | 45 | 37 | 1 | 3 | 4 | 0 |
| Chapter 8 | `part2/07-filters-convolution.qmd` | 18 | 10 | 0 | 2 | 5 | 1 |
| Chapter 9 | `part2/08-cnn.qmd` | 35 | 18 | 0 | 6 | 11 | 0 |
| Chapter 10 | `part2/09-modern-cnns-transfer.qmd` | 27 | 15 | 2 | 3 | 6 | 1 |
| Chapter 11 | `interludes/making-pca-learnable.qmd` | 35 | 19 | 2 | 1 | 10 | 3 |
| Chapter 12 | `part3/10-sequences-rnn.qmd` | 55 | 25 | 4 | 9 | 17 | 0 |
| Chapter 13 | `part3/11-encoder-decoder.qmd` | 42 | 16 | 8 | 4 | 14 | 0 |
| Chapter 14 | `part4/12-kernel-regression.qmd` | 25 | 17 | 2 | 0 | 4 | 2 |
| Chapter 15 | `part4/13-attention.qmd` | 6 | 1 | 0 | 2 | 3 | 0 |
| Chapter 16 | `part4/14-self-attention-transformer.qmd` | 35 | 9 | 1 | 7 | 18 | 0 |
| Chapter 17 | `interludes/attention-as-test-time-regression.qmd` | 4 | 0 | 0 | 1 | 3 | 0 |
| Chapter 18 | `part4/15-bert-pretraining.qmd` | 24 | 6 | 2 | 4 | 12 | 0 |
| Chapter 19 | `part4/16-vit-scaling.qmd` | 24 | 4 | 2 | 5 | 13 | 0 |
| Chapter 20 | `part5/17-peft-quantization.qmd` | 20 | 3 | 0 | 5 | 12 | 0 |
| Chapter 21 | `part5/18-alignment.qmd` | 9 | 1 | 0 | 3 | 5 | 0 |
| Chapter 22 | `part5/19-generative.qmd` | 27 | 9 | 1 | 4 | 13 | 0 |
| Chapter 23 | `part5/20-multimodal.qmd` | 7 | 0 | 0 | 4 | 3 | 0 |
| **All** | | **698** | **394** | **35** | **70** | **185** | **14** |

Two chapter files are unchanged: Chapter 17 (`attention-as-test-time-regression.qmd`) and Chapter 23
(`20-multimodal.qmd`). The carry changes 21 chapter files and the Part I and Part IV pages.

## Needs the author (14 entries)

1. **ch04-d19-34, Chapter 4, the paragraph after `fig-race`.** Print's new numeric middle ("After about 40
   steps, both reach the floor ... the least-squares solution itself has loss 0.0103 ... (Companion
   Experiment 4.C prints the losses). Plain SGD ends at 2.3 ... only 1.33 of the true 3.0") is held. This
   edition's `fig-race` cell only plots, so the numbers need print lines in the cell: a code change and a
   re-render, after which the momentum-memory computed variant ("prints no iterate") needs a refresh too. A
   re-run of the unchanged cell gives least-squares loss 0.010281, SGD 2.3001 and first weight 1.3272. "After
   about 40 steps, both" holds for Adam only (1.03 times the floor at step 40); momentum is 13 times the floor
   at step 40 and first within twice it at step 49, so print needs correcting as well.
2. **ch04-d19-35, Chapter 4, the estimator lead.** "Three cases cover the ones in this book, and a small
   example shows each." Case 1 has no example; only Cases 2 and 3 do. Print reads the same, so the fix
   belongs in print ("a small example shows the last two", or a one-line Case 1 example), and this edition
   then follows.
3. **ch04-d19-36, Chapter 4 against other chapters.** The estimator cases are now "an average of
   per-example losses", "a nonlinear function of an average" and "an objective defined by the batch".
   Appendix E (`a5-statistical-learning.qmd`), Chapter 22 (`19-generative.qmd`) and the batch-vote panel keep
   the older names, in both editions. The case numbers still resolve. For a print alignment pass.
4. **ch05-oct19-46, Chapter 5 code.** "Sensitivity" remains in code readers see: the comments
   `# layer-2 sensitivity  (4,)` (cell `outer-product-gradient`) and `# eqs. 3 & 4: sensitivity out x
   signal in` (`backprop-by-hand`), both with `code-fold: false`, and the code summary "Code: propagate the
   sensitivities" (`sensitivity-values`). The `fig-init` legend reads sqrt(2/n) against the caption's $D$,
   and the `fig-gates` panel titles and the "derivative gates" Plan step keep older terms. A carry changes no
   code. Suggested: the comments "layer-2 loss derivative" and "loss derivative out x signal in" (stdout
   unchanged) and the legend sqrt(2/D) (the figure changes), then a refreeze. The cell label
   `sensitivity-values` is an anchor and stays.
5. **ch05-oct19-48, Chapter 5, the ReLU sentence.** The carried "ReLU sets about half of its inputs to zero
   and so halves the mean square." switches from variance to mean square. Print justifies the switch only in
   its $\sigma_w$ paragraph, which this edition holds (U04-3). Either carry print's two bridging sentences ("A
   ReLU output is not zero-mean. With zero-mean weights, the rule above still holds with the mean square
   $\E[x^2]$ in place of $\var(x)$."), or record the gap as a divergence.
6. **ch05-oct19-49, Chapter 5 panels.** The derivative-gates panel ("backward sensitivity", "local
   sensitivity", "filled area = sensitivity", "Sensitivity peaks at z = 0") and the one-chain panel ("the
   loss and its sensitivities") keep the term the chapter dropped. The panels stay under the October 16
   rule.
7. **ch05-oct19-50, Chapter 5, both editions.** *Jacobians* is italicized as a definition at the product
   bound, but the VJP sentence uses the term earlier; and the cost sentence ("For an $n\times k$ input and an
   $m\times k$ weight ... $2nmk$") keeps its own symbols after the $D_{\text{in}}$, $D_{\text{out}}$ pass.
   Faithful to print; reported for print.
8. **ch08-o19-18, Chapter 8, the Sobel columns.** Print's "stays dark along its top and bottom" would
   contradict the figure and the sobel-split replay. The response maps are signed and shown in grey on an
   automatic scale, so a zero response is mid-grey like the background, and the dark stripe is the
   rectangle's right side (about −3.6); the panel says so (`interactives/sobel-split/panel.html:50`). This
   edition keeps its sentence. Recommended for both editions: "stays silent along its top and bottom" (or
   "gives zero along its top and bottom"); the sobel-split literal would follow.
9. **ch10-d16-recipe, Chapter 10, the full-data transfer recipe.** Print's density pass deleted the recipe
   footnote and now says "Companion Experiment 10.I holds the recipe", but this edition's Experiment 10.I
   (`transfer-full-summary`) only loads the nine records, and no version of this chapter stated the recipe
   (the October 8 ruling ch10-sweep-14 kept it print-only). It is now in neither edition's text, only in
   `experiments/rivanna/fashion_transfer.py`. Either adjust print's pointer, or add the beta-stage footnote
   here on the D10-16 sentence (a re-render):
   "In each regime, we train for 12 epochs with AdamW in minibatches of 128, with weight decay $10^{-4}$ and
   a learning rate annealed to zero along a cosine from $3 \times 10^{-3}$ for the probe, $3 \times 10^{-4}$
   for fine-tuning and $10^{-3}$ for training from scratch. We resize each training image to 232 pixels,
   crop it at random to 224, flip it horizontally at random, repeat it across three channels and normalize
   it with ImageNet's channel statistics. We resize validation and test images to 224 without cropping or
   flipping."
10. **ch11-o19-03, Chapter 11, `fig-fixed-code-bridge`.** Print moved the figure to the closing section
    "From fixed-size inputs to sequences". Here its cell is the chapter's first cell and also holds the
    notebook-support setup (`cell_ordinal: 1`), the N12 span and the `aefig` alias, so the move would move
    code. The figure stays in the opener. The beta reader's mark on p. 164 bears on it: the "short sequence"
    and "long sequence" labels read as out of place in an opening that no longer discusses variable-length
    data.
11. **ch11-o19-10, Chapter 11, a note title.** Print retitled "Same subspace, not the same coordinates" to
    "Same subspace, different coordinates". The same-subspace panel's intro quotes the old title
    (`interactives/same-subspace/panel.html:15`) and its scene test requires it, so retitling means changing
    panel text. The title stays.
12. **ch11-o19-28, Chapter 11, the transposed-convolution size rule.** A beta-reader addition (p. 172): the
    output size $s(m-1)-2p+K_h$, and why the kernel is 4×4 (7, 14, 28 against 7, 13, 25). Print puts it in
    its layer-by-layer paragraph, which stands in for code and is print-only here. Placing it needs a
    lead-in; suggested place: after the shape table.
13. **ch14-1018-04, Chapter 14, section order.** Print moved "Similarity weights and local prediction" (with
    its trap box and listing) before "Linear regression as a weighted combination of targets", and the OLS
    comparison and the "Which kernels" note now follow the linear-regression section. This edition keeps its
    order, carries the wording in place and adapts the cross-references. The swap would move no code cell
    relative to another; the kernel-weighting replay would move with its section.
14. **ch14-1018-25, Chapter 14, Plan step and code summary.** After print's retitle of Experiment 14.B,
    Plan step 2 and the code summary of `ols-versus-kernel-weights` would read "Signed OLS coefficients
    versus nonnegative kernel weights" (the October 14 precedent ch14-009 changed both together). The code
    summary is a cell option inside the code cell, which a carry leaves alone, and changing the Plan step
    alone would split the pair. The printed label "OLS weights:" and the variable `ols_weights` are code and
    stay.

## Replays

Under decision 1 of October 16 the wording reaches sentences a replay quotes, and only the check strings
follow. No panel, player, timeline or visual changed, and no anchor or computed variant changed.

| Scene | Chapter | Manifest literals | Scene-test strings |
|---|---|---|---|
| decay-angle | 1 | 1 | 1 (`test_decay_angle_excerpt.cjs`) |
| template-score | 1 | 1 | 0 |
| column-space | 1 | 2 | 0 |
| downhill-bowl | 1 | 1 | 1 (`test_downhill_bowl_excerpt.cjs`) |
| sigmoid-squash | 2 | 1 | 2 (`test_sigmoid_squash_excerpt.cjs`) |
| hinge-lift | 3 | 2 | 2 (`test_hinge_lift_excerpt.cjs`) |
| feature-space | 3 | 3 | 1 (`test_feature_space_excerpt.cjs`) |
| momentum-memory | 4 | 1 | 2 (`test_momentum_memory_excerpt.cjs`) |
| step-length | 4 | 3 | 4 (`test_step_length_excerpt.cjs`) |
| batch-vote | 4 | 1 | 1 (`test_batch_vote_excerpt.cjs`) |
| one-chain | 5 | 1 | 0 |
| derivative-gates | 5 | 3 | 0 |
| shift-shuffle | 6 | 1 | 0 |
| distance-band | 6 | 3 | 0 |
| halving-budget | 7 | 2 | 2 (`test_halving_budget_excerpt.cjs`) |
| box-average | 8 | 1 | 0 |
| pooling-bins | 9 | 1 | 0 |
| pixel-skewer | 10 | 0 | 1 (`test_excerpt_checks.cjs`) |
| same-subspace | 11 | 2 | 1 (`test_same_subspace_excerpt.cjs`) |
| detach-cut | 12 | 3 | 1 (`test_detach_cut_excerpt.cjs`) |
| gate-product | 12 | 1 | 2 (`test_gate_product_excerpt.cjs`) |
| lstm-valves | 12 | 3 | 0 |
| greedy-tree | 13 | 0 | 1 (`test_greedy_tree_excerpt.cjs`) |
| **23 scenes** | | **37 (21 scenes)** | **22 (14 files)** |

- Each new literal is a verbatim substring of its chapter, occurs there once, and comes from the carried
  sentence that makes the old literal's claim. Where the carried sentence grew, the literal keeps the part
  that carries that claim; where the claim needed more, the literal grew (decay-angle, sigmoid-squash,
  detach-cut literal 3, derivative-gates, halving-budget).
- Two halving-budget pins changed. One, the `indexOf` order check at line 268, would have passed vacuously
  (−1) after the carry; the other, an `includes()` check at line 41, would have failed.
- `scripts/refresh_excerpt_receipts.py` refreshed 54 chapter-digest rows in the receipts under `docs/`.
  Receipt prose was not edited, as on October 14.
- The six sentences kept for the animations on October 14 are intact, byte for byte: the momentum range
  $\beta \in [0.9, 0.99]$ (momentum-memory), "region of confusion" (sgd-zones, all five occurrences), "BN needs
  real batches ... unreliable at tiny batch sizes" (batch-ruler), "contiguous chunks of roughly 20–50 steps"
  (detach-cut), the tail of the `fig-highway-time` caption (gate-product; only the joint before it changed,
  from a semicolon to ", and"), and the attention display (both-axes).

### Panels and receipts left for the author

The checks pass, but in these places a panel or receipt still says what the carried chapter no longer says.
Under the October 16 decision the panels stay.
- **decay-angle keeps a boundary the chapter dropped.** The chapter's "This radial shrink limits scale and
  can preserve angular responsiveness in a large layer; it does not by itself explain or cure stalled
  training." is now "The first factor shrinks $\vect{w}$ along its own direction. A shorter weight vector
  turns further under the same nudge, so the shrink keeps later updates able to change the weight's
  direction." The panel's closing caption ("A radial shrink restores steering. It does not by itself explain
  or cure stalled training.") and its scope still state the boundary, and no chapter sentence does.
- **Symbols.** The chapter writes the angle as $\varphi$: the template-score panel's identity
  (`panel.html:46`, `\cos\theta`) and its player labels ("θ 20.0°", "cos θ") still use $\theta$, and the
  decay-angle panel's equation (`panel.html:42`) still writes $\Delta\theta$ against the chapter's
  $\Delta\varphi$. The score-field panel (`panel.html:24`) writes $s^2$ where Chapter 22 now writes
  $\sigma^2$. These join the five panels the October 18 record lists (momentum-memory, step-length,
  gate-product, identity-lane, quantization-grid), which are unchanged.
- **Paraphrases.** The hinge-lift panel's scope quotes "a hard linear boundary can classify at most three of
  the four points" as the chapter's words; the chapter now says "At best, a line classifies three of the
  four points correctly (75%)." (The quote was not verbatim before this carry either.) The batch-vote
  panel's scope calls $B$ "a compute-and-noise dial, not a correctness dial" as Case 1 says; Case 1 now says
  that changing $B$ "changes only the noise and the cost of each step". The substance agrees.
- **Terms.** The derivative-gates and one-chain panels keep "sensitivity" (ch05-oct19-49).
- **A source comment.** The HTML comment at the top of `interactives/sigmoid-squash/panel.html` quotes the
  old sentence "the decision boundary $\hat{p} = \tfrac{1}{2}$ is exactly $o = 0$". Readers do not see it.
- **Receipt prose** still quotes the earlier wording in `docs/` for decay-angle, template-score,
  column-space, sigmoid-squash, feature-space, momentum-memory, step-length, batch-vote, halving-budget and
  detach-cut (each `<scene>-excerpt.md`), downhill-bowl (line 57, which already quoted an older sentence),
  box-average (lines 59 and 60), sobel-split (lines 16 to 18), lstm-valves and pooling-bins
  (`wave2-excerpts.md`, line 121 for pooling-bins) and one-chain (`wave1-excerpts.md`, line 326).

## Other points for the author

These are not entries of this carry; the porters and reviewers found them on the way.
- **Print errata.**
  - Chapter 7: the beta edit "Both estimands ... are expectations over the seed" is false for
    $\Delta_{\mathrm{tuned}}$, a difference of maxima of seed expectations. This edition keeps "are built from
    expectations over the seed" (ch07-b17-27); suggested print fix: the same words.
  - Chapter 3: the moons footnote names the angle $\vartheta$, but its formulas still read $(\cos t, \sin t)$.
  - Chapter 13: the first note of `lst-seq2seq` still reads `encode(S,\ lengths)`, and the Description of
    `fig-seq2seq-batch` says "sources S" while its TikZ title reads "sources X".
- **Code, for a later code pass** (a carry changes no code): the Chapter 5 comments (item 4 above); the
  Chapter 13 comment `# ground-truth prefixes: one fused call`, where the carried recap now says "a single
  call"; and two figure-cell strings in Chapter 16 (`fig-self-attention-read`, `fig-causal-multihead`) with
  the invalid escape `\m`, from the notation commit `1a9b356`. `audit_python_sources.py` reports a
  SyntaxWarning for each and passes; `warning: false` keeps them out of the freeze. Making both strings raw
  fixes them, with a re-render.
- **The scratch branch `review-2026-10-19`.** The pre-submission review's other proposals (the Part I page's
  "hinges, simple bent functions such as $\max(0,z)$" and "multilayer network", Chapters 6, 7, 11, 12 and 14)
  are not in the print master, so nothing from them is carried. If they reach the master, a later carry
  follows; for Chapter 7 that means the BatchNorm sentence (ch07-b17-09) and the opening paragraph.
- **Judgment calls the author may reverse.**
  - Chapter 16: ch16-o19-35 takes a caption wording from print's overlay figure ("The two panels at
    right show"); revert it if overlay captions count as print-only. ch16-o19-29: print's compressed
    sample-reading paragraph drops a hedge this edition keeps; its last sentence does not depend on the
    samples.
  - Chapter 22: the `fig-gan-finite` caption no longer names the generator `q` (ch22-r19-gan-caption, a
    caption-only notation fix); revert that one line if the earlier caption is preferred.
  - Chapter 7: with D7-01 the reopen explanation is gone here too; keeping one would be a recorded
    divergence.
  - Chapter 13: the "index 17" example stays (U08-5), though print deleted it.
- **Older gaps, unchanged by this carry.**
  - Chapter 17: print's closing paragraph of the mechanism test gives the paired-difference standard
    deviations (0.156, 0.065) and the light-load cost (0.471 against 0.988); this edition's prose gives
    neither (the cell prints the deviations).
  - Chapter 20: print says outright that 0.710, 0.472 and 0.142 are means over the five initializations;
    here the next sentence implies it (the phrase comes with print's table removal D20-16, not carried).
  - Chapter 11: the denoising rewrite dropped the only prose sentence that named the "input–target
    contract", which Plan step 3, a code summary, a figure banner and a caption still use (print has the
    same gap). The 9^d box, the anomaly sentence, the sparse paragraph, the U-Net material and Exercise 7
    stay held (U07-4).
  - Chapter 21: a padded toy row is longer than $P+T$; print's sentence has the same looseness.

## Checks

- **Code.** A cell-by-cell comparison with the branch base finds one changed code line (Chapter 8's
  `manual-conv`, the October 19 correction). Every other cell differs, if at all, only in its `fig-cap` or
  `fig-alt` option. The book-corpus benchmark (`data/book-corpus-ch1-9.txt`) is unchanged.
- **Replays.** `audit_excerpt_fixtures.py` passes (53 scenes, 358 literals, 22 chapters, 47 receipts; 89
  violations before the central update). `npm test --prefix scripts/html-tests` passes 2512 of 2512 tests
  (21 failed before). The independent check confirmed that each of the 37 old literals is absent from its
  chapter, each new literal occurs once, the anchors and computed variants are byte-identical to the branch
  base, every after-paragraph anchor still names the same paragraph, every replaced test pin matched the
  branch base and would fail on the carried chapter while its replacement matches the chapter once, and no
  other pin in `scripts/test_*.cjs` now misses.
- **Audits.** Each unit ran the typed-number, book-contract, public-anchor, Plan → Code, Python-source and
  independence (`--warn`) audits after its edits, and again after its fixes where a fix pass ran; all pass.
  The Python-source audit reports the two Chapter 16 SyntaxWarnings above. Where it was run (Chapters 3, 6,
  9 and 14), `audit_voice_invariants.py --base HEAD` flags only what a carry is expected to change (math,
  numbers, links, exercises, Sources) and finds the code cells unchanged.
- **Renders.** Every changed chapter with a freeze (21) was re-rendered on the reference machine (the M1
  MacBook Air, 4 threads, Quarto 1.10.18), with no `--to` flag, and `audit_frozen_stdout.py` finds every
  frozen stdout block byte-identical to the branch base (`e5e906b`).

The carry's diff shows the old and new text of every applied change; the tables below give each entry's
outcome and reason.

## Entries by chapter

### Part I page (`parts/p1-lines-to-networks.qmd`)

No print backup was taken between the October 14 carry and the author's rewrite of the page on October 18
(afternoon). The October 14 carry had left the page identical to print, so the page was compared with print
directly. It now matches print word for word (7 sentences). The new "nearly thirty points" agrees with
Chapter 6's frozen output (76.0% clean, 46.5% after the shift). Outcomes: applied 6, not carried 1.

| Entry | Print change | Outcome | Reason |
|---|---|---|---|
| `part1-part-01` | Part I page, paragraph sentence 2: 'At first, the features are given' became 'In the first two chapters the features are given' | applied | New print wording (Oct 18 afternoon, unrecorded). Chapters 1 and 2 are the first two chapters in this edition too, and print uses words rather than \chapref, so the words stay (audit_typed_numbers passes). |
| `part1-part-02` | Part I page, sentences 3-4 merged: 'with hinges keeps the stack from collapsing into one linear map and makes the intermediate representations learnable: within each activation region the network applies an affine map, and every region's map comes from the same shared parameters' (drops 'simple', 'flat map', 'The network becomes a piecewise-linear function', and 'a linear map plus a constant') | applied | New print wording; the HTML matched print at the Oct 14 carry, so the difference is a print change. |
| `part1-part-03` | Part I page: 'Stochastic gradient descent moves the parameters, and backpropagation computes how a small change in each parameter would affect the loss' became 'moves those parameters downhill on the loss, and backpropagation computes the gradient it needs' | applied | New print wording. |
| `part1-part-04` | Part I page: 'That flexibility is real, but it carries no knowledge of the world by itself. When a well-fit MLP shows a sharp decrease in accuracy after a two-pixel shift, ...' became 'The flexibility is real, but it carries no knowledge of the world: a well-fitted MLP loses nearly thirty points of accuracy when its validation images are shifted two pixels to the right.' | applied | New print wording. The number matches this edition: Chapter 6's shift-experiment freeze prints 76.0% clean and 46.5% shifted, a drop of 29.5 points, and its prose shifts the images two pixels to the right. |
| `part1-part-05` | Part I page: new sentence 'An interlude on experimental method sets the protocol under which that claim, and every later comparison, is made.' | applied | New print sentence. In this edition the interlude (@sec-learning-by-experiment) comes right after Part I's chapters, so the sentence still holds. Print has no \chapref, so no @-reference was added. |
| `part1-part-06` | Part I page, closing: 'the failure points to the next move: build trusted structure into the architecture' became 'The failure itself points to the next move: build what we know about the data into the architecture.' | applied | New print wording. The HTML paragraph now matches print word for word: 7 sentences (contract 4-18), no em dashes. |
| `part1-part-07` | The Oct 19 review diff (review-2026-10-19/review-parts-macros-figures.diff) proposes 'hinges, simple bent functions such as \(\max(0,z)\),' and 'a well-fitted multilayer network' for the Part I page | not-carried | Neither edit is in the print master: part1/part.tex was last modified 2026-10-18 14:44, and the same diff's other part-page wording hunks are also absent. Print leads, so the master text was carried. If the author applies that hunk later, carry it then. |

### Chapter 1 (`part1/01-linear-regression.qmd`)

Baseline: the backup of October 17 14:24, taken before the beta readers' edits to Chapters 1 to 3. The delta
holds both beta-reader rounds of October 17 and the angle rename $\theta \to \varphi$. The chapter had no
rules or density rows. Outcomes: applied 47, partly 2, not carried 6.

| Entry | Print change | Outcome | Reason |
|---|---|---|---|
| `ch01-o19-01` | Chapter opener rewritten (functions fitted to data; three components; two methods, gradient descent written twice), qmd lines 7-13 | applied | Beta-reader edit to a sentence group this edition shares; carried word for word. |
| `ch01-o19-02` | Learning from examples: 'the output observed for that input, called the *target* or the *supervision signal*'; 'n examples down' | applied | Shared wording. The HTML colour legends 'blue'/'purple' are kept (D7; grey wording is print-only). |
| `ch01-o19-03` | fig-data-matrix caption: 'per desired output' -> 'per observed target' | applied | Shared caption wording. The HTML's colour sentence is kept. |
| `ch01-o19-04` | Generalization paragraph: training pairs as independent draws from a fixed unknown P over input-target pairs | applied | Shared paragraph. input--target is written as an en-dash compound. |
| `ch01-o19-05` | Risk paragraph: theta 'is the vector of all the model's adjustable parameters'; population risk as expected loss on a fresh pair; deployment distribution Q example; closing pointers | applied | Shared. \Chapref/\appref became @sec-06-generalization-inductive-bias and @sec-a5-statistical-learning. |
| `ch01-o19-06` | Three-tasks callout: 'This chapter covers regression, and ...' | applied | Shared sentence. |
| `ch01-o19-07` | Why is this hard: new lead, both bullets rewritten (y = x^2 example; memorization split), 'more data ... structure of the problem' | applied | Shared sentences. |
| `ch01-o19-08` | Parameterization: 'a vector w of adjustable parameters, the theta of the risks above'; Learning/Inference split | applied | Shared sentences. |
| `ch01-o19-09` | Dot-product lead: '@fig-linear-response draws the first term and shows the principle behind it'; angle theta -> varphi in the prose and the cos display | applied | Shared, replay-quoted sentence. The pinned bold literal is untouched. The template-score cos literal needs the central change. The panel keeps theta (open for the author). |
| `ch01-o19-10` | Bias-augmentation footnote: 'anchors the hyperplane to the origin. Every model adjustment then rotates or rescales one weight vector about the origin, with no separate translation.' | applied | Shared footnote. |
| `ch01-o19-11` | Residual paragraph: 'turns them into one number, the objective that training minimizes'; the ML section 'explains why squared error is a principled choice' | applied | Shared. 'dark red' is kept. \Secref became a link to #why-squared-error-the-maximum-likelihood-view. |
| `ch01-o19-12` | Loss-landscape paragraph rewritten with the pointer '\Figref{fig-gd-path}a ... draws its contour lines' | applied | Shared, replay-quoted. This edition's two-view figure has no panel letters, so the pointer reads 'draws it as a surface and as contour lines'. The downhill-bowl literal and its test copy need the central change. |
| `ch01-o19-13` | Normal-equations lead drops ', which is why X^T appears on both sides' | applied | Shared sentence. |
| `ch01-o19-14` | 'The normal equations characterize the minimizer. To compute it, we do not form ... (Implementation 1 below).' | applied | Shared paragraph. |
| `ch01-o19-15` | Overparameterization sentence split; footnote 'You can skip these details without losing the conceptual thread.' | applied | Shared. The column-space test regex on 'First, forming ...' still matches. |
| `ch01-o19-16` | 'Even if direct inversion ...' paragraph: two readings named (features vs training targets, attention in Part IV) | applied | Shared paragraph. |
| `ch01-o19-17` | Two sides: new lead defining the columns X_{:j} | applied | Shared paragraph. |
| `ch01-o19-18` | Column-space paragraph: 'It therefore lies in', 'closest point ... dropping a perpendicular', 'No adjustment of the weights can shorten it further.' | applied | Shared, replay-quoted. Two column-space literals need the central change. |
| `ch01-o19-19` | fig-projection caption: '; the residual' -> '. The residual' | applied | Shared caption. |
| `ch01-o19-20` | Hat-matrix passage reordered: pseudoinverse first, w-hat = X^+ y, y-hat = X X^+ y, 'Entry i of the product is one fitted value:', then 'Read this way' | applied | A reordering inside one subsection, not a structural move, so it is carried in print's order. |
| `ch01-o19-21` | Dual perspective: column-space reading vs hat-matrix reading; the weight on y_j is the inner product ... | applied | Shared paragraph. The footnote is unchanged. |
| `ch01-o19-22` | gd-path setup: 'Companion Experiment 1.A draws the same surface in three dimensions.' | not-carried | A Companion pointer in a print-only setup paragraph (ch01-013). This edition's figure already shows the 3-D surface. |
| `ch01-o19-23` | fig-gd-path caption punctuation and 'The learning rate stays fixed, so' | not-carried | Print's own two-panel figure caption. This edition has a different figure and caption. |
| `ch01-o19-24` | 'we will not even evaluate the loss on every example at each step' | applied | Shared sentence. |
| `ch01-o19-25` | Build-three-ways lead rewritten ('The 60-point problem above ...', Implementations 1-3 named, 'We then check whether the three computations give the same estimate.') | applied | Shared paragraph. Fix pass: the carry record now says that '60-point' is not an orphaned print-only reference. No prose here says 60, but the number is visible in the fig-gd-path cell (torch.randn(60)) and in the downhill-bowl panel's scope text ('the figure's sixty points'). |
| `ch01-o19-26` | Coding-hygiene tip: 'short teaching examples that expose the mechanism and the checks behind each claim'; listings sentence | partly | The wording is carried onto 'The cells in this book'. The listings sentence is print-only. |
| `ch01-o19-27` | Data-setup paragraph ('The code listings in this section ...', 'data matrix') | not-carried | Print-only listing setup (ch01-sweep-01). This edition shows the data cell. |
| `ch01-o19-28` | Implementation 1 lead: 'First append a column of ones ... (\secref). Then call the least-squares routine (\lstref).' | applied | \secref became a link to #the-linear-model-and-its-geometry. The \lstref is print-only, and the cell follows. |
| `ch01-o19-29` | \FloatBarrier before Implementations 2 and 3; listing float [!htbp] | not-carried | Layout is print-only. |
| `ch01-o19-30` | Implementation 2 lead: 'moves both parameters against the gradient of eq-gd-grad, which we derived by hand'; drops the 'before automatic differentiation' sentence | applied | Carried into this edition's class framing. The listing sentence and the companion footnote are print-only. |
| `ch01-o19-31` | Listing notes of lst-gd-scratch and lst-nn-linear (semicolons split) | not-carried | Listing notes are print-only. |
| `ch01-o19-32` | Framework-preview note: 'Until then, the manual loop of \lstref shows what the three calls do.' | applied | Adapted to 'the manual implementation above shows what the three calls do'. |
| `ch01-o19-33` | fig-three-loss-paths caption rewritten | not-carried | Print's single-panel figure. This edition's three-panel figure has its own caption (ch01-018 precedent). Its 'X, not Y' sentence is flagged for the author only. |
| `ch01-o19-34` | Deleted 'They do not, by themselves, establish generalization.' | applied | Shared sentence, deleted as in print. |
| `ch01-o19-35` | Gaussian footnote: 'The assumption is a useful model, and its fit to the data should be checked.' | applied | Shared footnote. |
| `ch01-o19-36` | 'Independence makes the dataset likelihood the product of the per-example densities, prod p(...)' | applied | Shared. The log-likelihood display already matched print. |
| `ch01-o19-37` | 'we state how targets may vary around a prediction and take the negative log-likelihood' | applied | Shared sentence. |
| `ch01-o19-38` | fig-likelihood-loss caption: 'yield MSE, and Bernoulli ...' | applied | Shared caption. |
| `ch01-o19-39` | Loss-choice paragraph: sentence split; 'a modeling decision: we make it by choosing a distribution for the targets' | applied | Shared paragraph. |
| `ch01-o19-40` | Bias-variance opening rewritten with motivation and a three-step simulation list | applied | It replaces the shared sentences and is adapted to the Left/Middle panel names and colour legends. Its numbers match the cell. Fix pass: the record now states the reversal of the October 5 n/a for ch01-bias-variance-setup, for three reasons: the shared sentences were replaced, the cell is echo:false, and print, the source of D13, now states the procedure in the body. |
| `ch01-o19-41` | fig-bias-variance caption rewritten | applied | Carried into the cell's fig-cap with Left/Middle/Right, using a comma for a second colon. 'The green and gray arrows each span' is kept for print's 'Each arrow spans': in the cell the bias arrow runs from anchor_truth to prediction_mean, not ±1 sd. Print's caption is therefore wrong, and this is reported to the author. |
| `ch01-o19-42` | 'Now we formalize what the figure shows.' | applied | Shared sentence. |
| `ch01-o19-43` | New fresh-target sentences before eq-bias-variance; decomposition reset on two lines, lower-case labels | applied | The sentences and the display's content are carried: no conditioning or 'Expected squared error' underbrace, lower-case labels, \Bigl/\bigl, and \expect -> \E. Fix pass (review should-fix): print's two-row layout is print-only, and its first row held three terms, which overflows phone widths. This edition's four rows are restored, each break \\[4pt]. The wrapper and the label are kept. |
| `ch01-o19-44` | Variance sentence split ('... sampling noise). A complex model ...') | applied | Shared sentence. |
| `ch01-o19-45` | Splits paragraph broken into sentences | applied | Shared paragraph. |
| `ch01-o19-46` | Trap callout retitled 'Trap: treating the U-shaped curve as a universal law' and body rewritten (interpolation threshold defined) | applied | Shared callout. Callout titles carry no id. |
| `ch01-o19-47` | Regularization lead: 'We can already reduce variance with one change to the loss: a penalty on large weights.' | applied | Shared sentence. |
| `ch01-o19-48` | Decay footnote: Delta varphi; 'adds 2 lambda w to the gradient, so a gradient step becomes'; new closing two sentences | applied | Shared, replay-quoted. The pinned line breaks are kept. One decay-angle literal and one test pin need the central change. The panel keeps Delta theta. |
| `ch01-o19-49` | Ridge setup rewritten (n = 25, d = 20, 5 planted weights, OLS varies, sizable weights on the 15 null features) | applied | Shared paragraph. OLS is spelled out at first use. Print's planted-weights footnote is not carried, because the cell beside it states those values (ch01-sweep-02). |
| `ch01-o19-50` | Ridge result paragraphs (weight-MSE definition, 1.2347 -> 0.4400, single draw, Companion 1.C pointer, 'returns as weight decay') | partly | The result sentences are carried. Not carried: 'We compute ... with the routine of \lstref ...', which is prose standing in for the cell, and the Companion pointer. 'Rerun this cell' stays. |
| `ch01-o19-51` | Check yourself: 'lie in the column space of the data matrix' | applied | Shared item. |
| `ch01-o19-52` | Recap: neuron and activation defined before the identity-activation reframing | applied | Shared. The recap heading (decay-angle anchor) is unchanged. |
| `ch01-o19-53` | 'a sigmoid activation turns our regressor into a classifier' | applied | Shared sentence. |
| `ch01-o19-54` | Make-it-learnable tip: 'name its neural-network form: a neuron with the identity activation.' | applied | Shared tip. |
| `ch01-o19-55` | Exercise 1: '; then rearrange' -> '. Then rearrange' | applied | Shared. Rewrapped so that no indented line starts with '@eq-normal.' (typed-number audit). |

### Chapter 2 (`part1/02-logistic-softmax.qmd`)

Baseline: the October 17 14:24 backup. The delta holds both beta-reader rounds and the notation pass, whose
one Chapter 2 change was already here. Outcomes: applied 26, already 1, not carried 4.

| Entry | Print change | Outcome | Reason |
|---|---|---|---|
| `ch02-b17-01` | From regression to classification, paragraph 1: 'for each example. A classifier adds one operation after that score, and the linear map that produces the score stays the same.' | applied | Beta-reader wording for a sentence both editions share. |
| `ch02-b17-02` | Same section, paragraph 2 rewritten (Bernoulli draw, so the Gaussian noise model no longer applies; maximum likelihood gives a different loss, the cross-entropy); 'What we need is two things:' became 'We need two things:' | applied | Shared prose. |
| `ch02-b17-03` | Head paragraph after the two-item list ('The linear map that produces those raw scores is the model's head ... task-specific logits.') removed | applied | Paragraph removal, not a figure, box or section. The classification-head callout in the multiclass section still defines the head, and no fixture or link depends on the removed paragraph. |
| `ch02-b17-04` | New setup paragraph for fig-sigmoid ('@fig-sigmoid shows the sigmoid in two views ... at every point of the plane.') placed between the sigmoid-response Plan → Code panel and the fig-sigmoid cell | applied | It replaces print's old figure-citation sentence with an explanation of both panels, which answers the beta note ('explain the setting'). This edition shows the same figure, so the explanation applies here too. The sigmoid-squash anchor is after the cell, so it still holds. |
| `ch02-b17-05` | fig-sigmoid caption: 'and crosses 1/2', 'the inputs with score zero form the straight line', ', and the dashed contours', 'never bends' sentence dropped, 'Near the line ..., and far from it ...' | applied | The caption wording is shared and the code is unchanged. It breaks one sigmoid-squash test regex (listed in fixture_changes). |
| `ch02-b17-06` | Paragraph after fig-sigmoid rewritten ('The decision boundary is still a hyperplane. It is the set where p=1/2. Since sigma is increasing ... The sigmoid leaves the boundary flat and assigns probabilities on either side of it.') | applied | Under the Oct 16 rule, the print wording also reaches sentences a replay quotes. The fixture literal and a test regex change (listed in fixture_changes). The panel's 'monotone' and 'without ever moving it' agree with the new text. |
| `ch02-b17-07` | BCE derivation: 'If the labels $y_i \in \{0, 1\}$ are independent Bernoulli draws' | applied | Shared sentence. |
| `ch02-b17-08` | After eq-bce-grad: reordered sentence plus the parameter gradients (dL/dw = (p-y)x, dL/db = p-y) and the pointer to @eq-ce-grad | applied | Shared paragraph. I re-derived the math with the chain rule through o = w^T x + b. |
| `ch02-b17-09` | Classification-head callout: 'of the input', 'In this chapter the representation is the raw input itself ...', new sentence '@sec-03-nonlinearity-mlp adds layers that compute h from x.' | applied | Shared callout text. The backbone paragraph stays inside the callout under decision 3. |
| `ch02-b17-10` | Backbone paragraph: the semicolon before 'the head usually stays this small linear map' became a period | applied | Shared sentence. Only the punctuation changed, not the move. |
| `ch02-b17-11` | Relaxation callout, paragraph 1 rewritten (argmax and one-hot defined, 'This rule is hard', the max parenthesis moved to the end) | applied | Shared callout prose. |
| `ch02-b17-12` | Relaxation callout: 'Softmax plays two roles at once: its output is a proper categorical distribution ... that makes the model trainable.' | applied | Shared prose. |
| `ch02-b17-13` | Temperature paragraph: 'Every value in between gives a smooth output (@fig-soft-vs-hard).' | applied | Shared prose. I reflowed the paragraph so the cross-reference does not start a line. |
| `ch02-b17-14` | Relaxation callout, last paragraph: 'One such relaxation recurs in this book. A hard memory lookup ... an operation called *attention*.' | applied | Shared prose. The beta note said attention had not been introduced yet, and the new wording names it. |
| `ch02-b17-15` | fig-soft-vs-hard setup sentence: semicolon became ', and we evaluate softmax at ...' | not-carried | Print-only setup sentence that stands in for the soft-vs-hard-values cell; this edition never had it (precedent ch02-rule-002). |
| `ch02-b17-16` | After eq-ce-grad: the natural-parameter explanation now derives the gradient from log y_j = o_j - log sum e^{o_k} | applied | Shared paragraph. I re-checked the math: d(-log y_c)/do_j = -y_j + yhat_j. |
| `ch02-b17-17` | Information-theory callout opens with a definition of a code and of the best code length -log p_j, plus a parenthesis on the other meaning of 'code' in the autoencoder interlude | applied | Shared callout. \chapref became @sec-interlude-autoencoders (this edition's label). |
| `ch02-b17-18` | Same callout: 'differ only by that constant. The distinction matters when the first argument moves too' | applied | Shared sentence. Print's 'as the top bar of fig-ce-decomposition shows' stays out as before (Springer citation rule, ch02-cite-ce-decomposition). |
| `ch02-b17-19` | fig-ce-decomposition caption: 'carries entropy of its own. A one-hot target (bottom) carries none' | applied | Shared caption sentence. The grey alt-text wording stays print-only. |
| `ch02-b17-20` | Numerical stability: semicolon before the appendix pointer became a period | applied | Shared sentence. \lstref stays 'the code below'. The softmax-shift literals are untouched. |
| `ch02-b17-21` | Build section opening: 'from four pieces of the preceding sections: three templates, ...' plus the template definition (row k of W, score w_k^T x + b_k, pointer to @sec-01-linear-regression) | applied | Shared paragraph. The closing colon that leads into the Plan → Code panel is kept. |
| `ch02-b17-22` | Results paragraph after lst-blobs-scratch: '... separate these points. How well they would classify new points remains unmeasured.' | not-carried | Print-only paragraph that stands in for the cell's printed output; this edition never had it (precedent ch02-rule-006). |
| `ch02-b17-23` | fig-blobs caption: 'its own gray tone. A darker band ... (a low maximum softmax probability)' | not-carried | Grey-figure caption wording is print-only. This edition's colour caption is a different sentence. |
| `ch02-b17-24` | Framework-loss paragraph rewritten ('PyTorch provides the same cross-entropy as a built-in loss, nn.CrossEntropyLoss, ... remain black boxes until Chapters 4 and 5'; 'as in Chapter 1' dropped) | applied | Shared paragraph. \lstref{lst-ce-framework} was dropped because the cell follows directly, and \lstref{lst-blobs-scratch} became 'the manual loop above'. |
| `ch02-b17-25` | lst-ce-framework listing note reworded | not-carried | Listing notes are print-only. |
| `ch02-b17-26` | Warning callout: 'expects raw logits by design. It fuses the softmax and the logarithm with the log-sum-exp trick, which is more stable numerically than a softmax followed by a separate logarithm.' | applied | Shared callout prose. |
| `ch02-b17-27` | Check yourself, question 3: 'Why does PyTorch's cross-entropy loss take raw logits as its input?' | applied | Shared. |
| `ch02-b17-28` | Recap heading retitled 'Okay, so: classification keeps the linear geometry' | applied | The old id {#okay-so-classification-is-regression-plus-a-normalizer} is kept. The heading is not pinned, and D1 (at most ten words) holds. |
| `ch02-b17-29` | Recap items 1 to 4 rewritten as bold claims followed by sentences; item 1 drops the backbone-and-head sentence | applied | Shared list. The HTML-only link to #multiclass-classification-softmax went with the dropped sentence; the public-anchor audit still passes. |
| `ch02-b17-30` | Closing sentence: 'and shows why a nonlinear activation between them is necessary.' | applied | Shared. |
| `ch02-n18-01` | Notation pass: \hat{y} - y became \hat{\vect{y}} - \vect{y} in the build paragraph and recap item 3 | already | The qmd already used the vector form in both places. |

### Chapter 3 (`part1/03-nonlinearity-mlp.qmd`)

Baseline: the backup of October 17 14:24. Every hunk is a beta-reader edit of October 17. ch03-b17-04
reverses part of the October 5 decision ch03-author-02, because print's rewrite turned the one shared
sentence of the XOR setup into the whole paragraph. Outcomes: applied 20, partly 4, not carried 4.

| Entry | Print change | Outcome | Reason |
|---|---|---|---|
| `ch03-b17-01` | Sec. 'The four points a hyperplane cannot separate', first paragraph after the XOR table: the diagonal sentence becomes the explicit center-of-the-square argument (1-points (0,1),(1,0); 0-points (0,0),(1,1); both diagonals through (1/2,1/2); every line misclassifies at least one point) | applied | Beta-reader wording for a sentence this edition shares; no fixture or figure dependence |
| `ch03-b17-02` | Same section, correlation paragraph split into sentences ('...about the label. Whether...', 'The correlation ... is therefore zero.') | applied | Shared sentence, punctuation and wording only |
| `ch03-b17-03` | Historical callout: 'Multilayer networks could already represent XOR. What was missing was a reliable way to find their parameters.' and the rewritten hidden-unit/credit-assignment paragraph ending 'which solves it by computing the gradient of the loss with respect to every weight' | applied | Shared callout text; title unchanged |
| `ch03-b17-04` | XOR setup paragraph (qmd lines 63-71): two models, BCE loss from @sec-02-logistic-softmax, nn.Linear(2, 1), definitions of hidden layer, multilayer perceptron (MLP) and full-batch gradient descent; closing pointer now print's 'Both runs reuse the training loop structure introduced in @sec-01-linear-regression (we formally analyze the optimizer and `backward()` in @sec-04-training-loss-sgd and @sec-05-backpropagation).' with \lstref{lst-nn-linear} replaced by the chapter holding that cell | partly | REVERSES PART OF A RECORDED DECISION, for the author: on Oct 5, ch03-author-02 kept 'the rest of the setup paragraph' print-only. Taken now because print's Oct 17 rewrite turned the one shared sentence into this paragraph, and because it defines 'MLP', which the qmd used undefined. Review fix: the first pass kept the edition's own pointer ('The framework loop previewed in @sec-01-linear-regression does the training; ...'), which repeated the full-batch sentence just before it. It now follows print's sentence with the listing replaced by its chapter. Not carried: the 4,000-step footnote, because this edition is the companion and the settings are in the cell's train signature (ch03-sweep-01) |
| `ch03-b17-05` | XOR results paragraph: 'for a loss of', 'Its logits...', 'That number reflects rounding alone. At best, a line classifies three of the four points correctly (75%). The network with four hidden units classifies all four correctly.'; plus Figref fig-xor / hand-crafted line sentences | partly | Shared sentences carried. This breaks a hinge-lift literal and a test string, both listed. The figure-pointer and hand-crafted-line sentences stay print-only, as decided for ch03-004 (Oct 14) and on Oct 5 |
| `ch03-b17-06` | Neuron section: 'The rectified linear unit (ReLU) is a computationally simple alternative. It keeps the threshold at zero and lets the response grow linearly above it:' | applied | Shared sentence; eq-neuron display untouched |
| `ch03-b17-07` | Stimulus paragraph: '...output of zero. Above threshold, it fires with an intensity proportional to the stimulus.' | applied | Shared sentence; print's Figref fig-neuron-hinge sentence remains print-only (Oct 5 decision) |
| `ch03-b17-08` | fig-neuron-hinge caption: '; activation increases' becomes '. Activation increases' | applied | Caption wording carried in the fig-cap option, keeping Left:/Right: instead of a)/b) (D12) |
| `ch03-b17-09` | Hinge paragraph: 'by a crease. The neuron stays silent on the inactive half-space and fires on the active one, and w stands perpendicular to the dividing boundary.' | applied | Oct 16 rule: carry wording even where a replay quotes it; hinge-lift literal and test string changes listed |
| `ch03-b17-10` | Subgradient paragraph rewritten: PyTorch sets the derivative at zero to 0; pre-activation defined; all-zero input from a ReLU layer plus zero-initialized bias gives z = 0 and no gradient | applied | Shared paragraph; claim checked (torch.relu backward at 0 is 0) |
| `ch03-b17-11` | Layers of hinges: 'Take three hinges, h1=..., h2=..., h3=.... In the combination h1 - 2h2 + h3, the slopes cancel...' | not-carried | The edit splits the sentence that lists the hinge formulas, and this edition never carried those formulas: the code panel shows them (ch03-author-04, Oct 5). The qmd sentence has no formulas to split. The reviewer called this borderline and required no change |
| `ch03-b17-12` | New print figure fig-step-fit (TikZ ramp-versus-step schematic, added Oct 17) | not-carried | Print-only TikZ figure |
| `ch03-b17-13` | Trap item 1: 'The theorem proves only that suitable weights exist. Finding them is the job of the loss and the optimizer, and nothing guarantees that gradient descent reaches such weights.' | applied | Shared callout text |
| `ch03-b17-14` | Trap item 3: sentence split, new step-function argument for the half-jump worst-case error, L2 squeeze, 'The norm and the target class matter.' deleted, 'Approximation and generalization are separate questions, and @sec-06 takes up the second.' | partly | The argument is carried because it stands without the figure. The pointers to the print-only fig-step-fit are dropped: '\figref shows the consequence', 'as both ramps in the figure do', '(the arrows)', 'as in panel b' and 'the shaded gap' |
| `ch03-b17-15` | Why depth: 'One dimension already shows how this folding compounds.' | applied | Shared sentence |
| `ch03-b17-16` | Montufar paragraph: 'Gradient descent need not find such networks or use all their regions. The construction is an argument for...' | applied | Shared sentence; link unchanged |
| `ch03-b17-17` | Coding hygiene tip: 'The base-class initializer sets up parameter registration, ... Forget it and PyTorch raises an exception at once.' | applied | Shared callout text; \dlkeepall is layout (print-only) |
| `ch03-b17-18` | lst-mlp-class listing note punctuation (';' to '.') | not-carried | Listing notes are print-only; no code changed in the listing |
| `ch03-b17-19` | Moons paragraph: 'The training loop is unchanged, and only the model is new.'; setup sentences, footnote (t renamed \vartheta), Figref fig-moons sentence | partly | The shared sentence is carried, with the colon kept before the code panel. The setup, footnote and figure prose stay print-only, as decided in ch03-rule-006, ch03-sweep-03 and ch03-014: this edition is the companion |
| `ch03-b17-20` | Feature-space paragraph: 'The MLP's output layer is still linear. The network bends the boundary ... on which a linear readout suffices ...', backbone/head sentence, '(here the hat marks a unit vector)', 'the single coordinate value', '@fig-feature-space plots the moons in these learned coordinates.' | applied | Wording carried under the Oct 16 rule. Three feature-space literals and one test regex are listed. 'We compute the figure...' stays print-only |
| `ch03-b17-21` | fig-feature-space caption: '; the dashed contour' to '. The dashed contour', 'until a linear readout suffices' to 'on which a linear readout suffices' | applied | Caption wording in the fig-cap option |
| `ch03-b17-22` | Two-unit XOR paragraph: explicit ReLU(x1-x2)+ReLU(x2-x1)=\|x1-x2\| construction, why a silent unit stops learning, why more units help | applied | Shared paragraph; claims checked |
| `ch03-b17-23` | Representation section: 'Consider image classification.' and 'The network may still learn spatial regularities, but...' | applied | Shared sentences |
| `ch03-b17-24` | Okay, so recap items 1-5 rewritten as bold sentence plus explanation ('The MLP is a module.' etc.) | applied | Shared recap; heading and id unchanged; contract audit passes |
| `ch03-b17-25` | Exercise 4: 'Report the grid resolution with each count, because a sampled count is only a lower bound on the true count.' | applied | Shared exercise text |
| `ch03-b17-26` | Exercise 6: '...x_8. How does depth...' and 'Common misconception: “expand the logistic sigmoid at c=0.” That is its inflection point...' | applied | Shared exercise text, curly quotes kept |
| `ch03-b17-27` | Companion material, Animation 3.C entry ('not the trained run' dropped) | not-carried | Companion list is print-only |
| `ch03-b17-28` | Exercise 3 (qmd line 665): 'Retrain the XOR network with `hidden_dim = 2` across ten different seeds.' becomes print's 'Retrain the XOR network with 2 hidden units in place of 4 across ten different seeds.' | applied | Review fix, not an Oct 17 hunk. The first pass called the old wording a recorded divergence, but no record (Oct 5, 8, 9, 14, 18) has it. The XOR cell is nn.Sequential(nn.Linear(2, 4), nn.ReLU(), nn.Linear(4, 1)) and has no hidden_dim, and the Oct 16 rule requires print wording in a shared sentence. The Companion Experiment tag stays print-only. The \secref is not carried, as recorded in Oct 14 ch03-018 (the HTML exercise has no section reference): the target id has no sec- prefix and the chapter has only one XOR network. No fixture or test pins this sentence |

### Chapter 4 (`part1/04-training-loss-sgd.qmd`)

Baseline: the backup of October 17 15:31 (beta readers, Chapters 4 to 7). The beta-reader edits are new
here; PR #29 had carried the notation, rules and density rows. The estimator cases gain worked examples and
new names. The October 19 correction ($\E[\vect{m}^{(1)}]$ is one tenth of the expected gradient) arrives
with ch04-d19-16. Outcomes: applied 26, partly 1, already 1, not carried 5, needs author 3.

| Entry | Print change | Outcome | Reason |
|---|---|---|---|
| `ch04-d19-01` | Likelihood-derived loss functions, first sentence: 'we recall why it is *that* loss' -> 'we recall why we choose the loss we do' | applied | Beta-reader edit (Oct 17), shared sentence. |
| `ch04-d19-02` | The computational bottleneck: the semicolon sentence split into 'One step touches every example. Modern datasets have millions to billions of examples, models have ...' | applied | Beta-reader edit, shared sentence. |
| `ch04-d19-03` | SGD footnote on sampling without replacement: 'iterates; dedicated' -> 'iterates, and dedicated' | applied | Shared footnote. The sgd-zones literal on the next line keeps its line break. |
| `ch04-d19-04` | Physical reason to batch: 'moving the weights, and the resulting throughput' -> 'moving the weights. The resulting throughput' | applied | Shared sentence. |
| `ch04-d19-05` | Algorithm item 4: 'an **epoch**; repeat' -> 'an **epoch**. Repeat' | applied | Shared list item. |
| `ch04-d19-06` | Paragraph after fig-sgd-zones rewritten: it defines *saddle point*, adds the initialization and the batch order, and ends 'with effects that can help or hurt' | applied | Beta-reader edit resolving the note '[initialization and order too?]'. |
| `ch04-d19-07` | The learning rate, opening: 'The learning rate $\eta$ is a **hyperparameter**, a setting we choose before training instead of learning it, and few hyperparameters matter more. It scales every step, ...' | applied | Beta-reader edit. The replay-quoted sentence is carried per the Oct 16 rule; the step-length fixture literal is listed. |
| `ch04-d19-08` | Callout 'Selecting and scheduling the learning rate' rewritten as two paragraphs ('$\eta = 0.1$ is a reasonable first try'; schedule defined, decay and warmup, 'begin with warmup and then decay') | applied | Beta-reader edit. Two step-length literals and two test strings follow (listed). |
| `ch04-d19-09` | Batch size: '$\sqrt{(n-B)/(n-1)}$, which makes the noise exactly zero when $B=n$' and 'The batch size is a dial that links statistics and hardware, and its best setting depends on both.' | applied | Shared sentences; the batch-vote fixture literal is listed. |
| `ch04-d19-10` | Estimator section: new lead, and Case 1 'an average of per-example losses' rewritten | applied | Beta-reader rewrite answering the readability note. It sits inside the unsigned NOVEL block, whose marker is kept (10-14 decision 4). The batch-vote test regex is listed. |
| `ch04-d19-11` | Case 2 'a nonlinear function of an average', with the worked log example (0.693, 0.549, 0.621) | applied | Beta-reader edit. Arithmetic re-derived; NOVEL marker kept. |
| `ch04-d19-12` | Case 3 'an objective defined by the batch' (log 64 = 4.16, log 256 = 5.55) and the closing '.mean()' paragraph | applied | Beta-reader edit. The beam-width pointer was already out (10-18). NOVEL marker kept. |
| `ch04-d19-13` | Momentum: 'This is the ball rolling downhill. In directions where gradients keep agreeing, speed builds. In directions ...' | applied | Shared sentence; the momentum-memory literal is listed. 'with $\beta \in [0.9, 0.99]$' is kept for the animation (one of the six kept sentences). |
| `ch04-d19-14` | Low-pass filter paragraph rewritten ('passes slow, steady changes and damps fast ones', 'a factor of 10', 'grows relative to') | applied | Beta-reader edit resolving the note on 'ties'. |
| `ch04-d19-15` | Adam opening: 'Momentum uses the same learning rate for every parameter, yet ...'; the three ideas become three sentences | applied | Beta-reader edit. The Kingma and Ba link and the RMSProp footnote are kept. |
| `ch04-d19-16` | Bias correction: the one-sentence remark replaced by the unrolled derivation of E[m(t)] = (1 - beta1^t) E[g] ('averaging coefficients') | applied | Beta-reader addition; algebra checked. It also brings in the 'averaging coefficients' wording that the 10-18 record listed as absent. |
| `ch04-d19-17` | Optimizer comparison lead: 'This is a mechanism comparison: it shows how each rule responds to unequal curvature and supports no ranking of the optimizers at a shared learning rate.' | applied | Shared sentence. |
| `ch04-d19-18` | Paragraph after fig-race: the first two sentences restructured, and 'sensitivity to feature scale' in the last sentence | partly | The restructured sentences and the last sentence are carried. Print's new numeric middle is held as ch04-d19-34 (needs-author): this edition's fig-race cell prints none of those numbers, and one of print's claims is wrong for momentum. |
| `ch04-d19-19` | Regularization during training: new definition of **Regularization** and the ridge-penalty callback to @sec-01-linear-regression | applied | Beta-reader edit; NOVEL marker kept. |
| `ch04-d19-20` | Dropout: 'becomes zero; a retained' -> 'becomes zero, and a retained' | applied | Shared sentence. |
| `ch04-d19-21` | Dropout: 'The choice changes the computation itself, not only its execution speed.' -> 'The mode therefore changes what the network computes.' | applied | Shared sentence. |
| `ch04-d19-22` | Ensemble interpretation rewritten (ensemble defined, 2^k masks, shared weights, the stand-in is approximate), with a Srivastava et al. (2014) link | applied | Beta-reader edit. The \cite becomes the JMLR link; NOVEL marker kept. |
| `ch04-d19-23` | Early stopping rewritten: 'ends training', the overfitting of @sec-01-linear-regression, **model selection** along one run, @sec-learning-by-experiment | applied | Beta-reader edit. The labels exist, and no line begins with @. |
| `ch04-d19-24` | Recap item 4: 'for validation; watch' -> 'for validation. Watch' | applied | Shared item; the recap's NOVEL marker is kept. |
| `ch04-d19-25` | Reading notes: 'the loss line is Case 1 of @sec-04-estimator-cases ... the identity holds at each fixed parameter vector and says nothing about the run as a whole. The minibatch size therefore remains a dial for compute and noise.' | applied | Shared sentences. |
| `ch04-d19-26` | Exercise 6(b) parenthesis: '(Think about determinism and variance. Inverted dropout already preserves the mean.)' | applied | Shared sentence. |
| `ch04-d19-27` | Notation alpha -> eta in eq-full-gd, eq-sgd, eq-momentum, the ball analogy, weight decay, AdamW, the recap and Exercises 2-3; Exercise 2 w* -> w-hat; the penalty-strength sentence; 'small enough for the steep direction'; far pointers removed | already | Carried by the notation pass (1a9b356) and PR #29 (10-18 record). |
| `ch04-d19-28` | Print's fig-sgd-zones setup paragraph: '; the experiment checks' -> '. The experiment checks' | not-carried | This is print's prose version of the cell (10-14 ch04-005); this edition shows the code. |
| `ch04-d19-29` | fig-sgd-zones fig-cap (qmd line 135): appended print's 'Within each panel every batch arrow is drawn at the same length, so the arrows compare directions only. The shaded disc is schematic.' (this delta changed only its semicolon to a full stop) | applied | Review point 5, verified. The sentence has been in print since at least Oct 10. It was in every baseline, so no delta showed it, and no record declines it. It is not grey-figure wording, and it holds for this figure: the cell unit-normalizes the batch arrows to one length per panel (0.72 and 0.46), and the disc has a fixed radius of 0.82. The cell's code is unchanged, 'region of confusion' is kept, and nothing pins the caption. |
| `ch04-d19-30` | 'The figure confirms this split at two static/fixed parameter vectors ... It draws no training run.' | not-carried | Print-only paragraph (10-05 ch04-author-08). |
| `ch04-d19-31` | Race setup paragraph: 'no bias term', the footnote's semicolon, 'with replacement. A shared seed', 'beta = 0.9. Adam is' | not-carried | Print's prose version of the fig-race cell (10-08 ch04-sweep-01; 10-18 'no bias term'). |
| `ch04-d19-32` | Dropout seeded-check digits replaced by 'matches h to within a percent ... Companion Experiment 4.D prints it' | not-carried | Companion rule: this edition's dropout-check cell prints the digits, and print's paragraph is its prose version (10-08 ch04-sweep-02). |
| `ch04-d19-33` | Listing notes (semicolons, alpha -> eta) and the Companion material list ('Exercise 2/6 starts from it', 'It also draws', 'with no data from') | not-carried | Listing notes and companion lists are print-only. |
| `ch04-d19-34` | Paragraph after fig-race, the held numeric middle: 'After about 40 steps, both reach the floor ... least-squares solution itself has loss 0.0103 ... (Companion Experiment 4.C prints the losses). Plain SGD ends at 2.3 ... first weight has reached only 1.33 of the true 3.0.' | needs-author | Print says this edition's 4.C prints these numbers, but the fig-race cell only plots. Carrying them needs print lines in fig-race (a code change, outside this unit) or the author's acceptance. My re-run gives LS loss 0.010281, SGD 2.3001, w1 1.3272. 'After about 40 steps, both' holds only for Adam (1.03x at step 40). Momentum is 13x at step 40, first under 2x at step 49 and within 3x from step 70, so print needs correcting too. The Oct 18 lead, which promises the least-squares comparison, stays as print has it (shared sentence). The ready text and a manifest follow-up are in the notes. |
| `ch04-d19-35` | Estimator lead 'Three cases cover the ones in this book, and a small example shows each.' (print ch04.tex:237-238, carried verbatim) | needs-author | Review point 3, verified. Case 1 computes no example; only Cases 2 and 3 do. Print says the same, so the fix is print-side ('a small example shows the last two', or a one-line Case 1 example), and this edition then follows. |
| `ch04-d19-36` | None here. The case names are now 'an average of per-example losses', 'a nonlinear function of an average' and 'an objective defined by the batch'; Appendix A5 (qmd 291-300, print appE.tex 350-361), Chapter 19 (printed 22; qmd 413, print ch22.tex 231) and the batch-vote panel keep the older names | needs-author | Review point 4, verified. The terms drift between chapters in both editions, though the case numbers still resolve and nothing contradicts. Other chapters and panels are out of scope, so this is flagged for a print alignment pass that this edition would follow. |

### Chapter 5 (`part1/05-backpropagation.qmd`)

Baseline: the October 17 15:31 backup. The delta holds the beta-reader edits (above all, $\delta$ is now
called the "loss derivative" in place of "sensitivity"), the notation pass (widths $D_{\text{in}}$,
$D_{\text{out}}$, $D$) and density rows. The retitled section keeps its old id. Outcomes: applied 34, partly
2, already 1, not carried 9, needs author 4.

| Entry | Print change | Outcome | Reason |
|---|---|---|---|
| `ch05-oct19-01` | Opening paragraph: 'Recall the gradient-descent update of @sec-01...'. Finite differences now reads 'We could estimate ... a method called *finite differences*, but that needs at least one extra forward pass per parameter: millions of passes for a single gradient'. The credit assignment problem is named and explained (qmd opening paragraph) | applied | Beta-reader wording on a shared paragraph. The @sec reference stays off the line start |
| `ch05-oct19-02` | 'Backpropagation solves this problem exactly.' and 'a recursion on loss derivatives' (second paragraph) | applied | Shared sentences. 'Sensitivity' is renamed 'loss derivative' throughout the chapter |
| `ch05-oct19-03` | One neuron, one chain: the semicolons are split ('... + b$. The activation function produces ..., written $a$ below, and $a$ feeds a loss'), and 'local derivatives:' | applied | Shared sentences. The pinned eq-chain block is untouched |
| `ch05-oct19-04` | fig-chain-graph alt text 'four derivative boxes'. Caption 'Each box on the lower lane is the derivative of the loss with respect to the node above it. The one at $z$ ...' | applied | Terminology and the sentence split are carried. The colour wording stays, because print's lane wording is grey-figure wording |
| `ch05-oct19-05` | Two-properties list: item 1 'along the way. We keep them because ...'. Item 2 'one forward pass. For matrix-multiply layers' | applied | Shared sentences. This breaks the one-chain-excerpt fixture literal (listed). \lstref stays 'the batched code below' |
| `ch05-oct19-06` | Section retitled '## Propagating loss derivatives: the four layer equations {#sensitivity-propagation-the-four-layer-equations}'. Its opening paragraph now has 'the number of chain-rule paths grows quickly', 'one derivative vector', a split sentence and 'the loss derivative' | applied | The retitled heading keeps the old auto id as an explicit id |
| `ch05-oct19-07` | Callout title 'The loss derivative at a layer', '**loss derivative**', 'Entry $j$ measures how much unit $j$ is to blame for the loss ...' and 'To reduce the loss, $z^{(l)}_j$ should move against the sign of $\delta^{(l)}_j$.' | applied | The author's rename, with one blame sentence. The callout has no anchor |
| `ch05-oct19-08` | Eq 1 lead 'where the loss derivative is explicit'. '$2/D_{\text{out}}$ for $D_{\text{out}}$ scalar outputs'. The clause 'which measures how sensitive the activation was to its input' is dropped | applied | Beta-reader rename and notation pass (widths D_out) |
| `ch05-oct19-09` | 'The loss derivative travels backward through the same weights ...' | applied | Terminology |
| `ch05-oct19-10` | 'We run the recursion on a small network ...' paragraph ('output derivative') | not-carried | No counterpart here. The sensitivity-values plan-code cell carries this set-up (print's prose version of a cell, 10-05 ch05-print-166) |
| `ch05-oct19-11` | fig-delta-pullback alt text ('loss derivative' three times) and caption ('each loss derivative back', a split sentence, 'activation derivatives at work', 'smallest activation derivative', 'small loss derivative') | applied | Terminology and the split are carried. The grey wording ('shaded by magnitude', 'printed numbers carry the sign') is print-only |
| `ch05-oct19-12` | '**3. Convert loss derivatives into weight gradients:**' | applied | Terminology |
| `ch05-oct19-13` | Shapes paragraph: $D_{\text{out}}$/$D_{\text{in}}$ replace m/k, 'the loss derivative of neuron $i$', and '*derivative out times signal in*, and the matrix form maps directly onto the parallel matrix multiplies that GPUs are built for.' The colon before the code became a full stop | applied | Notation pass, plus the beta-reader's move of the GPU clause. Print's next sentence '\Figref{fig-outer-product} forms it for the second hidden layer ...' is not carried. It is a recorded divergence (10-05 ch05-print-278: a print rewrite span that replaces the outer-product-gradient panel), and the cell's code already names the layers. Five other Plan → Code blocks in this chapter follow a full stop, so no lead-in is needed. The reviewer's nit is answered with no change |
| `ch05-oct19-14` | fig-outer-product alt text 'loss-derivative column'. Caption 'loss derivatives and activations', 'derivative column', two semicolons split | applied | Terminology and splits. The colour wording stays |
| `ch05-oct19-15` | Deleted the paragraph after fig-outer-product ('The matrix form needs no explicit summations ... The same reverse-mode principle applies to larger models ...') | applied | Print deleted it and moved its GPU clause into the shapes paragraph. This is a wording cut, not a removed float |
| `ch05-oct19-16` | 'The network takes $d = 5$ inputs to 8 sigmoid hidden units ... under a fixed seed', with the footnote removed | not-carried | Print-only listing prose. The footnote removal is a density move to the Companion, and this edition is the companion |
| `ch05-oct19-17` | Batched layout: $n\times D_{\text{in}}$, $n\times D_{\text{out}}$, 'loss derivatives', example index r. Also Plan step 2 of backprop-by-hand now reads 'propagate the loss derivatives backward' | applied | Notation pass (R3: r indexes examples) and the rename. The Plan step follows the chapter-wide rename; it is HTML-only text, not code |
| `ch05-oct19-18` | Listing notes of lst-backprop-by-hand ('(n, 8)', split semicolons) | not-carried | Listing notes are print-only |
| `ch05-oct19-19` | Autograd gap: 'at the level of float32 rounding for every tensor (Companion Experiment 5.B prints the four gaps)' | not-carried | Companion rule: this edition keeps 'The largest discrepancy is 3.73e-9', which its cell prints |
| `ch05-oct19-20` | The run-in heading '**Two products backward for each product forward.**' is replaced by 'The code also shows where the backward cost comes from.' Also 'The backward pass needed two matrix products for it', 'carries the loss derivative', and '... is trained, and our code never forms one.)' | applied | Beta-reader edit on a shared paragraph |
| `ch05-oct19-21` | Caching paragraph: 'Caching also costs memory.', read A1 'twice, once for ... and once for ...', 'It also read the input X ...', 'Both therefore had to stay in memory after the forward pass.', and 'until the backward pass has used it. This is why ...' | applied | Beta-reader edit ('survive' removed, comma chain split) |
| `ch05-oct19-22` | DAG rules: topological order defined, 'its derivative', 'makes its total derivative the sum of the derivatives along each path', 'add each new contribution to the stored adjoint' | applied | The term is defined at first use. Rename |
| `ch05-oct19-23` | fig-autograd-rules caption: '(a) ... holds its gradient, and the non-leaf ...' and '(d) ... alive. `loss.item()` and ...' | applied | Semicolon splits. The alt text keeps its colour wording |
| `ch05-oct19-24` | Rule 1: '(your parameters). A *non-leaf* is ...' | applied | Semicolon split |
| `ch05-oct19-25` | Rule 3: 'Both parts of this idiom matter: the in-place subtraction and the paused recording.' The list is split into sentences | applied | Beta-reader edit. 'The idiom:' stays, because print's \lstref sentence is listing prose |
| `ch05-oct19-26` | lst-leaf-update note split | not-carried | Listing note, print-only |
| `ch05-oct19-27` | Rule 4 'paused. Anywhere else, ...' | already | Carried on Oct 14 (ch05-012) |
| `ch05-oct19-28` | The merged 'Activation and gradient scales' opener, and the fig-signal-flow alt text and caption ('loss derivative', splits) | not-carried | Print-only merged section and print-only figure (structure, decision U04-3) |
| `ch05-oct19-29` | Activation derivatives opener: 'combines loss derivatives' and '..., and a derivative equal to one leaves it unchanged.' | applied | Rename and semicolon split |
| `ch05-oct19-30` | Product-bound paragraph rewritten with the Jacobian defined: 'the local *Jacobians*, the matrices of partial derivatives ...', '... at most $0.25^k$. After ten factors the bound is below one in a million.', and 'this bound covers the activation-derivative product alone. It still shows ...' | applied | Shared sentence, including a replay-quoted one (Oct 16 rule). This breaks the derivative-gates fixture literal. Per the review, the proposed new literal is now the two-line form that keeps the k-factor bound pinned. It also settles the pinned 'gates' item from 10-08 |
| `ch05-oct19-31` | ReLU paragraph: 'PyTorch uses derivative $0$, and exact zeros ...', 'is therefore either one or zero', and 'the loss derivative passes through this factor unchanged. The surrounding ...' | applied | Shared sentences. This breaks the derivative-gates literal 'At the kink ...;' (listed). The scene test regex still matches |
| `ch05-oct19-32` | Depth experiment set-up: 'same He-initialized weights' became 'same weights', with weights drawn from N(0, 2/D_in), D_in = 64, 'a scale the next subsection explains' | partly | The setup box is print-only structure. Its change is carried into this edition's own set-up sentence: 'Both get the same weights and input batch, every weight drawn from ... a scale the next section explains. We record ...' |
| `ch05-oct19-33` | fig-vanishing caption: 'With the same weights and inputs', and a semicolon split | applied | He is not named before its definition (beta-reader) |
| `ch05-oct19-34` | 'All 4,096 sigmoid ... entries remain nonzero after the float32 cast.' | applied | The second 'survive' is removed (beta-reader). 'first-layer' stays, because this edition lacks print's preceding sentence |
| `ch05-oct19-35` | Initialization opener: 'If it multiplies the variance by less than one, they vanish.' and 'backward derivative scales'. 'A good initialization keeps the variance roughly constant in both directions.' is deleted | applied | Shared sentences. 'a second factor' stays, per Oct 14 (ch05-015) |
| `ch05-oct19-36` | 'keeping the variance of the loss derivatives constant' | applied | Rename |
| `ch05-oct19-37` | Xavier and He are introduced as method, then citation, then name: 'The two conditions disagree when ...', the [Glorot and Bengio (2010)] link, 'This recipe is called **Xavier initialization**, after Xavier Glorot', ReLU halves the mean square, the [He et al. (2015)] link, 'now called **He initialization**, after Kaiming He', 'a sixth of the He value' | applied | Beta-reader edit. \cite is converted with the bib URLs. Adapted by dropping 'as the next paragraph shows', because print's next paragraph (sigma_w gain) is not in this edition. The resulting gap is listed as ch05-oct19-48 |
| `ch05-oct19-38` | sigma_w gain paragraph (D notation, symmetric pre-activations rewording) | not-carried | Not in this edition (held structure, U04-3) |
| `ch05-oct19-39` | 'Experimental setup: Initialization and activation scale' box (D = 256) | not-carried | Setup box, print-only structure |
| `ch05-oct19-40` | fig-init caption 'width $D = 256$' and a semicolon split | applied | Notation pass. The panel b text is not carried (single-panel figure). The plotted legend still says sqrt(2/n), which is code |
| `ch05-oct19-41` | Closing paragraph: '... derivative factors. Together they determine whether the ... signals keep their scale through depth ...' and 'skip (residual) connections' | partly | Carried except the 'Panel a/Panel b' sentences (there is no panel b) and 'the signals of \figref{fig-signal-flow}' (a print-only figure; 'the forward and backward signals' stays) |
| `ch05-oct19-42` | Check yourself: 'Why does the loss derivative $\delta$ pass ...' | applied | Rename |
| `ch05-oct19-43` | Recap item 2 '**The loss derivative.**'. Item 3 '**We verified it.** Our hand-built ...' | applied | Rename and split. 'in Companion Experiment 5.C' stays print-only |
| `ch05-oct19-44` | Exercise 2 'the loss derivative pass'. Exercise 7 'upstream derivative', '$\loss = -\log \hat{y}_c$', '@eq-ce-grad. Choose it ...' | applied | Rename, notation and semicolon split |
| `ch05-oct19-45` | Companion material list (Experiment 5.A title 'Loss derivatives on a small network', split semicolons) | not-carried | The companion list is print-only |
| `ch05-oct19-46` | 'sensitivity' remains in this edition's code. Visible comments: '# layer-2 sensitivity (4,)' (outer-product-gradient, code-fold false) and '# eqs. 3 & 4: sensitivity out x signal in' (backprop-by-hand, code-fold false). Code-summary 'Code: propagate the sensitivities' (sensitivity-values). Also the fig-init legend 'sqrt(2/n)' against the caption's D, and the older items: the fig-gates panel titles 'sigmoid gate'/'ReLU gate' and the 'derivative gates' Plan step and code-summary | needs-author | A carry makes no code-cell changes, and print changed no code. The reviewer confirmed these as visible inconsistencies. The author's fix would be the comments 'layer-2 loss derivative' and 'loss derivative out x signal in' (stdout unchanged) and the legend sqrt(2/D) (the figure changes), followed by a refreeze. The cell label sensitivity-values is an anchor and stays |
| `ch05-oct19-47` | Sigmoid derivative now matches print: 'For the logistic sigmoid,' followed by the display $$\sigma'(z) = \sigma(z)(1-\sigma(z)) \leq \frac14 .$$, then 'The maximum occurs at $z=0$. As the activation saturates toward either endpoint, its derivative approaches zero.' This replaces 'Its maximum value, at $z = 0$, is exactly $0.25$; as the activation saturates ...' (activation-derivatives section, before the derivative-gates block) | applied | The reviewer found this missed. The 10-08 record held it only because a replay literal pins it, in the same item as 'Ten gates in'. The Oct 16 decision 1 carries replay-quoted sentences, and this sentence is not one of the six kept for the animations. Print's '\Figref{fig-gates} compares this derivative with that of ReLU.' is not carried: it is a print figure pointer (case law ch05-cite-chain-graph and ch05-print-684). This breaks the derivative-gates literal (listed). The scene test and the receipt do not quote the sentence |
| `ch05-oct19-48` | The carried 'Both conditions assume an activation that keeps the variance. ReLU sets about half of its inputs to zero and so halves the mean square.' switches from variance to mean square. Print justifies the switch only in the held sigma_w paragraph ('A ReLU output is not zero-mean. With zero-mean weights, the rule above still holds with the mean square $\expect[x^2]$ in place of $\var(x)$.') | needs-author | The reviewer's should-fix is real, but fixing it lifts part of the U04-3 hold, so the author or coordinator must decide. Option 1: carry those two print sentences after 'halves the mean square.', with \expect written as this edition's \E. Option 2: record the gap as a deliberate divergence. No change was made |
| `ch05-oct19-49` | Panel texts still use the earlier terms. In derivative-gates panel.html: 'pass almost no backward sensitivity?', the 'Forward activation and backward sensitivity' aria-label and title, 'local sensitivity', 'Filled area is proportional to that sensitivity', 'Sensitivity peaks at z = 0', 'Ten best-case sigmoid gates'. In derivative-gates player.js: 'A tiny backward sensitivity', 'a unit sensitivity', 'sensitivity remaining · log scale', 'filled area = sensitivity', 'Best case at every gate'. In one-chain panel.html: 'the loss and its sensitivities' | needs-author | The animations stay intact, so no panel edit is allowed. The 10-08 record asked for the panel's gate wording to be decided together with the pinned sentence, which is now carried. Add these to the author's list of panel texts in the earlier wording |
| `ch05-oct19-50` | Two print-level points that affect both editions. (1) *Jacobians* is italicized as a definition at the product-bound paragraph, but the VJP sentence in the autograd section uses the term about 150 lines earlier. (2) The cost sentence 'For an $n\times k$ input and an $m\times k$ weight ... $2nmk$' keeps its own symbols after the D_in/D_out notation pass | needs-author | Print has the same text in both places, so the carry is faithful. These are reported to the author for print; nothing changes here unless print changes |

### Chapter 6 (`part1/06-generalization-inductive-bias.qmd`)

Baseline: the October 17 15:31 backup. The delta holds the beta-reader edits, the rules and notation rows of
October 18 (carried by PR #29) and the October 19 correction to recap item 4 (ch06-o19-42). The review fix
also carried three October 8 holds whose only reason was the NOVEL status or the distance-band literal
(ch06-o19-50 to -52). Outcomes: applied 45, partly 1, already 4, not carried 3.

| Entry | Print change | Outcome | Reason |
|---|---|---|---|
| `ch06-o19-01` | Opening paragraph 2: 'arrangement. Requiring a model to keep its output ...' and 'tolerate small displacements that leave the object unchanged' | applied | beta-reader edit to a shared sentence |
| `ch06-o19-02` | Opening paragraph 3: 'The first tests one fitted network. The second tests what the architecture and training recipe can learn, a property of the whole *model family*: the set of functions the architecture can compute. The comparison also motivates ...' | applied | beta-reader edit; resolves the '[the symmetries][?]' note |
| `ch06-o19-03` | The baseline fit: '1,000 for fitting (training)' and '; this MLP has no such layer' changed to '. This MLP has no such layer.' | not-carried | Print-only setup sentences. This edition has the split in code and its own N06 net.eval() sentence (ch06-pol-02 still held). The 10-18 record already lists '1,000 for fitting (training)' as not carried. |
| `ch06-o19-04` | tbl-three-learning-questions caption: 'indirectly, about the available capacity. Generalization needs evidence of its own.' | applied | beta-reader edit |
| `ch06-o19-05` | Table Representation row: 'can the architecture, with some choice of weights, compute a useful rule?' and 'An explicit construction, an approximation theorem, or one trained network that computes such a rule' | applied | beta-reader edit |
| `ch06-o19-06` | Experiment 1 lead and prediction prompt (rules pass) | already | Carried by PR #29. This edition keeps 'Before you run the cell'. |
| `ch06-o19-07` | Shift result 'falls to 46.5%'; 'We keep the trained network fixed' moved to the lead | already | Carried by PR #29. Print's 'The shift moves every pixel...' describes what this edition's code shows. |
| `ch06-o19-08` | After the edge-crop-control cell: 'The crop therefore explains only a small part of the loss after displacement.' | applied | beta-reader edit; the crop statistics stay with the cell |
| `ch06-o19-09` | Before eq-shifted-risk: 'estimates performance under $P$, and performance under a transformed distribution needs its own test.' | applied | beta-reader edit |
| `ch06-o19-10` | fig-shift-cliff fig-cap: 'chance level, and accuracy approaches it after four pixels of shift.' | applied | beta-reader caption edit (caption option only, no code) |
| `ch06-o19-11` | Experiment 2 lead: ', then retrain with the same recipe and seed' | already | carried by PR #29 |
| `ch06-o19-12` | Experiment 2, paragraph 2: 'We have no reason to expect the clean-trained classifier to keep its decisions under a scramble, so we ask a different question: ...' | applied | beta-reader edit |
| `ch06-o19-13` | After the shuffle-experiment cell: 'deterministic' became 'seeded', and 'This is not an uncertainty estimate;' was dropped ('This shows that the training recipe can learn ...') | partly | Beta-reader edit; the author flagged the hedge as redundant. Print's restated '77.0% ... close to the original network's accuracy' stays with the cell, which prints both values (companion rule, as in 10-18). This changes the shift-shuffle fixture literal. |
| `ch06-o19-14` | Protocol note opening: 'protocol. The baseline is the clean-trained model ...' (semicolon to full stop) | applied | Oct 18/19 print punctuation; the \secref stays this edition's link |
| `ch06-o19-15` | Protocol note: deleted 'These are not two instances of the same robustness failure.' | applied | beta-reader edit |
| `ch06-o19-16` | Protocol note: 'so the argument does not cover it, and its retrained result is purely empirical.' | applied | beta-reader edit |
| `ch06-o19-17` | Inside the weights opener: 'Why does retraining recover the accuracy on scrambled images? The first layer gives an exact answer.' | applied | beta-reader edit; the heading and its id are unchanged |
| `ch06-o19-18` | After eq-permutation-symmetry: 'therefore has a matching set of weights in the scrambled coordinates' | applied | Beta-reader edit. $\vect{b}_1$ and $\matr{\Pi}$ were already there. |
| `ch06-o19-19` | Model-family paragraph rewritten: 'The identity is a property of the **model family**. ... for fixed weights $\matr{W}_1\matr{\Pi}\vect{x}$ differs from $\matr{W}_1\vect{x}$, which is why the clean-trained model fails ... Training also treats the two coordinate systems alike. ...: permuting the coordinates leaves ... unchanged. Adam applies ...' | applied | beta-reader edit; consistent with the 8.0% fixed-model scramble |
| `ch06-o19-20` | 'from data, but it builds in neither locality nor translation invariance.' | applied | beta-reader edit |
| `ch06-o19-21` | fig-templates fig-cap: '... every input pixel. Its appearance alone does not show what ...' | applied | Beta-reader caption edit. This edition's colour wording is kept (grey-figure wording is print-only). |
| `ch06-o19-22` | After fig-templates: 'fail under it. Only a transformation test can.' | applied | beta-reader edit |
| `ch06-o19-23` | Label-preserving paragraph: 'where a different coefficient multiplies it. The dense parameterization does not tie the two coefficients together, and only training determines how similar they are.' | applied | beta-reader edit |
| `ch06-o19-24` | Gradient paragraph: $\delta_{ij}$ is 'the loss derivative of hidden unit $j$ on image $i$' (was 'the sensitivity') | applied | Print rename, also in print Ch 5. This worktree's uncommitted Ch 5 carry already uses 'loss derivative' in its prose (HEAD's Ch 5 still says 'sensitivity'), so this entry must be committed in the same batch as the Ch 5 carry. Ch 5's code comments, cell label and old anchor id keep 'sensitivity'. |
| `ch06-o19-25` | U-curve paragraph: 'and neither curve shows one. As @sec-01-linear-regression warned, the U-shaped curve is a useful schematic that real training need not follow: ...' | applied | beta-reader edit |
| `ch06-o19-26` | Sweep scope paragraph: 'The sweep measures **clean validation performance**. A network's response to a shift needs its own measurement at each width.' | applied | beta-reader edit |
| `ch06-o19-27` | Geometry opener: 'to its input, the raw pixel vectors. How informative is the distance between two such vectors? Our images use 784 numbers. A small color image ... uses 3,072, a 224x224x3 input uses 150,528, and a one-megapixel color photo uses three million.' | applied | Beta-reader edit. The next sentence (the pinned grid literal) takes the 10-08 holds in ch06-o19-52. |
| `ch06-o19-28` | fig-curse fig-cap: 'The uniform cube is a controlled geometry example, and natural images do not fill it uniformly.' | applied | Beta-reader caption edit (decision 1: replay-quoted sentences follow print). This changes a distance-band literal. |
| `ch06-o19-29` | Uniform-cube paragraph: 'become nearly equal', 'so the cube only illustrates the effect', 'The $9^d$ grid count also says little about ...: ... a horizontal and a vertical offset.' | applied | Beta-reader edit; this changes a distance-band literal and supersedes the 10-08 hold on that clause. |
| `ch06-o19-30` | Deleted 'We now measure the pixel geometry of the actual images.' | applied | beta-reader edit ('redundant') |
| `ch06-o19-31` | Deleted '; it does not show that more data or augmentation cannot improve robustness' | applied | beta-reader edit ('no need to debunk') |
| `ch06-o19-32` | Biological-vision paragraph: 'is wired differently from a dense layer, which connects every point ...' | not-carried | The paragraph is absent here: ch06-rev-07 has been held for the author since the 10-08 carry (content addition, structure). If it is adopted, take print's current wording. |
| `ch06-o19-33` | Data augmentation (N07): 'This is **data augmentation**. Beyond enlarging the dataset, it is ...'; 'By sampling shifts ..., we declare that location within that window does not matter for the label. This is an assumption about the task, and it covers shifts only. Retraining on one fixed scramble does something different: it changes the encoding ...' | applied | Beta-reader edit in NOVEL N07, marker kept. Print's whole sentence is taken, which also carries the 10-08 hold ch06-pol-13. The 10-08 carry held pol-13 to -15 only because N07 is NOVEL, and decision 4 of Oct 16 keeps print wording in unsigned NOVEL blocks, so that reason is gone for all three. pol-14 and -15 are carried with it (ch06-o19-50, -51). pol-12 stays held with rev-07. |
| `ch06-o19-34` | N07: 'by training on shifted examples, while the dense network still gives each position its own coefficients. Weight sharing ties those coefficients directly. ... current MLP, and Part II develops ...' | applied | beta-reader edit (N07, marker kept) |
| `ch06-o19-35` | Levers list item 2: 'are examples. The minibatch noise ...' | applied | beta-reader punctuation |
| `ch06-o19-36` | Routes paragraph: 'and each has its own limits. Training on a finite set of shifted copies encourages consistent predictions, and the network may still respond differently to shifts it never saw. ... but it may exclude useful functions.' | applied | beta-reader edit (N07) |
| `ch06-o19-37` | 'These constraints supply locality and sharing, and the full classifier's shift tolerance will still need to be measured.' | applied | Beta-reader edit. The 10-08 holds pol-14 and pol-15 in the same paragraph are now carried too (ch06-o19-50, -51). |
| `ch06-o19-38` | Tip box (N08): 'we want tolerance to small position changes while the model still responds to the arrangement of the pixels.' | applied | beta-reader edit; marker kept |
| `ch06-o19-39` | Sealed check: 'The sealed check confirms what the validation experiments found: 80.8% ...' | applied | beta-reader edit |
| `ch06-o19-40` | Recap item 2: 'tests whether the recipe can learn in a different encoding.' | applied | beta-reader edit in the NOVEL recap, marker kept |
| `ch06-o19-41` | Recap item 3: 'and their appearance alone establishes neither robustness nor its cause.' | applied | beta-reader edit |
| `ch06-o19-42` | Recap item 4: 'The shift experiment exposes a mismatch between pixel distance and the tolerance the task requires.' (replaces 'Neither gives a general limit ...') | applied | Beta-reader edit plus the Oct 19 correction. HTML had the pre-beta sentence, so the final wording goes in. It restates the chapter's own geometry conclusion, so the claim is not new. |
| `ch06-o19-43` | Recap item 5: 'locality and weight sharing, and augmentation is ...' | applied | beta-reader punctuation |
| `ch06-o19-44` | Deeper dive: dropped ', not 100% on ImageNet'; 'does not explain generalization. The data, the optimizer, and the architecture must enter the account.' | applied | beta-reader edit |
| `ch06-o19-45` | Deeper dive: logits $o_k=\tilde{\vect{w}}_k^\top\vect{x}+\tilde b_k$, 'with effective slope ... and offset ... on that region' | applied | beta-reader notation edit |
| `ch06-o19-46` | Sources, WILDS: 'so that clean validation is never mistaken for a robustness test.' | applied | beta-reader edit |
| `ch06-o19-47` | Sources, Bach: 'behind Exercise 6. The exercise itself stops at counting.' | applied | beta-reader punctuation |
| `ch06-o19-48` | Exercise 1: $\matr{P}$ became $\matr{\Pi}$ | already | carried by the notation pass |
| `ch06-o19-49` | Companion material list: 'Exercise N starts from it.' additions; Animation 6.B 'differs from the printed run' | not-carried | print-only companion list |
| `ch06-o19-50` | N07, architecture-side paragraph: 'For Part II we begin with the architecture-side route:' (HTML had 'move') | applied | Review fix. The 10-08 hold ch06-pol-14 was held only because N07 is NOVEL; decision 4 of Oct 16 settled that, as for pol-13. Print has not changed this sentence since Oct 8. Marker kept. |
| `ch06-o19-51` | N07: 'We constrain each template to a small local patch instead of the whole frame. Then we *share* that template across every position' (HTML had 'Constrain each template to look at ... Then *share*') | applied | Review fix. The 10-08 hold ch06-pol-15, held for the same reason as pol-14. N07 now uses the active 'we' throughout (D12). Marker kept. |
| `ch06-o19-52` | Geometry opener: 'a grid with 9 values per coordinate has $9^2$ points in two dimensions and $9^d$ in $d$ dimensions, about $10^{748}$ at $d = 784$.' (HTML had 'contains' and no 10^748 clause) | applied | Review fix. The two 10-08 holds of ch06-rev-05 were held only because the sentence is a distance-band fixture literal. Decision 1 removed that reason, and ch06-o19-28/-29 already carry the fixture's other two literals under it. Checked: 784 x log10(9) = 748.13. Adds a fourth fixture-literal change. |
| `ch06-o19-53` | Before tbl-three-learning-questions: 'Before probing the model, we separate three questions' (HTML had 'separate three questions') | applied | Review fix. An older print wording in a shared sentence that no carry took and no record holds. D12 asks for the active 'we', and nothing pins the sentence. Print's (\tblref) stays out because the table follows directly (ch06-cite-three-questions, 10-05). |

### Chapter 7 (`interludes/learning-by-experiment.qmd`)

Baseline: the October 17 15:31 backup. The beta-reader edits, the notation pass and density row D7-01. This
edition keeps "are built from expectations over the seed" (ch07-b17-27). Outcomes: applied 37, partly 1,
already 3, not carried 4.

| Entry | Print change | Outcome | Reason |
|---|---|---|---|
| `ch07-b17-01` | Opening para 2: dropped 'we did not guess at a remedy'; 'architectural change that those probes motivate'; 'progress follows the same sequence: a diagnostic test, then a design change that addresses what the test found' | applied | Beta-reader [repairs] edit to a shared paragraph |
| `ch07-b17-02` | Opening para 4: 'Repeated runs over a **seed panel**, a fixed set of random seeds that every configuration uses, reveal background variation. Saved configurations ... reproducible.' | applied | Term defined at first use; shared sentence |
| `ch07-b17-03` | fig-experiment-loop Markdown caption: 'selected across runs, outside the inner optimizer' | applied | Shared caption; plotted label in code stays (decision 2) |
| `ch07-n18-04` | Metric display: dataset argument D -> \mathcal{D} | applied | Notation pass R2/R3; commit 1a9b356 renamed the sentence and left side but missed this argument |
| `ch07-b17-05` | New sentence after the setup paragraph: 'The estimands of the next section and the search of [HPO section link] are written in this notation.' | applied | Answers the author's [is this necessary?] note; \secref became an in-chapter link to the existing auto id |
| `ch07-b17-06` | Claim-types opening: 'What does that result support? ... what was tuned. @tbl separates four types of claim, and the rest of the chapter relies on them' plus two new sentences linking the worked experiment and the protocol section | applied | Print wording carried. This edition's question form is kept, and the links follow the chapter's existing style |
| `ch07-b17-07` | 'We therefore state the claim before running the experiment.' (post-table paragraph) | applied | Shared sentence |
| `ch07-b17-08` | Claim table row: 'with each design tuned separately' | applied | Shared table cell |
| `ch07-b17-09` | BatchNorm defined in one line ('a layer that rescales each hidden unit's values using statistics of the current batch') in the 'BatchNorm as an experimental factor' callout | applied | Print puts this in the worked experiment's lead, which this edition gives to the callout just before it. 'Its mechanism is developed in @sec-09' stays as this edition's form of '(develops it)' |
| `ch07-b17-10` | Study table: 'stored images: 1,000 for fitting and 200 for validation', 'already used by earlier studies in the book', 'restoring each run's best checkpoint' | applied | Shared table rows |
| `ch07-b17-11` | Reused-test paragraph (qmd ~338-342), print's net change: 'No decision in this study depends on the 600 test images, and we evaluate on them only after the designs and learning rates are locked.' and 'A new project should reserve a test set that no earlier decision has touched.' This edition's reopen clause ('not a globally sealed test set: @sec-06 has already used the same book benchmark') is gone. Its forward pointer (Chapters 8 and 9 reuse them) and its 'demonstration of the protocol' sentence stay | applied | The fix pass replaced the porter's version, which carried print's interim Oct 17 sentence 'The 600 test images have already been used ... no longer a fresh test set'. Density row D7-01 deleted that sentence from the master, so it was in neither current print nor this edition. The study table row still records the reuse |
| `ch07-d7-01` | Density D7-01: deleted the reopen explanation ('The 600 test images have already been used ... no longer a fresh test set') | applied | By the register's legend, 'HTML: print only' means only that this edition did not print that exact passage. The Oct 18 carry carried the same kind of row (D9-03, D10-02 with the same 'print only' mark, D11-03, D15-03, D16-11, D19-09). The deletion is carried with ch07-b17-11, and the author can keep the explanation as a recorded divergence if preferred |
| `ch07-b17-12` | 'Evaluation switches the model to eval(), so BatchNorm uses the averages it stored during training and stops updating them.' | applied | Only sentence of print's run_once paragraph that this edition shares |
| `ch07-b17-13` | 'The large low-rate contrast is therefore one end of an interaction curve, and BatchNorm has no single effect across rates.' | applied | No X-not-Y rule, shared sentence |
| `ch07-b17-14` | 'the two selected means differ by only 0.3 points. That gap is too small to rank the designs on its own, so we read it together with ...' | applied | Shared sentences. The reference to the print-only search table is dropped |
| `ch07-b17-15` | 'test file' -> 'test images' in the endpoint lead | applied | Word change carried into this edition's own sentence |
| `ch07-b17-16` | Pairing: 'the scores of the two arms, with and without BatchNorm, rise and fall together across seeds. Here it removed little: ...' | applied | Defines 'arms'; shared sentence |
| `ch07-b17-16a` | 'Fair' paragraph (this edition's own sentence, NOVEL block, qmd 250): 'because both arms encounter' -> 'because both designs encounter' | applied | Print's beta edit defines 'arms' at its first use (ch07-b17-16). This edition used 'arms' about 350 lines earlier, before that definition. a_0 and a_1 are the designs of the display above, so the meaning is unchanged and the definition now arrives at the first use, as print intends |
| `ch07-b17-17` | fig-experiment-estimands caption drops ', not confidence intervals' | applied | Shared Markdown caption |
| `ch07-b17-18` | 'A useful ablation has five parts' | applied | Shared sentence (this edition keeps its numbered list) |
| `ch07-n18-19` | Interaction notation Y -> \bar J (sentence and the I display) | applied | Notation pass R2/R3 missed by 1a9b356. This edition keeps its indices b and d |
| `ch07-b17-20` | 'is best read as a small factorial experiment, in which components can help or hurt one another' | applied | Shared sentence |
| `ch07-b17-21` | '... from transformed data. Why the clean-trained model is sensitive to shifts is a separate question.' | applied | Shared sentence |
| `ch07-b17-22` | HPO habits: 'A meaningful step is often a factor of ten, 10^-3->10^-2' (drops 'not 0.001->0.002'); 'the data scale'; 'to choose the next trial'; 'a badly specified search space' | applied | Carried into this edition's bullet list (structure kept) |
| `ch07-b17-23` | Successive halving: '81 epoch-units, where an epoch-unit is one configuration trained for one epoch' | applied | Term defined at first use. A replay quotes it, so the fixture literal and the scene-test string are listed |
| `ch07-b17-24` | 'The saving comes from pruning. Whether the strongest final configuration is kept depends on ... are. A slow-starting configuration ... The pruning policy is therefore part of the method and must be logged.' | applied | Shared sentences. A replay quotes them, so the literal and test string are listed. 'slow-starting configuration' stays this edition's wording (October 14, U05-1) |
| `ch07-b17-25` | 'Every look at the validation set informs a choice, so after hundreds of trials the selected configuration may partly fit quirks ...' | applied | Shared sentence |
| `ch07-b17-26` | 'The test set must stay out of this loop' and 'can no longer audit the revised procedure' | applied | 'this loop' became 'the selection loop', because print's antecedent is its print-only split-roles figure |
| `ch07-b17-27` | Seeds para 1: 'A seed makes one run reproducible, and the run still depends on the random choices that the seed selects'; 'One seed gives a single observed contrast, which is enough for a mechanism demonstration. A seed panel gives several contrasts and shows how much they vary from run to run.' Not carried: 'are built from expectations over the seed' -> 'are expectations over the seed' | partly | Beta answer to [so one seed gives ...] and [panel], carried. Print's 'are expectations over the seed' is false for Delta_tuned, which is a difference of maxima over lambda of seed expectations (the chapter's own display), not itself an expectation over s. This edition keeps 'are built from', and the sentence is reported to the author as a print erratum |
| `ch07-b17-28` | 'If one seed is hard for both models, pairing keeps that shared difficulty out of the design effect.' | applied | Shared sentence |
| `ch07-b17-29` | SD bullets: 'the run-to-run spread'; 'A confidence interval for a population mean needs more.'; 'and they cannot turn a toy subset into a broad benchmark' | applied | Carried into this edition's bullets |
| `ch07-b17-30` | 'It never draws a fresh training sample ...'; 'It says nothing about how the result would change with a different training sample.' | applied | Shared sentences. This edition's positive clause on repeatability is kept |
| `ch07-b17-31` | 'save the full resolved configuration with every setting filled in' | applied | Shared sentence |
| `ch07-b17-32` | Protocol step 6: 'Select on validation, then evaluate ...' | applied | Shared list item |
| `ch07-b17-33` | 'The seeded sweep of @sec-06 is a mechanism demonstration, and it estimates no scaling law.' | applied | Shared sentence |
| `ch07-b17-34` | Recap: item 1 and item 3 semicolons split; item 5 heading 'Select on validation and audit on test' | applied | Carried into this edition's recap wording |
| `ch07-b17-35` | Exercise 6: '... trained on it.” One predetermined estimate ...' | applied | Shared sentence |
| `ch07-old-01` | 'Neither estimand is universally fair' paragraph (qmd 291-292): 'fair to the question of a controlled intervention ... fair to the question of attainable performance' -> 'fair to a question about ... fair to a question about' | applied | A missed older print change, outside this delta. Print has read 'a question about' since at least the Oct 11 01:47 backup. The Oct 14 carry (ch07-006) took only 'whereas' and 'The error is ...', and no record keeps 'the question of' deliberately (clarity_proposals C2-35 rejected a different, HTML-internal rewrite). The sentence is shared, so print's wording reaches it |
| `ch07-n18-a1` | 'A metric J_{\mathcal{D}} on a dataset \mathcal{D} scores one run' and the display's left side | already | Carried by 1a9b356, in this edition's wording |
| `ch07-b17-a2` | Recap item 6: 'A standard deviation across seeds differs from a confidence interval' | already | This edition already reads 'distinguish standard deviation from a confidence interval' |
| `ch07-b17-a3` | HPO: grid/random-search semicolon split | already | Already separate sentences here |
| `ch07-b17-nc1` | Captions/alt text of fig-ch07-fixed-tuned, fig-ch07-interaction (J-bar), fig-ch07-halving, fig-ch07-split-roles | not-carried | Print-only TikZ figures |
| `ch07-b17-nc2` | run_once paragraph: 'The run's seed fixes the initial weights. It also seeds a second random generator ... uses a fixed seed of its own.' | not-carried | Print-only text that stands in for the code cell (ch07-sweep-03 of October 8) |
| `ch07-b17-nc3` | Companion entry Animation 7.A semicolon split; references to tbl-batchnorm-search and Listing 7.1 | not-carried | Companion lists, listings and print-only table |
| `ch07-r19-w1` | Oct 19 review diff for Ch 7 (review-2026-10-19/review-ch07.diff: 'such a loop of diagnosis and comparison', 'None of these results', BatchNorm 'normalizes ... learned scale and shift', 'batch 100, 20 epochs', 'Best-epoch validation') | not-carried | Watch item. The master ch07.tex (Oct 18 21:46) contains none of these changes and still reads 'rescales ... using statistics of the current batch'. If that review reaches the master later, ch07-b17-09 and the opening paragraph need another carry |

### Chapter 8 (`part2/07-filters-convolution.qmd`)

Baseline: the backup of October 18 11:34 (beta readers, Chapters 8 to 13). The beta-reader edits of October
18, the notation pass, density row D8-01 and the October 19 change to Listing 8.1 (ch08-o19-11). Outcomes:
applied 10, already 2, not carried 5, needs author 1.

| Entry | Print change | Outcome | Reason |
|---|---|---|---|
| `ch08-o19-01` | Moving-average opening (One-dimensional filtering section): 'the mean of its neighborhood: locality, with *uniform* weights:' became 'the mean of the points around it. Each output reads only a small neighborhood of the input, which is locality, and every point in that neighborhood gets the same weight, a *uniform* weight.' | applied | Beta-reader edit to a sentence both editions share. In the fix pass it now ends with print's period, so it matches print exactly. The October 8 record (ch08-rev8-01) shows the old colon was kept only because the box-average literal pinned it. Under the October 16 rule the literal follows the carried sentence, audit_plan_code.py needs no colon, and the chapter's other Plan blocks follow a period or a question. This breaks the box-average manifest literal and the receipt's prose quote; both are listed under fixture_changes. |
| `ch08-o19-02` | fig-moving-average caption: '$1/9$; the nine products sum' became '$1/9$. The nine products sum' | applied | Book-wide rule against semicolons joining clauses. Not carried: print's a)/b) panel letters, the Companion Experiment 8.A tag and the alt text, which describes print's variant figure. |
| `ch08-o19-03` | fig-filter-zoo caption: 'centered at zero; each column' became 'centered at zero. Each column', and '0.8); the bottom row' became '0.8). The bottom row' | applied | Book-wide rule against semicolons joining clauses. The Companion Experiment 8.C tag is print-only, and the Unicode 3×3 stays (October 14 decision). |
| `ch08-o19-04` | Naming the operation: the bare offsets u, v became a, b ('sits $a$ rows and $b$ columns ... with $a$ and $b$ running ... negative $a$ ... negative $b$') | applied | Finishes the notation pass. Commit 1a9b356 renamed only the subscripts and the display, so the paragraph read '$[V]_{a,b}$ sits $u$ rows'. Print's pointer to fig-conv2d-mechanics a is not carried because that figure is print-only TikZ. |
| `ch08-o19-05` | Translation equivariance, last paragraph: 'measured at its output, not presumed.' became 'measured at its output.' | applied | Beta-reader rule: no 'X, not Y' and no defensive sentences. |
| `ch08-o19-06` | Matrix view: Toeplitz is now defined. 'Each row also shifts the same three weights one column to the right (weight sharing), so every diagonal of the matrix holds one constant value. A matrix whose diagonals are constant is called a *Toeplitz* matrix, and this one is a banded Toeplitz matrix.' | applied | Beta-reader mark on 'Toeplitz'. The definition matches this edition's fig-shared-matrix, where every diagonal holds v1, v2, v3 or 0. |
| `ch08-o19-07` | Limitations list, item 1: 'rather than fitted to the classification task' became 'and nothing fitted them to the classification task' | applied | Beta-reader rule: no 'X, not Y'. |
| `ch08-o19-08` | Okay-so recap, item 3: '**Equivariance is exact on the interior**, not approximate:' became '**Equivariance is exact on the interior**:' | applied | Beta-reader rule: no 'X, not Y'. |
| `ch08-o19-09` | Exercise 3: '$[Z']_{i,j} = [H]_{i-s,j}$' became '$[Z']_{i,j} = [Z]_{i-s,j}$' | applied | Notation pass. Commit 1a9b356 had renamed only the left side. |
| `ch08-o19-10` | fig-moving-average caption: 'computed with `F.conv1d`; the box marks' became 'computed with `F.conv1d`. The box marks' | applied | Found in the whole-chapter reading. Print has had this wording since before October 12 and earlier carries missed it. It sits in the same caption and falls under the same rule as ch08-o19-02. |
| `ch08-o19-11` | Listing 8.1 code: k became v (kh, kw = v.shape; v_test; the gap line), and .squeeze() became [0, 0] | already | Cell manual-conv already has v (notation commit 1a9b356) and [0, 0] (the uncommitted Oct 19 port in this worktree). |
| `ch08-o19-12` | Exercise 4: `k` / `k.flip(0, 1)` became `v` / `v.flip(0, 1)` | already | Already in this edition since 1a9b356. 'of Listing 8.1' and the Companion Experiment tag are print-only. |
| `ch08-o19-13` | fig-conv2d-mechanics alt text and caption: [H] became [Z], and a semicolon was split | not-carried | Print-only TikZ figure. This edition does not have it. |
| `ch08-o19-14` | Check footnote, density row D8-01: the digits 4.8e-7 and the 10×12 image moved to 'Companion Experiment 8.B checks it ... before we rely on it' | not-carried | This edition is the companion, so the footnote keeps its check digits. The 10-18 record already says nothing carries for Ch 8. |
| `ch08-o19-15` | Listing 8.1 notes: K_h/K_w, split semicolons, 'giving H' by W' windows', '[0, 0] removes exactly those two' | not-carried | Listing notes are print-only. |
| `ch08-o19-16` | Zoo paragraph: 'The vertical Sobel kernel has rows ..., and the horizontal one is its transpose.' (semicolon split) | not-carried | The sentence belongs to print's prose description of the zoo cell ('The synthetic scene holds a rectangle ...'), which this edition never had. Here the cell prints the kernels. |
| `ch08-o19-17` | Companion list, Animation 8.B entry: semicolon split | not-carried | Companion lists are print-only. |
| `ch08-o19-18` | Sobel columns paragraph after fig-filter-zoo: 'responds to the rectangle's sides and not to its top and bottom' became 'responds to the rectangle's sides and stays dark along its top and bottom' | needs-author | Applying it would make the text contradict the figure and the animation, in this edition and in print. The response maps are signed and shown in grey on an automatic scale, so a zero response is mid-grey like the background. The rectangle's top and bottom show as background grey, and the dark stripe is its right side (about -3.6). I confirmed this in the frozen PNG and in print's fig-filter-zoo.pdf. The sobel-split replay beside this paragraph states it directly: its scope note (interactives/sobel-split/panel.html:50) says the -3.6 response 'is why that side prints dark and the left side bright in the zoo's gray panels'. Carrying 'stays dark' would contradict the animation, which the October 16 rule protects. The HTML keeps its accurate old sentence. Recommended for both editions: 'stays silent along its top and bottom'. 'Stays silent' is the panel's own word and this edition's wording before October 16 (ch08-005). Alternative: 'gives zero along its top and bottom'. If a wording is chosen, the sobel-split manifest literal changes with it (line breaks kept). The stale quote in docs/sobel-split-excerpt.md:16-18 should be refreshed too. |

### Chapter 9 (`part2/08-cnn.qmd`)

Baseline: the October 18 11:34 backup. Mostly the beta-reader edits of October 18 and the $K \to V$ renames
in running prose; PR #29 had carried the rules and density rows. Outcomes: applied 18, already 6, not
carried 11.

| Entry | Print change | Outcome | Reason |
|---|---|---|---|
| `ch09-o19-01` | Data and shapes box: semicolon split and the shape-order sentence (print box before the NCHW warning) | not-carried | Print-only prose stand-in for the setup cell. This edition shows the split and shapes in the cell and has no such box (listings and their prose versions are print-only). |
| `ch09-o19-02` | Kernel-recovery lead rewritten (section 'Learning a kernel from input-output pairs', first paragraph) | already | Carried by PR #29 (9166e96). The HTML text matches print. |
| `ch09-o19-03` | Listing paragraph: 'start our kernel V (K in the code)... update V' | not-carried | Listing prose is print-only. Print's K/V gloss is kept in this edition's notation sentence instead (see ch09-o19-07). |
| `ch09-o19-04` | fig-learned-kernel caption: 'The learner saw only input-output pairs generated by Sobel, never the Sobel coefficients themselves' (panel a sentences and the Description's K->V also changed) | applied | The panel b sentence is shared and is carried into the fig-cap cell option (caption prose only). The panel a text and alt text belong to print-only TikZ. |
| `ch09-o19-05` | Loss-record sentence and 'largest gap 0.018' sentence deleted; 'Over the 600 steps the loss falls...' (after the learn-kernel cell) | applied | 'Over the 600 steps' carried into the shared sentence. The deleted check-digit sentences were never in this edition's prose (confirmed at HEAD): the cell prints them, as the companion rule D9-01/D9-02 requires. |
| `ch09-o19-06` | 'is linear in the kernel V' (was K) in the convex-quadratic parenthesis | applied | Notation pass (K->V), shared sentence, now matches print exactly. |
| `ch09-o19-07` | Gradient paragraph: 'the kernel is V and the output map is Z'; 'map of loss derivatives' | applied | Carried as 'the kernel is $V$ (`K` in the code) and the output map is $Z$'. Print's gloss '(K in the code)' sits in its print-only listing paragraph, so it moves into this sentence, following the Oct 14 decision ch09-005. Reviewed and kept: the reviewer's alternative (gloss at line 159) leaves an equally off-print sentence, and @eq-crosscorr already defines $V$. This also fixes the HTML's stale '$H$', which contradicted the $[Z]$ display and @eq-crosscorr. The display notation was already carried by 1a9b356. The HTML keeps its own 'reduction="mean" of F.mse_loss' where print points to its listing. |
| `ch09-o19-08` | In-channels bullet: 'instead of one pixel'; 'Each k x k kernel ... a 6 x k x k volume ... The LeNet we build below uses k = 5, so its volumes are 6 x 5 x 5.' | applied | Shared bullet body, not a fixture literal. conv2's kernel_size=5 confirms k = 5. The bullet label differed from print before this window and stays, like the Out-channels label in the Oct 14 record. |
| `ch09-o19-09` | eq-conv-layer: H_o->Z_o, u,v->a,b | already | Carried by the notation branch 1a9b356. |
| `ch09-o19-10` | fig-channel-mechanics Description and caption notation (Z, a,b) | not-carried | Print-only TikZ figure. |
| `ch09-o19-11` | Combining detectors: 'rather than of raw pixels' dropped; edge energy defined in bold with its meaning; 'then sums the two maps' | applied | Shared paragraph. No fixture literal is involved. |
| `ch09-o19-12` | Modules tip: 'optimizes the kernel V directly' | applied | Notation change in a shared sentence. V is glossed as the code's K in ch09-o19-07. |
| `ch09-o19-13` | fig-padding-stride caption semicolon split | not-carried | Print-only TikZ figure. |
| `ch09-o19-14` | Stride: 'downsamples with learned weights, while the pooling of Section 9.4 downsamples with a fixed rule' | applied | Connective carried. The HTML already said plain 'pooling', without the section pointer, before this window; kept. |
| `ch09-o19-15` | Output-size three-cases paragraph: 'stops. With the channel counts...' | not-carried | Print's prose version of the shapes cell, with no counterpart here (confirmed absent at HEAD). The out-size anchor and literal paragraph stay unchanged. |
| `ch09-o19-16` | Pooling construction: 'counting from 0. Then move both' | not-carried | Print's prose version of the pool-invariance cell, with no counterpart here (confirmed absent at HEAD). |
| `ch09-o19-17` | 'That equality belongs to this construction. In general, a shift can change... by an amount that depends on the activations and their alignment, so we test the complete network on shifted garments.' | applied | Shared paragraph, quoted by the pooling-bins replay. Carried under the Oct 16 decision, and the fixture literal must follow (listed). It is not one of the six kept sentences, and the panel's claim does not conflict with it. A scratch-copy simulation with the new literal passes test_pooling_bins_excerpt.cjs 54/54. |
| `ch09-o19-18` | Receptive fields: new definition paragraph, 'Pooling makes the field grow faster' paragraph, four-stage numbered list, closing 'The final field covers more than half the frame...' | applied | Beta-reader rewrite of a shared paragraph. 'The LeNet built in the next section' holds here, because the LeNet architecture section follows. Print's figure pointer ('draws the four fields on one validation image, a coat') was already in the baseline and never in this edition, so it was not added. The arithmetic was re-checked: 5, 6, 14, 16 by r -> r + (k-1)g. |
| `ch09-o19-19` | fig-receptive-field caption: ', and the dense head then combines' | applied | Shared caption, carried in the fig-cap option. Unicode 5x5 kept, as decided Oct 14. The rest of the caption matches print. |
| `ch09-o19-20` | Attention footnote deleted | already | Carried by PR #29. |
| `ch09-o19-21` | fig-lenet-blocks caption ', and the shape' | not-carried | Print-only TikZ figure. |
| `ch09-o19-22` | Listing 9.3 note '(N,6,14,14), then' | not-carried | Listing notes are print-only. |
| `ch09-o19-23a` | 'We train both models once, with one seed, ...' | already | Carried by PR #29. |
| `ch09-o19-23b` | 'The comparison fixes the training schedule. It matches neither the parameter count nor the floating-point operations, which differ because...' | applied | Shared sentence. The listing sentences that follow it in print are print-only. |
| `ch09-o19-24` | Listing 9.4 note semicolon split | not-carried | Listing notes are print-only. |
| `ch09-o19-25` | 'so it cannot rank the architectures by their expected accuracy...'; 'Both models reach near-perfect accuracy on their fitting images.' | applied | Shared sentences. The HTML's own lead 'Read the clean-validation column:' did not change in this window and is kept. |
| `ch09-o19-26a` | Shift-rematch lead rewritten | already | Carried by PR #29. The HTML matches print. |
| `ch09-o19-26b` | 'Figure 9.6 shows the accuracy of both networks at each shift.' replaces the shift-protocol sentence | not-carried | The Oct 18 record lists the shift rematch's figure pointer as not carried. This edition has no 'As in Chapter 6, a shift moves every row...' paragraph, because the shift_right cell shows it. |
| `ch09-o19-27` | Shift numbers: 'LeNet 17.0. At three pixels...'; 'one validation split and one seed, and the contrast within this run is large.' | applied | Shared paragraph. |
| `ch09-o19-28` | Learned filters: 'structure. Others remain noisy' | applied | Shared sentence. |
| `ch09-o19-29` | Reused benchmark: reopened-test sentence deleted; 'with the budget of Listing 9.4' | already | D9-03 was carried by PR #29. This edition keeps 'the same training budget' where print refers to its listing. |
| `ch09-o19-30` | Recap items 2 and 3 (', and'), item 6 ('a gap too small to rank them'; 'The comparison is between two complete models, so it isolates no single architectural constraint.') | applied | Shared recap text. The whole recap now matches print. |
| `ch09-o19-31` | Exercise 2 rewritten: turn the four stages into the rule r -> r + (k-1)g, then verify 5->6->14->16 | applied | Shared exercise. \secref became the same-chapter link [the receptive-field section](#how-far-a-deep-neuron-sees), this edition's form for a section without a sec- id (as in Chs 1, 10 and 15). |
| `ch09-o19-32` | Exercise 5: 'keep and discard. We will build one' | applied | Shared sentence. |
| `ch09-o19-33` | Companion material list: Exercise 3/4 pointers, sentence splits | not-carried | Companion lists are print-only. |

### Chapter 10 (`part2/09-modern-cnns-transfer.qmd`)

Baseline: the October 18 11:34 backup, split with the intermediate backups into four stages: the beta-reader
edits (new here), the notation pass (carried by PR #29 apart from one alt text, ch10-n1), the density rows
(decided by PR #29) and the October 19 review (ch10-r01). D10-16 is now partly carried. Outcomes: applied
15, partly 2, already 3, not carried 6, needs author 1.

| Entry | Print change | Outcome | Reason |
|---|---|---|---|
| `ch10-b01` | 'can cost more, not less' -> 'can cost more parameters than the single layer' (Why 5x5? section, paragraph after kernel-economics) | applied | Beta-reader edit (no 'X, not Y') to a shared sentence that nobody had carried. |
| `ch10-b02` | Paragraph after bn-drift: 'are different quantities, but the stack's weights and nonlinearities shape both. Poorly scaled activations are therefore a warning to inspect the gradient flow directly' | applied | Beta-reader edit (no 'X, not Y', no semicolon) to a shared sentence. |
| `ch10-b03` | Building with blocks: 'once. A block stacks atoms and pools, and a network stacks blocks.' | applied | Beta-reader semicolon rule on a shared sentence. |
| `ch10-b04` | 1x1 paragraph: 'rather than the k^2 C_in C_out weights' -> 'against the ...' | applied | Beta wording of a sentence this edition keeps. Print later cut the paragraph (D10-07), and PR #29 did not carry that cut. The pixel-skewer literal 4 is unchanged. |
| `ch10-b05` | fig-cliff-gap caption: '...four pixels of shift, while NINSmall, with its...' | applied | Beta semicolon rule on a shared caption. |
| `ch10-b06` | Inception callout: 'bottleneck, which compresses channels...'; 'Take one 5x5 branch that maps 256 input channels to 128 output channels. Applied directly, it holds ... With a 1x1 squeeze to 32 channels first, it holds ...'; 'We will not build Inception here. The part that transfers to other designs is its principle...' | partly | Carried the beta-reader answer to the mark 'at 256 channels', the semicolon splits and current print's 'which compresses'. Not carried: print's move of the box into a Deeper dive and its compressed version without the arithmetic, because boxes stay here and the companion keeps derivations. So 'spatial' and 'its principle' follow the beta text. |
| `ch10-b07` | Training deeper networks: 'degradation problem' in bold and 'fitted its training set worse'. New sentences say why degradation is surprising (the deeper net contains the shallower one, 36 extra identity layers) and that both networks use BatchNorm, so the failure has another cause | applied | Beta-reader answer to the brace mark on the plain-versus-residual paragraph. The paragraph is shared and no fixture is touched (56 - 20 = 36). |
| `ch10-n1` | fig-residual-stream alt text: 'The sum H of x equals...' -> 'The sum u equals...' | applied | The notation pass (H(x) -> u) reached print's Description. PR #29 changed the caption and the drawn label but missed this alt text. |
| `ch10-b08` | fig-gradient-highway caption: 'is 2.2e-23. A float32 norm calculation reports zero...' | applied | Beta semicolon split of a caption sentence this edition keeps. Print later dropped the digits (D10-12, companion). |
| `ch10-b09` | DenseNet bridge (unsigned NOVEL block, markers kept): ', and the block above applies a ReLU'; 'grows. Transition layers compress channels and downsample...'; 'a different operation from residual addition' | applied | Beta edits to a box this edition keeps (decision 4 of Oct 16). Current print's 'and Block applies' follows its move of the box into the Deeper dive. That move is not carried, so 'the block above' stays. |
| `ch10-b10` | Tips 'Residual streams beyond CNNs': 'Residual connections reach well beyond CNNs, and they became a central design device in many deep architectures. When we assemble...' | applied | Beta edit to a box this edition keeps. Print later deleted the box (D10-13). |
| `ch10-b11` | fig-scorecard caption: comma series, 'Parameter count measures storage and says little about training compute, and the four points rank these architectures only under this recipe' | applied | Beta rules (no semicolons, no 'not a universal ranking') on a shared caption. |
| `ch10-b12` | After the scorecard: 'parameters measure storage, and the plot shows neither optimizer steps, activation memory, nor total training work' | applied | Beta 'X, not Y' rule on a shared sentence. |
| `ch10-b13` | Shoe explanations, list items 1 and 2: ', and a look at the features...'; ', and we feed it 28-pixel grayscale images...' | applied | Beta semicolon splits of list items this edition keeps. Print later compressed them (D10-15, companion). |
| `ch10-d16` | Full ten-class task: 'The full task separates three questions: ... and what the architecture learns from scratch with all 50,000 fitting labels.' | partly | Only the density-pass rewording of D10-16's first sentence is carried, because it is the one sentence the two editions share and PR #29 had left its old wording. Print's second sentence ('Nine pinned ResNet-18 runs ... Companion Experiment 10.I holds the recipe') and the deleted recipe footnote stay out: this edition never had either (10-08 ruling ch10-sweep-14). The record of this carry must say D10-16 is now partly carried, since the 10-18 record lists it as 'kept here (companion)' (review nit 2, noted in the notes file). |
| `ch10-d16-recipe` | Print's density pass deleted the full-data transfer recipe footnote (12 epochs, AdamW, batch 128, cosine from 3e-3/3e-4/1e-3, resize 232 then crop 224, flip, ImageNet normalization) and points to 'Companion Experiment 10.I holds the recipe' | needs-author | Verified (review item 1). This edition's Experiment 10.I (transfer-full-summary) only loads the nine records, and no version of the chapter ever stated the recipe (git log -S finds neither '232 pixels' nor 'Nine pinned'). The recipe lives only in experiments/rivanna/fashion_transfer.py, which matches the old footnote. After print's density pass, neither edition's text states the recipe. No carry rule settles this: the companion rule keeps what this edition already has, and the 10-08 and 10-18 rulings kept the recipe out. Not applied. The author can choose (1) the ready-to-paste beta-split footnote recorded in the notes file, which reverses ch10-sweep-14 for this footnote and needs a re-render, or (2) a print-side pointer adjustment. |
| `ch10-b14` | 'is not specific to vision' -> 'reaches beyond vision' | applied | Beta 'X, not Y' rule on a shared sentence. |
| `ch10-b15` | Recap item 3: 'scored below it on centered images. The trunks also differ...' | applied | Beta semicolon rule on a shared sentence. |
| `ch10-r01` | Scorecard section: 'These are full-data variants, wider than the networks built above: ... (1,084,010).' | already | Oct 19 review correction, already in the worktree's uncommitted changes. The counts match experiments/rivanna/results/scorecard/*.json. |
| `ch10-n2` | Residual section notation: u = x + F(x), \loss, d\loss/du, 'Here \loss is the training loss, I is the identity', caption u, recap item 4 | already | Carried by the notation commit 1a9b356 (PR #29). |
| `ch10-d-carried` | Density rows D10-02 (reopened benchmark), D10-04 (table digits), D10-08 (head of Ch 2, shift procedure), D10-09 (NiN full-data number), D10-17 (transfer digits) | already | Carried by PR #29 (eba3468). The beta rewording 'These comparisons are descriptive...' was in the D10-02 paragraph, which both editions have now removed. |
| `ch10-d-kept` | Density rows D10-01, D10-03, D10-05, D10-06, D10-07, D10-10, D10-11, D10-12, D10-13 (including the new 'residual stream' sentence after F = 0), D10-14, D10-15, D10-18; Exercise 2 'of the Deeper dive' | not-carried | Decided by PR #29 (print_revisions_2026-10-18.md): the companion keeps details, boxes and structure stay, the 1x1 cut is justified only by a print-only figure, and this edition has its own sentences. The tips box here already names the residual stream. The Inception callout stays in the body, so Exercise 2 keeps 'from the callout'. |
| `ch10-b16` | BN warning, last sentence: 'To judge how reliable the batch statistics are, count the values they average per channel, over the batch and both spatial axes, as well as the number of images.' | not-carried | One of the six sentences kept for the animations: batch-ruler's test and panel bind 'BN needs real batches ... unreliable at tiny batch sizes'. |
| `ch10-b17` | bn-drift stack description: colon join ('conv layers: a convolution from one channel to 16, ...') and 'normalization. Its BatchNorm layers are fresh' | not-carried | This is print's prose version of the bn-drift cell and has no counterpart here. The HTML sentence before the cell already ends in a colon. |
| `ch10-b18` | Print-only TikZ captions: fig-nin-mechanics (bold W x + b), fig-residual-stream ('grid size. Block never needs it'), fig-transfer-regimes (semicolon splits) | not-carried | Print-only TikZ figures. This edition's fig-residual-stream caption has no dashed-1x1 sentence. |
| `ch10-b19` | lst-residual-block note; scorecard and full-data recipe footnotes; shoe probe-setup paragraph; companion list (Animations 10.A, 10.C) | not-carried | Listing notes, print's recipe footnotes, the listing-prose paragraph and the companion list are print-only. The full-data recipe gap that print's density pass opened is recorded separately under ch10-d16-recipe. |
| `ch10-h01` | None in print. Review nit 3 targets this edition's own sentence '...benchmark of @sec-06-generalization-inductive-bias; the code keeps the familiar `X_te` name for them.' | not-carried | The sentence is HTML-only (PR #29's D10-02 sentence) and print has no shared counterpart. The no-semicolon rule is a print beta-reader rule, not one of VOICE.md D11 to D13. The other units of this carry leave HTML-only sentences unchanged (for example Ch 17's 'The code below is the frozen protocol; ...'). The optional split is recorded in the notes in case the author extends the rule. The BN warning's 'directions; look for it.' stays in any case (batch-ruler). |

### Chapter 11 (`interludes/making-pca-learnable.qmd`)

Baseline: the October 18 11:34 backup. The beta-reader edits of October 18 (the opener now begins with
compression), density rows D11-01 to D11-04, two notation rows and a sentence-splitting pass. The NOVEL
spans N12 to N14 take print's wording under decision 1 of October 16, markers kept. Outcomes: applied 19,
partly 2, already 1, not carried 10, needs author 3.

| Entry | Print change | Outcome | Reason |
|---|---|---|---|
| `ch11-o19-01` | Opener (qmd paragraph 1): the three variable-length paragraphs are replaced by print's paragraph beginning 'Most networks of Part II learned their filters from labels... learns features without labels, by compression...' | applied | Beta-reader edit (p. 163). Matches print word for word. |
| `ch11-o19-02` | Opener, before the figure: the two-question list is replaced by 'The chapter ends with two limits of a fixed code. A code computed in one pass cannot be updated as a sequence arrives one element at a time (@fig-fixed-code-bridge), which Part III addresses. And a code says nothing about how to generate new data, which @sec-19-generative addresses.' | applied | Beta-reader edit (p. 163). Adapted only because the figure stays in the opener (o19-03), so this edition keeps a pointer to it. Review fix: the pointer now sits on the sequence sentence. The figure shows only the sequence limit (its bottom row) and nothing about generation, and moving the pointer makes the first sentence match print word for word. @sec-19-generative is kept off the start of a line. |
| `ch11-o19-03` | fig-fixed-code-bridge moved to the closing section 'From fixed-size inputs to sequences' | needs-author | A structural move that also moves code. The figure's cell is the chapter's first cell and holds the notebook-support setup (notebook_manifest support cell_ordinal 1), along with the N12 span and the aefig alias. The figure stays in the opener. The author question now includes the beta reader's p. 164 mark: the 'short sequence' and 'long sequence' labels read as out of place in an opening that no longer discusses variable-length data. |
| `ch11-o19-04` | Closing section: '@fig-fixed-code-bridge sets the two regimes side by side.' added after the translation question | applied | Print's pointer. Here it refers back to the figure in the opener. |
| `ch11-o19-05` | 'The squared error is one choice of autoencoder loss among several.' | applied | print edit |
| `ch11-o19-06` | BCE sentence split: 'instead. Applied to gray levels in $[0,1]$, the same formula is a common surrogate, and it is no longer an exact likelihood.' | applied | print edit |
| `ch11-o19-07` | Warning box: 'is an empirical claim, and $k&lt;d$ alone does not imply it.' | applied | print edit |
| `ch11-o19-08` | Make PCA learnable: defines principal directions and orthonormal, and adds the entry-wise reading of V_k^T V_k = I_k | applied | Beta-reader edit (p. 165) |
| `ch11-o19-09` | 'It does not promise that every optimizer run succeeds, or that the learned weights equal a particular PCA basis.' | applied | Print edit. It breaks one scene-test regex (see notes). |
| `ch11-o19-10` | Note title 'Same subspace, not the same coordinates' -> 'Same subspace, different coordinates' | needs-author | The same-subspace panel intro (interactives/same-subspace/panel.html:15) quotes the note by its old title, and test_same_subspace_excerpt.cjs requires that heading. Carrying the retitle would mean changing panel text, which the animation rule forbids (the same principle as the six kept sentences and U07-1f/g). The title is kept. |
| `ch11-o19-11` | Note body: ', and the reconstruction projector stays fixed.' and 'Compare reconstruction products, projectors, or principal angles. Raw latent coordinates can differ between equally good solutions.' | applied | Print edit. Two same-subspace fixture literals follow. |
| `ch11-o19-12` | After the curve display: a new paragraph explaining (t, t^2), the 1/3 offset, the variance 0.2 and the round 0.1 MSE | applied | Beta-reader addition (p. 166). Math re-derived: Var(t) = 1/3; Var(1.5(t^2 - 1/3)) = 0.2; the covariance is 0; per-coordinate MSE 0.1, which matches the printed 0.100000030. |
| `ch11-o19-13` | 'The comparison is about representational shape: the nonlinear model has far more parameters, so the study says nothing about parameter efficiency.' | applied | Print edit. The 513-sample sentence stays print-only (prose standing in for code), and 'Before you run it' stays. |
| `ch11-o19-14` | lst-tied-linear-ae listing notes | not-carried | listing notes are print-only |
| `ch11-o19-15` | Check-digits sentence -> 'Companion Experiment 11.A prints both' (D11-01) | not-carried | Companion rule. This edition has no such sentence, and the cell prints both values. |
| `ch11-o19-16` | tbl-curve-nonlinear in units of 10^-6 with three decimals | not-carried | Print-only table. This edition shows the cell output (no code change). |
| `ch11-o19-17` | fig-linear-nonlinear-ae caption: 'shows a mechanism and claims no general advantage for nonlinear autoencoders' | applied | Print edit inside N13. The rest of the caption is this edition's own shorter version. |
| `ch11-o19-18` | The paragraph after the figure is replaced by print's current text ('...leaves extrapolation beyond it untested (Exercise 2). Nonlinearity alone does not guarantee that the code is meaningful...') | applied | Print's current paragraph, inside the author-signed span N13; the marker is kept. Corrected basis: decision 1 of October 16 (carry the language everywhere), with precedent in U07-3 and in ch15-001/ch16-001 (print wording in the signed spans N18 and N22). Decision 4 does not apply, because it covers unsigned blocks. Print's current text closes the paragraph part of the 10-08 hold ch11-rev14-04 and supersedes the 10-08 'If approved' wording. The anomaly-sentence and 9^d-box parts stay held under U07-4. No claim changes. |
| `ch11-o19-19` | 'The phrase names the goal, and a bottleneck need not recover a true manifold or its preferred coordinates.' | applied | Print edit. The flat-line end string and its anchor still hold. The anomaly sentence stays out (U07-4). |
| `ch11-o19-20` | The 9^d grid box rewritten (beta-reader p. 168) | not-carried | The box is absent here (held structural item, U07-4 decision 3). If the author adopts it, use print's current text. |
| `ch11-o19-21` | Overcomplete/sparse paragraph: semicolon split | not-carried | The paragraph is absent here (U07-4). |
| `ch11-o19-22` | The 'Clean -> clean...' paragraph rewritten in full sentences ('Training with clean inputs and clean targets teaches reconstruction...') | applied | Beta-reader edit (p. 170), inside N14; the marker is kept. A terminology gap the rewrite leaves in both editions is flagged for the author in the notes (input-target contract). |
| `ch11-o19-23` | 'to reduce spatial resolution, and its decoder expands' | applied | print edit |
| `ch11-o19-24` | 'convolution with fixed weights $\matr{K}$, then' | applied | Notation row ch11-04: 1a9b356 carried only the symbol. |
| `ch11-o19-25` | Adjoint paragraph: the matrix view of @fig-shared-matrix (4x6 and its 6x4 transpose), 'defines an adjoint, which differs from an inverse', 'gives the decoder a learnable map with the right shapes, and it does not undo the encoder' | applied | Beta-reader edit (p. 171). Print's Fig. 8.4 is this edition's @fig-shared-matrix, and the shapes were verified. |
| `ch11-o19-26` | Adjoint-check digits and footnote -> Companion Experiment 11.C (D11-02) | not-carried | Companion rule. Here the check appears only in code and printed output. |
| `ch11-o19-27` | Reopened-benchmark sentence removed (D11-03) | already | carried by PR #29 (b7c77ba) |
| `ch11-o19-28` | Transposed-convolution output-size rule s(m-1)-2p+K_h, and why the kernel is 4x4 (7->14->28 against 7->13->25) | needs-author | Beta-reader addition (p. 172) to print's layer-by-layer paragraph, which here is print-only prose standing in for code. Placing it needs a new lead-in, as in 10-08 rev14-05/-12. Suggested place: after the shape table. |
| `ch11-o19-29` | Footnote with Adam 0.003, 30 epochs removed (D11-04) | not-carried | Companion rule. The settings are in this edition's code. |
| `ch11-o19-30` | lst-denoising-step note and tbl-conv-ae caption: semicolon splits | not-carried | listing notes and print tables are print-only |
| `ch11-o19-31` | U-Net paragraph edits, the new biomedical-origin sentence (beta-reader p. 174), and the fig-unet caption | not-carried | Held U-Net material (U07-4). fig-unet is a print-only TikZ figure. |
| `ch11-o19-32` | Bullet: 'must pass through the same static handoff. Once the encoder discards...' | partly | The wording is carried. Print's U-Net and position-by-position sentences stay out because they depend on fig-unet. |
| `ch11-o19-33` | 'Padding or truncating inputs to a maximum length gives no incremental update rule either. What we need is a time-homogeneous state update, one rule applied at every step:' | applied | print edit |
| `ch11-o19-34` | Recap items 2-4: 'because the latent coordinates are arbitrary'; 'It gains capacity, with no guarantee that the code is meaningful.'; 'and it does not invert the encoder.' | partly | The wording is carried. Item 4's U-Net sentence stays out (U07-4). |
| `ch11-o19-35` | Exercise 7 punctuation | not-carried | Exercise 7 is absent here (U07-4). |

### Chapter 12 (`part3/10-sequences-rnn.qmd`)

Baseline: the October 17 15:31 backup. The delta holds the October 17 rename at the cell-state node (in
ch12-o19-30) and four stages split with the intermediate backups: the beta-reader edits of October 18
morning, the notation and rules pass, the density pass and the October 19 correction (ch12-o19-15).
Four passages that PR #29 kept and print's density pass later cut take the beta-reader wording.
Outcomes: applied 25, partly 4, already 9, not carried 17.

| Entry | Print change | Outcome | Reason |
|---|---|---|---|
| `ch12-o19-01` | Six goals list compressed (Any length, Order, Reach, Trainable reach) | already | D12-01, carried by PR #29 |
| `ch12-o19-02` | 'fails any length and streaming outright'; four-tools preview split then deleted | already | D12-01 and D12-02, PR #29. The beta-reader split of the preview no longer matters. |
| `ch12-o19-03` | Window paragraph: 'The window thus fails reach' | already | D12-01, PR #29 |
| `ch12-o19-04` | fig-sequence-designs caption: semicolons become full stops | not-carried | print-only TikZ figure |
| `ch12-o19-05` | Function-per-timestep paragraph: 'grows with sequence *length*:' (colon, was semicolon) | applied | beta-reader edit. 'fails any length and length-independent parameters' was already carried (D12-01). |
| `ch12-o19-06` | After eq-recurrence: 'The rule is *time-homogeneous*: the same at every step. That is a property of the model, and the data distribution may still change along the sequence.' | applied | beta-reader edit replaces the 'not a claim that ... stationary' sentence |
| `ch12-o19-07` | Markov-property callout: 'Whether h_{t-1} keeps everything about the past that the best prediction needs is a separate question.' | applied | beta-reader edit |
| `ch12-o19-08` | Readout paragraph: '(classifying the whole sequence). Both designs appear below.' | applied | beta-reader semicolon split. 'you can' stays, as decided in rev15-18 (VOICE pronoun rule). |
| `ch12-o19-09` | Manual-loop lead: '... verify it against the framework. The two results agree to within rounding error.' | applied | beta-reader split of the shared clause. Print's listing lead is print-only. |
| `ch12-o19-10` | lst-manual-rnn code: V, H, T, B renamed D, H, T, B | already | Cell setup-and-manual-rnn already reads D, H, T, B = 8, 16, 12, 4, so no code change was needed. |
| `ch12-o19-11` | lst-manual-rnn notes name D, H, T, B; 'Their sum'; 'for t = 1..T' | not-carried | Listing notes are print-only. |
| `ch12-o19-12` | Shape paragraph: 'An MLP takes input of shape (batch, features). With batch_first=True, ...'. Print later deleted the paragraph. | partly | The beta-reader split is applied. The deletion (D12-03) is not carried, as PR #29 decided (listing notes are print-only). Recorded in the notes' carry-record section (beta-reader stage wording for a kept passage). |
| `ch12-o19-13` | fig-unrolled-rnn caption: recursion text removed | not-carried | print-only TikZ figure (D12-04) |
| `ch12-o19-14` | BPTT recursion rewritten in steps: 'runs the chain rule backward. It uses g_t ... (its adjoint, in the language of @sec-05-backpropagation). The recursion starts ... Each step back then does three things ... The recursion ends at g_0 ..., because no loss is attached to h_0.' | applied | beta-reader edit. Print's 'dark red' backward-route sentence is print-only (fig-unrolled-rnn). |
| `ch12-o19-15` | Vanishing paragraph, Oct 19 correction: 'To preserve gradients over many steps, the cumulative Jacobian product must remain well scaled ...' | already | carried by this worktree's Oct 19 port |
| `ch12-o19-16` | Vanishing paragraph: 'In an RNN every factor ...', 'That balance is fragile, and it is easily lost. Initialization can at least start there. An orthogonal ...', 'Training then moves ... as the pre-activations grow' | applied | Beta-reader wording that the Oct 19 port had left out ('Here', the colon, 'That balance is fragile.'). |
| `ch12-o19-17` | Vanishing paragraph end (10-sequences-rnn.qmd l. 285-286): 'so orthogonality governs only the start of training (Exercise 2).' becomes 'so orthogonality helps only at the start of training (Exercise 2).' | applied | Beta-reader edit; print leads. Changed in the fix pass from needs-author: Springer finding 12-01's fix ('the norm guarantee of an orthogonal W_hh holds only at initialization') exists only on the scratch branch review-2026-10-19 (outcomes.md 'applied' means the scratch branch carries it; the README says the master is unchanged), the master still has 'helps only at the start', and every other chapter of this carry leaves that diff alone. No fixture, test or receipt quotes the clause. 12-01 stays an open author question for both editions (listed in the notes with the other shared scratch-diff hunks). |
| `ch12-o19-18` | Depth paragraph: 'In an RNN, depth is counted in time steps: a paragraph of text, read one word per step, is a network about a hundred layers deep.' | applied | beta-reader edit |
| `ch12-o19-19` | fig-vanishing-time caption: set-up sentences moved to Companion Experiment 12.B | not-carried | companion rule (D12-05, PR #29) |
| `ch12-o19-20` | After fig-vanishing-time: 'Learning the dependency is still possible, but it is fragile.'; density dropped 'At T=60 ... about 10^-15' | partly | The beta-reader sentence is applied. The restated digits stay (D12-05, companion, PR #29). |
| `ch12-o19-21` | Clipping callout: title 'Gradient clipping limits explosion and leaves vanishing alone'; '(nn.utils.clip_grad_norm_, which appears in every training loop below)' | applied | beta-reader edit. Callout titles carry no anchor. |
| `ch12-o19-22` | fig-truncation caption: semicolon becomes a full stop | not-carried | print-only TikZ figure |
| `ch12-o19-23` | Fixed-horizon paragraph: 'four steps back. Since 4 >= K' | applied | beta-reader edit |
| `ch12-o19-24` | Random-cut paragraph: the two costs, each in its own sentence (variance; memory budgeted for the longest chunk, the caching of @sec-05-backpropagation). Density later compressed the passage to one sentence with a Tallec and Ollivier footnote. | partly | The beta-reader answer to '[vague:]' is applied to the passage PR #29 kept. The D12-06 compression and footnote are not carried (companion rule). Recorded in the notes' carry-record section. |
| `ch12-o19-25` | Fixed-window paragraph: 'The character-level language model ... uses a simpler recipe that needs no cuts at all. It trains on random 100-character windows of text and starts each window from a zero state. This is fixed-window training. No state is carried ..., so it differs from truncated BPTT, and it is cheap enough for a small demonstration. ... In either recipe, clipping handles spikes, and no gradient crosses the horizon.' | applied | beta-reader edit (D12-07's sentence never existed here). The kept 'contiguous chunks of roughly 20-50 steps' sentence stays. Three detach-cut literals and one test string must change (listed). |
| `ch12-o19-26` | LSTM lead: 'We build the memory in four steps:' | applied | beta-reader edit |
| `ch12-o19-27` | LSTM list: 'Add to the memory' (identity Jacobian, residual u = x + F(x) of @sec-09-modern-cnns-transfer), 'Erase with a forget gate' (near 0 erases, near 1 keeps), 'Write with an input gate' (product is the update Delta_t), 'Read with an output gate' (scales tanh(c_t) into h_t) | applied | Beta-reader edit plus the notation pass. The fig-lstm-parts pointers are print-only. The item 3 and 4 clauses held since 10-08 for the lstm-valves literals now come in under the Oct 16 rule. Three lstm-valves literals must change (listed). |
| `ch12-o19-28` | fig-lstm-parts row labels and caption | not-carried | print-only TikZ figure |
| `ch12-o19-29` | fig-lstm-conveyor removed; 'Two states now travel, as fig-lstm-parts d shows' | not-carried | Figures stay (D12-09, PR #29). This edition's cell figure and its sentence are unchanged. |
| `ch12-o19-30` | 'loss derivative at the cell-state node'; 'and only indirectly on c_{t-1}'; 'this path for ell steps' | applied | Beta-reader edits, and ell from the notation pass (the display already used ell). |
| `ch12-o19-31` | 'gates, so this contribution is only one part of the full recurrent Jacobian.' | applied | beta-reader edit. One gate-product literal and two test strings must change (listed). |
| `ch12-o19-32` | fig-highway-time caption: ', and the LSTM's decays much more slowly'; '(4 inputs, 32 hidden units)' dropped | partly | The comma join is applied. The set-up digits stay (D12-08, companion), and so does the kept caption tail for gate-product. |
| `ch12-o19-33` | GRU heading demoted to an unnumbered subsection | not-carried | structure (D12-10, PR #29) |
| `ch12-o19-34` | GRU convention compressed into one sentence; fig-gru-cell removed; reset-after note moved to Exercise 3 | not-carried | Structure and figures (D12-10, D12-11, PR #29). The gru-blend literals pin this edition's wording. |
| `ch12-o19-35` | Reset-after paragraph: 'The two forms compute different functions from the same weights. A hand-written loop that should reproduce nn.GRU exactly must therefore apply the reset gate after the hidden-state linear map, as PyTorch does.' | applied | Beta-reader edit, applied to the paragraph this edition keeps. Recorded in the notes' carry-record section. |
| `ch12-o19-36` | Memory-test lead: the configuration list now separated by commas instead of semicolons | applied | Beta-reader edit. The two-company analogy was already removed (D12-18). |
| `ch12-o19-37` | Protocol paragraph and its footnote replaced by a pointer to Companion Experiment 12.D | not-carried | Print-only text (D12-12). This edition shows the protocol in its cell. |
| `ch12-o19-38` | tbl-recall caption: semicolon becomes a full stop | not-carried | print-only table |
| `ch12-o19-39` | Results: 'in this task, and that a gated architecture alone ...' | applied | beta-reader edit |
| `ch12-o19-40` | Third-run restatement compressed | already | D12-13, PR #29 |
| `ch12-o19-41` | Probe paragraph: replay procedure moved to Companion Experiment 12.E | not-carried | Print-only paragraph (D12-14). This edition's replay sentence follows its cell. |
| `ch12-o19-42` | Context-cap sentence: 'The limit comes from the recipe, and the LSTM itself has none.' (density later: '; the LSTM itself has no such limit') | applied | The beta-reader edit is applied to this edition's sentence. D12-15 is not carried, as PR #29 decided (this edition's wording). Recorded in the notes' carry-record section. |
| `ch12-o19-43` | Listing notes of lst-fit-next-token, lst-fixed-window-loss and lst-sample: semicolons; 'summed, not averaged' | not-carried | Listing notes are print-only. |
| `ch12-o19-44` | Temperature: 'As in @sec-02-logistic-softmax ...' | already | D12-16, PR #29 |
| `ch12-o19-45` | Printed sample moved to Companion Experiment 12.G | not-carried | This edition prints the sample from its cell (D12-17). |
| `ch12-o19-46` | Last section opener: 'A shared recurrence meets the six goals on paper ...' | already | D12-01, PR #29 |
| `ch12-o19-47` | Revisiting: input at step u, t-u updates (was s) | applied | Notation pass (s names the readout). PR #29 did not carry it. |
| `ch12-o19-48` | Recap item 2: 'Part II, and its output can still depend' | applied | beta-reader edit |
| `ch12-o19-49` | Recap item 4: 'three sigmoid gates that erase, write and read'; 'and by no weight matrix'; 'The full gradient also follows ...' | applied | beta-reader edit |
| `ch12-o19-50` | Recap item 5: ', and with the forget bias'; 'In these tests it succeeded with keep bias +2 and failed with +1.'; 'This is an association in this experiment, and it sets no general threshold.' | applied | beta-reader edit |
| `ch12-o19-51` | Recap item 7 (this edition's item 6): 'earlier positions, and a loop must finish' | applied | Beta-reader edit. The split into items 6 and 7 stays held (rev15-61). |
| `ch12-o19-52` | Exercise 2: L = g(h_T) | already | notation pass, PR #29 |
| `ch12-o19-53` | Exercise 3 gains the reset-after formula and 'The two forms compute different functions ...' | not-carried | Moved there by D12-10. This edition keeps both in the body paragraph (ch12-o19-35). |
| `ch12-o19-54` | Companion list: Experiment 12.G entry; Animation 12.B and 12.D targets | not-carried | The companion list is print-only. |
| `ch12-o19-55` | fig-lstm-conveyor TikZ caption (beta-reader stage): 'drawn along the bottom; the cell state travels' becomes 'drawn along the bottom. The cell state travels' | not-carried | Found by the review and added in the fix pass for bookkeeping. The TikZ caption is print-only, and the density pass later deleted the figure (D12-09). This edition's matplotlib caption has its own wording, already with a full stop after 'drawn along the bottom', and lstm-valves literals pin it. |

### Chapter 13 (`part3/11-encoder-decoder.qmd`)

Baseline: the October 18 11:34 backup. The beta-reader edits of October 18, notation the October 18 sweep
missed ("with $L$", Exercise 4's $/L^{\alpha}$, Exercise 1's $h$), density rows and a semicolon-splitting
pass. Outcomes: applied 16, partly 8, already 4, not carried 14.

| Entry | Print change | Outcome | Reason |
|---|---|---|---|
| `ch13-o19-01` | Opener: 'These rules do not depend on recurrence, and they carry over to the attention-based decoders of Parts IV and V.' appended; the 'A simple design that meets all three...' paragraph after the goals list deleted | applied | Beta-reader edit ('[redundant par:]'). Opener keeps this edition's order of the three choices and 'select' (10-08 rev16-02). |
| `ch13-o19-02` | Task paragraph: 'formats, or dialects, and the target language is ISO 8601:' | applied | Print edit; replaces the full stop of the Oct 14 carry. |
| `ch13-o19-03` | Rejection-loop paragraph: generator footnote to Companion 13.A, split sizes folded into the sentence, protocol sentence removed (D13-01) | partly | Fix pass. D13-01 bundles two moves. Generator settings (Companion 13.A) and print's companion pointer are not carried (companion rule). The protocol sentence ('We use validation sources for every learning curve and reserve test sources for one final audit after the design is fixed.') was deleted as restating Ch 7, not moved to the Companion. That is the same kind of row as D13-04, which the 10-18 carry did carry, so this deletion is carried too; the sealed-test sentence and the audit cell still state the single test opening. The split sizes stay in the text in print's new wording: 'before the split of the 9,000 pairs into 8,000 for training and 500 each for validation and testing'. |
| `ch13-o19-04` | Special-tokens paragraph: 'A token here is one character. Words or subword pieces would change ..., and the rules for training and decoding would stay the same.' | applied | Beta-reader edit. |
| `ch13-o19-05` | Embedding paragraph: motto 'the address is hard, the content is learned' replaced by 'Which row a token reads is fixed by its index, and the numbers stored in the row are learned.'; index-27 example deleted (D13-12) | partly | New sentence carried. The index-17 example stays (U08-5; the register marks D13-12 'print only'). Its second half, which restates the carried sentence, is dropped, and the fix pass marks the rest plainly as an example: 'For example, the token with index 17 always fetches row 17 of its table.' Whether to delete it as print did is the author's call. |
| `ch13-o19-06` | fig-encoder-decoder-handoff caption drops '256 scalars' (D13-06) | not-carried | Print-only TikZ figure caption; this edition's caption never had it. |
| `ch13-o19-07` | Seq2Seq model paragraph: S->X, T_in->Y_in, semicolon splits | not-carried | Print-only prose for code (10-08 rev16-11); code already renamed in 1a9b356. |
| `ch13-o19-08` | lst-seq2seq code renames, note semicolon split, float [!htbp] | not-carried | Listings, listing notes and layout are print-only; print listing now matches this edition's code. |
| `ch13-o19-09` | Scoring-protocol paragraph: greedy decoding described in one clause (D13-21) | not-carried | Print-only paragraph (10-14 ch13-004). |
| `ch13-o19-10` | Shift-offset paragraph: semicolon split | not-carried | Paragraph held since 10-08 (U08-6). |
| `ch13-o19-11` | train_seq2seq paragraph: training settings footnote to Companion 13.C, X/lens/Y renames, semicolon split | not-carried | D13-02 companion; print-only training-loop prose. |
| `ch13-o19-12` | fig-seq2seq-batch Description and caption renamed to X, lens, Y | not-carried | Print-only TikZ figure. |
| `ch13-o19-13` | lst-seq2seq-step code renames and note 'the slice Y[:, 1:]' | not-carried | Listing and notes print-only; code already matches. |
| `ch13-o19-14` | Loss-mask sentence after eq-seq2seq-loss: ', and ignore_index=PAD sets it to 0' | not-carried | eq-seq2seq-loss prose held since 10-08. |
| `ch13-o19-15` | Reductions paragraph rewritten in two parts (per-sequence vs pooled; N varies so Case 2, 'slightly biased', 'average token loss over the whole corpus', 'how minibatches are drawn') | partly | Case 2 half carried into this edition's loss item (padding section, item 1), N named in words; the per-sequence half stays out (reductions held since 10-08, figure c print-only). |
| `ch13-o19-16` | Fused-call paragraph: 'knows every decoder input before the forward pass begins ... single call, as in the first branch of lst-seq2seq-step, instead of a Python loop that feeds one token at a time. Inside that call a recurrent decoder still computes each state from the previous one, so its positions still run one after another.' | partly | Carried into the Teacher forcing paragraph. The fix pass changes \lstref to 'as in the "tf" branch'; the porter's wording put 'the training loop above' three times in 18 lines, and this paragraph opens with **Teacher forcing** ("tf"). The stale prose code `model(S, L, T[:, :-1])` is gone. The nonrecurrent-decoder and visibility-rule sentences stay held (10-08, U08-6). 'knows' is print's word; it is flagged for the author (D12). |
| `ch13-o19-17` | (consequence of o19-16) recap item 3 'one fused call' -> 'a single call' | applied | Body no longer defines 'fused call'. The code comment '# ground-truth prefixes: one fused call' stays (no code changes); it is noted for a later code pass. |
| `ch13-o19-18` | Padding item 1: 'graded, and selecting the graded positions...' | not-carried | Sentence not in this edition (its loss item has its own wording). |
| `ch13-o19-19` | Padding item 2 (encoder) rewritten: input mask defined; 'A zero embedding for the padding token is not enough. An LSTM still updates its state at a step whose input is zero ...; At inference the source is unpadded ...; A recurrent encoder avoids this by stopping at each source's true length.'; packing/masked-update sentences with companion footnote | partly | Carried: the input-mask definition (figure pointer dropped) and the three shared sentences. The fix pass also adds 'A recurrent encoder avoids this by stopping at each source's true length.', which stands alone without print's rule sentence. Not carried: the packing/masked-update sentences and the footnote, because this edition states them after the drift figure, next to its own check cell. |
| `ch13-o19-20` | 'with m_t the input mask (a different mask from the loss mask m of item 1)', replacing 'this input mask and not the loss mask m' | applied | Fix pass: print's rewrite removed the 'X, not Y' contrast, and the porter's version kept it. The sentence now reads 'Its mask $m_t$ is the input mask, which marks the source positions the encoder may read. It is a different mask from the one that marks the target positions the loss grades.' The symbol m and 'item 1' are left out because this edition's loss item has no symbol, and the following line is rewrapped. |
| `ch13-o19-21` | Naive-model result: 'a 58.4-point gap' removed (D13-13) | already | Carried by e98940b. |
| `ch13-o19-22` | fig-tf-vs-fr caption checkpoint digits removed (D13-14) | already | Carried by e98940b. |
| `ch13-o19-23` | Checkpoint paragraph: D13-04 deletion and 'and we open the test split once, for all three models' | already | D13-04 carried by e98940b. The single test opening is stated here by the sealed-test sentence, the audit cell and 'the test audit above'. |
| `ch13-o19-24` | Exposure bias: 'whatever the decoder's architecture' for 'not from recurrence' | applied | Print edit; this edition's parenthetical definition of autoregressive stays. |
| `ch13-o19-25` | Scheduled sampling box: 'The choice is made per token. Committing a whole sequence...' | applied | Print edit. |
| `ch13-o19-26` | Decoding intro: ', and decoding returns one output'; 'ways. Exhaustive search examines' | partly | Full stop carried; the p(y\|x)/sampling framing sentence held since 10-08 (rev16-26). |
| `ch13-o19-27` | Greedy: 'behind every exact-match score so far in this chapter' for 'of every exact-match score above [above?]' | partly | 'so far in this chapter' carried; 'which `translate` performs' kept (10-14 ch13-012). |
| `ch13-o19-28` | Toy display P -> p | already | Carried by 1a9b356. |
| `ch13-o19-29` | 'The decoder here is a specified toy, and no model was trained for it.' | applied | Print edit. It breaks the greedy-tree scene-test regex (listed in fixture_changes); the fixture literals still match. |
| `ch13-o19-30` | lst-beam-search note: 'unnormalized, and stop when all are done' | not-carried | Listing note, print-only. |
| `ch13-o19-31` | Ambiguity paragraph: ', and beam search shows...'; new tbl-beam-demo lead sentence | partly | Join carried; the table lead stays out (tbl-beam-demo print-only; the cell prints the output). |
| `ch13-o19-32` | tbl-beam-demo caption semicolon split | not-carried | Print-only table. |
| `ch13-o19-33` | Raw joint log score paragraph: full stops, 'They do not form a normalized distribution', 'nothing in it forces the output to copy the source fields' | applied | Print edit; 'Each displayed score' stays for the table reference. |
| `ch13-o19-34` | Length normalization box: 'with T+1 the number of scored tokens' | applied | Notation row ch13-01; 1a9b356 missed the definition (left 'with $L$'). |
| `ch13-o19-35` | Sampling subsection: temperature restated (D13-19); top-k vs beam k identification sentence | not-carried | Subsection not in this chapter; sampling lives in Ch 16's NOVEL practice bridge with its own wording (10-14 ch13-017). |
| `ch13-o19-36` | Fixed-size state: '..., without direct access to source positions, although they cannot show that compression caused each error.' | applied | Print edit. |
| `ch13-o19-37` | Recap item 1: '(a fixed row per token, with learned numbers)' | applied | Print edit following o19-05. |
| `ch13-o19-38` | Recap item 2: ', and perplexity', ', while generation' | not-carried | Equation-based recap item held since 10-08 (rev16-39). |
| `ch13-o19-39` | Recap (print item 4): 'Teacher forcing gained ... early in training, and free-running scored higher' | applied | Print edit, in this edition's item 3. |
| `ch13-o19-40` | Recap (print item 5): 'Greedy search maximizes each step in turn'; 'and form no posterior over the beam' | applied | Print edit, in this edition's item 4 (title and extra clauses kept). |
| `ch13-o19-41` | Exercise 1: hidden size d_h, 4[(e+d_h)d_h+2d_h] | applied | Notation row ch13-06. |
| `ch13-o19-42` | Exercise 4: /(T+1)^alpha | applied | Notation row ch13-01. |

### Chapter 14 (`part4/12-kernel-regression.qmd`)

No backup lies between the October 14 carry and the author's revision of October 18. Print's `ch14.tex`
keeps the earlier chapter commented out after the live text; with the author's review notes stripped it is
the October 14 text, so the revision is the diff from it to the live text (K1 to K23 applied, section order
S1b). The wording is carried in place; the reorder is left for the author. Outcomes: applied 17, partly 2,
not carried 4, needs author 2.

| Entry | Print change | Outcome | Reason |
|---|---|---|---|
| `ch14-1018-01` | Opening: the question 'What if every encoder state were kept instead?' now ends the first paragraph, and the next paragraph starts with 'The retained states form a **memory bank**.' (qmd lines 12-23) | applied | Print wording in a shared paragraph. |
| `ch14-1018-02` | Keys and values are named at the opening: 'We start with three observed pairs. Each stored location is a **key** $k_i$, and the response stored with it is a **value** $v_i$:'. The table head is now 'observation \| key $k_i$ \| value $v_i$' (lines 25-29). | applied | Print's notation change, which the print file's header asks to be mirrored. Print's \tblref points to a numbered table, but this edition's table is unnumbered and keeps its colon lead-in (decision of 10-05), so print's colon became a full stop. |
| `ch14-1018-03` | Lookup paragraph rewritten (lines 31-44): '@fig-kernel-lookup works through one read of this bank', affinity, bandwidth and weights defined, the Gaussian rule exp(-\|q-k_i\|^2/2h^2), the weights, the sum alpha_i v_i = 2.7412, 'nearest the query', 'specified in advance'. | partly | Not carried: 'is the bell in the figure'. It depends on print's redrawn TikZ fig-kernel-lookup, which is print-only, and the HTML figure has no bell, so it became 'is a bell centered on the query'. Print semicolons became full stops. 'works through one read of this bank' stays in print's wording because this edition's figure does show one read (query, links, three weights, prediction 2.74). The review nit about it is recorded for the author. |
| `ch14-1018-04` | Section order S1b: print moved 'Similarity weights and local prediction' (with its trap box and listing) before 'Linear regression as a weighted combination of targets', and the OLS comparison and the 'Which kernels' note now follow the linear-regression section. | needs-author | A structural move inside the chapter. This edition keeps its structure (the 10-14 and 10-18 carries also left section splits and box moves alone). The wording is carried in place, and the cross-references are adapted to this edition's order. The swap would move no code cell relative to another, and the kernel-weighting animation (anchored after cell-fig-kernel-lookup) would move with the similarity section. |
| `ch14-1018-05` | Opening paragraph of the linear-regression section: 'Linear regression, the model of @sec-01-linear-regression, already predicts by mixing the observed targets: its hat matrix writes every fitted value ... with coefficients that depend on the inputs alone, and the same algebra gives the coefficients at a new query.' | applied | Print wording in a shared paragraph. |
| `ch14-1018-06` | Design-matrix sentence: 'contain the observed targets, this chapter's values. Assuming $\widetilde{\matr{X}}$ has full column rank,' | applied | Print wording. |
| `ch14-1018-07` | Trap 'weighted combination does not mean weighted average': the OLS lambda entries are now called coefficients ('They are coefficients on the targets, not distances, similarities or regression parameters...'), the display reads lambda(q)=(...), and the last sentence is 'The kernel rule of @eq-nadaraya-watson keeps the two properties that OLS lacks...'. | applied | Print wording inside a box this edition shares with print. The reference to the estimator equation points forward in this edition's order, which is valid. |
| `ch14-1018-08` | Lead-in to the ols-versus-kernel-weights cell: 'The same code compares the signed OLS coefficients with the nonnegative, normalized kernel weights:' | partly | Only the shared clause is carried. The rest of print's paragraph is its listing's prose version of the output, which is print-only (as ch14-009 of 10-14). Plan step 2 and the cell's code-summary are a separate author decision, entry ch14-1018-25. The porter's first rationale (that they keep 'weights' because they follow print's 14.B title) was wrong, since print retitled 14.B to 'coefficients', and it is corrected in the notes. |
| `ch14-1018-09` | Note 'Which kernels make a convex average?' rewritten: nonnegative kernels give a convex average if the denominator is positive; cut-off kernels (triangular, Epanechnikov); positive semidefiniteness is a different condition; the word kernel also names the filters of @sec-07-filters-convolution; @sec-13-attention returns to the distinction. | applied | Print wording, with the semicolon made a full stop. Review fix: 'The word kernel' is now plain, as print's rewritten sentence writes it (the porter had kept the old \emph italics). 13-attention.qmd:299-307 returns to the positive-semidefinite distinction. After the split, the pointer follows the convolution-filter sentence and could be read as returning to that sense. In print it is also a separate sentence after the same clause, so it stays as carried and is flagged for the author. |
| `ch14-1018-10` | New sentence: 'This kernel is also called the radial basis function (RBF) kernel: it depends on q and k only through their distance.' | applied | Print addition in a shared paragraph. |
| `ch14-1018-11` | Keys and values are defined before the estimator ('Call each stored location a **key** ... In the opening example both are scalars...'). eq-nadaraya-watson is now written in k_i and v_i. The old 'In general, the stored input locations are the keys...' sentence is removed, and the lead-in now reads 'consider fitting one constant vector to the stored values'. | applied | Print's notation and wording change, which the print file's header asks to be mirrored. 'In Table 14.1' became 'In the opening example', and a semicolon became a full stop. Print bolds key and value both here and at the opening, and this carry follows it. |
| `ch14-1018-12` | Nadaraya-Watson paragraph: '...observed values: the operator smooths locally and keeps every prediction inside the observed values' convex hull, which the previous section showed linear regression does not. On the three pairs of the opening at h=0.6, @eq-nadaraya-watson is the arithmetic of @fig-kernel-lookup.' | applied | Print wording, adapted. Print's \secref points forward in print's order. In this edition the linear-regression section comes just before, and its anchor has no sec- id, so a plain phrase is used. 'is the arithmetic of @fig-kernel-lookup' stays in print's wording: this edition's figure shows the weights and the prediction that the arithmetic produces, so the sentence does not rest only on print's TikZ figure. The alternative 'is the computation behind @fig-kernel-lookup' is offered to the author. |
| `ch14-1018-13` | Print's 'In the opening example, the keys are the 3x1 matrix...' paragraph (it now drops the repeated numbers). | not-carried | Listing prose that reports the cell's output. It is print-only, as ch14-018 was in 10-14. |
| `ch14-1018-14` | Softmax section: the score is now s_i (was a_i), with kappa_h=exp(s_i); 'a scaled negative squared distance: the score is not Gaussian, its exponential is'; eq-bandwidth-temperature is now alpha_i = softmax_i(-\|\|q-k_i\|\|^2/tau), tau=2h^2, 'so the narrowing and broadening ... is the sharpening and flattening of a softmax'; 'The 2 in tau belongs to...'; 'The implementation works with scores throughout...so kappa_h itself is never formed.' | applied | Print's notation (s_i, which the header asks to be mirrored) and wording. The \secref became 'the kernel in the previous section', which is true in this edition's order. 'The implementation' stands for print's \lstref, and a semicolon became a full stop. |
| `ch14-1018-15` | Bandwidth section: 'Since we generate the data ourselves, we can do what observed data never permits. The keys are 60 fixed locations x_i. The values are noisy responses y_i, redrawn 1,000 times... Every prediction is compared with the known, noiseless function' | applied | Print wording, with semicolons made full stops. |
| `ch14-1018-16` | '241 fixed query locations ..., none of which coincides with a key, so that every prediction is a read between stored points rather than a copy of one stored value.' | applied | Print wording. The fig-bandwidth-worlds pointer stays print-only. |
| `ch14-1018-17` | 'has no irreducible-noise term because the comparison target is f(q), the noiseless function value at the query, not a fresh noisy response.' | applied | Print wording. This edition keeps 'every MSE that the sweep prints' in place of print's table reference. |
| `ch14-1018-18` | Under fig-fixed-attention-map: 'The width of the band is the temperature tau=2h^2 of @eq-bandwidth-temperature made visible.' replaces the temperature-dial sentence. | applied | Print wording. No fixture or anchor pins the old sentence. |
| `ch14-1018-19` | Prose report of the log-kernel/underflow check reworded. | not-carried | Print-only prose version of the log-kernel-stability cell's output (ch14-018 of 10-14). The HTML shows the printed output. |
| `ch14-1018-20` | Memory-bank paragraph reduced to 'The opening example fills every kernel-regression role: the query is ..., the weights the normalized Gaussian affinities of @fig-kernel-lookup, and the output their mixture.' The date-task sentences now sit in the tip box: '@sec-13-attention learns the score and puts the sequence-memory roles of the table above to work on the date task ...: when the decoder is about to write the year...'. | applied | Print wording in a shared paragraph and a shared box. Both stay in place. 'Table 14.3' became 'the table above'. |
| `ch14-1018-21` | Recap items 1 to 3: 'its coefficients on the targets may be signed'; '**Nadaraya--Watson is a convex mixture, and a local one.** ...'; '**Bandwidth and temperature are one dial.** For Gaussian distance scores tau=2h^2, and it balances variance against bias: ...' | applied | Print wording, with the semicolon in item 2 made a full stop. The test-time-regression callout after the recap stays (U08-3 of 10-14). |
| `ch14-1018-22` | Exercises 1 and 2 now say OLS 'coefficients' (and 'negative coefficient'). Exercise 6 now says 'set the gradient to zero and solve for c'. | applied | Print wording. |
| `ch14-1018-23` | fig-kernel-lookup redrawn as one TikZ panel with a bell, an affinity bar and rows of numbers, with a new caption and Description. | not-carried | Print-only TikZ figure. This edition's matplotlib figure, caption and alt text stay, and its code is unchanged. |
| `ch14-1018-24` | Companion material: Experiment 14.B is retitled 'Signed OLS coefficients against nonnegative kernel weights' and its \secref is retargeted. | not-carried | Companion lists are print-only. The retitle's knock-on for plan step 2 and the code-summary is entry ch14-1018-25. |
| `ch14-1018-25` | Follow-on from the 14.B retitle: plan step 2 (qmd line 275) '2. Signed OLS weights versus nonnegative kernel weights.' -> '2. Signed OLS coefficients versus nonnegative kernel weights.', and the code-summary (line 282) '#\| code-summary: "Code: signed OLS weights versus nonnegative kernel weights"' -> '#\| code-summary: "Code: signed OLS coefficients versus nonnegative kernel weights"'. | needs-author | The 10-14 precedent (ch14:ch14-009) changed both to match print's 14.B title, and print's title now says 'coefficients', so following it changes both together. Not applied because the code-summary is an option line inside the code cell: the standing rule 'no code cell changes' covers it, and voice-invariant I1 does not mask it. Changing the plan step alone would split the pair. Either way, the printed label 'OLS weights:' and the variable ols_weights are code and stay. |

### Chapter 15 (`part4/13-attention.qmd`)

Baseline: the density backup (file dated October 14 09:25). The four density rows and the October 19 reflow
of Listing 15.1, which is layout. Outcomes: applied 1, already 2, not carried 3.

| Entry | Print change | Outcome | Reason |
|---|---|---|---|
| `ch15-o19-01` | D15-01 (density, Oct 18), the sentence both editions share: 'byte for byte, ensuring both models train on identical examples' became 'byte for byte, so both models train on identical examples' (13-attention.qmd:640-641, 'Below,' and the closing colon kept because the sentence leads into the Plan -> Code block) | applied | Under the standing rule, print wording reaches every sentence this edition shares with print. No fixture literal, anchor or scene test quotes this sentence. |
| `ch15-o19-02` | D15-01 remainder: the dialect sentences ('four dialects ...', 'We reject duplicate draws ...') and the 8,000/500/500 split footnote are cut from print | not-carried | The HTML never had these sentences: they were print-only prose standing in for the date-data-rematch cell (October 14 record, ch15-003). This edition is the companion, so the settings list and the cell keep the content. |
| `ch15-o19-03` | D15-02: 'Heatmap inspections, like design decisions, use the validation split alone.' (13-attention.qmd:715-716) | already | PR #29 carried it (commit f6cb76a). |
| `ch15-o19-04` | D15-03: the reopened-test explanation becomes '..., and we evaluate on the test split once, after the model is fixed' (13-attention.qmd:916-917) | already | PR #29 carried it (commit f6cb76a). The HTML ends the sentence with a colon because it leads into the training cell. |
| `ch15-o19-05` | D15-04: the training footnote (Adam 1e-3, batch 128, clip 5, four threads) and 'We seed the random number generator prior to model instantiation.' move to Companion Experiment 15.D | not-carried | This edition is the companion, and companion pointers are print-only. The HTML has no training paragraph (it was a print-only stand-in for the attention-date-training cell), and the cell itself shows these settings. |
| `ch15-o19-06` | Oct 19: Listing 15.1 (LearnedAlignment) reflowed inside brackets | not-carried | Listings and layout are print-only, and no code cell changes. The task lists the reflow as print-only. |

### Chapter 16 (`part4/14-self-attention-transformer.qmd`)

Baseline: the notation-rules backup of October 18 16:34 (the October 14 text). No beta-reader edits. The
notation and density rows (decided by PR #29), the October 19 corrections (ch16-o19-05), and items earlier
carries missed, found by the porter and the review. Outcomes: applied 9, partly 1, already 7, not carried
18.

| Entry | Print change | Outcome | Reason |
|---|---|---|---|
| `ch16-o19-01` | Notation pass, Positional encoding section, the input display and the sentence after it: Z_i=\sqrt d E_i and 'where E_i is the token embedding' become \vect{z}_i=\sqrt d\,\vect{e}_i and \vect{e}_i | applied | Print notation rules R2/R3. The Oct 18 carry did not list these two symbols and left them unchanged. No fixture pins them, and the sentence is shared. |
| `ch16-o19-02` | The norm sentence after fig-position-build: print dropped '(4.0 in double precision)' (D16-04) and kept the comma: '$\sqrt{d/2}=4$, because each' | applied | The digit stays out here, as it always has. The comma is print's wording in a shared sentence. |
| `ch16-o19-03` | fig-self-attention-read caption: 'rows of $\\mathbf{V}$' becomes 'rows of $\\matr{V}$', as print's notation pass has it | applied | The Oct 18 notation commit's figure-label regex left an upright \mathbf{V} in a caption whose other symbols use \matr. Print reads \matr{V}. The both-axes fixture literal is unaffected. |
| `ch16-o19-04` | fig-book-corpus-rematch caption gains 'The curves are minibatch losses logged every 250 updates.' (D16-28 retargets 'The curves are the losses of Table') | applied | The caption is shared with print, and the new sentence no longer depends on print's table. It is true of this figure: log_every=250, and the axis reads 'sampled training-minibatch loss'. This departs from the Oct 18 blanket D16-28 outcome for this caption sentence only. |
| `ch16-o19-05` | Oct 19 review corrections: the embedding-norm sentence (Companion Experiment 16.H becomes an in-book pointer), the rank-collapse box (per-head convex hull, the output projection, FFN cannot restore distinctions, scope of the cited result) and the Dong et al. Sources entry | already | Already in the worktree's uncommitted changes and matching print, with semicolons split under the house rules. The fix pass made the pointer precise (see ch16-o19-32). |
| `ch16-o19-06` | Notation pass across the chapter: bold matrices X, Q, K, V, W_*, P, S, M, O_h; N_h heads of width D_h; head index h; u_j; \ell in the LayerNorm and RMSNorm sums; the shape chains; BN_hn^2; recap item 3; Exercises 1-2 | already | Carried by PR #29 (commit 25e337f). |
| `ch16-o19-07` | D16-21: the weight-sharing paragraph compressed to 'Self-attention shares its projections across positions, as an RNN shares its transition across time ...' | already | Carried by PR #29 with identical wording. |
| `ch16-o19-08` | D16-22: 'This is a structural property of the computation graph ...' deleted after the parallelism sentence | already | Carried by PR #29. |
| `ch16-o19-09` | D16-11: the reopened held-out-tail sentence deleted | already | Carried by PR #29. |
| `ch16-o19-10` | D16-17: the Xiong et al. paragraph compressed to one sentence; its Sources entry gains post-LN gradient growth | already | Carried by PR #29 with identical wording. |
| `ch16-o19-11` | D16-24: the trade-offs section keeps the KV cache, 'Self-attention leaves position and visibility to the modeler ...' and the hand-offs, and drops the four bold paragraphs | already | Carried by PR #29 with identical wording. |
| `ch16-o19-12` | Print Sect. 16.1 (scaled dot product): D16-13 shapes, D16-16 Luong/Vaswani sentence, D16-07 table-reprint digits, D16-27 tbl-sqrt-d-audit removed, D16-01 padding check values, the K^T sentence | not-carried | Structure rule: print's move of the scaled dot product into Ch 16 is not carried. That section is in 13-attention.qmd, where PR #29 handled these rows. |
| `ch16-o19-13` | D16-14: the 'has shape n x n' clause and the (n,d)(d,n)->(n,n) display deleted in the self-attention section | not-carried | PR #29 kept the shapes here: print keeps them in listing notes and TikZ, which this edition lacks. The both-axes fixture also pins 'Row $i$ contains the\ncompatibility\nscores'. |
| `ch16-o19-14` | D16-25: fig-self-attention-geometry removed and 'Geometrically, bank's score against a key is the signed projection ...' added | not-carried | Figures stay in this edition, with their pointer sentence. The new sentence exists only to replace the figure. |
| `ch16-o19-15` | D16-02: permutation-audit paragraph compressed; result paragraph becomes 'Without position, the two outputs agree to rounding error ... Companion Experiment 16.D ... Order must be supplied to the model explicitly.' | partly | Companion rule: 2.2e-16, 1.581 and their two sentences stay beside the cell, and print's five-token paragraph is its stand-in for the code. The closing sentence is shared and moves nothing, so it now takes print's wording. 'Order is not inferred from content. It must be explicitly supplied.' became 'Order must be supplied to the model explicitly.' The dropped clause restates 'no intrinsic notion of sequence order' two paragraphs earlier, and no fixture holds either wording. |
| `ch16-o19-16` | D16-26: fig-position-clocks and its paragraph removed and 'A fast clock alone returns close to its starting angle ...' added | not-carried | The figure and its paragraph stay. The added sentence exists only to replace the figure. |
| `ch16-o19-17` | D16-03: the fig-position-build paragraph ending '... as Companion Experiment 16.E checks' | not-carried | Print-only paragraph standing in for the position-build-audit cell (10-14 ch16-005). |
| `ch16-o19-18` | D16-15: 'Tensor shapes provide the clearest operational guide' and its chain deleted | not-carried | PR #29 kept the shapes, which print holds only in its listing notes and TikZ. |
| `ch16-o19-19` | Listing notes (N_h, D_h, \matr{W}) and the 12-token audit prose (D16-05: 'within single-precision rounding; Companion Experiment 16.F ...') | not-carried | Listings, listing notes and print's prose stand-ins for code are print-only. |
| `ch16-o19-20` | D16-06: the four-token LayerNorm audit paragraph ('mean zero and variance one, up to the factor') | not-carried | Print-only paragraph standing in for the layernorm-axis-audit cell. |
| `ch16-o19-21` | D16-20: the RMSNorm display and paragraph replaced by a footnote after 'approximately unit variance.' | not-carried | Structure rule: this edition keeps the display and its prose. |
| `ch16-o19-22` | D16-18/D16-19: the rank-collapse box and the FFN key-value-memory text moved into a 'Deeper dive' box, 'Two readings of the block' | not-carried | Boxes stay in place. Their wording already matches print apart from the house rules ('activations' for 'gating activations', semicolons split). |
| `ch16-o19-23` | D16-23: section 'From encoder-decoder translation to a causal language model' merged into three sentences at the head of the next section | not-carried | Structure rule: sections stay. |
| `ch16-o19-24` | D16-10: corpus/split/optimizer protocol replaced by a pointer to Sect. 12.7 | not-carried | Companion rule: this edition keeps the protocol next to its code. |
| `ch16-o19-25` | D16-12: 'To match the window sequence ... saved initial parameter snapshot.' deleted | not-carried | Here it leads into the transformer-protocol cell (PR #29 decision). |
| `ch16-o19-26` | D16-08: '736 fewer ... 0.55%' and the initialization, buffer and determinism sentences replaced by 'within 1% ... Companion Experiment 16.H holds ...' | not-carried | Companion rule: these settings stay with the cells here. |
| `ch16-o19-27` | D16-28 prose: '\Figref{fig-book-corpus-rematch} plots both training curves alongside held-out losses: the curves separate within the first 250 updates, and the gap persists throughout training.' Placed here at the head of the results paragraph after the figure, as '@fig-book-corpus-rematch plots ...' | applied | The 10-14 carry (ch16-012) excluded the source sentences because the minibatch losses supposedly appeared in no HTML output. That was false: since July (3977a52) both training cells print the 250-step log (step 250: 2.1850 vs 2.4955; step 2500: 1.1083 vs 1.8435). The sentence is a figure pointer plus a result claim, not listing prose, and this edition supports it. It is also the figure's first prose pointer. No digit is added: the cells print them. This departs from the 10-14 ch16-012 and 10-18 D16-28 outcomes for this sentence. |
| `ch16-o19-28` | D16-09: results paragraph drops the training-pass losses 1.1132 and 1.8672 | not-carried | Companion rule: this edition keeps the digits its cells print. |
| `ch16-o19-29` | D16-29: quoted samples removed and the sample-reading paragraph compressed ('... Companion Experiment 16.J generates both. A sample is one stochastic trajectory, ... remains the evaluation.') | not-carried | Companion rule: the samples are cell output here. The reading paragraph keeps this edition's wording, as PR #29 decided at row level. Print's compression folds it into the companion-pointer paragraph and drops the hedge and 'qualitative fluency must not be conflated with generalization'. The last print sentence does not depend on the samples, so the author may revisit it. |
| `ch16-o19-30` | Sources: the Vaswani et al. entry gains 'the 1/sqrt(d_k) scaling'; new Luong, Pham and Manning entry | not-carried | Structure rule: both follow print's move of the scaled dot product into Ch 16. Here that section and both credits are in the Sources of 13-attention.qmd, and d_k does not occur in this chapter. |
| `ch16-o19-31` | Print Ex 2 pointer (the table becomes fig-sqrt-d-audit); Companion material entries 16.B and 16.J reworded | not-carried | Structure rule: the sqrt(d_k) exercise is Ex 4 of 13-attention.qmd. The companion list is print-only. |
| `ch16-o19-32` | Embedding-norm sentence: print's '(Companion Experiment 16.H)', ported as '(as in the experiment below)', now reads '(as in the [book-corpus experiment](#the-book-reads-itself-again) below)' (Positional encoding section, after the z_i display) | applied | The cells just below (position-build and causal multi-head audits) initialize no token embeddings. The 1/sqrt(d) initialization is in TinyTransformerLM in the book-corpus section (std=1/math.sqrt(WIDTH), and the forward pass multiplies by math.sqrt(WIDTH)), which is print's Experiment 16.H. |
| `ch16-o19-33` | Parameter paragraph (book-corpus section): 'Each of the two feedforward sublayers expands to d_ff=168 features, with a ReLU between its two linear layers.' This is print's reviewer edit R16-52 of Oct 11 | applied | The sentence is shared. The 10-14 carry took its math but silently left out the clause. The clause is true here: the FFN is Linear, ReLU, Linear. Print's wording therefore reaches it under the standing rule. |
| `ch16-o19-34` | fig-permutation-debt caption: 'The audit (right)' becomes 'The audit (right, logarithmic axis)' | applied | A shared caption that the 10-14 carry otherwise brought to print's wording. This clause was dropped without a record. It is true here (set_yscale('log')) and is not grey-figure wording; print variant B keeps the log axis. The pending NOVEL N23 tile clause stays out. |
| `ch16-o19-35` | fig-transformer-block caption: 'The audit at right shows' becomes 'The two panels at right show' | applied | This is the only difference between the two captions. Both wordings are true here (gridspec 1x3, with raw_axis and norm_axis on the right). It is neither grey wording nor layout. The caption comes from print's overlay, but the standing rule does not exempt overlay captions. Revert if the author treats overlay captions as print-only. The layernorm-axis scene anchors after the cell and pins no caption text. |

### Chapter 17 (`interludes/attention-as-test-time-regression.qmd`)

Baseline: the notation-rules backup. One notation row, already carried, and three density rows on print's
prose versions of the check panels. The file is unchanged. Outcomes: already 1, not carried 3.

| Entry | Print change | Outcome | Reason |
|---|---|---|---|
| `ch17-o19-01` | Solver 1 check paragraph (print l. 130-132): '3.053e-16, zero up to double-precision rounding' becomes 'zero up to double-precision rounding (Companion Experiment 17.A prints its largest entry)'. HTML counterpart: qmd l. 133-134 plus cell local-constant-attention-check | not-carried | Density row D17-01 moves a check value to the companion; this edition is the companion and its cell prints the gradient. The sentence also belongs to print's prose version of the panel, which was never carried here (10-05 ch17-print-113 and ch17-rule-001, 10-08 ch17-sweep-01). |
| `ch17-o19-02` | Sentence after lst-sufficient-state (print l. 230-231): 'agree to within 3.469e-17 in every coordinate' becomes 'agree to rounding error in every coordinate (Companion Experiment 17.B prints the comparison)'. HTML counterpart: cell linear-attention-sufficient-state-check | not-carried | Density row D17-02 (companion rule). The sentence is listing prose that only print has (10-14 ch17-006), and the HTML cell already prints the comparison and its largest difference. |
| `ch17-o19-03` | Taylor-series paragraph (print l. 247; qmd l. 259): the coordinate index ell, ell' is renamed a, a' in (q^T k)^2 = sum (q_a q_a')(k_a k_a') | already | Notation row ch17-04 (print rules R2/R3). Notation commit 1a9b356 on PR #29 already carried it, so the qmd reads sum_{a,a'}(q_a q_{a'})(k_a k_{a'}). |
| `ch17-o19-04` | Delta check paragraph (print l. 286-288): 'differ by at most 4.441e-16 in any coordinate' becomes 'agree to rounding error (Companion Experiment 17.C prints their largest difference)'. HTML counterpart: cell delta-sgd-check | not-carried | Density row D17-03 (companion rule). The 'To check the algebra numerically' paragraph is print's prose for the delta-sgd-check panel and was never carried (10-05 ch17-print-245, 10-14 ch17-008). |

### Chapter 18 (`part4/15-bert-pretraining.qmd`)

Baseline: the notation-rules backup. The notation pass (the October 18 sweep took only exact matches, so
$M$, $|V|$ and $H$ remained in the prose) and the density rows. Outcomes: applied 6, partly 2, already 4,
not carried 12.

| Entry | Print change | Outcome | Reason |
|---|---|---|---|
| `ch18-o19-01` | tbl-2018-convergence: the citations move into the ELMo/ULMFiT/GPT rows and the 2018 paragraph is cut to the workflow sentence (D18-06); qmd l. 173-185 | already | PR #29 (73e7549) already carried it: the rows have the links and the paragraph is the workflow sentence. |
| `ch18-o19-02` | MLM objective (qmd l. 195-201): 'V is the vocabulary' -> 'V is the vocabulary size'; random set M -> \mathcal{S}; c(x,M) -> c(x,\mathcal{S}); H -> \matr{H} in the hidden-state display | applied | Notation rows ch18-01, ch18-02 and ch18-07 are in the print master. The notation commit 1a9b356 took only exact matches, so the prose still used M, \|V\| and plain H. |
| `ch18-o19-03` | MLM loss display x_i -> x_t. In the next paragraph: 'only x_t removed', 'let \mathcal{S} denote', (B,T,V), \|\mathcal{S}\| rows, (\|\mathcal{S}\|, V), \|\mathcal{S}\| token indices (qmd l. 211-220) | applied | Notation rows ch18-01, 02 and 06. Before this fix the display read sum_{t in S} log p(x_i\|...), which mixed two notations. |
| `ch18-o19-04` | Corruption-stream sentences (dedicated seeded generator) deleted after 'on later passes.' (D18-05); qmd l. 375-378 | already | PR #29 already carried it. |
| `ch18-o19-05` | tbl-bert-sizes replaced by one sentence giving the BERT Base and Large sizes (D18-11); qmd l. 495-505 | not-carried | Structure rule: figures, tables, boxes and sections stay in this edition. The table and its lead sentence remain. |
| `ch18-o19-06` | [CLS] head display: \ell -> \vect{z}, b -> \vect{b} (notation ch18-03); qmd l. 531-534 | already | The notation commit 1a9b356 already carried it. |
| `ch18-o19-07` | Controlled-experiment opening (qmd l. 631-641): drop 'and testing them requires separate controls'. The generator sentence becomes 'The replacement experiment is synthetic, and its generator controls each of the three conditions: it decides which strings appear during pretraining and removes spelling, frequency, and downstream-context shortcuts.' | applied | Completes D18-08. PR #29 dropped the list of conditions but kept a clause that print had deleted, and left the generator sentence in its old wording. Print's 'each of them' became 'each of the three conditions' because this edition's own pilot paragraph now sits between the sentence and its referent. The section's closing list already makes the same claim. |
| `ch18-o19-08` | String alphabet and eight source frames replaced by a Companion Experiment 18.D sentence (D18-09) | not-carried | Print-only prose: the bert-lab-data cell holds these details (companion rule; the register marks it 'HTML: print only'). |
| `ch18-o19-09` | Vocabulary paragraph reworded and its footnote (10 positions, 115 tokens) removed (D18-10) | not-carried | Print-only: this edition has no such paragraph, and the cell asserts and prints the vocabulary size. |
| `ch18-o19-10` | Footnote 'standard deviation 0.02' removed from the width-96 paragraph (D18-03) | not-carried | That paragraph is print's prose version of the bert-lab-model cell, and the cell keeps std=0.02. |
| `ch18-o19-11` | Pretrain-then-adapt opening (qmd l. 1134-1141): 'Both arms share everything downstream, as [the fine-tuning section] requires, and all encoder weights move in both.' The counts sentence follows, and the separate 'All encoder weights move in both arms.' is removed | partly | D18-03 folds the clause into the shared sentence, and that is carried. Print's 'Companion Experiment 18.F holds the update counts and learning rates' is not: this edition is the companion, so the 600/160 counts stay. |
| `ch18-o19-12` | 'We pretrain the module mlm ...' loses its learning-rate/clipping footnote, and the run's seed s becomes r | not-carried | Print-only paragraph beside lst-mlm-step (10-14 ch18-023). |
| `ch18-o19-13` | lst-mlm-step note: (\|\mathcal{S}\|,V) and (\|\mathcal{S}\|,) | not-carried | Listing notes are print-only. |
| `ch18-o19-14` | Derived sentence 'Each update averages cross-entropy ... token-weighted mean' deleted (D18-01); qmd l. 1362-1368 | already | PR #29 already carried the deletion. The deletion left 'this objective' in the next sentence without a referent in this edition, because print defines the objective in a derivation that is print-only here. Entry ch18-o19-24 repairs that without restoring the deleted sentence. |
| `ch18-o19-15` | Realized selection digits (1,032,096; 155,019; 15.020%; 80.04/9.98/9.99%) replaced by 'match the 15% and 80/10/10 policy, as Companion Experiment 18.F prints' (D18-01) | not-carried | Companion rule: this edition keeps the check digits beside the cell that prints them. |
| `ch18-o19-16` | N=\|M\| -> N=\|\mathcal{S}\| in the L_batch derivation | not-carried | Print-only derivation (10-14 ch18-024). This edition carries only its conclusion, which has no M. |
| `ch18-o19-17` | 'Each downstream classifier ...' paragraph: seed s -> r, learning-rate footnote removed | not-carried | Print-only paragraph. This edition has no such prose; the settings live in the bert-lab-training cell. |
| `ch18-o19-18` | D18-02: the centered-cosine definition moves to first use in 'The task comparison pairs ...', and the four geometry values become qualitative wording plus '(\figref{fig-pretraining-pays}, right; Companion Experiment 18.G prints the four values)'. Carried here: 'After MLM, it reaches $0.5323$ within and $-0.5517$ between (@fig-pretraining-pays, right).' (qmd l. 1529-1533; the rest of the sentence is reflowed with no word changes) | partly | Review fix. The figure pointer is print wording about a figure this edition keeps, and until now no prose here cited @fig-pretraining-pays, so it is carried. The same form is used in Ch 5 ('(@fig-autograd-rules, panel c)'), and quarto pandoc parses it as a Cite. Not carried: the qualitative wording and the Companion clause (the four values stay under the companion rule), and the move of the definition (the 'task comparison pairs' paragraph is print-only, 10-14 ch18-025; here the definition already follows its first prose use, in print's wording). |
| `ch18-o19-19` | Three pretraining families lead (qmd l. 1563-1565): '... and how it will later be used (@tbl-pretraining-families).' | applied | D18-13 adds the table citation to a shared sentence, and this edition keeps the table. Before this, the table had no in-text reference ahead of it. |
| `ch18-o19-20` | tbl-lab-transfer and its \tblref sentence removed (D18-12) | not-carried | Structure rule: tables stay. The static per-budget table remains. |
| `ch18-o19-21` | Exercise 3 (qmd l. 1776-1778): vocabulary size V, dense logits (B,T,V), selected logits (\|\mathcal{S}\|,V), target length \|\mathcal{S}\| | applied | Notation rows ch18-01 and 02. The Companion label in the exercise header is print-only. |
| `ch18-o19-22` | fig-pretraining-visibility and its lead-in sentence removed (D18-13) | not-carried | Structure rule: figures stay. The figure cell and 'The visibility column becomes concrete in @fig-pretraining-visibility' remain. |
| `ch18-o19-23` | Companion material: the Experiment 18.F entry no longer cites tbl-lab-transfer | not-carried | Companion lists are print-only. |
| `ch18-o19-24` | Follow-on to D18-01, no new print text. In the paragraph after the bert-lab-training cell (qmd l. 1362-1371), 'The number of selected positions varies from batch to batch, so this objective assigns equal weight to every minibatch, and a selected token ... has more influence on the update.' becomes 'Each update computes $\mathcal{L}_{\mathrm{MLM}}$ on its own batch, and the number of selected positions varies from batch to batch. The training objective assigns equal weight to every minibatch, so a selected token in a batch with few selections has more influence on the update.' | applied | Review fix. Once PR #29 carried the D18-01 deletion, 'this objective' pointed back at the selection digits. The deleted sentence is not restored. The premise comes from print's own derivation ('each update computes A(θ)/N, which is L_MLM(θ) on that batch'; 'Because N varies from batch to batch'). The second sentence is now print's 'The objective L_batch(θ) assigns equal weight to every minibatch, so ...', with print's term 'the training objective' replacing a symbol this edition never defines. The claim is unchanged, and 'the objective's definition' two sentences later now has its referent. $\mathcal{L}_{\mathrm{MLM}}$ is the chapter's own display (l. 206-212). |

### Chapter 19 (`part4/16-vit-scaling.qmd`)

Baseline: the notation-rules backup. Density and notation rows. This carry narrows two of PR #29's companion
rulings (D19-02's shared sentence, D19-20's lead-in). Outcomes: applied 4, partly 2, already 5, not carried
13.

| Entry | Print change | Outcome | Reason |
|---|---|---|---|
| `ch19-o19-01` | 16-vit-scaling.qmd, 'Representing images as patch sequences', the paragraph before the vit-setup cell: 'the fixed Fashion-MNIST subset first opened in @sec-06...' becomes 'the fixed Fashion-MNIST split of @sec-06-generalization-inductive-bias: 1,000 fitting, 200 validation and 600 benchmark images, each with one channel.' | applied | D19-02. Print cut its split procedure, which this edition never had in prose (the vit-setup cell and its plan state it), and reworded the shared sentence. The sentence's numbers match the cell (1,200 development images less 200 validation, plus 600 holdout). This narrows PR #29's whole-row companion ruling, and the notes record the change for the new carry record. |
| `ch19-o19-02` | The sentence after lst-patch-conv: 'The two token matrices agree to numerical roundoff, as Companion Experiment 19.A checks.' | not-carried | D19-01, companion rule. The patchify-audit cell asserts and prints the shapes and the maximum error. The Companion pointer is print-only. |
| `ch19-o19-03` | The paragraph after eq-vit-input: 'flattened patches of image $b$ as rows' becomes 'image $i$' | applied | Notation row ch19-05. Commit 1a9b356 renamed the superscripts and PR #29 changed 'For image $i$', but both missed this occurrence in the prose. |
| `ch19-o19-04` | The pooling and position ablation sentences are shortened, the warmup sentences are removed, and the Dosovitskiy Sources line is extended | already | D19-03, already carried by PR #29 (72338d9). The wording matches print. |
| `ch19-o19-05` | 'Locality: built in or learned': print removes tbl-vit-cnn-priors and replaces it with the sentence 'A convolutional network widens its receptive field through depth, while one attention layer ...' | not-carried | D19-26, structure rule. This edition keeps the table, and the new sentence only restates the table's rows. |
| `ch19-o19-06` | The paragraph after lst-tiny-vit is compressed to name the two blocks and point to Companion Experiment 19.B | not-carried | D19-04. This is print-only prose for the listing (10-14 ch19-010). This edition shows the fashion-models cell instead. |
| `ch19-o19-07` | CNN baseline: the footnotes on the channel widths and on Xavier/N(0,0.02^2) initialization are removed | not-carried | D19-05. This edition never had these footnotes, and its cell shows TinyCNN and _xavier_init. |
| `ch19-o19-08` | The MAC paragraph is compressed to 'Their multiply–accumulate counts per image agree within 2%; such a count omits normalization, softmax and memory traffic, so it is a proxy for cost.' | not-carried | D19-06, companion rule. As PR #29 decided, this edition keeps both counts and the full caveat beside the fashion-protocol cell that prints them. |
| `ch19-o19-09` | The training-protocol paragraph and its footnotes are compressed to the loop of lst-fit-supervised with AdamW and a cosine schedule, plus a pointer to Companion Experiment 19.C | not-carried | D19-07, companion rule. This edition keeps the training settings next to its code (PR #29). The listing reference and 'We do not augment the images' are print-only prose for the training cell (10-14 ch19-011). |
| `ch19-o19-10` | Scoring paragraph: the shift definition is removed, and the tbl-fashion-runs pointer and table are replaced by a figure pointer | not-carried | D19-08 and D19-25. The scoring paragraph and the per-run table are print-only. In this edition the cells and their plans state the scoring. |
| `ch19-o19-11` | Trap box: the reopened-benchmark sentence is removed | already | D19-09, already carried by PR #29. |
| `ch19-o19-12` | The JFT subsets, DeiT and ConvNeXt passages and the 'Scaling as design, scaling as forecast' opener are compressed | already | D19-10 to D19-13, already carried by PR #29. The wording matches print. |
| `ch19-o19-13` | The EfficientNet constants paragraph becomes a worked line ending 'approximately 1.92', and the fig-compound-scaling caption says 'about 1.92' | not-carried | D19-14, companion rule. The compound-scaling-audit cell prints 1.92027, and this edition keeps that value in the prose and the caption (PR #29). |
| `ch19-o19-14` | Restatements are removed after fig-compound-scaling, after the log display and in 'Where the forecast stops'; the floor sentence moves to where E is defined; the Gopher ratio arithmetic is removed | already | D19-15, D19-16, D19-18 and D19-23, already carried by PR #29. |
| `ch19-o19-15` | The Kaplan doubling factors are removed, and the next sentence becomes 'Comparing the three exponents does not say ...' | not-carried | D19-17, companion rule. The doubling factors stay beside the kaplan-scaling-audit cell, so the sentence keeps 'those percentages' and its emphasis (PR #29). |
| `ch19-o19-16` | tbl-chinchilla-exponents is removed and replaced by an in-sentence list of the three exponents | not-carried | D19-24, structure rule. This edition keeps the table. |
| `ch19-o19-17` | New sentences after the published Chinchilla constants: 'These $E$, $A$, $B$, $\alpha$ and $\beta$ are constants fitted to this surface. They are unrelated to the patch projection $\matr{E}$, the batch size $B$ and the multipliers of [compound scaling](#compound-scaling-three-knobs-one-budget).' | applied | Notation cue ch19-03/04. It has been in the print master since the notation branch, but neither 1a9b356 nor PR #29 carried it. The \secref to the unnumbered subsection becomes a link to that subsection's kept id. |
| `ch19-o19-18` | The factor-six derivation after eq-six-nd is compressed to 'about two operations per parameter per token forward and four backward' | not-carried | D19-19, companion rule. This edition keeps the derivation (PR #29). |
| `ch19-o19-19` | 'Compute-optimal means balanced', the lead-in to the G display: 'Substituting the constraint into @eq-chinchilla-loss and differentiating gives' becomes 'Minimizing @eq-chinchilla-loss along this constraint (Exercise 5 derives it) gives'. Print also removes the 0.452/0.548, 32.2B/2.98T, 40-70B and 70B paragraph after eq-chinchilla-optimum. | partly | D19-20, corrected after review. The lead-in is carried: it moves nothing to the Companion and points to Exercise 5, which in this edition is the same derivation ('derive @eq-chinchilla-optimum'). A typed exercise number is allowed, since the chapter already writes "Exercise 6's held-out fit" and audit_typed_numbers checks only chapter numbers. Not carried, under the companion rule (PR #29): the paragraph's removal. The chinchilla-allocation-audit cell prints those numbers, and no print sentence replaces them. |
| `ch19-o19-20` | The figure paragraph before fig-chinchilla-allocation is compressed and now states the budget | not-carried | D19-21. This edition has no such paragraph there. The kept D19-20 paragraph states the budget, and the figure follows its cell. |
| `ch19-o19-21` | 20-token paragraph: the frontier-table values move to Sources, and the sentence after the display is merged with the 40-70B range and the 70B choice | partly | D19-22. PR #29 already carried the Sources part. The merged sentence exists only because print deleted the D19-20 paragraph. This edition keeps that paragraph, so carrying the merge would state the range and the choice twice. |
| `ch19-o19-22` | Sources: the Touvron line gains the distillation token, and the Hoffmann line gains the frontier table | already | Already carried by PR #29. |
| `ch19-o19-23` | Exercise 3: 'Reproduce all five paired Fashion results and compute' becomes 'Reproduce all five paired Fashion results of @fig-fashion-rematch and compute' | applied | Corrected after review. The October 14 carry (10-14 ch19-029) left out print's pointer only because its target, tbl-fashion-runs, existed only in print. Print now points to fig-fashion-rematch, which this edition has outside any profile-hidden block, so the shared sentence takes print's wording. The '(Audit, Companion Experiment 19.D.)' label stays print-only. |
| `ch19-o19-24` | Companion list entries 19.D (means reported in Sect. 19.4) and 19.F (doubling-factor wording) | not-carried | The companion list is print-only. |

### Chapter 20 (`part5/17-peft-quantization.qmd`)

Baseline: the notation-rules backup. Three notation sentences the October 18 sweep missed: the adapter
activation $\phi$, and $q_{\max}$ in the code range and in Exercise 4. Outcomes: applied 3, already 5, not
carried 12.

| Entry | Print change | Outcome | Reason |
|---|---|---|---|
| `ch20-o19-01` | Prompting, GPT-3 and ablation paragraph compressed to two sentences (D20-12); qmd l. 155-158 | already | Carried by PR #29 (c6cf353); identical text. |
| `ch20-o19-02` | Frozen-context test: model paragraph compressed, 'Companion Experiment 20.A defines it in full' (D20-09); qmd l. 214-219 | not-carried | Companion rule: the model and shapes moved to Experiment 20.A, which is this edition's icl-mechanism cell. Print's paragraph was already print-only prose of the cell (10-14 ch20-004). Matches the 10-18 record. |
| `ch20-o19-03` | Meta-training footnote (1,200 steps, AdamW, schedule, clipping) removed (D20-05) | not-carried | Print-only prose of the code cell (10-14 ch20-004); the HTML never had it. Companion rule. |
| `ch20-o19-04` | ICL results paragraph: Figref pointer, 'unseen-query accuracy rises with k to 1.000 at k=3' (D20-08, D20-15); qmd l. 422-426 | not-carried | 10-18 decision for D20-08: this edition prints those numbers in prose, not tables. The pointer replaced a pointer to print's table. |
| `ch20-o19-05` | tbl-icl-accuracy removed (D20-15) | not-carried | Print-only float; the HTML never had the table, and the cell prints the values (10-14 ch20-005). |
| `ch20-o19-06` | eq-prompt-tuning H^{(0)} to H_0 (notation ch20-06); qmd l. 470 | already | Carried by notation commit 1a9b356. |
| `ch20-o19-07` | Adapter display sigma to phi, plus new sentence 'Here $\phi$ is an elementwise activation.' before 'This module adds ...' (notation ch20-02); qmd l. 511, 515-516 | applied | Shared display and sentence. The notation branch replaced exact matches only and missed it. phi frees sigma_1..sigma_6 for the singular values. |
| `ch20-o19-08` | eq-lora-count P_LoRA to n_LoRA (notation ch20-03); qmd l. 561 | already | Carried by 1a9b356. |
| `ch20-o19-09` | 'Merged and unmerged arithmetic should agree to numerical tolerance.' deleted (D20-14); qmd l. 666 | already | Carried by PR #29 (c6cf353). |
| `ch20-o19-10` | Rank test set-up paragraph rewritten with 'Companion Experiment 20.B holds the sizes ...' and listing pointer (D20-06, D20-10) | not-carried | Print-only prose of the lora-capacity cell and its listing (10-14 ch20-012); companion rule. |
| `ch20-o19-11` | Rank results: 'Averaged over the five initializations, rank 1 leaves ... 0.710, ... 0.142, and ranks 6 and 8 recover the target'; check values and tbl-lora-rank removed (D20-01, D20-02, D20-16); qmd l. 924-930 | not-carried | 10-18 decision: numbers stay in prose here (D20-02), check values go to the companion (D20-01), and the table was print-only. The phrase 'Averaged over the five initializations' could be added alone later (noted for the author). |
| `ch20-o19-12` | Symmetric-quantization displays Q to q_max (scale, denominator, clip) (notation ch20-01); qmd l. 962-972 | already | Carried by 1a9b356 and c6cf353. |
| `ch20-o19-13` | 'uses codes $-Q,\ldots,Q$' to '$-q_{\max},\ldots,q_{\max}$' (notation ch20-01); qmd l. 978 | applied | Shared sentence that the notation branch missed. No fixture pins it. |
| `ch20-o19-14` | Quantization set-up paragraph rewritten ('Each relative error is ... Companion Experiment 20.C generates ...', listing pointer) (D20-11) | not-carried | Print-only prose of the quantization-audit cell and listing (10-14 ch20-016); companion rule. |
| `ch20-o19-15` | lst-symmetric-quantize note: 'qmax is Q' to 'qmax is q_max' | not-carried | Listing notes are print-only. |
| `ch20-o19-16` | Quantization results without digits ('median row error is ten times larger', 'below 1%', 'halve') (D20-03); qmd l. 1182-1187 | not-carried | 10-18 decision for D20-03: this edition prints those numbers in prose, not tables. |
| `ch20-o19-17` | Byte totals removed: 'The packed codes require 16,384 ... and 8,192 bytes at 4 bits, before the scale metadata.' (D20-04); qmd l. 1189-1192 | not-carried | Companion rule (byte totals stay with the cell). The HTML sentence is its own wording, and print's sentence cites its listing. |
| `ch20-o19-18` | QLoRA: fig-qlora-composition pointer and figure removed; caption point moved to text ('and only the LoRA branch has optimizer state: storage dtype, compute dtype and trainable dtype are separate choices') (D20-17); qmd l. 1245-1259 | not-carried | Structure rule: this edition keeps the figure, whose caption states the moved point, so the clause would only repeat it. The HTML never had the pointer. Matches the 10-18 record. |
| `ch20-o19-19` | Exercise 4(a): 'showing $Q,s,q,$' to 'showing $q_{\max},s,q,$' (notation ch20-01); qmd l. 1478 | applied | Shared exercise sentence that the notation branch missed. The Companion tag stays print-only. |
| `ch20-o19-20` | Companion material list: Experiments 20.A and 20.B now say what they print instead of citing the removed tables | not-carried | Companion lists are print-only. |

### Chapter 21 (`part5/18-alignment.qmd`)

Baseline: the notation-rules backup. One notation rename (the sequence length $L$ becomes $P+T$); the
density rows stay as the October 18 record decided them. Outcomes: applied 1, already 3, not carried 5.

| Entry | Print change | Outcome | Reason |
|---|---|---|---|
| `ch21-o19-01` | Notation pass, rules-audit row ch21-03: in the tensor contract sentence, the length L becomes P+T, giving logits (B,P+T,V) and token IDs/mask (B,P+T). Applied at 18-alignment.qmd:168-169. | applied | This sentence is shared with print. The notation branch 1a9b356 missed it because print uses \texttt{logits} and the HTML uses a backtick span. The rest of the sentence keeps this edition's wording ('The helper below checks...') because print's \lstref clause names a print-only listing. No fixture literal quotes it. |
| `ch21-o19-02` | Notation pass, rules-audit row ch21-01: comparison matrix B becomes D (two instances). | already | The notation branch already carried this at 18-alignment.qmd:286-287. Print's second instance sits in its prose version of the preference-consistency-audit panel, which this edition does not have (10-05 ch21-print-280 / ch21-note-005). |
| `ch21-D21-01` | fig-preference-consistency caption: the digits 0.693147, 0.610864 and 0.082283 are dropped; the caption now says 'log 2 lies above ... by the irreducible scalar gap'. | already | PR #29 already carried it: the fig-cap at line 350 has the new wording. |
| `ch21-D21-02` | 'moves by at most 8.33e-16' becomes 'moves only by rounding error ..., as Companion Experiment 21.C checks'. | not-carried | This edition is the companion. The HTML never had this prose sentence; the reference-tilt-audit cell prints the shift check itself. |
| `ch21-D21-03` | The footnote with 20,000 comparisons per seed, 900 Adam steps and lr 0.05 becomes a pointer to Companion Experiment 21.D. | not-carried | This edition is the companion. The footnote belongs to print's prose version of the reward-model panel (10-08 ch21-sweep-03), and the cell shows count, Adam lr and steps. |
| `ch21-D21-04` | The four narrow mean lengths become 'grows from 0.90 to 1.96: it leaves the feedback range and passes l=1.25'. | not-carried | This edition is the companion and print-only prose is not carried. The HTML never had the mean-length paragraph (10-05 ch21-print-895); the proxy-pressure-study cell prints all four lengths. The 10-09 record item 3 still lets the author add such a sentence. |
| `ch21-D21-05` | fig-proxy-pressure caption: 0.484541, KL 3.138049 and 1.316470 are dropped ('and then falls', 'keeps rising'). | already | PR #29 already carried it: the HTML fig-cap at line 997 has its own wording with 'and then falls' and 'keep rising' and none of the digits. |
| `ch21-D21-06` | 'stays below 1.25, at most 1.104397' becomes 'stays below 1.25'. | not-carried | This edition is the companion. The HTML repair paragraph never had print's 'Under coverage repair ... stays below 1.25' sentences, which predate Oct 14 and restate cell output. |
| `ch21-D21-07` | 'differ by at most 5.55e-17' becomes 'agree to rounding error ... (Companion Experiment 21.F compares them)'. | not-carried | This edition is the companion. The HTML has no such sentence; the DPO identity cell prints 'largest policy difference'. |

### Chapter 22 (`part5/19-generative.qmd`)

Baseline: the notation-rules backup. Notation the October 18 sweep missed, three older print wordings no
carry took, and the generator symbol in the `fig-gan-finite` caption. D22-12 is kept for structure (the
October 18 record's "not in this edition" was inaccurate). Outcomes: applied 9, partly 1, already 4, not
carried 13.

| Entry | Print change | Outcome | Reason |
|---|---|---|---|
| `ch22-r18-01` | Opening: fig-judge-generator removed (D22-14); its idea becomes one sentence, 'Throughout, a judge, which maps a completed object to a score, differs from a generator ...' | not-carried | Rule: figures stay in this edition. The HTML keeps fig-judge-generator, and its caption already states the idea. Print's sentence exists only to replace the removed figure. |
| `ch22-r18-02` | Notation: D_KL/D_JS become KL/JS in eq-elbo-gap, eq-vae-elbo, eq-vae-diagonal-kl, the 'Why this batches' display and q_agg term, the GAN displays, Exercise 3's JS and Exercise 5 | already | Carried by PR #29's notation sweep (1a9b356). |
| `ch22-r18-03` | Worked-example prose: 'its shortfall from the log evidence, 0.931250, is the KL divergence ...; Companion Experiment 22.A checks the equality to twelve decimal places' (D22-01, KL notation) | not-carried | Print-only prose version of the vae-gap-audit output (10-14 ch22-007). This edition prints the values from the cell. |
| `ch22-r18-04` | fig-vae-gap caption: digits removed ('lies lower by exactly KL(q\|\|p(z\|x))') (D22-01) | not-carried | Rule: this edition is the companion. The HTML caption is its own and sits beside the cell that prints the values. The 10-18 record carried D22-01 as the third (prose) statement only. |
| `ch22-r18-05` | After fig-vae-gap: 'When q equals the true posterior, the gap vanishes, and any mismatch loosens the bound.' (D22-01) | already | Carried by PR #29 (91da5fc). |
| `ch22-r18-07` | Reparameterization: 'and g_phi is differentiable' becomes 'and h_phi is differentiable' (notation ch22-07); HTML line 442 | applied | PR #29 renamed only the display. The sentence after it still said g_phi. |
| `ch22-r18-08` | GAN mixture m becomes p_m in the lead sentence (2p_m) and in both KL/JS displays (notation ch22-04); HTML lines 526-540 | applied | Notation rename that the PR #29 sweep did not match. The sentence is shared with print. |
| `ch22-r18-10` | Finite-GAN prose paragraph: JS notation, and 'Both generators satisfy eq-gan-js to floating-point precision.' cut (D22-02) | not-carried | Print-only paragraph. The HTML runs gan-finite-audit, which prints the error column. Companion rule. |
| `ch22-r18-11` | fig-gan-finite caption: JS values, V values and the logit -6 magnitudes removed (D22-02, rules ch22-14) | not-carried | Companion rule. The HTML caption is its own, the figure is left (U12-6, decision 2), and the cell prints these values. The caption's generator symbol is handled separately in ch22-r19-gan-caption. |
| `ch22-r18-12` | tbl-forward-schedule removed with its pointer sentence (D22-15) | not-carried | Print-only table. The HTML never had it; forward-diffusion-audit prints the four rows. |
| `ch22-r18-13` | Direct-form check paragraph: digits moved to Companion 22.C ('agree to rounding error ...; Companion Experiment 22.C prints all three checks') (D22-03) | not-carried | Print-only prose version of the cell output. Companion rule. |
| `ch22-r18-14` | Gaussian-mixture score: shared variance s^2 becomes sigma^2 in the lead sentence and in the omega_j/score display (notation ch22-09); HTML lines 939-948 | applied | Notation rename on a sentence shared with print. Print's follow-on sentence 'For two components, fig-score-mixture plots ...' is print-only. Correction after review: the score-field panel does show the symbol (interactives/score-field/panel.html line 24 renders (mu_j - x)/s^2, and the scene sits right after cell-fig-score-mixture). The chapter edit stays and the panel is untouched (October 16 rule; the October 18 notation precedent). It is listed as open for the author beside momentum-memory, step-length, gate-product, identity-lane and quantization-grid. |
| `ch22-r18-15` | Schedule check gains a footnote (dtype, log accumulation, endpoint), and the paragraph 'A small schedule coefficient is not a zero coefficient' is cut (D22-12) | not-carried | Kept for structure: print turned the paragraph into a footnote to save pages, and here the paragraph keeps its place in the evaluation section. The October 18 record calls D22-12 'not in this edition', which is inaccurate. The October 19 record should give it as kept for structure. No chapter change. |
| `ch22-r18-16` | 'lst-reverse-coefficients builds the linear schedule' and the listing note 'The linear schedule of eq-diffusion-schedule' | not-carried | Listings, their notes and the prose describing them are print-only. |
| `ch22-r18-17` | Zero-based index paragraph moved to Companion 22.E (D22-05); the notation pass renamed its index j to t' (ch22-08, print a7cf0c4); HTML line 1101 | partly | Companion rule: the paragraph stays here. The approved rename is carried ('the zero-based index $t'=t-1$'), because j is the mixture-component index of omega_j in the same chapter. |
| `ch22-r18-18` | Training footnote (two 64-unit SiLU layers, 5,000 updates, Adam 0.002, 32-bit schedule) replaced by 'Companion Experiment 22.E holds the network's sizes ...' (D22-05) | not-carried | Companion rule. The HTML keeps its own setup sentence (10-08 ch22-sweep-01, 10-14 ch22-018), and the 'In each update' paragraph is print-only. |
| `ch22-r18-19` | tbl-time-conditioning removed; its pointer sentence rewritten to point to the figure (D22-16) | not-carried | Print-only table and paragraph ('After the last update ...'). The cell prints the scores of both conditions. |
| `ch22-r18-20` | Cross-attention: equations cut; one sentence on queries, keys and values (D22-11) | already | Carried by PR #29 (91da5fc). |
| `ch22-r18-21` | Classifier-free guidance: 'With the convention w>=0' and 'At w=0 ... increasing w' become gamma (notation ch22-06); HTML lines 1424, 1432 | applied | PR #29 renamed only the display, so the text and the display disagreed. |
| `ch22-r18-22` | Sampler-settings paragraph compressed (D22-13) | already | Carried by PR #29 (91da5fc). |
| `ch22-r18-23` | Note 'Small models with known answers' deleted (D22-10) | not-carried | Rule: boxes stay in this edition. |
| `ch22-r18-25` | Exercise 3: D*(x)=p(x)/(p(x)+q(x)) becomes p_data/(p_data+p_g), 2JS(p\|\|q) becomes 2JS(p_data\|\|p_g), and 'mean of q ... mean of p' becomes 'mean of p_g ... mean of p_data' (notation ch22-05) | applied | PR #29 changed only D_JS to JS here. In the body, q names the VAE posterior and the forward process. |
| `ch22-r18-27` | Companion list entries 22.C ('Builds the linear schedule, prints its coefficients at four steps') and 22.E ('prints the scores of both conditions') | not-carried | Companion lists are print-only. |
| `ch22-r19-gan-caption` | fig-gan-finite fig-cap (HTML line 618): 'The covered generator q = (0.40, 0.45, 0.15) has ... The collapsed q = (0.02, 0.96, 0.02) has ...' becomes 'The covered generator, with mass (0.40, 0.45, 0.15), has ... The collapsed one, with mass (0.02, 0.96, 0.02), has ...' (print's own words for that phrase, which its caption has had since at least October 7) | applied | Review nit, follows notation ch22-05. Once Exercise 3 was carried, this caption was the only prose where q named the generator. Only the fig-cap text changed. The code and plotted titles/labels (none shows q), the digits and the rest of this edition's caption are unchanged (U12-6 'figure left' holds). Caption-only precedent: 10-14 ch22-007 and ch22-017, and the October 18 caption edits. If the author prefers the old caption, revert line 618 alone. |
| `ch22-old-01` | Forward diffusion (HTML line 712): 'We follow a balanced one-dimensional mixture' becomes print's 'Take a balanced one-dimensional mixture' (print since at least Oct 7, from its rewrite of span ch22-print-724) | applied | Older missed print wording in a shared sentence. 'We follow' was this edition's own D12 adaptation of 'Let us watch' (10-05 record), made before the October 16 rule that print's wording reaches every shared sentence. No later carry took it because the sentence never changed inside a carry window. No fixture, anchor or scene test quotes it. The 10-14 carry also carried earlier missed print edits, so there is precedent. |
| `ch22-old-02` | Gaussian ELBO (HTML line 245): 'The next audit compares the exact posterior with a deliberately mismatched q(z\|x)=N(0.35,0.75).' becomes print's 'We compare the exact posterior with ...' (print since at least Oct 7, span ch22-print-240) | applied | Older missed print wording in a shared sentence. The HTML wording dates from the July draft, and no record keeps it. The panel still follows the sentence, so the lead-in still introduces it, and the active 'we' is D12's form for an experiment setup. No fixture, anchor or scene test quotes it. |
| `ch22-old-03` | Time-conditioning study (HTML lines 1090-1092): 'consider the known two-Gaussian mixture used above' becomes 'consider the two-Gaussian mixture $p_0$ of [the forward noising process](#destroy-data-on-purpose)' (print's \secref{ch22:destroy-data-on-purpose}, in print before the Oct 14 baseline) | applied | Found by the whole-chapter read after review. Print fixed a reader ambiguity here (reports/print-notes-ch22.md): 'used above' points at the score figure's mixture (means +/-2, scale 0.75), but the study uses p_0. The same cell order holds in this edition. 10-14 ch22-018 carried only that sentence's changed words and did not record keeping 'known ... used above'. The subsection has no sec- id, so the \secref became a phrase linking to its id (10-14 ch01-003, ch16-006 precedent). The HTML's SiLU/5,000-update details stay. |

### Chapter 23 (`part5/20-multimodal.qmd`)

Baseline: the notation-rules backup. Notation (already carried) and density rows. The file is unchanged.
Outcomes: already 4, not carried 3.

| Entry | Print change | Outcome | Reason |
|---|---|---|---|
| `ch23-h1-01` | Protocol seed bullet (Make the pair relation learnable): 'Under the protocol of \chapref{sec-learning-by-experiment}, each of five model seeds gives both conditions identical initial weights, the same minibatch schedule and the same fixed settings, with \(\tau=0.08\).' | already | Already carried by PR #29 (D23-01, commit 2da0d87). The HTML keeps 'settings: AdamW, 160 epochs, batch size 120, and $\tau=0.08$' on purpose, under the companion rule (training settings stay here) and the D13 Rule C / U13-5 decision. |
| `ch23-h1-02` | Protocol endpoint bullet: 'select checkpoints by the loss on the correct validation pairs and consult the 300-row endpoint once, after every choice is fixed.' | already | Carried verbatim by PR #29 (D23-01). |
| `ch23-h2-01` | Print cut the generator and training-recipe paragraph and its footnote (tanh, sqrt(5), noise 0.045, 40 ReLU units, AdamW lr/wd, 160 epochs, checkpoint every fifth epoch) to 'Each tower maps ...; Companion Experiment 23.B holds the generator of the two views and the training settings. \lstref{lst-paired-or-shuffled} shows ...' | not-carried | Companion rule (D23-02). Listing prose and companion pointers are print-only. This edition never had the paragraph (ch23-sweep-02): the generator and settings live in the ch20-paired-study Plan -> Code cell. |
| `ch23-h3-01` | Validation results paragraph: Recall@1 digits (0.9911, 0.9900, 0.0044, 0.0078) replaced by 'the paired condition retrieves almost every mate in both directions, and the shuffled control stays near chance'. The mechanism-check sentence is unchanged. | not-carried | Companion rule, as decided for D23-03 in the 10-18 carry. Print moved the digits to tbl-paired-recall. This edition has no recall table, so its prose keeps the numbers. The unchanged mechanism-check sentence already matches print. |
| `ch23-h3-02` | Held-out paragraphs merged: the per-condition SDs, the shuffled Recall@1/@5 values and their random-expectation comparison are dropped, and 'rather than reconstructed from those marginal summaries. The ...' becomes 'paired within seed: the paired-minus-shuffled held-out contrast is ...' | not-carried | Companion rule (D23-03). This edition keeps the marginal summaries in its prose, so 'rather than reconstructed from those marginal summaries' still has its antecedent. The contrast numbers 0.9720/0.9633 and their paired SDs are identical in both editions. |
| `ch23-h4-01` | Exercise 6(a): \(C_{ij}\) renamed \(G_{ij}\) (notation pass) | already | Carried by the notation commit 1a9b356. The HTML reads 'Let $G_{ij}=u_i^\top v_j$, write $S_{ij}=e^\gamma G_{ij}$'. |
| `ch23-read-01` | Whole-chapter word-level comparison of current print against the HTML | already | No wording change since the October 14 carry falls outside the delta. Every other difference is in the baseline and is a deliberate, earlier-decided divergence: float, listing and table pointers; the grey-figure caption wording; the companion tags and list; the interlude Markdown link; and this edition's own 'The study downloads no images and tokenizes no corpus.' (U13-1). |
