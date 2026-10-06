#!/usr/bin/env node
// Test-only checks for the Chapter 10 truncation scene. Nothing here ships. The suite
// re-derives the cut, the value's crossing and the gradient's stop from the declared
// schematic, proves both predictions are withheld from the DOM until their reveals, and
// binds the panel's sentences to the chapter's own.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, canonicalMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'detach-cut-excerpt', scene = entry(NAME);
const drawing = f => f.$('[data-drawing]');
const lane = (f, name) => drawing(f).querySelector(`[data-mark="lane-${name}"]`);
const mark = (f, name, which) => lane(f, name).querySelector(`[data-mark="${which}"]`);
const marks = (f, name, which) => [...lane(f, name).querySelectorAll(`[data-mark="${which}"]`)];
const node = (f, name, step) => lane(f, name).querySelector(`[data-mark="node"][data-step="${step}"]`);
const cx = element => Number(element.getAttribute('cx'));
const cutX = f => Number(drawing(f).querySelector('[data-mark="cut"]').getAttribute('x1'));
const valueX = f => (name => { const m = mark(f, name, 'value') || mark(f, name, 'value-ghost'); return m ? cx(m) : null; });
const verdicts = f => [...drawing(f).querySelectorAll('[data-value]')];
const label = f => f.$('[data-figure] svg').getAttribute('aria-label');
const valuetext = f => f.$('[data-controls] input[type=range]').getAttribute('aria-valuetext');
const declared = f => ({steps: Number(f.root.dataset.steps), chunk: Number(f.root.dataset.chunk),
  source: Number(f.root.dataset.source), loss: Number(f.root.dataset.loss)});
// What the declared schematic implies, computed here without the player.
const derive = d => {
  const chunkOf = step => Math.floor((step - 1) / d.chunk);
  const last = (chunkOf(d.source) + 1) * d.chunk, first = chunkOf(d.loss) * d.chunk + 1;
  const cuts = [];
  for (let step = d.chunk; step < d.steps; step += d.chunk) cuts.push(step);
  return {last, first, cuts, back: Array.from({length: d.loss - first + 1}, (_, k) => d.loss - k)};
};
const trailEnd = (f, name) => {
  const trail = mark(f, name, 'value-trail');
  if (!trail) return null;
  return trail.getAttribute('points').trim().split(/\s+/).map(pair => pair.split(',').map(Number)).at(-1);
};
const pointsOf = element => element.getAttribute('points').trim().split(/\s+/).map(pair => pair.split(',').map(Number));

registerTransportTests(NAME, {witness: /value crosses/, anchors: ['detach-cut-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('detach cut: the sentences the schematic illustrates are the chapter\'s own', t => {
  const f = fixture(t, NAME), d = declared(f), {last, first} = derive(d), chapter = chapterSource(NAME);
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal), `chapter lacks ${literal}`);
  // The closing caption is the chapter's sentence, verbatim.
  const closing = f.$('[data-caption]').textContent.trim();
  assert.equal(closing, 'The values cross the boundary; the gradient graph does not.');
  assert(chapter.includes('The values cross the boundary; the') && chapter.includes('gradient graph does not.'));
  // The formula is the chapter's recurrence at the first step after the cut, in its macros.
  assert(chapter.includes('\\vect{h}_t = f(\\vect{h}_{t-1}, \\vect{x}_t),'));
  const [carry, reset] = f.formulas().map(span => span.textContent);
  assert(carry.includes(`\\featurepart{\\vect{h}_${first}} = f(\\class{dc-carry}{\\operatorname{detach}(\\featurepart{\\vect{h}_${last}})},\\, \\featurepart{\\vect{x}_${first}})`));
  assert(reset.includes(`\\featurepart{\\vect{h}_${first}} = f(\\class{dc-reset}{\\vect{0}},\\, \\featurepart{\\vect{x}_${first}})`));
  // The scope quotes the recipes' own lengths, which the picture does not draw.
  const scope = f.$('.mechanism-scope').textContent.replace(/\s+/g, ' ');
  assert(scope.includes('roughly 20 to 50 steps') && chapter.includes('roughly 20–50 steps'));
  assert(scope.includes('100-character windows') && chapter.includes('100-character windows'));
  assert(scope.includes('h = h.detach()'));
  // The declared schematic: whole chunks, the value in an earlier chunk than the loss, one cut between.
  assert.equal(d.steps % d.chunk, 0);
  assert(d.source <= last && last < first && first <= d.loss && d.loss <= d.steps);
  assert.equal(first, last + 1, 'exactly one cut separates the value from the loss');
  assert.equal(f.root.dataset.evidenceClass, 'schematic');
});

