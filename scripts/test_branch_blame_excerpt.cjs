#!/usr/bin/env node
// Test-only checks for the Chapter 5 branch-accumulation scene. Nothing here ships. The
// suite recomputes the chapter's forward pass and its backward rules from the panel's
// declared fixture, then reads the drawn picture back out of the SVG: the meter's width,
// not the state the player publishes beside it, is what a reader sees.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, close, canonicalMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'branch-blame-excerpt', scene = entry(NAME);
const WIDTHS = [296, 360, 375, 480, 560, 599, 600, 713, 900];
const PX = 1e-4;
const attr = (node, key) => Number(node.getAttribute(key));
const drawing = f => f.$('[data-drawing]');
const visible = node => node && !node.closest('[hidden]') && !node.hasAttribute('hidden');
const texts = f => [...drawing(f).querySelectorAll('text')].filter(visible);
const mark = (f, name) => drawing(f).querySelector(`[data-mark="${name}"]`);
const value = (f, name) => drawing(f).querySelector(`[data-value="${name}"]`);

// The scene's oracle, derived from the panel's attributes exactly as the chapter derives
// it: one forward pass, then the product rule and the accumulation rule.
const declared = f => {
  const d = f.root.dataset;
  return {w: Number(d.w), x: Number(d.x), b: Number(d.bias), target: Number(d.target),
    e: Number(d.e), uses: Number(d.uses), printed: d.printed};
};
const oracle = f => {
  const {w, x, b, target, e, uses} = declared(f);
  const a = 1 / (1 + e ** -(w * x + b));
  const branch = a - target;
  return {a, branch, total: uses * branch, slope: a * (1 - a),
    dw: uses * branch * a * (1 - a) * x, half: branch * a * (1 - a) * x};
};
const fixed = v => v.toFixed(4).replace('-', '−');

registerTransportTests(NAME, {witness: /0\.8219/, anchors: ['branch-blame-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('branch blame: the fixture is the chapter\'s, and the arithmetic is the chapter\'s own', t => {
  const f = fixture(t, NAME);
  const chapter = chapterSource(NAME);
  const {w, x, b, target, e, uses, printed} = declared(f);
  assert(chapter.includes(`w, x, b = Value(${w}), Value(${x.toFixed(1)}), Value(${b})`),
    'the declared w, x and b are the chapter\'s own Value() arguments');
  assert(chapter.includes(`loss = (a + (-${target})) * (a + (-${target}))`),
    'the declared target is the chapter\'s own, and it appears twice on one line');
  assert(chapter.includes(`1 / (1 + ${e} ** (-self.data))`), 'the declared e is the chapter\'s own constant');
  assert.equal(uses, 2, 'the chapter\'s line writes the activation twice');
  const o = oracle(f);
  // The product rule sends each factor the OTHER factor's value; here they are equal.
  close(o.total, uses * o.branch, PX);
  close(o.dw, uses * o.half, PX);
  // What the chapter's frozen stdout prints for micro-autograd-check.
  assert.equal(o.dw.toFixed(6), printed, 'the trunk lands on the gradient the chapter prints');
  assert(chapter.includes('self.grad += out.grad') && chapter.includes('self.grad += other.data * out.grad'),
    'both rules the scene draws accumulate rather than assign');
});

test('branch blame: the counter is written twice and never replaced', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const o = oracle(f);
  const width = () => attr(mark(f, 'fill'), 'width');
  const reading = () => Number(f.root.dataset.grad);
  f.seek(0); close(reading(), 0, PX); close(width(), 0, PX);
  f.seek(scene.beats[3]); close(reading(), o.branch, PX);   // one arrival has landed
  const half = width();
  f.seek(scene.beats[5]); close(reading(), o.total, PX);    // two arrivals have landed
  close(width(), 2 * half, PX);
  assert(half > 0, 'the first arrival is visible as length, not only as a digit');
  // Monotone across the whole timeline: an arrival adds, and nothing ever takes back.
  let previous = -1;
  for (let time = 0; time <= scene.duration; time += 0.25) {
    f.seek(Number(time.toFixed(4)));
    const now = reading();
    assert(now >= previous - PX, `the counter fell at ${time}s: ${previous} then ${now}`);
    previous = now;
  }
  close(previous, o.total, PX);
});

test('branch blame: the second reading is withheld while the caption asks for it', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const o = oracle(f);
  for (const time of [scene.beats[3], scene.beats[3] + 2, scene.beats[4] - 0.01]) {
    f.seek(time);
    assert.equal(f.root.dataset.arrivals, '1', 'exactly one arrival has landed');
    const shown = texts(f).map(node => node.textContent).join(' | ');
    assert(!shown.includes(fixed(o.total)), `the total is on the picture before its beat: ${shown}`);
    assert(shown.includes(fixed(o.branch)), 'the one arrival is shown');
  }
  f.seek(scene.beats[5]);
  assert(texts(f).map(node => node.textContent).join(' | ').includes(fixed(o.total)),
    'the total appears once the second branch has landed');
});

