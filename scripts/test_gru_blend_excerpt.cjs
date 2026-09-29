#!/usr/bin/env node
// Test-only checks for the Chapter 10 GRU keep-gate scene. Nothing here ships. The suite
// recomputes every printed share and the new state from the panel's declared old state,
// candidate and keep, reads the picture's geometry back through the drawn number line, and
// holds the prediction: while the caption asks where the new state lands, nothing on the
// picture, in its description or in either slider's value text says where.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, canonicalMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'gru-blend-excerpt', scene = entry(NAME);
const [B0, B1, B2, B3, B4, B5, B6, B7] = scene.beats;
const WIDTHS = [296, 375, 599, 600, 713, 900];
const drawing = f => f.$('[data-drawing]');
const texts = f => [...drawing(f).querySelectorAll('text')];
const value = (f, name) => drawing(f).querySelector(`[data-value="${name}"]`);
const mark = (f, name) => drawing(f).querySelector(`[data-mark="${name}"]`);
const picture = f => f.$('[data-figure] svg');
const slider = f => f.$('[data-keep-slider]');
const scrubber = f => f.$('[data-controls] input[type=range]');
const attr = (node, key) => Number(node.getAttribute(key));
const unminus = text => text.replace(/−/g, '-');
const steps = (from, to, dt = 0.1) => Array.from({length: Math.round((to - from) / dt)}, (_, i) => Number((from + i * dt).toFixed(4)));

// The fixture, read from the panel: the one in-repo copy.
const declared = f => ({old: Number(f.root.dataset.old), cand: Number(f.root.dataset.candidate),
  keep: Number(f.root.dataset.keep), range: numbers(f.root.dataset.range)});
// The update equation's last line on one coordinate: keep z of the old state, write 1 - z of
// the candidate. Printed in hundredths, each share rounded once, so the printed shares add up
// to the printed new state.
const blend = (k, z) => z * k.old + (1 - z) * k.cand;
const cents = v => Math.round(v * 100);
const printed = (k, z) => {
  const keep = cents(z), write = 100 - keep;
  const kept = Math.round(keep * cents(k.old) / 100), written = Math.round(write * cents(k.cand) / 100);
  return {keep, write, kept, written, total: kept + written};
};
const fixed = c => (c / 100).toFixed(2).replace('-', '−');
const gate = c => String(c / 100).replace('-', '−');
const z = f => Number(f.root.dataset.z);
// The drawn line: its path runs from x(lo) to x(hi), so any value is read back through it.
const scale = (f, k) => {
  const [, x0, , x1] = /^M([\d.]+) ([\d.]+)H([\d.]+)$/.exec(drawing(f).querySelector('.gb-axis').getAttribute('d')).map(Number);
  return v => x0 + (v - k.range[0]) / (k.range[1] - k.range[0]) * (x1 - x0);
};
// A block arrow's tail and tip, read from its path: the first move and the tip vertex.
const ends = node => {
  const d = node.getAttribute('d'), xs = [...d.matchAll(/[MHL]([\d.-]+)/g)].map(m => Number(m[1]));
  const tail = xs[0];
  // A share under half a pixel long is drawn as a stub, a mark at its tail.
  if (/^M[\d.-]+ [\d.-]+V[\d.-]+$/.test(d)) return {tail, tip: tail, stub: true};
  const tip = Number(/L([\d.-]+) [\d.-]+L/.exec(d)[1]);
  return {tail, tip, stub: false};
};
const near = (a, b, eps, message) => assert(Math.abs(a - b) <= eps, `${message}: ${a} vs ${b}`);
const drag = (f, keep) => { slider(f).value = String(keep); slider(f).dispatchEvent(new f.w.Event('input')); };
const said = f => [picture(f).getAttribute('aria-label'), scrubber(f).getAttribute('aria-valuetext'),
  slider(f).getAttribute('aria-valuetext')].join(' | ');
// TeX without the book's colour wrappers and the scene's \class{}{} handles.
const unwrap = (tex, macro, args) => {
  let out = tex, at;
  while ((at = out.indexOf(`\\${macro}{`)) >= 0) {
    let i = at + macro.length + 1, inner = [];
    for (let a = 0; a < args; a++) {
      let depth = 0, start = i;
      do { if (out[i] === '{') depth++; else if (out[i] === '}') depth--; i++; } while (depth > 0);
      inner.push(out.slice(start + 1, i - 1));
    }
    out = out.slice(0, at) + inner.at(-1) + out.slice(i);
  }
  return out;
};