test('detach cut: the drawing is the declared schematic', t => {
  for (const width of [713, 296]) {
    const f = fixture(t, NAME, {width}), d = declared(f), {last, first, cuts} = derive(d); f.load(); f.open();
    f.seek(scene.duration);
    const cutMarks = [...drawing(f).querySelectorAll('[data-mark="cut"]')];
    assert.deepEqual(cutMarks.map(m => Number(m.dataset.after)), cuts, 'a cut after every chunk but the last');
    for (const name of ['carry', 'reset']) {
      const nodes = marks(f, name, 'node');
      assert.deepEqual(nodes.map(n => Number(n.dataset.step)), Array.from({length: d.steps}, (_, k) => k + 1));
      const h = [...lane(f, name).querySelectorAll('[data-label="h"]')].map(n => n.textContent);
      const x = [...lane(f, name).querySelectorAll('[data-label="x"]')].map(n => n.textContent);
      assert.deepEqual(h, nodes.map(n => `h${n.dataset.step}`));
      assert.deepEqual(x, nodes.map(n => `x${n.dataset.step}`));
      // The cut sits halfway between the last state of one chunk and the first of the next.
      assert.equal(cutX(f), (cx(node(f, name, last)) + cx(node(f, name, first))) / 2);
      // The marked input is the declared source.
      assert.deepEqual([...lane(f, name).querySelectorAll('.dc-label.is-source')].map(n => n.textContent), [`x${d.source}`]);
      assert.equal(lane(f, name).querySelector(`[data-label="L"]`).textContent, `L${d.loss}`);
      assert.equal(Number(mark(f, name, 'loss').dataset.step), d.loss);
    }
    // Carry: the arrow from the last state crosses the cut through the detach tag.
    const tag = mark(f, 'carry', 'detach'), crossing = mark(f, 'carry', 'crossing');
    assert.equal(Number(tag.getAttribute('x')) + Number(tag.getAttribute('width')) / 2, cutX(f));
    assert(Number(crossing.getAttribute('x1')) < cutX(f) && Number(crossing.getAttribute('x2')) > cutX(f));
    assert.equal(mark(f, 'carry', 'zero'), null);
    // Reset: the last state's arrow ends at the cut; a zero box after the cut feeds the next state.
    const stub = mark(f, 'reset', 'stub'), zero = mark(f, 'reset', 'zero'), feed = mark(f, 'reset', 'feed');
    assert.equal(Number(stub.getAttribute('x2')), cutX(f));
    assert.equal(Number(zero.dataset.feeds), first);
    assert(Number(zero.getAttribute('x')) > cutX(f));
    assert(Number(feed.getAttribute('x2')) < cx(node(f, 'reset', first)));
    assert.equal(mark(f, 'reset', 'detach'), null);
    assert.equal(mark(f, 'reset', 'crossing'), null);
    assert.equal(lane(f, 'reset').querySelector('.dc-zero-text').textContent, '0');
  }
});

