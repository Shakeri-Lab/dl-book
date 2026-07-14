# Arc-Seed Ledger & Reader's Toolbox

*The book's through-line is a relay: early chapters plant named ideas ("seeds")
that later chapters harvest explicitly. This ledger is the contract. Before
drafting a chapter: (1) harvest every seed due in it BY NAME (the prose should
say "Chapter N promised you X"), (2) plant the seeds it owes the future, (3) add
new rows here. The pedagogical-efficiency rule (drafting-template) depends on
this file: a concept with no payoff chapter listed here should be an exercise or
a cut.*

*Updated: 2026-07-14, after Chapter 18 shipped.*

## 1. Seeds planted and their harvest contracts

| Seed (phrase as planted) | Planted | Harvest | Status |
|---|---|---|---|
| Dot product = similarity score against a template | ch. 1 | ch. 7 (sliding template), ch. 12 (kernel similarity), ch. 13 (QK scores) | done |
| Prediction = weighted combination of training targets | ch. 1 | ch. 12 (Nadaraya–Watson IS this, made explicit) | done |
| Softmax = the scores→weights machine | ch. 2 | ch. 12 (kernel weights), ch. 13 (attention weights) | done |
| "Softening the hard" / differentiable lookup ("A differentiable lookup, it turns out, is precisely attention") | ch. 2 | ch. 13 — harvest by name | done |
| Temperature dial between hard max and uniform | ch. 2 | ch. 10 ✓ (sampling); ch. 13 (√d as temperature) | done |
| Compositional hierarchy: features of features | ch. 3 | ch. 8 ✓ (receptive fields make it architectural) | done |
| Gradient superhighway (ReLU's open gate) | ch. 5 | ch. 9 ✓ (residual = the highway as infrastructure), ch. 10 ✓ (cell state = highway through time) | done |
| Float-precision death (tiny signals can become numerically unusable) | ch. 5 | ch. 9 ✓ (norm underflow + update-resolution diagnostic), ch. 10 ✓ (σ(0)^80); appendix a4 (gather all three) | a4 due |
| Constraints are knowledge / inductive bias prescription | ch. 6 | ch. 7–8 ✓; ch. 16 ✓ (ViT trades the bias away — "inductive bias strikes again, this time as a trade") | done |
| Shift cliff (MLP collapses under 2px shift) | ch. 6 | ch. 8 ✓ (rematch), ch. 9 ✓ (GAP flattens it) — the book's first running benchmark | done |
| Global templates figure (fig-templates) | ch. 6 | ch. 8 ✓ (learned local kernels vs. global smears) | done |
| Sliding dot product; "what if the template were learnable?" | ch. 7 | ch. 8 ✓ — the Part II pivot | done |
| Equivariance banked → local shift tolerance purchased | ch. 7 | ch. 8 ✓ (pooling, explicitly not exact invariance) | done |
| Pooling discards *where* → "we will pay to put position back in" | ch. 8 | ch. 14 (positional encodings; self-attention is permutation-equivariant) | done |
| Head-parameter imbalance (96% in LeNet's head) | ch. 8 | ch. 9 ✓ (1×1 + GAP fire the head) | done |
| CNN buys global sight through depth; attention buys it in one step | ch. 8 | ch. 13 (@sec-13 named in ch. 8 prose) | done |
| Residual stream: "each block reads from it and writes small corrections back… attention will be one kind of correction" | ch. 9 | ch. 14 — harvested by name (x + F(x) wraps every block) | done |
| LayerNorm: "same equation, different axis — remember @eq-batchnorm when you meet it" | ch. 9 | ch. 14 | done |
| Transfer decision rule (labels scarce ∧ task feature-hungry ∧ coverage at matched scale) | ch. 9 | ch. 15 ✓ (controlled generated-token transfer); ch. 17 ✓ (adaptation changes cost and permitted writes, not source coverage) | done |
| Third weight sharing (examples → space → time) | ch. 10 | ch. 14 (stationarity retained; one comparison rule shared across ordered pairs) | done |
| Finite-state bottleneck; "the book ends Part III when we refuse to pay that price" | ch. 10–11 | ch. 12 (retain the memory bank), ch. 13 (learn the access rule) | done |
| Fixed attention matrix; "what if the similarity itself were learnable?" | ch. 12 | ch. 13 (learned compatibility and the date-task rematch) | done |
| "Hard address, learned content" (embeddings); soften the address too | ch. 11 | ch. 13 — harvest the phrase | done |
| Masking = "which positions it may not look at"; causal mask preview | ch. 11 | ch. 14 (causal mask turns transformer into LM) | done |
| Date-normalization benchmark (leak-free packed seq2seq: 53.8% @ epoch 6, 95.0% @ 12 on 400 unambiguous validation sources; 93.1% on the final 437-source unambiguous test; alignment invisible) | ch. 11 | ch. 13 — attention: 93.25% @ 6, 99.75% @ 12, 100.0% final test; validation alignment visible | done |
| Cross-attention repairs the fixed handoff, but the surrounding RNNs remain serial; the Q/K/V operator does not care where its inputs came from | ch. 13 | ch. 14 (replace recurrence with self-attention; derive and implement multi-head) | done |
| Beam search / decoding machinery | ch. 11 | chs. 15/17 (LM decoding reuses it) | ambient |
| Book-corpus char-LM (held-out fixed-window loss 1.89; sampled training minibatch 1.42; babble) | ch. 10 | ch. 14 (exact corpus/split/evaluation and historical window schedule; positional transformer 1.9190, no-position 2.3405) | done |
| Visibility is a modeling decision | ch. 14 | ch. 15 (causal generation versus bidirectional masked-token representation learning) | done |
| Global routing trades away locality bias | ch. 14 | ch. 16 ✓ (patch-token ViT rematches convolution's built-in geometry in a five-seed scratch regime) | done |
| A learned summary token can gather a sequence for a downstream head | ch. 15 | ch. 16 ✓ (`[CLS]` becomes a learned meeting place over image patches, not a summary by birth) | done |
| Pretraining is a regime, not an architecture | ch. 15 | ch. 16 ✓ (the same encoder pattern crosses from text to vision; data scale can reverse the CNN–ViT ranking) | done |
| Training-optimal is not serving-optimal | ch. 16 | ch. 17 — harvested by name: Chinchilla allocates training compute, not storage, inference, or adaptation cost; the mismatch motivates prompting, PEFT, and quantization | done |
| Fine-tuning changes every encoder weight; what if the backbone is too large? | ch. 15 | ch. 17 (prompting, PEFT, quantization) | done |
| Where the update lives is not what the update optimizes | ch. 17 | ch. 18 — harvest by name: adaptation chooses permitted writes and representation; instruction or preference objectives choose rewarded behavior | done |
| A judge is not a generator | ch. 18 | ch. 19 — harvest by name: reward models and preference losses evaluate completed samples; generative modeling learns the distribution that produces them | ch. 19 due |
| m06 autoencoder spine (PCA = linear AE, bottleneck, manifolds) | (unused by design in ch. 11) | ch. 19 | due |

## 2. Cross-chapter running benchmarks

1. **The shift cliff** (Fashion subset, `shift_right`): ch. 6 MLP 80.8→42.0% @2px →
   ch. 8 LeNet 82.5→62.3% → ch. 9 NiN+GAP 76.2→66.5% from 0→4px (a much gentler
   slope, not exact invariance). Ch. 16 reopens the mechanism in a separate,
   explicitly paired scratch regime: on the fixed 1,000-fit/200-validation Chapter
   6 split over seeds 6050–6054, the tiny CNN averages 73.9→58.9% and the tiny ViT
   70.1→25.2% from 0→4px. The CNN wins all five clean pairs and all 25
   seed×shift validation comparisons; on the already-opened 600-image benchmark,
   clean means are 77.9% and 73.3%. Parameters differ by 3.0%, minibatch schedules
   are pair-exact, and the dot-product proxies differ by 1.8%; architecture-specific
   tuning and pretraining are not matched, and zero filling clips the right edge.
   Closed.
2. **The date task** (synthetic, ch. 11): 9,000 unique source strings split
   8,000/500/500 for train/validation/test, with zero exact-source overlap between
   every pair. The packed seq2seq baseline is 53.8% at epoch 6 and 95.0% at epoch 12
   on a fixed subset of 400 of the 421 unambiguous validation strings. After 25 epochs,
   the single final audit scores 93.1% on all 437 unambiguous test strings (naive
   padding: 34.3%; free-running: 99.1%). Ch. 13 closes the benchmark with the exact
   generator/split and an additive-attention LSTM: 93.25% at epoch 6, 99.75% at
   epoch 12, and 100.0% on the one final 437-source test audit. Across the fixed
   validation subset, its first four decoder rows place 97.469% of their mass on
   contextual states indexed by the source-year region. Schedule matched, but not
   parameters (+59.2%), compute, or minibatch order. Closed.
3. **The book-corpus LM**: ch. 10 char-LSTM (hidden 128, random fixed windows of
   100 characters, 2,501 updates) finishes at sampled-minibatch loss 1.42 and
   held-out fixed-window loss 1.8881. Ch. 14 reconstructs its exact historical
   2,501-by-64 window schedule and matches corpus, split, evaluation, optimizer,
   clipping, targets, and parameter scale. Its 132,488-parameter positional
   Transformer reaches train/held-out 1.1132/1.9190; the no-position ablation reaches
   1.8672/2.3405. Position improves 0.4214 (18.0%) in the matched seed; the LSTM
   narrowly remains ahead by 0.0309 (1.64%). The positional repeat is tensor- and
   metric-exact. Closed. NOTE: the corpus is `glob("../part*/0*.qmd")` — Chapters
   1–9 only, code cells stripped; editing those chapters changes the corpus only
   when ch. 10/14 re-render (freeze).

## 3. Reader's toolbox — what is introduced where (reading-order rule)

Chapter N may only *use* what appears at ≤ N. Introducing a tool = its row here. A
deliberately labeled **framework preview** may use a later tool only as a measuring
instrument after the chapter has built the underlying idea with its current toolbox;
the preview does not make that tool generally available, and it must point to the
chapter that opens the black box. Chapters 1, 3, and 4 use this narrow exception for
optimizers or `backward()` before Chapter 5.

| Ch. | New tools/concepts available afterwards |
|---|---|
| 1 | linear regression, least squares, ridge; dot products; train/test split; `torch` tensors, matmul |
| 2 | logistic/softmax, cross-entropy, logits discipline (`F.cross_entropy` on logits), one-hot |
| 3 | MLP, ReLU, hidden layers, `nn.Module` subclassing, `nn.Sequential`, `nn.Linear` |
| 4 | loss landscapes, (S)GD, minibatches, learning rates, Adam, `torch.optim`, LR schedules (basic) |
| 5 | backprop/chain rule, autograd (`backward`, `requires_grad`, `detach`), vanishing/exploding intuition, init scales, `grad_by_layer` figure family |
| 6 | generalization, overfitting, capacity, inductive bias, Fashion-MNIST subset (`data/fashion-*.pt`), shift/shuffle experiments |
| 7 | convolution/cross-correlation, kernels, `F.conv1d/2d`, equivariance, filter zoo |
| 8 | `nn.Conv2d`, channels, padding/stride, `F.max_pool2d`, receptive fields, NCHW, LeNet, parameter audits |
| 9 | BatchNorm (+train/eval modes), conv-BN-ReLU atom, 1×1 convs, GAP (`nn.AdaptiveAvgPool2d`), residual blocks, `weight_decay`, transfer mechanics (`requires_grad=False`, param groups/two LRs), `F.interpolate`, torchvision model loading from committed weights |
| 10 | `nn.RNN`/`nn.LSTM` (+GRU eqs), BPTT, truncated chunks, `clip_grad_norm_`, `F.one_hot` (in models), sampling with temperature, `torch.multinomial` |
| 11 | encoder–decoder, `nn.Embedding`, PAD/BOS/EOS, `pad_sequence`, `pack_padded_sequence`, `ignore_index`, teacher forcing/free-running, exposure bias, scheduled sampling (concept), greedy/beam search, length normalization |
| 12 | kernels/bandwidth, Nadaraya–Watson, queries/keys/values, row-softmax over log-kernel scores, attention-weight matrices (fixed) |
| 13 | learned Q/K/V, additive and scaled dot-product cross-attention, source-padding attention masks, attention-augmented seq2seq, alignment heatmaps; multi-head preview only |
| 14 | permutation-equivariant self-attention, custom multi-head attention, causal masks, sinusoidal positional encoding, LayerNorm, residual stream, pre-LN transformer blocks, FFN memory lens, exact ablation scheduling |
| 15 | self-supervision, full nonpadding visibility, MLM selection/corruption and 80/10/10 policy, WordPiece concept, learned token/position/segment embeddings, `[CLS]`/`[SEP]`, GELU, BERT encoder and historical NSP, full fine-tuning versus frozen probes, centered cosine similarity, paired end-to-end transfer controls |
| 16 | image patch tokens (`F.unfold` and stride-$P$ `nn.Conv2d` equivalence), ViT encoder classifier (learned image positions and `[CLS]`, pre-LN blocks), patch-size/attention-cost arithmetic, paired schedule-hash audits, CNN–ViT inductive-bias regimes; compound depth/width/resolution scaling, empirical power-law scaling, compute-optimal parameter/data allocation, Chinchilla joint loss fit |
| 17 | hard/few-shot prompting and frozen-weight in-context learning; retrieval as a separate context path; soft prompts, prefix tuning, adapters, and BitFit; LoRA equations, initialization, rank-capacity, merge, and freeze audits; symmetric versus affine quantization, per-tensor versus per-row scales, PTQ/QAT/GPTQ/AWQ concepts; QLoRA, NF4, and double quantization; `nn.TransformerEncoderLayer` convenience wrapper |
| 18 | response-masked SFT and instruction tuning; preference records and Bradley–Terry reward models; reward-shift and cyclic-consistency audits; reward model versus value function; finite KL-regularized Gibbs policy; PPO old-policy versus fixed-reference anchors; proxy-coverage audit; DPO reference-relative margin and exact finite identity; alignment evaluation contracts and model cards |

## 4. His signature analogies (use them; don't invent competitors)

Blindfolded descent (GD), knobs (parameters), blame (gradients), gradient
superhighway (ch. 5/9/10 relay), ball rolling (momentum), house-and-foundation
(pretrain/finetune), magnifying glass (kernels), detectives + cross-talk
(channels, ch. 8), conveyor belt + valves / ball-valve (LSTM), gold rail
(teacher forcing, coined ch. 11), "Okay, so —" (recaps), "what if X were
learnable?" (the book's refrain — every part pivots on it), “train a judge, then try
to please the judge” (reward model then policy, ch. 18), and model card as nutritional
label (ch. 18).
