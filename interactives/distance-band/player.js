// Distance concentration, drawn as the band it is.
//
// Contract with interactives/shared/playback.js:
//   window.BookPlayback(root, render, layout?)
//   render(time, reduced) -> the scrubber's description; a pure function of
//     (time, reduced) that never measures the DOM.
//   layout() -> the only place that measures.
//
// One picture: every distance between two random points in a cube, measured against the
// typical distance, drawn as one band. The tracked object is that band, and the motion is
// its collapse -- the two extremes sliding toward each other as the dimension climbs. Two
// stills, at ten dimensions and at five thousand, show a wide band and a narrow one and
// lose the rate: that the width falls as one over the square root of d, so a tenfold
// squeeze costs a hundredfold in dimension and no quantity of data reopens it.
(() => {
  const root = document.getElementById('distance-band-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  // The panel is the one in-repo mirror of the fixture
  // (chapters/part1/06-generalization-inductive-bias.qmd:348-398).
  const DIMS = root.dataset.dims.trim().split(/\s+/).map(Number);
  const FOCUS = Number(root.dataset.focus);
  const SPREAD = Number(root.dataset.spread), Z = Number(root.dataset.extreme);
  const PRINTED = root.dataset.printed;
  // For two points drawn uniformly from the unit cube the squared distance has mean d/6
  // and variance 7d/180, so the distance's relative spread is sqrt(0.35 / d).
  const sigma = d => Math.sqrt(SPREAD / d);
  const edges = d => [1 - Z * sigma(d), 1 + Z * sigma(d)];
  const ratio = d => { const [lo, hi] = edges(d); return lo / hi; };

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = svg.querySelector('[data-drawing]');
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration || beats.at(-1));
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);
  const STAGES = ['Ask', 'Ten', 'A hundred', 'Hold', String(FOCUS), 'Five thousand',
    'Compare', 'The law'];
  const CAPTIONS = [
    'Two random points in a cube. How far apart, next to how far apart at most?',
    'Ten dimensions: the nearest point is a third as far as the farthest.',
    'A hundred: the band has closed, and near barely outranks far.',
    'Fashion-MNIST lives in 784 dimensions. Predict the ratio there.',
    'The chapter measured 0.89 with 300 sampled points. Geometry alone says the same.',
    'Five thousand: every point is the same distance from every other.',
    'Beside the band at ten dimensions, the same cube at five thousand has no near neighbours left.',
    'Width falls as one over the square root of d. Data cannot buy it back.'
  ];
  // Which dimension each beat holds. A hold repeats the one before it.
  const AT = [null, 0, 1, 1, 2, 3, 3, 3];

  const num = value => String(Number(value.toFixed(4)));
  const fixed = value => value.toFixed(2);
  const MODES = {
    wide: {
      viewBox: '0 0 713 280', box: [713, 280], font: 13,
      axis: {x: 80, y: 186, span: 560, top: 1.6},
      band: {top: 118, height: 52},
      readout: [80, 52], number: [80, 90],
      ladder: {y: 240, from: 150, to: 600}, compare: [640, 90]
    },
    narrow: {
      viewBox: '0 0 296 336', box: [296, 336], font: 11,
      axis: {x: 20, y: 210, span: 256, top: 1.6},
      band: {top: 146, height: 48}, readout: [20, 44], number: [20, 84],
      ladder: {y: 266, from: 46, to: 250}, compare: [276, 84]
    }
  };

  let lastTime = 0, reduced = false, previousKey = '', captionKey = '', mode = 'wide';
  function measure() {
    mode = (figure.getBoundingClientRect().width || 600) < 600 ? 'narrow' : 'wide';
  }

  function draw(state) {
    const g = MODES[mode], a = g.axis, b = g.band;
    const {stage, dim, lo, hi, shownRatio, ghost} = state;
    const parts = [];
    const xOf = value => a.x + (value / a.top) * a.span;
    const text = (x, y, content, cls, anchor = 'middle', extra = '', size = g.font) =>
      parts.push(`<text x="${num(x)}" y="${num(y)}" class="${cls}" font-size="${size}" text-anchor="${anchor}"${extra}>${content}</text>`);

    parts.push(`<line class="dn-axis" x1="${num(a.x)}" y1="${num(a.y)}" x2="${num(a.x + a.span)}" y2="${num(a.y)}"></line>`);
    for (const at of [0, 0.5, 1, 1.5]) {
      parts.push(`<line class="dn-tick" x1="${num(xOf(at))}" y1="${num(a.y)}" x2="${num(xOf(at))}" y2="${num(a.y + 5)}"></line>`);
    }
    // One tick is named, because the axis measures against it.
    parts.push(`<line class="dn-typical" x1="${num(xOf(1))}" y1="${num(b.top - 12)}" x2="${num(xOf(1))}" y2="${num(a.y)}"></line>`);
    text(xOf(1), a.y + 20, 'typical distance', 'dn-scenery');
    text(xOf(0), a.y + 20, '0', 'dn-scenery');

    // The band left behind for comparison, drawn before the live one so it sits behind.
    if (ghost) {
      parts.push(`<rect class="dn-ghost" data-mark="ghost" x="${num(xOf(ghost[0]))}" y="${num(b.top)}" `
        + `width="${num(xOf(ghost[1]) - xOf(ghost[0]))}" height="${b.height}" rx="4"></rect>`);
      text(xOf(ghost[0]) + 6, b.top + b.height + 20, `d = ${DIMS[0]}`, 'dn-scenery', 'start', '', g.font - 1);
    }
    if (dim !== null) {
      parts.push(`<rect class="dn-band" data-mark="band" x="${num(xOf(lo))}" y="${num(b.top)}" `
        + `width="${num(Math.max(xOf(hi) - xOf(lo), 1.5))}" height="${b.height}" rx="4"></rect>`);
      // Each edge is named on the side that has room for the word; a band wide enough to
      // push its label off the picture takes the label inside instead.
      const gutter = 60;
      for (const [at, name, outward] of [[lo, 'nearest', 'end'], [hi, 'farthest', 'start']]) {
        const room = outward === 'end' ? xOf(at) - gutter >= 0 : xOf(at) + gutter <= g.box[0];
        const anchor = room ? outward : (outward === 'end' ? 'start' : 'end');
        parts.push(`<line class="dn-edge" x1="${num(xOf(at))}" y1="${num(b.top - 8)}" x2="${num(xOf(at))}" y2="${num(b.top + b.height + 8)}"></line>`);
        text(xOf(at) + (anchor === 'end' ? -6 : 6), b.top - 10, name, 'dn-ink', anchor, '', g.font - 1);
      }
    }

    text(g.readout[0], g.readout[1], 'nearest ÷ farthest', 'dn-scenery', 'start');
    text(g.number[0], g.number[1], shownRatio === null ? '·' : fixed(shownRatio),
      'dn-ink dn-number', 'start', ' data-value="ratio"');
    if (stage >= 4) {
      text(g.compare[0], g.compare[1], `the chapter measures ${PRINTED} at d = ${FOCUS}`,
        'dn-scenery', 'end', ' data-value="printed"', g.font - 1);
    }

    // The ladder of dimensions the scene visits, with the one in view lit.
    const l = g.ladder, step = DIMS.length > 1 ? (l.to - l.from) / (DIMS.length - 1) : 0;
    DIMS.forEach((d, index) => {
      const x = l.from + step * index, live = dim === d;
      parts.push(`<circle class="dn-rung${live ? ' dn-rung-live' : ''}" data-mark="rung-${d}" cx="${num(x)}" cy="${num(l.y)}" r="${live ? 5.5 : 3.4}"></circle>`);
      text(x, l.y + 20, live ? `d = ${d}` : String(d), live ? 'dn-ink dn-rung-text' : 'dn-scenery',
        'middle', '', live ? g.font : g.font - 2);
    });
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
    // The band collapses over the first seven tenths of a beat and stands for the rest.
    const move = Math.min(1, f / 0.7);
    const index = AT[stage], previousIndex = AT[stage - 1] === undefined ? null : AT[stage - 1];
    const dim = index === null ? null : DIMS[index];
    // Edges glide between the two dimensions, so the collapse is continuous rather than
    // a cut: the reader watches the nearest and the farthest close on each other.
    let lo = null, hi = null;
    if (index !== null) {
      const target = edges(DIMS[index]);
      const arriving = previousIndex !== null && previousIndex !== index;
      const start = arriving ? edges(DIMS[previousIndex]) : target;
      const t = arriving ? move : 1;
      lo = start[0] + (target[0] - start[0]) * t;
      hi = start[1] + (target[1] - start[1]) * t;
    }
    const settled = index !== null && (previousIndex === null || previousIndex === index || move >= 1 - 1e-6);
    // The answer is withheld through the beat whose caption asks for a prediction.
    const shownRatio = stage === 3 || index === null || !settled ? null : ratio(DIMS[index]);
    const ghost = stage >= 6 ? edges(DIMS[0]) : null;

    root.dataset.stage = String(stage);
    root.dataset.dimension = dim === null ? '' : String(dim);
    root.dataset.ratio = shownRatio === null ? '' : shownRatio.toFixed(4);

    const stateKey = [stage, mode, dim, lo === null ? 'x' : lo.toFixed(4),
      hi === null ? 'x' : hi.toFixed(4), shownRatio, Boolean(ghost)].join('/');
    if (stateKey !== previousKey) {
      previousKey = stateKey;
      svg.setAttribute('viewBox', MODES[mode].viewBox);
      drawing.innerHTML = draw({stage, dim, lo, hi, shownRatio, ghost});
      formula.classList.toggle('dn-law-lit', stage >= 1);
      formula.classList.toggle('dn-land-lit', stage >= 4);
    }

    const sentence = CAPTIONS[stage];
    if (captionKey !== sentence) { captionKey = sentence; caption.textContent = sentence; }
    return `${STAGES[stage]}. ${shownRatio === null ? 'Ratio withheld' : `Ratio ${fixed(shownRatio)}`}.`;
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
