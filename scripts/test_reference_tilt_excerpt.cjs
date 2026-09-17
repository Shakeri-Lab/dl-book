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
// The harness's key() sends bare keys; a modified or auto-repeated key needs its own event.
const press = (f, key, init = {}) => f.$('[data-pane]').dispatchEvent(
  new f.w.KeyboardEvent('keydown', {key, bubbles: true, cancelable: true, ...init}));
const scrubber = f => f.$('[data-controls] input[type="range"]');
const picture = f => f.$('[data-figure] svg');
const gaugePart = (f, part, name) => drawing(f).querySelector(`[data-${part}="${name}"]`);
const shown = node => !node.closest('[hidden]');
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
// `digits` is what the two gauge numbers print to: six at a witness hold, three while
// beta glides or the dial is dragged. The unrounded state is compared either way.
function checkState(f, fx, beta, digits) {
  assert([3, 6].includes(digits), 'say whether this state is a six-decimal witness hold or a three-decimal reading');
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
  assert.equal(value(f, 'reward'), want.reward.toFixed(digits));
  assert.equal(value(f, 'kl'), want.kl.toFixed(digits));
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
    for (const name of ['reward', 'kl']) {
      assert(shown(gaugePart(f, 'rail', name)), 'the empty gauges are scenery: they show what will be measured');
      assert(!shown(gaugePart(f, 'fill', name)), `the ${name} gauge is filled at ${time}s`);
    }
    for (const label of [picture(f).getAttribute('aria-label'),
      slider(f).getAttribute('aria-valuetext'), scrubber(f).getAttribute('aria-valuetext')]) {
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
    f.seek(time); const computed = checkState(f, fx, beta, 6);
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
    const got = checkState(f, fx, beta, 3);
    got.fills = ['reward', 'kl'].map(name => attr(gaugePart(f, 'fill', name), 'width'));
    if (previous) {
      assert(got.reward > previous.reward, 'less reference pressure raises expected proxy reward');
      assert(got.kl > previous.kl, 'that extra reward costs more KL drift');
      got.fills.forEach((width, i) => assert(width > previous.fills[i], 'both gauges visibly lengthen as beta falls'));
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
  for (const [time, beta] of [[5,4],[18,1],[30,0.5]]) { f.seek(time); checkState(f, fx, beta, 6); }
  for (const beta of [0.25,1.75,4]) { drag(f, beta); checkState(f, fx, beta, 3); }
});

test('reference tilt: the timeline arrives at the printed witnesses before holding them for reading', t => {
  const f = fixture(t, NAME), fx = declared(f); f.load(); f.open();
  assert.deepEqual(scene.beats, [0,5,10,18,22,30,35]); assert.equal(scene.duration, 40);
  for (const [times, beta] of [[[5,9.99],4], [[18,20,21.99],1], [[30,33,35,40],0.5]])
    for (const time of times) { f.seek(time); checkState(f, fx, beta, 6); }
  // A glide beat opens on the witness it is about to leave, already read to three decimals.
  for (const [time, beta] of [[10,4],[22,1]]) { f.seek(time); checkState(f, fx, beta, 3); }
  for (const [start, end, from, to] of [[10,18,4,1],[22,30,1,0.5]]) {
    let previous = from;
    for (let n=1;n<=20;n++) {
      f.seek(start + (end-start)*n/20); const current = actual(f);
      assert(current.beta <= previous && current.beta >= to);
      checkState(f, fx, current.beta, n === 20 ? 6 : 3); previous = current.beta;
    }
    close(previous, to);
    f.seek(end - 0.001); close(actual(f).beta, to, 0.001);
  }
});

test('reference tilt: intermediate response C can lose mass even while expected reward rises', t => {
  const f = fixture(t, NAME), fx = declared(f); f.load(); f.open();
  const snapshots = [5,18,30].map(time => { f.seek(time); return checkState(f, fx, actual(f).beta, 6); });
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
  assert.equal(f.root.dataset.override, 'slider'); checkState(f, fx, 2.25, 3);
  assert.equal(slider(f).value, '2.25', 'the pause redraw must not move the requested slider thumb back to the timeline');
  const time = f.time;
  f.resize(296); checkState(f, fx, 2.25, 3); assert.equal(f.time, time);
  f.$('[data-action=fullscreen]').click(); checkState(f, fx, 2.25, 3);
  f.$('[data-action=fullscreen]').click(); checkState(f, fx, 2.25, 3);
  f.speed(2); checkState(f, fx, 2.25, 3); assert(!f.playing);
  f.key('ArrowRight', slider(f)); assert.equal(f.time, time);
  assert.equal(f.root.dataset.override, 'slider', 'native beta key does not seek a scene beat');
  for (const action of [() => f.seek(18), () => f.key('Home'), () => f.key('End'), () => f.play(),
    () => f.key('ArrowLeft'), () => f.key('ArrowRight'), () => f.key(' '), () => f.key('k'),
    () => press(f, 'ArrowLeft', {shiftKey: true})]) {
    drag(f, 2.25); action(); assert.equal(f.root.dataset.override, '');
    assert.notEqual(actual(f).beta, 2.25);
    if (f.playing) f.play();
  }
});

test('reference tilt: a key the transport ignores leaves the dragged beta alone, even across a resize', t => {
  // Regression. The player used to clear its override on Arrow/Home/End without the
  // transport's modifier guard: Alt+ArrowLeft sought nothing, the panel still said
  // data-override="slider", and the next resize snapped beta back to the timeline's 1.
  const f = fixture(t, NAME), fx = declared(f); f.load(); f.open(); f.seek(18);
  const ignored = [];
  for (const modifier of ['altKey', 'ctrlKey', 'metaKey'])
    for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End', ' ', 'k', 'K']) ignored.push([key, {[modifier]: true}]);
  for (const key of [' ', 'k', 'K']) ignored.push([key, {repeat: true}]);
  for (const [key, init] of ignored) {
    const name = `${Object.keys(init)[0]}+${JSON.stringify(key)}`;
    drag(f, 2.25); const time = f.time;
    press(f, key, init);
    assert.equal(f.time, time, `${name} must not seek`); assert(!f.playing, `${name} must not play`);
    assert.equal(f.root.dataset.override, 'slider', `${name} ended the drag although the transport ignored it`);
    f.resize(296); checkState(f, fx, 2.25, 3);
    assert.equal(slider(f).value, '2.25', `${name}, then a resize, snapped the thumb back to the timeline`);
    assert.equal(f.$('[data-beta-readout]').textContent, '2.25');
    f.resize(713); checkState(f, fx, 2.25, 3); assert.equal(f.time, time);
  }
  // A key aimed at another control inside the pane is not the pane's key either.
  drag(f, 2.25); f.key('Home', f.$('[data-speed]'));
  assert.equal(f.root.dataset.override, 'slider'); f.resize(520); checkState(f, fx, 2.25, 3);
});

test('reference tilt: live values are announced by the beta slider alone', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  assert.equal(fixture(t, NAME).$('[data-beta-display]').getAttribute('aria-hidden'), null,
    'without the player nothing else speaks beta, so the static readout stays readable');
  assert.equal(f.$('[data-beta-display]').getAttribute('aria-hidden'), 'true',
    'while the player runs the slider speaks beta; the visible copy is not a second announcement');
  const pictures = new Set(), inspect = revealed => {
    const label = picture(f).getAttribute('aria-label'), spoken = slider(f).getAttribute('aria-valuetext');
    const beat = scrubber(f).getAttribute('aria-valuetext').replace(/^\d+:\d\d of \d+:\d\d\. /, '');
    pictures.add(label);
    assert.doesNotMatch(label, /\d/, `the picture's label describes the picture, not its values: ${label}`);
    assert.match(beat, /^[A-Z][a-z]/); assert.doesNotMatch(beat, /\d/, `the scrubber names the beat only: ${beat}`);
    assert(spoken.startsWith(`Beta ${f.$('[data-beta-readout]').textContent}. `), spoken);
    assert.match(spoken, /Lower beta weakens the stay-near penalty\.$/, 'the value text says what the value does');
    assert.equal(spoken.includes(`Expected proxy reward ${value(f, 'reward')}, KL to reference ${value(f, 'kl')}.`), revealed,
      revealed ? `the slider speaks the two numbers exactly as drawn: ${spoken}` : 'no answer before the reveal');
  };
  for (const time of [0,2.5]) { f.seek(time); inspect(false); }
  for (const time of [5,7,10,14.3,18,20,22,26.8,30,35,40]) { f.seek(time); inspect(true); }
  const beat = () => scrubber(f).getAttribute('aria-valuetext');
  f.seek(20); const named = beat();
  for (const beta of [4,2.25,1,0.5,0.25]) {
    drag(f, beta); inspect(true);
    // Force a transport redraw mid-detour: the scrubber still names the timeline's beat.
    f.speed(2); f.speed(1.5); inspect(true); assert.equal(beat(), named);
  }
  assert.equal(pictures.size, 2, 'one sentence before the reveal and one after: the label is not a per-frame readout');
});

