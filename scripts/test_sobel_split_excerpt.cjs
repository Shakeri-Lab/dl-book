#!/usr/bin/env node
// Test-only checks for the Chapter 7 vertical-Sobel scene. Nothing here ships. The suite
// rebuilds the crop from the rectangle the panel declares, applies the kernel both ways
// (nine products, and a row difference averaged down the column), and reads the frame,
// the arithmetic and the response map back out of the SVG.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, close, canonicalMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'sobel-split-excerpt', scene = entry(NAME);
const WIDTHS = [296, 360, 375, 480, 560, 599, 600, 713, 900];
const attr = (node, key) => Number(node.getAttribute(key));
const drawing = f => f.$('[data-drawing]');
const visible = node => node && !node.closest('[hidden]') && !node.hasAttribute('hidden');
const texts = f => [...drawing(f).querySelectorAll('text')].filter(visible);
const mark = (f, name) => drawing(f).querySelector(`[data-mark="${name}"]`);
const value = (f, name) => drawing(f).querySelector(`[data-value="${name}"]`);

const declared = f => {
  const d = f.root.dataset;
  const [top, left, size] = numbers(d.crop), [r0, r1, c0, c1] = numbers(d.rect);
  const stops = numbers(d.stops);
  return {kernel: numbers(d.kernel), along: numbers(d.along), across: numbers(d.across),
    level: Number(d.level), top, left, size, r0, r1, c0, c1,
    stops: [0, 1, 2].map(k => ({r: stops[2 * k], c: stops[2 * k + 1]}))};
};
const image = k => (r, c) => {
  const row = k.top + r, col = k.left + c;
  return row >= k.r0 && row < k.r1 && col >= k.c0 && col < k.c1 ? k.level : 0;
};
const respond = (k, r, c, kernel = k.kernel) => {
  const px = image(k);
  let h = 0;
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) h += kernel[3 * a + b] * px(r - 1 + a, c - 1 + b);
  return h;
};
const centres = k => { const out = []; for (let r = 1; r < k.size - 1; r++) for (let c = 1; c < k.size - 1; c++) out.push({r, c}); return out; };

