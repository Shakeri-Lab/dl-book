# Continuing the Book — Handoff & Roadmap

*Written 2026-07-09 after Chapter 11 shipped; updated 2026-07-16 for the structural,
course-alignment, test-time memory/control, release-polish, and v1.0 stewardship
passes. This is the master handoff document:
everything a fresh collaborator (human or Claude session, on any account) needs to
continue the project without the original conversation history. Read `CLAUDE.md`
(repo root) first for environment setup; read this second; read
`docs/arc-seeds.md` before drafting any chapter.*

---

## 1. Where the project stands

**Live:** https://shakeri-lab.github.io/dl-book/ (HTML + PDF, auto-deployed from
`main` via GitHub Actions → `gh-pages`).

| Part | Chapters | Status |
|---|---|---|
| I · From Lines to Networks | 1–6 | **Shipped; repair pass complete and verified** (July 11, 2026) |
| II · Vision | 7–9 | **Shipped; repair pass complete and verified** (July 11, 2026) |
| III · Sequences | 10–11 | **Shipped; repair pass complete and verified** (July 11, 2026) |
| IV · Attention | 12–16 | **Shipped; test-time memory spectrum extension verified** (July 15, 2026) |
| V · Pretrained Era | 17–20 | **Shipped and two-format verified** (July 15, 2026; ch. 19 revised, ch. 20 added) |
| Unnumbered bridges | Experimentation/HPO after ch. 6; PCA/autoencoders after ch. 9 | **Shipped and two-format verified** (July 15, 2026) |
| Epilogue | The Question Is Yours | **Shipped; memory-to-planning frontier verified** (July 15, 2026) |
| Appendices | A–D | **Shipped and verified** (Appendix C KV-cache bridge and Appendix D complete July 15, 2026) |

**Milestone 1** (Part I complete + skeleton) is met. The July 11 quantitative,
mathematical, licensing, evaluation-hygiene, and two-format repair pass over Chapters
1–11 is complete and shipped: every HTML/TeX freeze is newer than its source, key outputs
match across formats, and selected figures were visually verified. Chapter 12 is also
complete, with its fixed-kernel experiments pre-tested, frozen in both formats, and
verified in the full-book PDF. The author's own edit pass remains a separate gate rather
than a condition of either release.

The July 15 course-alignment pass adds two unnumbered bridges without renumbering any
chapter or changing existing chapter URLs. **Who Trains the Trainer? Learning by
Experiment** restores Module 3's empirical-science, HPO, and ablation spine. Its paired
Fashion study separates fixed-recipe effects from a tuned comparison. Across the four
predeclared shared learning rates, BatchNorm minus no BatchNorm is +22.800 percentage
points (paired SD 1.643) at 0.003, +10.200 (SD 1.681) at 0.01, +4.200 (SD 1.681) at
0.03, and -1.200 (SD 3.402) at 0.1. It is +0.300 (SD 1.095) after per-design
validation tuning and -1.267 (SD 1.146) on the locked, already-opened shared endpoint.
The reversal earns no winner; it teaches estimands, interactions, seed panels,
budgeted search, validation overtuning, and the experiment ledger.

**Making PCA Learnable** restores Module 6's intended order before recurrence:
fixed-size contract → PCA as a tied linear autoencoder → gradient-trained projector →
nonlinear curved reconstruction → convolutional/denoising autoencoders → the one-shot
encoder's variable-length limitation → Chapter 10's shared state update. The original
five-seed curve audit moved intact from Chapter 19. A new 16-dimensional-code convolutional
autoencoder experiment uses 900 fit/300 validation/600 reused endpoint images. Plain
clean training reaches mean clean/noisy endpoint MSE 0.020701/0.033263; denoising
training reaches 0.026294/0.023810. The changed input–target contract changes the learned
behavior. A separate
FP64 check verifies transposed convolution's adjoint identity; the prose explicitly
rejects the common “inverse convolution” interpretation.

The same pass adds inverted dropout and train/evaluation mode to Chapter 4, names data
augmentation as data-side inductive bias in Chapter 6, completes Appendix D's actual
notation/shape contract, and adds the unnumbered epilogue. The release repair changes
PDF `\vect`/`\matr` to `\symbf` and HTML MathJax to `\boldsymbol`, removes manual part
numerals, completes all recap titles, and labels Chapter 15's pretraining-family table.
The July 15 refresh executed all 28 book units in both formats, regenerated 26
HTML/TeX freeze pairs, and matched all 127 printed-output blocks. A frozen full render,
the 506-page PDF, and browser asset/alt/layout checks passed; that release followed the
normal `main` → `gh-pages` path.

The later July 15 **test-time memory/control extension** keeps the Chapter 11 → 12 →
13 → 14 bottleneck arc intact and turns Chapter 12's regression lens one rung further.
Chapter 12 now states the exact local-constant problem before using the phrase
“attention is regression” and identifies the 2024–26 research program. New §14.8
derives three statistical contracts from one online regression objective: retain the
key/value dataset, carry the factorized-kernel sufficient pair $(S_t,z_t)$, or update a
bounded delta-rule state. Chapter 10 supplies the forward promise; §14.7 and Appendix C
name the KV cache as the nonparametric estimator's dataset and distinguish
FlashAttention's schedule change from state compression. The epilogue adds a strictly
frontier-level memory-versus-planning landing and a scalar Riccati box—no differentiable
LQR implementation or architecture-survey detour.

All added derivations were pinned before prose. The local-constant stationarity
residual is `3.053e-16`; factorized traversal and running state differ by at most
`3.469e-17`; the explicit SGD and delta recurrences differ by `4.441e-16`; and the
scalar first-action gain moves from `-0.8181818` at horizon one to `-0.8233456` at
horizon ten. The sealed CPU recall study uses seed 6050, development tags 0/1, endpoint
tag 2, 30 repeats, $d\in\{8,16,32\}$, and $N/d\in\{0.5,1,2,4,8\}$. Softmax has zero
top-1 failures over 26,040 constructed queries; plain Delta recall falls from 0.988 to
0.134 across the load sweep. At $N/d=8$, the priority-bit gate changes priority recall
by `+0.387` (SD `0.156`) and ordinary recall by `-0.124` (SD `0.065`) relative to the
plain state. The caption discloses the unmatched side information and makes no
language-model, runtime, or architecture-ranking claim.

| $N/d$ | softmax | Delta | gated overall | gated priority | gated ordinary |
|---:|---:|---:|---:|---:|---:|
| 0.5 | 1.000 | 0.988 | 0.471 | 1.000 | 0.294 |
| 1 | 1.000 | 0.910 | 0.352 | 0.992 | 0.139 |
| 2 | 1.000 | 0.657 | 0.282 | 0.982 | 0.048 |
| 4 | 1.000 | 0.338 | 0.228 | 0.848 | 0.022 |
| 8 | 1.000 | 0.134 | 0.138 | 0.522 | 0.010 |

These are top-1 identification rates, not exact value interpolation: softmax's mean
value MSE is `5.43e-06`, and its maximum trial MSE is `4.55e-04`.

The complete frozen render is now 498 pages. Chapter 12's two-box addendum fits one
page, §14.8 fits nine pages, and the epilogue frontier fits two. Every affected unit was
executed in HTML and TeX; printed outputs match, the complete book renders, the affected
PDF ranges passed visual QA, and local browser checks confirm anchors, equations,
figures, alt text, and course-site interaction. The companion site adds the two research
lens readings to Modules 8/9, a timed 20-minute Module 10 outline and discussion prompt,
and five explained self-check questions. Its study guide, type check, 24-page production
export, styled browser layout, links, and answer reveal all pass.