test('detach cut: the value rides from its step to the cut, and only the carry lane takes it further', t => {
  const f = fixture(t, NAME), d = declared(f), {last, first} = derive(d); f.load(); f.open();
  const [b0, b1, b2, b3] = scene.beats;
  f.seek(b0);
  for (const name of ['carry', 'reset']) {
    const packet = mark(f, name, 'value');
    assert.equal(cx(packet), cx(node(f, name, d.source)), 'the value waits at its own input');
    assert(Number(packet.getAttribute('cy')) > Number(node(f, name, d.source).getAttribute('cy')), 'below the state, on the input tick');
    assert.equal(lane(f, name).querySelectorAll('.dc-node.is-carrying').length, 0);
  }
  assert.equal(f.$('[data-caption]').textContent, `Two lanes, one stream, cut after step ${last}. What crosses the cut in each lane?`);
  f.seek(b2 - 0.01);
  for (const name of ['carry', 'reset']) {
    assert.equal(cx(mark(f, name, 'value')), cx(node(f, name, last)), `the ${name} value rests at step ${last}`);
    assert.equal(Number(mark(f, name, 'value').getAttribute('cy')), Number(node(f, name, last).getAttribute('cy')));
    assert.deepEqual([...lane(f, name).querySelectorAll('.dc-node.is-carrying')].map(n => Number(n.dataset.step)),
      Array.from({length: last - d.source + 1}, (_, k) => d.source + k));
  }
  assert.equal(f.$('[data-caption]').textContent, `Step ${d.source}'s input enters the state and rides to step ${last} in both lanes.`);
  f.seek(b3 - 0.01);
  assert.equal(cx(mark(f, 'carry', 'value')), cx(node(f, 'carry', d.steps)), `the carried value reaches step ${d.steps}`);
  assert.deepEqual([...lane(f, 'carry').querySelectorAll('.dc-node.is-carrying')].map(n => Number(n.dataset.step)),
    Array.from({length: d.steps - d.source + 1}, (_, k) => d.source + k));
  assert.equal(mark(f, 'reset', 'value'), null, 'the reset copy has faded');
  const ghost = mark(f, 'reset', 'value-ghost');
  assert(cx(ghost) < cutX(f) && cx(ghost) > cx(node(f, 'reset', last)), 'it stopped against the cut');
  assert.deepEqual([...lane(f, 'reset').querySelectorAll('.dc-node.is-carrying')].map(n => Number(n.dataset.step)),
    Array.from({length: last - d.source + 1}, (_, k) => d.source + k));
  assert.equal(trailEnd(f, 'carry')[0], cx(node(f, 'carry', d.steps)));
  assert.equal(trailEnd(f, 'reset')[0], cx(ghost));
  assert(mark(f, 'reset', 'feed').classList.contains('is-live'), `step ${first} starts from the zero box`);
  assert.equal(f.$('[data-caption]').textContent,
    `Carry: the value crosses and reaches step ${d.steps}. Reset: step ${first} starts again from zero.`);
  // The two copies are one value seen twice: the same x until the reset lane stops its copy.
  for (let time = b1; time < b3; time += 0.1) {
    f.seek(Number(time.toFixed(4)));
    const [c, r] = ['carry', 'reset'].map(valueX(f));
    if (c <= cutX(f) - 10) assert.equal(c, r, `the copies part before the cut at ${time.toFixed(1)}s`);
    assert(r < cutX(f), `the reset value passes the cut at ${time.toFixed(1)}s`);
  }
});

