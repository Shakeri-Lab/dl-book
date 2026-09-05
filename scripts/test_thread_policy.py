"""Guard authored thread budgets without executing the training studies."""

from __future__ import annotations

import ast
import os
from pathlib import Path
import re
from types import SimpleNamespace
import tempfile
import unittest
from unittest.mock import patch

from audit_book_contract import thread_budget_consumer_errors


ROOT = Path(__file__).resolve().parents[1]
FENCE = re.compile(r"^```\{python\}\s*\n(.*?)^```\s*$", re.M | re.S)
BUDGETS = {
    "interludes/learning-by-experiment.qmd": 4,
    "interludes/making-pca-learnable.qmd": 6,
    "part4/14-self-attention-transformer.qmd": 4,
    "part4/15-bert-pretraining.qmd": 4,
    "part4/16-vit-scaling.qmd": 6,
    "part5/17-peft-quantization.qmd": 6,
    "part5/19-generative.qmd": 6,
    "part5/20-multimodal.qmd": 6,
}


def thread_calls(path: Path) -> list[ast.Call]:
    calls = []
    for cell in FENCE.findall(path.read_text()):
        for node in ast.walk(ast.parse(cell)):
            if (
                isinstance(node, ast.Call)
                and isinstance(node.func, ast.Attribute)
                and isinstance(node.func.value, ast.Name)
                and node.func.value.id == "torch"
                and node.func.attr == "set_num_threads"
            ):
                calls.append(node)
    return calls


class ThreadPolicyTests(unittest.TestCase):
    def consumer_fixture(self, root: Path) -> None:
        for relative in [*BUDGETS, "part5/18-alignment.qmd"]:
            path = root / "chapters" / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text('os.environ.get("DLBOOK_TORCH_NUM_THREADS", "6")\n')
        (root / "index.qmd").write_text("# Preface\n")

    def test_consumer_inventory_ignores_retained_source_copies(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.consumer_fixture(root)
            self.assertEqual(thread_budget_consumer_errors(root), [])
            for relative in (
                "build/source-a/chapters/part5/18-alignment.qmd",
                "sources/diagnostic-copy.qmd",
                "_book/retained-source.qmd",
            ):
                path = root / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text('os.environ.get("DLBOOK_TORCH_NUM_THREADS", "6")\n')
            self.assertEqual(thread_budget_consumer_errors(root), [])

    def test_new_authored_consumer_still_fails(self):
        for relative in ("chapters/part1/extra.qmd", "index.qmd"):
            with self.subTest(relative=relative), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                self.consumer_fixture(root)
                path = root / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text('os.environ.get("DLBOOK_TORCH_NUM_THREADS", "6")\n')
                self.assertEqual(thread_budget_consumer_errors(root), [
                    "authored thread-budget consumers differ from the explicit runtime policy"
                ])

    def test_missing_expected_consumer_still_fails(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.consumer_fixture(root)
            (root / "chapters/part5/18-alignment.qmd").write_text("# Alignment\n")
            self.assertTrue(thread_budget_consumer_errors(root))

    def test_budget_defaults_and_explicit_overrides(self):
        for relative, default in BUDGETS.items():
            path = ROOT / "chapters" / relative
            calls = thread_calls(path)
            candidates = [
                call for call in calls
                if "DLBOOK_TORCH_NUM_THREADS" in ast.unparse(call)
            ]
            self.assertEqual(len(candidates), 1, relative)
            expression = ast.Expression(candidates[0])
            program = compile(expression, relative, "eval")
            for override, expected in ((None, default), ("1", 1), ("6", 6)):
                with self.subTest(chapter=relative, override=override):
                    observed = []
                    fake_torch = SimpleNamespace(set_num_threads=observed.append)
                    with patch.dict(os.environ, {}, clear=True):
                        if override is not None:
                            os.environ["DLBOOK_TORCH_NUM_THREADS"] = override
                        eval(program, {"os": os, "torch": fake_torch})
                    self.assertEqual(observed, [expected])

    def test_no_unconditional_multithread_budget_survives(self):
        for path in (ROOT / "chapters").rglob("*.qmd"):
            for call in thread_calls(path):
                if call.args and isinstance(call.args[0], ast.Constant):
                    self.assertEqual(call.args[0].value, 1, str(path))

    def test_diffusion_restores_the_entering_budget(self):
        path = ROOT / "chapters/part5/19-generative.qmd"
        text = path.read_text()
        self.assertIn(
            "_diffusion_previous_threads = torch.get_num_threads()\n"
            "torch.set_num_threads(1)", text,
        )
        self.assertEqual(
            text.count("torch.set_num_threads(_diffusion_previous_threads)"), 1
        )


if __name__ == "__main__":
    unittest.main()
