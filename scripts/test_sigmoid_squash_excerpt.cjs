#!/usr/bin/env node
// Test-only geometry, arithmetic and reveal checks for the Chapter 2 sigmoid excerpt.
// Nothing here ships: the suite recomputes the scene's schedule, every score and every
// probability from the panel's declared attributes and compares them with what the mounted
// player publishes and draws. The chapter owns the sigmoid, its midpoint and the score
// range; the plane behind it is a declared schematic and is treated as one.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, close, canonicalMarkup, drawnMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'sigmoid-squash-excerpt', scene = entry(NAME);
const WIDTHS = [296, 360, 460, 519, 520, 640, 713];
// Drawing coordinates are serialised at 0.0001 px; the published state is never rounded.
const PX = 1e-4;
const B = scene.beats, D = scene.duration, MID = (B[7] + D) / 2;
const PUSH_AT = [B[5], B[6], B[7], MID, D];
// A glide beat rests on its finished state, so every reduced-motion still is the picture
// its own caption is about.
const REST = [B[0], B[2], B[2], B[4], B[4], B[6], B[7], D];

const sigmoid = o => 1 / (1 + Math.exp(-o));
const attr = (node, key) => Number(node.getAttribute(key));
const visible = node => Boolean(node) && !node.closest('[hidden]');
const drawing = f => f.$('[data-drawing]');
const couples = flat => {
  const out = [];
  for (let i = 0; i + 1 < flat.length; i += 2) out.push([flat[i], flat[i + 1]]);
  return out;
};
const declared = f => ({
  weights: numbers(f.root.dataset.weights), bias: Number(f.root.dataset.bias),
  cross: numbers(f.root.dataset.cross), domain: numbers(f.root.dataset.domain),
  range: numbers(f.root.dataset.scoreRange), samples: Number(f.root.dataset.samples),
  journey: numbers(f.root.dataset.journey), step: Number(f.root.dataset.step),
  pushes: Number(f.root.dataset.pushes), class0: couples(numbers(f.root.dataset.class0)),
  class1: couples(numbers(f.root.dataset.class1)), labels: couples(numbers(f.root.dataset.classLabels))
});
const published = f => ({
  stage: Number(f.root.dataset.stage), o: Number(f.root.dataset.score),
  p: Number(f.root.dataset.probability), place: JSON.parse(f.root.dataset.place),
  recovered: Number(f.root.dataset.recovered), revealed: f.root.dataset.revealed === 'true',
  crossing: f.root.dataset.crossing === 'true', earned: Number(f.root.dataset.earned)
});
// The schedule, reimplemented: three glides carry the example from the class-0 side onto
// the line, then four equal pushes of the declared size carry it out into the tail.
const ease = u => (1 - Math.cos(Math.PI * Math.max(0, Math.min(1, u)))) / 2;
const mix = (u, a, b) => u === 0 ? a : u === 1 ? b : a + u * (b - a);
function schedule(source, time) {
  const [start, hold, cross] = source.journey, s = source.step;
  return time < B[1] ? start
    : time < B[2] ? mix(ease((time - B[1]) / (B[2] - B[1])), start, hold)
      : time < B[3] ? hold
        : time < B[4] ? mix(ease((time - B[3]) / (B[4] - B[3])), hold, cross)
          : time < B[5] ? cross
            : time < B[6] ? mix(ease((time - B[5]) / (B[6] - B[5])), cross, cross + s)
              : time < B[7] ? mix(ease((time - B[6]) / (B[7] - B[6])), cross + s, cross + 2 * s)
                : time < MID ? mix(ease((time - B[7]) / (MID - B[7])), cross + 2 * s, cross + 3 * s)
                  : mix(ease((time - MID) / (D - MID)), cross + 3 * s, cross + 4 * s);
}
// Screen geometry, from the layout the player publishes.
const frame = f => ({plane: JSON.parse(f.root.dataset.plane), plot: JSON.parse(f.root.dataset.plot)});
const toX = (g, source, x) => g.plane.left + (x - source.domain[0]) * g.plane.unit;
const toY = (g, source, y) => g.plane.top + (source.domain[3] - y) * g.plane.unit;
const ox = (g, source, o) => g.plot.left + (o - source.range[0]) * g.plot.width / (source.range[1] - source.range[0]);
const oy = (g, p) => g.plot.top + g.plot.height * (1 - p);
const scoreOf = (source, point) => source.weights[0] * point[0] + source.weights[1] * point[1] + source.bias;
const placeOf = (source, o) => {
  const n2 = source.weights[0] ** 2 + source.weights[1] ** 2;
  return [source.cross[0] + o * source.weights[0] / n2, source.cross[1] + o * source.weights[1] / n2];
};
// JSDOM lays nothing out, so a label's box is estimated from its own content at the ratio
// the player uses and the browser preview confirmed: about 0.55 em per character.
const boxes = f => [...drawing(f).querySelectorAll('text')].filter(visible)
  .filter(node => node.textContent.length).map(node => {
    const size = attr(node, 'font-size'), width = node.textContent.length * size * 0.55 + 3;
    const x = attr(node, 'x'), anchor = node.getAttribute('text-anchor');
    const left = anchor === 'start' ? x : anchor === 'end' ? x - width : x - width / 2;
    return {text: node.textContent, size, left, right: left + width,
      top: attr(node, 'y') - size * 0.8, bottom: attr(node, 'y') + size * 0.25};
  });
