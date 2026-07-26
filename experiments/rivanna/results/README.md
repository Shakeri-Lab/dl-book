# Pinned Rivanna results

These 30 JSON records are the complete July 25, 2026 full-run result set. They were
produced by SLURM arrays `17328071` (Chapter 9 scorecard), `17328072` (Chapter 9
transfer), and `17328073` (Chapter 10 word language models). Every array task completed
with exit code 0.

The runs used an NVIDIA RTX PRO 6000 Blackwell Server Edition MIG 1g.24gb slice,
PyTorch `2.12.0a0+0291f960b6.nv26.04.48445190`, CUDA 13.2, and cuDNN 9.2.1. The
common experiment-source digest recorded in every file is
`1f408d39eae4bb44d98c6e3667418c1085c1d5ba8356502954c00d5046f2f482`.

| Study | Setting | Test result, mean ± sample SD over seeds 6050–6052 |
|---|---|---:|
| Fashion-MNIST scorecard | LeNet | 92.52% ± 0.09% accuracy |
|  | NiN | 92.78% ± 0.08% |
|  | VGG | 93.73% ± 0.08% |
|  | residual network | 94.20% ± 0.10% |
| ResNet-18 transfer | frozen ImageNet probe | 88.79% ± 0.08% accuracy |
|  | ImageNet last-block fine-tune | 93.92% ± 0.12% |
|  | scratch | 94.14% ± 0.08% |
| WikiText-2 word LSTM | small, 9.61M parameters | 146.59 ± 1.38 perplexity |
|  | medium, 21.27M | 140.05 ± 0.98 |
|  | large, 39.77M | 141.94 ± 13.49 |

The raw histories—not just the summary statistics—are retained so the book can show
selection and seed sensitivity honestly. Run `python ../summarize.py .` from this
directory to reconstruct the tables.
