(() => {
  const root = document.getElementById('derivative-gates-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  const fixture = JSON.parse(root.dataset.fixture);
  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const slider = $('[data-z-slider]'), readout = $('[data-z-readout]'), sliderRow = $('[data-z-control]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration);
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const ease = value => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };
  const stageAt = time => beats.reduce((stage, beat, index) => time >= beat ? index : stage, 0);
  // Timeline, in content seconds. A beat stands still for HOLD before anything moves: reading
  // and predicting time. A probe then takes TRAVEL to cross the component and meets the
  // multiplier halfway, so the factor it reveals holds two seconds before the next caption.
  const HOLD = 2, TRAVEL = 2, FADE = 0.6, SETTLE = 0.5;
  const glide = [beats[2] + HOLD, beats[3]]; // z leaves zero, and is at the domain edge on the beat
  const chainSpan = [beats[6] + SETTLE, beats[7]]; // ten gates, the last step landing on the beat
  // The component picture compresses into its strip over the 1.5 s that lead into the depth
  // beat, and is finished on it. The ReLU beat asks for no prediction, so its probe leaves
  // after one second and rests, delivered, before the stage starts to move.
  const actSpan = [beats[6] - 1.5, beats[6]], holdOf = stage => stage === 5 ? 1 : HOLD;
  // Reduced motion shows one still per beat: the beat's own first frame, except where that
  // frame is only a probe waiting to move. The ReLU beat rests on its delivered probe and the
  // depth beat on its halfway point, so each still shows what its caption says.
  const rest = beats.slice();
  rest[5] = beats[5] + holdOf(5) + TRAVEL; rest[6] = (chainSpan[0] + chainSpan[1]) / 2;
  const probeAt = (held, stage) => ease((held - beats[stage] - holdOf(stage)) / TRAVEL);
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
  // What depends on the fixture alone: the sampled curve, the quarter-power ceilings, and
  // where each ceiling sits on a log ruler. log10(.25^k) = k log10(.25): equal steps.
  function tables(source) {
    validate(source);
    const [low, high] = source.domain, ceiling = gates(0).sigmoidGate, step = Math.log10(ceiling);
    return Object.freeze({ ceiling, step,
      curve: Object.freeze(Array.from({ length: source.samples }, (_, i) => {
        const z = low + (high - low) * i / (source.samples - 1);
        return Object.freeze({ z, ...gates(z) });
      })),
      bounds: Object.freeze(Array.from({ length: source.maxGates + 1 },
        (_, k) => Object.freeze({ k, value: ceiling ** k, exponent: k ? k * step : 0 }))) });
  }
  const own = tables(fixture); // built once; an alternate source is an API path, never a frame
  // `requested` is the reader's own z from the one parameter control, or null on the timeline.
  function buildState(time, reducedMotion = false, source = fixture, requested = null) {
    const fixed = source === fixture ? own : tables(source);
    const [low, high] = source.domain;
    const bounded = clamp(Number.isFinite(time) ? time : 0, 0, duration);
    const stage = stageAt(bounded), held = reducedMotion ? rest[stage] : bounded;
    const dragged = requested !== null && Number.isFinite(Number(requested));
    const z = dragged ? clamp(Number(requested), low, high) || 0
      : high * ease((held - glide[0]) / (glide[1] - glide[0]));
    const values = gates(z);
    const kind = stage === 5 ? 'relu' : 'sigmoid';
    const factor = kind === 'sigmoid' ? values.sigmoidGate : values.reluGate;
    const activation = kind === 'sigmoid' ? values.sigmoid : Math.max(0, z);
    // The probe: 0 is the output side, 1 the input side. Once z leaves zero the quarter it
    // delivered is stale: that packet fades where it lies, at its measured size, and a fresh
    // unit probe fades in at the output side, ready on the next beat. Nothing is measured
    // while z moves, so nothing about the new factor can be read before a probe crosses.
    // A dragged z is the reader's own experiment: the delivered packet follows it live.
    let localProgress = stage === 0 && !dragged ? 0 : 1, probeOpacity = 1;
    const stale = !dragged && stage === 2 && held > glide[0];
    if (!dragged && (stage === 1 || stage === 3 || stage === 5)) localProgress = probeAt(held, stage);
    else if (stale) {
      const leaving = 1 - clamp((held - glide[0]) / FADE, 0, 1);
      localProgress = leaving > 0 ? 1 : 0;
      probeOpacity = leaving > 0 ? leaving : clamp((held - (glide[1] - FADE)) / FADE, 0, 1);
    }
    // The factor is printed when a probe meets the multiplier at the current input; the
    // delivered value is printed beside the packet once it arrives at the input side. The ReLU
    // beat asks for no prediction: its caption names the slope, so the multiplier may too.
    const localPassed = localProgress >= 0.5;
    const revealed = dragged || (stage === 5) || (stage >= 1 && localPassed && !stale);
    // Depth. `gateProgress` runs 0..maxGates; gate k is met at k - 1/2, and the ruler's marker
    // takes its k-th eased step over [k - 1, k]. `travel` counts path segments for the packet.
    const gateProgress = source.maxGates * clamp((held - chainSpan[0]) / (chainSpan[1] - chainSpan[0]), 0, 1);
    const last = source.maxGates - 0.5;
    const travel = gateProgress <= 0.5 ? 2 * gateProgress
      : gateProgress >= last ? source.maxGates + 2 * (gateProgress - last) : gateProgress + 0.5;
    const gateCount = Math.min(source.maxGates, Math.floor(travel));
    const hops = Math.floor(gateProgress), hopFraction = ease(gateProgress - hops);
    const marker = hops + hopFraction;
    return { stage, time: bounded, held, dragged, z, ...values, kind, factor, activation, localProgress,
      localPassed, probeOpacity, revealed, delivered: revealed && localProgress >= 1,
      // A stale packet keeps the area it was measured at: sigmoid'(0), the quarter ceiling.
      signalValue: !localPassed ? 1 : stale ? fixed.ceiling : factor,
      kink: kind === 'relu' && z === 0,
      curve: fixed.curve, ceiling: fixed.ceiling, travel, gateCount, gateProgress, hops, hopFraction, marker,
      rulerExponent: marker ? marker * fixed.step : 0,
      // 0 while the component picture has the whole stage, 1 once it is the strip over the chain.
      actMix: ease((held - actSpan[0]) / (actSpan[1] - actSpan[0])),
      bound: fixed.bounds[gateCount].value, bounds: fixed.bounds, maxGates: source.maxGates,
      domain: source.domain.slice(),
      // The quarter ceiling is the first prediction's answer: its formula waits for that reveal.
      ceilingVisible: dragged || stage >= 2 || (stage === 1 && localPassed),
      backwardVisible: dragged || stage >= 1, chainVisible: stage >= 6, boundaryVisible: stage >= 7 };
  }
  window.BookDerivativeGates = Object.freeze({ buildState });
  const names = ['Forward value', 'Send a unit backward probe', 'The slope is the multiplier',
    'A large forward activation', 'A tiny backward sensitivity', 'Substitute active ReLU',
    'Equal steps on a log ruler', 'A ceiling, not a whole-network gradient'];
  const captions = [
    'Forward: z = 0 gives a = 0.5. Would a larger output pass more gradient back?',
    'Backward, a unit sensitivity is multiplied by the tangent’s slope at the cached point. Predict that slope.',
    'At its steepest the sigmoid passes one quarter. Now z rises: watch the tangent as the output grows.',
    'The output is now almost one, and the tangent is almost flat. Predict the backward multiplier.',
    'Loud forward, quiet backward: the flat tangent is the multiplier. Drag z to −6: quiet both ways.',
    'Swap in ReLU at the same z. Active, its slope is one: the probe passes whole. Inactive ReLU blocks it.',
    'Deeper paths multiply gate after gate. Even at best, ×¼ each: ten equal steps down a log ruler.',
    'Ten best-case sigmoid gates: below one millionth, yet not zero. Weights and branching, omitted here, also scale the full gradient.'
  ];
  // While the reader holds z, one sentence that is true at every z; the picture carries the numbers.
  const dragCaptions = {
    sigmoid: 'You set z. The backward multiplier is the tangent’s slope: widest at zero, dying toward both ends.',
    relu: 'You set z. Active ReLU passes the probe whole; inactive ReLU blocks it. Its kink has no tangent.'
  };
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
  // The forward output is scenery for the argument: four decimals, as the chapter's 0.9975.
  const output = value => number(Number(value.toFixed(4)));
  const [low, high] = fixture.domain;
  const heading = label('Active forward, quiet backward', 'dg-heading', { 'data-picture-title': '' });
  const forwardTitle = label('FORWARD →', 'dg-output dg-small', { 'data-forward-title': '' });
  const forward = make('g', { 'data-forward-network': '' });
  const forwardLeft = make('path', { class: 'dg-forward-wire', 'data-forward-left': '' }, '', forward);
  const forwardRight = make('path', { class: 'dg-forward-wire', 'data-forward-right': '' }, '', forward);
  const forwardArrows = [0, 1].map(i => make('path', { class: 'dg-forward-arrow', 'data-forward-arrow': i }, '', forward));
  const inputNode = make('circle', { class: 'dg-input-node', 'data-input-node': '' }, '', forward);
  const actNode = make('rect', { rx: 12, class: 'dg-component', 'data-activation-node': '' }, '', forward);
  const outputNode = make('circle', { class: 'dg-output-node', 'data-output-node': '' }, '', forward);
  const inputName = label('z', 'dg-input', {}, forward);
  const outputName = label('a', 'dg-output', {}, forward);
  const zLabel = label('', 'dg-input', { 'data-z-value': '' }, forward);
  const aLabel = label('', 'dg-output', { 'data-activation-value': '' }, forward);
  const zNote = label('from sum', 'dg-small dg-muted', {}, forward);
  const aNote = label('to next layer', 'dg-small dg-muted', {}, forward);
  // The slope link: the backward pass reads the cached operating point, and the multiplier
  // it builds is the tangent drawn there. Under the face, so the point sits on top of it.
  const slopeLink = make('line', { class: 'dg-slope-link', 'data-slope-link': '' });
  // The component's face is its own activation curve: two rails (the output's floor and its
  // own ceiling, labelled), a zero tick, the curve, the operating point and its tangent. No
  // grid and no axes: it is a component with a face, not a plot.
  const face = make('g', { 'data-face': '', 'data-quantity': 'activation-function' });
  const rails = [0, 1].map(i => make('path', { class: 'dg-rail', 'data-rail': i ? 'top' : 'floor' }, '', face));
  const zeroTick = make('path', { class: 'dg-face-tick', 'data-zero-tick': '' }, '', face);
  const curves = { sigmoid: make('path', { class: 'dg-activation-curve', 'data-activation-curve': 'sigmoid' }, '', face),
    relu: make('path', { class: 'dg-activation-curve', 'data-activation-curve': 'relu' }, '', face) };
  const actName = label('', '', { 'data-activation-name': '', 'text-anchor': 'start' }, face);
  const floorLabel = label('0', 'dg-small dg-muted', { 'data-rail-label': 'floor', 'text-anchor': 'start' }, face);
  const topLabel = label('', 'dg-small dg-muted', { 'data-rail-label': 'top', 'text-anchor': 'end' }, face);
  const tangent = make('line', { class: 'dg-tangent', 'data-tangent': '' }, '', face);
  const dot = make('circle', { r: 4, class: 'dg-output-dot', 'data-activation-marker': '' }, '', face);
  const backward = make('g', { 'data-backward-network': '', 'data-quantity': 'local-backward-sensitivity' });
  const reverseWire = make('path', { class: 'dg-reverse-wire', 'data-reverse-wire': '' }, '', backward);
  const reverseArrows = [0, 1].map(i => make('path', { class: 'dg-reverse-arrow', 'data-reverse-arrow': i }, '', backward));
  // The probe is drawn under the multiplier: it goes in at one size and comes out at another,
  // and its ring never crosses the factor printed on the box.
  const probe = make('g', { 'data-local-probe': '' }, '', backward);
  const localRing = make('circle', { r: 16, class: 'dg-locator', 'data-local-locator': '' }, '', probe);
  const localPulse = make('circle', { class: 'dg-sensitivity', 'data-local-pulse': '' }, '', probe);
  const gateNode = make('rect', { height: 34, rx: 7, class: 'dg-multiplier', 'data-local-multiplier': '' }, '', backward);
  const gateLabel = label('', 'dg-error', { 'data-factor-value': '' }, backward);
  const upstream = label('', 'dg-error', { 'data-upstream-value': '' }, backward);
  const downstream = label('', 'dg-error', { 'data-downstream-value': '' }, backward);
  const backTitle = label('← BACKWARD', 'dg-error dg-small', { 'data-backward-title': '' }, backward);
  const legend = label('', 'dg-small dg-muted', { 'data-signal-legend': '' });
  const legendMore = label('ring = location', 'dg-small dg-muted', { 'data-signal-legend-more': '' });
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
  // The log ruler: multiplying by a constant is an equal step on it, which is the mechanism
  // of depth. Its marker hops once per gate and leaves each hop behind as an arc, so ten equal
  // steps stay countable on a still frame. The ticks are whole powers of ten inside the chain's
  // own reach; the last one a best-case chain of this length passes is the ruler's far end.
  const ruler = make('g', { 'data-log-ruler': '', 'data-scale': 'log10' }, '', chain);
  const rulerLine = make('path', { class: 'dg-ruler', 'data-ruler-line': '' }, '', ruler);
  const reach = own.bounds[fixture.maxGates].exponent;
  const spacing = Math.max(1, Math.ceil(-reach / 4)), tickExponents = [];
  for (let exponent = 0; exponent >= reach; exponent -= spacing) tickExponents.push(exponent);
  const ticks = tickExponents.map(exponent => ({ exponent,
    mark: make('path', { class: 'dg-ruler-tick', 'data-ruler-tick': exponent }, '', ruler),
    text: label(exponent ? power(exponent) : '1', 'dg-small', { 'data-ruler-label': exponent }, ruler) }));
  const rulerTitle = label('sensitivity remaining · log scale', 'dg-small dg-muted', { 'data-ruler-title': '' }, ruler);
  const hopArcs = Array.from({ length: fixture.maxGates }, (_, i) =>
    make('path', { class: 'dg-hop', 'data-hop': i + 1 }, '', ruler));
  const reluMarker = make('path', { class: 'dg-relu-marker', 'data-relu-marker': '', 'data-exponent': 0 }, '', ruler);
  const marker = make('circle', { r: 4.5, class: 'dg-marker', 'data-ruler-marker': '' }, '', ruler);
  const reluLabel = label('◆ active ReLU path: stays at 1', 'dg-error dg-small', { 'data-relu-label': '' }, ruler);
  const boundLabel = label('', 'dg-error', { 'data-bound-value': '', 'data-value': 'bound' }, chain);
  const scope = label('', 'dg-small dg-muted', { 'data-chain-scope': '' }, chain);
  // The fixture's own tables never change: publish them once, not every frame.
  Object.assign(root.dataset, { curve: JSON.stringify(own.curve), bounds: JSON.stringify(own.bounds),
    ceiling: String(own.ceiling) });
  let width = 0, stageFrame = null, geometry = null, placedMix = null, lastTime = 0, reduced = false, override = null;
  const lerp = (from, to, mix) => from + (to - from) * mix;
  // TWO ACTS ON ONE STAGE. The viewBox never changes height. In act 1 the component picture
  // (forward lane, face, backward lane, the z control's band) is spaced over the whole stage.
  // Leading into the depth beat it compresses, at native type size, into a compact strip at
  // the top, and the chain and ruler take the freed area. layout() owns what depends on the
  // width alone: the stage height, both acts' measures, and the chain and ruler, which are
  // only ever drawn in act 2. place(mix) owns the component picture at one act mix.
  function layout() {
    const measured = Math.max(240, Math.round(figure.getBoundingClientRect().width || 713));
    if (measured === width) return false;
    width = measured;
    const narrow = width < 560, tight = width < 288, cx = width / 2;
    // Wide panes print each value over its node; narrow ones have no room beside the component,
    // so the two values take the top corners and the nodes move out to the edges.
    const lx = narrow ? 26 : 45, rx = width - lx, nodeR = tight ? 17 : 19;
    const half = Math.min(narrow ? 88 : 120, cx - lx - nodeR - 8), pad = narrow ? 24 : 38;
    const mHalf = Math.min(narrow ? 70 : 92, cx - lx - 22), legendRows = tight ? 16 : 0;
    // One column of measures per act: heading and title baselines, the box's top, the band
    // over the top rail, the face's height, the foot under its floor, the gap down to the
    // multiplier, the steps down to the lane labels, the legend and the control, the needle.
    // The band and foot give a tilted ReLU needle room at the top of its line and beside its kink.
    const compact = { head: 19, row: 36, boxY: 42, band: 18, plot: narrow ? 48 : 56, foot: 16, laneGap: 10,
      labelDy: 33, legendDy: 17, sliderGap: 8, needle: narrow ? 16 : 20 };
    const full = { head: 19, row: 39, boxY: 48, band: narrow ? 24 : 28, plot: narrow ? 116 : 104, foot: narrow ? 24 : 28, laneGap: 22,
      labelDy: 35, legendDy: 20, sliderGap: 12, needle: narrow ? 18 : 28 };
    const bottomOf = q => q.boxY + q.band + q.plot + q.foot + q.laneGap + 34 + (q.labelDy - 17) + q.legendDy + legendRows + q.sliderGap + 50;
    // Act 2: the strip, then the chain (wrapping on narrow panes), then the ruler and its lines.
    const chainTop = bottomOf(compact) + 18, chainY = chainTop + 44, rowGap = 66, margin = 54, end = 18;
    const columns = narrow ? (width < 280 ? 4 : 5) : fixture.maxGates;
    const lastRow = Math.floor((fixture.maxGates - 1) / columns);
    const ruleY = chainY + lastRow * rowGap + (narrow ? 56 : 62), height = ruleY + (narrow ? 96 : 78);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    // Act 1 takes the stage that act 2 needs: what the component picture does not need at its
    // natural spacing is shared out, a little to the face, most to the gaps around the lane.
    // Every share is capped, so a very tall stage (a three-row chain on a tiny pane) still keeps
    // the control near its lane; what is left over becomes equal margins above and below.
    const extra = Math.max(0, height - 10 - bottomOf(full));
    const grow = Math.round(Math.min(0.2 * extra, narrow ? 28 : 16)), spare = extra - grow;
    const shares = { laneGap: Math.round(Math.min(0.3 * spare, 40)), labelDy: Math.round(Math.min(0.1 * spare, 12)),
      legendDy: Math.round(Math.min(0.1 * spare, 12)), sliderGap: Math.round(Math.min(0.25 * spare, 30)) };
    for (const [key, share] of Object.entries(shares)) full[key] += share;
    const lift = Math.round((spare - Object.values(shares).reduce((sum, share) => sum + share, 0)) / 2);
    full.head += Math.round(Math.min(lift, 24) / 3); full.row += lift; full.boxY += lift; full.plot += grow;
    stageFrame = { narrow, tight, cx, lx, rx, nodeR, half, pad, mHalf, legendRows, full, compact, height };
    // The ruler runs the pane's width; on a wide pane the chain's entry and exit stand over
    // its two ends, so the packet above and the marker below travel together.
    const r0 = width - 30, r10 = 28, stepX = (r0 - r10) / fixture.maxGates;
    const positions = chainNodes.map((_, i) => {
      const row = Math.floor(i / columns), column = i % columns;
      const cell = row % 2 === 0 ? columns - 1 - column : column;
      return narrow ? [margin + (width - 2 * margin) * cell / (columns - 1), chainY + row * rowGap]
        : [r0 - 36 - (r0 - r10 - 72) * i / (columns - 1), chainY];
    });
    const points = [[narrow ? width - end : r0, chainY], ...positions,
      [narrow ? (lastRow % 2 === 0 ? end : width - end) : r10, positions[positions.length - 1][1]]];
    attrs(chainTitle, { x: cx, y: chainTop }); attrs(chainNote, { x: cx, y: chainTop + 17 });
    write(chainNote, tight ? 'Best case · weights omitted' : 'Best case at every gate · weights omitted');
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
    const rulerX = steps => r0 - steps * stepX, hopHeight = Math.min(18, stepX * 0.4);
    attrs(ruler, { 'data-origin': r0, 'data-step': stepX, 'data-y': ruleY, 'data-hop-height': hopHeight });
    attrs(rulerLine, { d: path([[r10 - 10, ruleY], [r0 + 10, ruleY]]) });
    for (const tick of ticks) {
      const x = rulerX(tick.exponent / own.step);
      attrs(tick.mark, { d: path([[x, ruleY], [x, ruleY + 6]]) }); attrs(tick.text, { x, y: ruleY + 18 });
    }
    attrs(rulerTitle, { x: cx, y: ruleY + 35 });
    write(scope, tight ? 'Tiny is not zero: not the full gradient.' : 'Tiny is not zero. This is not the full gradient.');
    // Each hop is one quadratic arc between neighbouring marker stops; its length is measured
    // here once so the player can draw it progressively by dash offset, never by a new path.
    const lengths = hopArcs.map((arc, i) => {
      const x0 = rulerX(i), x1 = rulerX(i + 1), top = ruleY - 2 * hopHeight;
      attrs(arc, { d: `M ${pixel(x0)} ${pixel(ruleY)} Q ${pixel((x0 + x1) / 2)} ${pixel(top)} ${pixel(x1)} ${pixel(ruleY)}` });
      let length = 0, previous = [x0, ruleY];
      for (let n = 1; n <= 32; n++) {
        const t = n / 32, point = [x0 + (x1 - x0) * t, ruleY - 4 * hopHeight * t * (1 - t)];
        length += Math.hypot(point[0] - previous[0], point[1] - previous[1]); previous = point;
      }
      attrs(arc, { 'stroke-dasharray': length });
      return pixel(length);
    });
    attrs(reluMarker, { d: `${path([[r0, ruleY - 7], [r0 + 7, ruleY], [r0, ruleY + 7], [r0 - 7, ruleY]])} Z` });
    if (narrow) {
      attrs(boundLabel, { x: cx, y: ruleY + 54, 'text-anchor': 'middle' });
      attrs(reluLabel, { x: cx, y: ruleY + 71, 'text-anchor': 'middle' }); attrs(scope, { x: cx, y: ruleY + 88 });
    } else {
      attrs(boundLabel, { x: 10, y: ruleY + 54, 'text-anchor': 'start' });
      attrs(reluLabel, { x: width - 10, y: ruleY + 54, 'text-anchor': 'end' }); attrs(scope, { x: cx, y: ruleY + 71 });
    }
    // Width-only parts of the component picture: what no act moves.
    write(legend, tight ? 'filled area = sensitivity' : 'filled area = sensitivity · ring = location');
    write(upstream, tight ? 'unit: 1' : 'unit probe: 1');
    geometry = { points, ruleY, rulerX, hopHeight, lengths, chainTop };
    placedMix = null;
    Object.assign(root.dataset, { layout: narrow ? 'narrow' : 'wide', chainPoints: JSON.stringify(points), stageHeight: String(height) });
    return true;
  }
  // The component picture at one act mix: 0 is act 1 (the whole stage), 1 the compact strip.
  // Every measure is interpolated and every label keeps its native size, so the strip stays
  // legible. It runs when the mix or the width changes: on the timeline only during the
  // second and a half that leads into the depth beat.
  function place(mix) {
    if (mix === placedMix) return;
    placedMix = mix;
    const { narrow, tight, cx, lx, rx, nodeR, half, pad, mHalf, legendRows, full, compact } = stageFrame;
    const q = {}; for (const key of Object.keys(full)) q[key] = lerp(full[key], compact[key], mix);
    const box = { x: cx - half, y: q.boxY, width: 2 * half, height: q.band + q.plot + q.foot };
    const plot = { left: box.x + pad, top: q.boxY + q.band, width: 2 * (half - pad), height: q.plot };
    const fy = box.y + box.height / 2, by = box.y + box.height + q.laneGap + 17;
    const labelsY = by + q.labelDy, legendY = labelsY + q.legendDy, sliderTop = legendY + legendRows + q.sliderGap;
    attrs(heading, { x: cx, y: q.head });
    attrs(forwardTitle, { x: cx, y: q.row });
    attrs(forwardLeft, { d: path([[lx + nodeR, fy], [box.x, fy]]) });
    attrs(forwardRight, { d: path([[box.x + box.width, fy], [rx - nodeR, fy]]) });
    forwardArrows.forEach((arrow, i) => {
      const x = i ? rx - nodeR - 3 : box.x - 3;
      attrs(arrow, { d: path([[x - 5, fy - 4], [x, fy], [x - 5, fy + 4]]) });
    });
    attrs(inputNode, { cx: lx, cy: fy, r: nodeR }); attrs(actNode, box); attrs(outputNode, { cx: rx, cy: fy, r: nodeR });
    attrs(inputName, { x: lx, y: fy + 4 }); attrs(outputName, { x: rx, y: fy + 4 });
    if (narrow) {
      attrs(zLabel, { x: 4, y: q.row, 'text-anchor': 'start' }); attrs(aLabel, { x: width - 4, y: q.row, 'text-anchor': 'end' });
    } else {
      attrs(zLabel, { x: lx, y: fy - 30, 'text-anchor': 'middle' }); attrs(aLabel, { x: rx, y: fy - 30, 'text-anchor': 'middle' });
    }
    attrs(zNote, { x: lx, y: fy + 35 }); attrs(aNote, { x: rx, y: fy + 35 });
    for (const node of [zNote, aNote]) show(node, !narrow);
    // The face. Horizontal: the fixture's z domain. Vertical: each activation's own scale,
    // sigmoid 0..1 and ReLU 0..high, stated by the top rail's label.
    const px = z => plot.left + (z - low) / (high - low) * plot.width;
    const py = { sigmoid: value => plot.top + plot.height * (1 - value),
      relu: value => plot.top + plot.height * (1 - value / high) };
    attrs(face, { 'data-left': plot.left, 'data-top': plot.top, 'data-width': plot.width, 'data-height': plot.height, 'data-needle': q.needle });
    const floorY = plot.top + plot.height;
    attrs(rails[0], { d: path([[plot.left, floorY], [plot.left + plot.width, floorY]]) });
    attrs(rails[1], { d: path([[plot.left, plot.top], [plot.left + plot.width, plot.top]]) });
    attrs(zeroTick, { d: path([[px(0), floorY], [px(0), floorY + 5]]) });
    attrs(curves.sigmoid, { d: path(own.curve.map(point => [px(point.z), py.sigmoid(point.sigmoid)])) });
    // ReLU keeps an explicit vertex at zero: a kink, not a rounded corner.
    attrs(curves.relu, { d: path([[low, 0], [0, 0], [high, high]].map(point => [px(point[0]), py.relu(point[1])])) });
    // The name sits in the band above the top rail, left of anything the needle can reach; the two
    // rail values sit at the ends no increasing curve visits: top-left and bottom-right.
    attrs(actName, { x: plot.left, y: box.y + q.band - 5 });
    attrs(topLabel, { x: plot.left - 6, y: plot.top + 4 }); attrs(floorLabel, { x: plot.left + plot.width + 9, y: floorY + 4 });
    attrs(reverseWire, { d: path([[rx, by], [lx, by]]) });
    // Arrowheads sit in the clear stretch between a resting ring and the multiplier, so a
    // subpixel packet is never mistaken for the arrowhead inside its ring.
    reverseArrows.forEach((arrow, i) => {
      const clear = i ? [cx + mHalf, rx - 16] : [lx + 16, cx - mHalf], x = (clear[0] + clear[1]) / 2 - 2.5;
      attrs(arrow, { d: path([[x + 5, by - 4], [x, by], [x + 5, by + 4]]) });
      show(arrow, clear[1] - clear[0] >= 12);
    });
    attrs(gateNode, { x: cx - mHalf, y: by - 17, width: 2 * mHalf });
    attrs(gateLabel, { x: cx, y: by + 5 });
    attrs(upstream, { x: Math.min(rx, width - 42), y: labelsY }); attrs(downstream, { x: Math.max(lx, 40), y: labelsY });
    attrs(backTitle, { x: cx, y: labelsY });
    // A tight pane cannot hold the legend on one line: it takes two, and the control moves down.
    attrs(legend, { x: cx, y: legendY }); attrs(legendMore, { x: cx, y: legendY + 16 });
    // The z slider is a real HTML range laid over a band the picture keeps clear for it, right
    // under the lane it drives: the hand that drags it never covers the tangent it tilts.
    const scale = (figure.getBoundingClientRect().width || width) / width;
    sliderRow.style.top = `${pixel(sliderTop * scale)}px`;
    root.dataset.sliderBand = `${pixel(sliderTop)} ${pixel(sliderTop + 50)}`;
    Object.assign(geometry, { lx, rx, by, px, py, needle: q.needle, plot, tight });
  }
  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    if (!geometry) layout();
    const state = buildState(time, reducedMotion, fixture, override), { stage, kind, dragged } = state;
    place(state.actMix);
    const { lx, rx, by, points, px, py, needle, plot, ruleY, rulerX, hopHeight, lengths } = geometry;
    // Full-precision scalars for the tests and for anyone inspecting the page; a few short strings.
    for (const key of ['stage', 'held', 'z', 'sigmoid', 'sigmoidGate', 'reluGate', 'kind', 'activation', 'factor',
      'localProgress', 'localPassed', 'probeOpacity', 'revealed', 'delivered', 'signalValue', 'kink', 'gateCount', 'bound',
      'travel', 'gateProgress', 'hops', 'marker', 'rulerExponent', 'actMix', 'backwardVisible', 'ceilingVisible', 'chainVisible', 'boundaryVisible']) {
      const text = String(state[key]); if (root.dataset[key] !== text) root.dataset[key] = text;
    }
    const holder = dragged ? 'slider' : ''; if (root.dataset.override !== holder) root.dataset.override = holder;
    // Timeline numbers are described here and on the picture; the scrubber names the stage. A
    // dragged z is live: the z slider alone announces it, so this description does not.
    const local = dragged
      ? ` The reader has set z: the ${kind === 'relu' ? 'ReLU' : 'sigmoid'} operating point, its tangent, the multiplier and the delivered packet follow the z slider, which announces their values.`
      : ` At z ${number(state.z)}, ${kind} activation ${output(state.activation)}.`
        + (!state.backwardVisible ? '' : state.revealed
          ? ` A unit backward probe is multiplied by the tangent’s slope, ${number(state.factor)}. The forward value stays cached.`
          : ' The backward factor is withheld until a unit probe crosses the component.');
    const described = `${names[stage]}.${local}`
      + (state.chainVisible ? ` Best-case sigmoid factors only: ${state.gateCount} gates, ceiling ${number(state.bound)}. On the log ruler that is ${state.gateCount} equal steps from 1; an active ReLU path stays at 1. Not the complete network gradient.` : '');
    if (svg.getAttribute('aria-label') !== described) svg.setAttribute('aria-label', described);
    // The face: the point rides the curve, and the tangent there tilts with the slope. The
    // needle has one pixel length at every z, so only its tilt changes.
    const sx = plot.width / (high - low), sy = plot.height / (kind === 'sigmoid' ? 1 : high);
    const x = px(state.z), y = py[kind](state.activation), run = Math.hypot(sx, state.factor * sy);
    const ux = sx / run * needle, uy = state.factor * sy / run * needle;
    attrs(face, { 'data-kind': kind, 'data-y-max': kind === 'sigmoid' ? 1 : high });
    show(curves.sigmoid, kind === 'sigmoid'); show(curves.relu, kind === 'relu');
    write(actName, kind === 'sigmoid' ? 'sigmoid' : 'ReLU'); write(topLabel, number(kind === 'sigmoid' ? 1 : high));
    attrs(dot, { cx: x, cy: y });
    attrs(tangent, { x1: x - ux, y1: y + uy, x2: x + ux, y2: y - uy });
    // ReLU has no tangent at its kink: PyTorch's zero there is a convention, not a slope.
    show(tangent, state.backwardVisible && !state.kink);
    attrs(slopeLink, { x1: x, y1: y, x2: x, y2: by - 17 }); show(slopeLink, state.backwardVisible);
    write(zLabel, `z = ${number(state.z)}`); write(aLabel, `a = ${output(state.activation)}`);
    show(backward, state.backwardVisible); show(legend, state.backwardVisible);
    show(legendMore, state.backwardVisible && geometry.tight);
    write(gateLabel, !state.revealed ? '× slope = ?' : state.kink ? '× 0 (kink rule)' : `× slope = ${number(state.factor)}`);
    write(downstream, state.delivered ? number(state.factor) : '?');
    // Filled area, not radius, encodes sensitivity. The hollow locator has no magnitude meaning.
    // A factor of exactly zero delivers nothing: no packet is drawn, only where it would be.
    const pulseX = rx + (lx - rx) * state.localProgress, opacity = pixel(state.probeOpacity);
    attrs(probe, { opacity }); show(probe, opacity > 0);
    attrs(localRing, { cx: pulseX, cy: by });
    attrs(localPulse, { cx: pulseX, cy: by, r: 14 * Math.sqrt(state.signalValue) }); show(localPulse, state.signalValue > 0);
    show(chain, state.chainVisible);
    chainNodes.forEach((gate, i) => attrs(gate.node, { 'data-passed': String(i < state.gateCount) }));
    const segment = Math.min(points.length - 2, Math.floor(state.travel)), fraction = state.travel - segment;
    const moving = points[segment].map((value, axis) => value + (points[segment + 1][axis] - value) * fraction);
    attrs(chainRing, { cx: moving[0], cy: moving[1] });
    attrs(chainPulse, { cx: moving[0], cy: moving[1], r: 14 * Math.sqrt(state.bound) });
    // The marker rides each hop's own arc; finished hops stay drawn, the current one grows.
    const lift = 4 * hopHeight * state.hopFraction * (1 - state.hopFraction);
    attrs(marker, { cx: rulerX(state.marker), cy: ruleY - lift });
    hopArcs.forEach((arc, i) => {
      // A marker resting on a whole step has started no new hop, whatever its last bits say.
      const done = i < state.hops, current = i === state.hops && state.hopFraction > 1e-9;
      // The offset is written before `hidden` is ever toggled, so attribute order never depends on history.
      attrs(arc, { 'stroke-dashoffset': done ? 0 : current ? lengths[i] * (1 - state.hopFraction) : lengths[i] });
      show(arc, done || current);
    });
    write(boundLabel, `${state.gateCount} factor${state.gateCount === 1 ? '' : 's'}: at most ${number(state.bound)}`);
    show(scope, state.boundaryVisible);
    formula.classList.toggle('dg-local-shown', state.backwardVisible);
    formula.classList.toggle('dg-ceiling-shown', state.ceilingVisible);
    formula.classList.toggle('dg-bound-shown', state.chainVisible);
    formula.classList.toggle('dg-highlight-sigmoid', kind === 'sigmoid');
    formula.classList.toggle('dg-highlight-relu', kind === 'relu');
    // The one parameter control follows the timeline unless the reader holds it. Pausing
    // during a drag repaints once from the timeline, so the held value is always written back.
    const zText = String(state.z); if (slider.value !== zText) slider.value = zText;
    write(readout, `z = ${number(state.z)}`);
    const face_ = kind === 'relu' ? 'ReLU' : 'Sigmoid';
    // What the value does is said only once it cannot answer a pending prediction.
    const effect = kind === 'relu' ? ' Active ReLU passes one; inactive ReLU passes zero.'
      : dragged || stage >= 4 ? ' The slope is largest at z = 0 and dies toward both ends.' : ' Dragging z moves the operating point.';
    const spoken = `z = ${number(state.z)}. ${face_} output ${output(state.activation)}`
      + (!state.backwardVisible ? '.' : !state.revealed ? '. The backward multiplier is withheld until the probe crosses.'
        : state.kink ? '; backward multiplier 0, PyTorch’s convention at the kink, not a slope.'
          : `; backward multiplier, the tangent’s slope, ${number(state.factor)}.`) + effect;
    if (slider.getAttribute('aria-valuetext') !== spoken) slider.setAttribute('aria-valuetext', spoken);
    write(caption, dragged ? dragCaptions[kind] : captions[stage]);
    return `${names[stage]}.`;
  }
  // --- The one parameter control: z over the fixture's declared domain -----------------
  // Dragging pauses playback through the transport's own button and recomputes every mark
  // from the dragged z. Its arrow keys move z by one step and never reach the pane's beat
  // seeking: the transport ignores keydown events whose target is not the pane.
  slider.min = String(low); slider.max = String(high);
  const decimals = (String(slider.step).split('.')[1] || '').length;
  function drag() {
    // Read the reader's value first: pausing below redraws once from the timeline, and that
    // draw writes the timeline's z back into the slider before it could be read.
    const wanted = Number(slider.value);
    if (!Number.isFinite(wanted)) return;
    if (root.dataset.playing === 'true') $('[data-action="play"]').click();
    override = clamp(Number(wanted.toFixed(decimals)), low, high) || 0;
    render(lastTime, reduced);
  }
  slider.addEventListener('input', drag);
  slider.addEventListener('change', drag);
  // Any timeline action resumes the timeline's own z. Play from a pause: this capture
  // listener runs before the transport's click handler and drops the detour first.
  pane.addEventListener('click', event => {
    if (event.target.closest('[data-action="play"]') && root.dataset.playing !== 'true') override = null;
  }, true);
  // The drag ends only when the transport really acts. This is the transport's own guard
  // (shared/playback.js): a key it ignores must leave the dragged z alone.
  pane.addEventListener('keydown', event => {
    if (event.target !== pane || event.altKey || event.ctrlKey || event.metaKey) return;
    const toggles = [' ', 'k', 'K'].includes(event.key);
    if (toggles && (event.repeat || root.dataset.playing === 'true')) return;
    if (toggles || ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) override = null;
  }, true);
  // A scrub, even one that lands on the same time, is the timeline speaking. Registered
  // before the transport mounts, so it runs before the transport's own seek and redraw.
  $('[data-controls] input[type="range"]').addEventListener('input', () => { override = null; });
  function typeset() {
    const done = () => { root.dataset.typeset = root.querySelector('mjx-container') ? 'mathjax' : 'none'; };
    const mathjax = window.MathJax;
    if (mathjax && typeof mathjax.typesetPromise === 'function' && !root.querySelector('mjx-container'))
      mathjax.typesetPromise([root]).then(done, done);
    else done();
  }
  layout(); window.BookPlayback(root, render, () => { if (layout()) render(lastTime, reduced); });
  // While the player runs the slider speaks z; its visible copy is not a second announcement.
  if (root.dataset.ready) { slider.disabled = false; $('[data-z-display]').setAttribute('aria-hidden', 'true'); }
  typeset();
})();
