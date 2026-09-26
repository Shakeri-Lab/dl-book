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
  // The check swaps the ambient dimension for the intrinsic one: the spread goes as one
  // over the square root of the dimension the data actually varies in, so the band is
  // wider than the ambient number suggests by the square root of their ratio.
  // The check widens the window: the count follows n - k + 1, and the centre never
  // reaches the first or last (k - 1) / 2 samples, which is the slice the plot needs.
  'box-average': root => {
    const n = nums(root.dataset.samples).length, k = 25, half = (k - 1) / 2;
    assert.equal(Number(root.dataset.width), 9, 'the scene itself uses the chapter\'s nine');
    return [`${n - k + 1}`, `t[${half}:-${half}]`, `300 \u2212 25 + 1 = ${n - k + 1}`, `within ${half} samples`];
  },
  // The check transposes the kernel: the zoo's horizontal Sobel, computed on the same crop.
  'sobel-split': root => {
    const kernel = nums(root.dataset.kernel), along = nums(root.dataset.along), across = nums(root.dataset.across);
    const [top, left] = nums(root.dataset.crop), [r0, r1, c0, c1] = nums(root.dataset.rect), level = Number(root.dataset.level);
    const px = (r, c) => (top + r >= r0 && top + r < r1 && left + c >= c0 && left + c < c1 ? level : 0);
    const transposed = across.flatMap(b => along.map(a => a * b));
    assert.deepEqual(along.flatMap(a => across.map(b => a * b)), kernel);
    const respond = (w, r, c) => [0, 1, 2].reduce((s, a) => s + [0, 1, 2].reduce((u, b) => u + w[3 * a + b] * px(r - 1 + a, c - 1 + b), 0), 0);
    const stops = nums(root.dataset.stops), side = [stops[2], stops[3]], topEdge = [stops[4], stops[5]];
    const onTop = respond(transposed, ...topEdge), onSide = respond(transposed, ...side);
    assert.equal(onSide, 0, 'the transposed kernel is silent on the left side');
    return [`${onTop.toFixed(1)} on the top edge`, `${onSide} on the left side`, 'bottom minus top', `climbs by ${level}`];
  },
  'distance-band': root => {
    const ambient = Number(root.dataset.focus), intrinsic = 12;
    const widen = Math.sqrt(ambient / intrinsic);
    assert(widen > 7.5 && widen < 8.5, 'about eight times wider');
    return ['intrinsic 12', 'ambient 784', 'eight times wider',
      `square root of ${ambient} over ${intrinsic}`];
  },
  // The check applies the permutation to the pixels ALONE, which is the case the scene
  // never draws: the shuffle experiment is free only because retraining moves the
  // weights with them. Verified here as arithmetic, not as prose.
  'shift-shuffle': root => {
    const w = nums(root.dataset.weights), x = nums(root.dataset.pixels), perm = nums(root.dataset.permutation);
    const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
    const together = dot(perm.map(i => w[i]), perm.map(i => x[i]));
    const pixelsOnly = dot(w, perm.map(i => x[i]));
    assert(Math.abs(together - dot(w, x)) < 1e-12, 'a common permutation is free');
    assert(Math.abs(pixelsOnly - dot(w, x)) > 0.1, 'permuting the pixels alone is not');
    return ['Yes, and no.', 're-pairs every term', 'retrains', 'relative positions'];
  },
  // The check restarts the same rule from three times as many configurations: one more
  // round, three times the final budget, and a saving that grows rather than holds.
  'halving-budget': root => {
    const configs = nums(root.dataset.keep)[0] * 3, ratio = 3;
    const counts = [], rungs = [];
    for (let n = configs, b = 1; n >= 1; n /= ratio, b *= ratio) { counts.push(n); rungs.push(b); }
    let previous = 0, cost = 0;
    const perRound = counts.map((n, r) => { const c = n * (rungs[r] - previous); previous = rungs[r]; cost += c; return c; });
    assert.deepEqual(counts, [81, 27, 9, 3, 1]);
    assert.deepEqual(perRound, [81, 54, 54, 54, 54]);
    const full = configs * rungs.at(-1);
    return ['Five rounds', `${rungs.at(-1)} epochs`, `${cost} epoch-units`,
      `${full}`, `about ${Math.round(full / cost)} times`];
  },
  // The check moves the second branch's target, so the two branches no longer carry the
  // same value. The product rule hands each branch the OTHER branch's value, so the
  // counter holds their sum -- which is then no longer twice either one.
  'branch-blame': root => {
    const w = Number(root.dataset.w), x = Number(root.dataset.x);
    const b = Number(root.dataset.bias), target = Number(root.dataset.target), e = Number(root.dataset.e);
    const a = 1 / (1 + e ** -(w * x + b));
    const near = a - target, far = a - 0.1, total = near + far, gate = a * (1 - a);
    assert(Math.abs(total - 2 * near) > 1e-3, 'the moved target breaks the doubling the scene showed');
    return [fixed(total, 4), fixed(far, 4), fixed(near, 4),
      fixed(total * gate * x, 4), fixed(2 * near * gate * x, 4)];
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
  'sgd-zones': root => {
    const xs = nums(root.dataset.xs), residuals = nums(root.dataset.residuals);
    const [gw, gb] = nums(root.dataset.line), start = nums(root.dataset.start);
    const reps = residuals.length / xs.length, X = [], Y = [];
    for (let r = 0; r < reps; r += 1) xs.forEach((x, k) => { X.push(x); Y.push(gw * x + gb + residuals[r * xs.length + k]); });
    const grad = ([w, b], idx) => {
      const rows = idx ?? X.map((_, i) => i), m = rows.length;
      const e = rows.map(i => w * X[i] + b - Y[i]);
      return [2 * e.reduce((s, ei, k) => s + ei * X[rows[k]], 0) / m, 2 * e.reduce((s, ei) => s + ei, 0) / m];
    };
    const batches = Array.from({length: reps}, (_, r) => xs.map((_, k) => r * xs.length + k));
    const here = grad(start), noise = batches.map(b => grad(start, b).map((v, i) => v - here[i]));
    // The bowl is quadratic, so doubling the displacement from the optimum doubles the
    // signal while the five noise vectors are unchanged: every angle roughly halves.
    const far = [gw + 2 * (start[0] - gw), gb + 2 * (start[1] - gb)];
    const widest = point => {
      const g = grad(point), len = Math.hypot(...g), u = [g[0] / len, g[1] / len];
      return Math.max(...noise.map(x => {
        const v = [g[0] + x[0], g[1] + x[1]];
        return Math.atan2(Math.abs(u[0] * v[1] - u[1] * v[0]), v[0] * u[0] + v[1] * u[1]) * 180 / Math.PI;
      }));
    };
    assert(Math.abs(Math.hypot(...grad(far)) / Math.hypot(...here) - 2) < 1e-9, 'the signal must double');
    return [fixed(widest(far), 2), fixed(widest(start), 2)];
  },
  'sigmoid-squash': root => {
    const w = nums(root.dataset.weights), b = Number(root.dataset.bias), cross = nums(root.dataset.cross);
    const sq = w[0] * w[0] + w[1] * w[1];
    // The point whose score is 1, on the boundary's normal through the crossing point.
    const at = [cross[0] + w[0] / sq, cross[1] + w[1] / sq];
    const score = (v, k = 1) => k * (w[0] * at[0] + w[1] * at[1] + b);
    assert(Math.abs(score(at) - 1) < 1e-12, 'the probe point must score exactly 1');
    // Doubling w and b doubles every score, so the zero set -- the boundary -- is the same line.
    return [fixed(sigmoid(score(at)), 4), fixed(sigmoid(2 * score(at)), 4)];
  },
  'batch-vote': root => {
    assert.equal(nums(root.dataset.features).length ** 2, 64, 'the declared population is 64 examples');
    // The chapter's two laws at a population far larger than this scene's own.
    const N = 1e6, correction = size => Math.sqrt((N - size) / (N - 1));
    const ratio = 0.5 * correction(400) / correction(100);
    assert(Math.abs(ratio - 0.5) < 1e-3, 'the correction barely moves when B is far below n');
    return [fixed(correction(100), 5), fixed(correction(400), 5), fixed(ratio, 5)];
  },
  'feature-space': root => {
    const readout = nums(root.dataset.readout), b = Number(root.dataset.readoutBias);
    const norm = v => Math.hypot(...v), cut = v => -b * (norm(v) / norm(readout)) / norm(v);
    // Scaling the readout scales w and b together, so -b/||w|| and the drawn axis w/||w|| both hold.
    const doubled = readout.map(v => 2 * v);
    assert.equal(norm(readout), 2); assert.equal(norm(doubled), 4);
    assert(doubled.every((v, i) => Math.abs(v / norm(doubled) - readout[i] / norm(readout)) < 1e-12),
      'the drawn axis is unchanged by scaling');
    assert(Math.abs(-b / norm(readout) - (-2 * b) / norm(doubled)) < 1e-12, 'the cut is unchanged');
    return [fixed(-b / norm(readout), 2)];
  },
  'surprise-loss': () => {
    // Two examples labelled 1: two hedges against one confident hit and one confident miss.
    const loss = p => -Math.log(p), hedge = 2 * loss(0.5), split = loss(0.9) + loss(0.1);
    assert(hedge < split, 'the confident mistake must cost more than both hedges');
    return [fixed(loss(0.5), 4), fixed(hedge, 4), fixed(loss(0.9), 4), fixed(loss(0.1), 4), fixed(split, 4)];
  },
  'decay-angle': root => {
    const rate = Number(root.dataset.rate ?? 0.1), penalty = Number(root.dataset.penalty ?? 0.01);
    // The check uses the chapter's rule at its own eta and lambda, not the fixture's.
    const factor = 1 - 2 * 0.1 * 0.01;
    let steps = 0, length = 1;
    while (length > 0.1) { length *= factor; steps += 1; }
    assert.equal(steps, 1151);
    assert(Number.isFinite(rate) && Number.isFinite(penalty));
    return [String(steps), minus((1 - 2 * 0.1 * 0.01).toFixed(3))];
  },
  'momentum-memory': () => {
    // v <- beta v + g. A constant g has fixed point g/(1-beta); an alternating g a
    // two-cycle at +-g/(1+beta). Both are recomputed by iterating the recursion too.
    const settle = (beta, alternating) => {
      let v = 0;
      for (let i = 0; i < 4000; i += 1) v = beta * v + (alternating && i % 2 ? -10 : 10);
      return Math.abs(v);
    };
    for (const beta of [0.9, 0.95]) {
      assert(Math.abs(settle(beta, false) - 10 / (1 - beta)) < 1e-9, 'agreeing fixed point');
      assert(Math.abs(settle(beta, true) - 10 / (1 + beta)) < 1e-9, 'alternating two-cycle');
    }
    return [fixed(10 / 0.1, 0), fixed(10 / 0.05, 0), fixed(10 / 1.9, 4), fixed(10 / 1.95, 4),
      fixed(1.9 / 0.1, 0), fixed(1.95 / 0.05, 0)];
  },
  'hinge-lift': root => {
    const w = JSON.parse(root.dataset.weights), b = Number(root.dataset.bias);
    const corners = [[0, 0], [0, 1], [1, 0], [1, 1]];
    // Over the four signed corners the plane's own coefficients cancel, so every plane's
    // clearances sum to the same budget: positive only when the rectifier clips a corner.
    const budget = bias => {
      const h = corners.map(([a, c]) => Math.max(w[0] * a + w[1] * c + bias, 0));
      return h[0] + h[3] - h[1] - h[2];
    };
    assert(Math.abs(budget(b) + b) < 1e-12, 'the clipped budget equals minus the bias');
    assert(Math.abs(budget(0)) < 1e-12, 'with nothing clipped the lifted corners are coplanar');
    const z = corners.map(([a, c]) => w[0] * a + w[1] * c);
    assert(z.every(v => v >= 0), 'with b = 0 nothing is clipped');
    return ["No.", `${z[2].toFixed(2)} and ${z[3].toFixed(2)}`, `0 + ${z[3].toFixed(2)} = ${z[1]} + ${z[2].toFixed(2)}`];
  },
  'step-length': root => {
    const c = Number(root.dataset.curvature);
    // On a quadratic the iterate's displacement is multiplied by 1 - alpha*c each step,
    // so the threshold is 2/c: ten times the curvature makes the chapter's middle rate diverge.
    const factor = (alpha, curve) => 1 - alpha * curve;
    assert.equal(2 / c, 1, 'the declared bowl puts the threshold at one');
    const steep = 20, rates = [0.005, 0.12, 1.1];
    const survive = rates.filter(a => Math.abs(factor(a, steep)) < 1);
    assert.deepEqual(survive, [0.005], 'only the smallest rate survives ten times the curvature');
    return [fixed(2 / steep, 1), minus(String(factor(0.12, steep)))];
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
    // Prose takes a true minus; quoted code keeps the ASCII one it is written with, so a
    // <code> span is set aside before the typography scan and nowhere else.
    const prose = node => { const copy = node.cloneNode(true); copy.querySelectorAll('code').forEach(c => c.remove()); return copy.textContent; };
    assert.doesNotMatch(prose(check.querySelector('summary')) + prose(check.querySelector('p')),
      /\d-\d|(?<![\w.])-\d|\de[-+]?\d/, 'no ASCII minus or e-notation');
    for (const piece of expected[entry.scene](root, doc)) assert(answer.includes(piece), `answer lacks “${piece}”: ${answer}`);
  });
}
