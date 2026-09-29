#!/usr/bin/env node
// Test-only checks for the Chapter 18 byte pair encoding scene (chapters/part4/15-bert-pretraining.qmd,
// the bpe-mechanism cell). Nothing here ships. The suite reruns the chapter's loop on the
// panel's declared corpus, binds the player's merges to the frozen stdout, and reads the
// picture back out of the SVG at 0.1 s steps: every drawn total must be a fresh count of the
// tiles as drawn, except in the declared lag between a fusion and the count that follows it.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, canonicalMarkup, drawnMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'pair-recount-excerpt', scene = entry(NAME);
const WIDTHS = [296, 375, 599, 600, 713, 900];
const END = '</w>';
const steps = (from, to, step = 0.1) => {
  const times = [];
  for (let k = Math.round(from / step); k * step < to - 1e-9; k++) times.push(Number((k * step).toFixed(4)));
  return times;
};
const within = (t, windows) => windows.some(([a, b]) => t >= a - 1e-9 && t < b - 1e-9);
const drawing = f => f.$('[data-drawing]');
const texts = f => [...drawing(f).querySelectorAll('text')];
const attr = (node, key) => Number(node.getAttribute(key));

// The panel's declared fixture, read the way the player reads it.
const declared = f => {
  const d = f.root.dataset;
  return {words: d.words.trim().split(/\s+/), freq: d.frequencies.trim().split(/\s+/).map(Number), end: d.endMarker,
    merges: Number(d.merges), tieBreak: d.tieBreak, tracked: d.tracked.trim().split(/\s+/),
    rival: d.rival.trim().split(/\s+/), axis: d.countAxis.trim().split(/\s+/).map(Number)};
};

// The chapter's loop, written again independently of the player.
const tuple = (a, b) => (a[0] !== b[0] ? (a[0] < b[0] ? -1 : 1) : a[1] === b[1] ? 0 : a[1] < b[1] ? -1 : 1);
const counter = (words, freq) => {
  const counts = new Map();
  words.forEach((symbols, w) => {
    for (let i = 0; i + 1 < symbols.length; i++) {
      const key = `${symbols[i]}\n${symbols[i + 1]}`;
      counts.set(key, (counts.get(key) || 0) + freq[w]);
    }
  });
  return counts;
};
const pairOf = key => key.split('\n');
const mergePair = (symbols, pair) => {
  const out = [];
  for (let i = 0; i < symbols.length;) {
    if (i + 1 < symbols.length && symbols[i] === pair[0] && symbols[i + 1] === pair[1]) { out.push(pair.join('')); i += 2; } else { out.push(symbols[i]); i += 1; }
  }
  return out;
};
function runLoop(words, freq, rounds, pick = 'least') {
  let pieces = words.map(word => [...word, END]);
  const history = [];
  for (let round = 0; round < rounds; round++) {
    const counts = counter(pieces, freq), maximum = Math.max(...counts.values());
    const tied = [...counts].filter(([, c]) => c === maximum).map(([key]) => pairOf(key)).sort(tuple);
    const best = pick === 'least' ? tied[0] : tied.at(-1);
    history.push({pieces, counts, maximum, tied, best});
    pieces = pieces.map(symbols => mergePair(symbols, best));
  }
  return {history, final: pieces};
}
const count = (counts, pair) => counts.get(pair.join('\n')) || 0;
const pyMerges = history => `merges: [${history.map(h => `('${h.best.join('+')}', ${h.maximum})`).join(', ')}]`;

// What the picture draws now, read from the DOM alone.
const drawnPieces = (f, words) => words.map(word =>
  [...drawing(f).querySelectorAll(`g[data-row="${word}"] [data-tile]`)].map(node => node.textContent));
const tallies = f => [...drawing(f).querySelectorAll('[data-tally]')];
const tally = (f, name) => drawing(f).querySelector(`[data-tally][data-pair="${name}"]`);
const totalOf = (f, name) => {
  const node = tally(f, name) && tally(f, name).querySelector('[data-total]');
  return node ? node.textContent : null;
};
const level = f => drawing(f).querySelector('[data-mark="level"]');
const ghost = f => drawing(f).querySelector('[data-mark="ghost"]');
const ghostLabel = f => drawing(f).querySelector('[data-value="ghost"]');
const stub = f => drawing(f).querySelector('[data-stub]');
const said = f => `${f.$('[data-figure] svg').getAttribute('aria-label')} ${f.$('[data-controls] input[type=range]').getAttribute('aria-valuetext')}`;
const pictureOnly = f => canonicalMarkup(drawing(f).innerHTML);
const pairNames = text => text.match(/[a-z<>/]+\+[a-z<>/]+/g) || [];

