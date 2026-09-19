#!/usr/bin/env node
// Test-only geometry and picture checks for the Chapter 3 hinge-lift excerpt. No
// dependency of this file ships. The oracle below recomputes the four activations, the
// separating plane, the swept family of failing lines, the tilting cut, both arms of the
// shadow and every drawn coordinate from the panel's declared attributes, so the player
// cannot agree with itself. It also proves the two facts the scene rests on: no line in
// the input plane gets all four corners, and the plane that does is possible only
// because the rectifier clipped the corner at the origin.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, close, canonicalMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'hinge-lift-excerpt', scene = entry(NAME);
const WIDTHS = [240, 296, 375, 480, 519, 520, 640, 713];
const PX = 1e-4;
const attr = (node, key) => Number(node.getAttribute(key));
const json = (f, key) => JSON.parse(f.root.dataset[key]);
const drawing = f => f.$('[data-drawing]');
const visible = node => node && !node.closest('[hidden]') && !node.hasAttribute('hidden');
const closeTree = (actual, expected, epsilon = 1e-12) => {
  if (Array.isArray(expected)) {
    assert(Array.isArray(actual)); assert.equal(actual.length, expected.length);
    expected.forEach((value, index) => closeTree(actual[index], expected[index], epsilon));
  } else close(actual, expected, epsilon);
};
// A printed number read back the way a reader meets it: U+2212 for minus, never a hyphen.
const readNumber = text => {
  assert.doesNotMatch(text, /-/, `hyphen-minus in "${text}"`);
  assert.doesNotMatch(text, /\de[-+\u2212]?\d/, `e-notation in "${text}"`);
  return Number(text.replace(/\u2212/g, '-'));
};
const declared = f => ({
  xor: JSON.parse(f.root.dataset.xor), weights: JSON.parse(f.root.dataset.weights),
  bias: Number(f.root.dataset.bias), bestLine: JSON.parse(f.root.dataset.bestLine),
  turn: Number(f.root.dataset.turn), flatStart: Number(f.root.dataset.flatStart),
  window: JSON.parse(f.root.dataset.window), azimuth: Number(f.root.dataset.azimuth),
  elevation: Number(f.root.dataset.elevation), rise: Number(f.root.dataset.rise)
});
function mount(t, source, options = {}) {
  const f = fixture(t, NAME, options);
  if (source) Object.assign(f.root.dataset, {
    xor: JSON.stringify(source.xor), weights: JSON.stringify(source.weights),
    bias: String(source.bias), bestLine: JSON.stringify(source.bestLine),
    turn: String(source.turn), flatStart: String(source.flatStart),
    window: JSON.stringify(source.window), azimuth: String(source.azimuth),
    elevation: String(source.elevation), rise: String(source.rise)
  });
  return f;
}

// --- The independent oracle: nothing below reads the player --------------------------
function oracle(source) {
  const [w1, w2] = source.weights, b = source.bias;
  const stim = at => w1 * at[0] + w2 * at[1] + b;
  const pts = source.xor.map(([x1, x2, y]) => {
    const z = stim([x1, x2]);
    return {at: [x1, x2], label: y, z, h: Math.max(0, z), sign: y === 0 ? 1 : -1};
  });
  // Equal signed vertical clearance from every corner: four equations, four unknowns,
  // written out here by elimination rather than by calling the player's solver.
  const budget = pts.reduce((total, p) => total + p.sign * p.h, 0);
  const rows = pts.map(p => [p.sign * p.at[0], p.sign * p.at[1], p.sign, 1]);
  const rhs = pts.map(p => p.sign * p.h);
  const a = rows.map((row, index) => [...row, rhs[index]]);
  for (let col = 0; col < 4; col++) {
    let pivot = col;
    for (let row = col + 1; row < 4; row++) if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    [a[col], a[pivot]] = [a[pivot], a[col]];
    for (let row = 0; row < 4; row++) {
      if (row === col) continue;
      const factor = a[row][col] / a[col][col];
      for (let k = col; k <= 4; k++) a[row][k] -= factor * a[col][k];
    }
  }
  const solved = a.map((row, index) => row[4] / row[index]);
  const cut = solved.slice(0, 3), margin = solved[3];
  const flat = [0, 0, source.flatStart];
  const planeAt = tilt => cut.map((value, index) => flat[index] + tilt * (value - flat[index]));
  const height = (plane, at) => plane[0] * at[0] + plane[1] * at[1] + plane[2];
  const cutScore = plane => pts.filter(p => (p.h > height(plane, p.at)) === (p.label === 0)).length;
  const norm = Math.hypot(source.bestLine[0], source.bestLine[1]);
  const start = [Math.atan2(source.bestLine[1], source.bestLine[0]), source.bestLine[2] / norm];
  const wn = Math.hypot(w1, w2);
  const crease = [Math.atan2(w2, w1), -b / wn];
  const turn = [source.turn * Math.PI / 180, start[1]];
  const smoother = u => u * u * u * (u * (u * 6 - 15) + 10);
  const lineAt = (stage, fraction) => {
    if (stage < 1) return start;
    if (stage > 1) return crease;
    const first = fraction <= 0.5, u = smoother(first ? fraction * 2 : fraction * 2 - 1);
    const from = first ? start : turn, to = first ? turn : crease;
    return from.map((value, index) => value + (to[index] - value) * u);
  };
  const lineScore = (angle, offset) => pts.filter(p =>
    (Math.cos(angle) * p.at[0] + Math.sin(angle) * p.at[1] > offset ? 1 : 0) === p.label).length;
  const rad = d => d * Math.PI / 180;
  const sa = Math.sin(rad(source.azimuth)), ca = Math.cos(rad(source.azimuth));
  const se = Math.sin(rad(source.elevation)), ce = Math.cos(rad(source.elevation));
  const RIGHT = [-sa, ca, 0], UP = [ca * se, sa * se, ce];
  const project = (at, h) => [RIGHT[0] * at[0] + RIGHT[1] * at[1],
    -(UP[0] * at[0] + UP[1] * at[1] + UP[2] * source.rise * h)];
  return {pts, budget, cut, margin, flat, planeAt, height, cutScore, start, crease, turn,
    lineAt, lineScore, project, RIGHT, UP, stim, smoother,
    sheet: at => Math.max(0, stim(at))};
}
// The timeline, written out independently of the player.
function timeline(time) {
  const clamped = Math.max(0, Math.min(scene.duration, time));
  let stage = 0;
  scene.beats.forEach((beat, index) => { if (clamped >= beat) stage = index; });
  const next = scene.beats[stage + 1] === undefined ? scene.duration : scene.beats[stage + 1];
  const span = next - scene.beats[stage];
  return {stage, fraction: span > 0 ? Math.min(1, (clamped - scene.beats[stage]) / span) : 1};
}
// JSDOM lays nothing out, so a label's extent is estimated from its own font size, the
// same 0.62 em a character the player uses.
const box = node => {
  const size = attr(node, 'font-size'), text = node.textContent;
  const reach = 0.62 * size * text.length, anchor = node.getAttribute('text-anchor') || 'start';
  const x = attr(node, 'x'), left = anchor === 'end' ? x - reach : anchor === 'middle' ? x - reach / 2 : x;
  return {left, right: left + reach, top: attr(node, 'y') - size, bottom: attr(node, 'y') + 0.25 * size, node};
};
const apart = (a, b, pad = 0) =>
  a.right + pad < b.left || b.right + pad < a.left || a.bottom + pad < b.top || b.bottom + pad < a.top;
