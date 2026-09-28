# W2 phase 0: inventory (read-only)

Branch `press` after W1 (chapter numbers are the new ones). Three tables sit beside this
report: `figures.csv` (one row per figure-drawing cell), `panels.csv` (one row per replay
scene), and `independence.csv` (every course or second-volume term a reader could see,
classed). The judgment columns (drawn by, role-colour misuse, caption issues, independence
class) were filled by independent Antigravity readers and checked here by citation and by
count; every edit that uses them re-reads the source first.

## The brief's Section 1 against the source and the render

| brief | measured | note |
|---|---|---|
| 137 figure elements on 34 pages | 127 on 27 pages (live render, before W1) | 111 PNG, 9 SVG, 7 tables; plus the Preface's two SVG diagrams, which sit outside any figure element |
| 121 matplotlib PNGs | 111 PNGs from 111 figure-drawing cells | |
| PNG widths 997 to 3906 px; 31 under 1400 px | 997 to 3906 px; 30 under 1400 px | the smallest is Figure 9.1 (`fig-learned-kernel`, old 8.1), 997 px |
| every figure cell in the interludes and the Epilogue unlabelled and uncaptioned (8, 3, 3, 4) | 10 cells (4, 2, 2, 2) | each cell sits in a labelled, captioned float div, so all ten render captioned; after W1 they number with their chapter. What they lack is a reference: 7 of the 10 are never cited |
| 17 TikZ diagrams | 17 sources in `figures/tikz-src` | |
| 45 panels on 22 pages, each with a static final frame | 45 on 22 pages; 42 use the static-frame generator | `convolution`, `kernel-weighting`, and `bert-ledger` predate it and need their own print path (P2); `convolution` has no caption element |
| 13 prose mentions of panel or replay | 21 matches of panel, replay, or animation in prose | P1 reads each |
| non-examinable in eight headings | 8 headings (a2, a3, 09, 10, 14, 15 twice, 17) | exactly the brief's list |
| the second volume on six pages | 6 pages (a3, Learning by Experiment, 05, 09, 14, the Preface) | |

## What the inventory adds