registerTransportTests(NAME, {witness: /w\+e 8/, anchors: ['pair-recount-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('pair recount: the corpus, the marker, the budget and the tie-break are the chapter\'s', t => {
  const f = fixture(t, NAME), k = declared(f), chapter = chapterSource(NAME);
  const corpus = /corpus = \{"low": (\d+), "lower": (\d+), "newest": (\d+), "widest": (\d+)\}/.exec(chapter);
  assert(corpus, 'the corpus line is in the chapter');
  assert.deepEqual(k.words, ['low', 'lower', 'newest', 'widest'], 'the corpus line\'s order');
  assert.deepEqual(k.freq, corpus.slice(1).map(Number));
  assert.equal(k.end, END);
  assert(chapter.includes('words = {tuple(word) + ("</w>",): count for word, count in corpus.items()}'));
  assert.equal(k.merges, Number(/for _ in range\((\d+)\):/.exec(chapter)[1]));
  assert.equal(k.tieBreak, 'lexicographic');
  assert(chapter.includes('lexicographic order breaks exact ties so\nthe result is reproducible.'));
  assert.deepEqual(k.tracked, ['w', 'e']); assert.deepEqual(k.rival, ['l', 'o']); assert.deepEqual(k.axis, [0, 10]);
  assert.equal(f.root.dataset.evidenceClass, 'computed');
  // Every manifest literal occurs exactly once in the chapter.
  for (const literal of scene.fixture.literals) assert.equal(chapter.split(literal).length, 2, `once: ${literal.slice(0, 60)}`);
  assert.equal(scene.fixture.literals.length, 19);
});

test('pair recount: the loop reproduces the frozen stdout, and the picture draws those merges', t => {
  const f = fixture(t, NAME), k = declared(f);
  const {history, final} = runLoop(k.words, k.freq, k.merges);
  const frozen = fs.readFileSync(path.join(ROOT, '_freeze/chapters/part4/15-bert-pretraining/execute-results/html.json'), 'utf8');
  const merges = "merges: [('e+s', 9), ('es+t', 9), ('est+</w>', 9), ('l+o', 7), ('lo+w', 7)]";
  const lower = 'lower: low | e | r | </w>';
  assert.equal(frozen.split(merges).length, 2, 'the merges line occurs once in the freeze');
  assert.equal(frozen.split(lower).length, 2, 'the lower line occurs once in the freeze');
  assert.equal(pyMerges(history), merges);
  assert.equal(`lower: ${final[k.words.indexOf('lower')].join(' | ')}`, lower);
  // The chapter's "nine" and "seven".
  assert.deepEqual(history.map(h => h.maximum), [9, 9, 9, 7, 7]);
  // Now read the same merges back out of the drawing: whenever the drawn pieces change, the
  // pair that changed them, counted on the pieces drawn just before.
  f.load(); f.open();
  const read = [];
  let previous = null;
  for (const time of [...steps(0, scene.duration), scene.duration]) {
    f.seek(time);
    const now = drawnPieces(f, k.words);
    if (previous && JSON.stringify(now) !== JSON.stringify(previous)) {
      const counts = counter(previous, k.freq);
      const pair = [...counts.keys()].map(pairOf).find(p => JSON.stringify(previous.map(s => mergePair(s, p))) === JSON.stringify(now));
      assert(pair, `the change at ${time}s is one merge_pair step`);
      read.push(`('${pair.join('+')}', ${count(counts, pair)})`);
    }
    previous = now;
  }
  assert.equal(`merges: [${read.join(', ')}]`, merges);
  assert.deepEqual(previous.map(s => s.join(' | ')), ['low | </w>', 'low | e | r | </w>', 'n | e | w | est</w>', 'w | i | d | est</w>']);
});

test('pair recount: the declared computed variants, recomputed', t => {
  const f = fixture(t, NAME), k = declared(f);
  const {history} = runLoop(k.words, k.freq, k.merges);
  const first = history[0].counts;
  assert.equal(first.size, 14, 'fourteen distinct adjacent pairs in round 1');
  const named = pair => pair.join('+');
  const ranked = [...first].map(([key, c]) => `${named(pairOf(key))} ${c}`);
  for (const item of ['e+s 9', 's+t 9', 't+</w> 9', 'w+e 8', 'l+o 7', 'o+w 7', 'e+w 6', 'n+e 6', 'w+</w> 5',
    'd+e 3', 'i+d 3', 'w+i 3', 'e+r 2', 'r+</w> 2']) assert(ranked.includes(item), item);
  assert.deepEqual(history.map(h => h.tied.map(named)), [['e+s', 's+t', 't+</w>'], ['es+t', 't+</w>'], ['est+</w>'], ['l+o', 'o+w'], ['lo+w']]);
  assert.deepEqual(history.map(h => count(h.counts, ['w', 'e'])), [8, 2, 2, 2, 2]);
  assert.deepEqual(history.map(h => count(h.counts, ['l', 'o'])), [7, 7, 7, 7, 0]);
  // Scope: the reverse tie order changes the names, not the lesson or the final pieces.
  const reverse = runLoop(k.words, k.freq, k.merges, 'greatest');
  assert.equal(pyMerges(reverse.history), "merges: [('t+</w>', 9), ('s+t</w>', 9), ('e+st</w>', 9), ('o+w', 7), ('l+ow', 7)]");
  assert.deepEqual(reverse.history.map(h => count(h.counts, ['w', 'e'])), [8, 8, 8, 2, 0]);
  assert.deepEqual(reverse.final, runLoop(k.words, k.freq, k.merges).final);
  // Scope: lower counted 3 ties w+e with the three nines, and e+s still wins.
  const three = runLoop(k.words, k.freq.map((v, w) => (k.words[w] === 'lower' ? 3 : v)), 1);
  assert.deepEqual(three.history[0].tied.map(named), ['e+s', 's+t', 't+</w>', 'w+e']);
  assert.deepEqual(three.history[0].best, ['e', 's']);
  // Receipt only: the fixed-list misreading, counts frozen at round 1.
  let pieces = k.words.map(word => [...word, END]);
  const frozenOrder = [...first].sort((a, b) => b[1] - a[1] || tuple(pairOf(a[0]), pairOf(b[0]))).slice(0, 5).map(([key]) => pairOf(key));
  assert.deepEqual(frozenOrder.map(named), ['e+s', 's+t', 't+</w>', 'w+e', 'l+o']);
  for (const pair of frozenOrder) pieces = pieces.map(s => mergePair(s, pair));
  assert.equal(pieces[1].join(' | '), 'lo | we | r | </w>');
  assert.equal(pieces[2].join(' | '), 'n | e | w | es | t</w>');
});

test('pair recount: every drawn total is a fresh count of the drawn tiles, except in the declared lag', t => {
  const f = fixture(t, NAME), k = declared(f); f.load(); f.open();
  const lag = {'w+e': [[5.0, 7.2], [23.0, 24.8]], 'l+o': [[22.0, 22.6]]};
  let checkedLevels = 0;
  for (const time of [...steps(0, scene.duration), scene.duration]) {
    f.seek(time);
    const fresh = counter(drawnPieces(f, k.words), k.freq);
    for (const node of tallies(f)) {
      const name = node.getAttribute('data-pair'), label = node.querySelector('[data-total]');
      if (!label) continue;
      assert.equal(label.getAttribute('data-total'), label.textContent);
      if (within(time, lag[name])) continue;
      assert.equal(Number(label.textContent), count(fresh, name.split('+')), `${name} at ${time}s`);
    }
    const mark = level(f);
    if (mark && !mark.hasAttribute('opacity')) {
      const maximum = Math.max(...fresh.values());
      const tied = [...fresh].filter(([, c]) => c === maximum).map(([key]) => pairOf(key)).sort(tuple);
      assert.equal(Number(mark.getAttribute('data-level')), maximum, `level value at ${time}s`);
      assert.equal(mark.querySelector('[data-level-label]').textContent, `${maximum}: ${tied.map(p => p.join('+')).join(', ')}`, `level label at ${time}s`);
      checkedLevels += 1;
    }
    if (time < 6.4) assert.equal(totalOf(f, 'w+e'), '8', `w+e reads 8 at ${time}s`);
    if (time >= 7.2 && time < 24.0) assert.equal(totalOf(f, 'w+e'), '2', `w+e reads 2 at ${time}s`);
    if (time >= 24.8) assert.equal(tally(f, 'w+e'), null, `no live w+e bar at ${time}s`);
    if (time >= 7.2) assert.equal(ghostLabel(f) && ghostLabel(f).textContent, 'w+e 8', `the ghost at ${time}s`);
    if (time >= 7.2) assert(!ghost(f).querySelector('[opacity]'), `the ghost is whole at ${time}s`);
    if (time >= 6.2) assert(stub(f), `the stub at ${time}s`);
    if (time >= 22.6) assert.equal(level(f), null, `no level after the budget's merges begin to end, at ${time}s`);
    assert.doesNotMatch(drawing(f).textContent, /w\+e 0\b/);
  }
  assert(checkedLevels > 100, 'the level was checked at full opacity');
});

test('pair recount: newest\'s 6 slides off the tally at the recount; lower\'s 2 stays', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const segment = word => tally(f, 'w+e').querySelector(`[data-segment="${word}"]`);
  f.seek(6.3);
  const lowerBefore = canonicalMarkup(segment('lower').outerHTML), width = attr(segment('lower').querySelector('rect'), 'width') / 2;
  assert.equal(segment('newest').getAttribute('data-count'), '6');
  assert.equal(attr(segment('newest').querySelector('rect'), 'width'), 6 * width);
  f.seek(6.8);
  assert.equal(segment('newest').getAttribute('data-count'), '6');
  assert.match(segment('newest').getAttribute('transform'), /^translate\([\d.]+ 0\)$/, 'the leaving segment slides');
  assert(attr(segment('newest'), 'opacity') < 1, 'and fades');
  assert.equal(canonicalMarkup(segment('lower').outerHTML), lowerBefore, 'lower 2 does not move');
  assert.equal(segment('lower').querySelector('text').textContent, 'lower 2');
  f.seek(7.2);
  assert.equal(segment('newest'), null);
  assert.equal(canonicalMarkup(segment('lower').outerHTML), lowerBefore);
  assert.equal(ghost(f).querySelector('rect').getAttribute('width'), String(8 * width), 'the dashed outline keeps the 8');
});

test('pair recount: nothing of the answer before 5.0 s, and nothing moves', t => {
  const f = fixture(t, NAME), k = declared(f); f.load(); f.open();
  f.seek(0);
  const still = pictureOnly(f), formula = f.$('[data-formula]').className;
  const answers = ['l+o merges', 'fourth: l+o', 'breaks', 'falls', 'fewer', 'w+e 2', 'w+e has 2', 'keeps 2', 'w+e tally 2', 'stub', 'outline'];
  for (const time of steps(0, 5.0)) {
    f.seek(time);
    const pieces = drawnPieces(f, k.words);
    pieces.forEach((row, w) => {
      assert.equal(row.length, k.words[w].length + 1, `${k.words[w]} has one tile per character plus the marker at ${time}s`);
      assert(row.every(text => text.length === 1 || text === END), `no fused tile at ${time}s`);
    });
    assert.equal(stub(f), null); assert.equal(ghost(f), null);
    assert.equal(drawing(f).querySelectorAll('[data-seam], [data-snapping]').length, 0);
    assert.equal(totalOf(f, 'w+e'), '8');
    assert.equal(level(f).querySelector('[data-level-label]').textContent, '9: e+s, s+t, t+</w>');
    assert(!level(f).hasAttribute('opacity'));
    const spoken = `${said(f)} ${f.$('[data-caption]').textContent}`;
    for (const answer of answers) assert(!spoken.includes(answer), `"${answer}" is said at ${time}s: ${spoken}`);
    assert.equal(pictureOnly(f), still, `the picture moves at ${time}s`);
    assert.equal(f.$('[data-formula]').className, formula);
  }
  f.seek(4.9);
  assert.equal(pictureOnly(f), still, 'tile, arc and bar geometry at 4.9 s equals 0.0 s');
});

test('pair recount: lower is untouched until its own merge', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const lower = () => canonicalMarkup([drawing(f).querySelector('g[data-row="lower"]'),
    ...drawing(f).querySelectorAll('[data-arc][data-row="lower"]')].map(node => node.outerHTML).join(''));
  f.seek(0);
  const first = lower();
  for (const time of steps(0, 22.0)) { f.seek(time); assert.equal(lower(), first, `lower moved at ${time}s`); }
  f.seek(22.3);
  assert.notEqual(lower(), first, 'lower fuses at merge 4');
});

