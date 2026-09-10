#!/usr/bin/env node
// Test-only JSDOM. No dependency from this file enters the published book.
// The JSDOM fixture, the markup canonicaliser, and the transport, beat-hold and grammar
// suites this scene inherits live in scripts/html-tests/excerpt-harness.cjs. What stays
// here is the part no harness can supply: this scene's arithmetic, and the things a
// product of gates can get silently wrong -- the exponent, the height it is drawn at, the
// ink it is painted with, the ratio between two exponents, and the difference between a
// gate the chapter measured and a gate this panel assumes -- plus the shape of its one
// picture (one chart, two bands, one word seen twice), its typeset formula span, the
// class toggles the player applies to it per beat, and the ONE parameter control the
// author asked for: a b_f slider the timeline sweeps by default and the reader may drag.
// JSDOM never typesets, so the formula assertions read the TeX source, the eq- id, the
// \class{} names and the state the player publishes, never rendered math.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, manifest, entry, chapterSource, close, canonicalMarkup, drawnMarkup,
  fixture, registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'gate-product-excerpt';
const scene = entry(NAME);
// Chapter 10 prints the order of magnitude; the appendix prints the value. The audit
// checks a scene's literals only against its own chapter, so this scene's second chapter
// is bound here instead.
const APPENDIX = 'chapters/appendices/a3-precision-performance.qmd';
const appendixSource = () => fs.readFileSync(path.join(ROOT, APPENDIX), 'utf8');
// The harness lays nothing out, so the figure's width is declared: the wide layout, which
// is the one the static frame is drawn in, and the width a 1280 px viewport actually gives.
const WIDE = 1100, DESKTOP = 713, NARROW = 300;
const settle = () => new Promise(resolve => setImmediate(resolve));

// Read the declared fixture from the closed panel. The panel is the one in-repo mirror of
// the manuscript's numbers; everything below is computed from it, so no chapter value is
// typed here a second time.
function declared(f) {
  assert(!f.root.dataset.ready, 'read the declared fixture before the player mounts');
  const {half, bias, horizon, measured} = f.root.dataset;
  return {half: Number(half), bias: Number(bias), horizon: Number(horizon),
    measured: measured.trim().split(/\s+/).map(Number)};
}
// The slider declares its own range: the ticks, the step and the far point of the sweep.
function sliderSpec(f) {
  const slider = f.$('[data-bias-slider]');
  return {min: Number(slider.min), max: Number(slider.max), step: Number(slider.step),
    ticks: [...f.d.getElementById(slider.getAttribute('list')).options].map(o => Number(o.value))};
}

// This suite's own arithmetic, deliberately not the player's: it is the independent
// evaluation every assertion below is checked against.
const sigma = x => 1 / (1 + Math.exp(-x));
const held = (f, k) => Math.pow(f, k);
const FLOOR = 25;
// The ink mapping, restated: linear ink is f^k; log ink is 1 + log10(f^k)/25 clipped to
// [0, 1] -- written here as k * log10(f), a different arithmetic path from the player's
// log10(Math.pow(f, k)).
const inkOf = (f, k, mode) => (mode === 'linear' ? held(f, k) : Math.max(0, Math.min(1, 1 + k * Math.log10(f) / FLOOR)));
const SUP = {'-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹'};
const superscript = n => [...String(n)].map(ch => SUP[ch]).join('');
function scientific(value, digits = 2) {
  let exponent = Math.floor(Math.log10(value));
  let mantissa = value / Math.pow(10, exponent);
  if (Number(mantissa.toFixed(digits)) >= 10) { mantissa /= 10; exponent += 1; }
  return `${mantissa.toFixed(digits)} × 10${superscript(exponent)}`;
}
const gates = values => [values.half, sigma(values.bias)];
const HEIGHTS = {wide: 400, narrow: 462};
const tex = f => f.d.getElementById('eq-gate-product-1').textContent;
const caption = f => f.$('[data-caption]');
const wordsOf = text => text.trim().split(/\s+/).filter(Boolean);
const times = (step = 0.05, from = 0, to = scene.duration) => {
  const out = [];
  for (let t = from; t <= to + 1e-9; t += step) out.push(Number(t.toFixed(4)));
  return out;
};
const css = read('gate-product/player.css');
const attr = (node, name) => Number(node.getAttribute(name));
const value = (f, name) => f.root.querySelector(`[data-value="${name}"]`);
const valueText = (f, name) => (value(f, name) ? value(f, name).textContent : null);
const cells = (f, band) => [...f.root.querySelectorAll(`[data-band="${band}"] [data-cell]`)];
const token = (f, band) => f.root.querySelector(`[data-token="${band}"]`);
const curve = (f, which) => f.root.querySelector(`[data-mark="curve-${which}"]`);
const bandLabel = (f, band) => f.root.querySelector(`[data-band-label="${band}"]`).textContent.replace(/\bbf\b/g, 'b_f');
const gateLabel = (f, band) => f.root.querySelector(`[data-gate-label="${band}"]`).textContent;
const slider = f => f.$('[data-bias-slider]');
const drag = (f, to) => { slider(f).value = String(to); slider(f).dispatchEvent(new f.w.Event('input', {bubbles: true})); };
const axis = (f, mode) => f.root.querySelector(`[data-axis="${mode}"]`);
// Every value a reader can see is read at every layout: the phone's strip is a different
// code path from the desktop's right-hand column, and a fault local to either would
// otherwise ship green.
const WIDTHS = [NARROW, DESKTOP, WIDE];
// The badge's words, wherever the layout puts them: two lines in the wide column, one or
// two in the narrow strip. Read after the player has mounted (the static panel carries a
// second print of the frame for narrow panes, which the player removes).
const badgeWords = f => [...f.root.querySelectorAll('[data-mark="badge"] [data-words]')].map(n => n.textContent).join(' ');
const badgeLines = f => [...f.root.querySelectorAll('[data-mark="badge"] [data-words]')].map(n => n.textContent);
// The axis mode every group publishes: the axes, then each band.
const modesOf = f => [f.root.querySelector('[data-mark="axes"]').dataset.mode, ...[...f.root.querySelectorAll('[data-band]')].map(b => b.dataset.mode)];
// The last point of a curve's path, and everything the picture must hang on it: the
// endpoint dots stand where the curves end, the labels sit beside the dots (parted to a
// 16 px gap when the dots come within a line of each other, kept above the axis), the
// bracket spans the two dots when they are visibly apart and is absent when they
// coincide, and the badge box is centred between them. Restated here, independently of
// the player, so a dot pinned to the wrong height fails.
const lastPoint = (f, which) => {
  const m = [...curve(f, which).getAttribute('d').matchAll(/[ML]([\d.]+) ([\d.]+)/g)].at(-1);
  return {x: Number(m[1]), y: Number(m[2])};
};
function endpointsOnCurves(f, label) {
  const fr = frame(f), liveEnd = lastPoint(f, 'live'), refEnd = lastPoint(f, 'ref');
  const live = f.root.querySelector('[data-mark="end-live"]'), ref = f.root.querySelector('[data-mark="end-ref"]');
  assert(live && ref, `${label}: both endpoint dots`);
  close(attr(live, 'cx'), liveEnd.x, 0.02); close(attr(live, 'cy'), liveEnd.y, 0.02);
  close(attr(ref, 'cx'), refEnd.x, 0.02); close(attr(ref, 'cy'), refEnd.y, 0.02);
  close(attr(live, 'cx'), fr.x1, 0.02);
  // The reference endpoint is a hollow ring, the live one a filled dot: distinguishable
  // even when they share a height, and never offset from it.
  assert.equal(ref.getAttribute('fill'), 'none'); assert.equal(ref.getAttribute('stroke').toLowerCase(), '#722f37');
  assert.equal(live.getAttribute('fill').toLowerCase(), '#722f37'); assert(attr(ref, 'r') > attr(live, 'r'));
  const apart = Math.abs(refEnd.y - liveEnd.y) >= 2;
  if (f.root.dataset.layout !== 'wide') return {apart};
  let lT = refEnd.y + 5, lB = liveEnd.y + 5;
  if (Math.abs(lT - lB) < 16) { const mid = (lT + lB) / 2, sign = lB <= lT ? 1 : -1; lT = mid + 8 * sign; lB = mid - 8 * sign; }
  const overhang = Math.max(lT, lB) - (fr.y1 - 2);
  if (overhang > 0) { lT -= overhang; lB -= overhang; }
  close(attr(value(f, 'end-ref'), 'y'), lT, 0.03, `${label}: reference label`); close(attr(value(f, 'end-live'), 'y'), lB, 0.03, `${label}: live label`);
  const bracket = f.root.querySelector('[data-mark="bracket"]'), box = f.root.querySelector('[data-mark="badge"] rect');
  if (!box) { assert.equal(bracket, null, `${label}: a bracket without a badge`); return {apart}; }
  if (apart) {
    assert(bracket, `${label}: endpoints ${refEnd.y} and ${liveEnd.y} apart, no bracket`);
    const m = /^M[\d.]+ ([\d.]+) H[\d.]+ V([\d.]+) H/.exec(bracket.getAttribute('d'));
    close(Number(m[1]), liveEnd.y, 0.02); close(Number(m[2]), refEnd.y, 0.02);
  } else assert.equal(bracket, null, `${label}: coincident endpoints carry no bracket`);
  const bandTop = Math.min(...[...f.root.querySelectorAll('[data-band] > rect')].map(r => attr(r, 'y')));
  const bh = attr(box, 'height');
  close(attr(box, 'y'), Math.max(fr.y0, Math.min(bandTop - bh - 8, (refEnd.y + liveEnd.y) / 2 - bh / 2)), 0.03, `${label}: badge box`);
  return {apart};
}
// Number words, parsed back: this suite's own reading of what the badge spells, so the
// spelt number can be compared with the ratio it names.
const SMALL = {one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11,
  twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90};
const SCALES = {thousand: 1e3, million: 1e6, billion: 1e9, trillion: 1e12, quadrillion: 1e15, quintillion: 1e18, sextillion: 1e21, septillion: 1e24};
function smallNumber(text) {
  let total = 0;
  for (const part of text.split(' ')) {
    if (part === 'hundred') { total *= 100; continue; }
    for (const piece of part.split('-')) { assert(SMALL[piece] !== undefined, `not a number word: "${piece}" in "${text}"`); total += SMALL[piece]; }
  }
  return total;
}
function spelt(text) {
  const orders = /^(.+?) orders? of magnitude$/.exec(text);
  if (orders) return {orders: smallNumber(orders[1]), singular: / order of magnitude$/.test(text)};
  const tokens = text.split(' ');
  const scale = SCALES[tokens.at(-1)] ? SCALES[tokens.pop()] : 1;
  const point = tokens.indexOf('point');
  const lead = point < 0 ? smallNumber(tokens.join(' '))
    : smallNumber(tokens.slice(0, point).join(' ')) + smallNumber(tokens.slice(point + 1).join(' ')) / 10;
  return {value: lead * scale};
}
// The plot's frame, read back from the axes the picture draws: the x-axis line gives x0,
// x1 and y1, the y-axis line gives y0. Everything drawn on the plot is checked against it.
function frame(f) {
  const lines = [...f.root.querySelectorAll('[data-mark="axes"] line')];
  const xAxis = lines.find(l => l.getAttribute('y1') === l.getAttribute('y2') && attr(l, 'x2') - attr(l, 'x1') > 50);
  const yAxis = lines.find(l => l.getAttribute('x1') === l.getAttribute('x2') && attr(l, 'y2') - attr(l, 'y1') > 50);
  return {x0: attr(xAxis, 'x1'), x1: attr(xAxis, 'x2'), y1: attr(xAxis, 'y1'), y0: attr(yAxis, 'y1')};
}
// A curve's points, parsed back from its path and inverted through the axis: k from x,
// and either f^k (linear) or -log10(f^k) in decades (log) from y.
function curvePoints(f, which) {
  const node = curve(f, which);
  if (!node) return [];
  const {x0, x1, y0, y1} = frame(f), horizon = Number(f.root.dataset.horizon);
  const mode = f.root.dataset.mode;
  return [...node.getAttribute('d').matchAll(/[ML]([\d.]+) ([\d.]+)/g)].map(([, x, y]) => {
    const k = Math.round((Number(x) - x0) / (x1 - x0) * horizon);
    const unit = mode === 'linear' ? (y1 - Number(y)) / (y1 - y0) : (Number(y) - y0) / (y1 - y0) * FLOOR;
    return {k, unit};
  });
}
// The legible word's white halo: painted under its strokes, so the blue is seen against
// white at the band's ink rather than against wine at the same ink.
const halo = (w, label) => {
  assert.equal(w.getAttribute('paint-order'), 'stroke', `${label}: the word's halo is painted under its strokes`);
  assert.equal(w.getAttribute('stroke').toLowerCase(), '#fff', `${label}: the halo is white`);
  assert(attr(w, 'stroke-width') >= 2.5, `${label}: halo width ${w.getAttribute('stroke-width')}`);
  assert.equal(w.getAttribute('stroke-linejoin'), 'round');
};
const sameCurve = (points, fGate, mode, label) => {
  assert(points.length > 0, `${label}: no points`);
  for (const {k, unit} of points) {
    if (mode === 'linear') assert(Math.abs(unit - held(fGate, k)) < 2e-4, `${label}: linear point k = ${k} reads ${unit}, f^k = ${held(fGate, k)}`);
    else assert(Math.abs(unit - Math.min(FLOOR, -k * Math.log10(fGate))) < 5e-3, `${label}: log point k = ${k} reads ${unit} decades, -log10 f^k = ${-k * Math.log10(fGate)}`);
  }
};

registerTransportTests(NAME, {
  // The static, script-free panel already carries the 0.5^80 anchor this scene is about,
  // in the appendix's three significant figures.
  witness: /8\.27 × 10⁻²⁵/,
  anchors: ['gate-product-playback-help'],
  width: WIDE
});
// One drawn state per whole beat under reduced motion, not just at the boundaries: the
// word must jump to each beat's end position and b_f must snap between the declared values.
registerBeatHoldTest(NAME);
// One picture, one formula line, one caption; TeX never rewritten; one guarded typeset.
registerGrammarTests(NAME);

