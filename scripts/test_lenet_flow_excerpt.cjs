#!/usr/bin/env node
// Test-only checks for the Chapter 8 LeNet shape scene. Nothing here ships. The suite
// recomputes every shape from the panel's declared layers with the output-size formula,
// checks each against the lenet cell's own shape comments, and reads the picture back.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, canonicalMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'lenet-flow-excerpt', scene = entry(NAME);
const drawing = f => f.$('[data-drawing]');
const value = (f, name) => drawing(f).querySelector(`[data-value="${name}"]`);
const size = (n, k, p, s) => Math.floor((n + 2 * p - k) / s) + 1;
const shapes = f => {
  const d = f.root.dataset, [c0, n0] = numbers(d.input), cv = numbers(d.convs), pool = Number(d.pool), head = numbers(d.head);
  const n1 = size(n0, cv[1], cv[2], 1), n2 = size(n1, pool, 0, pool), n3 = size(n2, cv[4], cv[5], 1), n4 = size(n3, pool, 0, pool);
  return [`${c0} × ${n0} × ${n0}`, `${cv[0]} × ${n1} × ${n1}`, `${cv[0]} × ${n2} × ${n2}`, `${cv[3]} × ${n3} × ${n3}`,
    `${cv[3]} × ${n4} × ${n4}`, String(cv[3] * n4 * n4), ...head.map(String)];
};

registerTransportTests(NAME, {witness: /10 logits/, anchors: ['lenet-flow-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('lenet flow: every shape agrees with the lenet cell\'s comments', t => {
  const f = fixture(t, NAME), s = shapes(f), chapter = chapterSource(NAME);
  assert.deepEqual(s, ['1 × 28 × 28', '6 × 28 × 28', '6 × 14 × 14', '16 × 10 × 10', '16 × 5 × 5', '400', '120', '84', '10']);
  for (const comment of ['(N,1,28,28)->(N,6,28,28)', '(N,6,14,14)->(N,16,10,10)', '-> (N, 6, 14, 14)', '-> (N, 16, 5, 5)', '-> (N, 400)'])
    assert(chapter.includes(comment), comment);
  assert(chapter.includes('nn.Conv2d(1, 6, 5, padding=2)') && chapter.includes('nn.Conv2d(6, 16, 5)'));
  assert(chapter.includes('nn.Linear(16 * 5 * 5, 120)') && chapter.includes('nn.Linear(120, 84)') && chapter.includes('nn.Linear(84, 10)'));
});

test('lenet flow: each beat adds the tensor its layer makes', t => {
  const f = fixture(t, NAME), s = shapes(f); f.load(); f.open();
  const expected = {0: 1, 1: 2, 2: 3, 3: 3, 4: 4, 5: 5, 6: 9, 7: 9};
  for (const [stage, count] of Object.entries(expected)) {
    f.seek(scene.beats[stage] + 4.99);
    assert.equal(f.root.dataset.shapes, s.slice(0, count).join(', '), `beat ${stage}`);
  }
  f.seek(scene.duration);
  s.slice(0, 8).forEach((shape, i) => assert.equal(value(f, `shape-${i}`).textContent, shape));
  assert.equal(value(f, 'shape-8').textContent, '10 logits');
  assert.equal(value(f, 'where').textContent, 'size: 28 → 28 → 14 → 10 → 5');
  assert.equal(value(f, 'what').textContent, 'depth: 1 → 6 → 6 → 16 → 16');
});

test('lenet flow: conv2\'s size is withheld while the caption asks', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (let step = 0; step < 50; step++) {
    f.seek(scene.beats[3] + step / 10);
    assert.equal(value(f, 'shape-3').textContent, '16 × · × ·');
    assert(value(f, 'size-line').textContent.endsWith('= ·'));
    assert.doesNotMatch(f.$('[data-figure] svg').getAttribute('aria-label') + f.root.dataset.shapes, /10 × 10/);
    assert.equal(drawing(f).querySelector('[data-mark="tensor-3"]'), null);
  }
  f.seek(scene.beats[4] + 4);
  assert.equal(value(f, 'size-line').textContent, 'size: ⌊(14 + 0 − 5) / 1⌋ + 1 = 10');
});

test('lenet flow: depth is the kernel count, and the boxes are drawn to scale', t => {
  const f = fixture(t, NAME); f.load(); f.open(); f.seek(scene.duration);
  const depth = i => Number(drawing(f).querySelector(`[data-mark="tensor-${i}"]`).getAttribute('data-depth'));
  const side = i => Number(drawing(f).querySelector(`[data-mark="tensor-${i}"]`).getAttribute('width'));
  assert.deepEqual([0, 1, 2, 3, 4].map(depth), [1, 6, 6, 16, 16]);
  assert.deepEqual([0, 1, 2, 3, 4].map(side).map(w => w / side(0) * 28), [28, 28, 14, 10, 5]);
  assert.equal(value(f, 'learned-1').textContent, '6 kernels');
  assert.equal(value(f, 'learned-3').textContent, '16 kernels');
  assert.equal(value(f, 'learned-6').textContent, '120 × 400');
});

test('lenet flow: text stays inside the picture and off its neighbours', t => {
  for (const width of [296, 375, 599, 600, 713, 900]) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    for (const time of [...scene.beats, ...scene.beats.map(b => b + 2.5), ...scene.beats.map(b => b + 4.99), scene.duration]) {
      f.seek(Math.min(time, scene.duration));
      const [, , W, H] = f.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/).map(Number);
      const boxes = [...drawing(f).querySelectorAll('text')].map(node => {
        const sz = Number(node.getAttribute('font-size')), anchor = node.getAttribute('text-anchor');
        const w = node.textContent.length * sz * 0.56, x = Number(node.getAttribute('x')), y = Number(node.getAttribute('y'));
        const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
        return {left, right: left + w, top: y - sz, bottom: y + sz * 0.3, text: node.textContent};
      });
      for (const b of boxes) assert(b.left >= -1 && b.right <= W + 1 && b.top >= -1 && b.bottom <= H + 1, `${width}px ${time}s "${b.text}" outside`);
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        assert(Math.min(a.right, b.right) - Math.max(a.left, b.left) <= 1 || Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) <= 1,
          `${width}px ${time}s "${a.text}" and "${b.text}" collide`);
      }
    }
  }
});