test('pair recount: every reveal holds still for at least two seconds, formula included', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (const [a, b] of [[7.2, 10.0], [11.6, 15.0], [16.0, 22.0], [24.8, 30.0], [30.0, 40.0]]) {
    assert(b - a >= 2);
    f.seek(a);
    const held = drawnMarkup(f);
    for (const time of [...steps(a, b), b - 0.01]) {
      f.seek(Number(time.toFixed(4)));
      assert.equal(drawnMarkup(f), held, `the hold ${a} to ${b} moves at ${time}s`);
    }
  }
});

test('pair recount: the recount wash switches only at the counts and at the merges they choose', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (const time of [...steps(0, scene.duration), scene.duration]) {
    f.seek(time);
    const on = f.$('[data-formula]').classList.contains('pr-recount-lit');
    assert.equal(on, within(time, [[6.4, 10.0], [15.0, 22.0]]), `wash at ${time}s`);
  }
  const r = fixture(t, NAME, {reduced: true}); r.load(); r.open();
  const lit = scene.beats.map(beat => { r.seek(beat); return r.$('[data-formula]').classList.contains('pr-recount-lit'); });
  assert.deepEqual(lit, [false, true, false, true, false, false]);
  const tex = f.formulas()[0].textContent;
  assert.equal(tex, '\\( \\text{count}(a{+}b)=\\sum_{\\text{words}}\\text{frequency}\\times\\#\\bigl(a\\ b\\ \\text{adjacent}\\bigr),\\quad \\class{pr-recount}{\\text{taken on the current pieces every round}} \\)');
  assert.equal(f.formulas()[0].id, 'eq-pair-recount-1');
});

