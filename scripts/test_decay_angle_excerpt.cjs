#!/usr/bin/env node
// Test-only geometry and reveal checks for the Chapter 1 angular-responsiveness scene.
// Nothing here ships: the suite recomputes every angle, length and ratio the picture
// prints from the panel's declared fixture, and reads the drawn geometry back out of
// the SVG rather than trusting the state the player publishes beside it.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, close, canonicalMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'decay-angle-excerpt', scene = entry(NAME);
const WIDTHS = [296, 360, 375, 480, 519, 520, 600, 713, 900];
const PX = 1e-4;
const attr = (node, key) => Number(node.getAttribute(key));
const drawing = f => f.$('[data-drawing]');
const visible = node => node && !node.closest('[hidden]') && !node.hasAttribute('hidden');
const texts = f => [...drawing(f).querySelectorAll('text')].filter(visible);
const mark = (f, name) => drawing(f).querySelector(`[data-mark="${name}"]`);
// Every arrow is drawn shaft first, so its two endpoints are readable from the path.
function shaft(node) {
  const match = /^M\s+([-+\d.eE]+)\s+([-+\d.eE]+)\s+L\s+([-+\d.eE]+)\s+([-+\d.eE]+)/.exec(node.getAttribute('d'));
  assert(match, `the arrow ${node.dataset.mark} has an inspectable straight shaft`);
  return [match.slice(1, 3).map(Number), match.slice(3, 5).map(Number)];
}
const declared = f => ({
  lengths: numbers(f.root.dataset.lengths), nudge: Number(f.root.dataset.nudge),
  eta: Number(f.root.dataset.eta), lambda: Number(f.root.dataset.lambda),
  range: numbers(f.root.dataset.lengthRange), sweep: Number(f.root.dataset.sweepLength)
});
// The scene's own oracle: the exact turn, never the chapter's linear approximation.
const turn = (nudge, length) => Math.atan(nudge / length);
const deg = radians => radians * 180 / Math.PI;
const printed = value => `${value.toFixed(2)}°`;
// The local frame the player draws in: `along` the shared weight direction, `across`
// perpendicular to it. Recovered from the drawn origin and ray, so the test never
// assumes which way the picture points at a given width.
function frame(f) {
  const [origin, far] = shaft2(mark(f, 'ray'));
  const dx = far[0] - origin[0], dy = far[1] - origin[1], length = Math.hypot(dx, dy);
  const u = [dx / length, dy / length];
  const layout = f.root.dataset.layout;
  // Perpendicular: up on the page in the wide print, right in the narrow one.
  const v = layout === 'narrow' ? [-u[1], u[0]] : [u[1], -u[0]];
  return {origin, u, v, unit: Number(f.root.dataset.unit),
    local: point => [(point[0] - origin[0]) * u[0] + (point[1] - origin[1]) * u[1],
      (point[0] - origin[0]) * v[0] + (point[1] - origin[1]) * v[1]]};
}
const shaft2 = node => [[attr(node, 'x1'), attr(node, 'y1')], [attr(node, 'x2'), attr(node, 'y2')]];

registerTransportTests(NAME, {witness: /decay bought/, anchors: ['decay-angle-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('decay angle: the chapter owns the angle relation, the shrink rule and the boundary', t => {
  const f = fixture(t, NAME), chapter = chapterSource(NAME);
  assert.equal(scene.qmd, 'chapters/part1/01-linear-regression.qmd');
  assert.equal(scene.anchor.type, 'before-heading');
  assert.equal(scene.duration, 40);
  assert.deepEqual(scene.beats, [0, 5, 10, 15, 20, 25, 30, 35]);
  assert.equal(f.root.dataset.evidenceClass, 'schematic');
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal), literal);
  // The three sentences this scene is built on, in the chapter's own words.
  assert(chapter.includes('the same nudge rotates a larger\nvector less'));
  assert(chapter.includes('\\vect{w}\\leftarrow(1-2\\eta\\lambda)\\vect{w}'));
  assert(chapter.includes('it does not by itself explain or cure stalled\ntraining'));
  // The chapter, not the panel, is where the unpenalized intercept is stated.
  assert(chapter.includes('We normally do not penalize that\nintercept'));
  // The panel's own TeX mirrors the chapter's two expressions, uncoloured parts aside.
  const tex = f.formulas().map(span => span.textContent).join(' ');
  assert.match(tex, /\\norm\{\\Delta\\vect\{w\}_\{\\perp\}\}_2/);
  assert.match(tex, /\\norm\{\\vect\{w\}\}_2/);
  assert.match(tex, /\(1-2\\eta\\lambda\)/);
  assert.match(tex, /\\eta\\nabla\\loss_\{\\mathrm\{data\}\}/);
});

