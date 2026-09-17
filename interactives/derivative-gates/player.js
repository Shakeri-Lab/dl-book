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
  // Timeline, in content seconds. A beat stands still for HOLD before anything moves: reading
  // and predicting time. A probe then takes TRAVEL to cross the component and meets the
  // multiplier halfway, so the factor it reveals holds two seconds before the next caption.
  const HOLD = 2, TRAVEL = 2, FADE = 0.6;
  const glide = [beats[2] + HOLD, beats[3]]; // z leaves zero, and is at the domain edge on the beat
  const probeAt = (held, beat) => ease((held - beat - HOLD) / TRAVEL);
  function validate(source) {
    if (!source || !Array.isArray(source.domain) || source.domain.length !== 2
      || !source.domain.every(Number.isFinite) || source.domain[0] >= 0 || source.domain[1] <= 0
      || source.domain.some(value => Math.abs(value) > 30)
      || !Number.isInteger(source.samples) || source.samples < 2 || source.samples > 2000
      || !Number.isInteger(source.maxGates) || source.maxGates < 2 || source.maxGates > 100)
      throw Error('derivative-gates: finite domain straddling zero within [-30,30], 2-2000 samples, and 2-100 gates required');
  }
  function gates(z) {
    // Exact analytic identities, including PyTorch's backprop convention at zero.
    if (z === 0) return { sigmoid: 1 / 2, sigmoidGate: 1 / 4, reluGate: 0 };
    const e = Math.exp(-Math.abs(z)), denominator = 1 + e;
    return { sigmoid: z >= 0 ? 1 / denominator : e / denominator,
      sigmoidGate: e / (denominator * denominator), reluGate: z > 0 ? 1 : 0 };
  }
  // What depends on the fixture alone: the sampled curve and the quarter-power ceilings.
  function tables(source) {
    validate(source);
    const [low, high] = source.domain, ceiling = gates(0).sigmoidGate;
    return Object.freeze({ ceiling,
      curve: Object.freeze(Array.from({ length: source.samples }, (_, i) => {
        const z = low + (high - low) * i / (source.samples - 1);
        return Object.freeze({ z, ...gates(z) });
      })),
      bounds: Object.freeze(Array.from({ length: source.maxGates + 1 },
        (_, k) => Object.freeze({ k, value: ceiling ** k }))) });
  }
  const own = tables(fixture); // built once; an alternate source is an API path, never a frame
  function buildState(time, reducedMotion = false, source = fixture) {
    const fixed = source === fixture ? own : tables(source);
    const bounded = clamp(Number.isFinite(time) ? time : 0, 0, duration);
    const stage = stageAt(bounded), held = reducedMotion ? beats[stage] : bounded;
    const z = source.domain[1] * ease((held - glide[0]) / (glide[1] - glide[0])), values = gates(z);
    const kind = stage === 5 ? 'relu' : 'sigmoid';
    const factor = kind === 'sigmoid' ? values.sigmoidGate : values.reluGate;
    const activation = kind === 'sigmoid' ? values.sigmoid : Math.max(0, z);
    // The probe: 0 is the output side, 1 the input side. Once z leaves zero the quarter it
    // delivered is stale: that packet fades where it lies, at its measured size, and a fresh
    // unit probe fades in at the output side, ready on the next beat. Nothing is measured
    // while z moves, so nothing about the new factor can be read before a probe crosses.
    let localProgress = stage === 0 ? 0 : 1, probeOpacity = 1;
    const stale = stage === 2 && held > glide[0];
    if (stage === 1 || stage === 3) localProgress = probeAt(held, beats[stage]);
    else if (stale) {
      const leaving = 1 - clamp((held - glide[0]) / FADE, 0, 1);
      localProgress = leaving > 0 ? 1 : 0;
      probeOpacity = leaving > 0 ? leaving : clamp((held - (glide[1] - FADE)) / FADE, 0, 1);
    }
    // The factor is printed when a probe meets the multiplier at the current input; the
    // delivered value is printed beside the packet once it arrives at the input side.
    const localPassed = localProgress >= 0.5, revealed = stage >= 1 && localPassed && !stale;
    const travel = clamp((held - 30) / 5, 0, 1) * (source.maxGates + 1);
    const gateCount = Math.min(source.maxGates, Math.floor(travel));
    return { stage, time: bounded, held, z, ...values, kind, factor, activation, localProgress,
      localPassed, probeOpacity, revealed, delivered: revealed && localProgress >= 1,
      // A stale packet keeps the area it was measured at: sigmoid'(0), the quarter ceiling.
      signalValue: !localPassed ? 1 : stale ? fixed.ceiling : factor,
      curve: fixed.curve, ceiling: fixed.ceiling, travel, gateCount,
      bound: fixed.bounds[gateCount].value, bounds: fixed.bounds, maxGates: source.maxGates,
      domain: source.domain.slice(),
      backwardVisible: stage >= 1, chainVisible: stage >= 6, boundaryVisible: stage >= 7 };
  }
  window.BookDerivativeGates = Object.freeze({ buildState });
  const names = ['Forward is not backward', 'Send a unit backward probe', 'Multiply at the component',
    'A large forward activation', 'A tiny backward sensitivity', 'Substitute active ReLU',
    'Isolate the activation factors', 'A ceiling, not a whole-network gradient'];
  const captions = [
    'This neuron is active. Does that mean a strong backward signal will pass through it?',
    'Send a unit sensitivity backward through the same component. The forward value stays cached.',
    'At zero, the backward factor is one quarter. Now move the input toward saturation.',
    'The output is now almost one. Predict what happens to the backward signal.',
    'A large output, but almost no local sensitivity. Forward activity and backward sensitivity are different quantities.',
    'At the same positive input, ReLU passes the backward probe unchanged. Inactive ReLU would block it.',
    'Now isolate sigmoid factors along a backward path. Even their best-case multipliers compound at every component.',
    'Ten sigmoid factors: below one millionth, not zero. Weight matrices and branching still affect the full gradient.'
  ];
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const drawing = svg.querySelector('[data-drawing]'), formula = $('[data-formula]'), caption = $('[data-caption]');
  drawing.replaceChildren();
  const NS = 'http://www.w3.org/2000/svg';
  // Quantize geometry only (0.0001 px), never the mathematical state or multiplier.
  const pixel = value => Number(value.toFixed(4));
  const attrs = (node, values) => {
    for (const [key, value] of Object.entries(values)) {
      const text = typeof value === 'number' ? String(pixel(value)) : String(value);
      if (node.getAttribute(key) !== text) node.setAttribute(key, text); // a still frame writes nothing
    }
  };
  const make = (tag, attributes = {}, text = '', parent = drawing) => {
    const node = document.createElementNS(NS, tag); attrs(node, attributes);
    node.textContent = text; parent.appendChild(node); return node;
  };
  const label = (text, cls = '', attributes = {}, parent = drawing) =>
    make('text', { class: cls, 'text-anchor': 'middle', ...attributes }, text, parent);
  const show = (node, visible) => { if (node.hasAttribute('hidden') === visible) node.toggleAttribute('hidden', !visible); };
  const write = (node, text) => { if (node.textContent !== text) node.textContent = text; };
  const path = points => points.map((p, i) => `${i ? 'L' : 'M'} ${pixel(p[0])} ${pixel(p[1])}`).join(' ');
  // One formatter for every number a reader or a screen reader meets: four significant
  // figures, U+2212 for minus, and a Unicode power of ten where e-notation would appear.
  const SUPERSCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const power = exponent => `10${exponent < 0 ? '⁻' : ''}`
    + [...String(Math.abs(exponent))].map(digit => SUPERSCRIPT[digit]).join('');
  function number(value) {
    if (value === 0) return '0';
    const sign = value < 0 ? '−' : '', size = Math.abs(value);
    if (size >= 0.0001) return `${sign}${Number(size.toPrecision(4))}`;
    let exponent = Math.floor(Math.log10(size)), mantissa = size / 10 ** exponent;
    if (Number(mantissa.toFixed(2)) >= 10) { mantissa /= 10; exponent += 1; }
    return `${sign}${mantissa.toFixed(2)} × ${power(exponent)}`;
  }
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
  // The probe is drawn under the multiplier: it goes in at one size and comes out at another,
  // and its ring never crosses the factor printed on the box.
  const probe = make('g', { 'data-local-probe': '' }, '', backward);
  const localRing = make('circle', { r: 16, class: 'dg-locator', 'data-local-locator': '' }, '', probe);
  const localPulse = make('circle', { class: 'dg-sensitivity', 'data-local-pulse': '' }, '', probe);
  const gateNode = make('rect', { width: 104, height: 34, rx: 7, class: 'dg-multiplier', 'data-local-multiplier': '' }, '', backward);
  const gateLabel = label('', 'dg-error', { 'data-factor-value': '' }, backward);
  const upstream = label('unit probe: 1', 'dg-error', { 'data-upstream-value': '' }, backward);
  const downstream = label('', 'dg-error', { 'data-downstream-value': '' }, backward);
  const backTitle = label('← BACKWARD', 'dg-error dg-small', { 'data-backward-title': '' }, backward);
  const legend = label('filled area = sensitivity · ring = location', 'dg-small dg-muted', { 'data-signal-legend': '' });
  const chain = make('g', { 'data-factor-chain': '', 'data-quantity': 'sigmoid-activation-factor-ceiling' });
  const chainTitle = label('Isolate the sigmoid factors', '', { 'data-chain-title': '' }, chain);
  const chainNote = label('Best case at every gate · weights omitted', 'dg-small dg-muted', { 'data-chain-note': '' }, chain);
  const chainWire = make('path', { class: 'dg-reverse-wire', 'data-chain-wire': '' }, '', chain);
  const chainRing = make('circle', { r: 16, class: 'dg-locator', 'data-chain-locator': '' }, '', chain);
  const chainPulse = make('circle', { class: 'dg-sensitivity', 'data-chain-pulse': '' }, '', chain);
  const chainNodes = Array.from({ length: fixture.maxGates }, (_, i) => ({
    node: make('circle', { r: 17, class: 'dg-chain-node', 'data-gate': i + 1 }, '', chain),
    name: label('×¼', 'dg-small', { 'data-gate-label': i + 1 }, chain),
    index: label(String(i + 1), 'dg-small dg-muted', { 'data-gate-index': i + 1 }, chain),
    arrow: make('path', { class: 'dg-reverse-arrow', 'data-chain-arrow': i + 1 }, '', chain)
  }));
  const boundLabel = label('', 'dg-error', { 'data-bound-value': '', 'data-value': 'bound' }, chain);
  const scope = label('', 'dg-small dg-muted', { 'data-chain-scope': '' }, chain);
  // The fixture's own tables never change: publish them once, not every frame.
  Object.assign(root.dataset, { curve: JSON.stringify(own.curve), bounds: JSON.stringify(own.bounds),
    ceiling: String(own.ceiling) });
  const [low, high] = fixture.domain;
  let width = 0, geometry = null, lastTime = 0, reduced = false;
  // Everything that depends on the pane width alone: scenery, wires, the inset curves, the
  // chain's reflow. Runs at mount and when the width changes, never per frame.
  function layout() {
    const measured = Math.max(240, Math.round(figure.getBoundingClientRect().width || 713));
    if (measured === width) return false;
    width = measured;
    const narrow = width < 560, cx = width / 2, lx = 45, rx = width - 45, fy = 182, by = 252;
    const chainY = 392, rowGap = 74, margin = 54, end = 18;
    const columns = narrow ? (width < 280 ? 4 : 5) : fixture.maxGates;
    const lastRow = Math.floor((fixture.maxGates - 1) / columns);
    const height = chainY + lastRow * rowGap + 84;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    attrs(heading, { x: cx, y: 19 });
    const scales = insets.map((inset, i) => {
      const left = cx + (i === 0 ? -108 : 14), top = 48, iw = 94, ih = 42, maximum = i === 0 ? 1 : high;
      const px = z => left + (z - low) / (high - low) * iw, py = value => top + ih - value / maximum * ih;
      attrs(inset.group, { 'data-left': left, 'data-top': top, 'data-width': iw, 'data-height': ih, 'data-y-max': maximum });
      attrs(inset.title, { x: left + iw / 2, y: 38 });
      attrs(inset.axes, { d: path([[left, top], [left, top + ih], [left + iw, top + ih]]) });
      const samples = i === 0 ? own.curve.map(point => [point.z, point.sigmoid]) : [[low, 0], [0, 0], [high, high]];
      attrs(inset.curve, { d: path(samples.map(point => [px(point[0]), py(point[1])])) });
      attrs(inset.zero, { x: left - 7, y: top + ih + 4 });
      attrs(inset.top, { x: left - 7, y: top + 4 }); write(inset.top, number(maximum));
      attrs(inset.end, { x: left + iw, y: top + ih + 13 }); write(inset.end, number(high));
      return { px, py };
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
    attrs(actName, { x: cx, y: fy + 4 });
    attrs(zLabel, { x: lx, y: 152 }); attrs(aLabel, { x: rx, y: 152 });
    attrs(zNote, { x: lx, y: 217 }); attrs(aNote, { x: rx, y: 217 });
    attrs(cacheLink, { d: path([[cx, fy + 27], [cx, by - 17]]) });
    attrs(reverseWire, { d: path([[rx, by], [lx, by]]) });
    // Arrowheads sit clear of the locator ring's two resting places, so a subpixel packet is
    // never mistaken for the arrowhead inside its ring.
    reverseArrows.forEach((arrow, i) => {
      const x = i ? cx + 56 : lx + 26;
      attrs(arrow, { d: path([[x + 5, by - 4], [x, by], [x + 5, by + 4]]) });
    });
    attrs(gateNode, { x: cx - 52, y: by - 17 });
    attrs(gateLabel, { x: cx, y: by + 5 });
    attrs(upstream, { x: rx, y: by + 35 }); attrs(downstream, { x: lx, y: by + 35 });
    attrs(backTitle, { x: cx, y: by + 36 });
    attrs(legend, { x: cx, y: 313 });
    const positions = chainNodes.map((_, i) => {
      const row = Math.floor(i / columns), column = i % columns;
      const cell = row % 2 === 0 ? columns - 1 - column : column;
      return [margin + (width - 2 * margin) * cell / (columns - 1), chainY + row * rowGap];
    });
    const points = [[width - end, chainY], ...positions,
      [lastRow % 2 === 0 ? end : width - end, positions[positions.length - 1][1]]];
    attrs(chainTitle, { x: cx, y: 342 }); attrs(chainNote, { x: cx, y: 360 });
    attrs(chainWire, { d: path(points) });
    chainNodes.forEach((gate, i) => {
      const [x, y] = positions[i];
      attrs(gate.node, { cx: x, cy: y }); attrs(gate.name, { x, y: y + 4 });
      const next = points[i + 2], dx = next[0] - x, dy = next[1] - y, norm = Math.hypot(dx, dy);
      // Where the path drops to the next row its wire runs under the gate: number that gate
      // on its outer side instead, so no line crosses the label.
      attrs(gate.index, Math.abs(dx) < 1e-9 ? { x: x + (x < cx ? -28 : 28), y: y + 4 } : { x, y: y + 32 });
      const ax = x + dx * 0.55, ay = y + dy * 0.55, ux = dx / norm, uy = dy / norm;
      attrs(gate.arrow, { d: path([[ax - 4 * ux - 3 * uy, ay - 4 * uy + 3 * ux],
        [ax, ay], [ax - 4 * ux + 3 * uy, ay - 4 * uy - 3 * ux]]) });
    });
    attrs(boundLabel, { x: cx, y: height - 26 }); attrs(scope, { x: cx, y: height - 8 });
    geometry = { lx, rx, by, points, scales };
    Object.assign(root.dataset, { layout: narrow ? 'narrow' : 'wide', chainPoints: JSON.stringify(points) });
    return true;
  }
  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    if (!geometry) layout();
    const state = buildState(time, reducedMotion), { stage } = state, { lx, rx, by, points, scales } = geometry;
    // Full-precision scalars for the tests and for anyone inspecting the page; a few short strings.
    for (const key of ['stage', 'held', 'z', 'sigmoid', 'sigmoidGate', 'reluGate', 'kind', 'activation', 'factor',
      'localProgress', 'localPassed', 'probeOpacity', 'revealed', 'delivered', 'signalValue', 'gateCount', 'bound', 'travel',
      'backwardVisible', 'chainVisible', 'boundaryVisible']) {
      const text = String(state[key]); if (root.dataset[key] !== text) root.dataset[key] = text;
    }
    // Numbers are announced here and on the picture only; the scrubber names the stage.
    const described = `${names[stage]}. At z ${number(state.z)}, ${state.kind} activation ${number(state.activation)}.`
      + (!state.backwardVisible ? '' : state.revealed
        ? ` A unit backward probe is multiplied by ${number(state.factor)}. The forward value stays cached.`
        : ' The backward factor is withheld until a unit probe crosses the component.')
      + (state.chainVisible ? ` Best-case sigmoid factors only: ${state.gateCount} gates, ceiling ${number(state.bound)}. Not the complete network gradient.` : '');
    if (svg.getAttribute('aria-label') !== described) svg.setAttribute('aria-label', described);
    insets.forEach((inset, i) => {
      const { px, py } = scales[i];
      const activation = i === 0 ? state.sigmoid : Math.max(0, state.z);
      const slope = i === 0 ? state.sigmoidGate : state.reluGate;
      attrs(inset.group, { 'data-active': String((state.kind === 'sigmoid') === (i === 0)) });
      attrs(inset.dot, { cx: px(state.z), cy: py(activation) });
      const span = (high - low) * 0.11, za = Math.max(low, state.z - span), zb = Math.min(high, state.z + span);
      attrs(inset.tangent, { x1: px(za), y1: py(activation + slope * (za - state.z)),
        x2: px(zb), y2: py(activation + slope * (zb - state.z)) });
      show(inset.tangent, i === 0 || state.z !== 0);
    });
    write(actName, state.kind === 'sigmoid' ? 'sigmoid' : 'ReLU');
    write(zLabel, `z = ${number(state.z)}`); write(aLabel, `a = ${number(state.activation)}`);
    show(cacheLink, state.backwardVisible); show(backward, state.backwardVisible); show(legend, state.backwardVisible);
    write(gateLabel, `× ${state.revealed ? number(state.factor) : '?'}`);
    write(downstream, state.delivered ? number(state.factor) : '?');
    // Filled area, not radius, encodes sensitivity. The hollow locator has no magnitude meaning.
    const pulseX = rx + (lx - rx) * state.localProgress, opacity = pixel(state.probeOpacity);
    attrs(probe, { opacity }); show(probe, opacity > 0);
    attrs(localRing, { cx: pulseX, cy: by });
    attrs(localPulse, { cx: pulseX, cy: by, r: 14 * Math.sqrt(state.signalValue) });
    show(chain, state.chainVisible);
    chainNodes.forEach((gate, i) => attrs(gate.node, { 'data-passed': String(i < state.gateCount) }));
    const segment = Math.min(points.length - 2, Math.floor(state.travel)), fraction = state.travel - segment;
    const moving = points[segment].map((value, axis) => value + (points[segment + 1][axis] - value) * fraction);
    attrs(chainRing, { cx: moving[0], cy: moving[1] });
    attrs(chainPulse, { cx: moving[0], cy: moving[1], r: 14 * Math.sqrt(state.bound) });
    write(boundLabel, `${state.gateCount} factors: at most ${number(state.bound)}`);
    write(scope, state.boundaryVisible ? 'Tiny is not zero. This is not the full gradient.' : 'Fill too small to see? Read the number.');
    formula.classList.toggle('dg-local-shown', state.backwardVisible);
    formula.classList.toggle('dg-bound-shown', state.chainVisible);
    formula.classList.toggle('dg-highlight-sigmoid', state.kind === 'sigmoid');
    formula.classList.toggle('dg-highlight-relu', state.kind === 'relu');
    write(caption, captions[stage]);
    return `${names[stage]}.`;
  }
  function typeset() {
    const done = () => { root.dataset.typeset = root.querySelector('mjx-container') ? 'mathjax' : 'none'; };
    const mathjax = window.MathJax;
    if (mathjax && typeof mathjax.typesetPromise === 'function' && !root.querySelector('mjx-container'))
      mathjax.typesetPromise([root]).then(done, done);
    else done();
  }
  layout(); window.BookPlayback(root, render, () => { if (layout()) render(lastTime, reduced); }); typeset();
})();