test('pair recount: reduced motion shows one settled state per beat', t => {
  const f = fixture(t, NAME, {reduced: true}), k = declared(f); f.load(); f.open();
  const state = beat => {
    f.seek(beat);
    const mark = level(f);
    return {pieces: drawnPieces(f, k.words).map(s => s.join(' | ')), we: totalOf(f, 'w+e'), lo: totalOf(f, 'l+o'),
      level: mark && mark.querySelector('[data-level-label]').textContent, ghost: Boolean(ghost(f)), stub: Boolean(stub(f))};
  };
  const chars = ['l | o | w | </w>', 'l | o | w | e | r | </w>'];
  assert.deepEqual(state(0), {pieces: [...chars, 'n | e | w | e | s | t | </w>', 'w | i | d | e | s | t | </w>'],
    we: '8', lo: '7', level: '9: e+s, s+t, t+</w>', ghost: false, stub: false});
  assert.deepEqual(state(5), {pieces: [...chars, 'n | e | w | es | t | </w>', 'w | i | d | es | t | </w>'],
    we: '2', lo: '7', level: '9: es+t, t+</w>', ghost: true, stub: true});
  const est = [...chars, 'n | e | w | est</w>', 'w | i | d | est</w>'];
  assert.deepEqual(state(10), {pieces: est, we: '2', lo: '7', level: null, ghost: true, stub: true});
  assert.deepEqual(state(15), {pieces: est, we: '2', lo: '7', level: '7: l+o, o+w', ghost: true, stub: true});
  const done = ['low | </w>', 'low | e | r | </w>', 'n | e | w | est</w>', 'w | i | d | est</w>'];
  assert.deepEqual(state(22), {pieces: done, we: null, lo: null, level: null, ghost: true, stub: true});
  assert.deepEqual(state(30), {pieces: done, we: null, lo: null, level: null, ghost: true, stub: true});
  assert.equal(drawing(f).querySelectorAll('[data-tally]').length, 0);
});

