#!/usr/bin/env node
// Test-only arithmetic and DOM checks; no dependency enters the published book.
// The manuscript owns the three rates, the start, the generating weight the bowl's minimum
// sits on and the rule-of-thumb rate; the curvature, the step budget and the drawn window
// are declared in the panel. These tests rerun the descent recurrence independently, check
// it against the closed form and against a numerical derivative of the declared loss, and
// derive the divergence threshold two ways, so the drawn landings have a second source.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, close, canonicalMarkup,
  fixture, registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'step-length-excerpt', scene = entry(NAME);
const widths = [240, 296, 375, 559, 560, 713, 900];
const attr = (node, name) => Number(node.getAttribute(name));
const drawing = f => f.$('[data-drawing]');
const visible = node => !node.closest('[hidden]') && !node.hasAttribute('hidden');
const shownDots = f => [...drawing(f).querySelectorAll('[data-dot]')].filter(visible).length;
const shownClass = (f, selector) => f.$(selector).classList.contains('is-shown');

// A printed number read back the way a reader reads it: U+2212 for minus, four decimals,
// or a mantissa times a power of ten in Unicode superscripts. Hyphen-minus, e-notation and
// raw doubles are not numbers this scene may print, so they fail here rather than parse.
const SUPERSCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹';
function shown(text) {
  const match = /^([+−]?)(\d+(?:\.\d+)?)(?: × 10(⁻?)([⁰¹²³⁴⁵⁶⁷⁸⁹]+))?$/.exec(text.trim());
  assert(match, `not a house-style number: "${text}"`);
  const exponent = match[4] ? Number([...match[4]].map(digit => SUPERSCRIPT.indexOf(digit)).join('')) * (match[3] ? -1 : 1) : 0;
  return (match[1] === '−' ? -1 : 1) * Number(match[2]) * 10 ** exponent;
}
// Hyphen-minus before a digit, or a mantissa followed by e and an exponent.
const ASCII_MATH = /(?:^|[^\w])-\s?\d|\d(?:\.\d+)?e[-+]?\d/i;
// Words that would answer the beat-3 question before the beat-4 run has played.
const SPOILER = /\b(diverg\w*|explod\w*|grow\w*|climb\w*|higher|worse|increas\w*|escap\w*|blow\w*)\b/i;

// --- A second implementation of the descent recurrence --------------------------------
// Written the way @eq-full-gd writes it, subtracting `rate * gradient` from the parameter,
// with the gradient taken from the declared bowl rather than from the player's helper.
function descend(curvature, minimum, start, alpha, steps) {
  const ws = [start], gradients = [];
  for (let k = 0; k < steps; k++) {
    const gradient = curvature * (ws[k] - minimum);
    gradients.push(gradient);
    ws.push(ws[k] - alpha * gradient);
  }
  return {ws, gradients};
}
function declared(f) {
  const d = f.root.dataset;
  return {start: Number(d.start), minimum: Number(d.minimum), curvature: Number(d.curvature),
    steps: Number(d.steps), rates: numbers(d.rates), guide: Number(d.guide),
    window: numbers(d.window), dial: numbers(d.dial)};
}
const FIX = {start: -0.5, minimum: 2.5, curvature: 2, steps: 8, rates: [0.005, 0.12, 1.1],
  guide: 0.1, window: [-4, 9], dial: [0, 1.25]};
const lossOf = fx => w => 0.5 * fx.curvature * (w - fx.minimum) ** 2;

// A drawn text's box, estimated: JSDOM lays nothing out, so a conservative advance width
// per character stands in for a measurement. Overlap or an edge crossing here is a real
// collision at the real font, because the estimate is generous.
function textBox(node) {
  const size = Number(node.getAttribute('font-size') || 12), text = (node.textContent || '').trim();
  const width = text.length * size * 0.56, anchor = node.getAttribute('text-anchor') || 'start';
  const x = attr(node, 'x'), y = attr(node, 'y');
  const left = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
  return {left, right: left + width, top: y - size * 0.8, bottom: y + size * 0.3, text};
}
const overlaps = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
const points = d => [...d.matchAll(/[ML] (-?[\d.]+) (-?[\d.]+)/g)].map(m => [Number(m[1]), Number(m[2])]);
const vector = node => { const p = points(node.getAttribute('d')); return [p[1][0] - p[0][0], p[1][1] - p[0][1]]; };

