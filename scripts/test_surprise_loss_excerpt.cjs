#!/usr/bin/env node
// Test-only arithmetic, geometry and reveal checks for the Chapter 2 surprise-loss excerpt.
// Nothing here ships: the suite recomputes the belief schedule and every loss from the
// panel's declared attributes and compares them with what the mounted player publishes and
// draws. The chapter owns the binary cross-entropy and its reading as surprise; the
// schedule of beliefs is a declared computed variant and is treated as one.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, close, canonicalMarkup, drawnMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'surprise-loss-excerpt', scene = entry(NAME);
const WIDTHS = [296, 360, 460, 519, 520, 640, 713];
// Drawing coordinates are serialised at 0.0001 px; the published state is never rounded.
const PX = 1e-4;
const B = scene.beats, D = scene.duration;
// One landmark belief per stair, and the moment the timeline reaches it.
const STEP_AT = [(B[1] + B[2]) / 2, B[2], (B[3] + B[4]) / 2, B[4], B[6], B[7], D];
// A glide beat rests on its finished state, so every reduced-motion still is the picture
// its own caption is about.
const REST = [B[0], B[2], B[2], B[4], B[4], B[6], B[7], D];

const lossOf = belief => -Math.log(belief);
const ghostOf = belief => -Math.log(1 - belief);
const attr = (node, key) => Number(node.getAttribute(key));
const visible = node => Boolean(node) && !node.closest('[hidden]');
const drawing = f => f.$('[data-drawing]');
const declared = f => ({
  label: Number(f.root.dataset.label), ladder: numbers(f.root.dataset.ladder),
  halved: numbers(f.root.dataset.halved), hedge: Number(f.root.dataset.hedge),
  lossTop: Number(f.root.dataset.lossTop), samples: Number(f.root.dataset.samples),
  range: numbers(f.root.dataset.beliefRange), step: Number(f.root.dataset.beliefStep)
});
const steps = source => [...source.ladder, ...source.halved];
const published = f => ({
  stage: Number(f.root.dataset.stage), belief: Number(f.root.dataset.belief),
  loss: Number(f.root.dataset.loss), earned: Number(f.root.dataset.earned),
  revealed: f.root.dataset.revealed === 'true', asking: f.root.dataset.asking === 'true',
  atHedge: f.root.dataset.atHedge === 'true'
});
// The schedule, reimplemented: two equal decrements a beat, a hold on the hedge, two more,
// a hold to predict on, then one halving per beat to the end.
const ease = u => (1 - Math.cos(Math.PI * Math.max(0, Math.min(1, u)))) / 2;
const mix = (u, a, b) => u === 0 ? a : u === 1 ? b : a + u * (b - a);
const keys = source => {
  const L = source.ladder, H = source.halved;
  return [[B[0], L[0]], [B[1], L[0]], [(B[1] + B[2]) / 2, L[1]], [B[2], L[2]], [B[3], L[2]],
    [(B[3] + B[4]) / 2, L[3]], [B[4], L[4]], [B[5], L[4]],
    [B[6], H[0]], [B[7], H[1]], [D, H[2]]];
};
function schedule(source, time) {
  const table = keys(source);
  for (let i = 1; i < table.length; i++)
    if (time < table[i][0])
      return mix(ease((time - table[i - 1][0]) / (table[i][0] - table[i - 1][0])),
        table[i - 1][1], table[i][1]);
  return table[table.length - 1][1];
}
// Screen geometry, from the layout the player publishes.
const frame = f => JSON.parse(f.root.dataset.plot);
const toX = (g, belief) => g.left + belief * g.width;
const toY = (g, loss) => g.top + g.height * (1 - loss / g.lossTop);
// JSDOM lays nothing out, so a label's box is estimated from its own content at the ratio
// the player uses and the browser preview confirmed: about 0.55 em per character.
const boxes = f => [...drawing(f).querySelectorAll('text')].filter(visible)
  .filter(node => node.textContent.length).map(node => {
    const size = attr(node, 'font-size'), width = node.textContent.length * size * 0.55 + 3;
    const x = attr(node, 'x'), anchor = node.getAttribute('text-anchor');
    const left = anchor === 'start' ? x : anchor === 'end' ? x - width : x - width / 2;
    return {text: node.textContent, size, left, right: left + width,
      top: attr(node, 'y') - size * 0.8, bottom: attr(node, 'y') + size * 0.25};
  });
