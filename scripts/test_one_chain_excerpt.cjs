#!/usr/bin/env node
// Test-only JSDOM. No dependency from this file enters the published book.
// The JSDOM fixture, the markup canonicaliser, and the transport, beat-hold and grammar
// suites this scene inherits live in scripts/html-tests/excerpt-harness.cjs. What stays
// here is the part no harness can supply: this scene's arithmetic, the two things this
// chapter can get silently wrong -- the factor of two in the loss, and the difference
// between a measured slope and a derivative -- and the shape of its one picture: a dial,
// three edges, one orange bar whose height is the nudge, the ghosts it leaves, the wine
// rays that walk back, and the typeset labels revealed on arrival. JSDOM never typesets,
// so the formula assertions read the TeX source, the eq- ids, the \class{} names and the
// classes the player toggles, never rendered math.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, manifest, entry, chapterSource, close, canonicalMarkup, drawnMarkup,
  fixture, registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'one-chain-excerpt';
const scene = entry(NAME);
const NODES = ['w', 'z', 'a', 'L'];
// The harness lays nothing out, so the pane's width is declared: the wide layout, which
// is the one the static frame is drawn in. One test drives the narrow layout explicitly.
const WIDE = 1100, NARROW = 280;
// The picture's stated scales, from the design and never from what the player drew:
// node centres, bar scale and bar width for each layout.
const GEOMETRY = {
  wide: {viewBox: '0 0 1100 430', nx: [130, 392, 654, 916], barX: [180, 392, 654, 916], px: 8000, line: 262},
  narrow: {viewBox: '0 0 480 320', nx: [72, 186, 300, 414], barX: [108, 186, 300, 414], px: 4000, line: 160}
};
// The choreography the player states (seconds on the 40 s clock).
const TURN = [12, 13.5], HOP = [[14, 15.3], [16.3, 17.6], [18.6, 19.9]], RATIO_AT = 21;
const RETURN = [24, 25], FORMULA_AT = 25, SWEEP = [[25.2, 27], [27.4, 29.2], [30.4, 32.2]], PRODUCT_AT = 34;

// Read the declared fixture from the closed panel. The panel is the one in-repo mirror of
// the manuscript's numbers; everything below is computed from it, so no chapter value is
// typed here a second time.
function declared(f) {
  assert(!f.root.dataset.ready, 'read the declared fixture before the player mounts');
  const {w, x, b, y, nudge} = f.root.dataset;
  return {w: Number(w), x: Number(x), b: Number(b), y: Number(y), dw: Number(nudge)};
}

// This suite's own forward-and-chain, deliberately not the player's: it is the independent
// evaluation every arithmetic assertion below is checked against. The loss is the FULL
// squared error the chapter writes, (a - y)^2, with no one-half in front of it.
function reference(w, {x, b, y}) {
  const z = w * x + b;
  const a = 1 / (1 + Math.exp(-z));
  return {w, z, a, L: (a - y) * (a - y)};
}
function chain(fixtureValues) {
  const {w, x, y} = fixtureValues;
  const at = reference(w, fixtureValues);
  const locals = [2 * (at.a - y), at.a * (1 - at.a), x];
  return {...at, locals, product: locals[0] * locals[1] * locals[2]};
}
const slope = (values, dw) =>
  (reference(values.w + dw, values).L - reference(values.w, values).L) / dw;
// The nudge at each node, as the bar measures it: w, then the three increments.
const increments = values => {
  const at = reference(values.w, values), bumped = reference(values.w + values.dw, values);
  return [values.dw, bumped.z - at.z, bumped.a - at.a, bumped.L - at.L];
};
const signedIncrement = (value, digits) => `${value < 0 ? '-' : '+'}${Math.abs(value).toFixed(digits)}`;
const texts = (f, selector) => [...f.root.querySelectorAll(selector)].map(node => node.textContent);
const cells = f => NODES.map(name => f.$(`[data-value="${name}"]`).textContent);
const tex = (f, name) => f.d.getElementById(`eq-one-chain-${name}`).textContent;
const label = (f, name) => f.$(`foreignObject[data-reveal="${name}"]`);
const revealed = (f, name) => !label(f, name).hasAttribute('hidden');
const ray = (f, name) => Number(f.$(`[data-ray="${name}"]`).dataset.progress);
const formula = f => f.$('[data-formula]');
const caption = f => f.$('[data-caption]');
const drawing = f => f.$('[data-drawing]').innerHTML;
const bar = f => f.$('[data-bar]');
const ghosts = f => [...f.root.querySelectorAll('[data-ghost]')];
const needleAngle = f => Number(/rotate\(([-\d.]+) /.exec(f.$('[data-needle]').getAttribute('transform'))[1]);
const times = (from, to, step = 0.05) => {
  const out = [];
  for (let t = from; t <= to + 1e-9; t += step) out.push(Number(t.toFixed(4)));
  return out;
};
const css = read(`${scene.scene}/player.css`);
const LABELS = ['map-1', 'map-2', 'map-3', 'const-1', 'const-3', 'letter-w', 'letter-z', 'letter-a', 'letter-L',
  'dw', 'dz', 'da', 'dL', 'dw-n', 'dz-n', 'da-n', 'dL-n', 'fac-3', 'fac-2', 'fac-1', 'der-3', 'der-2', 'der-1', 'ratio', 'prod'];
const ALWAYS = LABELS.slice(0, 9);

registerTransportTests(NAME, {
  witness: /0\.337801/,
  anchors: ['one-chain-playback-help'],
  width: WIDE
});
// One drawn state per whole beat under reduced motion, not just at the boundaries: the
// dial, the bar and the three rays must each arrive whole rather than creep across a beat.
registerBeatHoldTest(NAME);
// One picture, one formula line, one caption; TeX never rewritten; one guarded typeset.
registerGrammarTests(NAME);

test('one-chain: the declared attributes reproduce the chapter literals they mirror', t => {
  const f = fixture(t, NAME);
  const values = declared(f);
  const chapter = chapterSource(NAME);
  // Not a second copy of the fixture: the panel's attributes are rendered back into the
  // chapter's own source text, so a drift in either direction fails here as well as in
  // scripts/audit_excerpt_fixtures.py.
  assert(chapter.includes(
    `w, x, b = Value(${values.w}), Value(${values.x.toFixed(1)}), Value(${values.b})`),
  'the declared w, x and b do not spell the chapter literal');
  assert(chapter.includes(`loss = (a + (${-values.y})) * (a + (${-values.y}))`),
    'the declared target does not spell the chapter\'s loss literal');
  assert(chapter.includes(
    `{2 * (s - ${values.y}) * s * (1 - s) * ${values.x.toFixed(1)}:.6f}`),
  'the declared fixture does not spell the chapter\'s hand check');
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal));
});

test('one-chain: the loss is the FULL squared error — the factor-of-two guard', t => {
  const f = fixture(t, NAME);
  const values = declared(f);
  const {a, L, locals, product} = chain(values);
  // The chapter's own loss line, with no one-half in front of it.
  const lossLine = chapterSource(NAME)
    .split('\n').find(line => line.startsWith('loss = (a + ('));
  assert(lossLine && !/0\.5|\/ *2\b/.test(lossLine),
    `the chapter's loss line is not a bare square: ${lossLine}`);

  assert.equal(L.toFixed(6), '0.168879');
  assert.equal(locals[0].toFixed(6), '0.821899');
  assert.equal(locals[1].toFixed(6), '0.205500');
  assert.equal(locals[2], 2);
  assert.equal(product.toFixed(6), '0.337801');

  // The counterfactual this guard exists for: half a squared error halves dL/da, so the
  // whole chain halves. That value is a real number this scene must never print.
  const half = (a - values.y) * locals[1] * locals[2];
  assert.equal(half.toFixed(6), '0.168900', 'the half-squared counterfactual moved');
  assert.notEqual(product.toFixed(6), half.toFixed(6));
  close(product, 2 * half, 1e-12);
  assert.equal((0.5 * L).toFixed(6), '0.084440');

  // And the panel prints the full-error numbers, both statically and at the end: the
  // product in the typeset label under L and in the formula, the loss under its node.
  assert(tex(f, 'prod').includes('0.337801'));
  assert(tex(f, '1').includes('0.337801') && tex(f, '1n').includes('0.337801'));
  f.load(); f.seek(scene.duration);
  assert.equal(Number(f.root.dataset.product).toFixed(6), '0.337801');
  assert.equal(f.$('[data-value="L"]').textContent, '0.168879');
  const printed = f.$('[data-pane]').textContent;
  assert(!printed.includes('0.168900'), '0.168900 — a half-squared error — is on the panel');
});

