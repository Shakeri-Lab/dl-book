"""Shared helpers for the book's executable chapters."""

SEED = 6050


def set_seed(seed: int = SEED) -> None:
    """Deterministic runs across NumPy and PyTorch (CPU)."""
    import random

    import numpy as np
    import torch

    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
