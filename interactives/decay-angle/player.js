(() => {
  const root = document.getElementById('decay-angle-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  // The panel is the one in-repo mirror of the fixture. The angle relation and the
  // shrink rule are the chapter's (chapters/part1/01-linear-regression.qmd:977-984);
  // the two lengths, the nudge, eta and lambda are declared computed variants. Every
  // angle below is the exact arctangent, never the chapter's linear approximation.
  const declared = name => root.dataset[name].trim().split(/\s+/).map(Number);
  const [shortLength, restLength] = declared('lengths');
  const nudge = Number(root.dataset.nudge);
  const eta = Number(root.dataset.eta), lambda = Number(root.dataset.lambda);
  const [minLength, maxLength] = declared('lengthRange');
  const sweepLength = Number(root.dataset.sweepLength);
  const factor = 1 - 2 * eta * lambda;
  (() => {
    const finite = [shortLength, restLength, nudge, eta, lambda, minLength, maxLength, sweepLength];
    if (!finite.every(Number.isFinite)) throw Error('decay-angle: every declared quantity must be finite');
    if (!(shortLength > 0 && nudge > 0)) throw Error('decay-angle: the short length and the nudge must be positive');
    if (!(minLength > 0 && minLength < maxLength)) throw Error('decay-angle: the length range must be a positive interval');
    if (!(restLength >= minLength && restLength <= maxLength && sweepLength >= minLength && sweepLength <= maxLength))
      throw Error('decay-angle: the resting and swept lengths must lie inside the declared range');
    if (!(factor > 0 && factor < 1)) throw Error('decay-angle: the shrink factor must contract without flipping the weight');
  })();

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  // The generated final-frame print is discarded at mount: the player draws the same
  // marks itself, and a leftover copy would double every label in the picture.
  const drawing = svg.querySelector('[data-drawing]');
  drawing.replaceChildren();
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const slider = $('[data-length-slider]'), readout = $('[data-length-readout]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration);
  const stageAt = time => beats.reduce((stage, beat, index) => time >= beat ? index : stage, 0);

  const names = ['Predict', 'Nudge the short weight', 'Carry the same nudge', 'Nudge the long weight',
    'Compare the two turns', 'Shorten the weight', 'Weight decay', 'After the shrink'];
  const captions = [
    'Two weight vectors share one direction. A sideways nudge arrives at the short tip.',
    'The short vector swung wide. The same nudge moves to the long tip: more, less, or the same?',
    'Same arrow, same length, only a different place. Now it is applied.',
    'Five times the length, the same nudge, and it barely turns.',
    'Both tips moved sideways by the same amount. Length alone set the angle.',
    'Drag the length. A shorter weight lets the identical nudge turn it further.',
    'Weight decay multiplies the weight by the shrink factor. Scale falls, direction does not.',
    'A radial shrink restores steering. It does not by itself explain or cure stalled training.'
  ];
  // Two descriptions, so the picture's accessible name can never carry the withheld
  // answer while the reader is being asked to predict it.
  const pictures = {
    hidden: 'One grey ray carries a short weight vector and a long one in the same direction. A perpendicular nudge stands at one tip. The long vector has not turned.',
    shown: 'One grey ray carries a short weight vector and a long one in the same direction. The same perpendicular nudge lifts each tip by the same amount, so the short vector turns through a large angle and the long one turns through a small one. Angles, lengths and their ratio are written beside the marks they measure.'
  };

  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => { const u = clamp(value); return u * u * (3 - 2 * u); };
  // Every transition runs in the tail of the beat it leaves and finishes exactly on the
  // beat it leads into, so an arrow-key seek parks on a finished picture. The one
  // exception is deliberate: nothing moves toward the withheld answer during beat 1.
  const ramp = (time, from, to) => ease((time - from) / (to - from));

  const NS = 'http://www.w3.org/2000/svg';
  // Drawing coordinates are serialised at 0.0001 px so a last-bit library difference
  // cannot change the byte-compared static print. The geometry itself is never rounded.
  const px = value => typeof value === 'number' ? String(Number(value.toFixed(4))) : String(value);
  const attrs = (node, values) => { for (const [key, value] of Object.entries(values)) node.setAttribute(key, px(value)); return node; };
  const make = (tag, attributes, text = '') => {
    const node = attrs(document.createElementNS(NS, tag), attributes);
    node.textContent = text; drawing.appendChild(node); return node;
  };
  const show = (node, visible) => visible ? node.removeAttribute('hidden') : node.setAttribute('hidden', '');
  const write = (node, value) => { if (node.textContent !== value) node.textContent = value; };
  const label = (cls, size = 13, extra = {}) => make('text', {class: cls, 'font-size': size, 'text-anchor': 'middle', ...extra}, '');
  // Plain-text numbers: a true minus sign, never a hyphen, and never e-notation.
  const num = (value, digits) => value.toFixed(digits).replace('-', '−');
  const degrees = value => `${num(value * 180 / Math.PI, 2)}°`;

  // --- the picture, built once ----------------------------------------------------
  const ray = make('line', {class: 'da-ray', 'data-mark': 'ray'});
  const originDot = make('circle', {class: 'da-origin', r: 2.8, 'data-mark': 'origin'});
  const preDecayStub = make('line', {class: 'da-predecay', 'data-mark': 'predecay-stub'});
  const preDecayRing = make('circle', {class: 'da-predecay-ring', r: 4.2, 'data-mark': 'predecay-ring'});
  const preDecayLabel = label('da-scenery', 12, {'data-mark': 'predecay-label'});
  const tieLine = make('line', {class: 'da-tie', 'data-mark': 'tie'});
  const tieLabel = label('da-scenery', 12, {'data-mark': 'tie-label'});
  const shortGhost = make('line', {class: 'da-ghost', 'data-mark': 'short-ghost'});
  const longGhost = make('line', {class: 'da-ghost', 'data-mark': 'long-ghost'});
  const shortArc = make('path', {class: 'da-arc', 'data-mark': 'short-arc'});
  const longArc = make('path', {class: 'da-arc', 'data-mark': 'long-arc'});
  const longLeader = make('line', {class: 'da-leader', 'data-mark': 'long-leader'});
  const longVector = make('path', {class: 'da-weight da-weight-long', 'data-mark': 'long-vector'});
  const shortVector = make('path', {class: 'da-weight da-weight-short', 'data-mark': 'short-vector'});
  const nudgeRecord = make('line', {class: 'da-record', 'data-mark': 'nudge-record'});
  const nudgeArrow = make('path', {class: 'da-nudge-arrow', 'data-mark': 'nudge'});
  const shortTipDot = make('circle', {class: 'da-tip', r: 3.6, 'data-mark': 'short-tip'});
  const longTipDot = make('circle', {class: 'da-tip', r: 3.6, 'data-mark': 'long-tip'});
  const shortAngleLabel = label('da-angle', 13, {'data-mark': 'short-angle', 'data-value': 'angle-short'});
  const longAngleLabel = label('da-angle', 13, {'data-mark': 'long-angle', 'data-value': 'angle-long'});
  const shortLengthLabel = label('da-weight-text', 13, {'data-mark': 'short-length', 'data-value': 'length-short'});
  const longLengthLabel = label('da-weight-text', 13, {'data-mark': 'long-length', 'data-value': 'length-long'});
  const factorChip = label('da-operator', 13, {'data-mark': 'factor', 'data-value': 'factor'});
  const nudgeValue = label('da-nudge-text', 13, {'data-mark': 'nudge-value', 'data-value': 'nudge'});
  const ratioBadge = label('da-ink', 14, {'data-mark': 'ratio', 'data-value': 'ratio', 'text-anchor': 'start'});
  $('[data-length-display]').setAttribute('aria-hidden', 'true');

  // Two layouts of one drawing. Everything is placed in a local frame — `a` along the
  // shared weight direction, `b` perpendicular to it — and the mode decides where that
  // frame points: rightwards on a page-width figure, upwards on a phone, where the long
  // dimension is vertical. Angles are scale free, so both prints show the same turn.
  // A label's offsets are written from the mark it names. In the wide print the lengths
  // hang under the ray beneath each tip and each angle sits in or beside its own wedge;
  // in the narrow print the picture stands on end and the labels leave the drawing in
  // two columns, the short weight's and the long weight's, so they can never meet.
  const MODES = {
    wide: {width: 713, height: 256, ox: 74, oy: 150, unit: 90, vertical: false,
      shortLength: [0, 24, 'middle'], longLength: [0, 48, 'middle'], factor: [0, 70, 'middle'],
      shortAngle: [-10, -8, 'end'], longAngle: null, longLeader: null,
      nudgeValue: [16, 4, 'start'], tie: [9, -14, 'start'],
      predecay: [0, 24, 'middle'], ratio: [74, 244]},
    narrow: {width: 296, height: 506, ox: 56, oy: 446, unit: 64, vertical: true,
      shortLength: [10, 5, 'start'], longLength: [96, 5, 'start'], factor: [96, 41, 'start'],
      shortAngle: [10, 23, 'start'], longAngle: [96, 23, 'start'], longLeader: 88,
      nudgeValue: [-26, 4, 'end'], tie: null,
      predecay: [10, 5, 'start'], ratio: [12, 494]}
  };
  let mode = 'wide', g = MODES.wide, lastTime = 0, reduced = false, override = null, shown = {};
  // The only measurement in the file: called from layout(), never from render().
  function measure() {
    const width = Math.round(figure.getBoundingClientRect().width || MODES.wide.width);
    mode = width < 520 ? 'narrow' : 'wide'; g = MODES[mode];
    svg.setAttribute('viewBox', `0 0 ${g.width} ${g.height}`);
    Object.assign(root.dataset, {layout: mode, unit: String(g.unit), origin: JSON.stringify([g.ox, g.oy])});
  }
  // Local frame to screen. The perpendicular axis points up in the wide print and right
  // in the narrow one, so a positive nudge always leaves the ray on the same side of it.
  const at = (a, b) => g.vertical ? [g.ox + b, g.oy - a] : [g.ox + a, g.oy - b];
  const place = (node, a, b, offset) => {
    if (!offset) return show(node, false);
    const [x, y] = at(a, b);
    attrs(node, {x: x + offset[0], y: y + offset[1], 'text-anchor': offset[2]});
    return true;
  };
  const line = (node, a1, b1, a2, b2) => {
    const [x1, y1] = at(a1, b1), [x2, y2] = at(a2, b2);
    attrs(node, {x1, y1, x2, y2});
  };
  // One arrow helper for the weight vectors and for the nudge: the shaft first, so a
  // suite can read the drawn geometry back out of the `d` string.
  function arrow(node, a1, b1, a2, b2, size = 6) {
    const [x1, y1] = at(a1, b1), [x2, y2] = at(a2, b2);
    const dx = x2 - x1, dy = y2 - y1, length = Math.hypot(dx, dy);
    let d = `M ${px(x1)} ${px(y1)} L ${px(x2)} ${px(y2)}`;
    if (length > 1e-9) {
      const ux = dx / length, uy = dy / length, bx = x2 - size * ux, by = y2 - size * uy;
      d += ` M ${px(bx - size * 0.55 * uy)} ${px(by + size * 0.55 * ux)} L ${px(x2)} ${px(y2)}`
        + ` L ${px(bx + size * 0.55 * uy)} ${px(by - size * 0.55 * ux)}`;
    }
    attrs(node, {d});
  }
  // An arc sampled as a polyline: the same path in both layouts, with no sweep flag to
  // get backwards when the local frame turns.
  function arc(node, radius, angle) {
    const steps = 16, points = [];
    for (let i = 0; i <= steps; i++) {
      const phi = angle * i / steps;
      const [x, y] = at(radius * Math.cos(phi), radius * Math.sin(phi));
      points.push(`${px(x)} ${px(y)}`);
    }
    attrs(node, {d: `M ${points.join(' L ')}`});
  }

  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const clamped = Math.max(0, Math.min(duration, Number.isFinite(time) ? time : 0));
    const stage = stageAt(clamped);
    // Reduced motion holds each beat's finished state: every continuous quantity is
    // read at the beat, so the render at a beat and anywhere inside it is one picture.
    const held = reducedMotion ? beats[stage] : clamped;

    const dragged = override !== null;
    const swept = restLength + (sweepLength - restLength) * ramp(held, 22.6, 25)
      + (restLength - sweepLength) * ramp(held, 27.6, 30);
    const baseLength = dragged ? override : swept;
    const decay = ramp(held, 32.6, 35);
    const effLength = baseLength * (1 - decay * (1 - factor));

    const unit = g.unit, nudgePx = nudge * unit;
    const shortA = shortLength * unit, longA = effLength * unit, preA = baseLength * unit;
    const shortLift = nudgePx * ramp(held, 2.6, 5);
    const longLift = nudgePx * ramp(held, 12.6, 15);
    const arrowA = shortA + (longA - shortA) * ramp(held, 7.6, 10);
    const arrowB = held < 5 ? shortLift : nudgePx;
    const tie = ramp(held, 17.6, 20);

    const shortAngle = Math.atan(shortLift / shortA);
    const longAngle = Math.atan(longLift / longA);
    const restAngle = Math.atan(nudge / effLength);
    const undecayedAngle = Math.atan(nudge / baseLength);
    const revealed = longLift > 0;
    const ratio = revealed ? Math.atan(nudge / shortLength) / restAngle : 0;
    const gain = restAngle / undecayedAngle;

    Object.assign(root.dataset, {stage: String(stage), length: String(effLength),
      baseLength: String(baseLength), shortAngle: String(shortAngle), longAngle: String(longAngle),
      shrinkFactor: String(factor), decayProgress: String(decay),
      revealed: String(revealed), override: dragged ? 'slider' : ''});

    const description = revealed ? pictures.shown : pictures.hidden;
    if (svg.getAttribute('aria-label') !== description) svg.setAttribute('aria-label', description);

    // Scenery and the two weights. Both lie on one ray, so the short vector is drawn
    // over the long one's shaft until the nudge separates them.
    line(ray, 0, 0, maxLength * unit, 0);
    attrs(originDot, {cx: at(0, 0)[0], cy: at(0, 0)[1]});
    arrow(longVector, 0, 0, longA, longLift);
    arrow(shortVector, 0, 0, shortA, shortLift);
    attrs(shortTipDot, {cx: at(shortA, shortLift)[0], cy: at(shortA, shortLift)[1]});
    attrs(longTipDot, {cx: at(longA, longLift)[0], cy: at(longA, longLift)[1]});
    line(shortGhost, 0, 0, shortA, 0); show(shortGhost, shortLift > 0);
    line(longGhost, 0, 0, longA, 0); show(longGhost, longLift > 0);

    // The one object the eye tracks: a single nudge of unchanging length, applied at the
    // short tip, carried along the ray, applied again, and carried back after the shrink.
    arrow(nudgeArrow, arrowA, 0, arrowA, arrowB, 5.5);
    show(nudgeArrow, arrowB > 1e-9);
    place(nudgeValue, arrowA, nudgePx / 2, g.nudgeValue);
    write(nudgeValue, num(nudge, 2));
    show(nudgeValue, arrowB > 1e-9);
    line(nudgeRecord, shortA, 0, shortA, nudgePx); show(nudgeRecord, stage >= 2);

    // Each turn is measured at the shared origin, inside its own wedge. The short
    // weight's wedge is too small to hold a number, so its angle is written just off
    // its tip; the long weight's sits inside its own wedge, clear of the arc.
    // Both arcs stay near the shared origin, where the opening between the ray and the
    // weight is legible: an arc drawn far out subtends the same angle but reads as a
    // tick across the vector rather than as a wedge.
    const longArcR = Math.max(42, Math.min(0.45 * longA, 118));
    arc(shortArc, Math.max(26, Math.min(0.6 * shortA, 58)), shortAngle);
    arc(longArc, longArcR, longAngle);
    show(shortArc, stage >= 1); show(longArc, stage >= 3);
    place(shortAngleLabel, shortA, shortLift, g.shortAngle);
    if (g.longAngle) place(longAngleLabel, longA, longLift, g.longAngle);
    else {
      const phi = 0.42 * longAngle, radius = longArcR + 46;
      place(longAngleLabel, radius * Math.cos(phi), radius * Math.sin(phi), [0, 2, 'middle']);
    }
    write(shortAngleLabel, stage >= 1 ? degrees(shortAngle) : '·');
    write(longAngleLabel, stage >= 3 ? degrees(longAngle) : '·');
    show(shortAngleLabel, stage >= 1); show(longAngleLabel, stage >= 3);

    // Both lifted tips sit on one line: the same sideways move, whatever the length.
    line(tieLine, shortA, nudgePx, shortA + (longA - shortA) * tie, nudgePx);
    show(tieLine, tie > 0);
    if (place(tieLabel, shortA, nudgePx, g.tie)) write(tieLabel, 'same sideways move');
    show(tieLabel, Boolean(g.tie) && stage >= 4);

    // Decay slides the tip back along its own ray; the stub marks where it started.
    line(preDecayStub, longA, 0, preA, 0);
    attrs(preDecayRing, {cx: at(preA, 0)[0], cy: at(preA, 0)[1]});
    place(preDecayLabel, preA, 0, g.predecay); write(preDecayLabel, 'before decay');
    [preDecayStub, preDecayRing, preDecayLabel].forEach(node => show(node, decay > 0));

    // Wide: the lengths hang under the ray, beneath the tip each measures. Narrow: the
    // picture stands on end, so they leave the drawing sideways from the lifted tips.
    const onTip = g.vertical ? 1 : 0;
    place(shortLengthLabel, shortA, shortLift * onTip, g.shortLength);
    place(longLengthLabel, longA, longLift * onTip, g.longLength);
    write(shortLengthLabel, `‖w‖ = ${num(shortLength, 2)}`);
    write(longLengthLabel, `‖w‖ = ${num(effLength, 2)}`);
    place(factorChip, longA, longLift * onTip, g.factor);
    write(factorChip, `× ${num(factor, 2)}`); show(factorChip, stage >= 6);
    // The narrow print's long labels leave the drawing in their own column, so a leader
    // ties them back to the tip. It is written at every width, collapsed and hidden in
    // the wide print, so a resize can never leave the other layout's geometry behind.
    const [lx, ly] = at(longA, longLift * onTip);
    attrs(longLeader, {x1: lx + 8, y1: ly, x2: lx + (g.longLeader === null ? 8 : g.longLeader), y2: ly});
    show(longLeader, g.longLeader !== null);

    attrs(ratioBadge, {x: g.ratio[0], y: g.ratio[1]});
    write(ratioBadge, stage >= 7 ? `decay bought ${num(gain, 2)}× more turn`
      : stage >= 4 ? `the short vector turns ${num(ratio, 2)}× more` : '·');
    show(ratioBadge, stage >= 4);

    formula.classList.toggle('da-angle-lit', stage >= 1 && stage <= 5);
    formula.classList.toggle('da-nudge-lit', stage >= 1 && stage <= 4);
    formula.classList.toggle('da-length-lit', stage === 5);
    formula.classList.toggle('da-rule-shown', stage >= 6);
    formula.classList.toggle('da-shrink-lit', stage >= 6);

    slider.value = String(baseLength);
    readout.textContent = num(baseLength, 2);
    slider.setAttribute('aria-valuetext', `Weight length ${num(baseLength, 2)}.`
      + (decay > 0 ? ` After the shrink factor, ${num(effLength, 2)}.` : '')
      + (revealed ? ` The same nudge turns it ${degrees(longAngle)}.` : '')
      + ' A longer weight turns less under the same nudge.');

    const sentence = dragged
      ? 'The nudge never changes. Only the weight’s length changes, and with it the angle.'
      : captions[stage];
    if (caption.textContent !== sentence) caption.textContent = sentence;
    shown = {stage, mode};
    return `${names[stage]}.${revealed ? ` Long weight turn ${degrees(longAngle)}.` : ''}`;
  }

  function typeset() {
    const done = () => { root.dataset.typeset = root.querySelector('mjx-container') ? 'mathjax' : 'none'; };
    const mathjax = window.MathJax;
    if (mathjax && typeof mathjax.typesetPromise === 'function' && !root.querySelector('mjx-container')) {
      mathjax.typesetPromise([root]).then(done, done);
    } else done();
  }
  function drag() {
    const requested = Math.max(Number(slider.min), Math.min(Number(slider.max), Number(slider.value)));
    if (root.dataset.playing === 'true') $('[data-action="play"]').click();
    override = requested;
    render(lastTime, reduced);
  }
  slider.addEventListener('input', drag);
  slider.addEventListener('change', drag);
  // The detour ends only when the transport itself acts, matching its own key guard in
  // interactives/shared/playback.js: a key the transport ignores leaves the drag alone.
  pane.addEventListener('click', event => {
    if (event.target.closest('[data-action="play"]') && root.dataset.playing !== 'true') override = null;
  }, true);
  pane.addEventListener('keydown', event => {
    if (event.target !== pane || event.altKey || event.ctrlKey || event.metaKey) return;
    const toggles = [' ', 'k', 'K'].includes(event.key);
    if (toggles && (event.repeat || root.dataset.playing === 'true')) return;
    if (toggles || ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) override = null;
  }, true);
  $('[data-controls] input[type="range"]').addEventListener('input', () => { override = null; });

  measure();
  window.BookPlayback(root, render, () => { measure(); shown = {}; render(lastTime, reduced); });
  typeset();
})();
