#!/usr/bin/env node
// Test-only geometry and picture checks for the Chapter 3 feature-space excerpt.
// No dependency of this file ships. The oracle below rebuilds the declared cloud, evaluates
// the declared layer at every bend, and recomputes the readout coordinate, the wrong-side
// count and every crossing from the panel's own data-* attributes, so the player cannot
// agree with itself.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, close, canonicalMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'feature-space-excerpt', scene = entry(NAME);
const WIDTHS = [240, 296, 375, 480, 519, 520, 640, 713];
const dot = (a, b) => a.reduce((total, value, index) => total + value * b[index], 0);
const attr = (node, key) => Number(node.getAttribute(key));
const drawing = f => f.$('[data-drawing]');
const visible = node => node && !node.closest('[hidden]') && !node.hasAttribute('hidden');
const declared = f => ({
  perMoon: Number(f.root.dataset.perMoon),
  radii: numbers(f.root.dataset.radii),
  moonOffset: numbers(f.root.dataset.moonOffset),
  hidden: JSON.parse(f.root.dataset.hidden),
  hiddenBias: numbers(f.root.dataset.hiddenBias),
  readout: numbers(f.root.dataset.readout),
  readoutBias: Number(f.root.dataset.readoutBias),
  secondAxis: numbers(f.root.dataset.secondAxis)
});
function mount(t, source, options = {}) {
  const f = fixture(t, NAME, options);
  if (source) Object.assign(f.root.dataset, {perMoon: String(source.perMoon), radii: source.radii.join(' '),
    moonOffset: source.moonOffset.join(' '), hidden: JSON.stringify(source.hidden),
    hiddenBias: source.hiddenBias.join(' '), readout: source.readout.join(' '),
    readoutBias: String(source.readoutBias), secondAxis: source.secondAxis.join(' ')});
  return f;
}

// --- The independent oracle: nothing below reads the player ----------------------
function oracle(source) {
  const norm = Math.hypot(...source.readout);
  const unit = source.readout.map(value => value / norm);
  const cut = -source.readoutBias / norm;
  const cloud = [];
  for (let moon = 0; moon < 2; moon++) {
    for (let index = 0; index < source.perMoon; index++) {
      const angle = index * Math.PI / (source.perMoon - 1);
      const radius = source.radii[index % source.radii.length];
      const x = radius * Math.cos(angle), y = radius * Math.sin(angle);
      cloud.push(moon === 0 ? {label: 0, x, y}
        : {label: 1, x: source.moonOffset[0] - x, y: source.moonOffset[1] - y});
    }
  }
  const place = lambda => {
    const raw = cloud.map(point => {
      const phi = source.hidden.map((row, index) => {
        const z = row[0] * point.x + row[1] * point.y + source.hiddenBias[index];
        return z >= 0 ? z : lambda * z;
      });
      return {label: point.label, across: dot(phi, unit), up: dot(phi, source.secondAxis)};
    });
    const mean = raw.reduce((total, spot) => total + spot.up, 0) / raw.length;
    return raw.map(spot => ({...spot, up: spot.up - mean,
      wrong: (spot.label === 1) !== (spot.across > cut)}));
  };
  const wrong = spots => spots.filter(spot => spot.wrong).length;
  const ends = [place(1), place(0)];
  const crossings = cloud.map((_, index) => {
    const from = ends[0][index].across - cut, to = ends[1][index].across - cut;
    return from * to < 0 ? {index, at: from / (from - to)} : null;
  }).filter(Boolean).sort((first, second) => first.at - second.at);
  return {norm, unit, cut, cloud, place, wrong, ends, crossings};
}
// The player's timeline, restated: the bend leaves 1 at the third beat and reaches 0 at the
// sixth, linearly in time, and each beat holds its own start value under reduced motion.
const MORPH = [1, 1, 1, 0.75, 0.5, 0.25, 0, 0];
const bendAt = (time, reduced = false) => {
  const clamped = Math.max(0, Math.min(scene.duration, time));
  const stage = scene.beats.reduce((found, beat, index) => (clamped >= beat ? index : found), 0);
  const next = scene.beats[stage + 1] === undefined ? scene.duration : scene.beats[stage + 1];
  const clock = reduced ? scene.beats[stage] : clamped;
  const fraction = next > scene.beats[stage] ? (clock - scene.beats[stage]) / (next - scene.beats[stage]) : 1;
  const to = MORPH[stage + 1] === undefined ? MORPH[stage] : MORPH[stage + 1];
  return {stage, bend: MORPH[stage] + (to - MORPH[stage]) * Math.max(0, Math.min(1, fraction))};
};
// A label's drawn extent, estimated from its own font size, because nothing here measures
// text. The player's key placement estimates a character the same way.
const box = node => {
  const font = attr(node, 'font-size'), text = node.textContent;
  const reach = 0.62 * font * text.length, anchor = node.getAttribute('text-anchor');
  const transform = node.getAttribute('transform');
  const spun = transform && /rotate\(-90\)/.test(transform);
  const shift = transform ? numbers(/translate\(([^)]*)\)/.exec(transform)[1]) : [0, 0];
  const x = attr(node, 'x') + shift[0], y = attr(node, 'y') + shift[1];
  if (spun) return {node, left: x - font, right: x + 0.25 * font,
    top: anchor === 'middle' ? y - reach / 2 : y - reach, bottom: anchor === 'middle' ? y + reach / 2 : y};
  const left = anchor === 'end' ? x - reach : anchor === 'middle' ? x - reach / 2 : x;
  return {node, left, right: left + reach, top: y - font, bottom: y + 0.25 * font};
};
const apart = (a, b, pad = 0) => a.right + pad < b.left || b.right + pad < a.left
  || a.bottom + pad < b.top || b.bottom + pad < a.top;
