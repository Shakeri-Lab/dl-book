#!/usr/bin/env node
// Test-only fixture arithmetic. No synthetic logits are shipped with this animation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, canonicalMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');
const NAME = 'mask-predictor-excerpt', scene = entry(NAME);
const declared = f => ({tokens: ['tokensA', 'tokensB'].map(k => numbers(f.root.dataset[k])),
  masks: ['maskA', 'maskB'].map(k => numbers(f.root.dataset[k]))});
const predicted = mask => mask.slice(1).flatMap((value, i) => value ? [i] : []);
const visible = node => !node.closest('[hidden]');
const picture = f => canonicalMarkup(f.$('[data-figure]').innerHTML);
// Observable geometry of the one tracked object and of the marks it visits.
const packet = f => {
  const node = f.$('[data-packet]'), [x, y] = numbers(node.getAttribute('transform').replace(/[^\d.\s-]/g, ' '));
  return {node, x, y, at: node.dataset.at, state: node.dataset.state, slot: node.dataset.slot};
};
const box = node => Object.fromEntries(['x','y','width','height'].map(k => [k, Number(node.getAttribute(k))]));
const railY = (f, j = 0) => Number(f.$(`[data-score-rail="${j}"]`).getAttribute('y1'));
const withoutPacket = f => {
  const pane = f.$('[data-pane]').cloneNode(true);
  pane.querySelectorAll('[data-controls], [data-notice], [data-packet]').forEach(node => node.remove());
  return canonicalMarkup(pane.innerHTML);
};
const outputs = f => [...f.root.querySelectorAll('[data-predictor]')].map(node => ({
  id: node.dataset.predictor, included: node.dataset.included === 'true',
  label: node.querySelector('[data-output-symbol]').textContent,
  box: canonicalMarkup(node.querySelector('[data-output-box]').outerHTML)}));

registerTransportTests(NAME, {witness: /neither|zero change|change in either score/,
  anchors: ['mask-predictor-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('mask: the two rows and the shifted-mask sum are the manuscript fixture, not film scores', t => {
  const f = fixture(t, NAME), fx = declared(f), chapter = chapterSource(NAME);
  assert.deepEqual(fx.tokens, [[1,2,3,4,5,6,0], [1,2,7,8,9,6,0]]);
  assert.deepEqual(fx.masks, [[0,0,0,1,1,1,0], [0,0,1,1,1,1,0]]);
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal), literal);
  const frozen = fs.readFileSync(path.join(ROOT, '_freeze/chapters/part5/18-alignment/execute-results/html.json'), 'utf8');
  assert(frozen.includes('scored response tokens: [3, 4]'));
  assert(frozen.includes('largest change after perturbing prompt/padding predictions: 0.00e+00'));
  const publicSource = read('mask-predictor/panel.html') + read('mask-predictor/player.js');
  for (const rejected of ['7.276004', '8.981891', 'Math.random', 'fetch(', 'torch.randn']) assert(!publicSource.includes(rejected), rejected);
  assert.match(f.$('.mechanism-boundary').textContent, /sum.*SFT loss above negates and averages/s);
  assert.match(f.$('.mechanism-boundary').textContent, /Changing the prompt could change/);
});

test('mask: next-target offset includes each last prompt predictor and excludes the unused final output', t => {
  const f = fixture(t, NAME), fx = declared(f); f.load(); f.open();
  const active = fx.masks.map(predicted);
  assert.deepEqual(active, [[2,3,4], [1,2,3,4]]);
  for (const time of [0,5,10,15,20,23,26,32,36,40]) {
    f.seek(time);
    assert.deepEqual(JSON.parse(f.root.dataset.activePredictors), active);
    assert.deepEqual(JSON.parse(f.root.dataset.excludedPredictors), [[0,1,5],[0,5]]);
    const groups = [...f.root.querySelectorAll('[data-predictor]')];
    assert.equal(groups.length, 12);
    for (const node of groups) {
      const [b,i] = node.dataset.predictor.split(':').map(Number);
      assert.equal(Number(node.dataset.targetSlot), i + 1);
      assert.equal(node.dataset.included, String(Boolean(fx.masks[b][i + 1])));
      assert(i < 6);
    }
  }
  fx.masks.forEach((mask, b) => {
    const lastPrompt = mask.indexOf(1) - 1;
    assert.equal(mask[lastPrompt], 0);
    assert(active[b].includes(lastPrompt), 'zero mask at the predictor slot does not exclude its next target');
  });
});

