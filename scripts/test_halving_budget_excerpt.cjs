#!/usr/bin/env node
// Test-only checks for the Trainer interlude's successive-halving scene. Nothing here
// ships. Every cost is recomputed from the schedule the panel declares, and the areas are
// read back out of the drawn rectangles, because area is what this picture claims.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, close, canonicalMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'halving-budget-excerpt', scene = entry(NAME);
const WIDTHS = [296, 360, 375, 480, 560, 599, 600, 713, 900];
const PX = 1e-4;
const attr = (node, key) => Number(node.getAttribute(key));
const drawing = f => f.$('[data-drawing]');
const visible = node => node && !node.closest('[hidden]') && !node.hasAttribute('hidden');
const texts = f => [...drawing(f).querySelectorAll('text')].filter(visible);
const mark = (f, name) => drawing(f).querySelector(`[data-mark="${name}"]`);
const blocks = f => [...drawing(f).querySelectorAll('[data-mark^="block-"]')];

const declared = f => ({
  configs: Number(f.root.dataset.configs), rungs: numbers(f.root.dataset.rungs),
  keep: numbers(f.root.dataset.keep), total: Number(f.root.dataset.total),
  full: Number(f.root.dataset.full)
});
// The schedule's cost, with resumed checkpoints: a survivor pays only for what its rung adds.
const schedule = d => d.keep.map((n, r) => ({n, from: r === 0 ? 0 : d.rungs[r - 1], to: d.rungs[r],
  cost: n * (d.rungs[r] - (r === 0 ? 0 : d.rungs[r - 1]))}));

registerTransportTests(NAME, {witness: /spent 81/, anchors: ['halving-budget-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('halving budget: the schedule is the interlude\'s, and it sums to the printed cost', t => {
  const f = fixture(t, NAME);
  const d = declared(f), rounds = schedule(d);
  const chapter = chapterSource(NAME);
  assert(chapter.includes('27 configurations run for one epoch, nine continue to a cumulative three,'));
  assert(chapter.includes('$27+9(2)+3(6)+1(18)=81$ epoch-units. Training all 27 for 27 epochs would cost 729.'));
  assert.deepEqual(d.keep, [27, 9, 3, 1]);
  assert.deepEqual(d.rungs, [1, 3, 9, 27]);
  // The chapter's four terms, recovered one at a time from the declared schedule.
  assert.deepEqual(rounds.map(r => r.cost), [27, 18, 18, 18]);
  assert.equal(rounds.reduce((sum, r) => sum + r.cost, 0), d.total);
  assert.equal(d.configs * d.rungs.at(-1), d.full, 'the square is every configuration trained in full');
  assert.equal(d.full / d.total, 9);
  // The invariant the formula line states: survivors times cumulative budget is constant.
  assert.deepEqual(d.keep.map((n, r) => n * d.rungs[r]), [27, 27, 27, 27]);
  // Each round keeps a third and triples the budget.
  for (let r = 1; r < d.keep.length; r++) {
    assert.equal(d.keep[r - 1] / d.keep[r], 3);
    assert.equal(d.rungs[r] / d.rungs[r - 1], 3);
  }
});

test('halving budget: the painted area is the cost, at the same scale as the square', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const d = declared(f), rounds = schedule(d);
  f.seek(scene.duration);
  const square = mark(f, 'square');
  const unit = (attr(square, 'width') * attr(square, 'height')) / d.full;
  const drawn = blocks(f);
  assert.equal(drawn.length, rounds.length, 'one block per rung');
  // Coordinates are serialised at four decimals, so areas agree to a thousandth of a unit.
  drawn.forEach((node, index) => {
    close(attr(node, 'width') * attr(node, 'height') / unit, rounds[index].cost, 1e-3);
  });
  const painted = drawn.reduce((sum, node) => sum + attr(node, 'width') * attr(node, 'height'), 0);
  close(painted / unit, d.total, 1e-3);
  close(attr(square, 'width') * attr(square, 'height') / painted, 9, 1e-3);
  // Every rung after the first paints the same area, which is the scene's point.
  const later = drawn.slice(1).map(node => attr(node, 'width') * attr(node, 'height') / unit);
  later.forEach(area => close(area, 18, 1e-3));
});

test('halving budget: each round trades width for height, and the total only grows', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const d = declared(f), rounds = schedule(d);
  const finished = [1, 2, 3, 5].map(stage => { f.seek(scene.beats[stage] + 4.999); return blocks(f).at(-1); });
  for (let i = 1; i < finished.length; i++) {
    // A third as many survivors, and their cumulative budget three times as deep.
    close(attr(finished[i - 1], 'width') / attr(finished[i], 'width'), 3, 0.02);
    close(d.rungs[i] / d.rungs[i - 1], 3, PX);
  }
  // The drawn block is the INCREMENT a rung adds, not its cumulative budget, so the last
  // three blocks grow threefold while the first pair grows twofold -- and from the second
  // rung on, width times height is the same 18 every time.
  const blockHeights = finished.map(node => attr(node, 'height'));
  close(blockHeights[1] / blockHeights[0], 2, 0.02);
  close(blockHeights[2] / blockHeights[1], 3, 0.02);
  close(blockHeights[3] / blockHeights[2], 3, 0.02);
  assert.deepEqual(rounds.slice(1).map(r => r.cost), [18, 18, 18]);
  let previous = -1;
  for (let time = 0; time <= scene.duration; time += 0.25) {
    f.seek(Number(time.toFixed(4)));
    const now = Number(f.root.dataset.spent);
    assert(now >= previous, `the running total fell at ${time}s: ${previous} then ${now}`);
    previous = now;
  }
  assert.equal(previous, d.total);
});

