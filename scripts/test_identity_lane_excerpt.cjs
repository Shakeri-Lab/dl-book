#!/usr/bin/env node
// Test-only checks for the identity-lane scene in Chapter 10
// (chapters/part2/09-modern-cnns-transfer.qmd, the residual block). Nothing here ships. The
// suite takes the gradient arriving at H(x), the three slopes and the dial's range from the
// panel's own attributes and reads the picture back out of the SVG: every copy's value is
// recovered from its drawn length on the scale under x, laid head to tail, so the printed
// "reaches x" is the length the two copies actually leave, 1 plus the slope, at every tenth
// of a second and every step of the dial, in both layouts.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, manifest, chapterSource, numbers, canonicalMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'identity-lane-excerpt', scene = entry(NAME);
const WIDTHS = [296, 375, 599, 600, 713, 900];
const MINUS = '−';
const attr = (node, key) => Number(node.getAttribute(key));
const drawing = f => f.$('[data-drawing]');
const texts = f => [...drawing(f).querySelectorAll('text')];
const value = (f, name) => drawing(f).querySelector(`[data-value="${name}"]`);
const mark = (f, name) => drawing(f).querySelector(`[data-mark="${name}"]`);
const picture = f => f.$('[data-figure] svg');
const described = f => picture(f).getAttribute('aria-label');
const dial = f => f.$('[data-slope-slider]');
const scrubbed = f => f.$('[data-controls] input[type=range]').getAttribute('aria-valuetext');
const drag = (f, slope) => { const slider = dial(f); slider.value = String(slope); slider.dispatchEvent(new f.w.Event('input')); };
const near = (a, b, epsilon, message) => assert(Math.abs(a - b) <= epsilon, `${message}: ${a} is not ${b}`);
// The book's plain-text numbers: the shortest decimal and a true minus on the picture; two
// places on the dial. Parsed back, the true minus is read first.
const shown = v => { const text = String(Number(Math.abs(v).toFixed(2))); return (v < 0 && text !== '0' ? MINUS : '') + text; };
const two = v => (v < 0 && Math.abs(v) >= 0.005 ? MINUS : '') + Math.abs(v).toFixed(2);
const parsed = text => Number(text.replace(/−/g, '-'));
const pair = (node, key) => numbers(node.getAttribute(key));

const declared = f => {
  const d = f.root.dataset;
  return {incoming: Number(d.incoming), slopes: numbers(d.slopes), range: numbers(d.range)};
};
// A drawn copy: its tail and head, as the player wrote them, and whether it is an open ring.
const copy = (f, name) => {
  const node = mark(f, name);
  if (!node) return null;
  const [tx, ty] = pair(node, 'data-tail'), [hx, hy] = pair(node, 'data-head');
  return {node, tx, ty, hx, hy, ring: node.tagName.toLowerCase() === 'circle'};
};
const scaleOf = f => {
  const node = mark(f, 'scale'), [ox, oy] = pair(node, 'data-origin');
  return {ox, oy, unit: attr(node, 'data-unit')};
};
// A laid copy's signed value, from its drawn geometry alone: positive is the way a packet
// travels, toward x and on past it, which on the picture is leftward.
const laidValue = (c, unit) => (c.tx - c.hx) / unit;
// The drawn length of an arrow: its shaft's polyline, then its head from the shaft's end.
function drawnLength(node) {
  const points = d => (d.match(/-?\d+(?:\.\d+)?/g) || []).map(Number).reduce((all, v, i, list) => (i % 2 ? all : [...all, [v, list[i + 1]]]), []);
  const shaft = node.querySelector('.il-shaft'), head = node.querySelector('.il-head');
  const [tip, b1, b2] = points(head.getAttribute('d'));
  const base = [(b1[0] + b2[0]) / 2, (b1[1] + b2[1]) / 2];
  let length = Math.hypot(tip[0] - base[0], tip[1] - base[1]);
  if (shaft) {
    const run = points(shaft.getAttribute('d'));
    for (let i = 1; i < run.length; i++) length += Math.hypot(run[i][0] - run[i - 1][0], run[i][1] - run[i - 1][1]);
  }
  return length;
}

