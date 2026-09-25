#!/usr/bin/env node
// Test-only geometry and picture checks for the Chapter 1 column-space excerpt.
// No dependency of this file ships. The oracle below recomputes the projection, the weights
// that reach it, the residual and every drawn coordinate from the panel's declared fixture,
// so the player cannot agree with itself.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, close, canonicalMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'column-space-excerpt', scene = entry(NAME);
const WIDTHS = [240, 296, 375, 480, 519, 520, 640, 713];
const PX = 1e-4;
const sum = values => values.reduce((total, value) => total + value, 0);
const dot = (a, b) => sum(a.map((value, index) => value * b[index]));
const add = (a, b) => a.map((value, index) => value + b[index]);
const sub = (a, b) => a.map((value, index) => value - b[index]);
const times = (a, k) => a.map(value => value * k);
const norm = a => Math.sqrt(dot(a, a));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const solve2 = (g, b) => {
  const det = g[0][0] * g[1][1] - g[0][1] * g[1][0];
  return [(b[0] * g[1][1] - g[0][1] * b[1]) / det, (g[0][0] * b[1] - b[0] * g[1][0]) / det];
};
const closeTree = (actual, expected, epsilon = 1e-12) => {
  if (Array.isArray(expected)) {
    assert(Array.isArray(actual)); assert.equal(actual.length, expected.length);
    expected.forEach((value, index) => closeTree(actual[index], value, epsilon));
  } else close(actual, expected, epsilon);
};
const attr = (node, key) => Number(node.getAttribute(key));
const json = (f, key) => JSON.parse(f.root.dataset[key]);
const drawing = f => f.$('[data-drawing]');
const visible = node => node && !node.closest('[hidden]') && !node.hasAttribute('hidden');
const declared = f => ({columns: JSON.parse(f.root.dataset.columns), target: JSON.parse(f.root.dataset.target),
  path: f.root.dataset.path.trim().split(/\s+/).map(Number),
  bow: Number(f.root.dataset.bow), elevation: Number(f.root.dataset.elevation)});
function mount(t, source, options = {}) {
  const f = fixture(t, NAME, options);
  if (source) Object.assign(f.root.dataset, {columns: JSON.stringify(source.columns),
    target: JSON.stringify(source.target), path: source.path.join(' '),
    bow: String(source.bow), elevation: String(source.elevation)});
  return f;
}

