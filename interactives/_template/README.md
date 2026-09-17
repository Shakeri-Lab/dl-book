# Scene template

`panel.html`, `player.js`, `player.css` are the skeleton a new mechanism excerpt
copies. Nothing in this directory is rendered or published: no `interactives/manifest.json`
entry names `_template`, so `filters/mechanism-excerpts.lua` never reads it, `_quarto.yml`
never copies it, and no audit or test walks it. Copy the directory, do not edit in place.

```
cp -R interactives/_template interactives/<scene>
```

Then replace every `SCENE_ID` (the panel's `id`, e.g. `softmax-shift-excerpt`), every
`SCENE` (the directory, e.g. `softmax-shift`), every `SCENE_NAME` (the accessible name),
and every `…`. `docs/animation-authoring.md` is the binding contract for what goes in
them — its **Visual grammar** section is the part this skeleton encodes; it does not
authorize a new scene, the author's review note in the wave receipt does.

## The pane is one picture, one formula, one caption

The skeleton follows the visual grammar adopted on 2026-09-10, after the author rejected
a build of three scenes made of stage tabs, framed cards, readout chips and ASCII math.
What a scene's pane contains, top to bottom, and nothing else:

1. **One inline SVG** (`.SCENE-figure svg`, with `<g data-drawing>` inside). It is the
   whole picture: scenery that stays put, one object the eye tracks, and the numbers
   that must be shown written *on* the picture beside the mark they measure, in that
   mark's colour, as plain `<text data-value>`. The SVG in `panel.html` is the final
   frame — the static fallback a reader without script sees, carrying the witness
   values — and it is also the drawing the player animates: the player looks each
   `[data-mark]` up once and sets attributes on it. No stage strip. No cards. No side
   tables. No readout chips.
2. **One typeset formula line** (`<p data-formula><span id="eq-SCENE-1">\( … \)</span></p>`).
   The `eq-` id prefix is on MathJax's `lazyAlwaysTypeset` list (`mathjax-config.html`),
   so the span is typeset even inside the closed disclosure. Colour its parts with the
   book's macros — `\featurepart{}` blue, `\parameterpart{}` orange, `\predictionpart{}`
   green, `\targetpart{}` purple, `\residualpart{}` wine — and wrap what the player will
   highlight or strike in `\class{SCENE-…}{…}`. The TeX is never rewritten during
   playback: the player toggles classes on the `<p>` and `player.css` does the rest. A
   number that changes while the scene plays never goes inside the formula.
3. **One caption line** (`.mechanism-caption[data-caption]`), at most twenty words,
   saying what is happening now; the polite live region, written only on change.

Around the pane the disclosure keeps its question, its intro, the boundary, the load
status, the dialog and the transcript; they are prose, not the picture. The boundary shows
one sentence; every further qualifier sits in its closed "Scope and caveats" disclosure
(`details.mechanism-scope`), so the caveats never outweigh the picture on a phone.

## Where a new scene has to be registered

A copied directory is inert until all four of these exist. Nothing infers a scene from
the filesystem.

1. **`interactives/manifest.json`** — one object in `scenes`, with every key the audit
   knows and no others: `id`, `scene`, `qmd`, `anchor` (`{type, target}` where `type` is
   `after-cell` — a labelled executable cell, giving Quarto's `cell-<label>` div — or
   `before-heading`, the exact text of a level-2 heading), `filter`
   (`filters/mechanism-excerpts.lua` for anything using the shared transport), `transport`
   (`shared`), `duration`, `beats`, `fixture` (`{literals, computedVariants}`) and
   `receipt`. This entry is what makes the scene ship: the filter inserts every manifest
   scene whose `qmd` is the document being rendered, at its declared anchor, exactly once,
   and stops the build if the anchor is missing or duplicated. `duration` and `beats` must
   equal the pane's `data-duration` and `data-beats`; `literals` must appear verbatim in
   the chapter; a number the manuscript does not print belongs in `computedVariants`,
   described, or it does not belong in the scene.

2. **`_quarto.yml`** — add `interactives/<scene>/player.js` under `project.resources`.
   The scene script is the only file a reader's browser fetches; `panel.html`,
   `player.css` and the manifest are read from the project directory while the book
   builds and must stay unpublished. No new `filters:` entry is needed: the manifest-driven
   `filters/mechanism-excerpts.lua` already runs for every chapter.

3. **Its test file** — `scripts/test_<scene>.cjs`, added to the `test` script in
   `scripts/html-tests/package.json`, or a new block in `scripts/test_mechanism_excerpts.cjs`.
   From `scripts/html-tests/excerpt-harness.cjs` call three things:
   - `registerTransportTests('<scene id>', {witness, anchors, rects, stage})` — the
     transport suite (load-on-open, failure fallback, deterministic seek, pause/speed/
     replay, fullscreen, keyboard isolation, declared duration and beats, live-caption
     discipline, and the generic beat-boundary and reduced-motion checks, all read from
     `root.dataset.stage`). `witness` is the pattern the static panel must already print;
     `anchors` any nested disclosure ids; `rects` if the scene measures elements; `stage`
     if the scene publishes its stage under another `data-*` name.
   - `registerBeatHoldTest('<scene id>')` — the strict reduced-motion rule: exactly one
     drawn state per beat interval.
   - `registerGrammarTests('<scene id>')` — the visual grammar: one SVG, one `[data-formula]`,
     one `[data-caption]`, no strip and no tables in the pane; every formula span is TeX in
     an `eq-<scene>-` wrapper whose `\class{}` names `player.css` styles; playback never
     rewrites the TeX; exactly one guarded `MathJax.typesetPromise` call after mount (none
     when the page already typeset, `data-typeset="none"` when MathJax is absent or
     fails); every caption within the word budget and held for two seconds; the static
     fallback equal to the final frame's `[data-value]` numbers and caption. The fixture's
     `mathjax` option (`'stub'`, `'typeset'`, `'reject'`) is what makes the typeset check
     possible in JSDOM, which cannot run MathJax.
   Then write the scene's own arithmetic or Boolean invariants: those are the part no
   harness can supply. JSDOM never typesets, so test the TeX source string, the `eq-`
   ids, the `\class{}` names, and the CSS toggles the player applies — not rendered math.

4. **The wave receipt** — `docs/wave<N>-excerpts.md`, named by the manifest entry's
   `receipt`. It must record the chapter's current SHA-256 in a provenance row of exactly
   two columns — `` | `chapters/…qmd` | `<64 hex>` | `` — the lecture files consulted with
   their hashes and what was deliberately not imported, the question, fixture, timetable,
   reduced-motion behaviour, palette, teaching boundary, and every declared computed
   variant. `scripts/audit_excerpt_fixtures.py` fails when that digest goes stale, which
   is what forces the receipt to be re-read after any chapter edit.

   **Two columns, and the digest is the last one.** The audit's row pattern cannot cross a
   pipe, so a descriptive middle column breaks the binding: the chapter row fails loudly
   (`<id>: <receipt> records no SHA-256 for <qmd>`) and a lecture row silently stops being
   checked. Put prose in a separate table. `docs/animation-authoring.md` states the same
   rule, and `docs/wave1-excerpts.md` is the worked example.

Run `$HOME/.venvs/dl-book/bin/python scripts/audit_excerpt_fixtures.py` and
`npm test --prefix scripts/html-tests` after registering; both fail closed on a
half-registered scene.

## What the skeleton already encodes

- `<details class="mechanism-excerpt" data-player data-playback>`: closed, paused, and
  the scene script is fetched only when the disclosure opens.
- The fixture as `data-*` attributes on the root, read by the player and by the tests, so
  the number is typed once in this repository and audited against the chapter.
- `[data-pane]` carrying `data-duration` and `data-beats`; inside it the one SVG (the
  static fallback, drawn as the final frame), the one `[data-formula]` line, the one
  `[data-caption]` line, and `<!-- PLAYER_CONTROLS -->` (the filter substitutes
  `interactives/shared/controls.html` there, exactly once); then `<dialog>`,
  `[data-load-status]`, `.mechanism-boundary`, and `.mechanism-transcript`.
- `player.js` builds the picture once: it takes a reference to every `[data-mark]` it
  will move, creates any transient mark once with `make()`, and `render(time, reduced)`
  only sets attributes — `transform` for a translation or a group scale, `hidden` for a
  mark the beat has not reached, `textContent` for a live `[data-value]` number ("·"
  before it is revealed, never 0) — and toggles classes on the formula wrapper. It sets
  `root.dataset.stage`, writes the caption only when it changes, and returns the
  scrubber's description, which must not repeat the caption sentence (a live region).
  The beat names live in its `STAGES` list, in `data-beats` order, because there is no
  strip to read them from.
- Reduced motion holds each beat's state: derive continuous quantities from `beats[stage]`
  rather than from `time`, so the render at a beat and just after it is identical.
- `layout()` is the only place that measures; it picks the wide or stacked `viewBox` and
  re-renders. `render()` must never force a layout.
- `typeset()` runs once after mount: if `window.MathJax.typesetPromise` exists and the
  panel holds no `mjx-container` yet, it typesets the root once; either way it publishes
  `data-typeset="mathjax"` or `"none"`, and a rejection leaves the TeX source readable.
- `player.css` scopes everything by the scene prefix, declares the five macro colours as
  custom properties (with scoped overrides of the shared `.target-role` and `.error-role`
  so the caption word matches the formula), never hides the picture before the player
  mounts, and applies every formula wash or strike only under `[data-ready]`, so the
  static fallback is fully lit.
