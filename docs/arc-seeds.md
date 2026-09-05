# Arc-Seed Ledger & Reader's Toolbox

*The book's through-line is a relay: early chapters plant named ideas ("seeds")
that later chapters harvest explicitly. This ledger is the contract. Before
drafting a chapter: (1) harvest every seed due in it BY NAME (the prose should
say "Chapter N promised you X"), (2) plant the seeds it owes the future, (3) add
new rows here. The pedagogical-efficiency rule (drafting-template) depends on
this file: a concept with no payoff chapter listed here should be an exercise or
a cut.*

*Updated: 2026-08-06, after the course-alignment, structural-review,
test-time memory/control, show-then-name pacing, Chapter 20 temperature, and
statistical-contract coherence passes.*

## 1. Seeds planted and their harvest contracts

| Seed (phrase as planted) | Planted | Harvest | Status |
|---|---|---|---|
| Linear computation circuit: scale each input, add the signals and bias, then emit one score; the next chapter adds one operation after the score | ch. 1 | ch. 2 ✓ (the classifier preserves the circuit and attaches the output map), ch. 3 ✓ (the bend turns the circuit into a neuron) | done |
| Dot product = similarity score against a template | ch. 1 | ch. 7 (sliding template), ch. 12 (kernel similarity), ch. 13 (QK scores), ch. 20 (normalized cross-modal similarity) | done |
| Prediction = weighted combination of training targets | ch. 1 | ch. 12 (Nadaraya–Watson IS this, made explicit) | done |
| Softmax = the scores→positive-weights machine; later match one request to stored candidates and blend their contents (later name deliberately withheld) | ch. 2 | ch. 12 (kernel weights), ch. 13 (name the content-dependent weighted read), ch. 20 (row/column contrastive candidates) | done |
| "Softening the hard": replace one winning memory address with a weighted read, without naming the finished construction early | ch. 2 | ch. 13 — build the behavior, then harvest by name | done |
| Temperature dial between hard max and uniform; bandwidth is the same dial | ch. 2; ch. 12 ($\tau=2h^2$) | ch. 10 ✓ (sampling); ch. 13 ✓ (scaled similarities); ch. 20 ✓ (learn the log scale jointly with the paired towers) | done |
| Compositional hierarchy: features of features | ch. 3 | ch. 8 ✓ (receptive fields make it architectural) | done |
| Gradient superhighway (ReLU's open gate) | ch. 5 | ch. 9 ✓ (residual = the highway as infrastructure), ch. 10 ✓ (cell state = highway through time) | done |
| Float-precision death (tiny signals can become numerically unusable) | ch. 5 | ch. 9 ✓ (norm underflow + update-resolution diagnostic), ch. 10 ✓ (σ(0)^80); Appendix C (range, local spacing, accumulator dtype, stable algorithms) | done |
| A small schedule coefficient is not a zero coefficient | ch. 19 | Appendix C — mathematical smallness, underflow, and rounded-away updates are separated | done |
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
| Finite-state bottleneck; "the book ends Part III when we refuse to pay that price" | ch. 10–11 | ch. 12 (retain the memory bank), ch. 13 (learn the access rule), test-time-regression interlude (the fixed state returns as a chosen regression tradeoff) | done |
| Fixed attention matrix; "what if the similarity itself were learnable?" | ch. 12 | ch. 13 (learned compatibility and the date-task rematch) | done |
| The kernel supplies weights and normalized mixing gives an average | ch. 12 | test-time-regression interlude — derive the local-constant fit, then compare sufficient-state and delta alternatives | done |
| Test-time memory fits the past; could a layer evaluate futures before answering? | test-time-regression interlude and ch. 18's outside-the-policy judge | epilogue — scalar Riccati planning and the learnable-planner frontier | done |
| "Hard address, learned content" (embeddings); soften the address too | ch. 11 | ch. 13 — harvest the phrase | done |
| Masking = "which positions it may not look at"; causal mask preview | ch. 11 | ch. 14 (causal mask turns transformer into LM) | done |
| Date-normalization benchmark: five-seed paired TF/free-running study, fixed 400-source validation and 437-source test populations; early learning and endpoint errors separated | ch. 11 | ch. 13 — freshly paired fixed-state/attention study; faster learning, a small endpoint error gap, and validation-only routing audit (§2) | narrative done; numerical migration pending |
| Cross-attention repairs the fixed handoff, but the surrounding RNNs remain serial; the Q/K/V operator does not care where its inputs came from | ch. 13 | ch. 14 (replace recurrence with self-attention; derive and implement multi-head) | done |
| Beam search / decoding machinery | ch. 11 | chs. 15/17 (LM decoding reuses it) | ambient |
| Book-corpus char-LM (held-out fixed-window loss 1.89; sampled training minibatch 1.42; babble) | ch. 10 | ch. 14 (same corpus/split/evaluation and historical window schedule; controlled positional ablation, historical LSTM comparator distinguished) | narrative done; numerical migration pending |
| Visibility is a modeling decision | ch. 14 | ch. 15 (causal generation versus bidirectional masked-token representation learning) | done |
| Global routing trades away locality bias | ch. 14 | ch. 16 ✓ (patch-token ViT rematches convolution's built-in geometry in a five-seed scratch regime) | done |
| Short paths, dense work; global access is not free memory | ch. 14 | test-time-regression interlude — one regression, three memory contracts; Appendix C — the $Bhn^2$ ledger becomes the FlashAttention I/O case study | done |
| The KV cache is the nonparametric estimator's retained dataset | ch. 14.7 and test-time-regression interlude | Appendix C — FlashAttention changes the I/O schedule of that dataset traversal; fixed-state solvers change the statistical contract | done |
| A learned summary token can gather a sequence for a downstream head | ch. 15 | ch. 16 ✓ (`[CLS]` becomes a learned meeting place over image patches, not a summary by birth) | done |
| Pretraining is a regime, not an architecture | ch. 15 | ch. 16 ✓ (the same encoder pattern crosses from text to vision; data scale can reverse the CNN–ViT ranking) | done |
| Training-optimal is not serving-optimal | ch. 16 | ch. 17 — harvested by name: Chinchilla allocates training compute, not storage, inference, or adaptation cost; the mismatch motivates prompting, PEFT, and quantization | done |
| A smaller checkpoint is not automatically faster | ch. 17 | Appendix C — Roofline and the measurement contract separate bytes, FLOPs, latency, and throughput | done |
| Fine-tuning changes every encoder weight; what if the backbone is too large? | ch. 15 | ch. 17 (prompting, PEFT, quantization) | done |
| Where the update lives is not what the update optimizes | ch. 17 | ch. 18 — harvest by name: adaptation chooses permitted writes and representation; instruction or preference objectives choose rewarded behavior | done |
| A judge is not a generator | ch. 18 | ch. 19 — harvested by name: reward models and preference losses evaluate completed samples; generative modeling learns the distribution that produces them | done |
| Zero-shot names the missing task-specific update, not missing pretraining exposure | ch. 17 | ch. 20 — text-prototype classification is bounded retrieval over a declared candidate set | done |
| A shared embedding is a comparison rule, not a generator | ch. 20 | epilogue — capability claims remain tied to objectives, candidate sets, and evaluation contracts | done |
| “Weights learn inside a run; we learn about designs across runs” / “Tune the contender; ablate the claim” | experimentation interlude after ch. 6 | comparison-heavy studies in chs. 8–20; epilogue harvests the method by name | done |
| m06 autoencoder spine: make PCA learnable, then nonlinear (“PCA on steroids”) | autoencoder interlude after ch. 9 | static encoder–decoder contract is available before recurrence | done |
| A one-shot encoder is not a variable-length process | autoencoder interlude | ch. 10 — harvested by name as the motivation for a shared state update; ch. 11 turns both maps into recurrent processes | done |
| A code is not yet a distribution | autoencoder interlude | ch. 19 — harvested by name: reconstruction supplies no principled random start | done |
| Solve, don't invert | ch. 1 | Appendix A — `solve` for square systems; `lstsq` for rectangular projection; forming normal equations squares the condition number | done |
| A tensor's dtype becomes more than a software label; gather dtype, shape, stride, and physical layout | ch. 17 | Appendix B — six-part tensor contract, shape dictionary, broadcasting, views, strides, and dtype-aware construction | done |
| Storage precision ≠ compute precision ≠ trainable state | ch. 17 | Appendix C — operand, evaluation, accumulation, output, gradient, and optimizer roles are audited separately | done |
| A reported number needs a population, estimand, estimator, variation source, and boundary | chs. 1, 4, 6, and 18 | Appendix E — empirical/population and shifted risks, likelihood contracts, distribution comparisons, estimator cases, and uncertainty are gathered into one optional audit | done |

## 2. Cross-chapter running benchmarks

1. **The shift cliff** (Fashion subset, `shift_right`): ch. 6 MLP 80.8→42.0% @2px →
   ch. 8 LeNet 81.3→62.0% → ch. 9 NiN+GAP 76.7→68.3% from 0→4px (a much gentler
   slope, not exact invariance). Ch. 16 reopens the mechanism in a separate,
   explicitly paired scratch regime: on the fixed 1,000-fit/200-validation Chapter
   6 split over seeds 6050–6054, the tiny CNN averages 73.9→59.0% and the tiny ViT
   70.4→24.8% from 0→4px. The CNN wins four of five clean pairs and 24 of 25
   seed×shift validation comparisons; on the already-opened 600-image benchmark,
   clean means are 77.9% and 73.9%. Parameters differ by 3.0%, minibatch schedules
   are pair-exact, and the dot-product proxies differ by 1.8%; architecture-specific
   tuning and pretraining are not matched, and zero filling clips the right edge.
   Chapter 8, 9, and 16 values are pending final-source validation, from rejected Linux
   diagnostic run `33937390845`, source `1da26e860d6fa76ae6b76dede273748b1439128c`:
   `build/canonical-1da26e8-33937390845/_freeze/chapters/part2/08-cnn/execute-results/html.json`
   cell 17 and `chapters/part2/09-modern-cnns-transfer/execute-results/html.json`
   cell 7 under that same `_freeze/` root; Chapter 16 uses
   `chapters/part4/16-vit-scaling/execute-results/html.json`, native cells 6–11.
   This is not evidence promotion.
2. **The date task** (synthetic, ch. 11; September 5 diagnostic revision,
   **not accepted reference evidence**): 9,000 unique source strings split
   8,000/500/500 with zero exact-source overlap. Five seeds 6050–6054 use fixed
   400-source validation and 437-source unambiguous test populations. Separating
   the batch RNG replaces the old single-seed schedule; it is not merely four
   extra seeds. TF/free-running pairs share initialization and every permutation.
   At 25 epochs, TF errors average 4.00 (sample SD 2.45), free-running 2.20
   (1.10); the paired accuracy advantage is +0.412 pp (SD 0.713), with TF winning
   two pairs. Ch. 13 retrains the same fixed-state baseline, not a pasted curve:
   attention has zero errors in all five runs, a paired +0.915 pp (SD 0.561).
   Earlier validation learning is the larger contrast. Seed 6050's first four
   decoder rows place 96.833% of their mass on source-year positions; the largest
   weight lies there in 99.500% of 1,600 rows. Batch order is now matched, but
   parameters (+59.2%), computation, and cross-architecture initialization are not.
   These values come from Linux run `33937390845`, source
   `1da26e860d6fa76ae6b76dede273748b1439128c`: under
   `build/canonical-1da26e8-33937390845/_freeze/`,
   `chapters/part3/11-encoder-decoder/execute-results/html.json` cell 7 and
   `chapters/part4/13-attention/execute-results/html.json` cell 12.
   The original run remains rejected; final-source C reruns must validate the revision.
3. **The book-corpus LM**: ch. 10 char-LSTM (hidden 128, random fixed windows of
   100 characters, 2,501 updates) finishes at sampled-minibatch loss 1.42 and
   held-out fixed-window loss printed as 1.89. Ch. 14 reconstructs its historical
   2,501-by-64 window schedule and matches corpus, split, evaluation, optimizer,
   clipping, targets, and parameter scale. Its 132,488-parameter positional
   Transformer reaches train/held-out 1.1138/1.9052; the no-position ablation reaches
   1.8590/2.3500 in the same rejected Linux diagnostic run, native cells 15–17 of
   `chapters/part4/14-self-attention-transformer/execute-results/html.json` under
   the artifact root above. Position improves 0.4448 (18.9%) in this seed. The
   LSTM comparator 1.888110429 remains a historical constant in cell 17, not a
   newly measured four-decimal baseline. Do not promote its small separation into
   a stable architecture ranking. Final-source C repeat validation remains pending.
   The shared corpus is the committed 148,594-character
   `data/book-corpus-ch1-9.txt` snapshot from commit `24ae3a6321ad901497776180b8e107490750adc9`, not a glob of live
   prose. Both chapters assert its SHA-256, so copyedits cannot silently move the
   benchmark.

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
| 4 | loss landscapes, (S)GD, minibatches, learning rates, Adam, `torch.optim`, LR schedules (basic); inverted dropout, `nn.Dropout`, and train/eval mode asymmetry |
| 5 | backprop/chain rule, autograd (`backward`, `requires_grad`, `detach`), vanishing/exploding intuition, init scales, `grad_by_layer` figure family |
| 6 | generalization, overfitting, capacity, inductive bias through architecture/objective/data, Fashion-MNIST subset (`data/fashion-*.pt`), shift/shuffle experiments, data augmentation as a declared transformation distribution |
| Experiment interlude (after 6) | run versus experiment versus study; parameters versus hyperparameters; fixed-protocol and tuned estimands; paired-seed contrasts; ablation interactions; train/validation/test roles and validation overtuning; log-scale/random/multi-fidelity search; experiment ledger. `nn.BatchNorm1d` is a labeled measuring-instrument preview only; ch. 9 opens the mechanism. |
| 7 | convolution/cross-correlation, kernels, `F.conv1d/2d`, equivariance, filter zoo |
| 8 | `nn.Conv2d`, channels, padding/stride, `F.max_pool2d`, receptive fields, NCHW, LeNet, parameter audits |
| 9 | BatchNorm (+train/eval modes), conv-BN-ReLU atom, 1×1 convs, GAP (`nn.AdaptiveAvgPool2d`), residual blocks, `weight_decay`, transfer mechanics (`requires_grad=False`, param groups/two LRs), `F.interpolate`, torchvision model loading from committed weights |
| Autoencoder interlude (after 9) | encoder–code–decoder reconstruction contract; PCA as a tied undercomplete linear autoencoder; projector rather than basis comparison; nonlinear/manifold reconstruction; denoising input–target contracts; convolutional autoencoders; transposed convolution as adjoint, not inverse; fixed-code versus variable-length-process distinction. `torch.linalg.svd` is a labeled Appendix A baseline preview and `nn.Tanh` a labeled ch. 10 activation preview. |
| 10 | `nn.RNN`/`nn.LSTM` (+GRU eqs), BPTT, truncated chunks, `clip_grad_norm_`, `F.one_hot` (in models), sampling with temperature, `torch.multinomial` |
| 11 | encoder–decoder, `nn.Embedding`, PAD/BOS/EOS, `pad_sequence`, `pack_padded_sequence`, `ignore_index`, teacher forcing/free-running, exposure bias, scheduled sampling (concept), greedy/beam search, length normalization |
| 12 | kernels/bandwidth, Nadaraya–Watson, queries/keys/values, row-softmax over log-kernel scores, attention-weight matrices (fixed); the local-constant derivation and research lens wait for the test-time-regression interlude |
| 13 | learned Q/K/V, additive and scaled dot-product cross-attention, source-padding attention masks, attention-augmented seq2seq, alignment heatmaps; multi-head preview only |
| 14 | permutation-equivariant self-attention, custom multi-head attention, causal masks, sinusoidal and rotary positional geometry, LayerNorm/RMSNorm contrast, residual stream, pre-LN transformer blocks, FFN memory lens, exact ablation scheduling, and KV cache as a retained K/V dataset |
| Test-time-regression interlude (after 14) | test-time regression's four dials; softmax local-constant fit; factorized-kernel sufficient state $(S_t,z_t)$; linear/delta online update; derivation-first Mamba/Gated-Delta selectivity bridge; solver cost map; sealed recall-under-capacity mechanism test |
| 15 | self-supervision, full nonpadding visibility, MLM selection/corruption and 80/10/10 policy, WordPiece concept, learned token/position/segment embeddings, `[CLS]`/`[SEP]`, GELU, BERT encoder and historical NSP, full fine-tuning versus frozen probes, centered cosine similarity, paired end-to-end transfer controls |
| 16 | image patch tokens (`F.unfold` and stride-$P$ `nn.Conv2d` equivalence), ViT encoder classifier (learned image positions and `[CLS]`, pre-LN blocks), patch-size/attention-cost arithmetic, paired schedule-hash audits, CNN–ViT inductive-bias regimes; compound depth/width/resolution scaling, empirical power-law scaling, compute-optimal parameter/data allocation, Chinchilla joint loss fit |
| 17 | hard/few-shot prompting and frozen-weight in-context learning; retrieval as a separate context path; soft prompts, prefix tuning, adapters, and BitFit; LoRA equations, initialization, rank-capacity, merge, and freeze audits; symmetric versus affine quantization, per-tensor versus per-row scales, PTQ/QAT/GPTQ/AWQ concepts; QLoRA, NF4, and double quantization; `nn.TransformerEncoderLayer` convenience wrapper |
| 18 | response-masked SFT and instruction tuning; preference records and Bradley–Terry reward models; reward-shift and cyclic-consistency audits; reward model versus value function; finite KL-regularized Gibbs policy; PPO old-policy versus fixed-reference anchors; proxy-coverage audit; DPO reference-relative margin and exact finite identity; alignment evaluation contracts and model cards |
| 19 | Gaussian latent-variable models; ELBO and reparameterization; GAN minimax games and Jensen–Shannon divergence; diffusion schedules, noise prediction, score, and reverse sampling; generative evaluation contracts |
| 20 | multimodal paired supervision; separate encoders into normalized shared coordinates; cosine score matrices; symmetric batch contrastive/InfoNCE-style loss; cross-modal Recall@$k$; text-prototype zero-shot classification; retrieval-versus-generation and pair/candidate evaluation contracts |
| Epilogue | fast/transient versus slow/persistent adaptation taxonomy; predictive versus reward/preference/control signals; scalar finite-horizon LQR and Riccati recursion; test-time control as a hedged research frontier |
| A | matrix maps and affine bias; span, rank, orthogonality, projectors; `torch.linalg.solve`, `lstsq`, conditioning, `eigh`/SVD contracts, low-rank approximation, batched SVD, centered PCA |
| B | six-part tensor contract; book-wide axis dictionary; `nn.Linear` row batches; broadcasting; `expand`/`repeat`; views, strides, contiguity; batched `@`/`einsum`; indexing, masks, and dtype-aware factories |
| C | binary floating-point range and resolution; `torch.finfo`/`nextafter`; rounded-away updates, cancellation, stable softmax, and log-domain products; mixed-precision and loss-scaling contracts; operational intensity, Roofline bounds, and ridge points; I/O-aware exact attention and online softmax; performance-measurement contracts |
| D | book-wide typography, decorations, index/dimension dictionary, recurring tensor shapes, probability/optimization roles, and four-question notation audit |
| E | empirical, population, shifted, and augmentation risks; likelihood-to-loss contracts; KL/Jensen--Shannon/Wasserstein comparison; Monte Carlo estimator cases; SD, SE, pairing, and clustering |

## 4. His signature analogies (use them; don't invent competitors)

Blindfolded descent (GD), knobs (parameters), blame (gradients), gradient
superhighway (ch. 5/9/10 relay), ball rolling (momentum), house-and-foundation
(pretrain/finetune), magnifying glass (kernels), detectives + cross-talk
(channels, ch. 8), conveyor belt + valves / ball-valve (LSTM), gold rail
(teacher forcing, coined ch. 11), chef and ingredient doorway (compute versus data
movement, Appendix C), "Okay, so —" (recaps), "what if X were
learnable?" (the book's refrain — every part pivots on it), “train a judge, then try
to please the judge” (reward model then policy, ch. 18), model card as nutritional
label (ch. 18), the job interview for tuned contenders (experimentation interlude), and
“PCA on steroids” (nonlinear autoencoders bend the reconstruction class, autoencoder
interlude).
