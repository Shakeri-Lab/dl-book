// A 1 x 1 convolution is one linear layer, run at every pixel.
//
// Contract with interactives/shared/playback.js:
//   window.BookPlayback(root, render, layout?)
//   render(time, reduced) -> the scrubber's description; a pure function of
//     (time, reduced) and the dial that never measures the DOM.
//   layout() -> the only place that measures.
//
// One picture: the input stack of 16 channels, the weights W and biases b, and the output
// stack. The tracked object is the skewer: one pixel's column of channel values, lifted
// out of the input, read by every row of W, and written back as a column of outputs at the
// same pixel. It then moves to another pixel through the very same W, and sweeps them all.
// Two stills (the input stack and the output stack) show that the depth changed and lose
// what the motion carries: every output pixel came from its own column only, through one
// W that never moved. The dial is the one parameter control: the output depth, whose
// effect is the rest of the claim (W grows a row per channel; the map never shrinks).
(() => {
  const root = document.getElementById('pixel-skewer-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  const numbersOf = name => root.dataset[name].trim().split(/\s+/).map(Number);
  // The panel is the one in-repo mirror of the fixture: the chapter's shapes
  // (chapters/part2/09-modern-cnns-transfer.qmd, NINSmall's first block) and a declared
  // illustrative toy for the values the chapter never prints.
  const C_IN = Number(root.dataset.channels), N = Number(root.dataset.size);
  const C_OWN = Number(root.dataset.out);
  const [C_LOW, C_HIGH] = numbersOf('outRange'), [C_SQUEEZE, C_EXPAND] = numbersOf('outSweep');
  const PIXELS = numbersOf('pixels');
  const SPOTS = [{r: PIXELS[0], c: PIXELS[1]}, {r: PIXELS[2], c: PIXELS[3]}];
  const COLUMNS = [numbersOf('columnA'), numbersOf('columnB')];
  const WEIGHTS = numbersOf('weights'), BIAS = numbersOf('bias');
  const ROWS = BIAS.length;
  const weight = (o, c) => WEIGHTS[o * C_IN + c];
  // One row of W per output channel: y = ReLU(W x + b) on one pixel's column, which is
  // what nn.Linear(C_in, C_out) computes and what nn.Conv2d(C_in, C_out, 1) computes there.
  const Z = COLUMNS.map(x => Array.from({length: ROWS}, (_, o) => x.reduce((sum, v, c) => sum + weight(o, c) * v, BIAS[o])));
  const Y = Z.map(row => row.map(z => Math.max(0, z)));
  const X_TOP = Math.max(...COLUMNS.flat()), Y_TOP = Math.max(...Y.flat());
  const W_TOP = Math.max(...WEIGHTS.map(Math.abs), ...BIAS.map(Math.abs));
  const PIXEL_COUNT = N * N;
  const indexOf = spot => spot.r * N + spot.c;
  const K_A = indexOf(SPOTS[0]), K_B = indexOf(SPOTS[1]);
  const bill = c => C_IN * c + c;

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = svg.querySelector('[data-drawing]');
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const slider = $('[data-out-slider]'), readout = $('[data-out-readout]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration || beats.at(-1));
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);
  const STAGES = ['One pixel, one channel', 'Sixteen deep', 'Predict', 'One pixel, one layer',
    'Another pixel', 'Every pixel', 'Depth is a choice', 'One layer, every pixel'];
  const CAPTIONS = [
    'A 1 × 1 kernel reads one pixel. On a single channel it can only scale and shift it.',
    `But the map is ${C_IN} channels deep: under one pixel sits a column of ${C_IN} numbers.`,
    'Sixteen numbers in, sixteen out. How many weights does that take, and does each pixel get its own?',
    `Each output is one row of W: ${C_IN} weights and a bias, then ReLU. A linear layer.`,
    `Another pixel, a new column, the same W. All ${bill(C_OWN)} parameters are shared by every pixel.`,
    `The same W visits all ${PIXEL_COUNT} pixels. Height and width pass through untouched.`,
    `Output depth is the layer's one free choice: squeeze to ${C_SQUEEZE} channels, or expand to ${C_EXPAND}.`,
    'A 1 × 1 convolution is one linear layer across channels, run with the same weights at every pixel.'
  ];

  const num = value => String(Number(value.toFixed(4)));
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const ease = v => v * v * (3 - 2 * v);
  const seg = (f, a, b) => clamp01((f - a) / (b - a));
  const lerp = (a, b, u) => a + (b - a) * u;
  // Wide: the input stack, W, the output stack, left to right. Narrow: the two stacks side
  // by side on top, W under them, so every mark keeps its size on a phone.
  // The bill hangs under W and moves with its last row, so it always counts what is drawn.
  const MODES = {
    wide: {viewBox: [713, 370], font: 13, s: 5, d: [3, -2.1], bead: 3.6, input: [14, 100], output: [474, 100],
      W: [244, 62], h: 8, gap: 7, yGap: 9, xBase: 56, xUnit: 16, yUnit: 11.2, billX: null, billGap: 22, noteGap: 18, labels: [20, 37]},
    narrow: {viewBox: [296, 490], font: 12, s: 3, d: [2, -1.4], bead: 2.4, input: [14, 52], output: [144, 52],
      W: [40, 220], h: 7, gap: 5, yGap: 8, xBase: 214, xUnit: 14, yUnit: 10, billX: 148, billGap: 20, noteGap: 16, labels: [18, 34]}
  };

  let lastTime = 0, reduced = false, previousKey = '', captionKey = '', mode = 'wide', override = null;
  function measure() {
    mode = (figure.getBoundingClientRect().width || 600) < 600 ? 'narrow' : 'wide';
  }

  // The timeline's own output depth: the chapter's 16, squeezed then expanded in beat 6,
  // home again in beat 7. Whole channels only, so the stack visibly gains and loses slices.
  function depthAt(stage, f) {
    if (stage < 6) return C_OWN;
    if (stage === 6) {
      return f < 0.5 ? Math.round(lerp(C_OWN, C_SQUEEZE, ease(seg(f, 0, 0.12))))
        : Math.round(lerp(C_SQUEEZE, C_EXPAND, ease(seg(f, 0.5, 0.64))));
    }
    return Math.round(lerp(C_EXPAND, C_OWN, ease(seg(f, 0, 0.14))));
  }

  // Everything the picture shows at one moment, as data. `spot` is fractional while the
  // skewer glides; columns and outputs are drawn only where they are declared.
  function timeline(stage, f) {
    const C = depthAt(stage, f);
    const st = {stage, C, inDepth: C_IN, spot: SPOTS[0], beadsIn: null, xBars: null, xFlight: null,
      wAlpha: 0, scanRow: null, yRows: null, yFlight: null, beadsOut: null, outDepth: 0,
      writtenA: false, writtenB: false, sweep: 0, bill: false, note: false};
    const scan = (a, b) => {
      const s = seg(f, a, b) * C;
      if (s > 0 && s < C) st.scanRow = Math.floor(s);
      return Math.min(C, Math.floor(s + 0.5));
    };
    if (stage === 0) {
      st.inDepth = 1; st.beadsIn = {pixel: 0, count: 1};
    } else if (stage <= 2) {
      st.inDepth = stage === 1 ? 1 + (C_IN - 1) * ease(seg(f, 0, 0.35)) : C_IN;
      st.beadsIn = {pixel: 0, count: Math.floor(st.inDepth + 1e-9)};
      const u = stage === 1 ? ease(seg(f, 0.45, 0.85)) : 1;
      if (stage === 1 && f >= 0.45 && u < 1) st.xFlight = {pixel: 0, u};
      else if (u >= 1) st.xBars = {from: 0, to: 0, m: 0};
    } else if (stage === 3) {
      st.beadsIn = {pixel: 0, count: C_IN}; st.xBars = {from: 0, to: 0, m: 0};
      st.wAlpha = seg(f, 0, 0.08);
      const count = scan(0.1, 0.55);
      st.outDepth = C * ease(seg(f, 0.56, 0.66));
      const u = ease(seg(f, 0.68, 0.9));
      if (f < 0.68) st.yRows = {pixel: 0, count};
      else if (u < 1) st.yFlight = {pixel: 0, u};
      else { st.beadsOut = {pixel: 0}; st.writtenA = true; }
    } else if (stage === 4) {
      const glide = ease(seg(f, 0, 0.3));
      st.spot = {r: lerp(SPOTS[0].r, SPOTS[1].r, glide), c: lerp(SPOTS[0].c, SPOTS[1].c, glide)};
      if (glide === 0) { st.beadsIn = {pixel: 0, count: C_IN}; st.beadsOut = {pixel: 0}; }
      else if (glide === 1) st.beadsIn = {pixel: 1, count: C_IN};
      st.xBars = {from: 0, to: 1, m: ease(seg(f, 0.3, 0.45))};
      st.wAlpha = 1; st.outDepth = C; st.writtenA = true; st.bill = true;
      const count = scan(0.47, 0.64);
      const u = ease(seg(f, 0.66, 0.86));
      if (f >= 0.47 && f < 0.66) st.yRows = {pixel: 1, count};
      else if (f >= 0.66 && u < 1) st.yFlight = {pixel: 1, u};
      else if (u >= 1) { st.beadsOut = {pixel: 1}; st.writtenB = true; }
    } else if (stage === 5) {
      // The sweep starts where the skewer stands and visits every pixel in reading order,
      // wrapping once, so it ends where it began.
      const j = Math.floor(seg(f, 0.05, 0.85) * PIXEL_COUNT);
      const k = (K_B + j) % PIXEL_COUNT;
      st.spot = {r: Math.floor(k / N), c: k % N};
      Object.assign(st, {wAlpha: 1, outDepth: C, writtenA: true, writtenB: true, sweep: j, bill: true, note: f >= 0.85});
    } else {
      Object.assign(st, {spot: SPOTS[1], beadsIn: {pixel: 1, count: C_IN}, xBars: {from: 1, to: 1, m: 0},
        wAlpha: 1, yRows: {pixel: 1, count: C}, beadsOut: {pixel: 1}, outDepth: C,
        writtenA: true, writtenB: true, sweep: PIXEL_COUNT, bill: true, note: true});
    }
    return st;
  }

  // A dragged dial shows the finished picture at the dragged depth.
  const dialState = C => ({...timeline(beats.length - 1, 1), C, yRows: {pixel: 1, count: C}, outDepth: C});

  function written(st) {
    const cells = new Set();
    if (st.writtenA) cells.add(K_A);
    if (st.writtenB) cells.add(K_B);
    for (let j = 0; j < st.sweep; j++) cells.add((K_B + j) % PIXEL_COUNT);
    return cells;
  }

  function draw(st) {
    const g = MODES[mode], s = g.s, F = N * s, [dx, dy] = g.d, h = g.h, C = st.C;
    const [IX, IY] = g.input, [OX, OY] = g.output, [WX, WY] = g.W;
    const BX = WX + C_IN * h + g.gap, YB = BX + h + g.yGap;
    const parts = [];
    const pt = (x, y) => `${num(x)} ${num(y)}`;
    const text = (x, y, content, cls, anchor = 'middle', extra = '', size = g.font) =>
      parts.push(`<text x="${num(x)}" y="${num(y)}" class="${cls}" font-size="${size}" text-anchor="${anchor}"${extra}>${content}</text>`);
    const centre = (X, Y, spot) => [X + (spot.c + 0.5) * s, Y + (spot.r + 0.5) * s];
    const bead = (X, Y, spot, k) => { const [x, y] = centre(X, Y, spot); return [x + (k + 0.5) * dx, y + (k + 0.5) * dy]; };
    const square = (x, y, side) => ({x: x - side / 2, y: y - side / 2, w: side, h: side});
    const rectMarkup = (r, cls, extra = '') =>
      `<rect class="${cls}" x="${num(r.x)}" y="${num(r.y)}" width="${num(r.w)}" height="${num(r.h)}"${extra}></rect>`;
    const mix = (a, b, u) => ({x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), w: lerp(a.w, b.w, u), h: lerp(a.h, b.h, u)});

    // A stack of channels as a fixed-camera glass box: the front face is one channel's map,
    // one slice line per channel runs along the top and the side.
    const box = (X, Y, depth, cls, mark) => {
      const Dx = depth * dx, Dy = depth * dy, whole = Math.floor(depth + 1e-9);
      parts.push(`<path class="sk-hidden" d="M${pt(X + Dx, Y + Dy)}L${pt(X + Dx, Y + F + Dy)}L${pt(X + F + Dx, Y + F + Dy)}M${pt(X + Dx, Y + F + Dy)}L${pt(X, Y + F)}"></path>`);
      parts.push(`<path class="sk-face sk-top ${cls}" d="M${pt(X, Y)}L${pt(X + F, Y)}L${pt(X + F + Dx, Y + Dy)}L${pt(X + Dx, Y + Dy)}Z"></path>`);
      parts.push(`<path class="sk-face sk-side ${cls}" d="M${pt(X + F, Y)}L${pt(X + F + Dx, Y + Dy)}L${pt(X + F + Dx, Y + F + Dy)}L${pt(X + F, Y + F)}Z"></path>`);
      // The front face is one channel's map: a faint grid of its N x N pixels.
      let grid = '';
      for (let k = 1; k < N; k++) grid += `M${pt(X + k * s, Y)}V${num(Y + F)}M${pt(X, Y + k * s)}H${num(X + F)}`;
      parts.push(`<path class="sk-pixel-grid ${cls}" d="${grid}"></path>`);
      let slices = '';
      for (let k = 1; k < whole; k++) slices += `M${pt(X + k * dx, Y + k * dy)}L${pt(X + F + k * dx, Y + k * dy)}L${pt(X + F + k * dx, Y + F + k * dy)}`;
      if (slices) parts.push(`<path class="sk-slice" d="${slices}"></path>`);
      parts.push(`<rect class="sk-face sk-front ${cls}" data-mark="${mark}" data-depth="${num(depth)}" x="${num(X)}" y="${num(Y)}" width="${num(F)}" height="${num(F)}"></rect>`);
    };
    const skewer = (X, Y, depth, mark) => {
      const [x, y] = centre(X, Y, st.spot);
      parts.push(`<path class="sk-skewer" data-mark="${mark}" d="M${pt(x - 1.5 * dx, y - 1.5 * dy)}L${pt(x + (depth + 1.5) * dx, y + (depth + 1.5) * dy)}"></path>`);
      parts.push(rectMarkup({x: X + st.spot.c * s - 1.2, y: Y + st.spot.r * s - 1.2, w: s + 2.4, h: s + 2.4}, 'sk-pixel', ` data-mark="${mark}-pixel"`));
    };
    const beads = (X, Y, spot, values, count, top, cls, mark) => {
      for (let k = 0; k < count; k++) {
        const [x, y] = bead(X, Y, spot, k), v = values[k];
        const fill = v > 0 ? ` fill-opacity="${num(0.3 + 0.7 * v / top)}"` : '';
        parts.push(rectMarkup(square(x, y, g.bead), `${cls}${v > 0 ? '' : ' is-zero'}`, ` data-mark="${mark}-${k}"${fill}`));
      }
    };

    // Where a column value sits once laid flat over W, and where an output sits beside it.
    const xRect = (c, v) => (v > 0 ? {x: WX + c * h + 1, y: g.xBase - v * g.xUnit, w: h - 2, h: v * g.xUnit}
      : square(WX + (c + 0.5) * h, g.xBase - 2.5, 4));
    const yRect = (o, v) => (v > 0 ? {x: YB, y: WY + o * h + 1, w: v * g.yUnit, h: h - 2}
      : square(YB + 3, WY + (o + 0.5) * h, 4));

    // 1. The input stack and its skewer.
    box(IX, IY, st.inDepth, 'sk-in-box', 'input-box');
    skewer(IX, IY, st.inDepth, 'skewer-in');
    if (st.beadsIn) beads(IX, IY, SPOTS[st.beadsIn.pixel], COLUMNS[st.beadsIn.pixel], st.beadsIn.count, X_TOP, 'sk-bead-in', 'bead-in');

    // 2. The output stack, or where it will stand, with the pixels written so far.
    if (st.outDepth > 0) {
      box(OX, OY, st.outDepth, 'sk-out-box', 'output-box');
      const cells = written(st);
      if (cells.size === PIXEL_COUNT) parts.push(rectMarkup({x: OX, y: OY, w: F, h: F}, 'sk-written', ` data-mark="written" data-count="${cells.size}"`));
      else if (cells.size) {
        let d = '';
        for (const k of [...cells].sort((a, b) => a - b)) d += `M${pt(OX + (k % N) * s, OY + Math.floor(k / N) * s)}h${num(s)}v${num(s)}h${num(-s)}z`;
        parts.push(`<path class="sk-written" data-mark="written" data-count="${cells.size}" d="${d}"></path>`);
      }
      skewer(OX, OY, st.outDepth, 'skewer-out');
      if (st.beadsOut) beads(OX, OY, SPOTS[st.beadsOut.pixel], Y[st.beadsOut.pixel], C, Y_TOP, 'sk-bead-out', 'bead-out');
    } else {
      parts.push(rectMarkup({x: OX, y: OY, w: F, h: F}, 'sk-pending', ' data-mark="output-pending"'));
    }

    // 3. The weights: one row per output channel, one column per input channel, and the
    // biases beside them. Area is size; filled is positive, hollow negative.
    if (st.wAlpha > 0) {
      let grid = '', positive = '', negative = '';
      for (let c = 1; c < C_IN; c++) grid += `M${pt(WX + c * h, WY)}V${num(WY + C * h)}`;
      for (let o = 1; o < C; o++) grid += `M${pt(WX, WY + o * h)}H${num(WX + C_IN * h)}M${pt(BX, WY + o * h)}H${num(BX + h)}`;
      const mark = (x, y, v) => {
        if (v === 0) return;
        const side = (h - 2) * Math.sqrt(Math.abs(v) / W_TOP);
        const d = `M${pt(x - side / 2, y - side / 2)}h${num(side)}v${num(side)}h${num(-side)}z`;
        if (v > 0) positive += d; else negative += d;
      };
      for (let o = 0; o < C; o++) {
        for (let c = 0; c < C_IN; c++) mark(WX + (c + 0.5) * h, WY + (o + 0.5) * h, weight(o, c));
        mark(BX + h / 2, WY + (o + 0.5) * h, BIAS[o]);
      }
      const opacity = st.wAlpha < 1 ? ` opacity="${num(st.wAlpha)}"` : '';
      parts.push(`<g data-mark="weights" data-rows="${C}"${opacity}>`
        + rectMarkup({x: WX, y: WY, w: C_IN * h, h: C * h}, 'sk-matrix', ' data-mark="w-frame"')
        + rectMarkup({x: BX, y: WY, w: h, h: C * h}, 'sk-matrix', ' data-mark="b-frame"')
        + (grid ? `<path class="sk-grid" d="${grid}"></path>` : '')
        + (positive ? `<path class="sk-weight" d="${positive}"></path>` : '')
        + (negative ? `<path class="sk-weight is-negative" d="${negative}"></path>` : '') + '</g>');
      text(WX - 6, WY + h + 3, 'W', 'sk-symbol sk-parameter-text', 'end', ` data-mark="w-label"${opacity}`);
      text(BX + h / 2, WY - 5, 'b', 'sk-symbol sk-parameter-text', 'middle', opacity);
    }
    if (st.stage >= 3) text(YB + 4, WY - 5, 'y', 'sk-symbol sk-prediction-text', 'start');
    if (st.scanRow !== null) parts.push(rectMarkup({x: WX - 1.5, y: WY + st.scanRow * h - 1, w: BX + h - WX + 3, h: h + 2}, 'sk-scan', ` data-mark="scan" data-row="${st.scanRow}"`));

    // 4. The column laid flat over W: one bar per input channel.
    if (st.xBars || st.xFlight) text(WX - 6, g.xBase - 6, 'x', 'sk-symbol sk-feature-text', 'end');
    if (st.xBars) {
      const {from, to, m} = st.xBars;
      for (let c = 0; c < C_IN; c++) {
        const v = lerp(COLUMNS[from][c], COLUMNS[to][c], m);
        if (v > 1e-9) parts.push(rectMarkup(xRect(c, v), 'sk-x-bar', ` data-bar="x-${c}" data-length="${num(v)}"`));
        else parts.push(`<circle class="sk-zero sk-feature-zero" data-bar="x-${c}" data-length="0" cx="${num(WX + (c + 0.5) * h)}" cy="${num(g.xBase - 2.5)}" r="2"></circle>`);
      }
    }
    if (st.xFlight) {
      const {pixel, u} = st.xFlight;
      for (let c = 0; c < C_IN; c++) {
        const v = COLUMNS[pixel][c], [x, y] = bead(IX, IY, SPOTS[pixel], c);
        parts.push(rectMarkup(mix(square(x, y, g.bead), xRect(c, v), u), `sk-x-bar${v > 0 ? '' : ' is-zero'}`, ` data-flight="x-${c}"`));
      }
    }

    // 5. The outputs beside W, one bar per row, or flying into the output stack.
    if (st.yRows) {
      const values = Y[st.yRows.pixel];
      for (let o = 0; o < st.yRows.count; o++) {
        if (values[o] > 0) parts.push(rectMarkup(yRect(o, values[o]), 'sk-y-bar', ` data-bar="y-${o}" data-length="${num(values[o])}"`));
        else parts.push(`<circle class="sk-zero sk-prediction-zero" data-bar="y-${o}" data-length="0" cx="${num(YB + 3)}" cy="${num(WY + (o + 0.5) * h)}" r="2.2"></circle>`);
      }
    }
    if (st.yFlight) {
      const {pixel, u} = st.yFlight, values = Y[pixel];
      for (let o = 0; o < C; o++) {
        const [x, y] = bead(OX, OY, SPOTS[pixel], o);
        parts.push(rectMarkup(mix(yRect(o, values[o]), square(x, y, g.bead), u), `sk-y-bar${values[o] > 0 ? '' : ' is-zero'}`, ` data-flight="y-${o}"`));
      }
    }

    // 6. The ledgers under the stacks and the bill over W.
    const below = [IY + F + g.labels[0], IY + F + g.labels[1]];
    text(IX, below[0], 'input', 'sk-scenery', 'start', '', g.font - 1);
    text(IX, below[1], `${Math.round(st.inDepth)} × ${N} × ${N}`, 'sk-ink sk-number', 'start', ' data-value="in-shape"', g.font - 1);
    text(OX, below[0], 'output', 'sk-scenery', 'start', '', g.font - 1);
    if (st.outDepth > 0) text(OX, below[1], `${C} × ${N} × ${N}`, 'sk-ink sk-number', 'start', ' data-value="out-shape"', g.font - 1);
    const billX = g.billX === null ? WX + (C_IN * h + g.gap + h) / 2 : g.billX, billY = WY + C * h + g.billGap;
    if (st.bill) text(billX, billY, `${C_IN} × ${C} + ${C} = ${bill(C)} parameters`, 'sk-parameter-text sk-number', 'middle', ' data-value="bill"');
    if (st.note) text(billX, billY + g.noteGap, `the same W at all ${PIXEL_COUNT} pixels`, 'sk-scenery', 'middle', ' data-value="pixels"', g.font - 1);
    return parts.join('');
  }

  // The picture's accessible description: what is drawn now, and never the count before
  // the weights appear.
  function describe(st, dragged) {
    const C = st.C;
    if (dragged || st.stage >= 6) {
      return `The output has ${C} channels of ${N} by ${N}. The weights have ${C} rows of ${C_IN}, `
        + `${bill(C)} parameters in all, the same at every pixel.`;
    }
    return [
      `One channel of a ${N} by ${N} map, with a 1 by 1 kernel on one pixel.`,
      `The map is ${C_IN} channels deep. The pixel's column of ${C_IN} values is lifted out and laid flat.`,
      `The pixel's column of ${C_IN} values lies flat. No weights are drawn yet.`,
      `A grid of weights, ${C} rows of ${C_IN}, and ${C} biases turn the column into ${C} outputs; ReLU sets the negative ones to zero. They are written into the output at the same pixel.`,
      `At another pixel a different column passes through the same weights, ${bill(C)} parameters in all, and is written at that pixel.`,
      `The same weights visit all ${PIXEL_COUNT} pixels; the output is ${C} by ${N} by ${N}.`
    ][st.stage];
  }

  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const clamped = Math.max(0, Math.min(duration, time));
    const stage = stageAt(clamped);
    const end = beats[stage + 1] === undefined ? duration : beats[stage + 1];
    const held = reducedMotion ? end - 1e-6 : clamped;
    const span = end - beats[stage];
    const f = span > 0 ? clamp01((held - beats[stage]) / span) : 1;
    const dragged = override !== null;
    const st = dragged ? dialState(override) : timeline(stage, f);

    root.dataset.stage = String(stage);
    root.dataset.out = String(C_OWN);
    root.dataset.depth = String(st.C);
    root.dataset.override = dragged ? 'dial' : '';
    root.dataset.spot = `${num(st.spot.r)} ${num(st.spot.c)}`;
    root.dataset.written = String(written(st).size);

    const stateKey = [mode, JSON.stringify(st, (key, value) => (typeof value === 'number' ? Number(value.toFixed(4)) : value))].join('/');
    if (stateKey !== previousKey) {
      previousKey = stateKey;
      const [width, height] = MODES[mode].viewBox;
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      drawing.innerHTML = draw(st);
      const lit = dragged ? 6 : stage;
      formula.classList.toggle('sk-in-lit', lit === 1 || lit === 2);
      formula.classList.toggle('sk-w-lit', lit === 3);
      formula.classList.toggle('sk-ij-lit', lit === 4 || lit === 5);
      formula.classList.toggle('sk-shape-lit', lit >= 6);
    }
    const picture = describe(st, dragged);
    if (svg.getAttribute('aria-label') !== picture) svg.setAttribute('aria-label', picture);

    // The dial: the thumb, the readout and the one place its live values are spoken.
    slider.value = String(st.C);
    if (readout.textContent !== String(st.C)) readout.textContent = String(st.C);
    const change = st.C < C_IN ? `squeezes ${C_IN} channels to ${st.C}` : st.C > C_IN ? `expands ${C_IN} channels to ${st.C}` : `mixes ${C_IN} channels into ${st.C}`;
    slider.setAttribute('aria-valuetext', `${st.C} output channels. ` + (dragged || st.bill
      ? `The layer ${change} at every pixel, with ${bill(st.C)} parameters; height and width stay ${N} by ${N}.` : ''));

    const sentence = dragged
      ? `${override} output channels: every pixel's ${C_IN} numbers become ${override}, for ${bill(override)} parameters in all.`
      : CAPTIONS[stage];
    if (captionKey !== sentence) { captionKey = sentence; caption.textContent = sentence; }
    return `${STAGES[stage]}.`;
  }

  // The dial is a detour, not a new default. Dragging pauses playback and redraws the
  // finished picture at the dragged depth; any timeline action -- play from a pause, a
  // scrub, an arrow-key beat -- returns to the timeline's own depth.
  function drag() {
    const requested = Math.max(C_LOW, Math.min(C_HIGH, Math.round(Number(slider.value))));
    if (root.dataset.playing === 'true') $('[data-action="play"]').click();
    override = requested;
    render(lastTime, reduced);
  }
  slider.addEventListener('input', drag);
  slider.addEventListener('change', drag);
  pane.addEventListener('click', event => {
    if (event.target.closest('[data-action="play"]') && root.dataset.playing !== 'true') override = null;
  }, true);
  // The same guard the transport applies (shared/playback.js): a key it ignores must leave
  // the dragged depth alone.
  pane.addEventListener('keydown', event => {
    if (event.target !== pane || event.altKey || event.ctrlKey || event.metaKey) return;
    const toggles = [' ', 'k', 'K'].includes(event.key);
    if (toggles && (event.repeat || root.dataset.playing === 'true')) return;
    if (toggles || ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) override = null;
  }, true);

  function typeset() {
    const done = () => { root.dataset.typeset = root.querySelector('mjx-container') ? 'mathjax' : 'none'; };
    const mathjax = window.MathJax;
    if (mathjax && typeof mathjax.typesetPromise === 'function' && !root.querySelector('mjx-container')) {
      mathjax.typesetPromise([root]).then(done, done);
    } else done();
  }

  // The dial's range is declared with the fixture. While the player runs the slider's own
  // value text speaks the depth, so the visible readout leaves the accessibility tree.
  slider.min = String(C_LOW); slider.max = String(C_HIGH);
  $('[data-out-display]').setAttribute('aria-hidden', 'true');
  // Bound before the transport mounts, so it runs before the transport's own seek: the
  // scrubber is the timeline, and a scrub ends a detour.
  $('[data-controls] input[type="range"]').addEventListener('input', () => { override = null; });
  measure();
  window.BookPlayback(root, render, () => { measure(); previousKey = ''; render(lastTime, reduced); });
  typeset();
})();
