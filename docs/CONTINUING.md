# Continuing the Book — Handoff & Roadmap

*Written 2026-07-09 after Chapter 11 shipped; updated 2026-07-16 for the structural,
course-alignment, test-time memory/control, release-polish, and v1.0 stewardship
passes. This is the master handoff document:
everything a fresh collaborator (human or Claude session, on any account) needs to
continue the project without the original conversation history. Read `CLAUDE.md`
(repo root) first for environment setup; read this second; read
`docs/arc-seeds.md` before drafting any chapter.*

---

> **Current work — LayerNorm contrast approved publication, September 13, 2026.**
> The author approved the BatchNorm–LayerNorm comparison with “push and do next.”
> Publish only this scene; Chapter 5 derivative gates is next for separate local
> review. Scale run `34764538563` has now succeeded across all jobs. Full PDF
> publication checks for the normalization scene are recorded in
> `/tmp/dl-book-normalization-pdf-approval.mQ7NMn/`; do not claim deployment until
> its own publishing run and live files are verified. No scheduled task or tag.
>
> **Prior checkpoint — LayerNorm axis local preview, September 13, 2026.**
> Scale granularity is pushed normally as `e5827cb`; local and remote `main`
> match. Publishing run `34764538563` is in progress. The previous preference
> run `34762857399` succeeded and its live HTML/players/PDFs are verified.
> Next local scene: Chapter 14 [LayerNorm axis](layernorm-axis-excerpt.md), after
> `fig-transformer-block`, using its exact 2×2×4 audit tensor. Keep the final
> feature axis, no affine transform, default epsilon and approximately-unit
> variance explicit. No manuscript/freeze/numerical gate/PDF setting/tag changes.
> No scheduled task. This preview is not part of the scale publication.
> Current author review: contrast BatchNorm and LayerNorm through their reduction
> groups. Temporal BN groups a feature across examples/positions; CNN BN's separate
> schematic pools one channel across images/spatial positions; LN groups one token's
> features. Fixed image size is convenient, not required. Explain padding/length,
> default BN running statistics at evaluation, and the remaining attention/loss masks.
> No new BatchNorm numerical example. Contrast acceptance: 929 full-suite tests,
> 47 LayerNorm tests, all source/HTML audits, 52 lecture receipts, unchanged stdout
> and byte-identical Ch14 LaTeX. Desktop/phone and expanded mode pass. The narrow
> ray is omitted to avoid the axis key; fixed-token-input wording avoids confusing
> local normalization with the attention operation that may precede it. Review:
> `http://127.0.0.1:8770/chapters/part4/14-self-attention-transformer.html?preview=batchnorm-contrast#layernorm-axis-excerpt`.
> Local-only, no commit or push. Historical scale CI snapshot (not rechecked during
> the comparison pass): interactions/export/shards 2/3 pass; 0/1/4/5 were running
> without failures. PDF publication had not started. Monitoring is stopped;
> live scale verification remains outstanding. Resume with
> `/tmp/dl-book-scale-pdf-approval.MKXd82/scale-live.ZFLK0L/`.

> **Prior checkpoint — scale granularity approved publication, September 13, 2026.**
> The author reviewed the final Chapter 17 scene and requested “push and do the
> next.” Publish only scale granularity; Chapter 14 LayerNorm axis is the next
> separate local preview. Preference run `34762857399` has passed interactions,
> export and all six notebook shards; that run now completed successfully.
> Scale acceptance passes 882 tests, all source/HTML audits and exact 133-block
> stdout. Both full PDFs remain 548/519 pages with identical text, geometry,
> outlines and 1,067 page rasters. Full scale PDF receipt:
> `/tmp/dl-book-scale-pdf-approval.MKXd82/`. Preserve the manuscript,
> frozen outputs, numerical contracts, PDF settings, release tags and stopped
> scheduled task. Source publication is not deployment; verify the live assets.

> **Prior checkpoint — scale granularity local preview, September 13, 2026.**
> Preference ruler was pushed normally as `7aba6ea`; local and remote `main`
> match. Run `34762857399` is in progress; source publication is not deployment.
> Its separate PDF receipt retains 548/519 pages with identical text, geometry,
> outlines and page rasters. Chapter 17's [scale-granularity scene](scale-granularity-excerpt.md)
> is now the local work, not included in that push. Fixed 8 bits: the quiet row
> falls wholly inside the global zero bin; a row-specific grid resolves it.
> No film sample dots, new experiment, QMD/freeze/numerical gate change, PDF setting,
> release tag or scheduled task. Local preview acceptance passes 882 full tests,
> 42 scene tests, all source/HTML audits, exact frozen stdout and unchanged Ch17
> LaTeX. Desktop/phone, full playback and native fullscreen pass. Both Ch17 players
> initialize after the exact heading matcher was extended to H3; the new replay
> sits before “What a quantization workflow protects,” outside code and callouts.
> Local review: `http://127.0.0.1:8770/chapters/part5/17-peft-quantization.html?preview=scale-granularity-final#scale-granularity-excerpt`.
> Final CI snapshot: interaction/export/shards 2/3 pass; 0/1/4/5 still run, with
> no current failures. Monitoring has stopped; no automation. Live verification
> remains outstanding. Resume with the prepared checker and snapshot in
> `/tmp/dl-book-preference-pdf-approval.ueOB4R/preference-live.m8U5Ud/`.

> **Prior checkpoint — preference ruler approved publication, September 13, 2026.**
> SVD was pushed separately as `4fb86d4`, followed by serialization fix `9730659`.
> Local and remote main match. Run `34761426323` failed exact static-SVG parity
> on Linux last-bit coordinates; the fix keeps full-precision arithmetic and
> rounds only drawing serialization. 794 publication tests pass, including the
> regression. Run `34761906820` passed interaction checks but failed the existing
> Chapter 18 exact notebook gate on negative versus positive zero. Do not call it
> deployed or bypass that gate. No background automation was created.
> The local PDF builds
> remain 548/519 pages with unchanged text, outlines, geometry and page rasters.
> Chapter 18's [preference ruler](preference-ruler-excerpt.md) is author-approved
> with “push and do the next.” Publish it alone. It uses existing A/C scores 1/-1
> and common shift 37; gap 2 and probability 0.881 remain fixed. Preview acceptance
> passed 45 scene tests and 839 full-suite tests; source/HTML/freeze/LaTeX checks and
> desktop/phone playback/fullscreen review pass. Full-suite receipt:
> `/tmp/preference-ruler-final-all-tests.log`. No manuscript/freeze/numerical-contract/PDF-setting/tag
> changes, and no scheduled task. Server 8770 serves this working tree's `_book`.
> Review: `http://127.0.0.1:8770/chapters/part5/18-alignment.html?preview=preference-ruler#preference-ruler-excerpt`.
> Publication adds a controlled ULP regression and nine-decimal serialization of
> probability-derived SVG coordinates (46 scene tests); arithmetic is unchanged.
> Full PDF comparison receipt: `/tmp/dl-book-preference-pdf-approval.ueOB4R/`.
> Publication acceptance passes 840/840 tests and all source/HTML audits. Both
> complete PDFs retain 548/519 pages, 390 outlines each, and identical text,
> geometry and all 1,067 page rasters. Frozen stdout remains 133 blocks/27 units.
> Next: Chapter 17 scale granularity, a separate local preview using the existing
> quiet-row range and global/per-row scales. Do not invent the film's sample dots.

> **Current work — SVD approved publication, September 13, 2026.**
> The approved same-subspace scene was normally pushed as `2439557`; local and
> remote `main` match. Publishing run `34727889922` passed all jobs, and the live
> HTML/player/PDFs match `gh-pages` at `3a65f955`; PDFs retain 548/519 pages,
> 390 outlines each, and unchanged text/geometry. Deployment receipt:
> `/tmp/dl-book-pca-pdf-approval.aNzhwp/pca-live.llCyNL/provenance.json`.
> The next scene is Appendix A's existing figure at
> `a1-linear-algebra.html#svd-circle-excerpt`. It transforms the same marked circle
> through `V^T`, scales 3/1 and `U`, then removes one contribution. See
> [the source receipt](svd-circle-excerpt.md). The author approved this scene with
> “push and do the next.” Publish SVD separately; Chapter 18's preference ruler
> is next for local review, not blanket publication approval. No QMD/freeze,
> runtime/tolerance, PDF configuration, stable tag or scheduled task changes.
> SVD local acceptance: 793 full tests, 45 scene tests, all source/HTML/fixture
> audits, unchanged frozen stdout and byte-identical Appendix A LaTeX. Desktop/
> phone, playback, fullscreen and deferred/direct-anchor behavior are verified.
> Publication builds also pass: 548/519 pages, 390 outlines each, unchanged full
> text/geometry/outlines and all 1,067 page raster hashes. Receipt:
> `/tmp/dl-book-svd-pdf-approval.ztG1Xr/`. Final frozen HTML and asset/anchor audits pass.
> Review link: `http://127.0.0.1:8770/chapters/appendices/a1-linear-algebra.html?preview=svd-circle-final#svd-circle-excerpt`.

