#!/usr/bin/env node
// Test-only checks for the Chapter 7 moving-average scene. Nothing here ships. The suite
// recomputes every average from the samples the panel declares, binds those samples to
// the provenance the manifest records for them, and reads the window, the averages and
// the ends back out of the SVG, because where the window stands is the whole claim.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, close, canonicalMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'box-average-excerpt', scene = entry(NAME);
const WIDTHS = [296, 360, 375, 480, 560, 599, 600, 713, 900];
const attr = (node, key) => Number(node.getAttribute(key));
const drawing = f => f.$('[data-drawing]');
const visible = node => node && !node.closest('[hidden]') && !node.hasAttribute('hidden');
const texts = f => [...drawing(f).querySelectorAll('text')].filter(visible);
const mark = (f, name) => drawing(f).querySelector(`[data-mark="${name}"]`);

const declared = f => ({x: numbers(f.root.dataset.samples), k: Number(f.root.dataset.width),
  turns: Number(f.root.dataset.tOverPi), raw: f.root.dataset.samples.trim()});
const averages = ({x, k}) => Array.from({length: x.length - k + 1},
  (_, i) => x.slice(i, i + k).reduce((sum, v) => sum + v, 0) / k);

registerTransportTests(NAME, {witness: /292 averages/, anchors: ['box-average-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('box average: the fixture is the chapter\'s cell, and the samples are bound to their receipt', t => {
  const f = fixture(t, NAME), d = declared(f), chapter = chapterSource(NAME);
  assert(chapter.includes('torch.manual_seed(6050)\nt = torch.linspace(0, 4 * torch.pi, 300)\nnoisy = torch.sin(t) + 0.35 * torch.randn(300)'));
  assert(chapter.includes(`kernel = torch.full((${d.k},), 1 / ${d.k})`), 'the declared width is the chapter\'s kernel width');
  assert(chapter.includes(`plt.plot(t[${(d.k - 1) / 2}:-${(d.k - 1) / 2}], smooth`), 'and the plot slices off exactly half a window at each end');
  assert.equal(d.x.length, 300, 'the chapter draws 300 samples');
  assert.equal(d.turns, 4, 't runs over [0, 4 pi]');
  // The samples are the executed cell's output, recorded by hash where the manifest
  // describes them; changing one digit here breaks this binding.
  const sha = crypto.createHash('sha256').update(d.raw).digest('hex');
  assert(scene.fixture.computedVariants.some(sentence => sentence.includes(sha)),
    'the manifest records the SHA-256 of the declared samples');
  // And they carry the recipe's signature: noise of scale 0.35 around sin(t).
  const residual = d.x.map((v, i) => v - Math.sin(d.turns * Math.PI * i / (d.x.length - 1)));
  const mean = residual.reduce((s, v) => s + v, 0) / residual.length;
  const sd = Math.sqrt(residual.reduce((s, v) => s + (v - mean) ** 2, 0) / (residual.length - 1));
  assert(Math.abs(mean) < 0.1 && sd > 0.25 && sd < 0.45, `noise of the chapter's scale: mean ${mean}, sd ${sd}`);
});

test('box average: every average is the mean of nine, and there are 300 - 9 + 1 of them', t => {
  const f = fixture(t, NAME), d = declared(f), avg = averages(d);
  assert.equal(avg.length, d.x.length - d.k + 1);
  assert.equal(avg.length, 292);
  // The transcript's six numbers are the first six windows, in order.
  const transcript = f.root.querySelector('#box-average-transcript').textContent;
  assert(transcript.includes(avg[0].toFixed(2)), 'the first average is printed');
  for (const value of avg.slice(1, 6)) assert(transcript.includes(value.toFixed(2)), `transcript lacks ${value.toFixed(2)}`);
  assert.equal(avg[0].toFixed(2), '0.17');
});

test('box average: the window starts on the first centre, stops on the last, and never leaves', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const d = declared(f), half = (d.k - 1) / 2, last = d.x.length - 1 - half;
  let written = -1;
  for (let time = 0; time <= scene.duration; time += 0.2) {
    f.seek(Number(time.toFixed(4)));
    const centre = Number(f.root.dataset.centre), now = Number(f.root.dataset.written);
    assert(centre >= half && centre <= last, `the window's centre left [${half}, ${last}] at ${time}s: ${centre}`);
    assert(now >= written, `an average was unwritten at ${time}s`);
    written = now;
    // The window really is nine samples wide on the page.
    const win = mark(f, 'window'), dots = [...drawing(f).querySelectorAll('.ba-sample')];
    const pitch = attr(dots[1], 'cx') - attr(dots[0], 'cx');
    close(attr(win, 'width'), d.k * pitch, 0.01);
  }
  assert.equal(written, averages(d).length);
  f.seek(0); assert.equal(f.root.dataset.centre, String(half));
  f.seek(scene.duration); assert.equal(f.root.dataset.centre, String(last));
});

test('box average: in the lens nine stems become one average, standing at the centre', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const d = declared(f), avg = averages(d);
  f.seek(scene.beats[1] + 4.99);
  const stems = [...mark(f, 'lens').querySelectorAll('[data-mark^="stem-"]')];
  assert.equal(stems.length, d.k, 'the lens shows exactly the nine covered samples');
  assert.equal(mark(f, 'lens-average'), null, 'no average before its beat');
  // Mid-beat the stems have shrunk and are travelling toward the centre.
  f.seek(scene.beats[2] + 2.6);
  const moving = [...mark(f, 'lens').querySelectorAll('[data-mark^="stem-"]')];
  const heights = moving.map(node => Math.abs(attr(node, 'y2') - attr(node, 'y1')));
  f.seek(scene.beats[1] + 4.99);
  const full = [...mark(f, 'lens').querySelectorAll('[data-mark^="stem-"]')].map(node => Math.abs(attr(node, 'y2') - attr(node, 'y1')));
  heights.forEach((h, i) => close(h, full[i] / d.k, 0.05, `stem ${i} is a ninth of itself`));
  // At the end of the beat the average stands where the centre stem stood.
  f.seek(scene.beats[3] - 0.01);
  const result = mark(f, 'lens-average');
  assert(result, 'the average is drawn in the lens');
  const centreStem = drawing(f).querySelector('[data-mark="stem-4"]');
  close(attr(result, 'x1'), attr(centreStem, 'x1'), 0.01);
  assert.equal(drawing(f).querySelector('[data-value="lens-average"]').textContent, avg[0].toFixed(2));
  assert(mark(f, 'average'), 'and the same average lands on the signal');
});

