# Voice ledger delta

`ledger_before.csv` to `ledger_after.csv`, one row per page, sorted by distance from the Part I profile after the change. Rates are per 1,000 words of class A prose; `a → b` marks a change. Part I profile: reader_address_per1k 4.264, verdicts_per1k 1.622, metaphor_hits_per1k 5.822, guards_A_per1k 1.192, chapter_refs_A_per1k 5.911. Bands: warmth at least 0.6 times the profile, guards at most 1.25 times, chapter references at most 1.5 times, at most two in the opener and in any paragraph.

| page | distance before → after | reader_address_per1k | verdicts_per1k | metaphor_hits_per1k | guards_A_per1k | chapter_refs_A_per1k | chapter_refs_opener | chapter_refs_max_paragraph | words_A | let_us | aka | exclamation | contractions | em_dash | bands after |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| p5-pretrained-era | 12.074 → 12.074 | 0.0 | 0.0 | 0.0 | 15.385 | 0.0 | 0 | 0 | 130 | 0 | 0 | 0 | 0 | 0 | reader_address_per1k: low (<2.56); verdicts_per1k: low (<0.97); metaphor_hits_per1k: low (<3.49); guards_A_per1k: high (>1.49) |
| p2-vision | 6.805 → 6.805 | 0.0 | 0.0 | 9.009 | 9.009 | 0.0 | 0 | 0 | 111 | 0 | 0 | 0 | 0 | 0 | reader_address_per1k: low (<2.56); verdicts_per1k: low (<0.97); guards_A_per1k: high (>1.49) |
| 18-alignment | 3.78 → 3.78 | 0.0 | 3.747 | 2.044 | 5.109 | 2.384 | 1 | 3 | 2936 | 2 | 0 | 0 | 0 | 0 | reader_address_per1k: low (<2.56); metaphor_hits_per1k: low (<3.49); guards_A_per1k: high (>1.49); chapter_refs_max_paragraph: high (>2) |
| attention-as-test-time-regression | 3.459 → 3.38 | 0.0 → 0.715 | 2.163 → 2.144 | 2.163 → 2.144 | 5.047 → 5.004 | 5.768 → 5.718 | 1 | 2 | 1387 → 1399 | 0 | 0 | 0 | 0 | 0 | reader_address_per1k: low (<2.56); metaphor_hits_per1k: low (<3.49); guards_A_per1k: high (>1.49) |
| making-pca-learnable | 3.333 → 3.333 | 0.0 | 5.461 | 4.778 | 3.413 | 0.0 | 0 | 0 | 1465 | 2 | 0 | 0 | 0 | 0 | reader_address_per1k: low (<2.56); guards_A_per1k: high (>1.49) |
| 15-bert-pretraining | 3.24 → 3.24 | 0.0 | 4.171 | 0.962 | 4.171 | 4.171 | 2 | 3 | 3117 | 1 | 0 | 0 | 0 | 0 | reader_address_per1k: low (<2.56); metaphor_hits_per1k: low (<3.49); guards_A_per1k: high (>1.49); chapter_refs_max_paragraph: high (>2) |
| 12-kernel-regression | 3.19 → 3.19 | 0.0 | 6.289 | 0.699 | 1.398 | 7.687 | 1 | 2 | 1431 | 2 | 0 | 0 | 0 | 0 | reader_address_per1k: low (<2.56); metaphor_hits_per1k: low (<3.49) |
| a5-statistical-learning | 3.071 → 3.071 | 0.838 | 3.35 | 0.0 | 4.188 | 2.513 | 1 | 1 | 1194 | 0 | 0 | 0 | 0 | 1 | reader_address_per1k: low (<2.56); metaphor_hits_per1k: low (<3.49); guards_A_per1k: high (>1.49) |
| 16-vit-scaling | 2.886 → 2.886 | 0.0 | 1.309 | 1.964 | 4.255 | 2.946 | 2 | 2 | 3055 | 2 | 0 | 0 | 0 | 0 | reader_address_per1k: low (<2.56); metaphor_hits_per1k: low (<3.49); guards_A_per1k: high (>1.49) |
| 19-generative | 2.702 → 2.702 | 0.0 | 4.733 | 0.43 | 2.582 | 2.151 | 0 | 2 | 2324 | 2 | 0 | 0 | 0 | 0 | reader_address_per1k: low (<2.56); metaphor_hits_per1k: low (<3.49); guards_A_per1k: high (>1.49) |
| a4-notation | 2.647 → 2.647 | 0.0 | 0.0 | 1.164 | 3.492 | 1.164 | 1 | 1 | 859 | 0 | 0 | 0 | 0 | 1 | reader_address_per1k: low (<2.56); verdicts_per1k: low (<0.97); metaphor_hits_per1k: low (<3.49); guards_A_per1k: high (>1.49) |
| index | 2.618 → 2.618 | 13.333 | 0.0 | 1.111 | 1.667 | 1.667 | 0 | 2 | 1800 | 0 | 0 | 0 | 0 | 0 | verdicts_per1k: low (<0.97); metaphor_hits_per1k: low (<3.49); guards_A_per1k: high (>1.49) |
| 17-peft-quantization | 3.247 → 2.56 | 0.0 → 0.299 | 3.031 → 2.991 | 1.212 → 1.197 | 4.547 → 3.59 | 3.031 → 2.692 | 3 → 2 | 3 → 2 | 3299 → 3343 | 1 → 0 | 0 | 0 | 0 | 0 | reader_address_per1k: low (<2.56); metaphor_hits_per1k: low (<3.49); guards_A_per1k: high (>1.49) |
| p1-lines-to-networks | 2.236 → 2.236 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0 | 0 | 100 | 0 | 0 | 0 | 0 | 0 | reader_address_per1k: low (<2.56); verdicts_per1k: low (<0.97); metaphor_hits_per1k: low (<3.49) |
| p4-attention | 2.236 → 2.236 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0 | 0 | 122 | 0 | 0 | 0 | 0 | 0 | reader_address_per1k: low (<2.56); verdicts_per1k: low (<0.97); metaphor_hits_per1k: low (<3.49) |
| p3-sequences | 2.15 → 2.15 | 0.0 | 0.0 | 10.417 | 0.0 | 0.0 | 0 | 0 | 96 | 0 | 0 | 0 | 0 | 0 | reader_address_per1k: low (<2.56); verdicts_per1k: low (<0.97) |
| a3-precision-performance | 2.148 → 2.148 | 0.0 | 3.364 | 0.0 | 2.617 | 4.86 | 0 | 2 | 2675 | 1 | 0 | 0 | 0 | 1 | reader_address_per1k: low (<2.56); metaphor_hits_per1k: low (<3.49); guards_A_per1k: high (>1.49) |
| 14-self-attention-transformer | 1.944 → 1.944 | 0.0 | 3.063 | 0.34 | 2.383 | 7.828 | 3 | 2 | 2938 | 0 | 0 | 0 | 0 | 0 | reader_address_per1k: low (<2.56); metaphor_hits_per1k: low (<3.49); guards_A_per1k: high (>1.49); chapter_refs_opener: high (>2) |
| learning-by-experiment | 1.875 → 1.875 | 0.0 | 0.738 | 1.845 | 2.583 | 2.214 | 1 | 2 | 2710 | 2 | 0 | 0 | 0 | 0 | reader_address_per1k: low (<2.56); verdicts_per1k: low (<0.97); metaphor_hits_per1k: low (<3.49); guards_A_per1k: high (>1.49) |
| epilogue | 1.81 → 1.81 | 1.753 | 1.169 | 1.753 | 2.922 | 2.922 | 0 | 1 | 1711 | 0 | 0 | 0 | 0 | 0 | reader_address_per1k: low (<2.56); metaphor_hits_per1k: low (<3.49); guards_A_per1k: high (>1.49) |
| 20-multimodal | 1.795 → 1.795 | 0.0 | 1.869 | 0.0 | 0.0 | 3.271 | 2 | 2 | 2140 | 2 | 0 | 0 | 0 | 0 | reader_address_per1k: low (<2.56); metaphor_hits_per1k: low (<3.49) |
| a1-linear-algebra | 1.647 → 1.647 | 2.223 | 3.335 | 0.556 | 1.668 | 2.223 | 3 | 3 | 1799 | 3 | 0 | 0 | 0 | 1 | reader_address_per1k: low (<2.56); metaphor_hits_per1k: low (<3.49); guards_A_per1k: high (>1.49); chapter_refs_opener: high (>2); chapter_refs_max_paragraph: high (>2) |
| a2-tensors | 1.536 → 1.536 | 3.275 | 3.275 | 0.546 | 1.092 | 9.825 | 3 | 5 | 1832 | 2 | 0 | 0 | 0 | 1 | metaphor_hits_per1k: low (<3.49); chapter_refs_A_per1k: high (>8.87); chapter_refs_opener: high (>2); chapter_refs_max_paragraph: high (>2) |
| 07-filters-convolution | 1.449 → 1.449 | 0.0 | 1.696 | 7.634 | 0.0 | 5.937 | 2 | 1 | 1179 | 0 | 0 | 0 | 0 | 0 | reader_address_per1k: low (<2.56) |
| 10-sequences-rnn | 1.384 → 1.384 | 4.947 | 0.928 | 1.546 | 2.474 | 6.494 | 1 | 2 | 3234 | 0 | 0 | 0 | 2 | 0 | verdicts_per1k: low (<0.97); metaphor_hits_per1k: low (<3.49); guards_A_per1k: high (>1.49) |
| 08-cnn | 1.243 → 1.243 | 2.919 | 1.824 | 2.554 | 1.824 | 11.31 | 2 | 3 | 2741 | 0 | 0 | 0 | 1 | 0 | metaphor_hits_per1k: low (<3.49); guards_A_per1k: high (>1.49); chapter_refs_A_per1k: high (>8.87); chapter_refs_max_paragraph: high (>2) |
| 13-attention | 1.921 → 1.234 | 0.0 → 0.912 | 1.82 → 1.824 | 6.369 → 6.384 | 2.73 → 1.824 | 11.829 → 10.488 | 4 → 2 | 3 → 2 | 2198 → 2193 | 1 → 0 | 0 | 0 | 0 | 0 | reader_address_per1k: low (<2.56); guards_A_per1k: high (>1.49); chapter_refs_A_per1k: high (>8.87) |
| 05-backpropagation | 1.173 → 1.173 | 4.189 | 3.046 | 3.046 | 1.142 | 2.285 | 2 | 2 | 2626 | 1 | 0 | 0 | 0 | 0 | metaphor_hits_per1k: low (<3.49) |
| 02-logistic-softmax | 1.098 → 1.098 | 4.338 | 1.085 | 6.508 | 0.0 | 7.592 | 1 | 2 | 922 | 0 | 0 | 0 | 0 | 0 | ok |
| 06-generalization-inductive-bias | 1.324 → 1.001 | 1.246 → 1.614 | 1.246 → 1.211 | 5.401 → 5.246 | 2.493 → 2.018 | 6.232 → 4.439 | 4 → 0 | 4 → 2 | 2407 → 2478 | 0 | 0 | 0 | 0 | 0 | reader_address_per1k: low (<2.56); guards_A_per1k: high (>1.49) |
| 01-linear-regression | 1.042 → 0.981 | 2.731 → 2.723 | 2.731 → 2.723 | 6.243 → 6.223 | 0.78 → 1.167 | 2.341 → 2.334 | 0 | 2 | 2563 → 2571 | 1 → 0 | 1 → 0 | 0 | 0 | 0 | ok |
| 09-modern-cnns-transfer | 0.878 → 0.878 | 2.743 | 1.371 | 1.371 | 1.028 | 5.142 | 2 | 2 | 2917 | 1 | 0 | 1 | 5 | 0 | metaphor_hits_per1k: low (<3.49) |
| 04-training-loss-sgd | 0.748 → 0.748 | 4.792 | 1.997 | 6.789 | 1.997 | 6.39 | 3 | 3 | 2504 | 0 | 0 | 0 | 0 | 0 | guards_A_per1k: high (>1.49); chapter_refs_opener: high (>2); chapter_refs_max_paragraph: high (>2) |
| 11-encoder-decoder | 0.535 → 0.535 | 3.07 | 2.193 | 4.386 | 1.316 | 5.263 | 2 | 4 | 2280 | 0 | 0 | 0 | 0 | 0 | chapter_refs_max_paragraph: high (>2) |
| 03-nonlinearity-mlp | 0.465 → 0.465 | 4.969 | 1.242 | 3.727 | 1.242 | 5.59 | 2 | 3 | 1610 | 1 | 0 | 0 | 0 | 0 | chapter_refs_max_paragraph: high (>2) |