test('mask: readable words are coherent illustrative aliases for the unchanged token-ID fixture', t => {
  const f = fixture(t, NAME), fx = declared(f);
  const aliases = f.root.dataset.tokenLabels.split('|');
  assert.deepEqual(aliases, ['[PAD]', 'Explain', ':', 'why', 'birds', 'can', 'fly', 'how', 'planes', 'also']);
  const prose = f.root.textContent;
  assert.match(prose, /illustrative (?:word )?(?:aliases|labels)/i);
  assert.match(prose, /not.*tokenizer.*decod/i);
  f.load(); f.open();
  for (const time of [0,5,10,15,20,26,32,36,40]) {
    f.seek(time);
    const inputs = [...f.root.querySelectorAll('[data-token-slot]')];
    const targets = [...f.root.querySelectorAll('[data-shifted-target]')];
    assert.equal(inputs.length, 12, 'six scored predictors per sequence; no unused final output');
    assert.equal(targets.length, 12, 'six shifted targets per sequence, including excluded padding');
    for (let b=0;b<2;b++) for (let i=0;i<6;i++) {
      const input = f.$(`[data-token-slot="${b}:${i}"]`);
      const target = f.$(`[data-shifted-target="${b}:${i + 1}"]`);
      assert.equal(Number(input.querySelector('[data-token]').dataset.token), fx.tokens[b][i]);
      assert.equal(input.querySelector('[data-token-label]').textContent, aliases[fx.tokens[b][i]]);
      assert.equal(Number(target.querySelector('[data-target-token]').dataset.targetToken), fx.tokens[b][i + 1]);
      assert.equal(target.querySelector('[data-target-label]').textContent, aliases[fx.tokens[b][i + 1]]);
      assert(!input.contains(target), 'a target is a separate supervised role, not a label on the input');
      const gate = target.querySelector(`[data-target-mask="${b}:${i + 1}"]`);
      assert(gate, 'the mask belongs visibly to the shifted target');
      assert.equal(gate.textContent.replace(/\s/g, ''), `×${fx.masks[b][i + 1]}`);
    }
  }
});

test('mask: one sequence is shown at a time and scrubbing preserves its paired fixture', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const times = [0,4.9,5,9.9,10,14.9,15,19.9,20,25.9,26,31.9,32,35.9,36,40];
  for (const time of [...times, ...times.toReversed()]) {
    f.seek(time);
    const expected = time >= 15 && time < 32 ? 'B' : 'A';
    assert.equal(f.root.dataset.sequence, expected);
    const rows = [...f.root.querySelectorAll('[data-row]')];
    assert.equal(rows.length, 2);
    assert.deepEqual(rows.map(visible), expected === 'A' ? [true,false] : [false,true]);
    for (let b=0;b<2;b++) {
      assert.equal(rows[b].querySelectorAll('[data-predictor]').length, 6);
      assert.equal(rows[b].querySelectorAll('[data-shifted-target]').length, 6);
    }
  }
});

// Independent stable log-softmax and summation, deliberately not imported from player.js.
function score(logits, tokens, mask) {
  return tokens.slice(1).reduce((sum, target, i) => {
    const row = logits[i], peak = Math.max(...row);
    const logp = row[target] - peak - Math.log(row.reduce((acc,x) => acc + Math.exp(x - peak), 0));
    return sum + mask[i + 1] * logp;
  }, 0);
}
test('mask: independent synthetic logits prove excluded-output invariance and catch a same-slot masking bug', t => {
  const f = fixture(t, NAME), fx = declared(f);
  const logits = fx.tokens.map((_, b) => Array.from({length:7}, (_, i) => Array.from({length:11}, (_, k) =>
    Math.sin((b + 2) * (i + 1) + k / 3))));
  for (let b=0;b<2;b++) {
    const initial = score(logits[b], fx.tokens[b], fx.masks[b]);
    const altered = logits[b].map((row, i) => i === 6 || !fx.masks[b][i + 1] ? row.map((_, k) => k - 5) : [...row]);
    assert.equal(score(altered, fx.tokens[b], fx.masks[b]), initial);
    // Negative control: this shifted argument makes score() read mask[i], the
    // erroneous response_mask[:, :-1], rather than the next target's mask[i+1].
    const wrongMask = [0, ...fx.masks[b].slice(0, -1)];
    assert(Math.abs(score(altered, fx.tokens[b], wrongMask) - score(logits[b], fx.tokens[b], wrongMask)) > 0.1,
      'same-slot masking wrongly includes an excluded output and must break the invariance');
    const lastPrompt = fx.masks[b].indexOf(1) - 1;
    altered[lastPrompt][fx.tokens[b][lastPrompt + 1]] += 3;
    assert(Math.abs(score(altered, fx.tokens[b], fx.masks[b]) - initial) > 0.1,
      'changing the included last-prompt output must affect its first response target');
  }
});

