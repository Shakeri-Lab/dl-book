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
  const drawing = svg.querySelector('[data-drawing]'), caption = $('[data-caption]');
  const tags = {};
  for (const node of svg.querySelectorAll('foreignObject[data-tag]')) tags[node.dataset.tag] = node;
  // Beats are declared on the pane, so the timeline is stated once. Every stage boundary is a
  // beat: that is what lets the arrow keys land where the mechanism changes. There is no stage
  // strip: the beats are named here, in data-beats order, and the transcript lists them in
  // the same order.
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration || beats[beats.length - 1]);
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);
  const STAGES = ['Target', 'Climb', 'Fold', 'Close', 'Hold'];
  const clamp = value => Math.max(0, Math.min(1, value));
  const lerp = (a, b, u) => a + (b - a) * u;
  // The film's easings (6050-Ch3/lecture.jsx MOTION.draw = easeInOutSine for a curve drawing
  // on, Easing.easeInOutCubic for the coefficient swing, easeOutCubic for a mark entering).
  const drawEase = u => { const v = clamp(u); return -(Math.cos(Math.PI * v) - 1) / 2; };
  const cubicInOut = u => { const v = clamp(u); return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; };
  const outCubic = u => 1 - Math.pow(1 - clamp(u), 3);
  let lastTime = 0, reduced = false, previousKey = '', captionKey = '', mode = 'wide';

  // --- The scene's own arithmetic ----------------------------------------------------
  // torch.relu(xs - b): zero up to the breakpoint, then a ramp of slope one. The running sum
  // is sum_k c_k * h_k(x) for whatever coefficients the timeline has admitted so far; the
  // manuscript's bump is the sum at the declared coefficients.
  const hinge = (k, x) => Math.max(0, x - BREAKS[k]);
  const sumAt = (c, x) => c.reduce((total, ck, k) => total + ck * hinge(k, x), 0);
  const bumpAt = x => sumAt(COEFS, x);
  // The slope of the running sum on each of its four linear pieces: before the first
  // breakpoint nothing has switched on; on piece k the first k hinges have.
  const slopesOf = c => [0, c[0], c[0] + c[1], c[0] + c[1] + c[2]];
  const FINAL = slopesOf(COEFS);
  const PEAK_X = BREAKS[1], PEAK = bumpAt(PEAK_X), LEVEL = bumpAt(X1);
  const EDGES = [X0, ...BREAKS, X1];
  const MID = k => (EDGES[k] + EDGES[k + 1]) / 2;
  // The samples the curves are drawn through: 161 points on the domain, chosen so that the
  // three breakpoints fall exactly on sample points and every piece is drawn straight.
  const N = 160, XS = Array.from({length: N + 1}, (_, i) => X0 + (X1 - X0) * i / N);
  const MINUS = '−';
  const signed = value => {
    const v = Math.abs(value) < 5e-4 ? 0 : value;
    const whole = Math.abs(v - Math.round(v)) < 5e-4;
    const text = whole ? String(Math.abs(Math.round(v))) : Math.abs(v).toFixed(1);
    return v < 0 ? `${MINUS}${text}` : v > 0 ? `+${text}` : '0';
  };
  const fixed = (value, digits) => {
    const text = Math.abs(value).toFixed(digits);
    return value < 0 && Number(text) !== 0 ? `${MINUS}${text}` : text;
  };
  const plain = value => fixed(value, Number.isInteger(value) ? 0 : 1);

  // --- Choreography ----------------------------------------------------------------
  // Seconds inside each beat. Every schedule finishes before its beat ends, so under reduced
  // motion the beat's end state is its whole state. The order is the restaged one: the target
  // silhouette and the three climbing ramps already stand at t = 0 (the question is the
  // picture, not a sentence); the sum draws on as h1; one eased amount swings the middle ramp
  // down to -2 h2 and folds the sum with it; h3 closes the bump onto the silhouette, which is
  // then consumed; the ramps step back to a ghost.
  const T = {
    target: {fade: 0.8},                                        // the word `bump` retires as the sum starts
    sum: {start: beats[1] + 0.4, draw: 2.2, slope: beats[1] + 3.0, fade: 0.5},
    fold: {start: beats[2] + 0.5, dur: 2.0, name: beats[2] + 3.0, fade: 0.5},
    close: {start: beats[3] + 0.4, dur: 2.0, consume: 0.8, slope: 0.8, peak: 1.3, peakDur: 0.5,
      bracket: 2.0, bracketDur: 0.6},
    hold: {start: beats[4] + 0.4, dur: 1.0}
  };

  // --- Geometry ----------------------------------------------------------------------
  // One picture in drawing units: the plot of x from X0 to X1, the three breakpoints as the
  // only x ticks in a row below it, and the support bracket in its own row below those (a row
  // of its own, so it never runs through a tick numeral). Wide is the desktop figure; narrow
  // (phone widths) is the same plot in a smaller box with the type stepped down by player.css.
  const LAYOUT = {
    wide: {viewBox: '0 0 860 306', left: 58, right: 812, top: 40, bottom: 252, y: [-1.1, 3.1],
      tickY: 272, bracketY: 296, yTickX: 46, foot: [9, 19], slopeDx: 17, slopeDy: 11, peakDx: 12, peakDy: 15,
      tags: {x: [826, 184, 22, 26]}},
    narrow: {viewBox: '0 0 360 192', left: 26, right: 330, top: 26, bottom: 152, y: [-1.1, 3.1],
      tickY: 170, bracketY: 188, yTickX: 20, foot: [6, 13], slopeDx: 11, slopeDy: 8, peakDx: 8, peakDy: 11,
      tags: {x: [334, 108, 22, 22]}}
  };
  const num = value => Number(value.toFixed(2));

  // The only measurement in the file, called from layout() and once before mounting.
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
  }

  // One draw for every frame, from the state alone: no DOM measurement, no history.
  function draw(state) {
    const {stage, ramps, ramp2, sumReveal, c, entries, label, silhouette, word, peak, peakIn, bracket} = state;
    const g = LAYOUT[mode];
    const [YMIN, YMAX] = g.y, W = g.right - g.left, H = g.bottom - g.top;
    const px = x => g.left + (x - X0) / (X1 - X0) * W;
    const py = y => g.bottom - (y - YMIN) / (YMAX - YMIN) * H;
    const parts = [];
    const text = (x, y, content, cls, anchor, attrs = '') =>
      parts.push(`<text x="${num(x)}" y="${num(y)}" class="${cls}" text-anchor="${anchor}"${attrs}>${content}</text>`);
    // A curve is drawn through the samples of the span it actually occupies. A ramp starts at
    // its own breakpoint (it is zero before it, and drawing that zero would lay a third dash
    // pattern along the axis); the silhouette's stroke stops at the support, so outside the
    // window the only ink on the zero line is the axis rule itself.
    const path = (fn, from = X0, to = X1) =>
      `M ${XS.filter(x => x >= from - 1e-9 && x <= to + 1e-9).map(x => `${num(px(x))},${num(py(fn(x)))}`).join(' L ')}`;

    // Scenery: the plot's clip, the faint integer rules with the zero line heavier, the three
    // breakpoints as dashed rules and as the only x-tick numerals, and the one y tick that a
    // reader needs -- zero, the level the bump returns to.
    parts.push(`<clipPath id="hb-plot"><rect x="${g.left}" y="${g.top}" width="${W}" height="${H}"></rect></clipPath>`);
    for (let v = Math.ceil(YMIN); v <= Math.floor(YMAX); v++)
      parts.push(`<line x1="${g.left}" y1="${num(py(v))}" x2="${g.right}" y2="${num(py(v))}" class="hb-rule${v === 0 ? ' is-axis' : ''}"></line>`);
    text(g.yTickX, py(0) + 4, '0', 'hb-tick', 'end');
    for (const b of BREAKS) parts.push(`<line x1="${num(px(b))}" y1="${g.top}" x2="${num(px(b))}" y2="${g.bottom}" class="hb-break"></line>`);
    for (const b of BREAKS) text(px(b), g.tickY, plain(b), 'hb-tick is-break', 'middle');

    // The three hinges, in the book's ink and told apart by line style, each drawn from its
    // own breakpoint; the middle one carries the swing that turns it into -2 h2. At the last
    // beat the whole group steps back to a ghost: the scenery retires and the bump is alone.
    const scale = [1, ramp2, 1];
    parts.push(`<g data-ramps="" opacity="${num(ramps)}">`);
    parts.push('<g clip-path="url(#hb-plot)">');
    BREAKS.forEach((b, k) => parts.push(`<path d="${path(x => scale[k] * hinge(k, x), b)}" class="hb-hinge hb-hinge-${k}" data-hinge="${k}"></path>`));
    parts.push('</g>');
    // Curve identities at reading size, each at the foot of its ramp: just under the axis, to
    // the left of the breakpoint where the hinge switches on. That corner is empty at every
    // coefficient -- the hinge is zero there, and the sum sits on or above the axis to the
    // left of each breakpoint -- so the name never crosses a curve. (The film names its curves
    // at their ends; on this smaller board the ends collide with the ticks and each other.)
    BREAKS.forEach((b, k) => {
      const name = `h${['₁', '₂', '₃'][k]}`;
      const content = k === 1 && label ? `<tspan data-value="coef">${signed(COEFS[1])}</tspan> ${name}` : name;
      text(px(b) - g.foot[0], py(0) + g.foot[1], content, `hb-hinge-label hb-hinge-label-${k}`, 'end', ` data-hinge-label="${k}"`);
    });
    parts.push('</g>');

    parts.push('<g clip-path="url(#hb-plot)">');
    // The target: the finished bump, drawn before it is built, as a pale fill with a light
    // dashed edge over the support alone. It is the same green as the sum, because the sum
    // lands on it; it is fill-dominant and the sum is the only heavy line, so the two never
    // read as two curves. It is consumed once the sum has reached it.
    if (silhouette > 0) {
      const area = `M ${num(px(BREAKS[0]))},${num(py(0))} ` + XS.filter(x => x >= BREAKS[0] && x <= BREAKS[2])
        .map(x => `L ${num(px(x))},${num(py(bumpAt(x)))}`).join(' ') + ` L ${num(px(BREAKS[2]))},${num(py(0))} Z`;
      parts.push(`<path d="${area}" class="hb-ghost-fill" data-silhouette="" opacity="${num(silhouette)}"></path>`);
      parts.push(`<path d="${path(bumpAt, BREAKS[0], BREAKS[2])}" class="hb-ghost-line" data-silhouette-line="" opacity="${num(silhouette)}"></path>`);
    }
    // The one object the eye tracks: the running sum, in the prediction's green, drawn on
    // once as h1 and afterwards re-shaped by every coefficient that joins it.
    if (stage >= 1) {
      parts.push(`<clipPath id="hb-reveal-g"><rect x="${g.left}" y="0" width="${num(W * clamp(sumReveal))}" height="${g.bottom + 40}"></rect></clipPath>`);
      parts.push(`<g clip-path="url(#hb-reveal-g)"><path d="${path(x => sumAt(c, x))}" class="hb-sum" data-mark="sum"></path></g>`);
    }
    parts.push('</g>');

    // The caption's own word, on the mark it names, for the one beat where the target stands
    // alone; it retires as the sum starts, and the peak value takes its place at the payoff.
    if (word > 0) text(px(PEAK_X) - g.peakDx, py(PEAK) - g.peakDy, 'bump', 'hb-ghost-label', 'end', ` data-target-label="" opacity="${num(word)}"`);

    // The slopes: never a banked row of four, but the one or two the beat is about, written in
    // the sum's green against the piece they measure. The grey word `slope` rides the first
    // entry, so the number is named without a heading of its own.
    entries.forEach(({piece, dx, dy, anchor}, index) => {
      const mid = MID(piece);
      const head = index === 0 ? '<tspan class="hb-slope-label">slope </tspan>' : '';
      text(px(mid) + dx, py(sumAt(c, mid)) + dy, `${head}${signed(slopesOf(c)[piece])}`, 'hb-slope', anchor,
        ` data-slope="" data-piece="${piece}" data-value="s${piece}"`);
    });

    // The peak: the bump's height, at its apex, once the bump is complete. A bare numeral --
    // `g` is named by the formula directly beneath the picture and 0.5 is the tick directly
    // beneath the apex, so the sentence g(0.5) = 2 is carried by the title and the aria-label
    // instead of spending three numbers on one fact.
    if (peak) text(px(PEAK_X) - g.peakDx, py(PEAK) - g.peakDy, `<tspan data-value="peak">${plain(PEAK)}</tspan>`, 'hb-peak', 'end', ` data-peak="" opacity="${num(peakIn)}"`);

    // The support: a bracket in its own row under the tick numerals, from the first breakpoint
    // to the last, where alone the sum is nonzero.
    if (bracket > 0) {
      const a = px(BREAKS[0]), b = px(BREAKS[2]), y = g.bracketY, span = (b - a) * clamp(bracket);
      parts.push(`<path d="M${num(a)} ${y - 5}V${y}H${num(a + span)}${bracket >= 1 ? `V${y - 5}` : ''}" class="hb-bracket" data-bracket=""></path>`);
    }
    return parts.join('');
  }

  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const stage = stageAt(time);
    // Under reduced motion the picture is the beat's end state: every reveal inside the beat
    // has happened and every coefficient stands at its beat value, never between.
    const held = reducedMotion ? (beats[stage + 1] === undefined ? duration : beats[stage + 1]) - 1e-6 : time;
    const between = (start, dur) => held > start && held < start + dur;
    // One eased amount drives the fold: the middle ramp swings from +h2 down to -2 h2 and the
    // sum admits it from 0 to -2 in the same motion, so the ramp turning over and the sum
    // folding are one thing seen twice. No intermediate value of either is ever written.
    const swing = stage >= 2 ? cubicInOut((held - T.fold.start) / T.fold.dur) : 0;
    const join3 = stage >= 3 ? drawEase((held - T.close.start) / T.close.dur) : 0;
    const c = [stage >= 1 ? COEFS[0] : 0, COEFS[1] * swing, COEFS[2] * join3];
    const ramp2 = lerp(1, COEFS[1], swing);
    const sumReveal = stage >= 1 ? drawEase((held - T.sum.start) / T.sum.draw) : 0;
    const label = stage >= 2 && held >= T.fold.name;
    const landed = T.close.start + T.close.dur;
    const done = stage >= 3 && held >= landed;
    const silhouette = done ? 1 - clamp((held - landed) / T.close.consume) : 1;
    const targetWord = stage >= 1 ? 1 - clamp((held - T.sum.start) / T.target.fade) : 1;
    // The slopes on the picture, per beat: +1 while the sum climbs, +1 and -1 once it folds,
    // and at the payoff the single 0 on the flat piece the bump has returned to. Every other
    // entry is retired as its beat ends; the full list 0, +1, -1, 0 stays in the transcript
    // and in the live aria-label.
    const flat = stage >= 3 && held >= landed + T.close.slope;
    const shown = flat ? [{piece: 0, anchor: 'middle', over: true}]
      : stage === 3 || (stage === 2 && held >= T.fold.name) ? [{piece: 1, anchor: 'end'}, {piece: 2, anchor: 'start'}]
        : stage >= 1 && held >= T.sum.slope ? [{piece: 1, anchor: 'end'}] : [];
    const g = LAYOUT[mode];
    const entries = shown.map(e => ({piece: e.piece, anchor: e.anchor,
      dx: e.anchor === 'end' ? -g.slopeDx : e.anchor === 'start' ? g.slopeDx : 0,
      dy: e.over ? -(g.slopeDy + 3) : -g.slopeDy}));
    const peakStart = landed + T.close.peak;
    const peak = stage >= 3 && held >= peakStart;
    const peakIn = peak ? outCubic((held - peakStart) / T.close.peakDur) : 0;
    const bracketStart = landed + T.close.bracket;
    const bracket = stage >= 3 ? clamp((held - bracketStart) / T.close.bracketDur) : 0;
    const ramps = stage >= 4 ? lerp(1, 0.5, clamp((held - T.hold.start) / T.hold.dur)) : 1;
    const moving = (stage >= 1 && between(T.sum.start, T.sum.draw)) || (stage >= 2 && between(T.fold.start, T.fold.dur))
      || (stage >= 3 && (between(T.close.start, T.close.dur) || between(landed, T.close.consume)
        || between(peakStart, T.close.peakDur) || between(bracketStart, T.close.bracketDur)))
      || (stage >= 4 && between(T.hold.start, T.hold.dur)) || (stage >= 1 && between(T.sum.start, T.target.fade));

    // Publish the state the tests read. dataset.stage is the shared handle; the fixture
    // attributes are not overwritten, so the declared hinges stay readable while the sum moves.
    root.dataset.stage = String(stage);
    root.dataset.coef = c.map(v => v.toFixed(4)).join(' ');
    root.dataset.ramp2 = ramp2.toFixed(4);
    root.dataset.slopes = JSON.stringify(slopesOf(c).map(v => Number(v.toFixed(4))));
    root.dataset.silhouette = silhouette.toFixed(4);
    root.dataset.moving = String(moving);
    const classes = {
      'show-formula': stage >= 2,
      'wash-coef': stage === 2
    };
    for (let s = 0; s < beats.length; s++) root.classList.toggle(`stage-${s}`, s === stage);
    for (const [name, on] of Object.entries(classes)) root.classList.toggle(name, on);

    // Redraw only when the picture actually changes, and only from cached geometry.
    const stateKey = [stage, mode, ramps.toFixed(3), ramp2.toFixed(4), sumReveal.toFixed(3),
      c.map(v => v.toFixed(4)).join(','), entries.map(e => `${e.piece}${e.anchor}`).join('+'), label,
      silhouette.toFixed(3), targetWord.toFixed(3), peak, peakIn.toFixed(2), bracket.toFixed(3)].join('/');
    if (stateKey !== previousKey) {
      previousKey = stateKey;
      drawing.innerHTML = draw({stage, ramps, ramp2, sumReveal, c, entries, label, silhouette, word: targetWord, peak, peakIn, bracket});
      const slopes = slopesOf(c).map(signed).join(', ');
      svg.setAttribute('aria-label', `${STAGES[stage]}.`
        + (silhouette > 0 ? ' The finished bump stands as a pale target.' : '')
        + (stage >= 1 ? ` The sum is ${c.map((v, k) => `${signed(v)} times h${k + 1}`).join(', ')}; slopes ${slopes}.` : ' No sum yet.')
        + (peak ? ` Peak g(${plain(PEAK_X)}) = ${plain(PEAK)}.` : '')
        + (bracket >= 1 ? ` The sum is nonzero only on [${plain(BREAKS[0])}, ${plain(BREAKS[2])}].` : ''));
    }

    // One caption per beat, at most fourteen words, saying what is happening now in plain
    // words. Every number in it is the declared fixture or a slope computed above.
    const green = word => `<span class="prediction-role">${word}</span>`;
    const ramp = word => `<span class="hinge-role">${word}</span>`;
    const sentence = [
      `Three ${ramp('ramps')} that only climb. How do they make this ${green('bump')}?`,
      `The ${green('sum')} starts as the first ${ramp('ramp')}: flat, then climbing at ${signed(COEFS[0])}.`,
      `The second ${ramp('ramp')} joins at ${signed(COEFS[1])}: past ${plain(BREAKS[1])} the ${green('sum')} falls at ${signed(COEFS[0] + COEFS[1])}.`,
      `The third ${ramp('ramp')} cancels the fall. The ${green('sum')} is flat at ${LEVEL === 0 ? 'zero' : plain(LEVEL)}.`,
      `Three endless ${ramp('ramps')}, one local ${green('bump')}: nothing outside the window.`][stage];
    // A polite live region must be written only when it changes; render() runs every frame.
    if (captionKey !== sentence) { captionKey = sentence; caption.innerHTML = sentence; }

    // Scrubber-only wording: the caption sentence is already spoken by the live region, so
    // aria-valuetext names the stage and the coefficients instead of repeating it.
    return `${STAGES[stage]}. Coefficients ${c.map(v => signed(v)).join(', ')}.`;
  }

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

  // The picture's accessible name is composed from the declared fixture, so the panel holds
  // no second copy of the witness numbers: moving the fixture moves this sentence too. It
  // carries in full the sentence the picture now writes as a bare numeral at the apex.
  const relu = k => `ReLU(x ${BREAKS[k] < 0 ? '+' : MINUS} ${plain(Math.abs(BREAKS[k]))})`;
  const title = `A plot of x from ${plain(X0)} to ${plain(X1)}. Three hinges stand in ink: ${relu(0)} solid, ${relu(1)} dashed and ${relu(2)} dotted, `
    + `each zero up to its breakpoint and climbing for ever after. Beside them, pale green, the finished bump stands as a target before it is built. `
    + `Their running sum then arrives on it in green: first the solid ramp, climbing at ${signed(COEFS[0])}; then the dashed ramp swinging down to ${signed(COEFS[1])} h2, `
    + `so the sum falls at ${signed(COEFS[0] + COEFS[1])}; then the dotted ramp cancelling the fall. The finished sum has four straight pieces, `
    + `slopes ${FINAL.map(signed).join(', ')}; its peak g(${plain(PEAK_X)}) = ${plain(PEAK)} is written at the apex; and a bracket under the ticks marks `
    + `[${plain(BREAKS[0])}, ${plain(BREAKS[2])}], where alone the sum is nonzero.`;
  const named = svg.querySelector('title');
  if (named && named.textContent !== title) named.textContent = title;

  measure();
  window.BookPlayback(root, render, () => { measure(); previousKey = ''; render(lastTime, reduced); });
  typeset();
})();
