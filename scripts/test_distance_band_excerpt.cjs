#!/usr/bin/env node
// Test-only checks for the Chapter 6 distance-concentration scene. Nothing here ships.
// The suite derives the band from the panel's two declarations -- the closed-form spread
// and the extreme-value quantile -- and reads the drawn band back out of the SVG, because
// the claim this scene makes is about a width, not about a digit.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, close, canonicalMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'distance-band-excerpt', scene = entry(NAME);
const WIDTHS = [296, 360, 375, 480, 560, 599, 600, 713, 900];
const PX = 1e-4;
const attr = (node, key) => Number(node.getAttribute(key));
const drawing = f => f.$('[data-drawing]');
const visible = node => node && !node.closest('[hidden]') && !node.hasAttribute('hidden');
const texts = f => [...drawing(f).querySelectorAll('text')].filter(visible);
const mark = (f, name) => drawing(f).querySelector(`[data-mark="${name}"]`);

const declared = f => ({
  dims: numbers(f.root.dataset.dims), points: Number(f.root.dataset.points),
  focus: Number(f.root.dataset.focus), spread: Number(f.root.dataset.spread),
  z: Number(f.root.dataset.extreme), printed: f.root.dataset.printed
});
const edges = (d, k) => [1 - k.z * Math.sqrt(k.spread / d), 1 + k.z * Math.sqrt(k.spread / d)];
const ratio = (d, k) => { const [lo, hi] = edges(d, k); return lo / hi; };

registerTransportTests(NAME, {witness: /0\.96/, anchors: ['distance-band-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('distance band: the closed form is the cube\'s, and it lands on the chapter\'s digit', t => {
  const f = fixture(t, NAME);
  const k = declared(f), chapter = chapterSource(NAME);
  assert(chapter.includes('dims = [2, 10, 100, 784, 5000]'), 'the ladder is drawn from the chapter\'s own list');
  assert(chapter.includes('P = torch.rand(300, d)'), 'and the sample size is the chapter\'s');
  assert(chapter.includes('At d=784 the ratio reaches 0.89.'), 'which is the number the scene has to reach');
  assert.equal(k.points, 300);
  assert.equal(k.focus, 784);
  // 0.35 is 42/120: variance 7d/180 of the squared distance, carried to the distance by
  // the delta method and divided by the squared mean d/6.
  close(k.spread, (7 / 180) * 36 / 4, 1e-12);
  close(k.spread, 0.35, 1e-12);
  // The extreme is the normal quantile of one minus one over the sample size. Checked by
  // its defining property rather than by retyping the table value.
  const Phi = z => (1 + erf(z / Math.SQRT2)) / 2;
  close(Phi(k.z), 1 - 1 / k.points, 2e-5);
  // And the whole point: geometry alone reproduces the measured ratio.
  assert.equal(ratio(k.focus, k).toFixed(2), k.printed);
  assert(k.dims.includes(k.focus), 'the focus dimension is a rung on the ladder');
  assert.deepEqual(k.dims, [10, 100, 784, 5000]);
});

test('distance band: the band narrows as one over the square root of the dimension', t => {
  const f = fixture(t, NAME);
  const k = declared(f);
  const width = d => { const [lo, hi] = edges(d, k); return hi - lo; };
  // A hundredfold in dimension is a tenfold squeeze, at every rung and exactly.
  close(width(10) / width(1000), 10, 1e-9);
  close(width(100) / width(10000), 10, 1e-9);
  // Monotone, and the ratios the picture prints.
  const shown = k.dims.map(d => ratio(d, k).toFixed(2));
  assert.deepEqual(shown, ['0.33', '0.72', '0.89', '0.96']);
  for (let i = 1; i < k.dims.length; i++) assert(ratio(k.dims[i], k) > ratio(k.dims[i - 1], k));
  // The approximation is declared to hold from ten up, which is why two is not a rung.
  assert(1 - k.z * Math.sqrt(k.spread / 2) < 0, 'at d = 2 the band would reach below zero');
  assert(1 - k.z * Math.sqrt(k.spread / k.dims[0]) > 0, 'and at the first rung it does not');
});

test('distance band: the drawn band is the computed band, and it collapses on the timeline', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const k = declared(f);
  f.seek(0);
  assert.equal(mark(f, 'band'), null, 'nothing is drawn before the first rung');
  const widths = [];
  for (const [stage, index] of [[1, 0], [2, 1], [4, 2], [5, 3]]) {
    f.seek(scene.beats[stage] + 4.9);
    const band = mark(f, 'band');
    assert(band, `no band at beat ${stage}`);
    assert.equal(f.root.dataset.dimension, String(k.dims[index]));
    widths.push(attr(band, 'width'));
    // The drawn width is the computed width, in the picture's own units.
    const [lo, hi] = edges(k.dims[index], k);
    const unit = attr(band, 'width') / (hi - lo);
    if (index === 0) assert(unit > 1, 'the axis has a positive scale');
    close(attr(band, 'width') / unit, hi - lo, 1e-6);
  }
  for (let i = 1; i < widths.length; i++) assert(widths[i] < widths[i - 1], 'the band only narrows');
  close(widths[0] / widths[3], Math.sqrt(k.dims[3] / k.dims[0]), 0.02);
  // It really moves: the edges glide between rungs rather than cutting.
  const at = time => { f.seek(time); const b = mark(f, 'band'); return b && attr(b, 'width'); };
  const during = [0.5, 1.5, 2.5, 3.5].map(offset => at(scene.beats[2] + offset));
  for (let i = 1; i < during.length; i++) assert(during[i] < during[i - 1] - 0.5, 'the collapse is animated');
});

test('distance band: the prediction is withheld and the chapter\'s number arrives with it', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const k = declared(f);
  for (const at of [0, 2, 4.99]) {
    f.seek(scene.beats[3] + at);
    assert.equal(f.root.dataset.ratio, '', `a ratio is published at the hold + ${at}`);
    const shown = texts(f).map(node => node.textContent).join(' | ');
    assert(shown.includes('·'), 'the readout reads as a dot, never as 0');
    assert(!shown.includes(k.printed), `the answer is on the picture: ${shown}`);
  }
  f.seek(scene.beats[4] + 4.9);
  assert.equal(f.root.dataset.ratio, ratio(k.focus, k).toFixed(4));
  const shown = texts(f).map(node => node.textContent).join(' | ');
  assert(shown.includes(k.printed), 'the comparison with the chapter\'s measurement is drawn');
  assert(drawing(f).querySelector('[data-value="printed"]'), 'and it is a named value');
});