const spot = node => ({left: attr(node, 'cx') - attr(node, 'r'), right: attr(node, 'cx') + attr(node, 'r'),
  top: attr(node, 'cy') - attr(node, 'r'), bottom: attr(node, 'cy') + attr(node, 'r')});

test('feature space: the manuscript owns the sentence while the cloud and the map are declared', t => {
  const f = fixture(t, NAME), chapter = chapterSource(NAME);
  assert.equal(scene.qmd, 'chapters/part1/03-nonlinearity-mlp.qmd');
  assert.equal(scene.anchor.type, 'after-cell');
  assert.equal(scene.anchor.target, 'cell-fig-feature-space');
  assert.equal(scene.duration, 40);
  assert.deepEqual(scene.beats, [0, 5, 10, 15, 20, 25, 30, 35]);
  assert.equal(f.root.dataset.evidenceClass, 'schematic');
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal), literal);
  // The panel follows the figure whose two panels it joins, and the chapter states, in this
  // order, the moon shape, the figure, and the sentence the scene draws.
  const moons = chapter.indexOf('moon2 = torch.stack([1 - torch.cos(t), 0.4 - torch.sin(t)], 1)');
  const figure = chapter.indexOf('#| label: fig-feature-space'), sentence = chapter.indexOf('space in which the boundary is');
  assert(moons > 0 && sentence > moons && figure > sentence, 'the chapter states the moons, then the sentence, then the figure');
  assert.match(chapter, /the decision boundary sits at\nthe exact coordinate \$-b\/\\lVert\\vect\{w\}\\rVert\$/);
  assert.match(f.$('.mechanism-intro').textContent, /figure above prints the start and the end side by side/);
  // The panel links the collapse equation by anchor, never by a guessed number.
  assert.match(read('feature-space/panel.html'), /href="#eq-collapse"/);
  assert.doesNotMatch(read('feature-space/panel.html'), /@eq-/);
  assert.match(chapter, /\$\$ \{#eq-collapse\}/);
});

