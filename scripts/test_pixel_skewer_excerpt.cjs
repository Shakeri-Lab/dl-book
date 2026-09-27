#!/usr/bin/env node
// Test-only checks for the Chapter 9 one-by-one convolution scene. Nothing here ships. The
// suite recomputes every output from the panel's declared columns, weights and biases as a
// linear layer at one pixel, and reads the picture back out of the SVG: the claim is that
// each output pixel comes from its own column only, through one W that never changes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, canonicalMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'pixel-skewer-excerpt', scene = entry(NAME);
const WIDTHS = [296, 360, 375, 480, 560, 599, 600, 713, 900];
const attr = (node, key) => Number(node.getAttribute(key));
const drawing = f => f.$('[data-drawing]');
const texts = f => [...drawing(f).querySelectorAll('text')];
const value = (f, name) => drawing(f).querySelector(`[data-value="${name}"]`);
const mark = (f, name) => drawing(f).querySelector(`[data-mark="${name}"]`);
const weightsMarkup = f => { const node = mark(f, 'weights'); return node && canonicalMarkup(node.outerHTML); };

const declared = f => {
  const d = f.root.dataset, p = numbers(d.pixels);
  return {cin: Number(d.channels), n: Number(d.size), own: Number(d.out), range: numbers(d.outRange),
    sweep: numbers(d.outSweep), spots: [{r: p[0], c: p[1]}, {r: p[2], c: p[3]}],
    columns: [numbers(d.columnA), numbers(d.columnB)], w: numbers(d.weights), b: numbers(d.bias)};
};
// nn.Linear on one pixel's column, then ReLU: row o of W against the column, plus b[o].
const layer = (k, column, rows) => Array.from({length: rows}, (_, o) => {
  const z = column.reduce((sum, x, c) => sum + k.w[o * k.cin + c] * x, k.b[o]);
  return {z, y: Math.max(0, z)};
});
// The same numbers read as a convolution: a C_out x C_in x 1 x 1 kernel slid over a stack
// whose only declared pixels are the two columns. The 1 x 1 window reads nothing else.
const convolve = (k, rows) => k.spots.map((spot, p) => Array.from({length: rows}, (_, o) => {
  let z = k.b[o];
  for (let c = 0; c < k.cin; c++) for (let a = 0; a < 1; a++) for (let bb = 0; bb < 1; bb++) z += k.w[o * k.cin + c] * k.columns[p][c];
  return Math.max(0, z);
}));