test('decay angle: the declared fixture is the only source of every number the picture prints', t => {
  const f = fixture(t, NAME), source = declared(f);
  assert.deepEqual(source.lengths, [1, 5]);
  close(source.nudge, 0.6);
  const factor = 1 - 2 * source.eta * source.lambda;
  close(factor, 0.4);
  assert(source.range[0] < source.range[1] && source.range[0] > 0);
  assert(source.sweep >= source.range[0] && source.sweep <= source.range[1]);
  assert(source.lengths[1] >= source.range[0] && source.lengths[1] <= source.range[1]);
  // The slider is the declared range and nothing else; the panel states the step once.
  const slider = f.$('[data-length-slider]');
  assert.equal(Number(slider.min), source.range[0]);
  assert.equal(Number(slider.max), source.range[1]);
  assert.equal(slider.step, f.root.dataset.lengthStep);
  assert.equal(Number(slider.value), source.lengths[1]);
  assert.equal(f.root.querySelectorAll('[data-controls] input[type="range"]').length, 1,
    'the transport keeps exactly one range inside its own bar');
});

test('decay angle: a fixture that cannot carry the mechanism is refused, and the print survives', t => {
  const invalid = [{nudge: '0'}, {nudge: '-0.4'}, {lengths: '0 5'}, {lengths: '1 NaN'},
    {lengthRange: '5 3'}, {lengthRange: '0 6'}, {sweepLength: '9'}, {lengths: '1 9'},
    {eta: '5'}, {lambda: '0'}, {eta: 'x'}];
  for (const change of invalid) {
    const f = fixture(t, NAME);
    Object.assign(f.root.dataset, change);
    assert.throws(() => f.load(), /decay-angle/, JSON.stringify(change));
    assert(!f.root.dataset.ready, 'a rejected fixture never mounts a player');
    assert.match(f.root.textContent, /decay bought/, 'the script-free print is left in place');
  }
});

// The whole scene in one table: what the picture must read at every declared beat.
// Angles are recomputed here from the fixture, never copied from the player.
function expected(source, factor) {
  const [short, rest] = source.lengths, n = source.nudge;
  const base = [rest, rest, rest, rest, rest, source.sweep, rest, rest];
  const decayed = [false, false, false, false, false, false, false, true];
  return base.map((length, stage) => {
    const effective = decayed[stage] ? length * factor : length;
    return {stage, base: length, effective, decayed: decayed[stage],
      shortAngle: stage >= 1 ? turn(n, short) : 0,
      longAngle: stage >= 3 ? turn(n, effective) : 0};
  });
}

test('decay angle: every beat draws the exact arctangent of the declared nudge over the declared length', t => {
  const f = fixture(t, NAME), source = declared(f), factor = 1 - 2 * source.eta * source.lambda;
  f.load(); f.open();
  for (const width of [296, 713]) {
    f.resize(width);
    for (const want of expected(source, factor)) {
      f.seek(scene.beats[want.stage]);
      close(Number(f.root.dataset.length), want.effective, 1e-12);
      close(Number(f.root.dataset.baseLength), want.base, 1e-12);
      close(Number(f.root.dataset.shortAngle), want.shortAngle, 1e-12);
      close(Number(f.root.dataset.longAngle), want.longAngle, 1e-12);
      close(Number(f.root.dataset.shrinkFactor), factor, 1e-15);
      // The drawn geometry, not the published state: read the two weight vectors back
      // out of the picture and recompute their turns from their own coordinates.
      const g = frame(f);
      const shortTip = g.local(shaft(mark(f, 'short-vector'))[1]);
      const longTip = g.local(shaft(mark(f, 'long-vector'))[1]);
      close(shortTip[0] / g.unit, source.lengths[0], PX);
      close(longTip[0] / g.unit, want.effective, PX);
      close(Math.atan2(shortTip[1], shortTip[0]), want.shortAngle, 1e-6);
      close(Math.atan2(longTip[1], longTip[0]), want.longAngle, 1e-6);
      if (want.stage >= 1) assert.equal(mark(f, 'short-angle').textContent, printed(deg(want.shortAngle)));
      if (want.stage >= 3) assert.equal(mark(f, 'long-angle').textContent, printed(deg(want.longAngle)));
      assert.equal(mark(f, 'long-length').textContent, `‖w‖ = ${want.effective.toFixed(2)}`);
      assert.equal(mark(f, 'short-length').textContent, `‖w‖ = ${source.lengths[0].toFixed(2)}`);
    }
  }
});