- **References (F1).** 100 of the 111 figure-drawing cells are never cited in the text; the prose points at them by position. F1 needs a reference for each, a prose edit on nearly every page.
- **Resolution (F2).** 35 PNG outputs fall under 300 dpi at a 120 mm text width.
- **Drawn by (F3).** 79 cells plot data, 25 draw diagrams by hand, 7 do both. The diagram cells are listed below for D6.
- **Colour (F4).** 52 cells use role colours (or matplotlib's default cycle, which reads as the same four roles) for categorical series.
- **Captions (F7).** 32 captions have an issue (left/right without panel labels, a colour word as the only identifier, a course or panel reference, or not standing alone).
- **Independence.** 418 reader-visible hits: allowlist 297, change-prose 47, web-only 32, second-volume 28, change-heading 12, change-caption 2.

## D6: the matplotlib diagrams, for your approval

W2 phase 3 redraws the four you named (Figure 12.1 `fig-unrolled-rnn`, Figure 12.3, the LSTM conveyor; the new GRU figure, Figure 16.4 `fig-transformer-block`) and then, once you approve, the rest of this list in TikZ. Mark any that should stay as they are.

| page | figure | drawn | what it shows |
|---|---|---|---|
| `appendices/a3-precision-performance.qmd` | Figure C.2 `fig-a3-flash-recap` | matplotlib-diagram | Memory-hierarchy flowchart comparing materialized full-matrix attention against tiled online SRAM-fused attention |
| `epilogue.qmd` | Figure E.1 `epfig-epilogue-learnability-ladder` | matplotlib-diagram | Hierarchical ladder diagram showing successive layers of machine learnability from representations to agents |
| `epilogue.qmd` | Figure E.2 `epfig-epilogue-test-time-taxonomy` | matplotlib-diagram | Taxonomy tree diagram classifying test-time computing strategies and inference regimes |
| `interludes/attention-as-test-time-regression.qmd` | Figure 17.1 `fig-solver-costs` | matplotlib-diagram | Two-axis conceptual map placing softmax attention, factorized kernel, and delta state memory solvers by state growth and per-token cost |
| `interludes/learning-by-experiment.qmd` | Figure 7.1 `fig-experiment-loop` | matplotlib-diagram | Iterative scientific experiment loop diagram connecting hypotheses, interventions, execution, and evidence evaluation |
| `interludes/making-pca-learnable.qmd` | Figure 11.1 `fig-fixed-code-bridge` | matplotlib-diagram | Architecture flow diagram connecting linear PCA autoencoders to nonlinear autoencoders via bottleneck codes |
| `part1/05-backpropagation.qmd` | Figure 5.1 `fig-chain-graph` | matplotlib-diagram | Computational graph flowchart showing forward evaluation and reverse pullback paths of backpropagation |
| `part1/05-backpropagation.qmd` | Figure 5.2 `fig-delta-pullback` | matplotlib-diagram | Layer pullback schematic demonstrating backward vector-matrix propagation of sensitivities delta |
| `part1/05-backpropagation.qmd` | Figure 5.3 `fig-outer-product` | matplotlib-diagram | Outer product tensor grid diagram showing weight gradients computed from sensitivities and activations |
| `part2/09-modern-cnns-transfer.qmd` | Figure 10.3 `fig-residual-stream` | matplotlib-diagram | Block diagram of residual network unit showing identity shortcut stream bypassing weight layers |
| `part3/10-sequences-rnn.qmd` | Figure 12.1 `fig-unrolled-rnn` | matplotlib-diagram | Schematic comparing looped compact recurrent cell representation with time-unrolled recurrence chain |
| `part3/10-sequences-rnn.qmd` | Figure 12.3 `fig-lstm-conveyor` | matplotlib-diagram | Architectural diagram of LSTM cell showing conveyor cell state, forget, input, and output gating mechanisms |
| `part3/11-encoder-decoder.qmd` | Figure 13.1 `fig-encoder-decoder-handoff` | matplotlib-diagram | Sequence encoder-decoder handoff schematic illustrating packed sequence termination and hidden state handoff |
| `part4/13-attention.qmd` | Figure 15.1 `fig-attention-lookup` | matplotlib-diagram | Conceptual query-key-value attention lookup schematic showing projection, similarity weighting, and value summation |
| `part4/13-attention.qmd` | Figure 15.2 `fig-additive-scorer` | mixed | Block diagram of additive query-key projection and tanh compatibility scoring paired with resulting attention weight bar chart |
| `part4/14-self-attention-transformer.qmd` | Figure 16.3 `fig-causal-multihead` | mixed | Flow diagram of multi-head projection, parallel routing, concatenation, and output projection alongside causal attention head heatmaps |
| `part4/14-self-attention-transformer.qmd` | Figure 16.4 `fig-transformer-block` | mixed | Architecture flowchart of pre-LayerNorm Transformer block paired with token activation distribution audits across normalization layers |
| `part4/15-bert-pretraining.qmd` | Figure 18.3 `fig-bert-adaptation` | matplotlib-diagram | Flowchart illustrating adaptation of pretrained BERT encoder representations to downstream classification and token prediction heads |
| `part4/15-bert-pretraining.qmd` | Figure 18.4 `fig-bert-lab-design` | matplotlib-diagram | Synthetic laboratory data design flowchart showing assignment of covered and uncovered types across pretraining corpus and evaluation pools |
| `part5/17-peft-quantization.qmd` | Figure 20.1 `fig-adaptation-map` | matplotlib-diagram | Taxonomy diagram organizing parameter-efficient fine-tuning (PEFT) methods into add, reparameterize, select, and prune strategies |
| `part5/17-peft-quantization.qmd` | Figure 20.3 `fig-lora-path` | matplotlib-diagram | Block architecture diagram showing low-rank matrix decomposition adapter branch A and B in parallel with frozen base weight W |
| `part5/17-peft-quantization.qmd` | Figure 20.5 `fig-quantization-granularity` | mixed | Schematic number line of symmetric uniform rounding grid alongside per-tensor vs per-row quantization error performance curves |
| `part5/17-peft-quantization.qmd` | Figure 20.6 `fig-qlora-composition` | matplotlib-diagram | Architecture flow diagram decoupling QLoRA 4-bit NF4 frozen storage precision from BF16 compute precision and 16-bit adapter state |
| `part5/18-alignment.qmd` | Figure 21.1 `fig-objective-write-map` | matplotlib-diagram | Flowchart mapping training stages from pretraining through instruction tuning and alignment to generation contracts |
| `part5/18-alignment.qmd` | Figure 21.2 `fig-preference-consistency` | mixed | Directed preference graph triangles comparing transitive choices with cyclic preferences paired with loss misspecification bar chart |
| `part5/18-alignment.qmd` | Figure 21.3 `fig-rlhf-pipeline` | matplotlib-diagram | Reinforcement learning from human feedback (RLHF) system pipeline diagram connecting demonstrations, reward modeling, and PPO policy optimiz |
| `part5/18-alignment.qmd` | Figure 21.6 `fig-preference-routes` | matplotlib-diagram | Flowchart comparing the explicit reward model and direct preference optimization (DPO) training routes from preference pairs |
| `part5/18-alignment.qmd` | Figure 21.7 `fig-alignment-contract` | matplotlib-diagram | Evidence chain flowchart linking feedback record, reward-model audit, policy audit, and model card for alignment evaluation |
| `part5/19-generative.qmd` | Figure 22.1 `fig-judge-generator` | matplotlib-diagram | Block diagram distinguishing the evaluation rule of a judge from the sampling rule of a generator |
| `part5/19-generative.qmd` | Figure 22.2 `fig-vae-gap` | mixed | Block diagram comparing VAE generation and inference paths alongside density plots and ELBO evidence gap audit |
| `part5/19-generative.qmd` | Figure 22.4 `fig-forward-diffusion` | mixed | Markov chain diagrams of forward corruption and reverse transitions alongside density evolution and schedule coefficients |
| `part5/20-multimodal.qmd` | Figure 23.1 `fig-two-tower-contract` | matplotlib-diagram | Dual-tower architecture schematic and 3x3 cross-modal cosine score matrix comparing image queries to text candidates |

The CSV files carry the rest: pixel sizes, dpi, formats, every colour and caption finding with its line.