registerTransportTests(NAME, {witness: /0\.1 reaches x/, anchors: ['identity-lane-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('identity lane: the equation and the three stops are the chapter\'s, the numbers a declared toy', t => {
  const f = fixture(t, NAME), k = declared(f), chapter = chapterSource(NAME);
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal), `the chapter no longer prints ${literal}`);
  assert.equal(f.root.dataset.evidenceClass, 'declared-toy', 'the chapter prints no Jacobian, so the values are declared');
  assert(chapter.includes('H(x) = F(x) + x'));
  // The panel's formula is the chapter's gradient line with its two terms wrapped for the wash.
  const tex = f.$('#eq-identity-lane-1').textContent;
  // \displaystyle is presentation only: the chapter sets this equation as display math.
  assert.equal(tex, '\\( \\displaystyle \\residualpart{\\frac{\\partial L}{\\partial x}} = \\residualpart{\\frac{\\partial L}{\\partial H}}\\left(\\class{il-branch}{\\frac{\\partial F}{\\partial x}} + \\class{il-lane}{I}\\right) \\)');
  const bare = tex.replace(/\\class\{[^}]*\}\{((?:[^{}]|\{[^{}]*\})*)\}/g, '$1').replace(/\\residualpart\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}/g, '$1');
  assert(bare.includes('\\frac{\\partial L}{\\partial x} = \\frac{\\partial L}{\\partial H}\\left(\\frac{\\partial F}{\\partial x} + I\\right)'), bare);
  assert(chapter.includes('= \\frac{\\partial L}{\\partial H}\\left(\\frac{\\partial F}{\\partial x} + I\\right).'));
  // Amplify, do nothing, mostly cancel: the chapter's own words for what the branch Jacobian does.
  assert(chapter.includes('the branch Jacobian, which can amplify, attenuate, or partly\ncancel that contribution.'));
  // The gradient at H already includes the final ReLU's derivative, which the panel leaves out.
  assert(chapter.includes('Here $\\partial L/\\partial H$ already includes the derivative of\nthe final ReLU.'));
  const [reinforced, nothing, cancelled] = k.slopes;
  assert(reinforced > 0, 'the first stop amplifies the identity term');
  assert.equal(nothing, 0, 'the second stop is the chapter\'s F = 0');
  assert(chapter.includes('doing nothing is easy\nto represent: $F = 0$.') || chapter.includes('to represent: $F = 0$.'));
  assert(cancelled < -0.5 && cancelled > k.range[0], 'the third stop cancels most of the identity term, but not all');
  assert.deepEqual(k.range, [-1, 1]);
  assert(k.slopes.every(s => s >= k.range[0] && s <= k.range[1]), 'every stop lies on the dial');
  assert.equal(k.incoming, 1, 'one unit of gradient arrives at H(x)');
  // The question offers the right answer and both misreadings, each computed from the fixture.
  const question = f.$('.mechanism-question').textContent;
  assert(question.includes(`local slope ${shown(cancelled)}`));
  assert(question.includes(`a gradient of ${shown(k.incoming)} arriving`));
  assert(question.includes(`all of it, ${shown(k.incoming * (1 + Math.abs(cancelled)))}, or ${shown(k.incoming * (1 + cancelled))}?`),
    'all of it (the identity alone), the magnitudes added, and 1 plus the slope');
});

test('identity lane: under x the two copies lie head to tail, and what reaches x is the length they leave', t => {
  for (const width of [713, 296]) {
    const f = fixture(t, NAME, {width}), k = declared(f); f.load(); f.open();
    let laid = 0;
    for (let step = 0; step <= scene.duration * 10; step++) {
      const time = step / 10;
      f.seek(time);
      const slope = Number(f.root.dataset.slope);
      assert.equal(value(f, 'slope').textContent, `slope ${shown(slope)}`, `the slope on F at ${time}s`);
      if (f.root.dataset.phase !== 'rows') continue;
      laid += 1;
      const {ox, oy, unit} = scaleOf(f), where = `${width}px ${time}s`;
      const lane = copy(f, 'lane-copy'), learned = copy(f, 'learned-copy'), reached = copy(f, 'reached');
      for (const c of [lane, learned, reached]) near(c.ty, c.hy, 1e-9, `${where}: a laid copy lies level`);
      near(lane.tx, ox, 1e-9, `${where}: the lane's copy starts at the origin under x`);
      near(laidValue(lane, unit), k.incoming, 1e-9, `${where}: the lane's copy is the gradient that arrived`);
      near(learned.tx, lane.hx, 1e-9, `${where}: the learned copy starts where the lane's copy ends`);
      near(laidValue(learned, unit), k.incoming * slope, 1e-9, `${where}: the learned copy is the gradient times the slope`);
      near(reached.tx, ox, 1e-9, `${where}: what reaches x starts at the origin`);
      near(reached.ty, oy, 1e-9, `${where}: and lies on the scale`);
      near(reached.hx, learned.hx, 1e-9, `${where}: and ends where the second copy ends`);
      near(laidValue(reached, unit), k.incoming * (1 + slope), 1e-9, `${where}: 1 plus the slope`);
      assert.equal(learned.ring, k.incoming * slope === 0, `${where}: a copy of exactly 0 is an open ring`);
      // The printed numbers are those lengths, read back through the true minus.
      assert.equal(value(f, 'lane-copy').textContent, `${shown(k.incoming)} along the lane`);
      assert.equal(value(f, 'learned-copy').textContent, `${shown(k.incoming * slope)} through F`);
      assert.equal(value(f, 'reached').textContent, `${shown(k.incoming * (1 + slope))} reaches x`);
      for (const [name, c] of [['lane-copy', lane], ['learned-copy', learned], ['reached', reached]]) {
        near(parsed(value(f, name).querySelector('tspan').textContent), laidValue(c, unit), 0.005, `${where}: ${name} prints its drawn length`);
      }
    }
    assert(laid > 150, `the laid copies are drawn for most of the timeline (${laid} tenths)`);
  }
});

