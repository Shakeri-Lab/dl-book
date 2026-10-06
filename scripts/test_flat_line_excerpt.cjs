#!/usr/bin/env node
// Test-only checks for the autoencoder interlude's flat-line scene. Nothing here ships. The
// suite recomputes the sample, its mean, every foot, every residual and L from the panel's
// declared attributes, independently of the player; then reads the picture back out of the
// SVG and proves that the printed L is the loss of exactly the residual segments drawn: the
// scale is recovered from the drawn points alone, every segment is measured from its drawn
// endpoints, and their squared lengths are summed with the chapter's 1/(nd), at every whole
// tilt of the dial and every quarter second of the timeline, in both layouts.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, canonicalMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'flat-line-excerpt', scene = entry(NAME);
const WIDTHS = [296, 375, 599, 600, 713, 900];
const attr = (node, key) => Number(node.getAttribute(key));
const drawing = f => f.$('[data-drawing]');
const texts = f => [...drawing(f).querySelectorAll('text')];
const value = (f, name) => drawing(f).querySelector(`[data-value="${name}"]`);
const mark = (f, name) => drawing(f).querySelector(`[data-mark="${name}"]`);
const picture = f => f.$('[data-figure] svg');
const described = f => picture(f).getAttribute('aria-label');
const dial = f => f.$('[data-tilt-slider]');
const scrubbed = f => f.$('[data-controls] input[type=range]').getAttribute('aria-valuetext');
const fixed3 = v => v.toFixed(3);
const drag = (f, deg) => { const slider = dial(f); slider.value = String(deg); slider.dispatchEvent(new f.w.Event('input')); };