test('pair recount: no ledger: two tallies, few pair names, few emphasised numbers', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (const time of [...steps(0, scene.duration), scene.duration]) {
    f.seek(time);
    const labels = texts(f).map(node => node.textContent);
    assert(labels.reduce((sum, text) => sum + pairNames(text).length, 0) <= 5, `more than five pair names at ${time}s: ${labels.join(' / ')}`);
    for (const text of labels) assert(pairNames(text).length <= 3, `"${text}" names more than three pairs`);
    if (time < 22.0) assert.equal(tallies(f).length, 2, `two live tally bars at ${time}s`);
    else assert(tallies(f).length <= 2);
    const emphasised = drawing(f).querySelectorAll('[data-value^="frequency-"], [data-total], [data-mark="level"], [data-value="ghost"]').length;
    assert(emphasised <= 8, `${emphasised} emphasised numbers at ${time}s`);
  }
  f.seek(0);
  assert.equal(drawing(f).querySelectorAll('[data-value^="frequency-"], [data-total], [data-mark="level"]').length, 7, 'frame 0 carries 7 emphasised numbers');
});

test('pair recount: every layout keeps its text inside the picture and off its neighbours', t => {
  const times = [...new Set([0, 4.9, ...steps(5, scene.duration, 0.2), 6.8, 7.1, 22.3, 23.3, 24.4, scene.duration])].sort((a, b) => a - b);
  for (const width of WIDTHS) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    for (const time of times) {
      f.seek(time);
      const [, , boxWidth, boxHeight] = f.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/).map(Number);
      const boxes = texts(f).map(node => {
        const size = Number(node.getAttribute('font-size')), anchor = node.getAttribute('text-anchor');
        const w = node.textContent.length * size * (node.getAttribute('class').includes('pr-glyph') ? 0.6 : 0.56);
        const x = attr(node, 'x'), y = attr(node, 'y');
        const left = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
        const slide = node.closest('[transform]') ? Number(/translate\(([\d.]+)/.exec(node.closest('[transform]').getAttribute('transform'))[1]) : 0;
        return {left: left + slide, right: left + slide + w, top: y - size, bottom: y + size * 0.3, text: node.textContent};
      });
      for (const box of boxes) {
        assert(box.left >= -1 && box.right <= boxWidth + 1, `at ${width}px, ${time}s "${box.text}" runs outside the picture`);
        assert(box.top >= -1 && box.bottom <= boxHeight + 1, `at ${width}px, ${time}s "${box.text}" runs off the top or bottom`);
      }
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        const over = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const down = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        assert(over <= 1 || down <= 1, `at ${width}px, ${time}s "${a.text}" and "${b.text}" collide`);
      }
      // The level line never runs through a label but its own.
      const mark = level(f);
      if (mark) {
        const line = mark.querySelector('line'), x = attr(line, 'x1'), [y1, y2] = [attr(line, 'y1'), attr(line, 'y2')];
        for (const box of boxes) {
          if (box.text === mark.querySelector('[data-level-label]').textContent) continue;
          const crosses = box.left < x - 1 && x + 1 < box.right && Math.min(box.bottom, y2) - Math.max(box.top, y1) > 1;
          assert(!crosses, `at ${width}px, ${time}s the level line runs through "${box.text}"`);
        }
      }
      // Tiles and arcs stay inside the picture too.
      for (const node of drawing(f).querySelectorAll('rect')) {
        const slide = node.closest('[transform]') ? Number(/translate\(([\d.]+)/.exec(node.closest('[transform]').getAttribute('transform'))[1]) : 0;
        assert(attr(node, 'x') >= 0 && attr(node, 'x') + attr(node, 'width') + slide <= boxWidth + 0.5, `a rect runs outside at ${width}px, ${time}s`);
        assert(attr(node, 'y') >= 0 && attr(node, 'y') + attr(node, 'height') <= boxHeight + 0.5);
      }
    }
    assert.equal(f.$('[data-figure] svg').getAttribute('viewBox'), width < 600 ? '0 0 296 372' : '0 0 713 250');
  }
});

