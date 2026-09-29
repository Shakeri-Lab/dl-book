// Reconstruction pins a decoder at the observed codes and nowhere else.
//
// Contract with interactives/shared/playback.js:
//   window.BookPlayback(root, render, layout?)
//   render(time, reduced) -> the scrubber's description; a pure function of
//     (time, reduced) and the dial that never measures the DOM.
//   layout() -> the only place that measures.
//
// One picture: the latent code z across, the decoded value up. Three rings are the observed
// codes at their targets; a dashed line is the unsupported draw. The tracked object is the
// decoded curve g_a(z) = z^2 + a z(z^2 - 1). The term z(z^2 - 1) is exactly zero at the three
// codes, so every multiple a leaves the rings on the curve while the curve swings everywhere
// else, and the value at the draw slides along g_a(0.5) = 0.25 - 0.375a. The chapter draws
// two members as two fixed curves, and two stills of this picture would show two members
// again. What the motion adds is the family: one continuous sweep in which the rings never
// leave the curve while the value at the draw keeps moving for as long as a does. The
// multiple a is the scene's one parameter control; it is a decoder parameter, so it wears
// the book's orange, and the timeline sweeps it for the passive viewer.
(() => {
  const root = document.getElementById('decoder-family-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  const numbersOf = name => root.dataset[name].trim().split(/\s+/).map(Number);
  // The panel is the one in-repo mirror of the decoder-ambiguity-audit cell
  // (chapters/interludes/making-pca-learnable.qmd): the observed codes, the chapter's
  // multiple (its g_2), the unsupported draw `random_code` and the range of `latent_grid`.
  // The sweep's lower end mirrors the chapter's multiple and is declared with it.
  const CODES = numbersOf('codes'), MULTIPLE = Number(root.dataset.multiple);
  const [A_LOW, A_HIGH] = numbersOf('sweep'), DRAW = Number(root.dataset.draw);
  const [Z_LOW, Z_HIGH] = numbersOf('grid');
  // observed_targets = observed_codes.square(), as the cell computes them.
  const TARGETS = CODES.map(z => z * z);
  // The chapter's vanishing term and the family it generates, with their slopes: a cubic in
  // z is drawn as one cubic Bezier segment, which is the curve itself, not a sampling of it.
  const term = z => z * (z * z - 1), termSlope = z => 3 * z * z - 1;
  const decode = (a, z) => z * z + a * term(z), decodeSlope = (a, z) => 2 * z + a * termSlope(z);
  const valueAt = a => decode(a, DRAW);
  // The largest gap at the observed codes, the quantity the cell prints as training_gap.
  const errorAt = a => Math.max(...CODES.map((z, k) => Math.abs(decode(a, z) - TARGETS[k])));
  const LEVELS = [...new Set(TARGETS)].sort((p, q) => p - q);
  const MID = Math.floor(CODES.length / 2);

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = svg.querySelector('[data-drawing]');
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const slider = $('[data-a-slider]'), readout = $('[data-a-readout]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration || beats.at(-1));
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);

  // Plain-text numbers: a true minus sign, never a hyphen. A value at the draw keeps the two
  // decimals the cell prints it with (f"{...:.2f}"); a declared number keeps its own spelling.
  const MINUS = '−';
  const signed = (v, text) => (v < 0 && Number(text) !== 0 ? MINUS : '') + text;
  const two = v => signed(v, Math.abs(v).toFixed(2));
  const plain = v => signed(v, String(Number(Math.abs(v).toFixed(4))));
  const list = values => `${values.slice(0, -1).map(plain).join(', ')} and ${plain(values.at(-1))}`;
  const Z = plain(DRAW), HIGH = plain(A_HIGH), LOW = plain(A_LOW);
  const SLIDE = `${plain(DRAW * DRAW)} ${term(DRAW) < 0 ? MINUS : '+'} ${plain(Math.abs(term(DRAW)))}a`;
  const TERM = `z(z² ${MINUS} 1)`;
  const ENDS = [valueAt(A_LOW), valueAt(A_HIGH)];
  const TOP = Math.max(...ENDS), BOTTOM = Math.min(...ENDS);

  const STAGES = ['Codes and targets', 'The vanishing term', 'Predict', 'Swing one way', 'Swing the other way',
    'The family', 'No limit', 'Pinned at the codes'];
  const CAPTIONS = [
    `Three codes, three targets. The decoder z² hits all three and sends z = ${Z} to ${two(valueAt(0))}.`,
    `The term ${TERM} is zero at every observed code.`,
    `Add any multiple a of that term. Does the error move? How far can z = ${Z} go?`,
    [`The multiple a rises from 0 to ${HIGH}. Watch the rings, and the value at z = ${Z}.`,
      `At a = ${plain(MULTIPLE)}, the chapter's second decoder: still zero error, and z = ${Z} decodes to ${two(valueAt(MULTIPLE))}.`],
    [`Now the multiple swings the other way, down to a = ${LOW}.`,
      `At a = ${LOW}: zero error again, and z = ${Z} decodes to ${two(valueAt(A_LOW))}.`],
    `Every multiple fits the codes; z = ${Z} slides along ${SLIDE}.`,
    `Larger multiples push the value further: reconstruction sets no limit at z = ${Z}.`,
    'Reconstruction pins the decoder at the codes and nowhere else.'
  ];
  const DRAGGED = 'Any multiple a keeps the curve on all three codes; between and beyond them it moves.';

  const num = value => String(Number(value.toFixed(4)));
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const ease = v => v * v * (3 - 2 * v);
  const seg = (f, a, b) => clamp01((f - a) / (b - a));
  const lerp = (a, b, u) => a + (b - a) * u;
  // The decoded value's axis holds every member of the swept family on the grid, with room
  // below for the arrow that says the draw's value can fall further still.
  const Y_LOW = -0.7, Y_HIGH = 3.45;
  // Wide: the desktop figure. Narrow (phone widths): a taller plot at native type size, the
  // labels moved to where the steeper curves leave room.
  const MODES = {
    wide: {viewBox: [713, 428], left: 56, right: 652, top: 46, bottom: 378, font: 12, small: 12, ring: 7, dot: 4.5,
      zero: 3.5, cap: 6, arrow: 30, head: 4.5, row: 34, titleX: 8, tickY: 396, axisY: 420, gap: 7,
      observedDy: 22, termDy: 20, error: {y: 0.8, over: 'ring'}},
    narrow: {viewBox: [296, 388], left: 26, right: 268, top: 42, bottom: 342, font: 11, small: 10, ring: 6, dot: 4,
      zero: 3, cap: 5, arrow: 26, head: 4, row: 30, titleX: 4, tickY: 358, axisY: 380, gap: 7,
      observedDy: 30, termDy: 34, error: {y: 1.45, over: 'draw', clear: 16}}
  };

  let lastTime = 0, reduced = false, previousKey = '', captionKey = '', mode = 'wide', override = null;
  function measure() { mode = (figure.getBoundingClientRect().width || 600) < 600 ? 'narrow' : 'wide'; }

  // Where the term leaves the bottom of the plot, found once by bisection: it is drawn from
  // there to the end of the grid, so the picture needs no clip path.
  const TERM_START = (() => {
    let lo = Z_LOW, hi = CODES[0];
    if (term(lo) >= Y_LOW) return lo;
    for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (term(mid) < Y_LOW) lo = mid; else hi = mid; }
    return hi;
  })();

  // Seconds within a beat, as fractions of it. Each glide lands at 2.8 s, so the value it
  // brings is held still for 2.2 s before the next beat, and the caption that states the
  // value arrives with it, never while the curve is still on its way.
  const GLIDE = 0.56, ARROWS = 0.24;
  // Everything the picture shows at one moment, as data.
  function timeline(stage, f) {
    const glide = ease(seg(f, 0, GLIDE)), landed = f >= GLIDE - 1e-9;
    const st = {stage, a: 0, landed: true, term: stage === 1 || stage === 2, error: stage >= 1,
      ghosts: stage >= 5 ? 2 : stage === 4 ? 1 : 0, bracket: stage >= 6 || (stage === 5 && landed),
      arrows: stage >= 7 ? 1 : stage === 6 ? ease(seg(f, 0, ARROWS)) : 0, told: true, pinned: stage === 7};
    if (stage === 3) Object.assign(st, {a: lerp(0, A_HIGH, glide), landed});
    if (stage === 4) Object.assign(st, {a: lerp(A_HIGH, A_LOW, glide), landed});
    if (stage === 5) st.a = lerp(A_LOW, 0, glide);
    return st;
  }

  function draw(st) {
    const g = MODES[mode], parts = [];
    const X = z => g.left + (z - Z_LOW) / (Z_HIGH - Z_LOW) * (g.right - g.left);
    const Y = v => g.bottom - (v - Y_LOW) / (Y_HIGH - Y_LOW) * (g.bottom - g.top);
    const text = (x, y, content, cls, anchor = 'start', extra = '', size = g.font) =>
      parts.push(`<text x="${num(x)}" y="${num(y)}" class="${cls}" font-size="${size}" text-anchor="${anchor}"${extra}>${content}</text>`);
    const path = (d, cls, extra = '') => parts.push(`<path class="${cls}" d="${d}"${extra}></path>`);
    const circle = (cx, cy, r, cls, extra = '') =>
      parts.push(`<circle class="${cls}" cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}"${extra}></circle>`);
    const cubic = (p, dp, z0, z1) => {
      const h = z1 - z0, p0 = p(z0), p1 = p(z1);
      return `M${num(X(z0))} ${num(Y(p0))}C${num(X(z0 + h / 3))} ${num(Y(p0 + h * dp(z0) / 3))} `
        + `${num(X(z1 - h / 3))} ${num(Y(p1 - h * dp(z1) / 3))} ${num(X(z1))} ${num(Y(p1))}`;
    };
    const member = a => cubic(z => decode(a, z), z => decodeSlope(a, z), Z_LOW, Z_HIGH);
    const xd = X(DRAW);

    // Scenery: the rules the targets sit on, the axis with a tick at every code and at the
    // draw, the two axis names, and the draw line itself.
    for (const v of LEVELS) path(`M${num(g.left)} ${num(Y(v))}H${num(g.right)}`, `df-rule${v === 0 ? ' is-zero' : ''}`);
    path(`M${num(g.left)} ${num(g.bottom)}H${num(g.right)}${[...CODES, DRAW].map(z => `M${num(X(z))} ${num(g.bottom)}v4`).join('')}`, 'df-axis');
    for (const v of LEVELS) text(g.left - 7, Y(v) + 4, plain(v), 'df-scenery', 'end', '', g.small);
    for (const z of [...CODES, DRAW]) text(X(z), g.tickY, plain(z), 'df-scenery', 'middle', '', g.small);
    text(g.titleX, g.row, 'decoded value', 'df-scenery', 'start', '', g.small);
    text((g.left + g.right) / 2, g.axisY, 'latent code <tspan class="df-symbol">z</tspan>', 'df-scenery', 'middle', '', g.small);
    path(`M${num(xd)} ${num(g.top)}V${num(g.bottom)}`, 'df-draw', ' data-mark="draw"');
    text(xd, g.row, 'unsupported draw', 'df-ink-text', 'middle', '', g.small);

    // The vanishing term, dashed, with its zeros ringed on the zero line: exactly the codes.
    if (st.term) {
      path(cubic(term, termSlope, TERM_START, Z_HIGH), 'df-term-curve', ' data-mark="term"');
      CODES.forEach((z, k) => circle(X(z), Y(0), g.zero, 'df-zero', ` data-mark="zero-${k}"`));
    }
    // Once both ends of the sweep are ghosts, the band between them is the whole family for
    // multiples between the two: g_a(z) is linear in a, so at every z the members span exactly
    // the interval between the ghosts. It closes at the three codes and opens between and
    // beyond them, widest past the outer codes, where the added term grows like z cubed.
    if (st.ghosts === 2) {
      const upper = member(A_HIGH), lower = cubic(z => decode(A_LOW, z), z => decodeSlope(A_LOW, z), Z_HIGH, Z_LOW);
      path(`${upper}L${lower.slice(1)}Z`, 'df-band', ' data-mark="envelope"');
    }
    // Ghosts: the family members the curve has left behind, at the two ends of the sweep.
    const ghosts = [[A_HIGH, 'high'], [A_LOW, 'low']].slice(0, st.ghosts);
    for (const [a, name] of ghosts) path(member(a), 'df-ghost', ` data-mark="ghost-${name}" data-a="${num(a)}"`);
    // The one tracked object: the decoded curve at the current multiple.
    path(member(st.a), 'df-curve', ` data-mark="curve" data-a="${num(st.a)}"`);
    // The observed codes at their targets. They never move; the curve always passes them.
    CODES.forEach((z, k) => circle(X(z), Y(TARGETS[k]), g.ring, `df-ring${st.pinned ? ' is-pinned' : ''}`, ` data-mark="ring-${k}"`));

    // On the draw line, the values the timeline's two ends reached, and past them the arrows
    // that say a larger multiple goes further.
    if (st.bracket) {
      const yt = Y(TOP), yb = Y(BOTTOM);
      path(`M${num(xd)} ${num(yt)}V${num(yb)}M${num(xd - g.cap)} ${num(yt)}H${num(xd + g.cap)}M${num(xd - g.cap)} ${num(yb)}H${num(xd + g.cap)}`,
        'df-bracket', ' data-mark="bracket"');
      if (st.arrows > 0) {
        const reach = g.arrow * st.arrows, up = yt - reach, down = yb + reach, h = g.head;
        path(`M${num(xd)} ${num(yt)}V${num(up + 1.6 * h)}M${num(xd)} ${num(yb)}V${num(down - 1.6 * h)}`, 'df-arrow',
          ` data-mark="arrows" data-reach="${num(reach)}"`);
        path(`M${num(xd)} ${num(up)}l${num(-h)} ${num(1.6 * h)}h${num(2 * h)}zM${num(xd)} ${num(down)}l${num(-h)} ${num(-1.6 * h)}h${num(2 * h)}z`, 'df-head');
      }
    }
    const v = valueAt(st.a), yv = Y(v);
    circle(xd, yv, g.dot, 'df-dot', ' data-mark="dot"');

    // Labels last, so their halos sit over the lines they cross.
    text(X(CODES[MID]), Y(TARGETS[MID]) + g.observedDy, 'observed', 'df-target-text', 'middle');
    if (st.term) text(X(Z_HIGH) - 2, Y(0) + g.termDy, TERM, 'df-ink-text', 'end', ' data-mark="term-label"');
    for (const [a, name] of ghosts) {
      // Each ghost is named beside the end where it climbs highest, clear of the other curves.
      const right = decode(a, Z_HIGH) >= decode(a, Z_LOW), end = right ? Z_HIGH : Z_LOW;
      text(right ? X(end) - g.gap : X(end) + g.gap, Y(decode(a, end)) + 9, `<tspan class="df-symbol">a</tspan> = ${plain(a)}`,
        'df-ink-text', right ? 'end' : 'start', ` data-mark="ghost-${name}-label"`);
    }
    text(g.right + 6, Y(decode(st.a, Z_HIGH)) + 4, `g<tspan class="df-sub" dy="3">a</tspan>`, 'df-symbol df-prediction-text', 'start',
      ' data-mark="curve-label"');
    if (st.error) {
      // Wide, the error sits among the three rings, over the middle one; narrow, where that
      // gap is too slim, it hangs above the rings, clear of the draw line.
      const e = g.error, words = `error at the codes: ${plain(errorAt(st.a))}`;
      if (e.over === 'ring') text(X(CODES[MID]), Y(e.y), words, 'df-residual-text', 'middle', ' data-value="error"', g.small);
      else text(xd - e.clear, Y(e.y), words, 'df-residual-text', 'end', ' data-value="error"', g.small);
    }
    if (st.bracket && st.told) {
      text(xd - g.gap, Y(TOP) - 1, two(TOP), 'df-ink-text df-number', 'end', ' data-value="top"');
      text(xd + g.gap, Y(BOTTOM) + g.font + 2, two(BOTTOM), 'df-ink-text df-number', 'start', ' data-value="bottom"');
    }
    // The live value sits just above the dot's center line, so a curve dipping under the draw
    // (as it does at the chapter's multiple) passes below the numerals, not through them. Where
    // the narrow plot would set it against the middle ring, it rises just clear of the ring and
    // waits there for the dot to come back up; the clamp is continuous, so it never jumps.
    const reach = xd - g.gap - 5 * 0.56 * g.font, ringX = X(CODES[MID]), ringY = Y(TARGETS[MID]);
    const base = reach < ringX + g.ring + 2 ? Math.min(yv - 1, ringY - g.ring - 3) : yv - 1;
    text(xd - g.gap, base, two(v), 'df-prediction-text df-number', 'end', ' data-value="draw"');
    return parts.join('');
  }

  // The picture's accessible description, composed from the declared fixture. While the
  // caption asks, it names nothing the reader is asked to predict; while a glide is on its
  // way, the live number is the control's to speak.
  const BASE = `Latent code z across, decoded value up. Rings mark the observed codes z = ${list(CODES)} at their targets `
    + `${list(TARGETS)}; a dashed line marks the unsupported draw z = ${Z}.`;
  const TERM_SAID = ` The dashed term ${TERM} crosses zero at each code. Error at the codes: ${plain(errorAt(0))}.`;
  const FAMILY = ` Dotted ghosts stay at a = ${HIGH} and a = ${LOW}; the curve is back at a = 0. Every member passes through all three rings. A shaded band between the ghosts holds every multiple between them; it closes at the three codes and widens between and beyond them.`;
  function describe(st, dragged) {
    if (dragged) return `${BASE} The decoded curve for the multiple on the control passes through all three rings. The control announces its value at the draw.`;
    const at = two(valueAt(st.a));
    return BASE + [
      ` The decoded curve z² passes through all three rings and decodes the draw to ${at}.`,
      ` The decoded curve z² passes through all three rings and decodes the draw to ${at}.${TERM_SAID}`,
      ` The decoded curve z² passes through all three rings and decodes the draw to ${at}.${TERM_SAID}`,
      st.landed ? ` At a = ${HIGH}, the chapter's second decoder, the curve still passes through all three rings: error at the codes ${plain(errorAt(st.a))}, and the draw decodes to ${at}.`
        : ` The multiple a rises toward ${HIGH} and the curve swings. The control announces the value at the draw.`,
      ` A dotted ghost stays at a = ${HIGH}. ` + (st.landed ? `At a = ${LOW} the curve still passes through all three rings, and the draw decodes to ${at}.`
        : `The curve swings the other way, toward a = ${LOW}. The control announces the value at the draw.`),
      FAMILY + (st.bracket ? ` At the draw a bracket marks ${two(BOTTOM)} to ${two(TOP)}; the value slides along ${SLIDE}.` : ` The value at the draw slides along ${SLIDE}.`),
      `${FAMILY} At the draw a bracket marks ${two(BOTTOM)} to ${two(TOP)}, with ${at} between, and arrows extend it beyond both ends: a larger multiple moves the value further, without limit.`,
      `${FAMILY} At the draw a bracket marks ${two(BOTTOM)} to ${two(TOP)}, with ${at} between, and arrows extend it beyond both ends. The rings, where every member agrees, are drawn heavier.`
    ][st.stage];
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
    const line = timeline(stage, f);
    // A dragged multiple redraws the picture from the dragged value: the scenery the timeline
    // has reached, the curve at the dragged a, and no fixed number that a live one could hide.
    const st = dragged ? {...line, a: override, landed: true, told: false, error: true} : line;

    root.dataset.stage = String(stage);
    root.dataset.a = String(st.a);
    root.dataset.override = dragged ? 'dial' : '';
    const key = [mode, JSON.stringify(st, (name, value) => (typeof value === 'number' ? Number(value.toFixed(4)) : value))].join('/');
    if (key !== previousKey) {
      previousKey = key;
      svg.setAttribute('viewBox', `0 0 ${MODES[mode].viewBox.join(' ')}`);
      drawing.innerHTML = draw(st);
      formula.classList.toggle('df-term-lit', !dragged && (stage === 1 || stage === 2));
      formula.classList.toggle('df-a-lit', dragged || (stage >= 2 && stage <= 6));
    }
    const picture = describe(st, dragged);
    if (svg.getAttribute('aria-label') !== picture) svg.setAttribute('aria-label', picture);

    // The dial: the thumb, the readout and the one place its live values are spoken.
    slider.value = String(st.a);
    const shown = two(st.a);
    if (readout.textContent !== shown) readout.textContent = shown;
    const error = errorAt(st.a);
    slider.setAttribute('aria-valuetext', `a = ${shown}: ${error === 0 ? 'zero error' : `error ${plain(error)}`} at the codes; `
      + `z = ${Z} decodes to ${two(valueAt(st.a))}.`);

    const entry = CAPTIONS[stage];
    const sentence = dragged ? DRAGGED : Array.isArray(entry) ? entry[st.landed ? 1 : 0] : entry;
    if (captionKey !== sentence) { captionKey = sentence; caption.textContent = sentence; }
    return `${STAGES[stage]}.`;
  }

  // The dial is a detour, not a new default. Dragging pauses playback and redraws the picture
  // at the dragged multiple; any timeline action -- play from a pause, a scrub, an arrow-key
  // beat -- returns to the timeline's own multiple.
  function drag() {
    const requested = Math.max(A_LOW, Math.min(A_HIGH, Number(slider.value)));
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
  // the dragged multiple alone.
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

  // The dial's range is the declared sweep. While the player runs, the slider's own value text
  // speaks the multiple, so the visible readout leaves the accessibility tree.
  slider.min = String(A_LOW); slider.max = String(A_HIGH);
  $('[data-a-display]').setAttribute('aria-hidden', 'true');
  // Bound before the transport mounts, so it runs before the transport's own seek: the
  // scrubber is the timeline, and a scrub ends a detour.
  $('[data-controls] input[type="range"]').addEventListener('input', () => { override = null; });
  measure();
  window.BookPlayback(root, render, () => { measure(); previousKey = ''; render(lastTime, reduced); });
  if (root.dataset.ready) slider.disabled = false;
  typeset();
})();
