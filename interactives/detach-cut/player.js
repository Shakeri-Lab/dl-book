// A carried state crosses a truncation cut; the gradient of a later loss does not.
//
// Contract with interactives/shared/playback.js:
//   window.BookPlayback(root, render, layout?)
//   render(time, reduced) -> the scrubber's description; never measures the DOM.
//   layout() -> the only place that measures.
//
// One picture, two lanes over the same stream of steps and one cut. The upper lane carries
// the state across the cut and detaches it there (truncated BPTT); the lower lane starts
// again from a zero state (fixed-window training). The tracked object is a round trip:
// first the value, step 2's contribution to the state, rides forward; then the gradient
// of step 6's loss rides back on the rail under the states. The two lanes' copies of a
// packet are the same thing seen twice, sharing one position until a lane stops its
// copy, and the value and the gradient never move at once.
(() => {
  const root = document.getElementById('detach-cut-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  // The panel is the one in-repo mirror of the declared schematic.
  const STEPS = Number(root.dataset.steps), CHUNK = Number(root.dataset.chunk);
  const SOURCE = Number(root.dataset.source), LOSS = Number(root.dataset.loss);
  const chunkOf = step => Math.floor((step - 1) / CHUNK);
  const CUTS = [];
  for (let step = CHUNK; step < STEPS; step += CHUNK) CUTS.push(step);
  // The value meets the cut after LAST; the loss's own chunk starts at FIRST.
  const LAST = (chunkOf(SOURCE) + 1) * CHUNK, FIRST = chunkOf(LOSS) * CHUNK + 1;
  const BACK = Array.from({length: LOSS - FIRST + 1}, (_, k) => LOSS - k);
  const list = items => `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = svg.querySelector('[data-drawing]');
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration || beats.at(-1));
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);
  const STAGES = ['Two lanes, one cut', `The value rides to step ${LAST}`, 'The carry lane takes the value on; the reset lane restarts',
    `The loss at step ${LOSS}`, 'The gradient runs back', 'Verdicts at the cut', 'The carry lane alone', 'Both lanes, final frame'];
  const CAPTIONS = [
    `Two lanes, one stream, cut after step ${LAST}. What crosses the cut in each lane?`,
    `Step ${SOURCE}'s input enters the state and rides to step ${LAST} in both lanes.`,
    `Carry: the value crosses and reaches step ${STEPS}. Reset: step ${FIRST} starts again from zero.`,
    `Step ${LOSS}'s loss sends its gradient back. How far does it travel in each lane?`,
    `The gradient runs back through steps ${list(BACK)}, then stops at the cut.`,
    'Detach passes the value but not the gradient. Reset passes neither.',
    `Step ${STEPS} uses step ${SOURCE}'s value, yet its loss cannot teach the model to keep it.`,
    'The values cross the boundary; the gradient graph does not.'
  ];
  // The formula part of each lane is lit in the beats where that lane acts at the cut.
  const CARRY_LIT = [2, 4, 5, 6, 7], RESET_LIT = [2, 4, 5, 7];
  const LANES = [
    {name: 'carry', title: 'carry, detached', verdicts: ['value crosses', 'gradient stops']},
    {name: 'reset', title: 'reset to zero', verdicts: ['value stops', 'gradient stops']}
  ];

  const num = value => String(Number(value.toFixed(4)));
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const ease = v => v * v * (3 - 2 * v);
  const seg = (f, a, b) => clamp01((f - a) / (b - a));
  // Rows are offsets inside a lane: its title, the state labels, the state line, the
  // gradient rail under it, the end of each input tick and the input labels. The verdicts
  // sit on the cut itself: the value's in the label row just above the lane, the
  // gradient's just under the stop bar. The wide print is the desktop figure's 713 units;
  // the narrow one is a phone's 296, laid out again rather than shrunk.
  //   tag: [width, height]; zero: [size, center right of the cut];
  //   box: [gap after the last state, width, reach above the line, reach below the rail].
  const MODES = {
    wide: {viewBox: [713, 294], x0: 66, d: 84, gap: 190, r: 12, pr: 6, tri: [11, 5.5], font: 13, tagFont: 12, cutFont: 12,
      verdictFont: 13, verdictGap: 14, titleX: 54, cutLabel: 18, cutTop: 25, lanes: [24, 170],
      rows: {title: 18, label: 40, line: 58, rail: 22, tick: 36, xl: 18}, sub: 3,
      tag: [54, 22], zero: [20, 30], box: [18, 34, 11, 9], stop: 8, ring: 4, gate: [7, 4.5],
      w: {line: 1.5, node: 1.6, trail: 3.2, packet: 1.5, cut: 1.6, ink: 1.6, back: 2.6, stop: 3.2, tick: 1.5, source: 2.6, head: 7, ring: 1.8},
      dash: {cut: '5 4', ghost: '2.5 2'}},
    narrow: {viewBox: [296, 230], x0: 18, d: 30, gap: 110, r: 8, pr: 5, tri: [9, 4.5], font: 12, tagFont: 10, cutFont: 11,
      verdictFont: 11, verdictGap: 11, titleX: 10, cutLabel: 13, cutTop: 18, lanes: [18, 132],
      rows: {title: 14, label: 32, line: 46, rail: 17, tick: 28, xl: 15}, sub: 2.5,
      tag: [40, 16], zero: [14, 16], box: [10, 24, 9, 7], stop: 6, ring: 3, gate: [5.5, 3.5],
      w: {line: 1.3, node: 1.3, trail: 2.6, packet: 1.2, cut: 1.3, ink: 1.3, back: 2.2, stop: 2.8, tick: 1.3, source: 2.2, head: 5, ring: 1.5},
      dash: {cut: '4 3', ghost: '2 1.6'}}
  };
  let lastTime = 0, reduced = false, previousKey = '', captionKey = '', mode = 'wide';
  function measure() { mode = (figure.getBoundingClientRect().width || 600) < 600 ? 'narrow' : 'wide'; }

  // Where every mark sits in the current layout.
  function geometry(m) {
    const X = step => m.x0 + (step - 1) * m.d + chunkOf(step) * (m.gap - m.d);
    const cutX = after => (X(after) + X(after + 1)) / 2;
    const lanes = m.lanes.map(top => {
      const line = top + m.rows.line;
      const rail = line + m.rows.rail, tick = line + m.rows.tick, xl = tick + m.rows.xl;
      return {title: top + m.rows.title, label: top + m.rows.label, line, rail, tick, xl, verdict: rail + m.stop + m.verdictGap};
    });
    const boxLeft = X(LOSS) + m.r + m.box[0];
    return {X, cutX, lanes, boxLeft, stopX: cutX(LAST) - m.pr - 2, tipEnd: cutX(FIRST - 1) + m.w.stop / 2 + 1};
  }

  function timeline(stage, f) {
    // Each moving beat glides through its first half and holds its second, so every
    // reveal stands still for at least two seconds and an arrow-key seek lands at rest.
    const glide = beat => (stage === beat ? ease(seg(f, 0, 0.5)) : stage > beat ? 1 : 0);
    return {stage, rise: glide(1), run: glide(2), loss: stage >= 3, back: stage >= 4 ? glide(4) : -1,
      verdicts: stage >= 5, focus: stage === 6};
  }

  // The value in one lane: up the marked input tick into the state, along to the last
  // step before the cut, then on through the detach tag (carry) or to the cut (reset).
  function value(g, m, laneIndex, st) {
    const L = g.lanes[laneIndex], ax = g.X(SOURCE), climb = L.tick - L.line, flat = g.X(LAST) - ax;
    const s = st.rise * (climb + flat);
    const points = [[ax, L.tick]];
    let x = ax, y = L.tick - Math.min(s, climb), fade = 0, restarted = false;
    if (s > climb) { points.push([ax, L.line]); x = ax + (s - climb); y = L.line; }
    if (st.rise >= 1) {
      const run = g.X(LAST) + st.run * (g.X(STEPS) - g.X(LAST));
      if (laneIndex === 0) x = run;
      else {
        x = Math.min(run, g.stopX);
        restarted = run >= g.stopX;
        fade = clamp01((run - g.stopX) / (0.6 * m.d));
      }
    }
    points.push([x, y]);
    const reached = step => (step === SOURCE ? s >= climb : step > SOURCE && y === L.line && x >= g.X(step) - 1e-9);
    return {x, y, fade, restarted, points, reached};
  }

  function draw(st) {
    const m = MODES[mode], g = geometry(m), parts = [];
    const text = (x, y, content, cls, anchor, size, extra = '') =>
      parts.push(`<text x="${num(x)}" y="${num(y)}" class="${cls}" font-size="${size}" text-anchor="${anchor}"${extra}>${content}</text>`);
    const sub = (letter, index) => `${letter}<tspan class="dc-sub" dy="${m.sub}">${index}</tspan>`;
    const line = (x1, y1, x2, y2, cls, width, extra = '') =>
      parts.push(`<line class="${cls}" x1="${num(x1)}" y1="${num(y1)}" x2="${num(x2)}" y2="${num(y2)}" stroke-width="${width}"${extra}></line>`);
    const head = (x, y, cls) => {
      const h = m.w.head;
      parts.push(`<path class="${cls}" d="M${num(x)} ${num(y)}l${num(-h)} ${num(-h * 0.55)}v${num(h * 1.1)}z"></path>`);
    };
    const box = (cx, cy, w, h, cls, extra = '') =>
      parts.push(`<rect class="${cls}" x="${num(cx - w / 2)}" y="${num(cy - h / 2)}" width="${num(w)}" height="${num(h)}" rx="3" stroke-width="${m.w.ink}"${extra}></rect>`);

    // The cut crosses both lanes. Once the verdicts are written on it, a white knockout
    // behind each one interrupts the dashed line; the knockouts sit outside the lane groups,
    // so a dimmed lane never lets the line show through its words.
    const [, H] = m.viewBox, size = m.verdictFont;
    const verdicts = LANES.flatMap((lane, k) => [[lane.verdicts[0], g.lanes[k].label, 'value'], [lane.verdicts[1], g.lanes[k].verdict, 'gradient']]);
    CUTS.forEach(after => {
      text(g.cutX(after), m.cutLabel, 'cut', 'dc-cut-label', 'middle', m.cutFont);
      line(g.cutX(after), m.cutTop, g.cutX(after), H - 6, 'dc-cut', m.w.cut, ` stroke-dasharray="${m.dash.cut}" data-mark="cut" data-after="${after}"`);
    });
    if (st.verdicts) {
      verdicts.forEach(([words, y]) => {
        const w = words.length * size * 0.56 + 6;
        parts.push(`<rect class="dc-knock" x="${num(g.cutX(LAST) - w / 2)}" y="${num(y - size * 0.8)}" width="${num(w)}" height="${num(size * 1.05)}"></rect>`);
      });
    }

    LANES.forEach((lane, k) => {
      const L = g.lanes[k], v = value(g, m, k, st);
      parts.push(`<g data-mark="lane-${lane.name}"${st.focus && k === 1 ? ' opacity="0.3"' : ''}>`);
      text(m.titleX, L.title, lane.title, 'dc-title', 'start', m.font);
      // Scenery: the chain of states, one input tick under each, the labels.
      for (let step = 1; step <= STEPS; step++) {
        const x = g.X(step), source = step === SOURCE ? ' is-source' : '';
        text(x, L.label, sub('h', step), 'dc-label', 'middle', m.font, ` data-label="h" data-step="${step}"`);
        text(x, L.xl, sub('x', step), `dc-label${source}`, 'middle', m.font, ` data-label="x" data-step="${step}"`);
        line(x, L.line + m.r, x, L.tick, `dc-tick${source}`, source ? m.w.source : m.w.tick, ` data-step="${step}"`);
        if (step === STEPS) continue;
        const next = g.X(step + 1);
        if (!CUTS.includes(step)) {
          line(x + m.r, L.line, next - m.r - m.w.head + 0.5, L.line, 'dc-arrow', m.w.line);
          head(next - m.r, L.line, 'dc-head');
        } else if (k === 0) {
          line(x + m.r, L.line, next - m.r - m.w.head + 0.5, L.line, 'dc-arrow', m.w.line, ' data-mark="crossing"');
          head(next - m.r, L.line, 'dc-head');
        } else {
          line(x + m.r, L.line, g.cutX(step), L.line, 'dc-arrow', m.w.line, ' data-mark="stub"');
        }
      }
      // The value's path so far, under the states it has reached.
      if (st.rise > 0) {
        parts.push(`<polyline class="dc-trail" points="${v.points.map(([x, y]) => `${num(x)},${num(y)}`).join(' ')}" stroke-width="${m.w.trail}" data-mark="value-trail"></polyline>`);
      }
      for (let step = 1; step <= STEPS; step++) {
        parts.push(`<circle class="dc-node${v.reached(step) ? ' is-carrying' : ''}" cx="${num(g.X(step))}" cy="${num(L.line)}" r="${m.r}" stroke-width="${m.w.node}" data-mark="node" data-step="${step}"></circle>`);
      }
      // Every state the gradient has run back under wears a wine ring: only the loss's own
      // chunk, so the steps behind the cut never get one, however much of their value arrived.
      if (st.back >= 0) {
        const tip = g.boxLeft - 2 + st.back * (g.tipEnd - (g.boxLeft - 2));
        for (let step = FIRST; step <= LOSS; step++) {
          if (tip <= g.X(step)) parts.push(`<circle class="dc-sensed" cx="${num(g.X(step))}" cy="${num(L.line)}" r="${num(m.r + m.ring)}" stroke-width="${m.w.ring}" data-mark="sensed" data-step="${step}"></circle>`);
        }
      }
      // The value itself: solid while it travels; in the reset lane it fades to a ring at the cut.
      if (v.fade < 1) {
        parts.push(`<circle class="dc-value" cx="${num(v.x)}" cy="${num(v.y)}" r="${m.pr}" stroke-width="${m.w.packet}" data-mark="value"${v.fade > 0 ? ` opacity="${num(1 - v.fade)}"` : ''}></circle>`);
      }
      if (v.fade > 0) {
        parts.push(`<circle class="dc-ghost" cx="${num(v.x)}" cy="${num(v.y)}" r="${m.pr}" stroke-width="${m.w.ink}" stroke-dasharray="${m.dash.ghost}" data-mark="value-ghost"${v.fade < 1 ? ` opacity="${num(v.fade)}"` : ''}></circle>`);
      }
      // What each lane puts at the cut: a detach tag on the carried arrow, or a zero start.
      CUTS.forEach(after => {
        const cx = g.cutX(after);
        if (k === 0) {
          // Once the verdicts are written, the tag gains a forward point: a one-way gate that the
          // value passes and the gradient, stopped on the rail beneath it, does not.
          const gate = st.verdicts, shift = gate ? m.gate[0] / 2 + 1 : 0;
          box(cx, L.line, m.tag[0] + (gate ? m.gate[0] + 3 : 0), m.tag[1], 'dc-tag', ` data-mark="detach"${gate ? ' data-gate="one-way"' : ''}`);
          text(cx - shift, L.line + m.tagFont * 0.35, 'detach', 'dc-tag-text', 'middle', m.tagFont);
          if (gate) {
            const [gw, gh] = m.gate, tipX = cx + m.tag[0] / 2 + m.gate[0] / 2 - 1;
            parts.push(`<path class="dc-gate" d="M${num(tipX)} ${num(L.line)}l${num(-gw)} ${num(-gh)}v${num(2 * gh)}z" data-mark="gate"></path>`);
          }
        } else {
          const zx = cx + m.zero[1], right = zx + m.zero[0] / 2, next = g.X(after + 1) - m.r;
          box(zx, L.line, m.zero[0], m.zero[0], 'dc-zero', ` data-mark="zero" data-feeds="${after + 1}"`);
          text(zx, L.line + m.font * 0.36, '0', 'dc-zero-text', 'middle', m.font);
          line(right, L.line, next - m.w.head + 0.5, L.line, `dc-feed${v.restarted ? ' is-live' : ''}`, m.w.ink, ' data-mark="feed"');
          head(next, L.line, `dc-feed-head${v.restarted ? ' is-live' : ''}`);
        }
      });
      // The loss at the last step: the state is read out into it, and its gradient leaves
      // on the rail beneath the states.
      if (st.loss) {
        const [, bw, above, below] = m.box, top = L.line - above, bottom = L.rail + below;
        line(g.X(LOSS) + m.r, L.line, g.boxLeft - m.w.head + 0.5, L.line, 'dc-arrow', m.w.line);
        head(g.boxLeft, L.line, 'dc-head');
        parts.push(`<rect class="dc-loss-box" x="${num(g.boxLeft)}" y="${num(top)}" width="${bw}" height="${num(bottom - top)}" rx="4" stroke-width="${m.w.ink}" data-mark="loss" data-step="${LOSS}"></rect>`);
        text(g.boxLeft + bw / 2, (top + bottom) / 2 + m.font * 0.36, sub('L', LOSS), 'dc-loss-text', 'middle', m.font, ' data-label="L"');
      }
      if (st.back >= 0) {
        const tip = g.boxLeft - 2 + st.back * (g.tipEnd - (g.boxLeft - 2)), [tw, th] = m.tri;
        if (tip + tw / 2 < g.boxLeft) line(tip + tw / 2, L.rail, g.boxLeft, L.rail, 'dc-back', m.w.back, ' data-mark="gradient-trail"');
        if (st.back >= 1) line(g.cutX(FIRST - 1), L.rail - m.stop, g.cutX(FIRST - 1), L.rail + m.stop, 'dc-stop', m.w.stop, ' data-mark="stop"');
        parts.push(`<path class="dc-gradient" d="M${num(tip)} ${num(L.rail)}l${num(tw)} ${num(-th)}v${num(2 * th)}z" data-mark="gradient" data-x="${num(tip)}"></path>`);
      }
      // The verdicts, written on the cut in the colour of the packet each one judges.
      if (st.verdicts) {
        verdicts.slice(2 * k, 2 * k + 2).forEach(([words, y, kind]) =>
          text(g.cutX(LAST), y, words, `dc-verdict-${kind}`, 'middle', size, ` data-value="${lane.name}-${kind}"`));
      }
      parts.push('</g>');
    });
    return parts.join('');
  }

  // The picture's accessible description names only what the drawing already shows.
  function describe(st) {
    const sentences = [`Two lanes of ${STEPS} steps, cut after step ${LAST}: carry, detached, above; reset to zero, below.`];
    if (st.stage === 0) sentences.push(`Step ${SOURCE}'s input is marked in both lanes.`);
    if (st.stage === 1) sentences.push(`Step ${SOURCE}'s value rides to step ${LAST} in both lanes.`);
    if (st.stage >= 2) sentences.push(`In the carry lane step ${SOURCE}'s value crosses the cut through the detach tag and reaches step ${STEPS}; in the reset lane it halts at the cut and step ${FIRST} starts from zero.`);
    if (st.stage >= 3) sentences.push(`Step ${LOSS}'s loss is marked in both lanes.`);
    if (st.stage >= 4) sentences.push(`Its gradient runs back to step ${FIRST} and stops at the cut in both lanes.`);
    if (st.back >= 1) sentences.push(`Wine rings mark steps ${list(BACK.slice().reverse())}, the states it reached; the steps behind the cut have none.`);
    if (st.verdicts) sentences.push(`At the cut: carry, ${LANES[0].verdicts.join(' and ')}; reset, ${LANES[1].verdicts.join(' and ')}. The detach tag now points forward, a one-way gate.`);
    if (st.focus) sentences.push('The reset lane is dimmed.');
    return sentences.join(' ');
  }

  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const clamped = Math.max(0, Math.min(duration, time));
    const stage = stageAt(clamped);
    const end = beats[stage + 1] === undefined ? duration : beats[stage + 1];
    const held = reducedMotion ? end - 1e-6 : clamped;
    const f = clamp01((held - beats[stage]) / (end - beats[stage]));
    const st = timeline(stage, f);
    root.dataset.stage = String(stage);
    const key = [mode, JSON.stringify(st)].join('/');
    if (key !== previousKey) {
      previousKey = key;
      svg.setAttribute('viewBox', `0 0 ${MODES[mode].viewBox.join(' ')}`);
      drawing.innerHTML = draw(st);
      formula.classList.toggle('dc-carry-lit', CARRY_LIT.includes(stage));
      formula.classList.toggle('dc-reset-lit', RESET_LIT.includes(stage));
    }
    const label = describe(st);
    if (svg.getAttribute('aria-label') !== label) svg.setAttribute('aria-label', label);
    const sentence = CAPTIONS[stage];
    if (captionKey !== sentence) { captionKey = sentence; caption.textContent = sentence; }
    return `${STAGES[stage]}.`;
  }

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
