#!/usr/bin/env python3
"""Typed cross-platform contracts for public-notebook output.

The committed Quarto freeze remains the reference transcript.  Most stdout is
therefore compared byte for byte.  This module records the deliberately small
set of exceptions needed when the same pinned notebook is executed on another
CPU/BLAS backend:

* ``numeric`` rules retain the complete textual schema and permit only bounded
  changes to numeric fields;
* ``structural`` rules cover stochastic samples, platform-dependent digests,
  and the two experiments whose conclusions matter more than matching a
  particular optimization trajectory; and
* one explicit stderr rule admits the warning intentionally demonstrated in
  Chapter 5.

There is no wildcard fallback.  A changed block that is not in the ledger is a
contract failure.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path
import math
import re
from typing import Mapping, Sequence


ROOT = Path(__file__).resolve().parents[1]
BlockKey = tuple[str, int]


@dataclass(frozen=True)
class ComparisonResult:
    """The complete result of one portability comparison."""

    passed: bool
    errors: tuple[str, ...]
    accepted_deviations: tuple[str, ...]


@dataclass(frozen=True)
class NumericRule:
    """Tolerance for named numeric fields in an otherwise exact text schema."""

    atol: float
    rtol: float = 0.0
    mutable_fields: tuple[int, ...] = ()
    # (one-based field index, absolute tolerance, relative tolerance)
    field_tolerances: tuple[tuple[int, float, float], ...] = ()
    description: str = "bounded numeric portability drift"


@dataclass(frozen=True)
class ContractSpec:
    """Human- and machine-readable ledger entry."""

    kind: str
    description: str


_NUMBER_RE = re.compile(
    r"(?<![A-Za-z0-9_])"
    r"[+-]?(?:(?:\d{1,3}(?:,\d{3})+)|(?:\d+(?:\.\d*)?)|(?:\.\d+))"
    r"(?:[eE][+-]?\d+)?%?"
    r"(?![A-Za-z0-9_])"
)
# These thresholds are in the units printed by the block.  Thus 0.6 for a
# value ending in ``%`` means 0.6 percentage point, not probability 0.006.
NUMERIC_RULES: Mapping[BlockKey, NumericRule] = {
    ("a1-linear-algebra", 2): NumericRule(1e-12, 2e-9, (5, 6, 7, 8)),
    ("a1-linear-algebra", 3): NumericRule(1e-12, 1e-10, (3,)),
    ("a1-linear-algebra", 5): NumericRule(1e-12, 1e-10, (9, 10)),
    ("05-backpropagation", 1): NumericRule(1e-7, mutable_fields=(1, 2, 3, 4)),
    ("06-generalization-inductive-bias", 1): NumericRule(0.6, mutable_fields=(1, 2)),
    ("06-generalization-inductive-bias", 2): NumericRule(0.6, mutable_fields=(1, 2)),
    ("06-generalization-inductive-bias", 3): NumericRule(0.6, mutable_fields=(1, 2)),
    ("learning-by-experiment", 1): NumericRule(
        0.9,
        mutable_fields=(2, 3, 5, 6, 8, 9, 11, 12, 14, 15, 17, 18, 20, 21, 23, 24),
    ),
    ("learning-by-experiment", 2): NumericRule(
        1.5,
        mutable_fields=(2, 3, 5, 6, 8, 9, 11, 12, 14, 15, 17, 18, 19, 20, 21, 22),
    ),
    ("making-pca-learnable", 1): NumericRule(
        5e-4,
        mutable_fields=(5, 6, 11, 12, 17, 18, 23, 24, 29, 30, 34, 35, 39, 40),
    ),
    ("making-pca-learnable", 3): NumericRule(
        5e-4,
        mutable_fields=tuple(range(1, 15)),
        field_tolerances=((14, 1e-12, 0.0),),
    ),
    ("09-modern-cnns-transfer", 3): NumericRule(
        0.5,
        mutable_fields=(4,),
    ),
    ("09-modern-cnns-transfer", 4): NumericRule(
        2.6,
        mutable_fields=(3,),
    ),
    ("09-modern-cnns-transfer", 5): NumericRule(
        1.5,
        mutable_fields=tuple(range(1, 11)),
        field_tolerances=(
            (2, 6.5, 0.0),
            (4, 6.5, 0.0),
            (6, 6.5, 0.0),
            (8, 6.5, 0.0),
            (10, 6.5, 0.0),
        ),
    ),
    ("09-modern-cnns-transfer", 6): NumericRule(
        0.0,
        mutable_fields=(2, 3),
        field_tolerances=((2, 13.0, 0.0), (3, 11.0, 0.0)),
    ),
    ("09-modern-cnns-transfer", 7): NumericRule(
        0.0,
        mutable_fields=(2, 3),
        field_tolerances=((2, 3.0, 0.0), (3, 5.5, 0.0)),
    ),
    ("09-modern-cnns-transfer", 8): NumericRule(
        0.02,
        mutable_fields=(5,),
    ),
    ("09-modern-cnns-transfer", 9): NumericRule(
        1.7,
        mutable_fields=(2,),
    ),
    ("09-modern-cnns-transfer", 10): NumericRule(
        0.0,
        mutable_fields=(2, 3, 6, 7, 10, 11, 13, 14),
        field_tolerances=(
            (2, 1.2, 0.0),
            (3, 1.8, 0.0),
            (6, 1.2, 0.0),
            (7, 3.0, 0.0),
            (10, 1.2, 0.0),
            (11, 5.2, 0.0),
            (13, 1.2, 0.0),
            (14, 1.4, 0.0),
        ),
    ),
    ("08-cnn", 7): NumericRule(1.1, mutable_fields=(1, 2, 3, 4)),
    ("08-cnn", 8): NumericRule(1.1, mutable_fields=tuple(range(1, 11))),
    ("08-cnn", 9): NumericRule(1.1, mutable_fields=(1, 3, 4, 6)),
    ("10-sequences-rnn", 1): NumericRule(1e-6, mutable_fields=(1,)),
    ("11-encoder-decoder", 2): NumericRule(0.6, mutable_fields=(1, 2)),
    ("11-encoder-decoder", 3): NumericRule(0.6, mutable_fields=(1, 2, 3)),
    ("12-kernel-regression", 5): NumericRule(1e-12, mutable_fields=(1,)),
    ("13-attention", 6): NumericRule(
        0.6,
        mutable_fields=(36, 37, 38),
        field_tolerances=((38, 1e-6, 0.0),),
    ),
    ("14-self-attention-transformer", 6): NumericRule(
        0.05,
        mutable_fields=(2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 23, 24),
    ),
    ("14-self-attention-transformer", 7): NumericRule(
        0.05,
        mutable_fields=(2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 23, 24),
    ),
    ("14-self-attention-transformer", 9): NumericRule(1e-6, mutable_fields=(2,)),
    ("15-bert-pretraining", 6): NumericRule(2e-6, mutable_fields=(1, 2, 3, 4)),
    ("16-vit-scaling", 2): NumericRule(1e-5, mutable_fields=(7,)),
    ("17-peft-quantization", 2): NumericRule(
        2e-6,
        mutable_fields=(1, 2, 3, 7, 8, 11, 12, 15, 16, 25),
        field_tolerances=(
            (2, 1e-12, 0.0),
            (3, 1e-5, 0.0),
            (25, 5e-6, 0.0),
        ),
    ),
    ("18-alignment", 3): NumericRule(1e-12, mutable_fields=(22,)),
    ("18-alignment", 6): NumericRule(1e-12, mutable_fields=(9,)),
    ("19-generative", 2): NumericRule(1e-12, mutable_fields=(5,)),
    ("19-generative", 3): NumericRule(1e-12, mutable_fields=(17,)),
    ("19-generative", 5): NumericRule(
        2e-6,
        mutable_fields=(*range(1, 13), *range(14, 28), 29, 30),
    ),
    ("20-multimodal", 1): NumericRule(
        0.002,
        mutable_fields=(
            8, 9, 11, 12, 14, 15, 17, 18, 20, 21, 23, 24,
            26, 27, 29, 30, 32, 33, 35, 36, 38, 39, 41, 42,
            44, 45, 47, 48, 50, 51, 53, 54, 56, 57, 59, 60,
        ),
    ),
    ("attention-as-test-time-regression", 2): NumericRule(1e-12, mutable_fields=(1,)),
    ("a3-precision-performance", 6): NumericRule(1e-12, mutable_fields=(1,)),
}


NUMERIC_JUSTIFICATIONS: Mapping[BlockKey, str] = {
    **{
        ("a1-linear-algebra", block): "linear-algebra residual and conditioning roundoff"
        for block in (2, 3, 5)
    },
    ("05-backpropagation", 1): "autograd agreement below the chapter's 1e-7 audit bound",
    **{
        ("06-generalization-inductive-bias", block): "seeded accuracy within 0.6 percentage point"
        for block in (1, 2, 3)
    },
    ("learning-by-experiment", 1): "BatchNorm sweep endpoint and seed-SD portability",
    ("learning-by-experiment", 2): "locked endpoint and paired-contrast portability",
    ("making-pca-learnable", 1): "nonlinear reconstruction and correlation portability",
    ("making-pca-learnable", 3): "autoencoder endpoint and adjoint-roundoff portability",
    **{
        ("09-modern-cnns-transfer", block): (
            "seeded CNN/transfer output within its reviewed CPU-backend bound"
        )
        for block in range(3, 11)
    },
    **{
        ("08-cnn", block): "seeded clean/shift accuracy within 1.1 percentage points"
        for block in (7, 8, 9)
    },
    ("10-sequences-rnn", 1): "manual/unrolled recurrence roundoff",
    ("11-encoder-decoder", 2): "padding-control validation accuracy portability",
    ("11-encoder-decoder", 3): "sealed sequence audit accuracy portability",
    ("12-kernel-regression", 5): "normalization equivalence roundoff",
    ("13-attention", 6): "attention-mass metrics and stochastic row-sum roundoff",
    **{
        ("14-self-attention-transformer", block): "seeded Transformer loss trajectory portability"
        for block in (6, 7)
    },
    ("14-self-attention-transformer", 9): "masked-attention row-sum roundoff",
    ("15-bert-pretraining", 6): "MLM embedding-geometry roundoff",
    ("16-vit-scaling", 2): "patch projection equivalence roundoff",
    ("17-peft-quantization", 2): "LoRA solver and merge-roundoff portability",
    **{
        ("18-alignment", block): "reward-shift and analytic/DPO equivalence roundoff"
        for block in (3, 6)
    },
    ("19-generative", 2): "GAN objective identity roundoff",
    ("19-generative", 3): "diffusion schedule identity roundoff",
    ("19-generative", 5): "seeded denoising and sampling metric portability",
    ("20-multimodal", 1): "one-decision retrieval tie and seed-SD portability",
    ("attention-as-test-time-regression", 2): "streaming/traversal equivalence roundoff",
    ("a3-precision-performance", 6): "blocked-attention equivalence roundoff",
}


STRUCTURAL_RULES: Mapping[BlockKey, str] = {
    ("10-sequences-rnn", 3): "lag-80 recall relation",
    ("10-sequences-rnn", 6): "300-character corpus sample",
    ("11-encoder-decoder", 4): "date-error gallery",
    ("11-encoder-decoder", 5): "beam-search date sample",
    ("11-encoder-decoder", 6): "beam-versus-greedy count",
    ("14-self-attention-transformer", 5): "protocol with backend digest",
    ("14-self-attention-transformer", 8): "position-rematch relations",
    ("14-self-attention-transformer", 10): "paired 300-character samples",
    **{
        ("16-vit-scaling", block): "CNN/ViT paired experiment relations"
        for block in range(5, 11)
    },
}


PORTABILITY_LEDGER: Mapping[BlockKey, ContractSpec] = {
    **{
        key: ContractSpec("numeric", NUMERIC_JUSTIFICATIONS[key])
        for key, rule in NUMERIC_RULES.items()
    },
    **{
        key: ContractSpec("structural", description)
        for key, description in STRUCTURAL_RULES.items()
    },
}


def _number_parts(text: str) -> tuple[str, list[str]]:
    """Return a numeric-token skeleton and the tokens in encounter order."""

    tokens: list[str] = []

    def replace(match: re.Match[str]) -> str:
        tokens.append(match.group(0))
        return "{#}"

    return _NUMBER_RE.sub(replace, text), tokens


def _decimal(token: str) -> Decimal:
    return Decimal(token.rstrip("%").replace(",", ""))


def _plain_integer(token: str) -> bool:
    bare = token.lstrip("+-")
    return "%" not in bare and "." not in bare and "e" not in bare.lower()


def _number_style(token: str) -> tuple[bool, str, int, int]:
    """Capture percentage/scientific/fixed notation and printed precision."""

    bare = token.rstrip("%").lstrip("+-").replace(",", "")
    percent = token.endswith("%")
    if "e" in bare.lower():
        mantissa, exponent = re.split(r"[eE]", bare, maxsplit=1)
        decimals = len(mantissa.partition(".")[2])
        exponent_digits = len(exponent.lstrip("+-"))
        return percent, "scientific", decimals, exponent_digits
    decimals = len(bare.partition(".")[2]) if "." in bare else 0
    return percent, "fixed" if "." in bare else "integer", decimals, 0


def _field_tolerance(rule: NumericRule, index: int) -> tuple[float, float]:
    overrides = {
        field: (atol, rtol) for field, atol, rtol in rule.field_tolerances
    }
    return overrides.get(index, (rule.atol, rule.rtol))


def _numeric_errors(
    expected: str, actual: str, rule: NumericRule, label: str
) -> list[str]:
    expected_schema, expected_tokens = _number_parts(expected)
    actual_schema, actual_tokens = _number_parts(actual)
    if expected_schema != actual_schema:
        return [f"{label}: text schema changed outside numeric fields"]
    if len(expected_tokens) != len(actual_tokens):
        return [f"{label}: numeric field count changed"]

    errors: list[str] = []
    mutable = set(rule.mutable_fields)
    for index, (before, after) in enumerate(
        zip(expected_tokens, actual_tokens), start=1
    ):
        if before == after:
            continue
        if index not in mutable:
            errors.append(
                f"{label}: immutable numeric field {index} changed "
                f"from {before!r} to {after!r}"
            )
            continue
        # Plain integers are protocol values (seeds, steps, dimensions, counts).
        # Integer percentages remain measurements and therefore have a percent style.
        if _plain_integer(before) or _plain_integer(after):
            errors.append(
                f"{label}: protocol integer field {index} changed "
                f"from {before!r} to {after!r}"
            )
            continue
        if _number_style(before) != _number_style(after):
            errors.append(
                f"{label}: numeric field {index} changed notation or precision "
                f"from {before!r} to {after!r}"
            )
            continue
        try:
            left, right = _decimal(before), _decimal(after)
        except InvalidOperation:
            errors.append(f"{label}: numeric field {index} is not finite decimal text")
            continue
        atol, rtol = _field_tolerance(rule, index)
        tolerance = Decimal(str(atol)) + Decimal(str(rtol)) * abs(left)
        if abs(right - left) > tolerance:
            errors.append(
                f"{label}: numeric field {index} changed {before!r} -> "
                f"{after!r}, beyond atol={atol:g}, rtol={rtol:g}"
            )
    return errors


def _one_print_newline(block: str) -> str | None:
    return block[:-1] if block.endswith("\n") else None


def _corpus_characters() -> set[str]:
    return set((ROOT / "data/book-corpus-ch1-9.txt").read_text(encoding="utf-8"))


def _generated_text_errors(text: str, label: str) -> list[str]:
    prompt = "The gradient "
    errors: list[str] = []
    if not text.startswith(prompt):
        errors.append(f"{label}: generated text does not begin with {prompt!r}")
        return errors
    continuation = text[len(prompt) :]
    if len(continuation) != 300:
        errors.append(
            f"{label}: expected 300 generated characters, got {len(continuation)}"
        )
    if "\x00" in text or "\ufffd" in text:
        errors.append(f"{label}: generated text contains a replacement/NUL character")
    outside = set(continuation) - _corpus_characters()
    if outside:
        errors.append(
            f"{label}: generated text contains characters outside corpus vocabulary: "
            f"{sorted(outside)!r}"
        )
    letters = [character.lower() for character in continuation if character.isalpha()]
    whitespace = sum(character.isspace() for character in continuation)
    longest_run = max(
        (len(match.group(0)) for match in re.finditer(r"(.)\1*", continuation)),
        default=0,
    )
    if len(letters) < 120 or len(set(letters)) < 12:
        errors.append(f"{label}: generated sample lacks corpus-like lexical variety")
    if whitespace > 150 or "\n" not in continuation:
        errors.append(f"{label}: generated sample has implausible whitespace structure")
    if longest_run > 20:
        errors.append(f"{label}: generated sample contains an implausible repeated run")
    return errors


def _ch10_recall(actual: str, label: str) -> list[str]:
    lines = actual.rstrip("\n").splitlines()
    if lines[:1] != [
        "recall accuracy at lag 80 (chance 25%), seeds 0 / 1 / 6050:"
    ] or len(lines) != 4:
        return [f"{label}: recall table scaffold changed"]
    rows: dict[str, list[int]] = {}
    row_re = re.compile(r"^  (vanilla RNN|LSTM, default init|LSTM, forget bias \+1)\s+"
                        r"(\d+)%\s+(\d+)%\s+(\d+)%$")
    for line in lines[1:]:
        match = row_re.fullmatch(line)
        if not match:
            return [f"{label}: malformed recall row: {line!r}"]
        rows[match.group(1)] = [int(match.group(i)) for i in range(2, 5)]
    errors: list[str] = []
    vanilla = rows.get("vanilla RNN", [])
    default = rows.get("LSTM, default init", [])
    biased = rows.get("LSTM, forget bias +1", [])
    if len(rows) != 3:
        errors.append(f"{label}: missing or duplicate recall condition")
    if sum(value >= 95 for value in vanilla) < 1 or sum(
        15 <= value <= 35 for value in vanilla
    ) < 2:
        errors.append(f"{label}: vanilla RNN no longer shows seed-sensitive recall")
    if len(default) != 3 or not all(15 <= value <= 35 for value in default):
        errors.append(f"{label}: default LSTM no longer remains near chance")
    if len(biased) != 3 or not all(value >= 95 for value in biased):
        errors.append(f"{label}: forget-bias LSTM no longer solves all three seeds")
    return errors


def _valid_iso(value: str) -> bool:
    try:
        return date.fromisoformat(value).isoformat() == value
    except ValueError:
        return False


def _ch11_error_gallery(actual: str, label: str) -> list[str]:
    lines = actual.rstrip("\n").splitlines()
    if len(lines) != 4:
        return [f"{label}: expected one summary and three error examples"]
    header = re.fullmatch(
        r"(\d+) errors on 437 unambiguous test dates; a sample:", lines[0]
    )
    if not header or not (28 <= int(header.group(1)) <= 32):
        return [f"{label}: malformed or implausible date-error summary"]
    sample_re = re.compile(
        r"^  '([^']+)' -> '(\d{4}-\d{2}-\d{2})'   "
        r"\(truth (\d{4}-\d{2}-\d{2})\)$"
    )
    errors: list[str] = []
    examples: list[tuple[str, str, str]] = []
    for line in lines[1:]:
        match = sample_re.fullmatch(line)
        if not match:
            errors.append(f"{label}: malformed date-error example: {line!r}")
            continue
        prediction, truth = match.group(2), match.group(3)
        examples.append((match.group(1), prediction, truth))
        if not _valid_iso(prediction) or not _valid_iso(truth):
            errors.append(f"{label}: invalid ISO date in error example")
        if prediction == truth:
            errors.append(f"{label}: purported error equals its truth")
    if len(set(examples)) != 3:
        errors.append(f"{label}: date-error examples must be three distinct records")
    return errors


def _ch11_beam(expected: str, actual: str, label: str) -> list[str]:
    before = expected.rstrip("\n").split("\n\n")
    after = actual.rstrip("\n").split("\n\n")
    if len(before) != 4 or len(after) != 4:
        return [f"{label}: expected four beam-search examples"]
    head_re = re.compile(
        r"^'([^']+)'   truth: '(\d{4}-\d{2}-\d{2})'   "
        r"greedy: '(\d{4}-\d{2}-\d{2})'$"
    )
    beam_re = re.compile(
        r"^   beam: '(\d{4}-\d{2}-\d{2})'   joint log score = (-?\d+\.\d+)$"
    )
    errors: list[str] = []
    for index, (old_chunk, new_chunk) in enumerate(zip(before, after), start=1):
        old_lines, new_lines = old_chunk.splitlines(), new_chunk.splitlines()
        if len(old_lines) != 3 or len(new_lines) != 3:
            errors.append(f"{label}: example {index} does not have two beams")
            continue
        old_head, new_head = head_re.fullmatch(old_lines[0]), head_re.fullmatch(
            new_lines[0]
        )
        if not old_head or not new_head:
            errors.append(f"{label}: malformed beam example {index} header")
            continue
        if old_head.group(1, 2) != new_head.group(1, 2):
            errors.append(f"{label}: source/truth changed in beam example {index}")
        greedy = new_head.group(3)
        beams = [beam_re.fullmatch(line) for line in new_lines[1:]]
        if not all(beams):
            errors.append(f"{label}: malformed beam rows in example {index}")
            continue
        values = [match.group(1) for match in beams if match]
        scores = [float(match.group(2)) for match in beams if match]
        if not all(_valid_iso(value) for value in [new_head.group(2), greedy, *values]):
            errors.append(f"{label}: invalid ISO output in beam example {index}")
        if values[0] != greedy:
            errors.append(f"{label}: top beam differs from greedy in example {index}")
        if len(set(values)) != 2:
            errors.append(f"{label}: beam candidates are not distinct in example {index}")
        if not all(math.isfinite(score) and score <= 0 for score in scores):
            errors.append(f"{label}: beam scores must be finite nonpositive values")
        if scores != sorted(scores, reverse=True):
            errors.append(f"{label}: beam scores are not in descending order")
    return errors


def _ch11_beam_count(actual: str, label: str) -> list[str]:
    match = re.fullmatch(
        r"beam-5 disagrees with greedy on (\d+) of 200 test dates\n", actual
    )
    if not match or not (1 <= int(match.group(1)) <= 3):
        return [f"{label}: beam/greedy disagreement count is malformed or implausible"]
    return []


def _ch14_protocol(expected: str, actual: str, label: str) -> list[str]:
    pattern = re.compile(r"(?m)^initial tensors: ([0-9a-f]{12}…)$")
    old, new = pattern.search(expected), pattern.search(actual)
    if not old or not new:
        return [f"{label}: initial tensor digest must be 12 lowercase hex digits + ellipsis"]
    normalized_old = expected[: old.start(1)] + "<digest>" + expected[old.end(1) :]
    normalized_new = actual[: new.start(1)] + "<digest>" + actual[new.end(1) :]
    if normalized_old != normalized_new:
        return [f"{label}: protocol changed outside the backend-dependent tensor digest"]
    return []


def _loss_endpoint(block: str) -> tuple[float, float] | None:
    match = re.search(
        r"fixed-window train loss: (\d+\.\d+)\n"
        r"fixed-window held-out loss: (\d+\.\d+)\n$",
        block,
    )
    return (float(match.group(1)), float(match.group(2))) if match else None


def _ch14_rematch(actual: Sequence[str], label: str) -> list[str]:
    if len(actual) < 8:
        return [f"{label}: missing prerequisite training blocks"]
    position = _loss_endpoint(actual[5])
    no_position = _loss_endpoint(actual[6])
    report = re.fullmatch(
        r"position improvement: (\d+\.\d+) loss \((\d+\.\d+)% relative\)\n"
        r"positional Transformer minus LSTM: (-?\d+\.\d+) loss\n",
        actual[7],
    )
    if not position or not no_position or not report:
        return [f"{label}: position-rematch scaffold changed"]
    improvement, relative, lstm_gap = map(float, report.groups())
    computed = no_position[1] - position[1]
    computed_relative = 100 * computed / no_position[1]
    errors: list[str] = []
    if abs(improvement - computed) > 1.1e-4:
        errors.append(f"{label}: reported improvement disagrees with endpoint losses")
    if abs(relative - computed_relative) > 0.06:
        errors.append(f"{label}: reported relative improvement is inconsistent")
    if abs(lstm_gap - (position[1] - 1.888110429)) > 1.1e-4:
        errors.append(f"{label}: reported LSTM gap is inconsistent")
    if improvement < 0.30 or relative < 12.0:
        errors.append(f"{label}: positional model no longer has the claimed advantage")
    if not 0 < lstm_gap < 0.15:
        errors.append(f"{label}: LSTM/Transformer ordering or scale changed")
    return errors


def _ch14_samples(actual: str, label: str) -> list[str]:
    prefix = "WITH POSITION\n\n"
    separator = "\n\n\nWITHOUT POSITION\n\n"
    if not actual.startswith(prefix) or separator not in actual:
        return [f"{label}: paired sample headings/scaffold changed"]
    body = _one_print_newline(actual)
    if body is None:
        return [f"{label}: sample block lacks its print newline"]
    left, right = body[len(prefix) :].split(separator, maxsplit=1)
    errors = [
        *_generated_text_errors(left, f"{label} WITH POSITION"),
        *_generated_text_errors(right, f"{label} WITHOUT POSITION"),
    ]
    if len(left) == len(right) and sum(a != b for a, b in zip(left, right)) < 60:
        errors.append(f"{label}: paired generated samples are implausibly similar")
    return errors


def _ch9_relations(actual: Sequence[str], label: str) -> list[str]:
    if len(actual) < 11:
        return [f"{label}: expected eleven stdout blocks"]
    errors: list[str] = []

    arch_patterns = [
        re.compile(
            r"VGGSmall: ([\d,]+) parameters \(([\d,]+) in the head, (\d+)%\)\n"
            r"test accuracy (\d+\.\d+)%\n"
        ),
        re.compile(
            r"NINSmall: ([\d,]+) parameters \(head: ([\d,]+)\)\n"
            r"test accuracy (\d+\.\d+)%\n"
        ),
    ]
    architecture = [pattern.fullmatch(actual[index]) for index, pattern in zip((2, 3), arch_patterns)]
    if not all(architecture):
        errors.append(f"{label}: VGG/NiN architecture report schema changed")
    else:
        vgg, nin = architecture
        assert vgg and nin
        if vgg.group(1, 2, 3) != ("218,586", "202,122", "92"):
            errors.append(f"{label}: VGG parameter accounting changed")
        if nin.group(1, 2) != ("35,034", "650"):
            errors.append(f"{label}: NiN parameter accounting changed")
        if float(vgg.group(4)) < 80 or float(nin.group(3)) < 65:
            errors.append(f"{label}: VGG/NiN endpoint fell outside the evidence floor")

    shift_re = re.compile(
        r"shift (\d)px:\s+LeNet (\d+\.\d+)%\s+NIN\+GAP (\d+\.\d+)%"
    )
    shifts = [shift_re.fullmatch(line) for line in actual[4].rstrip("\n").splitlines()]
    if len(shifts) != 5 or not all(shifts):
        errors.append(f"{label}: shift table schema changed")
    else:
        shift_ids = [int(match.group(1)) for match in shifts if match]
        lenet = [float(match.group(2)) for match in shifts if match]
        nin_values = [float(match.group(3)) for match in shifts if match]
        if shift_ids != list(range(5)):
            errors.append(f"{label}: shift table no longer covers 0..4 in order")
        if not all(left > right for left, right in zip(lenet, lenet[1:])):
            errors.append(f"{label}: LeNet shift response is no longer monotone")
        if lenet[0] <= nin_values[0] or nin_values[2] <= lenet[2]:
            errors.append(f"{label}: expected LeNet/NiN crossover disappeared")
        if nin_values[4] - lenet[4] < 25:
            errors.append(f"{label}: NiN no longer has the large shift-4 advantage")
        if lenet[0] - lenet[4] <= nin_values[0] - nin_values[4]:
            errors.append(f"{label}: NiN no longer loses less under shift")

    endpoint_re = re.compile(r"^(plain-20|residual-20)\s+train (\d+\.\d+)%\s+test (\d+\.\d+)%\n$")
    plain, residual = endpoint_re.fullmatch(actual[5]), endpoint_re.fullmatch(actual[6])
    if not plain or not residual or plain.group(1) != "plain-20" or residual.group(1) != "residual-20":
        errors.append(f"{label}: plain/residual endpoint schema changed")
    elif (
        float(residual.group(2)) - float(plain.group(2)) < 30
        or float(residual.group(3)) - float(plain.group(3)) < 20
    ):
        errors.append(f"{label}: residual network advantage is no longer material")

    gradient_lines = actual[7].rstrip("\n").splitlines()
    triple_re = re.compile(r"^[^:]+:\s+([\d.eE+-]+)\s+([\d.eE+-]+)\s+([\d.eE+-]+)$")
    triples = [triple_re.fullmatch(line) for line in gradient_lines[:3]]
    tail = re.fullmatch(
        r"48-layer no-BN check: max \|component\| ([\d.eE+-]+); "
        r"nonzero 108/108; float64 norm ([\d.eE+-]+)",
        gradient_lines[3] if len(gradient_lines) == 4 else "",
    )
    if not all(triples) or not tail:
        errors.append(f"{label}: depth-gradient diagnostic schema changed")
    else:
        values = [[float(match.group(i)) for i in range(1, 4)] for match in triples if match]
        if not (values[0][0] > values[0][1] > values[0][2] and values[0][2] < 1e-15):
            errors.append(f"{label}: no-BN gradient no longer visibly vanishes")
        if values[1][2] <= 1 or not all(0.05 <= value <= 2 for value in values[2]):
            errors.append(f"{label}: BN/residual gradient contrast changed")
        if float(tail.group(1)) >= 1e-20 or float(tail.group(2)) >= 1e-20:
            errors.append(f"{label}: 48-layer underflow-scale check changed")

    own = re.fullmatch(r"own trunk, source task \(7 classes\): (\d+\.\d+)%\n", actual[8])
    if not own or float(own.group(1)) < 70:
        errors.append(f"{label}: own-trunk source-task report changed materially")

    rows = actual[9].rstrip("\n").splitlines()
    row_re = re.compile(r"^\s*(0|1|6050|mean)\s+(\d+\.\d+)%\s+(\d+\.\d+)%\s+(\d+\.\d+)%$")
    parsed = [row_re.fullmatch(row) for row in rows[1:]] if rows[:1] == ["seed     scratch   own-trunk probe   ImageNet probe"] else []
    if len(parsed) != 4 or not all(parsed):
        errors.append(f"{label}: transfer table schema changed")
    else:
        values = [[float(match.group(i)) for i in range(2, 5)] for match in parsed if match]
        for column in range(3):
            # The three seed rows and the aggregate are each rounded to one
            # decimal independently; their displayed mean can differ by 0.1 pp.
            if abs(sum(row[column] for row in values[:3]) / 3 - values[3][column]) > 0.11:
                errors.append(f"{label}: transfer mean does not match seed rows")
        scratch, own_probe, image_probe = values[3]
        if not image_probe > scratch > own_probe:
            errors.append(f"{label}: transfer ordering changed")
        fine = re.fullmatch(r"fine-tuned \(last block \+ head\): (\d+\.\d+)%\n", actual[10])
        if not fine or float(fine.group(1)) <= max(scratch, image_probe):
            errors.append(f"{label}: fine-tuning no longer exceeds frozen/scratch means")
    return errors


def _ch16_relations(
    expected: Sequence[str], actual: Sequence[str], label: str
) -> list[str]:
    if len(expected) < 10 or len(actual) < 10:
        return [f"{label}: expected at least ten stdout blocks in both transcripts"]
    expected_seeds = [6050, 6051, 6052, 6053, 6054]
    expected_digests = [
        "c42c1c2b4baf",
        "f0c73c85e0e3",
        "20ec620b3e2e",
        "c93bd2a03038",
        "87a781e7efa8",
    ]
    head_re = re.compile(r"^seed (\d+), schedule ([0-9a-f]{12})$")
    model_re = re.compile(
        r"^  (CNN|ViT): train (\d+\.\d+), validation \[([^]]+)\], "
        r"benchmark (\d+\.\d+)$"
    )
    records: list[dict[str, tuple[Decimal, list[Decimal], Decimal]]] = []
    errors: list[str] = []
    for offset, block in enumerate(actual[4:9]):
        lines = block.rstrip("\n").splitlines()
        head = head_re.fullmatch(lines[0]) if len(lines) == 3 else None
        models = [model_re.fullmatch(line) for line in lines[1:]] if head else []
        if not head or len(models) != 2 or not all(models):
            errors.append(f"{label}: malformed seed report at block {offset + 5}")
            continue
        if int(head.group(1)) != expected_seeds[offset] or head.group(2) != expected_digests[offset]:
            errors.append(f"{label}: seed/schedule digest changed at block {offset + 5}")

        before_tokens = [_decimal(token) for token in _NUMBER_RE.findall(expected[4 + offset])]
        after_tokens = [_decimal(token) for token in _NUMBER_RE.findall(block)]
        if len(before_tokens) != 15 or len(after_tokens) != 15:
            errors.append(f"{label}: metric field count changed at block {offset + 5}")
        else:
            # One seed, then CNN train/5 validation/benchmark, followed by the
            # same seven fields for ViT. These are empirical bounds from the
            # reviewed macOS-arm64/Ubuntu-x64 comparison, not generic slack.
            tolerances = (
                Decimal(0),
                Decimal("0.003"),
                *([Decimal("0.011")] * 5),
                Decimal("0.001"),
                Decimal("0.001"),
                *([Decimal("0.066")] * 5),
                Decimal("0.024"),
            )
            for field, (before, after, tolerance) in enumerate(
                zip(before_tokens, after_tokens, tolerances), start=1
            ):
                if abs(after - before) > tolerance:
                    errors.append(
                        f"{label}: block {offset + 5} field {field} moved "
                        f"from {before} to {after}, beyond {tolerance}"
                    )
        record: dict[str, tuple[Decimal, list[Decimal], Decimal]] = {}
        for match in models:
            assert match
            validation = [
                _decimal(item.strip()) for item in match.group(3).split(",")
            ]
            values = [
                _decimal(match.group(2)),
                *validation,
                _decimal(match.group(4)),
            ]
            if len(validation) != 5 or not all(
                value.is_finite() and 0 <= value <= 1 for value in values
            ):
                errors.append(f"{label}: invalid metric vector at block {offset + 5}")
            record[match.group(1)] = (values[0], validation, values[-1])
        if set(record) != {"CNN", "ViT"} or record.get("ViT", (0, [], 0))[0] < 0.999:
            errors.append(f"{label}: model rows or ViT train fit changed")
        records.append(record)
    if len(records) != 5 or any(set(record) != {"CNN", "ViT"} for record in records):
        return errors

    summary_re = re.compile(
        r"^(CNN|ViT): train (\d+\.\d+)%; clean validation (\d+\.\d+)%; "
        r"benchmark (\d+\.\d+)%; validation at 4px (\d+\.\d+)%$"
    )
    summary_matches = [summary_re.fullmatch(line) for line in actual[9].rstrip("\n").splitlines()]
    if len(summary_matches) != 2 or not all(summary_matches):
        return [*errors, f"{label}: aggregate summary schema changed"]
    summaries = {
        match.group(1): [_decimal(match.group(i)) for i in range(2, 6)]
        for match in summary_matches
        if match
    }
    expected_summary_tokens = [
        _decimal(token) for token in _NUMBER_RE.findall(expected[9])
    ]
    actual_summary_tokens = [
        _decimal(token) for token in _NUMBER_RE.findall(actual[9])
    ]
    if len(expected_summary_tokens) != 8 or len(actual_summary_tokens) != 8:
        errors.append(f"{label}: aggregate metric field count changed")
    elif any(
        abs(after - before) > Decimal("0.8")
        for before, after in zip(expected_summary_tokens, actual_summary_tokens)
    ):
        errors.append(f"{label}: aggregate metric moved beyond 0.8 percentage point")
    for model in ("CNN", "ViT"):
        recomputed = [
            Decimal(100) * sum(record[model][0] for record in records) / 5,
            Decimal(100) * sum(record[model][1][0] for record in records) / 5,
            Decimal(100) * sum(record[model][2] for record in records) / 5,
            Decimal(100) * sum(record[model][1][4] for record in records) / 5,
        ]
        if any(
            abs(left - right) > Decimal("0.06")
            for left, right in zip(recomputed, summaries[model])
        ):
            errors.append(f"{label}: {model} summary does not match five seed rows")
    cnn, vit = summaries["CNN"], summaries["ViT"]
    if (
        cnn[1] - vit[1] < Decimal(2)
        or cnn[2] - vit[2] < Decimal(2)
        or cnn[3] - vit[3] < Decimal(20)
    ):
        errors.append(f"{label}: CNN clean/benchmark/shift advantage changed materially")
    if (vit[1] - vit[3]) <= Decimal(2) * (cnn[1] - cnn[3]):
        errors.append(f"{label}: ViT no longer degrades at least twice as much under shift")
    return errors


def _float_tokens(block: str) -> list[float]:
    return [float(_decimal(token)) for token in _NUMBER_RE.findall(block)]


def _small_experiment_relations(slug: str, actual: Sequence[str]) -> list[str]:
    """Protect the conclusions behind otherwise local numeric tolerances."""

    label = f"{slug} structural contract"
    if slug == "06-generalization-inductive-bias":
        if len(actual) < 3:
            return [f"{label}: expected three stdout blocks"]
        fields = [_float_tokens(actual[index]) for index in range(3)]
        if any(len(values) != 2 for values in fields):
            return [f"{label}: generalization report schema changed"]
        (train, validation), (shift_zero, shift_two), (original, shuffled) = fields
        errors: list[str] = []
        if train <= validation:
            errors.append(f"{label}: train/validation generalization gap disappeared")
        if shift_zero - shift_two < 25:
            errors.append(f"{label}: two-pixel shift cliff is no longer material")
        if abs(original - shuffled) > 2:
            errors.append(f"{label}: pixel-shuffle control moved by more than 2 pp")
        return errors

    if slug == "learning-by-experiment":
        if len(actual) < 2:
            return [f"{label}: expected two stdout blocks"]
        fields = _float_tokens(actual[1])
        if len(fields) != 22:
            return [f"{label}: paired-contrast report schema changed"]
        shared_means = [fields[index] for index in (7, 10, 13, 16)]
        tuned, locked = fields[18], fields[20]
        errors = []
        if not (
            all(value > 0 for value in shared_means[:3])
            and shared_means[3] < 0
        ):
            errors.append(f"{label}: shared-learning-rate contrast signs changed")
        if abs(tuned) > 2 or abs(locked) > 3:
            errors.append(f"{label}: tuned or locked contrast left its declared scale")
        return errors

    if slug == "making-pca-learnable":
        if len(actual) < 3:
            return [f"{label}: expected three stdout blocks"]
        fields = _float_tokens(actual[2])
        if len(fields) != 14:
            return [f"{label}: autoencoder comparison schema changed"]
        plain_clean, plain_noisy = fields[1], fields[2]
        denoising_clean, denoising_noisy = fields[7], fields[8]
        errors = []
        if plain_clean >= denoising_clean:
            errors.append(f"{label}: clean-data reconstruction ordering changed")
        if denoising_noisy >= plain_noisy:
            errors.append(f"{label}: denoising advantage on noisy inputs disappeared")
        if fields[13] > 1e-12:
            errors.append(f"{label}: transposed-convolution adjoint check is too large")
        return errors

    if slug == "08-cnn":
        if len(actual) < 9:
            return [f"{label}: expected nine stdout blocks"]
        shifted = _float_tokens(actual[7])
        summary = _float_tokens(actual[8])
        if len(shifted) != 10 or len(summary) != 6:
            return [f"{label}: CNN shift report schema changed"]
        mlp = shifted[0::2]
        lenet = shifted[1::2]
        errors = []
        if mlp[0] <= lenet[0] or not all(
            right > left for left, right in zip(mlp[1:], lenet[1:])
        ):
            errors.append(f"{label}: clean/shift model ordering changed")
        if mlp[0] - mlp[-1] <= 0 or lenet[0] - lenet[-1] <= 0:
            errors.append(f"{label}: clean-to-shift degradation disappeared")
        mlp_clean, mlp_shift, lenet_clean, lenet_shift = (
            summary[0],
            summary[2],
            summary[3],
            summary[5],
        )
        if abs(mlp_clean - lenet_clean) > 3 or lenet_shift - mlp_shift < 15:
            errors.append(f"{label}: matched-clean shift advantage changed materially")
        return errors

    return []


def _structural_errors(
    slug: str,
    block: int,
    expected: str,
    actual: str,
    actual_blocks: Sequence[str],
) -> list[str]:
    label = f"{slug} stdout block {block}"
    if (slug, block) == ("10-sequences-rnn", 3):
        return _ch10_recall(actual, label)
    if (slug, block) == ("10-sequences-rnn", 6):
        body = _one_print_newline(actual)
        return (
            [f"{label}: sample block lacks its print newline"]
            if body is None
            else _generated_text_errors(body, label)
        )
    if (slug, block) == ("11-encoder-decoder", 4):
        return _ch11_error_gallery(actual, label)
    if (slug, block) == ("11-encoder-decoder", 5):
        return _ch11_beam(expected, actual, label)
    if (slug, block) == ("11-encoder-decoder", 6):
        return _ch11_beam_count(actual, label)
    if (slug, block) == ("14-self-attention-transformer", 5):
        return _ch14_protocol(expected, actual, label)
    if (slug, block) == ("14-self-attention-transformer", 8):
        return _ch14_rematch(actual_blocks, label)
    if (slug, block) == ("14-self-attention-transformer", 10):
        return _ch14_samples(actual, label)
    if slug in {"09-modern-cnns-transfer", "16-vit-scaling"}:
        # The cross-block validator is invoked once after the block loop.
        return []
    return [f"{label}: structural rule has no validator"]


def _relation_errors(
    slug: str, expected: Sequence[str], actual: Sequence[str]
) -> list[str]:
    label = f"{slug} structural contract"
    if slug == "09-modern-cnns-transfer":
        return _ch9_relations(actual, label)
    if slug == "16-vit-scaling":
        return _ch16_relations(expected, actual, label)
    return _small_experiment_relations(slug, actual)


def _warning_errors(
    slug: str, stderr_by_surface: Mapping[str, str]
) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    accepted: list[str] = []
    nonempty = {surface: text for surface, text in stderr_by_surface.items() if text}
    expected_surface = "surface-007"
    if slug != "05-backpropagation":
        for surface in sorted(nonempty):
            errors.append(f"{slug} {surface}: unexpected stderr")
        return errors, accepted

    for surface in sorted(set(nonempty) - {expected_surface}):
        errors.append(f"{slug} {surface}: unexpected stderr")
    warning = nonempty.get(expected_surface, "")
    if not warning:
        errors.append(f"{slug} {expected_surface}: expected non-leaf .grad warning is absent")
        return errors, accepted
    if warning.count("UserWarning:") != 1:
        errors.append(f"{slug} {expected_surface}: expected exactly one UserWarning")
    required = (
        "The .grad attribute of a Tensor that is not a leaf Tensor is being accessed",
        'print(f"non-leaf grad:  {y_hat.grad}")',
    )
    for fragment in required:
        if fragment not in warning:
            errors.append(f"{slug} {expected_surface}: warning lost {fragment!r}")
    if "Traceback (most recent call last)" in warning or re.search(
        r"\b(?:Error|Exception):", warning
    ):
        errors.append(f"{slug} {expected_surface}: stderr contains an exception")
    if not errors:
        accepted.append(
            f"{slug} {expected_surface}: accepted intentional non-leaf .grad UserWarning"
        )
    return errors, accepted


def compare_stdout_blocks(
    slug: str,
    expected_blocks: Sequence[str],
    actual_blocks: Sequence[str],
    *,
    expected_ordinals: Sequence[int] | None = None,
    actual_ordinals: Sequence[int] | None = None,
) -> ComparisonResult:
    """Compare ordered visible stdout using exact-by-default contracts."""

    errors: list[str] = []
    accepted: list[str] = []
    if (expected_ordinals is None) != (actual_ordinals is None):
        errors.append(f"{slug}: stdout cell ordinals were supplied for only one transcript")
    elif expected_ordinals is not None and actual_ordinals is not None:
        if len(expected_ordinals) != len(expected_blocks):
            errors.append(f"{slug}: expected stdout/cell-ordinal counts differ")
        if len(actual_ordinals) != len(actual_blocks):
            errors.append(f"{slug}: actual stdout/cell-ordinal counts differ")
        if tuple(expected_ordinals) != tuple(actual_ordinals):
            errors.append(
                f"{slug}: stdout moved between native cells: expected "
                f"{tuple(expected_ordinals)}, got {tuple(actual_ordinals)}"
            )
    if len(expected_blocks) != len(actual_blocks):
        errors.append(
            f"{slug}: stdout block count changed: expected {len(expected_blocks)}, "
            f"got {len(actual_blocks)}"
        )
    for block, (expected, actual) in enumerate(
        zip(expected_blocks, actual_blocks), start=1
    ):
        if expected == actual:
            continue
        key = (slug, block)
        label = f"{slug} stdout block {block}"
        if key in NUMERIC_RULES:
            block_errors = _numeric_errors(
                expected, actual, NUMERIC_RULES[key], label
            )
            kind = "numeric"
        elif key in STRUCTURAL_RULES:
            block_errors = _structural_errors(
                slug, block, expected, actual, actual_blocks
            )
            kind = "structural"
        else:
            block_errors = [f"{label}: differs from the exact reference"]
            kind = "exact"
        errors.extend(block_errors)
        if not block_errors and kind != "exact":
            accepted.append(
                f"{label}: accepted {kind} portability deviation "
                f"({PORTABILITY_LEDGER[key].description})"
            )

    relation_errors = _relation_errors(slug, expected_blocks, actual_blocks)
    errors.extend(relation_errors)
    return ComparisonResult(not errors, tuple(errors), tuple(accepted))


def compare_notebook_outputs(
    slug: str,
    expected_stdout: Sequence[str],
    actual_stdout: Sequence[str],
    stderr_by_surface: Mapping[str, str] | None = None,
    expected_ordinals: Sequence[int] | None = None,
    actual_ordinals: Sequence[int] | None = None,
) -> ComparisonResult:
    """Compare stdout and the explicit stderr policy for one notebook."""

    stdout = compare_stdout_blocks(
        slug,
        expected_stdout,
        actual_stdout,
        expected_ordinals=expected_ordinals,
        actual_ordinals=actual_ordinals,
    )
    stderr_errors, stderr_accepted = _warning_errors(
        slug, stderr_by_surface or {}
    )
    errors = (*stdout.errors, *stderr_errors)
    accepted = (*stdout.accepted_deviations, *stderr_accepted)
    return ComparisonResult(not errors, errors, accepted)


def compare_stderr_outputs(
    slug: str, stderr_by_surface: Mapping[str, str]
) -> ComparisonResult:
    """Apply the exact-by-default stderr ledger without comparing stdout."""

    errors, accepted = _warning_errors(slug, stderr_by_surface)
    return ComparisonResult(not errors, tuple(errors), tuple(accepted))


def _validate_ledger() -> None:
    if set(NUMERIC_RULES) & set(STRUCTURAL_RULES):
        raise AssertionError("a stdout block cannot have two portability rule kinds")
    if set(NUMERIC_JUSTIFICATIONS) != set(NUMERIC_RULES):
        raise AssertionError("every numeric rule needs one specific justification")
    if set(PORTABILITY_LEDGER) != set(NUMERIC_RULES) | set(STRUCTURAL_RULES):
        raise AssertionError("public portability ledger is out of sync")
    for key, rule in NUMERIC_RULES.items():
        fields = rule.mutable_fields
        if not fields or len(fields) != len(set(fields)) or any(i < 1 for i in fields):
            raise AssertionError(f"{key}: mutable field indices must be unique and positive")
        overrides = [field for field, _, _ in rule.field_tolerances]
        if len(overrides) != len(set(overrides)) or not set(overrides) <= set(fields):
            raise AssertionError(f"{key}: invalid per-field tolerance override")
        if rule.atol < 0 or rule.rtol < 0 or any(
            atol < 0 or rtol < 0 for _, atol, rtol in rule.field_tolerances
        ):
            raise AssertionError(f"{key}: tolerances must be nonnegative")


def _self_test() -> None:
    exact = compare_stdout_blocks("demo", ["x = 1\n"], ["x = 1\n"])
    assert exact.passed and not exact.accepted_deviations
    changed = compare_stdout_blocks("demo", ["x = 1\n"], ["x = 2\n"])
    assert not changed.passed
    moved = compare_stdout_blocks(
        "demo",
        ["x = 1\n"],
        ["x = 1\n"],
        expected_ordinals=[3],
        actual_ordinals=[4],
    )
    assert not moved.passed

    rule = NumericRule(atol=0.1, mutable_fields=(1,))
    assert not _numeric_errors("metric 1.00%\n", "metric 1.05%\n", rule, "test")
    assert _numeric_errors("seed 6050\n", "seed 6051\n", rule, "test")
    assert _numeric_errors("metric: 1.0\n", "renamed: 1.0\n", rule, "test")
    protected = NumericRule(atol=1.0, mutable_fields=(2,))
    assert _numeric_errors(
        "lr=0.01 metric=70.0%\n",
        "lr=0.02 metric=70.1%\n",
        protected,
        "test",
    )
    assert _numeric_errors("metric 1.00%\n", "metric 1.0%\n", rule, "test")

    warning = (
        "/tmp/ipykernel_1/2.py:9: UserWarning: The .grad attribute of a Tensor "
        "that is not a leaf Tensor is being accessed.\n"
        '  print(f"non-leaf grad:  {y_hat.grad}")\n'
    )
    errors, accepted = _warning_errors(
        "05-backpropagation", {"surface-007": warning}
    )
    assert not errors and accepted


_validate_ledger()


if __name__ == "__main__":
    _self_test()
    print(
        f"PASS: {len(PORTABILITY_LEDGER)} typed stdout exceptions; "
        "exact comparison remains the default"
    )
