"""Fixed-window evaluation loss — Chapter 10's protocol, importable.

Scores a sequence in consecutive `window`-sized chunks with the recurrent (or
attention) state reset at each boundary, so train and held-out numbers are
comparable across chapters and architectures.
"""
import torch
import torch.nn.functional as F
from torch import nn


# [1] declare inference-only fixed-window evaluation
@torch.no_grad()
def fixed_window_loss(
    net: nn.Module,
    sequence: torch.Tensor,
    *,
    vocab: int,
    window: int = 100,
) -> float:
    """Mean next-token cross-entropy over non-overlapping windows."""
    # [2] switch modes and initialize token-weighted totals
    net.eval()
    total_loss, n_tokens = 0.0, 0
    # [3] traverse non-overlapping windows
    for start in range(0, len(sequence) - 1, window):
        stop = min(start + window, len(sequence) - 1)
        xb = sequence[start:stop].unsqueeze(0)
        yb = sequence[start + 1 : stop + 1]
        # [4] predict with recurrent state reset at this boundary
        logits = net(xb)
        if isinstance(logits, tuple):      # recurrent models return state
            logits = logits[0]             # state resets at each window
        # [5] sum within windows and count the scored tokens
        total_loss += F.cross_entropy(
            logits.reshape(-1, vocab), yb, reduction="sum"
        ).item()
        n_tokens += yb.numel()
    # [6] average once over every scored token
    return total_loss / n_tokens
