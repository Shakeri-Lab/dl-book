"""Explicit process-start policy shared by the kernel and fingerprint launchers."""
from __future__ import annotations

import os
from pathlib import Path
import platform
import re

ENVIRONMENT_KEYS = (
    "OMP_NUM_THREADS", "OMP_DYNAMIC", "OMP_THREAD_LIMIT", "OMP_PROC_BIND",
    "OMP_PLACES", "MKL_NUM_THREADS", "MKL_DYNAMIC", "MKL_CBWR", "MKL_ENABLE_INSTRUCTIONS",
    "MKL_THREADING_LAYER", "KMP_DETERMINISTIC_REDUCTION", "KMP_AFFINITY",
    "OPENBLAS_NUM_THREADS", "OPENBLAS_CORETYPE", "NPY_DISABLE_CPU_FEATURES",
    "VECLIB_MAXIMUM_THREADS", "NUMEXPR_NUM_THREADS",
    "ONEDNN_MAX_CPU_ISA", "DNNL_MAX_CPU_ISA", "ATEN_CPU_CAPABILITY",
    "ONEDNN_DEFAULT_FPMATH_MODE", "DNNL_DEFAULT_FPMATH_MODE",
    "DLBOOK_TORCH_NUM_THREADS", "DLBOOK_TORCH_INTEROP_THREADS",
    "PYTHONHASHSEED", "CUDA_VISIBLE_DEVICES",
    "CUBLAS_WORKSPACE_CONFIG", "SOURCE_DATE_EPOCH", "TZ", "LC_ALL", "LANG",
)


def validate_dispatch_policy(observation: dict, environment: dict) -> None:
    """Validate observed effects, not just requested flags; usable on saved JSON.

    This is a startup policy check, not a claim of cross-host numerical identity.
    No restriction is imposed on a native runtime that did not request overrides.
    """
    if not isinstance(observation, dict):
        raise RuntimeError("Numerical dispatch observation is missing or malformed")
    requested = environment.get("ATEN_CPU_CAPABILITY")
    if requested:
        if (requested != "avx2" or observation.get("machine") not in ("x86_64", "amd64")
                or observation.get("torch_cpu_capability") != "AVX2"):
            raise RuntimeError("Requested Torch AVX2 dispatch is unsupported, ignored, or unobservable")
    requested = environment.get("OPENBLAS_CORETYPE")
    if requested:
        libraries = observation.get("numpy_blas")
        if (not isinstance(libraries, list) or not libraries
                or any(not isinstance(item, dict) or item.get("internal_api") != "openblas"
                       or item.get("architecture") != requested for item in libraries)):
            raise RuntimeError("Requested NumPy OpenBLAS architecture is ignored or unobservable")
    requested = environment.get("NPY_DISABLE_CPU_FEATURES")
    if requested:
        disabled = requested.split(",")
        features = observation.get("numpy_cpu_features", {})
        compiled = observation.get("numpy_cpu_dispatch", [])
        baseline = observation.get("numpy_cpu_baseline", [])
        if (not isinstance(features, dict) or not isinstance(compiled, list) or not isinstance(baseline, list)
                or not disabled or len(set(disabled)) != len(disabled)
                or any(not re.fullmatch(r"[A-Z][A-Z0-9_]*", key) or key not in compiled
                       or key in baseline or features.get(key) is not False for key in disabled)):
            raise RuntimeError("Requested NumPy disabled features are unsupported, ignored, or unobservable")
        functions = observation.get("numpy_opt_func_info")
        if not isinstance(functions, dict) or not functions:
            raise RuntimeError("Effective NumPy ufunc dispatch is unobservable")
        for signatures in functions.values():
            if not isinstance(signatures, dict) or not signatures:
                raise RuntimeError("Effective NumPy ufunc signatures are unobservable")
            for target in signatures.values():
                current = target.get("current") if isinstance(target, dict) else None
                if (not isinstance(current, str) or not current
                        or set(re.findall(r"[A-Z][A-Z0-9_]*", current)).intersection(disabled)):
                    raise RuntimeError("Effective NumPy ufunc dispatch still uses a disabled feature")


def collect_dispatch_observation(torch) -> dict:
    """Load and inspect libraries without evaluating a numerical/RNG operation."""
    import numpy as np
    from threadpoolctl import threadpool_info

    numpy_root = Path(np.__file__).resolve().parent
    roots = (numpy_root, numpy_root.parent / "numpy.libs")
    libraries = [item for item in threadpool_info()
                 if item.get("user_api") == "blas" and item.get("filepath")
                 and any(Path(item["filepath"]).resolve().is_relative_to(root) for root in roots)]
    core = getattr(getattr(np, "_core", None), "_multiarray_umath", None)
    introspect = getattr(getattr(np.lib, "introspect", None), "opt_func_info", None)
    return {
        "machine": platform.machine(),
        "torch_cpu_capability": torch.backends.cpu.get_cpu_capability(),
        "numpy_version": np.__version__,
        "numpy_blas": libraries,
        "numpy_cpu_baseline": list(getattr(core, "__cpu_baseline__", [])),
        "numpy_cpu_dispatch": list(getattr(core, "__cpu_dispatch__", [])),
        "numpy_cpu_features": dict(getattr(core, "__cpu_features__", {})),
        "numpy_opt_func_info": introspect() if callable(introspect) else {},
    }


def checked_dispatch_observation(torch) -> dict:
    observation = collect_dispatch_observation(torch)
    validate_dispatch_policy(observation, os.environ)
    return observation


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
    checked_dispatch_observation(torch)
    return torch
