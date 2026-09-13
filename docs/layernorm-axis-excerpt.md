# LayerNorm versus BatchNorm: who shares the ruler?

September 13, 2026. **Author-approved for separate publication.**
The author reviewed the BatchNorm contrast and requested “push and do next.”
Publish this Chapter 14 scene alone, then prepare Chapter 5 derivative gates for
local review. The comparison explains why variable-length sequences make shared
statistics awkward without claiming BatchNorm requires fixed sizes. No new
numerical experiment, manuscript edit, runtime migration, or release tag is authorized.

## Approved publication checks

September 13 approval run: all 929 interaction tests pass, including 47 focused
normalization checks (`/tmp/layernorm-publication-all-tests.log`). The complete
frozen HTML rebuild succeeds (`/tmp/layernorm-publication-html.log`); source,
structure, asset and public-anchor audits pass. Frozen stdout remains exact at
133 blocks across 27 units, with all 27 HTML/TeX pairs matching `e5827cb`.

Both full PDF profiles were rebuilt and stabilized on their second attempt.
Print remains 548 pages; continuous remains 519. All 390 outline entries per
edition, complete and per-page extracted text, page geometry, and all 1,067
page raster hashes match the prior PDFs. Both PDF audits pass, including glyph,
text-layer, print-loss and retained-log checks. Representative visual inspection
includes the cover, contents, Chapter 14 normalization pages, dense equations,
code, tables and final pages. Receipt:
`/tmp/dl-book-normalization-pdf-approval.mQ7NMn/`, especially `comparison.json`,
`baseline-fingerprint.json`, `render.log` and the two PDF audit logs.
HTML was rendered last. No QMD, freeze, numerical tolerance, PDF setting or tag
changed. Deployment must still be checked against the resulting commit.

## Question and source gate

Which numbers share the mean and variance, and why does the grouping matter?

Place `14-self-attention-transformer.html#layernorm-axis-excerpt` after the existing
`fig-transformer-block`. The shared manuscript's `layernorm-axis-audit` supplies
two examples, each with two tokens and four features:

```
[[[1, 3, 5, 7], [40, 50, 60, 70]],
 [[-3, 1, 5, 9], [2, 2.5, 3, 3.5]]]
```

Its call `nn.functional.layer_norm(audit, (4,))` normalizes only the final feature
axis. No affine weight or bias is supplied. The installed pinned torch 2.12.1
`torch.nn.functional.layer_norm` signature confirms default `eps=1e-5`.
The pin is `scripts/notebook_requirements.txt`; the inspected local source is
`/Users/hs9hd/.venvs/dl-book/lib/python3.12/site-packages/torch/nn/functional.py`.
SHA-256 of `inspect.getsource(F.layer_norm)`:
`b1034c3890e9ce8671a772ec9995b79833f1e0d90ffde7e3fdc893abd5ca464f`.
The browser evaluates that formula in double precision; it does not claim to
reproduce the float32 audit's last-bit stdout. Frozen evidence is unchanged.

Independent SymPy checks through the verify-math helper give row means
`4, 55, 3, 11/4` and population variances `5, 125, 20, 5/16` from this source.
After centering and division by `sqrt(v + eps)`, the real-arithmetic mean is zero
and variance is `v/(v+eps)`, not exactly one. Its deficit is `eps/(v+eps)`.
The learned affine transform may change both mean and variance; it is not applied
in this fixed witness. No new training run or numerical tolerance is introduced.

## Composition and boundary

The film's `LayerNormAxis` supplies the raw-to-normalized reveal and the
per-token feature grouping. Its card dashboard and RMSNorm detour are omitted.
The author-requested contrast first selects one vertical feature column of the
same tensor: ordinary temporal BatchNorm in training would pool that feature
across examples and token positions. An adjacent, explicitly schematic pair of
image feature maps shows the corresponding CNN rule: hold the channel fixed and
pool across examples and spatial positions. No pixel values, BatchNorm numerical
results, extra data fixture, or image performance claim is introduced.

The selection then switches to a horizontal token row. Its profile
is centered and scaled on a fixed ruler. Other token rows are normalized separately.
Their near-coincident outputs are not displaced cosmetically. Raw values from
other rows do not enter a ruler sized for the first row.

The comparison is about reduction axes, not a fixed-size requirement. CNN channels
represent the same learned feature across spatial positions, making a shared
per-channel pool useful; fixed image size makes batching convenient but is not a
BatchNorm condition. Ordinary temporal BatchNorm includes padding in its statistics;
masking pads alone still gives longer sequences more contributions. Pooling future
positions is also inappropriate for causal training. Tokenwise LayerNorm avoids
these cross-position statistics, not the need for attention or loss masks. Its
input features may already contain context mixed by attention. Default BatchNorm
evaluation uses stored running statistics; tokenwise LayerNorm uses current-token
statistics in both modes. These are reduction-rule consequences, not a claim that
BatchNorm cannot be adapted to sequences or that LayerNorm always wins.

