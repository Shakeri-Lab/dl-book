#!/usr/bin/env node
// Test-only JSDOM. No dependency from this file enters the published book.
// The JSDOM fixture, the markup canonicaliser, and the transport, beat-hold and grammar
// suites this scene inherits live in scripts/html-tests/excerpt-harness.cjs. What stays here
// is the part no harness can supply: this scene's arithmetic -- @eq-lstm's last two lines,
// c_t = f (*) c_{t-1} + i (*) c~_t and h_t = o (*) tanh(c_t), recomputed here at every
// scrubbed time and never through the player -- the two claims the panel exists to make
// (shutting the read valve zeroes h_t and leaves c_t untouched; shutting the forget valve
// erases the old content while the write valve still writes), the honesty constraint that
// the three openings are declared illustrative and the chapter's measured gate means are
// never drawn, the shape of its one picture, its typeset formula and the class toggles the
// player applies. JSDOM never typesets, so the formula assertions read the TeX source, the
// eq- ids, the \class{} names and the root classes, never rendered math.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {read, manifest, entry, chapterSource, numbers, canonicalMarkup,
  fixture, registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'lstm-valves-excerpt';
const scene = entry(NAME);
// The harness lays nothing out, so the figure's width is declared: the wide layout, which is
// the one the static frame is drawn in. One test drives the narrow layout explicitly.
const WIDE = 700, NARROW = 360;
// The wide picture's geometry, stated here from the picture's own design (player.js
// LAYOUT.wide) so every drawn coordinate is checked against numbers this suite owns.
const G = {viewBox: '0 0 712 376', beltY: 92, branchY: 250, unit: 56, barW: 26, port: 54, plusR: 18,
  inlet: 76, fValve: 172, mid: 252, plus: 352, tap: 424, ctOut: 508, ctilde: 76, iValve: 232,
  riser: 352, oValve: 576, hOut: 664, valueGap: 11};
const NARROW_G = {viewBox: '0 0 360 350', width: 360, height: 350, beltY: 70, branchY: 204,
  unit: 38, barW: 18, inlet: 36, mid: 124, ctOut: 252, hOut: 328, ctilde: 36, valueGap: 12};

// Read the declared fixture from the closed panel. The panel is the one in-repo mirror of
// this scene's numbers; everything below is computed from it, so no value is typed twice.
function declared(f) {
  assert(!f.root.dataset.ready, 'read the declared fixture before the player mounts');
  return {
    carry: Number(f.root.dataset.carry), candidate: Number(f.root.dataset.candidate),
    openings: numbers(f.root.dataset.openings), measured: numbers(f.root.dataset.measured),
    stops: {f: numbers(f.root.dataset.forget), i: numbers(f.root.dataset.input), o: numbers(f.root.dataset.output)}
  };
}

// This suite's own cell, deliberately not the player's: the independent recomputation every
// arithmetic assertion below is checked against. These are @eq-lstm's last two lines.
const cellState = (fx, f, i) => f * fx.carry + i * fx.candidate;
const hiddenState = (fx, f, i, o) => o * Math.tanh(cellState(fx, f, i));
const two = value => (Math.abs(value) < 5e-5 ? 0 : value).toFixed(2);
const gates = f => numbers(f.root.dataset.gates);
const cell = f => Number(f.root.dataset.cell);
const hid = f => Number(f.root.dataset.hidden);
const packetX = f => Number(f.root.dataset.packet);
const carried = f => Number(f.root.dataset.carried);
const value = (f, name) => { const node = f.root.querySelector(`[data-value="${name}"]`); return node ? node.textContent : null; };
const mark = (f, name) => f.root.querySelector(`[data-mark="${name}"]`);
const valveNode = (f, key) => f.root.querySelector(`[data-valve="${key}"]`);
const tex = (f, n) => f.d.getElementById(`eq-lstm-valves-${n}`).textContent;
const drawing = f => f.$('[data-drawing]').innerHTML;
const classes = f => new Set([...f.root.classList]);
const caption = f => f.$('[data-caption]');
// The height a bar actually draws, in value units: a rect's height, or zero for the tick a
// zero-valued mark leaves on its lane.
const barValue = (node, g = G) => {
  if (!node) return null;
  if (node.tagName.toLowerCase() === 'rect') return Number(node.getAttribute('height')) / g.unit;
  return 0;
};
const times = (step = 0.05) => {
  const out = [];
  for (let t = 0; t <= scene.duration + 1e-9; t += step) out.push(Number(t.toFixed(4)));
  return out;
};
const css = read(`${scene.scene}/player.css`);
const [B0, B1, B2, B3, B4, B5, B6, B7] = scene.beats;

registerTransportTests(NAME, {
  witness: /unchanged/,
  anchors: ['lstm-valves-playback-help'],
  width: WIDE
});
// One drawn state per whole beat under reduced motion, not just at the boundaries: the three
// openings and the carried bar's station are the quantities most likely to keep moving.
registerBeatHoldTest(NAME);
// One picture, one formula line, one caption; TeX never rewritten; one guarded typeset.
registerGrammarTests(NAME);

test('valves: the declared attributes mirror @eq-lstm, and every opening is one of the three declared illustrative values', t => {
  const f = fixture(t, NAME);
  const fx = declared(f);
  const chapter = chapterSource(NAME);
  // The chapter owns the equation; this panel owns only the illustrative numbers it runs it
  // on. Both halves are checked: the equation is the chapter's own text, and the chapter
  // prints no opening for the panel to have copied.
  assert(chapter.includes('\\vect{c}_t &= \\vect{f}_t \\odot \\vect{c}_{t-1} \\;+\\; \\vect{i}_t \\odot \\tilde{\\vect{c}}_t'), '@eq-lstm no longer writes the cell-state update this panel draws');
  assert(chapter.includes('\\vect{h}_t &= \\vect{o}_t \\odot \\tanh(\\vect{c}_t).'), '@eq-lstm no longer writes the read line this panel draws');
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal), `literal missing: ${literal.slice(0, 44)}`);
  // The declared illustrative set, and the proof that the three valves stand nowhere else.
  assert.deepEqual(fx.openings, [1, 0.5, 0]);
  assert.deepEqual(fx.stops, {f: [1, 0.5], i: [0, 1], o: [0, 0.5, 0]});
  const used = new Set([...fx.stops.f, ...fx.stops.i, ...fx.stops.o]);
  assert.deepEqual([...used].sort((a, b) => b - a), [...fx.openings].sort((a, b) => b - a),
    'the openings the three valves actually take must be exactly the declared illustrative set');
  for (const [key, stops] of Object.entries(fx.stops)) {
    for (const stop of stops) assert(fx.openings.includes(stop), `valve ${key} stands at ${stop}, which is not declared`);
  }
  assert.equal(fx.carry, 1); assert.equal(fx.candidate, 0.5);
  // An illustrative number is one the chapter does not print. Around @eq-lstm the chapter
  // prints no gate value at all, which is the whole reason these are declared.
  const section = chapter.slice(chapter.indexOf('the **Long Short-Term Memory** cell'), chapter.indexOf('{#eq-lstm-highway}'));
  for (const printed of ['0.50', '1.00', '0.38', 'f_t =', '= 0.5']) assert(!section.includes(printed), `the chapter prints ${printed}, so it would not be an illustrative value`);
  // The panel says so, in the reader's own words, in three places.
  assert.match(f.$('.mechanism-intro').textContent, /illustrative/);
  assert.match(f.$('.mechanism-boundary').textContent, /The three openings are illustrative, not measured/);
  assert(drawing(f).includes('illustrative openings'), 'the picture itself must say the openings are illustrative');
});

