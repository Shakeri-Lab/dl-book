"""Lightweight recipe and fail-closed fixtures; no training or Docker required."""
from __future__ import annotations
from copy import deepcopy
import io
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
import unittest
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT / "container"), str(ROOT / "scripts")]

from packaging.utils import canonicalize_name, parse_wheel_filename
from freeze_provenance import ENVIRONMENT_KEYS as PROBE_KEYS, source_fingerprint
from image_artifact import digest, verify
from resolve_wheel_lock import linux_tags
from run_canonical_freeze import (check_completed, execution_command, extract_source,
                                 validate_execution_profile, validate_source, write_json)
from runtime_policy import ENVIRONMENT_KEYS as KERNEL_KEYS
from audit_execution_coverage import build_coverage_manifest, record_execution


def frozen(value="metric: 0.125\n", ordinal=1):
    return {"result": {"markdown": (
        f"::: {{.cell execution_count={ordinal}}}\n"
        "::: {.cell-output .cell-output-stdout}\n```\n" + value + "```\n:::\n:::\n"
    )}}


class RecipeTests(unittest.TestCase):
    def test_exact_base_and_quarto_pins(self):
        config = json.loads((ROOT / "container/canonical-runtime.json").read_text())
        dockerfile = (ROOT / "container/Dockerfile").read_text()
        self.assertIn("FROM --platform=linux/amd64 " + config["base_image"], dockerfile)
        self.assertRegex(config["base_image_digest"], r"^sha256:[0-9a-f]{64}$")
        self.assertRegex(config["quarto_sha256"], r"^[0-9a-f]{64}$")
        self.assertIn(config["quarto_version"], config["quarto_url"])
        self.assertNotIn("apt-get", dockerfile)
        self.assertIn("--require-hashes --only-binary=:all: --no-deps", dockerfile)
        self.assertIn("python -m pip check", dockerfile)

    def test_all_68_wheels_have_one_exact_compatible_hash(self):
        text = (ROOT / "container/requirements-linux-amd64.lock").read_text()
        entries = re.findall(r"^([a-z0-9-]+) @ (https://\S+) \\\n    --hash=sha256:([0-9a-f]{64})$", text, re.M)
        self.assertEqual(len(entries), 68)
        self.assertEqual(len({name for name, _, _ in entries}), 68)
        supported = linux_tags()
        for name, url, _ in entries:
            self.assertIn(urlparse(url).hostname, {"files.pythonhosted.org", "download-r2.pytorch.org"})
            wheel_name, _, _, tags = parse_wheel_filename(unquote(urlparse(url).path.rsplit("/", 1)[1]))
            self.assertEqual(canonicalize_name(wheel_name), name)
            self.assertTrue(set(tags).intersection(supported), name)

    def test_kernel_and_fingerprint_observe_identical_policy_keys(self):
        self.assertEqual(KERNEL_KEYS, PROBE_KEYS)
        self.assertIn("SOURCE_DATE_EPOCH", KERNEL_KEYS)
        kernel = json.loads((ROOT / "container/kernel.json").read_text())
        self.assertEqual(kernel["argv"][:2], ["/opt/venv/bin/python", "/opt/dlbook/kernel_start.py"])

    def test_canonical_dispatch_is_consistent_between_manifest_and_image(self):
        config = json.loads((ROOT / "container/canonical-runtime.json").read_text())
        dockerfile = (ROOT / "container/Dockerfile").read_text()
        required = {"MKL_CBWR": "COMPATIBLE", "ATEN_CPU_CAPABILITY": "avx2",
                    "OPENBLAS_CORETYPE": "Haswell",
                    "NPY_DISABLE_CPU_FEATURES": "X86_V4,AVX512_ICL,AVX512_SPR",
                    "ONEDNN_MAX_CPU_ISA": "AVX2"}
        for key, value in required.items():
            self.assertEqual(config["environment"][key], value)
            self.assertIn(f"{key}={value}", dockerfile)
            self.assertIn(key, PROBE_KEYS)

    def test_workflow_preserves_independent_image_and_complete_gate(self):
        text = (ROOT / ".github/workflows/canonical-freeze.yml").read_text()
        for required in ("workflow_call:", "source_revision:", "image_run_id:",
                         "--network none", "--require-all-files", "--env SOURCE_DATE_EPOCH",
                         "persist-credentials: false", "if: always()", "canonical-freeze-image"):
            self.assertIn(required, text)
        self.assertNotIn("git push", text)
        self.assertNotIn("contents: write", text)

    def test_unit_execution_cannot_fall_back_to_book_mode(self):
        self.assertEqual(validate_execution_profile(ROOT)["path"], "_quarto-execution.yml")
        for fmt in ("html", "latex"):
            self.assertEqual(execution_command("quarto", "chapters/test.qmd", fmt),
                             ["quarto", "render", "chapters/test.qmd", "--profile", "execution",
                              "--to", fmt, "--no-clean", "--execute-daemon", "0", "-M", "keep-ipynb:true"])
        with tempfile.TemporaryDirectory() as temporary:
            with self.assertRaisesRegex(ValueError, "execution-only profile"):
                validate_execution_profile(Path(temporary))

    def test_image_owned_runner_defers_source_helper_imports(self):
        with tempfile.TemporaryDirectory() as temporary:
            runner = Path(temporary) / "run_canonical_freeze.py"
            shutil.copy2(ROOT / "scripts/run_canonical_freeze.py", runner)
            result = subprocess.run([sys.executable, "-I", str(runner), "--help"],
                                    cwd=temporary, capture_output=True, text=True, timeout=15)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertIn("--source-archive", result.stdout)

    def test_execution_svg_bypass_requires_the_profile_level_option(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            for options in ("", "use-rsvg-convert: true\n",
                            "format:\n  pdf:\n    use-rsvg-convert: false\n"):
                (root / "_quarto-execution.yml").write_text("project:\n  type: default\n" + options)
                with self.subTest(options=options), self.assertRaisesRegex(ValueError, "use-rsvg-convert:false"):
                    validate_execution_profile(root)

    def test_execution_svg_images_require_source_bound_pdf_siblings(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            shutil.copy2(ROOT / "_quarto-execution.yml", root / "_quarto-execution.yml")
            (root / "chapters").mkdir()
            (root / "figures").mkdir()
            source = root / "chapters/test.qmd"
            source.write_text("# Fixture\n\n![An image](../figures/mechanism.svg)\n")
            (root / "figures/mechanism.svg").write_text("<svg/>")
            with self.assertRaisesRegex(ValueError, "in-source SVG/PDF pair"):
                validate_execution_profile(root)
            (root / "figures/mechanism.pdf").write_bytes(b"PDF fixture")
            self.assertEqual(validate_execution_profile(root)["sha256"], digest(root / "_quarto-execution.yml"))
            (root / "figures/mechanism.svg").unlink()
            with self.assertRaisesRegex(ValueError, "in-source SVG/PDF pair"):
                validate_execution_profile(root)

    def test_execution_svg_guard_checks_preface_and_paths_with_spaces(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            shutil.copy2(ROOT / "_quarto-execution.yml", root / "_quarto-execution.yml")
            (root / "index.qmd").write_text("![Image](<figure with spaces.svg>)\n")
            (root / "figure with spaces.svg").write_text("<svg/>")
            with self.assertRaisesRegex(ValueError, "in-source SVG/PDF pair"):
                validate_execution_profile(root)
            (root / "figure with spaces.pdf").write_bytes(b"PDF fixture")
            validate_execution_profile(root)

    def test_execution_svg_guard_rejects_external_pairs_but_ignores_diagnostic_copies(self):
        with tempfile.TemporaryDirectory() as temporary:
            parent = Path(temporary)
            root = parent / "source"
            root.mkdir()
            shutil.copy2(ROOT / "_quarto-execution.yml", root / "_quarto-execution.yml")
            (parent / "outside.svg").write_text("<svg/>")
            (parent / "outside.pdf").write_bytes(b"PDF fixture")
            (root / "index.qmd").write_text("![Image](../outside.svg)\n")
            with self.assertRaisesRegex(ValueError, "in-source SVG/PDF pair"):
                validate_execution_profile(root)
            (root / "index.qmd").write_text("# Preface\n")
            (root / "build").mkdir()
            (root / "build/old-source.qmd").write_text("![Old image](missing.svg)\n")
            # Website-only favicon configuration is not a PDF body image.
            (root / "_quarto.yml").write_text("book:\n  favicon: figures/favicon.svg\n")
            validate_execution_profile(root)

    def test_execution_svg_guard_rejects_a_pdf_symlink_outside_source(self):
        with tempfile.TemporaryDirectory() as temporary:
            parent = Path(temporary)
            root = parent / "source"
            root.mkdir()
            shutil.copy2(ROOT / "_quarto-execution.yml", root / "_quarto-execution.yml")
            (root / "index.qmd").write_text("![Image](figure.svg)\n")
            (root / "figure.svg").write_text("<svg/>")
            (parent / "outside.pdf").write_bytes(b"PDF fixture")
            (root / "figure.pdf").symlink_to(parent / "outside.pdf")
            with self.assertRaisesRegex(ValueError, "in-source SVG/PDF pair"):
                validate_execution_profile(root)

    def test_execution_svg_guard_rejects_existing_but_unbound_generated_pairs(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            shutil.copy2(ROOT / "_quarto-execution.yml", root / "_quarto-execution.yml")
            for directory in ("_book", "build", "figures/__pycache__", "chapters/test_files"):
                images = root / directory
                images.mkdir(parents=True)
                (images / "image.svg").write_text("<svg/>")
                (images / "image.pdf").write_bytes(b"PDF fixture")
                (root / "index.qmd").write_text(f"![Image]({directory}/image.svg)\n")
                with self.subTest(directory=directory), self.assertRaisesRegex(ValueError, "in-source SVG/PDF pair"):
                    validate_execution_profile(root)


class IsolationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def archive(self, members):
        path = self.root / "source.tar"
        with tarfile.open(path, "w") as archive:
            for name in members:
                payload = b"source"
                member = tarfile.TarInfo(name)
                member.size = len(payload)
                archive.addfile(member, io.BytesIO(payload))
        return path

    def test_archive_does_not_inherit_frozen_or_rendered_results(self):
        archive = self.archive(["chapters/test.qmd", "_freeze/stale.json", "_book/index.html", "build/stale.log"])
        extracted = self.root / "fresh"
        extracted.mkdir()
        extract_source(archive, extracted)
        self.assertTrue((extracted / "chapters/test.qmd").is_file())
        self.assertEqual([p.name for p in extracted.iterdir()], ["chapters"])

    def test_archive_escape_rejected(self):
        extracted = self.root / "fresh"
        extracted.mkdir()
        with self.assertRaisesRegex(ValueError, "Unsafe source"):
            extract_source(self.archive(["../escaped"]), extracted)

    def test_host_clean_manifest_required_and_changed_input_rejected(self):
        (self.root / "chapter.qmd").write_text("Original")
        current = source_fingerprint(self.root, "a" * 40)
        before = {**current, "dirty": False}
        validate_source(before, current, "a" * 40)
        with self.assertRaisesRegex(ValueError, "verified clean"):
            validate_source({**before, "dirty": None}, current, "a" * 40)
        (self.root / "chapter.qmd").write_text("Changed")
        with self.assertRaisesRegex(ValueError, "Extracted source differs"):
            validate_source(before, source_fingerprint(self.root, "a" * 40), "a" * 40)

    def test_tampered_or_wrong_source_image_rejected_before_load(self):
        archive = self.root / "image.tar.gz"
        archive.write_bytes(b"fixture image, not an executable Docker archive")
        expected = {"source_commit": "a" * 40, "recipe_files_sha256": {"container/Dockerfile": "b" * 64}}
        metadata = {"schema_version": 1, **expected, "image_id": "sha256:" + "c" * 64,
                    "archive_sha256": digest(archive)}
        self.assertEqual(verify(metadata, archive, expected), metadata["image_id"])
        with self.assertRaisesRegex(ValueError, "different source"):
            verify(metadata, archive, {**expected, "source_commit": "d" * 40})
        archive.write_bytes(b"altered")
        with self.assertRaisesRegex(ValueError, "SHA-256 mismatch"):
            verify(metadata, archive, expected)


class CoverageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.freeze = self.root / "_freeze"
        self.probes = self.root / "provenance/kernel-startup"
        body = 'print("metric: 0.125")\n'
        source = "# Test\n\n```{python}\n" + body + "```\n"
        unit = "chapters/test.qmd"
        (self.root / "chapters").mkdir()
        (self.root / unit).write_text(source)
        (self.root / "_quarto.yml").write_text("execute:\n  freeze: true\n")
        self.source_files = {name: digest(self.root / name) for name in (unit, "_quarto.yml")}
        self.plan = {"formats": ["html", "tex"], "units": {unit: {"source_sha256": self.source_files[unit],
                     "native_cells_sha256": [hashlib.sha256(body.encode()).hexdigest()]}}}
        coverage = []
        for fmt in ("html", "tex"):
            write_json(self.freeze / f"chapters/test/execute-results/{fmt}.json", frozen())
            write_json(self.probes / f"{fmt}.json", {"unit": "chapters/test.qmd", "format": fmt})
            notebook = self.root / "chapters/test.quarto_ipynb"
            write_json(notebook, {"cells": [{"cell_type": "code", "execution_count": 1, "source": body,
                       "outputs": [{"output_type": "stream", "name": "stdout", "text": "metric: 0.125\n"}]}]})
            log = self.root / f"{fmt}.log"
            log.write_text("Executing 'test.quarto_ipynb'\n  Cell 1/1: ''...Done\n")
            coverage.append(record_execution(self.root, self.freeze, self.probes.parent, unit, fmt,
                                              log, notebook, self.plan["units"][unit]))
        manifest = build_coverage_manifest(self.probes.parent, self.plan, self.freeze, self.source_files, coverage)
        write_json(self.probes.parent / "execution-coverage.json", manifest)
        write_json(self.probes.parent / "source-before.json", {"files_sha256": self.source_files})

    def test_exact_formats_and_fresh_kernel_coverage_pass(self):
        report = check_completed(ROOT, self.freeze, self.plan, self.probes)
        self.assertEqual(report["stdout_blocks_per_format"], 1)
        self.assertFalse(report["independent_repeat_verified"])

    def test_changed_stdout_fails_without_a_tolerance(self):
        write_json(self.freeze / "chapters/test/execute-results/tex.json", frozen("metric: 0.1250000001\n"))
        # Each synthetic form carries its own coherent evidence; the separate
        # cross-format byte check must still reject their numerical difference.
        path = self.probes.parent / "execution-coverage.json"
        manifest = json.loads(path.read_text())
        row = next(row for row in manifest["units"] if row["format"] == "tex")
        notebook = self.probes.parent / row["notebook"]["artifact"]
        document = json.loads(notebook.read_text())
        document["cells"][0]["outputs"][0]["text"] = "metric: 0.1250000001\n"
        write_json(notebook, document)
        row["notebook"]["sha256"] = digest(notebook)
        row["freeze_sha256"] = digest(self.freeze / "chapters/test/execute-results/tex.json")
        write_json(path, manifest)
        with self.assertRaisesRegex(ValueError, "not byte-identical"):
            check_completed(ROOT, self.freeze, self.plan, self.probes)

    def test_missing_native_cell_fails_even_with_identical_stdout(self):
        plan = deepcopy(self.plan)
        plan["units"]["chapters/test.qmd"]["native_cells_sha256"].append("b" * 64)
        with self.assertRaisesRegex(ValueError, "native-cell coverage"):
            check_completed(ROOT, self.freeze, plan, self.probes)

    def test_missing_format_fails(self):
        (self.freeze / "chapters/test/execute-results/tex.json").unlink()
        with self.assertRaisesRegex(ValueError, "coverage differs"):
            check_completed(ROOT, self.freeze, self.plan, self.probes)

    def test_duplicate_kernel_probe_fails(self):
        write_json(self.probes / "extra.json", {"unit": "chapters/test.qmd", "format": "html"})
        with self.assertRaisesRegex(ValueError, "one fresh kernel"):
            check_completed(ROOT, self.freeze, self.plan, self.probes)

    def test_missing_retained_proof_has_no_log_only_fallback(self):
        (self.probes.parent / "execution-coverage.json").unlink()
        with self.assertRaisesRegex(ValueError, "coverage proof is required"):
            check_completed(ROOT, self.freeze, self.plan, self.probes)


if __name__ == "__main__":
    unittest.main()