test('detach cut: the gradient of the loss runs back to the cut in both lanes and stops there', t => {
  const f = fixture(t, NAME), d = declared(f), {last, first, back} = derive(d); f.load(); f.open();
  const [, , , b3, b4, b5] = scene.beats;
  f.seek(b3);
  for (const name of ['carry', 'reset']) {
    assert(mark(f, name, 'loss'), `the loss at step ${d.loss} appears`);
    assert.equal(mark(f, name, 'gradient'), null);
  }
  f.seek(b5 - 0.01);
  for (const name of ['carry', 'reset']) {
    const tip = Number(mark(f, name, 'gradient').dataset.x), stop = mark(f, name, 'stop');
    assert(stop, `a stop bar in the ${name} lane`);
    assert.equal(Number(stop.getAttribute('x1')), cutX(f));
    assert(tip > cutX(f) && tip < cx(node(f, name, first)) - 8, `the ${name} gradient rests against the cut`);
    const trail = mark(f, name, 'gradient-trail'), box = mark(f, name, 'loss');
    assert.equal(Number(trail.getAttribute('x2')), Number(box.getAttribute('x')), 'it left the loss');
    // It passed under every state of the loss's chunk and none before the cut.
    for (const step of back) assert(Number(trail.getAttribute('x1')) < cx(node(f, name, step)));
    assert(Number(trail.getAttribute('x1')) > cx(node(f, name, last)));
  }
  assert.equal(f.$('[data-caption]').textContent,
    `The gradient runs back through steps ${back.slice(0, -1).join(', ')} and ${back.at(-1)}, then stops at the cut.`);
  // It never crosses the cut, at any time, in either lane.
  for (let time = b4; time <= scene.duration + 1e-9; time += 0.1) {
    f.seek(Number(time.toFixed(4)));
    for (const name of ['carry', 'reset']) assert(Number(mark(f, name, 'gradient').dataset.x) > cutX(f));
  }
});

test('detach cut: the gradient rings only the states it reaches, never the steps behind the cut', t => {
  const f = fixture(t, NAME), d = declared(f), {first, back, last} = derive(d); f.load(); f.open();
  const rung = name => marks(f, name, 'sensed').map(ring => Number(ring.getAttribute('data-step'))).sort((a, b) => a - b);
  // Before the gradient leaves, no state is ringed: the second prediction stays open.
  for (let step = 0; step < 50; step++) {
    f.seek(scene.beats[3] + step / 10);
    for (const name of ['carry', 'reset']) assert.deepEqual(rung(name), [], `a ring at ${scene.beats[3] + step / 10}s`);
  }
  // While it runs back the rings grow one state at a time, from the loss toward the cut.
  let before = 0;
  for (const dt of [0.4, 0.9, 1.4, 1.9, 2.4]) {
    f.seek(scene.beats[4] + dt);
    const now = rung('carry');
    assert(now.length >= before, `${now} after ${before}`); before = now.length;
    assert.deepEqual(now, back.slice(0, now.length).reverse(), 'the ringed states are the last ones the gradient passed');
  }
  // Once it has stopped: exactly the loss's own chunk in both lanes, none behind the cut,
  // although the carry lane's states behind the cut hold the value.
  f.seek(scene.beats[4] + 4.9);
  for (const name of ['carry', 'reset']) assert.deepEqual(rung(name), [...back].reverse());
  assert(first > last && rung('carry').every(step => step > last));
  assert(node(f, 'carry', d.source).classList.contains('is-carrying') && !rung('carry').includes(d.source),
    'the value\'s own step holds the value and gets no gradient');
  f.seek(scene.duration);
  assert.deepEqual(rung('carry'), [...back].reverse());
  assert.match(label(f), new RegExp(`Wine rings mark steps ${[...back].reverse().slice(0, -1).join(', ')} and ${back[0]}`));
});

test('detach cut: the detach tag becomes a one-way gate only once the verdicts are written', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (let step = 0; step < 250; step++) {
    f.seek(step / 10);
    assert.equal(drawing(f).querySelectorAll('[data-mark="gate"]').length, 0, `a gate at ${step / 10}s`);
    assert.doesNotMatch(label(f), /one-way/);
  }
  for (const time of [scene.beats[5], scene.beats[6] + 2, scene.duration]) {
    f.seek(time);
    assert.equal(marks(f, 'carry', 'gate').length, 1, `the carry lane's gate at ${time}s`);
    assert.equal(marks(f, 'reset', 'gate').length, 0, 'the reset lane has no gate');
    assert.equal(mark(f, 'carry', 'detach').getAttribute('data-gate'), 'one-way');
    // The gate points forward: its tip lies to the right of its base, on the lane's line.
    const d = mark(f, 'carry', 'gate').getAttribute('d'), [tipX] = /^M([\d.]+)/.exec(d).slice(1).map(Number);
    const baseX = tipX + Number(/l(-?[\d.]+)/.exec(d)[1]);
    assert(tipX > baseX, 'the gate points toward the later steps');
  }
});

