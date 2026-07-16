#!/usr/bin/env python3
"""Rebuild the immutable Chapter 1--9 corpus used by Chapters 10 and 14."""

from __future__ import annotations

import argparse
import hashlib
from pathlib import Path
import re
import subprocess


SOURCE_COMMIT = "24ae3a6321ad901497776180b8e107490750adc9"
EXPECTED_CHARACTERS = 148_594
EXPECTED_SHA256 = "b0fc23a513e37e7bcd78da04a03877345f6ebc850b91dbae260656d9924fb299"
SOURCE_FILES = (
    "chapters/part1/01-linear-regression.qmd",
    "chapters/part1/02-logistic-softmax.qmd",
    "chapters/part1/03-nonlinearity-mlp.qmd",
    "chapters/part1/04-training-loss-sgd.qmd",
    "chapters/part1/05-backpropagation.qmd",
    "chapters/part1/06-generalization-inductive-bias.qmd",
    "chapters/part2/07-filters-convolution.qmd",
    "chapters/part2/08-cnn.qmd",
    "chapters/part2/09-modern-cnns-transfer.qmd",
)


def historical_source(repo: Path, commit: str, filename: str) -> str:
    result = subprocess.run(
        ["git", "show", f"{commit}:{filename}"],
        cwd=repo,
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout


def strip_executable_material(raw: str) -> str:
    raw = re.sub(r"```\{python\}.*?```", "", raw, flags=re.S)
    return re.sub(r"<!--.*?-->", "", raw, flags=re.S)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--commit", default=SOURCE_COMMIT)
    args = parser.parse_args()

    repo = Path(__file__).resolve().parents[1]
    text = "".join(
        strip_executable_material(historical_source(repo, args.commit, filename))
        for filename in SOURCE_FILES
    )
    if args.commit == SOURCE_COMMIT and len(text) != EXPECTED_CHARACTERS:
        raise RuntimeError(
            f"expected {EXPECTED_CHARACTERS:,} characters, found {len(text):,}"
        )

    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
    if args.commit == SOURCE_COMMIT and digest != EXPECTED_SHA256:
        raise RuntimeError(f"expected SHA-256 {EXPECTED_SHA256}, found {digest}")

    destination = repo / "data" / "book-corpus-ch1-9.txt"
    with destination.open("w", encoding="utf-8", newline="") as stream:
        stream.write(text)

    print(f"source_commit={args.commit}")
    print(f"files={len(SOURCE_FILES)}; characters={len(text):,}")
    print(f"sha256={digest}")
    print(f"wrote={destination.relative_to(repo)}")


if __name__ == "__main__":
    main()
