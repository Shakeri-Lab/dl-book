#!/usr/bin/env node
// Test-only checks for the Chapter 10 BatchNorm ruler scene (chapters/part2/09-modern-cnns-
// transfer.qmd, the file-prefix Chapter 9). Nothing here ships. The suite recomputes every
// mean, spread and reading from the panel's declared toy, reads each drawn ruler back through
// the drawn value axis, proves the prediction is withheld from the DOM until its reveal, and
// binds the formula and the two machines to the chapter's own words.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, canonicalMarkup, fixture,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'batch-ruler-excerpt', scene = entry(NAME);
const drawing = f => f.$('[data-drawing]');
const mark = (f, name) => drawing(f).querySelector(`[data-mark="${name}"]`);
const marks = (f, name) => [...drawing(f).querySelectorAll(`[data-mark="${name}"]`)];
const rulers = f => marks(f, 'ruler');
const live = f => rulers(f).find(r => r.dataset.kind !== 'ghost') || null;
const ghost = f => rulers(f).find(r => r.dataset.kind === 'ghost') || null;
const readings = f => [...drawing(f).querySelectorAll('[data-value]')].map(n => [n.dataset.value, n.textContent]);
const label = f => f.$('[data-figure] svg').getAttribute('aria-label');
const valuetext = f => f.$('[data-controls] input[type=range]').getAttribute('aria-valuetext');
const caption = f => f.$('[data-caption]').textContent;
const minus = text => String(text).replace(/-/g, '−');
const two = value => minus((Math.abs(value) < 0.005 ? 0 : value).toFixed(2));
const plain = value => minus(String(Number(value.toFixed(2))));
const list = text => text.trim().split(/\s+/).map(Number);
const declared = f => {
  const [runningMean, runningVariance] = list(f.root.dataset.running), [gamma, beta] = list(f.root.dataset.affine);
  return {garment: Number(f.root.dataset.garment), first: list(f.root.dataset.first), second: list(f.root.dataset.second),
    runningMean, runningVariance, gamma, beta};
};
// The chapter's formula over the batch, computed here without the player: the mean and the
// mean of the squared deviations, then (x − mean) / sqrt(variance + ε), then γ x̂ + β.
const stats = values => {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return {mean, variance: values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length};
};
const derive = (d, epsilon = 0) => {
  const one = stats([d.garment, ...d.first]), other = stats([d.garment, ...d.second]);
  const out = s => d.gamma * (d.garment - s.mean) / Math.sqrt(s.variance + epsilon) + d.beta;
  const running = {mean: d.runningMean, variance: d.runningVariance};
  return {one, other, running, readings: [out(one), out(other), out(running)]};
};
// The drawn value axis, read back from its own ticks: x = a + b v.
const axis = f => {
  const ticks = marks(f, 'axis-tick').map(t => [Number(t.dataset.at), Number(t.getAttribute('x1'))]);
  const [[v0, x0], [v1, x1]] = [ticks[0], ticks.at(-1)], b = (x1 - x0) / (v1 - v0), a = x0 - b * v0;
  for (const [v, x] of ticks) assert(Math.abs(a + b * v - x) < 1e-3, `axis tick ${v} is off the line`);
  return v => a + b * v;
};
const near = (a, b, what) => assert(Math.abs(a - b) < 2e-3, `${what}: ${a} != ${b}`);
const garmentX = f => Number(mark(f, 'garment').getAttribute('cx'));