test('detach cut: the verdicts read what the two packets did', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  f.seek(scene.beats[5]);
  const said = Object.fromEntries(verdicts(f).map(n => [n.dataset.value, n.textContent]));
  assert.deepEqual(said, {'carry-value': 'value crosses', 'carry-gradient': 'gradient stops',
    'reset-value': 'value stops', 'reset-gradient': 'gradient stops'});
  // Each verdict is written on the cut, in the colour of the packet it judges.
  for (const n of verdicts(f)) {
    assert.equal(Number(n.getAttribute('x')), cutX(f));
    assert.equal(n.getAttribute('text-anchor'), 'middle');
    assert(n.classList.contains(n.dataset.value.endsWith('value') ? 'dc-verdict-value' : 'dc-verdict-gradient'));
  }
  f.seek(scene.beats[6]);
  assert.equal(lane(f, 'reset').getAttribute('opacity'), '0.3', 'the carry lane alone');
  assert.equal(lane(f, 'carry').getAttribute('opacity'), null);
  f.seek(scene.duration);
  assert.equal(lane(f, 'reset').getAttribute('opacity'), null);
  assert.equal(verdicts(f).length, 4);
});

test('detach cut: neither prediction is spoiled before its reveal', t => {
  for (const reduced of [false, true]) {
    const f = fixture(t, NAME, {reduced}); f.load(); f.open();
    // Ask 1, 0 to 10 s: nothing past the cut, no verdict, no word about what crosses.
    for (let step = 0; step < scene.beats[2] * 10; step++) {
      const time = step / 10; f.seek(time);
      for (const name of ['carry', 'reset']) {
        const x = valueX(f)(name);
        assert(x !== null && x < cutX(f), `${name} value past the cut at ${time}s`);
        const trail = mark(f, name, 'value-trail');
        if (trail) assert(Math.max(...pointsOf(trail).map(([px]) => px)) < cutX(f), `${name} trail past the cut at ${time}s`);
        assert.equal(mark(f, name, 'value-ghost'), null);
        assert.equal(mark(f, name, 'gradient'), null);
        assert.equal(mark(f, name, 'loss'), null);
        assert(!marks(f, name, 'node').some(n => n.classList.contains('is-carrying') && cx(n) > cutX(f)));
      }
      assert.equal(verdicts(f).length, 0, `verdict at ${time}s`);
      assert(!mark(f, 'reset', 'feed').classList.contains('is-live'), `the restart shown at ${time}s`);
      for (const text of [label(f), valuetext(f)]) assert.doesNotMatch(text, /cross|reach|stop|halt|gradient|verdict|restart/i, `spoiled at ${time}s: ${text}`);
    }
    // Ask 2, 15 to 20 s: no gradient anywhere, no verdict, no word about where it stops.
    for (let step = scene.beats[3] * 10; step < scene.beats[4] * 10; step++) {
      const time = step / 10; f.seek(time);
      for (const name of ['carry', 'reset']) {
        for (const which of ['gradient', 'gradient-trail', 'stop']) assert.equal(mark(f, name, which), null, `${which} at ${time}s`);
      }
      assert.equal(verdicts(f).length, 0, `verdict at ${time}s`);
      for (const text of [label(f), valuetext(f)]) assert.doesNotMatch(text, /gradient/i, `spoiled at ${time}s: ${text}`);
    }
  }
});

