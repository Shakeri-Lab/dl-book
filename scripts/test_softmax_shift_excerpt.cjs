#!/usr/bin/env node
// Test-only JSDOM. No dependency from this file enters the published book.
// The JSDOM fixture, the markup canonicaliser, and the transport, beat-hold and grammar
// suites this scene inherits live in scripts/html-tests/excerpt-harness.cjs. What stays
// here is the part no harness can supply: this scene's arithmetic, the numerical
// discipline the chapter's "one numerical landmine" section demands of it, and the shape
// of its one picture — four marks seen three times on one baseline — its two typeset
// formula spans, and the class toggles the player applies to them per beat. JSDOM never
// typesets, so the formula assertions read the TeX source, the eq- ids, the \class{}
// names and the root classes, never rendered math.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {read, manifest, entry, chapterSource, numbers, close, canonicalMarkup, drawnMarkup,
  fixture, registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'softmax-shift-excerpt';
const scene = entry(NAME);
// The harness lays nothing out, so the figure's width is declared: the wide layout, which
// is the one the static frame is drawn in. One test drives the stacked layout explicitly.
const WIDE = 1100, STACKED = 360;

// Read the declared fixture from the closed panel. The panel is the one in-repo mirror of
// the manuscript's numbers; everything below is computed from it, so no chapter value is
// typed here a second time.
function declared(f) {
  assert(!f.root.dataset.ready, 'read the declared fixture before the player mounts');
  return {logits: numbers(f.root.dataset.logits), shift: Number(f.root.dataset.shift)};
}

// This suite's own softmax, deliberately not the player's: it is the independent
// evaluation every arithmetic assertion below is checked against.
function reference(scores) {
  const largest = Math.max(...scores);
  const terms = scores.map(score => Math.exp(score - largest));
  const total = terms.reduce((a, b) => a + b, 0);
  return {largest, terms, total, probabilities: terms.map(term => term / total)};
}
// The raw exponentials the picture draws, again independently of the player.
const rawOf = logits => { const raw = logits.map(o => Math.exp(o)); return {raw, total: raw.reduce((a, b) => a + b, 0)}; };
const live = f => JSON.parse(f.root.dataset.probabilities);
const texts = (f, selector) => [...f.root.querySelectorAll(selector)].map(node => node.textContent);
const values = (f, prefix) => texts(f, `[data-value^="${prefix}"]`);
const lanes = (f, prefix) => texts(f, `[data-lane^="${prefix}"]`);
const tex = (f, n) => f.d.getElementById(`eq-softmax-shift-${n}`).textContent;
const drawing = f => f.$('[data-drawing]').innerHTML;
const classes = f => new Set([...f.root.classList]);
const caption = f => f.$('[data-caption]');
const count = (text, needle) => text.split(needle).length - 1;
const times = (step = 0.05) => {
  const out = [];
  for (let t = 0; t <= scene.duration + 1e-9; t += step) out.push(Number(t.toFixed(4)));
  return out;
};
const css = read(`${scene.scene}/player.css`);

registerTransportTests(NAME, {
  witness: /0\.6095/,
  anchors: ['softmax-playback-help'],
  width: WIDE
});
// One drawn state per whole beat under reduced motion, not just at the boundaries: this
// scene's shift is the quantity most likely to keep moving inside a beat.
registerBeatHoldTest(NAME);
// One picture, one formula line, one caption; TeX never rewritten; one guarded typeset.
registerGrammarTests(NAME);

test('softmax: the declared attributes reproduce the chapter literals they mirror', t => {
  const f = fixture(t, NAME);
  const {logits, shift} = declared(f);
  const chapter = chapterSource(NAME);
  // Not a second copy of the fixture: the panel's attributes are rendered back into the
  // chapter's own source text, so a drift in either direction fails here as well as in
  // scripts/audit_excerpt_fixtures.py.
  assert(chapter.includes(`logits = torch.tensor([${logits.map(v => v.toFixed(1)).join(', ')}])`),
    'the declared logits do not spell the chapter literal');
  assert(chapter.includes(`for shift in (0.0, ${shift.toFixed(1)})`),
    'the declared shift is not one of the chapter\'s two cases');
  assert.equal(logits.length, 4);
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal));
});

test('softmax: the static fallback prints four probabilities that satisfy @eq-softmax', t => {
  const f = fixture(t, NAME);
  const {logits} = declared(f);
  const {probabilities} = reference(logits);
  const {raw, total} = rawOf(logits);
  // Read before any script runs: the script-free panel is already the whole witness, and
  // every number sits on the picture beside the mark it measures.
  assert.deepEqual(values(f, 'p'), probabilities.map(p => p.toFixed(4)));
  assert.deepEqual(values(f, 'p'), ['0.6095', '0.1360', '0.0303', '0.2242']);
  assert.deepEqual(values(f, 'e'), raw.map(term => term.toFixed(2)));
  assert.deepEqual(values(f, 'e'), ['7.39', '1.65', '0.37', '2.72']);
  assert.deepEqual(values(f, 's'), logits.map(o => o.toFixed(1).replace('-', '−')));
  assert.deepEqual(lanes(f, ''), [], 'at c = 0 no value has left the picture for the lane');
  // The one shared divisor is a typeset constant, not a live number; it is checked against
  // the declared logits so a moved fixture is caught here as well as in the audit.
  assert(tex(f, 6).includes(`\\Sigma = ${total.toFixed(2)}`), `Σ span does not print ${total.toFixed(2)}`);
  assert.equal(total.toFixed(2), '12.12');
  assert.equal(f.$('[data-c]').textContent, '0');
  // The chapter's own figure prints these to two decimals; the declared computed variant
  // in interactives/manifest.json is only their precision, not their value.
  assert.deepEqual(probabilities.map(p => p.toFixed(2)), ['0.61', '0.14', '0.03', '0.22']);
});

