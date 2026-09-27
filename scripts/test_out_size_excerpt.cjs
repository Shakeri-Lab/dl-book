#!/usr/bin/env node
// Test-only checks for the Chapter 8 output-size scene. Nothing here ships. The suite
// recomputes every count from the panel's declared n, k and regimes and reads the stops,
// the ruler and the printed counts back out of the SVG.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, canonicalMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'out-size-excerpt', scene = entry(NAME);
const drawing = f => f.$('[data-drawing]');
const value = (f, name) => drawing(f).querySelector(`[data-value="${name}"]`);
const declared = f => {
  const d = f.root.dataset, r = numbers(d.regimes);
  return {n: Number(d.n), k: Number(d.k), regimes: [0, 1, 2].map(i => ({p: r[2 * i], s: r[2 * i + 1]}))};
};
const count = (k, g) => Math.floor((k.n + 2 * g.p - k.k) / g.s) + 1;

registerTransportTests(NAME, {witness: /= 4/, anchors: ['out-size-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('out size: the fixture is the shapes cell\'s', t => {
  const f = fixture(t, NAME), k = declared(f), chapter = chapterSource(NAME);
  assert(chapter.includes(`x8 = torch.randn(1, 1, ${k.n}, ${k.n})`));
  assert(chapter.includes(`torch.randn(1, 1, ${k.k}, ${k.k})`));
  assert(chapter.includes(`for p, s in [${k.regimes.map(g => `(${g.p}, ${g.s})`).join(', ')}]:`));
  assert.deepEqual(k.regimes.map(g => count(k, g)), [6, 8, 4]);
});

test('out size: each regime writes exactly its count of outputs, one per stop', t => {
  const f = fixture(t, NAME), k = declared(f); f.load(); f.open();
  [[1, 0], [3, 1], [5, 2]].forEach(([stage, r]) => {
    f.seek(scene.beats[stage] + 4.9);
    assert.equal(Number(f.root.dataset.written), count(k, k.regimes[r]));
    assert.equal(drawing(f).querySelectorAll('[data-mark="tick"]').length, count(k, k.regimes[r]) - 1, 'one tick per hop');
    assert.equal(value(f, 'count').textContent.split('= ').at(-1), String(count(k, k.regimes[r])));
  });
  // Stride 2 leaves one padded cell no window starts from: the floor.
  assert.equal(drawing(f).querySelectorAll('[data-mark="unused"]').length, 1);
});

test('out size: the stride-2 count is withheld while the caption asks for it', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (let step = 0; step < 50; step++) {
    f.seek(scene.beats[4] + step / 10);
    assert.equal(value(f, 'count').textContent.endsWith('·'), true);
    assert.equal(f.root.dataset.written, '0');
    assert.doesNotMatch(f.$('[data-figure] svg').getAttribute('aria-label'), /\b4 outputs/);
  }
});

test('out size: the ledger prints all three regimes at the end', t => {
  const f = fixture(t, NAME), k = declared(f); f.load(); f.open(); f.seek(scene.duration);
  k.regimes.forEach((g, i) => assert.match(value(f, `ledger-${i}`).textContent, new RegExp(`= ${count(k, g)}$`)));
});

test('out size: text stays inside the picture and off its neighbours', t => {
  for (const width of [296, 375, 599, 600, 713, 900]) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    for (const time of [...scene.beats, ...scene.beats.map(b => b + 4.9), scene.duration]) {
      f.seek(Math.min(time, scene.duration));
      const [, , W, H] = f.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/).map(Number);
      const boxes = [...drawing(f).querySelectorAll('text')].map(node => {
        const size = Number(node.getAttribute('font-size')), anchor = node.getAttribute('text-anchor');
        const w = node.textContent.length * size * 0.56, x = Number(node.getAttribute('x')), y = Number(node.getAttribute('y'));
        const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
        return {left, right: left + w, top: y - size, bottom: y + size * 0.3, text: node.textContent};
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

test('out size: seeking is deterministic', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const snap = time => { f.seek(time); return canonicalMarkup(drawing(f).innerHTML); };
  const times = [0, 7, 12, 17, 22, 27, 33, 39];
  assert.deepEqual(times.map(snap), [...times].reverse().map(snap).reverse());
});

test('out size: the committed static print is a fresh render of the final frame', async () => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after, 'run scripts/render_static_frames.cjs out-size');
});

test('out size: typography and inertness', () => {
  const player = read('out-size/player.js');
  assert.doesNotMatch(player, /Math\.random|fetch\(|import\(|setInterval\(/);
  assert.doesNotMatch(read('out-size/panel.html'), /@eq-|—/);
  assert.equal((player.match(/getBoundingClientRect/g) || []).length, 1);
});

test('integration: the excerpt follows the formula\'s reading and precedes the shapes cell', () => {
  const config = fs.readFileSync(path.join(ROOT, '_quarto.yml'), 'utf8');
  assert.match(config, /^\s+- interactives\/out-size\/player\.js$/m);
  const prose = chapterSource(NAME).split(/\s+/).join(' ');
  assert.equal(scene.anchor.type, 'after-paragraph');
  assert.equal(prose.split(scene.anchor.target).length, 2);
  const at = prose.indexOf(scene.anchor.target);
  assert(prose.indexOf('{#eq-outsize}') < at && at < prose.indexOf('#| label: shapes'));
});