test('gate-product: the declared attributes reproduce the chapter literals they mirror', t => {
  const f = fixture(t, NAME);
  const values = declared(f);
  const chapter = chapterSource(NAME);
  // Not a second copy of the fixture: the panel's attributes are rendered back into the
  // chapter's own source text, so a drift in either direction fails here as well as in
  // scripts/audit_excerpt_fixtures.py.
  assert.equal(values.half, 0.5);
  assert.equal(values.half, sigma(0), 'the declared half-open gate is not sigma(0)');
  assert(chapter.includes(`$0.5^{${values.horizon}} \\approx 10^{-24}$`),
    'the declared gate and horizon do not spell the chapter\'s 0.5^80 claim');
  assert(chapter.includes('near $\\sigma(0) = \\tfrac12$'),
    'the chapter no longer says a fresh LSTM sits at sigma(0) = 1/2');
  assert(chapter.includes(`forget-gate bias positive* (say $+${values.bias}$)`),
    'the declared bias does not spell the chapter\'s +1 recommendation');
  assert(chapter.includes('astronomically attenuated, not exactly zero'),
    'the chapter no longer says "not exactly zero", which the arrival caption quotes');
  for (const level of values.measured) assert(chapter.includes(String(level)),
    `the diagnostic caption no longer reports a mean gate of ${level}`);
  assert(chapter.includes(`holds its gates flat around ${values.measured[0]} for all eighty steps`));
  assert(chapter.includes(`at about ${values.measured[1]}`));
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal));
});

test('gate-product: the two anchors are 8.27e-25 and 1.307e-11, to the printed precision', t => {
  const f = fixture(t, NAME, {width: WIDE});
  const values = declared(f);
  const [HALF, OPEN] = gates(values);
  const atHalf = held(HALF, values.horizon), atOpen = held(OPEN, values.horizon);
  // sigma(1) is derived from the declared bias, never typed.
  assert.equal(OPEN.toFixed(6), '0.731059');
  assert.equal(atHalf.toExponential(2), '8.27e-25');
  assert.equal(atOpen.toExponential(3), '1.307e-11');
  // One precision everywhere the reader can see a number: the appendix's three figures.
  assert.equal(scientific(atHalf), '8.27 × 10⁻²⁵');
  assert.equal(scientific(atOpen), '1.31 × 10⁻¹¹');
  // The appendix is where this book prints the value rather than the order of magnitude.
  // The chapter itself prints only 10^-24, so both bindings are asserted, in both files.
  assert(appendixSource().includes(`$0.5^{${values.horizon}}=8.27\\times10^{-25}$`),
    `${APPENDIX} no longer prints the value this panel's first anchor reproduces`);
  assert.equal(atHalf.toPrecision(3), '8.27e-25');
  assert(!chapterSource(NAME).includes('8.27'),
    'chapter 10 now prints the value too, so this cross-chapter binding should move');
  // The intro must NOT carry either rounding: the panel's question asks the reader what
  // reaches step 80, and the intro sits three lines above it.
  const intro = f.root.querySelector('.mechanism-intro').textContent;
  for (const spoiler of [scientific(atHalf), scientific(atHalf, 3), '10⁻²⁴', '10^−24', `0.5^${values.horizon}`, `0.5${superscript(values.horizon)}`, 'trillion']) {
    assert(!intro.includes(spoiler), `the intro prints ${spoiler}, which is the answer to its own question`);
  }
  // And the picture prints exactly those two at its two endpoints, statically and at the
  // end of the timeline, beside the two gate labels.
  assert.deepEqual([valueText(f, 'end-ref'), valueText(f, 'end-live')], [scientific(atHalf), scientific(atOpen)]);
  f.load(); f.seek(scene.duration);
  assert.deepEqual([valueText(f, 'end-ref'), valueText(f, 'end-live')], [scientific(atHalf), scientific(atOpen)]);
  assert.deepEqual([gateLabel(f, 0), gateLabel(f, 1)], [`f = ${HALF.toFixed(3)}`, `f = ${OPEN.toFixed(3)}`]);
  assert.deepEqual([bandLabel(f, 0), bandLabel(f, 1)], ['b_f = 0', `b_f = +${values.bias}`]);
  // The gap between them is counted, not asserted: thirteen orders, not "about ten".
  assert.equal(f.root.dataset.orders, String(Math.floor(Math.log10(atOpen / atHalf))));
  assert.equal(f.root.dataset.orders, '13');
});

test('gate-product: the ratio badge is 1.580e13 -- sixteen trillion, not the 10^14 of subtracted roundings', t => {
  const f = fixture(t, NAME, {width: WIDE});
  const values = declared(f);
  const [HALF, OPEN] = gates(values);
  // The exact ratio of the two anchors, on the floats: (sigma(1)/sigma(0))^80.
  const ratio = held(OPEN / HALF, values.horizon);
  assert.equal(ratio.toPrecision(3), '1.58e+13');
  assert.equal(ratio.toPrecision(4), '1.580e+13');
  close(ratio, held(OPEN, values.horizon) / held(HALF, values.horizon), 1e-2);
  // Subtracting the two rounded exponents, -25 and -11, gives 14: the badge must show the
  // computed 13, and it must be the same number in digits and in words.
  const exponent = Math.floor(Math.log10(ratio));
  assert.equal(exponent, 13);
  assert.notEqual(exponent, -11 - -25);
  // In the right-hand column (wide) and in the strip under the chart (narrow) alike: the
  // number, the words, the badge's own data-ratio, and both endpoints.
  const atHalf = held(HALF, values.horizon), atOpen = held(OPEN, values.horizon);
  for (const width of WIDTHS) {
    const w = fixture(t, NAME, {width}); w.load(); w.open(); w.seek(scene.duration);
    assert.equal(w.root.dataset.layout, width < 600 ? 'narrow' : 'wide');
    assert.equal(Number(w.root.dataset.ratio).toPrecision(3), '1.58e+13');
    close(Number(w.root.dataset.ratio), ratio, 1e-2);
    assert.equal(valueText(w, 'ratio'), `× ${scientific(ratio, 1)}`, `${width}px`);
    assert.equal(valueText(w, 'ratio'), '× 1.6 × 10¹³', `${width}px`);
    assert.equal(badgeWords(w), 'sixteen trillion times larger', `${width}px`);
    assert.equal(Number(w.root.querySelector('[data-mark="badge"]').dataset.ratio).toPrecision(3), '1.58e+13');
    assert.deepEqual([valueText(w, 'end-ref'), valueText(w, 'end-live')], [scientific(atHalf), scientific(atOpen)], `${width}px`);
    if (width < 600) {
      // The strip carries the two endpoints on one line and the words on one line when they fit.
      const strip = w.root.querySelector('[data-mark="badge"] [data-mark="strip-ends"]');
      assert(strip && strip.querySelector('[data-value="end-ref"]') && strip.querySelector('[data-value="end-live"]'));
      assert.deepEqual(badgeLines(w), ['sixteen trillion times larger']);
    } else assert.deepEqual(badgeLines(w), ['sixteen trillion', 'times larger']);
    // The arrival caption says it in words, computed from the same ratio.
    w.seek(scene.beats[4] + 1);
    assert.match(caption(w).textContent, /^Sixteen trillion times larger/);
  }
  // A pane too narrow for one line splits the strip's words and still says the same thing.
  const tiny = fixture(t, NAME, {width: 211}); tiny.load(); tiny.open(); tiny.seek(scene.duration);
  assert.deepEqual(badgeLines(tiny), ['sixteen trillion', 'times larger']);
  assert.equal(valueText(tiny, 'ratio'), '× 1.6 × 10¹³');
  // The words are the ratio to two significant figures: 1.58e13 -> 16 x 10^12.
  assert.equal(Math.round(ratio / 1e12), 16);
  // Statically too -- in both prints of the frame -- and in the transcript, the picture's
  // own title, and the slider's name.
  const s = fixture(t, NAME);
  assert.equal(valueText(s, 'ratio'), '× 1.6 × 10¹³');
  assert.equal(s.$('[data-static-frame="narrow"] [data-value="ratio"]').textContent, '× 1.6 × 10¹³');
  assert.equal([...s.$('[data-static-frame="narrow"]').querySelectorAll('[data-words]')].map(n => n.textContent).join(' '), 'sixteen trillion times larger');
  assert.match(s.root.querySelector('.mechanism-transcript').textContent, /× 1\.6 × 10¹³: sixteen trillion times larger/);
  assert.match(s.$('svg title').textContent, /sixteen trillion times larger/);
  assert.match(slider(s).getAttribute('aria-valuetext'), /sixteen trillion times the b_f = 0 value/);
  void f;
});

