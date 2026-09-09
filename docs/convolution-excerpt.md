# Chapter 7 convolution animation

Approved for publication after local review, September 9, 2026. Built on book commit
`366cd2d82b10876fa7be368b3a493b2403e281d2`; an HTML-only addition, not a new stable
edition or numerical refresh. Confirm deployment through the publishing run for
the commit containing these assets, not this approval record alone.

## Instructional contract

One local dot product becomes one output pixel. The optional disclosure at the end
of **To 2D: the recipe** replays the existing Exercise 1 fixture, and explicitly
warns that it is that exercise's walkthrough. Nothing in the reading path requires
opening it. The unchanged recipe, executable `manual_conv2d`, filter zoo, and pencil
exercise continue to carry the lesson in both editions.

This is a book-sized adaptation of the instructor's **PatchScore** scene, not a
recording or a copy of the full slide player. Four phases (place, multiply, sum,
slide) repeat at the four valid positions. The input is blue, the fixed kernel and
products are neutral, and the output is green. Signs and labels carry meaning
without color. The kernel never flips or learns; there is no bias, activation,
padding, or invented measurement. Unwritten output cells are distinct from zeros.

The panel and transcript begin closed. Opening the panel loads one local script
but never starts playback. One compact bar inside the animation pane contains a
Play/Pause icon, time scrubber, clock, speed selector, and fullscreen icon. Play
becomes Replay at the end. Separate Replay, Previous, Next, and Reset buttons are
removed. Icon buttons retain accessible names, tooltips, visible focus, and
44-pixel targets; the source's inline SVGs load no icon library. The step count and
keyboard help are screen-reader-only; the latter is also in the closed transcript.
At phone widths the total duration gives way to elapsed time, then the clock gives
way to the scrubber on the narrowest view. The scrubber always announces the full
time and stage. The 0.5x/1x/1.5x/2x speed selector shares one continuous clock. The default
is 1.5x (the selected option in `panel.html`, read by `player.js`). The
`player.js` timeline is 40 seconds at 1x: 16 phases of 2.5 seconds. These are
presentation durations, not measurements. Keyboard arrows, Home, and the scrubber
retain the discrete inspection and restart routes. Playback uses an absolute clock segment, not a sum of
frame intervals, so phase boundaries do not drift with frame rate. A speed change
or pause preserves fractional progress. Only the outlined window interpolates;
products and sums still change only at the exact phase boundaries.

On-diagram rays replace the position selector and its separate guide box. During
Multiply, the top-right pixel of the current patch and top-right fixed weight
feed an explicit multiplication point; its outgoing ray reaches the matching
product cell. This representative pair stays still for the whole phase, so even
fast playback leaves it inspectable. It is not presented as the only product.
During Sum, all nine product cells, including zeros, feed one addition point;
its green outgoing ray reaches the current output. The complete nine-term sum
remains in text. Placement and sliding clear all rays and component highlights.

The matrices use a consistent two-by-two layout with real gutters for the operation
nodes. One local, pointer-transparent SVG remeasures cell geometry only on phase or
layout changes, including fullscreen. A text mask keeps rays off the digits.
ResizeObserver has a window-resize fallback; there is no new animation loop,
dependency, or dropdown. Input rays are blue, the fixed-kernel and product rays
neutral, and the output ray green. Arrowheads, operation signs, matching outlines,
captions, and the transcript supply the same meaning without color. The SVG is
decorative for assistive technology, with the mapping also stated in the caption.

Fullscreen uses the browser's native API when available; otherwise Expand uses a
native modal dialog without duplicating the player. Exiting either view pauses
and retains position. Closing the panel, hiding the tab, leaving the page, or
Escape also pauses it. Space/K and arrow/Home/End shortcuts apply only when the
player itself is focused; native controls retain their own keys. Reduced-motion
readers receive discrete window positions, including during requested playback.
Script failure leaves a complete static calculation and transcript.
The matrices reflow rather than scaling a full lecture slide down to phone size.

## Source receipt

Read-only source tree: `Teaching/6050/Video_lectures`, Git commit
`c1780aae2469ec6fa1d5d7d1f16b895fcf2170a0`. The tree is dirty overall; the three
source files below matched that commit. The wrapper's local-runtime/font edits
and unrelated lecture changes were not imported.

| Source in that tree | SHA-256 |
|---|---|
| `6050-Ch7/lecture.jsx`, `SPatchScore`, lines 490–522 | `b6286f9964d5d2b01d4b6ecc376377e3642733440df1117a4988dc7704f2480f` |
| `6050-Ch7/ch7-data.js`, `manualExample.input` and `kernels.sobelVertical` | `1951641e04287da57f7b08bf19eec8b9d9aa7e6207429c82071c0269b0227531` |
| `6050-Ch7/STORYBOARD.md`, PatchScore | `20c9ea57814657b4ac0756cc1c3e86c3065b968d93477ccec6da357a88130492` |