test('feature space: the declared readout puts the cut at the chapter exact coordinate', t => {
  const f = fixture(t, NAME), source = declared(f), model = oracle(source);
  close(model.norm, 2); close(model.cut, 0.25);
  assert.deepEqual(model.unit, [0.5, 0.5, -0.5, -0.5]);
  // The cut is -b/||w||, not a drawn choice: change b and it moves by exactly that ratio.
  close(oracle({...source, readoutBias: -1}).cut, 0.5);
  close(oracle({...source, readout: [2, 2, -2, -2], readoutBias: -1}).cut, 0.25);
  f.load(); f.open();
  close(Number(f.root.dataset.cut), 0.25);
});

test('feature space: the declared layer draws the input plane undistorted while the bend is open', t => {
  const f = fixture(t, NAME), source = declared(f), model = oracle(source);
  const column = index => source.hidden.map(row => row[index]);
  close(dot(column(0), model.unit), 1); close(dot(column(1), model.unit), 0);
  close(dot(column(0), source.secondAxis), 0); close(dot(column(1), source.secondAxis), 1);
  close(dot(source.secondAxis, model.unit), 0); close(Math.hypot(...source.secondAxis), 1);
  // Which is what makes the opening frame the chapter's own input plane: at lambda = 1 the
  // drawn coordinates are the input coordinates, shifted by the layer's own bias offsets.
  const shift = dot(source.hiddenBias, model.unit);
  model.ends[0].forEach((place, index) => {
    close(place.across, model.cloud[index].x + shift, 1e-12);
    close(place.up, model.cloud[index].y - 0.2, 1e-12);
  });
  close(shift, -0.25);
});

test('feature space: no straight line separates the declared cloud in the input plane', t => {
  const f = fixture(t, NAME), source = declared(f), {cloud} = oracle(source);
  const perMoon = source.perMoon;
  assert.equal(cloud.length, 2 * perMoon);
  // Each moon is the chapter's own parametrisation, and the second is the first reflected
  // through the midpoint of the declared offset, so the two are congruent by construction.
  for (let index = 0; index < perMoon; index++) {
    close(cloud[index + perMoon].x, source.moonOffset[0] - cloud[index].x, 1e-12);
    close(cloud[index + perMoon].y, source.moonOffset[1] - cloud[index].y, 1e-12);
    close(Math.hypot(cloud[index].x, cloud[index].y), source.radii[index % source.radii.length], 1e-12);
  }
  // The certificate: a chord of class 0 crosses a chord of class 1, so the two convex hulls
  // meet and no straight line can have one class on each side.
  const meet = (p, q, r, s) => {
    const d1 = [q.x - p.x, q.y - p.y], d2 = [s.x - r.x, s.y - r.y];
    const den = d1[0] * d2[1] - d1[1] * d2[0];
    const gap = [r.x - p.x, r.y - p.y];
    return {first: (gap[0] * d2[1] - gap[1] * d2[0]) / den, second: (gap[0] * d1[1] - gap[1] * d1[0]) / den,
      at: [p.x + d1[0] * ((gap[0] * d2[1] - gap[1] * d2[0]) / den), p.y + d1[1] * ((gap[0] * d2[1] - gap[1] * d2[0]) / den)]};
  };
  const hit = meet(cloud[0], cloud[4], cloud[perMoon], cloud[perMoon + 15]);
  assert(hit.first > 0 && hit.first < 1 && hit.second > 0 && hit.second < 1,
    'the two chords must cross strictly inside both');
  close(hit.at[0], 0.8919085259, 1e-8); close(hit.at[1], 0.4, 1e-12);
});

