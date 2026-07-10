# Arc-Seed Ledger & Reader's Toolbox

*The book's through-line is a relay: early chapters plant named ideas ("seeds")
that later chapters harvest explicitly. This ledger is the contract. Before
drafting a chapter: (1) harvest every seed due in it BY NAME (the prose should
say "Chapter N promised you X"), (2) plant the seeds it owes the future, (3) add
new rows here. The pedagogical-efficiency rule (drafting-template) depends on
this file: a concept with no payoff chapter listed here should be an exercise or
a cut.*

*Updated: 2026-07-09, after Chapter 11.*

## 1. Seeds planted and their harvest contracts

| Seed (phrase as planted) | Planted | Harvest | Status |
|---|---|---|---|
| Dot product = similarity score against a template | ch. 1 | ch. 7 (sliding template), ch. 12 (kernel similarity), ch. 13 (QK scores) | ch. 7 ✓; 12–13 due |
| Prediction = weighted combination of training targets | ch. 1 | ch. 12 (Nadaraya–Watson IS this, made explicit) | due |
| Softmax = the scores→weights machine | ch. 2 | ch. 12 (kernel weights), ch. 13 (attention weights) | due |
| "Softening the hard" / differentiable lookup ("A differentiable lookup, it turns out, is precisely attention") | ch. 2 | ch. 13 — harvest by name | due |
| Temperature dial between hard max and uniform | ch. 2 | ch. 10 ✓ (sampling); ch. 13 (√d as temperature) | partly |
| Compositional hierarchy: features of features | ch. 3 | ch. 8 ✓ (receptive fields make it architectural) | done |
| Gradient superhighway (ReLU's open gate) | ch. 5 | ch. 9 ✓ (residual = the highway as infrastructure), ch. 10 ✓ (cell state = highway through time) | done |
| Float-precision death (signals hit exact zero) | ch. 5 | ch. 9 ✓ (grad underflow figure), ch. 10 ✓ (σ(0)^80); appendix a4 (gather all three) | a4 due |
| Constraints are knowledge / inductive bias prescription | ch. 6 | ch. 7–8 ✓; ch. 16 (ViT trades the bias away — "inductive bias strikes again, this time as a trade") | ch. 16 due |
| Shift cliff (MLP collapses under 2px shift) | ch. 6 | ch. 8 ✓ (rematch), ch. 9 ✓ (GAP flattens it) — the book's first running benchmark | done |
| Global templates figure (fig-templates) | ch. 6 | ch. 8 ✓ (learned local kernels vs. global smears) | done |
| Sliding dot product; "what if the template were learnable?" | ch. 7 | ch. 8 ✓ — the Part II pivot | done |
| Equivariance banked → invariance purchased | ch. 7 | ch. 8 ✓ (pooling) | done |
| Pooling discards *where* → "we will pay to put position back in" | ch. 8 | ch. 14 (positional encodings; self-attention is permutation-equivariant) | due |
| Head-parameter imbalance (96% in LeNet's head) | ch. 8 | ch. 9 ✓ (1×1 + GAP fire the head) | done |
| CNN buys global sight through depth; attention buys it in one step | ch. 8 | ch. 13 (@sec-13 named in ch. 8 prose) | due |
| Residual stream: "each block reads from it and writes small corrections back… attention will be one kind of correction" | ch. 9 | ch. 14 — harvest by name (x + F(x) wraps every block) | due |
| LayerNorm: "same equation, different axis — remember @eq-batchnorm when you meet it" | ch. 9 | ch. 14 | due |
| Transfer decision rule (labels scarce ∧ task feature-hungry ∧ coverage at matched scale) | ch. 9 | ch. 15 (BERT = the regime where it pays), ch. 17 | due |
| Third weight sharing (examples → space → time) | ch. 10 | ch. 14 (self-attention shares across *pairs*? decide framing when drafting) | open |
| Finite-state bottleneck; "the book ends Part III when we refuse to pay that price" | ch. 10–11 | ch. 12–13 | due |
| "Hard address, learned content" (embeddings); soften the address too | ch. 11 | ch. 13 — harvest the phrase | due |
| Masking = "which positions it may not look at"; causal mask preview | ch. 11 | ch. 14 (causal mask turns transformer into LM) | due |
| Date-normalization benchmark (packed seq2seq: 40% @ epoch 6, 92% @ 25; alignment invisible) | ch. 11 | ch. 13 — MUST re-run with attention: alignment heatmap + convergence comparison (contract in stub) | due |
| Beam search / decoding machinery | ch. 11 | chs. 15/17 (LM decoding reuses it) | ambient |
| Book-corpus char-LM (loss 1.48, babble) | ch. 10 | ch. 14 (same corpus, tiny transformer, compare) | suggested |
| m06 autoencoder spine (PCA = linear AE, bottleneck, manifolds) | (unused by design in ch. 11) | ch. 19 | due |

## 2. Cross-chapter running benchmarks

1. **The shift cliff** (Fashion subset, `shift_right`): ch. 6 MLP 82→42% @2px →
   ch. 8 LeNet 82.5→62.3% → ch. 9 NiN+GAP 76→69% (flat). Closed.
2. **The date task** (synthetic, ch. 11): packed seq2seq baseline pinned
   (unambiguous exact 98.5%; curve 40%@6 → 92%@25; beam reveals 70/30 dialect
   split). Ch. 13 owes the attention rematch. Keep the generator function
   byte-identical when reusing (copy from ch. 11's `date-data` cell; seed 6050).
3. **The book-corpus LM**: ch. 10 char-LSTM (hidden 128, chunk 100, 2,500 steps,
   loss 1.48). Natural ch. 14 comparison point. NOTE: the corpus is
   `glob("../part*/0*.qmd")` — chapters 1–9 only, code cells stripped; editing
   those chapters changes the corpus only when ch. 10/14 re-render (freeze).

## 3. Reader's toolbox — what is introduced where (reading-order rule)

Chapter N may only *use* what appears at ≤ N. Introducing a tool = its row here.

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
| 12 (planned) | kernels/bandwidth, Nadaraya–Watson, attention-weight matrices (fixed) |
| 13 (planned) | learned Q/K/V, scaled dot-product, additive attention, attention in seq2seq, alignment heatmaps |
| 14 (planned) | self-attention, multi-head, LayerNorm, positional encodings, causal masks, the transformer block |

## 4. His signature analogies (use them; don't invent competitors)

Blindfolded descent (GD), knobs (parameters), blame (gradients), gradient
superhighway (ch. 5/9/10 relay), ball rolling (momentum), house-and-foundation
(pretrain/finetune), magnifying glass (kernels), detectives + cross-talk
(channels, ch. 8), conveyor belt + valves / ball-valve (LSTM), gold rail
(teacher forcing, coined ch. 11), "Okay, so —" (recaps), "what if X were
learnable?" (the book's refrain — every part pivots on it).