> **Approved publication — same subspace, September 12, 2026.**
> Mask before softmax was normally pushed as **`6cde283`**, local/remote `main`
> confirmed equal. Publishing run **34601697930** passed all jobs; its live player
> and both PDF artifacts were verified on September 12. The approved scene is the autoencoder
> interlude's `making-pca-learnable.html#same-subspace-excerpt`, before “What if the
> map could bend?” See [its receipt](same-subspace-excerpt.md).
> It illustrates the existing projector identity: basis `VQ`, coordinates `Q^T z`,
> paired decoding back to the same point. The drawing is schematic, not the later
> `k=1` study. Greedy tree remains blocked on a shared-manuscript numerical fixture.
> The author approved this scene with “push and do the next.” No QMD, freeze,
> numerical gate, PDF setting, stable tag or paused migration change is authorized.
> Acceptance: 748/748 full tests, 43/43 scene tests, all source/HTML/fixture audits,
> exact 133-block/27-unit stdout, and a byte-identical interlude LaTeX filter no-op.
> Desktop/390-CSS-pixel review confirms clean diagrams/math, playback, scrubbing,
> and closed/deferred/direct-anchor states. Fresh in-app fullscreen entry/exit and
> layout pass on September 12, closing the earlier manual verification limit.
> Shared controls stay unchanged. The source receipt records logs and hashes.
> Next eligible candidate: Appendix A's existing circle-to-ellipse SVD fixture;
> build one separate local preview, not the rest of the wave.
> **Resolved prior deployment:** mask run `34601697930` passed on exact
> head `6cde283aff69dabe6a71f103f818713dfbbcabbb`. Live HTML/player/PDFs match
> `gh-pages` commit `76e930b7`; PDFs retain 548/519 pages and 390 outlines each,
> with unchanged complete/per-page text and geometry. Receipt:
> `/tmp/dl-book-mask-softmax-pdf-approval.6XHtCD/mask-live.TPl0vH/provenance.json`.
> No scheduled monitor was created or resumed.

> **PCA publication checks:** both full PDF profiles stabilize at unchanged
> 548/519 pages and 390 outlines each. Complete/per-page text, page geometry,
> outlines and all 1,067 low-resolution rasters are identical to the baseline.
> Receipt: `/tmp/dl-book-pca-pdf-approval.aNzhwp/`. The final frozen HTML render
> (`/tmp/pca-publication-final-html.log`) restores and passes all asset/anchor
> audits; 748 tests and 133-block/27-unit frozen stdout checks pass.

> **Current approved publication — mask before softmax, September 11, 2026.**
> Chapter 16's approved attention bill was committed and normally pushed as
> **`061eff3`**; local/remote `main` matched. Publishing run **34595314339** is
> passed all jobs; the live player matches source and both live PDFs match their
> deployed blobs and the prior content/pagination baseline.
> The author approved Chapter 13 with “push and do next”:
> `13-attention.html#mask-before-softmax-excerpt`, after `cell-fig-padding-mask`.
> Its old seeded-fixture concern is resolved by reconstructing the exact existing
> figure's second-example/second-query row, not adding a new example.
> See [the source and review receipt](mask-before-softmax-excerpt.md).
> No QMD, freeze, PDF settings, numerical gates, tags, or runtime migration change.
> Later scenes still require individual local review; the still-unwritten
> greedy-tree fixture remains blocked under the HTML-only boundary.

> **Mask-before-softmax acceptance:** 41/41 scene tests and 705/705 full tests
> pass. Full frozen HTML, assets/anchors, structure/source/Plan, and fixture audits
> pass; all 133 stdout blocks / 27 units remain exact against `061eff3`. Filtered
> Chapter 13 LaTeX is unchanged. The served HTTP page has a unique closed panel,
> working local links, and a deferred player matching source. Direct SVG raster
> inspection at 296/713 widths shows clear wrong/correct normalization diagrams.
> The Mac is now unlocked: actual 1280/390-CSS-pixel browser review confirms no
> overflow or clipped labels, MathJax, playback/pause/scrubbing/expanded view,
> default closed/deferred loading, and direct-anchor opening paused at zero.
> Local URL:
> `http://127.0.0.1:8770/chapters/part4/13-attention.html?preview=mask-before-softmax#mask-before-softmax-excerpt`.
> The author has approved publication. Verify the new publishing run separately.
> See the receipt for exact test, HTML, diagram, and LaTeX paths.
> Both complete PDF builds retain 548/519 pages and 390 outlines each; full text,
> per-page text/geometry, outlines, and all 1,067 low-resolution rasters are exact.
> Receipt: `/tmp/dl-book-mask-softmax-pdf-approval.6XHtCD/`. HTML was rendered last.

> **Resolved attention-bill deployment handoff:** run **34595314339** subsequently
> passed every job; live player and both PDFs were verified. The receipt is
> `/tmp/dl-book-mask-softmax-pdf-approval.6XHtCD/attention-live-comparison.json`.
> Historical handoff: the run was still
> running at 11:56 UTC on September 11. Export and interaction contracts and
> notebook shards 1–3 had passed; shards 0, 4, and 5 were still executing.
> No failure was observed. The preceding comparable run took about 34 minutes;
> this wait is not a reason to alter or bypass publishing. At handoff, remote
> source is pushed but the new live HTML/PDF deployment is **not yet verified**.
> Resume by checking that run, then compare the deployed Chapter 16 anchor/player
> with `061eff3`, and both live PDFs with
> `/tmp/dl-book-attention-pdf-approval.enT0K2/` (548/519 pages, unchanged text,
> geometry and outlines). No scheduled monitor was created or resumed; CI itself
> continues normally. Chapter 13 has since received review and approval.
> Final snapshot before stopping this turn's monitor: shards **0–3 passed**;
> **4–5 executing**, build/deploy not started. The attention player to verify has
> SHA-256 `a6af0140c400eab31281979772fcc642e12cee7a738d525bac1c25b7a6599f48`.

> **Current approved work — attention bill, September 11, 2026.**
> The approved score field was normally pushed as **`ec2e0f6`**, with local and
> remote `main` confirmed equal. Publishing run **34589132667** subsequently
> passed all jobs, including build-deploy and link-check. The live Chapter 19
> anchor and deferred score-field player match the approved source (SHA-256
> `e978ac842453763eee823369e732f7709b227931dc2ffff9a516806035e9a122`).
> Reference tilt is also verified live.
> The approved revision is Chapter 16's attention bill, before “A Fashion
> rematch, not a referendum,” at `16-vit-scaling.html#attention-bill-excerpt`.
> See [its source and acceptance receipt](attention-bill-excerpt.md). Follow-up
> author feedback calls for linked image patches, discrete patch states, explicit
> original-grid area tiles, and a length-versus-area work comparison. Exact
> patch/token/pair counts come from the existing paragraph. No timings, model training, QMD, freeze,
> PDF settings, numerical gates, or tags change. Later candidates and the paused
> runtime migration remain out of scope. The author approved this linked-patch
> revision with “push. Do next.” Publish it separately before editing the next scene.

> **Attention-bill local acceptance:** **664/664** interaction tests pass,
> including **42** scene checks. All existing HTML asset/anchor, manuscript
> structure/source, and fixture audits pass: 37 pages, 152 assets, 14 scenes,
> 79 fixture literals, and 36 reverified lecture digests. All 133 stdout blocks /
> 27 units remain exact against `ec2e0f6`. Plain-Pandoc Chapter 16 LaTeX is
> unchanged by the HTML filters (`/tmp/dl-book-attention-discrete-latex.ySNzmQ/`).
> Full frozen HTML was rebuilt after the discrete patch-grid revision. Actual
> desktop/390-CSS-pixel browser views verify the trace and final comparison, math,
> no clipping or page overflow, delayed loading, and paused direct anchors.
> Real playback reaches the end; pause holds through expanded-view entry/exit.
> The viewport was reset and the local deliverable left paused at its opening.
> Wide/narrow fallback parity is tested. The first draft's fine score raster stays
> removed; the new image grid represents actual patches, not score texture.
> Logs: `/tmp/dl-book-attention-discrete-tests.log`,
> `/tmp/dl-book-attention-discrete-final-html.log`. Local review URL:
> `http://127.0.0.1:8770/chapters/part4/16-vit-scaling.html?preview=linked-patches-final#attention-bill-excerpt`.
> Publication is authorized; the remote commit and CI/live verification remain
> separate gates. Score-field run **34589132667** is
> fully successful and its live player hash matches source, as recorded above.
> No retry, bypass, scheduled monitor, or new publishing shortcut was created.