// The declared fixture, read from the panel's attributes.
const declared = f => {
  const d = f.root.dataset;
  return {height: Number(d.height), n: Number(d.points), sweep: numbers(d.sweep)};
};
// The reference computation, written without the player: the chapter's curve at the declared
// midpoints, their mean, each point's orthogonal foot on the line through the mean at `deg`
// degrees, and L = (1 / (n d)) sum ||x_i - x̂_i||^2 with d = 2, the curve's two coordinates.
const sample = k => Array.from({length: k.n}, (_, j) => { const t = -1 + (2 * j + 1) / k.n; return [t, k.height * (t * t - 1 / 3)]; });
function reference(k, deg) {
  const pts = sample(k), d = pts[0].length;
  const mean = [0, 1].map(i => pts.reduce((sum, p) => sum + p[i], 0) / k.n);
  const angle = deg * Math.PI / 180, u = [Math.cos(angle), Math.sin(angle)];
  let total = 0;
  const feet = pts.map(p => {
    const a = (p[0] - mean[0]) * u[0] + (p[1] - mean[1]) * u[1], q = [mean[0] + a * u[0], mean[1] + a * u[1]];
    total += (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
    return q;
  });
  return {pts, mean, feet, d, loss: total / (k.n * d)};
}
function spreads(k) {
  const {pts, mean} = reference(k, 0);
  const avg = fn => pts.reduce((sum, p) => sum + fn(p), 0) / k.n;
  return {sxx: avg(p => (p[0] - mean[0]) ** 2), syy: avg(p => (p[1] - mean[1]) ** 2), sxy: avg(p => (p[0] - mean[0]) * (p[1] - mean[1]))};
}

// Read the picture back. Only drawn geometry enters: the drawn points fix the drawing's
// origin and scale against the declared sample, every residual segment is measured from its
// two endpoints, and the recomputed L is the chapter's 1/(nd) times their squared lengths.
function readBack(f, k) {
  const ref = reference(k, 0);
  const xy = (node, a, b) => [attr(node, a), attr(node, b)];
  const points = [...drawing(f).querySelectorAll('[data-point]')].map(node => xy(node, 'cx', 'cy'));
  const feet = [...drawing(f).querySelectorAll('[data-foot]')].map(node => xy(node, 'cx', 'cy'));
  const segments = [...drawing(f).querySelectorAll('[data-residual]')].map(node => [xy(node, 'x1', 'y1'), xy(node, 'x2', 'y2')]);
  assert.equal(points.length, k.n, 'one drawn point per declared point');
  assert.equal(segments.length, k.n, 'one drawn residual per point: every residual in L is drawn');
  assert.equal(feet.length, k.n, 'one drawn foot per point');
  // Equal aspect: the drawn points are the declared sample, scaled and translated only.
  const [a, b] = [0, k.n - 1];
  const scale = Math.hypot(points[b][0] - points[a][0], points[b][1] - points[a][1])
    / Math.hypot(ref.pts[b][0] - ref.pts[a][0], ref.pts[b][1] - ref.pts[a][1]);
  const origin = [points[a][0] - scale * ref.pts[a][0], points[a][1] + scale * ref.pts[a][1]];
  ref.pts.forEach((p, i) => {
    assert(Math.abs(origin[0] + scale * p[0] - points[i][0]) < 1e-3 && Math.abs(origin[1] - scale * p[1] - points[i][1]) < 1e-3,
      `point ${i} is not the declared point at one scale in both directions`);
  });
  const line = mark(f, 'line'), ends = [xy(line, 'x1', 'y1'), xy(line, 'x2', 'y2')];
  const along = [ends[1][0] - ends[0][0], ends[1][1] - ends[0][1]], length = Math.hypot(...along);
  const unit = along.map(v => v / length);
  let total = 0;
  segments.forEach(([from, to], i) => {
    assert.deepEqual(from, points[i], `residual ${i} starts at its drawn point`);
    assert.deepEqual(to, feet[i], `residual ${i} ends at its drawn foot`);
    const rel = [to[0] - ends[0][0], to[1] - ends[0][1]];
    const off = Math.abs(rel[0] * unit[1] - rel[1] * unit[0]), t = (rel[0] * unit[0] + rel[1] * unit[1]) / length;
    assert(off < 2e-3, `foot ${i} sits ${off} px off the drawn line`);
    assert(t > 0 && t < 1, `foot ${i} lies within the drawn line`);
    const r = [to[0] - from[0], to[1] - from[1]], size = Math.hypot(...r);
    if (size > 0.5) assert(Math.abs(r[0] * unit[0] + r[1] * unit[1]) / size < 2e-3, `residual ${i} is not perpendicular to the line`);
    total += (size / scale) ** 2;
  });
  const printed = /^L = (\d\.\d{3})$/.exec(value(f, 'loss').textContent);
  assert(printed, `L is printed with three decimals: "${value(f, 'loss').textContent}"`);
  return {loss: total / (k.n * 2), printed: printed[1], scale, origin, unit};
}
// The printed L is the drawn residuals' loss rounded to three decimals. The drawing stores
// coordinates to 0.0001 px, so the recomputation carries an error of about 10^-6; where the
// true value sits closer than that to a rounding boundary (85 degrees is 6 × 10^-7 away) the
// check falls back to half a unit of the last printed digit plus that error.
function assertPrintedIsDrawn(f, k, where) {
  const back = readBack(f, k), tilt = Number(f.root.dataset.tilt);
  const exact = reference(k, tilt).loss;
  assert(Math.abs(back.loss - exact) < 5e-6, `${where}: the drawn residuals give ${back.loss}, the declared sample ${exact}`);
  assert(Math.abs(back.loss - Number(back.printed)) <= 0.0005 + 5e-6, `${where}: L = ${back.printed} is not the drawn loss ${back.loss}`);
  const margin = Math.abs((back.loss * 1000) % 1 - 0.5) / 1000;
  if (margin > 1e-5) assert.equal(back.printed, fixed3(back.loss), `${where}: printed ${back.printed}, drawn residuals ${back.loss}`);
  assert.equal(back.printed, fixed3(exact), `${where}: printed ${back.printed}, exact ${exact}`);
  assert.equal(back.printed, fixed3(Number(f.root.dataset.loss)));
  return back;
}

registerTransportTests(NAME, {witness: /L = 0\.098/, anchors: ['flat-line-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('flat line: the curve, the loss and the claim are the chapter\'s', t => {
  const f = fixture(t, NAME), k = declared(f), chapter = chapterSource(NAME);
  assert(chapter.includes(`=\\left(t,\\;${k.height}\\left(t^2-\\frac{1}{3}\\right)\\right)^\\top.`), 'the planted curve');
  assert(chapter.includes(`return torch.stack((t, ${k.height} * (t.square() - 1.0 / 3.0)), dim=1)`), 'planted_curve, two coordinates');
  assert(chapter.includes('=\\frac{1}{nd}\\sum_{i=1}^{n}'), 'the chapter\'s normalization');
  assert(chapter.includes('PCA gives the best **flat** rank-$k$ reconstruction.'));
  assert(chapter.includes('this projector minimizes squared reconstruction error among all linear reconstruction maps\nof rank at most $k$.'));
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal), `manifest literal: ${literal.slice(0, 40)}`);
  // The declared sample: sixteen midpoints, evenly spread and symmetric about zero, and the
  // tilt range the dial sweeps, from the flat line through a half-turn.
  assert.equal(k.n, 16);
  const ts = sample(k).map(p => p[0]);
  ts.forEach((v, j) => assert.equal(v, -ts[k.n - 1 - j], 'symmetric about zero'));
  ts.slice(1).forEach((v, j) => assert(Math.abs(v - ts[j] - 2 / k.n) < 1e-15, 'evenly spread'));
  assert.deepEqual(k.sweep, [0, 180]);
  assert.equal(f.root.dataset.evidenceClass, 'computed');
});

test('flat line: the sample\'s spreads, and L at every tilt, follow from the declared attributes', t => {
  const f = fixture(t, NAME), k = declared(f), {sxx, syy, sxy} = spreads(k);
  assert.equal(sxx, 0.33203125);
  assert.equal(syy, 0.19610595703125);
  assert(Math.abs(sxy) < 1e-15, 'no cross term: the curve is symmetric');
  assert.equal(reference(k, 0).loss, 0.098052978515625);
  assert(Math.abs(reference(k, 45).loss - 0.1320343017578125) < 1e-15);
  assert(Math.abs(reference(k, 90).loss - 0.166015625) < 1e-15);
  assert.deepEqual([0, 45, 90, 135, 180].map(deg => fixed3(reference(k, deg).loss)), ['0.098', '0.132', '0.166', '0.132', '0.098']);
  // L is the spread across the line: (Sxx sin^2 + Syy cos^2) / d, lowest only when flat.
  for (let deg = 0; deg <= 180; deg++) {
    const angle = deg * Math.PI / 180, L = reference(k, deg).loss;
    assert(Math.abs(L - (sxx * Math.sin(angle) ** 2 + syy * Math.cos(angle) ** 2) / 2) < 1e-15);
    if (deg % 180) assert(L > reference(k, 0).loss, `tilt ${deg} leaves no less than flat`);
  }
});

test('flat line: the printed L is the loss of exactly the drawn residuals, at every whole tilt', t => {
  for (const width of [713, 296]) {
    const f = fixture(t, NAME, {width}), k = declared(f); f.load(); f.open();
    f.seek(scene.duration);
    for (let deg = k.sweep[0]; deg <= k.sweep[1]; deg++) {
      drag(f, deg);
      assert.equal(f.root.dataset.tilt, String(deg));
      assert.equal(mark(f, 'line').getAttribute('data-tilt'), String(deg));
      const back = assertPrintedIsDrawn(f, k, `${width}px, dial at ${deg} degrees`);
      // The drawn line runs at the dialled tilt.
      const angle = deg * Math.PI / 180;
      assert(Math.abs(Math.abs(back.unit[0] * Math.cos(angle) - back.unit[1] * Math.sin(angle)) - 1) < 1e-6, `the line runs at ${deg} degrees`);
    }
  }
});

test('flat line: the printed L is the loss of the drawn residuals at every moment of the timeline', t => {
  for (const width of [713, 296]) {
    const f = fixture(t, NAME, {width}), k = declared(f); f.load(); f.open();
    const seen = new Set();
    for (let step = 0; step <= scene.duration * 4; step++) {
      f.seek(step / 4);
      assertPrintedIsDrawn(f, k, `${width}px at ${step / 4}s`);
      seen.add(Number(f.root.dataset.tilt));
    }
    for (const deg of [0, 45, 90, 180]) assert(seen.has(deg), `the timeline visits ${deg} degrees`);
    assert(seen.size > 30, 'the tilt glides through many whole degrees');
  }
});

test('flat line: the plot\'s dot and trace carry the same L as the residuals', t => {
  const f = fixture(t, NAME), k = declared(f); f.load(); f.open();
  const vertices = () => mark(f, 'trace').getAttribute('d').match(/[ML][^ML]+/g).map(step => step.slice(1).trim().split(/\s+/).map(Number));
  f.seek(scene.duration);
  const trace = vertices();
  assert.equal(trace.length, k.sweep[1] - k.sweep[0] + 1, 'one vertex per whole degree of the half-turn');
  // The trace's heights are one affine image of the reference L at every degree.
  const L = deg => reference(k, deg).loss;
  const slope = (trace[90][1] - trace[0][1]) / (L(90) - L(0)), offset = trace[0][1] - slope * L(0);
  trace.forEach(([, y], deg) => assert(Math.abs(offset + slope * L(deg) - y) < 2e-3, `trace height at ${deg} degrees`));
  assert(slope < 0, 'more L sits higher');
  // The flat line's L is a floor the trace touches only at both ends.
  const floor = mark(f, 'floor').getAttribute('d').match(/^M\s*([\d.]+)\s+([\d.]+)H([\d.]+)$/);
  assert.equal(Number(floor[2]), trace[0][1]);
  assert.deepEqual([Number(floor[1]), Number(floor[3])], [trace[0][0], trace[180][0]], 'the floor spans the whole half-turn');
  assert.equal(trace[180][1], trace[0][1]);
  trace.slice(1, -1).forEach(([, y], i) => assert(y < trace[0][1], `the trace rises above the floor at ${i + 1} degrees`));
  assert.equal(value(f, 'floor').textContent, `flat, ${fixed3(L(0))}`);
  assert.equal(value(f, 'upright').textContent, `upright, ${fixed3(L(90))}`);
  assert.equal(attr(mark(f, 'upright'), 'cy'), trace[90][1]);
  // The dot is the trace's vertex at the drawn tilt, on the timeline and on the dial.
  for (const deg of [0, 17, 45, 90, 123, 180]) {
    drag(f, deg);
    const dot = mark(f, 'dot');
    assert.deepEqual([attr(dot, 'cx'), attr(dot, 'cy')], vertices()[deg], `the dot at ${deg} degrees`);
    assert.equal(value(f, 'loss').textContent, `L = ${fixed3(L(deg))}`);
  }
  // The plot's axis is the declared sweep: its ends and its middle, the upright line.
  const ticks = texts(f).filter(node => /°$/.test(node.textContent)).map(node => node.textContent);
  assert.deepEqual(ticks, [`${k.sweep[0]}°`, `${(k.sweep[0] + k.sweep[1]) / 2}°`, `${k.sweep[1]}°`]);
  // While the sweep runs, the trace ends at the drawn tilt.
  f.seek(scene.beats[2] + 1.5);
  const tilt = Number(f.root.dataset.tilt);
  assert(tilt > 0 && tilt < 90, `mid-sweep at ${tilt} degrees`);
  assert.equal(vertices().length, tilt + 1);
  assert.deepEqual([attr(mark(f, 'dot'), 'cx'), attr(mark(f, 'dot'), 'cy')], vertices()[tilt]);
});

test('flat line: the answer is withheld while the caption asks', t => {
  const f = fixture(t, NAME), k = declared(f); f.load(); f.open();
  const flat = fixed3(reference(k, 0).loss);
  const times = [];
  for (let step = 0; step < (scene.beats[2] - scene.beats[1]) * 10; step++) times.push(scene.beats[1] + step / 10);
  times.push(scene.beats[2] - 0.01);
  for (const time of times) {
    f.seek(time);
    assert.match(f.$('[data-caption]').textContent, /\?$/, `the caption asks at ${time}s`);
    assert.equal(f.root.dataset.tilt, '0', `the line is flat at ${time}s`);
    const line = mark(f, 'line');
    assert.equal(line.getAttribute('y1'), line.getAttribute('y2'), `the drawn line is flat at ${time}s`);
    assert.equal(mark(f, 'trace'), null, `no trace at ${time}s`);
    assert.equal(drawing(f).querySelectorAll('[data-mark="dot"]').length, 1);
    const axis = Number(drawing(f).querySelector('.fl-axis').getAttribute('d').match(/^M\s*([\d.]+)/)[1]);
    assert.equal(attr(mark(f, 'dot'), 'cx'), axis, `the one dot sits at tilt 0 at ${time}s`);
    const printed = texts(f).map(node => node.textContent).join(' ').match(/\d\.\d{3}/g) || [];
    assert.deepEqual([...new Set(printed)], [flat], `only L = ${flat} is drawn at ${time}s`);
    for (const said of [described(f), dial(f).getAttribute('aria-valuetext'), scrubbed(f).replace(/^\d+:\d\d of \d+:\d\d\. /, '')]) {
      assert.doesNotMatch(said, /upright|\b(?:45|90|135|180)\b|0\.(?!098)\d{3}/, `another tilt or value is spoken at ${time}s: ${said}`);
      for (const spoken of said.match(/\d+(?:\.\d+)?/g) || []) assert(['0', flat].includes(spoken), `"${spoken}" spoken at ${time}s: ${said}`);
    }
    assert.equal(dial(f).getAttribute('aria-valuetext'), `tilt 0 degrees: L = ${flat}`);
  }
  // The picture's title (a hover tooltip) and the disclosure's summary are read before the
  // reveal too: they name the picture, never the outcome.
  for (const text of [picture(f).querySelector('title').textContent, f.root.querySelector(':scope > summary').textContent]) {
    assert.doesNotMatch(text, /\b(?:beats?|wins?|least|minimum|best|lowest|no line|no other)\b/i, `the outcome is named in "${text}"`);
  }
  // The reveal starts at its beat and not before.
  f.seek(scene.beats[2] + 0.5);
  assert(Number(f.root.dataset.tilt) > 0, 'the line turns once the ask is over');
});

test('flat line: every reached value holds long enough to read', t => {
  const f = fixture(t, NAME), k = declared(f); f.load(); f.open();
  const L = deg => `L = ${fixed3(reference(k, deg).loss)}`;
  for (const [from, to, deg] of [[13, 15, 90], [18, 20, 180], [22.5, 25, 45], [27.5, 40, 0]]) {
    for (let time = from; time < to - 1e-9; time += 0.1) {
      f.seek(Number(time.toFixed(2)));
      assert.equal(f.root.dataset.tilt, String(deg), `tilt at ${time.toFixed(2)}s`);
      assert.equal(value(f, 'loss').textContent, deg === 180 ? L(0) : L(deg));
    }
  }
});

test('flat line: the symbols x and x̂ name a point and its foot only while the line rests', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (let step = 0; step <= scene.duration * 4; step++) {
    f.seek(step / 4);
    const stage = Number(f.root.dataset.stage), shown = [0, 1, 6, 7].includes(stage);
    const x = drawing(f).querySelector('[data-label="x"]'), hat = drawing(f).querySelector('[data-label="x-hat"]');
    assert.equal(Boolean(x) && Boolean(hat), shown, `labels at ${step / 4}s`);
    if (shown) {
      assert.equal(f.root.dataset.tilt, '0');
      const point = drawing(f).querySelector('[data-point="0"]'), foot = drawing(f).querySelector('[data-foot="0"]');
      assert(attr(x, 'x') < attr(point, 'cx') && Math.abs(attr(x, 'y') - attr(point, 'cy')) < 8, 'x sits beside its point');
      assert.equal(attr(hat, 'x'), attr(foot, 'cx')); assert(attr(hat, 'y') > attr(foot, 'cy'), 'x̂ sits under its foot');
    }
  }
  f.seek(scene.duration); drag(f, 0);
  assert.equal(drawing(f).querySelector('[data-label]'), null, 'a dragged line carries no labels');
});