test('one-chain: the product is exactly what the chapter itself prints', t => {
  // The strongest binding available: the chapter executes `micro-autograd-check` and the
  // committed freeze holds its stdout. 0.337801 is a number this book prints, twice.
  const frozen = JSON.parse(fs.readFileSync(path.join(ROOT,
    '_freeze/chapters/part1/05-backpropagation/execute-results/html.json'), 'utf8'));
  const stdout = JSON.stringify(frozen);
  const f = fixture(t, NAME);
  const {product} = chain(declared(f));
  assert(stdout.includes(`micro-autograd: dL/dw = ${product.toFixed(6)}`),
    'the chapter no longer prints the product this scene multiplies out');
  assert(stdout.includes(`by hand:        dL/dw = ${product.toFixed(6)}`),
    'the chapter\'s hand check no longer prints the product');
  assert(tex(f, 'prod').includes(product.toFixed(6)), 'the label under L does not print the chapter\'s product');
  f.load(); f.seek(scene.duration);
  assert.equal(Number(f.root.dataset.product).toFixed(6), product.toFixed(6));
});

test('one-chain: the finite difference is 0.338046 and is NOT the derivative', t => {
  const f = fixture(t, NAME);
  const values = declared(f);
  const {product} = chain(values);
  const measured = slope(values, values.dw);
  assert.equal(values.dw, 0.01);
  assert.equal(measured.toFixed(6), '0.338046');
  // Distinguishable: the two numbers differ, by more than a rounding of the sixth decimal.
  assert.notEqual(measured.toFixed(6), product.toFixed(6));
  assert(Math.abs(measured - product) > 1e-5,
    `a measured slope indistinguishable from the derivative proves nothing: ${measured}`);
  // And agreeing to three decimals is the claim the panel actually makes.
  assert.equal(measured.toFixed(3), product.toFixed(3));
  // First order in dw: a tenth of the step leaves about a tenth of the gap.
  const tighter = slope(values, values.dw / 10);
  assert(Math.abs(tighter - product) < Math.abs(measured - product) / 5,
    'the gap does not shrink with the step, so this is not a finite-difference error');

  // The picture writes the measurement where it was measured, and the product under it.
  assert(tex(f, 'ratio').includes('\\Delta L/\\Delta w = 0.338046'));
  assert(tex(f, 'dL').includes('\\Delta L = +0.003380'));
  assert(tex(f, 'dw').includes('\\Delta w = +0.010'));
  f.load(); f.open();
  assert.equal(Number(f.root.dataset.measured).toFixed(6), '0.338046');
  f.seek(scene.beats[7]);
  assert.match(caption(f).textContent, /finite difference is not the derivative/);
  assert.match(caption(f).textContent, /0\.337801.*0\.338046/);
  f.seek(scene.beats[8]);
  assert.match(caption(f).textContent, /Nothing was updated/);
});

test('one-chain: the forward pass fills left to right, then keeps; unrevealed values are "·"', t => {
  const f = fixture(t, NAME);
  const values = declared(f);
  const at = reference(values.w, values);
  f.load(); f.open();
  f.seek(0);
  // The reader answers first: only the dial is on the table, and every reveal is absent.
  assert.deepEqual(cells(f), [at.w.toFixed(3), '·', '·', '·']);
  for (const name of LABELS) assert.equal(revealed(f, name), ALWAYS.includes(name), `${name} at 0s`);
  assert(!formula(f).classList.contains('is-shown'));
  assert(bar(f).hasAttribute('hidden')); assert.equal(ghosts(f).length, 0);
  // Nothing withheld is shown as a zero, and a withheld dot is not painted in a node colour.
  for (const cell of texts(f, '[data-value]')) assert(!/^[-+]?0(\.0+)?$/.test(cell.trim()), `withheld value rendered as ${cell}`);
  assert.deepEqual([...f.root.querySelectorAll('[data-value]')].map(node => node.classList.contains('oc-withheld')),
    [false, true, true, true]);
  assert.deepEqual([...f.root.querySelectorAll('[data-node]')].map(node => node.classList.contains('oc-dim')), [true, true, true]);
  // Across the forward beat the values fill left to right, and never right to left; the
  // forward ink on each edge is complete before the value at its end appears.
  let filled = 0;
  for (const time of times(scene.beats[1], scene.beats[2])) {
    f.seek(time);
    const shown = cells(f).map(text => text !== '·');
    assert.deepEqual(shown, [...shown].sort((x, y) => Number(y) - Number(x)), `a later value filled before an earlier one at ${time}s`);
    [0, 1, 2].forEach(k => assert.equal(shown[k + 1], ray(f, `f${k}`) >= 1, `value ${NODES[k + 1]} and ink f${k} disagree at ${time}s`));
    filled = Math.max(filled, shown.filter(Boolean).length);
  }
  assert.equal(filled, 4);
  f.seek(scene.beats[2]);
  assert.deepEqual(cells(f), [at.w.toFixed(3), at.z.toFixed(3), at.a.toFixed(6), at.L.toFixed(6)]);
  assert.deepEqual([...f.root.querySelectorAll('[data-node]')].map(node => node.classList.contains('oc-dim')), [false, false, false]);
  // Kept: the values stand until the nudge reaches them, and return when the dial does.
  f.seek(HOP[0][0] - 0.01);
  assert.deepEqual(cells(f).slice(1), [at.z.toFixed(3), at.a.toFixed(6), at.L.toFixed(6)]);
  f.seek(RETURN[1]);
  assert.deepEqual(cells(f), [at.w.toFixed(3), at.z.toFixed(3), at.a.toFixed(6), at.L.toFixed(6)]);
  assert.equal(f.root.dataset.liveW, String(values.w));
});

