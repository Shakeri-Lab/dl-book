// Branch accumulation: what `+=` is for.
//
// Contract with interactives/shared/playback.js:
//   window.BookPlayback(root, render, layout?)
//   render(time, reduced) -> the scrubber's description. A pure function of
//     (time, reduced): it never measures, and seeking to a time reconstructs the
//     same picture whatever the playback history was.
//   layout() -> the only place that measures.
//
// The picture is one graph and one meter. The tracked object is a single wine packet
// of blame: it leaves the product node, travels one branch, and is absorbed into the
// meter. Then a second packet travels the other branch and is absorbed into the SAME
// meter, which grows again rather than restarting. That second growth is the whole
// scene; two stills of the first and last frame show a full meter and lose the fact
// that it was filled twice.
(() => {
  const root = document.getElementById('branch-blame-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  // The panel is the one in-repo mirror of the manuscript fixture
  // (chapters/part1/05-backpropagation.qmd:400-416, and the engine's rules at 342-378).
  // interactives/manifest.json names those literals and scripts/audit_excerpt_fixtures.py
  // keeps the chapter and the panel together, so nothing below retypes a number.
  const W = Number(root.dataset.w), X = Number(root.dataset.x);
  const B = Number(root.dataset.bias), TARGET = Number(root.dataset.target);
  const E = Number(root.dataset.e), USES = Number(root.dataset.uses);

  // The chapter's own forward pass, with the chapter's own value of e.
  const z = W * X + B;
  const A = 1 / (1 + E ** (-z));
  const BRANCH = A - TARGET;            // both add-nodes hold this; each sends the other's
  const TOTAL = USES * BRANCH;          // what the counter holds once both have landed
  const SLOPE = A * (1 - A);            // the sigmoid gate the trunk multiplies by
  const DW = TOTAL * SLOPE * X;         // the chapter prints this as dL/dw
  const HALF = BRANCH * SLOPE * X;      // what a single arrival would have produced

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = svg.querySelector('[data-drawing]');
  // The narrow print exists for a reader without script. Once this player owns the
  // picture it draws its own narrow layout, so the second print is removed rather than
  // left stacked under the live drawing.
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration || beats.at(-1));
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);
  const STAGES = ['Ask', 'Seed', 'First branch', 'Hold', 'Second branch',
    'Assignment', 'Down the trunk', 'Compare'];
  const CAPTIONS = [
    'One value feeds two branches. When blame returns, does the counter read once or twice?',
    'Blame starts at the loss with one. The product rule sends each branch the other.',
    'The upper branch arrives, and the counter takes its first reading.',
    'One packet has landed; one is still in flight. What will the counter read?',
    'The second lands on the same counter, which adds rather than replaces.',
    'Assignment would have kept only the last arrival. Plus-equals keeps both.',
    'The doubled blame travels the trunk and lands on the gradient the chapter prints.',
    'Two uses, two arrivals, one sum. That is where the factor of two comes from.'
  ];

  // Plain-text numbers obey the book's typography: a true minus, never a hyphen.
  const MINUS = '−';
  const fixed = (value, places = 4) => value.toFixed(places).replace('-', MINUS);
  const num = value => String(Number(value.toFixed(4)));

  // Geometry: the one place a quantity becomes a coordinate. Nothing here is measured.
  const MODES = {
    wide: {
      viewBox: '0 0 713 352', box: [713, 352], font: 13, r: 28, lift: 32, lane: undefined,
      a: [170, 132], u: [326, 44, 146, 46], v: [326, 176, 146, 46], l: [600, 132],
      aValue: [170, 88], seed: [600, 88],
      meter: {x: 150, y: 262, h: 20, span: 320, label: [60, 277], anchor: 'start'},
      trunk: [150, 330], arrowAt: 330, result: [360, 330], versus: [512, 330],
      wideLabels: true
    },
    // Narrow keeps the same graph, but the return channels run in the two outer lanes
    // rather than above and below: side by side there is no room over a branch box.
    narrow: {
      viewBox: '0 0 296 452', box: [296, 452], font: 12, r: 22, lane: 14,
      a: [148, 44], u: [30, 118, 100, 44], v: [166, 118, 100, 44], l: [148, 240],
      aValue: [148, 14], seed: [148, 284],
      meter: {x: 14, y: 310, h: 20, span: 208, label: [14, 300], anchor: 'start'},
      trunk: [148, 378], arrowAt: null, result: [148, 404], versus: [148, 430],
      wideLabels: false
    }
  };

  let lastTime = 0, reduced = false, previousKey = '', captionKey = '', mode = 'wide';
  function measure() {
    mode = (figure.getBoundingClientRect().width || 600) < 600 ? 'narrow' : 'wide';
  }

  // --- The drawing -----------------------------------------------------------------
  // Built as one string and written once per changed state, never per frame of an
  // unchanged picture. Every coordinate comes from MODES; nothing is measured here.
  const centre = box => [box[0] + box[2] / 2, box[1] + box[3] / 2];
  // The point where an edge meets a circle of radius r, so arrows stop at the rim.
  const rim = (from, to, r) => {
    const dx = to[0] - from[0], dy = to[1] - from[1], len = Math.hypot(dx, dy) || 1;
    return [from[0] + (dx / len) * r, from[1] + (dy / len) * r];
  };
  // Distance along a polyline, so a packet moves at one speed through its corners.
  const walk = (points, t) => {
    const legs = [];
    let total = 0;
    for (let i = 0; i + 1 < points.length; i++) {
      const d = Math.hypot(points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]);
      legs.push(d); total += d;
    }
    let want = Math.max(0, Math.min(1, t)) * total;
    for (let i = 0; i < legs.length; i++) {
      if (want <= legs[i] || i === legs.length - 1) {
        const f = legs[i] > 0 ? Math.min(1, want / legs[i]) : 1;
        return [points[i][0] + (points[i + 1][0] - points[i][0]) * f,
          points[i][1] + (points[i + 1][1] - points[i][1]) * f];
      }
      want -= legs[i];
    }
    return points.at(-1);
  };

  function draw(state) {
    const g = MODES[mode];
    const {stage, first, second, grad, ghost, packet, packetOn, trunkOn, resultOn, versusOn} = state;
    const parts = [];
    const uMid = centre(g.u), vMid = centre(g.v);
    const text = (x, y, content, cls, anchor = 'middle', extra = '') =>
      parts.push(`<text x="${num(x)}" y="${num(y)}" class="${cls}" font-size="${g.font}" text-anchor="${anchor}"${extra}>${content}</text>`);
    const edge = (from, to, cls) => {
      const dx = to[0] - from[0], dy = to[1] - from[1], len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      parts.push(`<path class="${cls}" d="M${num(from[0])} ${num(from[1])}L${num(to[0])} ${num(to[1])}`
        + `M${num(to[0] - 9 * ux - 4.5 * uy)} ${num(to[1] - 9 * uy + 4.5 * ux)}`
        + `L${num(to[0])} ${num(to[1])}`
        + `L${num(to[0] - 9 * ux + 4.5 * uy)} ${num(to[1] - 9 * uy - 4.5 * ux)}"></path>`);
    };

    // Scenery: the graph itself, which never moves.
    edge(rim(g.a, uMid, g.r), [g.u[0], uMid[1]], 'bb-edge');
    edge(rim(g.a, vMid, g.r), [g.v[0], vMid[1]], 'bb-edge');
    edge([g.u[0] + g.u[2], uMid[1]], rim(g.l, uMid, g.r), 'bb-edge');
    edge([g.v[0] + g.v[2], vMid[1]], rim(g.l, vMid, g.r), 'bb-edge');

    for (const [box, name] of [[g.u, 'u'], [g.v, 'v']]) {
      const mid = centre(box);
      parts.push(`<rect class="bb-box" data-node="${name}" x="${num(box[0])}" y="${num(box[1])}" width="${num(box[2])}" height="${num(box[3])}" rx="6"></rect>`);
      text(mid[0], box[1] + 19, `a ${MINUS} ${TARGET.toFixed(1)}`, 'bb-node-name');
      text(mid[0], box[1] + 37, fixed(BRANCH), 'bb-prediction bb-number', 'middle', ` data-value="${name}"`);
    }
    parts.push(`<circle class="bb-activation" data-node="a" cx="${num(g.a[0])}" cy="${num(g.a[1])}" r="${g.r}"></circle>`);
    text(g.a[0], g.a[1] + 5, 'a', 'bb-node-name bb-node-letter');
    text(g.aValue[0], g.aValue[1], fixed(A), 'bb-prediction bb-number', 'middle', ' data-value="a"');
    parts.push(`<circle class="bb-loss" data-node="loss" cx="${num(g.l[0])}" cy="${num(g.l[1])}" r="${g.r}"></circle>`);
    text(g.l[0], g.l[1] + 5, '×', 'bb-node-name bb-node-letter');
    text(g.seed[0], g.seed[1], stage >= 1 ? 'grad 1' : '·', 'bb-blame bb-number', 'middle', ' data-value="seed"');

    // The two return routes, each revealed with its own packet.
    // The return channel is drawn clear of the forward edge it retraces -- lifted away
    // from the picture's spine -- so the eye can see blame going the other way.
    const lift = (points, dy) => points.map(([x, y], i) => [x, i === 0 || i === points.length - 1 ? y : y + dy]);
    const channel = (box, mid, sign) => g.lane === undefined
      // Wide: the channel retraces the forward edge, lifted away from the picture's spine.
      ? lift([rim(g.l, mid, g.r), [box[0] + box[2], mid[1]], [box[0], mid[1]], rim(g.a, mid, g.r)], sign * g.lift)
      // Narrow: it runs up the outer lane beside its branch, with a stub marking the node
      // it carries blame out of.
      : [rim(g.l, mid, g.r),
        [sign < 0 ? box[0] - g.lane : box[0] + box[2] + g.lane, g.l[1]],
        [sign < 0 ? box[0] - g.lane : box[0] + box[2] + g.lane, box[1] - 16],
        rim(g.a, mid, g.r)];
    const routeU = channel(g.u, uMid, -1), routeV = channel(g.v, vMid, 1);
    const stub = (box, mid, sign) => g.lane === undefined ? '' : (() => {
      const lane = sign < 0 ? box[0] - g.lane : box[0] + box[2] + g.lane;
      return `<line class="bb-return" x1="${num(lane)}" y1="${num(mid[1])}" x2="${num(sign < 0 ? box[0] : box[0] + box[2])}" y2="${num(mid[1])}"></line>`;
    })();
    const trace = (route, done) => {
      if (!done) return;
      parts.push(`<path class="bb-return" d="${route.map((p, i) => `${i ? 'L' : 'M'}${num(p[0])} ${num(p[1])}`).join('')}"></path>`);
      edge(route.at(-2), route.at(-1), 'bb-return-head');
    };
    // A channel appears when its packet launches, so the packet is never in mid-air.
    trace(routeU, stage >= 2);
    if (stage >= 2) parts.push(stub(g.u, uMid, -1));
    trace(routeV, stage >= 4);
    if (stage >= 4) parts.push(stub(g.v, vMid, 1));
    if (packetOn) {
      const route = packetOn === 'u' ? routeU : routeV;
      const at = walk(route, packet);
      parts.push(`<circle class="bb-packet" data-mark="packet" cx="${num(at[0])}" cy="${num(at[1])}" r="7"></circle>`);
      // In the narrow lanes the packet rides the picture's edge, so its number is held
      // inside rather than centred on a disc that has nowhere left to go.
      const label = Math.min(Math.max(at[0], 32), g.box[0] - 32);
      text(label, at[1] + (packetOn === 'u' ? -14 : 20), fixed(BRANCH), 'bb-blame bb-number bb-packet-text');
    }

    // The meter: the counter on a, which is what the whole scene is about.
    const m = g.meter, unit = m.span / TOTAL;
    parts.push(`<rect class="bb-track" x="${num(m.x)}" y="${num(m.y)}" width="${num(m.span)}" height="${m.h}" rx="4"></rect>`);
    parts.push(`<rect class="bb-fill" data-mark="fill" x="${num(m.x)}" y="${num(m.y)}" width="${num(grad * unit)}" height="${m.h}" rx="4"></rect>`);
    text(m.label[0], m.label[1], 'blame on a', 'bb-scenery', m.anchor);
    text(m.x + grad * unit + 10, m.y + m.h - 5, grad > 0 ? fixed(grad) : '·',
      'bb-blame bb-number bb-total', 'start', ' data-value="grad"');
    // The counterfactual is a second, hollow bar under the real one, so the comparison is
    // length against length and nothing is written over the fill.
    if (ghost !== null) {
      const gw = ghost * unit;
      parts.push(`<rect class="bb-ghost-bar" data-mark="ghost" x="${num(m.x)}" y="${num(m.y + m.h + 6)}" width="${num(gw)}" height="9" rx="3"></rect>`);
      if (g.wideLabels) text(m.x + gw + 10, m.y + m.h + 15, 'if it assigned', 'bb-scenery bb-ghost-label', 'start');
      else text(m.x, m.y + m.h + 30, 'if it assigned', 'bb-scenery bb-ghost-label', 'start');
    }

    // The trunk, put back only at the end so the arithmetic reaches the printed number.
    const rowAnchor = g.wideLabels ? 'start' : 'middle';
    if (trunkOn) {
      text(g.trunk[0], g.trunk[1], `× ${fixed(SLOPE)} × ${num(X)}`, 'bb-scenery', rowAnchor);
      if (g.arrowAt !== null) edge([g.arrowAt, g.trunk[1] - 4], [g.arrowAt + 22, g.trunk[1] - 4], 'bb-edge');
      text(g.result[0], g.result[1], `∂L/∂w = ${resultOn ? fixed(DW) : '·'}`,
        'bb-blame bb-number bb-result', rowAnchor, ' data-value="dw"');
    }
    if (versusOn) text(g.versus[0], g.versus[1], `assignment: ${fixed(HALF)}`,
      'bb-scenery bb-number bb-struck', rowAnchor, ' data-value="half"');
    return parts.join('');
  }

  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const clamped = Math.max(0, Math.min(duration, time));
    const stage = stageAt(clamped);
    // Reduced motion holds each beat's FINISHED state, so the still a reader sees is the
    // one its caption describes, and the render at a beat and just after it is identical.
    const end = beats[stage + 1] === undefined ? duration : beats[stage + 1];
    const held = reducedMotion ? end - 1e-6 : clamped;
    const span = end - beats[stage];
    const f = span > 0 ? Math.max(0, Math.min(1, (held - beats[stage]) / span)) : 1;
    // A packet travels for the first seven tenths of its beat and is absorbed over the
    // rest: the absorption IS the addition, so the meter grows while the packet lands.
    const travel = Math.min(1, f / 0.7);
    const land = Math.min(1, Math.max(0, (f - 0.7) / 0.3));
    const absorbed = land >= 1 - 1e-6;

    // A packet exists only while it is on its way. Once it is fully absorbed it is gone,
    // because what it carried is now the meter's length -- including in a reduced-motion
    // still, where a disc left hovering over the node would read as a stalled animation.
    const WAIT = 0.12;                   // where a packet stands clear of the product node
    let first = 0, second = 0, packetOn = null, packet = 0;
    if (stage === 2) { first = BRANCH * land; if (!absorbed) { packetOn = 'u'; packet = WAIT + (1 - WAIT) * travel; } }
    else if (stage >= 3) first = BRANCH;
    if (stage === 3) { packetOn = 'v'; packet = WAIT; }
    if (stage === 4) { second = BRANCH * land; if (!absorbed) { packetOn = 'v'; packet = WAIT + (1 - WAIT) * travel; } }
    else if (stage >= 5) second = BRANCH;
    const grad = first + second;
    // The counterfactual slides back from the true total to the one arrival assignment
    // would have kept; from then on it stands where it stopped.
    const ghost = stage === 5 ? TOTAL - (TOTAL - BRANCH) * f : stage > 5 ? BRANCH : null;

    root.dataset.stage = String(stage);
    root.dataset.grad = grad.toFixed(6);
    root.dataset.arrivals = String((stage >= 3 ? 1 : 0) + (stage >= 5 ? 1 : 0));

    const stateKey = [stage, mode, first.toFixed(4), second.toFixed(4), packetOn,
      packet.toFixed(4), ghost === null ? 'x' : ghost.toFixed(4)].join('/');
    if (stateKey !== previousKey) {
      previousKey = stateKey;
      const g = MODES[mode];
      svg.setAttribute('viewBox', g.viewBox);
      drawing.innerHTML = draw({stage, first, second, grad, ghost, packet, packetOn,
        trunkOn: stage >= 6, resultOn: stage >= 6 && (stage > 6 || f > 0.5), versusOn: stage >= 7});
      formula.classList.toggle('bb-product-lit', stage === 1);
      formula.classList.toggle('bb-first-lit', stage === 2 || stage === 3);
      formula.classList.toggle('bb-second-lit', stage === 4);
      formula.classList.toggle('bb-sum-lit', stage >= 5);
    }

    const sentence = CAPTIONS[stage];
    if (captionKey !== sentence) { captionKey = sentence; caption.textContent = sentence; }
    // The caption is a live region; the scrubber names the stage and the counter instead.
    return `${STAGES[stage]}. Counter on a ${grad > 0 ? fixed(grad) : 'empty'}.`;
  }

  // One guarded typeset call after mount. MathJax's lazyAlwaysTypeset list already covers
  // span[id^="eq-"], so on the book page this is normally a no-op; without MathJax the TeX
  // source stays readable, which is the no-JS behaviour everywhere in the book.
  function typeset() {
    const done = () => { root.dataset.typeset = root.querySelector('mjx-container') ? 'mathjax' : 'none'; };
    const mathjax = window.MathJax;
    if (mathjax && typeof mathjax.typesetPromise === 'function' && !root.querySelector('mjx-container')) {
      mathjax.typesetPromise([root]).then(done, done);
    } else done();
  }

  measure();
  window.BookPlayback(root, render, () => { measure(); previousKey = ''; render(lastTime, reduced); });
  typeset();
})();