test('flat line: reduced motion holds each beat\'s finished state', t => {
  const f = fixture(t, NAME, {reduced: true}); f.load(); f.open();
  const seen = scene.beats.map(beat => { f.seek(beat); return [f.root.dataset.tilt, mark(f, 'trace') ? mark(f, 'trace').getAttribute('data-to') : '-'].join('/'); });
  assert.deepEqual(seen, ['0/-', '0/-', '90/90', '180/180', '45/180', '0/180', '0/180', '0/180']);
});

test('flat line: every caption number is computed from the declared fixture', t => {
  const f = fixture(t, NAME), k = declared(f); f.load(); f.open();
  const L = deg => fixed3(reference(k, deg).loss);
  const caption = beat => { f.seek(scene.beats[beat]); return f.$('[data-caption]').textContent; };
  assert.equal(caption(0), 'Sixteen points of the curve, PCA\'s flat line, and each point\'s residual to it.');
  assert.equal(caption(1), 'Tilt the line about the center. Can any direction leave less residual than flat?');
  assert.equal(caption(2), 'Tilting away from flat shortens some residuals and lengthens more.');
  const settled = beat => { f.seek(scene.beats[beat] + 4); return f.$('[data-caption]').textContent; };
  assert.equal(settled(2), `Upright, the line leaves L = ${L(90)}, the most of any tilt.`);
  assert(caption(3).includes(`L falls back to ${L(0)} only when the line is flat again`));
  assert.equal(caption(4), 'Now lean the line 45 degrees, toward one arm.');
  assert.equal(settled(4), `The far arm's residuals grow: L = ${L(45)}, more than flat.`);
  assert(caption(6).includes(`What is left, ${L(0)}, is the bend itself`));
  // The prose around the pane carries the same numbers.
  const items = [...f.root.querySelectorAll('.mechanism-transcript li')].map(node => node.textContent);
  assert.equal(items.length, scene.beats.length, 'one transcript item per beat');
  assert(items[0].includes(`L = ${L(0)}`) && items[2].includes(L(90)) && items[3].includes(L(0)));
  assert(items[4].includes('45-degree') && items[4].includes(`L = ${L(45)}`) && items[6].includes(L(0)));
  const scope = f.$('.mechanism-scope').textContent, {sxx, syy} = spreads(k);
  assert(scope.includes(`horizontal spread, ${fixed3(sxx)}`) && scope.includes(`vertical spread, ${fixed3(syy)}`));
  assert(scope.includes(`(2j + 1)/${k.n}`) && scope.includes(`n = ${k.n} and d = 2`));
});

