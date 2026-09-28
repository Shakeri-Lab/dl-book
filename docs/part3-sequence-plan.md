# Part III revision plan: requirements first, a running translator, two ways out

*Drafted 2026-09-27 for the author's review. Nothing here is authorized until the author
approves it; the decisions at the end are his. Sources: the author's brief (September 27),
the DL7.1 (RNN), DL7.2 (LSTM) and DL7.3 (coding RNN and LSTM from scratch) classroom
transcripts, Assignments 3–5 in `Shakeri-Lab/deep-learning-student-materials`, and the
current Chapters 10, 11, 13, 14, the autoencoder interlude, the test-time-regression (TTR)
interlude, and Chapters 15 and 17.*

## 1. The brief, restated

- Teach sequence models as a development: state the **minimal requirements** of the
  problem, build the smallest design that meets them, **patch** its failures with
  engineering (LSTM, GRU), and end with the **solutions research pursues**.
- Leave the reader ready for **Transformers** (Chapters 13–14) and **state-space models**
  (currently the TTR interlude), and for continued outside reading.
- Thread a **running translator** through the exercises, starting at the autoencoder
  interlude: minimal → RNN → LSTM → seq2seq → cross-attention → self-attention
  (Transformer) → pretrained models. Translation is the course's homework problem
  (Assignments 3–4) for its pedagogical and historical role.

## 2. What the book already does (keep it)

Chapter 10 already follows DL7.1–7.2 almost beat for beat. A revision should sharpen, not
rewrite.

| Lecture beat | Where it already lives |
|---|---|
| AE limits: fixed code for any length, no streaming, order, cannot revisit | AE interlude, "Why a one-shot encoder cannot be the whole sequence model"; Ch. 10 opening |
| Naive per-step $f_t$ with concatenated state; parameter explosion; non-stationarity | Ch. 10 "Stretching the old toolkit" (plus a window-MLP strawman the lecture lacks) |
| Share $f$ across time; Markov state; resolves the AE issues | Ch. 10 @eq-recurrence and the Markov callout ("third weight sharing") |
| BPTT, product of Jacobians, explode or vanish | Ch. 10 @eq-bptt, @fig-vanishing-time |
| Clipping is a band-aid | Ch. 10 callout "Gradient clipping is a seatbelt, not a cure" |
| Truncated BPTT exploiting the Markov property; chunk sizes | Ch. 10 "Training with a finite horizon" (truncated versus fixed-window) |
| LSTM as conveyor belt plus valves; sigmoid controller, tanh content shaper | Ch. 10 design-by-constraints list, @eq-lstm, @fig-lstm-conveyor, @eq-lstm-highway |
| Forget gate open at the start | Ch. 10 forget bias +1, the lag-80 memory test, @fig-forget-gate-diagnostic |
| GRU: merged states and gates, reset gate | Ch. 10 @eq-gru, convention warning, Exercise 3 |
| Seq2seq for translation (teaser) | Ch. 10 closing; Ch. 11 in full (date task) |

The date task (Ch. 11 → Ch. 13) and the book-corpus LM (Ch. 10 → Ch. 14) are closed
running benchmarks. This plan does not reopen them.

## 3. Gaps against the brief and the lectures

1. **The requirements are implicit.** Variable length, order, streaming, length-free
   parameters, reach, and trainable reach are argued in scattered paragraphs. The
   reader never sees one list that each design is scored against, so the development
   (and what each later chapter adds) is harder to hold.
2. **The patches are not collected.** Clipping, truncation, gating, and the forget
   bias appear in order, but the reader is not shown, in one place, what each patch
   fixes and what none of them fix (the serial time loop; the fixed-size state).
3. **Research directions end at a pointer.** The closing names only the attention
   route. The second route that research took, making the recurrence linear in its
   state so it can be computed in parallel (the core of today's linear-recurrent and
   state-space models), is never shown, although the TTR interlude later relies on it.
4. **DL7.3's coding lessons are missing.** The masked update that freezes the state on
   padding, separate $W_{ih}$/$W_{hh}$ with orthogonal $W_{hh}$ initialization
   (spectral radius), and the observation that the vanilla RNN's gradient norm keeps
   hitting the clip while the LSTM's does not.
5. **DL7.1's randomized-versus-regular truncation** discussion is absent.
6. **No translator thread.** Translation appears only as the date-task miniature; the
   homework's English→French task has no counterpart in the exercises, and the AE
   interlude mentions translation only in one sentence.
7. **Assignment 5's MLA** (latent compression of the KV cache) has no book counterpart,
   although the TTR interlude's memory-contract price list is the natural home.