registerTransportTests(NAME, {witness: /0\.5 × 0\.30 = 0\.15/, anchors: ['gru-blend-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('gru blend: the equation, the keep convention and the range are the chapter\'s', t => {
  const f = fixture(t, NAME), k = declared(f), chapter = chapterSource(NAME);
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal), literal.slice(0, 60));
  // The formula line is the interpolation line of the GRU update equation, verbatim once
  // its colour wrappers and \class handles are taken off.
  const line = '\\vect{h}_t = \\vect{z}_t \\odot \\vect{h}_{t-1} + (1 - \\vect{z}_t) \\odot \\tilde{\\vect{h}}_t';
  assert(chapter.includes(`${line} .`));
  const tex = f.$('#eq-gru-blend-1').textContent.trim().replace(/^\\\(\s*|\s*\\\)$/g, '');
  assert.equal(unwrap(unwrap(tex, 'featurepart', 1), 'class', 2).replace(/\s+/g, ' '), line);
  // z weights the old state ("so it reads as keep"), and the candidate is shaped by tanh,
  // so the drawn line is tanh's range and both declared values sit strictly inside it.
  assert(chapter.includes('$\\vect{z}_t$ weights the old\nstate, so it reads as **keep**.'));
  assert(chapter.includes('content is shaped by $\\tanh$, keeping it bounded and centered.'));
  assert.deepEqual(k.range, [-1, 1]);
  for (const v of [k.old, k.cand]) assert(v > k.range[0] && v < k.range[1] && cents(v) === v * 100, `declared toy ${v}`);
  assert.notEqual(k.old, k.cand);
  assert.equal(k.keep, 0.5, 'the question halves the keep');
  // The question above the pane states the declared values.
  const question = f.$('.mechanism-question').textContent;
  for (const piece of [fixed(cents(k.old)), fixed(cents(k.cand)), gate(cents(k.keep))]) assert(question.includes(piece), piece);
  // The manifest's declared variants are the numbers the final frame prints.
  const variants = scene.fixture.computedVariants.join(' ');
  for (const piece of ['0.80', '0.30', '0.5 x 0.80 = 0.40', '0.5 x 0.30 = 0.15', '0.55']) assert(variants.includes(piece), piece);
});

test('gru blend: every printed number is recomputed from the declared fixture', t => {
  const f = fixture(t, NAME), k = declared(f); f.load(); f.open();
  f.seek(scene.duration);
  const home = printed(k, k.keep);
  assert.equal(value(f, 'old').textContent, fixed(cents(k.old)));
  assert.equal(value(f, 'candidate').textContent, fixed(cents(k.cand)));
  assert.equal(value(f, 'kept').textContent, `${gate(home.keep)} × ${fixed(cents(k.old))} = ${fixed(home.kept)}`);
  assert.equal(value(f, 'written').textContent, `${gate(home.write)} × ${fixed(cents(k.cand))} = ${fixed(home.written)}`);
  assert.equal(value(f, 'new').textContent, fixed(home.total));
  assert.deepEqual([home.kept, home.written, home.total], [40, 15, 55]);
  assert.equal(home.total, cents(blend(k, k.keep)), 'at the fixture the rounded shares are exact');
  f.seek(B0 + 2);
  assert.equal(value(f, 'new').textContent, fixed(cents(k.old)), 'full keep is the old state');
  // At every tenth of a second the labels are the product of the published keep, and the
  // printed new state is the printed shares' sum, within a hundredth of the exact blend.
  for (const time of steps(0, scene.duration + 0.1)) {
    f.seek(time);
    const p = printed(k, z(f));
    const kept = value(f, 'kept'), written = value(f, 'written'), landed = value(f, 'new');
    if (kept) assert.equal(kept.textContent, `${gate(p.keep)} × ${fixed(cents(k.old))} = ${fixed(p.kept)}`, `${time}s`);
    if (written) assert.equal(written.textContent, `${gate(p.write)} × ${fixed(cents(k.cand))} = ${fixed(p.written)}`, `${time}s`);
    if (landed) {
      const shown = Number(unminus(landed.textContent));
      near(shown, blend(k, z(f)), 0.0101, `${time}s new state`);
      if (kept && written) near(shown, Number(unminus(kept.textContent.split(' = ')[1])) + Number(unminus(written.textContent.split(' = ')[1])), 1e-9, `${time}s the shares add up`);
    }
  }
});

