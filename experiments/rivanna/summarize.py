"""Aggregate completed Rivanna JSON results into compact Markdown tables."""

from __future__ import annotations

import argparse
import json
import statistics
from collections import defaultdict
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("results", type=Path)
    args = parser.parse_args()
    records = [
        json.loads(path.read_text())
        for path in sorted(args.results.rglob("*.json"))
        if "smoke" not in path.parts and not json.loads(path.read_text()).get("smoke")
    ]
    groups: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for record in records:
        label = record.get("model") or record.get("regime") or record.get("size")
        groups[(record["experiment"], label)].append(record)

    for experiment in sorted({name for name, _ in groups}):
        print(f"\n## {experiment}\n")
        if experiment == "chapter10_wikitext2_word_lstm":
            print("| setting | seeds | parameters | validation perplexity | test perplexity |")
            print("|---|---:|---:|---:|---:|")
            for (_, label), rows in sorted(groups.items()):
                if rows[0]["experiment"] != experiment:
                    continue
                validation = [row["best_validation_perplexity"] for row in rows]
                test = [row["test_perplexity"] for row in rows]
                print(
                    f"| {label} | {len(rows)} | {rows[0]['parameter_count']:,} | "
                    f"{statistics.mean(validation):.2f} ± {statistics.stdev(validation):.2f} | "
                    f"{statistics.mean(test):.2f} ± {statistics.stdev(test):.2f} |"
                )
        else:
            print("| setting | seeds | parameters | validation accuracy | test accuracy |")
            print("|---|---:|---:|---:|---:|")
            for (_, label), rows in sorted(groups.items()):
                if rows[0]["experiment"] != experiment:
                    continue
                validation = [row["best_validation_accuracy"] for row in rows]
                test = [row["test_accuracy"] for row in rows]
                parameter_key = (
                    "trainable_parameter_count"
                    if "trainable_parameter_count" in rows[0]
                    else "parameter_count"
                )
                print(
                    f"| {label} | {len(rows)} | {rows[0][parameter_key]:,} | "
                    f"{statistics.mean(validation):.4f} ± {statistics.stdev(validation):.4f} | "
                    f"{statistics.mean(test):.4f} ± {statistics.stdev(test):.4f} |"
                )


if __name__ == "__main__":
    main()
