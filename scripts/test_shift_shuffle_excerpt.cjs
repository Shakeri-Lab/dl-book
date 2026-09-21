#!/usr/bin/env node
// Test-only checks for the Chapter 6 shift-versus-shuffle scene. Nothing here ships.
// Every product and score is recomputed from the row the panel declares, and the drawn
// bars are read back out of the SVG, because the claim is about which bars survive a
// rearrangement, not about a number in the player's state.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, close, canonicalMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'shift-shuffle-excerpt', scene = entry(NAME);
const WIDTHS = [296, 360, 375, 480, 560, 599, 600, 713, 900];
const PX = 1e-4;
const attr = (node, key) => Number(node.getAttribute(key));
const drawing = f => f.$('[data-drawing]');
const visible = node => node && !node.closest('[hidden]') && !node.hasAttribute('hidden');
const texts = f => [...drawing(f).querySelectorAll('text')].filter(visible);
const mark = (f, name) => drawing(f).querySelector(`[data-mark="${name}"]`);
const marks = (f, prefix) => [...drawing(f).querySelectorAll(`[data-mark^="${prefix}"]`)];

const declared = f => ({
  w: numbers(f.root.dataset.weights), x: numbers(f.root.dataset.pixels),
  perm: numbers(f.root.dataset.permutation), shift: Number(f.root.dataset.shift)
});
const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
const slid = d => d.x.map((_, i) => (i < d.shift ? 0 : d.x[i - d.shift]));

registerTransportTests(NAME, {witness: /1\.40/, anchors: ['shift-shuffle-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('shift shuffle: the two operations are the chapter\'s, and the row is declared', t => {
  const f = fixture(t, NAME);
  const d = declared(f), chapter = chapterSource(NAME);
  assert(chapter.includes('pixel_perm = torch.randperm(784)'), 'the chapter permutes pixel positions');
  assert(chapter.includes('net_shuffled = train_mlp(X_tr[:, pixel_perm], y_tr)'), 'and retrains on them');
  assert(chapter.includes('out[:, :, px:] = img[:, :, :-px]'), 'the chapter\'s shift pushes zeros in at the left');
  assert(chapter.includes('for px in [0, 2]:'), 'and the panel\'s two is the chapter\'s two');
  assert.equal(d.shift, 2);
  assert.equal(d.w.length, d.x.length);
  // The declared permutation really is one: every slot filled exactly once.
  assert.deepEqual([...d.perm].sort((a, b) => a - b), d.w.map((_, i) => i));
  assert(d.perm.some((value, index) => value !== index), 'and it is not the identity');
  // No number the panel shows appears in the chapter: the row is a schematic.
  for (const value of [...d.w, ...d.x]) assert(!chapter.includes(`= ${value}`));
});

test('shift shuffle: a common permutation moves every term and changes no total', t => {
  const f = fixture(t, NAME);
  const d = declared(f);
  const base = dot(d.w, d.x);
  const wp = d.perm.map(i => d.w[i]), xp = d.perm.map(i => d.x[i]);
  close(dot(wp, xp), base, 1e-12, 'a common permutation is exactly free');
  // Not approximately free: the multiset of products is literally unchanged.
  const before = d.w.map((w, i) => (w * d.x[i]).toFixed(12)).sort();
  const after = wp.map((w, i) => (w * xp[i]).toFixed(12)).sort();
  assert.deepEqual(after, before);
  // A shift is not free, and the panel's picture must be able to show the difference.
  const after2 = dot(d.w, slid(d));
  assert(Math.abs(after2 - base) > 0.5, 'the declared row makes the shift visibly costly');
  assert.equal(base.toFixed(2), '0.39');
  assert.equal(after2.toFixed(2), '1.40');
});

test('shift shuffle: the products ride the permutation and are remade by the slide', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const d = declared(f);
  const heights = () => marks(f, 'product-').map(node => Number(attr(node, 'height').toFixed(3))).sort((a, b) => a - b);
  f.seek(scene.beats[1] + 4.9); const inPlace = heights();
  assert.equal(inPlace.length, d.w.length, 'one product bar per column');
  f.seek(scene.beats[3] + 4.9);
  assert.deepEqual(heights(), inPlace, 'the permutation kept every product bar, height for height');
  assert.equal(f.root.dataset.score, dot(d.w, d.x).toFixed(4), 'and the score with it');
  f.seek(scene.duration);
  const after = heights();
  assert.notDeepEqual(after, inPlace, 'the slide remade the products');
  assert.equal(f.root.dataset.score, dot(d.w, slid(d)).toFixed(4));
  // The bars really do move during the permutation, rather than being redrawn in place.
  f.seek(scene.beats[3] + 0.1); const early = marks(f, 'product-').map(node => attr(node, 'x'));
  f.seek(scene.beats[3] + 2); const later = marks(f, 'product-').map(node => attr(node, 'x'));
  assert(early.some((value, i) => Math.abs(value - later[i]) > 4), 'the columns are in motion');
});

test('shift shuffle: the slide pushes zeros in and loses what runs off the end', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const d = declared(f);
  f.seek(scene.beats[1] + 4.9);
  assert.equal(marks(f, 'empty-').length, 0, 'no empty slots before the slide');
  assert.equal(marks(f, 'pixel-').length, d.x.length, 'every pixel is drawn in place');
  f.seek(scene.duration);
  assert.equal(marks(f, 'empty-').length, d.shift, 'the slide leaves exactly two empty slots');
  assert.equal(marks(f, 'pixel-').length, d.x.length - d.shift, 'and two pixels have run off the end');
  // The surviving pixels are the ones the chapter's shift_right keeps.
  const kept = marks(f, 'pixel-').map(node => Number(node.dataset.mark.split('-')[1]));
  assert.deepEqual(kept, d.x.map((_, i) => i).slice(0, d.x.length - d.shift));
});

