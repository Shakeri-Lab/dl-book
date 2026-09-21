// Successive halving, drawn as the area a budget buys.
//
// Contract with interactives/shared/playback.js:
//   window.BookPlayback(root, render, layout?)
//   render(time, reduced) -> the scrubber's description; a pure function of
//     (time, reduced) that never measures the DOM.
//   layout() -> the only place that measures.
//
// One picture: configurations across the bottom, epochs up the side, so every block's
// AREA is the epoch-units it costs. The tracked object is the frontier -- the width of
// the surviving population. Each beat it narrows to a third and the block behind it
// grows three times taller, so the round's area barely changes while the per-run budget
// triples. The first and last frames show an empty square and a finished staircase; they
// cannot show that each step traded width for height, which is the whole method.
(() => {
  const root = document.getElementById('halving-budget-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  // The panel is the one in-repo mirror of the manuscript fixture
  // (chapters/interludes/learning-by-experiment.qmd:626-632).
  const numbersOf = name => root.dataset[name].trim().split(/\s+/).map(Number);
  const CONFIGS = Number(root.dataset.configs);
  const RUNGS = numbersOf('rungs'), KEEP = numbersOf('keep');
  const TOTAL = Number(root.dataset.total), FULL = Number(root.dataset.full);
  // Every round's cost, derived from the schedule rather than retyped: with resumed
  // checkpoints a survivor pays only for the epochs its rung adds.
  const ROUNDS = KEEP.map((n, r) => {
    const from = r === 0 ? 0 : RUNGS[r - 1];
    return {n, from, to: RUNGS[r], cost: n * (RUNGS[r] - from)};
  });
  const SPENT = ROUNDS.reduce((running, round) => [...running, (running.at(-1) || 0) + round.cost], []);

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = svg.querySelector('[data-drawing]');
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration || beats.at(-1));
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);
  const STAGES = ['Ask', 'One epoch each', 'Keep a third', 'Again', 'Hold',
    'The last rung', 'The alternative', 'The shape'];
  const CAPTIONS = [
    'The square is every configuration trained in full. What must a search actually buy?',
    'Every configuration runs one epoch. The band is as wide as the space.',
    'Keep a third; triple their budget. A third as wide, three times as tall.',
    'The same trade again. Narrower, taller, and the round costs the same.',
    'One is left, and it will run to the full depth. Predict the total.',
    'The survivor reaches the top. That is the whole search, paid for.',
    'Behind it, what training all of them in full would have cost.',
    'The staircase is 81 of the square’s 729: the search spent one ninth.'
  ];
  // Which round each beat is painting, and whether that beat's block is still growing.
  const ROUND_AT = [-1, 0, 1, 2, 2, 3, 3, 3];
  const GROWING = [false, true, true, true, false, true, false, false];

  const num = value => String(Number(value.toFixed(4)));
  const MODES = {
    wide: {
      viewBox: '0 0 713 322', box: [713, 322], font: 13,
      plot: {x: 96, y: 36, w: 554, h: 218},
      readout: [640, 116], full: [640, 58], xLabel: [373, 280], yLabel: [96, 26],
      tickAnchor: 'end', tickGap: 8, tickFont: 11, wideLabels: true
    },
    narrow: {
      viewBox: '0 0 296 404', box: [296, 404], font: 12,
      plot: {x: 56, y: 50, w: 226, h: 240},
      readout: [276, 130], full: [276, 74], xLabel: [169, 318], yLabel: [56, 40],
      tickAnchor: 'end', tickGap: 6, tickFont: 10, wideLabels: false
    }
  };

  let lastTime = 0, reduced = false, previousKey = '', captionKey = '', mode = 'wide';
  function measure() {
    mode = (figure.getBoundingClientRect().width || 600) < 600 ? 'narrow' : 'wide';
  }

  function draw(state) {
    const g = MODES[mode], p = g.plot;
    const {stage, round, grown, frontier, spent, showFull} = state;
    const parts = [];
    const colWidth = p.w / CONFIGS, rowHeight = p.h / RUNGS.at(-1);
    const xOf = configs => p.x + configs * colWidth;
    const yOf = epochs => p.y + p.h - epochs * rowHeight;
    const text = (x, y, content, cls, anchor = 'middle', extra = '', size = g.font) =>
      parts.push(`<text x="${num(x)}" y="${num(y)}" class="${cls}" font-size="${size}" text-anchor="${anchor}"${extra}>${content}</text>`);

    // The square the interlude compares against, drawn to the same scale.
    parts.push(`<rect class="hv-square${showFull ? ' hv-square-lit' : ''}" data-mark="square" x="${num(p.x)}" y="${num(p.y)}" width="${num(p.w)}" height="${num(p.h)}" ${showFull ? '' : 'fill="none" '}></rect>`);
    parts.push(`<line class="hv-axis" x1="${num(p.x)}" y1="${num(p.y)}" x2="${num(p.x)}" y2="${num(p.y + p.h)}"></line>`);
    parts.push(`<line class="hv-axis" x1="${num(p.x)}" y1="${num(p.y + p.h)}" x2="${num(p.x + p.w)}" y2="${num(p.y + p.h)}"></line>`);
    for (const rung of RUNGS) {
      parts.push(`<line class="hv-tick" x1="${num(p.x - 4)}" y1="${num(yOf(rung))}" x2="${num(p.x)}" y2="${num(yOf(rung))}"></line>`);
      // The first two rungs sit two epochs apart out of twenty-seven, so their labels are
      // set smaller than the rest of the picture rather than overrunning each other.
      text(p.x - g.tickGap, yOf(rung) + 4, String(rung), 'hv-scenery', g.tickAnchor, '', g.tickFont);
    }
    text(g.yLabel[0], g.yLabel[1], 'epochs', 'hv-scenery', 'start');
    text(g.xLabel[0], g.xLabel[1], `${CONFIGS} configurations`, 'hv-scenery');

    // The staircase: one block per finished round, and the growing one on top.
    ROUNDS.forEach((r, index) => {
      if (index > round) return;
      const top = index === round ? r.from + (r.to - r.from) * grown : r.to;
      if (top <= r.from) return;
      parts.push(`<rect class="hv-block" data-mark="block-${index}" x="${num(p.x)}" y="${num(yOf(top))}" `
        + `width="${num(r.n * colWidth)}" height="${num((top - r.from) * rowHeight)}"></rect>`);
    });
    // The frontier: how many configurations are still alive. It is the tracked object.
    if (round >= 0) {
      const at = yOf(ROUNDS[round].from);
      parts.push(`<line class="hv-frontier" data-mark="frontier" x1="${num(p.x)}" y1="${num(at)}" x2="${num(xOf(frontier))}" y2="${num(at)}"></line>`);
      // Past halfway the label would run off the picture, so it turns and sits inside.
      const inward = frontier > CONFIGS / 2;
      text(xOf(frontier) + (inward ? -8 : 8), at - 6, `${Math.round(frontier)} left`,
        'hv-frontier-text', inward ? 'end' : 'start', ' data-value="frontier"');
    }

    text(g.full[0], g.full[1], showFull ? `${FULL} epoch-units` : `${FULL} if all of them`,
      'hv-scenery hv-number', 'end', ' data-value="full"');
    text(g.readout[0], g.readout[1], `spent ${spent === null ? '·' : spent}`,
      'hv-spent hv-number', 'end', ' data-value="spent"');
    return parts.join('');
  }

  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const clamped = Math.max(0, Math.min(duration, time));
    const stage = stageAt(clamped);
    // Reduced motion holds each beat's finished state: the still is what its caption says.
    const end = beats[stage + 1] === undefined ? duration : beats[stage + 1];
    const held = reducedMotion ? end - 1e-6 : clamped;
    const span = end - beats[stage];
    const f = span > 0 ? Math.max(0, Math.min(1, (held - beats[stage]) / span)) : 1;
    const round = ROUND_AT[stage];
    // Within a growing beat the frontier narrows first, then the block climbs: selection
    // and budget are the two halves of one round, and the picture does them in that order.
    const cut = Math.min(1, f / 0.3), grow = Math.max(0, (f - 0.3) / 0.7);
    const grown = GROWING[stage] ? grow : 1;
    const previous = round > 0 ? ROUNDS[round - 1].n : CONFIGS;
    const frontier = round < 0 ? CONFIGS
      : GROWING[stage] ? previous + (ROUNDS[round].n - previous) * cut
        : ROUNDS[round].n;
    // The total is withheld while the caption asks for it.
    const paid = round < 0 ? 0
      : SPENT[round] - ROUNDS[round].cost * (1 - grown);
    const spent = stage === 0 ? null : Math.round(paid);

    root.dataset.stage = String(stage);
    root.dataset.spent = String(spent === null ? 0 : spent);
    root.dataset.frontier = frontier.toFixed(4);

    const stateKey = [stage, mode, grown.toFixed(4), frontier.toFixed(4), spent].join('/');
    if (stateKey !== previousKey) {
      previousKey = stateKey;
      svg.setAttribute('viewBox', MODES[mode].viewBox);
      drawing.innerHTML = draw({stage, round, grown, frontier, spent, showFull: stage >= 6});
      formula.classList.toggle('hv-rung-lit', stage >= 2 && stage <= 5);
      formula.classList.toggle('hv-total-lit', stage >= 5);
      formula.classList.toggle('hv-full-lit', stage >= 6);
    }

    const sentence = CAPTIONS[stage];
    if (captionKey !== sentence) { captionKey = sentence; caption.textContent = sentence; }
    return `${STAGES[stage]}. ${spent === null ? 'Nothing spent yet' : `Spent ${spent} of ${FULL}`}.`;
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