test('decay angle: it is one nudge — the same drawn length, perpendicular, wherever it is applied', t => {
  const f = fixture(t, NAME), source = declared(f);
  f.load(); f.open();
  for (const width of [296, 713]) {
    f.resize(width);
    const g = frame(f), full = source.nudge * g.unit;
    const seen = new Set();
    for (let n = 100; n <= 800; n++) {
      const time = n / 20;
      f.seek(time);
      const [base, head] = shaft(mark(f, 'nudge')).map(g.local);
      // Perpendicular to the shared direction: the arrow's foot is on the ray and its
      // head is directly across from it, at exactly the declared nudge, at every time.
      close(base[1], 0, PX);
      close(head[0], base[0], PX);
      close(head[1] - base[1], full, PX);
      seen.add(base[0].toFixed(2));
      // And the tip it has already been applied to sits at that same perpendicular
      // offset: the short one from five seconds, the long one once it has been nudged.
      close(g.local(shaft(mark(f, 'short-vector'))[1])[1], full, PX);
      if (time >= 15) close(g.local(shaft(mark(f, 'long-vector'))[1])[1], full, PX);
    }
    assert(seen.size > 30, 'the one nudge is carried along the ray, not teleported');
    // Both lifted tips end at one perpendicular offset: the same sideways move.
    f.seek(40);
    const shortTip = g.local(shaft(mark(f, 'short-vector'))[1]);
    const longTip = g.local(shaft(mark(f, 'long-vector'))[1]);
    close(shortTip[1], longTip[1], PX);
    close(shortTip[1], full, PX);
    assert(Math.abs(longTip[0] - shortTip[0]) > 20, 'the two tips are still at different lengths');
  }
});

test('decay angle: the shrink is radial — it changes the length by the chapter factor and not the direction', t => {
  const f = fixture(t, NAME), source = declared(f), factor = 1 - 2 * source.eta * source.lambda;
  f.load(); f.open(); f.resize(713);
  const g = frame(f);
  // Before the shrink starts, the weight rests at the declared length.
  f.seek(32.5);
  close(Number(f.root.dataset.decayProgress), 0, 1e-12);
  close(Number(f.root.dataset.length), source.lengths[1], 1e-12);
  assert(!visible(mark(f, 'predecay-stub')));
  let previous = Infinity;
  for (let n = 0; n <= 50; n++) {
    const time = 32.6 + (35 - 32.6) * n / 50;
    f.seek(time);
    const base = g.local(shaft2(mark(f, 'long-ghost'))[1]);
    // The unrotated weight stays exactly on the ray: the shrink never rotates it.
    close(base[1], 0, PX);
    assert(base[0] <= previous + PX, 'the tip only slides inward');
    previous = base[0];
    // And where it came from is marked on that same ray, at the undecayed length.
    const stub = shaft2(mark(f, 'predecay-stub')).map(g.local);
    close(stub[0][1], 0, PX); close(stub[1][1], 0, PX);
    close(stub[1][0] / g.unit, Number(f.root.dataset.baseLength), PX);
  }
  f.seek(35);
  close(Number(f.root.dataset.length), source.lengths[1] * factor, 1e-12);
  assert.equal(mark(f, 'factor').textContent, `× ${factor.toFixed(2)}`);
  // The gain the badge names is the exact ratio of the two arctangents.
  const gain = turn(source.nudge, source.lengths[1] * factor) / turn(source.nudge, source.lengths[1]);
  assert.equal(mark(f, 'ratio').textContent, `decay bought ${gain.toFixed(2)}× more turn`);
  close(gain, 2.4404204592203533, 1e-12);
});