test('valves: at every scrubbed time c_t = f c_{t-1} + i c-tilde and h_t = o tanh(c_t), recomputed here', t => {
  const f = fixture(t, NAME);
  const fx = declared(f); f.load(); f.open();
  let checked = 0, turning = 0;
  for (const time of times(0.05)) {
    f.seek(time);
    const [gf, gi, go] = gates(f);
    // Independent recomputation: this suite's own cell, from the openings the player
    // publishes, never from anything the player computed.
    const ct = cellState(fx, gf, gi), ht = hiddenState(fx, gf, gi, go);
    assert(Math.abs(cell(f) - ct) < 2e-6, `c_t at ${time}s: ${cell(f)} vs ${ct}`);
    assert(Math.abs(hid(f) - ht) < 2e-6, `h_t at ${time}s: ${hid(f)} vs ${ht}`);
    // Every opening stays inside the declared range at every instant, turning or not.
    for (const g of [gf, gi, go]) assert(g >= -1e-12 && g <= 1 + 1e-12, `an opening left (0,1) at ${time}s`);
    if ([gf, gi, go].some(g => !fx.openings.some(v => Math.abs(v - g) < 1e-9))) turning++;
    // The hidden state never exceeds what the read valve admits of a bounded tanh.
    assert(Math.abs(ht) <= go + 1e-12, `h_t above its own valve at ${time}s`);
    // And the numbers written on the picture are these, to two decimals.
    const stage = Number(f.root.dataset.stage);
    if (stage >= 1) {
      assert.equal(value(f, 'f'), two(gf)); assert.equal(value(f, 'i'), two(gi)); assert.equal(value(f, 'o'), two(go));
      assert.equal(value(f, 'h'), two(ht), `the hidden state's printed value at ${time}s`);
      assert.equal(value(f, 'ctilde'), two(fx.candidate));
    }
    checked++;
  }
  assert(checked > 780 && turning > 100, `${checked} times checked, ${turning} turning`);
  // The witness values at the beats, each recomputed rather than typed.
  const at = (beat, ef, ei, eo) => {
    f.seek(beat);
    assert.deepEqual(gates(f).map(v => Number(v.toFixed(6))), [ef, ei, eo], `openings at ${beat}s`);
    assert.equal(two(cell(f)), two(cellState(fx, ef, ei))); assert.equal(two(hid(f)), two(hiddenState(fx, ef, ei, eo)));
  };
  at(B1, 1, 0, 0); at(B2, 1, 0, 0); at(B3, 0.5, 0, 0); at(B4, 0.5, 1, 0); at(B5, 0.5, 1, 0.5); at(B6, 0.5, 1, 0); at(B7, 0.5, 1, 0);
  f.seek(scene.duration);
  assert.equal(two(cell(f)), '1.00'); assert.equal(two(hid(f)), '0.00');
  f.seek(B5); assert.equal(two(hid(f)), '0.38'); assert.equal(two(cell(f)), '1.00');
});

test('valves: closing the read valve sends h_t to zero and leaves c_t bit-for-bit unchanged', t => {
  const f = fixture(t, NAME);
  const fx = declared(f); f.load(); f.open();
  // The claim, as arithmetic: o appears in the read line and nowhere in the cell-state line.
  for (const ff of [0, 0.5, 1]) for (const ii of [0, 0.5, 1]) {
    assert.equal(hiddenState(fx, ff, ii, 0), 0, 'o = 0 must zero h_t for every other opening');
    assert.equal(cellState(fx, ff, ii), cellState(fx, ff, ii), 'c_t does not read o');
  }
  // And as the drawn picture, across the beat that shuts it: the cell state holds the value it
  // had before the valve began to close, to the last bit, while the hidden state falls to zero.
  f.seek(B5 - 1e-4);
  const before = cell(f), openH = hid(f), drawnBelt = mark(f, 'packet').getAttribute('height');
  assert(openH > 0.3, `the read valve must be open before it shuts, not ${openH}`);
  let fell = 0;
  for (const time of times(0.05)) {
    if (time < B5) continue;
    f.seek(time);
    assert.equal(cell(f), before, `the cell state moved at ${time}s while the read valve was shutting`);
    assert.equal(mark(f, 'packet').getAttribute('height'), drawnBelt, `the drawn belt bar moved at ${time}s`);
    if (hid(f) < openH - 1e-9) fell++;
  }
  assert(fell > 80, `${fell} frames of falling`);
  f.seek(B6);
  assert.equal(gates(f)[2], 0); assert.equal(hid(f), 0);
  assert.equal(cell(f), before);
  assert.equal(value(f, 'h'), '0.00'); assert.equal(value(f, 'belt'), two(before));
  // The picture says it: the belt's bar is tagged, and a dashed mark holds the height the
  // hidden state stood at, drawn only because it clears the bar it is a ghost of.
  const held = f.root.querySelector('[data-held]');
  assert(held && held.textContent === 'unchanged');
  const ghost = mark(f, 'h-ghost');
  assert(ghost, 'the hidden state leaves a dashed mark where it stood');
  assert(Math.abs(barValue(ghost) - openH) < 5e-4, 'the ghost stands at the open height');
  assert((barValue(ghost) - barValue(mark(f, 'hidden'))) * G.unit >= 6, 'a ghost is drawn only where it clears its mark');
  // Before the valve opens at all there is no ghost, and none while it is still nearly open.
  f.seek(B4); assert.equal(mark(f, 'h-ghost'), null);
  f.seek(B5 + 0.05); assert.equal(mark(f, 'h-ghost'), null, 'a ghost that has not cleared its mark is not drawn');
});

test('valves: with the forget valve shut the old content is gone, and the write valve still writes', t => {
  const f = fixture(t, NAME);
  // Not a manuscript edit and not a second fixture: the panel's declared stops are re-declared
  // so the mechanism is exercised at the third declared opening, 0.0, on the valve the timeline
  // only half closes. Everything else -- the equation, the drawing, the captions -- is the same.
  f.root.dataset.forget = '1.0 0.0';
  const fx = declared(f); f.load(); f.open();
  f.seek(B3);
  assert.equal(gates(f)[0], 0, 'the forget valve is shut');
  assert.equal(cell(f), 0, 'with nothing written yet and the forget valve shut, the belt is empty');
  f.seek(scene.duration);
  const [gf, gi, go] = gates(f);
  assert.equal(gf, 0); assert.equal(gi, 1); assert.equal(go, 0);
  // The old content is gone: c_t no longer contains c_{t-1} at all.
  assert.equal(cell(f), fx.candidate);
  assert.equal(cell(f), cellState(fx, 0, 1));
  assert.equal(cell(f) - 1 * fx.candidate, 0, 'what remains is exactly the written candidate');
  assert.notEqual(cell(f), fx.carry);
  assert.equal(value(f, 'belt'), '0.50');
  // The drawn bar is the written candidate, not the carried one, and the inlet's ghost still
  // records what entered -- the erasure is visible as a difference between the belt's two ends.
  assert(Math.abs(barValue(mark(f, 'packet')) - fx.candidate) < 5e-4);
  assert(Math.abs(barValue(mark(f, 'inlet-ghost')) - fx.carry) < 5e-4);
  assert.match(caption(f).textContent, /is not erased by closing the one that reads/);
  // And the caption's own arithmetic followed the moved fixture.
  f.seek(B2); assert.match(caption(f).textContent, /falls from 1\.00 to 0\.00/);
  f.seek(B3); assert.match(caption(f).textContent, /the belt reads 0\.50/);
});

