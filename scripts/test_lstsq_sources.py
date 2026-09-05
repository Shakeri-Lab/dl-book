"""Real authored least-squares prefixes, executed twice without a full-book run.

No solver, seeded input, assertion, or plotting formula is copied or rewritten.
The Chapter 1 prefix includes every native cell to preserve its ridge RNG state.
"""
from __future__ import annotations

import ast
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import time
import unittest

from audit_python_sources import FENCE_RE
from run_canonical_freeze import execution_command


ROOT = Path(__file__).resolve().parents[1]
PREFIXES = {
    "chapters/part1/01-linear-regression.qmd": None,
    "chapters/part1/04-training-loss-sgd.qmd": 1,
    "chapters/part5/18-alignment.qmd": 4,
    "chapters/appendices/a1-linear-algebra.qmd": 2,
}
EXPECTED_CALLS = {name: count for name, count in zip(PREFIXES, (3, 1, 2, 1))}


def lstsq_count(source: str) -> int:
    return sum(isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute)
               and ast.unparse(node.func) == "torch.linalg.lstsq"
               for node in ast.walk(ast.parse(source)))


def authored_prefix(root: Path, unit: str, limit: int | None) -> str:
    matches = list(FENCE_RE.finditer((root / unit).read_text()))
    if limit is not None and len(matches) < limit:
        raise ValueError(f"Missing authored prefix cells: {unit}")
    selected = matches if limit is None else matches[:limit]
    return "# Authored least-squares witness\n\n" + "\n\n".join(
        match.group(0) for match in selected) + "\n"


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def kernel_environment(root: Path, python: str, epoch: str) -> dict[str, str]:
    """Use the existing explicit launcher, including its actual policy probes."""
    jupyter = root / "jupyter"
    kernel = jupyter / "data/kernels/python3/kernel.json"
    kernel.parent.mkdir(parents=True)
    kernel.write_text(json.dumps({
        "argv": [python, str(ROOT / "container/kernel_start.py"), "-f", "{connection_file}"],
        "display_name": "Authored least-squares witness (isolated)", "language": "python",
    }))
    for name in ("config", "runtime"):
        (jupyter / name).mkdir()
    return {
        **os.environ,
        "OMP_NUM_THREADS": "1", "OMP_DYNAMIC": "FALSE", "MKL_NUM_THREADS": "1",
        "MKL_DYNAMIC": "FALSE", "OPENBLAS_NUM_THREADS": "1", "VECLIB_MAXIMUM_THREADS": "1",
        "NUMEXPR_NUM_THREADS": "1", "DLBOOK_TORCH_NUM_THREADS": "1",
        "DLBOOK_TORCH_INTEROP_THREADS": "1", "SOURCE_DATE_EPOCH": epoch,
        "PYTHONHASHSEED": "0", "CUDA_VISIBLE_DEVICES": "", "MPLBACKEND": "Agg",
        "QUARTO_PYTHON": python, "JUPYTER_PATH": str(jupyter / "data"),
        "JUPYTER_DATA_DIR": str(jupyter / "data"), "JUPYTER_CONFIG_DIR": str(jupyter / "config"),
        "JUPYTER_RUNTIME_DIR": str(jupyter / "runtime"), "JUPYTER_PREFER_ENV_PATH": "0",
        "DLBOOK_KERNEL_PROBE_DIR": str(root / "kernel-probes"),
    }


