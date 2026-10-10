# Print additions carried into the HTML edition (2026-10-09)

On October 9, 2026 the author approved new material for the Springer print edition: items 1 to 8 of the
ranked "Frontiers" list (`~/Documents/dl-book-additions-2026-10-09/frontiers/frontiers-enrichment-ranked.md`)
and pieces A, B2 and C of `recommendation.md` in the same folder, with a new Chapter 16 figure. Print carries
them in the Overleaf master (`book/part1/ch02.tex`, `book/part3/ch13.tex`, `book/part4/ch16.tex`,
`book/part4/ch17.tex`, `book/part5/ch21.tex`, `book/part5/ch22.tex`, `book/appendix/appE.tex` and
`book/bib/dlbook.bib`). This record lists what was carried into seven HTML pages on branch
`print-revisions-2026-10-08`, on top of `44c1acf`; the changes were not yet committed when it was written.

The wording is print's. The conversions are the usual ones: `\chapref`, `\eqnref`, `\tblref` and `\figref` to
`@` cross-references, `\cite` to a link on the authors' names (or to the Sources entry), `\footnote` to
`^[...]`, `\(...\)` to `$...$`, `\expect` to `\E`, `\emph` and `\textbf` to Markdown. Each carried block has
an HTML comment above it, `<!-- print 2026-10-09, author-approved: ... -->`, which
`filters/strip-html-comments.lua` removes from the page. Print's `% ADDED`, `% DONE` and `% cited:` comments
and its exercise labels (`ex-ch02-6`, `ex-ch13-9`, `ex-appE-7`) are not carried. No code cell, printed number,
heading, anchor or Plan step changed. Chapter 16 gains one figure, so its later figures renumber.

Chapters 2, 13, 16, 17, 21 and 22 were re-rendered on the reference machine (the M1 MacBook Air, 4 threads,
Quarto 1.10.18) with no `--to` flag, and `audit_frozen_stdout.py` finds every frozen stdout block
byte-identical. Appendix E has no freeze. The replay receipts that read a changed
page record its new SHA-256; no replay quotes an added or changed sentence, and `audit_excerpt_fixtures.py`
passes.

| Page | File | Print source | Receipts refreshed |
|---|---|---|---|
| Chapter 2 | `chapters/part1/02-logistic-softmax.qmd` | Frontiers item 3 | `wave1-excerpts`, `surprise-loss`, `sigmoid-squash` |
| Chapter 13 | `chapters/part3/11-encoder-decoder.qmd` | Frontiers item 1 | `greedy-tree` |
| Chapter 16 | `chapters/part4/14-self-attention-transformer.qmd` | Frontiers items 1, 4, 6, 7; pieces A and B2; the figure | `layernorm-axis`, `both-axes` |
| Chapter 17 | `chapters/interludes/attention-as-test-time-regression.qmd` | Frontiers item 8 | none read it |
| Chapter 21 | `chapters/part5/18-alignment.qmd` | Frontiers items 2, 3 | `mask-predictor`, `reference-tilt`, `preference-ruler` |
| Chapter 22 | `chapters/part5/19-generative.qmd` | Frontiers item 5; piece C | `score-field` |
| Appendix E | `chapters/appendices/a5-statistical-learning.qmd` | Frontiers item 5 | none read it |

## Chapter 2: Linear Models that Classify: Logistic and Softmax

Carried:

- **Exercise 6, "Information-theory extension (optional)"** (Pencil), appended after Exercise 5. For logits
  $\vect{o}$ and temperature $\tau$, $\operatorname{softmax}(\vect{o}/\tau)$ is the only distribution that
  maximizes the expected score plus $\tau$ times the entropy, through
  $F(P)=\tau\log Z-\tau\,D_{\mathrm{KL}}(P\,\|\,Q)$; the limits $\tau\to0$ and $\tau\to\infty$ explain the
  "entropy dial". Print `ex-ch02-6`.
- **Sources: Jaynes, "Information Theory and Statistical Mechanics" (1957)**, between Kullback and Leibler and
  Blondel et al.: the distribution with the most entropy at a given expected score has the exponential form of
  softmax.