test('one-chain: the dial turn moves the forward values and moves nothing backward', t => {
  const f = fixture(t, NAME);
  const values = declared(f);
  const {locals, product} = chain(values);
  f.load(); f.open();
  const backward = () => JSON.parse(f.root.dataset.locals);
  const turnedSeen = new Set();
  let sawTurned = false;
  // Every time from the Nudge beat to the Hold beat: the kept values and every backward
  // number are frozen at the un-turned weight while w itself is somewhere else.
  for (let time = scene.beats[2]; time <= scene.beats[8]; time += 0.05) {
    f.seek(Number(time.toFixed(2)));
    const w = Number(f.root.dataset.liveW);
    turnedSeen.add(Number(w.toFixed(4)));
    if (Math.abs(w - values.w) > 1e-9) sawTurned = true;
    backward().forEach((value, k) => close(value, locals[k], 1e-12));
    close(Number(f.root.dataset.product), product, 1e-12);
    JSON.parse(f.root.dataset.cached).forEach((value, k) =>
      close(value, [reference(values.w, values).z, reference(values.w, values).a,
        reference(values.w, values).L][k], 1e-12));
    // The live forward values follow w, and only w.
    const live = reference(w, values);
    JSON.parse(f.root.dataset.forward).forEach((value, k) =>
      close(value, [live.z, live.a, live.L][k], 1e-12));
    // The displayed value at each node is a real forward pass at the w the nudge has
    // delivered there -- never a linear fake -- and the nudge reaches z, then a, then L.
    const arrival = JSON.parse(f.root.dataset.arrival);
    assert.equal(arrival.length, 3);
    arrival.forEach((p, k) => {
      assert(p >= 0 && p <= 1, `arrival[${k}] = ${p} at ${time}s`);
      const at = reference(values.w + values.dw * p, values);
      assert.equal(cells(f)[k + 1], [at.z.toFixed(3), at.a.toFixed(6), at.L.toFixed(6)][k], `displayed ${NODES[k + 1]} at ${time}s`);
    });
    assert(arrival[0] >= arrival[1] - 1e-12 && arrival[1] >= arrival[2] - 1e-12, `the nudge reached a later node first at ${time}s: ${arrival}`);
    assert(Math.max(...arrival) <= (w - values.w) / values.dw + 1e-9, `a value ran ahead of the dial at ${time}s`);
    if (time >= RETURN[1]) assert.deepEqual(arrival, [0, 0, 0], `the nudge lingers after the return at ${time}s`);
  }
  assert(sawTurned, 'the dial never actually turned');
  assert(turnedSeen.size > 20, `the turn was not continuous: ${turnedSeen.size} positions`);
  assert(turnedSeen.has(Number((values.w + values.dw).toFixed(4))), 'the turn never reached w + Δw');
  // The revealed factors say the same thing the dataset does.
  f.seek(scene.beats[7]);
  assert(tex(f, 'fac-3').includes(locals[0].toFixed(6)) && tex(f, 'fac-2').includes(locals[1].toFixed(6))
    && tex(f, 'fac-1').includes(`{${locals[2]}}`));
  assert.equal(Number(f.root.dataset.revealed), 3);
});

test('one-chain: a fifty-times larger nudge moves the measurement and nothing else', t => {
  const f = fixture(t, NAME);
  const values = declared(f);
  const {locals, product} = chain(values);
  // Not a manuscript edit: moving the declared nudge is the unit check that the backward
  // pass reads the kept values. If any local derivative were computed from the turned
  // weight, these three numbers would move with it.
  f.root.dataset.nudge = '0.5';
  f.load(); f.seek(scene.duration);
  assert.deepEqual(JSON.parse(f.root.dataset.locals).map((v, k) => (k === 2 ? String(v) : v.toFixed(6))),
    [locals[0].toFixed(6), locals[1].toFixed(6), String(locals[2])]);
  assert.equal(Number(f.root.dataset.product).toFixed(6), product.toFixed(6));
  assert(tex(f, 'fac-3').includes(locals[0].toFixed(6)) && tex(f, 'prod').includes(product.toFixed(6)));
  const moved = slope({...values, dw: 0.5}, 0.5);
  assert.equal(Number(f.root.dataset.measured).toFixed(6), moved.toFixed(6));
  assert.notEqual(moved.toFixed(6), '0.338046');
  // A half-unit step is far too coarse to pass for the derivative, and the panel shows it:
  // the hand-typed labels that depend on the nudge were rewritten at mount, and the ones
  // that do not were left alone.
  assert(Math.abs(moved - product) > 1e-3);
  assert(tex(f, 'ratio').includes(moved.toFixed(6)) && !tex(f, 'ratio').includes('0.338046'));
  const rewritten = f.root.dataset.fixtureRewritten.split(' ');
  for (const name of ['dw', 'dz', 'da', 'dL', 'dw-n', 'dz-n', 'da-n', 'dL-n', 'ratio']) assert(rewritten.includes(name), `${name} was not rewritten`);
  for (const name of ['fac-3', 'fac-2', 'fac-1', 'prod', '1', '1n']) assert(!rewritten.includes(name), `${name} was rewritten`);
  // With the shipped fixture nothing is rewritten: the panel's TeX is already the arithmetic.
  const shipped = fixture(t, NAME); shipped.load();
  assert.equal(shipped.root.dataset.fixtureRewritten, '');
});

test('one-chain: each backward factor appears only when its own ray arrives, right to left', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const FACTOR = ['fac-3', 'fac-2', 'fac-1'], DER = ['der-3', 'der-2', 'der-1'], LIT = ['is-f3', 'is-f2', 'is-f1'];
  // Before the first blame beat: no ray has left, no factor is written, the formula is absent.
  f.seek(scene.beats[4] - 0.01);
  [0, 1, 2].forEach(k => { assert.equal(ray(f, `b${k}`), 0); assert(!revealed(f, FACTOR[k])); assert(!revealed(f, DER[k])); });
  assert(!formula(f).classList.contains('is-shown'));
  for (const k of [0, 1, 2]) {
    // At its own beat the ray has not travelled, so the factor is still absent.
    f.seek(scene.beats[4 + k]);
    assert.equal(ray(f, `b${k}`), 0, `ray b${k} is already complete at its beat`);
    assert(!revealed(f, FACTOR[k]), `factor ${k} written before its ray left`);
    let travelled = 0;
    for (const time of times(scene.beats[4 + k], scene.beats[5 + k] - 0.05)) {
      f.seek(time);
      const amount = ray(f, `b${k}`);
      if (amount > 0 && amount < 1) travelled += 1;
      assert.equal(revealed(f, FACTOR[k]), amount >= 1, `factor ${k} and ray b${k} disagree at ${time}s (ray ${amount})`);
      assert.equal(revealed(f, DER[k]), amount >= 1, `derivation ${k} and ray b${k} disagree at ${time}s`);
      assert.equal(formula(f).classList.contains(LIT[k]), amount >= 1, `${LIT[k]} and ray b${k} disagree at ${time}s`);
      // A travelling ray carries its head; an arrived ray keeps exactly one head.
      assert.equal(f.root.querySelectorAll(`[data-arrow="b${k}"]`).length, amount > 0 ? 1 : 0, `heads on b${k} at ${time}s`);
      // Only one ray moves at a time: the others are at rest.
      [0, 1, 2].filter(j => j !== k).forEach(j => assert([0, 1].includes(ray(f, `b${j}`)), `ray b${j} moves during beat ${4 + k}`));
    }
    assert(travelled > 10, `ray b${k} did not travel: ${travelled} intermediate frames`);
    f.seek(SWEEP[k][1]);
    assert.equal(ray(f, `b${k}`), 1);
    assert(revealed(f, FACTOR[k]) && revealed(f, DER[k]) && formula(f).classList.contains(LIT[k]));
    assert.equal(Number(f.root.dataset.revealed), k + 1);
  }
  // The formula line appears when the dial is home, with every factor still dim.
  f.seek(FORMULA_AT - 0.01); assert(!formula(f).classList.contains('is-shown'));
  f.seek(FORMULA_AT); assert(formula(f).classList.contains('is-shown'));
  for (const cls of [...LIT, 'is-prod']) assert(!formula(f).classList.contains(cls), `${cls} lit before its arrival`);
});

test('one-chain: the product lands under the measurement, never before it', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  let onlyMeasured = 0;
  for (const time of times(0, scene.duration, 0.1)) {
    f.seek(time);
    const measured = revealed(f, 'ratio'), product = revealed(f, 'prod');
    if (product) assert(measured, `the product appeared first, at ${time}s`);
    assert.equal(measured, time >= RATIO_AT, `ratio at ${time}s`);
    assert.equal(product, time >= PRODUCT_AT, `product at ${time}s`);
    assert.equal(formula(f).classList.contains('is-prod'), product, `is-prod at ${time}s`);
    if (measured && !product) onlyMeasured += 1;
  }
  assert(onlyMeasured > 100, 'the measurement never stood alone before the chain answered');
  // "Under" is geometric: both labels are centred on the L node, the product below the ratio.
  const box = name => ['x', 'y', 'width'].map(key => Number(label(f, name).getAttribute(key)));
  const [rx, ry, rw] = box('ratio'), [px, py, pw] = box('prod');
  close(rx + rw / 2, GEOMETRY.wide.nx[3], 1e-9); close(px + pw / 2, GEOMETRY.wide.nx[3], 1e-9);
  assert(py > ry, 'the product sits above the measured ratio');
  assert(ry > GEOMETRY.wide.line, 'the two ratios are not below the chain line');
});