Use the shared deferred native SVG transport, closed and paused initially,
1.5× default, forty seconds, no parameter controls. MathJax is the page's existing
renderer. Transcript, wide/narrow static fallbacks, keyboard controls and strict
reduced-motion beat holds remain required. This optional HTML-only replay adds
no required example; the static manuscript remains complete in both PDFs.

## Acceptance before the BatchNorm contrast

First actual-browser review at 1280px desktop and 390px phone found two small
presentation defects: the centering formula was hidden until the scaling beat,
and the first normalized value crossed the y-axis. The formula now appears with
the mean, so its centering highlight is visible during translation. Thirty-pixel
endpoint gutters protect value labels without moving the ruler or changing data.

The initial full frozen HTML render passes source, Plan, Python, asset and public
anchor audits. All 133 stdout blocks/27 units and 27 HTML/TeX pairs remain exact
against `e5827cb`. Filtered and unfiltered Chapter 14 Pandoc LaTeX are byte-identical:
`/tmp/layernorm-axis-{plain,filtered}.tex`, SHA-256
`dddf5555bb3eee02c1adc214cadc49e64f24eb0598b7f26d9c3fde079334843cf`.
Direct Pandoc reports the same pre-existing implicit-div closure warnings in
both conversions; the complete Quarto HTML build succeeds and the replay is
outside any code panel or disclosure. No manuscript is changed to silence them.

Final acceptance: **925/925** interaction tests, including **43** independent
LayerNorm checks, pass in `/tmp/layernorm-axis-final-all-tests.log`. The suite
checks row-local statistics, constant-row behavior, changed valid tensors,
epsilon-qualified variance, actual SVG paths/markers/grouping at seven widths,
centering-formula visibility, endpoint label clearance, deterministic scrubbing,
strict reduced motion and static-frame parity under small math-library ULP changes.
Only drawing coordinates are serialized to nine decimal places; arithmetic is
not rounded. A final white text halo keeps guide lines from crossing value glyphs.

The final complete frozen HTML build is `/tmp/layernorm-axis-final-html.log`.
All source, fixture, HTML and anchor audits pass, including 52 lecture digests;
frozen stdout remains exact. Browser review covers 1280px desktop, 390px phone
(296px drawing), centering/scaling/final states and native fullscreen entry/exit.
No horizontal page overflow or MathJax errors; the replay is outside code panels.
One complete 40-second timeline ran to Replay at the default 1.5× speed. Ordinary
chapter navigation keeps the scene closed with no scene script loaded; its direct
anchor opens it paused at zero. The final review tab is left in that state, and
temporary viewport overrides are reset.
Wide and narrow script-free final frames are regenerated and checked against the
active final state. The static manuscript/PDF conversion remains unchanged.

Assets total 52,469 bytes, including both static prints. The deferred scene script
is 18,381 bytes, SHA-256
`d08c052dad15ba9f16c6760409e11f9dd0e5caa7830a4a53da45ba4ac67b5c53`.
Local review:
`http://127.0.0.1:8770/chapters/part4/14-self-attention-transformer.html?preview=layernorm-axis#layernorm-axis-excerpt`.
This scene remains uncommitted and unapproved for publication. Scale granularity
was pushed separately as `e5827cb`; publishing run `34764538563` has passed
interactions, notebook export and shards 2/3. Shards 0/1/4/5 are still running
without failures; build-deploy has not started. Monitoring is stopped; no
scheduled task exists. Live scale verification remains outstanding. Resume with
`/tmp/dl-book-scale-pdf-approval.MKXd82/scale-live.ZFLK0L/`.

## BatchNorm-contrast acceptance — September 13, 2026

The revised local scene passes **929/929** interaction tests, including **47**
focused checks. Logs: `/tmp/layernorm-bn-final-all-tests.log` and
`/tmp/layernorm-bn-final-tests.log`. New checks pin grouping membership and the
actual column/row highlight geometry, the separate nonnumeric spatial schematic,
and the padding/train/eval boundaries. The original LayerNorm arithmetic gates
are unchanged; all four within-row feature interventions affect that row while
other rows remain identical. Changing another row does not affect the selected row.