test('softmax: no-script readouts are exactly the readouts at the end of the timeline', t => {
  const f = fixture(t, NAME);
  const readouts = () => [
    canonicalMarkup(drawing(f)), caption(f).innerHTML,
    [...classes(f)].sort().join(' '), f.$('[data-c]').textContent,
    f.$('.sm-figure svg').getAttribute('viewBox'), f.$('.sm-figure svg').getAttribute('aria-label'),
    f.$('.sm-figure svg title').textContent,
    ...[...f.root.querySelectorAll('foreignObject')].map(node => `${node.dataset.tag}@${node.getAttribute('x')},${node.getAttribute('y')}`)
  ];
  const before = readouts();
  f.load(); f.seek(scene.duration);
  assert.deepEqual(readouts(), before);
  assert(before[0].includes('0.6095') && before[0].includes('7.39'), 'the static drawing carries the witness values');
  assert.match(before[2], /\bshow-c\b/); assert.match(before[2], /\bshow-rhs\b/); assert.match(before[2], /\bstruck\b/);
});

test('softmax: the static panel differs from the t = 40 render only where script must add', t => {
  // The test above compares an enumerated list of readouts, which is not the same claim as
  // "the panel is byte-equal to the t = 40 render". This one closes that gap from the other
  // side: it takes the whole pane, subtracts exactly the things only a running player can
  // put there, and asserts what is left is identical. The drawing is no exception any more:
  // the static frame is the player's own t = 40 output, so the only thing script adds is the
  // playback bar, which is hidden until a transport mounts.
  const f = fixture(t, NAME);
  const pane = f.$('[data-pane]');
  const strip = html => {
    const box = f.w.document.createElement('div');
    box.innerHTML = html;
    box.querySelectorAll('[data-controls]').forEach(node => node.remove());
    return canonicalMarkup(box.innerHTML);
  };
  const before = strip(pane.innerHTML);
  f.load(); f.seek(scene.duration);
  const after = strip(pane.innerHTML);
  assert.equal(after, before, 'script changed the panel somewhere the receipt does not name');
  // The subtraction is not vacuous: the bar really is exposed by the mount.
  assert.equal(pane.querySelector('[data-controls]').hidden, false);
  assert.equal(f.root.dataset.ready, 'true');
});

test('softmax: the static frame in panel.html is the player\'s own t = 40 drawing', async () => {
  // scripts/render_static_frames.cjs writes [data-drawing] and the root classes from a
  // fresh render; this pins the committed panel to that output, so editing the player's
  // draw without re-running the generator fails here.
  const {file, before, after} = await staticFrame(NAME);
  assert.equal(after, before, `${path.relative(path.join(__dirname, '..'), file)} is stale: run node scripts/render_static_frames.cjs ${scene.scene}`);
  assert.match(before, /<!-- static-frame[^>]*-->\s*<g data-drawing>[\s\S]*?<\/g>\s*<!-- \/static-frame -->/);
});

test('softmax: every scrubbed time gives positive weights that sum to one', t => {
  const f = fixture(t, NAME);
  const {logits} = declared(f); f.load();
  for (let i = 0; i <= 400; i++) {
    f.seek(i / 10);
    const weights = live(f), c = Number(f.root.dataset.c);
    assert(weights.every(w => w > 0 && w < 1), `non-positive weight at ${i / 10}s`);
    close(weights.reduce((a, b) => a + b, 0), 1);
    // Recomputed here, from the declared logits and the published shift.
    reference(logits.map(o => o + c)).probabilities.forEach((p, j) => close(weights[j], p));
  }
});

test('softmax: every c the sweep visits gives the c = 0 vector, and the argmax never moves', t => {
  const f = fixture(t, NAME);
  const {logits, shift} = declared(f); f.load();
  const home = reference(logits).probabilities;
  const homeArgmax = home.indexOf(Math.max(...home));
  const visited = new Set();
  for (let i = 0; i <= 400; i++) {
    f.seek(i / 10);
    const c = Number(f.root.dataset.c);
    visited.add(Math.round(c));
    live(f).forEach((p, j) => close(p, home[j], 1e-12));
    assert.equal(Number(f.root.dataset.argmax), homeArgmax, `argmax moved at c = ${c}`);
  }
  // The sweep really does travel: both endpoints and a spread of intermediate shifts.
  assert(visited.has(0) && visited.has(shift), 'the sweep never reaches both endpoints');
  assert(visited.size > 40, `the sweep visited only ${visited.size} distinct shifts`);
});

test('softmax: the max subtraction happens — exp is never handed a shifted logit', t => {
  const f = fixture(t, NAME);
  const {logits, shift} = declared(f);
  // Instrument the window's Math before the player is evaluated in it. Every argument the
  // implementation passes to exp must already have had the largest score removed, so the
  // largest of them is exactly 0 and none of them is positive. e^(o + 100) is never formed.
  const seen = [], at = [];
  const real = f.w.Math.exp;
  f.w.Math.exp = value => { seen.push(value); at.push(Number(f.root.dataset.c || 0)); return real(value); };
  f.load();
  for (let i = 0; i <= 400; i++) f.seek(i / 10);
  assert(seen.length > 400, 'exp was never exercised, so this assertion proves nothing');
  assert.equal(seen.filter(value => value > 0).length, 0,
    `exp received a positive argument: max ${Math.max(...seen)}`);
  close(Math.max(...seen), 0);
  // The largest logit is the max, so its shifted argument is 0 at every c.
  const spread = logits.map(o => o - Math.max(...logits));
  for (const value of spread) assert(seen.some(arg => Math.abs(arg - value) < 1e-12));
  // What the trap would have looked like: the chapter's own landmine, in float64.
  assert.equal(Math.exp(Math.max(...logits) + 10 * shift), Infinity);
  // The picture's factor is geometry, not the probability path: with c published before
  // any call, every argument is one of the max-subtracted scores, the negated drawing
  // factor -min(c, 6), or a raw score at load (e^{o} for o > 0 is formed as 1 / e^{-o}).
  // A shifted score o_j + c, for any c > 0, is none of these.
  seen.forEach((value, i) => {
    const c = at[i];
    // The drawing states c to six decimals, so the factor is matched at that resolution.
    const ok = spread.some(s => Math.abs(value - s) < 1e-9)
      || Math.abs(value + Math.min(c, 6)) < 1e-5
      || logits.some(o => Math.abs(value - (o <= 0 ? o : -o)) < 1e-9);
    assert(ok, `exp received ${value} at c = ${c}`);
    if (c > 0) for (const o of logits) assert(Math.abs(value - (o + c)) > 1e-9, `exp received the shifted score ${o} + ${c}`);
  });
  assert(at.some(c => c > 0), 'the sweep must have called exp while c was above zero');
});

