#!/usr/bin/env node
// Test-only checks for the autoencoder interlude's decoder-family scene. Nothing here ships.
// The suite recomputes the family g_a(z) = z^2 + a z(z^2 - 1) from the panel's declared codes,
// multiple, sweep, draw and grid; reads every drawn curve back out of its Bezier segment
// through the axes the rings define; and holds the prediction: while the caption asks,
// nothing on the picture or in what it says names a value at the draw other than the one
// already shown.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, close, canonicalMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'decoder-family-excerpt', scene = entry(NAME);
const WIDTHS = [296, 375, 599, 600, 713, 900];
const MINUS = '−';
const drawing = f => f.$('[data-drawing]');
const texts = f => [...drawing(f).querySelectorAll('text')];
const value = (f, name) => drawing(f).querySelector(`[data-value="${name}"]`);
const mark = (f, name) => drawing(f).querySelector(`[data-mark="${name}"]`);
const dial = f => f.$('[data-a-slider]');
const scrubber = f => f.$('[data-controls] input[type=range]');
const described = f => f.$('[data-figure] svg').getAttribute('aria-label');
const drag = (f, a) => { dial(f).value = String(a); dial(f).dispatchEvent(new f.w.Event('input')); };
// The panel's own number spellings, with a true minus: two decimals at the draw, as the cell
// prints them, and a declared number at its own spelling.
const signed = (v, text) => (v < 0 && Number(text) !== 0 ? MINUS : '') + text;
const two = v => signed(v, Math.abs(v).toFixed(2));
const plain = v => signed(v, String(Number(Math.abs(v).toFixed(4))));
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const declared = f => {
  const d = f.root.dataset;
  return {codes: numbers(d.codes), multiple: Number(d.multiple), sweep: numbers(d.sweep), draw: Number(d.draw), grid: numbers(d.grid)};
};
const term = z => z * (z * z - 1);
const decode = (a, z) => z * z + a * term(z);

// The drawing's axes, recovered from the marks rather than from the player: the rings stand
// at (code, code squared), so two rings fix the z scale and two targets fix the value scale.
function axes(f, k) {
  const ring = i => { const node = mark(f, `ring-${i}`); return [Number(node.getAttribute('cx')), Number(node.getAttribute('cy'))]; };
  const [x0, y0] = ring(0), [x2] = ring(k.codes.length - 1), [, y1] = ring(1);
  const zs = (x2 - x0) / (k.codes.at(-1) - k.codes[0]), vs = (y1 - y0) / (k.codes[0] ** 2 - k.codes[1] ** 2);
  return {x: z => x0 + (z - k.codes[0]) * zs, y: v => y1 - (v - k.codes[1] ** 2) * vs,
    z: x => k.codes[0] + (x - x0) / zs, v: y => k.codes[1] ** 2 + (y1 - y) / vs};
}
// A drawn curve read back: its one cubic Bezier segment, evaluated in data units.
function curve(f, k, name) {
  const d = mark(f, name).getAttribute('d'), p = d.match(/-?\d+(?:\.\d+)?/g).map(Number);
  assert.match(d, /^M[^C]+C[^C]+$/, `${name} is one cubic segment`);
  const ax = axes(f, k);
  return t => {
    const u = 1 - t, b = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
    const x = b.reduce((s, w, i) => s + w * p[2 * i], 0), y = b.reduce((s, w, i) => s + w * p[2 * i + 1], 0);
    return [ax.z(x), ax.v(y)];
  };
}
// Every point of the drawn curve lies on g_a, it runs over the whole grid, and it passes
// through every ring.
function assertMember(f, k, name, a, where) {
  const at = curve(f, k, name);
  for (let i = 0; i <= 40; i++) {
    const [z, v] = at(i / 40);
    close(v, decode(a, z), 2e-4);
  }
  close(at(0)[0], k.grid[0], 1e-4); close(at(1)[0], k.grid[1], 1e-4);
  for (const code of k.codes) {
    const t = (code - k.grid[0]) / (k.grid[1] - k.grid[0]), [z, v] = at(t);
    close(z, code, 1e-4);
    assert(Math.abs(v - code * code) < 2e-4, `${where}: ${name} at a = ${a} leaves the ring at ${code} (${v})`);
  }
}