test('mask: perturbation changes excluded symbolic outputs only; inputs and included outputs remain fixed', t => {
  const f = fixture(t, NAME), fx = declared(f); f.load(); f.open(); f.seek(15);
  const before = outputs(f);
  const input = () => [...f.root.querySelectorAll('[data-token-slot]')].map(n => ({
    id: n.querySelector('[data-token]').dataset.token, label: n.querySelector('[data-token-label]').textContent}));
  const originalInputs = input();
  let changed = false;
  for (let time=20;time<=40;time+=0.25) {
    f.seek(time);
    assert.deepEqual(input(), originalInputs);
    for (const after of outputs(f)) {
      const original = before.find(row => row.id === after.id);
      if (after.included) {
        assert.equal(after.label, original.label);
        assert.equal(after.box, original.box);
        assert.match(after.label, /log.?prob/i);
      } else {
        assert.match(after.label, /changed/i);
        if (after.box !== original.box) changed = true;
      }
    }
    assert.equal(f.root.dataset.perturbation, 'excluded-output-logits-only');
  }
  assert(changed);
  // Regression: the change is one held step. The old player pulsed these strokes on a sine.
  const strokes = new Map();
  for (let time=20;time<=40;time+=0.05) {
    f.seek(Number(time.toFixed(2)));
    for (const node of f.root.querySelectorAll('[data-output-box]')) {
      const seen = strokes.get(node.dataset.outputBox) || new Set();
      strokes.set(node.dataset.outputBox, seen.add(node.getAttribute('stroke-width')));
    }
  }
  for (const [id, seen] of strokes) assert.equal(seen.size, 1, `output ${id} changes stroke after the perturbation beat`);
  assert.deepEqual(originalInputs.map(n => Number(n.id)), fx.tokens.flatMap(tokens => tokens.slice(0,-1)));
  assert.equal(f.root.querySelectorAll('[data-logit-glyph]').length, 0, 'no decorative pseudo-distribution bars');
});

test('mask: counts, score receipt and accessible answer are withheld until earned', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const label = () => f.$('[data-figure] svg').getAttribute('aria-label');
  const spoken = () => [label(), f.$('[data-caption]').textContent,
    f.$('[data-controls] input[type=range]').getAttribute('aria-valuetext')].join(' ');
  for (const time of [0,4.9]) {
    f.seek(time);
    assert(!visible(f.$('[data-value="count-a"]')));
    assert(!visible(f.$('[data-value="count-b"]')));
    assert(!visible(f.$('[data-value="change"]')));
    assert(!/three|four|zero|neither|counts because/i.test(spoken()), 'the prediction beat carries no answer');
    assert.equal(f.root.querySelectorAll('[data-predictor]:not([hidden])').length, 0, 'no gate is drawn while the reader predicts');
  }
  f.seek(9.9); assert(!visible(f.$('[data-value="count-a"]')));
  f.seek(10); assert(visible(f.$('[data-value="count-a"]'))); assert(!visible(f.$('[data-value="count-b"]')));
  assert.equal(f.$('[data-value="count-a"]').textContent, 'A: 3');
  f.seek(15); assert(visible(f.$('[data-value="count-b"]')));
  assert.equal(f.$('[data-value="count-b"]').textContent, 'B: 4');
  f.seek(25.9); assert(!visible(f.$('[data-value="change"]'))); assert.equal(f.root.dataset.scoreChange, 'unrevealed');
  assert(!/neither/i.test(spoken()));
  f.seek(26); assert(visible(f.$('[data-value="change"]'))); assert.equal(f.root.dataset.scoreChange, '0');
  assert.match(f.$('[data-caption]').textContent, /Neither sequence score changes/);
});