test('softmax: the scene helper still returns finite probabilities at c = 1000', t => {
  const f = fixture(t, NAME);
  const {logits} = declared(f);
  // Not a manuscript edit: moving the declared shift ten-fold is the unit check on the
  // scene's own softmax. Without the max subtraction e^1002 is Infinity and every
  // probability comes back NaN; with it, the same four numbers survive.
  f.root.dataset.shift = '1000';
  f.load();
  f.seek(scene.beats[4]);
  assert.equal(Number(f.root.dataset.c), 1000);
  const home = reference(logits).probabilities;
  live(f).forEach((p, j) => { assert(Number.isFinite(p), `p${j} is ${p}`); close(p, home[j], 1e-12); });
  assert.deepEqual(values(f, 'p'), ['0.6095', '0.1360', '0.0303', '0.2242']);
  // The cancel beat is the snapped state: the same marks at home, the ruler relabelled.
  assert(classes(f).has('is-relabelled'));
  assert.deepEqual(values(f, 's'), ['1002.0', '1000.5', '999.0', '1001.0']);
  assert.deepEqual(values(f, 'e'), ['7.39', '1.65', '0.37', '2.72']);
  assert.deepEqual(texts(f, '[data-ruler]'), ['999', '1000', '1001', '1002', '1003', '1004', '1005', '1006', '1007']);
  // Mid-sweep the ticks have left through the ruler top and park their values in the lane;
  // the bars are cut at the ceiling and no bar readout pretends to print e^{o + c}.
  f.seek(scene.beats[3] + 7);
  const c = Number(f.root.dataset.c);
  assert(c > 6 && c < 1000, `mid-sweep c is ${c}`);
  assert.deepEqual(values(f, 's'), []);
  assert.deepEqual(lanes(f, 's'), logits.map(o => (o + c).toFixed(1)));
  assert.deepEqual(values(f, 'e'), []); assert.deepEqual(lanes(f, 'e'), []);
  assert(!drawing(f).includes('Infinity') && !drawing(f).includes('NaN'));
});

test('softmax: each declared beat advances the stage and toggles exactly its classes', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const stages = [];
  const has = name => classes(f).has(name);
  for (const beat of scene.beats) {
    f.seek(beat);
    stages.push(Number(f.root.dataset.stage));
    assert.deepEqual([...classes(f)].filter(name => /^stage-\d$/.test(name)), [`stage-${stages.at(-1)}`]);
  }
  assert.deepEqual(stages, scene.beats.map((_, index) => index));
  // What each beat switches on, at its first frame. show-sum is a picture fact (the sum is
  // printed only at c = 0 and in the relabelled state), not a stage fact, so it is checked
  // by its own test below.
  const table = {
    'show-exp': [false, true, true, true, true, true],
    'show-prob': [false, false, true, true, true, true],
    'show-c': [false, false, false, true, true, true],
    'show-rhs': [false, false, false, false, true, true],
    'is-relabelled': [false, false, false, false, true, false],
    'struck': [false, false, false, false, false, true],
    'hl-ec': [false, false, false, false, false, false]
  };
  scene.beats.forEach((beat, index) => {
    f.seek(beat);
    for (const [name, row] of Object.entries(table)) assert.equal(has(name), row[index], `${name} at ${beat}s`);
  });
  // The reveals inside the beats, and nothing withheld shown as a zero.
  f.seek(0);
  assert.deepEqual(values(f, 'e'), []); assert.deepEqual(values(f, 'p'), []);
  assert(!drawing(f).includes('7.39') && !drawing(f).includes('0.6095'), 'the ask beat already prints a result');
  f.seek(scene.beats[1]);
  assert.equal(f.root.querySelectorAll('[data-glide^="e"]').length, 4, 'the ticks leave as four copies');
  assert.deepEqual(values(f, 'e'), []);
  // The copies finish growing at 2.5 s; the values are written half a second later, once
  // the bars stand still, and the sum a second and a half after that.
  f.seek(scene.beats[1] + 2.9);
  assert.equal(f.root.querySelectorAll('[data-glide]').length, 0); assert.deepEqual(values(f, 'e'), []);
  assert(!has('show-sum'));
  f.seek(scene.beats[1] + 3);
  assert.deepEqual(values(f, 'e'), ['7.39', '1.65', '0.37', '2.72']);
  assert.deepEqual(values(f, 'p'), []);
  f.seek(scene.beats[1] + 4.4); assert(!has('show-sum'));
  f.seek(scene.beats[1] + 4.5); assert(has('show-sum'));
  f.seek(scene.beats[2]);
  assert.equal(f.root.querySelectorAll('[data-glide^="p"]').length, 4, 'the bars leave as four copies');
  f.seek(scene.beats[2] + 3.4);
  assert.equal(f.root.querySelectorAll('[data-glide]').length, 0); assert.deepEqual(values(f, 'p'), []);
  f.seek(scene.beats[2] + 3.5);
  assert.deepEqual(values(f, 'p'), ['0.6095', '0.1360', '0.0303', '0.2242']);
  // The cancel beat: the right-hand side stands for two seconds, both e^{c} are washed for
  // two more, then struck for the rest of the timeline.
  for (const [time, wash, struck] of [[scene.beats[4] + 1.9, false, false], [scene.beats[4] + 2, true, false],
    [scene.beats[4] + 3.9, true, false], [scene.beats[4] + 4, false, true], [scene.beats[5], false, true], [scene.duration, false, true]]) {
    f.seek(time);
    assert.equal(has('hl-ec'), wash, `hl-ec at ${time}s`); assert.equal(has('struck'), struck, `struck at ${time}s`);
    assert(has('show-rhs'));
  }
  assert(!drawing(f).includes('·'), 'a withheld value is absent, never a dot, once the picture is complete');
});

