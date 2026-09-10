(() => {
  const root = document.getElementById('gate-product-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  // The panel is the one in-repo mirror of the manuscript fixture
  // (chapters/part3/10-sequences-rnn.qmd:419-424 the cell-chain product, :431 the +1
  // forget-bias recommendation, :556 sigma(0) = 1/2 with 0.5^80, :552 "astronomically
  // attenuated, not exactly zero", :588 the measured mean gates). interactives/manifest.json
  // names those literals and scripts/audit_excerpt_fixtures.py keeps the chapter and this
  // panel together, so nothing below retypes a number the manuscript owns.
  const declared = name => root.dataset[name].trim().split(/\s+/).map(Number);
  const HALF = Number(root.dataset.half);        // sigma(0) = 1/2, a fresh LSTM's gate
  const BIAS = Number(root.dataset.bias);        // the chapter's +1 forget-gate bias
  const HORIZON = Number(root.dataset.horizon);  // 80 steps, the recall task's lag
  const MEASURED = declared('measured');         // 0.76 and 0.56, the diagnostic's means: quoted, never drawn
  // The log mapping's floor, in decades: a drawing choice of this scene, stated on the axis,
  // in the caption and in the boundary, and published as data-floor so the tests read it.
  const FLOOR_EXP = 25;

  const sigmoid = x => 1 / (1 + Math.exp(-x));
  const logit = p => Math.log(p / (1 - p));
  // sigma(1) is DERIVED from the declared bias, not typed: "one unit of forget-gate bias
  // moves the default gate" is then literally what this line does. The reference band's
  // bias is derived the same way from the declared gate, so it reads 0 for sigma(0) = 1/2.
  const OPEN = sigmoid(BIAS);
  const TOP_BIAS = logit(HALF);
  // The whole mechanism, in one line: a constant gate held across k steps.
  const retention = (f, k) => Math.pow(f, k);
  const clamp = value => Math.max(0, Math.min(1, value));
  // The ink of a band cell and the height of a curve point are the SAME mapping, chosen by
  // the axis mode: linear ink is f^k itself; log ink is 1 + log10(f^k) / FLOOR, clipped to
  // [0, 1], so a value at the floor 10^-FLOOR has no ink and a value of 1 has full ink.
  const ink = (f, k, mode) => (mode === 'linear' ? retention(f, k)
    : clamp(1 + Math.log10(retention(f, k)) / FLOOR_EXP));
  // The two anchors this scene exists to compare, and the gap between them, counted.
  const ANCHORS = [[HALF, retention(HALF, HORIZON)], [OPEN, retention(OPEN, HORIZON)]];
  const ORDERS = Math.floor(Math.log10(ANCHORS[1][1] / ANCHORS[0][1]));

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = svg.querySelector('[data-drawing]');
  // The static fallback ships a second print of the final frame, laid out for a narrow
  // pane, for the script-free reader on a phone. The player draws for the measured width
  // itself, so that print is dropped the moment the player mounts: one picture, drawn once.
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  // The one parameter control (docs/animation-authoring.md, rule 4's amendment): a real
  // range for b_f, driven by the timeline by default and by the reader when dragged.
  const slider = $('[data-bias-slider]'), readout = $('[data-bias-readout]'), sliderRow = $('.gp-slider');
  const toggle = $('[data-axis-toggle]'), axisButtons = [...toggle.querySelectorAll('button[data-axis]')];
  // The slider's own range is the sweep's range: the timeline visits the slider's maximum
  // and comes back, so the far point of the excursion is read from the markup, not typed.
  const RANGE = Number(slider.max), STEP = Number(slider.step);
  const TICKS = [...slider.list.options].map(option => Number(option.value));
  // Beats are declared on the pane, so the timeline is stated once. Every beat is a
  // boundary the picture crosses; the arrow keys land on them. There is no stage strip:
  // the beats are named here, in data-beats order, and the transcript lists them in order.
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration || beats[beats.length - 1]);
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);
  const STAGES = ['Ask', 'Half open', 'Bias +1', 'Log axis', 'Arrival', 'Sweep', 'Hold'];
  const ramp = (time, span) => clamp((time - span[0]) / (span[1] - span[0]));
  // Cosine ease-in-out: exactly 0 at the start and exactly 1 at the end of a span.
  const ease = u => (1 - Math.cos(Math.PI * clamp(u))) / 2;
  const lerp = (a, b, u) => a + (b - a) * u;

  // --- One formatter, everywhere a reader can see a number ------------------------
  // Three significant figures: the appendix's own printed form (0.5^80 = 8.27 x 10^-25,
  // chapters/appendices/a3-precision-performance.qmd), with a Unicode superscript
  // exponent so the picture, the caption and the transcript print the identical string.
  const SUPERSCRIPT = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
  const power = exponent => `10${exponent < 0 ? '⁻' : ''}`
    + [...String(Math.abs(exponent))].map(digit => SUPERSCRIPT[Number(digit)]).join('');
  function sci(value, digits = 2) {
    let exponent = Math.floor(Math.log10(value));
    let mantissa = value / Math.pow(10, exponent);
    if (Number(mantissa.toFixed(digits)) >= 10) { mantissa /= 10; exponent += 1; }
    return `${mantissa.toFixed(digits)} × ${power(exponent)}`;
  }
  // The order of magnitude a value rounds to: log10 rounded to the nearest integer, which is
  // how Chapter 10 states 0.5^80 ~ 10^-24 and how the caption says 10^-11 of the gradient.
  const order = value => power(Math.round(Math.log10(value)));
  // The ratio badge in words: the ratio to two significant figures, spelt out against the
  // short-scale name of the thousands group it falls in -- "sixteen trillion", "five point
  // three trillion", "one hundred sixty trillion". The lead is the ratio divided by that
  // group's power of ten, so it is always one to three figures and never a number these
  // tables cannot spell (a lead of 5300 once printed "undefined hundred trillion"); a
  // one-digit lead keeps its tenth, so 5.3 is not rounded down to "five"; a lead that
  // rounds up to a thousand climbs to the next name. Beyond the named scales, or below
  // one, the words count orders of magnitude instead -- singular when there is one.
  const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven',
    'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const SCALE = {0: '', 3: 'thousand', 6: 'million', 9: 'billion', 12: 'trillion', 15: 'quadrillion',
    18: 'quintillion', 21: 'sextillion', 24: 'septillion'};
  const words = n => (n < 20 ? ONES[n] : n < 100 ? TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '')
    : ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + words(n % 100) : ''));
  // A lead already rounded to two figures, in words: 16 -> "sixteen", 5.3 -> "five point three".
  const leadWords = lead => {
    if (lead >= 10) return words(Math.round(lead));
    const tenth = Math.round(lead * 10) % 10;
    return `${words(Math.floor(lead))}${tenth ? ` point ${ONES[tenth]}` : ''}`;
  };
  const ordersWords = n => (n === 1 ? 'one order of magnitude' : `${words(n)} orders of magnitude`);
  // {text, line1, line2}: the badge's number and its two word lines.
  function ratioText(ratio) {
    const decades = Math.log10(ratio);
    if (Math.abs(decades) < 0.05) return {text: '× 1', line1: 'the same as', line2: 'the reference'};
    const text = `× ${sci(ratio, 1)}`;
    if (ratio < 1) return {text, line1: ordersWords(Math.max(1, Math.round(-decades))), line2: 'smaller'};
    let group = Math.floor(Math.floor(decades) / 3) * 3;
    let lead = Number((ratio / Math.pow(10, group)).toPrecision(2));
    if (lead >= 1000) { group += 3; lead = Number((ratio / Math.pow(10, group)).toPrecision(2)); }
    if (SCALE[group] === undefined) return {text, line1: ordersWords(Math.round(decades)), line2: 'larger'};
    return {text, line1: `${leadWords(lead)} ${SCALE[group]}`.trim(), line2: 'times larger'};
  }
  const minus = text => text.replace('-', '−');
  // b_f as the band label prints it: 0, +1, +2, −1.35 (trailing zeros trimmed).
  const biasLabel = value => (Math.abs(value) < 1e-9 ? '0'
    : `${value > 0 ? '+' : '−'}${Math.abs(value).toFixed(2).replace(/\.?0+$/, '')}`);
  // b_f as the readout prints it: always two decimals, always signed.
  const biasFixed = value => `${value < 0 ? '−' : '+'}${Math.abs(value).toFixed(2)}`;
  const gateText = f => f.toFixed(3);

  // --- Choreography. Only the seconds below are choreography; every number above is arithmetic.
  const TRAVEL_A = [beats[1], beats[2]];          // the word crosses the reference band, k 0 -> 80
  const SLIDE = [beats[2], beats[2] + 1.5];       // the slider slides 0 -> +1
  const TRAVEL_B = [beats[2] + 1.5, beats[3]];    // the word crosses the live band
  // The axis glides linear -> log over the 0.6 s BEFORE the log beat, so the glide is
  // complete at the beat boundary: an arrow-key seek lands on the finished log picture the
  // beat's caption describes, never on linear marks under log labels.
  const MORPH = [beats[3] - 0.6, beats[3]];
  const ENDS_AT = beats[4];                        // endpoint dots and labels
  const BADGE_AT = beats[4] + 1;                   // bracket and ratio badge
  const UP = [beats[5], beats[5] + 2.5];           // the slider sweeps +1 -> the slider's maximum
  const DOWN = [beats[5] + 2.5, beats[5] + 5];     // and back to +1
  const timelineBias = time => (time < SLIDE[0] ? 0
    : time < UP[0] ? BIAS * ease(ramp(time, SLIDE))
    : time < DOWN[0] ? BIAS + (RANGE - BIAS) * ease(ramp(time, UP))
    : BIAS + (RANGE - BIAS) * (1 - ease(ramp(time, DOWN))));
  // One interpolant for the whole picture: the curves' heights, the bands' ink and the
  // axis labels all follow `mix`; the published mode is the axis the picture is nearer to.
  // The mix is kept to the three decimals the picture is drawn with, so a frame a
  // thousandth of a second either side of the beat is exactly the finished picture.
  const live = time => {
    const mix = Number(ease(ramp(time, MORPH)).toFixed(3));
    return {
      bf: timelineBias(time),
      mode: mix >= 0.5 ? 'log' : 'linear', mix,
      topK: HORIZON * ramp(time, TRAVEL_A),
      botK: time < TRAVEL_B[0] ? 0 : HORIZON * ramp(time, TRAVEL_B),
      showEnd: time >= ENDS_AT, showBadge: time >= BADGE_AT
    };
  };
  // Reduced motion: the same picture at each beat with the word jumped to the beat's END
  // position, the slider at the beat's value -- the sweep beat holds the slider's maximum,
  // so a reduced-motion reader still sees the third state -- and the axis at the beat's mode.
  const held = stage => ({
    bf: stage === 5 ? RANGE : stage >= 2 ? BIAS : 0,
    mode: stage >= 3 ? 'log' : 'linear', mix: stage >= 3 ? 1 : 0,
    topK: stage >= 1 ? HORIZON : 0, botK: stage >= 2 ? HORIZON : 0,
    showEnd: stage >= 4, showBadge: stage >= 4
  });

  // --- Geometry: the one place a quantity becomes a coordinate ---------------------
  // One svg whose viewBox is the measured width by a fixed height, so one user unit is one
  // CSS pixel and text keeps its size at every pane width. Wide (>= 600 px): the chart with
  // its right column of endpoint labels, bracket and badge, then the two bands. Narrow: the
  // chart, the badge as a full-width strip carrying the endpoints, then the bands.
  const HEIGHTS = {wide: 400, narrow: 462};
  const WINE = '#722F37', PARAMETER = '#C05621', INPUT = '#2B6CB0', INK = '#263445';
  const GREY = '#8a93a0', FAINT = '#d5dde5', LINE = '#c8d0d8';
  const num = value => Number(value.toFixed(2));
  function geometry(W) {
    const wide = W >= 600;
    if (wide) {
      const badgeW = 166, badgeX = W - 6 - badgeW;
      return {W, wide, H: HEIGHTS.wide, x0: 108, x1: badgeX - 120, y0: 28, y1: 250,
        bandTop: 300, bandBot: 346, bandH: 32, labelX: 84, colX: badgeX - 110, bracketX: badgeX - 10,
        badgeX, badgeW, badgeH: 78, fs: 15, token: 16, ratioSize: 27, wordSize: 12.5, toggleRight: 8};
    }
    return {W, wide, H: HEIGHTS.narrow, x0: 40, x1: W - 22, y0: 24, y1: 200,
      bandTop: 344, bandBot: 412, bandH: 28, labelX: 40, colX: null, bracketX: null,
      badgeX: 40, badgeW: W - 62, badgeH: 84, fs: 12, token: 13, ratioSize: 26, wordSize: 12.5, toggleRight: 0};
  }
  // An SVG <text> is never measured here: render() runs every animation frame and must not
  // force a layout, so label placement uses this arithmetic advance instead.
  const advance = (text, size) => [...text].reduce((total, ch) =>
    total + (ch === ' ' ? 0.3 : /[A-Z×]/.test(ch) ? 0.75 : /[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/.test(ch) ? 0.4 : 0.6), 0) * size;
  let lastTime = 0, reduced = false, previousKey = '', captionKey = '', litKey = '', figureWidth = 600;
  let override = null, modeOverride = null, lastTimelineMode = null, readoutKey = '', buttonKey = '';
  function measure() {
    figureWidth = Math.max(180, Math.round(figure.getBoundingClientRect().width || 600));
    root.dataset.layout = figureWidth >= 600 ? 'wide' : 'narrow';
    const g = geometry(figureWidth);
    // The slider's track spans exactly the plot's k = 0 ... 80, and the toggle sits inside the
    // plot's top-right corner: both are HTML, placed from the same geometry the picture uses.
    sliderRow.style.gridTemplateColumns = g.wide ? `${g.x0}px ${g.x1 - g.x0}px 1fr` : '';
    toggle.style.right = `${g.W - g.x1 + g.toggleRight}px`;
    toggle.style.top = `${g.y0 + 2}px`;
  }

  const it = 'font-style="italic"';
  const bfText = `<tspan ${it}>b</tspan><tspan ${it} font-size="70%" dy="3">f</tspan><tspan dy="-3">`;

  // The picture, from the state alone: one chart, two bands, one word seen twice.
  function picture(s, g) {
    const {x0, x1, y0, y1} = g, PW = x1 - x0, PH = y1 - y0;
    const parts = [];
    const text = (x, y, content, attrs) => parts.push(`<text x="${num(x)}" y="${num(y)}" ${attrs}>${content}</text>`);
    const X = k => x0 + (k / HORIZON) * PW;
    const yLinear = v => y1 - v * PH;
    const yLog = v => y0 + Math.min(1, -Math.log10(v) / FLOOR_EXP) * PH;
    // The curve's height and the band's ink are one mapping; during the 0.6 s morph the curve
    // glides between the two heights and the ink between the two tints.
    const Y = v => (s.mix <= 0 ? yLinear(v) : s.mix >= 1 ? yLog(v) : lerp(yLinear(v), yLog(v), s.mix));
    const tint = (f, k) => (s.mix <= 0 ? ink(f, k, 'linear') : s.mix >= 1 ? ink(f, k, 'log')
      : lerp(ink(f, k, 'linear'), ink(f, k, 'log'), s.mix));
    const fTop = HALF, fBot = s.f;
    // --- axes ---
    const tickStep = HORIZON / 4;
    parts.push(`<g data-mark="axes" data-mode="${s.mode}">`);
    parts.push(`<line x1="${x0}" y1="${y1}" x2="${x1}" y2="${y1}" stroke="${GREY}" stroke-width="1.2"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1}" stroke="${GREY}" stroke-width="1.2"/>`);
    for (let k = 0; k <= HORIZON; k += tickStep) {
      parts.push(`<line x1="${num(X(k))}" y1="${y1}" x2="${num(X(k))}" y2="${y1 + 5}" stroke="${GREY}"/>`);
      text(X(k), y1 + 19, k, `data-tick="x" text-anchor="middle" fill="${GREY}" font-size="${g.fs - 2}"`);
    }
    text(x1 + 14, y1 + 19, 'k', `data-mark="k" fill="${GREY}" font-size="${g.fs - 1}" ${it}`);
    // The y labels of one axis mode. During the glide both sets are drawn, the linear one
    // fading out and the log one fading in with the same `mix` that moves the curves, so
    // at no frame is a mark drawn against a ruler it does not belong to.
    const yLabels = (which, opacity) => {
      parts.push(`<g data-axis-labels="${which}"${opacity < 1 ? ` opacity="${num(opacity)}"` : ''}>`);
      if (which === 'linear') {
        for (const v of [0, 0.5, 1]) {
          const y = yLinear(v);
          parts.push(`<line x1="${x0 - 5}" y1="${num(y)}" x2="${x0}" y2="${num(y)}" stroke="${GREY}"/>`);
          text(x0 - 9, y + 4, v, `data-tick="y" text-anchor="end" fill="${GREY}" font-size="${g.fs - 2}"`);
          if (v === 0.5) parts.push(`<line data-grid="" x1="${x0}" y1="${num(y)}" x2="${x1}" y2="${num(y)}" stroke="${FAINT}" stroke-dasharray="2 4"/>`);
        }
        text(g.wide ? x0 - 9 : 4, y0 - 10, `<tspan ${it}>f</tspan><tspan dx="1.5" dy="-5" font-size="${g.fs - 6}">k</tspan>`,
          `data-mark="y-title" text-anchor="${g.wide ? 'end' : 'start'}" fill="${GREY}" font-size="${g.fs - 3}"`);
      } else {
        for (let e = 0; e <= FLOOR_EXP; e += 5) {
          const y = y0 + (e / FLOOR_EXP) * PH;
          parts.push(`<line x1="${x0 - 5}" y1="${num(y)}" x2="${x0}" y2="${num(y)}" stroke="${GREY}"/>`);
          text(x0 - 9, y + 4, power(-e), `data-tick="y" text-anchor="end" fill="${GREY}" font-size="${g.fs - 2}"`);
          if (e && e < FLOOR_EXP) parts.push(`<line data-grid="" x1="${x0}" y1="${num(y)}" x2="${x1}" y2="${num(y)}" stroke="${FAINT}" stroke-dasharray="2 4"/>`);
        }
        text(g.wide ? x0 - 9 : 4, y0 - 10, `<tspan ${it}>f</tspan><tspan dx="1.5" dy="-5" font-size="${g.fs - 6}">k</tspan><tspan dy="5"> (log)</tspan>`,
          `data-mark="y-title" text-anchor="${g.wide ? 'end' : 'start'}" fill="${GREY}" font-size="${g.fs - 3}"`);
        text(x0 + 6, y1 - 5, `floor ${power(-FLOOR_EXP)}`, `data-mark="floor" fill="${GREY}" font-size="${g.fs - 4}"`);
      }
      parts.push('</g>');
    };
    if (s.mix > 0 && s.mix < 1) { yLabels('linear', 1 - s.mix); yLabels('log', s.mix); }
    else yLabels(s.mode, 1);
    parts.push('</g>');
    // --- the curves: each is the trace the word leaves as it crosses its band ---
    const path = (f, kmax) => {
      let d = '';
      for (let k = 0; k <= kmax; k++) d += (k ? 'L' : 'M') + num(X(k)) + ' ' + num(Y(retention(f, k)));
      return d;
    };
    const kTop = Math.floor(s.topK), kBot = Math.floor(s.botK);
    if (kTop > 0) parts.push(`<path data-mark="curve-ref" data-k="${kTop}" d="${path(fTop, kTop)}" fill="none" stroke="${WINE}" stroke-width="2" stroke-dasharray="6 4" opacity=".75"/>`);
    if (kBot > 0) parts.push(`<path data-mark="curve-live" data-k="${kBot}" d="${path(fBot, kBot)}" fill="none" stroke="${WINE}" stroke-width="2.6"/>`);
    // --- endpoints, bracket, badge ---
    const vTop = retention(fTop, HORIZON), vBot = retention(fBot, HORIZON), ratio = vBot / vTop;
    const badge = ratioText(ratio);
    if (s.showEnd) {
      const yT = Y(vTop), yB = Y(vBot);
      // The reference endpoint is a hollow ring and the live one a filled dot, so when the
      // two coincide -- both on the floor of a linear axis, or a drag to b_f = 0 -- the
      // picture still shows two endpoints, at the one height they truly share. Neither is
      // ever offset: the dots stand exactly where the curves end.
      parts.push(`<circle data-mark="end-ref" cx="${num(X(HORIZON))}" cy="${num(yT)}" r="5.5" fill="none" stroke="${WINE}" stroke-width="1.5" opacity=".75"/>`);
      parts.push(`<circle data-mark="end-live" cx="${num(X(HORIZON))}" cy="${num(yB)}" r="4" fill="${WINE}"/>`);
      if (g.wide) {
        // Two labels on one column: when the dots come within a line of each other the
        // labels part to a 16 px gap, symmetrically, so neither is written over the other.
        let lT = yT + 5, lB = yB + 5;
        if (Math.abs(lT - lB) < 16) { const mid = (lT + lB) / 2, sign = lB <= lT ? 1 : -1; lT = mid + 8 * sign; lB = mid - 8 * sign; }
        // Both labels stay above the axis line, clear of the axis name k under it.
        const overhang = Math.max(lT, lB) - (y1 - 2);
        if (overhang > 0) { lT -= overhang; lB -= overhang; }
        text(g.colX, lT, sci(vTop), `data-value="end-ref" fill="${WINE}" font-size="${g.fs}" opacity=".8"`);
        text(g.colX, lB, sci(vBot), `data-value="end-live" fill="${WINE}" font-size="${g.fs}" font-weight="600"`);
        if (s.showBadge) {
          const bx = g.bracketX;
          // The bracket ties the badge to the two endpoints: it spans their heights, and is
          // drawn only when they are visibly apart. Coincident endpoints (a linear axis, or
          // b_f = 0) would collapse it to a stray dash beside the ratio; a small but real
          // gap (a drag to b_f = -1 puts the live dot 8 px below the reference, on the
          // floor) is a bracket the reader can see, so it stays.
          if (Math.abs(yT - yB) >= 2) parts.push(`<path data-mark="bracket" d="M${bx - 6} ${num(yB)} H${bx} V${num(yT)} H${bx - 6}" fill="none" stroke="${WINE}" stroke-width="1.5"/>`);
          // The badge: its number and words shrink to the badge's width when a longer ratio
          // (a drag to a negative b_f says "orders of magnitude") would not fit at the
          // designed size, by the same advance estimate the labels use.
          const bw = g.badgeW, bh = g.badgeH, by = Math.max(y0, Math.min(g.bandTop - bh - 8, (yT + yB) / 2 - bh / 2)), bxx = g.badgeX;
          const fit = (content, size) => Math.min(size, (bw - 6) / Math.max(1e-6, advance(content, 1)));
          const wordSize = Math.min(fit(badge.line1, g.wordSize), fit(badge.line2, g.wordSize));
          parts.push(`<g data-mark="badge" data-ratio="${ratio}">`);
          parts.push(`<rect x="${bxx}" y="${num(by)}" width="${bw}" height="${bh}" rx="8" fill="#fbf4f5" stroke="${WINE}" stroke-width="1.5"/>`);
          text(bxx + bw / 2, by + 36, badge.text, `data-value="ratio" text-anchor="middle" fill="${WINE}" font-size="${num(fit(badge.text, g.ratioSize))}" font-weight="700"`);
          text(bxx + bw / 2, by + 57, badge.line1, `data-words="1" text-anchor="middle" fill="${WINE}" font-size="${num(wordSize)}"`);
          text(bxx + bw / 2, by + 71, badge.line2, `data-words="2" text-anchor="middle" fill="${WINE}" font-size="${num(wordSize)}"`);
          parts.push('</g>');
        }
      } else if (s.showBadge) {
        // The strip: the ratio, its words on one line when they fit the strip and on two when
        // they do not, and the two endpoints; every line shrinks to the strip's width when a
        // narrow pane cannot hold it at its designed size, by the same advance estimate.
        const by = y1 + 24, bw = g.badgeW, bxx = g.badgeX, room = bw - 12;
        const fit = (content, size) => Math.min(size, room / Math.max(1e-6, advance(content, 1)));
        const oneLine = `${badge.line1} ${badge.line2}`;
        const lines = advance(oneLine, g.wordSize) <= room ? [oneLine] : [badge.line1, badge.line2];
        const wordSize = Math.min(...lines.map(line => fit(line, g.wordSize)));
        const ends = `${sci(vTop)}  →  ${sci(vBot)}`, endSize = fit(ends, g.fs + 1);
        const bh = lines.length === 1 ? g.badgeH : g.badgeH + 12;
        parts.push(`<g data-mark="badge" data-ratio="${ratio}">`);
        parts.push(`<rect x="${bxx}" y="${by}" width="${num(bw)}" height="${bh}" rx="8" fill="#fbf4f5" stroke="${WINE}" stroke-width="1.5"/>`);
        text(bxx + bw / 2, by + 34, badge.text, `data-value="ratio" text-anchor="middle" fill="${WINE}" font-size="${num(fit(badge.text, g.ratioSize))}" font-weight="700"`);
        lines.forEach((line, index) => text(bxx + bw / 2, by + 54 + 13 * index, line, `data-words="${index + 1}" text-anchor="middle" fill="${WINE}" font-size="${num(wordSize)}"`));
        text(bxx + bw / 2, by + bh - 10, `<tspan data-value="end-ref" opacity=".8">${sci(vTop)}</tspan>  →  <tspan data-value="end-live" font-weight="600">${sci(vBot)}</tspan>`,
          `data-mark="strip-ends" text-anchor="middle" fill="${WINE}" font-size="${num(endSize)}"`);
        parts.push('</g>');
      }
    }
    // --- the river: two bands, cells k = 1 ... 80 painted as the word passes, ink = the mapping ---
    const band = (index, yb, f, revealed, label, bold) => {
      parts.push(`<g data-band="${index}" data-f="${f}" data-mode="${s.mode}">`);
      parts.push(`<rect x="${x0}" y="${yb}" width="${num(PW)}" height="${g.bandH}" fill="none" stroke="${LINE}"/>`);
      for (let k = 1; k <= Math.min(HORIZON, revealed); k++) {
        const a = tint(f, k);
        if (a > 0.004) parts.push(`<rect data-cell="${k}" data-ink="${a.toFixed(6)}" x="${num(X(k - 1))}" y="${yb}" width="${num(PW / HORIZON + 0.3)}" height="${g.bandH}" fill="${WINE}" fill-opacity="${a.toFixed(3)}"/>`);
      }
      if (g.wide) {
        text(g.labelX, yb + 14, `${bfText} = ${label}</tspan>`,
          `data-band-label="${index}" text-anchor="end" fill="${PARAMETER}" font-size="${g.fs}" font-weight="${bold ? 700 : 400}"`);
        text(g.labelX, yb + 29, `<tspan ${it}>f</tspan> = ${gateText(f)}`,
          `data-gate-label="${index}" text-anchor="end" fill="${GREY}" font-size="${g.fs - 3}"`);
      } else {
        text(x0, yb - 6, `${bfText} = ${label}</tspan>`,
          `data-band-label="${index}" fill="${PARAMETER}" font-size="${g.fs}" font-weight="${bold ? 700 : 400}"`);
        text(x0 + advance(`bf = ${label}`, g.fs) + 12, yb - 6, `<tspan ${it}>f</tspan> = ${gateText(f)}`,
          `data-gate-label="${index}" fill="${GREY}" font-size="${g.fs - 1}"`);
      }
      // The token: the word `cat`, in input blue, drawn with the band's ink at its position;
      // when that ink falls under .05 the word is drawn as the grey `· · ·` -- the
      // "unrevealed = ·" convention, here meaning "no longer legible". The word carries a
      // white halo under its strokes (paint-order stroke): its opacity is still the band's
      // ink, but the blue is then seen against white at that ink rather than against wine
      // at the same ink -- blue on wine is nearly isoluminant, and got harder to read as
      // the gate opened, which inverted what more ink means. With the halo the contrast
      // grows with the ink, as it should.
      const p = Math.min(HORIZON, revealed), k = Math.floor(p);
      const a = k === 0 ? 1 : tint(f, k);
      const x = p < 1 ? lerp(x0 + 14, X(0.5), p) : Math.min(X(p - 0.5), x1 - 17), y = yb + g.bandH / 2 + 5;
      if (a < 0.05) text(x, y, '· · ·', `data-token="${index}" data-k="${k}" data-ink="${a.toFixed(6)}" data-blank="" text-anchor="middle" fill="${GREY}" font-size="${g.fs}" opacity=".55"`);
      else text(x, y, 'cat', `data-token="${index}" data-k="${k}" data-ink="${a.toFixed(6)}" text-anchor="middle" fill="${INPUT}" font-size="${g.token}" font-weight="700" opacity="${a.toFixed(3)}" paint-order="stroke" stroke="#fff" stroke-width="3" stroke-linejoin="round"`);
      parts.push('</g>');
    };
    band(0, g.bandTop, fTop, s.topK, biasLabel(TOP_BIAS), false);
    band(1, g.bandBot, fBot, s.botK, biasLabel(s.bf), true);
    for (let k = 0; k <= HORIZON; k += tickStep) {
      text(X(k), g.bandBot + g.bandH + 15, k === 0 ? 'step 1' : k, `data-step="${k}" text-anchor="middle" fill="${GREY}" font-size="${g.fs - 3}"`);
    }
    return {markup: parts.join(''), ratio, badge, vTop, vBot};
  }

  const orange = word => `<span class="gate-product-parameter">${word}</span>`;
  const BF = orange('<i>b</i><sub><i>f</i></sub>');
  const stepWord = n => (n < 100 ? words(n) : String(n));
  // The two claims the linear captions make, computed: the first step at which a band's ink
  // is below a screen's least tint (1/255) for the reference gate and for the opened gate.
  const invisibleAt = f => { let k = 1; while (k < HORIZON && ink(f, k, 'linear') >= 1 / 255) k++; return k; };
  const INVISIBLE_TOP = invisibleAt(HALF), INVISIBLE_BOT = invisibleAt(OPEN);

  function syncControls(stage) {
    // The toggle is live from the log beat on, and always while paused: before that the
    // timeline owns the axis. The check reads the transport's own published state.
    const playing = root.dataset.playing === 'true';
    const enabled = stage >= 3 || !playing;
    const key = `${enabled}/${root.dataset.mode}`;
    if (key === buttonKey) return;
    buttonKey = key;
    for (const button of axisButtons) {
      button.disabled = !enabled;
      button.setAttribute('aria-pressed', String(button.dataset.axis === root.dataset.mode));
    }
  }

  function render(time, reducedMotion) {
    // The reader's drag is a detour from the timeline, not a new default: every timeline act
    // -- a scrub, an arrow-key beat, Play or Space from a pause -- drops it, in the listeners
    // below, before the transport redraws. (A drag while playing pauses first, so the running
    // clock never carries an override; a rule here would be dead code, and a fault-injection
    // sweep showed exactly that.)
    lastTime = time; reduced = reducedMotion;
    const stage = stageAt(time);
    const tl = reducedMotion ? held(stage) : live(time);
    // The reader's axis choice stands until the timeline itself changes axis.
    if (lastTimelineMode !== null && tl.mode !== lastTimelineMode) modeOverride = null;
    lastTimelineMode = tl.mode;
    const dragged = override !== null;
    const bf = dragged ? override : tl.bf;
    const mode = modeOverride || tl.mode;
    const mix = modeOverride ? (modeOverride === 'log' ? 1 : 0) : tl.mix;
    // A drag asks "what survives at this b_f?": both traces are complete and the answer is shown.
    const s = {
      bf, f: sigmoid(bf), mode, mix,
      topK: dragged ? HORIZON : tl.topK, botK: dragged ? HORIZON : tl.botK,
      showEnd: dragged || tl.showEnd, showBadge: dragged || tl.showBadge
    };
    const reached = retention(s.f, HORIZON), ratio = reached / ANCHORS[0][1];

    // Publish the state the tests read. dataset.stage is the shared handle; the fixture
    // attributes are not overwritten, so the declared numbers stay readable while b_f moves.
    root.dataset.stage = String(stage);
    root.dataset.mode = s.mode;
    root.dataset.morph = s.mix.toFixed(3);
    root.dataset.bf = String(s.bf);
    root.dataset.f = String(s.f);
    root.dataset.retention = String(reached);
    root.dataset.ratio = String(ratio);
    root.dataset.topK = String(Math.floor(s.topK));
    root.dataset.botK = String(Math.floor(s.botK));
    root.dataset.override = dragged ? 'slider' : '';
    root.dataset.modeOverride = modeOverride || '';
    root.dataset.floor = String(FLOOR_EXP);
    root.dataset.anchors = JSON.stringify(ANCHORS);
    root.dataset.orders = String(ORDERS);
    root.dataset.biasSet = [0, BIAS, RANGE].join(' ');

    // The formula lights up as the picture earns each part: f^k once a word has been traced
    // across a band, the bias once the slider has moved -- or the moment the reader moves it.
    // Classes are toggled on the spans MathJax produced from \class{...}; the TeX itself is
    // never touched, and without MathJax there is nothing to toggle.
    const lit = [];
    if (stage >= 1 || dragged) lit.push('gp-fk');
    if (stage >= 2 || dragged) lit.push('gp-bias');
    root.dataset.formulaLit = lit.join(' ');
    if (litKey !== root.dataset.formulaLit) {
      litKey = root.dataset.formulaLit;
      for (const name of ['gp-fk', 'gp-bias']) {
        formula.querySelectorAll(`.${name}`).forEach(node => node.classList.toggle('is-lit', lit.includes(name)));
      }
    }

    // The slider follows the timeline unless the reader holds it; its readout and its own
    // aria-valuetext carry sigma(b_f), the horizon value and the ratio in words, so the one
    // control announces what it changes.
    const badge = ratioText(ratio);
    if (!dragged) slider.value = String(s.bf);
    const readoutText = `<i>b</i><sub><i>f</i></sub> = ${biasFixed(s.bf)} &nbsp;·&nbsp; σ(<i>b</i><sub><i>f</i></sub>) = ${gateText(s.f)}`;
    if (readoutKey !== readoutText) { readoutKey = readoutText; readout.innerHTML = readoutText; }
    const ratioWords = badge.line2 === 'times larger' ? `${badge.line1} times the b_f = ${biasLabel(TOP_BIAS)} value`
      : badge.line2 === 'smaller' ? `${badge.line1} smaller than the b_f = ${biasLabel(TOP_BIAS)} value` : `the same as the b_f = ${biasLabel(TOP_BIAS)} value`;
    slider.setAttribute('aria-valuetext', `b_f = ${biasFixed(s.bf)}, σ(b_f) = ${gateText(s.f)}; after ${HORIZON} steps ${sci(reached)}, ${ratioWords}.`);

    // One caption per beat, at most twenty words, saying what is happening now. The two
    // beats that name the answer compute it -- the words, the order of magnitude -- from the
    // timeline's own b_f; while the reader holds the slider the caption is the sentence
    // that is true at every b_f, and the picture carries the numbers.
    const arrival = () => {
      const tlRatio = retention(sigmoid(tl.bf), HORIZON) / ANCHORS[0][1], w = ratioText(tlRatio);
      const lead = w.line2 === 'times larger' ? `${w.line1} times larger` : w.line2 === 'smaller' ? `${w.line1} smaller` : 'The same';
      return `${lead[0].toUpperCase()}${lead.slice(1)}, yet ${order(retention(sigmoid(tl.bf), HORIZON))} of the gradient: attenuated, not exactly zero. Legible only on a log axis.`;
    };
    const drag = `Drag ${BF} yourself: the valve’s resting position decides what survives.`;
    const sentence = dragged ? drag : [
      `A word enters at step 1. How much of its gradient reaches step ${HORIZON}?`,
      `${BF} = ${biasLabel(TOP_BIAS)}: the valve rests half open. By step ${stepWord(INVISIBLE_TOP)} the gradient is already invisible.`,
      `On a linear axis both look dead by step ${stepWord(INVISIBLE_BOT)}.`,
      `On a log axis (floor ${power(-FLOOR_EXP)}) the slopes differ: the gap grows every step.`,
      arrival(), drag, arrival()
    ][stage];
    // A polite live region must be written only when it changes; render() runs every frame.
    if (captionKey !== sentence) { captionKey = sentence; caption.innerHTML = sentence; }

    // Redraw only when the picture actually changes, and only from cached geometry.
    const stateKey = [stage, s.mode, s.mix.toFixed(3), s.bf.toFixed(4), s.topK.toFixed(2), s.botK.toFixed(2),
      s.showEnd, s.showBadge, figureWidth].join('/');
    if (stateKey !== previousKey) {
      previousKey = stateKey;
      const g = geometry(figureWidth);
      const drawn = picture(s, g);
      svg.setAttribute('viewBox', `0 0 ${figureWidth} ${g.H}`);
      svg.setAttribute('aria-label', `${s.mode} axis. b_f = ${biasLabel(s.bf)}, f = ${gateText(s.f)}. `
        + `The word has crossed ${Math.floor(s.topK)} of ${HORIZON} steps on the b_f = ${biasLabel(TOP_BIAS)} band and ${Math.floor(s.botK)} on the b_f = ${biasLabel(s.bf)} band.`
        + (s.showEnd ? ` After ${HORIZON} steps: ${sci(drawn.vTop)} against ${sci(drawn.vBot)}.` : ''));
      drawing.innerHTML = drawn.markup;
    }
    queueMicrotask(() => syncControls(stage));

    // Scrubber-only wording: the caption sentence is already spoken by the live region, so
    // aria-valuetext names the stage, the axis and the gate instead of repeating it.
    return `${STAGES[stage]}. ${s.mode} axis. b_f = ${biasFixed(s.bf)}, f = ${s.f.toFixed(6)}, f to the ${HORIZON} = ${sci(reached)}.`;
  }

  // --- The one parameter control ------------------------------------------------------
  // Dragging pauses playback and takes over: every mark is recomputed from the dragged
  // value. Playback is paused through the transport's own button, so the transport's state
  // stays the transport's; then the override is set and the picture redrawn at the same
  // time, which keeps it. Arrow keys on the focused slider move b_f by its step and never
  // reach the pane's beat seeking: the transport ignores keydown events whose target is not
  // the pane, and this scene stops nothing.
  function drag() {
    // Read the reader's value first: pausing below redraws once from the timeline, and that
    // draw would otherwise write the timeline's b_f back into the slider before it is read.
    const wanted = Math.max(-RANGE, Math.min(RANGE, Number(slider.value)));
    if (root.dataset.playing === 'true') $('[data-action="play"]').click();
    override = wanted;
    render(lastTime, reduced);
  }
  slider.addEventListener('input', drag);
  slider.addEventListener('change', drag);
  // Play from a pause resumes the timeline and its own b_f: the transport handles the
  // click; this runs first (capture) and drops the detour before the first frame.
  pane.addEventListener('click', event => {
    if (event.target.closest('[data-action="play"]') && root.dataset.playing !== 'true') override = null;
  }, true);
  pane.addEventListener('keydown', event => {
    if (event.target !== pane) return;
    if ([' ', 'k', 'K'].includes(event.key) && root.dataset.playing !== 'true') override = null;
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) override = null;
  }, true);
  // A scrub, even one that lands on the same time, is the timeline speaking. Registered before
  // the transport mounts, so it runs before the transport's own seek and the redraw it causes.
  $('[data-controls] input[type="range"]').addEventListener('input', () => { override = null; });
  for (const button of axisButtons) {
    button.addEventListener('click', () => {
      if (button.disabled) return;
      modeOverride = button.dataset.axis;
      render(lastTime, reduced);
    });
  }

  // One typeset call after mount, guarded. MathJax's lazyAlwaysTypeset list already covers
  // span[id^="eq-"], so on the book page the formula is normally typeset before this runs
  // and the call is skipped; it is here for a page that opened the disclosure before
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
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => {
        const startup = window.MathJax && window.MathJax.startup;
        if (startup && startup.promise) startup.promise.then(done, done); else done();
      }, {once: true});
    }
  }

  // The picture's accessible name is composed from the declared fixture, so the panel holds
  // no second copy of the witness numbers: moving the fixture moves this sentence too.
  const finalRatio = ratioText(ANCHORS[1][1] / ANCHORS[0][1]);
  const title = `One chart of f to the k for two forget-gate biases, b_f = ${biasLabel(TOP_BIAS)} (f = ${gateText(HALF)}) dashed and `
    + `b_f = ${biasLabel(BIAS)} (f = ${gateText(OPEN)}) solid, on a log axis with floor ${power(-FLOOR_EXP)}: after ${HORIZON} steps `
    + `${sci(ANCHORS[0][1])} against ${sci(ANCHORS[1][1])}, ${finalRatio.line1} ${finalRatio.line2}. Under it two signal-retention bands `
    + `whose ink is the same mapping, the b_f = ${biasLabel(TOP_BIAS)} band white at step ${HORIZON} and the b_f = ${biasLabel(BIAS)} band still tinted, `
    + `with the word cat faint but legible on the second and gone from the first.`;
  const named = svg.querySelector('title');
  if (named && named.textContent !== title) named.textContent = title;

  measure();
  window.BookPlayback(root, render, () => { measure(); previousKey = ''; render(lastTime, reduced); });
  typeset();
})();