test('mask: a value is announced once — the picture label and scrubber never repeat the caption or its counts', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (const time of [0,5,10,15,20,26,32,36,40]) {
    f.seek(time);
    const label = f.$('[data-figure] svg').getAttribute('aria-label');
    const valuetext = f.$('[data-controls] input[type=range]').getAttribute('aria-valuetext');
    const caption = f.$('[data-caption]').textContent.trim();
    assert(!label.includes(caption), `the picture label repeats the caption at ${time}s`);
    for (const text of [label, valuetext]) assert.doesNotMatch(text, /three|four|zero|\b[034]\b.*(target|change)/i, text);
    assert.match(label, /^Sequence [AB]: /);
  }
});

test('mask: input and target rails align with vertical comparisons and wrap to two narrow strips', t => {
  const f = fixture(t, NAME); f.load(); f.open(); f.seek(36);
  let narrowHeight, wideHeight;
  for (const width of [240,296,360,519,520,553,713]) {
    f.resize(width);
    const svg=f.$('[data-figure] svg'), box=numbers(svg.getAttribute('viewBox'));
    assert.equal(box[2], width);
    for (const node of f.root.querySelectorAll('[data-token-slot] rect, [data-shifted-target] rect')) {
      assert(Number(node.getAttribute('x')) >= 0);
      assert(Number(node.getAttribute('x')) + Number(node.getAttribute('width')) <= width);
    }
    for (const node of f.root.querySelectorAll('.mp-wire')) assert(Number(node.getAttribute('y2')) > Number(node.getAttribute('y1')));
    for (const node of f.root.querySelectorAll('.mp-target-wire')) assert(Number(node.getAttribute('y2')) < Number(node.getAttribute('y1')));
    for (const route of f.root.querySelectorAll('[data-next-route]')) {
      const commands = route.getAttribute('d').match(/[A-Za-z]/g);
      assert(commands.every(command => ['M','L','H','V'].includes(command)), 'a dogleg passes output to its gate, never curves back into an input');
    }
    const inputs = Array.from({length:6}, (_,i) => f.$(`[data-token-slot="0:${i}"] rect`));
    const top = inputs.map(node => Number(node.getAttribute('y')));
    for (let b=0;b<2;b++) for (let i=0;i<6;i++) {
      const input=f.$(`[data-token-slot="${b}:${i}"] rect`);
      const target=f.$(`[data-shifted-target="${b}:${i + 1}"] rect`);
      assert.equal(Number(input.getAttribute('x')),Number(target.getAttribute('x')));
      assert(Number(target.getAttribute('y')) > Number(input.getAttribute('y')));
    }
    if (width < 520) {
      narrowHeight=box[3];
      assert.equal(new Set(top.slice(0,3)).size,1);
      assert.equal(new Set(top.slice(3)).size,1);
      assert(top[3] > top[0], 'phone layout reflows three columns per strip, not a shrunken six-column slide');
    } else {
      wideHeight=box[3];
      assert.equal(new Set(top).size,1);
    }
    for (const node of f.root.querySelectorAll('[data-drawing] text')) assert(Number(node.getAttribute('font-size')) >= 12);
    assert.equal(svg.getAttribute('preserveAspectRatio'),'xMinYMin meet');
  }
  assert(narrowHeight > wideHeight);
});

test('mask: returning from resize and arbitrary scrubbing restores the same picture', t => {
  const f=fixture(t,NAME); f.load(); f.open(); f.seek(23.4); const original=picture(f);
  f.seek(39); f.resize(296); f.seek(2); f.seek(23.4); f.resize(713);
  assert.equal(picture(f),original);
});

