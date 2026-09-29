#!/usr/bin/env node
// Test-only checks for the Chapter 16 both-axes scene. Nothing here ships.
// The claim is about addresses: a reordering moves each weight with its query's row and its
// key's column, and each value block with its key's column. So the suite reads every address
// back out of the drawn SVG, cell by cell, at fine time steps, and recomputes every number
// from the panel's declared tokens, weights and order, never from the player's own state.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, close, canonicalMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'both-axes-excerpt', scene = entry(NAME);
const WIDTHS = [296, 375, 599, 600, 713, 900];
const EPS = 1e-4;
// The brief's captions, verbatim: the player composes them from the fixture, and this list
// binds what it composes to the wording the author approved.
const CAPTION = {
  start: 'Bank\'s row: 0.70 on river\'s key, 0.20 on bank\'s own. Each tick marks a token\'s weight on itself.',
  rows: 'Reorder to by, river, bank, the. The query rows move first, each to its token\'s new slot.',
  landed: 'Bank\'s row sits in slot 2, and bank\'s output rode with it. The columns have not moved.',
  ask: 'Keys reorder too. Does bank\'s 0.70 stay in column 3, or follow river?',
  columns: 'Each weight follows its key\'s column, and each value block slides along beneath it.',
  reveal: '0.70 followed river to column 1, and river\'s value came along: bank\'s output is unchanged.',
  restart: 'Back to the start, then the same reordering in one move: rows with outputs, columns with value blocks.',
  glided: 'Every tick slid along the diagonal and never left it.',
  roles: 'Queries moved the rows, keys moved the columns, and each value block moved with its key.',
  same: 'Same four weights in bank\'s row, at new addresses; bank\'s output sits in slot 2, unchanged.',
  close: 'Bank\'s 0.20 is back on the diagonal, and 0.70 still meets river\'s value block.'
};
const TEX = String.raw`\(\operatorname{Attention}(Q,K,V)=\operatorname{softmax}\left(\frac{\class{ba-q}{Q}\class{ba-kt}{K^\top}}{\sqrt d}\right)\class{ba-v}{V}\)`;
const BOUNDARY = 'One reordering of the chapter\'s illustrative weights, in bare self-attention with no mask and no position signal; the proof that follows covers every reordering.';

const attr = (node, key) => Number(node.getAttribute(key));
const drawing = f => f.$('[data-drawing]');
const all = (f, name) => [...drawing(f).querySelectorAll(`[data-mark="${name}"]`)];
const one = (f, name) => drawing(f).querySelector(`[data-mark="${name}"]`);
const tokenOf = node => Number(node.getAttribute('data-token'));
const visible = node => !node.closest('[hidden]');
const valuetext = f => f.$('[data-controls] input[type=range]').getAttribute('aria-valuetext');
const steps = (from, to, dt = 0.1) => {
  const out = [];
  for (let i = Math.round(from / dt); i <= Math.round(to / dt) + 1e-9; i++) out.push(Number((i * dt).toFixed(4)));
  return out;
};
const inWindow = (t, a, b) => t >= a - 1e-9 && t <= b + 1e-9;
// A text node's box, estimated from its font size (0.58 em per character, a generous
// average), its anchor and its baseline.
const textBox = node => {
  const size = attr(node, 'font-size'), anchor = node.getAttribute('text-anchor');
  const w = node.textContent.length * size * 0.58, x = attr(node, 'x'), y = attr(node, 'y');
  const left = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
  return {node, left, right: left + w, top: y - size * 0.78, bottom: y + size * 0.22, text: node.textContent};
};
const collide = (a, b, slack = 0.5) =>
  Math.min(a.right, b.right) - Math.max(a.left, b.left) > slack && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > slack;

const declared = root => ({
  tokens: root.dataset.tokens.trim().split(/\s+/),
  A: root.dataset.weights.split(';').map(row => numbers(row)),
  order: numbers(root.dataset.order)
});
const slotIn = order => token => order.indexOf(token);
const matmul = (X, Y) => X.map(row => Y[0].map((_, j) => row.reduce((sum, value, k) => sum + value * Y[k][j], 0)));
const transpose = X => X[0].map((_, j) => X.map(row => row[j]));
const perm = order => order.map(token => order.map((_, j) => (j === token ? 1 : 0)));
const near = (X, Y, eps = 1e-12) => X.every((row, i) => row.every((value, j) => Math.abs(value - Y[i][j]) <= eps));

// The drawn state, read back from the SVG: the grid frame gives the slot geometry, and each
// cell's centre gives its address in slots.
function read_state(f) {
  const frame = one(f, 'frame');
  const gx = attr(frame, 'x'), gy = attr(frame, 'y'), side = attr(frame, 'width'), d = declared(f.root);
  const c = side / d.tokens.length;
  const cells = all(f, 'cell').map(node => {
    const x = attr(node, 'x') + attr(node, 'width') / 2, y = attr(node, 'y') + attr(node, 'height') / 2;
    return {node, q: Number(node.getAttribute('data-q')), k: Number(node.getAttribute('data-k')), x, y,
      row: (y - gy) / c - 0.5, col: (x - gx) / c - 0.5};
  });
  const cell = (q, k) => cells.find(item => item.q === q && item.k === k);
  const ticks = all(f, 'tick').map(node => {
    const [, tx, ty] = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(node.getAttribute('transform')).map(Number);
    return {node, token: tokenOf(node), tx, ty};
  });
  const names = (mark, key) => all(f, mark).slice().sort((a, b) => attr(a, key) - attr(b, key)).map(node => node.textContent);
  return {gx, gy, c, side, cells, cell, ticks, d,
    rows: names('row-name', 'y'), cols: names('col-name', 'x'),
    digits: all(f, 'digit').slice().sort((a, b) => attr(a, 'x') - attr(b, 'x')).map(node => node.textContent)};
}
const onDiagonal = (s, token) => {
  const c = s.cell(token, token);
  return Math.abs(c.row - c.col) < 1e-6 && Math.abs(c.row - Math.round(c.row)) < 1e-6;
};

