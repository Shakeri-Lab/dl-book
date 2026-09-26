# Same subspace, different coordinates: source and review receipt

September 12, 2026. **Author approved for publication** with “push and do the
next.” Publish this scene separately; the next eligible SVD scene requires its
own local review. Mask-before-softmax was separately pushed as `6cde283`.

## One point, two descriptions

If the latent coordinates change, must the reconstruction move?

Placement: `chapters/interludes/making-pca-learnable.qmd`, after the existing
“Same subspace, not the same coordinates” explanation and before “What if the map
could bend?” at `making-pca-learnable.html#same-subspace-excerpt`.

The manuscript already states the orthogonal-basis identity

\[
(V_kQ)(V_kQ)^\top=V_kV_k^\top,\qquad Q^\top Q=I.
\]

Keep one reconstruction point and one retained subspace fixed. Turn the basis
inside that subspace, read the new coordinates by perpendicular projection, and
add the new coordinate-weighted basis vectors head to tail. The components still
reach the original point. Under the manuscript's convention:

\[
z'=Q^\top z,\qquad
\hat x=(V_kQ)z'=V_kQQ^\top z=V_kz.
\]

This is a schematic illustration of an existing algebraic statement, not a new
numerical study. The panel's drawing fixture is `basis=[[1,0],[0,1],[0,0]]`,
`input=[0.55,0.32,0.4]`, with a 60-degree final turn. These layout coordinates are
not printed as measurements. The view looks inside the retained plane; the
off-plane residual is not shown. Both basis and coordinates are recomputed, as is
the reconstructed point, rather than merely drawing a stationary dot.

The later planted-curve study has a one-dimensional code. It admits a sign flip,
not this two-axis rotation. Do not depict this scene as that training run, a
rotation of the data, a change of subspace, or a guarantee of optimizer success.
Rotated columns remain a basis of the principal subspace, but are not generally
the individually ordered principal eigenvectors. Changing only the encoder or
only the decoder need not preserve the reconstruction.

## Film composition, manuscript algebra

`SSameSubspace` in `6050-Interlude-Autoencoders/lecture.jsx` supplies the fixed-point
and rotating-basis composition. Keep the book's `V_kQ` convention throughout:
the encoder produces `Q^T z`, and the decoder uses `V_kQ`. The film's generic
“decoder applies Q transpose” uses the opposite orientation and is not copied.
The untied-case side panel, later curve experiment, film framework, and video
payload are omitted. Shared playback is reused without a new runtime dependency.

SymPy independently verified orthogonality, projector invariance, transformed
coordinates, and reconstruction cancellation for a symbolic 3-by-2 basis and
arbitrary input. Independent browser-harness tests additionally check arithmetic
and geometry across alternate orthonormal embeddings and rotation angles.

## Reveal order

| Time | Reveal |
|---|---|
| 0 s | Predict whether the fixed reconstruction must move. |
| 5 s | Name the original basis inside the retained subspace. |
| 10 s | Read coordinates by perpendicular drops. |
| 15 s | Turn the basis; retain the original axes as dashed references. |
| 20 s | Read the changed coordinates while the point stays fixed. |
| 25 s | Add the new coordinate-weighted basis vectors head to tail. |
| 30 s | Show the paired changes cancel in the reconstruction projector. |
| 35 s | Hold: compare projectors, not raw latent coordinates. |

The silent 40-second player starts closed and paused, at 1.5× speed. On phones the
short explanation sits below the picture. Feature-coordinate projections are
blue, the reconstruction green, and the fixed basis structure neutral; geometry
and labels carry the same distinctions without color. Keyboard transport,
reduced-motion beat holds, transcript and generated wide/narrow fallback follow
the existing player contract. No parameter control is added.

## Why greedy tree remains deferred

**Superseded.** This was true on September 12, 2026. The numerical example it asks
for entered Chapter 11 in `c06892f`, and the greedy-tree scene shipped with it; see
the review pass at the end of this receipt. The original passage is kept as the
record of why this scene was built first.

Chapter 11 prints complete-sequence joint log scores, which do not determine the
per-token conditionals needed for the film's branching tree. The film's separate
`toy_search_tree_evidence` in `audit-ch11-encoder-decoder.py` is not a manuscript
fixture. That numerical example must enter the shared manuscript before an
HTML-only animation may teach it. The current PCA scene can instead illustrate
an identity already present in both editions.

## Acceptance

**43/43 independent scene tests and 748/748 full interaction tests pass.** The
independent oracle checks negative and full turns, alternate 3-D/4-D orthonormal
embeddings, projector symmetry/idempotence, fixed residuals, the wrong-`Q`
counterexample, exact projection/component geometry, deterministic playback and
scrubbing, reduced motion, resize, and generated static-fallback parity.
Logs: `/tmp/same-subspace-tests-final.log` and
`/tmp/dl-book-same-subspace-full-tests.log`.