test('mask: one tracked marker carries the answer — input, output, route, ×1 gate, score — and the contrast stops at ×0', t => {
  const f = fixture(t, NAME, {width: 713}); f.load(); f.open();
  assert.equal(f.root.querySelectorAll('[data-packet]').length, 1, 'one tracked object');
  assert.equal(f.root.querySelectorAll('[data-focus-pair], [data-moving-pair]').length, 0, 'the old box-and-dot focus is gone');
  const input = box(f.$('[data-token-slot="0:2"] rect')), out = box(f.$('[data-output-box="0:2"]'));
  const birds = box(f.$('[data-shifted-target="0:3"] rect'));
  assert.equal(f.$('[data-shifted-target="0:3"] [data-target-label]').textContent, 'birds');
  // Beat 0 and beat 1: it rests under the last prompt slot's input.
  for (const time of [0, 2, 5]) {
    f.seek(time); const p = packet(f);
    assert(visible(p.node)); assert.equal(p.slot, '0:2'); assert.equal(p.at, 'input');
    assert.equal(p.x, input.x + input.width / 2);
    assert(p.y > input.y + input.height && p.y < out.y, 'between the input box and its output');
  }
  // Mid-glide it has left the input; beside the output it sits on the route, right of the box.
  f.seek(8.1); let p = packet(f);
  assert.equal(p.at, 'output'); assert(p.x > out.x + out.width); assert(p.y > out.y && p.y < out.y + out.height);
  // Beat 2: parked at the gate of the shifted target "birds", not yet in the score.
  f.seek(10); p = packet(f);
  assert.equal(p.at, 'gate'); assert.equal(p.state, 'carried');
  assert(p.y > birds.y && p.y < birds.y + birds.height); assert(Math.abs(p.x - (birds.x + birds.width)) < 12);
  assert.equal(f.$('[data-target-mask="0:3"]').textContent.replace(/\s/g, ''), '×1');
  // Then through the open gate and down onto the score rail, where it holds until the cut.
  for (const time of [13, 14.9]) {
    f.seek(time); p = packet(f);
    assert.equal(p.at, 'score'); assert.equal(p.y, railY(f));
    assert(p.x > birds.x && p.x < birds.x + birds.width, 'it lands under the target it scored');
  }
  // Contrast, sequence B: the same marker, taken from prompt slot 0, stops at its ×0 gate.
  const colon = box(f.$('[data-shifted-target="1:1"] rect'));
  f.seek(15); p = packet(f); assert.equal(p.slot, '1:0'); assert.equal(p.at, 'input');
  f.seek(20); p = packet(f); assert.equal(p.at, 'output');
  assert.equal(f.$('[data-output-symbol="1:0"]').textContent, 'changed', 'it carries a changed output');
  for (let time = 15; time < 32; time += 0.25) {
    f.seek(time); p = packet(f);
    assert(p.y < railY(f) - 20, `an excluded output must never reach the score rail (${time}s)`);
    assert.equal(p.state, time >= 26 ? 'blocked' : 'carried');
    assert.equal(visible(p.node.querySelector('.mp-packet-core')), time < 26, 'blocked is a shape change, not a colour');
  }
  f.seek(26); p = packet(f);
  assert.equal(p.at, 'gate'); assert(p.y > colon.y && p.y < colon.y + colon.height);
  assert.equal(f.$('[data-target-mask="1:1"]').textContent.replace(/\s/g, ''), '×0');
  // Replay on sequence A: from the last prompt predictor's output straight through to the score.
  f.seek(32); p = packet(f); assert.equal(p.slot, '0:2'); assert.equal(p.at, 'output');
  for (const time of [36, 40]) { f.seek(time); p = packet(f); assert.equal(p.at, 'score'); assert.equal(p.y, railY(f)); }
});

test('mask: the marker really travels, never jumps, and is the only thing that moves inside a beat', t => {
  for (const width of [713, 296]) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    const beats = f.$('[data-pane]').dataset.beats.split(/\s+/).map(Number);
    let travelled = 0, previous = null;
    for (let time = 0; time <= 40; time = Number((time + 0.05).toFixed(2))) {
      f.seek(time); const p = packet(f);
      const cut = time === 15 || time === 32; // the whole picture changes sequence at these two beats
      if (previous && !cut) {
        const hop = Math.hypot(p.x - previous.x, p.y - previous.y);
        assert(hop < 8, `the marker jumps ${hop.toFixed(1)} px at ${time}s (${width}px)`);
        travelled += hop;
      }
      previous = p;
    }
    assert(travelled > 300, `the old dot moved 17 px in all; this one travels ${travelled.toFixed(0)} px`);
    // Inside each beat the scenery is still: only the marker changes.
    for (let index = 0; index < beats.length; index++) {
      const end = index + 1 < beats.length ? beats[index + 1] : 40, stills = new Set();
      for (let time = beats[index]; time < end - 1e-9; time += 0.1) { f.seek(Number(time.toFixed(2))); stills.add(withoutPacket(f)); }
      assert.equal(stills.size, 1, `scenery moves inside the beat starting at ${beats[index]}s`);
    }
    // An arrow-key seek parks on a finished picture: at every beat the marker rests at a named stop.
    for (const beat of [...beats, 40]) { f.seek(beat); assert.notEqual(packet(f).at, 'moving', `mid-glide at the ${beat}s beat`); }
  }
});

