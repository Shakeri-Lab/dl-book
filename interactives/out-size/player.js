// Counting the window's stops: n_out = floor((n + 2p - k) / s) + 1, in one dimension.
//
// Contract with interactives/shared/playback.js:
//   window.BookPlayback(root, render, layout?)
//   render(time, reduced) -> the scrubber's description; never measures the DOM.
//   layout() -> the only place that measures.
//
// One picture: a row of n inputs, zeros added at both ends, and a window k wide that hops
// s cells at a time, writing one output per stop. The tracked object is the window. A ruler
// under the row measures how far it can travel, n + 2p - k, and ticks every s cells: the
// ticks are the hops, the floor is the leftover shorter than one step, and the +1 is the
// window's starting position. The three regimes are the chapter's shapes cell.
(() => {
  const root = document.getElementById('out-size-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  const N = Number(root.dataset.n), K = Number(root.dataset.k);
  const R = root.dataset.regimes.trim().split(/\s+/).map(Number);
  const REGIMES = [0, 1, 2].map(i => ({p: R[2 * i], s: R[2 * i + 1]}));
  const travel = g => N + 2 * g.p - K;
  const stops = g => Math.floor(travel(g) / g.s) + 1;
  const P_MAX = Math.max(...REGIMES.map(g => g.p));

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = svg.querySelector('[data-drawing]');
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration || beats.at(-1));
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);
  const [G0, G1, G2] = REGIMES;
  const STAGES = ['Ask', 'No padding', 'Add a border', 'Padding, stride 1', 'Predict', 'Stride 2',
    'Three regimes', 'The count'];
  const CAPTIONS = [
    `A window ${K} wide on a row of ${N}. Every stop writes one output. How many stops?`,
    `No border: the window can travel ${N} − ${K} = ${travel(G0)} cells. ${travel(G0)} hops plus the start: ${stops(G0)}.`,
    `One zero at each end: the row is ${N + 2 * G1.p} long, and the window can travel ${travel(G1)}.`,
    `Stride ${G1.s}: ${travel(G1)} hops plus the start, ${stops(G1)} outputs, the input's own length.`,
    `Same border, stride ${G2.s}. How many stops does the window make now?`,
    `${travel(G2)} ÷ ${G2.s} is ${Math.floor(travel(G2) / G2.s)} whole hops, plus the start: ${stops(G2)}. The last zero is never a start.`,
    `The code cell's three regimes: ${REGIMES.map(stops).join(', ')}.`,
    'Travel, divided by the step and floored, counts the hops; plus one counts where the window starts.'
  ];

  const num = value => String(Number(value.toFixed(4)));
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const ease = v => v * v * (3 - 2 * v);
  const seg = (f, a, b) => clamp01((f - a) / (b - a));
  const MODES = {
    wide: {viewBox: [713, 330], font: 14, c: 44, row: 56, rule: 142, out: 196, count: 270, ledger: [262, 286, 310]},
    narrow: {viewBox: [296, 330], font: 12, c: 26, row: 56, rule: 124, out: 168, count: 236, ledger: [236, 260, 284]}
  };
  let lastTime = 0, reduced = false, previousKey = '', captionKey = '', mode = 'wide';
  function measure() { mode = (figure.getBoundingClientRect().width || 600) < 600 ? 'narrow' : 'wide'; }

  // The state at one moment: which regime, how visible the border is, where the window
  // stands (fractional while it hops), how many outputs are written, and what is said.
  function timeline(stage, f) {
    const st = {g: G0, pad: 0, pos: 0, written: 0, rule: false, ticks: false, count: false, withheld: false, unused: false, ledger: false};
    const slide = g => {
      const u = seg(f, 0.08, 0.75), last = stops(g) - 1;
      st.pos = ease(u) * last;
      st.written = Math.min(stops(g), Math.floor(st.pos + 1e-9) + 1);
    };
    if (stage === 0) { st.written = 0; }
    else if (stage === 1) { slide(G0); st.rule = true; st.ticks = f >= 0.08; st.count = f >= 0.75; }
    else if (stage === 2) { st.g = G1; st.pad = ease(seg(f, 0, 0.4)); st.rule = f >= 0.4; }
    else if (stage === 3) { st.g = G1; st.pad = 1; slide(G1); st.rule = true; st.ticks = true; st.count = f >= 0.75; }
    else if (stage === 4) { st.g = G2; st.pad = 1; st.rule = true; st.withheld = true; }
    else if (stage === 5) { st.g = G2; st.pad = 1; slide(G2); st.rule = true; st.ticks = true; st.count = f >= 0.75; st.unused = f >= 0.75; }
    else { Object.assign(st, {g: G2, pad: 1, pos: stops(G2) - 1, written: stops(G2), rule: true, ticks: true, count: true, unused: true, ledger: true}); }
    return st;
  }

  function draw(st, stage) {
    const m = MODES[mode], c = m.c, g = st.g, parts = [];
    const cells = N + 2 * P_MAX, x0 = (m.viewBox[0] - cells * c) / 2;
    const left = i => x0 + (i + P_MAX) * c;              // left edge of input index i (pads are -1, N)
    const text = (x, y, content, cls, anchor = 'middle', extra = '', size = m.font) =>
      parts.push(`<text x="${num(x)}" y="${num(y)}" class="${cls}" font-size="${size}" text-anchor="${anchor}"${extra}>${content}</text>`);
    const h = c * 0.8;
    // The border: shown for padded regimes, fading in when it is added.
    if (st.pad > 0) {
      for (let q = 1; q <= g.p; q++) for (const i of [-q, N - 1 + q]) {
        const unused = st.unused && i > -g.p + (stops(g) - 1) * g.s + K - 1;   // no window reaches it
        parts.push(`<rect class="os-pad" data-mark="pad-${i}" x="${num(left(i) + 2)}" y="${m.row}" width="${num(c - 4)}" height="${num(h)}" opacity="${num(st.pad)}"></rect>`);
        if (unused) parts.push(`<rect class="os-unused" data-mark="unused" x="${num(left(i) + 2)}" y="${m.row}" width="${num(c - 4)}" height="${num(h)}"></rect>`);
        text(left(i) + c / 2, m.row + h / 2 + m.font / 3, '0', 'os-pad-text', 'middle', ` opacity="${num(st.pad)}"`);
      }
    }
    for (let i = 0; i < N; i++) parts.push(`<rect class="os-input" data-mark="input-${i}" x="${num(left(i) + 2)}" y="${m.row}" width="${num(c - 4)}" height="${num(h)}"></rect>`);
    text(left(0), m.row - 12, `input, n = ${N}`, 'os-scenery', 'start', '', m.font - 2);
    const start = -g.p;                                      // the window's first left edge
    const wx = left(start + st.pos * g.s);
    parts.push(`<rect class="os-window" data-mark="window" x="${num(wx)}" y="${m.row - 5}" width="${num(K * c)}" height="${num(h + 10)}" rx="4"></rect>`);
    // The ruler: how far the window's left edge can travel, ticked every step.
    if (st.rule) {
      const a = left(start), b = left(start + travel(g)), y = m.rule;
      parts.push(`<path class="os-rule" data-mark="rule" d="M${num(a)} ${y}H${num(b)}M${num(a)} ${y - 6}V${y + 6}M${num(b)} ${y - 6}V${y + 6}"></path>`);
      if (st.ticks) for (let j = 1; j < stops(g); j++) parts.push(`<path class="os-tick" data-mark="tick" d="M${num(left(start + j * g.s))} ${y - 4}V${y + 4}"></path>`);
      text((a + b) / 2, y + 22, `travel n + 2p − k = ${N} + ${2 * g.p} − ${K} = ${travel(g)}`, 'os-scenery', 'middle', ' data-value="travel"', m.font - 2);
    }
    // One output per stop, under the window centre where it stopped.
    for (let j = 0; j < st.written; j++) {
      const cx = left(start + j * g.s) + K * c / 2;
      parts.push(`<path class="os-link" d="M${num(cx)} ${m.rule + 28}V${m.out - 4}"></path>`);
      parts.push(`<rect class="os-output" data-mark="output-${j}" x="${num(cx - c * 0.35)}" y="${m.out}" width="${num(c * 0.7)}" height="${num(c * 0.7)}" rx="3"></rect>`);
    }
    const shown = st.withheld ? '·' : st.count ? String(stops(g)) : null;
    if (shown !== null && !st.ledger) {
      const expr = st.withheld ? `p = ${g.p}, s = ${g.s}:  out = ` : `⌊${travel(g)} / ${g.s}⌋ + 1 = `;
      text(m.viewBox[0] / 2, m.count, `${expr}${shown}`, 'os-prediction-text os-number', 'middle', ' data-value="count"');
    }
    if (st.ledger) {
      REGIMES.forEach((r, i) => text(m.viewBox[0] / 2, m.ledger[i],
        `p ${r.p}, s ${r.s}:  ⌊(${N} + ${2 * r.p} − ${K}) / ${r.s}⌋ + 1 = ${stops(r)}`, 'os-scenery', 'middle', ` data-value="ledger-${i}"`, m.font - 2));
    }
    // The hatch for the never-used zero, declared once.
    parts.unshift('<defs><pattern id="os-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line class="os-hatch-line" x1="0" y1="0" x2="0" y2="6"></line></pattern></defs>');
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
    root.dataset.written = String(st.written);
    root.dataset.regime = `${st.g.p} ${st.g.s}`;
    const key = [mode, stage, JSON.stringify(st, (k, v) => (typeof v === 'number' ? Number(v.toFixed(4)) : v))].join('/');
    if (key !== previousKey) {
      previousKey = key;
      svg.setAttribute('viewBox', `0 0 ${MODES[mode].viewBox.join(' ')}`);
      drawing.innerHTML = draw(st, stage);
      formula.classList.toggle('os-travel-lit', stage >= 1 && stage <= 3);
      formula.classList.toggle('os-step-lit', stage === 4 || stage === 5);
      formula.classList.toggle('os-start-lit', stage >= 6);
    }
    const label = st.withheld
      ? `A row of ${N} with one zero at each end and a window ${K} wide. The count at stride ${st.g.s} is withheld.`
      : `A row of ${N}${st.g.p ? ` with ${st.g.p} zero at each end` : ''} and a window ${K} wide at stride ${st.g.s}; ${st.written} outputs written.`;
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