test('reference tilt: beta is drawn once; six decimals only at the three witness holds', t => {
  const f = fixture(t, NAME), fx = declared(f); f.load(); f.open();
  const decimals = key => value(f, key).split('.')[1].length;
  const once = () => {
    const onPicture = [...drawing(f).querySelectorAll('text')].filter(node => /beta|β/i.test(node.textContent));
    assert.equal(onPicture.length, 0, 'the picture does not repeat the slider readout');
    assert.equal(f.root.querySelectorAll('[data-pane] output').length, 1);
    assert.equal(f.$('[data-beta-readout]').textContent, actual(f).beta.toFixed(2));
    assert.equal(f.$('[data-beta-display]').textContent.replace(/\s+/g, ' ').trim(), `β = ${actual(f).beta.toFixed(2)}`);
  };
  for (const time of [5,7,9.99,18,20,21.99,30,33,35,37,40]) {
    f.seek(time); once();
    assert.deepEqual([decimals('reward'), decimals('kl')], [6,6], `a witness hold at ${time}s prints the manuscript's digits`);
  }
  for (const time of [10,10.5,14,17.99,22,26,29.99]) {
    f.seek(time); once();
    assert.deepEqual([decimals('reward'), decimals('kl')], [3,3], `a glide at ${time}s reads to three decimals`);
  }
  // A dragged dial reads to three even when it rests exactly on a witness beta, and even
  // while the clock is parked inside a witness hold.
  for (const time of [7,14,20,37]) for (const beta of [4,2.25,1,0.5,0.25]) {
    f.seek(time); drag(f, beta); once(); checkState(f, fx, beta, 3);
  }
  // Never more than seven live numbers: four probabilities, two gauge readings, beta.
  f.seek(20);
  const live = [...drawing(f).querySelectorAll('[data-probability], [data-value]')].filter(shown);
  assert.equal(live.length, 6);
  for (const node of drawing(f).querySelectorAll('[data-probability]')) assert.match(node.textContent, /^0\.\d{3}$/);
});

