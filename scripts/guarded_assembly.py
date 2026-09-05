#!/usr/bin/env python3
"""Assemble derived editions without executing code or mutating installed evidence."""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

from freeze_provenance import execution_plan, freeze_inventory, sha256, source_fingerprint, write_json
from pdf_build_contract import build_environment, input_manifest, manifest_digest, snapshot, source_state

ROOT = Path(__file__).resolve().parents[1]
PDF_NAMES = ("Deep-Learning--Making-It-Learnable.pdf",
             "Deep-Learning--Making-It-Learnable--Continuous.pdf")


def validate_manuscript_inputs(root: Path, fingerprint: dict) -> None:
    """Frozen Markdown includes prose: even editorial QMD edits require refresh."""
    current = source_fingerprint(root, None if (root / ".git").exists()
                                 else fingerprint["source"]["commit"])
    if execution_plan(root, current)["units"] != fingerprint["execution_plan"]["units"]:
        raise ValueError("Executable manuscript/source inventory changed since canonical execution")
    protected_roots = {"code", "data", "experiments", "container"}
    protected_files = {"requirements.txt", "scripts/notebook_requirements.txt",
                       "scripts/notebook_manifest.json"}
    def protected(files):
        return {name: digest for name, digest in files.items()
                if name.split("/")[0] in protected_roots or name in protected_files}
    if protected(current["files_sha256"]) != protected(fingerprint["source"]["files_sha256"]):
        raise ValueError("Canonical code/data/experiment/container inputs changed")


def verify_installed_inputs(root: Path) -> dict:
    from run_canonical_notebooks import find_receipt
    path = root / "_freeze/provenance.json"
    fingerprint = json.loads(path.read_text())
    proof = find_receipt(root, fingerprint, sha256(path))
    validate_manuscript_inputs(root, fingerprint)
    if (root / ".git").exists():
        subprocess.run([sys.executable, "scripts/audit_execution_identity.py", "--base",
                        fingerprint["source"]["commit"]], cwd=root, check=True)
    return {"fingerprint_sha256": sha256(path), "proof_directory": proof.relative_to(root).as_posix(),
            "canonical_source_commit": fingerprint["source"]["commit"]}


def verify_original_unchanged(root: Path, before: dict) -> None:
    if inventory(root / "_freeze") != before:
        raise ValueError("Installed canonical freeze changed during assembly")


def guard_environment(root: Path, directory: Path, base: dict) -> dict:
    """Register a refusing Python kernel; a cache miss cannot run chapter code."""
    directory.mkdir(parents=True, exist_ok=True)
    launcher = directory / "deny_kernel.py"
    launcher.write_text(
        "import os, pathlib, sys\n"
        "pathlib.Path(os.environ['DLBOOK_ASSEMBLY_ATTEMPT']).write_text('kernel launch refused\\n')\n"
        "print('DLBOOK: code execution forbidden during assembly', file=sys.stderr)\n"
        "raise SystemExit(86)\n"
    )
    argv = [sys.executable, str(launcher), "-f", "{connection_file}"]
    write_json(directory / "data/kernels/python3/kernel.json", {
        "argv": argv, "language": "python", "display_name": "Assembly: execution prohibited",
    })
    for part in ("config", "runtime"):
        (directory / part).mkdir(exist_ok=True)
    env = {**base, "QUARTO_PYTHON": sys.executable,
           "JUPYTER_PATH": str(directory / "data"), "JUPYTER_DATA_DIR": str(directory / "data"),
           "JUPYTER_CONFIG_DIR": str(directory / "config"), "JUPYTER_RUNTIME_DIR": str(directory / "runtime"),
           "JUPYTER_PREFER_ENV_PATH": "0", "DLBOOK_ASSEMBLY_ATTEMPT": str(directory / "attempt.txt")}
    query = ("import json; from jupyter_client.kernelspec import KernelSpecManager; "
             "print(json.dumps(KernelSpecManager().get_kernel_spec('python3').argv))")
    actual = json.loads(subprocess.check_output([sys.executable, "-c", query], cwd=root, env=env, text=True))
    if actual != argv:
        raise ValueError("Assembly kernel refusal policy was not selected")
    return env


def assembly_command(quarto: str, args: list[str]) -> list[str]:
    # --no-execute disables Quarto's cache thaw too, so it can silently omit
    # cached outputs. Force the freezer and make any kernel start fail instead.
    forbidden = {"--execute", "--no-execute", "--cache-refresh", "--execute-daemon-restart"}
    if forbidden.intersection(args):
        raise ValueError("Execution/cache override forbidden in assembly")
    return [quarto, "render", *args, "--use-freezer", "--execute-daemon", "0", "-M", "jupyter:python3"]