test('gru blend: the picture is the blend, read back through the drawn line', t => {
  for (const width of [296, 713]) {
    const f = fixture(t, NAME, {width}), k = declared(f); f.load(); f.open();
    for (const time of steps(B3 + 2.3, scene.duration + 0.1)) {
      f.seek(time);
      const x = scale(f, k), keep = z(f), h = blend(k, keep);
      const ring = mark(f, 'new');
      assert(ring, `${width}px ${time}s the ring is drawn once it has landed`);
      near(attr(ring, 'cx'), x(h), 0.001, `${width}px ${time}s ring`);
      near(attr(ring, 'data-at'), h, 0.0001, `${width}px ${time}s ring value`);
      // Head to tail from 0: the kept share, then the written share from its tip.
      const kept = ends(mark(f, 'kept')), written = ends(mark(f, 'written'));
      near(kept.tail, x(0), kept.stub ? 0.5 : 0.001, 'the kept share starts at 0');
      near(kept.tip, x(keep * k.old), kept.stub ? 0.5 : 0.001, 'the kept share is z times the old state');
      near(written.tail, x(keep * k.old), 0.001, 'the written share starts at the kept share\'s tip');
      near(written.tip, x(h), written.stub ? 0.5 : 0.001, 'and ends where the ring is');
      near(attr(mark(f, 'written'), 'data-to') - attr(mark(f, 'written'), 'data-from'), (1 - keep) * k.cand, 0.0001, 'the written share is 1 - z of the candidate');
      // One bar, two shares of one whole.
      const bar = mark(f, 'bar'), keepShare = mark(f, 'keep-share'), writeShare = mark(f, 'write-share');
      near(attr(keepShare, 'width') + attr(writeShare, 'width'), attr(bar, 'width'), 0.001, 'the shares fill the bar');
      near(attr(keepShare, 'width') / attr(bar, 'width'), keep, 0.0001, 'the keep share is z');
      // Write sits on the left and keep on the right, as the candidate and the old state do on
      // the line and as the dial's write-all and keep-all ends do.
      near(attr(writeShare, 'x'), attr(bar, 'x'), 0.001, 'the write share starts at the left end');
      near(attr(keepShare, 'x') + attr(keepShare, 'width'), attr(bar, 'x') + attr(bar, 'width'), 0.001, 'the keep share ends at the right end');
      assert(mark(f, 'write-glyph') && mark(f, 'keep-glyph'), 'each share is named beside its value\'s mark');
      // The new state never leaves the segment between the candidate and the old state.
      if (time >= B4) {
        const segment = mark(f, 'segment');
        near(attr(segment, 'data-from'), Math.min(k.old, k.cand), 1e-9, 'segment start');
        near(attr(segment, 'data-to'), Math.max(k.old, k.cand), 1e-9, 'segment end');
        assert(h >= Math.min(k.old, k.cand) - 1e-9 && h <= Math.max(k.old, k.cand) + 1e-9, `${time}s off the segment`);
      }
    }
    // The marks sit where the fixture says.
    const x = scale(f, k);
    near(attr(mark(f, 'old'), 'cx'), x(k.old), 0.001, 'old state');
    const diamond = /^M([\d.]+) /.exec(mark(f, 'candidate').getAttribute('d'))[1];
    near(Number(diamond), x(k.cand), 0.001, 'candidate');
    assert.deepEqual(texts(f).filter(node => node.classList.contains('gb-scenery')).map(node => node.textContent), ['−1', '0', '1']);
  }
});