// The independent oracle: nothing below reads the player.
function oracle(source) {
  const [c1, c2] = source.columns, y = source.target;
  const gram = [[dot(c1, c1), dot(c1, c2)], [dot(c2, c1), dot(c2, c2)]];
  const optimum = solve2(gram, [dot(c1, y), dot(c2, y)]);
  const foot = add(times(c1, optimum[0]), times(c2, optimum[1]));
  const leftover = sub(y, foot), floor = norm(leftover);
  const normal = cross(c1, c2), unit = times(normal, 1 / norm(normal));
  const along = times(c1, 1 / norm(c1)), across = cross(unit, along);
  const heading = Math.atan2(dot(c2, across), dot(c2, along)) / 2 + Math.PI / 2;
  const right = add(times(along, Math.cos(heading)), times(across, Math.sin(heading)));
  const depth = add(times(along, -Math.sin(heading)), times(across, Math.cos(heading)));
  const phi = source.elevation * Math.PI / 180;
  const up = add(times(unit, Math.cos(phi)), times(depth, Math.sin(phi)));
  const project = v => [dot(v, right), -dot(v, up)];
  const at = tau => {
    const offset = add(times(right, tau), times(depth, -source.bow * tau * tau));
    const prediction = add(foot, offset);
    return {tau, offset, prediction, residual: sub(y, prediction),
      weights: add(optimum, solve2(gram, [dot(c1, offset), dot(c2, offset)])),
      length: norm(sub(y, prediction)), drawn: norm(sub(project(y), project(prediction)))};
  };
  return {c1, c2, y, gram, optimum, foot, leftover, floor, unit, right, depth, up, project, at};
}
// The timeline the player must reproduce, written out independently of it.
const smoother = u => u * u * u * (u * (u * 6 - 15) + 10);
function tauAt(source, time) {
  const beats = scene.beats, clamped = Math.max(0, Math.min(scene.duration, time));
  let stage = 0;
  beats.forEach((beat, index) => {if (clamped >= beat) stage = index;});
  const next = beats[stage + 1] === undefined ? scene.duration : beats[stage + 1];
  const fraction = next > beats[stage] ? Math.min(1, (clamped - beats[stage]) / (next - beats[stage])) : 1;
  return {stage, tau: source.path[stage] + (source.path[stage + 1] - source.path[stage]) * smoother(fraction)};
}
function shaft(node) {
  const match = /^M\s+([-+\d.eE]+)\s+([-+\d.eE]+)\s+L\s+([-+\d.eE]+)\s+([-+\d.eE]+)/.exec(node.getAttribute('d'));
  assert(match, 'the arrow has an inspectable straight shaft');
  return [match.slice(1, 3).map(Number), match.slice(3, 5).map(Number)];
}
// JSDOM lays nothing out, so a label's extent is estimated from its own font size. 0.62 em
// per character is measured against the browser preview's widest label, "column 1".
const box = node => {
  const size = attr(node, 'font-size'), text = node.textContent;
  const reach = 0.62 * size * text.length, anchor = node.getAttribute('text-anchor') || 'start';
  const x = attr(node, 'x'), left = anchor === 'end' ? x - reach : anchor === 'middle' ? x - reach / 2 : x;
  return {left, right: left + reach, top: attr(node, 'y') - size, bottom: attr(node, 'y') + 0.25 * size, node};
};
const apart = (a, b, pad = 0) =>
  a.right + pad < b.left || b.right + pad < a.left || a.bottom + pad < b.top || b.bottom + pad < a.top;

registerTransportTests(NAME, {witness: /\u2016e\u2016 = 3\.00/, anchors: ['column-space-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('column space: the manuscript owns the geometry while the vectors are declared schematic', t => {
  const f = fixture(t, NAME), chapter = chapterSource(NAME);
  assert.equal(scene.qmd, 'chapters/part1/01-linear-regression.qmd');
  assert.equal(scene.anchor.type, 'before-heading');
  assert.equal(scene.anchor.target, 'Finding the best weights, method 2: walk downhill');
  assert.equal(scene.duration, 40);
  assert.deepEqual(scene.beats, [0, 5, 10, 15, 20, 25, 30, 35]);
  assert.equal(f.root.dataset.evidenceClass, 'schematic');
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal), literal);
  // The panel sits after the projection figure and before the gradient-descent heading, so
  // its intro may point at "the projection figure above".
  const figure = chapter.indexOf('{#fig-projection'), anchor = chapter.indexOf(`\n## ${scene.anchor.target}`);
  const equation = chapter.indexOf('{#eq-normal}');
  assert(equation > 0 && figure > equation && anchor > figure, 'normal equations, figure, then the heading');
  assert.match(f.$('.mechanism-intro').textContent, /projection figure above/);
  // The two facts this scene declines to draw are the chapter's own, named in the scope.
  assert.match(chapter, /\*\*Rank deficiency: one prediction, many weights\.\*\*[\s\S]*?The fitted prediction is still unique; the weights are not/);
  assert.match(chapter, /\*\*Conditioning: factor [\s\S]*?\*\* Forming the normal equations\n\s+squares the spectral condition number/);
  // The panel links the equation by anchor, never by a guessed number, and never with @eq-.
  assert.match(read('column-space/panel.html'), /href="#eq-normal"/);
  assert.doesNotMatch(read('column-space/panel.html'), /@eq-/);
});

