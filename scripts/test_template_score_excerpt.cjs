#!/usr/bin/env node
// Test-only geometry, arithmetic and reveal checks for the Chapter 1 template/score
// excerpt. Nothing here ships: the suite recomputes the scene's schedule and its drawn
// coordinates from the panel's declared attributes and compares them with what the
// mounted player publishes and draws.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, close, canonicalMarkup, drawnMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'template-score-excerpt', scene = entry(NAME);
const WIDTHS = [296, 360, 460, 519, 520, 640, 713];
// Drawing coordinates are serialised at 0.0001 px; the published state is never rounded.
const PX = 1e-4;
const B = scene.beats, D = scene.duration, SHORT = B[7] + 1.5, BACK = B[7] + 3.5;
// Reduced motion rests a glide beat on its finished state and the length beat on the
// short template, where both of its recorded readings are on the picture.
const REST = [B[0], B[1], B[3], B[3], B[5], B[5], B[7], SHORT];

const attr = (node, key) => Number(node.getAttribute(key));
const visible = node => Boolean(node) && !node.closest('[hidden]');
const drawing = f => f.$('[data-drawing]');
const declared = f => ({
  weight: Number(f.root.dataset.templateNorm), direction: Number(f.root.dataset.templateDegrees),
  input: Number(f.root.dataset.inputNorm), bias: Number(f.root.dataset.bias),
  pulse: Number(f.root.dataset.pulseNorm), angles: numbers(f.root.dataset.angles),
  range: numbers(f.root.dataset.normRange)
});
const published = f => ({
  stage: Number(f.root.dataset.stage), theta: Number(f.root.dataset.theta),
  weight: Number(f.root.dataset.weight), cos: Number(f.root.dataset.cos),
  score: Number(f.root.dataset.score), prediction: Number(f.root.dataset.prediction),
  revealed: f.root.dataset.revealed === 'true', orthogonal: f.root.dataset.orthogonal === 'true',
  witnesses: f.root.dataset.witnesses ? f.root.dataset.witnesses.split(' ') : []
});
// The schedule, reimplemented: the input turns at a fixed length through three glides that
// each land on their beat, then the template's own length pulses inside the last beat.
const ease = u => (1 - Math.cos(Math.PI * Math.max(0, Math.min(1, u)))) / 2;
const mix = (u, a, b) => u === 0 ? a : u === 1 ? b : a + u * (b - a);
function schedule(source, time) {
  const [open, hold, right, opposed] = source.angles;
  const theta = time < B[2] ? open
    : time < B[3] ? mix(ease((time - B[2]) / (B[3] - B[2])), open, hold)
      : time < B[4] ? hold
        : time < B[5] ? mix(ease((time - B[4]) / (B[5] - B[4])), hold, right)
          : time < B[6] ? right
            : time < B[7] ? mix(ease((time - B[6]) / (B[7] - B[6])), right, opposed)
              : opposed;
  const weight = time < B[7] ? source.weight
    : time < SHORT ? mix(ease((time - B[7]) / (SHORT - B[7])), source.weight, source.pulse)
      : time < BACK ? source.pulse
        : mix(ease((time - BACK) / (D - BACK)), source.pulse, source.weight);
  return {theta, weight};
}
// Screen geometry, from the layout the player publishes. Plain trigonometry here: the
// player's exact quadrantal values differ from Math.cos by at most an ulp, which is five
// orders of magnitude inside the 0.0001 px serialisation contract.
const frame = f => ({origin: JSON.parse(f.root.dataset.origin), unit: Number(f.root.dataset.unit),
  meter: JSON.parse(f.root.dataset.meter)});
const point = (g, degrees, radius) => [g.origin[0] + radius * Math.cos(degrees * Math.PI / 180),
  g.origin[1] - radius * Math.sin(degrees * Math.PI / 180)];
const level = (g, source, value) => g.meter.base - g.meter.scale * (value - source.bias);
function shaft(node) {
  const match = /^M\s+([-+\d.eE]+)\s+([-+\d.eE]+)\s+L\s+([-+\d.eE]+)\s+([-+\d.eE]+)/.exec(node.getAttribute('d'));
  assert(match, 'the arrow has an inspectable straight shaft');
  return [match.slice(1, 3).map(Number), match.slice(3, 5).map(Number)];
}
const length = ([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]);
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