test('one-chain: the nudge is one orange bar whose height is rescaled geometrically at every edge', t => {
  const f = fixture(t, NAME);
  const values = declared(f); f.load(); f.open();
  const inc = increments(values), {px} = GEOMETRY.wide;
  const height = () => Number(bar(f).getAttribute('height'));
  const centre = () => Number(bar(f).getAttribute('x')) + Number(bar(f).getAttribute('width')) / 2;
  // Born on the dial's rim as it turns: the bar grows from nothing to the size of Δw.
  f.seek(TURN[0]); assert(!bar(f).hasAttribute('hidden')); close(height(), 0, 1e-9);
  f.seek(TURN[1]); close(height(), inc[0] * px, 1e-6); close(centre(), GEOMETRY.wide.barX[0], 1e-9);
  // Parked at each node between hops, standing exactly the nudge's height there.
  for (const [k, time] of [[0, HOP[0][0]], [1, HOP[0][1]], [1, HOP[1][0]], [2, HOP[1][1]], [2, HOP[2][0]], [3, HOP[2][1]], [3, RATIO_AT], [3, RETURN[0]]]) {
    f.seek(time);
    close(height(), inc[k] * px, 1e-6, `height at ${time}s`);
    close(centre(), GEOMETRY.wide.barX[k], 1e-9, `position at ${time}s`);
  }
  // Mid-hop the height is the geometric mean of the two ends: x2 and x0.2 read as scalings.
  HOP.forEach(([start, end], k) => {
    f.seek((start + end) / 2);
    close(height(), Math.sqrt(inc[k] * inc[k + 1]) * px, 1e-6, `mid-hop ${k}`);
    const x = centre();
    assert(x > GEOMETRY.wide.barX[k] && x < GEOMETRY.wide.barX[k + 1], `the bar is off its edge mid-hop ${k}`);
  });
  // The bar only ever moves right, and its height is always a real increment or between two.
  let last = -Infinity;
  for (const time of times(TURN[0], RETURN[0])) {
    f.seek(time);
    const x = centre();
    assert(x >= last - 1e-9, `the bar moved left at ${time}s`);
    last = x;
    assert(height() <= Math.max(...inc) * px + 1e-6 && height() >= 0);
  }
  // The dial's return fades it out where it stands, and from then on it is gone; its ghost stays.
  f.seek(RETURN[0] + 0.5);
  const opacity = Number(bar(f).getAttribute('opacity'));
  assert(opacity > 0 && opacity < 1, `the bar is not fading at ${RETURN[0] + 0.5}s: ${opacity}`);
  f.seek(RETURN[1]); assert(bar(f).hasAttribute('hidden'));
  f.seek(scene.duration); assert(bar(f).hasAttribute('hidden'));
  assert.equal(ghosts(f).length, 4);
  // One orange, the parameter's: the bar and its ghosts share the class the stylesheet paints.
  assert.match(css, /\.oc-bar \{ fill: var\(--oc-parameter\)/);
  assert.match(css, /\.oc-ghost \{ fill: none; stroke: var\(--oc-parameter\)/);
});

test('one-chain: each ghost and its Δ label are written on arrival, in order, at the nudge\'s height', t => {
  const f = fixture(t, NAME);
  const values = declared(f); f.load(); f.open();
  const inc = increments(values), {px, barX, line} = GEOMETRY.wide;
  const DELTA = ['dw', 'dz', 'da', 'dL'], SHORT = ['dw-n', 'dz-n', 'da-n', 'dL-n'];
  const arrivals = [TURN[1], HOP[0][1], HOP[1][1], HOP[2][1]];
  arrivals.forEach((time, k) => {
    f.seek(time - 0.01);
    assert.equal(ghosts(f).length, k, `ghosts just before arrival ${k}`);
    assert(!revealed(f, DELTA[k]), `${DELTA[k]} written before arrival`);
    f.seek(time);
    assert.equal(ghosts(f).length, k + 1, `ghosts at arrival ${k}`);
    assert.equal(Number(f.root.dataset.ghosts), k + 1);
    assert(revealed(f, DELTA[k]), `${DELTA[k]} not written on arrival`);
    DELTA.forEach((name, j) => assert.equal(revealed(f, name), j <= k, `${name} at ${time}s`));
    SHORT.forEach((name, j) => assert.equal(revealed(f, name), j <= k, `${name} at ${time}s`));
    // The narrow form of the same label is the bare signed increment, in the same colour.
    assert(tex(f, SHORT[k]).includes(signedIncrement(inc[k], k < 2 ? 3 : 6)) && !tex(f, SHORT[k]).includes('\\Delta'));
    const ghost = f.$(`[data-ghost="${NODES[k]}"]`);
    close(Number(ghost.getAttribute('height')), inc[k] * px, 1e-6, `ghost ${k} height`);
    close(Number(ghost.getAttribute('x')) + Number(ghost.getAttribute('width')) / 2, barX[k], 1e-9);
    close(Number(ghost.getAttribute('y')) + Number(ghost.getAttribute('height')), line, 0.01, `ghost ${k} does not stand on the line`);
    // The Δ label is written to the left of its ghost, where the bar never returns.
    const box = label(f, DELTA[k]);
    assert(Number(box.getAttribute('x')) + Number(box.getAttribute('width')) <= barX[k] - 6, `${DELTA[k]} is under the bar's path`);
  });
  // The ghost heights read as "doubled, shrank five-fold, shrank a little".
  const heights = ghosts(f).map(node => Number(node.getAttribute('height')));
  close(heights[1] / heights[0], values.x, 1e-9);
  assert(heights[2] / heights[1] > 0.19 && heights[2] / heights[1] < 0.22);
  assert(heights[3] / heights[2] > 0.8 && heights[3] / heights[2] < 0.85);
  // The ghosts dim once the dial is home, and are named at six decimals so the ratio checks by eye.
  f.seek(RETURN[1] - 0.01); ghosts(f).forEach(node => assert.equal(node.getAttribute('opacity'), '0.7'));
  f.seek(RETURN[1]); ghosts(f).forEach(node => assert.equal(node.getAttribute('opacity'), '0.45'));
  assert(tex(f, 'dL').includes(`+${inc[3].toFixed(6)}`) && tex(f, 'da').includes(`+${inc[2].toFixed(6)}`));
  assert(tex(f, 'dz').includes(`+${inc[1].toFixed(3)}`) && tex(f, 'dw').includes(`+${inc[0].toFixed(3)}`));
});

test('one-chain: one thing moves at a time — blame leaves only once the dial is home', t => {
  const f = fixture(t, NAME);
  const values = declared(f); f.load(); f.open();
  let returning = 0;
  for (const time of times(RETURN[0], SWEEP[0][0] - 0.05)) {
    f.seek(time);
    assert.equal(ray(f, 'b0'), 0, `blame left while the dial was still returning at ${time}s`);
    if (Number(f.root.dataset.liveW) !== values.w) returning += 1;
  }
  assert(returning > 10, 'the return was not watched while the dial actually moved');
  for (const time of times(SWEEP[0][0], scene.duration)) {
    f.seek(time);
    assert.equal(Number(f.root.dataset.liveW), values.w, `w away from home at ${time}s`);
    if (ray(f, 'b0') > 0) assert(bar(f).hasAttribute('hidden'), `the bar is still there while blame walks at ${time}s`);
  }
  // During the hops nothing else translates: the dial holds, no ray is drawn.
  for (const time of times(HOP[0][0], HOP[2][1])) {
    f.seek(time);
    close(Number(f.root.dataset.liveW), values.w + values.dw, 1e-12);
    [0, 1, 2].forEach(k => assert.equal(ray(f, `b${k}`), 0));
  }
});

test('one-chain: the dial turns one tick, with a ghost needle at home while w is away', t => {
  const f = fixture(t, NAME);
  const values = declared(f); f.load(); f.open();
  const expected = w => -60 + (w - 0.68) / 0.04 * 120;
  const ghostNeedle = () => f.$('[data-ghost-needle]');
  for (const time of times(0, scene.duration, 0.1)) {
    f.seek(time);
    const w = Number(f.root.dataset.liveW);
    close(needleAngle(f), expected(w), 0.01, `needle at ${time}s`);
    assert.equal(ghostNeedle().hasAttribute('hidden'), w === values.w, `ghost needle at ${time}s (w = ${w})`);
  }
  f.seek(TURN[1]); close(needleAngle(f), 30, 0.01); close(Number(f.root.dataset.liveW), values.w + values.dw, 1e-12);
  f.seek(RETURN[1]); close(needleAngle(f), 0, 0.01);
  assert.equal(f.root.querySelectorAll('[data-tick]').length, 5);
  assert.equal(f.$('[data-value="w"]').textContent, values.w.toFixed(3));
  f.seek(TURN[1]); assert.equal(f.$('[data-value="w"]').textContent, (values.w + values.dw).toFixed(3));
});

test('one-chain: the beats hold long enough to read at the default speed', () => {
  const b = scene.beats;
  assert.equal(b.length, 9);
  assert(b[4] - b[3] >= 3, 'the measured ratio stands for less than two real seconds');
  assert(b[8] - b[7] >= 3, 'the product stands for less than two real seconds');
  assert(scene.duration - b[8] >= 3, 'the hold is shorter than two real seconds');
  assert(b[2] - 10 >= 1.3, 'the forward values do not stand before the dial turns');
  assert(b[7] - SWEEP[2][1] >= 1.5, 'the third factor does not stand before the product lands');
});

test('one-chain: seeking is deterministic — the same time rebuilds the whole scene', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  // Everything the scene publishes or draws, minus the two attributes the transport owns.
  // The published data-* attributes are in here as well as the drawing, so a value that
  // depends on how the reader arrived — a counter, an accumulated phase, a cached last
  // frame — fails this even when it never reaches the picture.
  const snapshot = () => JSON.stringify({
    published: [...f.root.attributes].map(a => `${a.name}=${a.value}`)
      .filter(text => text.startsWith('data-') && !/^data-(time|playing)=/.test(text)).sort(),
    pane: canonicalMarkup(f.$('[data-pane]').innerHTML.replace(/aria-valuetext="[^"]*"/g, '')),
    reveals: LABELS.map(name => `${name}:${revealed(f, name)}`),
    bar: bar(f).outerHTML, ghosts: ghosts(f).map(node => node.outerHTML),
    needle: f.$('[data-needle]').getAttribute('transform'), formula: formula(f).className
  });
  const probes = [0, 3, 5, 9.4, 12, 13.5, 15, 17, 21, 22, 24, 24.6, 26, 27, 30, 31, 34, 36, 37.2, 40];
  const forwards = probes.map(time => (f.seek(time), snapshot()));
  // Arrive at each probe from somewhere else entirely: mid-play, then backwards.
  f.play(); f.tick(4000); f.seek(11); f.play(); f.tick(2500);
  const backwards = [...probes].reverse().map(time => (f.seek(time), snapshot()));
  assert.deepEqual(backwards, [...forwards].reverse());
  assert(!f.playing);
  assert(new Set(forwards).size >= 18, 'the probes barely move the scene, so this proves little');
});

test('one-chain: each declared beat advances the stage, and the panel carries no strip, cards or ledgers', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const stages = [];
  for (const beat of scene.beats) { f.seek(beat); stages.push(Number(f.root.dataset.stage)); }
  assert.deepEqual(stages, scene.beats.map((_, index) => index));
  assert.equal(f.root.querySelectorAll('.mechanism-stages').length, 0, 'no stage strip');
  assert.equal(f.root.querySelectorAll('[data-pane] dl, [data-pane] table, [data-pane] section, [data-pane] h4').length, 0, 'no cards, no tables');
  assert.equal(f.root.querySelectorAll('[data-pane] [data-box], [data-pane] [data-local], [data-pane] [data-cache], [data-pane] [data-chain-terms]').length, 0, 'the rejected build\'s hooks are gone');
  assert.doesNotMatch(f.$('[data-pane]').textContent, /\bcached\b|\bMEASURED\b|\bCHAIN RULE\b|\bbeat \d/, 'chrome words in the pane');
  // The transcript lists the nine beats in order, one item each.
  assert.equal(f.root.querySelectorAll('.mechanism-transcript ol > li').length, scene.beats.length);
  assert.match(f.$('#one-chain-playback-help').textContent, /nine beats/);
});

test('one-chain: no-script readouts are exactly the readouts at the end of the timeline', t => {
  const f = fixture(t, NAME);
  const readouts = () => [
    ...cells(f), ...LABELS.map(name => `${name}:${revealed(f, name)}`),
    String(bar(f).hasAttribute('hidden')), String(ghosts(f).length),
    ...ghosts(f).map(node => node.getAttribute('height')),
    f.$('[data-needle]').getAttribute('transform'), String(f.$('[data-ghost-needle]').hasAttribute('hidden')),
    caption(f).innerHTML, canonicalMarkup(drawing(f)),
    f.$('[data-figure] svg').getAttribute('viewBox'), f.$('[data-figure] svg').getAttribute('aria-label'),
    f.$('[data-figure] svg title').textContent,
    ...LABELS.map(name => ['x', 'y', 'width', 'height', 'data-align'].map(key => label(f, name).getAttribute(key)).join(',')),
    [...formula(f).classList].filter(cls => !cls.startsWith('is-')).join(' ')
  ];
  const before = readouts();
  f.load(); f.seek(scene.duration);
  assert.deepEqual(readouts(), before);
  assert.deepEqual(before.slice(0, 4), ['0.700', '0.900', '0.710950', '0.168879']);
  assert(before.every(text => !String(text).includes('·')), 'the static frame withholds a value');
  assert(LABELS.every(name => before.includes(`${name}:true`)), 'a typeset label is hidden in the static frame');
});

test('one-chain: the static panel differs from the t = 40 render only where script must add', t => {
  // The test above compares an enumerated list of readouts, which is not the same claim as
  // "the panel is byte-equal to the t = 40 render". This one closes that gap from the other
  // side: it takes the whole pane, subtracts exactly the things only a running player can
  // put there, and asserts what is left is identical. The drawing is no exception: the
  // static frame is the player's own t = 40 output. What script adds inside the pane is
  // the formula wrapper's is-* classes (the dimming they drive is gated on [data-ready], so
  // the static frame is fully lit without them) and the playback bar.
  const f = fixture(t, NAME);
  const pane = f.$('[data-pane]');
  const strip = html => {
    const box = f.w.document.createElement('div');
    box.innerHTML = html;
    box.querySelectorAll('[data-controls]').forEach(node => node.remove());
    box.querySelectorAll('[data-formula]').forEach(node =>
      [...node.classList].filter(cls => cls.startsWith('is-')).forEach(cls => node.classList.remove(cls)));
    return canonicalMarkup(box.innerHTML);
  };
  const before = strip(pane.innerHTML);
  f.load(); f.seek(scene.duration);
  const after = strip(pane.innerHTML);
  assert.equal(after, before, 'script changed the panel somewhere the receipt does not name');
  // The subtraction is not vacuous: each named difference is really there before it.
  assert.equal(pane.querySelector('[data-controls]').hidden, false);
  assert.deepEqual([...formula(f).classList].filter(cls => cls.startsWith('is-')).sort(),
    ['is-f1', 'is-f2', 'is-f3', 'is-prod', 'is-shown']);
  assert.equal(f.root.dataset.layout, 'wide'); assert.equal(f.root.dataset.typeset, 'none');
});

test('one-chain: the static frame in panel.html is the player\'s own t = 40 drawing', async () => {
  // scripts/render_static_frames.cjs writes [data-drawing], the SVG title and its
  // aria-label from a fresh render; this pins the committed panel to that output, so
  // editing the player's draw without re-running the generator fails here.
  const {file, before, after} = await staticFrame(NAME);
  assert.equal(after, before, `${path.relative(path.join(__dirname, '..'), file)} is stale: run node scripts/render_static_frames.cjs ${scene.scene}`);
  assert.match(before, /<!-- static-frame[^>]*-->\s*<g data-drawing>[\s\S]*?<\/g>\s*<!-- \/static-frame -->/);
});

test('one-chain: reduced motion delivers the dial, the bar and each ray whole, at their own beats', t => {
  const f = fixture(t, NAME, {reduced: true});
  const values = declared(f); f.load(); f.open();
  const inc = increments(values), {px, barX} = GEOMETRY.wide;
  const rays = () => [0, 1, 2].map(k => ray(f, `b${k}`));
  for (let stage = 0; stage < scene.beats.length; stage++) {
    f.seek(scene.beats[stage]);
    assert.deepEqual(rays(), [0, 1, 2].map(k => (stage >= 4 + k ? 1 : 0)), `partial rays at stage ${stage} under reduced motion`);
    // The dial is snapped: 0.710 for the two beats that turn it, home everywhere else.
    const w = Number(f.root.dataset.liveW);
    close(w, stage === 2 || stage === 3 ? values.w + values.dw : values.w, 1e-12, `dial at stage ${stage}: ${w}`);
    // The bar is parked at L, at the nudge's height there, for the same two beats; then gone.
    if (stage === 2 || stage === 3) {
      assert(!bar(f).hasAttribute('hidden'));
      close(Number(bar(f).getAttribute('height')), inc[3] * px, 1e-6);
      close(Number(bar(f).getAttribute('x')) + Number(bar(f).getAttribute('width')) / 2, barX[3], 1e-9);
    } else assert(bar(f).hasAttribute('hidden'), `the bar is drawn at stage ${stage}`);
    assert.equal(ghosts(f).length, stage >= 2 ? 4 : 0, `ghosts at stage ${stage}`);
    ['dw', 'dz', 'da', 'dL'].forEach(name => assert.equal(revealed(f, name), stage >= 2, `${name} at stage ${stage}`));
    assert.equal(revealed(f, 'ratio'), stage >= 3); assert.equal(revealed(f, 'prod'), stage >= 7);
    ['fac-3', 'fac-2', 'fac-1'].forEach((name, k) => assert.equal(revealed(f, name), stage >= 4 + k, `${name} at stage ${stage}`));
    assert.equal(formula(f).classList.contains('is-shown'), stage >= 4);
    assert.deepEqual(cells(f).map(text => text !== '·'), stage >= 1 ? [true, true, true, true] : [true, false, false, false]);
  }
  // And the sliding version really does slide, so the two modes are not the same scene.
  const sliding = fixture(t, NAME); sliding.load(); sliding.open();
  const between = new Set();
  for (const time of times(scene.beats[2], scene.beats[3] - 0.05)) {
    sliding.seek(time);
    between.add(`${sliding.root.dataset.liveW}|${bar(sliding).getAttribute('x')}|${bar(sliding).getAttribute('height')}`);
  }
  assert(between.size > 60, `the unreduced nudge beat is stepped, not continuous: ${between.size}`);
});

test('one-chain: the layout follows the pane width, and only layout() measures', t => {
  const f = fixture(t, NAME, {width: 600}); f.load(); f.open();
  f.seek(scene.duration);
  const svg = f.$('[data-figure] svg');
  assert.equal(f.root.dataset.layout, 'wide');
  assert.equal(svg.getAttribute('viewBox'), GEOMETRY.wide.viewBox);
  const xs = () => NODES.map(name => f.$(`[data-value="${name}"]`).getAttribute('x'));
  const boxes = () => LABELS.map(name => ['x', 'y'].map(key => label(f, name).getAttribute(key)).join(','));
  assert.deepEqual(xs().map(Number), GEOMETRY.wide.nx);
  const wide = xs(), wideBoxes = boxes();
  // Render never measures: the spy on getBoundingClientRect counts layout() calls only.
  let measured = 0;
  const real = f.w.Element.prototype.getBoundingClientRect;
  f.w.Element.prototype.getBoundingClientRect = function() { measured += 1; return real.call(this); };
  for (let i = 0; i < 50; i++) f.seek(i * 0.8);
  assert.equal(measured, 0, `render() measured the DOM ${measured} times`);
  f.resize(NARROW);
  assert(measured > 0, 'a resize did not measure');
  assert.equal(f.root.dataset.layout, 'narrow');
  assert.equal(svg.getAttribute('viewBox'), GEOMETRY.narrow.viewBox);
  assert.deepEqual(xs().map(Number), GEOMETRY.narrow.nx);
  // The narrow layout swaps the full "Δa = +0.004093" labels for the bare increments by
  // stylesheet; both variants share one reveal state.
  assert.match(css, /#one-chain-excerpt\[data-layout="narrow"\] \.oc-wide-only \{ display: none/);
  assert.match(css, /#one-chain-excerpt:not\(\[data-layout="narrow"\]\) \.oc-narrow-only \{ display: none/);
  ['dw', 'dz', 'da', 'dL'].forEach(name => {
    assert(label(f, name).classList.contains('oc-wide-only') && label(f, `${name}-n`).classList.contains('oc-narrow-only'));
    assert.equal(revealed(f, name), revealed(f, `${name}-n`));
  });
  xs().forEach((x, k) => assert.notEqual(x, wide[k]));
  assert.notDeepEqual(boxes(), wideBoxes, 'the typeset labels did not move with the layout');
  // Same numbers, same reveal state, half the bar scale: the ghosts stand at the narrow heights.
  f.seek(scene.duration);
  const inc = increments(declared(fixture(t, NAME)));
  ghosts(f).forEach((node, k) => close(Number(node.getAttribute('height')), inc[k] * GEOMETRY.narrow.px, 1e-6));
  assert.deepEqual(cells(f), ['0.700', '0.900', '0.710950', '0.168879']);
  // The narrow layout drops the derivation sub-labels by stylesheet, not by reveal state.
  assert.match(css, /#one-chain-excerpt\[data-layout="narrow"\] \.oc-der \{ display: none/);
  ['der-3', 'der-2', 'der-1'].forEach(name => assert(revealed(f, name)));
  f.resize(WIDE);
  assert.equal(f.root.dataset.layout, 'wide');
  assert.deepEqual(xs(), wide);
  assert(!f.playing);
});

test('one-chain: the panel is the only fixture copy — moving it moves every number', t => {
  const f = fixture(t, NAME);
  // Not a manuscript edit: this proves the player reads the declared attributes, so a real
  // chapter change could not leave a stale number behind in the scene script, the SVG or
  // the hand-typed TeX.
  f.root.dataset.w = '0';
  f.root.dataset.x = '1';
  f.root.dataset.b = '0';
  f.root.dataset.y = '0.5';
  f.load(); f.seek(scene.duration);
  // sigma(0) = 1/2 exactly, so the loss, its slope and the whole chain are exactly zero.
  assert.equal(f.$('[data-value="a"]').textContent, '0.500000');
  assert.equal(f.$('[data-value="L"]').textContent, '0.000000');
  assert.equal(Number(f.root.dataset.product).toFixed(6), '0.000000');
  // The product is printed to six decimals; a factor that is exactly an integer prints as
  // one, the same rule that prints the chapter's x = 2 as "2".
  assert(tex(f, 'prod').includes('{0.000000}') && tex(f, 'fac-3').includes('{0}'));
  const pane = f.$('[data-pane]').textContent;
  for (const stale of ['0.337801', '0.338046', '0.821899', '0.205500', '0.710950', '0.168879', '0.003380', '0.004093', '0.020'])
    assert(!pane.includes(stale), `${stale} survived a moved fixture`);
  assert(f.root.dataset.fixtureRewritten.split(' ').length >= 10, `only ${f.root.dataset.fixtureRewritten} were rewritten`);
  assert.doesNotMatch(f.$('[data-figure] svg title').textContent, /0\.337801|0\.710950/);
});

test('one-chain: a rewritten label is typeset again, and only that label', async t => {
  // The provenance check rewrites a span whose TeX disagrees with the fixture, before the
  // one typeset call; with MathJax present that call then covers exactly the rewritten
  // spans, so the corrected TeX is what the reader sees.
  const f = fixture(t, NAME, {mathjax: 'stub'});
  f.root.dataset.nudge = '0.5';
  f.load(); f.open();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.typesets.length, 1);
  const targets = f.typesets[0];
  const names = f.root.dataset.fixtureRewritten.split(' ');
  assert.deepEqual(names, ['dw', 'dz', 'da', 'dL', 'dw-n', 'dz-n', 'da-n', 'dL-n', 'ratio']);
  // The call covers every rewritten span and no other: each target is the box around
  // one rewritten label, never the whole panel.
  const covered = f.formulas().filter(span => targets.some(node => node === span || node.contains(span))).map(span => span.id).sort();
  assert.deepEqual(covered, names.map(name => `eq-one-chain-${name}`).sort());
  assert(targets.every(node => node !== f.root && !node.contains(f.$('[data-pane]'))));
  assert.equal(f.root.dataset.typeset, 'mathjax');
  // Every rewritten span now holds typeset output and its corrected TeX was what went in.
  for (const name of names) assert(f.d.getElementById(`eq-one-chain-${name}`).querySelector('mjx-container'));
});

test('one-chain: the twenty-seven formulas are TeX in eq- wrappers, in the book\'s macro colours, never rewritten', t => {
  const f = fixture(t, NAME);
  const values = declared(f);
  const {locals, product} = chain(values), measured = slope(values, values.dw);
  const ids = [...LABELS, '1', '1n'];
  for (const name of ids) {
    const span = f.d.getElementById(`eq-one-chain-${name}`);
    assert(span, `eq-one-chain-${name} missing`);
    assert.match(span.textContent.trim(), /^(\\\([\s\S]+\\\)|\\\[[\s\S]+\\\])$/, `${name} is not delimited TeX`);
  }
  assert.equal(f.root.querySelectorAll('span[id^="eq-one-chain-"]').length, ids.length);
  // Colour = meaning, inside the TeX: w orange, x blue, a green, y purple, L wine.
  assert.equal(tex(f, 'map-1'), '\\(z = \\parameterpart{w}\\featurepart{x} + b\\)');
  assert.equal(tex(f, 'map-2'), '\\(\\predictionpart{a} = \\sigma(z)\\)');
  assert.equal(tex(f, 'map-3'), '\\(\\residualpart{L} = (\\predictionpart{a} - \\targetpart{y})^2\\)');
  assert.equal(tex(f, 'const-1'), `\\(\\featurepart{x = ${values.x}}\\qquad b = ${values.b}\\)`);
  assert.equal(tex(f, 'const-3'), `\\(\\targetpart{y = ${values.y}}\\)`);
  assert.equal(tex(f, 'letter-w'), '\\(\\parameterpart{w}\\)'); assert.equal(tex(f, 'letter-L'), '\\(\\residualpart{L}\\)');
  assert.equal(tex(f, 'fac-3'), `\\(\\times\\,\\residualpart{${locals[0].toFixed(6)}}\\)`);
  assert.equal(tex(f, 'fac-2'), `\\(\\times\\,\\predictionpart{${locals[1].toFixed(6)}}\\)`);
  assert.equal(tex(f, 'fac-1'), `\\(\\times\\,\\featurepart{${locals[2]}}\\)`);
  assert.equal(tex(f, 'der-3'), '\\(= 2(\\predictionpart{a} - \\targetpart{y})\\)');
  assert.equal(tex(f, 'der-2'), '\\(= \\predictionpart{a}(1 - \\predictionpart{a})\\)');
  assert.equal(tex(f, 'der-1'), '\\(= \\featurepart{x}\\)');
  assert.equal(tex(f, 'ratio'), `\\(\\residualpart{\\Delta L/\\Delta w = ${measured.toFixed(6)}}\\)`);
  assert.equal(tex(f, 'prod'), `\\(\\partial \\residualpart{L}/\\partial \\parameterpart{w} = \\residualpart{${product.toFixed(6)}}\\)`);
  // The formula line: @eq-chain's three factors, each wrapped in the class the player lights,
  // the symbolic and the numeric forms sharing one class per factor, and the product.
  for (const name of ['1', '1n']) {
    const line = tex(f, name);
    assert(line.includes('\\dfrac{\\partial \\residualpart{L}}{\\partial \\parameterpart{w}}'), `${name} lacks the left-hand side`);
    for (const [cls, symbolic, numeric] of [['oc-f3', '\\residualpart{2(\\predictionpart{a}-\\targetpart{y})}', `\\residualpart{${locals[0].toFixed(6)}}`],
      ['oc-f2', '\\predictionpart{\\sigma\'(z)}', `\\predictionpart{${locals[1].toFixed(6)}}`],
      ['oc-f1', '\\featurepart{x}', `\\featurepart{${locals[2]}}`]]) {
      assert(line.includes(`\\class{${cls}}{${symbolic}}`), `${name} lacks the symbolic ${cls}`);
      assert(line.includes(`\\class{${cls}}{${numeric}}`), `${name} lacks the numeric ${cls}`);
      assert.equal(line.split(`\\class{${cls}}`).length - 1, 2, `${cls} appears twice in ${name}`);
    }
    assert(line.includes(`\\class{oc-prod}{\\residualpart{${product.toFixed(6)}}}`), `${name} lacks the product`);
  }
  assert.match(tex(f, '1n'), /^\\\[ \\begin\{aligned\}[\s\S]*\\\\ &=[\s\S]*\\\\ &= \\class\{oc-prod\}[\s\S]*\\end\{aligned\} \\\]$/,
    'the narrow form breaks before the numbers and before the product, so nothing overflows a phone');
  assert.equal(tex(f, '1n').split('\\\\').length - 1, 2, 'three rows at narrow width');
  // No live number ever sits inside a formula: the values under the nodes are SVG text.
  for (const name of ids) assert.doesNotMatch(tex(f, name), /0\.710950|0\.900|0\.168879|0\.7(00)?\b(?!\d)/);
  // And every one of them survives the whole timeline unchanged.
  const before = ids.map(name => tex(f, name));
  f.load(); f.open();
  for (const time of times(0, scene.duration)) {
    f.seek(time);
    ids.forEach((name, i) => assert.equal(tex(f, name), before[i], `${name} rewritten at ${time}s`));
  }
});

test('one-chain: the CSS the player toggles exists, so every class it sets changes something', () => {
  // JSDOM cannot compute MathJax's boxes; what it can hold is that each class the player
  // writes has a rule in player.css, that the dimming is gated on [data-ready] so the
  // static frame is fully lit, and that the colours are the macro colours.
  const rule = pattern => assert.match(css, pattern, `player.css lacks ${pattern}`);
  rule(/\.mechanism-excerpt\[data-ready\] \.oc-formula:not\(\.is-shown\) \{ visibility: hidden/);
  for (const part of ['f3', 'f2', 'f1', 'prod']) rule(new RegExp(`\\.mechanism-excerpt\\[data-ready\\] \\.oc-formula:not\\(\\.is-${part}\\) \\.oc-${part} \\{ opacity: \\.18`));
  rule(/#one-chain-excerpt\[data-layout="narrow"\] #eq-one-chain-1 \{ display: none/);
  rule(/#one-chain-excerpt:not\(\[data-layout="narrow"\]\) #eq-one-chain-1n \{ display: none/);
  rule(/@media \(max-width: 600px\)[\s\S]*#one-chain-excerpt:not\(\[data-layout\]\) #eq-one-chain-1n \{ display: inline/);
  rule(/foreignObject\[data-align="end"\] \.oc-label \{ justify-content: flex-end/);
  // No hiding rule outside [data-ready]: the static fallback is complete without script.
  assert.doesNotMatch(css, /\.mechanism-excerpt:not\(\[data-ready\]\)/);
  // Colour = meaning: one orange, the macro's; wine and purple overridden within this root.
  rule(/--oc-parameter: #c05621/); rule(/--oc-input: #2b6cb0/); rule(/--oc-prediction: #2f855a/);
  rule(/--oc-target: #805ad5/); rule(/--oc-error: #722f37/);
  rule(/#one-chain-excerpt \.one-chain-parameter, #one-chain-excerpt \.oc-w \{ color: var\(--oc-parameter\)/);
  rule(/#one-chain-excerpt \.target-role, #one-chain-excerpt \.oc-y \{ color: var\(--oc-target\)/);
  rule(/#one-chain-excerpt \.error-role, #one-chain-excerpt \.oc-L \{ color: var\(--oc-error\)/);
  rule(/\.oc-blame \{ stroke: var\(--oc-error\)/); rule(/\.oc-ink \{ stroke: var\(--oc-input\)/);
  rule(/\.oc-dial \{ fill: #fff; stroke: var\(--oc-parameter\)/); rule(/\.oc-needle-ghost \{ stroke-dasharray/);
  for (const foreign of ['#B45309', '#b45309', '#9b2c4c', '#7950b8', '#E57200', '#e57200']) assert(!css.includes(foreign), `${foreign} in player.css`);
  assert.doesNotMatch(css, /text-decoration\s*:/);
});

test('one-chain: captions are prose within the budget, coloured by meaning, and name the numbers on the picture', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const seen = new Set();
  const expect = [/Turn .*up by .*0\.01/, /Forward, left to right/, /nudge doubles.*0\.003380/, /Measured: 0\.003380 per 0\.010, so 0\.338046/,
    /returns to 0\.700.*0\.821899/, /second edge.*0\.205500/, /third edge.*x = 2/, /0\.337801 beside 0\.338046/, /Nothing was updated/];
  scene.beats.forEach((beat, stage) => {
    f.seek(beat);
    const html = caption(f).innerHTML, text = caption(f).textContent.trim();
    assert.match(text, expect[stage], `caption at beat ${stage}`);
    assert.doesNotMatch(html, /<sup|<sub|\^|e\^|\bexp\(|∂|σ|×/, `pseudo-math in the caption at ${beat}s: ${html}`);
    const words = text.split(/\s+/).filter(Boolean).length;
    assert(words > 0 && words <= 20, `caption at ${beat}s has ${words} words`);
    for (const role of ['oc-w', 'oc-L', 'oc-a', 'oc-x']) if (html.includes(`class="${role}"`)) seen.add(role);
  });
  assert.deepEqual([...seen].sort(), ['oc-L', 'oc-a', 'oc-w', 'oc-x'], 'the caption words carry the picture\'s colours');
  // The picture reads without colour: the SVG title names the dial, the nudge and both slopes.
  assert.match(f.$('[data-figure] svg title').textContent, /dial w at 0\.700.*nudge of \+0\.010.*measured slope 0\.338046.*chain-rule product/);
  assert.match(f.$('.mechanism-transcript').textContent, /ghosts of the nudge stay/);
});

test('integration: the excerpt is HTML-only, manifest-driven, and declared in the config', () => {
  const filter = fs.readFileSync(path.join(__dirname, '..', scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/,
    'the non-HTML guard is the first executable line, so the PDF is untouched');
  assert.match(filter, /pandoc\.json\.decode/, 'the scene is data in the manifest, not code in the filter');
  assert.match(filter, /"after-cell"/, 'the filter must be able to place this scene\'s anchor kind');
  assert.match(filter, /assert\(inserted == 1/);
  assert.doesNotMatch(filter, /one-chain|backprop/i, 'a manifest-driven filter names no scene');
  const config = fs.readFileSync(path.join(__dirname, '..', '_quarto.yml'), 'utf8');
  const section = (key, text) => {
    const start = text.indexOf(`\n${key}`);
    assert(start >= 0, `${key} is missing from _quarto.yml`);
    const rest = text.slice(start + 1 + key.length);
    const end = rest.search(/\n\S/);
    return end < 0 ? rest : rest.slice(0, end);
  };
  // Only the scene script is fetched by a reader; the panel, the styles and the manifest
  // are read from the project directory while the book builds.
  assert.match(section('  resources:', config),
    new RegExp(`^\\s+- interactives/${scene.scene}/player\\.js$`, 'm'));
  assert.match(section('filters:', config),
    new RegExp(`^\\s+- ${scene.filter.replace(/[/.]/g, '\\$&')}$`, 'm'));
  assert(!section('  resources:', config).includes(`${scene.scene}/panel.html`));
  // The chapter is anchored on a labelled executable cell, so Quarto emits cell-<label>.
  assert.equal(scene.anchor.type, 'after-cell');
  assert.match(chapterSource(NAME),
    new RegExp(`^#\\|\\s*label:\\s*${scene.anchor.target.slice('cell-'.length)}\\s*$`, 'm'));
  const panel = read(`${scene.scene}/panel.html`);
  assert.equal(panel.includes('data-playback='), scene.transport === 'shared');
  assert(manifest.scenes.some(other => other.id === NAME));
  assert.deepEqual(scene.beats, [0, 5, 12, 21, 24, 27, 30, 34, 37]);
  // The panel names the chapter cell its numbers come from, because that cell is printed
  // three hundred lines below this anchor.
  assert.match(panel, /micro-autograd-check/);
  // Rule 5 of the visual grammar: every formula is typeset TeX in an eq- wrapper, and the
  // SVG's own text carries digits, dots and the withheld mark only -- no Unicode operators.
  const spans = panel.match(/<span id="eq-one-chain-[^"]+">[\s\S]*?<\/span>/g) || [];
  assert(spans.length >= 27, `${spans.length} eq- spans`);
  for (const span of spans) assert.match(span, /\\\(|\\\[/, `${span.slice(0, 40)} holds no TeX`);
  for (const text of panel.match(/<text[^>]*>[^<]*<\/text>/g) || []) assert.match(text, />[\d.·]*<\/text>$/, `SVG text is not a bare number: ${text}`);
  assert.doesNotMatch(panel, /<text[^>]*>[^<]*[∂σ×Δ][^<]*<\/text>/);
  assert.doesNotMatch(panel, /mechanism-stages|one-chain-chip|one-chain-locals|one-chain-measure/);
  // The wide and narrow formulas agree factor for factor.
  const literal = /\\class\{(oc-[\w]+)\}\{[^{}]*\{([^{}]*)\}\}/g;
  const pick = id => [...(panel.match(new RegExp(`<span id="${id}">([\\s\\S]*?)</span>`))[1]).matchAll(literal)].map(m => `${m[1]}=${m[2]}`);
  assert.deepEqual(pick('eq-one-chain-1'), pick('eq-one-chain-1n'));
  assert(pick('eq-one-chain-1').includes('oc-prod=0.337801'));
});
