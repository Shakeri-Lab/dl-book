(() => {
  const root = document.getElementById('lstm-valves-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  // The panel is the one in-repo mirror of the fixture. Chapter 10 prints @eq-lstm
  // (chapters/part3/10-sequences-rnn.qmd:338-352) and no gate openings anywhere near it, so
  // the carried numbers and the three valve openings below are DECLARED ILLUSTRATIVE and
  // live only in the panel's data-* attributes; interactives/manifest.json declares them as
  // computed variants and scripts/audit_excerpt_fixtures.py keeps the chapter's own literals
  // verbatim. Nothing here is a measurement: data-measured holds the chapter's two measured
  // mean gate activations solely so the tests can prove the picture never draws them.
  const numbers = name => root.dataset[name].trim().split(/\s+/).map(Number);
  const CARRY = Number(root.dataset.carry), CAND = Number(root.dataset.candidate);
  const OPENINGS = numbers('openings');
  const STOPS = {f: numbers('forget'), i: numbers('input'), o: numbers('output')};
  const MEASURED = numbers('measured');
  for (const [key, stops] of Object.entries(STOPS)) {
    if (!stops.length) throw Error(`lstm-valves: valve ${key} declares no openings`);
    for (const value of stops) if (!OPENINGS.some(v => Math.abs(v - value) < 1e-12)) throw Error(`lstm-valves: ${value} is not one of the declared illustrative openings`);
  }
  if (!(CARRY >= 0 && CAND >= 0)) throw Error('lstm-valves: the declared carried values are not numbers in range');
  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = svg.querySelector('[data-drawing]'), caption = $('[data-caption]');
  const tags = {};
  for (const node of svg.querySelectorAll('foreignObject[data-tag]')) tags[node.dataset.tag] = node;
  // Beats are declared on the pane, so the timeline is stated once, and every stage boundary
  // is a beat: that is what puts the arrow keys where the mechanism changes. There is no
  // stage strip; the beats are named here in data-beats order and the transcript matches.
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration || beats[beats.length - 1]);
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);
  const STAGES = ['Ask', 'Valves', 'Retain', 'Write', 'Read', 'Close', 'Two states', 'Hold'];
  const clamp = value => Math.max(0, Math.min(1, value));
  const lerp = (a, b, u) => a + (b - a) * u;
  // The film's easings (6050-Ch10/lecture.jsx: `enter` for a mark arriving, `smooth` for a
  // quantity moving between two stops, a linear carry for the belt's travel eased at both ends).
  const cubicInOut = u => { const v = clamp(u); return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; };
  const outCubic = u => 1 - Math.pow(1 - clamp(u), 3);
  let lastTime = 0, reduced = false, previousKey = '', captionKey = '', mode = 'wide';

  // --- The scene's own arithmetic: @eq-lstm's last two lines, and nothing else -------------
  // c_t = f (*) c_{t-1} + i (*) c~_t ; h_t = o (*) tanh(c_t). Scalars here, one unit of the
  // chapter's vectors, which is what "illustrative" means and what the boundary says.
  const cellState = (f, i) => f * CARRY + i * CAND;
  const hidden = (o, f, i) => o * Math.tanh(cellState(f, i));
  const two = value => (Math.abs(value) < 5e-5 ? 0 : value).toFixed(2);

  // --- Choreography ------------------------------------------------------------------------
  // Every schedule finishes before its beat ends, so a beat's end state is its whole state and
  // reduced motion can hold it. The order is the film's SLSTMDesign: the highway first, then
  // forget, then write, then read; the book adds the closing of the read valve, which is the
  // question this panel asks.
  const [B0, B1, B2, B3, B4, B5, B6, B7] = beats;
  const T = {
    appear: {start: B1, dur: 1.8},
    travel1: {start: B1 + 2.4, dur: 3.0},
    forget: {start: B2 + 0.4, dur: 3.0},
    input: {start: B3 + 0.4, dur: 2.0},
    carryUp: {start: B3 + 2.4, dur: 1.6},
    travel2: {start: B3 + 4.0, dur: 2.4},
    openRead: {start: B4 + 0.5, dur: 2.5},
    closeRead: {start: B5 + 0.5, dur: 2.0},
    names: {start: B6 + 0.3, dur: 0.8},
    tag: {start: B7 + 0.3, dur: 0.8}
  };

  // --- Geometry ------------------------------------------------------------------------------
  // One picture in drawing units: the belt across the top with the carried value standing on
  // it, the write branch below left, the read branch below right, each valve a port on its own
  // lane. Wide is the desktop figure; narrow is the same topology in a smaller box, with the
  // type stepped down by player.css.
  const LAYOUT = {
    wide: {
      viewBox: '0 0 712 376', beltY: 92, branchY: 250, unit: 56, barW: 26, port: [54, 50], plusR: 18,
      belt: [40, 576], inlet: 76, fValve: 172, mid: 252, plus: 352, tap: 424, ctOut: 508,
      write: [92, 352], ctilde: 76, iValve: 232, riser: 352,
      read: [424, 664], tanhBox: [492, 54, 34], oValve: 576, hOut: 664,
      beltNameY: 114, branchNameY: 272, beltValve: [137, 155], branchValve: [295, 313],
      valueGap: 11, note: [700, 366], tags: {learned: [26, 326, 254, 30]}
    },
    narrow: {
      viewBox: '0 0 360 330', beltY: 70, branchY: 204, unit: 38, barW: 18, port: [40, 38], plusR: 13,
      belt: [12, 300], inlet: 36, fValve: 86, mid: 124, plus: 168, tap: 208, ctOut: 252,
      write: [46, 168], ctilde: 36, iValve: 112, riser: 168,
      read: [208, 336], tanhBox: [244, 42, 26], oValve: 292, hOut: 336,
      beltNameY: 92, branchNameY: 226, beltValve: [109, 127], branchValve: [243, 261],
      valueGap: 9, note: [348, 314], tags: {learned: [12, 274, 212, 28]}
    }
  };
  const num = value => Number(value.toFixed(2));

  // The only measurement in the file, called from layout() and once before mounting.
  function measure() {
    const width = figure.getBoundingClientRect().width || 700;
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

  // --- The picture ----------------------------------------------------------------------------
  function draw(state) {
    const {stage, shown, appear, packet, carried, ghostIn, write, f, i, o, h, hGhost, named, unchanged} = state;
    const g = LAYOUT[mode];
    const parts = [];
    const [PW, PH] = g.port;
    const sub = (base, text) => `${base}<tspan class="lv-sub" dy="${mode === 'wide' ? 4 : 3}">${text}</tspan>`;
    const line = (x1, y1, x2, y2, cls) => parts.push(`<line x1="${num(x1)}" y1="${num(y1)}" x2="${num(x2)}" y2="${num(y2)}" class="${cls}"></line>`);
    const text = (x, y, content, cls, anchor = 'middle', attrs = '') =>
      parts.push(`<text x="${num(x)}" y="${num(y)}" class="${cls}" text-anchor="${anchor}"${attrs}>${content}</text>`);
    // An arrowhead drawn as a path, so the drawing carries no marker ids it would have to
    // keep unique across a redraw.
    const arrow = (x, y, dx, dy) => parts.push(`<path d="M${num(x)} ${num(y)}L${num(x - 9 * dx - 4.5 * dy)} ${num(y - 9 * dy - 4.5 * dx)}L${num(x - 9 * dx + 4.5 * dy)} ${num(y - 9 * dy + 4.5 * dx)}Z" class="lv-head"></path>`);
    // A carried value: a bar standing on its lane, with its number just above the bar's top.
    // A value of zero is a tick on the lane, never an invisible mark and never a blank.
    const bar = (x, baseY, value, cls, attrs = '') => {
      const height = value * g.unit;
      if (height >= 0.6) parts.push(`<rect x="${num(x - g.barW / 2)}" y="${num(baseY - height)}" width="${g.barW}" height="${num(height)}" class="lv-bar ${cls}"${attrs}></rect>`);
      else parts.push(`<line x1="${num(x - g.barW / 2)}" y1="${num(baseY)}" x2="${num(x + g.barW / 2)}" y2="${num(baseY)}" class="lv-bar-zero ${cls}"${attrs}></line>`);
    };
    const ghostBar = (x, baseY, value, attrs = '') =>
      parts.push(`<rect x="${num(x - g.barW / 2)}" y="${num(baseY - value * g.unit)}" width="${g.barW}" height="${num(value * g.unit)}" class="lv-ghost"${attrs}></rect>`);
    const barValue = (x, baseY, value, name, extra = '', printed = value) =>
      text(x, baseY - value * g.unit - g.valueGap, two(printed), `lv-value${extra ? ` ${extra}` : ''}`, 'middle', ` data-value="${name}"`);
    // A valve: the film's port with a vane through it. The vane lies along the flow when the
    // valve is open and across it when shut, so the opening reads without colour and without
    // the number; the number underneath says how much, and the name says which valve.
    const valve = (x, laneY, open, key, label) => {
      const angle = (1 - clamp(open)) * Math.PI / 2, half = (PW - 18) / 2;
      const dx = half * Math.cos(angle), dy = half * Math.sin(angle);
      parts.push(`<g data-valve="${key}" data-open="${open.toFixed(6)}">`
        + `<rect x="${num(x - PW / 2)}" y="${num(laneY - PH / 2)}" width="${PW}" height="${PH}" rx="9" class="lv-port"></rect>`
        + `<line x1="${num(x - dx)}" y1="${num(laneY - dy)}" x2="${num(x + dx)}" y2="${num(laneY + dy)}" class="lv-vane"></line>`
        + `<circle cx="${num(x)}" cy="${num(laneY)}" r="3" class="lv-pivot"></circle></g>`);
      const rows = laneY === g.beltY ? g.beltValve : g.branchValve;
      text(x, rows[0], sub(label, 't'), 'lv-gate-name');
      text(x, rows[1], two(open), 'lv-gate-value', 'middle', ` data-value="${key}"`);
    };

    // Scenery: the whole pathway -- the belt, the two branches, the sum, the tanh and the four
    // station names -- drawn from the first frame and never moved again, so the picture the
    // reader is asked the question about is the picture the answer arrives on. The chapter's
    // order: the additive route exists first; the valves are what get installed on it.
    line(g.belt[0], g.beltY, g.belt[1], g.beltY, 'lv-lane is-belt');
    arrow(g.belt[1], g.beltY, 1, 0);
    line(g.write[0], g.branchY, g.write[1], g.branchY, 'lv-lane');
    line(g.riser, g.branchY, g.riser, g.beltY + g.plusR, 'lv-lane');
    arrow(g.riser, g.beltY + g.plusR, 0, -1);
    line(g.tap, g.beltY, g.tap, g.branchY, 'lv-lane');
    line(g.tap, g.branchY, g.read[1], g.branchY, 'lv-lane');
    arrow(g.read[1] - g.barW / 2 - 6, g.branchY, 1, 0);
    const [tx, tw, th] = g.tanhBox;
    parts.push(`<rect x="${num(tx - tw / 2)}" y="${num(g.branchY - th / 2)}" width="${tw}" height="${th}" rx="7" class="lv-op-box"></rect>`);
    text(tx, g.branchY + (mode === 'wide' ? 5 : 4), 'tanh', 'lv-op-label');
    parts.push(`<circle cx="${num(g.plus)}" cy="${num(g.beltY)}" r="${g.plusR}" class="lv-op-node"></circle>`);
    text(g.plus, g.beltY + (mode === 'wide' ? 7 : 5), '+', 'lv-op-plus');
    text(g.ctOut, g.beltNameY, sub('c', 't'), 'lv-name');
    text(g.ctilde, g.branchNameY, sub('c̃', 't'), 'lv-name');
    text(g.hOut, g.branchNameY, sub('h', 't'), 'lv-name');

    // What the second beat installs: the three valves on the lanes they gate, the candidate
    // waiting at its station, the read branch's output, and the note that says what the
    // openings are and are not. Every one of them exists from that beat's first instant, at
    // opacity zero, so the frame an arrow-key seek parks on is the whole state its caption
    // describes.
    if (shown) {
      parts.push(`<g data-built="" opacity="${num(appear)}">`);
      valve(g.fValve, g.beltY, f, 'f', 'f');
      valve(g.iValve, g.branchY, i, 'i', 'i');
      valve(g.oValve, g.branchY, o, 'o', 'o');
      text(g.note[0], g.note[1], 'illustrative openings', 'lv-note', 'end');
      bar(g.ctilde, g.branchY, CAND, '', ' data-mark="candidate"');
      barValue(g.ctilde, g.branchY, CAND, 'ctilde');
      // The read branch's output, and the dashed mark of where it stood before the valve shut.
      // The number sits above whichever of the two is taller, so it never lands inside the ghost.
      if (hGhost !== null) ghostBar(g.hOut, g.branchY, hGhost, ' data-mark="h-ghost"');
      bar(g.hOut, g.branchY, h, '', ' data-mark="hidden"');
      barValue(g.hOut, g.branchY, Math.max(h, hGhost === null ? 0 : hGhost), 'h', '', h);
      parts.push('</g>');
    }
    text(g.inlet, g.beltNameY, sub('c', 't\u22121'), 'lv-name');
    if (write) {
      bar(write.x, g.branchY, write.v, '', ' data-mark="written"');
      barValue(write.x, g.branchY, write.v, 'written');
    }

    // The ghost of what entered, left at the inlet once the carried value has moved off it, so
    // the reader can compare the belt's two ends. It is drawn only where it clears the bar it
    // is a ghost of.
    if (ghostIn) { ghostBar(g.inlet, g.beltY, CARRY, ' data-mark="inlet-ghost"'); barValue(g.inlet, g.beltY, CARRY, 'carry', 'is-ghost'); }

    // The one object the eye tracks: the carried value, riding the belt from the inlet, through
    // the forget valve, across the sum, to the outlet. Its height is whatever the belt holds
    // where it stands, so the forget valve shrinks it and the sum grows it.
    bar(packet, g.beltY, carried, 'is-packet', ' data-mark="packet"');
    barValue(packet, g.beltY, carried, 'belt');
    if (unchanged) text(packet + g.barW / 2 + (mode === 'wide' ? 10 : 7), g.beltY - carried * g.unit / 2, 'unchanged', 'lv-held', 'start', ' data-held=""');

    // The two states, named in the chapter's words once the mechanism has run.
    if (stage >= 6) {
      parts.push(`<g data-states="" opacity="${num(named)}">`);
      text(g.ctOut, g.beltNameY + (mode === 'wide' ? 17 : 14), 'long-term', 'lv-role');
      text(g.hOut, g.branchNameY + (mode === 'wide' ? 17 : 14), 'working', 'lv-role');
      parts.push('</g>');
    }
    return parts.join('');
  }

  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const stage = stageAt(time);
    // Under reduced motion the picture is the beat's end state: every valve stands at its
    // beat's opening and the carried value stands at its beat's station, never between.
    const held = reducedMotion ? (beats[stage + 1] === undefined ? duration : beats[stage + 1]) - 1e-6 : time;
    const ease = (schedule, shape = cubicInOut) => shape((held - schedule.start) / schedule.dur);
    const between = schedule => held > schedule.start && held < schedule.start + schedule.dur;
    const g = LAYOUT[mode];
    const appear = stage >= 1 ? outCubic(ease(T.appear, u => u)) : 0;
    // The valve openings: each stands at a declared stop and eases to the next one inside the
    // beat that opens or closes it. Nothing here is interpolated outside the declared set
    // except while the valve is visibly turning.
    const f = stage >= 2 ? lerp(STOPS.f[0], STOPS.f[1], ease(T.forget)) : STOPS.f[0];
    const i = stage >= 3 ? lerp(STOPS.i[0], STOPS.i[1], ease(T.input)) : STOPS.i[0];
    const o = stage >= 5 ? lerp(STOPS.o[1], STOPS.o[2], ease(T.closeRead))
      : stage >= 4 ? lerp(STOPS.o[0], STOPS.o[1], ease(T.openRead)) : STOPS.o[0];
    const ct = cellState(f, i), h = hidden(o, f, i);
    // Where the carried value stands, and therefore what the belt holds under it.
    const packet = stage >= 3 ? lerp(g.mid, g.ctOut, cubicInOut(ease(T.travel2, u => u)))
      : stage >= 1 ? lerp(g.inlet, g.mid, cubicInOut(ease(T.travel1, u => u))) : g.inlet;
    const span = g.port[0] / 2;
    const carried = packet <= g.fValve - span ? CARRY
      : packet < g.fValve + span ? lerp(CARRY, f * CARRY, (packet - (g.fValve - span)) / (2 * span))
        : packet <= g.plus - g.plusR ? f * CARRY
          : packet < g.plus + g.plusR ? lerp(f * CARRY, ct, (packet - (g.plus - g.plusR)) / (2 * g.plusR)) : ct;
    // The copy of the candidate the write valve admits, travelling to the sum; its height is
    // the candidate before the valve and the gated candidate after it.
    const up = stage === 3 ? clamp(ease(T.carryUp, u => u)) : 0;
    const writeX = lerp(g.ctilde, g.riser, cubicInOut(up));
    const write = up > 0 && up < 1
      ? {x: writeX, v: writeX < g.iValve - span ? CAND : writeX < g.iValve + span ? lerp(CAND, i * CAND, (writeX - (g.iValve - span)) / (2 * span)) : i * CAND}
      : null;
    // The ghost of what entered is drawn only once the bar has cleared it by more than its own
    // width, so neither the two marks nor the two numbers above them ever touch.
    const ghostIn = stage >= 1 && packet - g.inlet > 2 * g.barW;
    // The dashed mark of the hidden state before the read valve shut, drawn only once it
    // clears the bar it is a ghost of.
    const openH = hidden(STOPS.o[1], f, i);
    const hGhost = stage >= 5 && (openH - h) * g.unit >= 6 ? openH : null;
    const named = stage >= 6 ? outCubic(ease(T.names, u => u)) : 0;
    const unchanged = stage >= 5;
    const moving = (stage >= 1 && (between(T.appear) || between(T.travel1))) || (stage >= 2 && between(T.forget))
      || (stage === 3 && (between(T.input) || between(T.carryUp) || between(T.travel2)))
      || (stage === 4 && between(T.openRead)) || (stage === 5 && between(T.closeRead))
      || (stage === 6 && between(T.names)) || (stage === 7 && between(T.tag));

    // Publish the state the tests read. The declared fixture attributes are never overwritten.
    root.dataset.stage = String(stage);
    root.dataset.gates = [f, i, o].map(v => v.toFixed(6)).join(' ');
    root.dataset.cell = ct.toFixed(6);
    root.dataset.hidden = h.toFixed(6);
    root.dataset.packet = packet.toFixed(2);
    root.dataset.carried = carried.toFixed(6);
    root.dataset.moving = String(moving);
    const classes = {
      'show-formula': stage >= 1,
      'wash-f': stage === 2,
      'wash-i': stage === 3,
      'wash-o': stage === 4 || stage === 5
    };
    for (let s = 0; s < beats.length; s++) root.classList.toggle(`stage-${s}`, s === stage);
    for (const [name, on] of Object.entries(classes)) root.classList.toggle(name, on);
    if (tags.learned) tags.learned.setAttribute('opacity', String(num(stage >= 7 ? outCubic(ease(T.tag, u => u)) : 0)));

    // Redraw only when the picture actually changes, and only from cached geometry.
    const stateKey = [stage, mode, num(appear), f.toFixed(4), i.toFixed(4), o.toFixed(4), packet.toFixed(2),
      carried.toFixed(6), h.toFixed(6), ghostIn, hGhost === null ? '-' : hGhost.toFixed(6),
      write === null ? '-' : `${write.x.toFixed(2)},${write.v.toFixed(4)}`, num(named), unchanged].join('/');
    if (stateKey !== previousKey) {
      previousKey = stateKey;
      drawing.innerHTML = draw({stage, shown: stage >= 1, appear, packet, carried, ghostIn, write, f, i, o, h, hGhost, named, unchanged});
      svg.setAttribute('aria-label', `${STAGES[stage]}.`
        + (stage >= 1 ? ` Forget ${two(f)}, write ${two(i)}, read ${two(o)}.` : ' The belt alone.')
        + ` The belt carries ${two(carried)}`
        + (stage >= 1 ? `; the cell state is ${two(ct)} and the hidden state ${two(h)}.` : '.'));
    }

    // One caption per beat, at most twenty words, saying what is happening now. Every number in
    // it is recomputed from the declared fixture, never typed.
    const carry = word => `<span class="lv-carry-role">${word}</span>`;
    const gate = word => `<span class="lv-gate-role">${word}</span>`;
    const sentence = [
      `The old ${carry('cell state')} rides in at ${two(CARRY)}. What can a ${gate('valve')} do to it?`,
      `Three ${gate('valves')}: forget, write, read. Forget stands wide open, so nothing intervenes.`,
      `The ${gate('forget valve')} closes halfway: the ${carry('carried value')} falls from ${two(CARRY)} to ${two(STOPS.f[1] * CARRY)}.`,
      `The ${gate('write valve')} opens: the ${carry('candidate')} ${two(CAND)} joins at the sum, and the belt reads ${two(cellState(STOPS.f[1], STOPS.i[1]))}.`,
      `The ${gate('read valve')} opens halfway: the ${carry('hidden state')} is ${two(hidden(STOPS.o[1], STOPS.f[1], STOPS.i[1]))}, half of tanh of the belt.`,
      `The ${gate('read valve')} shuts: ${carry('h')} falls to ${two(0)} while the belt still holds ${two(cellState(STOPS.f[1], STOPS.i[1]))}.`,
      `Two states travel: the ${carry('cell state')} ${two(ct)}, long-term; the ${carry('hidden state')} ${two(h)}, working.`,
      `The ${gate('valves')} are learned; the ${carry('belt')} is not erased by closing the one that reads.`][stage];
    // A polite live region must be written only when it changes; render() runs every frame.
    if (captionKey !== sentence) { captionKey = sentence; caption.innerHTML = sentence; }

    // Scrubber-only wording: the caption sentence is already spoken by the live region, so
    // aria-valuetext names the stage and the openings instead of repeating it.
    return `${STAGES[stage]}. Valves ${two(f)}, ${two(i)}, ${two(o)}. Cell state ${two(ct)}, hidden state ${two(h)}.`;
  }

  // One typeset call after mount, guarded. MathJax's lazyAlwaysTypeset list already covers
  // span[id^="eq-"], so on the book page the formulas are normally typeset before this runs and
  // the call is skipped; it is here for a page that opened the disclosure before MathJax
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

  // The picture's accessible name is composed from the declared fixture, so the panel holds no
  // second copy of the witness numbers: moving the fixture moves this sentence too.
  const title = `A conveyor belt running left to right. The previous cell state stands on it at the inlet, ${two(CARRY)} high, and rides through the forget valve, `
    + `across a sum where the write valve admits the candidate ${two(CAND)}, to the outlet as the cell state. A branch leaves the belt through tanh and the read valve `
    + `to become the hidden state. Each valve is a port with a vane, open along the flow and shut across it, with its opening written beneath it: the three openings shown, `
    + `${OPENINGS.map(two).join(', ')}, are illustrative, not measured. At the end the forget valve stands at ${two(STOPS.f[1])}, the write valve at ${two(STOPS.i[1])} and the read valve at ${two(STOPS.o[2])}: `
    + `the hidden state has fallen to ${two(0)} while the cell state still reads ${two(cellState(STOPS.f[1], STOPS.i[1]))}, with a dashed mark where the hidden state stood.`;
  const named = svg.querySelector('title');
  if (named && named.textContent !== title) named.textContent = title;
  if (MEASURED.length !== 2) throw Error('lstm-valves: the chapter\'s two measured means must be declared, so the tests can prove they are never drawn');

  measure();
  window.BookPlayback(root, render, () => { measure(); previousKey = ''; render(lastTime, reduced); });
  typeset();
})();
