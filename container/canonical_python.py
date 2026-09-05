#!/usr/bin/env python3
"""Run a Python tool under the same explicit startup policy as chapter kernels."""
import runpy
import sys
from pathlib import Path

from runtime_policy import initialize_torch

if __name__ == "__main__":
    initialize_torch()
    script = sys.argv.pop(1)
    sys.argv[0] = script
    sys.path.insert(0, str(Path(script).resolve().parent))
    runpy.run_path(script, run_name="__main__")