test('gate-product: the count is attributed in both roundings, and every printed number is one the scene computes', t => {
  const f = fixture(t, NAME);
  const values = declared(f);
  const [HALF, OPEN] = gates(values);
  const atHalf = held(HALF, values.horizon), atOpen = held(OPEN, values.horizon);
  // Both roundings are computed here the way the panel must compute them: the chapter's
  // order of magnitude is log10 rounded to the nearest integer, the appendix's is the same
  // scientific form to three significant figures. Neither is typed as a string.
  const exponent = Math.round(Math.log10(atHalf));
  const chapterRounding = `10${superscript(exponent)}`;
  const appendixRounding = scientific(atHalf, 2);
  assert.equal(chapterRounding, '10⁻²⁴');
  assert.equal(appendixRounding, '8.27 × 10⁻²⁵');
  assert(chapterSource(NAME).includes(`$0.5^{${values.horizon}} \\approx 10^{${exponent}}$`),
    'chapter 10 no longer rounds this product to the order of magnitude the transcript quotes');
  const sciExponent = Math.floor(Math.log10(atHalf));
  const mantissa = (atHalf / Math.pow(10, sciExponent)).toFixed(2);
  assert.equal(`${mantissa} × 10${superscript(sciExponent)}`, appendixRounding);
  assert(appendixSource().includes(`$0.5^{${values.horizon}}=${mantissa}\\times10^{${sciExponent}}$`),
    `${APPENDIX} no longer prints ${appendixRounding}`);
  // The attribution lives in the transcript's arrival item (the caption's twenty words are
  // spent on the ratio and the "not exactly zero" claim), and the endpoint label is
  // literally the string the appendix prints.
  const transcript = f.root.querySelector('.mechanism-transcript').textContent;
  for (const text of [scientific(atHalf), chapterRounding, appendixRounding, 'Appendix A3', scientific(atOpen)]) {
    assert(transcript.includes(text), `the transcript no longer carries ${text}`);
  }
  assert.equal(valueText(f, 'end-ref'), appendixRounding);
  // The arrival caption's "10^-11 of the gradient" is the same rounding rule applied to
  // the other anchor, so the two orders of magnitude the panel states come from one rule.
  const openOrder = `10${superscript(Math.round(Math.log10(atOpen)))}`;
  assert.equal(openOrder, '10⁻¹¹');
  f.load(); f.open(); f.seek(scene.beats[4] + 1);
  assert(caption(f).textContent.includes(`yet ${openOrder} of the gradient`), caption(f).textContent);
  // Close the escape that "includes" leaves open: every scientific number written into the
  // static panel -- picture, transcript, readouts -- must be one this scene computes: the
  // five slider ticks' f^80, the ratios at those ticks, and the two linear-beat values the
  // transcript quotes (0.5^12 and sigma(1)^20). A second copy of a right number hides a
  // first copy gone wrong.
  const spec = sliderSpec(f);
  const computed = new Set();
  for (const b of spec.ticks) {
    const g = sigma(b), reached = held(g, values.horizon), r = reached / atHalf;
    computed.add(scientific(reached));
    if (Math.abs(Math.log10(r)) >= 0.05) computed.add(scientific(r, 1));
  }
  computed.add(scientific(held(HALF, 12))); computed.add(scientific(held(OPEN, 20)));
  for (const m of values.measured) computed.add(scientific(held(m, values.horizon)));
  assert(computed.has('1.27 × 10⁻⁷⁴') && computed.has('2.36 × 10⁻⁴⁶') && computed.has('3.89 × 10⁻⁵') && computed.has('4.7 × 10¹⁹'));
  const spoken = node => [...node.childNodes].map(child => (child.nodeType === 3 ? child.textContent : spoken(child))).join(' ');
  const s = fixture(t, NAME);
  const written = spoken(s.root).match(/\d\.\d{1,2} × 10[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+/g) || [];
  assert(written.length >= 14, `only ${written.length} scientific numbers in the static panel`);
  for (const number of written) assert(computed.has(number), `the panel prints ${number}, which this scene does not compute`);
  // No four-figure form survives anywhere: one precision, the appendix's.
  assert.doesNotMatch(spoken(s.root), /\d\.\d{3} × 10/, 'a four-significant-figure number survived');
  // And the products of the measured means are never printed: those means are quoted in
  // the boundary as the chapter's measurement, not drawn and not raised to the 80th power.
  for (const m of values.measured) assert(!spoken(s.root).includes(scientific(held(m, values.horizon))));
  // The same precision on the live picture at every layout, at rest and under a drag: the
  // narrow strip prints the endpoints through its own code path.
  for (const width of WIDTHS) {
    const w = fixture(t, NAME, {width}); w.load(); w.open(); w.seek(scene.duration);
    const drawn = () => [...w.root.querySelectorAll('[data-drawing] text')].map(n => n.textContent).join(' ');
    for (const b of [null, 2, -1, 0.35]) {
      if (b !== null) drag(w, b);
      assert.doesNotMatch(drawn(), /\d\.\d{3} × 10/, `four figures at ${width}px, b_f = ${b}`);
      for (const number of drawn().match(/\d\.\d{1,2} × 10[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+/g) || []) {
        const g = sigma(b === null ? values.bias : b), reached = held(g, values.horizon);
        assert([scientific(atHalf), scientific(reached), scientific(reached / atHalf, 1)].includes(number),
          `${number} at ${width}px, b_f = ${b} is not the reference, the live endpoint or their ratio`);
      }
    }
  }
});

test('gate-product: sigma at the five slider ticks, and everything the slider announces at each', t => {
  const f = fixture(t, NAME, {width: WIDE});
  const values = declared(f);
  const spec = sliderSpec(f);
  assert.deepEqual(spec.ticks, [-2, -1, 0, 1, 2]);
  assert.equal(spec.min, -2); assert.equal(spec.max, 2); assert.equal(spec.step, 0.05);
  // The brief's five sigmoids and five powers, on the floats.
  const expected = {
    '-2': ['0.119203', '1.27e-74'], '-1': ['0.268941', '2.36e-46'], '0': ['0.500000', '8.27e-25'],
    '1': ['0.731059', '1.31e-11'], '2': ['0.880797', '3.89e-5']
  };
  for (const b of spec.ticks) {
    assert.equal(sigma(b).toFixed(6), expected[b][0]);
    assert.equal(held(sigma(b), values.horizon).toExponential(2), expected[b][1]);
  }
  const atHalf = held(values.half, values.horizon);
  // The badge's words at each tick, this suite's own spelling.
  const WORDS = {'-2': 'fifty orders of magnitude smaller', '-1': 'twenty-two orders of magnitude smaller',
    '0': 'the same as the reference', '1': 'sixteen trillion times larger', '2': 'forty-seven quintillion times larger'};
  assert.equal(Math.round(-Math.log10(held(sigma(-2), values.horizon) / atHalf)), 50);
  assert.equal(Math.round(-Math.log10(held(sigma(-1), values.horizon) / atHalf)), 22);
  assert.equal(Math.round(held(sigma(2), values.horizon) / atHalf / 1e18), 47);
  // Every value the slider announces, at every layout -- the strip and the column are
  // different code paths -- and the endpoint dot, labels, bracket and badge box on the
  // curve's own last point at each tick.
  for (const width of WIDTHS) {
    const w = fixture(t, NAME, {width}); w.load(); w.open(); w.seek(scene.duration);
    for (const b of spec.ticks) {
      drag(w, b);
      const label = `${width}px, b_f = ${b}`;
      const g = sigma(b), reached = held(g, values.horizon);
      assert.equal(Number(w.root.dataset.bf), b);
      assert.equal(Number(w.root.dataset.f), g, `sigma(${b})`);
      assert.equal(Number(w.root.dataset.retention), reached, `sigma(${b})^${values.horizon}`);
      close(Number(w.root.dataset.ratio), reached / atHalf, 1e-9 * reached / atHalf);
      close(Number(w.root.querySelector('[data-mark="badge"]').dataset.ratio), reached / atHalf, 1e-9 * reached / atHalf, label);
      assert.equal(valueText(w, 'end-live'), scientific(reached), label);
      assert.equal(valueText(w, 'end-ref'), scientific(atHalf), label);
      assert.equal(valueText(w, 'ratio'), Math.abs(Math.log10(reached / atHalf)) < 0.05 ? '× 1' : `× ${scientific(reached / atHalf, 1)}`, label);
      assert.equal(badgeWords(w), WORDS[b], label);
      assert.equal(gateLabel(w, 1), `f = ${g.toFixed(3)}`, label);
      assert.equal(bandLabel(w, 1), `b_f = ${b === 0 ? '0' : b > 0 ? `+${b}` : `−${-b}`}`, label);
      assert.equal(bandLabel(w, 0), 'b_f = 0'); assert.equal(gateLabel(w, 0), `f = ${values.half.toFixed(3)}`);
      const readout = w.$('[data-bias-readout]').textContent;
      assert(readout.includes(`= ${b < 0 ? '−' : '+'}${Math.abs(b).toFixed(2)}`) && readout.includes(`= ${g.toFixed(3)}`), readout);
      const spoken = slider(w).getAttribute('aria-valuetext');
      assert(spoken.includes(`σ(b_f) = ${g.toFixed(3)}`) && spoken.includes(scientific(reached)), spoken);
      if (b === 1) assert.match(spoken, /sixteen trillion times the b_f = 0 value/);
      if (b === 2) assert.match(spoken, /forty-seven quintillion times the b_f = 0 value/);
      if (b === 0) assert.match(spoken, /the same as the b_f = 0 value/);
      if (b < 0) assert.match(spoken, /orders of magnitude smaller than the b_f = 0 value/);
      // The picture's accessible name names the dragged b_f and its gate, not the timeline's.
      assert.match(w.$('[data-figure] svg').getAttribute('aria-label'), new RegExp(`^log axis\\. b_f = ${b === 0 ? '0' : b > 0 ? `\\+${b}` : `−${-b}`}, f = ${g.toFixed(3)}\\.`));
      const {apart} = endpointsOnCurves(w, label);
      assert.equal(apart, b !== 0, `${label}: endpoints ${apart ? 'apart' : 'coincident'}`);
      // The transcript names each tick's value for the script-free reader.
      assert(w.root.querySelector('.mechanism-transcript').textContent.includes(scientific(reached)), `transcript lacks ${scientific(reached)}`);
    }
  }
  void f;
});

test('gate-product: the published retention is f^80 for the f the slider shows, at every scrubbed time', t => {
  const f = fixture(t, NAME, {width: WIDE});
  const values = declared(f);
  f.load(); f.open();
  const seen = new Set();
  for (const time of times()) {
    f.seek(time);
    const bf = Number(f.root.dataset.bf), gate = Number(f.root.dataset.f);
    const reached = Number(f.root.dataset.retention);
    // Exactly, not approximately: both are the same closed form on the same f.
    assert.equal(gate, sigma(bf), `f is not sigma(b_f) at ${time}s`);
    assert.equal(reached, Math.pow(gate, values.horizon),
      `the published horizon value is not f^${values.horizon} at ${time}s (f = ${gate})`);
    assert(gate > 0 && gate < 1, `f left the open interval at ${time}s: ${gate}`);
    assert.equal(Number(f.root.dataset.ratio), reached / held(values.half, values.horizon));
    seen.add(gate);
    // Whenever the endpoints are shown, the live label IS f^80 for the current gate.
    if (value(f, 'end-live')) assert.equal(valueText(f, 'end-live'), scientific(reached), `endpoint label at ${time}s`);
    // The slider follows the timeline: its value is the timeline's b_f at every time.
    close(Number(slider(f).value), bf, 0.05 + 1e-9);
    assert.equal(f.root.dataset.override, '');
  }
  assert(seen.size > 40, `f never really moved: ${seen.size} distinct values`);
});

test('gate-product: the readout is monotone in f, and strictly so across the opening', t => {
  const f = fixture(t, NAME);
  const values = declared(f);
  const [HALF, OPEN] = gates(values);
  const spec = sliderSpec(f);
  f.load(); f.open();
  const samples = [];
  for (const time of times()) {
    f.seek(time);
    samples.push([Number(f.root.dataset.f), Number(f.root.dataset.retention)]);
  }
  // A larger gate must never retain less, whenever in the timeline the two were sampled.
  const sorted = [...samples].sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < sorted.length; i++) {
    const [gate, v] = sorted[i], [before, earlier] = sorted[i - 1];
    if (gate === before) { assert.equal(v, earlier); continue; }
    assert(v > earlier, `f rose from ${before} to ${gate} and the retention fell from ${earlier} to ${v}`);
  }
  // The sweep really covers the interval between the two anchors, in order, and then the
  // excursion to the slider's maximum and back.
  const opening = samples.filter(([gate]) => gate > HALF && gate < OPEN);
  assert(opening.length > 20, `the valve barely opened: ${opening.length} intermediate gates`);
  const beyond = samples.filter(([gate]) => gate > OPEN && gate < sigma(spec.max));
  assert(beyond.length > 20, `the sweep barely left +1: ${beyond.length} gates beyond it`);
  assert.equal(Math.min(...samples.map(s => s[0])), HALF);
  assert.equal(Math.max(...samples.map(s => s[0])), sigma(spec.max));
  // Monotone with an exponent of 80 means enormous: a 0.23 rise in f buys 13 orders.
  close(Math.log10(held(OPEN, values.horizon) / held(HALF, values.horizon)), 13.1985738706, 1e-9);
});

test('gate-product: the curves are f^k, read back through the axis in both modes and at every width', t => {
  const values = declared(fixture(t, NAME));
  const [HALF, OPEN] = gates(values);
  for (const width of [NARROW, DESKTOP, WIDE]) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    // Linear, while the word crosses the live band: the reference curve is complete and the
    // live curve grows one point per step behind the word.
    f.seek(scene.beats[2] + 4);
    assert.equal(f.root.dataset.mode, 'linear');
    const ref = curvePoints(f, 'ref'), live = curvePoints(f, 'live');
    assert.equal(ref.length, values.horizon + 1);
    assert.equal(live.length, Number(f.root.dataset.botK) + 1);
    assert(live.length > 5 && live.length < values.horizon, `live curve has ${live.length} points mid-travel`);
    sameCurve(ref, HALF, 'linear', `ref@${width}`); sameCurve(live, OPEN, 'linear', `live@${width}`);
    // Log, after the morph: two straight lines of different slope, both complete.
    f.seek(scene.beats[3] + 2);
    assert.equal(f.root.dataset.mode, 'log'); assert.equal(f.root.dataset.morph, '1.000');
    const refLog = curvePoints(f, 'ref'), liveLog = curvePoints(f, 'live');
    assert.equal(refLog.length, values.horizon + 1); assert.equal(liveLog.length, values.horizon + 1);
    sameCurve(refLog, HALF, 'log', `ref-log@${width}`); sameCurve(liveLog, OPEN, 'log', `live-log@${width}`);
    // Straight: the decades grow by the same slope per step -- -0.301 and -0.136.
    const slope = pts => (pts[values.horizon].unit - pts[0].unit) / values.horizon;
    close(slope(refLog), -Math.log10(HALF), 1e-3); close(slope(liveLog), -Math.log10(OPEN), 1e-3);
    assert.equal((-Math.log10(HALF)).toFixed(3), '0.301'); assert.equal((-Math.log10(OPEN)).toFixed(3), '0.136');
    // Before the word moves there is no curve at all; a curve is a trace, not a chart.
    f.seek(0); assert.equal(curve(f, 'ref'), null); assert.equal(curve(f, 'live'), null);
    f.seek(scene.beats[1] + 0.5); assert(curve(f, 'ref')); assert.equal(curve(f, 'live'), null);
    // The endpoints stand on the curves' last points, and the reference dot is dashed-curve
    // coloured but never moves with the slider.
    f.seek(scene.duration);
    const fr = frame(f), end = f.root.querySelector('[data-mark="end-live"]');
    close(attr(end, 'cx'), fr.x1, 0.01);
    close(attr(end, 'cy'), fr.y0 + Math.min(1, -Math.log10(held(OPEN, values.horizon)) / FLOOR) * (fr.y1 - fr.y0), 0.02);
    assert.equal(endpointsOnCurves(f, `end@${width}`).apart, true);
  }
});

test('gate-product: the river\'s ink is the same mapping as the chart, in both modes, and the word carries its band\'s ink', t => {
  const f = fixture(t, NAME, {width: WIDE});
  const values = declared(f);
  const [HALF, OPEN] = gates(values);
  f.load(); f.open();
  const checkBand = (band, fGate, mode, revealed, label) => {
    const drawn = cells(f, band);
    const present = new Set(drawn.map(c => Number(c.dataset.cell)));
    for (let k = 1; k <= values.horizon; k++) {
      const a = inkOf(fGate, k, mode);
      const should = k <= revealed && a > 0.004;
      assert.equal(present.has(k), should, `${label}: cell ${k} ${present.has(k) ? 'drawn' : 'absent'} with ink ${a.toFixed(4)} at revealed ${revealed}`);
    }
    for (const c of drawn) {
      const k = Number(c.dataset.cell), a = inkOf(fGate, k, mode);
      close(attr(c, 'fill-opacity'), Number(a.toFixed(3)), 5e-4);
      close(Number(c.dataset.ink), a, 1e-5);
      assert.equal(c.getAttribute('fill').toLowerCase(), '#722f37', 'a band cell is wine');
    }
    // The word: opacity = its band's ink at its cell; below .05 it is the grey `· · ·`.
    // While legible it carries a white halo under its strokes, so the blue is seen
    // against white at that ink and not against wine at the same ink.
    const w = token(f, band), k = Math.min(values.horizon, Math.floor(revealed));
    assert.equal(Number(w.dataset.k), k);
    const a = k === 0 ? 1 : inkOf(fGate, k, mode);
    close(Number(w.dataset.ink), a, 1e-5);
    if (a < 0.05) { assert.equal(w.textContent, '· · ·'); assert(w.hasAttribute('data-blank')); assert.equal(w.getAttribute('fill').toLowerCase(), '#8a93a0'); assert(!w.hasAttribute('stroke')); }
    else { assert.equal(w.textContent, 'cat'); assert(!w.hasAttribute('data-blank')); close(attr(w, 'opacity'), Number(a.toFixed(3)), 5e-4); assert.equal(w.getAttribute('fill').toLowerCase(), '#2b6cb0'); halo(w, label); }
  };
  // Linear: the reference band is white by step 8 and the live band by step 18 -- honest.
  f.seek(scene.beats[2] + 4);
  checkBand(0, HALF, 'linear', values.horizon, 'ref linear');
  checkBand(1, OPEN, 'linear', Number(f.root.dataset.botK) + 0.5, 'live linear');
  assert.equal(cells(f, 0).length, 7); assert.equal(token(f, 0).textContent, '· · ·');
  assert(inkOf(HALF, 8, 'linear') < 1 / 255 && inkOf(HALF, 7, 'linear') >= 1 / 255);
  assert(inkOf(OPEN, 18, 'linear') < 1 / 255 && inkOf(OPEN, 17, 'linear') >= 1 / 255);
  // Mid-travel the word is drawn at its cell with the ink of that cell, in blue while legible.
  f.seek(scene.beats[1] + 0.3);
  assert(Number(token(f, 0).dataset.k) >= 1 && token(f, 0).textContent === 'cat');
  f.seek(scene.beats[1] + 1.2);
  assert.equal(token(f, 0).textContent, '· · ·', 'the reference word is gone by step 5 (ink .031)');
  // Log: the reference band fades to nothing exactly at 80 (ink .037); the live band keeps
  // a clear tint (.565) all the way -- and that is the mapping, stated, not "intact".
  f.seek(scene.beats[3] + 2);
  checkBand(0, HALF, 'log', values.horizon, 'ref log');
  checkBand(1, OPEN, 'log', values.horizon, 'live log');
  assert.equal(cells(f, 0).length, values.horizon); assert.equal(cells(f, 1).length, values.horizon);
  assert.equal(inkOf(HALF, values.horizon, 'log').toFixed(3), '0.037');
  assert.equal(inkOf(OPEN, values.horizon, 'log').toFixed(3), '0.565');
  assert.equal(token(f, 0).textContent, '· · ·'); assert.equal(token(f, 1).textContent, 'cat');
  close(attr(token(f, 1), 'opacity'), 0.565, 5e-4);
  // At the end of the timeline the same picture stands, and the boundary says what the
  // legibility means.
  f.seek(scene.duration);
  assert.equal(token(f, 0).textContent, '· · ·'); assert.equal(token(f, 1).textContent, 'cat');
  assert.match(f.root.querySelector('.mechanism-boundary').textContent, /legible on that mapping, not intact/);
  assert.match(f.root.querySelector('.mechanism-boundary').textContent, /1 \+ log₁₀\(fk\)\/25, clipped to \[0, 1\]/);
  // The word never sits past the band's right edge, and both copies move together in x.
  for (const time of times(0.25)) {
    f.seek(time);
    const fr = frame(f);
    for (const band of [0, 1]) {
      const w = token(f, band);
      assert(attr(w, 'x') >= fr.x0 && attr(w, 'x') <= fr.x1 - 17 + 1e-9, `word off its band at ${time}s`);
      // During the 0.6 s morph the ink glides between the two mappings; outside it, it is one of them.
      const k = Number(w.dataset.k), gate = band === 0 ? HALF : Number(f.root.dataset.f), mix = Number(f.root.dataset.morph);
      const expected = k === 0 ? 1 : mix <= 0 ? inkOf(gate, k, 'linear') : mix >= 1 ? inkOf(gate, k, 'log')
        : inkOf(gate, k, 'linear') + (inkOf(gate, k, 'log') - inkOf(gate, k, 'linear')) * mix;
      close(Number(w.dataset.ink), expected, 2e-3);
    }
  }
});