const segment = node => {
  const match = /^M\s+(\S+)\s+(\S+)\s+L\s+(\S+)\s+(\S+)$/.exec(node.getAttribute('d'));
  assert(match, `${node.getAttribute('data-shadow') || node.nodeName} is one straight segment`);
  return [[Number(match[1]), Number(match[2])], [Number(match[3]), Number(match[4])]];
};
const polygon = node => [...node.getAttribute('d').matchAll(/[ML]\s+(\S+)\s+(\S+)/g)]
  .map(match => [Number(match[1]), Number(match[2])]);

registerTransportTests(NAME, {witness: /4 of 4/, anchors: ['hinge-lift-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('hinge lift: the manuscript owns the XOR table, the ReLU and this neuron', t => {
  const f = fixture(t, NAME), chapter = chapterSource(NAME);
  assert.equal(scene.qmd, 'chapters/part1/03-nonlinearity-mlp.qmd');
  assert.equal(scene.anchor.type, 'after-cell');
  assert.equal(scene.anchor.target, 'cell-fig-neuron-hinge');
  assert.equal(scene.duration, 40);
  assert.deepEqual(scene.beats, [0, 5, 10, 15, 20, 25, 30, 35]);
  assert.equal(f.root.dataset.evidenceClass, 'schematic');
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal), literal);
  // Every declared number that belongs to the chapter appears verbatim in the chapter.
  const source = declared(f);
  assert(chapter.includes('w, b = torch.tensor([1.0, 0.65]), -0.25'));
  assert.deepEqual(source.weights, [1.0, 0.65]);
  assert.equal(source.bias, -0.25);
  // The XOR table, row by row, exactly as the chapter prints it.
  const table = chapter.slice(chapter.indexOf('| $x_1$ | $x_2$ | XOR |'));
  source.xor.forEach(([x1, x2, y]) => assert(table.includes(`| ${x1} | ${x2} | ${y} |`), `${x1} ${x2} ${y}`));
  // The declared failing line is the chapter's own "best linear rule".
  assert(chapter.includes('Z = (grid.sum(1) - 0.5 > 0).float().reshape(gx.shape)'));
  assert(chapter.includes('"best linear rule (75%)"'));
  assert.deepEqual(source.bestLine, [1, 1, 0.5]);
  // The claim the failing sweep illustrates, and the sentence the neuron beat mirrors.
  assert(chapter.includes('a hard linear boundary can classify at most three of the\nfour points (75%)'));
  assert(chapter.includes('it draws a line through the plane: an OFF region and an ON region'));
  assert.match(f.$('.mechanism-intro').textContent, /XOR table above/);
  assert.doesNotMatch(read('hinge-lift/panel.html'), /@eq-|@fig-|@sec-/);
});

