# Author corrections at the B2a gate

One commit outside the voice rules, on the author's instruction (September 27, 2026).
Each row quotes the printout (or page element) the corrected prose now matches. Code,
outputs, and figures are unchanged.

## Prose that contradicted a printed number (B1)

| page | before | after | printout it matches |
|---|---|---|---|
| Chapter 8, the rematch | "managed 76% and 43%." | "managed 76% and 42%." | MLP at a two-pixel shift: `42.0%` |
| Chapter 13, matched-schedule rematch | "$53.8\%$" | "$53.75\%$" | epoch 6, fixed-state baseline: `53.75%` |
| TTR interlude, Solver 3 | "the delta recurrence in three lines:" | "in two lines:" | the aligned display that follows has two lines |
| Chapter 1, regularization | "cuts the damage several-fold" | "cuts the damage nearly threefold" | weight MSE `1.2347` → `0.4400` (2.8 times) |
| Chapter 9, batch normalization | "the BN column holds" | "the BN row holds" | two printed rows: `without BN layer stds` and `with BN layer stds` |
| Chapter 17, rank bottleneck | "below $10^{-7}$ relative correction error" | "below $10^{-6}$" | rank 6 and 8 print `0.000000` at six decimals; the code is unchanged |
| Chapter 6, Experiment 1 | "the accuracy is nearly cut in half." | "the accuracy falls from 76.0% to 46.5%." | `shift 0px: validation accuracy 76.0%`, `shift 2px: validation accuracy 46.5%` |
| Chapter 11, beam search | "Others include a high-scoring hybrid" | "One pair includes a high-scoring hybrid" | one hybrid among four pairs: `'1995-09-20'` for truth `'1995-09-02'` |
| Chapter 11, beam search | "it does not install a calendar constraint." | "it does not install a rule that copies each source field." | the hybrid `1995-09-20` is a valid calendar date, so no calendar rule would reject it |
| Chapter 10, the sample | "markdown furniture (asterisks, pipes, colons), and the book's working vocabulary (training, batch, layer, convolution in various misspellings)" | "markdown furniture (headings, display-math dollar signs, backslashed macros), and the book's working vocabulary (gradient, optimized, and misspelled cousins)" | the sample prints `$$`, `## Exercise`, `\logit_i`, `$\rightarrow$`, "The gradient", "optimized" |
| Chapter 10, the memory test | "the vanilla cell must fail" | "should fail" | vanilla RNN at lag 80: `25%` / `100%` / `25%`, not a uniform failure |

## Content fixes the author chose from B2

| page | before | after | why |
|---|---|---|---|
| Chapter 6 | "changed only the test images" | "changed only the validation images" | Experiment 1 prints `validation accuracy` |
| Chapter 10 | "Chunk sampling *is* truncated backpropagation through time:" | "Chunk sampling *is* fixed-window training:" | the page's own definition: fixed-window training, not truncated BPTT, because no state is carried between windows |
| PCA interlude | "changing the corruption and target changes" | "changing the corruption changes" | the target is the clean image in both arms |
| Chapter 9 | "collapses by an order of magnitude within a few layers and keeps sagging." | "... within a few layers and never recovers: every later layer stays between 0.043 and 0.061." | `without BN layer stds: 0.344  0.059  0.043  0.046  0.049  0.061` |
| Chapter 8 | "the output is linear in $V$" | "linear in the kernel $K$" | $V$ is not yet defined on the page; the plan and code call the kernel `K` |
| Chapter 17 | adapter display ends "$+\vect{b}_{\mathrm{up}},$" | ends with a period | a new sentence ("This module adds ...") follows the display |

## Left for the author (B2)

Chapter 11's teacher-forcing default and the six-point gap; Chapter 9's transfer
claims ("into nearly the same point" against a 70.6% probe); Chapter 9's decision-rule
tip, which rests on the course assignment and is also an independence hit for the press
brief; and every other B2 item in `stage_b2a_report.md`.
