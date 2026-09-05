#!/usr/bin/env python3
"""Certify native execution from kept notebooks, not presentation-only Markdown.

Silent hidden cells may be absent from Quarto's freeze. They are never absent
from this contract: source, ordered executed cells, successful per-cell logs,
rendered cells and printed stdout must agree. Raw evidence stays outside _freeze.
"""
from __future__ import annotations

import ast
import hashlib
import json
from pathlib import Path
import re
import shutil

import yaml

from audit_frozen_stdout import native_execution_ordinals, stdout_records
from audit_python_sources import FENCE_RE


def digest(path: Path) -> str:
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def safe_file(path: Path, root: Path) -> Path:
    # An explicitly selected root may use the standard /tmp or /var alias on
    # macOS. Reject links *inside* that proof boundary, not outside it.
    path = root.resolve() / path.relative_to(root)
    boundary = root.resolve()
    if (not path.is_file() or any(p.is_symlink() for p in (path, *path.parents)
                                 if p.is_relative_to(boundary))
            or not path.resolve().is_relative_to(boundary)):
        raise ValueError(f"Unsafe/missing execution evidence file: {path}")
    return path


def text(value) -> str:
    return "".join(value) if isinstance(value, list) else value


def partition_options(source: str) -> tuple[dict, str]:
    """Read only the leading directive block; preserve all other Python text.

    Quarto 1.10.18 core/lib/partition-cell-options.ts and
    core/jupyter/jupyter.ts reserialize this YAML when creating a notebook.
    Directive-like lines inside strings or later comments are not cell options.
    """
    # Match Quarto's CR/LF-only lines(), not str.splitlines(): Unicode line
    # separators and form feeds can be meaningful inside a Python string.
    lines = re.split(r"\r\n?|\n", source)
    count = 0
    yaml_lines = []
    for line in lines:
        if not line.startswith("#|"):
            break
        value = line[2:]
        yaml_lines.append(value[1:] if value.startswith(" ") else value)
        count += 1
    parsed = yaml.safe_load("\n".join(yaml_lines)) or {}
    if not isinstance(parsed, dict):
        raise ValueError("Native cell options must be a mapping")
    return parsed, "\n".join(lines[count:])


def options(source: str) -> dict:
    return partition_options(source)[0]


def trim_outer_empty_lines(source: str) -> str:
    # Quarto trims outer blank lines and the final newline, not internal code,
    # indentation, ordinary comments, or whitespace on nonempty lines.
    lines = re.split(r"\r\n?|\n", source)
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    return "\n".join(lines)


def same_option_values(left, right) -> bool:
    # YAML/JSON may spell a numeric dimension 2.0 or 2. Boolean execution
    # switches must never compare equal to 0/1 through Python's numeric rules.
    if isinstance(left, bool) or isinstance(right, bool):
        return type(left) is type(right) and left == right
    if isinstance(left, dict) and isinstance(right, dict):
        return left.keys() == right.keys() and all(same_option_values(left[k], right[k]) for k in left)
    if isinstance(left, list) and isinstance(right, list):
        return len(left) == len(right) and all(same_option_values(a, b) for a, b in zip(left, right))
    return left == right


def source_options_match(body: str, cell: dict) -> bool:
    expected, expected_code = partition_options(body)
    observed, observed_code = partition_options(text(cell["source"]))
    metadata = cell.get("metadata", {})
    # Of this book's authored options, only these two are moved by pinned
    # Quarto's kJupyterCellOptionKeys partition. Do not license arbitrary
    # metadata (including execution overrides/tags), dropped options, or values.
    if (not isinstance(metadata, dict) or set(metadata) - {"fig-width", "fig-height"}
            or set(metadata) & set(observed)):
        return False
    return (trim_outer_empty_lines(expected_code) == trim_outer_empty_lines(observed_code)
            and same_option_values(expected, {**observed, **metadata}))


def collect_stdout(records) -> list[tuple[int, str]]:
    result = []
    for ordinal, value in records:
        if result and result[-1][0] == ordinal:
            result[-1] = (ordinal, result[-1][1] + value)
        else:
            result.append((ordinal, value))
    return result


