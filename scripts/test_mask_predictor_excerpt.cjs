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
  assert.deepEqual(originalInputs.map(n => Number(n.id)), fx.tokens.flatMap(tokens => tokens.slice(0,-1)));
  assert.equal(f.root.querySelectorAll('[data-logit-glyph]').length, 0, 'no decorative pseudo-distribution bars');
});

test('mask: counts, score receipt and accessible answer are withheld until earned', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const label = () => f.$('[data-figure] svg').getAttribute('aria-label');
  for (const time of [0,4.9]) {
    f.seek(time);
    assert(!visible(f.$('[data-value="count-a"]')));
    assert(!visible(f.$('[data-value="count-b"]')));
    assert(!visible(f.$('[data-value="change"]')));
    assert(!/three|four|zero|do not change/i.test(label()));
  }
  f.seek(9.9); assert(!visible(f.$('[data-value="count-a"]')));
  f.seek(10); assert(visible(f.$('[data-value="count-a"]'))); assert(!visible(f.$('[data-value="count-b"]')));
  f.seek(15); assert(visible(f.$('[data-value="count-b"]')));
  f.seek(25.9); assert(!visible(f.$('[data-value="change"]'))); assert.equal(f.root.dataset.scoreChange, 'unrevealed');
  f.seek(26); assert(visible(f.$('[data-value="change"]'))); assert.equal(f.root.dataset.scoreChange, '0');
  assert.match(label(), /do not change/);
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