test('flat line: text stays inside the picture and off its neighbours', t => {
  for (const width of WIDTHS) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    const states = [...scene.beats, ...scene.beats.map(b => b + 2.5), ...scene.beats.map(b => b + 4.99), scene.duration]
      .map(time => () => f.seek(Math.min(time, scene.duration)));
    for (let deg = 0; deg <= 180; deg += 10) states.push(() => { f.seek(scene.duration); drag(f, deg); });
    for (const [index, reach] of states.entries()) {
      reach();
      const [, , W, H] = picture(f).getAttribute('viewBox').split(/\s+/).map(Number);
      const boxes = texts(f).map(node => {
        const size = Number(node.getAttribute('font-size')), anchor = node.getAttribute('text-anchor');
        const w = node.textContent.length * size * 0.56, x = attr(node, 'x'), y = attr(node, 'y');
        const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
        return {left, right: left + w, top: y - size, bottom: y + size * 0.3, text: node.textContent};
      });
      for (const b of boxes) assert(b.left >= -1 && b.right <= W + 1 && b.top >= -1 && b.bottom <= H + 1, `${width}px state ${index} "${b.text}" outside`);
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        assert(Math.min(a.right, b.right) - Math.max(a.left, b.left) <= 1 || Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) <= 1,
          `${width}px state ${index} "${a.text}" and "${b.text}" collide`);
      }
    }
  }
});

