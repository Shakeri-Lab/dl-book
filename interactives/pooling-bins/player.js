(() => {
  const root = document.getElementById('pooling-bins-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  // The panel is the one in-repo mirror of the manuscript fixture
  // (chapters/part2/08-cnn.qmd:396-406, the `pool-invariance` cell). interactives/manifest.json
  // names those literals and scripts/audit_excerpt_fixtures.py keeps the chapter and this
  // panel together, so nothing below retypes a number the manuscript owns.
  const numbers = name => root.dataset[name].trim().split(/\s+/).map(Number);
  const SIZE = Number(root.dataset.size), WINDOW = Number(root.dataset.window);
  const BINS = SIZE / WINDOW;
  const triples = numbers('scene');
  const clues = [];
  for (let i = 0; i + 2 < triples.length; i += 3) clues.push({row: triples[i], col: triples[i + 1], value: triples[i + 2]});
  // The chapter's own shift (its `shifted` grid) and this panel's declared computed variant,
  // each as a row offset and a column offset in pixels.
  const RIGHT = numbers('right'), DOWN = numbers('down');
  if (!Number.isInteger(BINS) || clues.length === 0) throw Error('pooling-bins: the declared fixture does not pool');
  for (const [dr, dc] of [[0, 0], RIGHT, DOWN]) {
    for (const clue of clues) {
      const r = clue.row + dr, c = clue.col + dc;
      if (r < 0 || c < 0 || r >= SIZE || c >= SIZE) throw Error(`pooling-bins: a clue leaves the grid under the shift (${dr}, ${dc})`);
    }
  }
  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = svg.querySelector('[data-drawing]'), caption = $('[data-caption]');
  const tags = {};
  for (const node of svg.querySelectorAll('foreignObject[data-tag]')) tags[node.dataset.tag] = node;
  // Beats are declared on the pane, so the timeline is stated once. Every stage boundary is a
  // beat: that is what lets the arrow keys land where the mechanism changes. There is no stage
  // strip: the beats are named here, in data-beats order, and the transcript lists them in
  // the same order.
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration || beats[beats.length - 1]);
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);
  const STAGES = ['Ask', 'Pool', 'Shift right', 'Same map', 'Ask again', 'Shift down', 'Changed'];
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = u => { const v = clamp(u); return v * v * (3 - 2 * v); };
  const lerp = (a, b, u) => a + (b - a) * u;
  let lastTime = 0, reduced = false, previousKey = '', captionKey = '', mode = 'wide';

  // --- The scene's own arithmetic ----------------------------------------------------
  // The grid with every clue moved by (dr, dc) whole pixels, as the chapter builds `scene`
  // and `shifted`: zeros everywhere, one value per clue.
  function grid(dr, dc) {
    const cells = Array(SIZE * SIZE).fill(0);
    for (const clue of clues) cells[(clue.row + dr) * SIZE + (clue.col + dc)] = clue.value;
    return cells;
  }
  // F.max_pool2d(., WINDOW): each WINDOW x WINDOW bin keeps its largest value. The source of
  // that value is the cell the ray leaves from; a bin whose cells all tie has no single
  // source, and its ray leaves the bin's centre.
  function maxPool(cells) {
    const values = [], sources = [];
    for (let i = 0; i < BINS; i++) for (let j = 0; j < BINS; j++) {
      let best = -Infinity, at = null, ties = 0;
      for (let a = i * WINDOW; a < (i + 1) * WINDOW; a++) for (let b = j * WINDOW; b < (j + 1) * WINDOW; b++) {
        const value = cells[a * SIZE + b];
        if (value > best) { best = value; at = [a, b]; ties = 1; } else if (value === best) ties++;
      }
      values.push(best); sources.push(ties === 1 ? at : null);
    }
    return {values, sources};
  }
  const binOf = (row, col) => [Math.floor(row / WINDOW), Math.floor(col / WINDOW)];
  const POOL = {home: maxPool(grid(0, 0)), right: maxPool(grid(RIGHT[0], RIGHT[1])), down: maxPool(grid(DOWN[0], DOWN[1]))};
  // The record the moved maps are compared with: the pooled map of the chapter's `scene`.
  const record = POOL.home.values;
  const differs = values => values.map((value, k) => value !== record[k]);
  const same = values => values.every((value, k) => value === record[k]);
  // The chapter's own finding, recomputed rather than asserted: its shift leaves the pooled
  // map alone, so the record and the right-shifted map are one map and the retired verdict
  // under the record can say so. If a fixture ever made them differ, the glyph says that.
  const RIGHT_SAME = same(POOL.right.values);
  // Which clue crosses a bin edge under a shift, for the captions and the closing paths:
  // computed, not typed.
  const crossers = ([dr, dc]) => clues.filter(clue => {
    const [i0, j0] = binOf(clue.row, clue.col), [i1, j1] = binOf(clue.row + dr, clue.col + dc);
    return i0 !== i1 || j0 !== j1;
  });
  // The clue whose move the closing frame annotates: the one that crosses under the down
  // shift. It is the whole reason the two verdicts differ.
  const WITNESS = crossers(DOWN)[0] || clues[0];

  // --- Choreography ----------------------------------------------------------------
  // Seconds inside each beat. Every schedule finishes before its beat ends, so under
  // reduced motion the beat's end state is its whole state.
  const T = {
    pool: {ray: beats[1] + 0.4, draw: 0.9, start: beats[1] + 1.4, gap: 1.0, write: 0.4},
    right: {ghost: beats[2], fade: 0.6, move: beats[2] + 0.6, dur: 2.4, write: beats[2] + 3.6},
    home: {move: beats[4] + 0.15, dur: 2.0, write: beats[4] + 2.75},
    down: {move: beats[5] + 0.4, dur: 2.4, ray: beats[5] + 3.2, draw: 0.9, write: beats[5] + 4.2}
  };
  const schedule = (held, start, gap, draw) => record.map((_, k) => clamp((held - (start + k * gap)) / draw));
  const FULL = record.map(() => 1);
  const NONE = record.map(() => 0);

  // --- Geometry ----------------------------------------------------------------------
  // One picture in drawing units. Left, the input grid with its four heavy bins; right, the
  // pooled map, its cells the size of the bins they summarise; under the pooled map, the
  // record at half height so each recorded value sits directly below the value it is
  // compared with. The one ray runs from the winning cell's right edge to the middle of its
  // output cell's left edge, so which cell received the value is unambiguous. Narrow (phone
  // widths): the same arrangement in 36-unit cells.
  const LAYOUT = {
    wide: {
      viewBox: '0 0 640 424', cell: 52, input: [40, 40], out: [380, 40],
      ghost: [380, 280], ghostCell: [104, 52], sign: [348, 348], ghostLabel: [484, 408],
      note: [144, 272, 15], ask: 13, lift: 8,
      arrow: {x1: 276, y1: 144, x2: 344, y2: 144, label: [310, 134, 'middle']},
      tags: {x: [92, 0, 112], h: [428, 0, 112]}
    },
    narrow: {
      viewBox: '0 0 360 314', cell: 36, input: [16, 40], out: [204, 40],
      ghost: [204, 208], ghostCell: [72, 36], sign: [184, 250], ghostLabel: [276, 300],
      note: [100, 196, 14], ask: 9, lift: 5,
      arrow: {x1: 168, y1: 112, x2: 196, y2: 112, label: [182, 102, 'middle']},
      tags: {x: [32, 0, 96], h: [228, 0, 96]}
    }
  };
  const num = value => Number(value.toFixed(2));
  const NOTE = [`empty cells are 0`, `heavy squares are the ${BINS * BINS} fixed ${WINDOW} × ${WINDOW} bins`];

  // The only measurement in the file, called from layout() and once before mounting.
  function measure() {
    const width = figure.getBoundingClientRect().width || 780;
    mode = width < 600 ? 'narrow' : 'wide';
    const g = LAYOUT[mode];
    svg.setAttribute('viewBox', g.viewBox);
    for (const [name, [x, y, width]] of Object.entries(g.tags)) {
      if (!tags[name]) continue;
      tags[name].setAttribute('x', String(x));
      tags[name].setAttribute('y', String(y));
      tags[name].setAttribute('width', String(width));
    }
    root.classList.toggle('is-stacked', mode === 'narrow');
  }

  // One draw for every frame, from the state alone: no DOM measurement, no history.
  function draw(state) {
    const {stage, dr, dc, moving, ray, out, ask, ghost, sign, changed, pool, candidates, paths, crossed} = state;
    const g = LAYOUT[mode], CELL = g.cell, OUT = WINDOW * CELL;
    const [GW, GH] = g.ghostCell;
    const parts = [];
    const text = (x, y, content, cls, anchor, attrs = '') =>
      parts.push(`<text x="${num(x)}" y="${num(y)}" class="${cls}" text-anchor="${anchor}"${attrs}>${content}</text>`);
    const [ix, iy] = g.input, [ox, oy] = g.out, [gx, gy] = g.ghost;
    const cellBox = (row, col) => ({left: ix + col * CELL, top: iy + row * CELL, size: CELL});
    const inputCentre = (row, col) => [ix + (col + 0.5) * CELL, iy + (row + 0.5) * CELL];
    const lift = g.lift;
    // One arrowhead shape, used by the candidate paths, the resolved paths and the max arrow.
    const head = (x, y, dir, cls, attrs = '') => {
      const s = CELL * 0.13;
      const d = dir === 'right'
        ? `M${num(x - s)} ${num(y - s * 0.78)}L${num(x)} ${num(y)}L${num(x - s)} ${num(y + s * 0.78)}`
        : `M${num(x - s * 0.78)} ${num(y - s)}L${num(x)} ${num(y)}L${num(x + s * 0.78)} ${num(y - s)}`;
      parts.push(`<path d="${d}" class="${cls}"${attrs}></path>`);
    };
    const segment = (x1, y1, x2, y2, cls, attrs = '') =>
      parts.push(`<line x1="${num(x1)}" y1="${num(y1)}" x2="${num(x2)}" y2="${num(y2)}" class="${cls}"${attrs}></line>`);

    // Scenery underneath everything: the input cells and the output cells, both standing from
    // the first beat, because the question is about the second map.
    for (let row = 0; row < SIZE; row++) for (let col = 0; col < SIZE; col++) {
      parts.push(`<rect x="${ix + col * CELL}" y="${iy + row * CELL}" width="${CELL}" height="${CELL}" class="pb-cell"></rect>`);
    }
    for (let i = 0; i < BINS; i++) for (let j = 0; j < BINS; j++) {
      const k = i * BINS + j;
      parts.push(`<rect x="${ox + j * OUT}" y="${oy + i * OUT}" width="${OUT}" height="${OUT}" class="pb-out${changed[k] ? ' is-changed' : ''}" data-out="${i}${j}"></rect>`);
    }

    // The one ray: from the winning cell's right edge to the middle of its output cell's left
    // edge. Hidden while the clues are in motion -- a pooled value of a half-moved clue is not
    // a number the chapter has -- and retired once its bin has been named.
    if (ray && ray.p > 0) {
      const [i, j] = ray.bin, source = pool.sources[i * BINS + j];
      const box = source ? cellBox(source[0], source[1]) : {left: ix + j * OUT, top: iy + i * OUT, size: OUT};
      const sx = box.left + box.size, sy = box.top + box.size / 2;
      const ex = ox + j * OUT, ey = oy + (i + 0.5) * OUT;
      segment(sx, sy, lerp(sx, ex, ray.p), lerp(sy, ey, ray.p), 'pb-ray', ` data-ray="${i}${j}"`);
      if (ray.p >= 1) parts.push(`<circle cx="${num(ex)}" cy="${num(ey)}" r="3" class="pb-ray-end"></circle>`);
    }

    // The four fixed bins, drawn heavy; the edge a clue has crossed lights in wine.
    for (let i = 0; i < BINS; i++) for (let j = 0; j < BINS; j++) {
      parts.push(`<rect x="${ix + j * OUT}" y="${iy + i * OUT}" width="${OUT}" height="${OUT}" class="pb-bin-edge" data-bin="${i}${j}"></rect>`);
    }
    if (crossed) {
      const [bi, bj] = binOf(WITNESS.row, WITNESS.col);
      const edgeY = iy + (bi + (DOWN[0] > 0 ? 1 : 0)) * OUT;
      segment(ix + bj * OUT, edgeY, ix + (bj + 1) * OUT, edgeY, 'pb-crossed-edge', ' data-crossed-edge=""');
    }
    // One grey note carries what sixteen resting zeros and eight index digits used to.
    NOTE.forEach((line, n) => text(g.note[0], g.note[1] + n * g.note[2], line, 'pb-note', 'middle', ` data-note="${n}"`));

    // The max operator between the two maps, in ink whenever a pooled map stands.
    {
      const a = g.arrow, used = out.some(value => value !== null);
      segment(a.x1, a.y1, a.x2, a.y2, `pb-arrow${used ? ' is-used' : ''}`);
      head(a.x2, a.y1, 'right', `pb-arrow${used ? ' is-used' : ''}`);
      text(a.label[0], a.label[1], 'max', `pb-arrow-label${used ? ' is-used' : ''}`, a.label[2]);
    }
    // An output cell is unwritten until its value lands: a question mark before anything has
    // been pooled, a dot while the clues are between pixels. Never a zero standing in.
    for (let i = 0; i < BINS; i++) for (let j = 0; j < BINS; j++) {
      const k = i * BINS + j, cx = ox + (j + 0.5) * OUT, cy = oy + (i + 0.5) * OUT;
      if (out[k] !== null) text(cx, cy + lift * 1.3, String(out[k]), 'pb-value pb-out-value', 'middle', ` data-value="h${i}${j}"`);
      else if (ask) text(cx, cy + g.ask, '?', 'pb-ask', 'middle', ` data-value="h${i}${j}"`);
      else text(cx, cy + lift, '·', 'pb-dot', 'middle', ` data-value="h${i}${j}"`);
    }

    // The record: the first pooled map, kept under the live one at half height so each value
    // sits directly below the value it is compared with. Its changed cells take the same wine
    // ring as the live ones, so the two maps pair up by eye.
    if (ghost > 0) {
      parts.push(`<g data-record="" opacity="${num(ghost)}">`);
      for (let i = 0; i < BINS; i++) for (let j = 0; j < BINS; j++) {
        const k = i * BINS + j, mark = changed[k] ? ' is-changed' : '';
        parts.push(`<rect x="${gx + j * GW}" y="${gy + i * GH}" width="${GW}" height="${GH}" class="pb-ghost-cell${mark}" data-ghost="${i}${j}"></rect>`);
        text(gx + (j + 0.5) * GW, gy + (i + 0.5) * GH + lift * 0.9, String(record[k]), `pb-ghost-value${mark}`, 'middle', ` data-value="g${i}${j}"`);
      }
      // The rightward verdict, retired out of the glyph slot into the record's own label once
      // its beat is over, so the closing frame -- which is also the static fallback -- carries
      // both outcomes at once.
      const [lx, ly] = g.ghostLabel;
      const verdict = RIGHT_SAME ? '=' : '≠';
      const label = stage >= 4
        ? `before <tspan class="pb-eq" data-retired="${RIGHT_SAME ? 'equal' : 'unequal'}">${verdict}</tspan> after one pixel right`
        : 'before';
      text(lx, ly, label, 'pb-label', 'middle', ' data-record-label=""');
      parts.push('</g>');
    }
    if (sign) text(g.sign[0], g.sign[1], sign, `pb-sign${sign === '=' ? '' : ' is-changed'}`, 'middle', ` data-sign="${sign === '=' ? 'equal' : 'unequal'}"`);

    // What the clue may do, before it does it: two dashed candidate paths on each clue, so a
    // reader who never presses play sees both experiments and both unknowns.
    for (const which of candidates) {
      clues.forEach((clue, n) => {
        const box = cellBox(clue.row, clue.col), cx = box.left + box.size / 2, cy = box.top + box.size / 2;
        if (which === 'right') {
          segment(box.left + box.size + CELL * 0.11, cy, box.left + box.size + CELL * 0.44, cy, 'pb-candidate', ` data-candidate="${n}-right"`);
          head(box.left + box.size + CELL * 0.5, cy, 'right', 'pb-candidate-head');
        } else {
          segment(cx, box.top + box.size + CELL * 0.11, cx, box.top + box.size + CELL * 0.44, 'pb-candidate', ` data-candidate="${n}-down"`);
          head(cx, box.top + box.size + CELL * 0.5, 'down', 'pb-candidate-head');
        }
      });
    }

    // The one object the eye tracks: the two clues, each a white box carrying its value,
    // drawn at its home cell and translated by the shift. Both move as one body.
    const shift = `translate(${num(dc * CELL)} ${num(dr * CELL)})`;
    clues.forEach((clue, n) => {
      const [cx, cy] = inputCentre(clue.row, clue.col);
      parts.push(`<g data-mark="clue-${n}" data-moving="${moving}" transform="${shift}">`);
      parts.push(`<rect x="${num(cx - CELL / 2 + 4)}" y="${num(cy - CELL / 2 + 4)}" width="${CELL - 8}" height="${CELL - 8}" rx="4" class="pb-clue-box"></rect>`);
      text(cx, cy + lift, String(clue.value), 'pb-value', 'middle', ` data-value="clue${n}"`);
      parts.push('</g>');
    });

    // The closing frame says, once, on the picture and where the geometry is, why one shift
    // was invisible and the other was not. Drawn over the clue boxes so the crossing head
    // touches the box it moved into.
    if (paths) {
      // Two ways out of one cell, not one elbow: a marked origin, then two arrows that each
      // end past the line they are about -- the thin one inside the bin, the heavy one across
      // its edge. Said once, on the picture, where the geometry is.
      const box = cellBox(WITNESS.row, WITNESS.col), cx = box.left + box.size / 2, cy = box.top + box.size / 2;
      const r = CELL * 0.09;
      parts.push(`<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}" class="pb-path-origin" data-path-origin=""></circle>`);
      segment(cx + r * 1.4, cy, cx + CELL * 0.66, cy, 'pb-path is-stay', ' data-path="stay"');
      head(cx + CELL * 0.78, cy, 'right', 'pb-path-head is-stay');
      segment(cx, cy + r * 1.4, cx, cy + CELL * 0.66, 'pb-path is-cross', ' data-path="cross"');
      head(cx, cy + CELL * 0.78, 'down', 'pb-path-head is-cross');
      text(cx + CELL * 0.95, cy + CELL * 0.08, 'stays inside its bin', 'pb-path-label is-stay', 'start', ' data-path-label="stay"');
      text(cx + CELL * 0.5, cy + CELL * 1.12, 'crosses into the next bin', 'pb-path-label is-cross', 'start', ' data-path-label="cross"');
    }
    return parts.join('');
  }

  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const stage = stageAt(time);
    // Under reduced motion the picture is the beat's end state: every reveal inside the beat
    // has happened and the clues stand at their beat position, never between.
    const held = reducedMotion ? (beats[stage + 1] === undefined ? duration : beats[stage + 1]) - 1e-6 : time;
    let dr = 0, dc = 0, moving = false, ray = null, written = NONE, ghost = 0, pool = POOL.home;
    let ask = false, candidates = [], paths = false;
    const slide = (from, to, start, dur) => {
      const u = smooth((held - start) / dur);
      dr = lerp(from[0], to[0], u); dc = lerp(from[1], to[1], u);
      return held >= start && held < start + dur;
    };
    if (stage === 0) {
      // The question, standing: both clues, both candidate moves, and a map of four unknowns.
      ask = true; candidates = ['right', 'down'];
    } else if (stage === 1) {
      // One ray, from the bin the whole scene is about: the one the witness clue will leave.
      ray = {bin: binOf(WITNESS.row, WITNESS.col), p: clamp((held - T.pool.ray) / T.pool.draw)};
      written = schedule(held, T.pool.start, T.pool.gap, T.pool.write);
    } else if (stage === 2) {
      ghost = clamp((held - T.right.ghost) / T.right.fade);
      moving = slide([0, 0], RIGHT, T.right.move, T.right.dur);
      if (held < T.right.move) written = FULL;
      else if (!moving) { pool = POOL.right; written = held >= T.right.write ? FULL : NONE; }
    } else if (stage === 3) {
      [dr, dc] = RIGHT; ghost = 1; pool = POOL.right; written = FULL;
    } else if (stage === 4) {
      ghost = 1;
      moving = slide(RIGHT, [0, 0], T.home.move, T.home.dur);
      if (held < T.home.move) { pool = POOL.right; written = FULL; }
      else if (!moving) {
        written = held >= T.home.write ? FULL : NONE;
        // The second question, drawn rather than only said: one candidate move, downward.
        candidates = ['down'];
      }
    } else if (stage === 5) {
      ghost = 1;
      moving = slide([0, 0], DOWN, T.down.move, T.down.dur);
      if (held < T.down.move) written = FULL;
      else if (!moving) {
        pool = POOL.down;
        // The payoff ray: out of the bin the witness clue has just entered, so which output
        // cell received the value is what the frame says.
        ray = {bin: binOf(WITNESS.row + DOWN[0], WITNESS.col + DOWN[1]), p: clamp((held - T.down.ray) / T.down.draw)};
        written = held >= T.down.write ? FULL : NONE;
      }
    } else if (stage === 6) {
      [dr, dc] = DOWN; ghost = 1; pool = POOL.down; written = FULL; paths = true;
    }
    // A pooled value is written only once its own reveal has finished, and only when the clues
    // stand on whole pixels; before that the cell is unwritten, never 0.
    const out = pool.values.map((value, k) => (written[k] >= 1 ? value : null));
    const landed = out.every(value => value !== null);
    // The ring on a changed value appears as that value lands, on the live map and on the
    // record together, from the first moved map on.
    const changed = stage >= 2 ? out.map((value, k) => value !== null && value !== record[k]) : record.map(() => false);
    // A verdict is drawn at a verdict and retired between: `=` when the chapter's own shift
    // has just been pooled, `≠` from the moment the down-shifted map lands.
    const sign = stage === 3 ? (RIGHT_SAME ? '=' : '≠')
      : (stage >= 5 && landed && changed.some(Boolean) ? '≠' : null);
    // The edge the witness clue has crossed lights as soon as it stands on the far side of
    // it, so the payoff beat shows the reason and not only the result.
    const crossed = stage >= 5 && !moving && Math.round(dr) === DOWN[0] && Math.round(dc) === DOWN[1];

    // Publish the state the tests read. dataset.stage is the shared handle; the fixture
    // attributes are not overwritten, so the declared clues stay readable while they move.
    root.dataset.stage = String(stage);
    root.dataset.offset = `${dr.toFixed(4)} ${dc.toFixed(4)}`;
    root.dataset.moving = String(moving);
    root.dataset.pooled = JSON.stringify(out);
    root.dataset.record = JSON.stringify(record);
    root.dataset.sign = sign || '';
    const classes = {
      'show-record': ghost > 0,
      'wash-bin': stage === 1,
      'wash-crossed': stage >= 5 && landed && changed.some(Boolean)
    };
    for (let s = 0; s < beats.length; s++) root.classList.toggle(`stage-${s}`, s === stage);
    for (const [name, on] of Object.entries(classes)) root.classList.toggle(name, on);

    // Redraw only when the picture actually changes, and only from cached geometry.
    const stateKey = [stage, mode, dr.toFixed(4), dc.toFixed(4), moving,
      ray === null ? '-' : `${ray.bin.join('')}:${ray.p.toFixed(3)}`,
      out.join(','), ask, ghost.toFixed(2), sign, changed.join(','), candidates.join('+'), paths, crossed].join('/');
    if (stateKey !== previousKey) {
      previousKey = stateKey;
      drawing.innerHTML = draw({stage, dr, dc, moving, ray, out, ask, ghost, sign, changed, pool, candidates, paths, crossed});
      const where = clues.map(clue => `${clue.value} at row ${clue.row + Math.round(dr)}, column ${clue.col + Math.round(dc)}`).join(' and ');
      svg.setAttribute('aria-label', `${STAGES[stage]}. Clues ${where}.`
        + (landed ? ` Pooled ${out.join(', ')}.` : moving ? ' The clues are moving; the pooled map is unwritten.' : '')
        + (sign ? ` ${sign === '=' ? 'Equal to' : 'Not equal to'} the record ${record.join(', ')}.` : ''));
    }

    // One caption per beat, at most fourteen words, saying what is happening now in plain
    // words. Every number in it is the declared fixture or the pooling above.
    const blue = word => `<span class="input-role">${word}</span>`;
    const name = list => list.map(clue => blue(clue.value)).join(' and ');
    const nChanged = differs(POOL.down.values).filter(Boolean).length;
    const words = ['Zero', 'One', 'Two', 'Three', 'Four'][nChanged] || String(nChanged);
    const sentence = [
      `Two clues sit in fixed <span class="bin-role">2×2 bins</span>. Slide them: does pooling notice?`,
      `Each <span class="bin-role">bin</span> keeps only its largest value.`,
      `Both clues slide one pixel right, staying inside their own <span class="bin-role">bins</span>.`,
      `Same four values. This shift is invisible to pooling.`,
      `Both clues come home. Now slide one pixel down instead.`,
      `Both slide one pixel down. The ${name(crossers(DOWN))} leaves its <span class="bin-role">bin</span>.`,
      `<span class="error-role">${words} pooled values changed:</span> tolerance ends at the <span class="bin-role">bin edge</span>. Not invariance.`][stage];
    // A polite live region must be written only when it changes; render() runs every frame.
    if (captionKey !== sentence) { captionKey = sentence; caption.innerHTML = sentence; }

    // Scrubber-only wording: the caption sentence is already spoken by the live region, so
    // aria-valuetext names the stage and the pooled values instead of repeating it.
    return `${STAGES[stage]}. Clues shifted ${Math.round(dr)} down, ${Math.round(dc)} right.${landed ? ` Pooled ${out.join(', ')}.` : ''}`;
  }

  // One typeset call after mount, guarded. MathJax's lazyAlwaysTypeset list already covers
  // span[id^="eq-"], so on the book page the three formulas are normally typeset before this
  // runs and the call is skipped; it is here for a page that opened the disclosure before
  // MathJax finished. Without MathJax the TeX source stays readable, as everywhere else in
  // the book, and data-typeset says which happened. The TeX is never touched.
  function typeset() {
    const done = () => { root.dataset.typeset = root.querySelector('mjx-container') ? 'mathjax' : 'none'; };
    const mathjax = window.MathJax;
    if (mathjax && typeof mathjax.typesetPromise === 'function') {
      if (root.querySelector('mjx-container')) done(); else mathjax.typesetPromise([root]).then(done, done);
      return;
    }
    done();
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => {
        const startup = window.MathJax && window.MathJax.startup;
        if (startup && startup.promise) startup.promise.then(done, done); else done();
      }, {once: true});
    }
  }

  // The picture's accessible name is composed from the declared fixture, so the panel holds
  // no second copy of the witness numbers: moving the fixture moves this sentence too.
  const title = `A ${SIZE} × ${SIZE} grid of zeros with ${clues.map(clue => `${clue.value} at row ${clue.row}, column ${clue.col}`).join(' and ')}, `
    + `cut into ${BINS * BINS} fixed ${WINDOW} × ${WINDOW} bins drawn as heavy squares; every other cell is 0. `
    + `Each clue is a white box with an ink outline carrying two candidate moves, right and down, and it slides one pixel right, home, then one pixel down. `
    + `Beside it the ${BINS} × ${BINS} pooled map, and under that a dashed record of the first pooled map, ${record.join(', ')}, labelled equal to the map after the one-pixel move right; `
    + `the bins whose value changed are ringed in wine on both maps, and the sign between the two maps reads equal or not equal.`;
  const named = svg.querySelector('title');
  if (named && named.textContent !== title) named.textContent = title;

  measure();
  window.BookPlayback(root, render, () => { measure(); previousKey = ''; render(lastTime, reduced); });
  typeset();
})();