test('decay angle: the comparison badge is the exact ratio of the two turns, at every length', t => {
  const f = fixture(t, NAME), source = declared(f);
  f.load(); f.open(); f.resize(713);
  const slider = f.$('[data-length-slider]');
  for (const time of [20, 22.5, 25, 27.5, 30]) {
    f.seek(time);
    const ratio = turn(source.nudge, source.lengths[0]) / turn(source.nudge, Number(f.root.dataset.length));
    assert.equal(mark(f, 'ratio').textContent, `the short vector turns ${ratio.toFixed(2)}× more`);
    assert(ratio > 1, 'the short weight always turns further under the same nudge');
  }
  // The ratio the chapter's linear relation would predict is the bare length ratio; the
  // drawn ratio is smaller because the drawn angle is the exact arctangent.
  f.seek(20);
  const exact = turn(source.nudge, source.lengths[0]) / turn(source.nudge, source.lengths[1]);
  const linear = source.lengths[1] / source.lengths[0];
  close(exact, 4.525030227497835, 1e-12);
  assert(exact < linear - 0.4, 'the exact ratio is visibly below the small-angle prediction');
  // Dragging the one control keeps the same identity at every reachable length.
  for (const length of [3, 3.7, 4.4, 5, 5.5, 6]) {
    slider.value = String(length);
    slider.dispatchEvent(new f.w.Event('input'));
    close(Number(f.root.dataset.baseLength), length, 1e-12);
    const ratio = turn(source.nudge, source.lengths[0]) / turn(source.nudge, length);
    assert.equal(mark(f, 'ratio').textContent, `the short vector turns ${ratio.toFixed(2)}× more`);
    assert.equal(mark(f, 'long-angle').textContent, printed(deg(turn(source.nudge, length))));
  }
});

test('decay angle: the prediction is withheld until the scene answers it, in the drawing and in speech', t => {
  const f = fixture(t, NAME), source = declared(f);
  f.load(); f.open();
  const answer = printed(deg(turn(source.nudge, source.lengths[1])));
  const range = f.$('[data-controls] input[type=range]');
  for (const width of [296, 713]) {
    f.resize(width);
    for (let time = 0; time < 12.6 - 1e-9; time += 0.05) {
      const at = Number(time.toFixed(4));
      f.seek(at);
      const g = frame(f);
      assert.equal(mark(f, 'long-angle').textContent, '·', `a long-weight angle is drawn at ${at}s`);
      assert(!visible(mark(f, 'long-angle')) && !visible(mark(f, 'long-arc')), `the long wedge is drawn at ${at}s`);
      close(g.local(shaft(mark(f, 'long-vector'))[1])[1], 0, PX);
      assert.equal(f.root.dataset.revealed, 'false');
      // Nothing spoken carries the answer either: not the picture's name, not the
      // scrubber, not the slider, not the caption.
      const spoken = [f.$('[data-figure] svg').getAttribute('aria-label'),
        range.getAttribute('aria-valuetext'), f.$('[data-length-slider]').getAttribute('aria-valuetext'),
        f.$('[data-caption]').textContent].join(' ');
      assert(!spoken.includes(answer), `the answer ${answer} is spoken at ${at}s`);
      assert(!/turns it \d/.test(spoken), `a long-weight turn is announced at ${at}s`);
    }
    // The ask stands for more than the two still seconds the contract requires.
    f.seek(5); assert.match(f.$('[data-caption]').textContent, /more, less, or the same/);
    f.seek(12.6); assert.equal(f.root.dataset.revealed, 'false');
    f.seek(12.65); assert.equal(f.root.dataset.revealed, 'true');
    f.seek(15); assert.equal(mark(f, 'long-angle').textContent, answer);
  }
});