test('flat line: every mark stays inside the picture, and L never covers the line or a residual', t => {
  for (const width of [296, 713]) {
    const f = fixture(t, NAME, {width}); f.load(); f.open(); f.seek(scene.duration);
    for (let deg = 0; deg <= 180; deg++) {
      drag(f, deg);
      const [, , W, H] = picture(f).getAttribute('viewBox').split(/\s+/).map(Number);
      for (const node of drawing(f).querySelectorAll('circle')) {
        const r = attr(node, 'r');
        assert(attr(node, 'cx') - r >= 0 && attr(node, 'cx') + r <= W && attr(node, 'cy') - r >= 0 && attr(node, 'cy') + r <= H,
          `${width}px ${deg} degrees: a circle runs outside`);
      }
      const segments = [...drawing(f).querySelectorAll('line')].map(node => [[attr(node, 'x1'), attr(node, 'y1')], [attr(node, 'x2'), attr(node, 'y2')], attr(node, 'stroke-width')]);
      for (const [a, b, stroke] of segments) {
        for (const [x, y] of [a, b]) assert(x - stroke / 2 >= 0 && x + stroke / 2 <= W && y - stroke / 2 >= 0 && y + stroke / 2 <= H, `${width}px ${deg} degrees: a line runs outside`);
      }
      // The label box against every drawn segment and circle of the main picture.
      const node = value(f, 'loss'), size = attr(node, 'font-size');
      const box = {l: attr(node, 'x'), r: attr(node, 'x') + node.textContent.length * size * 0.56, t: attr(node, 'y') - size, b: attr(node, 'y') + size * 0.3};
      const gap = ([x, y]) => Math.hypot(Math.max(box.l - x, 0, x - box.r), Math.max(box.t - y, 0, y - box.b));
      for (const [a, b, stroke] of segments) {
        for (let s = 0; s <= 50; s++) {
          const p = [a[0] + (b[0] - a[0]) * s / 50, a[1] + (b[1] - a[1]) * s / 50];
          assert(gap(p) >= stroke / 2 + 1, `${width}px ${deg} degrees: L touches a line`);
        }
      }
      for (const dot of drawing(f).querySelectorAll('[data-point], [data-foot]')) {
        assert(gap([attr(dot, 'cx'), attr(dot, 'cy')]) >= attr(dot, 'r') + 1, `${width}px ${deg} degrees: L touches a point or foot`);
      }
    }
  }
});