> **Attention-bill publication build:** the complete PDF loop passes at unchanged
> **548 print / 519 continuous pages**, **390 outline entries** each. Complete
> and per-page text, geometry, outlines, and all 1,067 page raster hashes match
> the baseline. Both PDF audits and representative visual checks pass; receipt
> `/tmp/dl-book-attention-pdf-approval.enT0K2/`. Canonical HTML is rendered last.
> The full interaction suite was rerun: 664/664 pass
> (`/tmp/dl-book-attention-publication-tests.log`).

> **Current approved work — score field, September 11, 2026.** Reference
> tilt was committed and normally pushed as **`bc1133f`**, with local and remote
> `main` confirmed equal. Its publishing receipt is run **34586598964**; check
> that run and live assets before calling it deployed. The approved separate scene is
> Chapter 19's bounded analytic score-field picture, immediately after
> `cell-fig-score-mixture`, at `19-generative.html#score-field-excerpt`.
> See [its source and acceptance receipt](score-field-excerpt.md). One prescribed
> coordinate reveals how two responsibility-weighted pulls add; the midpoint
> demonstrates cancellation in a low-density valley. It is not a sample trajectory,
> a learned field, or a diffusion replay. No QMD, freeze, PDF settings, numerical
> gates, or stable tags change. The runtime migration and its monitor remain paused.

> **Score-field local acceptance:** **622/622** interaction tests pass, including
> **42** independent scene tests. The latter compare three arithmetic paths and
> inspect signed arrow endpoints on a common ruler, not just displayed numbers.
> A browser-discovered defect, white text halos accidentally repainting arrows,
> was corrected by text-only selectors and a dedicated regression. Full frozen
> HTML, assets/public anchors, Plan-to-Code, Python-source, book-contract, and
> fixture audits pass. The fixture ledger now covers **13** scenes, **72** literals,
> and **33** reverified lecture digests. All **133** stdout blocks across **27** units
> and their HTML/TeX pairs remain exact against `bc1133f`. Chapter 19's plain-Pandoc
> LaTeX is byte-identical with/without both HTML excerpt filters:
> `/tmp/dl-book-score-latex.W16Xu9/`. Approval now triggers full publication PDF
> checks; the completed receipt below supersedes the local-draft build boundary.
> Actual **1280**- and **390**-pixel browser views verified midpoint cancellation,
> density/score alignment, unclipped tails, readable labels, semantic math, real
> replay/pause, expanded view, and no page overflow or MathJax errors. A closed
> chapter view has neither loaded player script nor mounted scene; the direct
> anchor opens it paused. Generated static wide/narrow parity is tested; do not
> claim a browser-wide JavaScript-off test. Preview server was restarted on 8770.
> Logs: `/tmp/dl-book-score-field-final-tests.log`,
> `/tmp/dl-book-score-field-final-html.log`. Local review:
> `http://127.0.0.1:8770/chapters/part5/19-generative.html?preview=score-field#score-field-excerpt`.
> The author approved score field for publication. Chapter 16's attention bill is
> next for separate local review; later candidates are not authorized by this request.

> **Score-field publication checks:** both complete PDFs stabilized on attempt 2:
> **548 print / 519 continuous pages**, **390 outline entries** each. Full and
> per-page text, media boxes, outlines, and all **1,067** page raster hashes at
> 36 dpi match the pre-build baseline exactly. Full PDF audits and representative
> visual checks pass, including the static score figure (print 455 / continuous 428).
> Receipt: `/tmp/dl-book-score-pdf-approval.CC5B76/`, especially
> `baseline-fingerprint.json`, `comparison.json`, and both audit logs. The final
> frozen HTML render ran after both PDFs; its asset/metadata and public-anchor
> audits pass (37 pages, 151 assets). All 133 stdout blocks / 27 units remain exact;
> **622/622** tests pass. Logs: `/tmp/dl-book-score-publish-tests.log` and
> `/tmp/dl-book-score-publish-html.log`. A fresh direct-anchor browser load opens
> paused at the initial coordinate, with no page overflow or MathJax errors.

> **Reference-tilt publishing handoff:** the September 11 publication check of
> run **34586598964** showed `in_progress`: HTML interactions, notebook export,
> and all six notebook shards passed. Build/deploy was running, with no failure
> reported. `bc1133f` is pushed but **not yet verified live**.
> No retry, bypass, recurring monitor, or automation was created. Recheck this
> run before publication claims; the preceding signed-zero failure is not assumed
> to recur or to be fixed without a result.

> **Current approved work — reference tilt, September 11, 2026.** The approved
> mask/predictor and responsive repairs were committed and pushed to `main` as
> `d08c41f`; publishing run **34578589278** is the deployment receipt to check.
> The author approved the separate reference-tilt draft for publication after Figure 18.4:
> `18-alignment.html#reference-tilt-excerpt`. It ports the film's four bars and
> beta dial using the book's exact finite-response fixture, not a training replay.
> See [its source and acceptance receipt](reference-tilt-excerpt.md). No shared
> manuscript, freeze, PDF setting, stable tag, or numerical gate changes. Next is
> Chapter 19's analytic score-field picture, for local review before a separate
> publication. This does not authorize a full diffusion/training replay or the
> remaining candidates.

> **Reference-tilt local acceptance:** the full interaction command passes
> **580/580** tests, including **41** independent scene tests. After a final CSS
> contrast fix, the 41 scene tests and HTML-assets/public-anchor/fixture audits
> pass again. The full frozen HTML build is complete; Plan-to-Code, Python-source,
> and book-contract audits pass. Fixture coverage is **12** scenes, **65** manuscript
> literals and **30** reverified lecture digests. All **133** stdout blocks across
> **27** units and all HTML/TeX pairs remain exact against `d08c41f`. A plain-Pandoc
> Chapter 18 LaTeX comparison is byte-identical with and without both HTML-only
> filters (`/tmp/dl-book-reference-tilt-latex.iJZh39/`). Publication validation then
> rebuilt both PDF profiles to the outline fixpoint on attempt 2: **548** print and
> **519** continuous pages, **390** outline entries each. Full/per-page text, media
> boxes, outlines, and all **1,067** page raster hashes match the pre-build snapshots;
> both full PDF audits and representative visual checks pass. Evidence:
> `/tmp/dl-book-reference-pdf-approval.ughbcd/`. Browser review at measured **1119** and **390**
> CSS-pixel viewports checked the opening, beta-one and final witnesses, no page
> overflow, no MathJax errors, native beta-arrow control without time seeking,
> real playback/pause and restoration of timeline beta, and expanded-view entry/exit.
> Only the opened scene's deferred script loads; Chapter 18's mask player remains
> unloaded. Static parity and script-free layout are tested through generated SVG
> and CSS, not a browser-wide JavaScript-off run. Probability labels carry a white
> stroke so a crossing dashed reference outline cannot obscure their digits.
> Logs: `/tmp/dl-book-reference-tilt-full-tests.log`,
> `/tmp/dl-book-reference-tilt-final-tests.log`, and
> `/tmp/dl-book-reference-tilt-final-html.log`. Preview:
> `http://127.0.0.1:8770/chapters/part5/18-alignment.html?preview=reference-tilt-final#reference-tilt-excerpt`.
> Author review is complete. Prior publishing run **34578589278** failed in
> notebook shard 4: Chapter 18's public/reference executions printed opposite signs
> for rounded zero in `recovered centered scores`, tripping exact stdout checks.
> Other notebook jobs and HTML interactions passed; deployment was skipped.
> Source: that run's failed-job log and `notebook-validation-evidence-4-1` artifact.
> Do not normalize frozen output, widen a tolerance, bypass CI, or resume the
> numerical-runtime migration as part of this HTML-only publication. A fresh push
> rechecks the existing contract; record its result independently.

> **Current animation work — September 11, 2026.** Work in
> `/Users/hs9hd/dl-book-html-release`. The author's `main` commit `0674cab` contains
> ten scenes, including backpropagation and four Wave 2 additions; the older status
> blocks below are historical. A review found two raw LSTM equation references and
> four unreadable phone-width no-JavaScript fallbacks. The author authorized their
> repair, handoff cleanup, and Chapter 18's mask/predictor excerpt. After reviewing
> the shifted-target revision, the author approved publication on September 11.
> Chapter 18 reference tilt is next, for local review before a separate publication.
> Keep both Chapter 10 scenes: one
> explains direct-path derivatives over time; the other distinguishes stored state
> from exposed output. See [the authoring guide](animation-authoring.md) and
> [the new scene receipt](mask-predictor-excerpt.md). No QMD, frozen evidence,
> numerical tolerances, PDF settings, or release tags change. The runtime migration
> and its monitor remain paused. Verify CI/live assets separately from source state.