test('column space: the declared fixture solves the normal equations in exact integers', t => {
  const source = declared(fixture(t, NAME)), want = oracle(source);
  assert.deepEqual(source.columns, [[2, -1, 0], [0, 1, -1]]);
  assert.deepEqual(source.target, [3, 3, 0]);
  closeTree(want.gram, [[5, -1], [-1, 2]]);
  closeTree([dot(want.c1, want.y), dot(want.c2, want.y)], [3, 3]);
  closeTree(want.optimum, [1, 2]);
  closeTree(want.foot, [2, 1, -2]);
  closeTree(want.leftover, [1, 2, 2]);
  close(want.floor, 3);
  // The residual is perpendicular to every column: X transpose e is exactly zero, which is
  // the same statement as the normal equations the chapter prints.
  for (const column of source.columns) close(dot(column, want.leftover), 0);
  closeTree(solve2(want.gram, [dot(want.c1, want.y), dot(want.c2, want.y)]), want.optimum);
  // Pythagoras closes: 9 + 9 = 18, so the target really does stick out of the plane.
  close(dot(want.foot, want.foot) + dot(want.leftover, want.leftover), dot(want.y, want.y));
  close(dot(want.y, want.y), 18);
  // The camera is orthonormal and its horizontal direction lies in the plane, which is why
  // the perpendicular residual is drawn straight up the page.
  for (const [a, b] of [[want.right, want.up], [want.right, want.unit], [want.right, want.depth]]) close(dot(a, b), 0);
  close(norm(want.right), 1); close(norm(want.up), 1); close(norm(want.unit), 1);
  close(want.project(want.leftover)[0], 0);
  assert(want.project(want.leftover)[1] < 0, 'the target is drawn above the plane, not below it');
});

test('column space: the published state matches the oracle at every time and in both layouts', t => {
  const f = fixture(t, NAME), source = declared(f), want = oracle(source);
  f.load(); f.open();
  for (const width of [713, 296]) {
    f.resize(width);
    const seen = new Set();
    for (let step = 0; step <= 400; step++) {
      const time = step / 10, expected = tauAt(source, time), state = want.at(expected.tau);
      f.seek(time);
      close(Number(f.root.dataset.tau), expected.tau);
      closeTree(json(f, 'weights'), state.weights);
      close(Number(f.root.dataset.residual), state.length);
      close(Number(f.root.dataset.drawn), state.drawn, 1e-9);
      assert.equal(f.root.dataset.stage, String(expected.stage));
      // The candidate never leaves the plane: its prediction is exactly a combination of the
      // two declared columns, and that combination is the published weight pair.
      const weights = json(f, 'weights');
      closeTree(add(times(source.columns[0], weights[0]), times(source.columns[1], weights[1])), state.prediction);
      seen.add(expected.tau.toFixed(6));
    }
    assert(seen.size > 100, 'the sweep visits many intermediate candidates, not only the beats');
  }
  closeTree(json(f, 'optimum'), want.optimum);
  close(Number(f.root.dataset.floor), want.floor);
});

test('column space: the residual floors at the foot and the drawn arrow never contradicts it', t => {
  const f = fixture(t, NAME), source = declared(f), want = oracle(source);
  f.load(); f.open();
  let previous = null, footTimes = 0, above = 0;
  for (let step = 0; step <= 800; step++) {
    const time = step / 20;
    f.seek(time);
    const tau = Number(f.root.dataset.tau), length = Number(f.root.dataset.residual);
    const drawn = Number(f.root.dataset.drawn);
    close(length, Math.hypot(want.floor, norm(want.at(tau).offset)));
    if (Math.abs(tau) < 1e-9) {
      close(length, want.floor); footTimes++;
    } else {
      assert(length > want.floor, `the residual dips below its floor at ${time}s`);
      assert(drawn > want.at(0).drawn, `the drawn residual is shorter than at the foot at ${time}s`);
      above++;
    }
    // No visual lie: the arrow on the page and the number beside it move the same way.
    if (previous && Math.abs(length - previous.length) > 1e-9)
      assert.equal(Math.sign(length - previous.length), Math.sign(drawn - previous.drawn),
        `the drawn residual and the true residual move in opposite directions at ${time}s`);
    previous = {length, drawn};
  }
  assert(footTimes > 100 && above > 100, 'the sweep both rests at the floor and leaves it');
  // Leaving the foot in either direction lengthens it: a minimum, not the end of a path.
  for (const tau of [-2.8, -1, -0.25, 0.25, 1, 2.4]) {
    assert(want.at(tau).length > want.floor);
    assert(want.at(tau).drawn > want.at(0).drawn);
  }
});