## 4. Proposed changes

### 4.1 Chapter 10 (the pass to do first)

**(a) Requirements ledger, opening.** Replace the opening's scattered argument with one
compact list the chapter keeps returning to. Plain language; no later-chapter names.

| | Requirement | Why sequences demand it |
|---|---|---|
| R1 | Accept any length | Sentences, streams, and documents stop whenever they please |
| R2 | Respect order | Shuffle a sentence and its meaning changes |
| R3 | Stream | Update as each element arrives; an answer so far is available |
| R4 | Parameters independent of length | A rule learned at position 17 must hold at 18 |
| R5 | Reach | Evidence from arbitrarily far back can matter |
| R6 | Trainable reach | Gradients must actually carry learning signal across that reach |
| R7 | Revisit | Consult an earlier element directly, not only through a summary |
| R8 | Parallel over time | Train all positions at once rather than one step after another |
| R9 | Bounded memory per new element | Inference cost per token should not grow with history |

R7–R9 are introduced as the questions the recurrent answer leaves open; they are what
Chapters 11, 13, 14 and the TTR interlude will each answer, in that order.

**(b) Requirements scorecard, closing.** Replace the closing's two paragraphs with one
table: designs as rows, R1–R9 as columns, each cell ✓ / ✗ / partial with a
one-phrase reason tied to an experiment or derivation in the chapter.

| Design | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 |
|---|---|---|---|---|---|---|---|---|---|
| One-shot autoencoder (interlude) | ✗ max length | slots | ✗ | ✗ | within max | n/a | ✗ | ✓ | ✓ |
| Window MLP | ✓ | within $k$ | ✓ | ✗ grows with $k$ | ✗ $k$ steps | ✓ | ✗ | ✓ | ✓ |
| A function per timestep | ✗ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✓ |
| Vanilla RNN (+ clipping, truncation) | ✓ | ✓ | ✓ | ✓ | ✓ in principle | ✗ lottery at lag 80 | ✗ | ✗ | ✓ |
| LSTM / GRU (+ forget bias) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ at lag 80 | ✗ | ✗ | ✓ |
| Gated linear recurrence (4.1 e) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ $\lceil\log_2 T\rceil$ rounds | ✓ |

Later chapters add their own row in their recaps (Ch. 11 seq2seq, Ch. 13 attentive
seq2seq, Ch. 14 Transformer, TTR fixed-state solvers). The empty R7 column is the debt
Part III hands to Part IV; the Transformer's ✗ in R9 is the debt Chapter 14 hands to
the TTR interlude. This one artifact is the "development of ideas" the brief asks for,
and it prepares Transformers and state-space models by name only when each is built.

**(c) A patch ledger** (one compact table after GRU, or folded into the recap):
symptom → patch → what it does not fix. Exploding gradients → clipping (vanishing
untouched); book-length unrolls → truncation/fixed windows (no gradient past the
horizon); repeated $W_{hh}$ gain → orthogonal or spectrally scaled init (only at birth;
$\tanh'$ still shrinks); multiplicative decay → additive gated cell (gate products still
decay, $\sigma(0)^{80}$); half-closed valves at birth → forget bias +1 (a default, not a
guarantee); padding in a batch → masked update (harvested as packing in Ch. 11). Two
rows have no patch: the serial loop and the fixed-size state. They lead to (e).