registerTransportTests(NAME, {witness: /−0\.05/, anchors: ['decoder-family-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('decoder family: the codes, the multiple, the draw and the grid are the audit cell\'s', t => {
  const f = fixture(t, NAME), k = declared(f), chapter = chapterSource(NAME);
  assert(chapter.includes(`$z\\in\\{${k.codes.join(',')}\\}$ and one decoder is $g_1(z)=z^2$.`), 'the prose names the three codes');
  assert(chapter.includes(`g_2(z)=z^2+${k.multiple}z(z^2-1).`), 'the chapter\'s multiple');
  assert(chapter.includes(`latent_grid.square() + ${k.multiple} * latent_grid * (latent_grid.square() - 1.0)`));
  assert(chapter.includes(`observed_codes = torch.tensor([${k.codes.map(c => c.toFixed(1)).join(', ')}])`));
  assert(chapter.includes('observed_targets = observed_codes.square()'), 'the targets are the codes squared');
  assert(chapter.includes(`random_code = torch.tensor(${k.draw})`));
  assert(chapter.includes(`latent_grid = torch.linspace(${k.grid[0]}, ${k.grid[1]}, 400)`));
  assert.deepEqual(k.sweep, [-k.multiple, k.multiple], 'the sweep is the chapter\'s multiple and its declared mirror');
  assert.equal(f.root.dataset.evidenceClass, 'computed');
  // The cell's frozen output: the largest gap at the codes and the two decoded draws.
  const frozen = JSON.parse(fs.readFileSync(path.join(ROOT,
    '_freeze/chapters/interludes/making-pca-learnable/execute-results/html.json'), 'utf8')).result.markdown;
  const gap = Math.max(...k.codes.map(z => Math.abs(decode(k.multiple, z) - z * z)));
  assert(frozen.includes(`largest decoder gap at observed codes: ${gap.toFixed(1)}`));
  assert(frozen.includes(`g1(${k.draw}): ${decode(0, k.draw).toFixed(2)}`));
  assert(frozen.includes(`g2(${k.draw}): ${decode(k.multiple, k.draw).toFixed(2)}`));
});

test('decoder family: every multiple reproduces the targets, and the draw slides along 0.25 − 0.375a', t => {
  const f = fixture(t, NAME), k = declared(f);
  for (let i = 0; i <= 32; i++) {
    const a = k.sweep[0] + (k.sweep[1] - k.sweep[0]) * i / 32;
    for (const z of k.codes) assert.equal(decode(a, z), z * z, `a = ${a} misses the code ${z}`);
    close(decode(a, k.draw), k.draw ** 2 + a * term(k.draw), 1e-15);
  }
  assert.equal(term(k.draw), -0.375);
  assert.equal(decode(0, k.draw), 0.25);
  assert.deepEqual([k.sweep[1], 0, k.sweep[0]].map(a => two(decode(a, k.draw))), ['−0.05', '0.25', '0.55']);
  // No bound: some multiple sends the draw past any level, in either direction.
  for (const level of [-100, 100]) close(decode((level - k.draw ** 2) / term(k.draw), k.draw), level, 1e-12);
  // The family fits the plot: its extremes on the grid lie at the two ends of the sweep.
  let low = Infinity, high = -Infinity;
  for (const a of k.sweep) for (let i = 0; i < 400; i++) {
    const v = decode(a, k.grid[0] + (k.grid[1] - k.grid[0]) * i / 399);
    low = Math.min(low, v); high = Math.max(high, v);
  }
  assert(low > -0.7 && high < 3.45, `the axis holds the family: ${low} to ${high}`);
});

test('decoder family: the drawn curve is g_a at every moment, and every ring stays on it', t => {
  for (const width of [713, 296]) {
    const f = fixture(t, NAME, {width}), k = declared(f); f.load(); f.open();
    for (let time = 0; time <= scene.duration + 1e-9; time += 0.35) {
      const at = Number(time.toFixed(2)); f.seek(at);
      const a = Number(f.root.dataset.a);
      assertMember(f, k, 'curve', a, `${width}px ${at}s`);
      assert.equal(mark(f, 'curve').getAttribute('data-a'), String(Number(a.toFixed(4))));
      if (mark(f, 'ghost-high')) assertMember(f, k, 'ghost-high', k.sweep[1], `${width}px ${at}s`);
      if (mark(f, 'ghost-low')) assertMember(f, k, 'ghost-low', k.sweep[0], `${width}px ${at}s`);
    }
    for (const a of [k.sweep[0], -0.35, 0.05, 0.6, k.sweep[1]]) { drag(f, a); assertMember(f, k, 'curve', a, `${width}px dragged`); }
  }
});

test('decoder family: the value at the draw is printed where the curve crosses the draw line', t => {
  const f = fixture(t, NAME), k = declared(f); f.load(); f.open();
  for (let time = 0; time <= scene.duration + 1e-9; time += 0.25) {
    const at = Number(time.toFixed(2)); f.seek(at);
    const a = Number(f.root.dataset.a), v = decode(a, k.draw), ax = axes(f, k), dot = mark(f, 'dot');
    close(Number(dot.getAttribute('cx')), ax.x(k.draw), 1e-3);
    close(ax.v(Number(dot.getAttribute('cy'))), v, 2e-4);
    close(Number(mark(f, 'draw').getAttribute('d').match(/^M(-?[\d.]+)/)[1]), ax.x(k.draw), 1e-3);
    assert.equal(value(f, 'draw').textContent, two(v), `${at}s`);
    if (f.root.dataset.stage !== '0') assert.equal(value(f, 'error').textContent, 'error at the codes: 0');
    assert.equal(f.$('[data-a-readout]').textContent, two(a));
    assert.equal(dial(f).getAttribute('aria-valuetext'), `a = ${two(a)}: zero error at the codes; z = ${plain(k.draw)} decodes to ${two(v)}.`);
  }
});

test('decoder family: each beat prints the numbers the fixture implies', t => {
  const f = fixture(t, NAME), k = declared(f); f.load(); f.open();
  const [lo, hi] = k.sweep, bottom = Math.min(decode(lo, k.draw), decode(hi, k.draw)), top = Math.max(decode(lo, k.draw), decode(hi, k.draw));
  const caption = () => f.$('[data-caption]').textContent;
  f.seek(scene.beats[0] + 1);
  assert.equal(caption(), `Three codes, three targets. The decoder z² hits all three and sends z = ${plain(k.draw)} to ${two(decode(0, k.draw))}.`);
  assert.equal(value(f, 'error'), null, 'the error is named with the term');
  f.seek(scene.beats[1] + 1);
  assert.equal(value(f, 'error').textContent, 'error at the codes: 0');
  assert.equal(mark(f, 'term-label').textContent, 'z(z² − 1)');
  // The term's zeros are ringed exactly at the codes, on the zero line.
  const ax = axes(f, k);
  k.codes.forEach((z, i) => {
    const zero = mark(f, `zero-${i}`);
    close(Number(zero.getAttribute('cx')), ax.x(z), 1e-3); close(ax.v(Number(zero.getAttribute('cy'))), 0, 1e-4);
  });
  // The reveal: the caption states the value only once the curve has arrived.
  for (const [beat, a] of [[3, hi], [4, lo]]) {
    for (let step = 0; step < 28; step++) {
      f.seek(scene.beats[beat] + step / 10);
      assert.doesNotMatch(caption(), /decodes to/, `beat ${beat} states the value before arrival`);
    }
    f.seek(scene.beats[beat] + 2.8);
    close(Number(f.root.dataset.a), a, 1e-12);
    assert.equal(value(f, 'draw').textContent, two(decode(a, k.draw)));
    assert.match(caption(), new RegExp(`a = ${escape(plain(a))}.*z = 0\\.5 decodes to ${escape(two(decode(a, k.draw)))}\\.$`));
  }
  assert.match((f.seek(scene.beats[3] + 3), caption()), /the chapter's second decoder/);
  assert.equal(k.multiple, hi, 'the swing lands on the chapter\'s own multiple');
  f.seek(scene.beats[5] + 1);
  assert.equal(caption(), `Every multiple fits the codes; z = 0.5 slides along ${plain(k.draw ** 2)} − ${plain(-term(k.draw))}a.`);
  assert.equal(value(f, 'top'), null, 'the bracket waits for the curve to come home');
  f.seek(scene.beats[5] + 2.8);
  assert.equal(value(f, 'top').textContent, two(top));
  assert.equal(value(f, 'bottom').textContent, two(bottom));
  assert.equal(value(f, 'draw').textContent, two(decode(0, k.draw)));
  // The bracket spans exactly the two ghosts' values at the draw.
  const [, yTop, yBottom] = mark(f, 'bracket').getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number);
  close(axes(f, k).v(yTop), top, 2e-4); close(axes(f, k).v(yBottom), bottom, 2e-4);
  f.seek(scene.duration);
  assert.deepEqual(['top', 'draw', 'bottom', 'error'].map(name => value(f, name).textContent), ['0.55', '0.25', '−0.05', 'error at the codes: 0']);
  assert.deepEqual(['ghost-high-label', 'ghost-low-label'].map(name => mark(f, name).textContent), [`a = ${plain(hi)}`, `a = ${plain(lo)}`]);
  assert(Number(mark(f, 'arrows').getAttribute('data-reach')) > 0, 'the arrows say there is no bound');
  assert.equal(drawing(f).querySelectorAll('.df-ring.is-pinned').length, k.codes.length);
});

test('decoder family: the band between the two ghosts is the family, shut at every code', t => {
  const f = fixture(t, NAME), k = declared(f), [lo, hi] = k.sweep; f.load(); f.open();
  // It exists exactly when both ends of the sweep are ghosts.
  for (let step = 0; step <= 400; step++) {
    f.seek(step / 10);
    const both = Boolean(mark(f, 'ghost-high') && mark(f, 'ghost-low'));
    assert.equal(Boolean(mark(f, 'envelope')), both, `band and ghosts disagree at ${step / 10}s`);
  }
  f.seek(scene.duration);
  // Its outline is the high ghost out and the low ghost back: two cubic segments that start
  // and end on the grid's ends, so between them lies every g_a with a between the two.
  const d = mark(f, 'envelope').getAttribute('d');
  assert.match(d, /^M[^C]+C[^L]+L[^C]+C[^Z]+Z$/, 'out along one ghost, back along the other');
  assert(d.startsWith(mark(f, 'ghost-high').getAttribute('d')), 'the band\'s upper path is the high ghost itself');
  // g_a is linear in a, so at each z the two ghosts bound the family; at the codes they meet.
  for (const code of k.codes) close(decode(hi, code), decode(lo, code), 1e-12);
  for (const z of [-1.45, -0.5, 0.5, 1.45]) {
    const between = decode((hi + lo) / 2, z);
    assert(between >= Math.min(decode(hi, z), decode(lo, z)) - 1e-12 && between <= Math.max(decode(hi, z), decode(lo, z)) + 1e-12);
  }
  // Its width at the draw is the bracket's: every value the bracket spans is some member's.
  close(Math.abs(decode(hi, k.draw) - decode(lo, k.draw)), 2 * Math.abs(hi) * Math.abs(term(k.draw)), 1e-12);
  assert.match(described(f), /A shaded band between the ghosts holds every multiple between them/);
});

test('decoder family: while the caption asks, nothing names another value at the draw', t => {
  const f = fixture(t, NAME), k = declared(f); f.load(); f.open();
  const others = [two(decode(k.sweep[1], k.draw)), two(decode(k.sweep[0], k.draw)), plain(k.multiple)];
  const forbidden = new RegExp([...others.map(escape), 'range', 'between', 'bracket', 'ghost', 'limit', 'further'].join('|'));
  f.seek(scene.beats[2]);
  assert.equal(f.$('[data-caption]').textContent, 'Add any multiple a of that term. Does the error move? How far can z = 0.5 go?');
  for (let step = 0; step < (scene.beats[3] - scene.beats[2]) * 10; step++) {
    const time = Number((scene.beats[2] + step / 10).toFixed(2));
    f.seek(time);
    assert.equal(f.root.dataset.a, '0', `the multiple has left 0 at ${time}s`);
    assert.equal(mark(f, 'curve').getAttribute('data-a'), '0', `a glide has started at ${time}s`);
    assert.equal(drawing(f).querySelectorAll('.df-ghost, [data-mark="bracket"], [data-mark="arrows"], [data-mark="envelope"]').length, 0, `a ghost, band or bracket at ${time}s`);
    const printed = texts(f).map(node => node.textContent);
    assert.deepEqual(printed.filter(text => /^−?\d+\.\d\d$/.test(text)), [two(decode(0, k.draw))], `values at ${time}s`);
    for (const said of [described(f), scrubber(f).getAttribute('aria-valuetext'), dial(f).getAttribute('aria-valuetext'), printed.join(' ')])
      assert.doesNotMatch(said, forbidden, `said or drawn at ${time}s: ${said}`);
  }
  f.seek(scene.beats[3] + 0.1);
  assert.notEqual(f.root.dataset.a, '0', 'the reveal begins at once, after the still ask');
});

test('decoder family: reduced motion holds each beat\'s finished state', t => {
  const f = fixture(t, NAME, {reduced: true}), k = declared(f); f.load(); f.open();
  const state = () => [f.root.dataset.a, drawing(f).querySelectorAll('.df-ghost').length, Boolean(mark(f, 'term')),
    Boolean(mark(f, 'bracket')), Boolean(mark(f, 'arrows')), drawing(f).querySelectorAll('.is-pinned').length].join('/');
  const seen = scene.beats.map(beat => { f.seek(beat); return state(); });
  const [lo, hi] = k.sweep.map(String);
  assert.deepEqual(seen, ['0/0/false/false/false/0', '0/0/true/false/false/0', '0/0/true/false/false/0', `${hi}/0/false/false/false/0`,
    `${lo}/1/false/false/false/0`, '0/2/false/true/false/0', '0/2/false/true/true/0', '0/2/false/true/true/3']);
  f.seek(scene.beats[3]); assert.match(f.$('[data-caption]').textContent, /decodes to −0\.05\.$/, 'a held beat shows its arrival');
});

test('decoder family: the formula is lit by state: the term, then the multiple', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const tex = f.$('#eq-decoder-family-1').textContent;
  assert.equal(tex, '\\( \\predictionpart{g_a(z)} = z^2 + \\class{df-a}{\\parameterpart{a}}\\,\\class{df-term}{z(z^2-1)} \\)');
  const lit = () => ['df-term-lit', 'df-a-lit'].filter(name => f.$('[data-formula]').classList.contains(name)).join(' ');
  assert.deepEqual(scene.beats.map(beat => (f.seek(beat + 1), lit())),
    ['', 'df-term-lit', 'df-term-lit df-a-lit', 'df-a-lit', 'df-a-lit', 'df-a-lit', 'df-a-lit', '']);
  drag(f, 0.2); assert.equal(lit(), 'df-a-lit', 'a dragged multiple lights the multiple');
  const css = read('decoder-family/player.css');
  assert.match(css, /#decoder-family-excerpt\[data-ready\] \.decoder-family-formula\.df-term-lit \.df-term \{/);
  assert.match(css, /#decoder-family-excerpt\[data-ready\] \.decoder-family-formula\.df-a-lit \.df-a \{/);
});

test('decoder family: text stays inside the picture and off its neighbours', t => {
  for (const width of WIDTHS) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    const probe = label => {
      const [, , W, H] = f.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/).map(Number);
      const boxes = texts(f).map(node => {
        const sz = Number(node.getAttribute('font-size')), anchor = node.getAttribute('text-anchor');
        const w = node.textContent.length * sz * 0.56, x = Number(node.getAttribute('x')), y = Number(node.getAttribute('y'));
        const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
        return {left, right: left + w, top: y - sz, bottom: y + sz * 0.3, text: node.textContent};
      });
      for (const b of boxes) assert(b.left >= -1 && b.right <= W + 1 && b.top >= -1 && b.bottom <= H + 1, `${width}px ${label} "${b.text}" outside`);
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        assert(Math.min(a.right, b.right) - Math.max(a.left, b.left) <= 1 || Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) <= 1,
          `${width}px ${label} "${a.text}" and "${b.text}" collide`);
      }
    };
    for (let time = 0; time <= scene.duration + 1e-9; time += 0.2) { const at = Number(time.toFixed(2)); f.seek(at); probe(`${at}s`); }
    for (const a of [-0.8, -0.5, -0.1, 0.3, 0.75, 0.8]) { drag(f, a); probe(`dragged to ${a}`); }
  }
});