test('halving budget: the frontier narrows before the block climbs', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const d = declared(f);
  for (const [stage, from, to] of [[2, 27, 9], [3, 9, 3], [5, 3, 1]]) {
    f.seek(scene.beats[stage] - 0.01);
    close(Number(f.root.dataset.frontier), from, 0.01);
    f.seek(scene.beats[stage] + 1.5);            // past the cut, into the climb
    close(Number(f.root.dataset.frontier), to, 0.01);
  }
  f.seek(0); close(Number(f.root.dataset.frontier), d.configs, PX);
  // The frontier really is drawn, and its length follows the count it reports.
  f.seek(scene.beats[1] + 4.9); const wide = attr(mark(f, 'frontier'), 'x2') - attr(mark(f, 'frontier'), 'x1');
  f.seek(scene.beats[3] + 4.9); const narrow = attr(mark(f, 'frontier'), 'x2') - attr(mark(f, 'frontier'), 'x1');
  close(wide / narrow, 9, 0.02);
});

test('halving budget: the total is withheld while the caption asks for it', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const d = declared(f);
  for (const time of [scene.beats[4], scene.beats[4] + 2, scene.beats[5] - 0.01]) {
    f.seek(time);
    assert.equal(Number(f.root.dataset.spent), 63, 'three rungs are paid for and the fourth is not');
    const shown = texts(f).map(node => node.textContent).join(' | ');
    assert(!shown.includes(String(d.total)), `the total is on the picture before its beat: ${shown}`);
  }
  f.seek(0);
  assert(texts(f).some(node => node.textContent === 'spent ·'), 'nothing spent reads as a dot, never as 0');
  f.seek(scene.beats[5] + 4.999);
  assert(texts(f).map(node => node.textContent).join(' | ').includes(`spent ${d.total}`));
});

test('halving budget: the alternative is an outline until the beat that spends it', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (const time of [0, scene.beats[5], scene.beats[6] - 0.01]) {
    f.seek(time);
    assert(!mark(f, 'square').getAttribute('class').includes('hv-square-lit'),
      `the square is filled at ${time}s, before the comparison beat`);
    assert.equal(mark(f, 'square').getAttribute('fill'), 'none');
  }
  f.seek(scene.beats[6]);
  assert(mark(f, 'square').getAttribute('class').includes('hv-square-lit'));
  assert(read('halving-budget/player.css').includes('.hv-square-lit { fill:'),
    'and the wash is a real rule, so the comparison is area against area');
});

test('halving budget: reduced motion holds each beat\'s finished state', t => {
  const f = fixture(t, NAME, {reduced: true}); f.load(); f.open();
  const spent = scene.beats.map(beat => { f.seek(beat); return Number(f.root.dataset.spent); });
  assert.deepEqual(spent, [0, 27, 45, 63, 63, 81, 81, 81]);
  // No block is caught part-grown in a still.
  for (const beat of scene.beats) {
    f.seek(beat);
    for (const node of blocks(f)) {
      assert(attr(node, 'height') > 0, `a zero-height block survives the still at ${beat}s`);
    }
  }
});