**(d) Three short lecture additions, each a sentence or an equation:**
the masked update $\vect{h}_t=\vect{m}_t\odot f(\vect{h}_{t-1},\vect{x}_t)+(1-\vect{m}_t)\odot\vect{h}_{t-1}$
(DL7.3; planted here, harvested by Ch. 11's padding trap as what packing does for you);
orthogonal $W_{hh}$ initialization and the spectral-radius reading of @eq-bptt (DL7.3,
extends Exercise 2); randomized versus regular truncation (DL7.1: random horizons are
unbiased in expectation but add gradient variance; a fixed horizon biases toward short
dependencies, which can act as a mild regularizer; engineering heuristic, cite Tallec and
Ollivier).

**(e) "Two ways out" research bridge (new section, replaces the closing's forward
pointer).** Neither patch touches the serial loop or the fixed state. Research took two
routes:

1. *Keep every state and look back* (the route Part IV builds; no mechanism named yet).
2. *Make the recurrence linear in its state.* If the gates read only $\vect{x}_t$, the
   cell update $\vect{c}_t=\vect{f}_t\odot\vect{c}_{t-1}+\vect{i}_t\odot\tilde{\vect{c}}_t$
   is a first-order linear recurrence. Pairs $(a,b)$ compose associatively,
   $(a_1,b_1)\circ(a_2,b_2)=(a_1a_2,\;a_2b_1+b_2)$, so all $T$ states come out of a
   parallel scan in $\lceil\log_2 T\rceil$ rounds instead of $T$ steps. **Pre-tested**
   (numpy, float64, seed 6050): $T=1000$, loop 1000 steps versus scan 10 rounds, max
   difference $6.66\times10^{-16}$. The price is visible too: once the gate reads
   $\vect{h}_{t-1}$ (a true LSTM), the pairs do not exist until the loop has run.

   One executable cell (loop versus scan, assert equality, print rounds) plus one
   sentence per family in Sources as **research frontier**: QRNN and SRU (input-only
   gates for parallelism), Martin and Cundy (parallel scans for linear RNNs), LRU, S4,
   Mamba, xLSTM, minGRU/minLSTM ("Were RNNs All We Needed?"), RWKV and Griffin. The TTR
   interlude then harvests the scan by name when it derives the delta rule's
   state-space form and Mamba's selectivity. Flag `<!-- NOVEL: needs sign-off -->`.

**(f) Exercises.** Add Running translator v1 (4.3) and one (Code.) item: orthogonal
$W_{hh}$ in the gradient-versus-lag experiment plus the fraction of clipped steps for
RNN versus LSTM in the memory test (DL7.3's gradient-norm observation, measured).

**Budget.** Replace, do not append: (a) replaces the opening's order paragraph and part
of the toolkit prose; (b) replaces the closing's two paragraphs; (c) shortens recap
items 3–5; (e) is the one net addition (about one page with its cell). Target: no net
page growth beyond (e).

### 4.2 The running translator: one contract, one exercise per chapter

**Contract** (stated once, in the AE interlude's exercises or a short project page, and
cited thereafter):

- *Data.* English→French sentence pairs from Tatoeba, the same source Assignments 3–4
  use (the PyTorch tutorial archive's `eng-fra.txt`, derived from manythings.org/Tatoeba,
  CC BY 2.0 FR). Pin one SHA-256; declare the filter (first 15,000 pairs, at most 14 words
  per side, as in the homework) and one seeded 80/10/10 split with zero exact-source
  overlap.
- *Tokens.* Word level after one declared normalization; `<pad>`, `<bos>`, `<eos>`,
  `<unk>`.
- *Evaluation.* Per-token cross-entropy with `ignore_index` (Ch. 11's estimator), token
  accuracy, and corpus BLEU (Ch. 11 Exercise 6's implementation), always on the same
  validation split; the test split is opened once per version.
- *Ledger.* One row per version, the same columns every time, as Assignment 4's
  performance table does. A version changes one thing.

**Versions** (each a (Code.) exercise, with an (Audit.) part where the change invites a
tempting wrong conclusion):

| Version | Chapter | What changes | What it should expose |
|---|---|---|---|
| v0 one-shot | AE interlude | Padded, flattened source → MLP code → fixed slots of target logits; then a mean-pooled bag-of-words encoder | R1, R2, R3 fail measurably: truncation, identical codes for reordered sentences, slot-specific weights |
| v1 recurrent reader | Ch. 10 | From-scratch masked RNN, then LSTM/GRU encoder (forget bias +1, orthogonal $W_{hh}$), v0's slot decoder kept | Order and source length solved; accuracy by source-length bucket for the fixed state |
| v2 seq2seq | Ch. 11 | Recurrent decoder, `<bos>`/`<eos>`, teacher forcing, packing, greedy and beam, BLEU | = Assignment 3; exposure bias; the bottleneck by length bucket |
| v3 attention | Ch. 13 | Cross-attention (additive or dot), source masks, alignment maps on real sentences | = Assignment 4; BLEU by source length against v2 |
| v4 Transformer | Ch. 14 | Encoder self-attention, causal decoder self-attention plus cross-attention, positions | Matched schedule against v3; optional Assignment 5 swaps (RMSNorm, RoPE, MLA) |
| v4b fixed-state memory | TTR interlude | Decoder self-attention replaced by a gated linear or delta state | Quality against state bytes: the memory contract made measurable |
| v5 pretraining | Ch. 15 | T5-style span-corruption pretraining on the corpus's monolingual side, then fine-tuning | A label-scarcity ladder (1k / 5k / all pairs) against training from scratch |
| v6 adaptation | Ch. 17 | A licensed pretrained translation checkpoint adapted with LoRA, then quantized | What adaptation and quantization cost in BLEU and bytes |

The book publishes no solutions and no numbers for these exercises unless the author
later approves a reference ledger (the backlog's "Ch. 11 translation, full scale"
Rivanna study is the natural source). Exercise text should not reproduce graded homework
code.

### 4.3 Chapters after 10 (outline; each done in its own pass)

- **AE interlude**: translator contract plus v0; no change to its experiments.
- **Ch. 11**: harvest the masked update in the padding trap; add the seq2seq row to the
  scorecard; v2 exercise. Assignment 3's theory questions (bottleneck, reversal, TBPTT,
  packing) are already answered in Chapters 10–11.
- **Ch. 13**: scorecard row (R7 now ✓, R8 still ✗); v3 exercise with the length-bucket
  analysis Bahdanau et al. made famous.
- **Ch. 14**: scorecard row (R8 ✓, R9 ✗: the KV cache grows); v4 exercise.
- **TTR interlude**: harvest Chapter 10's scan by name; fixed-state row; v4b; an (Audit.)
  exercise placing Assignment 5's MLA on the price list (it compresses each retained row,
  so its cache still grows with length: a compressed dataset, not a fixed state).
- **Ch. 15 / Ch. 17**: v5 / v6 exercises.
- **arc-seeds.md**: new rows for the requirements ledger (planted Ch. 10, harvested in
  each recap), the linear-recurrence scan (Ch. 10 → TTR), the translator thread (AE →
  Ch. 17), and the patch ledger.

## 5. Costs and risks

- **Every chapter edit means re-executing that chapter.** Freeze hashes are the MD5 of
  the whole `.qmd` (verified for Chapters 10, 11, 13, 14), so even an exercise-only edit
  requires a local run and a new `_freeze/`. Chapter 10 takes minutes (char-LM,
  memory test); Chapters 14 and 15 are heavier. Unchanged cells must reproduce
  byte-identical stdout (`audit_frozen_stdout.py`); a torch or thread change can move
  them, as happened once in an interlude. Batch every change to a chapter into one pass.
- **New stdout** (the scan cell; clip-rate lines, if added to the memory test) needs
  entries in `scripts/notebook_stdout_contracts.py`.
- **Citations** in 4.1 (e) and (d) must be verified (arxiv/openalex) before drafting.
- **Show-then-name.** Chapter 10's scorecard shows only its own rows; R7–R9 are posed as
  questions, not answered with later names. The research bridge names families only in
  Sources and after the reader has built the mechanism.
- **Homework overlap.** v2–v3 coincide with Assignments 3–4 by design; exercises state
  tasks and contracts, never solutions.

## 6. Author decisions (2026-09-27) and status

1. **Scope**: Chapter 10 plus the autoencoder interlude's v0 now; then one chapter at a
   time. **Done for Chapter 10 and the interlude** (this pass).
2. **Running scorecard across the book: no.** Chapter 10 states the six requirements
   in its opening and scores its own designs in prose at the close; later chapters may
   call back to the list in prose only. Sections 4.1 (a)–(b) and 4.3's "scorecard row"
   items are therefore withdrawn.
3. **Research bridge: an exercise, not a section.** Chapter 10's Exercise 8 is marked
   "Research bridge (non-examinable)" and points to the papers listed under Sources;
   the closing mentions it in one sentence.
4. **Translator data: general.** Exercises name example corpora (Tatoeba English–French,
   Multi30K) without pinning one.
5. **Reference results: none.** The translator exercises stay open.
6. **GRU in the memory test: yes.** Pre-tested and shipped: default GRU and GRU $+1$
   stay at chance on all seeds, GRU $+2$ solves every seed; a new signal-at-birth
   column (gradient reaching the first input at lag 80 before training, seed-6050
   initialization) explains the ladder. The original three rows reproduced exactly.
   The GRU section now precedes the memory test.
7. **IMDb: yes, as an exercise** (Chapter 10 Exercise 6, from-scratch cells with the
   masked update, orthogonal $W_{hh}$, fused LSTM affine, forget bias, clip logging).

**Chapter 11 pass: done (2026-09-27)**: writing requirements in the opening, the
masked-update check, the handoff figure redrawn, Exercises 7 (v2) and 8 (research
bridge to sequence-level training). The original plan for it read: harvest @eq-masked-update in the padding trap; add
Running translator v2 (seq2seq, teacher forcing, packing, beam, BLEU; the Assignment 3
counterpart). Then Chapter 13 (v3), Chapter 14 (v4, Assignment 5's RMSNorm/RoPE/MLA as
optional swaps), the TTR interlude (v4b; MLA on the price list; harvest Exercise 8's
scan), Chapter 15 (v5), Chapter 17 (v6).