test('valves: a valve already standing part-open squeezes what passes through it', t => {
  // The default trajectory opens each valve inside its own beat, after the bar has passed the
  // forget valve, so the squeeze AT a valve is never exercised. Re-declaring the stops -- still
  // only to declared illustrative openings -- runs the same picture with the forget valve
  // already half shut and the write valve opening only halfway, which is where the rule "the
  // bar is whatever the lane holds where it stands" has something to say.
  const f = fixture(t, NAME);
  f.root.dataset.forget = '0.5 0.0'; f.root.dataset.input = '0.0 0.5';
  const fx = declared(f); f.load(); f.open();
  let inside = 0, before = 0, after = 0;
  for (const time of times(0.02)) {
    if (time >= B2) break;
    f.seek(time);
    const x = packetX(f), v = carried(f), gf = gates(f)[0];
    assert.equal(gf, 0.5, `the forget valve is already half shut at ${time}s`);
    if (x < G.fValve - G.port / 2) { assert(Math.abs(v - fx.carry) < 2e-6, `upstream of a half-shut valve at ${time}s`); before++; }
    else if (x > G.fValve + G.port / 2) { assert(Math.abs(v - 0.5 * fx.carry) < 2e-6, `downstream of a half-shut valve at ${time}s`); after++; }
    else {
      // Inside the port the bar is the declared blend between what entered and what the valve
      // passes, so the squeeze happens AT the valve and not somewhere either side of it.
      const u = (x - (G.fValve - G.port / 2)) / G.port;
      const expected = fx.carry + (0.5 * fx.carry - fx.carry) * u;
      assert(Math.abs(v - expected) < 2e-4, `inside the valve at ${time}s: ${v} vs ${expected}`);
      inside++;
    }
  }
  assert(before > 5 && inside > 3 && after > 5, `${before} before, ${inside} inside, ${after} after`);
  // And it is a squeeze, not a step: somewhere inside the port the bar stands strictly between
  // what entered and what leaves.
  const crossing = [];
  for (const time of times(0.02)) { if (time >= B2) break; f.seek(time); const x = packetX(f); if (Math.abs(x - G.fValve) < G.port / 2 - 1) crossing.push(carried(f)); }
  assert(crossing.some(v => v < fx.carry - 1e-3 && v > 0.5 * fx.carry + 1e-3), `the bar steps rather than squeezes: ${crossing.join(', ')}`);
  f.seek(B2); assert(Math.abs(carried(f) - 0.5 * fx.carry) < 2e-6, 'the bar leaves the valve at half what entered');
  // The same rule on the write branch: the candidate's copy is the candidate before the write
  // valve and the gated candidate after it, and the two differ when the valve is half open.
  let gated = 0, ungated = 0;
  for (const time of times(0.02)) {
    if (time < B3 || time >= B4) continue;
    f.seek(time);
    const written = mark(f, 'written');
    if (!written) continue;
    const x = Number(written.getAttribute('x')) + G.barW / 2, v = barValue(written), gi = gates(f)[1];
    assert.equal(gi, 0.5, `the write valve stands half open at ${time}s`);
    if (x < G.iValve - G.port / 2) { assert(Math.abs(v - fx.candidate) < 5e-4, `ungated copy at ${time}s`); ungated++; }
    if (x > G.iValve + G.port / 2) { assert(Math.abs(v - 0.5 * fx.candidate) < 5e-4, `gated copy at ${time}s`); gated++; }
  }
  assert(ungated > 3 && gated > 3, `${ungated} ungated, ${gated} gated frames`);
  f.seek(scene.duration);
  assert.equal(cell(f), cellState(fx, 0, 0.5)); assert.equal(value(f, 'belt'), '0.25');
  assert.equal(hid(f), 0);
});

test('valves: the carried bar rides the belt and is whatever the belt holds where it stands', t => {
  const f = fixture(t, NAME);
  const fx = declared(f); f.load(); f.open();
  const stations = [];
  let moved = 0;
  for (const time of times(0.05)) {
    f.seek(time);
    const x = packetX(f), v = carried(f), [gf, gi] = gates(f);
    const stage = Number(f.root.dataset.stage);
    assert(x >= G.inlet - 1e-6 && x <= G.ctOut + 1e-6, `the bar left the belt at ${time}s`);
    // Upstream of the forget valve it is what entered; between the valve and the sum it is the
    // forgotten remainder; past the sum it is the cell state. Inside a node it is between the
    // two, which is the node acting on it.
    if (x <= G.fValve - G.port / 2) assert(Math.abs(v - fx.carry) < 2e-6, `upstream content at ${time}s`);
    else if (x >= G.fValve + G.port / 2 && x <= G.plus - G.plusR) assert(Math.abs(v - gf * fx.carry) < 2e-6, `mid-belt content at ${time}s`);
    else if (x >= G.plus + G.plusR) assert(Math.abs(v - cellState(fx, gf, gi)) < 2e-6, `outlet content at ${time}s`);
    else assert(v >= Math.min(fx.carry, gf * fx.carry) - 1e-9 && v <= Math.max(fx.carry, cellState(fx, gf, gi)) + 1e-9, `content inside a node at ${time}s`);
    // The drawn bar is that number, to the unit the picture declares, and its printed value
    // is the same number to two decimals.
    const bar = mark(f, 'packet');
    assert(Math.abs(barValue(bar) - v) < 5e-4, `the drawn bar is not the content at ${time}s`);
    if (bar.tagName.toLowerCase() === 'rect') assert.equal(Number(bar.getAttribute('x')), Number((x - G.barW / 2).toFixed(2)), `the bar is off its station at ${time}s`);
    assert.equal(value(f, 'belt'), two(v));
    if (stations.length && Math.abs(stations.at(-1) - x) > 1e-9) moved++;
    stations.push(x);
    // The ghost at the inlet appears only once the bar has cleared it.
    assert.equal(Boolean(mark(f, 'inlet-ghost')), stage >= 1 && x - G.inlet > 2 * G.barW, `inlet ghost at ${time}s`);
    // A ghost and the bar it is a ghost of never touch, and neither do the numbers above them.
    if (mark(f, 'inlet-ghost')) {
      const bar = mark(f, 'packet');
      if (bar.tagName.toLowerCase() === 'rect') assert(Number(bar.getAttribute('x')) - (G.inlet + G.barW / 2) >= G.barW - 1e-6, `the inlet ghost is closer than a bar's width at ${time}s`);
    }
  }
  assert(moved > 90, `${moved} frames of travel`);
  assert(stations.every((x, k) => k === 0 || x >= stations[k - 1] - 1e-9), 'the bar never travels backwards');
  // Three stations, in order: the inlet, mid-belt, the outlet.
  f.seek(B0); assert.equal(packetX(f), G.inlet);
  f.seek(B2); assert.equal(packetX(f), G.mid); assert.equal(carried(f), fx.carry);
  f.seek(B3); assert.equal(packetX(f), G.mid); assert.equal(carried(f), fx.stops.f[1] * fx.carry);
  f.seek(B4); assert.equal(packetX(f), G.ctOut); assert.equal(carried(f), cellState(fx, fx.stops.f[1], fx.stops.i[1]));
  assert(new Set(stations.map(x => x.toFixed(2))).size > 60, 'the travel is continuous, not stepped');
  // The candidate's copy crosses its own valve while the write valve is open, and is the
  // gated candidate once past it.
  let wrote = 0;
  for (const time of times(0.05)) {
    f.seek(time);
    const written = mark(f, 'written');
    if (!written) continue;
    wrote++;
    const x = Number(written.getAttribute('x')) + G.barW / 2, v = barValue(written), gi = gates(f)[1];
    assert(x >= G.ctilde - 1e-6 && x <= G.riser + 1e-6, `the written copy left its branch at ${time}s`);
    if (x >= G.iValve + G.port / 2) assert(Math.abs(v - gi * fx.candidate) < 5e-4, `the written copy is not the gated candidate at ${time}s`);
    if (x <= G.iValve - G.port / 2) assert(Math.abs(v - fx.candidate) < 5e-4, `the written copy is not the candidate at ${time}s`);
  }
  assert(wrote > 20, `${wrote} frames of the candidate travelling`);
});

