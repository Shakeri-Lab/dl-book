#!/usr/bin/env node
// Test-only JSDOM. No dependency from this file enters the published book.
// The JSDOM fixture, the markup canonicaliser, and the transport, beat-hold and grammar
// suites this scene inherits live in scripts/html-tests/excerpt-harness.cjs. What stays
// here is the part no harness can supply: this scene's arithmetic -- the three hinges and
// their weighted sum, recomputed here and never through the player -- the claims the
// chapter's fixture makes (the sum peaks at the middle breakpoint, returns to zero, has four
// linear pieces), the one-parameter family the control draws (g_c = h1 + c h2 + h3, slopes
// 1, 1 + c, 2 + c, and the fact that only the chapter's c returns to zero and stays), the
// motion that carries it (the last two pieces swinging together as c falls, landing exactly
// at the Lock beat), the withheld prediction, the control's contract, its typeset formulas
// and the class toggles the player applies. JSDOM never typesets, so the formula assertions
// read the TeX source, the eq- ids, the \class{} names and the class toggles.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {read, manifest, entry, chapterSource, numbers, canonicalMarkup,
  fixture, registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'hinge-bump-excerpt';
const scene = entry(NAME);
// The harness lays nothing out, so the figure's width is declared: the wide layout, which
// is the one the static frame is drawn in. Several tests drive the narrow layout explicitly.
const WIDE = 780, NARROW = 360;
// The two plots' geometry, stated here from the picture's own design (player.js LAYOUT) so
// every drawn coordinate is checked against numbers this suite owns.
const PLOT = {left: 58, right: 812, top: 54, bottom: 290, ymin: -1.1, ymax: 3.6, viewBox: '0 0 860 342', width: 860, height: 342,
  termY: 20, slopeY: 43, tickY: 310, bracketY: 334};
const NARROW_PLOT = {left: 26, right: 330, top: 34, bottom: 174, ymin: -1.1, ymax: 3.6, viewBox: '0 0 360 212', width: 360, height: 212,
  termY: 12, slopeY: 27, tickY: 190, bracketY: 207};
// Type sizes by class, as player.css sets them in each layout; a test binds the table to the
// stylesheet, and the collision test estimates every label's box from it.
const TYPE = {
  wide: {'hb-term': 15, 'hb-slope': 17, 'hb-slope-label': 11, 'hb-tick': 13, 'is-break': 14, 'hb-peak': 18, 'hb-ghost-label': 16, control: 17},
  narrow: {'hb-term': 11, 'hb-slope': 12, 'hb-slope-label': 9, 'hb-tick': 10, 'is-break': 11, 'hb-peak': 13, 'hb-ghost-label': 12, control: 12}
};
const MINUS = '−';
// The picture's budget. Emphasised numbers are the ledger's and the peak: every drawn text
// carrying a digit that is not an axis tick (a subscripted name like h2 carries no digit
// character). Axis ticks are grey scenery and are counted in the total only.
const EMPHASISED_BUDGET = 8, NUMBER_BUDGET = 11;
const CAPTION_WORDS = 14, INTRO_WORDS = 50;

// Read the declared fixture from the closed panel. The panel is the one in-repo mirror of
// the manuscript's numbers; everything below is computed from it, so no chapter value is
// typed here a second time.
function declared(f) {
  assert(!f.root.dataset.ready, 'read the declared fixture before the player mounts');
  return {domain: numbers(f.root.dataset.domain), breaks: numbers(f.root.dataset.breaks), coefs: numbers(f.root.dataset.coefs)};
}

// This suite's own hinges and sums, deliberately not the player's: the independent
// evaluation every arithmetic assertion below is checked against. torch.relu(xs - b).
const relu = v => Math.max(0, v);
const hinges = (fx, x) => fx.breaks.map(b => relu(x - b));
const weighted = (fx, c, x) => hinges(fx, x).reduce((total, h, k) => total + c[k] * h, 0);
const bump = (fx, x) => weighted(fx, fx.coefs, x);
// The control's family: the chapter's sum with the middle coefficient replaced by c.
const family = (fx, c, x) => weighted(fx, [fx.coefs[0], c, fx.coefs[2]], x);
const grid = (fx, n = 800) => Array.from({length: n + 1}, (_, i) => fx.domain[0] + (fx.domain[1] - fx.domain[0]) * i / n);
const edgesOf = fx => [fx.domain[0], ...fx.breaks, fx.domain[1]];
// Every stop of the control: min to max in its declared step.
const stops = f => {
  const s = slider(f), out = [];
  for (let v = Number(s.min); v <= Number(s.max) + 1e-9; v += Number(s.step)) out.push(Number(v.toFixed(6)));
  return out;
};
// At rest a number is spelt as short as it can be (-2, -1.25, -0.5); while the timeline
// glides it keeps two decimals. Both with a true minus sign and an explicit plus.
const spell = (value, gliding = false) => {
  const text = gliding ? Math.abs(value).toFixed(2) : String(Number(Math.abs(value).toFixed(2)));
  return Number(text) === 0 ? text : value < 0 ? `${MINUS}${text}` : `+${text}`;
};
const bare = value => spell(value).replace(/^\+/, '');
const px = (fx, x, g = PLOT) => g.left + (x - fx.domain[0]) / (fx.domain[1] - fx.domain[0]) * (g.right - g.left);
const py = (y, g = PLOT) => g.bottom - (y - g.ymin) / (g.ymax - g.ymin) * (g.bottom - g.top);
const unpx = (fx, v, g = PLOT) => fx.domain[0] + (v - g.left) / (g.right - g.left) * (fx.domain[1] - fx.domain[0]);
const unpy = (v, g = PLOT) => (g.bottom - v) / (g.bottom - g.top) * (g.ymax - g.ymin) + g.ymin;
const points = d => d.trim().replace(/\s*Z$/, '').replace(/^M\s*/, '').split(/\s*L\s*/).filter(Boolean).map(pair => pair.split(',').map(Number));
const slider = f => f.$('[data-c-slider]');
const scrubber = f => f.$('[data-controls] input[type="range"]');
const picture = f => f.$('[data-figure] svg');
const drag = (f, c) => { slider(f).value = String(c); slider(f).dispatchEvent(new f.w.Event('input', {bubbles: true})); };
// The harness's key() sends bare keys; a modified or auto-repeated key needs its own event.
const press = (f, key, init = {}) => f.$('[data-pane]').dispatchEvent(
  new f.w.KeyboardEvent('keydown', {key, bubbles: true, cancelable: true, ...init}));
const coefficient = f => Number(f.root.dataset.c);
const locked = f => f.root.dataset.locked === 'true';
const slopes = f => JSON.parse(f.root.dataset.slopes);
const texts = (f, selector) => [...f.root.querySelectorAll(selector)].map(node => node.textContent);
const value = (f, name) => { const node = f.root.querySelector(`[data-drawing] [data-value="${name}"]`); return node ? node.textContent : null; };
// What the ledger writes, in the order it writes it: the three terms, and [piece, text] per slope.
const terms = f => [...f.root.querySelectorAll('[data-drawing] [data-term]')].map(node => node.textContent);
const written = f => [...f.root.querySelectorAll('[data-drawing] [data-slope]')].map(node => [node.dataset.piece, node.textContent]);
const tex = (f, n) => f.d.getElementById(`eq-hinge-bump-${n}`).textContent;
const drawing = f => f.$('[data-drawing]').innerHTML;
const classes = f => new Set([...f.root.classList]);
const caption = f => f.$('[data-caption]');
const words = text => text.trim().split(/\s+/).filter(Boolean).length;
const sumPath = f => f.root.querySelector('[data-drawing] [data-mark="sum"]');
const hingePath = (f, k) => f.root.querySelector(`[data-drawing] [data-hinge="${k}"]`);
const ghostLine = f => f.root.querySelector('[data-drawing] [data-silhouette-line]');
const ghostFill = f => f.root.querySelector('[data-drawing] [data-silhouette]');
const revealWidth = f => { const rect = f.root.querySelector('#hb-reveal-g rect'); return rect ? Number(rect.getAttribute('width')) : null; };
// Every number the picture writes at this instant: a drawn text element carrying a digit.
const drawnNumbers = f => [...f.root.querySelectorAll('[data-drawing] text')].filter(node => /\d/.test(node.textContent));
const emphasised = f => drawnNumbers(f).filter(node => !node.classList.contains('hb-tick')).map(node => node.textContent);
const times = (step = 0.05, from = 0, to = scene.duration) => {
  const out = [];
  for (let t = from; t <= to + 1e-9; t += step) out.push(Number(t.toFixed(4)));
  return out;
};
const css = read(`${scene.scene}/player.css`);
const [B0, B1, B2, B3, B4] = scene.beats;
// The answer the Predict beat asks for: the chapter's middle coefficient as a printed
// number. `− 2.5` inside ReLU(x − 2.5) and the tick 2.5 are not it.
const ANSWER = /−\s?2(?![.\d])/;

registerTransportTests(NAME, {
  // The picture writes the peak as a bare numeral; the sentence it stands for is carried by
  // the SVG title and the live aria-label, which is what a script-free reader is read.
  witness: /g\(0\.5\) = 2/,
  anchors: ['hinge-bump-playback-help'],
  width: WIDE
});
// One drawn state per whole beat under reduced motion, not just at the boundaries.
registerBeatHoldTest(NAME);
// One picture, one formula line, one caption; TeX never rewritten; one guarded typeset.
// The wave2b budget is fourteen words a caption, not the grammar's default twenty.
registerGrammarTests(NAME, {words: CAPTION_WORDS});

test('bump: the declared attributes reproduce the chapter literals they mirror', t => {
  const f = fixture(t, NAME);
  const {domain, breaks, coefs} = declared(f);
  const chapter = chapterSource(NAME);
  // Not a second copy of the fixture: the panel's attributes are rendered back into the
  // chapter's own source text, so a drift in either direction fails here as well as in
  // scripts/audit_excerpt_fixtures.py.
  assert(chapter.includes(`xs = torch.linspace(${domain[0]}, ${domain[1]}, 400)`), 'the declared domain does not spell the chapter\'s xs');
  const shift = b => (b < 0 ? `+ ${Math.abs(b)}` : `- ${b}`);
  breaks.forEach((b, k) => assert(chapter.includes(`h${k + 1} = torch.relu(xs ${shift(b)})`), `h${k + 1} = relu(xs ${shift(b)}) is not the chapter's hinge`));
  const term = (c, k) => (Math.abs(c) === 1 ? `h${k + 1}` : `${Math.abs(c)} * h${k + 1}`);
  const spelled = coefs.map((c, k) => `${k === 0 ? (c < 0 ? '-' : '') : c < 0 ? ' - ' : ' + '}${term(c, k)}`).join('');
  assert(chapter.includes(`bump = ${spelled}`), `bump = ${spelled} is not the chapter's combination`);
  assert.deepEqual(domain, [-3, 5]); assert.deepEqual(breaks, [-1.5, 0.5, 2.5]); assert.deepEqual(coefs, [1, -2, 1]);
  // The chapter prints neither the peak nor the slopes: they stay declared computed.
  assert(!chapter.includes('g(0.5)') && !/= 2\b/.test(chapter.slice(chapter.indexOf('hinge-bump-values'), chapter.indexOf('## '))), 'the peak value is a computed variant, so the chapter must not print it');
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal), `literal missing: ${literal.slice(0, 40)}`);
});