registerTransportTests(NAME, {witness: /L 0\.1115/, anchors: ['step-length-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('step length: the chapter owns the rates, the start and the rule of thumb', t => {
  const f = fixture(t, NAME), fx = declared(f), chapter = chapterSource(NAME);
  assert.deepEqual(fx, FIX);
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal), literal);
  // Every literal this panel mirrors, in the exact form the manifest should name.
  for (const literal of [
    'One knob dominates all others. The learning rate $\\alpha$ scales every step, and its\nfailure modes are asymmetric:',
    'too small wastes your compute budget crawling; too large\novershoots the valley and diverges.',
    'def losses_for(lr: float, steps: int = 60) -> list[float]:',
    '    w, b, out = torch.tensor(-0.5), torch.tensor(2.0), []',
    'for lr, style, color in [(0.005, "-", "#5379AA"), (0.12, "-", "#E57200"),\n                         (1.1, "--", "#722F37")]:',
    'Same problem, same steps, three learning rates. Too small crawls; too large overshoots back and forth and climbs; the middle one converges quickly.',
    'y1 = 2.5 * x1 - 1.0 + 0.4 * torch.randn(80)',
    'For the normalized toy problems here, plain SGD often starts around\n$\\alpha = 0.1$.',
    'crawling $\\rightarrow$ consider raising it; oscillating or\nexploding $\\rightarrow$ lower it.',
    // Named in the scope as out of scope here, so the chapter must still say it.
    'Later in training it often pays to *decay* the\nlearning rate so the fine-tuning steps get smaller; that is a **learning-rate\nschedule**.'])
    assert(chapter.includes(literal), literal);
  assert.equal(scene.qmd, 'chapters/part1/04-training-loss-sgd.qmd');
  assert.equal(scene.anchor.type, 'before-heading');
  assert.equal(scene.anchor.target, 'The batch size');
  assert(chapter.includes(`## ${scene.anchor.target}`));
  assert.deepEqual(scene.beats, [0, 5, 10, 15, 20, 25, 30, 35]); assert.equal(scene.duration, 40);
  const filter = fs.readFileSync(path.join(ROOT, scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
});

test('step length: the declared bowl makes the chapter\'s three rates crawl, converge and diverge', t => {
  const f = fixture(t, NAME), fx = declared(f);
  const threshold = 2 / fx.curvature;
  assert.equal(threshold, 1);
  assert(fx.window[0] < fx.minimum && fx.minimum < fx.window[1], 'the minimum is inside the drawn window');
  // The window is symmetric about the minimum, so both walls reach the same height.
  close(fx.minimum - fx.window[0], fx.window[1] - fx.minimum, 1e-12);
  const factor = alpha => 1 - alpha * fx.curvature;
  assert.equal(factor(fx.rates[0]), 0.99);
  close(factor(fx.rates[1]), 0.76, 1e-12);
  close(factor(fx.rates[2]), -1.2, 1e-12);
  // Crawling, healthy and divergent, in the chapter's own order.
  assert(Math.abs(factor(fx.rates[0])) > 0.98, 'the smallest rate barely contracts');
  assert(Math.abs(factor(fx.rates[1])) < 0.8, 'the middle rate contracts usefully');
  assert(factor(fx.rates[1]) > 0, 'and monotonically, without crossing the valley');
  assert(Math.abs(factor(fx.rates[2])) > 1, 'the largest rate expands');
  // |1 - alpha c| < 1 exactly on (0, 2/c): the threshold read two ways.
  for (const alpha of [0.001, 0.25, 0.5, 0.75, 0.99, 0.999]) assert(Math.abs(factor(alpha)) < 1, alpha);
  for (const alpha of [1.001, 1.05, 1.1, 1.25]) assert(Math.abs(factor(alpha)) > 1, alpha);
  assert.equal(Math.abs(factor(threshold)), 1, 'at the threshold the walk neither grows nor shrinks');
  // The chapter's rule of thumb is a tenth of this bowl's wall, which is the scene's claim.
  close(fx.guide / threshold, 0.1, 1e-12);
  // The cost of the smallest rate, in the chapter's own currency: steps.
  const stepsTo = alpha => Math.ceil(Math.log(0.01 / 3) / Math.log(Math.abs(factor(alpha))));
  assert.equal(stepsTo(fx.rates[0]), 568);
  assert.equal(stepsTo(fx.rates[1]), 21);
});

test('step length: the drawn walk is the update rule, rerun and differentiated independently', t => {
  const f = fixture(t, NAME), fx = declared(f); f.load(); f.open();
  const loss = lossOf(fx), h = 1e-5;
  const traces = JSON.parse(f.root.dataset.traces);
  assert.equal(traces.length, fx.rates.length);
  traces.forEach((trace, index) => {
    const alpha = fx.rates[index];
    const want = descend(fx.curvature, fx.minimum, fx.start, alpha, fx.steps);
    assert.equal(trace.length, fx.steps + 1);
    trace.forEach((w, k) => {
      close(w, want.ws[k], 1e-9);
      // The closed form for a quadratic: the displacement scales by (1 - alpha c) a step.
      close(w - fx.minimum, (fx.start - fx.minimum) * (1 - alpha * fx.curvature) ** k, 1e-9);
      if (k === fx.steps) return;
      // A central difference of the declared loss: a second route to the gradient used.
      const gradient = (loss(w + h) - loss(w - h)) / (2 * h);
      close(gradient, want.gradients[k], 2e-6);
      close(trace[k + 1] - w, -alpha * gradient, 2e-6);
    });
    const grew = Math.abs(trace[fx.steps] - fx.minimum) > Math.abs(fx.start - fx.minimum);
    assert.equal(grew, alpha > 2 / fx.curvature, `rate ${alpha} ends on the wrong side of the wall`);
  });
  // The published witnesses, to the four decimals the picture prints.
  close(traces[0][fx.steps], -0.2682340833, 1e-9);
  close(traces[1][fx.steps], 2.1660895638, 1e-9);
  close(traces[2][1], 6.1, 1e-12);
  close(loss(traces[2][fx.steps]), 166.39583300546254, 1e-9);
  // Each divergent landing is 1.44 times the height of the one before it: geometric.
  for (let k = 1; k < fx.steps; k++) close(loss(traces[2][k + 1]) / loss(traces[2][k]), 1.44, 1e-9);
});

test('step length: the step arrow is the slope arrow scaled by the rate, and its tip is the landing', t => {
  const f = fixture(t, NAME), fx = declared(f); f.load(); f.open();
  const unit = () => Number(f.root.dataset.unitW);
  for (const time of [4, 9, 14, 17, 19, 27.8, 34, 39.9]) {
    f.seek(time);
    if (f.root.dataset.escaped === 'true') continue;
    const alpha = Number(f.root.dataset.alpha), w = Number(f.root.dataset.trueW);
    const slope = fx.curvature * (w - fx.minimum);
    const ghost = vector(f.$('[data-ghost-arrow]')), step = vector(f.$('[data-step-arrow]'));
    // The dashed arrow is the raw gradient; the solid one is the rate's fraction of it.
    close(ghost[0] / unit(), -slope, 1e-3);
    close(step[0] / unit(), -alpha * slope, 1e-3);
    // Four-decimal coordinate rounding is the only difference allowed between the two.
    if (Math.abs(ghost[0]) > 1) close(step[0] / ghost[0], alpha, 2e-3);
    assert.equal(ghost[1], 0); assert.equal(step[1], 0);
    // On a bowl of this curvature the dashed tip is the point of equal height opposite.
    const ballX = attr(f.$('[data-ball]'), 'cx');
    close((ballX + ghost[0] - ballX) / unit() + w, 2 * fx.minimum - w, 1e-3);
  }
  // At the threshold the solid arrow reaches exactly the ring on the far wall.
  f.seek(25);
  const ring = f.$('[data-mirror]');
  const tipX = attr(f.$('[data-ball]'), 'cx') + vector(f.$('[data-step-arrow]'))[0];
  close(tipX, attr(ring, 'cx'), 2e-3);
  close(attr(ring, 'cy'), attr(f.$('[data-ball]'), 'cy'), 2e-3);
});

test('step length: the ball rides the declared bowl and its landings are marked on it', t => {
  const f = fixture(t, NAME, {width: 713}), fx = declared(f); f.load(); f.open();
  const loss = lossOf(fx);
  const left = Number(f.root.dataset.plotLeft), bottom = Number(f.root.dataset.plotBottom);
  const unitW = Number(f.root.dataset.unitW), unitL = Number(f.root.dataset.unitL);
  const toW = x => fx.window[0] + (x - left) / unitW, toL = y => (bottom - y) / unitL;
  // The drawn curve is the declared loss at every sampled vertex.
  const bowl = points(f.$('[data-bowl]').getAttribute('d'));
  assert(bowl.length >= 120, 'the bowl is sampled finely enough to read as a curve');
  for (const [x, y] of bowl) close(toL(y), loss(toW(x)), 2e-3);
  for (const time of [2, 7, 12, 21, 27.8, 32, 39.9]) {
    f.seek(time);
    const ball = f.$('[data-ball]');
    close(toL(attr(ball, 'cy')), loss(toW(attr(ball, 'cx'))), 3e-3);
    for (const dot of [...drawing(f).querySelectorAll('[data-dot]')].filter(visible))
      close(toL(attr(dot, 'cy')), loss(toW(attr(dot, 'cx'))), 3e-3);
  }
  // The start-height line is the loss at the chapter's start, and the ring sits on it.
  f.seek(39.9);
  close(toL(attr(f.$('[data-start-line]'), 'y1')), loss(fx.start), 2e-3);
  close(toW(attr(f.$('[data-mirror]'), 'cx')), 2 * fx.minimum - fx.start, 2e-3);
  close(toL(attr(f.$('[data-mirror]'), 'cy')), loss(fx.start), 2e-3);
});

test('step length: the largest rate leaves the picture and the readout keeps the true loss', t => {
  const f = fixture(t, NAME), fx = declared(f); f.load(); f.open();
  const loss = lossOf(fx);
  const trace = descend(fx.curvature, fx.minimum, fx.start, fx.rates[2], fx.steps).ws;
  const inside = trace.filter(w => w >= fx.window[0] && w <= fx.window[1]).length;
  assert.equal(inside, 5, 'four landings after the start fit the window, then it exits');
  f.seek(20); assert.equal(f.root.dataset.escaped, 'false');
  f.seek(24);
  assert.equal(f.root.dataset.escaped, 'true');
  assert.equal(Number(f.root.dataset.exit), 5);
  assert(visible(f.$('[data-chevron]')), 'an escape is marked, not silently clamped');
  assert(!visible(f.$('[data-arrows]')), 'no arrow is drawn for a ball off the picture');
  assert.equal(shownDots(f), 5, 'a landing outside the window is not drawn');
  // The ball is pinned to the frame; the number beside it is not.
  const right = Number(f.root.dataset.plotRight);
  close(attr(f.$('[data-ball]'), 'cx'), right, 1e-6);
  close(shown(f.$('[data-value="loss"]').textContent.replace('L ', '')), 166.3958, 0);
  close(Number(f.root.dataset.shownLoss), loss(trace[fx.steps]), 1e-9);
  assert(loss(trace[fx.steps]) > 18 * loss(fx.start), 'eight steps multiply the loss many times over');
});

test('step length: each beat holds exactly what its caption describes', t => {
  const f = fixture(t, NAME, {reduced: true}), fx = declared(f); f.load(); f.open();
  const state = time => {
    f.seek(time);
    return {stage: Number(f.root.dataset.stage), alpha: Number(f.root.dataset.alpha),
      progress: Math.round(Number(f.root.dataset.progress) * 1e6) / 1e6,
      dots: shownDots(f), escaped: f.root.dataset.escaped === 'true',
      ring: visible(f.$('[data-mirror]')), wall: visible(f.$('[data-value="threshold"]')),
      guide: visible(f.$('[data-guide]')), rate: visible(f.$('[data-value="alpha"]')),
      startLine: visible(f.$('[data-start-line]')), scaleShown: shownClass(f, '[data-scale]')};
  };
  const want = [
    {stage: 0, alpha: fx.rates[0], progress: 0, dots: 1, escaped: false, ring: false, wall: false, guide: false, rate: false, startLine: false, scaleShown: false},
    {stage: 1, alpha: fx.rates[0], progress: 8, dots: 9, escaped: false, ring: false, wall: false, guide: false, rate: true, startLine: true, scaleShown: false},
    {stage: 2, alpha: fx.rates[1], progress: 8, dots: 9, escaped: false, ring: false, wall: false, guide: false, rate: true, startLine: true, scaleShown: false},
    {stage: 3, alpha: fx.rates[2], progress: 0, dots: 1, escaped: false, ring: false, wall: false, guide: true, rate: true, startLine: true, scaleShown: false},
    {stage: 4, alpha: fx.rates[2], progress: 8, dots: 5, escaped: true, ring: false, wall: false, guide: false, rate: true, startLine: true, scaleShown: false},
    {stage: 5, alpha: 1, progress: 7, dots: 8, escaped: false, ring: true, wall: true, guide: false, rate: true, startLine: true, scaleShown: true},
    {stage: 6, alpha: 0.9, progress: 8, dots: 9, escaped: false, ring: true, wall: true, guide: false, rate: true, startLine: true, scaleShown: true},
    {stage: 7, alpha: fx.rates[1], progress: 8, dots: 9, escaped: false, ring: true, wall: true, guide: false, rate: true, startLine: true, scaleShown: true}
  ];
  scene.beats.forEach((beat, index) => assert.deepEqual(state(beat), want[index], `beat ${index} at ${beat}s`));
  // The rule-of-thumb mark on the control arrives with the caption that recommends it.
  f.seek(scene.beats[6]); assert(!shownClass(f, '[data-guide-mark]'));
  f.seek(scene.beats[7]); assert(shownClass(f, '[data-guide-mark]'));
  // Beat 5 rests on the far wall, at the height it started from: the bounce made no ground.
  f.seek(scene.beats[5]);
  close(Number(f.root.dataset.trueW), 2 * fx.minimum - fx.start, 1e-9);
  close(Number(f.root.dataset.shownLoss), lossOf(fx)(fx.start), 1e-9);
});

test('step length: the answer is withheld until the largest rate has run', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (const time of [15, 16, 17.5, 19, 19.99]) {
    f.seek(time);
    assert.equal(f.root.dataset.revealed, 'false', `revealed at ${time}s`);
    assert.equal(shownDots(f), 1, `a landing is exposed at ${time}s`);
    assert(!visible(f.$('[data-mirror]')), `the ring is exposed at ${time}s`);
    assert(!visible(f.$('[data-value="threshold"]')), `the wall is named at ${time}s`);
    assert(!shownClass(f, '[data-scale]'), `the control's wall is exposed at ${time}s`);
    assert(!visible(f.$('[data-chevron]')), `the escape mark is exposed at ${time}s`);
    const accessible = [f.$('[data-caption]').textContent,
      f.$('[data-figure] svg').getAttribute('aria-label'),
      f.$('[data-alpha-slider]').getAttribute('aria-valuetext'),
      f.$('[data-controls] input[type="range"]').getAttribute('aria-valuetext')].join(' ');
    assert.doesNotMatch(accessible, SPOILER, `a prediction prompt announces its answer at ${time}s`);
  }
  // And the question really is asked, in the caption, before the run that answers it.
  f.seek(17); assert.match(f.$('[data-caption]').textContent, /Late, or never\?/);
  f.seek(20); assert.equal(f.root.dataset.revealed, 'true');
  f.seek(24); assert(visible(f.$('[data-chevron]')));
});