registerTransportTests(NAME, {witness: /0\.70/, anchors: ['both-axes-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('both axes: the declared fixture is the chapter figure\'s tokens and weights', t => {
  const f = fixture(t, NAME);
  const d = declared(f.root), chapter = chapterSource(NAME);
  assert.equal(f.root.dataset.evidenceClass, 'computed');
  assert.deepEqual(d.tokens, JSON.parse(/tokens = (\[[^\]]*\])/.exec(chapter)[1]));
  // The cell's A, row by row, and the fig-alt's printed top row.
  const from = chapter.indexOf('A = np.array([['), to = chapter.indexOf(']])', from);
  assert(from > 0 && to > from, 'the chapter still prints the figure\'s A');
  const cellA = [...chapter.slice(from, to + 3).matchAll(/\[(\d\.\d\d(?:, \d\.\d\d)*)\]/g)].map(match => match[1].split(', ').map(Number));
  assert.deepEqual(d.A, cellA);
  const alt = /Its top row, for bank, reads ([\d., ]+) and sums to 1\./.exec(chapter)[1].split(',').map(Number);
  assert.deepEqual(d.A[0], alt);
  for (const row of d.A) close(row.reduce((a, b) => a + b, 0), 1, 1e-12);
  assert(chapter.includes('(0.8 if hot else 0.6) * A[i, j] + 0.12'), 'the opacity map is the figure\'s');
  assert(chapter.includes('f"{A[0, j]:.2f}"'), 'the figure prints bank\'s row to two decimals');
  assert(chapter.includes('the numbers and shading are illustrative'));
  // Every bound literal occurs exactly once, so the audit's binding is unambiguous.
  for (const literal of scene.fixture.literals) assert.equal(chapter.split(literal).length, 2, literal.slice(0, 60));
  // The frozen page prints none of the hidden rows: the cell is echo: false.
  const cell = chapter.slice(chapter.indexOf('#| label: fig-self-attention-read'), chapter.indexOf('plt.tight_layout(); plt.show()'));
  assert.match(cell, /#\| echo: false/);
});

test('both axes: the declared reordering moves every token, once, and is not the check\'s', t => {
  const f = fixture(t, NAME);
  const {order, tokens} = declared(f.root);
  assert.deepEqual(order, [1, 3, 0, 2]);
  assert.deepEqual([...order].sort((a, b) => a - b), tokens.map((_, i) => i), 'a reordering: every slot filled once');
  assert(order.every((token, i) => token !== i), 'every token moves');
  assert(order.some((token, i) => order[token] !== i), 'it does not reverse itself');
  const shifts = tokens.map((_, s) => tokens.map((__, i) => (i + s) % tokens.length));
  assert(!shifts.some(shift => shift.every((token, i) => token === order[i])), 'it is not a cyclic shift');
  assert.notDeepEqual(order, [2, 3, 1, 0], 'the panel never animates the check\'s order');
  assert.equal(order.map(i => tokens[i]).join(', '), 'by, river, bank, the');
});

test('both axes: every declared variant follows from the literals and the order', t => {
  const f = fixture(t, NAME);
  const {A, order} = declared(f.root), slot = slotIn(order);
  const [bank, by, the, river] = [0, 1, 2, 3];
  assert.equal(A[bank].indexOf(Math.max(...A[bank])), river, '0.70 is on river\'s key');
  assert.equal(slot(bank), 2); assert.equal(slot(river), 1);
  // 0.70 moves (0, 3) to (2, 3) to (2, 1); bank's 0.20 moves (0, 0) to (2, 0) to (2, 2).
  assert.deepEqual([[bank, river], [slot(bank), river], [slot(bank), slot(river)]], [[0, 3], [2, 3], [2, 1]]);
  assert.deepEqual([[bank, bank], [slot(bank), bank], [slot(bank), slot(bank)]], [[0, 0], [2, 0], [2, 2]]);
  const rowsOnly = order.map(q => A[q]), final = order.map(q => order.map(k => A[q][k]));
  assert.deepEqual(final[slot(bank)].map(v => v.toFixed(2)), ['0.05', '0.70', '0.20', '0.05']);
  // Rows only: the self-weights sit at bank (2, 0), by (0, 1), the (3, 2), river (1, 3).
  assert.deepEqual([bank, by, the, river].map(token => [slot(token), token]), [[2, 0], [0, 1], [3, 2], [1, 3]]);
  assert.deepEqual(rowsOnly.map((row, i) => row[i].toFixed(2)), ['0.15', '0.10', '0.05', '0.25']);
  assert.deepEqual(final.map((row, i) => row[i].toFixed(2)), ['0.40', '0.35', '0.20', '0.40']);
  assert.deepEqual(final.map((row, i) => row[i]), order.map(token => A[token][token]), 'the final diagonal is the self-weights');
  for (const row of final) close(row.reduce((a, b) => a + b, 0), 1, 1e-12);
  // The check's order and its two slips.
  const check = [2, 3, 1, 0], cs = slotIn(check);
  assert.deepEqual([cs(bank), cs(river)], [3, 1]); assert.deepEqual([cs(bank), cs(bank)], [3, 3]);
  assert.deepEqual(check.map(k => A[bank][k].toFixed(2)), ['0.05', '0.70', '0.05', '0.20']);
  assert.deepEqual([cs(bank), river], [3, 3], 'rows-only trap: 0.70 at (3, 3)');
  assert.deepEqual([cs(bank), bank], [3, 0], 'and bank\'s 0.20 at (3, 0)');
  assert.deepEqual([check[bank], check[river]], [2, 0], 'direction slip: bank\'s row in slot 2, 0.70 at (2, 0)');
});

test('both axes: the four identities hold for a generic V (tests only, never on the panel)', t => {
  const f = fixture(t, NAME);
  const {A, order} = declared(f.root);
  const V = [[1.3, -0.4, 0.7], [-0.9, 2.1, 0.25], [0.6, 0.35, -1.7], [1.9, -1.2, 0.45]];
  const P = perm(order), PT = transpose(P), PAV = matmul(P, matmul(A, V));
  // (P X)_i = X_{order[i]}: P is the reordering the panel draws.
  assert.deepEqual(matmul(P, [[0], [1], [2], [3]]).map(row => row[0]), order);
  assert(near(matmul(matmul(P, A), V), PAV), 'P A V = P(A V): bank\'s output rides with its row');
  assert(near(matmul(matmul(matmul(P, A), PT), matmul(P, V)), PAV), 'P A Pᵀ · P V = P(A V)');
  assert(!near(matmul(matmul(P, A), matmul(P, V)), PAV, 1e-6), 'P A · P V ≠ P(A V): values moved, columns not');
  assert(!near(matmul(matmul(matmul(P, A), PT), V), PAV, 1e-6), 'P A Pᵀ · V ≠ P(A V): columns moved, values not');
  // The final grid entrywise is A[order[i], order[j]].
  assert(near(matmul(matmul(P, A), PT), order.map(q => order.map(k => A[q][k]))));
});

test('both axes: each cell is one (query, key) pair, shaded by the figure\'s map, at every step', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const {A} = declared(f.root);
  const shade = (q, k) => (q === 0 ? 0.8 : 0.6) * A[q][k] + 0.12;
  for (const time of steps(0, scene.duration)) {
    f.seek(time);
    const s = read_state(f);
    assert.equal(s.cells.length, 16, `one grid of sixteen cells at ${time}s`);
    assert.equal(new Set(s.cells.map(cell => `${cell.q},${cell.k}`)).size, 16);
    assert.equal(drawing(f).querySelectorAll('[data-mark="frame"]').length, 1, 'one grid, never a second');
    for (const cell of s.cells) {
      close(attr(cell.node, 'fill-opacity'), shade(cell.q, cell.k), EPS);
      close(attr(cell.node, 'width'), s.c - (s.c > 60 ? 4 : 3), EPS);
    }
    // A cell sits on its query's row and its key's column, whatever else is moving.
    for (const q of [0, 1, 2, 3]) for (const k of [1, 2, 3]) close(s.cell(q, k).row, s.cell(q, 0).row, EPS);
    for (const k of [0, 1, 2, 3]) for (const q of [1, 2, 3]) close(s.cell(q, k).col, s.cell(0, k).col, EPS);
  }
});

test('both axes: four ticks, each on its own self-weight cell, on the diagonal exactly when they should be', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (const time of steps(0, scene.duration)) {
    f.seek(time);
    const s = read_state(f);
    assert.equal(s.ticks.length, 4, `four ticks at ${time}s`);
    assert.deepEqual(s.ticks.map(tick => tick.token).sort(), [0, 1, 2, 3]);
    const offsets = s.ticks.map(tick => {
      const cell = s.cell(tick.token, tick.token);
      return [cell.x - tick.tx, cell.y - tick.ty];
    });
    for (const [dx, dy] of offsets) {
      close(dx, offsets[0][0], 1e-3); close(dy, offsets[0][1], 1e-3);
      close(dx, dy, 1e-3); assert(dx > 0 && dx < s.c / 2, 'the tick rides in its cell\'s top-left quadrant');
    }
    const on = [0, 1, 2, 3].filter(token => onDiagonal(s, token)).length;
    if (inWindow(time, 0, 5.5) || inWindow(time, 17, 21) || inWindow(time, 24, scene.duration))
      assert.equal(on, 4, `every tick on the diagonal at ${time}s`);
    if (inWindow(time, 8, 14)) assert.equal(on, 0, `no tick on the diagonal at ${time}s`);
    // The one-move glide: every tick's centre stays on the diagonal line.
    if (inWindow(time, 21, 24.5))
      for (const tick of s.ticks) close(tick.tx - s.gx, tick.ty - s.gy, 1e-3);
  }
});