test('decay angle: each mark appears at the beat that earns it, and never before', t => {
  const f = fixture(t, NAME);
  f.load(); f.open();
  const schedule = {'short-arc': 1, 'short-angle': 1, 'nudge-record': 2, 'long-arc': 3,
    'long-angle': 3, 'tie-label': 4, 'ratio': 4, 'factor': 6};
  for (const width of [296, 713]) {
    f.resize(width);
    for (const time of [0, 4.99, 5, 9.99, 10, 14.99, 15, 19.99, 20, 25, 29.99, 30, 32.5, 34, 35, 40]) {
      f.seek(time);
      const stage = Number(f.root.dataset.stage);
      for (const [name, from] of Object.entries(schedule)) {
        const node = mark(f, name);
        if (name === 'tie-label' && f.root.dataset.layout === 'narrow') continue;
        assert.equal(Boolean(visible(node)), stage >= from, `${name} at ${time}s, ${width}px`);
      }
      const shrinking = Number(f.root.dataset.decayProgress) > 0;
      for (const name of ['predecay-stub', 'predecay-ring', 'predecay-label'])
        assert.equal(Boolean(visible(mark(f, name))), shrinking, `${name} at ${time}s`);
      assert.equal(Boolean(visible(mark(f, 'tie'))), time >= 17.65, `tie at ${time}s`);
      assert.equal(Boolean(visible(mark(f, 'nudge'))), time >= 2.65, `nudge at ${time}s`);
      const formula = f.$('[data-formula]');
      assert.equal(formula.classList.contains('da-rule-shown'), stage >= 6);
      assert.equal(formula.classList.contains('da-shrink-lit'), stage >= 6);
      assert.equal(formula.classList.contains('da-length-lit'), stage === 5);
    }
  }
});

test('decay angle: reduced motion holds each beat as its finished state, never a half-finished one', t => {
  const f = fixture(t, NAME, {reduced: true}), source = declared(f);
  const factor = 1 - 2 * source.eta * source.lambda;
  f.load(); f.open();
  const table = expected(source, factor);
  for (const want of table) {
    const start = scene.beats[want.stage];
    const end = want.stage + 1 < scene.beats.length ? scene.beats[want.stage + 1] : 40;
    for (const time of [start, start + 0.01, (start + end) / 2, end - 0.01]) {
      f.seek(Number(time.toFixed(4)));
      close(Number(f.root.dataset.length), want.effective, 1e-12);
      close(Number(f.root.dataset.longAngle), want.longAngle, 1e-12);
      close(Number(f.root.dataset.shortAngle), want.shortAngle, 1e-12);
      // A shrink half-applied would show here as a length between the two.
      close(Number(f.root.dataset.decayProgress), want.decayed ? 1 : 0, 1e-12);
    }
  }
  // And the withheld answer is still withheld in the still that precedes the reveal.
  f.seek(12); assert.equal(f.root.dataset.revealed, 'false');
});

test('decay angle: the slider is a detour — the transport takes the timeline back', t => {
  const f = fixture(t, NAME), source = declared(f);
  f.load(); f.open(); f.seek(20);
  const slider = f.$('[data-length-slider]'), pane = f.$('[data-pane]');
  const drag = value => { slider.value = String(value); slider.dispatchEvent(new f.w.Event('input')); };
  drag(3.4);
  assert.equal(f.root.dataset.override, 'slider');
  close(Number(f.root.dataset.baseLength), 3.4, 1e-12);
  // Out-of-range requests are clamped to the declared domain, never drawn.
  drag(99); close(Number(f.root.dataset.baseLength), source.range[1], 1e-12);
  drag(-4); close(Number(f.root.dataset.baseLength), source.range[0], 1e-12);
  // A key the transport ignores leaves the detour alone; one it acts on ends it.
  drag(3.4);
  pane.dispatchEvent(new f.w.KeyboardEvent('keydown', {key: 'Tab', bubbles: true, cancelable: true}));
  assert.equal(f.root.dataset.override, 'slider');
  // A beat seek ends the detour and hands the length back to the timeline, which at the
  // next beat is mid-sweep: the drag was a detour, not a new default.
  f.key('ArrowRight');
  assert.equal(f.time, 25);
  assert.equal(f.root.dataset.override, '');
  close(Number(f.root.dataset.baseLength), source.sweep, 1e-12);
  f.key('ArrowLeft');
  close(Number(f.root.dataset.baseLength), source.lengths[1], 1e-12);
  // Dragging while the scene plays pauses it rather than fighting the clock.
  f.play(); assert(f.playing);
  drag(4.2);
  assert(!f.playing); assert.equal(f.root.dataset.override, 'slider');
  // The scene's own arrow keys never reach the pane's beat seeking.
  const before = f.time;
  slider.dispatchEvent(new f.w.KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true, cancelable: true}));
  assert.equal(f.time, before);
});

