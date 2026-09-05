#!/usr/bin/env python3
"""Tiny synthetic-bundle promotion tests; never touch the publication freeze."""
from __future__ import annotations

from copy import deepcopy
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch

from compare_freeze_runs import validate_fingerprint
from freeze_provenance import (
    execution_plan, freeze_inventory, sha256, source_fingerprint, write_json,
)
import promote_canonical_freeze as promotion
from test_freeze_provenance import bind_coverage, bind_preflight, CONFIG, execution, fingerprint


class PromotionTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.area = Path(temporary.name).resolve()
        self.root = self.area / "repo"
        self.root.mkdir()
        self.commit = "a" * 40
        inputs = {
            "_quarto.yml": CONFIG,
            "chapters/test.qmd": "# Test\n\n```{python}\nprint('value: 1.234')\n```\n",
            "container/Dockerfile": "# synthetic recipe\n",
            "container/requirements-linux-amd64.lock": "# synthetic lock\n",
        }
        for name, text in inputs.items():
            path = self.root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text)

        # Mock only Git checkout discovery/cleanliness in this gitless fixture;
        # inventories, source hashes, execution plan, copying and comparison are real.
        self.source_reader = source_fingerprint
        self.clean_patch = patch.object(promotion, "source_fingerprint", side_effect=self.clean_source)
        self.git_patch = patch.object(promotion, "_git_toplevel", return_value=self.root)
        self.clean_patch.start()
        self.git_patch.start()
        self.addCleanup(self.clean_patch.stop)
        self.addCleanup(self.git_patch.stop)
        source = self.clean_source(self.root, self.commit)
        self.bundles = [self.area / "first", self.area / "second"]
        for bundle, run in zip(self.bundles, ("run-one", "run-two")):
            freeze = bundle / "_freeze"
            for fmt in ("html", "tex"):
                write_json(freeze / f"chapters/test/execute-results/{fmt}.json", execution())
            asset = freeze / "chapters/test/figure-html/test.png"
            asset.parent.mkdir(parents=True)
            asset.write_bytes(b"synthetic identical image bytes")
            document = fingerprint(freeze, run)
            document["source"] = deepcopy(source)
            document["execution_plan"] = execution_plan(self.root, source)
            for key in ("recipe", "wheel_lock"):
                record = document["container"][key]
                record["sha256"] = source["files_sha256"][record["path"]]
            bind_preflight(freeze, document)
            bind_coverage(freeze, document, source_root=self.root)
            write_json(bundle / "provenance/fingerprint.json", document)
        self.destination = self.root / "_freeze"
        write_json(self.destination / "chapters/old/execute-results/html.json", execution("old value\n"))
        write_json(self.destination / "provenance.json", {"old": "metadata"})
        self.old = self.bytes_tree(self.destination)

    def clean_source(self, root: Path, commit: str) -> dict:
        document = self.source_reader(root, commit)
        return {**document, "dirty": False}

    @staticmethod
    def bytes_tree(path: Path) -> dict[str, bytes]:
        return {item.relative_to(path).as_posix(): item.read_bytes()
                for item in path.rglob("*") if item.is_file()}

    def invoke(self, **kwargs):
        return promotion.promote(*self.bundles, root=self.root,
                                 source_commit=self.commit, **kwargs)

    def mutate_fingerprint(self, index: int, change):
        path = self.bundles[index] / "provenance/fingerprint.json"
        document = json.loads(path.read_text())
        change(document)
        bind_preflight(self.bundles[index] / "_freeze", document)
        write_json(path, document)

    def add_paired_evidence(self):
        plan_path = self.root / "docs/paired-evidence-plan.json"
        write_json(plan_path, {"schema_version": 1, "fixture": "paired plan"})
        source = self.clean_source(self.root, self.commit)
        for bundle in self.bundles:
            provenance = bundle / "provenance"
            sidecars = {}
            for index in range(8):
                path = provenance / "paired-evidence" / f"fixture-{index}.json"
                write_json(path, {"seed": 6050 + index % 5, "value": index})
                sidecars[path.name] = sha256(path)
            manifest = {
                "passed": True, "plan_sha256": sha256(plan_path),
                "source_sha256": {"chapters/test.qmd": source["files_sha256"]["chapters/test.qmd"]},
                "files_sha256": sidecars,
            }
            manifest_path = provenance / "paired-evidence-manifest.json"
            write_json(manifest_path, manifest)
            path = provenance / "fingerprint.json"
            document = json.loads(path.read_text())
            document["source"] = deepcopy(source)
            document["execution_plan"] = execution_plan(self.root, source)
            document["paired_evidence"] = {"manifest_sha256": sha256(manifest_path), "manifest": manifest}
            bind_preflight(bundle / "_freeze", document)
            write_json(path, document)

    def test_dry_run_is_read_only_and_uses_all_files_gate(self):
        before = self.bytes_tree(self.area)
        with patch.object(promotion, "compare_runs", wraps=promotion.compare_runs) as compare:
            result = self.invoke()
        self.assertFalse(result["applied"])
        self.assertEqual(compare.call_args.kwargs, {"require_all_files": True})
        self.assertEqual(self.bytes_tree(self.area), before)
        self.assertFalse((self.root / "build").exists())
        self.assertFalse((self.root / "provenance").exists())
        self.assertEqual(Path(result["destination"]), self.destination)

    def test_explicit_apply_preserves_old_bytes_and_inventory_contract(self):
        first_document = json.loads((self.bundles[0] / "provenance/fingerprint.json").read_text())
        result = self.invoke(apply=True)
        self.assertTrue(result["applied"])
        previous = Path(result["previous_freeze"])
        self.assertTrue(previous.is_relative_to(self.root / "build/freeze-backups"))
        self.assertEqual(self.bytes_tree(previous), self.old)
        self.assertEqual(freeze_inventory(self.destination), first_document["freeze_files_sha256"])
        self.assertEqual((self.destination / "provenance.json").read_bytes(),
                         (self.bundles[0] / "provenance/fingerprint.json").read_bytes())
        proof = Path(result["proof_destination"])
        self.assertEqual(validate_fingerprint(first_document, self.destination,
                                              provenance_root=proof / "first/provenance"), [])
        self.assertEqual((proof / "second/provenance/fingerprint.json").read_bytes(),
                         (self.bundles[1] / "provenance/fingerprint.json").read_bytes())
        self.assertEqual(promotion.verify_installed(self.root, proof), [])
        self.assertTrue(json.loads((proof / "exact-repeat.json").read_text())["full_freeze_byte_identical"])
        self.assertEqual(self.clean_source(self.root, self.commit)["files_sha256"],
                         first_document["source"]["files_sha256"])
        with self.assertRaisesRegex(ValueError, "already exists"):
            self.invoke(apply=True)

    def test_figure_drift_fails_even_when_numeric_stdout_is_identical(self):
        changed = self.bundles[1] / "_freeze/chapters/test/figure-html/test.png"
        changed.write_bytes(b"different picture")
        self.mutate_fingerprint(1, lambda document: document.update(
            freeze_files_sha256=freeze_inventory(self.bundles[1] / "_freeze")))
        with self.assertRaisesRegex(ValueError, "Full freeze is not byte-identical"):
            self.invoke(apply=True)
        self.assertEqual(self.bytes_tree(self.destination), self.old)

    def test_commit_source_input_and_plan_are_bound_to_current_checkout(self):
        with self.assertRaisesRegex(ValueError, "full lowercase"):
            promotion.promote(*self.bundles, root=self.root, source_commit="a" * 12)
        with self.assertRaisesRegex(ValueError, "current source/input identity: commit"):
            promotion.promote(*self.bundles, root=self.root, source_commit="b" * 40)
        (self.root / "chapters/test.qmd").write_text("Changed source\n")
        with self.assertRaisesRegex(ValueError, "current source/input identity"):
            self.invoke()
        self.assertEqual(self.bytes_tree(self.destination), self.old)

    def test_dirty_and_gitless_or_wrong_checkout_are_refused(self):
        clean = self.clean_source(self.root, self.commit)
        with patch.object(promotion, "source_fingerprint", return_value={**clean, "dirty": True}):
            with self.assertRaisesRegex(ValueError, "must be clean"):
                self.invoke()
        with patch.object(promotion, "_git_toplevel", return_value=self.area):
            with self.assertRaisesRegex(ValueError, "exact Git checkout root"):
                self.invoke()
        with patch.object(promotion, "_git_toplevel", side_effect=subprocess.CalledProcessError(128, "git")):
            with self.assertRaises(subprocess.CalledProcessError):
                self.invoke()

    def test_missing_fingerprint_and_same_run_identity_are_refused(self):
        self.mutate_fingerprint(1, lambda document: document["run"].update(id="run-one"))
        with self.assertRaisesRegex(ValueError, "run IDs match"):
            self.invoke()
        (self.bundles[1] / "provenance/fingerprint.json").rename(self.area / "saved-fingerprint.json")
        with self.assertRaisesRegex(ValueError, "fingerprint is missing"):
            self.invoke()

    def test_symlink_candidate_entry_and_candidate_root_are_refused(self):
        link = self.bundles[0] / "_freeze/linked.png"
        link.symlink_to(self.bundles[0] / "_freeze/chapters/test/figure-html/test.png")
        with self.assertRaisesRegex(ValueError, "symlink artifact"):
            self.invoke()
        alias = self.area / "candidate-alias"
        alias.symlink_to(self.bundles[1], target_is_directory=True)
        with self.assertRaisesRegex(ValueError, "Symlink path component"):
            promotion.promote(alias, self.bundles[0], root=self.root, source_commit=self.commit)

    def test_destination_and_backup_symlink_cannot_redirect_writes(self):
        saved = self.root / "saved-freeze"
        self.destination.rename(saved)
        self.destination.symlink_to(saved, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, "Symlink path component"):
            self.invoke(apply=True)
        self.assertEqual(self.bytes_tree(saved), self.old)

    def test_nested_or_destination_candidates_are_refused(self):
        with self.assertRaisesRegex(ValueError, "distinct, non-nested"):
            promotion.promote(self.bundles[0], self.bundles[0] / "_freeze",
                              root=self.root, source_commit=self.commit)
        with self.assertRaisesRegex(ValueError, "overlaps"):
            promotion.promote(self.root, self.bundles[1], root=self.root, source_commit=self.commit)

    def test_copy_failure_keeps_old_freeze_and_retains_partial_copy(self):
        def fail_copy(source, destination):
            destination.mkdir()
            (destination / "partial.txt").write_text("partial copy")
            raise OSError("simulated copy failure")
        with patch.object(promotion.shutil, "copytree", side_effect=fail_copy):
            with self.assertRaisesRegex(RuntimeError, "previous freeze restored or untouched"):
                self.invoke(apply=True)
        self.assertEqual(self.bytes_tree(self.destination), self.old)
        retained = list((self.root / "build/freeze-backups").glob("*/incoming-freeze/partial.txt"))
        self.assertEqual(len(retained), 1)
        self.assertFalse((self.root / "provenance").exists())

    def test_copied_asset_corruption_is_caught_before_swap(self):
        original = shutil.copytree
        def corrupt(source, destination, *args, **kwargs):
            result = original(source, destination, *args, **kwargs)
            if Path(destination).name == "incoming-freeze":
                (destination / "chapters/test/figure-html/test.png").write_bytes(b"corrupt copy")
            return result
        with patch.object(promotion.shutil, "copytree", side_effect=corrupt):
            with self.assertRaisesRegex(RuntimeError, "Copied freeze or first evidence no longer matches"):
                self.invoke(apply=True)
        self.assertEqual(self.bytes_tree(self.destination), self.old)

    def test_failure_after_swap_rolls_back_without_deleting_failed_tree(self):
        original = promotion.os.replace
        def fail_proof(source, destination):
            if Path(source).name == "incoming-provenance":
                raise OSError("simulated proof installation failure")
            return original(source, destination)
        with patch.object(promotion.os, "replace", side_effect=fail_proof):
            with self.assertRaisesRegex(RuntimeError, "previous freeze restored"):
                self.invoke(apply=True)
        self.assertEqual(self.bytes_tree(self.destination), self.old)
        failed = list((self.root / "build/freeze-backups").glob("*/failed-freeze"))
        self.assertEqual(len(failed), 1)
        self.assertEqual(freeze_inventory(failed[0]), freeze_inventory(self.bundles[0] / "_freeze"))

    def test_source_edit_during_copy_aborts_before_swap(self):
        original = shutil.copytree
        def edit_source(source, destination, *args, **kwargs):
            result = original(source, destination, *args, **kwargs)
            if Path(destination).name == "incoming-freeze":
                (self.root / "chapters/test.qmd").write_text("Edited during preparation\n")
            return result
        with patch.object(promotion.shutil, "copytree", side_effect=edit_source):
            with self.assertRaisesRegex(RuntimeError, "current source/input identity"):
                self.invoke(apply=True)
        self.assertEqual(self.bytes_tree(self.destination), self.old)

    def test_paired_sidecars_are_archived_and_installed_reaudit_detects_tampering(self):
        self.add_paired_evidence()
        originals = [self.bytes_tree(bundle / "provenance") for bundle in self.bundles]
        result = self.invoke(apply=True)
        proof = Path(result["proof_destination"])
        for label, expected in zip(("first", "second"), originals):
            self.assertEqual(self.bytes_tree(proof / label / "provenance"), expected)
        self.assertEqual(promotion.verify_installed(self.root, proof), [])
        write_json(proof / "second/provenance/paired-evidence/fixture-0.json", {"tampered": True})
        errors = promotion.verify_installed(self.root, proof)
        self.assertTrue(any("sidecars are missing or differ" in error for error in errors), errors)

    def test_paired_copy_corruption_rejects_before_changing_current_freeze(self):
        self.add_paired_evidence()
        original = shutil.copytree
        def corrupt_evidence(source, destination, *args, **kwargs):
            result = original(source, destination, *args, **kwargs)
            path = Path(destination)
            if path.name == "provenance" and path.parent.name == "first":
                write_json(path / "paired-evidence/fixture-0.json", {"corrupted": True})
            return result
        with patch.object(promotion.shutil, "copytree", side_effect=corrupt_evidence):
            with self.assertRaisesRegex(RuntimeError, "first evidence no longer matches"):
                self.invoke(apply=True)
        self.assertEqual(self.bytes_tree(self.destination), self.old)

    def test_executed_notebook_and_preflight_survive_promotion_and_are_rechecked(self):
        result = self.invoke(apply=True)
        proof = Path(result["proof_destination"])
        for label, bundle in zip(("first", "second"), self.bundles):
            for relative in ("preflight.json", "executed-notebooks/chapters/test/html.ipynb"):
                self.assertEqual((proof / label / "provenance" / relative).read_bytes(),
                                 (bundle / "provenance" / relative).read_bytes())
        (proof / "second/provenance/execution-logs/chapters/test/tex.log").write_text("altered log")
        errors = promotion.verify_installed(self.root, proof)
        self.assertTrue(any("evidence checksum mismatch" in error for error in errors), errors)

    def test_notebook_copy_corruption_is_rejected_before_freeze_swap(self):
        original = shutil.copytree
        def corrupt_notebook(source, destination, *args, **kwargs):
            result = original(source, destination, *args, **kwargs)
            path = Path(destination)
            if path.name == "provenance" and path.parent.name == "first":
                write_json(path / "executed-notebooks/chapters/test/html.ipynb", {"cells": []})
            return result
        with patch.object(promotion.shutil, "copytree", side_effect=corrupt_notebook):
            with self.assertRaisesRegex(RuntimeError, "first evidence no longer matches"):
                self.invoke(apply=True)
        self.assertEqual(self.bytes_tree(self.destination), self.old)

    def test_install_failure_after_old_rename_restores_original(self):
        original = promotion.os.replace
        def fail_install(source, destination):
            if Path(source).name == "incoming-freeze":
                raise OSError("simulated install rename failure")
            return original(source, destination)
        with patch.object(promotion.os, "replace", side_effect=fail_install):
            with self.assertRaisesRegex(RuntimeError, "previous freeze restored"):
                self.invoke(apply=True)
        self.assertEqual(self.bytes_tree(self.destination), self.old)

    def test_backup_symlink_and_unsafe_receipt_paths_are_rejected(self):
        external = self.area / "external-backups"
        external.mkdir()
        (self.root / "build").mkdir()
        (self.root / "build/freeze-backups").symlink_to(external, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, "Symlink path component"):
            self.invoke(apply=True)
        self.assertEqual(list(external.iterdir()), [])
        self.assertTrue(promotion.verify_installed(self.root, external))


if __name__ == "__main__":
    unittest.main()
