#!/usr/bin/env python3
"""Pure semantic schemas for the five-seed date studies; no filesystem imports.

Error-count arithmetic and protocol identities are independent of portability.
No winner or historical outcome is required, and no runtime tolerance is granted.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal, localcontext
import re
from typing import Sequence


SEEDS = tuple(range(6050, 6055))
DENOMINATOR = 437
CHECKPOINTS = (2, 4, 6, 8, 12, 16, 20, 25)
# (freeze unit, one-based stdout block, native execution ordinal)
SLOTS = {
    11: ("chapters/part3/11-encoder-decoder", 3, 7),
    13: ("chapters/part4/13-attention", 6, 12),
}
CHAPTERS_BY_SLUG = {unit.rsplit("/", 1)[-1]: chapter
                    for chapter, (unit, _, _) in SLOTS.items()}
STDOUT_ORDINALS = {11: (1, 4, 7, 9, 11, 12), 13: (4, 5, 7, 9, 10, 12)}
PERCENT2 = r"(\d+\.\d{2})%"
PERCENT3 = r"(\d+\.\d{3})%"
ROW = re.compile(
    rf"(\d{{4}})\s+(\d+)/437\s+(\d+)/437\s+{PERCENT2}\s+{PERCENT2}"
    r"\s+([+-]\d+\.\d{3})")
CURVE = re.compile(
    rf"(\d+)\s+{PERCENT2}\s+\+/-\s+{PERCENT2}\s+"
    rf"{PERCENT2}\s+\+/-\s+{PERCENT2}")


@dataclass(frozen=True)
class Study:
    errors: tuple[tuple[int, int], ...]
    # Each checkpoint: left mean, left SD, right mean, right SD, in percent.
    curves: tuple[tuple[Decimal, Decimal, Decimal, Decimal], ...]


def mean_sd(values: list[Decimal]) -> tuple[Decimal, Decimal]:
    mean = sum(values) / len(values)
    variance = sum((value - mean) ** 2 for value in values) / (len(values) - 1)
    return mean, variance.sqrt()


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def printed(actual: str, value: Decimal, digits: int, label: str,
            signed: bool = False) -> None:
    expected = format(value, f"{'+' if signed else ''}.{digits}f")
    # Floating reductions may print -0.000 for a mathematically zero mean.
    same_zero = Decimal(actual) == 0 and Decimal(expected) == 0
    require(actual == expected or same_zero,
            f"{label}: printed {actual}; derived {expected} from integer errors")


def parameter_counts() -> tuple[int, int]:
    """Counts from the declared 37/14 vocabularies, embedding 32, hidden 128."""
    source_vocab, target_vocab, embed, hidden, alignment = 37, 14, 32, 128, 128

    def lstm(inputs: int) -> int:
        return 4 * hidden * inputs + 4 * hidden * hidden + 8 * hidden

    embeddings = (source_vocab + target_vocab) * embed
    fixed = embeddings + 2 * lstm(embed) + (hidden + 1) * target_vocab
    scorer = 2 * hidden * alignment + alignment
    attentive = (embeddings + lstm(embed) + scorer + lstm(embed + hidden)
                 + (2 * hidden + 1) * target_vocab)
    return fixed, attentive


def parse_study(text: str, chapter: int) -> Study:
    require(chapter in SLOTS, f"Unsupported chapter {chapter}")
    with localcontext() as context:
        context.prec = 60
        return _parse_study(text, chapter)


def _parse_study(text: str, chapter: int) -> Study:
    lines = iter(enumerate(text.splitlines(), 1))

    def take(pattern: str | re.Pattern, label: str) -> re.Match:
        try:
            number, line = next(lines)
        except StopIteration as exc:
            raise ValueError(f"Chapter {chapter}: missing {label}") from exc
        match = re.fullmatch(pattern, line.strip())
        require(match is not None,
                f"Chapter {chapter}, line {number}: invalid {label}: {line!r}")
        return match

    def literal(value: str) -> None:
        take(re.escape(value), value)

    names = ("TF", "FR") if chapter == 11 else ("fixed-state", "attention")
    header = ("seed   TF errors   FR errors   TF accuracy   FR accuracy   FR-TF pp"
              if chapter == 11 else
              "seed   fixed errors   attention errors   fixed acc   attention acc   delta pp")
    literal(header)
    errors = []
    for seed in SEEDS:
        row = take(ROW, f"seed {seed} row with denominator 437")
        require(int(row[1]) == seed, f"Chapter {chapter}: expected seed {seed}, got {row[1]}")
        left, right = int(row[2]), int(row[3])
        require(0 <= left <= DENOMINATOR and 0 <= right <= DENOMINATOR,
                f"Chapter {chapter}, seed {seed}: errors outside 0..437")
        errors.append((left, right))
        for col, error in enumerate((left, right)):
            accuracy = 100 * (1 - Decimal(error) / DENOMINATOR)
            printed(row[4 + col], accuracy, 2, f"seed {seed} {names[col]} accuracy")
        delta = 100 * Decimal(left - right) / DENOMINATOR
        printed(row[6], delta, 3, f"seed {seed} paired difference", signed=True)

    literal("mean / sample SD across five training seeds (errors out of 437):")
    for col, name in enumerate(names):
        summary = take(
            rf"{re.escape(name)} errors: (\d+\.\d{{2}}) / (\d+\.\d{{2}}); "
            rf"accuracy: {PERCENT3} / {PERCENT3}", f"{name} mean/sample SD")
        error_mean, error_sd = mean_sd([Decimal(row[col]) for row in errors])
        for actual, value, digits, quantity in (
            (summary[1], error_mean, 2, "mean errors"),
            (summary[2], error_sd, 2, "sample SD of errors"),
            (summary[3], 100 * (1 - error_mean / DENOMINATOR), 3, "mean accuracy"),
            (summary[4], 100 * error_sd / DENOMINATOR, 3, "sample SD of accuracy"),
        ):
            printed(actual, value, digits, f"{name} {quantity}")

    contrast = "FR-TF" if chapter == 11 else "attention-fixed"
    paired = take(rf"paired {contrast}: ([+-]\d+\.\d{{3}}) pp; "
                  r"sample SD (\d+\.\d{3}) pp", "paired mean/sample SD")
    differences = [100 * Decimal(left - right) / DENOMINATOR
                   for left, right in errors]
    delta_mean, delta_sd = mean_sd(differences)
    printed(paired[1], delta_mean, 3, "paired mean", signed=True)
    printed(paired[2], delta_sd, 3, "paired sample SD")
    literal("paired initialization and schedule checks: 5/5" if chapter == 11
            else "paired schedule checks: 5/5")
    literal("epoch   TF mean +/- SD        FR mean +/- SD (validation)" if chapter == 11
            else "epoch   fixed mean +/- SD     attention mean +/- SD (validation)")
    curves = []
    for epoch in CHECKPOINTS:
        row = take(CURVE, f"validation checkpoint {epoch}")
        require(int(row[1]) == epoch, f"Chapter {chapter}: missing/reordered epoch {epoch}")
        values = tuple(Decimal(row[i]) for i in range(2, 6))
        require(all(value.is_finite() and 0 <= value <= 100 for value in values),
                f"Chapter {chapter}, epoch {epoch}: nonfinite/out-of-range mean or SD")
        curves.append(values)

    if chapter == 11:
        witness = take(r"seed 6050 padding witness: naive errors (\d+)/437; "
                       r"packed TF errors (\d+)/437", "padding witness")
        require(0 <= int(witness[1]) <= DENOMINATOR, "Padding witness errors outside 0..437")
        require(int(witness[2]) == errors[0][0], "Padding witness is not seed 6050 TF")
    else:
        fixed, attentive = parameter_counts()
        increase = 100 * (Decimal(attentive) / fixed - 1)
        literal(f"parameters: baseline {fixed:,}; attention {attentive:,} (+{increase:.1f}%)")
        take(r"seed 6050 validation example: 'may 17, 1971' -> '[0-9?\-]{0,12}' "
             r"\(truth 1971-05-17\)", "predeclared validation example")
        alignment = take(rf"validation year-region mass: {PERCENT3}; "
                         rf"top key in region: {PERCENT3}", "alignment audit")
        require(all(0 <= Decimal(alignment[i]) <= 100 for i in (1, 2)),
                "Year-region proportions outside 0..100%")
        # Match NumPy's float64 mean of 1,600 integer indicators, then the
        # authored percent formatter (multiplication before division rounds
        # differently at some ties and would reject legitimate reports).
        require(alignment[2] in {f"{hits / 1600:.3%}"[:-1] for hits in range(1601)},
                "Top-key percentage is not on its 4-by-400 validation-count grid")
        normalization = take(r"maximum validation row-sum error: (\d\.\d{2}e[+-]\d{2,})",
                             "normalization identity")
        row_error = Decimal(normalization[1])
        require(row_error.is_finite() and 0 <= row_error < Decimal("1e-6"),
                "Attention row-sum error must remain strictly below 1e-6")
    require(next(lines, None) is None, f"Chapter {chapter}: unparsed trailing stdout")
    return Study(tuple(errors), tuple(curves))


def compare_baseline(ch11: Study, ch13: Study) -> None:
    for seed, left, right in zip(SEEDS, ch11.errors, ch13.errors):
        require(left[0] == right[0],
                f"Stale baseline at seed {seed}: Chapter 11 TF has {left[0]}/437 "
                f"errors, Chapter 13 fixed-state has {right[0]}/437")
    for epoch, left, right in zip(CHECKPOINTS, ch11.curves, ch13.curves):
        require(left[:2] == right[:2],
                f"Stale baseline validation mean/SD at epoch {epoch}")


def is_current_date_study(slug: str, blocks: Sequence[str]) -> bool:
    """Recognize current tables, including malformed rows needing rejection.

    Recognition is not validation. The expected transcript also participates in
    dispatch, so a damaged actual header cannot fall back to a legacy contract.
    """
    chapter = CHAPTERS_BY_SLUG.get(slug)
    if chapter is None:
        return False
    _, block, _ = SLOTS[chapter]
    return len(blocks) >= block and (
        blocks[block - 1].startswith("seed") or
        "sample SD across five training seeds" in blocks[block - 1])


def _valid_truth(value: str) -> bool:
    try:
        return date.fromisoformat(value).isoformat() == value
    except ValueError:
        return False


def _validate_gallery(text: str, study: Study) -> None:
    lines = text.splitlines()
    count = study.errors[0][0]
    require(len(lines) == 1 + min(3, count),
            "Error gallery must contain a summary and min(3, seed-6050 TF errors) samples")
    require(lines[0] == f"{count} errors on 437 unambiguous test dates; a sample:",
            "Error gallery count must equal seed-6050 TF errors out of 437")
    records = set()
    for line in lines[1:]:
        match = re.fullmatch(
            r"  '([^']+)' -> '([0-9?\-]{0,12})'   \(truth (\d{4}-\d{2}-\d{2})\)", line)
        require(match is not None, "Malformed date-error example")
        source, prediction, truth = match.groups()
        require(_valid_truth(truth), "Invalid truth date in error gallery")
        require(prediction != truth, "Purported date error equals its truth")
        records.add((source, prediction, truth))
    require(len(records) == min(3, count), "Error samples must be distinct records")


def _validate_beams(text: str) -> None:
    examples = text.rstrip("\n").split("\n\n")
    require(len(examples) == 4, "Expected four beam-search examples")
    sources = set()
    for example in examples:
        lines = example.splitlines()
        require(len(lines) == 3, "Each beam example must contain a header and two beams")
        header = re.fullmatch(
            r"'(\d{2}/\d{2}/\d{4})'   truth: '(\d{4}-\d{2}-\d{2})'   "
            r"greedy: '([0-9?\-]{0,12})'", lines[0])
        require(header is not None, "Malformed beam example header")
        source, truth, _ = header.groups()
        sources.add(source)
        require(_valid_truth(truth), "Invalid truth date in beam example")
        require(all(1 <= int(part) <= 12 for part in source.split("/")[:2]),
                "Beam source must be an ambiguous numeric date")
        scores = []
        for line in lines[1:]:
            beam = re.fullmatch(
                r"   beam: '[0-9\-]{0,12}'   joint log score = (-?\d+\.\d{2})", line)
            require(beam is not None, "Malformed beam row")
            score = Decimal(beam[1])
            require(score.is_finite() and score <= 0, "Beam log scores must be finite and nonpositive")
            scores.append(score)
        require(scores == sorted(scores, reverse=True), "Beam scores must be sorted descending")
    require(len(sources) == 4, "Beam examples must have four distinct sources")
    # A decoded string need not be a valid date. Filtering special tokens can
    # also make different beam paths decode identically. Neither is an identity.


def validate_date_stdout_schema(
    slug: str, blocks: Sequence[str], ordinals: Sequence[int] | None = None,
) -> list[str]:
    """Validate current date-study output semantics, separately from drift.

    This hook is scoped to Ch11/13's new studies and dependent galleries. It
    returns no claims about other slugs or earlier independent witness cells;
    callers retain exact/schema checks for those. Legacy date schemas are not
    accepted here. Runtime changes receive no tolerance from this function.
    """
    chapter = CHAPTERS_BY_SLUG.get(slug)
    if chapter is None:
        return []
    try:
        require(len(blocks) == 6, "Expected six stdout blocks")
        if ordinals is not None:
            require(tuple(ordinals) == STDOUT_ORDINALS[chapter],
                    f"Expected native stdout cells {STDOUT_ORDINALS[chapter]}, got {tuple(ordinals)}")
        _, block, _ = SLOTS[chapter]
        study = parse_study(blocks[block - 1], chapter)
        if chapter == 11:
            _validate_gallery(blocks[3], study)
            _validate_beams(blocks[4])
            match = re.fullmatch(r"beam-5 disagrees with greedy on (\d+) of 200 test dates\n", blocks[5])
            require(match is not None and 0 <= int(match[1]) <= 200,
                    "Beam/greedy disagreement count must be in 0..200 with denominator 200")
        else:
            require(blocks[4] == "fixed validation 400; final test 437\n",
                    "Fixed validation/test population must remain 400/437")
    except ValueError as exc:
        return [f"{slug} current date schema: {exc}"]
    return []
