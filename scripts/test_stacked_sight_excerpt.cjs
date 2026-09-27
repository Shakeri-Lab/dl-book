#!/usr/bin/env node
// Test-only checks for the Chapter 9 stacked-kernels scene. Nothing here ships. The suite
// recomputes the receptive field as the union of the nine hidden pixels' windows, the
// weight counts from the declared kernel sizes, and the totals the cell prints at C = 32.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, canonicalMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'stacked-sight-excerpt', scene = entry(NAME);
const drawing = f => f.$('[data-drawing]');
const value = (f, name) => drawing(f).querySelector(`[data-value="${name}"]`);
const mark = (f, name) => drawing(f).querySelector(`[data-mark="${name}"]`);
const declared = f => ({k: Number(f.root.dataset.small), l: Number(f.root.dataset.large), c: Number(f.root.dataset.channels), crop: Number(f.root.dataset.crop)});

registerTransportTests(NAME, {witness: /18,496 parameters/, anchors: ['stacked-sight-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('stacked sight: the kernels and width are the kernel-economics cell\'s', t => {
  const f = fixture(t, NAME), d = declared(f), chapter = chapterSource(NAME);
  assert(chapter.includes(`C = ${d.c}\n`));
  assert(chapter.includes(`one_5x5 = nn.Conv2d(C, C, ${d.l}, padding=2)`));
  assert(chapter.includes(`two_3x3 = nn.Sequential(nn.Conv2d(C, C, ${d.k}, padding=1), nn.ReLU(),`));
  assert(chapter.includes(`nn.Conv2d(C, C, ${d.k}, padding=1))`));
  // The totals the cell prints (frozen): torch counts weights and biases.
  assert.equal(2 * (d.k ** 2 * d.c ** 2 + d.c), 18496);
  assert.equal(d.l ** 2 * d.c ** 2 + d.c, 25632);
  assert.equal(Math.round(100 * (1 - 2 * d.k ** 2 / d.l ** 2)), 28);
});

test('stacked sight: the union of the hidden pixels\' windows is exactly the single kernel\'s patch', t => {
  const f = fixture(t, NAME), d = declared(f); f.load(); f.open();
  f.seek(scene.beats[2] + 4.99);
  assert.equal(f.root.dataset.swept, '9');
  const seen = mark(f, 'seen-1');
  assert.equal(Number(seen.getAttribute('data-count')), d.l * d.l, 'nine 3 x 3 windows cover 25 pixels');
  f.seek(scene.beats[4]);
  assert.equal(mark(f, 'seen-1').getAttribute('data-count'), mark(f, 'seen-2').getAttribute('data-count'), 'the same number of input pixels');
  const box = name => { const node = mark(f, name); return ['x', 'width'].map(k => node.getAttribute(k)).join(' '); };
  assert.equal(box('field-1'), box('field-2'), 'the two footprints sit at the same place on their inputs');
  assert.equal(value(f, 'field-stack').textContent, `input, ${d.l} × ${d.l} seen`);
  // During the sweep the union grows window by window.
  let before = 0;
  for (const dt of [0.6, 1.4, 2.2, 3, 3.8]) {
    f.seek(scene.beats[2] + dt);
    const now = Number(mark(f, 'seen-1').getAttribute('data-count'));
    assert(now > before, `${now} after ${before}`); before = now;
  }
});

test('stacked sight: the field and the count are withheld while the captions ask', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (let step = 0; step < 100; step++) {
    f.seek(step / 10);
    assert.equal(value(f, 'field-stack'), null, `field shown at ${step / 10}s`);
    assert.doesNotMatch(f.$('[data-figure] svg').getAttribute('aria-label'), /5 by 5/);
  }
  for (let step = 0; step < 50; step++) {
    f.seek(scene.beats[4] + step / 10);
    assert.equal(value(f, 'pair-stack'), null); assert.equal(value(f, 'pair-one'), null);
    assert.equal(f.root.dataset.counted, '0');
    assert.doesNotMatch(f.$('[data-figure] svg').getAttribute('aria-label'), /weights per channel pair/);
  }
});

test('stacked sight: the squares are counted, and the totals match the cell', t => {
  const f = fixture(t, NAME); f.load(); f.open(); f.seek(scene.duration);
  assert.equal(drawing(f).querySelectorAll('.sgt-weight').length, 9 + 9 + 25);
  assert.equal(drawing(f).querySelectorAll('.sgt-weight.is-counted').length, 9 + 9 + 25);
  assert.equal(value(f, 'pair-stack').textContent, '9 + 9 = 18 per channel pair');
  assert.equal(value(f, 'pair-one').textContent, '25 per channel pair');
  assert.equal(value(f, 'total-stack').textContent, 'C = 32: 18,496 parameters');
  assert.equal(value(f, 'total-one').textContent, 'C = 32: 25,632 parameters');
  assert.equal(value(f, 'saving').textContent, '18 C² versus 25 C²: 28% fewer weights');
  assert.equal(value(f, 'relu-stack').textContent, '2 ReLUs');
  // Mid-count, the stack's eighteen run out while the single kernel keeps counting.
  f.seek(scene.beats[5] + 2.8);
  const counted = Number(f.root.dataset.counted);
  assert(counted > 18 && counted < 25, `counted ${counted}`);
  assert.equal(drawing(f).querySelectorAll('[data-mark="kernel-a"], [data-mark="kernel-b"]').length, 2);
});

test('stacked sight: text stays inside the picture and off its neighbours', t => {
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

test('stacked sight: seeking is deterministic', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const snap = time => { f.seek(time); return canonicalMarkup(drawing(f).innerHTML); };
  const times = [0, 7, 12, 13.5, 17, 22, 27.5, 33, 39];
  assert.deepEqual(times.map(snap), [...times].reverse().map(snap).reverse());
});

test('stacked sight: the committed static print is a fresh render of the final frame', async () => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after, 'run scripts/render_static_frames.cjs stacked-sight');
});

test('stacked sight: typography and inertness', () => {
  const player = read('stacked-sight/player.js');
  assert.doesNotMatch(player, /Math\.random|fetch\(|import\(|setInterval\(/);
  assert.doesNotMatch(read('stacked-sight/panel.html'), /@eq-|—/);
  assert.equal((player.match(/getBoundingClientRect/g) || []).length, 1);
});

test('integration: the excerpt follows the stacking paragraph and precedes the cell', () => {
  const config = fs.readFileSync(path.join(ROOT, '_quarto.yml'), 'utf8');
  assert.match(config, /^\s+- interactives\/stacked-sight\/player\.js$/m);
  const prose = chapterSource(NAME).split(/\s+/).join(' ');
  assert.equal(scene.anchor.type, 'after-paragraph');
  assert.equal(prose.split(scene.anchor.target).length, 2);
  const at = prose.indexOf(scene.anchor.target);
  assert(prose.indexOf('## Question 1:') < at && at < prose.indexOf('#| label: kernel-economics'));
});
