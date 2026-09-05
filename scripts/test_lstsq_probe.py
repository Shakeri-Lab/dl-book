#!/usr/bin/env python3
"""Cheap fail-closed tests for the isolated saved-image diagnostic."""
from __future__ import annotations

import copy
import hashlib
import json
import os
from pathlib import Path
import struct
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import probe_lstsq_repeatability as probe


def tensor(value=1.0):
    raw = struct.pack("<f", value)
    return {"dtype": "torch.float32", "shape": [1], "byte_order": "little",
            "bytes_hex": raw.hex(), "sha256": hashlib.sha256(raw).hexdigest(), "values": [value]}


def worker(branch):
    records = []
    for case in probe.CASES:
        for dtype in probe.DTYPES:
            for driver in probe.DRIVERS:
                for layout in probe.LAYOUTS:
                    observations = []
                    for i in range(2):
                        observations.append({"iteration": i, **{f: tensor() for f in ("solution", "predictions", "mse")},
                                             "layouts": {f: {"shape": [1], "stride": [1], "contiguous": True,
                                                             "storage_offset": 0, "data_ptr_mod_64": 0}
                                                         for f in ("A", "y", "solution", "predictions")}})
                    records.append({"case": case, "dtype": dtype, "driver": driver, "layout": layout,
                                    "inputs": {"A": tensor(), "y": tensor()}, "observations": observations})
    return {"schema_version": 1, "branch": branch, "repeats": 2, "records": records,
            "runtime": {"torch": {"num_threads": 1, "num_interop_threads": 1},
                        "environment": {**probe.POLICY, "MKL_CBWR": branch}}}


def fixtures():
    return [worker(branch) for branch in probe.BRANCHES for _ in range(2)]


def source_fixture(root):
    def cell(label, code):
        return f"```{{python}}\n#| label: {label}\n{code}\n```\n"
    ch1 = root / probe.CHAPTERS[0]
    ch1.parent.mkdir(parents=True, exist_ok=True)
    ch1.write_text(cell("setup", "import torch\ntorch.manual_seed(6050)") + cell("synthetic-data", '''
def make_synthetic_data(weights: torch.Tensor, bias: float, n_samples: int, noise: float = 0.1):
    X = torch.randn(n_samples, len(weights))
    y = X @ weights + bias + noise * torch.randn(n_samples)
    return X, y
true_w, true_b = torch.tensor([2.0, -3.4]), 4.2
X, y = make_synthetic_data(true_w, true_b, n_samples=200)
X.shape, y.shape
''') + cell("closed-form", "X_aug = torch.cat([X, torch.ones(X.shape[0], 1)], dim=1)\nraise RuntimeError('do not solve or print the chapter')"))
    (root / probe.CHAPTERS[1]).write_text(cell("fig-sgd-zones", '''
import torch
torch.manual_seed(6050)
x1 = torch.randn(80)
y1 = 2.5 * x1 - 1.0 + 0.4 * torch.randn(80)
A = torch.stack([x1, torch.ones_like(x1)], dim=1)
raise RuntimeError("do not execute the original solver or plot")
'''))


class ReportTests(unittest.TestCase):
    def test_identical_inputs_and_all_conditions(self):
        report = probe.summarize(fixtures(), 2, 2)
        self.assertEqual(report["status"], "observed-bit-identical")
        self.assertEqual(len(report["conditions"]), 48)
        self.assertEqual(len(report["layout_controls"]), 48 * 16)

    def test_full_byte_change_detected_despite_same_printed_rounding(self):
        rows = fixtures()
        rows[0]["records"][0]["observations"][1]["solution"] = tensor(1.0000001192092896)
        report = probe.summarize(rows, 2, 2)
        self.assertEqual(report["status"], "observed-nonrepeatability")
        row = next(r for r in report["conditions"] if r["branch"] == "AVX2" and r["driver"] == "default"
                   and r["case"] == probe.CASES[0] and r["dtype"] == "float32")
        self.assertEqual(row["solution"]["within_process_changes"], 1)

    def test_input_drift_is_not_attributed_to_solver(self):
        rows = fixtures()
        rows[0]["records"][0]["inputs"]["A"] = tensor(2.0)
        self.assertEqual(probe.summarize(rows, 2, 2)["status"], "input-drift-inconclusive")

    def test_missing_condition_or_process_rejected(self):
        rows = fixtures()
        with self.assertRaisesRegex(ValueError, "process inventory"):
            probe.summarize(rows[:-1], 2, 2)
        rows[0]["records"].pop()
        with self.assertRaisesRegex(ValueError, "worker condition"):
            probe.summarize(rows, 2, 2)

    def test_corrupt_bytes_or_wrong_thread_policy_rejected(self):
        rows = fixtures()
        rows[0]["records"][0]["observations"][0]["mse"]["bytes_hex"] = "00000000"
        with self.assertRaisesRegex(ValueError, "byte/hash mismatch"):
            probe.summarize(rows, 2, 2)
        rows = fixtures()
        rows[0]["runtime"]["torch"]["num_threads"] = 6
        with self.assertRaisesRegex(ValueError, "thread counts"):
            probe.summarize(rows, 2, 2)

    def test_offset_control_does_not_change_authored_verdict(self):
        rows = fixtures()
        rows[0]["records"][1]["observations"][1]["solution"] = tensor(2.0)
        report = probe.summarize(rows, 2, 2)
        self.assertTrue(report["observed_repeatability"])
        self.assertFalse(report["layout_control_repeatability"])
        self.assertIn(2, report["solution_patterns_across_offsets"].values())

    def test_branch_environment_is_set_before_subprocess(self):
        for branch in probe.BRANCHES:
            env = probe.worker_environment(branch)
            self.assertEqual(env["MKL_CBWR"], branch)
            self.assertEqual(env["ONEDNN_MAX_CPU_ISA"], "AVX2")
            self.assertEqual(env["DLBOOK_TORCH_INTEROP_THREADS"], "1")


