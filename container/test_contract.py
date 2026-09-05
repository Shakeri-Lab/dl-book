"""Lightweight recipe and fail-closed fixtures; no training or Docker required."""
from __future__ import annotations
from copy import deepcopy
import io
import json
from pathlib import Path
import re
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
from run_canonical_freeze import check_completed, extract_source, validate_source, write_json
from runtime_policy import ENVIRONMENT_KEYS as KERNEL_KEYS


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

    def test_workflow_preserves_independent_image_and_complete_gate(self):
        text = (ROOT / ".github/workflows/canonical-freeze.yml").read_text()
        for required in ("workflow_call:", "source_revision:", "image_run_id:",
                         "--network none", "--require-all-files", "--env SOURCE_DATE_EPOCH",
                         "persist-credentials: false", "if: always()", "canonical-freeze-image"):
            self.assertIn(required, text)
        self.assertNotIn("git push", text)
        self.assertNotIn("contents: write", text)


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
        self.root = Path(self.temp.name)
        self.freeze = self.root / "_freeze"
        self.probes = self.root / "probes"
        self.plan = {"units": {"chapters/test.qmd": {"native_cells_sha256": ["a" * 64]}}}
        for fmt in ("html", "tex"):
            write_json(self.freeze / f"chapters/test/execute-results/{fmt}.json", frozen())
            write_json(self.probes / f"{fmt}.json", {"unit": "chapters/test.qmd", "format": fmt})

    def test_exact_formats_and_fresh_kernel_coverage_pass(self):
        report = check_completed(ROOT, self.freeze, self.plan, self.probes)
        self.assertEqual(report["stdout_blocks_per_format"], 1)
        self.assertFalse(report["independent_repeat_verified"])

    def test_changed_stdout_fails_without_a_tolerance(self):
        write_json(self.freeze / "chapters/test/execute-results/tex.json", frozen("metric: 0.1250000001\n"))
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


if __name__ == "__main__":
    unittest.main()
