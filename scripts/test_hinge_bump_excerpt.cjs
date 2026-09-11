#!/usr/bin/env node
// Test-only JSDOM. No dependency from this file enters the published book.
// The JSDOM fixture, the markup canonicaliser, and the transport, beat-hold and grammar
// suites this scene inherits live in scripts/html-tests/excerpt-harness.cjs. What stays
// here is the part no harness can supply: this scene's arithmetic -- the three hinges and
// their weighted sum, recomputed here at a dense grid and never through the player -- the
// claims the chapter's fixture makes (the sum peaks at the middle breakpoint, returns to
// zero, has four linear pieces), the shape of its one picture, its typeset formula and the
// class toggles the player applies. JSDOM never typesets, so the formula assertions read
// the TeX source, the eq- ids, the \class{} names and the class toggles, never rendered math.
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
// is the one the static frame is drawn in. One test drives the narrow layout explicitly.
const WIDE = 780, NARROW = 360;
// The wide plot's geometry, stated here from the picture's own design (player.js LAYOUT.wide)
// so every drawn coordinate is checked against numbers this suite owns.
const PLOT = {left: 58, right: 812, top: 40, bottom: 252, ymin: -1.1, ymax: 3.1, viewBox: '0 0 860 306', tickY: 272, bracketY: 296};
const NARROW_PLOT = {left: 26, right: 330, top: 26, bottom: 152, ymin: -1.1, ymax: 3.1, viewBox: '0 0 360 192', width: 360, height: 192};
const MINUS = '−';
// The picture's budget: no frame writes more than this many numbers, counting every text
// element on the drawing that carries a digit (a subscripted curve name like h2 is a label,
// not a number, and carries no digit character). The current peak is seven, from the fold on.
const NUMBER_BUDGET = 8;
const CAPTION_WORDS = 14, INTRO_WORDS = 40;

// Read the declared fixture from the closed panel. The panel is the one in-repo mirror of
// the manuscript's numbers; everything below is computed from it, so no chapter value is
// typed here a second time.
function declared(f) {
  assert(!f.root.dataset.ready, 'read the declared fixture before the player mounts');
  return {domain: numbers(f.root.dataset.domain), breaks: numbers(f.root.dataset.breaks), coefs: numbers(f.root.dataset.coefs)};
}

// This suite's own hinges and sum, deliberately not the player's: the independent
// evaluation every arithmetic assertion below is checked against. torch.relu(xs - b).
const relu = v => Math.max(0, v);
const hinges = (fx, x) => fx.breaks.map(b => relu(x - b));
const weighted = (fx, c, x) => hinges(fx, x).reduce((total, h, k) => total + c[k] * h, 0);
const bump = (fx, x) => weighted(fx, fx.coefs, x);
const grid = (fx, n = 800) => Array.from({length: n + 1}, (_, i) => fx.domain[0] + (fx.domain[1] - fx.domain[0]) * i / n);
// The 161 samples the picture is drawn through, recomputed here.
const samples = fx => Array.from({length: 161}, (_, i) => fx.domain[0] + (fx.domain[1] - fx.domain[0]) * i / 160);
const signed = value => {
  const v = Math.abs(value) < 5e-4 ? 0 : value;
  const whole = Math.abs(v - Math.round(v)) < 5e-4;
  const text = whole ? String(Math.abs(Math.round(v))) : Math.abs(v).toFixed(1);
  return v < 0 ? `${MINUS}${text}` : v > 0 ? `+${text}` : '0';
};
const px = (fx, x, g = PLOT) => g.left + (x - fx.domain[0]) / (fx.domain[1] - fx.domain[0]) * (g.right - g.left);
const py = (y, g = PLOT) => g.bottom - (y - g.ymin) / (g.ymax - g.ymin) * (g.bottom - g.top);
const unpx = (fx, v, g = PLOT) => fx.domain[0] + (v - g.left) / (g.right - g.left) * (fx.domain[1] - fx.domain[0]);
const unpy = (v, g = PLOT) => (g.bottom - v) / (g.bottom - g.top) * (g.ymax - g.ymin) + g.ymin;
const points = d => d.trim().replace(/^M\s*/, '').split(/\s*L\s*/).filter(Boolean).map(pair => pair.split(',').map(Number));
const coef = f => numbers(f.root.dataset.coef);
const ramp2 = f => Number(f.root.dataset.ramp2);
const silhouette = f => Number(f.root.dataset.silhouette);
const slopes = f => JSON.parse(f.root.dataset.slopes);
const texts = (f, selector) => [...f.root.querySelectorAll(selector)].map(node => node.textContent);
const value = (f, name) => { const node = f.root.querySelector(`[data-value="${name}"]`); return node ? node.textContent : null; };
// What the picture writes as a slope, in the order it writes it: [piece, text] per entry.
const written = f => [...f.root.querySelectorAll('[data-slope]')].map(node => [node.dataset.piece, node.textContent.replace(/^slope\s*/, '')]);
const tex = (f, n) => f.d.getElementById(`eq-hinge-bump-${n}`).textContent;
const drawing = f => f.$('[data-drawing]').innerHTML;
const classes = f => new Set([...f.root.classList]);
const caption = f => f.$('[data-caption]');
const words = text => text.trim().split(/\s+/).filter(Boolean).length;
const sumPath = f => f.root.querySelector('[data-mark="sum"]');
const hingePath = (f, k) => f.root.querySelector(`[data-hinge="${k}"]`);
const ghostLine = f => f.root.querySelector('[data-silhouette-line]');
const revealWidth = (f, id) => { const rect = f.root.querySelector(`#${id} rect`); return rect ? Number(rect.getAttribute('width')) : null; };
// Every number the picture writes at this instant: a drawn text element carrying a digit.
const drawnNumbers = f => [...f.root.querySelectorAll('[data-drawing] text')]
  .map(node => node.textContent).filter(text => /\d/.test(text));
