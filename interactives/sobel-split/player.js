// The vertical Sobel kernel, read as two operations.
//
// Contract with interactives/shared/playback.js:
//   window.BookPlayback(root, render, layout?)
//   render(time, reduced) -> the scrubber's description; a pure function of
//     (time, reduced) that never measures the DOM.
//   layout() -> the only place that measures.
//
// One picture: the top-left corner of the chapter's rectangle, a three-by-three frame,
// and the arithmetic of the patch under it. The tracked object is the frame. Its nine
// numbers are a column times a row, so at every position it takes right minus left in
// each row and averages the three differences 1, 2, 1. The motion carries the claim two
// stills cannot: the same frame, on two edges of the same rectangle, answers 3.6 on the
// side and 0 on the top, because the top's change runs down the rows and the kernel only
// compares across them.
(() => {
  const root = document.getElementById('sobel-split-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  const numbersOf = name => root.dataset[name].trim().split(/\s+/).map(Number);
  // The panel is the one in-repo mirror of the manuscript fixture
  // (chapters/part2/07-filters-convolution.qmd:163-176): the kernel as the zoo writes it
  // and the rectangle make_shapes paints.
  const KERNEL = numbersOf('kernel'), ALONG = numbersOf('along'), ACROSS = numbersOf('across');
  const [R0, R1, C0, C1] = numbersOf('rect'), LEVEL = Number(root.dataset.level);
  const [TOP, LEFT, SIZE] = numbersOf('crop');
  const STOPS = numbersOf('stops');
  const stop = k => ({r: STOPS[2 * k], c: STOPS[2 * k + 1]});
  // The crop of make_shapes(): the rectangle's pixels are LEVEL, every other pixel 0.
  const pixel = (r, c) => {
    const row = TOP + r, col = LEFT + c;
    return row >= R0 && row < R1 && col >= C0 && col < C1 ? LEVEL : 0;
  };
  // The kernel applied the way the code applies it: nine products, summed.
  const respond = (r, c) => {
    let h = 0;
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) h += KERNEL[3 * a + b] * pixel(r - 1 + a, c - 1 + b);
    return h;
  };
  // The same response read as two operations: a difference across each row, then an
  // average of the three differences down the column.
  const rows = (r, c) => [0, 1, 2].map(a => {
    const d = ACROSS.reduce((sum, w, b) => sum + w * pixel(r - 1 + a, c - 1 + b), 0);
    return {d, weighted: ALONG[a] * d};
  });

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = svg.querySelector('[data-drawing]');
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration || beats.at(-1));
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);
  const STAGES = ['Ask', 'Two jobs', 'A flat patch', 'The left side', 'Hold', 'The top',
    'Everywhere', 'The lesson'];
  const CAPTIONS = [
    'The rectangle’s left side and its top are both edges. Which will the vertical Sobel kernel see?',
    'Nine numbers, two jobs: a difference across each row, and a 1, 2, 1 average down the rows.',
    'Inside the rectangle every row is flat: right minus left is zero, so the kernel stays silent.',
    'On the left side every row climbs by 0.9. Averaged 1, 2, 1, that makes 3.6.',
    'The top is an edge too, dark above and bright below. Predict the response.',
    'Every row is flat again. The change runs down the rows, and this kernel only compares across.',
    'Everywhere at once: the left side lights up, and the top stays silent.',
    'Average along the edge, difference across it: that is a vertical-edge detector.'
  ];
  // Which stop the frame is heading for in each beat; null once it sweeps the map.
  const TARGET = [0, 0, 0, 1, 2, 2, null, null];

  const MINUS = '−';
  const fixed = (value, places = 1) => {
    const text = Math.abs(value) < 1e-9 ? '0' : value.toFixed(places);
    return text.replace('-', MINUS);
  };
  const num = value => String(Number(value.toFixed(4)));
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const ease = v => v * v * (3 - 2 * v);
  const CENTRES = [];
  for (let r = 1; r < SIZE - 1; r++) for (let c = 1; c < SIZE - 1; c++) CENTRES.push({r, c});
  const MAX = Math.max(...CENTRES.map(({r, c}) => Math.abs(respond(r, c))));

  const MODES = {
    wide: {
      viewBox: '0 0 713 320', font: 13, cell: 30, image: [52, 44],
      panel: {x: 340, label: 340, bar: 424, rows: [110, 150, 190], sum: 250, unit: 62, title: 72}
    },
    narrow: {
      viewBox: '0 0 296 480', font: 12, cell: 30, image: [36, 36],
      panel: {x: 12, label: 12, bar: 72, rows: [324, 356, 388], sum: 436, unit: 52, title: 298}
    }
  };

  let lastTime = 0, reduced = false, previousKey = '', captionKey = '', mode = 'wide';
  function measure() {
    mode = (figure.getBoundingClientRect().width || 600) < 600 ? 'narrow' : 'wide';
  }

  function draw(state) {
    const g = MODES[mode], P = g.panel, s = g.cell, [ix, iy] = g.image;
    const {frame, factors, show, pending, map} = state;
    const parts = [];
    const text = (x, y, content, cls, anchor = 'middle', extra = '', size = g.font) =>
      parts.push(`<text x="${num(x)}" y="${num(y)}" class="${cls}" font-size="${size}" text-anchor="${anchor}"${extra}>${content}</text>`);
    const cx = c => ix + (c + 0.5) * s, cy = r => iy + (r + 0.5) * s;

    // The image: the rectangle's corner, bright where make_shapes painted it.
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        parts.push(`<rect class="${pixel(r, c) > 0 ? 'sb-bright' : 'sb-dark'}" x="${ix + c * s}" y="${iy + r * s}" width="${s}" height="${s}"></rect>`);
      }
    }
    text(ix + (SIZE - 0.5) * s, iy + (SIZE - 0.5) * s + 4, fixed(LEVEL), 'sb-on-bright', 'middle', '', g.font - 1);
    text(ix + 0.5 * s, iy + 0.5 * s + 4, '0', 'sb-scenery', 'middle', '', g.font - 1);

    // The responses already written, each at the centre of the patch that made it.
    map.forEach(({r, c, h}) => {
      if (Math.abs(h) < 1e-9) {
        parts.push(`<circle class="sb-silent" data-mark="silent-${r}-${c}" cx="${num(cx(c))}" cy="${num(cy(r))}" r="2.6"></circle>`);
      } else {
        parts.push(`<circle class="sb-response" data-mark="response-${r}-${c}" cx="${num(cx(c))}" cy="${num(cy(r))}" r="${num(3 + 9 * Math.abs(h) / MAX)}"></circle>`);
      }
    });

    // The frame and its two factors, carried in the margins so they never cover a pixel:
    // the row weights down the left, the column weights along the top.
    if (frame) {
      const left = ix + (frame.c - 1) * s, top = iy + (frame.r - 1) * s;
      parts.push(`<rect class="sb-frame" data-mark="frame" x="${num(left)}" y="${num(top)}" width="${3 * s}" height="${3 * s}" rx="2"></rect>`);
      if (factors > 0) {
        const opacity = factors < 1 ? ` opacity="${num(factors)}"` : '';
        ACROSS.forEach((w, b) => text(left + (b + 0.5) * s, iy - 8, w > 0 ? `+${w}` : fixed(w, 0), 'sb-ink sb-factor', 'middle', opacity, g.font - 1));
        ALONG.forEach((w, a) => text(ix - 6, top + (a + 0.5) * s + 4, `×${w}`, 'sb-ink sb-factor', 'end', opacity, g.font - 1));
        // Inside the frame: the left pixel is subtracted, the right one added, the middle
        // column ignored. Marked on the frame so the reader sees where each sign falls.
        for (let a = 0; a < 3; a++) {
          text(left + 0.5 * s, top + (a + 0.5) * s + 5, MINUS, 'sb-sign', 'middle', opacity, g.font + 2);
          text(left + 2.5 * s, top + (a + 0.5) * s + 5, '+', 'sb-sign', 'middle', opacity, g.font + 2);
        }
        parts.push(`<rect class="sb-ignored" x="${num(left + s)}" y="${num(top)}" width="${s}" height="${3 * s}"${opacity}></rect>`);
      }
    }

    // The arithmetic of the patch under the frame: three differences, weighted and laid
    // end to end into one response.
    if (show) {
      const opacity = show.alpha < 1 ? ` opacity="${num(show.alpha)}"` : '';
      text(P.label, P.title, 'each row: right − left', 'sb-scenery', 'start', opacity);
      let offset = 0;
      show.rows.forEach(({d, weighted}, a) => {
        const y = P.rows[a];
        text(P.label, y + 5, `×${ALONG[a]}`, 'sb-ink', 'start', opacity);
        const length = weighted * P.unit;
        // Before they join, each weighted difference sits on its own row; as they join
        // they slide down onto the response line, each starting where the last one ends.
        const x = P.bar + offset * P.unit * show.join, top = y - 7 + (P.sum - y) * show.join;
        // Once joined, each row keeps a faint copy of what it contributed, so the three
        // rows still say where the response came from.
        if (show.join >= 1 && Math.abs(length) > 0.5) {
          parts.push(`<rect class="sb-difference sb-ghost" x="${num(P.bar)}" y="${num(y - 7)}" width="${num(Math.abs(length))}" height="14" rx="2"${opacity}></rect>`);
        }
        if (Math.abs(length) > 0.5) {
          parts.push(`<rect class="sb-difference" data-mark="difference-${a}" x="${num(x)}" y="${num(top)}" width="${num(Math.abs(length))}" height="14" rx="2"${opacity}></rect>`);
        } else {
          parts.push(`<line class="sb-zero" data-mark="difference-${a}" x1="${num(P.bar)}" y1="${num(y - 7)}" x2="${num(P.bar)}" y2="${num(y + 7)}"${opacity}></line>`);
        }
        text(P.bar + Math.abs(length) + 8, y + 5, `d = ${fixed(d)}`, show.join >= 1 ? 'sb-scenery' : 'sb-ink', 'start', opacity, g.font - 1);
        offset += weighted;
      });
      text(P.label, P.sum + 5, 'response', 'sb-prediction-text', 'start', opacity);
      if (show.join >= 1) {
        const h = offset;
        if (Math.abs(h) > 1e-9) parts.push(`<rect class="sb-total" x="${num(P.bar)}" y="${num(P.sum - 8)}" width="${num(Math.abs(h) * P.unit)}" height="16" rx="3"${opacity}></rect>`);
        text(P.bar + Math.abs(h) * P.unit + 10, P.sum + 6, fixed(h), 'sb-prediction-text sb-number', 'start', ` data-value="response"${opacity}`);
      }
    }
    if (pending) {
      text(P.label, P.title, 'each row: right − left', 'sb-scenery', 'start');
      text(P.label, P.sum + 5, 'response', 'sb-prediction-text', 'start');
      text(P.bar + 10, P.sum + 6, '·', 'sb-prediction-text sb-number', 'start', ' data-value="response"');
    }
    // Once the frame has visited everything, the panel becomes the map's legend.
    if (state.legend) {
      const opacity = state.legend < 1 ? ` opacity="${num(state.legend)}"` : '';
      const [y1, y2] = [P.rows[0], P.rows[2]];
      parts.push(`<circle class="sb-response" cx="${num(P.label + 12)}" cy="${num(y1)}" r="12"${opacity}></circle>`);
      text(P.label + 34, y1 + 5, `${fixed(MAX)}: every row climbs`, 'sb-prediction-text sb-number', 'start', ` data-value="legend-max"${opacity}`);
      parts.push(`<circle class="sb-silent" cx="${num(P.label + 12)}" cy="${num(y2)}" r="2.6"${opacity}></circle>`);
      text(P.label + 34, y2 + 5, '0: every row is flat', 'sb-ink', 'start', opacity);
    }
    return parts.join('');
  }

  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const clamped = Math.max(0, Math.min(duration, time));
    const stage = stageAt(clamped);
    const end = beats[stage + 1] === undefined ? duration : beats[stage + 1];
    const held = reducedMotion ? end - 1e-6 : clamped;
    const span = end - beats[stage];
    const f = span > 0 ? clamp01((held - beats[stage]) / span) : 1;

    // The frame glides to its stop over the first four tenths of a beat; the arithmetic
    // of the new patch appears once it has arrived, and joins over the next three tenths.
    let frame = null, factors = stage >= 1 ? (stage === 1 ? ease(clamp01(f / 0.4)) : 1) : 0;
    let show = null, pending = false, map = [], legend = 0;
    if (TARGET[stage] !== null) {
      const to = stop(TARGET[stage]);
      const fromIndex = stage > 0 && TARGET[stage - 1] !== null ? TARGET[stage - 1] : TARGET[stage];
      const from = stop(fromIndex);
      const glide = fromIndex === TARGET[stage] ? 1 : ease(clamp01(f / 0.4));
      frame = {r: from.r + (to.r - from.r) * glide, c: from.c + (to.c - from.c) * glide};
      const arrived = glide >= 1;
      if ((stage === 2 || stage === 3 || stage === 5) && arrived) {
        const start = fromIndex === TARGET[stage] ? 0 : 0.4;
        const appear = clamp01((f - start) / 0.15), join = ease(clamp01((f - start - 0.2) / 0.3));
        if (appear > 0) show = {rows: rows(to.r, to.c), alpha: appear, join};
      }
      if (stage === 4) pending = true;
    } else {
      // Everywhere: the frame sweeps the valid positions in reading order, leaving each
      // response behind; then the panel turns into the map's legend.
      const sweep = stage === 6 ? clamp01(f / 0.7) : 1;
      const count = Math.round(sweep * CENTRES.length);
      map = CENTRES.slice(0, count).map(({r, c}) => ({r, c, h: respond(r, c)}));
      if (count < CENTRES.length) frame = CENTRES[count];
      // A sweep is about what the frame leaves behind, so it travels bare: no factors,
      // no signs, only its outline.
      factors = 0;
      legend = stage === 6 ? ease(clamp01((f - 0.7) / 0.2)) : 1;
    }

    const at = frame ? {r: Math.round(frame.r), c: Math.round(frame.c)} : null;
    root.dataset.stage = String(stage);
    root.dataset.frame = at ? `${at.r} ${at.c}` : '';
    root.dataset.response = show && show.join >= 1 ? fixed(show.rows.reduce((s, row) => s + row.weighted, 0)) : '';
    root.dataset.mapped = String(map.length);

    const stateKey = [stage, mode, frame ? `${frame.r.toFixed(3)},${frame.c.toFixed(3)}` : 'x', factors.toFixed(3),
      show ? `${show.alpha.toFixed(3)}/${show.join.toFixed(3)}` : 'x', pending, map.length, legend.toFixed(3)].join('/');
    if (stateKey !== previousKey) {
      previousKey = stateKey;
      svg.setAttribute('viewBox', MODES[mode].viewBox);
      drawing.innerHTML = draw({frame, factors, show, pending, map, legend});
      formula.classList.toggle('sb-factors-lit', stage === 1);
      formula.classList.toggle('sb-across-lit', stage === 2 || stage === 3 || stage === 5);
      formula.classList.toggle('sb-along-lit', stage === 3);
    }

    const sentence = CAPTIONS[stage];
    if (captionKey !== sentence) { captionKey = sentence; caption.textContent = sentence; }
    const response = root.dataset.response;
    return `${STAGES[stage]}. ${response ? `Response ${response}.` : stage === 4 ? 'Response withheld.' : ''}`.trim();
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