registerTransportTests(NAME, {witness: /right angle/, anchors: ['template-score-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('template score: the chapter owns the identity; the geometry is a declared schematic', t => {
  const f = fixture(t, NAME), source = declared(f), chapter = chapterSource(NAME);
  assert.equal(scene.qmd, 'chapters/part1/01-linear-regression.qmd');
  assert.equal(scene.anchor.type, 'before-heading');
  assert(chapter.includes(`\n## ${scene.anchor.target}`), 'the declared heading is in the chapter');
  assert.equal(scene.duration, 40);
  assert.deepEqual(scene.beats, [0, 5, 10, 15, 20, 25, 30, 35]);
  assert.equal(f.root.dataset.evidenceClass, 'schematic');
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal), literal);
  // The two sentences this scene exists to make visible, and the baseline reading of b.
  assert.match(chapter, /a large dot product can mean strong alignment, large magnitude,\nor both/);
  assert.match(chapter, /orthogonal inputs leave it at \$\\parameterpart\{b\}\$, and opposing inputs lower it/);
  assert.match(chapter, /default prediction when the input\ncarries no relevant information/);
  // The scene's own schematic contract: a right angle really is in the schedule, the pulse
  // really shortens the template, and the slider can reach both declared lengths.
  assert.equal(source.angles.length, 4);
  assert.equal(source.angles[2], 90);
  assert.deepEqual(source.angles, [...source.angles].sort((a, b) => a - b));
  assert(source.pulse < source.weight);
  assert(source.range[0] <= source.pulse && source.range[1] >= source.weight);
  // The meter's half-range is the largest score the slider can reach, so no drag clips it.
  const g = frame((f.load(), f.open(), f));
  close(g.meter.scale * source.input * source.range[1], Math.abs(g.meter.base - level(g, source, source.bias + source.input * source.range[1])), PX);
});

test('template score: the score is the two lengths times the direction at every instant', t => {
  const f = fixture(t, NAME, {width: 713}), source = declared(f); f.load(); f.open();
  const angles = new Set(), lengths = new Set();
  for (let n = 0; n <= 800; n++) {
    const time = Number((n / 20).toFixed(4)); f.seek(time);
    const state = published(f), want = schedule(source, time);
    close(state.theta, want.theta, 1e-12); close(state.weight, want.weight, 1e-12);
    close(state.cos, Math.cos(state.theta * Math.PI / 180), 1e-12);
    // The identity itself, not a rounded copy of it, and the bias as the baseline.
    assert.equal(state.score, state.weight * source.input * state.cos, `score at ${time}s`);
    assert.equal(state.prediction, source.bias + state.score, `prediction at ${time}s`);
    angles.add(state.theta); lengths.add(state.weight);
  }
  assert(angles.size > 100, 'the direction really sweeps');
  assert(lengths.size > 20, 'the length really pulses');
});

