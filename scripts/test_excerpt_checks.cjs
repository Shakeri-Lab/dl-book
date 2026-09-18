// Every excerpt closes with one transfer question whose answer is hidden until asked for.
// The numbers in each answer are recomputed here from the panel's own declared fixture (or, for a
// panel that declares none, from the manuscript literals its receipt binds), independently of
// any player, so an answer cannot drift from the mechanism it tests.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('./html-tests/node_modules/jsdom');

const ROOT = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'interactives/manifest.json'), 'utf8'));
const panel = scene => new JSDOM(fs.readFileSync(path.join(ROOT, 'interactives', scene, 'panel.html'), 'utf8')).window.document;
const nums = text => text.trim().split(/\s+/).map(Number);
const minus = text => text.replace(/-/g, '−');
const fixed = (value, digits) => minus(value.toFixed(digits));
const sci = (value, digits) => {
  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const sup = String(exponent).replace('-', '⁻').replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
  return `${minus((value / 10 ** exponent).toFixed(digits))} × 10${sup}`;
};
const sigmoid = z => 1 / (1 + Math.exp(-z));

// scene -> the strings its answer must contain, recomputed from the declared fixture.
const expected = {
  convolution: () => ['6 − 3 + 1 = 4', '4 × 4', String((6 - 3 + 1) ** 2 === 16 && 'Sixteen')],
  'kernel-weighting': root => {
    const keys = nums(root.dataset.keys), values = nums(root.dataset.values), h = Number(root.dataset.bandwidth);
    const a = keys.map(k => Math.exp(-((1 - k) ** 2) / (2 * h * h))), total = a.reduce((x, y) => x + y);
    const w = a.map(x => x / total), prediction = w.reduce((sum, wi, i) => sum + wi * values[i], 0);
    return [fixed(w[0], 3), fixed(prediction, 3)];
  },
  'bert-ledger': (root, doc) => {
    const rail = doc.querySelector('[data-token-rail]').dataset, selected = nums(rail.selected);
    assert(selected.includes(4) && !selected.includes(3), 'position 4 is selected and position 3 is not');
    assert.deepEqual(nums(rail.randomSites), [4]); assert.equal(rail.randomReplacement, 'bank');
    assert.equal(doc.querySelector('[data-token="3"] .bert-original').textContent, 'bank');
    assert.equal(doc.querySelector('[data-token="4"] .bert-original').textContent, 'rose');
    return ['position 4', '“rose”', 'Position 3'];
  },
  'softmax-shift': root => {
    const logits = nums(root.dataset.logits), top = Math.max(...logits), shifted = logits.map(o => o - top);
    const e = shifted.map(Math.exp), total = e.reduce((x, y) => x + y);
    return [`(${shifted.map(v => minus(String(v))).join(', ')})`, `(${e.map(v => fixed(v / total, 4)).join(', ')})`];
  },
  'one-chain': root => {
    const {w, x, b, y} = Object.fromEntries(['w', 'x', 'b', 'y'].map(k => [k, Number(root.dataset[k])]));
    const a = sigmoid(w * x + b), dLda = 2 * (a - y), dadz = a * (1 - a);
    assert.equal(x, 2, 'the answer says the bias slope is half the weight slope');
    return [fixed(dLda * dadz, 6), `${fixed(dLda, 6)} × ${fixed(dadz, 6)}`];
  },
  'gate-product': root => {
    const steps = Number(root.dataset.horizon), half = Number(root.dataset.half);
    const ratio = Math.log10(0.9 ** steps / half ** steps);
    assert(ratio > 20 && ratio < 21, 'some twenty orders of magnitude');
    return [sci(0.9 ** steps, 2), sci(half ** steps, 2)];
  },
  'pooling-bins': root => {
    const size = Number(root.dataset.size), win = Number(root.dataset.window), t = nums(root.dataset.scene);
    const bins = size / win, pooled = Array(bins * bins).fill(0);
    for (let i = 0; i < t.length; i += 3) {
      const r = t[i] - 1, c = t[i + 1];
      assert(r >= 0, 'one pixel up keeps every clue inside the grid');
      const k = Math.floor(r / win) * bins + Math.floor(c / win); pooled[k] = Math.max(pooled[k], t[i + 2]);
    }
    return [`[${pooled.join(', ')}]`];
  },
  'quantization-grid': root => {
    const w = nums(root.dataset.values), Q = 2 ** (3 - 1) - 1, s = 4 / Q;
    const hat = w.map(v => Math.round(v / s) * s);
    assert.equal(hat.filter(v => v === 0).length, 4);
    return [hat.map(v => v === 0 ? '0' : fixed(v, 3)).join(', '), fixed(s, 3)];
  },
  'lstm-valves': root => {
    const carry = Number(root.dataset.carry), candidate = Number(root.dataset.candidate);
    const f = nums(root.dataset.forget).at(-1), i = nums(root.dataset.input).at(-1), c = f * carry + i * candidate;
    return [fixed(c, 2), fixed(Math.tanh(c), 3)];
  },
  'reference-tilt': root => {
    const ref = nums(root.dataset.reference), r = nums(root.dataset.rewards), best = r.indexOf(Math.max(...r));
    assert.equal('ABCD'[best], 'D');
    return [`−ln ${ref[best]}`, fixed(-Math.log(ref[best]), 3), `tops out at ${Math.max(...r)}`];
  },
  'score-field': () => {
    const s2 = 0.75 ** 2, left = Math.exp(-((2 + 2) ** 2) / (2 * s2)), w = left / (left + 1);
    return [sci(w * (-2 - 2) / s2 + (1 - w) * 0, 2)];
  },
  'attention-bill': root => {
    const side = Number(root.dataset.imageWidth) / 8, tokens = side * side;
    return [`${tokens} tokens`, `${side} × ${side}`, (tokens * tokens).toLocaleString('en-US')];
  },
  'mask-before-softmax': (root, doc) => {
    const text = doc.querySelector('.mechanism-check p').textContent;
    const real = [Math.exp(-0.3498), Math.exp(0.0183)], total = real[0] + real[1] + 1;
    return [fixed(1 / total, 3), fixed(total, 4)].concat(text.includes('e⁰ = 1') ? [] : ['e⁰ = 1']);
  },
  'same-subspace': () => ['No.', 'orthogonal'],
  'svd-circle': root => {
    const [first, second] = JSON.parse(root.dataset.singularValues);
    return [`length ${first}`, `exactly ${second}`];
  },
  'preference-ruler': root => {
    const scores = JSON.parse(root.dataset.scores), [i, j] = JSON.parse(root.dataset.pair), gap = scores[i] - scores[j];
    return [fixed(sigmoid(gap), 3), fixed(sigmoid(2 * gap), 3), `doubles to ${2 * gap}`];
  },
  'scale-granularity': root => {
    const f = JSON.parse(root.dataset.fixture), Q = 2 ** (f.bits - 1) - 1, s = 1 / Q, top = Math.round(f.quietMax / s);
    assert.equal(2 * top + 1, 3);
    return [fixed(s, 5), fixed(f.quietMax / s, 2), String(2 * Q + 1)];
  },
  'greedy-tree': root => {
    const f = JSON.parse(root.dataset.fixture), p = 0.85;
    const winner = f.root[0] * p * f.eos[0], rival = f.root[1] * f.next[1] * f.eos[1];
    const bounds = [f.root[0] * (1 - p), f.root[0] * p * (1 - f.eos[0]), f.root[1] * (1 - f.next[1]), f.root[1] * f.next[1] * (1 - f.eos[1])];
    assert(winner > rival && bounds.every(b => b < winner));
    return [fixed(winner, 3), fixed(rival, 3), fixed(Math.max(...bounds), 3)];
  },
  'template-score': root => {
    const w = Number(root.dataset.templateNorm ?? root.dataset.weightNorm), x = Number(root.dataset.inputNorm), b = Number(root.dataset.bias);
    // cos 60 is exactly 1/2, so the new score is exact; the opening reading is the scene's own.
    const asked = b + w * 4 * 0.5, opening = b + w * x * Math.cos(20 * Math.PI / 180);
    assert(asked > opening, 'the longer, worse-aligned input must win');
    return [fixed(asked, 2), fixed(opening, 2)];
  },
  'downhill-bowl': root => {
    const xs = nums(root.dataset.xs), residuals = nums(root.dataset.residuals);
    const [gw, gb] = nums(root.dataset.generating), start = nums(root.dataset.start), eta = Number(root.dataset.rate);
    const ys = xs.map((x, i) => gw * x + gb + residuals[i]), n = xs.length;
    const grad = ([w, b]) => {
      const e = xs.map((x, i) => w * x + b - ys[i]);
      return [2 * e.reduce((s, ei, i) => s + ei * xs[i], 0) / n, 2 * e.reduce((s, ei) => s + ei, 0) / n];
    };
    const norm = v => Math.hypot(v[0], v[1]);
    // The bowl is quadratic, so the gradient is linear in the displacement from the
    // minimiser: doubling that displacement doubles every step, the first one included.
    const sx = xs.reduce((s, x) => s + x, 0) / n, sxx = xs.reduce((s, x) => s + x * x, 0) / n;
    const sy = ys.reduce((s, y) => s + y, 0) / n, sxy = xs.reduce((s, x, i) => s + x * ys[i], 0) / n;
    const wStar = (sxy - sx * sy) / (sxx - sx * sx), star = [wStar, sy - wStar * sx];
    const far = star.map((c, i) => c + 2 * (start[i] - c));
    const first = eta * norm(grad(start)), doubled = eta * norm(grad(far));
    assert(Math.abs(doubled / first - 2) < 1e-9, 'the first step must double exactly');
    return [fixed(doubled, 4)];
  },
  'column-space': root => {
    const columns = JSON.parse(root.dataset.columns), target = JSON.parse(root.dataset.target);
    const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
    // Normal equations on the declared schematic, then the dependent third column.
    const g = [[dot(columns[0], columns[0]), dot(columns[0], columns[1])], [dot(columns[1], columns[0]), dot(columns[1], columns[1])]];
    const r = [dot(columns[0], target), dot(columns[1], target)], det = g[0][0] * g[1][1] - g[0][1] * g[1][0];
    const w = [(r[0] * g[1][1] - g[0][1] * r[1]) / det, (g[0][0] * r[1] - r[0] * g[1][0]) / det];
    const fit = target.map((_, i) => w[0] * columns[0][i] + w[1] * columns[1][i]);
    const residual = target.map((v, i) => v - fit[i]), length = Math.hypot(...residual);
    const sum = columns[0].map((v, i) => v + columns[1][i]);
    assert(Math.abs(dot(sum, residual)) < 1e-12, 'a dependent column cannot reduce the residual');
    return [fixed(length, 0)];
  },
  'hinge-bump': () => ['2, −4, 2', 'peak becomes 4', '0, +2, −2, 0'],
  'mask-predictor': () => ['slot 0', 'one slot before'],
  'layernorm-axis': () => {
    const x = [10, 30, 50, 70], mean = x.reduce((a, b) => a + b) / 4, v = x.reduce((a, b) => a + (b - mean) ** 2, 0) / 4;
    return [`(${x.map(value => fixed((value - mean) / Math.sqrt(v + 1e-5), 3)).join(', ')})`];
  },
  'derivative-gates': () => [fixed(sigmoid(-6) * (1 - sigmoid(-6)), 6), fixed(sigmoid(-6), 4), '¼'],
};

