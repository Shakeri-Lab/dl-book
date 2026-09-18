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
// A role is the token's own mask entry spelt as a word; derived here, not imported from the player.
const roleOf = (mask, k) => mask[k] ? 'response' : k < mask.indexOf(1) ? 'prompt' : 'padding';
const visible = node => !node.closest('[hidden]');
const picture = f => canonicalMarkup(f.$('[data-figure]').innerHTML);
// Observable geometry. Cards and copies are groups placed by translate(): a node's place on the
// picture is its own x/y plus every ancestor's translation.
const shift = node => {
  let x = 0, y = 0;
  for (let n = node; n && n.getAttribute; n = n.parentNode) {
    const m = /translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)/.exec(n.getAttribute('transform') || '');
    if (m) { x += Number(m[1]); y += Number(m[2]); }
  }
  return [x, y];
};
const box = node => {
  const [dx, dy] = shift(node), own = Object.fromEntries(['x','y','width','height'].map(k => [k, Number(node.getAttribute(k) || 0)]));
  return {...own, x: own.x + dx, y: own.y + dy};
};
const centre = node => { const b = box(node.querySelector('rect')); return {x: b.x + b.width / 2, y: b.y, opacity: Number(node.getAttribute('opacity') ?? 1)}; };
const input = (f, b, i) => f.$(`[data-token-slot="${b}:${i}"]`);
const copy = (f, b, k) => f.$(`[data-shifted-target="${b}:${k}"]`);
const leaving = (f, b, k) => f.$(`[data-leaving-copy="${b}:${k}"]`);
// The one tracked marker and the marks it visits.
const packet = f => {
  const node = f.$('[data-packet]'), [x, y] = numbers(node.getAttribute('transform').replace(/[^\d.\s-]/g, ' '));
  return {node, x, y, at: node.dataset.at, state: node.dataset.state, slot: node.dataset.slot};
};
const railY = (f, j = 0) => Number(f.$(`[data-score-rail="${j}"]`).getAttribute('y1'));
const withoutPacket = (f, alsoTape = false) => {
  const pane = f.$('[data-pane]').cloneNode(true);
  pane.querySelectorAll(`[data-controls], [data-notice], [data-packet]${alsoTape ? ', [data-tape]' : ''}`).forEach(node => node.remove());
  return canonicalMarkup(pane.innerHTML);
};
const spoken = f => [f.$('[data-figure] svg').getAttribute('aria-label'), f.$('[data-caption]').textContent,
  f.$('[data-controls] input[type=range]').getAttribute('aria-valuetext')].join(' ');
const outputs = f => [...f.root.querySelectorAll('[data-predictor]')].map(node => ({
  id: node.dataset.predictor, included: node.dataset.included === 'true',
  label: node.querySelector('[data-output-symbol]').textContent,
  box: canonicalMarkup(node.querySelector('[data-output-box]').outerHTML)}));
const steps = (from, to, by = 0.05) => Array.from({length: Math.round((to - from) / by) + 1}, (_, n) => Number((from + n * by).toFixed(2)));

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