test('gate-product: the linear captions\' step numbers are the mapping\'s own thresholds, in words', t => {
  const f = fixture(t, NAME);
  const values = declared(f);
  const [HALF, OPEN] = gates(values);
  const firstInvisible = g => { let k = 1; while (k < values.horizon && inkOf(g, k, 'linear') >= 1 / 255) k++; return k; };
  assert.equal(firstInvisible(HALF), 8); assert.equal(firstInvisible(OPEN), 18);
  f.load(); f.open();
  f.seek(scene.beats[1] + 1);
  assert.match(caption(f).textContent, /By step eight the gradient is already invisible/);
  f.seek(scene.beats[2] + 1);
  assert.match(caption(f).textContent, /both look dead by step eighteen\./);
  f.seek(scene.beats[3] + 1);
  assert.match(caption(f).textContent, /On a log axis \(floor 10⁻²⁵\) the slopes differ/);
  assert.equal(f.root.dataset.floor, String(FLOOR));
});

test('gate-product: the linear -> log glide runs the 0.6 s before the fourth beat, cross-fades the labels, and is complete at the beat', t => {
  const f = fixture(t, NAME, {width: WIDE}); f.load(); f.open();
  const yTicks = () => [...f.root.querySelectorAll('[data-tick="y"]')].map(n => n.textContent);
  const labelGroups = () => [...f.root.querySelectorAll('[data-axis-labels]')]
    .map(g => [g.dataset.axisLabels, g.hasAttribute('opacity') ? Number(g.getAttribute('opacity')) : 1]);
  const start = scene.beats[3] - 0.6;
  f.seek(start - 0.05);
  assert.equal(f.root.dataset.mode, 'linear'); assert.equal(f.root.dataset.morph, '0.000');
  assert.deepEqual(yTicks(), ['0', '0.5', '1']); assert.deepEqual(labelGroups(), [['linear', 1]]);
  assert.equal(f.root.querySelector('[data-mark="floor"]'), null);
  // At the beat itself the log picture is finished: an arrow-key seek lands here.
  f.seek(scene.beats[3]);
  assert.equal(f.root.dataset.mode, 'log'); assert.equal(f.root.dataset.morph, '1.000');
  assert.deepEqual(yTicks(), ['10⁰', '10⁻⁵', '10⁻¹⁰', '10⁻¹⁵', '10⁻²⁰', '10⁻²⁵']); assert.deepEqual(labelGroups(), [['log', 1]]);
  assert.equal(f.root.querySelector('[data-mark="floor"]').textContent, 'floor 10⁻²⁵');
  assert.equal(cells(f, 0).length, 80); assert.equal(cells(f, 1).length, 80); assert.equal(token(f, 1).textContent, 'cat');
  // The glide: the mix rises 0 -> 1 over the 0.6 s before the beat, the mode flips at its
  // midpoint, and while it runs both label sets are drawn, cross-faded by the same mix
  // that moves the curves and re-tints the bands.
  const at = time => { f.seek(time); return {mix: Number(f.root.dataset.morph), cells: cells(f, 0).length, mode: f.root.dataset.mode, groups: labelGroups()}; };
  const a = at(start), b = at(start + 0.15), c = at(start + 0.3), d = at(start + 0.45), e = at(scene.beats[3]);
  assert(a.mix === 0 && b.mix > 0 && b.mix < 0.5 && c.mix > 0.3 && c.mix < 0.7 && d.mix > 0.5 && d.mix < 1 && e.mix === 1, `mix ${[a, b, c, d, e].map(s => s.mix)}`);
  assert.deepEqual([a.mode, b.mode, d.mode, e.mode], ['linear', 'linear', 'log', 'log']);
  for (const s of [b, c, d]) {
    assert.deepEqual(s.groups.map(g => g[0]), ['linear', 'log'], `mid-glide labels ${JSON.stringify(s.groups)}`);
    close(s.groups[0][1], 1 - s.mix, 6e-3); close(s.groups[1][1], s.mix, 6e-3);
  }
  assert(a.cells < b.cells && b.cells <= c.cells && c.cells <= d.cells && d.cells <= e.cells && e.cells === 80, `cells ${[a, b, c, d, e].map(s => s.cells)}`);
  // Once complete, the picture stands still through the beat.
  for (const [p, q] of [[scene.beats[3], scene.beats[3] + 0.001], [scene.beats[3] + 0.6, scene.beats[3] + 0.601], [scene.beats[3] + 1, scene.beats[3] + 1.5]]) {
    f.seek(p); const first = drawnMarkup(f); f.seek(q); assert.equal(drawnMarkup(f), first, `the picture keeps moving at ${q}s`);
  }
  // Under reduced motion there is no glide: the linear beat is linear to its last frame and
  // the log beat is the log picture from its first.
  const r = fixture(t, NAME, {reduced: true}); r.load(); r.open();
  r.seek(scene.beats[3]); assert.equal(r.root.dataset.morph, '1.000');
  r.seek(scene.beats[3] - 0.01); assert.equal(r.root.dataset.morph, '0.000');
  r.seek(start + 0.3); assert.equal(r.root.dataset.morph, '0.000'); assert.equal(r.root.dataset.mode, 'linear');
});

test('gate-product: at every declared beat the axes, the bands and the drawn mapping agree, and the arrow keys land on finished pictures', t => {
  const values = declared(fixture(t, NAME));
  const [HALF] = gates(values);
  for (const width of [NARROW, WIDE]) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    const agree = label => {
      const mode = f.root.dataset.mode;
      assert.deepEqual(modesOf(f), [mode, mode, mode], `${label}: axes and bands publish ${modesOf(f)} while the mode is ${mode}`);
      assert.deepEqual([...f.root.querySelectorAll('[data-axis-labels]')].map(g => g.dataset.axisLabels), [mode], `${label}: axis labels`);
      assert.equal(f.root.dataset.morph, mode === 'log' ? '1.000' : '0.000', `${label}: a glide in progress at a beat`);
      const gate = Number(f.root.dataset.f);
      if (curve(f, 'ref')) sameCurve(curvePoints(f, 'ref'), HALF, mode, `${label}: ref`);
      if (curve(f, 'live')) sameCurve(curvePoints(f, 'live'), gate, mode, `${label}: live`);
      for (const [band, g] of [[0, HALF], [1, gate]]) for (const c of cells(f, band)) {
        close(Number(c.dataset.ink), inkOf(g, Number(c.dataset.cell), mode), 1e-5, `${label}: band ${band} cell ${c.dataset.cell}`);
      }
    };
    for (const beat of scene.beats) for (const time of [beat - 0.001, beat, beat + 0.001]) {
      if (time < 0 || time > scene.duration) continue;
      f.seek(time); agree(`${width}px, ${time}s`);
    }
    f.seek(scene.duration); agree(`${width}px, end`);
    // Three Rights from the start park the reader on the log beat, paused, on the
    // finished log picture the beat's caption describes; a Left from the arrival beat
    // lands on the same frame.
    f.seek(0); f.key('ArrowRight'); f.key('ArrowRight'); f.key('ArrowRight');
    assert.equal(f.time, scene.beats[3]); assert(!f.playing);
    assert.equal(f.root.dataset.mode, 'log'); assert.equal(f.root.dataset.morph, '1.000');
    assert.equal(cells(f, 0).length, values.horizon); assert.equal(cells(f, 1).length, values.horizon);
    assert.equal(token(f, 1).textContent, 'cat'); assert.match(caption(f).textContent, /^On a log axis/);
    const landed = drawnMarkup(f);
    f.seek(scene.beats[4]); f.key('ArrowLeft');
    assert.equal(f.time, scene.beats[3]); assert.equal(drawnMarkup(f), landed);
  }
});