test('feature space: the same straight cut fails at lambda one and separates at lambda zero', t => {
  const f = fixture(t, NAME), source = declared(f), model = oracle(source);
  assert.equal(model.wrong(model.ends[0]), 10);
  assert.equal(model.wrong(model.ends[1]), 0);
  const left = Math.max(...model.ends[1].filter(place => place.label === 0).map(place => place.across));
  const right = Math.min(...model.ends[1].filter(place => place.label === 1).map(place => place.across));
  close(right - left, 0.305, 1e-12);
  close(Math.min(model.cut - left, right - model.cut), 0.1525, 1e-12);
  // Every drawn coordinate is affine in the bend, so a point travels a straight segment and
  // can cross the stationary cut only once. That is why the count only ever falls.
  for (const lambda of [0.1, 0.25, 0.5, 0.75, 0.9]) {
    model.place(lambda).forEach((place, index) => {
      close(place.across, model.ends[1][index].across
        + lambda * (model.ends[0][index].across - model.ends[1][index].across), 1e-12);
      close(place.up, model.ends[1][index].up
        + lambda * (model.ends[0][index].up - model.ends[1][index].up), 1e-12);
    });
  }
  assert.equal(model.crossings.length, 10);
  close(model.crossings.at(-1).at, 0.7889269, 1e-6);
  let previous = Infinity;
  for (let step = 0; step <= 100; step++) {
    const count = model.wrong(model.place(1 - step / 100));
    assert(count <= previous, 'the wrong-side count never rises');
    previous = count;
  }
});

test('feature space: the picture draws the coordinates it publishes, in both layouts', t => {
  const f = fixture(t, NAME), model = oracle(declared(f));
  f.load(); f.open();
  for (const width of [713, 296]) {
    f.resize(width);
    assert.equal(f.root.dataset.layout, width < 520 ? 'narrow' : 'wide');
    const scale = Number(f.root.dataset.pixelsPerUnit);
    for (let step = 0; step <= 40; step++) {
      const time = step, {bend} = bendAt(time);
      f.seek(time);
      close(Number(f.root.dataset.bend), bend, 1e-12);
      const places = model.place(bend);
      assert.equal(Number(f.root.dataset.wrong), model.wrong(places));
      const cut = f.$('[data-cut]'), dots = [...drawing(f).querySelectorAll('[data-point]')];
      assert.equal(dots.length, places.length);
      // Horizontal positions are pinned to the cut itself, so the picture cannot slide the
      // cloud and the line together; vertical positions are checked against one another.
      dots.forEach((node, index) => {
        close((attr(node, 'cx') - attr(cut, 'x1')) / scale, places[index].across - model.cut, 2e-5);
        close((attr(node, 'cy') - attr(dots[0], 'cy')) / scale, places[0].up - places[index].up, 2e-5);
      });
      // A wine ring is drawn on exactly the points the oracle puts on the wrong side.
      const ringed = [...drawing(f).querySelectorAll('[data-ring]')]
        .filter(visible).map(node => Number(node.dataset.ring)).sort((a, b) => a - b);
      assert.deepEqual(ringed, places.map((place, index) => place.wrong ? index : -1)
        .filter(index => index >= 0));
    }
  }
});

test('feature space: the cut is one vertical line that never moves and never bends', t => {
  const f = fixture(t, NAME);
  f.load(); f.open();
  for (const width of WIDTHS) {
    f.resize(width);
    const seen = new Set();
    for (let step = 0; step <= 80; step++) {
      f.seek(step / 2);
      const cut = f.$('[data-cut]');
      assert.equal(attr(cut, 'x1'), attr(cut, 'x2'), 'the cut stays vertical');
      seen.add(`${cut.getAttribute('x1')}/${cut.getAttribute('y1')}/${cut.getAttribute('y2')}`);
    }
    assert.equal(seen.size, 1, `the cut moved during playback at ${width}px`);
  }
});