test('pair recount: the marker is escaped everywhere and spelt as the chapter spells it', t => {
  const source = read('pair-recount/panel.html');
  assert(!source.includes('</w>'), 'no raw </w> anywhere in panel.html');
  assert(source.includes('data-end-marker="&lt;/w&gt;"'));
  const f = fixture(t, NAME);
  // Parsed, the static prints keep every marker tile: a raw </w> in text would vanish.
  const wide = [...f.$('[data-drawing]').querySelectorAll('g[data-row]')].map(row => [...row.querySelectorAll('[data-tile]')].map(n => n.textContent).join(' | '));
  const narrow = [...f.$('[data-static-frame="narrow"]').querySelectorAll('g[data-row]')].map(row => [...row.querySelectorAll('[data-tile]')].map(n => n.textContent).join(' | '));
  const done = ['low | </w>', 'low | e | r | </w>', 'n | e | w | est</w>', 'w | i | d | est</w>'];
  assert.deepEqual(wide, done); assert.deepEqual(narrow, done);
  for (const node of f.root.querySelectorAll('[data-tile]')) if (node.textContent.endsWith('/w>')) assert(node.textContent.endsWith(END));
  assert.equal((source.match(/<text\b/g) || []).length, (source.match(/<\/text>/g) || []).length, 'every text element closes');
  const scope = f.$('.mechanism-scope').textContent, transcript = f.$('.mechanism-transcript').textContent;
  const picture = f.$('[data-figure]').textContent + f.$('[data-figure] svg').getAttribute('aria-label');
  for (const text of [scope, transcript, picture]) {
    assert.doesNotMatch(text, /low\|e\|r|·|WordPiece|est·/);
  }
  assert(transcript.includes('low | e | r | </w>'), 'the transcript spells lower with its marker');
  // The live aria text, at every beat.
  f.load(); f.open();
  for (const time of [...scene.beats, scene.duration]) {
    f.seek(time);
    assert.doesNotMatch(said(f), /low\|e\|r|·|WordPiece|<\/w>/);
  }
  // WordPiece appears once, in the boundary sentence.
  const visible = f.root.cloneNode(true);
  visible.querySelector('.mechanism-boundary > p').remove();
  assert.doesNotMatch(visible.textContent, /WordPiece/);
  assert.match(f.$('.mechanism-boundary > p').textContent, /not BERT's WordPiece/);
});

test('pair recount: panel words stay inside the brief\'s vocabulary', t => {
  const source = read('pair-recount/panel.html');
  for (const word of ['hinge', 'alphabetical', 'theft', 'steal', 'starve', '§15', '15.4', '—', '@eq-', '<a href="#eq-']) {
    assert(!source.toLowerCase().includes(word.toLowerCase()), `panel.html contains "${word}"`);
  }
  const f = fixture(t, NAME); f.load(); f.open();
  const spoken = [];
  for (const time of [...scene.beats, ...scene.beats.map(b => b + 2), scene.duration]) {
    f.seek(Math.min(time, scene.duration));
    spoken.push(f.$('[data-caption]').textContent, said(f));
  }
  const panel = fixture(t, NAME).root;
  panel.querySelectorAll('.mechanism-boundary > p').forEach(node => node.remove());
  const text = `${panel.textContent} ${spoken.join(' ')}`;
  assert.doesNotMatch(text, /\b(?:learned|training|loss|gradient|optimizer|weights|trained)\b/i, 'no training words');
  assert.doesNotMatch(text, /\b(?:recaps?|sections?|subsections?|tables?|callouts?|receipts?|ledgers?)\b|\bthe pages ahead\b/i, 'no apparatus words');
  assert.doesNotMatch(text, /\b(?:film|lecture|course|students?|alphabetically)\b/i);
  assert.doesNotMatch(text, /store whole words|reusable pieces\?|round by round, not down a fixed list|never granted its own token|w\+e 0\b|z_i|segment embedding/i);
  assert.match(f.$('.mechanism-boundary > p').textContent, /no real tokenizer is trained/);
  // The ask and the captions never put w+e at 8 after the first count.
  assert.match(f.$('.mechanism-question').textContent, /At its first count, w\+e has 8/);
  assert.doesNotMatch(`${f.$('.mechanism-question').textContent} ${spoken.join(' ')}`, /(?:Then|again|round [2-5])[^.]*w\+e[^.]*\b8\b/i);
});

test('pair recount: the question, the intro link and the check', t => {
  const f = fixture(t, NAME);
  assert.equal(f.$('.mechanism-question').textContent, 'Byte pair encoding merges the most frequent adjacent pair, then repeats. At its first count, w+e has 8, across newest and lower, and l+o has 7, across low and lower. Its first three merges each use 9 weighted occurrences. Which pair is merged fourth?');
  const link = f.$('.mechanism-intro a');
  assert.equal(link.getAttribute('href'), '#bpe-mechanism');
  assert.equal(link.textContent, 'The loop below');
  assert.equal(f.$('.mechanism-intro code').textContent, scene.fixture.literals.find(l => l.includes('Counter()')).trim());
  assert.equal(f.root.querySelectorAll('a[href^="#eq-"]').length, 0);
  const boundary = f.$('.mechanism-boundary > p').textContent.trim();
  assert.equal(boundary, 'Byte pair encoding on the chapter\'s four-word toy corpus, recounted after every merge; not BERT\'s WordPiece, which scores merges differently, and no real tokenizer is trained.');
  assert.equal(boundary.split(/\s+/).length, 26);
  assert.equal(f.$('.mechanism-scope').open, false);
});

test('pair recount: seeking is deterministic', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const snapshot = time => { f.seek(time); return pictureOnly(f); };
  const times = [0, 5.3, 6.0, 6.7, 8, 10.3, 11.3, 15.5, 18, 22.3, 23.3, 23.8, 24.4, 27, 35, 40];
  const forward = times.map(snapshot);
  const backward = [...times].reverse().map(snapshot).reverse();
  assert.deepEqual(forward, backward);
});