function mount(t, changes, options = {}) {
  const f = fixture(t, NAME, options);
  for (const [key, value] of Object.entries(changes)) f.root.dataset[key] = String(value);
  return f;
}

registerTransportTests(NAME, {witness: /4\.3820/, anchors: ['surprise-loss-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('surprise loss: the chapter owns the formula; the belief schedule is a declared variant', t => {
  const f = fixture(t, NAME), source = declared(f), chapter = chapterSource(NAME);
  assert.equal(scene.qmd, 'chapters/part1/02-logistic-softmax.qmd');
  assert.equal(scene.anchor.type, 'before-heading');
  assert.equal(scene.anchor.target, 'The beautiful gradient');
  assert.match(chapter, /^### The beautiful gradient$/m, 'the anchored heading is in the chapter');
  assert.equal(scene.duration, 40);
  assert.deepEqual(scene.beats, [0, 5, 10, 15, 20, 25, 30, 35]);
  assert.equal(f.root.dataset.evidenceClass, 'computed');
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal), literal);
  // The three sentences this scene exists to make visible, and the section it must not do.
  assert.match(chapter, /explodes as that belief goes to zero\. A/);
  assert.match(chapter, /\nconfident wrong answer is punished without mercy/);
  assert.match(chapter, /\\frac\{\\partial \\loss\}\{\\partial o\} = \\hat\{p\} - y/);
  // The panel links the chapter's own equations rather than printing a guessed number.
  const panel = read('surprise-loss/panel.html');
  assert.doesNotMatch(panel, /@eq-/);
  assert.match(panel, /href="#eq-bce"/);
  assert(chapter.includes('{#eq-bce}') && chapter.includes('{#eq-bce-grad}'));
  // The scene's own contract: equal decrements, exact halvings, and a hedge at one half.
  assert.equal(source.label, 1, 'a hard label, which is what switches one term off');
  assert.equal(source.ladder.length, 5);
  assert.equal(source.halved.length, 3);
  const drop = source.ladder[0] - source.ladder[1];
  for (let i = 1; i < source.ladder.length; i++)
    close(source.ladder[i - 1] - source.ladder[i], drop, 1e-12, `ladder step ${i}`);
  const chain = [source.ladder.at(-1), ...source.halved];
  for (let i = 1; i < chain.length; i++)
    assert.equal(chain[i], chain[i - 1] / 2, 'exactly half, not nearly half');
  assert.equal(source.hedge, 0.5);
  assert(source.ladder.includes(source.hedge));
  // Every declared belief is reachable by the control, and the ruler holds every loss.
  for (const belief of steps(source)) {
    assert(belief > 0 && belief < 1, String(belief));
    close(Math.round((belief - source.range[0]) / source.step),
      (belief - source.range[0]) / source.step, 1e-9, `${belief} is on the control step`);
    assert(lossOf(belief) <= source.lossTop, `${belief} runs off the ruler`);
  }
  assert(lossOf(source.range[0]) <= source.lossTop, 'a drag must not run off the ruler');
});

test('surprise loss: the loss is exactly minus the natural log of the belief, at every instant', t => {
  const f = fixture(t, NAME, {width: 713}), source = declared(f); f.load(); f.open();
  const seen = new Set();
  for (let n = 0; n <= 800; n++) {
    const time = Number((n / 20).toFixed(4)); f.seek(time);
    const state = published(f), want = schedule(source, time);
    close(state.belief, want, 1e-12, `belief at ${time}s`);
    assert.equal(state.loss, -Math.log(state.belief), `loss at ${time}s`);
    // A loss is unbounded above while its belief is bounded by one: the scene's boundary.
    assert(state.belief > 0 && state.belief < 1, `belief leaves (0, 1) at ${time}s`);
    assert(state.loss > 0, `loss is not positive at ${time}s`);
    seen.add(state.belief);
  }
  assert(seen.size > 200, 'the belief really travels');
  assert.equal(Math.max(...seen), source.ladder[0], 'it starts where the fixture says');
  assert.equal(Math.min(...seen), source.halved.at(-1), 'and ends where the fixture says');
  // The hedge is an identity in this arithmetic, not an approximation.
  assert.equal(lossOf(source.hedge), Math.log(2));
  close(Math.log(2), 0.6931471805599453, 1e-16);
});