test('valves: each valve turns only inside its own beat, from one declared opening to the next', t => {
  const f = fixture(t, NAME);
  const fx = declared(f); f.load(); f.open();
  const windows = {f: [B2, B3], i: [B3, B4], o: [B4, B6]};
  const seen = {f: new Set(), i: new Set(), o: new Set()};
  let previous = null;
  for (const time of times(0.05)) {
    f.seek(time);
    const now = {f: gates(f)[0], i: gates(f)[1], o: gates(f)[2]};
    if (previous) {
      for (const key of ['f', 'i', 'o']) {
        const [from, to] = windows[key];
        if (now[key] !== previous[key]) assert(time > from && time <= to + 1e-9, `valve ${key} moved at ${time}s, outside [${from}, ${to}]`);
      }
    }
    previous = now;
    for (const key of ['f', 'i', 'o']) seen[key].add(now[key]);
    // The vane's angle is the opening: along the flow when open, across it when shut.
    if (Number(f.root.dataset.stage) >= 1) {
      for (const key of ['f', 'i', 'o']) {
        const node = valveNode(f, key), vane = node.querySelector('.lv-vane');
        assert.equal(Number(node.dataset.open).toFixed(4), now[key].toFixed(4));
        const dx = Number(vane.getAttribute('x2')) - Number(vane.getAttribute('x1'));
        const dy = Number(vane.getAttribute('y2')) - Number(vane.getAttribute('y1'));
        const angle = Math.atan2(dy, dx) / (Math.PI / 2);
        assert(Math.abs(angle - (1 - now[key])) < 2e-3, `valve ${key}'s vane does not read its opening at ${time}s`);
      }
    }
  }
  // Monotone within its window: the forget valve only closes, the write valve only opens, and
  // the read valve opens then shuts.
  const track = (key, a, b) => { const out = []; for (let s = a; s <= b; s += 0.05) { f.seek(Number(s.toFixed(4))); out.push(gates(f)[{f: 0, i: 1, o: 2}[key]]); } return out; };
  const nonIncreasing = list => list.every((v, k) => k === 0 || v <= list[k - 1] + 1e-9);
  assert(nonIncreasing(track('f', B2, B3)), 'the forget valve wavers');
  assert(nonIncreasing(track('i', B3, B4).reverse()), 'the write valve wavers');
  assert(nonIncreasing(track('o', B4, B5).reverse()), 'the read valve wavers as it opens');
  assert(nonIncreasing(track('o', B5, B6)), 'the read valve wavers as it shuts');
  for (const key of ['f', 'i', 'o']) assert(seen[key].size > 20, `valve ${key} jumps rather than turning`);
  assert.deepEqual([...seen.o].filter(v => fx.openings.includes(v)).sort((a, b) => a - b), [0, 0.5]);
});

test('valves: the picture never rests on the chapter\'s measured gate means', t => {
  const f = fixture(t, NAME);
  const fx = declared(f); f.load(); f.open();
  const chapter = chapterSource(NAME);
  // The two numbers are the chapter's, from the fig-forget-gate-diagnostic caption, and they
  // are quoted in the boundary paragraph as that experiment's measurement.
  assert.deepEqual(fx.measured, [0.76, 0.56]);
  assert(chapter.includes('holds its gates flat around 0.76 for all eighty steps'));
  assert(chapter.includes('at about 0.56'));
  const boundary = f.$('.mechanism-boundary').textContent;
  for (const m of fx.measured) assert(boundary.includes(String(m)), `the boundary must quote the measured mean ${m}`);
  assert.match(boundary, /Those are measurements of two trained models, not the openings shown here/);
  // Neither is a declared opening, and no valve ever comes to rest at one.
  for (const m of fx.measured) assert(!fx.openings.some(v => Math.abs(v - m) < 5e-3), `${m} is a declared opening`);
  for (const stops of Object.values(fx.stops)) for (const stop of stops) assert(!fx.measured.some(m => Math.abs(m - stop) < 5e-3), `a valve rests at the measured mean ${stop}`);
  // Neither is ever a state the scene holds. A continuous turn from one declared opening to
  // the next must pass through the numbers between them, so the binding is this: any frame
  // whose picture prints 0.76 or 0.56 is a frame where something is visibly in motion. A
  // frame the scene comes to rest on -- a beat, the state just after it, the end of the
  // timeline, every reduced-motion state, the script-free panel -- never prints either.
  let flashes = 0;
  for (const time of times(0.05)) {
    f.seek(time);
    const drawn = f.$('[data-figure]').textContent;
    if (fx.measured.some(m => drawn.includes(m.toFixed(2)))) {
      flashes++;
      assert.equal(f.root.dataset.moving, 'true', `the picture prints a measured mean at ${time}s while nothing is moving`);
    }
    // No caption ever states one, moving or not.
    for (const m of fx.measured) assert(!caption(f).textContent.includes(m.toFixed(2)), `${m} in a caption at ${time}s`);
  }
  assert(flashes > 0 && flashes < 30, `${flashes} frames pass through a measured mean`);
  const resting = [...scene.beats, ...scene.beats.map(b => b + 0.01), scene.duration];
  for (const time of resting) {
    f.seek(time);
    for (const m of fx.measured) assert(!f.$('[data-figure]').textContent.includes(m.toFixed(2)), `${m} printed at the resting frame ${time}s`);
  }
  const reduced = fixture(t, NAME, {reduced: true}); reduced.load(); reduced.open();
  for (const time of times(0.25)) {
    reduced.seek(time);
    for (const m of fx.measured) assert(!reduced.$('[data-figure]').textContent.includes(m.toFixed(2)), `${m} in a reduced-motion state at ${time}s`);
  }
  const still = fixture(t, NAME);
  for (const m of fx.measured) assert(!still.$('[data-figure]').textContent.includes(m.toFixed(2)), `${m} in the script-free panel`);
  // tanh of the belt is an intermediate the picture deliberately does not number, because
  // tanh(1.00) = 0.76 at rest would be read as the caption's measured mean.
  assert.equal(two(Math.tanh(cellState(fx, fx.stops.f[1], fx.stops.i[1]))), '0.76');
  f.seek(scene.duration);
  assert(!f.$('[data-figure]').textContent.includes('0.76'));
  assert.equal(f.root.querySelector('[data-value="tanh"]'), null, 'the tanh node is an operator, not a numbered value');
  assert.deepEqual([...f.root.querySelectorAll('.lv-op-label, .lv-op-plus')].map(node => node.textContent), ['tanh', '+'], 'the two operator nodes carry a symbol, never a number');
});