test('gru blend: the new state is withheld while the caption asks where it lands', t => {
  const f = fixture(t, NAME), k = declared(f); f.load(); f.open();
  const answer = fixed(printed(k, k.keep).total);
  f.seek(B1);
  assert.match(f.$('[data-caption]').textContent, /Where does the new state land\?/);
  for (const time of steps(B1, B3)) {
    f.seek(time);
    assert.equal(mark(f, 'new'), null, `the ring is drawn at ${time}s`);
    assert.equal(value(f, 'new'), null, `the new state is printed at ${time}s`);
    assert.equal(f.root.dataset.landed, '', `landed at ${time}s`);
    assert(!drawing(f).textContent.includes(answer), `${answer} is on the picture at ${time}s`);
    const spoken = said(f);
    assert(!spoken.includes(answer), `${answer} is spoken at ${time}s: ${spoken}`);
    assert.doesNotMatch(spoken, /new state, a ring|lands at/, `the landing is described at ${time}s`);
    assert.match(picture(f).getAttribute('aria-label'), /the new state is not drawn/);
    // Nothing on the picture sits at the answer, even a mark already gliding toward it.
    for (const node of drawing(f).querySelectorAll('[data-at], [data-to]')) {
      const at = Number(node.getAttribute('data-at') ?? node.getAttribute('data-to'));
      assert(Math.abs(at - blend(k, k.keep)) > 1e-6, `${node.getAttribute('data-mark')} at the answer at ${time}s`);
    }
  }
  // The keep settles and holds still for at least two seconds before the reveal starts.
  f.seek(B1 + 1.5); const settled = drawing(f).innerHTML;
  f.seek(B2 - 0.01); assert.equal(drawing(f).innerHTML, settled, 'the ask holds still');
  assert(B2 - (B1 + 1.5) >= 2);
  // The reveal: the old state's arrow at 10 s, and the ring only once the written share lands.
  f.seek(B2); assert(mark(f, 'kept'), 'the reveal begins at the beat');
  f.seek(B3 + 2.3); assert(mark(f, 'new')); assert.equal(value(f, 'new').textContent, answer);
});

test('gru blend: the dial says what the keep and the write are, never where the state lands', t => {
  const f = fixture(t, NAME), k = declared(f); f.load(); f.open();
  for (const time of steps(0, scene.duration + 0.1)) {
    f.seek(time);
    // The ask sets the dial to the halved keep at once; only the picture's bar glides there,
    // so no keep between the two is printed or spoken while the reader predicts.
    const dial = time >= B1 && time < B2 ? k.keep : z(f), keep = cents(dial);
    assert.equal(slider(f).getAttribute('aria-valuetext'), `keep ${fixed(keep)}, write ${fixed(100 - keep)}`, `${time}s`);
    assert.equal(f.$('[data-keep-readout]').textContent, fixed(keep));
    assert.equal(f.$('[data-write-readout]').textContent, fixed(100 - keep));
    assert(Math.abs(Number(slider(f).value) - dial) <= 0.005, `the thumb follows the timeline at ${time}s`);
    assert.match(picture(f).getAttribute('aria-label'), new RegExp(`the bar gives write ${fixed(100 - keep)} on the left and keep ${fixed(keep)} on the right;`));
  }
  f.seek(B1 + 0.5);
  assert(z(f) < 1 && z(f) > k.keep, 'the bar glides while the dial already reads the halved keep');
  // The timeline sweeps the dial to both ends and comes home to the fixture's keep.
  const at = time => (f.seek(time), z(f));
  assert.equal(at(B0 + 1), 1); assert.equal(at(B2), k.keep);
  assert.equal(at(B6 - 0.01), 1); assert.equal(at(B7 - 0.01), 0); assert.equal(at(scene.duration), k.keep);
  assert.equal(f.$('[data-keep-display]').getAttribute('aria-hidden'), 'true', 'the readout is not spoken twice');
});

