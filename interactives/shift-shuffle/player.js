// Why a scramble is free and a slide is not.
//
// Contract with interactives/shared/playback.js:
//   window.BookPlayback(root, render, layout?)
//   render(time, reduced) -> the scrubber's description; a pure function of
//     (time, reduced) that never measures the DOM.
//   layout() -> the only place that measures.
//
// One picture: a row of pixels, a row of weights, the product of each pair, and the sum
// they make drawn as a bar. The tracked object is a column -- a pixel, its weight and
// their product travelling together. A permutation slides every column to a new slot
// with its product intact; a slide moves the pixels alone and the products are remade.
// Two stills show two totals and lose the only thing that matters: whether the terms
// that made the first total are the same terms that made the second.
(() => {
  const root = document.getElementById('shift-shuffle-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  // The panel is the one in-repo mirror of the fixture. The chapter prints no weight and
  // no pixel value, so this row is a declared schematic; the two operations are the
  // chapter's own (chapters/part1/06-generalization-inductive-bias.qmd:108-230).
  const numbersOf = name => root.dataset[name].trim().split(/\s+/).map(Number);
  const W = numbersOf('weights'), X = numbersOf('pixels');
  const PERM = numbersOf('permutation'), SHIFT = Number(root.dataset.shift);
  const N = W.length;
  const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
  const BASE = dot(W, X);
  // The chapter's shift_right: values move right, zeros enter at the left, and what
  // runs off the end is lost.
  const SLID = X.map((_, i) => (i < SHIFT ? 0 : X[i - SHIFT]));
  const AFTER = dot(W, SLID);

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = svg.querySelector('[data-drawing]');
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration || beats.at(-1));
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);
  const STAGES = ['Ask', 'The sum', 'Hold', 'Scrambled together', 'Hold', 'Slid',
    'Compare', 'The lesson'];
  const CAPTIONS = [
    'Eight pixels, eight weights. Each weight meets exactly one pixel.',
    'Multiply each pair, add the eight products: that is the unit’s score.',
    'Scramble the positions and retrain, so the weights scramble too. Does the score change?',
    'Every column moved, and every product travelled with it. Same terms, same total.',
    'Back in place. Now slide only the pixels two to the right, with no retraining. Same question?',
    'Each weight meets a different pixel now. The products are remade.',
    'Against the score the same weights gave in place, the sum has moved.',
    'Order is nothing to a sum. Pairing is everything.'
  ];
  // Which arrangement each beat holds, and whether its move is still running.
  const ARRANGE = ['home', 'home', 'home', 'perm', 'home', 'slide', 'slide', 'slide'];

  const MINUS = '−';
  const fixed = (value, places = 2) => value.toFixed(places).replace('-', MINUS);
  const num = value => String(Number(value.toFixed(4)));

  const MODES = {
    wide: {
      viewBox: '0 0 713 330', box: [713, 330], font: 13,
      pitch: 60, bar: 38, first: 100,
      pixelBase: 76, pixelUnit: 46, weightZero: 140, weightUnit: 42,
      productZero: 224, productUnit: 54,
      label: 64, labelAnchor: 'end', labels: {pixels: 80, weights: 144, products: 228},
      score: {x: 72, y: 282, h: 16, unit: 190, label: [64, 294], anchor: 'end'}
    },
    narrow: {
      viewBox: '0 0 296 392', box: [296, 392], font: 11,
      pitch: 30, bar: 20, first: 40,
      pixelBase: 92, pixelUnit: 42, weightZero: 168, weightUnit: 38,
      productZero: 262, productUnit: 48,
      label: 14, labelAnchor: 'start', labels: {pixels: 36, weights: 112, products: 206},
      score: {x: 14, y: 330, h: 16, unit: 168, label: [14, 320], anchor: 'start', above: [282, 320]}
    }
  };

  let lastTime = 0, reduced = false, previousKey = '', captionKey = '', mode = 'wide';
  function measure() {
    mode = (figure.getBoundingClientRect().width || 600) < 600 ? 'narrow' : 'wide';
  }

  function draw(state) {
    const g = MODES[mode];
    const {stage, slots, slide, products, score, reference} = state;
    const parts = [];
    const centre = slot => g.first + g.pitch * slot;
    const text = (x, y, content, cls, anchor = 'middle', extra = '', size = g.font) =>
      parts.push(`<text x="${num(x)}" y="${num(y)}" class="${cls}" font-size="${size}" text-anchor="${anchor}"${extra}>${content}</text>`);
    const bar = (x, top, height, cls, extra = '') =>
      parts.push(`<rect class="${cls}" x="${num(x - g.bar / 2)}" y="${num(top)}" width="${g.bar}" height="${num(Math.max(height, 0.6))}" rx="2"${extra}></rect>`);

    parts.push(`<line class="sx-rule" x1="${num(centre(0) - g.pitch / 2)}" y1="${num(g.pixelBase)}" x2="${num(centre(N - 1) + g.pitch / 2)}" y2="${num(g.pixelBase)}"></line>`);
    parts.push(`<line class="sx-rule" x1="${num(centre(0) - g.pitch / 2)}" y1="${num(g.weightZero)}" x2="${num(centre(N - 1) + g.pitch / 2)}" y2="${num(g.weightZero)}"></line>`);
    parts.push(`<line class="sx-rule" x1="${num(centre(0) - g.pitch / 2)}" y1="${num(g.productZero)}" x2="${num(centre(N - 1) + g.pitch / 2)}" y2="${num(g.productZero)}"></line>`);
    text(g.label, g.labels.pixels, 'pixels', 'sx-feature-text', g.labelAnchor);
    text(g.label, g.labels.weights, 'weights', 'sx-parameter-text', g.labelAnchor);
    text(g.label, g.labels.products, 'product', 'sx-scenery', g.labelAnchor);

    // Weights sit at their own slot and never move unless the whole column does.
    slots.forEach(({index, at}) => {
      const x = centre(at), w = W[index];
      bar(x, w >= 0 ? g.weightZero - w * g.weightUnit : g.weightZero, Math.abs(w) * g.weightUnit,
        'sx-parameter', ` data-mark="weight-${index}"`);
    });
    // Pixels ride the same slots, and slide across them on the last move.
    slots.forEach(({index, at}) => {
      const place = at + slide, value = X[index];
      // What the slide pushes past the last slot is lost, as shift_right loses it: the
      // bar fades out over its final slot rather than being drawn outside the grid.
      const alpha = Math.max(0, Math.min(1, (N - 0.2 - place) / 0.8));
      if (alpha <= 0) return;
      bar(centre(place), g.pixelBase - value * g.pixelUnit, value * g.pixelUnit,
        'sx-feature', ` data-mark="pixel-${index}"${alpha < 1 ? ` opacity="${num(alpha)}"` : ''}`);
    });
    // The two zeros the chapter's shift_right pushes in at the left, once they arrive.
    if (slide > 0) {
      for (let s = 0; s < Math.min(N, Math.round(slide)); s++) {
        parts.push(`<circle class="sx-empty" data-mark="empty-${s}" cx="${num(centre(s))}" cy="${num(g.pixelBase - 5)}" r="3.4"></circle>`);
      }
    }
    // Products: present only when a pairing is settled, because a pairing in motion has
    // no product. During the permutation they travel with their column.
    if (products) {
      products.forEach(({slot, value, mark}) => {
        bar(centre(slot), value >= 0 ? g.productZero - value * g.productUnit : g.productZero,
          Math.abs(value) * g.productUnit, 'sx-product', ` data-mark="product-${mark}"`);
      });
    }

    // The score, drawn as a length so the comparison is not a digit string.
    const s = g.score;
    if (reference !== null) {
      parts.push(`<rect class="sx-reference" data-mark="reference" x="${num(s.x)}" y="${num(s.y + s.h + 6)}" width="${num(reference * s.unit)}" height="9" rx="3"></rect>`);
      text(s.x + reference * s.unit + 8, s.y + s.h + 14, `${fixed(reference)} in place`, 'sx-scenery', 'start', '', g.font - 1);
    }
    text(s.label[0], s.label[1], 'score', 'sx-prediction-text', s.anchor);
    if (score !== null) {
      parts.push(`<rect class="sx-score" data-mark="score" x="${num(s.x)}" y="${num(s.y)}" width="${num(score * s.unit)}" height="${s.h}" rx="3"></rect>`);
    }
    // Narrow has no room to the right of a full-length bar, so the number sits above it.
    if (s.above) {
      text(s.above[0], s.above[1], score === null ? '·' : fixed(score),
        'sx-prediction sx-number', 'end', ' data-value="score"');
    } else {
      text(s.x + (score === null ? 0 : score * s.unit) + 10, s.y + s.h - 3,
        score === null ? '·' : fixed(score), 'sx-prediction sx-number', 'start', ' data-value="score"');
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
    const f = span > 0 ? Math.max(0, Math.min(1, (held - beats[stage]) / span)) : 1;
    // A move runs over the first seven tenths of its beat and the result stands for the
    // rest, so every caption has a settled picture under it before the next beat.
    const move = Math.min(1, f / 0.7);
    const from = ARRANGE[stage - 1] === undefined ? 'home' : ARRANGE[stage - 1];
    const to = ARRANGE[stage];
    const moving = from !== to;
    const progress = moving ? move : 1;

    // Where each column sits: its home slot, or the slot the permutation sends it to.
    const slotOf = index => {
      const home = index;
      const permuted = PERM.indexOf(index);
      if (from === 'perm' && to !== 'perm') return permuted + (home - permuted) * progress;
      if (to === 'perm') return home + (permuted - home) * progress;
      return home;
    };
    const slots = W.map((_, index) => ({index, at: slotOf(index)}));
    const slide = to === 'slide' ? SHIFT * (from === 'slide' ? 1 : progress) : 0;

    // A permutation keeps every pairing, so its products TRAVEL with their columns and
    // the score never moves -- that is the whole claim. A slide remakes the pairings, so
    // while it runs there are no products to draw and no score to report.
    const remaking = to === 'slide' && progress < 1 - 1e-6;
    let products = null, score = null;
    if (stage >= 1 && !remaking) {
      if (to === 'slide') {
        products = W.map((w, i) => ({slot: i, value: w * SLID[i], mark: `slot-${i}`}));
        score = AFTER;
      } else {
        products = slots.map(({index, at}) => ({slot: at, value: W[index] * X[index], mark: index}));
        score = BASE;
      }
    }
    // The answer is withheld through the two beats whose captions ask for a prediction.
    if (stage === 2 || stage === 4) score = null;
    const reference = stage >= 6 ? BASE : null;

    root.dataset.stage = String(stage);
    root.dataset.score = score === null ? '' : score.toFixed(4);
    root.dataset.arrangement = to;

    const stateKey = [stage, mode, progress.toFixed(4), slide.toFixed(4), score, remaking].join('/');
    if (stateKey !== previousKey) {
      previousKey = stateKey;
      svg.setAttribute('viewBox', MODES[mode].viewBox);
      drawing.innerHTML = draw({stage, slots, slide, products, score, reference});
      formula.classList.toggle('sx-perm-lit', stage === 2 || stage === 3);
      formula.classList.toggle('sx-shift-lit', stage >= 4);
    }

    const sentence = CAPTIONS[stage];
    if (captionKey !== sentence) { captionKey = sentence; caption.textContent = sentence; }
    return `${STAGES[stage]}. ${score === null ? 'Score withheld' : `Score ${fixed(score)}`}.`;
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