The final July 15 release-polish pass removes four pure-schematic code listings while
preserving their source, adds format-aware counter notes to both interludes and the
epilogue, makes the preface's optional **Check yourself** scope accurate, and restores
Sources-before-Exercises order in Chapter 20 and Appendix B. Chapter 8 and Chapter 13
now distinguish a chapter-local or decision-inert endpoint from a globally untouched
test set. The memory-spectrum price list is numbered as Table 14.1. An audit of all 100
rendered HTML figure images found and closed five static-image alt-text gaps. Both
formats were regenerated, the four-page reduction was visually checked across every
affected range, and a PCA schematic overlap found during that check was repaired. The
same rerender exposed a latent reproducibility bug: Chapters 10 and 14 had read live
prose, so copyedits could move the corpus only when a freeze refreshed. Both now read an
immutable 148,594-character snapshot and assert its SHA-256, restoring the exact declared
benchmark outputs. A PDF index remains a separate editorial project because useful index
terms, subentries, and cross-references require a book-wide authoring pass rather than an
automatic build flag.

The July 16 **v1.0 stewardship pass** finishes that consistency sweep and establishes a
stable citation boundary. Fifteen additional concept schematics named in the review,
plus the same-class BERT adaptation schematic found by the audit, now fold their drawing
code while experiments, derivations, assertions, printed audits, and implementation
lessons remain visible. Six mixed cells were split before folding so that no evidence
was hidden. The preface now states the executable-source covenant precisely, names v1.0
and its archived PDF, and gives the suggested citation. `CITATION.cff` validates against
CFF 1.2.0; the book date is fixed at July 16, 2026; and HTML-only revision notes explain
the page-reference migration without adding a PDF chapter.

Four high-value tables are now numbered and cited: the experiment claim types, the
paired BatchNorm study contract, the alignment route choice, and the book's tensor-shape
dictionary. Existing format-aware notes remain the cheaper and accurate resolution for
the trainer interlude, PCA interlude, and epilogue counter inheritance. The final
498-page PDF was built from both execution formats, its metadata and key text were
checked, and every newly folded schematic plus the new tables and preface callout passed
page-level raster QA. This stewardship pass adds no chapter, experiment, or arc seed;
the seed ledger and GPU queue therefore retain their July 15 scientific contents.

The companion site continues to use a plural `bookChapters` field because modules and
chapters do not map one-to-one. The earlier July 15 alignment added the HPO and
autoencoder interludes plus Chapters 12–20 as primary readings, kept D2L as an
alternative, fixed Module 7's prerequisite, and repaired the syllabus's inaccurate
NumPy-spine wording. The memory/control material extends that shipped mapping; only its
prose remains covered by the general author edit gate.

Chapter 13 is also complete: additive and scaled dot-product attention are derived,
source-padding masking is exercised, and the Chapter 11 date benchmark has a
matched-schedule attention rematch plus a validation-only alignment audit. Its
implementation was independently derived after D2L-like source-code blocks were
removed from the public snapshot.

Chapter 14 is complete: self-attention, positional encoding, causal multi-head
attention, the pre-LayerNorm residual block, the FFN memory lens, and the regression
memory spectrum are derived and exercised. Its exact-schedule book-corpus rematch uses
132,488 parameters. In the matched seed, position lowers held-out loss from 2.3405 to
1.9190; the Chapter 10 LSTM narrowly remains ahead at 1.8881. The comparison is a
controlled case study, not an across-seed effect estimate. The new capacity study is a
separate synthetic mechanism test with a sealed endpoint, not a language-model rematch.

Chapter 15 is complete: causal visibility, full nonpadding visibility, MLM target
selection, and padding protection are separated explicitly; original BERT's
WordPiece/input recipe, MLM/NSP history, and full-backbone fine-tuning are derived.
Its book-original 43,920-parameter synthetic transfer lab repeats five end-to-end
seeds. At 1/2/4 labeled word types per family, MLM initialization raises mean
covered-type accuracy from 0.468/0.489/0.494 to 0.995/1.000/1.000 (paired gains
+0.526/+0.511/+0.506; 15/15 wins). Forty vocabulary-resident controls withheld
from MLM inputs, random replacements, and targets stay near chance: scratch
0.475/0.500/0.550 and MLM-initialized 0.425/0.440/0.430. Both arms fit the tiny
labeled sets perfectly. This is a synthetic mechanism demonstration—not a
natural-language or compute-efficiency claim.

Chapter 16 is complete at the manuscript and experiment level: patches, learned
position and `[CLS]`, ViT's inductive-bias trade, EfficientNet compound scaling,
and the Kaplan-to-Chinchilla allocation correction are derived and exercised. Its
book-original five-seed Fashion rematch uses an explicit paired minibatch schedule
for a 20,250-parameter CNN and 19,658-parameter ViT. The CNN wins all five clean
validation pairs and all 25 seed-by-shift validation comparisons; mean clean
accuracy is 0.739 versus 0.701, and mean four-pixel-shift accuracy is 0.589 versus
0.252. This is deliberately a tiny scratch regime—not a general CNN-versus-ViT
ranking. The corrected executed render passed in both formats, and all printed
HTML and TeX outputs matched exactly. A clean full-book render, browser
asset/layout checks, and complete Chapter 16 PDF visual QA also passed before
publication.

Chapter 17 is complete: prompting, retrieval as a separate context path, soft
prompts and prefixes, adapters and BitFit, LoRA, quantization, and QLoRA are
organized by backbone storage, incremental task state, and transient work. A
39,268-parameter frozen-context Transformer closely tracks the analytical information
ceilings of 0.25/0.50/0.75/1.00 accuracy at zero through three demonstrations while
every evaluation weight remains bitwise fixed. A five-seed planted rank-six audit shows
the LoRA capacity break exactly at rank six, with merged and unmerged paths agreeing
to `1.43e-06`. A controlled unequal-row quantization audit separates bit width from
granularity and metadata: at 8 bits, relative layer-output error is 0.0213 with one
scale and 0.0069 with per-row scales; at 4 bits it is 0.2695 and 0.1223. The chapter
makes no hardware-runtime claim. Corrected HTML and PDF outputs match exactly; the
full-book PDF, all six original figures, browser assets/layout, and the complete
Chapter 17 page range passed visual QA before publication.

Chapter 18 is complete: response-masked instruction SFT, preference measurement,
Bradley–Terry reward modeling, KL-regularized policy optimization, PPO's distinct old
and reference anchors, proxy overoptimization, DPO, and alignment evaluation are tied
into one measurement-first spine. Its completion-mask audit scores 3/4 response tokens
and is invariant to excluded-position perturbations. The scalar-preference study pins a
cyclic-model loss of 0.693147 against an unconstrained 0.610864 floor. The four-response
Gibbs and DPO policies agree to `5.55e-17` at beta one. In the five-seed designed-utility
study, narrow in-range feedback reaches held-out NLL 0.665633 yet collapses to utility
0.484541 under strong proxy pressure; adding 20% longer-response coverage retains
1.316470 in the same setting. The chapter calls these finite CPU mechanism tests—not
natural-language alignment results. Both execution freezes, all seven original
figures, browser layout/assets, and the complete PDF chapter range passed QA before
publication.

Chapter 19 is retitled **Generative Models: From Codes to Samples** and now begins at
the point the earlier autoencoder interlude promised: a code is not yet a distribution.
It harvests “A judge is not a generator,” then compares VAEs, GANs, and diffusion
through explicit sampling, training, and evaluation contracts. The scalar Gaussian
audit pins log evidence -1.602093 and a mismatched-ELBO gap of 0.931250, exactly equal
to posterior KL. The finite GAN audit separates covered/collapsed JSD
0.003253/0.183270 and exposes the 0.002473-versus-0.997527 saturating/non-saturating
gradient magnitudes. In the scalar diffusion study, time conditioning reaches noise
MSE 0.429707, central mass 0.019470, and Wasserstein distance 0.058570, versus
0.750689/0.223490/0.379806 with the identical network's time channel zeroed. The five remaining figures and executable
studies are book-original finite CPU mechanism tests—not natural-image or hardware
claims. Both execution freezes, the five figures, browser asset/layout checks, and the
complete PDF chapter range passed the July 15 integrated verification.

