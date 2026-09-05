"""Lightweight protocol and fresh-worker checks; never a full-book execution."""
from __future__ import annotations

from copy import deepcopy
import hashlib
import json
import os
import platform
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
    def test_six_policies_preserve_baseline_and_clear_inherited_numpy_override(self):
        with patch.dict(os.environ, {"ATEN_CPU_CAPABILITY": "avx512", "OPENBLAS_CORETYPE": "Zen",
                                     "NPY_DISABLE_CPU_FEATURES": "INHERITED_VALUE"}):
            for policy, overrides in probe.POLICIES.items():
                env = probe.environment(policy)
                for key in probe.OPTIONAL_OVERRIDES:
                    self.assertEqual(env.get(key), overrides.get(key))
                self.assertEqual(env["MKL_CBWR"], overrides.get("MKL_CBWR", "AVX2"))
                self.assertEqual(env["ONEDNN_MAX_CPU_ISA"], "AVX2")
                if policy != "compatible-numpy":
                    self.assertNotIn("NPY_DISABLE_CPU_FEATURES", env)
        self.assertEqual(len(probe.POLICIES), 6)
        self.assertEqual(probe.POLICIES["compatible-numpy"]["NPY_DISABLE_CPU_FEATURES"],
                         "X86_V4,AVX512_ICL,AVX512_SPR")
        self.assertTrue(probe.summarize(workers(), 2)["completed"])

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

    def test_compatibility_overrides_and_actual_x86_capability_are_checked(self):
        rows = workers()
        compatible = next(row for row in rows if row["policy"] == "compatible-numpy")
        compatible["runtime_after"]["environment"]["NPY_DISABLE_CPU_FEATURES"] = None
        with self.assertRaisesRegex(ValueError, "declared policy"):
            probe.summarize(rows, 2)
        rows = workers()
        aten = next(row for row in rows if row["policy"] == "aten-avx2")
        aten["runtime_after"].update(machine={"machine": "x86_64"})
        aten["runtime_after"]["torch"]["cpu_capability"] = "AVX512"
        with self.assertRaisesRegex(ValueError, "capability was not observed"):
            probe.summarize(rows, 2)

    def test_source_spec_is_exactly_the_three_authored_cells(self):
        root = Path(__file__).resolve().parents[1]
        spec = probe.source_spec(root)
        self.assertEqual(tuple(spec["cells"]), probe.LABELS)
        self.assertEqual(spec["source_sha256"], probe.shared.digest(root / probe.SOURCE))
        self.assertIn("torch.linalg.lstsq", spec["cells"]["closed-form"])
        self.assertNotIn("for epoch", "\n".join(spec["cells"].values()))

    def test_forward_spec_binds_exact_setup_and_audit_without_training(self):
        root = Path(__file__).resolve().parents[1]
        forward = probe.source_spec(root)["forward"]
        self.assertEqual(forward["source_sha256"], probe.shared.digest(root / probe.FORWARD_SOURCE))
        self.assertEqual(tuple(forward["cells"]), probe.FORWARD_LABELS)
        self.assertIn("torch.set_default_dtype(torch.float64)", forward["cells"]["generative-setup"])
        self.assertIn("torch.randn(diffusion_steps, audit_x0.numel())", forward["cells"]["forward-diffusion-audit"])
        self.assertNotIn("optimizer", "\n".join(forward["cells"].values()))

    def test_forward_only_plan_keeps_two_processes_and_one_existing_policy(self):
        self.assertEqual(probe.selected_policies(True), ("compatible-numpy",))
        self.assertEqual(probe.selected_policies(False), tuple(probe.POLICIES))
        workflow = (Path(probe.__file__).resolve().parents[1] / ".github/workflows/canonical-probe.yml").read_text()
        self.assertIn("--forward-only --processes 2", workflow)

    def test_hash_only_records_are_explicit_not_malformed_raw_records(self):
        value = {"hash_only": True, "dtype": "torch.float64", "shape": [100, 10000],
                 "byte_order": "little", "nbytes": 8000000, "sha256": "a" * 64}
        probe.validate_record(value)
        for mutation in ({"nbytes": 1}, {"sha256": "bad"}, {"bytes_hex": "00"}, {"values": []}):
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                probe.validate_record({**value, **mutation})

    def test_forward_source_ast_tampering_fails_before_execution(self):
        spec = probe.source_spec(Path(probe.__file__).resolve().parents[1])["forward"]
        spec["cells"]["forward-diffusion-audit"] += "\nraise RuntimeError('changed')\n"
        with self.assertRaisesRegex(ValueError, "authored cell changed"):
            probe.checked_ast(spec, "forward-diffusion-audit")

    def test_forward_report_exposes_recorded_schedule_stdout_discrepancy(self):
        # Exact changed line from the rejected 6cb78af native-cell-7 pair:
        # build/canonical-6cb78af-{33970821144,33971040577}/_freeze/
        # chapters/part5/19-generative/execute-results/html.json.
        rows = [row for row in workers() if row["policy"] == "compatible-numpy"]
        for row, maximum in zip(rows, ("1.83e-15", "1.78e-15")):
            row.update(chapter19_stdout=f"largest sequential/direct difference at T: {maximum}\n",
                       rational_stdout="separate fixed-input control\n")
        rows[1]["outputs"]["exp"] = record(2.)
        result = probe.summarize(rows, 2, forward_only=True)
        self.assertEqual(tuple(result["policies"]), ("compatible-numpy",))
        self.assertEqual(result["reference_policy"], "compatible-numpy")
        report = result["policies"]["compatible-numpy"]
        self.assertEqual(report["stdout_variants"], {"chapter19_stdout": 2, "rational_stdout": 1})
        self.assertEqual(report["within_policy_differences"]["outputs"], ["exp"])
        self.assertFalse(result["promotion_eligible"])
        with self.assertRaisesRegex(ValueError, "process inventory"):
            probe.summarize(rows[:1], 2, forward_only=True)

    def test_parent_import_is_stdlib_only(self):
        code = "import probe_runtime_dispatch; import sys; assert 'torch' not in sys.modules; assert 'numpy' not in sys.modules"
        subprocess.run([sys.executable, "-c", code], cwd=Path(probe.__file__).parent, check=True, timeout=10)

    @unittest.skipUnless(os.environ.get("DLBOOK_TEST_RUNTIME_DISPATCH") == "1", "opt-in tiny real-worker test")
    def test_actual_fresh_worker_retains_cases_and_readable_evidence(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            spec = root / "case-spec.json"
            probe.write(spec, probe.source_spec(Path(probe.__file__).resolve().parents[1]))
            policies = ("baseline", "compatible-numpy") if platform.system() == "Linux" and platform.machine() == "x86_64" else ("baseline",)
            for policy in policies:
                output = root / f"{policy}.json"
                subprocess.run([sys.executable, str(Path(probe.__file__).resolve()), "--worker", policy,
                                "--case-spec", str(spec), "--output", str(output)],
                               env=probe.environment(policy), check=True, timeout=30)
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

    @unittest.skipUnless(os.environ.get("DLBOOK_TEST_RUNTIME_DISPATCH") == "1", "opt-in exact authored forward-cell test")
    def test_forward_two_fresh_workers_match_uninstrumented_authored_cell(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            spec = root / "case-spec.json"
            probe.write(spec, probe.source_spec(Path(probe.__file__).resolve().parents[1]))
            env = probe.environment("compatible-numpy")
            rows = []
            for repeat in range(2):
                output = root / f"forward-{repeat}.json"
                subprocess.run([sys.executable, str(Path(probe.__file__).resolve()), "--worker", "compatible-numpy",
                                "--forward-only", "--case-spec", str(spec), "--output", str(output)],
                               env=env, check=True, timeout=30)
                rows.append(json.loads(output.read_text()))
                self.assertLess(output.stat().st_size, 500_000)
            reference_code = '''
import contextlib, io, json, sys, torch
import probe_runtime_dispatch as probe
torch.set_num_threads(1)
torch.set_num_interop_threads(1)
spec = json.loads(open(sys.argv[1]).read())["forward"]
namespace, printed = {}, io.StringIO()
with contextlib.redirect_stdout(printed):
    for label in probe.FORWARD_LABELS:
        exec(compile(spec["cells"][label], spec["source_file"], "exec"), namespace)
names = ("audit_x0", "step_noises", "sequential_state", "direct_state", "accumulated_noise", "effective_epsilon")
print(json.dumps({"stdout": printed.getvalue(), "tensors": {name: probe.tensor_hash(namespace[name]) for name in names},
                  "rng": probe.tensor_hash(torch.get_rng_state())}))
'''
            result = subprocess.run([sys.executable, "-c", reference_code, str(spec)],
                                    cwd=Path(probe.__file__).parent, env=env, capture_output=True,
                                    text=True, check=True, timeout=30)
            reference = json.loads(result.stdout)
            for row in rows:
                self.assertEqual(row["chapter19_stdout"], reference["stdout"])
                self.assertEqual(row["forward_default_dtype"], "torch.float64")
                self.assertEqual(row["inputs"]["rng/after_authored_cell"], reference["rng"])
                for name, value in reference["tensors"].items():
                    group = "inputs" if name in ("audit_x0", "step_noises") else "outputs"
                    self.assertEqual(row[group][f"authored/{name}"], value)
                self.assertEqual(row["inputs"]["authored/step_noises"]["shape"], [100, 10000])
                self.assertEqual(row["inputs"]["authored/step_noises"]["nbytes"], 8_000_000)
                self.assertNotIn("bytes_hex", row["inputs"]["authored/step_noises"])
                self.assertNotIn("values", row["inputs"]["authored/step_noises"])
                self.assertEqual(row["outputs"]["schedule/scalar_sqrt_diffusion_alpha"]["shape"], [100])
                self.assertIn("Not manuscript output", row["rational_control"])
                self.assertIn("after the untouched authored execution", row["coefficient_observation"])
            report = probe.summarize(rows, 2, forward_only=True)
            self.assertEqual(report["policies"]["compatible-numpy"]["stdout_variants"]["chapter19_stdout"], 1)
            for row in rows:
                self.assertEqual(row["inputs"], rows[0]["inputs"])
                self.assertEqual(row["outputs"], rows[0]["outputs"])


if __name__ == "__main__":
    unittest.main()