const times = (step = 0.05) => {
  const out = [];
  for (let t = 0; t <= scene.duration + 1e-9; t += step) out.push(Number(t.toFixed(4)));
  return out;
};
const css = read(`${scene.scene}/player.css`);
const [B0, B1, B2, B3, B4] = scene.beats;

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
  const edges = [fx.domain[0], ...fx.breaks, fx.domain[1]];
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
  // And the player, at the end, publishes exactly these and writes the ones it promises.
  f.load(); f.open(); f.seek(scene.duration);
  assert.deepEqual(coef(f), fx.coefs);
  assert.deepEqual(slopes(f), expected);
  assert.deepEqual(written(f), [['0', '0']], 'the payoff writes one slope, the flat piece it has returned to');
  assert.equal(value(f, 'peak'), '2');
  assert.equal(value(f, 'coef'), `${MINUS}2`);
  // The four slopes the picture no longer banks in a row are still stated in full, where a
  // reader who wants the list can find them.
  assert.match(f.$('svg').getAttribute('aria-label'), /slopes 0, \+1, −1, 0\./);
  assert.match(f.$('.mechanism-transcript').textContent, /slopes 0, \+1, −1, 0/);
});

test('bump: at every scrubbed time the drawn sum is h1 + c2 h2 + c3 h3 for the published coefficients, and the dashed ramp is the published ramp scale times h2', t => {
  const f = fixture(t, NAME);
  const fx = declared(f); f.load(); f.open();
  let checked = 0, morphing = 0;
  const seen = new Set();
  for (const time of times(0.05)) {
    f.seek(time);
    const c = coef(f), m = ramp2(f);
    const stage = Number(f.root.dataset.stage);
    // The published coefficients are what the mechanism admits: h1 whole from the climb beat
    // on, h2 from zero down to its declared -2, h3 whole once it has joined; nothing else.
    assert.equal(c[0], stage >= 1 ? fx.coefs[0] : 0, `c1 at ${time}s`);
    if (stage <= 1) assert.equal(c[1], 0, `h2 in the sum before it joins at ${time}s`);
    assert(c[1] <= 1e-9 && c[1] >= fx.coefs[1] - 1e-9, `h2 joins at ${c[1]} at ${time}s: it must never be positive and never past -2`);
    if (stage >= 3) assert.equal(c[1], fx.coefs[1], `the fold is finished by the close beat, not ${c[1]} at ${time}s`);
    if (stage === 2 && c[1] > fx.coefs[1] + 1e-9 && c[1] < -1e-9) morphing++;
    if (stage >= 3) assert(c[2] >= 0 && c[2] <= fx.coefs[2] + 1e-9); else assert.equal(c[2], 0, `h3 in the sum before it joins at ${time}s`);
    if (stage >= 4) assert.deepEqual(c, fx.coefs, `the sum is not the chapter's bump at ${time}s`);
    // The drawn middle ramp and the sum's own h2 coefficient are one motion seen twice: both
    // stand still, both move over the same two seconds, and both land on the declared -2.
    assert(m <= 1 + 1e-9 && m >= fx.coefs[1] - 1e-9, `the drawn ramp scale ${m} leaves [-2, 1] at ${time}s`);
    if (stage <= 1) assert.equal(m, 1, `the middle ramp is turned over before its beat at ${time}s`);
    if (stage >= 3) assert.equal(m, fx.coefs[1], `the middle ramp is not -2 h2 at ${time}s`);
    seen.add(`${c.join(',')}|${m}`);
    const path = sumPath(f);
    if (!path) { assert.equal(stage, 0, `no sum drawn at ${time}s`); continue; }
    // The drawn curve, point by point, against this suite's own weighted sum of the
    // declared hinges at the published coefficients.
    const pts = points(path.getAttribute('d'));
    assert.equal(pts.length, 161, 'the sum is drawn through 161 samples');
    for (const [x, y] of pts) {
      const at = unpx(fx, x);
      assert(Math.abs(y - py(weighted(fx, c, at))) < 0.02, `sum off its coefficients at ${time}s, x = ${at.toFixed(3)}: ${y} vs ${py(weighted(fx, c, at))}`);
      checked++;
    }
    // Breakpoints are sample points, so every piece is drawn straight.
    for (const b of fx.breaks) assert(pts.some(([x]) => Math.abs(unpx(fx, x) - b) < 1e-3), `breakpoint ${b} is not a sample at ${time}s`);
    // The three hinges: h1 and h3 as declared, the middle one at the published ramp scale --
    // and each drawn from its own breakpoint, never along the zero line before it.
    [1, m, 1].forEach((scale, k) => {
      const hinge = hingePath(f, k);
      assert(hinge, `hinge ${k} is not standing at ${time}s`);
      const hpts = points(hinge.getAttribute('d'));
      assert(Math.abs(unpx(fx, hpts[0][0]) - fx.breaks[k]) < 1e-3, `hinge ${k} starts at ${unpx(fx, hpts[0][0])}, not its breakpoint, at ${time}s`);
      assert(Math.abs(unpx(fx, hpts.at(-1)[0]) - fx.domain[1]) < 1e-3, `hinge ${k} stops short of the domain at ${time}s`);
      for (const [x, y] of hpts) assert(Math.abs(y - py(scale * relu(unpx(fx, x) - fx.breaks[k]))) < 0.02, `hinge ${k} off at ${time}s`);
    });
  }
  assert(checked > 90000 && morphing > 20, `${checked} points checked, ${morphing} morphing frames`);
  assert(seen.size > 60, 'the fold moves continuously, not in steps');
  // The coefficient path in order: 0 -> -2 for h2; 0 -> +1 for h3. No positive h2 anywhere.
  f.seek(B2 - 0.05); assert.deepEqual(coef(f), [1, 0, 0]); assert.equal(ramp2(f), 1);
  f.seek(B2 + 1.5); const mid = coef(f)[1]; assert(mid < 0 && mid > fx.coefs[1], `the coefficient is between 0 and -2 mid-fold, not ${mid}`);
  assert(ramp2(f) < 1 && ramp2(f) > fx.coefs[1], 'the drawn ramp swings with it');
  f.seek(B3 - 0.05); assert.deepEqual(coef(f), [1, fx.coefs[1], 0]);
  f.seek(B4 - 0.05); assert.deepEqual(coef(f), fx.coefs);
  // Monotone: the fold falls, the ramp swings down with it, the third coefficient rises.
  const track = (a, b, fn) => { const out = []; for (let s = a; s < b; s += 0.05) { f.seek(Number(s.toFixed(4))); out.push(fn(f)); } return out; };
  const nonDecreasing = list => list.every((v, i) => i === 0 || v >= list[i - 1] - 1e-9);
  assert(nonDecreasing(track(B2, B3, g => coef(g)[1]).reverse()), 'the folding coefficient wavers');
  assert(nonDecreasing(track(B2, B3, ramp2).reverse()), 'the swinging ramp wavers');
  assert(nonDecreasing(track(B3, B4, g => coef(g)[2])), 'the third coefficient wavers');
});

