"""Next-token training loop — Chapter 10's listing, importable.

The loop is printed and taught in Chapter 10 (truncated-BPTT chunk sampling,
gradient clipping); later chapters import it and print only their deltas.
"""
import torch
import torch.nn.functional as F
from torch import nn


def fit_next_token(
    model: nn.Module,
    data: torch.Tensor,
    *,
    vocab: int,
    context: int = 100,
    batch: int = 64,
    steps: int = 2501,
    lr: float = 2e-3,
    clip: float = 1.0,
    schedule: list[torch.Tensor] | None = None,
    log_every: int = 500,
    log_decimals: int = 2,
) -> tuple[nn.Module, list[tuple[int, float]]]:
    """Train `model` to predict data[t+1] from data[t-context+1 .. t].

    With `schedule=None`, chunk starts are drawn fresh each step (Chapter 10's
    truncated-BPTT sampling, consuming the global RNG exactly as printed there).
    A precomputed `schedule` of start tensors makes the minibatch order an
    explicit, shareable part of the protocol (Chapter 14's paired comparison).
    """
    opt = torch.optim.Adam(model.parameters(), lr=lr)
    curve: list[tuple[int, float]] = []
    n_steps = len(schedule) if schedule is not None else steps
    for step in range(n_steps):
        starts = (
            schedule[step]
            if schedule is not None
            else torch.randint(0, len(data) - context - 1, (batch,))
        )
        xb = torch.stack([data[j : j + context] for j in starts])
        yb = torch.stack([data[j + 1 : j + context + 1] for j in starts])
        logits = model(xb)
        if isinstance(logits, tuple):          # recurrent models return state
            logits = logits[0]
        loss = F.cross_entropy(logits.reshape(-1, vocab), yb.reshape(-1))
        opt.zero_grad()
        loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(), clip)
        opt.step()
        if step % log_every == 0:
            curve.append((step, loss.item()))
            print(f"step {step:4d}   loss {loss.item():.{log_decimals}f}")
    return model, curve