test('hinge lift: the chapter\u2019s own neuron lifts XOR into a separable arrangement', t => {
  const source = declared(fixture(t, NAME)), want = oracle(source);
  // The activations, straight off the chapter's w and b.
  closeTree(want.pts.map(p => p.z), [-0.25, 0.4, 0.75, 1.4]);
  closeTree(want.pts.map(p => p.h), [0, 0.4, 0.75, 1.4]);
  // Exactly one corner is clipped, and the clip is the whole reason this works.
  assert.equal(want.pts.filter(p => p.z < 0).length, 1);
  close(want.budget, 0.25);
  close(want.budget, -source.bias, 1e-12);
  // That budget is the same for EVERY plane: the four signed clearances always sum to it.
  for (const plane of [[1, 2, -3], [0, 0, 0.7], want.cut, [-4, 9, 0.5]]) {
    const total = want.pts.reduce((sum, p) => sum + p.sign * (p.h - want.height(plane, p.at)), 0);
    close(total, want.budget, 1e-12);
  }
  // So the best equal clearance any plane can give is a quarter of it, and it is positive.
  close(want.margin, want.budget / 4);
  close(want.margin, 0.0625);
  assert(want.margin > 0, 'a positive clearance is exactly "one hinge separates these corners"');
  closeTree(want.cut, [0.875, 0.525, -0.0625]);
  // Class 0 above, class 1 below, each by the same 0.0625.
  want.pts.forEach(p => close(p.sign * (p.h - want.height(want.cut, p.at)), want.margin));
  assert.equal(want.cutScore(want.cut), 4);
  // Without the rectifier the same four points are coplanar, so no plane separates them.
  const raw = want.pts.reduce((sum, p) => sum + p.sign * p.z, 0);
  close(raw, 0);
  for (const plane of [[1, 2, -3], want.cut, [0.9, 0.5, 0]]) {
    const clearances = want.pts.map(p => p.sign * (p.z - want.height(plane, p.at)));
    close(clearances.reduce((sum, value) => sum + value, 0), 0);
    assert(clearances.some(value => value <= 1e-12), 'an unclipped corner set is never separated');
  }
});

test('hinge lift: no straight line in the input plane gets all four, by exhaustion', t => {
  const source = declared(fixture(t, NAME)), want = oracle(source);
  // Not only the swept family: every line, both orientations. Four points in convex
  // position admit only contiguous dichotomies, so a fine sweep of directions crossed
  // with every threshold between the projections is exhaustive up to ties.
  let best = 0;
  for (let k = 0; k < 3600; k++) {
    const theta = Math.PI * k / 3600, u = [Math.cos(theta), Math.sin(theta)];
    const shots = want.pts.map(p => u[0] * p.at[0] + u[1] * p.at[1]).sort((a, b) => a - b);
    const cuts = [shots[0] - 1, ...shots.slice(1).map((value, index) => (value + shots[index]) / 2), shots[3] + 1];
    for (const c of cuts) for (const sign of [1, -1])
      best = Math.max(best, want.pts.filter(p =>
        ((sign * (u[0] * p.at[0] + u[1] * p.at[1] - c) > 0) ? 1 : 0) === p.label).length);
  }
  assert.equal(best, 3, 'the chapter\u2019s "at most three of the four" holds for every line');
  // And the three placements the scene actually visits are 3, 2 and 3.
  assert.equal(want.lineScore(...want.start), 3);
  assert.equal(want.lineScore(...want.turn), 3);
  assert.equal(want.lineScore(...want.crease), 3);
  assert.equal(want.lineScore(0, want.start[1]), 2);
  // The swept family never reaches four at any instant of its beat.
  for (let step = 0; step <= 2000; step++) {
    const [angle, offset] = want.lineAt(1, step / 2000);
    assert(want.lineScore(angle, offset) <= 3, `a swept line reaches four at ${step / 2000}`);
  }
  // The turn ends exactly on the neuron's own threshold, so the line is still before it
  // is named: w is the crease's normal and the offset is the bias over its length.
  closeTree(want.lineAt(1, 1), want.crease);
  closeTree(want.lineAt(2, 0), want.crease);
  close(Math.cos(want.crease[0]) * source.weights[1] - Math.sin(want.crease[0]) * source.weights[0], 0);
  close(want.crease[1] * Math.hypot(...source.weights), -source.bias);
});

test('hinge lift: the flat cut tilts in, staying a plane, and the score climbs 2, 3, 4', t => {
  const source = declared(fixture(t, NAME)), want = oracle(source);
  // It starts horizontal: a rule that reads the activation and nothing else.
  closeTree(want.flat, [0, 0, 0.7]);
  assert.equal(want.cutScore(want.planeAt(0)), 2);
  assert.equal(want.cutScore(want.planeAt(1)), 4);
  // Every intermediate attitude is a plane, so nothing bends on the way.
  for (let step = 0; step <= 100; step++) {
    const plane = want.planeAt(step / 100);
    for (const at of [[0.3, 0.8], [1.1, -0.2], [0.5, 0.5]]) {
      const mix = [[0, 0], [1, 0], [0, 1]].map(corner => want.height(plane, corner));
      close(want.height(plane, at), mix[0] + at[0] * (mix[1] - mix[0]) + at[1] * (mix[2] - mix[0]), 1e-12);
    }
  }
  // Exactly two crossings, each at its own exact fraction: 4/9 and 56/61.
  const crossC = (want.pts[2].h - want.flat[2]) / (want.cut[0] + want.cut[2] - want.flat[2]);
  const crossA = (want.pts[0].h - want.flat[2]) / (want.cut[2] - want.flat[2]);
  close(crossC, 4 / 9); close(crossA, 56 / 61);
  assert.equal(want.cutScore(want.planeAt(crossC - 1e-9)), 2);
  assert.equal(want.cutScore(want.planeAt(crossC + 1e-9)), 3);
  assert.equal(want.cutScore(want.planeAt(crossA - 1e-9)), 3);
  assert.equal(want.cutScore(want.planeAt(crossA + 1e-9)), 4);
  // The score never goes backwards along the tilt.
  let previous = 0;
  for (let step = 0; step <= 4000; step++) {
    const score = want.cutScore(want.planeAt(step / 4000));
    assert(score >= previous, `the score falls at ${step / 4000}`);
    previous = score;
  }
});