test('identity lane: the timeline visits 0.5, 0 and −0.9, and the sweep reaches both ends of 1 plus the slope', t => {
  const f = fixture(t, NAME), k = declared(f), [s0, s1, s2] = k.slopes; f.load(); f.open();
  const reached = () => value(f, 'reached') && value(f, 'reached').textContent;
  f.seek(scene.beats[3] - 0.01);
  assert.equal(reached(), `${shown(1 + s0)} reaches x`);
  f.seek(scene.beats[4] - 0.01);
  assert.equal(reached(), `${shown(1 + s1)} reaches x`, 'F doing nothing: exactly the lane\'s 1');
  f.seek(scene.beats[6] - 0.01);
  assert.equal(reached(), `${shown(1 + s2)} reaches x`, 'mostly cancelled');
  const swept = new Map();
  for (let time = scene.beats[6]; time < scene.beats[7]; time += 0.05) {
    f.seek(Number(time.toFixed(2)));
    swept.set(Number(f.root.dataset.slope), reached());
  }
  assert.equal(swept.get(k.range[0]), `${shown(1 + k.range[0])} reaches x`, 'nothing reaches x at slope −1');
  assert.equal(swept.get(s0), `${shown(1 + s0)} reaches x`);
  assert(Math.min(...swept.keys()) === k.range[0] && Math.max(...swept.keys()) === s0, 'the sweep runs from −1 to 0.5');
  // The sweep moves in the dial's steps, so every value it shows is one the reader could set.
  const step = Number(dial(f).step);
  for (const s of swept.keys()) near(Math.round(s / step) * step, s, 1e-9, `${s} lies on the dial's grid`);
  f.seek(scene.beats[7] - 0.01);
  assert.equal(Number(f.root.dataset.slope), k.range[0], 'the sweep rests at −1, where nothing reaches x');
  f.seek(scene.beats[7] + 1);
  assert.equal(Number(f.root.dataset.slope), s2, 'the last beat brings the slope home to −0.9');
  f.seek(scene.duration);
  assert.equal(reached(), `${shown(1 + s2)} reaches x`);
});

test('identity lane: from the ask until the reveal nothing says what reaches x', t => {
  for (const reduced of [false, true]) {
    const f = fixture(t, NAME, {reduced}), k = declared(f), s2 = k.slopes[2]; f.load(); f.open();
    // The answer and the misreading that adds magnitudes, both computed from the fixture.
    const answers = [shown(k.incoming * (1 + s2)), shown(k.incoming * (1 + Math.abs(s2)))];
    const spoken = answer => new RegExp(`(^|[^\\d.])${answer.replace('.', '\\.')}(?!\\d)`);
    const pictures = new Set();
    for (let step = 0; step < (scene.beats[5] - scene.beats[4]) * 10; step++) {
      const time = Number((scene.beats[4] + step / 10).toFixed(1));
      f.seek(time);
      const where = `${reduced ? 'reduced ' : ''}${time}s`;
      assert.equal(f.$('[data-caption]').textContent, `Now the learned slope is ${shown(s2)}. How much of the ${shown(k.incoming)} reaches x?`);
      for (const name of ['lane-copy', 'learned-copy', 'reached']) assert.equal(mark(f, name), null, `${where}: ${name} is drawn`);
      assert.equal(drawing(f).querySelectorAll('[data-value="learned-copy"], [data-value="reached"], [data-value="lane-copy"]').length, 0);
      // The slope label and the dial read −0.9; the gradient of 1 waits at H(x).
      assert.equal(value(f, 'slope').textContent, `slope ${shown(s2)}`);
      assert.equal(dial(f).getAttribute('aria-valuetext'), `slope ${two(s2)}`);
      assert(mark(f, 'incoming'), `${where}: the gradient of 1 sits at H(x)`);
      assert.equal(value(f, 'incoming').textContent, shown(k.incoming));
      const said = [...texts(f).map(node => node.textContent), described(f), scrubbed(f), dial(f).getAttribute('aria-valuetext')];
      for (const text of said) {
        for (const answer of answers) assert.doesNotMatch(text, spoken(answer), `${where}: "${text}" names ${answer}`);
        assert.doesNotMatch(text, /reaches x|reach x|left at x|laid/, `${where}: "${text}" says what reaches x`);
      }
      pictures.add(canonicalMarkup(drawing(f).innerHTML) + described(f));
    }
    assert.equal(pictures.size, 1, 'the question is still: nothing moves, so no glide is on its way to the answer');
  }
});

