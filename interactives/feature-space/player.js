// Chapter 3, "Your first real MLP". The chapter owns the sentence this scene draws
// (03-nonlinearity-mlp.qmd:464-470: the MLP "did not learn a curved boundary; it learned a
// space in which the boundary is straight", with the boundary at the exact coordinate
// -b/||w||) and the moon shape (:417-420). Everything else here is a declared schematic:
// the chapter's own points, phi_theta and boundary coordinate come from a seeded training
// run and are never printed, so they could not be reproduced. See docs/feature-space-excerpt.md.
//
// Nothing is trained. The four hidden units and the readout are declared in panel.html and
// held fixed; the only thing that moves is the bend, whose negative-side slope lambda runs
// from 1 (the layer is affine, so the two-layer stack collapses -- @eq-collapse) to 0 (the
// chapter's relu). The drawn horizontal coordinate is the readout coordinate at every
// lambda, so the cut at -b/||w|| is one fixed vertical line for the whole timeline.
(() => {
  const root = document.getElementById('feature-space-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  // The panel's data-* attributes are this repository's only copy of the scene's fixture:
  // the player reads them instead of retyping a number, and the suite takes its reference
  // values from the same place.
  const list = name => root.dataset[name].trim().split(/\s+/).map(Number);
  const fixture = {
    perMoon: Number(root.dataset.perMoon),
    radii: list('radii'),
    moonOffset: list('moonOffset'),
    hidden: JSON.parse(root.dataset.hidden),
    hiddenBias: list('hiddenBias'),
    readout: list('readout'),
    readoutBias: Number(root.dataset.readoutBias),
    secondAxis: list('secondAxis')
  };

  const dot = (a, b) => a.reduce((total, value, index) => total + value * b[index], 0);
  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration);
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);

  // --- The declared network, checked once ----------------------------------------
  const {hidden, hiddenBias, readout, readoutBias, secondAxis} = fixture;
  const norm = Math.hypot(...readout);
  const unit = readout.map(value => value / norm);      // w-hat, the readout direction
  const cut = -readoutBias / norm;                      // the chapter's exact coordinate
  const column = index => hidden.map(row => row[index]);
  (() => {
    const units = hidden.length;
    if (!Array.isArray(hidden) || units < 2 || !hidden.every(row => Array.isArray(row) && row.length === 2
      && row.every(Number.isFinite))) throw Error('feature-space: the hidden layer needs finite two-input rows');
    for (const [name, vector] of [['hiddenBias', hiddenBias], ['readout', readout], ['secondAxis', secondAxis]])
      if (vector.length !== units || !vector.every(Number.isFinite))
        throw Error(`feature-space: ${name} needs one finite value per hidden unit`);
    if (!(norm > 0) || !Number.isFinite(readoutBias)) throw Error('feature-space: the readout must be a finite nonzero vector');
    const near = (value, want) => Math.abs(value - want) < 1e-12;
    if (!near(Math.hypot(...secondAxis), 1) || !near(dot(secondAxis, unit), 0))
      throw Error('feature-space: the second drawing axis must be a unit vector orthogonal to the readout direction');
    // The scene's structural invariant: with the bend fully open the layer is affine, and
    // in these two directions it is the identity on the input plane. That is what lets the
    // first frame BE the chapter's input plane and the last frame its feature space, with
    // one screen mapping and one stationary cut serving both.
    if (!near(dot(column(0), unit), 1) || !near(dot(column(1), unit), 0)
      || !near(dot(column(0), secondAxis), 0) || !near(dot(column(1), secondAxis), 1))
      throw Error('feature-space: the declared layer does not draw the input plane undistorted at lambda = 1');
  })();

  // --- The declared cloud: the chapter's moon shape, sampled ----------------------
  // moon1 = (cos t, sin t); moon2 = (1, 0.4) - (cos t, sin t), the chapter's own
  // parametrisation, at equally spaced angles with the radius alternating through the
  // declared list. The chapter's 400 points are a seeded sample and are not reproduced.
  const cloud = [];
  for (let moon = 0; moon < 2; moon++) {
    for (let index = 0; index < fixture.perMoon; index++) {
      const angle = index * Math.PI / (fixture.perMoon - 1);
      const radius = fixture.radii[index % fixture.radii.length];
      const x = radius * Math.cos(angle), y = radius * Math.sin(angle);
      cloud.push(moon === 0 ? {label: 0, x, y}
        : {label: 1, x: fixture.moonOffset[0] - x, y: fixture.moonOffset[1] - y});
    }
  }

  // phi at bend lambda: max(z, 0) + lambda * min(z, 0). lambda = 1 leaves the layer affine,
  // lambda = 0 is the chapter's relu. Written as one expression so the whole family is
  // plainly one activation with its negative side closing.
  const featuresAt = (point, lambda) => hidden.map((row, index) => {
    const z = row[0] * point.x + row[1] * point.y + hiddenBias[index];
    return z >= 0 ? z : lambda * z;
  });
  // The vertical coordinate is centred on the cloud's own mean at every frame, exactly as
  // the chapter centres its residual before taking a principal component; the horizontal
  // coordinate, which the cut lives on, is never re-centred.
  const placeAt = lambda => {
    const raw = cloud.map(point => {
      const phi = featuresAt(point, lambda);
      return {label: point.label, across: dot(phi, unit), up: dot(phi, secondAxis)};
    });
    const mean = raw.reduce((total, spot) => total + spot.up, 0) / raw.length;
    return raw.map(spot => ({...spot, up: spot.up - mean,
      wrong: (spot.label === 1) !== (spot.across > cut)}));
  };

  const ENDS = [placeAt(1), placeAt(0)];               // the chapter's two printed panels
  const wrongAt = spots => spots.reduce((total, spot) => total + (spot.wrong ? 1 : 0), 0);
  if (wrongAt(ENDS[1]) !== 0)
    throw Error('feature-space: the declared map must separate the declared cloud at lambda = 0');
  if (wrongAt(ENDS[0]) === 0)
    throw Error('feature-space: the declared cut must fail on the declared cloud at lambda = 1');
  // Every coordinate is affine in lambda, so a point travels a straight segment and crosses
  // the stationary cut at most once. These are the crossers, and the fraction of the morph
  // at which each one crosses.
  const crossings = cloud.map((_, index) => {
    const from = ENDS[0][index].across - cut, to = ENDS[1][index].across - cut;
    return from * to < 0 ? {index, at: from / (from - to)} : null;
  }).filter(Boolean).sort((first, second) => first.at - second.at);
  const settled = crossings.length ? crossings.at(-1).at : 0;

  const STAGES = ['Predict', 'The cut', 'The bend opens', 'Straight paths',
    'Pulling apart', 'Fully bent', 'One clear channel', 'Where they began'];
  const CAPTIONS = [
    'Two interleaved moons, one straight cut. Must the cut bend to separate them?',
    'This cut is the readout boundary itself, fixed at minus b over the norm of w.',
    'The bend starts to open. Watch the points move, and watch the cut stand still.',
    'Every point walks a straight path. The cut has neither moved nor bent.',
    'The two classes pull apart along the readout coordinate, one crossing at a time.',
    'The bend is fully open: this is the learned feature space, and the cut is unchanged.',
    'The same straight cut now sits in a clear channel between the two classes.',
    'Grey paths show where the crossers began. Same points, same line, re-drawn space.'
  ];
  // The bend runs over the four middle beats. lambda is read at the beat under reduced
  // motion, so each beat holds one picture.
  const MORPH = [1, 1, 1, 0.75, 0.5, 0.25, 0, 0];

  // --- Marks, made once ----------------------------------------------------------
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const drawing = svg.querySelector('[data-drawing]');
  drawing.replaceChildren();
  const NS = 'http://www.w3.org/2000/svg';
  // Coordinates are serialised at 0.0001 px so a last-bit difference between platform math
  // libraries cannot change the byte-compared static print. The arithmetic stays unrounded.
  const px = value => String(Number(value.toFixed(4)));
  const attrs = (node, values) => {
    for (const [key, value] of Object.entries(values))
      node.setAttribute(key, typeof value === 'number' ? px(value) : value);
  };
  const make = (tag, values, parent = drawing, text = '') => {
    const node = document.createElementNS(NS, tag);
    attrs(node, values); if (text) node.textContent = text;
    parent.appendChild(node); return node;
  };
  const show = (node, visible) => visible ? node.removeAttribute('hidden') : node.setAttribute('hidden', '');
  const write = (node, value) => { if (node.textContent !== value) node.textContent = value; };
  const minus = text => text.replace('-', '−');
  const decimals = (value, places = 2) => minus(Math.abs(value) < 5e-5 ? (0).toFixed(places) : value.toFixed(places));

  // Document order is paint order: channel and frame underneath, then the trails, the cut,
  // the points, the wine rings, and every word last.
  const channel = make('rect', {class: 'fs-channel', 'data-channel': ''});
  const frame = make('rect', {class: 'fs-frame', 'data-frame': '', fill: 'none'});
  const trailGroup = make('g', {'data-trails': ''});
  const trails = crossings.map(crossing => ({
    line: make('line', {class: 'fs-trail', 'data-trail': crossing.index}, trailGroup),
    start: make('circle', {class: 'fs-trail-start', r: 1.8, 'data-trail-start': crossing.index}, trailGroup)
  }));
  const cutLine = make('line', {class: 'fs-cut-line', 'data-cut': ''});
  const pointGroup = make('g', {'data-points': ''});
  const dots = cloud.map((point, index) => make('circle',
    {class: point.label === 1 ? 'fs-target fs-filled' : 'fs-target fs-hollow', 'data-point': index}, pointGroup));
  const ringGroup = make('g', {'data-rings': ''});
  const rings = cloud.map((_, index) => make('circle', {class: 'fs-ring', 'data-ring': index}, ringGroup));
  // The bend gauge: the activation itself, small, with its own axes, so the reader can see
  // what lambda is. Two segments meeting at the origin; only the negative side turns.
  const gauge = make('g', {'data-gauge': ''});
  const gaugeBox = make('path', {class: 'fs-gauge-axis', 'data-gauge-axis': '', fill: 'none'}, gauge);
  const gaugeCurve = make('path', {class: 'fs-gauge-curve', 'data-gauge-curve': '', fill: 'none'}, gauge);
  const gaugeName = make('text', {class: 'fs-ink fs-name', 'data-gauge-name': '', 'text-anchor': 'middle'}, gauge, 'the bend');
  const gaugeValue = make('text', {class: 'fs-ink fs-name', 'text-anchor': 'middle'}, gauge);
  const gaugeSlope = make('tspan', {'data-value': 'bend'}, gaugeValue);
  // Names. The horizontal axis is x1 while the layer is affine and the readout coordinate
  // once it is not; the two names share one spot, because they are one axis, and the picture
  // shows whichever is true of the frame. The vertical name does the same.
  const acrossName = ['x₁', 'ŵ · φ(x)'].map(text => make('text',
    {class: 'fs-input fs-name', 'text-anchor': 'middle', 'data-across-name': ''}, drawing, text));
  const upName = ['x₂', 'orthogonal direction'].map(text => make('text',
    {class: 'fs-input fs-name', 'text-anchor': 'middle', 'data-up-name': ''}, drawing, text));
  const cutName = make('text', {class: 'fs-parameter fs-name', 'text-anchor': 'middle', 'data-cut-name': ''});
  cutName.append(document.createTextNode('−b/‖w‖ = '));
  const cutValue = make('tspan', {'data-value': 'cut'}, cutName);
  const countName = make('text', {class: 'fs-error fs-name', 'text-anchor': 'start', 'data-count': ''});
  const countWords = document.createTextNode('on the wrong side  ');
  countName.append(countWords);
  const countValue = make('tspan', {'data-value': 'wrong'}, countName);
  // Two marks named once: the fill is the label y, so the picture is readable without colour
  // and without asking the reader to hold a convention in their head.
  const key = [0, 1].map(label => ({
    dot: make('circle', {class: label === 1 ? 'fs-target fs-filled' : 'fs-target fs-hollow', 'data-key-dot': label}),
    text: make('text', {class: 'fs-target-ink fs-name', 'text-anchor': 'start', 'data-key': label}, drawing, `y = ${label}`)
  }));

  // --- Layout: the only place that measures --------------------------------------
  const PAD = {across: 0.35, up: 0.12};
  const span = (() => {
    const across = ENDS.flat().map(spot => spot.across), up = ENDS.flat().map(spot => spot.up);
    return {x0: Math.min(...across, cut) - PAD.across, x1: Math.max(...across, cut) + PAD.across,
      y0: Math.min(...up) - PAD.up, y1: Math.max(...up) + PAD.up};
  })();
  // Two layouts, and the top strip is where they differ most: side by side above a wide
  // picture, stacked on a phone, so the wine count and the orange cut label never meet.
  const WIDE = {at: 713, left: 46, right: 20, top: 42, bottom: 46, font: 13, dot: 5, ring: 8.8,
    upText: 'orthogonal direction', countText: 'on the wrong side  ',
    countY: 27, cutY: 27, keyY: 27};
  // At narrow widths the moons already reach into every corner, so the picture keeps the
  // points and the cut and drops the gauge rather than printing a label over them; the bend
  // is still named by the formula line, which every width carries.
  const NARROW = {at: 296, left: 24, right: 10, top: 54, bottom: 34, font: 12, dot: 3.6, ring: 6.2,
    upText: 'orthogonal', countText: 'wrong side  ', countY: 19, cutY: 44, keyY: 19};
  // The share of the picture, at the bottom right, that the cloud never enters at any bend.
  const CORNER = {across: 0.185, up: 0.30};
  let style = WIDE, scale = 0, origin = [0, 0], height = 0, narrow = false, measured = 0;
  let lastTime = 0, reduced = false, shown = {};
  const gaugeAt = {x: 0, y: 0, size: 0};
  const screen = (across, up) => [origin[0] + scale * across, origin[1] - scale * up];

  function layout() {
    const width = Math.max(240, Math.round(figure.getBoundingClientRect().width || WIDE.at));
    if (width === measured && scale) return;
    measured = width; narrow = width < 520; style = narrow ? NARROW : WIDE;
    scale = (width - style.left - style.right) / (span.x1 - span.x0);
    height = Math.round(style.top + scale * (span.y1 - span.y0) + style.bottom);
    origin = [style.left - scale * span.x0, style.top + scale * span.y1];
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    root.classList.toggle('is-stacked', narrow);
    Object.assign(root.dataset, {layout: narrow ? 'narrow' : 'wide', pixelsPerUnit: String(scale)});

    const left = screen(span.x0, span.y1), right = screen(span.x1, span.y0);
    attrs(frame, {x: left[0], y: left[1], width: right[0] - left[0], height: right[1] - left[1]});
    attrs(cutLine, {x1: screen(cut, span.y1)[0], y1: left[1], x2: screen(cut, span.y0)[0], y2: right[1]});
    attrs(cutName, {x: screen(cut, 0)[0], y: style.cutY, 'font-size': style.font});
    attrs(countName, {x: style.left, y: style.countY, 'font-size': style.font});
    countWords.nodeValue = style.countText;
    // The key is right-aligned in the top strip: the filled mark last, so its word ends at
    // the picture's own right edge whatever the layout. Text widths are estimated from the
    // font, because nothing here measures text; the suite estimates them the same way.
    const keyText = 5 * 0.58 * style.font, keyStep = keyText + 2 * style.dot + 18;
    key.forEach((entry, label) => {
      const end = right[0] - (1 - label) * keyStep;
      attrs(entry.text, {x: end, y: style.keyY, 'font-size': style.font, 'text-anchor': 'end'});
      attrs(entry.dot, {cx: end - keyText - style.dot - 5, cy: style.keyY - style.font * 0.32, r: style.dot});
    });
    acrossName.forEach(node => attrs(node, {x: (left[0] + right[0]) / 2, y: right[1] + style.bottom - 14,
      'font-size': style.font}));
    upName.forEach((node, index) => {
      attrs(node, {x: 0, y: 0, 'font-size': style.font,
        transform: `translate(${px(style.left - style.font + 1)} ${px((left[1] + right[1]) / 2)}) rotate(-90)`});
      if (index === 1) write(node, style.upText);
    });
    dots.forEach(node => attrs(node, {r: style.dot}));
    rings.forEach(node => attrs(node, {r: style.ring}));
    // The gauge lives in CORNER, a fixed fraction of the picture at the bottom right that
    // no point reaches at any bend, whatever the width — so it is reserved in drawing units
    // and only its drawn size follows the layout. Where that corner cannot hold a legible
    // gauge and its two words, the picture keeps the points and drops the gauge; the bend is
    // still named by the formula line, which every width carries.
    const font = style.font - 2, pad = 10;
    const inside = {across: (span.x1 - span.x0) * CORNER.across * scale - 2 * pad,
      up: (span.y1 - span.y0) * CORNER.up * scale - 2 * pad};
    const size = Math.min(inside.across, inside.up - 2 * font - 10);
    const fits = size >= 24 && inside.across >= 0.62 * font * gaugeName.textContent.length;
    gaugeAt.size = fits ? size : 0;
    // A dropped gauge is blanked, not merely hidden: a mark left carrying the geometry of
    // some earlier width would make the published frame depend on the resize history.
    if (!fits) {
      attrs(gaugeBox, {d: ''}); attrs(gaugeCurve, {d: ''});
      for (const node of [gaugeName, gaugeValue]) attrs(node, {x: 0, y: 0, 'font-size': font, 'text-anchor': 'end'});
      shown = {}; return;
    }
    const edge = right[0] - pad, foot = right[1] - pad;
    const box = {x: edge - size, y: foot - font - 6 - size};
    Object.assign(gaugeAt, {x: box.x, y: box.y});
    attrs(gaugeBox, {d: `M ${px(box.x)} ${px(box.y + size / 2)} L ${px(box.x + size)} ${px(box.y + size / 2)} `
      + `M ${px(box.x + size / 2)} ${px(box.y)} L ${px(box.x + size / 2)} ${px(box.y + size)}`});
    attrs(gaugeName, {x: edge, y: box.y - 5, 'font-size': font, 'text-anchor': 'end'});
    attrs(gaugeValue, {x: edge, y: foot, 'font-size': font, 'text-anchor': 'end'});
    shown = {};
  }

  // --- Drawing: a pure function of the state -------------------------------------
  function draw(state) {
    const spots = state.spots;
    spots.forEach((spot, index) => {
      const [x, y] = screen(spot.across, spot.up);
      attrs(dots[index], {cx: x, cy: y});
      attrs(rings[index], {cx: x, cy: y});
      show(rings[index], spot.wrong);
    });
    // The channel is the clear strip the cut ends up inside: drawn from the two nearest
    // points, so it is the measured gap and not a decoration.
    const left = Math.max(...spots.filter(spot => spot.label === 0).map(spot => spot.across));
    const right = Math.min(...spots.filter(spot => spot.label === 1).map(spot => spot.across));
    const top = screen(left, span.y1), bottom = screen(right, span.y0);
    attrs(channel, {x: top[0], y: top[1], width: Math.max(0, bottom[0] - top[0]), height: bottom[1] - top[1]});
    trails.forEach((trail, order) => {
      const index = crossings[order].index;
      const from = screen(ENDS[0][index].across, ENDS[0][index].up);
      const to = screen(spots[index].across, spots[index].up);
      attrs(trail.line, {x1: from[0], y1: from[1], x2: to[0], y2: to[1]});
      attrs(trail.start, {cx: from[0], cy: from[1]});
    });
    // The gauge draws the activation on its own axes: the positive side is fixed, the
    // negative side turns from the diagonal (no bend) to flat (the chapter's relu).
    const {x, y, size} = gaugeAt, half = size / 2;
    if (size) attrs(gaugeCurve, {d: `M ${px(x)} ${px(y + half + half * state.bend)} `
      + `L ${px(x + half)} ${px(y + half)} L ${px(x + size)} ${px(y)}`});
    write(gaugeSlope, `λ = ${decimals(state.bend)}`);
    // The axis is renamed at the beat the bend starts opening, not faded across it: while
    // the layer is affine this coordinate really is the input's own, and from the moment it
    // is not, the picture says what it is instead. One name stands at a time.
    const affine = state.bend >= 1;
    acrossName.forEach((node, index) => show(node, (index === 0) === affine));
    upName.forEach((node, index) => show(node, (index === 0) === affine));
    write(cutValue, decimals(cut));
    write(countValue, String(state.wrong));
  }

  function reveal(state) {
    const stage = state.stage;
    show(cutName, stage >= 1);
    show(gauge, stage >= 2 && gaugeAt.size > 0);
    show(channel, stage >= 6);
    show(trailGroup, stage >= 7);
    // Until the last point crosses, neither the picture's accessible name nor the scrubber
    // says how this ends: the count on the picture is the only answer, and it is true of
    // the frame it sits on.
    svg.setAttribute('aria-label', 'Thirty-two declared points and one straight cut, drawn in the '
      + 'readout coordinate. ' + (state.settled
        ? 'The bend is open, the points have moved into two separated groups, and the cut, which never moved, has every point on its own side.'
        : 'The hidden layer’s bend is opening; the points move past the stationary cut.'));
    formula.classList.toggle('is-readout', stage >= 1);
    formula.classList.toggle('is-bend', stage >= 2);
    formula.classList.toggle('is-cut-lit', stage === 1 || stage >= 6);
    formula.classList.toggle('is-bend-lit', stage >= 2 && stage <= 5);
    write(caption, CAPTIONS[stage]);
  }

  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const clamped = Math.max(0, Math.min(duration, Number.isFinite(time) ? time : 0));
    const stage = stageAt(clamped), next = beats[stage + 1] === undefined ? duration : beats[stage + 1];
    // Reduced motion holds each beat: every continuous quantity is read at the beat itself,
    // so the render at a beat and just after it are the same picture.
    const clock = reducedMotion ? beats[stage] : clamped, reach = next - beats[stage];
    const fraction = reach > 0 ? Math.max(0, Math.min(1, (clock - beats[stage]) / reach)) : 1;
    const bend = MORPH[stage] + (MORPH[stage + 1] === undefined ? 0 : (MORPH[stage + 1] - MORPH[stage]) * fraction);
    const spots = placeAt(bend), wrong = wrongAt(spots);
    const state = {stage, bend, spots, wrong, settled: wrong === 0 && bend < 1};

    const key = `${stage}/${bend.toFixed(6)}/${scale.toFixed(4)}`;
    if (key !== shown.key) {
      draw(state);
      if (stage !== shown.stage || state.settled !== shown.settled) reveal(state);
      Object.assign(root.dataset, {stage: String(stage), bend: String(bend), wrong: String(wrong),
        separated: String(state.settled), cut: String(cut)});
      shown = {key, stage: state.stage, settled: state.settled};
    }
    return `${STAGES[stage]}. ${state.wrong} on the wrong side of the cut.`;
  }

  function typeset() {
    const done = () => { root.dataset.typeset = root.querySelector('mjx-container') ? 'mathjax' : 'none'; };
    const mathjax = window.MathJax;
    if (mathjax && typeof mathjax.typesetPromise === 'function' && !root.querySelector('mjx-container'))
      mathjax.typesetPromise([root]).then(done, done);
    else done();
  }

  Object.assign(root.dataset, {crossings: String(crossings.length), settledAt: String(settled)});
  layout();
  window.BookPlayback(root, render, () => { layout(); shown = {}; render(lastTime, reduced); });
  typeset();
})();