test('hinge lift: the shadow is two pieces of one bent line, and the bend is off the page', t => {
  const source = declared(fixture(t, NAME)), want = oracle(source);
  const [w1, w2] = source.weights, b = source.bias, [p, q, r] = want.cut;
  // On the silent half the sheet is flat at zero, so the boundary is where the cut is zero.
  // On the firing half it is where the cut meets the sheet. Two different lines.
  const flatArm = [p, q, -r], risenArm = [w1 - p, w2 - q, r - b];
  closeTree(flatArm, [0.875, 0.525, 0.0625]);
  closeTree(risenArm, [0.125, 0.125, 0.1875]);
  // The risen arm is x1 + x2 = 1.5; the flat arm is not parallel to it.
  close(risenArm[2] / risenArm[0], 1.5);
  assert(Math.abs(flatArm[0] * risenArm[1] - flatArm[1] * risenArm[0]) > 1e-9, 'the two arms are not parallel');
  // They meet, with the crease, at one point far outside the drawn window.
  const det = flatArm[0] * risenArm[1] - flatArm[1] * risenArm[0];
  const bend = [(flatArm[2] * risenArm[1] - flatArm[1] * risenArm[2]) / det,
    (flatArm[0] * risenArm[2] - flatArm[2] * risenArm[0]) / det];
  closeTree(bend, [-29 / 14, 25 / 7], 1e-9);
  close(w1 * bend[0] + w2 * bend[1] + b, 0, 1e-12);
  const [lo, hi] = source.window;
  assert(bend[0] < lo && bend[1] > hi, 'the bend lies outside the drawn window, as the scope says');
  // Each arm really does separate the classes it is drawn between: the corners of class 0
  // sit on the far side of their own arm and the class 1 corners between the two.
  want.pts.forEach(p2 => {
    const side = p2.h > want.height(want.cut, p2.at);
    assert.equal(side, p2.label === 0, `${p2.at} lands on the wrong side of the cut`);
  });
  // Every point of each drawn arm satisfies both its own half-plane and the region it
  // belongs to, so neither arm is drawn where it does not apply.
  const on = at => w1 * at[0] + w2 * at[1] + b;
  for (const [line, wants] of [[flatArm, -1], [risenArm, 1]]) {
    const dir = [-line[1], line[0]], base = [line[0] * line[2] / (line[0] ** 2 + line[1] ** 2),
      line[1] * line[2] / (line[0] ** 2 + line[1] ** 2)];
    for (let k = -30; k <= 30; k++) {
      const at = [base[0] + k * dir[0] / 30, base[1] + k * dir[1] / 30];
      if (at[0] < lo || at[0] > hi || at[1] < lo || at[1] > hi) continue;
      assert.equal(Math.sign(on(at)) === wants || Math.abs(on(at)) < 1e-12, true,
        `the ${wants < 0 ? 'flat' : 'risen'} arm strays out of its own region at ${at}`);
      close(Math.max(0, on(at)) - want.height(want.cut, at), 0, 1e-12);
    }
  }
});

test('hinge lift: the published state matches the oracle at every time and both layouts', t => {
  const f = fixture(t, NAME), source = declared(f), want = oracle(source);
  f.load(); f.open();
  closeTree(json(f, 'heights'), want.pts.map(p => p.h));
  closeTree(json(f, 'cut'), want.cut);
  close(Number(f.root.dataset.margin), want.margin);
  close(Number(f.root.dataset.budget), want.budget);
  closeTree(json(f, 'crease'), want.crease);
  for (const width of [713, 296]) {
    f.resize(width);
    const seen = new Set();
    for (let step = 0; step <= 400; step++) {
      const time = step / 10, {stage, fraction} = timeline(time);
      const eased = want.smoother(fraction);
      f.seek(time);
      assert.equal(f.root.dataset.stage, String(stage));
      const [angle, offset] = want.lineAt(stage, fraction);
      close(Number(f.root.dataset.lineAngle), angle);
      close(Number(f.root.dataset.lineOffset), offset);
      close(Number(f.root.dataset.lift), stage < 3 ? 0 : stage > 3 ? 1 : eased);
      close(Number(f.root.dataset.ghost), stage < 4 ? 0 : stage > 4 ? 1 : eased);
      close(Number(f.root.dataset.tilt), stage < 5 ? 0 : stage > 5 ? 1 : eased);
      close(Number(f.root.dataset.drop), stage < 6 ? 0 : stage > 6 ? 1 : eased);
      const expected = stage >= 5
        ? want.cutScore(want.planeAt(stage > 5 ? 1 : eased)) : want.lineScore(angle, offset);
      assert.equal(Number(f.root.dataset.correct), expected, `score at ${time}s`);
      seen.add(angle.toFixed(9));
    }
    assert(seen.size > 40, 'the turn visits many intermediate placements, not only the beats');
  }
});