test('identity lane: each value is stated only once its copies have arrived, and then holds', t => {
  const f = fixture(t, NAME), k = declared(f); f.load(); f.open();
  for (const [beat, slope] of [[2, k.slopes[0]], [5, k.slopes[2]]]) {
    let first = null;
    for (let time = scene.beats[beat]; time < scene.beats[beat + 1] - 1e-9; time += 0.05) {
      const at = Number(time.toFixed(2));
      f.seek(at);
      const stated = f.$('[data-caption]').textContent.includes(shown(k.incoming * (1 + slope)));
      const drawn = value(f, 'reached') !== null;
      assert.equal(stated, drawn, `${at}s: the caption states the value exactly when it is drawn`);
      if (drawn && first === null) first = at;
      if (first !== null) assert(drawn, `${at}s: the revealed value stays`);
      if (!drawn) assert.equal(texts(f).filter(node => node.textContent.includes(`${shown(k.incoming * (1 + slope))}`)).length, 0);
    }
    assert(first !== null, `beat ${beat} reveals ${shown(1 + slope)}`);
    assert(scene.beats[beat + 1] - first >= 2, `the reveal at ${first}s holds for two seconds`);
    assert(first - scene.beats[beat] >= 2, 'the copies travel before the value is stated');
  }
  // The scene's reveal follows the question after more than two still seconds.
  assert(scene.beats[5] - scene.beats[4] >= 2);
});

test('identity lane: the lane keeps its copy whole; F rescales the other inside the box, and flips it when negative', t => {
  for (const width of [713, 296]) {
    const f = fixture(t, NAME, {width}), k = declared(f); f.load(); f.open();
    const {unit} = (f.seek(0), scaleOf(f)), box = mark(f, 'branch');
    const left = attr(box, 'x'), right = left + attr(box, 'width');
    for (const [beat, slope] of [[2, k.slopes[0]], [5, k.slopes[2]]]) {
      const directions = new Set();
      let rescaled = 0;
      for (let time = scene.beats[beat]; time < scene.beats[beat + 1]; time += 0.02) {
        const at = Number(time.toFixed(2));
        f.seek(at);
        if (f.root.dataset.phase !== 'travel') continue;
        const where = `${width}px ${at}s`, lane = copy(f, 'lane-copy'), learned = copy(f, 'learned-copy');
        // The head is drawn straight where the lane bends, so its chord runs a few hundredths
        // short of the arc: a quarter of a drawing unit, against the copy's sixty or thirty.
        near(drawnLength(lane.node), k.incoming * unit, 0.25, `${where}: the lane's copy rides back unchanged`);
        if (!learned) continue;
        const length = learned.ring ? 0 : drawnLength(learned.node);
        near(learned.ty, learned.hy, 1e-9, `${where}: the copy through F stays on its wire`);
        if (length > 0.5) directions.add(Math.sign(learned.tx - learned.hx));
        const whole = Math.abs(length - k.incoming * unit) < 0.05, done = Math.abs(length - Math.abs(k.incoming * slope) * unit) < 0.05;
        if (!whole && !done) {
          rescaled += 1;
          for (const end of [learned.tx, learned.hx]) assert(end >= left - 1e-6 && end <= right + 1e-6, `${where}: the copy is rescaled only inside F`);
        }
      }
      assert(rescaled > 5, `the rescaling is seen in beat ${beat} (${rescaled} frames)`);
      assert.deepEqual([...directions].sort(), slope < 0 ? [-1, 1] : [1], `beat ${beat}: ${slope < 0 ? 'the copy flips inside F' : 'the copy keeps its direction'}`);
    }
  }
});