Chapter 20, **Multimodal Learning: One Space, Two Views**, closes Module 12's remaining
book gap. It turns Chapter 2's scores-to-weights machine into a symmetric cross-modal
contrastive objective, separates retrieval from generation, and bounds text-prototype
zero-shot classification by its candidate and prompt contract. Its five-seed paired
study reaches held-out image-to-text/text-to-image Recall@1 of 0.9747/0.9660; a matched
study-wide derangement reaches 0.0027/0.0027. The paired top-1 contrasts are
0.9720/0.9633. These are finite synthetic mechanism results, not natural image–language
benchmarks. Both execution freezes, the two figures, browser asset/alt/layout checks,
and the complete PDF chapter range passed the July 15 integrated verification.

Appendix A is complete: it consolidates matrix maps, affine bias, projection geometry,
`solve`, `lstsq`, condition-number squaring, reduced and batched SVD, low-rank
approximation, and centered PCA. Five deterministic PyTorch cells and three figures
pin the row-batch convention, a $(0.9,0.9)$ least-squares solution with orthogonal
residual, the $\kappa(A^\top A)\approx\kappa(A)^2$ trap, rank-one error, batched
reconstruction, and the PCA centering failure. The raw Box seeds' attributed framing
and quotations were not reused; sanitized topic-map snapshots and transcript hashes
record the provenance boundary. HTML and TeX stdout match exactly, and the complete
Appendix A PDF range and browser layout passed visual QA.

Appendix B is complete: it harvests Chapter 17's promise to gather tensor shape, dtype,
stride, and physical layout, beginning with the instructor's real
`(N,) + (N,1) -> (N,N)` broadcasting diagnosis. Seven deterministic PyTorch cells
verify `nn.Linear` storage, NCHW broadcasting, `expand` versus `repeat`,
views/strides/contiguity, batched `@` versus `einsum`, Boolean selection versus
shape-preserving masking, and dtype-aware factories. It makes no hardware claim and
contains no GPU placeholder. HTML and TeX stdout match exactly, and the complete
Appendix B PDF range and browser layout passed visual QA.

Appendix C is complete: it harvests the book's floating-point failures and separates
operand storage, evaluation, accumulation, and output precision. Seven deterministic
CPU cells pin FP16/BF16/FP32/FP64 range and spacing, rounded-away updates, accumulation
and cancellation order, stable softmax versus representational collapse, loss
scaling, and operation-specific autocast. A synthetic 100-TFLOP/s, 2-TB/s Roofline
establishes a 50-FLOP/byte ridge without making a device claim. The FlashAttention
recap derives online softmax, matches materialized attention to
`4.441e-16` in FP64, and distinguishes reduced I/O and working storage from unchanged
dense quadratic arithmetic. Both freezes and all printed outputs match; the complete
Appendix C PDF range, both original figures, and browser layout passed QA. It contains
no GPU placeholder or unmeasured speedup. Its KV-cache bridge now says explicitly that
FlashAttention changes the I/O schedule of the same nonparametric solve; the fixed-state
solvers in §14.8 change the statistical contract instead.

**Decisions still gated on the author:**
- The author's final prose/sign-off pass remains a separate gate after the technical
  release. For this extension it covers Chapter 10's two-sentence forward pointer;
  Chapter 12's precision/research boxes; §14.8 and its added exercises; Appendix C's
  KV-cache/schedule bridge; the epilogue taxonomy and Riccati frontier; the entire
  maintainer exercise bank; and the Modules 8–10 readings, outline, prompt, and five
  self-checks. The manuscript blocks and exercise bank retain their `NOVEL` markers;
  the pointer, part of Appendix C, and course-site data have no separate marker.
- "Deeper dive" collapsed sections: piloted in ch. 6; his verdict pending ("let us
  get back to deeper dive later"). The explicitly requested epilogue Riccati box is a
  one-off frontier treatment; it does not settle that global verdict or authorize
  retrofits in chs. 1/5.
- GPU experiments remain backlog-only until access is available. Do not publish
  placeholder callouts in chapters; run the queued experiments on Rivanna/Colab and
  fold real results back into the relevant chapters later.

## 2. The working protocol (refined over chapters 7–20 and Appendices A–D)

The single most important lesson of this project: **pre-test every experiment
regime before writing a word of prose.** Roughly half of all planned experiments
failed their first design (see §5 case law). The loop that works:

1. **Sources.** Read the chapter stub's `draft-sources` comment. Snapshot any
   unsnapshotted seed from Box into `sources/` (Box is not a stable source), applying
   the public-snapshot licensing boundary in `sources/README.md` before committing it.
   `git pull` in `~/dl-course-code`, read that module's `MODULE_NOTES.md` (the
   polished lecture spine — the preferred prose source), and read the transcripts
   (`[coding]_` prefix = his live-coding voice, defines code-narration style).
2. **Plan the experiments** — every figure and quantitative claim needs an
   executable cell behind it.
3. **Pre-test in the scratchpad** (a throwaway script outside the repo, run with
   `.venv/bin/python`): tune regimes until the phenomenon honestly appears; pin
   exact numbers, seeds, and wall-clock times. Iterate here, not in the chapter.
   If the textbook phenomenon will not appear honestly at CPU scale, reframe it (the
   honest null result IS often the better lesson — see ch. 9 transfer and ch. 10
   recall lottery) and record any full-scale follow-up in `docs/backlog.md`.
4. **Draft** the full `.qmd` over the stub per `docs/drafting-template.md` +
   `docs/style-guide.md`. Keep the provenance comment. Wire the arc seeds
   (`docs/arc-seeds.md`) — both harvesting due seeds and planting contracted ones.
5. **Render the chapter — BOTH formats**: `quarto render chapters/…/XX.qmd`
   (NO `--to html` flag! An HTML-only render leaves the PDF freeze (`tex.json`)
   stale and the book PDF ships without your chapter — this bit us in ch. 8).
6. **Verify**: extract every printed output from
   `_freeze/…/execute-results/html.json` and check each against the prose; `Read`
   every generated figure PNG and check it against its caption (mis-captioned
   figures happened twice before this habit).
7. **Fix prose to match outputs** (never the reverse unless the experiment is
   wrong). Batch all fixes, then re-render once — *any* qmd edit invalidates the
   freeze and forces full re-execution (5–15 min for training-heavy chapters).
8. **Full book render** (`quarto render`), then verify the PDF picked up the
   chapter (`pdftotext … | grep <distinctive phrase>`).
9. **Commit** chapter + `_freeze/<chapter>/` + any new `sources/` snapshot
   together. Push; watch CI (`gh run list`); confirm the live URL (CDN caches —
   use a `?v=N` query to bust; if Pages serves stale content for >10 min, check
   `gh api repos/Shakeri-Lab/dl-book/pages/builds/latest` — a wedged "building"
   status is fixed by `gh api -X POST repos/Shakeri-Lab/dl-book/pages/builds`).
10. **Update state**: this file's §1 table, `docs/arc-seeds.md` (seeds planted /
    harvested), `docs/backlog.md` (GPU queue), and the next chapter's stub if its
    contract gained specifics.

**Budget expectations** (Apple Silicon, CPU): light chapters execute in ~1 min;
training-heavy ones (9, 10, 11, 13, 14) run 5–15 min. That is fine — execution is
one-time-local (freeze), CI never executes. Keep any *single* cell under ~4–5 min
and seed everything with `torch.manual_seed(6050)` (data variants may use fixed
generator seeds 0/1/2/100+L etc. — keep them deterministic).

## 3. Environment quick-recheck (new account)

Everything in CLAUDE.md §Environment still applies. On a fresh account verify:
- `~/dl-book` exists locally (NOT in Box) and `git remote -v` points to
  `Shakeri-Lab/dl-book`.
- `gh` authenticates via the `git credential fill` pattern (never echo the token).
- `.venv` intact: `.venv/bin/python -c "import torch; print(torch.__version__)"`.
- `~/dl-course-code` clone present; `git pull` before use; read-only.
- Box course materials at
  `~/Library/CloudStorage/Box-Box/Teaching/6050/` (LaTeX seeds, transcripts at
  `dl-course-site/transcripts/`, assignment at `4- Lecture CNN/assignment/`).
