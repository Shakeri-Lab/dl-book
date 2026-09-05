"""Execute only the four silent export clauses on tiny retained-value fixtures."""
import ast
import contextlib
import copy
import io
import json
import os
from pathlib import Path
import re
import tempfile
import unittest
from unittest.mock import patch

import torch

from audit_paired_evidence import DEFAULT_PLAN, ROOT, audit_evidence, validate_payload
from date_study_schema import parameter_counts


def export_code(path):
    for body in re.findall(r"```\{python\}\n(.*?)\n```", path.read_text(), re.S):
        if '"DLBOOK_PAIRED_EVIDENCE_DIR"' not in body:
            continue
        parsed = ast.parse(body)
        chosen = [node for node in parsed.body if (
            isinstance(node, (ast.Import, ast.ImportFrom)) and any(
                alias.asname and alias.asname.startswith(("_evidence", "_Evidence")) for alias in node.names)
            or isinstance(node, ast.If) and isinstance(node.test, ast.NamedExpr)
            and isinstance(node.test.target, ast.Name) and node.test.target.id == "_evidence_dir"
        )]
        return compile(ast.Module(body=chosen, type_ignores=[]), str(path), "exec")
    raise AssertionError("Missing source-authored export")


def retained(study):
    if study == "ch08":
        return dict(X_tr=range(1000), X_val=range(200), X_test=range(600), X_dev=range(1200),
                    shifts=list(range(5)), acc_mlp=[.8]*5, acc_cnn=[.7]*5,
                    fit_metrics={"MLP": (.9,.8), "LeNet": (.8,.7)},
                    holdout_metrics={"MLP": (.8,.5), "LeNet": (.8,.6)})
    if study in {"ch11", "ch13"}:
        seeds = list(range(6050, 6055))
        epochs = [2,4,6,8,12,16,20,25]
        runs = [(None, {epoch:.5 for epoch in epochs},
                 {"initialization":"a"*64, "schedule":"b"*64}) for _ in seeds]
        shared = dict(study_seeds=seeds, train_pairs=range(8000), test_unamb=range(437),
                      error_rows=[[1,2] for _ in seeds], paired_rows=[[1-1/437,1-2/437] for _ in seeds])
        if study == "ch11":
            return dict(shared,cps=epochs,tf_runs=runs,fr_runs=runs,naive_errors=9)
        fixed, attention = parameter_counts()
        return dict(shared, checkpoints=epochs, baseline_runs=runs, attention_runs=runs,
                    valid_fixed=range(400),year_mass=[.9]*1600,year_top1=[1]*1600,
                    row_errors=[1e-7]*400,baseline_params=fixed,attention_params=attention)
    metrics = ["noise MSE","oracle MSE","mean","standard deviation","positive mass","central mass","Wasserstein-1"]
    return dict(torch=torch,diffusion_steps=100,diffusion_results={
        condition:[{metric:(i+1)/10 for metric in metrics} for i in range(5)]
        for condition in ("time conditioned","no time")})


class EvidenceTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.output = Path(self.tmp.name)
        self.plan = json.loads(DEFAULT_PLAN.read_text())
        previous = torch.get_default_dtype()
        torch.set_default_dtype(torch.float64)
        self.addCleanup(torch.set_default_dtype, previous)

    def emit_all(self):
        for study, specification in self.plan["studies"].items():
            source = ROOT / specification["unit"]
            code = export_code(source)
            for fmt in ("latex", "html"):
                directory = self.output / Path(specification["unit"]).with_suffix("") / fmt
                before = torch.get_rng_state().clone()
                stream = io.StringIO()
                with patch.dict(os.environ, {"DLBOOK_PAIRED_EVIDENCE_DIR": str(directory),
                                              "DLBOOK_EXECUTION_FORMAT":fmt}), contextlib.redirect_stdout(stream):
                    exec(code, retained(study))
                self.assertEqual(stream.getvalue(), "")
                self.assertTrue(torch.equal(before,torch.get_rng_state()))

    def test_actual_export_clauses_are_silent_rng_inert_and_validate(self):
        self.emit_all()
        result = audit_evidence(self.output, ROOT)
        self.assertEqual(len(result["files_sha256"]),8)
        self.assertEqual(len(result["source_sha256"]),4)

    def test_missing_or_extra_sidecar_fails(self):
        self.emit_all()
        extra = self.output / "unexpected.json"
        extra.write_text("{}")
        with self.assertRaisesRegex(ValueError,"Unexpected/missing"):
            audit_evidence(self.output,ROOT)

    def test_crossformat_metric_drift_fails(self):
        self.emit_all()
        path = self.output / "chapters/part2/08-cnn/html/ch08.json"
        payload = json.loads(path.read_text())
        payload["records"][0]["value"] += .01
        path.write_text(json.dumps(payload))
        with self.assertRaisesRegex(ValueError,"Cross-format"):
            audit_evidence(self.output,ROOT)

    def test_missing_seed_protocol_drift_and_duplicates_fail(self):
        self.emit_all()
        path = self.output / "chapters/part3/11-encoder-decoder/html/ch11.json"
        original = json.loads(path.read_text())
        for mutation in (lambda x:x["seed_set"].pop(), lambda x:x["records"].append(x["records"][0]),
                         lambda x:x["protocol"].update(test_n=438)):
            payload = copy.deepcopy(original)
            mutation(payload)
            with self.assertRaises(ValueError):
                validate_payload(payload,self.plan["studies"]["ch11"],"ch11","html")

    def test_row_identity_is_not_relaxed(self):
        self.emit_all()
        path = self.output / "chapters/part4/13-attention/html/ch13.json"
        payload = json.loads(path.read_text())
        payload["routing"]["row_errors"][0] = 1e-6
        with self.assertRaisesRegex(ValueError,"Normalization identity"):
            validate_payload(payload,self.plan["studies"]["ch13"],"ch13","html")

    def test_absent_export_environment_is_a_noop(self):
        for specification in self.plan["studies"].values():
            with patch.dict(os.environ, {}, clear=True):
                exec(export_code(ROOT/specification["unit"]), {})
        self.assertFalse(list(self.output.rglob("*.json")))


if __name__ == "__main__":
    unittest.main()
