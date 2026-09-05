"""Small synthetic evidence fixtures only; never execute a training cell."""
from copy import deepcopy
from decimal import Decimal
import json
from pathlib import Path
import statistics
import tempfile
import unittest

from audit_paired_evidence import audit_evidence
from date_study_schema import parameter_counts
from freeze_provenance import freeze_inventory, json_digest, sha256, write_json
from report_paired_runtime import (ROOT, compare_bundles, compare_study, field, load_bundle,
                                   markdown_report, sample_sd)
from test_freeze_provenance import execution, fingerprint

PLAN = json.loads((ROOT / "docs/paired-evidence-plan.json").read_text())
PROVENANCE = {"computation_sha256": "a" * 64, "canonical_fingerprint_sha256": "b" * 64,
              "local_fingerprint_sha256": "c" * 64}


def payload(study, fmt="html"):
    spec = PLAN["studies"][study]
    records = []
    for index, seed in enumerate(spec["seeds"]):
        for arm, condition in enumerate(spec["conditions"]):
            for metric in spec["metrics"]:
                value = .5
                if metric == "test_errors":
                    value = 1 + index + arm
                elif metric == "test_accuracy":
                    value = 1 - (1 + index + arm) / 437
                elif metric.startswith("validation_epoch_"):
                    value = .5 + .01 * (index + arm)
                elif study == "ch19":
                    value = .1 if metric == "oracle MSE" else .1 + .02 * (index + arm)
                records.append(dict(seed=seed, condition=condition, metric=metric, value=value))
    result = dict(schema_version=1, study=study, unit=spec["unit"], format=fmt,
                  seed_set=deepcopy(spec["seeds"]), protocol=deepcopy(spec["protocol"]), records=records)
    if study in {"ch11", "ch13"}:
        result["identities"] = [dict(seed=seed, condition=condition, initialization="a"*64, schedule="b"*64)
                                for seed in spec["seeds"] for condition in spec["conditions"]]
    if study == "ch11":
        result["padding_witness"] = dict(seed=6050, naive_errors=9)
    if study == "ch13":
        fixed, attention = parameter_counts()
        result["parameters"] = dict(fixed=fixed, attention=attention)
        result["routing"] = dict(seed=6050, year_mass=[.9]*1600,
                                 top_key_in_region=[1]*1600, row_errors=[1e-7]*400)
    if study == "ch19":
        result["aggregates"] = []
        for condition in spec["conditions"]:
            for metric in spec["metrics"]:
                values = [row["value"] for row in records if row["condition"] == condition and row["metric"] == metric]
                result["aggregates"].append(dict(condition=condition, metric=metric,
                                                  mean=statistics.mean(values), sample_sd=statistics.stdev(values)))
    return result


def change_record(document, seed, condition, metric, value):
    for row in document["records"]:
        if (row["seed"], row["condition"], row["metric"]) == (seed, condition, metric):
            row["value"] = value
            return
    raise AssertionError("No such record")