test('decay angle: arbitrary seek, drag and resize histories reproduce the same published frame', t => {
  const f = fixture(t, NAME);
  f.load(); f.open();
  const snapshot = () => JSON.stringify({
    picture: canonicalMarkup(f.$('[data-figure]').innerHTML),
    formula: canonicalMarkup(f.$('[data-formula]').outerHTML),
    caption: f.$('[data-caption]').innerHTML,
    state: Object.fromEntries(Object.entries(f.root.dataset).filter(([key]) => !['time', 'playing', 'typeset'].includes(key)))
  });
  const times = [0, 5, 8.3, 10, 12.59, 13.7, 15, 20, 23.4, 25, 30, 33.8, 35, 40];
  f.resize(713);
  const first = times.map(time => { f.seek(time); return snapshot(); });
  f.play(); f.tick(1700);
  f.resize(296); f.seek(18.4); f.resize(713);
  const slider = f.$('[data-length-slider]');
  slider.value = '3.9'; slider.dispatchEvent(new f.w.Event('input'));
  f.key('Home');
  assert.deepEqual(times.toReversed().map(time => { f.seek(time); return snapshot(); }), first.toReversed());
});

// JSDOM lays nothing out, so a label's extent is estimated from its glyph count. The
// constant is read off the browser preview: "‖w‖ = 1.00" is about 72 px at 13 px type.
const boxOf = node => {
  const size = attr(node, 'font-size'), width = node.textContent.length * size * 0.56;
  const x = attr(node, 'x'), anchor = node.getAttribute('text-anchor');
  const left = anchor === 'end' ? x - width : anchor === 'middle' ? x - width / 2 : x;
  return {left, right: left + width, top: attr(node, 'y') - size * 0.80, bottom: attr(node, 'y') + size * 0.24,
    text: node.textContent};
};
const apart = (a, b) => a.right <= b.left + 2 || b.right <= a.left + 2 || a.bottom <= b.top + 1 || b.bottom <= a.top + 1;

test('decay angle: no label meets another, and none leaves the picture, at either layout', t => {
  const f = fixture(t, NAME);
  f.load(); f.open();
  const slider = f.$('[data-length-slider]');
  for (const width of WIDTHS) {
    f.resize(width);
    const box = numbers(f.$('[data-figure] svg').getAttribute('viewBox'));
    for (const time of [0, 3.8, 5, 8.2, 10, 13.8, 15, 18.7, 20, 23.5, 25, 28.4, 30, 33.7, 35, 40]) {
      for (const length of [null, 3, 4.1, 5, 6]) {
        f.seek(time);
        if (length !== null) { slider.value = String(length); slider.dispatchEvent(new f.w.Event('input')); }
        const where = `${width}px, ${time}s, length ${length}`;
        const boxes = texts(f).map(boxOf);
        for (const node of texts(f)) assert(attr(node, 'font-size') >= 12, `small type at ${where}: ${node.textContent}`);
        for (const one of boxes) {
          assert(one.left >= -1 && one.right <= box[2] + 1, `"${one.text}" leaves the picture sideways at ${where}`);
          assert(one.top >= -1 && one.bottom <= box[3] + 1, `"${one.text}" leaves the picture vertically at ${where}`);
        }
        for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++)
          assert(apart(boxes[i], boxes[j]), `"${boxes[i].text}" meets "${boxes[j].text}" at ${where}`);
      }
      f.key('Home');
    }
  }
});

test('decay angle: both layouts draw the same mechanism, and the viewBox follows the measurement', t => {
  const f = fixture(t, NAME), source = declared(f);
  f.load(); f.open();
  const svg = f.$('[data-figure] svg');
  assert.equal(svg.getAttribute('preserveAspectRatio'), 'xMinYMin meet');
  for (const width of WIDTHS) {
    f.resize(width);
    const narrow = width < 520;
    assert.equal(f.root.dataset.layout, narrow ? 'narrow' : 'wide');
    assert.deepEqual(numbers(svg.getAttribute('viewBox')), narrow ? [0, 0, 296, 506] : [0, 0, 713, 256]);
    f.seek(40);
    // The turn is a property of the fixture, not of the page: both layouts print it.
    assert.equal(mark(f, 'short-angle').textContent, printed(deg(turn(source.nudge, source.lengths[0]))));
    const g = frame(f);
    // The perpendicular axis leaves the ray on the nudge's side in both prints.
    const head = g.local(shaft(mark(f, 'nudge'))[1]);
    assert(head[1] > 0, `the nudge points across the ray at ${width}px`);
    assert(drawing(f).querySelectorAll('*').length < 40, 'the picture stays a picture, not a diagram of marks');
  }
});