test('distance band: the comparison keeps the first rung as a dashed outline', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const k = declared(f);
  for (const time of [scene.beats[1] + 4, scene.beats[5] + 4.9]) {
    f.seek(time);
    assert.equal(mark(f, 'ghost'), null, `the reference is drawn at ${time}s, before its beat`);
  }
  f.seek(scene.beats[6] + 2);
  const ghost = mark(f, 'ghost'), band = mark(f, 'band');
  assert(ghost && band);
  const [lo, hi] = edges(k.dims[0], k);
  close(attr(ghost, 'width') / attr(band, 'width'),
    (hi - lo) / (edges(k.dims.at(-1), k)[1] - edges(k.dims.at(-1), k)[0]), 0.02);
  assert(read('distance-band/player.css').includes('.dn-ghost { fill:none;'),
    'the reference is an outline, so the live band reads through it');
});

test('distance band: reduced motion holds each beat\'s finished state', t => {
  const f = fixture(t, NAME, {reduced: true}); f.load(); f.open();
  const k = declared(f);
  const seen = scene.beats.map(beat => { f.seek(beat); return f.root.dataset.dimension; });
  assert.deepEqual(seen, ['', '10', '100', '100', '784', '5000', '5000', '5000']);
  const ratios = scene.beats.map(beat => { f.seek(beat); return f.root.dataset.ratio; });
  assert.deepEqual(ratios, ['', ...[0, 1, 1].map(i => ratio(k.dims[i], k).toFixed(4)).slice(0, 2),
    '', ...[2, 3, 3, 3].map(i => ratio(k.dims[i], k).toFixed(4))]);
  // No still catches the band between two rungs.
  for (const beat of scene.beats.slice(1)) {
    f.seek(beat);
    const dim = Number(f.root.dataset.dimension), band = mark(f, 'band');
    const [lo, hi] = edges(dim, k);
    const unit = attr(band, 'width') / (hi - lo);
    close(attr(band, 'width'), (hi - lo) * unit, 1e-6, `the band is mid-glide at ${beat}s`);
  }
});