function mount(t, changes, options = {}) {
  const f = fixture(t, NAME, options);
  for (const [key, value] of Object.entries(changes)) f.root.dataset[key] = String(value);
  return f;
}

registerTransportTests(NAME, {witness: /\+0\.0294/, anchors: ['sigmoid-squash-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('sigmoid squash: the chapter owns the curve; the plane behind it is a declared schematic', t => {
  const f = fixture(t, NAME), source = declared(f), chapter = chapterSource(NAME);
  assert.equal(scene.qmd, 'chapters/part1/02-logistic-softmax.qmd');
  assert.equal(scene.anchor.type, 'after-cell');
  assert.equal(scene.anchor.target, 'cell-fig-sigmoid');
  assert(chapter.includes('#| label: fig-sigmoid'), 'the anchored cell is in the chapter');
  assert.equal(scene.duration, 40);
  assert.deepEqual(scene.beats, [0, 5, 10, 15, 20, 25, 30, 35]);
  assert.equal(f.root.dataset.evidenceClass, 'schematic');
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal), literal);
  // The three sentences this scene exists to make visible.
  assert.match(chapter, /The sigmoid does not bend the boundary; it grades our confidence on either\nside of it/);
  assert.match(chapter, /an unbounded score/);
  assert.match(chapter, /its confident regions saturate far from it/);
  // The score axis is the chapter's own sweep, ends included.
  assert(chapter.includes(`o = torch.linspace(${source.range[0]}, ${source.range[1]}, ${source.samples})`));
  // The scene's own schematic contract: the crossing point really is on the boundary, the
  // two clusters really are on opposite sides of it, and the journey really ends at zero.
  assert.equal(scoreOf(source, source.cross), 0, 'exactly on the boundary, not nearly on it');
  for (const point of source.class0) assert(scoreOf(source, point) < 0, String(point));
  for (const point of source.class1) assert(scoreOf(source, point) > 0, String(point));
  assert(scoreOf(source, source.labels[0]) < 0 && scoreOf(source, source.labels[1]) > 0);
  assert.deepEqual(source.journey, [...source.journey].sort((a, b) => a - b));
  assert.equal(source.journey[2], 0);
  assert(source.step > 0 && source.pushes >= 2);
  // Every declared point, and the whole slider range's journey, fits inside the plane.
  const inside = ([x, y]) => x >= source.domain[0] && x <= source.domain[1]
    && y >= source.domain[2] && y <= source.domain[3];
  for (const point of [...source.class0, ...source.class1, ...source.labels]) assert(inside(point), String(point));
  for (const o of [source.range[0], source.range[1], source.journey[0], source.pushes * source.step])
    assert(inside(placeOf(source, o)), `the journey leaves the plane at o = ${o}`);
});

