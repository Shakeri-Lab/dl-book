#!/usr/bin/env node
// Test-only arithmetic and geometry. No test dependency enters the published book.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, close, canonicalMarkup,
  fixture, registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'reference-tilt-excerpt', scene = entry(NAME);
const widths = [240,296,360,519,520,553,713];
const declared = f => ({reference: numbers(f.root.dataset.reference), rewards: numbers(f.root.dataset.rewards)});
const slider = f => f.$('[data-beta-slider]');
const attr = (node, name) => Number(node.getAttribute(name));
const drawing = f => f.$('[data-drawing]');
const value = (f, key) => f.$(`[data-value="${key}"]`).textContent;
const drag = (f, beta) => {
  slider(f).value = String(beta);
  slider(f).dispatchEvent(new f.w.Event('input', {bubbles: true}));
};
const sum = values => values.reduce((total, x) => total + x, 0);
const dot = (a, b) => sum(a.map((x, i) => x * b[i]));
const kl = (p, q) => sum(p.map((x, i) => x === 0 ? 0 : x * Math.log(x / q[i])));
// Independent of the player's stable log-softmax path: the bounded slider makes
// direct positive reference * exponential weights safe to normalize here.
function exact(reference, rewards, beta) {
  const weights = reference.map((p, i) => p * Math.exp(rewards[i] / beta));
  const z = sum(weights), policy = weights.map(x => x / z);
  return {policy, reward: dot(policy, rewards), kl: kl(policy, reference)};
}
function actual(f) {
  return {beta: Number(f.root.dataset.beta), policy: JSON.parse(f.root.dataset.policy),
    reward: Number(f.root.dataset.reward), kl: Number(f.root.dataset.kl)};
}
function checkState(f, fx, beta) {
  const got = actual(f), want = exact(fx.reference, fx.rewards, beta);
  close(got.beta, beta, 1e-12);
  assert.equal(got.policy.length, fx.reference.length);
  got.policy.forEach((p, i) => { assert(p > 0 && p < 1); close(p, want.policy[i], 2e-12); });
  for (let i=0;i<got.policy.length;i++) {
    assert.equal(drawing(f).querySelector(`[data-probability="${i}"]`).textContent, want.policy[i].toFixed(3));
    assert.equal(drawing(f).querySelector(`[data-fixed-reward="${i}"]`).textContent, `r = ${fx.rewards[i]}`);
  }
  close(sum(got.policy), 1, 2e-12);
  close(got.reward, want.reward, 2e-12); close(got.kl, want.kl, 2e-12);
  assert(got.kl >= -1e-12);
  assert(value(f, 'reward').includes(want.reward.toFixed(6)));
  assert(value(f, 'kl').includes(want.kl.toFixed(6)));
  return got;
}

registerTransportTests(NAME, {witness: /2\.559982[\s\S]*1\.693801/,
  anchors: ['reference-tilt-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('reference tilt: the opening reveals the reference, not an answer disguised as the reference', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const visible = node => !node.closest('[hidden]');
  for (const time of [0,2.5,4.99]) {
    f.seek(time);
    assert.equal(f.root.dataset.revealed, 'false');
    for (const node of drawing(f).querySelectorAll('[data-bar], [data-probability], [data-value]'))
      assert(!visible(node), `answer exposed at ${time}s`);
    for (const node of drawing(f).querySelectorAll('[data-reference-bar]')) assert(visible(node));
    assert(!f.$('[data-formula]').classList.contains('rt-shown'));
    for (const label of [f.$('[data-figure] svg').getAttribute('aria-label'),
      slider(f).getAttribute('aria-valuetext'), f.$('[data-controls] input[type="range"]').getAttribute('aria-valuetext')]) {
      assert.doesNotMatch(label, /0\.925670|0\.029159|2\.559982|1\.693801/,
        'the prediction prompt must not leak the computed answer through an accessible label');
    }
  }
  f.seek(5);
  assert.equal(f.root.dataset.revealed, 'true');
  for (const node of drawing(f).querySelectorAll('[data-bar], [data-probability], [data-value]')) assert(visible(node));
  assert(f.$('[data-formula]').classList.contains('rt-shown'));
  assert.notDeepEqual(actual(f).policy, declared(f).reference,
    'beta four is already tilted; the first green bars are not the gray reference');
  f.seek(0); drag(f, 1);
  assert.equal(f.root.dataset.revealed, 'true', 'deliberately moving beta may reveal the calculation early');
  assert(!f.playing);
});

test('reference tilt: the positive finite fixture and printed witnesses come from the chapter', t => {
  const f = fixture(t, NAME), fx = declared(f), chapter = chapterSource(NAME);
  assert.deepEqual(fx.reference, [0.55,0.25,0.15,0.05]);
  assert.deepEqual(fx.rewards, [0,1,2,3]);
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal), literal);
  const frozen = fs.readFileSync(path.join(ROOT, '_freeze/chapters/part5/18-alignment/execute-results/html.json'), 'utf8');
  f.load(); f.open();
  for (const [time, beta, reward, divergence] of [
    [5,4,'0.925670','0.029159'], [18,1,'1.768029','0.561398'], [30,0.5,'2.559982','1.693801']
  ]) {
    assert(frozen.includes(reward) && frozen.includes(divergence), 'the frozen audit owns these six-decimal witnesses');
    f.seek(time); const computed = checkState(f, fx, beta);
    assert.equal(computed.reward.toFixed(6), reward);
    assert.equal(computed.kl.toFixed(6), divergence);
  }
  f.seek(18);
  assert.deepEqual(actual(f).policy.map(p => Number(p.toFixed(6))), [0.164562,0.203330,0.331625,0.300483]);
});

