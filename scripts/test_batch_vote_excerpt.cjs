#!/usr/bin/env node
// Test-only arithmetic, geometry and reveal checks for the Chapter 4 batch-size excerpt.
// Nothing here ships: the suite rebuilds the declared toy problem, the declared batch
// family and the chapter's two laws from the panel's own attributes and compares them
// with what the mounted player publishes and draws.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, close, canonicalMarkup, drawnMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'batch-vote-excerpt', scene = entry(NAME);
const WIDTHS = [296, 360, 460, 519, 520, 640, 713];
// Drawing coordinates are serialised at 0.0001 px; the published state is never rounded.
const PX = 1e-4;
const B = scene.beats, D = scene.duration, FULL = B[7] + 3;
// Reduced motion rests a glide beat on its finished state, and the last beat on B = n.
const REST = [B[0], B[1], B[2], B[4], B[4], B[6], B[6], FULL];
const RECORDED = [B[1], B[4], B[6], FULL];

const attr = (node, key) => Number(node.getAttribute(key));
const visible = node => Boolean(node) && !node.closest('[hidden]');
const drawing = f => f.$('[data-drawing]');
const declared = f => ({
  features: numbers(f.root.dataset.features), coefficients: numbers(f.root.dataset.coefficients),
  offset: Number(f.root.dataset.offset), parameters: numbers(f.root.dataset.parameters),
  stops: numbers(f.root.dataset.stops), seed: Number(f.root.dataset.shuffleSeed)
});
const published = f => ({
  stage: Number(f.root.dataset.stage), size: Number(f.root.dataset.batch),
  jitter: Number(f.root.dataset.jitter), independent: Number(f.root.dataset.independent),
  sigma: Number(f.root.dataset.sigma), examples: Number(f.root.dataset.examples),
  truth: JSON.parse(f.root.dataset.truth), estimate: JSON.parse(f.root.dataset.estimate),
  spread: Number(f.root.dataset.spread), opened: f.root.dataset.opened === 'true',
  curves: f.root.dataset.curves === 'true',
  recorded: f.root.dataset.recorded ? numbers(f.root.dataset.recorded) : []
});

// --- an independent oracle for the declared toy problem --------------------------
// Two weights and no bias; the examples are every pair of the declared feature values;
// the targets follow the declared rule plus an offset the model cannot represent; the
// chapter's own gradient convention is 2 r (a, b).
function toy(source) {
  const p = source.parameters[0] - source.coefficients[0];
  const q = source.parameters[1] - source.coefficients[1];
  const gradients = [];
  for (const a of source.features) for (const b of source.features) {
    const residual = p * a + q * b - source.offset;
    gradients.push([2 * residual * a, 2 * residual * b]);
  }
  const n = gradients.length;
  const truth = [gradients.reduce((s, g) => s + g[0], 0) / n, gradients.reduce((s, g) => s + g[1], 0) / n];
  const spread = points => Math.sqrt(points.reduce((s, g) =>
    s + (g[0] - truth[0]) ** 2 + (g[1] - truth[1]) ** 2, 0) / points.length);
  return {gradients, n, truth, sigma: spread(gradients), spread};
}
// The declared batch family, rebuilt: one shuffle of the examples by the same
// linear-congruential Fisher-Yates, then its n cyclic windows of length B.
function family(source, n) {
  const order = [];
  for (let i = 0; i < n; i++) order.push(i);
  let state = source.seed % 4294967296;
  for (let m = n - 1; m > 0; m--) {
    state = (1664525 * state + 1013904223) % 4294967296;
    const j = state % (m + 1);
    [order[m], order[j]] = [order[j], order[m]];
  }
  return order;
}
const windowOfBatch = (order, k, size) =>
  Array.from({length: size}, (_, m) => order[(k + m) % order.length]);
const meanOf = (model, order, k, size) => {
  let w = 0, b = 0;
  for (const index of windowOfBatch(order, k, size)) {
    w += model.gradients[index][0]; b += model.gradients[index][1];
  }
  return [w / size, b / size];
};
const oracle = f => {
  const source = declared(f), model = toy(source);
  const order = family(source, model.n);
  const law = size => model.sigma / Math.sqrt(size) * Math.sqrt((model.n - size) / (model.n - 1));
  const typical = order.reduce((best, index, k) => {
    const g = model.gradients[index];
    const off = Math.abs(Math.hypot(g[0] - model.truth[0], g[1] - model.truth[1]) - model.sigma);
    return off < best.off ? {k, off} : best;
  }, {k: 0, off: Infinity}).k;
  return {source, ...model, order, law, typical,
    independent: size => model.sigma / Math.sqrt(size),
    window: (k, size) => windowOfBatch(order, k, size),
    estimates: size => order.map((_, k) => meanOf(model, order, k, size))};
};
// The schedule, reimplemented: the batch is held, then climbs to each quadrupling in
// whole examples, landing exactly on the stop at the beat the glide leads into.
const ease = u => (1 - Math.cos(Math.PI * Math.max(0, Math.min(1, u)))) / 2;
const mix = (u, a, b) => u === 0 ? a : u === 1 ? b : a + u * (b - a);
function schedule(stops, time) {
  const [one, four, sixteen, all] = stops;
  return time < B[3] ? one
    : time < B[4] ? Math.round(mix(ease((time - B[3]) / (B[4] - B[3])), one, four))
      : time < B[5] ? four
        : time < B[6] ? Math.round(mix(ease((time - B[5]) / (B[6] - B[5])), four, sixteen))
          : time < B[7] ? sixteen
            : time < FULL ? Math.round(mix(ease((time - B[7]) / (FULL - B[7])), sixteen, all))
              : all;
}
const frame = f => ({plane: JSON.parse(f.root.dataset.plane), chart: JSON.parse(f.root.dataset.chart)});
const screen = (g, view, point) => [g.plane.x + (point[0] - view.cx + view.half) * g.plane.scale,
  g.plane.y + g.plane.size - (point[1] - view.cy + view.half) * g.plane.scale];
