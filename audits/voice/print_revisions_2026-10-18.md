# Print revisions carried into the HTML edition (2026-10-18)

On October 18, 2026 the author approved three passes on the Springer print edition and had them written
to the print master: a notation pass (print rules R2 and R3), the rules pass for Chapters 4, 6 and 9
(rules R1 to R16), and a density pass that reduced what the print edition carries while keeping every
idea. The author then asked for the changes to be carried into this edition.

**Source.** The print master of October 18, compared with its snapshot of the same morning. The print
records are in the print project: `reports/rules-audit-2026-10-18/` (notation and rules pass) and
`reports/density-2026-10-18/` (one register per chapter, with a row per change).

**What this edition takes.** The rules of the October 16 carry hold: the wording reaches every sentence
this edition shares with print, the interactive animations stay intact, and this edition keeps its
structure. Two further rules follow from the density pass itself:

- **This edition is the companion.** The density pass moved check digits, set-up details, training
  settings, printed samples and derivations out of print and into the Companion experiments, and those
  experiments are this edition's own cells. Those rows are not carried: the cells and the prose around
  them keep what print moved here.
- **Figures, tables, boxes and sections stay.** Print removed some floats, moved two boxes into a
  "Deeper dive", merged one section and turned one display into a footnote, all to save pages. This
  edition keeps them, and keeps the sentences that point to them. A print edit justified by a figure
  that only print has (a TikZ schematic) is not carried either, because here the prose is the only place
  that states the point.

This carry touches no code apart from one figure caption's notation. Every changed chapter was
re-rendered on the reference machine, which also brings the freezes up to the notation commit's sources:
all 27 units' frozen stdout blocks are byte-identical to `main`, and the HTML and TeX freezes match. Two
Chapter 10 figures whose labels the notation renamed (`fig-residual-stream`, `fig-gradient-highway`)
take their new renders; every other figure file keeps its earlier bytes (the re-render changed only
their PDF creation dates).

## Notation (print rules R2 and R3)

The notation branch of the same morning (`1a9b356`) carried the renames that matched exactly and
re-ran the cells whose figures carry the symbols. This carry completes it:

- Chapter 16 (`14-self-attention-transformer.qmd`): bold matrices ($\matr{X}$, $\matr{Q}$, $\matr{K}$,
  $\matr{V}$, $\matr{W}_Q$, ..., $\matr{P}$, $\matr{S}$, $\matr{M}$, $\matr{O}_h$), $N_h$ heads of width
  $D_h$, head index $h$, and the FFN column $\vect{u}_j$; the shape chains and $BN_hn^2$.
- Chapter 12: the index of the direct cell-state path, $\vect{\gamma}_{t-\ell}$, now matches its product.
- Chapter 20: the scale denominator is $q_{\max}$, as its numerator already was.
- Chapter 19: the image index of the encoder input is $i$.

The animation panels keep their earlier symbols (the author's rule of October 16: the animations stay
intact). Five panels show a symbol the chapter has since renamed: momentum-memory and step-length
($\alpha$, now $\eta$), gate-product and identity-lane ($L$, now $\loss$; identity-lane also $H(x)$, now
$u$), and quantization-grid ($Q$, now $q_{\max}$). Changing them is a visual change, left for the author.

## Rules pass, Chapters 4, 6 and 9

| Chapter | Carried | Not carried (wording differs here, or absent) |
|---|---|---|
| 4 (`04-training-loss-sgd.qmd`) | the three pointers two or more chapters ahead (warmup, aggregate posterior, beam width); the lead of the optimizer comparison; "small enough for the steep direction"; the strength of the penalty | "averaging coefficients"; "no bias term" |
| 6 (`06-generalization-inductive-bias.qmd`) | the leads of both experiments; 76.0% stated once (the prediction prompt, the shift result, the protocol note now points to the baseline); the first-layer bias vector; the statistical bias versus inductive bias | "1,000 for fitting (training)"; the retrained-network sentence |
| 9 (`08-cnn.qmd`) | the lead of the kernel recovery; "once, with one seed"; the lead of the shift rematch; the attention footnote two chapters ahead | the figure pointer of the shift rematch |

## Density pass

Row ids are those of the print registers (`reports/density-2026-10-18/chNN-register.md`).