test('mask: reduced motion shows the same parked marker as each beat, one still per beat', t => {
  const moving = fixture(t, NAME, {width: 713}), still = fixture(t, NAME, {width: 713, reduced: true});
  for (const f of [moving, still]) { f.load(); f.open(); }
  const beats = moving.$('[data-pane]').dataset.beats.split(/\s+/).map(Number);
  const expected = ['input', 'input', 'gate', 'input', 'output', 'gate', 'output', 'score'];
  beats.forEach((beat, index) => {
    moving.seek(beat); const parked = packet(moving);
    assert.equal(parked.at, expected[index]);
    for (const time of [beat, beat + 1.3, (index + 1 < beats.length ? beats[index + 1] : 40) - 0.05]) {
      still.seek(time); const p = packet(still);
      assert.deepEqual([p.x, p.y, p.at, p.state, p.slot], [parked.x, parked.y, parked.at, parked.state, parked.slot]);
    }
  });
});

test('mask: the picture carries labels only; the prefix sentence lives in the caption of the shift beat', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (const width of [713, 296]) {
    f.resize(width);
    for (const time of [0,5,10,15,20,26,32,36,40]) {
      f.seek(time);
      for (const node of f.root.querySelectorAll('[data-drawing] text')) {
        const text = node.textContent.trim();
        assert(text.split(/\s+/).length <= 4, `"${text}" is prose on the picture`);
        assert.doesNotMatch(text, /[.!?]$/, `"${text}" is a sentence on the picture`);
        assert(!text.includes('-'), `hyphen-minus printed on the picture in "${text}"`);
      }
      assert.doesNotMatch(f.$('[data-drawing]').textContent, /prefix/i);
    }
  }
  f.seek(5);
  assert.match(f.$('[data-caption]').textContent, /whole prefix through its slot/);
  for (const time of [0,5,10,15,20,26,32,36]) {
    f.seek(time);
    const spoken = [f.$('[data-caption]').textContent, f.$('[data-figure] svg').getAttribute('aria-label'),
      f.$('[data-controls] input[type=range]').getAttribute('aria-valuetext')].join(' ');
    assert.doesNotMatch(spoken, /-\s?\d/, 'a hyphen-minus is never a minus sign');
  }
  // The static prints carry no sentence either.
  const panel = read('mask-predictor/panel.html');
  assert(!/Each output uses the prefix/.test(panel));
});