Adaptations: the display is unnumbered inside the list item, as print leaves it; the "(optional)" label follows
this edition's precedent ("Statistical extension (optional)" in Chapter 22); the comments are indented
continuations so that the Sources list and the Exercises list each stay one list. The exercise's prerequisites
(the temperature softmax, $H(P)$ and $D_{\mathrm{KL}}\ge0$) all come earlier in the chapter.

Follow-up (optional, from the porter): Chapter 21's new Gibbs-policy sentence harvests the temperature softmax,
so the "Temperature dial" row of `docs/arc-seeds.md` could add "ch. 18 (Gibbs policy is the temperature softmax
of the rewards)" to its harvest column.

## Chapter 13: Encoder–Decoder, Teacher Forcing, Beam Search

Carried:

- **Exercise 9, "Forbidding tokens one step at a time"** (Pencil), appended after Exercise 8. On
  @tbl-greedy-tree, a sampler that removes the tokens `other` collects at each step returns `A x <eos>` and
  `B y <eos>` with probabilities 0.60 and 0.40, while conditioning the distribution over complete outputs gives
  0.422 and 0.578; the exercise ends at the date task's `03/05/2021`. Print `ex-ch13-9`.
- **Sources: Park et al., *Grammar-Aligned Decoding*** (NeurIPS 2024), between Bahdanau, Cho, and Bengio and
  Papineni et al.

Adaptations: Exercise 9 ends with one HTML-only sentence, "@sec-14-self-attention-transformer returns to this
per-step rule in its optional practice bridge on decoding." Its comment says to drop the sentence when the
decoding move lands in this chapter.

Not carried here: print's paragraph after the sampling rules ("Keeping a set of tokens and renormalizing ...
(Exercise 9)."). Print teaches top-$k$ and nucleus sampling in this chapter; this edition teaches them in
Chapter 16's practice bridge, because the decoding move of the October 8 ledger (ch13-rev16-26, -36) waits for
the author. The paragraph sits there instead (Chapter 16, below).

## Chapter 16: Self-Attention and the Transformer

Carried, in reading order:

- **The learned score as one matrix** (piece B2), in "Let the sequence query itself", after "...what is shared
  is the machinery that produces them.": the display $(QK^\top)_{ij}/\sqrt d=\vect{x}_i^\top W_QW_K^\top
  \vect{x}_j/\sqrt d$; the comparison with the kernel smoother's fixed distance and bandwidth; why
  $W_QW_K^\top$ need not be symmetric, so the learned kernel of Chapter 15 is an analogy; a footnote on tying
  $W_Q=W_K$ (Tsai et al.); the caveat that row-wise softmax makes lopsided weights no evidence of asymmetry; and
  the pointer to the new figure.
- **New figure `fig-self-attention-geometry`**, right after: *bank*'s row of @fig-self-attention-read drawn as
  geometry in a two-dimensional toy, each learned matrix a function from one plane to another and each score a
  signed shadow on the line through the query. Print `book/figures/part4/tikz/ch16-self-attention-geometry.tex`;
  here `figures/tikz-src/14_self_attention_geometry.tex`, built with `scripts/build_tikz.sh
  14_self_attention_geometry` into `figures/generated/14_self_attention_geometry.svg` (and `.pdf`). The three
  figure files are new and go into the commit with the chapter.
- **The mask as conditioning** (Frontiers item 1), in "The mask is part of the model", after "...leave the
  remaining row unnormalized.": adding $-\infty$ first equals zeroing and renormalizing, so each row is the
  unmasked row conditioned on $j\le i$.
- **LayerNorm's geometry** (item 7), in "The residual stream", after "...that claim need not remain true.":
  subtracting $\mu$ removes the projection onto the all-ones vector, and the normalized token lies just inside
  the sphere of radius $\sqrt d$.
- **Warmup and pre-LayerNorm** (item 4), after the pre-LayerNorm display and before "Pre-LayerNorm leaves an
  unobstructed identity route...": post- and pre-LayerNorm placed against the ResNet block's final ReLU, and
  Xiong et al.'s argument that post-LayerNorm is one reason the original Transformer needed warmup (answering
  the training chapter's warmup pointer).