test('gru blend: the reveal builds the new state head to tail, in order', t => {
  const f = fixture(t, NAME), k = declared(f); f.load(); f.open();
  f.seek(B2 + 0.1);
  assert.equal(attr(mark(f, 'kept'), 'data-to'), k.old, 'the old state as an arrow from 0');
  assert.equal(value(f, 'kept'), null, 'unlabelled until the keep has acted');
  f.seek(B2 + 1.2);
  const midway = attr(mark(f, 'kept'), 'data-to');
  assert(midway < k.old && midway > k.keep * k.old, `shrinking: ${midway}`);
  f.seek(B2 + 2.5);
  near(attr(mark(f, 'kept'), 'data-to'), k.keep * k.old, 1e-9, 'the kept share');
  assert(value(f, 'kept'));
  f.seek(B3 + 0.1);
  assert.equal(attr(mark(f, 'written'), 'data-lift'), 0, 'the candidate arrow starts one row down');
  assert.equal(attr(mark(f, 'written'), 'data-from'), 0);
  near(attr(mark(f, 'written'), 'data-to'), k.cand, 1e-9, 'the whole candidate, from 0');
  f.seek(B3 + 0.8);
  const shrinking = attr(mark(f, 'written'), 'data-to') - attr(mark(f, 'written'), 'data-from');
  assert(shrinking < k.cand && shrinking > (1 - k.keep) * k.cand && attr(mark(f, 'written'), 'data-lift') === 0, 'it shrinks before it slides');
  f.seek(B3 + 1.5);
  const sliding = attr(mark(f, 'written'), 'data-from');
  assert(sliding > 0 && sliding < k.keep * k.old && attr(mark(f, 'written'), 'data-lift') === 0, `it slides along its own row: ${sliding}`);
  near(attr(mark(f, 'written'), 'data-to') - attr(mark(f, 'written'), 'data-from'), (1 - k.keep) * k.cand, 1e-9, 'it slides at its written length');
  f.seek(B3 + 2);
  const lift = attr(mark(f, 'written'), 'data-lift');
  assert(lift > 0 && lift < 1, `rising: ${lift}`);
  // It rises only once its tail is under the kept arrow's tip, so the two never overlap.
  for (const time of steps(B3, B3 + 2.3, 0.05)) {
    f.seek(time);
    const node = mark(f, 'written');
    if (node && attr(node, 'data-lift') > 0) near(attr(node, 'data-from'), k.keep * k.old, 1e-9, `it rises before it arrives, at ${time}s`);
  }
  for (const time of steps(B3, B3 + 2.2, 0.05)) { f.seek(time); assert.equal(mark(f, 'new'), null, `the ring lands early, at ${time}s`); }
  f.seek(B3 + 2.25);
  assert.equal(attr(mark(f, 'written'), 'data-lift'), 1);
  near(attr(mark(f, 'written'), 'data-from'), k.keep * k.old, 1e-9, 'onto the kept share\'s tip');
  near(attr(mark(f, 'new'), 'data-at'), blend(k, k.keep), 1e-9, 'and the ring lands at that tip');
  f.seek(B4); assert(mark(f, 'segment'), 'the segment is marked in the next beat');
  f.seek(B4 - 0.01); assert.equal(mark(f, 'segment'), null);
});

test('gru blend: dragging the dial is a detour that the timeline ends', t => {
  const f = fixture(t, NAME), k = declared(f); f.load(); f.open();
  f.seek(B3 + 1); f.play(); assert(f.playing);
  drag(f, 0.2);
  assert(!f.playing, 'dragging pauses');
  assert.equal(f.root.dataset.override, 'dial');
  assert.equal(f.root.dataset.z, '0.2');
  const p = printed(k, 0.2);
  assert.equal(value(f, 'kept').textContent, `0.2 × ${fixed(cents(k.old))} = ${fixed(p.kept)}`);
  assert.equal(value(f, 'written').textContent, `0.8 × ${fixed(cents(k.cand))} = ${fixed(p.written)}`);
  assert.equal(value(f, 'new').textContent, fixed(p.total));
  near(attr(mark(f, 'new'), 'data-at'), blend(k, 0.2), 1e-9, 'the whole picture follows the dragged keep');
  assert(mark(f, 'segment'), 'the dragged picture is the finished one');
  assert.equal(slider(f).getAttribute('aria-valuetext'), 'keep 0.20, write 0.80');
  assert.equal(f.$('[data-caption]').textContent, `Kept ${fixed(p.kept)} plus written ${fixed(p.written)}: the new state lands at ${fixed(p.total)}, on the segment.`);
  // A key the transport ignores leaves the detour alone; a scrub ends it.
  f.key('x');
  assert.equal(f.root.dataset.override, 'dial');
  f.seek(B3 + 1);
  assert.equal(f.root.dataset.override, '');
  assert.equal(z(f), k.keep);
  // Keys on the slider never reach the pane's beat seeking.
  const time = f.time;
  f.key('ArrowRight', slider(f)); f.key('End', slider(f));
  assert.equal(f.time, time);
  // Play after a drag resumes the timeline's own keep.
  drag(f, 0.9); assert.equal(f.root.dataset.override, 'dial');
  f.play(); assert(f.playing); assert.equal(f.root.dataset.override, '');
  f.play();
  drag(f, 0.9); f.key('ArrowLeft'); assert.equal(f.root.dataset.override, '', 'an arrow-key beat ends the detour');
  // The dial is clamped to the gate's range and to hundredths.
  drag(f, 0.333); assert.equal(f.root.dataset.z, '0.33');
});