test('feature space: the reveals arrive in their explanatory order', t => {
  const f = fixture(t, NAME);
  f.load(); f.open();
  const where = {'[data-cut-name]': 5, '[data-gauge]': 10, '[data-channel]': 30, '[data-trails]': 35};
  for (const [selector, beat] of Object.entries(where)) {
    for (const time of [0, beat - 0.01, beat, scene.duration]) {
      f.seek(time);
      assert.equal(visible(f.$(selector)), time >= beat, `${selector} at ${time}s`);
    }
  }
  // The channel is the measured gap, not a decoration: it is exactly as wide as the clear
  // strip between the two classes, and the cut lies inside it.
  const model = oracle(declared(f));
  f.resize(713); f.seek(scene.duration);
  const scale = Number(f.root.dataset.pixelsPerUnit), channel = f.$('[data-channel]'), cut = f.$('[data-cut]');
  close(attr(channel, 'width') / scale, 0.305, 2e-5);
  assert(attr(channel, 'x') < attr(cut, 'x1') && attr(cut, 'x1') < attr(channel, 'x') + attr(channel, 'width'));
  // One grey trail per crossing, each starting where its point started.
  assert.equal(f.$('[data-trails]').querySelectorAll('[data-trail]').length, model.crossings.length);
  for (const crossing of model.crossings) {
    const line = f.$(`[data-trail="${crossing.index}"]`), start = f.$(`[data-trail-start="${crossing.index}"]`);
    close(attr(line, 'x1'), attr(start, 'cx'), 1e-9); close(attr(line, 'y1'), attr(start, 'cy'), 1e-9);
    close((attr(line, 'x1') - attr(cut, 'x1')) / scale, model.ends[0][crossing.index].across - model.cut, 2e-5);
  }
});

test('feature space: the answer is withheld until the last point has crossed', t => {
  const f = fixture(t, NAME);
  const model = oracle(declared(f));
  const settles = 10 + 20 * model.crossings.at(-1).at;
  f.load(); f.open();
  const range = f.$('[data-controls] input[type=range]');
  for (let step = 0; step <= 400; step++) {
    const time = step / 10;
    f.seek(time);
    const drawn = f.$('[data-figure]').textContent, label = f.$('[data-figure] svg').getAttribute('aria-label');
    const spoken = range.getAttribute('aria-valuetext') + ' ' + f.$('[data-caption]').textContent;
    const settled = time >= settles;
    assert.equal(/on its own side/.test(label), settled, `the picture names the answer at ${time}s`);
    assert.equal(Number(f.root.dataset.wrong) === 0, settled, `the count reaches zero early at ${time}s`);
    if (!settled) {
      assert.doesNotMatch(drawn, /wrong side\s+0(?!\.)/, `the drawn count spoils the answer at ${time}s`);
      assert.doesNotMatch(spoken, /separated|own side|all right/, `the reading spoils the answer at ${time}s`);
    }
  }
  close(settles, 25.7785384, 1e-5);
});

test('feature space: reduced motion holds one self-consistent still per beat', t => {
  const f = fixture(t, NAME, {reduced: true});
  const model = oracle(declared(f));
  f.load(); f.open();
  const bends = [], counts = [];
  for (const beat of scene.beats) {
    f.seek(beat + 1.5);
    bends.push(Number(f.root.dataset.bend));
    counts.push(Number(f.root.dataset.wrong));
    assert.equal(Number(f.root.dataset.stage), scene.beats.indexOf(beat));
  }
  assert.deepEqual(bends, MORPH);
  assert.deepEqual(counts, MORPH.map(bend => model.wrong(model.place(bend))));
  assert.deepEqual(counts, [10, 10, 10, 8, 4, 2, 0, 0]);
});

test('feature space: seek and resize histories reproduce the published frame', t => {
  const f = fixture(t, NAME);
  f.load(); f.open();
  const snapshot = () => JSON.stringify(f.root.dataset) + canonicalMarkup(f.$('[data-figure]').innerHTML);
  f.resize(713); f.seek(17.5);
  const first = snapshot();
  f.play(); f.tick(2000); f.resize(296); f.seek(3); f.resize(713); f.seek(17.5);
  assert.equal(snapshot(), first);
  f.resize(296); f.seek(31.25);
  const narrow = snapshot();
  f.seek(0); f.resize(713); f.seek(40); f.resize(296); f.seek(31.25);
  assert.equal(snapshot(), narrow);
});