- **RMSNorm** (item 7), after "...per-feature scale $\vect{g}$.": it rescales to length about $\sqrt d$ like
  LayerNorm but keeps the projection onto the all-ones vector.
- **Box "What attention alone does to a stack of tokens"** (piece A), at the end of "The position-wise
  feedforward network", after "...a common workspace that survives the full stack.": averaging collapses a
  stack of attention layers toward one row (Dong, Cordonnier, and Loukas, for unmasked attention), the FFN only
  slows it, and the residual additions keep the tokens distinct, an additional job beyond easier optimization.
- **Haviv et al.** (item 6), in the warning box "What this matched run can and cannot show", after "...might
  suggest.": larger causal language models without positional encodings come close to models with them, the
  gap shrinks with size, and position is recoverable from their representations.
- **Per-step masking** (item 1, print's Chapter 13 paragraph), in the callout "Practice bridge (optional):
  decoding is another model choice", after "Neither changes the trained weights, and neither guarantees a better
  sample.": keeping a set of tokens and renormalizing conditions the next-token distribution, a rule that
  forbids tokens conditions each step in the same way, and a sampler that does so at every step need not return
  the allowed outputs in proportion to the model's probabilities (Exercise 9 of @sec-11-encoder-decoder).
- **Sources**: Xiong et al.'s entry gains "including pre-LayerNorm training without warmup"; new entries for
  Dong, Cordonnier, and Loukas (after Xiong), Haviv et al. (after Geva et al.), Tsai et al. (after Jain and
  Wallace) and Park et al. (after Holtzman et al.).

Adaptations:

- **Decoding lives in the practice bridge in this edition.** So print's Chapter 13 paragraph on per-step masking
  sits in the practice bridge, right after the top-$k$ and nucleus definitions. Its first sentence links back to
  the mask: keeping and renormalizing "is what the causal mask does to each attention row (zero the excluded
  entries, divide the rest by their sum), with next tokens in place of keys". "The ISO format" became "the ISO
  date format of @sec-11-encoder-decoder", and "(Exercise 9)" became "(Exercise 9 of @sec-11-encoder-decoder)".
  Park et al. is listed here as well as in Chapter 13, because this paragraph carries its claim.
- **The mask sentence drops the forward link.** Print's mask sentence adds "This is the keep-and-renormalize step of
  top-$k$ and nucleus sampling in Chapter 13, applied to keys instead of next tokens". At the mask the reader of
  this edition has not met those samplers, so the clause is dropped and the practice bridge makes the link once,
  pointing back.
- **Figure.** The caption's panel letters a), b), c) became "Left:", "Middle:" and "Right:" (this edition's
  caption style, VOICE.md D12 and ruling Q14), and the HTML TikZ copy drops the drawn letters and moves each
  plane title to its frame's left edge. "It is ink" became "it is drawn in black", the caption's semicolons
  became sentence breaks, and the alt text is print's description with "panel a" read as "the left panel".
- **Haviv et al.** The existing sentence "...might suggest; fixed sinusoidal encoding still produces a large
  improvement in this run." is split at its semicolon so that the insertion lands where print puts it.
- **Box.** Print's `dlnote` is a `callout-note`, as for the existing box "Rotate the queries and keys".
- The two approved passages inside NOVEL-marked blocks (Haviv et al. and the practice-bridge paragraph) say in
  their comments that they are approved on their own while the surrounding block keeps its own sign-off status.
- Side file: `audits/voice/clarity_proposals.md` row C5-24 notes that its quoted span now ends at "might
  suggest." and that "Fixed sinusoidal encoding ..." is a separate sentence after the Haviv insertion.

For the author:

1. **N25-1, the hedge.** Print reads "This structure may be why the no-position model does better than a purely
   orderless caricature might suggest; training a model that sees only the unordered set of earlier characters
   on the same schedule would test this explanation." This edition still says "That is why ...", as the
   2026-10-05 ledger decided under Q12, and now follows it with Haviv et al.'s "the authors proposed that the
   causal mask supplies this information". The HTML states as fact what its new source proposes. If N25-1 is
   approved, the sentence becomes print's two sentences.