test('decoder family: every mark stays inside the plot, at every width and on the dial\'s ends', t => {
  for (const width of [296, 713]) {
    const f = fixture(t, NAME, {width}), k = declared(f); f.load(); f.open();
    const [, , W, H] = f.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/).map(Number);
    const inside = where => {
      for (const name of ['curve', 'ghost-high', 'ghost-low', 'term']) {
        if (!mark(f, name)) continue;
        const at = curve(f, k, name), ax = axes(f, k);
        for (let i = 0; i <= 60; i++) {
          const [z, v] = at(i / 60), x = ax.x(z), y = ax.y(v);
          assert(x >= 0 && x <= W && y >= 0 && y <= H, `${width}px ${where}: ${name} leaves the picture at (${x}, ${y})`);
        }
      }
      for (const node of drawing(f).querySelectorAll('circle')) {
        const cx = Number(node.getAttribute('cx')), cy = Number(node.getAttribute('cy')), r = Number(node.getAttribute('r'));
        assert(cx - r >= 0 && cx + r <= W && cy - r >= 0 && cy + r <= H, `${width}px ${where}: a circle leaves the picture`);
      }
    };
    for (const time of [...scene.beats, scene.duration]) { f.seek(time); inside(`${time}s`); }
    f.seek(scene.beats[1] + 1);
    // The term is cut where it leaves the bottom of the plot, never drawn below the axis.
    const ax = axes(f, k), start = curve(f, k, 'term')(0);
    close(start[1], term(start[0]), 1e-4);
    assert(Number(mark(f, 'term').getAttribute('d').match(/^M-?[\d.]+ (-?[\d.]+)/)[1]) <= Number(f.$('.df-axis').getAttribute('d').match(/^M-?[\d.]+ (-?[\d.]+)/)[1]) + 1e-3);
    assert(start[0] > k.grid[0] && start[0] < k.codes[0], 'the term starts inside the grid, left of the first code');
    for (const a of k.sweep) { drag(f, a); inside(`dragged to ${a}`); }
  }
});