test('sigmoid squash: score, place and probability are one object at every instant', t => {
  const f = fixture(t, NAME, {width: 713}), source = declared(f); f.load(); f.open();
  const norm = Math.hypot(...source.weights);
  const seen = new Set();
  for (let n = 0; n <= 800; n++) {
    const time = Number((n / 20).toFixed(4)); f.seek(time);
    const state = published(f), want = schedule(source, time);
    close(state.o, want, 1e-12, `score at ${time}s`);
    // The drawn place is derived from the score, and the score is recovered from the place:
    // w.x + b IS the number on the axis, and the probability IS sigma of it.
    assert.deepEqual(state.place, placeOf(source, state.o), `place at ${time}s`);
    close(state.recovered, state.o, 1e-12, `w.x + b at ${time}s`);
    close(scoreOf(source, state.place), state.o, 1e-12);
    assert.equal(state.p, sigmoid(state.o), `probability at ${time}s`);
    // The score is the signed distance along the boundary's normal times the weight norm.
    const distance = scoreOf(source, state.place) / norm;
    close(norm * distance, state.o, 1e-12, `norm times distance at ${time}s`);
    seen.add(state.o);
  }
  assert(seen.size > 200, 'the example really travels');
  assert(Math.min(...seen) === source.journey[0], 'it starts where the fixture says');
  assert(Math.max(...seen) === source.journey[2] + source.pushes * source.step);
});

test('sigmoid squash: the plane, the score axis and the curve draw the same published numbers', t => {
  for (const width of WIDTHS) {
    const f = fixture(t, NAME, {width}), source = declared(f); f.load(); f.open();
    for (const time of [0, 5, 7.5, 10, 15, 17.5, 20, 22.5, 25, 27.5, 30, 32.5, 35, 37.5, 40]) {
      f.seek(time);
      const state = published(f), g = frame(f), where = `${width}px, ${time}s`;
      const x = toX(g, source, state.place[0]), y = toY(g, source, state.place[1]);
      close(attr(f.$('[data-example]'), 'cx'), x, PX, `example x at ${where}`);
      close(attr(f.$('[data-example]'), 'cy'), y, PX, `example y at ${where}`);
      // The blue reach is the signed distance the score measures: it runs from the foot on
      // the boundary to the example, and its length is |o| / ||w|| in plane units.
      const reach = f.$('[data-reach]');
      close(attr(reach, 'x1'), toX(g, source, source.cross[0]), PX);
      close(attr(reach, 'y1'), toY(g, source, source.cross[1]), PX);
      close(attr(reach, 'x2'), x, PX); close(attr(reach, 'y2'), y, PX);
      const drawnLength = Math.hypot(attr(reach, 'x2') - attr(reach, 'x1'), attr(reach, 'y2') - attr(reach, 'y1'));
      close(drawnLength, Math.abs(state.o) / Math.hypot(...source.weights) * g.plane.unit, 1e-3, `reach at ${where}`);
      // The same example on the score axis, carried up to the curve and read across.
      close(attr(f.$('[data-score-dot]'), 'cx'), ox(g, source, state.o), PX, `score tick at ${where}`);
      close(attr(f.$('[data-score-dot]'), 'cy'), oy(g, 0), PX);
      close(attr(f.$('[data-curve-dot]'), 'cx'), ox(g, source, state.o), PX);
      close(attr(f.$('[data-curve-dot]'), 'cy'), oy(g, state.p), PX, `curve dot at ${where}`);
      const rise = f.$('[data-rise]'), reads = f.$('[data-read]');
      close(attr(rise, 'y1'), oy(g, 0), PX); close(attr(rise, 'y2'), oy(g, state.p), PX);
      close(attr(reads, 'x1'), ox(g, source, state.o), PX); close(attr(reads, 'x2'), g.plot.left, PX);
      close(attr(reads, 'y1'), oy(g, state.p), PX); close(attr(reads, 'y2'), oy(g, state.p), PX);
    }
    // The boundary is clipped to the plane and every point of it scores exactly zero.
    const g = frame(f), line = f.$('[data-boundary]');
    for (const [kx, ky] of [['x1', 'y1'], ['x2', 'y2']]) {
      const px = attr(line, kx), py = attr(line, ky);
      const plane = [(px - g.plane.left) / g.plane.unit + source.domain[0],
        source.domain[3] - (py - g.plane.top) / g.plane.unit];
      // The 0.0001 px serialisation is worth about 1e-5 of score at these units.
      close(scoreOf(source, plane), 0, 1e-4, `boundary end at ${width}px`);
      close(Math.min(px - g.plane.left, g.plane.left + g.plane.width - px,
        py - g.plane.top, g.plane.top + g.plane.height - py), 0, 1e-3, 'the end sits on the frame');
    }
  }
});