test('hinge lift: the picture draws the geometry it publishes, not a sketch of it', t => {
  const f = fixture(t, NAME), source = declared(f), want = oracle(source);
  f.load(); f.open();
  for (const width of WIDTHS) {
    f.resize(width);
    const origin = json(f, 'origin'), scale = Number(f.root.dataset.pixelsPerUnit);
    const plot = (at, h) => [origin[0] + scale * want.project(at, h)[0],
      origin[1] + scale * want.project(at, h)[1]];
    for (const time of [0, 5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30, 32.5, 35, 40]) {
      f.seek(time);
      const where = `at ${width}px, ${time}s`;
      const lift = Number(f.root.dataset.lift), ghost = Number(f.root.dataset.ghost);
      const tilt = Number(f.root.dataset.tilt), drop = Number(f.root.dataset.drop);
      // Each corner rides exactly its own activation, and its stem reaches its own foot.
      want.pts.forEach((p, index) => {
        const here = plot(p.at, lift * p.h), base = plot(p.at, 0);
        const mark = f.$(`[data-corner="${index}"]`);
        const spot = mark.nodeName === 'circle' ? [attr(mark, 'cx'), attr(mark, 'cy')]
          : [attr(mark, 'x') + attr(mark, 'width') / 2, attr(mark, 'y') + attr(mark, 'height') / 2];
        closeTree(spot, here, PX, `corner ${index} ${where}`);
        closeTree([attr(f.$(`[data-foot="${index}"]`), 'cx'), attr(f.$(`[data-foot="${index}"]`), 'cy')],
          base, PX);
        closeTree(segment(f.$(`[data-stem="${index}"]`)), [base, here], PX);
      });
      // The pinned corner alone never leaves the input plane.
      closeTree(plot(want.pts[0].at, lift * want.pts[0].h), plot(want.pts[0].at, 0), PX,
        `the silent corner moved ${where}`);
      // The ghost hangs from that corner at the unrectified stimulus.
      closeTree([attr(f.$('[data-ghost]'), 'cx'), attr(f.$('[data-ghost]'), 'cy')],
        plot(want.pts[0].at, ghost * want.pts[0].z), PX);
      // The risen sheet carries the corners it lifted: every drawn vertex is the sheet's
      // own height there, and the two on the crease never leave the plane.
      const sheet = polygon(f.$('[data-sheet]'));
      let creased = 0;
      for (const point of sheet) {
        const found = [[-0.25, -0.25], [0.4125, -0.25], [1.15, -0.25], [1.15, 1.15], [-0.25, 1.15],
          [-0.25, 0.7692307692307693]].find(at =>
          Math.hypot(...plot(at, lift * want.sheet(at)).map((value, i) => value - point[i])) < 1e-3);
        assert(found, `a sheet vertex ${point} is not a window or crease corner ${where}`);
        if (want.sheet(found) < 1e-12) creased++;
      }
      assert.equal(creased, 2, `the sheet keeps both ends of the crease on the plane ${where}`);
      // The cut is drawn as the plane it is: four window corners at its own heights.
      const quad = polygon(f.$('[data-cut]'));
      assert.equal(quad.length, 4);
      [[-0.25, -0.25], [1.15, -0.25], [1.15, 1.15], [-0.25, 1.15]].forEach((at, index) =>
        closeTree(quad[index], plot(at, want.height(want.planeAt(tilt), at)), PX, `cut corner ${where}`));
      // The crossing in the air, and the same line after it has fallen to the plane.
      const air = segment(f.$('[data-chord]')), land = segment(f.$('[data-shadow="risen"]'));
      [[1.15, 0.35], [0.35, 1.15]].forEach((at, index) => {
        closeTree(air[index], plot(at, lift * want.sheet(at)), PX);
        closeTree(land[index], plot(at, (1 - drop) * lift * want.sheet(at)), PX);
      });
      closeTree(segment(f.$('[data-dropper="0"]')), [air[0], land[0]], PX);
      // The arm that was always flat is drawn on the plane, at zero, and never moves.
      closeTree(segment(f.$('[data-shadow="flat"]')),
        [plot([0.22142857142857142, -0.25], 0), plot([-0.25, 0.5357142857142857], 0)], PX);
    }
  }
});

test('hinge lift: the flat answer is withheld until the cut arrives', t => {
  const f = fixture(t, NAME);
  f.load(); f.open();
  const range = f.$('[data-controls] input[type=range]');
  const spoiler = /\bflat\b|separat|4 of 4|all four are/i;
  for (let step = 0; step <= 800; step++) {
    const time = step / 20;
    f.seek(time);
    const revealed = time >= 25;
    assert.equal(f.root.dataset.revealed, String(revealed), `revealed flag at ${time}s`);
    const words = [f.$('[data-caption]').textContent, f.$('[data-figure] svg').getAttribute('aria-label'),
      range.getAttribute('aria-valuetext'),
      ...[...drawing(f).querySelectorAll('text')].filter(visible).map(node => node.textContent)];
    if (!revealed) {
      for (const text of words) assert.doesNotMatch(text, spoiler, `spoiled at ${time}s: ${text}`);
      assert(!visible(f.$('[data-cut]')), `the cut is drawn at ${time}s`);
      assert(!visible(f.$('[data-shadow="flat"]')), `the shadow is drawn at ${time}s`);
      assert(Number(f.root.dataset.correct) <= 3, `four of four announced at ${time}s`);
    }
    if (time < 30) assert(!visible(f.$('[data-zone="0"]')), `the decision bands show at ${time}s`);
  }
  // The question stands still for its whole first beat, so the reader has time to answer.
  f.seek(0); const asked = f.$('[data-caption]').textContent;
  assert.match(asked, /Must the boundary itself bend to fix that\?$/);
  for (const time of [0, 1, 2, 3, 4, 4.99]) {
    f.seek(time);
    assert.equal(f.$('[data-caption]').textContent, asked);
    close(Number(f.root.dataset.lineAngle), Math.PI / 4);
    assert.equal(f.$('[data-value="score"]').textContent, '3 of 4');
  }
  // The four of four arrives with the tilt, not before it, and then stands.
  const source = declared(f), want = oracle(source);
  const at = tilt => 25 + 5 * ((u => { // invert the smootherstep the player eases with
    let low = 0, high = 1;
    for (let i = 0; i < 60; i++) {
      const mid = (low + high) / 2;
      if (want.smoother(mid) < u) low = mid; else high = mid;
    }
    return (low + high) / 2;
  })(tilt));
  f.seek(at(56 / 61) - 0.05); assert.equal(f.root.dataset.correct, '3');
  f.seek(at(56 / 61) + 0.05); assert.equal(f.root.dataset.correct, '4');
  for (const time of [30, 32.5, 35, 37.5, 40]) {
    f.seek(time); assert.equal(f.$('[data-value="score"]').textContent, '4 of 4');
  }
});

