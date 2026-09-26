// Channels say what; pooling says roughly where.
//
// Contract with interactives/shared/playback.js:
//   window.BookPlayback(root, render, layout?)
//   render(time, reduced) -> the scrubber's description; a pure function of
//     (time, reduced) that never measures the DOM.
//   layout() -> the only place that measures.
//
// One picture: the chapter's square, the two edge detectives' reports stacked as two
// channels, and each report max-pooled on its own. The tracked object is the probe: one
// spot, read through the depth of the stack. Before pooling it reads (4, 0) on the
// square's side and (0, 4) on its top; after pooling each map separately it still does,
// while one maximum across both maps would read 4 at both. The motion is the two windows
// that make the maps (one window, two reports; one pooling window per map, in step)
// and the probe that reads the same spot through the stack. Two stills show two pairs
// of maps and lose which operation acted along which axis.
(() => {
  const root = document.getElementById('what-where-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  const numbersOf = name => root.dataset[name].trim().split(/\s+/).map(Number);
  // The panel is the one in-repo mirror of the manuscript fixture
  // (chapters/part2/08-cnn.qmd:245-262): the corner-detector cell's square and kernel.
  const N = Number(root.dataset.size), [S0, S1] = numbersOf('square');
  const KV = numbersOf('kernel'), POOL = Number(root.dataset.pool);
  const KH = [0, 1, 2].flatMap(b => [0, 1, 2].map(a => KV[3 * a + b]));   // sobel_v.T
  const PROBES = numbersOf('probes');
  const probe = k => ({r: PROBES[2 * k], c: PROBES[2 * k + 1]});
  const input = (r, c) => (r >= S0 && r < S1 && c >= S0 && c < S1 ? 1 : 0);
  // F.conv2d(..., padding=1).abs(): zero outside the frame.
  const report = kernel => Array.from({length: N}, (_, r) => Array.from({length: N}, (_, c) => {
    let s = 0;
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
      const rr = r - 1 + a, cc = c - 1 + b;
      if (rr >= 0 && rr < N && cc >= 0 && cc < N) s += kernel[3 * a + b] * input(rr, cc);
    }
    return Math.abs(s);
  }));
  const MAPS = [report(KV), report(KH)];                 // channel 0 vertical, 1 horizontal
  const M = N / POOL;
  // F.max_pool2d(..., 2): one maximum per map and per block.
  const POOLED = MAPS.map(map => Array.from({length: M}, (_, i) => Array.from({length: M}, (_, j) => {
    let best = -Infinity;
    for (let a = 0; a < POOL; a++) for (let b = 0; b < POOL; b++) best = Math.max(best, map[POOL * i + a][POOL * j + b]);
    return best;
  })));
  const TOP = Math.max(...MAPS.flat(2));
  const NAMES = ['vertical', 'horizontal'];

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = svg.querySelector('[data-drawing]');
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration || beats.at(-1));
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);
  const STAGES = ['Ask', 'Two detectives', 'One spot, two readings', 'Pool each map', 'Hold',
    'Still told apart', 'The shapes', 'What and where'];
  const CAPTIONS = [
    'Two detectives, one square. After pooling, can the network still tell its side from its top?',
    'One window sweeps the image; at every stop both detectives write into their own map.',
    'Read one spot through the stack: each detective’s reading sits at the same place in its own map.',
    'Pooling runs a 2 × 2 window through each map in step, keeping each map’s own maximum.',
    'The probe sits on the pooled side and the pooled top. Can the pair still tell them apart?',
    'Yes: pooled map by map, the side still reads vertical and the top horizontal.',
    'The convolution changed the depth; pooling changed only the height and width.',
    'Channels say what was found; pooling says roughly where. Neither does the other’s job.'
  ];

  const num = value => String(Number(value.toFixed(4)));
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const ease = v => v * v * (3 - 2 * v);
  const fmt = v => String(Number(v.toFixed(1)));
  const MODES = {
    wide: {
      viewBox: '0 0 713 364', font: 13, cell: 4.5,
      input: [20, 107], maps: [[200, 22], [200, 196]], pooled: [[380, 53.5], [380, 227.5]],
      labels: [[200, 14], [200, 188]], inputLabel: [20, 99],
      readout: {x: 478, y: 44, labels: 150, col: 52}, ledger: 352, ledgerX: [83, 263, 411.5],
      arrows: true
    },
    narrow: {
      viewBox: '0 0 296 580', font: 12, cell: 4.4,
      input: [86.4, 30], maps: [[14, 184], [158, 184]], pooled: [[45, 330], [189, 330]],
      labels: [[14, 176], [158, 176]], inputLabel: [86.4, 22],
      readout: {x: 14, y: 424, labels: 150, col: 70}, ledger: 568, ledgerX: [148, 148, 148],
      arrows: false
    }
  };

  let lastTime = 0, reduced = false, previousKey = '', captionKey = '', mode = 'wide';
  function measure() {
    mode = (figure.getBoundingClientRect().width || 600) < 600 ? 'narrow' : 'wide';
  }

  // A map is drawn as one outlined frame and one path per intensity level, so a 28 x 28
  // map costs a handful of elements rather than 784. `upto` hides cells a sweep has not
  // written yet, counted in reading order.
  function mapMarkup(values, x0, y0, cell, cls, upto, mark, top = TOP) {
    const n = values.length, levels = new Map();
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (r * n + c >= upto) continue;
      const v = values[r][c];
      if (v <= 0) continue;
      const d = `M${num(x0 + c * cell)} ${num(y0 + r * cell)}h${num(cell)}v${num(cell)}h${num(-cell)}z`;
      levels.set(v, (levels.get(v) || '') + d);
    }
    const parts = [`<rect class="ww-map" data-mark="${mark}" x="${num(x0)}" y="${num(y0)}" width="${num(n * cell)}" height="${num(n * cell)}"></rect>`];
    for (const [v, d] of [...levels].sort((a, b) => a[0] - b[0])) {
      parts.push(`<path class="${cls}" fill-opacity="${num(0.25 + 0.75 * v / top)}" d="${d}"></path>`);
    }
    return parts.join('');
  }

  function draw(state) {
    // A pooled map is drawn at the same cell size, so it is visibly half as wide; the
    // pooling window on the full map covers POOL x POOL of its cells.
    const g = MODES[mode], s = g.cell, ps = s, pw = s * POOL;
    const {convAt, poolAt, spot, pooledSpots, reveal, withheld, ledger} = state;
    const parts = [];
    const text = (x, y, content, cls, anchor = 'middle', extra = '', size = g.font) =>
      parts.push(`<text x="${num(x)}" y="${num(y)}" class="${cls}" font-size="${size}" text-anchor="${anchor}"${extra}>${content}</text>`);

    // The input, one channel.
    const inputRows = Array.from({length: N}, (_, r) => Array.from({length: N}, (_, c) => input(r, c)));
    parts.push(mapMarkup(inputRows, g.input[0], g.input[1], s * (mode === 'narrow' ? 0.82 : 1), 'ww-input', N * N, 'input', 1));
    text(g.inputLabel[0], g.inputLabel[1], 'input, 1 channel', 'ww-scenery', 'start', '', g.font - 1);
    const inputCell = s * (mode === 'narrow' ? 0.82 : 1);

    // The two reports and their pooled versions.
    MAPS.forEach((map, o) => {
      const [x, y] = g.maps[o];
      parts.push(mapMarkup(map, x, y, s, 'ww-report', convAt, `map-${NAMES[o]}`));
      text(g.labels[o][0], g.labels[o][1], `${NAMES[o]} detective`, 'ww-ink', 'start', '', g.font - 1);
      const [px, py] = g.pooled[o];
      if (poolAt > 0) parts.push(mapMarkup(POOLED[o], px, py, ps, 'ww-report', poolAt, `pooled-${NAMES[o]}`));
      else parts.push(`<rect class="ww-map ww-pending" data-mark="pooled-${NAMES[o]}" x="${num(px)}" y="${num(py)}" width="${num(M * ps)}" height="${num(M * ps)}"></rect>`);
      if (g.arrows) {
        const ay = y + N * s / 2;
        parts.push(`<path class="ww-arrow" d="M${num(x + N * s + 12)} ${num(ay)}H${num(px - 10)}M${num(px - 16)} ${num(ay - 4)}L${num(px - 10)} ${num(ay)}L${num(px - 16)} ${num(ay + 4)}"></path>`);
        text((x + N * s + px) / 2, ay - 8, 'max pool', 'ww-scenery', 'middle', '', g.font - 2);
        const ix = g.input[0] + N * s + 8, iy = g.input[1] + N * s / 2;
        parts.push(`<path class="ww-arrow" d="M${num(ix)} ${num(iy)}L${num(x - 10)} ${num(ay)}"></path>`);
      }
    });

    // The windows that make the maps: one conv window on the input, its output cell lit in
    // both maps at once; one pooling window per map, in step.
    if (convAt > 0 && convAt < N * N) {
      const r = Math.floor(convAt / N), c = convAt % N;
      parts.push(`<rect class="ww-window" data-mark="conv-window" x="${num(g.input[0] + (c - 1) * inputCell)}" y="${num(g.input[1] + (r - 1) * inputCell)}" width="${num(3 * inputCell)}" height="${num(3 * inputCell)}"></rect>`);
      MAPS.forEach((_, o) => parts.push(`<rect class="ww-window" x="${num(g.maps[o][0] + c * s)}" y="${num(g.maps[o][1] + r * s)}" width="${num(s)}" height="${num(s)}"></rect>`));
    }
    if (poolAt > 0 && poolAt < M * M) {
      const i = Math.floor(poolAt / M), j = poolAt % M;
      MAPS.forEach((_, o) => {
        parts.push(`<rect class="ww-window" data-mark="pool-window-${o}" x="${num(g.maps[o][0] + j * pw)}" y="${num(g.maps[o][1] + i * pw)}" width="${num(pw)}" height="${num(pw)}"></rect>`);
      });
    }

    // The probe: one spot, read through the depth of the stack.
    const ring = (x, y, size, markName) => parts.push(`<rect class="ww-probe" data-mark="${markName}" x="${num(x - 3)}" y="${num(y - 3)}" width="${num(size + 6)}" height="${num(size + 6)}" rx="3"></rect>`);
    const R = g.readout;
    if (spot) {
      ring(g.input[0] + spot.c * inputCell, g.input[1] + spot.r * inputCell, inputCell, 'probe-input');
      MAPS.forEach((_, o) => ring(g.maps[o][0] + spot.c * s, g.maps[o][1] + spot.r * s, s, `probe-${o}`));
      text(R.x, R.y, `one spot, ${spot.name}`, 'ww-scenery', 'start');
      MAPS.forEach((map, o) => {
        const y = R.y + 26 + 26 * o;
        text(R.x, y, NAMES[o], 'ww-ink', 'start', '', g.font - 1);
        text(R.x + 96, y, fmt(map[spot.r][spot.c]), 'ww-prediction-text ww-number', 'start', ` data-value="spot-${o}"`);
      });
    }
    if (pooledSpots) {
      // The pooled readout is laid out as the stack reads it: one row per detective, one
      // column per probed block, and, once revealed, the row pooling across maps would give.
      const cols = [R.x + R.labels, R.x + R.labels + R.col];
      text(R.x, R.y, 'pooled blocks', 'ww-scenery', 'start');
      pooledSpots.forEach((b, k) => {
        MAPS.forEach((_, o) => ring(g.pooled[o][0] + b.j * ps, g.pooled[o][1] + b.i * ps, ps, `pooled-probe-${k}-${o}`));
        text(cols[k], R.y, b.name, 'ww-scenery', 'middle');
        MAPS.forEach((_, o) => {
          text(cols[k], R.y + 26 + 24 * o, withheld ? '\u00b7' : fmt(POOLED[o][b.i][b.j]), 'ww-prediction-text ww-number', 'middle', ` data-value="pooled-${b.name}-${o}"`);
        });
        if (reveal > 0) {
          const across = Math.max(POOLED[0][b.i][b.j], POOLED[1][b.i][b.j]);
          const opacity = reveal < 1 ? ` opacity="${num(reveal)}"` : '';
          text(cols[k], R.y + 86, fmt(across), 'ww-scenery ww-ghost ww-number', 'middle', ` data-value="across-${b.name}"${opacity}`);
        }
      });
      MAPS.forEach((_, o) => text(R.x, R.y + 26 + 24 * o, NAMES[o], 'ww-ink', 'start', '', g.font - 1));
      if (reveal > 0) {
        const opacity = reveal < 1 ? ` opacity="${num(reveal)}"` : '';
        text(R.x, R.y + 86, 'if pooled across maps', 'ww-scenery', 'start', opacity, g.font - 2);
      }
    }

    // The shape ledger: which axis each operation changed.
    if (ledger > 0) {
      const opacity = ledger < 1 ? ` opacity="${num(ledger)}"` : '';
      const shapes = [`1 × ${N} × ${N}`, `2 × ${N} × ${N}`, `2 × ${M} × ${M}`];
      if (g.arrows) {
        shapes.forEach((shape, k) => text(g.ledgerX[k], g.ledger, shape, 'ww-ink ww-number', 'middle', ` data-value="shape-${k}"${opacity}`));
        text((g.ledgerX[0] + g.ledgerX[1]) / 2, g.ledger - 16, 'conv: depth 1 → 2', 'ww-scenery', 'middle', opacity, g.font - 2);
        text((g.ledgerX[1] + g.ledgerX[2]) / 2 + 8, g.ledger - 16, 'pool: space ½', 'ww-scenery', 'middle', opacity, g.font - 2);
      } else {
        text(g.ledgerX[0], g.ledger, shapes.join('  →  '), 'ww-ink ww-number', 'middle', ` data-value="shapes"${opacity}`, g.font - 1);
      }
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
    const sweep = clamp01(f / 0.7);

    const convAt = stage === 0 ? 0 : stage === 1 ? Math.floor(sweep * N * N) : N * N;
    const poolAt = stage < 3 ? 0 : stage === 3 ? Math.floor(sweep * M * M) : M * M;
    // Beat 2's probe visits the side, the top and the corner, a third of the beat each.
    let spot = null;
    if (stage === 2) {
      const k = Math.min(2, Math.floor(f * 3));
      spot = {...probe(k), name: ['on the side', 'on the top', 'at the corner'][k]};
    }
    const pooledSpots = stage >= 4 ? [0, 1].map(k => ({i: Math.floor(probe(k).r / POOL), j: Math.floor(probe(k).c / POOL), name: ['side', 'top'][k]})) : null;
    const withheld = stage === 4;
    const reveal = stage === 5 ? ease(clamp01((f - 0.3) / 0.4)) : stage > 5 ? 1 : 0;
    const ledger = stage === 6 ? ease(clamp01(f / 0.3)) : stage > 6 ? 1 : 0;

    root.dataset.stage = String(stage);
    root.dataset.written = String(convAt);
    root.dataset.pooled = String(poolAt);
    root.dataset.spot = spot ? `${spot.r} ${spot.c}` : '';

    const stateKey = [stage, mode, convAt, poolAt, spot ? spot.name : 'x', withheld, reveal.toFixed(3), ledger.toFixed(3)].join('/');
    if (stateKey !== previousKey) {
      previousKey = stateKey;
      svg.setAttribute('viewBox', MODES[mode].viewBox);
      drawing.innerHTML = draw({convAt, poolAt, spot, pooledSpots, reveal, withheld, ledger});
      formula.classList.toggle('ww-channels-lit', stage === 1 || stage === 2);
      formula.classList.toggle('ww-pool-lit', stage >= 3 && stage <= 5);
    }

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
