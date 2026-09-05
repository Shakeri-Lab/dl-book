"""Explicit process-start policy shared by the kernel and fingerprint launchers."""
from __future__ import annotations

import os

ENVIRONMENT_KEYS = (
    "OMP_NUM_THREADS", "OMP_DYNAMIC", "OMP_THREAD_LIMIT", "OMP_PROC_BIND",
    "OMP_PLACES", "MKL_NUM_THREADS", "MKL_DYNAMIC", "MKL_CBWR", "MKL_ENABLE_INSTRUCTIONS",
    "MKL_THREADING_LAYER", "KMP_DETERMINISTIC_REDUCTION", "KMP_AFFINITY",
    "OPENBLAS_NUM_THREADS", "VECLIB_MAXIMUM_THREADS", "NUMEXPR_NUM_THREADS",
    "ONEDNN_MAX_CPU_ISA", "DNNL_MAX_CPU_ISA", "ATEN_CPU_CAPABILITY",
    "ONEDNN_DEFAULT_FPMATH_MODE", "DNNL_DEFAULT_FPMATH_MODE",
    "DLBOOK_TORCH_NUM_THREADS", "DLBOOK_TORCH_INTEROP_THREADS",
    "PYTHONHASHSEED", "CUDA_VISIBLE_DEVICES",
    "CUBLAS_WORKSPACE_CONFIG", "SOURCE_DATE_EPOCH", "TZ", "LC_ALL", "LANG",
)


def initialize_torch():
    import torch

    threads = int(os.environ.get("DLBOOK_TORCH_NUM_THREADS", "1"))
    interop = int(os.environ.get("DLBOOK_TORCH_INTEROP_THREADS", "1"))
    if threads < 1 or interop < 1:
        raise ValueError("Torch thread budgets must be positive integers")
    torch.set_num_threads(threads)
    torch.set_num_interop_threads(interop)
    if (torch.get_num_threads(), torch.get_num_interop_threads()) != (threads, interop):
        raise RuntimeError("Torch did not apply the requested startup thread policy")
    return torch