test('hinge lift: every reveal arrives in its explanatory order', t => {
  const f = fixture(t, NAME);
  f.load(); f.open();
  const seen = (selector, time) => {f.seek(time); return Boolean(visible(f.$(selector)));};
  for (const time of [0, 2.5, 4.99, 5, 7.5, 9.99, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30, 32.5, 35, 40]) {
    const stage = timeline(time).stage;
    assert.equal(seen('[data-off-face]', time), stage >= 2, `off shading at ${time}s`);
    assert.equal(seen('[data-weight]', time), stage === 2, `weight arrow at ${time}s`);
    assert.equal(seen('[data-region-name="off"]', time), stage === 2, `OFF word at ${time}s`);
    assert.equal(seen('[data-sheet]', time), stage >= 3, `sheet at ${time}s`);
    assert.equal(seen('[data-axis]', time), stage >= 3, `activation axis at ${time}s`);
    assert.equal(seen('[data-stem="3"]', time), stage >= 3, `stems at ${time}s`);
    assert.equal(seen('[data-ghost]', time), stage >= 4, `ghost at ${time}s`);
    assert.equal(seen('[data-cut]', time), stage >= 5, `cut at ${time}s`);
    assert.equal(seen('[data-chord]', time), stage >= 6, `crossing at ${time}s`);
    assert.equal(seen('[data-zone="1"]', time), stage >= 7, `decision bands at ${time}s`);
    assert.equal(seen('[data-value="score"]', time), stage <= 1 || stage >= 5, `score at ${time}s`);
    // The plane, the square and the line are there from the first frame.
    for (const selector of ['[data-plane]', '[data-square]', '[data-line]', '[data-corner="0"]',
      '[data-corner="3"]', '[data-input-name="0"]', '[data-input-name="1"]'])
      assert(seen(selector, time), `${selector} is missing at ${time}s`);
    // The line is the neuron's from the beat that names it, and nobody else's before.
    f.seek(time);
    assert.equal(f.$('[data-line]').classList.contains('hl-line-neuron'), stage >= 2, `line ink at ${time}s`);
    const formula = f.$('[data-formula]');
    assert.equal(formula.classList.contains('hl-neuron-shown'), stage >= 2);
    assert.equal(formula.classList.contains('hl-cut-shown'), stage >= 5);
    assert.equal(formula.classList.contains('hl-stim-lit'), stage === 2 || stage === 3);
    assert.equal(formula.classList.contains('hl-cut-lit'), stage === 5 || stage === 7);
  }
  // The wine rings mark exactly the corners the current line gets wrong, and only while
  // a line is what is being scored.
  const source = declared(f), want = oracle(source);
  for (let step = 0; step <= 300; step++) {
    const time = step / 10, {stage, fraction} = timeline(time);
    f.seek(time);
    const [angle, offset] = want.lineAt(stage, fraction);
    want.pts.forEach((p, index) => {
      const wrong = (Math.cos(angle) * p.at[0] + Math.sin(angle) * p.at[1] > offset ? 1 : 0) !== p.label;
      assert.equal(Boolean(visible(f.$(`[data-miss="${index}"]`))), stage <= 1 && wrong,
        `miss ring ${index} at ${time}s`);
    });
  }
});

test('hinge lift: reduced motion rests on each beat\u2019s finished picture', t => {
  const f = fixture(t, NAME, {reduced: true});
  f.load(); f.open();
  const source = declared(f), want = oracle(source);
  scene.beats.forEach((beat, index) => {
    const next = index + 1 < scene.beats.length ? scene.beats[index + 1] : scene.duration;
    for (const time of [beat, beat + 0.05, (beat + next) / 2, next - 0.01]) {
      f.seek(time);
      assert.equal(f.root.dataset.stage, String(index));
      closeTree([Number(f.root.dataset.lineAngle), Number(f.root.dataset.lineOffset)],
        want.lineAt(index, 1));
      close(Number(f.root.dataset.lift), index >= 3 ? 1 : 0);
      close(Number(f.root.dataset.ghost), index >= 4 ? 1 : 0);
      close(Number(f.root.dataset.tilt), index >= 5 ? 1 : 0);
      close(Number(f.root.dataset.drop), index >= 6 ? 1 : 0);
    }
  });
  // Each still is one its caption is true of: "the count never reaches four" stands over
  // a still at three; "the count starts climbing" stands over one that has climbed.
  const scores = scene.beats.map(beat => {f.seek(beat); return f.root.dataset.correct;});
  assert.deepEqual(scores, ['3', '3', '3', '3', '3', '4', '4', '4']);
  f.seek(scene.beats[4]);
  assert.equal(f.$('[data-value="ghost"]').textContent, '\u22120.25');
  f.seek(scene.beats[3]);
  assert.deepEqual([...drawing(f).querySelectorAll('[data-value^="corner"]')].map(node => node.textContent),
    ['0.00', '0.40', '0.75', '1.40']);
});