test('reference tilt: no probability label is struck through by a reference outline or a bar top', t => {
  // Regression. The label used to ride the live bar's top only, so a bar shorter than its
  // reference (response B near beta 0.9) had "0.186" crossed by the dashed top edge.
  const f = fixture(t, NAME); f.load(); f.open();
  const clear = context => {
    const legend = [...drawing(f).querySelectorAll('text')].find(node => node.textContent === 'reference');
    for (let i=0;i<4;i++) {
      const label = drawing(f).querySelector(`[data-probability="${i}"]`);
      const bar = drawing(f).querySelector(`[data-bar="${i}"]`), ghost = drawing(f).querySelector(`[data-reference-bar="${i}"]`);
      const tops = [attr(bar,'y'), attr(ghost,'y')], y = attr(label,'y'), size = attr(label,'font-size');
      // Digits have no descenders: the text box is [y - size, y]. Neither top edge may
      // enter it, and the label still sits on its own column.
      for (const top of tops) assert(top >= y + 5 || top <= y - size - 2, `${context}: label ${i} at ${y} is crossed at ${top}`);
      assert(y <= Math.min(...tops) - 5, `${context}: label ${i} must sit above the taller of bar and outline`);
      assert(y >= Math.min(...tops) - 9, `${context}: label ${i} stays beside the column it measures`);
      close(attr(label,'x'), attr(bar,'x') + attr(bar,'width')/2, 0.0002);
      close(attr(label,'x'), attr(ghost,'x') + attr(ghost,'width')/2, 0.0002);
      assert(y - size >= attr(legend,'y') + 4, `${context}: label ${i} runs into the legend`);
    }
  };
  for (const width of widths) {
    f.resize(width);
    for (const time of [5,10,12,14,16,18,22,24,26,28,30,40]) { f.seek(time); clear(`${width}px, ${time}s`); }
    for (let n=0;n<=75;n++) { const beta = Number((4 - n * 0.05).toFixed(2)); drag(f, beta); clear(`${width}px, beta ${beta}`); }
    // The reported frame: 24 s, beta near 0.9, where B reads 0.186 under a taller outline.
    f.seek(24); close(actual(f).beta, 0.9, 0.01);
    const bar = drawing(f).querySelector('[data-bar="1"]'), ghost = drawing(f).querySelector('[data-reference-bar="1"]');
    const label = drawing(f).querySelector('[data-probability="1"]');
    assert(attr(bar,'height') < attr(ghost,'height'), 'B is shorter than its reference here');
    assert.equal(label.textContent, '0.186');
    assert(attr(label,'y') <= attr(ghost,'y') - 5, 'so its number clears the dashed top edge instead of sitting on it');
  }
  // Continuity: the rule never makes a label jump while beta glides.
  f.resize(713);
  let before;
  for (let time=10;time<=30+1e-9;time+=0.05) {
    f.seek(Number(time.toFixed(2)));
    const ys = [0,1,2,3].map(i => attr(drawing(f).querySelector(`[data-probability="${i}"]`),'y'));
    if (before) ys.forEach((y, i) => assert(Math.abs(y - before[i]) < 1.5, `label ${i} jumps ${Math.abs(y - before[i])} px at ${time.toFixed(2)}s`));
    before = ys;
  }
});