test('gru blend: the dial is a real range, inert and hidden until the player mounts', t => {
  const f = fixture(t, NAME), k = declared(f), s = slider(f);
  assert(!s.closest('[data-controls]'), 'outside the transport bar');
  assert.equal(s.type, 'range');
  assert.deepEqual([s.min, s.max, s.step, s.getAttribute('value')], ['0', '1', '0.01', String(k.keep)]);
  assert.deepEqual([...f.$(`#${s.getAttribute('list')}`).options].map(o => o.value), ['0', '0.5', '1']);
  assert.equal(s.getAttribute('aria-label'), 'Keep gate z');
  assert.equal(s.getAttribute('aria-valuetext'), 'keep 0.50, write 0.50');
  assert.equal(f.$('[data-keep-display]').textContent.replace(/\s+/g, ' ').trim(), 'keep 0.50 · write 0.50');
  assert.match(read('gru-blend/player.css'), /#gru-blend-excerpt:not\(\[data-ready\]\) \.gb-dial \{ ?visibility: ?hidden; ?\}/);
  // Before the player mounts, dragging does nothing to the picture.
  const before = drawing(f).innerHTML;
  drag(f, 0.1);
  assert.equal(drawing(f).innerHTML, before);
});

test('gru blend: reduced motion holds each beat\'s finished state', t => {
  const f = fixture(t, NAME, {reduced: true}); f.load(); f.open();
  const state = () => [f.root.dataset.z, f.root.dataset.landed, mark(f, 'kept') ? 'kept' : '',
    mark(f, 'written') ? 'written' : '', mark(f, 'segment') ? 'segment' : ''].join('/');
  const seen = scene.beats.map(beat => { f.seek(beat); return state(); });
  assert.deepEqual(seen, ['1/true///', '0.5////', '0.5//kept//', '0.5/true/kept/written/', '0.5/true/kept/written/segment',
    '1/true/kept/written/segment', '0/true/kept/written/segment', '0.5/true/kept/written/segment']);
  // The reduced ask is withheld too.
  f.seek(B1 + 2); assert.equal(mark(f, 'new'), null);
});

test('gru blend: the formula washes the part of the gate that acts', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const lit = () => ['gb-keep-lit', 'gb-write-lit'].filter(cls => f.$('[data-formula]').classList.contains(cls)).join(' ');
  const seen = scene.beats.map(beat => { f.seek(beat + 2.5); return lit(); });
  assert.deepEqual(seen, ['', '', 'gb-keep-lit', 'gb-write-lit', '', 'gb-keep-lit', 'gb-write-lit', 'gb-keep-lit gb-write-lit']);
  const css = read('gru-blend/player.css');
  assert.match(css, /#gru-blend-excerpt\[data-ready\] \.gru-blend-formula\.gb-keep-lit \.gb-keep/);
  assert.match(css, /#gru-blend-excerpt\[data-ready\] \.gru-blend-formula\.gb-write-lit \.gb-write/);
});

test('gru blend: every layout keeps its text inside the picture and off its neighbours', t => {
  const check = (f, where) => {
    const [, , W, H] = picture(f).getAttribute('viewBox').split(/\s+/).map(Number);
    const boxes = texts(f).map(node => {
      const size = Number(node.getAttribute('font-size')), anchor = node.getAttribute('text-anchor');
      const w = node.textContent.length * size * 0.56, x = attr(node, 'x'), y = attr(node, 'y');
      const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
      return {left, right: left + w, top: y - size, bottom: y + size * 0.3, text: node.textContent};
    });
    for (const b of boxes) assert(b.left >= -1 && b.right <= W + 1 && b.top >= -1 && b.bottom <= H + 1, `${where} "${b.text}" outside`);
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      assert(Math.min(a.right, b.right) - Math.max(a.left, b.left) <= 1 || Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) <= 1,
        `${where} "${a.text}" and "${b.text}" collide`);
    }
    // Every mark stays inside the picture too.
    for (const node of drawing(f).querySelectorAll('[data-mark]')) {
      const xs = node.tagName === 'circle' ? [attr(node, 'cx') - attr(node, 'r'), attr(node, 'cx') + attr(node, 'r')]
        : node.tagName === 'rect' ? [attr(node, 'x'), attr(node, 'x') + attr(node, 'width')]
          : [...node.getAttribute('d').matchAll(/[MHL]([\d.-]+)/g)].map(m => Number(m[1]));
      assert(Math.min(...xs) >= 0 && Math.max(...xs) <= W, `${where} ${node.getAttribute('data-mark')} outside`);
    }
  };
  for (const width of WIDTHS) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    const offsets = [0, 0.6, 1.2, 1.7, 2.2, 3.5, 4.99];
    for (const time of [...scene.beats.flatMap(b => offsets.map(o => b + o)), scene.duration]) {
      f.seek(Math.min(time, scene.duration)); check(f, `${width}px ${time}s`);
    }
    for (const keep of [0, 0.01, 0.05, 0.37, 0.5, 0.63, 0.95, 0.99, 1]) { drag(f, keep); check(f, `${width}px dragged to ${keep}`); }
  }
});