test('both axes: value blocks ride their key columns and output blocks their query rows', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  let held = null, heldLate = null;
  const snapshot = node => ['x', 'y', 'width', 'height', 'class'].map(key => node.getAttribute(key)).join('|');
  for (const time of steps(0, scene.duration)) {
    f.seek(time);
    const s = read_state(f);
    for (const node of all(f, 'value')) {
      const k = tokenOf(node);
      close(attr(node, 'x') + attr(node, 'width') / 2, s.cell(0, k).x, EPS);
      const name = all(f, 'value-name').find(label => tokenOf(label) === k);
      close(attr(name, 'x'), s.cell(0, k).x, EPS);
      const col = all(f, 'col-name').find(label => tokenOf(label) === k);
      close(attr(col, 'x'), s.cell(0, k).x, EPS);
    }
    for (const node of all(f, 'output')) {
      const q = tokenOf(node);
      close(attr(node, 'y') + attr(node, 'height') / 2, s.cell(q, 0).y, EPS);
    }
    const own = all(f, 'output').find(node => tokenOf(node) === 0);
    if (inWindow(time, 8, 20)) { held = held || snapshot(own); assert.equal(snapshot(own), held, `bank's output moved at ${time}s`); }
    if (inWindow(time, 24, scene.duration)) { heldLate = heldLate || snapshot(own); assert.equal(snapshot(own), heldLate, `bank's output moved at ${time}s`); }
  }
  assert.equal(held, heldLate, 'bank\'s output rests in the same place after the reveal and after the one-move glide');
});