test('column space: the picture draws the geometry it publishes, not a sketch of it', t => {
  const f = fixture(t, NAME), source = declared(f), want = oracle(source);
  f.load(); f.open();
  for (const width of WIDTHS) {
    f.resize(width);
    const origin = json(f, 'origin'), scale = Number(f.root.dataset.pixelsPerUnit);
    const plot = v => [origin[0] + scale * want.project(v)[0], origin[1] + scale * want.project(v)[1]];
    for (const time of [0, 5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30, 32.5, 35, 40]) {
      f.seek(time);
      const where = `at ${width}px, ${time}s`;
      const state = want.at(Number(f.root.dataset.tau)), weights = json(f, 'weights');
      const here = plot(state.prediction), above = plot(source.target), home = plot([0, 0, 0]);
      closeTree([attr(f.$('[data-prediction]'), 'cx'), attr(f.$('[data-prediction]'), 'cy')], here, PX);
      closeTree([attr(f.$('[data-target-dot]'), 'cx'), attr(f.$('[data-target-dot]'), 'cy')], above, PX);
      closeTree([attr(f.$('[data-origin]'), 'cx'), attr(f.$('[data-origin]'), 'cy')], home, PX);
      closeTree(shaft(f.$('[data-residual]')), [here, above], PX, `the residual runs from the candidate to the target ${where}`);
      closeTree(shaft(f.$('[data-target-arrow]')), [home, above], PX);
      // The two column arrows are head to tail once the build finishes, and their sum is the
      // candidate: ŷ = w₁X_:1 + w₂X_:2 is drawn, not asserted.
      const legs = [0, 1].map(index => shaft(f.$(`[data-column="${index}"]`)));
      if (time >= 10) {
        closeTree(legs[0], [home, plot(times(source.columns[0], weights[0]))], PX);
        closeTree(legs[1][0], legs[0][1], PX, `the second column starts at the head of the first ${where}`);
        closeTree(legs[1][1], here, PX, `the chain lands on the candidate ${where}`);
      } else if (time <= 5) {
        closeTree(legs[0], [home, plot(source.columns[0])], PX);
        closeTree(legs[1], [home, plot(source.columns[1])], PX);
      }
      // The right-angle mark is the drawn projection of a genuine three-dimensional square:
      // equal legs along two exactly perpendicular directions.
      const mark = /^M\s+(\S+)\s+(\S+)\s+L\s+(\S+)\s+(\S+)\s+L\s+(\S+)\s+(\S+)$/
        .exec(f.$('[data-right-angle]').getAttribute('d'));
      assert(mark, `the right-angle mark is two segments ${where}`);
      const leg = 11 / scale, base = add(want.foot, times(want.right, -leg));
      closeTree([mark[1], mark[2]].map(Number), plot(base), PX);
      closeTree([mark[3], mark[4]].map(Number), plot(add(base, times(want.unit, leg))), PX);
      closeTree([mark[5], mark[6]].map(Number), plot(add(want.foot, times(want.unit, leg))), PX);
      close(dot(times(want.right, -leg), times(want.unit, leg)), 0);
      close(norm(times(want.right, leg)), norm(times(want.unit, leg)));
    }
  }
});