registerTransportTests(NAME, {witness: /3\.6/, anchors: ['sobel-split-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('sobel split: the kernel, its transpose and the rectangle are the chapter\'s', t => {
  const f = fixture(t, NAME), k = declared(f), chapter = chapterSource(NAME);
  const tensor = flat => `torch.tensor([${[0, 1, 2].map(a => `[${flat.slice(3 * a, 3 * a + 3).map(v => `${v}.`).join(', ')}]`).join(', ')}])`;
  assert(chapter.includes(`"Sobel (vert.)": ${tensor(k.kernel)},`), 'the declared kernel is the zoo\'s vertical Sobel');
  // The declared factors multiply out to the kernel, and their transpose is the zoo's other Sobel.
  const outer = k.along.flatMap(a => k.across.map(b => a * b));
  assert.deepEqual(outer, k.kernel);
  const transposed = k.across.flatMap(b => k.along.map(a => a * b));
  assert(chapter.includes(`"Sobel (horiz.)": ${tensor(transposed)},`), 'the transpose is the zoo\'s horizontal Sobel');
  assert(chapter.includes(`img[${k.r0}:${k.r1}, ${k.c0}:${k.c1}] = ${k.level}`), 'the rectangle is make_shapes\' own');
  assert.equal(k.kernel.reduce((s, v) => s + v, 0), 0, 'the weights sum to zero, as the chapter says');
});

test('sobel split: the crop holds the corner and nothing else, with one edge of each kind', t => {
  const f = fixture(t, NAME), k = declared(f), px = image(k);
  const values = new Set();
  for (let r = 0; r < k.size; r++) for (let c = 0; c < k.size; c++) values.add(px(r, c));
  assert.deepEqual([...values].sort(), [0, k.level]);
  // The rectangle's top row and left column both fall strictly inside the crop, so both
  // edges are present, and the other shapes (disk rows 34-54, stripes from column 40) are not.
  assert(k.r0 > k.top && k.r0 < k.top + k.size && k.c0 > k.left && k.c0 < k.left + k.size);
  assert(k.top + k.size <= 34 && k.left + k.size <= 40);
});

test('sobel split: nine products and "difference across, average down" agree everywhere', t => {
  const f = fixture(t, NAME), k = declared(f), px = image(k);
  for (const {r, c} of centres(k)) {
    const split = [0, 1, 2].reduce((sum, a) => sum + k.along[a] *
      k.across.reduce((d, w, b) => d + w * px(r - 1 + a, c - 1 + b), 0), 0);
    close(split, respond(k, r, c), 1e-12, `the two readings disagree at (${r}, ${c})`);
  }
  // The three stops: a flat patch, the left side, the top.
  const [flat, side, topEdge] = k.stops.map(({r, c}) => respond(k, r, c));
  close(flat, 0, 1e-12); close(side, 4 * k.level, 1e-12); close(topEdge, 0, 1e-12);
  // The whole map: a stripe down the two columns straddling the left side, rising
  // 0.9, 2.7, 3.6 as the frame enters the rectangle's rows, and zeros everywhere else.
  const stripe = centres(k).filter(({r, c}) => Math.abs(respond(k, r, c)) > 1e-9);
  assert.deepEqual([...new Set(stripe.map(({c}) => c))], [2, 3]);
  assert.deepEqual(stripe.filter(({c}) => c === 2).map(({r, c}) => Number(respond(k, r, c).toFixed(1))), [0.9, 2.7, 3.6, 3.6, 3.6]);
  // The transposed kernel sees the top instead.
  const transposed = k.across.flatMap(b => k.along.map(a => a * b));
  close(respond(k, k.stops[2].r, k.stops[2].c, transposed), 4 * k.level, 1e-12);
  close(respond(k, k.stops[1].r, k.stops[1].c, transposed), 0, 1e-12);
});

test('sobel split: the frame visits its three stops, and the arithmetic follows it', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const k = declared(f);
  const expect = [[2, 0, '0'], [3, 1, '3.6'], [5, 2, '0']];
  for (const [stage, index, reading] of expect) {
    f.seek(scene.beats[stage] + 4.99);
    assert.equal(f.root.dataset.frame, `${k.stops[index].r} ${k.stops[index].c}`);
    assert.equal(value(f, 'response').textContent, reading, `beat ${stage} reads ${reading}`);
    assert.equal(f.root.dataset.response, reading);
  }
  // The rows really are drawn as three weighted differences before they join.
  f.seek(scene.beats[3] + 3.2);
  const bars = [0, 1, 2].map(a => mark(f, `difference-${a}`));
  assert(bars.every(Boolean));
  close(attr(bars[1], 'width') / attr(bars[0], 'width'), 2, 0.01, 'the middle row counts twice');
  close(attr(bars[2], 'width') / attr(bars[0], 'width'), 1, 0.01);
  // The frame glides rather than jumping between stops.
  const path = [0.4, 1.0, 1.6].map(dt => { f.seek(scene.beats[3] + dt); return attr(mark(f, 'frame'), 'x'); });
  assert(path[0] > path[1] && path[1] > path[2], 'the frame slides left onto the side');
});

test('sobel split: the top edge\'s response is withheld while the caption asks for it', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (const time of [scene.beats[4] + 0.5, scene.beats[4] + 2.5, scene.beats[5] - 0.01]) {
    f.seek(time);
    assert.equal(value(f, 'response').textContent, '·', `a response is shown at ${time}s`);
    assert.equal(mark(f, 'difference-0'), null, 'and no row differences are drawn');
    assert.equal(f.root.dataset.response, '');
  }
  f.seek(scene.beats[5] + 4.99);
  assert.equal(value(f, 'response').textContent, '0');
});

test('sobel split: the sweep leaves every response where its patch was centred', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const k = declared(f);
  f.seek(scene.beats[6] + 0.5);
  const partway = Number(f.root.dataset.mapped);
  assert(partway > 0 && partway < centres(k).length, 'the map fills in, rather than appearing whole');
  f.seek(scene.duration);
  assert.equal(Number(f.root.dataset.mapped), centres(k).length);
  const dots = [...drawing(f).querySelectorAll('.sb-response[data-mark^="response-"]')];
  const expected = centres(k).filter(({r, c}) => Math.abs(respond(k, r, c)) > 1e-9);
  assert.equal(dots.length, expected.length, 'one dot per non-zero response');
  assert.equal(drawing(f).querySelectorAll('[data-mark^="silent-"]').length, centres(k).length - expected.length,
    'and a ring for every measured zero, the top edge included');
  // Dot size follows the response.
  const radius = (r, c) => attr(mark(f, `response-${r}-${c}`), 'r');
  assert(radius(2, 2) < radius(3, 2) && radius(3, 2) < radius(5, 2));
  assert.equal(value(f, 'legend-max').textContent, `${(4 * k.level).toFixed(1)}: every row climbs`);
  assert.equal(mark(f, 'frame'), null, 'the frame has finished its sweep');
});

test('sobel split: reduced motion holds each beat\'s finished state', t => {
  const f = fixture(t, NAME, {reduced: true}); f.load(); f.open();
  const seen = scene.beats.map(beat => { f.seek(beat); return [f.root.dataset.frame, f.root.dataset.response, f.root.dataset.mapped].join('/'); });
  assert.deepEqual(seen, ['5 5//0', '5 5//0', '5 5/0/0', '5 3/3.6/0', '3 5//0', '3 5/0/0', '//36', '//36']);
});