test('template score: the drawn shadow, arrows and meter bar are the published numbers', t => {
  for (const width of WIDTHS) {
    const f = fixture(t, NAME, {width}), source = declared(f); f.load(); f.open();
    for (const time of [0, 5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30, 32.5, 35, 36.5, 38.5, 40]) {
      f.seek(time);
      const state = published(f), g = frame(f), where = `${width}px, ${time}s`;
      const foot = point(g, source.direction, source.input * state.cos * g.unit);
      const tip = point(g, source.direction, state.weight * g.unit);
      const head = point(g, source.direction + state.theta, source.input * g.unit);
      const shadow = f.$('[data-shadow]'), drop = f.$('[data-drop]'), bar = f.$('[data-bar]');
      close(attr(shadow, 'x1'), g.origin[0], PX); close(attr(shadow, 'y1'), g.origin[1], PX);
      close(attr(shadow, 'x2'), foot[0], PX); close(attr(shadow, 'y2'), foot[1], PX);
      close(attr(f.$('[data-foot]'), 'cx'), foot[0], PX);
      close(attr(drop, 'x1'), head[0], PX); close(attr(drop, 'x2'), foot[0], PX);
      const template = shaft(f.$('[data-template]')), input = shaft(f.$('[data-input]'));
      close(length(template), state.weight * g.unit, PX);
      // The input's length never changes: only where it points does.
      close(length(input), source.input * g.unit, PX);
      close(template[1][0], tip[0], PX); close(template[1][1], tip[1], PX);
      close(input[1][0], head[0], PX); close(input[1][1], head[1], PX);
      // The drop really is perpendicular to the template's line.
      const along = [foot[0] - g.origin[0], foot[1] - g.origin[1]];
      const fall = [head[0] - foot[0], head[1] - foot[1]];
      close(along[0] * fall[0] + along[1] * fall[1], 0, 1e-6 * g.unit * g.unit);
      // The meter is the same number a second time: b to the prediction on a fixed scale.
      close(attr(bar, 'y1'), level(g, source, source.bias), PX, `bar base at ${where}`);
      close(attr(bar, 'y2'), level(g, source, state.prediction), PX, `bar top at ${where}`);
      close(attr(f.$('[data-prediction-dot]'), 'cy'), level(g, source, state.prediction), PX);
      close(Math.abs(attr(bar, 'y2') - attr(bar, 'y1')), Math.abs(state.score) * g.meter.scale, PX);
    }
  }
});

test('template score: at the right angle the shadow is a point and the prediction is exactly b', t => {
  const f = fixture(t, NAME, {width: 713}), source = declared(f); f.load(); f.open();
  for (const time of [25, 26, 27.5, 29.99]) {
    f.seek(time);
    const state = published(f), shadow = f.$('[data-shadow]'), bar = f.$('[data-bar]');
    assert.equal(state.theta, 90); assert.equal(state.cos, 0);
    assert.equal(state.score, 0, 'exactly zero, not nearly zero');
    assert.equal(state.prediction, source.bias, 'exactly b, not nearly b');
    assert.equal(state.orthogonal, true);
    assert.equal(attr(shadow, 'x1'), attr(shadow, 'x2'));
    assert.equal(attr(shadow, 'y1'), attr(shadow, 'y2'));
    assert.equal(attr(bar, 'y1'), attr(bar, 'y2'));
    assert(visible(f.$('[data-right-angle]')), 'the right-angle marker is drawn');
    assert.equal(f.$('[data-value="score"]').textContent, '0.00');
    assert.equal(f.$('[data-value="prediction"]').textContent, '+1.00');
    assert.equal(f.$('[data-value="cos"]').textContent, 'cos 0.00');
  }
  // The identity does not depend on the template's length: dragging it at the right angle
  // moves the arrow and nothing else. That is the second half of the misconception.
  f.seek(27);
  const slider = f.$('[data-weight-slider]');
  for (const value of [source.range[0], 0.6, 1, source.range[1]]) {
    slider.value = String(value); slider.dispatchEvent(new f.w.Event('input'));
    const state = published(f);
    assert.equal(state.weight, value);
    assert.equal(state.score, 0); assert.equal(state.prediction, source.bias);
    close(length(shaft(f.$('[data-template]'))), value * frame(f).unit, PX);
  }
});

test('template score: the input turns at a fixed length, and each glide lands on its beat', t => {
  const f = fixture(t, NAME, {width: 713}), source = declared(f); f.load(); f.open();
  const at = time => { f.seek(time); return published(f); };
  for (const [time, theta] of [[0, 20], [5, 20], [9.99, 20], [10, 20], [15, 80], [17, 80],
    [19.99, 80], [20, 80], [25, 90], [27, 90], [29.99, 90], [30, 90], [35, 120], [40, 120]])
    close(at(time).theta, theta, 1e-12, `theta at ${time}s`);
  for (const [from, to, a, b] of [[10, 15, 20, 80], [20, 25, 80, 90], [30, 35, 90, 120]]) {
    let previous = a;
    for (let n = 0; n <= 40; n++) {
      const theta = at(from + (to - from) * n / 40).theta;
      assert(theta >= previous - 1e-12 && theta <= b + 1e-12, `theta leaves [${a}, ${b}]`);
      previous = theta;
    }
    close(previous, b, 1e-12);
  }
  // The template's length is untouched until the last beat; the input's never changes.
  for (let n = 0; n <= 70; n++) { const state = at(n / 2); assert.equal(state.weight, source.weight); }
  assert.equal(at(35).weight, source.weight);
});