def inventory(root: Path) -> dict[str, str]:
    result = freeze_inventory(root)
    proof = root / "provenance.json"
    if proof.is_file():
        result["provenance.json"] = sha256(proof)
    return result


def verify_assembly_inventory(before: dict, freeze: Path) -> list[str]:
    """Only disposable site_libs changes are presentation work; nothing else is."""
    after = inventory(freeze)
    changes = [name for name in sorted(before.keys() | after.keys()) if before.get(name) != after.get(name)]
    forbidden = [name for name in changes if not name.startswith("site_libs/")]
    if forbidden:
        raise ValueError("Assembly changed canonical computations/assets: " + ", ".join(forbidden))
    return changes


def guarded_render(root: Path, args: list[str], env: dict, *, quarto: str = "quarto") -> dict:
    before = inventory(root / "_freeze")
    with tempfile.TemporaryDirectory(prefix="dlbook-assembly-denial-") as temporary:
        guard = Path(temporary)
        protected_env = guard_environment(root, guard, env)
        result = subprocess.run(assembly_command(quarto, args), cwd=root, env=protected_env)
        changes = verify_assembly_inventory(before, root / "_freeze")
        if (guard / "attempt.txt").exists():
            raise ValueError("Quarto attempted code execution during assembly; no artifact can be installed")
        if result.returncode:
            raise ValueError(f"Quarto assembly failed with exit code {result.returncode}")
    return {"code_execution": "prohibited", "canonical_results_and_figures": "byte-identical",
            "disposable_presentation_changes": changes}


def install_html(root: Path, rendered: Path) -> Path | None:
    """Install a verified bundle, preserving PDFs and a recoverable old bundle."""
    if not (rendered / "index.html").is_file():
        raise ValueError("HTML assembly did not produce index.html")
    for path in rendered.rglob("*"):
        if path.is_symlink():
            raise ValueError(f"Symlink in HTML assembly output: {path}")
    # Stage on the destination filesystem so directory renames are atomic.
    stage = Path(tempfile.mkdtemp(prefix=".dlbook-html-install-", dir=root))
    shutil.copytree(rendered, stage, dirs_exist_ok=True)
    target = root / "_book"
    for name in PDF_NAMES:
        existing = target / name
        if existing.is_file():
            shutil.copy2(existing, stage / name)
    backup = None
    if target.exists():
        (root / "build").mkdir(exist_ok=True)
        backup = Path(tempfile.mkdtemp(prefix="html-previous-", dir=root / "build")) / "_book"
        target.rename(backup)
    try:
        stage.rename(target)
    except BaseException:
        if backup is not None:
            backup.rename(target)
        raise
    return backup


def assemble_html(root: Path, *, quarto: str = "quarto") -> dict:
    build = root / "build"
    build.mkdir(exist_ok=True)
    (build / "html-assembly.json").unlink(missing_ok=True)
    (build / "quarto-html-final-render.log").unlink(missing_ok=True)
    context = verify_installed_inputs(root)
    before = inventory(root / "_freeze")
    state, manifest = source_state(root), input_manifest(root)
    with tempfile.TemporaryDirectory(prefix="dlbook-html-assembly-") as temporary:
        worker = Path(temporary) / "source"
        snapshot(root, worker, manifest, state)
        verify_installed_inputs(worker)
        (worker / "build").mkdir(exist_ok=True)
        try:
            result = guarded_render(worker, ["--to", "html", "--no-clean", "--debug", "--log",
                                            "build/quarto-html-final-render.log"],
                                    build_environment(state), quarto=quarto)
        finally:
            log = worker / "build/quarto-html-final-render.log"
            if log.exists():
                shutil.copy2(log, build / log.name)
            verify_original_unchanged(root, before)
        if input_manifest(root) != manifest:
            raise ValueError("Book inputs changed during HTML assembly; restart")
        backup = install_html(root, worker / "_book")
    verify_original_unchanged(root, before)
    result.update(context)
    result["presentation_source"] = state
    result["input_sha256"] = manifest_digest(manifest)
    result["previous_bundle"] = str(backup) if backup else None
    write_json(build / "html-assembly.json", result)
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--verify-only", action="store_true")
    parser.add_argument("--quarto", default="quarto")
    args = parser.parse_args()
    result = (verify_installed_inputs(args.root.resolve()) if args.verify_only else
              assemble_html(args.root.resolve(), quarto=args.quarto))
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