// The picture's window is computed from the declared population itself.
const windowOf = model => {
  const xs = [...model.gradients.map(g => g[0]), 0, model.truth[0]];
  const ys = [...model.gradients.map(g => g[1]), 0, model.truth[1]];
  return {cx: (Math.min(...xs) + Math.max(...xs)) / 2, cy: (Math.min(...ys) + Math.max(...ys)) / 2,
    half: 1.08 * Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2};
};
const points = node => [...(node.getAttribute('d') || '').matchAll(/(-?[\d.]+)\s+(-?[\d.]+)/g)]
  .map(match => [Number(match[1]), Number(match[2])]);
// One mark of a multi-mark path: each sub-path starts at an M, so the marks are the
// groups between them and a mark's centre is the mean of its own corners.
const marksOf = node => (node.getAttribute('d') || '').split('M').filter(Boolean).map(chunk => {
  const pair = [...chunk.matchAll(/(-?[\d.]+)\s+(-?[\d.]+)/g)].map(m => [Number(m[1]), Number(m[2])]);
  return pair;
});
const diamondCentre = corners => [(corners[1][0] + corners[3][0]) / 2, (corners[0][1] + corners[2][1]) / 2];
function shaft(node) {
  const match = /^M\s+([-+\d.eE]+)\s+([-+\d.eE]+)\s+L\s+([-+\d.eE]+)\s+([-+\d.eE]+)/.exec(node.getAttribute('d'));
  assert(match, 'the arrow has an inspectable straight shaft');
  return [match.slice(1, 3).map(Number), match.slice(3, 5).map(Number)];
}
// JSDOM lays nothing out, so a label's box is estimated from its own content at the ratio
// the player uses and the browser preview confirmed: about 0.55 em per character.
const boxes = f => [...drawing(f).querySelectorAll('text')].filter(visible).map(node => {
  const size = attr(node, 'font-size'), width = node.textContent.length * size * 0.55 + 3;
  const x = attr(node, 'x'), anchor = node.getAttribute('text-anchor');
  const left = anchor === 'start' ? x : anchor === 'end' ? x - width : x - width / 2;
  return {text: node.textContent, left, right: left + width,
    top: attr(node, 'y') - size * 0.8, bottom: attr(node, 'y') + size * 0.25};
});
function mount(t, changes, options = {}) {
  const f = fixture(t, NAME, options);
  for (const [key, value] of Object.entries(changes)) f.root.dataset[key] = String(value);
  return f;
}