test('both axes: nothing of the answer appears before 14 s, in any channel', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const chapterOrder = 'bank, by, the, river', newOrder = 'by, river, bank, the';
  f.seek(0);
  const valuesAt0 = all(f, 'value').map(node => attr(node, 'x'));
  for (const time of steps(0, 14)) {
    f.seek(time);
    const s = read_state(f);
    close(s.cell(0, 3).col, 3, 1e-9); close(s.cell(0, 0).col, 0, 1e-9);
    assert.equal(s.cols.join(', '), chapterOrder, `the column names moved by ${time}s`);
    assert.equal(s.digits.join(', '), '0.20, 0.05, 0.05, 0.70', `bank's row is read in a new order at ${time}s`);
    assert.deepEqual(all(f, 'value').map(node => attr(node, 'x')), valuesAt0, `a value block glides at ${time}s`);
    const channels = [...drawing(f).querySelectorAll('text')].filter(visible).map(node => node.textContent)
      .concat(f.$('[data-caption]').textContent, f.$('[data-figure] svg').getAttribute('aria-label'), valuetext(f));
    for (const text of channels) {
      assert(!/column 1\b/.test(text), `"column 1" at ${time}s: ${text}`);
      assert(!text.includes('0.05, 0.70, 0.20, 0.05'), `the new row at ${time}s: ${text}`);
      assert(!text.includes(`columns ${newOrder}`) && !text.includes(`keys ${newOrder}`), `new key order at ${time}s: ${text}`);
    }
    assert(!f.$('[data-figure] svg').getAttribute('aria-label').includes(newOrder));
  }
});

test('both axes: the holds show the right order on each axis', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (const time of steps(0, scene.duration)) {
    f.seek(time);
    const s = read_state(f);
    const rows = s.rows.join(', '), cols = s.cols.join(', ');
    if (inWindow(time, 0, 5.5)) assert.deepEqual([rows, cols], ['bank, by, the, river', 'bank, by, the, river'], `${time}s`);
    if (inWindow(time, 8, 14)) assert.deepEqual([rows, cols], ['by, river, bank, the', 'bank, by, the, river'], `${time}s`);
    if (inWindow(time, 17, 20) || inWindow(time, 24, scene.duration))
      assert.deepEqual([rows, cols], ['by, river, bank, the', 'by, river, bank, the'], `${time}s`);
    if (inWindow(time, 20.4, 21)) assert.deepEqual([rows, cols], ['bank, by, the, river', 'bank, by, the, river'], `${time}s`);
  }
  // The reveal: 0.70 at (2, 1), bank's 0.20 at (2, 2), the row in its new column order.
  f.seek(17);
  const s = read_state(f);
  assert.deepEqual([s.cell(0, 3).row, s.cell(0, 3).col].map(Math.round), [2, 1]);
  assert.deepEqual([s.cell(0, 0).row, s.cell(0, 0).col].map(Math.round), [2, 2]);
  assert.equal(s.digits.join(', '), '0.05, 0.70, 0.20, 0.05');
});

test('both axes: three glides share one easing, one move is straight, and the restart is a fade', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const progress = (time, pick) => { f.seek(time); return pick(read_state(f)); };
  const bankRow = s => s.cell(0, 0).row / 2, riverCol = s => (3 - s.cell(0, 3).col) / 2;
  for (const u of [0.1, 0.3, 0.5, 0.7, 0.9]) {
    const rows = progress(5.5 + u * 2.5, bankRow), cols = progress(14 + u * 3, riverCol), both = progress(21 + u * 3, bankRow);
    close(rows, cols, 1e-4); close(rows, both, 1e-4);
    assert(rows > 0 && rows < 1);
  }
  // Rows glide alone, then columns alone.
  f.seek(6.75); let s = read_state(f);
  assert(s.cell(0, 0).row > 0.05 && s.cell(0, 0).row < 1.95); close(s.cell(0, 3).col, 3, 1e-9);
  f.seek(15.5); s = read_state(f);
  close(s.cell(0, 0).row, 2, 1e-9); assert(s.cell(0, 3).col > 1.05 && s.cell(0, 3).col < 2.95);
  // The one move: every cell travels the straight segment from its chapter address to its final one.
  const {order} = declared(f.root), slot = slotIn(order);
  for (const time of [21.3, 22, 22.5, 23.1, 23.8]) {
    f.seek(time); s = read_state(f);
    for (const cell of s.cells) {
      const [r0, c0, r1, c1] = [cell.q, cell.k, slot(cell.q), slot(cell.k)];
      const cross = (cell.row - r0) * (c1 - c0) - (cell.col - c0) * (r1 - r0);
      close(cross, 0, 1e-3);
    }
  }
  // The fade acts on the group's opacity only; the cells keep their fills.
  const group = () => attr(one(f, 'moving'), 'opacity'), fills = () => all(f, 'cell').map(node => node.getAttribute('fill-opacity')).join();
  f.seek(19.9); const before = fills();
  for (const [time, opacity] of [[20, 1], [20.2, 0.5], [20.6, 0.5], [20.8, 1], [21, 1]]) { f.seek(time); close(group(), opacity, 1e-4); assert.equal(fills(), before); }
  f.seek(20.39); assert(group() < 0.05);
  for (const time of steps(0, 19.9).concat(steps(20.8, 40))) { f.seek(time); assert.equal(group(), 1, `the group fades at ${time}s`); }
});

test('both axes: the closing ghost and path appear only in the last beat', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const {order} = declared(f.root), slot = slotIn(order);
  for (const time of steps(0, scene.duration, 0.5)) {
    f.seek(time);
    const shown = time >= 36;
    assert.equal(!one(f, 'ghost').hasAttribute('hidden'), shown, `ghost at ${time}s`);
    assert.equal(!one(f, 'path').hasAttribute('hidden'), shown, `path at ${time}s`);
  }
  f.seek(40);
  const s = read_state(f), ghost = one(f, 'ghost');
  close(attr(ghost, 'y') + attr(ghost, 'height') / 2, s.gy + s.c / 2, EPS);
  close(attr(ghost, 'width'), s.side + 2, EPS);
  // The ghost carries no digits: no text of the drawing sits inside its rectangle.
  const gl = attr(ghost, 'x'), gt = attr(ghost, 'y'), gr = gl + attr(ghost, 'width'), gb = gt + attr(ghost, 'height');
  for (const node of [...drawing(f).querySelectorAll('text')].filter(visible)) {
    const box = textBox(node);
    assert(Math.min(box.right, gr) - Math.max(box.left, gl) <= 0 || Math.min(box.bottom, gb) - Math.max(box.top, gt) <= 0,
      `"${box.text}" sits inside the ghost`);
  }
  const pts = one(f, 'path').getAttribute('d').match(/-?[\d.]+/g).map(Number);
  const [sx, sy, ex, ey] = pts;
  close(sx, s.gx + 3.5 * s.c, EPS); close(sy, s.gy + 0.5 * s.c, EPS);
  const tx = s.gx + (slot(3) + 0.5) * s.c, ty = s.gy + (slot(0) + 0.5) * s.c;
  // The path points at (2, 1)'s centre and stops short of the weight printed there.
  close((ex - sx) * (ty - sy) - (ey - sy) * (tx - sx), 0, 0.5);
  const gap = Math.hypot(tx - ex, ty - ey);
  assert(gap > 10 && gap < s.c / 2, `the path stops ${gap}px short`);
  const digit = all(f, 'digit').find(node => node.textContent === '0.70');
  close(attr(digit, 'x'), tx, EPS);
});

