// In training mode BatchNorm measures each value with its own batch's mean and spread; in
// evaluation mode it measures with stored running statistics.
//
// Contract with interactives/shared/playback.js:
//   window.BookPlayback(root, render, layout?)
//   render(time, reduced) -> the scrubber's description; never measures the DOM.
//   layout() -> the only place that measures.
//
// One picture: a value axis carrying one channel of a batch of four garments, one number
// each, and under it the ruler BatchNorm measures them with, its 0 at the mean and one tick
// per spread. Your garment is ringed and never moves; a drop from it to the ruler shows its
// reading. The tracked object is that ruler. When the three batch-mates glide to larger
// values (the cause, first), the batch's ruler slides after them (the effect), and your
// garment's reading changes although its value did not. In evaluation mode a dashed running
// ruler, pinned at the declared running statistics, replaces it, and the same glides leave
// the reading where it is.
(() => {
  const root = document.getElementById('batch-ruler-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  // The panel is the one in-repo mirror of the declared toy: one channel, one number per
  // garment. interactives/manifest.json names the chapter sentences it illustrates and
  // scripts/audit_excerpt_fixtures.py keeps the two together, so nothing below retypes a
  // number: every mean, spread and reading is computed from these attributes.
  const list = name => root.dataset[name].trim().split(/\s+/).map(Number);
  const GARMENT = Number(root.dataset.garment);
  const BATCHES = [list('first'), list('second')];
  const [RUNNING_MEAN, RUNNING_VARIANCE] = list('running');
  const [GAMMA, BETA] = list('affine');
  // Epsilon is taken as 0, as the scope disclosure says: at PyTorch's default of 1e-5 no
  // reading moves by as much as 1e-5, so no drawn digit changes.
  const EPSILON = 0;
  // The chapter's formula over the batch: the mean, and the mean of the squared deviations.
  const statistics = mates => {
    const values = [GARMENT, ...mates], n = values.length;
    const mean = values.reduce((sum, v) => sum + v, 0) / n;
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
    return {mean, spread: Math.sqrt(variance + EPSILON)};
  };
  const BATCH_RULERS = BATCHES.map(statistics);
  const RUNNING = {mean: RUNNING_MEAN, spread: Math.sqrt(RUNNING_VARIANCE + EPSILON)};
  // y = gamma * x-hat + beta; with gamma = 1 and beta = 0 the output is the reading itself.
  const output = ruler => GAMMA * (GARMENT - ruler.mean) / ruler.spread + BETA;
  const minus = text => text.replace(/-/g, '−');
  const two = value => minus((Math.abs(value) < 0.005 ? 0 : value).toFixed(2));
  const plain = value => minus(String(Number(value.toFixed(2))));
  const words = values => `${values.slice(0, -1).map(plain).join(', ')} and ${plain(values.at(-1))}`;

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = svg.querySelector('[data-drawing]');
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration || beats.at(-1));
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);
  const [R0, R1] = BATCH_RULERS;
  const STAGES = ['First batch', 'Predict', 'Second batch', 'Same input, two readings', 'Evaluation mode',
    'First batch, evaluation mode', 'Second batch, evaluation mode', 'Two machines'];
  const CAPTIONS = [
    "In training mode, BatchNorm measures each value with its batch's own mean and spread.",
    "Swap the other three garments for larger ones. Does your garment's output change?",
    "The other three move, and the batch's ruler moves with them.",
    'Same input, opposite outputs: in training mode the output depends on the batch.',
    'In evaluation mode BatchNorm uses running statistics collected during training.',
    `Swap the batch back: the running ruler stays put, and the reading stays ${plain(output(RUNNING))}.`,
    'Any batch, the same reading: in evaluation mode the output depends on the input alone.',
    'Two machines: training measures with the batch, evaluation with stored statistics.'
  ];
  // The reveal's second caption names the new reading only once the ruler has arrived.
  const ARRIVED = `Your garment still holds ${plain(GARMENT)}, but now it reads ${plain(output(R1))}.`;

  const num = value => String(Number(value.toFixed(4)));
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const ease = v => v * v * (3 - 2 * v);
  const seg = (f, a, b) => clamp01((f - a) / (b - a));
  const lerp = (a, b, u) => a + (b - a) * u;
  // Beat 2 in three parts: the mates glide (the cause), then the ruler slides after them (the
  // effect), then everything holds while the new reading stands for 2.5 s.
  const MATES_END = 0.24, RULER_END = 0.5;
  // Beat 4: the batch ruler fades out, then the running ruler fades in; the reading returns
  // once the running ruler is whole and stands for 3 s.
  const OUT_END = 0.2, IN_END = 0.4;
  // Beats 5 and 6: the mates glide in the first 1.5 s; the running ruler never moves.
  const GLIDE_END = 0.3;

  // Marks sharing a value stack upward from the axis. Your garment always takes the bottom
  // row at its own value; the mates at one value stack in order of how far each travels
  // between the two batches, shortest lowest, so that no glide passes through another mark.
  const TRAVEL = BATCHES[0].map((v, i) => Math.abs(BATCHES[1][i] - v));
  const ROWS = BATCHES.map(values => {
    const taken = new Map([[GARMENT, 1]]), rows = [];
    values.map((_, i) => i).sort((a, b) => TRAVEL[a] - TRAVEL[b] || a - b).forEach(i => {
      const row = taken.get(values[i]) || 0;
      rows[i] = row; taken.set(values[i], row + 1);
    });
    return rows;
  });
  // The drawn axis spans every value and both ends of every ruler, which reach two spreads
  // either side of their mean; its labels are the integers the values span.
  const rulers = [...BATCH_RULERS, RUNNING];
  const every = [GARMENT, ...BATCHES.flat()];
  const LOW = Math.min(...every, ...rulers.map(r => r.mean - 2 * r.spread));
  const HIGH = Math.max(...every, ...rulers.map(r => r.mean + 2 * r.spread));
  const LABELS = [];
  for (let k = Math.ceil(Math.min(...every)); k <= Math.floor(Math.max(...every)); k++) LABELS.push(k);
  const TICKS = [-2, -1, 0, 1, 2];

  // Vertical positions are offsets from the axis line (yA): the value labels, your garment's
  // name and the top of its drop sit below it, then the ruler row (yR) and, in beat 3 only,
  // the first batch's ruler drawn again one row lower. The wide print is the desktop
  // figure's 713 units; the narrow one is a phone's 296, laid out again rather than shrunk.
  const MODES = {
    wide: {viewBox: [713, 284], axis: [98, 642], pad: 0.4, yA: 92, yR: 188, rowGap: 56,
      modeLabel: [16, 26], fonts: {mode: 13, label: 12, mean: 11, reading: 13},
      r: 6, ring: 10.5, lift: 12, step: 19, axisTick: 5, tri: [6, 10], meanGap: 10, meanDy: 11,
      valueDy: 30, nameDy: 47, dropDy: 55, rulerTick: 6, zeroTick: 9, tickDy: 24, dropGap: 6,
      labelX: 16, labelDy: 14, readDx: 9, foot: 3.5,
      w: {axis: 1.4, rule: 2.2, tick: 1.5, drop: 1.3, ring: 2.2, value: 1.2}, dash: {running: '7 4', ghost: '1.6 3'}},
    narrow: {viewBox: [296, 234], axis: [15.4, 292.6], pad: 0.3, yA: 70, yR: 150, rowGap: 50,
      modeLabel: [10, 17], fonts: {mode: 12, label: 11, mean: 10, reading: 11},
      r: 4.5, ring: 8, lift: 9, step: 14, axisTick: 4, tri: [4.5, 8], meanGap: 7, meanDy: 9.5,
      valueDy: 24, nameDy: 39, dropDy: 45, rulerTick: 5, zeroTick: 7.5, tickDy: 19, dropGap: 5,
      labelX: 10, labelDy: 12, readDx: 7, foot: 3,
      w: {axis: 1.2, rule: 1.8, tick: 1.3, drop: 1.1, ring: 1.8, value: 1}, dash: {running: '5 3', ghost: '1.3 2.4'}}
  };
  let lastTime = 0, reduced = false, previousKey = '', captionKey = '', mode = 'wide';
  function measure() { mode = (figure.getBoundingClientRect().width || 600) < 600 ? 'narrow' : 'wide'; }

  function timeline(stage, f) {
    const batch = b => ({kind: 'batch', mean: BATCH_RULERS[b].mean, spread: BATCH_RULERS[b].spread, opacity: 1});
    const running = {kind: 'running', mean: RUNNING.mean, spread: RUNNING.spread, opacity: 1};
    const st = {stage, evaluation: stage >= 4, from: 0, to: 0, s: 0, live: batch(0), ghost: null, reading: true, arrived: true};
    if (stage === 2) {
      st.to = 1;
      if (f < MATES_END) st.s = ease(f / MATES_END);
      else if (f < RULER_END) {
        const u = ease((f - MATES_END) / (RULER_END - MATES_END));
        st.s = 1; st.reading = false;
        st.live = {kind: 'batch', mean: lerp(R0.mean, R1.mean, u), spread: lerp(R0.spread, R1.spread, u), opacity: 1, sliding: true};
      } else { st.s = 1; st.live = batch(1); }
      st.arrived = f >= RULER_END;
    } else if (stage === 3) {
      st.from = st.to = 1; st.s = 1; st.live = batch(1); st.ghost = batch(0);
    } else if (stage === 4) {
      st.from = st.to = 1; st.s = 1;
      if (f < OUT_END) { st.live = {...batch(1), opacity: Number((1 - f / OUT_END).toFixed(4))}; st.reading = false; }
      else if (f < IN_END) { st.live = {...running, opacity: Number(((f - OUT_END) / (IN_END - OUT_END)).toFixed(4))}; st.reading = false; }
      else st.live = running;
    } else if (stage === 5) {
      st.from = 1; st.to = 0; st.s = ease(seg(f, 0, GLIDE_END)); st.live = running;
    } else if (stage === 6) {
      st.from = 0; st.to = 1; st.s = ease(seg(f, 0, GLIDE_END)); st.live = running;
    } else if (stage === 7) {
      st.from = st.to = 1; st.s = 1; st.live = running;
    }
    return st;
  }

  function draw(st) {
    const m = MODES[mode], parts = [];
    const U = (m.axis[1] - m.axis[0]) / (HIGH - LOW + 2 * m.pad);
    const X = v => m.axis[0] + (v - LOW + m.pad) * U;
    const rowY = row => m.yA - m.lift - row * m.step;
    const text = (x, y, content, cls, anchor, size, extra = '') =>
      parts.push(`<text x="${num(x)}" y="${num(y)}" class="${cls}" font-size="${size}" text-anchor="${anchor}"${extra}>${content}</text>`);
    const line = (x1, y1, x2, y2, cls, width, extra = '') =>
      parts.push(`<line class="${cls}" x1="${num(x1)}" y1="${num(y1)}" x2="${num(x2)}" y2="${num(y2)}" stroke-width="${width}"${extra}></line>`);
    const circle = (cx, cy, r, cls, width, extra = '') =>
      parts.push(`<circle class="${cls}" cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}" stroke-width="${width}"${extra}></circle>`);
    const f = m.fonts, gx = X(GARMENT);

    text(m.modeLabel[0], m.modeLabel[1], st.evaluation ? 'evaluation mode' : 'training mode', 'br-mode', 'start', f.mode, ' data-label="mode"');
    // The value axis: scenery that never moves.
    line(m.axis[0], m.yA, m.axis[1], m.yA, 'br-axis', m.w.axis, ' data-mark="axis"');
    LABELS.forEach(k => {
      line(X(k), m.yA, X(k), m.yA + m.axisTick, 'br-axis-tick', m.w.axis, ` data-mark="axis-tick" data-at="${k}"`);
      text(X(k), m.yA + m.valueDy, minus(String(k)), 'br-axis-label', 'middle', f.label, ` data-label="axis" data-at="${k}"`);
    });
    text(gx, m.yA + m.nameDy, 'your garment', 'br-garment-label', 'middle', f.label, ' data-label="garment"');

    // The drop from your garment to the ruler row. In beat 3 it runs on to the first batch's
    // ruler one row lower, broken where it crosses the upper ruler's labels.
    line(gx, m.yA + m.dropDy, gx, m.yR, 'br-drop', m.w.drop, ` data-mark="drop" data-to="${num(m.yR)}"`);
    if (st.ghost) line(gx, m.yR + m.tickDy + m.dropGap, gx, m.yR + m.rowGap, 'br-drop', m.w.drop, ` data-mark="drop" data-to="${num(m.yR + m.rowGap)}"`);

    // A ruler: its bar spans two spreads either side of its mean, one tick per spread,
    // labelled in normalized units. The batch ruler carries the mean mark on the axis.
    const ruler = (r, y, name, reading) => {
      if (r.opacity > 0) drawRuler(r, y, name);
      circle(gx, y, m.foot, 'br-foot', 0, ' data-mark="foot"');
      if (reading) text(gx + m.readDx, y - m.labelDy, `reads ${two(output(r))}`, 'br-reading', 'start', f.reading, ` data-value="${reading}"`);
    };
    const drawRuler = (r, y, name) => {
      parts.push(`<g data-mark="ruler" data-kind="${r.kind}" data-mean="${num(r.mean)}" data-spread="${num(r.spread)}"${r.opacity < 1 ? ` opacity="${num(r.opacity)}"` : ''}>`);
      if (r.kind === 'batch') {
        const [half, height] = m.tri, x = X(r.mean);
        parts.push(`<path class="br-mean" d="M${num(x)} ${num(m.yA + 1.5)}l${num(half)} ${num(height)}h${num(-2 * half)}z" data-mark="mean" data-at="${num(r.mean)}"></path>`);
        text(x - m.meanGap, m.yA + m.meanDy, 'mean', 'br-mean-label', 'end', f.mean, ' data-label="mean"');
      }
      text(m.labelX, y - m.labelDy, name, 'br-ruler-label', 'start', f.label, ' data-label="ruler"');
      const dash = r.kind === 'batch' ? '' : ` stroke-dasharray="${m.dash[r.kind]}"`;
      line(X(r.mean - 2 * r.spread), y, X(r.mean + 2 * r.spread), y, `br-rule is-${r.kind}`, m.w.rule, dash);
      TICKS.forEach(k => {
        const x = X(r.mean + k * r.spread), reach = k === 0 ? m.zeroTick : m.rulerTick;
        line(x, y - reach, x, y + reach, 'br-tick', m.w.tick, ` data-k="${k}"`);
        text(x, y + m.tickDy, minus(String(k)), 'br-tick-label', 'middle', f.label, ` data-k="${k}"`);
      });
      parts.push('</g>');
    };
    const liveName = st.live.kind === 'running' ? 'running statistics' : st.ghost ? 'second batch' : 'batch statistics';
    ruler(st.live, m.yR, liveName, st.reading && st.live.opacity === 1 ? 'reading' : null);
    if (st.ghost) ruler({...st.ghost, kind: 'ghost'}, m.yR + m.rowGap, 'first batch', 'reading-first');

    // The batch: three mates and your garment. Only the mates ever move.
    const values = BATCHES[st.from].map((v, i) => lerp(v, BATCHES[st.to][i], st.s));
    const rowsNow = ROWS[st.from].map((row, i) => lerp(row, ROWS[st.to][i], st.s));
    values.forEach((v, i) => circle(X(v), rowY(rowsNow[i]), m.r, 'br-value', m.w.value,
      ` data-mark="mate" data-index="${i}" data-at="${num(v)}" data-row="${num(rowsNow[i])}"`));
    circle(gx, rowY(0), m.r, 'br-value', m.w.value, ` data-mark="garment-dot" data-at="${num(GARMENT)}"`);
    circle(gx, rowY(0), m.ring, 'br-ring', m.w.ring, ` data-mark="garment" data-at="${num(GARMENT)}"`);
    return parts.join('');
  }

  // The picture's accessible description names only what the drawing shows at this moment.
  function describe(st) {
    const rest = st.s >= 1 ? st.to : st.from, moving = st.from !== st.to && st.s > 0 && st.s < 1;
    const mates = moving ? `its batch-mates move from ${words(BATCHES[st.from])} to ${words(BATCHES[st.to])}`
      : `its batch-mates ${words(BATCHES[rest])}`;
    const sentences = [`${st.evaluation ? 'Evaluation' : 'Training'} mode. One channel, one number per garment: your garment holds ${plain(GARMENT)}, ${mates}.`];
    const r = st.live;
    if (r.kind === 'batch' && r.sliding) sentences.push(`The batch ruler slides after them to the new batch mean, ${plain(R1.mean)}.`);
    else if (r.kind === 'batch' && r.opacity < 1) sentences.push('The batch ruler gives way.');
    else if (r.kind === 'batch') sentences.push(`The batch ruler puts 0 at the batch mean, ${plain(r.mean)}, with one tick per spread, ${plain(r.spread)}.`);
    else if (r.opacity < 1) sentences.push(`A dashed running ruler comes in at the running mean, ${plain(r.mean)}.`);
    else sentences.push(`The dashed running ruler puts 0 at the running mean, ${plain(r.mean)}, with one tick per spread, ${plain(r.spread)}.`);
    if (st.reading && r.opacity === 1) sentences.push(`Your garment reads ${two(output(r))}.`);
    if (st.ghost) sentences.push(`The first batch's ruler, drawn again below it, reads your garment at ${two(output(st.ghost))}.`);
    return sentences.join(' ');
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
    const key = [mode, JSON.stringify(st)].join('/');
    if (key !== previousKey) {
      previousKey = key;
      svg.setAttribute('viewBox', `0 0 ${MODES[mode].viewBox.join(' ')}`);
      drawing.innerHTML = draw(st);
      formula.classList.toggle('br-batch-lit', !st.evaluation);
      formula.classList.toggle('br-batch-off', st.evaluation);
    }
    const label = describe(st);
    if (svg.getAttribute('aria-label') !== label) svg.setAttribute('aria-label', label);
    const sentence = stage === 2 && st.arrived ? ARRIVED : CAPTIONS[stage];
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