registerTransportTests(NAME, {witness: /jitter/, anchors: ['batch-vote-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('batch vote: the chapter owns both laws; the population is a declared toy problem', t => {
  const f = fixture(t, NAME), chapter = chapterSource(NAME);
  assert.equal(scene.qmd, 'chapters/part1/04-training-loss-sgd.qmd');
  assert.equal(scene.anchor.type, 'before-heading');
  assert(chapter.includes(`\n## ${scene.anchor.target}`), 'the declared heading is in the chapter');
  assert.equal(scene.duration, 40);
  assert.deepEqual(scene.beats, [0, 5, 10, 15, 20, 25, 30, 35]);
  assert.equal(f.root.dataset.evidenceClass, 'declared-toy');
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal), literal);
  // The two sentences the scene exists to make visible, and the estimator case it lives in.
  assert.match(chapter, /gradient standard deviation scales like \$1\/\\sqrt\{B\}\$/);
  assert.match(chapter, /For a uniform subset without\nreplacement, multiply by/);
  assert.match(chapter, /finite-population\ncorrection \$\(n-B\)\/\(n-B?B?\)?/);
  assert.match(chapter, /a minibatch average is an unbiased\nestimator of the full objective/);
  assert.match(chapter, /\{#sec-04-estimator-cases\}/);
  // The chapter's own gradient convention, which the toy problem reuses.
  assert.match(chapter, /return 2 \* A\[idx\]\.T @ residual \/ len\(residual\)/);
});

test('batch vote: the declared toy gives an exact population, mean and sigma', t => {
  const f = fixture(t, NAME), model = oracle(f); f.load(); f.open();
  const state = published(f);
  assert.equal(state.examples, model.n);
  assert.equal(model.n, 64);
  // Every gradient component is an exact binary fraction, which is what makes the
  // sixty-four sums at B = n identical and the collapse exact rather than nearly exact.
  for (const g of model.gradients) for (const value of g)
    assert.equal(value * 2, Math.round(value * 2), `${value} is not an exact half-integer`);
  assert.deepEqual(state.truth, [7.5, 3.75]);
  assert.equal(state.truth[0], model.truth[0]);
  assert.equal(state.truth[1], model.truth[1]);
  assert.equal(state.sigma, model.sigma);
  close(model.sigma ** 2, 125.625, 1e-9);
  close(model.sigma, 11.208255885729947, 1e-12);
  // A population whose spread is the thing the batch size is buying down.
  assert(model.sigma > Math.hypot(...model.truth), 'one example is noisier than the mean is long');
});

test('batch vote: both laws are recomputed at every batch size, exactly zero at B = n', t => {
  const f = fixture(t, NAME), model = oracle(f); f.load(); f.open(); f.seek(D);
  const slider = f.$('[data-batch-slider]');
  for (let size = 1; size <= model.n; size++) {
    slider.value = String(size); slider.dispatchEvent(new f.w.Event('input'));
    const state = published(f);
    assert.equal(state.size, size);
    assert.equal(state.independent, model.sigma / Math.sqrt(size), `independent law at B = ${size}`);
    assert.equal(state.jitter, state.independent * Math.sqrt((model.n - size) / (model.n - 1)),
      `finite-population factor at B = ${size}`);
    close(state.jitter, model.law(size), 1e-12);
    assert(state.jitter <= state.independent + 1e-12, 'without replacement is never noisier');
  }
  // The payoff is an identity, not an approximation.
  slider.value = String(model.n); slider.dispatchEvent(new f.w.Event('input'));
  assert.equal(published(f).jitter, 0, 'exactly zero at B = n, not nearly zero');
  assert.equal(f.$('[data-value="jitter"]').textContent, '0.00');
  assert.notEqual(published(f).independent, 0, 'the independent law never reaches zero');
  // The chapter's own rule of thumb, read off the declared population.
  close(model.law(4) / model.law(1), 0.48795003647426655, 1e-12);
  close(model.law(16) / model.law(4), 0.44721359549995787, 1e-12);
  assert.equal(model.law(64) / model.law(16), 0);
  assert.equal(model.law(1), model.sigma, 'at B = 1 the correction is exactly one');
});

test('batch vote: the sixty-four drawn batches are real batches of the declared population', t => {
  const f = fixture(t, NAME), model = oracle(f); f.load(); f.open(); f.seek(D);
  const slider = f.$('[data-batch-slider]');
  assert.equal(new Set(model.order).size, model.n, 'the declared order is a permutation');
  for (const size of [1, 2, 3, 4, 7, 16, 32, 63, 64]) {
    // Every example sits in exactly `size` of the windows, which is what makes the
    // cloud's centre the full-batch gradient rather than merely near it.
    const seen = new Map();
    for (let k = 0; k < model.n; k++) for (const index of model.window(k, size))
      seen.set(index, (seen.get(index) || 0) + 1);
    assert.equal(seen.size, model.n, `every example is in some batch at B = ${size}`);
    for (const count of seen.values()) assert.equal(count, size, `batch balance at B = ${size}`);
    slider.value = String(size); slider.dispatchEvent(new f.w.Event('input'));
    const means = model.estimates(size);
    // Unbiased by construction: every example sits in exactly `size` of the batches, so
    // the centre of the cloud is the full-batch gradient at every batch size.
    const centre = [means.reduce((s, m) => s + m[0], 0) / model.n,
      means.reduce((s, m) => s + m[1], 0) / model.n];
    close(centre[0], model.truth[0], 1e-9); close(centre[1], model.truth[1], 1e-9);
    assert.equal(published(f).spread, model.spread(means));
    // The drawn family's own spread tracks the exact law it is drawn beside.
    if (size < model.n) close(model.spread(means) / model.law(size), 1, 0.05, `spread at B = ${size}`);
  }
  // The two endpoints are exact, not close: a batch of one IS an example, and a batch of
  // n IS the population, so the cloud starts as the population and collapses to a point.
  slider.value = '1'; slider.dispatchEvent(new f.w.Event('input'));
  const sorted = list => [...list].map(g => g.join()).sort();
  assert.deepEqual(sorted(model.estimates(1)), sorted(model.gradients));
  assert.equal(model.spread(model.estimates(1)), model.sigma);
  // Leaving one example out is the other exact case this family gives for free.
  close(model.spread(model.estimates(model.n - 1)), model.law(model.n - 1), 1e-9);
  slider.value = String(model.n); slider.dispatchEvent(new f.w.Event('input'));
  for (const mean of model.estimates(model.n)) assert.deepEqual(mean, model.truth);
  assert.equal(model.spread(model.estimates(model.n)), 0);
  assert.equal(published(f).spread, 0);
});

test('batch vote: the cloud, the population and both arrows are the published numbers', t => {
  for (const width of WIDTHS) {
    const f = fixture(t, NAME, {width}), model = oracle(f), view = windowOf(model); f.load(); f.open();
    for (const time of [0, 5, 10, 15, 17.5, 20, 25, 27.5, 30, 35, 36.5, 38, 40]) {
      f.seek(time);
      const state = published(f), g = frame(f), where = `${width}px, ${time}s`;
      const cloud = marksOf(f.$('[data-cloud]')).map(diamondCentre);
      const want = model.estimates(state.size);
      assert.equal(cloud.length, model.n, `sixty-four estimates at ${where}`);
      for (let k = 0; k < model.n; k++) {
        const point = screen(g, view, want[k]);
        close(cloud[k][0], point[0], PX, `estimate ${k} at ${where}`);
        close(cloud[k][1], point[1], PX, `estimate ${k} at ${where}`);
      }
      // The population never moves, and exactly B of its marks are this batch's.
      const inside = marksOf(f.$('[data-members]')), outside = marksOf(f.$('[data-population]'));
      assert.equal(inside.length, state.size, `lit examples at ${where}`);
      assert.equal(inside.length + outside.length, model.n, `population count at ${where}`);
      // The reference and the estimate: one arrow to the mean, one to this batch's mean.
      const truth = shaft(f.$('[data-truth]')), estimate = shaft(f.$('[data-estimate]'));
      const zero = screen(g, view, [0, 0]), tip = screen(g, view, model.truth);
      const head = screen(g, view, model.estimates(state.size)[model.typical]);
      close(truth[0][0], zero[0], PX); close(truth[0][1], zero[1], PX);
      close(truth[1][0], tip[0], PX, `true gradient tip at ${where}`);
      close(truth[1][1], tip[1], PX, `true gradient tip at ${where}`);
      close(estimate[1][0], head[0], PX, `batch estimate tip at ${where}`);
      close(estimate[1][1], head[1], PX, `batch estimate tip at ${where}`);
      close(attr(f.$('[data-truth-ring]'), 'cx'), tip[0], PX);
      close(attr(f.$('[data-estimate-dot]'), 'cx'), head[0], PX);
      assert.deepEqual(state.estimate, model.estimates(state.size)[model.typical]);
    }
  }
});

test('batch vote: the curve, the reference and the marker are the law drawn twice', t => {
  for (const width of [296, 713]) {
    const f = fixture(t, NAME, {width}), model = oracle(f); f.load(); f.open();
    f.seek(40);
    const g = frame(f);
    const x = size => g.chart.x + g.chart.w * (size - 1) / (model.n - 1);
    const y = value => g.chart.y + g.chart.h * (1 - value / model.sigma);
    for (const [node, law] of [[f.$('[data-curve]'), model.law], [f.$('[data-reference]'), model.independent]]) {
      const drawn = points(node);
      assert.equal(drawn.length, model.n, 'the curve carries one point per batch size');
      for (let size = 1; size <= model.n; size++) {
        close(drawn[size - 1][0], x(size), PX, `curve x at B = ${size}`);
        close(drawn[size - 1][1], y(law(size)), PX, `curve y at B = ${size}`);
      }
    }
    // The solid curve ends on the axis; the dashed one never does.
    close(points(f.$('[data-curve]')).at(-1)[1], g.chart.y + g.chart.h, PX);
    assert(points(f.$('[data-reference]')).at(-1)[1] < g.chart.y + g.chart.h - 10);
    for (const time of [5, 12, 22, 27, 33, 40]) {
      f.seek(time);
      const state = published(f);
      close(attr(f.$('[data-marker]'), 'cx'), x(state.size), PX, `marker at ${time}s`);
      close(attr(f.$('[data-marker]'), 'cy'), y(state.jitter), PX, `marker at ${time}s`);
    }
    // Each recorded quadrupling leaves its own level, dot and drop on the same scale.
    f.seek(40);
    for (const stop of model.source.stops) {
      close(attr(f.$(`[data-level="${stop}"]`), 'y1'), y(model.law(stop)), PX, `level ${stop}`);
      close(attr(f.$(`[data-level-dot="${stop}"]`), 'cx'), x(stop), PX);
      close(attr(f.$(`[data-level-dot="${stop}"]`), 'cy'), y(model.law(stop)), PX);
      close(attr(f.$(`[data-level-drop="${stop}"]`), 'y2'), g.chart.y + g.chart.h, PX);
    }
  }
});

test('batch vote: the quadrupling brackets print the computed ratio, halving twice then zero', t => {
  const f = fixture(t, NAME), model = oracle(f); f.load(); f.open(); f.seek(40);
  const ratios = model.source.stops.slice(1).map((stop, index) => model.law(stop) / model.law(model.source.stops[index]));
  assert.deepEqual(model.source.stops.slice(1).map(stop => f.$(`[data-bracket="${stop}"]`)).map(Boolean),
    [true, true, true]);
  for (const [index, ratio] of ratios.entries()) {
    assert.equal(f.$(`[data-value="ratio${index}"]`).textContent, `×${ratio.toFixed(2)}`);
    const bracket = points(f.$(`[data-bracket="${model.source.stops[index + 1]}"]`));
    const g = frame(f), level = value => g.chart.y + g.chart.h * (1 - value / model.sigma);
    close(bracket[0][1], level(model.law(model.source.stops[index])), PX, `bracket top ${index}`);
    close(bracket.at(-1)[1], level(model.law(model.source.stops[index + 1])), PX, `bracket end ${index}`);
  }
  assert.deepEqual(ratios.map(ratio => ratio.toFixed(2)), ['0.49', '0.45', '0.00']);
  // Two quadruplings that roughly halve, then one that does not halve at all.
  for (const ratio of ratios.slice(0, 2)) assert(Math.abs(ratio - 0.5) < 0.06, 'roughly halves');
  assert.equal(ratios[2], 0, 'the last quadrupling reaches B = n and annihilates the noise');
  for (const [index, stop] of model.source.stops.entries())
    assert.equal(f.$(`[data-value="level${index}"]`).textContent, model.law(stop).toFixed(2));
  assert.deepEqual(model.source.stops.map((stop, index) =>
    f.$(`[data-value="level${index}"]`).textContent), ['11.21', '5.47', '2.45', '0.00']);
});

test('batch vote: the batch is always a whole number and climbs through its declared stops', t => {
  const f = fixture(t, NAME, {width: 713}), model = oracle(f); f.load(); f.open();
  let previous = 0;
  const sizes = new Set();
  for (let step = 0; step <= 800; step++) {
    const time = Number((step / 20).toFixed(4)); f.seek(time);
    const state = published(f), want = schedule(model.source.stops, time);
    assert.equal(state.size, want, `batch size at ${time}s`);
    assert(Number.isInteger(state.size), `a batch of ${state.size} at ${time}s is not whole examples`);
    assert(state.size >= previous, `the batch shrank at ${time}s`);
    previous = state.size; sizes.add(state.size);
  }
  assert(sizes.size > 30, 'the batch really sweeps its range');
  // Each quadrupling is reached exactly, at the beat its glide leads into.
  for (const [time, size] of [[0, 1], [5, 1], [14.99, 1], [15, 1], [20, 4], [24.99, 4], [25, 4],
    [30, 16], [34.99, 16], [35, 16], [FULL, 64], [40, 64]]) {
    f.seek(time); assert.equal(published(f).size, size, `batch at ${time}s`);
  }
  // The typical batch drawn as an arrow is a typical one, about one sigma out at B = 1.
  f.seek(0);
  const single = model.gradients[model.typical];
  close(Math.hypot(single[0] - model.truth[0], single[1] - model.truth[1]), model.sigma, 0.25 * model.sigma);
});

test('batch vote: the answer is absent while the caption asks the reader to predict', t => {
  const f = fixture(t, NAME, {width: 713}), model = oracle(f); f.load(); f.open();
  const range = f.$('[data-controls] input[type=range]'), slider = f.$('[data-batch-slider]');
  for (let step = 0; step < 100; step++) {
    const time = Number((10 + step * 0.05).toFixed(4)); f.seek(time);
    const state = published(f);
    assert.equal(state.size, 1, `the batch has started to grow at ${time}s`);
    assert.equal(state.curves, false, `the law curve is drawn at ${time}s`);
    assert.deepEqual(state.recorded, [1], `a later reading leaks at ${time}s`);
    assert.equal(f.$('[data-curve]').getAttribute('d'), '');
    assert.equal(f.$('[data-reference]').getAttribute('d'), '');
    assert(!visible(f.$('[data-level="4"]')), `the four-example level leaks at ${time}s`);
    assert(!visible(f.$('[data-bracket="4"]')), `the first bracket leaks at ${time}s`);
    const spoken = `${f.$('[data-figure] svg').getAttribute('aria-label')} `
      + `${range.getAttribute('aria-valuetext')} ${slider.getAttribute('aria-valuetext')} ${drawnMarkup(f)}`;
    assert.doesNotMatch(spoken, /5\.47|0\.49|halv/i, `the answer leaks at ${time}s`);
  }
  assert.match(f.$('[data-caption]').textContent, /How much of that jitter/);
  // The reveal follows a whole beat of stillness and only then names the ratio.
  f.seek(15); assert.match(f.$('[data-caption]').textContent, /The batch grows to four/);
  f.seek(19.99); assert.equal(published(f).curves, false);
  f.seek(20);
  assert.equal(published(f).curves, true);
  assert.equal(f.$('[data-value="ratio0"]').textContent, '×0.49');
  close(model.law(4), 5.469068868254841, 1e-12);
});

test('batch vote: each reveal waits for its own beat, and a withheld reading is a dot', t => {
  const f = fixture(t, NAME, {width: 713}); f.load(); f.open();
  for (const time of [0, 2.5, 4.99, 5, 10, 15, 19.99, 20, 25, 29.99, 30, 35, 37.99, 38, 40]) {
    f.seek(time);
    // The population, both arrows and the chart frame are there from the first frame.
    for (const selector of ['[data-population]', '[data-cloud]', '[data-truth]', '[data-estimate]',
      '[data-chart-axis="x"]', '[data-chart-axis="y"]', '[data-name="chart"]'])
      assert(visible(f.$(selector)), `${selector} missing at ${time}s`);
    assert.equal(visible(f.$('[data-marker]')), time >= 5, `marker at ${time}s`);
    assert.equal(f.$('[data-value="jitter"]').textContent === '·', time < 5, `jitter at ${time}s`);
    assert.equal(visible(f.$('[data-reference]')), time >= 20, `reference curve at ${time}s`);
    assert.equal(visible(f.$('[data-name="reference"]')), time >= 20);
    for (const [index, stop] of [[0, 1], [1, 4], [2, 16], [3, 64]]) {
      // A reading is on the board once the timeline has earned it, or once the batch
      // has actually reached that size.
      const earned = time >= 5 && (time >= RECORDED[index] || published(f).size >= stop);
      assert.equal(visible(f.$(`[data-level="${stop}"]`)), earned, `level ${stop} at ${time}s`);
      assert.equal(f.$(`[data-value="level${index}"]`).textContent === '·', !earned,
        `level ${stop} reading at ${time}s`);
      if (index > 0) {
        assert.equal(visible(f.$(`[data-bracket="${stop}"]`)), earned, `bracket ${stop} at ${time}s`);
        assert.equal(f.$(`[data-value="ratio${index - 1}"]`).textContent === '·', !earned);
      }
    }
    // The lengths and the true gradient are scenery from the first frame; only the
    // jitter readings wait.
    assert.notEqual(f.$('[data-value="truth"]').textContent, '·');
    assert.notEqual(f.$('[data-value="batch"]').textContent, '·');
    const formula = f.$('[data-formula]');
    assert.equal(formula.classList.contains('bv-split-shown'), true);
    assert.equal(formula.classList.contains('bv-law-shown'), time >= 5);
    assert.equal(formula.classList.contains('bv-finite-lit'), published(f).size === 64);
  }
});

test('batch vote: reduced motion rests each beat on one still the caption is true of', t => {
  const f = fixture(t, NAME, {reduced: true, width: 713}), model = oracle(f); f.load(); f.open();
  for (let index = 0; index < B.length; index++) {
    const end = index + 1 < B.length ? B[index + 1] : D;
    const want = schedule(model.source.stops, REST[index]);
    for (let time = B[index]; time < end - 1e-9; time = Number((time + 0.25).toFixed(4))) {
      f.seek(time);
      const state = published(f);
      assert.equal(state.stage, index);
      assert.equal(state.size, want, `beat ${index} still at ${time}s`);
    }
  }
  // The stills the captions promise: a frozen predict beat with no answer, and a final
  // still where the cloud has collapsed and the jitter is exactly zero.
  f.seek(12.5);
  assert.equal(published(f).size, 1); assert.equal(published(f).curves, false);
  f.seek(22.5); assert.equal(published(f).size, 4);
  f.seek(32.5); assert.equal(published(f).size, 16);
  f.seek(37.5);
  assert.equal(published(f).size, 64); assert.equal(published(f).jitter, 0);
  assert.deepEqual(published(f).recorded, model.source.stops);
});

test('batch vote: the one control is timeline-driven, and a drag is a detour', t => {
  const f = fixture(t, NAME, {width: 713}), model = oracle(f); f.load(); f.open();
  const slider = f.$('[data-batch-slider]');
  assert.equal(f.root.querySelectorAll('[data-pane] input[type="range"]').length, 2);
  assert.equal(slider.closest('[data-controls]'), null, 'a second range can never become the clock');
  assert.equal(slider.min, '1');
  assert.equal(slider.max, String(model.n));
  assert.equal(slider.step, '1');
  assert.equal(f.$('[data-batch-display]').getAttribute('aria-hidden'), 'true');
  // The timeline sweeps it, so a passive viewer still sees the whole climb.
  f.seek(20); assert.equal(Number(slider.value), 4);
  assert.equal(f.$('[data-batch-readout]').textContent, '4');
  f.seek(D); assert.equal(Number(slider.value), model.n);
  // Dragging pauses playback and recomputes the whole picture from the dragged value.
  f.seek(12); f.play(); assert(f.playing);
  slider.value = '9'; slider.dispatchEvent(new f.w.Event('input'));
  assert(!f.playing); assert.equal(f.root.dataset.override, 'slider');
  assert.equal(published(f).size, 9);
  close(published(f).jitter, model.law(9), 1e-12);
  assert.equal(marksOf(f.$('[data-members]')).length, 9);
  assert.match(f.$('[data-caption]').textContent, /setting the batch size/);
  assert.match(slider.getAttribute('aria-valuetext'), /^Batch of 9 out of 64 examples\./);
  // Its own keys never reach the pane's beat seeking, and never end the detour.
  const parked = f.time;
  f.key('ArrowRight', slider); f.key('End', slider);
  assert.equal(f.time, parked); assert.equal(f.root.dataset.override, 'slider');
  // Any timeline action restores the timeline's own value: the drag was a detour.
  f.key('ArrowRight');
  assert.equal(f.root.dataset.override, ''); assert.equal(published(f).size, 1);
  slider.value = '40'; slider.dispatchEvent(new f.w.Event('input'));
  assert.equal(published(f).size, 40);
  f.seek(30); assert.equal(f.root.dataset.override, ''); assert.equal(published(f).size, 16);
  // A dragged batch of n is exactly as exact as the timeline's own.
  slider.value = String(model.n); slider.dispatchEvent(new f.w.Event('input'));
  assert.equal(published(f).jitter, 0);
  assert.equal(published(f).spread, 0);
});

test('batch vote: every label stays inside the picture and clear of every other label', t => {
  for (const width of WIDTHS) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    for (let step = 0; step <= 80; step++) {
      const time = Number((step / 2).toFixed(4)); f.seek(time);
      const [, , w, h] = numbers(f.$('[data-figure] svg').getAttribute('viewBox'));
      const drawn = boxes(f), where = `${width}px, ${time}s`;
      for (const box of drawn) {
        assert(box.left >= 0 && box.right <= w, `"${box.text}" leaves the picture sideways at ${where}`);
        assert(box.top >= 0 && box.bottom <= h, `"${box.text}" leaves the picture vertically at ${where}`);
        assert(attr([...drawing(f).querySelectorAll('text')].find(node => node.textContent === box.text), 'font-size') >= 11,
          `"${box.text}" is below reading size at ${where}`);
      }
      for (let i = 0; i < drawn.length; i++) for (let j = i + 1; j < drawn.length; j++) {
        const a = drawn[i], b = drawn[j];
        const over = Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1.5
          && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1.5;
        assert(!over, `"${a.text}" meets "${b.text}" at ${where}`);
      }
    }
  }
});

