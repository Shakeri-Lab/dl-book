"""Listing 4.1 — the supervised training loop, importable.

Chapter 4 derives this loop and prints it; Chapters 6, 8, and 9 import it and
print only their deltas (the model builder and the budget). The loop is the
book's canonical minibatch recipe: seed, build, then repeat
predict -> measure -> step over reshuffled minibatches.
"""
from collections.abc import Callable

import torch
import torch.nn.functional as F
from torch import nn


def fit_supervised(
    model_fn: Callable[[], nn.Module],
    X: torch.Tensor,
    y: torch.Tensor,
    *,
    epochs: int,
    batch: int = 64,
    lr: float = 1e-3,
    seed: int = 6050,
) -> nn.Module:
    """Train a fresh model on (X, y) with cross-entropy and Adam.

    Seeding precedes construction, so a given (model_fn, seed) pair always
    starts from the same tensors; each epoch reshuffles example order.
    """
    torch.manual_seed(seed)
    model = model_fn()
    opt = torch.optim.Adam(model.parameters(), lr=lr)
    for _ in range(epochs):
        perm = torch.randperm(len(X))
        for i in range(0, len(X), batch):
            idx = perm[i : i + batch]
            loss = F.cross_entropy(model(X[idx]), y[idx])
            opt.zero_grad()
            loss.backward()
            opt.step()
    return model