test('branch blame: the packet travels each channel once, and only during its own beat', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const at = () => { const p = mark(f, 'packet'); return p && [attr(p, 'cx'), attr(p, 'cy')]; };
  for (const time of [0, 2, 8, scene.beats[5] + 1, scene.duration]) { f.seek(time); assert.equal(at(), null, `a packet is drawn at ${time}s`); }
  const path = [];
  for (let time = scene.beats[2]; time < scene.beats[3]; time += 0.25) { f.seek(time); path.push(at()); }
  assert(path.every(Boolean), 'the first packet is drawn throughout its beat');
  const moved = path.slice(1).filter((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1]) > 0.5);
  assert(moved.length >= 8, 'the packet is in motion, not a reveal');
  // It travels from the product node toward the activation: leftward in the wide layout.
  assert(path.at(-1)[0] < path[0][0] - 100, 'the packet ends nearer the activation than it began');
  // The second beat's packet runs the other channel: a different route through the picture.
  f.seek(scene.beats[4] + 2); const second = at();
  f.seek(scene.beats[2] + 2); const first = at();
  assert(second && first && Math.abs(second[1] - first[1]) > 40, 'the two packets travel different channels');
});

test('branch blame: the counterfactual is a comparison, struck, and never a result', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const o = oracle(f);
  for (const time of [0, scene.beats[4], scene.beats[5] - 0.01]) {
    f.seek(time);
    assert.equal(mark(f, 'ghost'), null, `the counterfactual bar is drawn at ${time}s, before its beat`);
    assert(!texts(f).map(node => node.textContent).join(' ').includes(fixed(o.half)),
      'the halved gradient is shown before it is explained');
  }
  f.seek(scene.beats[5] + 4.99);
  const ghost = mark(f, 'ghost');
  assert(ghost, 'the counterfactual bar is drawn from its beat on');
  close(attr(ghost, 'width'), attr(mark(f, 'fill'), 'width') / 2, 0.5);
  f.seek(scene.duration);
  const struck = value(f, 'half');
  assert(struck.getAttribute('class').includes('bb-struck'), 'the counterfactual is struck where it is written');
  assert(read('branch-blame/player.css').includes('.bb-struck { fill:var(--bb-scenery); text-decoration:line-through'),
    'and the strike is a real rule, not a colour convention');
  assert(struck.textContent.includes(fixed(o.half)));
  assert(value(f, 'dw').textContent.includes(fixed(o.dw)));
  close(o.dw, 2 * o.half, PX);
});

test('branch blame: reduced motion holds each beat\'s finished state', t => {
  const f = fixture(t, NAME, {reduced: true}); f.load(); f.open();
  const o = oracle(f);
  const seen = scene.beats.map(beat => { f.seek(beat); return Number(f.root.dataset.grad); });
  assert.deepEqual(seen.map(v => v.toFixed(4)),
    [0, 0, o.branch, o.branch, o.total, o.total, o.total, o.total].map(v => v.toFixed(4)),
    'each still is the state its caption describes');
  // No half-travelled packet survives a still: a disc hovering over a node reads as a
  // stalled animation. The one still that keeps a packet is the beat whose caption says
  // one is waiting, and there it stands at the start of its channel, not part-way along.
  const waiting = scene.beats[3];
  for (const beat of scene.beats) {
    f.seek(beat);
    const packet = mark(f, 'packet');
    assert.equal(Boolean(packet), beat === waiting, `packet drawn at the ${beat}s still`);
  }
  // And the waiting packet launches from where it stood, rather than jumping back to the
  // node: checked in normal motion, where the next beat's first frames still show it.
  f.seek(waiting); const parked = [attr(mark(f, 'packet'), 'cx'), attr(mark(f, 'packet'), 'cy')];
  const moving = fixture(t, NAME); moving.load(); moving.open();
  moving.seek(scene.beats[4] + 0.05);
  const launched = [attr(mark(moving, 'packet'), 'cx'), attr(mark(moving, 'packet'), 'cy')];
  close(Math.hypot(parked[0] - launched[0], parked[1] - launched[1]), 0, 6);
});

