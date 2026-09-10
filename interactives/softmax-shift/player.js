(() => {
  const root = document.getElementById('softmax-shift-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  // The panel is the one in-repo mirror of the manuscript fixture
  // (chapters/part1/02-logistic-softmax.qmd:136-138). interactives/manifest.json names those
  // literals and scripts/audit_excerpt_fixtures.py keeps the chapter and this panel together,
  // so nothing below retypes a number the manuscript owns.
  const logits = root.dataset.logits.trim().split(/\s+/).map(Number);
  // The larger of the chapter's two shifts. The sweep runs 0 -> this -> 0; only the seconds
  // below are choreography, and the endpoints are the fixture's.
  const shift = Number(root.dataset.shift);
  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = svg.querySelector('[data-drawing]'), caption = $('[data-caption]');
  const tags = {};
  for (const node of svg.querySelectorAll('foreignObject[data-tag]')) tags[node.dataset.tag] = node;
  // Beats are declared on the pane, so the timeline is stated once. Every stage boundary
  // is a beat: that is what lets the arrow keys land where the mechanism changes. There is
  // no stage strip: the beats are named here, in data-beats order, and the transcript lists
  // them in the same order.
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration || beats[beats.length - 1]);
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);
  const STAGES = ['Ask', 'Exponentiate', 'Normalize', 'Shift by c', 'Cancel', 'Return'];
  const SUB = ['₀', '₁', '₂', '₃'];
  const minus = text => text.replace('-', '−');
  const fixed = (value, digits) => minus(value.toFixed(digits));
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = u => { const v = clamp(u); return v * v * (3 - 2 * v); };
  const lerp = (a, b, u) => a + (b - a) * u;
  let lastTime = 0, reduced = false, previousKey = '', captionKey = '', mode = 'wide';

  // @eq-softmax, evaluated the way this chapter's "one numerical landmine" prescribes:
  // subtract the largest score before exponentiating. That subtraction is the very
  // invariance the scene demonstrates, so it costs nothing mathematically and means
  // Math.exp is never handed a shifted score -- e^(o + 100) is not evaluated here, at
  // any c, and the terms below are the same numbers whatever c is.
  function softmax(scores) {
    const largest = Math.max(...scores);
    const terms = scores.map(score => Math.exp(score - largest));
    const total = terms.reduce((a, b) => a + b, 0);
    return {largest, terms, total, probabilities: terms.map(term => term / total)};
  }
  // The picture shows the raw exponentials e^{o_j} (7.39, 1.65, 0.37, 2.72, sharing 12.12),
  // because the shift beat must show the group scaling by one factor. They equal
  // e^{o_j - m} * e^{m}; e^{x} for positive x is formed as 1 / e^{-x}, so the same discipline
  // holds for the drawing: Math.exp never receives a positive argument anywhere in this file.
  const expRaw = x => (x <= 0 ? Math.exp(x) : 1 / Math.exp(-x));
  // The c = 0 column: the probabilities the shifted marks must stay on.
  const home = softmax(logits);
  const raw = logits.map(expRaw);
  const rawTotal = raw.reduce((a, b) => a + b, 0);

  // Choreography. The sweep climbs 0 -> knee slowly (the rigid translation and the shared
  // scaling are watched as a group), then knee -> shift; the return is the mirror. Both
  // legs are smoothstep, so the join is C1 and nothing jerks. Every intermediate c is the
  // declared computed variant; the chapter evaluates only 0 and the declared shift.
  const knee = Math.min(3, shift);
  const SWEEP = {start: beats[3] + 1.5, slow: 4, fast: 4};
  const RETURN = {start: beats[5], fast: 1.5, slow: 1.5};
  function shiftAt(time) {
    if (time < SWEEP.start) return 0;
    const up = time - SWEEP.start;
    if (up < SWEEP.slow + SWEEP.fast) {
      return up <= SWEEP.slow ? knee * smooth(up / SWEEP.slow)
        : knee + (shift - knee) * smooth((up - SWEEP.slow) / SWEEP.fast);
    }
    if (time < RETURN.start) return shift;
    const down = time - RETURN.start;
    if (down < RETURN.fast + RETURN.slow) {
      return down <= RETURN.fast ? knee + (shift - knee) * (1 - smooth(down / RETURN.fast))
        : knee * (1 - smooth((down - RETURN.fast) / RETURN.slow));
    }
    return 0;
  }
  // Reduced motion holds each beat's state instead of moving between them. c is derived
  // from the stage, never from the clock: 0 before the shift beat, the whole declared shift
  // for the two beats that carry it, and 0 again once the last beat has unwound it.
  const shiftFor = stage => (stage === 3 || stage === 4 ? shift : 0);
  // Geometry-only factor for the blue bars during the sweep. Past c = 6 every bar is clipped
  // and every readout has left, so the factor is capped there and heights are clamped to the
  // ceiling before they reach the DOM. The probability path never sees it.
  const factor = c => 1 / Math.exp(-Math.min(c, 6));

  // --- Geometry ------------------------------------------------------------------------
  // One picture in drawing units. Wide: three groups on one baseline. Stacked (phone
  // widths): the same three groups as three rows with identical internal geometry.
  const RULER = {unit: 24, lo: -1.5, hi: 7.5}, EXP_UNIT = 20, PROB_UNIT = 150, CEILING = 180;
  const BAR = 36, TICK = 26;
  const LAYOUT = {
    wide: {
      viewBox: '0 0 1100 340', ruler: 95, slot: 55, bases: [250, 250, 250], x0: [135, 500, 810],
      c: {x: 345, y: 58, anchor: 'start'}, horizontal: true,
      arrows: [{x1: 420, x2: 460, y: 190}, {x1: 730, x2: 770, y: 190}],
      tags: {scores: [137.5, 0], exp: [502.5, 0], prob: [812.5, 0], sum: [482.5, 26]}
    },
    // Rows are 310 apart: 250 above each baseline for the header lane and the ceiling, and
    // a 60 px footer for the ruler's -1.5 and the slot labels, so no row's header sits in
    // the previous row's footer.
    stacked: {
      viewBox: '0 0 360 920', ruler: 36, slot: 60, bases: [250, 560, 870], x0: [80, 80, 80],
      c: {x: 350, y: 58, anchor: 'end'}, horizontal: false,
      arrows: [{x: 340, y1: 258, y2: 305}, {x: 340, y1: 568, y2: 615}],
      tags: {scores: [90, 0], exp: [90, 310], prob: [90, 620], sum: [70, 336]}
    }
  };
  const BLUE = '#2b6cb0', GREEN = '#2f855a', INK = '#232d4b', GREY = '#8994a2', PALE = '#b8c0ca';
  const blend = (a, b, u) => {
    const channel = i => Math.round(lerp(parseInt(a.slice(i, i + 2), 16), parseInt(b.slice(i, i + 2), 16), u));
    return `#${[1, 3, 5].map(i => channel(i).toString(16).padStart(2, '0')).join('')}`;
  };
  const num = value => Number(value.toFixed(2));

  // The only measurement in the file, called from layout() and once before mounting.
  function measure() {
    const width = figure.getBoundingClientRect().width || 1100;
    mode = width <= 640 ? 'stacked' : 'wide';
    const g = LAYOUT[mode];
    svg.setAttribute('viewBox', g.viewBox);
    for (const [name, [x, y]] of Object.entries(g.tags)) {
      if (!tags[name]) continue;
      tags[name].setAttribute('x', String(x));
      tags[name].setAttribute('y', String(y));
    }
    root.classList.toggle('is-stacked', mode === 'stacked');
  }

  // One draw for every frame, from the state alone: no DOM measurement, no history.
  function draw(state) {
    const {c, stage, relabelled, u1, u2, ghost, expValues, probValues, ceiling, expUsed, divUsed, cText} = state;
    const g = LAYOUT[mode];
    const slot = (group, j) => g.x0[group] + g.slot * j;
    const parts = [];
    const text = (x, y, content, cls, anchor, attrs = '') =>
      parts.push(`<text x="${num(x)}" y="${num(y)}" class="${cls}" text-anchor="${anchor}"${attrs}>${content}</text>`);
    // Slot labels sit on one row below the ruler's lowest level (-1.5 at 36 px), so a score
    // below the baseline never runs into its own label.
    const label = (group, j) => text(slot(group, j), g.bases[group] + 44, `o<tspan dy="4" class="sm-sub">${j}</tspan>`, 'sm-slot', 'middle');
    const breakBar = (x, clip, colour) =>
      parts.push(`<path d="M${num(x - 21)} ${num(clip + 11)}l42 -6M${num(x - 21)} ${num(clip + 18)}l42 -6" stroke="#fff" stroke-width="2.5" fill="none"></path>`
        + `<path d="M${num(x - 21)} ${num(clip + 7)}l42 -6" stroke="${colour}" stroke-width="1" fill="none"></path>`);
    const breakStem = (x, clip) =>
      parts.push(`<path d="M${num(x - 5)} ${num(clip + 9)}l10 -5M${num(x - 5)} ${num(clip + 15)}l10 -5" stroke="${BLUE}" stroke-width="1.5" fill="none"></path>`);

    // Scenery first: the baseline(s), the ruler, the arrows.
    for (const [group, base] of g.bases.entries()) {
      if (group > 0 && !g.horizontal) parts.push(`<line x1="20" y1="${base}" x2="340" y2="${base}" class="sm-baseline"></line>`);
      if (group === 0) parts.push(`<line x1="${g.horizontal ? 60 : 20}" y1="${base}" x2="${g.horizontal ? 1060 : 340}" y2="${base}" class="sm-baseline"></line>`);
    }
    const base0 = g.bases[0], clip0 = base0 - CEILING, lane0 = base0 - 192;
    parts.push(`<line x1="${g.ruler}" y1="${num(base0 - RULER.unit * RULER.hi)}" x2="${g.ruler}" y2="${num(base0 - RULER.unit * RULER.lo)}" class="sm-ruler"></line>`);
    for (let level = Math.ceil(RULER.lo); level <= Math.floor(RULER.hi); level++) {
      const y = base0 - RULER.unit * level;
      parts.push(`<line x1="${g.ruler - 4}" y1="${num(y)}" x2="${g.ruler}" y2="${num(y)}" class="sm-ruler"></line>`);
      text(g.ruler - 7, y + 4, minus(String(level + (relabelled ? shift : 0))), 'sm-ruler-label', 'end', ' data-ruler=""');
    }
    const arrow = (index, used, content) => {
      const a = g.arrows[index], cls = used ? 'sm-arrow is-used' : 'sm-arrow';
      if (g.horizontal) {
        parts.push(`<path d="M${a.x1} ${a.y}H${a.x2}M${a.x2 - 6} ${a.y - 4}L${a.x2} ${a.y}L${a.x2 - 6} ${a.y + 4}" class="${cls}"></path>`);
        text((a.x1 + a.x2) / 2, a.y - 9, content, `sm-arrow-label${used ? ' is-used' : ''}`, 'middle');
      } else {
        parts.push(`<path d="M${a.x} ${a.y1}V${a.y2}M${a.x - 4} ${a.y2 - 6}L${a.x} ${a.y2}L${a.x + 4} ${a.y2 - 6}" class="${cls}"></path>`);
        text(a.x - 9, (a.y1 + a.y2) / 2 + 5, content, `sm-arrow-label${used ? ' is-used' : ''}`, 'end');
      }
    };
    if (stage >= 1) arrow(0, expUsed, 'exp');
    if (stage >= 2) arrow(1, divUsed, divUsed ? `÷ ${fixed(rawTotal, 2)}` : '÷ Σ');

    // The object, seen first as four blue ticks: a level on the ruler. Adding c is a rigid
    // translation of the group; a tick above the ruler parks its value in the lane.
    const shifted = logits.map(o => o + c);
    const level = j => shifted[j] - (relabelled ? shift : 0);
    logits.forEach((o, j) => {
      const x = slot(0, j), y = base0 - RULER.unit * level(j);
      if (level(j) <= RULER.hi) {
        parts.push(`<line x1="${x}" y1="${base0}" x2="${x}" y2="${num(y)}" class="sm-stem"></line>`);
        parts.push(`<rect x="${num(x - TICK / 2)}" y="${num(y - 1.5)}" width="${TICK}" height="3" class="sm-input" data-tick="${j}"></rect>`);
        text(x + 17, y + 5, fixed(shifted[j], 1), 'sm-value sm-input-text', 'start', ` data-value="s${j}"`);
      } else {
        parts.push(`<line x1="${x}" y1="${base0}" x2="${x}" y2="${clip0}" class="sm-stem"></line>`);
        breakStem(x, clip0);
        text(x, lane0, fixed(shifted[j], 1), 'sm-lane sm-input-text', 'middle', ` data-lane="s${j}"`);
      }
      label(0, j);
    });
    text(g.c.x, g.c.y, `c = <tspan data-c>${cText}</tspan>`, 'sm-c-label', g.c.anchor);

    // Seen again as four blue bars: a height. Multiplying by e^{c} is the whole group
    // scaling together about the baseline; a bar past the ceiling is cut, and parks its
    // value while it still has three digits.
    if (stage >= 1) {
      const base1 = g.bases[1], clip1 = base1 - CEILING, lane1 = base1 - 192;
      const k = relabelled ? 1 : factor(c);
      logits.forEach((o, j) => {
        const x = slot(1, j), h = EXP_UNIT * raw[j];
        if (u1 < 1) {
          // A copy of the tick leaves its slot and grows into the bar: the same object twice.
          // Its foot reaches the baseline in the first half of the glide; its top keeps
          // rising to the height e^{o_j} until the end, so a level becomes a height.
          const fromX = slot(0, j), fromY = base0 - RULER.unit * shifted[j];
          const cx = lerp(fromX, x, u1), w = lerp(TICK, BAR, u1);
          const top = lerp(fromY - 1.5, base1 - h, u1), foot = lerp(fromY + 1.5, base1, smooth(u1 * 2));
          const height = Math.max(1, foot - top);
          parts.push(`<rect x="${num(cx - w / 2)}" y="${num(Math.min(top, foot - 1))}" width="${num(w)}" height="${num(height)}" class="sm-input" data-glide="e${j}"></rect>`);
          return;
        }
        const scaled = raw[j] * k, drawn = Math.min(h * k, CEILING);
        parts.push(`<rect x="${num(x - BAR / 2)}" y="${num(base1 - drawn)}" width="${BAR}" height="${num(drawn)}" class="sm-input" data-bar="e${j}"></rect>`);
        if (h * k <= CEILING) {
          if (expValues) text(x, base1 - drawn - 7, fixed(scaled, 2), 'sm-value sm-input-text', 'middle', ` data-value="e${j}"`);
        } else {
          breakBar(x, clip1, BLUE);
          if (expValues && c <= 6 && scaled < 1000) text(x, lane1, fixed(scaled, 2), 'sm-lane sm-input-text', 'middle', ` data-lane="e${j}"`);
        }
        label(1, j);
      });
    }

    // Seen a third time as four green bars: divided by the one shared sum. These do not
    // move; the ink dashes are their c = 0 heights, drawn before c moves.
    if (stage >= 2) {
      const base1 = g.bases[1], base2 = g.bases[2];
      if (ceiling) {
        const y = base2 - PROB_UNIT;
        parts.push(`<line x1="${num(slot(2, 0) - 15)}" y1="${y}" x2="${num(slot(2, 3) + 25)}" y2="${y}" class="sm-ceiling"></line>`);
        text(slot(2, 0) - 25, y + 5, '1', 'sm-ceiling-label', 'end');
      }
      logits.forEach((o, j) => {
        const x = slot(2, j), h = PROB_UNIT * home.probabilities[j];
        if (u2 < 1) {
          const fromX = slot(1, j), fromH = EXP_UNIT * raw[j];
          const cx = lerp(fromX, x, u2), height = lerp(fromH, h, u2), top = lerp(base1, base2, u2) - height;
          parts.push(`<rect x="${num(cx - BAR / 2)}" y="${num(top)}" width="${BAR}" height="${num(height)}" fill="${blend(BLUE, GREEN, u2)}" data-glide="p${j}"></rect>`);
          return;
        }
        parts.push(`<rect x="${num(x - BAR / 2)}" y="${num(base2 - h)}" width="${BAR}" height="${num(h)}" class="sm-prediction" data-bar="p${j}"></rect>`);
        if (probValues) text(x, base2 - h - 7, home.probabilities[j].toFixed(4), 'sm-value sm-prediction-text', 'middle', ` data-value="p${j}"`);
        if (stage >= 3) parts.push(`<line x1="${num(x - 26)}" y1="${num(base2 - h)}" x2="${num(x + 26)}" y2="${num(base2 - h)}" class="sm-ghost" stroke-dasharray="4 3" opacity="${num(ghost)}" data-ghost="${j}"></line>`);
        label(2, j);
      });
    }
    return parts.join('');
  }

  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const stage = stageAt(time);
    // Under reduced motion the picture is the beat's end state, with c jumped to its beat
    // value: every reveal inside a beat has happened, and nothing moves inside it.
    const held = reducedMotion ? (beats[stage + 1] === undefined ? duration : beats[stage + 1]) - 1e-6 : time;
    const c = reducedMotion ? shiftFor(stage) : shiftAt(time);
    const relabelled = (stage === 3 || stage === 4) && c >= shift;
    // The picture is drawn from c to six decimals -- the same resolution the redraw key
    // uses -- so a frame is never a stale drawing of a slightly different shift.
    const drawnC = Number(c.toFixed(6));
    // Publish the state the tests read. dataset.stage is the shared handle; the fixture
    // attributes are not overwritten, so the declared shift stays readable while c moves.
    // c is published before anything is computed from it, so an instrumented Math.exp can
    // name the shift in force at every call it receives.
    root.dataset.stage = String(stage);
    root.dataset.c = String(c);
    const scores = logits.map(logit => logit + c);
    const {probabilities} = softmax(scores);
    const argmax = probabilities.reduce((best, p, i) => (p > probabilities[best] ? i : best), 0);
    const printed = probabilities.map(p => p.toFixed(4)).join(', ');
    root.dataset.probabilities = JSON.stringify(probabilities);
    root.dataset.argmax = String(argmax);

    const atRest = c === 0 || c === shift;
    const state = {
      c: drawnC, stage, relabelled,
      cText: atRest ? minus(String(c)) : fixed(c, 2),
      u1: stage >= 1 ? smooth((held - beats[1]) / 2.5) : 0,
      u2: stage >= 2 ? smooth((held - beats[2]) / 2.5) : 0,
      ghost: stage >= 3 ? clamp((held - beats[3]) / 0.5) : 0,
      expUsed: stage >= 1 && held >= beats[1] + 2.5,
      expValues: stage >= 1 && held >= beats[1] + 3,
      divUsed: stage >= 2 && held >= beats[2] + 2.5,
      probValues: stage >= 2 && held >= beats[2] + 3.5,
      ceiling: stage >= 2 && held >= beats[2] + 4
    };
    const sumRevealed = stage >= 1 && held >= beats[1] + 4.5;
    const classes = {
      'show-exp': stage >= 1, 'show-prob': stage >= 2, 'show-c': stage >= 3, 'show-rhs': stage >= 4,
      'hl-ec': stage === 4 && held >= beats[4] + 2 && held < beats[4] + 4,
      'struck': stage >= 4 && held >= beats[4] + 4,
      'is-relabelled': relabelled,
      // The sum is 12.12 * e^{c} mid-sweep, which is neither printed number: hidden then.
      'show-sum': sumRevealed && (c === 0 || relabelled)
    };
    for (let s = 0; s < beats.length; s++) root.classList.toggle(`stage-${s}`, s === stage);
    for (const [name, on] of Object.entries(classes)) root.classList.toggle(name, on);

    // Redraw only when the picture actually changes, and only from cached geometry.
    const stateKey = [stage, drawnC, mode, relabelled, state.u1.toFixed(4), state.u2.toFixed(4),
      state.ghost.toFixed(2), state.expUsed, state.expValues, state.divUsed, state.probValues, state.ceiling].join('/');
    if (stateKey !== previousKey) {
      previousKey = stateKey;
      drawing.innerHTML = draw(state);
      svg.setAttribute('aria-label', `Shift c = ${c.toFixed(1)}. Scores ${scores.map(s => fixed(s, 1)).join(', ')}.`
        + (stage >= 2 ? ` Probabilities ${printed}.` : ''));
    }

    // One caption per beat, at most twenty words, saying what is happening now. Every
    // number in it is the declared fixture or the calculation above. The last beat spends
    // its first seconds unwinding c and swaps sentences only on arrival, so the live region
    // never says "back at c = 0" while the picture still prints something else.
    const green = word => `<span class="prediction-role">${word}</span>`;
    const sentence = [
      `Four fixed <span class="input-role">scores</span>. Add ${shift} to every one of them — which probability changes?`,
      `Exponentiate: every <span class="input-role">score</span> becomes a positive height, and the tallest stays tallest.`,
      `Divide all four heights by the one shared sum, ${fixed(rawTotal, 2)}: the ${green('green')} heights add to 1.`,
      `<span class="shift-role">c</span> climbs to ${shift}: scores slide up, exponentials swell together, the ${green('green')} bars stay on their c = 0 dashes.`,
      'Same marks, new ruler. The shared factor multiplies top and bottom, so it cancels. Only the differences between scores matter.',
      c > 0
        ? `The shift unwinds back toward c = 0, and not one ${green('green')} bar has moved: ${printed}.`
        : `Back at <span class="shift-role">c</span> = 0: ${green(printed)} — the same four probabilities at every shift.`][stage];
    // A polite live region must be written only when it changes; render() runs every frame.
    if (captionKey !== sentence) { captionKey = sentence; caption.innerHTML = sentence; }

    // Scrubber-only wording: the caption sentence is already spoken by the live region,
    // so aria-valuetext names the stage and the witness numbers instead of repeating it.
    return `${STAGES[stage]}. Shift c = ${c.toFixed(1)}.${stage >= 2 ? ` Probabilities ${printed}.` : ''}`;
  }

  // One typeset call after mount, guarded. MathJax's lazyAlwaysTypeset list already covers
  // span[id^="eq-"], so on the book page the six formulas are normally typeset before this
  // runs and the call is skipped; it is here for a page that opened the disclosure before
  // MathJax finished. Without MathJax the TeX source stays readable, as everywhere else in
  // the book, and data-typeset says which happened. The TeX is never touched.
  function typeset() {
    const done = () => { root.dataset.typeset = root.querySelector('mjx-container') ? 'mathjax' : 'none'; };
    const mathjax = window.MathJax;
    if (mathjax && typeof mathjax.typesetPromise === 'function') {
      if (root.querySelector('mjx-container')) done(); else mathjax.typesetPromise([root]).then(done, done);
      return;
    }
    done();
    // The page's math script loads asynchronously and this scene mounts as soon as the
    // disclosure opens, so MathJax may still be on its way: its lazy typesetter will handle
    // the six spans itself, and the report is refreshed once the page has finished loading.
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => {
        const startup = window.MathJax && window.MathJax.startup;
        if (startup && startup.promise) startup.promise.then(done, done); else done();
      }, {once: true});
    }
  }

  // The picture's accessible name is composed from the declared fixture, so the panel holds
  // no second copy of the witness numbers: moving the fixture moves this sentence too.
  const list = items => `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
  const title = `Four scores, ${list(logits.map(o => fixed(o, 1)))}, as blue ticks on a ruler; their exponentials `
    + `${list(raw.map(v => fixed(v, 2)))} as blue bars sharing the sum ${fixed(rawTotal, 2)}; and the probabilities `
    + `${list(home.probabilities.map(p => p.toFixed(4)))} as green bars, each standing on an ink dash that marks its c = 0 height.`;
  const named = svg.querySelector('title');
  if (named && named.textContent !== title) named.textContent = title;

  measure();
  window.BookPlayback(root, render, () => { measure(); previousKey = ''; render(lastTime, reduced); });
  typeset();
})();
