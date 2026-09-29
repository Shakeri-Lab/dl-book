// Editing this scene later: read docs/pair-recount-excerpt.md first ("Notes for a future edit"
// names the timetable, the open judgements and the re-verification steps).
// Every round counts the pairs again: byte pair encoding on the chapter's toy corpus.
//
// Contract with interactives/shared/playback.js:
//   window.BookPlayback(root, render, layout?)
//   render(time, reduced) -> the scrubber's description; a pure function of
//     (time, reduced) that never measures the DOM.
//   layout() -> the only place that measures.
//
// One picture: the four counted words of the corpus line (chapters/part4/15-bert-pretraining.qmd,
// the bpe-mechanism cell) as rows of tiles, and a count axis beside them. The tracked object
// is w+e's support: one ink arc over each adjacent w, e in the current pieces, and the tally
// those arcs build. The rival l+o (slate) is scenery until its round. Tiles fuse at each
// merge; that fusion is the operation. An arc snaps when a merge absorbs one of its symbols,
// and at the next count its segment leaves the tally. The player runs the chapter's own loop
// (a fresh count of the current pieces every round, the maximum, the least tied pair in
// lexicographic order, then merge_pair) on the panel's declared corpus and never retypes a
// count: every tile, total, level and label below is read off that loop.
(() => {
  const root = document.getElementById('pair-recount-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  const listOf = name => root.dataset[name].trim().split(/\s+/);
  // The panel is the one in-repo mirror of the fixture: the corpus line, the end-of-word
  // marker, the merge budget and the tie-break rule, plus the declared layout (which pair is
  // tracked, which is the rival, the count axis).
  const WORDS = listOf('words'), FREQUENCIES = listOf('frequencies').map(Number);
  const END = root.dataset.endMarker, ROUNDS = Number(root.dataset.merges);
  const TRACKED = listOf('tracked'), RIVAL = listOf('rival');
  const [AXIS_LOW, AXIS_HIGH] = listOf('countAxis').map(Number);
  if (root.dataset.tieBreak !== 'lexicographic') throw Error('pair-recount: the chapter breaks ties in lexicographic order');

  // --- The chapter's loop ------------------------------------------------------------
  // Pairs compare element by element, as Python compares tuples, not as joined strings.
  const compare = (a, b) => (a[0] !== b[0] ? (a[0] < b[0] ? -1 : 1) : a[1] === b[1] ? 0 : a[1] < b[1] ? -1 : 1);
  const same = (a, b) => a[0] === b[0] && a[1] === b[1];
  const nameOf = pair => pair.join('+');
  function mergePair(symbols, pair) {
    const merged = [];
    let index = 0;
    while (index < symbols.length) {
      if (index + 1 < symbols.length && symbols[index] === pair[0] && symbols[index + 1] === pair[1]) {
        merged.push(pair.join('')); index += 2;
      } else { merged.push(symbols[index]); index += 1; }
    }
    return merged;
  }
  // counts: Counter[tuple[str, str]] = Counter(), filled from the current pieces.
  function countPairs(words) {
    const counts = new Map();
    words.forEach((symbols, w) => {
      for (let i = 0; i + 1 < symbols.length; i++) {
        const pair = [symbols[i], symbols[i + 1]], key = pair.join('\n');
        const entry = counts.get(key) || {pair, count: 0};
        entry.count += FREQUENCIES[w];
        counts.set(key, entry);
      }
    });
    return [...counts.values()];
  }
  const START = WORDS.map(word => [...word, END]);
  const HISTORY = [];
  let pieces = START;
  for (let round = 0; round < ROUNDS; round++) {
    const counts = countPairs(pieces);
    const maximum = Math.max(...counts.map(entry => entry.count));
    const tied = counts.filter(entry => entry.count === maximum).map(entry => entry.pair).sort(compare);
    HISTORY.push({words: pieces, counts, maximum, tied, best: tied[0]});
    pieces = pieces.map(symbols => mergePair(symbols, tied[0]));
  }
  const FINAL = pieces;
  const after = merged => (merged < ROUNDS ? HISTORY[merged].words : FINAL);
  const occurrences = (pair, symbols) => {
    let found = 0;
    for (let i = 0; i + 1 < symbols.length; i++) if (symbols[i] === pair[0] && symbols[i + 1] === pair[1]) found += 1;
    return found;
  };
  // A piece is a run of the word's starting symbols: [a, b) in slot units.
  const rangesOf = (w, symbols) => {
    let slot = 0;
    return symbols.map(text => {
      const a = slot;
      let length = 0;
      while (length < text.length) length += START[w][slot++].length;
      return {text, a, b: slot};
    });
  };

  // --- The declared timeline ---------------------------------------------------------
  // One window per merge of the loop; the counts the picture draws (round 1 from the start,
  // the round-2 recount, the round-4 count); rounds 3 and 5 are folded into their merges.
  const MERGE_AT = [[5.0, 5.8], [10.0, 10.6], [11.0, 11.6], [22.0, 22.6], [23.0, 23.6]];
  const COUNTS = [{round: 0, at: null}, {round: 1, at: [6.4, 7.2]}, {round: 3, at: [15.0, 16.0]}];
  const LOSS = 0.4, RETIRE = 0.8, SLIDE = 0.75;
  if (MERGE_AT.length !== ROUNDS) throw Error('pair-recount: the timeline draws one fusion per merge of the loop');

  const clamp01 = v => Math.max(0, Math.min(1, v));
  const ease = v => { const x = clamp01(v); return x * x * (3 - 2 * x); };
  const phase = (t, [a, b]) => ease((t - a) / (b - a));
  const num = value => String(Number(value.toFixed(4)));
  const escape = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const mergedBy = t => { let k = 0; while (k < ROUNDS && t >= MERGE_AT[k][1]) k += 1; return k; };

  // Each drawn pair's arcs: one per adjacent occurrence in the starting symbols, with the
  // merge that ends it and how. 'snap': a merge absorbed the right symbol, and a dashed stub
  // stays on the left one. 'dissolve': a merge absorbed the left symbol. 'spent': the pair
  // itself merged.
  function arcsOf(pair) {
    const arcs = [];
    START.forEach((symbols, w) => {
      for (let i = 0; i + 1 < symbols.length; i++) {
        if (symbols[i] !== pair[0] || symbols[i + 1] !== pair[1]) continue;
        let lost = null;
        for (let k = 0; k < ROUNDS && !lost; k++) {
          const ranges = rangesOf(w, after(k + 1)[w]);
          const left = ranges.find(r => r.a <= i && i < r.b), right = ranges.find(r => r.a <= i + 1 && i + 1 < r.b);
          if (left === right) lost = {k, kind: 'spent', window: MERGE_AT[k]};
          else if (right.b - right.a > 1) lost = {k, kind: 'snap', window: [MERGE_AT[k][1], MERGE_AT[k][1] + LOSS]};
          else if (left.b - left.a > 1) lost = {k, kind: 'dissolve', window: [MERGE_AT[k][1], MERGE_AT[k][1] + LOSS]};
        }
        arcs.push({w, i, lost});
      }
    });
    return arcs;
  }
  const contributions = (pair, merged) => after(merged).map((symbols, w) => FREQUENCIES[w] * occurrences(pair, symbols));
  const total = values => values.reduce((sum, value) => sum + value, 0);
  function tallyOf(pair, role) {
    const arcs = arcsOf(pair);
    const counted = COUNTS.map(count => contributions(pair, count.round));
    const spentAt = HISTORY.findIndex(entry => same(entry.best, pair));
    // A pair whose every occurrence is gone, with no count left to draw, retires once its
    // last arc has gone: the loop stops after its last merge.
    const lastLoss = Math.max(...arcs.map(arc => (arc.lost ? arc.lost.window[1] : Infinity)));
    const end = spentAt >= 0 ? MERGE_AT[spentAt] : Number.isFinite(lastLoss) ? [lastLoss, lastLoss + RETIRE] : null;
    return {pair, role, arcs, counted, end};
  }
  const TALLIES = [tallyOf(TRACKED, 'tracked'), tallyOf(RIVAL, 'rival')];
  const FIRST = TALLIES.map(tally => total(tally.counted[0]));

  const STAGES = ['The first count', 'Merge 1, then a fresh count', 'Merges 2 and 3',
    'The round 4 count', 'Merges 4 and 5', 'The final pieces'];
  const T = nameOf(TRACKED), R = nameOf(RIVAL), piece = pair => pair.join('');
  const [first, , , fourth, fifth] = HISTORY.map(entry => entry.best);
  const tracked = round => total(contributions(TRACKED, round));
  const CAPTIONS = [
    `At the first count ${T} has ${FIRST[0]} and ${R} ${FIRST[1]}. Merges 1 to 3 each use ${HISTORY[0].maximum}. Which merges fourth?`,
    `Merge 1 fuses ${nameOf(first)}; newest's e now sits inside ${piece(first)}. Counted again, ${T} keeps only lower's ${tracked(1)}.`,
    `Merges 2 and 3 build ${piece(HISTORY[2].best)} in newest and widest at once; lower is untouched.`,
    `Round 4 counts again: ${HISTORY[3].tied.map(nameOf).join(' and ')} tie at ${HISTORY[3].maximum}, ${T} has ${tracked(3)}. Lexicographic order picks ${nameOf(fourth)}.`,
    `Merges 4 and 5 fuse ${nameOf(fourth)}, then ${nameOf(fifth)}, in low and lower; lower's w joins ${piece(fifth)}, and ${T} is gone.`,
    `Counts are redone each round: ${nameOf(first)} took newest's e, so ${T} fell to ${tracked(1)} and ${nameOf(fourth)} won.`
  ];

  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = svg.querySelector('[data-drawing]');
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration || beats.at(-1));
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);

  // Wide: the rows on the left, the count axis on the right. Narrow (below 600 px): the
  // count axis under the rows, so tiles and labels keep their size on a phone.
  const MODES = {
    wide: {size: [713, 250], rows: [38, 94, 150, 206], tileH: 28, arc: 15, nameX: 62, freqX: 70, tilesX: 96,
      charW: 26, endW: 44, gap: 6, glyph: 15, name: 12, freq: 14, x0: 440, unit: 24, pairX: 430,
      level: [72, 204], levelLabel: 62, bars: {tracked: [104, 20], rival: [160, 12]}, segDy: 16,
      axis: 200, axisWord: 216, label: 13, total: 15, seg: 10.5, pad: 6},
    narrow: {size: [296, 372], rows: [30, 80, 130, 180], tileH: 26, arc: 13, nameX: 46, freqX: 50, tilesX: 72,
      charW: 20, endW: 38, gap: 4, glyph: 13, name: 11, freq: 13, x0: 46, unit: 20, pairX: 38,
      level: [244, 350], levelLabel: 236, bars: {tracked: [262, 18], rival: [310, 10]}, segDy: 14,
      axis: 346, axisWord: 362, label: 12, total: 14, seg: 10, pad: 5}
  };
  // A monospace glyph advances 0.6 of its size; the fusion slides glyphs to exactly the
  // places they hold in the merged piece, so the swap to one text node is seamless.
  const ADVANCE = 0.6;

  let lastTime = 0, reduced = false, previousKey = '', mode = 'wide';
  function measure() {
    mode = (figure.getBoundingClientRect().width || 600) < 600 ? 'narrow' : 'wide';
  }

  function picture(t) {
    const g = MODES[mode], parts = [], facts = {rows: [], tallies: [], ghost: null, stub: false, level: null};
    const widthOf = symbol => (symbol === END ? g.endW : g.charW);
    const slotLeft = (w, slot) => {
      let x = g.tilesX;
      for (let j = 0; j < slot; j++) x += widthOf(START[w][j]) + g.gap;
      return x;
    };
    const slotRight = (w, slot) => slotLeft(w, slot) + widthOf(START[w][slot]);
    const middle = (w, slot) => (slotLeft(w, slot) + slotRight(w, slot)) / 2;
    const baseline = (top, height, size) => top + height / 2 + size * 0.35;
    const text = (x, y, content, cls, size, anchor = 'start', extra = '') =>
      `<text x="${num(x)}" y="${num(y)}" class="${cls}" font-size="${size}" text-anchor="${anchor}"${extra}>${escape(content)}</text>`;
    const faded = opacity => (opacity < 1 ? ` opacity="${num(opacity)}"` : '');

    // 1. The rows: grey name, blue frequency, then the current pieces as tiles.
    const merged = mergedBy(t);
    WORDS.forEach((word, w) => {
      const top = g.rows[w], y = baseline(top, g.tileH, g.glyph);
      parts.push(text(g.nameX, baseline(top, g.tileH, g.name), word, 'pr-name', g.name, 'end'));
      parts.push(text(g.freqX, baseline(top, g.tileH, g.freq), `×${FREQUENCIES[w]}`, 'pr-freq', g.freq, 'start', ` data-value="frequency-${word}"`));
      const ranges = rangesOf(w, after(merged)[w]);
      // The merge in progress, if any: merge_pair's left-to-right scan picks the fusing pairs.
      const fusing = new Map();
      let u = 0;
      if (merged < ROUNDS && t >= MERGE_AT[merged][0]) {
        u = phase(t, MERGE_AT[merged]);
        const best = HISTORY[merged].best;
        for (let i = 0; i < ranges.length;) {
          if (i + 1 < ranges.length && ranges[i].text === best[0] && ranges[i + 1].text === best[1]) {
            fusing.set(i, 'left'); fusing.set(i + 1, 'right'); i += 2;
          } else i += 1;
        }
      }
      const tiles = [];
      ranges.forEach((range, i) => {
        let x1 = slotLeft(w, range.a), x2 = slotRight(w, range.b - 1);
        let cx = (x1 + x2) / 2;
        const side = fusing.get(i);
        if (side) {
          const [left, right] = side === 'left' ? [range, ranges[i + 1]] : [ranges[i - 1], range];
          const centre = (slotLeft(w, left.a) + slotRight(w, right.b - 1)) / 2;
          const length = left.text.length + right.text.length, advance = g.glyph * ADVANCE;
          const target = side === 'left' ? centre + (left.text.length / 2 - length / 2) * advance
            : centre + (left.text.length + right.text.length / 2 - length / 2) * advance;
          cx += (target - cx) * u;
          if (side === 'left') x2 += u * g.gap / 2; else x1 -= u * g.gap / 2;
        }
        tiles.push(`<g data-tile data-slots="${range.a} ${range.b}"><rect class="pr-tile" x="${num(x1)}" y="${num(top)}" width="${num(x2 - x1)}" height="${g.tileH}" rx="4"></rect>`
          + `${text(cx, y, range.text, 'pr-glyph', g.glyph, 'middle')}</g>`);
      });
      parts.push(`<g data-row="${word}">${tiles.join('')}</g>`);
      // The seam being welded, in ink, rising and falling with the fusion: two short marks
      // across the tiles' top and bottom edges, clear of the glyphs sliding together.
      const weld = Math.sin(Math.PI * u);
      if (weld > 1e-6) {
        for (const [i, side] of fusing) {
          if (side !== 'left') continue;
          const x = num((slotRight(w, ranges[i].b - 1) + slotLeft(w, ranges[i + 1].a)) / 2), bottom = top + g.tileH;
          parts.push(`<path class="pr-seam" data-seam="${word}" d="M${x} ${num(top - 4)}V${num(top + 5)}M${x} ${num(bottom - 5)}V${num(bottom + 4)}" opacity="${num(weld)}"></path>`);
        }
      }
      facts.rows.push({word, frequency: FREQUENCIES[w], pieces: ranges.map(range => range.text)});
    });

    // 2. The arcs of the two drawn pairs, over the seams of their current occurrences.
    for (const tally of TALLIES) {
      for (const arc of tally.arcs) {
        const top = g.rows[arc.w], x1 = middle(arc.w, arc.i), x2 = middle(arc.w, arc.i + 1);
        const peak = top - 2 * g.arc, mid = (x1 + x2) / 2;
        const whole = `M${num(x1)} ${num(top)}Q${num(mid)} ${num(peak)} ${num(x2)} ${num(top)}`;
        const attrs = `data-arc="${tally.role}" data-row="${WORDS[arc.w]}" data-slots="${arc.i} ${arc.i + 1}"`;
        const cls = `pr-arc pr-${tally.role}-arc`;
        const lost = arc.lost, window = lost && lost.window;
        if (!lost || t < window[0]) { parts.push(`<path class="${cls}" ${attrs} d="${whole}"></path>`); continue; }
        const p = phase(t, window);
        if (lost.kind === 'snap') {
          // Split the arc at its apex: the left half stays as a dashed stub, the right half
          // lets go of the absorbed symbol and retracts into the apex.
          const apex = [mid, top - g.arc], q0 = [(x1 + mid) / 2, (top + peak) / 2], q1 = [(mid + x2) / 2, (top + peak) / 2];
          parts.push(`<path class="pr-stub" ${attrs} data-stub d="M${num(x1)} ${num(top)}Q${num(q0[0])} ${num(q0[1])} ${num(apex[0])} ${num(apex[1])}"></path>`);
          facts.stub = true;
          if (p < 1) {
            const pull = point => [point[0] + (apex[0] - point[0]) * p, point[1] + (apex[1] - point[1]) * p];
            const [c, e] = [pull(q1), pull([x2, top])];
            parts.push(`<path class="${cls}" ${attrs} data-snapping d="M${num(apex[0])} ${num(apex[1])}Q${num(c[0])} ${num(c[1])} ${num(e[0])} ${num(e[1])}"${faded(1 - p)}></path>`);
          }
        } else if (p < 1) {
          parts.push(`<path class="${cls}" ${attrs} d="${whole}"${faded(1 - p)}></path>`);
        }
      }
    }

    // 3. The count axis, 0 to 10, with no tick labels.
    const X = count => g.x0 + (count - AXIS_LOW) * g.unit, axisEnd = X(AXIS_HIGH);
    let ticks = '';
    for (let c = AXIS_LOW; c <= AXIS_HIGH; c++) ticks += `M${num(X(c))} ${num(g.axis)}v4`;
    parts.push(`<g data-scenery><path class="pr-axis" d="M${num(X(AXIS_LOW))} ${num(g.axis)}H${num(axisEnd)}${ticks}"></path>`
      + `${text(axisEnd, g.axisWord, 'count', 'pr-axis-word', g.seg, 'end')}</g>`);

    // 4. The tallies. Each shows the latest drawn count; at a count that changes it, a
    // segment whose word lost its occurrence slides off, and the tracked pair leaves a dashed
    // outline of its first count.
    for (const [index, tally] of TALLIES.entries()) {
      const [barY, barH] = g.bars[tally.role];
      const now = COUNTS.reduce((found, count, j) => (count.at === null || t >= count.at[0] ? j : found), 0);
      const window = COUNTS[now].at, moving = Boolean(window) && t < window[1];
      const p = moving ? phase(t, window) : 1;
      const before = tally.counted[moving ? now - 1 : now], later = tally.counted[now];
      const fade = tally.end ? 1 - phase(t, tally.end) : 1;
      // The dashed outline of the first count, left by the first count that lowers it.
      const lowered = COUNTS.findIndex((count, j) => j > 0 && total(tally.counted[j]) < total(tally.counted[j - 1]));
      if (tally.role === 'tracked' && lowered > 0 && t > COUNTS[lowered].at[0]) {
        const [a, b] = COUNTS[lowered].at, shown = phase(t, [a, b]), named = phase(t, [(a + b) / 2, b]);
        const value = FIRST[index];
        parts.push(`<g data-mark="ghost" data-count="${value}"><rect class="pr-ghost" x="${num(X(0))}" y="${num(barY)}" width="${num(value * g.unit)}" height="${barH}"${faded(shown)}></rect>`
          + (named > 0 ? text(X(value), barY - g.pad, `${T} ${value}`, 'pr-ghost-label pr-tracked-text', g.label, 'middle', ` data-value="ghost"${faded(named)}`) : '')
          + '</g>');
        facts.ghost = value;
      }
      if (fade <= 0) continue;
      const segments = [];
      let start = 0, startBefore = 0;
      WORDS.forEach((word, w) => {
        const from = before[w], to = later[w];
        if (from === 0 && to === 0) return;
        const leaving = to === 0;
        const offset = leaving ? startBefore : startBefore + (start - startBefore) * p;
        const length = leaving ? from : from + (to - from) * p;
        segments.push({word, value: leaving ? from : to, offset, length, leaving});
        startBefore += from; start += to;
      });
      const old = total(before), fresh = total(later), changing = moving && old !== fresh;
      const shownTotal = changing && p < 0.5 ? old : fresh;
      const totalAlpha = changing ? Math.abs(1 - 2 * p) : 1;
      const kind = tally.role, bars = [];
      for (const s of segments) {
        const x = X(s.offset), w = s.length * g.unit;
        const slide = s.leaving ? p * SLIDE * g.unit : 0, alpha = s.leaving ? 1 - p : 1;
        if (alpha <= 0) continue;
        bars.push(`<g data-segment="${s.word}" data-count="${s.value}"${slide ? ` transform="translate(${num(slide)} 0)"` : ''}${faded(alpha)}>`
          + `<rect class="pr-${kind}-bar" x="${num(x)}" y="${num(barY)}" width="${num(w)}" height="${barH}"></rect>`
          + `${text(x + w / 2, barY + barH + g.segDy, `${s.word} ${s.value}`, 'pr-seg-label', g.seg, 'middle')}</g>`);
      }
      // A thin white rule between adjacent segments keeps them two parts of one bar.
      let splits = '';
      for (let j = 1; j < segments.length; j++) {
        if (!segments[j].leaving && !segments[j - 1].leaving) splits += `M${num(X(segments[j].offset))} ${num(barY)}v${barH}`;
      }
      parts.push(`<g data-tally="${kind}" data-pair="${escape(nameOf(tally.pair))}"${faded(fade)}>`
        + text(g.pairX, baseline(barY, barH, g.label), nameOf(tally.pair), `pr-pair-label pr-${kind}-text`, g.label, 'end')
        + bars.join('') + (splits ? `<path class="pr-split" d="${splits}"></path>` : '')
        + (totalAlpha > 0 ? text(X(shownTotal) + g.pad, baseline(barY, barH, g.total), String(shownTotal), `pr-total pr-${kind}-text`, g.total, 'start', ` data-total="${shownTotal}"${faded(totalAlpha)}`) : '')
        + '</g>');
      facts.tallies.push({name: nameOf(tally.pair), total: shownTotal,
        segments: segments.filter(s => !s.leaving || p < 0.5).map(s => `${s.word} ${s.value}`)});
    }

    // 5. The maximum level: drawn while a count waits for its merge, and faded as that
    // merge spends it. Its label names the tied pairs, the one the loop takes first.
    for (const count of COUNTS) {
      if (count.at && t <= count.at[0]) continue;
      const alpha = (count.at ? phase(t, count.at) : 1) * (1 - phase(t, MERGE_AT[count.round]));
      if (alpha <= 0) continue;
      const entry = HISTORY[count.round], x = X(entry.maximum);
      const label = `${entry.maximum}: ${entry.tied.map(nameOf).join(', ')}`;
      parts.push(`<g data-mark="level" data-level="${entry.maximum}" data-round="${count.round + 1}"${faded(alpha)}>`
        + `<line class="pr-level" x1="${num(x)}" y1="${num(g.level[0])}" x2="${num(x)}" y2="${num(g.level[1])}"></line>`
        + text(x, g.levelLabel, label, 'pr-level-label', g.label, 'end', ' data-level-label')
        + '</g>');
      facts.level = {maximum: entry.maximum, tied: entry.tied};
    }
    return {markup: parts.join(''), facts};
  }

  // The picture's accessible description: what is drawn now. The end-of-word marker is
  // spoken in words, never as markup, so no raw marker reaches an attribute.
  const say = symbol => (symbol === END ? 'end marker' : symbol.endsWith(END) ? `${symbol.slice(0, -END.length)} plus end marker` : symbol);
  const sayPair = pair => pair.map(say).join('+');
  function describe(facts) {
    const rows = facts.rows.map(row => `${row.word} ×${row.frequency}: ${row.pieces.map(say).join(', ')}`).join('; ');
    const tallies = facts.tallies.map(tally => `${tally.name} tally ${tally.total} (${tally.segments.join(', ')})`);
    const extra = [];
    if (facts.stub) extra.push(`newest keeps a dashed stub of its ${T} link`);
    if (facts.ghost !== null) extra.push(`a dashed outline keeps ${T}'s first count, ${facts.ghost}`);
    if (facts.level) extra.push(`level ${facts.level.maximum}: ${facts.level.tied.map(sayPair).join(', ')}`);
    return `${rows}. ${[...tallies, ...extra].join('; ') || 'No tally is drawn'}.`;
  }

  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const clamped = Math.max(0, Math.min(duration, time));
    const stage = stageAt(clamped);
    // Reduced motion shows each beat's settled state: the picture just before the next beat.
    const end = beats[stage + 1] === undefined ? duration : beats[stage + 1];
    const t = reducedMotion ? end - 1e-6 : clamped;
    root.dataset.stage = String(stage);

    const {markup, facts} = picture(t);
    const key = `${mode}|${markup}`;
    if (key !== previousKey) {
      previousKey = key;
      const [width, height] = MODES[mode].size;
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      drawing.innerHTML = markup;
    }
    // The recount wash: on from each drawn recount until the merge it chooses begins.
    const wash = COUNTS.some(count => count.at && t >= count.at[0] && t < MERGE_AT[count.round][0]);
    formula.classList.toggle('pr-recount-lit', wash);
    const description = describe(facts);
    if (svg.getAttribute('aria-label') !== description) svg.setAttribute('aria-label', description);

    const sentence = CAPTIONS[stage];
    if (caption.textContent !== sentence) caption.textContent = sentence;
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
