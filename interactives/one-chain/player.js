(() => {
  const root = document.getElementById('one-chain-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  // The panel is the one in-repo mirror of the manuscript fixture
  // (chapters/part1/05-backpropagation.qmd:401-416, the `micro-autograd-check` cell).
  // interactives/manifest.json names those literals and scripts/audit_excerpt_fixtures.py
  // keeps the chapter and this panel together, so nothing below retypes a chapter number.
  const W0 = Number(root.dataset.w), X = Number(root.dataset.x);
  const B = Number(root.dataset.b), Y = Number(root.dataset.y);
  // The size of the nudge is this scene's own: the chapter runs no finite-difference
  // check here, so DW is a declared computed variant, typed once, on the panel.
  const DW = Number(root.dataset.nudge);
  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = svg.querySelector('[data-drawing]');
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  // The typeset labels on the picture: one <foreignObject> per label, revealed by the
  // hidden attribute, positioned by layout(), never rewritten by render().
  const labels = {};
  for (const node of svg.querySelectorAll('foreignObject[data-reveal]')) labels[node.dataset.reveal] = node;
  // Beats are declared on the pane, so the timeline is stated once. Every stage boundary
  // is a beat: that is what lets the arrow keys land where the mechanism changes. There
  // is no stage strip: the beats are named here, in data-beats order, and the transcript
  // lists them in the same order.
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);
  const STAGES = ['Ask', 'Forward', 'Nudge', 'Measured', 'Backward reaches a', 'Backward reaches z',
    'Backward reaches w', 'Chain rule', 'Hold'];
  const NODES = ['w', 'z', 'a', 'L'];
  // A ramp is exactly 0 before its window and exactly 1 after it: a ray that has arrived
  // reports 1, not 0.9999999999999984, so "revealed on arrival" is one comparison.
  const ramp = (t, [a, b]) => (t >= b ? 1 : t <= a ? 0 : (t - a) / (b - a));
  const ease = p => p * p * (3 - 2 * p);
  const num = value => Number(value.toFixed(2));
  const plain = value => (Number.isInteger(value) ? String(value) : value.toFixed(6));
  const signedTex = (value, digits) => `${value < 0 ? '-' : '+'}${Math.abs(value).toFixed(digits)}`;
  const minus = text => text.replace('-', '−');

  // The chapter's own forward pass: z = wx + b, a = sigma(z), and the FULL squared error
  // L = (a - y)^2, which is the loss `micro-autograd-check` writes as (a + (-0.3)) squared.
  // Half of it would halve every gradient below; the product would read 0.168900.
  function forward(w) {
    const z = w * X + B;
    const a = 1 / (1 + Math.exp(-z));
    return {w, z, a, L: (a - Y) * (a - Y)};
  }
  // The tape. Computed once, from the un-turned weight, and never recomputed: this is
  // exactly what "the forward pass keeps" means, and it is why turning the dial below
  // cannot move a single backward number.
  const cache = forward(W0);
  // The three local derivatives, each read off that tape. Same three factors, same order,
  // as the chapter's hand check 2 * (s - 0.3) * s * (1 - s) * 2.0.
  const locals = [2 * (cache.a - Y), cache.a * (1 - cache.a), X];
  const product = locals.reduce((total, value) => total * value, 1);
  // The measurement, at the full nudge: one extra forward pass, no derivatives involved.
  const bumped = forward(W0 + DW);
  const deltaL = bumped.L - cache.L, measured = deltaL / DW;
  // The nudge at each node: what the one orange bar measures as it stands on w, z, a, L.
  const inc = [DW, bumped.z - cache.z, bumped.a - cache.a, bumped.L - cache.L];

  // Every typeset label on the picture and the formula line, generated from the declared
  // fixture. panel.html ships the same strings as its static fallback; at mount each span
  // is compared with the string recomputed here and rewritten only on a mismatch, so the
  // hand-typed TeX is never a second copy of the fixture that could drift on its own.
  const P = s => `\\parameterpart{${s}}`, F = s => `\\featurepart{${s}}`, G = s => `\\predictionpart{${s}}`;
  const T = s => `\\targetpart{${s}}`, R = s => `\\residualpart{${s}}`;
  const factorsTex = [`\\class{oc-f3}{${R(`2(${G('a')}-${T('y')})`)}}`, `\\class{oc-f2}{${G('\\sigma\'(z)')}}`,
    `\\class{oc-f1}{${F('x')}}`].join('\\cdot');
  const numbersTex = [`\\class{oc-f3}{${R(plain(locals[0]))}}`, `\\class{oc-f2}{${G(plain(locals[1]))}}`,
    `\\class{oc-f1}{${F(plain(locals[2]))}}`].join('\\cdot');
  const productTex = `\\class{oc-prod}{${R(product.toFixed(6))}}`;
  const lhsTex = `\\dfrac{\\partial ${R('L')}}{\\partial ${P('w')}}`;
  const TEX = {
    'map-1': `\\(z = ${P('w')}${F('x')} + b\\)`,
    'map-2': `\\(${G('a')} = \\sigma(z)\\)`,
    'map-3': `\\(${R('L')} = (${G('a')} - ${T('y')})^2\\)`,
    'const-1': `\\(${F(`x = ${X}`)}\\qquad b = ${B}\\)`,
    'const-3': `\\(${T(`y = ${Y}`)}\\)`,
    'letter-w': `\\(${P('w')}\\)`, 'letter-z': '\\(z\\)', 'letter-a': `\\(${G('a')}\\)`, 'letter-L': `\\(${R('L')}\\)`,
    dw: `\\(${P(`\\Delta w = ${signedTex(inc[0], 3)}`)}\\)`,
    dz: `\\(\\Delta z = ${signedTex(inc[1], 3)}\\)`,
    da: `\\(${G(`\\Delta a = ${signedTex(inc[2], 6)}`)}\\)`,
    dL: `\\(${R(`\\Delta L = ${signedTex(inc[3], 6)}`)}\\)`,
    // The narrow layout writes the same four increments without their "Δ· =" prefix: the
    // letter under the node and the label's colour already say which quantity it is.
    'dw-n': `\\(${P(signedTex(inc[0], 3))}\\)`,
    'dz-n': `\\(${signedTex(inc[1], 3)}\\)`,
    'da-n': `\\(${G(signedTex(inc[2], 6))}\\)`,
    'dL-n': `\\(${R(signedTex(inc[3], 6))}\\)`,
    'fac-3': `\\(\\times\\,${R(plain(locals[0]))}\\)`,
    'fac-2': `\\(\\times\\,${G(plain(locals[1]))}\\)`,
    'fac-1': `\\(\\times\\,${F(plain(locals[2]))}\\)`,
    'der-3': `\\(= 2(${G('a')} - ${T('y')})\\)`,
    'der-2': `\\(= ${G('a')}(1 - ${G('a')})\\)`,
    'der-1': `\\(= ${F('x')}\\)`,
    ratio: `\\(${R(`\\Delta L/\\Delta w = ${measured.toFixed(6)}`)}\\)`,
    prod: `\\(\\partial ${R('L')}/\\partial ${P('w')} = ${R(product.toFixed(6))}\\)`,
    '1': `\\( ${lhsTex} \\;=\\; ${factorsTex} \\;=\\; ${numbersTex} \\;=\\; ${productTex} \\)`,
    '1n': `\\[ \\begin{aligned} ${lhsTex} &= ${factorsTex} \\\\ &= ${numbersTex} \\\\ &= ${productTex} \\end{aligned} \\]`
  };
  const tidy = text => text.replace(/\s+/g, ' ').trim();
  // What a span currently says. Before MathJax runs that is its text; once typeset, the
  // source lives in MathJax's math list and the span holds the rendered boxes.
  function sourceOf(span) {
    if (!span.querySelector('mjx-container')) return tidy(span.textContent);
    const doc = window.MathJax && window.MathJax.startup && window.MathJax.startup.document;
    if (!doc || !doc.math) return null;
    for (const item of doc.math) {
      if (!item.typesetRoot || !span.contains(item.typesetRoot)) continue;
      return tidy(item.display ? `\\[${item.math}\\]` : `\\(${item.math}\\)`);
    }
    return null;
  }
  const spans = {}, rewritten = [];
  for (const [name, tex] of Object.entries(TEX)) {
    const span = document.getElementById(`eq-one-chain-${name}`);
    if (!span) continue;
    spans[name] = span;
    const current = sourceOf(span);
    if (current !== null && current !== tidy(tex)) { span.textContent = tex; rewritten.push(name); }
  }
  root.dataset.fixtureRewritten = rewritten.join(' ');

  // --- Choreography (seconds on the 40 s content clock; the 1.5x default plays 2/3 of these)
  const FILL = [[5.5, 7], [7, 8.5], [8.5, 10]];           // forward ink, one edge at a time
  const TURN = [12, 13.5];                                // the dial turns, the bar grows on the rim
  const HOP = [[14, 15.3], [16.3, 17.6], [18.6, 19.9]];   // the bar travels edge k, rescaled
  const RATIO_AT = 21;                                    // the measured slope is written at L
  const RETURN = [24, 25];                                // the dial comes back, the bar fades
  const FORMULA_AT = 25;                                  // the formula line appears, factors dim
  const SWEEP = [[25.2, 27], [27.4, 29.2], [30.4, 32.2]]; // blame walks back: L->a, a->z, z->w
  const PRODUCT_AT = 34;                                  // the product lands under the ratio
  // Reduced motion: one still picture per beat, the object jumped to its beat position.
  // Each is the continuous picture at the instant the beat's last reveal has happened.
  const SNAP = [0, 11.99, 20.99, 23.99, 27, 29.2, 32.2, 34, 40];

  function stateAt(t) {
    const legs = FILL.map(span => ease(ramp(t, span)));
    const shown = [true, legs[0] >= 1, legs[1] >= 1, legs[2] >= 1];
    const turnUp = ease(ramp(t, TURN)), back = ease(ramp(t, RETURN));
    const turn = turnUp * (1 - back);
    const hop = HOP.map(span => ease(ramp(t, span)));
    // How far the nudge has reached each of z, a, L: it arrives with the bar and leaves
    // with the dial's return, so a displayed value only ever shows a real forward pass.
    const arrival = hop.map(q => Math.min(turn, q));
    const liveW = W0 + DW * turn;
    let bar = null;
    if (t >= TURN[0] && t < RETURN[1]) {
      let node = 0, frac = 0;
      for (let k = 0; k < 3; k++) {
        if (t >= HOP[k][1]) node = k + 1;
        else if (t >= HOP[k][0]) { node = k; frac = hop[k]; break; }
      }
      const from = inc[node], to = inc[Math.min(node + 1, 3)];
      // Geometric interpolation: x2 and x0.2 read as scalings, not as slides.
      const size = frac > 0 ? from * Math.pow(to / from, frac) : from;
      const grow = node === 0 && frac === 0 ? turnUp : 1;
      bar = {node, frac, size: size * grow, opacity: 1 - back};
    }
    const ghosts = [t >= TURN[1], t >= HOP[0][1], t >= HOP[1][1], t >= HOP[2][1]];
    const sweep = SWEEP.map(span => ease(ramp(t, span)));
    return {
      legs, shown, turn, arrival, liveW, bar, ghosts,
      ghostOpacity: t >= RETURN[1] ? 0.45 : 0.7,
      ghostNeedle: liveW !== W0,
      ratio: t >= RATIO_AT, formula: t >= FORMULA_AT, sweep,
      factors: sweep.map(p => p >= 1), prod: t >= PRODUCT_AT,
      values: [liveW.toFixed(3), ...[0, 1, 2].map(k => {
        const at = forward(W0 + DW * arrival[k]);
        return [at.z.toFixed(3), at.a.toFixed(6), at.L.toFixed(6)][k];
      })]
    };
  }

  // --- Geometry: the one place a quantity becomes a coordinate -------------------------
  // Wide: one line across the pane. Narrow (pane under 600 px): the same line, closer
  // nodes, half the bar scale, the derivation sub-labels dropped. Every positioned mark
  // takes its numbers from here; render() never measures.
  const LAYOUT = {
    wide: {
      viewBox: '0 0 1100 430', nx: [130, 392, 654, 916], line: 262, dot: 8, dial: 36, needle: 26,
      barX: [180, 392, 654, 916], barW: 12, px: 8000, valueY: 348,
      edges: [[166, 384], [400, 646], [662, 908]],
      labels: {
        'map-1': [167, 35, 220, 30], 'map-2': [413, 35, 220, 30], 'map-3': [675, 35, 220, 30],
        'const-1': [167, 67, 220, 26], 'const-3': [675, 67, 220, 26],
        'letter-w': [100, 305, 60, 30], 'letter-z': [362, 305, 60, 30], 'letter-a': [624, 305, 60, 30], 'letter-L': [886, 305, 60, 30],
        dw: [48, 171, 120, 30, 'end'], dz: [260, 94, 120, 30, 'end'], da: [492, 218, 150, 30, 'end'], dL: [754, 224, 150, 30, 'end'],
        'dw-n': [48, 171, 120, 30, 'end'], 'dz-n': [260, 94, 120, 30, 'end'], 'da-n': [492, 218, 150, 30, 'end'], 'dL-n': [754, 224, 150, 30, 'end'],
        'fac-1': [187, 271, 180, 28], 'fac-2': [433, 271, 180, 28], 'fac-3': [695, 271, 180, 28],
        'der-1': [187, 297, 180, 20], 'der-2': [433, 297, 180, 20], 'der-3': [695, 297, 180, 20],
        ratio: [786, 365, 260, 30], prod: [786, 393, 260, 30]
      }
    },
    narrow: {
      viewBox: '0 0 480 320', nx: [72, 186, 300, 414], line: 160, dot: 6, dial: 26, needle: 18,
      barX: [108, 186, 300, 414], barW: 10, px: 4000, valueY: 236,
      edges: [[98, 180], [192, 294], [306, 408]],
      labels: {
        'map-1': [74, 15, 110, 26], 'map-2': [188, 15, 110, 26], 'map-3': [302, 15, 110, 26],
        'const-1': [54, 42, 150, 24], 'const-3': [302, 42, 110, 24],
        'letter-w': [47, 198, 50, 28], 'letter-z': [161, 198, 50, 28], 'letter-a': [275, 198, 50, 28], 'letter-L': [389, 198, 50, 28],
        dw: [16, 110, 80, 24, 'end'], dz: [84, 72, 90, 24, 'end'], da: [190, 124, 100, 24, 'end'], dL: [304, 128, 100, 24, 'end'],
        'dw-n': [46, 110, 50, 24, 'end'], 'dz-n': [124, 72, 50, 24, 'end'], 'da-n': [220, 124, 70, 24, 'end'], 'dL-n': [334, 128, 70, 24, 'end'],
        'fac-1': [74, 171, 110, 26], 'fac-2': [188, 171, 110, 26], 'fac-3': [302, 171, 110, 26],
        'der-1': [74, 195, 110, 18], 'der-2': [188, 195, 110, 18], 'der-3': [302, 195, 110, 18],
        ratio: [274, 257, 200, 26, 'end'], prod: [274, 281, 200, 26, 'end']
      }
    }
  };
  // The dial reads w in [0.68, 0.72] across 120 degrees: one tick per 0.01, so the turn
  // is one whole tick. A drawing scale, recorded as such in the receipt.
  const DIAL = {lo: 0.68, span: 0.04, degrees: 120};
  const angleOf = w => -DIAL.degrees / 2 + (w - DIAL.lo) / DIAL.span * DIAL.degrees;
  let lastTime = 0, reduced = false, previousHtml = '', captionKey = '', mode = 'wide';

  // The only measurement in the file, called from layout() and once before mounting.
  function measure() {
    const width = pane.getBoundingClientRect().width || 1100;
    mode = width < 600 ? 'narrow' : 'wide';
    const g = LAYOUT[mode];
    svg.setAttribute('viewBox', g.viewBox);
    root.dataset.layout = mode;
    for (const [name, box] of Object.entries(g.labels)) {
      const node = labels[name];
      if (!node) continue;
      ['x', 'y', 'width', 'height'].forEach((key, i) => node.setAttribute(key, String(box[i])));
      node.setAttribute('data-align', box[4] || 'center');
    }
  }
  const show = (node, visible) => (visible ? node.removeAttribute('hidden') : node.setAttribute('hidden', ''));

  // One draw for every frame, from the state alone: no DOM measurement, no history.
  function draw(s) {
    const g = LAYOUT[mode], ly = g.line, parts = [];
    const push = html => parts.push(html);
    const line = (x1, x2, cls, extra = '') =>
      push(`<line x1="${num(x1)}" y1="${ly}" x2="${num(x2)}" y2="${ly}" class="${cls}"${extra}></line>`);
    // Scenery: three dim edges, rim to rim.
    g.edges.forEach(([a, b], k) => line(a, b, 'oc-edge', ` data-edge="${k + 1}"`));
    // The forward pass inks each edge left to right; no arrowheads, the fill is the direction.
    g.edges.forEach(([a, b], k) => line(a, a + (b - a) * s.legs[k], 'oc-ink', ` data-ray="f${k}" data-progress="${s.legs[k]}"`));
    // Blame walks the same edges right to left; one head, at the point it has reached.
    s.sweep.forEach((p, j) => {
      const [a, b] = g.edges[2 - j], tip = b - (b - a) * p;
      line(b, tip, 'oc-blame', ` data-ray="b${j}" data-progress="${p}"`);
      if (p > 0) push(`<path d="M${num(tip)} ${ly} L${num(tip + 14)} ${ly - 7} L${num(tip + 14)} ${ly + 7} Z" class="oc-blame-head" data-arrow="b${j}"></path>`);
    });
    // Ghosts: the height the nudge had at each node it has passed, in the same orange.
    NODES.forEach((name, k) => {
      if (!s.ghosts[k]) return;
      const h = inc[k] * g.px;
      push(`<rect data-ghost="${name}" x="${num(g.barX[k] - g.barW / 2)}" y="${num(ly - h)}" width="${g.barW}" height="${h.toFixed(6)}" rx="2" class="oc-ghost" opacity="${s.ghostOpacity}"></rect>`);
    });
    // The one object: the nudge, drawn under the node dots.
    if (s.bar) {
      const h = s.bar.size * g.px, next = Math.min(s.bar.node + 1, 3);
      const x = g.barX[s.bar.node] + s.bar.frac * (g.barX[next] - g.barX[s.bar.node]);
      push(`<rect data-bar x="${num(x - g.barW / 2)}" y="${num(ly - h)}" width="${g.barW}" height="${h.toFixed(6)}" rx="2" class="oc-bar" opacity="${num(s.bar.opacity)}"></rect>`);
    } else {
      push(`<rect data-bar hidden x="${num(g.barX[3] - g.barW / 2)}" y="${ly}" width="${g.barW}" height="0" rx="2" class="oc-bar"></rect>`);
    }
    // The dial: five ticks, a ghost needle at the home position while w is away, the needle.
    const cx = g.nx[0], r = g.dial;
    push('<g data-dial>');
    push(`<circle cx="${cx}" cy="${ly}" r="${r}" class="oc-dial"></circle>`);
    for (let i = 0; i < 5; i++) {
      const length = i === 2 ? 10 : 6;
      push(`<line data-tick x1="${cx}" y1="${ly - r}" x2="${cx}" y2="${ly - r + length}" class="oc-tick" transform="rotate(${-60 + 30 * i} ${cx} ${ly})"></line>`);
    }
    push(`<line data-ghost-needle${s.ghostNeedle ? '' : ' hidden'} x1="${cx}" y1="${ly}" x2="${cx}" y2="${ly - g.needle}" class="oc-needle oc-needle-ghost" transform="rotate(${num(angleOf(W0))} ${cx} ${ly})"></line>`);
    push(`<line data-needle x1="${cx}" y1="${ly}" x2="${cx}" y2="${ly - g.needle}" class="oc-needle" transform="rotate(${num(angleOf(s.liveW))} ${cx} ${ly})"></line>`);
    push(`<circle cx="${cx}" cy="${ly}" r="3.5" class="oc-hub"></circle>`);
    push('</g>');
    // The three nodes, lit as their values arrive.
    ['z', 'a', 'L'].forEach((name, i) => {
      const k = i + 1;
      push(`<circle data-node="${name}" cx="${g.nx[k]}" cy="${ly}" r="${g.dot}" class="oc-dot ${s.shown[k] ? `oc-${name}` : 'oc-dim'}"></circle>`);
    });
    // The values: plain text in the node colour, tabular digits; "·" until computed.
    NODES.forEach((name, k) => {
      push(`<text data-value="${name}" x="${g.nx[k]}" y="${g.valueY}" text-anchor="middle" class="oc-value ${s.shown[k] ? `oc-${name}` : 'oc-withheld'}">${s.shown[k] ? s.values[k] : '·'}</text>`);
    });
    return parts.join('');
  }

  const W = text => `<span class="oc-w">${text}</span>`, Lw = text => `<span class="oc-L">${text}</span>`;
  const A = text => `<span class="oc-a">${text}</span>`, Xb = text => `<span class="oc-x">${text}</span>`;
  // One caption per beat, at most twenty words, saying what is happening now. Every
  // number in it is the declared fixture or the arithmetic above.
  const CAPTIONS = [
    `Turn ${W('<i>w</i>')} up by ${W(String(DW))}. Does ${Lw('<i>L</i>')} rise or fall, and by how much per unit of ${W('<i>w</i>')}?`,
    'Forward, left to right: each value is computed from the one before it and kept.',
    `The ${W('nudge')} doubles at the first edge, shrinks at the next two, and arrives as a rise of ${Lw(inc[3].toFixed(6))}.`,
    `Measured: ${Lw(inc[3].toFixed(6))} per ${W(DW.toFixed(3))}, so ${Lw(measured.toFixed(6))} per unit of ${W('<i>w</i>')}. That is the number to reproduce.`,
    `${W('<i>w</i>')} returns to ${W(W0.toFixed(3))}. The first edge reports its slope, ${Lw(locals[0].toFixed(6))}, read off the kept value.`,
    `The second edge reports its slope, ${A(locals[1].toFixed(6))}, from the kept ${A('<i>a</i>')} — not from the turned one.`,
    `The third edge reports its slope, ${Xb(`<i>x</i> = ${plain(X)}`)}. Three factors, each read off the tape.`,
    `${Lw(product.toFixed(6))} beside ${Lw(measured.toFixed(6))}: three decimals agree. A finite difference is not the derivative.`,
    'Nothing was updated. Forward computes and keeps; backward reuses and multiplies.'
  ];

  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const stage = stageAt(time);
    // Under reduced motion the picture is the beat's still: the bar parked, the rays
    // arrived whole, the dial snapped to 0.710 for the two beats that turn it.
    const s = stateAt(reducedMotion ? SNAP[stage] : time);
    const live = forward(s.liveW);
    // Publish the state the tests read. dataset.stage is the shared handle; the fixture
    // attributes are not overwritten, so the declared numbers stay readable while w moves.
    root.dataset.stage = String(stage);
    root.dataset.liveW = String(s.liveW);
    root.dataset.forward = JSON.stringify([live.z, live.a, live.L]);
    root.dataset.cached = JSON.stringify([cache.z, cache.a, cache.L]);
    root.dataset.locals = JSON.stringify(locals);
    root.dataset.product = String(product);
    root.dataset.measured = String(measured);
    root.dataset.revealed = String(s.factors.filter(Boolean).length);
    root.dataset.arrival = JSON.stringify(s.arrival);
    root.dataset.ghosts = String(s.ghosts.filter(Boolean).length);

    // Redraw only when the picture actually changes, and only from the geometry table.
    const html = draw(s);
    if (html !== previousHtml) { previousHtml = html; drawing.innerHTML = html; }
    const named = NODES.map((name, k) => `${name} = ${s.shown[k] ? s.values[k] : 'not yet computed'}`).join(', ');
    const description = `One chain, w to z to a to L. ${named}.`
      + (s.ratio ? ` Measured slope ${measured.toFixed(6)}.` : '')
      + (s.prod ? ` Chain rule product ${product.toFixed(6)}.` : '');
    if (svg.getAttribute('aria-label') !== description) svg.setAttribute('aria-label', description);

    // Reveal, never fake: a typeset label the mechanism has not reached is absent.
    const visible = {
      dw: s.ghosts[0], dz: s.ghosts[1], da: s.ghosts[2], dL: s.ghosts[3],
      'dw-n': s.ghosts[0], 'dz-n': s.ghosts[1], 'da-n': s.ghosts[2], 'dL-n': s.ghosts[3],
      'fac-3': s.factors[0], 'der-3': s.factors[0], 'fac-2': s.factors[1], 'der-2': s.factors[1],
      'fac-1': s.factors[2], 'der-1': s.factors[2], ratio: s.ratio, prod: s.prod
    };
    for (const [name, node] of Object.entries(labels)) show(node, visible[name] !== false);
    // The formula is animated by state: classes on its wrapper, TeX untouched.
    formula.classList.toggle('is-shown', s.formula);
    formula.classList.toggle('is-f3', s.factors[0]);
    formula.classList.toggle('is-f2', s.factors[1]);
    formula.classList.toggle('is-f1', s.factors[2]);
    formula.classList.toggle('is-prod', s.prod);

    // A polite live region must be written only when it changes; render() runs every frame.
    const sentence = CAPTIONS[stage];
    if (captionKey !== sentence) { captionKey = sentence; caption.innerHTML = sentence; }

    // Scrubber-only wording: the caption sentence is already spoken by the live region, so
    // aria-valuetext names the stage and the numbers on the picture instead of repeating it.
    return `${STAGES[stage]}. w = ${s.liveW.toFixed(3)}.`
      + (s.shown[3] ? ` L = ${s.values[3]}.` : '')
      + (s.ratio ? ` Measured slope ${measured.toFixed(6)}.` : '')
      + (s.prod ? ` Chain rule ${product.toFixed(6)}.` : '');
  }

  // One typeset call after mount, guarded. MathJax's lazyAlwaysTypeset list already covers
  // span[id^="eq-"], so on the book page the labels are normally typeset before this runs
  // and the call is skipped; it is here for a page that opened the disclosure before
  // MathJax finished, and for a span the fixture check above had to rewrite. Without
  // MathJax the TeX source stays readable, as everywhere else in the book, and
  // data-typeset says which happened. The TeX is never touched during playback.
  function typeset() {
    const done = () => { root.dataset.typeset = root.querySelector('mjx-container') ? 'mathjax' : 'none'; };
    const mathjax = window.MathJax;
    if (mathjax && typeof mathjax.typesetPromise === 'function') {
      // A rewritten span is typeset through its parent (the label box or the formula
      // line), which is how MathJax is handed a container to search rather than the
      // math node itself.
      const targets = rewritten.length ? [...new Set(rewritten.map(name => spans[name].parentElement))]
        : root.querySelector('mjx-container') ? [] : [root];
      if (!targets.length) { done(); return; }
      if (rewritten.length && typeof mathjax.typesetClear === 'function') mathjax.typesetClear(targets);
      mathjax.typesetPromise(targets).then(done, done);
      return;
    }
    done();
    // The page's math script loads asynchronously and this scene mounts as soon as the
    // disclosure opens, so MathJax may still be on its way: its lazy typesetter will handle
    // the spans itself, and the report is refreshed once the page has finished loading.
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => {
        const startup = window.MathJax && window.MathJax.startup;
        if (startup && startup.promise) startup.promise.then(done, done); else done();
      }, {once: true});
    }
  }

  // The picture's accessible name is composed from the declared fixture, so the panel
  // holds no second copy of the witness numbers: moving the fixture moves this sentence.
  const title = `One line, four nodes: a dial w at ${W0.toFixed(3)}, then z = ${cache.z.toFixed(3)}, `
    + `a = ${cache.a.toFixed(6)} and L = ${cache.L.toFixed(6)}, with x = ${plain(X)}, b = ${minus(String(B))} `
    + `and y = ${Y} written on the edges. A nudge of ${minus(signedTex(inc[0], 3))} in w is doubled to `
    + `${minus(signedTex(inc[1], 3))} at z, shrunk to ${minus(signedTex(inc[2], 6))} at a and `
    + `${minus(signedTex(inc[3], 6))} at L; the measured slope ${measured.toFixed(6)} stands over the `
    + `chain-rule product ${locals.map(plain).join(' times ')} = ${product.toFixed(6)}.`;
  const named = svg.querySelector('title');
  if (named && named.textContent !== title) named.textContent = title;

  measure();
  window.BookPlayback(root, render, () => { measure(); previousHtml = ''; render(lastTime, reduced); });
  typeset();
})();