test('surprise loss: equal steps down in belief cost more and more; halvings cost the same', t => {
  const f = fixture(t, NAME, {width: 713}), source = declared(f); f.load(); f.open();
  const landmarks = [];
  f.seek(0); landmarks.push(published(f));
  for (const moment of STEP_AT) { f.seek(moment); landmarks.push(published(f)); }
  assert.deepEqual(landmarks.map(state => state.belief), steps(source));
  for (const [index, state] of landmarks.entries())
    assert.equal(state.earned, index, `stair ${index} is earned exactly when its belief lands`);
  const risers = landmarks.slice(1).map((state, i) => state.loss - landmarks[i].loss);
  const treads = landmarks.slice(1).map((state, i) => landmarks[i].belief - state.belief);
  const cut = source.ladder.length - 1;
  // Four equal treads, and risers that climb without stopping: the loss is not a distance.
  for (const tread of treads.slice(0, cut)) close(tread, treads[0], 1e-12, 'the treads are equal');
  for (let i = 1; i < cut; i++)
    assert(risers[i] > risers[i - 1], `riser ${i} did not cost more than riser ${i - 1}`);
  assert(risers[cut - 1] > 4 * risers[0], 'the last equal step must cost several times the first');
  close(risers[cut - 1] / risers[0], 4.371465244487029, 1e-9);
  // Then treads that halve, and risers that do not change at all: each one is exactly log 2,
  // the hedge's own price, which is the whole payoff.
  assert.equal(treads[cut], source.ladder.at(-1) / 2, 'the first halving halves the belief');
  for (let i = cut + 1; i < treads.length; i++)
    assert.equal(treads[i], treads[i - 1] / 2, `tread ${i} is not half of tread ${i - 1}`);
  for (let i = cut; i < risers.length; i++) {
    close(risers[i], Math.log(2), 1e-15, `halving ${i} did not cost log 2`);
    close(risers[i], lossOf(source.hedge), 1e-15, 'a halving costs exactly one hedge');
  }
  // What the picture prints is those risers, to four places, with no sign trouble.
  const g = frame(f);
  for (const [index, riser] of risers.entries()) {
    assert.equal(f.$(`[data-value="riser${index}"]`).textContent, `+${riser.toFixed(4)}`);
    // Each bracket spans exactly the two losses it measures, and sits at its own belief.
    const bar = f.$(`[data-riser="${index}"]`).getAttribute('d');
    const ys = [...bar.matchAll(/[ML] [-\d.]+ ([-\d.]+)/g)].map(m => Number(m[1]));
    close(Math.max(...ys) - Math.min(...ys), riser * g.height / g.lossTop, PX, `bracket ${index}`);
    close(Math.min(...ys), toY(g, landmarks[index + 1].loss), PX, `bracket ${index} top`);
    // …and the tread is exactly as wide as the step in belief that earned it.
    const tread = f.$(`[data-tread="${index}"]`);
    close(attr(tread, 'y1'), attr(tread, 'y2'), PX, 'a tread is level');
    close(attr(tread, 'y1'), toY(g, landmarks[index].loss), PX, `tread ${index} height`);
    close(Math.abs(attr(tread, 'x2') - attr(tread, 'x1')), treads[index] * g.width, PX,
      `tread ${index} width`);
  }
});