registerTransportTests(NAME, {witness: /reads 0\.00/, anchors: ['batch-ruler-playback-help'], width: 713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('batch ruler: the formula and the two machines are the chapter\'s own', t => {
  const f = fixture(t, NAME), chapter = chapterSource(NAME), prose = chapter.split(/\s+/).join(' ');
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal), `chapter lacks ${literal}`);
  // The formula is the chapter's two lines of the batch-normalization equation, with the colour
  // and \class handles added and nothing else changed.
  const [span] = f.formulas();
  assert.equal(span.id, 'eq-batch-ruler-1');
  // \displaystyle is presentation only: the chapter sets this equation as display math.
  assert(/^\\\(\s*\\displaystyle /.test(span.textContent.trim()), 'the formula is set at display size');
  const tex = span.textContent.trim().replace(/^\\\(\s*|\s*\\\)$/g, '').replace(/^\\displaystyle\s+/, '');
  const unwrap = (source, opener) => {
    let out = source, at;
    while ((at = out.indexOf(opener)) >= 0) {
      let depth = 1, j = at + opener.length;
      for (; j < out.length && depth; j++) depth += out[j] === '{' ? 1 : out[j] === '}' ? -1 : 0;
      out = out.slice(0, at) + out.slice(at + opener.length, j - 1) + out.slice(j);
    }
    return out;
  };
  const inside = opener => { const plainTex = unwrap(tex.slice(tex.indexOf(opener) + opener.length), '\\parameterpart{'); let depth = 1, j = 0;
    for (; depth; j++) depth += plainTex[j] === '{' ? 1 : plainTex[j] === '}' ? -1 : 0; return plainTex.slice(0, j - 1); };
  assert.equal(inside('\\class{br-mu}{'), '\\mu_{\\text{batch}}', 'the wash and strike mark the batch mean');
  assert.equal(inside('\\class{br-sigma}{'), '\\sqrt{\\sigma^2_{\\text{batch}} + \\epsilon}', 'and the batch spread');
  assert.equal([...tex.matchAll(/\\parameterpart\{(\\\w+)\}/g)].map(m => m[1]).join(' '), '\\gamma \\beta', 'γ and β wear the parameter colour');
  const bare = ['\\class{br-mu}{', '\\class{br-sigma}{', '\\parameterpart{'].reduce(unwrap, tex);
  const [first, second] = bare.split(', \\quad ');
  assert(chapter.includes(`$$\n${first},\n\\qquad\n${second} .\n$$ {#eq-batchnorm}`), `the formula drifted from the chapter: ${bare}`);
  // The two machines, in the chapter's words: the panel's evaluation captions and scope say
  // what the warning after the panel says, and the question asks what that warning answers.
  assert(prose.includes('so it uses running averages collected during training.'));
  assert(f.$('.mechanism-scope').textContent.includes('running averages collected during training'));
  assert(prose.includes('BN needs real batches to estimate statistics, so it gets unreliable at tiny batch sizes.'));
  assert(f.$('.mechanism-scope').textContent.includes('BatchNorm needs real batches and gets unreliable at tiny batch sizes'));
  assert(prose.includes('restore any mean and spread'), 'the panel\'s word "spread" is the chapter\'s');
  assert(prose.includes('evaluate in train mode and your predictions depend on whatever else happens to be in the batch'));
  assert.equal(f.$('.mechanism-question').textContent,
    'In training mode, the same garment goes through BatchNorm twice, once with each of two batches of other garments. Its own value is 2 both times. Does its output change?');
  assert.equal(f.root.dataset.evidenceClass, 'declared-toy');
});

test('batch ruler: the declared toy gives the readings the manifest declares', t => {
  const f = fixture(t, NAME), d = declared(f), {one, other, running, readings: [r1, r2, r0]} = derive(d);
  assert.equal(d.first.length, 3); assert.equal(d.second.length, 3);
  assert(d.second.every((v, i) => v > d.first[i]), 'every mate is swapped for a larger one');
  assert.deepEqual([one.mean, one.variance, r1], [1, 1, 1], 'first batch: mean 1, variance 1, reading 1');
  assert.deepEqual([other.mean, other.variance, r2], [3, 1, -1], 'second batch: mean 3, variance 1, reading −1');
  // The running statistics are declared as the two batches' averages; the output is then 0.
  assert.equal(running.mean, (one.mean + other.mean) / 2);
  assert.equal(running.variance, (one.variance + other.variance) / 2);
  assert.equal(r0, 0);
  // γ = 1 and β = 0, the values a new layer starts from, so y is the reading itself.
  assert.deepEqual([d.gamma, d.beta], [1, 0]);
  // ε = 0 on the picture; PyTorch's 1e-5 moves each reading by less than 1e-5 and no digit.
  const withEps = derive(d, 1e-5).readings;
  withEps.forEach((value, i) => {
    const drawn = [r1, r2, r0][i];
    assert(Math.abs(value - drawn) < 1e-5, `reading ${i} moves by ${Math.abs(value - drawn)}`);
    assert.equal(two(value), two(drawn));
  });
  // The manifest's computed variants state the same numbers, in ASCII.
  const variants = scene.fixture.computedVariants.join(' ');
  assert(variants.includes(`holds ${d.garment}; its first batch-mates hold ${d.first[0]}, ${d.first[1]} and ${d.first[2]}, its second ${d.second[0]}, ${d.second[1]} and ${d.second[2]}`));
  assert(variants.includes(`reads (${d.garment} - ${one.mean})/${Math.sqrt(one.variance)} = ${r1}`));
  assert(variants.includes(`reads (${d.garment} - ${other.mean})/${Math.sqrt(other.variance)} = ${r2}`));
  assert(variants.includes(`mean ${running.mean} and variance ${running.variance}`));
  // The transcript prints each reading as the arithmetic that produces it.
  const transcript = f.$('#batch-ruler-transcript').textContent.replace(/\s+/g, ' ');
  for (const [s, r] of [[one, r1], [other, r2], [running, r0]]) {
    assert(transcript.includes(`(${d.garment} − ${s.mean})/${Math.sqrt(s.variance)} = ${plain(r)}`), `transcript lacks the reading ${r}`);
  }
});

test('batch ruler: every drawn ruler measures what the arithmetic says', t => {
  for (const width of [713, 296]) {
    const f = fixture(t, NAME, {width}), d = declared(f), {one, other, running, readings: [r1, r2, r0]} = derive(d);
    f.load(); f.open();
    const expectations = [[one, 'batch', r1], [one, 'batch', r1], [other, 'batch', r2], [other, 'batch', r2],
      [running, 'running', r0], [running, 'running', r0], [running, 'running', r0], [running, 'running', r0]];
    for (const [index, beat] of scene.beats.entries()) {
      for (const time of [beat + 4.99, ...(index === 7 ? [scene.duration] : [])]) {
        f.seek(time);
        const X = axis(f), [stat, kind, reading] = expectations[index], ruler = live(f), gx = garmentX(f);
        const where = `${width}px ${time}s`;
        near(gx, X(d.garment), `${where} your garment`);
        assert.equal(mark(f, 'garment').dataset.at, String(d.garment));
        assert.equal(ruler.dataset.kind, kind, `${where} ruler kind`);
        near(Number(ruler.dataset.mean), stat.mean, `${where} ruler mean`);
        near(Number(ruler.dataset.spread), Math.sqrt(stat.variance), `${where} ruler spread`);
        // One tick per spread either side of the mean, labelled in normalized units.
        const ticks = [...ruler.querySelectorAll('.br-tick')];
        assert.deepEqual(ticks.map(tick => Number(tick.dataset.k)), [-2, -1, 0, 1, 2]);
        for (const tick of ticks) near(Number(tick.getAttribute('x1')), X(stat.mean + Number(tick.dataset.k) * Math.sqrt(stat.variance)), `${where} tick ${tick.dataset.k}`);
        assert.deepEqual([...ruler.querySelectorAll('.br-tick-label')].map(n => n.textContent), ['−2', '−1', '0', '1', '2']);
        // The drop falls from your garment and lands on the tick whose value is the reading.
        for (const drop of marks(f, 'drop')) near(Number(drop.getAttribute('x1')), gx, `${where} drop`);
        assert(Number.isInteger(reading));
        const under = ticks.find(tick => Math.abs(Number(tick.getAttribute('x1')) - gx) < 1e-3);
        assert.equal(Number(under.dataset.k), reading, `${where} the drop lands on the reading`);
        assert.deepEqual(readings(f).filter(([name]) => name === 'reading'), [['reading', `reads ${two(reading)}`]]);
        // The batch ruler carries the batch mean on the axis; the running ruler replaces it.
        const triangle = mark(f, 'mean');
        if (kind === 'batch') near(Number(triangle.dataset.at), stat.mean, `${where} mean mark`);
        else assert.equal(triangle, null, `${where} a batch mean is marked in evaluation mode`);
        const bar = ruler.querySelector('.br-rule');
        assert.equal(bar.hasAttribute('stroke-dasharray'), kind === 'running', `${where} only the running ruler is dashed`);
        near(Number(bar.getAttribute('x1')), X(stat.mean - 2 * Math.sqrt(stat.variance)), `${where} bar start`);
        near(Number(bar.getAttribute('x2')), X(stat.mean + 2 * Math.sqrt(stat.variance)), `${where} bar end`);
        assert.equal(drawing(f).querySelector('[data-label="mode"]').textContent, index >= 4 ? 'evaluation mode' : 'training mode');
        assert.equal(ruler.querySelector('[data-label="ruler"]').textContent,
          kind === 'running' ? 'running statistics' : index === 3 ? 'second batch' : 'batch statistics');
        // The batch at rest: the mates at the batch's own values, each on its value's column.
        const values = index <= 1 || index === 5 ? d.first : d.second;
        const mates = marks(f, 'mate');
        assert.deepEqual(mates.map(m => Number(m.dataset.at)), values, `${where} mates`);
        for (const m of mates) near(Number(m.getAttribute('cx')), X(Number(m.dataset.at)), `${where} mate column`);
        // Marks sharing a value stack; none overlaps another.
        const dots = [...mates, mark(f, 'garment')].map(m => [Number(m.getAttribute('cx')), Number(m.getAttribute('cy')), Number(m.getAttribute('r'))]);
        for (let i = 0; i < dots.length; i++) for (let j = i + 1; j < dots.length; j++) {
          const [ax, ay, ar] = dots[i], [bx, by, br] = dots[j];
          assert(Math.hypot(ax - bx, ay - by) >= ar + br, `${where} two marks overlap`);
        }
      }
    }
  }
});

test('batch ruler: the prediction is withheld until the reveal', t => {
  for (const reduced of [false, true]) {
    const f = fixture(t, NAME, {reduced}), d = declared(f), {one, readings: [r1]} = derive(d); f.load(); f.open();
    let still = null;
    for (let step = 0; step < scene.beats[2] * 10; step++) {
      const time = step / 10; f.seek(time);
      assert.deepEqual(marks(f, 'mate').map(m => Number(m.dataset.at)), d.first, `the second batch drawn at ${time}s`);
      assert.equal(rulers(f).length, 1, `a second ruler at ${time}s`);
      assert.equal(live(f).dataset.kind, 'batch');
      assert.equal(Number(live(f).dataset.mean), one.mean, `the ruler moved at ${time}s`);
      assert.deepEqual(readings(f), [['reading', `reads ${two(r1)}`]], `a reading other than ${two(r1)} at ${time}s`);
      // The scrubber's clock is not a claim about the batch; what follows it is.
      for (const text of [label(f), valuetext(f).replace(/^\d+:\d\d of \d+:\d\d\. /, '')]) {
        assert.doesNotMatch(text, /second|larger|opposite|\b[34]\b|−1|move|slide/i, `spoiled at ${time}s: ${text}`);
      }
      // From the ask on, nothing moves: the drawing is one still picture until 10 s.
      if (time >= scene.beats[1]) {
        if (still === null) still = drawing(f).innerHTML;
        assert.equal(drawing(f).innerHTML, still, `something moves during the ask at ${time}s`);
      }
    }
    assert.equal((f.seek(scene.beats[1]), caption(f)), "Swap the other three garments for larger ones. Does your garment's output change?");
  }
});

test('batch ruler: the mates move first, the ruler follows, and your garment never moves', t => {
  const f = fixture(t, NAME), d = declared(f), {one, other, running} = derive(d); f.load(); f.open();
  const state = () => ({mates: marks(f, 'mate').map(m => `${m.dataset.at}@${m.dataset.row}`).join(' '),
    ruler: live(f) ? `${live(f).dataset.kind}@${live(f).dataset.mean}` : 'none', garment: garmentX(f)});
  let before = (f.seek(0), state());
  const garment = before.garment, moves = {mates: [], ruler: []}, changes = [];
  for (let step = 1; step <= scene.duration * 20; step++) {
    const time = step / 20; f.seek(time);
    const now = state();
    assert.equal(now.garment, garment, `your garment moved at ${time}s`);
    const matesMoved = now.mates !== before.mates;
    // The ruler moves when the same kind of ruler changes its mean; one ruler giving way to
    // another is a replacement, not a motion.
    const [kindBefore] = before.ruler.split('@'), [kindNow] = now.ruler.split('@');
    const rulerMoved = kindBefore === kindNow && now.ruler !== before.ruler;
    assert(!(matesMoved && rulerMoved), `the mates and the ruler move together at ${time}s`);
    if (matesMoved) moves.mates.push(time);
    if (rulerMoved) moves.ruler.push(time);
    if (drawing(f).innerHTML !== (f.seek(time - 0.05), drawing(f).innerHTML)) changes.push(time);
    f.seek(time); before = now;
  }
  const [, , b2, b3, b4, b5, b6, b7] = scene.beats;
  const inBeat = (times, a, b) => times.filter(time => time > a && time <= b);
  // Beat 2: the cause, then the effect. The mates arrive before the ruler starts to slide.
  const glide = inBeat(moves.mates, b2, b3), slide = inBeat(moves.ruler, b2, b3);
  assert(glide.length > 5 && slide.length > 5);
  assert(Math.max(...glide) < Math.min(...slide), 'the ruler starts only after the mates have arrived');
  f.seek(b2 + 0.9);
  assert.equal(Number(live(f).dataset.mean), one.mean, 'the ruler waits while the mates glide');
  // In evaluation mode the mates glide twice and the running ruler never moves.
  assert(inBeat(moves.mates, b5, b6).length > 5 && inBeat(moves.mates, b6, b7).length > 5);
  assert.deepEqual(moves.ruler.filter(time => time > b4), [], 'the running ruler moved');
  assert.deepEqual(moves.mates.filter(time => (time > b3 && time <= b5) || time > b7), []);
  for (const time of [b5 + 4.9, b6 + 4.9, scene.duration]) {
    f.seek(time); assert.equal(live(f).dataset.kind, 'running'); assert.equal(Number(live(f).dataset.mean), running.mean);
  }
  assert.equal((f.seek(b3 - 0.01), Number(live(f).dataset.mean)), other.mean);
  // Every motion finishes at least two seconds before its beat ends, so each reveal holds.
  // A change found exactly at a beat is that beat's opening frame, not the last one's motion.
  for (const time of changes) {
    const index = scene.beats.findLastIndex(beat => beat <= time + 1e-9), end = scene.beats[index + 1] ?? scene.duration;
    assert(time <= end - 2 + 1e-9, `the picture still changes at ${time}s, less than two seconds before ${end}s`);
  }
});

test('batch ruler: training gives the same input two readings; evaluation gives one', t => {
  const f = fixture(t, NAME), d = declared(f), {one, other, running, readings: [r1, r2, r0]} = derive(d); f.load(); f.open();
  const [, , , b3, b4] = scene.beats;
  for (let step = b3 * 10; step < b4 * 10; step++) {
    const time = step / 10; f.seek(time);
    const [upper, lower] = [live(f), ghost(f)];
    assert(upper && lower, `both rulers at ${time}s`);
    assert.equal(Number(upper.dataset.mean), other.mean); assert.equal(Number(lower.dataset.mean), one.mean);
    assert.equal(upper.querySelector('[data-label="ruler"]').textContent, 'second batch');
    assert.equal(lower.querySelector('[data-label="ruler"]').textContent, 'first batch');
    assert.deepEqual(readings(f), [['reading', `reads ${two(r2)}`], ['reading-first', `reads ${two(r1)}`]]);
    assert.equal(lower.querySelector('.br-rule').getAttribute('stroke-dasharray') !== null, true, 'the drawn-again ruler is dotted');
    // The same drop reaches both rulers: it is broken only where it crosses the upper labels.
    const drops = marks(f, 'drop'), ends = drops.map(drop => Number(drop.getAttribute('y2')));
    assert.equal(drops.length, 2);
    assert.equal(ends.at(-1), Number(lower.querySelector('.br-rule').getAttribute('y1')));
    const labelY = Number(upper.querySelector('.br-tick-label').getAttribute('y'));
    assert(Number(drops[1].getAttribute('y1')) > labelY, 'the drop resumes below the upper ruler\'s labels');
    assert.match(label(f), new RegExp(`reads your garment at ${two(r1)}`));
  }
  // The switch: one ruler gives way to the other, never both at once, and no reading stands
  // while neither is whole.
  for (let step = b4 * 10; step < (b4 + 2) * 10; step++) {
    const time = step / 10; f.seek(time);
    assert(rulers(f).length <= 1, `two rulers during the switch at ${time}s`);
    assert.deepEqual(readings(f), [], `a reading during the switch at ${time}s`);
  }
  // From then on: the running ruler, one reading, whatever the batch.
  for (let step = (b4 + 2) * 10; step <= scene.duration * 10; step++) {
    const time = step / 10; f.seek(time);
    assert.equal(rulers(f).length, 1); assert.equal(live(f).dataset.kind, 'running');
    assert.equal(Number(live(f).dataset.mean), running.mean);
    assert.deepEqual(readings(f), [['reading', `reads ${two(r0)}`]], `the reading moved at ${time}s`);
  }
});

test('batch ruler: no number is drawn that the fixture does not declare, glides included', t => {
  const f = fixture(t, NAME), d = declared(f), {one, other, running, readings: rs} = derive(d); f.load(); f.open();
  // The readings are the three declared outputs; the axis carries the integers the values
  // span; a ruler is graduated in whole spreads. Nothing in between is ever printed, so no
  // interim reading appears while a ruler slides.
  const allowed = new Set([...rs.map(r => `reads ${two(r)}`), '−2', '−1', '0', '1', '2', '3', '4']);
  const words = new Set(['training mode', 'evaluation mode', 'your garment', 'mean', 'batch statistics',
    'running statistics', 'first batch', 'second batch']);
  const seen = new Set();
  for (let step = 0; step <= scene.duration * 10; step++) {
    f.seek(step / 10);
    for (const n of drawing(f).querySelectorAll('text')) {
      const text = n.textContent;
      assert(allowed.has(text) || words.has(text), `"${text}" drawn at ${step / 10}s`);
      if (/^reads /.test(text)) seen.add(text);
    }
    // The picture's description speaks the same numbers only.
    for (const token of label(f).match(/−?\d+(?:\.\d+)?/g) || []) {
      assert([...d.first, ...d.second, d.garment, one.mean, other.mean, running.mean, 1, ...rs].map(v => two(v)).includes(two(Number(token.replace('−', '-')))),
        `the description says ${token} at ${step / 10}s`);
    }
  }
  assert.deepEqual([...seen].sort(), rs.map(r => `reads ${two(r)}`).sort(), 'each declared reading is drawn at some point');
});

test('batch ruler: the captions say what the picture does, and the reveal waits for the ruler', t => {
  const f = fixture(t, NAME), d = declared(f), {readings: [, r2, r0]} = derive(d); f.load(); f.open();
  const expected = [
    "In training mode, BatchNorm measures each value with its batch's own mean and spread.",
    "Swap the other three garments for larger ones. Does your garment's output change?",
    "The other three move, and the batch's ruler moves with them.",
    'Same input, opposite outputs: in training mode the output depends on the batch.',
    'In evaluation mode BatchNorm uses running statistics collected during training.',
    `Swap the batch back: the running ruler stays put, and the reading stays ${plain(r0)}.`,
    'Any batch, the same reading: in evaluation mode the output depends on the input alone.',
    'Two machines: training measures with the batch, evaluation with stored statistics.'
  ];
  scene.beats.forEach((beat, i) => assert.equal((f.seek(beat), caption(f)), expected[i]));
  const arrived = `Your garment still holds ${plain(d.garment)}, but now it reads ${plain(r2)}.`;
  const [, , b2] = scene.beats;
  for (let step = 0; step < 50; step++) {
    const time = b2 + step / 10; f.seek(time);
    const landed = live(f).dataset.mean === String(derive(d).other.mean) && readings(f).length === 1;
    assert.equal(caption(f), landed && step >= 25 ? arrived : expected[2], `caption at ${time}s`);
    if (caption(f) === arrived) assert.deepEqual(readings(f), [['reading', `reads ${two(r2)}`]]);
  }
  // Under reduced motion each beat is its finished state, the reveal's caption included.
  const r = fixture(t, NAME, {reduced: true}); r.load(); r.open();
  r.seek(b2); assert.equal(caption(r), arrived); assert.deepEqual(readings(r), [['reading', `reads ${two(r2)}`]]);
  f.seek(scene.duration); assert.equal(caption(f), expected[7], 'the final frame closes on the two machines');
});

test('batch ruler: the formula washes the batch statistics in training and strikes them in evaluation', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const states = scene.beats.map(beat => {
    f.seek(beat + 1);
    const formula = f.$('[data-formula]');
    return [formula.classList.contains('br-batch-lit'), formula.classList.contains('br-batch-off')];
  });
  assert.deepEqual(states, [[true, false], [true, false], [true, false], [true, false],
    [false, true], [false, true], [false, true], [false, true]]);
  const css = read('batch-ruler/player.css');
  assert.match(css, /\[data-ready\] \.batch-ruler-formula\.br-batch-lit \.br-mu/);
  assert.match(css, /\[data-ready\] \.batch-ruler-formula\.br-batch-off \.br-sigma::after/);
  // The static fallback, without script, is fully lit: no wash or strike outside [data-ready].
  for (const rule of css.match(/[^{}]*\.br-batch-(?:lit|off)[^{}]*\{/g)) assert.match(rule, /\[data-ready\]/, rule);
});

test('batch ruler: text stays inside the picture and off its neighbours', t => {
  for (const width of [296, 375, 599, 600, 713, 900]) {
    const f = fixture(t, NAME, {width}); f.load(); f.open();
    const glides = [10.6, 11.2, 11.8, 12.2, 20.5, 21.5, 25.4, 25.9, 30.4, 30.9];
    for (const time of [...scene.beats, ...scene.beats.map(b => b + 1.2), ...scene.beats.map(b => b + 2.5), ...scene.beats.map(b => b + 4.99), ...glides, scene.duration]) {
      f.seek(Math.min(time, scene.duration));
      const [, , W, H] = f.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/).map(Number);
      const boxes = [...drawing(f).querySelectorAll('text')].map(n => {
        const sz = Number(n.getAttribute('font-size')), anchor = n.getAttribute('text-anchor');
        const w = n.textContent.length * sz * 0.56, x = Number(n.getAttribute('x')), y = Number(n.getAttribute('y'));
        const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
        return {left, right: left + w, top: y - sz, bottom: y + sz * 0.3, text: n.textContent};
      });
      for (const b of boxes) assert(b.left >= -1 && b.right <= W + 1 && b.top >= -1 && b.bottom <= H + 1, `${width}px ${time}s "${b.text}" outside`);
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        assert(Math.min(a.right, b.right) - Math.max(a.left, b.left) <= 1 || Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) <= 1,
          `${width}px ${time}s "${a.text}" and "${b.text}" collide`);
      }
      // Every mark stays inside the picture too, and no line crosses a text box it does not own.
      for (const n of drawing(f).querySelectorAll('circle')) {
        const cx = Number(n.getAttribute('cx')), cy = Number(n.getAttribute('cy')), r = Number(n.getAttribute('r'));
        assert(cx - r >= 0 && cx + r <= W && cy - r >= 0 && cy + r <= H, `${width}px ${time}s circle outside`);
      }
      for (const n of drawing(f).querySelectorAll('line')) {
        for (const k of ['x1', 'x2']) assert(Number(n.getAttribute(k)) >= 0 && Number(n.getAttribute(k)) <= W, `${width}px ${time}s line outside`);
        for (const k of ['y1', 'y2']) assert(Number(n.getAttribute(k)) >= 0 && Number(n.getAttribute(k)) <= H, `${width}px ${time}s line outside`);
      }
      for (const drop of marks(f, 'drop')) {
        const x = Number(drop.getAttribute('x1')), y1 = Number(drop.getAttribute('y1')), y2 = Number(drop.getAttribute('y2'));
        for (const b of boxes) {
          const crosses = x > b.left + 1 && x < b.right - 1 && Math.min(y2, b.bottom) - Math.max(y1, b.top) > 1;
          assert(!crosses, `${width}px ${time}s the drop runs through "${b.text}"`);
        }
      }
    }
    // The narrow print is a reflow, not the wide one shrunk.
    const [, , W] = f.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/).map(Number);
    assert.equal(W, width < 600 ? 296 : 713);
  }
});