test('feature space: every label stays inside the picture and clear of the marks it is not', t => {
  const f = fixture(t, NAME);
  f.load(); f.open();
  for (const width of WIDTHS) {
    f.resize(width);
    const height = numbers(f.$('[data-figure] svg').getAttribute('viewBox'))[3];
    for (let step = 0; step <= 40; step++) {
      const time = step;
      f.seek(time);
      const where = `at ${width}px, ${time}s`;
      const labels = [...drawing(f).querySelectorAll('text')].filter(visible)
        .filter(node => node.getAttribute('opacity') === null || Number(node.getAttribute('opacity')) > 0.15);
      assert(labels.length >= 4, `the picture keeps its labels ${where}`);
      const boxes = labels.map(box);
      for (const node of labels) assert(attr(node, 'font-size') >= 10, `small text ${where}: ${node.textContent}`);
      for (const shape of boxes) {
        assert(shape.left >= -1 && shape.right <= width + 1,
          `label leaves the picture sideways ${where}: ${shape.node.textContent}`);
        assert(shape.top >= -1 && shape.bottom <= height + 1,
          `label leaves the picture vertically ${where}: ${shape.node.textContent}`);
      }
      // The two axis names share one spot and cross-fade there, so they are compared only
      // against everything else.
      const named = key => boxes.filter(shape => shape.node.hasAttribute(key));
      const stacked = new Set([...named('data-across-name'), ...named('data-up-name')]);
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        if (stacked.has(boxes[i]) && stacked.has(boxes[j])) continue;
        assert(apart(boxes[i], boxes[j]), `two labels collide ${where}: `
          + `"${boxes[i].node.textContent}" and "${boxes[j].node.textContent}"`);
      }
      // No label may sit on a point, a wine ring, or the gauge's own curve.
      const marks = [...drawing(f).querySelectorAll('[data-point], [data-ring]')].filter(visible).map(spot);
      for (const shape of boxes) for (const mark of marks)
        assert(apart(shape, mark, 1), `"${shape.node.textContent}" covers a mark ${where}`);
      for (const node of [...drawing(f).querySelectorAll('circle')].filter(visible)) {
        assert(attr(node, 'cx') - attr(node, 'r') >= 0 && attr(node, 'cx') + attr(node, 'r') <= width, where);
        assert(attr(node, 'cy') - attr(node, 'r') >= 0 && attr(node, 'cy') + attr(node, 'r') <= height, where);
      }
    }
  }
});