test('step length: the rate is the one control, a detour from the timeline and never the clock', t => {
  const f = fixture(t, NAME), fx = declared(f); f.load(); f.open();
  const slider = f.$('[data-alpha-slider]');
  assert.equal(slider.min, String(fx.dial[0])); assert.equal(slider.max, String(fx.dial[1]));
  assert.equal(f.root.querySelectorAll('[data-controls] input[type="range"]').length, 1,
    'the transport still owns exactly one range inside its own bar');
  // Every rate the timeline visits, and both marks on the control, are reachable by a step.
  const step = Number(slider.step);
  for (const alpha of [...fx.rates, fx.guide, 2 / fx.curvature, 0.9 * (2 / fx.curvature)])
    close(Math.round(alpha / step) * step, alpha, 1e-9);
  f.seek(12); f.play(); assert(f.playing);
  slider.value = '1.05'; slider.dispatchEvent(new f.w.Event('input'));
  assert(!f.playing, 'dragging pauses playback');
  assert.equal(f.root.dataset.override, 'slider');
  close(Number(f.root.dataset.alpha), 1.05, 1e-12);
  // A drag draws the whole eight-step outcome at once, from the dragged rate.
  assert.equal(Number(f.root.dataset.progress), fx.steps);
  const want = descend(fx.curvature, fx.minimum, fx.start, 1.05, fx.steps).ws;
  close(Number(f.root.dataset.trueW), want[fx.steps], 1e-9);
  assert(visible(f.$('[data-mirror]')), 'a reader exploring the control can see the wall');
  // The slider's own keys never reach the pane's beat seeking.
  const before = f.time;
  f.key('ArrowRight', slider); assert.equal(f.time, before);
  // Any timeline action resumes the timeline's own rate.
  f.key('ArrowRight'); assert.equal(f.root.dataset.override, '');
  close(Number(f.root.dataset.alpha), fx.rates[2], 1e-12);
  f.seek(12); slider.value = '0.4'; slider.dispatchEvent(new f.w.Event('input'));
  assert.equal(f.root.dataset.override, 'slider');
  f.seek(12); assert.equal(f.root.dataset.override, '', 'a scrub ends the detour');
});