test('gru blend: seeking is deterministic', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const snap = time => { f.seek(time); return [canonicalMarkup(drawing(f).innerHTML), picture(f).getAttribute('aria-label'), said(f), f.root.dataset.z].join('|'); };
  const times = [0, 5.7, 7, 10.3, 11.2, 13, 15.6, 16.9, 18, 22, 26.1, 29, 31.4, 34, 36, 39];
  assert.deepEqual(times.map(snap), [...times].reverse().map(snap).reverse());
});

test('gru blend: the panel is the one fixture copy', t => {
  const g = fixture(t, NAME);
  // Move the fixture: a candidate below zero, so the written share points left and prints a
  // true minus. Every printed number follows; none of the shipped values survives.
  g.root.dataset.old = '0.6'; g.root.dataset.candidate = '-0.2';
  const k = declared(g); g.load(); g.open(); g.seek(scene.duration);
  const p = printed(k, k.keep);
  assert.equal(value(g, 'kept').textContent, '0.5 × 0.60 = 0.30');
  assert.equal(value(g, 'written').textContent, `0.5 × −0.20 = −0.10`);
  assert.equal(value(g, 'new').textContent, fixed(p.total));
  assert.equal(fixed(p.total), '0.20');
  const x = scale(g, k), written = ends(mark(g, 'written'));
  assert(written.tip < written.tail, 'a negative share points left');
  near(attr(mark(g, 'new'), 'cx'), x(0.2), 0.001, 'the ring follows');
  assert.match(g.$('[data-caption]').textContent, /One dial, two jobs/);
  g.seek(B3 + 1);
  assert.equal(g.$('[data-caption]').textContent, 'What is not kept is written: 0.5 × −0.20 = −0.10 joins at the tip.');
  g.seek(B3 + 3);
  assert.equal(g.$('[data-caption]').textContent, 'The new state lands at that tip: 0.30 − 0.10 = 0.20.');
  assert(!drawing(g).textContent.includes('0.55'));
});

test('gru blend: the committed static print is a fresh render of the final frame', async () => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after, 'run scripts/render_static_frames.cjs gru-blend');
});

