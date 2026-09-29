// PCA's flat line is the best line: every tilt about the center leaves more squared residual.
//
// Contract with interactives/shared/playback.js:
//   window.BookPlayback(root, render, layout?)
//   render(time, reduced) -> the scrubber's description; a pure function of
//     (time, reduced) and the dial that never measures the DOM.
//   layout() -> the only place that measures.
//
// One picture: sixteen points of the chapter's planted curve, the line through their mean,
// each point's orthogonal foot on that line and the residual between them; beside it, a
// small plot of L against tilt. The tracked object is the line with its residuals: it turns
// about the center and every residual is redrawn perpendicular to it, while the plot's dot
// is the same L seen a second time. The printed L is the loss of exactly the residuals
// drawn, nothing else: fit() computes the feet, the residual vectors and L from one pass,
// and draw() draws those residuals and prints that L. Two stills, flat and upright, show two
// values and lose what the motion carries: L rises the moment the line leaves flat and comes
// back only when it is flat again, so no tilt in between does better. The dial is the one
// parameter control: the line's direction, which is what the tied autoencoder learns.
(() => {
  const root = document.getElementById('flat-line-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  const numbersOf = name => root.dataset[name].trim().split(/\s+/).map(Number);
  // The panel is the one in-repo mirror of the fixture: the chapter's curve height
  // (x(t) = (t, 1.5(t^2 - 1/3)) in chapters/interludes/making-pca-learnable.qmd), a declared
  // sample of N midpoints, and the tilt range in degrees, which starts at the flat line.
  const HEIGHT = Number(root.dataset.height), N = Number(root.dataset.points);
  const [LO, HI] = numbersOf('sweep');
  const UPRIGHT = (LO + HI) / 2, LEAN = (LO + UPRIGHT) / 2;
  const curve = t => [t, HEIGHT * (t * t - 1 / 3)];
  const POINTS = Array.from({length: N}, (_, j) => curve(-1 + (2 * j + 1) / N));
  const D = POINTS[0].length;
  // PCA centers the rows, so every candidate line pivots at the sample mean.
  const MEAN = POINTS[0].map((_, k) => POINTS.reduce((sum, p) => sum + p[k], 0) / N);

  // Everything drawn at one tilt, and L from exactly those residuals: the line through the
  // mean at `deg` degrees from the horizontal, each point's orthogonal foot on it (the
  // reconstruction x̂_i), the residual vectors x_i - x̂_i, and
  // L = (1 / (n d)) sum_i ||x_i - x̂_i||^2, the chapter's normalization.
  const fits = new Map();
  function fit(deg) {
    if (fits.has(deg)) return fits.get(deg);
    const angle = deg * Math.PI / 180, u = [Math.cos(angle), Math.sin(angle)];
    const along = POINTS.map(p => (p[0] - MEAN[0]) * u[0] + (p[1] - MEAN[1]) * u[1]);
    const feet = along.map(a => [MEAN[0] + a * u[0], MEAN[1] + a * u[1]]);
    const residuals = POINTS.map((p, i) => [p[0] - feet[i][0], p[1] - feet[i][1]]);
    const loss = residuals.reduce((sum, r) => sum + r[0] * r[0] + r[1] * r[1], 0) / (N * D);
    const result = {deg, u, feet, residuals, loss, reach: [Math.min(...along), Math.max(...along)]};
    fits.set(deg, result);
    return result;
  }
  const FLAT = fit(LO), UP = fit(UPRIGHT), LEANING = fit(LEAN);
  const fmt = value => value.toFixed(3);
  // A count said as a word where the caption opens with it; digits beyond ninety-nine.
  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven',
    'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const words = n => (n < 20 ? ONES[n] : n < 100 ? TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : '') : String(n));
  const COUNT = words(N).replace(/^./, c => c.toUpperCase());

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = svg.querySelector('[data-drawing]');
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const slider = $('[data-tilt-slider]'), readout = $('[data-tilt-readout]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration || beats.at(-1));
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);
  const STAGES = ['The flat line', 'Predict', 'Toward upright', 'Back to flat', 'A lean toward one arm',
    'The least residual', 'The bend', 'Flat wins among lines'];
  const CAPTIONS = [
    `${COUNT} points of the curve, PCA's flat line, and each point's residual to it.`,
    'Tilt the line about the center. Can any direction leave less residual than flat?',
    `Upright, the line leaves L = ${fmt(UP.loss)}, the most of any tilt.`,
    `Keep turning: L falls back to ${fmt(FLAT.loss)} only when the line is flat again.`,
    `The far arm's residuals grow: L = ${fmt(LEANING.loss)}, more than flat.`,
    'Every tilt costs residual. No line leaves less than the flat one.',
    `What is left, ${fmt(FLAT.loss)}, is the bend itself: no straight line can follow it.`,
    'PCA\'s flat line wins among lines; only a map that bends can do better.'
  ];
  // Beats 2 and 4 speak in two steps, so each value is said only once the line has arrived
  // at the tilt that makes it: first the turn, then what the turn leaves.
  const TURNING = {
    2: 'Tilting away from flat shortens some residuals and lengthens more.',
    4: `Now lean the line ${LEAN} degrees, toward one arm.`
  };
  const ARRIVE = {2: 0.6, 4: 0.5};
  // While the reader drags, the caption says what the dial does and names no value: the
  // slider's own value text is the one place the tilt and L are spoken.
  const DRAG_CAPTION = 'The dial turns the line about the center; the residuals and L follow it.';

  const num = value => String(Number(value.toFixed(4)));
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const ease = v => v * v * (3 - 2 * v);
  const seg = (f, a, b) => clamp01((f - a) / (b - a));
  // Wide: the curve and its line on the left, the small plot on the right. Narrow: the plot
  // under the curve, every mark at its own size. The value of L sits beside the flat line's
  // right end, where the reader first meets it, and stays there while the line turns, so it
  // never jumps and never covers a residual.
  const MODES = {
    wide: {viewBox: [713, 290], s: 162, pivot: [199, 188], pad: 0.06, point: 3.8, foot: 3.2, line: 3, residual: 1.8,
      emphasis: 3, font: 13, symbol: 14, gap: 12, cross: 5.5, curve: 2.5,
      plot: {x0: 482, x1: 698, top: 84, bottom: 230, title: 66, ticks: 249, tick: 4, font: 11.5, titleFont: 12.5, dot: 4.4, ring: 3.3}},
    narrow: {viewBox: [296, 314], s: 100, pivot: [120, 119], pad: 0.06, point: 3.2, foot: 2.8, line: 2.6, residual: 1.5,
      emphasis: 2.6, font: 12, symbol: 13, gap: 12, cross: 4.5, curve: 2.2,
      plot: {x0: 30, x1: 280, top: 214, bottom: 290, title: 200, ticks: 306, tick: 3.5, font: 11, titleFont: 11.5, dot: 3.8, ring: 2.9}}
  };
  // The plot's value axis runs a little below the flat line's L and above the upright one's.
  const SPAN = UP.loss - FLAT.loss, RANGE = [FLAT.loss - 0.25 * SPAN, UP.loss + 0.42 * SPAN];

  let lastTime = 0, reduced = false, previousKey = '', captionKey = '', mode = 'wide', override = null;
  function measure() {
    mode = (figure.getBoundingClientRect().width || 600) < 600 ? 'narrow' : 'wide';
  }

  // The timeline's own tilt, in whole degrees: flat through the question; a quarter turn to
  // upright; the second quarter back to flat; a lean halfway to upright and back; flat to the
  // end. Each glide ends two seconds or more before its beat does, so every value it reaches
  // is held long enough to read. The trace records the tilts the sweep has visited.
  function timeline(stage, f) {
    const st = {stage, tilt: LO, trace: null, floor: stage >= 5, peak: stage === 7,
      labels: [0, 1, 6, 7].includes(stage), emphasis: stage === 6, dragged: false};
    if (stage === 2) { st.tilt = LO + Math.round((UPRIGHT - LO) * ease(seg(f, 0, 0.6))); st.trace = st.tilt; }
    else if (stage === 3) { st.tilt = UPRIGHT + Math.round((HI - UPRIGHT) * ease(seg(f, 0, 0.6))); st.trace = st.tilt; }
    else if (stage === 4) { st.tilt = LO + Math.round((LEAN - LO) * ease(seg(f, 0, 0.5))); st.trace = HI; }
    else if (stage === 5) { st.tilt = LEAN - Math.round((LEAN - LO) * ease(seg(f, 0, 0.5))); st.trace = HI; }
    else if (stage > 5) st.trace = HI;
    return st;
  }

  function draw(st) {
    const g = MODES[mode], s = g.s, [cx, cy] = g.pivot, P = g.plot, parts = [];
    const X = x => cx + s * (x - MEAN[0]), Y = y => cy - s * (y - MEAN[1]);
    const pt = (x, y) => `${num(x)} ${num(y)}`;
    const text = (x, y, content, cls, anchor = 'start', extra = '', size = g.font) =>
      parts.push(`<text x="${num(x)}" y="${num(y)}" class="${cls}" font-size="${size}" text-anchor="${anchor}"${extra}>${content}</text>`);
    const segment = (a, b, cls, width, extra = '') =>
      parts.push(`<line class="${cls}" x1="${num(a[0])}" y1="${num(a[1])}" x2="${num(b[0])}" y2="${num(b[1])}" stroke-width="${width}"${extra}></line>`);
    const circle = (x, y, r, cls, extra = '') => parts.push(`<circle class="${cls}" cx="${num(x)}" cy="${num(y)}" r="${r}"${extra}></circle>`);
    const now = fit(st.tilt);

    // Scenery: the planted curve the sample comes from.
    let d = '';
    for (let k = 0; k <= 64; k++) { const [x, y] = curve(-1 + 2 * k / 64); d += `${k ? 'L' : 'M'}${pt(X(x), Y(y))}`; }
    parts.push(`<path class="fl-curve" d="${d}" fill="none" stroke-width="${g.curve}"></path>`);

    // The line through the center, drawn just past its outermost feet at every tilt.
    const [near, far] = [now.reach[0] - g.pad, now.reach[1] + g.pad]
      .map(k => [X(MEAN[0] + k * now.u[0]), Y(MEAN[1] + k * now.u[1])]);
    segment(near, far, 'fl-line', g.line, ` data-mark="line" data-tilt="${st.tilt}"`);
    // Every residual that enters L, from its point to its foot, and nothing else in wine.
    POINTS.forEach((p, i) => segment([X(p[0]), Y(p[1])], [X(now.feet[i][0]), Y(now.feet[i][1])],
      `fl-residual-seg${st.emphasis ? ' is-emphasized' : ''}`, st.emphasis ? g.emphasis : g.residual, ` data-residual="${i}"`));
    now.feet.forEach(([x, y], i) => circle(X(x), Y(y), g.foot, 'fl-foot-ring', ` data-foot="${i}"`));
    POINTS.forEach(([x, y], i) => circle(X(x), Y(y), g.point, 'fl-sample', ` data-point="${i}"`));
    parts.push(`<path class="fl-pivot" data-mark="pivot" d="M${pt(cx - g.cross, cy)}H${num(cx + g.cross)}M${pt(cx, cy - g.cross)}V${num(cy + g.cross)}"></path>`);
    // L beside the flat line's right end, in the loss colour.
    text(X(MEAN[0] + FLAT.reach[1] + g.pad) + g.gap, cy + 0.35 * g.font, `L = ${fmt(now.loss)}`,
      'fl-residual-text fl-number fl-halo', 'start', ' data-value="loss"');
    // At rest, the formula's two symbols name one point and its reconstruction.
    if (st.labels) {
      const [px, py] = POINTS[0], [fx, fy] = now.feet[0];
      text(X(px) - g.point - 5, Y(py) + 0.35 * g.symbol, 'x', 'fl-symbol fl-feature-text', 'end', ' data-label="x"', g.symbol);
      text(X(fx), Y(fy) + g.symbol + 3, '<tspan class="mechanism-accent">x̂</tspan>', 'fl-symbol fl-prediction-text', 'middle',
        ' data-label="x-hat"', g.symbol);
    }

    // The small plot: L against tilt, its quantity named in its title.
    const plotX = deg => P.x0 + (deg - LO) / (HI - LO) * (P.x1 - P.x0);
    const plotY = loss => P.bottom - (loss - RANGE[0]) / (RANGE[1] - RANGE[0]) * (P.bottom - P.top);
    parts.push(`<text x="${num(P.x0)}" y="${num(P.title)}" class="fl-title" font-size="${P.titleFont}" text-anchor="start"><tspan class="fl-residual-text">L</tspan> against tilt</text>`);
    let ticks = '';
    for (const deg of [LO, LEAN, UPRIGHT, UPRIGHT + (UPRIGHT - LEAN), HI]) ticks += `M${pt(plotX(deg), P.bottom)}v${num(P.tick)}`;
    parts.push(`<path class="fl-axis" d="M${pt(P.x0, P.top)}V${num(P.bottom)}H${num(P.x1)}"></path>`);
    parts.push(`<path class="fl-tick" d="${ticks}"></path>`);
    for (const deg of [LO, UPRIGHT, HI]) text(plotX(deg), P.ticks, `${deg}°`, 'fl-scenery', 'middle', '', P.font);
    if (st.floor) {
      // The flat line's L as a floor under every tilt: the trace touches it only at the ends.
      parts.push(`<path class="fl-floor" data-mark="floor" d="M${pt(plotX(LO), plotY(FLAT.loss))}H${num(plotX(HI))}"></path>`);
      text(plotX(UPRIGHT), plotY(FLAT.loss) - 5, `flat, ${fmt(FLAT.loss)}`, 'fl-residual-text', 'middle', ' data-value="floor"', P.font);
    }
    if (st.trace !== null && st.trace > LO) {
      let path = '';
      for (let deg = LO; deg <= st.trace; deg++) path += `${deg === LO ? 'M' : 'L'}${pt(plotX(deg), plotY(fit(deg).loss))}`;
      parts.push(`<path class="fl-trace" data-mark="trace" data-to="${st.trace}" d="${path}"></path>`);
    }
    if (st.floor) circle(plotX(HI), plotY(FLAT.loss), P.ring, 'fl-ring', ' data-mark="flat-again"');
    if (st.peak) {
      circle(plotX(UPRIGHT), plotY(UP.loss), P.ring, 'fl-ring', ' data-mark="upright"');
      text(plotX(UPRIGHT), plotY(UP.loss) - 7, `upright, ${fmt(UP.loss)}`, 'fl-residual-text', 'middle', ' data-value="upright"', P.font);
    }
    circle(plotX(st.tilt), plotY(now.loss), P.dot, 'fl-dot', ` data-mark="dot"`);
    return parts.join('');
  }

  // The picture's accessible description: what is drawn now, and never a value or a tilt
  // the timeline has not reached.
  function describe(st) {
    const now = fit(st.tilt);
    const line = st.tilt === LO ? 'The flat line runs' : `The line, tilted ${st.tilt} degrees, runs`;
    const picture = `${COUNT} points on the planted curve. ${line} through their center, and each point is joined `
      + `to its foot on the line by a residual at a right angle: L = ${fmt(now.loss)}.`;
    let plot = `A small plot of L against tilt holds one dot, at tilt ${st.tilt}.`;
    if (st.trace === HI) {
      plot = `A small plot traces L against tilt from ${LO} to ${HI} degrees, lowest at both ends, where the line is flat`
        + (st.peak ? `, and highest, ${fmt(UP.loss)}, upright at ${UPRIGHT} degrees.` : '.');
    } else if (st.trace !== null && st.trace > LO) plot = `A small plot traces L against tilt from ${LO} to ${st.trace} degrees.`;
    return `${picture} ${plot}`;
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
    // A dragged dial turns the line and moves the dot; the trace and its marks stay what the
    // timeline has drawn so far.
    const st = dragged ? {...timeline(stage, f), tilt: override, labels: false, dragged: true} : timeline(stage, f);
    const now = fit(st.tilt);

    root.dataset.stage = String(stage);
    root.dataset.tilt = String(st.tilt);
    root.dataset.loss = String(now.loss);
    root.dataset.override = dragged ? 'dial' : '';

    const stateKey = [mode, JSON.stringify(st)].join('/');
    if (stateKey !== previousKey) {
      previousKey = stateKey;
      const [width, height] = MODES[mode].viewBox;
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      drawing.innerHTML = draw(st);
      formula.classList.toggle('fl-foot-lit', dragged || (stage >= 2 && stage <= 5));
      formula.classList.toggle('fl-norm-lit', !dragged && stage === 6);
    }
    const picture = describe(st);
    if (svg.getAttribute('aria-label') !== picture) svg.setAttribute('aria-label', picture);

    // The dial: the thumb, the readout and the one place its live values are spoken.
    slider.value = String(st.tilt);
    if (readout.textContent !== `${st.tilt}°`) readout.textContent = `${st.tilt}°`;
    slider.setAttribute('aria-valuetext', `tilt ${st.tilt} degrees: L = ${fmt(now.loss)}`);

    const sentence = dragged ? DRAG_CAPTION : stage in TURNING && f < ARRIVE[stage] ? TURNING[stage] : CAPTIONS[stage];
    if (captionKey !== sentence) { captionKey = sentence; caption.textContent = sentence; }
    return `${STAGES[stage]}.`;
  }

  // The dial is a detour, not a new default. Dragging pauses playback and redraws the whole
  // picture at the dragged tilt; any timeline action -- play from a pause, a scrub, an
  // arrow-key beat -- returns to the timeline's own tilt.
  function drag() {
    const requested = Math.max(LO, Math.min(HI, Math.round(Number(slider.value))));
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
  // the dragged tilt alone.
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
  // value text speaks the tilt, so the visible readout leaves the accessibility tree.
  slider.min = String(LO); slider.max = String(HI);
  $('[data-tilt-display]').setAttribute('aria-hidden', 'true');
  // Bound before the transport mounts, so it runs before the transport's own seek: the
  // scrubber is the timeline, and a scrub ends a detour.
  $('[data-controls] input[type="range"]').addEventListener('input', () => { override = null; });
  measure();
  window.BookPlayback(root, render, () => { measure(); previousKey = ''; render(lastTime, reduced); });
  typeset();
})();