for (const entry of manifest.scenes) {
  test(`${entry.scene}: one closed transfer check whose numbers follow from the declared fixture`, () => {
    const doc = panel(entry.scene), root = doc.getElementById(entry.id);
    const checks = root.querySelectorAll('details.mechanism-check');
    assert.equal(checks.length, 1, 'exactly one check');
    const check = checks[0];
    assert.equal(check.open, false, 'the answer is hidden until the reader asks for it');
    const summary = check.querySelector('summary').textContent.trim();
    assert.match(summary, /^Check yourself\. .+\?$/);
    const transcript = root.querySelector('details[id$="-transcript"]');
    assert(check.compareDocumentPosition(transcript) & 4, 'the check sits before the transcript');
    const answer = check.querySelector('p').textContent;
    const words = text => text.trim().split(/\s+/).length;
    assert(words(summary) <= 40, `question has ${words(summary)} words`);
    assert(words(answer) <= 70, `answer has ${words(answer)} words`);
    assert.doesNotMatch(summary + answer, /\d-\d|(?<![\w.])-\d|\de[-+]?\d/, 'no ASCII minus or e-notation');
    for (const piece of expected[entry.scene](root, doc)) assert(answer.includes(piece), `answer lacks “${piece}”: ${answer}`);
  });
}
