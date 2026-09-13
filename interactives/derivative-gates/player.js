(() => {
  const root = document.getElementById('derivative-gates-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  const fixture = JSON.parse(root.dataset.fixture);
  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration);
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const ease = value => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };
  const stageAt = time => beats.reduce((stage, beat, index) => time >= beat ? index : stage, 0);
  function validate(source) {
    if (!source || !Array.isArray(source.domain) || source.domain.length !== 2
      || !source.domain.every(Number.isFinite) || source.domain[0] >= 0 || source.domain[1] <= 0
      || source.domain.some(value => Math.abs(value) > 30)
      || !Number.isInteger(source.samples) || source.samples < 2 || source.samples > 2000
      || !Number.isInteger(source.maxGates) || source.maxGates < 1 || source.maxGates > 100)
      throw Error('derivative-gates: finite domain straddling zero within [-30,30], 2-2000 samples, and 1-100 gates required');
  }
  function gates(z) {
    // Exact analytic identities, including PyTorch's backprop convention at zero.
    if (z === 0) return { sigmoid: 1 / 2, sigmoidGate: 1 / 4, reluGate: 0 };
    const e = Math.exp(-Math.abs(z)), denominator = 1 + e;
    return { sigmoid: z >= 0 ? 1 / denominator : e / denominator,
      sigmoidGate: e / (denominator * denominator), reluGate: z > 0 ? 1 : 0 };
  }
  function buildState(time, reducedMotion = false, source = fixture) {
    validate(source);
    const bounded = clamp(Number.isFinite(time) ? time : 0, 0, duration);
    const stage = stageAt(bounded), held = reducedMotion ? beats[stage] : bounded;
    const z = source.domain[1] * ease((held - 12) / 3), values = gates(z);
    const kind = stage === 5 ? 'relu' : 'sigmoid';
    const factor = kind === 'sigmoid' ? values.sigmoidGate : values.reluGate;
    const activation = kind === 'sigmoid' ? values.sigmoid : Math.max(0, z);
    const localProgress = stage === 0 ? 0 : stage === 1 ? ease((held - 7) / 3)
      : stage === 3 ? ease((held - 17) / 3) : 1;
    const localPassed = localProgress >= 0.5;
    const curve = Array.from({ length: source.samples }, (_, i) => {
      const coordinate = source.domain[0] + (source.domain[1] - source.domain[0]) * i / (source.samples - 1);
      return { z: coordinate, ...gates(coordinate) };
    });
    const ceiling = gates(0).sigmoidGate;
    const travel = clamp((held - 30) / 5, 0, 1) * (source.maxGates + 1);
    const gateCount = Math.min(source.maxGates, Math.floor(travel));
    const bounds = Array.from({ length: source.maxGates + 1 }, (_, k) => ({ k, value: ceiling ** k }));
    return { stage, time: bounded, held, z, ...values, kind, factor, activation, localProgress,
      localPassed, signalValue: localPassed ? factor : 1, curve, ceiling, travel, gateCount,
      bound: bounds[gateCount].value, bounds, maxGates: source.maxGates, domain: source.domain.slice(),
      backwardVisible: stage >= 1, chainVisible: stage >= 6, boundaryVisible: stage >= 7 };
  }
  validate(fixture);
  window.BookDerivativeGates = Object.freeze({ buildState });
  const names = ['Forward is not backward', 'Send a unit backward probe', 'Multiply at the component',
    'A large forward activation', 'A tiny backward sensitivity', 'Substitute active ReLU',
    'Isolate the activation factors', 'A ceiling, not a whole-network gradient'];
  const captions = [
    'This neuron is active. Does that mean a strong backward signal will pass through it?',
    'Send a unit sensitivity backward through the same component. The forward value stays cached.',
    'At zero, the backward factor is one quarter. Now move the input toward saturation.',
    'Move into saturation: the output approaches one. Predict what happens to the backward signal.',
    'A large output, but almost no local sensitivity. Forward activity and backward sensitivity are different quantities.',
    'At the same positive input, ReLU passes the backward probe unchanged. Inactive ReLU would block it.',
    'Now isolate sigmoid factors along a backward path. Even their best-case multipliers compound at every component.',
    'Ten sigmoid factors: below one millionth, not zero. Weight matrices and branching still affect the full gradient.'
  ];
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const drawing = svg.querySelector('[data-drawing]'), formula = $('[data-formula]'), caption = $('[data-caption]');
  drawing.replaceChildren();
  const NS = 'http://www.w3.org/2000/svg';
  // Quantize geometry only, never the mathematical state or multiplier.
  const pixel = value => Number(value.toFixed(9));
  const attrs = (node, values) => {
    for (const [key, value] of Object.entries(values))
      node.setAttribute(key, typeof value === 'number' ? String(pixel(value)) : String(value));
  };
  const make = (tag, attributes = {}, text = '', parent = drawing) => {
    const node = document.createElementNS(NS, tag); attrs(node, attributes);
    node.textContent = text; parent.appendChild(node); return node;
  };
  const label = (text, cls = '', attributes = {}, parent = drawing) =>
    make('text', { class: cls, 'text-anchor': 'middle', ...attributes }, text, parent);
  const show = (node, visible) => visible ? node.removeAttribute('hidden') : node.setAttribute('hidden', '');
  const path = points => points.map((p, i) => `${i ? 'L' : 'M'} ${pixel(p[0])} ${pixel(p[1])}`).join(' ');
  const number = value => value === 0 || value === 1 ? String(value)
    : value < 0.0001 ? value.toExponential(2) : Number(value.toPrecision(4)).toString();
  const heading = label('Active forward, quiet backward', 'dg-heading', { 'data-picture-title': '' });
  const insets = ['sigmoid', 'relu'].map(kind => {
    const group = make('g', { 'data-inset': kind, 'data-quantity': 'activation-function' });
    return { group, title: label(kind === 'sigmoid' ? 'sigmoid' : 'ReLU', 'dg-small', {}, group),
      axes: make('path', { class: 'dg-axis' }, '', group),
      curve: make('path', { class: 'dg-activation-curve', 'data-activation-curve': kind }, '', group),
      zero: label('0', 'dg-small dg-muted', {}, group),
      top: label('', 'dg-small dg-muted', {}, group),
      end: label('', 'dg-small dg-muted', {}, group),
      dot: make('circle', { r: 3, class: 'dg-output-dot', 'data-activation-marker': kind }, '', group),
      tangent: make('line', { class: 'dg-tangent', 'data-tangent': kind }, '', group) };
  });
  const insetNote = label('activation shapes · own vertical axes', 'dg-small dg-muted', { 'data-inset-note': '' });
  const forwardTitle = label('FORWARD →', 'dg-output dg-small', { 'data-forward-title': '' });
  const forward = make('g', { 'data-forward-network': '' });
  const forwardLeft = make('path', { class: 'dg-forward-wire', 'data-forward-left': '' }, '', forward);
  const forwardRight = make('path', { class: 'dg-forward-wire', 'data-forward-right': '' }, '', forward);
  const forwardArrows = [0, 1].map(i => make('path', { class: 'dg-forward-arrow', 'data-forward-arrow': i }, '', forward));
  const inputNode = make('circle', { r: 19, class: 'dg-input-node', 'data-input-node': '' }, '', forward);
  const actNode = make('rect', { width: 84, height: 54, rx: 12, class: 'dg-component', 'data-activation-node': '' }, '', forward);
  const outputNode = make('circle', { r: 19, class: 'dg-output-node', 'data-output-node': '' }, '', forward);
  const inputName = label('z', 'dg-input', {}, forward);
  const actName = label('', '', { 'data-activation-name': '' }, forward);
  const outputName = label('a', 'dg-output', {}, forward);
  const zLabel = label('', 'dg-input', { 'data-z-value': '' }, forward);
  const aLabel = label('', 'dg-output', { 'data-activation-value': '' }, forward);
  const zNote = label('from sum', 'dg-small dg-muted', {}, forward);
  const aNote = label('to next layer', 'dg-small dg-muted', {}, forward);
  const cacheLink = make('path', { class: 'dg-cache-link', 'data-cache-link': '' });
  const backward = make('g', { 'data-backward-network': '', 'data-quantity': 'local-backward-sensitivity' });
  const reverseWire = make('path', { class: 'dg-reverse-wire', 'data-reverse-wire': '' }, '', backward);
  const reverseArrows = [0, 1].map(i => make('path', { class: 'dg-reverse-arrow', 'data-reverse-arrow': i }, '', backward));
  const gateNode = make('rect', { width: 104, height: 34, rx: 7, class: 'dg-multiplier', 'data-local-multiplier': '' }, '', backward);
  const gateLabel = label('', 'dg-error', { 'data-factor-value': '' }, backward);
  const upstream = label('unit probe: 1', 'dg-error', { 'data-upstream-value': '' }, backward);
  const downstream = label('', 'dg-error', { 'data-downstream-value': '' }, backward);
  const backTitle = label('← BACKWARD', 'dg-error dg-small', { 'data-backward-title': '' }, backward);
  const localRing = make('circle', { r: 16, class: 'dg-locator', 'data-local-locator': '' }, '', backward);
  const localPulse = make('circle', { class: 'dg-sensitivity', 'data-local-pulse': '' }, '', backward);
  const legend = label('filled area = sensitivity · ring = location', 'dg-small dg-muted', { 'data-signal-legend': '' });
  const chain = make('g', { 'data-factor-chain': '', 'data-quantity': 'sigmoid-activation-factor-ceiling' });
  const chainTitle = label('Isolate the sigmoid factors', '', { 'data-chain-title': '' }, chain);
  const chainNote = label('Best case at every gate · weights omitted', 'dg-small dg-muted', { 'data-chain-note': '' }, chain);
  const chainWire = make('path', { class: 'dg-reverse-wire', 'data-chain-wire': '' }, '', chain);
  const chainNodes = Array.from({ length: fixture.maxGates }, (_, i) => ({
    node: make('circle', { r: 17, class: 'dg-chain-node', 'data-gate': i + 1 }, '', chain),
    name: label('×¼', 'dg-small', { 'data-gate-label': i + 1 }, chain),
    index: label(String(i + 1), 'dg-small dg-muted', { 'data-gate-index': i + 1 }, chain),
    arrow: make('path', { class: 'dg-reverse-arrow', 'data-chain-arrow': i + 1 }, '', chain)
  }));
  const chainRing = make('circle', { r: 16, class: 'dg-locator', 'data-chain-locator': '' }, '', chain);
  const chainPulse = make('circle', { class: 'dg-sensitivity', 'data-chain-pulse': '' }, '', chain);
  const boundLabel = label('', 'dg-error', { 'data-bound-value': '', 'data-value': 'bound' }, chain);
  const scope = label('', 'dg-small dg-muted', { 'data-chain-scope': '' }, chain);
  let width = 713, lastTime = 0, reduced = false;
  function measure() {
    width = Math.max(240, Math.round(figure.getBoundingClientRect().width || 713));
    root.dataset.layout = width < 560 ? 'narrow' : 'wide';
  }
  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const state = buildState(time, reducedMotion), { stage } = state, narrow = width < 560;
    const cx = width / 2, lx = 45, rx = width - 45, fy = 182, by = 252;
    const chainY = 392, rowGap = 74, columns = narrow ? (width < 280 ? 4 : 5) : fixture.maxGates;
    const height = chainY + Math.floor((fixture.maxGates - 1) / columns) * rowGap + 84;
    const pulseX = rx + (lx - rx) * state.localProgress;
    const pulseRadius = 14 * Math.sqrt(state.signalValue);
    const positions = chainNodes.map((_, i) => {
      const row = Math.floor(i / columns), column = i % columns;
      const cell = row % 2 === 0 ? columns - 1 - column : column;
      return [50 + (width - 100) * cell / (columns - 1), chainY + row * rowGap];
    });
    const lastRow = Math.floor((fixture.maxGates - 1) / columns);
    const points = [[width - 20, chainY], ...positions,
      [lastRow % 2 === 0 ? 20 : width - 20, positions[positions.length - 1][1]]];
    const segment = Math.min(points.length - 2, Math.floor(state.travel)), fraction = state.travel - segment;
    const moving = points[segment].map((value, axis) => value + (points[segment + 1][axis] - value) * fraction);
    Object.assign(root.dataset, {
      stage: String(stage), held: String(state.held), z: String(state.z), sigmoid: String(state.sigmoid),
      sigmoidGate: String(state.sigmoidGate), reluGate: String(state.reluGate), kind: state.kind,
      activation: String(state.activation), factor: String(state.factor), localProgress: String(state.localProgress),
      localPassed: String(state.localPassed), signalValue: String(state.signalValue), ceiling: String(state.ceiling),
      gateCount: String(state.gateCount), bound: String(state.bound), travel: String(state.travel),
      curve: JSON.stringify(state.curve), bounds: JSON.stringify(state.bounds),
      backwardVisible: String(state.backwardVisible), chainVisible: String(state.chainVisible),
      boundaryVisible: String(state.boundaryVisible), networkLeft: String(lx), networkRight: String(rx),
      networkCenter: String(cx), forwardY: String(fy), backwardY: String(by),
      chainPoints: JSON.stringify(points), unitRadius: '14', insetWidth: '94', insetHeight: '42'
    });
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('aria-label', `${names[stage]}. At z ${number(state.z)}, ${state.kind} activation ${number(state.activation)}.`
      + (state.backwardVisible ? ` A unit backward probe is multiplied by ${number(state.factor)}. The forward value stays cached.` : '')
      + (state.chainVisible ? ` Best-case sigmoid factors only: ${state.gateCount} gates, ceiling ${state.bound}. Not the complete network gradient.` : ''));
    attrs(heading, { x: cx, y: 19 });
    insets.forEach((inset, i) => {
      const left = cx + (i === 0 ? -108 : 14), top = 48, iw = 94, ih = 42;
      const maximum = i === 0 ? 1 : state.domain[1];
      const px = z => left + (z - state.domain[0]) / (state.domain[1] - state.domain[0]) * iw;
      const py = value => top + ih - value / maximum * ih;
      const activation = i === 0 ? state.sigmoid : Math.max(0, state.z);
      const slope = i === 0 ? state.sigmoidGate : state.reluGate;
      attrs(inset.group, { 'data-active': String((state.kind === 'sigmoid') === (i === 0)),
        'data-left': left, 'data-top': top, 'data-width': iw, 'data-height': ih, 'data-y-max': maximum });
      attrs(inset.title, { x: left + iw / 2, y: 38 });
      attrs(inset.axes, { d: path([[left, top], [left, top + ih], [left + iw, top + ih]]) });
      const samples = i === 0 ? state.curve.map(point => [point.z, point.sigmoid])
        : [[state.domain[0], 0], [0, 0], [state.domain[1], state.domain[1]]];
      attrs(inset.curve, { d: path(samples.map(point => [px(point[0]), py(point[1])])) });
      attrs(inset.zero, { x: left - 7, y: top + ih + 4 });
      attrs(inset.top, { x: left - 7, y: top + 4 }); inset.top.textContent = number(maximum);
      attrs(inset.end, { x: left + iw, y: top + ih + 13 }); inset.end.textContent = number(state.domain[1]);
      attrs(inset.dot, { cx: px(state.z), cy: py(activation) });
      const span = (state.domain[1] - state.domain[0]) * 0.11;
      const za = Math.max(state.domain[0], state.z - span), zb = Math.min(state.domain[1], state.z + span);
      attrs(inset.tangent, { x1: px(za), y1: py(activation + slope * (za - state.z)),
        x2: px(zb), y2: py(activation + slope * (zb - state.z)) });
      show(inset.tangent, i === 0 || state.z !== 0);
    });
    attrs(insetNote, { x: cx, y: 121 });
    attrs(forwardTitle, { x: cx, y: 145 });
    attrs(forwardLeft, { d: path([[lx + 19, fy], [cx - 42, fy]]) });
    attrs(forwardRight, { d: path([[cx + 42, fy], [rx - 19, fy]]) });
    forwardArrows.forEach((arrow, i) => {
      const x = i ? rx - 22 : cx - 45;
      attrs(arrow, { d: path([[x - 5, fy - 4], [x, fy], [x - 5, fy + 4]]) });
    });
    attrs(inputNode, { cx: lx, cy: fy }); attrs(actNode, { x: cx - 42, y: fy - 27 });
    attrs(outputNode, { cx: rx, cy: fy });
    attrs(inputName, { x: lx, y: fy + 4 }); attrs(outputName, { x: rx, y: fy + 4 });
    attrs(actName, { x: cx, y: fy + 4 }); actName.textContent = state.kind === 'sigmoid' ? 'sigmoid' : 'ReLU';
    attrs(zLabel, { x: lx, y: 152 }); zLabel.textContent = `z = ${number(state.z)}`;
    attrs(aLabel, { x: rx, y: 152 }); aLabel.textContent = `a = ${number(state.activation)}`;
    attrs(zNote, { x: lx, y: 217 }); attrs(aNote, { x: rx, y: 217 });
    attrs(cacheLink, { d: path([[cx, fy + 27], [cx, by - 17]]) }); show(cacheLink, state.backwardVisible);
    show(backward, state.backwardVisible);
    attrs(reverseWire, { d: path([[rx, by], [lx, by]]) });
    reverseArrows.forEach((arrow, i) => {
      const x = i ? cx + 56 : lx + 4;
      attrs(arrow, { d: path([[x + 5, by - 4], [x, by], [x + 5, by + 4]]) });
    });
    attrs(gateNode, { x: cx - 52, y: by - 17 });
    attrs(gateLabel, { x: cx, y: by + 5 }); gateLabel.textContent = `× ${number(state.factor)}`;
    attrs(upstream, { x: rx, y: by + 35 });
    attrs(downstream, { x: lx, y: by + 35 }); downstream.textContent = state.localPassed ? number(state.factor) : '?';
    attrs(backTitle, { x: cx, y: by + 36 });
    // Filled area, not radius, encodes sensitivity. The hollow locator has no magnitude meaning.
    attrs(localRing, { cx: pulseX, cy: by });
    attrs(localPulse, { cx: pulseX, cy: by, r: pulseRadius });
    attrs(legend, { x: cx, y: 313 }); show(legend, state.backwardVisible);
    show(chain, state.chainVisible);
    attrs(chainTitle, { x: cx, y: 342 }); attrs(chainNote, { x: cx, y: 360 });
    attrs(chainWire, { d: path(points) });
    chainNodes.forEach((gate, i) => {
      const [x, y] = positions[i], passed = i < state.gateCount;
      attrs(gate.node, { cx: x, cy: y, 'data-passed': String(passed) });
      attrs(gate.name, { x, y: y + 4 }); attrs(gate.index, { x, y: y + 32 });
      const next = points[i + 2], dx = next[0] - x, dy = next[1] - y, norm = Math.hypot(dx, dy);
      const ax = x + dx * 0.55, ay = y + dy * 0.55, ux = dx / norm, uy = dy / norm;
      attrs(gate.arrow, { d: path([[ax - 4 * ux - 3 * uy, ay - 4 * uy + 3 * ux],
        [ax, ay], [ax - 4 * ux + 3 * uy, ay - 4 * uy - 3 * ux]]) });
    });
    attrs(chainRing, { cx: moving[0], cy: moving[1] });
    attrs(chainPulse, { cx: moving[0], cy: moving[1], r: 14 * Math.sqrt(state.bound) });
    attrs(boundLabel, { x: cx, y: height - 26 });
    boundLabel.textContent = `${state.gateCount} factors: at most ${number(state.bound)}`;
    attrs(scope, { x: cx, y: height - 8 });
    scope.textContent = state.boundaryVisible ? 'Tiny is not zero. This is not the full gradient.' : 'Read the number when the fill becomes too small to see.';
    formula.classList.toggle('dg-local-shown', state.backwardVisible);
    formula.classList.toggle('dg-bound-shown', state.chainVisible);
    formula.classList.toggle('dg-highlight-sigmoid', state.kind === 'sigmoid');
    formula.classList.toggle('dg-highlight-relu', state.kind === 'relu');
    if (caption.textContent !== captions[stage]) caption.textContent = captions[stage];
    return `${names[stage]}. ${state.kind} at z ${number(state.z)}.`
      + (state.chainVisible ? ` ${state.gateCount} factors; ceiling ${state.bound}.` : '');
  }
  function typeset() {
    const done = () => { root.dataset.typeset = root.querySelector('mjx-container') ? 'mathjax' : 'none'; };
    const mathjax = window.MathJax;
    if (mathjax && typeof mathjax.typesetPromise === 'function' && !root.querySelector('mjx-container'))
      mathjax.typesetPromise([root]).then(done, done);
    else done();
  }
  measure(); window.BookPlayback(root, render, () => { measure(); render(lastTime, reduced); }); typeset();
})();