test('reference tilt: every slider value gives the normalized reference-weighted policy', t => {
  const f = fixture(t, NAME), fx = declared(f); f.load(); f.open(); f.seek(18);
  assert.equal(slider(f).min, '0.25'); assert.equal(slider(f).max, '4'); assert.equal(slider(f).step, '0.05');
  assert.equal(f.root.querySelectorAll('input[type="range"]').length, 2, 'one beta dial and the existing scrubber');
  let previous;
  for (let n=0;n<=75;n++) {
    const beta = Number((4 - n * 0.05).toFixed(2)); drag(f, beta);
    const got = checkState(f, fx, beta);
    if (previous) {
      assert(got.reward > previous.reward, 'less reference pressure raises expected proxy reward');
      assert(got.kl > previous.kl, 'that extra reward costs more KL drift');
    }
    previous = got;
  }
});

test('reference tilt: common reward shifts cancel, including the chapter\'s shift by 37', t => {
  const f = fixture(t, NAME), fx = declared(f);
  for (const shift of [-3,1.25,37]) {
    const shifted = fixture(t, NAME);
    shifted.root.dataset.rewards = fx.rewards.map(r => r + shift).join(' ');
    shifted.load(); shifted.open(); shifted.seek(18);
    for (const beta of [0.25,0.5,1,2,4]) {
      drag(shifted, beta);
      const got = actual(shifted), baseline = exact(fx.reference, fx.rewards, beta);
      got.policy.forEach((p, i) => close(p, baseline.policy[i], 2e-12));
      close(got.kl, baseline.kl, 2e-12);
      close(got.reward, baseline.reward + shift, 2e-12);
    }
  }
});

test('reference tilt: the displayed policy maximizes reward minus beta KL, not its sign-flipped loss', t => {
  const f = fixture(t, NAME), fx = declared(f); f.load(); f.open(); f.seek(18);
  const candidates = [fx.reference, [0.25,0.25,0.25,0.25], [0,0,0,1],
    [1,0,0,0], [0.1,0.6,0.2,0.1], [0.6,0.1,0.1,0.2]];
  for (const beta of [0.25,0.5,1,2,4]) {
    drag(f, beta); const p = actual(f).policy;
    const objective = q => dot(q, fx.rewards) - beta * kl(q, fx.reference);
    for (const q of candidates) {
      const gap = objective(p) - objective(q);
      // log p*_i = log reference_i + reward_i / beta - log Z. Thus J(q)
      // = beta log Z - beta KL(q || p*) after sum q = 1, including zero-mass terms.
      close(gap, beta * kl(q, p), 4e-12);
      assert(gap >= -1e-12);
    }
  }
});

test('reference tilt: the panel is the single fixture mirror, not just decoration over hard-coded numbers', t => {
  const f = fixture(t, NAME);
  const fx = {reference: [0.1,0.2,0.3,0.4], rewards: [3,1,2,0]};
  f.root.dataset.reference = fx.reference.join(' '); f.root.dataset.rewards = fx.rewards.join(' ');
  f.load(); f.open();
  for (const [time, beta] of [[5,4],[18,1],[30,0.5]]) { f.seek(time); checkState(f, fx, beta); }
  for (const beta of [0.25,1.75,4]) { drag(f, beta); checkState(f, fx, beta); }
});