test('bump: recomputed at a dense grid, h1 - 2 h2 + h3 is zero outside [-1.5, 2.5], peaks at 2 for x = 0.5, and has piece slopes 0, +1, -1, 0', t => {
  const f = fixture(t, NAME);
  const fx = declared(f);
  const xs = grid(fx);
  // The chapter's identity, term by term, at every grid point.
  for (const x of xs) {
    const [h1, h2, h3] = hinges(fx, x);
    assert(Math.abs(bump(fx, x) - (h1 - 2 * h2 + h3)) < 1e-12, `bump != h1 - 2 h2 + h3 at ${x}`);
    if (x <= fx.breaks[0] || x >= fx.breaks[2]) assert(Math.abs(bump(fx, x)) < 1e-12, `nonzero outside the support at ${x}`);
    else assert(bump(fx, x) > 0, `not positive inside the support at ${x}`);
  }
  // The peak: 2, at the middle breakpoint and nowhere else.
  const peakX = fx.breaks[1];
  assert.equal(bump(fx, peakX), 2);
  const top = Math.max(...xs.map(x => bump(fx, x)));
  assert.equal(top, 2);
  for (const x of xs) if (Math.abs(bump(fx, x) - 2) < 1e-12) assert.equal(x, peakX, 'the peak is attained only at 0.5');
  // Piece slopes by finite differences inside each piece: 0, +1, -1, 0.
  const edges = edgesOf(fx);
  const expected = [0, 1, -1, 0];
  edges.slice(0, -1).forEach((a, k) => {
    const b = edges[k + 1], h = 1e-3;
    for (let x = a + 0.05; x < b - 0.05; x += 0.1) {
      const slope = (bump(fx, x + h) - bump(fx, x - h)) / (2 * h);
      assert(Math.abs(slope - expected[k]) < 1e-9, `slope ${slope} on piece ${k} at ${x}`);
    }
  });
  // The slopes are the running sums of the coefficients: the rule every written slope obeys.
  assert.deepEqual([0, fx.coefs[0], fx.coefs[0] + fx.coefs[1], fx.coefs[0] + fx.coefs[1] + fx.coefs[2]], expected);
  // And the player, at the end, publishes exactly these and writes the ledger they make.
  f.load(); f.open(); f.seek(scene.duration);
  assert.equal(coefficient(f), fx.coefs[1]);
  assert.deepEqual(slopes(f), expected);
  assert.deepEqual(terms(f), ['+1 h₁', `${MINUS}2 h₂`, '+1 h₃']);
  assert.deepEqual(written(f), [['1', '+1'], ['2', `${MINUS}1`], ['3', '0']], 'the ledger ends +1, −1, 0: the running sums of +1, −2, +1');
  assert.equal(value(f, 'peak'), '2');
  assert.equal(value(f, 'coef'), `${MINUS}2`);
  // The flat zero before any hinge is left to the picture; all four slopes are still stated
  // in full where a reader who wants the list can find them.
  assert.match(picture(f).getAttribute('aria-label'), /slopes 0, \+1, −1, 0\./);
  assert.match(f.$('.mechanism-transcript').textContent, /slopes 0, \+1, −1, 0/);
});

test('bump: the control\'s family g_c = h1 + c h2 + h3 has slopes 1, 1 + c, 2 + c, ends at 4.5 (2 + c), and only c = -2 returns to zero and stays', t => {
  const f = fixture(t, NAME);
  const fx = declared(f); f.load(); f.open();
  const s = slider(f);
  assert.deepEqual([s.min, s.max, s.step], ['-3', '1', '0.25'], 'one unit past the chapter\'s -2 below, a bare ramp above');
  const values = stops(f);
  assert.equal(values.length, 17); assert(values.includes(fx.coefs[1]) && values.includes(1) && values.includes(0));
  const edges = edgesOf(fx), xs = grid(fx);
  const returning = [];
  f.seek(B2 + 1);
  for (const c of values) {
    // This suite's arithmetic first, never the player's.
    const want = [0, 1, 1 + c, 2 + c];
    edges.slice(0, -1).forEach((a, k) => {
      const h = 1e-3, x = (a + edges[k + 1]) / 2;
      assert(Math.abs((family(fx, c, x + h) - family(fx, c, x - h)) / (2 * h) - want[k]) < 1e-9, `slope of g_c on piece ${k} at c = ${c}`);
    });
    assert(Math.abs(family(fx, c, fx.domain[1]) - 4.5 * (2 + c)) < 1e-12, `the right-edge value at c = ${c}`);
    assert(Math.abs(family(fx, c, fx.breaks[2]) - (4 + 2 * c)) < 1e-12, `the height at the last breakpoint at c = ${c}`);
    assert.equal(family(fx, c, fx.breaks[1]), 2, 'the apex does not depend on c');
    const outside = Math.max(...xs.filter(x => x <= fx.breaks[0] || x >= fx.breaks[2]).map(x => Math.abs(family(fx, c, x))));
    if (outside < 1e-12) returning.push(c);
    if (c === fx.coefs[1]) for (const x of xs) assert(Math.abs(family(fx, c, x) - bump(fx, x)) < 1e-12, 'at the chapter\'s c the family is the chapter\'s bump');
    // Then the dragged picture, mark by mark, against it.
    drag(f, c);
    assert.equal(coefficient(f), c); assert.equal(f.root.dataset.override, 'slider');
    slopes(f).forEach((got, k) => assert(Math.abs(got - want[k]) < 1e-12, `published slope ${k} at c = ${c}`));
    assert(Math.abs(Number(f.root.dataset.tail) - 4.5 * (2 + c)) < 1e-12);
    const pts = points(sumPath(f).getAttribute('d'));
    assert.deepEqual(pts.map(([x]) => Number(unpx(fx, x).toFixed(3))), edges, 'the sum is a polyline through the domain ends and the breakpoints');
    for (const [x, y] of pts) assert(Math.abs(y - py(family(fx, c, unpx(fx, x)))) < 1e-3, `the dragged sum is off g_c at c = ${c}`);
    const dashed = points(hingePath(f, 1).getAttribute('d'));
    assert.equal(dashed.length, 2);
    assert(Math.abs(unpx(fx, dashed[0][0]) - fx.breaks[1]) < 1e-3 && Math.abs(dashed[0][1] - py(0)) < 1e-3, 'the dashed ramp starts at its breakpoint, on zero');
    assert(Math.abs(dashed[1][1] - py(c * (fx.domain[1] - fx.breaks[1]))) < 1e-3, `the dashed ramp is not c h2 at c = ${c}`);
    assert.equal(revealWidth(f), PLOT.right - PLOT.left, 'a dragged sum is drawn whole');
    assert.deepEqual(terms(f), ['+1 h₁', `${spell(c)} h₂`, '+1 h₃']);
    assert.deepEqual(written(f), [['1', '+1'], ['2', spell(1 + c)], ['3', spell(2 + c)]]);
    assert.equal(f.$('[data-c-readout]').textContent, spell(c));
    // The lock marks stand if and only if the sum lies on the target.
    const on = c === fx.coefs[1];
    assert.equal(locked(f), on, `locked at c = ${c}`);
    assert.equal(Boolean(f.root.querySelector('[data-peak]')), on); assert.equal(Boolean(f.root.querySelector('[data-bracket]')), on);
    assert.equal(ghostFill(f).classList.contains('is-locked'), on); assert.equal(Boolean(ghostLine(f)), !on, 'the dashed edge shows wherever the sum misses it');
    assert.equal(classes(f).has('show-formula'), on); assert.equal(classes(f).has('ask-formula'), !on);
    const spoken = s.getAttribute('aria-valuetext');
    assert(spoken.startsWith(`c = ${spell(c)}. Slopes +1, ${spell(1 + c)}, ${spell(2 + c)}. `), spoken);
    assert.equal(spoken.includes(`At x = 5 the sum stands at ${bare(4.5 * (2 + c))}, not zero.`), !on, spoken);
    assert.equal(spoken.includes('The sum returns to zero at 2.5 and stays.'), on, spoken);
    assert.match(caption(f).textContent, on ? /^Locked: / : c > fx.coefs[1] ? /^Too little: .* climbs away\.$/ : /^Too much: .* dives for ever\.$/);
  }
  assert.deepEqual(returning, [fx.coefs[1]], 'exactly one stop of the control returns to zero and stays there');
  // The named failures of the brief: a plateau that runs off upward, and a dive below zero.
  assert.deepEqual([1 + -1, 2 + -1], [0, 1]); assert(family(fx, -3, fx.domain[1]) < 0 && family(fx, -3, 2) < 0);
});

test('bump: at every scrubbed time the drawn sum is g_c for the published coefficient, which is +1 until the Fold, falls through it, and is exactly -2 from the Lock beat on', t => {
  const f = fixture(t, NAME);
  const fx = declared(f); f.load(); f.open();
  const edges = edgesOf(fx), W = PLOT.right - PLOT.left;
  let checked = 0, previous = Infinity;
  const seen = new Set();
  for (const time of times(0.05)) {
    f.seek(time);
    const c = coefficient(f), stage = Number(f.root.dataset.stage);
    assert.equal(f.root.dataset.override, '', 'a seek is a timeline action');
    if (stage <= 2) assert.equal(c, 1, `the coefficient leaves a bare ramp before the Fold, at ${time}s`);
    if (stage >= 4) assert.equal(c, fx.coefs[1], `the coefficient is not the chapter's at ${time}s`);
    assert(c <= 1 && c >= fx.coefs[1], `the coefficient ${c} leaves [-2, +1] at ${time}s`);
    assert(c <= previous + 1e-12, `the sweep wavers at ${time}s`);
    previous = c; seen.add(c);
    // The dashed line is c h2 at every instant -- never a drawing device -- and the two fixed
    // ramps are the declared coefficients times their hinges, each from its own breakpoint.
    [fx.coefs[0], c, fx.coefs[2]].forEach((scale, k) => {
      const hpts = points(hingePath(f, k).getAttribute('d'));
      assert.equal(hpts.length, 2, `ramp ${k} is one straight piece`);
      assert(Math.abs(unpx(fx, hpts[0][0]) - fx.breaks[k]) < 1e-3 && Math.abs(unpx(fx, hpts[1][0]) - fx.domain[1]) < 1e-3, `ramp ${k} spans its breakpoint to the domain's end at ${time}s`);
      for (const [x, y] of hpts) assert(Math.abs(y - py(scale * relu(unpx(fx, x) - fx.breaks[k]))) < 1e-3, `ramp ${k} off at ${time}s`);
    });
    const path = sumPath(f);
    if (!path) { assert.equal(stage, 0, `no sum drawn at ${time}s`); continue; }
    const pts = points(path.getAttribute('d'));
    assert.deepEqual(pts.map(([x]) => Number(unpx(fx, x).toFixed(3))), edges);
    for (const [x, y] of pts) { assert(Math.abs(y - py(family(fx, c, unpx(fx, x)))) < 1e-3, `sum off g_c at ${time}s`); checked++; }
    const width = revealWidth(f);
    assert(width >= 0 && width <= W + 1e-9);
    if (stage >= 2) assert.equal(width, W, `the sum is not whole at ${time}s`);
  }
  assert(checked > 2500, `${checked} vertices checked`);
  assert(seen.size > 100, `the sweep moves continuously, not in steps: ${seen.size} values`);
  // A glide finishes at the beat it leads into: still moving just before the Lock beat, and
  // exactly the chapter's coefficient on it, where an arrow key parks.
  f.seek(B3); assert.equal(coefficient(f), 1);
  f.seek(B3 + 2); assert(coefficient(f) < 1, 'the sweep is under way two seconds into the Fold');
  f.seek(B4 - 0.05); assert(coefficient(f) > fx.coefs[1] && coefficient(f) < fx.coefs[1] + 0.01, `just before the Lock beat the sweep is still arriving: ${coefficient(f)}`);
  assert(!locked(f), 'nothing locks before the sweep has landed');
  f.seek(B4); assert.equal(coefficient(f), fx.coefs[1]); assert(locked(f));
  // The pen draws the sum on from the left inside the Add beat, at the bare-ramp coefficient.
  let growing = 0, last = -1;
  for (const time of times(0.05, B1, B2 - 0.05)) {
    f.seek(time);
    const width = revealWidth(f);
    assert(width >= last - 1e-9, 'the pen never retreats'); last = width;
    if (width > 0 && width < W) growing++;
  }
  assert(growing > 40, `${growing} frames of drawing on`);
  f.seek(B2); assert.equal(revealWidth(f), W);
});