Actual browser inspection at desktop and 390 CSS pixels found no clipping or page
overflow. Opening, original-coordinate, intermediate-rotation and final frames
were inspected. On phones the cancellation occupies a separate equation line.
Real playback reaches the endpoint; pause holds its state and the pane's keyboard
arrows seek between beats. A fresh chapter visit leaves the disclosure closed and
the script unloaded; direct anchors open it paused at zero. Viewport overrides
were reset after inspection.

**Fullscreen recheck, September 12:** the fresh in-app session successfully enters
fullscreen, renders the complete diagram/equations/controls without clipping, and
exits back to the chapter. The earlier background-session verification limit is
closed without changing shared transport. Automated native/dialog/failure-path
tests also pass.

The full frozen HTML render and all source/HTML audits pass: 16 scene fixtures,
93 literal receipts, 43 verified lecture digests; 37 HTML pages / 154 local assets.
All 133 stdout blocks across 27 units and every HTML/TeX pair remain exact against
`6cde283`. HTML log: `/tmp/dl-book-same-subspace-final-html.log`.
Plain-Pandoc interlude LaTeX is byte-identical with and without the two HTML
excerpt filters: `/tmp/dl-book-same-subspace-{plain,filtered}.tex`, SHA-256
`ac670d28edf2cf3eeedd526e92d1130957269d8d895a0c4537c38fe408e11de4`.
For author-approved publication on September 12, both PDF profiles were rebuilt
completely and stabilized on their second passes: 548 print / 519 continuous
pages, 390 outline entries each. Build receipt:
`/tmp/dl-book-pca-pdf-approval.aNzhwp/`. Canonical HTML is rebuilt afterward in
`/tmp/pca-publication-final-html.log`; all 748 interaction tests also reran green
(`/tmp/pca-publish-all-tests.log`). Complete and per-page extracted text, page
geometries, outlines, and all 1,067 low-resolution page rasters are unchanged
(`comparison.json`). Both PDF audits and representative visual checks pass.
The final HTML asset/anchor audits pass; frozen stdout is exact against `6cde283`.

The three local scene assets total 28,289 bytes, with no new runtime dependency.
Player SHA-256: `4af4dba988197b678521b387514151bbc72d4e6d9fd76415c9b383e18028ff3b`.
Preview: `http://127.0.0.1:8770/chapters/interludes/making-pca-learnable.html?preview=same-subspace-final#same-subspace-excerpt`.
The author has approved this scene. The manuscript, frozen
stdout, PDF configuration, numerical portability gates, stable tags and paused
runtime migration are unchanged.

## Source digests

Lecture paths are relative to
`/Users/hs9hd/Library/CloudStorage/Box-Box/Teaching/6050/Video_lectures/`.

| Source | SHA-256 |
|---|---|
| `chapters/interludes/making-pca-learnable.qmd` | `4b5c2579751769ad33ce575b798a7ed52a3169fd0437eed2ffc0e04e801ac607` |
| `chapters/part3/11-encoder-decoder.qmd` | `ee14ea5a5425d09c46c101a02619bb5c4b7ac0a1bcb753cf76104eea282249f9` |
| `6050-Interlude-Autoencoders/lecture.jsx` | `2d2a0d2bd4c9a8314a79e9bb7ea0afa98077a6ec30ab5e4eb7613fa6e64e91f4` |
| `6050-Interlude-Autoencoders/STORYBOARD.md` | `3d5686f60c10edb6e5b83236adeebccb933811718e3b08d86d10fe6b2921ddba` |
| `6050-Interlude-Autoencoders/pca-autoencoder-data.js` | `c8d4dd8da42275c0997aeaf6330b20cb1284c980f9e51be8f76a346ddd32fde9` |
| `audit-interlude-autoencoders.py` | `578deb6d7813a802ae1a62e903e66990fbf60056c9cca2825269ecba926b6a5a` |
| `6050-Ch11/lecture.jsx` | `00fc79dc8dee86830a59f74a91e43401c855e93638b9384a46395266b6d3271c` |
| `audit-ch11-encoder-decoder.py` | `31dbfd38476c00e7c971bf230a10308c6d3a6a612a3f06580b2c822450c49ba3` |

## Review pass — September 17, 2026

An independent review found the scene clean and effective and listed five
defects. The design, fixture, 40-second duration and beats are unchanged.

- **Labels out of sync.** From 12 s to 15 s the axis and coordinate labels already
  read v′ and z′ while the side label still said "basis V / read both
  projections". One `turned` flag, true from the moment the basis leaves its
  original position, now drives the primes, the dashed original axes, their legend
  and the side label together. Reduced motion holds the beat-2 still unturned and
  unprimed until 15 s. New tests sample every 0.05 s, name 12–15 s explicitly at
  both layouts, and repeat the check under reduced motion.