def audit_execution_notebook(source: str, notebook: dict, freeze_raw: str,
                             log: str, unit: str, defaults: dict,
                             specification: dict) -> dict:
    if source.startswith("---\n"):
        front = yaml.safe_load(source.split("---", 2)[1]) or {}
        if "execute" in front:
            raise ValueError("Per-unit execution defaults need explicit coverage support")
    bodies = [match.group(2) for match in FENCE_RE.finditer(source)]
    hashes = [hashlib.sha256(body.encode()).hexdigest() for body in bodies]
    if hashes != specification["native_cells_sha256"]:
        raise ValueError("Native source bodies differ from the pre-execution plan")
    if defaults.get("eval", True) is not True or defaults.get("cache", False) is not False:
        raise ValueError("Coverage requires actual evaluation without a cell execution cache")
    cells = [cell for cell in notebook["cells"] if cell["cell_type"] == "code"]
    wanted = list(range(1, len(bodies) + 1))
    if len(cells) != len(bodies) or [cell.get("execution_count") for cell in cells] != wanted:
        raise ValueError("Kept notebook lacks exact ordered native execution counts")
    executed = re.findall(r"^Executing '([^']+)'\s*$", log, re.M)
    progress = [(int(a), int(b)) for a, b in re.findall(
        r"^\s*Cell (\d+)/(\d+): .*\.\.\.Done\s*$", log, re.M)]
    if executed != [Path(unit).stem + ".quarto_ipynb"] or progress != [(i, len(bodies)) for i in wanted]:
        raise ValueError("Successful execution log lacks exact unit/ordered cell completion")
    rendered, expected_stdout = [], []
    for ordinal, (body, cell) in enumerate(zip(bodies, cells, strict=True), 1):
        if not source_options_match(body, cell):
            raise ValueError(f"Kept notebook source/options differ at native cell {ordinal}")
        opts = {**defaults, **options(body)}
        if opts.get("eval", True) is not True or opts.get("cache", False) is not False:
            raise ValueError(f"Native cell {ordinal} was disabled/cached, not freshly executed")
        if not ast.parse(body).body:
            raise ValueError("Empty native cells cannot supply execution evidence")
        outputs = cell.get("outputs", [])
        if any(output.get("output_type") == "error" for output in outputs):
            raise ValueError(f"Kept notebook contains a native-cell error at {ordinal}")
        if opts.get("include", True) is False:
            continue  # Suppressed presentation, but execution/source checks above still apply.
        visible_outputs = []
        if opts.get("output", True) is not False:
            for output in outputs:
                if (output.get("output_type") == "stream" and output.get("name") == "stderr"
                        and opts.get("warning", True) is False):
                    continue
                visible_outputs.append(output)
                if output.get("output_type") == "stream" and output.get("name") == "stdout":
                    value = text(output.get("text", ""))
                    if value:
                        expected_stdout.append((ordinal, value))
        if opts.get("echo", True) is not False or visible_outputs:
            rendered.append(ordinal)
    if native_execution_ordinals(freeze_raw) != rendered:
        raise ValueError("Frozen rendered-cell coverage differs from executed notebook visibility")
    if collect_stdout(stdout_records(freeze_raw)) != collect_stdout(expected_stdout):
        raise ValueError("Frozen stdout differs from actual executed-notebook stdout")
    return {"native_ordinals": wanted, "rendered_ordinals": rendered}