test('sigmoid squash: on the line the score is exactly 0 and the probability exactly one half', t => {
  const f = fixture(t, NAME, {width: 713}), source = declared(f); f.load(); f.open();
  for (const time of [20, 21, 23.5, 24.99]) {
    f.seek(time);
    const state = published(f), g = frame(f);
    assert.equal(state.o, 0, 'exactly zero, not nearly zero');
    assert.equal(state.p, 0.5, 'exactly one half, not nearly one half');
    assert.deepEqual(state.place, source.cross, 'standing exactly on the declared crossing point');
    assert.equal(state.recovered, 0, 'w.x + b is exactly zero there');
    assert.equal(state.crossing, true);
    assert.equal(f.$('[data-value="score"]').textContent, '0.00');
    assert.equal(f.$('[data-value="probability"]').textContent, '0.5000');
    // One statement seen three times: the line on the plane, o = 0, and p = 1/2.
    assert(visible(f.$('[data-zero-rule]'))); assert(visible(f.$('[data-half-rule]')));
    assert(visible(f.$('[data-cross-ring]')));
    assert.equal(f.$('[data-name="half"]').textContent, '½');
    assert.equal(f.$('[data-name="boundary-score"]').textContent, 'o = 0');
    close(attr(f.$('[data-cross-ring]'), 'cx'), ox(g, source, 0), PX);
    close(attr(f.$('[data-cross-ring]'), 'cy'), oy(g, 0.5), PX);
    close(attr(f.$('[data-example]'), 'cx'), toX(g, source, source.cross[0]), PX);
    assert(f.$('[data-formula]').classList.contains('sq-crossing'));
  }
  // The identity does not depend on how the reader got there: dragging the score to zero
  // lands on exactly the same three readings.
  f.seek(32);
  const slider = f.$('[data-score-slider]');
  slider.value = '0'; slider.dispatchEvent(new f.w.Event('input'));
  const dragged = published(f);
  assert.equal(dragged.o, 0); assert.equal(dragged.p, 0.5); assert.equal(dragged.recovered, 0);
  assert.deepEqual(dragged.place, source.cross);
});

test('sigmoid squash: the answer is absent while the caption asks the reader to predict', t => {
  const f = fixture(t, NAME, {width: 713}), source = declared(f); f.load(); f.open();
  const range = f.$('[data-controls] input[type=range]');
  for (let n = 0; n < 100; n++) {
    const time = Number((B[2] + n * 0.05).toFixed(4)); f.seek(time);
    const state = published(f);
    assert.equal(state.o, source.journey[1], `the example has started toward the line at ${time}s`);
    assert.equal(state.crossing, false);
    assert.equal(state.revealed, false);
    assert.equal(f.$('[data-value="score"]').textContent, '−1.00');
    assert.equal(f.$('[data-value="probability"]').textContent, '0.2689');
    for (const selector of ['[data-zero-rule]', '[data-half-rule]', '[data-cross-ring]'])
      assert(!visible(f.$(selector)), `${selector} leaks at ${time}s`);
    assert.equal(f.root.dataset.earned, '0', `a push leaks at ${time}s`);
    // What rule 7 names: the drawing, the picture's accessible name, the scrubber's value
    // text, and the caption. The identity's own TeX line is present but `visibility: hidden`,
    // so it reaches neither the eye nor a screen reader; that it is hidden is asserted here.
    assert(!f.$('[data-formula]').classList.contains('sq-identity-shown'), `the identity shows at ${time}s`);
    const spoken = `${f.$('[data-figure] svg').getAttribute('aria-label')} `
      + `${range.getAttribute('aria-valuetext')} ${f.$('[data-figure]').innerHTML} `
      + f.$('[data-caption]').textContent;
    assert.doesNotMatch(spoken, /½|0\.5000|o = 0|one half|exactly zero/i, `the answer leaks at ${time}s`);
  }
  assert.match(drawnMarkup(f), /data-caption/, 'the caption is part of the pane the harness compares');
  assert.match(f.$('[data-caption]').textContent, /What score there, and what probability\?/);
  f.seek(15); assert.match(f.$('[data-caption]').textContent, /^Released/);
  f.seek(20); assert.match(f.$('[data-caption]').textContent, /exactly 0 and the probability exactly one half/);
});

