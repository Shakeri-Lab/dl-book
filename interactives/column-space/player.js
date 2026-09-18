// Chapter 1, "Finding the best weights, method 1: solve it exactly". The chapter owns the
// statement (01-linear-regression.qmd:220-234, and @eq-normal at :193-198); the three-vector
// geometry below is a declared computed variant, described in docs/column-space-excerpt.md.
// Nothing here is trained: the weights are swept along a declared path, and the projection,
// the residual and its length are solved exactly from the declared columns and target.
(() => {
  const root = document.getElementById('column-space-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  // The panel's data-* attributes are this repository's only copy of the scene's geometry:
  // the player reads them instead of retyping a number, and the suite takes its reference
  // values from the same place.
  const fixture = {
    columns: JSON.parse(root.dataset.columns),
    target: JSON.parse(root.dataset.target),
    path: root.dataset.path.trim().split(/\s+/).map(Number),
    bow: Number(root.dataset.bow),
    elevation: Number(root.dataset.elevation)
  };
  const dot = (a, b) => a.reduce((total, value, index) => total + value * b[index], 0);
  const add = (a, b) => a.map((value, index) => value + b[index]);
  const sub = (a, b) => a.map((value, index) => value - b[index]);
  const times = (a, k) => a.map(value => value * k);
  const norm = a => Math.sqrt(dot(a, a));
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  // The normal equations for two columns, solved exactly. This is @eq-normal, not a fit.
  const solve2 = (g, b) => {
    const det = g[0][0] * g[1][1] - g[0][1] * g[1][0];
    return [(b[0] * g[1][1] - g[0][1] * b[1]) / det, (g[0][0] * b[1] - b[0] * g[1][0]) / det];
  };

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration);
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);

  (({columns, target, path, bow, elevation}) => {
    if (!Array.isArray(columns) || columns.length !== 2
      || !columns.every(column => Array.isArray(column) && column.length === 3 && column.every(Number.isFinite)))
      throw Error('column-space: two finite three-dimensional feature columns are required');
    if (!Array.isArray(target) || target.length !== 3 || !target.every(Number.isFinite))
      throw Error('column-space: a finite three-dimensional target is required');
    if (path.length !== beats.length + 1 || !path.every(Number.isFinite))
      throw Error('column-space: the declared path needs one finite value per beat and one more for the end');
    if (!Number.isFinite(bow) || bow < 0 || !Number.isFinite(elevation) || elevation <= 0 || elevation >= 90)
      throw Error('column-space: a finite bow and an elevation strictly between 0 and 90 degrees are required');
    if (norm(cross(columns[0], columns[1])) < 1e-9)
      throw Error('column-space: the two columns must be independent, or they span no plane');
  })(fixture);

  // --- The geometry, solved once -------------------------------------------------
  const [c1, c2] = fixture.columns, target = fixture.target;
  const gram = [[dot(c1, c1), dot(c1, c2)], [dot(c2, c1), dot(c2, c2)]];
  const optimum = solve2(gram, [dot(c1, target), dot(c2, target)]);
  const foot = add(times(c1, optimum[0]), times(c2, optimum[1]));
  const leftover = sub(target, foot), floor = norm(leftover);
  if (floor < 1e-9) throw Error('column-space: the target must lie off the column space, or there is no residual');
  const normal = cross(c1, c2), unit = times(normal, 1 / norm(normal));

  // One fixed axonometric camera. `right` is an in-plane direction chosen to bisect the two
  // columns' outward splay, so the plane draws as a parallelogram; `up` tilts from the plane's
  // normal toward the remaining in-plane direction by the declared elevation. Because `right`
  // is perpendicular to the normal, the perpendicular residual draws exactly up the page.
  const alongPlane = times(c1, 1 / norm(c1));
  const acrossPlane = cross(unit, alongPlane);
  const splay = Math.atan2(dot(c2, acrossPlane), dot(c2, alongPlane));
  const heading = splay / 2 + Math.PI / 2;
  const right = add(times(alongPlane, Math.cos(heading)), times(acrossPlane, Math.sin(heading)));
  const depth = add(times(alongPlane, -Math.sin(heading)), times(acrossPlane, Math.cos(heading)));
  const phi = fixture.elevation * Math.PI / 180;
  const up = add(times(unit, Math.cos(phi)), times(depth, Math.sin(phi)));
  const project = v => [dot(v, right), -dot(v, up)];

  // A candidate is a point of the plane. Its offset from the projection rides a shallow arc
  // whose vertex is the foot, so moving away lengthens the drawn residual and the true one
  // together: the picture never shortens an arrow the readout is lengthening.
  const offsetAt = tau => add(times(right, tau), times(depth, -fixture.bow * tau * tau));
  const stateAt = tau => {
    const offset = offsetAt(tau), prediction = add(foot, offset);
    return {tau, offset, prediction, weights: add(optimum, solve2(gram, [dot(c1, offset), dot(c2, offset)])),
      length: Math.hypot(floor, norm(offset)), atFoot: Math.abs(tau) < 1e-9};
  };

  // The plane is drawn wide enough to hold the origin, both unit columns and the whole search.
  const span = (() => {
    const low = [0, 0], high = [1, 1];
    const from = Math.min(...fixture.path), to = Math.max(...fixture.path);
    for (let step = 0; step <= 200; step++) {
      const {weights} = stateAt(from + (to - from) * step / 200);
      weights.forEach((value, index) => {
        low[index] = Math.min(low[index], value); high[index] = Math.max(high[index], value);
      });
    }
    return [0, 1].map(index => [low[index] - 0.3, high[index] + 0.3]);
  })();
  const inPlane = weights => add(times(c1, weights[0]), times(c2, weights[1]));

  const STAGES = ['Predict', 'One combination', 'The search', 'Closing in',
    'Right angle', 'Past the foot', 'Back to the foot', 'What is left over'];
  const CAPTIONS = [
    'Slide the prediction anywhere inside this plane. Where does the wine residual become shortest?',
    'Scale column one, scale column two, add them head to tail: one prediction.',
    'Turn the weights and the prediction slides across the plane, dragging the residual with it.',
    'Still nothing leaves the plane, and the residual is getting shorter.',
    'Here the residual meets the plane at a right angle, and its length stops falling.',
    'Move the weights off that point and the residual grows again.',
    'Come back, and the residual returns to the same shortest length.',
    'This leftover points straight out of the plane. No weights can remove it.'
  ];

  // --- Marks, made once ----------------------------------------------------------
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const drawing = svg.querySelector('[data-drawing]');
  drawing.replaceChildren();
  const NS = 'http://www.w3.org/2000/svg';
  // Drawing coordinates are serialised at 0.0001 px so a last-bit difference between platform
  // math libraries cannot change the byte-compared static print. The geometry is never rounded.
  const px = value => String(Number(value.toFixed(4)));
  const attrs = (node, values) => {
    for (const [key, value] of Object.entries(values)) node.setAttribute(key, typeof value === 'number' ? px(value) : value);
  };
  const make = (tag, values, text = '') => {
    const node = document.createElementNS(NS, tag);
    attrs(node, values); if (text) node.textContent = text;
    drawing.appendChild(node); return node;
  };
  const show = (node, visible) => visible ? node.removeAttribute('hidden') : node.setAttribute('hidden', '');
  const write = (node, value) => {if (node.textContent !== value) node.textContent = value;};
  const decimals = value => (Math.abs(value) < 5e-5 ? (0).toFixed(2) : value.toFixed(2)).replace('-', '−');

  // Document order is paint order: the plane and its lattice are scenery underneath, the
  // arrows next, every label last so a white-haloed word is never crossed by a line.
  const plane = make('path', {class: 'cs-plane', 'data-plane': ''});
  const gridGroup = make('g', {'data-grid-group': ''});
  const grid = [];
  const targetArrow = make('path', {class: 'cs-target', 'data-target-arrow': ''});
  const originDot = make('circle', {class: 'cs-origin', r: 2.6, 'data-origin': ''});
  const chain = [0, 1].map(index => make('path', {class: 'cs-column', 'data-column': index}));
  const residualArrow = make('path', {class: 'cs-residual', 'data-residual': ''});
  const rightAngle = make('path', {class: 'cs-right-angle', 'data-right-angle': ''});
  const predictionDot = make('circle', {class: 'cs-prediction', r: 5.5, 'data-prediction': ''});
  const targetDot = make('circle', {class: 'cs-target-dot', r: 5.5, 'data-target-dot': ''});
  // The columns are named once, out at the far ends of their own lattice lines, where the
  // plane is empty; only the weight rides the arrow that is being scaled.
  const columnNames = [0, 1].map(index => make('text',
    {class: 'cs-input cs-name', 'font-size': 13, 'data-column-name': index}));
  const chainValues = [0, 1].map(index => make('text',
    {class: 'cs-parameter cs-name', 'text-anchor': 'middle', 'font-size': 13, 'data-value': `weight${index + 1}`}));
  const predictionLabel = make('text',
    {class: 'cs-prediction-ink cs-name', 'text-anchor': 'start', 'font-size': 13, 'data-prediction-label': ''}, 'ŷ');
  const targetLabel = make('text',
    {class: 'cs-target-ink cs-name', 'text-anchor': 'start', 'font-size': 13, 'data-target-label': ''}, 'y');
  const residualLabel = make('text',
    {class: 'cs-residual-ink cs-name', 'text-anchor': 'start', 'font-size': 13, 'data-value': 'residual'});

  const arrow = (from, to, size = 5.5) => {
    const dx = to[0] - from[0], dy = to[1] - from[1], length = Math.hypot(dx, dy);
    const shaft = `M ${px(from[0])} ${px(from[1])} L ${px(to[0])} ${px(to[1])}`;
    if (length < 1e-9) return shaft;
    const ux = dx / length, uy = dy / length, back = [to[0] - size * ux, to[1] - size * uy];
    return `${shaft} M ${px(back[0] - size * .55 * uy)} ${px(back[1] + size * .55 * ux)} `
      + `L ${px(to[0])} ${px(to[1])} L ${px(back[0] + size * .55 * uy)} ${px(back[1] - size * .55 * ux)}`;
  };
  // A label's drawn extent, estimated from its own font size because nothing here measures
  // text. The suite estimates it the same way, so "these two never meet" is a claim both
  // sides can check; 0.62 em a character is read off the browser preview's widest label.
  const extent = (text, x, y, anchor, font) => {
    const reach = 0.62 * font * text.length;
    const left = anchor === 'end' ? x - reach : anchor === 'middle' ? x - reach / 2 : x;
    return {left, right: left + reach, top: y - font, bottom: y + 0.25 * font};
  };
  const marker = (at, radius) => ({left: at[0] - radius, right: at[0] + radius,
    top: at[1] - radius, bottom: at[1] + radius});
  const meets = (a, b, pad) => !(a.right + pad < b.left || b.right + pad < a.left
    || a.bottom + pad < b.top || b.bottom + pad < a.top);
  // The candidate wanders, so a label placed from a fixed mark can still drift under a dot.
  // Step it clear along the page by exactly the overlap: a continuous function of the drawn
  // state, so seeking to a time reproduces the same placement.
  const clear = (shape, spot, pad, downward) => !meets(shape, spot, pad) ? 0
    : downward ? spot.bottom + pad - shape.top : spot.top - pad - shape.bottom;

  // The unit normal to a screen segment that points down the page, so each column arrow
  // keeps its weight on the same side through the whole sweep.
  const under = (from, to) => {
    const dx = to[0] - from[0], dy = to[1] - from[1], length = Math.hypot(dx, dy) || 1;
    const n = [-dy / length, dx / length];
    return n[1] < 0 ? [-n[0], -n[1]] : n;
  };

  // --- Layout: the only place that measures --------------------------------------
  const WIDE = {side: 30, top: 26, bottom: 30, names: ['column 1', 'column 2'], font: 13};
  const NARROW = {side: 11, top: 24, bottom: 30, names: ['col 1', 'col 2'], font: 12};
  let width = 0, narrow = false, scale = 0, origin = [0, 0], style = WIDE;
  let shown = {}, lastTime = 0, reduced = false;
  const screen = point => [origin[0] + scale * point[0], origin[1] + scale * point[1]];
  const plot = vector => screen(project(vector));

  function layout() {
    const measured = Math.max(240, Math.round(figure.getBoundingClientRect().width || 713));
    if (measured === width && scale) return;
    width = measured; narrow = width < 520; style = narrow ? NARROW : WIDE;
    const corners = [[span[0][0], span[1][0]], [span[0][1], span[1][0]],
      [span[0][1], span[1][1]], [span[0][0], span[1][1]]].map(weights => project(inPlane(weights)));
    const above = project(target);
    const xs = corners.map(point => point[0]), ys = [...corners.map(point => point[1]), above[1]];
    const left = Math.min(...xs), top = Math.min(...ys);
    scale = (width - 2 * style.side) / (Math.max(...xs) - left);
    const height = Math.round(style.top + scale * (Math.max(...ys) - top) + style.bottom);
    origin = [style.side - scale * left, style.top - scale * top];
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    Object.assign(root.dataset, {layout: narrow ? 'narrow' : 'wide', pixelsPerUnit: String(scale),
      origin: JSON.stringify(screen([0, 0]).map(value => Number(value.toFixed(4))))});

    attrs(plane, {d: `${corners.map((point, index) => `${index ? 'L' : 'M'} `
      + `${px(screen(point)[0])} ${px(screen(point)[1])}`).join(' ')} Z`});
    // A lattice of the two column directions: it is the span made visible, and it gives the
    // scaled column arrows a unit to be read against. Its two zero lines are the columns' own.
    const lines = [];
    for (const axis of [0, 1]) {
      const other = 1 - axis;
      for (let step = Math.ceil(span[axis][0] - 1e-9); step <= Math.floor(span[axis][1] + 1e-9); step++) {
        const ends = [span[other][0], span[other][1]].map(edge => {
          const weights = []; weights[axis] = step; weights[other] = edge;
          return screen(project(inPlane(weights)));
        });
        lines.push({ends, home: step === 0});
      }
    }
    while (grid.length > lines.length) gridGroup.removeChild(grid.pop());
    while (grid.length < lines.length) {
      const line = document.createElementNS(NS, 'line');
      gridGroup.appendChild(line); grid.push(line);
    }
    lines.forEach((line, index) => attrs(grid[index], {'data-grid': '', x1: line.ends[0][0], y1: line.ends[0][1],
      x2: line.ends[1][0], y2: line.ends[1][1], class: line.home ? 'cs-grid cs-grid-home' : 'cs-grid'}));

    const home = plot([0, 0, 0]), above2 = plot(target);
    attrs(originDot, {cx: home[0], cy: home[1]});
    attrs(targetArrow, {d: arrow(home, above2)});
    attrs(targetDot, {cx: above2[0], cy: above2[1]});
    attrs(targetLabel, {x: above2[0] + 10, y: above2[1] + 4});
    // Each column is named at the outer tip of its own lattice line, stepped away from the
    // plane's interior along the other column's direction, so the name sits in empty plane
    // instead of following an arrow into the busy corner by the target.
    [c1, c2].forEach((column, index) => {
      const reach = [0, 0]; reach[index] = span[index][1];
      const tip = plot(inPlane(reach)), other = project(fixture.columns[1 - index]);
      const length = Math.hypot(other[0], other[1]) || 1;
      const out = [-16 * other[0] / length, -16 * other[1] / length];
      attrs(columnNames[index], {x: tip[0] + out[0], y: tip[1] + out[1] + 4,
        'text-anchor': out[0] < 0 ? 'start' : 'end'});
      write(columnNames[index], style.names[index]);
    });
    [...columnNames, ...chainValues, predictionLabel, targetLabel, residualLabel]
      .forEach(node => attrs(node, {'font-size': style.font}));
    shown = {};
  }

  // --- Drawing: a pure function of the state -------------------------------------
  function draw(state) {
    const home = plot([0, 0, 0]), above = plot(target), here = plot(state.prediction);
    // The two columns start unscaled and side by side at the origin; the build glide scales
    // each by its weight and slides the second onto the head of the first, so the sum
    // ŷ = w₁X_:1 + w₂X_:2 is assembled rather than asserted.
    const k = [1 + state.build * (state.weights[0] - 1), 1 + state.build * (state.weights[1] - 1)];
    const corner = plot(times(c1, k[0])), reach = plot(times(c2, k[1]));
    const joint = [home[0] + state.build * (corner[0] - home[0]), home[1] + state.build * (corner[1] - home[1])];
    const legs = [[home, corner], [joint, [joint[0] + reach[0] - home[0], joint[1] + reach[1] - home[1]]]];
    // The candidate's name sits on the side the chain never reaches, opposite the right-angle
    // mark, so neither the second weight nor the mark can meet it.
    const named = [here[0] + 10, here[1] + 17];
    const spot = marker(here, 5.5), naming = extent('ŷ', named[0], named[1], 'start', style.font);
    const placed = legs.map((leg, index) => {
      attrs(chain[index], {d: arrow(leg[0], leg[1])});
      // Each weight sits near its own arrow's TAIL and hangs below it. The tails are the
      // origin and the joint, so a weight cannot drift onto the candidate at the far head,
      // and the two run off in opposite directions because the chain splays. The second
      // hangs one line lower, which keeps the pair legible through the build, where both
      // arrows still start at the origin.
      const grip = [leg[0][0] + .3 * (leg[1][0] - leg[0][0]), leg[0][1] + .3 * (leg[1][1] - leg[0][1])];
      const away = under(leg[0], leg[1]), gap = 2 * style.font;
      const reading = `× ${decimals(k[index])}`, anchor = index === 0 ? 'end' : 'start';
      const x = grip[0] + gap * away[0];
      const y = grip[1] + gap * away[1] + .35 * style.font + (index === 0 ? 0 : style.font + 5);
      return {reading, anchor, x, y};
    });
    // Both weights step down clear of the candidate and its name, then the second steps clear
    // of the first. Every step is downward, so repeating them settles instead of oscillating.
    const shape = label => extent(label.reading, label.x, label.y, label.anchor, style.font);
    for (let pass = 0; pass < 3; pass++) placed.forEach((label, index) => {
      label.y += clear(shape(label), spot, 2, true);
      label.y += clear(shape(label), naming, 2, true);
      if (index) label.y += clear(shape(label), shape(placed[0]), 2, true);
    });
    placed.forEach((label, index) => {
      attrs(chainValues[index], {'text-anchor': label.anchor, x: label.x, y: label.y});
      write(chainValues[index], label.reading);
    });
    attrs(predictionDot, {cx: here[0], cy: here[1]});
    attrs(predictionLabel, {x: named[0], y: named[1]});
    attrs(residualArrow, {d: arrow(here, above)});
    // The readout rides the upper part of the residual, near the target, where the picture is
    // empty at every width.
    const grip = [above[0] + .4 * (here[0] - above[0]), above[1] + .4 * (here[1] - above[1])];
    const dx = above[0] - here[0], dy = above[1] - here[1], length = Math.hypot(dx, dy) || 1;
    // The residual points up the page, so its left-hand normal always points right: the
    // readout keeps the same side of the arrow through the whole sweep, and crosses to the
    // left only when the candidate has carried it so far right that the number would leave
    // the picture.
    const away = [-dy / length, dx / length];
    const reading = `‖e‖ = ${decimals(state.length)}`;
    const x = Math.min(grip[0] + 13 * away[0] + 3, width - 4 - 0.62 * style.font * reading.length);
    let y = grip[1] + 13 * away[1] + 4;
    y += clear(extent(reading, x, y, 'start', style.font), marker(above, 5.5), 2, true);
    attrs(residualLabel, {'text-anchor': 'start', x, y});
    write(residualLabel, reading);
    // The mark is the projection of a genuine three-dimensional square: one leg along the
    // in-plane direction the camera draws horizontally, one along the plane's unit normal.
    const leg = 11 / scale, base = add(foot, times(right, -leg));
    const glyph = [base, add(base, times(unit, leg)), add(foot, times(unit, leg))].map(plot);
    attrs(rightAngle, {d: `M ${px(glyph[0][0])} ${px(glyph[0][1])} L ${px(glyph[1][0])} ${px(glyph[1][1])} `
      + `L ${px(glyph[2][0])} ${px(glyph[2][1])}`});
  }

  function reveal(state) {
    const stage = state.stage, revealed = stage >= 4;
    Object.assign(root.dataset, {stage: String(stage), revealed: String(revealed)});
    // Before the reveal the picture, its accessible name and the scrubber all withhold where
    // the residual bottoms out: the sweep is the evidence, and the answer arrives with it.
    svg.setAttribute('aria-label', `A target above a schematic column-space plane. ${STAGES[stage]}. ` + (revealed
      ? 'The shortest residual meets the plane at a right angle, and no weights remove what is left.'
      : 'A candidate prediction moves inside the plane while the length of its residual is measured.'));
    show(rightAngle, revealed && state.atFoot);
    chainValues.forEach(node => show(node, stage >= 1));
    formula.classList.toggle('cs-combo-shown', stage >= 1);
    formula.classList.toggle('cs-combo-lit', stage >= 1 && stage <= 3);
    formula.classList.toggle('cs-normal-shown', revealed);
    formula.classList.toggle('cs-normal-lit', stage === 4 || stage === 7);
    formula.classList.toggle('cs-gap-lit', stage === 7);
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
    const eased = fraction * fraction * fraction * (fraction * (fraction * 6 - 15) + 10);
    const state = {...stateAt(fixture.path[stage] + (fixture.path[stage + 1] - fixture.path[stage]) * eased),
      stage, build: stage < 1 ? 0 : stage > 1 ? 1 : eased};

    const key = `${stage}/${state.tau.toFixed(6)}/${state.build.toFixed(6)}/${scale.toFixed(4)}`;
    if (key !== shown.key) {
      draw(state);
      if (stage !== shown.stage || state.atFoot !== shown.atFoot) reveal(state);
      Object.assign(root.dataset, {tau: String(state.tau), weights: JSON.stringify(state.weights),
        residual: String(state.length),
        drawn: String(Math.hypot(...sub(plot(target), plot(state.prediction))) / scale)});
      shown = {key, stage, atFoot: state.atFoot};
    }
    return `${STAGES[stage]}. Residual length ${decimals(state.length)}.`;
  }

  function typeset() {
    const done = () => {root.dataset.typeset = root.querySelector('mjx-container') ? 'mathjax' : 'none';};
    const mathjax = window.MathJax;
    if (mathjax && typeof mathjax.typesetPromise === 'function' && !root.querySelector('mjx-container'))
      mathjax.typesetPromise([root]).then(done, done);
    else done();
  }

  Object.assign(root.dataset, {optimum: JSON.stringify(optimum), floor: String(floor)});
  layout();
  window.BookPlayback(root, render, () => {layout(); shown = {}; render(lastTime, reduced);});
  typeset();
})();