test('batch vote: arbitrary seek and resize histories reproduce the complete published frame', t => {
  const f = fixture(t, NAME, {width: 713}); f.load(); f.open();
  const snapshot = () => JSON.stringify({drawing: canonicalMarkup(f.$('[data-figure]').innerHTML),
    formula: canonicalMarkup(f.$('[data-formula]').outerHTML), caption: f.$('[data-caption]').innerHTML,
    readout: f.$('[data-batch-readout]').textContent,
    state: Object.fromEntries(Object.entries(f.root.dataset).filter(([key]) => !['time', 'playing', 'typeset'].includes(key)))});
  const times = [0, 5, 10, 13.2, 15, 17.4, 20, 23.7, 25, 27.5, 30, 33.3, 35, 36.5, 38, 40];
  const first = times.map(time => { f.seek(time); return snapshot(); });
  f.play(); f.tick(1234); f.resize(296); f.seek(21.3); f.resize(713);
  f.$('[data-batch-slider]').value = '23';
  f.$('[data-batch-slider]').dispatchEvent(new f.w.Event('input'));
  f.key('Home');
  assert.deepEqual(times.toReversed().map(time => { f.seek(time); return snapshot(); }), first.toReversed());
});

test('batch vote: the narrow layout is a reflow, not a shrunken copy of the wide one', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (const width of WIDTHS) {
    f.resize(width); f.seek(40);
    const [, , w, h] = numbers(f.$('[data-figure] svg').getAttribute('viewBox'));
    assert.equal(f.root.dataset.layout, width < 520 ? 'narrow' : 'wide');
    assert.deepEqual([w, h], width < 520 ? [296, 580] : [713, 396]);
    assert.equal(f.$('[data-figure] svg').getAttribute('preserveAspectRatio'), 'xMinYMin meet');
    const g = frame(f);
    // The plane stays square, so a distance on it is an honest distance either way, and
    // the chart keeps a left margin wide enough for the jitter ruler's own readings.
    assert(g.plane.size > 0 && g.chart.w > 0 && g.chart.h > 0);
    assert(g.chart.x >= 44, `the jitter ruler has no room at ${width}px`);
    assert(g.plane.x + g.plane.size <= w && g.chart.x + g.chart.w <= w - 6);
    assert(g.chart.y + g.chart.h + 36 <= h, `the batch axis is cut off at ${width}px`);
    for (const node of [...drawing(f).querySelectorAll('line')].filter(visible))
      for (const [key, limit] of [['x1', w], ['x2', w], ['y1', h], ['y2', h]])
        assert(attr(node, key) >= -0.5 && attr(node, key) <= limit + 0.5,
          `${key} of a line leaves the frame at ${width}px`);
    // One picture's worth of marks: sixty-four estimates live inside two paths, not in
    // sixty-four elements, so the static print stays small enough to ship.
    assert(drawing(f).querySelectorAll('*').length < 60);
  }
});