test('mask: readable words are coherent illustrative aliases, and a role belongs to its token, not to a slot', t => {
  const f = fixture(t, NAME), fx = declared(f);
  const aliases = f.root.dataset.tokenLabels.split('|');
  assert.deepEqual(aliases, ['[PAD]', 'Explain', ':', 'why', 'birds', 'can', 'fly', 'how', 'planes', 'also']);
  const prose = f.root.textContent;
  assert.match(prose, /illustrative (?:word )?(?:aliases|labels)/i);
  assert.match(prose, /not.*tokenizer.*decod/i);
  f.load(); f.open();
  for (const time of [0,5,7.2,9,10,15,16.4,20,26,32,36,40]) {
    f.seek(time);
    assert.equal(f.root.querySelectorAll('[data-token-slot]').length, 12, 'six scored predictors per sequence; no unused final output');
    assert.equal(f.root.querySelectorAll('[data-shifted-target]').length, 12, 'six shifted targets per sequence, including excluded padding');
    for (let b=0;b<2;b++) for (let i=0;i<6;i++) {
      const slot = input(f, b, i), target = copy(f, b, i + 1);
      assert.equal(Number(slot.querySelector('[data-token]').dataset.token), fx.tokens[b][i]);
      assert.equal(slot.querySelector('[data-token-label]').textContent, aliases[fx.tokens[b][i]]);
      assert.equal(slot.querySelector('[data-role]').textContent, roleOf(fx.masks[b], i));
      assert.equal(Number(target.querySelector('[data-target-token]').dataset.targetToken), fx.tokens[b][i + 1]);
      assert.equal(target.querySelector('[data-target-label]').textContent, aliases[fx.tokens[b][i + 1]]);
      assert.equal(Number(target.dataset.underSlot), i, 'token i + 1 is the target of slot i');
      // The role printed on a target is the role of the token it copies (mask[i + 1]), never of the slot above it.
      assert.equal(target.querySelector('[data-role]').textContent, roleOf(fx.masks[b], i + 1));
      assert.equal(target.querySelector('[data-role]').parentNode, target, 'word and role are one travelling group');
      assert(!slot.contains(target), 'a target is a separate supervised role, not a label on the input');
      const gate = target.querySelector(`[data-target-mask="${b}:${i + 1}"]`);
      assert(gate, 'the mask belongs visibly to the shifted target');
      assert.equal(gate.textContent.replace(/\s/g, ''), `×${fx.masks[b][i + 1]}`);
      assert.equal(gate.textContent.includes('1'), target.querySelector('[data-role]').textContent === 'response',
        'a gate is open exactly where the travelling role says response');
    }
  }
  assert.equal(copy(f, 0, 6).querySelector('[data-role]').textContent, 'padding');
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

// ---- Value redesign, September 18, 2026: the shift is the motion ------------------------------

test('mask: the targets are built by copying the token cards and sliding the copy one slot left', t => {
  for (const b of [0, 1]) {
    const f = fixture(t, NAME, {width: 713}), fx = declared(f); f.load(); f.open();
    const aliases = f.root.dataset.tokenLabels.split('|');
    // Sequence A copies at the slide beat; sequence B arrives already copied at its own beat.
    const [before, copied, from, to, still] = b ? [null, 15, 15, 17.3, 17.3] : [4.9, 6.3, 6.3, 8, 9.9];
    if (before !== null) {
      f.seek(before);
      assert(!visible(f.$(`[data-tape="${b}"]`)), 'no copy exists while the reader is only asked the question');
      assert.equal(f.root.dataset.tape, 'none');
    }
    // Copied: every copy sits exactly under the token it copies, carrying that token's word and role.
    f.seek(copied);
    assert.equal(f.root.dataset.tape, 'copied');
    const pitch = centre(input(f, b, 1)).x - centre(input(f, b, 0)).x;
    assert(pitch > 60);
    const under = k => k ? copy(f, b, k) : leaving(f, b, 0);
    for (let k = 0; k < 6; k++) {
      const original = input(f, b, k), ghost = under(k);
      assert(visible(ghost), `copy ${k} is on the picture`);
      assert.equal(centre(ghost).x, centre(original).x, `copy ${k} starts under its own token`);
      assert(centre(ghost).y > centre(original).y + 80, 'the copy row lies below the outputs');
      assert.deepEqual([...ghost.querySelectorAll('text')].filter(visible).map(n => n.textContent),
        [aliases[fx.tokens[b][k]], roleOf(fx.masks[b], k)], 'a copy is the word and its role tag, nothing else yet');
      assert.match(ghost.querySelector('rect').getAttribute('class'), /mp-ghost-box/, 'a ghost of the blue card, not yet a target');
    }
    assert(!visible(copy(f, b, 6)), 'the padding token has no input slot to be copied under; it enters during the slide');
    // The slide: one rigid group, monotonically leftward, by exactly one column pitch, without a jump.
    const start = Array.from({length: 6}, (_, k) => centre(under(k)));
    let previous = 0, moved = 0;
    for (const time of steps(from, to)) {
      f.seek(time);
      const offsets = Array.from({length: 6}, (_, k) => centre(under(k)).x - start[k].x);
      for (const offset of offsets) assert(Math.abs(offset - offsets[0]) < 1e-3, `the copy moves as one tape at ${time}s`);
      for (let k = 0; k < 6; k++) assert.equal(centre(under(k)).y, start[k].y, 'the slide is horizontal');
      assert(offsets[0] <= previous + 1e-9, `the tape never moves right (${time}s)`);
      assert(previous - offsets[0] < 12, `the tape jumps ${(previous - offsets[0]).toFixed(1)} px at ${time}s`);
      if (offsets[0] < previous) moved++;
      previous = offsets[0];
      const pad = copy(f, b, 6);
      if (visible(pad)) assert(Math.abs(centre(pad).x - centre(copy(f, b, 5)).x - pitch) < 1e-3, 'padding rides the same tape, one slot behind');
      assert.equal(f.root.dataset.tape, offsets[0] === 0 ? 'copied' : Math.abs(offsets[0] + pitch) < 1e-3 ? 'slid' : 'sliding');
    }
    assert(Math.abs(previous + pitch) < 1e-3, `the slide is exactly one slot: ${previous} vs ${-pitch}`);
    assert(moved >= 12, `the slide is a motion over many frames, not a cut (${moved} distinct steps)`);
    // Slid and still: copy k now sits under slot k − 1; the first token fell off, padding came in.
    f.seek(still);
    for (let k = 1; k <= 6; k++) {
      assert(visible(copy(f, b, k)));
      assert(Math.abs(centre(copy(f, b, k)).x - centre(input(f, b, k - 1)).x) < 1e-3, `copy ${k} rests under slot ${k - 1}`);
      assert.equal(centre(copy(f, b, k)).opacity, 1);
    }
    assert(!visible(leaving(f, b, 0)), 'the first token has fallen off the left end');
    // The point of the scene: a response-tagged target under a prompt-tagged input.
    const last = fx.masks[b].indexOf(1) - 1;
    assert.equal(input(f, b, last).querySelector('[data-role]').textContent, 'prompt');
    assert.equal(copy(f, b, last + 1).querySelector('[data-role]').textContent, 'response');
    assert(Math.abs(centre(copy(f, b, last + 1)).x - centre(input(f, b, last)).x) < 1e-3);
    assert.equal(f.root.dataset.tape, 'slid');
    // Only after the slide do the copies take the target colour, the row its name, and the gates appear.
    assert(visible(f.$('[data-row-label="copy"]')) && !visible(f.$('[data-row-label="target"]')));
    for (let k = 1; k <= 6; k++) assert(!visible(copy(f, b, k).querySelector('[data-target-mask]')));
    f.seek(b ? 18 : 10);
    assert.equal(f.root.dataset.tape, 'targets');
    assert(!visible(f.$('[data-row-label="copy"]')) && visible(f.$('[data-row-label="target"]')));
    for (let k = 1; k <= 6; k++) {
      assert.match(copy(f, b, k).querySelector('rect').getAttribute('class'), /mp-target-box/);
      assert.match(copy(f, b, k).querySelector('[data-target-label]').getAttribute('class'), /mp-target/);
      assert(visible(copy(f, b, k).querySelector('[data-target-mask]')));
    }
  }
});

test('mask: the slid copy holds still for at least two seconds before anything is gated', t => {
  for (const width of [713, 296]) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    const stills = new Map();
    for (const time of steps(5, 10)) { f.seek(time); if (f.root.dataset.tape === 'slid') stills.set(time, withoutPacket(f)); }
    const times = [...stills.keys()];
    assert(times.at(-1) - times[0] >= 2, `the slid copy stands ${(times.at(-1) - times[0]).toFixed(2)}s before the reveal`);
    assert(times.at(-1) >= 9.9, 'and it stands until the reveal beat');
    assert.equal(new Set(stills.values()).size, 1, 'nothing at all moves while the reader looks at the slid copy');
    f.seek(times[0]); assert.equal(packet(f).at, 'input', 'the marker waits too');
  }
});

test('mask: the prediction is never spoiled — gates, rail, colours, counts, formula and spoken text wait for the reveal', t => {
  for (const width of [713, 296]) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    for (const time of steps(0, 9.95)) {
      f.seek(time);
      const where = `${time}s at ${width}px`;
      for (const node of f.root.querySelectorAll('[data-target-mask], [data-score-rail], [data-next-route], [data-gate-end], .mp-target-wire'))
        assert(!visible(node), `${node.getAttribute('class')} is drawn at ${where}`);
      for (const name of ['count-a', 'count-b', 'change']) assert(!visible(f.$(`[data-value="${name}"]`)), `${name} at ${where}`);
      assert.equal(f.root.querySelectorAll('.mp-gated').length, 0, `excluded branches are muted at ${where}`);
      assert.equal(f.root.querySelectorAll('[data-drawing] .mp-target-box').length, 0, `a copy is already target-coloured at ${where}`);
      assert(!f.$('[data-formula]').classList.contains('mp-shown'), `the formula shows its i+1 at ${where}`);
      assert(!/three|four|zero|neither|counts because|is scored|×|open gate|rides on/i.test(spoken(f)), `the answer is spoken at ${where}: ${spoken(f)}`);
      assert.equal(packet(f).at, 'input', 'the marker does not set off before the reveal');
    }
    f.seek(10);
    assert(visible(f.$('[data-value="count-a"]'))); assert(!visible(f.$('[data-value="count-b"]')));
    assert.equal(f.$('[data-value="count-a"]').textContent, 'A: 3');
    assert(visible(f.$('[data-score-rail="0"]')) && visible(f.$('[data-target-mask="0:3"]')));
    assert(f.$('[data-formula]').classList.contains('mp-shown') && f.$('[data-formula]').classList.contains('mp-next-lit'));
    // Sequence B earns its count when its own gates appear, after its own slide.
    for (const time of [15, 16.4, 17.2]) { f.seek(time); assert(!visible(f.$('[data-value="count-b"]')), `B: 4 at ${time}s`); assert(visible(f.$('[data-value="count-a"]'))); }
    for (const time of [18, 20, 40]) { f.seek(time); assert(visible(f.$('[data-value="count-b"]'))); }
    assert.equal(f.$('[data-value="count-b"]').textContent, 'B: 4');
    f.seek(25.9); assert(!visible(f.$('[data-value="change"]'))); assert.equal(f.root.dataset.scoreChange, 'unrevealed');
    assert(!/neither/i.test(spoken(f)));
    f.seek(26); assert(visible(f.$('[data-value="change"]'))); assert.equal(f.root.dataset.scoreChange, '0');
    assert.match(f.$('[data-caption]').textContent, /Neither sequence score changes/);
  }
});