test('surprise loss: the arm, the curve and the ruler draw the same published numbers', t => {
  for (const width of WIDTHS) {
    const f = fixture(t, NAME, {width}), source = declared(f); f.load(); f.open();
    for (const time of [0, 5, 7.5, 10, 15, 17.5, 20, 25, 27.5, 30, 32.5, 35, 37.5, 40]) {
      f.seek(time);
      const state = published(f), g = frame(f), where = `${width}px, ${time}s`;
      const x = toX(g, state.belief), y = toY(g, state.loss);
      // The arm's LENGTH is the loss: it stands on the belief axis and reaches the curve.
      const arm = f.$('[data-arm]');
      close(attr(arm, 'x1'), x, PX, `arm foot at ${where}`);
      close(attr(arm, 'x2'), x, PX);
      close(attr(arm, 'y1'), toY(g, 0), PX, `the arm stands on zero at ${where}`);
      close(attr(arm, 'y2'), y, PX);
      close(Math.abs(attr(arm, 'y1') - attr(arm, 'y2')), state.loss * g.height / g.lossTop,
        1e-3, `the arm's length is the loss at ${where}`);
      // The same belief seen twice more: a green foot on the axis, a wine point on the curve.
      close(attr(f.$('[data-foot]'), 'cx'), x, PX);
      close(attr(f.$('[data-foot]'), 'cy'), toY(g, 0), PX);
      close(attr(f.$('[data-point]'), 'cx'), x, PX, `curve point at ${where}`);
      close(attr(f.$('[data-point]'), 'cy'), y, PX);
      const reads = f.$('[data-read]');
      close(attr(reads, 'x1'), x, PX); close(attr(reads, 'x2'), g.left, PX);
      close(attr(reads, 'y1'), y, PX); close(attr(reads, 'y2'), y, PX);
      assert.equal(f.$('[data-value="belief"]').textContent, state.belief.toFixed(4));
      assert.equal(f.$('[data-value="loss"]').textContent, state.loss.toFixed(4));
    }
    // Both branches are the chapter's two terms, sampled and read back off the drawn axis.
    const g = frame(f);
    for (const [selector, f2] of [['[data-active-curve]', lossOf], ['[data-ghost-curve]', ghostOf]]) {
      const points = [...f.$(selector).getAttribute('d').matchAll(/[ML] ([-\d.]+) ([-\d.]+)/g)]
        .map(m => [Number(m[1]), Number(m[2])]);
      assert.equal(points.length, source.samples, `${selector} at ${width}px`);
      for (const [pxx, pyy] of points) {
        const belief = (pxx - g.left) / g.width;
        close(pyy, toY(g, Math.min(f2(belief), g.lossTop)), 2e-3, `${selector} at ${width}px`);
        assert(pyy >= g.top - PX && pyy <= g.top + g.height + PX, 'the branch stays on the ruler');
      }
    }
    // They cross at the hedge, which is the one place the two terms cost the same.
    close(ghostOf(source.hedge), lossOf(source.hedge), 1e-15);
    close(attr(f.$('[data-cross-ring]'), 'cx'), toX(g, source.hedge), PX);
    close(attr(f.$('[data-cross-ring]'), 'cy'), toY(g, Math.log(2)), PX);
  }
});

test('surprise loss: the answer is absent while the caption asks the reader to predict', t => {
  const f = fixture(t, NAME, {width: 713}), source = declared(f); f.load(); f.open();
  const range = f.$('[data-controls] input[type=range]');
  const halved = lossOf(source.halved[0]);
  for (let n = 0; n < 100; n++) {
    const time = Number((B[4] + n * 0.05).toFixed(4)); f.seek(time);
    const state = published(f);
    assert.equal(state.belief, source.ladder.at(-1), `the belief has already moved at ${time}s`);
    assert.equal(state.earned, source.ladder.length - 1, `a halving leaks at ${time}s`);
    assert.equal(state.asking, true);
    assert.equal(f.$('[data-value="loss"]').textContent, '2.3026');
    assert(visible(f.$('[data-ask-guide]')) && visible(f.$('[data-name="ask"]')));
    for (let index = source.ladder.length - 1; index < 7; index++)
      assert(!visible(f.$(`[data-riser="${index}"]`)), `riser ${index} leaks at ${time}s`);
    // What rule 7 names: the drawing a reader can actually see, the picture's accessible
    // name, the scrubber's value text, and the caption. The caption is allowed to ask
    // "does the loss double?"; nothing is allowed to answer it.
    const seen = [...drawing(f).querySelectorAll('text')].filter(visible)
      .map(node => node.textContent).join(' ');
    const spoken = `${f.$('[data-figure] svg').getAttribute('aria-label')} `
      + `${range.getAttribute('aria-valuetext')} ${seen}`;
    assert(!spoken.includes(halved.toFixed(4)), `the halved loss leaks at ${time}s`);
    assert(!f.$('[data-caption]').textContent.includes(halved.toFixed(4)));
    assert.doesNotMatch(spoken, /\+0\.6931|2\.9957|adds the same|same amount|not a doubling/i,
      `the answer leaks at ${time}s`);
  }
  assert.match(drawnMarkup(f), /data-caption/, 'the caption is part of the pane the harness compares');
  assert.match(f.$('[data-caption]').textContent, /Does the loss double\?$/);
  // The reveal comes after five still seconds, and the riser that carries it lands on its beat.
  f.seek(B[5]); assert.equal(published(f).earned, source.ladder.length - 1);
  f.seek(B[6]);
  assert.equal(published(f).earned, source.ladder.length);
  assert.equal(f.$('[data-value="loss"]').textContent, halved.toFixed(4));
  assert.equal(f.$('[data-value="riser4"]').textContent, '+0.6931');
  assert.match(f.$('[data-caption]').textContent, /^It added log 2, not a doubling/);
});

