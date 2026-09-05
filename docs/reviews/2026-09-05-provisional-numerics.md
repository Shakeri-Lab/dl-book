# Provisional prose reconciliation for the canonical runtime

These are source edits awaiting final-source execution, **not a promoted freeze**.
The original diagnostic source is
`1da26e860d6fa76ae6b76dede273748b1439128c`, executed by
[Actions run 33937390845](https://github.com/Shakeri-Lab/dl-book/actions/runs/33937390845).
The run failed the obsolete silent-cell coverage checker after all planned
unit/formats completed. Its failed status is preserved. The repaired execution
contract requires new physical notebook/preflight proof; none is manufactured
for this diagnostic run.

This ledger describes the prose-only reconciliation checkpoint. The subsequent
independent-repeat diagnosis adds an explicit CPU least-squares driver at seven
sites and replaces Appendix A1's tiny residual quote with a roundoff-scale
description; see `2026-09-05-linux-repeat-diagnosis.md`. Its separate numerical
method change is not covered by the unchanged-computation statement below.

The retrieved artifact is `canonical-freeze-candidate`, ID `9962913893`, archived
ZIP SHA-256 `a16733e3855731080880a1b89082cecae4cc2f5bdcaa385fd47cc329e0b581cb`.
Local root: `build/canonical-1da26e8-33937390845/`. Each source below names
`_freeze/chapters/UNIT/execute-results/html.json` relative to that root.
Native-cell numbers identify actual source cells, not stdout-block positions.
The matching TeX stdout is identical. Old quoted values refer to the committed
`c058d1f` freeze, not the dirty Mac refresh.

## Reconciliation ledger

| Unit / native cells | Change and boundary |
|---|---|
| `part1/05-backpropagation`, 7 | Largest hand/autograd gap is 5.59e-9, still float32 rounding. |
| `interludes/learning-by-experiment`, 3–4 | Selected validation means are 78.9%/79.2%; locked endpoint 77.3%/76.8%. Prose paired differences are rounded to match the scale of seed variation: separately tuned +0.3 pp (SD1.3), endpoint −0.5 pp (SD1.6). Different rates yield different effects; no universal BatchNorm winner. |
| `part2/08-cnn`, 13–14, 17 | Validation MLP75.5→41.5%, LeNet76.0→59.0% at two pixels. Sealed MLP82.3→41.5%, LeNet81.3→62.0%. Update caption, explanation, and recap without claiming an expected clean ranking. |
| `part2/09-modern-cnns-transfer`, 4, 6–9, 14–15 | VGG87.0%, NiN76.7%; NiN ends68.3% at four pixels. Plain/residual training64.4%/99.8%, benchmark53.7%/75.5%. Fix Chapter8 callback and approximate residual contrast; shoe-transfer interpretation stays a near tie. Pinned Rivanna results are separate evidence and unchanged. |
| `part3/11-encoder-decoder`, 7 | Five paired TF errors7/5/5/1/2 versus free-running2/2/1/2/4: means4.00(SD2.45)/2.20(SD1.10). Prose paired gain0.41 pp(SD0.71); TF wins two pairs. The independently seeded batch schedule is explicitly a protocol revision, not merely adding four seeds. |
| `part4/13-attention`, 12 | Recomputed fixed baseline exactly matches Chapter11; attention has zero errors in each finite437-source test panel. Prose paired gain0.92 pp(SD0.56). Earlier learning is the larger contrast; +59.2% parameters and computational confounds remain. Routing96.8% mass/99.5% top-key is one-seed validation evidence. Row-normalization identity remains strict. |
| `part4/14-self-attention-transformer`, 15–17 | Position train/held-out1.1138/1.9052 versus no-position1.8590/2.3500, gap0.4448(18.9%). The hardcoded LSTM1.888110429 comparator is identified as historical, not a freshly measured four-decimal baseline or robust architecture ranking. |
| `part4/16-vit-scaling`, 6–11 | CNN wins4/5 clean pairs and24/25 seed×shift comparisons. Mean validation CNN73.9%, ViT70.4%; benchmark77.9%/73.9%; shifted59.0%/24.8%. Update figure alt text and arc ledger, retaining protocol and causal limitations. |
| `part5/17-peft-quantization`, 6 | Full-update relative error3.05e-7; rank6/8 mean errors round to zero at displayed precision, which does not certify an unprinted tighter per-run bound. Frozen-base and merged-output checks remain. |
| `part5/20-multimodal`, 3 | Text-to-image endpoint0.9653(SD0.0090), paired contrast0.9627(SD0.0104). Other quoted summaries unchanged. Scope the true-pair versus shuffled result to this protocol. |
| `appendices/a1-linear-algebra`, 2, 5 | Normal-equation residual6.661e-16; centering reconstruction8.882e-16. State float64 precision instead of exact numerical reconstruction. |
| `appendices/a3-precision-performance`, 6 | Dense/online FP64 gap2.220e-16, not a claim of bitwise identity. |

Chapters1–4,7,12 have no changed stdout; other reviewed units with only unquoted
or sub-prose-precision changes need no edit. In particular, Chapter6's quoted
sealed80.8→42.0% result is unchanged, as are the TTR study table and its paired
contrasts. Chapters15,18,19 and the autoencoder interlude retain their bounded
interpretations. Detailed read-only review reports are
`build/diagnostic-prose-33937390845-{root,early,late}.md`; literal stdout diffs
and the inventory are under `build/diagnostic-linux-a-33937390845/`.

## Original execution-JSON checksums

All paths use the prefix and suffix specified above. These identify the actual
files supporting the source edits, even if the temporary working directories
are later removed. The source archive and raw diagnostic bundle must be retained
with the migration record; these hashes do not make a failed run acceptable.

| Unit | HTML JSON SHA-256 |
|---|---|
| `part1/05-backpropagation` | `f0aa98de6f40bf72738048d4b81425a644ec2faa13b9eb5a0a7d43199e472ec8` |
| `interludes/learning-by-experiment` | `40dc88d5e83d01466a80b818c0e9f7017494b56ea9196226864398b1c2beb4f4` |
| `part2/08-cnn` | `de0be8cbff062dbf2f709789fa3639e24600d93c99be25e20631592ce367a7a6` |
| `part2/09-modern-cnns-transfer` | `adffde9e297076bb5900e0a02a570ecd6093c2f0d442dbab95b8cd90bb20f69f` |
| `part3/11-encoder-decoder` | `435ca56274de371e46b5589b15b5c9fb3a81ccdee64d2a20173b00cd4a62a29e` |
| `part4/13-attention` | `ddd0c73c14ad8c716a8da8978489bc3af4511108d35de22e5a2fafc7ec308977` |
| `part4/14-self-attention-transformer` | `6706fa48a44b9cf21cf52e16039625fe356e3d3a2805ec67faa70689c8be82c2` |
| `part4/16-vit-scaling` | `7e234c90e712ac9655a60317d061c6b771bad785164563c322e869425c9c1d13` |
| `part5/17-peft-quantization` | `c2643cd92598db2fbf1fb007a85592fe3254e98bdfce0069bb9ed44b65afd718` |
| `part5/20-multimodal` | `0c20ea6fc6a8e91579a824f2704f34ca1e49d1ca3e61755eff2c01c8a6599fc9` |
| `appendices/a1-linear-algebra` | `56cca579840c7032d2ddbbf71c43eb55ef7d273bce2fed43e5b7bc36f9c3edab` |
| `appendices/a3-precision-performance` | `e5bf2b339694b6e21ea96022fa046dd19e809cc71f9d998f549eeb0b29b521c4` |

## Gate status

No training computation, seed, iteration count, control, numerical tolerance, or
frozen output is changed by these edits. All final-source Linux/Mac profiles,
the independent exact-image repeat, paired-runtime report, explicit promotion,
notebook execution, and derived-edition audits remain required. Different
runner CPUs are recorded observations, never a reason to waive exact canonical
agreement. Seed SD governs prose claims; paired runtime differences govern
reviewed portability tolerances. The two quantities are not interchangeable.