test('template score: the answer is absent while the caption asks the reader to predict', t => {
  const f = fixture(t, NAME, {width: 713}); f.load(); f.open();
  const range = f.$('[data-controls] input[type=range]');
  for (let n = 0; n < 100; n++) {
    const time = Number((15 + n * 0.05).toFixed(4)); f.seek(time);
    const state = published(f);
    assert.equal(state.theta, 80, `the input has started toward the answer at ${time}s`);
    assert.equal(state.orthogonal, false);
    assert.equal(f.$('[data-value="score"]').textContent, '+0.52');
    assert.equal(f.$('[data-value="prediction"]').textContent, '+1.52');
    assert(!visible(f.$('[data-right-angle]')), `the right-angle marker leaks at ${time}s`);
    assert.equal(f.root.dataset.witnesses, '', `a recorded reading leaks at ${time}s`);
    const spoken = `${f.$('[data-figure] svg').getAttribute('aria-label')} `
      + `${range.getAttribute('aria-valuetext')} ${drawnMarkup(f)}`;
    assert.doesNotMatch(spoken, /zero|exactly b|right angle: /i, `the answer leaks at ${time}s`);
    assert.doesNotMatch(spoken, /(^|[^\d])0\.00/, `a zero reading leaks at ${time}s`);
  }
  assert.match(f.$('[data-caption]').textContent, /What score do you expect/);
  f.seek(20); assert.match(f.$('[data-caption]').textContent, /^Released/);
  f.seek(25); assert.match(f.$('[data-caption]').textContent, /exactly b/);
});

test('template score: act two moves the length and leaves the direction exactly where it was', t => {
  const f = fixture(t, NAME, {width: 713}), source = declared(f); f.load(); f.open();
  const lengths = new Set();
  for (let n = 0; n <= 100; n++) {
    const time = Number((35 + n * 0.05).toFixed(4)); f.seek(time);
    const state = published(f);
    assert.equal(state.theta, 120, `the angle moved at ${time}s`);
    assert.equal(state.cos, -0.5, `the direction similarity moved at ${time}s`);
    assert.equal(f.$('[data-value="cos"]').textContent, 'cos −0.50');
    // With this input length the score IS the template's length, up to the fixed cosine.
    assert.equal(state.score, source.input * -0.5 * state.weight);
    lengths.add(state.weight);
  }
  assert(lengths.size > 25, 'the length really moves across the beat');
  f.seek(SHORT); const short = published(f);
  f.seek(D); const full = published(f);
  assert.equal(short.weight, source.pulse); assert.equal(full.weight, source.weight);
  assert.equal(short.cos, full.cos);
  assert.equal(short.score / full.score, source.pulse / source.weight);
  assert.equal(short.prediction, source.bias + short.score);
  // Both readings stay on the final frame, so two still frames could still be compared.
  const g = frame(f);
  assert.deepEqual(full.witnesses, ['right', 'full', 'short']);
  close(attr(f.$('[data-ring="short"]'), 'y1'), level(g, source, short.prediction), PX);
  close(attr(f.$('[data-ring="full"]'), 'y1'), level(g, source, full.prediction), PX);
  close(attr(f.$('[data-ring="right"]'), 'y1'), level(g, source, source.bias), PX);
});