test('bump: the motion is the mechanism -- through the Fold the last two pieces swing together, each drawn slope the ledger\'s, and the tail lands flat on zero exactly at the Lock beat', t => {
  const f = fixture(t, NAME);
  const fx = declared(f); f.load(); f.open();
  // Slopes and heights measured off the drawn green polyline, in data units.
  const measured = () => {
    const pts = points(sumPath(f).getAttribute('d')).map(([x, y]) => [unpx(fx, x), unpy(y)]);
    return {pts, slope: pts.slice(1).map(([x, y], i) => (y - pts[i][1]) / (x - pts[i][0]))};
  };
  const track = [];
  for (const time of times(0.05, B3, B4)) {
    f.seek(time);
    const c = coefficient(f), {pts, slope} = measured();
    // Pieces 0 and 1 never move; pieces 2 and 3 turn by the same amount, because the one
    // number c enters both running sums. That coupling is what forces the answer.
    assert(Math.abs(slope[0]) < 1e-4 && Math.abs(slope[1] - 1) < 1e-4, `the first two pieces move at ${time}s`);
    assert(Math.abs(slope[2] - (1 + c)) < 1e-4 && Math.abs(slope[3] - (2 + c)) < 1e-4, `drawn slopes ${slope} at c = ${c}`);
    assert(Math.abs(slope[3] - slope[2] - fx.coefs[2]) < 2e-4, 'the tail is always exactly one steeper than the middle piece');
    // The apex is the middle piece's pivot: it stays put while the piece turns about it.
    assert(Math.abs(pts[2][0] - fx.breaks[1]) < 1e-3 && Math.abs(pts[2][1] - 2) < 1e-4, `the apex moves at ${time}s`);
    // The tail is a lever about (0.5, 0): extended back, it always passes through that point.
    assert(Math.abs(pts[4][1] - slope[3] * (pts[4][0] - fx.breaks[1])) < 2e-3, `the tail's line misses (0.5, 0) at ${time}s`);
    // What the ledger writes is what the eye sees: each entry is the drawn slope.
    const gliding = c < 1 && c > fx.coefs[1];
    assert.deepEqual(written(f), [['1', '+1'], ['2', spell(slope[2], gliding)], ['3', spell(slope[3], gliding)]], `the ledger at ${time}s`);
    assert.equal(value(f, 'coef'), spell(c, gliding));
    track.push({time, c, end: pts[4][1], join: pts[3][1], tail: slope[3]});
  }
  // The right end of the tail comes down from far above the plot to zero, monotonically, and
  // is strictly moving through the middle of the beat.
  assert(track[0].end > 10 && Math.abs(track[0].tail - 3) < 1e-4, 'the Fold starts from the plain sum: +1, +2, +3');
  track.forEach((s, i) => { if (i) assert(s.end <= track[i - 1].end + 1e-9 && s.join <= track[i - 1].join + 1e-9, `the lever rises again at ${s.time}s`); });
  const middle = track.filter(s => s.time >= B3 + 2 && s.time <= B4 - 1);
  middle.forEach((s, i) => { if (i) assert(s.end < middle[i - 1].end - 1e-6, `the lever stalls at ${s.time}s`); });
  // Near misses are visible misses: a quarter short of the answer the tail still ends more
  // than one unit above zero -- on this plot, more than fifty pixels.
  assert(Math.abs(family(fx, fx.coefs[1] + 0.25, fx.domain[1]) - 1.125) < 1e-12);
  assert(py(0) - py(1.125) > 50);
  // It lands: flat, on zero, at the last breakpoint and at the right edge, exactly at the beat.
  const landed = track.at(-1);
  assert.equal(landed.time, B4); assert.equal(landed.c, fx.coefs[1]);
  assert(Math.abs(landed.end) < 1e-4 && Math.abs(landed.join) < 1e-4 && Math.abs(landed.tail) < 1e-4, 'the tail lies flat on zero at the Lock beat');
  // The landing is eased, so the last frames are within a pixel of flat; half a second out
  // the tail's right end is still measurably above zero on the drawn path.
  const early = track.find(s => Math.abs(s.time - (B4 - 0.5)) < 1e-9);
  assert(early.end > 1e-3 && early.c > fx.coefs[1], 'and not before');
});

test('bump: the target is the declared bump, standing the whole time; its dashed edge shows wherever the sum misses it and its fill deepens only while the sum lies on it', t => {
  const f = fixture(t, NAME);
  const fx = declared(f); f.load(); f.open();
  const edges = edgesOf(fx);
  let open = 0, shut = 0;
  for (const time of times(0.05)) {
    f.seek(time);
    const fill = ghostFill(f);
    assert(fill, `the target is not drawn at ${time}s`);
    // It is the declared bump over the support alone, closed along the zero line.
    const pts = points(fill.getAttribute('d'));
    assert.match(fill.getAttribute('d'), / Z$/, 'the fill closes, so it is a silhouette and not a curve');
    assert.deepEqual(pts.map(([x]) => Number(unpx(fx, x).toFixed(3))), fx.breaks);
    for (const [x, y] of pts) assert(Math.abs(y - py(bump(fx, unpx(fx, x)))) < 1e-3, `the target is not the declared bump at ${time}s`);
    assert(Math.abs(pts[0][1] - py(0)) < 1e-3 && Math.abs(pts[2][1] - py(0)) < 1e-3, 'the target closes on zero');
    // The gap between what the sum is now and the bump it is aiming at, at every vertex.
    const c = coefficient(f), whole = revealWidth(f) === PLOT.right - PLOT.left;
    const gap = Math.max(...edges.map(x => Math.abs(family(fx, c, x) - bump(fx, x))));
    const on = whole && gap < 1e-12;
    assert.equal(locked(f), on, `locked at ${time}s with the sum ${gap} away`);
    assert.equal(fill.classList.contains('is-locked'), on);
    const line = ghostLine(f);
    assert.equal(Boolean(line), !on, `the dashed edge at ${time}s`);
    if (line) { open++; assert.deepEqual(points(line.getAttribute('d')), pts, 'the edge is the fill\'s own outline over the support'); } else shut++;
  }
  assert(open > 550 && shut > 100, `${open} frames aiming, ${shut} landed`);
  f.seek(B4 - 0.05); assert(!locked(f)); f.seek(B4); assert(locked(f));
  // Its word retires as the sum starts, and the peak value takes the slot it left.
  f.seek(B0); assert.equal(f.root.querySelector('[data-target-label]').textContent, 'bump');
  f.seek(B1 + 2); assert(!f.root.querySelector('[data-target-label]'), 'the word outstays the first beat');
  const label = (g, sel) => { const n = g.root.querySelector(sel); return n ? [Number(n.getAttribute('x')), Number(n.getAttribute('y'))] : null; };
  f.seek(B0); const wordAt = label(f, '[data-target-label]');
  f.seek(scene.duration); assert.deepEqual(label(f, '[data-peak]'), wordAt, 'the peak takes the word\'s place');
  // Same green as the sum, fill-dominant, and the sum is the heavier line; the lock is the fill.
  assert.match(css, /\.hb-ghost-fill \{ fill: var\(--hb-prediction\); fill-opacity: \.13/);
  assert.match(css, /\.hb-ghost-fill\.is-locked \{ fill-opacity: \.26; \}/);
  assert.match(css, /\.hb-ghost-line \{[^}]*stroke: var\(--hb-prediction\); stroke-width: 1\.8/);
  assert.match(css, /\.hb-sum \{[^}]*stroke-width: 4;/);
});

test('bump: the ledger is written as the pen crosses each breakpoint -- a term on its rule, the running slope over the piece that follows', t => {
  const f = fixture(t, NAME);
  const fx = declared(f); f.load(); f.open();
  const edges = edgesOf(fx), names = ['h₁', 'h₂', 'h₃'];
  const shapes = new Set();
  for (const time of times(0.05, 0, B2)) {
    f.seek(time);
    const width = revealWidth(f);
    // Observable, not timed: a hinge is in the ledger exactly when the drawn-on part of the
    // sum has reached its breakpoint.
    const crossed = fx.breaks.map(b => width !== null && PLOT.left + width >= px(fx, b) - 1e-6);
    assert.deepEqual(terms(f), names.map((name, k) => (crossed[k] ? `+1 ${name}` : name)), `the terms at ${time}s`);
    assert.deepEqual(written(f), [1, 2, 3].filter(p => crossed[p - 1]).map(p => [String(p), spell(p)]), `the slopes at ${time}s`);
    assert.equal(Boolean(f.root.querySelector('[data-slope-label]')), crossed[0], 'the grey word arrives with the first slope');
    shapes.add(crossed.filter(Boolean).length);
  }
  assert.deepEqual([...shapes].sort(), [0, 1, 2, 3], 'the entries arrive one at a time');
  // Each entry stands where it belongs: a term on top of its breakpoint's rule, a slope
  // centred over its piece, both rows above the plot and clear of each other.
  f.seek(B2);
  [...f.root.querySelectorAll('[data-term]')].forEach((node, k) => {
    assert(Math.abs(Number(node.getAttribute('x')) - px(fx, fx.breaks[k])) < 1e-3 && Number(node.getAttribute('y')) === PLOT.termY, `term ${k} is not on its rule`);
    assert.equal(node.getAttribute('text-anchor'), 'middle');
  });
  [...f.root.querySelectorAll('[data-slope]')].forEach(node => {
    const piece = Number(node.dataset.piece);
    assert(Math.abs(Number(node.getAttribute('x')) - px(fx, (edges[piece] + edges[piece + 1]) / 2)) < 1e-3 && Number(node.getAttribute('y')) === PLOT.slopeY, `slope ${piece} is not over its piece`);
  });
  assert(PLOT.termY < PLOT.slopeY && PLOT.slopeY < PLOT.top);
  // The rules run up out of the plot to the terms they carry.
  const rules = [...f.root.querySelectorAll('[data-drawing] .hb-break')];
  assert.equal(rules.length, 3);
  rules.forEach((rule, k) => {
    assert(Math.abs(Number(rule.getAttribute('x1')) - px(fx, fx.breaks[k])) < 1e-3);
    assert(Number(rule.getAttribute('y1')) > PLOT.termY && Number(rule.getAttribute('y1')) < PLOT.slopeY && Number(rule.getAttribute('y2')) === PLOT.bottom);
  });
  // Only the middle coefficient is the control's: heavier ink, and the one [data-value="coef"].
  assert.equal(f.root.querySelectorAll('[data-drawing] .hb-coef').length, 3);
  assert.equal(f.root.querySelectorAll('[data-drawing] .hb-coef.is-control').length, 1);
  assert.equal(f.root.querySelector('[data-drawing] .hb-coef.is-control').dataset.value, 'coef');
});

test('bump: the prediction is never spoiled -- until the sweep has landed, -2 is absent from the picture, its labels, both value texts, the caption and the formula line', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const asks = /Which coefficient .* to stay\?$/;
  let asked = 0;
  // Fine steps through the beats before the Fold, where a caption asks (or is about to ask).
  for (const time of [...times(0.01, 0, B3), ...times(0.01, B3, B3 + 0.5)]) {
    f.seek(time);
    const where = {
      drawing: f.$('[data-drawing]').textContent, label: picture(f).getAttribute('aria-label'), title: picture(f).querySelector('title').textContent,
      scrubber: scrubber(f).getAttribute('aria-valuetext'), control: slider(f).getAttribute('aria-valuetext'), readout: f.$('[data-c-readout]').textContent,
      caption: caption(f).textContent
    };
    for (const [name, text] of Object.entries(where)) assert.doesNotMatch(text, ANSWER, `the ${name} gives the answer away at ${time}s: ${text}`);
    assert(!classes(f).has('show-formula') && !classes(f).has('wash-coef'), `the chapter's identity is shown at ${time}s`);
    assert.equal(slider(f).value, '1', 'the thumb waits at the bare ramp');
    if (asks.test(where.caption)) asked++;
  }
  assert(asked > 700, 'the Predict beat asks for the whole beat');
  // Through the Fold the caption no longer asks; the identity and the full title still wait
  // for the landing, so the first place the chapter's coefficient is named is the Lock beat.
  for (const time of times(0.01, B3, B4 - 0.01)) {
    f.seek(time);
    assert.doesNotMatch(caption(f).textContent, asks);
    assert.doesNotMatch(caption(f).textContent + picture(f).getAttribute('aria-label') + picture(f).querySelector('title').textContent + scrubber(f).getAttribute('aria-valuetext'), ANSWER, `named before it lands, at ${time}s`);
    assert(!classes(f).has('show-formula'), `the identity is shown before the landing, at ${time}s`);
  }
  f.seek(B4);
  assert.match(caption(f).textContent, /^Only −2 lands/); assert(classes(f).has('show-formula') && classes(f).has('wash-coef'));
  assert.match(picture(f).querySelector('title').textContent, ANSWER); assert.match(picture(f).getAttribute('aria-label'), ANSWER);
  // The hidden identity is hidden by a rule, not by luck; and the always-visible prose around
  // the pane -- question, intro, the boundary's one lead sentence, the slider's ends -- never
  // names the coefficient either. Closed disclosures may.
  assert.match(css, /\.mechanism-excerpt\[data-ready\]:not\(\.show-formula\) \.hb-told \{ visibility: hidden; \}/);
  for (const selector of ['.mechanism-question', '.mechanism-intro', '.mechanism-boundary > p', '.hb-slider-ends', 'summary']) {
    for (const node of f.root.querySelectorAll(selector)) assert.doesNotMatch(node.textContent, ANSWER, `${selector} gives the answer away: ${node.textContent}`);
  }
  assert.equal(f.root.querySelectorAll('.mechanism-boundary > p').length, 1, 'the boundary shows one lead sentence');
  assert.equal(f.$('.mechanism-scope').open, false);
  // Reduced motion: the Predict still is as silent as the moving one.
  const r = fixture(t, NAME, {reduced: true}); r.load(); r.open(); r.seek(B2 + 3);
  assert.doesNotMatch(r.$('[data-drawing]').textContent + picture(r).getAttribute('aria-label') + slider(r).getAttribute('aria-valuetext'), ANSWER);
});