test('batch vote: the wide and narrow script-free prints reproduce the final frame', async t => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after, 'regenerate the batch-vote static frames');
  const f = fixture(t, NAME), narrow = f.$('[data-static-frame="narrow"]');
  assert(narrow); assert.equal(narrow.dataset.width, '296');
  const ids = [...f.root.querySelectorAll('[id]')].map(node => node.id);
  assert.equal(ids.length, new Set(ids).size);
  for (const print of [drawing(f), narrow]) {
    assert.match(print.textContent, /11\.21/);
    assert.match(print.textContent, /5\.47/);
    assert.match(print.textContent, /2\.45/);
    assert.match(print.textContent, /×0\.49/);
    assert.match(print.textContent, /×0\.45/);
    assert.match(print.textContent, /B = 64/);
    assert.equal(print.querySelectorAll('[data-level]').length, 4);
    assert.equal(print.querySelectorAll('[data-bracket]').length, 3);
    assert(print.querySelector('[data-curve]').getAttribute('d').length > 100);
  }
  f.load(); f.open(); f.seek(40); f.resize(296);
  assert.equal(f.root.querySelectorAll('[data-static-frame="narrow"]').length, 0);
  const css = read('batch-vote/player.css');
  assert.match(css, /@container\s*\(max-width:\s*519px\)/);
  assert.match(css, new RegExp(`aspect-ratio:\\s*296\\s*/\\s*${narrow.dataset.height}`));
});

