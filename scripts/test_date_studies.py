#!/usr/bin/env python3
"""Small protocol checks, not executions of the canonical 25-epoch studies."""
from __future__ import annotations

import ast
import contextlib
import io
from pathlib import Path
import re
import unittest

import torch

from audit_date_study_stdout import parameter_counts


ROOT = Path(__file__).resolve().parents[1]
CH11 = ROOT / "chapters/part3/11-encoder-decoder.qmd"
CH13 = ROOT / "chapters/part4/13-attention.qmd"


def cells(path: Path) -> dict[str, str]:
    result = {}
    for source in re.findall(r"^```\{python\}\n(.*?)^```", path.read_text(),
                             flags=re.MULTILINE | re.DOTALL):
        label = re.search(r"^#\| label: (.+)$", source, re.MULTILINE)
        if label:
            result[label[1]] = source
    return result


def definitions(source: str) -> dict[str, ast.AST]:
    return {node.name: node for node in ast.parse(source).body
            if isinstance(node, (ast.FunctionDef, ast.ClassDef))}


def load_definitions(source: str, namespace: dict) -> None:
    tree = ast.Module(body=list(definitions(source).values()), type_ignores=[])
    exec(compile(tree, "<canonical date definitions>", "exec"), namespace)


class DateStudyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        torch.set_num_threads(1)
        cls.c11, cls.c13 = cells(CH11), cells(CH13)
        cls.n11, cls.n13 = {}, {}
        with contextlib.redirect_stdout(io.StringIO()):
            exec(cls.c11["date-data"], cls.n11)
            exec(cls.c13["date-data-rematch"], cls.n13)
        load_definitions(cls.c11["seq2seq-model"], cls.n11)
        load_definitions(cls.c11["padding-experiment"], cls.n11)
        load_definitions(cls.c13["attentive-seq2seq"], cls.n13)
        load_definitions(cls.c13["fixed-state-rematch"], cls.n13)

    def test_identical_data_and_fixed_state_mechanisms(self):
        for name in ("pairs", "train_pairs", "valid_pairs", "test_pairs",
                     "src_stoi", "tgt_stoi", "PAD", "BOS", "EOS"):
            self.assertEqual(self.n11[name], self.n13[name], name)
        self.assertEqual(len(self.n11["pairs"]), 9000)
        self.assertEqual(len(self.n11["unambiguous"](self.n11["test_pairs"])), 437)
        one = definitions("\n".join(self.c11.values()))
        other = definitions("\n".join(self.c13.values()))
        for name in ("make_date", "Seq2Seq", "batchify", "unambiguous",
                     "translate", "exact_match"):
            self.assertEqual(ast.dump(one[name]), ast.dump(other[name]), name)

    def test_stdout_parameter_contract_matches_the_actual_models(self):
        ns = self.n13
        actual = tuple(sum(parameter.numel() for parameter in
                           ns[name](ns["V_src"], ns["V_tgt"]).parameters())
                       for name in ("Seq2Seq", "AttentiveSeq2Seq"))
        self.assertEqual(parameter_counts(), actual)

    def miniature(self, original: dict) -> dict:
        # Function globals must belong to this namespace, not the full-study fixture.
        ns = dict(original)
        ns["train_pairs"] = original["train_pairs"][:24]
        ns["valid_unamb"] = original["unambiguous"](original["valid_pairs"])[:4]
        ns["valid_fixed"] = ns["valid_unamb"]
        return ns

    def test_tf_baseline_training_is_identical_between_chapters(self):
        left, right = self.miniature(self.n11), self.miniature(self.n13)
        load_definitions(self.c11["padding-experiment"], left)
        load_definitions(self.c13["fixed-state-rematch"], right)
        a = left["train_seq2seq"](seed=6050, epochs=1, batch=12, checkpoints=(1,))
        b = right["train_date_model"](
            right["Seq2Seq"], right["exact_match"], seed=6050,
            epochs=1, batch=12, checkpoints=(1,))
        self.assertEqual(a[1:], b[1:])
        for key, value in a[0].state_dict().items():
            self.assertTrue(torch.equal(value, b[0].state_dict()[key]), key)

    def test_tf_fr_pair_weights_and_schedule_but_change_training(self):
        ns = self.miniature(self.n11)
        load_definitions(self.c11["padding-experiment"], ns)
        for seed in (6050, 6051):
            tf = ns["train_seq2seq"]("tf", seed=seed, epochs=1, batch=12)
            fr = ns["train_seq2seq"]("fr", seed=seed, epochs=1, batch=12)
            self.assertEqual(tf[2], fr[2])
            self.assertTrue(any(not torch.equal(a, b) for a, b
                                in zip(tf[0].parameters(), fr[0].parameters())))

    def test_attention_matches_schedule_not_parameterization(self):
        ns = self.miniature(self.n13)
        load_definitions(self.c13["attentive-seq2seq"], ns)
        load_definitions(self.c13["fixed-state-rematch"], ns)
        fixed = ns["train_date_model"](
            ns["Seq2Seq"], ns["exact_match"], 6050, epochs=1, batch=12)
        attention = ns["train_date_model"](
            ns["AttentiveSeq2Seq"], ns["attention_exact_match"],
            6050, epochs=1, batch=12)
        self.assertEqual(fixed[2]["schedule"], attention[2]["schedule"])
        self.assertNotEqual(fixed[2]["initialization"],
                            attention[2]["initialization"])
        outputs = ns["greedy_batch"](attention[0], ns["valid_fixed"])
        self.assertEqual(len(outputs), 4)
        for source, _, weights in outputs:
            self.assertEqual(weights.shape, (12, len(source)))
            self.assertLess((weights.sum(1) - 1).abs().max().item(), 1e-6)

    def test_five_seed_final_budget_and_no_pasted_baseline(self):
        for source in (self.c11["teacher-forcing-free-running-audit"],
                       self.c13["attention-date-training"]):
            self.assertIn("study_seeds = tuple(range(6050, 6055))", source)
            self.assertIn("std(correction=1)", source)
            self.assertIn("/437", source)
            self.assertIn("paired_pp", source)
            self.assertIn("error_rows.append(", source)
            self.assertIn("test_errors = torch.tensor(error_rows, dtype=torch.int64)",
                          source)
            self.assertIn("counts.mean():.2f", source)
            self.assertIn("counts.std(correction=1):.2f", source)
            self.assertNotIn("round((1 -", source)
        for source, function in ((self.c11["padding-experiment"], "train_seq2seq"),
                                 (self.c13["fixed-state-rematch"],
                                  "train_date_model")):
            node = definitions(source)[function]
            defaults = dict(zip([arg.arg for arg in node.args.args][-len(
                node.args.defaults):], node.args.defaults))
            self.assertEqual(ast.literal_eval(defaults["epochs"]), 25)
            self.assertEqual(ast.literal_eval(defaults["batch"]), 128)
            self.assertIn("manual_seed(90_000 + seed)", source)
        self.assertNotIn("baseline_curve = {", self.c13["attention-date-training"])
        self.assertNotIn("93.1", CH13.read_text())


if __name__ == "__main__":
    unittest.main()