test('softmax: the CSS the player toggles exists, so every class it sets changes something', () => {
  // JSDOM cannot compute MathJax's boxes; what it can hold is that each root class the
  // player writes has a rule in player.css, and that each hides or washes what the design
  // says. The wash is the one highlighting device; the strike is the one other mark.
  const rule = pattern => assert.match(css, pattern, `player.css lacks ${pattern}`);
  rule(/\.mechanism-excerpt:not\(\.show-c\) \.sm-c \{ display: none/);
  rule(/\.mechanism-excerpt:not\(\.show-rhs\) #eq-softmax-shift-2 \{ visibility: hidden/);
  rule(/\.mechanism-excerpt\.stage-0 \.sm-formula \{ visibility: hidden/);
  rule(/\.mechanism-excerpt\.stage-1 \.sm-num, \.mechanism-excerpt\.stage-2 \.sm-den \{ background: rgba\(43, 108, 176, \.14\)/);
  rule(/\.mechanism-excerpt\.hl-ec \.sm-ec \{ background: rgba\(35, 45, 75, \.14\)/);
  rule(/\.mechanism-excerpt\.struck \.sm-ec \{ position: relative; opacity: \.55/);
  rule(/\.mechanism-excerpt\.struck \.sm-ec::after \{[^}]*border-top: 2px solid var\(--sm-ink\)/);
  rule(/\.mechanism-excerpt:not\(\.is-relabelled\) \.sm-unit \{ display: none/);
  rule(/\.mechanism-excerpt:not\(\.show-sum\) \[data-tag="sum"\] \{ visibility: hidden/);
  rule(/\.mechanism-excerpt:not\(\.show-exp\) \[data-tag="exp"\], \.mechanism-excerpt:not\(\.show-prob\) \[data-tag="prob"\]/);
  // No opacity dimming of formula parts and no text-decoration strike: both were rejected.
  assert.doesNotMatch(css, /text-decoration\s*:/);
  assert.doesNotMatch(css, /\.sm-(num|den|lhs)[^{]*\{[^}]*opacity: \.[0-4]/);
  // Colour = meaning: the picture's blue and green are the book's macro colours, and the
  // shift is ink. No orange, purple or wine appears in this scene's stylesheet.
  rule(/--sm-input: #2b6cb0/); rule(/--sm-prediction: #2f855a/); rule(/--sm-ink: #232d4b/);
  rule(/#softmax-shift-excerpt \.shift-role \{ color: var\(--sm-ink\)/);
  for (const foreign of ['#c05621', '#B45309', '#805ad5', '#7950b8', '#722f37', '#9b2c4c']) assert(!css.includes(foreign), `${foreign} in player.css`);
});

test('softmax: the six formulas are the chapter\'s TeX in eq- wrappers, and playback never rewrites them', t => {
  const f = fixture(t, NAME);
  const {logits} = declared(f);
  const {total} = rawOf(logits);
  const ids = [1, 2, 3, 4, 5, 6].map(n => `eq-softmax-shift-${n}`);
  for (const id of ids) {
    const span = f.d.getElementById(id);
    assert(span, `${id} missing`);
    assert.match(span.textContent.trim(), /^\\\([\s\S]+\\\)$/, `${id} is not \\( … \\)`);
  }
  // @eq-softmax's own symbol, the max-subtraction-free closed form, and the two shift terms.
  const lhs = tex(f, 1);
  assert(lhs.includes('\\predictionpart{\\hat{y}_j}'), 'the chapter writes \\hat{y}_j, not \\hat p_j');
  assert.equal(count(lhs, '\\class{sm-c}{{}+c}'), 2, '+c appears once in the numerator and once in the denominator');
  assert(lhs.includes('\\class{sm-num}{e^{\\featurepart{o_j}'));
  assert(lhs.includes('\\class{sm-den}{\\sum_k e^{\\featurepart{o_k}'));
  assert(lhs.includes('\\dfrac'), 'inline \\frac renders textstyle-small');
  const rhs = tex(f, 2);
  assert.equal(count(rhs, '\\class{sm-ec}{e^{c}}'), 2, 'the shared factor is marked in the numerator and the denominator');
  assert(rhs.includes('e^{\\featurepart{o_j}}') && rhs.includes('\\sum_k e^{\\featurepart{o_k}}'));
  // The group labels on the picture, in the same macros.
  assert(tex(f, 3).includes('\\featurepart{o_j}'));
  assert(tex(f, 4).includes('e^{\\featurepart{o_j}}\\class{sm-unit}{\\,\\times e^{c}}'));
  assert(tex(f, 5).includes('\\predictionpart{\\hat{y}_j}'));
  assert(tex(f, 6).includes(`\\featurepart{\\Sigma = ${total.toFixed(2)}}\\class{sm-unit}{\\,\\times e^{c}}`));
  const all = ids.map(id => f.d.getElementById(id).textContent).join('\n');
  assert.doesNotMatch(all, /\\hat\{?p|(?<![A-Za-z\\{])p_j/, 'no p_j: the chapter\'s symbol is \\hat{y}_j');
  assert.doesNotMatch(all, /[0-9]/.source === '' ? /$^/ : /\d\.\d{3}/, 'no four-decimal probability inside a formula');
  // And every one of them survives the whole timeline unchanged.
  f.load(); f.open();
  for (const time of times(0.05)) {
    f.seek(time);
    ids.forEach((id, n) => assert.equal(f.d.getElementById(id).textContent, [lhs, rhs, tex(f, 3), tex(f, 4), tex(f, 5), tex(f, 6)][n], `${id} rewritten at ${time}s`));
    assert.equal(f.root.querySelectorAll('span[id^="eq-"]').length, 6);
  }
});

test('softmax: captions are prose within the budget, coloured by meaning, and the pane carries no chrome', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  assert.equal(f.root.querySelectorAll('.mechanism-stages').length, 0, 'no stage strip');
  assert.equal(f.root.querySelectorAll('[data-pane] dl, [data-pane] table, [data-pane] section').length, 0, 'no cards, no tables');
  const seenRoles = new Set();
  for (const time of times(0.05)) {
    f.seek(time);
    const html = caption(f).innerHTML, text = caption(f).textContent.trim();
    assert.doesNotMatch(html, /<sup|<sub|\^|e\^|\bexp\(/, `pseudo-math in the caption at ${time}s: ${html}`);
    const words = text.split(/\s+/).filter(Boolean).length;
    assert(words > 0 && words <= 20, `caption at ${time}s has ${words} words`);
    for (const role of ['input-role', 'prediction-role', 'shift-role']) if (html.includes(`class="${role}"`)) seenRoles.add(role);
    assert.doesNotMatch(f.$('[data-pane]').textContent, /beat \d/i, `stage chrome in the pane at ${time}s`);
  }
  assert.deepEqual([...seenRoles].sort(), ['input-role', 'prediction-role', 'shift-role'],
    'the caption words scores / green / c carry the picture\'s colours');
  // The shift beat names the dashes; the picture's own title does too (rule: the picture
  // must read without colour).
  f.seek(scene.beats[3]);
  assert.match(caption(f).textContent, /c = 0 dashes/);
  assert.match(f.$('.sm-figure svg title').textContent, /c = 0 height/);
});

test('softmax: the sum is printed only where it is a printed number, and the ruler is relabelled only at the snap', t => {
  const f = fixture(t, NAME);
  const {shift} = declared(f); f.load(); f.open();
  let hiddenMidSweep = 0, shownHome = 0, shownRelabelled = 0;
  for (const time of times(0.05)) {
    f.seek(time);
    const c = Number(f.root.dataset.c), stage = Number(f.root.dataset.stage), on = classes(f);
    const relabelled = on.has('is-relabelled');
    // Same marks, new ruler: only the shift and cancel beats, only at the full shift.
    assert.equal(relabelled, (stage === 3 || stage === 4) && c === shift, `is-relabelled at ${time}s (stage ${stage}, c ${c})`);
    assert.deepEqual(texts(f, '[data-ruler]'), [-1, 0, 1, 2, 3, 4, 5, 6, 7].map(level => String(level + (relabelled ? shift : 0)).replace('-', '−')),
      `ruler labels at ${time}s`);
    if (c > 0 && c < shift) { assert(!on.has('show-sum'), `Σ shown mid-sweep at ${time}s`); hiddenMidSweep++; }
    if (c === 0 && time >= scene.beats[1] + 4.5) { assert(on.has('show-sum'), `Σ hidden at c = 0, ${time}s`); shownHome++; }
    if (relabelled) { assert(on.has('show-sum'), `Σ hidden in the relabelled state at ${time}s`); shownRelabelled++; }
    if (c === shift && !relabelled) assert(!on.has('show-sum'), `Σ shown at c = ${shift} off the relabelled ruler, ${time}s`);
  }
  assert(hiddenMidSweep > 40 && shownHome > 100 && shownRelabelled > 40, `${hiddenMidSweep}/${shownHome}/${shownRelabelled}`);
  // The snap is one frame, held: the relabelled picture does not move for its 2.5 s.
  f.seek(scene.beats[3] + 9.5); const snapped = drawnMarkup(f);
  f.seek(scene.beats[3] + 9.45); assert.notEqual(drawnMarkup(f), snapped, 'the snap is a change');
  for (const time of [scene.beats[3] + 10, scene.beats[3] + 11, scene.beats[4] - 0.05]) { f.seek(time); assert.equal(drawnMarkup(f), snapped, `moved at ${time}s`); }
  // And the shift beat opens with 1.5 s of stillness at c = 0 while the dashes fade in.
  for (const time of [scene.beats[3], scene.beats[3] + 0.5, scene.beats[3] + 1.45]) { f.seek(time); assert.equal(Number(f.root.dataset.c), 0, `c moved at ${time}s`); }
});

test('softmax: motion is the mechanism — the ticks translate as one body, the bars scale by one factor, the green bars do not move', t => {
  const f = fixture(t, NAME);
  const {logits} = declared(f); f.load(); f.open();
  const rects = (selector, attribute) => [...f.root.querySelectorAll(selector)].map(node => Number(node.getAttribute(attribute)));
  // Expected geometry, from the declared logits and the picture's stated scales -- 24 px per
  // score unit on a baseline at y = 250, 20 px per unit of e^{o}, 150 px per unit of
  // probability -- never from what the player drew.
  const BASE = 250, TICK_UNIT = 24, EXP_UNIT = 20, PROB_UNIT = 150, CEILING = 180;
  f.seek(scene.beats[2] + 4);
  const greenHome = rects('[data-bar^="p"]', 'height');
  assert.equal(rects('[data-tick]', 'y').length, 4); assert.equal(rects('[data-bar^="e"]', 'height').length, 4); assert.equal(greenHome.length, 4);
  reference(logits).probabilities.forEach((p, j) => close(greenHome[j], PROB_UNIT * p, 0.01));
  // A tick is a 3 px rect centred on its level, so its y attribute is the level minus 1.5.
  rects('[data-tick]', 'y').forEach((y, j) => close(y, BASE - TICK_UNIT * logits[j] - 1.5, 0.01));
  rects('[data-bar^="e"]', 'height').forEach((h, j) => close(h, EXP_UNIT * Math.exp(logits[j]), 0.01));
  let checked = 0;
  for (const time of times(0.05)) {
    if (time < scene.beats[3] || time > scene.duration) continue;
    f.seek(time);
    const c = Number(f.root.dataset.c);
    // The green bars and their dashes: never a pixel of movement, at any c.
    assert.deepEqual(rects('[data-bar^="p"]', 'height'), greenHome, `a green bar moved at ${time}s`);
    const ghosts = f.root.querySelectorAll('[data-ghost]');
    assert.equal(ghosts.length, 4);
    [...f.root.querySelectorAll('[data-bar^="p"]')].forEach((bar, j) =>
      assert.equal(ghosts[j].getAttribute('y1'), bar.getAttribute('y'), `dash ${j} off its bar top at ${time}s`));
    if (c <= 0 || c >= 6 || classes(f).has('is-relabelled')) continue;
    // Every tick still on the ruler has risen by the same 24 c; every uncut bar has grown by
    // the same e^{c} (within the two decimals the markup carries).
    const ticks = [...f.root.querySelectorAll('[data-tick]')];
    for (const tick of ticks) {
      const j = Number(tick.dataset.tick);
      close(Number(tick.getAttribute('y')), BASE - TICK_UNIT * (logits[j] + c) - 1.5, 0.02);
    }
    for (const bar of f.root.querySelectorAll('[data-bar^="e"]')) {
      const j = Number(bar.dataset.bar.slice(1)), h = Number(bar.getAttribute('height'));
      const grown = EXP_UNIT * Math.exp(logits[j]) * Math.exp(c);
      if (h < CEILING - 1e-6) close(h, grown, 0.02);
      else assert(grown >= CEILING - 0.02, `bar ${j} cut before the ceiling at c = ${c}`);
    }
    assert(Math.max(...rects('rect', 'height')) <= CEILING + 1e-9, `a bar taller than the ceiling at ${time}s`);
    checked++;
  }
  assert(checked > 60, `only ${checked} moving frames were checked`);
  // Nothing on the picture is ever a placeholder: no "·", no zero standing in for a value.
  for (const time of times(0.5)) {
    f.seek(time);
    const pane = f.$('[data-pane]').textContent;
    assert(!pane.includes('·') && !pane.includes('0.0000') && !pane.includes('NaN'), `placeholder at ${time}s`);
  }
});

test('softmax: the c = 0 marks appear with the shift, one per class, and are named', t => {
  const f = fixture(t, NAME);
  const {logits} = declared(f); f.load(); f.open();
  const dashes = () => (drawing(f).match(/stroke-dasharray/g) || []).length;
  // A dashed reference mark is a claim about a value the reader has not been shown yet.
  for (const beat of scene.beats.slice(0, 3)) {
    f.seek(beat);
    assert.equal(dashes(), 0, `marks drawn at ${beat}s, before the shift beat`);
  }
  for (const beat of scene.beats.slice(3)) {
    f.seek(beat);
    assert.equal(dashes(), logits.length, `${logits.length} marks expected at ${beat}s`);
  }
  // They fade in over the first half second of the beat and then stand at full ink.
  f.seek(scene.beats[3]); assert.equal(f.root.querySelector('[data-ghost]').getAttribute('opacity'), '0');
  f.seek(scene.beats[3] + 0.5); assert.equal(f.root.querySelector('[data-ghost]').getAttribute('opacity'), '1');
  f.seek(scene.duration); assert.equal(f.root.querySelector('[data-ghost]').getAttribute('opacity'), '1');
  // Rule 7: the picture has to read without colour, so the marks are named — in the beat's
  // caption, in the picture's title, and in the transcript.
  f.seek(scene.beats[3]);
  assert.match(caption(f).textContent, /c = 0 dashes/, 'the shift caption does not name the dashes');
  assert.match(f.$('svg title').textContent, /ink dash that marks its c = 0 height/);
  assert.match(f.$('.mechanism-transcript').textContent, /c = 0 dashes/);
});

test('softmax: the caption never says "back at c = 0" while c is still on its way', t => {
  // The Hold beat begins with c at its full value and spends its first seconds sliding it
  // back. A caption is a live region, so a screen-reader user hears it as the statement of
  // record; while it said "Back at c = 0" the sighted readout beside it still printed
  // 100.0, and the scrubber's aria-valuetext agreed with the readout, not the caption.
  const f = fixture(t, NAME);
  const {shift} = declared(f); f.load(); f.open();
  const caption = () => f.$('[data-caption]').textContent;
  let unwinding = 0, arrived = 0;
  for (let time = 0; time <= scene.duration + 1e-9; time += 0.05) {
    f.seek(Number(time.toFixed(2)));
    const c = Number(f.root.dataset.c);
    const printed = Number(f.$('[data-c]').textContent);
    const says = /Back at c = 0/.test(caption());
    // The claim and the readout beside it are one statement, not two.
    if (says) { assert.equal(printed, 0, `the caption says c = 0 while the panel prints ${printed}`); arrived++; }
    if (c > 0) assert.equal(says, false, `at ${time.toFixed(2)}s the caption claims c = 0 but c = ${c}`);
    if (f.root.dataset.stage === '5' && c > 0) {
      assert.match(caption(), /unwinds back toward c = 0/,
        `the Hold beat does not say c is still moving at ${time.toFixed(2)}s`);
      unwinding++;
    }
  }
  assert(unwinding > 20, 'the Hold beat must actually spend time with c above zero');
  assert(arrived > 10, 'the Hold beat must reach c = 0 and say so');
  // Both sentences carry the same four probabilities, because that is the whole point.
  f.seek(scene.beats[5]);
  assert.equal(Number(f.root.dataset.c), shift, 'the Hold beat does not begin at the full shift');
  const moving = caption();
  f.seek(scene.duration);
  const home = caption();
  assert.notEqual(moving, home, 'the Hold beat never swaps its sentence');
  for (const text of [moving, home]) assert.match(text, /0\.6095, 0\.1360, 0\.0303, 0\.2242/);
  // And the scrubber, which reports c directly, agrees with the caption at both ends.
  const range = f.$('input[type=range]');
  assert.match(range.getAttribute('aria-valuetext'), /Shift c = 0\.0\./);
  f.seek(scene.beats[5]);
  assert.match(range.getAttribute('aria-valuetext'), new RegExp(`Shift c = ${shift}\\.0\\.`));
});

test('softmax: reduced motion snaps the shift to the declared endpoints, never between', t => {
  const f = fixture(t, NAME, {reduced: true});
  const {shift} = declared(f); f.load(); f.open();
  // The whole reduced timeline, not just the beats: c takes exactly the two values the
  // chapter evaluates, and it takes each of them for whole beats at a time. A quantised
  // sweep -- 0, 20, 40, 60, 80, 100 inside one beat -- would satisfy a boundary-only
  // check and fails here, which is the point.
  const byStage = new Map();
  for (let i = 0; i <= 400; i++) {
    f.seek(i / 10);
    const stage = Number(f.root.dataset.stage);
    if (!byStage.has(stage)) byStage.set(stage, new Set());
    byStage.get(stage).add(Number(f.root.dataset.c));
  }
  const seen = [...byStage.values()].flatMap(set => [...set]);
  assert.deepEqual([...new Set(seen)].sort((a, b) => a - b), [0, shift],
    'reduced motion visits a shift the chapter never evaluates');
  for (const [stage, set] of byStage) {
    assert.equal(set.size, 1, `reduced motion moves c inside beat ${stage}: ${[...set].join(', ')}`);
  }
  // Stages 3 and 4 are the two the shifted column exists for; every other stage is home.
  assert.deepEqual([...byStage.keys()].sort((a, b) => a - b).map(s => [...byStage.get(s)][0]),
    [0, 0, 0, shift, shift, 0]);
  // Under reduced motion the shift and cancel beats render the relabelled state: same
  // marks, new ruler, the unit carried, and the formula already struck for the cancel beat.
  f.seek(scene.beats[3]);
  assert(classes(f).has('is-relabelled')); assert.deepEqual(values(f, 's'), ['102.0', '100.5', '99.0', '101.0']);
  f.seek(scene.beats[4]); assert(classes(f).has('struck') && !classes(f).has('hl-ec'));
  f.seek(scene.beats[5]); assert(!classes(f).has('is-relabelled')); assert.deepEqual(values(f, 's'), ['2.0', '0.5', '−1.0', '1.0']);

  // Unreduced, the same beats are a continuous sweep -- so this is a reduced-motion
  // behaviour, not the scene quietly losing its animation.
  const sliding = fixture(t, NAME); sliding.load(); sliding.open();
  const between = [];
  for (let i = 200; i <= 300; i++) { sliding.seek(i / 10); between.push(Number(sliding.root.dataset.c)); }
  assert(between.some(c => c !== 0 && c !== shift), 'the unreduced sweep must pass between the endpoints');
  assert(new Set(between).size > 40, 'the unreduced sweep must be continuous, not stepped');
});

test('softmax: below 640 px the same picture stacks into three rows, and the wide layout is one baseline', t => {
  const wide = fixture(t, NAME); wide.load(); wide.open(); wide.seek(scene.duration);
  assert.equal(wide.$('svg').getAttribute('viewBox'), '0 0 1100 340');
  assert.equal(wide.root.querySelectorAll('.sm-baseline').length, 1);
  assert(!classes(wide).has('is-stacked'));
  const narrow = fixture(t, NAME, {width: STACKED}); narrow.load(); narrow.open(); narrow.seek(scene.duration);
  assert.equal(narrow.$('svg').getAttribute('viewBox'), '0 0 360 920');
  assert.equal(narrow.root.querySelectorAll('.sm-baseline').length, 3, 'three rows, three baselines');
  assert(classes(narrow).has('is-stacked'));
  // Same marks, same numbers, same internal geometry: only the rows moved.
  assert.deepEqual(values(narrow, ''), values(wide, ''));
  const heights = f => [...f.root.querySelectorAll('[data-bar]')].map(node => node.getAttribute('height'));
  assert.deepEqual(heights(narrow), heights(wide));
  const tags = f => [...f.root.querySelectorAll('foreignObject')].map(node => `${node.getAttribute('x')},${node.getAttribute('y')}`);
  assert.notDeepEqual(tags(narrow), tags(wide), 'the typeset labels move with their rows');
  // Nothing collides: every slot label sits below the ruler's lowest level, and in the
  // stacked layout each row's typeset header starts below the previous row's slot labels.
  const rulerBottom = f => Math.max(...[...f.root.querySelectorAll('.sm-ruler')].map(node => Number(node.getAttribute('y2'))));
  const labelRows = f => [...new Set([...f.root.querySelectorAll('.sm-slot')].map(node => Number(node.getAttribute('y'))))].sort((a, b) => a - b);
  for (const f of [wide, narrow]) assert(labelRows(f)[0] >= rulerBottom(f) + 6, `slot labels ${labelRows(f)} run into the ruler bottom ${rulerBottom(f)}`);
  const header = name => Number(narrow.root.querySelector(`foreignObject[data-tag="${name}"]`).getAttribute('y'));
  const rows = labelRows(narrow);
  assert.equal(rows.length, 3, 'three label rows in the stacked layout');
  assert(header('exp') >= rows[0] + 6 && header('sum') > header('exp'), `row 2 header ${header('exp')} sits in row 1's footer ${rows[0]}`);
  assert(header('prob') >= rows[1] + 6, `row 3 header ${header('prob')} sits in row 2's footer ${rows[1]}`);
  // And the rows themselves are far enough apart: each row owns the 250 px above its
  // baseline (header, lane, ceiling), which must start below the previous row's labels.
  const bases = [...narrow.root.querySelectorAll('.sm-baseline')].map(node => Number(node.getAttribute('y1'))).sort((a, b) => a - b);
  assert.equal(bases.length, 3);
  assert(bases[1] - 250 >= rows[0] + 6, `row 2 (baseline ${bases[1]}) starts inside row 1's footer ${rows[0]}`);
  assert(bases[2] - 250 >= rows[1] + 6, `row 3 (baseline ${bases[2]}) starts inside row 2's footer ${rows[1]}`);
  assert(header('exp') >= bases[1] - 250 && header('prob') >= bases[2] - 250, 'each header sits inside its own row');
  // A resize flips the mode in place, without restarting anything.
  wide.resize(STACKED);
  assert.equal(wide.$('svg').getAttribute('viewBox'), '0 0 360 920'); assert(classes(wide).has('is-stacked'));
  wide.resize(WIDE);
  assert.equal(wide.$('svg').getAttribute('viewBox'), '0 0 1100 340'); assert(!classes(wide).has('is-stacked'));
  assert(!wide.playing);
});

test('softmax: the panel is the only fixture copy — moving it moves every number', t => {
  const f = fixture(t, NAME);
  // Not a manuscript edit: this proves the player reads the declared attributes, so a real
  // chapter change could not leave a stale number behind in the scene script or the SVG.
  f.root.dataset.logits = '0 0 0 0';
  f.root.dataset.shift = '7';
  f.load(); f.open(); f.seek(scene.duration);
  live(f).forEach(p => close(p, 0.25));
  assert.deepEqual(values(f, 'p'), ['0.2500', '0.2500', '0.2500', '0.2500']);
  assert.deepEqual(values(f, 'e'), ['1.00', '1.00', '1.00', '1.00']);
  assert.deepEqual(values(f, 's'), ['0.0', '0.0', '0.0', '0.0']);
  f.seek(0); assert.match(caption(f).textContent, /Add 7 to every/);
  f.seek(scene.beats[2] + 3); assert.match(caption(f).textContent, /sum, 4\.00:/); assert(drawing(f).includes('÷ 4.00'));
  f.seek(scene.beats[3]); assert.match(caption(f).textContent, /climbs to 7:/);
  f.seek(scene.beats[4]); assert.deepEqual(texts(f, '[data-ruler]'), ['6', '7', '8', '9', '10', '11', '12', '13', '14']);
  assert.deepEqual(values(f, 's'), ['7.0', '7.0', '7.0', '7.0']);
  f.seek(scene.duration);
  // Everything the player writes: the picture's text and the caption. The six eq- spans
  // are static TeX, and their one constant, Σ, is pinned to the declared logits by the
  // static-fallback test above.
  const pane = f.$('[data-pane]').cloneNode(true);
  pane.querySelectorAll('span[id^="eq-"]').forEach(node => node.remove());
  for (const stale of ['0.6095', '0.1360', '0.0303', '0.2242', '12.12', '7.39', '1.65', '0.37', '2.72', '102.0'])
    assert(!pane.textContent.includes(stale), `${stale} survived a moved fixture`);
});

test('integration: the excerpt is HTML-only, manifest-driven, and declared in the config', () => {
  const filter = fs.readFileSync(path.join(__dirname, '..', scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/,
    'the non-HTML guard is the first executable line, so the PDF is untouched');
  assert.match(filter, /pandoc\.json\.decode/, 'the scene is data in the manifest, not code in the filter');
  assert.match(filter, /"after-cell"/, 'the filter must be able to place this scene\'s anchor kind');
  assert.match(filter, /assert\(inserted == 1/);
  assert.doesNotMatch(filter, /softmax/i, 'a manifest-driven filter names no scene');
  const config = fs.readFileSync(path.join(__dirname, '..', '_quarto.yml'), 'utf8');
  const section = (key, text) => {
    const start = text.indexOf(`\n${key}`);
    assert(start >= 0, `${key} is missing from _quarto.yml`);
    const rest = text.slice(start + 1 + key.length);
    const end = rest.search(/\n\S/);
    return end < 0 ? rest : rest.slice(0, end);
  };
  // Only the scene script is fetched by a reader; the panel, the styles and the manifest
  // are read from the project directory while the book builds.
  assert.match(section('  resources:', config),
    new RegExp(`^\\s+- interactives/${scene.scene}/player\\.js$`, 'm'));
  assert.match(section('filters:', config),
    new RegExp(`^\\s+- ${scene.filter.replace(/[/.]/g, '\\$&')}$`, 'm'));
  assert(!section('  resources:', config).includes(`${scene.scene}/panel.html`));
  // The chapter is anchored on a labelled executable cell, so Quarto emits cell-<label>.
  assert.equal(scene.anchor.type, 'after-cell');
  assert.match(chapterSource(NAME),
    new RegExp(`^#\\|\\s*label:\\s*${scene.anchor.target.slice('cell-'.length)}\\s*$`, 'm'));
  assert.equal(read(`${scene.scene}/panel.html`).includes('data-playback='), scene.transport === 'shared');
  assert(manifest.scenes.some(other => other.id === NAME));
  // The manifest's beats are the panel's, and the exponential variant it declares is the raw
  // e^{o_j} the picture draws, not the max-subtracted terms the first build showed.
  assert.deepEqual(scene.beats, [0, 5, 11, 17, 29, 36]);
  assert.match(scene.fixture.computedVariants[1], /raw e\^\(o_j\) -- 7\.39, 1\.65, 0\.37, 2\.72, sharing the sum 12\.12/);
  assert.match(scene.fixture.computedVariants[1], /max-subtracted/);
});