test('reference tilt: the timeline arrives at the printed witnesses before holding them for reading', t => {
  const f = fixture(t, NAME), fx = declared(f); f.load(); f.open();
  assert.deepEqual(scene.beats, [0,5,10,18,22,30,35]); assert.equal(scene.duration, 40);
  for (const [times, beta] of [[[5,9.99,10],4], [[18,20,21.99,22],1], [[30,33,35,40],0.5]])
    for (const time of times) { f.seek(time); checkState(f, fx, beta); }
  for (const [start, end, from, to] of [[10,18,4,1],[22,30,1,0.5]]) {
    let previous = from;
    for (let n=1;n<=20;n++) {
      f.seek(start + (end-start)*n/20); const current = actual(f);
      assert(current.beta <= previous && current.beta >= to);
      checkState(f, fx, current.beta); previous = current.beta;
    }
    close(previous, to);
    f.seek(end - 0.001); close(actual(f).beta, to, 0.001);
  }
});

test('reference tilt: intermediate response C can lose mass even while expected reward rises', t => {
  const f = fixture(t, NAME), fx = declared(f); f.load(); f.open();
  const snapshots = [5,18,30].map(time => { f.seek(time); return checkState(f, fx, actual(f).beta); });
  assert(snapshots[1].policy[2] > snapshots[0].policy[2]);
  assert(snapshots[2].policy[2] < snapshots[1].policy[2]);
  assert(snapshots[2].reward > snapshots[1].reward);
  const captions = [];
  for (const time of [...scene.beats, 40]) { f.seek(time); captions.push(f.$('[data-caption]').textContent); }
  assert.doesNotMatch(captions.join(' '), /(?:all|every) (?:the )?(?:bars?|probabilit(?:y|ies)).{0,25}(?:rise|grow|increase)/i);
});

test('reference tilt: moving the beta dial pauses; only returning to the timeline clears its override', t => {
  const f = fixture(t, NAME), fx = declared(f); f.load(); f.open(); f.seek(18); f.play(); f.tick(400);
  drag(f, 2.25); assert(!f.playing); assert.equal(f.frames.size, 0);
  assert.equal(f.root.dataset.override, 'slider'); checkState(f, fx, 2.25);
  assert.equal(slider(f).value, '2.25', 'the pause redraw must not move the requested slider thumb back to the timeline');
  const time = f.time;
  f.resize(296); checkState(f, fx, 2.25); assert.equal(f.time, time);
  f.$('[data-action=fullscreen]').click(); checkState(f, fx, 2.25);
  f.$('[data-action=fullscreen]').click(); checkState(f, fx, 2.25);
  f.speed(2); checkState(f, fx, 2.25); assert(!f.playing);
  f.key('ArrowRight', slider(f)); assert.equal(f.time, time);
  assert.equal(f.root.dataset.override, 'slider', 'native beta key does not seek a scene beat');
  for (const action of [() => f.seek(18), () => f.key('Home'), () => f.key('End'), () => f.play()]) {
    drag(f, 2.25); action(); assert.equal(f.root.dataset.override, '');
    assert.notEqual(actual(f).beta, 2.25);
    if (f.playing) f.play();
  }
});

test('reference tilt: resizing and arbitrary seeking reproduce every published value and mark', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const snapshot = () => JSON.stringify({
    picture: canonicalMarkup(f.$('[data-figure]').innerHTML),
    formula: canonicalMarkup(f.$('[data-formula]').outerHTML),
    caption: f.$('[data-caption]').innerHTML, slider: slider(f).value,
    state: Object.fromEntries(Object.entries(f.root.dataset).filter(([key]) => !['time','playing','typeset'].includes(key)))
  });
  const times = [0,5,9.9,10,14.3,18,21,22,26.8,30,35,40];
  const first = times.map(time => { f.seek(time); return snapshot(); });
  drag(f, 0.25); f.play(); f.tick(1000); f.resize(296); f.seek(10); f.resize(713);
  const again = times.toReversed().map(time => { f.seek(time); return snapshot(); });
  assert.deepEqual(again, first.toReversed());
});