test('decay angle: the panel is honest about drawing the exact angle where the chapter writes an approximation', t => {
  const f = fixture(t, NAME), source = declared(f);
  const scope = f.$('.mechanism-scope').textContent;
  const [short, long] = source.lengths, n = source.nudge;
  // The four numbers the scope quotes, recomputed: exact arctangent against the
  // chapter's linear estimate, at the long weight and at the short one.
  for (const value of [deg(turn(n, long)), deg(n / long), deg(turn(n, short)), deg(n / short)])
    assert(scope.includes(value.toFixed(2)), `the scope quotes ${value.toFixed(2)}`);
  assert(deg(n / long) - deg(turn(n, long)) < 0.05, 'the estimate is tight for the long weight');
  assert(deg(n / short) - deg(turn(n, short)) > 3, 'and visibly loose for the short one');
  assert.match(scope, /small-angle form/);
  assert.match(scope, /arctangent/);
  assert.match(scope, /declared computed variants/);
  assert.match(scope, /per-step factor is far closer to one/);
  assert.match(scope, /bias and normalization parameters are commonly exempted/);
  assert.match(scope, /Nothing here is trained/);
  // The one visible sentence is the chapter's own disclaimer, not a softened version.
  const lead = f.$('.mechanism-boundary > p').textContent;
  assert.match(lead, /does not by itself explain or cure stalled training/);
  assert.match(lead, /steering, not stalling/);
  assert(lead.split(/\s+/).length <= 32, 'the visible boundary is one sentence');
});

test('decay angle: wide and narrow script-free prints reproduce the final calculated geometry', async t => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after, 'regenerate the decay-angle static frames');
  const f = fixture(t, NAME), narrow = f.$('[data-static-frame="narrow"]');
  assert(narrow); assert.equal(narrow.dataset.width, '296'); assert.equal(narrow.dataset.height, '506');
  const ids = [...f.root.querySelectorAll('[id]')].map(node => node.id);
  assert.equal(ids.length, new Set(ids).size, 'the two prints share no element id');
  for (const print of [drawing(f), narrow]) {
    assert.match(print.textContent, /decay bought 2\.44× more turn/);
    assert.match(print.textContent, /16\.70°/); assert.match(print.textContent, /30\.96°/);
    assert.match(print.textContent, /× 0\.40/); assert.match(print.textContent, /before decay/);
  }
  const css = read('decay-angle/player.css');
  assert.match(css, /@container\s*\(max-width:\s*519px\)/);
  assert.match(css, /aspect-ratio:\s*296\s*\/\s*506/);
  assert.match(css, /aspect-ratio:\s*713\s*\/\s*256/);
  f.load(); f.open(); f.resize(296);
  assert.equal(f.root.querySelectorAll('[data-static-frame="narrow"]').length, 0);
  assert.equal(drawing(f).querySelectorAll('[data-mark]').length,
    new Set([...drawing(f).querySelectorAll('[data-mark]')].map(n => n.dataset.mark)).size,
    'mounting does not leave a second copy of the printed marks behind');
});

test('decay angle: plain-text numbers use a true minus and a degree sign, never e-notation', t => {
  const f = fixture(t, NAME);
  f.load(); f.open();
  for (const time of [...scene.beats, 40]) {
    f.seek(time);
    for (const node of texts(f)) {
      assert.doesNotMatch(node.textContent, /\de[-+]\d/, `e-notation in "${node.textContent}"`);
      assert.doesNotMatch(node.textContent, /(?<![\w‖])-\d/, `ASCII minus in "${node.textContent}"`);
      assert.doesNotMatch(node.textContent, /\^|\bexp\(/, `ASCII math in "${node.textContent}"`);
    }
  }
  assert.doesNotMatch(read('decay-angle/player.js'), /Math\.random|fetch\(|import\(|setInterval\(/);
  assert.doesNotMatch(read('decay-angle/panel.html'), /@eq-/);
  const filter = fs.readFileSync(path.join(ROOT, scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
});