registerTransportTests(NAME, {witness: /272 parameters/, anchors: ['pixel-skewer-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('pixel skewer: the shapes are NINSmall\'s', t => {
  const f = fixture(t, NAME), k = declared(f), chapter = chapterSource(NAME);
  assert(chapter.includes(`*nin_block(1, ${k.cin}), nn.MaxPool2d(2),`), 'sixteen channels feed the first block\'s 1 x 1 layers');
  assert.equal((chapter.match(/nn\.Conv2d\(c_out, c_out, 1\), nn\.ReLU\(\)/g) || []).length, 2, 'two 1 x 1 layers per block, each with its ReLU');
  assert(chapter.includes(`# (1200, 1, ${k.n}, ${k.n})`), 'the map is the chapter\'s 28 x 28');
  assert(chapter.includes('nn.Conv2d(c_in, c_out, 3, padding=1, bias=False)'), 'the 3 x 3 before them keeps the size');
  assert.equal(k.own, k.cin, 'the timeline\'s own layer is the chapter\'s square 1 x 1');
  assert.deepEqual(k.range, [1, 2 * k.cin]);
  assert.equal(k.w.length, k.b.length * k.cin, 'one row of weights per declared output channel');
  assert(k.range[1] <= k.b.length && k.sweep.every(c => c >= k.range[0] && c <= k.range[1]));
  assert(k.columns.every(column => column.length === k.cin && column.every(v => v >= 0)), 'post-ReLU columns');
  // The toy is halves, so every output is exact in binary floating point.
  for (const v of [...k.w, ...k.b, ...k.columns.flat()]) assert.equal(v * 2, Math.round(v * 2));
});

test('pixel skewer: a 1 x 1 convolution and nn.Linear give the same outputs, and the panel draws them', t => {
  const f = fixture(t, NAME), k = declared(f);
  const conv = convolve(k, k.b.length);
  k.columns.forEach((column, p) => assert.deepEqual(layer(k, column, k.b.length).map(o => o.y), conv[p]));
  const [a, b] = k.columns.map(column => layer(k, column, k.own));
  assert.equal(a.filter(o => o.z < 0).length, 5, 'ReLU zeroes five outputs at the first pixel');
  assert.equal(b.filter(o => o.z < 0).length, 6, 'and six at the second');
  assert(a.concat(b).every(o => o.z !== 0), 'no pre-activation sits exactly on the kink');
  f.load(); f.open();
  const bars = () => [...drawing(f).querySelectorAll('[data-bar^="y-"]')].map(node => Number(node.getAttribute('data-length')));
  f.seek(scene.beats[3] + 3.3);
  assert.deepEqual(bars(), a.map(o => o.y), 'the first pixel\'s outputs, before they fly');
  f.seek(scene.beats[4] + 3.2);
  assert.deepEqual(bars(), b.map(o => o.y), 'the second pixel\'s');
  f.seek(scene.duration);
  assert.deepEqual(bars(), b.map(o => o.y));
  // Every exact zero is drawn as an open ring, never as a missing bar.
  const zeros = [...drawing(f).querySelectorAll('circle[data-bar^="y-"]')].map(node => node.getAttribute('data-bar'));
  assert.deepEqual(zeros, b.flatMap((o, i) => (o.z < 0 ? [`y-${i}`] : [])));
  const columnBars = [...drawing(f).querySelectorAll('[data-bar^="x-"]')].map(node => Number(node.getAttribute('data-length')));
  assert.deepEqual(columnBars, k.columns[1]);
});

test('pixel skewer: the weights are withheld while the caption asks for them', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (let step = 0; step < (scene.beats[3] - scene.beats[2]) * 10; step++) {
    const time = scene.beats[2] + step / 10;
    f.seek(time);
    assert.equal(mark(f, 'weights'), null, `W drawn at ${time}s`);
    assert.equal(value(f, 'bill'), null, `the bill drawn at ${time}s`);
    const said = f.$('[data-figure] svg').getAttribute('aria-label') + f.$('[data-out-slider]').getAttribute('aria-valuetext');
    assert.doesNotMatch(said, /272|parameters|rows of/, `the count is spoken at ${time}s`);
  }
  assert.match(f.$('[data-caption]').textContent, /How many weights/);
  f.seek(scene.beats[3] + 1);
  assert.equal(mark(f, 'weights').getAttribute('data-rows'), '16');
});

test('pixel skewer: another pixel, and every pixel, run through the very same W', t => {
  const f = fixture(t, NAME), k = declared(f); f.load(); f.open();
  f.seek(scene.beats[4] - 0.01);
  const first = weightsMarkup(f);
  assert(first, 'W is drawn once the first pixel is done');
  assert.equal(f.root.dataset.spot, `${k.spots[0].r} ${k.spots[0].c}`);
  f.seek(scene.beats[4] + 1);
  assert.notEqual(f.root.dataset.spot, `${k.spots[0].r} ${k.spots[0].c}`, 'the skewer is gliding');
  f.seek(scene.beats[5] - 0.01);
  assert.equal(f.root.dataset.spot, `${k.spots[1].r} ${k.spots[1].c}`);
  assert.equal(weightsMarkup(f), first, 'the second pixel reads the same W, untouched');
  assert.equal(f.root.dataset.written, '2');
  // The sweep: the skewer visits pixels in reading order and the written area grows while
  // W stays exactly as it was.
  let before = 2;
  for (const offset of [1, 2, 3, 4]) {
    f.seek(scene.beats[5] + offset);
    const now = Number(f.root.dataset.written);
    assert(now > before, `the output fills during the sweep (${now} after ${before})`);
    assert.equal(weightsMarkup(f), first);
    before = now;
  }
  f.seek(scene.beats[6] - 0.01);
  assert.equal(f.root.dataset.written, String(k.n * k.n));
  assert.equal(f.root.dataset.spot, `${k.spots[1].r} ${k.spots[1].c}`, 'the sweep ends where it began');
  assert.equal(value(f, 'pixels').textContent, `the same W at all ${k.n * k.n} pixels`);
  assert.equal(value(f, 'bill').textContent, `${k.cin} × ${k.own} + ${k.own} = ${k.cin * k.own + k.own} parameters`);
});

test('pixel skewer: one column lies under the skewer, and it is the pixel\'s own', t => {
  const f = fixture(t, NAME), k = declared(f); f.load(); f.open();
  f.seek(scene.beats[2] + 1);
  const beads = [...drawing(f).querySelectorAll('[data-mark^="bead-in-"]')];
  assert.equal(beads.length, k.cin, 'sixteen beads, one per channel');
  const pixel = mark(f, 'skewer-in-pixel'), front = mark(f, 'input-box');
  const s = attr(front, 'width') / k.n;
  assert.equal(Math.round((attr(pixel, 'x') + 1.2 - attr(front, 'x')) / s), k.spots[0].c);
  assert.equal(Math.round((attr(pixel, 'y') + 1.2 - attr(front, 'y')) / s), k.spots[0].r);
  // Zero channel values are open beads.
  const open = beads.filter(node => node.getAttribute('class').includes('is-zero')).length;
  assert.equal(open, k.columns[0].filter(v => v === 0).length);
});

test('pixel skewer: the output depth is the dial, and height and width never change', t => {
  const f = fixture(t, NAME), k = declared(f); f.load(); f.open();
  const seen = new Set();
  for (let time = scene.beats[6]; time <= scene.duration + 1e-9; time += 0.1) {
    f.seek(Number(time.toFixed(2)));
    const depth = Number(f.root.dataset.depth);
    seen.add(depth);
    assert.equal(mark(f, 'weights').getAttribute('data-rows'), String(depth), 'W has one row per output channel');
    assert.equal(Number(mark(f, 'output-box').getAttribute('data-depth')), depth);
    assert.equal(attr(mark(f, 'output-box'), 'width'), attr(mark(f, 'input-box'), 'width'), 'the map keeps its size');
    assert.equal(value(f, 'out-shape').textContent, `${depth} × ${k.n} × ${k.n}`);
    assert.equal(value(f, 'bill').textContent, `${k.cin} × ${depth} + ${depth} = ${k.cin * depth + depth} parameters`);
    assert.equal(f.$('[data-out-slider]').value, String(depth));
  }
  for (const c of [k.own, ...k.sweep]) assert(seen.has(c), `the timeline visits ${c} output channels`);
  f.seek(scene.duration);
  assert.equal(f.root.dataset.depth, String(k.own), 'and comes home to the chapter\'s 16');
});

test('pixel skewer: dragging the dial is a detour that the timeline ends', t => {
  const f = fixture(t, NAME), k = declared(f); f.load(); f.open();
  const slider = f.$('[data-out-slider]');
  f.seek(scene.beats[3] + 1); f.play(); assert(f.playing);
  slider.value = '4'; slider.dispatchEvent(new f.w.Event('input'));
  assert(!f.playing, 'dragging pauses');
  assert.equal(f.root.dataset.override, 'dial');
  assert.equal(mark(f, 'weights').getAttribute('data-rows'), '4');
  assert.equal(value(f, 'bill').textContent, `${k.cin} × 4 + 4 = ${k.cin * 4 + 4} parameters`);
  assert.match(slider.getAttribute('aria-valuetext'), /4 output channels\. The layer squeezes 16 channels to 4 at every pixel, with 68 parameters/);
  assert.match(f.$('[data-caption]').textContent, /68 parameters/);
  // A key the transport ignores leaves the detour alone; a scrub ends it.
  f.key('x');
  assert.equal(f.root.dataset.override, 'dial');
  f.seek(scene.beats[3] + 1);
  assert.equal(f.root.dataset.override, '');
  assert.equal(f.root.dataset.depth, String(k.own));
  // Keys on the slider never reach the pane's beat seeking.
  const time = f.time;
  f.key('ArrowRight', slider);
  assert.equal(f.time, time);
});

test('pixel skewer: reduced motion holds each beat\'s finished state', t => {
  const f = fixture(t, NAME, {reduced: true}); f.load(); f.open();
  const seen = scene.beats.map(beat => { f.seek(beat); return [f.root.dataset.depth, f.root.dataset.written, f.root.dataset.spot].join('/'); });
  assert.deepEqual(seen, ['16/0/10 8', '16/0/10 8', '16/0/10 8', '16/1/10 8', '16/2/10 19', '16/784/10 19', '32/784/10 19', '16/784/10 19']);
});

test('pixel skewer: every layout keeps its text inside the picture and off its neighbours', t => {
  for (const width of WIDTHS) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    for (const time of [...scene.beats, ...scene.beats.map(b => b + 0.6), ...scene.beats.map(b => b + 2.5), ...scene.beats.map(b => b + 4.99), scene.duration]) {
      f.seek(Math.min(time, scene.duration));
      const [, , boxWidth, boxHeight] = f.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/).map(Number);
      const boxes = texts(f).map(node => {
        const size = Number(node.getAttribute('font-size')), anchor = node.getAttribute('text-anchor');
        const w = node.textContent.length * size * 0.56, x = attr(node, 'x'), y = attr(node, 'y');
        const left = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
        return {left, right: left + w, top: y - size, bottom: y + size * 0.3, text: node.textContent};
      });
      for (const box of boxes) {
        assert(box.left >= -1 && box.right <= boxWidth + 1, `at ${width}px, ${time}s "${box.text}" runs outside the picture`);
        assert(box.top >= -1 && box.bottom <= boxHeight + 1, `at ${width}px, ${time}s "${box.text}" runs off the top or bottom`);
      }
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        const over = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const down = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        assert(over <= 1 || down <= 1, `at ${width}px, ${time}s "${a.text}" and "${b.text}" collide`);
      }
    }
  }
});

