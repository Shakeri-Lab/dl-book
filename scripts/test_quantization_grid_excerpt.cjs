#!/usr/bin/env node
// Test-only JSDOM. No dependency from this file enters the published book.
// The JSDOM fixture, the markup canonicaliser, and the transport, beat-hold and grammar
// suites this scene inherits live in scripts/html-tests/excerpt-harness.cjs. What stays
// here is the part no harness can supply: this scene's arithmetic -- symmetric quantization
// of the chapter's eight values at every declared bit width, recomputed here and never
// through the player -- the claims the chapter's fixture makes (|error| <= s/2, seven
// levels, the two collisions the figure draws), the shape of its one picture, its typeset
// formula, the class toggles the player applies, and the ONE parameter control: a bit-width
// slider the timeline lifts 3 -> 8 and drops back, and the reader may set afterwards.
// JSDOM never typesets, so the formula assertions read the TeX source, the eq- id, the
// \class{} names and the root classes, never rendered math.
//
// The scene was restaged on 2026-09-11 (docs/wave2-excerpts.md, "Revision"): seven beats
// became five, the collision is on screen at t = 0 and the open grid is the payoff, and the
// picture is held to a per-beat numeral budget. Every arithmetic assertion below is the one
// the seven-beat build carried; only the markup-shape and beat assertions were rewritten.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {read, manifest, entry, chapterSource, numbers, close, canonicalMarkup, drawnMarkup,
  fixture, registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'quantization-grid-excerpt';
const scene = entry(NAME);
// The harness lays nothing out, so the figure's width is declared: the wide layout, which is
// the one the static frame is drawn in and the one that separates 255 ticks into a comb; and
// the narrow layout, where the same grid cannot be separated and is drawn as a band.
const WIDE = 780, NARROW = 360;
// The wide picture's geometry, stated here from the picture's own design (player.js
// LAYOUT.wide) so every drawn coordinate is checked against numbers this suite owns.
const G = {left: 50, right: 810, lineY: 70, labelY: 24, ghostR: 4.5, dotR: 7, lift: 15, stackMax: 24,
  tickH: 16, basinPad: 4, bracketY: 32, bracketLeg: 9, bracketLabelY: 22, tickLabelY: 102, laneY: 116, laneGap: 9,
  errorGap: 14, statsGap: 20, payloadGap: 18, ringPad: 4, tieMin: 4, viewBox: '0 0 860 176'};
const NG = {left: 28, right: 332, lineY: 66, labelY: 22, ghostR: 3.5, dotR: 5, lift: 11, stackMax: 16,
  tickH: 12, basinPad: 3, bracketY: 30, bracketLeg: 7, bracketLabelY: 20, tickLabelY: 94, laneY: 106, laneGap: 8,
  errorGap: 12, statsGap: 23, payloadGap: 16, ringPad: 4, tieMin: 3, viewBox: '0 0 360 166',
  width: 360, height: 166};
// Two drawing rules this suite restates rather than reads from the player. A stack of dots
// sharing one tick may not grow past `stackMax` units, so it never reaches the bound bracket
// above the line. And the two rows under the line sit below however many lanes the error bars
// WOULD need -- not below the lanes drawn at this instant -- so no word is ever written
// through a bar and neither row moves while a bar is revealed or retired.
const rankOf = q => q.codes.map((c, i) => q.codes.slice(0, i).filter(x => x === c).length);
const liftOf = (q, g = G) => {
  const tall = Math.max(...rankOf(q));
  return tall ? Math.min(g.lift, g.stackMax / tall) : g.lift;
};
function rowsOf(q, g = G) {
  const rank = rankOf(q);
  const moved = q.errors.map(e => e > 1e-12);
  const used = moved.some(Boolean) ? Math.max(...rank.filter((_, i) => moved[i])) + 1 : 0;
  const laneBottom = used ? g.laneY + (used - 1) * g.laneGap + 4 : g.tickLabelY + 6;
  const statsY = laneBottom + g.statsGap;
  return {rank, moved, used, laneBottom, statsY, payloadY: statsY + g.payloadGap};
}
const MINUS = '−';

// Read the declared fixture from the closed panel. The panel is the one in-repo mirror of
// the manuscript's numbers; everything below is computed from it, so no chapter value is
// typed here a second time.
function declared(f) {
  assert(!f.root.dataset.ready, 'read the declared fixture before the player mounts');
  const d = f.root.dataset;
  return {values: numbers(d.values), grid: numbers(d.grid), bits: numbers(d.bitChoices), timeline: numbers(d.timelineBits), n: Number(d.payloadValues)};
}

// This suite's own quantizer, deliberately not the player's: @eq-symmetric-quantization,
// Q = 2^(b-1) - 1, s = max|W| / Q, q = clip(round(W/s), -Q, Q), W-hat = s q. The rounding is
// half-UP here where the chapter's np.round is half-to-even; a test asserts no value of
// the fixture sits on a half at any declared b, so the two agree on this fixture.
const halfUp = x => Math.floor(x + 0.5);
function quant(fx, b) {
  const Q = 2 ** (b - 1) - 1, maxabs = Math.max(...fx.values.map(Math.abs)), s = maxabs / Q;
  const codes = fx.values.map(w => Math.min(Q, Math.max(-Q, halfUp(w / s))));
  const recon = codes.map(q => q * s);
  const errors = fx.values.map((w, i) => Math.abs(w - recon[i]));
  const groups = new Map();
  codes.forEach((q, i) => groups.set(q, [...(groups.get(q) || []), i]));
  const collisions = [...groups].filter(([, idx]) => idx.length > 1).map(([code, indices]) => ({code, indices}));
  return {b, Q, s, values: fx.values, codes, recon, errors, collisions, maxError: Math.max(...errors), bound: s / 2,
    ticks: 2 * Q + 1, unchanged: errors.map((e, i) => (e === 0 ? i : -1)).filter(i => i >= 0), payloadGB: fx.n * b / 8 / 1e9};
}
const px = (w, g = G) => g.left + (w + 1) / 2 * (g.right - g.left);
const fmt = (g, v) => { const t = Math.abs(v).toFixed(g.s < 0.01 ? 4 : 3); return v < 0 && Number(t) !== 0 ? `${MINUS}${t}` : t; };
const two = v => { const t = Math.abs(v).toFixed(2); return v < 0 && Number(t) !== 0 ? `${MINUS}${t}` : t; };
// A reconstruction in words: up to three decimals, trailing zeros dropped (0, −0.667, 0.333).
const tick3 = v => { const n = Number(v.toFixed(3)); return `${n < 0 ? MINUS : ''}${Math.abs(n)}`; };
const plain = v => String(Number(v.toFixed(4)));
const attr = (node, name) => Number(node.getAttribute(name));
const dots = f => [...f.root.querySelectorAll('[data-mark="dot"]')];
const bars = f => [...f.root.querySelectorAll('[data-error]')];
const ghosts = f => [...f.root.querySelectorAll('[data-ghost]')];
const rings = f => [...f.root.querySelectorAll('[data-ring]')];
const sockets = f => [...f.root.querySelectorAll('[data-socket]')];
const ties = f => [...f.root.querySelectorAll('[data-tie]')];
const labels = f => [...f.root.querySelectorAll('text[data-w]')];
const tickLabels = f => [...f.root.querySelectorAll('[data-grid="live"] [data-tick]')];
const gridOf = f => f.root.querySelector('[data-grid="live"]');
const value = (f, name) => { const node = f.root.querySelector(`[data-value="${name}"]`); return node ? node.textContent : null; };
const slider = f => f.$('[data-bits-slider]');
const drag = (f, index) => { slider(f).value = String(index); slider(f).dispatchEvent(new f.w.Event('input', {bubbles: true})); };
const caption = f => f.$('[data-caption]');
const tex = f => f.d.getElementById('eq-quantization-grid-1').textContent;
const classes = f => new Set([...f.root.classList]);
const mixOf = f => Number(f.root.dataset.mix);
const words = text => text.trim().split(/\s+/).filter(Boolean);
const times = (step = 0.05) => {
  const out = [];
  for (let t = 0; t <= scene.duration + 1e-9; t += step) out.push(Number(t.toFixed(4)));
  return out;
};
const css = read(`${scene.scene}/player.css`);
const [B0, B1, B2, B3, B4] = scene.beats;
// The choreography this suite probes (player.js T). Everything else inside a beat is the
// player's business; these are the instants the assertions below name.
const RETIRED = B3 + 0.6, OPEN_AT = B3 + 0.3, SPLIT = [B3 + 1.5, B3 + 4.0], RELIT = B3 + 4.6;
const BACK_AT = B4 + 0.3, MERGE = [B4 + 0.6, B4 + 2.4], PAID = B4 + 4.0;

registerTransportTests(NAME, {
  witness: /payload = 0\.375 GB per billion weights, against 1 GB at eight bits/,
  anchors: ['quantization-grid-playback-help'],
  width: WIDE
});
// One drawn state per whole beat under reduced motion: the dots must never be caught
// between the two grids.
registerBeatHoldTest(NAME);
// One picture, one formula line, one caption; TeX never rewritten; one guarded typeset.
// The author's Wave-2 revision tightens the caption budget from the grammar's twenty words
// to fourteen for this scene (wave2b brief, rule 4).
registerGrammarTests(NAME, {words: 14});