test('bump: the first frame states the question, and every payoff mark waits for the landing', t => {
  const f = fixture(t, NAME);
  const fx = declared(f); f.load(); f.open();
  // At t = 0 the picture already states the question -- three climbing ramps, the finished
  // bump beside them -- and nothing is an empty stage.
  f.seek(0);
  assert.equal(f.root.querySelectorAll('[data-hinge]').length, 3, 'the three ramps stand at t = 0');
  assert.deepEqual(terms(f), ['h₁', 'h₂', 'h₃'], 'and are named, without coefficients, at t = 0');
  assert(ghostFill(f) && f.root.querySelector('[data-target-label]'), 'the target stands at t = 0');
  assert(!sumPath(f) && !f.root.querySelector('[data-slope], [data-slope-label], [data-peak], [data-bracket]'), 'nothing else is written at t = 0');
  assert.deepEqual(drawnNumbers(f).map(node => node.textContent), ['0', `${MINUS}1.5`, '0.5', '2.5'], 'the first frame writes zero and the three breakpoints, and no other number');
  // The three plain ramps are the three terms at the control's starting value: slope one each.
  [0, 1, 2].forEach(k => { const [[x0, y0], [x1, y1]] = points(hingePath(f, k).getAttribute('d')); assert(Math.abs((unpy(y1) - unpy(y0)) / (unpx(fx, x1) - unpx(fx, x0)) - 1) < 1e-4); });
  for (const time of times(0.05)) {
    f.seek(time);
    const stage = Number(f.root.dataset.stage);
    assert.equal(Boolean(sumPath(f)), stage >= 1, `the sum at ${time}s`);
    if (stage < 4) assert(!f.root.querySelector('[data-peak], [data-bracket]'), `a payoff mark before the landing, at ${time}s`);
    assert.equal(f.root.querySelectorAll('[data-hinge]').length, 3, `the ramps at ${time}s`);
    // Geometry is serialised at four decimals at most, everywhere.
    if (Math.round(time * 20) % 40 === 0) {
      for (const node of f.root.querySelectorAll('[data-drawing] *')) for (const key of ['x', 'y', 'x1', 'x2', 'y1', 'y2', 'width', 'height', 'opacity']) {
        if (node.hasAttribute(key)) assert.match(node.getAttribute(key), /^-?\d+(?:\.\d{1,4})?$/, `${node.tagName} ${key}="${node.getAttribute(key)}" at ${time}s`);
      }
      for (const node of f.root.querySelectorAll('[data-drawing] path')) for (const token of node.getAttribute('d').match(/-?\d+\.\d+/g) || []) assert(token.split('.')[1].length <= 4, `${token} in a path at ${time}s`);
    }
  }
  // By two seconds into the Lock beat the peak and the bracket are whole; the ramps then step
  // back to a ghost, easing, and the bump is left alone.
  f.seek(B4); assert(!f.root.querySelector('[data-peak], [data-bracket]'), 'the beat opens on the landed sum alone');
  f.seek(B4 + 2);
  assert.equal(f.root.querySelector('[data-peak]').getAttribute('opacity'), '1'); assert.equal(f.root.querySelector('[data-ramps]').getAttribute('opacity'), '1');
  const bracket = f.root.querySelector('[data-bracket]').getAttribute('d');
  assert.equal(bracket, `M${px(fx, fx.breaks[0])} ${PLOT.bracketY - 5}V${PLOT.bracketY}H${px(fx, fx.breaks[2])}V${PLOT.bracketY - 5}`, `the bracket spans the support: ${bracket}`);
  const ghosting = times(0.05, B4 + 2, scene.duration).map(time => { f.seek(time); return Number(f.root.querySelector('[data-ramps]').getAttribute('opacity')); });
  assert(ghosting.some(v => v < 1 && v > 0.5), 'the ghost eases in'); assert(ghosting.every((v, i) => !i || v <= ghosting[i - 1]));
  assert.equal(ghosting.at(-1), 0.5);
  // The bracket is drawn in its own row, below the tick numerals rather than through them.
  const ticks = [...f.root.querySelectorAll('[data-drawing] text')].filter(node => Number(node.getAttribute('y')) === PLOT.tickY);
  assert.equal(ticks.length, 3, 'the three breakpoints are the only x ticks');
  assert(PLOT.bracketY - 5 > PLOT.tickY, 'the bracket row is below the tick row');
});

test('bump: no frame, timed or dragged, emphasises more than eight numbers or writes more than eleven', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const perBeat = new Map();
  const tally = label => {
    const bold = emphasised(f), all = drawnNumbers(f);
    assert(bold.length <= EMPHASISED_BUDGET, `${bold.length} emphasised numbers ${label}: ${bold.join(' ')}`);
    assert(all.length <= NUMBER_BUDGET, `${all.length} numbers on the picture ${label}`);
    return bold.length;
  };
  for (const time of times(0.05)) {
    f.seek(time);
    const stage = Number(f.root.dataset.stage);
    perBeat.set(stage, Math.max(perBeat.get(stage) || 0, tally(`at ${time}s`)));
  }
  // Written per beat, so a regression that banks a row of numbers again shows up as a number:
  // nothing, then three coefficients and three slopes, then the peak.
  assert.deepEqual([...perBeat.entries()].sort((a, b) => a[0] - b[0]), [[0, 0], [1, 6], [2, 6], [3, 6], [4, 7]]);
  for (const c of stops(f)) { drag(f, c); assert(tally(`dragged to ${c}`) <= 7); }
  // Axis ticks are scenery, and look it: grey, regular weight.
  assert.match(css, /\.hb-tick \{ font-size: 13px; fill: var\(--hb-scenery\); \}/);
  assert.doesNotMatch(css, /\.hb-tick[^{]*\{[^}]*font-weight/);
});

test('bump: the intro is within fifty words and every caption, timed or dragged, within fourteen', t => {
  const f = fixture(t, NAME);
  const intro = words(f.$('.mechanism-intro').textContent);
  assert(intro > 0 && intro <= INTRO_WORDS, `the intro is ${intro} words`);
  assert(words(f.$('.mechanism-boundary > p').textContent) <= 30, 'the boundary\'s visible sentence is about thirty words at most');
  // The prose that may stay long is prose in the closed disclosure, not the picture's own text.
  assert(words(f.$('.mechanism-scope').textContent) > INTRO_WORDS, 'the honest qualifiers live in the scope disclosure');
  f.load(); f.open();
  const seen = new Set();
  for (const time of times(0.05)) {
    f.seek(time);
    const text = caption(f).textContent.trim();
    assert(words(text) <= CAPTION_WORDS, `caption at ${time}s has ${words(text)} words: "${text}"`);
    seen.add(text);
  }
  assert.equal(seen.size, scene.beats.length, 'one caption per beat, and no other');
  const held = new Set();
  for (const c of stops(f)) { drag(f, c); const text = caption(f).textContent.trim(); assert(words(text) <= CAPTION_WORDS, text); held.add(text); assert(!seen.has(text)); }
  assert.equal(held.size, 3, 'too little, locked, too much');
});