test('flat line: dragging the dial is a detour that the timeline ends', t => {
  const f = fixture(t, NAME), k = declared(f); f.load(); f.open();
  const slider = dial(f);
  f.seek(scene.beats[4] + 1); f.play(); assert(f.playing);
  drag(f, 120);
  assert(!f.playing, 'dragging pauses');
  assert.equal(f.root.dataset.override, 'dial');
  assert.equal(f.root.dataset.tilt, '120');
  assert.equal(value(f, 'loss').textContent, `L = ${fixed3(reference(k, 120).loss)}`);
  assert.equal(slider.getAttribute('aria-valuetext'), `tilt 120 degrees: L = ${fixed3(reference(k, 120).loss)}`);
  assert.equal(f.$('[data-tilt-readout]').textContent, '120°');
  assert.doesNotMatch(f.$('[data-caption]').textContent, /\d/, 'the caption names no value while dragging');
  assert(f.$('[data-formula]').classList.contains('fl-foot-lit'), 'the moving feet light their symbol');
  // A key the transport ignores leaves the detour alone; a scrub ends it.
  f.key('x');
  assert.equal(f.root.dataset.override, 'dial');
  f.seek(scene.beats[4] + 4);
  assert.equal(f.root.dataset.override, '');
  assert.equal(f.root.dataset.tilt, '45');
  // Play from a pause ends a detour too, and so does an arrow-key beat.
  drag(f, 30); assert.equal(f.root.dataset.tilt, '30');
  f.play(); assert.equal(f.root.dataset.override, ''); assert(f.playing);
  f.key('Escape'); assert(!f.playing);
  drag(f, 150); f.key('ArrowRight');
  assert.equal(f.root.dataset.override, ''); assert.equal(f.time, scene.beats[5]);
  // Keys on the slider never reach the pane's beat seeking.
  const time = f.time;
  f.key('ArrowRight', slider); f.key('End', slider); f.key('Home', slider);
  assert.equal(f.time, time);
});