test('reference tilt: the two gauges are fixed-scale marks of expected proxy reward and KL', t => {
  const book = fixture(t, NAME), fx = declared(book);
  const mass = (reference, rewards) => dot(reference, rewards);
  for (const [fixtureValues, betas] of [
    [fx, [4,2.25,1,0.9,0.5,0.25]],
    [{reference: [0.1,0.2,0.3,0.4], rewards: [3,1,2,0]}, [4,1,0.25]],
    [{reference: fx.reference, rewards: fx.rewards.map(r => r + 37)}, [4,1,0.25]]
  ]) {
    const f = fixture(t, NAME);
    f.root.dataset.reference = fixtureValues.reference.join(' '); f.root.dataset.rewards = fixtureValues.rewards.join(' ');
    f.load(); f.open();
    const low = Math.min(...fixtureValues.rewards), high = Math.max(...fixtureValues.rewards);
    const ceiling = -Math.log(Math.min(...fixtureValues.reference));
    const scales = JSON.parse(f.root.dataset.gaugeScales);
    assert.deepEqual(scales.reward, [low, high], 'expected proxy reward is scaled between the smallest and largest declared score');
    assert.equal(scales.kl[0], 0); close(scales.kl[1], ceiling, 1e-12);
    const fraction = {
      reward: state => (state.reward - low) / (high - low), kl: state => state.kl / ceiling};
    const home = {reward: (mass(fixtureValues.reference, fixtureValues.rewards) - low) / (high - low), kl: 0};
    for (const width of [296,713]) {
      f.resize(width);
      const rails = {};
      const check = (context, revealed = true) => {
        const state = exact(fixtureValues.reference, fixtureValues.rewards, actual(f).beta);
        for (const name of ['reward','kl']) {
          const rail = gaugePart(f,'rail',name), fill = gaugePart(f,'fill',name), mark = gaugePart(f,'gauge-reference',name);
          const geometry = ['x','y','width','height'].map(key => attr(rail, key));
          rails[name] = rails[name] || geometry;
          assert.deepEqual(geometry, rails[name], `${context}: the ${name} rail is a fixed scale; it never moves or rescales`);
          assert(shown(rail) && shown(mark) && shown(gaugePart(f,'gauge-label',name)));
          assert.equal(shown(fill), revealed); assert.equal(shown(gaugePart(f,'value',name)), revealed);
          assert.equal(attr(fill,'x'), geometry[0]); assert.equal(attr(fill,'y'), geometry[1]); assert.equal(attr(fill,'height'), geometry[3]);
          const drawn = attr(fill,'width') / geometry[2];
          assert(drawn >= 0 && drawn <= 1, `${context}: the ${name} fill leaves its rail`);
          close(drawn, fraction[name](state), 1e-5);
          close((attr(mark,'x1') - geometry[0]) / geometry[2], home[name], 1e-5);
          assert.equal(attr(mark,'x1'), attr(mark,'x2'));
          assert(attr(mark,'y1') < geometry[1] && attr(mark,'y2') > geometry[1] + geometry[3], 'the dashed reference mark crosses the rail');
          assert(gaugePart(f,'gauge-reference',name).classList.contains('rt-reference'), 'the mark is drawn like the reference outlines');
        }
        const [reward, divergence] = ['reward','kl'].map(name => gaugePart(f,'rail',name));
        assert.equal(attr(reward,'x'), attr(divergence,'x')); assert.equal(attr(reward,'width'), attr(divergence,'width'));
        assert(attr(divergence,'y') > attr(reward,'y'), 'the pair is stacked on one origin so both fills grow side by side');
      };
      f.seek(2); check(`${width}px, prediction`, false);
      for (const time of [5,14,18,26,30,40]) { f.seek(time); check(`${width}px, ${time}s`); }
      for (const beta of betas) { drag(f, beta); check(`${width}px, beta ${beta}`); }
      f.seek(0);
    }
  }
  // The book's own scales: scores run 0 to 3, and KL to this reference cannot exceed ln 20.
  book.load(); book.open();
  const scales = JSON.parse(book.root.dataset.gaugeScales);
  assert.deepEqual(scales.reward, [0,3]); close(scales.kl[1], Math.log(20), 1e-12);
});