test('step length: every printed number is house style and every mark stays inside the picture', t => {
  for (const width of widths) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    const [, , boxW, boxH] = f.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/).map(Number);
    for (const time of [0, 3, 5, 8, 10, 13, 15, 18, 20, 22, 25, 27.8, 30, 33, 35, 36, 39.9, scene.duration]) {
      f.seek(time);
      const texts = [...drawing(f).querySelectorAll('text')].filter(visible);
      const boxes = texts.map(textBox);
      boxes.forEach((box, i) => {
        assert(box.left >= -0.5 && box.right <= boxW + 0.5 && box.top >= -0.5 && box.bottom <= boxH + 0.5,
          `"${box.text}" leaves the ${width}px picture at ${time}s: ${JSON.stringify(box)}`);
        boxes.slice(i + 1).forEach(other => assert(!overlaps(box, other),
          `"${box.text}" and "${other.text}" collide at ${width}px, ${time}s`));
      });
      for (const node of drawing(f).querySelectorAll('[data-value]')) {
        const text = node.textContent.trim();
        if (text === '·') { assert(!visible(node), 'a withheld number is not drawn'); continue; }
        shown(text.replace(/^(?:L|α|wall α) ?/, ''));
      }
      const wording = [...texts.map(node => node.textContent), f.$('[data-caption]').textContent,
        f.$('[data-figure] svg').getAttribute('aria-label'),
        f.$('[data-alpha-slider]').getAttribute('aria-valuetext'),
        f.$('[data-controls] input[type="range"]').getAttribute('aria-valuetext')];
      for (const text of wording) assert.doesNotMatch(text, ASCII_MATH, `ASCII arithmetic in "${text}"`);
      // Nothing that claims to be on the bowl is drawn outside the plot.
      const left = Number(f.root.dataset.plotLeft), right = Number(f.root.dataset.plotRight);
      const top = Number(f.root.dataset.plotTop), bottom = Number(f.root.dataset.plotBottom);
      for (const dot of [...drawing(f).querySelectorAll('[data-ball], [data-dot]')].filter(visible)) {
        assert(attr(dot, 'cx') >= left - 1 && attr(dot, 'cx') <= right + 1, `a mark leaves the plot at ${time}s`);
        assert(attr(dot, 'cy') >= top - 1 && attr(dot, 'cy') <= bottom + 1, `a mark leaves the plot at ${time}s`);
      }
    }
  }
});