test('flat line: the dial is inert until the player mounts', t => {
  const f = fixture(t, NAME);
  assert.match(read('flat-line/player.css'), /#flat-line-excerpt:not\(\[data-ready\]\) \.fl-dial \{ visibility:hidden; \}/);
  const before = canonicalMarkup(drawing(f).innerHTML);
  drag(f, 90);
  assert.equal(canonicalMarkup(drawing(f).innerHTML), before, 'nothing listens to the dial before mount');
  assert.equal(dial(f).getAttribute('aria-valuetext'), 'tilt 0 degrees', 'the static value text names no number the player computes');
  assert.equal(dial(f).getAttribute('aria-label'), 'Tilt of the line');
  assert.deepEqual([...f.root.querySelectorAll('#flat-line-tilt-ticks option')].map(node => node.value), ['0', '45', '90', '135', '180']);
  assert(!dial(f).closest('[data-controls]'), 'the dial sits outside the transport bar');
  f.load(); f.open();
  assert.equal(f.$('[data-tilt-display]').getAttribute('aria-hidden'), 'true', 'the slider speaks its own value once mounted');
  assert.equal(dial(f).min, '0'); assert.equal(dial(f).max, '180');
});

test('flat line: the panel is the one fixture copy', t => {
  // The check's case: double the bend. The upright line now wins, with the same L the flat
  // line had to beat before, and the flat line leaves four times the old vertical spread.
  const f = fixture(t, NAME), k = {...declared(f), height: 2 * declared(f).height};
  f.root.dataset.height = String(k.height);
  f.load(); f.open(); f.seek(scene.duration);
  drag(f, 90); const upright = value(f, 'loss').textContent;
  drag(f, 0); const flat = value(f, 'loss').textContent;
  assert.equal(upright, `L = ${fixed3(reference(k, 90).loss)}`);
  assert.equal(flat, `L = ${fixed3(reference(k, 0).loss)}`);
  assert.deepEqual([upright, flat], ['L = 0.166', 'L = 0.392']);
  assertPrintedIsDrawn(f, k, 'height doubled, flat');
});

test('flat line: seeking is deterministic', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const snap = time => { f.seek(time); return canonicalMarkup(drawing(f).innerHTML) + described(f) + dial(f).getAttribute('aria-valuetext'); };
  const times = [0, 7, 11.3, 12.6, 14, 16.4, 19, 21.1, 23, 26.2, 29, 33, 39];
  assert.deepEqual(times.map(snap), [...times].reverse().map(snap).reverse());
});

test('flat line: the committed static print is a fresh render of the final frame', async () => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after, 'run scripts/render_static_frames.cjs flat-line');
});

