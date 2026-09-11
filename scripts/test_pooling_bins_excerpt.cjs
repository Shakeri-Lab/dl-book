#!/usr/bin/env node
// Test-only JSDOM. No dependency from this file enters the published book.
// The JSDOM fixture, the markup canonicaliser, and the transport, beat-hold and grammar
// suites this scene inherits live in scripts/html-tests/excerpt-harness.cjs. What stays
// here is the part no harness can supply: this scene's arithmetic -- the 2 x 2 max-pool of
// each grid, recomputed here and never through the player -- the two claims the chapter's
// fixture makes (the right-shift pools to the same map; a bin-crossing shift does not), the
// shape of its one picture, its typeset formula and the class toggles the player applies.
// JSDOM never typesets, so the formula assertions read the TeX source, the eq- ids, the
// \class{} names and the CSS toggles the player applies, never rendered math.
//
// Revision, 2026-09-10 (docs/wave2-excerpts.md, "Revision"): the picture lost its sixteen
// resting zeros, its eight index digits, three of its four rays and its side record panel,
// and gained two candidate paths, a question mark per output cell, a grey note, a half-height
// record under the pooled map and a closing pair of annotated paths. Every arithmetic
// invariant below is the one the previous build asserted; the markup-shape and beat
// assertions are rewritten around the new picture, and four checks are new: the live-numeral
// budget, the glyph vocabulary, the recomputed ring indices, and the intro and caption
// word budgets.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {read, manifest, entry, chapterSource, numbers, canonicalMarkup,
  fixture, registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'pooling-bins-excerpt';
const scene = entry(NAME);
// The harness lays nothing out, so the figure's width is declared: the wide layout, which
// is the one the static frame is drawn in. One test drives the narrow layout explicitly.
const WIDE = 640, NARROW = 360;
// The wide picture's own units, read back from the drawing in one place below and used by
// every geometry assertion: 52-unit input cells at (40, 40), bin-sized output cells at
// (380, 40), a half-height record at (380, 280).
const CELL = 52, BIG = 2 * CELL, INPUT = [40, 40], OUT = [380, 40];
const WIDE_BOX = '0 0 640 424', NARROW_BOX = '0 0 360 314';
// The text budgets this revision is held to: ≤ 40 words of intro before the picture, ≤ 14
// words in any caption. The grammar suite enforces the caption budget across its own probe
// times too; the test below walks every beat and prints the count that failed.
const INTRO_WORDS = 40, CAPTION_WORDS = 14;

// Read the declared fixture from the closed panel. The panel is the one in-repo mirror of
// the manuscript's numbers; everything below is computed from it, so no chapter value is
// typed here a second time.
function declared(f) {
  assert(!f.root.dataset.ready, 'read the declared fixture before the player mounts');
  const triples = numbers(f.root.dataset.scene), clues = [];
  for (let i = 0; i + 2 < triples.length; i += 3) clues.push({row: triples[i], col: triples[i + 1], value: triples[i + 2]});
  return {size: Number(f.root.dataset.size), window: Number(f.root.dataset.window), clues,
    right: numbers(f.root.dataset.right), down: numbers(f.root.dataset.down)};
}

// This suite's own grid and max-pool, deliberately not the player's: the independent
// evaluation every arithmetic assertion below is checked against. Row-major, like torch.
const gridOf = ({size, clues}, [dr, dc]) => {
  const cells = Array.from({length: size}, () => Array(size).fill(0));
  for (const clue of clues) cells[clue.row + dr][clue.col + dc] = clue.value;
  return cells;
};
const maxPool = (cells, w) => {
  const n = cells.length / w, out = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    let best = -Infinity;
    for (let a = 0; a < w; a++) for (let b = 0; b < w; b++) best = Math.max(best, cells[i * w + a][j * w + b]);
    out.push(best);
  }
  return out;
};
// Where each bin's largest value sits, recomputed here: the cell a ray may leave from.
const sourceOf = (cells, w, i, j) => {
  let best = -Infinity, at = null, ties = 0;
  for (let a = 0; a < w; a++) for (let b = 0; b < w; b++) {
    const v = cells[i * w + a][j * w + b];
    if (v > best) { best = v; at = [i * w + a, j * w + b]; ties = 1; } else if (v === best) ties++;
  }
  return ties === 1 ? at : null;
};
const binIndex = (fx, row, col) => Math.floor(row / fx.window) * (fx.size / fx.window) + Math.floor(col / fx.window);
// The clue the closing frame annotates and the payoff ray leaves: the one that changes bins
// under the declared down shift.
const witnessOf = fx => fx.clues.find(clue =>
  binIndex(fx, clue.row, clue.col) !== binIndex(fx, clue.row + fx.down[0], clue.col + fx.down[1]));

const pooled = f => JSON.parse(f.root.dataset.pooled);
const offset = f => numbers(f.root.dataset.offset);
const texts = (f, selector) => [...f.root.querySelectorAll(selector)].map(node => node.textContent);
const values = (f, prefix) => texts(f, `[data-value^="${prefix}"]`);
const tex = (f, n) => f.d.getElementById(`eq-pooling-bins-${n}`).textContent;
const drawing = f => f.$('[data-drawing]').innerHTML;
const classes = f => new Set([...f.root.classList]);
const caption = f => f.$('[data-caption]');
const attr = (node, name) => Number(node.getAttribute(name));
const times = (step = 0.05) => {
  const out = [];
  for (let t = 0; t <= scene.duration + 1e-9; t += step) out.push(Number(t.toFixed(4)));
  return out;
};
const css = read(`${scene.scene}/player.css`);

registerTransportTests(NAME, {
  witness: /9, 0, 0, 3/,
  anchors: ['pooling-bins-playback-help'],
  width: WIDE
});
// One drawn state per whole beat under reduced motion, not just at the boundaries: the
// clue positions are the quantity most likely to keep moving inside a beat.
registerBeatHoldTest(NAME);
// One picture, one formula line, one caption; TeX never rewritten; one guarded typeset.
// The word budget is this revision's, tighter than the grammar's own twenty.
registerGrammarTests(NAME, {words: CAPTION_WORDS});

test('pooling: the declared attributes reproduce the chapter literals they mirror', t => {
  const f = fixture(t, NAME);
  const {size, window, clues, right, down} = declared(f);
  const chapter = chapterSource(NAME);
  // Not a second copy of the fixture: the panel's attributes are rendered back into the
  // chapter's own source text, so a drift in either direction fails here as well as in
  // scripts/audit_excerpt_fixtures.py.
  assert(chapter.includes(`scene = torch.zeros(1, 1, ${size}, ${size})`), 'the declared size does not spell the chapter grid');
  for (const clue of clues) assert(chapter.includes(`scene[0, 0, ${clue.row}, ${clue.col}] = ${clue.value.toFixed(1)}`), `scene[${clue.row}, ${clue.col}] = ${clue.value} is not the chapter's clue`);
  for (const clue of clues) assert(chapter.includes(`shifted[0, 0, ${clue.row + right[0]}, ${clue.col + right[1]}] = ${clue.value.toFixed(1)}`), 'the declared right shift does not spell the chapter\'s `shifted` grid');
  assert(chapter.includes(`F.max_pool2d(scene,   ${window})`) && chapter.includes(`F.max_pool2d(shifted, ${window})`), 'the declared window is not the chapter\'s');
  // The down shift is this panel's own case: the chapter prints no such grid, and says so.
  for (const clue of clues) assert(!chapter.includes(`[0, 0, ${clue.row + down[0]}, ${clue.col + down[1]}] = ${clue.value.toFixed(1)}`), 'the down shift is declared computed, so the chapter must not print it');
  assert.deepEqual(right, [0, 1]); assert.deepEqual(down, [1, 0]);
  assert.equal(clues.length, 2);
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal));
});