test('hinge lift: seek and resize histories reproduce the complete published frame', t => {
  const f = fixture(t, NAME);
  f.load(); f.open();
  const snapshot = () => JSON.stringify({picture: canonicalMarkup(f.$('[data-figure]').innerHTML),
    formula: canonicalMarkup(f.$('[data-formula]').outerHTML), caption: f.$('[data-caption]').innerHTML,
    state: Object.fromEntries(Object.entries(f.root.dataset)
      .filter(([key]) => !['time', 'playing', 'typeset'].includes(key)))});
  const times = [0, 5, 8.3, 10, 13.7, 15, 18.2, 20, 24.4, 25, 29.1, 30, 33.6, 35, 40];
  const first = times.map(time => {f.seek(time); return snapshot();});
  f.play(); f.tick(2222); f.resize(296); f.seek(17.4); f.resize(713); f.seek(3.3);
  assert.deepEqual(times.toReversed().map(time => {f.seek(time); return snapshot();}), first.toReversed());
});

test('hinge lift: every label stays inside the picture and clear of the marks it is not', t => {
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
      assert(labels.length >= 6, `the picture keeps its labels ${where}`);
      const boxes = labels.map(box);
      for (const node of labels) assert(attr(node, 'font-size') >= 12, `small text ${where}: ${node.textContent}`);
      for (const shape of boxes) {
        assert(shape.left >= 0 && shape.right <= width,
          `label leaves the picture sideways ${where}: ${shape.node.textContent}`);
        assert(shape.top >= 0 && shape.bottom <= height,
          `label leaves the picture vertically ${where}: ${shape.node.textContent}`);
      }
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++)
        assert(apart(boxes[i], boxes[j]), `two labels collide ${where}: `
          + `"${boxes[i].node.textContent}" and "${boxes[j].node.textContent}"`);
      // A label must not sit on a marker either: the reader has to see both.
      const spots = [...drawing(f).querySelectorAll('circle, rect')].filter(visible).map(node => {
        if (node.nodeName === 'circle') {
          const r = attr(node, 'r');
          return {left: attr(node, 'cx') - r, right: attr(node, 'cx') + r,
            top: attr(node, 'cy') - r, bottom: attr(node, 'cy') + r};
        }
        return {left: attr(node, 'x'), right: attr(node, 'x') + attr(node, 'width'),
          top: attr(node, 'y'), bottom: attr(node, 'y') + attr(node, 'height')};
      });
      for (const spot of spots) for (const shape of boxes)
        assert(apart(shape, spot, 1), `"${shape.node.textContent}" covers a marker ${where}`);
      assert(drawing(f).querySelectorAll('*').length < 60, `the picture stays a picture ${where}`);
    }
  }
});

test('hinge lift: the picture prints typeset numbers and leaves the algebra to the formula', t => {
  const f = fixture(t, NAME);
  const words = () => [...f.$('[data-figure] svg').querySelectorAll('text')].map(node => node.textContent);
  const clean = when => {
    for (const text of words()) {
      assert.doesNotMatch(text, /\\|\^|_|matr|vect/, `markup on the picture ${when}: "${text}"`);
      if (/\d/.test(text) && !/ of /.test(text)) readNumber(text);
    }
  };
  clean('in the script-free prints');
  const tex = f.formulas().map(span => span.textContent).join(' ');
  assert.match(tex, /\\mathrm\{ReLU\}\(z\) = \\max\(0, z\)/);
  assert.match(tex, /\\parameterpart\{\\vect\{w\}\}\^\\top\\featurepart\{\\vect\{x\}\} \+ \\parameterpart\{b\}/);
  assert.match(tex, /\\predictionpart\{h\}/);
  assert.match(tex, /\\parameterpart\{v_3\}\\predictionpart\{h\}/);
  f.load(); f.open();
  for (let step = 0; step <= 80; step++) {f.seek(step / 2); clean(`at ${step / 2}s`);}
  // The four activations are the chapter's own numbers, printed to the same two decimals.
  f.seek(40);
  const printed = [...drawing(f).querySelectorAll('[data-value^="corner"]')].map(node => readNumber(node.textContent));
  closeTree(printed, [0, 0.4, 0.75, 1.4], 5e-3);
  assert.equal(readNumber(f.$('[data-value="ghost"]').textContent), -0.25);
});

test('hinge lift: an unusable fixture never mounts a player over the static print', t => {
  const source = declared(fixture(t, NAME));
  const broken = [
    // The heart of it: a neuron whose rectifier clips nothing leaves the corners coplanar.
    {...source, bias: 0},
    {...source, bias: -2},                              // every corner silent: all four at zero
    {...source, weights: [0, 0]},
    {...source, xor: [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 1]]},   // three of one class
    {...source, xor: source.xor.slice(1)},
    {...source, window: [-0.25, 0.4]},                  // a window that loses a corner
    {...source, elevation: 0}, {...source, elevation: 90}, {...source, rise: 0},
    {...source, bestLine: [0, 0, 0.5]}
  ];
  for (const altered of broken) {
    const f = mount(t, altered);
    assert.throws(() => f.load(), /hinge-lift/, JSON.stringify(altered));
    assert(!f.root.dataset.ready, 'a rejected fixture never mounts a player');
    assert.match(drawing(f).textContent, /4 of 4/, 'the script-free print is left in place');
  }
});