test('identity lane: text stays inside the picture and off its neighbours', t => {
  for (const width of WIDTHS) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    const offsets = [0, 0.5, 1.2, 2, 2.5, 3.5, 4.99];
    const probes = [...scene.beats.flatMap(beat => offsets.map(dt => beat + dt)), scene.duration].map(time => () => f.seek(Math.min(time, scene.duration)));
    for (const slope of [-1, -0.5, 0, 0.35, 1]) probes.push(() => drag(f, slope));
    probes.forEach((probe, index) => {
      probe();
      const [, , W, H] = picture(f).getAttribute('viewBox').split(/\s+/).map(Number), where = `${width}px probe ${index}`;
      const boxes = texts(f).map(node => {
        const size = attr(node, 'font-size'), anchor = node.getAttribute('text-anchor');
        const w = node.textContent.length * size * 0.56, x = attr(node, 'x'), y = attr(node, 'y');
        const leftEdge = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
        return {left: leftEdge, right: leftEdge + w, top: y - size, bottom: y + size * 0.3, text: node.textContent};
      });
      for (const b of boxes) assert(b.left >= -1 && b.right <= W + 1 && b.top >= -1 && b.bottom <= H + 1, `${where}: "${b.text}" outside`);
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        assert(Math.min(a.right, b.right) - Math.max(a.left, b.left) <= 1 || Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) <= 1,
          `${where}: "${a.text}" and "${b.text}" collide`);
      }
    });
  }
});

test('identity lane: every mark stays inside the picture, the dial\'s extremes included', t => {
  for (const width of [296, 713]) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    const inside = where => {
      const [, , W, H] = picture(f).getAttribute('viewBox').split(/\s+/).map(Number);
      for (const node of drawing(f).querySelectorAll('[data-tail]')) {
        for (const key of ['data-tail', 'data-head']) {
          const [x, y] = pair(node, key);
          assert(x >= 0 && x <= W && y >= 0 && y <= H, `${where}: ${node.getAttribute('data-mark')} ${key} ${x} ${y} outside ${W} x ${H}`);
        }
      }
      for (const node of drawing(f).querySelectorAll('rect, circle')) {
        const [x, y] = node.tagName.toLowerCase() === 'rect' ? [attr(node, 'x'), attr(node, 'y')] : [attr(node, 'cx'), attr(node, 'cy')];
        assert(x >= 0 && x <= W && y >= 0 && y <= H, `${where}: a ${node.tagName} at ${x} ${y}`);
      }
    };
    for (let time = 0; time <= scene.duration; time += 0.25) { f.seek(time); inside(`${width}px ${time}s`); }
    for (const slope of [-1, 1]) {
      drag(f, slope); inside(`${width}px dial ${slope}`);
      const {ox, unit} = scaleOf(f), reached = copy(f, 'reached');
      near(laidValue(reached, unit), 1 + slope, 1e-9, 'the scale holds the whole range');
      assert(ox - 2 * unit >= 0, 'two units of scale fit to the left of x');
    }
  }
});

test('identity lane: seeking is deterministic', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const snap = time => { f.seek(time); return canonicalMarkup(drawing(f).innerHTML) + described(f) + dial(f).getAttribute('aria-valuetext') + f.$('[data-formula]').className; };
  const times = [0, 2, 6, 7.9, 9, 11.1, 12.3, 13, 15.6, 19, 22, 25.4, 26.3, 27.5, 28, 30.4, 32.2, 34, 39];
  assert.deepEqual(times.map(snap), [...times].reverse().map(snap).reverse());
});

test('identity lane: reduced motion holds each beat\'s finished state', t => {
  const f = fixture(t, NAME, {reduced: true}), k = declared(f), [s0, s1, s2] = k.slopes, low = k.range[0]; f.load(); f.open();
  const seen = scene.beats.map(beat => { f.seek(beat); return `${f.root.dataset.slope}/${f.root.dataset.phase}`; });
  assert.deepEqual(seen, [`${s0}/block`, `${s0}/waiting`, `${s0}/rows`, `${s1}/rows`, `${s2}/arrived`, `${s2}/rows`, `${low}/rows`, `${s2}/rows`],
    'each beat holds a state of its own: the sweep rests at −1, and the last beat returns to −0.9');
  f.seek(scene.beats[2] + 1);
  assert.equal(f.$('[data-caption]').textContent, `At x the two copies add, head to tail: ${shown(1 + s0)}.`, 'the finished state\'s caption');
  f.seek(scene.beats[4] + 1);
  assert.equal(mark(f, 'reached'), null, 'the reduced ask is withheld too');
});