test('surprise loss: each mark and wash appears in its own beat and not before', t => {
  const f = fixture(t, NAME, {width: 713}), source = declared(f); f.load(); f.open();
  for (const time of [0, 2.5, 9.99, 10, 12.5, 15, 19.99, 20, 22.5, 25, 30, 35, 37.5, 40]) {
    f.seek(time);
    const state = published(f);
    for (const selector of ['[data-hedge-rule]', '[data-hedge-drop]', '[data-cross-ring]'])
      assert.equal(visible(f.$(selector)), time >= B[2], `${selector} at ${time}s`);
    assert.equal(f.$('[data-name="hedge"]').textContent === 'log 2', time >= B[2]);
    for (const selector of ['[data-ask-guide]', '[data-name="ask"]'])
      assert.equal(visible(f.$(selector)), time >= B[4] && time < B[5], `${selector} at ${time}s`);
    for (const [index, moment] of STEP_AT.entries())
      for (const selector of [`[data-tread="${index}"]`, `[data-riser="${index}"]`,
        `[data-value="riser${index}"]`])
        assert.equal(visible(f.$(selector)), time >= moment, `${selector} at ${time}s`);
    // The picture's own values are never a fake zero and never wait for a beat.
    for (const key of ['belief', 'loss'])
      assert.notEqual(f.$(`[data-value="${key}"]`).textContent, '·');
    const formula = f.$('[data-formula]');
    assert.equal(formula.classList.contains('sl-hedge-shown'), time >= B[2]);
    assert.equal(formula.classList.contains('sl-at-hedge'), time >= B[2] && state.belief === source.hedge);
    // The live term is washed exactly while the belief is worse than the hedge.
    assert.equal(formula.classList.contains('sl-deep'), state.belief < source.hedge);
    // The dead term is struck by the stylesheet, always: a hard label never revives it.
    assert.match(read('surprise-loss/panel.html'), /\\class\{sl-dead\}/);
  }
  // Only one term is ever active here, so the other branch is scenery from first frame to last.
  for (const time of [0, 20, 40]) {
    f.seek(time);
    assert(visible(f.$('[data-ghost-curve]')), `the y = 0 term is drawn at ${time}s`);
    assert.equal(f.$('[data-name="ghost"]').textContent, 'y = 0 term × 0');
  }
});

test('surprise loss: reduced motion rests each beat on one still the caption is true of', t => {
  const f = fixture(t, NAME, {reduced: true, width: 713}), source = declared(f); f.load(); f.open();
  for (let index = 0; index < B.length; index++) {
    const end = index + 1 < B.length ? B[index + 1] : D, want = schedule(source, REST[index]);
    for (let time = B[index]; time < end - 1e-9; time = Number((time + 0.25).toFixed(4))) {
      f.seek(time);
      const state = published(f);
      assert.equal(state.stage, index);
      close(state.belief, want, 1e-12, `beat ${index} still at ${time}s`);
      assert.equal(state.loss, lossOf(state.belief));
    }
  }
  // The stills the captions promise: a hedge to stand on, a frozen predict beat with no
  // answer, and a last still that already carries all seven stairs.
  f.seek(12.5);
  assert.equal(published(f).belief, source.hedge);
  assert.equal(published(f).loss, Math.log(2));
  assert.equal(published(f).revealed, true);
  f.seek(22.5);
  assert.equal(published(f).belief, source.ladder.at(-1));
  assert.equal(published(f).asking, true);
  assert.equal(published(f).earned, source.ladder.length - 1);
  f.seek(27.5); assert.equal(published(f).belief, source.halved[0]);
  f.seek(32.5); assert.equal(published(f).belief, source.halved[1]);
  f.seek(37.5);
  assert.equal(published(f).belief, source.halved.at(-1));
  assert.equal(published(f).earned, STEP_AT.length);
});