test('both axes: reduced motion holds one state per beat; the reveal is spoken, the glide captions never show', t => {
  const f = fixture(t, NAME, {reduced: true}); f.load(); f.open();
  const kind = () => {
    const s = read_state(f);
    return `${s.rows.join(' ')} / ${s.cols.join(' ')}${one(f, 'ghost').hasAttribute('hidden') ? '' : ' + ghost'}`;
  };
  const chapter = 'bank by the river / bank by the river', rows = 'by river bank the / bank by the river';
  const final = 'by river bank the / by river bank the';
  assert.deepEqual(scene.beats.map(beat => { f.seek(beat); return kind(); }),
    [chapter, rows, rows, final, chapter, final, final, `${final} + ghost`]);
  const captions = new Set();
  for (const time of steps(0, scene.duration, 0.05)) { f.seek(time); captions.add(f.$('[data-caption]').textContent); }
  assert(!captions.has(CAPTION.glided), 'the one-move caption is not shown under reduced motion');
  assert(!captions.has(CAPTION.columns), 'no caption describes a slide the reader never sees');
  assert(captions.has(CAPTION.reveal), 'the answer reaches a reader with reduced motion');
  // The reveal beat's still is the finished state, and it carries the reveal for its whole beat.
  for (const time of [14, 17, 19.95]) { f.seek(time); assert.equal(f.$('[data-caption]').textContent, CAPTION.reveal, `${time}s`); }
  f.seek(13.95); assert.equal(f.$('[data-caption]').textContent, CAPTION.ask);
  f.seek(20); assert.equal(f.$('[data-caption]').textContent, CAPTION.restart);
  assert.equal(attr(one(f, 'moving'), 'opacity'), 1);
});

test('both axes: the captions are the brief\'s, on the declared clock', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const schedule = [[0, 'start'], [5, 'rows'], [8, 'landed'], [10, 'ask'], [14, 'columns'], [17, 'reveal'],
    [20, 'restart'], [24, 'glided'], [26, 'roles'], [31, 'same'], [36, 'close']];
  for (let i = 0; i < schedule.length; i++) {
    const [start, key] = schedule[i], end = i + 1 < schedule.length ? schedule[i + 1][0] : scene.duration + 0.01;
    for (const time of [start, (start + end) / 2, end - 0.01]) {
      f.seek(Math.min(time, scene.duration));
      assert.equal(f.$('[data-caption]').textContent, CAPTION[key], `caption at ${time}s`);
    }
  }
  for (const text of Object.values(CAPTION)) assert(text.split(/\s+/).length <= 20, text);
  // The ask holds still: nothing in the drawing changes from the rows' landing to the reveal.
  f.seek(8); const landed = canonicalMarkup(drawing(f).innerHTML);
  for (const time of steps(8, 14)) { f.seek(time); assert.equal(canonicalMarkup(drawing(f).innerHTML), landed, `the drawing moves at ${time}s`); }
  // Measured, not assumed: from the later of the ask's first showing and the drawing's last
  // change before it, the ask stands still at least four seconds before anything replaces it.
  let askStart = null, askEnd = null, lastChange = 0, previous = null;
  for (const time of steps(0, 20, 0.05)) {
    f.seek(time);
    const markup = canonicalMarkup(drawing(f).innerHTML), text = f.$('[data-caption]').textContent;
    if (askStart !== null && askEnd === null && (text !== CAPTION.ask || markup !== previous)) askEnd = time;
    if (askStart === null && markup !== previous) lastChange = time;
    if (askStart === null && text === CAPTION.ask) askStart = time;
    previous = markup;
  }
  assert(askStart !== null && askEnd !== null);
  assert(askEnd - Math.max(askStart, lastChange) >= 4 - 1e-9,
    `the ask stands still ${(askEnd - Math.max(askStart, lastChange)).toFixed(2)}s (from ${Math.max(askStart, lastChange)}s to ${askEnd}s)`);
});

test('both axes: the formula is the chapter\'s display, washed by the move it names', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const spans = f.formulas();
  assert.equal(spans.length, 1); assert.equal(spans[0].id, 'eq-both-axes-1');
  assert.equal(spans[0].textContent.trim(), TEX);
  assert.doesNotMatch(TEX, /\bP\b|SA|top\}\s*P/, 'no reordering matrix, no SA in the formula');
  const formula = f.$('[data-formula]');
  for (const time of steps(0, scene.duration)) {
    f.seek(time);
    const q = inWindow(time, 5.5, 7.999) || time >= 21, kv = inWindow(time, 14, 16.999) || time >= 21;
    assert.equal(formula.classList.contains('ba-q-lit'), q, `Q wash at ${time}s`);
    assert.equal(formula.classList.contains('ba-kv-lit'), kv, `K and V wash at ${time}s`);
  }
  const css = read('both-axes/player.css');
  for (const cls of ['.ba-q-lit .ba-q', '.ba-kv-lit .ba-kt', '.ba-kv-lit .ba-v']) assert(css.includes(cls));
  assert.match(css, /\[data-ready\] \.ba-formula\.ba-q-lit/, 'washes apply only after mount');
  assert.equal(f.root.querySelectorAll('a[href^="#eq-"]').length, 0, 'the display has no label, so no link');
  assert.doesNotMatch(read('both-axes/panel.html'), /<a href="#eq-|@eq-/);
});