test('valves: reduced motion holds every opening and the carried bar at exactly one value per beat', t => {
  const f = fixture(t, NAME, {reduced: true});
  const fx = declared(f); f.load(); f.open();
  const byStage = new Map();
  for (let index = 0; index <= 800; index++) {
    f.seek(index / 20);
    const stage = Number(f.root.dataset.stage);
    if (!byStage.has(stage)) byStage.set(stage, new Set());
    byStage.get(stage).add(`${f.root.dataset.gates}|${f.root.dataset.packet}|${f.root.dataset.carried}`);
    assert.equal(f.root.dataset.moving, 'false', `reduced motion is moving at ${index / 20}s`);
  }
  for (const [stage, set] of byStage) assert.equal(set.size, 1, `reduced motion moves inside beat ${stage}: ${[...set].join(' | ')}`);
  const state = (gf, gi, go, x, v) => `${[gf, gi, go].map(n => n.toFixed(6)).join(' ')}|${x.toFixed(2)}|${v.toFixed(6)}`;
  const states = [...byStage.keys()].sort((a, b) => a - b).map(stage => [...byStage.get(stage)][0]);
  const F = fx.stops.f, I = fx.stops.i, O = fx.stops.o;
  assert.deepEqual(states, [
    state(F[0], I[0], O[0], G.inlet, fx.carry),
    state(F[0], I[0], O[0], G.mid, fx.carry),
    state(F[1], I[0], O[0], G.mid, F[1] * fx.carry),
    state(F[1], I[1], O[0], G.ctOut, cellState(fx, F[1], I[1])),
    state(F[1], I[1], O[1], G.ctOut, cellState(fx, F[1], I[1])),
    state(F[1], I[1], O[2], G.ctOut, cellState(fx, F[1], I[1])),
    state(F[1], I[1], O[2], G.ctOut, cellState(fx, F[1], I[1])),
    state(F[1], I[1], O[2], G.ctOut, cellState(fx, F[1], I[1]))
  ]);
  // Each beat is its end state: the branches fully in, the valves at their stops, the tag up.
  f.seek(B1); assert.equal(f.root.querySelector('[data-built]').getAttribute('opacity'), '1');
  f.seek(B6); assert.equal(f.root.querySelector('[data-states]').getAttribute('opacity'), '1');
  f.seek(B7); assert.equal(f.root.querySelector('foreignObject[data-tag="learned"]').getAttribute('opacity'), '1');
  // Unreduced, the same beats are continuous -- so this is a reduced-motion behaviour, not the
  // scene quietly losing its animation.
  const sliding = fixture(t, NAME); sliding.load(); sliding.open();
  const between = new Set();
  for (let index = 20 * B5; index <= 20 * B6; index++) { sliding.seek(index / 20); between.add(Number(sliding.root.dataset.hidden)); }
  assert(between.size > 30 && [...between].some(h => h > 0.05 && h < 0.35), 'the unreduced close must pass between 0.38 and 0');
});

