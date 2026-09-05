#!/usr/bin/env python3
"""Small offline fixtures for the canonical notebook publication boundary."""
from __future__ import annotations

import copy
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import textwrap
from types import SimpleNamespace
import unittest
from unittest.mock import patch

from export_notebooks import _bootstrap_source
from notebook_manifest import NotebookUnit
from audit_book_contract import (
    CANONICAL_PUBLICATION_INPUTS, canonical_publication_runtime_errors,
)
import run_canonical_notebooks as runner


def digest(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


class CanonicalNotebookTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory(prefix="canonical-notebook-test-")
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name).resolve()
        self.commit, self.publication = "a" * 40, "b" * 40
        self.image_id = "sha256:" + "c" * 64
        self.fingerprint = {
            "source": {"commit": self.commit, "files_sha256": {}},
            "container": {"digest": self.image_id},
            "run": {"ci": {"GITHUB_RUN_ID": "123456"}},
            "runtime": {"environment": {"SOURCE_DATE_EPOCH": "1780000000"}},
            "execution_plan": {"units": {}},
        }
        self.context = {"canonical_source_commit": self.commit,
                        "publication_commit": self.publication,
                        "image_id": self.image_id, "archive_locator": None}

    def write(self, name, value):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(value if isinstance(value, bytes) else json.dumps(value).encode())
        return path

    def receipt(self, suffix="one", hashes=None):
        return self.write(f"provenance/canonical-freezes/{self.commit}-{suffix}/promotion.json", {
            "source_commit": self.commit, "fingerprint_sha256": hashes or ["d" * 64, "e" * 64],
        })

    def locator(self):
        return {
            "schema_version": 1, "image_id": self.image_id,
            "canonical_source_commit": self.commit,
            "repository": "shakeri-lab/dl-book", "release_tag": "v-next-runtime",
            "archive_sha256": digest(b"image archive"),
            "archive_assets": [{"name": "image.tar.gz", "sha256": digest(b"image archive")}],
            "manifest_asset": {"name": "image.json", "sha256": "f" * 64},
        }

    def store_locator(self, locator):
        return self.write(f"provenance/canonical-images/{self.image_id[7:]}.json", locator)

    def test_receipt_is_unique_and_installed_proof_is_checked(self):
        receipt = self.receipt()
        with patch.object(runner, "verify_installed", return_value=[]) as verify:
            self.assertEqual(runner.find_receipt(self.root, self.fingerprint, "d" * 64), receipt.parent)
            verify.assert_called_once_with(self.root, receipt.parent)
            self.receipt("two")
            with self.assertRaisesRegex(ValueError, "found 2"):
                runner.find_receipt(self.root, self.fingerprint, "d" * 64)

    def test_bad_installed_proof_fails(self):
        self.receipt()
        with patch.object(runner, "verify_installed", return_value=["missing paired sidecar"]):
            with self.assertRaisesRegex(ValueError, "missing paired sidecar"):
                runner.find_receipt(self.root, self.fingerprint, "d" * 64)

    def test_receipt_with_empty_hashes_is_not_a_match(self):
        path = self.receipt()
        document = json.loads(path.read_text())
        document["fingerprint_sha256"] = []
        path.write_text(json.dumps(document))
        with self.assertRaisesRegex(ValueError, "found 0"):
            runner.find_receipt(self.root, self.fingerprint, "d" * 64)

    def test_symlink_receipt_is_rejected(self):
        path = self.receipt()
        original = path.with_name("original.json")
        path.rename(original)
        path.symlink_to(original)
        with self.assertRaisesRegex(ValueError, "Symlink"):
            runner.find_receipt(self.root, self.fingerprint, "d" * 64)

    def test_prepare_distinguishes_execution_and_publication_commits(self):
        for name in ("container/Dockerfile", "scripts/run_canonical_freeze.py"):
            path = self.write(name, b"unchanged runtime recipe\n")
            self.fingerprint["source"]["files_sha256"][name] = runner.sha256(path)
        self.write("_freeze/provenance.json", self.fingerprint)
        receipt = self.receipt()
        with (patch.object(runner, "find_receipt", return_value=receipt.parent),
              patch.object(runner.subprocess, "check_output", side_effect=[self.publication, "1780000000"]) as git):
            context = runner.prepare(self.root)
        self.assertEqual(context["publication_commit"], self.publication)
        self.assertEqual(context["canonical_source_commit"], self.commit)
        self.assertIn(self.commit, git.call_args_list[1].args[0])
        with (patch.object(runner, "find_receipt", return_value=receipt.parent),
              patch.object(runner.subprocess, "check_output", side_effect=[self.publication, "1790000000"])):
            with self.assertRaisesRegex(ValueError, "SOURCE_DATE_EPOCH"):
                runner.prepare(self.root)
        self.write("container/Dockerfile", b"different recipe")
        with (patch.object(runner, "find_receipt", return_value=receipt.parent),
              patch.object(runner.subprocess, "check_output", side_effect=[self.publication, "1780000000"])):
            with self.assertRaisesRegex(ValueError, "runtime input changed"):
                runner.prepare(self.root)

    def test_staged_assets_bind_all_three_identities(self):
        asset = self.write("data/tiny.txt", b"fixed data")
        checksum = runner.sha256(asset)
        notebook = {"metadata": {"dlbook": {"revision": self.publication,
                    "assets": [{"path": "data/tiny.txt", "sha256": checksum}]}}}
        runner.stage_assets(self.root, notebook, self.root / "runtime", self.context, {"data/tiny.txt": checksum})
        self.assertEqual((self.root / f"runtime/dl-book-{self.publication[:12]}/data/tiny.txt").read_bytes(), b"fixed data")
        for changed in ("canonical", "current", "publication"):
            with self.subTest(changed=changed):
                trial = copy.deepcopy(notebook)
                canonical = {"data/tiny.txt": checksum}
                if changed == "canonical":
                    canonical["data/tiny.txt"] = "0" * 64
                elif changed == "current":
                    asset.write_bytes(b"changed data")
                else:
                    trial["metadata"]["dlbook"]["revision"] = self.commit
                with self.assertRaises(ValueError):
                    runner.stage_assets(self.root, trial, self.root / "runtime", self.context, canonical)
                asset.write_bytes(b"fixed data")

    def test_even_prose_changes_in_executable_units_require_a_fresh_freeze(self):
        for name in ("container/Dockerfile", "scripts/run_canonical_freeze.py"):
            path = self.write(name, b"unchanged runtime recipe\n")
            self.fingerprint["source"]["files_sha256"][name] = runner.sha256(path)
        unit = self.write("chapters/tiny.qmd", b"Old prose\n```{python}\nprint(1)\n```\n")
        self.fingerprint["execution_plan"]["units"]["chapters/tiny.qmd"] = {"source_sha256": runner.sha256(unit)}
        self.write("_freeze/provenance.json", self.fingerprint)
        receipt = self.receipt()
        unit.write_bytes(b"New prose\n```{python}\nprint(1)\n```\n")
        with (patch.object(runner, "find_receipt", return_value=receipt.parent),
              patch.object(runner.subprocess, "check_output", side_effect=[self.publication, "1780000000"])):
            with self.assertRaisesRegex(ValueError, "manuscript unit changed"):
                runner.prepare(self.root)

    def test_asset_traversal_is_rejected(self):
        notebook = {"metadata": {"dlbook": {"revision": self.publication,
                    "assets": [{"path": "../escape", "sha256": "0" * 64}]}}}
        with self.assertRaisesRegex(ValueError, "Unsafe"):
            runner.stage_assets(self.root, notebook, self.root / "runtime", self.context, {})

    def test_archive_locator_is_explicit_and_content_addressed(self):
        self.assertIsNone(runner.archive_locator(self.root, self.fingerprint))
        locator = self.locator()
        self.store_locator(locator)
        self.assertEqual(runner.archive_locator(self.root, self.fingerprint), locator)
        for key, value in (("image_id", "sha256:" + "0" * 64),
                           ("canonical_source_commit", self.publication),
                           ("repository", "unrelated/repository"), ("release_tag", "--latest")):
            with self.subTest(key=key):
                changed = {**locator, key: value}
                self.store_locator(changed)
                with self.assertRaises(ValueError):
                    runner.archive_locator(self.root, self.fingerprint)

    def test_archive_locator_rejects_globs_and_duplicate_asset_names(self):
        for name in ("*.tar.gz", "../image.tar.gz", "image.json"):
            with self.subTest(name=name):
                locator = self.locator()
                locator["archive_assets"][0]["name"] = name
                self.store_locator(locator)
                with self.assertRaises(ValueError):
                    runner.archive_locator(self.root, self.fingerprint)

    def image_fixture(self):
        (self.root / "container").mkdir(exist_ok=True)
        shutil.copy2(runner.ROOT / "container/image_artifact.py", self.root / "container/image_artifact.py")
        script = self.write("scripts/run_canonical_freeze.py", b"recipe")
        archive = self.write("archive.tar.gz", b"image archive")
        manifest = self.write("image.json", {
            "schema_version": 1, "source_commit": self.commit,
            "image_id": self.image_id, "archive_sha256": runner.sha256(archive),
            "recipe_files_sha256": {
                "container/image_artifact.py": runner.sha256(self.root / "container/image_artifact.py"),
                "scripts/run_canonical_freeze.py": runner.sha256(script),
            },
        })
        return archive, manifest

    def test_image_archive_and_recipe_are_verified_before_load(self):
        archive, manifest = self.image_fixture()
        self.assertEqual(runner.verify_image(self.root, self.context, archive, manifest), self.image_id)
        archive.write_bytes(b"corrupt archive")
        with self.assertRaisesRegex(ValueError, "SHA-256 mismatch"):
            runner.verify_image(self.root, self.context, archive, manifest)

    def test_release_parts_reassemble_only_original_bytes(self):
        archive, manifest = self.image_fixture()
        payloads = {"part-01": b"image ", "part-02": b"archive", "image.json": manifest.read_bytes()}
        locator = self.locator()
        locator["archive_assets"] = [{"name": name, "sha256": digest(payloads[name])}
                                     for name in ("part-01", "part-02")]
        locator["manifest_asset"]["sha256"] = runner.sha256(manifest)
        context = {**self.context, "archive_locator": locator}
        def download(command, **kwargs):
            destination = Path(command[command.index("--dir") + 1])
            name = command[command.index("--pattern") + 1]
            (destination / name).write_bytes(payloads[name])
        with patch.object(runner.subprocess, "run", side_effect=download) as run:
            output = self.root / "downloaded"
            runner.fetch_image(self.root, context, output)
        self.assertEqual((output / "image.tar.gz").read_bytes(), archive.read_bytes())
        self.assertEqual((output / "image.json").read_bytes(), manifest.read_bytes())
        self.assertEqual(run.call_count, 3)
        with self.assertRaisesRegex(ValueError, "overwrite"):
            runner.fetch_image(self.root, context, output)

    def test_no_archive_locator_never_guesses_a_release(self):
        with patch.object(runner.subprocess, "run") as run:
            with self.assertRaisesRegex(ValueError, "No explicit"):
                runner.fetch_image(self.root, self.context, self.root / "downloaded")
            run.assert_not_called()

    def test_bad_release_asset_never_reaches_image_load(self):
        locator = self.locator()
        def corrupt_download(command, **kwargs):
            directory = Path(command[command.index("--dir") + 1])
            (directory / command[command.index("--pattern") + 1]).write_bytes(b"wrong bytes")
        with patch.object(runner.subprocess, "run", side_effect=corrupt_download):
            with self.assertRaisesRegex(ValueError, "checksum mismatch"):
                runner.fetch_image(self.root, {**self.context, "archive_locator": locator}, self.root / "downloaded")
        self.assertFalse((self.root / "downloaded/image.tar.gz").exists())

    def test_release_original_manifest_checksum_is_required(self):
        archive, manifest = self.image_fixture()
        with self.assertRaisesRegex(ValueError, "original manifest"):
            runner.verify_image(self.root, {**self.context, "archive_locator": self.locator()}, archive, manifest)

    def test_actual_kernel_identity_and_context_are_checked(self):
        observation = {
            "schema_version": 1, "scope": "executed kernel startup, before chapter cells",
            "unit": "chapters/part1/tiny.qmd", "format": "notebook-public",
            "python": {"version": "3.12.14", "implementation": "CPython"},
            "torch": {"version": "2.12.1+cpu", "config": "AVX2 build",
                      "num_threads": 1, "num_interop_threads": 1},
            "environment": {"OMP_NUM_THREADS": "1"},
        }
        path = self.write("probes/kernel.json", observation)
        expected = runner.kernel_identity(observation)
        runner.check_kernel_probes(path.parent, observation["unit"], "public", expected)
        for key, value in (("format", "notebook-reference"), ("unit", "unrelated.qmd"),
                           ("torch", {**observation["torch"], "num_threads": 6})):
            with self.subTest(key=key):
                path.write_text(json.dumps({**observation, key: value}))
                with self.assertRaisesRegex(ValueError, "kernel identity"):
                    runner.check_kernel_probes(path.parent, observation["unit"], "public", expected)
        path.unlink()
        with self.assertRaisesRegex(ValueError, "exactly one"):
            runner.check_kernel_probes(path.parent, observation["unit"], "public", expected)

    def bootstrap(self, assets=()):
        return _bootstrap_source(document=SimpleNamespace(title="Tiny"),
            unit=NotebookUnit("chapters/part1/tiny.qmd", "tiny"),
            revision=self.publication, assets=assets, support="", repository="shakeri-lab/dl-book")

    def run_bootstrap(self, source, version):
        previous = Path.cwd()
        self.addCleanup(os.chdir, previous)
        fake_torch = SimpleNamespace(nn=SimpleNamespace())
        with (patch("importlib.metadata.version", side_effect=version),
              patch.dict("sys.modules", {"torch": fake_torch}),
              patch.dict(os.environ, {"DLBOOK_NOTEBOOK_CANONICAL": "1", "DLBOOK_NOTEBOOK_ROOT": str(self.root / "runtime")}),
              patch("subprocess.run") as install,
              patch("urllib.request.urlretrieve") as download):
            try:
                exec(source, {})
            finally:
                install.assert_not_called()
                download.assert_not_called()

    def test_cpu_local_version_suffix_needs_no_install(self):
        from notebook_manifest import PINNED_REQUIREMENTS
        versions = dict(item.split("==") for item in PINNED_REQUIREMENTS)
        self.run_bootstrap(self.bootstrap(), lambda name: versions[name] + "+cpu")

    def test_missing_dependency_is_an_offline_error(self):
        with self.assertRaisesRegex(RuntimeError, "missing pinned requirements"):
            self.run_bootstrap(self.bootstrap(), lambda name: "0.0.0")

    def test_missing_asset_is_an_offline_error(self):
        from notebook_manifest import PINNED_REQUIREMENTS
        versions = dict(item.split("==") for item in PINNED_REQUIREMENTS)
        with self.assertRaisesRegex(RuntimeError, "asset is missing or changed"):
            self.run_bootstrap(self.bootstrap(({"path": "data/tiny.txt", "sha256": "0" * 64},)), versions.__getitem__)

    def test_workflow_uses_sealed_offline_runtime_and_exact_comparison(self):
        workflow = (runner.ROOT / ".github/workflows/publish.yml").read_text()
        job = workflow.split("  validate_notebooks:\n", 1)[1].split("  build-deploy:\n", 1)[0]
        self.assertNotIn("pip install", job)
        self.assertNotIn("--freeze-policy portable", job)
        for invariant in ("--network none", "--entrypoint python", "canonical_python.py",
                          "fetch-depth: 0", "--env GIT_CONFIG_VALUE_0=/source",
                          "steps.canonical.outputs.image_id", "run_canonical_notebooks.py execute"):
            self.assertIn(invariant, job)
        self.assertIn('"--freeze-policy", "exact"', Path(runner.__file__).read_text())