- Claude-account memory does NOT transfer. This file + `docs/arc-seeds.md`
  subsume it. If working with Claude Code, it will auto-load `CLAUDE.md`, which
  points here.

## 4. Standing author rules (accumulated from his feedback — binding)

A. **Style** (full detail in `docs/style-guide.md`, "Book-Specific Writing
   Rules"): sparing em dashes — calibration: accepted chapters run ≈ 9–11 em
   dashes per 1000 words; judge density, not raw counts. Deduction em dashes
   become `$\rightarrow$` arrows. Process chains as
   "(predict $\rightarrow$ measure $\rightarrow$ step)".
B. **Figure-rich**, echoing his Manim scene compositions
   (`~/dl-course-code/<module>/scenes/`); visually verify every figure before
   embedding.
C. **Code**: lean, type hints on teaching functions, shape comments, one idea per
   cell, folded by default with descriptive `#| code-summary`. Never a comment
   that restates the line.
D. **Callout mapping**: `note` = definitions/context; `tip` = make-it-learnable
   pivots + practical hygiene; `warning` = pitfalls. Do not use callouts as
   project-management reminders; those belong in `docs/backlog.md`.
E. **Pedagogical efficiency** (drafting-template): the destination is
   attention/transformers; every concept names its payoff chapter; no payoff →
   exercise or cut.
F. **Honesty gate**: printed numbers must support the prose exactly; overclaims
   get toned down, not numbers massaged. When an experiment refuses to show the
   textbook result honestly, the null result with a diagnosis is usually the
   better chapter (precedents in §5).
G. **GPU queue** (revised July 15): experiments needing full-dataset/GPU scale get an
   entry in `docs/backlog.md` §5, not an in-chapter placeholder. Never fake a
   scaled-down win; publish the honest CPU result and add the scaled result only after
   it has actually run.
H. **Licensing**: no d2l.ai text/code ever (his `rnn_data_prep.py` is D2L-derived
   — reference conventions only, never port). Committed third-party assets note
   their license (e.g., `data/squeezenet1_1-imagenet.pt`, torchvision BSD-3).
   No render-time downloads, ever.
I. **Reading order**: chapter N's code uses only tools introduced in chapters
   ≤ N. The introduced-tools ledger lives in `docs/arc-seeds.md` §3.
J. **Exercises**: normally 4–5 core items, tagged **(Pencil.)** / **(Code.)** /
   mixed, each reinforcing an arc point; open-ended phrasing for untested outcomes.
   A specifically requested addendum may expand the chapter list or use a separately
   scoped maintainer bank, as §14.8 and
   `docs/test-time-memory-control-exercise-bank.md` do.
K. **Provenance**: every chapter opens with the
   `<!-- lecture-source: … seeds: … -->` comment; deviations from the lecture's
   framing are noted there (see ch. 10/11 for the pattern).

## 5. Case law — honesty-gate catches worth remembering

These are precedents; when a new experiment misbehaves, check here first.

- **Padding trap (ch. 11, the big one):** an RNN encoder marches through
  right-padding and the final state is poisoned for short sequences —
  train/inference mismatch. ALWAYS `pack_padded_sequence` RNN encoder inputs and
  `ignore_index=PAD` the loss. Symptom: seq2seq stuck at 40–60% for no visible
  reason. Two whole task designs were nearly abandoned before this diagnosis.
- **Freeze staleness (ch. 8):** `--to html` single-file renders leave `tex.json`
  stale → book PDF ships old content. Render single files with no `--to` flag.
- **A benchmark cannot depend on live prose (chs. 10/14):** both character-LM cells
  once globbed the current Chapter 1–9 sources. Copyedits then changed the corpus only
  when those chapters happened to re-execute, leaving frozen output and pinned prose
  on different datasets. Both now read the committed 148,594-character
  `data/book-corpus-ch1-9.txt` snapshot and assert its SHA-256. Rebuild that file only
  as a declared benchmark revision, then rerun and rewrite both chapters together.
- **A kernel does not supply its own average (ch. 12/14):** an unrestricted
  $M$ with $w=1$ and $R=0$ can interpolate observed pairs; it does not imply the
  Nadaraya–Watson/softmax result at a query. The kernel supplies weights and the
  local-constant restriction supplies the weighted average. State that precision
  before using “attention is regression.”
- **A sufficient state changes the contract (ch. 14):** $(S_t,z_t)$ exactly matches
  traversal for its chosen factorized kernel, not arbitrary softmax. Perfect top-1
  identification is not exact value recall, and a Mamba-style retention/write mapping
  is interpretive rather than an algebraic equivalence. Keep all three distinctions in
  captions, tables, and recap claims.
- **Regimes that only appear at the right scale:** ResNet degradation needs real
  depth (plain-20 at 14×14 shows it; plain-10 does not — ch. 9). The vanilla-RNN
  recall failure at lag 80 is a *lottery* across seeds, not a wall (ch. 10) —
  and the default-init LSTM fails too until forget bias = +1 ("architecture
  proposes, initialization disposes").
- **Norm underflow is not a zero gradient:** a float32 sum of squared tiny gradient
  entries can underflow even when every entry is nonzero; parameter updates can also
  round away when they are smaller than the local spacing. Diagnose with maximum
  absolute entries, a float64 norm, and realized parameter changes. Chapters 5 and 9
  use this distinction; Appendix C now gathers it and separates local spacing,
  underflow, and accumulator dtype.
- **Transfer at toy scale is a draw** (ch. 9): five designs, one verdict — scratch
  ties ImageNet probes at 28px/30 labels; own-trunk transfer loses ("pretraining
  is curriculum"). Presented honestly with a three-regime decision rule; do not
  re-litigate at subset scale.
- **Clipping too tight throttles training**: clip 1.0 on seq2seq crawled; 5.0
  trains fine (ch. 11 pre-tests).
- **matplotlib mathtext doesn't know book macros** — `\vect` in a figure label
  crashes the kernel; use `\mathbf`.
- **imshow-over-contourf crashes the inline backend** — use a second contourf.
- **Source reversal (Sutskever) is not magic** — it shortens the *first*
  dependency; on the date task it lengthens it (year sits source-end/target-start)
  and hurts. Kept as ch. 11 Exercise 5.
- **KaTeX cannot take custom macros in Quarto** — the book uses MathJax; macros
  live in BOTH `tex/macros.tex` and `mathjax-config.html`.
- **GitHub flakes**: CI needs `GH_TOKEN` (not just `GITHUB_TOKEN`) env on
  quarto-actions/setup for TinyTeX resolution; a Pages build stuck "building" is
  re-queued via `gh api -X POST …/pages/builds`; a cancelled runner job with zero
  steps is capacity noise — rerun it.
- **The $\sqrt d$ embedding convention includes an initialization contract**
  (ch. 14): PyTorch's default `nn.Embedding` has coordinate standard deviation near
  1, so multiplying it by $\sqrt d$ dwarfs an order-one sinusoidal position signal.
  Initialize token embeddings at standard deviation $1/\sqrt d$ before applying
  that scaling, or omit the scaling and state the changed convention. Audit the
  actual norms before training.
- **One seed does not imply one minibatch order**: constructing models with different
  parameter counts consumes different random draws before the first `randperm`.
  Either drive batch order with an explicit generator in a true ablation or report
  the order mismatch as a caveat (Chapter 13). Even after exact matching, one seed
  is a controlled case study rather than an estimate of an average effect (Chapter
  14).
- **An “unseen” vocabulary row can still move during MLM** (ch. 15): a token absent
  from clean source text can appear as a random corruption, and tied input/output
  embeddings receive full-softmax gradients even when the token is never a target.
  Exclude control IDs from the replacement pool, untie the diagnostic MLM decoder,
  and assert the held-out input rows are bitwise unchanged. Also require scratch to
  fit the tiny labeled set before interpreting a transfer gap.
- **A realistic-looking transfer task can still test the wrong feature** (ch. 15):
  the book-continuation pilot produced only +0.031 mean five-seed gain at four
  labels/class (0.497→0.528), while a source-only TF–IDF cosine baseline reached
  0.632 and the gain faded with more labels. Reject the affirmative story when a
  shallow baseline exposes it; redesign the mechanism test rather than hiding the
  baseline.

## 6. Data assets (committed; no downloads at render)

| File | Contents | Notes |
|---|---|---|
| `data/fashion-train.pt` | 1,200 Fashion-MNIST train images + labels + class names | 28×28 uint8; provenance, license, and checksum in `data/README.md` |
| `data/fashion-test.pt` | 600 Fashion-MNIST benchmark images | initially held out, then opened for final checks in chs. 6/8 and reused descriptively from ch. 9 onward; not an unbiased post-selection test for later architecture claims |
| `data/squeezenet1_1-imagenet.pt` | torchvision SqueezeNet 1.1 ImageNet weights | upstream enum, URL, license note, and checksum in `data/README.md` |
| `data/book-corpus-ch1-9.txt` | the book's own Chapters 1–9, with executable Python cells and HTML comments removed | immutable 148,594-character snapshot from commit `24ae3a6321ad901497776180b8e107490750adc9`; generator and checksum in `scripts/build_book_corpus_snapshot.py` and `data/README.md` |

## 7. Roadmap: completed manuscript units

The numbered sequence is complete through Chapter 20. The July 15 structural pass adds
two unnumbered bridges, the multimodal continuation, and an epilogue while preserving
every existing chapter number and URL. Each record preserves its source, harvest,
experiment, and verification contract:

### Interlude after ch. 6 — Who Trains the Trainer? Learning by Experiment
- **Sources and provenance**: sanitized `sources/3-HPO-experimentation.tex`, the full
  instructor HPO deck (SHA-256 `6deaf680...`), and the full September 18, 2025 live
  VTT (SHA-256 `65a63bd...`). D2L-derived legacy planning files, product tutorials,
  external assets, student dialogue, and unverified numerical claims are excluded.
- **Content**: run/experiment/study; parameters versus hyperparameters; fixed-protocol
  and tuned estimands; the instructor's job-interview analogy; controlled ablation and
  interactions; search spaces, random search, successive halving, validation
  overtuning, paired seeds, uncertainty naming, and the experiment ledger.
- **Pinned study**: exact values and paired contrasts are recorded in §1 above. The
  600-image benchmark is explicitly already opened by Chapter 6 and used only as a
  decision-inert locked endpoint here—not relabeled as a sealed test.

### Interlude after ch. 9 — Making PCA Learnable
- **Sources and provenance**: Module 6 spine; SHA-pinned main, coding-6.2, and
  coding-6.3 transcripts; sanitized `sources/6-AE-slides.tex`; primary linear- and
  denoising-autoencoder papers. D2L-linked transposed-convolution code and external
  figures do not cross the boundary.
- **Content and harvest**: restores PCA → gradient-trained tied linear autoencoder →
  nonlinear manifold map (“PCA on steroids”) → convolutional/denoising autoencoder →
  one-shot/variable-length boundary. Chapter 10 now harvests that boundary by name;
  Chapter 11 recalls the static encoder–decoder contract; Chapter 19 harvests “a code
  is not yet a distribution.”
- **Pinned studies**: the moved curve/projector/decoder-ambiguity audits and the new
  Fashion denoising experiment are recorded in §1 above. `torch.linalg.svd` and
  `nn.Tanh` are labeled previews; transposed convolution is verified as an adjoint,
  never called an inverse.

### Ch. 12 — Kernel Regression: Attention Before It Was Learnable (SHIPPED)
- **Seeds**: `sources/8.1-Attention.tex` (the "Kernel Regression: The Conceptual
  Bridge" section — his signature move), plus the now-snapshotted
  `sources/Bridge_to_attention.tex`.
- **Transcripts**: `m08_lecture-8-attention-mechanism-part-1_8WBIyiaW7Cc.txt`.
- **Content shipped**: Nadaraya–Watson estimator; kernels as similarity weights;
  softmax over **log-kernel scores** = fixed attention weights with no learned
  similarity function; the query/key/value language previewed on fixed data. The
  chapter keeps the distinction that OLS
  prediction weights may be signed, whereas NW's positive weights form a convex
  average. For the Gaussian score $-\|q-k\|^2/(2h^2)$, bandwidth maps to temperature
  through $2h^2$. A dot product is pure angular similarity only when norms are
  controlled.
- **Research-lens precision upgrade**: before any regression slogan, the chapter now
  states softmax attention as the exact local-constant fit
  $\arg\min_c\sum_\tau\kappa(q,k_\tau)\|c-v_\tau\|^2$. The kernel supplies the
  weights; restricting the fit to one constant supplies the average. An unrestricted
  zero-regularization function could interpolate observed pairs and does not imply the
  same query-local average. A Warning carries the trap, an INFO/Note box connects the
  lens to TTT, DeltaNet, Titans, MesaNet, and test-time regression/control, and the
  stationarity proof is an explicit Pencil exercise.
- **Harvests completed**: ch. 1's "weighted combination of targets" and
  "dot product as similarity" seeds; ch. 2's "scores → weights" softmax framing;
  the finite-state bottleneck is partially relieved by retaining a memory bank.
- **Pinned experiment**: 60 fixed keys, 241 off-key queries, and 1,000 redraws of
  Gaussian response noise. On the predeclared bandwidth grid, $h=0.18$
  ($\tau=0.0648$) minimizes MSE at $0.0236$; variance falls from $0.0343$ to
  $0.0022$ across the grid. The rendered 31-by-60 fixed attention matrix has maximum
  row-sum error $2.22\times10^{-16}$, and stable log-score softmax survives the
  deliberately underflowing far-query case.
- **Plant completed**: the "make the similarity learnable" cliffhanger into ch. 13 (mirror
  ch. 7 → ch. 8's structure — this is the book's thesis rhyme: Part II pivot
  repeated in Part IV).

### Ch. 13 — Attention: Making the Kernel Learnable (SHIPPED)
- **Seeds**: rest of `8.1-Attention.tex`; transcripts m08 lectures 2–3 +
  `[coding]_m08_…8-3-implementing-attention-in-seq2seq…`.
- **Content shipped**: additive attention; learned projected Q/K/V; scaled
  dot-product attention and the $\sqrt{d_k}$ variance argument; source-padding
  masks; cross-attention inside the packed Chapter 11 LSTM decoder; alignment
  diagnostics; a compact multi-head preview that leaves the full operator to ch. 14.
- **Pinned scaling audit**: across $d_k=8,32,128,512$, raw dot-product variance is
  $8.023,32.142,127.985,510.347$, while scaled variance stays
  $1.003,1.004,1.000,0.997$. The mean largest 16-key softmax weight rises
  $0.564\to0.944$ without scaling and remains about $0.24$ with scaling.
- **Pinned date rematch**: exact ch. 11 generator/split, seed 6050, first 400
  unambiguous validation sources, and one final 437-source test audit. Attention
  reaches 93.25% at epoch 6 and 99.75% at epoch 12 (baseline 53.8%/95.0%), then
  100.0% on test (baseline 93.1%). On validation, the first four decoder rows place
  97.469% of their mass on contextual states indexed by the source-year region.
  The attention model has 269,550 parameters vs. 169,326 (+59.2%) and a stepwise
  decoder; this is schedule-matched, not parameter-, compute-, or batch-order-matched.
- **Licensing repair**: D2L-like implementation blocks were removed from the public
  `sources/8.1-Attention.tex` snapshot. The chapter implementation is independently
  derived from the lecture equations and book-original ch. 11 pipeline.

### Ch. 14 — Self-Attention and the Transformer (SHIPPED)
- **Seeds and sources**: `sources/9.1-self-attention.tex`,
  `sources/9.A.1-positional_encoding.tex`, and
  `sources/9.1A-Normalization_in_Transformers.tex`; m09 lecture/coding transcripts;
  module spine and Manim scenes. All uncleared implementation blocks were removed
  from the public snapshots, and the chapter's custom attention was independently
  derived.
- **Harvests completed by name**: ch. 13's origin-free Q/K/V operator and remaining
  recurrent bottleneck; ch. 10's third sharing axis and book-corpus benchmark;
  ch. 8's position debt; ch. 11's “which positions it may not look at” masking
  warning; ch. 9's residual stream and “same equation, different axis” LayerNorm.
- **Architecture shipped**: decoder-only causal Transformer, width 84, four heads
  of width 21, two pre-LayerNorm blocks, FFN width 168, fixed sinusoidal position,
  no dropout, 132,488 parameters. The fused-QKV attention is custom code, with
  executable upper-triangle and row-sum assertions.
- **Pinned book-corpus rematch**: exact Chapter 10 corpus/split, its exact historical
  2,501-by-64 random-window schedule, 100-character context, Adam 0.002, clip 1,
  and 16,006,400 targets. Shared initialization hash begins `4d2f7f434cb5`; schedule
  hash begins `e470a091bd50`. With seed 6050, position yields train/held-out
  1.1132/1.9190; no position yields 1.8672/2.3405. Position improves held-out loss
  by 0.4214 (18.0%), but the 1.8881 LSTM baseline narrowly wins by 0.0309 (1.64%).
  The positional run repeated exactly; the one-seed gap is not an average effect.
- **Memory spectrum shipped**: new §14.8 writes one online regression objective and
  audits four dials—views, history weights, regularization, and solver. It re-derives
  the local-constant attention solution, collapses a factorized kernel into the exact
  running pair $(S_t,z_t)$, and derives the delta recurrence from one newest-pair SGD
  step. It explicitly rejects three tempting overclaims: $(S_t,z_t)$ is exact only for
  the chosen factorization, exponential objective weights do not automatically yield
  a $\gamma H_{t-1}$ update, and Mamba-style selectivity is an interpretive
  retention/write analogy rather than a derivation or genealogy.
- **Pinned capacity mechanism test**: the sealed seed/load ledger and exact endpoint
  values are recorded in §1. The uncompressed softmax table, plain delta state, and
  priority-gated delta state share keys, values, order, queries, decoder, and width;
  stored data, arithmetic, and the gate's priority bit are deliberately unmatched and
  confessed in the caption. Chapter 14 now has ten exercises; the external exercise bank is
  `docs/test-time-memory-control-exercise-bank.md` (nine prompts with solution
  sketches, including the Table 2/§E.2 compute-matched critique).
- **Forward seeds planted**: “visibility is a modeling decision” into ch. 15 and
  “global routing trades away locality bias” into ch. 16.

### Ch. 15 — The BERT Moment (SHIPPED)
- **Seeds and sources**: public snapshots `sources/bert.tex` and
  `sources/10.2_pretrained.tex`; m10 transcript, module spine, and Manim scene
  concepts; primary ELMo/ULMFiT/GPT/BERT/RoBERTa/T5 papers. No third-party
  implementation was ported; the executable encoder and MLM are independently
  derived.
- **Harvests completed by name**: ch. 14's “visibility is a modeling decision”
  becomes causal versus full nonpadding attention; ch. 9's three-gate transfer
  rule is closed at controlled toy scale.
- **Content shipped**: self-supervision; MLM loss and shapes; 15% then conditional
  80/10/10 corruption; original BERT's WordPiece and token/position/segment input,
  post-LayerNorm encoder, Base/Large sizes, historical NSP, `[CLS]` task heads,
  and the distinction between full fine-tuning and a frozen probe. GPT and T5 are
  compared without collapsing their visibility or execution differences.
- **Pinned transfer lab**: 80 random four-letter token strings in two latent
  families; 40 covered types receive 320 noisy MLM source sentences and 40
  vocabulary-resident controls are absent from MLM inputs, random replacements,
  and targets. A custom width-48, four-head, two-block post-LayerNorm encoder has
  43,920 parameters. Five full
  seeds (6050–6054), 600 MLM updates each, then exactly paired 160-update full
  fine-tuning. Covered mean scratch→MLM accuracies are 0.468→0.995,
  0.489→1.000, and 0.494→1.000 at 1/2/4 labels per family. Unexposed scratch/MLM
  controls remain 0.475/0.425, 0.500/0.440, and 0.550/0.430. Both training arms
  fit all labeled sets at 1.000.
- **Control repair**: random corruptions draw only from clean-source token IDs; the
  toy MLM decoder is untied; code asserts uncovered input embeddings stay bitwise
  unchanged. The result is an existence proof for the scarcity/representation/
  coverage mechanism, not Transformer superiority or natural-language scale.
- **Forward seeds planted**: learned summary token and “pretraining is a regime,
  not an architecture” into ch. 16; full-backbone fine-tuning cost into ch. 17.

### Ch. 16 — Vision Transformers and Scaling Laws (SHIPPED)
- **Seeds and provenance**: public snapshots `sources/10.0_ViT.tex` and
  `sources/10.1.scaling.tex`, existing `sources/4.3-NextGenCNN.tex`, m10 ViT and
  scaling transcripts, the module spine, and its Manim scene concepts. The chapter
  re-derived numerical claims against the primary ViT, EfficientNet, DeiT, Swin,
  ConvNeXt, Kaplan, and Chinchilla papers; paper figures are discussed, not copied.
- **Licensing boundary**: every implementation block whose provenance overlapped
  D2L or could not be established independently was removed from the public ViT
  source snapshot. All executable patchification, attention, models, training,
  and figures in the chapter are book-original implementations derived from the
  equations; no third-party ViT package or D2L implementation was ported.
- **Harvests completed by name**: ch. 14's “global routing trades away locality
  bias”; ch. 15's learned summary-token pattern and “pretraining is a regime, not
  an architecture”; and ch. 6's inductive bias as a trade. ViT is presented as an
  encoder transplant with weaker image-specific priors, not assumption-free
  learning. Hybrid stems, Swin, DeiT, and ConvNeXt show that operator, training
  recipe, data, and prior placement interact.
- **Patch and cost audits**: a 224-by-224 RGB image with 16-by-16 patches yields
  196 raw 768-coordinate patches. On Fashion, unfold-plus-linear and the equivalent
  stride-4 convolution agree to maximum absolute error `7.15e-07`. Halving patch
  width from 32 to 16 multiplies tokens by four and score entries by sixteen; the
  chapter distinguishes attention's $O(N^2d)$ mixing term from $O(Nd^2)$
  projections and feed-forward work.
- **Pinned paired experiment**: fixed ch. 6 split (1,000 fit / 200 validation;
  the already-opened 600-image benchmark is descriptive), seeds 6050–6054,
  AdamW 0.003 with weight decay 0.01, cosine decay over 120 epochs, batch 100,
  and one explicit shared permutation schedule per pair. Schedule hashes are
  `c42c1c2b4baf`, `f0c73c85e0e3`, `20ec620b3e2e`, `c93bd2a03038`, and
  `87a781e7efa8`. The parameter counts are CNN 20,250 and ViT 19,658 (+3.01% for
  the CNN); the deliberately limited dot-product/MAC proxies are 1,185,888 and
  1,164,608 (+1.83%), not measured FLOPs or runtime.
- **Pinned result**: mean CNN/ViT fitting accuracy is 0.8788/1.0000; validation
  means for right shifts 0–4 are CNN
  0.739/0.699/0.675/0.657/0.589 and ViT
  0.701/0.604/0.457/0.356/0.252. Descriptive benchmark means are 0.7792/0.7332.
  The CNN wins all five clean pairs and all 25 seed-by-shift points. The shift
  zero-fills and clips the right edge, and the five runs share one split, so the
  chapter reports a controlled small-data regime rather than population
  uncertainty or an architecture referendum.
- **Scaling arithmetic pinned**: EfficientNet's published multipliers give
  $1.2\times1.1^2\times1.15^2=1.92027$ per compound step. Kaplan's published
  exponents imply 5.1%, 6.4%, and 3.4% fitted-component reductions when parameters,
  tokens, and optimally allocated compute respectively double. For
  $C=5.76\times10^{23}$, the rounded Chinchilla joint fit gives 32.19B parameters,
  2.982T tokens, and $D/N=92.6$, while the separate 20-token heuristic gives
  69.28B/1.386T. The chapter keeps those two estimates separate.
- **Verification state**: the corrected executed HTML and PDF render completed,
  with both `html.json` and `tex.json` freezes present and every printed numerical
  output matching across formats. The final full-book render passed; all five HTML
  figures loaded without overflow or browser-console errors; and the complete
  Chapter 16 PDF range plus all corrected figure/equation pages passed visual QA.
- **Forward seed planted**: “training-optimal is not serving-optimal” into ch. 17,
  where full-backbone storage, movement, adaptation, and inference costs become
  the problem rather than the training allocation alone.

### Ch. 17 — Adapting Pretrained Models: Prompting, PEFT, Quantization (SHIPPED)
- **Seeds and provenance**: sanitized public snapshots
  `sources/11.1-before-fine-tuning.tex`, `sources/11.2-peft.tex`, and
  `sources/11.3-quantization.tex`; Module 11 course sources; primary prompting,
  RAG, PEFT, LoRA, quantization, and QLoRA papers. Source code, paper figures,
  private links, and material without a clear reuse boundary were removed; all
  executable implementations and six figures are book-original.
- **Harvests completed by name**: ch. 16's “training-optimal is not
  serving-optimal,” ch. 15's full-backbone fine-tuning cost, and ch. 9's transfer
  decision rule. The chapter keeps transfer coverage as the upstream gate: no
  adaptation method creates missing source knowledge for free.
- **Adaptation ledger shipped**: hard prompting and in-context learning, retrieval
  as a distinct context path, prompt and prefix tuning, adapters, BitFit, LoRA,
  full fine-tuning, PTQ, and QLoRA are separated by backbone storage, incremental
  task state, permitted writes, and transient work. Storage precision, compute
  precision, trainable state, and measured runtime are explicitly distinct.
- **Pinned frozen-context audit**: a 39,268-parameter causal Transformer evaluated
  over five seeds and 8,192 nested episodes per seed reaches mean accuracy
  0.252/0.500/0.749/1.000/1.000 for zero through four demonstrations, closely tracking
  the 0.25/0.50/0.75/1.00 information ceilings; every evaluation pass leaves weights
  bitwise unchanged.
- **Pinned LoRA and quantization audits**: on a planted rank-six 32-by-32 update,
  ranks one/two/four leave validation MSE 0.04535140/0.02021863/0.00188776, while
  ranks six/eight reach the printed numerical floor; merged and unmerged outputs
  differ by at most `1.43e-06`. On unequal-scale rows, 8-bit per-tensor/per-row
  output error is 0.0213/0.0069 and 4-bit error is 0.2695/0.1223. Payload and scale
  metadata are counted separately; no kernel-speed claim is inferred.
- **Verification state**: both execution freezes are present with byte-identical
  printed outputs. The full-book render, browser asset/alt/layout checks, all six
  original figures, and every Chapter 17 PDF page passed QA.
- **Forward seed planted**: “where the update lives is not what the update
  optimizes” into ch. 18.

### Ch. 18 — Alignment and RL Fine-Tuning (SHIPPED)
- **Seeds and provenance**: sanitized public snapshots
  `sources/11.4-reinforcement-learning.tex`, `sources/11L-llm-alignment.tex`, and
  `sources/11.4S.tex`; primary SFT, human-preference, PPO, DPO,
  reward-overoptimization, model-card, and judge-audit papers. External diagrams,
  paper figures, private links, executable library code, and product-current claims
  were removed; every executable study and figure is book-original and carries the
  source-level `NOVEL` sign-off marker.
- **Harvest completed by name**: ch. 17's “where the update lives is not what the
  update optimizes.” The opening map separates demonstration, preference, and sampled
  reward signals from full-weight, low-rank, and prompt-state write surfaces.
- **Pinned preference and policy identities**: completion masking scores 3/4 response
  tokens and changes by `0.00e+00` after excluded predictions are perturbed. A symmetric
  0.70 preference cycle forces a scalar-model loss of 0.693147 rather than the edgewise
  0.610864 floor. On four complete responses, the beta-one Gibbs policy is
  0.164562/0.203330/0.331625/0.300483, and DPO recovers it to `5.55e-17` under its
  explicitly stated scalar-preference, support, coverage, capacity, and optimization
  assumptions.
- **Pinned proxy-pressure audit**: five reward-model seeds trained on 20,000 noisy
  comparisons each. Narrow feedback produces in-range NLL 0.665633 (oracle 0.665603)
  and designed-order accuracy 0.992940 while leaving the missing curvature exactly
  unidentified. At beta 0.125 its proxy rises to 1.969632 while designed utility falls
  to 0.484541; 20% out-of-range response coverage fits mean curvature -1.208128 and
  retains designed utility 1.316470. This is a planted finite mechanism, not a prevalence
  estimate or method ranking.
- **Verification state**: HTML and TeX stdout match exactly. Both-format execution,
  full-book rendering, all seven figures, browser assets/alt/layout, and the complete
  PDF chapter range passed QA.
- **Forward seed planted**: “A judge is not a generator” into ch. 19.

### Ch. 19 — Generative Models: From Codes to Samples (REVISED)
- **Seeds and provenance**: sanitized Module 12 VAE/GAN/diffusion snapshots and primary
  VAE, GAN, diffusion, score-model, and latent-diffusion papers. Module 6's
  representation-learning ownership moved to the earlier autoencoder interlude.
  Course-deck code, external figures, and product-era comparisons are not reproduced.
- **Harvests completed by name**: ch. 18's “A judge is not a generator” separates
  completed-sample evaluation from the law that produces samples; the interlude's “a
  code is not yet a distribution” leads immediately to an explicit latent law.
- **Pinned VAE and GAN identities**: the scalar Gaussian model has posterior
  mean/variance 0.882353/0.264706 and log evidence -1.602093. A mismatched posterior's
  ELBO is -2.533343; the 0.931250 evidence gap exactly equals its posterior KL. In the
  finite three-mode GAN, covered/collapsed JSD is 0.003253/0.183270 and the optimal-
  discriminator values satisfy $V(D^*,G)=-\log 4+2\operatorname{JSD}$; at fake logit
  -6, minimax versus non-saturating generator-gradient magnitude is
  0.002473/0.997527.
- **Pinned diffusion audits**: the 100-step forward schedule has
  $\bar\alpha_{100}=0.005618761019$, signal coefficient 0.074958395256, and noise
  coefficient 0.997186662055; iterative and direct noising agree to floating-point
  precision, and the exact $t=1$ posterior-variance branch adds no noise. Across five
  seeds, time conditioning yields noise MSE 0.429707 (SD 0.000927), generated standard
  deviation 2.062095, central mass 0.019470, and Wasserstein distance 0.058570. Zeroing
  the identical 4,417-parameter network's time channel raises MSE/central
  mass/Wasserstein distance to 0.750689/0.223490/0.379806.
- **Verification state**: the chapter separates fidelity, coverage, memorization,
  condition adherence, distributional fit, sampling cost, seed uncertainty, and
  data/use context. Its five figures and remaining experiments are finite CPU mechanism
  tests, not natural-image or hardware claims. HTML and TeX stdout match exactly;
  both-format execution, the frozen full-book render, browser asset/layout checks, all
  five figures, and the complete PDF chapter range passed QA.

### Ch. 20 — Multimodal Learning: One Space, Two Views (NEW)
- **Seeds and provenance**: sanitized `sources/12.1S-Multimodal.tex`, traced to the
  instructor's Module 12.1 and 12.0 decks by SHA-256. The transcript archive has no
  matching Module 12 recording. Deck code, external images, product examples,
  benchmark tables, and D2L material are excluded; equations and implementation are
  independently derived from the instructor spine and primary contrastive-learning
  papers.
- **Harvests completed by name**: Chapter 2's scores-to-weights machine becomes row-
  and column-wise contrastive classification; Chapter 1's normalized dot product
  becomes cross-modal cosine similarity; Chapter 17's zero-shot terminology is bounded
  by a declared description set. Retrieval is explicitly separated from generation.
- **Pinned paired study**: 1,200 synthetic paired views split into 720 fit, 180
  validation, and 300 endpoint rows held out from model, hyperparameter, checkpoint,
  stopping, and analysis-design decisions. Across seeds 6050–6054, paired
  training reaches held-out image-to-text/text-to-image Recall@1 0.9747 (SD 0.0038) /
  0.9660 (SD 0.0092); one study-wide fixed derangement reaches 0.0027 (SD 0.0028) /
  0.0027 (SD 0.0043). Paired contrasts are 0.9720 (SD 0.0038) / 0.9633 (SD 0.0105), while paired
  Recall@5 is 1.0000 in both directions. The experiment is a finite cross-view
  mechanism test, not a CLIP/ALIGN benchmark.
- **Verification state**: scratch execution, parser checks, and both execution freezes
  pass with byte-identical printed outputs. The frozen full-book render, both figures,
  browser asset/alt/layout checks, and the complete PDF chapter range passed QA.

### Epilogue — The Question Is Yours
- Replays the five-rung learnability ladder in one original figure, names objective,
  data, and evaluation as choices no architecture makes for us, gathers the
  experimentation discipline, marks roads outside scope, and hands the core question
  back to the reader.
- The frontier landing distinguishes backward-looking fitting from forward-looking
  evaluation, adds an adapted/extended fast-versus-slow × predictive-versus-control
  taxonomy, and treats the source paper's System 1/System 2 language only as a
  metaphor—a cartoon, not a law or demonstrated model partition. Prompting/ICL, LoRA,
  and DPO carry explicit taxonomy caveats.
- A Deeper-dive box derives only the scalar Riccati recursion and shows that the first
  action changes with horizon. It connects Chapter 18's external learned judge to a
  tractable cost planned against inside a layer, then closes on “what if the planner
  were learnable?” as an architectural bet, not settled science. Differentiable LQR,
  CUDA co-design, benchmark generalization, and the contested RL ceiling claim remain
  out of scope.
- Both execution freezes, both figures, browser layout, and the complete PDF range
  passed QA in the integrated July 15 build.

### Appendices
- **Appendix A — Linear Algebra and the SVD (SHIPPED):** sanitized
  `sources/misc_LinAlg.tex` and `sources/misc_svd.tex`; Module 1/6 transcript bridges;
  matrices as maps, row batches, projection and least squares, solve-don't-invert,
  conditioning, reduced/batched SVD, truncation, and centered PCA. Five cells, three
  figures, two exact freezes, and full PDF/browser QA passed.
- **Appendix B — Tensors in Practice (SHIPPED):** sanitized
  `sources/misc_tensor.tex`, `sources/misc_tensor_operations.tex`, and
  `sources/misc_layer_algebra.tex`; Module 1/4/8/9 coding-transcript bridges; tensor
  contracts, book-wide axis dictionary, broadcasting, storage/stride, contractions,
  masking, and dtype/device-aware construction. Seven cells, two exact freezes, and
  full PDF/browser QA passed.
- **Appendix C — Numerical Precision and Hardware Efficiency (SHIPPED):** the
  four-part precision contract; FP64/FP32/FP16/BF16 range and resolution; rounding,
  cancellation, stable softmax, mixed precision and loss scaling; synthetic Roofline
  analysis; exact tiled online attention and a FlashAttention recap; seven cells, two
  original figures, two exact freezes, and full PDF/browser QA passed. Roofline values
  are explicitly synthetic and no hardware-runtime claim is made. The recap now names
  the KV cache as the nonparametric estimator's retained dataset, explains why the
  naïve §14.6.2 sampler wasted projection work, and separates FlashAttention's
  I/O-efficient schedule from §14.8's lossy fixed-state statistical contracts.
- **Appendix D — Notation (SHIPPED):** derived directly from
  `tex/macros.tex`, `mathjax-config.html`, and actual manuscript usage. It records
  typography, decorations, index/dimension roles, recurring dense/image/sequence/
  attention shapes, probability and optimization conventions, and a four-question
  notation audit. The old public stub/warning is gone; its HTML layout and complete PDF
  range passed QA.

## 8. Document map

| File | Role |
|---|---|
| `CLAUDE.md` (root) | environment + runbook; auto-loaded by Claude Code |
| `docs/CONTINUING.md` | this file — status, protocol, rules, case law, roadmap |
| `docs/arc-seeds.md` | seed/harvest ledger + reader's toolbox (reading order) |
| `docs/style-guide.md` | voice guide + Book-Specific Writing Rules |
| `docs/drafting-template.md` | per-chapter drafting prompt/checklist |
| `docs/backlog.md` | author-requested future work + GPU experiment queue |
| `docs/test-time-memory-control-exercise-bank.md` | D7 maintainer/course bank + concise solution sketches; intentionally outside book navigation |
| `docs/dl-course-code.md` | how to use his Manim repo (module spines, scenes) |
| `docs/enhancement-proposal.md` (in dl-course-site repo) | course-site history |

*After every shipped chapter or appendix, update §1's table, the arc-seeds ledger,
and the GPU queue. These documents are the project's memory now.*

## Commit authorship (standing rule, July 2026)

Do not add AI attribution anywhere in git history: no `Co-Authored-By: Claude ...`
trailers, no "Generated with Claude Code" lines, in this or any of the author's
repositories. The pre-July-17 history was rewritten to strip these; do not
reintroduce them.

## Plan v2 execution ledger (July 19, 2026)

Author decisions taken: (a) feature-space figure replaced fig-polytopes;
(b) delta typography — pilot trials `…`-elision-via-include (ch. 14) and prose-ref
(ch. 14 trainer); (c) **(Audit.) book-wide**; (d) **transclusion + CI book-wide**.

Done: Phase 0 (harness folds: ch. 17/18/19 setups, ch. 10 unrolled schematic;
padding-mask kept as kernel). Phase 1 (editorial contract in style-guide.md;
preface tweaks; read→predict→run→audit loop). Pilot leg 1 (ch. 3 feature-space
figure). Pilot leg 2 (ch. 19 "Why this batches" + (Audit.) 4/5, both traps
verified fresh; β-TC-VAE cited). Infrastructure: Execution Audit workflow
(weekly, from-scratch re-execution), include-code-files vendored + registered,
`code/` is an installable `dlbook` package (`pip install -e ./code`, in
requirements.txt). Pilot leg 3 (in flight): Listings 10.1 (fit_next_token) and
10.2 (fixed_window_loss) live in code/dlbook/, displayed via include in ch. 10,
imported by ch. 14 whose trainer prints only its deltas (paired guard + explicit
schedule). Acceptance: ch. 10 outputs bit-identical; ch. 14 digests must pass.

Remaining: pilot measurements + author read; Phase 3 (Listing 4.1, module
rollout), Phase 4 (three-case taxonomy in ch. 4 + reminder sites + (Audit.)
sweep), Phase 5 (Hinton devices: digit-embedding exercise, forget-gate
diagnostic, predict-lines, refusal footnotes already in style guide), Phase 6
(compatibility note), Phase 7 (verification, page count ≤ v1.0, tag v1.1).

## Plan v2: COMPLETE (July 20, 2026, v1.1 tagged)

All seven phases shipped, every refactor bit-identical on acceptance. Remaining
for the author: (1) sign off the NOVEL markers (16 chapter files carry them —
grep -rl "NOVEL: needs sign-off" chapters/ --include="*.qmd"); (2) judge the two
delta typographies both live in ch. 14 (elided include vs. prose-ref) and the
ch. 4 listing presentation; (3) the GPU queue (docs/backlog.md) is unchanged.
Page arithmetic is in CHANGELOG.md. Verification habits now standing: bit-diff
acceptance per refactored chapter; span-safe greps for include checks; captions
carry measured numbers only.