test('sobel split: every layout keeps its text inside the picture and off its neighbours', t => {
  for (const width of WIDTHS) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    for (const time of [...scene.beats, ...scene.beats.map(b => b + 4.99), scene.duration]) {
      f.seek(Math.min(time, scene.duration));
      const [, , boxWidth, boxHeight] = f.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/).map(Number);
      const boxes = texts(f).map(node => {
        const size = Number(node.getAttribute('font-size')), anchor = node.getAttribute('text-anchor');
        const w = node.textContent.length * size * 0.56, x = attr(node, 'x'), y = attr(node, 'y');
        const left = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
        return {left, right: left + w, top: y - size, bottom: y + size * 0.3, text: node.textContent,
          sign: node.getAttribute('class').includes('sb-sign')};
      });
      for (const box of boxes) {
        assert(box.left >= -1 && box.right <= boxWidth + 1, `at ${width}px, ${time}s "${box.text}" runs outside the picture`);
        assert(box.top >= -1 && box.bottom <= boxHeight + 1, `at ${width}px, ${time}s "${box.text}" runs off the top or bottom`);
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

test('sobel split: seeking is deterministic and the picture is rebuilt from time alone', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const snapshot = time => { f.seek(time); return canonicalMarkup(drawing(f).innerHTML); };
  const forward = [0, 7, 12, 16.3, 18.5, 23, 28, 32, 39].map(snapshot);
  const backward = [39, 32, 28, 23, 18.5, 16.3, 12, 7, 0].map(snapshot).reverse();
  assert.deepEqual(forward, backward, 'the same time draws the same picture whatever came before');
});

test('sobel split: the panel is the one fixture copy -- moving it moves every number', t => {
  const g = fixture(t, NAME);
  g.root.dataset.level = '0.5';
  g.load(); g.open();
  g.seek(scene.beats[3] + 4.99);
  assert.equal(value(g, 'response').textContent, '2.0');
  g.seek(scene.duration);
  assert.equal(value(g, 'legend-max').textContent, '2.0: every row climbs');
  assert(!drawing(g).textContent.includes('3.6'), 'no retyped copy of the old response is left');
});

test('sobel split: the committed static print is a fresh render of the final frame', async () => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after,
    'interactives/sobel-split/panel.html is stale: run scripts/render_static_frames.cjs sobel-split');
});

test('sobel split: plain-text numbers use a true minus, and the player is inert', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (const time of [...scene.beats, scene.beats[3] + 4.99, scene.duration]) {
    f.seek(time);
    for (const node of texts(f)) {
      assert.doesNotMatch(node.textContent, /\de[-+]\d/, `e-notation in "${node.textContent}"`);
      assert.doesNotMatch(node.textContent, /(?<!\w)-\d/, `ASCII minus in "${node.textContent}"`);
      assert.doesNotMatch(node.textContent, /\^|\bexp\(/, `ASCII math in "${node.textContent}"`);
    }
  }
  const player = read('sobel-split/player.js');
  assert.doesNotMatch(player, /Math\.random|fetch\(|import\(|setInterval\(/);
  assert.doesNotMatch(read('sobel-split/panel.html'), /@eq-|—/);
  assert.equal((player.match(/getBoundingClientRect/g) || []).length, 1);
});

test('integration: the excerpt precedes the zoo\'s whole Plan -> Code panel, never splitting it', () => {
  const filter = fs.readFileSync(path.join(ROOT, scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/,
    'the non-HTML guard is the first executable line, so the PDF is untouched');
  assert.match(filter, /"before-cell"/, 'the filter can place a before-cell anchor');
  // A cell inside a Plan -> Code wrapper is presented by the wrapper, so the panel must go
  // before the wrapper, not between the plan and its code.
  assert.match(filter, /block\.classes:includes\("plan-code"\) then return holds\(block, scene\.anchor\.target\)/);
  assert.match(filter, /if scene\.anchor\.type == "before-cell" then return \{block, div\} end/);
  assert.match(filter, /assert\(inserted == 1/);
  assert.doesNotMatch(filter, /sobel|zoo/i, 'a manifest-driven filter names no scene');
  const config = fs.readFileSync(path.join(ROOT, '_quarto.yml'), 'utf8');
  assert.match(config, new RegExp(`^\\s+- interactives/${scene.scene}/player\\.js$`, 'm'));
  const chapter = chapterSource(NAME);
  assert.equal(scene.anchor.type, 'before-cell');
  assert.equal(scene.anchor.target, 'cell-fig-filter-zoo');
  const label = chapter.indexOf('#| label: fig-filter-zoo');
  assert(label > 0 && chapter.indexOf('#| label: fig-filter-zoo', label + 1) < 0, 'the zoo cell is labelled once');
  const wrapper = chapter.lastIndexOf(':::: {.plan-code', label);
  assert(wrapper > chapter.indexOf('## The filter zoo'), 'the zoo cell sits in a Plan -> Code wrapper inside the zoo section');
  assert(chapter.lastIndexOf('*does intensity change here, in my direction?*', wrapper) > chapter.indexOf('## The filter zoo'),
    'so the panel lands after the zoo\'s three bullets and before its code');
});