test('bump: the target silhouette is the declared bump drawn ahead of its construction, and is retired only once the sum has reached it', t => {
  const f = fixture(t, NAME);
  const fx = declared(f); f.load(); f.open();
  const xs = samples(fx);
  let standing = 0, fading = 0;
  let previous = Infinity;
  for (const time of times(0.05)) {
    f.seek(time);
    const s = silhouette(f), c = coef(f);
    assert(s <= previous + 1e-9, `the target comes back at ${time}s`);
    previous = s;
    // The gap between what the sum is now and the bump it is aiming at, at every sample.
    const gap = Math.max(...xs.map(x => Math.abs(weighted(fx, c, x) - bump(fx, x))));
    if (s > 1 - 1e-9) { standing++; assert(f.root.querySelector('[data-silhouette]'), `the target is opaque but not drawn at ${time}s`); }
    else assert(gap < 1e-12, `the target is being retired at ${time}s while the sum is still ${gap} away from it`);
    if (s > 1e-9 && s < 1 - 1e-9) fading++;
    const line = ghostLine(f);
    if (s <= 1e-9) { assert(!line, `the target is still drawn at ${time}s`); continue; }
    // It is the declared bump, at the same samples, over the support alone: outside the
    // window it would only lay a second dash pattern along the zero line.
    const pts = points(line.getAttribute('d'));
    assert.equal(pts.length, 81, `the target is drawn over the support's samples, not ${pts.length}, at ${time}s`);
    assert(Math.abs(unpx(fx, pts[0][0]) - fx.breaks[0]) < 1e-3 && Math.abs(unpx(fx, pts.at(-1)[0]) - fx.breaks[2]) < 1e-3, 'the target spans exactly the support');
    for (const [x, y] of pts) assert(Math.abs(y - py(bump(fx, unpx(fx, x)))) < 0.02, `the target is not the declared bump at ${time}s`);
    // The fill closes on the zero line at the two ends, so it is a silhouette and not a curve.
    const fill = f.root.querySelector('[data-silhouette]').getAttribute('d');
    assert(fill.startsWith(`M ${px(fx, fx.breaks[0]).toFixed(2)},${py(0).toFixed(2)} `) && fill.endsWith(`L ${px(fx, fx.breaks[2]).toFixed(2)},${py(0).toFixed(2)} Z`), `the target does not close on zero: ${fill.slice(0, 40)}`);
  }
  assert(standing > 400 && fading > 8, `${standing} frames standing, ${fading} fading`);
  // It stands whole through the first three beats and is gone by the last.
  for (const time of [B0, B1, B2, B3]) { f.seek(time); assert.equal(silhouette(f), 1, `the target is not whole at ${time}s`); }
  f.seek(B4); assert.equal(silhouette(f), 0); assert(!f.root.querySelector('[data-silhouette]'));
  // Its word retires as the sum starts, and the peak value takes the slot it left.
  f.seek(B0); assert.equal(f.root.querySelector('[data-target-label]').textContent, 'bump');
  f.seek(B1 + 2); assert(!f.root.querySelector('[data-target-label]'), 'the word outstays the first beat');
  const label = (g, sel) => { const n = g.root.querySelector(sel); return n ? [Number(n.getAttribute('x')), Number(n.getAttribute('y'))] : null; };
  f.seek(B0); const wordAt = label(f, '[data-target-label]');
  f.seek(scene.duration); assert.deepEqual(label(f, '[data-peak]'), wordAt, 'the peak takes the word\'s place');
  // Rule 2: it is the same green as the sum, fill-dominant, and the sum is the heavier line.
  assert.match(css, /\.hb-ghost-fill \{ fill: var\(--hb-prediction\); fill-opacity: \.13/);
  assert.match(css, /\.hb-ghost-line \{[^}]*stroke: var\(--hb-prediction\); stroke-width: 1\.8/);
  assert.match(css, /\.hb-sum \{[^}]*stroke-width: 4;/);
});

test('bump: at most two slopes stand at once, each the finite-difference slope of the drawn sum on the piece it is written over', t => {
  const f = fixture(t, NAME);
  const fx = declared(f); f.load(); f.open();
  const edges = [fx.domain[0], ...fx.breaks, fx.domain[1]];
  let frames = 0;
  const shapes = new Set();
  for (const time of times(0.05)) {
    f.seek(time);
    const entries = [...f.root.querySelectorAll('[data-slope]')];
    assert(entries.length <= 2, `${entries.length} slopes stand at ${time}s`);
    shapes.add(entries.map(node => node.dataset.piece).join(','));
    if (!entries.length) { assert(time < B1 + 3.0 + 1e-9, `no slope at ${time}s`); continue; }
    const c = coef(f), published = slopes(f);
    const expected = [0, c[0], c[0] + c[1], c[0] + c[1] + c[2]];
    published.forEach((s, k) => assert(Math.abs(s - expected[k]) < 1e-3, `published slope ${k} at ${time}s`));
    const pts = points(sumPath(f).getAttribute('d')).map(([x, y]) => [unpx(fx, x), unpy(y)]);
    for (const node of entries) {
      const piece = Number(node.dataset.piece);
      // What it says is the slope this suite measures off the drawn green path there.
      const inside = pts.filter(([x]) => x > edges[piece] + 0.06 && x < edges[piece + 1] - 0.06);
      const [x0, y0] = inside[0], [x1, y1] = inside.at(-1);
      const drawn = (y1 - y0) / (x1 - x0);
      assert(Math.abs(drawn - expected[piece]) < 2e-3, `drawn slope on piece ${piece} at ${time}s`);
      assert.equal(node.textContent.replace(/^slope\s*/, ''), signed(expected[piece]), `the entry on piece ${piece} at ${time}s`);
      // And it is written over that piece, within its own span.
      const at = unpx(fx, Number(node.getAttribute('x')));
      assert(at > edges[piece] - 0.7 && at < edges[piece + 1] + 0.7, `the entry for piece ${piece} sits at x = ${at.toFixed(2)}, off its piece, at ${time}s`);
    }
    // Only the first entry carries the grey word, so "slope" is said once.
    assert.equal(entries.filter(node => node.textContent.startsWith('slope')).length, 1, `the word slope is written ${entries.length} times at ${time}s`);
    frames++;
  }
  assert(frames > 500);
  // Written, then retired: +1 alone while the sum climbs, +1 and -1 once it folds, and the
  // single 0 of the flat piece at the payoff -- the two others gone, not ghosted.
  assert.deepEqual([...shapes].sort(), ['', '0', '1', '1,2']);
  f.seek(B1); assert.deepEqual(written(f), []);
  f.seek(B2 - 0.05); assert.deepEqual(written(f), [['1', '+1']]);
  f.seek(B2 + 2.5); assert.deepEqual(written(f), [['1', '+1']], 'the second slope waits for the swing to finish');
  f.seek(B3 - 0.05); assert.deepEqual(written(f), [['1', '+1'], ['2', `${MINUS}1`]]);
  f.seek(B4 - 0.05); assert.deepEqual(written(f), [['0', '0']]);
  f.seek(scene.duration); assert.deepEqual(written(f), [['0', '0']]);
  // The coefficient name on the dashed ramp: bare until the swing has finished, then -2 h2,
  // and never a live fractional value in between.
  f.seek(B1); assert.equal(f.root.querySelector('[data-hinge-label="1"]').textContent, 'h₂'); assert.equal(value(f, 'coef'), null);
  f.seek(B2 + 1.5); assert.equal(value(f, 'coef'), null, 'an intermediate coefficient is written');
  f.seek(B2 + 3.0); assert.equal(f.root.querySelector('[data-hinge-label="1"]').textContent, `${MINUS}2 h₂`);
  for (const time of times(0.05)) { f.seek(time); const v = value(f, 'coef'); assert(v === null || v === signed(fx.coefs[1]), `a coefficient other than -2 is written at ${time}s: ${v}`); }
});

test('bump: the three ramps stand from the first frame, and every other mark waits for its beat', t => {
  const f = fixture(t, NAME);
  const fx = declared(f); f.load(); f.open();
  const W = PLOT.right - PLOT.left;
  // Wave2b rule 2: at t = 0 the picture already states the question -- three climbing ramps,
  // the finished bump beside them -- and nothing is an empty stage.
  f.seek(0);
  assert.equal(f.root.querySelectorAll('[data-hinge]').length, 3, 'the three ramps stand at t = 0');
  assert.equal(f.root.querySelectorAll('[data-hinge-label]').length, 3, 'and are named at t = 0');
  assert(f.root.querySelector('[data-silhouette]') && f.root.querySelector('[data-target-label]'), 'the target stands at t = 0');
  assert(!sumPath(f) && !f.root.querySelector('[data-slope], [data-peak], [data-bracket]'), 'nothing else is written at t = 0');
  assert.deepEqual(drawnNumbers(f), ['0', `${MINUS}1.5`, '0.5', '2.5'], 'the first frame writes zero and the three breakpoints, and no other number');
  // Nothing appears before the beat that owns it, and each ramp keeps its own line style.
  for (const time of times(0.05)) {
    f.seek(time);
    const stage = Number(f.root.dataset.stage);
    assert.equal(Boolean(sumPath(f)), stage >= 1, `the sum at ${time}s`);
    assert.equal(Boolean(f.root.querySelector('[data-peak]')), stage >= 3 && time >= B3 + 0.4 + 2.0 + 1.3, `the peak at ${time}s`);
    assert.equal(Boolean(f.root.querySelector('[data-bracket]')), stage >= 3 && time > B3 + 0.4 + 2.0 + 2.0, `the bracket at ${time}s`);
    assert.equal(f.root.querySelectorAll('[data-hinge]').length, 3, `the ramps at ${time}s`);
  }
  // The sum draws on from the left inside the climb beat, as h1 alone.
  let growing = 0;
  for (const time of times(0.05)) {
    if (time < B1 || time >= B2) continue;
    f.seek(time);
    const width = revealWidth(f, 'hb-reveal-g');
    assert(width !== null, `no sum at ${time}s`);
    if (width < W - 1e-6) growing++;
    assert.deepEqual(coef(f), [fx.coefs[0], 0, 0]);
  }
  assert(growing > 20 && growing < 70, `${growing} frames of drawing on`);
  f.seek(B2); assert.equal(revealWidth(f, 'hb-reveal-g'), W);
  // Each name sits at the foot of its ramp: under the axis, left of the breakpoint, where no
  // curve ever passes.
  f.seek(B1);
  [...f.root.querySelectorAll('[data-hinge-label]')].forEach(node => {
    const k = Number(node.dataset.hingeLabel);
    assert(Math.abs(Number(node.getAttribute('x')) - (px(fx, fx.breaks[k]) - 9)) < 0.02 && Math.abs(Number(node.getAttribute('y')) - (py(0) + 19)) < 0.02, `label ${k} is not at its ramp's foot`);
    assert.equal(node.getAttribute('text-anchor'), 'end');
  });
  // The ramps step back to a ghost at the last beat, and the bump is left alone.
  f.seek(B4 - 0.05); assert.equal(f.root.querySelector('[data-ramps]').getAttribute('opacity'), '1');
  f.seek(B4 + 0.9); const part = Number(f.root.querySelector('[data-ramps]').getAttribute('opacity'));
  assert(part < 1 && part > 0.5, `the ghost eases in, not ${part}`);
  f.seek(scene.duration); assert.equal(f.root.querySelector('[data-ramps]').getAttribute('opacity'), '0.5');
  // The bracket is drawn in its own row, below the tick numerals rather than through them.
  const bracket = f.root.querySelector('[data-bracket]').getAttribute('d');
  assert.match(bracket, new RegExp(`^M${px(fx, fx.breaks[0]).toFixed(2)} \\d+V${PLOT.bracketY}H${px(fx, fx.breaks[2]).toFixed(2)}V`), `the bracket spans the support: ${bracket}`);
  const ticks = [...f.root.querySelectorAll('[data-drawing] text')].filter(node => Number(node.getAttribute('y')) === PLOT.tickY);
  assert.equal(ticks.length, 3, 'the three breakpoints are the only x ticks');
  assert(PLOT.bracketY > PLOT.tickY, 'the bracket row is below the tick row');
});

test('bump: no frame writes more than eight numbers on the picture', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const perBeat = new Map();
  let worst = 0;
  for (const time of times(0.05)) {
    f.seek(time);
    const written = drawnNumbers(f);
    worst = Math.max(worst, written.length);
    assert(written.length <= NUMBER_BUDGET, `${written.length} numbers on the picture at ${time}s: ${written.join(' ')}`);
    const stage = Number(f.root.dataset.stage);
    perBeat.set(stage, Math.max(perBeat.get(stage) || 0, written.length));
  }
  // Written per beat, so a regression that banks a row of numbers again shows up as a number.
  assert.deepEqual([...perBeat.entries()].sort((a, b) => a[0] - b[0]), [[0, 4], [1, 5], [2, 7], [3, 7], [4, 7]]);
  assert.equal(worst, 7);
});

