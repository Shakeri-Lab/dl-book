// Chapter 4, §"The learning rate": one ball, one declared quadratic bowl, and the
// chapter's own three rates. Contract with interactives/shared/playback.js:
//   window.BookPlayback(root, render, layout?) — render(time, reduced) is a pure function
//   of time, never measures, sets root.dataset.stage, and returns the scrubber's wording.
// The picture is built once; render() only sets attributes on marks it already holds.
(() => {
  const root = document.getElementById('step-length-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  const declared = name => root.dataset[name].trim().split(/\s+/).map(Number);
  // The fixture lives in exactly one place in this repository: the panel's data-*
  // attributes. chapters/part1/04-training-loss-sgd.qmd owns the start (line 243), the
  // three rates (254-255), the generating weight the minimum sits on (142) and the
  // rule-of-thumb rate (265-266). The curvature, the step budget, the drawn window and
  // the dial's range are this panel's declared variants; nothing below retypes a number.
  const W0 = Number(root.dataset.start), WSTAR = Number(root.dataset.minimum);
  const C = Number(root.dataset.curvature), STEPS = Number(root.dataset.steps);
  const RATES = declared('rates'), GUIDE = Number(root.dataset.guide);
  const [WLO, WHI] = declared('window'), [ALO, AHI] = declared('dial');
  if (!(C > 0) || !(WLO < W0 && W0 < WHI) || RATES.length !== 3) throw Error('step-length: the declared fixture is not a bowl with three rates');

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  // Scripts-off readers get a second, narrow print; live playback draws at its measured
  // layout, so discard both prints before collecting any mark.
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const drawing = svg.querySelector('[data-drawing]');
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const slider = $('[data-alpha-slider]'), scale = $('[data-scale]');
  const wallMark = $('[data-wall-mark]'), guideMark = $('[data-guide-mark]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration || beats[beats.length - 1]);
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);
  const clamp01 = value => Math.max(0, Math.min(1, value));
  const clampTo = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
  const ramp = (time, from, to) => clamp01((time - from) / (to - from));

  // --- The scene's arithmetic, all of it from the declared fixture -------------------
  // A quadratic bowl in one parameter: L(w) = ½ c (w − w*)², so L'(w) = c (w − w*) and
  // full-batch descent is w ← w − α L'(w), that is (w − w*) ← (1 − αc)(w − w*). The walk
  // shrinks exactly when |1 − αc| < 1, i.e. when α < 2/c: the threshold this scene is
  // about. It is computed here from the declared curvature, never typed.
  const loss = w => 0.5 * C * (w - WSTAR) ** 2;
  const slopeAt = w => C * (w - WSTAR);
  const THRESHOLD = 2 / C;
  const LMAX = Math.max(loss(WLO), loss(WHI));
  const MIRROR = 2 * WSTAR - W0;               // the point of equal height on the far wall
  function walk(alpha) {
    const ws = [W0];
    for (let k = 0; k < STEPS; k++) ws.push(ws[k] - alpha * slopeAt(ws[k]));
    let exit = Infinity, side = 0;
    for (let k = 0; k <= STEPS; k++) {
      if (ws[k] >= WLO && ws[k] <= WHI) continue;
      exit = k; side = ws[k] > WHI ? 1 : -1; break;
    }
    return {ws, exit, side, factor: 1 - alpha * C};
  }

  // --- Number formatting ---------------------------------------------------------------
  // U+2212 for minus, four decimals while four decimals carry the value, a mantissa and a
  // Unicode power of ten below that. No hyphen-minus and no e-notation anywhere a reader
  // or a screen reader meets one of these numbers.
  const SUPERSCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const power = exponent => `10${exponent < 0 ? '⁻' : ''}${[...String(Math.abs(exponent))].map(digit => SUPERSCRIPT[digit]).join('')}`;
  function magnitude(value) {
    if (value === 0) return '0';
    if (value >= 1e-4) return value.toFixed(4);
    let exponent = Math.floor(Math.log10(value)), mantissa = value / 10 ** exponent;
    if (Number(mantissa.toFixed(1)) >= 10) { mantissa /= 10; exponent += 1; }
    return `${mantissa.toFixed(1)} × ${power(exponent)}`;
  }
  const minus = text => String(text).replace('-', '−');
  const rate = value => minus(value.toFixed(3));

  // --- Timeline ----------------------------------------------------------------------
  // Each beat sets one rate and runs the same eight steps from the same start. The rate
  // changes discretely at a beat, as the caption does, so an arrow-key seek lands on a
  // beat whose rate and whose ball are both at their beginning. Beat 7 is the exception:
  // there the rate itself is the moving thing, gliding back below the wall.
  const STAGE_RATE = [RATES[0], RATES[0], RATES[1], RATES[2], RATES[2], THRESHOLD, 0.9 * THRESHOLD, RATES[1]];
  const RUNS = [false, true, true, false, true, true, true, false];
  const RUN_SPAN = 3.2, SWEEP = 1.5;
  // Reduced motion holds one still per beat: the state that beat's caption describes.
  // Beat 5's rest is an odd step, so its still rests on the far wall rather than back at
  // the start, where a perpetual bounce would look like nothing having happened.
  const REST = [4, 9, 14, 19, 24, 27.8, 34, 38.5];
  const rateAt = (held, stage) => stage === 7
    ? STAGE_RATE[6] + (STAGE_RATE[7] - STAGE_RATE[6]) * ramp(held, beats[7], beats[7] + SWEEP)
    : STAGE_RATE[stage];
  const progressAt = (held, stage) => stage === 7 ? STEPS
    : RUNS[stage] ? STEPS * ramp(held, beats[stage], beats[stage] + RUN_SPAN) : 0;

  // Every rate a name or a caption speaks is read back out of the declared fixture, so no
  // number is typed twice in this repository.
  const say = value => minus(Number(value.toFixed(6)));
  const STAGES = ['One slope', `Rate ${say(RATES[0])}`, `Rate ${say(RATES[1])}`,
    `Rate ${say(RATES[2])}, predict`, `Rate ${say(RATES[2])}, the run`,
    'At the wall', 'Just under the wall', 'Back below the wall'];
  // Each caption is true of its reduced-motion still and of the motion it introduces;
  // none of them names the answer before the run at beat 4 has played.
  const CAPTIONS = [
    'The ball feels one slope: the dashed arrow. The rate decides how much of it to take.',
    `A rate of ${say(RATES[0])} takes a hair of that arrow. Eight steps later the ball has barely moved.`,
    `A rate of ${say(RATES[1])} takes more, and the same eight steps put the ball at the bottom.`,
    `A rate of ${say(RATES[2])} asks for more than the whole arrow. Its tip is past the bottom. Late, or never?`,
    'Every landing sits higher than the last, and the ball climbs out of the picture.',
    `At a rate of ${say(THRESHOLD)} the step lands exactly opposite. The bounce neither grows nor shrinks.`,
    'A tenth under that wall the ball still crosses, but each landing is lower.',
    `Anywhere below the wall it arrives. The chapter starts near ${say(GUIDE)}, a tenth of the wall.`
  ];
  const DRAG_CAPTION = 'Your own rate: eight steps from the same start, drawn all at once.';
  const DESCRIPTION = [
    'A ball rests on a quadratic bowl drawn over one parameter. A dashed arrow at the ball is the slope it feels; a solid arrow below it is the learning rate times that slope, and its tip is where the ball goes next.',
    ' A ring on the far wall marks the point of equal height, and the rate whose step lands on it is named beside it.'
  ];

  // --- The picture, built once ----------------------------------------------------------
  drawing.replaceChildren();
  const NS = 'http://www.w3.org/2000/svg';
  // Drawing coordinates are serialised at 0.0001 px, so a last-bit difference between math
  // libraries cannot change the byte-compared static print; the state itself stays exact.
  const px = value => typeof value === 'number' ? String(Number(value.toFixed(4))) : String(value);
  const attrs = (node, values) => { for (const [key, value] of Object.entries(values)) node.setAttribute(key, px(value)); };
  const make = (tag, values, parent = drawing, content = '') => {
    const node = document.createElementNS(NS, tag);
    attrs(node, values); if (content) node.textContent = content; parent.appendChild(node); return node;
  };
  const show = (node, visible) => visible ? node.removeAttribute('hidden') : node.setAttribute('hidden', '');
  const label = (content, cls, extra = {}, parent = drawing) => make('text', {class: cls, ...extra}, parent, content);

  const clip = make('clipPath', {id: 'sl-plot-clip'});
  const clipRect = make('rect', {}, clip);
  const field = make('rect', {class: 'sl-field'});
  const frame = make('rect', {class: 'sl-frame'});
  const bowl = make('path', {class: 'sl-bowl', 'data-bowl': ''});
  const axis = make('line', {class: 'sl-axis'});
  const W_TICKS = [-2.5, 0, 2.5, 5, 7.5];
  const wTicks = W_TICKS.map(value => ({value, mark: make('line', {class: 'sl-tick'})}));
  const wLabels = W_TICKS.map(value => ({value, mark: label(minus(value), 'sl-axis-label', {'text-anchor': 'middle'})}));
  const wName = label('w', 'sl-name sl-parameter', {'text-anchor': 'middle'});
  const lName = label('L', 'sl-name sl-error', {'text-anchor': 'start'});
  // The height the ball began at, so that "higher than it started" is something the eye
  // can check. It carries no label of its own: the ring sits on it, at the far wall.
  const startLine = make('line', {class: 'sl-start-line', 'data-start-line': ''});
  const mirror = make('circle', {class: 'sl-mirror', 'data-mirror': '', r: 8});
  const wallValue = label('·', 'sl-ink', {'data-value': 'threshold', 'text-anchor': 'end'});
  const guide = make('g', {'data-guide': ''});
  const guideLine = make('line', {class: 'sl-guide'}, guide);
  const guideRing = make('circle', {class: 'sl-guide-ring', r: 4.4}, guide);
  const arrows = make('g', {'data-arrows': '', 'clip-path': 'url(#sl-plot-clip)'});
  const ghostArrow = make('path', {class: 'sl-ghost-arrow', 'data-ghost-arrow': ''}, arrows);
  const stepArrow = make('path', {class: 'sl-step-arrow', 'data-step-arrow': ''}, arrows);
  const dots = Array.from({length: STEPS + 1}, (_, k) => make('circle', {class: 'sl-dot', 'data-dot': k, r: 3.1}));
  const chevron = make('path', {class: 'sl-chevron', 'data-chevron': ''});
  const ball = make('circle', {class: 'sl-ball', 'data-ball': '', r: 5.4});
  const lossValue = label('·', 'sl-error', {'data-value': 'loss', 'text-anchor': 'middle'});
  const rateValue = label('·', 'sl-ink', {'data-value': 'alpha', 'text-anchor': 'middle'});

  let width = 713, lastTime = 0, reduced = false, override = null, previousKey = '', captionKey = '';
  let g, toX, toY, described;
  const measure = () => {
    width = Math.max(240, Math.round(figure.getBoundingClientRect().width || 713));
  };

  // Everything that depends only on the fixture and the pane width is drawn here, once per
  // width: the bowl, its axis and ticks, the start-height line and the ring on the far
  // wall. render() moves only the ball, its two arrows, the landing dots and three numbers.
  const WIDE = {width: 713, height: 386, left: 48, right: 692, top: 28, bottom: 328,
    tickLen: 5, tickY: 346, nameY: 368, tickFont: 11, font: 12};
  const NARROW = {width: 296, height: 302, left: 30, right: 284, top: 24, bottom: 246,
    tickLen: 4, tickY: 262, nameY: 282, tickFont: 10, font: 11};
  function layout() {
    const narrow = width < 560;
    g = {...(narrow ? NARROW : WIDE), narrow};
    g.unitW = (g.right - g.left) / (WHI - WLO);
    g.unitL = (g.bottom - g.top) / LMAX;
    toX = w => g.left + (w - WLO) * g.unitW;
    toY = L => g.bottom - L * g.unitL;
    svg.setAttribute('viewBox', `0 0 ${g.width} ${g.height}`);
    Object.assign(root.dataset, {layout: narrow ? 'narrow' : 'wide',
      plotLeft: String(g.left), plotRight: String(g.right), plotTop: String(g.top),
      plotBottom: String(g.bottom), unitW: String(g.unitW), unitL: String(g.unitL)});
    const box = {x: g.left, y: g.top, width: g.right - g.left, height: g.bottom - g.top};
    attrs(clipRect, box); attrs(field, box); attrs(frame, box);
    // The bowl, sampled finely enough to read as a curve and exact at every sample.
    const N = 160;
    attrs(bowl, {d: Array.from({length: N + 1}, (_, i) => {
      const w = WLO + (WHI - WLO) * i / N;
      return `${i ? 'L' : 'M'} ${px(toX(w))} ${px(toY(loss(w)))}`;
    }).join(' ')});
    attrs(axis, {x1: g.left, y1: g.bottom, x2: g.right, y2: g.bottom});
    wTicks.forEach(item => attrs(item.mark, {x1: toX(item.value), x2: toX(item.value), y1: g.bottom, y2: g.bottom + g.tickLen}));
    wLabels.forEach(item => attrs(item.mark, {x: toX(item.value), y: g.tickY, 'font-size': g.tickFont}));
    attrs(wName, {x: (g.left + g.right) / 2, y: g.nameY, 'font-size': g.font + 2});
    attrs(lName, {x: g.left + 2, y: g.top - 8, 'font-size': g.font + 2});
    attrs(startLine, {x1: g.left, x2: g.right, y1: toY(loss(W0)), y2: toY(loss(W0))});
    attrs(mirror, {cx: toX(MIRROR), cy: toY(loss(MIRROR))});
    // The threshold sits in the picture's header row, opposite the loss axis name, where
    // nothing the ball carries ever travels; the ring below is its geometry.
    attrs(wallValue, {x: g.right - 4, y: g.top - 8, 'font-size': g.font});
    attrs(lossValue, {'font-size': g.font});
    attrs(rateValue, {'font-size': g.font});
  }

  // An arrow at its true length: a head only when there is room for one, so a short arrow
  // stays short rather than being inflated to keep itself visible.
  function arrowPath(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    const shaft = `M ${px(x1)} ${px(y1)} L ${px(x2)} ${px(y2)}`;
    if (len < 7) return shaft;
    const head = Math.min(9, len * 0.3), ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
    return `${shaft} M ${px(x2 - ux * head + nx * head * 0.45)} ${px(y2 - uy * head + ny * head * 0.45)}`
      + ` L ${px(x2)} ${px(y2)} L ${px(x2 - ux * head - nx * head * 0.45)} ${px(y2 - uy * head - ny * head * 0.45)}`;
  }
  const chevronPath = (x, y, direction) => {
    const step = 6 * direction;
    return `M ${px(x - step)} ${px(y - 7)} L ${px(x)} ${px(y)} L ${px(x - step)} ${px(y + 7)}`
      + ` M ${px(x - 2 * step)} ${px(y - 7)} L ${px(x - step)} ${px(y)} L ${px(x - 2 * step)} ${px(y + 7)}`;
  };

  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const stage = stageAt(time), held = reducedMotion ? REST[stage] : time;
    const dragged = override !== null;
    const alpha = dragged ? override : rateAt(held, stage);
    const progress = dragged ? STEPS : progressAt(held, stage);
    const run = walk(alpha);
    const index = Math.min(STEPS - 1, Math.floor(progress + 1e-9));
    const fraction = clamp01(progress - index);
    const trueW = run.ws[index] + (run.ws[index + 1] - run.ws[index]) * fraction;
    const escaped = progress >= run.exit - 1e-9;
    const shownW = escaped ? (run.side > 0 ? WHI : WLO) : clampTo(trueW, WLO, WHI);
    const revealed = stage >= 4;
    const wallShown = stage >= 5 || dragged;
    const rateShown = stage >= 1 || dragged;
    const guideShown = stage === 3 && !dragged;
    const grow = stage === 0 && !dragged ? ramp(held, 0.4, 2.4) : 1;

    Object.assign(root.dataset, {stage: String(stage), alpha: String(alpha), factor: String(run.factor),
      progress: String(progress), stepIndex: String(index), trueW: String(trueW),
      shownLoss: String(loss(trueW)), escaped: String(escaped), exit: String(run.exit),
      threshold: String(THRESHOLD), revealed: String(revealed), override: dragged ? 'slider' : ''});

    const key = [g.narrow, stage, dragged, alpha.toFixed(6), progress.toFixed(4), grow.toFixed(3)].join('|');
    if (key !== previousKey) {
      previousKey = key;
      // The ball rides the bowl: its parameter moves, and its height is the bowl's own.
      const bx = toX(shownW), by = toY(clampTo(loss(shownW), 0, LMAX));
      attrs(ball, {cx: bx, cy: by});
      // Both arrows leave the ball along the parameter axis. The dashed one, drawn a line
      // above, is the raw slope; the solid one on the ball's own level is the rate's
      // fraction of it, and its tip is where the next step puts the ball. Overshoot is
      // the solid arrow reaching past the dashed one.
      const slope = slopeAt(trueW);
      const ghostTip = trueW - slope * grow, stepTip = trueW - alpha * slope * grow;
      attrs(ghostArrow, {d: arrowPath(bx, by - 11, toX(ghostTip), by - 11)});
      attrs(stepArrow, {d: arrowPath(bx, by, toX(stepTip), by)});
      show(ghostArrow, grow > 0);
      show(stepArrow, rateShown);
      show(arrows, !escaped);
      // The landing the reader is asked to predict from: where this rate's first step goes.
      attrs(guideLine, {x1: toX(stepTip), x2: toX(stepTip), y1: by, y2: toY(loss(stepTip))});
      attrs(guideRing, {cx: toX(stepTip), cy: toY(loss(stepTip))});
      show(guide, guideShown);
      dots.forEach((dot, k) => {
        const inside = k < run.exit;
        // Every dot's geometry is written every frame, even a hidden one, so the drawing
        // is a function of time alone and never carries a coordinate from an earlier rate.
        const at = clampTo(run.ws[k], WLO, WHI);
        attrs(dot, {cx: toX(at), cy: toY(loss(at))});
        show(dot, inside && k <= Math.floor(progress + 1e-9));
      });
      attrs(chevron, {d: chevronPath(clampTo(bx + (run.side > 0 ? 13 : -13), 26, g.width - 5), by, run.side > 0 ? 1 : -1)});
      show(chevron, escaped);
      show(startLine, rateShown);
      show(mirror, wallShown); show(wallValue, wallShown);
      wallValue.textContent = wallShown ? `wall α ${say(THRESHOLD)}` : '·';
      // A number sits beside the mark it measures, inside the picture at either width: the
      // loss above the ball, the rate under the step arrow whose length it sets. Once the
      // ball is pinned to the frame both stack below it, clear of the header row.
      // Both sit above the ball, clear of the step arrow that leaves it, and below it only
      // once the ball is pinned to the frame and there is no room above.
      const half = 3 * g.font, rateHalf = 2.2 * g.font;
      const rateY = escaped ? by + 36 : Math.max(g.font + 4, by - 31);
      const lossY = escaped ? by + 18 : Math.max(g.font + 18, by - 15);
      attrs(lossValue, {x: clampTo(bx, g.left + half, g.right - half), y: lossY});
      lossValue.textContent = `L ${magnitude(loss(trueW))}`;
      const rateX = escaped ? bx : (bx + toX(stepTip)) / 2;
      attrs(rateValue, {x: clampTo(rateX, g.left + rateHalf, g.right - rateHalf), y: rateY});
      rateValue.textContent = rateShown ? `α ${rate(alpha)}` : '·';
      show(rateValue, rateShown);
      // The control's own marks: the wall as soon as the scene names it, the chapter's
      // rule-of-thumb rate with the caption that recommends it.
      // Toggled by class, not by the hidden attribute: an attribute added and removed
      // again would land in a different order in the markup, and the drawing must be a
      // function of time alone, not of the order a reader arrived at it.
      if (scale) scale.classList.toggle('is-shown', wallShown);
      if (guideMark) guideMark.classList.toggle('is-shown', stage >= 7 || dragged);
      // The formula: classes only. The TeX is never rewritten during playback.
      root.classList.toggle('sl-late', wallShown);
      formula.classList.toggle('sl-alpha-lit', (stage >= 1 && stage <= 3) || dragged);
      formula.classList.toggle('sl-slope-lit', stage === 0);
      formula.classList.toggle('sl-factor-lit', stage === 5 || stage === 6);
    }

    const description = DESCRIPTION[0] + (wallShown ? DESCRIPTION[1] : '');
    if (description !== described) { described = description; svg.setAttribute('aria-label', description); }
    slider.value = String(alpha);
    // The control speaks its own value; the picture prints it once, under the step arrow.
    // Until the run at beat 4 has played, nothing here names the outcome it withholds.
    slider.setAttribute('aria-valuetext', `Learning rate ${rate(alpha)} of the slope arrow at the ball.`
      + (revealed ? ` Past ${say(THRESHOLD)} on this bowl every landing is higher than the last.` : ''));

    const sentence = dragged ? DRAG_CAPTION : CAPTIONS[stage];
    if (captionKey !== sentence) { captionKey = sentence; caption.textContent = sentence; }
    // Scrubber-only wording: the caption is already a live region, so this names the beat
    // and the two numbers the picture carries.
    return `${STAGES[stage]}. Rate ${rate(alpha)}. Loss ${magnitude(loss(trueW))}.`;
  }

  // The control is a detour, not a new default. Dragging pauses playback and recomputes the
  // whole picture from the dragged rate; any timeline action — play from a pause, a scrub,
  // an arrow-key beat — resumes the timeline's own rate.
  function drag() {
    const requested = clampTo(Number(slider.value), ALO, AHI);
    if (root.dataset.playing === 'true') $('[data-action="play"]').click();
    override = requested;
    render(lastTime, reduced);
  }
  slider.addEventListener('input', drag);
  slider.addEventListener('change', drag);
  pane.addEventListener('click', event => {
    if (event.target.closest('[data-action="play"]') && root.dataset.playing !== 'true') override = null;
  }, true);
  // The drag ends only when the transport really acts; a key the transport ignores must
  // leave the dragged rate alone.
  pane.addEventListener('keydown', event => {
    if (event.target !== pane || event.altKey || event.ctrlKey || event.metaKey) return;
    const toggles = [' ', 'k', 'K'].includes(event.key);
    if (toggles && (event.repeat || root.dataset.playing === 'true')) return;
    if (toggles || ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) override = null;
  }, true);

  // One typeset call after mount, guarded. MathJax's lazyAlwaysTypeset list already covers
  // span[id^="eq-"], so on the book page the formula is normally typeset before this runs.
  // Without MathJax the TeX source stays readable and data-typeset says which happened.
  const typeset = () => {
    const done = () => { root.dataset.typeset = root.querySelector('mjx-container') ? 'mathjax' : 'none'; };
    if (window.MathJax && typeof window.MathJax.typesetPromise === 'function' && !root.querySelector('mjx-container')) {
      window.MathJax.typesetPromise([root]).then(done, done);
    } else done();
  };

  slider.min = String(ALO); slider.max = String(AHI);
  // The control's own wall mark, placed from the computed threshold rather than from a
  // number in the stylesheet, so a differently curved bowl would move it.
  if (scale) {
    scale.style.setProperty('--sl-wall', `${((THRESHOLD - ALO) / (AHI - ALO) * 100).toFixed(4)}%`);
    scale.style.setProperty('--sl-guide', `${((GUIDE - ALO) / (AHI - ALO) * 100).toFixed(4)}%`);
  }
  if (wallMark) wallMark.textContent = `wall ${say(THRESHOLD)}`;
  if (guideMark) guideMark.textContent = say(GUIDE);
  // Bound before the transport mounts, so it runs before the transport's own seek: the
  // scrubber is the timeline, and a scrub ends a detour.
  $('[data-controls] input[type="range"]').addEventListener('input', () => { override = null; });
  // The three chapter rates' complete walks, for the suite to check against its own loop.
  // Written under a name of its own: data-rates is the declared fixture and stays untouched.
  root.dataset.traces = JSON.stringify(RATES.map(alpha => walk(alpha).ws.map(w => Number(w.toFixed(10)))));
  measure(); layout();
  window.BookPlayback(root, render, () => { measure(); layout(); previousKey = ''; render(lastTime, reduced); });
  typeset();
})();