> **Local acceptance:** the complete interaction command in
> `scripts/html-tests/package.json` passes **539/539** tests. The full frozen HTML
> render and HTML-assets, public-anchor, Plan-to-Code, Python-source, book-contract,
> and fixture-receipt audits pass. The fixture audit covers **11** scenes and
> **60** manuscript literals; **27** lecture-source digests were rechecked.
> `audit_frozen_stdout.py --base 0674cab --policy exact` confirms **133** unchanged
> stdout blocks across **27** units, with all HTML/TeX pairs matching. No QMD or
> freeze file is changed. Pandoc-only comparisons for Chapters 3, 8, 10, 17, and 18
> are byte-identical with and without both excerpt filters. The publication rebuild
> subsequently verified both PDF editions as recorded below. Browser inspection covered 1280/390-pixel layouts,
> direct-anchor paused opening, absent deferred scene script while closed, real
> playback/pause, scrubbing, expanded-view controls/geometry, semantic equation
> wrapping, and no page overflow. Static fallback selection and parity are covered
> by CSS/source regressions and deterministic generated-SVG checks; visual review
> inspected their matching active final frames, not a browser-wide JavaScript-off run.
> Two machine-specific `.scratch-sbqg` scripts were removed; recover them from
> `0674cab` if needed. This pass is approved for commit and normal push to main;
> verify the containing commit and live deployment independently.

> **September 11 publication validation:** both PDF profiles reached the outline/ToC
> fixpoint on attempt 2. Print remains **548 pages**, continuous **519 pages**, each
> with the same **390** outline entries. Complete and per-page extracted text, media
> boxes, and all **1,067** page raster hashes at 36 dpi match the pre-build baseline.
> Both full PDF audits pass, including glyphs, text layer, geometry, outline,
> accessible icon text, and retained logs. Ordinary pre-existing overfull-box log
> diagnostics remain; unchanged raster comparisons and representative visual review
> show no new clipping or crowding. Evidence: `/tmp/dl-book-pdf-approval.moTMAv/`.
> Canonical HTML was rendered last from the unchanged freeze. The prior `0674cab`
> publishing run failed only on the two raw `@eq-lstm` references repaired here;
> the new commit must pass the complete publishing pipeline before being called live.

> **Mask/predictor feedback pass:** the author asked us to incorporate only fair
> suggestions. The scene now uses explicit illustrative word aliases for unchanged
> IDs, six aligned predictor/shifted-target columns, target-attached ×0/×1 gates,
> and labeled symbolic log-probabilities. One sequence appears at a time; B stays
> fixed during the excluded-output intervention. The narrower view reflows into
> two three-column strips below a 520-pixel pane, with regression cases at
> 519/520/553 pixels. Inputs remain blue context; only excluded score branches
> are muted. No hover-only attention paths or invented distribution curves were
> added. The scene's **38** tests, source receipts, and independent score/negative
> controls pass (`scripts/test_mask_predictor_excerpt.cjs`); the complete command
> above passes 539 tests. The full frozen HTML was rebuilt, its asset/anchor
> audits passed, and browser review at measured 390/1119 CSS-pixel viewports
> confirmed the phone/desktop arrangement, stable B intervention, zero-change
> receipt, no page overflow after math layout, and no MathJax errors. See
> [the updated receipt](mask-predictor-excerpt.md). The author approved this version.

> **Historical publication record — September 9, 2026.** After the approved
> convolution release `304f3d4`, the author requested the kernel-weighting and
> BERT-ledger candidates next. Both are implemented in `/Users/hs9hd/dl-book-html-release`
> at `12-kernel-regression.html#kernel-weighting-excerpt` and
> `15-bert-pretraining.html#bert-ledger-excerpt` (both under `chapters/part4/`).
> See [the receipt and acceptance record](kernel-bert-excerpts.md). They share a
> small deferred playback helper; the published convolution assets are unchanged.
> **Review update:** the author approved Chapter 12; its scene assets are unchanged.
> Chapter 15 now keeps original/input token pairs visible, reveals input and target
> paths progressively, delays the unchanged-token answer until both loss routes
> arrive, and moves the Boolean flags into a collapsed audit panel. The author
> approved this BERT revision and requested a push to main. A one-line shared-loader fix opens a directly
> targeted nested disclosure as well as its ancestors; playback remains paused.
> The canonical QMD sources, freeze, numerical gates, PDFs, and stable tags remain
> unchanged in content and settings. The new filter is a tested LaTeX no-op.
> Backpropagation remains **planned**. Verify the containing commit's publishing
> run and live assets before claiming deployment. The numerical migration and monitor remain
> paused. Local acceptance: all **86** interaction tests pass (43 existing plus
> 43 mechanism checks); the full frozen HTML render, asset/public-anchor/Plan-to-Code/Python/
> book-contract audits, and whitespace check pass. All **133** stdout blocks in
> **27** units are byte-identical to `HEAD`; all 27 HTML/TeX pairs match. Browser
> review covered desktop and measured 390/300 CSS-pixel widths, no horizontal
> page overflow, compact controls, real playback/pause, and separate BERT routes.
> Fullscreen entry/exit and geometry passed; emulated-fullscreen screenshots were
> not reliable, so DOM/interaction checks (not those images) support that claim.
> Both local preview tabs are left at time zero, paused, with no console errors.
> The future-reference guide, [Mechanism animations](animation-authoring.md),
> explains all three players, their teaching boundaries, the small shared transport,
> accessibility, responsive geometry, and the publication checklist.
>
> **Full publication build record:** `scripts/render_pdf_profiles.py` rebuilt
> `_book/Deep-Learning--Making-It-Learnable.pdf` and
> `_book/Deep-Learning--Making-It-Learnable--Continuous.pdf`; both reached the
> outline/printed-ToC fixpoint on attempt 2. Print remains **548 pages**, continuous
> **519 pages**, each with **390** identical outline entries. Both files' full and
> per-page extracted text match the before-build baseline byte for byte; all
> **1,067** page raster hashes at 36 dpi match as well. The pre-push live PDFs'
> extracted text also matches that baseline. Full PDF geometry, glyph, outline,
> accessible-icon-text, and retained-log audits pass without warnings. Canonical
> HTML is rendered last to restore its complete support bundle. The containing
> commit's CI still runs notebook validation and rebuilds/audits both PDF editions;
> do not bypass that pipeline or infer a successful deployment from local checks.