test('valves: each declared beat advances the stage and toggles exactly its classes', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const has = name => classes(f).has(name);
  const stages = [];
  for (const beat of scene.beats) {
    f.seek(beat);
    stages.push(Number(f.root.dataset.stage));
    assert.deepEqual([...classes(f)].filter(name => /^stage-\d$/.test(name)), [`stage-${stages.at(-1)}`]);
  }
  assert.deepEqual(stages, scene.beats.map((_, index) => index));
  // The pathway is scenery: the belt, the write branch and its riser, the tap and the read
  // lane, the sum, the tanh and the four station names are drawn from the first frame and are
  // the same marks at every beat, so the board the question is asked on is the board the
  // answer arrives on. What the second beat installs is the three valves.
  const scenery = () => ['.lv-lane', '.lv-op-node', '.lv-op-box', '.lv-name'].map(sel => f.root.querySelectorAll(`[data-drawing] ${sel}`).length);
  f.seek(0);
  assert.deepEqual(scenery(), [5, 1, 1, 4], 'the whole pathway is drawn from the first frame');
  assert.equal(f.root.querySelectorAll('[data-valve]').length, 0, 'no valve stands on the board before the beat that installs it');
  for (const beat of scene.beats) { f.seek(beat); assert.deepEqual(scenery(), [5, 1, 1, 4], `the scenery moved by ${beat}s`); }
  f.seek(B1 + 0.01); assert.equal(f.root.querySelectorAll('[data-valve]').length, 3);
  const table = {
    'show-formula': [false, true, true, true, true, true, true, true],
    'wash-f': [false, false, true, false, false, false, false, false],
    'wash-i': [false, false, false, true, false, false, false, false],
    'wash-o': [false, false, false, false, true, true, false, false]
  };
  scene.beats.forEach((beat, index) => {
    f.seek(beat);
    for (const [name, row] of Object.entries(table)) assert.equal(has(name), row[index], `${name} at ${beat}s`);
  });
  // Exactly one gate is ever washed at a time: the formula highlights the valve being discussed.
  for (const time of times(0.25)) {
    f.seek(time);
    assert(['wash-f', 'wash-i', 'wash-o'].filter(has).length <= 1, `two washes at ${time}s`);
  }
  // Every class the player sets has a rule, so toggling it changes something.
  const rule = pattern => assert.match(css, pattern, `player.css lacks ${pattern}`);
  rule(/\.mechanism-excerpt\[data-ready\]:not\(\.show-formula\) \.lv-formula \{ visibility: hidden/);
  rule(/\.mechanism-excerpt\.wash-f \.lv-f,/); rule(/\.mechanism-excerpt\.wash-i \.lv-i,/); rule(/\.mechanism-excerpt\.wash-o \.lv-o \{ background/);
  // Colour = meaning: blue is the book's \featurepart for every carried value, orange its
  // \parameterpart for the one tag that names a learned quantity. Nothing in this scene is a
  // prediction, a target or an error, so none of those colours appears in its stylesheet.
  rule(/--lv-carry: #2b6cb0/); rule(/--lv-parameter: #c05621/); rule(/--lv-ink: #232d4b/);
  rule(/#lstm-valves-excerpt \.lv-carry-role \{ color: var\(--lv-carry\)/);
  rule(/#lstm-valves-excerpt \.lv-gate-role \{ color: var\(--lv-ink\)/);
  rule(/\.lv-bar \{ fill: var\(--lv-carry\)/); rule(/\.lv-port \{[^}]*stroke: var\(--lv-ink\)/);
  rule(/\.lv-tagbox \{[^}]*color: var\(--lv-parameter\)/);
  for (const foreign of ['#2f855a', '#805ad5', '#7950b8', '#722f37', '#722F37', '#9b2c4c', '#B45309', '#b45309']) assert(!css.includes(foreign), `${foreign} in player.css`);
});

test('valves: the two formulas are TeX in eq- wrappers with the book\'s macros, and playback never rewrites them', t => {
  const f = fixture(t, NAME);
  const ids = [1, 2].map(n => `eq-lstm-valves-${n}`);
  for (const id of ids) {
    const span = f.d.getElementById(id);
    assert(span, `${id} missing`);
    assert.match(span.textContent.trim(), /^\\\([\s\S]+\\\)$/, `${id} is not \\( … \\)`);
  }
  const line = tex(f, 1);
  assert(line.includes('\\begin{aligned}') && line.includes('\\\\ \\featurepart{\\vect{h}_t}'),
    'separate the complete state and read equations instead of wrapping inside a product');
  // The formula is @eq-lstm's last two lines: every carried quantity in \featurepart, every
  // valve in a \class{} the player can wash, and the chapter's own \odot and \tanh.
  for (const part of ['\\featurepart{\\vect{c}_t}', '\\featurepart{\\vect{c}_{t-1}}', '\\featurepart{\\tilde{\\vect{c}}_t}', '\\featurepart{\\vect{h}_t}']) assert(line.includes(part), `${part} missing from the formula`);
  for (const [cls, gate] of [['lv-f', 'f'], ['lv-i', 'i'], ['lv-o', 'o']]) assert(line.includes(`\\class{${cls}}{\\vect{${gate}}_t}`), `\\class{${cls}} does not wrap the ${gate} valve`);
  assert.equal(line.match(/\\odot/g).length, 3); assert(line.includes('\\tanh(\\featurepart{\\vect{c}_t})'));
  // The one orange mark in the scene is the tag that names the learned weight matrices.
  assert(tex(f, 2).includes('\\parameterpart{\\matr{W}_f,\\ \\matr{W}_i,\\ \\matr{W}_o}'));
  const all = ids.map(id => f.d.getElementById(id).textContent).join('\n');
  assert(!all.includes('\\predictionpart') && !all.includes('\\targetpart') && !all.includes('\\residualpart'), 'a colour this scene has no quantity for');
  assert.deepEqual(all.match(/\d/g), ['1'], 'the only digit in a formula is the subscript of c_{t-1}: every live number is text on the picture');
  f.load(); f.open();
  const sources = ids.map(id => f.d.getElementById(id).textContent);
  for (const time of times(0.1)) {
    f.seek(time);
    ids.forEach((id, n) => assert.equal(f.d.getElementById(id).textContent, sources[n], `${id} rewritten at ${time}s`));
    assert.equal(f.root.querySelectorAll('span[id^="eq-"]').length, 2);
  }
});

test('valves: captions are prose within the budget, coloured by meaning, and the pane carries no chrome', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const fx = declared(fixture(t, NAME));
  assert.equal(f.root.querySelectorAll('.mechanism-stages').length, 0, 'no stage strip');
  assert.equal(f.root.querySelectorAll('[data-pane] dl, [data-pane] table, [data-pane] section').length, 0, 'no cards, no tables');
  const seenRoles = new Set();
  for (const time of times(0.05)) {
    f.seek(time);
    const html = caption(f).innerHTML, text = caption(f).textContent.trim();
    assert.doesNotMatch(html, /<sup|<sub|\^|\bexp\(|\bsigma\(/i, `pseudo-math in the caption at ${time}s: ${html}`);
    const words = text.split(/\s+/).filter(Boolean).length;
    assert(words > 0 && words <= 20, `caption at ${time}s has ${words} words`);
    for (const role of ['lv-carry-role', 'lv-gate-role']) if (html.includes(`class="${role}"`)) seenRoles.add(role);
    assert.doesNotMatch(f.$('[data-pane]').textContent, /beat \d/i, `stage chrome in the pane at ${time}s`);
  }
  assert.deepEqual([...seenRoles].sort(), ['lv-carry-role', 'lv-gate-role']);
  // The numbers a caption states are the ones the picture has drawn.
  f.seek(B0); assert.match(caption(f).textContent, /rides in at 1\.00/);
  f.seek(B1); assert.match(caption(f).textContent, /Forget stands wide open, so nothing intervenes/);
  f.seek(B2); assert.match(caption(f).textContent, /falls from 1\.00 to 0\.50/);
  f.seek(B3); assert.match(caption(f).textContent, /candidate 0\.50 joins at the sum, and the belt reads 1\.00/);
  f.seek(B4); assert.match(caption(f).textContent, /hidden state is 0\.38/);
  f.seek(B5); assert.match(caption(f).textContent, /falls to 0\.00 while the belt still holds 1\.00/);
  f.seek(B6); assert.match(caption(f).textContent, /cell state 1\.00, long-term; the hidden state 0\.00, working/);
  f.seek(B7); assert.match(caption(f).textContent, /valves are learned/);
  assert.equal(two(hiddenState(fx, fx.stops.f[1], fx.stops.i[1], fx.stops.o[1])), '0.38');
  // The scrubber's own wording never repeats the caption.
  const range = f.$('[data-controls] input[type=range]');
  f.seek(B5); assert.match(range.getAttribute('aria-valuetext'), /Close\. Valves 0\.50, 1\.00, 0\.50\. Cell state 1\.00, hidden state 0\.38\./);
  f.seek(scene.duration); assert.match(range.getAttribute('aria-valuetext'), /Hold\. Valves 0\.50, 1\.00, 0\.00\./);
});

test('valves: the static fallback prints the final frame with every witness value', t => {
  const f = fixture(t, NAME);
  const fx = declared(f);
  // Read before any script runs: the script-free panel is already the whole witness.
  assert.equal(value(f, 'carry'), two(fx.carry)); assert.equal(value(f, 'ctilde'), two(fx.candidate));
  assert.equal(value(f, 'f'), two(fx.stops.f[1])); assert.equal(value(f, 'i'), two(fx.stops.i[1])); assert.equal(value(f, 'o'), two(fx.stops.o[2]));
  assert.equal(value(f, 'belt'), two(cellState(fx, fx.stops.f[1], fx.stops.i[1])));
  assert.equal(value(f, 'h'), two(hiddenState(fx, fx.stops.f[1], fx.stops.i[1], fx.stops.o[2])));
  assert.deepEqual([value(f, 'belt'), value(f, 'h'), value(f, 'carry')], ['1.00', '0.00', '1.00']);
  assert(f.root.querySelector('[data-held]') && mark(f, 'h-ghost') && mark(f, 'inlet-ghost') && mark(f, 'packet'));
  assert.equal(f.$('[data-drawing]').querySelectorAll('[data-valve]').length, 3);
  assert(!drawing(f).includes('·'), 'the final frame withholds nothing');
  assert.match(f.root.className, /\bstage-7\b/); assert.match(f.root.className, /\bshow-formula\b/);
  for (const wash of ['wash-f', 'wash-i', 'wash-o']) assert.doesNotMatch(f.root.className, new RegExp(`\\b${wash}\\b`));
});

test('valves: no-script readouts are exactly the readouts at the end of the timeline', t => {
  const f = fixture(t, NAME);
  const readouts = () => [
    canonicalMarkup(drawing(f)), caption(f).innerHTML,
    [...classes(f)].sort().join(' '),
    f.$('.lv-figure svg').getAttribute('viewBox'), f.$('.lv-figure svg').getAttribute('aria-label'),
    f.$('.lv-figure svg title').textContent,
    ...[...f.root.querySelectorAll('foreignObject')].map(node => `${node.dataset.tag}@${node.getAttribute('x')},${node.getAttribute('y')},${node.getAttribute('opacity')}`)
  ];
  const before = readouts();
  f.load(); f.seek(scene.duration);
  assert.deepEqual(readouts(), before);
  assert(before[0].includes('data-value="belt">1.00<') && before[0].includes('data-value="o">0.00<'), 'the static drawing carries the witness values');
});

test('valves: the static panel differs from the t = 40 render only where script must add', t => {
  const f = fixture(t, NAME);
  const pane = f.$('[data-pane]');
  const strip = html => {
    const box = f.w.document.createElement('div');
    box.innerHTML = html;
    box.querySelectorAll('[data-controls], [data-static-frame]').forEach(node => node.remove());
    return canonicalMarkup(box.innerHTML);
  };
  const before = strip(pane.innerHTML);
  f.load(); f.seek(scene.duration);
  assert.equal(strip(pane.innerHTML), before, 'script changed the panel somewhere the receipt does not name');
  assert.equal(pane.querySelector('[data-controls]').hidden, false);
  assert.equal(f.root.dataset.ready, 'true');
});

test('valves: the static frame in panel.html is the player\'s own t = 40 drawing', async () => {
  const {file, before, after} = await staticFrame(NAME);
  assert.equal(after, before, `${path.relative(path.join(__dirname, '..'), file)} is stale: run node scripts/render_static_frames.cjs ${scene.scene}`);
  assert.match(before, /<!-- static-frame[^>]*-->\s*<g data-drawing>[\s\S]*?<\/g>\s*<!-- \/static-frame -->/);
});

test('valves: the script-free narrow print matches the live phone frame and is removed on mount', t => {
  const f = fixture(t, NAME);
  const svg = f.$('.lv-figure svg'), narrow = svg.querySelector('[data-static-frame="narrow"]');
  assert(narrow, 'a phone fallback must exist before the scene script loads');
  assert.equal(svg.getAttribute('preserveAspectRatio'), 'xMinYMin meet');
  assert.equal(narrow.dataset.width, '360'); assert.equal(narrow.dataset.height, '350');
  assert.equal(narrow.getAttribute('transform'), `scale(${(712 / 360).toFixed(4)})`);
  assert.equal(narrow.querySelectorAll('[data-valve]').length, 3);
  assert.equal(narrow.querySelector('[data-value="belt"]').textContent, '1.00');
  assert.equal(narrow.querySelector('[data-value="h"]').textContent, '0.00');
  const n = fixture(t, NAME, {width: NARROW}); n.load(); n.open(); n.seek(scene.duration);
  assert.equal(canonicalMarkup(narrow.innerHTML), canonicalMarkup(drawing(n)));
  assert.match(css, /\.lv-figure \{ container-type: inline-size; \}/);
  assert.match(css, /@container \(max-width: 599px\)/);
  assert.match(css, /:not\(\[data-ready\]\) \.lv-figure svg \{ aspect-ratio: 360 \/ 350; \}/);
  assert.match(css, /:not\(\[data-ready\]\) \.lv-figure \[data-drawing\] \{ display: none; \}/);
  assert.match(css, /:not\(\[data-ready\]\) \.lv-figure \[data-static-frame="narrow"\] \{ display: block; \}/);
  assert.match(css, /\.lv-figure \[data-static-frame="narrow"\] \.lv-value \{ font-size: 15px;/);
  // Keep one math tag/id, at the active narrow geometry, scaled with the narrow drawing.
  assert.equal(svg.querySelectorAll('#eq-lstm-valves-2').length, 1);
  assert.match(css, /:not\(\[data-ready\]\) \.lv-figure \[data-tag="learned"\] \{\s*x: 12px; y: 284px; width: 300px; height: 30px;\s*transform: scale\(1\.9778\); transform-origin: 0 0;/);
  f.load(); f.open();
  assert.equal(f.root.querySelectorAll('[data-static-frame]').length, 0);
  assert.equal(f.root.querySelectorAll('[data-drawing]').length, 1);
});

test('valves: public equation pointers are native links, not unresolved Quarto source', t => {
  const f = fixture(t, NAME);
  assert.doesNotMatch(f.root.textContent, /@(eq|fig|sec|tbl)-[\w-]+/);
  const links = [...f.root.querySelectorAll('a[href="#eq-lstm"]')];
  assert.equal(links.length, 2);
  for (const link of links) assert.equal(link.textContent, 'the LSTM update equations');
  assert(chapterSource(NAME).includes('{#eq-lstm}'), 'the native link target remains in the manuscript');
});

test('valves: substantive phone labels retain readable type and the footer has its own lane', t => {
  const width = 296;
  const f = fixture(t, NAME, {width}); f.load(); f.open(); f.seek(scene.duration);
  for (const name of ['op-label', 'gate-name', 'gate-value', 'value', 'name', 'held']) {
    const rule = css.match(new RegExp(`\\.lv-figure \\[data-static-frame="narrow"\\] \\.lv-${name} \\{ font-size: ([\\d.]+)px;`));
    assert(rule, `missing shared active/static phone type for ${name}`);
    assert(Number(rule[1]) * width / NARROW_G.width >= 12, `${name} is too small in a 296 px phone pane`);
  }
  for (const name of ['role', 'note']) {
    const rule = css.match(new RegExp(`\\.lv-figure \\[data-static-frame="narrow"\\] \\.lv-${name} \\{ font-size: ([\\d.]+)px;`));
    assert(Number(rule[1]) * width / NARROW_G.width >= 11.5, `${name} cannot disappear into tiny furniture`);
  }
  const tag = f.root.querySelector('[data-tag="learned"]');
  assert(Number(tag.getAttribute('y')) > Math.max(...[...f.root.querySelectorAll('.lv-gate-value')].map(n => Number(n.getAttribute('y')))) + 15);
  assert(Number(tag.getAttribute('y')) + Number(tag.getAttribute('height')) < Number(f.root.querySelector('.lv-note').getAttribute('y')) - 10);
});

test('valves: below 600 px the same picture reflows with nothing outside the viewBox', t => {
  const wide = fixture(t, NAME); wide.load(); wide.open(); wide.seek(scene.duration);
  assert.equal(wide.$('svg').getAttribute('viewBox'), G.viewBox);
  assert(!classes(wide).has('is-stacked'));
  const fx = declared(fixture(t, NAME));
  const narrow = fixture(t, NAME, {width: NARROW}); narrow.load(); narrow.open(); narrow.seek(scene.duration);
  assert.equal(narrow.$('svg').getAttribute('viewBox'), NARROW_G.viewBox);
  assert(classes(narrow).has('is-stacked'));
  // Same marks, same numbers: only the geometry moved.
  const printed = f => [...f.root.querySelectorAll('[data-value]')].map(node => `${node.dataset.value}=${node.textContent}`);
  assert.deepEqual(printed(narrow).sort(), printed(wide).sort());
  assert.equal(narrow.root.querySelectorAll('[data-valve]').length, 3);
  const tag = f => [...f.root.querySelectorAll('foreignObject')].map(node => `${node.getAttribute('x')},${node.getAttribute('y')}`);
  assert.notDeepEqual(tag(narrow), tag(wide), 'the typeset tag moves with the picture');
  // Every label and every mark inside the narrow viewBox, and every bar still its own value.
  for (const node of narrow.root.querySelectorAll('[data-drawing] text')) {
    const x = Number(node.getAttribute('x')), y = Number(node.getAttribute('y'));
    assert(x >= 0 && x <= NARROW_G.width && y >= 0 && y <= NARROW_G.height, `a label leaves the narrow viewBox: ${node.textContent} at ${x},${y}`);
  }
  for (const node of narrow.root.querySelectorAll('[data-drawing] rect')) {
    const x = Number(node.getAttribute('x')), y = Number(node.getAttribute('y'));
    assert(x >= 0 && y >= 0 && x + Number(node.getAttribute('width')) <= NARROW_G.width && y + Number(node.getAttribute('height')) <= NARROW_G.height, 'a mark leaves the narrow viewBox');
  }
  assert(Math.abs(barValue(mark(narrow, 'packet'), NARROW_G) - cellState(fx, fx.stops.f[1], fx.stops.i[1])) < 5e-4, 'the narrow belt bar is not the cell state');
  const foreign = narrow.root.querySelector('foreignObject[data-tag="learned"]');
  assert(Number(foreign.getAttribute('x')) + Number(foreign.getAttribute('width')) <= NARROW_G.width);
  // A resize flips the mode in place, without restarting anything.
  wide.resize(NARROW);
  assert.equal(wide.$('svg').getAttribute('viewBox'), NARROW_G.viewBox); assert(classes(wide).has('is-stacked'));
  wide.resize(WIDE);
  assert.equal(wide.$('svg').getAttribute('viewBox'), G.viewBox); assert(!classes(wide).has('is-stacked'));
  assert(!wide.playing);
});

test('valves: the panel is the only fixture copy -- moving it moves every number', t => {
  const f = fixture(t, NAME);
  // Not a manuscript edit: this proves the player reads the declared attributes, so a real
  // change to the illustrative numbers could not leave a stale one behind in the scene script
  // or in the SVG. A belt carrying 0.5 with a candidate of 1.0, and the same three openings.
  f.root.dataset.carry = '0.5'; f.root.dataset.candidate = '1.0';
  const fx = declared(f);
  f.load(); f.open(); f.seek(scene.duration);
  assert.equal(value(f, 'carry'), '0.50'); assert.equal(value(f, 'ctilde'), '1.00');
  assert.equal(value(f, 'belt'), two(cellState(fx, 0.5, 1))); assert.equal(value(f, 'belt'), '1.25');
  assert.equal(value(f, 'h'), '0.00');
  f.seek(B5); assert.equal(value(f, 'h'), two(hiddenState(fx, 0.5, 1, 0.5)));
  // The dashed mark of where the hidden state stood is computed at the openings it stood at,
  // which this fixture can tell apart from the openings the valves started from: here
  // c_t = 1.25, not the 0.50 the belt carried before the write valve opened.
  f.seek(scene.duration);
  assert(Math.abs(barValue(mark(f, 'h-ghost')) - hiddenState(fx, 0.5, 1, 0.5)) < 5e-4, 'the ghost is not the hidden state at the openings it stood at');
  assert(Math.abs(barValue(mark(f, 'h-ghost')) - hiddenState(fx, 1, 0, 0.5)) > 0.02, 'this fixture must distinguish the two');
  f.seek(B4); assert.match(caption(f).textContent, /hidden state is 0\.42/);
  f.seek(B2); assert.match(caption(f).textContent, /falls from 0\.50 to 0\.25/);
  f.seek(scene.duration);
  const pane = f.$('[data-pane]').cloneNode(true);
  pane.querySelectorAll('span[id^="eq-"]').forEach(node => node.remove());
  for (const stale of ['0.38', '1.00 to 0.50']) assert(!pane.textContent.includes(stale), `${stale} survived a moved fixture`);
  // A valve opening the panel does not declare is refused rather than drawn.
  const bad = fixture(t, NAME);
  bad.root.dataset.forget = '1.0 0.7';
  assert.throws(() => bad.load(), /not one of the declared illustrative openings/);
});

test('integration: the excerpt is HTML-only, manifest-driven, and declared in the config', () => {
  const filter = fs.readFileSync(path.join(__dirname, '..', scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/,
    'the non-HTML guard is the first executable line, so the PDF is untouched');
  assert.match(filter, /pandoc\.json\.decode/, 'the scene is data in the manifest, not code in the filter');
  assert.match(filter, /"after-cell"/, 'the filter must be able to place this scene\'s anchor kind');
  assert.match(filter, /assert\(inserted == 1/);
  assert.doesNotMatch(filter, /lstm|valve/i, 'a manifest-driven filter names no scene');
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
  // The chapter is anchored after the conveyor-belt figure, whose label Quarto turns into the
  // cell-fig-lstm-conveyor div, and which the equation this panel draws sits above.
  assert.equal(scene.anchor.type, 'after-cell'); assert.equal(scene.anchor.target, 'cell-fig-lstm-conveyor');
  const chapter = chapterSource(NAME);
  assert.equal(chapter.split('\n').filter(line => line === '#| label: fig-lstm-conveyor').length, 1, 'the anchor cell appears exactly once');
  assert(chapter.indexOf('{#eq-lstm}') < chapter.indexOf('#| label: fig-lstm-conveyor'), 'the equation this panel draws precedes the anchor');
  // Chapter 10 carries two excerpts; both must still be declared, on different anchors.
  const here = manifest.scenes.filter(other => other.qmd === scene.qmd);
  assert.deepEqual(here.map(other => other.id).sort(), ['gate-product-excerpt', 'lstm-valves-excerpt']);
  assert.equal(new Set(here.map(other => other.anchor.target)).size, 2, 'two panels in one chapter need two anchors');
  assert.equal(read(`${scene.scene}/panel.html`).includes('data-playback='), scene.transport === 'shared');
  assert(manifest.scenes.some(other => other.id === NAME));
});
