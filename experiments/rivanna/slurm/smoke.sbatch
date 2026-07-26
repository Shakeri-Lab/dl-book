#!/usr/bin/env bash
#SBATCH --job-name=dlb-gpu-smoke
#SBATCH --partition=gpu-mig
#SBATCH --account=shakeri-lab
#SBATCH --gres=gpu:1g.24gb:1
#SBATCH --cpus-per-task=4
#SBATCH --mem=32G
#SBATCH --time=00:30:00
#SBATCH --array=0-2%3

set -euo pipefail
module purge
module load apptainer/1.4.5
module load pytorch/2.11.0

: "${RUN_ROOT:?submit with --export=ALL,RUN_ROOT=/guarded/path}"
case "$SLURM_ARRAY_TASK_ID" in
  0)
    program=fashion_scorecard.py
    arguments=(
      --model lenet --seed 6050 --smoke
      --data-root "$RUN_ROOT/data/fashion"
      --output "$RUN_ROOT/results/smoke/scorecard.json"
    )
    ;;
  1)
    program=fashion_transfer.py
    arguments=(
      --regime probe --seed 6050 --smoke
      --data-root "$RUN_ROOT/data/fashion"
      --cache-root "$RUN_ROOT/cache/torch"
      --output "$RUN_ROOT/results/smoke/transfer.json"
    )
    ;;
  2)
    program=wikitext_lm.py
    arguments=(
      --size small --seed 6050 --smoke
      --data-root "$RUN_ROOT/data/wikitext-2"
      --output "$RUN_ROOT/results/smoke/wikitext.json"
    )
    ;;
esac

srun apptainer exec --nv --bind "$RUN_ROOT:$RUN_ROOT" \
  "$CONTAINERDIR/pytorch-2.11.0.sif" \
  python "$RUN_ROOT/src/$program" "${arguments[@]}"