test('pooling: the 2 x 2 max-pool, recomputed here, gives the same map for the right shift and a different one for the down shift', t => {
  const f = fixture(t, NAME);
  const fx = declared(f);
  const home = maxPool(gridOf(fx, [0, 0]), fx.window);
  const right = maxPool(gridOf(fx, fx.right), fx.window);
  const down = maxPool(gridOf(fx, fx.down), fx.window);
  // The chapter's claim, and its printed stdout, in that order.
  assert.deepEqual(home, [9, 0, 0, 3]);
  assert.deepEqual(right, home, 'the chapter\'s shift must pool to the identical map');
  const frozen = fs.readFileSync(path.join(__dirname, '..', '_freeze', 'chapters', 'part2', '08-cnn', 'execute-results', 'html.json'), 'utf8');
  const printed = `[[${home[0].toFixed(1)}, ${home[1].toFixed(1)}], [${home[2].toFixed(1)}, ${home[3].toFixed(1)}]]`;
  assert(frozen.includes(`pooled original: ${printed}`), `the chapter's frozen stdout does not print pooled original: ${printed}`);
  assert(frozen.includes(`pooled shifted:  ${printed}`), `the chapter's frozen stdout does not print pooled shifted:  ${printed}`);
  // The declared computed variant: the same clues one pixel down cross a bin edge.
  assert.deepEqual(down, [0, 0, 9, 3]);
  const changed = down.map((value, k) => value !== home[k]);
  assert.deepEqual(changed, [true, false, true, false], 'the down shift changes exactly bins (0,0) and (1,0)');
  // Every clue stays inside its bin under the right shift; exactly one crosses under the down shift.
  const bin = (r, c) => `${Math.floor(r / fx.window)},${Math.floor(c / fx.window)}`;
  for (const clue of fx.clues) assert.equal(bin(clue.row + fx.right[0], clue.col + fx.right[1]), bin(clue.row, clue.col));
  const crossers = fx.clues.filter(clue => bin(clue.row + fx.down[0], clue.col + fx.down[1]) !== bin(clue.row, clue.col));
  assert.deepEqual(crossers.map(clue => clue.value), [9]);
  // And the player's published maps, read at the beats where each stands, are these.
  f.load(); f.open();
  f.seek(scene.beats[1] + 5); assert.deepEqual(pooled(f), home);
  f.seek(scene.beats[3]); assert.deepEqual(pooled(f), right); assert.equal(f.root.dataset.sign, '=');
  f.seek(scene.beats[6]); assert.deepEqual(pooled(f), down); assert.equal(f.root.dataset.sign, '≠');
  assert.deepEqual(JSON.parse(f.root.dataset.record), home);
  f.seek(scene.duration);
  assert.deepEqual(values(f, 'h'), down.map(String));
  assert.deepEqual(values(f, 'g'), home.map(String));
  assert.deepEqual([...f.root.querySelectorAll('[data-out]')].map(node => node.classList.contains('is-changed')), changed);
});

test('pooling: the retired verdict under the record is the recomputed comparison, not a typed glyph', t => {
  const f = fixture(t, NAME);
  const fx = declared(f); f.load(); f.open();
  const home = maxPool(gridOf(fx, [0, 0]), fx.window);
  const right = maxPool(gridOf(fx, fx.right), fx.window);
  const expected = right.every((value, k) => value === home[k]) ? ['=', 'equal'] : ['≠', 'unequal'];
  // The chapter's own finding: its shift changes nothing, so the record and the
  // right-shifted map are one map and the record's label may say so.
  assert.deepEqual(expected, ['=', 'equal']);
  const retired = () => f.root.querySelector('[data-retired]');
  // Before the rightward verdict has been earned the record is labelled only `before`.
  for (const time of [scene.beats[2] + 1, scene.beats[3] + 1]) {
    f.seek(time);
    assert(!retired(), `the retired verdict stands before its beat is over, at ${time}s`);
    assert.equal(f.root.querySelector('[data-record-label]').textContent, 'before');
  }
  // From the beat after it, it stands under the record for the rest of the scene, so the
  // closing frame -- the static fallback -- carries both outcomes at once.
  for (const time of times(0.05)) {
    if (time < scene.beats[4]) continue;
    f.seek(time);
    assert(retired(), `no retired verdict at ${time}s`);
    assert.equal(retired().textContent, expected[0]);
    assert.equal(retired().dataset.retired, expected[1]);
    assert.equal(f.root.querySelector('[data-record-label]').textContent, `before ${expected[0]} after one pixel right`);
  }
  // And the live verdict at the same instant is the other one: both are on screen together.
  f.seek(scene.duration);
  assert.equal(f.root.querySelector('[data-sign]').dataset.sign, 'unequal');
  assert.match(f.$('svg title').textContent, /labelled equal to the map after the one-pixel move right/);
});

test('pooling: output cells are a question before pooling, a dot while the clues move, and a value only when it lands', t => {
  const f = fixture(t, NAME);
  const fx = declared(f); f.load(); f.open();
  const home = maxPool(gridOf(fx, [0, 0]), fx.window);
  // The ask beat: the output grid stands from the first frame -- the question is about it --
  // and every cell holds a question mark, never a number.
  f.seek(0);
  assert.equal(f.root.querySelectorAll('[data-out]').length, 4, 'the output grid stands at the first beat');
  assert.deepEqual(values(f, 'h'), ['?', '?', '?', '?']);
  assert.deepEqual(pooled(f), [null, null, null, null]);
  // The pooling beat: four dots, then one value per landing, in reading order.
  f.seek(scene.beats[1]);
  assert.deepEqual(values(f, 'h'), ['·', '·', '·', '·']);
  assert.deepEqual(pooled(f), [null, null, null, null]);
  const landings = [];
  for (const time of times(0.05)) {
    if (time < scene.beats[1] || time >= scene.beats[2]) continue;
    f.seek(time);
    const now = pooled(f);
    assert.deepEqual(values(f, 'h'), now.map(value => (value === null ? '·' : String(value))), `dot discipline at ${time}s`);
    const written = now.filter(value => value !== null).length;
    if (written > landings.length) landings.push(time);
    for (let k = 0; k < 4; k++) assert(now[k] === null || now[k] === home[k], `wrong value at ${time}s`);
    assert(now.every((value, k) => value === null || now.slice(0, k).every(prior => prior !== null)), `out of reading order at ${time}s`);
  }
  assert.equal(landings.length, 4, 'four values land, one per bin');
  for (let k = 1; k < 4; k++) assert(landings[k] - landings[k - 1] > 0.8, 'each landing is its own moment');
  // While the clues move, every cell is a dot again; when they stand, the map is rewritten.
  let dotted = 0, rewritten = 0;
  for (const time of times(0.05)) {
    f.seek(time);
    const moving = f.root.dataset.moving === 'true';
    if (moving) { assert.deepEqual(pooled(f), [null, null, null, null], `a pooled value printed mid-move at ${time}s`); assert(!drawing(f).includes('data-ray'), `a ray drawn mid-move at ${time}s`); dotted++; }
    if (time >= scene.beats[3] && time < scene.beats[4]) { assert.deepEqual(pooled(f), home); rewritten++; }
  }
  assert(dotted > 100 && rewritten > 80, `${dotted} moving frames, ${rewritten} standing frames`);
  // Never a zero standing in for an unwritten value: a 0 is printed only where the pool is 0,
  // and a question mark is only ever asked before the first map exists.
  f.seek(scene.beats[2] + 1.5);
  assert.equal(f.root.dataset.moving, 'true');
  assert.deepEqual(values(f, 'h'), ['·', '·', '·', '·']);
  for (const time of times(0.05)) {
    f.seek(time);
    const marks = values(f, 'h');
    assert.equal(marks.length, 4, `four output marks at ${time}s`);
    for (const mark of marks) assert(mark === '?' || mark === '·' || /^-?\d+$/.test(mark), `output cell holds "${mark}" at ${time}s`);
    if (marks.includes('?')) assert.equal(Number(f.root.dataset.stage), 0, `a question mark after the ask beat, at ${time}s`);
  }
});