test('batch ruler: seeking is deterministic', t => {
  const f = fixture(t, NAME); f.load(); f.open();
  const snap = time => {
    f.seek(time);
    return canonicalMarkup(f.$('[data-pane]').innerHTML.replace(/aria-valuetext="[^"]*"/g, '')) + label(f) + f.root.dataset.stage;
  };
  const times = [0, 7, 10.6, 11.8, 13, 17, 20.5, 21.5, 23, 25.7, 32, 39, 40];
  assert.deepEqual(times.map(snap), [...times].reverse().map(snap).reverse());
});

test('batch ruler: the committed static print is a fresh render of the final frame', async () => {
  const generated = await staticFrame(NAME);
  assert.equal(generated.before, generated.after, 'run scripts/render_static_frames.cjs batch-ruler');
});

test('batch ruler: typography, voice and inertness', t => {
  const player = read('batch-ruler/player.js'), panel = read('batch-ruler/panel.html');
  assert.doesNotMatch(player, /Math\.random|fetch\(|import\(|setInterval\(/);
  assert.doesNotMatch(panel, /@eq-|—/);
  assert.equal((player.match(/getBoundingClientRect/g) || []).length, 1);
  const f = fixture(t, NAME);
  // Visible prose: no exclamation mark, no contraction, no apparatus word, no film wording.
  const prose = (() => { const copy = f.root.cloneNode(true); copy.querySelectorAll('code, [data-formula]').forEach(c => c.remove()); return copy.textContent; })();
  assert.doesNotMatch(prose, /!/);
  assert.doesNotMatch(prose, /n't\b|\b(it|that|there|what|here|let)'s\b|'(re|ll|ve|m|d)\b/i);
  assert.doesNotMatch(prose, /\b(recap|section|subsection|table|callout|receipt|ledger|film|lecture|course|students?)\b/i);
  assert.doesNotMatch(prose, /\d-\d|(?<![\w.])-\d|\de[-+]?\d/, 'an ASCII minus or e-notation in the prose');
  // One visible boundary sentence, the rest closed inside the scope disclosure.
  const boundary = f.$('.mechanism-boundary > p').textContent.trim();
  assert.equal(boundary, 'Each garment is one number here; BatchNorm2d pools every pixel of the channel as well, and the running statistics are declared, not trained.');
  assert.equal(f.root.querySelectorAll('.mechanism-boundary > p').length, 1);
  assert(boundary.split(/\s+/).length <= 30);
  assert.equal(f.$('.mechanism-scope').open, false);
  // The transfer check, exactly as briefed, closed and before the transcript.
  const check = f.$('details.mechanism-check');
  assert.equal(check.open, false);
  assert.equal(check.querySelector('summary').innerHTML.trim(),
    "<strong>Check yourself.</strong> In training mode, every value in the first batch doubles, your garment's included: 4, 0, 0 and 4. What does BatchNorm output for your garment?");
  assert.equal(check.querySelector('p').textContent.trim(),
    'Still 1. The mean doubles to 2 and the spread to 2, so the garment reads (4 − 2)/2 = 1: in training mode a rescaling shared by the whole batch cancels out.');
  assert(check.compareDocumentPosition(f.$('#batch-ruler-transcript')) & 4);
  assert.equal(f.root.querySelectorAll('#batch-ruler-transcript li').length, scene.beats.length);
  assert.equal(f.$('#batch-ruler-playback-help').textContent,
    "Silent; paused initially; 1.5× playback. Focus the animation pane: Space or K plays/pauses, arrows seek between beats, Home/End jump, Escape pauses. The scrubber and speed menu also work by keyboard. Reduced-motion mode holds each beat's finished state instead of moving between them.");
  // No control of its own: the scrubber is the pane's only range.
  assert.equal(f.root.querySelectorAll('input[type=range]').length, 1);
  f.load(); f.open();
  for (const time of [...scene.beats, ...scene.beats.map(b => b + 1.5), ...scene.beats.map(b => b + 4.99), scene.duration]) {
    f.seek(time);
    for (const n of drawing(f).querySelectorAll('text')) {
      assert.doesNotMatch(n.textContent, /\de[-+]?\d|(?<![\w.])-\d|\^|\bexp\(|—/, `bad typography in "${n.textContent}"`);
    }
    for (const text of [label(f), valuetext(f), caption(f)]) {
      assert.doesNotMatch(text, /\de[-+]?\d|(?<![\w.])-\d|—|!|n't\b/, `bad typography in "${text}"`);
    }
    assert(caption(f).trim().split(/\s+/).length <= 20);
  }
});

test('integration: the excerpt follows the gamma and beta paragraph and precedes the two-machines warning', () => {
  const filter = fs.readFileSync(path.join(ROOT, scene.filter), 'utf8');
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
  assert.doesNotMatch(filter, /batch-ruler|sane numbers/);
  const config = fs.readFileSync(path.join(ROOT, '_quarto.yml'), 'utf8');
  assert.match(config, /^\s+- interactives\/batch-ruler\/player\.js$/m);
  const chapter = chapterSource(NAME), prose = chapter.split(/\s+/).join(' ');
  assert.equal(scene.anchor.type, 'after-paragraph');
  assert.equal(prose.split(scene.anchor.target).length, 2, 'the anchor phrase occurs once');
  const at = prose.indexOf(scene.anchor.target);
  const end = prose.indexOf('since $\\beta$ already provides the shift.');
  const warning = prose.indexOf('## BN uses different statistics in training and evaluation');
  assert(prose.indexOf('## The stabilizer we owe you: batch normalization') < at);
  assert(at < end && end < warning, 'the panel lands after the paragraph and before the warning');
  // The anchor's paragraph is the last block before the warning: the reader predicts first.
  const tail = 'since $\\beta$ already provides the shift.';
  assert.equal(chapter.slice(chapter.indexOf(tail) + tail.length, chapter.indexOf('::: {.callout-warning}\n## BN uses different statistics in training and evaluation')).trim(), '');
  // Other panels share the chapter; none uses this paragraph.
  const neighbours = require('./html-tests/excerpt-harness.cjs').manifest.scenes.filter(other => other.qmd === scene.qmd && other.id !== scene.id);
  assert(neighbours.length >= 2, 'the chapter carries other panels');
  for (const other of neighbours) assert.notEqual(other.anchor.target, scene.anchor.target, `${other.id} shares the anchor`);
});
