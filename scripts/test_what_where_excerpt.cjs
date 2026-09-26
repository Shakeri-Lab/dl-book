#!/usr/bin/env node
// Test-only checks for the Chapter 8 channels-and-pooling scene. Nothing here ships. The
// suite rebuilds the chapter's two edge reports from the declared square and kernel,
// pools each on its own, and reads the maps, the probe and the readout back out of the
// SVG: the claim is about which axis each operation touches.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, canonicalMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'what-where-excerpt', scene = entry(NAME);
const WIDTHS = [296, 360, 375, 480, 560, 599, 600, 713, 900];
const attr = (node, key) => Number(node.getAttribute(key));
const drawing = f => f.$('[data-drawing]');
const texts = f => [...drawing(f).querySelectorAll('text')];
const value = (f, name) => drawing(f).querySelector(`[data-value="${name}"]`);
const mark = (f, name) => drawing(f).querySelector(`[data-mark="${name}"]`);

const declared = f => {
  const d = f.root.dataset, [s0, s1] = numbers(d.square), p = numbers(d.probes);
  return {n: Number(d.size), s0, s1, kv: numbers(d.kernel), pool: Number(d.pool),
    probes: [0, 1, 2].map(k => ({r: p[2 * k], c: p[2 * k + 1]}))};
};
const reports = k => {
  const x = (r, c) => (r >= k.s0 && r < k.s1 && c >= k.s0 && c < k.s1 ? 1 : 0);
  const kh = [0, 1, 2].flatMap(b => [0, 1, 2].map(a => k.kv[3 * a + b]));
  const conv = w => Array.from({length: k.n}, (_, r) => Array.from({length: k.n}, (_, c) => {
    let s = 0;
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
      const rr = r - 1 + a, cc = c - 1 + b;
      if (rr >= 0 && rr < k.n && cc >= 0 && cc < k.n) s += w[3 * a + b] * x(rr, cc);
    }
    return Math.abs(s);
  }));
  return [conv(k.kv), conv(kh)];
};
const pool = (map, p) => Array.from({length: map.length / p}, (_, i) => Array.from({length: map.length / p}, (_, j) => {
  let best = -Infinity;
  for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) best = Math.max(best, map[p * i + a][p * j + b]);
  return best;
}));

registerTransportTests(NAME, {witness: /2 × 14 × 14/, anchors: ['what-where-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('what where: the square, kernel and pool are the chapter\'s', t => {
  const f = fixture(t, NAME), k = declared(f), chapter = chapterSource(NAME);
  assert(chapter.includes(`square[${k.s0}:${k.s1}, ${k.s0}:${k.s1}] = 1.0`));
  assert(chapter.includes(`sobel_v = torch.tensor([[${k.kv.slice(0, 3).map(v => `${v}.`).join(', ')}], [${k.kv.slice(3, 6).map(v => `${v}.`).join(', ')}], [${k.kv.slice(6).map(v => `${v}.`).join(', ')}]])`));
  assert(chapter.includes('square = torch.zeros(28, 28)') && k.n === 28);
  assert(chapter.includes('experts = torch.cat([v, h], dim=1)              # (1, 2, 28, 28): two reports'));
  assert(chapter.includes(`x = F.max_pool2d(F.relu(self.conv1(x)), ${k.pool})   # -> (N, 6, 14, 14)`));
});

test('what where: the reports and their pooled versions carry the readings the panel prints', t => {
  const f = fixture(t, NAME), k = declared(f), [v, h] = reports(k);
  assert.deepEqual([...new Set(v.flat())].sort(), [0, 1, 3, 4]);
  const [side, top, corner] = k.probes;
  assert.deepEqual([v[side.r][side.c], h[side.r][side.c]], [4, 0]);
  assert.deepEqual([v[top.r][top.c], h[top.r][top.c]], [0, 4]);
  assert.deepEqual([v[corner.r][corner.c], h[corner.r][corner.c]], [3, 3]);
  const [pv, ph] = [pool(v, k.pool), pool(h, k.pool)];
  const block = p => [Math.floor(p.r / k.pool), Math.floor(p.c / k.pool)];
  const [si, sj] = block(side), [ti, tj] = block(top);
  assert.deepEqual([pv[si][sj], ph[si][sj]], [4, 0], 'pooled map by map, the side stays vertical');
  assert.deepEqual([pv[ti][tj], ph[ti][tj]], [0, 4], 'and the top stays horizontal');
  // The counterfactual: one maximum across the two maps cannot tell them apart.
  assert.equal(Math.max(pv[si][sj], ph[si][sj]), Math.max(pv[ti][tj], ph[ti][tj]));
  // The detectives really are orientation-selective, so the distinction is theirs.
  assert(v.every(row => row.every((x, c) => x === 0 || c === 6 || c === 7 || c === 20 || c === 21)));
});

test('what where: one window writes both maps, then one pooling window per map, in step', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  f.seek(scene.beats[1] + 2);
  const written = Number(f.root.dataset.written);
  assert(written > 0 && written < 784, 'the maps are being written, not revealed');
  assert(mark(f, 'conv-window'), 'the conv window is on the input');
  f.seek(scene.beats[3] + 2);
  const [w0, w1] = [mark(f, 'pool-window-0'), mark(f, 'pool-window-1')];
  assert(w0 && w1, 'a pooling window in each map');
  const m0 = mark(f, 'map-vertical'), m1 = mark(f, 'map-horizontal');
  assert.equal(attr(w0, 'x') - attr(m0, 'x'), attr(w1, 'x') - attr(m1, 'x'), 'the two windows move in step');
  assert.equal(attr(w0, 'y') - attr(m0, 'y'), attr(w1, 'y') - attr(m1, 'y'));
  // Pooled maps are half as wide as the maps they came from.
  f.seek(scene.duration);
  assert.equal(attr(mark(f, 'pooled-vertical'), 'width') * 2, attr(m0, 'width'));
});

test('what where: the probe reads one spot through the stack', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const expected = [['14 7', '4', '0'], ['7 14', '0', '4'], ['7 7', '3', '3']];
  expected.forEach(([spot, a, b], k) => {
    f.seek(scene.beats[2] + (k + 0.5) * 5 / 3);
    assert.equal(f.root.dataset.spot, spot);
    assert.equal(value(f, 'spot-0').textContent, a);
    assert.equal(value(f, 'spot-1').textContent, b);
    // The probe sits at the same place in both maps.
    const p0 = mark(f, 'probe-0'), p1 = mark(f, 'probe-1');
    assert.equal(attr(p0, 'x') - attr(mark(f, 'map-vertical'), 'x'), attr(p1, 'x') - attr(mark(f, 'map-horizontal'), 'x'));
  });
});