2. Print's adaptation `ch16-orderless-mechanism` and N25-1's hunk in `reports/novel-review/replacements.patch`
   both find "might suggest; fixed sinusoidal encoding", which the split removes. That matters only if print's
   `convert.py` runs on Chapter 16 again.

## Chapter 17: Interlude: Attention as Test-Time Regression

Carried:

- **Why softmax's exponential kernel has no finite exact feature map** (Frontiers item 8), in "Solver 2: collapse
  a factorized kernel into sufficient state", inside the paragraph that opens "There is a price.": with
  $1/\sqrt{d_k}$ absorbed into $\vect{q}$, the Taylor series of $\exp(\vect{q}^\top\vect{k})$ gives an exact
  feature map with features built from all products of $m$ coordinates for every $m$, infinitely many in all. A
  footnote after "approximates it." adds even-power truncation and positive random features (Choromanski et
  al.), whose relative error can rise as $\norm{\vect{q}}$ and $\norm{\vect{k}}$ grow.
- **Sources: Choromanski et al., *Rethinking Attention with Performers***, between Katharopoulos et al. and
  Schlag, Irie, and Schmidhuber.

Adaptations: the footnote cites "(Choromanski et al.)" in text, as this edition does elsewhere, with the link in
Sources.

For the author (both editions):

1. $\ell$ is the coordinate index in the new sentence and also the loss $\ell_t$ of Solver 3; print has the
   same clash. Rename the index to $i, j$?
2. The argument builds an infinite exact map but does not show that no finite map exists. Optionally add that
   no finite $r$ works because the Gram matrices $[\exp(\vect{q}_i^\top\vect{k}_j)]$ over distinct inputs reach
   any rank.

## Chapter 21: Instruction Tuning and Preference Learning

Carried:

- **The Gibbs policy as a temperature softmax** (Frontiers item 3), in "The exact finite-response policy", after
  "Large $\beta$ resists movement; small $\beta$ applies more reward pressure.": in vector form
  $\vect{\pi}^*=\operatorname{softmax}(\vect{r}/\beta+\log\vect{\pi}_{\mathrm{ref}})$, the temperature softmax of
  @sec-02-logistic-softmax with $\beta$ as the temperature and the reference log probabilities as offsets
  $\beta$ does not scale, so a large $\beta$ returns the reference rather than the uniform distribution.
- **A fourth row of @tbl-alignment-route-choice** (item 2), "Programmatic check + online policy optimization",
  in "Choose by the feedback and exploration you have".
- **Checkers and reward hacking** (item 2), after "...They also have more ways to fail and more to evaluate.":
  a unit test or a known final answer sets $r_i\in\{0,1\}$, so the first term of @eq-kl-regularized-objective
  becomes the expected pass rate; a footnote separates outcome from process supervision; a checker is still a
  proxy, and code that handles only the tested inputs earns full reward, which defines **reward hacking**.
- **Exercise 5** gains a closing sentence: does the reader's domain admit the table's programmatic check, and
  what would it leave untested?
- **Sources**: Lambert et al. (*Tülu 3*), Lightman et al. (*Let's Verify Step by Step*) and Liu et al. (*Is Your
  Code Generated by ChatGPT Really Correct?*), after Bai et al.

Adaptations: print's row reads "Programmatic check + KL-regularized policy | ... | Regularized policy
objective, with no reward model". This edition's third row was never carried to print's wording; it still
names online policy optimization and a value function. The new row is that row without the reward proxy:
"Programmatic check + online policy optimization" and "Value function and policy objective, with no reward
model". Supervision, fresh samples and main risk are print's.

For the author:

1. **ch21-note-020.** Should this edition's route table drop the reinforcement-learning items (value function,
   exploration, credit assignment) as print did? If yes, rows 3 and 4 both take print's wording.
2. (Both editions, optional) Row 4's main risk omits the optimizer risks it shares with row 3, which print's row
   3 calls "optimization stability". Add them to both editions if the table should say so.
3. "As it moved the narrow-feedback policies beyond the feedback range" relies on the printed lengths (0.90 to
   1.96) rather than a sentence; print states it in the rewrite `ch21-print-895`, which the next Chapter 21
   ledger pass could carry. Its four numbers are already printed.

