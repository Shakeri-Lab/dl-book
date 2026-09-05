"""Lightweight protocol and fresh-worker checks; never a full-book execution."""
from __future__ import annotations

from copy import deepcopy
import hashlib
import json
import os
from pathlib import Path
import stat
import struct
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import probe_runtime_dispatch as probe


def record(value=1.):
    raw = struct.pack("<f", value)
    return {"bytes_hex": raw.hex(), "sha256": hashlib.sha256(raw).hexdigest()}


def workers():
    result = []
    for policy in probe.POLICIES:
        for _ in range(2):
            runtime = {"torch": {"num_threads": 1, "num_interop_threads": 1, "cpu_capability": "AVX2"},
                       "environment": {**probe.shared.POLICY, "MKL_CBWR": "AVX2", **probe.POLICIES[policy]}}
            result.append({"status": "completed", "policy": policy,
                           "runtime_before": deepcopy(runtime), "runtime_after": deepcopy(runtime),
                           "inputs": {"x": record()}, "outputs": {"exp": record()}})
    return result


class DispatchProbeTests(unittest.TestCase):
    def test_four_policies_only_and_no_unverified_numpy_override(self):
        with patch.dict(os.environ, {"ATEN_CPU_CAPABILITY": "avx512", "OPENBLAS_CORETYPE": "Zen"}):
            for policy, overrides in probe.POLICIES.items():
                env = probe.environment(policy)
                for key in ("ATEN_CPU_CAPABILITY", "OPENBLAS_CORETYPE"):
                    self.assertEqual(env.get(key), overrides.get(key))
                self.assertEqual(env["MKL_CBWR"], "AVX2")
                self.assertEqual(env["ONEDNN_MAX_CPU_ISA"], "AVX2")
                self.assertNotIn("NPY_DISABLE_CPU_FEATURES", overrides)
        self.assertEqual(len(probe.POLICIES), 4)

    def test_report_distinguishes_within_policy_output_and_input_drift(self):
        rows = workers()
        rows[0]["outputs"]["exp"] = record(1.0000001192092896)
        rows[2]["inputs"]["x"] = record(2.)
        report = probe.summarize(rows, 2)
        self.assertEqual(report["policies"]["baseline"]["within_policy_differences"]["outputs"], ["exp"])
        self.assertEqual(report["input_variants_across_policies"]["x"], 2)
        self.assertFalse(report["promotion_eligible"])

    def test_incomplete_workers_missing_cases_or_wrong_threads_fail(self):
        with self.assertRaisesRegex(ValueError, "process inventory"):
            probe.summarize(workers()[:-1], 2)
        rows = workers()
        rows[0]["outputs"] = {}
        with self.assertRaisesRegex(ValueError, "case inventory"):
            probe.summarize(rows, 2)
        rows = workers()
        rows[0]["runtime_after"]["torch"]["num_threads"] = 6
        with self.assertRaisesRegex(ValueError, "thread policy"):
            probe.summarize(rows, 2)

    def test_wrong_dispatch_or_corrupt_bytes_fail(self):
        rows = workers()
        rows[0]["runtime_after"]["environment"]["MKL_CBWR"] = "COMPATIBLE"
        with self.assertRaisesRegex(ValueError, "fixed base environment"):
            probe.summarize(rows, 2)
        rows = workers()
        rows[0]["runtime_before"]["environment"]["ATEN_CPU_CAPABILITY"] = "avx512"
        with self.assertRaisesRegex(ValueError, "dispatch override"):
            probe.summarize(rows, 2)
        rows = workers()
        rows[0]["outputs"]["exp"]["bytes_hex"] = ""
        with self.assertRaisesRegex(ValueError, "byte/hash mismatch"):
            probe.summarize(rows, 2)

    def test_source_spec_is_exactly_the_three_authored_cells(self):
        root = Path(__file__).resolve().parents[1]
        spec = probe.source_spec(root)
        self.assertEqual(tuple(spec["cells"]), probe.LABELS)
        self.assertEqual(spec["source_sha256"], probe.shared.digest(root / probe.SOURCE))
        self.assertIn("torch.linalg.lstsq", spec["cells"]["closed-form"])
        self.assertNotIn("for epoch", "\n".join(spec["cells"].values()))

    def test_parent_import_is_stdlib_only(self):
        code = "import probe_runtime_dispatch; import sys; assert 'torch' not in sys.modules; assert 'numpy' not in sys.modules"
        subprocess.run([sys.executable, "-c", code], cwd=Path(probe.__file__).parent, check=True, timeout=10)

    @unittest.skipUnless(os.environ.get("DLBOOK_TEST_RUNTIME_DISPATCH") == "1", "opt-in tiny real-worker test")
    def test_actual_fresh_worker_retains_cases_and_readable_evidence(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            spec = root / "case-spec.json"
            probe.write(spec, probe.source_spec(Path(probe.__file__).resolve().parents[1]))
            output = root / "worker.json"
            subprocess.run([sys.executable, str(Path(probe.__file__).resolve()), "--worker", "baseline",
                            "--case-spec", str(spec), "--output", str(output)],
                           env=probe.environment("baseline"), check=True, timeout=30)
            document = json.loads(output.read_text())
            self.assertEqual(document["status"], "completed")
            self.assertIn("torch/float32/tanh", document["outputs"])
            self.assertIn("torch/float64/updated_w", document["outputs"])
            self.assertIn("numpy/float64/svd_s", document["outputs"])
            self.assertIn("chapter1/X_aug", document["inputs"])
            self.assertIn("chapter1/solution", document["outputs"])
            self.assertIn("numpy_show_runtime", document["runtime_after"])
            self.assertEqual(stat.S_IMODE(output.stat().st_mode), 0o644)
            self.assertEqual(stat.S_IMODE(output.with_suffix(".preflight.json").stat().st_mode), 0o644)


if __name__ == "__main__":
    unittest.main()