test('gru blend: typography, reader-facing words and inertness', t => {
  const panel = read('gru-blend/panel.html'), player = read('gru-blend/player.js');
  assert.doesNotMatch(panel, /@eq-|—/);
  assert.doesNotMatch(player, /Math\.random|fetch\(|import\(|setInterval\(/);
  assert.equal((player.match(/getBoundingClientRect/g) || []).length, 1);
  const f = fixture(t, NAME);
  // Both static prints: true minus, no e-notation, the accent on its glyph alone.
  const staticTexts = [...f.root.querySelectorAll('[data-figure] svg text')];
  assert(staticTexts.some(node => node.closest('[data-static-frame="narrow"]')), 'the narrow print is present');
  const bad = /\de[-+]?\d|(?<![\w.])-\d|\d-\d/;
  for (const node of staticTexts) assert.doesNotMatch(node.textContent, bad, `static "${node.textContent}"`);
  const accents = staticTexts.flatMap(node => [...node.querySelectorAll('tspan')]).filter(span => span.textContent.includes('̃'));
  assert.equal(accents.length, 2, 'the candidate\'s name in both prints');
  for (const span of accents) { assert.equal(span.getAttribute('class'), 'mechanism-accent'); assert.equal(span.textContent, 'h̃'); }
  // Reader-facing words: the static prose, every caption and every description the player
  // writes, sampled over the timeline and the dial.
  const visible = node => { const copy = node.cloneNode(true); copy.querySelectorAll('script, style, code, [id^="eq-"], .math').forEach(n => n.remove()); return copy.textContent; };
  const prose = [f.$('summary').textContent, f.$('.mechanism-question').textContent, f.$('.mechanism-intro').textContent,
    visible(f.$('.mechanism-boundary')), visible(f.$('.mechanism-check')), visible(f.$('.mechanism-transcript')),
    f.$('[data-caption]').textContent, f.$('[data-pane]').getAttribute('aria-label'), f.$('dialog').getAttribute('aria-label'),
    f.$('[data-load-status]').textContent, f.$('.gb-dial').textContent];
  f.load(); f.open();
  for (const time of steps(0, scene.duration + 0.1, 0.25)) {
    f.seek(time);
    prose.push(f.$('[data-caption]').textContent, picture(f).getAttribute('aria-label'), slider(f).getAttribute('aria-valuetext'),
      scrubber(f).getAttribute('aria-valuetext'), ...texts(f).map(node => node.textContent));
  }
  for (const keep of [0, 0.2, 0.5, 0.83, 1]) { drag(f, keep); prose.push(f.$('[data-caption]').textContent, picture(f).getAttribute('aria-label')); }
  const all = prose.join('\n');
  assert.doesNotMatch(all, /—|!/, 'no em dash, no exclamation mark');
  assert.doesNotMatch(all, /n['’]t\b|['’](re|ve|ll|d|m)\b|\b(it|that|there|what|let|here)['’]s\b/i, 'no contractions');
  assert.doesNotMatch(all, bad, 'a true minus and no e-notation');
  assert.doesNotMatch(all, /\b(recap|section|subsection|table|callout|receipt|ledger)\b/i, 'no apparatus words');
  assert.doesNotMatch(all, /\b(film|lecture|course|students?)\b/i, 'no provenance words');
  // The memory test's prediction and Exercise 3's named wrong answer stay unanswered: no gate
  // values, no biases, no +1 or +2, no leaking, decay or repeated keeps.
  assert.doesNotMatch(all, /0\.73|0\.88|σ|\bbias|\+\s?[12]\b|leak|decay|compound|repeated/i);
  assert.doesNotMatch(all, /Chapter (?!12\b)\d+/, 'a chapter is named by its printed number');
  // One visible boundary sentence; the scope stays closed; the check is the brief's.
  const boundary = f.$('.mechanism-boundary > p').textContent.trim();
  assert.equal(f.root.querySelectorAll('.mechanism-boundary > p').length, 1);
  assert.equal(boundary, 'The values 0.80 and 0.30 are an illustrative toy: a real cell gives every coordinate its own keep, computed by a sigmoid from the input and the old state.');
  assert(boundary.split(/\s+/).length <= 30);
  assert.equal(f.$('details.mechanism-scope').open, false);
  const check = f.$('details.mechanism-check');
  assert.equal(check.querySelector('summary').textContent.trim(),
    'Check yourself. A GRU starts from h0 = 0, and every candidate it writes is a tanh output inside (−1, 1). Can a coordinate of its state ever reach 1.2, whatever the gates do?');
  assert.equal(check.querySelector('p').textContent.trim(),
    'No. Each step lands the new state on the segment between the old state and the candidate, since keep and write are shares of one whole. If both ends lie inside (−1, 1), so does the new state, and from h0 = 0 every state stays inside (−1, 1).');
  assert.equal(f.root.querySelectorAll('#gru-blend-transcript li').length, scene.beats.length);
});

test('integration: the excerpt follows the GRU figure and precedes the reset convention', () => {
  const filter = fs.readFileSync(path.join(ROOT, scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
  assert.doesNotMatch(filter, /gru-blend/);
  const config = fs.readFileSync(path.join(ROOT, '_quarto.yml'), 'utf8');
  assert.match(config, /^\s+- interactives\/gru-blend\/player\.js$/m);
  assert.deepEqual(scene.anchor, {type: 'after-cell', target: 'cell-fig-gru-cell'});
  const lines = chapterSource(NAME).split('\n');
  const labels = lines.flatMap((line, i) => (/^#\|\s*label:\s*fig-gru-cell\s*$/.test(line) ? [i] : []));
  assert.equal(labels.length, 1, 'the figure cell is labelled once');
  let fence = labels[0];
  while (!/^```\s*$/.test(lines[fence])) fence++;
  let next = fence + 1;
  while (!lines[next].trim()) next++;
  assert.match(lines[next], /^One convention matters before you compare code\./, 'the panel lands between the figure and this paragraph');
});