test('template score: the shadow, the meter and each recorded reading appear in their own beat', t => {
  const f = fixture(t, NAME, {width: 713}); f.load(); f.open();
  const revealed = ['[data-shadow]', '[data-drop]', '[data-foot]', '[data-name="score"]',
    '[data-value="score"]', '[data-meter-axis]', '[data-base]', '[data-bar]',
    '[data-prediction-dot]', '[data-value="prediction"]'];
  for (const time of [0, 2.5, 4.99, 5, 10, 20, 25, 30, 35, 40]) {
    f.seek(time);
    for (const selector of revealed)
      assert.equal(visible(f.$(selector)), time >= 5, `${selector} at ${time}s`);
    // A withheld number is a middle dot, never a zero, which would read as a measurement.
    for (const key of ['score', 'prediction'])
      assert.equal(f.$(`[data-value="${key}"]`).textContent === '·', time < 5, `${key} at ${time}s`);
    // The lengths and the angle are scenery from the first frame; only the score waits.
    for (const key of ['weight', 'input', 'angle', 'cos'])
      assert.notEqual(f.$(`[data-value="${key}"]`).textContent, '·');
    for (const [key, from] of [['right', 25], ['full', 35], ['short', SHORT]]) {
      assert.equal(visible(f.$(`[data-ring="${key}"]`)), time >= from, `ring ${key} at ${time}s`);
      assert.equal(visible(f.$(`[data-ring-label="${key}"]`)), time >= from);
    }
    const formula = f.$('[data-formula]');
    assert.equal(formula.classList.contains('ts-model-shown'), time >= 5);
    assert.equal(formula.classList.contains('ts-identity-shown'), time >= 10);
    // The wash names the factor that is moving: direction in act one, length in act two.
    assert.equal(formula.classList.contains('ts-direction-lit'), time >= 10 && time < 35);
    assert.equal(formula.classList.contains('ts-length-lit'), time >= 35);
  }
});

test('template score: reduced motion rests each beat on one still the caption is true of', t => {
  const f = fixture(t, NAME, {reduced: true, width: 713}), source = declared(f); f.load(); f.open();
  for (let index = 0; index < B.length; index++) {
    const end = index + 1 < B.length ? B[index + 1] : D, want = schedule(source, REST[index]);
    for (let time = B[index]; time < end - 1e-9; time = Number((time + 0.25).toFixed(4))) {
      f.seek(time);
      const state = published(f);
      assert.equal(state.stage, index);
      close(state.theta, want.theta, 1e-12, `beat ${index} still at ${time}s`);
      close(state.weight, want.weight, 1e-12, `beat ${index} still at ${time}s`);
    }
  }
  // The stills the captions promise: a frozen predict beat with no answer, an exactly
  // orthogonal still, and a length still that already carries both readings.
  f.seek(17.5); assert.equal(published(f).theta, 80); assert.equal(published(f).orthogonal, false);
  f.seek(27.5); assert.equal(published(f).score, 0); assert.match(f.$('[data-caption]').textContent, /exactly b/);
  f.seek(37.5); assert.equal(published(f).weight, source.pulse);
  assert.deepEqual(published(f).witnesses, ['right', 'full', 'short']);
});

test('template score: the one control is timeline-driven, and a drag is a detour', t => {
  const f = fixture(t, NAME, {width: 713}), source = declared(f); f.load(); f.open();
  const slider = f.$('[data-weight-slider]');
  assert.equal(f.root.querySelectorAll('[data-pane] input[type="range"]').length, 2);
  assert.equal(slider.closest('[data-controls]'), null, 'a second range can never become the clock');
  assert.equal(slider.min, String(source.range[0]));
  assert.equal(slider.max, String(source.range[1]));
  assert.equal(f.$('[data-weight-display]').getAttribute('aria-hidden'), 'true');
  // The timeline sweeps it, so a passive viewer still sees act two.
  f.seek(SHORT); assert.equal(Number(slider.value), source.pulse);
  assert.equal(f.$('[data-weight-readout]').textContent, '0.75');
  f.seek(D); assert.equal(Number(slider.value), source.weight);
  // Dragging pauses playback and recomputes the whole picture from the dragged value.
  f.seek(12); f.play(); assert(f.playing);
  slider.value = '0.4'; slider.dispatchEvent(new f.w.Event('input'));
  assert(!f.playing); assert.equal(f.root.dataset.override, 'slider');
  assert.equal(published(f).weight, 0.4);
  close(length(shaft(f.$('[data-template]'))), 0.4 * frame(f).unit, PX);
  assert.match(f.$('[data-caption]').textContent, /moving the template/);
  // Its own keys never reach the pane's beat seeking, and never end the detour.
  const parked = f.time;
  f.key('ArrowRight', slider); f.key('End', slider);
  assert.equal(f.time, parked); assert.equal(f.root.dataset.override, 'slider');
  // Any timeline action restores the timeline's own value: the drag was a detour.
  f.key('ArrowRight');
  assert.equal(f.root.dataset.override, ''); assert.equal(published(f).weight, source.weight);
  slider.value = '1'; slider.dispatchEvent(new f.w.Event('input'));
  assert.equal(published(f).weight, 1);
  f.seek(30); assert.equal(f.root.dataset.override, ''); assert.equal(published(f).weight, source.weight);
});