test('step length: the layout reflows once and both prints keep the declared window', t => {
  for (const width of widths) {
    const f = fixture(t, NAME, {width}), fx = declared(f); f.load(); f.open(); f.seek(scene.duration);
    assert.equal(f.root.dataset.layout, width < 560 ? 'narrow' : 'wide', `${width}px`);
    const [, , boxW, boxH] = f.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/).map(Number);
    assert.deepEqual([boxW, boxH], width < 560 ? [296, 302] : [713, 386]);
    const left = Number(f.root.dataset.plotLeft), right = Number(f.root.dataset.plotRight);
    const top = Number(f.root.dataset.plotTop), bottom = Number(f.root.dataset.plotBottom);
    close((right - left) / (fx.window[1] - fx.window[0]), Number(f.root.dataset.unitW), 1e-9);
    // The bowl exactly fills the box: the walls meet the top corners, the floor the axis.
    close((bottom - top) / (0.5 * fx.curvature * (fx.window[1] - fx.minimum) ** 2), Number(f.root.dataset.unitL), 1e-9);
  }
  // Resizing a live player rebuilds the same picture the fresh render gives.
  const wide = fixture(t, NAME, {width: 713}); wide.load(); wide.open(); wide.seek(24.375);
  wide.resize(375); wide.resize(713);
  const fresh = fixture(t, NAME, {width: 713}); fresh.load(); fresh.open(); fresh.seek(24.375);
  assert.equal(canonicalMarkup(wide.$('[data-figure]').innerHTML),
    canonicalMarkup(fresh.$('[data-figure]').innerHTML));
});

