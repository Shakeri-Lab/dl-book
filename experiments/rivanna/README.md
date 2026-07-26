# Rivanna full-scale experiments

These scripts replace three explicitly deferred CPU-scale demonstrations with measured
GPU studies. They are independent of learner-visible book execution: Quarto continues
to render from committed, frozen results and never submits a cluster job.

| Study | Script | Predeclared comparison |
|---|---|---|
| Chapter 9 scorecard | `fashion_scorecard.py` | LeNet, small VGG, NiN, and a nine-block residual network; full Fashion-MNIST; three seeds |
| Chapter 9 transfer | `fashion_transfer.py` | ImageNet ResNet-18 frozen probe, last-block fine-tuning, and scratch; 224-pixel Fashion-MNIST; three seeds |
| Chapter 10 language model | `wikitext_lm.py` | Two- and three-layer word LSTMs at three parameter scales; WikiText-2; three seeds |

All studies use the fixed seed set 6050–6052, a fixed 50,000/10,000
Fashion-MNIST train/validation split where applicable, validation-only model
selection, one final test evaluation, and one JSON record per end-to-end run.
`common.py` records the Git commit, SLURM identifiers, device, PyTorch/CUDA/cuDNN
versions, parameter count, full learning curve, and elapsed time.

The cluster data stay below a guarded scratch root. The Fashion-MNIST downloader uses
the original dataset mirrors configured by `torchvision`. WikiText-2 is downloaded
from the copy used by the official PyTorch examples; the corpus is distributed under
CC BY-SA 3.0 and GFDL. ImageNet ResNet-18 weights are the
`torchvision` `IMAGENET1K_V1` checkpoint. No downloaded corpus or checkpoint is
committed to this repository.

Submission is intentionally two-stage:

1. Upload this directory to the guarded root and submit `slurm/smoke.sbatch`.
2. Require all three smoke tasks to produce valid JSON before submitting the full
   scorecard, transfer, and WikiText arrays.

The July 25, 2026 run followed that protocol. All 30 full tasks completed with exit
code 0 on NVIDIA RTX PRO 6000 Blackwell MIG 1g.24gb slices. The pinned records and
summary are in `results/`; scheduler logs were inspected locally but are not committed.
Run `python summarize.py results` to reproduce the aggregate tables. A single
successful seed is not publication evidence.