test('batch vote: an unusable fixture cannot silently mount a different mechanism', t => {
  const broken = [{features: '-4 -3 -2 -1 1 2 3 3'}, {features: '-4 -3 -2'},
    {coefficients: '1.5'}, {parameters: '1.5 0.75'}, {offset: 'Infinity'},
    {stops: '1 4 16 32'}, {stops: '1 2 16 64'}, {stops: '2 8 32 64'}, {stops: '1 4 16'},
    {shuffleSeed: '0'}, {shuffleSeed: '2.5'}, {shuffleSeed: 'x'}];
  for (const change of broken) {
    const f = mount(t, change);
    assert.throws(() => f.load(), /batch-vote/, JSON.stringify(change));
    assert(!f.root.dataset.ready, 'a rejected fixture never mounts a player');
    assert.match(drawing(f).textContent, /11\.21/, 'the script-free print is left in place');
  }
});

test('batch vote: the player exports nothing and publishes a fixed set of state keys', t => {
  const f = fixture(t, NAME, {width: 713}); f.load(); f.open();
  assert.equal(f.w.BookBatchVote, undefined);
  assert.deepEqual(Object.keys(f.root.dataset).filter(key => ![
    'player', 'playback', 'evidenceClass', 'features', 'coefficients', 'offset',
    'parameters', 'stops', 'shuffleSeed', 'ready', 'duration', 'time', 'playing', 'typeset'
  ].includes(key)).sort(),
  ['batch', 'chart', 'curves', 'estimate', 'examples', 'independent', 'jitter', 'layout',
    'opened', 'override', 'plane', 'recorded', 'sigma', 'spread', 'stage', 'truth']);
  assert.doesNotMatch(read('batch-vote/player.js'), /Math\.random|fetch\(|import\(|setInterval\(/);
  assert.doesNotMatch(read('batch-vote/panel.html'), /@eq-/);
  const filter = fs.readFileSync(path.join(ROOT, scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
});

test('batch vote: the boundary says what is not claimed, and the check transfers', t => {
  const f = fixture(t, NAME);
  const boundary = f.$('.mechanism-boundary').textContent;
  assert.match(boundary, /sampling noise in the gradient estimate at one fixed parameter vector/);
  assert.match(boundary, /not noise in the loss/);
  assert.match(boundary, /nothing here is trained/);
  assert.match(boundary, /declared computed variant/);
  assert.match(boundary, /exact standard deviation over/);
  // The chapter's three-case discipline, respected rather than quietly overrun.
  assert.match(boundary, /Case 1/);
  assert.match(boundary, /unbiased estimate of the full gradient/);
  assert.match(boundary, /nonlinear functional of an aggregate/);
  assert.match(boundary, /protocol, not an estimator/);
  assert.match(boundary, /not a claim about successive reshuffled batches/);
  assert.match(boundary, /not a measured time/);
  assert.equal(f.$('.mechanism-boundary > p').textContent.split(/\s+/).length <= 32, true);
  // The transfer check moves to a population the scene's own control cannot reach.
  const check = f.$('.mechanism-check');
  const question = check.querySelector('summary').textContent.replace(/^Check yourself\.\s*/, '');
  const answer = check.querySelector('p').textContent;
  assert(question.split(/\s+/).length <= 40, `the question has ${question.split(/\s+/).length} words`);
  assert(answer.split(/\s+/).length <= 70, `the answer has ${answer.split(/\s+/).length} words`);
  for (const text of [question, answer]) {
    assert.doesNotMatch(text, /\d-\d|\s-\d/, 'a hyphen is never a minus sign');
    assert.doesNotMatch(text, /\de[-+]?\d/, 'no e-notation');
  }
  // Its arithmetic, at a population a thousand times larger than this scene's.
  const N = 1e6, correction = size => Math.sqrt((N - size) / (N - 1));
  close(Number(correction(100).toFixed(5)), 0.99995, 1e-12);
  close(Number(correction(400).toFixed(5)), 0.9998, 1e-12);
  close(Number((0.5 * correction(400) / correction(100)).toFixed(5)), 0.49992, 1e-12);
  // The control cannot answer it: this scene's whole population is sixty-four examples.
  assert.equal(numbers(f.root.dataset.features).length ** 2, 64);
  for (const value of [/0\.99995/, /0\.99980/, /0\.49992/]) assert.match(answer, value);
});