test('step length: seeking reconstructs the whole published state, not just the drawing', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const snapshot = () => ({markup: canonicalMarkup(f.$('[data-pane]').innerHTML.replace(/aria-valuetext="[^"]*"/g, '')),
    state: JSON.stringify(f.root.dataset), classes: f.root.className});
  const probes = [0, 4.4, 9.9, 12.5, 17.25, 21.6, 26.75, 31.4, 35.8, 39.9, scene.duration];
  const first = probes.map(time => { f.seek(time); return snapshot(); });
  f.play(); f.tick(6000); f.seek(3); f.play(); f.tick(2000);
  probes.forEach((time, index) => { f.seek(time); assert.deepEqual(snapshot(), first[index], `replay differs at ${time}s`); });
  // Backwards, and after a detour through the rate control, too.
  const slider = f.$('[data-alpha-slider]');
  slider.value = '0.7'; slider.dispatchEvent(new f.w.Event('input'));
  [...probes].reverse().forEach(time => {
    const index = probes.indexOf(time);
    f.seek(time); assert.deepEqual(snapshot(), first[index], `reverse seek differs at ${time}s`);
  });
});

test('step length: the committed static fallback is a fresh render of the final frame', async t => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after,
    'interactives/step-length/panel.html is stale: run scripts/render_static_frames.cjs step-length');
  const panel = read('step-length/panel.html');
  assert(panel.includes('<g data-static-frame="narrow"'), 'a reflowing scene ships a narrow print');
  assert(/preserveAspectRatio="xMinYMin meet"/.test(panel));
  // Local ids in the narrow print are namespaced, so its clip path cannot resolve to the
  // wide drawing's rectangle.
  const narrow = /<g data-static-frame="narrow"[\s\S]*?<\/g>\s*<!-- \/static-frame-narrow -->/.exec(panel)[0];
  assert(narrow.includes('id="sl-plot-clip--static-narrow"'));
  assert(narrow.includes('url(#sl-plot-clip--static-narrow)'));
  assert(!narrow.includes('url(#sl-plot-clip)'));
  // Geometry is serialised at four decimals, as the contract requires.
  for (const [, value] of narrow.matchAll(/ (?:cx|cy|x1|y1|x2|y2|x|y|width|height|r)="(-?\d+\.\d+)"/g))
    assert(value.split('.')[1].length <= 4, `${value} is serialised past 0.0001 px`);
});