test('template score: every label stays inside the picture and clear of every other label', t => {
  for (const width of WIDTHS) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    for (let n = 0; n <= 80; n++) {
      const time = Number((n / 2).toFixed(4)); f.seek(time);
      const [, , w, h] = numbers(f.$('[data-figure] svg').getAttribute('viewBox'));
      const drawn = boxes(f), where = `${width}px, ${time}s`;
      for (const box of drawn) {
        assert(box.left >= 0 && box.right <= w, `"${box.text}" leaves the picture sideways at ${where}`);
        assert(box.top >= 0 && box.bottom <= h, `"${box.text}" leaves the picture vertically at ${where}`);
        assert(attr([...drawing(f).querySelectorAll('text')].find(node => node.textContent === box.text), 'font-size') >= 12,
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

test('template score: arbitrary seek and resize histories reproduce the complete published frame', t => {
  const f = fixture(t, NAME, {width: 713}); f.load(); f.open();
  const snapshot = () => JSON.stringify({drawing: canonicalMarkup(f.$('[data-figure]').innerHTML),
    formula: canonicalMarkup(f.$('[data-formula]').outerHTML), caption: f.$('[data-caption]').innerHTML,
    readout: f.$('[data-weight-readout]').textContent,
    state: Object.fromEntries(Object.entries(f.root.dataset).filter(([key]) => !['time', 'playing', 'typeset'].includes(key)))});
  const times = [0, 5, 10, 13.2, 15, 18.4, 20, 23.7, 25, 30, 33.3, 35, 36.5, 38.5, 40];
  const first = times.map(time => { f.seek(time); return snapshot(); });
  f.play(); f.tick(1234); f.resize(296); f.seek(21.3); f.resize(713);
  f.$('[data-weight-slider]').value = '1.2';
  f.$('[data-weight-slider]').dispatchEvent(new f.w.Event('input'));
  f.key('Home');
  assert.deepEqual(times.toReversed().map(time => { f.seek(time); return snapshot(); }), first.toReversed());
});

test('template score: the narrow layout is a reflow, not a shrunken copy of the wide one', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (const width of WIDTHS) {
    f.resize(width); f.seek(40);
    const [, , w, h] = numbers(f.$('[data-figure] svg').getAttribute('viewBox'));
    assert.equal(f.root.dataset.layout, width < 520 ? 'narrow' : 'wide');
    assert.deepEqual([w, h], width < 520 ? [296, 500] : [713, 372]);
    assert.equal(f.$('[data-figure] svg').getAttribute('preserveAspectRatio'), 'xMinYMin meet');
    // Both layouts keep one picture's worth of marks, all inside the frame.
    for (const node of [...drawing(f).querySelectorAll('line')].filter(visible))
      for (const [key, limit] of [['x1', w], ['x2', w], ['y1', h], ['y2', h]])
        assert(attr(node, key) >= 0 && attr(node, key) <= limit, `${key} of a line leaves the frame at ${width}px`);
    assert(drawing(f).querySelectorAll('*').length < 60);
  }
});

test('template score: the wide and narrow script-free prints reproduce the final frame', async t => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after, 'regenerate the template-score static frames');
  const f = fixture(t, NAME), narrow = f.$('[data-static-frame="narrow"]');
  assert(narrow); assert.equal(narrow.dataset.width, '296');
  const ids = [...f.root.querySelectorAll('[id]')].map(node => node.id);
  assert.equal(ids.length, new Set(ids).size);
  for (const print of [drawing(f), narrow]) {
    assert.match(print.textContent, /right angle/);
    assert.match(print.textContent, /length 0\.75/);
    assert.match(print.textContent, /length 1\.50/);
    assert.match(print.textContent, /−1\.50/);
    assert.equal(print.querySelectorAll('[data-ring]').length, 3);
    assert(print.querySelector('[data-shadow]'));
  }
  f.load(); f.open(); f.seek(40); f.resize(296);
  assert.equal(f.root.querySelectorAll('[data-static-frame="narrow"]').length, 0);
  const css = read('template-score/player.css');
  assert.match(css, /@container\s*\(max-width:\s*519px\)/);
  assert.match(css, new RegExp(`aspect-ratio:\\s*296\\s*/\\s*${narrow.dataset.height}`));
});

test('template score: an unusable fixture cannot silently mount a different mechanism', t => {
  const broken = [{angles: '20 80 89 120'}, {angles: '20 80 90'}, {angles: '120 80 90 20'},
    {pulseNorm: '1.5'}, {pulseNorm: '2.5'}, {templateNorm: '0'}, {inputNorm: 'x'},
    {normRange: '0.9 1.75'}, {normRange: '0.25 1.2'}, {bias: 'Infinity'}];
  for (const change of broken) {
    const f = mount(t, change);
    assert.throws(() => f.load(), /template-score/, JSON.stringify(change));
    assert(!f.root.dataset.ready, 'a rejected fixture never mounts a player');
    assert.match(drawing(f).textContent, /right angle/, 'the script-free print is left in place');
  }
});

test('template score: the player exports nothing and publishes a fixed set of state keys', t => {
  const f = fixture(t, NAME, {width: 713}); f.load(); f.open();
  assert.equal(f.w.BookTemplateScore, undefined);
  assert.deepEqual(Object.keys(f.root.dataset).filter(key => ![
    'player', 'playback', 'evidenceClass', 'templateNorm', 'templateDegrees', 'inputNorm',
    'bias', 'pulseNorm', 'angles', 'normRange', 'ready', 'duration', 'time', 'playing', 'typeset'
  ].includes(key)).sort(),
  ['cos', 'layout', 'meter', 'origin', 'orthogonal', 'override', 'prediction', 'revealed',
    'score', 'stage', 'theta', 'unit', 'weight', 'witnesses']);
  assert.doesNotMatch(read('template-score/player.js'), /Math\.random|fetch\(|import\(|setInterval\(/);
  assert.doesNotMatch(read('template-score/panel.html'), /@eq-/);
  const filter = fs.readFileSync(path.join(ROOT, scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
});

test('template score: the boundary says what is not claimed, and the check transfers', t => {
  const f = fixture(t, NAME);
  const boundary = f.$('.mechanism-boundary').textContent;
  assert.match(boundary, /Nothing here is trained/);
  assert.match(boundary, /declared schematic drawing geometry, not numbers this chapter prints/);
  assert.match(boundary, /adds nothing to <?em?>?this<?\/?em?>? prediction|adds nothing to .*this.* prediction/);
  assert.match(boundary, /not that the feature is useless/);
  assert.match(boundary, /not cosine similarity/);
  assert.equal(f.$('.mechanism-boundary > p').textContent.split(/\s+/).length <= 32, true);
  // The transfer check applies the mechanism to a length the scene never varied.
  const check = f.$('.mechanism-check');
  const question = check.querySelector('summary').textContent.replace(/^Check yourself\.\s*/, '');
  const answer = check.querySelector('p').textContent;
  assert(question.split(/\s+/).length <= 40, `the question has ${question.split(/\s+/).length} words`);
  assert(answer.split(/\s+/).length <= 70, `the answer has ${answer.split(/\s+/).length} words`);
  for (const text of [question, answer]) {
    assert.doesNotMatch(text, /\d-\d|\s-\d/, 'a hyphen is never a minus sign');
    assert.doesNotMatch(text, /\de[-+]?\d/, 'no e-notation');
  }
  // Its arithmetic, from the declared fixture: a longer, worse-aligned input scores more.
  const source = declared(f);
  assert.equal(source.weight * 4 * 0.5, 3);
  assert.equal(source.bias + 3, 4);
  close(source.bias + source.weight * source.input * Math.cos(source.angles[0] * Math.PI / 180), 3.8190778623577253, 1e-12);
  assert(4 > 3.82, 'the check really does beat the opening reading');
});