test('both axes: the prose is the brief\'s, within budget', t => {
  const f = fixture(t, NAME);
  const words = text => text.trim().split(/\s+/).length;
  const boundary = f.$('.mechanism-boundary > p').textContent.trim();
  assert.equal(boundary, BOUNDARY); assert.equal(words(boundary), 24);
  assert.equal(f.root.querySelectorAll('.mechanism-boundary > p').length, 1, 'one visible boundary sentence');
  const scope = f.$('details.mechanism-scope');
  assert(!scope.open); assert.equal(scope.closest('.mechanism-boundary'), f.$('.mechanism-boundary'));
  assert.equal(f.$('.mechanism-question').textContent.trim(),
    'Reorder bank, by, the, river as by, river, bank, the. Bank\'s row of weights follows its query down to slot 2. The keys reorder too: does bank\'s 0.70 stay in column 3, or follow river\'s key?');
  const check = f.$('details.mechanism-check');
  const question = check.querySelector('summary').textContent.replace('Check yourself.', '').trim();
  assert.equal(question, 'Reorder to the, river, by, bank. In which cells (row, column; slots 0 to 3) do bank\'s 0.70 and bank\'s own 0.20 land, and how does bank\'s row read?');
  assert.equal(words(question), 29);
  const answer = check.querySelector('p').textContent.trim();
  assert.equal(words(answer), 44);
  assert.equal(f.root.querySelectorAll('.mechanism-transcript li').length, scene.beats.length, 'one transcript item per beat');
  assert.equal(f.$('[data-pane]').querySelectorAll('input').length, 1, 'no control: the scrubber is the only input');
});

test('both axes: forbidden prints stay out of every reader surface', t => {
  const f = fixture(t, NAME);
  // Reader surfaces in the static panel: text nodes and aria/title attributes, with the
  // shared transport bar set aside (its "Playback position" label is the transport's own).
  const surfaces = [];
  const walk = (node, where) => {
    if (node.nodeType === 8) return;
    if (node.nodeType === 1 && node.matches('[data-controls]')) return;
    if (node.nodeType === 3) { if (node.textContent.trim()) surfaces.push({text: node.textContent, where, node}); return; }
    if (node.nodeType === 1) {
      for (const {name, value} of [...node.attributes]) if (/^aria-|^title$/.test(name)) surfaces.push({text: value, where, node});
      const here = node.matches('details.mechanism-check') ? 'check'
        : node.matches('.mechanism-boundary') ? 'boundary' : where;
      for (const child of node.childNodes) walk(child, here);
    }
  };
  walk(f.root, 'panel');
  // And every live channel, through the whole timeline, both motion modes.
  for (const reduced of [false, true]) {
    const g = fixture(t, NAME, {reduced}); g.load(); g.open();
    for (const time of steps(0, scene.duration, 0.5)) {
      g.seek(time);
      for (const node of drawing(g).querySelectorAll('text')) surfaces.push({text: node.textContent, where: 'live', node});
      surfaces.push({text: g.$('[data-caption]').textContent, where: 'live'});
      surfaces.push({text: g.$('[data-figure] svg').getAttribute('aria-label'), where: 'live'});
      surfaces.push({text: valuetext(g), where: 'live'});
    }
  }
  const rowReadings = ['0.20, 0.05, 0.05, 0.70', '0.05, 0.70, 0.20, 0.05', '0.05, 0.70, 0.05, 0.20'];
  for (const {text, where, node} of surfaces) {
    const say = `${where}: ${text}`;
    assert.doesNotMatch(text, /\b0\.(15|40|25|10|45|35)\b/, `a hidden row's weight is printed. ${say}`);
    assert.doesNotMatch(text, /\b(equivariant|invariant|permutation|rematch|cancel|inverse|transpose|pool|mean)\b/i, say);
    assert.doesNotMatch(text, /SA\(|\bP\b|Pᵀ/, say);
    assert.doesNotMatch(text, /\b2\.2|1\.581|\[2, 4, 0, 1, 3\]/, say);
    assert.doesNotMatch(text, /\b(film|lecture|course|students?)\b/i, say);
    assert.doesNotMatch(text, /—/, `em dash. ${say}`);
    assert.doesNotMatch(text, /\de[-+]?\d|(?<![\w.])-\d/, `ASCII minus or e-notation. ${say}`);
    if (where !== 'check') {
      assert(!text.includes('the, river, by, bank') && !/\(3, [13]\)/.test(text), `the check's order or cells outside the check. ${say}`);
    }
    if (where !== 'boundary') assert.doesNotMatch(text, /\b(mask|position)/i, `mask or position outside the boundary and scope. ${say}`);
    // 0.20 is bank's alone (by's weight on river is 0.20 too): prose says "bank's 0.20",
    // lists bank's row, or is the opening caption's "0.20 on bank's own".
    for (const match of text.matchAll(/0\.20/g)) {
      const before = text.slice(0, match.index), after = text.slice(match.index);
      const ok = /bank's (own )?$/i.test(before) || after.startsWith('0.20 on bank\'s own')
        || rowReadings.some(row => { const at = text.indexOf(row); return at >= 0 && match.index >= at && match.index < at + row.length; })
        || (node && node.nodeType === 1 && node.getAttribute('data-mark') === 'digit')
        || (node && node.nodeType === 3 && node.parentNode.getAttribute && node.parentNode.getAttribute('data-mark') === 'digit');
      assert(ok, `a 0.20 that is not bank's. ${say}`);
    }
  }
  // In the drawing, 0.20 is only ever one of bank's printed digits.
  const g = fixture(t, NAME); g.load(); g.open();
  for (const time of steps(0, scene.duration, 1)) {
    g.seek(time);
    for (const node of drawing(g).querySelectorAll('text'))
      if (/\d\.\d\d/.test(node.textContent)) assert.equal(node.getAttribute('data-mark'), 'digit', node.textContent);
  }
  const panel = read('both-axes/panel.html');
  assert(!panel.includes('—'), 'no em dash anywhere in the panel');
});

