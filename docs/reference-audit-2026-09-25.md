# Reference and citation audit — September 25, 2026

**Question.** Is any reference in the book hallucinated, misattributed, or misdescribed?

**Scope.** All 207 external links in the 35 manuscript `.qmd` files at `b94bc48`, plus every
unlinked attribution the audit teams found by reading each chapter in full (names with
years, historical dates, tables of works, numbers credited to a paper): 292 audited items.

**Answer.** No fabricated work. Every cited paper, book, standard, and documentation page
exists. Twelve defects were real and are fixed in the source: two dead links, one wrong
table number, one historical misattribution, one co-author misattribution, three
title/link mismatches, one byline that skipped eight authors, one wrong year, one
imprecise arithmetic description, and one internal file path in public text.

## Method

Two model families checked each other; no finding was accepted on one family's word.

1. **Claude, deterministic metadata pass.** arXiv API for all 57 arXiv IDs, Crossref for
   DOIs, `citation_*` meta tags for PMLR, NeurIPS, ACL Anthology, CVF, and JMLR pages, and
   followed redirects for documentation links. First author, author count, title, and year
   were compared with the resolved record; every flag was checked by hand. Hosts that block
   scripts (JSTOR, OpenReview) were checked in a real browser or through independent
   records; no human-verification challenge was bypassed.
2. **Gemini round 1** (Antigravity `/teamwork-preview`, four teams by Part): identity,
   metadata, and claim support for every link and prose attribution, with a fetched URL and
   a verbatim quote required for each verdict.
3. **Gemini round 2** (Gemini 3.1 Pro): a red team ruled on fifteen numbered claims and
   checked each proposed replacement; two sampler teams re-fetched 99 items round 1 had
   passed, testing whether each round-1 quote actually appears at its source.
4. **Claude, final verification.** Every confirmed item below was re-fetched and read
   before the manuscript was edited.

## Fixed

| File | Defect | Evidence | Fix |
|---|---|---|---|
| `part2/09-modern-cnns-transfer.qmd` | Yosinski et al. link 404 (stale NeurIPS hash) | NeurIPS 2014 index lists the paper at hash `532a2f85…` | corrected URL |
| `part3/11-encoder-decoder.qmd` | Sutskever, Vinyals & Le link 404 | NeurIPS 2014 index: hash `5a18e133…` | corrected URL |
| `epilogue.qmd` | "Table 3" of Wang et al. (2026) | arXiv 2603.09221 v1 and v2: Table 3 is a MATH-500 ablation; the fast/slow-weight × SSL/RL taxonomy is Table 4 | "Table 4" |
| `epilogue.qmd`, `part4/12-kernel-regression.qmd` (4 places) | "Wang, Yang, Vidal" byline | arXiv byline has 11 authors; Vidal is 11th | "Wang et al." / "Wang and colleagues" |
| `part3/10-sequences-rnn.qmd` | Cell with a forget gate credited to Hochreiter & Schmidhuber (1997) | Gers, Schmidhuber & Cummins (2000), *Neural Computation* 12(10):2451–2471, introduces the adaptive forget gate | attribution clarified; Gers et al. added to Sources |
| `epilogue.qmd` | Mixture of experts credited to "Hinton and colleagues" | Jacobs, Jordan, Nowlan & Hinton (1991), first author Jacobs (already in the epilogue's Sources) | full author list, 1991 |
| `part5/17-peft-quantization.qmd` | Title "LLM.int8()" linked to NeurIPS page titled "GPT3.int8()" | arXiv 2208.07339 carries the LLM.int8() title the chapter uses | link to arXiv |
| `part5/18-alignment.qmd` | "…from Human Feedback" linked to NeurIPS page titled "…with human feedback" | NeurIPS 2020 `citation_title` | "with" |
| `appendices/a3-precision-performance.qmd` | 2009 CACM Roofline title linked to the 2008 technical report (different title) | Crossref 10.1145/1498765.1498785 | link to the CACM DOI |
| `part1/06-generalization-inductive-bias.qmd` | Neal, *On the Bias–Variance Tradeoff*, dated 2020 | arXiv 1912.08286, 17 December 2019; thesis defended December 2019 | (2019) |
| `part4/16-vit-scaling.qmd` | "Their product is 1.92027" | $\alpha\beta\gamma=1.518$; the displayed quantity $\alpha\beta^2\gamma^2=1.92027$ | names the expression |
| `part1/04-training-loss-sgd.qmd` | Sources named the internal path `Resources/Gil Strang/SGD.pdf` | not public | path removed; Strang's book page linked |

## Checked and correct (flags that did not survive)

- **CS231n `#gradcheck` anchor** (flagged by Claude): valid; the page carries
  `<a name="gradcheck">` above the heading and links to it from its own contents.
- **Three "truncated" DOIs** (Hornik 1991; Baldi & Hornik 1989, twice): an artifact of the
  audit's own checklist extractor, which cut URLs at the first ")". The source and the
  published hrefs are complete.
- **OpenReview IDs** `Sy8gdB9xx` (Zhang et al., ICLR 2017), `Sy2fzU9gl` (Higgins et al.,
  β-VAE, ICLR 2017), and `Bkg6RiCqY7` (Loshchilov & Hutter, ICLR 2019): bound to the cited
  papers by independent reference lists and the ICLR 2019 schedule.
- **Wang et al. (2026), "ICML 2026"**: the arXiv record's comment field says ICML 2026.
- **Watson (1964)**, JSTOR 25049340: *Sankhyā* Series A 26(4), pp. 359–372.
- **Chinchilla table (Chapter 16)**: all six exponents, Kaplan's 0.73/0.27, and "more than
  400 language models" match Hoffmann et al. (2022) verbatim.
- **Tieleman & Hinton, "Lecture 6.5 — RMSProp" (2012)**: authentic and correctly dated.
- **Bellman and Fisher book-review DOIs**: the book cites neither DOI; the audit team had
  looked them up itself.
- **"Ben-Zaken"**: matches the printed proceedings PDF; the ACL BibTeX omits the hyphen.
- One-year differences between arXiv and proceedings dates (Adam, Zeiler & Fergus,
  Lin–Tegmark–Rolnick, Titans) and shortened titles are conventions, not errors.

## Warning about agent-produced evidence

The round-2 samplers could not find 66 of the 99 round-1 "verbatim" quotes at the cited
URL. Most were metadata fields stitched into a sentence, or passages from a paper's body
attributed to its landing page; several were invented outright. The underlying claims were
mostly right on re-check (89 of 99 still supported), but the round-1 ledger's evidence
column was not trustworthy on its own. Treat any agent-generated citation ledger as a list
of leads, not as verification.
