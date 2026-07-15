# Source snapshots and licensing boundary

This directory preserves the instructor's lecture-source snapshots so the book's
provenance can be audited. The snapshots are inputs for traceability, not a pool of
publishable code or prose.

Instructor-authored prose retained in these snapshots is covered by the repository's
CC BY-NC-SA 4.0 text license (`LICENSE-text.md`). Material carrying a separate
upstream license is not relicensed here; it is either omitted or identified in
`THIRD_PARTY_NOTICES.md`. Product names and paper citations are references, not
redistributed implementations or endorsements.

Some original lecture files contained examples explicitly copied from or adapted from
*Dive into Deep Learning* (D2L). D2L book prose is CC BY-SA 4.0, while its
sample/reference code is distributed under a modified MIT license. Regardless of that
distinction, this project imposes a stricter independent-provenance boundary: those
passages and code blocks are omitted from the public snapshots and replaced with short
licensing markers. They
must not be restored, ported, or paraphrased into the book. D2L may be consulted only
as a reference while the book's explanations and executable examples are derived
independently from the instructor's lectures and primary sources.

When adding a snapshot:

1. Search it for `d2l`, textbook-attribution phrases, copied exercises, and recognizable
   third-party implementations.
2. Remove material whose compatible provenance cannot be established; leave an honest
   omission marker rather than rewriting a raw snapshot as if the replacement were
   original.
3. Record any permissively licensed material retained in `THIRD_PARTY_NOTICES.md` and
   cite it at the point of use.

## Module 3 experimentation snapshot

- `3-HPO-experimentation.tex` preserves the instructor-authored empirical-science,
  nested HPO, ablation, interaction, budgeted-search, seed-panel, and experiment-ledger
  spine from the Module 3 HPO deck and its live-session transcript. The local preamble,
  diagrams, executable and product-specific code, external assets, student dialogue,
  private course details, unverified benchmark numbers, release-current tool claims,
  and strong edge-of-stability-to-generalization claims are omitted.

The older Module 3 planning files contain explicit D2L-derived passages and code and
are not snapshotted. The book's Fashion-MNIST implementation, estimand formalization,
results, and figures are independently written and pre-tested; primary HPO and model-
selection papers are cited directly at the point of use.

## Module 11 alignment snapshots

- `11.4-reinforcement-learning.tex` preserves the short SFT, reward-model, RLHF,
  and DPO lecture spine as a standalone article. Its TikZ diagrams and external-library
  implementations are represented by explicit omission markers.
- `11L-llm-alignment.tex` preserves the longer preference-alignment slide deck as a
  standalone Beamer handout. The private Colab link, local preamble dependency,
  diagram source, external images and paper figures, product-current ecosystem survey,
  and product-specific adoption claims are omitted.
- `11.4S.tex` preserves the model-card and slice-aware-evaluation portion of the
  assignment-oriented slide deck. The overlapping RLHF/DPO survey, local preamble,
  diagrams, external-library code, assignment-specific product configuration,
  product-current claims, and template listing are represented by explicit omission
  markers.

The snapshots retain primary-paper citations and instructor-authored equations for
traceability. Their boundary notices make clear that technical and empirical claims
must still be independently checked before they enter the book.

## Module 6 autoencoder and Module 12 generative-model snapshots

- `6-AE-slides.tex` preserves the Module 6 autoencoder lecture spine, including the
  encoder--decoder contract, the linear-autoencoder connection to PCA, reconstruction
  objectives, and denoising variants. The local preamble, diagrams, executable code,
  private and assignment links, external assets, and associated D2L-linked coding
  material are omitted.
- `12.diffusion.tex` preserves the long Module 12 diffusion article's forward and
  reverse processes, noise-prediction objective, time conditioning, latent diffusion,
  cross-attention, and classifier-free guidance. Its diagrams, external-library
  workflows, runtime downloads, hardware and product claims, and a broken simplified
  U-Net implementation are omitted.