test('lenet flow: seeking is deterministic', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const snap = time => { f.seek(time); return canonicalMarkup(drawing(f).innerHTML); };
  const times = [0, 7, 12, 17, 22, 27, 31, 33, 39];
  assert.deepEqual(times.map(snap), [...times].reverse().map(snap).reverse());
});

test('lenet flow: the committed static print is a fresh render of the final frame', async () => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after, 'run scripts/render_static_frames.cjs lenet-flow');
});

test('lenet flow: typography and inertness', () => {
  const player = read('lenet-flow/player.js');
  assert.doesNotMatch(player, /Math\.random|fetch\(|import\(|setInterval\(/);
  assert.doesNotMatch(read('lenet-flow/panel.html'), /@eq-|—/);
  assert.equal((player.match(/getBoundingClientRect/g) || []).length, 1);
});

test('integration: the excerpt follows LeNet\'s rhythm paragraph and precedes its code', () => {
  const config = fs.readFileSync(path.join(ROOT, '_quarto.yml'), 'utf8');
  assert.match(config, /^\s+- interactives\/lenet-flow\/player\.js$/m);
  const prose = chapterSource(NAME).split(/\s+/).join(' ');
  assert.equal(scene.anchor.type, 'after-paragraph');
  assert.equal(prose.split(scene.anchor.target).length, 2);
  const at = prose.indexOf(scene.anchor.target);
  assert(prose.indexOf('## LeNet: the whole machine') < at && at < prose.indexOf('#| label: lenet'));
});