## Chapter 22: Generative Models: From Codes to Samples

Carried:

- **The denoising-autoencoder recall** (Frontiers item 5), in "Learn the path back", after
  @eq-diffusion-simple-loss and before "At the population MSE optimum...": the denoising autoencoder of
  @sec-interlude-autoencoders moved its output toward the conditional mean of the clean inputs, and the
  diffusion loss has the same form with the noise as the target (@sec-a5-statistical-learning gives the general
  result).
- **A sample-based result belongs to the weights and the sampler** (piece C), in "Evaluating a generator", after
  "...neither makes the other correct." and before the callout "Small models with known answers": a diffusion
  network's sample distribution is fixed only once the sampler is specified, so a report names the sampler
  settings and the variation across training and sampling seeds, as each run of @sec-learning-by-experiment
  records its configuration.
- **Sources: Vincent, *A Connection Between Score Matching and Denoising Autoencoders*** (2011), between Ho,
  Jain, and Abbeel and Song et al.

Adaptations: print credits all five decoding rules to its Chapter 13. Here greedy and beam search stay with
@sec-11-encoder-decoder, and temperature, top-$k$ and nucleus sampling point to "the optional practice bridge
of @sec-14-self-attention-transformer". "\Eqnref{eq-diffusion-simple-loss} has the same form" became "The loss
in @eq-diffusion-simple-loss has the same form", so that no sentence opens on a bare reference.

Dependency: the recall's parenthetical points to the Appendix E paragraphs below; land or revert the two
together.

## Appendix E: Statistical Learning Contracts

Carried:

- **What each loss's population minimizer predicts** (Frontiers item 5), three paragraphs in "A loss assumes a
  conditional distribution", after the paragraph under @tbl-a5-nll-losses and before "Why the Gaussian is
  plausible, and where it is not": squared error is minimized by the conditional mean, absolute error by a
  median, cross-entropy by the true class probabilities (entropy plus a KL divergence); the minimizers do not
  depend on which likelihood row is true; and the conditional mean is a projection whose residual is orthogonal
  to every function of the input, toward which the denoisers of @sec-interlude-autoencoders and
  @sec-19-generative are trained.
- **Sources: Gneiting, *Making and Evaluating Point Forecasts***, between Geman, Bienenstock, and Doursat and
  Kullback and Leibler.
- **Exercise 7** (Pencil), appended last: the residual $Y-f^*(X)$ is orthogonal to every square-integrable
  $g(X)$, the expected squared error splits into noise plus distance to $f^*$, and @fig-bias-variance's
  straight lines read in that split. Print `ex-appE-7`.

Not carried: Doob (1953), which print names only in a LaTeX comment, not in its Sources.

## When the decoding move reaches this edition

The October 8 ledger moves the decoding rules into Chapter 13 (ch13-rev16-26, -36), and the move waits for the
author. When it lands:

- move the per-step masking paragraph from Chapter 16's practice bridge back to Chapter 13's sampling
  subsection, next to Exercise 9, and shorten "(Exercise 9 of @sec-11-encoder-decoder)" to "(Exercise 9)";
- restore print's clause in Chapter 16's mask sentence that names top-$k$ and nucleus sampling;
- drop Park et al. from Chapter 16's Sources and the last sentence of Chapter 13's Exercise 9;
- in Chapter 22, drop "in the optional practice bridge of @sec-14-self-attention-transformer", so that
  @sec-11-encoder-decoder covers all five decoding rules, as in print.

## Checks

On the worktree with `~/.venvs/dl-book/bin/python`: `audit_typed_numbers.py`, `audit_independence.py --warn`,
`audit_book_contract.py`, `audit_public_anchors.py`, `audit_plan_code.py`, `audit_python_sources.py` and
`audit_excerpt_fixtures.py` pass. The added prose has no em dash and no typed chapter number, and no indented
continuation line begins with an `@` reference; `git diff --check` is clean. The porters' `quarto pandoc` parses
read each Sources and Exercises list as one list, the Chapter 16 figure as a Figure with its id and alt text, and
every footnote as a note.