test('pixel skewer: every mark stays inside the picture at the deepest dial setting', t => {
  for (const width of [296, 713]) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    const slider = f.$('[data-out-slider]');
    slider.value = '32'; slider.dispatchEvent(new f.w.Event('input'));
    const [, , boxWidth, boxHeight] = f.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/).map(Number);
    const out = mark(f, 'output-box'), depth = Number(out.getAttribute('data-depth'));
    const d = width < 600 ? [2, -1.4] : [3, -2.1];
    assert(attr(out, 'x') + attr(out, 'width') + depth * d[0] <= boxWidth, `the deepest output stack fits across at ${width}px`);
    assert(attr(out, 'y') + depth * d[1] >= 0, `and below the top at ${width}px`);
    const frame = mark(f, 'w-frame');
    assert(attr(frame, 'y') + attr(frame, 'height') <= boxHeight, `W's last row fits at ${width}px`);
    for (const node of drawing(f).querySelectorAll('rect')) {
      assert(attr(node, 'x') >= 0 && attr(node, 'x') + attr(node, 'width') <= boxWidth + 0.5, `a rect runs outside at ${width}px`);
    }
  }
});

test('pixel skewer: seeking is deterministic', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const snapshot = time => { f.seek(time); return canonicalMarkup(drawing(f).innerHTML); };
  const times = [0, 7, 12, 17.5, 18.8, 21, 23.7, 27, 31, 33, 36, 39];
  const forward = times.map(snapshot);
  const backward = [...times].reverse().map(snapshot).reverse();
  assert.deepEqual(forward, backward);
});