test('pooling: at most six full-weight numerals stand at any instant, and none in a grid cell but a clue box', t => {
  const f = fixture(t, NAME);
  const fx = declared(f); f.load(); f.open();
  const gridBox = {left: INPUT[0], top: INPUT[1], right: INPUT[0] + fx.size * CELL, bottom: INPUT[1] + fx.size * CELL};
  let peak = 0;
  for (const time of times(0.05)) {
    f.seek(time);
    const live = [...f.root.querySelectorAll('[data-drawing] .pb-value')];
    peak = Math.max(peak, live.length);
    assert(live.length <= 8, `${live.length} full-weight numerals at ${time}s`);
    // The retired marks are the record's, and they are drawn in the retired class, not this one.
    for (const node of live) assert(!node.classList.contains('pb-ghost-value'));
    // The sixteen resting zeros and the eight index digits are gone as marks, not restyled.
    assert(!drawing(f).includes('pb-zero'), `a resting zero at ${time}s`);
    assert(!drawing(f).includes('pb-index'), `an index digit at ${time}s`);
    // Nothing numeric is drawn inside the input grid except the two clue values.
    for (const node of f.root.querySelectorAll('[data-drawing] text')) {
      const x = attr(node, 'x'), y = attr(node, 'y');
      if (x < gridBox.left || x > gridBox.right || y < gridBox.top || y > gridBox.bottom) continue;
      if (/^clue\d+$/.test(node.dataset.value || '')) continue;
      assert.doesNotMatch(node.textContent, /\d/, `"${node.textContent}" is a numeral inside the grid at ${time}s`);
    }
  }
  // Two clue values plus four pooled values is the smallest set that can state either
  // verdict, and it is what the busiest instant costs.
  assert.equal(peak, fx.clues.length + 4, `peak live numerals ${peak}`);
});

test('pooling: reduced motion shows exactly three clue positions -- home, right, down -- one per beat', t => {
  const f = fixture(t, NAME, {reduced: true});
  const fx = declared(f); f.load(); f.open();
  const byStage = new Map();
  for (let i = 0; i <= 800; i++) {
    f.seek(i / 20);
    const stage = Number(f.root.dataset.stage);
    if (!byStage.has(stage)) byStage.set(stage, new Set());
    byStage.get(stage).add(offset(f).join(','));
    assert.equal(f.root.dataset.moving, 'false', `reduced motion is moving at ${i / 20}s`);
  }
  for (const [stage, set] of byStage) assert.equal(set.size, 1, `reduced motion moves the clues inside beat ${stage}: ${[...set].join(' | ')}`);
  const positions = [...byStage.keys()].sort((a, b) => a - b).map(stage => [...byStage.get(stage)][0]);
  const home = '0,0', right = fx.right.join(','), down = fx.down.join(',');
  assert.deepEqual(positions, [home, home, right, right, home, down, down]);
  assert.deepEqual([...new Set(positions)].sort(), [home, right, down].sort(), 'three discrete positions and no other');
  // Each beat is its end state: the map already rewritten, the verdict already up.
  f.seek(scene.beats[2]); assert.deepEqual(pooled(f), maxPool(gridOf(fx, fx.right), fx.window));
  f.seek(scene.beats[3]); assert.equal(f.root.dataset.sign, '=');
  f.seek(scene.beats[5]); assert.deepEqual(pooled(f), maxPool(gridOf(fx, fx.down), fx.window));
  assert.equal(f.root.dataset.sign, '≠'); assert(classes(f).has('wash-crossed'));
  f.seek(scene.beats[6]); assert.equal(f.root.dataset.sign, '≠');
  // Unreduced, the same beats are a continuous slide -- so this is a reduced-motion
  // behaviour, not the scene quietly losing its animation.
  const sliding = fixture(t, NAME); sliding.load(); sliding.open();
  const between = new Set();
  for (let i = 220; i <= 340; i++) { sliding.seek(i / 20); between.add(offset(sliding)[1]); }
  assert(between.size > 30, 'the unreduced slide must be continuous, not stepped');
  assert([...between].some(dc => dc > 0.1 && dc < 0.9), 'the unreduced slide must pass between the pixels');
});

test('pooling: motion is the mechanism -- both clues translate as one body', t => {
  const f = fixture(t, NAME);
  const fx = declared(f); f.load(); f.open();
  const transforms = () => [...f.root.querySelectorAll('[data-mark^="clue-"]')].map(node => /translate\(([-\d.]+) ([-\d.]+)\)/.exec(node.getAttribute('transform')).slice(1).map(Number));
  // Expected geometry from the picture's stated cell size and the declared offsets --
  // never from what the player drew.
  let rightFrames = 0, downFrames = 0;
  for (const time of times(0.05)) {
    f.seek(time);
    const [dr, dc] = offset(f), marks = transforms();
    assert.equal(marks.length, fx.clues.length);
    for (const [tx, ty] of marks) { assert(Math.abs(tx - dc * CELL) < 0.02, `clue x at ${time}s`); assert(Math.abs(ty - dr * CELL) < 0.02, `clue y at ${time}s`); }
    assert(marks.every(([tx, ty]) => tx === marks[0][0] && ty === marks[0][1]), `the clues part company at ${time}s`);
    if (f.root.dataset.moving === 'true' && Number(f.root.dataset.stage) === 2) { assert.equal(dr, 0); assert(dc >= 0 && dc <= fx.right[1]); if (dc > 0 && dc < 1) rightFrames++; }
    if (f.root.dataset.moving === 'true' && Number(f.root.dataset.stage) === 5) { assert.equal(dc, 0); assert(dr >= 0 && dr <= fx.down[0]); if (dr > 0 && dr < 1) downFrames++; }
    assert(dr >= 0 && dr <= 1 && dc >= 0 && dc <= 1, `offset off the pixel range at ${time}s`);
  }
  assert(rightFrames > 30 && downFrames > 30, `${rightFrames} right, ${downFrames} down`);
});