test('mask: the scored predictor set moves with the response boundary — same slide, one slot earlier', t => {
  const f = fixture(t, NAME, {width: 713}), fx = declared(f); f.load(); f.open();
  const open = b => Array.from({length: 6}, (_, i) => i).filter(i => {
    const target = copy(f, b, i + 1), gate = target.querySelector('[data-target-mask]');
    // Read off the picture: an open gate that is drawn, on a target resting under slot i.
    return visible(gate) && gate.textContent.includes('1') && Math.abs(centre(target).x - centre(input(f, b, i)).x) < 1e-3;
  });
  f.seek(14); assert.deepEqual(open(0), predicted(fx.masks[0])); assert.deepEqual(open(0), [2,3,4]);
  f.seek(15); assert.deepEqual(open(1), [], 'sequence B starts ungated, its copy not yet slid');
  assert.equal(f.root.dataset.tape, 'copied');
  f.seek(19); assert.deepEqual(open(1), predicted(fx.masks[1])); assert.deepEqual(open(1), [1,2,3,4]);
  assert.equal(copy(f, 1, 1).querySelector('[data-role]').textContent, 'prompt', 'slot 0 still predicts a prompt token');
  assert.equal(copy(f, 1, 1).querySelector('[data-target-mask]').textContent.replace(/\s/g, ''), '×0');
});