test('decoder family: seeking is deterministic', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const snap = time => { f.seek(time); return canonicalMarkup(f.$('[data-pane]').innerHTML.replace(/aria-valuetext="[^"]*"/g, '')) + described(f); };
  const times = [0, 7, 12, 15.8, 16.9, 18.5, 21.3, 23.9, 26.4, 28.8, 30.5, 33, 39];
  assert.deepEqual(times.map(snap), [...times].reverse().map(snap).reverse());
});

test('decoder family: the multiple is the one control, a real range outside the transport, inert until mount', t => {
  const bare = fixture(t, NAME), control = dial(bare), css = read('decoder-family/player.css'), k = declared(bare);
  assert.equal(control.type, 'range');
  assert(!control.closest('[data-controls]'), 'a second range must never become the clock');
  assert(control.closest('[data-pane]'));
  assert.equal(bare.root.querySelectorAll('input[type="range"]').length, 2, 'the scrubber and a: a second knob would be a second scene');
  assert(control.disabled, 'inert until the player mounts');
  assert.match(css, /#decoder-family-excerpt:not\(\[data-ready\]\) \.df-dial \{ visibility:hidden; \}/, 'and hidden until then');
  assert.deepEqual([Number(control.min), Number(control.max)], k.sweep);
  assert.equal(control.step, '0.05');
  assert.deepEqual([...bare.root.querySelectorAll(`#${control.getAttribute('list')} option`)].map(option => Number(option.value)), [k.sweep[0], 0, k.sweep[1]]);
  assert.deepEqual([...bare.root.querySelectorAll('.df-dial-ends span')].map(node => node.textContent), [plain(k.sweep[0]), '0', plain(k.sweep[1])]);
  assert.equal(control.getAttribute('aria-label'), 'Multiple a of the vanishing term');
  assert.equal(bare.$(`label[for="${control.id}"]`).textContent, 'a');
  assert.equal(bare.$('[data-a-readout]').getAttribute('for'), control.id);
  const f = fixture(t, NAME); f.load(); f.open();
  assert(!dial(f).disabled);
  assert.equal(f.$('[data-a-display]').getAttribute('aria-hidden'), 'true', 'while the player runs the control itself speaks a');
  // The static attributes are the final frame's own, so the two cannot drift.
  f.seek(scene.duration);
  assert.equal(dial(f).getAttribute('aria-valuetext'), control.getAttribute('aria-valuetext'));
  assert.equal(f.$('[data-a-readout]').textContent, bare.$('[data-a-readout]').textContent);
  assert.equal(Number(dial(f).value), Number(control.getAttribute('value')));
  // The timeline drives it for the passive viewer: 0, up to the chapter's multiple, down to its
  // mirror, and home.
  for (const [time, a] of [[0, 0], [14.9, 0], [scene.beats[4] - 0.01, k.sweep[1]], [scene.beats[5] - 0.01, k.sweep[0]], [scene.duration, 0]]) {
    f.seek(time);
    close(Number(f.root.dataset.a), a, 1e-12);
    close(Number(dial(f).value), a, 0.025 + 1e-9);
    assert.equal(f.$('[data-a-readout]').textContent, two(a));
    assert.equal(f.root.dataset.override, '');
  }
});

test('decoder family: dragging the dial is a detour that the timeline ends', t => {
  const f = fixture(t, NAME), k = declared(f); f.load(); f.open();
  const slider = dial(f);
  f.seek(scene.beats[6] + 1); f.play(); assert(f.playing);
  drag(f, 0.35);
  assert(!f.playing, 'dragging pauses');
  assert.equal(f.root.dataset.override, 'dial');
  assert.equal(Number(f.root.dataset.a), 0.35);
  assert.equal(mark(f, 'curve').getAttribute('data-a'), '0.35');
  assert.equal(value(f, 'draw').textContent, two(decode(0.35, k.draw)));
  assert.equal(value(f, 'error').textContent, 'error at the codes: 0');
  assert.equal(value(f, 'top'), null, 'no fixed number at the draw that the live one could cover');
  assert.equal(value(f, 'bottom'), null);
  assert(mark(f, 'bracket') && mark(f, 'ghost-high') && mark(f, 'ghost-low'), 'the scenery the timeline reached stays');
  assert.equal(slider.getAttribute('aria-valuetext'), `a = 0.35: zero error at the codes; z = 0.5 decodes to ${two(decode(0.35, k.draw))}.`);
  assert.equal(f.$('[data-a-readout]').textContent, '0.35');
  assert.equal(f.$('[data-caption]').textContent, 'Any multiple a keeps the curve on all three codes; between and beyond them it moves.');
  assert.doesNotMatch(described(f), new RegExp(escape(two(decode(0.35, k.draw)))), 'the live value is spoken in one place, the control');
  // A key the transport ignores leaves the detour alone; a scrub ends it.
  f.key('x');
  assert.equal(f.root.dataset.override, 'dial');
  f.seek(scene.beats[6] + 1);
  assert.equal(f.root.dataset.override, '');
  assert.equal(f.root.dataset.a, '0');
  // So does play from a pause, and so does an arrow-key beat.
  drag(f, -0.6); assert.equal(f.root.dataset.override, 'dial');
  f.play(); assert.equal(f.root.dataset.override, ''); assert(f.playing); f.play();
  drag(f, 0.6); assert.equal(f.root.dataset.override, 'dial');
  f.key('ArrowLeft'); assert.equal(f.root.dataset.override, '');
  // Keys on the slider never reach the pane's beat seeking.
  const time = f.time;
  f.key('ArrowRight', slider);
  assert.equal(f.time, time);
  // Dragged while the caption asks, the reader's own experiment shows the curve and its value,
  // and the timeline's later scenery stays unshown.
  f.seek(scene.beats[2] + 1); drag(f, -0.5);
  assert.equal(value(f, 'draw').textContent, two(decode(-0.5, k.draw)));
  assert.equal(drawing(f).querySelectorAll('.df-ghost, [data-mark="bracket"]').length, 0);
});

test('decoder family: the panel is the one fixture copy', t => {
  const f = fixture(t, NAME);
  f.root.dataset.draw = '0.6';
  f.load(); f.open(); f.seek(scene.beats[3] + 3);
  const k = declared(f);
  assert.equal(value(f, 'draw').textContent, two(decode(k.sweep[1], 0.6)));
  assert.match(f.$('[data-caption]').textContent, new RegExp(`z = 0\\.6 decodes to ${escape(two(decode(k.sweep[1], 0.6)))}\\.$`));
  close(axes(f, k).v(Number(mark(f, 'dot').getAttribute('cy'))), decode(k.sweep[1], 0.6), 2e-4);
});

test('decoder family: the transcript and the caveats say what the fixture implies', t => {
  const f = fixture(t, NAME), k = declared(f);
  const items = [...f.$('#decoder-family-transcript ol').children].map(node => node.textContent);
  assert.equal(items.length, scene.beats.length, 'one line per beat');
  const [lo, hi] = k.sweep, v = a => two(decode(a, k.draw));
  assert.match(items[0], new RegExp(`z = ${escape(plain(k.draw))} it decodes to ${escape(v(0))}\\.$`));
  assert.match(items[3], new RegExp(`from 0 to ${escape(plain(hi))}.*decodes to ${escape(v(hi))}\\.$`));
  assert.match(items[4], new RegExp(`down to a = ${escape(plain(lo))}.*decodes to ${escape(v(lo))}\\.$`));
  assert(items[5].includes(`a bracket marks ${v(hi)} to ${v(lo)}`) && items[5].includes(`${plain(k.draw ** 2)} − ${plain(-term(k.draw))}a`));
  const scope = f.$('.mechanism-scope').textContent;
  assert(scope.includes(`the term is ${plain(term(k.draw))}`) && scope.includes(`${plain(k.draw ** 2)} − ${plain(-term(k.draw))}a`));
  assert(scope.includes(`targets ${k.codes.map(z => plain(z * z)).slice(0, -1).join(', ')} and ${plain(k.codes.at(-1) ** 2)}`));
  assert(scope.includes('Chapter 22 builds one'), 'the printed number of the chapter that builds a prior');
  // The one visible boundary sentence, as the author scoped it.
  const boundary = [...f.$('.mechanism-boundary').children].filter(node => node.tagName === 'P');
  assert.equal(boundary.length, 1);
  assert.equal(boundary[0].textContent, 'This family is the chapter\'s pencil example; a trained decoder is some other function, constrained by reconstruction only where codes were observed.');
  assert.equal(f.$('.mechanism-scope').open, false);
  assert.equal(f.$('#decoder-family-playback-help').textContent.includes('The multiple dial pauses playback'), true);
});

test('decoder family: the committed static print is a fresh render of the final frame', async () => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after, 'run scripts/render_static_frames.cjs decoder-family');
});