test('pooling: one ray at a time, and it names which output cell received which bin\'s largest value', t => {
  const f = fixture(t, NAME);
  const fx = declared(f); f.load(); f.open();
  const witness = witnessOf(fx);
  assert(witness, 'the declared down shift must move some clue across a bin edge');
  const bins = fx.size / fx.window;
  // The replacement for the old "runs along a grid line" rule: a ray leaves the middle of
  // its source cell's right edge and lands in the middle of its output cell's left edge, so
  // it cannot end on the corner two output cells share. Recomputed here from the grid.
  const check = (shift, expectedBin) => {
    const cells = gridOf(fx, shift);
    const rays = [...f.root.querySelectorAll('[data-ray]')];
    assert.equal(rays.length, 1, 'exactly one ray');
    const ray = rays[0];
    const i = Number(ray.dataset.ray[0]), j = Number(ray.dataset.ray[1]);
    assert.deepEqual([i, j], expectedBin, 'the ray leaves the bin the scene is about');
    const at = sourceOf(cells, fx.window, i, j);
    assert(at, 'the bin has a single largest value');
    assert.equal(cells[at[0]][at[1]], maxPool(cells, fx.window)[i * bins + j], 'the ray leaves the cell holding that bin\'s maximum');
    const [sx, sy] = [INPUT[0] + (at[1] + 1) * CELL, INPUT[1] + (at[0] + 0.5) * CELL];
    const [ex, ey] = [OUT[0] + j * BIG, OUT[1] + (i + 0.5) * BIG];
    assert.deepEqual([attr(ray, 'x1'), attr(ray, 'y1')], [sx, sy], `ray ${i}${j} origin`);
    assert.deepEqual([attr(ray, 'x2'), attr(ray, 'y2')], [ex, ey], `ray ${i}${j} landing`);
    // The landing is strictly inside one output cell's left edge, never on the boundary it
    // shares with the cell above or below: that is what makes the payoff frame unambiguous.
    assert(ey > OUT[1] + i * BIG && ey < OUT[1] + (i + 1) * BIG, `ray ${i}${j} lands on a shared corner`);
    return [i, j];
  };
  // The pooling beat: the ray leaves the bin the witness clue sits in at home.
  f.seek(scene.beats[2] - 0.05);
  check([0, 0], [Math.floor(witness.row / fx.window), Math.floor(witness.col / fx.window)]);
  // The payoff beat: the ray leaves the bin the witness clue has moved into, and that bin is
  // one of the two whose pooled value changed. This is the whole payoff, so it is bound.
  f.seek(scene.duration - 6.05);
  const landedIn = check(fx.down, [Math.floor((witness.row + fx.down[0]) / fx.window), Math.floor((witness.col + fx.down[1]) / fx.window)]);
  const home = maxPool(gridOf(fx, [0, 0]), fx.window), down = maxPool(gridOf(fx, fx.down), fx.window);
  const k = landedIn[0] * bins + landedIn[1];
  assert.notEqual(down[k], home[k], 'the payoff ray lands in an output cell whose value changed');
  assert.equal(down[k], witness.value, 'and the value it received is the clue that crossed');
  // A ray grows from its source: mid-draw its far end is short of the output cell.
  f.seek(scene.beats[1] + 0.8);
  const growing = f.root.querySelector('[data-ray]');
  assert(growing, 'the first ray is being drawn');
  assert(attr(growing, 'x2') < OUT[0], 'the ray has not reached the output yet');
  // Never two rays, and none at all outside the two beats that have one to draw.
  for (const time of times(0.05)) {
    f.seek(time);
    const stage = Number(f.root.dataset.stage), rays = f.root.querySelectorAll('[data-ray]').length;
    assert(rays <= 1, `${rays} rays at ${time}s`);
    if (stage !== 1 && stage !== 5) assert.equal(rays, 0, `a ray at ${time}s, stage ${stage}`);
  }
});

test('pooling: the two candidate paths ask the question, and the two annotated paths answer it', t => {
  const f = fixture(t, NAME);
  const fx = declared(f); f.load(); f.open();
  const witness = witnessOf(fx);
  const candidates = () => [...f.root.querySelectorAll('[data-candidate]')].map(node => node.dataset.candidate).sort();
  // Before anything moves, each clue carries both moves the scene will make.
  f.seek(0);
  assert.deepEqual(candidates(), fx.clues.flatMap((_, n) => [`${n}-down`, `${n}-right`]).sort(),
    'the first frame must show both experiments on both clues');
  assert.equal(f.root.querySelectorAll('[data-path]').length, 0, 'no answer is drawn at the first beat');
  // The second question is drawn too: once the clues are home again, the downward move only.
  f.seek(scene.beats[5] - 0.05);
  assert.deepEqual(candidates(), fx.clues.map((_, n) => `${n}-down`).sort());
  // And nowhere else: a candidate stands only while its move is still a question.
  for (const time of times(0.05)) {
    f.seek(time);
    const stage = Number(f.root.dataset.stage), count = f.root.querySelectorAll('[data-candidate]').length;
    if (stage === 0) assert.equal(count, 2 * fx.clues.length, `candidates at ${time}s`);
    else if (stage === 4) assert(count === 0 || count === fx.clues.length, `candidates at ${time}s`);
    else assert.equal(count, 0, `a candidate path at ${time}s, stage ${stage}`);
  }
  // The closing frame: the two paths out of the witness clue's home cell, each labelled, and
  // the bin edge it crossed lit. Both geometries are recomputed here.
  f.seek(scene.duration);
  const home = [INPUT[0] + (witness.col + 0.5) * CELL, INPUT[1] + (witness.row + 0.5) * CELL];
  const stay = f.root.querySelector('[data-path="stay"]'), cross = f.root.querySelector('[data-path="cross"]');
  assert(stay && cross, 'both outcomes are drawn on the closing frame');
  assert.equal(attr(stay, 'y1'), home[1]); assert.equal(attr(cross, 'x1'), home[0]);
  // The rightward path ends past the light line inside the bin; the downward path ends past
  // the heavy line between bins.
  const insideLine = INPUT[0] + (witness.col + 1) * CELL, binLine = INPUT[1] + (Math.floor(witness.row / fx.window) + 1) * fx.window * CELL;
  assert(attr(stay, 'x2') > insideLine, 'the rightward path must reach past the cell boundary it respects');
  assert(attr(cross, 'y2') > binLine, 'the downward path must reach past the bin edge it crosses');
  assert.equal(Math.floor(witness.col / fx.window), Math.floor((witness.col + 1) / fx.window), 'the rightward move stays in the same bin');
  const edge = f.root.querySelector('[data-crossed-edge]');
  assert(edge, 'the crossed bin edge is lit');
  assert.equal(attr(edge, 'y1'), binLine); assert.equal(attr(edge, 'y2'), binLine);
  assert.equal(attr(edge, 'x1'), INPUT[0] + Math.floor(witness.col / fx.window) * fx.window * CELL);
  assert.equal(attr(edge, 'x2'), INPUT[0] + (Math.floor(witness.col / fx.window) + 1) * fx.window * CELL);
  // Rule 7: the picture reads without colour, so both paths are named in words.
  assert.deepEqual(texts(f, '[data-path-label]'), ['stays inside its bin', 'crosses into the next bin']);
  // The lit edge arrives with the payoff, not only with the labels, so the reason is on the
  // frame that shows the result.
  f.seek(scene.beats[5] + 5); assert(f.root.querySelector('[data-crossed-edge]'));
  for (const time of times(0.05)) {
    f.seek(time);
    const drawn = f.root.querySelectorAll('[data-path]').length;
    assert.equal(drawn, Number(f.root.dataset.stage) === 6 ? 2 : 0, `${drawn} answer paths at ${time}s`);
    if (f.root.querySelector('[data-crossed-edge]')) {
      assert(Number(f.root.dataset.stage) >= 5 && offset(f)[0] === fx.down[0] && f.root.dataset.moving === 'false',
        `the bin edge is lit at ${time}s, before the clue has crossed it`);
    }
  }
});