- `12.2S-Diffusion.tex` preserves the dedicated diffusion deck's self-supervised
  through-line, score connection, training and sampling equations, multi-resolution
  denoiser, latent formulation, and conditioning mechanisms. The deck's creativity
  segment is omitted in full because it closely tracks a primary-paper result without
  a sufficiently clear independent provenance boundary; the snapshot points readers
  to that paper instead.
- `12.3S-VAE.tex` preserves the VAE deck's probabilistic encoder, ELBO, diagonal-Gaussian
  KL, reparameterization estimator, weighted-KL objective, and sampling contract. Its
  diagrams, code, product references, and categorical claims about valid prior samples
  or guaranteed disentanglement are omitted.
- `12.4S-GAN.tex` preserves the GAN deck's minimax and non-saturating objectives,
  alternating optimization, idealized discriminator, common failure modes, and
  cycle-consistency equation. Its diagrams, practical recipes, unverified quotations,
  and release-era method rankings are omitted.

Each snapshot begins with the exact machine-local upstream path and its SHA-256 digest.
These files are provenance records only: book prose, derivations, code, experiments,
and figures must be produced and verified independently.

## Module 12 multimodal snapshot

- `12.1S-Multimodal.tex` records the instructor's two-encoder joint-embedding spine,
  cosine-score matrix, directional and symmetric contrastive objectives, retrieval,
  bounded zero-shot classification procedure, retrieval-versus-generation boundary,
  and evaluation questions. The Module 12 course archive contains no corresponding
  recorded-video transcript, so the snapshot names and hashes both the dedicated
  12.1 slide deck and the matching multimodality section of the longer 12.0 article.
  The local preamble, diagrams, external images, product examples, executable code,
  Colab links, model surveys, unverified benchmark numbers, and categorical claims
  about cognition, scale, robustness, generalization, or social impact are omitted.

Chapter 20's mathematical derivation, synthetic paired-data study, typed PyTorch,
figures, and evaluation contract are independently produced. No lecture-deck code,
external asset, third-party model implementation, runtime download, or D2L material
is reproduced.

## Appendix A and B topic-map snapshots

- `misc_LinAlg.tex` records the vectors, span, basis, linear-map, composition, and
  batching boundary of the linear-algebra seed. The upstream deck's 3Blue1Brown-based
  framing, diagrams, narration, and code are omitted.
- `misc_svd.tex` records the standard SVD, rank-one expansion, truncation, and centered
  PCA equations. Unattributed quotations, diagrams, code, incorrect shape/count
  statements, and unsupported application claims are omitted.
- `misc_tensor.tex` records the tensor-shape, batched affine-layer, broadcasting, and
  vocabulary boundary. Channels-last examples, device/performance claims, diagrams,
  and code are omitted.
- `misc_tensor_operations.tex` is deliberately only a checked topic map because the
  upstream file begins with a Google AI Studio prompt marker and contains malformed
  examples and unsupported claims. None of its prose or code is retained.
- `misc_layer_algebra.tex` records only the standard affine-layer equations. Its
  3Blue1Brown-attributed framing, quotations, diagrams, code, and broad representational
  claims are omitted.

These appendix snapshots preserve no third-party audiovisual material or executable
examples. The appendix implementations and figures are independently written and
pre-tested against the documented mathematical contracts.

## Appendix C precision and performance boundary

Appendix C draws its course-specific motivation from `8.1-Attention.tex`,
`9.1-self-attention.tex`, `10.1.scaling.tex`, and `11.3-quantization.tex`, plus the
Module 8–10 lecture transcripts named and hashed in the appendix source. Those files
are provenance inputs only. In particular, the categorical memory-bound/compute-bound
labels in the attention seed and the scaling seed's claim that FlashAttention reduces
dense compute were not carried into the book.

The floating-point examples, mixed-precision policy, synthetic Roofline, online-
softmax derivation, attention I/O ledger, code, and diagrams were independently
produced and checked against primary papers and official framework documentation.
No D2L code or prose, third-party FlashAttention implementation, paper figure, or
vendor benchmark number is reproduced. The appendix makes analytical and CPU
mechanism claims only; it does not report a hardware speedup.