class CanonicalPublicationTripwireTests(unittest.TestCase):
    """Mutate the actual publication call sites, not a parallel sample workflow."""
    def setUp(self):
        self.workflow = (runner.ROOT / ".github/workflows/publish.yml").read_text()
        self.inputs = {name: (runner.ROOT / name).read_text() for name in CANONICAL_PUBLICATION_INPUTS}

    def test_current_integrated_contract_is_green(self):
        self.assertEqual(canonical_publication_runtime_errors(self.workflow, self.inputs), [])

    def test_workflow_safety_downgrades_fail(self):
        mutations = (
            ("cancel-in-progress: true", "cancel-in-progress: false"),
            ("git ls-remote --exit-code origin refs/heads/main", "git rev-parse HEAD"),
            ('if [ "$publication_main_tip" != "$GITHUB_SHA" ]; then', 'if false; then'),
            ("--network none", "--network bridge"),
            ('"$IMAGE_ID" /opt/dlbook/canonical_python.py', '"dlbook:latest" /opt/dlbook/canonical_python.py'),
            ("--entrypoint python --env SOURCE_DATE_EPOCH", "--entrypoint python"),
            ("SOURCE_DATE_EPOCH: ${{ steps.canonical.outputs.source_date_epoch }}", "SOURCE_DATE_EPOCH: ${{ github.sha }}"),
            ("scripts/run_canonical_notebooks.py verify-image", "scripts/skip_image_check.py"),
            ("scripts/run_canonical_notebooks.py prepare", "scripts/skip_prepare.py"),
            ("scripts/run_canonical_notebooks.py execute", "scripts/run_native_notebooks.py"),
            ("needs: validate_notebooks", "needs: export_notebooks"),
            ("--shard-count 6", "--shard-count 1"),
            ('test "$verified_id" = "$IMAGE_ID"', "true"),
        )
        for before, after in mutations:
            with self.subTest(removed=before):
                self.assertIn(before, self.workflow)
                changed = self.workflow.replace(before, after)
                self.assertTrue(canonical_publication_runtime_errors(changed, self.inputs))
        for forbidden in ("continue-on-error: true", "pip install torch", "docker build ."):
            with self.subTest(added=forbidden):
                changed = self.workflow.replace("  validate_notebooks:\n", "  validate_notebooks:\n    " + forbidden + "\n")
                self.assertTrue(canonical_publication_runtime_errors(changed, self.inputs))

    def test_actual_publication_shell_rejects_stale_or_unverified_main(self):
        guard = self.workflow.split("      - name: Refuse a superseded publication\n", 1)[1].split("      - name: ", 1)[0]
        script = textwrap.dedent(guard.split("        run: |\n", 1)[1])
        with tempfile.TemporaryDirectory(prefix="publication-freshness-test-") as directory:
            # Exercise the workflow's actual shell. No remote calls or Git
            # mutation are needed to model an old run finishing after a new one.
            fake_git = Path(directory) / "git"
            fake_git.write_text("#!/bin/sh\n"
                                'case "$1" in\n'
                                'rev-parse) printf "%s\\n" "$TEST_CHECKOUT_SHA" ;;\n'
                                'ls-remote) test "$TEST_REMOTE_FAIL" = 0 || exit 128; '
                                'printf "%s\\trefs/heads/main\\n" "$TEST_MAIN_SHA" ;;\n'
                                '*) exit 129 ;;\n'
                                'esac\n')
            fake_git.chmod(0o755)
            old, new = "a" * 40, "b" * 40
            for label, checkout, tip, unavailable, succeeds in (
                ("current main", old, old, "0", True),
                ("older run completes last", old, new, "0", False),
                ("checkout differs from audited run", new, old, "0", False),
                ("remote is unavailable", old, old, "1", False),
                ("main ref is missing", old, "", "0", False),
            ):
                with self.subTest(case=label):
                    environment = {**os.environ, "PATH": directory + os.pathsep + os.environ["PATH"],
                                   "GITHUB_SHA": old, "TEST_CHECKOUT_SHA": checkout,
                                   "TEST_MAIN_SHA": tip, "TEST_REMOTE_FAIL": unavailable}
                    result = subprocess.run(["bash", "-c", script], env=environment,
                                            text=True, capture_output=True)
                    self.assertEqual(result.returncode == 0, succeeds, result.stdout + result.stderr)
    def test_runner_proof_downgrades_fail(self):
        name = "scripts/run_canonical_notebooks.py"
        mutations = (
            ('"--freeze-policy", "exact"', '"--freeze-policy", "portable"'),
            ("verify_installed(root, matches[0])", "[]"),
            ("len(matches) != 1", "len(matches) < 1"),
            ("epoch != git_epoch", "False"),
            ('sha256(path) != specification["source_sha256"]', "False"),
            ('canonical_files.get(name.as_posix()) != record["sha256"]', "False"),
            ('runtime_identity(observed) != runtime_identity(fingerprint["runtime"])', "False"),
            ("check_kernel_probes(probes, unit.source, form, expected_kernel)", "pass"),
            ("kernel_identity(document) != expected", "False"),
            ('document.get("unit") != unit', "False"),
            ('document.get("format") != f"notebook-{form}"', "False"),
            ('DLBOOK_NOTEBOOK_CANONICAL="1"', 'DLBOOK_NOTEBOOK_CANONICAL="0"'),
            ('subprocess.run([*source_audit, *audit_args], cwd=root, check=True)', "pass"),
        )
        for before, after in mutations:
            with self.subTest(removed=before):
                changed = self.inputs.copy()
                self.assertIn(before, changed[name])
                changed[name] = changed[name].replace(before, after)
                self.assertTrue(canonical_publication_runtime_errors(self.workflow, changed))

    def test_host_and_image_quarto_pins_are_both_required(self):
        changed = self.workflow.replace('version: "1.10.18"', 'version: "latest"', 1)
        self.assertTrue(canonical_publication_runtime_errors(changed, self.inputs))
        for field, value in (("quarto_version", "1.10.19"), ("quarto_sha256", "floating")):
            with self.subTest(field=field):
                changed = self.inputs.copy()
                settings = json.loads(changed["container/canonical-runtime.json"])
                settings[field] = value
                changed["container/canonical-runtime.json"] = json.dumps(settings)
                self.assertTrue(canonical_publication_runtime_errors(self.workflow, changed))
        changed = self.inputs.copy()
        changed["container/install_quarto.py"] = changed["container/install_quarto.py"].replace('digest != settings["quarto_sha256"]', "False")
        self.assertTrue(canonical_publication_runtime_errors(self.workflow, changed))

    def test_every_library_and_torch_budget_is_pinned_in_image(self):
        keys = ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS",
                "VECLIB_MAXIMUM_THREADS", "NUMEXPR_NUM_THREADS",
                "DLBOOK_TORCH_NUM_THREADS", "DLBOOK_TORCH_INTEROP_THREADS")
        for key in keys:
            for locus in ("container/Dockerfile", "container/canonical-runtime.json"):
                with self.subTest(key=key, locus=locus):
                    changed = self.inputs.copy()
                    if locus.endswith(".json"):
                        settings = json.loads(changed[locus])
                        settings["environment"][key] = "6"
                        changed[locus] = json.dumps(settings)
                    else:
                        changed[locus] = changed[locus].replace(key + "=1", key + "=6")
                    self.assertTrue(canonical_publication_runtime_errors(self.workflow, changed))
        changed = self.inputs.copy()
        changed["container/Dockerfile"] += "\nENV OMP_NUM_THREADS=6\n"
        self.assertTrue(canonical_publication_runtime_errors(self.workflow, changed))

    def test_kernel_and_offline_bootstrap_bypasses_fail(self):
        cases = (
            ("container/kernel.json", "/opt/dlbook/kernel_start.py", "-m"),
            ("container/runtime_policy.py", "torch.set_num_interop_threads(interop)", "pass"),
            ("container/kernel_start.py", "torch = initialize_torch()", "import torch"),
            ("container/kernel_start.py", '"num_threads": torch.get_num_threads()', '"num_threads": 1'),
            ("container/canonical_python.py", "initialize_torch()", "pass"),
            ("scripts/export_notebooks.py", "_bootstrap_os.environ.get('DLBOOK_NOTEBOOK_CANONICAL') == '1'", "False"),
        )
        for name, before, after in cases:
            with self.subTest(locus=name):
                changed = self.inputs.copy()
                changed[name] = changed[name].replace(before, after)
                self.assertTrue(canonical_publication_runtime_errors(self.workflow, changed))


if __name__ == "__main__":
    unittest.main()