test('pooling: a bin whose cells tie has no single largest value, so its ray leaves the bin itself', t => {
  const f = fixture(t, NAME);
  // Not a manuscript edit: two clues of equal value inside one bin, so that bin has no
  // unique maximum and the ray has no single cell to leave. The declared down shift still
  // moves one of them across the bin edge, so this is the pooling beat's ray, recomputed.
  f.root.dataset.scene = '0 0 5 1 1 5';
  const fx = declared(f); f.load(); f.open();
  const home = maxPool(gridOf(fx, [0, 0]), fx.window), down = maxPool(gridOf(fx, fx.down), fx.window);
  assert.deepEqual(home, [5, 0, 0, 0]);
  assert.deepEqual(down, [5, 0, 5, 0]);
  const witness = witnessOf(fx);
  const [bi, bj] = [Math.floor(witness.row / fx.window), Math.floor(witness.col / fx.window)];
  assert.equal(sourceOf(gridOf(fx, [0, 0]), fx.window, bi, bj), null, 'the witness clue\'s home bin ties');
  f.seek(scene.beats[2] - 0.05);
  const ray = f.root.querySelector('[data-ray]');
  assert(ray, 'the tied bin still sends a ray');
  assert.equal(attr(ray, 'x1'), INPUT[0] + (bj + 1) * BIG, 'a tied bin\'s ray leaves the bin\'s own right edge');
  assert.equal(attr(ray, 'y1'), INPUT[1] + (bi + 0.5) * BIG, 'at the middle of it, not at some cell\'s');
  assert.deepEqual(pooled(f), home);
  f.seek(scene.duration); assert.deepEqual(pooled(f), down);
});

test('pooling: the record\'s retired verdict is recomputed, so a shift that did change the map says so', t => {
  const f = fixture(t, NAME);
  // Not a manuscript edit: the 9 starts one column further right, so the chapter's own
  // rightward shift would carry it across a bin edge. The label under the record must then
  // read "not equal", which is the only way to know it is a comparison and not a decoration.
  f.root.dataset.scene = '0 1 9 2 2 3';
  const fx = declared(f);
  const home = maxPool(gridOf(fx, [0, 0]), fx.window), right = maxPool(gridOf(fx, fx.right), fx.window);
  assert.deepEqual(home, [9, 0, 0, 3]);
  assert.deepEqual(right, [0, 9, 0, 3]);
  assert.notDeepEqual(right, home, 'this fixture is the one where the right shift does change the map');
  f.load(); f.open();
  f.seek(scene.duration);
  assert.equal(f.root.querySelector('[data-retired]').textContent, '≠');
  assert.equal(f.root.querySelector('[data-retired]').dataset.retired, 'unequal');
  assert.equal(f.root.querySelector('[data-record-label]').textContent, 'before ≠ after one pixel right');
  // And the live verdict at the beat that earned it is the same recomputed comparison.
  f.seek(scene.beats[3]);
  assert.equal(f.root.querySelector('[data-sign]').dataset.sign, 'unequal');
});

test('pooling: the record and the verdict appear only when there is something to compare', t => {
  const f = fixture(t, NAME);
  const fx = declared(f);
  f.load(); f.open();
  const home = maxPool(gridOf(fx, [0, 0]), fx.window), down = maxPool(gridOf(fx, fx.down), fx.window);
  // The ring indices, recomputed here: exactly the positions where pool(down) differs from
  // pool(scene). Nothing below reads them off the player.
  const ringed = down.map((value, k) => (value !== home[k] ? ['00', '01', '10', '11'][k] : null)).filter(Boolean);
  assert.deepEqual(ringed, ['00', '10']);
  const record = () => f.root.querySelector('[data-record]');
  const sign = () => f.root.querySelector('[data-sign]');
  for (const time of [0, scene.beats[1], scene.beats[1] + 5, scene.beats[2]]) { f.seek(time); assert(!record(), `record drawn at ${time}s`); assert(!sign(), `sign drawn at ${time}s`); }
  f.seek(scene.beats[2] + 0.3); assert(record()); assert(attr(record(), 'opacity') > 0 && attr(record(), 'opacity') < 1, 'the record fades in');
  f.seek(scene.beats[2] + 0.6); assert.equal(record().getAttribute('opacity'), '1');
  let unequal = 0;
  for (const time of times(0.05)) {
    if (time < scene.beats[2] + 0.6) continue;
    f.seek(time);
    assert.equal(record().getAttribute('opacity'), '1', `the record wavers at ${time}s`);
    assert.deepEqual(values(f, 'g'), home.map(String), `the record changes at ${time}s`);
    const stage = Number(f.root.dataset.stage), now = pooled(f);
    const expected = now.map((value, k) => (value !== null && value !== home[k] ? ['00', '01', '10', '11'][k] : null)).filter(Boolean);
    if (stage === 3) { assert(sign() && sign().dataset.sign === 'equal', `no = at ${time}s`); assert(!sign().classList.contains('is-changed')); }
    else if (expected.length) { assert(sign() && sign().dataset.sign === 'unequal', `no ≠ at ${time}s`); assert(sign().classList.contains('is-changed')); unequal++; }
    else assert(!sign(), `a sign at ${time}s, stage ${stage}`);
    // The ring: on the live map and on the record together, only where the written value
    // differs from the record, and only once that value is written.
    assert.deepEqual([...f.root.querySelectorAll('[data-out].is-changed')].map(node => node.dataset.out), expected, `live rings at ${time}s`);
    assert.deepEqual([...f.root.querySelectorAll('[data-ghost].is-changed')].map(node => node.dataset.ghost), expected, `record rings at ${time}s`);
    assert.equal(classes(f).has('wash-crossed'), stage >= 5 && now.every(v => v !== null) && expected.length > 0, `wash-crossed at ${time}s`);
  }
  assert(unequal > 100, `${unequal} frames carry the not-equal verdict`);
  // At the end the rings are exactly the recomputed indices, on both maps.
  f.seek(scene.duration);
  assert.deepEqual([...f.root.querySelectorAll('[data-out].is-changed')].map(node => node.dataset.out), ringed);
  assert.deepEqual([...f.root.querySelectorAll('[data-ghost].is-changed')].map(node => node.dataset.ghost), ringed);
  // Rule 7: the picture has to read without colour, so the ring and the sign are named --
  // in the caption, in the picture's title, and in the transcript.
  assert.match(caption(f).textContent, /Two pooled values changed/);
  assert.match(f.$('svg title').textContent, /ringed in wine on both maps/);
  assert.match(f.$('svg title').textContent, /reads equal or not equal/);
  assert.match(f.$('.mechanism-transcript').textContent, /two bins that changed are ringed/);
});