test('distance band: every layout keeps its text inside the picture and off its neighbours', t => {
  for (const width of WIDTHS) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    for (const time of [...scene.beats, scene.duration]) {
      f.seek(time);
      const [, , boxWidth, boxHeight] = f.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/).map(Number);
      const boxes = texts(f).map(node => {
        const size = Number(node.getAttribute('font-size')), anchor = node.getAttribute('text-anchor');
        const scale = node.getAttribute('class').includes('dn-number') ? 2 : 1;
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
      const band = mark(f, 'band');
      if (band) assert(attr(band, 'x') >= -1 && attr(band, 'x') + attr(band, 'width') <= boxWidth + 1,
        `at ${width}px, ${time}s the band runs outside the picture`);
    }
  }
});

test('distance band: seeking is deterministic and the picture is rebuilt from time alone', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const snapshot = time => { f.seek(time); return canonicalMarkup(drawing(f).innerHTML); };
  const forward = [0, 7, 13, 18, 23, 28, 33, 39].map(snapshot);
  const backward = [39, 33, 28, 23, 18, 13, 7, 0].map(snapshot).reverse();
  assert.deepEqual(forward, backward, 'the same time draws the same picture whatever came before');
});

test('distance band: the panel is the one fixture copy -- moving it moves every number', t => {
  const g = fixture(t, NAME);
  g.root.dataset.dims = '10 100 2500 5000';
  g.load(); g.open(); g.seek(scene.beats[4] + 4.9);
  const k = declared(g);
  assert.equal(g.root.dataset.dimension, '2500');
  assert.equal(g.root.dataset.ratio, ratio(2500, k).toFixed(4));
  assert(drawing(g).textContent.includes(ratio(2500, k).toFixed(2)));
});

test('distance band: the committed static print is a fresh render of the final frame', async () => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after,
    'interactives/distance-band/panel.html is stale: run scripts/render_static_frames.cjs distance-band');
});

test('distance band: plain-text numbers use a true minus, and the player is inert', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (const time of [...scene.beats, scene.duration]) {
    f.seek(time);
    for (const node of texts(f)) {
      assert.doesNotMatch(node.textContent, /\de[-+]\d/, `e-notation in "${node.textContent}"`);
      assert.doesNotMatch(node.textContent, /(?<!\w)-\d/, `ASCII minus in "${node.textContent}"`);
      assert.doesNotMatch(node.textContent, /\^\(|\bexp\(/, `ASCII math in "${node.textContent}"`);
    }
  }
  const player = read('distance-band/player.js');
  assert.doesNotMatch(player, /Math\.random|fetch\(|import\(|setInterval\(/);
  assert.doesNotMatch(read('distance-band/panel.html'), /@eq-/);
  assert.equal((player.match(/getBoundingClientRect/g) || []).length, 1);
});

test('integration: the excerpt is HTML-only, manifest-driven, and declared in the config', () => {
  const filter = fs.readFileSync(path.join(ROOT, scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/,
    'the non-HTML guard is the first executable line, so the PDF is untouched');
  assert.match(filter, /pandoc\.json\.decode/);
  assert.match(filter, /"after-cell"/);
  assert.match(filter, /assert\(inserted == 1/);
  assert.doesNotMatch(filter, /distance|curse/i, 'a manifest-driven filter names no scene');
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
  // The scene sits after the measured curve it explains, whose cell Quarto labels
  // cell-fig-curse, and before the section that names the cure.
  const chapter = chapterSource(NAME);
  assert.equal(scene.anchor.type, 'after-cell');
  assert.equal(scene.anchor.target, 'cell-fig-curse');
  assert.equal((chapter.match(/^#\| label: fig-curse$/gm) || []).length, 1);
  assert(chapter.indexOf('#| label: fig-curse') < chapter.indexOf('## The cure has a name'));
});

// The error function, so the extreme-value quantile is checked by its definition rather
// than by trusting the number the panel declares. Abramowitz and Stegun 7.1.26.
function erf(x) {
  const sign = x < 0 ? -1 : 1, z = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * z);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t * t
    * Math.exp(-z * z) - 0.254829592 * t * Math.exp(-z * z);
  return sign * y;
}