test('mask: gates are neutral operators told apart by shape; wine is not used', t => {
  const css = read('mask-predictor/player.css');
  assert(!/#722f37|mp-error/i.test(css), 'wine means loss or error; neither a ×0 gate nor a zero change is one');
  assert(!/mp-error|#722f37/i.test(read('mask-predictor/player.js') + read('mask-predictor/panel.html')));
  assert.match(css, /\.mp-ink, \.mask-predictor-figure \.mp-gate \{ fill:var\(--mp-ink\); \}/);
  assert.match(css, /\.mp-excluded \.mp-gate \{ fill:var\(--mp-scenery\); \}/);
  const f = fixture(t, NAME, {width: 713}), fx = declared(f); f.load(); f.open(); f.seek(40);
  assert.equal(f.$('[data-value="change"]').getAttribute('class'), 'mp-ink');
  for (const width of [713, 296]) {
    f.resize(width);
    for (const node of f.root.querySelectorAll('[data-predictor]')) {
      const [b, i] = node.dataset.predictor.split(':').map(Number), open = Boolean(fx.masks[b][i + 1]);
      const end = node.querySelector('[data-gate-end]'), route = node.querySelector('[data-next-route]').getAttribute('d');
      const rail = railY(f, width < 520 && i >= 3 ? 1 : 0), target = box(node.querySelector('[data-shifted-target] rect'));
      assert.equal(end.dataset.gateEnd, open ? 'open' : 'stop');
      const lastV = /V ([\d.]+)$/.exec(route);
      if (open) {
        assert(lastV && rail - Number(lastV[1]) < 8, 'an open gate runs on into the score rail');
        assert.equal(end.getAttribute('class'), 'mp-output');
      } else {
        assert(!lastV, 'a closed gate has no path to the rail');
        assert.equal(end.getAttribute('class'), 'mp-stop');
        const [, x, top, bottom] = /^M ([\d.]+) ([\d.]+) V ([\d.]+)$/.exec(end.getAttribute('d')).map(Number);
        assert(x > target.x && x < target.x + target.width && top > target.y && bottom < target.y + target.height,
          'the stop bar sits inside the target box, beside its ×0');
      }
    }
  }
});

test('mask: on the phone wrap the whole scored route stays in the first strip, under slot 2', t => {
  const f = fixture(t, NAME, {width: 296}); f.load(); f.open(); f.seek(13);
  assert.equal(f.root.dataset.layout, 'narrow');
  const why = box(f.$('[data-token-slot="0:2"] rect')), birdsTarget = box(f.$('[data-shifted-target="0:3"] rect'));
  const birdsInput = box(f.$('[data-token-slot="0:3"] rect'));
  assert.equal(birdsTarget.x, why.x, 'the shifted target sits under its predictor, in the same strip');
  assert(birdsInput.y > railY(f, 0) && birdsInput.x < why.x, 'input slot 3 begins the second strip');
  assert(visible(f.$('[data-score-rail="0"]')) && visible(f.$('[data-score-rail="1"]')), 'each strip has its piece of the score rail');
  for (let time = 0; time < 15; time += 0.1) {
    f.seek(time); const p = packet(f);
    assert(p.y <= railY(f, 0), `the marker leaves the first strip at ${time}s`);
    assert(p.x >= why.x && p.x + 7.6 <= 296, `the marker leaves column 2 or the picture at ${time}s`);
  }
  f.seek(13); const p = packet(f);
  assert.equal(p.y, railY(f, 0)); assert(p.x > birdsTarget.x && p.x < birdsTarget.x + birdsTarget.width);
  f.resize(713);
  assert(visible(f.$('[data-score-rail="0"]')) && !visible(f.$('[data-score-rail="1"]')), 'one strip, one rail');
  for (const width of [240, 296, 302, 360, 713]) {
    f.resize(width);
    for (let time = 0; time <= 40; time += 0.5) { f.seek(time); const q = packet(f); assert(q.x - 7.6 >= 0 && q.x + 7.6 <= width); }
  }
});

test('mask: per-frame work touches the marker only; layout and fixture facts are not rewritten each frame', t => {
  const f = fixture(t, NAME, {width: 713}); f.load(); f.open(); f.seek(8.5);
  const observer = new f.w.MutationObserver(() => {});
  observer.observe(f.root, {attributes: true, childList: true, characterData: true, subtree: true});
  for (const time of [8.6, 8.8, 9.0, 9.4]) f.seek(time);
  const touched = observer.takeRecords().filter(record => !record.target.closest('[data-controls]') && record.target !== f.root
    || (record.target === f.root && !['data-time', 'data-playing'].includes(record.attributeName)));
  observer.disconnect();
  assert(touched.length > 0);
  for (const record of touched) assert(record.target.closest('[data-packet]'), `${record.target.nodeName} ${record.attributeName} rewritten inside a beat`);
});

test('mask: complete wide and narrow static frames equal deterministic final renders', async t => {
  const generated=await staticFrame(NAME);
  assert.equal(generated.before,generated.after,'run render_static_frames.cjs mask-predictor');
  const source=generated.before;
  const f=fixture(t,NAME); f.load(); f.open(); f.seek(40); f.resize(296);
  const height=numbers(f.$('[data-figure] svg').getAttribute('viewBox'))[3];
  assert(source.includes(`data-width="296" data-height="${height}"`));
  assert(source.includes('preserveAspectRatio="xMinYMin meet"'));
  assert.equal((source.match(/data-predictor=/g)||[]).length,24);
  const css=read('mask-predictor/player.css');
  assert.match(css, /@container \(max-width: 519px\)/);
  assert.match(css, new RegExp(`aspect-ratio:\\s*296\\s*/\\s*${height}`));
});