test('column space: the prediction is withheld until the sweep has reached the foot', t => {
  const f = fixture(t, NAME);
  f.load(); f.open();
  const range = f.$('[data-controls] input[type=range]');
  const spoiler = /right angle|perpendicular|foot of|projection of/i;
  for (let step = 0; step <= 800; step++) {
    const time = step / 20;
    f.seek(time);
    const revealed = time >= 20;
    assert.equal(f.root.dataset.revealed, String(revealed), `revealed flag at ${time}s`);
    const words = [f.$('[data-caption]').textContent, f.$('[data-figure] svg').getAttribute('aria-label'),
      range.getAttribute('aria-valuetext'), ...[...drawing(f).querySelectorAll('text')].map(node => node.textContent)];
    for (const text of words)
      assert.equal(spoiler.test(text), revealed && spoiler.test(text),
        `the answer appears at ${time}s in: ${text}`);
    if (!revealed) {
      for (const text of words) assert.doesNotMatch(text, spoiler, `spoiled at ${time}s: ${text}`);
      assert(!visible(f.$('[data-right-angle]')), `the right-angle mark is drawn at ${time}s`);
    }
  }
  // The question stands still for its whole first beat, so the reader has time to answer it.
  f.seek(0); const asked = f.$('[data-caption]').textContent;
  assert.match(asked, /Where does the wine residual become shortest\?$/);
  for (const time of [0, 1, 2, 3, 4, 4.99]) {
    f.seek(time);
    assert.equal(f.$('[data-caption]').textContent, asked);
    close(Number(f.root.dataset.tau), 1.9);
  }
  // At the reveal the mark, the floor reading and the normal equations arrive together.
  f.seek(20);
  assert(visible(f.$('[data-right-angle]')));
  assert.equal(f.$('[data-value="residual"]').textContent, '\u2016e\u2016 = 3.00');
  assert(f.$('[data-formula]').classList.contains('cs-normal-shown'));
  assert(f.$('[data-formula]').classList.contains('cs-normal-lit'));
  // And it is a mark on the picture, not a permanent decoration: it leaves with the candidate.
  f.seek(27.5); assert(!visible(f.$('[data-right-angle]')));
  f.seek(35); assert(visible(f.$('[data-right-angle]')));
});

test('column space: the reveals arrive in their explanatory order', t => {
  const f = fixture(t, NAME);
  f.load(); f.open();
  for (const time of [0, 2.5, 4.99, 5, 7.5, 9.99, 10, 15, 19.99, 20, 25, 30, 35, 40]) {
    f.seek(time);
    const formula = f.$('[data-formula]');
    for (const node of drawing(f).querySelectorAll('[data-value^="weight"]'))
      assert.equal(Boolean(visible(node)), time >= 5, `the weights appear with the build at ${time}s`);
    assert.equal(formula.classList.contains('cs-combo-shown'), time >= 5);
    assert.equal(formula.classList.contains('cs-combo-lit'), time >= 5 && time < 20);
    assert.equal(formula.classList.contains('cs-normal-shown'), time >= 20);
    assert.equal(formula.classList.contains('cs-gap-lit'), time >= 35);
    // The plane, its lattice, the origin, the target and the columns are there from the start.
    for (const selector of ['[data-plane]', '[data-origin]', '[data-target-arrow]', '[data-target-dot]',
      '[data-column="0"]', '[data-column="1"]', '[data-prediction]', '[data-residual]',
      '[data-column-name="0"]', '[data-column-name="1"]'])
      assert(visible(f.$(selector)), `${selector} is missing at ${time}s`);
    assert(drawing(f).querySelectorAll('[data-grid]').length >= 6, 'the span is drawn as a lattice');
  }
  // The build glide runs inside its own beat and lands on the declared weights at its end.
  const weightAt = time => {f.seek(time); return [...drawing(f).querySelectorAll('[data-value^="weight"]')]
    .map(node => Number(node.textContent.replace('\u00d7', '').trim()));};
  const source = declared(f), want = oracle(source);
  const rounded = tau => want.at(tau).weights.map(value => Number(value.toFixed(2)));
  assert.deepEqual(weightAt(5), [1, 1], 'the columns start unscaled');
  assert.deepEqual(weightAt(10), rounded(source.path[2]));
  assert.notDeepEqual(rounded(source.path[2]), [1, 2], 'the start is genuinely off the optimum');
  assert.deepEqual(weightAt(20), [1, 2], 'the optimum is reached with its integer weights');
  assert.deepEqual(weightAt(40), [1, 2]);
});

