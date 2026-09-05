"""Fast checks for input isolation, Git time, and presentation-only Part conversion."""

from __future__ import annotations

from contextlib import redirect_stdout
import io
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import render_pdf_profiles as renderer
from pdf_build_contract import (
    build_environment, consumed_inputs, input_manifest, manifest_digest,
    sha256, snapshot, source_state,
)

ROOT = Path(__file__).resolve().parents[1]


class PdfBuildContractTests(unittest.TestCase):
    def test_epoch_does_not_come_from_inherited_environment(self):
        with patch.dict(os.environ, {"SOURCE_DATE_EPOCH": "999", "TZ": "US/Pacific"}):
            env = build_environment({"source_date_epoch": 123})
        self.assertEqual(env["SOURCE_DATE_EPOCH"], "123")
        self.assertEqual(env["TZ"], "UTC")
        self.assertEqual(env["FORCE_SOURCE_DATE"], "1")

    def test_manifest_stable_order(self):
        self.assertEqual(manifest_digest({"a": "1", "b": "2"}),
                         manifest_digest({"b": "2", "a": "1"}))

    def test_snapshot_excludes_auth_and_build_state(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "repo"
            root.mkdir()
            subprocess.run(["git", "init", "-q", str(root)], check=True)
            (root / "index.qmd").write_text("# Book\n")
            (root / ".gitignore").write_text("build/\n.env\n")
            subprocess.run(["git", "-C", str(root), "add", "index.qmd", ".gitignore"], check=True)
            (root / ".env").write_text("TOKEN=not-a-real-secret\n")
            (root / ".credentials").write_text("not-a-real-secret\n")
            (root / "build").mkdir()
            (root / "build" / "old.pdf").write_text("stale")
            (root / "scripts").mkdir()
            (root / "scripts" / "new.py").write_text("print('preview')\n")
            manifest = input_manifest(root)
            self.assertEqual(set(manifest), {"index.qmd", ".gitignore", "scripts/new.py"})
            state = {"commit": "a" * 40, "source_date_epoch": 123, "dirty": True}
            target = Path(directory) / "snapshot"
            snapshot(root, target, manifest, state)
            self.assertFalse((target / ".git").exists())
            self.assertFalse((target / ".env").exists())
            self.assertEqual(source_state(target)["source_date_epoch"], 123)
            self.assertTrue(source_state(target)["dirty"])

    def test_changed_source_fails_snapshot(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "source"
            root.mkdir()
            (root / "index.qmd").write_text("new text")
            with self.assertRaisesRegex(ValueError, "Source changed"):
                snapshot(root, Path(directory) / "target", {"index.qmd": "0" * 64}, {})

    def test_preview_copies_untracked_code_and_root_css(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "repo"
            root.mkdir()
            subprocess.run(["git", "init", "-q", str(root)], check=True)
            (root / "index.qmd").write_text("# Book\n")
            subprocess.run(["git", "-C", str(root), "add", "index.qmd"], check=True)
            module = root / "code" / "dlbook" / "new_kernel.py"
            module.parent.mkdir(parents=True)
            module.write_text("def identity(x):\n    return x\n")
            stylesheet = root / "download.css"
            stylesheet.write_text("body { color: black; }\n")
            (root / ".credentials").write_text("not-a-real-secret\n")
            manifest = input_manifest(root)
            self.assertEqual(set(manifest), {
                "index.qmd", "code/dlbook/new_kernel.py", "download.css",
            })
            target = Path(directory) / "snapshot"
            snapshot(root, target, manifest, {
                "commit": "a" * 40, "source_date_epoch": 123, "dirty": True,
            })
            self.assertEqual((target / module.relative_to(root)).read_bytes(), module.read_bytes())
            self.assertEqual((target / "download.css").read_bytes(), stylesheet.read_bytes())
            self.assertFalse((target / ".credentials").exists())
            module.write_text("def identity(x):\n    return x + 1\n")
            self.assertNotEqual(input_manifest(root), manifest)

    def test_recorder_normalizes_project_paths(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "asset.tex").write_text("content")
            (root / "index.aux").write_text("transient")
            (root / "index.fls").write_text(
                f"INPUT {root}/asset.tex\nINPUT {root}/index.aux\n"
            )
            self.assertEqual(set(consumed_inputs(root)), {"PROJECT/asset.tex"})

    def convert(self, text: str, target: str) -> str:
        return subprocess.check_output([
            "quarto", "pandoc", "--from", "markdown", "--to", target,
            "--lua-filter", str(ROOT / "filters/pdf-part-preamble.lua"),
        ], input=text, text=True)

    def test_part_filter_keeps_prose_once_and_leaves_heading_for_quarto(self):
        text = "::: {.quarto-book-part}\n# The Part\n\nOne **learnable** move.\n\nA second paragraph.\n:::\n"
        latex = self.convert(text, "latex")
        self.assertEqual(latex.count("One \\textbf{learnable} move."), 1)
        self.assertEqual(latex.count("A second paragraph."), 1)
        self.assertLess(latex.index("\\setpartpreamble"), latex.index("\\section"))
        self.assertIn("\\textwidth", latex)
        html = self.convert(text, "html")
        self.assertNotIn("setpartpreamble", html)
        self.assertIn("One <strong>learnable</strong> move.", html)

    def test_synthetic_appendices_title_stays_unchanged(self):
        latex = self.convert("::: {.quarto-book-part}\n# Appendices\n:::\n", "latex")
        self.assertNotIn("setpartpreamble", latex)


class PdfProfilePromotionTests(unittest.TestCase):
    """Exercise gate orchestration with fake worker output, never compile PDFs."""

    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="pdf-gate-contract-")
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        (self.root / "index.qmd").write_text("# Fixed source\n")
        (self.root / "_book").mkdir()
        (self.root / "build").mkdir()
        self.manifest = {"index.qmd": sha256(self.root / "index.qmd")}
        self.state = {"commit": "a" * 40, "source_date_epoch": 123, "dirty": False}
        self.profiles = tuple(
            renderer.PdfProfile(name, self.root / "_book" / f"{name}.pdf", ())
            for name in ("print", "continuous")
        )
        for profile in self.profiles:
            profile.output.write_bytes(f"previous-{profile.name}".encode())
        self.success_record = self.root / "build" / "pdf-reproducibility.json"
        self.success_record.write_text('{"old_success": true}\n')
        self.worker_roots = []

    def run_gate(self, *, mismatch=False, changed_inputs=False, fail_worker=False):
        def fake_worker(command, *, cwd, **kwargs):
            checkout = Path(cwd)
            self.worker_roots.append(checkout)
            (checkout / "build").mkdir()
            (checkout / "_book").mkdir()
            if fail_worker and len(self.worker_roots) == 2:
                for suffix in ("log", "fls", "toc"):
                    (checkout / f"index.{suffix}").write_text(f"failed engine {suffix}\n")
                    (checkout / "build" / f"pdf-print.{suffix}").write_text(
                        f"completed print {suffix}\n"
                    )
                (checkout / "build" / "quarto-continuous-render-attempt-1.log").write_text(
                    "Quarto failure details\n"
                )
                # A partially completed profile is not a successful worker build.
                (checkout / "build" / "pdf-print-manifest.json").write_text("{}\n")
                return subprocess.CompletedProcess(command, 1)
            for profile in self.profiles:
                pdf = checkout / profile.output.relative_to(self.root)
                payload = f"new-{profile.name}"
                if mismatch and profile.name == "continuous":
                    payload += f"-{len(self.worker_roots)}"
                pdf.write_bytes(payload.encode())
                record = {"pdf_sha256": sha256(pdf), "pages": 1}
                (checkout / "build" / f"pdf-{profile.name}-manifest.json").write_text(
                    json.dumps(record)
                )
            return subprocess.CompletedProcess(command, 0)

        final_manifest = {**self.manifest, "changed.qmd": "new"} if changed_inputs else self.manifest
        with (
            patch.object(renderer, "ROOT", self.root),
            patch.object(renderer, "source_state", return_value=self.state),
            patch.object(renderer, "input_manifest", side_effect=[self.manifest, final_manifest]),
            patch.object(renderer.subprocess, "run", side_effect=fake_worker),
            redirect_stdout(io.StringIO()),
        ):
            renderer.verify_reproducible(self.profiles, 2)

    def assert_previous_pdfs_retained(self):
        for profile in self.profiles:
            self.assertEqual(profile.output.read_bytes(), f"previous-{profile.name}".encode())
        self.assertFalse(self.success_record.exists())

    def test_later_profile_mismatch_promotes_nothing(self):
        with self.assertRaisesRegex(SystemExit, "continuous is not byte-reproducible"):
            self.run_gate(mismatch=True)
        self.assert_previous_pdfs_retained()
        self.assertTrue((self.root / "build" / "repro-2-pdf-continuous.pdf").is_file())

    def test_changed_inputs_promote_nothing(self):
        with self.assertRaisesRegex(SystemExit, "Book inputs changed"):
            self.run_gate(changed_inputs=True)
        self.assert_previous_pdfs_retained()

    def test_failed_worker_retains_diagnostics_without_promoting_success(self):
        with self.assertRaisesRegex(SystemExit, "Fresh PDF build 2 failed"):
            self.run_gate(fail_worker=True)
        self.assert_previous_pdfs_retained()
        self.assertFalse(self.worker_roots[1].exists())
        build = self.root / "build"
        for suffix in ("log", "fls", "toc"):
            self.assertEqual((build / f"repro-2-index.{suffix}").read_text(),
                             f"failed engine {suffix}\n")
            self.assertEqual((build / f"repro-2-pdf-print.{suffix}").read_text(),
                             f"completed print {suffix}\n")
        self.assertEqual(
            (build / "repro-2-quarto-continuous-render-attempt-1.log").read_text(),
            "Quarto failure details\n",
        )
        self.assertTrue((build / "pdf-repro-build-2.log").is_file())
        self.assertFalse(list(build.glob("repro-2-*-manifest.json")))

    def test_matching_fresh_builds_install_both_profiles(self):
        self.run_gate()
        self.assertEqual(len(set(self.worker_roots)), 2)
        for profile in self.profiles:
            self.assertEqual(profile.output.read_bytes(), f"new-{profile.name}".encode())
        record = json.loads(self.success_record.read_text())
        self.assertEqual(record["fresh_builds"], 2)
        self.assertEqual(record["profiles"], {
            profile.name: sha256(profile.output) for profile in self.profiles
        })


if __name__ == "__main__":
    unittest.main()