test('hinge lift: other neurons that do clip reach their own exact separating plane', t => {
  const source = declared(fixture(t, NAME));
  const samples = [
    {weights: [1, 0.5], bias: -0.3, heights: [0, 0.2, 0.7, 1.2], budget: 0.3},
    {weights: [0.8, 0.8], bias: -0.2, heights: [0, 0.6, 0.6, 1.4], budget: 0.2},
    {weights: [1.5, 0.4], bias: -0.6, heights: [0, 0, 0.9, 1.3], budget: 0.4}
  ];
  for (const sample of samples) {
    const altered = {...source, weights: sample.weights, bias: sample.bias};
    const want = oracle(altered);
    closeTree(want.pts.map(p => p.h), sample.heights, 1e-12);
    close(want.budget, sample.budget, 1e-12);
    close(want.margin, sample.budget / 4, 1e-12);
    assert.equal(want.cutScore(want.cut), 4);
    const f = mount(t, altered); f.load(); f.open(); f.seek(40);
    closeTree(json(f, 'heights'), sample.heights, 1e-12);
    close(Number(f.root.dataset.budget), sample.budget, 1e-12);
    assert.equal(f.root.dataset.correct, '4');
    assert.deepEqual(declared(f).weights, sample.weights, 'the player never rewrites its fixture');
  }
  // The transfer question, recomputed: with b = 0 nothing is clipped and the budget is 0.
  const unclipped = oracle({...source, bias: 0});
  closeTree(unclipped.pts.map(p => p.h), [0, 0.65, 1, 1.65], 1e-12);
  close(unclipped.budget, 0, 1e-12);
  close(0 + 1.65, 0.65 + 1, 1e-12);
});

test('hinge lift: wide and narrow script-free prints reproduce the final calculated geometry', async t => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after, 'regenerate the hinge-lift static frames');
  const f = fixture(t, NAME), narrow = f.$('[data-static-frame="narrow"]');
  assert(narrow); assert.equal(narrow.dataset.width, '296');
  const height = Number(narrow.dataset.height);
  const ids = [...f.root.querySelectorAll('[id]')].map(node => node.id);
  assert.equal(ids.length, new Set(ids).size);
  for (const print of [drawing(f), narrow]) {
    assert.match(print.textContent, /4 of 4/);
    assert.match(print.textContent, /1\.40/); assert.match(print.textContent, /\u22120\.25/);
    assert.equal(print.querySelectorAll('[data-corner]').length, 4);
    assert(print.querySelector('[data-cut]') && print.querySelector('[data-sheet]'));
    assert.equal(print.querySelectorAll('[data-zone]').length, 2, 'the settled print carries both bands');
  }
  f.load(); f.open(); f.seek(40); f.resize(296);
  assert.equal(f.root.querySelectorAll('[data-static-frame="narrow"]').length, 0);
  assert.equal(numbers(f.$('[data-figure] svg').getAttribute('viewBox'))[3], height);
  const wide = numbers(/viewBox="0 0 (\d+) (\d+)"/.exec(read('hinge-lift/panel.html')).slice(1, 3).join(' '));
  const css = read('hinge-lift/player.css');
  assert.match(css, /@container\s*\(max-width:\s*519px\)/);
  assert.match(css, new RegExp(`aspect-ratio:\\s*296\\s*/\\s*${height}`));
  assert.match(css, new RegExp(`aspect-ratio:\\s*713\\s*/\\s*${wide[1]}`));
});

test('hinge lift: this lift is a fixed drawing, not a lens, a proof or a training run', t => {
  const f = fixture(t, NAME), boundary = f.$('.mechanism-boundary').textContent;
  assert.match(boundary, /One fixed drawing angle, not a three-dimensional view you can turn/);
  assert.match(boundary, /nothing here is trained/);
  assert.match(boundary, /illustrates.*at most three of the four points.*not a proof/s);
  assert.match(boundary, /not a learned embedding dimension/);
  assert.match(boundary, /0\.7 drawing units per unit of activation/);
  assert.match(boundary, /solved, not fitted/);
  assert.match(boundary, /one neuron alone does not do XOR/);
  assert.match(boundary, /\u22122\.07, 3\.57/);
  assert.match(f.$('.mechanism-scope > summary').textContent, /Scope and caveats/);
  assert.equal(f.$('.mechanism-boundary > p').textContent.split(/\s+/).length <= 32, true,
    'the visible boundary line stays one short sentence');
  // One picture, one formula line, one caption, one range: no second control crept in.
  f.load(); f.open();
  assert.equal(f.root.querySelectorAll('input[type="range"]').length, 1);
  assert.deepEqual(Object.keys(f.root.dataset).filter(key => !['player', 'playback', 'evidenceClass',
    'xor', 'weights', 'bias', 'bestLine', 'turn', 'flatStart', 'window', 'azimuth', 'elevation',
    'rise', 'ready', 'duration', 'time', 'playing', 'typeset'].includes(key)).sort(),
  ['budget', 'correct', 'crease', 'cut', 'drop', 'ghost', 'heights', 'layout', 'lift', 'lineAngle',
    'lineOffset', 'margin', 'origin', 'pixelsPerUnit', 'revealed', 'stage', 'tilt']);
  const filter = fs.readFileSync(path.join(ROOT, scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
  assert.doesNotMatch(read('hinge-lift/player.js'), /Math\.random|fetch\(|import\(|setInterval\(/);
});