class AuthoredLstsqInventoryTests(unittest.TestCase):
    def test_every_authored_lstsq_call_is_in_the_declared_prefixes(self):
        actual = {}
        for path in sorted((ROOT / "chapters").rglob("*.qmd")):
            count = sum(lstsq_count(match.group(2)) for match in FENCE_RE.finditer(path.read_text()))
            if count:
                actual[str(path.relative_to(ROOT))] = count
        self.assertEqual(actual, EXPECTED_CALLS)
        for unit, limit in PREFIXES.items():
            prefix = authored_prefix(ROOT, unit, limit)
            cells = [match.group(2) for match in FENCE_RE.finditer(prefix)]
            originals = [match.group(2) for match in FENCE_RE.finditer((ROOT / unit).read_text())]
            self.assertEqual(cells, originals if limit is None else originals[:limit])
            self.assertEqual(sum(lstsq_count(cell) for cell in cells), EXPECTED_CALLS[unit])

    def test_missing_prefix_cell_fails(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "test.qmd").write_text("```{python}\nprint(1)\n```\n")
            with self.assertRaisesRegex(ValueError, "Missing authored prefix"):
                authored_prefix(root, "test.qmd", 2)

    def test_all_authored_calls_use_the_declared_rank_aware_cpu_driver(self):
        for unit, limit in PREFIXES.items():
            for match in FENCE_RE.finditer(authored_prefix(ROOT, unit, limit)):
                for node in ast.walk(ast.parse(match.group(2))):
                    if (isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute)
                            and ast.unparse(node.func) == "torch.linalg.lstsq"):
                        drivers = [keyword.value for keyword in node.keywords if keyword.arg == "driver"]
                        self.assertEqual(len(drivers), 1, unit)
                        self.assertIsInstance(drivers[0], ast.Constant, unit)
                        self.assertEqual(drivers[0].value, "gelsd", unit)

    def test_kernel_uses_the_explicit_existing_launcher_at_one_thread(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            environment = kernel_environment(root, "/chosen/python", "1704067200")
            kernel = json.loads((root / "jupyter/data/kernels/python3/kernel.json").read_text())
            self.assertEqual(kernel["argv"][:2], ["/chosen/python", str(ROOT / "container/kernel_start.py")])
            for key in ("DLBOOK_TORCH_NUM_THREADS", "DLBOOK_TORCH_INTEROP_THREADS",
                        "OMP_NUM_THREADS", "MKL_NUM_THREADS", "OPENBLAS_NUM_THREADS"):
                self.assertEqual(environment[key], "1")

    def test_pretraining_image_gate_includes_this_real_witness(self):
        gate = (ROOT / "container/test_unit_execution.py").read_text()
        self.assertIn("from test_lstsq_sources import RealQuartoAuthoredLstsqTests", gate)


@unittest.skipUnless(os.environ.get("QUARTO_BIN") and os.environ.get("QUARTO_PYTHON"),
                     "Set QUARTO_BIN and QUARTO_PYTHON for the real authored-source witness")
class RealQuartoAuthoredLstsqTests(unittest.TestCase):
    def test_all_seven_authored_calls_repeat_in_both_formats(self):
        started = time.monotonic()
        sources = {unit: authored_prefix(ROOT, unit, limit) for unit, limit in PREFIXES.items()}
        report = {"status": "running", "source_prefix_sha256": {
            unit: digest(source.encode()) for unit, source in sources.items()},
            "source_date_epoch": "1704067200", "runs": []}
        try:
            for repeat in range(2):
                with tempfile.TemporaryDirectory(prefix="authored-lstsq-") as directory:
                    root = Path(directory)
                    environment = kernel_environment(root, os.environ["QUARTO_PYTHON"], report["source_date_epoch"])
                    for unit, source in sources.items():
                        path = root / unit
                        path.parent.mkdir(parents=True, exist_ok=True)
                        path.write_text(source)
                    (root / "_quarto.yml").write_text(
                        "project:\n  type: book\n  output-dir: _book\nbook:\n"
                        "  title: Authored least-squares witness\n  chapters:\n"
                        + "".join(f"    - {unit}\n" for unit in sources)
                        + "jupyter: python3\nexecute:\n  freeze: true\n  warning: false\n"
                        + "format:\n  html: default\n  pdf: default\n")
                    shutil.copy2(ROOT / "_quarto-execution.yml", root / "_quarto-execution.yml")
                    for unit in sources:
                        for fmt in ("latex", "html"):
                            print(f"Authored lstsq witness {repeat + 1}/2: {unit} {fmt}", flush=True)
                            run_env = {**environment, "DLBOOK_EXECUTION_UNIT": unit,
                                       "DLBOOK_EXECUTION_FORMAT": fmt}
                            result = subprocess.run(
                                execution_command(os.environ["QUARTO_BIN"], unit, fmt),
                                cwd=root, env=run_env, text=True, capture_output=True, timeout=90)
                            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                    probes = [json.loads(path.read_text()) for path in (root / "kernel-probes").glob("*.json")]
                    self.assertEqual(len(probes), 8)
                    self.assertEqual({(row["unit"], row["format"]) for row in probes},
                                     {(unit, fmt) for unit in sources for fmt in ("latex", "html")})
                    for probe in probes:
                        self.assertEqual((probe["torch"]["num_threads"], probe["torch"]["num_interop_threads"]), (1, 1))
                    frozen = root / "_freeze/chapters"
                    inventory = {path.relative_to(frozen).as_posix(): digest(path.read_bytes())
                                 for path in sorted(frozen.rglob("*")) if path.is_file()}
                    self.assertEqual(sum(name.endswith(".json") for name in inventory), 8)
                    self.assertEqual({Path(name).suffix for name in inventory}, {".json", ".png", ".pdf"})
                    report["runs"].append({"files_sha256": inventory, "kernel_observations": probes})
            first, second = (run["files_sha256"] for run in report["runs"])
            report["differing_files"] = [name for name in sorted(set(first) | set(second))
                                          if first.get(name) != second.get(name)]
            report["status"] = "passed" if not report["differing_files"] else "failed"
            self.assertEqual(report["differing_files"], [], json.dumps(report["differing_files"], indent=2))
        except BaseException as error:
            report["status"] = "failed"
            report["error"] = repr(error)
            raise
        finally:
            report["elapsed_seconds"] = time.monotonic() - started
            if os.environ.get("DLBOOK_LSTSQ_WITNESS_REPORT"):
                path = Path(os.environ["DLBOOK_LSTSQ_WITNESS_REPORT"])
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
            print(f"Authored lstsq witness: {report['status']} in {report['elapsed_seconds']:.1f}s", flush=True)


if __name__ == "__main__":
    unittest.main()