test('shift shuffle: both predictions are withheld while their captions ask', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const d = declared(f);
  for (const stage of [2, 4]) {
    for (const at of [0, 2, 4.99]) {
      f.seek(scene.beats[stage] + at);
      assert.equal(f.root.dataset.score, '', `a score is published at beat ${stage} + ${at}`);
      assert(texts(f).some(node => node.textContent === '·'), 'the score reads as a dot, never as 0');
      const shown = texts(f).map(node => node.textContent).join(' | ');
      assert(!shown.includes('0.39') && !shown.includes('1.40'), `an answer is on the picture: ${shown}`);
    }
  }
  // And there is nothing to read off the drawn score bar either.
  f.seek(scene.beats[4] + 2);
  assert.equal(mark(f, 'score'), null, 'the score bar is absent while its number is withheld');
  f.seek(scene.beats[5] + 4.99);
  assert(mark(f, 'score'), 'and returns once the slide has landed');
  assert.equal(mark(f, 'reference'), null, 'the reference waits for the comparison beat');
  f.seek(scene.beats[6] + 1);
  close(attr(mark(f, 'score'), 'width') / attr(mark(f, 'reference'), 'width'),
    dot(d.w, slid(d)) / dot(d.w, d.x), 0.01, 'the two bars compare as the two scores do');
});

test('shift shuffle: reduced motion holds each beat\'s finished state', t => {
  const f = fixture(t, NAME, {reduced: true}); f.load(); f.open();
  const d = declared(f), base = dot(d.w, d.x).toFixed(4), after = dot(d.w, slid(d)).toFixed(4);
  assert.deepEqual(scene.beats.map(beat => { f.seek(beat); return f.root.dataset.score; }),
    ['', base, '', base, '', after, after, after]);
  // Nothing is caught mid-move in a still: every column sits on a whole slot.
  const pitch = () => {
    const xs = marks(f, 'weight-').map(node => attr(node, 'x')).sort((a, b) => a - b);
    return xs[1] - xs[0];
  };
  for (const beat of scene.beats) {
    f.seek(beat);
    const step = pitch();
    const xs = marks(f, 'weight-').map(node => attr(node, 'x')).sort((a, b) => a - b);
    xs.forEach((x, i) => close(x, xs[0] + i * step, 0.01, `a column is off-grid in the still at ${beat}s`));
  }
});

test('shift shuffle: every layout keeps its text inside the picture and off its neighbours', t => {
  for (const width of WIDTHS) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    for (const time of [...scene.beats, scene.duration]) {
      f.seek(time);
      const [, , boxWidth, boxHeight] = f.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/).map(Number);
      const boxes = texts(f).map(node => {
        const size = Number(node.getAttribute('font-size')), anchor = node.getAttribute('text-anchor');
        const scale = node.getAttribute('class').includes('sx-number') ? 1.2 : 1;
        const w = node.textContent.length * size * scale * 0.56, x = attr(node, 'x'), y = attr(node, 'y');
        const left = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
        return {left, right: left + w, top: y - size * scale, bottom: y + size * scale * 0.3, text: node.textContent};
      });
      for (const box of boxes) {
        assert(box.left >= -1 && box.right <= boxWidth + 1,
          `at ${width}px, ${time}s "${box.text}" runs outside the picture`);
        assert(box.top >= -1 && box.bottom <= boxHeight + 1,
          `at ${width}px, ${time}s "${box.text}" runs off the top or bottom`);
      }
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i], b = boxes[j];
          const over = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const down = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          assert(over <= 1 || down <= 1, `at ${width}px, ${time}s "${a.text}" and "${b.text}" collide`);
        }
      }
      // The bars stay inside too: this picture is made of them.
      for (const node of drawing(f).querySelectorAll('rect')) {
        assert(attr(node, 'x') >= -1 && attr(node, 'x') + attr(node, 'width') <= boxWidth + 1,
          `at ${width}px, ${time}s a bar runs outside the picture`);
      }
    }
  }
});