test('feature space: the gauge keeps its own corner of the picture at every bend', t => {
  const f = fixture(t, NAME);
  f.load(); f.open();
  for (const width of WIDTHS) {
    f.resize(width);
    if (!visible(f.$('[data-gauge]'))) continue;
    for (let step = 10; step <= 40; step++) {
      f.seek(step);
      const parts = [...f.$('[data-gauge]').querySelectorAll('path')].map(node => {
        const points = [...node.getAttribute('d').matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map(m => [Number(m[1]), Number(m[2])]);
        return {left: Math.min(...points.map(p => p[0])), right: Math.max(...points.map(p => p[0])),
          top: Math.min(...points.map(p => p[1])), bottom: Math.max(...points.map(p => p[1]))};
      });
      const marks = [...drawing(f).querySelectorAll('[data-point], [data-ring]')].filter(visible).map(spot);
      for (const part of parts) for (const mark of marks)
        assert(apart(part, mark, 2), `the gauge overlaps a mark at ${width}px, ${step}s`);
    }
  }
});

test('feature space: an unusable fixture never mounts a player over the static print', t => {
  const f = fixture(t, NAME), source = declared(f);
  const broken = [
    {...source, secondAxis: [0.5, -0.5, 0.5, -0.4]},                       // not a unit vector
    {...source, secondAxis: [0.5, 0.5, -0.5, -0.5]},                       // not orthogonal to the readout
    {...source, hidden: [[1, -0.625], [4.625, 2.125], [3.625, 3.125], [0, -1.5]]}, // distorts the input plane
    {...source, readout: [0, 0, 0, 0]},                                    // no readout direction
    {...source, readoutBias: -4}                                           // a cut no point can be right of
  ];
  for (const source2 of broken) {
    const g = mount(t, source2);
    assert.throws(() => g.load(), /feature-space/);
    assert(!g.root.dataset.ready, 'a refused fixture leaves the static print in place');
  }
  const good = mount(t, source);
  good.load(); good.open();
  assert.equal(good.root.dataset.ready, 'true');
});

test('feature space: wide and narrow script-free prints reproduce the final frame', async t => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after, 'regenerate the feature-space static frames');
  const f = fixture(t, NAME), narrow = f.$('[data-static-frame="narrow"]');
  assert(narrow); assert.equal(narrow.dataset.width, '296');
  const height = Number(narrow.dataset.height);
  const ids = [...f.root.querySelectorAll('[id]')].map(node => node.id);
  assert.equal(ids.length, new Set(ids).size);
  assert.match(drawing(f).textContent, /\u03bb = 0\.00/);
  assert(narrow.querySelector('[data-gauge]').hasAttribute('hidden'), 'the narrow print drops the gauge');
  for (const print of [drawing(f), narrow]) {
    assert.equal(print.querySelectorAll('[data-point]').length, 32);
    assert.equal([...print.querySelectorAll('[data-ring]')].filter(visible).length, 0,
      'the settled print rings nothing');
    assert.match(print.textContent, /−b\/‖w‖ = 0\.25/);
    assert.match(print.textContent, /wrong side\s+0/);
    assert.match(print.textContent, /λ = 0\.00/);
    assert(print.querySelector('[data-channel]') && print.querySelector('[data-trails] [data-trail]'));
  }
  f.load(); f.open(); f.seek(40); f.resize(296);
  assert.equal(f.root.querySelectorAll('[data-static-frame="narrow"]').length, 0);
  assert.equal(numbers(f.$('[data-figure] svg').getAttribute('viewBox'))[3], height);
  const wide = numbers(/viewBox="0 0 (\d+) (\d+)"/.exec(read('feature-space/panel.html')).slice(1, 3).join(' '));
  const css = read('feature-space/player.css');
  assert.match(css, /@container\s*\(max-width:\s*519px\)/);
  assert.match(css, new RegExp(`aspect-ratio:\\s*296\\s*/\\s*${height}`));
  assert.match(css, new RegExp(`aspect-ratio:\\s*713\\s*/\\s*${wide[1]}`));
});

test('feature space: this morph is a declared schematic, not a training replay', t => {
  const f = fixture(t, NAME), boundary = f.$('.mechanism-boundary').textContent;
  assert.match(boundary, /declared schematics/);
  assert.match(boundary, /not a replay of the chapter's trained sixteen-unit network/);
  assert.match(boundary, /Nothing here is trained and no accuracy is claimed/);
  assert.match(boundary, /about 90%.*belongs to its own seeded run/s);
  assert.match(boundary, /straight cut in this feature space is a bent, piecewise-linear boundary back in the input plane/);
  assert.match(boundary, /convex hulls of the two declared classes overlap/);
  assert.match(boundary, /drawing device for continuity, not an activation the chapter trains/);
  assert.match(boundary, /declared orthogonal direction rather than the chapter's measured principal component/);
  assert.match(f.$('.mechanism-scope > summary').textContent, /Scope and caveats/);
  // One picture, one formula line, one caption, one range: no second control was smuggled in.
  f.load(); f.open();
  assert.equal(f.root.querySelectorAll('input[type="range"]').length, 1);
  assert.deepEqual(Object.keys(f.root.dataset).filter(key => !['player', 'playback', 'evidenceClass',
    'perMoon', 'radii', 'moonOffset', 'hidden', 'hiddenBias', 'readout', 'readoutBias', 'secondAxis',
    'ready', 'duration', 'time', 'playing', 'typeset'].includes(key)).sort(),
  ['bend', 'crossings', 'cut', 'layout', 'pixelsPerUnit', 'separated', 'settledAt', 'stage', 'wrong']);
  const filter = fs.readFileSync(path.join(ROOT, scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
  assert.doesNotMatch(read('feature-space/player.js'), /Math\.random|fetch\(|import\(|setInterval\(/);
});

registerTransportTests(NAME, {witness: /−b\/‖w‖ = 0\.25/});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);
