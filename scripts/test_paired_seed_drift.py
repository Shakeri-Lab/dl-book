"""Paired drift reporting must not silently widen identity or numeric gates."""

from copy import deepcopy
import unittest

from freeze_provenance import json_digest
from paired_seed_drift import paired_report


class PairedDriftTests(unittest.TestCase):
    def setUp(self):
        self.plan = {"schema_version": 1, "safety_factor": "2.0", "seeds": [6050, 6051],
                     "computation_sha256": "a" * 64, "protocol_sha256": "b" * 64,
                     "metrics": {"witness": {"identity": False, "decimal_places": 3,
                                              "field_target": "per-seed-value",
                                              "unit": "MSE", "population": "fixed evaluation set"}}}
        self.canonical = {"plan_sha256": json_digest(self.plan),
                          "computation_sha256": "a" * 64, "protocol_sha256": "b" * 64,
                          "fingerprint_sha256": "c" * 64,
                          "rows": [{"seed": seed, "metric": "witness", "value": "1.0"}
                                   for seed in (6050, 6051)]}
        self.local = deepcopy(self.canonical)
        self.local["fingerprint_sha256"] = "d" * 64
        self.local["rows"][0]["value"] = "1.0011"
        self.local["rows"][1]["value"] = "1.0022"

    def test_uses_max_paired_difference_and_rounds_up(self):
        result = paired_report(self.plan, self.canonical, self.local)
        metric = result["metrics"]["witness"]
        self.assertEqual(metric["max_absolute_paired_difference"], "0.0022")
        self.assertEqual(metric["report_only_candidate_atol"], "0.005")

    def test_seed_sd_never_enters_bound(self):
        self.local["seed_sd"] = "9999.0"
        result = paired_report(self.plan, self.canonical, self.local)
        self.assertEqual(result["metrics"]["witness"]["report_only_candidate_atol"], "0.005")

    def test_different_computation_is_rejected(self):
        self.local["computation_sha256"] = "f" * 64
        with self.assertRaisesRegex(ValueError, "identity gates"):
            paired_report(self.plan, self.canonical, self.local)

    def test_unpaired_or_aggregated_only_data_is_rejected(self):
        self.local["rows"].pop()
        with self.assertRaisesRegex(ValueError, "same-seed"):
            paired_report(self.plan, self.canonical, self.local)

    def test_changed_plan_is_rejected(self):
        self.plan["metrics"]["witness"]["decimal_places"] = 2
        with self.assertRaisesRegex(ValueError, "predeclared plan"):
            paired_report(self.plan, self.canonical, self.local)

    def test_identity_metric_is_not_given_nonzero_candidate_bound(self):
        self.plan["metrics"]["witness"]["identity"] = True
        for artifact in (self.canonical, self.local):
            artifact["plan_sha256"] = json_digest(self.plan)
        metric = paired_report(self.plan, self.canonical, self.local)["metrics"]["witness"]
        self.assertEqual(metric["report_only_candidate_atol"], "0")
        self.assertTrue(metric["identity_violation"])

    def test_nonfinite_value_is_rejected(self):
        self.local["rows"][0]["value"] = "NaN"
        with self.assertRaisesRegex(ValueError, "Nonfinite"):
            paired_report(self.plan, self.canonical, self.local)

    def test_aggregate_field_uses_paired_mean_not_maximum_seed(self):
        self.plan["metrics"]["witness"]["field_target"] = "mean-over-declared-seeds"
        for artifact in (self.canonical, self.local):
            artifact["plan_sha256"] = json_digest(self.plan)
        self.local["rows"][0]["value"] = "0.9990"
        self.local["rows"][1]["value"] = "1.0020"
        metric = paired_report(self.plan, self.canonical, self.local)["metrics"]["witness"]
        self.assertEqual(metric["max_absolute_paired_difference"], "0.0020")
        self.assertEqual(metric["absolute_difference_of_seed_means"], "0.0005")
        self.assertEqual(metric["report_only_candidate_atol"], "0.001")


if __name__ == "__main__":
    unittest.main()
