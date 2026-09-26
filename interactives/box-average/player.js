// The moving average, one window at a time.
//
// Contract with interactives/shared/playback.js:
//   window.BookPlayback(root, render, layout?)
//   render(time, reduced) -> the scrubber's description; a pure function of
//     (time, reduced) that never measures the DOM.
//   layout() -> the only place that measures.
//
// One picture: the chapter's 300 noisy samples, a window nine samples wide, and a
// magnified view that travels with the window. The tracked object is the window. In the
// magnified view each covered sample shrinks to a ninth of its height and the nine pieces
// are laid end to end: that is multiplying by the weights and summing, and where the
// pieces end is the average, which lands at the window's centre. Two stills (the noisy
// row, and the row with its smooth curve) lose exactly that: which nine samples made each
// average, with what weights, and why the centre never reaches the first or last four.
(() => {
  const root = document.getElementById('box-average-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  // The panel is the one in-repo mirror of the manuscript fixture
  // (chapters/part2/07-filters-convolution.qmd:51-67): the seeded samples of the
  // moving-average-values cell and the width of torch.full((9,), 1 / 9).
  const X = root.dataset.samples.trim().split(/\s+/).map(Number);
  const K = Number(root.dataset.width), HALF = (K - 1) / 2, N = X.length;
  // Each average belongs to the centre of its window: F.conv1d with no padding gives
  // N - K + 1 of them, and the chapter plots them against t[HALF:-HALF].
  const AVERAGES = Array.from({length: N - K + 1}, (_, i) => {
    let sum = 0;
    for (let k = 0; k < K; k++) sum += X[i + k] / K;
    return sum;
  });
  const FIRST = HALF, LAST = N - 1 - HALF;          // the first and last centres

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = svg.querySelector('[data-drawing]');
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration || beats.at(-1));
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);
  const STAGES = ['Ask', 'The weights', 'One average', 'Slide', 'The whole signal', 'Hold',
    'The ends', 'Keep the slide'];
  const CAPTIONS = [
    'Each average lands at the window’s centre. Which samples will never get one of their own?',
    'Nine samples under the window, and nine equal weights of one ninth each.',
    'Each sample shrinks to a ninth, and the nine pieces stack into one average.',
    'Slide one sample right: a new window, a new stack, the next average.',
    'The same nine-weight stack, repeated at every position along the signal.',
    'The window has reached the last sample. Which samples never got an average?',
    'The first four and the last four: the centre never reaches them. 300 samples, 292 averages.',
    'Keep the slide, change the nine numbers: every filter in this chapter makes this move.'
  ];
  const STEPS = 5;                                   // slow steps in the Slide beat

  const MINUS = '−';
  const fixed = (value, places = 2) => value.toFixed(places).replace('-', MINUS);
  const num = value => String(Number(value.toFixed(4)));
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const ease = v => v * v * (3 - 2 * v);

  const MODES = {
    wide: {
      viewBox: '0 0 713 364', font: 13,
      plot: {x0: 40, x1: 690, top: 186, bottom: 314, unit: 34},
      lens: {w: 268, h: 138, top: 12, pitch: 26, zero: 100, unit: 80},
      ends: 334, count: 354
    },
    narrow: {
      viewBox: '0 0 296 384', font: 11,
      plot: {x0: 14, x1: 282, top: 206, bottom: 326, unit: 30},
      lens: {w: 268, h: 148, top: 12, pitch: 26, zero: 108, unit: 80},
      ends: 346, count: 368
    }
  };

  let lastTime = 0, reduced = false, previousKey = '', captionKey = '', mode = 'wide';
  function measure() {
    mode = (figure.getBoundingClientRect().width || 600) < 600 ? 'narrow' : 'wide';
  }

  function draw(state) {
    const g = MODES[mode], p = g.plot, L = g.lens;
    const {centre, written, lensAlpha, shrink, gather, showAverage, ends, dot} = state;
    const parts = [];
    const dx = (p.x1 - p.x0) / (N - 1);
    const xOf = i => p.x0 + i * dx;
    const zero = (p.top + p.bottom) / 2;
    const yOf = v => zero - v * p.unit;
    const text = (x, y, content, cls, anchor = 'middle', extra = '', size = g.font) =>
      parts.push(`<text x="${num(x)}" y="${num(y)}" class="${cls}" font-size="${size}" text-anchor="${anchor}"${extra}>${content}</text>`);

    // Scenery: the zero line of the signal.
    parts.push(`<line class="ba-rule" x1="${num(p.x0)}" y1="${num(zero)}" x2="${num(p.x1)}" y2="${num(zero)}"></line>`);
    // The window, which is the tracked object: nine samples wide on the page.
    const left = xOf(centre - HALF) - dx / 2, right = xOf(centre + HALF) + dx / 2;
    parts.push(`<rect class="ba-window" data-mark="window" x="${num(left)}" y="${num(p.top - 6)}" `
      + `width="${num(right - left)}" height="${num(p.bottom - p.top + 10)}" rx="3"></rect>`);
    // The samples; the nine under the window are drawn heavier.
    const lo = Math.round(centre) - HALF, hi = Math.round(centre) + HALF;
    X.forEach((v, i) => {
      const covered = i >= lo && i <= hi;
      parts.push(`<circle class="ba-sample${covered ? ' ba-covered' : ''}" cx="${num(xOf(i))}" cy="${num(yOf(v))}" r="${covered ? 2.3 : 1.5}"></circle>`);
    });
    // The averages written so far, each at the centre of its window.
    if (written > 0) {
      const d = AVERAGES.slice(0, written).map((v, i) => `${i ? 'L' : 'M'}${num(xOf(FIRST + i))} ${num(yOf(v))}`).join('');
      parts.push(`<path class="ba-curve" data-mark="curve" d="${d}"></path>`);
      if (dot) {
        const last = written - 1;
        parts.push(`<circle class="ba-average" data-mark="average" cx="${num(xOf(FIRST + last))}" cy="${num(yOf(AVERAGES[last]))}" r="3.6"></circle>`);
      }
    }

    // The magnified view, travelling with the window. It is a strip seen through a lens:
    // when the window steps one sample right the lens moves a hair on the page and its
    // contents scroll one stem to the left, so the new sample enters on the right.
    if (lensAlpha > 0) {
      const width = mode === 'wide' ? 713 : 296;
      const lensX = Math.max(8, Math.min(xOf(centre) - L.w / 2, width - 8 - L.w));
      const mid = lensX + L.w / 2, z = L.top + L.zero;
      const opacity = lensAlpha < 1 ? ` opacity="${num(lensAlpha)}"` : '';
      parts.push(`<g data-mark="lens"${opacity}>`);
      parts.push(`<line class="ba-leader" x1="${num(lensX)}" y1="${num(L.top + L.h)}" x2="${num(left)}" y2="${num(p.top - 6)}"></line>`);
      parts.push(`<line class="ba-leader" x1="${num(lensX + L.w)}" y1="${num(L.top + L.h)}" x2="${num(right)}" y2="${num(p.top - 6)}"></line>`);
      parts.push(`<rect class="ba-lens" x="${num(lensX)}" y="${num(L.top)}" width="${L.w}" height="${L.h}" rx="6"></rect>`);
      parts.push(`<line class="ba-rule" x1="${num(lensX + 8)}" y1="${num(z)}" x2="${num(lensX + L.w - 8)}" y2="${num(z)}"></line>`);
      text(lensX + 10, L.top + 17, `each weight \u00d7 1/${K}`, 'ba-scenery', 'start', '', g.font - 1);
      // One stem per sample. While a window is being averaged its nine stems shrink to a
      // ninth and gather, head to tail, onto the centre stem; what they add up to is the
      // average, drawn in green where the centre stem stood.
      let running = 0;
      for (let i = Math.floor(centre) - HALF - 1; i <= Math.ceil(centre) + HALF + 1; i++) {
        if (i < 0 || i >= N) continue;
        const offset = i - centre, fade = clamp01(HALF + 1 - Math.abs(offset));
        if (fade <= 0) continue;
        const inside = Math.abs(offset) <= HALF + 1e-9;
        const v = X[i], stemX = mid + offset * L.pitch;
        if (!inside || shrink === 0) {
          const faded = fade < 1 ? ` opacity="${num(fade)}"` : (showAverage ? ' opacity="0.35"' : '');
          parts.push(`<line class="ba-stem" data-mark="stem-${i}" x1="${num(stemX)}" y1="${num(z)}" x2="${num(stemX)}" y2="${num(z - v * L.unit)}"${faded}></line>`);
          continue;
        }
        const piece = v * (1 - (1 - 1 / K) * shrink);
        const base = running * gather, x = stemX + (mid - stemX) * gather;
        const y0 = z - base * L.unit, y1 = z - (base + piece) * L.unit;
        if (!showAverage) {
          parts.push(`<line class="ba-stem" data-mark="stem-${i}" x1="${num(x)}" y1="${num(y0)}" x2="${num(x)}" y2="${num(y1)}"></line>`);
        } else {
          parts.push(`<line class="ba-stem" data-mark="stem-${i}" x1="${num(stemX)}" y1="${num(z)}" x2="${num(stemX)}" y2="${num(z - v * L.unit)}" opacity="0.35"></line>`);
        }
        running += v / K;
      }
      if (showAverage) {
        const mean = AVERAGES[Math.round(centre) - FIRST], top = z - mean * L.unit;
        parts.push(`<line class="ba-result" data-mark="lens-average" x1="${num(mid)}" y1="${num(z)}" x2="${num(mid)}" y2="${num(top)}"></line>`);
        parts.push(`<circle class="ba-average" cx="${num(mid)}" cy="${num(top)}" r="4.4"></circle>`);
        text(mid, top - 10, fixed(mean), 'ba-prediction-text ba-number', 'middle', ' data-value="lens-average"');
      }
      parts.push('</g>');
    }

    // The ends: samples that are never the centre of a window.
    if (ends > 0) {
      const opacity = ends < 1 ? ` opacity="${num(ends)}"` : '';
      for (const [from, to, anchor, x] of [[0, FIRST - 1, 'start', p.x0], [LAST + 1, N - 1, 'end', p.x1]]) {
        const a = xOf(from) - dx / 2, b = xOf(to) + dx / 2, y = g.ends - 12;
        parts.push(`<path class="ba-end" data-mark="end-${from}" d="M${num(a)} ${num(y - 4)}V${num(y)}H${num(b)}V${num(y - 4)}"${opacity}></path>`);
        text(x, g.ends, `${HALF} without an average`, 'ba-scenery', anchor, opacity, g.font - 1);
      }
      text((p.x0 + p.x1) / 2, g.count, `${AVERAGES.length} averages`, 'ba-prediction-text ba-number', 'middle', ` data-value="count"${opacity}`);
    }
    return parts.join('');
  }

  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const clamped = Math.max(0, Math.min(duration, time));
    const stage = stageAt(clamped);
    // Reduced motion holds each beat's finished state, so the still is the one its
    // caption describes.
    const end = beats[stage + 1] === undefined ? duration : beats[stage + 1];
    const held = reducedMotion ? end - 1e-6 : clamped;
    const span = end - beats[stage];
    const f = span > 0 ? clamp01((held - beats[stage]) / span) : 1;

    let centre = FIRST, written = 0, lensAlpha = 0, shrink = 0, gather = 0, showAverage = false;
    let ends = 0, dot = false;
    if (stage === 1) { lensAlpha = ease(clamp01(f / 0.4)); }
    if (stage === 2) {
      lensAlpha = 1;
      shrink = ease(clamp01(f / 0.35));
      gather = ease(clamp01((f - 0.35) / 0.35));
      showAverage = f >= 0.7;
      written = showAverage ? 1 : 0; dot = showAverage;
    }
    if (stage === 3) {
      // Five slow steps: each glides over its first four tenths, then its average lands.
      const step = Math.min(STEPS, f * STEPS), whole = Math.floor(step), part = step - whole;
      const glide = whole >= STEPS ? 0 : ease(clamp01(part / 0.4));
      centre = FIRST + whole + glide;
      const landed = whole + (whole < STEPS && part >= 0.4 ? 1 : 0);
      written = 1 + Math.min(STEPS, landed);
      const gliding = whole < STEPS && part < 0.4;
      lensAlpha = 1; shrink = gliding ? 0 : 1; gather = gliding ? 0 : 1; showAverage = !gliding; dot = true;
    }
    if (stage === 4) {
      // The magnified view folds away, then the window sweeps the rest of the signal.
      lensAlpha = 1 - clamp01(f / 0.15);
      shrink = 1; gather = 1; showAverage = lensAlpha > 0 && Number.isInteger(centre);
      const sweep = ease(clamp01((f - 0.1) / 0.7));
      const from = FIRST + STEPS;
      centre = from + (LAST - from) * sweep;
      written = Math.floor(centre) - FIRST + 1;
      dot = sweep < 1;
    }
    if (stage >= 5) {
      // The lens opens again on the last window, pinned against the end of the signal:
      // four samples after its centre and none beyond, so the centre can go no further.
      centre = LAST; written = AVERAGES.length;
      lensAlpha = stage === 5 ? ease(clamp01(f / 0.3)) : 1;
      shrink = 1; gather = 1; showAverage = true;
    }
    if (stage >= 6) ends = stage === 6 ? ease(clamp01(f / 0.3)) : 1;

    root.dataset.stage = String(stage);
    root.dataset.centre = String(Math.round(centre));
    root.dataset.written = String(written);
    root.dataset.lens = lensAlpha > 0 ? 'open' : 'closed';

    const stateKey = [stage, mode, centre.toFixed(3), written, lensAlpha.toFixed(3), shrink.toFixed(3),
      gather.toFixed(3), showAverage, ends.toFixed(3), dot].join('/');
    if (stateKey !== previousKey) {
      previousKey = stateKey;
      svg.setAttribute('viewBox', MODES[mode].viewBox);
      drawing.innerHTML = draw({centre, written, lensAlpha, shrink, gather, showAverage, ends, dot});
      formula.classList.toggle('ba-weight-lit', stage === 1 || stage === 2);
      formula.classList.toggle('ba-sum-lit', stage === 2 || stage === 3);
      formula.classList.toggle('ba-count-lit', stage >= 6);
    }

    const sentence = CAPTIONS[stage];
    if (captionKey !== sentence) { captionKey = sentence; caption.textContent = sentence; }
    return `${STAGES[stage]}. ${written} of ${AVERAGES.length} averages written.`;
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