test('gate-product: the linear|log toggle flips chart and river together, and is live only when allowed', async t => {
  const f = fixture(t, NAME, {width: WIDE});
  const values = declared(f);
  const [HALF, OPEN] = gates(values);
  f.load(); f.open();
  const pressed = () => [axis(f, 'linear').getAttribute('aria-pressed'), axis(f, 'log').getAttribute('aria-pressed')];
  const disabled = () => [axis(f, 'linear').disabled, axis(f, 'log').disabled];
  // A true toggle group: aria-pressed on both, exactly one pressed, never inside the transport bar.
  assert.equal(axis(f, 'log').closest('[data-controls]'), null);
  f.seek(scene.beats[4] + 3); await settle();
  assert.deepEqual(pressed(), ['false', 'true']); assert.deepEqual(disabled(), [false, false]);
  axis(f, 'linear').click(); await settle();
  assert.equal(f.root.dataset.mode, 'linear'); assert.equal(f.root.dataset.modeOverride, 'linear');
  assert.deepEqual(pressed(), ['true', 'false']);
  // Both the chart and the river re-map from the same ink(k, mode), and every group says so.
  assert.deepEqual(modesOf(f), ['linear', 'linear', 'linear']);
  sameCurve(curvePoints(f, 'ref'), HALF, 'linear', 'toggled ref'); sameCurve(curvePoints(f, 'live'), OPEN, 'linear', 'toggled live');
  assert.equal(cells(f, 0).length, 7);
  for (const c of cells(f, 1)) close(attr(c, 'fill-opacity'), Number(inkOf(OPEN, Number(c.dataset.cell), 'linear').toFixed(3)), 5e-4);
  assert.equal(token(f, 1).textContent, '· · ·', 'on the linear axis the word is gone from both bands');
  assert.deepEqual([...f.root.querySelectorAll('[data-tick="y"]')].map(n => n.textContent), ['0', '0.5', '1']);
  // The endpoints and badge stay (the answer does not depend on the axis), the labels part.
  assert.equal(valueText(f, 'ratio'), '× 1.6 × 10¹³');
  const ys = ['end-ref', 'end-live'].map(n => attr(value(f, n), 'y'));
  assert(Math.abs(ys[0] - ys[1]) >= 16 - 1e-9, `endpoint labels ${ys} overlap on the linear axis`);
  // On the linear axis both endpoints sit on the floor: the ring and the dot share one
  // height, and the bracket -- which would be a 6 px dash -- is not drawn.
  const linearEnds = endpointsOnCurves(f, 'linear toggle');
  assert.equal(linearEnds.apart, false); assert.equal(f.root.querySelector('[data-mark="bracket"]'), null);
  assert.equal(f.root.querySelector('[data-mark="end-ref"]').getAttribute('cy'), f.root.querySelector('[data-mark="end-live"]').getAttribute('cy'));
  axis(f, 'log').click(); await settle();
  assert.equal(f.root.dataset.mode, 'log'); assert.deepEqual(pressed(), ['false', 'true']);
  assert.deepEqual(modesOf(f), ['log', 'log', 'log']);
  sameCurve(curvePoints(f, 'live'), OPEN, 'log', 'toggled back');
  assert.equal(token(f, 1).textContent, 'cat');
  assert.equal(endpointsOnCurves(f, 'log toggle').apart, true); assert(f.root.querySelector('[data-mark="bracket"]'));
  // The reader's choice stands across seeks that do not change the timeline's axis, and
  // yields when the timeline itself changes axis.
  axis(f, 'linear').click(); await settle();
  f.seek(scene.duration); assert.equal(f.root.dataset.mode, 'linear');
  f.seek(scene.beats[2]); assert.equal(f.root.dataset.mode, 'linear'); assert.equal(f.root.dataset.modeOverride, '');
  f.seek(scene.beats[3] + 1); assert.equal(f.root.dataset.mode, 'log');
  // Before the log beat the timeline owns the axis while playing; paused, the reader may look.
  f.seek(scene.beats[1] + 1); await settle(); assert.deepEqual(disabled(), [false, false]);
  f.play(); f.tick(100); await settle(); assert.deepEqual(disabled(), [true, true]);
  axis(f, 'log').click(); await settle(); assert.equal(f.root.dataset.mode, 'linear', 'a disabled toggle does nothing');
  f.play(); await settle(); assert(!f.playing); assert.deepEqual(disabled(), [false, false]);
  f.seek(scene.beats[4]); f.play(); f.tick(100); await settle(); assert.deepEqual(disabled(), [false, false]);
  axis(f, 'linear').click(); await settle(); assert.equal(f.root.dataset.mode, 'linear'); assert(f.playing, 'the toggle does not pause');
  f.play(); assert(!f.playing);
  // The stylesheet styles the pressed state, hides the toggle until the player has mounted,
  // and the toggle carries no SVG, so the pane is still one picture.
  assert.match(css, /\.gp-toggle button\[aria-pressed="true"\] \{ background: var\(--gp-ink\)/);
  assert.match(css, /\.mechanism-excerpt:not\(\[data-ready\]\) \.gp-toggle \{ visibility: hidden/);
  assert.equal(f.$('[data-axis-toggle]').querySelectorAll('svg').length, 0);
  assert.equal(f.$('[data-axis-toggle]').getAttribute('role'), 'group');
});

test('gate-product: dragging the slider pauses, takes over, and recomputes every mark from the dragged value', async t => {
  const values = declared(fixture(t, NAME));
  const [HALF, OPEN] = gates(values);
  const spec = sliderSpec(fixture(t, NAME));
  const g = sigma(spec.max), reached = held(g, values.horizon), ratio = reached / held(HALF, values.horizon);
  // At every layout: the strip and the column are different code paths.
  for (const width of WIDTHS) {
    const w = fixture(t, NAME, {width}); w.load(); w.open();
    const label = `${width}px`;
    w.seek(scene.beats[4] + 3);
    const before = {ref: curve(w, 'ref').getAttribute('d'), band: w.root.querySelector('[data-band="0"]').outerHTML, endRef: valueText(w, 'end-ref')};
    w.play(); w.tick(100); assert(w.playing);
    drag(w, spec.max);
    assert(!w.playing, 'a drag pauses playback');
    assert.equal(w.root.dataset.override, 'slider');
    assert.equal(Number(w.root.dataset.bf), spec.max); assert.equal(Number(w.root.dataset.f), g);
    assert.equal(Number(w.root.dataset.retention), reached);
    // Curves, river, word, endpoint, badge, labels, readout, formula: all from sigma(+2).
    sameCurve(curvePoints(w, 'live'), g, 'log', `${label} dragged live`);
    assert.equal(curvePoints(w, 'live').length, values.horizon + 1);
    for (const c of cells(w, 1)) close(attr(c, 'fill-opacity'), Number(inkOf(g, Number(c.dataset.cell), 'log').toFixed(3)), 5e-4);
    close(Number(token(w, 1).dataset.ink), inkOf(g, values.horizon, 'log'), 1e-5);
    assert.equal(token(w, 1).textContent, 'cat');
    assert.equal(valueText(w, 'end-live'), scientific(reached), label); assert.equal(valueText(w, 'end-live'), '3.89 × 10⁻⁵', label);
    assert.equal(valueText(w, 'ratio'), `× ${scientific(ratio, 1)}`, label); assert.equal(valueText(w, 'ratio'), '× 4.7 × 10¹⁹', label);
    assert.equal(badgeWords(w), 'forty-seven quintillion times larger', label);
    // The badge's published ratio is the drawn one, and the picture's accessible name names
    // the dragged b_f and gate -- what assistive technology hears is what is drawn.
    close(Number(w.root.querySelector('[data-mark="badge"]').dataset.ratio), ratio, 1e-9 * ratio, label);
    close(Number(w.root.dataset.ratio), ratio, 1e-9 * ratio, label);
    assert.match(w.$('[data-figure] svg').getAttribute('aria-label'), /^log axis\. b_f = \+2, f = 0\.881\. /, label);
    assert.match(w.$('[data-figure] svg').getAttribute('aria-label'), /on the b_f = \+2 band\. After 80 steps: 8\.27 × 10⁻²⁵ against 3\.89 × 10⁻⁵\.$/, label);
    assert.equal(bandLabel(w, 1), `b_f = +${spec.max}`, label); assert.equal(gateLabel(w, 1), `f = ${g.toFixed(3)}`, label);
    assert.match(w.$('[data-bias-readout]').textContent, /= \+2\.00/);
    assert.equal(w.root.dataset.formulaLit, 'gp-fk gp-bias');
    assert.match(caption(w).textContent, /^Drag bf yourself: the valve’s resting position decides what survives\.$/);
    // The endpoint dot, its label, the bracket and the badge box follow the dragged curve's
    // last point, not the timeline's.
    assert.equal(endpointsOnCurves(w, `${label} drag +2`).apart, true);
    // The reference curve, band and endpoint do not move: b_f = 0 is the fixed comparison.
    assert.equal(curve(w, 'ref').getAttribute('d'), before.ref);
    assert.equal(w.root.querySelector('[data-band="0"]').outerHTML, before.band);
    assert.equal(valueText(w, 'end-ref'), before.endRef);
    // A drag to a shut gate puts the live endpoint on the floor, 8 px under the reference
    // on the log axis: a small but real gap, and a bracket that spans it.
    drag(w, -1);
    assert.equal(valueText(w, 'end-live'), '2.36 × 10⁻⁴⁶', label);
    assert.equal(badgeWords(w), 'twenty-two orders of magnitude smaller', label);
    assert.match(w.$('[data-figure] svg').getAttribute('aria-label'), /^log axis\. b_f = −1, f = 0\.269\. /, label);
    const ends = endpointsOnCurves(w, `${label} drag -1`);
    assert.equal(ends.apart, true);
    const fr = frame(w);
    close(attr(w.root.querySelector('[data-mark="end-live"]'), 'cy'), fr.y1, 0.02, 'the live endpoint sits on the floor');
    close(attr(w.root.querySelector('[data-mark="end-ref"]'), 'cy'), fr.y0 + (-Math.log10(held(HALF, values.horizon)) / FLOOR) * (fr.y1 - fr.y0), 0.02);
    // Back at the timeline's own b_f, the name is the timeline's again.
    w.seek(scene.beats[4] + 3);
    assert.match(w.$('[data-figure] svg').getAttribute('aria-label'), /^log axis\. b_f = \+1, f = 0\.731\. /);
  }
  const f = fixture(t, NAME, {width: WIDE}); f.load(); f.open();
  // A drag in the ask beat shows the answer for that b_f -- both traces complete -- because
  // the reader asked; the formula lights with it.
  f.seek(0); assert.equal(f.root.dataset.override, ''); assert.equal(curve(f, 'live'), null);
  drag(f, -1);
  assert.equal(curvePoints(f, 'live').length, values.horizon + 1); assert(value(f, 'ratio'));
  assert.equal(valueText(f, 'end-live'), '2.36 × 10⁻⁴⁶');
  assert.deepEqual(badgeLines(f), ['twenty-two orders of magnitude', 'smaller']);
  assert.equal(f.root.dataset.formulaLit, 'gp-fk gp-bias');
  assert.equal(f.root.dataset.mode, 'linear', 'the drag keeps the timeline\'s axis');
  // On the linear axis both endpoints are on the floor: coincident, so no bracket.
  assert.equal(endpointsOnCurves(f, 'linear drag -1').apart, false);
  // At b_f = 0 the live curve coincides with the reference and the badge says so.
  drag(f, 0);
  assert.equal(valueText(f, 'ratio'), '× 1'); assert.equal(valueText(f, 'end-live'), valueText(f, 'end-ref'));
  assert.equal(badgeWords(f), 'the same as the reference');
  f.seek(scene.beats[4] + 3); drag(f, 0);
  assert.equal(endpointsOnCurves(f, 'log drag 0').apart, false, 'at b_f = 0 the two endpoints are one point');
  // A seek is the timeline speaking again: the detour is dropped and the picture is the
  // timeline's, exactly as it was without the drag.
  drag(f, 2);
  f.seek(scene.beats[4] + 3);
  assert.equal(f.root.dataset.override, ''); assert.equal(Number(f.root.dataset.bf), values.bias);
  assert.equal(valueText(f, 'end-live'), scientific(held(OPEN, values.horizon)));
  const clean = fixture(t, NAME, {width: WIDE}); clean.load(); clean.open(); clean.seek(scene.beats[4] + 3);
  assert.equal(drawnMarkup(f), drawnMarkup(clean));
  // Play from a pause resumes the timeline's own b_f from the first frame.
  drag(f, 2); assert.equal(Number(f.root.dataset.bf), 2);
  f.play(); assert.equal(f.root.dataset.override, ''); assert.equal(Number(f.root.dataset.bf), values.bias);
  f.tick(100); assert.equal(Number(f.root.dataset.bf), values.bias); assert(f.playing);
  f.play();
  // Space on the pane, too.
  drag(f, -2); f.key(' '); assert(f.playing); assert.equal(f.root.dataset.override, ''); f.key(' ');
  // The slider clamps to its own range.
  drag(f, 7); assert.equal(Number(f.root.dataset.bf), spec.max);
  // Reduced motion: dragging works the same way on the held picture.
  const r = fixture(t, NAME, {reduced: true, width: WIDE}); r.load(); r.open(); r.seek(scene.beats[2] + 1);
  drag(r, 2); assert.equal(Number(r.root.dataset.f), g); assert.equal(valueText(r, 'end-live'), '3.89 × 10⁻⁵');
});

test('gate-product: arrow keys on the slider move b_f and are never seen by the pane\'s beat seeking', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  f.seek(scene.beats[4] + 3);
  const s = slider(f);
  for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End', ' ', 'k']) {
    const event = new f.w.KeyboardEvent('keydown', {key, bubbles: true, cancelable: true});
    s.dispatchEvent(event);
    assert.equal(event.defaultPrevented, false, `${key} on the slider was captured`);
    assert.equal(f.time, scene.beats[4] + 3, `${key} on the slider moved the timeline`);
    assert(!f.playing, `${key} on the slider started playback`);
  }
  // The same keys on the pane itself still seek and toggle, so the two surfaces are separate.
  f.key('ArrowRight'); assert.equal(f.time, scene.beats[5]);
  f.key('ArrowLeft'); assert.equal(f.time, scene.beats[4]);
  // The transport binds its scrubber inside its own bar, so a second range in the pane can
  // never become the clock -- in the transport, and in the harness that drives it.
  assert.match(read('shared/playback.js'), /const range = \$\('\[data-controls\] input\[type="range"\]'\)/);
  assert.match(fs.readFileSync(path.join(__dirname, 'html-tests', 'excerpt-harness.cjs'), 'utf8'), /seek\(time\) \{ \$\('\[data-controls\] input\[type=range\]'\)/);
  assert.equal(f.$('[data-controls] input[type=range]').max, String(scene.duration));
  assert.equal(s.max, '2');
  // The slider names itself and what it does, and says its value in words.
  assert.match(s.getAttribute('aria-label'), /forget-gate bias/i);
  assert.match(s.getAttribute('aria-valuetext'), /^b_f = [+−]\d\.\d\d, σ\(b_f\) = 0\.\d{3}; after 80 steps \d\.\d\d × 10/);
  assert.match(f.$('#gate-product-playback-help').textContent, /arrow keys move b/);
  assert.match(f.$('#gate-product-playback-help').textContent, /never seek the timeline/);
});

test('gate-product: b_f is the one parameter control -- the timeline sweeps it, the pane carries no other', t => {
  const f = fixture(t, NAME);
  f.load(); f.open();
  const pane = f.$('[data-pane]');
  // Two ranges: the transport's scrubber inside its bar, and the b_f slider outside it.
  const ranges = [...pane.querySelectorAll('input[type=range]')];
  assert.equal(ranges.length, 2);
  assert.equal(ranges.filter(r => r.closest('[data-controls]')).length, 1);
  assert.equal(ranges.filter(r => r.hasAttribute('data-bias-slider')).length, 1);
  assert.deepEqual([...pane.querySelectorAll('input')].map(node => node.type), ['range', 'range']);
  assert.deepEqual([...pane.querySelectorAll('select')].map(node => node.dataset.speed !== undefined), [true]);
  // Buttons: play, fullscreen, and the two axis pills -- no third transport action.
  assert.equal(pane.querySelectorAll('button').length, 4);
  assert.equal(f.root.querySelectorAll('[data-action]').length, 2);
  assert.equal(pane.querySelectorAll('button[data-axis]').length, 2);
  // The timeline sweeps the slider: 0, then +1, then +2 and back, without a drag.
  const seen = [];
  for (const time of [0, scene.beats[2] + 1.5, scene.beats[5] + 2.5, scene.duration]) { f.seek(time); seen.push(Number(slider(f).value)); }
  assert.deepEqual(seen, [0, 1, 2, 1]);
  // And the panel says so in words: the one control, timeline first, drag after.
  assert.match(f.root.querySelector('.mechanism-intro').textContent, /The slider is the one control; the timeline moves it first, and you may drag it after/);
  assert.match(f.$('#gate-product-playback-help').textContent, /the one parameter control/);
  // The control is inert, and so hidden, until the player has mounted; space is reserved.
  assert.match(css, /\.mechanism-excerpt:not\(\[data-ready\]\) \.gp-slider \{ visibility: hidden/);
  assert.match(css, /\.gp-track input\[type="range"\] \{[^}]*accent-color: var\(--gp-parameter\)/);
});

test('gate-product: the picture takes its height from its viewBox -- one unit per pixel live, and two unshrunken static prints', t => {
  const f = fixture(t, NAME, {width: DESKTOP});
  // The svg is never given a fixed height: its height follows the viewBox the player sets
  // (the measured width by the layout's units), so nothing is letterboxed or scaled.
  assert.match(css, /\.gate-product-figure svg \{[^}]*\bheight:\s*auto\b/);
  assert.doesNotMatch(css, /\.gate-product-figure svg \{[^}]*[^-]height:\s*\d+px/);
  assert.doesNotMatch(css, /data-layout="narrow"\] \.gate-product-figure svg/, 'no per-layout fixed height');
  assert.match(css, /\.gate-product-figure \{[^}]*container-type: inline-size/);
  // Scripts off: the wide print at its own aspect, and under 600 px of figure the narrow
  // print at its own aspect instead -- chosen by the figure's width, the player's own line.
  assert.match(css, /\.mechanism-excerpt:not\(\[data-ready\]\) \.gate-product-figure svg \{ aspect-ratio: 713 \/ 400; \}/);
  assert.match(css, /\.mechanism-excerpt:not\(\[data-ready\]\) \.gate-product-figure \[data-static-frame="narrow"\] \{ display: none; \}/);
  assert.match(css, /@container \(max-width: 599px\) \{\s*\.mechanism-excerpt:not\(\[data-ready\]\) \.gate-product-figure svg \{ aspect-ratio: 296 \/ 462; \}\s*\.mechanism-excerpt:not\(\[data-ready\]\) \.gate-product-figure \[data-drawing\] \{ display: none; \}\s*\.mechanism-excerpt:not\(\[data-ready\]\) \.gate-product-figure \[data-static-frame="narrow"\] \{ display: block; \}\s*\}/);
  const svg = f.$('.gate-product-figure svg');
  const box = () => svg.getAttribute('viewBox').split(/\s+/).map(Number);
  // The wide print is drawn at the figure width a 1280 px page gives, so on that page one
  // static unit is one CSS pixel; the narrow print at the width a 390 px page gives.
  assert.deepEqual(box(), [0, 0, DESKTOP, HEIGHTS.wide], 'the static viewBox is the desktop frame');
  assert.equal(svg.getAttribute('preserveAspectRatio'), 'xMinYMin meet');
  const narrow = svg.querySelector('[data-static-frame="narrow"]');
  assert(narrow, 'the panel carries a narrow print of the final frame');
  assert.equal(narrow.dataset.width, '296'); assert.equal(narrow.dataset.height, String(HEIGHTS.narrow));
  assert.equal(narrow.getAttribute('transform'), `scale(${(DESKTOP / 296).toFixed(4)})`, 'the narrow print is scaled into the wide viewBox');
  assert(narrow.parentElement === svg && narrow.previousElementSibling === null || svg.querySelector('[data-drawing]').compareDocumentPosition(narrow) & 4, 'the wide print comes first');
  // The narrow print is the narrow layout: its own plot frame, its own type sizes, the
  // strip carrying both endpoints, the word legible on the second band.
  const lines = [...narrow.querySelectorAll('[data-mark="axes"] line')];
  const xAxis = lines.find(l => l.getAttribute('y1') === l.getAttribute('y2') && attr(l, 'x2') - attr(l, 'x1') > 50);
  assert.equal(attr(xAxis, 'x2'), 296 - 22); assert.equal(attr(xAxis, 'y1'), 200);
  assert.equal(narrow.querySelector('[data-band-label]').getAttribute('font-size'), '12');
  assert.equal(f.$('[data-drawing] [data-band-label]').getAttribute('font-size'), '15');
  assert.equal(narrow.querySelector('[data-value="ratio"]').textContent, '× 1.6 × 10¹³');
  assert(narrow.querySelector('[data-mark="strip-ends"] [data-value="end-live"]'));
  assert.equal(narrow.querySelector('[data-token="1"]').textContent, 'cat'); assert.equal(narrow.querySelector('[data-token="0"]').textContent, '· · ·');
  // It is the player's own 296 px render at t = 40 …
  const n = fixture(t, NAME, {width: 296}); n.load(); n.open(); n.seek(scene.duration);
  assert.equal(n.root.dataset.layout, 'narrow');
  assert.equal(canonicalMarkup(narrow.innerHTML), canonicalMarkup(n.$('[data-drawing]').innerHTML));
  // … and it is removed when the player mounts, so the live pane is one drawing, drawn once.
  f.load(); f.open();
  assert.equal(f.root.querySelectorAll('[data-static-frame]').length, 0);
  assert.equal(f.$('[data-pane]').querySelectorAll('svg:not([data-controls] svg) g[data-drawing]').length, 1);
  for (const width of [180, 300, 599, 600, 713, 1280]) {
    f.resize(width); f.seek(scene.duration);
    const layout = width >= 600 ? 'wide' : 'narrow';
    assert.equal(f.root.dataset.layout, layout);
    assert.equal(box()[3], HEIGHTS[layout], `the viewBox height is ${box()[3]}, not the layout's ${HEIGHTS[layout]}, at ${width}px`);
    assert.equal(box()[2], width, 'one user unit is one CSS pixel');
  }
  // Prose does not get recompiled: every comment in player.css that discusses the height
  // must name these two numbers and no other three-digit number.
  for (const comment of css.match(/\/\*[\s\S]*?\*\//g) || []) {
    if (!/height/i.test(comment)) continue;
    assert(comment.includes(String(HEIGHTS.wide)) && comment.includes(String(HEIGHTS.narrow)),
      `a comment in player.css discusses the height without naming ${HEIGHTS.wide} and ${HEIGHTS.narrow}:\n${comment}`);
    const others = (comment.match(/\b\d{3}\b/g) || []).filter(n => ![HEIGHTS.wide, HEIGHTS.narrow].includes(Number(n)));
    assert.deepEqual(others, [], `a comment in player.css names ${others.join(', ')} beside the heights:\n${comment}`);
  }
});

test('gate-product: every label stays inside the picture and off its neighbours, at every width and every beat', t => {
  const values = declared(fixture(t, NAME));
  const advance = (text, size) => [...text].reduce((total, ch) =>
    total + (ch === ' ' ? 0.3 : /[A-Z×]/.test(ch) ? 0.75 : /[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/.test(ch) ? 0.4 : 0.6), 0) * size;
  for (const width of [211, 300, 390, 599, 600, 713, 1100, 1280]) {
    const w = fixture(t, NAME, {width}); w.load(); w.open();
    const g = width >= 600 ? {x1: null} : {};
    for (const time of [2, 6, 9, 13, 16, 18.3, 21, 24.5, 27, 32.5, 33.5, 40]) {
      w.seek(time);
      const H = HEIGHTS[w.root.dataset.layout];
      assert.equal(w.$('.gate-product-figure svg').getAttribute('viewBox'), `0 0 ${width} ${H}`);
      const fr = frame(w);
      const extents = [];
      for (const node of w.root.querySelectorAll('[data-drawing] text')) {
        const size = Number(node.getAttribute('font-size')), anchor = node.getAttribute('text-anchor');
        const x = attr(node, 'x'), y = attr(node, 'y'), line = node.textContent;
        const width_ = advance(line, size);
        const [x0, x1] = anchor === 'end' ? [x - width_, x] : anchor === 'middle' ? [x - width_ / 2, x + width_ / 2] : [x, x + width_];
        assert(x0 >= -0.5, `"${line}" starts ${(-x0).toFixed(1)} units left of the picture at ${width}px, ${time}s`);
        assert(x1 <= width + 0.5, `"${line}" runs ${(x1 - width).toFixed(1)} units past the picture at ${width}px, ${time}s`);
        assert(y > 0 && y <= H, `"${line}" is drawn outside the picture at ${width}px`);
        extents.push({x0, x1, y, line, size});
      }
      // No two labels overlap, by the same advance horizontally and by cap height and
      // descender vertically (a baseline y with size s spans y - 0.72 s ... y + 0.2 s).
      const top = e => e.y - 0.72 * e.size, bottom = e => e.y + 0.2 * e.size;
      for (let i = 0; i < extents.length; i++) for (let j = i + 1; j < extents.length; j++) {
        const a = extents[i], b = extents[j];
        if (bottom(a) <= top(b) + 0.5 || bottom(b) <= top(a) + 0.5) continue;
        assert(a.x1 <= b.x0 + 0.5 || b.x1 <= a.x0 + 0.5, `"${a.line}" and "${b.line}" overlap at ${width}px, ${time}s`);
      }
      // The plot and the bands are inside the picture; the badge sits beside the plot (wide)
      // or under it (narrow), never over the bands.
      assert(fr.x0 > 0 && fr.x1 < width && fr.y0 > 0 && fr.y1 < H);
      const badge = w.root.querySelector('[data-mark="badge"] rect');
      if (badge) {
        const bx0 = attr(badge, 'x'), bx1 = bx0 + attr(badge, 'width'), by0 = attr(badge, 'y'), by1 = by0 + attr(badge, 'height');
        assert(bx0 >= 0 && bx1 <= width && by0 >= 0, `badge outside the picture at ${width}px, ${time}s`);
        const bandTop = Math.min(...[...w.root.querySelectorAll('[data-band] rect')].map(r => attr(r, 'y')));
        assert(by1 <= bandTop, `badge runs into the bands at ${width}px, ${time}s`);
        if (width >= 600) assert(bx0 > fr.x1, 'the badge stands in the right column');
        else assert(by0 > fr.y1, 'the badge strip sits under the chart');
      }
      for (const node of w.root.querySelectorAll('[data-cell]')) {
        assert(attr(node, 'x') >= fr.x0 - 0.01 && attr(node, 'x') + attr(node, 'width') <= fr.x1 + 0.5, `a cell outside the band at ${width}px`);
      }
    }
    // The HTML control sits on the same geometry: the slider track spans the plot's k-range
    // (wide) and the toggle is placed inside the plot's top-right corner.
    w.seek(scene.duration);
    const fr = frame(w), toggle = w.$('[data-axis-toggle]');
    if (width >= 600) assert.equal(w.$('.gp-slider').style.gridTemplateColumns, `${fr.x0}px ${fr.x1 - fr.x0}px 1fr`);
    else assert.equal(w.$('.gp-slider').style.gridTemplateColumns, '');
    assert.equal(toggle.style.right, `${width - fr.x1 + (width >= 600 ? 8 : 0)}px`);
    assert.equal(toggle.style.top, `${fr.y0 + 2}px`);
    void g;
  }
});

test('gate-product: the measured means are quoted as the chapter\'s measurement, never drawn, and f never visits them', t => {
  const f = fixture(t, NAME, {width: WIDE});
  const values = declared(f);
  const [, OPEN] = gates(values);
  const products = values.measured.map(level => held(level, values.horizon));
  assert.equal(products[0].toExponential(3), '2.918e-10');
  assert.equal(products[1].toExponential(3), '7.162e-21');
  assert.equal(scientific(products[0]), '2.92 × 10⁻¹⁰');
  assert.equal(scientific(products[1]), '7.16 × 10⁻²¹');
  // The solver's mean lands on the open side of sigma(1); the twin's on the shut side.
  assert(values.measured[0] > OPEN && values.measured[1] < OPEN);
  assert(products[0] > held(OPEN, values.horizon));
  assert(products[1] < held(OPEN, values.horizon));
  // Named in the boundary as means over units and probes, beside the recall experiment,
  // and nowhere in the pane or the transcript.
  const boundary = f.root.querySelector('.mechanism-boundary').textContent;
  assert.match(boundary, /means near 0\.76 for the solver and 0\.56 for the default twin, over units and probes/);
  f.load(); f.open();
  for (const time of [0, scene.beats[4] + 1, scene.duration]) {
    f.seek(time);
    const pane = f.$('[data-pane]').textContent;
    for (const m of values.measured) { assert(!pane.includes(String(m))); assert(!pane.includes(scientific(held(m, values.horizon)))); }
  }
  assert(!f.root.querySelector('.mechanism-transcript').textContent.includes('0.76'));
  // f itself never takes a measured value, on the timeline or on the slider's grid.
  const visited = new Set();
  for (const time of times()) { f.seek(time); visited.add(Number(f.root.dataset.f)); }
  const spec = sliderSpec(f);
  for (let b = spec.min; b <= spec.max + 1e-9; b += spec.step) visited.add(sigma(Number(b.toFixed(2))));
  for (const level of values.measured) assert(!visited.has(level), `f reached the measured level ${level}, which this panel only quotes`);
  // The figure's measured "ten orders" at lag 60 is a different quantity, and the boundary says so.
  assert.match(boundary, /about ten orders of magnitude stronger/);
  assert.match(boundary, /not this fk and is not reproduced here/);
  assert(chapterSource(NAME).includes('attenuated but alive, about ten orders of magnitude stronger'));
});

test('gate-product: reduced motion holds b_f at the three declared values and the word at its beat position', t => {
  const f = fixture(t, NAME, {reduced: true, width: WIDE});
  const values = declared(f);
  const spec = sliderSpec(f);
  f.load(); f.open();
  const biasSet = f.root.dataset.biasSet.split(' ').map(Number);
  assert.deepEqual(biasSet, [0, values.bias, spec.max]);
  const seen = new Set(), ks = new Set();
  for (const time of times()) {
    f.seek(time);
    const bf = Number(f.root.dataset.bf);
    assert(biasSet.includes(bf), `reduced motion put b_f at ${bf} at ${time}s`);
    seen.add(bf); ks.add(f.root.dataset.topK); ks.add(f.root.dataset.botK);
  }
  assert.deepEqual([...seen].sort((a, b) => a - b), biasSet);
  assert.deepEqual([...ks].sort((a, b) => a - b), ['0', String(values.horizon)]);
  // The table the design states, one row per beat.
  const row = () => ({stage: Number(f.root.dataset.stage), mode: f.root.dataset.mode, bf: Number(f.root.dataset.bf),
    top: Number(f.root.dataset.topK), bot: Number(f.root.dataset.botK), values: f.root.querySelectorAll('[data-value]').length,
    ref: Boolean(curve(f, 'ref')), live: Boolean(curve(f, 'live')), slider: Number(slider(f).value)});
  const expected = [
    {stage: 0, mode: 'linear', bf: 0, top: 0, bot: 0, values: 0, ref: false, live: false, slider: 0},
    {stage: 1, mode: 'linear', bf: 0, top: 80, bot: 0, values: 0, ref: true, live: false, slider: 0},
    {stage: 2, mode: 'linear', bf: 1, top: 80, bot: 80, values: 0, ref: true, live: true, slider: 1},
    {stage: 3, mode: 'log', bf: 1, top: 80, bot: 80, values: 0, ref: true, live: true, slider: 1},
    {stage: 4, mode: 'log', bf: 1, top: 80, bot: 80, values: 3, ref: true, live: true, slider: 1},
    {stage: 5, mode: 'log', bf: 2, top: 80, bot: 80, values: 3, ref: true, live: true, slider: 2},
    {stage: 6, mode: 'log', bf: 1, top: 80, bot: 80, values: 3, ref: true, live: true, slider: 1}
  ];
  scene.beats.forEach((beat, index) => { f.seek(beat + 0.5); assert.deepEqual(row(), expected[index], `reduced state at beat ${index}`); });
  // And the unreduced timeline really does slide, so the two modes are not the same scene.
  const sliding = fixture(t, NAME); sliding.load(); sliding.open();
  const between = new Set(), partial = new Set();
  for (const time of times()) {
    sliding.seek(time);
    const bf = Number(sliding.root.dataset.bf);
    if (bf > 0 && bf < values.bias) between.add(bf);
    partial.add(sliding.root.dataset.topK);
  }
  assert(between.size > 20, `the unreduced slide is stepped, not continuous: ${between.size}`);
  assert(partial.size > 30, `the unreduced travel jumps: ${partial.size} distinct k values`);
});

test('gate-product: each declared beat advances the stage and lights exactly its formula parts', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  assert.equal(f.root.querySelectorAll('.mechanism-stages').length, 0, 'no stage strip');
  const stages = [];
  for (const beat of scene.beats) { f.seek(beat); stages.push(Number(f.root.dataset.stage)); }
  assert.deepEqual(stages, scene.beats.map((_, index) => index));
  // f^k lights once a word has been traced across a band; the bias once the slider moves.
  const lit = ['', 'gp-fk', 'gp-fk gp-bias', 'gp-fk gp-bias', 'gp-fk gp-bias', 'gp-fk gp-bias', 'gp-fk gp-bias'];
  scene.beats.forEach((beat, index) => {
    f.seek(beat); assert.equal(f.root.dataset.formulaLit, lit[index], `formula at ${beat}s`);
    f.seek(Math.max(0, beat - 0.01)); assert.equal(f.root.dataset.formulaLit, lit[Math.max(0, index - 1)]);
  });
  let previous = -1;
  for (const time of times()) {
    f.seek(time);
    const stage = Number(f.root.dataset.stage);
    assert(stage >= previous, `the stage fell from ${previous} to ${stage} at ${time}s`);
    previous = stage;
  }
  assert.equal(previous, scene.beats.length - 1);
});

test('gate-product: the class toggles land on the \\class{} parts MathJax produces', t => {
  const f = fixture(t, NAME);
  const formula = f.$('[data-formula]');
  const planted = {};
  for (const name of ['gp-fk', 'gp-bias']) {
    const node = f.d.createElement('mjx-c'); node.className = name; formula.append(node); planted[name] = node;
  }
  f.load(); f.open();
  const on = () => Object.entries(planted).filter(([, node]) => node.classList.contains('is-lit')).map(([name]) => name);
  const before = tex(f);
  const table = [[], ['gp-fk'], ['gp-fk', 'gp-bias'], ['gp-fk', 'gp-bias'], ['gp-fk', 'gp-bias'], ['gp-fk', 'gp-bias'], ['gp-fk', 'gp-bias']];
  scene.beats.forEach((beat, index) => {
    f.seek(beat); assert.deepEqual(on(), table[index], `lit parts at ${beat}s`);
    f.seek(beat + 0.5); assert.deepEqual(on(), table[index]);
    assert.equal(tex(f), before, `TeX rewritten at ${beat}s`);
  });
  f.seek(0); assert.deepEqual(on(), []);
  drag(f, 1); assert.deepEqual(on(), ['gp-fk', 'gp-bias'], 'a drag lights the bias');
  f.seek(0); assert.deepEqual(on(), []);
  f.seek(scene.duration); assert.deepEqual(on(), ['gp-fk', 'gp-bias']);
  for (const name of ['gp-fk', 'gp-bias']) {
    assert.match(css, new RegExp(`\\.mechanism-excerpt\\[data-ready\\] \\.gate-product-formula \\.${name}\\.is-lit`));
    assert.match(css, new RegExp(`\\.gate-product-formula \\.${name}[,\\s{]`));
  }
  assert.match(css, /\.gate-product-formula \.gp-bias \{ opacity: \.3/);
  assert.match(css, /\.gp-bias\.is-lit \{ opacity: 1/);
});

test('gate-product: the formula is the brief\'s one line in an eq- wrapper with the book macros, never rewritten', t => {
  const f = fixture(t, NAME);
  const span = f.d.getElementById('eq-gate-product-1');
  assert(span && span.closest('[data-formula]'));
  assert.match(span.textContent.trim(), /^\\\([\s\S]+\\\)$/, 'eq-gate-product-1 is \\( … \\)');
  const source = tex(f);
  assert(source.includes('\\residualpart{\\frac{\\partial L}{\\partial c_{t-k}}}'), 'the left-hand gradient is blame-coloured');
  assert(source.includes('\\class{gp-fk}{f^{\\,k}}'), 'f^k carries its class');
  assert(source.includes('\\residualpart{\\frac{\\partial L}{\\partial c_{t}}}'), 'the right-hand gradient is blame-coloured');
  assert(source.includes('f=\\sigma(\\class{gp-bias}{\\parameterpart{b_f}})'), 'the bias is the orange parameter inside its class');
  assert(source.includes('\\approx'), 'the chapter\'s approximation sign');
  assert.equal((source.match(/\\residualpart\{\\frac\{\\partial L\}\{\\partial c_\{t(-k)?\}\}\}/g) || []).length, 2);
  assert(!source.includes('\\prod') && !source.includes('\\underbrace') && !source.includes('\\cdots'));
  assert.doesNotMatch(source, /\d\.\d/, 'no live number inside the formula');
  f.load(); f.open();
  for (const time of times()) { f.seek(time); assert.equal(tex(f), source, `TeX rewritten at ${time}s`); }
  drag(f, 2); assert.equal(tex(f), source);
  assert.equal(f.root.querySelectorAll('span[id^="eq-"]').length, 1);
});

test('gate-product: captions are within budget, coloured by meaning, honest at arrival, and constant under a drag', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const values = declared(fixture(t, NAME));
  const [, OPEN] = gates(values);
  let orange = 0;
  for (const time of times()) {
    f.seek(time);
    const html = caption(f).innerHTML, text = caption(f).textContent;
    const words = wordsOf(text);
    assert(words.length > 0 && words.length <= 20, `caption at ${time}s has ${words.length} words: ${text}`);
    assert.doesNotMatch(text, /\^|\bexp\(|10\^|\d\.\d\d × 10/, `pseudo-math or a scientific number in the caption at ${time}s: ${text}`);
    const box = f.d.createElement('div'); box.innerHTML = html;
    for (const span of box.querySelectorAll('.gate-product-parameter')) {
      assert.equal(span.textContent, 'bf', `orange on something other than b_f at ${time}s`);
      orange++;
    }
    assert.equal(box.querySelectorAll('.gate-product-wine').length, 0, 'no number in the caption to colour wine');
  }
  assert(orange > 200, `${orange} orange captions`);
  // The arrival sentence: the ratio in words, the other anchor's order of magnitude, the
  // chapter's "not exactly zero", and the honesty about the log axis -- at beats 5 and 7.
  const openOrder = `10${superscript(Math.round(Math.log10(held(OPEN, values.horizon))))}`;
  for (const time of [scene.beats[4], scene.beats[4] + 5.9, scene.beats[6], scene.duration]) {
    f.seek(time);
    assert.equal(caption(f).textContent, `Sixteen trillion times larger, yet ${openOrder} of the gradient: attenuated, not exactly zero. Legible only on a log axis.`);
  }
  assert(chapterSource(NAME).includes('not exactly zero'));
  assert.doesNotMatch(f.root.textContent, /\bintact\b(?! —)/i.source ? /remains intact|arrives intact|is intact/ : /x/);
  // The sweep beat and any drag carry the sentence that is true at every b_f.
  f.seek(scene.beats[5] + 1);
  assert.equal(caption(f).innerHTML, 'Drag <span class="gate-product-parameter"><i>b</i><sub><i>f</i></sub></span> yourself: the valve’s resting position decides what survives.');
  f.seek(scene.beats[4] + 2); drag(f, -2);
  assert.match(caption(f).textContent, /^Drag bf yourself/);
  f.seek(0); drag(f, 2); assert.match(caption(f).textContent, /^Drag bf yourself/);
  f.seek(scene.beats[1] + 1); assert.match(caption(f).textContent, /^bf = 0: the valve rests half open/);
});

test('gate-product: colour is meaning -- orange on b_f only, blue on the word only, wine on the signal', t => {
  const f = fixture(t, NAME, {width: WIDE}); f.load(); f.open();
  const fills = time => {
    f.seek(time);
    const map = new Map();
    for (const node of f.root.querySelectorAll('[data-drawing] [fill], [data-drawing] [stroke]')) {
      for (const colour of [node.getAttribute('fill'), node.getAttribute('stroke')].filter(Boolean).map(v => v.toLowerCase())) {
        if (!map.has(colour)) map.set(colour, []);
        map.get(colour).push(node);
      }
    }
    return map;
  };
  for (const time of [0, 9, 16, 21, 27, 33, 40]) {
    const map = fills(time);
    const orange = map.get('#c05621') || [];
    assert(orange.length === 2 && orange.every(n => n.hasAttribute('data-band-label')), `orange on something other than the two b_f labels at ${time}s`);
    const blue = map.get('#2b6cb0') || [];
    assert(blue.every(n => n.hasAttribute('data-token') && n.textContent === 'cat'), `blue on something other than the word at ${time}s`);
    for (const node of map.get('#722f37') || []) {
      assert(/^(path|circle|rect|text)$/.test(node.tagName) && (node.closest('[data-band]') || node.closest('[data-mark="badge"]') || node.dataset.mark || node.dataset.value), `wine on scenery at ${time}s: ${node.outerHTML.slice(0, 80)}`);
    }
    for (const foreign of ['#2f855a', '#805ad5', '#7950b8', '#9b2c4c', '#b45309']) assert(!map.has(foreign), `${foreign} on the picture at ${time}s`);
  }
  // The same orange in the formula's macro, the stylesheet's variables and the caption's class.
  const config = fs.readFileSync(path.join(ROOT, 'mathjax-config.html'), 'utf8');
  assert.match(config, /parameterpart: \["\\\\style\{color:rgb\(192,86,33\)\}\{#1\}", 1\]/);
  assert.match(config, /residualpart: \["\\\\style\{color:rgb\(114,47,55\)\}\{#1\}", 1\]/);
  assert.match(config, /featurepart: \["\\\\style\{color:rgb\(43,108,176\)\}\{#1\}", 1\]/);
  assert.match(css, /--gp-parameter: #C05621/i); assert.match(css, /--gp-error: #722F37/i); assert.match(css, /--gp-input: #2B6CB0/i);
  assert.match(css, /#gate-product-excerpt \.gate-product-parameter \{ color: var\(--gp-parameter\)/);
  assert.match(css, /#gate-product-excerpt \.input-role \{ color: var\(--gp-input\)/);
  assert.match(css, /\.gp-lab \{ color: var\(--gp-parameter\)/); assert.match(css, /\.gp-out \{ color: var\(--gp-parameter\)/);
  for (const foreign of ['#2f855a', '#805ad5', '#7950b8', '#9b2c4c', '#b45309']) assert(!css.toLowerCase().includes(foreign), `${foreign} in player.css`);
  // The intro's word is blue and its b_f is orange, like the picture.
  const intro = f.root.querySelector('.mechanism-intro');
  assert.equal(intro.querySelector('.input-role').textContent, 'cat');
  assert.equal(intro.querySelector('.gate-product-parameter').textContent, 'bf');
});

test('gate-product: the endpoints and badge carry no text before arrival, and nothing is ever a zero', t => {
  const f = fixture(t, NAME, {width: WIDE}); f.load(); f.open();
  const values = declared(fixture(t, NAME));
  const [HALF, OPEN] = gates(values);
  for (const time of times()) {
    f.seek(time);
    for (const node of f.root.querySelectorAll('[data-drawing] text')) {
      const text = node.textContent.trim();
      assert(!/^[-+]?0(\.0+)?$/.test(text) || node.hasAttribute('data-tick') || node.hasAttribute('data-step') || node.hasAttribute('data-band-label'),
        `a withheld value rendered as ${text} at ${time}s`);
      assert(text.length > 0, `an empty label at ${time}s`);
      if (text.includes('·')) assert(node.hasAttribute('data-blank') && text === '· · ·', `a dot that is not the blank word at ${time}s`);
    }
    const arrived = time >= scene.beats[4] - 1e-9, badged = time >= scene.beats[4] + 1 - 1e-9;
    assert.equal(Boolean(value(f, 'end-ref')), arrived, `reference endpoint at ${time}s`);
    assert.equal(Boolean(value(f, 'end-live')), arrived, `live endpoint at ${time}s`);
    assert.equal(Boolean(value(f, 'ratio')), badged, `badge at ${time}s`);
    assert.equal(Boolean(f.root.querySelector('[data-mark="bracket"]')), badged);
  }
  f.seek(0);
  // The reader answers first: the word at step 1 on both bands, no curve, no number.
  for (const band of [0, 1]) { assert.equal(token(f, band).textContent, 'cat'); assert.equal(token(f, band).dataset.k, '0'); assert.equal(cells(f, band).length, 0); }
  const shown = [...f.root.querySelectorAll('[data-drawing] text')].map(n => n.textContent).join(' ') + caption(f).textContent;
  assert(!shown.includes(scientific(held(HALF, values.horizon)))); assert(!shown.includes(scientific(held(OPEN, values.horizon))));
  assert(!shown.includes('10⁻²⁴') && !shown.includes('trillion'));
  f.seek(scene.duration);
  assert.deepEqual([valueText(f, 'end-ref'), valueText(f, 'end-live')], [scientific(held(HALF, values.horizon)), scientific(held(OPEN, values.horizon))]);
});

test('gate-product: seeking is deterministic -- the same time rebuilds the whole scene, drags included', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const snapshot = () => JSON.stringify({
    published: [...f.root.attributes].map(a => `${a.name}=${a.value}`)
      .filter(text => text.startsWith('data-') && !/^data-(time|playing)=/.test(text)).sort(),
    pane: canonicalMarkup(f.$('[data-pane]').innerHTML.replace(/aria-valuetext="[^"]*"/g, '')),
    slider: slider(f).value, readout: f.$('[data-bias-readout]').textContent
  });
  const probes = [0, 3, 5, 8.2, 12, 13.2, 16, 18, 18.3, 20, 22.4, 24, 24.5, 25.3, 27, 31.5, 32.5, 34, 36, 40];
  const forwards = probes.map(time => (f.seek(time), snapshot()));
  f.play(); f.tick(4000); f.seek(11); drag(f, 2); f.seek(9); f.play(); f.tick(2500); drag(f, -1.5);
  const backwards = [...probes].reverse().map(time => (f.seek(time), snapshot()));
  assert.deepEqual(backwards, [...forwards].reverse());
  assert(!f.playing);
  assert(new Set(forwards).size >= 18, 'the probes barely move the scene, so this proves little');
});

test('gate-product: no-script readouts are exactly the readouts at the end of the timeline', t => {
  const f = fixture(t, NAME, {width: DESKTOP});
  const readouts = () => [
    canonicalMarkup(f.$('[data-drawing]').innerHTML), caption(f).innerHTML,
    f.$('.gate-product-figure svg').getAttribute('viewBox'), f.$('.gate-product-figure svg').getAttribute('aria-label'),
    f.$('.gate-product-figure svg title').textContent,
    valueText(f, 'end-ref'), valueText(f, 'end-live'), valueText(f, 'ratio'),
    slider(f).value, f.$('[data-bias-readout]').textContent, slider(f).getAttribute('aria-valuetext'),
    ...[...f.root.querySelectorAll('[data-axis]')].map(b => `${b.dataset.axis}=${b.getAttribute('aria-pressed')}`)
  ];
  const before = readouts();
  f.load(); f.seek(scene.duration);
  assert.deepEqual(readouts(), before);
  assert(before[0].includes('8.27 × 10⁻²⁵') && before[0].includes('1.31 × 10⁻¹¹') && before[0].includes('× 1.6 × 10¹³'), 'the static drawing carries the witness values');
  assert(before[0].includes('data-cell="80"'), 'the static frame is the log frame, bands full');
  assert.equal(before[8], '1');
});

test('gate-product: the static frame in panel.html is the player\'s own t = 40 drawing', async () => {
  const {file, before, after} = await staticFrame(NAME);
  assert.equal(after, before, `${path.relative(path.join(__dirname, '..'), file)} is stale: run node scripts/render_static_frames.cjs ${scene.scene}`);
  assert.match(before, /<!-- static-frame[^>]*-->\s*<g data-drawing>[\s\S]*?<\/g>\s*<!-- \/static-frame -->/);
});

test('gate-product: the boundary states the approximation, the non-claim, the mapping, and the evidence', t => {
  const f = fixture(t, NAME);
  const boundary = f.root.querySelector('.mechanism-boundary').textContent;
  assert.match(boundary, /from unit to unit and from step to step/);
  assert.match(boundary, /writes ≈, not =/);
  assert.match(boundary, /one constant .{0,3}f.{0,3}, multiplied 80 times/);
  assert.match(boundary, /Nothing here is trained, and nothing here is a claim about training/);
  // The log mapping and its floor, said plainly; legibility is on the mapping, never "intact".
  assert.match(boundary, /floor of 10⁻²⁵/);
  assert.match(boundary, /legible on that mapping, not intact/);
  assert.match(boundary, /attenuated, not exactly zero, which is the chapter's own wording/);
  assert.match(boundary, /recall experiment/);
  assert.match(boundary, /remains the chapter's evidence/);
  const frozen = JSON.stringify(JSON.parse(fs.readFileSync(path.join(ROOT,
    '_freeze/chapters/part3/10-sequences-rnn/execute-results/html.json'), 'utf8')));
  assert(frozen.includes('LSTM, default init     24%   26%   26%'));
  assert(frozen.includes('LSTM, forget bias +1   100%   100%   100%'));
  for (const row of [['24%', '26%', '26%'], ['100%', '100%', '100%']]) assert(boundary.includes(row.join(' / ')));
  assert(!/we (?:trained|measured|learned)/i.test(f.root.textContent));
  // Nowhere does the panel claim the word arrives intact.
  assert.doesNotMatch(f.root.textContent, /arrives intact|survives intact|stays intact|is intact/i);
});

test('gate-product: the panel is the only fixture copy -- moving it moves every number', t => {
  const f = fixture(t, NAME, {width: WIDE});
  f.root.dataset.half = '0.9';
  f.root.dataset.bias = '2';
  f.root.dataset.horizon = '10';
  f.root.dataset.measured = '0.8 0.7';
  f.load(); f.seek(scene.duration);
  const open = sigma(2);
  assert.deepEqual([valueText(f, 'end-ref'), valueText(f, 'end-live')], [scientific(held(0.9, 10)), scientific(held(open, 10))]);
  assert.equal(f.root.dataset.topK, '10'); assert.equal(f.root.dataset.botK, '10');
  assert.equal(Number(f.root.dataset.f), open);
  assert.deepEqual([gateLabel(f, 0), gateLabel(f, 1)], ['f = 0.900', `f = ${open.toFixed(3)}`]);
  // The reference band's bias is derived from the declared gate: logit(0.9) = +2.2.
  assert.deepEqual([bandLabel(f, 0), bandLabel(f, 1)], ['b_f = +2.2', 'b_f = +2']);
  assert.equal(cells(f, 0).length, 10);
  assert.deepEqual([...f.root.querySelectorAll('[data-tick="x"]')].map(n => n.textContent), ['0', '2.5', '5', '7.5', '10']);
  const ratio = held(open, 10) / held(0.9, 10);
  close(Number(f.root.dataset.ratio), ratio, 1e-12);
  assert.equal(valueText(f, 'ratio'), ratio < 1 ? `× ${scientific(ratio, 1)}` : `× ${scientific(ratio, 1)}`);
  assert.equal(f.root.dataset.orders, String(Math.floor(Math.log10(ratio))));
  const pane = f.$('[data-pane]').textContent;
  for (const stale of ['8.27 ×', '1.31 ×', '0.731', '10⁻²⁴', '0.56', '0.76', '80', 'sixteen trillion', '1.6 × 10¹³'])
    assert(!pane.includes(stale), `${stale} survived a moved fixture`);
});

test('gate-product: the badge words spell the ratio at every slider step and every frame of the sweep, never "undefined"', t => {
  const values = declared(fixture(t, NAME));
  const spec = sliderSpec(fixture(t, NAME));
  const atHalf = held(values.half, values.horizon);
  // The independent reading: the words, parsed back, name the ratio the badge prints.
  const check = (f, label) => {
    const ratio = Number(f.root.dataset.ratio), decades = Math.log10(ratio);
    const lines = badgeLines(f), text = lines.join(' ');
    assert.match(text, /^[a-z][a-z\- ]*[a-z]$/, `${label}: badge words "${text}"`);
    assert.doesNotMatch(text, /undefined|NaN|\bhundred hundred\b|\b(thousand|million|billion|trillion|quadrillion|quintillion) hundred\b/, `${label}: "${text}"`);
    const spoken = slider(f).getAttribute('aria-valuetext');
    assert.doesNotMatch(spoken, /undefined|NaN/, `${label}: ${spoken}`);
    assert.match(spoken, /; after 80 steps \d\.\d\d × 10[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+, [a-z][a-z\- ]*[a-z] (times|smaller than|as) the b_f = 0 value\.$/, `${label}: ${spoken}`);
    if (Math.abs(decades) < 0.05) { assert.equal(text, 'the same as the reference', label); return; }
    const suffix = ratio < 1 ? ' smaller' : ' times larger';
    assert(text.endsWith(suffix) || text.endsWith(' larger'), `${label}: "${text}" should end "${suffix}"`);
    const head = text.replace(/ (times larger|larger|smaller)$/, '');
    const read = spelt(head);
    if (read.orders !== undefined) {
      // "N orders of magnitude": the nearest whole number of decades, singular for one.
      const want = Math.max(1, Math.round(Math.abs(decades)));
      assert.equal(read.orders, want, `${label}: "${text}" for ratio ${ratio}`);
      assert.equal(read.singular, want === 1, `${label}: number agreement in "${text}"`);
    } else {
      assert(Math.abs(read.value / ratio - 1) <= 0.1, `${label}: "${text}" reads ${read.value} for ratio ${ratio}`);
      assert(Math.abs(read.value - Number(read.value.toPrecision(2))) <= 1e-9 * read.value, `${label}: "${text}" carries more than two figures`);
      assert(spoken.includes(`${head} times the b_f = 0 value`), `${label}: ${spoken}`);
    }
  };
  const f = fixture(t, NAME, {width: WIDE}); f.load(); f.open(); f.seek(scene.duration);
  // Every slider step, including the two nearest zero and the two the old spelling broke on.
  const steps = [];
  for (let b = spec.min; b <= spec.max + 1e-9; b += spec.step) steps.push(Number(b.toFixed(2)));
  assert.equal(steps.length, 81); assert(steps.includes(0.05) && steps.includes(-0.05) && steps.includes(0.95) && steps.includes(1.25));
  for (const b of steps) { drag(f, b); check(f, `b_f = ${b}`); }
  // One-, two- and three-figure leads, and the two steps nearest zero.
  drag(f, 0.05); assert.equal(badgeWords(f), 'seven point two times larger');
  drag(f, -0.05); assert.equal(badgeWords(f), 'one order of magnitude smaller');
  drag(f, 0.9); assert.equal(badgeWords(f), 'one point seven trillion times larger');
  drag(f, 0.95); assert.equal(badgeWords(f), 'five point three trillion times larger');
  drag(f, 1.1); assert.equal(badgeWords(f), 'one hundred thirty trillion times larger');
  drag(f, 1.25); assert.equal(badgeWords(f), 'two point one quadrillion times larger');
  assert.equal(Math.pow(sigma(1.25) / values.half, values.horizon).toPrecision(2), '2.1e+15');
  assert.equal(Math.pow(sigma(1.1) / values.half, values.horizon).toPrecision(2), '1.3e+14');
  // Every hundredth of a second of the sweep beat, in both layouts (the strip may put the
  // words on one line).
  for (const width of [NARROW, WIDE]) {
    const w = fixture(t, NAME, {width}); w.load(); w.open();
    let distinct = new Set();
    for (const time of times(0.01, scene.beats[5], scene.beats[6])) { w.seek(time); check(w, `${width}px, ${time}s`); distinct.add(badgeWords(w)); }
    assert(distinct.size > 30, `the sweep barely changes the words: ${distinct.size}`);
  }
  // The arrival caption's words are the same spelling at the timeline's b_f.
  f.seek(scene.beats[4] + 2);
  assert.match(caption(f).textContent, /^Sixteen trillion times larger,/);
});

test('gate-product: the word carries a white halo whenever it is legible, in the live picture and in both static prints', t => {
  const values = declared(fixture(t, NAME));
  for (const width of [NARROW, WIDE]) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    let legible = 0, blank = 0;
    for (const time of [0, 4.3, 6, 9, 13.8, 16, 17.7, 18, 21, 27, 32.5, 40]) {
      f.seek(time);
      for (const band of [0, 1]) {
        const w = token(f, band);
        if (w.hasAttribute('data-blank')) { assert(!w.hasAttribute('stroke') && !w.hasAttribute('paint-order'), `a halo on the blank word at ${time}s`); blank++; }
        else { halo(w, `${width}px, band ${band}, ${time}s`); legible++; }
      }
    }
    assert(legible >= 8 && blank >= 8, `${legible} legible, ${blank} blank`);
    drag(f, 2); halo(token(f, 1), 'drag +2');
    drag(f, -2); assert(token(f, 1).hasAttribute('data-blank'));
  }
  const s = fixture(t, NAME);
  halo(s.$('[data-drawing] [data-token="1"]'), 'static wide'); assert(s.$('[data-drawing] [data-token="0"]').hasAttribute('data-blank'));
  halo(s.$('[data-static-frame="narrow"] [data-token="1"]'), 'static narrow'); assert(s.$('[data-static-frame="narrow"] [data-token="0"]').hasAttribute('data-blank'));
  // Why a halo: composited as the picture composites it -- the band is wine at ink a over
  // white, the halo white at ink a over that band, the glyph blue at ink a over the band --
  // the glyph's contrast against its halo rises with the ink, where against the bare band
  // it fell (blue over wine is nearly isoluminant near a = 0.8, the sweep's far point).
  const over = (top, under, a) => top.map((c, i) => under[i] + (c - under[i]) * a);
  const luminance = rgb => { const lin = rgb.map(v => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }); return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]; };
  const contrast = (p, q) => (Math.max(luminance(p), luminance(q)) + 0.05) / (Math.min(luminance(p), luminance(q)) + 0.05);
  const WHITE = [255, 255, 255], WINE = [114, 47, 55], BLUE = [43, 108, 176];
  const withHalo = a => { const band = over(WINE, WHITE, a); return contrast(over(BLUE, band, a), over(WHITE, band, a)); };
  const bare = a => { const band = over(WINE, WHITE, a); return contrast(over(BLUE, band, a), band); };
  const [HALF, OPEN] = gates(values);
  const a1 = inkOf(OPEN, values.horizon, 'log'), a2 = inkOf(sigma(2), values.horizon, 'log');
  assert(a1 > 0.5 && a2 > 0.8 && a2 > a1);
  assert(bare(a2) < bare(a1) && bare(a2) < 1.2, `without the halo the contrast falls as the gate opens: ${bare(a1).toFixed(2)} -> ${bare(a2).toFixed(2)}`);
  assert(withHalo(a1) >= 2.5 && withHalo(a2) > withHalo(a1), `with the halo it rises: ${withHalo(a1).toFixed(2)} -> ${withHalo(a2).toFixed(2)}`);
  void HALF;
});

test('gate-product: the first step at which each word blanks on the timeline is the receipt\'s number', t => {
  const f = fixture(t, NAME);
  const values = declared(f);
  const [HALF, OPEN] = gates(values);
  // Two thresholds, two numbers: the word blanks below ink .05 (step 5 and step 10); a
  // screen's least tint, 1/255, is the caption's threshold (step 8 and step 18).
  const firstBlank = g => { let k = 1; while (k < values.horizon && inkOf(g, k, 'linear') >= 0.05) k++; return k; };
  assert.equal(firstBlank(HALF), 5); assert.equal(firstBlank(OPEN), 10);
  assert.equal(inkOf(HALF, 5, 'linear').toFixed(3), '0.031'); assert.equal(inkOf(OPEN, 10, 'linear').toFixed(3), '0.044');
  assert(inkOf(HALF, 4, 'linear') >= 0.05 && inkOf(OPEN, 9, 'linear') >= 0.05);
  f.load(); f.open();
  const seen = {0: null, 1: null};
  for (const time of times(0.01, scene.beats[1], scene.beats[3] - 0.6)) {
    f.seek(time);
    for (const band of [0, 1]) if (seen[band] === null && token(f, band).hasAttribute('data-blank')) seen[band] = Number(token(f, band).dataset.k);
  }
  assert.deepEqual(seen, {0: 5, 1: 10});
  const receipt = fs.readFileSync(path.join(ROOT, scene.receipt), 'utf8');
  assert.match(receipt, /it turns to `· · ·` at step 5 \(ink \.031\)/);
  assert.match(receipt, /it is `· · ·` from step 10 \(ink \.044\)/);
  assert.match(receipt, /both look dead by step eighteen/);
});

test('gate-product: f to the k in the prose is wrapped so its superscript clears the italic f', t => {
  const f = fixture(t, NAME);
  const powers = [...f.root.querySelectorAll('.gp-power')];
  // The intro, the boundary (twice) and the transcript (its first and fourth items).
  assert.equal(powers.length, 5);
  assert.equal(powers.filter(p => p.closest('.mechanism-intro')).length, 1);
  assert.equal(powers.filter(p => p.closest('.mechanism-boundary')).length, 2);
  assert.equal(powers.filter(p => p.closest('.mechanism-transcript')).length, 2);
  for (const p of powers) assert.equal(canonicalMarkup(p.innerHTML), canonicalMarkup('<i>f</i><sup><i>k</i></sup>'));
  const html = read('gate-product/panel.html');
  assert.equal((html.match(/<i>f<\/i><sup>/g) || []).length, 5, 'every f^k in the prose is wrapped');
  assert.equal((html.match(/<span class="gp-power"><i>f<\/i><sup><i>k<\/i><\/sup><\/span>/g) || []).length, 5);
  assert.match(css, /#gate-product-excerpt \.gp-power sup \{ margin-left: \.12em; \}/);
});

test('integration: the excerpt is HTML-only, manifest-driven, and declared in the config', () => {
  const filter = fs.readFileSync(path.join(__dirname, '..', scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/,
    'the non-HTML guard is the first executable line, so the PDF is untouched');
  assert.match(filter, /pandoc\.json\.decode/, 'the scene is data in the manifest, not code in the filter');
  assert.match(filter, /"after-cell"/);
  assert.match(filter, /assert\(inserted == 1/);
  assert.doesNotMatch(filter, /gate-product|lstm|forget/i, 'a manifest-driven filter names no scene');
  const config = fs.readFileSync(path.join(__dirname, '..', '_quarto.yml'), 'utf8');
  const section = (key, text) => {
    const start = text.indexOf(`\n${key}`);
    assert(start >= 0, `${key} is missing from _quarto.yml`);
    const rest = text.slice(start + 1 + key.length);
    const end = rest.search(/\n\S/);
    return end < 0 ? rest : rest.slice(0, end);
  };
  assert.match(section('  resources:', config), new RegExp(`^\\s+- interactives/${scene.scene}/player\\.js$`, 'm'));
  assert.match(section('filters:', config), new RegExp(`^\\s+- ${scene.filter.replace(/[/.]/g, '\\$&')}$`, 'm'));
  assert(!section('  resources:', config).includes(`${scene.scene}/panel.html`));
  assert.equal(scene.anchor.type, 'after-cell');
  assert.match(chapterSource(NAME), new RegExp(`^#\\|\\s*label:\\s*${scene.anchor.target.slice('cell-'.length)}\\s*$`, 'm'));
  assert.equal(read(`${scene.scene}/panel.html`).includes('data-playback='), scene.transport === 'shared');
  assert(manifest.scenes.some(other => other.id === NAME));
  assert.match(read(`${scene.scene}/panel.html`), /Appendix A3/);
  assert(scene.fixture.computedVariants.some(text => text.includes(APPENDIX)), 'the manifest must declare where 8.27e-25 is actually printed');
  assert(scene.fixture.computedVariants.some(text => /1\.580 x 10\^13/.test(text) && /not the 10\^14/.test(text)), 'the manifest declares the computed ratio and the rounding trap');
  assert(scene.fixture.computedVariants.some(text => /one-parameter-control amendment/.test(text)), 'the manifest records the slider as the one parameter control');
  assert(scene.fixture.computedVariants.some(text => /1 \+ log10\(f\^k\)\/25/.test(text)), 'the manifest declares the log ink mapping');
  assert(scene.fixture.literals.includes('astronomically attenuated, not exactly zero'));
  assert.deepEqual(scene.beats, [0, 4, 12, 18, 24, 30, 36]);
  // The amendment is written into the authoring contract, and the receipt records it.
  const contract = fs.readFileSync(path.join(ROOT, 'docs', 'animation-authoring.md'), 'utf8').replace(/\s+/g, ' ');
  assert.match(contract, /A scene may carry ONE parameter control when the mechanism IS that parameter's effect; the timeline sweeps it by default/);
  const receipt = fs.readFileSync(path.join(ROOT, scene.receipt), 'utf8');
  assert.match(receipt, /1\.580 × 10¹³/); assert.match(receipt, /author-requested/);
});
