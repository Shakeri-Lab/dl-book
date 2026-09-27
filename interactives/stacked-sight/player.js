// Two stacked 3 x 3 convolutions see what one 5 x 5 sees, for fewer weights.
//
// Contract with interactives/shared/playback.js:
//   window.BookPlayback(root, render, layout?)
//   render(time, reduced) -> the scrubber's description; never measures the DOM.
//   layout() -> the only place that measures.
//
// One picture, two rows: input, hidden map and output for the stacked pair; input and
// output for the single kernel. The tracked object is the receptive field of one output
// pixel. Traced back through the stack it is a 3 x 3 window on the hidden map, and then
// the union of that window's nine pixels' own 3 x 3 windows on the input, which the motion
// sweeps out one window at a time until it is 5 x 5; the single 5 x 5 kernel lands on the
// same patch in one step. Then the kernels are counted square by square: 9 + 9 against 25.
(() => {
  const root = document.getElementById('stacked-sight-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  // The panel is the one in-repo mirror of the kernel-economics cell.
  const K = Number(root.dataset.small), L = Number(root.dataset.large), C = Number(root.dataset.channels);
  const CROP = Number(root.dataset.crop), MID = (CROP - 1) / 2, H = (K - 1) / 2;
  const FIELD = K + (K - 1);
  const PAIR_STACK = 2 * K * K, PAIR_ONE = L * L;
  const TOTAL_STACK = 2 * (K * K * C * C + C), TOTAL_ONE = L * L * C * C + C;
  const SAVING = Math.round(100 * (1 - PAIR_STACK / PAIR_ONE));
  const fmt = n => n.toLocaleString('en-US');

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = svg.querySelector('[data-drawing]');
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration || beats.at(-1));
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);
  const STAGES = ['Ask', 'Hidden window', 'Back to the input', 'One kernel', 'Predict', 'Count', 'At 32 channels', 'Same sight'];
  const CAPTIONS = [
    `Two ${K} × ${K} convolutions, stacked. How much of the input can this one output pixel see?`,
    `The second convolution reads a ${K} × ${K} window of the hidden map around it.`,
    `Each of those nine hidden pixels read its own ${K} × ${K} of the input. Together: ${FIELD} × ${FIELD}.`,
    `One ${L} × ${L} kernel reads exactly the same ${L} × ${L} patch in a single step. Same sight.`,
    `Per pair of channels: two ${K} × ${K} kernels, or one ${L} × ${L}. Which holds fewer weights?`,
    `Count the squares: ${K * K} + ${K * K} = ${PAIR_STACK} against ${PAIR_ONE}.`,
    `At ${C} channels in and out: ${fmt(TOTAL_STACK)} parameters against ${fmt(TOTAL_ONE)}, the counts the cell prints.`,
    'Same sight, fewer parameters, more nonlinearity.'
  ];

  const num = value => String(Number(value.toFixed(4)));
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const ease = v => v * v * (3 - 2 * v);
  const seg = (f, a, b) => clamp01((f - a) / (b - a));
  const MODES = {
    wide: {viewBox: [713, 360], font: 12, small: 11, cell: 13, q: 10,
      rows: [{title: [16, 28], y: 40, maps: [16, 200, 384], labelY: 147, bills: [500, 70, 90, 110]},
        {title: [16, 188], y: 200, maps: [16, 384], labelY: 307, bills: [500, 230, 250, 270]}],
      saving: [356, 345]},
    narrow: {viewBox: [296, 364], font: 11, small: 10, cell: 9, q: 7,
      rows: [{title: [10, 16], y: 26, maps: [10, 116, 222], labelY: 102, bills: [10, 122, 136, 150]},
        {title: [10, 180], y: 190, maps: [10, 222], labelY: 266, bills: [10, 286, 300, 314]}],
      saving: [148, 346]}
  };
  let lastTime = 0, reduced = false, previousKey = '', captionKey = '', mode = 'wide';
  function measure() { mode = (figure.getBoundingClientRect().width || 600) < 600 ? 'narrow' : 'wide'; }

  // The hidden pixels the output reads, in reading order.
  const HIDDEN = [];
  for (let r = MID - H; r <= MID + H; r++) for (let c = MID - H; c <= MID + H; c++) HIDDEN.push([r, c]);

  function timeline(stage, f) {
    const st = {stage, hidden: stage >= 1, swept: 0, probe: null, fieldStack: false, row2: stage >= 3,
      fieldOne: false, counted: 0, pairs: false, totals: false, relu: false};
    if (stage === 2) {
      const k = Math.min(HIDDEN.length, Math.floor(seg(f, 0.05, 0.8) * HIDDEN.length) + (f >= 0.05 ? 1 : 0));
      st.swept = k;
      if (f >= 0.05 && f < 0.8) st.probe = k - 1;
      st.fieldStack = f >= 0.8;
    } else if (stage > 2) { st.swept = HIDDEN.length; st.fieldStack = true; }
    if (stage === 3) st.fieldOne = f >= 0.3;
    if (stage > 3) st.fieldOne = true;
    if (stage === 5) { st.counted = Math.floor(seg(f, 0.05, 0.7) * PAIR_ONE); st.pairs = f >= 0.7; }
    if (stage > 5) { st.counted = PAIR_ONE; st.pairs = true; st.totals = true; }
    if (stage === 7) st.relu = true;
    return st;
  }

  function draw(st) {
    const m = MODES[mode], s = m.cell, G = CROP * s, parts = [];
    const text = (x, y, content, cls, anchor = 'start', extra = '', size = m.font) =>
      parts.push(`<text x="${num(x)}" y="${num(y)}" class="${cls}" font-size="${size}" text-anchor="${anchor}"${extra}>${content}</text>`);
    const rect = (x, y, w, h, cls, extra = '') =>
      parts.push(`<rect class="${cls}" x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}"${extra}></rect>`);
    const grid = (x, y, cls, mark) => {
      rect(x, y, G, G, cls, ` data-mark="${mark}"`);
      let d = '';
      for (let k = 0; k <= CROP; k++) d += `M${num(x + k * s)} ${num(y)}V${num(y + G)}M${num(x)} ${num(y + k * s)}H${num(x + G)}`;
      parts.push(`<path class="sgt-cell" fill="none" d="${d}"></path>`);
    };
    const cells = (x, y, list, cls, mark) => {
      if (!list.length) return;
      const d = list.map(([r, c]) => `M${num(x + c * s)} ${num(y + r * s)}h${num(s)}v${num(s)}h${num(-s)}z`).join('');
      parts.push(`<path class="${cls}" data-mark="${mark}" data-count="${list.length}" d="${d}"></path>`);
    };
    const square = (x, y, r0, c0, n, cls, mark) => rect(x + c0 * s, y + r0 * s, n * s, n * s, cls, ` data-mark="${mark}" data-size="${n}"`);
    const kernel = (cx, cy, n, first, mark) => {
      const q = m.q, x0 = cx - n * q / 2, y0 = cy - n * q / 2;
      for (let i = 0; i < n * n; i++) {
        const counted = first + i < st.counted;
        rect(x0 + (i % n) * q + 1, y0 + Math.floor(i / n) * q + 1, q - 2, q - 2, `sgt-weight${counted ? ' is-counted' : ''}`, i === 0 ? ` data-mark="${mark}"` : '');
      }
      text(cx, cy + n * q / 2 + 13, `${n} × ${n}`, 'sgt-scenery', 'middle', '', m.small);
    };
    const arrow = (x0, x1, y, kernelSize, first, mark) => {
      const half = kernelSize * m.q / 2 + 4, mid = (x0 + x1) / 2;
      parts.push(`<path class="sgt-arrow" d="M${num(x0)} ${num(y)}H${num(mid - half)}M${num(mid + half)} ${num(y)}H${num(x1 - 5)}"></path>`);
      parts.push(`<path class="sgt-head" d="M${num(x1)} ${num(y)}l-6 -3.5v7z"></path>`);
      kernel(mid, y, kernelSize, first, mark);
    };

    // Row 1: the stacked pair.
    const r1 = m.rows[0], [ix, hx, ox] = r1.maps, y1 = r1.y, cy1 = y1 + G / 2;
    text(r1.title[0], r1.title[1], `two ${K} × ${K} convolutions`, 'sgt-title', 'start', '', m.font);
    grid(ix, y1, 'sgt-input-map', 'input-1'); grid(hx, y1, 'sgt-hidden-map', 'hidden'); grid(ox, y1, 'sgt-output-map', 'output-1');
    arrow(ix + G + 6, hx - 6, cy1, K, 0, 'kernel-a');
    arrow(hx + G + 6, ox - 6, cy1, K, K * K, 'kernel-b');
    cells(ox, y1, [[MID, MID]], 'sgt-target', 'target-1');
    if (st.hidden) {
      cells(hx, y1, HIDDEN, 'sgt-hidden-seen', 'hidden-seen');
      square(hx, y1, MID - H, MID - H, K, 'sgt-window', 'hidden-window');
      parts.push(`<path class="sgt-link" d="M${num(ox + MID * s)} ${num(y1 + MID * s)}L${num(hx + (MID + H + 1) * s)} ${num(y1 + (MID - H) * s)}M${num(ox + MID * s)} ${num(y1 + (MID + 1) * s)}L${num(hx + (MID + H + 1) * s)} ${num(y1 + (MID + H + 1) * s)}"></path>`);
    }
    // Back to the input: the union of the visited hidden pixels' own windows.
    const seen = new Map();
    HIDDEN.slice(0, st.swept).forEach(([r, c]) => {
      for (let a = r - H; a <= r + H; a++) for (let b = c - H; b <= c + H; b++) seen.set(`${a},${b}`, [a, b]);
    });
    cells(ix, y1, [...seen.values()], 'sgt-seen', 'seen-1');
    if (st.probe !== null) {
      const [r, c] = HIDDEN[st.probe];
      square(hx, y1, r, c, 1, 'sgt-window', 'probe-hidden');
      square(ix, y1, r - H, c - H, K, 'sgt-probe', 'probe-input');
    }
    if (st.fieldStack) square(ix, y1, MID - (FIELD - 1) / 2, MID - (FIELD - 1) / 2, FIELD, 'sgt-window', 'field-1');
    text(ix, r1.labelY, st.fieldStack ? `input, ${FIELD} × ${FIELD} seen` : 'input', st.fieldStack ? 'sgt-feature-text sgt-number' : 'sgt-scenery', 'start',
      st.fieldStack ? ' data-value="field-stack"' : '', m.small);
    text(hx + G / 2, r1.labelY, 'hidden map', 'sgt-scenery', 'middle', '', m.small);
    text(ox + G / 2, r1.labelY, 'output', 'sgt-scenery', 'middle', '', m.small);

    // Row 2: one kernel of the same reach.
    if (st.row2) {
      const r2 = m.rows[1], [jx, px] = r2.maps, y2 = r2.y, cy2 = y2 + G / 2;
      text(r2.title[0], r2.title[1], `one ${L} × ${L} convolution`, 'sgt-title', 'start', '', m.font);
      grid(jx, y2, 'sgt-input-map', 'input-2'); grid(px, y2, 'sgt-output-map', 'output-2');
      arrow(jx + G + 6, px - 6, cy2, L, 0, 'kernel-c');
      cells(px, y2, [[MID, MID]], 'sgt-target', 'target-2');
      if (st.fieldOne) {
        const list = [];
        for (let a = MID - (L - 1) / 2; a <= MID + (L - 1) / 2; a++) for (let b = MID - (L - 1) / 2; b <= MID + (L - 1) / 2; b++) list.push([a, b]);
        cells(jx, y2, list, 'sgt-seen', 'seen-2');
        square(jx, y2, MID - (L - 1) / 2, MID - (L - 1) / 2, L, 'sgt-window', 'field-2');
      }
      text(jx, r2.labelY, st.fieldOne ? `input, ${L} × ${L} seen` : 'input', st.fieldOne ? 'sgt-feature-text sgt-number' : 'sgt-scenery', 'start',
        st.fieldOne ? ' data-value="field-one"' : '', m.small);
      text(px + G / 2, r2.labelY, 'output', 'sgt-scenery', 'middle', '', m.small);
      // The bills, each beside its own row.
      const bill = (row, lines) => lines.forEach(([content, cls, name], i) => content && text(row.bills[0], row.bills[1 + i], content, cls, 'start', ` data-value="${name}"`, m.small));
      bill(r1, [[st.pairs && `${K * K} + ${K * K} = ${PAIR_STACK} per channel pair`, 'sgt-parameter-text sgt-number', 'pair-stack'],
        [st.totals && `C = ${C}: ${fmt(TOTAL_STACK)} parameters`, 'sgt-parameter-text', 'total-stack'],
        [st.relu && '2 ReLUs', 'sgt-scenery', 'relu-stack']]);
      bill(r2, [[st.pairs && `${PAIR_ONE} per channel pair`, 'sgt-parameter-text sgt-number', 'pair-one'],
        [st.totals && `C = ${C}: ${fmt(TOTAL_ONE)} parameters`, 'sgt-parameter-text', 'total-one'],
        [st.relu && '1 ReLU', 'sgt-scenery', 'relu-one']]);
      if (st.totals) text(m.saving[0], m.saving[1], `${PAIR_STACK} C² versus ${PAIR_ONE} C²: ${SAVING}% fewer weights`, 'sgt-number', 'middle', ' data-value="saving"', m.small);
    }
    return parts.join('');
  }

  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const clamped = Math.max(0, Math.min(duration, time));
    const stage = stageAt(clamped);
    const end = beats[stage + 1] === undefined ? duration : beats[stage + 1];
    const held = reducedMotion ? end - 1e-6 : clamped;
    const f = clamp01((held - beats[stage]) / (end - beats[stage]));
    const st = timeline(stage, f);
    root.dataset.stage = String(stage);
    root.dataset.swept = String(st.swept);
    root.dataset.counted = String(st.counted);
    const key = [mode, JSON.stringify(st)].join('/');
    if (key !== previousKey) {
      previousKey = key;
      svg.setAttribute('viewBox', `0 0 ${MODES[mode].viewBox.join(' ')}`);
      drawing.innerHTML = draw(st);
      formula.classList.toggle('sgt-field-lit', stage >= 1 && stage <= 3);
      formula.classList.toggle('sgt-bill-lit', stage >= 5);
    }
    const parts = [`Two stacked ${K} by ${K} convolutions and one output pixel`];
    if (st.fieldStack) parts.push(`it sees ${FIELD} by ${FIELD} of the input`);
    if (st.row2) parts.push(`one ${L} by ${L} convolution${st.fieldOne ? ` sees the same ${L} by ${L}` : ''}`);
    if (st.pairs) parts.push(`${PAIR_STACK} weights per channel pair against ${PAIR_ONE}`);
    if (st.totals) parts.push(`${fmt(TOTAL_STACK)} parameters against ${fmt(TOTAL_ONE)} at ${C} channels`);
    const label = `${parts.join('; ')}.`;
    if (svg.getAttribute('aria-label') !== label) svg.setAttribute('aria-label', label);
    const sentence = CAPTIONS[stage];
    if (captionKey !== sentence) { captionKey = sentence; caption.textContent = sentence; }
    return `${STAGES[stage]}.`;
  }

  function typeset() {
    const done = () => { root.dataset.typeset = root.querySelector('mjx-container') ? 'mathjax' : 'none'; };
    const mathjax = window.MathJax;
    if (mathjax && typeof mathjax.typesetPromise === 'function' && !root.querySelector('mjx-container')) {
      mathjax.typesetPromise([root]).then(done, done);
    } else done();
  }

  measure();
  window.BookPlayback(root, render, () => { measure(); previousKey = ''; render(lastTime, reduced); });
  typeset();
})();