test('decoder family: the static prints carry the final frame\'s witnesses, legibly at phone width', t => {
  const f = fixture(t, NAME);
  const narrow = f.$('[data-static-frame="narrow"]');
  assert.equal(narrow.getAttribute('data-width'), '296');
  for (const print of [drawing(f), narrow]) {
    assert.deepEqual(['top', 'draw', 'bottom', 'error'].map(name => print.querySelector(`[data-value="${name}"]`).textContent),
      ['0.55', '0.25', '−0.05', 'error at the codes: 0']);
    for (const node of print.querySelectorAll('text')) assert(Number(node.getAttribute('font-size')) >= 10, `"${node.textContent}" is too small`);
  }
  const css = read('decoder-family/player.css');
  assert.match(css, /@container \(max-width:599px\) \{[^}]*aspect-ratio:296 \/ 388/);
  assert.match(css, /#decoder-family-excerpt:not\(\[data-ready\]\) \.decoder-family-figure svg \{ aspect-ratio:713 \/ 428; \}/);
});

test('decoder family: typography and inertness', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const bad = /(?<![\w.])-\d|\d-\d|\de[-+]?\d|\^|—/;
  const checkAll = where => {
    for (const node of texts(f)) assert.doesNotMatch(node.textContent, bad, `${where}: "${node.textContent}"`);
    for (const said of [described(f), dial(f).getAttribute('aria-valuetext'), scrubber(f).getAttribute('aria-valuetext'), f.$('[data-caption]').textContent])
      assert.doesNotMatch(said, bad, `${where}: "${said}"`);
  };
  for (let time = 0; time <= scene.duration + 1e-9; time += 0.5) { f.seek(Number(time.toFixed(2))); checkAll(`${time}s`); }
  for (const a of [-0.8, -0.05, 0.4]) { drag(f, a); checkAll(`dragged to ${a}`); }
  const panel = read('decoder-family/panel.html'), player = read('decoder-family/player.js');
  assert.doesNotMatch(panel, /@eq-|—/);
  assert.doesNotMatch(player, /Math\.random|fetch\(|import\(|setInterval\(/);
  assert.equal((player.match(/getBoundingClientRect/g) || []).length, 1);
  // The reader-visible prose: no exclamation, no contraction, no apparatus word, no film or
  // course wording, and a true minus wherever a number is negative.
  const bare = fixture(t, NAME), copy = bare.root.cloneNode(true);
  copy.querySelectorAll('svg, code').forEach(node => node.remove());
  const prose = copy.textContent;
  assert.doesNotMatch(prose, /!/);
  assert.doesNotMatch(prose, /\b\w+n't\b|\b(?:it|that|there|what|here|let)'s\b|'(?:re|ve|ll|d|m)\b/i);
  assert.doesNotMatch(prose, /\b(?:recap|section|subsection|table|callout|receipt|ledger)\b/i);
  assert.doesNotMatch(prose, /\b(?:film|lecture|course|students?)\b/i);
  assert.doesNotMatch(prose.replace(/\\\([\s\S]*?\\\)/g, ''), bad);
  for (const print of [bare.$('[data-drawing]'), bare.$('[data-static-frame="narrow"]')])
    for (const node of print.querySelectorAll('text')) assert.doesNotMatch(node.textContent, bad);
  assert.doesNotMatch(bare.$('[data-figure] svg').getAttribute('aria-label'), bad);
});

test('integration: the excerpt lands before the audit cell\'s Plan -> Code wrapper, after the anchor sentence', () => {
  const config = fs.readFileSync(path.join(ROOT, '_quarto.yml'), 'utf8');
  assert.match(config, /^\s+- interactives\/decoder-family\/player\.js$/m);
  const filter = fs.readFileSync(path.join(ROOT, scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/,
    'the non-HTML guard is the first executable line, so the PDF is untouched');
  assert.match(filter, /block\.classes:includes\("plan-code"\) then return holds\(block, scene\.anchor\.target\)/);
  assert.match(filter, /if scene\.anchor\.type == "before-cell" then return \{block, div\} end/);
  assert.doesNotMatch(filter, /decoder-family|decoder-ambiguity/, 'a manifest-driven filter names no scene');
  const chapter = chapterSource(NAME);
  assert.equal(scene.anchor.type, 'before-cell');
  assert.equal(scene.anchor.target, 'decoder-ambiguity-audit');
  const label = chapter.indexOf('#| label: decoder-ambiguity-audit');
  assert(label > 0 && chapter.indexOf('#| label: decoder-ambiguity-audit', label + 1) < 0, 'the audit cell is labelled once');
  const wrapper = chapter.lastIndexOf(':::: {.plan-code', label);
  const sentence = 'The reconstructions agree on every observed code, yet disagree elsewhere.';
  const at = chapter.indexOf(sentence);
  assert(at > chapter.indexOf('## A code is not yet a distribution') && at < wrapper, 'the anchor sentence precedes the wrapper');
  assert.equal(chapter.slice(at + sentence.length, wrapper).replace(/<!--[\s\S]*?-->/g, '').trim(), '',
    'so the panel lands right after that sentence');
  assert(chapter.indexOf('\n::::\n', wrapper) > label, 'and the wrapper is the one that holds the cell');
});