test('sigmoid squash: equal pushes in the plane are equal in the score and unequal in the probability', t => {
  const f = fixture(t, NAME, {width: 713}), source = declared(f); f.load(); f.open();
  const rungs = [];
  for (const [index, moment] of PUSH_AT.entries()) {
    f.seek(moment);
    const state = published(f);
    assert.equal(state.o, source.journey[2] + index * source.step, `push ${index} lands exactly`);
    assert.equal(state.p, sigmoid(state.o));
    assert.equal(state.earned, index + 1, `push ${index} is earned at ${moment}s`);
    rungs.push({o: state.o, p: state.p, place: state.place});
  }
  // Equal in the score, and therefore equally spaced in the plane: the same push every time.
  const strides = rungs.slice(1).map((rung, i) => Math.hypot(rung.place[0] - rungs[i].place[0],
    rung.place[1] - rungs[i].place[1]));
  for (const stride of strides) close(stride, strides[0], 1e-12, 'the pushes are equal in the plane');
  close(strides[0], source.step / Math.hypot(...source.weights), 1e-12);
  // Not equal in the probability: each gain is strictly smaller than the one before it.
  const gains = rungs.slice(1).map((rung, i) => rung.p - rungs[i].p);
  for (let i = 1; i < gains.length; i++)
    assert(gains[i] < gains[i - 1], `push ${i} gained at least as much as push ${i - 1}`);
  assert(gains[0] > 7 * gains.at(-1), 'the first push must buy many times what the last one does');
  // What the picture prints is those gains, to four places, with no sign trouble.
  const g = frame(f);
  for (const [index, gain] of gains.entries()) {
    assert.equal(f.$(`[data-value="gap${index}"]`).textContent, `+${gain.toFixed(4)}`);
    // Each bracket spans exactly the two probabilities it measures.
    const bar = f.$(`[data-gap="${index}"]`).getAttribute('d');
    const ys = [...bar.matchAll(/[ML] [-\d.]+ ([-\d.]+)/g)].map(m => Number(m[1]));
    close(Math.max(...ys) - Math.min(...ys), gain * g.plot.height, PX, `bracket ${index}`);
  }
  // Every rung sits at its own probability, on the axis and on the plane.
  for (const [index, rung] of rungs.entries()) {
    close(attr(f.$(`[data-rung="${index}"]`), 'y1'), oy(g, rung.p), PX);
    const step = f.$(`[data-step-tick="${index}"]`);
    close((attr(step, 'x1') + attr(step, 'x2')) / 2, toX(g, source, rung.place[0]), PX);
    close((attr(step, 'y1') + attr(step, 'y2')) / 2, toY(g, source, rung.place[1]), PX);
  }
});

test('sigmoid squash: each mark, wash and rung appears in its own beat and not before', t => {
  const f = fixture(t, NAME, {width: 713}); f.load(); f.open();
  for (const time of [0, 2.5, 9.99, 10, 15, 19.99, 20, 25, 30, 35, 37.5, 40]) {
    f.seek(time);
    for (const selector of ['[data-zero-rule]', '[data-half-rule]', '[data-cross-ring]'])
      assert.equal(visible(f.$(selector)), time >= B[4], `${selector} at ${time}s`);
    assert.equal(f.$('[data-name="half"]').textContent === '½', time >= B[4]);
    assert.equal(f.$('[data-name="boundary-score"]').textContent === 'o = 0', time >= B[4]);
    // The score axis's own zero changes colour only once the example has stood on it.
    assert.equal(f.$('[data-tick-label="0"]').classList.contains('sq-boundary-fill'), time >= B[4]);
    for (const [index, moment] of PUSH_AT.entries()) {
      assert.equal(visible(f.$(`[data-rung="${index}"]`)), time >= moment, `rung ${index} at ${time}s`);
      assert.equal(visible(f.$(`[data-step-tick="${index}"]`)), time >= moment);
      if (index) assert.equal(visible(f.$(`[data-gap="${index - 1}"]`)), time >= moment,
        `gap ${index - 1} at ${time}s`);
    }
    // The picture's own values are never a fake zero and never wait for a beat.
    for (const key of ['score', 'probability'])
      assert.notEqual(f.$(`[data-value="${key}"]`).textContent, '·');
    const formula = f.$('[data-formula]');
    assert.equal(formula.classList.contains('sq-identity-shown'), time >= B[4]);
    // The identity is lit exactly while the example is standing on it — which includes the
    // instant the first push begins, where the eased glide has not moved yet.
    assert.equal(formula.classList.contains('sq-crossing'), time >= B[4] && published(f).o === 0);
    // The exponential is washed exactly where the curve has gone flat.
    assert.equal(formula.classList.contains('sq-saturated'), Math.abs(published(f).o) >= 2);
  }
});

