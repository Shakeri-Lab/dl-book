// LeNet's tensor, one layer at a time: convolve, shrink, deepen; repeat; then decide.
//
// Contract with interactives/shared/playback.js:
//   window.BookPlayback(root, render, layout?)
//   render(time, reduced) -> the scrubber's description; never measures the DOM.
//   layout() -> the only place that measures.
//
// One picture: the pipeline of tensors LeNet's forward pass makes, each drawn as a glass
// box whose face is its height and width and whose depth is its channels, then the dense
// head as bars in proportion to their length. The tracked object is the newest tensor: it
// grows out of the one before it at every layer, so the reader sees which layer changed
// the depth (a convolution: one map per kernel) and which changed the size (a pool, or a
// window with no padding: the output-size formula). Two stills show the first and last
// shapes and lose where the 28 went.
(() => {
  const root = document.getElementById('lenet-flow-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  const numbersOf = name => root.dataset[name].trim().split(/\s+/).map(Number);
  // The panel is the one in-repo mirror of the lenet cell (chapters/part2/08-cnn.qmd).
  const [C0, N0] = numbersOf('input'), CV = numbersOf('convs'), POOL = Number(root.dataset.pool);
  const HEAD = numbersOf('head');
  const outSize = (n, k, p, s) => Math.floor((n + 2 * p - k) / s) + 1;
  // The tensors, in order, and the operation that made each one.
  const T = [{kind: 'box', c: C0, n: N0}];
  const OPS = [null];
  const conv = (c, k, p) => {
    const prev = T.at(-1), n = outSize(prev.n, k, p, 1);
    OPS.push({name: 'conv', k, p, s: 1, from: prev.n, kernels: c, kernelDepth: prev.c});
    T.push({kind: 'box', c, n});
  };
  const pool = () => {
    const prev = T.at(-1);
    OPS.push({name: 'pool', k: POOL, p: 0, s: POOL, from: prev.n});
    T.push({kind: 'box', c: prev.c, n: outSize(prev.n, POOL, 0, POOL)});
  };
  conv(CV[0], CV[1], CV[2]); pool(); conv(CV[3], CV[4], CV[5]); pool();
  const flat = T.at(-1).c * T.at(-1).n * T.at(-1).n;
  OPS.push({name: 'flatten'}); T.push({kind: 'bar', len: flat});
  HEAD.forEach((len, i) => { OPS.push({name: 'fc', index: i + 1, from: T.at(-1).len, relu: i < HEAD.length - 1}); T.push({kind: 'bar', len}); });
  const LAST_BOX = T.findLastIndex(t => t.kind === 'box');
  const shape = t => (t.kind === 'box' ? `${t.c} × ${t.n} × ${t.n}` : String(t.len));
  const sizes = T.filter(t => t.kind === 'box');

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = svg.querySelector('[data-drawing]');
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration || beats.at(-1));
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);
  const STAGES = ['Ask', 'conv1', 'Pool', 'Predict', 'conv2', 'Pool again', 'Decide', 'The rhythm'];
  const CAPTIONS = [
    `A ${N0} × ${N0} image goes in; ${HEAD.at(-1)} votes come out. Follow the tensor's shape through every layer.`,
    `conv1: ${T[1].c} kernels, ${OPS[1].k} × ${OPS[1].k}, padding ${OPS[1].p}. ${T[1].c} maps, still ${T[1].n} × ${T[1].n}: deeper, not smaller.`,
    `Max pool, ${POOL} × ${POOL}, stride ${POOL}: each of the ${T[2].c} maps halves to ${T[2].n} × ${T[2].n}.`,
    `conv2: ${T[3].c} kernels, ${OPS[3].k} × ${OPS[3].k}, no padding, on ${T[2].n} × ${T[2].n} maps. What size comes out?`,
    `${T[3].n} × ${T[3].n}: without padding the ${OPS[3].k}-wide window loses ${OPS[3].k - 1}. ${T[3].c} kernels make ${T[3].c} maps.`,
    `Pool again: ${shape(T[4])}. Size fell from ${N0} to ${T[4].n}; depth grew from ${C0} to ${T[4].c}.`,
    `Flatten the ${shape(T[4])} summary into ${flat} numbers; three dense layers narrow them to ${HEAD.at(-1)} votes.`,
    'Convolve, shrink, deepen; repeat; then decide.'
  ];

  const num = value => String(Number(value.toFixed(4)));
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const ease = v => v * v * (3 - 2 * v);
  const seg = (f, a, b) => clamp01((f - a) / (b - a));
  const lerp = (a, b, u) => a + (b - a) * u;
  // Wide: the backbone on one row, the head under it. Narrow: two backbone rows, then the
  // head. Items are placed by the left edge of their face (or bar) and their row centre.
  const MODES = {
    wide: {viewBox: [713, 404], font: 12, small: 11, sc: 3, d: [2.2, -1.5], barScale: 0.25, barW: 14,
      at: [[16, 150], [190, 150], [365, 150], [495, 150], [640, 150], [110, 330], [280, 330], [430, 330], [580, 330]],
      shapeY: [212, 212, 212, 212, 212, 396, 396, 396, 396], bends: {5: 274}, line: [356, 240], summary: [356, 232, 250]},
    narrow: {viewBox: [296, 430], font: 11, small: 10, sc: 2, d: [1.6, -1.1], barScale: 0.2, barW: 10,
      at: [[24, 70], [150, 70], [20, 200], [118, 200], [222, 200], [30, 350], [100, 350], [170, 350], [230, 350]],
      shapeY: [116, 116, 240, 240, 240, 418, 418, 418, 418], bends: {2: 140, 5: 298}, line: [148, 262], summary: [148, 258, 276]}
  };
  let lastTime = 0, reduced = false, previousKey = '', captionKey = '', mode = 'wide';
  function measure() { mode = (figure.getBoundingClientRect().width || 600) < 600 ? 'narrow' : 'wide'; }

  // Which tensors are fully drawn, which one is growing and how far, and what the line
  // under the backbone says.
  function timeline(stage, f) {
    const grow = (index, a = 0.1, b = 0.6) => ({shown: index + 1, growing: index, u: ease(seg(f, a, b))});
    let st;
    if (stage === 0) st = {shown: 1, growing: null, u: 0};
    else if (stage === 1) st = grow(1);
    else if (stage === 2) st = grow(2);
    else if (stage === 3) st = {shown: 3, growing: null, u: 0, pending: 3};
    else if (stage === 4) st = grow(3);
    else if (stage === 5) st = grow(4);
    else if (stage === 6) {
      const windows = [[0.05, 0.35], [0.4, 0.55], [0.6, 0.75], [0.8, 0.95]];
      const k = windows.findIndex(([, b]) => f < b);
      const index = k < 0 ? T.length - 1 : LAST_BOX + 1 + k;
      st = {shown: index + 1, growing: index, u: ease(seg(f, ...windows[index - LAST_BOX - 1]))};
    } else st = {shown: T.length, growing: null, u: 0, summary: true};
    st.stage = stage;
    st.line = stage >= 1 && stage <= 5 ? (stage === 3 ? 3 : st.growing) : stage === 6 ? LAST_BOX + 1 : null;
    return st;
  }

  function draw(st) {
    const m = MODES[mode], parts = [];
    const text = (x, y, content, cls, anchor = 'middle', extra = '', size = m.font) =>
      parts.push(`<text x="${num(x)}" y="${num(y)}" class="${cls}" font-size="${size}" text-anchor="${anchor}"${extra}>${content}</text>`);
    // Where each tensor sits, in the picture's units.
    const geom = i => {
      const t = T[i], [x, cy] = m.at[i];
      if (t.kind === 'box') { const side = t.n * m.sc; return {kind: 'box', x, cy, side, c: t.c}; }
      const h = Math.max(3, t.len * m.barScale);
      return {kind: 'bar', x, cy, w: m.barW, h};
    };
    const extent = g => (g.kind === 'box'
      ? {left: g.x, right: g.x + g.side + g.c * m.d[0], top: g.cy - g.side / 2 + g.c * m.d[1], bottom: g.cy + g.side / 2, mid: g.x + g.side / 2}
      : {left: g.x, right: g.x + g.w, top: g.cy - g.h / 2, bottom: g.cy + g.h / 2, mid: g.x + g.w / 2});
    const box = (g, cls, mark) => {
      const [dx, dy] = m.d, X = g.x, Y = g.cy - g.side / 2, F = g.side, Dx = g.c * dx, Dy = g.c * dy;
      const pt = (x, y) => `${num(x)} ${num(y)}`;
      parts.push(`<path class="lf-face lf-top ${cls}" d="M${pt(X, Y)}L${pt(X + F, Y)}L${pt(X + F + Dx, Y + Dy)}L${pt(X + Dx, Y + Dy)}Z"></path>`);
      parts.push(`<path class="lf-face lf-side ${cls}" d="M${pt(X + F, Y)}L${pt(X + F + Dx, Y + Dy)}L${pt(X + F + Dx, Y + F + Dy)}L${pt(X + F, Y + F)}Z"></path>`);
      let slices = '';
      for (let k = 1; k < Math.floor(g.c + 1e-9); k++) slices += `M${pt(X + k * dx, Y + k * dy)}L${pt(X + F + k * dx, Y + k * dy)}L${pt(X + F + k * dx, Y + F + k * dy)}`;
      if (slices) parts.push(`<path class="lf-slice" d="${slices}"></path>`);
      parts.push(`<rect class="lf-face lf-front ${cls}" data-mark="${mark}" data-depth="${num(g.c)}" x="${num(X)}" y="${num(Y)}" width="${num(F)}" height="${num(F)}"></rect>`);
    };
    const bar = (g, mark) => parts.push(`<rect class="lf-bar" data-mark="${mark}" x="${num(g.x)}" y="${num(g.cy - g.h / 2)}" width="${num(g.w)}" height="${num(g.h)}"></rect>`);
    const cls = i => (i === 0 ? 'lf-in' : 'lf-map');

    // The arrow into tensor i, with the operation over it and its learned count under it.
    const arrow = i => {
      const a = extent(geom(i - 1)), b = extent(geom(i)), op = OPS[i];
      const name = op.name === 'conv' ? `conv ${op.k} × ${op.k}` : op.name === 'pool' ? `max pool ${op.k}`
        : op.name === 'flatten' ? 'flatten' : `fc${op.index}${op.relu ? ' · ReLU' : ''}`;
      const learned = op.name === 'conv' ? `${op.kernels} kernels` : op.name === 'fc' ? `${T[i].len} × ${op.from}` : null;
      const head = (x, y) => parts.push(`<path class="lf-head" d="M${num(x)} ${num(y)}l-6 -3.5v7z"></path>`);
      const bend = m.bends[i];
      if (bend === undefined) {
        const y = m.at[i][1], x0 = a.right + 6, x1 = b.left - 6;
        parts.push(`<path class="lf-arrow" data-mark="arrow-${i}" d="M${num(x0)} ${y}H${num(x1 - 5)}"></path>`); head(x1, y);
        text((x0 + x1) / 2, y - 8, name, 'lf-scenery', 'middle', '', m.small);
        if (learned) text((x0 + x1) / 2, y + 17, learned, 'lf-parameter-text', 'middle', ` data-value="learned-${i}"`, m.small);
      } else {
        const x0 = a.mid, x1 = b.mid, top = m.shapeY[i - 1] + 8;
        parts.push(`<path class="lf-arrow" data-mark="arrow-${i}" d="M${num(x0)} ${num(top)}V${bend}H${num(x1)}V${num(b.top - 9)}"></path>`);
        parts.push(`<path class="lf-head" d="M${num(x1)} ${num(b.top - 3)}l-3.5 -6h7z"></path>`);
        text((x0 + x1) / 2, bend - 6, name, 'lf-scenery', 'middle', '', m.small);
      }
    };

    for (let i = 0; i < T.length; i++) {
      const done = i < st.shown && i !== st.growing, growing = i === st.growing;
      if (i > 0 && (done || growing || st.pending === i)) arrow(i);
      if (st.pending === i) {
        text(extent(geom(i)).mid, m.shapeY[i], `${T[i].c} × · × ·`, 'lf-prediction-text lf-number', 'middle', ` data-value="shape-${i}"`);
        continue;
      }
      if (!done && !growing) continue;
      let g = geom(i);
      if (growing && st.u < 1) {
        const from = geom(i - 1);
        if (g.kind === 'box') g = {...g, x: lerp(from.x, g.x, st.u), cy: lerp(from.cy, g.cy, st.u), side: lerp(from.side, g.side, st.u), c: lerp(from.c, g.c, st.u)};
        else {
          const f = from.kind === 'box' ? {x: from.x, cy: from.cy, w: from.side, h: from.side} : from;
          g = {kind: 'bar', x: lerp(f.x, g.x, st.u), cy: lerp(f.cy, g.cy, st.u), w: lerp(f.w, g.w, st.u), h: lerp(f.h, g.h, st.u)};
        }
      }
      if (g.kind === 'box') box(g, cls(i), `tensor-${i}`); else bar(g, `tensor-${i}`);
      if (!growing || st.u >= 1) {
        const label = i === T.length - 1 ? `${T[i].len} logits` : shape(T[i]);
        text(extent(geom(i)).mid, m.shapeY[i], label, `${i === 0 ? 'lf-scenery' : 'lf-prediction-text'} lf-number`, 'middle', ` data-value="shape-${i}"`);
      }
    }

    // The line under the backbone: the output-size formula for the layer at work, the
    // flatten count, or, at the end, the two paths the network took.
    if (st.line !== null && st.line !== undefined) {
      const op = OPS[st.line], out = st.pending === st.line ? '·' : T[st.line].n;
      const content = op.name === 'flatten' ? `flatten: ${shape(T[LAST_BOX])} = ${flat}`
        : `size: ⌊(${op.from} + ${2 * op.p} − ${op.k}) / ${op.s}⌋ + 1 = ${out}`;
      text(m.line[0], m.line[1], content, 'lf-scenery lf-number', 'middle', ' data-value="size-line"', m.small);
    }
    if (st.summary) {
      text(m.summary[0], m.summary[1], `size: ${sizes.map(t => t.n).join(' → ')}`, 'lf-scenery lf-number', 'middle', ' data-value="where"', m.small);
      text(m.summary[0], m.summary[2], `depth: ${sizes.map(t => t.c).join(' → ')}`, 'lf-prediction-text lf-number', 'middle', ' data-value="what"', m.small);
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
    const visible = T.filter((_, i) => i < st.shown && (i !== st.growing || st.u >= 1));
    root.dataset.stage = String(stage);
    root.dataset.shapes = visible.map(shape).join(', ');
    const key = [mode, JSON.stringify(st, (k, v) => (typeof v === 'number' ? Number(v.toFixed(4)) : v))].join('/');
    if (key !== previousKey) {
      previousKey = key;
      svg.setAttribute('viewBox', `0 0 ${MODES[mode].viewBox.join(' ')}`);
      drawing.innerHTML = draw(st);
      formula.classList.toggle('lf-size-lit', [1, 2, 4, 5].includes(stage));
      formula.classList.toggle('lf-kernels-lit', [1, 3, 4].includes(stage));
    }
    const label = `LeNet's tensor shapes so far: ${visible.map(shape).join(', ')}`
      + (st.pending ? `; conv2's ${T[3].c} maps are next, their size to predict.` : '.');
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