test('halving budget: every layout keeps its text inside the picture and off its neighbours', t => {
  for (const width of WIDTHS) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    for (const time of [...scene.beats, scene.duration]) {
      f.seek(time);
      const [, , boxWidth, boxHeight] = f.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/).map(Number);
      const boxes = texts(f).map(node => {
        const size = Number(node.getAttribute('font-size')), anchor = node.getAttribute('text-anchor');
        // The running total is set larger by player.css; estimate it at that size.
        const scale = node.getAttribute('class').includes('hv-spent') ? 1.25 : 1;
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
    }
  }
});

test('halving budget: seeking is deterministic and the picture is rebuilt from time alone', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const snapshot = time => { f.seek(time); return canonicalMarkup(drawing(f).innerHTML); };
  const forward = [0, 7, 13, 18, 23, 28, 33, 39].map(snapshot);
  const backward = [39, 33, 28, 23, 18, 13, 7, 0].map(snapshot).reverse();
  assert.deepEqual(forward, backward, 'the same time draws the same picture whatever came before');
});

test('halving budget: the panel is the one fixture copy -- moving it moves every number', t => {
  const g = fixture(t, NAME);
  g.root.dataset.keep = '64 16 4 1';
  g.root.dataset.rungs = '1 4 16 64';
  g.root.dataset.configs = '64';
  g.load(); g.open(); g.seek(scene.duration);
  // 64 + 16(3) + 4(12) + 1(48) = 208, against 64 x 64 = 4096.
  assert.equal(Number(g.root.dataset.spent), 208);
  assert(drawing(g).textContent.includes('spent 208'), 'the picture follows the panel');
  assert(!drawing(g).textContent.includes('spent 81'), 'with no retyped copy of the old number left');
});

test('halving budget: the committed static print is a fresh render of the final frame', async () => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after,
    'interactives/halving-budget/panel.html is stale: run scripts/render_static_frames.cjs halving-budget');
});

test('halving budget: plain-text numbers use a true minus, and the player is inert', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (const time of [...scene.beats, scene.duration]) {
    f.seek(time);
    for (const node of texts(f)) {
      assert.doesNotMatch(node.textContent, /\de[-+]\d/, `e-notation in "${node.textContent}"`);
      assert.doesNotMatch(node.textContent, /(?<!\w)-\d/, `ASCII minus in "${node.textContent}"`);
      assert.doesNotMatch(node.textContent, /\^|\bexp\(/, `ASCII math in "${node.textContent}"`);
    }
  }
  const player = read('halving-budget/player.js');
  assert.doesNotMatch(player, /Math\.random|fetch\(|import\(|setInterval\(/);
  assert.doesNotMatch(read('halving-budget/panel.html'), /@eq-/);
  assert.equal((player.match(/getBoundingClientRect/g) || []).length, 1);
});

test('integration: the excerpt is HTML-only, manifest-driven, and declared in the config', () => {
  const filter = fs.readFileSync(path.join(ROOT, scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/,
    'the non-HTML guard is the first executable line, so the PDF is untouched');
  assert.match(filter, /pandoc\.json\.decode/, 'the scene is data in the manifest, not code in the filter');
  assert.match(filter, /"before-heading"/);
  assert.match(filter, /assert\(inserted == 1/);
  assert.doesNotMatch(filter, /halving|budget/i, 'a manifest-driven filter names no scene');
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
  const headings = chapter.split('\n').filter(line => line.startsWith('## '));
  assert.equal(headings.filter(line => line.slice(3).trim() === scene.anchor.target).length, 1,
    'the anchor is an unambiguous level-two heading');
  // The scene sits after the successive-halving passage and its stated assumption, and
  // before the split section. The intervening "A practical search order" heading is
  // inside a callout, which is why it is not the anchor.
  assert(chapter.indexOf('$27+9(2)+3(6)+1(18)=81$') < chapter.indexOf(`## ${scene.anchor.target}`));
  assert(chapter.indexOf('The saving comes with an assumption') < chapter.indexOf(`## ${scene.anchor.target}`));
  const callout = chapter.indexOf('## A practical search order');
  assert(chapter.lastIndexOf('::: {.callout-tip}', callout) > chapter.indexOf('$27+9(2)+3(6)+1(18)=81$'),
    'the nearer heading really does sit inside a callout');
});
