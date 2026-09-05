"""Lightweight transport/policy fixtures; no chapter training or full renders."""
from __future__ import annotations

import json
from pathlib import Path
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import freeze_provenance
import run_canonical_freeze
import run_portable_freeze as portable


class PortablePolicyTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.work = self.root / "source"
        self.work.mkdir()
        self.python = Path(portable.DEFAULT_PYTHON)
        self.probes = self.root / "probes"

    def environment(self, threads=6):
        return portable.execution_environment(
            {"PATH": "/bin", "HOME": "/keep-home", "MKL_CBWR": "AVX2", "ATEN_CPU_CAPABILITY": "avx2",
             "OPENBLAS_CORETYPE": "Haswell", "NPY_DISABLE_CPU_FEATURES": "X86_V4,AVX512_ICL,AVX512_SPR",
             "OMP_THREAD_LIMIT": "2", "JUPYTER_PATH": "/old", "DLBOOK_EXECUTION_UNIT": "stale"},
            keys=freeze_provenance.ENVIRONMENT_KEYS, work=self.work, jupyter=self.root / "jupyter",
            python=self.python, probes=self.probes, threads=threads, epoch="1770000000")

    def test_profiles_clear_inherited_dispatch_and_isolate_jupyter(self):
        for threads in (1, 6):
            env = self.environment(threads)
            for key in ("DLBOOK_TORCH_NUM_THREADS", "OMP_NUM_THREADS", "VECLIB_MAXIMUM_THREADS"):
                self.assertEqual(env[key], str(threads))
            self.assertEqual(env["DLBOOK_TORCH_INTEROP_THREADS"], "1")
            self.assertEqual(env["HOME"], "/keep-home")
            self.assertEqual(env["PYTHONPATH"], str(self.work / "code"))
            self.assertEqual(env["JUPYTER_PATH"], str(self.root / "jupyter/data"))
            self.assertEqual(env["SOURCE_DATE_EPOCH"], "1770000000")
            for key in ("MKL_CBWR", "ATEN_CPU_CAPABILITY", "OPENBLAS_CORETYPE", "NPY_DISABLE_CPU_FEATURES",
                        "OMP_THREAD_LIMIT", "DLBOOK_EXECUTION_UNIT"):
                self.assertNotIn(key, env)

    def test_profile_rejects_other_thread_counts_and_clock_epoch(self):
        for threads, epoch in ((10, "1770000000"), (1, "now"), (6, "0")):
            with self.assertRaises(ValueError):
                portable.execution_environment({}, keys=(), work=self.work, jupyter=self.root,
                    python=self.python, probes=self.probes, threads=threads, epoch=epoch)

    def test_kernel_points_to_archived_explicit_startup(self):
        argv = portable.make_kernel(self.root / "jupyter", self.python, self.work)
        kernel = json.loads((self.root / "jupyter/data/kernels/python3/kernel.json").read_text())
        self.assertEqual(kernel["argv"], argv)
        self.assertEqual(argv, [str(self.python), str(self.work / "container/kernel_start.py"), "-f", "{connection_file}"])

    def selection(self, argv):
        return {"system": "Darwin", "machine": "arm64", "python": "3.12.12", "implementation": "CPython",
                "executable": str(self.python), "kernel_argv": argv}

    def test_selection_requires_actual_isolated_kernel(self):
        argv = portable.make_kernel(self.root / "jupyter", self.python, self.work)
        with patch.object(portable.subprocess, "check_output", side_effect=[json.dumps(self.selection(argv)), "1.10.18\n"]):
            self.assertEqual(portable.observe_selection(self.python, "quarto", argv, self.environment(), self.work)["quarto_version"], "1.10.18")
        for change in ({"system": "Linux"}, {"kernel_argv": ["python", "-m", "ipykernel_launcher"]}):
            with patch.object(portable.subprocess, "check_output", return_value=json.dumps({**self.selection(argv), **change})):
                with self.assertRaises(ValueError):
                    portable.observe_selection(self.python, "quarto", argv, self.environment(), self.work)

    def test_observed_probe_threads_are_authoritative(self):
        self.probes.mkdir()
        env = self.environment()
        selection = self.selection([])
        probe = {"schema_version": 1, "torch": {"num_threads": 6, "num_interop_threads": 1,
                 "version": "2.12.1", "config": "observed config"},
                 "python": {"version": selection["python"], "implementation": selection["implementation"]},
                 "environment": {key: env.get(key) for key in freeze_provenance.ENVIRONMENT_KEYS}}
        path = self.probes / "probe.json"
        path.write_text(json.dumps(probe))
        portable.validate_portable_probes(self.probes, selection, env, freeze_provenance.ENVIRONMENT_KEYS, 6)
        probe["torch"]["num_threads"] = 10
        path.write_text(json.dumps(probe))
        with self.assertRaisesRegex(ValueError, "Observed Mac kernel policy"):
            portable.validate_portable_probes(self.probes, selection, env, freeze_provenance.ENVIRONMENT_KEYS, 6)

    def test_uses_shared_exact_completion_and_local_capture(self):
        (self.work / "_quarto-execution.yml").write_text("project:\n  type: default\nuse-rsvg-convert: false\n")
        output = self.root / "out"
        (output / "provenance").mkdir(parents=True)
        freeze = self.work / "_freeze"
        freeze.mkdir()
        (freeze / "witness.json").write_text("{}")
        calls = []
        plan = {"formats": ["html", "tex"], "units": {"chapters/witness.qmd": {"native_cells_sha256": ["hash"]}}}
        source = SimpleNamespace(source_fingerprint=lambda *_: {"files_sha256": {}}, execution_plan=lambda *_: plan,
                                 ENVIRONMENT_KEYS=freeze_provenance.ENVIRONMENT_KEYS)
        complete = {"html_tex_stdout_identical": True}
        common = SimpleNamespace(load_source_tools=lambda _: source, validate_source=lambda *_: None,
            execution_command=run_canonical_freeze.execution_command,
            validate_execution_profile=run_canonical_freeze.validate_execution_profile,
            run_logged=lambda *args: calls.append(args), check_completed=lambda *_: complete)
        with patch.object(portable, "load_execution_tools", return_value=common), \
             patch.object(portable, "observe_selection", return_value=self.selection([])), \
             patch.object(portable, "validate_portable_probes") as verified, \
             patch("audit_execution_coverage.record_execution", return_value={}) as recorded, \
             patch("audit_execution_coverage.build_coverage_manifest", return_value={}):
            result = portable.execute_snapshot(self.work, output, {}, "a" * 40, "mac-six",
                self.python, "quarto", self.root / "jupyter", 6, "1770000000")
        self.assertIs(result, complete)
        self.assertEqual(len(calls), 6)  # preflight, latex, HTML, semantic audit, evidence audit, local capture
        self.assertIn("preflight", calls[0][0])
        self.assertEqual(recorded.call_count, 2)
        self.assertEqual([calls[i][0][calls[i][0].index("--to") + 1] for i in (1, 2)], ["latex", "html"])
        self.assertEqual([calls[i][0][calls[i][0].index("--profile") + 1] for i in (1, 2)], ["execution", "execution"])
        self.assertEqual(calls[1][3]["DLBOOK_EXECUTION_UNIT"], "chapters/witness.qmd")
        self.assertEqual(calls[1][3]["DLBOOK_EXECUTION_FORMAT"], "latex")
        capture = calls[-1][0]
        self.assertEqual(capture[capture.index("--kind") + 1], "local")
        self.assertNotIn("--container-digest", capture)
        self.assertIn("--preflight", capture)
        self.assertIn("--execution-coverage-manifest", capture)
        self.assertIn(str(self.work / "container/canonical_python.py"), capture)
        self.assertTrue((output / "_freeze/witness.json").is_file())
        verified.assert_called_once()

    def test_old_book_mode_checkpoint_fails_before_execution(self):
        with patch.object(portable, "load_execution_tools", return_value=SimpleNamespace()):
            with self.assertRaisesRegex(ValueError, "unit-only execution profile"):
                portable.execute_snapshot(self.work, self.root / "out", {}, "a" * 40, "old-source",
                    self.python, "quarto", self.root / "jupyter", 1, "1770000000")

    def test_refuses_nonempty_output(self):
        out = self.root / "out"
        out.mkdir()
        (out / "existing").write_text("preserve me")
        with self.assertRaises(SystemExit):
            portable.main(["--root", str(self.work), "--source-before", "unused.json",
                "--source-commit", "a" * 40, "--threads", "1", "--run-id", "test",
                "--python", str(Path(__file__)), "--quarto", "quarto", "--output", str(out)])
        self.assertEqual((out / "existing").read_text(), "preserve me")


if __name__ == "__main__":
    unittest.main()
