(() => {
  const root = document.getElementById('surprise-loss-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  // The panel is the one in-repo mirror of the fixture. Chapter 2 owns the binary
  // cross-entropy and its reading as surprise (02-logistic-softmax.qmd:81-96) but prints
  // no belief and no loss value at all, so the schedule of beliefs below is a declared
  // computed variant and every loss on the picture is recomputed from the chapter's own
  // formula as -log p (natural log). Nothing here is retyped and nothing is trained.
  const number = name => Number(root.dataset[name]);
  const list = name => root.dataset[name].trim().split(/\s+/).map(Number);
  const fixture = {
    label: number('label'), ladder: list('ladder'), halved: list('halved'),
    hedge: number('hedge'), lossTop: number('lossTop'), samples: number('samples'),
    range: list('beliefRange'), step: number('beliefStep')
  };
  (({label, ladder, halved, hedge, lossTop, samples, range, step}) => {
    const all = [label, ...ladder, ...halved, hedge, lossTop, samples, ...range, step];
    if (!all.every(Number.isFinite))
      throw Error('surprise-loss: every declared quantity must be a finite number');
    // A hard label is what makes one term vanish; a soft target would be a different scene.
    if (label !== 0 && label !== 1)
      throw Error('surprise-loss: the true label must be a hard 0 or 1');
    if (ladder.length !== 5 || halved.length !== 3)
      throw Error('surprise-loss: the eight-beat schedule carries five ladder beliefs and three halvings');
    if (![...ladder, ...halved].every(p => p > 0 && p < 1))
      throw Error('surprise-loss: every declared belief lies strictly between 0 and 1');
    // The whole left half of the scene rests on the steps being EQUAL decrements: that is
    // what makes the unequal risers evidence rather than decoration.
    const drop = ladder[0] - ladder[1];
    if (!(drop > 0)) throw Error('surprise-loss: the ladder of beliefs must fall');
    for (let i = 1; i < ladder.length; i++)
      if (Math.abs(ladder[i - 1] - ladder[i] - drop) > 1e-12)
        throw Error('surprise-loss: the ladder must fall by equal decrements of the belief');
    // …and the right half rests on each step being exactly a halving, which is exact in
    // binary floating point, so it is checked exactly.
    const chain = [ladder[ladder.length - 1], ...halved];
    for (let i = 1; i < chain.length; i++)
      if (chain[i] !== chain[i - 1] / 2)
        throw Error('surprise-loss: each halving must be exactly half the belief before it');
    if (!ladder.includes(hedge) || hedge !== 0.5)
      throw Error('surprise-loss: the hedge is the belief one half, and the ladder must stop there');
    if (!(samples >= 2)) throw Error('surprise-loss: each branch needs at least two samples');
    if (range.length !== 2 || !(range[0] > 0 && range[0] < range[1] && range[1] < 1))
      throw Error('surprise-loss: the control spans an increasing interval inside (0, 1)');
    if (!(range[0] <= chain[chain.length - 1]) || !(range[1] >= ladder[0]))
      throw Error('surprise-loss: the control must reach every belief the timeline visits');
    if (!(step > 0)) throw Error('surprise-loss: the control needs a positive step');
    for (const p of [...ladder, ...halved])
      if (Math.abs((p - range[0]) / step - Math.round((p - range[0]) / step)) > 1e-9)
        throw Error('surprise-loss: every belief the timeline visits must land on the control step');
    // A ruler the arm can run off the top of would make the loss look bounded.
    if (!(-Math.log(range[0]) <= lossTop))
      throw Error('surprise-loss: the loss ruler must reach the largest loss the control allows');
  })(fixture);

  // Natural log: a loss here is in nats. Math.log(0.5) is exactly -Math.log(2), so the
  // hedge is an identity in this arithmetic and the suite asserts it with ===.
  const lossOf = belief => -Math.log(belief);
  const ghostOf = belief => -Math.log(1 - belief);
  const HEDGE_LOSS = lossOf(fixture.hedge);

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const slider = $('[data-belief-slider]'), readout = $('[data-belief-readout]');
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

  const L = fixture.ladder, H = fixture.halved;
  // The schedule, declared once: two equal decrements a beat, a hold on the hedge, two
  // more equal decrements, a hold to predict on, then one halving per beat to the end.
  const KEYS = [
    [beats[0], L[0]], [beats[1], L[0]],
    [(beats[1] + beats[2]) / 2, L[1]], [beats[2], L[2]],
    [beats[3], L[2]],
    [(beats[3] + beats[4]) / 2, L[3]], [beats[4], L[4]],
    [beats[5], L[4]],
    [beats[6], H[0]], [beats[7], H[1]], [duration, H[2]]
  ];
  // The seven landmarks the staircase records, and the moment each one is reached.
  const STEPS = [L[0], L[1], L[2], L[3], L[4], H[0], H[1], H[2]];
  const STEP_AT = [(beats[1] + beats[2]) / 2, beats[2], (beats[3] + beats[4]) / 2, beats[4],
    beats[6], beats[7], duration];
  const beliefAt = time => {
    for (let i = 1; i < KEYS.length; i++)
      if (time < KEYS[i][0]) return glide(time, KEYS[i - 1][0], KEYS[i][0], KEYS[i - 1][1], KEYS[i][1]);
    return KEYS[KEYS.length - 1][1];
  };
  // Reduced motion draws one still per beat, and a glide beat rests on its finished state,
  // so every still is the picture its own caption is about.
  const REST = [beats[0], beats[2], beats[2], beats[4], beats[4], beats[6], beats[7], duration];

  const names = ['A belief', 'Equal steps', 'The hedge', 'The same steps',
    'Predict', 'Halved', 'Again', 'No ceiling'];
  const captions = [
    'The label is 1. The model believes 0.90, and its loss is its surprise at the truth.',
    'Equal steps down in belief, 0.20 at a time. Watch what each one costs.',
    'Halfway. Both branches meet here: log 2, the price of admitting you do not know.',
    'The same two steps again. The last one costs more than four times the first.',
    'Now halve the belief, 0.10 to 0.05. Does the loss double?',
    'Halving it. Watch how far the arm climbs for half as much belief.',
    'It added log 2, not a doubling. Halve again for exactly the same rise.',
    'Every halving costs one more log 2. Belief can halve forever; the loss cannot stop.'
  ];
  const dragging = 'You are moving the belief. Near 1 the loss barely stirs; near 0 it runs away.';
  const pictures = {
    hidden: 'Two loss curves cross at a belief of one half. One belief marker slides toward '
      + 'zero along the bottom while the wine arm measuring its loss grows under the curve.',
    shown: 'Two loss curves cross at a belief of one half. Four equal steps down in belief '
      + 'raise the loss by more and more, and three halvings of the belief each raise it by '
      + 'exactly the same amount.'
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
  // A label whose symbol wears a combining accent: the body sans has no mark positioning
  // for U+0302, so it sets the hat beside the p rather than over it, and only the symbol
  // is handed to the serif face. The tspan is built rather than written as innerHTML so it
  // carries the SVG namespace, and textContent still reads "belief p̂" for anything asking.
  const accented = (node, prose, symbol) => {
    node.textContent = `${prose} `;
    const span = attrs(document.createElementNS(NS, 'tspan'), {class: 'mechanism-accent'});
    span.textContent = symbol;
    node.appendChild(span);
    return node;
  };

  const marks = {
    lossAxis: make('line', {class: 'sl-axis', 'data-loss-axis': ''}),
    beliefAxis: make('line', {class: 'sl-axis', 'data-belief-axis': ''}),
    lossTitle: label('sl-muted', 12, {'data-name': 'loss-title'}, 'loss (nats)'),
    activeName: label('sl-target-fill sl-number', 12, {'data-name': 'active'}, 'y = 1 term'),
    beliefTitle: accented(label('sl-muted', 12, {'data-name': 'belief-title'}), 'belief', 'p̂'),
    ghostCurve: make('path', {class: 'sl-ghost', 'data-ghost-curve': '', fill: 'none'}),
    activeCurve: make('path', {class: 'sl-curve', 'data-active-curve': '', fill: 'none'}),
    ghostName: label('sl-muted sl-number', 12, {'data-name': 'ghost'}, 'y = 0 term × 0'),
    hedgeRule: make('line', {class: 'sl-rule', 'data-hedge-rule': ''}),
    hedgeDrop: make('line', {class: 'sl-rule', 'data-hedge-drop': ''}),
    crossRing: make('circle', {class: 'sl-cross-ring', r: 6, 'data-cross-ring': '', fill: 'none'}),
    hedgeName: label('sl-ink-fill sl-number', 12, {'data-name': 'hedge', 'text-anchor': 'start'}),
    askGuide: make('line', {class: 'sl-ask', 'data-ask-guide': ''}),
    askMark: label('sl-ask-mark', 15, {'data-name': 'ask'}, '?'),
    arm: make('line', {class: 'sl-arm', 'data-arm': ''}),
    readGuide: make('line', {class: 'sl-read', 'data-read': ''}),
    foot: make('circle', {class: 'sl-foot', r: 5, 'data-foot': ''}),
    point: make('circle', {class: 'sl-point', r: 5.5, 'data-point': ''}),
    beliefValue: label('sl-belief-fill sl-number', 13, {'data-value': 'belief'}),
    lossValue: label('sl-loss-fill sl-number', 13, {'data-value': 'loss'})
  };
  const lossTicks = Array.from({length: fixture.lossTop + 1}, (_, value) => ({value,
    line: make('line', {class: 'sl-tick', 'data-loss-tick': value}),
    text: label('sl-muted sl-number', 12, {'data-loss-label': value, 'text-anchor': 'end'}, String(value))}));
  const beliefTicks = [0, fixture.hedge, 1].map(value => ({value,
    line: make('line', {class: 'sl-tick', 'data-belief-tick': value}),
    text: label('sl-muted sl-number', 12, {'data-belief-label': value}, String(value))}));
  // One stair per landmark reached: a tread as wide as the step in belief, a riser as tall
  // as what that step cost, and the riser's own number on a short leader beside it.
  const stairs = STEPS.slice(1).map((belief, index) => ({
    from: STEPS[index], to: belief, halving: index >= fixture.ladder.length - 1,
    tread: make('line', {class: 'sl-tread', 'data-tread': index}),
    riser: make('path', {class: 'sl-riser', 'data-riser': index, fill: 'none'}),
    lead: make('line', {class: 'sl-lead', 'data-riser-lead': index}),
    text: label('sl-loss-fill sl-number', 12, {'data-value': `riser${index}`, 'text-anchor': 'start'},
      `+${(lossOf(belief) - lossOf(STEPS[index])).toFixed(4)}`)
  }));
  $('[data-belief-display]').setAttribute('aria-hidden', 'true');
  slider.min = String(fixture.range[0]);
  slider.max = String(fixture.range[1]);
  slider.step = String(fixture.step);

  const LAYOUT = {
    wide: {width: 713, height: 296,
      plot: {left: 108, top: 28, width: 500, height: 208},
      rows: {value: 256, scale: 272, title: 290},
      ruler: {tick: 8, text: 100},
      titles: {loss: [100, 18, 'end'], active: [120, 18, 'start']},
      ghost: {p: 0.9, dx: 10, dy: -8, anchor: 'start'},
      stair: {bar: 5, serif: 3, near: 9, far: 22},
      hedge: {dx: 10, dy: -10},
      arm: {dx: 9, dy: -9, flip: 0.35}, lift: 44},
    narrow: {width: 296, height: 396,
      plot: {left: 46, top: 26, width: 226, height: 300},
      rows: {value: 346, scale: 364, title: 384},
      ruler: {tick: 7, text: 38},
      titles: {loss: [6, 16, 'start'], active: [90, 16, 'start']},
      ghost: {p: 0.82, dx: 9, dy: -8, anchor: 'end'},
      stair: {bar: 4, serif: 3, near: 9, far: 18},
      hedge: {dx: 26, dy: -8},
      arm: {dx: 9, dy: -9, flip: 0.35}, lift: 42}
  };
  let g = LAYOUT.wide, mode = 'wide', lastTime = 0, reduced = false, override = null, drawn = '';
  let toX = p => p, toY = value => value;

  // A label is kept inside the picture by construction: its own estimated box is nudged
  // back from an edge rather than re-anchored, so a label never jumps across its mark.
  // JSDOM lays out no text, so the extent is estimated from the label's own content at
  // about 0.55 em per character — measured off the browser preview at both widths.
  const extent = node => node.textContent.length * Number(node.getAttribute('font-size')) * .55 + 3;
  const put = (node, x, y, anchor = 'middle') => {
    const w = extent(node);
    const left = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
    const shift = left < 6 ? 6 - left : left + w > g.width - 6 ? g.width - 6 - w - left : 0;
    attrs(node, {x: x + shift, y, 'text-anchor': anchor});
  };

  function measure() {
    const width = Math.max(200, Math.round(figure.getBoundingClientRect().width || LAYOUT.wide.width));
    mode = width < 520 ? 'narrow' : 'wide';
    g = LAYOUT[mode];
    toX = p => g.plot.left + p * g.plot.width;
    toY = value => g.plot.top + g.plot.height * (1 - value / fixture.lossTop);
    root.dataset.layout = mode;
    root.dataset.plot = JSON.stringify({left: g.plot.left, top: g.plot.top,
      width: g.plot.width, height: g.plot.height, lossTop: fixture.lossTop});
    svg.setAttribute('viewBox', `0 0 ${g.width} ${g.height}`);
  }

  // Everything that stays put for the whole timeline is placed once per layout, never per
  // frame: the two axes, their ticks, both branches, the hedge, and all seven stairs.
  function branch(from, to, f) {
    const gap = (to - from) / (fixture.samples - 1);
    let path = '';
    for (let i = 0; i < fixture.samples; i++) {
      const p = from + i * gap;
      path += `${i ? ' L' : 'M'} ${px(toX(p))} ${px(toY(Math.min(f(p), fixture.lossTop)))}`;
    }
    return path;
  }

  function scenery() {
    attrs(marks.lossAxis, {x1: toX(0), y1: toY(0), x2: toX(0), y2: toY(fixture.lossTop)});
    attrs(marks.beliefAxis, {x1: toX(0), y1: toY(0), x2: toX(1), y2: toY(0)});
    put(marks.lossTitle, g.titles.loss[0], g.titles.loss[1], g.titles.loss[2]);
    put(marks.activeName, g.titles.active[0], g.titles.active[1], g.titles.active[2]);
    put(marks.beliefTitle, toX(0.5), g.rows.title);
    for (const tick of lossTicks) {
      attrs(tick.line, {x1: toX(0) - g.ruler.tick, x2: toX(0), y1: toY(tick.value), y2: toY(tick.value)});
      put(tick.text, g.ruler.text, toY(tick.value) + 4, 'end');
    }
    for (const tick of beliefTicks) {
      attrs(tick.line, {x1: toX(tick.value), x2: toX(tick.value), y1: toY(0) - 4, y2: toY(0) + 5});
      put(tick.text, toX(tick.value), g.rows.scale);
    }
    // The active branch stops where the ruler does; the other branch is its mirror. Their
    // crossing at one half is the hedge, and it is drawn, not asserted.
    const floor = Math.exp(-fixture.lossTop);
    marks.activeCurve.setAttribute('d', branch(floor, 1, lossOf));
    marks.ghostCurve.setAttribute('d', branch(0, 1 - floor, ghostOf));
    put(marks.ghostName, toX(g.ghost.p) + g.ghost.dx, toY(ghostOf(g.ghost.p)) + g.ghost.dy, g.ghost.anchor);
    attrs(marks.hedgeRule, {x1: toX(0), y1: toY(HEDGE_LOSS), x2: toX(fixture.hedge), y2: toY(HEDGE_LOSS)});
    attrs(marks.hedgeDrop, {x1: toX(fixture.hedge), y1: toY(0), x2: toX(fixture.hedge), y2: toY(HEDGE_LOSS)});
    attrs(marks.crossRing, {cx: toX(fixture.hedge), cy: toY(HEDGE_LOSS)});
    // The hedge names itself just above its own rule, on the far side of the crossing.
    // That corner is the one place the arm can never reach: to the right of one half the
    // loss is below log 2, so the arm's top never rises into this label.
    put(marks.hedgeName, toX(fixture.hedge) + g.hedge.dx, toY(HEDGE_LOSS) + g.hedge.dy, 'start');
    // Where the belief is about to go, asked before the loss there is known.
    attrs(marks.askGuide, {x1: toX(H[0]), y1: toY(0), x2: toX(H[0]), y2: toY(lossOf(L[4]))});
    put(marks.askMark, toX(H[0]), toY(lossOf(L[4])) - 8);
    for (const [index, stair] of stairs.entries()) {
      const before = toY(lossOf(stair.from)), after = toY(lossOf(stair.to));
      const x = toX(stair.to), bar = x + g.stair.bar, s = g.stair.serif;
      attrs(stair.tread, {x1: toX(stair.from), y1: before, x2: x, y2: before});
      stair.riser.setAttribute('d', `M ${px(bar - s)} ${px(before)} L ${px(bar + s)} ${px(before)}`
        + ` M ${px(bar)} ${px(before)} L ${px(bar)} ${px(after)}`
        + ` M ${px(bar - s)} ${px(after)} L ${px(bar + s)} ${px(after)}`);
      const middle = (before + after) / 2;
      const text = x + (stair.halving ? g.stair.far : g.stair.near);
      // A short riser's midpoint sits on the tread that runs out of its own foot, so the
      // number is lifted clear of that line rather than struck through by it. A tall
      // riser keeps its number at the middle of what it measures.
      const row = Math.min(middle + 4, before - 8);
      put(stair.text, text, row, 'start');
      attrs(stair.lead, {x1: text - 4, y1: row - 4, x2: bar + s, y2: middle});
      void index;
    }
  }

  function draw(state) {
    const {belief, loss, revealed, asking, earned} = state;
    const x = toX(belief), y = toY(loss);
    write(marks.beliefValue, belief.toFixed(4));
    write(marks.lossValue, loss.toFixed(4));
    write(marks.hedgeName, revealed ? 'log 2' : '');
    attrs(marks.arm, {x1: x, y1: toY(0), x2: x, y2: y});
    attrs(marks.readGuide, {x1: x, y1: y, x2: toX(0), y2: y});
    attrs(marks.foot, {cx: x, cy: toY(0)});
    attrs(marks.point, {cx: x, cy: y});
    put(marks.beliefValue, x, g.rows.value);
    // The reading leaves the arm on the side the curve is not climbing into, and never
    // rises into the picture's own title row. It changes sides before the crossing, so
    // that it and the hedge's name never reach for the same corner.
    const left = belief >= g.arm.flip;
    put(marks.lossValue, x + (left ? -g.arm.dx : g.arm.dx), Math.max(g.lift, y + g.arm.dy),
      left ? 'end' : 'start');
    for (const node of [marks.hedgeRule, marks.hedgeDrop, marks.crossRing]) show(node, revealed);
    for (const node of [marks.askGuide, marks.askMark]) show(node, asking);
    for (const [index, stair] of stairs.entries()) {
      const seen = earned > index;
      for (const node of [stair.tread, stair.riser, stair.lead, stair.text]) show(node, seen);
    }
    const description = earned > fixture.ladder.length ? pictures.shown : pictures.hidden;
    if (svg.getAttribute('aria-label') !== description) svg.setAttribute('aria-label', description);
    formula.classList.toggle('sl-hedge-shown', revealed);
    formula.classList.toggle('sl-at-hedge', revealed && belief === fixture.hedge);
    formula.classList.toggle('sl-deep', belief < fixture.hedge);
  }

  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const clamped = clamp(Number.isFinite(time) ? time : 0, 0, duration);
    const stage = stageAt(clamped), held = reducedMotion ? REST[stage] : clamped;
    const dragged = override !== null;
    const belief = dragged ? override : beliefAt(held);
    const loss = lossOf(belief);
    const revealed = stage >= 2, asking = stage === 4;
    // Each stair is earned by the timeline reaching the belief it records, never by a drag.
    const earned = STEP_AT.filter(moment => held >= moment).length;
    const state = {stage, belief, loss, revealed, asking, earned, dragged,
      atHedge: belief === fixture.hedge};
    Object.assign(root.dataset, {stage: String(stage), belief: String(belief),
      loss: String(loss), earned: String(earned), revealed: String(revealed),
      asking: String(asking), atHedge: String(state.atHedge),
      override: dragged ? 'slider' : ''});
    const key = `${stage}|${belief}|${revealed}|${asking}|${earned}|${mode}`;
    if (key !== drawn) { drawn = key; draw(state); }
    // Restore the requested value as well as the picture: pausing during a drag may have
    // repainted the slider from the timeline.
    slider.value = String(belief);
    write(readout, belief.toFixed(4));
    slider.setAttribute('aria-valuetext', `Belief ${belief.toFixed(4)}, loss ${loss.toFixed(4)} nats. `
      + `The ruler stops at ${fixture.lossTop}; the loss itself has no ceiling.`);
    const sentence = dragged ? dragging : captions[stage];
    if (caption.textContent !== sentence) caption.textContent = sentence;
    return `${names[stage]}. Belief ${belief.toFixed(4)}, loss ${loss.toFixed(4)}.`;
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
  // guard: a key it ignores must leave the dragged belief alone.
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