test('column space: reduced motion holds one self-consistent still per beat', t => {
  const f = fixture(t, NAME, {reduced: true}), source = declared(f);
  f.load(); f.open();
  scene.beats.forEach((beat, index) => {
    const next = index + 1 < scene.beats.length ? scene.beats[index + 1] : scene.duration;
    for (const time of [beat, beat + 0.05, (beat + next) / 2, next - 0.01]) {
      f.seek(time);
      close(Number(f.root.dataset.tau), source.path[index]);
      assert.equal(f.root.dataset.stage, String(index));
    }
  });
  // Each still is one the caption is true of: the right angle stands exactly where the
  // caption names it and nowhere else.
  for (const [index, marked] of [[0, false], [1, false], [2, false], [3, false],
    [4, true], [5, true], [6, false], [7, true]]) {
    f.seek(scene.beats[index]);
    assert.equal(Boolean(visible(f.$('[data-right-angle]'))), marked, `right-angle at beat ${index}`);
  }
});

test('column space: seek and resize histories reproduce the complete published frame', t => {
  const f = fixture(t, NAME);
  f.load(); f.open();
  const snapshot = () => JSON.stringify({picture: canonicalMarkup(f.$('[data-figure]').innerHTML),
    formula: canonicalMarkup(f.$('[data-formula]').outerHTML), caption: f.$('[data-caption]').innerHTML,
    state: Object.fromEntries(Object.entries(f.root.dataset).filter(([key]) => !['time', 'playing', 'typeset'].includes(key)))});
  const times = [0, 5, 8.3, 10, 13.7, 15, 18.2, 20, 24.4, 25, 29.1, 30, 33.6, 35, 40];
  const first = times.map(time => {f.seek(time); return snapshot();});
  f.play(); f.tick(2222); f.resize(296); f.seek(17.4); f.resize(713); f.seek(3.3);
  assert.deepEqual(times.toReversed().map(time => {f.seek(time); return snapshot();}), first.toReversed());
});

test('column space: every label stays inside the picture and clear of the marks it is not', t => {
  const f = fixture(t, NAME);
  f.load(); f.open();
  for (const width of WIDTHS) {
    f.resize(width);
    const height = numbers(f.$('[data-figure] svg').getAttribute('viewBox'))[3];
    assert.equal(f.root.dataset.layout, width < 520 ? 'narrow' : 'wide');
    for (let step = 0; step <= 80; step++) {
      const time = step / 2;
      f.seek(time);
      const where = `at ${width}px, ${time}s`;
      const labels = [...drawing(f).querySelectorAll('text')].filter(visible);
      assert(labels.length >= 5, `the picture keeps its labels ${where}`);
      const boxes = labels.map(box);
      for (const node of labels) assert(attr(node, 'font-size') >= 12, `small text ${where}: ${node.textContent}`);
      for (const shape of boxes) {
        assert(shape.left >= 0 && shape.right <= width, `label leaves the picture sideways ${where}: ${shape.node.textContent}`);
        assert(shape.top >= 0 && shape.bottom <= height, `label leaves the picture vertically ${where}: ${shape.node.textContent}`);
      }
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++)
        assert(apart(boxes[i], boxes[j]), `two labels collide ${where}: `
          + `"${boxes[i].node.textContent}" and "${boxes[j].node.textContent}"`);
      // A label must not sit on a dot either: the reader has to see both.
      for (const selector of ['[data-prediction]', '[data-target-dot]', '[data-origin]']) {
        const dot2 = f.$(selector), radius = attr(dot2, 'r');
        const spot = {left: attr(dot2, 'cx') - radius, right: attr(dot2, 'cx') + radius,
          top: attr(dot2, 'cy') - radius, bottom: attr(dot2, 'cy') + radius};
        for (const shape of boxes)
          assert(apart(shape, spot, 1), `"${shape.node.textContent}" covers ${selector} ${where}`);
      }
      for (const node of [...drawing(f).querySelectorAll('circle')].filter(visible)) {
        assert(attr(node, 'cx') - attr(node, 'r') >= 0 && attr(node, 'cx') + attr(node, 'r') <= width, where);
        assert(attr(node, 'cy') - attr(node, 'r') >= 0 && attr(node, 'cy') + attr(node, 'r') <= height, where);
      }
      assert(drawing(f).querySelectorAll('*').length < 60, `the picture stays a picture ${where}`);
    }
  }
});

