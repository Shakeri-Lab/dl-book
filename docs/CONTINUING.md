# Continuing the Book — Handoff & Roadmap

*Written 2026-07-09 after Chapter 11 shipped; updated 2026-07-13 after Chapter 15
shipped. This is the master handoff document:
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
| IV · Attention | 12–16 | **12–15 shipped and two-format verified; 16 is next** |
| V · Pretrained Era | 17–19 | Stubs with contracts |
| Appendices | a1–a4 | Stubs (a4 floating-point queued in backlog) |

**Milestone 1** (Part I complete + skeleton) is met. The July 11 quantitative,
mathematical, licensing, evaluation-hygiene, and two-format repair pass over Chapters
1–11 is complete and shipped: every HTML/TeX freeze is newer than its source, key outputs
match across formats, and selected figures were visually verified. Chapter 12 is also
complete, with its fixed-kernel experiments pre-tested, frozen in both formats, and
verified in the full-book PDF. The author's own edit pass remains a separate gate rather
than a condition of either release.

Chapter 13 is also complete: additive and scaled dot-product attention are derived,
source-padding masking is exercised, and the Chapter 11 date benchmark has a
matched-schedule attention rematch plus a validation-only alignment audit. Its
implementation was independently derived after D2L-like source-code blocks were
removed from the public snapshot.

Chapter 14 is complete: self-attention, positional encoding, causal multi-head
attention, the pre-LayerNorm residual block, and the FFN memory lens are derived
and exercised. Its exact-schedule book-corpus rematch uses 132,488 parameters. In
the matched seed, position lowers held-out loss from 2.3405 to 1.9190; the Chapter
10 LSTM narrowly remains ahead at 1.8881. The comparison is a controlled case
study, not an across-seed effect estimate.

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

**Decisions still gated on the author:**
- The author's own edit pass over the shipped Chapters 1–15 remains pending.
- Course-site integration was approved, implemented, and shipped July 11, 2026. It uses
  a plural `bookChapters` field because modules and chapters do not map one-to-one;
  only reviewed, substantive chapters are linked. The production build passes.
  Chapters 12–15's course-site links wait for the author's edit pass.
- "Deeper dive" collapsed sections: piloted in ch. 6; his verdict pending ("let us
  get back to deeper dive later"). Do not retrofit chs. 1/5.
- GPU experiments remain backlog-only until access is available. Do not publish
  placeholder callouts in chapters; run the queued experiments on Rivanna/Colab and
  fold real results back into the relevant chapters later.

## 2. The working protocol (refined over chapters 7–15)

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
G. **GPU queue** (revised July 11): experiments needing full-dataset/GPU scale get an
   entry in `docs/backlog.md` §5, not an in-chapter placeholder. Never fake a
   scaled-down win; publish the honest CPU result and add the scaled result only after
   it has actually run.
H. **Licensing**: no d2l.ai text/code ever (his `rnn_data_prep.py` is D2L-derived
   — reference conventions only, never port). Committed third-party assets note
   their license (e.g., `data/squeezenet1_1-imagenet.pt`, torchvision BSD-3).
   No render-time downloads, ever.
I. **Reading order**: chapter N's code uses only tools introduced in chapters
   ≤ N. The introduced-tools ledger lives in `docs/arc-seeds.md` §3.
J. **Exercises**: 4–5, tagged **(Pencil.)** / **(Code.)** / mixed, each
   reinforcing an arc point; open-ended phrasing for untested outcomes.
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
- **Regimes that only appear at the right scale:** ResNet degradation needs real
  depth (plain-20 at 14×14 shows it; plain-10 does not — ch. 9). The vanilla-RNN
  recall failure at lag 80 is a *lottery* across seeds, not a wall (ch. 10) —
  and the default-init LSTM fails too until forget bias = +1 ("architecture
  proposes, initialization disposes").
- **Norm underflow is not a zero gradient:** a float32 sum of squared tiny gradient
  entries can underflow even when every entry is nonzero; parameter updates can also
  round away when they are smaller than the local spacing. Diagnose with maximum
  absolute entries, a float64 norm, and realized parameter changes. Chapters 5 and 9
  use this distinction; Appendix a4 should gather it.
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
| (ch. 10 corpus) | the book's own chapters 1–9 | not a file — `glob("../part*/0*.qmd")` at render, code cells stripped |

## 7. Roadmap: the remaining chapters

Work order: 16 → 17 → 18 → 19, appendices opportunistically.
Each stub carries its contract; specifics accumulated so far:

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

### Ch. 16 — ViT & Scaling Laws
- Seeds: `10.0_ViT.tex`, `10.1.scaling.tex`, plus `sources/4.3-NextGenCNN.tex`
  (EfficientNet compound scaling / ConvNeXt — the CNN side of the story;
  already snapshotted). Patches-as-tokens demo on Fashion subset; inductive bias
  as a *trade* (callback to ch. 6); scaling-law log-log plots can be drawn from
  published constants (cite, don't fake data). Harvest ch. 14's “global routing
  trades away locality bias” by name. Also harvest ch. 15's learned summary-token
  pattern and “pretraining is a regime, not an architecture” before moving from
  text corpora to image patches and scaling budgets.

### Chs. 17–19 — Pretrained Era
- Per stubs: 17 prompting/PEFT/quantization (a2/a4 appendix ties; quantization
  connects to the floating-point appendix), 18 alignment, 19 generative
  (PCA→AE→VAE→diffusion — **the m06 autoencoder spine lives here**: PCA as
  linear autoencoder, bottleneck, manifold learning; see
  `ds6050_06_autoencoders/MODULE_NOTES.md` spine #4–8, deliberately NOT used in
  ch. 11).

### Appendices
- a4 floating-point: queued in backlog; ch. 5 (float-zero), ch. 9 (underflow
  figure), ch. 10 (σ(0)^80) all point to it — gather those as its motivating
  examples. a1 (LinAlg/SVD) seeds: `misc/LinAlg,svd` in Box.

## 8. Document map

| File | Role |
|---|---|
| `CLAUDE.md` (root) | environment + runbook; auto-loaded by Claude Code |
| `docs/CONTINUING.md` | this file — status, protocol, rules, case law, roadmap |
| `docs/arc-seeds.md` | seed/harvest ledger + reader's toolbox (reading order) |
| `docs/style-guide.md` | voice guide + Book-Specific Writing Rules |
| `docs/drafting-template.md` | per-chapter drafting prompt/checklist |
| `docs/backlog.md` | author-requested future work + GPU experiment queue |
| `docs/dl-course-code.md` | how to use his Manim repo (module spines, scenes) |
| `docs/enhancement-proposal.md` (in dl-course-site repo) | course-site history |

*After every shipped chapter, update §1's table, the arc-seeds ledger, and the
GPU queue. These documents are the project's memory now.*