test('quant: the declared attributes reproduce the chapter literals they mirror', t => {
  const f = fixture(t, NAME);
  const fx = declared(f);
  const chapter = chapterSource(NAME);
  // Not a second copy of the fixture: the panel's attributes are rendered back into the
  // chapter's own source text, so a drift in either direction fails here as well as in
  // scripts/audit_excerpt_fixtures.py.
  assert(chapter.includes(`grid = np.arange(${fx.grid[0]}, ${fx.grid[1]}) / ${fx.grid[2]}`), 'the declared grid does not spell the chapter\'s arange');
  assert(chapter.includes(`values = np.array([${f.root.dataset.values.trim().split(/\s+/).join(', ')}])`), 'the declared values do not spell the chapter\'s array');
  assert.deepEqual(fx.values, [-1, -0.79, -0.54, -0.11, 0.08, 0.31, 0.72, 1]);
  assert.deepEqual(fx.grid, [-3, 4, 3]); assert.deepEqual(fx.bits, [2, 3, 4, 8]); assert.deepEqual(fx.timeline, [8, 3]); assert.equal(fx.n, 1e9);
  // The rule is the chapter's equation, and the bound its sentence.
  assert(chapter.includes('Q=2^{b-1}-1,'), 'Q = 2^(b-1) - 1 is the chapter\'s');
  assert(chapter.includes('s=\\frac{\\max_{ij}|W_{ij}|}{Q}.'), 's = max|W| / Q is the chapter\'s');
  assert(chapter.includes('\\operatorname{round}(W_{ij}/s),-Q,Q'), 'round(W/s) clipped to +-Q is the chapter\'s');
  assert(chapter.includes('$|W_{ij}-\\widehat W_{ij}|\\le s/2$'), '|error| <= s/2 is the chapter\'s sentence');
  assert(chapter.includes('{#eq-symmetric-quantization}') && chapter.includes('{#eq-quant-payload}'));
  // The chapter's grid IS the rule at b = 3: codes -3..3 over Q = 3, s = 1 / 3 because max|values| = 1.
  const q3 = quant(fx, fx.timeline[1]);
  assert.equal(q3.Q, fx.grid[1] - 1); assert.equal(q3.Q, -fx.grid[0]); assert.equal(q3.Q, fx.grid[2]);
  assert.equal(Math.max(...fx.values.map(Math.abs)), 1);
  close(q3.s, 1 / fx.grid[2]);
  // The chapter draws the 3-bit case as "seven levels" and prints none of its numbers.
  assert(chapter.includes('A 3-bit symmetric example (left) rounds real values to seven levels.'));
  for (const printed of ['0.667', '0.1267', '0.127', '0.375 GB']) assert(!chapter.includes(printed), `${printed} is a computed variant, so the chapter must not print it`);
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal), `literal missing: ${literal.slice(0, 40)}`);
  const variants = scene.fixture.computedVariants;
  assert(variants.some(v => /8-bit grid/.test(v)) && variants.some(v => /b = 2 .* b = 4/.test(v)),
    'the 8-bit grid and the b = 2, 4 grids are declared computed variants');
  // The restaging added two drawing devices to the picture; a drawing device that is not
  // declared is a mark the reader cannot trace.
  assert(variants.some(v => /EMPTY SOCKET/.test(v) && /TIE/.test(v)), 'the empty socket and its ties are declared drawing devices');
  assert(variants.some(v => /comb of 255 ticks or as a band/.test(v)), 'the comb-or-band grid is a declared drawing device');
  // The beat surface moves in one piece: the manifest and the panel say the same thing.
  assert.deepEqual(scene.beats, [0, 8, 15, 22, 31]); assert.equal(scene.duration, 40);
  assert.equal(f.$('[data-pane]').dataset.beats, scene.beats.join(' '));
  assert.equal(Number(f.$('[data-pane]').dataset.duration), scene.duration);
});

test('quant: recomputed at b = 2, 3, 4, 8 the rule keeps every |error| <= s/2, and at 3 bits it gives the seven-level picture the chapter draws', t => {
  const f = fixture(t, NAME);
  const fx = declared(f);
  for (const b of fx.bits) {
    const q = quant(fx, b);
    assert.equal(q.Q, [1, 3, 7, 127][fx.bits.indexOf(b)]);
    assert.equal(q.ticks, 2 * q.Q + 1);
    // No fixture value sits on a rounding half at this b, so half-up and np.round agree.
    for (const w of fx.values) assert.notEqual(Math.abs((w / q.s) % 1), 0.5, `${w} / s is a half at b = ${b}`);
    // The bound the chapter states, value by value; every code inside the range, so the clip
    // never acts (the maximum is used for calibration).
    q.errors.forEach((e, i) => assert(e <= q.bound + 1e-12, `|error| ${e} > s/2 ${q.bound} at b = ${b}, value ${fx.values[i]}`));
    q.codes.forEach(c => assert(Math.abs(c) <= q.Q));
    assert(q.maxError <= q.bound);
    // The extremes set s, so they are reconstructed exactly at every b.
    assert.deepEqual(q.unchanged.filter(i => Math.abs(fx.values[i]) === 1), [0, 7]);
  }
  // b = 3: the chapter's own `rounded = np.clip(np.round(values * 3), -3, 3) / 3`, computed
  // both ways -- the literal's form and the equation's form -- and equal.
  const q3 = quant(fx, 3);
  const literal = fx.values.map(w => Math.min(3, Math.max(-3, halfUp(w * 3))) / 3);
  q3.recon.forEach((r, i) => close(r, literal[i]));
  q3.recon.forEach((r, i) => close(r, [-1, -2 / 3, -2 / 3, 0, 0, 1 / 3, 2 / 3, 1][i]));
  assert.deepEqual(q3.codes, [-3, -2, -2, 0, 0, 1, 2, 3]);
  assert.deepEqual(q3.collisions, [{code: -2, indices: [1, 2]}, {code: 0, indices: [3, 4]}]);
  close(q3.maxError, 2 / 3 - 0.54); assert.equal(q3.maxError.toFixed(4), '0.1267'); assert.equal(q3.bound.toFixed(4), '0.1667');
  assert(q3.maxError < q3.bound);
  assert.deepEqual(q3.unchanged, [0, 7]);
  assert.deepEqual(q3.errors.map(e => e.toFixed(4)), ['0.0000', '0.1233', '0.1267', '0.1100', '0.0800', '0.0233', '0.0533', '0.0000']);
  // b = 8: the grid the payoff opens to.
  const q8 = quant(fx, 8);
  assert.equal(q8.ticks, 255); assert.equal(q8.s.toFixed(4), '0.0079'); assert(q8.bound < 0.004); assert(q8.maxError < 0.004);
  assert.equal(q8.collisions.length, 0); assert.equal(q8.maxError.toFixed(4), '0.0035');
  // b = 4 and b = 2: the reader's other two stops.
  const q4 = quant(fx, 4), q2 = quant(fx, 2);
  assert.equal(q4.ticks, 15); assert.equal(q4.collisions.length, 0); assert.equal(q4.maxError.toFixed(3), '0.067');
  assert.equal(q2.ticks, 3); assert.deepEqual(q2.collisions.map(c => c.indices.length), [3, 3, 2]); assert.equal(q2.maxError.toFixed(2), '0.46');
  // And the player, at every stop, publishes exactly these.
  f.load(); f.open(); f.seek(scene.duration);
  for (const b of fx.bits) {
    drag(f, fx.bits.indexOf(b));
    const q = quant(fx, b);
    assert.equal(Number(f.root.dataset.b), b); assert.equal(Number(f.root.dataset.q), q.Q); close(Number(f.root.dataset.s), q.s);
    numbers(f.root.dataset.recon).forEach((r, i) => close(r, q.recon[i], 1e-6));
    numbers(f.root.dataset.errors).forEach((e, i) => close(e, q.errors[i], 1e-6));
    close(Number(f.root.dataset.maxError), q.maxError); close(Number(f.root.dataset.bound), q.bound);
    assert.deepEqual(JSON.parse(f.root.dataset.collisions), q.collisions);
  }
});

test('quant: at every scrubbed time each dot sits between its 3-bit tick and its 8-bit tick by the published mix, and the stack rises and falls with it', t => {
  const f = fixture(t, NAME, {width: WIDE}); f.load(); f.open();
  const fx = declared(fixture(t, NAME));
  const q8 = quant(fx, 8), q3 = quant(fx, 3);
  const rank = rankOf(q3), lift = liftOf(q3);
  const mixes = new Set();
  let lastX = null;
  for (const time of times()) {
    f.seek(time);
    const mix = mixOf(f);
    assert(mix >= 0 && mix <= 1, `mix ${mix} at ${time}s`);
    const drawn = dots(f);
    assert.equal(drawn.length, fx.values.length, `eight dots at ${time}s`);
    for (const dot of drawn) {
      const i = Number(dot.dataset.i);
      close(attr(dot, 'cx'), px(q3.recon[i]) + (px(q8.recon[i]) - px(q3.recon[i])) * mix, 0.02, `dot ${i} at ${time}s`);
      close(attr(dot, 'cy'), G.lineY - rank[i] * lift * (1 - mix), 0.02, `dot ${i} lift at ${time}s`);
    }
    // A bar under a moved weight runs from the weight to its dot, in the lane its rank at
    // that tick gives it, so a colliding pair reads as two measurements and not one long bar.
    for (const bar of bars(f)) {
      const i = Number(bar.dataset.error);
      close(attr(bar, 'x1'), px(fx.values[i]), 0.02); assert.equal(attr(bar, 'y1'), attr(bar, 'y2'));
      assert.equal(attr(bar, 'y1'), G.laneY + rank[i] * G.laneGap, `bar ${i} lane at ${time}s`);
      assert.equal(bar.dataset.lane, String(rank[i]));
      assert(q3.errors[i] !== 0, `a bar under an unmoved weight at ${time}s`);
    }
    // A ghost stands only where it would clear its dot: nothing half-swallowed by the mark
    // it belongs to, at any moment of the scene.
    for (const ghost of ghosts(f)) {
      const i = Number(ghost.dataset.ghost);
      assert(Math.abs(attr(drawn[i], 'cx') - px(fx.values[i])) > G.dotR + G.ghostR + 3, `ghost ${i} inside its dot at ${time}s`);
    }
    if (time > SPLIT[0] && time < SPLIT[1]) {
      mixes.add(mix);
      // The upper dot of the left pair leaves its shared tick one way and keeps going.
      const x = attr(drawn[2], 'cx');
      if (lastX !== null) assert(x >= lastX - 1e-9, `the -0.54 dot glides one way at ${time}s`);
      lastX = x;
    }
  }
  assert(mixes.size > 30, `the glide passes through ${mixes.size} positions`);
  // The glide is the film's easeInOutCubic: at its midpoint the dots are halfway.
  f.seek((SPLIT[0] + SPLIT[1]) / 2); close(mixOf(f), 0.5, 1e-3);
});