test('identity lane: the formula washes the term each copy travels through, and nothing while the question stands', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const lit = () => ['il-lane-lit', 'il-branch-lit'].filter(cls => f.$('[data-formula]').classList.contains(cls)).join(' ');
  for (let time = 0; time < scene.duration; time += 0.1) {
    const at = Number(time.toFixed(1));
    f.seek(at);
    const stage = Number(f.root.dataset.stage), phase = f.root.dataset.phase;
    if (['fork', 'waiting', 'travel', 'lay'].includes(phase) && f.$('[data-drawing] [data-mark="lane-copy"]')) {
      assert.equal(lit(), 'il-lane-lit il-branch-lit', `${at}s: both copies are on their routes`);
    }
    if (stage === 4) assert.equal(lit(), '', `${at}s: the question stands unlit`);
    if (stage === 3 || stage === 6) assert.equal(lit(), 'il-branch-lit', `${at}s: only the learned term is changing`);
  }
  const css = read('identity-lane/player.css');
  assert.match(css, /\[data-ready\] \.identity-lane-formula\.il-lane-lit \.il-lane \{/);
  assert.match(css, /\[data-ready\] \.identity-lane-formula\.il-branch-lit \.il-branch \{/);
});

test('identity lane: the slope is the one control, a real range outside the transport, inert until mount', t => {
  const bare = fixture(t, NAME), control = dial(bare), k = declared(bare);
  assert.equal(control.type, 'range');
  assert(!control.closest('[data-controls]'), 'a second range must never become the clock');
  assert(control.closest('[data-pane]'));
  assert.equal(bare.root.querySelectorAll('input[type="range"]').length, 2, 'the scrubber and the slope: a second knob would be a second scene');
  assert(control.disabled, 'inert until the player mounts');
  assert.match(read('identity-lane/player.css'), /#identity-lane-excerpt:not\(\[data-ready\]\) \.identity-lane-dial \{ visibility:hidden; \}/, 'and hidden until then');
  assert.deepEqual([Number(control.min), Number(control.max)], k.range);
  assert.equal(control.step, '0.05');
  assert.deepEqual([...bare.root.querySelectorAll(`#${control.getAttribute('list')} option`)].map(option => Number(option.value)), [k.range[0], 0, k.range[1]]);
  assert.deepEqual([...bare.root.querySelectorAll('.identity-lane-dial-ends span')].map(node => node.textContent), [shown(k.range[0]), '0', shown(k.range[1])]);
  assert.equal(control.getAttribute('aria-label'), 'Slope of the learned branch');
  assert.equal(bare.$(`label[for="${control.id}"]`).textContent, 'slope');
  assert.equal(bare.$('[data-slope-readout]').getAttribute('for'), control.id);
  // The static attributes are the final frame's own, so the two cannot drift.
  assert.equal(Number(control.getAttribute('value')), k.slopes[2]);
  assert.equal(control.getAttribute('aria-valuetext'), `slope ${two(k.slopes[2])}`);
  assert.equal(bare.$('[data-slope-readout]').textContent, two(k.slopes[2]));
  const before = canonicalMarkup(drawing(bare).innerHTML);
  drag(bare, 0.5);
  assert.equal(canonicalMarkup(drawing(bare).innerHTML), before, 'nothing listens to the dial before mount');
  const f = fixture(t, NAME); f.load(); f.open();
  assert(!dial(f).disabled, 'live once the player mounts');
  assert.equal(f.$('[data-slope-display]').getAttribute('aria-hidden'), 'true', 'while the player runs the control itself speaks the slope');
});

test('identity lane: the timeline drives the dial, which speaks the slope and never what reaches x', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (let step = 0; step <= scene.duration * 10; step++) {
    f.seek(step / 10);
    const slope = Number(f.root.dataset.slope);
    near(Number(dial(f).value), slope, 1e-9, `the thumb follows the timeline at ${step / 10}s`);
    assert.equal(f.$('[data-slope-readout]').textContent, two(slope));
    assert.equal(dial(f).getAttribute('aria-valuetext'), `slope ${two(slope)}`);
  }
  for (let s = -1; s <= 1 + 1e-9; s += 0.05) {
    drag(f, Number(s.toFixed(2)));
    assert.match(dial(f).getAttribute('aria-valuetext'), /^slope −?\d\.\d\d$/, 'the dial names its slope and nothing else');
  }
});

test('identity lane: dragging the dial is a detour that redraws the whole picture, and the timeline ends it', t => {
  const f = fixture(t, NAME), k = declared(f); f.load(); f.open();
  f.seek(scene.beats[3] + 1); f.play(); assert(f.playing);
  drag(f, 0.25);
  assert(!f.playing, 'dragging pauses');
  assert.equal(f.root.dataset.override, 'dial');
  assert.equal(f.root.dataset.phase, 'rows', 'the finished picture at the dragged slope');
  const {unit} = scaleOf(f);
  near(laidValue(copy(f, 'learned-copy'), unit), k.incoming * 0.25, 1e-9, 'the copy through F');
  near(laidValue(copy(f, 'reached'), unit), k.incoming * 1.25, 1e-9, 'and what reaches x');
  assert.equal(value(f, 'slope').textContent, 'slope 0.25');
  assert.equal(value(f, 'reached').textContent, '1.25 reaches x');
  assert.equal(dial(f).getAttribute('aria-valuetext'), 'slope 0.25');
  assert.equal(f.$('[data-caption]').textContent, 'The lane\'s 1 and the learned copy add: 1.25 reaches x.', 'the caption, not the dial, says what reaches x');
  assert.match(f.$('[data-formula]').className, /il-branch-lit/);
  // The dial keeps to its range and its steps.
  drag(f, 0.333); assert.equal(f.root.dataset.slope, '0.35');
  drag(f, -0.97); assert.equal(f.root.dataset.slope, '-0.95');
  // A key the transport ignores leaves the detour alone; a scrub ends it.
  f.key('x'); assert.equal(f.root.dataset.override, 'dial');
  f.seek(scene.beats[3] + 3);
  assert.equal(f.root.dataset.override, '');
  assert.equal(f.root.dataset.slope, String(k.slopes[1]), 'back on the timeline\'s own slope');
  // Play from a pause ends it too, and so does an arrow-key beat.
  drag(f, 0.8); f.play(); assert.equal(f.root.dataset.override, ''); assert(f.playing); f.play(); assert(!f.playing);
  drag(f, 0.8); assert.equal(f.root.dataset.override, 'dial');
  f.key('ArrowRight'); assert.equal(f.root.dataset.override, ''); assert.equal(f.time, scene.beats[4]);
  assert.equal(f.root.dataset.slope, String(k.slopes[2]));
  // Keys on the slider never reach the pane's beat seeking.
  const time = f.time;
  f.key('ArrowRight', dial(f)); f.key('End', dial(f)); f.key('Home', dial(f)); f.key(' ', dial(f));
  assert.equal(f.time, time); assert(!f.playing);
});

test('identity lane: the panel is the one fixture copy', t => {
  const f = fixture(t, NAME);
  f.root.dataset.slopes = '0.5 0 -0.6';
  f.load(); f.open(); f.seek(scene.duration);
  assert.equal(value(f, 'learned-copy').textContent, `${MINUS}0.6 through F`);
  assert.equal(value(f, 'reached').textContent, '0.4 reaches x');
  f.seek(scene.beats[4] + 1);
  assert.equal(f.$('[data-caption]').textContent, `Now the learned slope is ${MINUS}0.6. How much of the 1 reaches x?`);
  f.seek(scene.beats[6] - 0.05);
  assert.equal(f.$('[data-caption]').textContent, 'Added to the lane\'s 1, only 0.4 reaches x: mostly cancelled.');
});

test('identity lane: the committed static print is a fresh render of the final frame', async t => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after, 'run scripts/render_static_frames.cjs identity-lane');
  // Both prints carry the witness values: the final frame's copies and what reaches x.
  const f = fixture(t, NAME), k = declared(f);
  for (const print of [f.$('[data-drawing]'), f.$('[data-static-frame="narrow"]')]) {
    assert.equal(print.querySelector('[data-value="reached"]').textContent, `${shown(1 + k.slopes[2])} reaches x`);
    assert.equal(print.querySelector('[data-value="learned-copy"]').textContent, `${shown(k.slopes[2])} through F`);
    assert.equal(print.querySelector('[data-value="slope"]').textContent, `slope ${shown(k.slopes[2])}`);
  }
  assert.equal(f.$('[data-static-frame="narrow"]').getAttribute('data-width'), '296');
  assert.match(read('identity-lane/player.css'), /@container \(max-width:599px\)/);
});