test('surprise loss: the one control is timeline-driven, and a drag is a detour', t => {
  const f = fixture(t, NAME, {width: 713}), source = declared(f); f.load(); f.open();
  const slider = f.$('[data-belief-slider]');
  assert.equal(f.root.querySelectorAll('[data-pane] input[type="range"]').length, 2);
  assert.equal(slider.closest('[data-controls]'), null, 'a second range can never become the clock');
  assert.equal(slider.min, String(source.range[0]));
  assert.equal(slider.max, String(source.range[1]));
  assert.equal(slider.step, String(source.step));
  assert.equal(f.$('[data-belief-display]').getAttribute('aria-hidden'), 'true');
  f.seek(D); assert.equal(Number(slider.value), source.halved.at(-1));
  assert.equal(f.$('[data-belief-readout]').textContent, '0.0125');
  f.seek(B[2]); assert.equal(Number(slider.value), source.hedge);
  assert.equal(f.$('[data-belief-readout]').textContent, '0.5000');
  // Dragging pauses playback and recomputes the whole picture from the dragged belief.
  f.seek(12); f.play(); assert(f.playing);
  slider.value = String(source.range[0]); slider.dispatchEvent(new f.w.Event('input'));
  assert(!f.playing); assert.equal(f.root.dataset.override, 'slider');
  const dragged = published(f);
  assert.equal(dragged.belief, source.range[0]);
  assert.equal(dragged.loss, lossOf(source.range[0]));
  assert(dragged.loss <= source.lossTop, 'the arm stays on the ruler at the control floor');
  assert.match(f.$('[data-caption]').textContent, /You are moving the belief/);
  // A drag never earns a stair: the staircase is the timeline's record.
  assert.equal(f.root.dataset.earned, '2');
  // Its own keys never reach the pane's beat seeking, and never end the detour.
  const parked = f.time;
  f.key('ArrowRight', slider); f.key('End', slider);
  assert.equal(f.time, parked); assert.equal(f.root.dataset.override, 'slider');
  // Any timeline action restores the timeline's own value: the drag was a detour.
  f.key('ArrowRight');
  assert.equal(f.root.dataset.override, '');
  close(published(f).belief, schedule(source, f.time), 1e-12);
  slider.value = String(source.range[1]); slider.dispatchEvent(new f.w.Event('input'));
  assert.equal(published(f).belief, source.range[1]);
  f.seek(30); assert.equal(f.root.dataset.override, '');
  close(published(f).belief, schedule(source, 30), 1e-12);
});

test('surprise loss: every label stays inside the picture and clear of every other label', t => {
  for (const width of WIDTHS) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    for (let n = 0; n <= 80; n++) {
      const time = Number((n / 2).toFixed(4)); f.seek(time);
      const [, , w, h] = numbers(f.$('[data-figure] svg').getAttribute('viewBox'));
      const drawn = boxes(f), where = `${width}px, ${time}s`;
      for (const box of drawn) {
        assert(box.left >= 0 && box.right <= w, `"${box.text}" leaves the picture sideways at ${where}`);
        assert(box.top >= 0 && box.bottom <= h, `"${box.text}" leaves the picture vertically at ${where}`);
        assert(box.size >= 12, `"${box.text}" is below reading size at ${where}`);
      }
      for (let i = 0; i < drawn.length; i++) for (let j = i + 1; j < drawn.length; j++) {
        const a = drawn[i], b = drawn[j];
        const over = Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1.5
          && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1.5;
        assert(!over, `"${a.text}" meets "${b.text}" at ${where}`);
      }
    }
  }
});

