"""Shared, dependency-light utilities for the book's Rivanna experiments."""

from __future__ import annotations

import contextlib
import hashlib
import json
import os
import platform
import random
import subprocess
import time
from pathlib import Path
from typing import Any, Iterator

import numpy as np
import torch


def seed_everything(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.benchmark = False
    torch.backends.cudnn.deterministic = True


def require_cuda() -> torch.device:
    if not torch.cuda.is_available():
        raise RuntimeError("This experiment requires a CUDA allocation.")
    return torch.device("cuda")


def metadata() -> dict[str, Any]:
    try:
        commit = subprocess.check_output(
            ["git", "rev-parse", "HEAD"], text=True, stderr=subprocess.DEVNULL
        ).strip()
    except (OSError, subprocess.CalledProcessError):
        commit = "unavailable"
    device = torch.cuda.get_device_properties(0) if torch.cuda.is_available() else None
    source_hash = hashlib.sha256()
    for path in sorted(Path(__file__).parent.glob("*.py")):
        source_hash.update(path.name.encode())
        source_hash.update(path.read_bytes())
    return {
        "timestamp_unix": time.time(),
        "git_commit": os.environ.get("BOOK_GIT_BASE", commit),
        "experiment_source_sha256": source_hash.hexdigest(),
        "hostname": platform.node(),
        "slurm_job_id": os.environ.get("SLURM_JOB_ID"),
        "slurm_array_task_id": os.environ.get("SLURM_ARRAY_TASK_ID"),
        "torch_version": torch.__version__,
        "cuda_runtime": torch.version.cuda,
        "cudnn_version": torch.backends.cudnn.version(),
        "device": device.name if device else "cpu",
        "device_memory_bytes": device.total_memory if device else None,
    }


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")
    temporary.replace(path)


@contextlib.contextmanager
def exclusive_lock(path: Path) -> Iterator[None]:
    """Serialize first-use dataset/checkpoint downloads across an array."""
    import fcntl

    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w") as handle:
        fcntl.flock(handle.fileno(), fcntl.LOCK_EX)
        try:
            yield
        finally:
            fcntl.flock(handle.fileno(), fcntl.LOCK_UN)