class PairedStatisticsTests(unittest.TestCase):
    def compare(self, study, left=None, right=None):
        left = left or payload(study)
        return compare_study(study, PLAN["studies"][study], left, right or deepcopy(left), PROVENANCE)

    def test_ch08_fraction_to_percentage_points_one_seed_only(self):
        right = payload("ch08")
        change_record(right, 6050, "MLP", "test_shift_2_accuracy", .513)
        result = self.compare("ch08", right=right)
        item = next(x for x in result["fields"] if x["name"] == "MLP / test_shift_2_accuracy")
        self.assertEqual(Decimal(item["absolute_difference"]), Decimal("1.3"))
        self.assertEqual(item["report_only_candidate_atol"], "2.6")
        self.assertEqual(item["printed_quantum"], "0.1")
        self.assertEqual(item["seeds"], [6050])
        self.assertEqual(len(result["fields"]), 18)
        self.assertTrue(all(x["statistic"] == "single_seed_value" for x in result["fields"]))

    def test_sample_sd_uses_actual_n_minus_one(self):
        self.assertEqual(sample_sd([Decimal(1), Decimal(2), Decimal(3)]), Decimal(1))
        with self.assertRaisesRegex(ValueError, "actual replicate"):
            sample_sd([Decimal(1)])

    def test_integer_error_and_derived_accuracy_are_distinct(self):
        right = payload("ch11")
        change_record(right, 6050, "TF", "test_errors", 2)
        change_record(right, 6050, "TF", "test_accuracy", 1 - 2/437)
        result = self.compare("ch11", right=right)
        error = next(x for x in result["fields"] if x["name"] == "TF / test_errors" and x["seeds"] == [6050])
        self.assertEqual(error["report_only_candidate_atol"], "2")
        accuracy = next(x for x in result["fields"] if x["name"] == "TF / test_accuracy" and x["seeds"] == [6050])
        self.assertEqual(accuracy["report_only_candidate_atol"], "0.46")
        aggregate = next(x for x in result["fields"] if x["name"] == "TF / test_errors" and x["statistic"] == "mean")
        self.assertEqual(aggregate["report_only_candidate_atol"], "0.40")

    def test_contrasts_and_curves_have_their_own_precision(self):
        result = self.compare("ch13")
        contrast = [x for x in result["fields"] if x["name"].startswith("attention minus fixed")]
        self.assertEqual(len(contrast), 7)
        self.assertTrue(all(x["printed_quantum"] == "0.001" for x in contrast))
        curves = [x for x in result["fields"] if "validation_epoch_" in x["name"]]
        self.assertEqual(len(curves), 32)
        self.assertTrue(all(x["printed_quantum"] == "0.01" for x in curves))

    def test_cross_runtime_initialization_or_schedule_mismatch_is_recorded(self):
        for key in ("initialization", "schedule"):
            right = payload("ch11")
            for row in right["identities"]:
                row[key] = "c" * 64
            result = self.compare("ch11", right=right)
            scope = result["realized_input_comparison"]
            self.assertEqual(scope["scope"], "same-seed end-to-end runtime difference")
            self.assertFalse(scope["all_recorded_realizations_identical"])
            self.assertEqual(len(scope["observations"]),10)
            self.assertTrue(all(not row[f"{key}_identical"] for row in scope["observations"]))
            self.assertIn("not a numerical-kernel-only",scope["interpretation"])
            self.assertFalse(result["proposals_applied"])

    def test_matching_recorded_inputs_does_not_claim_isolated_roundoff(self):
        result = self.compare("ch13")
        scope = result["realized_input_comparison"]
        self.assertTrue(scope["all_recorded_realizations_identical"])
        self.assertIn("does not by itself isolate roundoff",scope["interpretation"])
        for study in ("ch08","ch19"):
            scope = self.compare(study)["realized_input_comparison"]
            self.assertIsNone(scope["all_recorded_realizations_identical"])
            self.assertFalse(scope["realized_initialization_and_schedule_recorded"])

    def test_within_runtime_tf_fr_mismatch_still_fails(self):
        for key in ("initialization","schedule"):
            right = payload("ch11")
            right["identities"][0][key] = "c"*64
            with self.assertRaisesRegex(ValueError,"Unpaired"):
                self.compare("ch11",right=right)

    def test_ch13_routing_is_one_seed_with_1600_observations(self):
        right = payload("ch13")
        right["routing"]["top_key_in_region"][0] = 0
        result = self.compare("ch13", right=right)
        item = next(x for x in result["fields"] if x["name"] == "routing / top_key_in_region")
        self.assertEqual(Decimal(item["absolute_difference"]), Decimal("0.0625"))
        self.assertEqual(item["report_only_candidate_atol"], "0.125")
        self.assertEqual(item["seeds"], [6050])

    def test_row_identity_is_strict_not_an_argmax_tolerance(self):
        right = payload("ch13")
        right["routing"]["row_errors"][0] = 1e-6
        with self.assertRaisesRegex(ValueError, "Normalization identity"):
            self.compare("ch13", right=right)
        result = self.compare("ch13")
        item = next(x for x in result["fields"] if x["name"] == "routing / row error")
        self.assertIsNone(item["report_only_candidate_atol"])
        self.assertEqual(item["existing_gate_retained"], "0.000001")

    def test_ch19_uses_retained_aggregate_not_maximum_seed_drift(self):
        left, right = payload("ch19"), payload("ch19")
        # Opposed same-seed movement cancels in the printed mean. It changes SD.
        selected = [row for row in right["records"] if row["condition"] == "no time" and row["metric"] == "mean"]
        selected[0]["value"] += .01
        selected[-1]["value"] -= .01
        values = [row["value"] for row in selected]
        aggregate = next(x for x in right["aggregates"] if x["condition"] == "no time" and x["metric"] == "mean")
        aggregate.update(mean=statistics.mean(values), sample_sd=statistics.stdev(values))
        # This sub-ulp-scale perturbation remains inside the retention sanity
        # check but proves the report reads saved aggregates instead of redoing them.
        aggregate["mean"] += 1e-15
        result = self.compare("ch19", left, right)
        item = next(x for x in result["fields"] if x["name"] == "no time / mean" and x["statistic"] == "mean")
        self.assertEqual(item["local"], str(aggregate["mean"]))
        self.assertEqual(Decimal(item["report_only_candidate_atol"]), Decimal("0.000000001"))
        raw = result["raw_seed_pairs"]["no time / mean"]
        self.assertGreater(Decimal(raw["max_absolute_paired_difference"]), Decimal("0.009"))
        self.assertFalse(raw["bound_proposed"])
        self.assertEqual(len(raw["pairs"]), 5)

    def test_oracle_sd_has_no_candidate_and_existing_gate_is_not_written(self):
        result = self.compare("ch19")
        oracle = [x for x in result["fields"] if "oracle MSE" in x["name"] and x["statistic"] == "sample_sd"]
        self.assertTrue(all(x["report_only_candidate_atol"] is None for x in oracle))
        self.assertTrue(all(x["existing_gate_retained"] == "0.000002" for x in result["fields"]))
        self.assertFalse(result["proposals_applied"])

    def test_oracle_identity_is_not_a_seed_variability_allowance(self):
        right = payload("ch19")
        change_record(right,6050,"no time","oracle MSE",.10001)
        values = [row["value"] for row in right["records"] if row["condition"] == "no time" and row["metric"] == "oracle MSE"]
        aggregate = next(row for row in right["aggregates"] if row["condition"] == "no time" and row["metric"] == "oracle MSE")
        aggregate.update(mean=statistics.mean(values),sample_sd=statistics.stdev(values))
        with self.assertRaisesRegex(ValueError,"Fixed-evaluation oracle"):
            self.compare("ch19",right=right)

    def test_rounding_is_upward_and_large_proposal_does_not_change_gate(self):
        item = field("x", "0", "0.0000020001", statistic="mean", unit="MSE", precision=9,
                     population="fixture", seeds=[6050], origin="fixture", existing_gate="0.000002")
        self.assertEqual(item["report_only_candidate_atol"], "0.000004001")
        self.assertTrue(item["candidate_exceeds_existing_gate"])
        self.assertFalse(item["applied"])


class PairedBundleTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.source = self.root / "source"
        self.plan_path = self.source / "docs/paired-evidence-plan.json"
        write_json(self.plan_path, PLAN)
        for spec in PLAN["studies"].values():
            path = self.source / spec["unit"]
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(f'```{{python}}\n#| label: {spec["export_cell"]}\nprint("fixture")\n```\n')
        self.left = self.make_bundle("linux", "canonical")
        self.right = self.make_bundle("mac1", "local")

    def make_bundle(self, name, kind):
        bundle = self.root / name
        inputs = {spec["unit"]: sha256(self.source/spec["unit"]) for spec in PLAN["studies"].values()}
        inputs.update({"docs/paired-evidence-plan.json": sha256(self.plan_path),
                       "container/Dockerfile": "b"*64, "container/requirements-linux-amd64.lock": "c"*64})
        units = {}
        for study, spec in PLAN["studies"].items():
            unit = spec["unit"]
            units[unit] = dict(source_sha256=inputs[unit], native_cells_sha256=["e"*64], included_sources_sha256={})
            for fmt in ("html", "tex"):
                write_json(bundle / "_freeze" / Path(unit).with_suffix("") / "execute-results" / f"{fmt}.json", execution())
            for fmt in ("html", "latex"):
                write_json(bundle / "provenance/paired-evidence" / Path(unit).with_suffix("") / fmt / f"{study}.json", payload(study,fmt))
        document = fingerprint(bundle/"_freeze",name)
        document["kind"] = kind
        document["source"].update(files_sha256=inputs, input_sha256=json_digest(inputs), dirty=False if kind == "canonical" else None)
        document["execution_plan"].update(units=units, source_input_sha256=json_digest(inputs))
        if kind == "local":
            document["container"].update(digest=None,base_digest=None)
            document["cpu"] = dict(machine="arm64",system="Darwin",processors=[dict(vendor="Apple",model="fixture M4",flags=[])])
        write_json(bundle/"provenance/source-before.json", {**document["source"], "dirty":False})
        write_json(bundle/"provenance/execution-plan.json",document["execution_plan"])
        template = document["execution_probes"][0]["observation"]
        probes = []
        for unit in units:
            for fmt in ("html", "latex"):
                observation = {**deepcopy(template),"unit":unit,"format":fmt}
                relative = f"kernel-startup/{Path(unit).stem}-{fmt}.json"
                path = bundle/"provenance"/relative
                write_json(path,observation)
                probes.append(dict(artifact=Path(relative).name,sha256=sha256(path),observation=observation))
        document["execution_probes"] = probes
        manifest = audit_evidence(bundle/"provenance/paired-evidence",self.source,self.plan_path)
        manifest_path = bundle/"provenance/paired-evidence-manifest.json"
        write_json(manifest_path,manifest)
        document["paired_evidence"] = dict(manifest_sha256=sha256(manifest_path),manifest=manifest)
        write_json(bundle/"provenance/fingerprint.json",document)
        write_json(bundle/"status.json",dict(passed=True))
        return bundle

    def compare(self):
        return compare_bundles(self.left,{"Mac1":self.right},self.source,self.plan_path)

    def mutate_evidence(self,fn):
        for path in (self.right/"provenance/paired-evidence").rglob("*.json"):
            document = json.loads(path.read_text())
            fn(document)
            write_json(path,document)
        manifest = audit_evidence(self.right/"provenance/paired-evidence",self.source,self.plan_path)
        path = self.right/"provenance/paired-evidence-manifest.json"
        write_json(path,manifest)
        fingerprint_path = self.right/"provenance/fingerprint.json"
        document = json.loads(fingerprint_path.read_text())
        document["paired_evidence"] = dict(manifest_sha256=sha256(path),manifest=manifest)
        write_json(fingerprint_path,document)

    def test_real_artifact_hashes_and_local_opt_in(self):
        result = self.compare()
        self.assertTrue(result["evidence_validated"])
        self.assertIsNone(result["numeric_parity_passed"])
        self.assertFalse(result["thresholds_modified"])
        self.assertEqual(result["canonical_artifacts"]["fingerprint"]["sha256"],sha256(self.left/"provenance/fingerprint.json"))
        self.assertEqual(len(result["comparisons"]["Mac1"]["local_artifacts"]["sidecars"]),8)
        self.assertIn("not approval", markdown_report(result))
        self.assertIn("No training", markdown_report(result))

    def test_two_native_profiles_are_reported_independently(self):
        second = self.make_bundle("mac6","local")
        path = second/"provenance/fingerprint.json"
        document = json.loads(path.read_text())
        document["runtime"]["torch"]["num_threads"] = 6
        for item in document["execution_probes"]:
            item["observation"]["torch"]["num_threads"] = 6
            artifact = second/"provenance/kernel-startup"/item["artifact"]
            write_json(artifact,item["observation"])
            item["sha256"] = sha256(artifact)
        write_json(path,document)
        result = compare_bundles(self.left,{"Mac1":self.right,"Mac6":second},self.source,self.plan_path)
        self.assertEqual(set(result["comparisons"]),{"Mac1","Mac6"})
        self.assertEqual(result["comparisons"]["Mac6"]["local_runtime"]["torch"]["num_threads"],6)

    def test_cross_runtime_realization_change_preserves_valid_within_runtime_pairs(self):
        def change(document):
            for row in document.get("identities",[]):
                row.update(initialization="c"*64,schedule="d"*64)
        self.mutate_evidence(change)
        result = self.compare()
        self.assertTrue(result["evidence_validated"])
        for study in ("ch11","ch13"):
            scope = result["comparisons"]["Mac1"]["studies"][study]["realized_input_comparison"]
            self.assertFalse(scope["all_recorded_realizations_identical"])
            self.assertEqual(scope["observations"][0]["local"]["initialization"],"c"*64)
        self.assertIn("changed recorded realization",markdown_report(result))

    def test_crosschapter_initialization_mismatch_fails_inside_each_runtime(self):
        def change(document):
            if document["study"] == "ch13":
                for row in document["identities"]:
                    if row["condition"] == "fixed":
                        row["initialization"] = "c"*64
        self.mutate_evidence(change)
        with self.assertRaisesRegex(ValueError,"Within-runtime.*initialization/schedule mismatch"):
            self.compare()

    def test_crosschapter_schedule_mismatch_fails_inside_each_runtime(self):
        def change(document):
            if document["study"] == "ch13":
                for row in document["identities"]:
                    row["schedule"] = "c"*64
        self.mutate_evidence(change)
        with self.assertRaisesRegex(ValueError,"Within-runtime.*initialization/schedule mismatch"):
            self.compare()

    def test_crosschapter_errors_and_curves_must_remain_exact(self):
        for changed in ("test_errors","validation_epoch_2"):
            def change(document):
                if document["study"] == "ch13":
                    document["records"] = payload("ch13",document["format"])["records"]
                    if changed == "test_errors":
                        change_record(document,6050,"fixed","test_errors",2)
                        change_record(document,6050,"fixed","test_accuracy",1-2/437)
                    else:
                        change_record(document,6050,"fixed",changed,.55)
            self.mutate_evidence(change)
            with self.assertRaisesRegex(ValueError,"Within-runtime.*errors/accuracy/curves mismatch"):
                self.compare()

    def test_source_commit_mismatch_is_not_runtime_drift(self):
        path = self.right/"provenance/fingerprint.json"
        document = json.loads(path.read_text())
        document["source"]["commit"] = "b"*40
        document["execution_plan"]["source_commit"] = "b"*40
        write_json(self.right/"provenance/source-before.json",{**document["source"],"dirty":False})
        write_json(self.right/"provenance/execution-plan.json",document["execution_plan"])
        write_json(path,document)
        with self.assertRaisesRegex(ValueError,"source commit identity differs"):
            self.compare()

    def test_missing_or_tampered_fingerprint_fails(self):
        (self.right/"provenance/fingerprint.json").unlink()
        with self.assertRaises(OSError):
            self.compare()

    def test_failed_execution_is_not_reported_as_success(self):
        write_json(self.right/"status.json",dict(passed=False))
        with self.assertRaisesRegex(ValueError,"completed execution"):
            self.compare()

    def test_sidecar_tampering_is_not_hidden_by_saved_manifest(self):
        path = next((self.right/"provenance/paired-evidence").rglob("ch08.json"))
        document = json.loads(path.read_text())
        document["records"][0]["value"] += .1
        write_json(path,document)
        with self.assertRaisesRegex(ValueError,"sidecars"):
            self.compare()

    def test_wrong_actual_source_is_not_accepted(self):
        path = self.source/PLAN["studies"]["ch08"]["unit"]
        path.write_text(path.read_text()+"\n# different source\n")
        with self.assertRaisesRegex(ValueError,"manifest differs"):
            self.compare()

    def test_missing_native_cell_fails_even_with_updated_inventory(self):
        path = next((self.right/"_freeze").rglob("html.json"))
        write_json(path,execution(ordinal=2))
        fingerprint_path = self.right/"provenance/fingerprint.json"
        document = json.loads(fingerprint_path.read_text())
        document["freeze_files_sha256"] = freeze_inventory(self.right/"_freeze")
        write_json(fingerprint_path,document)
        with self.assertRaisesRegex(ValueError,"native-cell coverage"):
            self.compare()

    def test_clean_source_manifest_is_required_for_local(self):
        (self.right/"provenance/source-before.json").unlink()
        with self.assertRaises(ValueError):
            self.compare()


if __name__ == "__main__":
    unittest.main()
