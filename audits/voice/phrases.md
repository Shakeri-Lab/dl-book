# Signature-phrase ledger (V3)

Book-wide counts on rendered HTML over every visible text class (prose, captions,
callouts, exercises, sources, plan steps, alt text and tables, headings; replay
panels excluded), and the count inside the sentences this pass added. Caps apply to
added sentences only and fail `audit_voice_ledger.py --check`; baseline and restored
uses are reported, never rewritten to meet a cap. The other phrases are habit words
(S5): thin baseline uses only where one page carries three or more.

| phrase | cap on added | before | now | in added sentences | pages with 3+ now |
|---|---|---:|---:|---:|---|
| "One caution" | blocking, 0 | 0 | 0 | 0 | none |
| "that is the whole" | blocking, 0 | 0 | 0 | 0 | none |
| "By the end" (promise formula) | blocking, 2 | 2 | 3 | 1 | none |
| "you will be able to" | blocking, 1 | 0 | 0 | 0 | none |
| "in one sentence" | blocking, 0 | 3 | 3 | 0 | none |
| "deliberately" | report only | 36 | 32 | 1 | 15-bert-pretraining 4 |
| "honest", "honestly", "honesty" | report only | 38 | 29 | 1 | none |
| "is exactly" | report only | 23 | 22 | 0 | 03-nonlinearity-mlp 3, 11-encoder-decoder 3 |
| "Here is the" | report only | 13 | 13 | 0 | none |
| verdict form "X is the whole Y" | blocking, 0 | 3 | 4 | 0 | none |

## Pages that carry the phrases now

| page | one_caution | that_is_the_whole | by_the_end | you_will_be_able_to | in_one_sentence | deliberately | honest | is_exactly | here_is_the | is_the_whole |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| index | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 |
| a2-tensors | 0 | 0 | 0 | 0 | 0 | 2 | 1 | 1 | 0 | 0 |
| a3-precision-performance | 0 | 0 | 0 | 0 | 0 | 2 | 1 | 0 | 0 | 0 |
| a4-notation | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| a5-statistical-learning | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| epilogue | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 |
| attention-as-test-time-regression | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 | 0 |
| learning-by-experiment | 0 | 0 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | 0 |
| making-pca-learnable | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| 01-linear-regression | 0 | 0 | 0 | 0 | 0 | 2 | 2 | 2 | 1 | 1 |
| 02-logistic-softmax | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 |
| 03-nonlinearity-mlp | 0 | 0 | 0 | 0 | 1 | 0 | 2 | 3 | 0 | 0 |
| 04-training-loss-sgd | 0 | 0 | 0 | 0 | 2 | 1 | 2 | 1 | 2 | 0 |
| 05-backpropagation | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 2 | 2 | 0 |
| 06-generalization-inductive-bias | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 2 | 0 | 0 |
| 07-filters-convolution | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 1 |
| 08-cnn | 0 | 0 | 1 | 0 | 0 | 1 | 2 | 0 | 1 | 1 |
| 09-modern-cnns-transfer | 0 | 0 | 0 | 0 | 0 | 1 | 2 | 2 | 2 | 0 |
| 10-sequences-rnn | 0 | 0 | 0 | 0 | 0 | 2 | 2 | 0 | 1 | 0 |
| 11-encoder-decoder | 0 | 0 | 0 | 0 | 0 | 1 | 2 | 3 | 0 | 0 |
| 12-kernel-regression | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 1 |
| 13-attention | 0 | 0 | 1 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |
| 14-self-attention-transformer | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 1 | 0 |
| 15-bert-pretraining | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 |
| 16-vit-scaling | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 | 0 | 0 |
| 17-peft-quantization | 0 | 0 | 0 | 0 | 0 | 2 | 1 | 0 | 0 | 0 |
| 18-alignment | 0 | 0 | 0 | 0 | 0 | 2 | 2 | 0 | 0 | 0 |
| 19-generative | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |
| 20-multimodal | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 | 0 | 0 |