test('surprise loss: arbitrary seek and resize histories reproduce the complete published frame', t => {
  const f = fixture(t, NAME, {width: 713}); f.load(); f.open();
  const snapshot = () => JSON.stringify({drawing: canonicalMarkup(f.$('[data-figure]').innerHTML),
    formula: canonicalMarkup(f.$('[data-formula]').outerHTML), caption: f.$('[data-caption]').innerHTML,
    readout: f.$('[data-belief-readout]').textContent,
    state: Object.fromEntries(Object.entries(f.root.dataset).filter(([key]) => !['time', 'playing', 'typeset'].includes(key)))});
  const times = [0, 5, 8.3, 10, 15, 17.6, 20, 22.4, 25, 28.8, 30, 33.1, 35, 37.5, 39.2, 40];
  const first = times.map(time => { f.seek(time); return snapshot(); });
  f.play(); f.tick(1234); f.resize(296); f.seek(21.3); f.resize(713);
  f.$('[data-belief-slider]').value = '0.2375';
  f.$('[data-belief-slider]').dispatchEvent(new f.w.Event('input'));
  f.key('Home');
  assert.deepEqual(times.toReversed().map(time => { f.seek(time); return snapshot(); }), first.toReversed());
});

test('surprise loss: the narrow layout is a reflow, not a shrunken copy of the wide one', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (const width of WIDTHS) {
    f.resize(width); f.seek(40);
    const [, , w, h] = numbers(f.$('[data-figure] svg').getAttribute('viewBox'));
    assert.equal(f.root.dataset.layout, width < 520 ? 'narrow' : 'wide');
    assert.deepEqual([w, h], width < 520 ? [296, 396] : [713, 296]);
    assert.equal(f.$('[data-figure] svg').getAttribute('preserveAspectRatio'), 'xMinYMin meet');
    for (const node of [...drawing(f).querySelectorAll('line')].filter(visible))
      for (const [key, limit] of [['x1', w], ['x2', w], ['y1', h], ['y2', h]])
        assert(attr(node, key) >= 0 && attr(node, key) <= limit, `${key} of a line leaves the frame at ${width}px`);
    assert(drawing(f).querySelectorAll('*').length < 80);
    // The belief axis spans exactly zero to one, and the ruler exactly zero to its top.
    const g = frame(f);
    close(attr(f.$('[data-belief-axis]'), 'x1'), toX(g, 0), PX);
    close(attr(f.$('[data-belief-axis]'), 'x2'), toX(g, 1), PX);
    close(attr(f.$('[data-loss-axis]'), 'y1'), toY(g, 0), PX);
    close(attr(f.$('[data-loss-axis]'), 'y2'), toY(g, g.lossTop), PX);
  }
});

test('surprise loss: the wide and narrow script-free prints reproduce the final frame', async t => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after, 'regenerate the surprise-loss static frames');
  const f = fixture(t, NAME), narrow = f.$('[data-static-frame="narrow"]');
  assert(narrow); assert.equal(narrow.dataset.width, '296');
  const ids = [...f.root.querySelectorAll('[id]')].map(node => node.id);
  assert.equal(ids.length, new Set(ids).size);
  for (const print of [drawing(f), narrow]) {
    assert.match(print.textContent, /loss \(nats\)/);
    assert.match(print.textContent, /y = 0 term × 0/);
    assert.match(print.textContent, /log 2/);
    assert.match(print.textContent, /\+0\.2513/);
    assert.match(print.textContent, /\+1\.0986/);
    assert.match(print.textContent, /4\.3820/);
    assert.equal((print.textContent.match(/\+0\.6931/g) || []).length, 3,
      'three halvings, three identical risers');
    assert.equal(print.querySelectorAll('[data-riser]').length, 7);
    assert.equal(print.querySelectorAll('[data-tread]').length, 7);
    assert(print.querySelector('[data-cross-ring]'));
    // The question the scene asked is not still drawn on the finished picture.
    assert(print.querySelector('[data-name="ask"]').hasAttribute('hidden'));
    assert(print.querySelector('[data-ask-guide]').hasAttribute('hidden'));
  }
  f.load(); f.open(); f.seek(40); f.resize(296);
  assert.equal(f.root.querySelectorAll('[data-static-frame="narrow"]').length, 0);
  const css = read('surprise-loss/player.css');
  assert.match(css, /@container\s*\(max-width:\s*519px\)/);
  assert.match(css, new RegExp(`aspect-ratio:\\s*296\\s*/\\s*${narrow.dataset.height}`));
});

