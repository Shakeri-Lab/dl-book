// One coordinate of a GRU: the keep gate blends the old state with the candidate.
//
// Contract with interactives/shared/playback.js:
//   window.BookPlayback(root, render, layout?)
//   render(time, reduced) -> the scrubber's description; a pure function of
//     (time, reduced) and the dial that never measures the DOM.
//   layout() -> the only place that measures.
//
// One picture: a number line over tanh's range with the old state (a filled circle) and
// the candidate (a hollow diamond) on it, and the keep and write shares as one bar above
// it. The tracked object is the new state, a ring riding just under the line. At full keep
// it sits on the old state; while the reader predicts where it lands at half keep, it is
// not drawn at all. The reveal builds it head to tail from 0: the old state's arrow shrinks
// to its kept share, the candidate's arrow shrinks to its written share and slides onto the
// kept arrow's tip, and the ring lands at that tip. Then the dial sweeps both ways and the
// ring slides along the segment between the candidate and the old state, never leaving it.
// Two stills lose the trade the motion carries: what the keep gives up, the write takes.
(() => {
  const root = document.getElementById('gru-blend-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  // The panel is the one in-repo mirror of the fixture. The chapter trains its gates and
  // prints no state values, so the old state and the candidate are a declared toy inside
  // tanh's range, which is also the drawn line; the keep is the question's own.
  const OLD = Number(root.dataset.old), CAND = Number(root.dataset.candidate);
  const KEEP = Number(root.dataset.keep);
  const [LO, HI] = root.dataset.range.trim().split(/\s+/).map(Number);

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = svg.querySelector('[data-drawing]');
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const slider = $('[data-keep-slider]');
  const readKeep = $('[data-keep-readout]'), readWrite = $('[data-write-readout]');
  // The dial's own ends are the gate's range: fully open and closed.
  const Z_MIN = Number(slider.min), Z_MAX = Number(slider.max);
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration || beats.at(-1));
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);

  // Printed values are hundredths, so the shares a reader adds always sum to the new
  // state printed beside the ring: kept + written, each rounded once.
  const cents = v => Math.round(v * 100);
  const OLD_C = cents(OLD), CAND_C = cents(CAND), KEEP_C = cents(KEEP);
  const minus = text => text.replace(/-/g, '\u2212');
  const fixed = c => minus((c / 100).toFixed(2));
  const gate = c => minus(String(c / 100));
  const shares = z => {
    const keep = cents(z), write = 100 - keep;
    const kept = Math.round(keep * OLD_C / 100), written = Math.round(write * CAND_C / 100);
    return {keep, write, kept, written, total: kept + written};
  };
  const HALF = shares(KEEP);
  const TILDE = 'h\u0303';

  const STAGES = ['Keep fully open', 'Predict', 'The kept share', 'The written share',
    'Halfway', 'Toward the old state', 'Toward the candidate', 'Two jobs'];
  const CAPTIONS = [
    `Keep gate fully open: the new state is the old one, ${fixed(OLD_C)}.`,
    `Halve the keep to ${gate(KEEP_C)}. Where does the new state land?`,
    `The keep takes half of the old state: ${fixed(HALF.kept)}.`,
    `The new state lands at that tip: ${HALF.written < 0 ? `${fixed(HALF.kept)} \u2212 ${fixed(-HALF.written)}` : `${fixed(HALF.kept)} + ${fixed(HALF.written)}`} = ${fixed(HALF.total)}.`,
    `${fixed(HALF.total)} sits halfway between the candidate and the old state.`,
    `More keep pulls the new state toward the old one; full keep returns ${fixed(OLD_C)}.`,
    `Less keep hands the new state to the candidate; closed, the candidate overwrites: ${fixed(CAND_C)}.`,
    'One dial, two jobs: keep z of the old state, write 1 \u2212 z of the candidate.'
  ];
  // Beat 3 speaks in two steps, so the new state's value is said only once the ring has
  // landed: first the written share on its way, then the landing.
  const WRITE_CAPTION = `What is not kept is written: ${gate(HALF.write)} × ${fixed(CAND_C)} = ${fixed(HALF.written)} joins at the tip.`;

  const num = value => String(Number(value.toFixed(4)));
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const ease = v => v * v * (3 - 2 * v);
  const seg = (f, a, b) => clamp01((f - a) / (b - a));
  const lerp = (a, b, u) => a + (b - a) * u;

  // Wide: the desktop figure. Narrow: a phone's 296 units, with its own type sizes and
  // spacing, so every label keeps a legible size instead of shrinking with the picture.
  // Top to bottom: the keep and write bar; each mark's name and value over the line; the
  // line; the ring's rail under it; the chain of shares under the ring, where the chain's
  // tip is the ring's position; and a lower row where the candidate's arrow first appears.
  const MODES = {
    wide: {viewBox: [713, 206], x0: 44, x1: 669, font: 13, tick: 12, name: 15, sub: 11, subDy: 4, glyph: 4.5,
      barText: 25, barY: 33, barH: 10, nameY: 83, valueY: 101, lineY: 114, tickMajor: 5, tickMinor: 3,
      dot: 6.5, diamond: 7.5, rail: 18, ring: 8.5, ringGap: 14, rowA: 157, rowB: 190, labelB: 185,
      half: 4.5, flare: 8, head: 11, gap: 12},
    narrow: {viewBox: [296, 160], x0: 18, x1: 278, font: 12, tick: 11, name: 14, sub: 10, subDy: 3.5, glyph: 4,
      barText: 14, barY: 21, barH: 9, nameY: 53, valueY: 70, lineY: 82, tickMajor: 4.5, tickMinor: 2.5,
      dot: 5.5, diamond: 6.5, rail: 15.5, ring: 7, ringGap: 12, rowA: 119, rowB: 148, labelB: 144,
      half: 4, flare: 7, head: 9, gap: 8}
  };

  let lastTime = 0, reduced = false, previousKey = '', captionKey = '', mode = 'wide', override = null;
  function measure() { mode = (figure.getBoundingClientRect().width || 600) < 600 ? 'narrow' : 'wide'; }

  // The timeline's keep: fully open, halved while the reader predicts, then swept to full
  // keep, to closed, and home. Each glide finishes early in its beat and then holds.
  function keepAt(stage, f) {
    if (stage === 0) return Z_MAX;
    if (stage === 1) return lerp(Z_MAX, KEEP, ease(seg(f, 0, 0.3)));
    if (stage <= 4) return KEEP;
    if (stage === 5) return lerp(KEEP, Z_MAX, ease(seg(f, 0, 0.5)));
    if (stage === 6) return lerp(Z_MAX, Z_MIN, ease(seg(f, 0, 0.6)));
    return lerp(Z_MIN, KEEP, ease(seg(f, 0, 0.4)));
  }

  // Once built, the chain follows the dial: the kept share from 0, the written share from
  // the kept share's tip, and the ring at the written share's tip.
  function chain(st) {
    const kept = st.z * OLD;
    st.kept = {from: 0, to: kept, label: true};
    st.written = {from: kept, to: kept + (1 - st.z) * CAND, lift: 1, label: true};
    st.ring = true;
    return st;
  }

  // Everything the picture shows at one moment, as data. `dial` is the control's value: the
  // ask sets it to the halved keep at once, and only the picture's bar glides there, so no
  // keep between the two is ever printed or spoken while the reader predicts.
  function timeline(stage, f) {
    const z = keepAt(stage, f);
    const st = {stage, z, dial: stage === 1 ? KEEP : z, ring: false, kept: null, written: null, segment: stage >= 4};
    if (stage === 0) { st.ring = true; return st; }
    if (stage === 1) return st;
    if (stage === 2) {
      // The old state as an arrow from 0; the keep shrinks it to its kept share.
      st.kept = {from: 0, to: lerp(OLD, KEEP * OLD, ease(seg(f, 0.12, 0.36))), label: f >= 0.36};
      return st;
    }
    if (stage === 3) {
      // The candidate as an arrow from 0, one row down; the write shrinks it to its share,
      // which slides along its own row until its tail is under the kept arrow's tip and then
      // rises onto that tip, so the two arrows never overlap; the ring lands there.
      st.kept = {from: 0, to: KEEP * OLD, label: true};
      const shrink = ease(seg(f, 0.08, 0.24)), slide = ease(seg(f, 0.24, 0.37)), lift = ease(seg(f, 0.37, 0.44));
      const from = lerp(0, KEEP * OLD, slide);
      st.written = {from, to: from + lerp(CAND, (1 - KEEP) * CAND, shrink), lift, label: f >= 0.44};
      st.ring = f >= 0.44;
      return st;
    }
    return chain(st);
  }

  // A dragged dial shows the finished picture at the dragged keep.
  const dialState = z => chain({stage: beats.length - 1, z, dial: z, ring: true, kept: null, written: null, segment: true});

  function draw(st) {
    const g = MODES[mode], [W] = g.viewBox, s = shares(st.z), parts = [];
    const x = v => g.x0 + (v - LO) / (HI - LO) * (g.x1 - g.x0);
    const width = (text, size) => text.length * size * 0.6;
    const text = (px, py, content, cls, anchor = 'middle', extra = '', size = g.font) =>
      parts.push(`<text x="${num(px)}" y="${num(py)}" class="${cls}" font-size="${size}" text-anchor="${anchor}"${extra}>${content}</text>`);
    const sub = content => `<tspan dy="${g.subDy}" font-size="${g.sub}">${content}</tspan>`;
    const italic = content => `<tspan class="gb-var">${content}</tspan>`;
    // A share as a block arrow along its row; a share of zero is a stub, still a mark.
    const arrow = (a, b, y, cls, mark, extra) => {
      const d = b >= a ? 1 : -1, length = Math.abs(b - a);
      let path;
      if (length < 0.5) path = `M${num(a)} ${num(y - g.flare)}V${num(y + g.flare)}`;
      else {
        const neck = b - d * Math.min(g.head, length);
        path = `M${num(a)} ${num(y - g.half)}H${num(neck)}V${num(y - g.flare)}L${num(b)} ${num(y)}`
          + `L${num(neck)} ${num(y + g.flare)}V${num(y + g.half)}H${num(a)}Z`;
      }
      parts.push(`<path class="gb-arrow ${cls}" data-mark="${mark}"${extra} d="${path}"></path>`);
    };

    // 1. One bar, two shares of one whole, laid out the way the line and the dial are: write
    // on the left, the side of the candidate and of the dial's write-all end; keep on the
    // right, the side of the old state and of keep-all. Each share's name wears the mark of
    // the value it weighs: the candidate's hollow diamond, the old state's filled circle.
    const bw = g.x1 - g.x0, split = g.x1 - st.z * bw, gm = g.glyph;
    parts.push(`<rect class="gb-share-write" data-mark="write-share" data-share="${num(1 - st.z)}" x="${num(g.x0)}" y="${num(g.barY)}" width="${num(split - g.x0)}" height="${num(g.barH)}"></rect>`);
    parts.push(`<rect class="gb-share-keep" data-mark="keep-share" data-share="${num(st.z)}" x="${num(split)}" y="${num(g.barY)}" width="${num(g.x1 - split)}" height="${num(g.barH)}"></rect>`);
    if (split > g.x0 + 0.5 && split < g.x1 - 0.5) parts.push(`<path class="gb-split" d="M${num(split)} ${num(g.barY)}V${num(g.barY + g.barH)}"></path>`);
    parts.push(`<rect class="gb-bar" data-mark="bar" x="${num(g.x0)}" y="${num(g.barY)}" width="${num(bw)}" height="${num(g.barH)}"></rect>`);
    const gy = g.barText - g.font * 0.35;
    parts.push(`<path class="gb-candidate" data-mark="write-glyph" d="M${num(g.x0 + gm)} ${num(gy - gm)}L${num(g.x0 + 2 * gm)} ${num(gy)}L${num(g.x0 + gm)} ${num(gy + gm)}L${num(g.x0)} ${num(gy)}Z"></path>`);
    text(g.x0 + 2 * gm + 5, g.barText, `write 1 \u2212 ${italic('z')}`, 'gb-gate-text', 'start');
    parts.push(`<circle class="gb-old" data-mark="keep-glyph" cx="${num(g.x1 - gm)}" cy="${num(gy)}" r="${num(gm * 0.9)}"></circle>`);
    text(g.x1 - 2 * gm - 5, g.barText, `keep ${italic('z')}`, 'gb-gate-text', 'end');

    // 2. The line over tanh's range: ticks at the quarters, the ends and the middle labelled.
    const q = (HI - LO) / 4;
    let ticks = '';
    for (let k = 0; k <= 4; k++) {
      const tx = x(LO + k * q), t = k % 2 === 0 ? g.tickMajor : g.tickMinor;
      ticks += `M${num(tx)} ${num(g.lineY - t)}V${num(g.lineY + t)}`;
      if (k % 2 === 0) text(tx, g.valueY, minus(String(LO + k * q)), 'gb-scenery', 'middle', '', g.tick);
    }
    parts.push(`<path class="gb-axis" d="M${num(g.x0)} ${num(g.lineY)}H${num(g.x1)}"></path>`);
    parts.push(`<path class="gb-tick" d="${ticks}"></path>`);
    if (st.segment) {
      const a = Math.min(OLD, CAND), b = Math.max(OLD, CAND);
      parts.push(`<path class="gb-segment" data-mark="segment" data-from="${num(a)}" data-to="${num(b)}" d="M${num(x(a))} ${num(g.lineY)}H${num(x(b))}"></path>`);
    }

    // 3. The two carried values the blend reads, each named and valued over its mark.
    const xo = x(OLD), xc = x(CAND), dm = g.diamond;
    parts.push(`<path class="gb-candidate" data-mark="candidate" data-at="${num(CAND)}" d="M${num(xc)} ${num(g.lineY - dm)}L${num(xc + dm)} ${num(g.lineY)}L${num(xc)} ${num(g.lineY + dm)}L${num(xc - dm)} ${num(g.lineY)}Z"></path>`);
    parts.push(`<circle class="gb-old" data-mark="old" data-at="${num(OLD)}" cx="${num(xo)}" cy="${num(g.lineY)}" r="${g.dot}"></circle>`);
    text(xo, g.nameY, `h${sub('t\u22121')}`, 'gb-symbol gb-feature-text', 'middle', '', g.name);
    text(xo, g.valueY, fixed(OLD_C), 'gb-feature-text gb-number', 'middle', ' data-value="old"');
    text(xc, g.nameY, `<tspan class="mechanism-accent">${TILDE}</tspan>${sub('t')}`, 'gb-symbol gb-feature-text', 'middle', '', g.name);
    text(xc, g.valueY, fixed(CAND_C), 'gb-feature-text gb-number', 'middle', ' data-value="candidate"');

    // 4. The new state: a ring on its rail, named on one side and valued on the other.
    if (st.ring) {
      const h = st.z * OLD + (1 - st.z) * CAND, xh = x(h), cy = g.lineY + g.rail;
      parts.push(`<circle class="gb-new" data-mark="new" data-at="${num(h)}" cx="${num(xh)}" cy="${num(cy)}" r="${g.ring}"></circle>`);
      text(xh - g.ringGap, cy + g.font * 0.35, `h${sub('t')}`, 'gb-symbol gb-feature-text', 'end', '', g.name);
      text(xh + g.ringGap, cy + g.font * 0.35, fixed(s.total), 'gb-feature-text gb-number', 'start', ' data-value="new"');
    }

    // 5. The shares, head to tail from 0: the kept share filled like the old state's circle,
    // the written share hollow like the candidate's diamond.
    const x0 = x(0);
    if (st.kept) {
      arrow(x(st.kept.from), x(st.kept.to), g.rowA, 'gb-kept', 'kept', ` data-from="${num(st.kept.from)}" data-to="${num(st.kept.to)}"`);
      if (st.kept.label) {
        text(x0 - g.gap, g.rowA + g.font * 0.35, `<tspan class="gb-gate-text">${gate(s.keep)}</tspan> × ${fixed(OLD_C)} = ${fixed(s.kept)}`,
          'gb-feature-text gb-share-text', 'end', ' data-value="kept"');
      }
    }
    if (st.written) {
      const y = lerp(g.rowB, g.rowA, st.written.lift);
      const a = x(st.written.from), b = x(st.written.to);
      arrow(a, b, y, 'gb-written', 'written', ` data-from="${num(st.written.from)}" data-to="${num(st.written.to)}" data-lift="${num(st.written.lift)}"`);
      if (st.written.label) {
        const content = `${gate(s.write)} × ${fixed(CAND_C)} = ${fixed(s.written)}`, w = width(content, g.font);
        const cx = Math.max(4 + w / 2, Math.min(W - 4 - w / 2, (a + b) / 2));
        text(cx, g.labelB, `<tspan class="gb-gate-text">${gate(s.write)}</tspan> × ${fixed(CAND_C)} = ${fixed(s.written)}`,
          'gb-feature-text gb-share-text', 'middle', ' data-value="written"');
      }
    }
    return parts.join('');
  }

  // The picture's accessible description: what is drawn now, and never where the new state
  // lands before the ring is drawn.
  function describe(st) {
    const s = shares(st.z), d = shares(st.dial);
    const parts = [`A number line from ${minus(String(LO))} to ${minus(String(HI))}: the old state at ${fixed(OLD_C)}, a filled circle, `
      + `and the candidate at ${fixed(CAND_C)}, a hollow diamond`, `the bar gives write ${fixed(d.write)} on the left and keep ${fixed(d.keep)} on the right`];
    if (st.kept && st.kept.label) parts.push(`the kept share, ${gate(s.keep)} times ${fixed(OLD_C)}, is ${fixed(s.kept)}, an arrow from 0`);
    if (st.written && st.written.label) parts.push(`the written share, ${gate(s.write)} times ${fixed(CAND_C)}, is ${fixed(s.written)}, joined at the kept arrow's tip`);
    parts.push(st.ring ? `the new state, a ring, is at ${fixed(s.total)}` : 'the new state is not drawn');
    if (st.segment) parts.push(`it lies on the segment from ${fixed(Math.min(OLD_C, CAND_C))} to ${fixed(Math.max(OLD_C, CAND_C))}`);
    return `${parts.join('; ')}.`;
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
    const st = dragged ? dialState(override) : timeline(stage, f);

    root.dataset.stage = String(stage);
    root.dataset.z = String(st.z);
    root.dataset.override = dragged ? 'dial' : '';
    root.dataset.landed = st.ring ? 'true' : '';

    const stateKey = [mode, JSON.stringify(st, (key, value) => (typeof value === 'number' ? Number(value.toFixed(4)) : value))].join('/');
    if (stateKey !== previousKey) {
      previousKey = stateKey;
      const [width, height] = MODES[mode].viewBox;
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      drawing.innerHTML = draw(st);
      const lit = dragged ? beats.length - 1 : stage;
      formula.classList.toggle('gb-keep-lit', lit === 2 || lit === 5 || lit === 7);
      formula.classList.toggle('gb-write-lit', lit === 3 || lit === 6 || lit === 7);
    }
    const picture = describe(st);
    if (svg.getAttribute('aria-label') !== picture) svg.setAttribute('aria-label', picture);

    // The dial: the thumb, the readout, and the one place its values are spoken. It says
    // what the keep and the write are, never where the new state lands.
    const s = shares(st.dial);
    slider.value = String(st.dial);
    if (readKeep.textContent !== fixed(s.keep)) readKeep.textContent = fixed(s.keep);
    if (readWrite.textContent !== fixed(s.write)) readWrite.textContent = fixed(s.write);
    const spoken = `keep ${fixed(s.keep)}, write ${fixed(s.write)}`;
    if (slider.getAttribute('aria-valuetext') !== spoken) slider.setAttribute('aria-valuetext', spoken);

    const sentence = dragged
      ? `Kept ${fixed(s.kept)} plus written ${fixed(s.written)}: the new state lands at ${fixed(s.total)}, on the segment.`
      : stage === 3 && !st.ring ? WRITE_CAPTION : CAPTIONS[stage];
    if (captionKey !== sentence) { captionKey = sentence; caption.textContent = sentence; }
    return `${STAGES[stage]}.`;
  }

  // The dial is a detour, not a new default. Dragging pauses playback and redraws the
  // finished picture at the dragged keep; any timeline action (play from a pause, a scrub,
  // an arrow-key beat) returns to the timeline's own keep.
  function drag() {
    const requested = Math.max(Z_MIN, Math.min(Z_MAX, Math.round(Number(slider.value) * 100) / 100));
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
  // the dragged keep alone.
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

  // While the player runs, the slider's own value text speaks the keep and the write, so the
  // visible readout leaves the accessibility tree.
  $('[data-keep-display]').setAttribute('aria-hidden', 'true');
  // Bound before the transport mounts, so it runs before the transport's own seek: the
  // scrubber is the timeline, and a scrub ends a detour.
  $('[data-controls] input[type="range"]').addEventListener('input', () => { override = null; });
  measure();
  window.BookPlayback(root, render, () => { measure(); previousKey = ''; render(lastTime, reduced); });
  typeset();
})();