test('detach cut: one packet moves at a time, and each reveal holds still', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const state = () => {
    const tips = ['carry', 'reset'].map(n => mark(f, n, 'gradient')).filter(Boolean).map(g => g.dataset.x);
    return {value: ['carry', 'reset'].map(valueX(f)).join(), gradient: tips.length ? tips.join() : null};
  };
  let before = (f.seek(0), state());
  const moving = [];
  for (let step = 1; step <= scene.duration * 10; step++) {
    const time = step / 10; f.seek(time);
    const now = state();
    // A packet appearing where it starts is not motion; a packet changing place is.
    const value = now.value !== before.value, gradient = before.gradient !== null && now.gradient !== before.gradient;
    assert(!(value && gradient), `both packets move at ${time}s`);
    if (value || gradient) moving.push(time);
    before = now;
  }
  // The value glides in beats 1 and 2, the gradient in beat 4; each glide ends in a hold of
  // at least two seconds before the next beat.
  const [, b1, b2, b3, b4, b5] = scene.beats;
  for (const time of moving) {
    const inside = [[b1, b2], [b2, b3], [b4, b5]].find(([a, b]) => time > a && time <= b - 2);
    assert(inside, `something moves at ${time}s outside a glide`);
  }
});

test('detach cut: each lane\'s part of the formula is lit while that lane acts at the cut', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const lit = scene.beats.map(beat => {
    f.seek(beat + 1);
    const formula = f.$('[data-formula]');
    return [formula.classList.contains('dc-carry-lit'), formula.classList.contains('dc-reset-lit')];
  });
  assert.deepEqual(lit, [[false, false], [false, false], [true, true], [false, false],
    [true, true], [true, true], [true, false], [true, true]]);
  const css = read('detach-cut/player.css');
  assert.match(css, /\[data-ready\] \.detach-cut-formula\.dc-carry-lit \.dc-carry/);
  assert.match(css, /\[data-ready\] \.detach-cut-formula\.dc-reset-lit \.dc-reset/);
});

test('detach cut: text stays inside the picture and off its neighbours', t => {
  for (const width of [296, 375, 599, 600, 713, 900]) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    for (const time of [...scene.beats, ...scene.beats.map(b => b + 1.2), ...scene.beats.map(b => b + 2.5), ...scene.beats.map(b => b + 4.99), scene.duration]) {
      f.seek(Math.min(time, scene.duration));
      const [, , W, H] = f.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/).map(Number);
      const boxes = [...drawing(f).querySelectorAll('text')].map(n => {
        const sz = Number(n.getAttribute('font-size')), anchor = n.getAttribute('text-anchor');
        const w = n.textContent.length * sz * 0.56, x = Number(n.getAttribute('x')), y = Number(n.getAttribute('y'));
        const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
        return {left, right: left + w, top: y - sz, bottom: y + sz * 0.3, text: n.textContent};
      });
      for (const b of boxes) assert(b.left >= -1 && b.right <= W + 1 && b.top >= -1 && b.bottom <= H + 1, `${width}px ${time}s "${b.text}" outside`);
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        assert(Math.min(a.right, b.right) - Math.max(a.left, b.left) <= 1 || Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) <= 1,
          `${width}px ${time}s "${a.text}" and "${b.text}" collide`);
      }
      // Every mark stays inside the picture too.
      for (const n of drawing(f).querySelectorAll('circle')) {
        const r = Number(n.getAttribute('r'));
        assert(cx(n) - r >= 0 && cx(n) + r <= W && Number(n.getAttribute('cy')) + r <= H, `${width}px ${time}s circle outside`);
      }
      for (const n of drawing(f).querySelectorAll('rect')) {
        const x = Number(n.getAttribute('x')), y = Number(n.getAttribute('y'));
        assert(x >= 0 && y >= 0 && x + Number(n.getAttribute('width')) <= W && y + Number(n.getAttribute('height')) <= H, `${width}px ${time}s rect outside`);
      }
    }
    // The narrow print is a reflow, not the wide one shrunk.
    const [, , W] = f.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/).map(Number);
    assert.equal(W, width < 600 ? 296 : 713);
  }
});