test('reference tilt: gauge names and numbers have room at every width', t => {
  const f = fixture(t, NAME); f.load(); f.open(); f.seek(30);
  // JSDOM measures no text. 0.6 em per character over-estimates these sans-serif labels
  // and tabular digits, so passing here leaves real slack in a browser.
  const advance = node => 0.6 * attr(node,'font-size') * node.textContent.length;
  for (const width of widths) {
    f.resize(width);
    const box = numbers(picture(f).getAttribute('viewBox'));
    for (const name of ['reward','kl']) {
      const label = gaugePart(f,'gauge-label',name), number = gaugePart(f,'value',name), rail = gaugePart(f,'rail',name);
      assert.equal(number.textContent.length, 8, 'measured at its widest: a six-decimal witness');
      assert.notEqual(number.getAttribute('text-anchor'), 'end', 'left-aligned, so digits added at a hold do not move the ones already read');
      assert(attr(number,'x') + advance(number) <= box[2], `${width}px: the ${name} number is clipped`);
      if (f.root.dataset.layout === 'narrow') {
        assert(attr(label,'x') + advance(label) <= attr(number,'x') - 4, `${width}px: "${label.textContent}" runs into its number`);
        assert(attr(label,'y') <= attr(rail,'y') - 6 && attr(number,'y') <= attr(rail,'y') - 6, 'name and number sit above the rail');
      } else {
        assert.equal(label.getAttribute('text-anchor'), 'end');
        assert(attr(label,'x') - advance(label) >= 0 && attr(label,'x') < attr(rail,'x'));
        assert(attr(number,'x') > attr(rail,'x') + attr(rail,'width'));
      }
      assert(attr(rail,'y') + attr(rail,'height') < box[3]);
    }
  }
});

