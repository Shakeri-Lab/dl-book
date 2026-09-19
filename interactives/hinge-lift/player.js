// Chapter 3, "The neuron: a threshold with a bend". The chapter owns the XOR table
// (03-nonlinearity-mlp.qmd:28-33), the ReLU and the neuron (:161-162), this neuron's
// weights (:186) and the OFF/ON line with w perpendicular to it (:216-217). Everything
// else below is a declared computed variant, described in docs/hinge-lift-excerpt.md:
// the swept family of failing lines, the drawn window, the one fixed camera, the flat
// plane's starting attitude, and the separating cut — which is SOLVED from the four
// lifted corners, not fitted, and not typed in. Nothing here is trained.
(() => {
  const root = document.getElementById('hinge-lift-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  // The panel's data-* attributes are this repository's only copy of the scene's numbers:
  // the player reads them instead of retyping one, and the suite takes its reference
  // values from the same place.
  const fixture = {
    xor: JSON.parse(root.dataset.xor),
    weights: JSON.parse(root.dataset.weights),
    bias: Number(root.dataset.bias),
    bestLine: JSON.parse(root.dataset.bestLine),
    turn: Number(root.dataset.turn),
    flatStart: Number(root.dataset.flatStart),
    window: JSON.parse(root.dataset.window),
    azimuth: Number(root.dataset.azimuth),
    elevation: Number(root.dataset.elevation),
    rise: Number(root.dataset.rise)
  };

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration);
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);
  const finite = value => Number.isFinite(value);

  (({xor, weights, bias, bestLine, turn, flatStart, window: win, azimuth, elevation, rise}) => {
    if (!Array.isArray(xor) || xor.length !== 4
      || !xor.every(row => Array.isArray(row) && row.length === 3 && row.every(finite) && (row[2] === 0 || row[2] === 1)))
      throw Error('hinge-lift: four labelled rows of two finite inputs are required');
    if (xor.filter(row => row[2] === 1).length !== 2)
      throw Error('hinge-lift: the two classes must each hold two corners');
    if (!Array.isArray(weights) || weights.length !== 2 || !weights.every(finite) || !finite(bias))
      throw Error('hinge-lift: the neuron needs two finite weights and a finite bias');
    if (Math.hypot(weights[0], weights[1]) < 1e-9)
      throw Error('hinge-lift: a zero weight vector draws no line through the plane');
    if (!Array.isArray(bestLine) || bestLine.length !== 3 || !bestLine.every(finite)
      || Math.hypot(bestLine[0], bestLine[1]) < 1e-9)
      throw Error('hinge-lift: the chapter line needs a finite non-zero normal and offset');
    if (!finite(turn) || !finite(flatStart) || !finite(rise) || rise <= 0)
      throw Error('hinge-lift: a finite turn, a finite flat start and a positive rise are required');
    if (!Array.isArray(win) || win.length !== 2 || !win.every(finite) || win[1] - win[0] < 0.5)
      throw Error('hinge-lift: the drawn window must be a finite interval wide enough to hold the corners');
    if (!xor.every(row => row[0] >= win[0] && row[0] <= win[1] && row[1] >= win[0] && row[1] <= win[1]))
      throw Error('hinge-lift: every corner must lie inside the drawn window');
    if (!finite(azimuth) || !finite(elevation) || elevation <= 0 || elevation >= 90)
      throw Error('hinge-lift: a finite azimuth and an elevation strictly between 0 and 90 degrees are required');
  })(fixture);

  // --- The neuron, and the lift it produces --------------------------------------
  const [w1, w2] = fixture.weights, bias = fixture.bias;
  const stimulus = point => w1 * point[0] + w2 * point[1] + bias;
  const corners = fixture.xor.map(([x1, x2, label]) => {
    const z = stimulus([x1, x2]);
    return {at: [x1, x2], label, z, h: Math.max(0, z), sign: label === 0 ? 1 : -1};
  });

  // The separating plane h = p x1 + q x2 + r is SOLVED, not declared: the one plane whose
  // four signed vertical clearances are all the same m. Four equations, four unknowns.
  // Because those clearances always sum to the same constant whatever the plane, a
  // positive m is exactly the statement that the fold made the corners separable.
  const solve = (matrix, rhs) => {
    const n = rhs.length, a = matrix.map((row, index) => [...row, rhs[index]]);
    for (let col = 0; col < n; col++) {
      let pivot = col;
      for (let row = col + 1; row < n; row++) if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
      if (Math.abs(a[pivot][col]) < 1e-12) throw Error('hinge-lift: the four corners fix no separating plane');
      [a[col], a[pivot]] = [a[pivot], a[col]];
      for (let row = 0; row < n; row++) {
        if (row === col) continue;
        const factor = a[row][col] / a[col][col];
        for (let k = col; k <= n; k++) a[row][k] -= factor * a[col][k];
      }
    }
    return a.map((row, index) => row[n] / row[index]);
  };
  const [cutP, cutQ, cutR, margin] = solve(
    corners.map(c => [c.sign * c.at[0], c.sign * c.at[1], c.sign, 1]),
    corners.map(c => c.sign * c.h));
  // The fold budget: the same sum for every plane, so it is the whole supply of clearance.
  const budget = corners.reduce((total, c) => total + c.sign * c.h, 0);
  if (!(margin > 1e-9))
    throw Error('hinge-lift: one hinge does not lift these corners into a separable arrangement');

  const CUT = [cutP, cutQ, cutR], FLAT = [0, 0, fixture.flatStart];
  const planeAt = tilt => CUT.map((value, index) => FLAT[index] + tilt * (value - FLAT[index]));
  const planeHeight = (plane, at) => plane[0] * at[0] + plane[1] * at[1] + plane[2];
  const cutScore = plane => corners.filter(c => (c.h > planeHeight(plane, c.at)) === (c.label === 0)).length;

  // The failing family: unit-normal lines u(theta) . x = rho. Its first member is the
  // chapter's own rule; its last is this neuron's own threshold.
  const lineNorm = Math.hypot(fixture.bestLine[0], fixture.bestLine[1]);
  const startAngle = Math.atan2(fixture.bestLine[1], fixture.bestLine[0]);
  const startOffset = fixture.bestLine[2] / lineNorm;
  const weightNorm = Math.hypot(w1, w2);
  const creaseAngle = Math.atan2(w2, w1), creaseOffset = -bias / weightNorm;
  const turnAngle = fixture.turn * Math.PI / 180;
  const smoother = u => u * u * u * (u * (u * 6 - 15) + 10);
  // The turning line: still on the chapter's own rule through the first beat, then one
  // continuous turn that passes the declared far placement and comes to rest exactly on
  // this neuron's threshold, so the line has stopped moving before it is named. Each half
  // of that turn eases in and out, so the reversal happens at zero speed.
  const lineAt = (stage, fraction) => {
    if (stage < 1) return [startAngle, startOffset];
    if (stage > 1) return [creaseAngle, creaseOffset];
    const first = fraction <= 0.5;
    const u = smoother(first ? fraction * 2 : fraction * 2 - 1);
    const from = first ? [startAngle, startOffset] : [turnAngle, startOffset];
    const to = first ? [turnAngle, startOffset] : [creaseAngle, creaseOffset];
    return from.map((value, index) => value + (to[index] - value) * u);
  };
  const lineSide = (angle, offset, at) =>
    (Math.cos(angle) * at[0] + Math.sin(angle) * at[1] > offset ? 1 : 0);
  const lineScore = (angle, offset) => corners.filter(c => lineSide(angle, offset, c.at) === c.label).length;
  const lineMisses = (angle, offset) => corners.map(c => lineSide(angle, offset, c.at) !== c.label);

  // --- Half-plane geometry, all exact --------------------------------------------
  const [lo, hi] = fixture.window;
  const BOX = [[1, 0, hi], [-1, 0, -lo], [0, 1, hi], [0, -1, -lo]];
  const OFF = [w1, w2, -bias];          // the neuron is silent:  w . x + b <= 0
  const ON = [-w1, -w2, bias];          // the neuron fires
  // Sutherland-Hodgman: keep {a x1 + b x2 <= c}.
  const clip = (polygon, [a, b, c]) => {
    const inside = point => a * point[0] + b * point[1] <= c + 1e-12;
    const out = [];
    polygon.forEach((point, index) => {
      const previous = polygon[(index + polygon.length - 1) % polygon.length];
      const here = inside(point), before = inside(previous);
      if (here !== before) {
        const da = a * previous[0] + b * previous[1] - c, db = a * point[0] + b * point[1] - c;
        const t = da / (da - db);
        out.push([previous[0] + t * (point[0] - previous[0]), previous[1] + t * (point[1] - previous[1])]);
      }
      if (here) out.push(point);
    });
    return out;
  };
  const region = (...cuts) => cuts.reduce(clip,
    [[lo, lo], [hi, lo], [hi, hi], [lo, hi]]);
  // The piece of the line a x1 + b x2 = c that survives inside a list of half-planes.
  const chord = ([a, b, c], ...cuts) => {
    const scale = a * a + b * b, base = [a * c / scale, b * c / scale], dir = [-b, a];
    let from = -1e6, to = 1e6;
    for (const [ha, hb, hc] of [...BOX, ...cuts]) {
      const along = ha * dir[0] + hb * dir[1], at = ha * base[0] + hb * base[1] - hc;
      if (Math.abs(along) < 1e-12) { if (at > 1e-12) return null; continue; }
      const bound = -at / along;
      if (along > 0) to = Math.min(to, bound); else from = Math.max(from, bound);
    }
    if (to - from < 1e-9) return null;
    return [from, to].map(t => [base[0] + t * dir[0], base[1] + t * dir[1]]);
  };

  const SHEET = region(ON);                       // the half of the plane that rises
  const FLATPIECE = region(OFF);                  // the half that stays pinned at zero
  const ZONE0 = [region([cutP, cutQ, -cutR], OFF),            // class 0, silent side
    region([cutP - w1, cutQ - w2, bias - cutR], ON)];         // class 0, firing side
  const SHADOW_FLAT = chord([cutP, cutQ, -cutR], OFF);
  const SHADOW_RISEN = chord([w1 - cutP, w2 - cutQ, cutR - bias], ON);
  if (!SHADOW_FLAT || !SHADOW_RISEN)
    throw Error('hinge-lift: the cut leaves no visible boundary inside the drawn window');
  const sheetHeight = at => Math.max(0, stimulus(at));

  // --- One fixed axonometric camera ----------------------------------------------
  // Not a lens the reader can turn: a drawing device. `right` lies in the input plane,
  // `up` tilts from the activation axis toward the plane by the declared elevation, and
  // the two are orthonormal, so the activation axis draws exactly up the page.
  const radians = degrees => degrees * Math.PI / 180;
  const sinA = Math.sin(radians(fixture.azimuth)), cosA = Math.cos(radians(fixture.azimuth));
  const sinE = Math.sin(radians(fixture.elevation)), cosE = Math.cos(radians(fixture.elevation));
  const RIGHT = [-sinA, cosA, 0], UP = [cosA * sinE, sinA * sinE, cosE];
  const project = (at, h) => [RIGHT[0] * at[0] + RIGHT[1] * at[1],
    -(UP[0] * at[0] + UP[1] * at[1] + UP[2] * fixture.rise * h)];

  // The activation axis is ruled over the corners' own range, not over the whole sheet:
  // it is there to give their heights a scale, and a taller post only costs headroom.
  const topHeight = Math.max(...corners.map(c => c.h));
  const lowHeight = Math.min(0, ...corners.map(c => c.z));
  // Every world point the scene can ever draw, so one extent serves every frame.
  const EXTENT = (() => {
    const seen = [];
    const box = [[lo, lo], [hi, lo], [hi, hi], [lo, hi]];
    for (const at of box) {
      seen.push(project(at, 0), project(at, sheetHeight(at)),
        project(at, planeHeight(CUT, at)), project(at, planeHeight(FLAT, at)));
    }
    for (const c of corners) seen.push(project(c.at, c.h), project(c.at, c.z));
    seen.push(project([lo, lo], topHeight), project([lo, lo], lowHeight));
    const xs = seen.map(point => point[0]), ys = seen.map(point => point[1]);
    return {left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys)};
  })();

  const STAGES = ['No line', 'Turn it', 'One neuron', 'The lift', 'The clip',
    'The cut', 'The shadow', 'Flat cut, bent boundary'];
  const CAPTIONS = [
    'No straight line gets all four. Must the boundary itself bend to fix that?',
    'Turn the line: the wrong point changes, and the count never reaches four.',
    'Hand that line to one neuron: silent on one side, firing on the other.',
    'Each point rises by its own activation — and the silent corner stays at zero.',
    'Unbent, that corner would drop to −0.25; the clip lifts it by exactly 0.25.',
    'Now a flat plane tilts through the lifted points, and the count starts climbing.',
    'Drop that cut back onto the input plane: the boundary arrives in two pieces.',
    'The cut never bent. The space did, and that is what one hidden unit buys.'
  ];
  const SCENE = 'Four XOR corners on a schematic input plane, seen from one fixed angle.';
  const VIEW = [
    ' A straight rule turns across them.', ' A straight rule turns across them.',
    ' The neuron’s own threshold line splits the plane into a silent side and a firing side.',
    ' A third axis has risen and each corner stands at its own activation.',
    ' A third axis has risen and each corner stands at its own activation.',
    ' A flat plane tilts between the lifted corners.',
    ' A flat plane tilts between the lifted corners and its crossing falls to the input plane.',
    ' A flat plane separates them, and the input plane below carries a two-piece boundary.'
  ];

  // --- Marks, made once ----------------------------------------------------------
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const drawing = svg.querySelector('[data-drawing]');
  drawing.replaceChildren();
  const NS = 'http://www.w3.org/2000/svg';
  // Drawing coordinates are serialised at 0.0001 px so a last-bit difference between
  // platform maths libraries cannot change the byte-compared static print. The
  // mathematical state is never rounded.
  const px = value => String(Number(value.toFixed(4)));
  const attrs = (node, values) => {
    for (const [key, value] of Object.entries(values))
      node.setAttribute(key, typeof value === 'number' ? px(value) : value);
  };
  const make = (tag, values, text = '') => {
    const node = document.createElementNS(NS, tag);
    attrs(node, values); if (text) node.textContent = text;
    drawing.appendChild(node); return node;
  };
  const show = (node, visible) => visible ? node.removeAttribute('hidden') : node.setAttribute('hidden', '');
  const write = (node, value) => { if (node.textContent !== value) node.textContent = value; };
  const decimals = value => (Math.abs(value) < 5e-3 ? (0).toFixed(2) : value.toFixed(2)).replace('-', '−');

  // Document order is paint order: surfaces first, then lines, then markers, then every
  // label, so a white-haloed word is never crossed by an edge.
  const planeFace = make('path', {class: 'hl-plane', 'data-plane': ''});
  const offFace = make('path', {class: 'hl-off', 'data-off-face': ''});
  const zoneFaces = ZONE0.map((_, index) => make('path', {class: 'hl-zone', 'data-zone': index}));
  const squareEdge = make('path', {class: 'hl-square', 'data-square': ''});
  const sheetFace = make('path', {class: 'hl-sheet', 'data-sheet': ''});
  const cutFace = make('path', {class: 'hl-cut-face', 'data-cut': ''});
  const boundary = make('path', {class: 'hl-line', 'data-line': ''});
  const wArrow = make('path', {class: 'hl-weight', 'data-weight': ''});
  const axis = make('path', {class: 'hl-axis', 'data-axis': ''});
  const axisTick = make('path', {class: 'hl-axis', 'data-axis-tick': ''});
  const risenChord = make('path', {class: 'hl-shadow hl-shadow-air', 'data-chord': ''});
  const droppers = [0, 1].map(index => make('path', {class: 'hl-dropper', 'data-dropper': index}));
  const shadowRisen = make('path', {class: 'hl-shadow', 'data-shadow': 'risen'});
  const shadowFlat = make('path', {class: 'hl-shadow', 'data-shadow': 'flat'});
  const stems = corners.map((_, index) => make('path', {class: 'hl-stem', 'data-stem': index}));
  const feet = corners.map((_, index) => make('circle', {class: 'hl-foot', r: 2.2, 'data-foot': index}));
  const ghostStem = make('path', {class: 'hl-ghost-stem', 'data-ghost-stem': ''});
  const ghostDot = make('circle', {class: 'hl-ghost', r: 4.4, 'data-ghost': ''});
  const markers = corners.map((corner, index) => make(corner.label === 0 ? 'circle' : 'rect',
    {class: corner.label === 0 ? 'hl-zero' : 'hl-one', 'data-corner': index}));
  const misses = corners.map((_, index) => make('circle', {class: 'hl-miss', r: 9.5, 'data-miss': index}));
  const values = corners.map((_, index) => make('text',
    {class: 'hl-name', 'text-anchor': 'start', 'font-size': 13, 'data-value': `corner${index}`}));
  const ghostValue = make('text',
    {class: 'hl-name hl-activation', 'text-anchor': 'start', 'font-size': 13, 'data-value': 'ghost'});
  const scoreValue = make('text',
    {class: 'hl-name hl-score', 'text-anchor': 'start', 'font-size': 13, 'data-value': 'score'});
  const wName = make('text', {class: 'hl-name hl-parameter', 'text-anchor': 'middle', 'font-size': 13,
    'data-weight-name': ''}, 'w');
  const offName = make('text', {class: 'hl-name hl-scenery-ink', 'text-anchor': 'middle', 'font-size': 13,
    'data-region-name': 'off'}, 'OFF');
  const onName = make('text', {class: 'hl-name hl-scenery-ink', 'text-anchor': 'middle', 'font-size': 13,
    'data-region-name': 'on'}, 'ON');
  const axisName = make('text', {class: 'hl-name hl-activation', 'text-anchor': 'start', 'font-size': 13,
    'data-axis-name': ''}, 'h');
  const tickName = make('text', {class: 'hl-name hl-activation', 'text-anchor': 'end', 'font-size': 13,
    'data-tick-name': ''}, '1');
  const inputNames = ['x₁', 'x₂'].map((label, index) => make('text',
    {class: 'hl-name hl-input', 'text-anchor': 'middle', 'font-size': 13, 'data-input-name': index}, label));

  // A label's drawn extent, estimated from its own font size because nothing here
  // measures text; the suite estimates it the same way, so "these two never meet" is a
  // claim both sides can check. 0.62 em a character is read off the browser preview.
  const extent = (text, x, y, anchor, font) => {
    const reach = 0.62 * font * text.length;
    const left = anchor === 'end' ? x - reach : anchor === 'middle' ? x - reach / 2 : x;
    return {left, right: left + reach, top: y - font, bottom: y + 0.25 * font};
  };
  const meets = (a, b, pad) => !(a.right + pad < b.left || b.right + pad < a.left
    || a.bottom + pad < b.top || b.bottom + pad < a.top);

  // --- Layout: the only place that measures --------------------------------------
  const WIDE = {side: 30, top: 26, bottom: 30, font: 13, tick: true, far: true};
  const NARROW = {side: 11, top: 22, bottom: 24, font: 12, tick: false, far: false};
  let width = 0, narrow = false, scale = 0, origin = [0, 0], style = WIDE;
  let shown = {}, lastTime = 0, reduced = false, fixed = {};
  const screen = point => [origin[0] + scale * point[0], origin[1] + scale * point[1]];
  const plot = (at, h) => screen(project(at, h));
  const path = (points, close = true) => points
    .map((point, index) => `${index ? 'L' : 'M'} ${px(point[0])} ${px(point[1])}`).join(' ') + (close ? ' Z' : '');
  const face = (polygon, h) => path(polygon.map(at => plot(at, typeof h === 'function' ? h(at) : h)));
  const arrow = (from, to, size = 6) => {
    const dx = to[0] - from[0], dy = to[1] - from[1], length = Math.hypot(dx, dy);
    const shaft = `M ${px(from[0])} ${px(from[1])} L ${px(to[0])} ${px(to[1])}`;
    if (length < 1e-9) return shaft;
    const ux = dx / length, uy = dy / length, back = [to[0] - size * ux, to[1] - size * uy];
    return `${shaft} M ${px(back[0] - size * .55 * uy)} ${px(back[1] + size * .55 * ux)} `
      + `L ${px(to[0])} ${px(to[1])} L ${px(back[0] + size * .55 * uy)} ${px(back[1] - size * .55 * ux)}`;
  };

  function layout() {
    const measured = Math.max(240, Math.round(figure.getBoundingClientRect().width || 713));
    if (measured === width && scale) return;
    width = measured; narrow = width < 520; style = narrow ? NARROW : WIDE;
    scale = (width - 2 * style.side) / (EXTENT.right - EXTENT.left);
    const height = Math.round(style.top + scale * (EXTENT.bottom - EXTENT.top) + style.bottom);
    origin = [style.side - scale * EXTENT.left, style.top - scale * EXTENT.top];
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    Object.assign(root.dataset, {layout: narrow ? 'narrow' : 'wide', pixelsPerUnit: String(scale),
      origin: JSON.stringify(screen([0, 0]).map(value => Number(value.toFixed(4))))});

    // Everything that depends only on the fixture and the width is drawn here, once.
    attrs(planeFace, {d: face(region(), 0)});
    ZONE0.forEach((polygon, index) => attrs(zoneFaces[index], {d: face(polygon, 0)}));
    attrs(offFace, {d: face(FLATPIECE, 0)});
    attrs(squareEdge, {d: path([[0, 0], [1, 0], [1, 1], [0, 1]].map(at => plot(at, 0)))});
    attrs(shadowFlat, {d: path(SHADOW_FLAT.map(at => plot(at, 0)), false)});
    // The weight arrow sits on the neuron's own line, pointing across it: the chapter's
    // "w perpendicular to the boundary", drawn where the plane is otherwise empty.
    const creaseEnds = chord([w1, w2, -bias]);
    const foot = creaseEnds
      ? [(creaseEnds[0][0] + creaseEnds[1][0]) / 2, (creaseEnds[0][1] + creaseEnds[1][1]) / 2] : [0, 0];
    const reach = 0.42 / weightNorm;
    fixed = {weight: [foot, [foot[0] + reach * w1, foot[1] + reach * w2]], words: []};
    attrs(wName, {'font-size': style.font});
    // The activation axis stands at the empty near corner of the window.
    const post = [lo, lo];
    attrs(axis, {d: path([plot(post, lowHeight), plot(post, topHeight)], false)});
    const tickAt = plot(post, 1);
    attrs(axisTick, {d: path([[tickAt[0] - 5, tickAt[1]], [tickAt[0] + 5, tickAt[1]]], false)});
    const crown = plot(post, topHeight);
    attrs(axisName, {x: crown[0] + 9, y: crown[1] + 0.35 * style.font, 'font-size': style.font});
    attrs(tickName, {x: tickAt[0] - 8, y: tickAt[1] + 0.35 * style.font, 'font-size': style.font});
    // The two region words go where their own half of the window is emptiest: the point
    // of the region farthest, on the page, from any corner marker and from its own edges.
    const spots = corners.map(corner => plot(corner.at, 0));
    const roomiest = halfplanes => {
      let best = plot([0, 0], 0), score = -Infinity;
      for (let i = 0; i <= 24; i++) for (let j = 0; j <= 24; j++) {
        const at = [lo + (hi - lo) * i / 24, lo + (hi - lo) * j / 24];
        if (!halfplanes.every(([a, b, c]) => a * at[0] + b * at[1] <= c - 1e-9)) continue;
        const here = plot(at, 0);
        const fromEdge = Math.min(...[...BOX, ...halfplanes].map(([a, b, c]) =>
          (c - a * at[0] - b * at[1]) / Math.hypot(a, b))) * scale;
        const fromMark = Math.min(...spots.map(spot => Math.hypot(here[0] - spot[0], here[1] - spot[1])));
        const value = Math.min(fromMark, 1.6 * fromEdge);
        if (value > score) { score = value; best = here; }
      }
      return best;
    };
    const offSpot = roomiest([OFF]), onSpot = roomiest([ON]);
    attrs(offName, {x: offSpot[0], y: offSpot[1], 'font-size': style.font});
    attrs(onName, {x: onSpot[0], y: onSpot[1], 'font-size': style.font});
    // The two input axes are named along the unit square's own near edges, stepped out
    // of the plane and clear of the column the pinned corner's ghost falls down.
    // Each input axis is named just outside its own edge of the unit square, at the point
    // of that edge whose column on the page is farthest from all four corners' columns —
    // the corners' readings ride up and down their columns, so that is the one place along
    // the edge a name can never be overtaken.
    const columns = spots.map(spot => spot[0]);
    const clearest = build => {
      let best = build(0.5), score = -Infinity;
      for (let k = 0; k <= 80; k++) {
        const at = build(k / 80), here = plot(at, 0)[0];
        const value = Math.min(...columns.map(column => Math.abs(here - column)));
        if (value > score) { score = value; best = at; }
      }
      return best;
    };
    [clearest(s => [s, -0.17]), clearest(s => [-0.17, s])].forEach((at, index) => {
      const spot = plot(at, 0);
      attrs(inputNames[index], {x: spot[0], y: spot[1] + 0.35 * style.font, 'font-size': style.font});
    });
    // The scenery words this width fixes, so the one label that travels can be stepped
    // clear of them by exactly its overlap rather than by guesswork.
    fixed.words = [offName, onName, ...inputNames].map(node => extent(node.textContent,
      Number(node.getAttribute('x')), Number(node.getAttribute('y')), 'middle', style.font));
    [...values, ghostValue, scoreValue].forEach(node => attrs(node, {'font-size': style.font}));
    // The score sits in the top corner the drawing never reaches: the tallest marks all
    // stand over the far side of the window.
    attrs(scoreValue, {x: style.side + 4.2 * style.font, y: style.top + style.font});
    shown = {};
  }

  // --- Drawing: a pure function of the state -------------------------------------
  // A reading rides directly over (or under) the mark it measures, slid sideways only as
  // far as the picture's edge demands: a continuous function of the drawn state, so
  // seeking to a time reproduces the same placement.
  const label = (node, anchorPoint, text, under = false) => {
    const half = 0.31 * style.font * text.length;
    const x = Math.min(Math.max(anchorPoint[0], 3 + half), width - 3 - half);
    const y = anchorPoint[1] + (under ? 17 + 0.35 * style.font : -14);
    attrs(node, {'text-anchor': 'middle', x, y});
    write(node, text);
    return extent(text, x, y, 'middle', style.font);
  };

  function draw(state) {
    const {angle, offset, lift, ghost, tilt, drop, grow, stage} = state;
    const ends = chord([Math.cos(angle), Math.sin(angle), offset]);
    if (ends) attrs(boundary, {d: path(ends.map(at => plot(at, 0)), false)});
    attrs(sheetFace, {d: face(SHEET, at => lift * sheetHeight(at))});
    const plane = planeAt(tilt);
    attrs(cutFace, {d: face(region(), at => planeHeight(plane, at))});
    // The weight arrow grows out of the neuron's own line, across it: the chapter's
    // "w perpendicular to the boundary", drawn only once the line has come to rest.
    const [wFoot, wHead] = fixed.weight;
    const tip = [wFoot[0] + grow * (wHead[0] - wFoot[0]), wFoot[1] + grow * (wHead[1] - wFoot[1])];
    const tipScreen = plot(tip, 0);
    attrs(wArrow, {d: arrow(plot(wFoot, 0), tipScreen)});
    // The corners: each rides its own activation, and the OFF corner never leaves zero.
    const boxes = [], spots = [];
    corners.forEach((corner, index) => {
      const here = plot(corner.at, lift * corner.h), base = plot(corner.at, 0);
      if (corner.label === 0) attrs(markers[index], {cx: here[0], cy: here[1], r: 6.2});
      else attrs(markers[index], {x: here[0] - 5.4, y: here[1] - 5.4, width: 10.8, height: 10.8});
      attrs(misses[index], {cx: here[0], cy: here[1]});
      attrs(stems[index], {d: path([base, here], false)});
      attrs(feet[index], {cx: base[0], cy: base[1]});
      spots.push({left: here[0] - 7, right: here[0] + 7, top: here[1] - 7, bottom: here[1] + 7});
      values[index].setAttribute('class', stage >= 3 ? 'hl-name hl-activation' : 'hl-name hl-target');
      boxes.push({node: values[index],
        box: label(values[index], here, stage >= 3 ? decimals(lift * corner.h) : String(corner.label))});
    });
    // The ghost falls out of the pinned corner to the stimulus the rectifier discarded.
    // It keeps the far side of its own column, where the activation label never goes.
    const pinned = corners.find(corner => corner.z < 0) || corners[0];
    const sunk = plot(pinned.at, ghost * pinned.z), top = plot(pinned.at, 0);
    attrs(ghostDot, {cx: sunk[0], cy: sunk[1]});
    attrs(ghostStem, {d: path([top, sunk], false)});
    label(ghostValue, sunk, decimals(ghost * pinned.z), true);
    // The cut's crossing with the risen sheet, and the same line after it has fallen.
    const air = SHADOW_RISEN.map(at => plot(at, lift * sheetHeight(at)));
    const land = SHADOW_RISEN.map(at => plot(at, (1 - drop) * lift * sheetHeight(at)));
    attrs(risenChord, {d: path(air, false)});
    attrs(shadowRisen, {d: path(land, false)});
    droppers.forEach((node, index) => attrs(node, {d: path([air[index], land[index]], false)}));
    write(scoreValue, `${state.score} of 4`);
    // The one travelling word: it rides under the arrowhead, stepped down past any word
    // already placed that it would otherwise cross. Each step is exactly the overlap and
    // downward, so it settles, and it is a function of the drawn state alone.
    let naming = tipScreen[1] + 13 + 0.35 * style.font;
    const avoid = [...fixed.words, ...boxes.map(entry => entry.box), ...spots];
    for (let pass = 0; pass < 4; pass++) for (const word of avoid) {
      const shape = extent('w', tipScreen[0], naming, 'middle', style.font);
      if (meets(shape, word, 3)) naming += word.bottom + 3 - shape.top;
    }
    attrs(wName, {x: tipScreen[0], y: naming});
    // Two activation labels that drift together are stepped apart along the page by
    // exactly their overlap: a continuous function of the drawn state, so seeking to a
    // time reproduces the same placement, and every step is upward, away from the marks.
    boxes.forEach((entry, index) => {
      for (let other = 0; other < index; other++) {
        if (!meets(entry.box, boxes[other].box, 2)) continue;
        const step = boxes[other].box.top - 2 - entry.box.bottom;
        entry.box.top += step; entry.box.bottom += step;
        attrs(entry.node, {y: Number(entry.node.getAttribute('y')) + step});
      }
    });
  }

  function reveal(state) {
    const stage = state.stage, revealed = stage >= 5;
    Object.assign(root.dataset, {stage: String(stage), revealed: String(revealed)});
    svg.setAttribute('aria-label', SCENE + VIEW[stage]);
    show(boundary, true);
    boundary.setAttribute('class', stage >= 2 ? 'hl-line hl-line-neuron' : 'hl-line');
    show(offFace, stage >= 2); show(wArrow, stage === 2); show(wName, stage === 2);
    show(offName, stage === 2); show(onName, stage === 2 && style.far);
    show(sheetFace, stage >= 3);
    show(axis, stage >= 3); show(axisTick, stage >= 3); show(axisName, stage >= 3);
    show(tickName, stage >= 3 && style.tick);
    stems.forEach(node => show(node, stage >= 3));
    feet.forEach(node => show(node, stage >= 3));
    values.forEach(node => show(node, true));
    show(ghostDot, stage >= 4); show(ghostStem, stage >= 4); show(ghostValue, stage >= 4);
    show(cutFace, stage >= 5);
    show(risenChord, stage >= 6); show(shadowRisen, stage >= 6); show(shadowFlat, stage >= 6);
    droppers.forEach(node => show(node, stage >= 6));
    zoneFaces.forEach(node => show(node, stage >= 7));
    // The score is withheld while nothing is being scored: the neuron's own threshold is
    // not a classifier, and a number not in play is absent rather than stale.
    show(scoreValue, stage <= 1 || stage >= 5);
    misses.forEach((node, index) => show(node, stage <= 1 && state.misses[index]));
    formula.classList.toggle('hl-neuron-shown', stage >= 2);
    formula.classList.toggle('hl-stim-lit', stage === 2 || stage === 3);
    formula.classList.toggle('hl-cut-shown', stage >= 5);
    formula.classList.toggle('hl-cut-lit', stage === 5 || stage === 7);
    write(caption, CAPTIONS[stage]);
  }

  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const clamped = Math.max(0, Math.min(duration, Number.isFinite(time) ? time : 0));
    const stage = stageAt(clamped);
    const next = beats[stage + 1] === undefined ? duration : beats[stage + 1];
    const span = next - beats[stage];
    // Reduced motion rests on each beat's finished picture, which is the picture its
    // caption describes; every continuous quantity is read from that one fraction.
    const raw = span > 0 ? Math.max(0, Math.min(1, (clamped - beats[stage]) / span)) : 1;
    const fraction = reducedMotion ? 1 : raw;
    const eased = smoother(fraction);
    const [angle, offset] = lineAt(stage, fraction);
    const lift = stage < 3 ? 0 : stage > 3 ? 1 : eased;
    const ghost = stage < 4 ? 0 : stage > 4 ? 1 : eased;
    const tilt = stage < 5 ? 0 : stage > 5 ? 1 : eased;
    const drop = stage < 6 ? 0 : stage > 6 ? 1 : eased;
    const score = stage >= 5 ? cutScore(planeAt(tilt)) : lineScore(angle, offset);
    const state = {stage, angle, offset, lift, ghost, tilt, drop, score,
      grow: stage < 2 ? 0 : stage > 2 ? 1 : eased, misses: lineMisses(angle, offset)};

    const key = `${stage}/${fraction.toFixed(6)}/${scale.toFixed(4)}/${narrow}`;
    if (key !== shown.key) {
      draw(state);
      if (stage !== shown.stage || score !== shown.score || narrow !== shown.narrow
        || String(state.misses) !== shown.missKey) reveal(state);
      Object.assign(root.dataset, {lift: String(lift), tilt: String(tilt), drop: String(drop),
        ghost: String(ghost), lineAngle: String(angle), lineOffset: String(offset),
        correct: String(score)});
      shown = {key, stage, score, narrow, missKey: String(state.misses)};
    }
    return `${STAGES[stage]}. ${stage >= 2 && stage <= 4
      ? `Activations ${corners.map(corner => decimals(lift * corner.h)).join(', ')}.`
      : `${score} of 4 corners on the right side.`}`;
  }

  function typeset() {
    const done = () => { root.dataset.typeset = root.querySelector('mjx-container') ? 'mathjax' : 'none'; };
    const mathjax = window.MathJax;
    if (mathjax && typeof mathjax.typesetPromise === 'function' && !root.querySelector('mjx-container'))
      mathjax.typesetPromise([root]).then(done, done);
    else done();
  }

  Object.assign(root.dataset, {
    heights: JSON.stringify(corners.map(corner => corner.h)),
    cut: JSON.stringify(CUT), margin: String(margin), budget: String(budget),
    crease: JSON.stringify([creaseAngle, creaseOffset])
  });
  layout();
  window.BookPlayback(root, render, () => { layout(); shown = {}; render(lastTime, reduced); });
  typeset();
})();