test('both axes: every layout keeps its text inside the picture and off its neighbours', t => {
  const rest = [...scene.beats, 8, 12, 17, 18, 24, 30, scene.duration];
  for (const width of WIDTHS) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    for (const time of rest) {
      f.seek(time);
      const [, , boxWidth, boxHeight] = f.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/).map(Number);
      const boxes = [...drawing(f).querySelectorAll('text')].filter(visible).map(textBox);
      for (const box of boxes) {
        assert(box.left >= 0 && box.right <= boxWidth, `at ${width}px, ${time}s "${box.text}" runs outside the picture`);
        assert(box.top >= 0 && box.bottom <= boxHeight, `at ${width}px, ${time}s "${box.text}" runs off the top or bottom`);
      }
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++)
        assert(!collide(boxes[i], boxes[j]), `at ${width}px, ${time}s "${boxes[i].text}" and "${boxes[j].text}" collide`);
      // Labels sit inside their blocks, digits inside their cells, and no tick touches a digit.
      const s = read_state(f);
      const inside = (box, rect, pad = 0) => box.left >= attr(rect, 'x') - pad && box.right <= attr(rect, 'x') + attr(rect, 'width') + pad
        && box.top >= attr(rect, 'y') - pad && box.bottom <= attr(rect, 'y') + attr(rect, 'height') + pad;
      for (const box of boxes) {
        const mark = box.node.getAttribute('data-mark'), token = tokenOf(box.node);
        if (mark === 'value-name') assert(inside(box, all(f, 'value').find(node => tokenOf(node) === token)), `at ${width}px "${box.text}" leaves its value block`);
        if (mark === 'output-name') assert(inside(box, all(f, 'output').find(node => tokenOf(node) === token)), `at ${width}px "${box.text}" leaves its output block`);
        if (mark === 'digit') {
          assert(inside(box, s.cell(0, Number(box.node.getAttribute('data-k'))).node), `at ${width}px, ${time}s the digit ${box.text} leaves its cell`);
          for (const tick of s.ticks) {
            const tl = tick.tx - 5, tr = tick.tx + 5, tt = tick.ty - 4, tb = tick.ty + 3.5;
            assert(Math.min(box.right, tr) - Math.max(box.left, tl) <= 0 || Math.min(box.bottom, tb) - Math.max(box.top, tt) <= 0,
              `at ${width}px, ${time}s a tick touches ${box.text}`);
          }
        }
      }
      // River and bank as column names, apart in the rows-only frame and side by side
      // (slots 1 and 2) in the final one, never touching.
      const colBox = token => textBox(all(f, 'col-name').find(node => node.textContent === token));
      const [river, bank] = [colBox('river'), colBox('bank')];
      assert(Math.max(river.left, bank.left) - Math.min(river.right, bank.right) >= 2,
        `at ${width}px, ${time}s the column names river and bank touch`);
      for (const rect of drawing(f).querySelectorAll('rect'))
        assert(attr(rect, 'x') >= 0 && attr(rect, 'x') + attr(rect, 'width') <= boxWidth + 0.5, `at ${width}px, ${time}s a block runs outside`);
    }
  }
});

test('both axes: while rows or columns glide, no moving label passes through a fixed one', t => {
  // Fixed scenery (slot labels, axis words) never moves; token names, digits and block labels
  // ride in the moving group. Moving labels may cross each other on the straight glides, as
  // the cells do, but none may run through a fixed label, at any width, at any instant.
  for (const width of [296, 375, 559, 560, 713]) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    const group = one(f, 'moving');
    for (const time of [...steps(5.5, 8, 0.05), ...steps(14, 17, 0.05), ...steps(21, 24, 0.05)]) {
      f.seek(time);
      const texts = [...drawing(f).querySelectorAll('text')].filter(visible);
      const moving = texts.filter(node => group.contains(node)).map(textBox);
      const fixed = texts.filter(node => !group.contains(node)).map(textBox);
      assert(moving.length > 0 && fixed.length > 0);
      for (const a of moving) for (const b of fixed)
        assert(!collide(a, b), `at ${width}px, ${time}s the moving "${a.text}" runs through the fixed "${b.text}"`);
    }
  }
});

test('both axes: row labels sit side by side at every width; column labels stack; the tracked output wraps when narrow', t => {
  const narrow = fixture(t, NAME, {width: 296}); narrow.load(); narrow.open(); narrow.seek(40);
  assert.equal(narrow.root.dataset.layout, 'narrow');
  for (const width of [296, 713]) {
    const f = width === 296 ? narrow : fixture(t, NAME, {width});
    if (width !== 296) { f.load(); f.open(); f.seek(40); }
    // Each row's slot label and token name share a row, in two lanes that never overlap.
    const slotRight = Math.max(...all(f, 'row-slot').map(node => textBox(node).right));
    const nameLeft = Math.min(...all(f, 'row-name').map(node => textBox(node).left));
    const nameRight = Math.max(...all(f, 'row-name').map(node => textBox(node).right));
    assert(slotRight + 2 <= nameLeft, `at ${width}px the slot lane runs into the token lane`);
    assert(nameRight + 2 <= attr(one(f, 'frame'), 'x') - 1, `at ${width}px a row name runs into the grid`);
    const slot2 = all(f, 'row-slot')[2], bank = all(f, 'row-name').find(node => tokenOf(node) === 0);
    assert(Math.abs(attr(slot2, 'y') - attr(bank, 'y')) < 1, `at ${width}px, bank's name sits beside the slot 2 label`);
  }
  const colSlot = all(narrow, 'col-slot')[0], colName = all(narrow, 'col-name')[0];
  assert(attr(colSlot, 'y') < attr(colName, 'y'), 'column labels stack slot over token');
  const parts = all(narrow, 'output-name').filter(node => tokenOf(node) === 0);
  assert.deepEqual(parts.map(node => node.textContent), ['bank\'s', 'output']);
  assert(attr(parts[0], 'y') < attr(parts[1], 'y'), 'the tracked output label wraps onto two lines');
  const wide = fixture(t, NAME, {width: 713}); wide.load(); wide.open(); wide.seek(40);
  assert.equal(wide.root.dataset.layout, 'wide');
  const [a, b] = all(wide, 'output-name').filter(node => tokenOf(node) === 0);
  assert.equal(attr(a, 'y'), attr(b, 'y'), 'one line when there is room');
});