test('reference tilt: reduced motion rests each glide beat on the finished glide its caption describes', t => {
  const f = fixture(t, NAME, {reduced: true}), fx = declared(f); f.load(); f.open();
  for (const [time, beta, digits] of [[5,4,6],[9.9,4,6],[10,1,3],[14,1,3],[17.9,1,3],[18,1,6],[21.9,1,6],
    [22,0.5,3],[26,0.5,3],[29.9,0.5,3],[30,0.5,6],[35,0.5,6],[40,0.5,6]]) {
    f.seek(time); checkState(f, fx, beta, digits);
  }
  f.seek(14); assert.match(f.$('[data-caption]').textContent, /redistribute/);
  assert.notDeepEqual(actual(f).policy.map(p => p.toFixed(3)), exact(fx.reference, fx.rewards, 4).policy.map(p => p.toFixed(3)),
    'a still captioned "redistribute" must not be the picture the glide started from');
  f.seek(2); assert.equal(f.root.dataset.revealed, 'false');
});

test('reference tilt: drawing coordinates are serialised at 0.0001 px; the state is not rounded', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const geometric = ['x','y','x1','x2','y1','y2','width','height'];
  for (const width of [296,553,713]) {
    f.resize(width);
    for (const time of [7,13.37,18,26.81,40]) {
      f.seek(time);
      for (const node of drawing(f).querySelectorAll('*')) for (const key of geometric) {
        if (node.hasAttribute(key)) assert.match(node.getAttribute(key), /^-?\d+(?:\.\d{1,4})?$/, `${node.tagName} ${key}="${node.getAttribute(key)}"`);
      }
    }
  }
  f.seek(13.37);
  assert(String(actual(f).beta).split('.')[1].length > 6, 'beta itself is published unrounded');
  assert(actual(f).policy.some(p => String(p).split('.')[1].length > 6));
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
  // Beta is drawn once in the static panel too: the readout beside the (hidden, inert)
  // slider identifies the print's beta, and neither print repeats it on the picture.
  const css = read('reference-tilt/player.css');
  const staticBeta = f.$('[data-beta-display]').textContent.replace(/\s+/g, ' ').trim();
  assert.equal(staticBeta, 'β = 0.50');
  assert.match(css, /#reference-tilt-excerpt:not\(\[data-ready\]\) \.rt-slider-track\s*\{[^}]*visibility:hidden/,
    'only the inert control is hidden before the player mounts');
  assert.doesNotMatch(css, /:not\(\[data-ready\]\) \.rt-(?:slider|beta)\s*\{/, 'the static beta readout stays visible');
  for (const print of [f.$('[data-drawing]'), f.$('[data-static-frame="narrow"]')]) {
    assert.equal(print.querySelectorAll('[data-beta-label]').length, 0);
    assert.doesNotMatch(print.textContent, /beta|β/i);
    assert.match(print.textContent, /2\.559982[\s\S]*1\.693801/, 'each print carries the final six-decimal witnesses');
    assert.equal(print.querySelectorAll('[data-rail]').length, 2);
  }
  const staticIds = [...f.root.querySelectorAll('[id]')].map(node => node.id);
  assert.equal(staticIds.length, new Set(staticIds).size, 'static prints must not duplicate SVG or MathJax IDs');
  const narrow = f.$('[data-static-frame="narrow"]');
  assert.equal(narrow.dataset.width, '296');
  const height = Number(narrow.dataset.height);
  f.load(); f.open(); f.seek(40); f.resize(296);
  assert.equal(f.root.querySelectorAll('[data-static-frame="narrow"]').length, 0);
  assert.equal(numbers(f.$('[data-figure] svg').getAttribute('viewBox'))[3], height);
  assert.equal(f.$('[data-beta-display]').textContent.replace(/\s+/g, ' ').trim(), staticBeta,
    'the hand-written static readout is the final frame\'s beta');
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