test('pooling: the verdict vocabulary is exactly three glyphs, each where it belongs', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const seen = new Set();
  for (const time of times(0.05)) {
    f.seek(time);
    const sign = f.root.querySelector('[data-sign]');
    if (sign) { assert(['=', '≠'].includes(sign.textContent), `verdict glyph "${sign.textContent}" at ${time}s`); seen.add(sign.textContent); }
    const retired = f.root.querySelector('[data-retired]');
    if (retired) { assert(['=', '≠'].includes(retired.textContent), `retired glyph "${retired.textContent}" at ${time}s`); seen.add(`retired ${retired.textContent}`); }
    for (const mark of values(f, 'h')) if (mark === '?') seen.add('?');
  }
  assert.deepEqual([...seen].sort(), ['=', '?', 'retired =', '≠'].sort(),
    'the scene asks with ?, answers with = and ≠, and invents no fourth glyph');
});

test('pooling: the intro and every caption are inside this revision\'s word budget', t => {
  const f = fixture(t, NAME);
  const count = text => text.trim().split(/\s+/).filter(Boolean).length;
  const intro = count(f.$('.mechanism-intro').textContent);
  assert(intro > 0 && intro <= INTRO_WORDS, `the intro is ${intro} words, budget ${INTRO_WORDS}`);
  // The question above the pane and the boundary below it are prose, not the picture, and
  // are deliberately not budgeted -- but the boundary must still carry every caveat the
  // shortened intro and captions dropped.
  const boundary = f.$('.mechanism-boundary').textContent;
  for (const claim of [
    'no kernel is learned',
    'not translation invariance in general',
    'made by applying the same 2 × 2 max-pool to the same two clues; the chapter does not print it',
    'the 9 crosses from the upper-left bin into the lower-left one and the 3 does not, so exactly two of the four pooled values change',
    'Tolerance is local and alignment-dependent, not invariance',
    'measured at the end of this chapter, not assumed here'
  ]) assert(boundary.includes(claim), `the boundary paragraph dropped: ${claim}`);
  f.load(); f.open();
  const lengths = [];
  for (const beat of scene.beats) {
    f.seek(beat);
    const words = count(caption(f).textContent);
    lengths.push(words);
    assert(words > 0 && words <= CAPTION_WORDS, `the caption at ${beat}s is ${words} words: "${caption(f).textContent.trim()}"`);
  }
  assert.equal(lengths.length, scene.beats.length);
  // And a caption never states a number the picture has not written yet.
  for (const time of times(0.05)) {
    f.seek(time);
    const text = caption(f).textContent, written = pooled(f).filter(value => value !== null);
    for (const digits of text.match(/\d+/g) || []) {
      const value = Number(digits);
      assert(written.includes(value) || declared(fixture(t, NAME)).clues.some(clue => clue.value === value) || /2×2/.test(text),
        `the caption states ${value} at ${time}s before the picture writes it`);
    }
  }
});

test('pooling: the static fallback prints the final frame with every witness value', t => {
  const f = fixture(t, NAME);
  const fx = declared(f);
  // Read before any script runs: the script-free panel is already the whole witness.
  assert.deepEqual(values(f, 'g'), maxPool(gridOf(fx, [0, 0]), fx.window).map(String));
  assert.deepEqual(values(f, 'g'), ['9', '0', '0', '3']);
  assert.deepEqual(values(f, 'h'), maxPool(gridOf(fx, fx.down), fx.window).map(String));
  assert.deepEqual(values(f, 'h'), ['0', '0', '9', '3']);
  assert.deepEqual(values(f, 'clue'), fx.clues.map(clue => String(clue.value)));
  assert.equal(f.$('[data-sign]').dataset.sign, 'unequal');
  // Both verdicts on the one printed frame: the down map differs, the right one did not.
  assert.equal(f.$('[data-retired]').dataset.retired, 'equal');
  assert.equal(f.$('[data-record-label]').textContent, 'before = after one pixel right');
  assert.equal(f.root.querySelectorAll('[data-path]').length, 2, 'the print carries both annotated paths');
  assert(!drawing(f).includes('·') && !drawing(f).includes('>?<'), 'the final frame withholds nothing');
  assert.match(f.root.className, /\bstage-6\b/); assert.match(f.root.className, /\bshow-record\b/); assert.match(f.root.className, /\bwash-crossed\b/);
});

test('pooling: no-script readouts are exactly the readouts at the end of the timeline', t => {
  const f = fixture(t, NAME);
  const readouts = () => [
    canonicalMarkup(drawing(f)), caption(f).innerHTML,
    [...classes(f)].sort().join(' '),
    f.$('.pb-figure svg').getAttribute('viewBox'), f.$('.pb-figure svg').getAttribute('aria-label'),
    f.$('.pb-figure svg title').textContent,
    ...[...f.root.querySelectorAll('foreignObject')].map(node => `${node.dataset.tag}@${node.getAttribute('x')},${node.getAttribute('y')}`)
  ];
  const before = readouts();
  f.load(); f.seek(scene.duration);
  assert.deepEqual(readouts(), before);
  assert(before[0].includes('data-value="g00">9<') && before[0].includes('data-value="h10">9<'), 'the static drawing carries the witness values');
});

test('pooling: the static panel differs from the t = 40 render only where script must add', t => {
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
  assert.equal(strip(pane.innerHTML), before, 'script changed the panel somewhere the receipt does not name');
  assert.equal(pane.querySelector('[data-controls]').hidden, false);
  assert.equal(f.root.dataset.ready, 'true');
});

test('pooling: the static frame in panel.html is the player\'s own t = 40 drawing', async () => {
  const {file, before, after} = await staticFrame(NAME);
  assert.equal(after, before, `${path.relative(path.join(__dirname, '..'), file)} is stale: run node scripts/render_static_frames.cjs ${scene.scene}`);
  assert.match(before, /<!-- static-frame[^>]*-->\s*<g data-drawing>[\s\S]*?<\/g>\s*<!-- \/static-frame -->/);
});

test('pooling: each declared beat advances the stage and toggles exactly its classes', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const has = name => classes(f).has(name);
  const stages = [];
  for (const beat of scene.beats) {
    f.seek(beat);
    stages.push(Number(f.root.dataset.stage));
    assert.deepEqual([...classes(f)].filter(name => /^stage-\d$/.test(name)), [`stage-${stages.at(-1)}`]);
  }
  assert.deepEqual(stages, scene.beats.map((_, index) => index));
  const table = {
    'show-record': [false, false, false, true, true, true, true],
    'wash-bin': [false, true, false, false, false, false, false],
    'wash-crossed': [false, false, false, false, false, false, true]
  };
  scene.beats.forEach((beat, index) => {
    f.seek(beat);
    for (const [name, row] of Object.entries(table)) assert.equal(has(name), row[index], `${name} at ${beat}s`);
  });
  // The record fades in during the first 0.6 s of the shift beat, so it is absent at the
  // beat's first frame and present after; the wine wash arrives with the down map.
  f.seek(scene.beats[2] + 0.05); assert(has('show-record'));
  f.seek(scene.beats[5] + 4); assert(!has('wash-crossed'));
  f.seek(scene.beats[5] + 4.5); assert(has('wash-crossed'));
  // The arrow and its label are grey until a pooled map stands, ink while one does.
  f.seek(0); assert(!drawing(f).includes('pb-arrow is-used'));
  f.seek(scene.beats[1] + 3); assert(drawing(f).includes('pb-arrow is-used'));
  f.seek(scene.beats[2] + 1.5); assert(!drawing(f).includes('pb-arrow is-used'));
});

