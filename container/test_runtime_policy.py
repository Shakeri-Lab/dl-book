"""Dispatch observations must demonstrate requested policy before learner code runs."""
from copy import deepcopy
import os
from pathlib import Path
import subprocess
import sys
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import runtime_policy as policy


REQUESTED = {"ATEN_CPU_CAPABILITY": "avx2", "OPENBLAS_CORETYPE": "Haswell",
             "NPY_DISABLE_CPU_FEATURES": "X86_V4,AVX512_ICL,AVX512_SPR"}


def observation():
    return {"machine": "x86_64", "torch_cpu_capability": "AVX2", "numpy_version": "2.5.1",
            "numpy_blas": [{"internal_api": "openblas", "architecture": "Haswell"}],
            "numpy_cpu_baseline": ["X86_V2"],
            "numpy_cpu_dispatch": ["X86_V3", "X86_V4", "AVX512_ICL", "AVX512_SPR"],
            "numpy_cpu_features": {"X86_V3": True, "X86_V4": False,
                                   "AVX512_ICL": False, "AVX512_SPR": False},
            "numpy_opt_func_info": {"exp": {"dd": {"current": "X86_V3",
                "available": "X86_V4 X86_V3 baseline(X86_V2)"}}}}


class DispatchPolicyTests(unittest.TestCase):
    def test_requested_policy_accepts_observed_effect_not_host_vendor(self):
        for machine in ("x86_64", "amd64"):
            value = observation()
            value["machine"] = machine
            policy.validate_dispatch_policy(value, REQUESTED)

    def test_missing_ignored_or_unobservable_requests_fail(self):
        changes = ({"torch_cpu_capability": "AVX512"}, {"torch_cpu_capability": None},
                   {"machine": "arm64"}, {"numpy_blas": []},
                   {"numpy_blas": [{"internal_api": "openblas", "architecture": "SkylakeX"}]},
                   {"numpy_cpu_features": {}}, {"numpy_cpu_dispatch": []},
                   {"numpy_opt_func_info": {}}, {"numpy_cpu_features": {"X86_V4": True}},
                   {"numpy_opt_func_info": {"exp": {"dd": {"current": "X86_V4"}}}})
        for change in changes:
            with self.subTest(change=change), self.assertRaises(RuntimeError):
                policy.validate_dispatch_policy({**observation(), **change}, REQUESTED)

    def test_each_disabled_group_is_checked_and_unknown_names_fail(self):
        for feature in REQUESTED["NPY_DISABLE_CPU_FEATURES"].split(","):
            value = deepcopy(observation())
            value["numpy_cpu_features"][feature] = True
            with self.subTest(feature=feature), self.assertRaises(RuntimeError):
                policy.validate_dispatch_policy(value, REQUESTED)
        with self.assertRaises(RuntimeError):
            policy.validate_dispatch_policy(observation(), {"NPY_DISABLE_CPU_FEATURES": "UNKNOWN"})

    def test_unrequested_native_mac_dispatch_is_not_rejected(self):
        policy.validate_dispatch_policy({"machine": "arm64", "torch_cpu_capability": "NO AVX",
                                        "numpy_blas": [], "numpy_cpu_features": {}}, {})

    def test_initialization_rejects_ignored_policy_before_returning_torch(self):
        fake = SimpleNamespace(set_num_threads=lambda _: None, set_num_interop_threads=lambda _: None,
                               get_num_threads=lambda: 1, get_num_interop_threads=lambda: 1)
        with patch.dict(sys.modules, {"torch": fake}), patch.dict(os.environ, REQUESTED, clear=True), \
             patch.object(policy, "collect_dispatch_observation", return_value={**observation(), "torch_cpu_capability": "AVX512"}):
            with self.assertRaisesRegex(RuntimeError, "Torch"):
                policy.initialize_torch()

    def test_real_native_startup_records_dispatch_without_consuming_rng(self):
        script = ("import torch,numpy as np; before=torch.random.get_rng_state().clone(); n_before=np.random.get_state(); "
                  "import runtime_policy as p; p.initialize_torch(); "
                  "d=p.checked_dispatch_observation(torch); "
                  "assert torch.equal(before,torch.random.get_rng_state()); "
                  "n_after=np.random.get_state(); assert np.array_equal(n_before[1],n_after[1]); "
                  "assert n_before[0]==n_after[0] and n_before[2:]==n_after[2:]; "
                  "assert d['torch_cpu_capability']; assert d['numpy_version']")
        env = {key: value for key, value in os.environ.items() if key not in policy.ENVIRONMENT_KEYS}
        env.update(PYTHONPATH=str(Path(__file__).parent), DLBOOK_TORCH_NUM_THREADS="1", DLBOOK_TORCH_INTEROP_THREADS="1")
        result = subprocess.run([sys.executable, "-c", script], env=env, capture_output=True, text=True, timeout=25)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