test('shift shuffle: seeking is deterministic and the picture is rebuilt from time alone', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const snapshot = time => { f.seek(time); return canonicalMarkup(drawing(f).innerHTML); };
  const forward = [0, 7, 13, 18, 23, 28, 33, 39].map(snapshot);
  const backward = [39, 33, 28, 23, 18, 13, 7, 0].map(snapshot).reverse();
  assert.deepEqual(forward, backward, 'the same time draws the same picture whatever came before');
});

test('shift shuffle: the panel is the one fixture copy -- moving it moves every number', t => {
  const g = fixture(t, NAME);
  g.root.dataset.pixels = '0.5 0.5 0.5 0.5 0.5 0.5 0.5 0.5';
  g.load(); g.open(); g.seek(scene.duration);
  const d = declared(g);
  assert.equal(g.root.dataset.score, dot(d.w, slid(d)).toFixed(4));
  assert(drawing(g).textContent.includes(dot(d.w, slid(d)).toFixed(2).replace('-', '−')));
  assert(!drawing(g).textContent.includes('1.40'), 'no retyped copy of the old number is left');
});

test('shift shuffle: the committed static print is a fresh render of the final frame', async () => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after,
    'interactives/shift-shuffle/panel.html is stale: run scripts/render_static_frames.cjs shift-shuffle');
});

test('shift shuffle: plain-text numbers use a true minus, and the player is inert', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (const time of [...scene.beats, scene.duration]) {
    f.seek(time);
    for (const node of texts(f)) {
      assert.doesNotMatch(node.textContent, /\de[-+]\d/, `e-notation in "${node.textContent}"`);
      assert.doesNotMatch(node.textContent, /(?<!\w)-\d/, `ASCII minus in "${node.textContent}"`);
      assert.doesNotMatch(node.textContent, /\^|\bexp\(/, `ASCII math in "${node.textContent}"`);
    }
  }
  const player = read('shift-shuffle/player.js');
  assert.doesNotMatch(player, /Math\.random|fetch\(|import\(|setInterval\(/);
  assert.doesNotMatch(read('shift-shuffle/panel.html'), /@eq-/);
  assert.equal((player.match(/getBoundingClientRect/g) || []).length, 1);
});

test('integration: the excerpt is HTML-only, manifest-driven, and declared in the config', () => {
  const filter = fs.readFileSync(path.join(ROOT, scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/,
    'the non-HTML guard is the first executable line, so the PDF is untouched');
  assert.match(filter, /pandoc\.json\.decode/);
  assert.match(filter, /"before-heading"/);
  assert.match(filter, /assert\(inserted == 1/);
  assert.doesNotMatch(filter, /shuffle/i, 'a manifest-driven filter names no scene');
  const config = fs.readFileSync(path.join(ROOT, '_quarto.yml'), 'utf8');
  const section = (key, text) => {
    const start = text.indexOf(`\n${key}`);
    assert(start >= 0, `${key} is missing from _quarto.yml`);
    const rest = text.slice(start + 1 + key.length);
    const end = rest.search(/\n\S/);
    return end < 0 ? rest : rest.slice(0, end);
  };
  assert.match(section('  resources:', config), new RegExp(`^\\s+- interactives/${scene.scene}/player\\.js$`, 'm'));
  assert(!section('  resources:', config).includes(`${scene.scene}/panel.html`));
  const chapter = chapterSource(NAME);
  assert.equal(scene.anchor.type, 'before-heading');
  assert.equal(chapter.split('\n').filter(line => line === `## ${scene.anchor.target}`).length, 1);
  // The scene sits after both experiments and the diagnosis they share, and before the
  // autopsy that reads the fitted weights.
  assert(chapter.indexOf('net_shuffled = train_mlp') < chapter.indexOf(`## ${scene.anchor.target}`));
  assert(chapter.indexOf('def shift_right') < chapter.indexOf(`## ${scene.anchor.target}`));
});
