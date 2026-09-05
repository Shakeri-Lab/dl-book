#!/usr/bin/env python3
"""Explicit Jupyter kernel startup; portable for separately labeled Mac checks.

No numerical function is monkey-patched. Chapter code still owns its computations
and must honor the documented thread override. Public notebook source is unchanged.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
import platform
import uuid

from runtime_policy import ENVIRONMENT_KEYS, initialize_torch


def main():
    torch = initialize_torch()
    target = os.environ.get("DLBOOK_KERNEL_PROBE_DIR")
    if target:
        directory = Path(target)
        directory.mkdir(parents=True, exist_ok=True)
        observation = {
            "schema_version": 1,
            "scope": "executed kernel startup, before chapter cells",
            "pid": os.getpid(),
            "unit": os.environ.get("DLBOOK_EXECUTION_UNIT"),
            "format": os.environ.get("DLBOOK_EXECUTION_FORMAT"),
            "python": {"version": platform.python_version(),
                       "implementation": platform.python_implementation()},
            "torch": {"version": torch.__version__, "config": torch.__config__.show(),
                      "num_threads": torch.get_num_threads(),
                      "num_interop_threads": torch.get_num_interop_threads()},
            "environment": {key: os.environ.get(key) for key in ENVIRONMENT_KEYS},
        }
        (directory / f"kernel-{uuid.uuid4().hex}.json").write_text(
            json.dumps(observation, indent=2, sort_keys=True) + "\n"
        )
    from ipykernel.kernelapp import IPKernelApp
    IPKernelApp.launch_instance()


if __name__ == "__main__":
    main()