- **Plain-text math.** "basis V" and "basis VQ" were SVG text. The picture now
  says "original basis" and "turned basis"; V, Q and VQ stay in the typeset
  formula line. The manuscript convention is unchanged: the basis becomes VQ, the
  encoder gives Qᵀz, the decoder uses VQ. A test rejects matrix symbols in any
  picture text, in both script-free prints and at every sampled time.
- **Test-only global and per-frame dumps.** `window.BookSameSubspace` is gone.
  The suite mounts alternate and invalid fixtures through the panel's declared
  data attributes and reads the published state. The old coordinates are written
  once at mount. Origin, scale and axis extent are written in `layout()`. The
  angle, new coordinates, turned basis and components are written only when the
  angle changes, and the stage only when it changes. The projector is no longer
  dumped: the oracle forms (VQ)(VQ)ᵀ from the published basis and compares it with
  its own VVᵀ. The duplicated `data-start`/`data-end` arrow receipts are removed;
  tests read the drawn shaft. A held picture is not redrawn, and a test observes
  that no scene attribute is written during a hold.
- **Intro wording.** "The identity above" pointed at the SVD and tanh callout,
  which sits between the identity and the panel. The identity is stated in the
  note "Same subspace, not the same coordinates", two blocks earlier in the same
  section, "Make PCA learnable". The intro now says "the orthogonal-basis identity
  in this section's note" and names it. A test checks that section, note, identity
  and insertion point still appear in that order in the `.qmd`. The `.qmd` is
  unchanged.
- **This receipt.** The Chapter 11 digest recorded above went stale when `c06892f`
  changed `chapters/part3/11-encoder-decoder.qmd`. It is corrected in place to
  `566ca1553a4e53962f2b35c13295c6392983a2454d4211ed97ea6c8d8c8c5678`
  (`shasum -a 256`, at `c06892f`); the earlier value was `e2855b10…55be`. This is
  the one digest this pass edits, because it names another chapter's state. The
  "greedy tree remains deferred" passage is also outdated: `c06892f` added the
  per-token toy decoder to Chapter 11 (`tbl-greedy-tree`) and shipped
  `interactives/greedy-tree` with `docs/greedy-tree-excerpt.md`. The passage is
  marked superseded where it stands.

Found while looking at the frames, and fixed because the brief requires no
overlapping text at either width:

- At the 15–17 s hold, and for the whole 15–20 s still under reduced motion, the
  half turn puts the first axis through the point, so "reconstruction" covered
  the v′₁ label. On phones "same reconstruction" ran across the second component
  arrow and its foot. The axis tips sweep the ring just outside the point, so no
  spot beside the point is clear at every angle. The label now sits above the
  plane on a short green leader at both widths, drawn beneath the haloed axis
  labels. A test checks the label's estimated box against both axis labels at
  seven widths.
- The decode arrow's tail sat under the first letters of "basis changes cancel".
  It now starts left of the widest side label.
- Drawing coordinates were raw doubles in a byte-compared static print. They are
  now serialised at 0.0001 px (visual grammar, rule 9). The published state is
  not rounded; arithmetic tests keep their 1e-12 tolerance and pixel comparisons
  use 1e-4.

Not changed: the half-turn hold still lands with the point almost on the first
axis (the point sits at 30.2° and the hold at 30°), so z′₂ is nearly zero in that
still. Moving it would change the fixture or the timing, which this pass keeps.

**49/49 scene tests pass** (`node --test scripts/test_same_subspace_excerpt.cjs`),
and `scripts/audit_excerpt_fixtures.py` passes. The full interaction suite was
not run in this pass because sibling scenes were being edited in the same tree.
Frames were inspected at 1280 and 375 CSS pixels at 2, 7, 11, 12.5, 13.5, 14.9,
16, 18, 18.5, 22, 27, 32, 37 and 39.9 s, and again with reduced motion: no page
overflow, no picture text outside the figure, no console errors. The asset byte
total and player SHA-256 recorded under Acceptance describe the September 12
files and are superseded; a later pass records the new values.
- **Turn angle.** The layout fixture's final turn is now 100 degrees (it was 60). The schematic
  point sits at about 30 degrees, so the old half-turn hold (30 degrees) put it almost exactly
  on the first turned axis: the second new coordinate was nearly zero and its projection
  vanished during the beat that says the encoder "must report coordinates in that new basis."
  At 50 and 100 degrees both projections are clearly visible. The angle is drawing geometry,
  not a manuscript literal or a measured value; the earlier "60-degree final turn" sentence
  above records the first build. Both static frames regenerated; the suite passes unchanged.
- **Less prose around the picture.** The boundary now shows one sentence; every remaining scope note,
  unchanged, sits in a closed "Scope and caveats" disclosure beside the transcript. New asset sizes
  and digests for this pass are recorded once in [the review-pass receipt](excerpt-review-pass.md).