test('both axes: seeking is deterministic and the picture is rebuilt from time alone', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const snapshot = time => { f.seek(time); return canonicalMarkup(f.$('[data-pane]').innerHTML.replace(/aria-valuetext="[^"]*"/g, '')); };
  const times = [0, 6.2, 9, 12, 15.3, 18, 20.2, 20.6, 22.4, 25, 33, 38, 40];
  const forward = times.map(snapshot), backward = [...times].reverse().map(snapshot).reverse();
  assert.deepEqual(forward, backward, 'the same time draws the same picture whatever came before');
});

test('both axes: the panel is the one fixture copy; moving it moves every address and caption', t => {
  const g = fixture(t, NAME);
  g.root.dataset.order = '2 0 3 1';
  g.load(); g.open();
  const {A, order} = declared(g.root), slot = slotIn(order);
  g.seek(40);
  const s = read_state(g);
  for (const cell of s.cells) {
    assert.deepEqual([Math.round(cell.row), Math.round(cell.col)], [slot(cell.q), slot(cell.k)]);
    close(attr(cell.node, 'fill-opacity'), (cell.q === 0 ? 0.8 : 0.6) * A[cell.q][cell.k] + 0.12, EPS);
  }
  assert.equal(s.digits.join(', '), order.map(k => A[0][k].toFixed(2)).join(', '));
  g.seek(17);
  assert.equal(g.$('[data-caption]').textContent, `0.70 followed river to column ${slot(3)}, and river's value came along: bank's output is unchanged.`);
  g.seek(5);
  assert(g.$('[data-caption]').textContent.startsWith('Reorder to the, bank, river, by.'));
});

test('both axes: the committed static print is a fresh render of the final frame', async () => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after,
    'interactives/both-axes/panel.html is stale: run scripts/render_static_frames.cjs both-axes');
  const panel = read('both-axes/panel.html');
  assert.match(panel, /<g data-static-frame="narrow" data-width="296" data-height="248" transform="scale\(2\.4088\)">/);
  assert.match(panel, /viewBox="0 0 713 476"/);
  const css = read('both-axes/player.css');
  assert(css.includes('aspect-ratio: 713 / 476') && css.includes('aspect-ratio: 296 / 248'), 'the no-script aspect ratios match the prints');
});

test('both axes: plain-text numbers use a true minus, and the player is inert', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (const time of [...scene.beats, scene.duration]) {
    f.seek(time);
    for (const node of drawing(f).querySelectorAll('text')) {
      assert.doesNotMatch(node.textContent, /\de[-+]\d/, `e-notation in "${node.textContent}"`);
      assert.doesNotMatch(node.textContent, /(?<!\w)-\d/, `ASCII minus in "${node.textContent}"`);
    }
  }
  const player = read('both-axes/player.js');
  assert.doesNotMatch(player, /Math\.random|fetch\(|import\(|setInterval\(/);
  assert.equal((player.match(/getBoundingClientRect/g) || []).length, 1);
  assert.doesNotMatch(player, /ch14-data|permutationDebt/, 'nothing is taken from the film\'s data');
  // No number is retyped in the player: the weights, order and tokens come from the panel.
  assert.doesNotMatch(player, /0\.70|0\.20|0\.05|'bank'|'river'/);
});

test('integration: the excerpt is HTML-only, manifest-driven, and placed before the position debt', () => {
  const filter = fs.readFileSync(path.join(ROOT, scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/,
    'the non-HTML guard is the first executable line, so the PDF is untouched');
  assert.match(filter, /"before-heading"/);
  assert.match(filter, /level == 2 or block\.level == 3/, 'the filter places panels before an H3');
  assert.doesNotMatch(filter, /both-axes/, 'a manifest-driven filter names no scene');
  const config = fs.readFileSync(path.join(ROOT, '_quarto.yml'), 'utf8');
  const start = config.indexOf('\n  resources:'), rest = config.slice(start + 13), end = rest.search(/\n\S/);
  const resources = end < 0 ? rest : rest.slice(0, end);
  assert.match(resources, /^\s+- interactives\/both-axes\/player\.js$/m);
  assert(!resources.includes('both-axes/panel.html'));
  const chapter = chapterSource(NAME);
  assert.deepEqual(scene.anchor, {type: 'before-heading', target: 'The position debt'});
  assert.equal(chapter.split('\n').filter(line => line === `### ${scene.anchor.target}`).length, 1);
  const at = chapter.indexOf(`### ${scene.anchor.target}`);
  // After the figure it replays and the paragraph that closes the section's opening; before
  // the slogan, the proof, the name and the audit.
  assert(chapter.indexOf('#| label: fig-self-attention-read') < at);
  assert(chapter.indexOf('one new token at a time.') < at);
  for (const later of ['Bare self-attention knows content but not slot number.', 'Let $P$ be an $n\\times n$ permutation matrix',
    'Self-attention is *permutation equivariant*', '<!-- NOVEL: needs sign-off - seeded permutation'])
    assert(chapter.indexOf(later) > at, later);
  // The chapter's other replay sits two sections later, on a different anchor.
  const layernorm = entry('layernorm-axis-excerpt');
  assert.equal(layernorm.qmd, scene.qmd);
  assert(chapter.indexOf('## Build a Transformer block') > at);
  assert.notDeepEqual(layernorm.anchor, scene.anchor);
});