test('sigmoid squash: reduced motion rests each beat on one still the caption is true of', t => {
  const f = fixture(t, NAME, {reduced: true, width: 713}), source = declared(f); f.load(); f.open();
  for (let index = 0; index < B.length; index++) {
    const end = index + 1 < B.length ? B[index + 1] : D, want = schedule(source, REST[index]);
    for (let time = B[index]; time < end - 1e-9; time = Number((time + 0.25).toFixed(4))) {
      f.seek(time);
      const state = published(f);
      assert.equal(state.stage, index);
      close(state.o, want, 1e-12, `beat ${index} still at ${time}s`);
      assert.equal(state.p, sigmoid(state.o));
    }
  }
  // The stills the captions promise: a frozen predict beat with no answer, an exactly
  // orthodox crossing, and a last still that already carries all four gains.
  f.seek(12.5); assert.equal(published(f).o, source.journey[1]); assert.equal(published(f).revealed, false);
  f.seek(22.5); assert.equal(published(f).o, 0); assert.equal(published(f).p, 0.5);
  f.seek(27.5); assert.equal(published(f).o, source.step);
  f.seek(37.5); assert.equal(published(f).earned, PUSH_AT.length);
  assert.equal(published(f).o, source.pushes * source.step);
});

test('sigmoid squash: the one control is timeline-driven, and a drag is a detour', t => {
  const f = fixture(t, NAME, {width: 713}), source = declared(f); f.load(); f.open();
  const slider = f.$('[data-score-slider]');
  assert.equal(f.root.querySelectorAll('[data-pane] input[type="range"]').length, 2);
  assert.equal(slider.closest('[data-controls]'), null, 'a second range can never become the clock');
  // The slider's range is the chapter's own sweep, not a range this scene invented.
  assert.equal(slider.min, String(source.range[0]));
  assert.equal(slider.max, String(source.range[1]));
  assert.equal(f.$('[data-score-display]').getAttribute('aria-hidden'), 'true');
  f.seek(D); assert.equal(Number(slider.value), source.pushes * source.step);
  assert.equal(f.$('[data-score-readout]').textContent, '+4.00');
  f.seek(B[4]); assert.equal(Number(slider.value), 0);
  assert.equal(f.$('[data-score-readout]').textContent, '0.00');
  // Dragging pauses playback and recomputes the whole picture from the dragged score.
  f.seek(12); f.play(); assert(f.playing);
  slider.value = '5.5'; slider.dispatchEvent(new f.w.Event('input'));
  assert(!f.playing); assert.equal(f.root.dataset.override, 'slider');
  const dragged = published(f);
  assert.equal(dragged.o, 5.5); assert.equal(dragged.p, sigmoid(5.5));
  assert.deepEqual(dragged.place, placeOf(source, 5.5));
  assert.match(f.$('[data-caption]').textContent, /You are moving the score/);
  // A drag never earns a rung: the ladder is the timeline's record.
  assert.equal(f.root.dataset.earned, '0');
  // Its own keys never reach the pane's beat seeking, and never end the detour.
  const parked = f.time;
  f.key('ArrowRight', slider); f.key('End', slider);
  assert.equal(f.time, parked); assert.equal(f.root.dataset.override, 'slider');
  // Any timeline action restores the timeline's own value: the drag was a detour.
  f.key('ArrowRight');
  assert.equal(f.root.dataset.override, '');
  close(published(f).o, schedule(source, f.time), 1e-12);
  slider.value = '-6'; slider.dispatchEvent(new f.w.Event('input'));
  assert.equal(published(f).o, source.range[0]);
  f.seek(30); assert.equal(f.root.dataset.override, '');
  close(published(f).o, schedule(source, 30), 1e-12);
});

