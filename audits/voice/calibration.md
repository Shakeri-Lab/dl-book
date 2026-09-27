# Ledger pattern calibration (Chapters 1 and 13)

Calibration set: the baseline render of commit `86ec60b`, rendered HTML of Chapter 1
and Chapter 13, class A prose unless a row says otherwise. Every hit printed by

```bash
python scripts/audit_voice_ledger.py --hits <page.html> --metric <name> --classes <classes>
```

was labelled by hand as a true positive (TP) or false positive (FP). The target was
precision of at least 0.8 on the pooled calibration set. After the changes below the
patterns are frozen in `scripts/audit_voice_ledger.py` and restated in `VOICE.md`.

## Guards (classes A, B, C)

Starter patterns from the brief, with one change: `just` was removed from the first
pattern (`, not just ...`). Book-wide it matched three sentences, all rhetorical
contrasts and none limiting a claim ("Let us see that, not just assert it"; "not just
on the isolated update"; "not just the last").

| Chapter | Hit | Label |
|---|---|---|
| 1 | "Writing the inverse is notation, not an algorithm." | TP |
| 1 | caption: "needs only the local slope, not a view of the whole bowl" | FP (explanatory contrast) |
| 1 | caption: "a before-and-after solve, not an optimization trajectory" | TP |
| 1 | "Mean squared error is not an arbitrary penalty." | FP (rhetorical setup) |
| 1 | caption: "it does not claim that every modern model follows one U-shaped path" | TP |
| 1 | callout: "bias and variance are not a mechanical see-saw" | TP |
| 1 | callout: "that rate is not a universal law for modern models" | TP |
| 13 | caption: "it is arithmetic, not a trained result" | TP |
| 13 | callout: "It does not make every attention score a classical kernel." | TP |
| 13 | "one conceptual family, not a single inevitable historical derivation" | TP |
| 13 | "a variance-control rationale, not a promise that trained projections ..." | TP |
| 13 | caption: "seeded synthetic draws about concentration, not a claim about ..." | TP |
| 13 | "Scaling corrects the dimension-induced spread; it does not normalize the vectors." | TP |
| 13 | caption: "so this is not a parameter- or compute-matched ablation" | TP |
| 13 | callout: "It does not isolate bottleneck removal as the only possible cause." | TP |
| 13 | "internal allocation weights, not calibrated confidence and not a causal explanation" | TP |
| 13 | "without any guarantee that they will" | TP |
| 13 | "Padding is excluded before softmax; zero is not a mask." | TP |

Precision: Chapter 1 5/7, Chapter 13 11/11, pooled **16/18 = 0.89**.

Recall is not the target, but the misses matter for S1 because S1 is applied by
reading each section, not by the regex. Hand-read misses in Chapter 13 include "reaches
higher accuracy in fewer epochs and optimizer updates, not in less wall-clock time"
and "We did not match parameter count, computation, or minibatch order". A candidate
`, not <preposition>` pattern was tried and rejected: book-wide it mixed guards with
plain contrasts ("not as a defeated design", "not because stable softmax failed") at
about half precision.

## Verdicts (class A)

Starter rule: a sentence of at most twelve words that opens the text immediately after
a display equation, a cell output, or a figure. Pooled precision was 9/19 = 0.47, so
three conditions were added, each motivated by the false positives below: the sentence
must end with terminal punctuation (removes lead-ins that run into the next equation),
must not open with a transition or a first-person plan (`First`, `Next`, `Then`, `Now`,
`Notice`, `Here`, `Recall`, `Consider`, `We`, `Let`, `Finally`, `Before`, `After`), and
must not contain `will` (forward references are orientation, not verdicts).

| Chapter | Sentence after the event | Starter | Final |
|---|---|---|---|
| 1 | "Our goal is a flexible function f such that" | FP | removed |
| 1 | "That second clause is the whole game." | TP | TP |
| 1 | "We will assume this distinction is familiar and use it precisely." | FP | removed |
| 1 | "The condition ... says the residual is orthogonal to every feature column." | TP | TP |
| 1 | "It must therefore live in the column space of X." | TP | TP |
| 1 | "First, synthetic data." | FP | removed |
| 1 | "Two lines, and we recover the truth up to the noise floor." | TP | TP |
| 1 | "The three methods now support the same diagnostic:" | FP | removed |
| 1 | "Loss-versus-step plots will recur throughout the book." | FP | removed |
| 1 | "Maximum likelihood asks which w, b make the observed dataset most probable." | FP | FP |
| 1 | "Maximizing this log-likelihood is exactly minimizing the sum of squared residuals." | TP | TP |
| 1 | "This is the master pattern that continues in Chapter 2." | TP | TP |
| 1 | "Now we can name what the picture separated." | FP | removed |
| 13 | "This is Chapter 12's fixed matrix ... with a learned score." | TP | TP |
| 13 | "Their sum produces ... match features." | FP | FP |
| 13 | "The resulting tensors have shapes" | FP | removed |
| 13 | "Only the projected query and key widths must agree." | TP | TP |
| 13 | "The score's standard deviation grows as sqrt(d_k)." | TP | TP |
| 13 | "Notice what changed relative to Chapter 11." | FP | removed |

Final precision: Chapter 1 6/7, Chapter 13 3/4, pooled **9/11 = 0.82**. No true
positive was lost.

## Metaphor lexicon (class A)

The K2 lexicon as given (knob, landscape, slope, downhill, hood, engine, relay,
handoff, bottleneck, bridge, address, template, filter sliding, dial, referee, ruler).
Chapter 1: 16 hits, all figurative (knobs, the loss landscape, feeling the slope,
stepping downhill, the validation set that referees). Chapter 13: 14 hits, all
figurative (hard and soft address, the bridge and handoff between sequences, the
finite-state bottleneck, the relay, the key as a template, the temperature dial).
Pooled precision **30/30 = 1.0**. Expect lower precision in Part II, where "template"
and "filter" are also technical terms; the metric warns and never blocks.

## Markers counted by construction

`chapter_refs` (`\bChapters?\s+\d+`), `reader_address` (you, your, yours, yourself),
`we_count`, and the register markers match literal strings, so their precision is
1.0 by construction. Two corrections came from the book-wide survey:

- Contractions: "Part I's" matched the pronoun rule. The pattern now lists the
  contracted forms per pronoun (`I'll`, `I'm`, `I'd`, `I've`; never `I's`).
- Quoted and cited material: "Language Models Don't Always Say What They Think" and
  "Not What You've Signed Up For" are cited titles in Chapter 17's Sources, and
  "Lecture 6.5 [em dash] RMSProp" is a cited lecture title in Chapter 4's Sources. The check
  exempts every R2 to R6 hit inside curly quotation marks (any class) or inside an
  italic, cite, or q element in class E, and prints each exemption.

`simply_just` is reported but never blocks: whether "just" means "only" or is emphasis
needs a reader (S4).
