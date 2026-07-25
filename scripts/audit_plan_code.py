#!/usr/bin/env python3
"""Audit the book-wide Plan → Code authoring contract."""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass, field
from pathlib import Path


DIV_OPEN_RE = re.compile(r"^(:{3,})\s+\{([^}]*)\}\s*$")
DIV_CLOSE_RE = re.compile(r"^(:{3,})\s*$")
CODE_OPEN_RE = re.compile(r"^```(.*)$")
STEP_RE = re.compile(r"^(\d+)\.\s+")
MARKER_RE = re.compile(r"#.*?((?:\[\d+\])+)")
INCLUDE_RE = re.compile(r'book-include="([^"]+)"')
START_RE = re.compile(r"start-line=(\d+)")
END_RE = re.compile(r"end-line=(\d+)")


@dataclass
class Div:
    fence: str
    classes: set[str]
    line: int
    steps: list[int] = field(default_factory=list)
    code_surfaces: int = 0


def marker_numbers(source: str) -> set[int]:
    numbers: set[int] = set()
    for marker in MARKER_RE.findall(source):
        numbers.update(int(value) for value in re.findall(r"\[(\d+)\]", marker))
    return numbers


def included_source(path: Path, opener: str) -> str:
    include = INCLUDE_RE.search(opener)
    if include is None:
        return ""
    source_path = (path.parent / include.group(1)).resolve()
    if not source_path.exists():
        source_path = Path(include.group(1)).resolve()
    lines = source_path.read_text().splitlines()
    start_match = START_RE.search(opener)
    end_match = END_RE.search(opener)
    start = int(start_match.group(1)) if start_match else 1
    end = int(end_match.group(1)) if end_match else len(lines)
    return "\n".join(lines[start - 1 : end])


def audit(path: Path) -> tuple[int, int, list[str]]:
    lines = path.read_text().splitlines()
    stack: list[Div] = []
    completed_panels: list[Div] = []
    visible = 0
    hidden = 0
    errors: list[str] = []
    index = 0

    while index < len(lines):
        line = lines[index]
        div_open = DIV_OPEN_RE.match(line)
        if div_open:
            classes = {
                token.removeprefix(".")
                for token in div_open.group(2).split()
                if token.startswith(".")
            }
            stack.append(Div(div_open.group(1), classes, index + 1))
            index += 1
            continue

        div_close = DIV_CLOSE_RE.match(line)
        if div_close:
            for position in range(len(stack) - 1, -1, -1):
                if stack[position].fence == div_close.group(1):
                    closed = stack.pop(position)
                    if "plan-code" in closed.classes:
                        completed_panels.append(closed)
                    break
            index += 1
            continue

        code_open = CODE_OPEN_RE.match(line)
        if code_open:
            opener = code_open.group(1).strip()
            close = index + 1
            while close < len(lines) and lines[close] != "```":
                close += 1
            if close == len(lines):
                errors.append(f"{path}:{index + 1}: unclosed code fence")
                break

            body = "\n".join(lines[index + 1 : close])
            is_exec = opener == "{python}"
            is_include = opener.startswith("{.python ") and "book-include=" in opener
            is_static_python = opener in {"python", "{.python}"}
            if is_exec or is_include or is_static_python:
                panel = next(
                    (item for item in reversed(stack) if "plan-code" in item.classes),
                    None,
                )
                is_hidden = bool(
                    re.search(r"^#\|\s*echo:\s*false\s*$", body, re.MULTILINE)
                )
                if is_exec and is_hidden:
                    hidden += 1
                    if panel is not None:
                        errors.append(
                            f"{path}:{index + 1}: hidden support cell must not use a panel"
                        )
                else:
                    visible += 1
                    if is_static_python:
                        errors.append(
                            f"{path}:{index + 1}: printed Python must be executable or included"
                        )
                    if panel is None:
                        errors.append(
                            f"{path}:{index + 1}: visible Python is outside a plan-code panel"
                        )
                    else:
                        panel.code_surfaces += 1
                        expected = set(range(1, len(panel.steps) + 1))
                        source = included_source(path, opener) if is_include else body
                        actual = marker_numbers(source)
                        if panel.steps != list(range(1, len(panel.steps) + 1)):
                            errors.append(
                                f"{path}:{panel.line}: plan steps are not consecutive from 1"
                            )
                        if len(panel.steps) > 6:
                            errors.append(
                                f"{path}:{panel.line}: plan exceeds the six-step ceiling"
                            )
                        if actual != expected:
                            errors.append(
                                f"{path}:{index + 1}: markers {sorted(actual)} "
                                f"do not match plan {sorted(expected)}"
                            )
                        source_lines = source.splitlines()
                        if (
                            len(source_lines) > 35
                            and "plan-code-wide" not in panel.classes
                        ):
                            errors.append(
                                f"{path}:{panel.line}: {len(source_lines)}-line "
                                "surface needs plan-code-wide"
                            )
                        if is_exec and not re.search(
                            r"^#\|\s*code-fold:\s*false\s*$", body, re.MULTILINE
                        ):
                            errors.append(
                                f"{path}:{index + 1}: panel code must set code-fold: false"
                            )
            index = close + 1
            continue

        step = STEP_RE.match(line)
        if step:
            panel = next(
                (item for item in reversed(stack) if "plan-code" in item.classes),
                None,
            )
            in_plan = any("plan" in item.classes for item in stack)
            if panel is not None and in_plan:
                panel.steps.append(int(step.group(1)))
        index += 1

    for panel in completed_panels:
        if panel.code_surfaces != 1:
            errors.append(
                f"{path}:{panel.line}: panel contains {panel.code_surfaces} code surfaces"
            )
    return visible, hidden, errors


def main() -> None:
    total_visible = 0
    total_hidden = 0
    errors: list[str] = []
    for path in sorted(Path("chapters").rglob("*.qmd")):
        visible, hidden, path_errors = audit(path)
        total_visible += visible
        total_hidden += hidden
        errors.extend(path_errors)

    if errors:
        print("\n".join(errors), file=sys.stderr)
        print(
            f"FAILED: {len(errors)} Plan → Code contract violation(s)",
            file=sys.stderr,
        )
        raise SystemExit(1)
    print(
        f"PASS: {total_visible} learner-visible Python surfaces use Plan → Code; "
        f"{total_hidden} execution-only cells are exempt"
    )


if __name__ == "__main__":
    main()