test('bump: the intro is within forty words and every caption within fourteen', t => {
  const f = fixture(t, NAME);
  const intro = words(f.$('.mechanism-intro').textContent);
  assert(intro > 0 && intro <= INTRO_WORDS, `the intro is ${intro} words`);
  // The prose that may stay long is prose below the pane, not the picture's own text.
  assert(words(f.$('.mechanism-boundary').textContent) > INTRO_WORDS, 'the honest qualifiers live in the boundary paragraph');
  f.load(); f.open();
  const seen = new Set();
  for (const time of times(0.05)) {
    f.seek(time);
    const text = caption(f).textContent.trim();
    assert(words(text) <= CAPTION_WORDS, `caption at ${time}s has ${words(text)} words: "${text}"`);
    seen.add(text);
  }
  assert.equal(seen.size, scene.beats.length, 'one caption per beat, and no other');
});

test('bump: reduced motion holds every coefficient, the ramp scale and the target at exactly one value per beat', t => {
  const f = fixture(t, NAME, {reduced: true});
  const fx = declared(f); f.load(); f.open();
  const byStage = new Map();
  for (let i = 0; i <= 20 * scene.duration; i++) {
    f.seek(i / 20);
    const stage = Number(f.root.dataset.stage);
    if (!byStage.has(stage)) byStage.set(stage, new Set());
    byStage.get(stage).add(`${f.root.dataset.coef}|${f.root.dataset.ramp2}|${f.root.dataset.silhouette}`);
    assert.equal(f.root.dataset.moving, 'false', `reduced motion is moving at ${i / 20}s`);
  }
  for (const [stage, set] of byStage) assert.equal(set.size, 1, `reduced motion moves inside beat ${stage}: ${[...set].join(' | ')}`);
  const states = [...byStage.keys()].sort((a, b) => a - b).map(stage => [...byStage.get(stage)][0]);
  const c = list => list.map(v => v.toFixed(4)).join(' ');
  assert.equal(states.length, 5, 'reduced motion holds exactly five pictures');
  assert.deepEqual(states, [
    `${c([0, 0, 0])}|1.0000|1.0000`,
    `${c([fx.coefs[0], 0, 0])}|1.0000|1.0000`,
    `${c([fx.coefs[0], fx.coefs[1], 0])}|${fx.coefs[1].toFixed(4)}|1.0000`,
    `${c(fx.coefs)}|${fx.coefs[1].toFixed(4)}|0.0000`,
    `${c(fx.coefs)}|${fx.coefs[1].toFixed(4)}|0.0000`
  ]);
  // Each beat is its end state: every ramp complete, the slope written, the tag up.
  f.seek(B0); assert.equal(f.root.querySelectorAll('[data-hinge-label]').length, 3); assert(!sumPath(f));
  f.seek(B1); assert.deepEqual(written(f), [['1', '+1']]);
  f.seek(B2); assert.deepEqual(written(f), [['1', '+1'], ['2', `${MINUS}1`]]);
  f.seek(B3); assert.equal(f.root.querySelector('[data-peak]').getAttribute('opacity'), '1');
  f.seek(B4); assert.equal(f.root.querySelector('[data-ramps]').getAttribute('opacity'), '0.5');
  // Unreduced, the same beats are continuous -- so this is a reduced-motion behaviour, not
  // the scene quietly losing its animation.
  const sliding = fixture(t, NAME); sliding.load(); sliding.open();
  const between = new Set();
  for (let i = 20 * B2; i <= 20 * B3; i++) { sliding.seek(i / 20); between.add(ramp2(sliding)); }
  assert(between.size > 30 && [...between].some(m => m > -1.5 && m < 0.5), 'the unreduced swing must pass between +1 and -2');
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
    'show-formula': [false, false, true, true, true],
    'wash-coef': [false, false, true, false, false]
  };
  scene.beats.forEach((beat, index) => {
    f.seek(beat);
    for (const [name, row] of Object.entries(table)) assert.equal(has(name), row[index], `${name} at ${beat}s`);
  });
  f.seek(B3 - 0.05); assert(has('wash-coef')); f.seek(B3); assert(!has('wash-coef')); assert(has('show-formula'));
  // Every class the player sets has a rule, so toggling it changes something.
  const rule = pattern => assert.match(css, pattern, `player.css lacks ${pattern}`);
  rule(/\.mechanism-excerpt\[data-ready\]:not\(\.show-formula\) \.hb-formula \{ visibility: hidden/);
  rule(/\.mechanism-excerpt\.wash-coef \.hb-coef \{ background: rgba\(35, 45, 75, \.14\)/);
  rule(/\.hb-hinge-1 \{ stroke-dasharray: 10 6/); rule(/\.hb-hinge-2 \{ stroke-dasharray: 4 6/);
  // Colour = meaning: green is the book's \predictionpart, blue its \featurepart, the hinges
  // are ink. No orange, purple or wine appears in this scene's stylesheet.
  rule(/--hb-prediction: #2f855a/); rule(/--hb-input: #2b6cb0/); rule(/--hb-ink: #232d4b/);
  rule(/#hinge-bump-excerpt \.prediction-role \{ color: var\(--hb-prediction\)/);
  rule(/#hinge-bump-excerpt \.hinge-role \{ color: var\(--hb-ink\)/);
  for (const foreign of ['#c05621', '#C05621', '#B45309', '#805ad5', '#7950b8', '#722f37', '#722F37', '#9b2c4c']) assert(!css.includes(foreign), `${foreign} in player.css`);
  rule(/\.hb-sum \{[^}]*stroke: var\(--hb-prediction\)/); rule(/\.hb-hinge \{[^}]*stroke: var\(--hb-ink\)/);
  rule(/\.hb-peak \{[^}]*fill: var\(--hb-prediction\)/); rule(/\.hb-bracket \{[^}]*stroke: var\(--hb-prediction\)/);
});

test('bump: the two formulas are TeX in eq- wrappers with the book\'s macros, and playback never rewrites them', t => {
  const f = fixture(t, NAME);
  const ids = [1, 2].map(n => `eq-hinge-bump-${n}`);
  for (const id of ids) {
    const span = f.d.getElementById(id);
    assert(span, `${id} missing`);
    assert.match(span.textContent.trim(), /^\\\([\s\S]+\\\)$/, `${id} is not \\( … \\)`);
  }
  const line = tex(f, 1);
  assert(line.includes('\\predictionpart{g}(\\featurepart{x})'), 'the sum is \\predictionpart and its argument \\featurepart');
  assert(line.includes('h_1 \\: \\class{hb-coef}{-2} h_2 + h_3'), 'the coefficient -2 is the toggled part of the chapter\'s identity');
  assert(tex(f, 2).includes('\\featurepart{x}'));
  const all = ids.map(id => f.d.getElementById(id).textContent).join('\n');
  assert.deepEqual(all.match(/\d/g), ['1', '2', '2', '3'], 'the only digits in a formula are the identity\'s own subscripts and coefficient');
  for (const foreign of ['\\parameterpart', '\\targetpart', '\\residualpart']) assert(!all.includes(foreign), `${foreign} in a formula of a scene with no such quantity`);
  f.load(); f.open();
  const sources = ids.map(id => f.d.getElementById(id).textContent);
  for (const time of times(0.05)) {
    f.seek(time);
    ids.forEach((id, n) => assert.equal(f.d.getElementById(id).textContent, sources[n], `${id} rewritten at ${time}s`));
    assert.equal(f.root.querySelectorAll('span[id^="eq-"]').length, 2);
  }
});

test('bump: captions are plain prose within the budget, coloured by meaning, and the pane carries no chrome', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  assert.equal(f.root.querySelectorAll('.mechanism-stages').length, 0, 'no stage strip');
  assert.equal(f.root.querySelectorAll('[data-pane] dl, [data-pane] table, [data-pane] section').length, 0, 'no cards, no tables');
  const seenRoles = new Set();
  for (const time of times(0.05)) {
    f.seek(time);
    const html = caption(f).innerHTML, text = caption(f).textContent.trim();
    assert.doesNotMatch(html, /<sup|<sub|\^|\bmax_|\bexp\(|relu\(/i, `pseudo-math in the caption at ${time}s: ${html}`);
    assert.doesNotMatch(text, /\[/, `interval notation in a caption at ${time}s: the bracket on the picture says it`);
    for (const role of ['prediction-role', 'hinge-role']) if (html.includes(`class="${role}"`)) seenRoles.add(role);
    assert.doesNotMatch(f.$('[data-pane]').textContent, /beat \d/i, `stage chrome in the pane at ${time}s`);
  }
  assert.deepEqual([...seenRoles].sort(), ['hinge-role', 'prediction-role'],
    'the caption words sum / bump / ramp carry the picture\'s colours');
  // The numbers a caption states are the ones the picture has written.
  f.seek(B0); assert.match(caption(f).textContent, /^Three ramps that only climb\. How do they make this bump\?$/);
  f.seek(B1); assert.match(caption(f).textContent, /flat, then climbing at \+1\./);
  f.seek(B2); assert.match(caption(f).textContent, /joins at −2: past 0\.5 the sum falls at −1\./);
  f.seek(B3); assert.match(caption(f).textContent, /cancels the fall\. The sum is flat at zero\./);
  f.seek(B4); assert.match(caption(f).textContent, /^Three endless ramps, one local bump: nothing outside the window\.$/);
  // The scrubber's own wording never repeats the caption.
  const range = f.$('[data-controls] input[type=range]');
  f.seek(B2); assert.match(range.getAttribute('aria-valuetext'), /Fold\. Coefficients \+1, 0, 0\.$/);
  f.seek(scene.duration); assert.match(range.getAttribute('aria-valuetext'), /Hold\. Coefficients \+1, −2, \+1\.$/);
  assert.doesNotMatch(range.getAttribute('aria-valuetext'), /endless|window/, 'the scrubber repeats the caption');
});

test('bump: the static fallback prints the final frame with every witness value', t => {
  const f = fixture(t, NAME);
  const fx = declared(f);
  // Read before any script runs: the script-free panel is already the whole witness.
  assert.deepEqual(written(f), [['0', '0']]);
  assert.equal(value(f, 'peak'), String(bump(fx, fx.breaks[1]))); assert.equal(value(f, 'peak'), '2');
  assert.equal(value(f, 'coef'), signed(fx.coefs[1]));
  assert(f.root.querySelector('[data-bracket]') && f.root.querySelector('[data-mark="sum"]') && f.root.querySelectorAll('[data-hinge]').length === 3);
  assert(!f.root.querySelector('[data-silhouette]'), 'the target has been consumed by the final frame');
  // The sentence the bare numeral stands for is in the title and the description, so a
  // script-free reader is still told what 2 is the value of.
  assert.match(f.$('svg title').textContent, /peak g\(0\.5\) = 2 is written at the apex/);
  assert.match(f.$('svg').getAttribute('aria-label'), /Peak g\(0\.5\) = 2\./);
  assert.match(f.$('svg').getAttribute('aria-label'), /nonzero only on \[−1\.5, 2\.5\]/);
  assert(!drawing(f).includes('·'), 'the final frame withholds nothing');
  assert.match(f.root.className, /\bstage-4\b/); assert.match(f.root.className, /\bshow-formula\b/); assert.doesNotMatch(f.root.className, /\bwash-coef\b/);
});

test('bump: no-script readouts are exactly the readouts at the end of the timeline', t => {
  const f = fixture(t, NAME);
  const readouts = () => [
    canonicalMarkup(drawing(f)), caption(f).innerHTML,
    [...classes(f)].sort().join(' '),
    f.$('.hb-figure svg').getAttribute('viewBox'), f.$('.hb-figure svg').getAttribute('aria-label'),
    f.$('.hb-figure svg title').textContent,
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
    box.querySelectorAll('[data-controls]').forEach(node => node.remove());
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

test('bump: below 600 px the same picture reflows into a smaller plot with nothing outside the viewBox', t => {
  const wide = fixture(t, NAME); wide.load(); wide.open(); wide.seek(scene.duration);
  assert.equal(wide.$('svg').getAttribute('viewBox'), PLOT.viewBox);
  assert(!classes(wide).has('is-stacked'));
  const fx = declared(fixture(t, NAME));
  const narrow = fixture(t, NAME, {width: NARROW}); narrow.load(); narrow.open(); narrow.seek(scene.duration);
  assert.equal(narrow.$('svg').getAttribute('viewBox'), NARROW_PLOT.viewBox);
  assert(classes(narrow).has('is-stacked'));
  // Same marks, same numbers: only the geometry moved.
  assert.deepEqual(texts(narrow, '[data-value]'), texts(wide, '[data-value]'));
  assert.deepEqual(drawnNumbers(narrow), drawnNumbers(wide));
  assert.equal(narrow.root.querySelectorAll('[data-hinge]').length, 3);
  const tags = f => [...f.root.querySelectorAll('foreignObject')].map(node => `${node.getAttribute('x')},${node.getAttribute('y')}`);
  assert.notDeepEqual(tags(narrow), tags(wide), 'the typeset axis tag moves with the axis');
  // Every label and every sample inside the narrow viewBox; the sum still on the declared
  // bump in the narrow geometry; the tag inside the picture; the bracket still below the ticks.
  for (const node of narrow.root.querySelectorAll('[data-drawing] text')) {
    const x = Number(node.getAttribute('x')), y = Number(node.getAttribute('y'));
    assert(x >= 0 && x <= NARROW_PLOT.width && y >= 0 && y <= NARROW_PLOT.height, `a label leaves the narrow viewBox: ${node.textContent} at ${x},${y}`);
  }
  for (const [x, y] of points(sumPath(narrow).getAttribute('d'))) {
    assert(x >= NARROW_PLOT.left - 1e-6 && x <= NARROW_PLOT.right + 1e-6, 'a sample leaves the narrow plot');
    assert(Math.abs(y - py(bump(fx, unpx(fx, x, NARROW_PLOT)), NARROW_PLOT)) < 0.02, 'the narrow sum is not the bump');
  }
  const bracketY = Number(/V(\d+(?:\.\d+)?)H/.exec(narrow.root.querySelector('[data-bracket]').getAttribute('d'))[1]);
  const tickRow = Math.max(...[...narrow.root.querySelectorAll('[data-drawing] text')].map(node => Number(node.getAttribute('y'))));
  assert(bracketY > tickRow, 'the narrow bracket is below the narrow tick row');
  assert(bracketY <= NARROW_PLOT.height, 'the narrow bracket is inside the viewBox');
  const tag = narrow.root.querySelector('foreignObject[data-tag="x"]');
  assert(Number(tag.getAttribute('x')) + Number(tag.getAttribute('width')) <= NARROW_PLOT.width);
  // A resize flips the mode in place, without restarting anything.
  wide.resize(NARROW);
  assert.equal(wide.$('svg').getAttribute('viewBox'), NARROW_PLOT.viewBox); assert(classes(wide).has('is-stacked'));
  wide.resize(WIDE);
  assert.equal(wide.$('svg').getAttribute('viewBox'), PLOT.viewBox); assert(!classes(wide).has('is-stacked'));
  assert(!wide.playing);
});

test('bump: the panel is the only fixture copy -- moving it moves every number', t => {
  const f = fixture(t, NAME);
  // Not a manuscript edit: this proves the player reads the declared attributes, so a real
  // chapter change could not leave a stale number behind in the scene script or the SVG.
  // Breakpoints -1, 1, 3 with coefficients 2, -4, 2: a bump twice as high, peaking at 1.
  f.root.dataset.breaks = '-1 1 3'; f.root.dataset.coefs = '2 -4 2';
  f.load(); f.open();
  f.seek(scene.duration);
  assert.deepEqual(written(f), [['0', '0']]);
  assert.equal(f.root.querySelector('[data-peak]').textContent, '4');
  assert.equal(f.root.querySelector('[data-hinge-label="1"]').textContent, `${MINUS}4 h₂`);
  assert.match(f.$('svg').getAttribute('aria-label'), /Peak g\(1\) = 4\./);
  assert.match(f.$('svg').getAttribute('aria-label'), /nonzero only on \[−1, 3\]/);
  f.seek(B1); assert.match(caption(f).textContent, /flat, then climbing at \+2\./);
  f.seek(B2); assert.match(caption(f).textContent, /joins at −4: past 1 the sum falls at −2\./);
  f.seek(scene.duration);
  const pane = f.$('[data-pane]').cloneNode(true);
  pane.querySelectorAll('span[id^="eq-"]').forEach(node => node.remove());
  for (const stale of ['0.5', '2.5', `${MINUS}1.5`, '2']) assert(![...pane.querySelectorAll('[data-drawing] text')].some(node => node.textContent === stale), `${stale} survived a moved fixture`);
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
