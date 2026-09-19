(() => {
  const root = document.getElementById('sigmoid-squash-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  // The panel is the one in-repo mirror of the fixture. Chapter 2 owns the sigmoid, its
  // midpoint and the score range (02-logistic-softmax.qmd:34-79) but prints no input-space
  // coordinates at all, so the plane, the clusters, the weights and the bias are declared
  // schematic geometry; every score and probability below is computed from them.
  const number = name => Number(root.dataset[name]);
  const list = name => root.dataset[name].trim().split(/\s+/).map(Number);
  const fixture = {
    weights: list('weights'), bias: number('bias'), cross: list('cross'),
    domain: list('domain'), range: list('scoreRange'), samples: number('samples'),
    journey: list('journey'), step: number('step'), pushes: number('pushes'),
    class0: list('class0'), class1: list('class1'), labels: list('classLabels')
  };
  const score = point => fixture.weights[0] * point[0] + fixture.weights[1] * point[1] + fixture.bias;
  const couples = flat => {
    const out = [];
    for (let i = 0; i + 1 < flat.length; i += 2) out.push([flat[i], flat[i + 1]]);
    return out;
  };
  (({weights, bias, cross, domain, range, samples, journey, step, pushes, class0, class1, labels}) => {
    const all = [...weights, bias, ...cross, ...domain, ...range, samples, ...journey,
      step, pushes, ...class0, ...class1, ...labels];
    if (!all.every(Number.isFinite))
      throw Error('sigmoid-squash: every declared quantity must be a finite number');
    if (weights.length !== 2 || cross.length !== 2)
      throw Error('sigmoid-squash: the weight vector and the crossing point are two-dimensional');
    if (!(weights[0] ** 2 + weights[1] ** 2 > 0))
      throw Error('sigmoid-squash: the weight vector must not be zero');
    // The whole scene rests on one exact statement, so it is checked before anything is drawn.
    if (score(cross) !== 0)
      throw Error('sigmoid-squash: the declared crossing point must score exactly zero');
    if (domain.length !== 4 || !(domain[0] < domain[1]) || !(domain[2] < domain[3]))
      throw Error('sigmoid-squash: the input plane needs an increasing domain in both coordinates');
    if (range.length !== 2 || !(range[0] < 0 && range[1] > 0))
      throw Error('sigmoid-squash: the score axis must straddle zero');
    if (!(samples >= 2)) throw Error('sigmoid-squash: the curve needs at least two samples');
    if (journey.length !== 3 || !(journey[0] < journey[1] && journey[1] < journey[2]) || journey[2] !== 0)
      throw Error('sigmoid-squash: the journey must rise from the class-0 side to exactly zero');
    if (!(step > 0) || !(pushes >= 2))
      throw Error('sigmoid-squash: at least two equal positive pushes are required');
    if (class0.length < 6 || class0.length % 2 || class1.length < 6 || class1.length % 2)
      throw Error('sigmoid-squash: each class needs at least three two-dimensional points');
    // A cluster on the wrong side of its own boundary would teach the opposite of the scene.
    if (!couples(class0).every(point => score(point) < 0))
      throw Error('sigmoid-squash: every class-0 point must score below zero');
    if (!couples(class1).every(point => score(point) > 0))
      throw Error('sigmoid-squash: every class-1 point must score above zero');
    const inside = ([x, y]) => x >= domain[0] && x <= domain[1] && y >= domain[2] && y <= domain[3];
    if (![...couples(class0), ...couples(class1)].every(inside))
      throw Error('sigmoid-squash: every declared point must lie inside the plane');
    // A cluster's name belongs on that cluster's own side of the boundary.
    if (labels.length !== 4 || !couples(labels).every(inside))
      throw Error('sigmoid-squash: two cluster names are placed inside the plane');
    if (!(score(couples(labels)[0]) < 0) || !(score(couples(labels)[1]) > 0))
      throw Error('sigmoid-squash: each cluster name must sit on its own side of the boundary');
    const n2 = weights[0] ** 2 + weights[1] ** 2;
    const at = o => [cross[0] + o * weights[0] / n2, cross[1] + o * weights[1] / n2];
    if (![range[0], range[1], journey[0], journey[2] + step * pushes].every(o => inside(at(o))))
      throw Error('sigmoid-squash: the whole score range must travel inside the plane');
  })(fixture);

  const NORM2 = fixture.weights[0] ** 2 + fixture.weights[1] ** 2;
  const NORM = Math.sqrt(NORM2);
  // The example's place is derived from its score, so the two can never disagree: moving
  // along w by o/||w||^2 changes w.x + b by exactly o, and at o = 0 the place is the
  // declared crossing point, which lies exactly on the boundary.
  const placeOf = o => [fixture.cross[0] + o * fixture.weights[0] / NORM2,
    fixture.cross[1] + o * fixture.weights[1] / NORM2];
  // Math.exp(-0) is exactly 1, so sigma(0) is exactly 0.5: the payoff is an identity here,
  // not an approximation, and the suite asserts it with ===.
  const sigmoid = o => 1 / (1 + Math.exp(-o));

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const slider = $('[data-score-slider]'), readout = $('[data-score-readout]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration);
  const stageAt = time => beats.reduce((stage, beat, index) => time >= beat ? index : stage, 0);
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const ease = value => (1 - Math.cos(Math.PI * clamp(value, 0, 1))) / 2;
  // A glide finishes at the beat it leads into, exactly: ease(1) is 1, so the frame an
  // arrow-key seek parks on is the finished picture its caption describes.
  const glide = (time, from, to, a, b) => {
    const u = ease((time - from) / (to - from));
    return u === 0 ? a : u === 1 ? b : a + u * (b - a);
  };
  const [START, HOLD, CROSS] = fixture.journey;
  const PUSH = Array.from({length: fixture.pushes + 1}, (_, k) => CROSS + k * fixture.step);
  // The last beat carries two pushes, so the four marks on the probability axis are all
  // earned inside forty seconds; every other push owns a whole beat.
  const MID = (beats[7] + duration) / 2;
  const PUSH_AT = [beats[5], beats[6], beats[7], MID, duration];
  const scoreAt = time =>
    time < beats[1] ? START
      : time < beats[2] ? glide(time, beats[1], beats[2], START, HOLD)
        : time < beats[3] ? HOLD
          : time < beats[4] ? glide(time, beats[3], beats[4], HOLD, CROSS)
            : time < beats[5] ? CROSS
              : time < beats[6] ? glide(time, beats[5], beats[6], PUSH[0], PUSH[1])
                : time < beats[7] ? glide(time, beats[6], beats[7], PUSH[1], PUSH[2])
                  : time < MID ? glide(time, beats[7], MID, PUSH[2], PUSH[3])
                    : glide(time, MID, duration, PUSH[3], PUSH[4]);
  // Reduced motion draws one still per beat, and a glide beat rests on its finished state,
  // so every still is the picture its own caption is about.
  const REST = [beats[0], beats[2], beats[2], beats[4], beats[4], beats[6], beats[7], duration];

  const names = ['Three views', 'Approach', 'Predict', 'Crossing', 'On the line',
    'One push', 'The same push', 'Two more pushes'];
  const captions = [
    'One example, seen three times: where it sits, its score, its probability.',
    'It moves straight toward the line. Score and probability travel with it.',
    'One step from the line. What score there, and what probability?',
    'Released. It slides the last step and comes to rest on the boundary.',
    'On the line the score is exactly 0 and the probability exactly one half.',
    'Equal pushes now. Each adds exactly 1 to the score. Watch the probability.',
    'The same push, further out. The probability gains noticeably less this time.',
    'Two more equal pushes. The last buys 0.0294 — about an eighth of the first.'
  ];
  const dragging = 'You are moving the score. Near the line it swings; far out it barely moves.';
  const pictures = {
    hidden: 'A straight decision boundary separates two labelled clusters on a small plane. '
      + 'One tracked example moves toward the line while its score and its probability move with it.',
    shown: 'A straight decision boundary separates two labelled clusters on a small plane. '
      + 'The tracked example crossed the line where its score is zero and its probability one half, '
      + 'and four equal pushes beyond it leave marks that crowd together on the probability axis.'
  };

  // --- the picture, built once ----------------------------------------------------
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const drawing = svg.querySelector('[data-drawing]');
  drawing.replaceChildren();
  const NS = 'http://www.w3.org/2000/svg';
  // Drawing coordinates are serialised at 0.0001 px, so a last-bit difference between math
  // libraries cannot change the byte-compared static print. The state is never rounded.
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
  const swap = (node, cls, on) => { if (node.classList.contains(cls) !== on) node.classList.toggle(cls, on); };
  // Plain-text numbers use a true minus, never a hyphen. A score of exactly zero carries no
  // sign: it is the payoff reading, not a small positive or negative one.
  const plain = (value, digits = 2) => value.toFixed(digits).replace('-', '−');
  const signed = (value, digits = 2) => {
    const size = Math.abs(value).toFixed(digits);
    return Number(size) === 0 ? size : `${value < 0 ? '−' : '+'}${size}`;
  };

  const marks = {
    planeFrame: make('rect', {class: 'sq-frame', 'data-plane-frame': '', fill: 'none'}),
    travel: make('line', {class: 'sq-travel', 'data-travel': ''}),
    boundary: make('line', {class: 'sq-boundary', 'data-boundary': ''}),
    planeTitle: label('sq-muted', 12, {'data-name': 'plane', 'text-anchor': 'start'}, 'input space'),
    zeroName: label('sq-boundary-fill', 12, {'data-name': 'boundary', 'text-anchor': 'end'}, 'decision boundary'),
    zeroValue: label('sq-boundary-fill sq-number', 12, {'data-name': 'boundary-score', 'text-anchor': 'end'}),
    class0Name: label('sq-target-fill sq-number', 12, {'data-name': 'class0'}, 'y = 0'),
    class1Name: label('sq-target-fill sq-number', 12, {'data-name': 'class1'}, 'y = 1'),
    curve: make('path', {class: 'sq-curve', 'data-curve': '', fill: 'none'}),
    scoreAxis: make('line', {class: 'sq-axis', 'data-score-axis': ''}),
    probAxis: make('line', {class: 'sq-axis', 'data-prob-axis': ''}),
    probTitle: label('sq-muted', 12, {'data-name': 'probability', 'text-anchor': 'start'}, 'probability'),
    scoreTitle: label('sq-muted', 12, {'data-name': 'score', 'text-anchor': 'end'}, 'score'),
    zeroRule: make('line', {class: 'sq-rule', 'data-zero-rule': ''}),
    halfRule: make('line', {class: 'sq-rule', 'data-half-rule': ''}),
    halfName: label('sq-boundary-fill sq-number', 12, {'data-name': 'half', 'text-anchor': 'end'}),
    crossRing: make('circle', {class: 'sq-cross-ring', r: 6, 'data-cross-ring': '', fill: 'none'}),
    riseGuide: make('line', {class: 'sq-rise', 'data-rise': ''}),
    readGuide: make('line', {class: 'sq-read', 'data-read': ''}),
    foot: make('circle', {class: 'sq-foot', r: 4.5, 'data-foot': '', fill: 'none'}),
    reach: make('line', {class: 'sq-reach', 'data-reach': ''}),
    example: make('circle', {class: 'sq-example', r: 6.5, 'data-example': ''}),
    exampleName: label('sq-input-fill sq-symbol', 15, {'data-name': 'example', 'text-anchor': 'start'}, 'x'),
    scoreMark: make('circle', {class: 'sq-score-dot', r: 4.5, 'data-score-dot': ''}),
    scoreValue: label('sq-input-fill sq-number', 13, {'data-value': 'score'}),
    curveDot: make('circle', {class: 'sq-prob-dot', r: 5.5, 'data-curve-dot': ''}),
    probMark: make('path', {class: 'sq-prob-marker', 'data-prob-marker': '', fill: 'none'}),
    probValue: label('sq-prob-fill sq-number', 13, {'data-value': 'probability', 'text-anchor': 'start'})
  };
  // The score axis is the chapter's own sweep, so only its ends and its midpoint are named;
  // the equal pushes add their own unlabelled ticks as they are earned.
  const scaleTicks = [fixture.range[0], 0, fixture.range[1]].map(value => ({value,
    line: make('line', {class: 'sq-tick', 'data-score-tick': value}),
    text: label('sq-muted sq-number', 12, {'data-tick-label': value}, plain(value, 0))}));
  const probTicks = [0, 1].map(value => ({value,
    line: make('line', {class: 'sq-tick', 'data-prob-tick': value}),
    text: label('sq-muted sq-number', 12, {'data-prob-label': value, 'text-anchor': 'end'}, String(value))}));
  const points = [...couples(fixture.class0).map(point => ({point, klass: 0})),
    ...couples(fixture.class1).map(point => ({point, klass: 1}))]
    .map(({point, klass}, index) => ({point, klass, node: klass
      ? make('circle', {class: 'sq-point sq-point-one', r: 4.5, 'data-point': index})
      : make('rect', {class: 'sq-point sq-point-zero', width: 8, height: 8, 'data-point': index})}));
  // One rung per push: a tick on the probability axis, the bar that measures what the push
  // bought, and that bar's own number on a leader, so a five-pixel gap still has a label.
  const rungs = PUSH.map((value, index) => ({value,
    tick: make('line', {class: 'sq-rung', 'data-rung': index}),
    step: make('line', {class: 'sq-step', 'data-step-tick': index})}));
  const gaps = PUSH.slice(1).map((value, index) => ({
    from: PUSH[index], to: value,
    bar: make('path', {class: 'sq-gap', 'data-gap': index, fill: 'none'}),
    lead: make('line', {class: 'sq-lead', 'data-gap-lead': index}),
    text: label('sq-prob-fill sq-number', 12, {'data-value': `gap${index}`, 'text-anchor': 'start'},
      `+${(sigmoid(value) - sigmoid(PUSH[index])).toFixed(4)}`)
  }));
  $('[data-score-display]').setAttribute('aria-hidden', 'true');
  slider.min = String(fixture.range[0]);
  slider.max = String(fixture.range[1]);

  const LAYOUT = {
    wide: {width: 713, height: 296,
      plane: {left: 40, top: 34, unit: 45},
      plot: {left: 398, top: 40, width: 280, height: 210},
      titles: {plane: [40, 20], prob: [398, 20], score: [678, 20]},
      ladder: {from: 390, to: 398, bar: 403, serif: 3, text: 410, scale: 384},
      rows: {value: 266, scale: 284}, edge: [310, 266, 281], lift: 38},
    narrow: {width: 296, height: 538,
      plane: {left: 28, top: 32, unit: 40},
      plot: {left: 58, top: 310, width: 216, height: 180},
      titles: {plane: [28, 20], prob: [58, 288], score: [274, 288]},
      ladder: {from: 50, to: 58, bar: 63, serif: 3, text: 70, scale: 44},
      rows: {value: 508, scale: 526}, edge: [268, 240, 256], lift: 308}
  };
  let g = LAYOUT.wide, mode = 'wide', lastTime = 0, reduced = false, override = null, drawn = '';
  let toX = x => x, toY = y => y, ox = o => o, oy = p => p;
  let along = [1, 0], aside = [0, 1];

  // A label is kept inside the picture by construction: its own estimated box is nudged back
  // from an edge rather than re-anchored, so a label never jumps across its mark. JSDOM lays
  // out no text, so the extent is estimated from the label's own content at about 0.55 em per
  // character — measured off the browser preview at both widths.
  const extent = node => node.textContent.length * Number(node.getAttribute('font-size')) * .55 + 3;
  const put = (node, x, y, anchor = 'middle') => {
    const w = extent(node);
    const left = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
    const shift = left < 6 ? 6 - left : left + w > g.width - 6 ? g.width - 6 - w - left : 0;
    attrs(node, {x: x + shift, y, 'text-anchor': anchor});
  };
  // Clip the boundary to the plane's own rectangle, so a different declared weight vector
  // still produces a segment that starts and ends on the frame rather than in mid-air.
  function boundarySegment() {
    const [x0, x1, y0, y1] = fixture.domain, [a, b] = fixture.weights, c = fixture.bias;
    const hits = [];
    if (b !== 0) for (const x of [x0, x1]) {
      const y = -(a * x + c) / b;
      if (y >= y0 - 1e-9 && y <= y1 + 1e-9) hits.push([x, y]);
    }
    if (a !== 0) for (const y of [y0, y1]) {
      const x = -(b * y + c) / a;
      if (x > x0 + 1e-9 && x < x1 - 1e-9) hits.push([x, y]);
    }
    return hits.slice(0, 2);
  }

  function measure() {
    const width = Math.max(200, Math.round(figure.getBoundingClientRect().width || LAYOUT.wide.width));
    mode = width < 520 ? 'narrow' : 'wide';
    g = LAYOUT[mode];
    const [dx0, dx1, dy0, dy1] = fixture.domain, unit = g.plane.unit;
    const planeW = (dx1 - dx0) * unit, planeH = (dy1 - dy0) * unit;
    toX = x => g.plane.left + (x - dx0) * unit;
    toY = y => g.plane.top + (dy1 - y) * unit;
    const [r0, r1] = fixture.range, span = g.plot.width / (r1 - r0);
    ox = o => g.plot.left + (o - r0) * span;
    oy = p => g.plot.top + g.plot.height * (1 - p);
    // The travel direction, in drawing units, and the direction across it: the step ticks
    // and the example's name are placed from these, so they follow any declared weights.
    const zero = placeOf(0), one = placeOf(1);
    const dx = toX(one[0]) - toX(zero[0]), dy = toY(one[1]) - toY(zero[1]);
    const reach = Math.hypot(dx, dy) || 1;
    along = [dx / reach, dy / reach];
    aside = [-along[1], along[0]];
    root.dataset.layout = mode;
    root.dataset.plane = JSON.stringify({left: g.plane.left, top: g.plane.top, unit,
      width: planeW, height: planeH});
    root.dataset.plot = JSON.stringify({left: g.plot.left, top: g.plot.top,
      width: g.plot.width, height: g.plot.height});
    svg.setAttribute('viewBox', `0 0 ${g.width} ${g.height}`);
  }

  // Everything that stays put for the whole timeline is placed once per layout, never per
  // frame: the frame, the boundary, ten fixed points, both axes and the 300-sample curve.
  function scenery() {
    const [dx0, dx1, dy0, dy1] = fixture.domain;
    attrs(marks.planeFrame, {x: toX(dx0), y: toY(dy1), width: (dx1 - dx0) * g.plane.unit,
      height: (dy1 - dy0) * g.plane.unit});
    const [from, to] = boundarySegment();
    attrs(marks.boundary, {x1: toX(from[0]), y1: toY(from[1]), x2: toX(to[0]), y2: toY(to[1])});
    const tail = placeOf(fixture.range[0]), head = placeOf(fixture.range[1]);
    attrs(marks.travel, {x1: toX(tail[0]), y1: toY(tail[1]), x2: toX(head[0]), y2: toY(head[1])});
    for (const {point, node, klass} of points)
      attrs(node, klass ? {cx: toX(point[0]), cy: toY(point[1])}
        : {x: toX(point[0]) - 4, y: toY(point[1]) - 4});
    put(marks.planeTitle, g.titles.plane[0], g.titles.plane[1], 'start');
    put(marks.probTitle, g.titles.prob[0], g.titles.prob[1], 'start');
    put(marks.scoreTitle, g.titles.score[0], g.titles.score[1], 'end');
    // The cluster names sit in the corner each cluster leaves free, on its own side of the
    // line: the reader should read them as the label y, not as two more examples.
    const [zero, one] = couples(list('classLabels'));
    put(marks.class0Name, toX(zero[0]), toY(zero[1]));
    put(marks.class1Name, toX(one[0]), toY(one[1]));
    put(marks.zeroName, g.edge[0], g.edge[1], 'end');
    put(marks.zeroValue, g.edge[0], g.edge[2], 'end');
    const [r0, r1] = fixture.range;
    attrs(marks.scoreAxis, {x1: ox(r0), y1: oy(0), x2: ox(r1), y2: oy(0)});
    attrs(marks.probAxis, {x1: g.plot.left, y1: oy(0), x2: g.plot.left, y2: oy(1)});
    const gap = (r1 - r0) / (fixture.samples - 1);
    let path = '';
    for (let i = 0; i < fixture.samples; i++) {
      const o = r0 + i * gap;
      path += `${i ? ' L' : 'M'} ${px(ox(o))} ${px(oy(sigmoid(o)))}`;
    }
    marks.curve.setAttribute('d', path);
    for (const tick of scaleTicks) {
      attrs(tick.line, {x1: ox(tick.value), x2: ox(tick.value), y1: oy(0) - 4, y2: oy(0) + 5});
      put(tick.text, ox(tick.value), g.rows.scale);
    }
    for (const tick of probTicks) {
      attrs(tick.line, {x1: g.ladder.from, x2: g.ladder.to, y1: oy(tick.value), y2: oy(tick.value)});
      put(tick.text, g.ladder.scale, oy(tick.value) + 4, 'end');
    }
    // Every rung's geometry is fixed; only whether it has been earned changes with time. The
    // gaps shrink towards the top of the axis — which is the whole payoff — so the last two
    // brackets are only a few pixels tall: each label is pushed up off the one below it and
    // keeps a leader back to the bracket it measures.
    let floor = Infinity;
    for (let i = 0; i < gaps.length; i++) {
      const gapRow = gaps[i], top = oy(sigmoid(gapRow.to)), bottom = oy(sigmoid(gapRow.from));
      const x = g.ladder.bar, s = g.ladder.serif;
      gapRow.bar.setAttribute('d', `M ${px(x - s)} ${px(top)} L ${px(x + s)} ${px(top)}`
        + ` M ${px(x)} ${px(top)} L ${px(x)} ${px(bottom)}`
        + ` M ${px(x - s)} ${px(bottom)} L ${px(x + s)} ${px(bottom)}`);
      const wanted = (top + bottom) / 2, y = Math.min(wanted, floor - 17);
      floor = y;
      put(gapRow.text, g.ladder.text, y + 4, 'start');
      attrs(gapRow.lead, {x1: g.ladder.text - 4, y1: y, x2: x + s, y2: (top + bottom) / 2});
    }
    for (const rung of rungs) {
      attrs(rung.tick, {x1: g.ladder.from + 2, x2: g.ladder.to, y1: oy(sigmoid(rung.value)), y2: oy(sigmoid(rung.value))});
      const place = placeOf(rung.value);
      attrs(rung.step, {x1: toX(place[0]) + aside[0] * 5.5, y1: toY(place[1]) + aside[1] * 5.5,
        x2: toX(place[0]) - aside[0] * 5.5, y2: toY(place[1]) - aside[1] * 5.5});
    }
    attrs(marks.zeroRule, {x1: ox(0), y1: oy(0), x2: ox(0), y2: oy(0.5)});
    attrs(marks.halfRule, {x1: g.plot.left, y1: oy(0.5), x2: ox(0), y2: oy(0.5)});
    attrs(marks.crossRing, {cx: ox(0), cy: oy(0.5)});
    put(marks.halfName, g.ladder.scale, oy(0.5) + 4, 'end');
  }

  function draw(state) {
    const {o, p, revealed, earned} = state;
    const place = placeOf(o), foot = fixture.cross;
    write(marks.scoreValue, signed(o));
    write(marks.probValue, p.toFixed(4));
    write(marks.zeroValue, revealed ? 'o = 0' : '');
    write(marks.halfName, revealed ? '½' : '');
    attrs(marks.example, {cx: toX(place[0]), cy: toY(place[1])});
    attrs(marks.foot, {cx: toX(foot[0]), cy: toY(foot[1])});
    attrs(marks.reach, {x1: toX(foot[0]), y1: toY(foot[1]), x2: toX(place[0]), y2: toY(place[1])});
    // The example's name rides beside it, off the line it travels along, so it never lands
    // on the foot ring at the crossing or on the reach behind it.
    put(marks.exampleName, toX(place[0]) + aside[0] * 16, toY(place[1]) + aside[1] * 16 + 4, 'start');
    attrs(marks.scoreMark, {cx: ox(o), cy: oy(0)});
    put(marks.scoreValue, ox(o), g.rows.value);
    attrs(marks.riseGuide, {x1: ox(o), y1: oy(0), x2: ox(o), y2: oy(p)});
    attrs(marks.readGuide, {x1: ox(o), y1: oy(p), x2: g.plot.left, y2: oy(p)});
    attrs(marks.curveDot, {cx: ox(o), cy: oy(p)});
    // A caret on the probability axis, so the reading survives without colour.
    const y = oy(p), edge = g.plot.left;
    marks.probMark.setAttribute('d', `M ${px(edge - 7)} ${px(y - 6)} L ${px(edge)} ${px(y)}`
      + ` L ${px(edge - 7)} ${px(y + 6)}`);
    // The number leaves the curve on the side the curve is not climbing into, and never
    // rises above the picture's own title row.
    const rising = o >= 0;
    put(marks.probValue, ox(o) + (rising ? 11 : -11), Math.max(g.lift, oy(p) - 9), rising ? 'start' : 'end');
    for (const node of [marks.zeroRule, marks.halfRule, marks.crossRing]) show(node, revealed);
    swap(scaleTicks[1].text, 'sq-boundary-fill', revealed);
    swap(scaleTicks[1].text, 'sq-muted', !revealed);
    for (const [index, rung] of rungs.entries()) {
      show(rung.tick, earned > index); show(rung.step, earned > index);
    }
    for (const [index, gapRow] of gaps.entries()) {
      const seen = earned > index + 1;
      show(gapRow.bar, seen); show(gapRow.lead, seen); show(gapRow.text, seen);
    }
    const description = revealed ? pictures.shown : pictures.hidden;
    if (svg.getAttribute('aria-label') !== description) svg.setAttribute('aria-label', description);
    formula.classList.toggle('sq-identity-shown', revealed);
    formula.classList.toggle('sq-saturated', Math.abs(o) >= 2);
    formula.classList.toggle('sq-crossing', revealed && o === 0);
  }

  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const clamped = clamp(Number.isFinite(time) ? time : 0, 0, duration);
    const stage = stageAt(clamped), held = reducedMotion ? REST[stage] : clamped;
    const dragged = override !== null;
    const o = dragged ? override : scoreAt(held);
    const p = sigmoid(o), revealed = stage >= 4;
    // Each rung is earned by the timeline reaching the push it records, never by a drag.
    const earned = PUSH_AT.filter(moment => held >= moment).length;
    const place = placeOf(o);
    const state = {stage, o, p, revealed, earned, dragged,
      crossing: o === 0, recovered: score(place)};
    Object.assign(root.dataset, {stage: String(stage), score: String(o), probability: String(p),
      place: JSON.stringify(place), recovered: String(state.recovered),
      revealed: String(revealed), crossing: String(state.crossing), earned: String(earned),
      override: dragged ? 'slider' : ''});
    const key = `${stage}|${o}|${revealed}|${earned}|${mode}`;
    if (key !== drawn) { drawn = key; draw(state); }
    // Restore the requested value as well as the picture: pausing during a drag may have
    // repainted the slider from the timeline.
    slider.value = String(o);
    write(readout, signed(o));
    slider.setAttribute('aria-valuetext', `Score ${signed(o)}, probability ${p.toFixed(4)}. `
      + 'Near the boundary the probability swings; far from it the same step buys almost nothing.');
    const sentence = dragged ? dragging : captions[stage];
    if (caption.textContent !== sentence) caption.textContent = sentence;
    return `${names[stage]}. Score ${signed(o)}, probability ${p.toFixed(4)}.`;
  }

  function drag() {
    const requested = clamp(Number(slider.value), Number(slider.min), Number(slider.max));
    if (root.dataset.playing === 'true') $('[data-action="play"]').click();
    override = requested;
    render(lastTime, reduced);
  }
  slider.addEventListener('input', drag);
  slider.addEventListener('change', drag);
  pane.addEventListener('click', event => {
    if (event.target.closest('[data-action="play"]') && root.dataset.playing !== 'true') override = null;
  }, true);
  // The detour ends only when the transport really acts, matching shared/playback.js's own
  // guard: a key it ignores must leave the dragged score alone.
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

  measure(); scenery();
  window.BookPlayback(root, render, () => { measure(); scenery(); drawn = ''; render(lastTime, reduced); });
  typeset();
})();