test('detach cut: seeking is deterministic', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const snap = time => { f.seek(time); return canonicalMarkup(f.$('[data-pane]').innerHTML.replace(/aria-valuetext="[^"]*"/g, '')) + label(f); };
  const times = [0, 6.1, 9, 11.3, 12.2, 17, 21.1, 23, 27.5, 33, 39, 40];
  assert.deepEqual(times.map(snap), [...times].reverse().map(snap).reverse());
});

test('detach cut: the committed static print is a fresh render of the final frame', async () => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after, 'run scripts/render_static_frames.cjs detach-cut');
});

test('detach cut: typography, voice and inertness', t => {
  const player = read('detach-cut/player.js'), panel = read('detach-cut/panel.html');
  assert.doesNotMatch(player, /Math\.random|fetch\(|import\(|setInterval\(/);
  assert.doesNotMatch(panel, /@eq-|—/);
  assert.equal((player.match(/getBoundingClientRect/g) || []).length, 1);
  const f = fixture(t, NAME);
  // Visible prose: no exclamation mark, no contraction, no apparatus word, no film wording.
  const prose = (() => { const copy = f.root.cloneNode(true); copy.querySelectorAll('code, [data-formula]').forEach(c => c.remove()); return copy.textContent; })();
  assert.doesNotMatch(prose, /!/);
  assert.doesNotMatch(prose, /n't\b|\b(it|that|there|what|here|let)'s\b|'(re|ll|ve|m|d)\b/i);
  assert.doesNotMatch(prose, /\b(recap|section|subsection|table|callout|receipt|ledger|film|lecture|course|students?)\b/i);
  // One visible boundary sentence, the rest closed inside the scope disclosure.
  const boundary = f.$('.mechanism-boundary > p').textContent.trim();
  assert.equal(boundary, 'Inside a chunk the gradient still flows back and still trains the shared weights; the cut removes only the paths that cross it.');
  assert.equal(f.root.querySelectorAll('.mechanism-boundary > p').length, 1);
  assert(boundary.split(/\s+/).length <= 30);
  assert.equal(f.$('.mechanism-scope').open, false);
  assert.equal(f.root.querySelectorAll('#detach-cut-transcript li').length, scene.beats.length);
  f.load(); f.open();
  for (const time of [...scene.beats, ...scene.beats.map(b => b + 1.5), scene.duration]) {
    f.seek(time);
    for (const n of drawing(f).querySelectorAll('text')) {
      assert.doesNotMatch(n.textContent, /\de[-+]?\d|(?<![\w.])-\d|\^|\bexp\(|—/, `bad typography in "${n.textContent}"`);
    }
    for (const text of [label(f), valuetext(f), f.$('[data-caption]').textContent]) {
      assert.doesNotMatch(text, /\de[-+]?\d|(?<![\w.])-\d|—|!|n't\b/, `bad typography in "${text}"`);
    }
    assert(f.$('[data-caption]').textContent.trim().split(/\s+/).length <= 20);
  }
});

test('integration: the excerpt is HTML-only and closes the finite-horizon subsection, before the LSTM', () => {
  const filter = fs.readFileSync(path.join(ROOT, scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
  assert.doesNotMatch(filter, /detach-cut|Engineering a memory/);
  const config = fs.readFileSync(path.join(ROOT, '_quarto.yml'), 'utf8');
  assert.match(config, /^\s+- interactives\/detach-cut\/player\.js$/m);
  const chapter = chapterSource(NAME);
  assert.equal(scene.anchor.type, 'before-heading');
  const heading = `## ${scene.anchor.target}`;
  assert.equal(chapter.split('\n').filter(line => line === heading).length, 1);
  const at = chapter.indexOf(heading);
  assert(chapter.indexOf('### Training with a finite horizon') < at);
  assert(at < chapter.indexOf('## GRU: gating with one state {#gru-the-streamlined-cousin}'));
  // Directly after the paragraph that ends the fixed-window discussion.
  const paragraph = 'neither creates gradients beyond the truncation\nhorizon.';
  assert.equal(chapter.slice(chapter.indexOf(paragraph) + paragraph.length, at).trim(), '');
});
