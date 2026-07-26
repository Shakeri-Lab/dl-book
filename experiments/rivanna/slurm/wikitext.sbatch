#!/usr/bin/env bash
#SBATCH --job-name=dlb-ch10-lm
#SBATCH --partition=gpu-mig
#SBATCH --account=shakeri-lab
#SBATCH --gres=gpu:1g.24gb:1
#SBATCH --cpus-per-task=4
#SBATCH --mem=48G
#SBATCH --time=06:00:00
#SBATCH --array=0-8%3

set -euo pipefail
module purge
module load apptainer/1.4.5
module load pytorch/2.11.0

: "${RUN_ROOT:?submit with --export=ALL,RUN_ROOT=/guarded/path}"
sizes=(small medium large)
seeds=(6050 6051 6052)
size="${sizes[$((SLURM_ARRAY_TASK_ID / 3))]}"
seed="${seeds[$((SLURM_ARRAY_TASK_ID % 3))]}"

srun apptainer exec --nv --bind "$RUN_ROOT:$RUN_ROOT" \
  "$CONTAINERDIR/pytorch-2.11.0.sif" \
  python "$RUN_ROOT/src/wikitext_lm.py" \
    --size "$size" \
    --seed "$seed" \
    --epochs 12 \
    --data-root "$RUN_ROOT/data/wikitext-2" \
    --output "$RUN_ROOT/results/wikitext/${size}-${seed}.json"