test('surprise loss: an unusable fixture cannot silently mount a different mechanism', t => {
  const broken = [{label: '0.5'}, {ladder: '0.9 0.7 0.5 0.3 0.2'}, {ladder: '0.9 0.7 0.5 0.3'},
    {ladder: '0.9 0.7 x 0.3 0.1'}, {ladder: '0.9 0.7 0.5 0.3 1.1'}, {halved: '0.05 0.03 0.0125'},
    {halved: '0.05 0.025'}, {hedge: '0.3'}, {lossTop: '4'}, {samples: '1'},
    {beliefRange: '0.02 0.99'}, {beliefRange: '0.01 0.85'}, {beliefStep: '0.004'},
    {beliefStep: '0'}];
  for (const change of broken) {
    const f = mount(t, change);
    assert.throws(() => f.load(), /surprise-loss/, JSON.stringify(change));
    assert(!f.root.dataset.ready, 'a rejected fixture never mounts a player');
    assert.match(drawing(f).textContent, /loss \(nats\)/, 'the script-free print is left in place');
  }
});

test('surprise loss: the player exports nothing and publishes a fixed set of state keys', t => {
  const f = fixture(t, NAME, {width: 713}); f.load(); f.open();
  assert.equal(f.w.BookSurpriseLoss, undefined);
  assert.deepEqual(Object.keys(f.root.dataset).filter(key => ![
    'player', 'playback', 'evidenceClass', 'label', 'ladder', 'halved', 'hedge', 'lossTop',
    'samples', 'beliefRange', 'beliefStep',
    'ready', 'duration', 'time', 'playing', 'typeset'
  ].includes(key)).sort(),
  ['asking', 'atHedge', 'belief', 'earned', 'layout', 'loss', 'override', 'plot', 'revealed', 'stage']);
  assert.doesNotMatch(read('surprise-loss/player.js'), /Math\.random|fetch\(|import\(|setInterval\(/);
  const filter = fs.readFileSync(path.join(ROOT, scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
});

test('surprise loss: the boundary says what is not claimed, and the check transfers', t => {
  const f = fixture(t, NAME), source = declared(f);
  const boundary = f.$('.mechanism-boundary').textContent;
  assert.match(boundary, /not a distance and not a probability/);
  assert.match(boundary, /the loss is not bounded at all/);
  assert.match(boundary, /nothing here is trained/);
  assert.match(boundary, /nats/);
  assert.match(boundary, /information-theory reading of the same quantity comes later/);
  assert.match(boundary, /Only one term is ever active for a hard label/);
  assert.match(boundary, /declared computed variants/);
  assert.match(boundary, /not a measured frequency/);
  assert.match(boundary, /nothing in this scene is a learnable parameter/);
  assert.match(boundary, /is the next section's business and is deliberately absent/);
  assert(f.$('.mechanism-boundary > p').textContent.split(/\s+/).length <= 32);
  const check = f.$('.mechanism-check');
  const question = check.querySelector('summary').textContent.replace(/^Check yourself\.\s*/, '');
  const answer = check.querySelector('p').textContent;
  assert(question.split(/\s+/).length <= 40, `the question has ${question.split(/\s+/).length} words`);
  assert(answer.split(/\s+/).length <= 70, `the answer has ${answer.split(/\s+/).length} words`);
  for (const text of [question, answer]) {
    assert.doesNotMatch(text, /\d-\d|\s-\d/, 'a hyphen is never a minus sign');
    assert.doesNotMatch(text, /\de[-+]?\d/, 'no e-notation');
  }
  // Its arithmetic, from the declared fixture: two hedges beat one confident mistake, even
  // though the two models' average belief is identical.
  const hedged = 2 * lossOf(source.hedge);
  const split = lossOf(source.ladder[0]) + lossOf(source.ladder.at(-1));
  close((source.hedge + source.hedge) / 2, (source.ladder[0] + source.ladder.at(-1)) / 2, 1e-15);
  close(hedged, 1.3862943611198906, 1e-12);
  close(split, 2.407945608651872, 1e-12);
  assert(split > hedged, 'the confident mistake must be the more expensive pair');
  for (const value of [lossOf(source.hedge), lossOf(source.ladder[0]), lossOf(source.ladder.at(-1)),
    hedged, split]) assert(answer.includes(value.toFixed(4)), value.toFixed(4));
  // The question is about two examples and a sum; the picture never shows either.
  const panel = read('surprise-loss/panel.html');
  assert.doesNotMatch(panel.slice(panel.indexOf('<g data-drawing>'), panel.indexOf('</details>')), /2\.4079|1\.3863/);
});
