// The shortcut adds a lane; it does not guarantee a gradient.
//
// Contract with interactives/shared/playback.js:
//   window.BookPlayback(root, render, layout?)
//   render(time, reduced) -> the scrubber's description; a pure function of
//     (time, reduced) and the dial that never measures the DOM.
//   layout() -> the only place that measures.
//
// One picture: the chapter's residual block laid left to right, x, the learned branch F,
// the sum and H(x), with the identity lane arcing from x over F to the sum. The tracked
// object is the gradient, a wine arrow whose length is its value on one shared scale and
// whose direction is its sign: a positive packet points along its route toward x, a
// negative one points back toward the output. It arrives at H(x) as 1 and splits at the sum
// into two copies (the same gradient seen twice). One rides the lane back unchanged; the
// other crosses F, where it is multiplied by the branch's local slope: it shrinks, vanishes
// at 0, and flips when the slope is negative. Under x the copies are laid head to tail on a
// short scale, so what reaches x is the length they leave: 1.5, 1, 0.1. Two stills show a
// long arrow and a stub and lose the reason, the flip inside F against the lane's unchanged
// 1. The dial is the one control: the learned branch's slope, whose effect is the claim.
(() => {
  const root = document.getElementById('identity-lane-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  const numbersOf = name => root.dataset[name].trim().split(/\s+/).map(Number);
  // The panel is the one in-repo mirror of the fixture: the gradient arriving at H(x), the
  // learned branch's local slope at the timeline's three stops (reinforced, doing nothing,
  // mostly cancelled) and the dial's range. The chapter
  // (chapters/part2/09-modern-cnns-transfer.qmd, the residual equation's gradient line)
  // prints no Jacobian, so these are a declared toy in one dimension, where the identity I
  // is 1 and the Jacobian dF/dx is one number.
  const IN = Number(root.dataset.incoming);
  const [S0, S1, S2] = numbersOf('slopes');
  const [LOW, HIGH] = numbersOf('range');
  const reach = slope => IN * (1 + slope);

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = svg.querySelector('[data-drawing]');
  // The narrow print exists for a reader without script; once the player owns the picture
  // it draws its own narrow layout, so the second print is removed.
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const slider = $('[data-slope-slider]'), readout = $('[data-slope-readout]');
  const STEP = Number(slider.step);
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration || beats.at(-1));
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);

  // Plain-text numbers obey the book's typography: a true minus, never a hyphen, and the
  // shortest decimal on the picture; the dial's readout keeps two places so it never jitters.
  const MINUS = '−';
  const fmt = value => {
    const text = String(Number(Math.abs(value).toFixed(2)));
    return (value < 0 && text !== '0' ? MINUS : '') + text;
  };
  const two = value => (value < 0 && Math.abs(value) >= 0.005 ? MINUS : '') + Math.abs(value).toFixed(2);
  const num = value => String(Number(value.toFixed(4)));
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const ease = v => v * v * (3 - 2 * v);
  const seg = (f, a, b) => clamp01((f - a) / (b - a));
  const lerp = (a, b, u) => a + (b - a) * u;
  // A monotone cubic through (ts, ps) that starts and ends at rest: a smooth speed profile
  // for the copy through F, which slows while the branch rescales it (Fritsch and Butland's
  // harmonic-mean slopes keep it monotone, so the copy never backs up).
  function profile(ts, ps) {
    const n = ts.length, d = [], m = [0];
    for (let k = 0; k + 1 < n; k++) d.push((ps[k + 1] - ps[k]) / (ts[k + 1] - ts[k]));
    for (let k = 1; k + 1 < n; k++) m.push(d[k - 1] * d[k] > 0 ? 2 / (1 / d[k - 1] + 1 / d[k]) : 0);
    m.push(0);
    return t => {
      let k = 0;
      while (k < n - 2 && t > ts[k + 1]) k++;
      const h = ts[k + 1] - ts[k], s = clamp01((t - ts[k]) / h);
      return (2 * s ** 3 - 3 * s ** 2 + 1) * ps[k] + (s ** 3 - 2 * s ** 2 + s) * h * m[k]
        + (3 * s ** 2 - 2 * s ** 3) * ps[k + 1] + (s ** 3 - s ** 2) * h * m[k + 1];
    };
  }
  // The share of the journey the copy through F spends reaching F, crossing it, and after.
  const CROSSING = [0, 0.28, 0.74, 1];
  // The timeline moves the slope in the dial's own steps, so the thumb, the readout and the
  // picture always agree on a value the reader could set.
  const quant = value => Number((Math.round(value / STEP) * STEP).toFixed(4));
  const clampSlope = value => Math.max(LOW, Math.min(HIGH, value));

  const STAGES = ['The block', 'A gradient arrives', `Slope ${fmt(S0)}`, `Slope ${fmt(S1)}`,
    'Predict', `Slope ${fmt(S2)}`, 'Every slope', 'A route, not a guarantee'];
  // A beat with two captions says the value only once the copies have arrived.
  const CAPTIONS = [
    'One residual block: the learned branch F and the identity lane meet at the sum.',
    `A gradient of ${fmt(IN)} arrives at the output and splits at the sum into both routes.`,
    [`Through F the copy scales by the slope, ${fmt(S0)}; the lane keeps ${fmt(IN)}.`,
      `At x the two copies add, head to tail: ${fmt(reach(S0))}.`],
    `Slope ${fmt(S1)}, F doing nothing: x receives exactly the ${fmt(IN)} the lane carries.`,
    `Now the learned slope is ${fmt(S2)}. How much of the ${fmt(IN)} reaches x?`,
    [`Through F the copy flips: ${fmt(IN * S2)}.`,
      `Added to the lane's ${fmt(IN)}, only ${fmt(reach(S2))} reaches x: mostly cancelled.`],
    `Every slope adds to the lane's ${fmt(IN)}: from ${fmt(reach(S0))} at slope ${fmt(S0)} down to ${fmt(reach(LOW))} at ${fmt(LOW)}.`,
    'The shortcut guarantees a route, not a gradient: the learned branch can still cancel it.'
  ];

  // Geometry: the one place a quantity becomes a coordinate. Nothing here is measured.
  // u is the shared scale: one unit of gradient is u drawing units long, on every route and
  // on the scale under x, whose origin sits under x and whose unit ticks run the way a
  // positive packet travels, toward x and past it.
  const MODES = {
    wide: {viewBox: [713, 256], font: 13, small: 12, symbol: 16, letter: 17, u: 60, y: 128,
      x: 150, node: 5, box: [262, 96, 150, 64], sum: [500, 13], out: 590, down: 704, up: 106,
      lift: 42, rows: [196, 216, 238], labelDx: 12, offset: 12, head: [10, 6], ring: 4.2,
      laneLabel: 50, branchLabel: 178, letterY: 117, slopeY: 152, xLabel: [-9, 118], hLabel: [0, 114],
      pulse: 4.5, flow: [7, 4]},
    narrow: {viewBox: [296, 234], font: 12, small: 11, symbol: 14, letter: 15, u: 30, y: 118,
      x: 76, node: 4, box: [100, 90, 78, 56], sum: [222, 9], out: 252, down: 294, up: 50,
      lift: 40, rows: [184, 202, 222], labelDx: 10, offset: 10, head: [8, 5], ring: 3.6,
      laneLabel: 46, branchLabel: 162, letterY: 110, slopeY: 139, xLabel: [-7, 108], hLabel: [0, 138],
      pulse: 4, flow: [6, 3.5]}
  };
  // Where a packet rests: its head just clear of H(x)'s node, and each copy just clear of
  // the sum at its route's entrance.
  const REST_GAP = 3, ENTRY_GAP = 3, BOX_MARGIN = 5;

  let lastTime = 0, reduced = false, previousKey = '', captionKey = '', mode = 'wide', override = null;
  function measure() { mode = (figure.getBoundingClientRect().width || 600) < 600 ? 'narrow' : 'wide'; }

  // A route is a polyline with its running arc length, walked backward from the downstream
  // end of the output line to the upstream end of the input line.
  function polyline(points) {
    const s = [0];
    for (let i = 1; i < points.length; i++) {
      s.push(s[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
    }
    return {points, s, length: s.at(-1)};
  }
  function pointAt(route, a) {
    const {points, s} = route, at = Math.max(0, Math.min(route.length, a));
    let i = 0;
    while (i < s.length - 2 && s[i + 1] < at) i++;
    const [x0, y0] = points[i], [x1, y1] = points[i + 1], span = s[i + 1] - s[i] || 1;
    const k = (at - s[i]) / span, tx = (x1 - x0) / span, ty = (y1 - y0) / span;
    return {x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k, tx, ty};
  }
  const cache = {};
  function geometry() {
    if (cache[mode]) return cache[mode];
    const m = MODES[mode], y = m.y, X = m.x, [PX, r] = m.sum;
    const Xtop = [X, y - m.node], Ptop = [PX, y - r];
    const c1 = [X, m.lift], c2 = [PX, m.lift];
    const bez = t => {
      const a = (1 - t) ** 3, b = 3 * (1 - t) ** 2 * t, c = 3 * (1 - t) * t * t, d = t ** 3;
      return [a * Xtop[0] + b * c1[0] + c * c2[0] + d * Ptop[0], a * Xtop[1] + b * c1[1] + c * c2[1] + d * Ptop[1]];
    };
    // The lane, forward from x to the sum; the backward route walks it the other way.
    const arc = Array.from({length: 97}, (_, k) => bez(k / 96));
    const shared = [[m.down, y], [m.out, y], [PX, y]];
    const lane = polyline([...shared, ...arc.slice().reverse(), [X, y], [m.up, y]]);
    const main = polyline([...shared, [X, y], [m.up, y]]);
    const sP = m.down - PX, laneEnd = lane.s[shared.length + arc.length - 1];
    const [bx, , bw] = m.box, u = m.u;
    const g = {m, lane, main, sP, laneEnd, c1, c2, Xtop, Ptop, u,
      d: `M${num(Xtop[0])} ${num(Xtop[1])}C${num(c1[0])} ${num(c1[1])} ${num(c2[0])} ${num(c2[1])} ${num(Ptop[0])} ${num(Ptop[1])}`,
      // Arc lengths shared by both routes up to the sum.
      start: IN * u / 2,
      rest: (m.down - (m.out + m.node + REST_GAP)) - IN * u / 2,
      entry: sP + r + ENTRY_GAP + IN * u / 2,
      laneArrive: laneEnd - IN * u / 2,
      mainArrive: slope => (m.down - (X + m.node + 2)) - Math.abs(IN * slope) * u / 2,
      // Inside F the copy is rescaled while it lies wholly within the box.
      scaleIn: (m.down - (bx + bw)) + IN * u / 2 + BOX_MARGIN,
      scaleOut: (m.down - bx) - IN * u / 2 - BOX_MARGIN};
    cache[mode] = g;
    return g;
  }

  // The timeline's slope: the chapter's three stops, a glide to the second, a jump to the
  // third for the question, in beat 6 a sweep up to the first stop and down to the dial's
  // floor, where it rests (so reduced motion holds a state of its own), and in beat 7 the
  // glide home to the third.
  function sweep(f) {
    if (f < 0.3) return lerp(S2, S0, ease(seg(f, 0, 0.3)));
    if (f < 0.42) return S0;
    if (f < 0.7) return lerp(S0, LOW, ease(seg(f, 0.42, 0.7)));
    return LOW;
  }

  // Everything the picture shows at one moment, as data, in fractions of the journey rather
  // than in drawing units, so the state is the same in either layout.
  //   phase: block, incoming, arrived, fork, waiting, travel, lay or rows.
  function timeline(stage, f) {
    const st = {stage, slope: S0, phase: 'block', pulse: null, fade: 1, inc: 1, fork: 0, travel: 0, lay: 0,
      lane: false, branch: false};
    if (stage === 0) {
      if (f >= 0.16 && f < 0.52) st.pulse = {q: ease(seg(f, 0.16, 0.52)), out: null};
      else if (f >= 0.52 && f < 0.68) st.pulse = {q: 1, out: ease(seg(f, 0.52, 0.68))};
    } else if (stage === 1) {
      if (f < 0.28) Object.assign(st, {phase: 'incoming', fade: seg(f, 0, 0.08), inc: ease(seg(f, 0.08, 0.28))});
      else if (f < 0.4) st.phase = 'arrived';
      else if (f < 0.68) Object.assign(st, {phase: 'fork', fork: ease(seg(f, 0.4, 0.68)), lane: true, branch: true});
      else Object.assign(st, {phase: 'waiting', lane: true, branch: true});
    } else if (stage === 2) {
      Object.assign(st, {lane: true, branch: true});
      const travel = seg(f, 0, 0.4);
      if (travel === 0) st.phase = 'waiting';
      else if (f < 0.4) Object.assign(st, {phase: 'travel', travel});
      else if (f < 0.5) Object.assign(st, {phase: 'lay', travel: 1, lay: ease(seg(f, 0.4, 0.5))});
      else Object.assign(st, {phase: 'rows', travel: 1, lay: 1});
    } else if (stage === 3) {
      Object.assign(st, {phase: 'rows', slope: quant(lerp(S0, S1, ease(seg(f, 0, 0.28)))), branch: true});
    } else if (stage === 4) {
      // The question: the slope is set at once and nothing moves. Neither the copy through F
      // nor anything at x is drawn until the scene's own reveal.
      Object.assign(st, {phase: 'arrived', slope: S2});
    } else if (stage === 5) {
      Object.assign(st, {slope: S2, lane: true, branch: true});
      const fork = ease(seg(f, 0, 0.16));
      if (fork === 0) st.phase = 'arrived';
      else if (f < 0.16) Object.assign(st, {phase: 'fork', fork});
      else if (f < 0.46) Object.assign(st, {phase: 'travel', fork: 1, travel: seg(f, 0.16, 0.46)});
      else if (f < 0.54) Object.assign(st, {phase: 'lay', fork: 1, travel: 1, lay: ease(seg(f, 0.46, 0.54))});
      else Object.assign(st, {phase: 'rows', fork: 1, travel: 1, lay: 1});
    } else if (stage === 6) {
      Object.assign(st, {phase: 'rows', slope: quant(sweep(f)), branch: true});
    } else {
      Object.assign(st, {phase: 'rows', slope: quant(lerp(LOW, S2, ease(seg(f, 0, 0.12)))), lane: true, branch: true});
    }
    return st;
  }

  // A dragged dial shows the finished picture at the dragged slope.
  const dialState = slope => ({...timeline(beats.length - 1, 1), slope, lane: false, branch: true});

  function draw(st) {
    const g = geometry(), m = g.m, u = g.u, y = m.y, X = m.x, [PX, r] = m.sum;
    const [bx, by, bw, bh] = m.box, [Ya, Yb, Ys] = m.rows, parts = [];
    const pt = (px, py) => `${num(px)} ${num(py)}`;
    const text = (px, py, content, cls, anchor = 'middle', extra = '', size = m.font) =>
      parts.push(`<text x="${num(px)}" y="${num(py)}" class="${cls}" font-size="${size}" text-anchor="${anchor}"${extra}>${content}</text>`);
    const flow = (px, py, dx, dy) => {
      const [len, half] = m.flow;
      parts.push(`<path class="il-flow" d="M${pt(px, py)}L${pt(px - dx * len - dy * half, py - dy * len + dx * half)}L${pt(px - dx * len + dy * half, py - dy * len - dx * half)}Z"></path>`);
    };

    // 1. Scenery: the wires, the learned branch, the lane, the sum, x and H(x).
    parts.push(`<path class="il-wire il-stub" d="M${pt(m.up, y)}H${num(X - m.node - 2)}M${pt(m.out + m.node + 2, y)}H${num(m.down)}"></path>`);
    parts.push(`<path class="il-wire" d="M${pt(X + m.node, y)}H${num(bx)}M${pt(bx + bw, y)}H${num(PX - r)}M${pt(PX + r, y)}H${num(m.out - m.node)}"></path>`);
    flow(bx, y, 1, 0); flow(PX - r, y, 1, 0); flow(m.out - m.node, y, 1, 0); flow(PX, y - r, 0, 1);
    parts.push(`<path class="il-lane" data-mark="lane" d="${g.d}"></path>`);
    parts.push(`<rect class="il-branch-box" data-mark="branch" x="${num(bx)}" y="${num(by)}" width="${num(bw)}" height="${num(bh)}" rx="6"></rect>`);
    parts.push(`<circle class="il-sum" data-mark="sum" cx="${num(PX)}" cy="${num(y)}" r="${num(r)}"></circle>`);
    parts.push(`<path class="il-plus" d="M${pt(PX - r * 0.55, y)}H${num(PX + r * 0.55)}M${pt(PX, y - r * 0.55)}V${num(y + r * 0.55)}"></path>`);
    parts.push(`<circle class="il-node" data-mark="x" cx="${num(X)}" cy="${num(y)}" r="${num(m.node)}"></circle>`);
    parts.push(`<circle class="il-node" data-mark="output" cx="${num(m.out)}" cy="${num(y)}" r="${num(m.node)}"></circle>`);
    text(X + m.xLabel[0], m.xLabel[1], 'x', 'il-symbol il-feature-text', 'end', ' data-label="x"', m.symbol);
    text(m.out + m.hLabel[0], m.hLabel[1], 'H(x)', 'il-symbol il-feature-text', 'middle', ' data-label="output"', m.symbol);
    text(bx + bw / 2, m.letterY, 'F', 'il-symbol', 'middle', ' data-label="F"', m.letter);
    text(bx + bw / 2, m.slopeY, `slope ${fmt(st.slope)}`, 'il-slope-text', 'middle', ' data-value="slope"', m.small);
    text((X + PX) / 2, m.laneLabel, 'identity lane', 'il-lane-text', 'middle', ' data-label="lane"', m.small);
    text(bx + bw / 2, m.branchLabel, 'learned branch', 'il-scenery', 'middle', ' data-label="branch"', m.small);

    // 2. The scale under x: an origin tick under x and one tick per unit, the way a positive
    // packet travels. It carries no numbers; the values sit beside the arrows.
    let scale = `M${pt(X - 2 * u - 6, Ys)}H${num(X + 6)}M${pt(X, Ys - 5)}V${num(Ys + 5)}`;
    for (const k of [1, 2]) scale += `M${pt(X - k * u, Ys - 3)}V${num(Ys + 3)}`;
    parts.push(`<path class="il-scale" data-mark="scale" data-origin="${pt(X, Ys)}" data-unit="${num(u)}" d="${scale}"></path>`);

    // 3. The forward pass, once: x flows along both routes, the two meet at the sum.
    if (st.pulse) {
      const dot = (route, a, name) => {
        const p = pointAt(route, a);
        parts.push(`<circle class="il-pulse" data-mark="${name}" cx="${num(p.x)}" cy="${num(p.y)}" r="${num(m.pulse)}"></circle>`);
      };
      if (st.pulse.out === null) {
        const xl = g.lane.length - (X - m.up), xm = g.main.length - (X - m.up);
        dot(g.lane, lerp(xl, g.sP, st.pulse.q), 'pulse-lane');
        dot(g.main, lerp(xm, g.sP, st.pulse.q), 'pulse-branch');
      } else dot(g.main, lerp(g.sP, m.down - m.out, st.pulse.out), 'pulse-out');
    }

    // 4. The gradient. A packet with centre c and value v lies on its route from c - vu/2 to
    // its head at c + vu/2; an exact zero is an open ring, so it reads as a measurement.
    const [headLen, headHalf] = m.head;
    const arrow = (pts, value, cls, mark, extra = '') => {
      const tail = pts[0], tip = pts.at(-1), cum = [0];
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      const len = cum.at(-1);
      const data = ` data-mark="${mark}" data-tail="${pt(tail[0], tail[1])}" data-head="${pt(tip[0], tip[1])}"${extra}`;
      if (value === 0) {
        parts.push(`<circle class="il-zero ${cls}" cx="${num(tip[0])}" cy="${num(tip[1])}" r="${num(m.ring)}"${data}></circle>`);
        return;
      }
      if (len < 0.5) return;
      const hl = Math.min(headLen, len), hw = headHalf * (0.55 + 0.45 * hl / headLen);
      let i = cum.findIndex(c => c >= len - hl);
      i = Math.max(1, i);
      const k = (len - hl - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
      const base = [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)];
      const dx = tip[0] - base[0], dy = tip[1] - base[1], dl = Math.hypot(dx, dy) || 1, nx = -dy / dl, ny = dx / dl;
      // A straight run needs only its ends: drop every point collinear with its neighbours.
      const run = [...pts.slice(0, i), base].filter((p, k, all) => k === 0 || k === all.length - 1
        || Math.abs((p[0] - all[k - 1][0]) * (all[k + 1][1] - p[1]) - (p[1] - all[k - 1][1]) * (all[k + 1][0] - p[0])) > 1e-6);
      const shaft = `M${run.map(p => pt(p[0], p[1])).join('L')}`;
      const d = len - hl > 0.25 ? `<path class="il-casing" d="${shaft}"></path><path class="il-shaft" d="${shaft}"></path>` : '';
      parts.push(`<g class="il-packet ${cls}"${data}>${d}<path class="il-head" d="M${pt(tip[0], tip[1])}L${pt(base[0] + nx * hw, base[1] + ny * hw)}L${pt(base[0] - nx * hw, base[1] - ny * hw)}Z"></path></g>`);
    };
    // On its route a packet passes through every vertex it spans, so its drawn length is its
    // value exactly; for the glide onto the scale both shapes are sampled at the same steps.
    const SAMPLES = 16;
    const along = (route, c, value) => {
      const a0 = c - value * u / 2, a1 = c + value * u / 2, lo = Math.min(a0, a1), hi = Math.max(a0, a1);
      const inner = route.s.filter(a => a > lo + 1e-9 && a < hi - 1e-9);
      return [a0, ...(a1 < a0 ? inner.reverse() : inner), a1].map(a => { const p = pointAt(route, a); return [p.x, p.y]; });
    };
    const sampled = (route, c, value) => Array.from({length: SAMPLES + 1}, (_, k) => {
      const p = pointAt(route, c - value * u / 2 + value * u * k / SAMPLES);
      return [p.x, p.y];
    });
    const straight = (x0, y0, value, steps = 1) => Array.from({length: steps + 1}, (_, k) => [x0 - value * u * k / steps, y0]);
    const label = (route, c, value, name) => {
      const p = pointAt(route, c), nx = -p.ty, ny = p.tx;
      text(p.x + nx * m.offset, p.y + ny * m.offset + m.font * 0.35, fmt(value), 'il-number il-halo', 'middle', ` data-value="${name}"`);
    };
    // The copy through F: rescaled from 1 to the slope while it lies wholly inside the box.
    const valueAt = (c, slope) => IN * lerp(1, slope, clamp01((c - g.scaleIn) / (g.scaleOut - g.scaleIn)));
    const s = st.slope, phase = st.phase;
    if (phase === 'incoming' || phase === 'arrived') {
      const c = lerp(g.start, g.rest, st.inc);
      const opacity = st.fade < 1 ? ` opacity="${num(st.fade)}"` : '';
      arrow(along(g.main, c, IN), IN, 'il-incoming', 'incoming', opacity);
      if (phase === 'arrived') label(g.main, c, IN, 'incoming');
    } else if (phase === 'fork' || phase === 'waiting') {
      const c = phase === 'fork' ? lerp(g.rest, g.entry, st.fork) : g.entry;
      arrow(along(g.lane, c, IN), IN, 'il-copy', 'lane-copy');
      arrow(along(g.main, c, IN), IN, 'il-copy', 'learned-copy');
      if (phase === 'waiting') { label(g.lane, c, IN, 'lane-copy'); label(g.main, c, IN, 'learned-copy'); }
    } else if (phase === 'travel' || phase === 'lay') {
      // Both copies leave together and reach x together: the lane's at an even pace, the one
      // through F slowing while the branch rescales it.
      const cl = lerp(g.entry, g.laneArrive, ease(st.travel));
      const cm = profile(CROSSING, [g.entry, g.scaleIn, g.scaleOut, g.mainArrive(s)])(st.travel);
      const v = st.travel >= 1 ? IN * s : valueAt(cm, s);
      if (phase === 'travel') {
        arrow(along(g.lane, cl, IN), IN, 'il-copy', 'lane-copy');
        arrow(along(g.main, cm, v), v, 'il-copy', 'learned-copy');
      } else {
        // Laid head to tail: each copy glides from where it reached x to its row under x.
        const mix = (from, to) => from.map((p, k) => [lerp(p[0], to[k][0], st.lay), lerp(p[1], to[k][1], st.lay)]);
        arrow(mix(sampled(g.lane, cl, IN), straight(X, Ya, IN, SAMPLES)), IN, 'il-copy', 'lane-copy');
        arrow(mix(sampled(g.main, cm, v), straight(X - IN * u, Yb, v, SAMPLES)), v, 'il-copy', 'learned-copy');
      }
    } else if (phase === 'rows') {
      const learned = IN * s, total = reach(s), end = X - total * u;
      parts.push(`<path class="il-tie" d="M${pt(X, Ya)}V${num(Ys)}M${pt(X - IN * u, Ya)}V${num(Yb)}M${pt(end, Yb)}V${num(Ys)}"></path>`);
      arrow(straight(X, Ya, IN), IN, 'il-copy', 'lane-copy');
      arrow(straight(X - IN * u, Yb, learned), learned, 'il-copy', 'learned-copy');
      arrow(straight(X, Ys, total), total, 'il-total', 'reached');
      // The values, in a column beside the rows they measure, each in the gradient's wine.
      const row = (rowY, value, words, name) => text(X + m.labelDx, rowY + m.font * 0.35,
        `<tspan class="il-number">${fmt(value)}</tspan> ${words}`, 'il-row-text', 'start', ` data-value="${name}"`);
      row(Ya, IN, 'along the lane', 'lane-copy');
      row(Yb, learned, 'through F', 'learned-copy');
      row(Ys, total, 'reaches x', 'reached');
    }
    return parts.join('');
  }

  // The picture's accessible description: what is drawn now, and never what reaches x
  // before the copies have been laid under it.
  function describe(st) {
    const s = st.slope;
    const block = `One residual block: x feeds the learned branch F, local slope ${fmt(s)}, and the identity lane, which arcs over F; the two meet at the sum, whose output is H of x.`;
    const now = {
      block: !st.pulse ? '' : st.pulse.out === null ? 'x flows forward along both routes to the sum.'
        : 'The sum flows on to H of x.',
      incoming: `A gradient of ${fmt(IN)} arrives at H of x.`,
      arrived: `A gradient of ${fmt(IN)} sits at H of x.`,
      fork: `The gradient of ${fmt(IN)} reaches the sum and splits into two copies.`,
      waiting: `One copy of ${fmt(IN)} waits at the entrance of the identity lane, the other at the entrance of F.`,
      travel: 'The lane\'s copy rides back along the lane while the other copy crosses F.',
      lay: 'The two copies are laid head to tail under x.',
      rows: `Under x the lane's copy of ${fmt(IN)} and the copy through F, ${fmt(IN * s)}, lie head to tail: ${fmt(reach(s))} reaches x.`
    }[st.phase];
    return now ? `${block} ${now}` : block;
  }

  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const clamped = Math.max(0, Math.min(duration, time));
    const stage = stageAt(clamped);
    const end = beats[stage + 1] === undefined ? duration : beats[stage + 1];
    const held = reducedMotion ? end - 1e-6 : clamped;
    const span = end - beats[stage];
    const f = span > 0 ? clamp01((held - beats[stage]) / span) : 1;
    const dragged = override !== null;
    const st = dragged ? dialState(override) : timeline(stage, f);

    root.dataset.stage = String(stage);
    root.dataset.slope = String(st.slope);
    root.dataset.phase = st.phase;
    root.dataset.override = dragged ? 'dial' : '';

    const key = [mode, JSON.stringify(st, (name, value) => (typeof value === 'number' ? Number(value.toFixed(4)) : value))].join('/');
    if (key !== previousKey) {
      previousKey = key;
      const [width, height] = MODES[mode].viewBox;
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      drawing.innerHTML = draw(st);
      // Written whole, so the class list never depends on the order of earlier seeks.
      formula.className = ['identity-lane-formula', st.lane && 'il-lane-lit', st.branch && 'il-branch-lit'].filter(Boolean).join(' ');
    }
    const picture = describe(st);
    if (svg.getAttribute('aria-label') !== picture) svg.setAttribute('aria-label', picture);

    // The dial: the thumb, the readout and the one place the slope is spoken. It never names
    // what reaches x, so it cannot announce the answer to the scene's question.
    slider.value = String(st.slope);
    const shown = two(st.slope);
    if (readout.textContent !== shown) readout.textContent = shown;
    const said = `slope ${shown}`;
    if (slider.getAttribute('aria-valuetext') !== said) slider.setAttribute('aria-valuetext', said);

    const entry = CAPTIONS[stage];
    const sentence = dragged
      ? `The lane's ${fmt(IN)} and the learned copy add: ${fmt(reach(st.slope))} reaches x.`
      : Array.isArray(entry) ? entry[st.phase === 'rows' ? 1 : 0] : entry;
    if (captionKey !== sentence) { captionKey = sentence; caption.textContent = sentence; }
    return `${STAGES[stage]}.`;
  }

  // The dial is a detour, not a new default. Dragging pauses playback and redraws the whole
  // picture at the dragged slope; any timeline action -- play from a pause, a scrub, an
  // arrow-key beat -- returns to the timeline's own slope.
  function drag() {
    const requested = clampSlope(quant(Number(slider.value)));
    if (root.dataset.playing === 'true') $('[data-action="play"]').click();
    override = requested;
    render(lastTime, reduced);
  }
  slider.addEventListener('input', drag);
  slider.addEventListener('change', drag);
  pane.addEventListener('click', event => {
    if (event.target.closest('[data-action="play"]') && root.dataset.playing !== 'true') override = null;
  }, true);
  // The same guard the transport applies (shared/playback.js): a key it ignores must leave
  // the dragged slope alone.
  pane.addEventListener('keydown', event => {
    if (event.target !== pane || event.altKey || event.ctrlKey || event.metaKey) return;
    const toggles = [' ', 'k', 'K'].includes(event.key);
    if (toggles && (event.repeat || root.dataset.playing === 'true')) return;
    if (toggles || ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) override = null;
  }, true);

  function typeset() {
    const done = () => { root.dataset.typeset = root.querySelector('mjx-container') ? 'mathjax' : 'none'; };
    const mathjax = window.MathJax;
    if (mathjax && typeof mathjax.typesetPromise === 'function' && !root.querySelector('mjx-container')) {
      mathjax.typesetPromise([root]).then(done, done);
    } else done();
  }

  // The dial's range is declared with the fixture. While the player runs the slider's own
  // value text speaks the slope, so the visible readout leaves the accessibility tree.
  slider.min = String(LOW); slider.max = String(HIGH);
  $('[data-slope-display]').setAttribute('aria-hidden', 'true');
  // Bound before the transport mounts, so it runs before the transport's own seek: the
  // scrubber is the timeline, and a scrub ends a detour.
  $('[data-controls] input[type="range"]').addEventListener('input', () => { override = null; });
  measure();
  window.BookPlayback(root, render, () => { measure(); previousKey = ''; render(lastTime, reduced); });
  if (root.dataset.ready) slider.disabled = false;
  typeset();
})();