test('bump: reduced motion holds one coherent still per beat, and each still makes its caption true', t => {
  const f = fixture(t, NAME, {reduced: true});
  const fx = declared(f); f.load(); f.open();
  const byStage = new Map();
  for (let i = 0; i <= 20 * scene.duration; i++) {
    f.seek(i / 20);
    const stage = Number(f.root.dataset.stage);
    if (!byStage.has(stage)) byStage.set(stage, new Set());
    byStage.get(stage).add(`${f.root.dataset.c}|${f.root.dataset.pen}|${f.root.dataset.locked}`);
    assert.equal(f.root.dataset.moving, 'false', `reduced motion is moving at ${i / 20}s`);
  }
  for (const [stage, set] of byStage) assert.equal(set.size, 1, `reduced motion moves inside beat ${stage}: ${[...set].join(' | ')}`);
  const states = [...byStage.keys()].sort((a, b) => a - b).map(stage => [...byStage.get(stage)][0]);
  // Holds are themselves; Add is its finished drawing; Fold, whose caption describes the
  // swing, is the finished swing -- the coefficient stands at +1 or at -2, never between.
  assert.deepEqual(states, ['1|0|false', '1|1|false', '1|1|false', `${fx.coefs[1]}|1|true`, `${fx.coefs[1]}|1|true`]);
  f.seek(B0); assert.match(caption(f).textContent, /^Three ramps that only climb/); assert(!sumPath(f)); assert.deepEqual(terms(f), ['h₁', 'h₂', 'h₃']);
  f.seek(B1); assert.match(caption(f).textContent, /only up\.$/); assert.deepEqual(written(f), [['1', '+1'], ['2', '+2'], ['3', '+3']]);
  f.seek(B2); assert.match(caption(f).textContent, /^Which coefficient/); assert.deepEqual(written(f), [['1', '+1'], ['2', '+2'], ['3', '+3']]);
  f.seek(B3); assert.match(caption(f).textContent, /tail swings\.$/); assert.deepEqual(written(f), [['1', '+1'], ['2', `${MINUS}1`], ['3', '0']]);
  assert(!f.root.querySelector('[data-peak], [data-bracket]'), 'the payoff marks still wait for their own beat');
  f.seek(B4); assert.match(caption(f).textContent, /^Only −2 lands/);
  assert.equal(f.root.querySelector('[data-peak]').getAttribute('opacity'), '1'); assert(f.root.querySelector('[data-bracket]'));
  assert.equal(f.root.querySelector('[data-ramps]').getAttribute('opacity'), '0.5'); assert(!classes(f).has('wash-coef'));
  // The control still works on a still, and a timeline action still ends the detour.
  drag(f, -1); assert.equal(coefficient(f), -1); assert.deepEqual(written(f), [['1', '+1'], ['2', '0'], ['3', '+1']]);
  f.key('Home'); assert.equal(coefficient(f), 1); assert.equal(f.root.dataset.override, '');
  // Unreduced, the Fold is continuous -- so this is a reduced-motion behaviour, not the scene
  // quietly losing its animation.
  const sliding = fixture(t, NAME); sliding.load(); sliding.open();
  const between = new Set();
  for (const time of times(0.05, B3, B4)) { sliding.seek(time); between.add(coefficient(sliding)); }
  assert(between.size > 100 && [...between].some(c => c > -1.5 && c < 0.5), 'the unreduced sweep must pass between +1 and -2');
});