> **Historical Chapter 7 publication record — September 9, 2026.** An optional, closed
> **Watch the mechanism** disclosure follows the 2-D recipe. It is a compact
> adaptation of the instructor's PatchScore scene and an explicitly labeled
> walkthrough of existing Exercise 1. One local script loads on opening; playback
> remains paused until requested. Input/parameter roles, written/unwritten outputs,
> keyboard controls, transcript, and static fallback are tested. See
> `docs/convolution-excerpt.md` for source hashes, integration, and the PDF boundary.
> QMD sources, `_freeze`, numerical tolerances, notebook-generation rules, PDF
> settings, and release tags are unchanged. The author approved publication after
> local review; verify the commit's publishing run and live anchor before reporting
> deployment. The existing pipeline rebuilds both PDFs and must preserve their
> content and pagination. The separate numerical migration and its scheduled monitor remain
> paused; do not resume them under this task.
> The follow-up movie-style controls add continuous Play/Pause, playback speed,
> elapsed time, scrubbing, Replay, and fullscreen with a native-dialog fallback.
> The focused-player shortcuts do not intercept native control keys. The scoped
> interaction suite now passes 43 tests; numerical output remains unchanged.
> Default playback is 1.5x. On-diagram rays replace the position selector: one
> matched input/kernel pair feeds multiplication, then all nine products feed
> addition and the current output. The two-by-two matrix layout reserves operator
> gutters; rays remeasure on resize and clear during placement/sliding.
> Source receipts and checks are in the same doc.
> The transport is now one compact on-pane bar: Play/Pause (Replay at the end),
> scrubber, clock, speed, and fullscreen. Separate step/reset buttons and visible
> step-count/help rows are removed; named icons and keyboard routes remain.
> The publishing workflow requires `html_interactions` (test-only Node dependencies)
> alongside notebook validation. The next candidates are recorded in
> [the animation roadmap](backlog.md#focused-animation-roadmap--approved-september-9-2026):
> backpropagation, kernel weighting, then BERT's masking ledger. Build and review each
> separately; no additional animation is bundled with this publication.

> **HTML maintenance — September 8, 2026.** The HTML-only split from the pending
> numerical-runtime work adds independent **Reveal results**, responsive table
> inspection, and inline-code wrapping. Plan steps and Show all code restore
> output nodes to their original positions; searching a printed value can open
> only its result. Prose-output wrapping follows moved nodes. The manuscript,
> `_freeze`, numerical gates, publishing/notebook pipeline, PDF configuration,
> and stable tags remain unchanged from main `c058d1f`. This does not accept or
> complete the separate runtime migration. The content-date stamp stays fixed.
>
> Run the scoped browser regressions with
> `npm ci --prefix scripts/html-tests --ignore-scripts` then
> `npm test --prefix scripts/html-tests`; the package runs both
> `scripts/test_plan_result_disclosure.cjs` and
> `scripts/test_responsive_tables.cjs`. These dependencies are test-only and
> are not shipped with the website. Also check real browser Find, keyboard
> scrolling, result/source round trips, and phone/desktop reflow after rendering.
> The HTML review used existing published downloads from `gh-pages`
> `d0eaecb91dead06145010aa508e96e6613a0cd4f`, verified against their Git blob IDs,
> solely to complete the local bundle; it did not regenerate numerical evidence.

> ## Current state — 2026-09-02 (read this first)
>
> The manuscript is **complete and released**: tag **v1.3** carries the stable
> course-arc PDFs and is the fixed edition to cite and pitch. The live canonical
> HTML is a rolling post-v1.3 build, with chapters
> 1–20, three interludes, five appendices, and an epilogue. The July 28
> comprehensive audit is complete: verified glyph losses are repaired, chapter
> retrieval/source contracts are uniform, exercise modes are canonical, and
> attention-as-test-time-regression is now its own interlude. Phases D–F add only
> HTML-native source, lecture-resource, deferred-loading, and executable-notebook
> affordances; the two released v1.3 PDFs remain fixed. **Nothing is mid-flight.**
> Every open item is a decision waiting on
> the author — see **§9**,
> which supersedes any older status text below it.
>
> The universal code pass covers all 194 learner-visible Python surfaces; 95
> `echo: false` execution-support cells are intentionally exempt. Every plan has
> at most six steps and every step maps to a bracket-only numbered marker
> (`# [1]`, or fused `# [2][5]`) in executed or tested source. Descriptive text
> after a marker is a contract violation. Project-root-aware `book-include=`
> keeps the four canonical
> transclusions stable in chapter and whole-book renders. The audit lives at
> `scripts/audit_plan_code.py`.
> In canonical HTML, the Plan stays visible while its Code region is initially
> closed. Click a plan item or use Enter/Space to reveal the executed cell and
> highlight the region begun by the matching marker; selecting it again or
> pressing Escape closes the code. A per-panel **Show all code** control removes
> the discoverability tax for skimming and instruction without weakening the
> plan-first default. The interaction preserves fused markers,
> stacks at the existing 900-pixel breakpoint, and leaves both PDF editions
> static and content-equivalent.
> Because all formats share `_book`, render the two derived PDFs first and the
> canonical HTML bundle last with `--no-clean`. A PDF profile can prune Quarto's
> generated `site_libs`; `scripts/audit_html_assets.py` makes any resulting missing
> stylesheet or script a build failure.
>
> Chapter 1 now follows the author's momentum-first revision: sparse em dashes,
> show-then-name geometry, three new TikZ figures, colour-linked equations,
> rank-aware `torch.linalg.lstsq`, a 3-D loss landscape, a three-method loss
> diagnostic, concise empirical/population risk, and a Gaussian
> likelihood/CLT/maximum-entropy bridge. Its second author pass reverses Figure
> 1.1's row annotation, makes semantic colours consistent across equations,
> prose, and diagrams, distinguishes the early two-parameter drawing loop from
> the complete three-way implementation, removes the Lasso detour, and leaves a
> ridge-only exercise plus a careful angular-responsiveness footnote. Chapter 6
> names shifted risk $R_{T_\#P}$ and the augmentation population objective
> $R_{\mathcal A}$.
> The August 8 completion carries the same semantic roles through the dataset,
> empirical/population risk, MSE residual, gradient, Gaussian likelihood, ridge,
> bias--variance, and linear-to-neuron equations. Responsive long displays retain
> authored logical breaks and fit their equation numbers at phone width.
>
> The July 26 Chapter 1/SGD visual pass replaces Figure 1.1's ambiguous
> frame-pointing arrows with a highlighted first row, highlighted $y_1$, an
> explicit same-example connector, and collision-free $n\times d$ dimensions.
> Figure 1.5 labels only its iterative panels as gradient steps. Equation 1.5
> uses authored line breaks plus a no-clipping MathJax fallback. A semantic-colour
> linear computation circuit now closes Chapter 1's three implementations;
> Chapter 2 preserves it as the score path, and Chapter 3 adds the bend. Chapter
> 4's two-zone SGD figure verifies the fixed-point equality between the mean
> equal-batch direction and the full direction, then shows batch disagreement at
> the empirical optimum; its explanation and reading list are grounded in
> Strang §VI.5. Narrow HTML viewports contain long math and code locally instead
> of creating page-level horizontal panning.
>
> The pacing pass applies **show, then name** across chapter boundaries: Chapter 2
> plants weighted selection without revealing attention, Chapter 13 names it
> only after the behavior is built, and the autoencoder interlude now teaches
> its own contract before PCA and recurrence. It also adds the neuron
> threshold/bend plot, replaces the two Chapter 8 sandal views with one coat,
> adds Chapter 9's component → block → architecture grammar, and rebuilds
> Figures 4.4 and 14.4. Three completed Rivanna studies replace their backlog
> promises with 30 pinned per-seed records: the Chapter 9 full-data
> Fashion-MNIST scorecard, the ResNet-18 transfer rematch, and the Chapter 10
> WikiText-2 word-LSTM scale study.
> Figure 9.1's component, block, and architecture rows are now collision-free at
> the TikZ source. Its SVG scales fluidly at ordinary widths, then preserves a
> legible vector width inside a local horizontal inspection strip on phones while
> the caption and page continue to reflow. Responsive presentation never
> substitutes for correcting internal diagram geometry. The aspect-ratio classifier
> and accessible narrow-screen frame live in `responsive-figures.html`. The repaired
> figure, Chapter 1 equation, web-identity, cover, open-support, and front-door passes
> culminate in the v1.3 derived PDFs at 548 print pages and 519 continuous-screen pages; both full conversions pass the PDF geometry,
> text-layer, and glyph audit.
> Chapter 1's Figure 1.9 now preserves the output axis from its repeated-fit panel
> into a literal $x_0=0.65$ slice. Seeded KDE profiles replace cosmetic jitter, and
> separate dimension arrows distinguish bias, prediction variance, and irreducible
> noise without changing the decomposition or any printed numerical output.
>
> The current audit parses 285 executable cells, four transclusions, and sixteen
> included modules/scripts. The build now checks Plan → Code structure, exercise
> tags, chapter checks and sources, book voice, interlude namespaces, frozen
> stdout parity, LaTeX missing-character diagnostics, PDF replacement glyphs,
> and decorative icon extraction. Interlude figures use independent `EX.`,
> `AE.`, and `TTR.` namespaces; their display equations are unnumbered. Pure
> plotting canvases in the densest learner listings run in adjacent hidden
> harnesses while kernels, data, checks, metrics, and stdout remain visible.
> The experimentation interlude's numbered tables use their own `EX.` namespace in
> both formats, matching its figures.
>
> The canonical web edition carries the favicon, description, Open Graph/Twitter
> social card, and citation metadata as an audited publication contract. MathJax is
> pinned exactly at 4.1.3; native line breaking remains a controlled future
> evaluation, while authored responsive wrappers remain the present contract. The
> link palette clears WCAG AA on white, Chapters 14 and 20 wrap prose-like stdout
> locally, and the two formerly soft Part II figures now exceed 1,500 pixels wide.
> A branded 404 page returns stale links to the canonical table of contents.
> The two derived PDFs now begin with the author-supplied cover while retaining the
> searchable title page and title verso. The Preface closes with one optional support
> invitation in all formats: the book remains free at $0, nothing is gated, and the
> single Buy Me a Coffee link leaves contribution amounts to the external account.
> Do not invent amount-specific URLs or embed a tracking widget. The sidebar PDF
> action opens the cover-led `download.html`, which is copied as a project resource
> and offers direct free links to both PDF editions. It states a $0 minimum, marks $20
> as suggested, and links that amount directly to Buy Me a Coffee. Do not recreate a
> local amount picker that cannot transfer its choice; support never gates downloads.
> Ancillary web surfaces now begin quiet: the **About this edition** and **Revision
> notes** callouts and all root chapter groups are closed by default, while Quarto
> expands the active chapter's parent Part for orientation. The **Get the PDF** action
> sits immediately below the sidebar title, resolves correctly from every
> chapter depth, and leads to that landing page. `disclosure-interactions.html`
> supplies keyboard and deep-link
> behavior for collapsed callouts and keyboard access to collapsed chapter groups;
> narrative tips, traps, and retrieval checks remain open under the momentum-first
> contract.
>
> The September 1 web audit makes those surfaces mechanically complete: every
> rendered figure has a source-authored text alternative, Chapter 14's Sources
> heading renders as a real section, every page carries one canonical URL and one
> deterministic edition stamp, and raw authoring syntax cannot leak into public
> prose. `scripts/postrender_html.py` contains a deliberately narrow alt-text
> compatibility shim: it reads `#| fig-alt:` from labeled manuscript cells,
> including custom `exfig`, `aefig`, `ttrfig`, and `epfig` wrappers, and fills only
> a missing or empty rendered `<img alt>` attribute. It never overwrites a non-empty
> alternative emitted by Quarto. Keep the manuscript `fig-alt` authoritative and
> retain the all-main-images audit until frozen/custom-float metadata preserves
> those alternatives reliably. The branded 404 page now starts with the same
> keyboard-first skip path as the book.
>
> The September 2 Phase B pass makes the front door state the book's independent
> scope, locate its distinctive reading loop among standard references, and map the
> five-part learnability route before the detailed course table. Cross-volume links
> are optional further routes; a warning-only rendered-prose audit surfaces future
> dependency language. On phone widths, the four-column route stays legible inside
> a local keyboard-accessible inspection region rather than compressing words into
> letter-wide columns. The visible edition stamp means **content-revision date**,
> not CI wall-clock date: `_quarto.yml` changes only when the rolling manuscript or
> its public presentation changes, so rebuilding the same commit is deterministic.
> Phase C gives each of the five Parts a file-backed transition page. Those pages
> state the entering object, learnable move, built-in structure, and failure handed
> forward without turning into syllabus summaries. Part III is now **Sequences:
> Learning the Summary** and Part V is **The Pretrained Era: Learning What to Reuse**;
> the route table, sidebar, HTML pages, PDF openers, and contents agree. The five
> existing Part bookmarks move to those openers rather than duplicating, so each
> derived PDF retains 390 audited outline entries. File-backed Parts repaginate the
> release to 548 print pages and 519 continuous-screen pages.
> Phase D gives all 35 QMD-backed HTML pages one direct GitHub Source control and
> adds an accessible chapter-tools strip to the exact 30 non-Part reading pages.
> Twenty-seven pages link specific public DS 6050 videos, slide decks, or course
> segments; the Preface, Epilogue, and notation appendix use the complete playlist,
> as recorded in `docs/lectures-unresolved.md`. The five Part transitions remain
> quiet, and Quarto's
> global show/hide code toggle stays disabled so it cannot fight Plan → Code.
> Phase E closes the four remaining web-reading polish items without touching print.
> Native Find-in-page can reveal a collapsed code token and activate its owning plan
> step; MathJax 4.1.3 typesets inline and unnumbered mathematics lazily while keeping
> numbered equation targets eager; every content image after the first uses lazy
> loading and asynchronous decoding; and the PDF landing page prefers a 230,262-byte
> WebP cover with the original PNG fallback. The HTML audit pins all four source and
> rendered contracts, while browser checks protect equation numbers, equation links,
> Show all, and the native-find interaction. Phase F publishes 26 generated source
> notebooks from the canonical manuscript: 193 learner-visible Plan → Code surfaces,
> one commit-pinned and checksum-verified bootstrap per unit, and six clean execution
> shards. Each compact notebook must match a full Quarto-derived reference byte for
> byte on the same runner. A separate portability ledger compares the result with the
> frozen HTML stdout: exact is the default, and only narrowly reviewed numerical or
> structural contracts may differ across platforms. The Appendix A1 and Chapter 18
> public/reference pairs use a recorded one-thread numerical-library environment to
> remove process-level LAPACK reduction drift without perturbing seeded training
> elsewhere. Chapter 18's hidden setup keeps its six-thread manuscript default, but
> honors and asserts the CI-only PyTorch override inside notebook validation and the
> weekly full-manuscript execution audit.
> Deliberately heavier chapter cells may still choose their own PyTorch thread count, and
> the output gates remain authoritative. The Preface, Epilogue, and two non-executable
> appendices retain honest unavailable placeholders; executed copies remain CI evidence
> rather than public downloads.
> The next print-affecting cut must pair byte-reproducible PDF builds with the five
> KOMA-Script `\setpartpreamble` Part openers, then accept their repagination and outline
> changes as one audited change.
>
> Chapter 14 now closes with the Transformer and hands off to the
> **Attention as Test-Time Regression** interlude. Chapter 15 separates
> visibility, eligibility, supervision, and corruption with a Boolean ledger;
> Chapter 19 adds an analytic Gaussian-mixture score field and names
> classifier-free guidance. RoPE, RMSNorm, grouped-query attention, and the
> controlled-evidence limit on in-context learning are now named at the point
> where their mechanisms have earned the name.
>
> The Chapter 15 editorial follow-on removes the remaining off-page live-session
> and internal seed-note residue book-wide, adds a CI tripwire for that splice
> class, and clarifies that the displayed GRU equation follows Cho et al.'s
> original keep-old update-gate convention. Chapter 15 now adds a controlled-lab
> schematic that exposes its covered/uncovered type roles and a visibility
> triptych for BERT, GPT, and T5.
>
> The July 29 closeout gives the epilogue an independent `E.` figure namespace in
> both formats and states the edition contract explicitly: HTML is canonical; PDF
> is its derived print conversion. RMSProp's original slide-deck provenance is back
> in Chapter 4. All three interludes are visibly prefixed and end with a retrieval
> check. The CI contract now pins NUL, missing-character, and leak-vocabulary
> tripwires. A twelve-proposal exercise review adds ten new exercises and strengthens
> two existing ones; that pass held the build at 546 pages.
> A final receipt-and-callback follow-up gives the epilogue its two primary-source
> entries and makes Part III say the book's question aloud: recurrence asks us to make
> the carried summary learnable. The added epilogue leaf and recto appendix opening
> bring the rolling PDF to 548 pages.
>
> The Chapter 20 deep pass closes the temperature thread planted across the book:
> Chapter 12 interprets temperature as bandwidth, Chapter 13 learns the comparison,
> and Chapter 20 now asks what changes when the logit scale itself is learned. Its
> new exercise derives the symmetric-loss gradient, specifies a paired fixed-versus-
> learned study, and separates joint training sharpness from Chapter 16's post-hoc
> calibration. The CLIP source note distinguishes the paper's scale cap from the
> uncapped released implementation.
>
> The final Part II pass certifies Chapters 7–9 under the same equation,
> printed-number, prose, source, exercise, and convention battery used later in
> the book; its only findings were two Chapter 9 splice typos, now repaired.
> Chapter 15's complete lab also reproduces exactly from its canonical source.
> `scripts/audit_python_sources.py` now protects the lab's self-contained design
> by rejecting repository-local imports and code transclusions in that chapter.
>
> The v1.2 release polish restores Chapter 16's post-hoc temperature-calibration
> exercise to both formats, leaves the epilogue's control equations unnumbered,
> standardizes `minibatch` and `feedforward` in authorial prose, and protects the
> page-316 no-position sample's searchable PDF text with a targeted regression.
>
> The post-v1.2.1 print-hardening pass preserves all 133 stdout blocks byte for
> byte and every HTML/TeX stdout pair matches. Learner-visible Python is guarded
> at 88 columns; `fvextra` wraps code and frozen stdout as a print-side safety
> net; and the PDF audit now fails on media-box loss while reporting smaller
> text-block intrusions for visual review. Three LaTeX passes are the floor; the
> bounded PDF build loop then requires every outline destination to land exactly on
> its rendered heading in both profiles. Starred headings create their anchors only
> after page-breaking, and the experiment tables stay in place so their intervening
> derivation cannot disappear. CI pins Quarto 1.10.18, the version under which this
> full-outline contract was verified. The
> title page identifies the rolling build and the title verso records copyright,
> licensing, the canonical HTML edition, stable citation guidance, and UVA.
> The August 5 presentation-only pass reduces the shared PDF margin from 1.1 to
> 0.85 inches without changing HTML or manuscript content. The two-sided print PDF
> repaginates from 560 to 524 pages. A new one-sided, open-any continuous-screen
> profile establishes a 539-page old-margin baseline and renders in 502 pages at
> 0.85 inches. Both editions retain the three-pass reference, geometry, glyph,
> text-layer, outline, and accessibility gates.
>
> The August 6 coherence pass adds Appendix E as the optional statistical-contract
> retrieval layer used across Chapters 1, 4, 6, 18, and 19. Chapter 1 now shows
> repeated datasets, prediction spread, and the classical summary before naming
> bias and variance. Chapter 6 separates representation, optimization, and
> generalization evidence before its failure experiments. Chapter 18 bounds its
> alignment contract within broader data-rights, distributional, production, and
> governance questions. The canonical HTML passes a 390-pixel no-overflow check;
> the derived 0.85-inch PDFs now contain 530 print pages and 508 continuous-screen
> pages, with all 133 frozen stdout blocks unchanged.
>
> Fresh session? Read `CLAUDE.md`, then §9 and §2 of this file, then
> `docs/style-guide.md` and `docs/arc-seeds.md`. A paste-ready bootstrap prompt
> lives in `docs/NEW-CHAT-PROMPT.md`.

---

## 1. Where the project stands

**Live:** https://shakeri-lab.github.io/dl-book/ (canonical HTML edition plus its
derived PDF conversion, auto-deployed from `main` via GitHub Actions → `gh-pages`).

**Cross-book interface:** v1.2.1 protects the ten anchors consumed by
*Deep Learning: Making It Trainable* in `docs/public-anchors.md` and CI. Five bounded
forward pointers and mutual colophon links complete the D23 reciprocity contract; any
future move of a declared anchor requires a coordinated update in both repositories.

**Format authority:** HTML is the source of truth for the book's content, order,
semantics, and interactive/responsive presentation. PDF is the print/offline
conversion of that edition. PDF-specific work may adjust pagination, line breaks,
float placement, and print-safe sizing, but must not introduce a separate substantive
edition. Resolve disagreements in the shared Quarto source or conversion layer.

| Part | Chapters | Status |
|---|---|---|
| I · From Lines to Networks | 1–6 | **Shipped; repair pass complete and verified** (July 11, 2026) |
| II · Vision: Learning the Filters | 7–9 | **Shipped; repair pass complete and verified** (July 11, 2026) |
| III · Sequences: Learning the Summary | 10–11 | **Shipped; repair pass complete and verified** (July 11, 2026) |
| IV · Attention: Learning the Similarity | 12–16 | **Shipped; Transformer revision verified** (July 28, 2026) |
| V · The Pretrained Era: Learning What to Reuse | 17–20 | **Shipped and two-format verified** (July 15, 2026; ch. 19 revised, ch. 20 added) |
| Unnumbered bridges | Experimentation/HPO after ch. 6; PCA/autoencoders after ch. 9; attention as test-time regression after ch. 14 | **Shipped and two-format verified** (July 28, 2026) |
| Epilogue | The Question Is Yours | **Shipped; memory-to-planning frontier verified** (July 15, 2026) |
| Appendices | A–E | **Shipped and verified** (Appendix E statistical-learning contracts complete August 6, 2026) |

**Milestone 1** (Part I complete + skeleton) is met. The July 11 quantitative,
mathematical, licensing, evaluation-hygiene, and two-format repair pass over Chapters
1–11 is complete and shipped: every HTML/TeX freeze is newer than its source, key outputs
match across formats, and selected figures were visually verified. Chapter 12 is also
complete, with its fixed-kernel experiments pre-tested, frozen in both formats, and
verified in the full-book PDF. The author's own edit pass remains a separate gate rather
than a condition of either release.

The July 15 course-alignment pass adds two unnumbered bridges without renumbering any
chapter or changing existing chapter URLs. **Interlude: Who Trains the Trainer? Learning by
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
“attention is regression” and identifies the 2024–26 research program. The
test-time-regression interlude
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
page, the material now housed in the test-time-regression interlude fits nine pages,
and the epilogue frontier fits two. Every affected unit was
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
test set. The former memory-spectrum price table is now a two-axis retained-state
and per-token-cost diagram in the test-time-regression interlude. An audit of all 100
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
solvers in the test-time-regression interlude change the statistical contract instead.

**Decisions still gated on the author:**
- The author's final prose/sign-off pass remains a separate gate after the technical
  release. For this extension it covers Chapter 10's two-sentence forward pointer;
  Chapter 12's precision/research boxes; the test-time-regression interlude and its
  exercises; Appendix C's
  KV-cache/schedule bridge; the epilogue taxonomy and Riccati frontier; the entire
  maintainer exercise bank; and the Modules 8–10 readings, outline, prompt, and five
  self-checks. The manuscript blocks and exercise bank retain their `NOVEL` markers;
  the pointer, part of Appendix C, and course-site data have no separate marker.
- "Deeper dive" collapsed sections: piloted in ch. 6; his verdict pending ("let us
  get back to deeper dive later"). The explicitly requested epilogue Riccati box is a
  one-off frontier treatment; it does not settle that global verdict or authorize
  retrofits in chs. 1/5.
- The first Rivanna publication pass is complete for Chapters 9–10. The remaining
  research-scale jobs stay backlog-only until each comparison has a predeclared
  contract and real results. Do not publish placeholder callouts.

## 2. The working protocol (refined over chapters 7–20 and Appendices A–E)

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
   `$HOME/.venvs/dl-book/bin/python`): tune regimes until the phenomenon honestly appears; pin
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
   Review HTML first because it is canonical; then verify that the derived PDF
   preserves it subject only to print-format constraints.
6. **Verify**: extract every printed output from
   `_freeze/…/execute-results/html.json` and check each against the prose; `Read`
   every generated figure PNG and check it against its caption (mis-captioned
   figures happened twice before this habit).
7. **Fix prose to match outputs** (never the reverse unless the experiment is
   wrong). Batch all fixes, then re-render once — *any* qmd edit invalidates the
   freeze and forces full re-execution (5–15 min for training-heavy chapters).
8. **Full book render**: export
   `QUARTO_PYTHON="$HOME/.venvs/dl-book/bin/python"`, run
   `"$QUARTO_PYTHON" scripts/render_pdf_profiles.py`, then render the canonical
   HTML last with `quarto render --to html --no-clean`. Verify that both PDFs picked
   up the chapter (`pdftotext … | grep <distinctive phrase>`).
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

*Location note (July 25, 2026): the working tree moved into Box at
`~/Library/CloudStorage/Box-Box/Teaching/6050/dl-book`, by the author's choice, to
sit with the rest of the 6050 material. The virtualenv stays outside at
`~/.venvs/dl-book`; GitHub remains the source of truth, and a corrupted object
store is repaired by re-cloning, never in place.*

*Setting up a machine from scratch rather than re-checking one? Use
`docs/NEW-MACHINE-SETUP.md`, which covers the toolchain, the Python environment,
credentials, and a two-step verification that the new machine reproduces the
committed book.*

Everything in CLAUDE.md §Environment still applies. On a fresh account verify:
- `~/dl-book` exists locally (NOT in Box) and `git remote -v` points to
  `Shakeri-Lab/dl-book`.
- `gh` authenticates via the `git credential fill` pattern (never echo the token).
- venv intact: `~/.venvs/dl-book/bin/python -c "import torch; print(torch.__version__)"`
  (it lives outside Box on purpose).
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
E. **Pedagogical efficiency** (drafting-template): identify every concept's payoff
   privately in `docs/arc-seeds.md`; no payoff → exercise or cut. In learner-facing
   prose, plant the behavior before the later construction's name.
F. **Honesty gate**: printed numbers must support the prose exactly; overclaims
   get toned down, not numbers massaged. When an experiment refuses to show the
   textbook result honestly, the null result with a diagnosis is usually the
   better chapter (precedents in §5).
G. **GPU queue** (revised July 25): experiments needing full-dataset/GPU scale get an
   entry in `docs/backlog.md` §5, not an in-chapter placeholder. The first Rivanna
   pass completed the Chapter 9 scorecard/transfer and Chapter 10 language-model
   studies; their scripts and 30 records live in `experiments/rivanna/`. Never fake a
   scaled-down win; publish a scaled result only after it has actually run.
H. **Licensing**: no d2l.ai text/code ever (his `rnn_data_prep.py` is D2L-derived
   — reference conventions only, never port). Committed third-party assets note
   their license (e.g., `data/squeezenet1_1-imagenet.pt`, torchvision BSD-3).
   No render-time downloads, ever.
I. **Reading order**: chapter N's code uses only tools introduced in chapters
   ≤ N. The introduced-tools ledger lives in `docs/arc-seeds.md` §3.
J. **Exercises**: normally 4–5 core items, tagged **(Pencil.)** / **(Code.)** /
   mixed, each reinforcing an arc point; open-ended phrasing for untested outcomes.
   A specifically requested addendum may expand the chapter list or use a separately
   scoped maintainer bank, as the test-time-regression interlude and
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

### Interlude after ch. 6 — Interlude: Who Trains the Trainer? Learning by Experiment
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
- **Memory spectrum shipped**: the test-time-regression interlude writes one online
  regression objective and
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
  projections and feedforward work.
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
  I/O-efficient schedule from the test-time-regression interlude's lossy fixed-state
  statistical contracts.
- **Appendix D — Notation (SHIPPED):** derived directly from
  `tex/macros.tex`, `mathjax-config.html`, and actual manuscript usage. It records
  typography, decorations, index/dimension roles, recurring dense/image/sequence/
  attention shapes, probability and optimization conventions, and a four-question
  notation audit. The old public stub/warning is gone; its HTML layout and complete PDF
  range passed QA.
- **Appendix E — Statistical Learning Contracts (SHIPPED):** gathers empirical,
  population, deployment, shifted, and augmentation risks; likelihood-to-loss
  contracts; a bounded Gaussian/CLT/maximum-entropy explanation; KL,
  Jensen--Shannon, and Wasserstein comparisons; Monte Carlo estimator cases; and
  SD/SE/pairing/clustering distinctions. It is explicitly a reference rather than a
  prerequisite, preserving the momentum of Chapters 1, 4, 6, 18, and 19. Six
  canonical exercises, responsive HTML, and the complete six-page PDF range passed
  QA. Prince (2023) was used only as an external completeness crosscheck.

## 8. Document map

| File | Role |
|---|---|
| `CLAUDE.md` (root) | environment + runbook; auto-loaded by Claude Code |
| `docs/CONTINUING.md` | this file — status, protocol, rules, case law, roadmap |
| `docs/arc-seeds.md` | seed/harvest ledger + reader's toolbox (reading order) |
| `docs/style-guide.md` | voice guide + Book-Specific Writing Rules |
| `docs/drafting-template.md` | per-chapter drafting prompt/checklist |
| `docs/backlog.md` | author-requested future work + GPU experiment queue |
| `docs/NEW-CHAT-PROMPT.md` | paste-ready bootstrap prompt for a fresh session |
| `docs/NEW-MACHINE-SETUP.md` | bare-Mac setup: toolchain, venv, credentials, verification |
| `docs/compatibility.md` | living note: tested environment + version-fragile engineering |
| `docs/test-time-memory-control-exercise-bank.md` | D7 maintainer/course bank + concise solution sketches; intentionally outside book navigation |
| `docs/dl-course-code.md` | how to use his Manim repo (module spines, scenes) |
| `docs/lectures-unresolved.md` | honest playlist fallbacks for the HTML chapter-tools manifest |
| `docs/enhancement-proposal.md` (in dl-course-site repo) | course-site history |

*After every shipped chapter or appendix, update §1's table, the arc-seeds ledger,
and the GPU queue. These documents are the project's memory now.*

## Commit authorship (standing rule, July 2026)

Do not add AI attribution anywhere in git history: no `Co-Authored-By: Claude ...`
trailers, no "Generated with Claude Code" lines, in this or any of the author's
repositories. The pre-July-17 history was rewritten to strip these; do not
reintroduce them.

## 9. Recent passes and open decisions (July 17–25, 2026)

*This section supersedes older status text above it.*

### What shipped

**Plan v2 — readable code and estimator discipline (all seven phases, tag v1.1).**

- **Editorial contract** in `docs/style-guide.md`: equation / kernel / harness with
  the five-part visibility test; the five-question chapter contract; three
  conditions before visualising internals; replace-don't-append; the refusal
  ledger (named non-imports, with reasons).
- **Canonical listings as tested source.** `code/` is an installable package
  (`pip install -e ./code`, already in `requirements.txt`): Listing 4.1
  `fit_supervised` (`code/dlbook/supervised.py`), Listings 10.1/10.2
  `fit_next_token` / `fixed_window_loss` (`code/dlbook/training.py`,
  `evaluation.py`). Printed once via `include=`; chapters 6, 8, 14 import them and
  print only their deltas.
- **Estimator discipline.** `#sec-04-estimator-cases` states three cases exactly
  once — decomposable, nonlinear-functional-of-aggregate, batch-defined — with
  one-sentence case reminders at chapters 11, 15, 18, 19, 20 and the two verified
  `(Audit.)` traps in chapter 19 (the β·D_x reduction identity; the
  aggregate-posterior Jensen bias, β-TC-VAE cited).
- **Pedagogical devices.** Learned-feature-space figure (ch. 3); forget-gate
  diagnostic (ch. 10, replay-asserted, 0.76 vs 0.56); seven predict-before-run
  prompts; RMSProp and weights-as-images provenance footnotes; digit-embedding
  `(Audit.)` exercise (ch. 13); mixture-of-experts in the epilogue.
- **Infrastructure.** Weekly **Execution Audit** workflow
  (`.github/workflows/execute-audit.yml`) deletes freeze caches and re-executes
  every cell from scratch; `include-code-files` extension vendored;
  `docs/compatibility.md` is the living home of version-fragile engineering, with
  Appendix B pointing at it.

**Universal Plan → Code panels (July 25).** One mechanism shown twice: the plan
in the reader's language beside the terse kernel, output beneath the code.

| Piece | Path |
|---|---|
| Two-column grid, chips, Output strip (HTML) | `dlbook.scss` |
| Closed-by-default, click/keyboard step-to-source reveal (HTML) | `plan-code-interactions.html` |
| Stacked print form | `filters/plan-code.lua` + `planbox` in `tex/macros.tex` |
| Rules, authoring form, six-step ceiling | `docs/style-guide.md` |
| Audit | `scripts/audit_plan_code.py` |

All 194 learner-visible Python surfaces now use the panel; 95 `echo: false`
execution-only cells are exempt. Markers in executed/tested source are
bracket-only (`# [1]`, or fused `# [2][5]`) and never repeat the plan text.
Comments remain only when they explain shapes, numerical choices, or non-obvious
behaviour. The audit rejects descriptive marker suffixes. Number carries the
mapping first and colour supports it—never colour alone and never drawn arrows.
The print panel remains an unbreakable box preceded by a page-room check.

**Semantic colour contract (July 25).** Blue identifies inputs/features/design
matrices; orange learnable parameters; purple observed targets; green
predictions/model outputs; wine residuals/errors; neutral gray/black operators
and structure. The PDF and HTML macros are synchronized. Local experimental
series and categorical palettes remain free, and meaning never depends on
colour alone. Selective use is preferred over colouring every variable.

### Standing verification habits (learned the hard way)

- **Bit-diff acceptance.** A refactor must leave the frozen stdout
  content-bit-identical. Snapshot before, re-render, diff
  (`_freeze/<chapter>/execute-results/html.json` → `result.markdown` → the
  `cell-output-stdout` blocks).
- **Span-safe greps** when checking includes: syntax highlighting splits
  `def name` across HTML spans, so grep a bare identifier or a docstring phrase.
- **`include=` paths are file-relative** (`../../code/dlbook/...`), not
  project-relative.
- **Captions carry measured numbers only** — a standalone pre-test is not
  RNG-identical to the chapter's own cell.
- **Renders are slow** (heavy chapter 20–40 min, full book ~40 min). Run in the
  background; never use `--to html` alone for a chapter you intend to ship, or the
  PDF ships stale.

### Open decisions — waiting on the author

1. **NOVEL sign-offs.** Seventy-six `<!-- NOVEL: needs sign-off -->` markers
   remain across eighteen files (invisible in output). Decide whether to close and
   strip them after review or migrate them to a dated ledger so the inline marker
   regains a precise meaning. List them with:
   `grep -rl "NOVEL: needs sign-off" chapters/ --include="*.qmd"`
2. **Delta typography.** Both trials are live in chapter 14 — the elided
   `include` of an imported signature versus the prose-referenced delta cell.
   Pick one and it becomes book-wide.
3. **Remaining research-scale queue.** The first Rivanna pass completed the
   Chapter 9 full-data scorecard/transfer and Chapter 10 WikiText-2 study.
   `docs/backlog.md` §5 retains the larger translation, long-context memory,
   pretrained-language, vision-regime, adaptation/alignment, generative,
   multimodal, device-profiling, and test-time-control rematches. Run only
   predeclared comparisons and keep **all placeholders out of published
   chapters**.
4. **Print-navigation decisions.** Decide whether the web-canonical book should
   gain a curated print index and whether the five currently spare part openers
   should carry 3–6 sentences naming each part's learnability move. Retitling Parts
   III/V is a separate, higher-churn alternative.
5. **Structural symmetry choices.** Decide whether Appendix B needs a recap,
   whether Chapter 20 should keep its deliberately prose-shaped closing recap, and
   whether `(Audit.)` exercises should be added selectively to Chapters 1–12 and
   14. These are authorial cadence and curriculum choices, not contract defects.
6. **Reference and seed conventions.** Decide whether plain `Chapter N` mentions
   should be normalized to links, and document the intentional two-tier seed
   convention rather than silently reseeding frozen studies.

Page arithmetic for v1.1 is recorded honestly in `CHANGELOG.md` (502 vs v1.0's
498: Plan v2 netted about −1 page; the +4 came from the earlier commissioned
figure round).