test('quant: beat 1 is the collision itself -- seven ticks, eight dots, two ringed stacks, and the shared ticks named by what each pair became', t => {
  const f = fixture(t, NAME, {width: WIDE}); f.load(); f.open();
  const fx = declared(fixture(t, NAME));
  const q3 = quant(fx, 3);
  f.seek(B0);
  // Nothing is empty at t = 0: a reader who never presses play has already seen the answer
  // in waiting. Seven ticks, eight dots, two of them stacked.
  const grid = gridOf(f);
  assert.equal(grid.dataset.ticks, '7'); assert.equal(grid.dataset.shape, 'comb');
  const xs = [...grid.querySelector('path.qg-ticks').getAttribute('d').matchAll(/M([\d.]+) /g)].map(m => Number(m[1]));
  assert.equal(xs.length, 7);
  xs.forEach((x, k) => close(x, px((k - 3) / 3), 0.02));
  assert.equal(mixOf(f), 0);
  dots(f).forEach((dot, i) => close(attr(dot, 'cx'), px(q3.recon[i]), 0.02));
  assert.equal(attr(dots(f)[1], 'cy'), G.lineY); assert.equal(attr(dots(f)[2], 'cy'), G.lineY - G.lift);
  assert.equal(attr(dots(f)[3], 'cy'), G.lineY); assert.equal(attr(dots(f)[4], 'cy'), G.lineY - G.lift);
  // The ticks a pair shares are named by the one number that pair became; nothing else on
  // the grid is labelled but the two ends of the ruler.
  assert.deepEqual(tickLabels(f).map(n => [Number(n.dataset.tick), n.textContent]),
    [[-3, `${MINUS}1.00`], [-2, tick3(-2 / 3)], [0, tick3(0)], [3, '1.00']]);
  assert.deepEqual(tickLabels(f).map(n => n.getAttribute('class')),
    ['qg-tick-label', 'qg-tick-label is-collision', 'qg-tick-label is-collision', 'qg-tick-label']);
  tickLabels(f).forEach(n => assert.equal(attr(n, 'y'), G.tickLabelY));
  assert.match(css, /\.qg-tick-label\.is-collision \{ fill: var\(--qg-error\)/);
  // Nothing else has arrived yet: no ghost, no bar, no basin, no bracket, no value written
  // above a dot, no payload.
  assert.equal(bars(f).length, 0); assert.equal(ghosts(f).length, 0); assert.equal(labels(f).length, 0);
  assert.equal(f.root.querySelector('[data-basins]'), null); assert.equal(f.root.querySelector('[data-bracket]'), null);
  assert.equal(f.root.querySelector('[data-payload]'), null); assert.equal(sockets(f).length, 0); assert.equal(ties(f).length, 0);
  // The rings draw themselves in the first beat and then stay.
  assert.equal(rings(f).length, 2); assert.equal(attr(f.root.querySelector('[data-rings]'), 'opacity'), 0);
  f.seek(B0 + 1.4);
  assert.equal(attr(f.root.querySelector('[data-rings]'), 'opacity'), 1);
  assert.deepEqual(rings(f).map(r => [Number(r.dataset.ring), Number(r.dataset.count)]), q3.collisions.map(c => [c.code, c.indices.length]));
  for (const ring of rings(f)) {
    const c = q3.collisions.find(x => x.code === Number(ring.dataset.ring));
    close(attr(ring, 'cx'), px(c.code * q3.s), 0.02);
    close(attr(ring, 'cy'), G.lineY - G.lift / 2, 0.02);
    close(attr(ring, 'r'), G.lift / 2 + G.dotR + G.ringPad, 0.02);
    // The stack, ring and all, stays clear of where the bound bracket will be drawn.
    assert(attr(ring, 'cy') - attr(ring, 'r') > G.bracketY + G.bracketLeg + 1, 'the ring reaches the bracket');
    for (const i of c.indices) {
      const dot = dots(f)[i];
      assert(Math.hypot(attr(dot, 'cx') - attr(ring, 'cx'), attr(dot, 'cy') - attr(ring, 'cy')) + G.dotR <= attr(ring, 'r') + 1e-6);
    }
  }
  // The grid is named once, under the picture, and b nowhere on it: the readout says b.
  assert.equal(value(f, 'ticks'), '7'); assert.equal(value(f, 's'), '0.333');
  assert.equal(f.root.querySelector('[data-stats="grid"]').textContent, '7 ticks · s = 0.333');
  assert.equal(attr(f.root.querySelector('[data-stats="grid"]'), 'y'), rowsOf(q3).statsY);
  assert.equal(f.$('[data-bits-readout]').textContent.replace(/\s+/g, ' '), 'b = 3 bits');
  assert.match(caption(f).textContent, /^Eight weights, seven ticks\. Two pairs already stand on the same tick\.$/);
});

test('quant: beat 2 says where the four collided weights came from, and only those four', t => {
  const f = fixture(t, NAME, {width: WIDE}); f.load(); f.open();
  const fx = declared(fixture(t, NAME));
  const q3 = quant(fx, 3);
  const collider = q3.collisions.flatMap(c => c.indices);
  assert.deepEqual(collider, [1, 2, 3, 4]);
  f.seek(B1 + 2.6);
  // Four values written, above their own ghosts: the only four whose value is evidence for
  // this scene's point. The extremes are already written as the ends of the ruler, and the
  // two weights that move without colliding are not evidence, so neither is written.
  assert.deepEqual(labels(f).map(n => Number(n.dataset.w)), collider);
  assert.deepEqual(labels(f).map(n => n.textContent), collider.map(i => two(fx.values[i])));
  labels(f).forEach(n => { close(attr(n, 'x'), px(fx.values[Number(n.dataset.w)]), 0.02); assert.equal(attr(n, 'y'), G.labelY); });
  // A ghost where each came from, and a wine bar from the ghost to the tick it landed on.
  assert.deepEqual(ghosts(f).map(n => Number(n.dataset.ghost)), collider);
  ghosts(f).forEach(n => { close(attr(n, 'cx'), px(fx.values[Number(n.dataset.ghost)]), 0.02); assert.equal(attr(n, 'cy'), G.lineY); });
  const shown = bars(f).filter(b => attr(b, 'opacity') > 0);
  assert.deepEqual(shown.map(b => Number(b.dataset.error)), collider);
  for (const bar of shown) {
    const i = Number(bar.dataset.error);
    close(Math.abs(attr(bar, 'x2') - attr(bar, 'x1')), Math.abs(px(fx.values[i]) - px(q3.recon[i])), 0.02);
  }
  // Two of the four share a lane and two do not: a colliding pair is two measurements.
  assert.deepEqual(shown.map(b => b.dataset.lane), ['0', '1', '0', '1']);
  // The bound has not been claimed yet, and nothing from a later beat is on the picture.
  assert.equal(f.root.querySelector('[data-basins]'), null); assert.equal(f.root.querySelector('[data-bracket]'), null);
  assert.equal(f.root.querySelector('[data-longest]'), null); assert.equal(f.root.querySelector('[data-payload]'), null);
  assert.match(caption(f).textContent, /^They came from four different weights\. The grid rounded each to its nearest tick\.$/);
  assert.match(f.$('[data-figure] svg').getAttribute('aria-label'), /^Origins\./);
});

test('quant: beat 3 washes each tick\'s basin, brackets s/2 from a tick the dots left free, writes the longest move under its own bar, and retires all three when the beat ends', t => {
  const f = fixture(t, NAME, {width: WIDE}); f.load(); f.open();
  const fx = declared(fixture(t, NAME));
  const q3 = quant(fx, 3);
  f.seek(B2 - 0.01); assert.equal(f.root.querySelector('[data-basins]'), null); assert.equal(f.root.querySelector('[data-bracket]'), null);
  f.seek(B2); assert(f.root.querySelector('[data-basins]') && f.root.querySelector('[data-bracket]'), 'present from the first instant of the beat');
  assert.equal(attr(f.root.querySelector('[data-basins]'), 'opacity'), 0);
  f.seek(B2 + 2.2);
  const basins = [...f.root.querySelectorAll('.qg-basin')];
  assert.equal(basins.length, 7);
  // Contiguous, alternating, covering exactly the range of the values.
  close(attr(basins[0], 'x'), px(-1), 0.02);
  basins.forEach((r, k) => {
    if (k) close(attr(r, 'x'), attr(basins[k - 1], 'x') + attr(basins[k - 1], 'width'), 0.03);
    assert.equal(r.classList.contains('is-odd'), k % 2 === 1);
    const lo = Math.max(-1, (k - 3 - 0.5) * q3.s), hi = Math.min(1, (k - 3 + 0.5) * q3.s);
    close(attr(r, 'width'), px(hi) - px(lo), 0.03);
    assert.equal(attr(r, 'y'), G.lineY - G.tickH - G.basinPad); assert.equal(attr(r, 'height'), 2 * (G.tickH + G.basinPad));
  });
  close(attr(basins[6], 'x') + attr(basins[6], 'width'), px(1), 0.03);
  // Every weight sits inside the basin of the tick it landed on: the bound, drawn.
  fx.values.forEach((w, i) => assert(Math.abs(w - q3.recon[i]) <= q3.bound + 1e-12, `value ${i} outside its basin`));
  // The bracket is drawn at the one tick the dots left free -- -0.333 -- so the span the
  // reader measures crosses no mark of its own, and it runs inward from there.
  assert.equal(q3.codes.filter(c => c === -1).length, 0, 'the -0.333 tick is the one no weight lands on');
  const bracket = f.root.querySelector('[data-bracket]');
  assert.equal(Number(bracket.dataset.tick), -1); assert.equal(bracket.dataset.span, 'bracket');
  const lo = px(-q3.s), hi = px(-q3.s + q3.bound);
  assert.match(bracket.querySelector('.qg-bracket').getAttribute('d'),
    new RegExp(`^M${lo.toFixed(2)} ${G.bracketY + G.bracketLeg}V${G.bracketY}H${hi.toFixed(2)}V${G.bracketY + G.bracketLeg}$`));
  assert.equal(value(f, 'bound'), '0.167');
  assert.equal(f.root.querySelector('.qg-bracket-label').textContent, 's/2 = 0.167');
  close(attr(f.root.querySelector('.qg-bracket-label'), 'x'), (lo + hi) / 2, 0.02);
  // The largest move is written once, under the bar that IS it, and never in a stats row.
  const longest = f.root.querySelector('[data-longest]');
  assert.equal(Number(longest.dataset.longest), q3.errors.indexOf(q3.maxError));
  assert.equal(Number(longest.dataset.longest), 2);
  assert.equal(longest.textContent, '0.127'); assert.equal(value(f, 'max-error'), '0.127');
  assert.equal(attr(longest, 'y'), G.laneY + rankOf(q3)[2] * G.laneGap + G.errorGap);
  close(attr(longest, 'x'), (px(fx.values[2]) + px(q3.recon[2])) / 2, 0.02);
  assert.equal(f.root.querySelectorAll('[data-stats]').length, 1, 'one grid line under the picture, and no second stats row');
  // All six moved weights have their bar by now; the four value labels have retired.
  assert.deepEqual(bars(f).map(b => Number(b.dataset.error)), [1, 2, 3, 4, 5, 6]);
  assert.equal(labels(f).length, 0, 'the four values were retired when their beat ended');
  // 0.31 moves 0.023: its ghost would fuse with its own dot, so it is not drawn -- the bar
  // still measures the move.
  assert.deepEqual(ghosts(f).map(n => Number(n.dataset.ghost)), [1, 2, 3, 4, 6]);
  for (const time of [B2, B2 + 4, B3 - 0.01]) { f.seek(time); assert(classes(f).has('wash-s')); assert(!classes(f).has('wash-q')); }
  assert.match(caption((f.seek(B2), f)).textContent, /^Each tick owns everything within 0\.167 of it; the longest error is 0\.127\.$/);
  // And the rule the whole restaging turns on: a mark is dropped when its beat is over.
  for (const at of [RETIRED, scene.duration]) {
    f.seek(at);
    for (const gone of ['[data-basins]', '[data-bracket]', '[data-longest]', '[data-error]', '[data-ghost]']) {
      assert.equal(f.root.querySelector(gone), null, `${gone} is still drawn at ${at}s`);
    }
  }
});

test('quant: the payoff opens the grid -- 255 ticks, both pairs off their shared tick, and each ring left behind as an empty socket tied to the two dots that left it', t => {
  const f = fixture(t, NAME, {width: WIDE}); f.load(); f.open();
  const fx = declared(fixture(t, NAME));
  const q8 = quant(fx, 8), q3 = quant(fx, 3);
  f.seek(OPEN_AT - 0.05); assert.equal(Number(f.root.dataset.b), 3); assert.equal(slider(f).value, '1');
  f.seek(OPEN_AT); assert.equal(Number(f.root.dataset.b), 8); assert.equal(slider(f).value, '3');
  assert.equal(mixOf(f), 0, 'the dots start the payoff where the coarse grid left them');
  // Crossfade: both grids present, opacities summing to one, and the outgoing one writes
  // nothing -- for the second the two share, its labels would stand among the other's.
  f.seek(OPEN_AT + 0.65);
  const prev = f.root.querySelector('[data-grid="prev"]'), live = gridOf(f);
  assert(prev && live); assert.equal(prev.dataset.ticks, '7'); assert.equal(live.dataset.ticks, '255');
  close(attr(prev, 'opacity') + attr(live, 'opacity'), 1, 1e-6);
  // The outgoing grid keeps the ruler's two ends -- both grids put them at the same x, so
  // the ends never blink -- and drops its interior labels, which would stand among the
  // incoming grid's.
  assert.deepEqual([...prev.querySelectorAll('[data-tick]')].map(n => Number(n.dataset.tick)), [-3, 3]);
  assert.deepEqual([...prev.querySelectorAll('[data-tick]')].map(n => attr(n, 'x')), [px(-1), px(1)]);
  // Landed: 255 ticks drawn as the comb they are, each dot on a tick of its own.
  f.seek(SPLIT[1] + 0.1);
  assert.equal(mixOf(f), 1);
  assert.equal(gridOf(f).dataset.shape, 'comb');
  const xs = [...gridOf(f).querySelector('path.qg-ticks').getAttribute('d').matchAll(/M([\d.]+) /g)].map(m => Number(m[1]));
  assert.equal(xs.length, 255);
  for (let i = 1; i < xs.length; i++) close(xs[i] - xs[i - 1], (G.right - G.left) / 254, 0.03);
  assert(gridOf(f).querySelector('path.qg-ticks').getAttribute('class').includes('is-fine'), 'a 255-tick comb is drawn fine');
  assert.match(css, /\.qg-ticks\.is-fine \{/);
  dots(f).forEach((dot, i) => { close(attr(dot, 'cx'), px(q8.recon[i]), 0.02); assert.equal(attr(dot, 'cy'), G.lineY); });
  assert.equal(q8.collisions.length, 0);
  // The rings stay where they were and are empty: a white socket punched out of the comb,
  // with a dashed tie from its edge to each dot that left it.
  assert.equal(rings(f).length, 2); assert.equal(sockets(f).length, 2);
  assert.deepEqual(sockets(f).map(s => Number(s.dataset.socket)), q3.collisions.map(c => c.code));
  rings(f).forEach((ring, k) => {
    const c = q3.collisions[k];
    close(attr(ring, 'cx'), px(c.code * q3.s), 0.02); close(attr(ring, 'cy'), G.lineY, 0.02);
    close(attr(ring, 'r'), G.dotR + G.ringPad, 0.02);
    for (const i of c.indices) {
      const gap = Math.abs(attr(dots(f)[i], 'cx') - attr(ring, 'cx')) - attr(ring, 'r') - G.dotR;
      assert(gap >= G.tieMin, `dot ${i} is still inside its socket`);
    }
  });
  assert.deepEqual(ties(f).map(n => Number(n.dataset.tie)), [1, 2, 3, 4]);
  for (const tie of ties(f)) {
    const i = Number(tie.dataset.tie);
    const ring = rings(f).find(r => q3.collisions.find(c => c.code === Number(r.dataset.ring)).indices.includes(i));
    const side = Math.sign(attr(dots(f)[i], 'cx') - attr(ring, 'cx'));
    // A tie has two ends: it starts on the socket's edge, never at its centre, and lands on
    // the near side of the dot that left it.
    close(attr(tie, 'x1'), attr(ring, 'cx') + side * attr(ring, 'r'), 0.02);
    close(attr(tie, 'x2'), attr(dots(f)[i], 'cx') - side * G.dotR, 0.02);
    assert(Math.abs(attr(tie, 'x2') - attr(tie, 'x1')) >= G.tieMin, 'a tie shorter than its minimum');
    assert.equal(attr(tie, 'y1'), G.lineY); assert.equal(attr(tie, 'y2'), G.lineY);
  }
  assert.match(css, /\.qg-socket \{ fill: #fff/); assert.match(css, /\.qg-tie \{[^}]*stroke-dasharray/);
  // The four values relight over their own, now separate, dots.
  f.seek(RELIT);
  assert.deepEqual(labels(f).map(n => Number(n.dataset.w)), [1, 2, 3, 4]);
  labels(f).forEach(n => close(attr(n, 'x'), px(fx.values[Number(n.dataset.w)]), 0.02));
  // The grid is named once, under the picture; the count is never written on the grid, and
  // the row does not move when the grid does.
  assert.equal(value(f, 'ticks'), '255'); assert.equal(value(f, 's'), '0.0079');
  assert.equal(f.root.querySelector('[data-stats="grid"]').textContent, '255 ticks · s = 0.0079');
  assert.equal(gridOf(f).querySelectorAll('text').length, 2, 'only the two ends of the ruler are labelled at 8 bits');
  assert.equal(attr(f.root.querySelector('[data-stats="grid"]'), 'y'), rowsOf(q3).statsY);
  for (const time of [B3, OPEN_AT, RELIT, B4 - 0.01]) { f.seek(time); assert(classes(f).has('wash-q')); assert(!classes(f).has('wash-s')); }
  assert.match(caption((f.seek(B3), f)).textContent, /^255 ticks instead of seven: each pair's two weights step apart\.$/);
  f.seek(RELIT); assert.match(f.$('[data-figure] svg').getAttribute('aria-label'), /Every dot has a tick of its own/);
  // Narrow, the same grid cannot be separated, so it is a band -- and the count still stands
  // under the picture, once.
  const n = fixture(t, NAME, {width: NARROW}); n.load(); n.open(); n.seek(SPLIT[1] + 0.1);
  assert.equal(gridOf(n).dataset.shape, 'band'); assert(gridOf(n).querySelector('rect.qg-band'));
  assert.equal(gridOf(n).querySelectorAll('path').length, 0);
  assert.equal(value(n, 'ticks'), '255');
  assert.equal(n.root.querySelector('[data-stats="grid"]').textContent, '255 ticks · s = 0.0079');
  assert.equal(sockets(n).length, 2);
  assert.match(css, /\.qg-band \{/); assert.match(n.$('.mechanism-transcript').textContent, /too fine to draw tick by tick/);
});

test('quant: the price beat brings both pairs home and writes the payload -- the chapter\'s Nb/8 at a billion weights', t => {
  const f = fixture(t, NAME, {width: WIDE}); f.load(); f.open();
  const fx = declared(fixture(t, NAME));
  const q3 = quant(fx, 3);
  const gb = b => fx.n * b / 8 / 1e9;
  // The chapter's own sentence: 2 GB for FP16, 0.5 GB for 4-bit, from the same Nb/8.
  assert.equal(gb(16), 2); assert.equal(gb(4), 0.5);
  assert.match(chapterSource(NAME), /One billion FP16 weights therefore require 2 GB in decimal units; an ideal packed\n4-bit payload requires 0\.5 GB\./);
  f.seek(BACK_AT - 0.05); assert.equal(Number(f.root.dataset.b), 8);
  f.seek(BACK_AT); assert.equal(Number(f.root.dataset.b), 3); assert.equal(slider(f).value, '1');
  f.seek(MERGE[1] + 0.1);
  assert.equal(mixOf(f), 0);
  dots(f).forEach((dot, i) => close(attr(dot, 'cx'), px(q3.recon[i]), 0.02));
  assert.equal(attr(dots(f)[2], 'cy'), G.lineY - G.lift, 'the pair is stacked again');
  assert.equal(sockets(f).length, 0); assert.equal(ties(f).length, 0);
  assert.equal(rings(f).length, 2);
  f.seek(B4 + 1); assert.equal(attr(f.root.querySelector('[data-payload]'), 'opacity'), 0, 'the payload waits for the dots to come home');
  f.seek(PAID);
  assert.equal(value(f, 'payload'), '0.375'); assert.equal(value(f, 'payload8'), '1');
  assert.equal(f.root.querySelector('[data-payload]').textContent, 'payload = 0.375 GB per billion weights, against 1 GB at eight bits');
  assert.equal(attr(f.root.querySelector('[data-payload]'), 'y'), rowsOf(q3).payloadY);
  close(gb(3), 0.375); close(gb(8), 1);
  assert.match(caption(f).textContent, /^Back to three bits: the pairs merge again; payload falls to 0\.375 GB\.$/);
  assert.equal(caption(f).querySelector('.error-role').textContent, 'merge');
  // The reader's own stops carry the same rule.
  for (const [index, expected] of [[0, '0.25'], [2, '0.5'], [3, '1'], [1, '0.375']]) { drag(f, index); assert.equal(value(f, 'payload'), expected); }
  // The question above the pane promises the price, so the beat that pays it cannot be
  // dropped without breaking the question.
  assert.match(f.root.querySelector('.mechanism-question').textContent, /What pulls them apart, and what does that cost\?$/);
  const boundary = f.root.querySelector('.mechanism-boundary').textContent;
  assert.match(boundary, /not the chapter's remedy/);
  assert.match(boundary, /per-row scales and zero-points, not more bits/);
});

test('quant: the picture never carries more than eight live numerals, and every beat retires its own marks', t => {
  const f = fixture(t, NAME, {width: WIDE}); f.load(); f.open();
  // The ledger this scene is accounted by. LIVE is a numeral written in full ink on the
  // picture for the beat that needs it. FURNITURE is everything constant or withdrawn: the
  // two ends of the ruler, which ARE the ruler; any numeral drawn as a ghost; the slider's
  // readout and its four stops; the transport clock; and the symbols inside the typeset
  // formula, which are the rule and not a measurement.
  const effective = node => {
    let opacity = 1;
    for (let at = node; at && at.hasAttribute; at = at.parentElement) {
      if (at.hasAttribute('opacity')) opacity *= Number(at.getAttribute('opacity'));
      if (at.hasAttribute('data-drawing')) break;
    }
    return opacity;
  };
  // A tick label is an end of the ruler when its code is the extreme of ITS OWN grid, which
  // is what the group it sits in declares: 2Q + 1 ticks means codes -Q .. Q.
  const isEnd = node => {
    if (!node.hasAttribute('data-tick')) return false;
    const Q = (Number(node.closest('[data-grid]').dataset.ticks) - 1) / 2;
    return Math.abs(Number(node.dataset.tick)) === Q;
  };
  const countAt = time => {
    f.seek(time);
    let live = 0, ghosted = 0;
    const ends = new Set();
    for (const node of f.root.querySelectorAll('[data-drawing] text')) {
      const n = (node.textContent.match(/\d+(?:\.\d+)?/g) || []).length;
      const opacity = effective(node);
      if (opacity <= 0.02) continue;
      // Both grids write the ruler's ends at the same x during a crossfade, so the ends are
      // counted by position: two places, always, however many grids are on screen.
      if (isEnd(node)) { ends.add(node.getAttribute('x')); continue; }
      if (opacity <= 0.5) ghosted += n; else live += n;
    }
    // Ink: every drawn shape but the number line itself.
    const ink = [...f.root.querySelectorAll('[data-drawing] circle, [data-drawing] rect, [data-drawing] line, [data-drawing] path')]
      .filter(node => !node.classList.contains('qg-line') && effective(node) > 0.5).length;
    return {live, ghosted, ends: ends.size, ink};
  };
  // One row per beat, read at the beat's own hold. The worst instant is eight, at the beat
  // whose whole argument is the four weights that collided.
  const hold = [B1 - 0.1, B2 - 0.1, B3 - 0.1, B4 - 0.1, scene.duration];
  const ledger = hold.map(countAt);
  // Collide 4, Origins 8, Bound 7, Payoff 6, Price 6. The bound's row carries three because
  // the bracket names the half-width as `s/2 = 0.167`, and the 2 of s/2 is a numeral too.
  assert.deepEqual(ledger.map(r => r.live), [4, 8, 7, 6, 6], 'the live-numeral ledger changed');
  assert.deepEqual(ledger.map(r => r.ends), [2, 2, 2, 2, 2], 'the ruler always names its two ends, and never more');
  assert.deepEqual(ledger.map(r => r.ghosted), [0, 0, 0, 0, 6], 'the closing hold keeps all eight weights, six of them as ghosts');
  // The ink follows the same rule: it rises while the bound is being argued and falls back
  // once that beat is over, instead of accumulating to the end of the scene.
  assert(ledger[2].ink > ledger[0].ink, 'the bound beat adds ink');
  assert(ledger[4].ink < ledger[2].ink, 'the closing hold carries less ink than the bound beat');
  assert.deepEqual(ledger.map(r => r.ink), [11, 19, 30, 17, 11]);
  // And at every instant of the scene, not only at the holds.
  for (const time of times(0.25)) {
    const row = countAt(time);
    assert(row.live <= 8, `${row.live} live numerals at ${time}s`);
    assert.equal(row.ends, 2, `${row.ends} ruler ends at ${time}s`);
  }
  // b is announced in one place only (grammar rule 7): the slider readout. It is not on the
  // picture, not in the grid line and not in the payload line.
  for (const time of times(0.25)) {
    f.seek(time);
    assert.doesNotMatch(f.$('[data-drawing]').textContent, /\bb\s*=/, `b is written on the picture at ${time}s`);
  }
  assert.match(f.$('[data-bits-readout]').textContent, /b = 3 bits/);
});

test('quant: the intro says only what the reader needs before pressing play; every qualifier it lost is in the boundary paragraph', t => {
  const f = fixture(t, NAME, {width: WIDE});
  const introText = f.root.querySelector('.mechanism-intro').textContent;
  const intro = words(introText);
  assert(intro.length <= 40, `the intro is ${intro.length} words: "${introText}"`);
  // It says where the fixture comes from, and nothing else.
  assert.match(introText, /left panel of the figure above/);
  assert.match(introText, /np\.arange\(-3, 4\) \/ 3/);
  for (const moved of ['slider', '8-bit', 'Q = 2', 'payload', 'collision']) {
    assert(!introText.includes(moved), `"${moved}" belongs below the pane, not in the intro`);
  }
  // Every honest qualifier that left the intro or the picture landed in the boundary prose.
  const boundary = f.root.querySelector('.mechanism-boundary').textContent;
  for (const kept of ['the chapter prints none of them', 'Q = 127, 255 ticks', 's = 0.0079', '0.0039',
    'the one control', 'Nb', 'not a checkpoint size', '64 × 256', 'per-row scales and zero-points',
    'empty socket', '±1.00 are the only two the grid leaves alone']) {
    assert(boundary.includes(kept), `the boundary paragraph dropped "${kept}"`);
  }
  // The slider's mechanics are also in the keyboard-help paragraph.
  assert.match(f.$('#quantization-grid-playback-help').textContent, /arrow keys move b/);
  assert.match(f.$('#quantization-grid-playback-help').textContent, /never seek the timeline/);
  // Five beats, five transcript items, in the order the scene plays them.
  const items = [...f.$('.mechanism-transcript ol').children];
  assert.equal(items.length, scene.beats.length);
  assert.deepEqual(items.map(li => li.textContent.split('.')[0]), ['Collide', 'Where they came from', 'The bound', 'Open the grid', 'The price']);
  // And the question is the one the scene answers, both halves of it.
  assert.match(f.root.querySelector('.mechanism-question').textContent,
    /^Eight weights, seven ticks: two pairs already share a tick\. What pulls them apart, and what does that cost\?$/);
});

test('quant: reduced motion holds one grid and one dot position per beat', t => {
  const f = fixture(t, NAME, {reduced: true, width: WIDE}); f.load(); f.open();
  const perBeat = scene.beats.map(() => new Set());
  for (const time of times()) {
    f.seek(time);
    const stage = Number(f.root.dataset.stage);
    perBeat[stage].add(`${f.root.dataset.b}/${f.root.dataset.mix}/${dots(f).map(d => d.getAttribute('cx')).join(',')}`);
  }
  perBeat.forEach((set, k) => assert.equal(set.size, 1, `beat ${k} shows ${set.size} states`));
  // Three drawn states, never between: the coarse grid snapped (beats 1-3, each with its own
  // beat's marks already up), the open grid snapped (beat 4), the coarse grid again (beat 5).
  const seen = perBeat.map(set => [...set][0]);
  assert.deepEqual(seen.map(s => s.split('/').slice(0, 2).join('/')), ['3/0.0000', '3/0.0000', '3/0.0000', '8/1.0000', '3/0.0000']);
  assert.equal(new Set(seen.map(s => s.split('/').slice(1).join('/'))).size, 2, 'the dots take exactly two positions under reduced motion');
  // Unreduced, the glide passes between the two grids.
  const u = fixture(t, NAME, {width: WIDE}); u.load(); u.open();
  const mixes = new Set();
  for (let time = B3; time < B4; time += 0.05) { u.seek(Number(time.toFixed(4))); mixes.add(u.root.dataset.mix); }
  assert(mixes.size > 30);
});

test('quant: each declared beat advances the stage and toggles exactly its classes', t => {
  const f = fixture(t, NAME, {width: WIDE}); f.load(); f.open();
  const expected = [
    ['stage-0', 'show-formula'], ['stage-1', 'show-formula'], ['stage-2', 'show-formula', 'wash-s'],
    ['stage-3', 'show-formula', 'wash-q'], ['stage-4', 'show-formula']];
  scene.beats.forEach((beat, k) => {
    for (const time of [beat, beat + 0.5, (k + 1 < scene.beats.length ? scene.beats[k + 1] : scene.duration) - 0.01]) {
      f.seek(time);
      assert.equal(Number(f.root.dataset.stage), k);
      assert.deepEqual([...classes(f)].filter(c => c !== 'mechanism-excerpt').sort(), expected[k].sort(), `classes at ${time}s`);
    }
  });
  // Every class the player sets has a rule in player.css.
  for (const name of ['show-formula', 'wash-q', 'wash-s', 'is-stacked']) assert(css.includes(`.${name}`) || css.includes(`[data-layout="narrow"]`), `${name} styled`);
  assert.match(css, /\.mechanism-excerpt\.wash-q \.qg-Q \{/); assert.match(css, /\.mechanism-excerpt\.wash-s \.qg-s \{/);
  assert.match(css, /\.mechanism-excerpt\[data-ready\]:not\(\.show-formula\) \.qg-formula \{ visibility: hidden; \}/);
  // No blue, green or purple in the stylesheet: no input, prediction or target on this picture.
  for (const hex of ['#2b6cb0', '#2f855a', '#805ad5']) assert(!css.includes(hex), `${hex} is not this scene's colour`);
  assert(css.includes('#c05621') && css.includes('#722f37'));
  // And nothing is styled for a mark the restaging removed.
  for (const gone of ['.qg-times', '.qg-unchanged', '.qg-band-count', '.qg-stats.is-error']) {
    assert(!css.includes(gone), `${gone} is styled but never drawn`);
  }
});

test('quant: the formula is the chapter\'s rule in the book\'s macros with s and Q toggleable, and playback never rewrites it', t => {
  const f = fixture(t, NAME, {width: WIDE});
  const source = tex(f);
  assert.match(source, /^\\\( [\s\S]+ \\\)$/);
  // All three clauses stay. Dropping the Q = 2^(b-1) - 1 clause would leave Q undefined in
  // the s = max|w| / Q the panel prints, and the readout no longer names Q.
  assert(source.includes('\\widehat{w} = \\class{qg-s}{s}\\,\\operatorname{round}(\\parameterpart{w}/\\class{qg-s}{s})'));
  assert(source.includes('\\class{qg-s}{s} = \\frac{\\max|\\parameterpart{w}|}{\\class{qg-Q}{Q}}'));
  assert(source.includes('\\class{qg-Q}{Q} = 2^{b-1}-1'));
  assert.equal((source.match(/\\parameterpart\{w\}/g) || []).length, 2, 'w is the parameter, twice');
  assert.deepEqual(source.match(/\d+/g), ['2', '1', '1'], 'the only digits are the rule\'s own: no live number inside the formula');
  assert.equal(f.root.querySelectorAll('span[id^="eq-"]').length, 1);
  assert(!f.$('[data-bits-readout]').textContent.includes('Q'), 'Q is defined on the formula, so the readout does not repeat it');
  f.load(); f.open();
  for (const time of times(0.5)) { f.seek(time); assert.equal(tex(f), source); }
  for (const index of [0, 2, 3]) { drag(f, index); assert.equal(tex(f), source); }
  // Dragged, both washes light: the reader changed b, so s and Q both moved.
  assert(classes(f).has('wash-q') && classes(f).has('wash-s') && classes(f).has('show-formula'));
});

test('quant: one caption per beat, at most fourteen words, coloured by meaning, and no chrome in the pane', t => {
  const f = fixture(t, NAME, {width: WIDE}); f.load(); f.open();
  const seen = [];
  for (const time of times()) {
    f.seek(time);
    const html = caption(f).innerHTML, text = caption(f).textContent.trim();
    if (!seen.length || seen.at(-1) !== text) seen.push(text);
    assert(words(text).length <= 14, `${words(text).length} words at ${time}s: "${text}"`);
    assert(/parameter-role|error-role/.test(html), `a role word at ${time}s`);
  }
  assert.equal(seen.length, scene.beats.length, 'one caption per beat');
  assert.match(seen[0], /^Eight weights, seven ticks\. Two pairs already stand on the same tick\.$/);
  // Role words: orange weights, wine error.
  f.seek(B1 + 3); assert.equal(caption(f).querySelector('.parameter-role').textContent, 'weights');
  f.seek(B2 + 3); assert.equal(caption(f).querySelector('.error-role').textContent, 'error');
  assert.match(css, /#quantization-grid-excerpt \.parameter-role \{ color: var\(--qg-parameter\)/);
  assert.match(css, /#quantization-grid-excerpt \.error-role \{ color: var\(--qg-error\)/);
  // A dragged caption is one sentence of the same budget.
  for (const index of [0, 2, 3, 1]) {
    drag(f, index);
    assert(words(caption(f).textContent).length <= 14, `dragged caption: "${caption(f).textContent}"`);
    assert.match(caption(f).textContent, /^b = \d+ bits — /);
  }
  // No chrome: no stage strip, no tables, no cards; one picture, the control row, one
  // formula, one caption.
  const pane = f.$('[data-pane]');
  assert.equal(pane.querySelectorAll('.mechanism-stages, table, dl').length, 0);
  assert.deepEqual([...pane.children].map(node => node.className.split(' ')[0]), ['qg-figure', 'qg-slider', 'qg-formula', 'mechanism-caption', 'mechanism-controls', '']);
  // Numbers on the picture sit beside their marks, in their colour.
  f.seek(scene.duration);
  for (const node of f.root.querySelectorAll('text[data-w]')) assert.equal(node.getAttribute('class'), 'qg-value');
  assert.match(css, /\.qg-value \{[^}]*fill: var\(--qg-parameter\)/);
  assert.match(css, /\.qg-dot \{ fill: var\(--qg-parameter\)/); assert.match(css, /\.qg-error \{ stroke: var\(--qg-error\)/);
  assert.match(css, /\.qg-ring \{[^}]*stroke: var\(--qg-error\)/); assert.match(css, /\.qg-basin \{ fill: var\(--qg-error\)/);
  assert.match(css, /\.qg-longest \{[^}]*fill: var\(--qg-error\)/);
});

test('quant: dragging the slider pauses, takes over, and recomputes every mark from the chosen b', t => {
  const fx = declared(fixture(t, NAME));
  for (const width of [WIDE, NARROW]) {
    const g = width === WIDE ? G : NG;
    const w = fixture(t, NAME, {width}); w.load(); w.open();
    w.seek(B1 + 1); w.play(); w.tick(100); assert(w.playing);
    drag(w, 2);
    assert(!w.playing, 'a drag pauses playback');
    assert.equal(w.root.dataset.override, 'slider'); assert.equal(Number(w.root.dataset.b), 4);
    for (const [index, b] of [[2, 4], [0, 2], [3, 8], [1, 3]]) {
      drag(w, index);
      const q = quant(fx, b), label = `${width}px, b = ${b}`;
      assert.equal(Number(w.root.dataset.b), b, label);
      assert.equal(mixOf(w), 0, label);
      // The grid: 2Q + 1 ticks (or the band where they cannot be separated), with the tick
      // labels at s apart.
      const grid = gridOf(w);
      assert.equal(grid.dataset.ticks, String(q.ticks), label);
      const comb = grid.querySelector('path.qg-ticks');
      if (comb) assert.equal([...comb.getAttribute('d').matchAll(/M/g)].length, q.ticks, label); else assert(grid.querySelector('rect.qg-band'), label);
      for (const node of grid.querySelectorAll('[data-tick]')) close(attr(node, 'x'), px(Number(node.dataset.tick) * q.s, g), 0.02, label);
      // Every tick this grid sends more than one weight to is named by what they became, and
      // no interior tick is named for any other reason.
      assert.deepEqual([...grid.querySelectorAll('[data-tick]')].map(n => Number(n.dataset.tick)).filter(c => Math.abs(c) !== q.Q),
        q.collisions.map(c => c.code).filter(c => Math.abs(c) !== q.Q), label);
      for (const node of grid.querySelectorAll('[data-tick]')) {
        if (Math.abs(Number(node.dataset.tick)) === q.Q) continue;
        assert.equal(node.textContent, tick3(Number(node.dataset.tick) * q.s), label);
      }
      // The dots: every one on its tick, stacked by arrival order within a collision.
      const rank = rankOf(q), lift = liftOf(q, g), rows = rowsOf(q, g);
      dots(w).forEach((dot, i) => { close(attr(dot, 'cx'), px(q.recon[i], g), 0.02, label); close(attr(dot, 'cy'), g.lineY - rank[i] * lift, 0.02, label); });
      // However many dots share a tick, the stack never grows past its ceiling, and the two
      // rows under the line sit below the last lane.
      assert(Math.max(...rank) * lift <= g.stackMax + 1e-9, label);
      // The bound's bracket is not drawn for a reader-set grid, so the ceiling the stack
      // must respect here is the row the weights are written in.
      assert(g.lineY - Math.max(...rank) * lift - g.dotR - g.ringPad > g.labelY + 6, `${label}: the stack reaches the value labels`);
      for (const bar of bars(w)) assert(attr(bar, 'y1') + 2 < rows.statsY - 10, `${label}: a bar runs through the grid line`);
      // The bars: one per moved weight, from weight to tick, in its rank's lane.
      const moved = q.errors.map((e, i) => (e > 1e-9 ? i : -1)).filter(i => i >= 0);
      assert.deepEqual(bars(w).map(bar => Number(bar.dataset.error)), moved, label);
      for (const bar of bars(w)) assert.equal(bar.dataset.lane, String(rank[Number(bar.dataset.error)]), label);
      if (b === 2) assert.equal(new Set(bars(w).map(bar => bar.dataset.lane)).size, 3, 'the 2-bit grid needs three lanes');
      // Two bars in one lane never overlap: one lane is one arrival rank.
      const lanes = new Map();
      for (const bar of bars(w)) {
        const lo = Math.min(attr(bar, 'x1'), attr(bar, 'x2')), hi = Math.max(attr(bar, 'x1'), attr(bar, 'x2'));
        for (const [a, c] of lanes.get(bar.dataset.lane) || []) assert(!(lo < c - 1e-6 && a < hi - 1e-6), `${label}: bars overlap in lane ${bar.dataset.lane}`);
        lanes.set(bar.dataset.lane, [...(lanes.get(bar.dataset.lane) || []), [lo, hi]]);
      }
      // The rings: exactly the collisions, with no socket and no tie, because nothing left.
      assert.deepEqual(rings(w).map(r => [Number(r.dataset.ring), Number(r.dataset.count)]), q.collisions.map(c => [c.code, c.indices.length]), label);
      assert.equal(sockets(w).length, 0, label); assert.equal(ties(w).length, 0, label);
      // The numbers: ticks, s and the payload on the grid line; the readout; the announcement.
      assert.equal(value(w, 'ticks'), String(q.ticks), label); assert.equal(value(w, 's'), fmt(q, q.s), label);
      assert.equal(value(w, 'payload'), plain(q.payloadGB), label);
      assert.equal(w.root.querySelector('[data-stats="grid"]').textContent,
        `${q.ticks} ticks · s = ${fmt(q, q.s)} · ${plain(q.payloadGB)} GB per billion weights`, label);
      assert.equal(w.$('[data-bits-readout]').textContent.replace(/\s+/g, ' '), `b = ${b} bits`, label);
      assert.equal(slider(w).getAttribute('aria-valuetext'),
        `b = ${b} bits: Q = ${q.Q}, ${q.ticks} ticks, spacing s = ${fmt(q, q.s)}, largest error ${fmt(q, q.maxError)}, `
        + `${q.collisions.length} collision${q.collisions.length === 1 ? '' : 's'}, payload ${plain(q.payloadGB)} GB per billion weights.`, label);
      assert.match(w.$('[data-figure] svg').getAttribute('aria-label'), new RegExp(`Reader-set b = ${b}, Q = ${q.Q}, ${q.ticks} ticks`), label);
      assert.equal(caption(w).textContent,
        `b = ${b} bits — ${q.collisions.length ? `${['no', 'one', 'two', 'three', 'four'][q.collisions.length]} group${q.collisions.length === 1 ? '' : 's'} collide` : 'nothing collides'}; largest error ${fmt(q, q.maxError)}.`, label);
      // All eight weights stay on the reader's picture, the six the ruler does not name as
      // ghosts, so a drag is as complete as the fallback.
      assert.deepEqual(labels(w).map(n => Number(n.dataset.w)), [1, 2, 3, 4, 5, 6], label);
      assert(labels(w).every(n => attr(n, 'opacity') > 0 && attr(n, 'opacity') <= 0.5), label);
    }
  }
  const f = fixture(t, NAME, {width: WIDE}); f.load(); f.open();
  // A drag in the first beat shows the whole answer for that b, because the reader asked.
  f.seek(0); assert.equal(f.root.dataset.override, '');
  drag(f, 0); assert.equal(gridOf(f).dataset.ticks, '3'); assert.equal(rings(f).length, 3); assert.equal(value(f, 'payload'), '0.25');
  // A seek is the timeline speaking again: the detour is dropped and the picture is the
  // timeline's, exactly as it was without the drag.
  f.seek(B2 + 2);
  assert.equal(f.root.dataset.override, ''); assert.equal(Number(f.root.dataset.b), 3); assert.equal(slider(f).value, '1');
  const clean = fixture(t, NAME, {width: WIDE}); clean.load(); clean.open(); clean.seek(B2 + 2);
  assert.equal(drawnMarkup(f), drawnMarkup(clean));
  // Play from a pause resumes the timeline's own b from the first frame.
  drag(f, 3); assert.equal(Number(f.root.dataset.b), 8);
  f.play(); assert.equal(f.root.dataset.override, ''); assert.equal(Number(f.root.dataset.b), 3);
  f.tick(100); assert.equal(Number(f.root.dataset.b), 3); assert(f.playing);
  f.play();
  // Space on the pane, too.
  drag(f, 0); f.key(' '); assert(f.playing); assert.equal(f.root.dataset.override, ''); f.key(' ');
  // The slider clamps to its stops.
  drag(f, 9); assert.equal(Number(f.root.dataset.b), 8); drag(f, -2); assert.equal(Number(f.root.dataset.b), 2);
  // Reduced motion: dragging works the same way on the held picture.
  const r = fixture(t, NAME, {reduced: true, width: WIDE}); r.load(); r.open(); r.seek(B1 + 1);
  drag(r, 2); assert.equal(Number(r.root.dataset.b), 4); assert.equal(value(r, 'ticks'), '15');
});

test('quant: arrow keys on the slider move b and are never seen by the pane\'s beat seeking; the timeline sweeps the slider 3 -> 8 -> 3', t => {
  const f = fixture(t, NAME, {width: WIDE}); f.load(); f.open();
  f.seek(B2 + 2);
  const s = slider(f);
  for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End', ' ', 'k']) {
    const event = new f.w.KeyboardEvent('keydown', {key, bubbles: true, cancelable: true});
    s.dispatchEvent(event);
    assert.equal(event.defaultPrevented, false, `${key} on the slider was captured`);
    assert.equal(f.time, B2 + 2, `${key} on the slider moved the timeline`);
    assert(!f.playing, `${key} on the slider started playback`);
  }
  // The same keys on the pane itself still seek, so the two surfaces are separate.
  f.key('ArrowRight'); assert.equal(f.time, B3);
  f.key('ArrowLeft'); assert.equal(f.time, B2);
  // The transport binds its scrubber inside its own bar, so the second range in the pane can
  // never become the clock.
  assert.match(read('shared/playback.js'), /const range = \$\('\[data-controls\] input\[type="range"\]'\)/);
  assert.equal(f.$('[data-controls] input[type=range]').max, String(scene.duration));
  const pane = f.$('[data-pane]');
  const ranges = [...pane.querySelectorAll('input[type=range]')];
  assert.equal(ranges.length, 2); assert.equal(ranges.filter(r => r.closest('[data-controls]')).length, 1);
  assert.equal(s.min, '0'); assert.equal(s.max, '3'); assert.equal(s.step, '1');
  assert.deepEqual([...f.d.getElementById(s.getAttribute('list')).options].map(o => o.label), ['2', '3', '4', '8']);
  assert.equal(pane.querySelectorAll('button').length, 2, 'play and fullscreen only: no third action');
  // The timeline sweeps the slider: 3 until the payoff opens the grid, 8 across it, 3 again
  // for the closing price.
  const seen = [];
  for (const time of [0, B1, B2, OPEN_AT - 0.05, OPEN_AT, B4, BACK_AT - 0.05, BACK_AT, scene.duration]) { f.seek(time); seen.push(Number(s.value)); }
  assert.deepEqual(seen, [1, 1, 1, 1, 3, 3, 3, 1, 1]);
  assert.match(s.getAttribute('aria-label'), /bit width/i);
  assert.match(f.root.querySelector('.mechanism-boundary').textContent, /the timeline moves it, 3 → 8 → 3/);
  assert.match(css, /\.mechanism-excerpt:not\(\[data-ready\]\) \.qg-slider \{ visibility: hidden/);
  assert.match(css, /\.qg-track input\[type="range"\] \{[^}]*accent-color: var\(--qg-parameter\)/);
});

test('quant: the static fallback prints the closing frame with every witness value, and is the player\'s own t = 40 drawing', async t => {
  const s = fixture(t, NAME, {width: WIDE});
  const text = s.root.textContent;
  // Grammar rule 9: a reader with scripts off gets the last frame carrying the witnesses --
  // all eight weights, the two numbers the pairs became, the grid and the price.
  for (const witness of ['7 ticks · s = 0.333', 'payload = 0.375 GB per billion weights, against 1 GB at eight bits',
    `${MINUS}0.667`, `${MINUS}1.00`, '1.00', `${MINUS}0.79`, `${MINUS}0.54`, `${MINUS}0.11`, '0.08', '0.31', '0.72']) {
    assert(text.includes(witness), `static panel lacks ${witness}`);
  }
  assert.equal(s.root.querySelectorAll('[data-mark="dot"]').length, 8);
  assert.equal(s.root.querySelectorAll('text[data-w]').length, 6, 'the six weights the ruler does not name are written as ghosts');
  assert.equal(s.root.querySelectorAll('[data-ring]').length, 2);
  assert.equal(s.root.querySelectorAll('[data-error]').length, 0, 'the bars belong to a beat that is over');
  assert.equal(s.$('[data-bits-readout]').textContent.replace(/\s+/g, ' '), 'b = 3 bits');
  assert.equal(s.$('[data-figure] svg').getAttribute('viewBox'), G.viewBox);
  assert.equal(s.root.className, 'mechanism-excerpt show-formula stage-4');
  // No-script readouts are exactly the readouts at the end of the timeline.
  const before = canonicalMarkup(s.$('[data-drawing]').innerHTML), readout = s.$('[data-bits-readout]').innerHTML, cap = caption(s).innerHTML;
  const title = s.$('svg title').textContent, described = s.$('[data-figure] svg').getAttribute('aria-label');
  s.load(); s.open(); s.seek(scene.duration);
  assert.equal(canonicalMarkup(s.$('[data-drawing]').innerHTML), before);
  assert.equal(s.$('[data-bits-readout]').innerHTML, readout); assert.equal(caption(s).innerHTML, cap);
  assert.equal(s.$('svg title').textContent, title); assert.equal(s.$('[data-figure] svg').getAttribute('aria-label'), described);
  // The accessible name is composed from the declared fixture, so the panel holds no second
  // copy of the witness numbers.
  for (const witness of [`${MINUS}0.667`, '255 ticks', '0.375 GB']) assert(title.includes(witness), `the svg title lacks ${witness}`);
  // The whole pane minus the control bar and the live aria-valuetext is byte-equal to that render.
  const strip = f => drawnMarkup(f).replace(/ aria-valuetext="[^"]*"/g, '');
  const clean = fixture(t, NAME, {width: WIDE});
  const staticPane = strip(clean);
  clean.load(); clean.open(); clean.seek(scene.duration);
  assert.equal(strip(clean), staticPane);
  const {before: committed, after: fresh} = await staticFrame(NAME);
  assert.equal(committed, fresh, 'run scripts/render_static_frames.cjs quantization-grid');
});

test('quant: below 600 px the same picture reflows into a smaller line with staggered value labels and nothing outside the viewBox', t => {
  const f = fixture(t, NAME, {width: NARROW}); f.load(); f.open();
  const fx = declared(fixture(t, NAME));
  assert.equal(f.root.dataset.layout, 'narrow'); assert(classes(f).has('is-stacked'));
  assert.equal(f.$('[data-figure] svg').getAttribute('viewBox'), NG.viewBox);
  const inside = (x, y, label) => assert(x >= 0 && x <= NG.width && y >= 0 && y <= NG.height, `${label} at (${x}, ${y}) is outside the narrow viewBox`);
  for (const time of [B0 + 2, B1 + 3, B2 + 3, SPLIT[1] + 0.2, scene.duration]) {
    f.seek(time);
    for (const node of f.root.querySelectorAll('[data-drawing] circle')) { inside(attr(node, 'cx') - attr(node, 'r'), attr(node, 'cy') - attr(node, 'r'), 'circle'); inside(attr(node, 'cx') + attr(node, 'r'), attr(node, 'cy') + attr(node, 'r'), 'circle'); }
    for (const node of f.root.querySelectorAll('[data-drawing] text')) inside(attr(node, 'x'), attr(node, 'y'), node.textContent);
    for (const node of f.root.querySelectorAll('[data-drawing] line, [data-drawing] rect')) {
      if (node.tagName === 'line') { inside(attr(node, 'x1'), attr(node, 'y1'), 'line'); inside(attr(node, 'x2'), attr(node, 'y2'), 'line'); }
      else { inside(attr(node, 'x'), attr(node, 'y'), 'rect'); inside(attr(node, 'x') + attr(node, 'width'), attr(node, 'y') + attr(node, 'height'), 'rect'); }
    }
  }
  // The value labels alternate between two rows so neighbours never overprint.
  f.seek(scene.duration);
  const rows = labels(f);
  assert.equal(rows.length, 6);
  assert.equal(new Set(rows.map(n => n.getAttribute('y'))).size, 2);
  rows.forEach((n, i) => { if (i) assert.notEqual(n.getAttribute('y'), rows[i - 1].getAttribute('y')); });
  dots(f).forEach((dot, i) => close(attr(dot, 'cx'), px(quant(fx, 3).recon[i], NG), 0.02));
  // A resize flips the mode in place.
  const w = fixture(t, NAME, {width: WIDE}); w.load(); w.open(); w.seek(scene.duration);
  assert.equal(w.root.dataset.layout, 'wide'); assert.equal(new Set(labels(w).map(n => n.getAttribute('y'))).size, 1);
  w.resize(NARROW); assert.equal(w.root.dataset.layout, 'narrow'); assert.equal(w.$('[data-figure] svg').getAttribute('viewBox'), NG.viewBox);
  assert.equal(w.time, scene.duration); assert(!w.playing);
});

test('quant: the panel is the only fixture copy -- moving it moves every number', t => {
  const f = fixture(t, NAME, {width: WIDE});
  f.root.dataset.values = '-1.00 -0.40 0.20 0.45 1.00';
  f.load(); f.open(); f.seek(scene.duration);
  // The new values at b = 3: codes -3, -1, 1, 1, 3 -> one collision at 0.333, largest error 0.133.
  numbers(f.root.dataset.recon).forEach((r, i) => close(r, [-1, -1 / 3, 1 / 3, 1 / 3, 1][i], 1e-6));
  assert.deepEqual(JSON.parse(f.root.dataset.collisions), [{code: 1, indices: [2, 3]}]);
  close(Number(f.root.dataset.maxError), 1 / 3 - 0.20, 1e-9);
  assert.equal(dots(f).length, 5); assert.equal(rings(f).length, 1);
  assert.match(caption((f.seek(B2), f)).textContent, /the longest error is 0\.133\.$/);
  const drawn = f.$('[data-drawing]').innerHTML;
  for (const gone of ['0.79', '0.54', '0.11', '0.08', '0.31', '0.72']) assert(!drawn.includes(gone), `${gone} survived on the picture`);
  // And a grid that is not the chapter's symmetric one is refused, loudly.
  const g = fixture(t, NAME, {width: WIDE});
  g.root.dataset.grid = '-3 4 2';
  assert.throws(() => g.load(), /symmetric grid/);
});

test('integration: the excerpt is HTML-only, manifest-driven, and declared in the config', () => {
  const filter = fs.readFileSync(path.join(__dirname, '..', scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/,
    'the non-HTML guard is the first executable line, so the PDF is untouched');
  assert.match(filter, /pandoc\.json\.decode/, 'the scene is data in the manifest, not code in the filter');
  assert.match(filter, /"after-cell"/, 'the filter must be able to place this scene\'s anchor kind');
  assert.match(filter, /assert\(inserted == 1/);
  assert.doesNotMatch(filter, /quantiz|grid/i, 'a manifest-driven filter names no scene');
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
  // cell-fig-quantization-granularity div; the equation it applies must sit above it.
  assert.equal(scene.anchor.type, 'after-cell'); assert.equal(scene.anchor.target, 'cell-fig-quantization-granularity');
  const chapter = chapterSource(NAME);
  assert.equal(chapter.split('\n').filter(line => line === '#| label: fig-quantization-granularity').length, 1, 'the anchor cell appears exactly once');
  assert(chapter.indexOf('{#eq-symmetric-quantization}') < chapter.indexOf('#| label: fig-quantization-granularity'), 'the rule precedes the anchor');
  assert(chapter.indexOf('{#eq-quant-payload}') < chapter.indexOf('{#eq-symmetric-quantization}'));
  assert.equal(read(`${scene.scene}/panel.html`).includes('data-playback='), scene.transport === 'shared');
  assert(manifest.scenes.some(other => other.id === NAME));
});