test('flat line: typography, voice and inertness', t => {
  const player = read('flat-line/player.js'), panel = read('flat-line/panel.html');
  assert.doesNotMatch(player, /Math\.random|fetch\(|import\(|setInterval\(/);
  assert.equal((player.match(/getBoundingClientRect/g) || []).length, 1);
  assert.doesNotMatch(panel, /@eq-|\u2014/);
  // Every string a reader sees or hears: the picture at each beat, its description, both
  // value texts, and the prose around the pane.
  const f = fixture(t, NAME); f.load(); f.open();
  const spoken = [];
  for (const time of [...scene.beats, ...scene.beats.map(b => b + 2.5), scene.duration]) {
    f.seek(time);
    spoken.push(...texts(f).map(node => node.textContent), described(f), dial(f).getAttribute('aria-valuetext'), scrubbed(f), f.$('[data-caption]').textContent);
  }
  const prose = [...f.root.querySelectorAll('summary, p, li')].map(node => node.textContent);
  for (const text of [...spoken, ...prose]) {
    assert.doesNotMatch(text, /(?<![\w.])-\d|\d-\d|\de[-+]?\d/, `hyphen-minus or e-notation in "${text}"`);
    assert.doesNotMatch(text, /!/, `exclamation mark in "${text}"`);
    assert.doesNotMatch(text, /n't\b|\b(?:it|that|there|what|here|let|he|she)'s\b|'(?:re|ve|ll|m|d)\b/i, `contraction in "${text}"`);
    assert.doesNotMatch(text, /\b(?:recaps?|sections?|subsections?|tables?|callouts?|receipts?|ledgers?|film|lectures?|courses?|students?)\b/i, `apparatus or provenance word in "${text}"`);
  }
  // One visible boundary sentence, the scene brief's exact words.
  const boundary = f.root.querySelectorAll('.mechanism-boundary > p');
  assert.equal(boundary.length, 1);
  assert.equal(boundary[0].textContent, 'Sixteen evenly spaced points stand in for the chapter\'s grid, and the sweep compares straight lines only, which is why the bend\'s residual survives every tilt.');
  assert(boundary[0].textContent.split(/\s+/).length <= 30);
  assert.equal(f.root.querySelectorAll('.mechanism-boundary details.mechanism-scope').length, 1);
  assert(!f.$('.mechanism-scope').open && !f.$('.mechanism-check').open);
  // The formula: the brief's TeX with the book's macros, and \norm is the book's own.
  assert.equal(f.$('#eq-flat-line-1').textContent,
    '\\( \\residualpart{\\mathcal{L}_{\\mathrm{AE}}} = \\frac{1}{nd}\\sum_{i=1}^{n}\\class{fl-norm}{\\norm{\\featurepart{\\vect{x}_i} - \\class{fl-foot}{\\predictionpart{\\widehat{\\vect{x}}_i}}}_2^2} \\)');
  assert.match(fs.readFileSync(path.join(ROOT, 'mathjax-config.html'), 'utf8'), /norm: \["\\\\left\\\\lVert#1\\\\right\\\\rVert", 1\]/);
  // The accented symbol on the picture wears the serif class on its glyph alone.
  f.seek(scene.duration);
  const hat = drawing(f).querySelector('[data-label="x-hat"] tspan');
  assert.equal(hat.getAttribute('class'), 'mechanism-accent');
  assert.equal(hat.textContent, 'x̂');
  // Colours: the book's macro values, scoped to this scene; no reserved class names.
  const css = read('flat-line/player.css');
  for (const colour of ['#2b6cb0', '#c05621', '#2f855a', '#722f37', '#232d4b']) assert(css.includes(colour));
  for (const rule of css.replace(/\/\*[\s\S]*?\*\//g, '').match(/^[^@{}\s][^{}]*\{/gm)) {
    for (const selector of rule.slice(0, -1).split(',')) assert.match(selector.trim(), /^(#flat-line-excerpt|\.flat-line-)/, `unscoped rule ${selector}`);
  }
  assert.doesNotMatch(css + panel + player, /(?:class="|\.)column-/, "no class in Quarto's reserved column-* namespace");
});

test('integration: the excerpt closes "What if the map could bend?" before the next heading', () => {
  const filter = fs.readFileSync(path.join(ROOT, scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
  const config = fs.readFileSync(path.join(ROOT, '_quarto.yml'), 'utf8');
  assert.match(config, /^\s+- interactives\/flat-line\/player\.js$/m);
  const chapter = chapterSource(NAME);
  assert.equal(scene.anchor.type, 'before-heading');
  assert.equal(scene.anchor.target, 'A code is not yet a distribution');
  const headings = chapter.split('\n').filter(line => /^#{2,}\s/.test(line)).map(line => line.replace(/^#+\s+/, '').replace(/\s*\{.*\}\s*$/, ''));
  assert.equal(headings.filter(heading => heading === scene.anchor.target).length, 1, 'the heading occurs once');
  const at = chapter.indexOf(`## ${scene.anchor.target}`), end = 'true manifold or its preferred coordinates.';
  const bend = chapter.indexOf('## What if the map could bend?'), figure = chapter.indexOf('::: {#fig-linear-nonlinear-ae}');
  const paragraph = chapter.indexOf(end);
  assert(bend >= 0 && bend < figure && figure < paragraph && paragraph < at, 'after the figure and the manifold-learning paragraph');
  assert.match(chapter.slice(paragraph + end.length, at), /^\s*$/, 'nothing between that paragraph and the heading');
});
