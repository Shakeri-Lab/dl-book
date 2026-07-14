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

## Module 11 alignment snapshots

- `11.4-reinforcement-learning.tex` preserves the short SFT, reward-model, RLHF,
  and DPO lecture spine as a standalone article. Its TikZ diagrams and external-library
  implementations are represented by explicit omission markers.
- `11L-llm-alignment.tex` preserves the longer preference-alignment slide deck as a
  standalone Beamer handout. The private Colab link, local preamble dependency,
  diagram source, external images and paper figures, product-current ecosystem survey,
  and product-specific adoption claims are omitted.

Both snapshots retain primary-paper citations and instructor-authored equations for
traceability. Their boundary notices make clear that technical and empirical claims
must still be independently checked before they enter the book.