test('pair recount: the panel is the one fixture copy', t => {
  const g = fixture(t, NAME);
  // Count lower 4 times: w+e now merges first, and the picture follows the declared corpus.
  g.root.dataset.frequencies = '5 4 6 3';
  g.load(); g.open(); g.seek(0);
  assert.equal(totalOf(g, 'w+e'), '10');
  assert.equal(level(g).querySelector('[data-level-label]').textContent, '10: w+e');
});

test('pair recount: the committed static print is a fresh render of the final frame', async () => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after, 'run scripts/render_static_frames.cjs pair-recount');
});

test('pair recount: typography and inertness', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  for (const time of [...scene.beats, scene.duration]) {
    f.seek(time);
    for (const node of texts(f)) assert.doesNotMatch(node.textContent, /\de[-+]\d|(?<!\w)-\d|\^|\bexp\(/, `bad typography in "${node.textContent}"`);
  }
  f.seek(0);
  assert(texts(f).some(node => node.textContent === '×5'), 'frequencies print with U+00D7');
  const player = read('pair-recount/player.js');
  assert.doesNotMatch(player, /Math\.random|fetch\(|import\(|setInterval\(/);
  assert.equal((player.match(/getBoundingClientRect/g) || []).length, 1);
  assert.doesNotMatch(read('pair-recount/panel.html') + read('pair-recount/player.css'), /—/);
});

test('integration: the excerpt precedes the bpe-mechanism Plan -> Code wrapper, inside the bridge', () => {
  const filter = fs.readFileSync(path.join(ROOT, scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/,
    'the non-HTML guard is the first executable line, so the PDF is untouched');
  assert.match(filter, /"before-cell"/, 'the filter can place a before-cell anchor');
  assert.match(filter, /block\.classes:includes\("plan-code"\) then return holds\(block, scene\.anchor\.target\)/);
  assert.match(filter, /if scene\.anchor\.type == "before-cell" then return \{block, div\} end/);
  assert.match(filter, /assert\(inserted == 1/);
  assert.doesNotMatch(filter, /pair-recount|bpe/i, 'a manifest-driven filter names no scene');
  const config = fs.readFileSync(path.join(ROOT, '_quarto.yml'), 'utf8');
  assert.match(config, /^\s+- interactives\/pair-recount\/player\.js$/m);
  const chapter = chapterSource(NAME);
  assert.deepEqual(scene.anchor, {type: 'before-cell', target: 'bpe-mechanism'}, 'the bare label, never cell-bpe-mechanism');
  const label = chapter.indexOf('#| label: bpe-mechanism');
  assert(label > 0 && chapter.indexOf('#| label: bpe-mechanism', label + 1) < 0, 'the cell is labelled once');
  const wrapper = chapter.lastIndexOf(':::: {.plan-code', label);
  const heading = chapter.indexOf('## From a Transformer encoder to BERT');
  const bridge = chapter.indexOf('## Practice bridge (optional): make the vocabulary learnable');
  const bridgeClose = chapter.indexOf('\n:::\n', chapter.indexOf('the result is reproducible.'));
  assert(heading > 0 && heading < bridge && bridge < bridgeClose && bridgeClose < wrapper,
    'the wrapper follows the Practice-bridge callout, inside the encoder-to-BERT section');
  assert.equal(chapter.slice(bridgeClose + 5, wrapper).trim(), '', 'nothing stands between the callout and the wrapper');
  const wrapperClose = chapter.indexOf('\n::::\n', label);
  const reading = chapter.indexOf('## Reading the learned pieces (optional)');
  assert(wrapperClose > label && reading > wrapperClose, 'the reading callout follows the wrapper');
  const novel = chapter.indexOf('<!-- NOVEL: needs sign-off - original BPE mechanism bridge requested in the course review. -->');
  const novelEnd = chapter.indexOf('<!-- /NOVEL -->', novel);
  assert(novel > heading && novel < wrapper && wrapper < novelEnd, 'the panel sits inside the unsigned NOVEL bridge');
  // The frozen page gives the cell's div the bare label, which the filter finds.
  const frozen = fs.readFileSync(path.join(ROOT, '_freeze/chapters/part4/15-bert-pretraining/execute-results/html.json'), 'utf8');
  assert(frozen.includes('#bpe-mechanism .cell'));
});