test('step length: the panel names its declared variant, its boundary and its transfer case', t => {
  const f = fixture(t, NAME);
  const boundary = f.$('.mechanism-boundary').textContent;
  assert.match(boundary, /quadratic bowl is the special case/);
  assert.match(boundary, /nothing drawn here is trained/);
  assert.match(boundary, /full-batch gradient descent on one parameter/);
  assert.match(boundary, /not the stochastic version/);
  assert.match(boundary, /declared, not measured/);
  assert.match(boundary, /Eight steps per rate is this panel's budget/);
  assert.match(boundary, /the chapter's own helper runs sixty/);
  assert.match(boundary, /Decay schedules and warmup/);
  assert.match(boundary, /out of scope here/);
  assert.match(boundary, /log axis/);
  // One visible sentence; every further qualifier inside the closed scope disclosure.
  const scope = f.$('.mechanism-scope');
  assert.equal(scope.open, false);
  const lead = [...f.$('.mechanism-boundary').children].filter(node => node.tagName === 'P');
  assert.equal(lead.length, 1, 'the boundary shows exactly one sentence outside the disclosure');
  assert(lead[0].textContent.trim().split(/\s+/).length <= 34);
  const check = f.$('.mechanism-check');
  assert.equal(check.open, false);
  assert(check.querySelector('summary').textContent.replace('Check yourself.', '').trim().split(/\s+/).length <= 40);
  assert(check.querySelector('p').textContent.trim().split(/\s+/).length <= 70);
  assert.doesNotMatch(check.textContent, ASCII_MATH);
  // The transfer answer, recomputed: ten times the curvature moves the wall to a tenth.
  const fx = FIX, c2 = 10 * fx.curvature;
  assert.equal(c2, 20); close(2 / c2, 0.1, 1e-12);
  close(1 - fx.rates[1] * c2, -1.4, 1e-12);
  close((1 - fx.rates[1] * c2) ** 2, 1.96, 1e-12);
  assert(Math.abs(1 - fx.rates[0] * c2) < 1, 'the smallest rate survives the steeper bowl');
  assert(Math.abs(1 - fx.rates[2] * c2) > 1);
  const answer = check.querySelector('p').textContent;
  for (const number of ['0.005', '2 ÷ 20 = 0.1', '1 − 0.12 × 20 = −1.4', '1.4']) assert(answer.includes(number), number);
  // Equation links point at anchors this chapter really defines.
  for (const link of f.root.querySelectorAll('a[href^="#eq-"]'))
    assert(chapterSource(NAME).includes(`{${link.getAttribute('href')}}`), link.getAttribute('href'));
});

test('step length: the transcript lists one item per beat in the order they play', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const items = [...f.$('.mechanism-transcript ol').children];
  assert.equal(items.length, scene.beats.length);
  for (const item of items) assert.doesNotMatch(item.textContent, ASCII_MATH);
  const story = items.map(item => item.textContent).join(' ');
  for (const number of ['9.0000', '0.0300', '7.6631', '2.1661', '0.1115', '6.1000',
    '12.9600', '18.6624', '26.8739', '38.6984', '166.3958', '568', '21', '1.44', '0.2533'])
    assert(story.includes(number), number);
  // Those printed witnesses are the declared bowl's own numbers.
  const fx = FIX, loss = lossOf(fx);
  const slow = descend(fx.curvature, fx.minimum, fx.start, fx.rates[0], fx.steps).ws;
  const good = descend(fx.curvature, fx.minimum, fx.start, fx.rates[1], fx.steps).ws;
  const wild = descend(fx.curvature, fx.minimum, fx.start, fx.rates[2], fx.steps).ws;
  const cool = descend(fx.curvature, fx.minimum, fx.start, 0.9 * (2 / fx.curvature), fx.steps).ws;
  assert.equal(loss(fx.start).toFixed(4), '9.0000');
  assert.equal((fx.rates[0] * fx.curvature * (fx.minimum - fx.start)).toFixed(4), '0.0300');
  assert.equal(loss(slow[8]).toFixed(4), '7.6631');
  assert.equal(good[8].toFixed(4), '2.1661'); assert.equal(loss(good[8]).toFixed(4), '0.1115');
  assert.deepEqual(wild.slice(1, 5).map(w => w.toFixed(4)), ['6.1000', '−1.8200', '7.6840', '−3.7208']
    .map(text => text.replace('−', '-')));
  assert.deepEqual(wild.slice(1, 5).map(w => loss(w).toFixed(4)), ['12.9600', '18.6624', '26.8739', '38.6984']);
  assert.equal(loss(wild[8]).toFixed(4), '166.3958');
  assert.equal(cool[8].toFixed(4), '1.9967'); assert.equal(loss(cool[8]).toFixed(4), '0.2533');
});