test('reference tilt: all bar heights are actual probability on one shared zero baseline at every width', t => {
  const f = fixture(t, NAME), fx = declared(f); f.load(); f.open();
  for (const width of widths) {
    f.resize(width);
    for (const time of [5,14,18,26,30,40]) {
      f.seek(time);
      const got = actual(f), base = Number(f.root.dataset.baseline), scale = Number(f.root.dataset.chartHeight);
      const box = numbers(f.$('[data-figure] svg').getAttribute('viewBox'));
      assert.equal(box[2], width); assert(scale > 0 && base > 0 && base < box[3]);
      for (let i=0;i<4;i++) for (const [selector, probability] of [
        [`[data-bar="${i}"]`,got.policy[i]], [`[data-reference-bar="${i}"]`,fx.reference[i]]
      ]) {
        const rect = drawing(f).querySelector(selector); assert(rect, selector);
        close(attr(rect,'height'), scale * probability, 0.0011);
        close(attr(rect,'y') + attr(rect,'height'), base, 0.0011);
        assert(attr(rect,'x') >= 0 && attr(rect,'x') + attr(rect,'width') <= width);
        assert(attr(rect,'y') >= 0 && attr(rect,'y') + attr(rect,'height') <= box[3]);
      }
      const bars = [...drawing(f).querySelectorAll('[data-bar]')];
      assert.equal(bars.length, 4);
      for (let i=1;i<4;i++) assert(attr(bars[i-1],'x') + attr(bars[i-1],'width') < attr(bars[i],'x'));
      for (const text of drawing(f).querySelectorAll('text')) {
        assert(attr(text,'font-size') >= 12, `legible type at ${width}px: ${text.textContent}`);
        assert(attr(text,'x') >= 0 && attr(text,'x') <= width);
        assert(attr(text,'y') >= 0 && attr(text,'y') <= box[3]);
      }
      assert.equal(f.$('[data-figure] svg').getAttribute('preserveAspectRatio'), 'xMinYMin meet');
    }
  }
});

test('reference tilt: complete wide and narrow static frames equal the final player render', async t => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after, 'regenerate with render_static_frames.cjs reference-tilt');
  const f = fixture(t, NAME);
  assert.equal(f.root.querySelectorAll('[data-static-frame="narrow"]').length, 1);
  for (const print of [f.$('[data-drawing]'), f.$('[data-static-frame="narrow"]')]) {
    const label = print.querySelector('[data-beta-label]');
    assert(label, 'each no-script print identifies its beta independently of the hidden slider');
    assert.equal(label.textContent.trim(), 'Beta = 0.50');
  }
  const staticIds = [...f.root.querySelectorAll('[id]')].map(node => node.id);
  assert.equal(staticIds.length, new Set(staticIds).size, 'static prints must not duplicate SVG or MathJax IDs');
  const narrow = f.$('[data-static-frame="narrow"]');
  assert.equal(narrow.dataset.width, '296');
  const height = Number(narrow.dataset.height);
  f.load(); f.open(); f.seek(40); f.resize(296);
  assert.equal(f.root.querySelectorAll('[data-static-frame="narrow"]').length, 0);
  assert.equal(numbers(f.$('[data-figure] svg').getAttribute('viewBox'))[3], height);
  const css = read('reference-tilt/player.css');
  assert.match(css, /@container\s*\(max-width:\s*519px\)/);
  assert.match(css, new RegExp(`aspect-ratio:\\s*296\\s*/\\s*${height}`));
});

test('reference tilt: the boundary keeps this an exact finite proxy objective and the beta dial neutral', t => {
  const f = fixture(t, NAME), html = read('reference-tilt/panel.html'), css = read('reference-tilt/player.css');
  const boundary = f.$('.mechanism-boundary').textContent;
  assert.match(boundary, /finite/i); assert.match(boundary, /proxy/i);
  assert.match(boundary, /(?:no|not|nothing).{0,45}(?:train|language model)/i);
  assert.match(boundary, /(?:not|no).{0,45}(?:truth|safe|safety)/i);
  assert.doesNotMatch(html, /\\parameterpart\{\\beta\}|class="[^"]*parameter[^"]*"[^>]*[^<]*beta/i);
  assert(!css.includes('#c05621'), 'beta is a fixed control coefficient, not a learnable parameter');
  assert.match(css, /\[data-probability\]\s*\{[^}]*stroke:white;[^}]*paint-order:stroke;/,
    'a reference ghost crossing a live value must not cut through its digits');
  assert.doesNotMatch(html, /@eq-/);
  assert.match(html, /href="#eq-gibbs-policy"/);
  const filter = fs.readFileSync(path.join(ROOT, scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
  assert.equal(scene.anchor.type, 'after-cell'); assert.equal(scene.anchor.target, 'cell-fig-reference-tilt');
});