test('branch blame: every layout keeps its text inside the picture and off its neighbours', t => {
  for (const width of WIDTHS) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    for (const time of [...scene.beats, scene.duration]) {
      f.seek(time);
      const [, , boxWidth, boxHeight] = f.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/).map(Number);
      // JSDOM lays nothing out, so a text box is estimated from its anchor and length.
      const boxes = texts(f).map(node => {
        const size = Number(node.getAttribute('font-size')), anchor = node.getAttribute('text-anchor');
        const w = node.textContent.length * size * 0.56, x = attr(node, 'x'), y = attr(node, 'y');
        const left = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
        return {left, right: left + w, top: y - size, bottom: y + size * 0.3, text: node.textContent};
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
          assert(over <= 1 || down <= 1,
            `at ${width}px, ${time}s "${a.text}" and "${b.text}" collide`);
        }
      }
    }
  }
});

test('branch blame: seeking is deterministic and the picture is rebuilt from time alone', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const snapshot = time => { f.seek(time); return canonicalMarkup(drawing(f).innerHTML); };
  const forward = [0, 7, 13, 18, 23, 28, 33, 39].map(snapshot);
  const backward = [39, 33, 28, 23, 18, 13, 7, 0].map(snapshot).reverse();
  assert.deepEqual(forward, backward, 'the same time draws the same picture whatever came before');
  const resized = fixture(t, NAME, {width: 713}); resized.load(); resized.open();
  assert.equal(snapshot(20), (resized.seek(20), canonicalMarkup(drawing(resized).innerHTML)));
});

test('branch blame: the panel is the one fixture copy -- moving it moves every number', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const before = oracle(f);
  const g = fixture(t, NAME);
  g.root.dataset.target = '0.1';
  g.load(); g.open(); g.seek(scene.duration);
  const after = oracle(g);
  assert(Math.abs(after.total - before.total) > 0.1, 'the oracle follows the panel');
  assert(drawing(g).textContent.includes(fixed(after.total)), 'and so does the picture');
  assert(!drawing(g).textContent.includes(fixed(before.total)), 'with no retyped copy of the old number left');
});

test('branch blame: the committed static print is a fresh render of the final frame', async () => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after,
    'interactives/branch-blame/panel.html is stale: run scripts/render_static_frames.cjs branch-blame');
});

test('branch blame: plain-text numbers use a true minus, and the player is inert', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (const time of [...scene.beats, scene.duration]) {
    f.seek(time);
    for (const node of texts(f)) {
      assert.doesNotMatch(node.textContent, /\de[-+]\d/, `e-notation in "${node.textContent}"`);
      assert.doesNotMatch(node.textContent, /(?<![\w∂])-\d/, `ASCII minus in "${node.textContent}"`);
      assert.doesNotMatch(node.textContent, /\^|\bexp\(/, `ASCII math in "${node.textContent}"`);
    }
  }
  const player = read('branch-blame/player.js');
  assert.doesNotMatch(player, /Math\.random|fetch\(|import\(|setInterval\(/);
  assert.doesNotMatch(read('branch-blame/panel.html'), /@eq-/);
  // Nothing measures per frame: the one getBoundingClientRect is inside measure().
  assert.equal((player.match(/getBoundingClientRect/g) || []).length, 1);
});

test('integration: the excerpt is HTML-only, manifest-driven, and declared in the config', () => {
  const filter = fs.readFileSync(path.join(ROOT, scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/,
    'the non-HTML guard is the first executable line, so the PDF is untouched');
  assert.match(filter, /pandoc\.json\.decode/, 'the scene is data in the manifest, not code in the filter');
  assert.match(filter, /"before-heading"/, 'the filter must be able to place this scene\'s anchor kind');
  assert.match(filter, /assert\(inserted == 1/);
  assert.doesNotMatch(filter, /branch|blame/i, 'a manifest-driven filter names no scene');
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
  // The scene sits between the engine that defines the accumulation rule and Rule 2,
  // which names it. That heading carries a code span, which Pandoc renders without its
  // backticks, so the manifest target carries none either.
  assert.equal(scene.anchor.type, 'before-heading');
  assert.equal(scene.anchor.target, 'torch.autograd in practice: five rules');
  const chapter = chapterSource(NAME);
  assert(chapter.includes('## `torch.autograd` in practice: five rules'));
  assert.equal(chapter.split('\n').filter(line => line.startsWith('## ')
    && line.slice(3).replace(/`/g, '').trim() === scene.anchor.target).length, 1, 'the anchor is unambiguous');
  assert(chapter.indexOf('**Rule 2 — gradients accumulate.**') > chapter.indexOf('## `torch.autograd`'),
    'the rule this scene explains is the one just past the anchor');
});