test('box average: the lens scrolls as the window steps, one sample per step', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const at = time => { f.seek(time); return mark(f, 'lens').querySelector('[data-mark="stem-8"]'); };
  const before = at(scene.beats[3] + 0.05), during = at(scene.beats[3] + 0.3);
  assert(attr(during, 'x1') < attr(before, 'x1'), 'the contents move left while the window moves right');
  f.seek(scene.beats[4] - 0.01);
  assert.equal(f.root.dataset.written, '6', 'five slow steps after the first average');
  assert.equal(f.root.dataset.centre, '9');
});

test('box average: the ends are withheld while the caption asks, then marked exactly', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const d = declared(f), half = (d.k - 1) / 2;
  for (const time of [scene.beats[5], scene.beats[5] + 2.5, scene.beats[6] - 0.01]) {
    f.seek(time);
    const shown = texts(f).map(node => node.textContent).join(' | ');
    assert(!/292|without an average/.test(shown), `the answer is on the picture at ${time}s: ${shown}`);
    assert(!f.$('[data-formula]').classList.contains('ba-count-lit'), 'and the count line is still hidden');
  }
  assert(read('box-average/player.css').includes('.box-average-formula:not(.ba-count-lit) #eq-box-average-2 { visibility:hidden; }'));
  f.seek(scene.duration);
  const dots = [...drawing(f).querySelectorAll('.ba-sample')].map(node => attr(node, 'cx'));
  const pitch = dots[1] - dots[0];
  for (const [name, from, to] of [['end-0', 0, half - 1], [`end-${d.x.length - half}`, d.x.length - half, d.x.length - 1]]) {
    const node = mark(f, name), [a, b] = [...node.getAttribute('d').matchAll(/[MH]\s*([-\d.]+)/g)].map(m => Number(m[1]));
    close(a, dots[from] - pitch / 2, 0.01, `${name} starts at sample ${from}`);
    close(b, dots[to] + pitch / 2, 0.01, `${name} ends at sample ${to}`);
  }
  assert(texts(f).some(node => node.textContent === '292 averages'));
});

