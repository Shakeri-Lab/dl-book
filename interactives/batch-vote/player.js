(() => {
  const root = document.getElementById('batch-vote-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  // The panel is the one in-repo mirror of the fixture. Chapter 4 owns both laws
  // (04-training-loss-sgd.qmd:285-288) but prints no population, so the toy problem
  // below is a declared computed variant; every gradient, mean, sigma and jitter here
  // is computed from these attributes and nothing is retyped.
  const list = name => root.dataset[name].trim().split(/\s+/).map(Number);
  const number = name => Number(root.dataset[name]);
  const fixture = {features: list('features'), coefficients: list('coefficients'),
    offset: number('offset'), parameters: list('parameters'), stops: list('stops'),
    seed: number('shuffleSeed')};
  (({features, coefficients, offset, parameters, stops, seed}) => {
    const scalars = [offset, seed, ...coefficients, ...parameters, ...features, ...stops];
    if (!scalars.every(Number.isFinite))
      throw Error('batch-vote: every declared quantity must be a finite number');
    if (features.length < 4 || new Set(features).size !== features.length)
      throw Error('batch-vote: at least four distinct feature values are required');
    if (coefficients.length !== 2 || parameters.length !== 2)
      throw Error('batch-vote: the toy problem has exactly two coefficients and two parameters');
    if (coefficients[0] === parameters[0] && coefficients[1] === parameters[1])
      throw Error('batch-vote: the parameters must sit off the fit, or the gradient is zero');
    if (stops.length !== 4) throw Error('batch-vote: four batch-size stops are required');
    if (stops[0] !== 1) throw Error('batch-vote: the first stop must be a batch of one');
    if (stops[3] !== features.length ** 2)
      throw Error('batch-vote: the last stop must be the whole population, B = n');
    if (!stops.every((stop, index) => Number.isInteger(stop) && stop >= 1
      && (index === 0 || stop === 4 * stops[index - 1])))
      throw Error('batch-vote: the stops must be whole quadruplings of the batch');
    if (!Number.isInteger(seed) || seed <= 0)
      throw Error('batch-vote: the shuffle seed must be a positive whole number');
  })(fixture);

  // --- the declared toy problem, computed once ------------------------------------
  // Two weights, no bias; all pairs of the declared feature values are the examples;
  // the targets follow the declared rule plus an offset the two-weight model cannot
  // represent. The chapter's own gradient convention: grad l_i = 2 r_i (a_i, b_i).
  const [p, q] = [fixture.parameters[0] - fixture.coefficients[0],
    fixture.parameters[1] - fixture.coefficients[1]];
  const population = [];
  for (const a of fixture.features) for (const b of fixture.features) {
    const residual = p * a + q * b - fixture.offset;
    population.push([2 * residual * a, 2 * residual * b]);
  }
  const n = population.length;
  // Every component is an exact binary fraction and so is every partial sum, so this
  // total is the same however it is ordered — which is why B = n collapses exactly.
  const total = population.reduce((sum, g) => [sum[0] + g[0], sum[1] + g[1]], [0, 0]);
  const truth = [total[0] / n, total[1] / n];
  const spreadOf = points => Math.sqrt(points.reduce((sum, g) =>
    sum + (g[0] - truth[0]) ** 2 + (g[1] - truth[1]) ** 2, 0) / points.length);
  const sigma = spreadOf(population);
  if (!(sigma > 0)) throw Error('batch-vote: the declared population has no spread to reduce');

  // Sixty-four declared batches: one deterministic shuffle of the examples, then the n
  // cyclic windows of length B in that order. Every example sits in exactly B windows, so
  // the cloud's centre is the full-batch gradient at every B; a window of one IS an
  // example and a window of n IS the whole population, so both ends are exact.
  const shuffled = [];
  for (let i = 0; i < n; i++) shuffled.push(i);
  let state = fixture.seed % 4294967296;
  for (let m = n - 1; m > 0; m--) {
    state = (1664525 * state + 1013904223) % 4294967296;
    const j = state % (m + 1);
    [shuffled[m], shuffled[j]] = [shuffled[j], shuffled[m]];
  }
  const prefix = [[0, 0]];
  for (const index of shuffled) {
    const last = prefix[prefix.length - 1];
    prefix.push([last[0] + population[index][0], last[1] + population[index][1]]);
  }
  const windowOf = (k, size) => Array.from({length: size}, (_, m) => shuffled[(k + m) % n]);
  const wrapped = (axis, k, size) => k + size <= n ? prefix[k + size][axis] - prefix[k][axis]
    : prefix[n][axis] - prefix[k][axis] + prefix[k + size - n][axis];
  const batchMean = (k, size) => [wrapped(0, k, size) / size, wrapped(1, k, size) / size];
  const estimates = size => Array.from({length: n}, (_, k) => batchMean(k, size));
  // The batch drawn as an arrow is a typical one, not the worst one: the window whose
  // single example sits closest to one standard deviation from the full-batch gradient.
  // Computed from the declared population, so it is not a hand-picked index.
  const typical = shuffled.reduce((best, index, k) => {
    const g = population[index];
    const off = Math.abs(Math.hypot(g[0] - truth[0], g[1] - truth[1]) - sigma);
    return off < best.off ? {k, off} : best;
  }, {k: 0, off: Infinity}).k;

  // The chapter's two laws, evaluated at the reader's B. The finite-population factor is
  // exactly zero at B = n, so the product is exactly zero there and not merely small.
  const independentAt = size => sigma / Math.sqrt(size);
  const jitterAt = size => independentAt(size) * Math.sqrt((n - size) / (n - 1));

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const slider = $('[data-batch-slider]'), readout = $('[data-batch-readout]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration);
  const stageAt = time => beats.reduce((stage, beat, index) => time >= beat ? index : stage, 0);
  const clamp01 = value => Math.max(0, Math.min(1, value));
  const ease = value => (1 - Math.cos(Math.PI * clamp01(value))) / 2;
  // A glide finishes at the beat it leads into: ease(1) is 1, so a seek parks on the
  // finished picture its caption describes, and a stop is reached exactly.
  const glide = (time, from, to, a, b) => {
    const u = ease((time - from) / (to - from));
    return u === 0 ? a : u === 1 ? b : a + u * (b - a);
  };
  // The batch is always a whole number of examples. The last climb runs inside the last
  // beat so the final frame rests on B = n with the fan already collapsed.
  const [one, four, sixteen, all] = fixture.stops;
  const FULL = beats[7] + 3;
  const sizeAt = time =>
    time < beats[3] ? one
      : time < beats[4] ? Math.round(glide(time, beats[3], beats[4], one, four))
        : time < beats[5] ? four
          : time < beats[6] ? Math.round(glide(time, beats[5], beats[6], four, sixteen))
            : time < beats[7] ? sixteen
              : time < FULL ? Math.round(glide(time, beats[7], FULL, sixteen, all))
                : all;
  // Reduced motion draws one still per beat; a glide beat rests on its finished state.
  const REST = [beats[0], beats[1], beats[2], beats[4], beats[4], beats[6], beats[6], FULL];
  // When each recorded reading is earned. The first quadrupling's answer is absent until
  // the glide that reveals it has finished, so the predict beat cannot be read ahead.
  const RECORDED = [beats[1], beats[4], beats[6], FULL];

  const names = ['The population', 'The jitter scale', 'Predict', 'Four examples',
    'One halving', 'Quadrupling again', 'Sixteen examples', 'The whole population'];
  const captions = [
    'Sixty-four per-example gradients pull different ways. Their average is the true full-batch gradient.',
    'Open the jitter scale: one standard deviation of the estimate, at a batch of one.',
    'Quadruple the batch to four. How much of that jitter does four times the cost remove?',
    'The batch grows to four, and the cloud of sixty-four estimates pulls in toward the truth.',
    'Four times the cost bought one halving, not a quarter. The law curves say why.',
    'Quadruple again. The marker slides down the curve toward its flat right-hand end.',
    'Another halving. Beyond here, forty-eight more gradients per step buy almost nothing.',
    'Take the batch to all sixty-four: B equals n, and the noise is exactly zero.'
  ];
  const dragging = 'You are setting the batch size. Every mark is recomputed at your B.';
  const pictures = {
    hidden: 'Sixty-four per-example gradients scatter as grey squares around one bold arrow, the full-batch gradient. The jitter of a batch estimate is not shown yet.',
    shown: 'Sixty-four batch estimates scatter around the full-batch gradient in the gradient plane, and a curve beside them carries the standard deviation of the estimate against batch size.'
  };

  // --- the picture, built once ----------------------------------------------------
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const drawing = svg.querySelector('[data-drawing]');
  drawing.replaceChildren();
  const NS = 'http://www.w3.org/2000/svg';
  // Drawing coordinates are serialised at 0.0001 px, so a last-bit difference between
  // math libraries cannot change the byte-compared static print. The state is never rounded.
  const px = value => typeof value === 'number' ? String(Number(value.toFixed(4))) : String(value);
  const attrs = (node, values) => {
    for (const [key, value] of Object.entries(values)) node.setAttribute(key, px(value));
    return node;
  };
  const make = (tag, attributes, text = '') => {
    const node = attrs(document.createElementNS(NS, tag), attributes);
    node.textContent = text;
    drawing.appendChild(node);
    return node;
  };
  const label = (cls, size, extra = {}, text = '') =>
    make('text', {class: cls, 'font-size': size, 'text-anchor': 'middle', ...extra}, text);
  const show = (node, visible) => visible ? node.removeAttribute('hidden') : node.setAttribute('hidden', '');
  const write = (node, value) => { if (node.textContent !== value) node.textContent = value; };
  // Plain-text numbers use a true minus, never a hyphen. An exactly zero jitter carries no
  // sign: it is the payoff reading, not a small positive or negative one.
  const plain = (value, digits = 2) => value.toFixed(digits).replace('-', '−');
  const arrow = (from, to, size = 6) => {
    const dx = to[0] - from[0], dy = to[1] - from[1], length = Math.hypot(dx, dy);
    const shaft = `M ${px(from[0])} ${px(from[1])} L ${px(to[0])} ${px(to[1])}`;
    if (length < 1e-9) return shaft;
    const ux = dx / length, uy = dy / length, back = [to[0] - size * ux, to[1] - size * uy];
    return `${shaft} M ${px(back[0] - size * .6 * uy)} ${px(back[1] + size * .6 * ux)}`
      + ` L ${px(to[0])} ${px(to[1])} L ${px(back[0] + size * .6 * uy)} ${px(back[1] - size * .6 * ux)}`;
  };
  const square = ([x, y], r) => `M ${px(x - r)} ${px(y - r)} h ${px(2 * r)} v ${px(2 * r)} h ${px(-2 * r)} Z`;
  const diamond = ([x, y], r) =>
    `M ${px(x)} ${px(y - r)} L ${px(x + r)} ${px(y)} L ${px(x)} ${px(y + r)} L ${px(x - r)} ${px(y)} Z`;

  const marks = {
    frame: make('rect', {class: 'bv-frame', 'data-plane-frame': '', fill: 'none'}),
    axisW: make('line', {class: 'bv-axis', 'data-axis': 'w1'}),
    axisB: make('line', {class: 'bv-axis', 'data-axis': 'w2'}),
    axisWName: label('bv-muted', 12, {'data-name': 'axis1', 'text-anchor': 'end'}, '∂L/∂w₁'),
    axisBName: label('bv-muted', 12, {'data-name': 'axis2', 'text-anchor': 'start'}, '∂L/∂w₂'),
    outside: make('path', {class: 'bv-outside', 'data-population': '', fill: 'none'}),
    inside: make('path', {class: 'bv-inside', 'data-members': ''}),
    origin: make('circle', {class: 'bv-origin', r: 3, 'data-origin': ''}),
    truth: make('path', {class: 'bv-truth', 'data-truth': '', fill: 'none'}),
    ring: make('circle', {class: 'bv-ring', r: 7, 'data-truth-ring': ''}),
    estimate: make('path', {class: 'bv-estimate', 'data-estimate': '', fill: 'none'}),
    cloud: make('path', {class: 'bv-cloud', 'data-cloud': '', fill: 'none'}),
    estimateDot: make('circle', {class: 'bv-estimate-dot', r: 4.5, 'data-estimate-dot': ''}),
    truthName: label('bv-gradient-fill bv-symbol', 14, {'data-name': 'truth', 'text-anchor': 'start'}, '∇L'),
    truthValue: label('bv-gradient-fill bv-number', 12, {'data-value': 'truth', 'text-anchor': 'start'}),
    batchName: label('bv-ink bv-number', 12, {'data-name': 'batch', 'text-anchor': 'end'}, 'one batch'),
    batchValue: label('bv-ink bv-number', 12, {'data-value': 'batch', 'text-anchor': 'end'}),
    chartName: label('bv-muted', 12, {'data-name': 'chart', 'text-anchor': 'start'}, 'jitter (sd of the estimate)'),
    chartX: make('line', {class: 'bv-chart-axis', 'data-chart-axis': 'x'}),
    chartY: make('line', {class: 'bv-chart-axis', 'data-chart-axis': 'y'}),
    chartXName: label('bv-muted bv-symbol', 12, {'data-name': 'size', 'text-anchor': 'start'}, 'B'),
    reference: make('path', {class: 'bv-reference', 'data-reference': '', fill: 'none'}),
    referenceLead: make('line', {class: 'bv-lead', 'data-reference-lead': ''}),
    curve: make('path', {class: 'bv-curve', 'data-curve': '', fill: 'none'}),
    referenceName: label('bv-muted bv-number', 11, {'data-name': 'reference', 'text-anchor': 'end'}, 'independent'),
    marker: make('circle', {class: 'bv-marker', r: 5, 'data-marker': ''}),
    markerValue: label('bv-gradient-fill bv-number', 13, {'data-value': 'jitter', 'text-anchor': 'middle'})
  };
  const ticks = [1, 16, 32, 48, 64].map(value => ({value,
    line: make('line', {class: 'bv-tick', 'data-tick': value}),
    text: label('bv-muted bv-number', 11, {'data-tick-label': value}, String(value))}));
  // Each quadrupling the timeline reaches leaves its level behind, so the final frame
  // still carries the whole decline and the ratio between neighbouring stops.
  const levels = fixture.stops.map((stop, index) => ({stop, index,
    rule: make('line', {class: 'bv-level', 'data-level': stop}),
    dot: make('circle', {class: 'bv-level-dot', r: 3.6, 'data-level-dot': stop}),
    drop: make('line', {class: 'bv-drop', 'data-level-drop': stop}),
    text: label('bv-ink bv-number', 12, {'data-value': `level${index}`, 'text-anchor': 'end'})}));
  const brackets = fixture.stops.slice(1).map((stop, index) => ({stop, index,
    mark: make('path', {class: 'bv-bracket', 'data-bracket': stop, fill: 'none'}),
    text: label('bv-muted bv-number', 12, {'data-value': `ratio${index}`, 'text-anchor': 'end'})}));
  $('[data-batch-display]').setAttribute('aria-hidden', 'true');
  slider.min = '1';
  slider.max = String(n);
  slider.step = '1';

  // Geometry. The window is computed from the declared population itself, so it always
  // holds every gradient, the origin and the full-batch gradient with the same unit on
  // both axes: a distance on this picture is an honest distance in the gradient plane.
  const xs = [...population.map(g => g[0]), 0, truth[0]];
  const ys = [...population.map(g => g[1]), 0, truth[1]];
  const view = {
    cx: (Math.min(...xs) + Math.max(...xs)) / 2, cy: (Math.min(...ys) + Math.max(...ys)) / 2,
    half: 1.08 * Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2
  };
  const LAYOUT = {
    wide: {width: 713, height: 396, plane: {x: 10, y: 30, size: 330},
      chart: {x: 404, y: 76, w: 292, h: 210}, title: [404, 60]},
    narrow: {width: 296, height: 580, plane: {x: 6, y: 28, size: 284},
      chart: {x: 52, y: 364, w: 234, h: 164}, title: [6, 344]}
  };
  let g = LAYOUT.wide, mode = 'wide', lastTime = 0, reduced = false, override = null, drawn = '';
  let scale = 1;

  function measure() {
    const width = Math.max(200, Math.round(figure.getBoundingClientRect().width || LAYOUT.wide.width));
    mode = width < 520 ? 'narrow' : 'wide';
    g = LAYOUT[mode];
    scale = g.plane.size / (2 * view.half);
    root.dataset.layout = mode;
    root.dataset.plane = JSON.stringify({...g.plane, scale});
    root.dataset.chart = JSON.stringify(g.chart);
    svg.setAttribute('viewBox', `0 0 ${g.width} ${g.height}`);
  }
  const at = ([w, b]) => [g.plane.x + (w - view.cx + view.half) * scale,
    g.plane.y + g.plane.size - (b - view.cy + view.half) * scale];
  const chartX = size => g.chart.x + g.chart.w * (size - 1) / (n - 1);
  const chartY = value => g.chart.y + g.chart.h * (1 - value / sigma);
  // A label is kept inside the picture by construction: its own estimated box is nudged
  // back from an edge rather than re-anchored, so a label never jumps across its mark.
  // JSDOM lays out no text, so the extent is estimated from the label's own content at
  // about 0.55 em per character — measured off the browser preview at both widths.
  const extent = node => node.textContent.length * Number(node.getAttribute('font-size')) * .55 + 3;
  const put = (node, x, y, anchor = 'middle') => {
    const w = extent(node);
    const left = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
    const shift = left < 6 ? 6 - left : left + w > g.width - 6 ? g.width - 6 - w - left : 0;
    attrs(node, {x: x + shift, y: Math.max(14, Math.min(g.height - 6, y)), 'text-anchor': anchor});
  };
  // Every label on this picture is a name over its number; the pair is clamped once, as a
  // pair, so a label pushed back from an edge can never land on its own second line.
  const pair = (name, value, x, y, anchor = 'middle') => {
    const top = Math.max(16, Math.min(g.height - 21, y));
    put(name, x, top, anchor);
    put(value, x, top + 15, anchor);
  };

  function draw(state) {
    const {size, jitter, opened, curved, recorded} = state;
    const means = estimates(size), shown = means[typical];
    const member = new Set(windowOf(typical, size));
    // Words before positions: a label is placed from its own estimated extent, so it has
    // to carry its final text first. Reveal, never fake — a reading this beat has not
    // earned prints a middle dot, not a zero, which would read as a measurement.
    write(marks.truthValue, `(${plain(truth[0])}, ${plain(truth[1])})`);
    write(marks.batchValue, `B = ${size}`);
    write(marks.markerValue, opened ? plain(jitter) : '·');
    for (const level of levels)
      write(level.text, recorded.includes(level.stop) ? plain(jitterAt(level.stop)) : '·');
    for (const bracket of brackets) {
      const above = fixture.stops[bracket.index], ready = recorded.includes(bracket.stop);
      write(bracket.text, ready ? `×${plain(jitterAt(bracket.stop) / jitterAt(above))}` : '·');
    }
    // The plane: scenery first, then the sixty-four estimates, then the two arrows.
    attrs(marks.frame, {x: g.plane.x, y: g.plane.y, width: g.plane.size, height: g.plane.size});
    const zero = at([0, 0]);
    attrs(marks.axisW, {x1: g.plane.x, x2: g.plane.x + g.plane.size, y1: zero[1], y2: zero[1]});
    attrs(marks.axisB, {x1: zero[0], x2: zero[0], y1: g.plane.y, y2: g.plane.y + g.plane.size});
    put(marks.axisWName, g.plane.x + g.plane.size - 5, zero[1] - 7, 'end');
    put(marks.axisBName, zero[0] + 6, g.plane.y + 13, 'start');
    attrs(marks.origin, {cx: zero[0], cy: zero[1]});
    attrs(marks.outside, {d: population.filter((_, index) => !member.has(index))
      .map(point => square(at(point), 2.6)).join(' ')});
    attrs(marks.inside, {d: population.filter((_, index) => member.has(index))
      .map(point => square(at(point), 2.9)).join(' ')});
    attrs(marks.cloud, {d: means.map(point => diamond(at(point), 3.4)).join(' ')});
    const tip = at(truth), head = at(shown);
    attrs(marks.truth, {d: arrow(zero, tip, 10)});
    attrs(marks.ring, {cx: tip[0], cy: tip[1]});
    attrs(marks.estimate, {d: arrow(zero, head, 8)});
    attrs(marks.estimateDot, {cx: head[0], cy: head[1]});
    const anchor = [tip[0] + 18, tip[1] - 32];
    pair(marks.truthName, marks.truthValue, anchor[0], anchor[1], 'start');
    // The batch's own label steps off its arrow at a right angle, on whichever side is
    // farther from the true gradient's label, so the two never meet when B reaches n.
    const ray = Math.hypot(head[0] - zero[0], head[1] - zero[1]) > 1e-9
      ? [head[0] - zero[0], head[1] - zero[1]] : [tip[0] - zero[0], tip[1] - zero[1]];
    const span = Math.hypot(ray[0], ray[1]) || 1;
    const sides = [1, -1].map(sign => [head[0] + sign * 36 * ray[1] / span,
      head[1] - sign * 36 * ray[0] / span]);
    const away = Math.hypot(sides[0][0] - anchor[0], sides[0][1] - anchor[1])
      >= Math.hypot(sides[1][0] - anchor[0], sides[1][1] - anchor[1]) ? sides[0] : sides[1];
    pair(marks.batchName, marks.batchValue, away[0], away[1],
      away[0] >= head[0] ? 'start' : 'end');
    // The chart: the same jitter a second time, against every batch size at once.
    put(marks.chartName, g.title[0], g.title[1], 'start');
    attrs(marks.chartX, {x1: g.chart.x, x2: g.chart.x + g.chart.w,
      y1: g.chart.y + g.chart.h, y2: g.chart.y + g.chart.h});
    attrs(marks.chartY, {x1: g.chart.x, x2: g.chart.x, y1: g.chart.y, y2: g.chart.y + g.chart.h});
    put(marks.chartXName, g.chart.x + g.chart.w / 2, g.chart.y + g.chart.h + 32);
    for (const tick of ticks) {
      const x = chartX(tick.value);
      attrs(tick.line, {x1: x, x2: x, y1: g.chart.y + g.chart.h, y2: g.chart.y + g.chart.h + 5});
      put(tick.text, x, g.chart.y + g.chart.h + 17);
    }
    const path = (fn) => {
      let d = '';
      for (let size = 1; size <= n; size++)
        d += `${size === 1 ? 'M' : ' L'} ${px(chartX(size))} ${px(chartY(fn(size)))}`;
      return d;
    };
    attrs(marks.curve, {d: curved ? path(jitterAt) : ''});
    attrs(marks.reference, {d: curved ? path(independentAt) : ''});
    const refEnd = [chartX(n), chartY(independentAt(n))];
    put(marks.referenceName, refEnd[0] - 6, refEnd[1] - 26, 'end');
    attrs(marks.referenceLead, {x1: refEnd[0] - 34, x2: refEnd[0] - 34,
      y1: refEnd[1] - 22, y2: refEnd[1] - 4});
    for (const level of levels) {
      const seen = recorded.includes(level.stop), y = chartY(jitterAt(level.stop));
      attrs(level.rule, {x1: g.chart.x, x2: g.chart.x + g.chart.w, y1: y, y2: y});
      attrs(level.dot, {cx: chartX(level.stop), cy: y});
      attrs(level.drop, {x1: chartX(level.stop), x2: chartX(level.stop),
        y1: y, y2: g.chart.y + g.chart.h});
      put(level.text, g.chart.x - 12, y + 4, 'end');
      for (const node of [level.rule, level.dot, level.drop, level.text]) show(node, seen);
    }
    // Each halving is a bracket on the jitter ruler itself, so the reader reads the
    // ratio off the same scale the levels are on rather than from a second diagram.
    const bracketX = g.chart.x - 4;
    for (const bracket of brackets) {
      const seen = recorded.includes(bracket.stop);
      const top = chartY(jitterAt(fixture.stops[bracket.index])), bottom = chartY(jitterAt(bracket.stop));
      attrs(bracket.mark, {d: `M ${px(bracketX - 4)} ${px(top)} L ${px(bracketX)} ${px(top)}`
        + ` L ${px(bracketX)} ${px(bottom)} L ${px(bracketX - 4)} ${px(bottom)}`});
      put(bracket.text, g.chart.x - 12, (top + bottom) / 2 + 4, 'end');
      show(bracket.mark, seen); show(bracket.text, seen);
    }
    const x = chartX(size), y = chartY(jitter);
    attrs(marks.marker, {cx: x, cy: y});
    // The live reading rides its marker, stepping aside at the two corners the marker
    // reaches: beside it at the top of the scale, behind it at the right-hand end.
    const high = y < g.chart.y + 26, far = x > g.chart.x + g.chart.w - 30;
    put(marks.markerValue, high ? x + 12 : far ? x - 12 : x, high || far ? y + 4 : y - 12,
      high ? 'start' : far ? 'end' : 'middle');
    show(marks.marker, opened); show(marks.markerValue, opened);
    show(marks.curve, curved); show(marks.reference, curved);
    show(marks.referenceName, curved); show(marks.referenceLead, curved);
    const description = opened ? pictures.shown : pictures.hidden;
    if (svg.getAttribute('aria-label') !== description) svg.setAttribute('aria-label', description);
    formula.classList.toggle('bv-split-shown', true);
    formula.classList.toggle('bv-law-shown', opened);
    formula.classList.toggle('bv-root-lit', curved && size < all);
    formula.classList.toggle('bv-finite-lit', size === all);
  }

  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const clamped = Math.max(0, Math.min(duration, Number.isFinite(time) ? time : 0));
    const stage = stageAt(clamped), held = reducedMotion ? REST[stage] : clamped;
    const dragged = override !== null;
    const size = dragged ? override : sizeAt(held);
    const jitter = jitterAt(size), independent = independentAt(size);
    const opened = held >= beats[1];
    // The first quadrupling's answer waits for the glide that earns it: no curve and no
    // second level exists while the caption is asking the reader to predict.
    // A reading is on the board once the timeline has earned it — or once the reader's
    // own drag has taken the batch there, which is the same question answered by hand.
    const curved = held >= RECORDED[1] || dragged;
    const recorded = fixture.stops.filter((stop, index) =>
      opened && (held >= RECORDED[index] || size >= stop));
    const shown = batchMean(typical, size), spread = spreadOf(estimates(size));
    const state = {stage, size, jitter, independent, opened, curved, recorded, dragged};
    Object.assign(root.dataset, {stage: String(stage), batch: String(size),
      jitter: String(jitter), independent: String(independent), sigma: String(sigma),
      examples: String(n), truth: JSON.stringify(truth), estimate: JSON.stringify(shown),
      spread: String(spread), opened: String(opened), curves: String(curved),
      recorded: recorded.join(' '), override: dragged ? 'slider' : ''});
    const key = `${stage}|${size}|${opened}|${curved}|${recorded.join('')}|${mode}`;
    if (key !== drawn) { drawn = key; draw(state); }
    // Restore the requested value as well as the picture: pausing during a drag may have
    // repainted the slider from the timeline.
    slider.value = String(size);
    write(readout, String(size));
    slider.setAttribute('aria-valuetext', `Batch of ${size} out of ${n} examples. `
      + `${opened ? `Jitter ${plain(jitter)}. ` : ''}`
      + (size === n ? 'The batch is the whole population, so the noise is exactly zero.'
        : 'Jitter falls like one over the square root of the batch size.'));
    const sentence = dragged ? dragging : captions[stage];
    if (caption.textContent !== sentence) caption.textContent = sentence;
    return `${names[stage]}. Batch ${size}.${opened ? ` Jitter ${plain(jitter)}.` : ''}`;
  }

  function drag() {
    const requested = Math.max(1, Math.min(n, Math.round(Number(slider.value))));
    if (root.dataset.playing === 'true') $('[data-action="play"]').click();
    override = requested;
    render(lastTime, reduced);
  }
  slider.addEventListener('input', drag);
  slider.addEventListener('change', drag);
  pane.addEventListener('click', event => {
    if (event.target.closest('[data-action="play"]') && root.dataset.playing !== 'true') override = null;
  }, true);
  // The detour ends only when the transport really acts, matching shared/playback.js's
  // own guard: a key it ignores must leave the dragged batch size alone.
  pane.addEventListener('keydown', event => {
    if (event.target !== pane || event.altKey || event.ctrlKey || event.metaKey) return;
    const toggles = [' ', 'k', 'K'].includes(event.key);
    if (toggles && (event.repeat || root.dataset.playing === 'true')) return;
    if (toggles || ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) override = null;
  }, true);
  $('[data-controls] input[type="range"]').addEventListener('input', () => { override = null; });

  function typeset() {
    const done = () => { root.dataset.typeset = root.querySelector('mjx-container') ? 'mathjax' : 'none'; };
    const mathjax = window.MathJax;
    if (mathjax && typeof mathjax.typesetPromise === 'function' && !root.querySelector('mjx-container'))
      mathjax.typesetPromise([root]).then(done, done);
    else done();
  }

  measure();
  window.BookPlayback(root, render, () => { measure(); drawn = ''; render(lastTime, reduced); });
  typeset();
})();