class ExtractionTests(unittest.TestCase):
    def test_extracts_only_original_input_statements_and_binds_source(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source_fixture(root)
            specs = probe.extract_case_specs(root)
            self.assertEqual(set(specs), set(probe.CASES))
            for value in specs.values():
                self.assertNotIn("raise RuntimeError", value["code"])
                self.assertNotIn("lstsq", value["code"])
                self.assertEqual(value["source_sha256"], probe.digest(root / value["source_file"]))
            path = root / probe.CHAPTERS[1]
            path.write_text(path.read_text().replace("2.5 * x1", "2.6 * x1"))
            changed = probe.extract_case_specs(root)
            self.assertNotEqual(specs[probe.CASES[1]]["ast_sha256"], changed[probe.CASES[1]]["ast_sha256"])

    def test_ambiguous_or_missing_original_input_is_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source_fixture(root)
            path = root / probe.CHAPTERS[1]
            path.write_text(path.read_text().replace("torch.manual_seed(6050)", "torch.manual_seed(6051)"))
            with self.assertRaisesRegex(ValueError, "original statement"):
                probe.extract_case_specs(root)

    @unittest.skipUnless(os.environ.get("DLBOOK_TEST_LSTSQ_PROBE") == "1", "opt-in tiny real Torch subprocess smoke")
    def test_real_worker_uses_exact_original_float32_inputs_and_retains_metadata(self):
        import torch
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source_fixture(root)
            specs = probe.extract_case_specs(root)
            A, y = probe.make_inputs(torch, probe.CASES[0], specs)
            torch.manual_seed(6050)
            X = torch.randn(200, 2)
            expected_y = X @ torch.tensor([2., -3.4]) + 4.2 + .1 * torch.randn(200)
            self.assertTrue(torch.equal(A, torch.cat([X, torch.ones(200, 1)], dim=1)))
            self.assertTrue(torch.equal(y, expected_y))
            spec_path = root / "spec.json"
            probe.write_json(spec_path, specs)
            output = root / "worker.json"
            subprocess.run([sys.executable, str(Path(probe.__file__)), "--worker", "AVX2", "--case-spec", str(spec_path),
                            "--repeats", "2", "--output", str(output)], env=probe.worker_environment("AVX2"), check=True, timeout=45)
            data = json.loads(output.read_text())
            self.assertEqual(data["runtime"]["torch"]["num_threads"], 1)
            self.assertTrue(output.with_suffix(".preflight.json").is_file())
            self.assertTrue(output.with_suffix(".inputs.json").is_file())
            self.assertEqual(len(data["records"]), 2 * 2 * 4 * 17)
            for record in data["records"]:
                for observation in record["observations"]:
                    probe.checked_tensor(observation["solution"])
                    self.assertIn("data_ptr_mod_64", observation["layouts"]["A"])


class WorkflowTests(unittest.TestCase):
    def test_saved_image_source_and_new_diagnostic_are_distinct(self):
        root = Path(__file__).resolve().parents[1]
        text = (root / ".github/workflows/canonical-probe.yml").read_text()
        for required in ("original-source/container/image_artifact.py verify", "--root original-source",
                         'test "$(docker image inspect --format', "--entrypoint python", "--network none",
                         "--read-only", "target=/diagnostic,readonly", "target=/original-source,readonly",
                         "--original-source-commit", "--diagnostic-commit", "contents: read", "actions: read"):
            self.assertIn(required, text)
        for prohibited in ("docker build", "run_canonical_freeze.py", "promote_freeze", "peaceiris/actions-gh-pages", "contents: write"):
            self.assertNotIn(prohibited, text)
        self.assertIn("canonical-probe", (root / ".github/workflows/execute-audit.yml").read_text())


if __name__ == "__main__":
    unittest.main()
