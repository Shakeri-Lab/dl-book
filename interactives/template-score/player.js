(() => {
  const root = document.getElementById('template-score-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  // The panel is the one in-repo mirror of the fixture. Chapter 1 owns the identity
  // (01-linear-regression.qmd:113-145) but prints no coordinates for fig-linear-response,
  // so these are declared schematic geometry; every readout below is computed from them.
  const number = name => Number(root.dataset[name]);
  const list = name => root.dataset[name].trim().split(/\s+/).map(Number);
  const fixture = {weight: number('templateNorm'), direction: number('templateDegrees'),
    input: number('inputNorm'), bias: number('bias'), pulse: number('pulseNorm'),
    angles: list('angles'), range: list('normRange')};
  (({weight, direction, input, bias, pulse, angles, range}) => {
    const scalars = [weight, direction, input, bias, pulse];
    if (![...scalars, ...angles, ...range].every(Number.isFinite))
      throw Error('template-score: every declared quantity must be a finite number');
    if (weight <= 0 || input <= 0 || pulse <= 0)
      throw Error('template-score: the template and input lengths must be positive');
    if (angles.length !== 4) throw Error('template-score: four schedule angles are required');
    if (angles[2] !== 90)
      throw Error('template-score: the orthogonal beat must be exactly a right angle');
    if (!angles.every((angle, index) => index === 0 || angle > angles[index - 1]))
      throw Error('template-score: the declared angles must increase through the right angle');
    if (!(pulse < weight)) throw Error('template-score: the pulse must shorten the template');
    if (range.length !== 2 || !(range[0] > 0 && range[0] <= pulse && range[1] >= weight))
      throw Error('template-score: the slider range must contain both declared lengths');
  })(fixture);

  // Math.cos(Math.PI / 2) is 6.1e-17, not zero. The orthogonal payoff here is an
  // identity, not an approximation, so the quadrantal and third-turn angles are exact.
  const EXACT = new Map([[0, 1], [60, .5], [90, 0], [120, -.5], [180, -1], [240, -.5], [270, 0], [300, .5]]);
  const cosDeg = degrees => {
    const folded = ((degrees % 360) + 360) % 360;
    return EXACT.has(folded) ? EXACT.get(folded) : Math.cos(folded * Math.PI / 180);
  };
  const sinDeg = degrees => cosDeg(degrees - 90);

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const slider = $('[data-weight-slider]'), readout = $('[data-weight-readout]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration);
  const stageAt = time => beats.reduce((stage, beat, index) => time >= beat ? index : stage, 0);
  const clamp01 = value => Math.max(0, Math.min(1, value));
  const ease = value => (1 - Math.cos(Math.PI * clamp01(value))) / 2;
  // A glide finishes at the beat it leads into, exactly: ease(1) is 1, so the frame an
  // arrow-key seek parks on is the finished picture its caption describes.
  const glide = (time, from, to, a, b) => {
    const u = ease((time - from) / (to - from));
    return u === 0 ? a : u === 1 ? b : a + u * (b - a);
  };
  const [opening, predicting, orthogonalAngle, opposing] = fixture.angles;
  // Act one: the input turns at fixed length. It is frozen through the predict beat, so
  // no glide has started toward the answer while the caption asks for it.
  const angleAt = time =>
    time < beats[2] ? opening
      : time < beats[3] ? glide(time, beats[2], beats[3], opening, predicting)
        : time < beats[4] ? predicting
          : time < beats[5] ? glide(time, beats[4], beats[5], predicting, orthogonalAngle)
            : time < beats[6] ? orthogonalAngle
              : time < beats[7] ? glide(time, beats[6], beats[7], orthogonalAngle, opposing)
                : opposing;
  // Act two lives inside the last beat: shorten, hold two seconds, and grow back, so the
  // final frame carries the declared template length and both marks at once.
  const PULSE = {short: beats[7] + 1.5, back: beats[7] + 3.5};
  const weightAt = time =>
    time < beats[7] ? fixture.weight
      : time < PULSE.short ? glide(time, beats[7], PULSE.short, fixture.weight, fixture.pulse)
        : time < PULSE.back ? fixture.pulse
          : glide(time, PULSE.back, duration, fixture.pulse, fixture.weight);
  // Reduced motion draws one still per beat. A glide beat rests on its finished state;
  // the length beat rests on the short template, where both of its marks are drawn.
  const REST = [beats[0], beats[1], beats[3], beats[3], beats[5], beats[5], beats[7], PULSE.short];

  const names = ['Predict', 'The shadow', 'Turning', 'Hold at eighty degrees',
    'Released', 'Right angle', 'Opposing', 'Template length'];
  const captions = [
    'Does a big score mean the input matches the template, or only that something is long?',
    "The shadow of x on w's line is the score. The meter adds it to b.",
    'x turns at a fixed length. Only the direction changes, and the shadow shortens.',
    'About to cross the right angle. What score do you expect there?',
    "Released. The shadow slides back along w's line to the origin.",
    'Orthogonal: the shadow is a point, the score is zero, the prediction is exactly b.',
    'Past the right angle the shadow flips sides and the prediction drops below b.',
    "Now only the template's length changes. Direction similarity holds; the score still halves."
  ];
  const dragging = 'You are moving the template’s length. The direction, and cos θ, do not move.';
  const pictures = {
    hidden: 'An orange template arrow and a blue input arrow share one origin, with the angle between them marked. Predict what their weighted sum measures.',
    shown: "An orange template arrow and a blue input arrow share one origin. The signed shadow of the input on the template's line is the score, and a meter beside it reads the prediction against the dashed baseline."
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
  // Plain-text numbers use a true minus, never a hyphen. A score of exactly zero carries
  // no sign: it is the payoff reading, not a small positive or negative one.
  const plain = (value, digits = 2) => value.toFixed(digits).replace('-', '−');
  const signed = (value, digits = 2) => {
    const size = Math.abs(value).toFixed(digits);
    return Number(size) === 0 ? size : `${value < 0 ? '−' : '+'}${size}`;
  };
  const arrow = (from, to, size = 6) => {
    const dx = to[0] - from[0], dy = to[1] - from[1], length = Math.hypot(dx, dy);
    const shaft = `M ${px(from[0])} ${px(from[1])} L ${px(to[0])} ${px(to[1])}`;
    if (length < 1e-9) return shaft;
    const ux = dx / length, uy = dy / length, back = [to[0] - size * ux, to[1] - size * uy];
    return `${shaft} M ${px(back[0] - size * .6 * uy)} ${px(back[1] + size * .6 * ux)}`
      + ` L ${px(to[0])} ${px(to[1])} L ${px(back[0] + size * .6 * uy)} ${px(back[1] - size * .6 * ux)}`;
  };

  const marks = {
    line: make('line', {class: 'ts-line', 'data-template-line': ''}),
    shadow: make('line', {class: 'ts-shadow', 'data-shadow': ''}),
    drop: make('line', {class: 'ts-drop', 'data-drop': ''}),
    arc: make('path', {class: 'ts-arc', 'data-arc': '', fill: 'none'}),
    square: make('path', {class: 'ts-arc', 'data-right-angle': '', fill: 'none'}),
    template: make('path', {class: 'ts-template', 'data-template': '', fill: 'none'}),
    input: make('path', {class: 'ts-input', 'data-input': '', fill: 'none'}),
    foot: make('circle', {class: 'ts-foot', r: 4, 'data-foot': ''}),
    origin: make('circle', {class: 'ts-origin', r: 3, 'data-origin': ''}),
    templateName: label('ts-template-fill ts-symbol', 15, {'data-name': 'template'}, 'w'),
    templateValue: label('ts-template-fill ts-number', 12, {'data-value': 'weight'}),
    inputName: label('ts-input-fill ts-symbol', 15, {'data-name': 'input'}, 'x'),
    inputValue: label('ts-input-fill ts-number', 12, {'data-value': 'input'}),
    angleValue: label('ts-muted ts-number', 12, {'data-value': 'angle'}),
    cosValue: label('ts-muted ts-number', 12, {'data-value': 'cos'}),
    scoreName: label('ts-score-fill', 12, {'data-name': 'score'}, 'score'),
    scoreValue: label('ts-score-fill ts-number', 13, {'data-value': 'score'}),
    meterTitle: label('ts-muted', 12, {'data-name': 'meter', 'text-anchor': 'start'}, 'prediction'),
    meterAxis: make('line', {class: 'ts-axis', 'data-meter-axis': ''}),
    base: make('line', {class: 'ts-base', 'data-base': ''}),
    baseName: label('ts-template-fill ts-symbol', 14, {'data-name': 'bias', 'text-anchor': 'end'}, 'b'),
    baseValue: label('ts-template-fill ts-number', 12, {'data-value': 'bias', 'text-anchor': 'end'}),
    bar: make('line', {class: 'ts-bar', 'data-bar': ''}),
    dot: make('circle', {class: 'ts-dot', r: 6, 'data-prediction-dot': ''}),
    predictionName: label('ts-score-fill ts-symbol', 14, {'data-name': 'prediction', 'text-anchor': 'start'}, 'ŷ'),
    predictionValue: label('ts-score-fill ts-number', 13, {'data-value': 'prediction', 'text-anchor': 'start'})
  };
  const ticks = [-2, 0, 2, 4].map(value => ({value,
    line: make('line', {class: 'ts-tick', 'data-tick': value}),
    text: label('ts-muted ts-number', 12, {'data-tick-label': value, 'text-anchor': 'end'}, plain(value, 0))}));
  // Three readings the scene earns and then keeps, so the final frame still carries the
  // comparison: where the prediction landed at the right angle, and where it lands at
  // each of the two declared template lengths. Each is its own leader out to its name.
  const ringNames = {right: 'right angle', short: `length ${plain(fixture.pulse)}`, full: `length ${plain(fixture.weight)}`};
  const rings = Object.fromEntries(Object.keys(ringNames).map(key => [key, {
    mark: make('line', {class: 'ts-ring', 'data-ring': key}),
    text: label('ts-ink ts-number', 12, {'data-ring-label': key, 'text-anchor': 'start'}, ringNames[key])
  }]));
  $('[data-weight-display]').setAttribute('aria-hidden', 'true');
  slider.min = String(fixture.range[0]);
  slider.max = String(fixture.range[1]);

  // Geometry. The meter's half-range is the largest score the slider can reach, so a
  // reader who drags the template to either end never pushes the marker off its scale.
  const reach = fixture.input * fixture.range[1];
  const LAYOUT = {
    wide: {width: 713, height: 372, ox: 216, oy: 206, unit: 88, arc: 70, back: 1.4, ahead: 3.2,
      meterX: 548, meterY: 206, meterScale: 140 / reach, title: [500, 44], ringX: 76, gap: [22, 76]},
    narrow: {width: 296, height: 500, ox: 148, oy: 158, unit: 60, arc: 50, back: 1.4, ahead: 2.6,
      meterX: 96, meterY: 380, meterScale: 91 / reach, title: [8, 276], ringX: 76, gap: [20, 70]}
  };
  let g = LAYOUT.wide, mode = 'wide', lastTime = 0, reduced = false, override = null, drawn = '';

  function measure() {
    const width = Math.max(200, Math.round(figure.getBoundingClientRect().width || LAYOUT.wide.width));
    mode = width < 520 ? 'narrow' : 'wide';
    g = LAYOUT[mode];
    root.dataset.layout = mode;
    root.dataset.origin = JSON.stringify([g.ox, g.oy]);
    root.dataset.unit = String(g.unit);
    root.dataset.meter = JSON.stringify({x: g.meterX, base: g.meterY, scale: g.meterScale});
    svg.setAttribute('viewBox', `0 0 ${g.width} ${g.height}`);
  }
  // A label is kept inside the picture by construction: its own estimated box is nudged
  // back from an edge rather than re-anchored, so a label never jumps across its mark.
  // JSDOM lays out no text, so the extent is estimated from the label's own content at
  // about 0.55 em per character — measured off the browser preview at both widths.
  const extent = node => node.textContent.length * Number(node.getAttribute('font-size')) * .55 + 3;
  const put = (node, x, y, anchor = 'middle') => {
    const w = extent(node);
    const left = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
    const shift = left < 6 ? 6 - left : left + w > g.width - 6 ? g.width - 6 - w - left : 0;
    attrs(node, {x: x + shift, y, 'text-anchor': anchor});
  };
  // Every label on this picture is a name over its number. The pair is clamped once, as a
  // pair, so a label pushed back from the top edge can never land on its own second line.
  const pair = (name, value, x, y, anchor = 'middle') => {
    const top = Math.max(16, Math.min(g.height - 21, y));
    put(name, x, top, anchor);
    put(value, x, top + 15, anchor);
  };
  const along = (degrees, radius) => [g.ox + radius * cosDeg(degrees), g.oy - radius * sinDeg(degrees)];

  function draw(state) {
    const {theta, weight, score, prediction, revealed} = state;
    // Words before positions: a label is placed from its own estimated extent, so it has
    // to carry its final text first. Reveal, never fake — a quantity this beat has not
    // reached prints a middle dot, not a zero, which would read as a measurement.
    write(marks.templateValue, plain(weight));
    write(marks.inputValue, plain(fixture.input));
    write(marks.angleValue, `θ ${plain(theta, 1)}°`);
    write(marks.cosValue, `cos ${signed(cosDeg(theta))}`);
    write(marks.baseValue, plain(fixture.bias));
    write(marks.scoreValue, revealed ? signed(score) : '·');
    write(marks.predictionValue, revealed ? signed(prediction) : '·');
    const facing = fixture.direction, aim = facing + theta;
    const origin = [g.ox, g.oy];
    const tip = along(facing, weight * g.unit), head = along(aim, fixture.input * g.unit);
    const shadow = fixture.input * cosDeg(theta), foot = along(facing, shadow * g.unit);
    // The template's line, the shadow on it, and the drop from the input's head.
    attrs(marks.line, {x1: along(facing, -g.back * g.unit)[0], y1: along(facing, -g.back * g.unit)[1],
      x2: along(facing, g.ahead * g.unit)[0], y2: along(facing, g.ahead * g.unit)[1]});
    attrs(marks.shadow, {x1: origin[0], y1: origin[1], x2: foot[0], y2: foot[1]});
    attrs(marks.drop, {x1: head[0], y1: head[1], x2: foot[0], y2: foot[1]});
    attrs(marks.foot, {cx: foot[0], cy: foot[1]});
    attrs(marks.origin, {cx: origin[0], cy: origin[1]});
    attrs(marks.template, {d: arrow(origin, tip, 9)});
    attrs(marks.input, {d: arrow(origin, head, 9)});
    const from = along(facing, g.arc), to = along(aim, g.arc);
    attrs(marks.arc, {d: `M ${px(from[0])} ${px(from[1])} A ${px(g.arc)} ${px(g.arc)} 0 `
      + `${theta > 180 ? 1 : 0} 0 ${px(to[0])} ${px(to[1])}`});
    // The right-angle marker is a square built from the two unit directions at the origin,
    // so it is the drawing's own statement that the shadow has collapsed to a point.
    const side = g.unit * .22;
    const w1 = [cosDeg(facing) * side, -sinDeg(facing) * side], x1 = [cosDeg(aim) * side, -sinDeg(aim) * side];
    attrs(marks.square, {d: `M ${px(origin[0] + w1[0])} ${px(origin[1] + w1[1])}`
      + ` L ${px(origin[0] + w1[0] + x1[0])} ${px(origin[1] + w1[1] + x1[1])}`
      + ` L ${px(origin[0] + x1[0])} ${px(origin[1] + x1[1])}`});
    // Labels ride their marks. The template's own labels sit on the side of its line the
    // input never reaches; the score's sit further out on the same side, so the two never meet.
    const side1 = [sinDeg(facing), cosDeg(facing)];
    const mid = along(facing, weight * g.unit / 2);
    pair(marks.templateName, marks.templateValue,
      mid[0] + side1[0] * g.gap[0], mid[1] + side1[1] * g.gap[0]);
    pair(marks.scoreName, marks.scoreValue,
      foot[0] + side1[0] * g.gap[1], foot[1] + side1[1] * g.gap[1]);
    const beyond = along(aim, fixture.input * g.unit + 18);
    const anchor = cosDeg(aim) < -0.15 ? 'end' : cosDeg(aim) > 0.15 ? 'start' : 'middle';
    pair(marks.inputName, marks.inputValue, beyond[0], beyond[1], anchor);
    // The angle readout stands on the bisector, at the radius where the wedge is first
    // wide enough to hold it: a narrow wedge pushes it out rather than over its own arms.
    // It never passes the input's own tip, where that arrow's labels live.
    const room = Math.max(g.arc + 26, Math.min(fixture.input * g.unit - 12, 30 / sinDeg(theta / 2)));
    const bisector = along(facing + theta / 2, room);
    pair(marks.angleValue, marks.cosValue, bisector[0], bisector[1]);
    // The meter: the same number again, as a bar from the baseline b to the prediction.
    const level = value => g.meterY - g.meterScale * (value - fixture.bias);
    const top = level(fixture.bias + reach), bottom = level(fixture.bias - reach);
    attrs(marks.meterAxis, {x1: g.meterX, x2: g.meterX, y1: top, y2: bottom});
    // The baseline comes in from the left and the recorded readings go out to the right,
    // so two dashed levels at the same height are never drawn over each other.
    attrs(marks.base, {x1: g.meterX - 34, x2: g.meterX + 8, y1: g.meterY, y2: g.meterY});
    pair(marks.baseName, marks.baseValue, g.meterX - 40, g.meterY - 1, 'end');
    put(marks.meterTitle, g.title[0], g.title[1], 'start');
    for (const tick of ticks) {
      const y = level(tick.value);
      attrs(tick.line, {x1: g.meterX - 7, x2: g.meterX + 7, y1: y, y2: y});
      put(tick.text, g.meterX - 12, y + 4, 'end');
    }
    const at = level(prediction);
    attrs(marks.bar, {x1: g.meterX, x2: g.meterX, y1: g.meterY, y2: at});
    attrs(marks.dot, {cx: g.meterX, cy: at});
    pair(marks.predictionName, marks.predictionValue, g.meterX + 13, at - 1, 'start');
    const witness = {right: fixture.bias, full: fixture.bias + fixture.input * cosDeg(theta) * fixture.weight,
      short: fixture.bias + fixture.input * cosDeg(theta) * fixture.pulse};
    for (const [key, ring] of Object.entries(rings)) {
      const y = level(witness[key]);
      attrs(ring.mark, {x1: g.meterX - 8, x2: g.meterX + g.ringX - 8, y1: y, y2: y});
      put(ring.text, g.meterX + g.ringX, y + 4, 'start');
    }
    for (const node of [marks.shadow, marks.drop, marks.foot, marks.scoreName, marks.scoreValue])
      show(node, revealed);
    for (const node of [marks.meterAxis, marks.base, marks.baseName, marks.baseValue, marks.bar,
      marks.dot, marks.predictionName, marks.predictionValue, marks.meterTitle])
      show(node, revealed);
    for (const tick of ticks) { show(tick.line, revealed); show(tick.text, revealed); }
    show(marks.square, revealed && Math.abs(theta - orthogonalAngle) <= 0.35);
    for (const [key, ring] of Object.entries(rings)) {
      const seen = state.witnesses.includes(key);
      show(ring.mark, seen); show(ring.text, seen);
    }
    const description = revealed ? pictures.shown : pictures.hidden;
    if (svg.getAttribute('aria-label') !== description) svg.setAttribute('aria-label', description);
    formula.classList.toggle('ts-model-shown', revealed);
    formula.classList.toggle('ts-identity-shown', state.stage >= 2);
    formula.classList.toggle('ts-direction-lit', state.stage >= 2 && state.stage < 7 && !state.dragged);
    formula.classList.toggle('ts-length-lit', state.stage >= 7 || state.dragged);
  }

  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const clamped = Math.max(0, Math.min(duration, Number.isFinite(time) ? time : 0));
    const stage = stageAt(clamped), held = reducedMotion ? REST[stage] : clamped;
    const dragged = override !== null;
    const theta = angleAt(held), weight = dragged ? override : weightAt(held);
    const cos = cosDeg(theta), score = weight * fixture.input * cos;
    const prediction = fixture.bias + score, revealed = stage >= 1;
    // Each witness ring is earned by the timeline reaching the moment it records.
    const witnesses = [held >= beats[5] && 'right', held >= beats[7] && 'full',
      held >= PULSE.short && 'short'].filter(Boolean);
    const state = {stage, theta, weight, cos, score, prediction, revealed, dragged, witnesses,
      orthogonal: score === 0};
    Object.assign(root.dataset, {stage: String(stage), theta: String(theta), weight: String(weight),
      cos: String(cos), score: String(score), prediction: String(prediction),
      revealed: String(revealed), orthogonal: String(state.orthogonal),
      override: dragged ? 'slider' : '', witnesses: witnesses.join(' ')});
    const key = `${stage}|${theta}|${weight}|${revealed}|${witnesses.join('')}|${mode}`;
    if (key !== drawn) { drawn = key; draw(state); }
    // Restore the requested value as well as the picture: pausing during a drag may have
    // repainted the slider from the timeline.
    slider.value = String(weight);
    write(readout, plain(weight));
    slider.setAttribute('aria-valuetext', `Template length ${plain(weight)}. `
      + `${revealed ? `Direction similarity ${signed(cos)}, score ${signed(score)}, prediction ${signed(prediction)}. ` : ''}`
      + 'Length scales the score; it never changes the direction similarity.');
    const sentence = dragged ? dragging : captions[stage];
    if (caption.textContent !== sentence) caption.textContent = sentence;
    return `${names[stage]}.${revealed ? ` Score ${signed(score)}.` : ''}`;
  }

  function drag() {
    const requested = Math.max(Number(slider.min), Math.min(Number(slider.max), Number(slider.value)));
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
  // own guard: a key it ignores must leave the dragged length alone.
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
