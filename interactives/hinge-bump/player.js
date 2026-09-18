(() => {
  const root = document.getElementById('hinge-bump-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  // The panel is the one in-repo mirror of the manuscript fixture
  // (chapters/part1/03-nonlinearity-mlp.qmd:248-252, the `hinge-bump-values` cell): the
  // domain of xs, the three breakpoints of h1, h2, h3 and the three coefficients of `bump`.
  // interactives/manifest.json names those literals and scripts/audit_excerpt_fixtures.py
  // keeps the chapter and this panel together, so nothing below retypes a number the
  // manuscript owns.
  const numbers = name => root.dataset[name].trim().split(/\s+/).map(Number);
  const [X0, X1] = numbers('domain'), BREAKS = numbers('breaks'), COEFS = numbers('coefs');
  if (BREAKS.length !== 3 || COEFS.length !== 3 || !(X0 < X1)) throw Error('hinge-bump: the declared fixture is not three hinges on a domain');
  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = svg.querySelector('[data-drawing]'), caption = $('[data-caption]'), named = svg.querySelector('title');
  const slider = $('[data-c-slider]'), readout = $('[data-c-readout]');
  // Scripts-off readers get a second, narrow print. Live playback draws once at its
  // measured layout, so discard that print before collecting any scene marks.
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const tags = {};
  for (const node of svg.querySelectorAll('foreignObject[data-tag]')) tags[node.dataset.tag] = node;
  // Beats are declared on the pane, so the timeline is stated once. There is no stage strip:
  // the beats are named here, in data-beats order, and the transcript lists them in the same
  // order. Ramps and Predict are holds, Add draws the sum on, Fold is the one glide -- the
  // coefficient's sweep -- and it lands exactly at the beat it leads into, Lock.
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration || beats[beats.length - 1]);
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);
  const STAGES = ['Ramps', 'Add', 'Predict', 'Fold', 'Lock'];
  const clamp = value => Math.max(0, Math.min(1, value));
  const lerp = (a, b, u) => a + (b - a) * u;
  // The film's easings (6050-Ch3/lecture.jsx: Easing.easeInOutCubic for the coefficient
  // swing, easeOutCubic for a mark entering). The pen that draws the sum on runs at constant
  // speed, so the three slope entries arrive evenly as it crosses the three breakpoints.
  const cubicInOut = u => { const v = clamp(u); return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; };
  const outCubic = u => 1 - Math.pow(1 - clamp(u), 3);
  let lastTime = 0, reduced = false, previousKey = '', captionKey = '', mode = 'wide', override = null, scenery = null;

  // --- The scene's own arithmetic ----------------------------------------------------
  // torch.relu(xs - b): zero up to the breakpoint, then a ramp of slope one. The chapter's
  // bump is sum_k COEFS[k] h_k(x). This panel frees exactly one of those three numbers, the
  // middle coefficient c, and draws g_c(x) = COEFS[0] h1 + c h2 + COEFS[2] h3 -- a declared
  // computed variant, which is the chapter's bump at c = COEFS[1] and at no other value.
  const hinge = (k, x) => Math.max(0, x - BREAKS[k]);
  const sumAt = (c, x) => COEFS[0] * hinge(0, x) + c * hinge(1, x) + COEFS[2] * hinge(2, x);
  const bumpAt = x => sumAt(COEFS[1], x);
  // The slope ledger: each hinge, as x passes its breakpoint, adds its coefficient to the
  // running slope. Before the first breakpoint nothing has switched on.
  const slopesOf = c => [0, COEFS[0], COEFS[0] + c, COEFS[0] + c + COEFS[2]];
  const FINAL = slopesOf(COEFS[1]);
  const PEAK_X = BREAKS[1], PEAK = bumpAt(PEAK_X);
  const EDGES = [X0, ...BREAKS, X1];
  const MID = k => (EDGES[k] + EDGES[k + 1]) / 2;
  // The control. C_STAR is the chapter's coefficient; C_START = +1 is a bare ramp, so the
  // first frame's three plain hinges ARE the three terms at the control's starting value and
  // the dashed line is c h2 at every instant, never a drawing device. The range runs one unit
  // past the chapter's value, so the reader can overshoot as well as undershoot.
  const C_STAR = COEFS[1], C_START = 1, C_MIN = C_STAR - 1, C_MAX = C_START;
  const locks = c => Math.abs(c - C_STAR) < 1e-9;
  const MINUS = '−';
  // Every printed number: a true minus sign, and either the at-rest spelling (-2, -1.25,
  // -0.5) or, while the timeline glides, two fixed decimals so the entry keeps its width.
  const magnitude = (value, gliding) => gliding ? Math.abs(value).toFixed(2) : String(Number(Math.abs(value).toFixed(2)));
  const signed = (value, gliding = false) => {
    const text = magnitude(value, gliding);
    return Number(text) === 0 ? text : value < 0 ? `${MINUS}${text}` : `+${text}`;
  };
  const plain = value => { const text = magnitude(value, false); return value < 0 && Number(text) !== 0 ? `${MINUS}${text}` : text; };

  // --- Choreography ----------------------------------------------------------------
  // Seconds. Ramps: the three hinges and the pale target stand; nothing moves. Add: a pen
  // draws the plain sum on from the left, and each slope is written as the pen crosses the
  // breakpoint that sets it. Predict: a hold; the caption asks for the coefficient. Fold: the
  // coefficient sweeps from +1 down to the chapter's value and the sum's last two pieces
  // swing with it; the sweep ends exactly at the Lock beat, so the frame an arrow key parks
  // on there is the landed sum its caption names. Lock: the peak, the window bracket and the
  // formula arrive, then the ramps step back.
  const T = {
    word: {fade: 0.8},
    add: {start: beats[1] + 0.5, draw: 5.5},
    fold: {start: beats[3] + 0.6, end: beats[4]},
    lock: {peak: beats[4] + 0.4, peakDur: 0.5, bracket: beats[4] + 1.0, bracketDur: 0.6,
      ghost: beats[4] + 3.0, ghostDur: 1.0}
  };
  const GHOST = 0.5;

  // The timeline's own state at a time. Under reduced motion each beat is one still: a hold
  // is itself, Add is its finished drawing, and Fold -- whose caption describes the swing --
  // is the finished swing, never a value in between.
  function timeline(time, reducedMotion) {
    const stage = stageAt(time);
    if (reducedMotion) {
      return {stage, c: stage >= 3 ? C_STAR : C_START, gliding: false, pen: stage >= 1 ? 1 : 0, word: stage >= 1 ? 0 : 1,
        peak: stage >= 4, peakIn: stage >= 4 ? 1 : 0, bracket: stage >= 4 ? 1 : 0, ramps: stage >= 4 ? GHOST : 1, wash: false, moving: false};
    }
    const within = (start, dur) => time > start && time < start + dur;
    const u = stage >= 4 ? 1 : stage === 3 ? cubicInOut((time - T.fold.start) / (T.fold.end - T.fold.start)) : 0;
    const c = u <= 0 ? C_START : u >= 1 ? C_STAR : lerp(C_START, C_STAR, u);
    const pen = stage >= 2 ? 1 : stage === 1 ? clamp((time - T.add.start) / T.add.draw) : 0;
    const word = stage >= 1 ? 1 - clamp((time - T.add.start) / T.word.fade) : 1;
    const peak = stage >= 4 && time >= T.lock.peak;
    const peakIn = peak ? outCubic((time - T.lock.peak) / T.lock.peakDur) : 0;
    const bracket = stage >= 4 ? clamp((time - T.lock.bracket) / T.lock.bracketDur) : 0;
    const ramps = stage >= 4 ? lerp(1, GHOST, clamp((time - T.lock.ghost) / T.lock.ghostDur)) : 1;
    const moving = within(T.add.start, T.add.draw) || within(T.fold.start, T.fold.end - T.fold.start)
      || within(T.lock.peak, T.lock.peakDur) || within(T.lock.bracket, T.lock.bracketDur) || within(T.lock.ghost, T.lock.ghostDur);
    return {stage, c, gliding: u > 0 && u < 1, pen, word, peak, peakIn, bracket, ramps, wash: stage >= 4 && time < T.lock.ghost, moving};
  }

  // --- Geometry ----------------------------------------------------------------------
  // One picture in drawing units. Above the plot, two short rows that are the ledger: on top
  // of each breakpoint rule the term that switches on there, and between the rules the slope
  // of the sum on that piece. Under the plot the three breakpoints as the only x ticks, and
  // the support bracket in a row of its own. Wide is the desktop figure; narrow (phone
  // widths) is the same picture in a smaller box with the type stepped down by player.css.
  const LAYOUT = {
    wide: {viewBox: '0 0 860 342', left: 58, right: 812, top: 54, bottom: 290, y: [-1.1, 3.6],
      termY: 20, slopeY: 43, ruleTop: 27, tickY: 310, bracketY: 334, yTickX: 46, peakDx: 12, peakDy: 15,
      tags: {x: [826, 222, 22, 26]}},
    narrow: {viewBox: '0 0 360 212', left: 26, right: 330, top: 34, bottom: 174, y: [-1.1, 3.6],
      termY: 12, slopeY: 27, ruleTop: 16, tickY: 190, bracketY: 207, yTickX: 20, peakDx: 8, peakDy: 11,
      tags: {x: [334, 130, 22, 22]}}
  };
  // Geometry is serialised at 0.0001 px so a last-bit libm difference cannot change the
  // byte-compared static print. The arithmetic above is never rounded.
  const num = value => Number(value.toFixed(4));

  // The only measurement in the file, called from layout() and once before mounting. It also
  // draws everything that depends on the fixture and the layout alone -- rules, ticks, the
  // target, the two fixed ramps -- once, as strings the per-frame draw reuses.
  function measure() {
    const width = figure.getBoundingClientRect().width || 780;
    mode = width < 600 ? 'narrow' : 'wide';
    const g = LAYOUT[mode];
    svg.setAttribute('viewBox', g.viewBox);
    for (const [name, [x, y, w, h]] of Object.entries(g.tags)) {
      if (!tags[name]) continue;
      tags[name].setAttribute('x', String(x)); tags[name].setAttribute('y', String(y));
      tags[name].setAttribute('width', String(w)); tags[name].setAttribute('height', String(h));
    }
    root.classList.toggle('is-stacked', mode === 'narrow');
    const [YMIN, YMAX] = g.y, W = g.right - g.left, H = g.bottom - g.top;
    const px = x => g.left + (x - X0) / (X1 - X0) * W;
    const py = y => g.bottom - (y - YMIN) / (YMAX - YMIN) * H;
    // Every curve here is piecewise linear with the declared breakpoints, so a polyline
    // through the domain ends and the breakpoints is the curve itself, not a sampling of it.
    const path = (fn, xs) => `M ${xs.map(x => `${num(px(x))},${num(py(fn(x)))}`).join(' L ')}`;
    const parts = [];
    parts.push(`<clipPath id="hb-plot"><rect x="${g.left}" y="${g.top}" width="${W}" height="${H}"></rect></clipPath>`);
    for (let v = Math.ceil(YMIN); v <= Math.floor(YMAX); v++)
      parts.push(`<line x1="${g.left}" y1="${num(py(v))}" x2="${g.right}" y2="${num(py(v))}" class="hb-rule${v === 0 ? ' is-axis' : ''}"></line>`);
    parts.push(`<text x="${g.yTickX}" y="${num(py(0) + 4)}" class="hb-tick" text-anchor="end">0</text>`);
    // Each breakpoint rule runs up out of the plot to the term written on top of it.
    for (const b of BREAKS) parts.push(`<line x1="${num(px(b))}" y1="${g.ruleTop}" x2="${num(px(b))}" y2="${g.bottom}" class="hb-break"></line>`);
    for (const b of BREAKS) parts.push(`<text x="${num(px(b))}" y="${g.tickY}" class="hb-tick is-break" text-anchor="middle">${plain(b)}</text>`);
    const support = [BREAKS[0], BREAKS[1], BREAKS[2]];
    scenery = {g, px, py, path, W, H, frame: parts.join(''),
      fixed: [0, 2].map(k => `<path d="${path(x => COEFS[k] * hinge(k, x), [BREAKS[k], X1])}" class="hb-hinge hb-hinge-${k}" data-hinge="${k}"></path>`),
      area: `${path(bumpAt, support)} Z`, edge: path(bumpAt, support)};
  }

  // One draw for every frame, from the state alone: no DOM measurement, no history.
  function draw(state) {
    const {c, gliding, pen, visible, word, peak, peakIn, bracket, ramps, locked} = state;
    const {g, px, py, path, W, frame, fixed, area, edge} = scenery;
    const parts = [frame];
    const text = (x, y, content, cls, anchor, attrs = '') =>
      parts.push(`<text x="${num(x)}" y="${num(y)}" class="${cls}" text-anchor="${anchor}"${attrs}>${content}</text>`);
    // The pen: the sum is drawn on from the left, and a hinge joins the ledger when the pen
    // reaches its breakpoint -- the same order in which it switches on along x.
    const penX = lerp(X0, X1, pen);
    const crossed = BREAKS.map(b => visible && (pen >= 1 || penX >= b));

    // The three terms, in the book's ink and told apart by line style, each drawn from its
    // own breakpoint: the two fixed ramps, and between them c h2, which is the ramp the
    // control turns. At the last beat the group steps back to a ghost.
    parts.push(`<g data-ramps="" opacity="${num(ramps)}"><g clip-path="url(#hb-plot)">${fixed[0]}`
      + `<path d="${path(x => c * hinge(1, x), [BREAKS[1], X1])}" class="hb-hinge hb-hinge-1" data-hinge="1"></path>${fixed[1]}</g></g>`);

    parts.push('<g clip-path="url(#hb-plot)">');
    // The target: the chapter's bump, standing from the first frame as a pale fill with a
    // light dashed edge over the support alone. It is the same green as the sum, because it
    // is the shape the sum is aiming at. When the sum lands on it the fill deepens and the
    // dashed edge, now under the heavy line, is dropped; turn c away and both return.
    parts.push(`<path d="${area}" class="hb-ghost-fill${locked ? ' is-locked' : ''}" data-silhouette=""></path>`);
    if (!locked) parts.push(`<path d="${edge}" class="hb-ghost-line" data-silhouette-line=""></path>`);
    // The one object the eye tracks: the running sum g_c, in the prediction's green.
    if (visible) {
      parts.push(`<clipPath id="hb-reveal-g"><rect x="${g.left}" y="0" width="${num(W * clamp(pen))}" height="${g.bottom + 40}"></rect></clipPath>`);
      parts.push(`<g clip-path="url(#hb-reveal-g)"><path d="${path(x => sumAt(c, x), EDGES)}" class="hb-sum" data-mark="sum"></path></g>`);
    }
    parts.push('</g>');

    // The ledger, row one: on top of each breakpoint rule, the term that switches on there.
    // A bare name until the pen has added it; then its coefficient, the middle one in the
    // control's heavier ink because it is the number the control turns.
    const coefs = [COEFS[0], c, COEFS[2]];
    BREAKS.forEach((b, k) => {
      const name = `h${['₁', '₂', '₃'][k]}`;
      const content = crossed[k]
        ? `<tspan class="hb-coef${k === 1 ? ' is-control' : ''}"${k === 1 ? ' data-value="coef"' : ''}>${signed(coefs[k], k === 1 && gliding)}</tspan> ${name}` : name;
      text(px(b), g.termY, content, `hb-term hb-term-${k}`, 'middle', ` data-term="${k}"`);
    });
    // Row two: between the rules, the slope of the sum on that piece -- the running total of
    // the coefficients to its left -- in the sum's green. The grey word names the row once.
    if (crossed[0]) text(px(MID(0)), g.slopeY, 'slope', 'hb-slope-label', 'middle', ' data-slope-label=""');
    const slopes = slopesOf(c);
    [1, 2, 3].forEach(piece => {
      if (!crossed[piece - 1]) return;
      text(px(MID(piece)), g.slopeY, signed(slopes[piece], piece > 1 && gliding), `hb-slope${piece === 3 && locked ? ' is-locked' : ''}`, 'middle',
        ` data-slope="" data-piece="${piece}" data-value="s${piece}"`);
    });

    // The caption's own word, on the mark it names, while the target stands alone; it retires
    // as the sum starts, and the peak value takes its place at the payoff.
    if (word > 0) text(px(PEAK_X) - g.peakDx, py(PEAK) - g.peakDy, 'bump', 'hb-ghost-label', 'end', ` data-target-label="" opacity="${num(word)}"`);
    // The peak: a bare numeral at the apex once the sum has locked. `g` is named by the
    // formula beneath the picture and 0.5 is the tick beneath the apex, so the sentence
    // g(0.5) = 2 is carried by the title and the aria-label.
    if (peak) text(px(PEAK_X) - g.peakDx, py(PEAK) - g.peakDy, `<tspan data-value="peak">${plain(PEAK)}</tspan>`, 'hb-peak', 'end', ` data-peak="" opacity="${num(peakIn)}"`);
    // The support: a bracket in its own row under the tick numerals, from the first
    // breakpoint to the last, where alone the locked sum is nonzero.
    if (bracket > 0) {
      const a = px(BREAKS[0]), b = px(BREAKS[2]), y = g.bracketY, span = (b - a) * clamp(bracket);
      parts.push(`<path d="M${num(a)} ${y - 5}V${y}H${num(a + span)}${bracket >= 1 ? `V${y - 5}` : ''}" class="hb-bracket" data-bracket=""></path>`);
    }
    return parts.join('');
  }

  // The picture's accessible description, composed from the declared fixture so the panel
  // holds no second copy of the witness numbers. Until the sweep has landed it says nothing
  // about where the coefficient ends up: a title is also a hover tooltip.
  const relu = k => `ReLU(x ${BREAKS[k] < 0 ? '+' : MINUS} ${plain(Math.abs(BREAKS[k]))})`;
  const opening = `A plot of x from ${plain(X0)} to ${plain(X1)}. Three hinges stand in ink: ${relu(0)} solid, ${relu(1)} dashed and ${relu(2)} dotted, `
    + 'each zero up to its breakpoint and climbing for ever after. Beside them, pale green, the finished bump stands as a target before it is built. '
    + 'Their running sum is drawn over it in green, the dashed ramp weighted by the coefficient c on the control; above the plot each ramp\'s term '
    + 'stands on its breakpoint and the slope of the sum is written over each piece.';
  const TITLES = {
    withheld: opening,
    full: `${opening} With c at ${signed(C_STAR)} the slopes are ${FINAL.map(v => signed(v)).join(', ')} and the sum lies on the target; `
      + `its peak g(${plain(PEAK_X)}) = ${plain(PEAK)} is written at the apex; and a bracket under the ticks marks `
      + `[${plain(BREAKS[0])}, ${plain(BREAKS[2])}], where alone the sum is nonzero.`
  };

  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const line = timeline(time, reducedMotion), stage = line.stage;
    // A dragged coefficient is a detour from the timeline: the whole picture is recomputed
    // from it -- the full sum, the full ledger, and the lock marks if and only if it locks.
    const dragged = override !== null;
    const c = dragged ? override : line.c, locked = locks(c);
    const visible = dragged || stage >= 1;
    const state = dragged
      ? {c, gliding: false, pen: 1, visible, word: 0, peak: locked, peakIn: 1, bracket: locked ? 1 : 0, ramps: 1, locked}
      : {c, gliding: line.gliding, pen: line.pen, visible, word: line.word, peak: line.peak, peakIn: line.peakIn,
        bracket: line.bracket, ramps: line.ramps, locked: locked && line.pen >= 1};
    // The answer -- the chapter's coefficient -- is public once the timeline has landed on it.
    const landed = locks(line.c);
    const slopes = slopesOf(c), tail = sumAt(c, X1);

    // Publish the state the tests read. The fixture attributes are never overwritten.
    root.dataset.stage = String(stage);
    root.dataset.c = String(c);
    root.dataset.override = dragged ? 'slider' : '';
    root.dataset.slopes = JSON.stringify(slopes);
    root.dataset.tail = String(tail);
    root.dataset.pen = String(state.pen);
    root.dataset.locked = String(state.locked);
    root.dataset.moving = String(!dragged && line.moving);
    // The formula line holds two static identities and shows one: the sum with the free
    // coefficient c while the sum can still miss, the chapter's own once it has locked.
    const classes = {'ask-formula': visible && !state.locked, 'show-formula': state.locked, 'wash-coef': line.wash && !dragged};
    for (let s = 0; s < beats.length; s++) root.classList.toggle(`stage-${s}`, s === stage);
    for (const [name, on] of Object.entries(classes)) root.classList.toggle(name, on);

    // Redraw only when the picture actually changes, and only from cached geometry.
    const stateKey = [mode, dragged, c, state.gliding, state.pen.toFixed(4), state.word.toFixed(3), state.peak, state.peakIn.toFixed(2),
      state.bracket.toFixed(3), state.ramps.toFixed(3), state.locked, visible].join('/');
    if (stateKey !== previousKey) {
      previousKey = stateKey;
      drawing.innerHTML = draw(state);
    }
    // The label describes the picture; the live numbers are the control's to announce. Only
    // the landed timeline states the witness values, which are the chapter's and not live.
    const picture = dragged
      ? `The sum is drawn for the coefficient on the control, over the pale target bump${locked ? ', and lies on it' : ''}. The control announces the values.`
      : `${STAGES[stage]}. ` + (stage === 0 ? 'Three ramps and the pale target bump. No sum yet.'
        : !landed ? `The green sum of the three ramps ${line.gliding ? 'swings down as the coefficient on the control falls' : 'climbs out of the plot'}; the pale target bump is not reached. The control announces the values.`
          : `The sum is ${[COEFS[0], C_STAR, COEFS[2]].map((v, k) => `${signed(v)} times h${k + 1}`).join(', ')}; slopes ${FINAL.map(v => signed(v)).join(', ')}.`
            + (line.peak ? ` Peak g(${plain(PEAK_X)}) = ${plain(PEAK)}.` : '')
            + (line.bracket >= 1 ? ` The sum is nonzero only on [${plain(BREAKS[0])}, ${plain(BREAKS[2])}].` : ''));
    if (svg.getAttribute('aria-label') !== picture) svg.setAttribute('aria-label', picture);
    const title = landed ? TITLES.full : TITLES.withheld;
    if (named && named.textContent !== title) named.textContent = title;

    // The control: the thumb, the readout and the one place the live values are spoken.
    // Pausing during a drag repaints from the timeline once; this restores the dragged value.
    slider.value = String(c);
    const shown = signed(c, state.gliding);
    if (readout.textContent !== shown) readout.textContent = shown;
    slider.setAttribute('aria-valuetext', `c = ${shown}. `
      + (visible && state.pen >= 1 ? `Slopes ${slopes.slice(1).map((v, i) => signed(v, i > 0 && state.gliding)).join(', ')}. `
        + (locked ? `The sum returns to zero at ${plain(BREAKS[2])} and stays. ` : `At x = ${plain(X1)} the sum stands at ${plain(tail)}, not zero. `) : '')
      + 'A more negative c tilts the last two pieces down.');

    // One caption per beat, saying what is happening now in plain words; while the reader
    // holds the control, one of three sentences that say which side of the lock they are on.
    // Every number in a caption is the declared fixture or a slope computed above.
    const green = word => `<span class="prediction-role">${word}</span>`;
    const ramp = word => `<span class="hinge-role">${word}</span>`;
    const sentence = dragged
      ? (locked ? `Locked: the last slope is exactly zero, so the ${green('sum')} stays on zero.`
        : c > C_STAR ? `Too little: the last slope is still positive, so the ${green('sum')} climbs away.`
          : `Too much: the last slope is negative, so the ${green('sum')} dives for ever.`)
      : [
        `Three ${ramp('ramps')} that only climb. How can their ${green('sum')} make this ${green('bump')}?`,
        `Add them. Each ${ramp('ramp')} adds its coefficient to the ${green('sum')}’s slope: only up.`,
        `Which coefficient on the middle ${ramp('ramp')} brings the ${green('sum')} back to zero, to stay?`,
        `Turn it down. Both later slopes fall with it, and the ${green('sum')}’s tail swings.`,
        `Only ${signed(C_STAR)} lands: slopes ${FINAL.slice(1).map(v => signed(v)).join(', ')}. Three endless ${ramp('ramps')}, one local ${green('bump')}.`][stage];
    // A polite live region must be written only when it changes; render() runs every frame.
    if (captionKey !== sentence) { captionKey = sentence; caption.innerHTML = sentence; }

    // Scrubber-only wording: it names the timeline's beat, which stays true during a detour.
    return `${STAGES[stage]}.`;
  }

  // The control is a detour, not a new default. Dragging pauses playback and recomputes the
  // picture from the dragged value; any timeline action -- play from a pause, a scrub, an
  // arrow-key beat -- resumes the timeline's own coefficient.
  function drag() {
    // Pausing redraws from the timeline once; capture the requested value first.
    const requested = Math.max(C_MIN, Math.min(C_MAX, Number(slider.value)));
    if (root.dataset.playing === 'true') $('[data-action="play"]').click();
    override = requested;
    render(lastTime, reduced);
  }
  slider.addEventListener('input', drag);
  slider.addEventListener('change', drag);
  pane.addEventListener('click', event => {
    if (event.target.closest('[data-action="play"]') && root.dataset.playing !== 'true') override = null;
  }, true);
  // The drag ends only when the transport really acts. This is the transport's own guard
  // (shared/playback.js): a key it ignores must leave the dragged coefficient alone.
  pane.addEventListener('keydown', event => {
    if (event.target !== pane || event.altKey || event.ctrlKey || event.metaKey) return;
    const toggles = [' ', 'k', 'K'].includes(event.key);
    if (toggles && (event.repeat || root.dataset.playing === 'true')) return;
    if (toggles || ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) override = null;
  }, true);

  // One typeset call after mount, guarded. MathJax's lazyAlwaysTypeset list already covers
  // span[id^="eq-"], so on the book page the formulas are normally typeset before this runs
  // and the call is skipped; it is here for a page that opened the disclosure before MathJax
  // finished. Without MathJax the TeX source stays readable, as everywhere else in the book,
  // and data-typeset says which happened. The TeX is never touched.
  function typeset() {
    const done = () => { root.dataset.typeset = root.querySelector('mjx-container') ? 'mathjax' : 'none'; };
    const mathjax = window.MathJax;
    if (mathjax && typeof mathjax.typesetPromise === 'function') {
      if (root.querySelector('mjx-container')) done(); else mathjax.typesetPromise([root]).then(done, done);
      return;
    }
    done();
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => {
        const startup = window.MathJax && window.MathJax.startup;
        if (startup && startup.promise) startup.promise.then(done, done); else done();
      }, {once: true});
    }
  }

  // The control's range follows the fixture: one unit past the chapter's coefficient below,
  // a bare ramp above. While the player runs the slider's own value text speaks c, so the
  // visible readout leaves the accessibility tree.
  slider.min = String(C_MIN); slider.max = String(C_MAX);
  $('[data-c-display]').setAttribute('aria-hidden', 'true');
  // Bound before the transport mounts, so it runs before the transport's own seek: the
  // scrubber is the timeline, and a scrub ends a detour.
  $('[data-controls] input[type="range"]').addEventListener('input', () => { override = null; });
  measure();
  window.BookPlayback(root, render, () => { measure(); previousKey = ''; render(lastTime, reduced); });
  typeset();
})();