test('column space: the picture names the columns in words and leaves the matrices to the formula', t => {
  const f = fixture(t, NAME);
  const words = () => [...f.$('[data-figure] svg').querySelectorAll('text')].map(node => node.textContent);
  const wordsOnly = when => {
    for (const text of words())
      assert.doesNotMatch(text, /\\|\^|_|matr|vect|X_|\bXT\b/, `markup on the picture ${when}: "${text}"`);
  };
  wordsOnly('in the script-free prints');
  const tex = f.formulas().map(span => span.textContent).join(' ');
  assert.match(tex, /\\predictionpart\{\\hat\{\\vect\{y\}\}\}/);
  assert.match(tex, /\\parameterpart\{w_1\}\\featurepart\{\\matr\{X\}_\{:1\}\}/);
  assert.match(tex, /\\featurepart\{\\matr\{X\}\^\\top\}\\residualpart\{\\vect\{e\}\} = \\vect\{0\}/);
  assert.match(tex, /\\featurepart\{\\matr\{X\}\^\\top\\matr\{X\}\}\\,\\parameterpart\{\\hat\{\\vect\{w\}\}\}/);
  f.load(); f.open();
  for (let step = 0; step <= 80; step++) {f.seek(step / 2); wordsOnly(`at ${step / 2}s`);}
  // Plain-text numbers use a real minus and never e-notation.
  for (const text of words()) assert.doesNotMatch(text, /-|\de[-+]\d/, `ASCII minus or e-notation in "${text}"`);
});

test('column space: an unusable fixture never mounts a player over the static print', t => {
  const source = declared(fixture(t, NAME));
  const broken = [
    {...source, columns: [[2, -1, 0], [4, -2, 0]]},            // dependent columns span no plane
    {...source, columns: [[2, -1, 0]]},                        // one column
    {...source, columns: [[2, -1], [0, 1]]},                   // not three-dimensional
    {...source, target: [3, 3]},                               // mismatched target
    {...source, target: [NaN, 0, 0]},
    {...source, path: source.path.slice(1)},                   // one value short of the beats
    {...source, elevation: 0}, {...source, elevation: 90}, {...source, bow: -1},
    {...source, target: [2, 1, -2]}                            // a target already in the plane
  ];
  for (const altered of broken) {
    const f = mount(t, altered);
    assert.throws(() => f.load(), /column|target|path|bow|elevation|residual/i);
    assert(!f.root.dataset.ready, 'a rejected fixture never mounts a player');
    assert.match(drawing(f).textContent, /\u2016e\u2016 = 3\.00/, 'the script-free print is left in place');
  }
});

test('column space: other schematic geometries reach their own exact projection', t => {
  const samples = [
    {columns: [[2, -2, 1], [2, 0, -1]], target: [7, 0, 1], path: [1.5, 1.5, 1.5, 2, 0, 0, -2, 0, 0], bow: 0.18, elevation: 32},
    {columns: [[1, 0, 0], [0, 1, 0]], target: [3, 4, 5], path: [-2, -2, -2, -3, 0, 0, 2, 0, 0], bow: 0.2, elevation: 28},
    {columns: [[1, 1, 1], [1, -1, 0]], target: [0, 0, 3], path: [1, 1, 1, 2, 0, 0, -2, 0, 0], bow: 0.1, elevation: 40}
  ];
  const expected = [[1, 2], [3, 4], [1, 0]];
  samples.forEach((source, index) => {
    const want = oracle(source);
    closeTree(want.optimum, expected[index]);
    for (const column of source.columns) close(dot(column, want.leftover), 0);
    const f = mount(t, source); f.load(); f.open(); f.seek(20);
    closeTree(json(f, 'weights'), want.optimum, PX);
    close(Number(f.root.dataset.residual), want.floor);
    close(Number(f.root.dataset.floor), want.floor);
    assert.deepEqual(declared(f).columns, source.columns, 'the player never rewrites its declared fixture');
  });
  // The first alternative is the check-yourself case one column short: adding the sum of the
  // two shipped columns leaves the projection and the floor alone.
  const shipped = declared(fixture(t, NAME)), base = oracle(shipped);
  const third = add(shipped.columns[0], shipped.columns[1]);
  closeTree(third, [2, 0, -1]);
  close(dot(third, base.leftover), 0, 1e-12);
  for (const weights of [[1, 2, 0], [0, 1, 1], [2, 3, -1]]) {
    const reached = [shipped.columns[0], shipped.columns[1], third]
      .reduce((total, column, index) => add(total, times(column, weights[index])), [0, 0, 0]);
    closeTree(reached, base.foot);
    close(norm(sub(shipped.target, reached)), 3);
  }
});