test('pixel skewer: the panel is the one fixture copy', t => {
  const g = fixture(t, NAME);
  const k = declared(g);
  // Flip the sign of the first weight row: the first output at the second pixel changes.
  const w = [...k.w]; for (let c = 0; c < k.cin; c++) w[c] = -w[c];
  g.root.dataset.weights = w.join(' ');
  g.load(); g.open(); g.seek(scene.duration);
  const moved = layer({...k, w}, k.columns[1], 1)[0].y;
  assert.notEqual(moved, layer(k, k.columns[1], 1)[0].y);
  assert.equal(Number(drawing(g).querySelector('[data-bar="y-0"]').getAttribute('data-length')), moved);
});

test('pixel skewer: the committed static print is a fresh render of the final frame', async () => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after, 'run scripts/render_static_frames.cjs pixel-skewer');
});

test('pixel skewer: typography and inertness', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (const time of [...scene.beats, scene.duration]) {
    f.seek(time);
    for (const node of texts(f)) {
      assert.doesNotMatch(node.textContent, /\de[-+]\d|(?<!\w)-\d|\^|\bexp\(/, `bad typography in "${node.textContent}"`);
    }
  }
  const player = read('pixel-skewer/player.js');
  assert.doesNotMatch(player, /Math\.random|fetch\(|import\(|setInterval\(/);
  assert.doesNotMatch(read('pixel-skewer/panel.html'), /@eq-|—/);
  assert.equal((player.match(/getBoundingClientRect/g) || []).length, 1);
});

test('integration: the excerpt is HTML-only and follows the 1 x 1 paragraph', () => {
  const filter = fs.readFileSync(path.join(ROOT, scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
  assert.doesNotMatch(filter, /pixel-skewer|nonlinearity/);
  assert.match(filter, /Para = function\(para\)\n\s+if is_anchor\(scene, para\) then\n\s+inserted = inserted \+ 1\n\s+return \{para, block\}/);
  const config = fs.readFileSync(path.join(ROOT, '_quarto.yml'), 'utf8');
  assert.match(config, /^\s+- interactives\/pixel-skewer\/player\.js$/m);
  const chapter = chapterSource(NAME), prose = chapter.split(/\s+/).join(' ');
  assert.equal(scene.anchor.type, 'after-paragraph');
  assert.equal(prose.split(scene.anchor.target).length, 2, 'the target names one paragraph');
  assert.doesNotMatch(scene.anchor.target, /[*_`$\\[\]]/);
  // It follows the paragraph that introduces the 1 x 1 kernel and precedes NiN.
  const at = prose.indexOf(scene.anchor.target);
  assert(prose.indexOf('A $1 \\times 1$ kernel does no spatial mixing at all') < at);
  assert(at < prose.indexOf('That tool enables the **Network-in-Network** design'));
});