test('box average: reduced motion holds each beat\'s finished state', t => {
  const f = fixture(t, NAME, {reduced: true}); f.load(); f.open();
  const seen = scene.beats.map(beat => { f.seek(beat); return [f.root.dataset.centre, f.root.dataset.written, f.root.dataset.lens].join('/'); });
  assert.deepEqual(seen, ['4/0/closed', '4/0/open', '4/1/open', '9/6/open', '295/292/closed', '295/292/open', '295/292/open', '295/292/open']);
});

test('box average: every layout keeps its text inside the picture and off its neighbours', t => {
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
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i], b = boxes[j];
          const over = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const down = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          assert(over <= 1 || down <= 1, `at ${width}px, ${time}s "${a.text}" and "${b.text}" collide`);
        }
      }
      const lens = mark(f, 'lens');
      if (lens) {
        const box = lens.querySelector('.ba-lens');
        assert(attr(box, 'x') >= 0 && attr(box, 'x') + attr(box, 'width') <= boxWidth, `at ${width}px the lens leaves the picture`);
      }
    }
  }
});

test('box average: seeking is deterministic and the picture is rebuilt from time alone', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const snapshot = time => { f.seek(time); return canonicalMarkup(drawing(f).innerHTML); };
  const forward = [0, 7, 12.6, 16.3, 22, 27, 33, 39].map(snapshot);
  const backward = [39, 33, 27, 22, 16.3, 12.6, 7, 0].map(snapshot).reverse();
  assert.deepEqual(forward, backward, 'the same time draws the same picture whatever came before');
});

test('box average: the panel is the one fixture copy -- moving it moves every number', t => {
  const g = fixture(t, NAME);
  g.root.dataset.width = '5';
  g.load(); g.open(); g.seek(scene.duration);
  assert.equal(g.root.dataset.written, '296');
  assert(drawing(g).textContent.includes('296 averages'));
  assert(drawing(g).textContent.includes('2 without an average'));
  assert(!drawing(g).textContent.includes('292'), 'no retyped copy of the old count is left');
});

test('box average: the committed static print is a fresh render of the final frame', async () => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after,
    'interactives/box-average/panel.html is stale: run scripts/render_static_frames.cjs box-average');
});

test('box average: plain-text numbers use a true minus, and the player is inert', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (const time of [...scene.beats, scene.beats[2] + 4.99, scene.duration]) {
    f.seek(time);
    for (const node of texts(f)) {
      assert.doesNotMatch(node.textContent, /\de[-+]\d/, `e-notation in "${node.textContent}"`);
      assert.doesNotMatch(node.textContent, /(?<!\w)-\d/, `ASCII minus in "${node.textContent}"`);
      assert.doesNotMatch(node.textContent, /\^|\bexp\(/, `ASCII math in "${node.textContent}"`);
    }
  }
  const player = read('box-average/player.js');
  assert.doesNotMatch(player, /Math\.random|fetch\(|import\(|setInterval\(/);
  assert.doesNotMatch(read('box-average/panel.html'), /@eq-|—/);
  assert.equal((player.match(/getBoundingClientRect/g) || []).length, 1);
});

test('integration: the excerpt is HTML-only, manifest-driven, and sits after the moving-average figure', () => {
  const filter = fs.readFileSync(path.join(ROOT, scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/,
    'the non-HTML guard is the first executable line, so the PDF is untouched');
  assert.match(filter, /"after-cell"/);
  assert.match(filter, /assert\(inserted == 1/);
  assert.doesNotMatch(filter, /moving|average/i, 'a manifest-driven filter names no scene');
  const config = fs.readFileSync(path.join(ROOT, '_quarto.yml'), 'utf8');
  assert.match(config, new RegExp(`^\\s+- interactives/${scene.scene}/player\\.js$`, 'm'));
  const chapter = chapterSource(NAME);
  assert.equal(scene.anchor.type, 'after-cell');
  assert.equal(scene.anchor.target, 'cell-fig-moving-average');
  assert.equal((chapter.match(/^#\| label: fig-moving-average$/gm) || []).length, 1);
  // After the figure it explains, before the section that takes the window to 2-D.
  assert(chapter.indexOf('#| label: fig-moving-average') < chapter.indexOf('## To 2D: the recipe'));
  assert(chapter.indexOf('#| label: moving-average-values') < chapter.indexOf('#| label: fig-moving-average'));
});