| Chapter | Carried | Kept here, and why |
|---|---|---|
| 9 (`08-cnn.qmd`) | D9-03 the reopened test set | D9-01, D9-02 check digits (companion) |
| 10 (`09-modern-cnns-transfer.qmd`) | D10-02 the reopened benchmark (one sentence keeps the `X_te` name); D10-04 digits restated; D10-08 the head of Chapter 2 restated; D10-09 NiN's full-data number; D10-17 the caption's digits restated | D10-01, D10-03, D10-12, D10-14 to D10-16, D10-18 companion; D10-05 this edition's own sentence on the two modes; D10-06, D10-10, D10-13 boxes; D10-07 justified by a print-only figure; D10-11 this edition's caption does not describe the projection shortcut |
| 11 (`making-pca-learnable.qmd`) | D11-03 the reopened benchmark | D11-01, D11-02, D11-04 companion |
| 12 (`10-sequences-rnn.qmd`) | D12-01 the six goals compressed where defined, named by the designs that fail them, not rescored in the last section; D12-02 the four-tools preview; D12-13 the third-run restatement; D12-16 the temperature of Chapter 2 restated; D12-18 the second analogy | D12-03 listing notes print-only; D12-04 print-only figure; D12-05, D12-06, D12-08, D12-14 companion; D12-07, D12-12 print-only text; D12-15 this edition's wording; D12-09 to D12-11, D12-17 figures, structure, the sample |
| 13 (`11-encoder-decoder.qmd`) | D13-04 the protocol restated; D13-13 the gap arithmetic; D13-14 the checkpoint digits of the caption; D13-17 the 70/30 ratio restated | D13-01 to D13-03 companion; D13-06, D13-12 print-only figure; D13-19, D13-21 not in this edition |
| 15 (`13-attention.qmd`) | D15-02 the protocol restated; D15-03 the reopened test split; D16-16 the Luong paper summary (its Sources entry stays) | D15-01, D15-04 not in this edition |
| 16 (`14-self-attention-transformer.qmd`) | D16-11 the reopened tail; D16-17 Xiong et al. at length (the Sources entry gains the finding); D16-21 weight sharing restated; D16-22 parallelism restated; D16-24 the trade-offs section keeps the KV cache and the hand-offs | D16-01 to D16-10 companion or print-only; D16-12 here it leads into the code; D16-13 to D16-15 shapes kept with print-only notes and figures; D16-18, D16-19 boxes and prose stay in place; D16-20, D16-23, D16-25 to D16-29 figures, tables, structure, samples |
| 18 (`15-bert-pretraining.qmd`) | D18-01 the sentence the next lines derive; D18-03 the downstream controls restated; D18-05 the corruption stream restated; D18-06 the 2018 paragraph folded into its table (the links move into the rows); D18-08 the three conditions listed twice | D18-01, D18-02 digits (companion); D18-02 here the definition already follows the first use in prose; D18-09, D18-10 print-only; D18-11 to D18-13 tables and figure |
| 19 (`16-vit-scaling.qmd`) | D19-03 pooling, position and warmup details to Sources; D19-09 the reopened benchmark in the Trap box; D19-10 the JFT subsets to Sources; D19-11 DeiT's token to Sources; D19-12 ConvNeXt compressed; D19-13 the two meanings restated; D19-15, D19-16 restatements; D19-18 the floor sentence moves to where $E$ is defined; D19-22 the frontier table's values to Sources; D19-23 the ratio arithmetic | D19-01, D19-02, D19-04 to D19-08 companion; D19-14, D19-17, D19-19 to D19-21 worked lines, derivations and secondary numbers stay with their cells; D19-24 to D19-26 tables |
| 20 (`17-peft-quantization.qmd`) | D20-12 the scale and ablation findings compressed; D20-14 the merge check, which the tips box states | D20-02, D20-03, D20-08 this edition prints those numbers in prose, not in tables; the rest companion or figures |
| 21 (`18-alignment.qmd`) | D21-01, D21-05 caption digits that repeat the text (the cells print them) | the rest companion |
| 22 (`19-generative.qmd`) | D22-01 the ELBO gap stated a third time; D22-11 cross-attention restated; D22-13 the sampler-settings paragraph compressed (its comment records why) | D22-10 box; D22-12 not in this edition; the rest companion or figures |
| 23 (`20-multimodal.qmd`) | D23-01 the protocol items | D23-02 companion; D23-03 this edition has no recall table, so the prose keeps the numbers |

Chapters 4, 5, 7, 8 and 17 had only check digits moved to the companion in print, so nothing carries.
Chapters 1, 2, 3, 6 and 14 had no density rows.

## Replays

The fixture literals of eight scenes in `interactives/manifest.json` follow the chapters' current text
(notation, one Chapter 6 sentence, and line breaks), and the receipts record the new chapter digests.
No panel, player, timeline or visual changed.

## Open

- The five animation panels named above show the earlier symbols.
- Print rows not carried stay as listed; a later pass can take any of them.
