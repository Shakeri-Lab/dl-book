(() => {
  const root = document.getElementById('quantization-grid-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  // The panel is the one in-repo mirror of the manuscript fixture
  // (chapters/part5/17-peft-quantization.qmd:1132-1134, the fig-quantization-granularity cell):
  // the grid `np.arange(-3, 4) / 3`, declared as data-grid="-3 4 3", and the eight `values`.
  // The rule that rounds them is @eq-symmetric-quantization (L963-976): Q = 2^(b-1) - 1,
  // s = max|W| / Q, q = clip(round(W/s), -Q, Q), W-hat = s q. interactives/manifest.json
  // names those literals and scripts/audit_excerpt_fixtures.py keeps the chapter and this
  // panel together, so nothing below retypes a number the manuscript owns.
  const numbers = name => root.dataset[name].trim().split(/\s+/).map(Number);
  const VALUES = numbers('values');
  const [G0, G1, GDIV] = numbers('grid');
  const BITS = numbers('bitChoices');
  const [B_START, B_DROP] = numbers('timelineBits');
  const N_VALUES = Number(root.dataset.payloadValues);
  const MAXABS = Math.max(...VALUES.map(Math.abs));
  // The chapter's grid is the codes G0 .. G1-1 over GDIV: symmetric, so -G0 = G1 - 1 = Q_book,
  // and its spacing 1/GDIV is s = max|W| / Q only because the largest |value| is 1. The timeline
  // opens on the bit width whose Q is the chapter's and opens the grid to the other one.
  const Q_BOOK = G1 - 1;
  const qOf = b => Math.pow(2, b - 1) - 1;
  if (!(VALUES.length >= 2 && -G0 === Q_BOOK && GDIV === Q_BOOK && MAXABS === 1 && qOf(B_DROP) === Q_BOOK && BITS.includes(B_START) && BITS.includes(B_DROP))) {
    throw Error('quantization-grid: the declared fixture is not the chapter\'s symmetric grid');
  }
  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = svg.querySelector('[data-drawing]'), caption = $('[data-caption]');
  const slider = $('[data-bits-slider]'), readout = $('[data-bits-readout]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration || beats[beats.length - 1]);
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);
  const STAGES = ['Collide', 'Origins', 'Bound', 'Open', 'Price'];
  const clamp = value => Math.max(0, Math.min(1, value));
  const lerp = (a, b, u) => a + (b - a) * u;
  // The film's easings (6050-Ch17/lecture.jsx: smooth = Easing.easeInOutCubic for a move,
  // enter = easeOutCubic for a mark arriving).
  const cubicInOut = u => { const v = clamp(u); return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; };
  const outCubic = u => 1 - Math.pow(1 - clamp(u), 3);
  let lastTime = 0, reduced = false, previousKey = '', captionKey = '', readoutKey = '', mode = 'wide', scalePx = 1;
  let override = null;

  // --- The scene's own arithmetic: the chapter's rule applied to the chapter's values ------
  // np.round rounds halves to even; Math.round rounds them up. None of the fixture's values
  // sits on a half at any declared bit width (the test asserts it), but the rule is the
  // chapter's, so it is written the chapter's way.
  const roundHalfEven = x => (Math.abs(x % 1) === 0.5 ? 2 * Math.round(x / 2) : Math.round(x));
  const quantize = b => {
    const Q = qOf(b), s = MAXABS / Q;
    const codes = VALUES.map(w => Math.max(-Q, Math.min(Q, roundHalfEven(w / s))));
    const recon = codes.map(q => s * q);
    const errors = VALUES.map((w, i) => Math.abs(w - recon[i]));
    const byCode = new Map();
    codes.forEach((q, i) => { if (!byCode.has(q)) byCode.set(q, []); byCode.get(q).push(i); });
    const collisions = [...byCode.entries()].filter(([, idx]) => idx.length > 1).map(([code, indices]) => ({code, indices}));
    const rank = codes.map((q, i) => byCode.get(q).indexOf(i));
    return {b, Q, s, codes, recon, errors, rank, collisions, maxError: Math.max(...errors), bound: s / 2,
      ticks: 2 * Q + 1, payloadGB: N_VALUES * b / 8 / 1e9, unchanged: VALUES.map((_, i) => i).filter(i => errors[i] === 0)};
  };
  const GRIDS = Object.fromEntries(BITS.map(b => [b, quantize(b)]));
  const G3 = GRIDS[B_DROP], G8 = GRIDS[B_START];
  // The four weights the coarse grid cannot tell apart: the only ones whose value is evidence
  // for this scene's point, so the only ones ever written above a dot while the timeline runs.
  const COLLIDER = new Set(G3.collisions.flatMap(c => c.indices));
  const LONGEST = G3.errors.indexOf(G3.maxError);
  // A weight whose value is already written as a tick label -- the two extremes, which set s
  // and are the ends of the line -- is never written a second time above its dot.
  const namedByTick = i => Math.abs(VALUES[i]) === MAXABS;
  const MINUS = '−';
  const fixed = (value, digits) => {
    const text = Math.abs(value).toFixed(digits);
    return value < 0 && Number(text) !== 0 ? `${MINUS}${text}` : text;
  };
  // Spacings and errors print with three decimals, or four once the grid is finer than 0.01.
  const fine = g => g.s < 0.01;
  const fmtS = (g, v) => fixed(v, fine(g) ? 4 : 3);
  const plain = value => String(Number(value.toFixed(4)));
  // A reconstruction in words: up to three decimals, trailing zeros dropped (0, −0.667, 0.333).
  const tick3 = value => { const n = Number(value.toFixed(3)); return `${n < 0 ? MINUS : ''}${Math.abs(n)}`; };
  const gb = g => plain(g.payloadGB);
  // The bound is measured at a tick the dots leave free where there is one -- at three bits
  // that is −0.333 -- so the bracket never crosses a stack; otherwise the least crowded tick
  // nearest zero. It is drawn from that tick to the edge of its basin, toward the centre.
  const boundTick = grid => {
    let best = -grid.Q, count = Infinity;
    for (let q = -grid.Q; q <= grid.Q; q++) {
      const here = grid.codes.filter(c => c === q).length;
      if (here < count || (here === count && Math.abs(q) < Math.abs(best))) { best = q; count = here; }
    }
    return best;
  };

  // --- Choreography ----------------------------------------------------------------
  // Seconds inside each beat. Every schedule finishes before its beat ends, so under reduced
  // motion the beat's end state is its whole state. The order puts the answer-in-waiting at
  // t = 0 -- the grid drawn, the eight dots already on their ticks, two pairs already stacked
  // -- and then explains it: where the four collided weights came from, what a tick's basin
  // is, what opening the grid does, and what that costs.
  const T = {
    rings: {start: beats[0] + 0.6, dur: 0.8},
    ghosts: {start: beats[1] + 0.3, dur: 0.6},
    bars4: {start: beats[1] + 1.2, dur: 1.4},
    labelsOut: {start: beats[2] + 0.0, dur: 0.6},
    basins: {start: beats[2] + 0.3, dur: 0.7},
    bracket: {start: beats[2] + 1.3, dur: 0.7},
    retire: {start: beats[3] + 0.0, dur: 0.6},
    openAt: beats[3] + 0.3,
    grid8: {start: beats[3] + 0.6, dur: 0.7},
    split: {start: beats[3] + 1.5, dur: 2.5},
    relight: {start: beats[3] + 4.0, dur: 0.6},
    backAt: beats[4] + 0.3,
    grid3: {start: beats[4] + 0.3, dur: 0.6},
    merge: {start: beats[4] + 0.6, dur: 1.8},
    dim: {start: beats[4] + 2.4, dur: 0.6},
    payload: {start: beats[4] + 3.4, dur: 0.6}
  };
  const GHOSTED = 0.45;

  // --- Geometry ----------------------------------------------------------------------
  // One picture in drawing units: the number line from -max|w| to +max|w|, the weights that
  // matter written above it, the grid's two end ticks and its collided ticks written under it,
  // the error bars in lanes under those, then one grid line and, at the last beat, one payload
  // line. Wide is the desktop figure; narrow (phone widths) is the same line in a smaller box
  // with the value labels staggered into two rows and the type stepped down by player.css.
  const LAYOUT = {
    wide: {viewBox: '0 0 860 176', left: 50, right: 810, lineY: 70, labelY: [24, 24], ghostR: 4.5, dotR: 7, lift: 15,
      stackMax: 24, tickH: 16, fineTickH: 10, bandH: 6, basinPad: 4, bracketY: 32, bracketLeg: 9, bracketLabelY: 22,
      tickLabelY: 102, laneY: 116, laneGap: 9, errorGap: 14, statsGap: 20, payloadGap: 18, ringPad: 4, tieMin: 4,
      labelPx: 42, minTickPx: 2.2},
    narrow: {viewBox: '0 0 360 166', left: 28, right: 332, lineY: 66, labelY: [22, 36], ghostR: 3.5, dotR: 5, lift: 11,
      stackMax: 16, tickH: 12, fineTickH: 8, bandH: 5, basinPad: 3, bracketY: 30, bracketLeg: 7, bracketLabelY: 20,
      tickLabelY: 94, laneY: 106, laneGap: 8, errorGap: 12, statsGap: 23, payloadGap: 16, ringPad: 4, tieMin: 3,
      labelPx: 30, minTickPx: 3}
  };
  const num = value => Number(value.toFixed(2));

  // The only measurement in the file, called from layout() and once before mounting: the
  // figure's width chooses the layout, and the CSS pixels per drawing unit decide whether a
  // fine grid can be drawn tick by tick or must be a band with its count written on it.
  function measure() {
    const width = figure.getBoundingClientRect().width || 780;
    mode = width < 600 ? 'narrow' : 'wide';
    const g = LAYOUT[mode];
    svg.setAttribute('viewBox', g.viewBox);
    scalePx = width / Number(g.viewBox.split(/\s+/)[2]);
    root.classList.toggle('is-stacked', mode === 'narrow');
    root.dataset.layout = mode;
  }

  // One draw for every frame, from the state alone: no DOM measurement, no history.
  function draw(state) {
    const {grid, out, outIn, next, gridIn, pos, rank, liftF, ringGrid, labels, ghostIn, growOf,
      basinIn, bracketIn, statsIn, payloadIn, ringsIn, dragged} = state;
    const g = LAYOUT[mode];
    const W = g.right - g.left;
    const px = w => g.left + (w + MAXABS) / (2 * MAXABS) * W;
    const parts = [];
    const text = (x, y, content, cls, anchor, attrs = '') =>
      parts.push(`<text x="${num(x)}" y="${num(y)}" class="${cls}" text-anchor="${anchor}"${attrs}>${content}</text>`);
    const stagger = mode === 'narrow';
    const pitch = gr => W / (2 * gr.Q) * scalePx;
    // How high a stack of dots sharing one tick may grow: enough to read two or three apart,
    // never so high that it reaches the bound bracket above the line.
    const highest = Math.max(0, ...rank);
    const lift = (highest ? Math.min(g.lift, g.stackMax / highest) : g.lift) * liftF;
    const xNow = VALUES.map((w, i) => px(pos[i]));
    const yNow = VALUES.map((w, i) => g.lineY - rank[i] * lift);

    // The basins: each tick's half-open share of the line, |w - tick| <= s/2, washed in the
    // error's colour alternately so the boundaries at the midpoints show; clipped to the
    // range of the values, which is the calibrated range and is never exceeded.
    if (basinIn !== null) {
      parts.push(`<g data-basins="" opacity="${num(basinIn)}">`);
      for (let q = -grid.Q; q <= grid.Q; q++) {
        const lo = Math.max(-MAXABS, (q - 0.5) * grid.s), hi = Math.min(MAXABS, (q + 0.5) * grid.s);
        parts.push(`<rect x="${num(px(lo))}" y="${g.lineY - g.tickH - g.basinPad}" width="${num(px(hi) - px(lo))}" height="${2 * (g.tickH + g.basinPad)}" class="qg-basin${(q + grid.Q) % 2 ? ' is-odd' : ''}"></rect>`);
      }
      parts.push('</g>');
    }

    // The grid: 2Q + 1 ticks at s apart, drawn as a comb wherever the pane can separate them
    // -- at 8 bits on a desktop figure that comb is a fine ruler, which is the whole contrast
    // with seven fat ticks -- and as a pale band where it cannot, on a phone. While one grid
    // gives way to the other the outgoing one fades as the incoming one arrives; the tick
    // count is written once, on the grid line under the picture, never on the band as well.
    // `named` is 'all' (the ends plus every tick this grid crowds), 'ends' (the two ends of
    // the ruler only) or false (nothing).
    const ticksOf = (gr, opacity, key, named = 'all') => {
      const band = pitch(gr) < g.minTickPx;
      parts.push(`<g data-grid="${key}" data-ticks="${gr.ticks}" data-shape="${band ? 'band' : 'comb'}" opacity="${num(opacity)}">`);
      if (band) {
        parts.push(`<rect x="${g.left}" y="${g.lineY - g.bandH}" width="${W}" height="${2 * g.bandH}" class="qg-band"></rect>`);
      } else {
        const slim = pitch(gr) < 6;
        const h = slim ? g.fineTickH : g.tickH;
        const d = [];
        for (let q = -gr.Q; q <= gr.Q; q++) d.push(`M${num(px(q * gr.s))} ${g.lineY - h}V${g.lineY + h}`);
        parts.push(`<path d="${d.join('')}" class="qg-ticks${slim ? ' is-fine' : ''}"></path>`);
      }
      // Tick labels: the two ends of the line, which are also the two weights the grid leaves
      // alone, plus every tick this grid sends more than one weight to, written as the number
      // those weights became. A grid on its way out keeps its two ends -- both grids put them
      // at the same place, so the ruler never blinks -- and drops its interior labels, which
      // would otherwise stand among the incoming grid's.
      if (!named) { parts.push('</g>'); return; }
      const collided = new Set(gr.collisions.map(c => c.code));
      for (let q = -gr.Q; q <= gr.Q; q++) {
        const end = Math.abs(q) === gr.Q;
        if (!end && (named === 'ends' || !collided.has(q))) continue;
        text(px(q * gr.s), g.tickLabelY, end ? fixed(q * gr.s, 2) : tick3(q * gr.s), `qg-tick-label${end ? '' : ' is-collision'}`, 'middle', ` data-tick="${q}"`);
      }
      parts.push('</g>');
    };
    if (out && outIn > 0) ticksOf(out, outIn, 'prev', 'ends');
    if (next) ticksOf(next, 0, 'next', false);
    ticksOf(grid, gridIn, 'live');

    // Where each dot is now, and the wine bar beneath it: the bar runs from the weight to the
    // dot -- the reconstruction error, drawn as the distance it is -- and grows out of the
    // weight's ghost as the beat reveals it. Two bars of a pair that shares a tick take
    // different lanes, keyed by the order they reached it, so a pair reads as two measurements
    // rather than one long bar spanning both.
    const moved = VALUES.map((_, i) => Math.abs(VALUES[i] - pos[i]) > 1e-12);
    const lanes = rank;
    const lanesUsed = moved.some(Boolean) ? Math.max(...lanes.filter((_, i) => moved[i])) + 1 : 0;
    // The rows under the picture are keyed to the lanes the bars WOULD need, not to the
    // lanes drawn at this instant, so the grid line and the payload line never move while a
    // bar is revealed or retired.
    const laneBottom = lanesUsed ? g.laneY + (lanesUsed - 1) * g.laneGap + 4 : g.tickLabelY + 6;
    const statsY = laneBottom + g.statsGap;
    const payloadY = statsY + g.payloadGap;
    if (growOf) {
      parts.push('<g data-bars="">');
      VALUES.forEach((w, i) => {
        if (!moved[i]) return;
        const y = g.laneY + lanes[i] * g.laneGap;
        const grow = growOf(i);
        parts.push(`<line x1="${num(px(w))}" y1="${y}" x2="${num(lerp(px(w), xNow[i], grow))}" y2="${y}" class="qg-error" data-error="${i}" data-lane="${lanes[i]}" opacity="${num(grow > 0 ? 1 : 0)}"></line>`);
      });
      parts.push('</g>');
      // The largest move on the picture, written under the bar that is it.
      if (bracketIn !== null) {
        const y = g.laneY + lanes[LONGEST] * g.laneGap;
        text((px(VALUES[LONGEST]) + xNow[LONGEST]) / 2, y + g.errorGap, `<tspan data-value="max-error">${fmtS(grid, grid.maxError)}</tspan>`, 'qg-longest', 'middle', ` data-longest="${LONGEST}" opacity="${num(bracketIn)}"`);
      }
    }

    // The bound: a bracket from a tick the dots left free to the edge of that tick's basin,
    // in the error's colour, so the span the reader measures crosses no mark of its own.
    if (bracketIn !== null) {
      const q = boundTick(grid), at = q * grid.s;
      const dir = q === 0 ? 1 : -Math.sign(q);
      const a = px(at), b = px(at + dir * grid.bound), y = g.bracketY;
      const lo = Math.min(a, b), hi = Math.max(a, b);
      const shape = hi - lo >= 6 ? `M${num(lo)} ${y + g.bracketLeg}V${y}H${num(hi)}V${y + g.bracketLeg}` : `M${num(a)} ${y + g.bracketLeg}V${y}`;
      parts.push(`<g data-bracket="" data-tick="${q}" data-span="${hi - lo >= 6 ? 'bracket' : 'tick'}" opacity="${num(bracketIn)}"><path d="${shape}" class="qg-bracket"></path>`);
      text((lo + hi) / 2, g.bracketLabelY, `s/2 = <tspan data-value="bound">${fmtS(grid, grid.bound)}</tspan>`, 'qg-bracket-label', 'middle');
      parts.push('</g>');
    }

    // The ghost of each weight where it stood before the grid moved it, drawn only where it
    // would stand clear of its dot: a ring half-swallowed by the mark it belongs to reads as a
    // smudge, and the bar beneath already measures a move too small to separate them.
    if (ghostIn) {
      parts.push('<g data-ghosts="">');
      VALUES.forEach((w, i) => {
        const opacity = ghostIn(i);
        if (opacity <= 0 || Math.abs(xNow[i] - px(w)) <= g.dotR + g.ghostR + 3) return;
        parts.push(`<circle cx="${num(px(w))}" cy="${g.lineY}" r="${g.ghostR}" class="qg-ghost" data-ghost="${i}" opacity="${num(opacity)}"></circle>`);
      });
      parts.push('</g>');
    }

    // The collisions. At the coarse grid each pair is a stack of dots inside a dashed ring.
    // Open the grid and the ring stays where it was, an empty socket punched out of the finer
    // comb, with a short dashed tie to each dot that left it: both were here, now they are
    // here and here, in one glance and without a number.
    const sockets = [], ties = [], ringMarks = [];
    for (const c of ringGrid.collisions) {
      const n = c.indices.length, half = lift * (n - 1) / 2;
      const cx = px(c.code * ringGrid.s), cy = g.lineY - half, r = half + g.dotR + g.ringPad;
      if (liftF < 1) sockets.push(`<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}" class="qg-socket" data-socket="${c.code}"></circle>`);
      for (const i of c.indices) {
        const gap = Math.abs(xNow[i] - cx) - r - g.dotR;
        if (gap < g.tieMin) continue;
        const side = Math.sign(xNow[i] - cx) || 1;
        ties.push(`<line x1="${num(cx + side * r)}" y1="${g.lineY}" x2="${num(xNow[i] - side * g.dotR)}" y2="${g.lineY}" class="qg-tie" data-tie="${i}"></line>`);
      }
      ringMarks.push(`<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}" class="qg-ring" data-ring="${c.code}" data-count="${n}"></circle>`);
    }
    if (sockets.length) parts.push(`<g data-sockets="" opacity="${num(ringsIn)}">${sockets.join('')}</g>`);
    // The number line, over the sockets so the line is never broken, under everything else.
    parts.push(`<line x1="${g.left}" y1="${g.lineY}" x2="${g.right}" y2="${g.lineY}" class="qg-line"></line>`);
    if (ties.length) parts.push(`<g data-ties="" opacity="${num(ringsIn)}">${ties.join('')}</g>`);
    parts.push(`<g data-rings="" opacity="${num(ringsIn)}">${ringMarks.join('')}</g>`);

    // The one object the eye tracks: the eight weights.
    parts.push('<g data-dots="">');
    VALUES.forEach((w, i) => {
      parts.push(`<circle cx="${num(xNow[i])}" cy="${num(yNow[i])}" r="${g.dotR}" class="qg-dot" data-mark="dot" data-i="${i}"></circle>`);
    });
    parts.push('</g>');
    // The weights that are written above their dots, at the beat that needs them: the four the
    // grid cannot tell apart, and at the closing hold all six that the two end labels do not
    // already name, ghosted.
    parts.push('<g data-values="">');
    VALUES.forEach((w, i) => {
      const opacity = labels(i);
      if (opacity <= 0) return;
      text(px(w), g.labelY[stagger ? i % 2 : 0], fixed(w, 2), 'qg-value', 'middle', ` data-w="${i}" opacity="${num(opacity)}"`);
    });
    parts.push('</g>');

    // The grid, named once, under the picture; and at the closing beat what this grid costs
    // against the one that pulled the pairs apart.
    if (statsIn !== null) {
      const payload = dragged ? ` · <tspan data-value="payload">${gb(grid)}</tspan> GB per billion weights` : '';
      text(g.left, statsY, `<tspan data-value="ticks">${grid.ticks}</tspan> ticks · s = <tspan data-value="s">${fmtS(grid, grid.s)}</tspan>${payload}`, 'qg-stats', 'start', ` data-stats="grid" opacity="${num(statsIn)}"`);
    }
    if (payloadIn !== null) {
      text(g.left, payloadY, `payload = <tspan data-value="payload">${gb(grid)}</tspan> GB per billion weights, against <tspan data-value="payload8">${gb(G8)}</tspan> GB at eight bits`, 'qg-payload', 'start', ` data-payload="" opacity="${num(payloadIn)}"`);
    }
    return parts.join('');
  }

  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const stage = stageAt(time);
    // Under reduced motion the picture is the beat's end state: every reveal inside the beat has
    // happened and every dot stands on its beat's tick, never between.
    const held = reducedMotion ? (beats[stage + 1] === undefined ? duration : beats[stage + 1]) - 1e-6 : time;
    const between = (start, dur) => held > start && held < start + dur;
    const dragged = override !== null;
    // The eight bits the payoff opens the grid to, held from the switch in the Open beat until
    // the switch back in the Price beat.
    const eight = (stage === 3 && held >= T.openAt) || (stage === 4 && held < T.backAt);
    const b = dragged ? override : eight ? B_START : B_DROP;
    const grid = GRIDS[b];
    let state;
    if (dragged) {
      // The reader's grid: the whole answer for that b, every mark recomputed from it.
      state = {stage, grid, out: null, outIn: 0, next: null, gridIn: 1, pos: grid.recon, rank: grid.rank, liftF: 1,
        ringGrid: grid, labels: i => (namedByTick(i) ? 0 : GHOSTED), ghostIn: null, growOf: () => 1,
        basinIn: null, bracketIn: null, statsIn: 1, payloadIn: null, ringsIn: 1, dragged: true};
    } else {
      // One eased amount carries the dots between the two grids: out to their own 8-bit ticks
      // in the Open beat, back onto the two shared ticks in the Price beat. The stacks rise and
      // fall with it, so the collision and its undoing are the same motion seen twice.
      const mix = stage < 3 ? 0
        : stage === 3 ? cubicInOut((held - T.split.start) / T.split.dur)
          : 1 - cubicInOut((held - T.merge.start) / T.merge.dur);
      // Each beat's marks exist from the beat's first instant, easing in; a mark whose beat is
      // over is retired, not left standing.
      const retire = stage >= 3 ? 1 - clamp((held - T.retire.start) / T.retire.dur) : 1;
      const ringsIn = clamp((held - T.rings.start) / T.rings.dur);
      const ghostsA = stage < 1 ? 0 : stage === 1 ? outCubic((held - T.ghosts.start) / T.ghosts.dur) : 1;
      const growA = stage < 1 ? 0 : stage === 1 ? outCubic((held - T.bars4.start) / T.bars4.dur) : 1;
      const growB = stage < 2 ? 0 : stage === 2 ? outCubic((held - T.basins.start) / T.basins.dur) : 1;
      // A mark whose beat is over is dropped, not left standing at zero opacity: the bound's
      // basins and bracket fade through the retire window and then leave the drawing.
      const gone = stage >= 3 && retire === 0;
      const basinIn = stage < 2 || gone ? null : clamp((held - T.basins.start) / T.basins.dur) * retire;
      const bracketIn = stage < 2 || gone ? null : clamp((held - T.bracket.start) / T.bracket.dur) * retire;
      const ghostAlive = stage >= 1 && (stage < 3 || retire > 0);
      const payloadIn = stage < 4 ? null : clamp((held - T.payload.start) / T.payload.dur);
      // The four values dim to ghosts once the pairs are home, and the price is written
      // after that, so the picture is never carrying both at full ink.
      const fade = stage < 4 ? 0 : clamp((held - T.dim.start) / T.dim.dur);
      const labels = i => {
        if (namedByTick(i)) return 0;
        const mine = COLLIDER.has(i);
        if (stage === 0) return 0;
        if (stage === 1) return mine ? outCubic((held - T.ghosts.start) / T.ghosts.dur) : 0;
        if (stage === 2) return mine ? 1 - clamp((held - T.labelsOut.start) / T.labelsOut.dur) : 0;
        if (stage === 3) return mine ? clamp((held - T.relight.start) / T.relight.dur) : 0;
        return mine ? lerp(1, GHOSTED, fade) : GHOSTED * fade;
      };
      const gridSwap = stage === 3 ? T.grid8 : T.grid3;
      const swapping = (stage === 3 && held >= T.openAt) || (stage === 4 && held >= T.backAt);
      const gridIn = swapping ? clamp((held - gridSwap.start) / gridSwap.dur) : 1;
      state = {stage, grid,
        out: swapping ? (stage === 3 ? G3 : G8) : null, outIn: 1 - gridIn,
        next: !swapping && stage >= 3 ? (stage === 3 ? G8 : G3) : null,
        gridIn,
        pos: VALUES.map((w, i) => lerp(G3.recon[i], G8.recon[i], mix)),
        rank: G3.rank, liftF: 1 - mix, ringGrid: G3, labels,
        ghostIn: ghostAlive ? i => (COLLIDER.has(i) ? ghostsA : growB) * retire : null,
        growOf: stage >= 1 && (stage < 3 || retire > 0) ? i => (COLLIDER.has(i) ? growA : growB) * retire : null,
        basinIn, bracketIn,
        statsIn: 1,
        payloadIn, ringsIn, dragged: false, mix};
    }
    const moving = !dragged && (between(T.rings.start, T.rings.dur) || between(T.ghosts.start, T.ghosts.dur)
      || between(T.bars4.start, T.bars4.dur) || between(T.labelsOut.start, T.labelsOut.dur)
      || between(T.basins.start, T.basins.dur) || between(T.bracket.start, T.bracket.dur)
      || between(T.retire.start, T.retire.dur) || between(T.grid8.start, T.grid8.dur)
      || between(T.split.start, T.split.dur) || between(T.relight.start, T.relight.dur)
      || between(T.grid3.start, T.grid3.dur) || between(T.merge.start, T.merge.dur)
      || between(T.dim.start, T.dim.dur) || between(T.payload.start, T.payload.dur));

    // Publish the state the tests read. The fixture attributes are not overwritten.
    root.dataset.stage = String(stage);
    root.dataset.b = String(b);
    root.dataset.q = String(grid.Q);
    root.dataset.s = String(grid.s);
    root.dataset.recon = grid.recon.map(v => v.toFixed(6)).join(' ');
    root.dataset.errors = grid.errors.map(v => v.toFixed(6)).join(' ');
    root.dataset.maxError = String(grid.maxError);
    root.dataset.bound = String(grid.bound);
    root.dataset.collisions = JSON.stringify(grid.collisions);
    root.dataset.mix = (dragged ? 0 : state.mix).toFixed(4);
    root.dataset.override = dragged ? 'slider' : '';
    root.dataset.moving = String(moving);
    const classes = {
      'show-formula': true,
      'wash-s': stage === 2 || dragged,
      'wash-q': stage === 3 || dragged
    };
    for (let s = 0; s < beats.length; s++) root.classList.toggle(`stage-${s}`, s === stage);
    for (const [name, on] of Object.entries(classes)) root.classList.toggle(name, on);

    // The slider follows the timeline unless the reader holds it; its readout says the one
    // thing the picture does not, and its aria-valuetext says what that value buys.
    if (!dragged) slider.value = String(BITS.indexOf(b));
    const readoutText = `<i>b</i> = ${b} bits`;
    if (readoutKey !== readoutText) { readoutKey = readoutText; readout.innerHTML = readoutText; }
    slider.setAttribute('aria-valuetext', `b = ${b} bits: Q = ${grid.Q}, ${grid.ticks} ticks, spacing s = ${fmtS(grid, grid.s)}, largest error ${fmtS(grid, grid.maxError)}, ${grid.collisions.length} collision${grid.collisions.length === 1 ? '' : 's'}, payload ${gb(grid)} GB per billion weights.`);

    // Redraw only when the picture actually changes, and only from cached geometry.
    const stateKey = [stage, mode, b, dragged, state.gridIn.toFixed(3), state.outIn.toFixed(3), !!state.next,
      (state.mix || 0).toFixed(4), state.ringsIn.toFixed(3), VALUES.map((_, i) => state.labels(i).toFixed(3)).join(','),
      state.ghostIn ? VALUES.map((_, i) => state.ghostIn(i).toFixed(3)).join(',') : '-',
      state.growOf ? VALUES.map((_, i) => state.growOf(i).toFixed(3)).join(',') : '-',
      state.basinIn === null ? '-' : state.basinIn.toFixed(3), state.bracketIn === null ? '-' : state.bracketIn.toFixed(3),
      state.statsIn === null ? '-' : state.statsIn.toFixed(3), state.payloadIn === null ? '-' : state.payloadIn.toFixed(3)].join('/');
    if (stateKey !== previousKey) {
      previousKey = stateKey;
      drawing.innerHTML = draw(state);
      const merged = grid.collisions.map(c => `${c.indices.map(i => fixed(VALUES[i], 2)).join(' and ')} share ${tick3(c.code * grid.s)}`).join('; ');
      const where = dragged || !state.mix ? `Each dot stands on its nearest tick: ${grid.recon.map(tick3).join(', ')}.`
        : state.mix === 1 ? `Every dot has a tick of its own: ${grid.recon.map(v => fmtS(grid, v)).join(', ')}.`
          : 'The dots are moving between the two grids.';
      svg.setAttribute('aria-label', `${STAGES[stage]}.${dragged ? ' Reader-set' : ''} b = ${b}, Q = ${grid.Q}, ${grid.ticks} ticks ${fmtS(grid, grid.s)} apart. ${where}`
        + (merged ? ` Collisions: ${merged}.` : ' No collisions.')
        + (state.bracketIn ? ` Largest error ${fmtS(grid, grid.maxError)}, bound s/2 = ${fmtS(grid, grid.bound)}.` : '')
        + (state.payloadIn || dragged ? ` Payload ${gb(grid)} GB per billion weights, against ${gb(G8)} GB at eight bits.` : ''));
    }

    // One caption per beat, at most fourteen words, saying what is happening now. Every number
    // in it is the declared fixture or the grid computed above.
    const orange = word => `<span class="parameter-role">${word}</span>`;
    const wine = word => `<span class="error-role">${word}</span>`;
    const count = n => ['no', 'one', 'two', 'three', 'four'][n] !== undefined ? ['no', 'one', 'two', 'three', 'four'][n] : String(n);
    const groups = grid.collisions.length;
    const sentence = dragged
      ? `b = ${b} bits — ${groups ? `${count(groups)} group${groups === 1 ? '' : 's'} ${wine('collide')}` : `nothing ${wine('collides')}`}; largest error ${fmtS(grid, grid.maxError)}.`
      : [
        `Eight ${orange('weights')}, seven ticks. Two pairs already stand on the same tick.`,
        `They came from four different ${orange('weights')}. The grid rounded each to its nearest tick.`,
        `Each tick owns everything within ${fmtS(G3, G3.bound)} of it; the longest ${wine('error')} is ${fmtS(G3, G3.maxError)}.`,
        `${G8.ticks} ticks instead of seven: each pair's two ${orange('weights')} step apart.`,
        `Back to three bits: the pairs ${wine('merge')} again; payload falls to ${gb(G3)} GB.`
      ][stage];
    // A polite live region must be written only when it changes; render() runs every frame.
    if (captionKey !== sentence) { captionKey = sentence; caption.innerHTML = sentence; }

    // Scrubber-only wording: the caption sentence is already spoken by the live region, so
    // aria-valuetext names the stage and the grid instead of repeating it.
    return `${STAGES[stage]}. b = ${b}, ${grid.ticks} ticks, s = ${fmtS(grid, grid.s)}.`;
  }

  // --- The one parameter control ------------------------------------------------------
  // Dragging pauses playback and takes over: every mark is recomputed from the chosen b.
  // Playback is paused through the transport's own button, so the transport's state stays the
  // transport's; then the override is set and the picture redrawn at the same time, which
  // keeps it. Arrow keys on the focused slider move b by one stop and never reach the pane's
  // beat seeking: the transport ignores keydown events whose target is not the pane, and this
  // scene stops nothing.
  function drag() {
    const index = Math.max(0, Math.min(BITS.length - 1, Math.round(Number(slider.value))));
    if (root.dataset.playing === 'true') $('[data-action="play"]').click();
    override = BITS[index];
    render(lastTime, reduced);
  }
  slider.addEventListener('input', drag);
  slider.addEventListener('change', drag);
  // Play from a pause resumes the timeline and its own b: the transport handles the click;
  // this runs first (capture) and drops the detour before the first frame.
  pane.addEventListener('click', event => {
    if (event.target.closest('[data-action="play"]') && root.dataset.playing !== 'true') override = null;
  }, true);
  pane.addEventListener('keydown', event => {
    if (event.target !== pane) return;
    if ([' ', 'k', 'K'].includes(event.key) && root.dataset.playing !== 'true') override = null;
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) override = null;
  }, true);
  // A scrub, even one that lands on the same time, is the timeline speaking. Registered before
  // the transport mounts, so it runs before the transport's own seek and the redraw it causes.
  $('[data-controls] input[type="range"]').addEventListener('input', () => { override = null; });

  // One typeset call after mount, guarded. MathJax's lazyAlwaysTypeset list already covers
  // span[id^="eq-"], so on the book page the formula is normally typeset before this runs and
  // the call is skipped; it is here for a page that opened the disclosure before MathJax
  // finished. Without MathJax the TeX source stays readable, as everywhere else in the book,
  // and data-typeset says which happened. The TeX is never touched.
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
  const title = `A number line from ${fixed(-MAXABS, 2)} to ${fixed(MAXABS, 2)} carrying ${VALUES.length} weights as orange dots: `
    + `${VALUES.map(v => fixed(v, 2)).join(', ')}. At ${G3.b} bits the grid has ${G3.ticks} ticks ${fmtS(G3, G3.s)} apart and each dot stands on its nearest one, `
    + `${G3.recon.map(tick3).join(', ')}, so ${G3.collisions.map(c => `${c.indices.map(i => fixed(VALUES[i], 2)).join(' and ')} both become ${tick3(c.code * G3.s)}`).join(' and ')}; `
    + `each pair is stacked inside a dashed ring. No weight moves farther than ${fmtS(G3, G3.maxError)}, against the rule's bound s/2 = ${fmtS(G3, G3.bound)}. `
    + `At ${G8.b} bits the same rule gives ${G8.ticks} ticks ${fmtS(G8, G8.s)} apart, every pair steps off its shared tick and the rings are left empty. `
    + `Three bits cost ${gb(G3)} GB per billion weights, against ${gb(G8)} GB at eight. A slider under the picture sets b to ${BITS.join(', ')}.`;
  const named = svg.querySelector('title');
  if (named && named.textContent !== title) named.textContent = title;

  measure();
  window.BookPlayback(root, render, () => { measure(); previousKey = ''; render(lastTime, reduced); });
  typeset();
})();