test('what where: the pooled readings are withheld while the caption asks for them', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (const time of [scene.beats[4], scene.beats[4] + 2.5, scene.beats[5] - 0.01]) {
    f.seek(time);
    for (const name of ['pooled-side-0', 'pooled-side-1', 'pooled-top-0', 'pooled-top-1'])
      assert.equal(value(f, name).textContent, '·', `${name} is shown at ${time}s`);
    assert.equal(value(f, 'across-side'), null, 'and the counterfactual waits');
  }
  f.seek(scene.beats[5] + 4.99);
  assert.deepEqual(['pooled-side-0', 'pooled-side-1', 'pooled-top-0', 'pooled-top-1'].map(n => value(f, n).textContent), ['4', '0', '0', '4']);
  assert.equal(value(f, 'across-side').textContent, '4');
  assert.equal(value(f, 'across-top').textContent, '4');
  assert(value(f, 'across-side').getAttribute('class').includes('ww-ghost'), 'the counterfactual is struck');
});

test('what where: the ledger says which axis each operation changed', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  f.seek(scene.beats[6] - 0.01);
  assert.equal(value(f, 'shape-0'), null);
  f.seek(scene.duration);
  assert.deepEqual([0, 1, 2].map(k => value(f, `shape-${k}`).textContent), ['1 × 28 × 28', '2 × 28 × 28', '2 × 14 × 14']);
});

test('what where: reduced motion holds each beat\'s finished state', t => {
  const f = fixture(t, NAME, {reduced: true}); f.load(); f.open();
  const seen = scene.beats.map(beat => { f.seek(beat); return [f.root.dataset.written, f.root.dataset.pooled, f.root.dataset.spot].join('/'); });
  assert.deepEqual(seen, ['0/0/', '784/0/', '784/0/7 7', '784/196/', '784/196/', '784/196/', '784/196/', '784/196/']);
});

test('what where: every layout keeps its text inside the picture and off its neighbours', t => {
  for (const width of WIDTHS) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    for (const time of [...scene.beats, ...scene.beats.map(b => b + 4.99), scene.duration]) {
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

test('what where: seeking is deterministic', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const snapshot = time => { f.seek(time); return canonicalMarkup(drawing(f).innerHTML); };
  const forward = [0, 7, 12, 17, 23, 28, 33, 39].map(snapshot);
  const backward = [39, 33, 28, 23, 17, 12, 7, 0].map(snapshot).reverse();
  assert.deepEqual(forward, backward);
});

test('what where: the panel is the one fixture copy', t => {
  const g = fixture(t, NAME);
  g.root.dataset.square = '6 22';
  g.load(); g.open(); g.seek(scene.duration);
  assert(drawing(g).textContent.includes('2 × 14 × 14'));
  const [v] = reports(declared(g));
  assert.equal(v[14][6], 4, 'the moved square moves the side');
});

test('what where: the committed static print is a fresh render of the final frame', async () => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after, 'run scripts/render_static_frames.cjs what-where');
});

test('what where: typography and inertness', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (const time of [...scene.beats, scene.duration]) {
    f.seek(time);
    for (const node of texts(f)) {
      assert.doesNotMatch(node.textContent, /\de[-+]\d|(?<!\w)-\d|\^|\bexp\(/, `bad typography in "${node.textContent}"`);
    }
  }
  const player = read('what-where/player.js');
  assert.doesNotMatch(player, /Math\.random|fetch\(|import\(|setInterval\(/);
  assert.doesNotMatch(read('what-where/panel.html'), /@eq-|—/);
  assert.equal((player.match(/getBoundingClientRect/g) || []).length, 1);
});

test('integration: the excerpt is HTML-only and sits before LeNet', () => {
  const filter = fs.readFileSync(path.join(ROOT, scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
  assert.doesNotMatch(filter, /what-where|LeNet/);
  const config = fs.readFileSync(path.join(ROOT, '_quarto.yml'), 'utf8');
  assert.match(config, /^\s+- interactives\/what-where\/player\.js$/m);
  const chapter = chapterSource(NAME);
  assert.equal(scene.anchor.type, 'before-heading');
  assert.equal(chapter.split('\n').filter(line => line === `## ${scene.anchor.target}`).length, 1);
  assert(chapter.indexOf('## Pooling: trading exact location') < chapter.indexOf(`## ${scene.anchor.target}`));
  assert(chapter.indexOf('#| label: corner-detector-values') < chapter.indexOf(`## ${scene.anchor.target}`));
});