test('pooling: the CSS the player toggles exists, so every class it sets changes something', () => {
  const rule = pattern => assert.match(css, pattern, `player.css lacks ${pattern}`);
  rule(/\.mechanism-excerpt\.stage-0 \.pb-formula \{ visibility: hidden/);
  rule(/\.mechanism-excerpt\.wash-bin \.pb-bin \{ background: rgba\(35, 45, 75, \.14\)/);
  rule(/\.mechanism-excerpt\.wash-crossed \.pb-bin \{ background: rgba\(114, 47, 55, \.16\)/);
  rule(/\.pb-out\.is-changed \{ stroke: var\(--pb-error\); stroke-width: 3/);
  rule(/\.pb-ghost-cell\.is-changed \{ stroke: var\(--pb-error\)/);
  rule(/\.pb-sign\.is-changed \{ fill: var\(--pb-error\)/);
  rule(/\.pb-ghost-cell \{[^}]*stroke-dasharray: 4 3/);
  rule(/\.pb-candidate \{[^}]*stroke-dasharray: 4 3/);
  rule(/\.pb-path\.is-cross \{ stroke: var\(--pb-error\)/);
  rule(/\.pb-path\.is-stay \{ stroke: var\(--pb-ink\)/);
  rule(/\.pb-crossed-edge \{ stroke: var\(--pb-error\)/);
  // A label written over the grid carries a luminance channel of its own.
  rule(/\.pb-path-label \{[^}]*paint-order: stroke;[^}]*stroke: #fff/);
  assert.doesNotMatch(css, /text-decoration\s*:/);
  // The two mark kinds this revision removed are gone from the stylesheet too, so nothing
  // can quietly draw them again.
  for (const gone of ['.pb-zero', '.pb-index']) assert(!css.includes(gone), `${gone} still has a rule`);
  // Colour = meaning: blue is the book's \featurepart, wine its \residualpart, the object is
  // ink. No orange, purple or green appears in this scene's stylesheet.
  rule(/--pb-input: #2b6cb0/); rule(/--pb-error: #722f37/); rule(/--pb-ink: #232d4b/);
  rule(/#pooling-bins-excerpt \.error-role \{ color: var\(--pb-error\)/);
  for (const foreign of ['#c05621', '#B45309', '#805ad5', '#7950b8', '#2f855a', '#9b2c4c']) assert(!css.includes(foreign), `${foreign} in player.css`);
});

test('pooling: the three formulas are TeX in eq- wrappers with the book\'s macro, and playback never rewrites them', t => {
  const f = fixture(t, NAME);
  const ids = [1, 2, 3].map(n => `eq-pooling-bins-${n}`);
  for (const id of ids) {
    const span = f.d.getElementById(id);
    assert(span, `${id} missing`);
    assert.match(span.textContent.trim(), /^\\\([\s\S]+\\\)$/, `${id} is not \\( … \\)`);
  }
  const line = tex(f, 1);
  assert(line.includes('\\featurepart{h_{i,j}}') && line.includes('\\featurepart{x_{a,b}}'), 'the pooled map and the input are both \\featurepart');
  assert(line.includes('\\max_{(a,b)\\,\\in\\,\\class{pb-bin}{\\mathcal{W}_{i,j}}}'), 'the window is the toggled part');
  assert(tex(f, 2).includes('\\featurepart{x}') && tex(f, 3).includes('\\featurepart{h}'));
  const all = ids.map(id => f.d.getElementById(id).textContent).join('\n');
  assert.doesNotMatch(all, /\d/, 'no number inside a formula: the values live on the picture');
  for (const foreign of ['\\parameterpart', '\\predictionpart', '\\targetpart', '\\residualpart']) assert(!all.includes(foreign), `${foreign} in a formula of a scene with no such quantity`);
  f.load(); f.open();
  const sources = ids.map(id => f.d.getElementById(id).textContent);
  for (const time of times(0.05)) {
    f.seek(time);
    ids.forEach((id, n) => assert.equal(f.d.getElementById(id).textContent, sources[n], `${id} rewritten at ${time}s`));
    assert.equal(f.root.querySelectorAll('span[id^="eq-"]').length, 3);
  }
});

test('pooling: captions are prose within the budget, coloured by meaning, and the pane carries no chrome', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  assert.equal(f.root.querySelectorAll('.mechanism-stages').length, 0, 'no stage strip');
  assert.equal(f.root.querySelectorAll('[data-pane] dl, [data-pane] table, [data-pane] section').length, 0, 'no cards, no tables');
  const seenRoles = new Set();
  for (const time of times(0.05)) {
    f.seek(time);
    const html = caption(f).innerHTML, text = caption(f).textContent.trim();
    assert.doesNotMatch(html, /<sup|<sub|\^|\bmax_|\bexp\(/, `pseudo-math in the caption at ${time}s: ${html}`);
    const words = text.split(/\s+/).filter(Boolean).length;
    assert(words > 0 && words <= CAPTION_WORDS, `caption at ${time}s has ${words} words`);
    for (const role of ['input-role', 'error-role', 'bin-role']) if (html.includes(`class="${role}"`)) seenRoles.add(role);
    assert.doesNotMatch(f.$('[data-pane]').textContent, /beat \d/i, `stage chrome in the pane at ${time}s`);
  }
  assert.deepEqual([...seenRoles].sort(), ['bin-role', 'error-role', 'input-role'],
    'the caption words 9 / bins / changed carry the picture\'s colours');
  // The numbers a caption states are the ones the picture has already written.
  f.seek(scene.beats[3]); assert.match(caption(f).textContent, /Same four values/); assert.deepEqual(pooled(f), [9, 0, 0, 3]);
  f.seek(scene.beats[6]); assert.match(caption(f).textContent, /Two pooled values changed/); assert.deepEqual(pooled(f), [0, 0, 9, 3]);
  f.seek(scene.beats[5]); assert.match(caption(f).textContent, /The 9 leaves its bin/);
  // The scrubber's own wording never repeats the caption.
  const range = f.$('[data-controls] input[type=range]');
  f.seek(scene.beats[3]); assert.match(range.getAttribute('aria-valuetext'), /Same map\. Clues shifted 0 down, 1 right\. Pooled 9, 0, 0, 3\./);
  f.seek(scene.duration); assert.match(range.getAttribute('aria-valuetext'), /Changed\. Clues shifted 1 down, 0 right\. Pooled 0, 0, 9, 3\./);
});

test('pooling: below 600 px the same picture reflows into smaller cells, record still under the output', t => {
  const wide = fixture(t, NAME); wide.load(); wide.open(); wide.seek(scene.duration);
  assert.equal(wide.$('svg').getAttribute('viewBox'), WIDE_BOX);
  assert(!classes(wide).has('is-stacked'));
  const narrow = fixture(t, NAME, {width: NARROW}); narrow.load(); narrow.open(); narrow.seek(scene.duration);
  assert.equal(narrow.$('svg').getAttribute('viewBox'), NARROW_BOX);
  assert(classes(narrow).has('is-stacked'));
  // Same marks, same numbers: only the geometry moved.
  assert.deepEqual(values(narrow, ''), values(wide, ''));
  assert.equal(narrow.root.querySelectorAll('[data-path]').length, 2);
  assert.deepEqual(texts(narrow, '[data-note]'), texts(wide, '[data-note]'));
  const tags = f => [...f.root.querySelectorAll('foreignObject')].map(node => `${node.getAttribute('x')},${node.getAttribute('y')}`);
  assert.notDeepEqual(tags(narrow), tags(wide), 'the typeset labels move with their marks');
  // Nothing collides in the narrow layout: the output grid sits right of the input grid, the
  // record under the output, every mark inside the viewBox.
  const [, , NW, NH] = NARROW_BOX.split(/\s+/).map(Number);
  const box = selector => [...narrow.root.querySelectorAll(selector)].map(node => ['x', 'y', 'width', 'height'].map(a => attr(node, a)));
  const inputs = box('.pb-cell'), outs = box('[data-out]'), ghosts = box('[data-ghost]');
  const inputRight = Math.max(...inputs.map(([x, , w]) => x + w));
  assert(Math.min(...outs.map(([x]) => x)) >= inputRight + 30, 'the output grid runs into the input grid');
  assert(Math.min(...ghosts.map(([, y]) => y)) > Math.max(...outs.map(([, y, , h]) => y + h)) + 20, 'the record runs into the output');
  // Each recorded value sits directly under the live value it is compared with: same columns.
  const outCols = [...new Set(outs.map(([x, , w]) => `${x}:${w}`))].sort();
  assert.deepEqual([...new Set(ghosts.map(([x, , w]) => `${x}:${w}`))].sort(), outCols, 'the record does not line up under the pooled map');
  for (const [x, y, w, h] of [...outs, ...ghosts, ...inputs]) assert(x >= 0 && x + w <= NW && y >= 0 && y + h <= NH, 'a rect leaves the narrow viewBox');
  for (const node of narrow.root.querySelectorAll('[data-drawing] text')) {
    assert(attr(node, 'x') >= 0 && attr(node, 'x') <= NW, `"${node.textContent}" leaves the narrow viewBox`);
    assert(attr(node, 'y') >= 0 && attr(node, 'y') <= NH, `"${node.textContent}" leaves the narrow viewBox`);
  }
  // The one narrow ray obeys the same rule as the wide one: the middle of its output cell's
  // left edge, never the corner two cells share.
  narrow.seek(scene.beats[5] + 5);
  const ray = narrow.root.querySelector('[data-ray]');
  assert(ray, 'the payoff ray is drawn in the narrow layout too');
  const i = Number(ray.dataset.ray[0]), j = Number(ray.dataset.ray[1]);
  const nOut = outs.filter(([, , w]) => w).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const cell = nOut[i * 2 + j];
  assert.equal(attr(ray, 'x2'), cell[0]);
  assert.equal(attr(ray, 'y2'), cell[1] + cell[3] / 2);
  // A resize flips the mode in place, without restarting anything.
  wide.resize(NARROW);
  assert.equal(wide.$('svg').getAttribute('viewBox'), NARROW_BOX); assert(classes(wide).has('is-stacked'));
  wide.resize(WIDE);
  assert.equal(wide.$('svg').getAttribute('viewBox'), WIDE_BOX); assert(!classes(wide).has('is-stacked'));
  assert(!wide.playing);
});

test('pooling: the panel is the only fixture copy -- moving it moves every number', t => {
  const f = fixture(t, NAME);
  // Not a manuscript edit: this proves the player reads the declared attributes, so a real
  // chapter change could not leave a stale number behind in the scene script or the SVG.
  // Two clues 7 and 2 stacked in the upper-left bin; the right shift keeps them there, the
  // down shift moves the 2 across an edge and leaves the 7 where it is.
  f.root.dataset.scene = '0 0 7 1 0 2';
  f.load(); f.open();
  f.seek(scene.beats[3]); assert.deepEqual(pooled(f), [7, 0, 0, 0]); assert.deepEqual(values(f, 'g'), ['7', '0', '0', '0']);
  f.seek(scene.duration); assert.deepEqual(pooled(f), [7, 0, 2, 0]);
  assert.match(caption(f).textContent, /One pooled values changed/);
  f.seek(scene.beats[5]); assert.match(caption(f).textContent, /The 2 leaves its bin/);
  f.seek(scene.beats[0]); assert.match(caption(f).textContent, /Two clues sit in fixed 2×2 bins/);
  // The closing paths follow the clue that crosses, not a hard-coded cell.
  f.seek(scene.duration);
  const cross = f.root.querySelector('[data-path="cross"]');
  assert.equal(attr(cross, 'x1'), INPUT[0] + 0.5 * CELL, 'the downward path leaves the 2\'s column, not the 7\'s');
  assert(attr(cross, 'y1') > INPUT[1] + 1.5 * CELL && attr(cross, 'y1') < INPUT[1] + 1.8 * CELL, 'it leaves the 2\'s home cell');
  assert(attr(cross, 'y2') > INPUT[1] + 2 * CELL, 'and reaches past the bin edge it crosses');
  const pane = f.$('[data-pane]').cloneNode(true);
  pane.querySelectorAll('span[id^="eq-"]').forEach(node => node.remove());
  for (const stale of ['9', '3']) assert(![...pane.querySelectorAll('[data-value]')].some(node => node.textContent === stale), `${stale} survived a moved fixture`);
});

test('integration: the excerpt is HTML-only, manifest-driven, and declared in the config', () => {
  const filter = fs.readFileSync(path.join(__dirname, '..', scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/,
    'the non-HTML guard is the first executable line, so the PDF is untouched');
  assert.match(filter, /pandoc\.json\.decode/, 'the scene is data in the manifest, not code in the filter');
  assert.match(filter, /"before-heading"/, 'the filter must be able to place this scene\'s anchor kind');
  assert.match(filter, /assert\(inserted == 1/);
  assert.doesNotMatch(filter, /pooling/i, 'a manifest-driven filter names no scene');
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
  // The chapter is anchored on a level-2 heading -- the `pool-invariance` cell is labelled
  // but Quarto gives a non-figure cell no cell-<label> div -- so the heading must exist
  // exactly once, and the fixture cell must sit above it.
  assert.equal(scene.anchor.type, 'before-heading');
  const chapter = chapterSource(NAME);
  const headings = chapter.split('\n').filter(line => line === `## ${scene.anchor.target}`);
  assert.equal(headings.length, 1, 'the anchor heading appears exactly once');
  assert(chapter.indexOf('#| label: pool-invariance') < chapter.indexOf(`## ${scene.anchor.target}`), 'the fixture cell precedes the anchor');
  assert.equal(read(`${scene.scene}/panel.html`).includes('data-playback='), scene.transport === 'shared');
  assert(manifest.scenes.some(other => other.id === NAME));
  assert.deepEqual(scene.beats, [0, 4, 11, 17, 22, 26, 34]);
  assert.match(scene.fixture.computedVariants[1], /pool to 0, 0, 9, 3/);
  assert.match(scene.fixture.computedVariants[0], /pooled original: \[\[9\.0, 0\.0\], \[0\.0, 3\.0\]\]/);
  assert.equal(scene.receipt, 'docs/wave2-excerpts.md');
});