test('identity lane: typography, voice and inertness', t => {
  const player = read('identity-lane/player.js'), panel = read('identity-lane/panel.html'), css = read('identity-lane/player.css');
  assert.doesNotMatch(player, /Math\.random|fetch\(|import\(|setInterval\(/);
  assert.equal((player.match(/getBoundingClientRect/g) || []).length, 1);
  assert.doesNotMatch(panel, /@eq-|—/);
  // Every string a reader sees or hears: the picture at each beat, its description, both
  // value texts, the caption, and the prose around the pane.
  const f = fixture(t, NAME); f.load(); f.open();
  const heard = [];
  for (const time of [...scene.beats, ...scene.beats.map(b => b + 2.5), ...scene.beats.map(b => b + 4.2), scene.duration]) {
    f.seek(Math.min(time, scene.duration));
    heard.push(...texts(f).map(node => node.textContent), described(f), dial(f).getAttribute('aria-valuetext'), scrubbed(f), f.$('[data-caption]').textContent);
  }
  drag(f, -0.35); heard.push(...texts(f).map(node => node.textContent), described(f), f.$('[data-caption]').textContent);
  const prose = [...f.root.querySelectorAll('summary, p, li')].map(node => node.textContent);
  for (const text of [...heard, ...prose]) {
    assert.doesNotMatch(text, /(?<![\w.])-\d|\d-\d|\de[-+]?\d/, `hyphen-minus or e-notation in "${text}"`);
    assert.doesNotMatch(text, /!/, `exclamation mark in "${text}"`);
    assert.doesNotMatch(text, /n't\b|\b(?:it|that|there|what|here|let|he|she)'s\b|'(?:re|ve|ll|m|d)\b/i, `contraction in "${text}"`);
    assert.doesNotMatch(text, /\b(?:recaps?|sections?|subsections?|tables?|callouts?|receipts?|ledgers?|film|lectures?|courses?|students?)\b/i, `apparatus or provenance word in "${text}"`);
  }
  // One visible boundary sentence, the scene brief's exact words; everything else closed.
  const boundary = f.root.querySelectorAll('.mechanism-boundary > p');
  assert.equal(boundary.length, 1);
  assert.equal(boundary[0].textContent, 'One number stands in for each Jacobian here; with matrices the learned term can also rotate the identity term, which a single dimension cannot show.');
  assert(boundary[0].textContent.split(/\s+/).length <= 30);
  assert.equal(f.root.querySelectorAll('.mechanism-boundary details.mechanism-scope').length, 1);
  assert(!f.$('.mechanism-scope').open && !f.$('.mechanism-check').open && !f.$('.mechanism-transcript').open);
  // The transfer check, exactly as the brief words it.
  assert.equal(f.$('.mechanism-check > summary').textContent, 'Check yourself. Two residual blocks in a row have learned slopes 0.5 and then −0.5. What reaches the first block\'s input from a gradient of 1 at the output, and what would the same blocks pass without shortcuts?');
  assert.equal(f.$('.mechanism-check > p').textContent, '0.75. Each block multiplies what arrives by 1 plus its own slope: 1.5 × 0.5 = 0.75. Without shortcuts each block passes only its slope: 0.5 × (−0.5) = −0.25, a quarter of the gradient with its sign flipped.');
  assert.equal(f.root.querySelectorAll('#identity-lane-transcript li').length, scene.beats.length, 'one transcript line per beat');
  assert.match(f.$('#identity-lane-playback-help').textContent, /The slope dial pauses playback and redraws the whole picture for the slope you choose; playing or scrubbing returns to the timeline\./);
  // Colours: the book's macro values, scoped to this scene; no reserved class names.
  for (const colour of ['#2b6cb0', '#c05621', '#2f855a', '#805ad5', '#722f37', '#232d4b']) assert(css.includes(colour), colour);
  for (const rule of css.replace(/\/\*[\s\S]*?\*\//g, '').match(/^[^@{}\s][^{}]*\{/gm)) {
    for (const selector of rule.slice(0, -1).split(',')) assert.match(selector.trim(), /^(#identity-lane-excerpt|\.identity-lane-)/, `unscoped rule ${selector}`);
  }
  assert.doesNotMatch(css + panel + player, /(?:class="|\.)column-/, "no class in Quarto's reserved column-* namespace");
  // Orange is the learned weights and nothing else: only the branch's outline wears it.
  assert.deepEqual([...css.matchAll(/^.*var\(--il-parameter\).*$/gm)].map(line => line[0].split('{')[0].trim()), ['.identity-lane-figure .il-branch-box']);
});

test('integration: the excerpt follows the residual-block figure and precedes the paragraph on the ReLU gate and the branch Jacobian', () => {
  const filter = fs.readFileSync(path.join(ROOT, scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
  assert.doesNotMatch(filter, /identity-lane|fig-residual-stream/, 'the manifest, not the filter, names the scene');
  const config = fs.readFileSync(path.join(ROOT, '_quarto.yml'), 'utf8');
  assert.match(config, /^\s+- interactives\/identity-lane\/player\.js$/m);
  assert.deepEqual(scene.anchor, {type: 'after-cell', target: 'cell-fig-residual-stream'});
  const chapter = chapterSource(NAME);
  assert.equal((chapter.match(/^#\| label: fig-residual-stream$/gm) || []).length, 1, 'the cell label occurs once');
  const cell = chapter.indexOf('#| label: fig-residual-stream');
  const equation = chapter.indexOf('$$ {#eq-residual}'), reading = chapter.indexOf('Here $\\partial L/\\partial H$ already includes the derivative of'), caveat = chapter.indexOf('cancel that contribution.');
  assert(equation >= 0 && equation < cell, 'after the residual equation');
  assert(cell < reading && reading < caveat, 'before the paragraph that reads the equation and its caveat');
  assert.doesNotMatch(chapter.slice(chapter.indexOf('```', cell + 1) + 3, reading), /\S/, 'nothing between the figure cell and that paragraph');
  // The chapter carries other panels; this one alone takes this anchor.
  const siblings = manifest.scenes.filter(other => other.qmd === scene.qmd);
  assert(siblings.length > 1, 'the chapter carries other panels too');
  assert.equal(siblings.filter(other => other.anchor.target === scene.anchor.target).length, 1, 'no other panel shares this anchor');
});