test('sigmoid squash: every label stays inside the picture and clear of every other label', t => {
  for (const width of WIDTHS) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    for (let n = 0; n <= 80; n++) {
      const time = Number((n / 2).toFixed(4)); f.seek(time);
      const [, , w, h] = numbers(f.$('[data-figure] svg').getAttribute('viewBox'));
      const drawn = boxes(f), where = `${width}px, ${time}s`;
      for (const box of drawn) {
        assert(box.left >= 0 && box.right <= w, `"${box.text}" leaves the picture sideways at ${where}`);
        assert(box.top >= 0 && box.bottom <= h, `"${box.text}" leaves the picture vertically at ${where}`);
        assert(box.size >= 12, `"${box.text}" is below reading size at ${where}`);
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

test('sigmoid squash: arbitrary seek and resize histories reproduce the complete published frame', t => {
  const f = fixture(t, NAME, {width: 713}); f.load(); f.open();
  const snapshot = () => JSON.stringify({drawing: canonicalMarkup(f.$('[data-figure]').innerHTML),
    formula: canonicalMarkup(f.$('[data-formula]').outerHTML), caption: f.$('[data-caption]').innerHTML,
    readout: f.$('[data-score-readout]').textContent,
    state: Object.fromEntries(Object.entries(f.root.dataset).filter(([key]) => !['time', 'playing', 'typeset'].includes(key)))});
  const times = [0, 5, 8.3, 10, 15, 17.6, 20, 22.4, 25, 28.8, 30, 33.1, 35, 37.5, 39.2, 40];
  const first = times.map(time => { f.seek(time); return snapshot(); });
  f.play(); f.tick(1234); f.resize(296); f.seek(21.3); f.resize(713);
  f.$('[data-score-slider]').value = '2.4';
  f.$('[data-score-slider]').dispatchEvent(new f.w.Event('input'));
  f.key('Home');
  assert.deepEqual(times.toReversed().map(time => { f.seek(time); return snapshot(); }), first.toReversed());
});

test('sigmoid squash: the narrow layout is a reflow, not a shrunken copy of the wide one', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (const width of WIDTHS) {
    f.resize(width); f.seek(40);
    const [, , w, h] = numbers(f.$('[data-figure] svg').getAttribute('viewBox'));
    assert.equal(f.root.dataset.layout, width < 520 ? 'narrow' : 'wide');
    assert.deepEqual([w, h], width < 520 ? [296, 538] : [713, 296]);
    assert.equal(f.$('[data-figure] svg').getAttribute('preserveAspectRatio'), 'xMinYMin meet');
    // Both layouts keep one picture's worth of marks, all inside the frame.
    for (const node of [...drawing(f).querySelectorAll('line')].filter(visible))
      for (const [key, limit] of [['x1', w], ['x2', w], ['y1', h], ['y2', h]])
        assert(attr(node, key) >= 0 && attr(node, key) <= limit, `${key} of a line leaves the frame at ${width}px`);
    assert(drawing(f).querySelectorAll('*').length < 80);
    // The plane keeps one unit per axis, so the boundary's angle is never distorted.
    const g = frame(f), source = declared(f);
    close(g.plane.width / (source.domain[1] - source.domain[0]), g.plane.unit, PX);
    close(g.plane.height / (source.domain[3] - source.domain[2]), g.plane.unit, PX);
  }
});

test('sigmoid squash: the wide and narrow script-free prints reproduce the final frame', async t => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after, 'regenerate the sigmoid-squash static frames');
  const f = fixture(t, NAME), narrow = f.$('[data-static-frame="narrow"]');
  assert(narrow); assert.equal(narrow.dataset.width, '296');
  const ids = [...f.root.querySelectorAll('[id]')].map(node => node.id);
  assert.equal(ids.length, new Set(ids).size);
  for (const print of [drawing(f), narrow]) {
    assert.match(print.textContent, /decision boundary/);
    assert.match(print.textContent, /o = 0/);
    assert.match(print.textContent, /\+0\.2311/);
    assert.match(print.textContent, /\+0\.0294/);
    assert.match(print.textContent, /0\.9820/);
    assert.equal(print.querySelectorAll('[data-gap]').length, 4);
    assert.equal(print.querySelectorAll('[data-rung]').length, 5);
    assert(print.querySelector('[data-cross-ring]'));
  }
  f.load(); f.open(); f.seek(40); f.resize(296);
  assert.equal(f.root.querySelectorAll('[data-static-frame="narrow"]').length, 0);
  const css = read('sigmoid-squash/player.css');
  assert.match(css, /@container\s*\(max-width:\s*519px\)/);
  assert.match(css, new RegExp(`aspect-ratio:\\s*296\\s*/\\s*${narrow.dataset.height}`));
});

test('sigmoid squash: an unusable fixture cannot silently mount a different mechanism', t => {
  const broken = [{cross: '0 0.3'}, {bias: '-0.4'}, {weights: '0 0'}, {weights: 'x 2'},
    {journey: '-4 -1 0.5'}, {journey: '-1 -4 0'}, {pushes: '1'}, {step: '0'},
    {class0: '-1.36 -0.23 1.9 1.9 0.18 -0.92'}, {class1: '-0.05 1.6 -2 -2 1.49 0.32'},
    {classLabels: '2.55 2.05 -2.55 -1.95'}, {domain: '-1 1 -1 1'}, {samples: '1'}];
  for (const change of broken) {
    const f = mount(t, change);
    assert.throws(() => f.load(), /sigmoid-squash/, JSON.stringify(change));
    assert(!f.root.dataset.ready, 'a rejected fixture never mounts a player');
    assert.match(drawing(f).textContent, /decision boundary/, 'the script-free print is left in place');
  }
});

test('sigmoid squash: the player exports nothing and publishes a fixed set of state keys', t => {
  const f = fixture(t, NAME, {width: 713}); f.load(); f.open();
  assert.equal(f.w.BookSigmoidSquash, undefined);
  assert.deepEqual(Object.keys(f.root.dataset).filter(key => ![
    'player', 'playback', 'evidenceClass', 'weights', 'bias', 'cross', 'domain', 'scoreRange',
    'samples', 'journey', 'step', 'pushes', 'class0', 'class1', 'classLabels',
    'ready', 'duration', 'time', 'playing', 'typeset'
  ].includes(key)).sort(),
  ['crossing', 'earned', 'layout', 'override', 'place', 'plane', 'plot', 'probability',
    'recovered', 'revealed', 'score', 'stage']);
  assert.doesNotMatch(read('sigmoid-squash/player.js'), /Math\.random|fetch\(|import\(|setInterval\(/);
  assert.doesNotMatch(read('sigmoid-squash/panel.html'), /@eq-/);
  const filter = fs.readFileSync(path.join(ROOT, scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
});

test('sigmoid squash: the boundary says what is not claimed, and the check transfers', t => {
  const f = fixture(t, NAME), source = declared(f);
  const boundary = f.$('.mechanism-boundary').textContent;
  assert.match(boundary, /Nothing here is trained/);
  assert.match(boundary, /the boundary is given, not learned/);
  assert.match(boundary, /monotone/);
  assert.match(boundary, /without ever moving it/);
  assert.match(boundary, /declared schematic geometry, not numbers this chapter prints/);
  assert.match(boundary, /not a measured frequency/);
  assert(f.$('.mechanism-boundary > p').textContent.split(/\s+/).length <= 32);
  const check = f.$('.mechanism-check');
  const question = check.querySelector('summary').textContent.replace(/^Check yourself\.\s*/, '');
  const answer = check.querySelector('p').textContent;
  assert(question.split(/\s+/).length <= 40, `the question has ${question.split(/\s+/).length} words`);
  assert(answer.split(/\s+/).length <= 70, `the answer has ${answer.split(/\s+/).length} words`);
  for (const text of [question, answer]) {
    assert.doesNotMatch(text, /\d-\d|\s-\d/, 'a hyphen is never a minus sign');
    assert.doesNotMatch(text, /\de[-+]?\d/, 'no e-notation');
  }
  // Its arithmetic, from the declared fixture: doubling w and b leaves the boundary alone.
  const doubled = {...source, weights: source.weights.map(v => 2 * v), bias: 2 * source.bias};
  assert(question.includes(`(${doubled.weights[0].toFixed(1)}, ${doubled.weights[1].toFixed(1)})`));
  assert(question.includes(`−${Math.abs(doubled.bias).toFixed(1)}`));
  for (const point of [...source.class0, ...source.class1, source.cross, [0.24, 0.57]])
    close(scoreOf(doubled, point), 2 * scoreOf(source, point), 1e-12);
  assert.equal(scoreOf(doubled, source.cross), 0, 'the same line still scores zero');
  assert(answer.includes(sigmoid(1).toFixed(4)) && answer.includes(sigmoid(2).toFixed(4)));
  close(sigmoid(1), 0.7310585786300049, 1e-15);
  close(sigmoid(2), 0.8807970779778823, 1e-15);
});