test('mask: on the phone wrap the copy that leaves strip 2 by the left is the one that enters strip 1 on the right', t => {
  const f = fixture(t, NAME, {width: 296}), fx = declared(f); f.load(); f.open();
  assert.equal(f.root.dataset.layout, 'narrow');
  const cue = f.$('[data-wrap-cue]');
  for (const [b, from, to, still] of [[0, 6.3, 8, 9], [1, 15, 17.3, 17.3]]) {
    f.seek(from);
    const word = f.root.dataset.tokenLabels.split('|')[fx.tokens[b][3]];
    const out = leaving(f, b, 3), into = copy(f, b, 3);
    assert(visible(out) && !visible(into), 'before the slide token 3’s copy sits under slot 3, in the second strip');
    assert.equal(centre(out).x, centre(input(f, b, 3)).x);
    assert(centre(out).y > centre(input(f, b, 3)).y);
    const pitch = centre(input(f, b, 1)).x - centre(input(f, b, 0)).x, start = centre(out).x;
    let seenBoth = 0;
    for (const time of steps(from, to)) {
      f.seek(time);
      if (f.root.dataset.tape !== 'sliding') continue;
      assert(visible(out) && visible(into), `both halves of the hand-off are drawn at ${time}s`);
      seenBoth++;
      for (const twin of [out, into]) assert.deepEqual([...twin.querySelectorAll('text')].filter(visible).map(n => n.textContent),
        [word, 'response'], 'the two halves are the same token with the same role');
      const a = centre(out), z = centre(into), done = (start - a.x) / pitch;
      assert(Math.abs(a.opacity + z.opacity - 1) < 1e-3, 'one fades out exactly as the other fades in');
      assert(Math.abs(z.opacity - done) < 1e-3, 'opacity follows the slide itself');
      // Same leftward motion in both strips: the arriving half is one pitch right of slot 2 minus the same offset.
      assert(Math.abs((centre(input(f, b, 2)).x + pitch - z.x) - (start - a.x)) < 1e-3);
      assert(z.y < a.y - 150, 'the arriving half is in the first strip, the leaving half in the second');
      assert(visible(cue), 'the return path is drawn while the hand-off happens');
    }
    assert(seenBoth >= 10);
    f.seek(still);
    assert(!visible(out), 'the leaving half is gone');
    assert(Math.abs(centre(into).x - centre(input(f, b, 2)).x) < 1e-3, 'token 3’s copy rests under slot 2, at the right end of strip 1');
    assert(Math.abs(centre(copy(f, b, 4)).x - centre(input(f, b, 3)).x) < 1e-3, 'and token 4’s under slot 3, at the left end of strip 2');
    assert(!visible(leaving(f, b, 0)));
  }
  // The return path: from the left end of strip 2's copy row to the right end of strip 1's, through free channels.
  f.seek(9);
  assert(visible(cue));
  const d = numbers(cue.querySelector('.mp-wrap').getAttribute('d').replace(/[A-Za-z]/g, ' '));
  const [x0, y0, xl, gap, xr, y1, xEnd] = d;
  const first = box(copy(f, 0, 4).querySelector('rect')), lastCard = box(copy(f, 0, 3).querySelector('rect'));
  assert(y0 > first.y && y0 < first.y + first.height && x0 <= first.x, 'it starts beside the first card of strip 2');
  assert(y1 > lastCard.y && y1 < lastCard.y + lastCard.height && xEnd >= lastCard.x + lastCard.width, 'it ends beside the last card of strip 1');
  assert(xl < first.x - 3 && xl > 20 + 0.6 * 12 * 'input'.length / 2, 'the left channel lies between the gutter labels and the cards');
  assert(xr > lastCard.x + lastCard.width + 3 && xr < 296 - 2, 'the right channel lies between the cards and the edge');
  const secondStrip = Number(f.$('[data-slot-number="3"]').getAttribute('y')) - 12;
  assert(gap > railY(f, 0) + 3 && gap < secondStrip - 2, 'the crossing lies between the strips');
  assert(y1 < y0);
  for (const time of [0, 5, 10, 14, 18, 26, 40]) { f.seek(time); assert(!visible(cue) || ['copying','copied','sliding','slid'].includes(f.root.dataset.tape)); }
  f.seek(14); assert(!visible(cue), 'gone once the targets are gated');
  // One strip needs no hand-off.
  f.resize(713);
  for (const time of steps(0, 40, 0.5)) { f.seek(time); assert(!visible(cue)); assert(!visible(leaving(f, 0, 3)) && !visible(leaving(f, 1, 3))); }
});