test('bump: each declared beat advances the stage and toggles exactly its classes', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const has = name => classes(f).has(name);
  const stages = [];
  for (const beat of scene.beats) {
    f.seek(beat);
    stages.push(Number(f.root.dataset.stage));
    assert.deepEqual([...classes(f)].filter(name => /^stage-\d$/.test(name)), [`stage-${stages.at(-1)}`]);
  }
  assert.deepEqual(stages, scene.beats.map((_, index) => index));
  const table = {
    'ask-formula': [false, true, true, true, false],
    'show-formula': [false, false, false, false, true],
    'wash-coef': [false, false, false, false, true]
  };
  scene.beats.forEach((beat, index) => {
    f.seek(beat);
    for (const [name, row] of Object.entries(table)) assert.equal(has(name), row[index], `${name} at ${beat}s`);
  });
  f.seek(B4 - 0.05); assert(has('ask-formula') && !has('show-formula'));
  // The wash greets the coefficient and then lets go: the final frame is unwashed.
  f.seek(scene.duration); assert(has('show-formula') && !has('wash-coef') && !has('ask-formula'));
  // Every class the player sets has a rule, so toggling it changes something.
  const rule = pattern => assert.match(css, pattern, `player.css lacks ${pattern}`);
  rule(/\.mechanism-excerpt\[data-ready\]:not\(\.show-formula\) \.hb-told \{ visibility: hidden/);
  rule(/\.mechanism-excerpt:not\(\.ask-formula\) \.hb-ask \{ visibility: hidden/);
  rule(/\.mechanism-excerpt\.wash-coef \.hb-coef, \.hb-csym \{ background: rgba\(35, 45, 75, \.14\)/);
  rule(/\.hb-hinge-1 \{ stroke-dasharray: 10 6/); rule(/\.hb-hinge-2 \{ stroke-dasharray: 4 6/);
  // Colour = meaning: green is the book's \predictionpart, blue its \featurepart, the hinges,
  // their coefficients and the control that turns one of them are ink. Nothing here is
  // learned, so no orange -- nor purple, nor wine -- appears in this scene's stylesheet.
  rule(/--hb-prediction: #2f855a/); rule(/--hb-input: #2b6cb0/); rule(/--hb-ink: #232d4b/);
  rule(/#hinge-bump-excerpt \.prediction-role \{ color: var\(--hb-prediction\)/);
  rule(/#hinge-bump-excerpt \.hinge-role \{ color: var\(--hb-ink\)/);
  for (const foreign of ['#c05621', '#C05621', '#B45309', '#805ad5', '#7950b8', '#722f37', '#722F37', '#9b2c4c']) assert(!css.includes(foreign), `${foreign} in player.css`);
  rule(/\.hb-sum \{[^}]*stroke: var\(--hb-prediction\)/); rule(/\.hb-hinge \{[^}]*stroke: var\(--hb-ink\)/);
  rule(/\.hb-term \{[^}]*fill: var\(--hb-ink\)/); rule(/\.hb-slope \{[^}]*fill: var\(--hb-prediction\)/);
  rule(/\.hb-slider-track input \{[^}]*accent-color: var\(--hb-ink\)/); rule(/\.hb-c \{[^}]*color: var\(--hb-ink\)/);
  rule(/\.hb-peak \{[^}]*fill: var\(--hb-prediction\)/); rule(/\.hb-bracket \{[^}]*stroke: var\(--hb-prediction\)/);
});

test('bump: the three formulas are TeX in eq- wrappers with the book\'s macros, and neither playback nor the control ever rewrites them', t => {
  const f = fixture(t, NAME);
  const ids = [1, 2, 3].map(n => `eq-hinge-bump-${n}`);
  for (const id of ids) {
    const span = f.d.getElementById(id);
    assert(span, `${id} missing`);
    assert.match(span.textContent.trim(), /^\\\([\s\S]+\\\)$/, `${id} is not \\( … \\)`);
  }
  const line = tex(f, 1);
  assert(line.includes('\\predictionpart{g}(\\featurepart{x})'), 'the sum is \\predictionpart and its argument \\featurepart');
  assert(line.includes('h_1 \\: \\class{hb-coef}{-2} h_2 + h_3'), 'the coefficient -2 is the toggled part of the chapter\'s identity');
  assert(tex(f, 2).includes('\\featurepart{x}'));
  assert(tex(f, 3).includes('\\predictionpart{g}(\\featurepart{x}) = h_1 + \\class{hb-csym}{c}\\, h_2 + h_3'), 'the asking identity leaves the middle coefficient as c');
  // One formula line, two identities stacked in it, exactly one shown at a time.
  assert.equal(f.root.querySelectorAll('[data-formula]').length, 1);
  assert.deepEqual([...f.$('[data-formula]').children].map(node => `${node.id}.${node.className}`), ['eq-hinge-bump-1.hb-told', 'eq-hinge-bump-3.hb-ask']);
  assert.match(css, /\.hb-formula > span \{ grid-area: 1 \/ 1; \}/);
  const all = ids.map(id => f.d.getElementById(id).textContent).join('\n');
  assert.deepEqual(all.match(/\d/g), ['1', '2', '2', '3', '1', '2', '3'], 'the only digits in a formula are the identities\' own subscripts and the chapter\'s coefficient');
  for (const foreign of ['\\parameterpart', '\\targetpart', '\\residualpart']) assert(!all.includes(foreign), `${foreign} in a formula of a scene with no such quantity`);
  f.load(); f.open();
  const sources = ids.map(id => f.d.getElementById(id).textContent);
  const same = label => { ids.forEach((id, n) => assert.equal(f.d.getElementById(id).textContent, sources[n], `${id} rewritten ${label}`)); assert.equal(f.root.querySelectorAll('span[id^="eq-"]').length, 3); };
  for (const time of times(0.05)) { f.seek(time); same(`at ${time}s`); assert.notEqual(classes(f).has('ask-formula'), classes(f).has('show-formula') || Number(f.root.dataset.stage) === 0); }
  for (const c of stops(f)) { drag(f, c); same(`dragged to ${c}`); }
});

test('bump: captions are plain prose within the budget, coloured by meaning, and the pane carries no chrome', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  assert.equal(f.root.querySelectorAll('.mechanism-stages').length, 0, 'no stage strip');
  assert.equal(f.root.querySelectorAll('[data-pane] dl, [data-pane] table, [data-pane] section').length, 0, 'no cards, no tables');
  assert.equal(f.root.querySelectorAll('[data-pane] input[type=range]').length, 2, 'the scrubber and exactly one control');
  assert(!slider(f).closest('[data-controls]'), 'the control is not part of the transport');
  const seenRoles = new Set();
  for (const time of times(0.05)) {
    f.seek(time);
    const html = caption(f).innerHTML, text = caption(f).textContent.trim();
    assert.doesNotMatch(html, /<sup|<sub|\^|\bmax_|\bexp\(|relu\(/i, `pseudo-math in the caption at ${time}s: ${html}`);
    assert.doesNotMatch(text, /\[/, `interval notation in a caption at ${time}s: the bracket on the picture says it`);
    assert.doesNotMatch(text, /(?<![\w.])-\d|\de[-+]?\d/, 'no ASCII minus or e-notation');
    for (const role of ['prediction-role', 'hinge-role']) if (html.includes(`class="${role}"`)) seenRoles.add(role);
    assert.doesNotMatch(f.$('[data-pane]').textContent, /beat \d/i, `stage chrome in the pane at ${time}s`);
  }
  assert.deepEqual([...seenRoles].sort(), ['hinge-role', 'prediction-role'],
    'the caption words sum / bump / ramp carry the picture\'s colours');
  // The numbers a caption states are the ones the picture has written.
  f.seek(B0); assert.equal(caption(f).textContent, 'Three ramps that only climb. How can their sum make this bump?');
  f.seek(B1); assert.equal(caption(f).textContent, 'Add them. Each ramp adds its coefficient to the sum’s slope: only up.');
  f.seek(B2); assert.equal(caption(f).textContent, 'Which coefficient on the middle ramp brings the sum back to zero, to stay?');
  f.seek(B3); assert.equal(caption(f).textContent, 'Turn it down. Both later slopes fall with it, and the sum’s tail swings.');
  f.seek(B4); assert.equal(caption(f).textContent, 'Only −2 lands: slopes +1, −1, 0. Three endless ramps, one local bump.');
  // The scrubber names the beat and nothing else: it never repeats the caption or a live value.
  const named = scene.beats.map(beat => { f.seek(beat); return scrubber(f).getAttribute('aria-valuetext').replace(/^\d+:\d\d of \d+:\d\d\. /, ''); });
  assert.deepEqual(named, ['Ramps.', 'Add.', 'Predict.', 'Fold.', 'Lock.']);
});

test('bump: moving the control pauses; only returning to the timeline clears its override', t => {
  const f = fixture(t, NAME), fx = declared(f); f.load(); f.open(); f.seek(B2 + 2); f.play(); f.tick(400);
  const held = c => {
    assert.equal(f.root.dataset.override, 'slider'); assert.equal(coefficient(f), c);
    assert.equal(slider(f).value, String(c)); assert.equal(f.$('[data-c-readout]').textContent, spell(c));
    const g = f.$('svg').getAttribute('viewBox') === PLOT.viewBox ? PLOT : NARROW_PLOT;
    for (const [x, y] of points(sumPath(f).getAttribute('d'))) assert(Math.abs(y - py(family(fx, c, unpx(fx, x, g)), g)) < 1e-3, 'the whole picture is the dragged value\'s');
    assert.deepEqual(written(f), [['1', '+1'], ['2', spell(1 + c)], ['3', spell(2 + c)]]);
  };
  drag(f, -1.25); assert(!f.playing); assert.equal(f.frames.size, 0);
  held(-1.25); assert.equal(slider(f).value, '-1.25', 'the pause redraw must not move the requested thumb back to the timeline');
  const time = f.time;
  f.resize(NARROW); held(-1.25); assert.equal(f.time, time); assert.equal(f.$('svg').getAttribute('viewBox'), NARROW_PLOT.viewBox);
  f.resize(WIDE); held(-1.25);
  f.$('[data-action=fullscreen]').click(); held(-1.25);
  f.$('[data-action=fullscreen]').click(); held(-1.25);
  f.speed(2); held(-1.25); assert(!f.playing);
  // The scrubber still names the timeline's beat during the detour.
  assert.match(scrubber(f).getAttribute('aria-valuetext'), /Predict\.$/);
  // The control's own keys change c, never the time.
  f.key('ArrowRight', slider(f)); f.key('Home', slider(f)); assert.equal(f.time, time);
  assert.equal(f.root.dataset.override, 'slider', 'a key on the control does not seek a scene beat');
  // Out-of-range requests are clamped to the control's range, not drawn.
  drag(f, -7); held(-3); drag(f, 4); held(1);
  for (const action of [() => f.seek(B2 + 2), () => f.key('Home'), () => f.key('End'), () => f.play(),
    () => f.key('ArrowLeft'), () => f.key('ArrowRight'), () => f.key(' '), () => f.key('k'),
    () => press(f, 'ArrowLeft', {shiftKey: true})]) {
    drag(f, -1.25); action(); assert.equal(f.root.dataset.override, '', 'a timeline action resumes the timeline\'s value');
    assert.notEqual(coefficient(f), -1.25); assert([1, fx.coefs[1]].includes(coefficient(f)));
    if (f.playing) f.play();
  }
  // Dragging to the answer before the reveal is the reader's own discovery: it locks, and the
  // timeline's Predict frame comes back untouched afterwards.
  f.seek(B2 + 2); const before = canonicalMarkup(f.$('[data-figure]').innerHTML);
  drag(f, fx.coefs[1]); assert(locked(f)); assert.match(caption(f).textContent, /^Locked/);
  f.seek(B2 + 2); assert.equal(canonicalMarkup(f.$('[data-figure]').innerHTML), before);
  assert.match(caption(f).textContent, /^Which coefficient/);
});

test('bump: a key the transport ignores leaves the dragged coefficient alone, even across a resize', t => {
  const f = fixture(t, NAME); f.load(); f.open(); f.seek(B2 + 2);
  const ignored = [];
  for (const modifier of ['altKey', 'ctrlKey', 'metaKey'])
    for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End', ' ', 'k', 'K']) ignored.push([key, {[modifier]: true}]);
  for (const key of [' ', 'k', 'K']) ignored.push([key, {repeat: true}]);
  for (const [key, init] of ignored) {
    const name = `${Object.keys(init)[0]}+${JSON.stringify(key)}`;
    drag(f, -2.5); const time = f.time;
    press(f, key, init);
    assert.equal(f.time, time, `${name} must not seek`); assert(!f.playing, `${name} must not play`);
    assert.equal(f.root.dataset.override, 'slider', `${name} ended the drag although the transport ignored it`);
    f.resize(NARROW);
    assert.equal(coefficient(f), -2.5); assert.equal(slider(f).value, '-2.5', `${name}, then a resize, snapped the thumb back to the timeline`);
    assert.equal(f.$('[data-c-readout]').textContent, `${MINUS}2.5`); assert.deepEqual(written(f).at(-1), ['3', `${MINUS}0.5`]);
    f.resize(WIDE); assert.equal(coefficient(f), -2.5); assert.equal(f.time, time);
  }
  // A key aimed at another control inside the pane is not the pane's key either.
  drag(f, -2.5); f.key('Home', f.$('[data-speed]'));
  assert.equal(f.root.dataset.override, 'slider'); f.resize(520); assert.equal(coefficient(f), -2.5);
});

test('bump: live values are announced by the control alone', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  assert.equal(fixture(t, NAME).$('[data-c-display]').getAttribute('aria-hidden'), null,
    'without the player nothing else speaks c, so the static readout stays readable');
  assert.equal(f.$('[data-c-display]').getAttribute('aria-hidden'), 'true',
    'while the player runs the slider speaks c; the visible copy is not a second announcement');
  assert.equal(slider(f).getAttribute('aria-label'), 'Coefficient c on the middle ramp h2');
  assert.equal(f.root.querySelectorAll('[data-pane] output').length, 1);
  const labels = new Set();
  const inspect = (whole, live) => {
    const label = picture(f).getAttribute('aria-label'), spoken = slider(f).getAttribute('aria-valuetext');
    const beat = scrubber(f).getAttribute('aria-valuetext').replace(/^\d+:\d\d of \d+:\d\d\. /, '');
    labels.add(label);
    if (live) assert.doesNotMatch(label, /\d/, `while the value is live the label describes the picture, not its values: ${label}`);
    assert.match(beat, /^[A-Z][a-z]+\.$/, `the scrubber names the beat only: ${beat}`);
    assert(spoken.startsWith(`c = ${f.$('[data-c-readout]').textContent}. `), spoken);
    assert.match(spoken, /A more negative c tilts the last two pieces down\.$/, 'the value text says what the value does');
    assert.equal(/Slopes /.test(spoken), whole, whole ? `the control speaks the slopes exactly as drawn: ${spoken}` : 'no slopes before the sum is whole');
    if (whole) assert(spoken.includes(`Slopes ${written(f).map(([, text]) => text).join(', ')}.`), spoken);
    assert.doesNotMatch(spoken + label, /(?<![\w.])-\d|\de[-+]?\d/, 'no ASCII minus or e-notation in a spoken value');
  };
  for (const time of [0, 3, B1, B1 + 1]) { f.seek(time); inspect(false, true); }
  for (const time of [B2 - 1, B2, B2 + 4, B3, B3 + 3, B3 + 5, B4 - 0.5]) { f.seek(time); inspect(true, true); }
  // Once landed, the label states the chapter's witness values; they are the fixture, not live.
  for (const time of [B4, B4 + 3, scene.duration]) { f.seek(time); inspect(true, false); assert.match(picture(f).getAttribute('aria-label'), /^Lock\. The sum is \+1 times h1, −2 times h2, \+1 times h3; slopes 0, \+1, −1, 0\./); }
  f.seek(B3 + 4); const named = scrubber(f).getAttribute('aria-valuetext');
  for (const c of stops(f)) {
    drag(f, c); inspect(true, true);
    // Force a transport redraw mid-detour: the scrubber still names the timeline's beat.
    f.speed(2); f.speed(1.5); inspect(true, true); assert.equal(scrubber(f).getAttribute('aria-valuetext'), named);
  }
  assert(labels.size <= 10, `the label is a sentence per state, not a per-frame readout: ${labels.size}`);
});

test('bump: the static fallback prints the final frame with every witness value', t => {
  const f = fixture(t, NAME);
  const fx = declared(f);
  // Read before any script runs: the script-free panel is already the whole witness.
  assert.deepEqual(written(f), [['1', '+1'], ['2', `${MINUS}1`], ['3', '0']]);
  assert.deepEqual(terms(f), ['+1 h₁', `${MINUS}2 h₂`, '+1 h₃']);
  assert.equal(value(f, 'peak'), String(bump(fx, fx.breaks[1]))); assert.equal(value(f, 'peak'), '2');
  assert.equal(value(f, 'coef'), spell(fx.coefs[1]));
  assert(f.root.querySelector('[data-drawing] [data-bracket]') && sumPath(f) && f.root.querySelectorAll('[data-drawing] [data-hinge]').length === 3);
  assert(ghostFill(f).classList.contains('is-locked') && !ghostLine(f), 'the final frame is the locked one');
  // The control is inert without its player: hidden, while its readout still names the c.
  assert.equal(slider(f).getAttribute('value'), String(fx.coefs[1])); assert.equal(f.$('[data-c-readout]').textContent, spell(fx.coefs[1]));
  assert.equal(f.$('[data-c-display]').textContent.replace(/\s+/g, ' ').trim(), `c = ${MINUS}2`);
  assert.match(css, /#hinge-bump-excerpt:not\(\[data-ready\]\) \.hb-slider-track \{ visibility: hidden; \}/, 'only the inert control is hidden before the player mounts');
  assert.doesNotMatch(css, /:not\(\[data-ready\]\) \.hb-(?:slider|c)\s*\{/, 'the static readout stays visible');
  // The sentence the bare numeral stands for is in the title and the description, so a
  // script-free reader is still told what 2 is the value of.
  assert.match(f.$('svg title').textContent, /peak g\(0\.5\) = 2 is written at the apex/);
  assert.match(f.$('svg').getAttribute('aria-label'), /Peak g\(0\.5\) = 2\./);
  assert.match(f.$('svg').getAttribute('aria-label'), /nonzero only on \[−1\.5, 2\.5\]/);
  assert(!drawing(f).includes('·'), 'the final frame withholds nothing');
  assert.match(f.root.className, /\bstage-4\b/); assert.match(f.root.className, /\bshow-formula\b/); assert.doesNotMatch(f.root.className, /\bwash-coef\b|\bask-formula\b/);
});

test('bump: no-script readouts are exactly the readouts at the end of the timeline', t => {
  const f = fixture(t, NAME);
  const readouts = () => [
    canonicalMarkup(drawing(f)), caption(f).innerHTML,
    [...classes(f)].sort().join(' '),
    f.$('.hb-figure svg').getAttribute('viewBox'), f.$('.hb-figure svg').getAttribute('aria-label'),
    f.$('.hb-figure svg title').textContent,
    slider(f).value, slider(f).min, slider(f).max, slider(f).step, slider(f).getAttribute('aria-valuetext'), f.$('[data-c-readout]').textContent,
    ...[...f.root.querySelectorAll('foreignObject')].map(node => `${node.dataset.tag}@${node.getAttribute('x')},${node.getAttribute('y')}`)
  ];
  const before = readouts();
  f.load(); f.seek(scene.duration);
  assert.deepEqual(readouts(), before);
  assert(before[0].includes('data-value="peak">2<') && before[0].includes('data-value="coef">−2<'), 'the static drawing carries the witness values');
});

test('bump: the static panel differs from the final render only where script must add', t => {
  const f = fixture(t, NAME);
  const pane = f.$('[data-pane]');
  const strip = html => {
    const box = f.w.document.createElement('div');
    box.innerHTML = html;
    box.querySelectorAll('[data-controls], [data-static-frame]').forEach(node => node.remove());
    // The one attribute the player adds outside the transport: once the slider speaks c, the
    // visible copy of it leaves the accessibility tree.
    box.querySelector('[data-c-display]').removeAttribute('aria-hidden');
    return canonicalMarkup(box.innerHTML);
  };
  const before = strip(pane.innerHTML);
  f.load(); f.seek(scene.duration);
  assert.equal(strip(pane.innerHTML), before, 'script changed the panel somewhere the receipt does not name');
  assert.equal(pane.querySelector('[data-controls]').hidden, false);
  assert.equal(f.root.dataset.ready, 'true');
});

test('bump: the static frame in panel.html is the player\'s own final drawing', async () => {
  const {file, before, after} = await staticFrame(NAME);
  assert.equal(after, before, `${path.relative(path.join(__dirname, '..'), file)} is stale: run node scripts/render_static_frames.cjs ${scene.scene}`);
  assert.match(before, /<!-- static-frame[^>]*-->\s*<g data-drawing>[\s\S]*?<\/g>\s*<!-- \/static-frame -->/);
});

test('bump: scripts-off phones receive the narrow plot with its own clip paths and unchanged witness', t => {
  const f = fixture(t, NAME), svg = f.$('.hb-figure svg');
  const narrow = svg.querySelector('[data-static-frame="narrow"]');
  assert(narrow, 'the complete narrow print ships without executing a player');
  assert.equal(narrow.dataset.width, String(NARROW_PLOT.width)); assert.equal(narrow.dataset.height, String(NARROW_PLOT.height));
  assert.equal(narrow.getAttribute('transform'), 'scale(2.3889)');
  assert.equal(svg.getAttribute('preserveAspectRatio'), 'xMinYMin meet');
  const n = fixture(t, NAME, {width: NARROW}); n.load(); n.seek(scene.duration);
  assert.equal(canonicalMarkup(narrow.innerHTML.replaceAll('--static-narrow', '')), canonicalMarkup(drawing(n)));
  assert.equal(narrow.querySelector('[data-value="peak"]').textContent, '2');
  assert.equal(narrow.querySelector('[data-value="coef"]').textContent, '−2');
  assert.deepEqual([...narrow.querySelectorAll('[data-slope]')].map(node => node.textContent), ['+1', '−1', '0']);
  const ids = [...f.root.querySelectorAll('[id]')].map(node => node.id);
  assert.equal(new Set(ids).size, ids.length, 'wide and narrow prints cannot duplicate SVG IDs');
  assert.equal(narrow.querySelector('clipPath').id, 'hb-plot--static-narrow');
  assert.equal(narrow.querySelector('clipPath rect').getAttribute('width'), String(NARROW_PLOT.right - NARROW_PLOT.left));
  assert.equal(svg.querySelector('[data-drawing] clipPath rect').getAttribute('width'), String(PLOT.right - PLOT.left));
  for (const node of narrow.querySelectorAll('[clip-path]')) {
    const id = node.getAttribute('clip-path').match(/^url\(#([^)]*)\)$/)[1];
    assert(id.endsWith('--static-narrow'));
    assert(narrow.contains(f.d.getElementById(id)), `${id} must resolve to this print's geometry`);
  }
  assert.match(css, /\.hb-figure \{ container-type: inline-size; \}/);
  assert.match(css, /@container \(max-width: 599px\)/);
  assert.match(css, /:not\(\[data-ready\]\) \.hb-figure svg \{ aspect-ratio: 860 \/ 342; \}/);
  assert.match(css, /:not\(\[data-ready\]\) \.hb-figure svg \{ aspect-ratio: 360 \/ 212; \}/);
  assert.match(css, /:not\(\[data-ready\]\) \[data-drawing\] \{ display: none; \}/);
  assert.match(css, /:not\(\[data-ready\]\) \[data-static-frame="narrow"\] \{ display: block; \}/);
  assert.equal(svg.querySelectorAll('foreignObject').length, 1, 'the x label retains its unique MathJax ID');
  // The typeset axis tag's narrow static geometry is the live narrow tag times the print's scale.
  const tag = n.root.querySelector('foreignObject[data-tag="x"]'), scale = PLOT.width / NARROW_PLOT.width;
  const want = ['x', 'y', 'width'].map(key => `${key}: ${Number((Number(tag.getAttribute(key)) * scale).toFixed(4))}px`).join('; ');
  assert(css.includes(`foreignObject[data-tag="x"] { ${want};`), `the narrow static tag is not at ${want}`);
  f.load();
  assert.equal(f.root.querySelectorAll('[data-static-frame]').length, 0);
  assert.equal(svg.querySelectorAll('[data-drawing]').length, 1);
});

test('bump: below 600 px the same picture reflows into a smaller plot with nothing outside the viewBox', t => {
  const wide = fixture(t, NAME); wide.load(); wide.open(); wide.seek(scene.duration);
  assert.equal(wide.$('svg').getAttribute('viewBox'), PLOT.viewBox);
  assert(!classes(wide).has('is-stacked'));
  const fx = declared(fixture(t, NAME));
  const narrow = fixture(t, NAME, {width: NARROW}); narrow.load(); narrow.open(); narrow.seek(scene.duration);
  assert.equal(narrow.$('svg').getAttribute('viewBox'), NARROW_PLOT.viewBox);
  assert(classes(narrow).has('is-stacked'));
  // Same marks, same numbers: only the geometry moved.
  assert.deepEqual(texts(narrow, '[data-drawing] [data-value]'), texts(wide, '[data-drawing] [data-value]'));
  assert.deepEqual(drawnNumbers(narrow).map(node => node.textContent), drawnNumbers(wide).map(node => node.textContent));
  assert.equal(narrow.root.querySelectorAll('[data-hinge]').length, 3);
  const tags = f => [...f.root.querySelectorAll('foreignObject')].map(node => `${node.getAttribute('x')},${node.getAttribute('y')}`);
  assert.notDeepEqual(tags(narrow), tags(wide), 'the typeset axis tag moves with the axis');
  // The sum still on the declared bump in the narrow geometry; the tag inside the picture and
  // level with the zero line; the bracket still below the ticks.
  for (const [x, y] of points(sumPath(narrow).getAttribute('d'))) {
    assert(x >= NARROW_PLOT.left - 1e-6 && x <= NARROW_PLOT.right + 1e-6, 'a vertex leaves the narrow plot');
    assert(Math.abs(y - py(bump(fx, unpx(fx, x, NARROW_PLOT)), NARROW_PLOT)) < 1e-3, 'the narrow sum is not the bump');
  }
  const bracketY = Number(/V(\d+(?:\.\d+)?)H/.exec(narrow.root.querySelector('[data-bracket]').getAttribute('d'))[1]);
  const tickRow = Math.max(...[...narrow.root.querySelectorAll('[data-drawing] text')].map(node => Number(node.getAttribute('y'))));
  assert(bracketY - 5 > tickRow, 'the narrow bracket is below the narrow tick row');
  assert(bracketY <= NARROW_PLOT.height, 'the narrow bracket is inside the viewBox');
  for (const [f, g] of [[wide, PLOT], [narrow, NARROW_PLOT]]) {
    const tag = f.root.querySelector('foreignObject[data-tag="x"]');
    const [x, y, w, h] = ['x', 'y', 'width', 'height'].map(key => Number(tag.getAttribute(key)));
    assert(x >= g.right && x + w <= g.width, 'the x tag sits right of the plot, inside the picture');
    assert(Math.abs(y + h / 2 - py(0, g)) < 2, 'and level with the zero line');
  }
  // A resize flips the mode in place, without restarting anything.
  wide.resize(NARROW);
  assert.equal(wide.$('svg').getAttribute('viewBox'), NARROW_PLOT.viewBox); assert(classes(wide).has('is-stacked'));
  wide.resize(WIDE);
  assert.equal(wide.$('svg').getAttribute('viewBox'), PLOT.viewBox); assert(!classes(wide).has('is-stacked'));
  assert(!wide.playing);
});

test('bump: at both layouts, timed or dragged, every label stays inside the picture, off its neighbours and off every line', t => {
  const fx = declared(fixture(t, NAME));
  // The type table is the stylesheet's, in both layouts.
  const sized = (cls, size, stacked) => new RegExp(stacked
    ? `\\.mechanism-excerpt\\.is-stacked \\.${cls.replace('.', '\\.')},\\s*#hinge-bump-excerpt \\[data-static-frame="narrow"\\] \\.${cls.replace('.', '\\.')} \\{ font-size: ${size}px`
    : `\\.${cls.replace('.', '\\.')} \\{ font-size: ${size}px`);
  for (const [layout, stacked] of [['wide', false], ['narrow', true]]) {
    const table = TYPE[layout];
    for (const cls of ['hb-term', 'hb-slope', 'hb-slope-label', 'hb-tick', 'hb-peak', 'hb-ghost-label']) assert.match(css, sized(cls, table[cls], stacked), `${cls} at ${layout}`);
    assert.match(css, sized('hb-tick.is-break', table['is-break'], stacked)); assert.match(css, sized('hb-coef.is-control', table.control, stacked));
  }
  // JSDOM lays nothing out, so a label's box is estimated the way the other suites do it: a
  // generous advance per glyph at the label's size (0.6 em; a space 0.3; ten per cent more
  // for heavy type), and a baseline y spanning y - 0.72 s ... y + 0.2 s.
  const advance = text => [...text].reduce((total, ch) => total + (ch === ' ' ? 0.3 : 0.6), 0);
  const boxes = (f, layout) => [...f.root.querySelectorAll('[data-drawing] text')].map(node => {
    const table = TYPE[layout], cls = [...node.classList];
    const base = cls.includes('is-break') ? table['is-break'] : table[cls.find(name => table[name])];
    assert(base, `no type size known for <text class="${node.getAttribute('class')}">`);
    const size = node.querySelector('.is-control') ? table.control : base;
    const width = advance(node.textContent) * size * 1.1, x = Number(node.getAttribute('x')), y = Number(node.getAttribute('y'));
    const anchor = node.getAttribute('text-anchor');
    const [x0, x1] = anchor === 'end' ? [x - width, x] : anchor === 'middle' ? [x - width / 2, x + width / 2] : [x, x + width];
    return {line: node.textContent, x0, x1, y0: y - 0.72 * size, y1: y + 0.2 * size, node};
  });
  // Does the segment a-b pass through the box? Liang-Barsky clipping.
  const crosses = ([ax, ay], [bx, by], box) => {
    let u0 = 0, u1 = 1;
    for (const [p, q] of [[ax - bx, ax - box.x0], [bx - ax, box.x1 - ax], [ay - by, ay - box.y0], [by - ay, box.y1 - ay]]) {
      if (p === 0) { if (q < 0) return false; continue; }
      const r = q / p;
      if (p < 0) { if (r > u1) return false; if (r > u0) u0 = r; } else { if (r < u0) return false; if (r < u1) u1 = r; }
    }
    return u0 < u1;
  };
  let inspected = 0;
  for (const [layout, width, g] of [['wide', WIDE, PLOT], ['narrow', NARROW, NARROW_PLOT]]) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    const control = stops(f);
    const inspect = label => {
      const all = boxes(f, layout);
      for (const b of all) {
        assert(b.x0 >= -0.5 && b.x1 <= g.width + 0.5, `"${b.line}" leaves the ${layout} picture sideways ${label}: ${b.x0.toFixed(1)}…${b.x1.toFixed(1)}`);
        assert(b.y0 >= -0.5 && b.y1 <= g.height + 0.5, `"${b.line}" leaves the ${layout} picture vertically ${label}`);
      }
      for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
        const a = all[i], b = all[j];
        if (a.y1 <= b.y0 + 0.5 || b.y1 <= a.y0 + 0.5) continue;
        assert(a.x1 <= b.x0 + 0.5 || b.x1 <= a.x0 + 0.5, `"${a.line}" and "${b.line}" overlap in the ${layout} layout ${label}`);
      }
      // Every curve is clipped to the plot, so a label outside the plot can never meet one:
      // the two ledger rows sit wholly above it and the ticks wholly below. A label inside the
      // plot -- the target's word, the peak -- must be clear of every drawn segment.
      for (const node of f.root.querySelectorAll('[data-drawing] path[data-hinge], [data-drawing] path[data-mark], [data-drawing] path[data-silhouette-line]')) {
        assert(node.closest('[clip-path]'), `${node.getAttribute('class')} is not clipped to the plot`);
      }
      for (const b of all) {
        const inside = b.y1 > g.top && b.y0 < g.bottom;
        if (b.node.matches('[data-term], [data-slope], [data-slope-label]')) assert(b.y1 <= g.top, `"${b.line}" reaches into the ${layout} plot ${label}`);
        if (b.node.classList.contains('hb-tick') && b.node.getAttribute('text-anchor') === 'middle') assert(b.y0 >= g.bottom, `tick "${b.line}" reaches into the ${layout} plot`);
        if (!inside || b.node.classList.contains('hb-tick')) continue;
        for (const path of f.root.querySelectorAll('[data-drawing] path[data-hinge], [data-drawing] path[data-mark="sum"]')) {
          const pts = points(path.getAttribute('d'));
          pts.slice(1).forEach((pt, i) => assert(!crosses(pts[i], pt, b), `"${b.line}" sits on ${path.getAttribute('class')} in the ${layout} layout ${label}`));
        }
        inspected++;
      }
      // Each breakpoint rule passes between the slope entries, never through one.
      for (const rule of f.root.querySelectorAll('[data-drawing] .hb-break')) {
        const x = Number(rule.getAttribute('x1'));
        for (const b of all.filter(e => e.node.matches('[data-slope], [data-slope-label]'))) assert(x < b.x0 || x > b.x1, `a rule strikes through "${b.line}" in the ${layout} layout ${label}`);
      }
    };
    for (const time of [0, 3, B1 + 1, B1 + 2.5, B1 + 4, B2, B2 + 4, B3, B3 + 2, B3 + 3.5, B3 + 5, B3 + 6.5, B4 - 0.05, B4, B4 + 0.6, B4 + 2, scene.duration]) { f.seek(time); inspect(`at ${time}s`); }
    for (const c of control) { drag(f, c); inspect(`dragged to ${c}`); }
    // The widest things the ledger ever writes, a gliding two-decimal coefficient included.
    f.seek(B3 + 4); assert.match(value(f, 'coef'), /^[−+]\d\.\d\d$/); inspect('mid-glide');
  }
  assert(inspected > 10, `${inspected} in-plot labels checked against the lines`);
  assert(fx.breaks.length === 3);
});

test('bump: the panel is the only fixture copy -- moving it moves every number', t => {
  const f = fixture(t, NAME);
  // Not a manuscript edit: this proves the player reads the declared attributes, so a real
  // chapter change could not leave a stale number behind in the scene script or the SVG.
  // Breakpoints -1, 1, 3 with coefficients 2, -4, 2: a bump twice as high, peaking at 1.
  f.root.dataset.breaks = '-1 1 3'; f.root.dataset.coefs = '2 -4 2';
  f.load(); f.open();
  f.seek(scene.duration);
  assert.deepEqual(terms(f), ['+2 h₁', `${MINUS}4 h₂`, '+2 h₃']);
  assert.deepEqual(written(f), [['1', '+2'], ['2', `${MINUS}2`], ['3', '0']]);
  assert.equal(f.root.querySelector('[data-peak]').textContent, '4');
  assert.match(f.$('svg').getAttribute('aria-label'), /Peak g\(1\) = 4\./);
  assert.match(f.$('svg').getAttribute('aria-label'), /nonzero only on \[−1, 3\]/);
  assert.match(caption(f).textContent, /^Only −4 lands: slopes \+2, −2, 0\./);
  // The control's range follows the fixture: one unit past the declared coefficient, up to a bare ramp.
  assert.deepEqual([slider(f).min, slider(f).max], ['-5', '1']);
  drag(f, -4); assert(locked(f)); drag(f, -2); assert(!locked(f)); assert.deepEqual(written(f), [['1', '+2'], ['2', '0'], ['3', '+2']]);
  f.seek(scene.duration);
  const pane = f.$('[data-pane]').cloneNode(true);
  pane.querySelectorAll('span[id^="eq-"]').forEach(node => node.remove());
  for (const stale of ['0.5', '2.5', `${MINUS}1.5`, '2', `${MINUS}2 h₂`]) assert(![...pane.querySelectorAll('[data-drawing] text')].some(node => node.textContent === stale), `${stale} survived a moved fixture`);
});

test('bump: the boundary tells the truth about the control, in one visible sentence and a closed scope', t => {
  const f = fixture(t, NAME);
  const lead = f.$('.mechanism-boundary > p').textContent, scope = f.$('.mechanism-scope').textContent;
  assert.match(lead, /^Nothing here is learned: /);
  // The sentences the control made false are gone...
  for (const stale of [/no control to turn/, /no intermediate coefficient is ever written/, /consumed the moment/, /not something this panel shows/, /at most two at a time/]) assert.doesNotMatch(lead + scope, stale);
  // ...and what replaced them declares the control's values as this panel's, not the chapter's.
  assert.match(scope, /The chapter's coefficients are 1, −2, 1\./);
  assert.match(scope, /one control this panel has turns the middle coefficient by hand, in ink, and no optimizer ever touches it/);
  assert.match(scope, /runs from −3 to \+1 in steps of 0\.25, and the timeline sweeps it from \+1, a bare ramp, down to −2/);
  assert.match(scope, /this panel's declared computed variants, not numbers of the chapter/);
  assert.match(scope, /One bump is a construction, not an approximation theorem/);
  // The scope's numbers are the control's and this suite's arithmetic.
  const s = slider(f);
  assert.deepEqual([s.min, s.max, s.step], ['-3', '1', '0.25']);
  assert.match(scope, /slopes \+1, 1 \+ c, 2 \+ c/); assert.match(scope, /4\.5 \(2 \+ c\)/); assert.match(scope, /4 \+ 2c/);
  assert.doesNotMatch(lead + scope + f.$('.mechanism-transcript').textContent, /(?<![\w.])-\d|\de[-+]?\d/, 'no ASCII minus or e-notation in the prose');
});

test('integration: the excerpt is HTML-only, manifest-driven, and declared in the config', () => {
  const filter = fs.readFileSync(path.join(__dirname, '..', scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/,
    'the non-HTML guard is the first executable line, so the PDF is untouched');
  assert.match(filter, /pandoc\.json\.decode/, 'the scene is data in the manifest, not code in the filter');
  assert.match(filter, /"after-cell"/, 'the filter must be able to place this scene\'s anchor kind');
  assert.match(filter, /assert\(inserted == 1/);
  assert.doesNotMatch(filter, /hinge|bump/i, 'a manifest-driven filter names no scene');
  const config = fs.readFileSync(path.join(__dirname, '..', '_quarto.yml'), 'utf8');
  const section = (key, text) => {
    const start = text.indexOf(`\n${key}`);
    assert(start >= 0, `${key} is missing from _quarto.yml`);
    const rest = text.slice(start + 1 + key.length);
    const end = rest.search(/\n\S/);
    return end < 0 ? rest : rest.slice(0, end);
  };
  assert.match(section('  resources:', config), new RegExp(`^\\s+- interactives/${scene.scene}/player\\.js$`, 'm'));
  assert.match(section('filters:', config), new RegExp(`^\\s+- ${scene.filter.replace(/[/.]/g, '\\$&')}$`, 'm'));
  assert(!section('  resources:', config).includes(`${scene.scene}/panel.html`));
  // The chapter is anchored after the figure cell, whose label Quarto turns into the
  // cell-fig-hinge-bump div; the values cell it plots must sit above it.
  assert.equal(scene.anchor.type, 'after-cell'); assert.equal(scene.anchor.target, 'cell-fig-hinge-bump');
  const chapter = chapterSource(NAME);
  assert.equal(chapter.split('\n').filter(line => line === '#| label: fig-hinge-bump').length, 1, 'the anchor cell appears exactly once');
  assert(chapter.indexOf('#| label: hinge-bump-values') < chapter.indexOf('#| label: fig-hinge-bump'), 'the fixture cell precedes the anchor');
  assert.equal(read(`${scene.scene}/panel.html`).includes('data-playback='), scene.transport === 'shared');
  assert(manifest.scenes.some(other => other.id === NAME));
  // The timeline the manifest publishes is the timeline the panel declares.
  assert.equal(scene.duration, 36); assert.deepEqual(scene.beats, [0, 6, 14, 22, 30]);
  assert(read(`${scene.scene}/panel.html`).includes(`data-duration="${scene.duration}" data-beats="${scene.beats.join(' ')}"`));
});