def write_once(path: Path, source: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        safe_file(path, path.parent)
        if digest(path) != digest(source):
            raise ValueError(f"Execution source/evidence changed within one run: {path}")
    else:
        shutil.copy2(source, path)


def evidence_record(path: Path, provenance: Path) -> dict:
    return {"artifact": path.relative_to(provenance).as_posix(), "sha256": digest(path)}


def kept_notebook_path(work: Path, unit: str) -> Path:
    path = (work / unit).with_suffix(".quarto_ipynb")
    if list(path.parent.glob(path.name + "*")):
        raise ValueError(f"Stale retained notebook exists before fresh execution: {unit}")
    return path


def record_execution(work: Path, freeze: Path, provenance: Path, unit: str, fmt: str,
                     log: Path, kept_notebook: Path, specification: dict) -> dict:
    """Call immediately after successful render; retain raw proof before next format."""
    # Keep explicit-root aliases, but never resolve away an artifact symlink.
    kept_notebook = safe_file(kept_notebook, work)
    work, freeze, provenance = work.resolve(), freeze.resolve(), provenance.resolve()
    fmt = {"latex": "tex"}.get(fmt, fmt)
    if fmt not in {"html", "tex"}:
        raise ValueError("Unsupported execution format")
    stem = Path(unit).with_suffix("")
    source = safe_file(work / unit, work)
    config_source = safe_file(work / "_quarto.yml", work)
    safe_file(log, log.parent)
    destinations = {
        "source": provenance / "execution-sources" / unit,
        "notebook": provenance / "executed-notebooks" / stem / f"{fmt}.ipynb",
        "log": provenance / "execution-logs" / stem / f"{fmt}.log",
    }
    # Preserve original observations before auditing them. A failed audit must
    # not destroy the notebook that explains the failure when work is cleaned.
    write_once(provenance / "execution-sources/_quarto.yml", config_source)
    for kind, original in (("source", source), ("notebook", kept_notebook), ("log", log)):
        write_once(destinations[kind], original)
    if digest(source) != specification["source_sha256"]:
        raise ValueError("Executed source changed since the pre-execution plan")
    config = yaml.safe_load(config_source.read_text()) or {}
    raw = (freeze / stem / "execute-results" / f"{fmt}.json").read_text()
    safe_file(kept_notebook, work)
    checked = audit_execution_notebook(source.read_text(), json.loads(kept_notebook.read_text()),
                                       raw, log.read_text(), unit, config.get("execute", {}), specification)
    record = {"unit": unit, "format": fmt, **checked,
              **{kind: evidence_record(path, provenance) for kind, path in destinations.items()},
              "freeze_sha256": hashlib.sha256(raw.encode()).hexdigest()}
    # Only this newly generated, already archived intermediate is removed, so
    # the next format uses the same Quarto input/figure naming convention.
    kept_notebook.unlink()
    return record


def validate_coverage_manifest(manifest: dict, provenance: Path, plan: dict,
                               freeze_root: Path, source_files: dict[str, str]) -> list[str]:
    try:
        provenance, freeze_root = provenance.resolve(), freeze_root.resolve()
        if manifest.get("schema_version") != 1 or manifest.get("passed") is not True:
            raise ValueError("Missing/unsupported executed-notebook coverage manifest")
        def artifact(record: dict, expected: str) -> Path:
            if set(record) != {"artifact", "sha256"} or record["artifact"] != expected:
                raise ValueError("Unexpected execution-evidence artifact locator")
            path = safe_file(provenance / expected, provenance)
            if digest(path) != record["sha256"]:
                raise ValueError("Executed-notebook evidence checksum mismatch")
            return path
        config_path = artifact(manifest["config"], "execution-sources/_quarto.yml")
        if digest(config_path) != source_files.get("_quarto.yml"):
            raise ValueError("Execution defaults differ from authenticated source")
        defaults = (yaml.safe_load(config_path.read_text()) or {}).get("execute", {})
        formats = plan.get("formats")
        if formats != ["html", "tex"] and not (
                formats == ["html"] and plan.get("purpose") == "native-portability-html-only"):
            raise ValueError("Execution coverage requires canonical HTML/TeX or explicit HTML-only portability purpose")
        wanted = {(unit, fmt) for unit in plan["units"] for fmt in formats}
        observed = []
        expected_files = {"execution-sources/_quarto.yml"}
        for row in manifest["units"]:
            unit, fmt = row["unit"], row["format"]
            if (unit, fmt) not in wanted:
                raise ValueError("Unexpected execution evidence unit/format")
            observed.append((unit, fmt))
            stem = Path(unit).with_suffix("").as_posix()
            source_path = artifact(row["source"], "execution-sources/" + unit)
            notebook = artifact(row["notebook"], f"executed-notebooks/{stem}/{fmt}.ipynb")
            log = artifact(row["log"], f"execution-logs/{stem}/{fmt}.log")
            expected_files.update(record["artifact"] for record in (row["source"], row["notebook"], row["log"]))
            specification = plan["units"][unit]
            if digest(source_path) != specification["source_sha256"] or digest(source_path) != source_files.get(unit):
                raise ValueError("Original executed source differs from authenticated plan")
            raw_path = freeze_root / stem / "execute-results" / f"{fmt}.json"
            if digest(raw_path) != row["freeze_sha256"]:
                raise ValueError("Coverage evidence belongs to a different frozen result")
            checked = audit_execution_notebook(source_path.read_text(), json.loads(notebook.read_text()),
                                               raw_path.read_text(), log.read_text(), unit, defaults, specification)
            if any(row.get(key) != value for key, value in checked.items()):
                raise ValueError("Claimed native/rendered coverage differs from executed evidence")
        if len(observed) != len(wanted) or set(observed) != wanted:
            raise ValueError("Executed notebooks do not cover every planned unit/format exactly once")
        actual_files = {path.relative_to(provenance).as_posix()
                        for directory in ("execution-sources", "executed-notebooks", "execution-logs")
                        for path in (provenance / directory).rglob("*") if path.is_file() or path.is_symlink()}
        if actual_files != expected_files:
            raise ValueError("Physical execution evidence inventory differs from the manifest")
    except (ValueError, KeyError, TypeError, OSError) as error:
        return [str(error)]
    return []


def build_coverage_manifest(provenance: Path, plan: dict, freeze: Path,
                            source_files: dict[str, str], records: list[dict]) -> dict:
    manifest = {"schema_version": 1, "passed": True,
                "config": evidence_record(provenance / "execution-sources/_quarto.yml", provenance),
                "units": sorted(records, key=lambda row: (row["unit"], row["format"]))}
    errors = validate_coverage_manifest(manifest, provenance, plan, freeze, source_files)
    if errors:
        raise ValueError("Execution coverage validation failed: " + "; ".join(errors))
    return manifest