The source scene occupies 90–144 seconds. The adaptation retains its clockwise
visits `(0,0), (0,1), (1,1), (1,0)` but replaces its initial answer leak with an
uncomputed state. Its short fixed holds are presentation timing, not a performance
measurement. No recorded voice track is included.

The numerical fixture is already in
`chapters/part2/07-filters-convolution.qmd`, Exercise 1: four rows `(0,0,1,1)` and
the vertical Sobel weights printed in the filter-zoo cell. Every valid sum is 4.
`scripts/test_convolution_excerpt.cjs` independently recomputes each sum and checks
the static fallback and every revealed state. The existing manuscript's framework
check remains the canonical Python implementation; no experiment is re-executed.

## Integration and PDF boundary

`filters/convolution-excerpt.lua` inserts the scoped HTML fragment and styles only
in Chapter 7, failing if its insertion point disappears. `panel.html` contains the
static witness, labels, and transcript. `loader.js` adds the click-to-load behavior;
`player.js` reads the static input/kernel and computes each shown result. There are
no new frontend libraries, fonts, network services, video binaries, or iframes.
The asset audit checks the deferred script's path even before a browser loads it.

The filter returns immediately for non-HTML formats. This addition does **not** embed
an animation in either PDF, alter figure numbers, or repaginate the released files.
It adds optional paced help for an existing calculation, not a new required claim.
Before a future version makes an animation essential or introduces a new example,
put its complete static witness in the shared manuscript and audit both PDF
conversions. Do not assume Quarto will capture browser frames automatically.

Review command: `quarto render --to html --no-clean` (committed freeze, no execution).
DOM regression command: `npm test --prefix scripts/html-tests`.
The local anchor is `chapters/part2/07-filters-convolution.html#convolution-excerpt`.
The author has approved this player. The `html_interactions` publishing job runs the
test-only suite and is a required dependency of `build-deploy`, alongside the existing
notebook validation. Preserve the existing PDF build/audit path; compare deployed
pagination and content against the before-publication artifacts. Do not restart the
paused numerical-runtime migration or scheduled monitor as part of this publication.
The next-animation roadmap lives in [the existing backlog](backlog.md#focused-animation-roadmap--approved-september-9-2026).

## Local verification (September 9, 2026)

- Complete frozen HTML render succeeded. `audit_html_assets.py`,
  `audit_public_anchors.py`, `audit_plan_code.py`, `audit_python_sources.py`, and
  `audit_book_contract.py` pass.
- The Node test report for `test_convolution_excerpt.cjs`,
  `test_plan_result_disclosure.cjs`, and `test_responsive_tables.cjs` passes all
  43 tests, including independent arithmetic, all reveal states, fractional timing,
  speed changes, sliding, reduced motion, keyboard isolation, and native/fullscreen
  fallback controls. Ray tests check the matched pair in every patch, all nine
  summands and each output destination, and layout remeasurement without starting
  a paused clock. The default remains 1.5x. Minimal-transport checks require exactly two icon buttons with
  synchronized accessible names and keep the keyboard routes covered.
- `audit_frozen_stdout.py --base HEAD` confirms all 133 output blocks unchanged
  against the baseline commit named above; HTML/TeX frozen pairs still agree.
- Browser review of the original pilot confirmed four cards across on desktop and two columns on phones,
  with no horizontal page overflow at measured CSS widths of 300, 390, and 984
  pixels. The ordinary chapter route has a closed panel and no player script;
  opening it loads one local script and remains paused. The direct anchor opens
  the panel, also paused. No browser console errors were observed.
- The movie-control revision was additionally inspected at 390- and 507-pixel CSS
  widths. Controls remain at least 44 pixels tall, wrap locally, and cause no
  horizontal page overflow. Browser playback, pause, keyboard scrubbing, completed
  output, and the fullscreen layout were checked. The player is silent, with
  on-screen explanations rather than an implied audio recording.
- The earlier selector revision was visually checked at measured CSS widths of 390
  and 984 pixels; its selector, matching outlines, and multiplication line fit
  without horizontal page overflow. The faster default remains paused on load.
- The replacement ray guide was visually inspected at measured CSS widths of 321,
  390, and 787 pixels. The two-by-two matrices, multiplication junction, nine-term
  fan-in, caption, and compact controls fit without page-level overflow. Resizing
  preserved the selected phase and aligned the SVG to the reflowed matrix cells;
  no browser errors or warnings were recorded. The prior selector is absent.
- A direct Pandoc LaTeX comparison of Chapter 7 with and without the new filter
  is byte-identical. The released PDFs were not rebuilt or changed; this is a
  format-scope check, not a new PDF certification.
