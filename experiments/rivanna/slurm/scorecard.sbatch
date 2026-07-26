#!/usr/bin/env bash
#SBATCH --job-name=dlb-ch9-score
#SBATCH --partition=gpu-mig
#SBATCH --account=shakeri-lab
#SBATCH --gres=gpu:1g.24gb:1
#SBATCH --cpus-per-task=4
#SBATCH --mem=32G
#SBATCH --time=02:00:00
#SBATCH --array=0-11%6

set -euo pipefail
module purge
module load apptainer/1.4.5
module load pytorch/2.11.0

: "${RUN_ROOT:?submit with --export=ALL,RUN_ROOT=/guarded/path}"
models=(lenet vgg nin resnet)
seeds=(6050 6051 6052)
model="${models[$((SLURM_ARRAY_TASK_ID / 3))]}"
seed="${seeds[$((SLURM_ARRAY_TASK_ID % 3))]}"

srun apptainer exec --nv --bind "$RUN_ROOT:$RUN_ROOT" \
  "$CONTAINERDIR/pytorch-2.11.0.sif" \
  python "$RUN_ROOT/src/fashion_scorecard.py" \
    --model "$model" \
    --seed "$seed" \
    --data-root "$RUN_ROOT/data/fashion" \
    --output "$RUN_ROOT/results/scorecard/${model}-${seed}.json"