Full frozen HTML render: `/tmp/layernorm-bn-final-html.log`. Source, Plan, Python,
fixture, HTML asset and public-anchor audits pass. All 133 stdout blocks/27 units
and 27 HTML/TeX pairs remain exact against `e5827cb`. Chapter 14 filtered and plain
LaTeX still have SHA-256 `dddf5555bb3eee02c1adc214cadc49e64f24eb0598b7f26d9c3fde079334843cf`
in `/tmp/layernorm-bn-{plain,filtered}.tex`. No QMD, freeze, numerical gate, PDF
configuration or tag is changed; no full PDF recut was needed for this local review.

Actual-browser review at 1280px desktop and 390px phone covers the spatial schematic,
column-to-row switch and final normalized profiles, plus expanded mode entry/exit.
The narrow connecting ray is omitted so it cannot cross the persistent axis key;
the row selection and profile labels retain the mapping. Phone drawing is 296×582.
Both static prints are regenerated and exactly match the final live state. There
is no page-level overflow or MathJax error. Full playback reaches Replay at forty
seconds with the unchanged 1.5× default. Ordinary navigation leaves the panel closed
and loads no scene script; the direct anchor opens it paused at zero. Viewport
overrides are reset and the review tab is left at the direct anchor.

Assets: 63,584 bytes total; deferred script 22,650 bytes, SHA-256
`7495dd769da7ec8ddea77da6b70b8b9b69bf33578cc479056502d8ea92e801f7`.
No new runtime dependency or control was added. Updated review:
`http://127.0.0.1:8770/chapters/part4/14-self-attention-transformer.html?preview=batchnorm-contrast#layernorm-axis-excerpt`.
Still **local, uncommitted and not pushed**. The earlier scale publication status
above is historical; it was not rechecked as part of this comparison revision.

## Source receipts

Book source at scale publication `e5827cb`; chapter unchanged from `7aba6ea`.
Lecture root: `/Users/hs9hd/Library/CloudStorage/Box-Box/Teaching/6050/Video_lectures/`.
Scene: `6050-Ch14/lecture.jsx`, `LayerNormAxis`, and its storyboard axis/boundary
entries. The attempted direct file-URL visual inspection was blocked by browser
policy; source composition was inspected without routing around that restriction.

| Source | SHA-256 |
|---|---|
| `chapters/part4/14-self-attention-transformer.qmd` | `acb5cbb703d1589f96f0312779895619415a0b90d413389dc30566cba19c1852` |
| `chapters/part2/09-modern-cnns-transfer.qmd` | `d19c43d3d1331cd9977b47f2347643db7487eac8c9cedfd456e276552eaab38d` |
| `6050-Ch14/lecture.jsx` | `ac103ade3aecf01355955a24a1a2042cd9c58d6a434b39dd7ef6e680ee0fce93` |
| `6050-Ch14/STORYBOARD.md` | `cd493a87b78f9f2fcd705bd2385bf4f8651bb3a9472e44b120838fffa81b1324` |
| `6050-Ch14/ch14-data.js` | `df6cfab3b0b92b5e9eaf634ae82a229f42dfa32030600bc0016ef90d7b11ff39` |

BatchNorm contrast receipts, inspected September 13, 2026:

- Chapter 9, “The stabilizer we owe you,” lines 223–262: per-channel `N,H,W`
  reduction, train/eval distinction, and the planted LayerNorm callback.
- Chapter 14, “Layer normalization,” lines 635–657: token-local feature reduction,
  same train/eval computation, pre-affine approximation boundary.
- [PyTorch 2.12 BatchNorm2d](https://docs.pytorch.org/docs/2.12/generated/torch.nn.BatchNorm2d.html):
  spatial reduction, per-channel parameters, default running statistics.
- [PyTorch 2.12 BatchNorm1d](https://docs.pytorch.org/docs/2.12/generated/torch.nn.BatchNorm1d.html):
  temporal reduction over batch and length for each channel/feature. The book's
  `B,T,D` display corresponds to `B,D,T` input layout for this module.
- [PyTorch 2.12 LayerNorm](https://docs.pytorch.org/docs/2.12/generated/torch.nn.LayerNorm.html):
  final-axis reduction for a singleton normalized shape and input statistics in
  both training and evaluation.
- [Ba, Kiros and Hinton, Layer Normalization](https://arxiv.org/abs/1607.06450):
  per-case normalization and recurrent application. This is verification of the
  existing contrast, not copied figure composition.

Related prose follow-up for a future shared-manuscript/PDF cut: Chapter 9's
“there may be no batch (one image!)” wording is too broad. A single image still
has spatial positions for BatchNorm2d statistics; stored running statistics define
the usual evaluation protocol. The present HTML animation does not repeat that
wording and does not silently alter the shared chapter.