test('column space: wide and narrow script-free prints reproduce the final calculated geometry', async t => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after, 'regenerate the column-space static frames');
  const f = fixture(t, NAME), narrow = f.$('[data-static-frame="narrow"]');
  assert(narrow); assert.equal(narrow.dataset.width, '296');
  const height = Number(narrow.dataset.height);
  const ids = [...f.root.querySelectorAll('[id]')].map(node => node.id);
  assert.equal(ids.length, new Set(ids).size);
  for (const print of [drawing(f), narrow]) {
    assert.match(print.textContent, /\u2016e\u2016 = 3\.00/);
    assert.match(print.textContent, /\u00d7 1\.00/); assert.match(print.textContent, /\u00d7 2\.00/);
    assert.equal(print.querySelectorAll('[data-column]').length, 2);
    assert(print.querySelector('[data-right-angle]'), 'the settled print carries the right angle');
    assert(print.querySelector('[data-plane]') && print.querySelector('[data-prediction]'));
  }
  f.load(); f.open(); f.seek(40); f.resize(296);
  assert.equal(f.root.querySelectorAll('[data-static-frame="narrow"]').length, 0);
  assert.equal(numbers(f.$('[data-figure] svg').getAttribute('viewBox'))[3], height);
  const wide = numbers(/viewBox="0 0 (\d+) (\d+)"/.exec(read('column-space/panel.html')).slice(1, 3).join(' '));
  const css = read('column-space/player.css');
  assert.match(css, /@container\s*\(max-width:\s*519px\)/);
  assert.match(css, new RegExp(`aspect-ratio:\\s*296\\s*/\\s*${height}`));
  assert.match(css, new RegExp(`aspect-ratio:\\s*713\\s*/\\s*${wide[1]}`));
});

test('column space: this projection picture is not a fitted model, a camera or a training run', t => {
  const f = fixture(t, NAME), boundary = f.$('.mechanism-boundary').textContent;
  assert.match(boundary, /Three dimensions stand in for/);
  assert.match(boundary, /not its dataset, and nothing is trained/);
  assert.match(boundary, /solved from them by .*normal equations.*not fitted/s);
  assert.match(boundary, /right angle is exact in that arithmetic/);
  assert.match(boundary, /foreshortens it/);
  assert.match(boundary, /not an optimizer trajectory/);
  assert.match(boundary, /rank deficiency/); assert.match(boundary, /conditioning/);
  assert.match(f.$('.mechanism-scope > summary').textContent, /Scope and caveats/);
  // One picture, one formula line, one caption, one range: no second control was smuggled in.
  f.load(); f.open();
  assert.equal(f.root.querySelectorAll('input[type="range"]').length, 1);
  assert.equal(f.w.BookColumnSpace, undefined, 'the suite reads published state; the player exports nothing');
  assert.deepEqual(Object.keys(f.root.dataset).filter(key => !['player', 'playback', 'evidenceClass', 'columns',
    'target', 'path', 'bow', 'elevation', 'ready', 'duration', 'time', 'playing', 'typeset'].includes(key)).sort(),
  ['drawn', 'floor', 'layout', 'optimum', 'origin', 'pixelsPerUnit', 'residual', 'revealed', 'stage', 'tau', 'weights']);
  const filter = fs.readFileSync(path.join(ROOT, scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
  assert.doesNotMatch(read('column-space/player.js'), /Math\.random|fetch\(|import\(|setInterval\(/);
});