test('mask: perturbation changes excluded symbolic outputs only; inputs and included outputs remain fixed', t => {
  const f = fixture(t, NAME), fx = declared(f); f.load(); f.open(); f.seek(19);
  const before = outputs(f);
  const tokensShown = () => [...f.root.querySelectorAll('[data-token-slot]')].map(n => ({
    id: n.querySelector('[data-token]').dataset.token, label: n.querySelector('[data-token-label]').textContent}));
  const targetsShown = () => [...f.root.querySelectorAll('[data-shifted-target]')].map(n => canonicalMarkup(n.outerHTML));
  const originalInputs = tokensShown(), originalTargets = targetsShown();
  let changed = false;
  for (let time=20;time<32;time+=0.25) {
    f.seek(time);
    assert.deepEqual(tokensShown(), originalInputs);
    assert.deepEqual(targetsShown(), originalTargets, 'targets, roles and gates stay exactly as they were');
  }
  for (let time=20;time<=40;time+=0.25) {
    f.seek(time);
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

test('mask: a value is announced once — the picture label and scrubber never repeat the caption or its counts', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (const time of [0,5,7.2,9,10,15,16.4,18,20,26,32,36,40]) {
    f.seek(time);
    const label = f.$('[data-figure] svg').getAttribute('aria-label');
    const valuetext = f.$('[data-controls] input[type=range]').getAttribute('aria-valuetext');
    const caption = f.$('[data-caption]').textContent.trim();
    assert(!label.includes(caption), `the picture label repeats the caption at ${time}s`);
    for (const text of [label, valuetext]) assert.doesNotMatch(text, /three|four|zero|\b[034]\b.*(target|change)/i, text);
    assert.match(label, /^Sequence [AB]: /);
  }
  // The scrubber says where the copy is, so the slide is not silent for a reader who cannot see it.
  const said = time => (f.seek(time), f.$('[data-controls] input[type=range]').getAttribute('aria-valuetext'));
  assert.match(said(5.5), /copy dropping/); assert.match(said(6.3), /copy under the inputs/);
  assert.match(said(7.2), /copy sliding left/); assert.match(said(9), /copy one slot left/);
  assert.doesNotMatch(said(2), /copy/); assert.doesNotMatch(said(12), /copy/);
});

test('mask: input and target rows align column by column and wrap to two narrow strips', t => {
  const f = fixture(t, NAME); f.load(); f.open(); f.seek(36);
  let narrowHeight, wideHeight;
  for (const width of [240,296,360,519,520,553,713]) {
    f.resize(width);
    const svg=f.$('[data-figure] svg'), view=numbers(svg.getAttribute('viewBox'));
    assert.equal(view[2], width);
    for (const node of [...f.root.querySelectorAll('[data-token-slot] rect, [data-shifted-target] rect')].filter(visible)) {
      const b = box(node);
      assert(b.x >= 0 && b.x + b.width <= width, `a card leaves the ${width}px picture`);
      assert(b.y >= 0 && b.y + b.height <= view[3]);
    }
    for (const node of f.root.querySelectorAll('.mp-wire')) assert(Number(node.getAttribute('y2')) > Number(node.getAttribute('y1')));
    for (const node of f.root.querySelectorAll('.mp-target-wire')) assert(Number(node.getAttribute('y2')) < Number(node.getAttribute('y1')));
    for (const route of f.root.querySelectorAll('[data-next-route]')) {
      const commands = route.getAttribute('d').match(/[A-Za-z]/g);
      assert(commands.every(command => ['M','L','H','V'].includes(command)), 'a dogleg passes output to its gate, never curves back into an input');
    }
    const top = Array.from({length:6}, (_,i) => box(input(f, 0, i).querySelector('rect')).y);
    for (let b=0;b<2;b++) for (let i=0;i<6;i++) {
      const card=box(input(f, b, i).querySelector('rect')), target=box(copy(f, b, i + 1).querySelector('rect'));
      const out=box(f.$(`[data-output-box="${b}:${i}"]`));
      assert(Math.abs(card.x - target.x) < 1e-3 && card.width === target.width, 'a target sits squarely under its predictor’s input');
      assert(card.y + card.height < out.y && out.y + out.height < target.y, 'input above output above target');
      assert(target.y + target.height < railY(f, width < 520 && i >= 3 ? 1 : 0), 'the rail runs under the targets');
    }
    if (width < 520) {
      narrowHeight=view[3];
      assert.equal(new Set(top.slice(0,3)).size,1);
      assert.equal(new Set(top.slice(3)).size,1);
      assert(top[3] > top[0], 'phone layout reflows three columns per strip, not a shrunken six-column slide');
    } else {
      wideHeight=view[3];
      assert.equal(new Set(top).size,1);
    }
    for (const node of f.root.querySelectorAll('[data-drawing] text')) assert(Number(node.getAttribute('font-size')) >= 12);
    assert.equal(svg.getAttribute('preserveAspectRatio'),'xMinYMin meet');
  }
  assert(narrowHeight > wideHeight);
});

test('mask: returning from resize and arbitrary scrubbing restores the same picture, mid-slide included', t => {
  for (const time of [7.2, 16.4, 23.4]) {
    const f=fixture(t,NAME); f.load(); f.open(); f.seek(time); const original=picture(f);
    f.seek(39); f.resize(296); f.seek(2); f.seek(time); const phone=picture(f);
    f.resize(713);
    assert.equal(picture(f),original);
    assert.notEqual(phone,original);
    f.resize(296); assert.equal(picture(f),phone);
  }
});

test('mask: one tracked marker carries the answer — input, output, route, ×1 gate, score — and the contrast stops at ×0', t => {
  const f = fixture(t, NAME, {width: 713}); f.load(); f.open();
  assert.equal(f.root.querySelectorAll('[data-packet]').length, 1, 'one tracked marker');
  assert.equal(f.root.querySelectorAll('[data-focus-pair], [data-moving-pair]').length, 0, 'the old box-and-dot focus is gone');
  const why = box(input(f, 0, 2).querySelector('rect')), out = box(f.$('[data-output-box="0:2"]'));
  // Through the question, the slide and its still moment it rests under the last prompt slot's input.
  for (const time of [0, 2, 5, 7.2, 9, 10, 10.4]) {
    f.seek(time); const p = packet(f);
    assert(visible(p.node)); assert.equal(p.slot, '0:2'); assert.equal(p.at, 'input');
    assert.equal(p.x, why.x + why.width / 2);
    assert(p.y - 7.6 > why.y + why.height && p.y + 7.6 < out.y, 'between the input card and its output, touching neither');
  }
  f.seek(14); const birds = box(copy(f, 0, 3).querySelector('rect'));
  assert.equal(copy(f, 0, 3).querySelector('[data-target-label]').textContent, 'birds');
  // After the reveal it sets off: beside the output it sits on the route, right of the box.
  f.seek(11.1); let p = packet(f);
  assert.equal(p.at, 'output'); assert(p.x > out.x + out.width); assert(p.y > out.y && p.y < out.y + out.height);
  // Parked at the gate of the shifted target "birds", not yet in the score.
  f.seek(12.4); p = packet(f);
  assert.equal(p.at, 'gate'); assert.equal(p.state, 'carried');
  assert(p.y > birds.y && p.y < birds.y + birds.height); assert(Math.abs(p.x - (birds.x + birds.width)) < 12);
  assert.equal(f.$('[data-target-mask="0:3"]').textContent.replace(/\s/g, ''), '×1');
  // Then through the open gate and down onto the score rail, where it holds two seconds until the cut.
  for (const time of [13, 14.9]) {
    f.seek(time); p = packet(f);
    assert.equal(p.at, 'score'); assert.equal(p.y, railY(f));
    assert(p.x > birds.x && p.x < birds.x + birds.width, 'it lands under the target it scored');
  }
  // Contrast, sequence B: the same marker, taken from prompt slot 0, stops at its ×0 gate.
  f.seek(15); p = packet(f); assert.equal(p.slot, '1:0'); assert.equal(p.at, 'input');
  f.seek(20); p = packet(f); assert.equal(p.at, 'output');
  assert.equal(f.$('[data-output-symbol="1:0"]').textContent, 'changed', 'it carries a changed output');
  for (let time = 15; time < 32; time += 0.25) {
    f.seek(time); p = packet(f);
    assert(p.y < railY(f) - 20, `an excluded output must never reach the score rail (${time}s)`);
    assert.equal(p.state, time >= 26 ? 'blocked' : 'carried');
    assert.equal(visible(p.node.querySelector('.mp-packet-core')), time < 26, 'blocked is a shape change, not a colour');
  }
  f.seek(26); p = packet(f); const colon = box(copy(f, 1, 1).querySelector('rect'));
  assert.equal(p.at, 'gate'); assert(p.y > colon.y && p.y < colon.y + colon.height);
  assert.equal(f.$('[data-target-mask="1:1"]').textContent.replace(/\s/g, ''), '×0');
  // Replay on sequence A: from the last prompt predictor's output straight through to the score.
  f.seek(32); p = packet(f); assert.equal(p.slot, '0:2'); assert.equal(p.at, 'output');
  for (const time of [36, 40]) { f.seek(time); p = packet(f); assert.equal(p.at, 'score'); assert.equal(p.y, railY(f)); }
});

test('mask: marker and tape never jump, never move together, and nothing else moves inside a beat', t => {
  for (const width of [713, 296]) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    const beats = f.$('[data-pane]').dataset.beats.split(/\s+/).map(Number);
    const tapeState = () => [...f.root.querySelectorAll('[data-tape] > g')].map(g => `${g.getAttribute('transform')}|${g.getAttribute('opacity')}`).join(';');
    let travelled = 0, previous = null, previousTape = null;
    for (const time of steps(0, 40)) {
      f.seek(time); const p = packet(f), tape = tapeState();
      const cut = time === 15 || time === 32; // the whole picture changes sequence at these two beats
      if (previous && !cut) {
        const hop = Math.hypot(p.x - previous.x, p.y - previous.y);
        assert(hop < 8, `the marker jumps ${hop.toFixed(1)} px at ${time}s (${width}px)`);
        travelled += hop;
        // One thing moves at a time: while the copy drops or slides, the marker waits.
        assert(!(hop > 0 && tape !== previousTape), `marker and tape both move at ${time}s`);
      }
      previous = p; previousTape = tape;
    }
    assert(travelled > 300, `the marker travels ${travelled.toFixed(0)} px in all`);
    // Inside each beat the scenery is still. Beats 1 and 3 hold the slide; apart from the tape itself they
    // change once (the copy row is named when it appears; sequence B's gates appear after its slide).
    for (let index = 0; index < beats.length; index++) {
      const end = index + 1 < beats.length ? beats[index + 1] : 40, stills = new Set(), sliding = index === 1 || index === 3;
      for (let time = beats[index]; time < end - 1e-9; time += 0.1) { f.seek(Number(time.toFixed(2))); stills.add(withoutPacket(f, sliding)); }
      assert.equal(stills.size, sliding ? 2 : 1, `scenery takes ${stills.size} states inside the beat starting at ${beats[index]}s`);
    }
    // An arrow-key seek parks on a finished picture: at every beat the marker rests and the tape is at rest.
    for (const beat of [...beats, 40]) {
      f.seek(beat); assert.notEqual(packet(f).at, 'moving', `mid-glide at the ${beat}s beat`);
      assert(['none','copied','targets'].includes(f.root.dataset.tape), `the tape is mid-motion at the ${beat}s beat`);
    }
  }
});

test('mask: reduced motion shows one finished still per beat, and each still is what its caption says', t => {
  for (const width of [713, 296]) {
    const moving = fixture(t, NAME, {width}), still = fixture(t, NAME, {width, reduced: true});
    for (const f of [moving, still]) { f.load(); f.open(); }
    const beats = moving.$('[data-pane]').dataset.beats.split(/\s+/).map(Number);
    const expected = [['input','none'], ['input','slid'], ['score','targets'], ['input','targets'],
      ['output','targets'], ['gate','targets'], ['output','targets'], ['score','targets']];
    beats.forEach((beat, index) => {
      const end = index + 1 < beats.length ? beats[index + 1] : 40;
      still.seek(beat); const shown = withoutPacket(still), p = packet(still);
      assert.deepEqual([p.at, still.root.dataset.tape], expected[index], `the ${beat}s still`);
      // The same still across the beat, and it is a frame the full-motion timeline really passes through at rest.
      for (const time of [beat + 1.3, end - 0.05]) { still.seek(time); assert.equal(withoutPacket(still), shown); assert.deepEqual(packet(still), {...p, node: packet(still).node}); }
      const match = steps(beat, end - 0.1, 0.1).find(time => { moving.seek(time); return withoutPacket(moving) === shown && packet(moving).x === p.x && packet(moving).y === p.y; });
      assert(match !== undefined, `the ${beat}s still is not a frame of its own beat`);
    });
    // Beat 1's caption says the copy has been slid one slot left: the still shows exactly that, ungated.
    still.seek(5);
    assert.match(still.$('[data-caption]').textContent, /slid one slot left/);
    assert(Math.abs(centre(copy(still, 0, 3)).x - centre(input(still, 0, 2)).x) < 1e-3, '“birds” under slot 2');
    assert(!visible(copy(still, 0, 3).querySelector('[data-target-mask]')) && !visible(still.$('[data-score-rail="0"]')));
    assert(!/three|four|zero|neither|counts because|is scored|×/i.test(spoken(still)));
    // Beat 3's caption names four scored targets: the still shows sequence B slid and gated.
    still.seek(15);
    assert.match(still.$('[data-caption]').textContent, /four targets/);
    assert(visible(still.$('[data-value="count-b"]')) && visible(copy(still, 1, 2).querySelector('[data-target-mask]')));
  }
});

test('mask: the picture carries labels only; captions name the slide and the prefix sentence stays in the boundary', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (const width of [713, 296]) {
    f.resize(width);
    for (const time of [0,5,7.2,9,10,15,16.4,20,26,32,36,40]) {
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
  assert.match(f.$('[data-caption]').textContent, /copy of the tokens slid one slot left, roles attached/);
  assert.match(f.$('.mechanism-boundary > p').textContent, /entire prefix through slot/);
  f.seek(10);
  assert.match(f.$('[data-caption]').textContent, /mask rides on the target/);
  for (const time of [0,5,10,15,20,26,32,36]) {
    f.seek(time);
    assert.doesNotMatch(spoken(f), /-\s?\d/, 'a hyphen-minus is never a minus sign');
  }
  // The intro above the pane is visible beside the question: it must not answer it either.
  assert.doesNotMatch(f.$('.mechanism-intro').textContent, /×|selects|scored|counts/);
  // The static prints carry no sentence either.
  const panel = read('mask-predictor/panel.html');
  assert(!/Each output uses the prefix/.test(panel));
  // The drawing device is declared where the grammar puts such notes: in the closed scope disclosure.
  assert.match(f.$('.mechanism-scope').textContent, /drawing device.*token_ids\[:, 1:\].*response_mask\[:, 1:\]/s);
  assert.equal(f.$('.mechanism-scope').open, false);
  assert.equal(f.root.querySelectorAll('.mechanism-boundary > p').length, 1, 'one visible lead sentence');
});

test('mask: the closing transfer check is closed, asks without answering, and its answer states the rule', t => {
  const f = fixture(t, NAME), check = f.$('details.mechanism-check');
  assert(check && !check.open, 'the answer is hidden until asked for');
  assert.equal(f.root.querySelectorAll('details.mechanism-check').length, 1);
  const question = check.querySelector('summary').textContent, answer = check.querySelector('p').textContent;
  // The question is visible beside the unplayed scene: it must not settle the scene's own prediction.
  assert.doesNotMatch(question, /×|is scored|rides on|one slot before|counts/);
  assert.match(answer, /mask rides on the target/); assert.match(answer, /one slot before its response target/);
  assert.doesNotMatch(question + answer, /\d-\d|(?<![\w.])-\d/, 'no ASCII minus');
});

test('mask: gates are neutral operators told apart by shape; wine is not used; ghosts are blue, targets purple', t => {
  const css = read('mask-predictor/player.css');
  assert(!/#722f37|mp-error/i.test(css), 'wine means loss or error; neither a ×0 gate nor a zero change is one');
  assert(!/mp-error|#722f37/i.test(read('mask-predictor/player.js') + read('mask-predictor/panel.html')));
  assert.match(css, /\.mp-ink, \.mask-predictor-figure \.mp-gate \{ fill:var\(--mp-ink\); \}/);
  assert.match(css, /\.mp-excluded \.mp-gate \{ fill:var\(--mp-scenery\); \}/);
  assert.match(css, /--mp-input:#2b6cb0;/); assert.match(css, /--mp-target:#805ad5;/);
  assert.match(css, /\.mp-ghost-box \{[^}]*stroke:var\(--mp-input\)[^}]*stroke-dasharray/);
  assert.match(css, /\.mp-ghost \{ fill:var\(--mp-input\); \}/);
  assert.match(css, /\.mp-target-box \{[^}]*stroke:var\(--mp-target\)/);
  assert.match(css, /\.mp-role \{ fill:var\(--mp-scenery\); \}/, 'a role tag is a neutral label');
  assert.match(css, /\.mp-wrap \{[^}]*stroke:var\(--mp-ink\)/, 'a drawing device is emphasis ink');
  // Muting is scoped to a gated row, so an ungated picture cannot leak which outputs are excluded.
  for (const rule of css.replace(/\/\*[\s\S]*?\*\//g, '').match(/[^{}]*\.mp-excluded[^{}]*\{/g)) for (const selector of rule.replace('{', '').split(','))
    assert.match(selector, /\.mp-gated \.mp-excluded/, `${selector.trim()} mutes before the gates are drawn`);
  const f = fixture(t, NAME, {width: 713}), fx = declared(f); f.load(); f.open(); f.seek(40);
  assert.equal(f.$('[data-value="change"]').getAttribute('class'), 'mp-ink');
  for (const width of [713, 296]) {
    f.resize(width);
    for (const node of f.root.querySelectorAll('[data-predictor]')) {
      const [b, i] = node.dataset.predictor.split(':').map(Number), open = Boolean(fx.masks[b][i + 1]);
      const end = f.$(`[data-route="${b}:${i}"] [data-gate-end]`), route = f.$(`[data-next-route="${b}:${i}"]`).getAttribute('d');
      const rail = railY(f, width < 520 && i >= 3 ? 1 : 0), target = box(copy(f, b, i + 1).querySelector('rect'));
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

// JSDOM lays nothing out, so a label's box is estimated the way the other suites do it: an advance
// per glyph class at the label's font size, read off the browser preview and rounded up (narrow
// glyphs and a space 0.3 em; r, t, f 0.4; capitals 0.72; m, w 0.86; everything else 0.58; semibold a
// little wider), spanning baseline − 0.72 s … baseline + 0.22 s. The gutter is 44 px, so the flat
// 0.6 em other suites use would reject labels that visibly fit.
const advance = text => [...text].reduce((sum, ch) => sum + (/[ijl.:()\[\]| ]/.test(ch) ? 0.3 : /[rtf]/.test(ch) ? 0.4
  : /[A-Z]/.test(ch) ? 0.72 : /[mw]/.test(ch) ? 0.86 : 0.58), 0);
function textBox(node) {
  const [dx, dy] = shift(node), size = Number(node.getAttribute('font-size'));
  const heavy = /mp-role-response/.test(node.getAttribute('class') || '') ? 1.06 : 1;
  const w = advance(node.textContent) * size * heavy, x = Number(node.getAttribute('x') || 0) + dx, y = Number(node.getAttribute('y') || 0) + dy;
  const anchor = node.getAttribute('text-anchor'), x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  return {text: node.textContent, x0, x1: x0 + w, y0: y - 0.72 * size, y1: y + 0.22 * size};
}
const overlap = (a, b, margin = 0) => a.x0 < b.x1 + margin && b.x0 < a.x1 + margin && a.y0 < b.y1 + margin && b.y0 < a.y1 + margin;

test('mask: labels collide with nothing — not each other, a card edge, a route, the marker or the picture edge', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  // Rest times only: mid-slide a copy is deliberately cut by the strip's bezel.
  const times = [0, 6.3, 9, 10, 12.4, 14, 15, 18, 20, 26, 32, 40];
  for (const width of [296, 302, 360, 519, 520, 640, 713]) {
    f.resize(width);
    const height = numbers(f.$('[data-figure] svg').getAttribute('viewBox'))[3];
    for (const time of times) {
      f.seek(time);
      const where = `${time}s at ${width}px`;
      const texts = [...f.$('[data-drawing]').querySelectorAll('text')].filter(node => visible(node) && node.textContent).map(textBox);
      for (const label of texts) assert(label.x0 >= 0 && label.x1 <= width && label.y0 >= 0 && label.y1 <= height, `"${label.text}" leaves the picture, ${where}`);
      for (let a = 0; a < texts.length; a++) for (let b = a + 1; b < texts.length; b++)
        assert(!overlap(texts[a], texts[b]), `"${texts[a].text}" overlaps "${texts[b].text}", ${where}`);
      // Words and role tags stay inside their own card; nothing else's text enters a card.
      for (const group of [...f.root.querySelectorAll('[data-token-slot], [data-shifted-target], [data-leaving-copy]')].filter(visible)) {
        const card = box(group.querySelector('rect'));
        for (const node of [...group.querySelectorAll('text')].filter(visible)) {
          const label = textBox(node);
          assert(label.x0 >= card.x + 1 && label.x1 <= card.x + card.width - 1 && label.y0 >= card.y && label.y1 <= card.y + card.height,
            `"${label.text}" does not fit its card, ${where}`);
        }
      }
      // Gutter labels stop short of the strip's bezel, where a leaving copy is cut off.
      const firstCard = box(input(f, f.root.dataset.sequence === 'A' ? 0 : 1, 0).querySelector('rect'));
      for (const node of [...f.root.querySelectorAll('[data-row-label]')].filter(visible))
        assert(textBox(node).x1 <= firstCard.x - 8, `"${node.textContent}" runs into the first column, ${where}`);
      // Routes and stop bars: every horizontal or vertical run clears every label by 2 px.
      for (const route of [...f.root.querySelectorAll('[data-next-route], [data-gate-end="stop"]')].filter(visible)) {
        const c = route.getAttribute('d').match(/[MHV]\s*[\d.\s]+/g).map(s => [s[0], ...numbers(s.slice(1))]);
        let x = 0, y = 0;
        for (const [command, a, b2] of c) {
          const [nx, ny] = command === 'M' ? [a, b2] : command === 'H' ? [a, y] : [x, a];
          if (command !== 'M') {
            const run = {x0: Math.min(x, nx), x1: Math.max(x, nx), y0: Math.min(y, ny), y1: Math.max(y, ny)};
            for (const label of texts) assert(!overlap(run, label, 2), `a route crosses "${label.text}", ${where}`);
          }
          [x, y] = [nx, ny];
        }
      }
      // The marker (ring radius plus half its stroke) rests clear of every label.
      const p = packet(f), ring = {x0: p.x - 7.6, x1: p.x + 7.6, y0: p.y - 7.6, y1: p.y + 7.6};
      if (p.at !== 'moving') for (const label of texts) assert(!overlap(ring, label), `the marker rests on "${label.text}", ${where}`);
      assert(ring.x0 >= 0 && ring.x1 <= width);
    }
  }
  // Below the phones this book is read on, cards shrink; tags may then touch a card edge but never a neighbour.
  f.resize(240);
  for (const time of [0, 9, 14, 40]) {
    f.seek(time);
    const texts = [...f.$('[data-drawing]').querySelectorAll('text')].filter(node => visible(node) && node.textContent).map(textBox);
    for (let a = 0; a < texts.length; a++) for (let b = a + 1; b < texts.length; b++)
      assert(!overlap(texts[a], texts[b]), `"${texts[a].text}" overlaps "${texts[b].text}" at 240px, ${time}s`);
  }
});

test('mask: on the phone wrap the whole scored route stays in the first strip, under slot 2', t => {
  const f = fixture(t, NAME, {width: 296}); f.load(); f.open(); f.seek(13);
  assert.equal(f.root.dataset.layout, 'narrow');
  const why = box(input(f, 0, 2).querySelector('rect')), birdsTarget = box(copy(f, 0, 3).querySelector('rect'));
  const birdsInput = box(input(f, 0, 3).querySelector('rect'));
  assert(Math.abs(birdsTarget.x - why.x) < 1e-3, 'the shifted target sits under its predictor, in the same strip');
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

test('mask: per-frame work touches only what moves — the marker, or the tape while it slides', t => {
  const f = fixture(t, NAME, {width: 713}); f.load(); f.open();
  const touchedBy = (from, times) => {
    f.seek(from);
    const observer = new f.w.MutationObserver(() => {});
    observer.observe(f.root, {attributes: true, childList: true, characterData: true, subtree: true});
    for (const time of times) f.seek(time);
    const records = observer.takeRecords().filter(record => !record.target.closest('[data-controls]') && record.target !== f.root
      || (record.target === f.root && !['data-time', 'data-playing'].includes(record.attributeName)));
    observer.disconnect();
    return records;
  };
  // The still moment after the slide, and the marker's glide: only the marker is written.
  for (const [from, times] of [[8.6, [8.8, 9.0, 9.4]], [11.5, [11.6, 11.8, 12.0, 12.2]]]) {
    const touched = touchedBy(from, times);
    assert(touched.length > 0);
    for (const record of touched) assert(record.target.closest('[data-packet]'), `${record.target.nodeName} ${record.attributeName} rewritten inside a still stretch`);
  }
  // Mid-slide: the marker and the travelling copies' own transform/opacity/hidden, nothing in the scenery.
  const sliding = touchedBy(7.0, [7.1, 7.2, 7.3, 7.4]);
  assert(sliding.some(record => record.target.closest('[data-tape]')));
  for (const record of sliding) {
    assert(record.target.closest('[data-packet]') || record.target.matches('[data-tape] > g'), `${record.target.nodeName} ${record.attributeName} rewritten during the slide`);
    if (record.target.matches('[data-tape] > g')) assert(['transform', 'opacity', 'hidden'].includes(record.attributeName), record.attributeName);
  }
  // Geometry is serialised at four decimals at most, at a pane width that divides into nothing round.
  for (const width of [713, 301.337]) {
    f.resize(width);
    for (const time of [5.37, 7.13, 11.77, 16.41, 40]) {
      f.seek(time);
      for (const node of f.$('[data-drawing]').querySelectorAll('*')) for (const name of ['transform','opacity','x','y','x1','x2','y1','y2','width','height','d'])
        for (const value of (node.getAttribute(name) || '').match(/-?\d+\.\d+/g) || []) assert(value.split('.')[1].length <= 4, `${name}="${node.getAttribute(name)}"`);
    }
  }
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
  // The fallback is the finished construction: slid, gated, the first token's copy gone; the second print keeps its own clip id.
  assert.equal((source.match(/data-leaving-copy="0:0"[^>]*hidden/g)||[]).length, 2);
  assert.equal((source.match(/id="mask-predictor-tape-window"/g)||[]).length, 1);
  assert.equal((source.match(/id="mask-predictor-tape-window--static-narrow"/g)||[]).length, 1);
  assert(source.includes('url(#mask-predictor-tape-window--static-narrow)'));
});
