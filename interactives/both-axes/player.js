// Editing this scene later: read docs/both-axes-excerpt.md first ("Notes for a future edit"
// names the timetable, the open judgements and the re-verification steps).
(() => {
  const root = document.getElementById('both-axes-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);

  // The fixture lives on the panel root: the figure's tokens, its illustrative weight grid
  // (fig-self-attention-read's A, row by row) and one declared reordering. Nothing below
  // retypes a number; every caption, cell and address is computed from these three.
  const tokens = root.dataset.tokens.trim().split(/\s+/);
  const A = root.dataset.weights.split(';').map(row => row.trim().split(/\s+/).map(Number));
  const order = root.dataset.order.trim().split(/\s+/).map(Number);
  const n = tokens.length;
  if (A.length !== n || !A.every(row => row.length === n && row.every(Number.isFinite)))
    throw Error('both-axes: the weight grid must be n by n for n tokens');
  if (!A.every(row => Math.abs(row.reduce((sum, value) => sum + value, 0) - 1) < 1e-9))
    throw Error('both-axes: every row of weights must sum to one');
  if (order.length !== n || [...order].sort((a, b) => a - b).some((value, index) => value !== index))
    throw Error('both-axes: data-order must reorder the tokens, each exactly once');

  // Slot i of the reordered sequence holds token order[i]; token t therefore lands in slot
  // slotOf[t]. In the chapter's order token t sits in slot t on both axes.
  const slotOf = tokens.map((_, token) => order.indexOf(token));
  // The tracked row is the figure's own: its first token, bank. Its heaviest key is the
  // weight the question follows.
  const own = tokens[0], Own = own[0].toUpperCase() + own.slice(1);
  const star = A[0].indexOf(Math.max(...A[0])), far = tokens[star];
  const fmt = value => value.toFixed(2).replace('-', '−');
  const w0 = fmt(A[0][0]), wStar = fmt(A[0][star]);
  const count = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'][n] || String(n);
  // The figure's opacity map: the tracked row a little hotter than the rest.
  const shade = (q, k) => (q === 0 ? 0.8 : 0.6) * A[q][k] + 0.12;

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const drawing = svg.querySelector('[data-drawing]'), formula = $('[data-formula]'), caption = $('[data-caption]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const stageAt = time => beats.reduce((stage, beat, index) => time >= beat ? index : stage, 0);

  const CAPTIONS = {
    start: `${Own}'s row: ${wStar} on ${far}'s key, ${w0} on ${own}'s own. Each tick marks a token's weight on itself.`,
    rows: `Reorder to ${order.map(token => tokens[token]).join(', ')}. The query rows move first, each to its token's new slot.`,
    landed: `${Own}'s row sits in slot ${slotOf[0]}, and ${own}'s output rode with it. The columns have not moved.`,
    ask: `Keys reorder too. Does ${own}'s ${wStar} stay in column ${star}, or follow ${far}?`,
    columns: 'Each weight follows its key\'s column, and each value block slides along beneath it.',
    reveal: `${wStar} followed ${far} to column ${slotOf[star]}, and ${far}'s value came along: ${own}'s output is unchanged.`,
    restart: 'Back to the start, then the same reordering in one move: rows with outputs, columns with value blocks.',
    glided: 'Every tick slid along the diagonal and never left it.',
    roles: 'Queries moved the rows, keys moved the columns, and each value block moved with its key.',
    same: `Same ${count} weights in ${own}'s row, at new addresses; ${own}'s output sits in slot ${slotOf[0]}, unchanged.`,
    close: `${Own}'s ${w0} is back on the diagonal, and ${wStar} still meets ${far}'s value block.`
  };

  // Choreography, in seconds, tied to the declared beats. The rows glide inside the second
  // beat and land two seconds before the ask; nothing moves again until the reveal at the
  // fourth beat, when the columns glide. The fifth beat fades the drawing back to the
  // chapter's order (group opacity only) and glides rows and columns together, landing two
  // seconds before the sixth beat. All three glides share one easing.
  const T = {
    rowsStart: beats[1] + 0.5, rowsEnd: beats[1] + 3,
    colsStart: beats[3], colsEnd: beats[3] + 3,
    fadeOut: beats[4], jump: beats[4] + 0.4, fadeIn: beats[4] + 0.8,
    bothStart: beats[4] + 1, bothEnd: beats[4] + 4, ghost: beats[7]
  };
  const SCHEDULE = [[0, 'start'], [beats[1], 'rows'], [T.rowsEnd, 'landed'], [beats[2], 'ask'],
    [beats[3], 'columns'], [T.colsEnd, 'reveal'], [beats[4], 'restart'], [T.bothEnd, 'glided'],
    [beats[5], 'roles'], [beats[6], 'same'], [beats[7], 'close']];
  // Reduced motion: one still per beat. Each carries its beat's opening sentence, except the
  // reveal beat, whose still is the finished state and so carries the reveal. The rows beat
  // keeps its opening sentence, the only caption that names the new order.
  const REDUCED = [
    {r: 0, k: 0, caption: 'start'}, {r: 1, k: 0, caption: 'rows'}, {r: 1, k: 0, caption: 'ask'},
    {r: 1, k: 1, caption: 'reveal'}, {r: 0, k: 0, caption: 'restart'}, {r: 1, k: 1, caption: 'roles'},
    {r: 1, k: 1, caption: 'same'}, {r: 1, k: 1, caption: 'close'}];

  const smooth = u => { const v = Math.max(0, Math.min(1, u)); return v * v * (3 - 2 * v); };
  const lerp = (a, b, u) => a + (b - a) * u;
  function motion(time, reducedMotion) {
    const stage = stageAt(time);
    if (reducedMotion) {
      const still = REDUCED[stage];
      return {stage, r: still.r, k: still.k, fade: 1, ghost: stage === 7, caption: still.caption,
        washQ: stage === 1 || stage >= 4, washKV: stage >= 3};
    }
    let r, k;
    if (time < T.jump) {
      r = smooth((time - T.rowsStart) / (T.rowsEnd - T.rowsStart));
      k = smooth((time - T.colsStart) / (T.colsEnd - T.colsStart));
    } else {
      r = k = smooth((time - T.bothStart) / (T.bothEnd - T.bothStart));
    }
    const fade = time < T.fadeOut ? 1 : time < T.jump ? 1 - (time - T.fadeOut) / (T.jump - T.fadeOut)
      : time < T.fadeIn ? (time - T.jump) / (T.fadeIn - T.jump) : 1;
    const caption = SCHEDULE.reduce((current, [start, key]) => time >= start ? key : current, 'start');
    return {stage, r, k, fade, ghost: time >= T.ghost, caption,
      washQ: (time >= T.rowsStart && time < T.rowsEnd) || time >= T.bothStart,
      washKV: (time >= T.colsStart && time < T.colsEnd) || time >= T.bothStart};
  }

  drawing.replaceChildren();
  const NS = 'http://www.w3.org/2000/svg';
  // Every attribute a mark will ever carry is created here, so no later write can reorder
  // them and a seek reproduces byte-identical markup whatever came before.
  const make = (tag, attributes, text = '', parent = drawing) => {
    const node = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
    node.textContent = text; parent.appendChild(node); return node;
  };
  const put = (node, name, value) => { const next = String(value); if (node.getAttribute(name) !== next) node.setAttribute(name, next); };
  const attrs = (node, values) => { for (const [key, value] of Object.entries(values)) put(node, key, value); };
  const write = (node, value) => { if (node.textContent !== value) node.textContent = value; };
  const show = (node, visible) => { if (visible === node.hasAttribute('hidden')) node.toggleAttribute('hidden', !visible); };
  const publish = (key, value) => { if (root.dataset[key] !== value) root.dataset[key] = value; };
  // Geometry-only rounding (0.0001 px) keeps the byte-compared static print independent of a
  // platform's last floating-point bit. The weights themselves are never rounded.
  const px = value => Number(value.toFixed(4));
  const range = [...Array(n).keys()];
  const text = (value, cls, extra = {}, parent = drawing) =>
    make('text', {x: 0, y: 0, 'font-size': 12, 'text-anchor': 'middle', class: cls, ...extra}, value, parent);

  // Scenery: the grid frame, the fixed slot labels and the axis words never move.
  const frame = make('rect', {class: 'ba-frame', 'data-mark': 'frame', x: 0, y: 0, width: 0, height: 0});
  const rowSlots = range.map(slot => text(`slot ${slot}`, 'ba-muted', {'data-mark': 'row-slot', 'data-slot': slot, 'text-anchor': 'start'}));
  const colSlots = range.map(slot => text(`slot ${slot}`, 'ba-muted', {'data-mark': 'col-slot', 'data-slot': slot}));
  const axisKeys = text('keys', 'ba-muted', {'data-mark': 'axis-keys'});
  const axisQueries = text('queries', 'ba-muted', {'data-mark': 'axis-queries', 'text-anchor': 'start'});
  const axisValues = text('values', 'ba-muted', {'data-mark': 'axis-values', 'text-anchor': 'start'});
  const axisOutputs = text('outputs', 'ba-muted', {'data-mark': 'axis-outputs'});

  // Everything that rides with a row or a column sits in one group, so the restart fade
  // acts on the group's opacity and never on a cell's own fill.
  const moving = make('g', {'data-mark': 'moving', opacity: 1});
  const cellsIn = q => range.map(k => ({q, k, node: make('rect', {class: 'ba-cell', 'data-mark': 'cell', 'data-q': q, 'data-k': k,
    'fill-opacity': px(shade(q, k)), x: 0, y: 0, width: 0, height: 0, rx: 2}, '', moving)}));
  // The faint rows first and the tracked row last, so it is drawn on top when rows cross.
  const cells = [...range.slice(1).flatMap(cellsIn), ...cellsIn(0)];
  const tracked = make('rect', {class: 'ba-tracked', 'data-mark': 'tracked-row', x: 0, y: 0, width: 0, height: 0, rx: 3}, '', moving);
  const ticks = range.map(token => make('path', {class: 'ba-tick', 'data-mark': 'tick', 'data-token': token, d: '', transform: ''}, '', moving));
  const digits = range.map(k => text(fmt(A[0][k]), 'ba-digit', {'data-mark': 'digit', 'data-k': k, 'data-value': `${own}-${k}`}, moving));
  const rowNames = range.map(q => text(tokens[q], 'ba-token', {'data-mark': 'row-name', 'data-token': q, 'text-anchor': 'start'}, moving));
  const colNames = range.map(k => text(tokens[k], 'ba-token', {'data-mark': 'col-name', 'data-token': k}, moving));
  const values = range.map(k => make('rect', {class: 'ba-value', 'data-mark': 'value', 'data-token': k, x: 0, y: 0, width: 0, height: 0, rx: 3}, '', moving));
  const valueNames = range.map(k => text(tokens[k], 'ba-token', {'data-mark': 'value-name', 'data-token': k}, moving));
  const outputs = range.map(q => make('rect', {class: q === 0 ? 'ba-output ba-own' : 'ba-output', 'data-mark': 'output', 'data-token': q,
    x: 0, y: 0, width: 0, height: 0, rx: 3}, '', moving));
  // The tracked output is labelled in two words, so the narrow layout can stack them.
  const outputNames = range.map(q => q === 0
    ? [text(`${own}'s`, 'ba-token ba-own-label', {'data-mark': 'output-name', 'data-token': q, 'data-part': 0}, moving),
      text('output', 'ba-token ba-own-label', {'data-mark': 'output-name', 'data-token': q, 'data-part': 1}, moving)]
    : [text(tokens[q], 'ba-token ba-faint', {'data-mark': 'output-name', 'data-token': q, 'data-part': 0}, moving)]);
  // The closing hold: a ghost of the tracked row where it began, and one straight path from
  // the heaviest weight's first cell to its last.
  const ghost = make('rect', {class: 'ba-ghost', 'data-mark': 'ghost', x: 0, y: 0, width: 0, height: 0, rx: 3, hidden: ''});
  const path = make('path', {class: 'ba-path', 'data-mark': 'path', d: '', hidden: ''});

  svg.setAttribute('aria-label', `A ${count}-by-${count} grid of weights for ${tokens.join(', ')}. Rows are queries and columns `
    + 'are keys, each with a fixed slot label and the name of the token it holds. '
    + `${Own}'s row is outlined with its ${count} weights printed; a tick marks each token's weight on itself. `
    + 'A value block sits under each key column and an output block at the end of each query row.');

  const WIDE = {fixed: 272, maxCell: 88, gridLeft: 124, rowSlotX: 16, rowTokenX: 70, rowSlotDy: 4.5, rowTokenDy: 5,
    rowSlotSize: 12, rowTokenSize: 14, keysY: 18, colSlotY: 40, colTokenY: 60, gridTop: 72, axisSize: 12,
    colSlotSize: 12, colTokenSize: 14, gap: 4, digitSize: 15, tickOff: 0.3, tick: 'M -5 0 L -1.5 3.5 L 5 -4',
    outGap: 20, outW: 112, outRatio: 0.5, outLabelSize: 13, valueGap: 12, valueH: 28, valueInset: 14,
    valueLabelSize: 13, bottom: 12, arrow: 7, shorten: 30};
  // Row labels sit side by side at every width, each in its own lane: a token name glides
  // vertically past the other names but never through a fixed slot label.
  const NARROW = {fixed: 136, maxCell: 56, gridLeft: 78, rowSlotX: 4, rowTokenX: 42, rowSlotDy: 3.5, rowTokenDy: 4,
    rowSlotSize: 10, rowTokenSize: 11, keysY: 14, colSlotY: 30, colTokenY: 44, gridTop: 52, axisSize: 10,
    colSlotSize: 10, colTokenSize: 11, gap: 3, digitSize: 11, tickOff: 0.32, tick: 'M -3.5 0 L -1 2.5 L 3.5 -3',
    outGap: 8, outW: 46, outRatio: 0.65, outLabelSize: 10, valueGap: 8, valueH: 22, valueInset: 8,
    valueLabelSize: 10, bottom: 6, arrow: 5, shorten: 19};
  let G = null, lastTime = 0, reduced = false;

  // Everything that depends only on the measured width is placed once per layout. Below
  // 560 px the type and the margins shrink and the tracked output's label wraps.
  function layout() {
    const width = Math.max(280, Math.round(figure.getBoundingClientRect().width || 713));
    const narrow = width < 560, L = narrow ? NARROW : WIDE;
    const c = Math.min(L.maxCell, Math.floor((width - L.fixed) / n));
    const ox = Math.max(0, Math.floor((width - L.fixed - n * c) / 2));
    const gx = ox + L.gridLeft, gy = L.gridTop, side = n * c;
    const outX = gx + side + L.outGap, outH = 2 * Math.round(c * L.outRatio / 2);
    const valueTop = gy + side + L.valueGap, height = valueTop + L.valueH + L.bottom;
    G = {L, narrow, width, height, c, ox, gx, gy, side, outX, outH, valueTop,
      half: (c - L.gap) / 2, valueHalf: (c - L.valueInset) / 2, off: px(c * L.tickOff)};
    publish('layout', narrow ? 'narrow' : 'wide');
    put(svg, 'viewBox', `0 0 ${width} ${height}`);
    attrs(frame, {x: gx, y: gy, width: side, height: side});
    rowSlots.forEach((node, slot) => attrs(node, {x: ox + L.rowSlotX, y: px(gy + (slot + 0.5) * c + L.rowSlotDy), 'font-size': L.rowSlotSize}));
    colSlots.forEach((node, slot) => attrs(node, {x: px(gx + (slot + 0.5) * c), y: L.colSlotY, 'font-size': L.colSlotSize}));
    attrs(axisKeys, {x: px(gx + side / 2), y: L.keysY, 'font-size': L.axisSize});
    attrs(axisQueries, {x: ox + L.rowSlotX, y: L.colTokenY, 'font-size': L.axisSize});
    attrs(axisValues, {x: ox + L.rowSlotX, y: px(valueTop + L.valueH / 2 + L.axisSize * 0.35), 'font-size': L.axisSize});
    attrs(axisOutputs, {x: px(outX + L.outW / 2), y: L.colTokenY, 'font-size': L.axisSize});
    ticks.forEach(node => put(node, 'd', L.tick));
    attrs(ghost, {x: gx - 1, y: gy - 1, width: side + 2, height: c + 2});
  }

  const inOrder = positions => range.slice().sort((a, b) => positions[a] - positions[b]).map(token => tokens[token]).join(', ');
  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const m = motion(time, reducedMotion), {L, c, ox, gx, gy, side, outX, outH, valueTop, half, valueHalf, off} = G;
    // Each token's address on each axis, in slots: its chapter slot, its new slot, or on the way.
    const rowAt = range.map(token => lerp(token, slotOf[token], m.r));
    const colAt = range.map(token => lerp(token, slotOf[token], m.k));
    const rowY = token => px(gy + (rowAt[token] + 0.5) * c), colX = token => px(gx + (colAt[token] + 0.5) * c);
    publish('stage', String(m.stage));
    put(moving, 'opacity', px(m.fade));
    cells.forEach(({q, k, node}) => attrs(node, {x: px(colX(k) - half), y: px(rowY(q) - half), width: c - L.gap, height: c - L.gap}));
    attrs(tracked, {x: gx - 1, y: px(rowY(0) - c / 2 - 1), width: side + 2, height: c + 2});
    digits.forEach((node, k) => attrs(node, {x: colX(k), y: px(rowY(0) + L.digitSize * 0.35), 'font-size': L.digitSize}));
    ticks.forEach((node, token) => put(node, 'transform', `translate(${px(colX(token) - off)} ${px(rowY(token) - off)})`));
    rowNames.forEach((node, q) => attrs(node, {x: ox + L.rowTokenX, y: px(rowY(q) + L.rowTokenDy), 'font-size': L.rowTokenSize}));
    colNames.forEach((node, k) => attrs(node, {x: colX(k), y: L.colTokenY, 'font-size': L.colTokenSize}));
    values.forEach((node, k) => attrs(node, {x: px(colX(k) - valueHalf), y: valueTop, width: c - L.valueInset, height: L.valueH}));
    valueNames.forEach((node, k) => attrs(node, {x: colX(k), y: px(valueTop + L.valueH / 2 + L.valueLabelSize * 0.35), 'font-size': L.valueLabelSize}));
    const middle = px(outX + L.outW / 2), size = L.outLabelSize;
    outputs.forEach((node, q) => attrs(node, {x: outX, y: px(rowY(q) - outH / 2), width: L.outW, height: outH}));
    outputNames.forEach((nodes, q) => {
      const y = rowY(q);
      if (nodes.length === 1) attrs(nodes[0], {x: middle, y: px(y + size * 0.35), 'font-size': size});
      else if (G.narrow) {
        attrs(nodes[0], {x: middle, y: px(y - size * 0.2), 'font-size': size, 'text-anchor': 'middle'});
        attrs(nodes[1], {x: middle, y: px(y + size * 0.9), 'font-size': size, 'text-anchor': 'middle'});
      } else {
        attrs(nodes[0], {x: px(middle - 2), y: px(y + size * 0.35), 'font-size': size, 'text-anchor': 'end'});
        attrs(nodes[1], {x: px(middle + 2), y: px(y + size * 0.35), 'font-size': size, 'text-anchor': 'start'});
      }
    });
    // The closing path runs from the heaviest weight's first cell, (0, star), towards its last,
    // (slotOf[0], slotOf[star]), and stops short of the printed weight it points at.
    const sx = px(gx + (star + 0.5) * c), sy = px(gy + 0.5 * c);
    const tx = gx + (slotOf[star] + 0.5) * c, ty = gy + (slotOf[0] + 0.5) * c;
    const length = Math.hypot(tx - sx, ty - sy) || 1, ux = (tx - sx) / length, uy = (ty - sy) / length;
    const ex = tx - ux * L.shorten, ey = ty - uy * L.shorten, a = L.arrow;
    const wing = sign => `${px(ex - ux * a + sign * uy * a * 0.6)} ${px(ey - uy * a - sign * ux * a * 0.6)}`;
    put(path, 'd', `M ${sx} ${sy} L ${px(ex)} ${px(ey)} M ${wing(1)} L ${px(ex)} ${px(ey)} L ${wing(-1)}`);
    show(ghost, m.ghost); show(path, m.ghost);

    formula.classList.toggle('ba-q-lit', m.washQ);
    formula.classList.toggle('ba-kv-lit', m.washKV);
    write(caption, CAPTIONS[m.caption]);

    // The scrubber's value text names the state; the caption says what is happening.
    const rest = Number.isInteger(m.r) && Number.isInteger(m.k) && m.fade === 1;
    let spoken;
    if (m.fade < 1) spoken = 'The drawing fades back to the chapter\'s order.';
    else if (!rest && m.k === 0) spoken = `Query rows gliding with their outputs; columns ${inOrder(colAt)}.`;
    else if (!rest && m.r === 1 && time < T.jump) spoken = `Key columns gliding with their value blocks; rows ${inOrder(rowAt)}.`;
    else if (!rest) spoken = 'Rows and columns gliding together, each weight straight to its new cell.';
    else {
      const row = range.slice().sort((a, b) => colAt[a] - colAt[b]).map(k => fmt(A[0][k])).join(', ');
      const onDiagonal = range.filter(token => rowAt[token] === colAt[token]).length;
      spoken = `Rows ${inOrder(rowAt)}; columns ${inOrder(colAt)}. ${Own}'s row reads ${row}; `
        + (onDiagonal === n ? 'every tick on the diagonal.' : onDiagonal === 0 ? 'no tick on the diagonal.' : `${onDiagonal} ticks on the diagonal.`);
    }
    if (m.ghost) spoken += ` Ghost of ${own}'s row where it began, at slot 0; a path from ${wStar}'s first cell to its last.`;
    return spoken;
  }
  function typeset() {
    const done = () => { root.dataset.typeset = root.querySelector('mjx-container') ? 'mathjax' : 'none'; };
    const mathjax = window.MathJax;
    if (mathjax && typeof mathjax.typesetPromise === 'function' && !root.querySelector('mjx-container')) {
      mathjax.typesetPromise([root]).then(done, done);
    } else done();
  }
  layout();
  window.BookPlayback(root, render, () => { layout(); render(lastTime, reduced); });
  typeset();
})();
