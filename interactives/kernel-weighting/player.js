(() => {
  const root = document.getElementById('kernel-weighting-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  const keys = [1, 3, 5], values = [1.5, 2.8, 1.8], bandwidth = 0.6;
  const cards = [...root.querySelectorAll('[data-observation]')];
  const svg = $('.kernel-plot svg'), drawing = $('[data-drawing]');
  let lastTime = 0, reduced = false, previousKey = '';
  function queryAt(t) {
    if (t < 20 || t >= 36) return 3.5;
    if (t < 22) return 3.5 - (t - 20) * 1.25;
    if (t < 32) return 1 + (t - 22) * 0.4;
    return 5 - (t - 32) * 0.375;
  }
  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    let query = queryAt(time);
    if (reduced) query = Math.round(query * 4) / 4;
    const stage = time < 4 ? 0 : time < 8 ? 1 : time < 12 ? 2 : time < 16 ? 3 : time < 20 ? 4 : 5;
    const distances = keys.map(key => Math.abs(query - key));
    const affinities = distances.map(distance => Math.exp(-(distance ** 2) / (2 * bandwidth ** 2)));
    const total = affinities.reduce((a, b) => a + b, 0);
    const weights = affinities.map(a => a / total);
    const products = weights.map((w, i) => w * values[i]);
    const prediction = products.reduce((a, b) => a + b, 0);
    root.dataset.query = String(query);
    root.dataset.weights = JSON.stringify(weights);
    root.dataset.prediction = String(prediction);
    root.dataset.stage = String(stage);
    $('[data-query]').textContent = query.toFixed(2);
    cards.forEach((card, i) => {
      for (const [name, number, digits, reveal] of [
        ['distance', distances[i], 2, 1], ['affinity', affinities[i], 5, 2],
        ['weight', weights[i], 4, 3], ['product', products[i], 4, 4]]) {
        const cell = card.querySelector(`[data-${name}]`);
        cell.textContent = stage >= reveal ? number.toFixed(digits) : '·';
        cell.setAttribute('aria-label', stage >= reveal ? `${name}: ${number.toFixed(digits)}` : `${name}: not revealed yet`);
      }
      card.querySelector('[data-bar]').style.width = `${stage >= 3 ? weights[i] * 100 : 0}%`;
    });
    [...root.querySelectorAll('.mechanism-stages span')].forEach((node, i) => node.classList.toggle('is-current', i === Math.max(0, stage - 1)));
    $('[data-formula]').textContent = stage < 2 ? 'First measure the distance from the query to each key.'
      : stage < 3 ? 'Affinity = exp(−distance² / (2h²)). Nearer keys receive larger affinities.'
      : `Weight = affinity / ${total.toFixed(5)} (the same denominator for all three).`;
    $('[data-invariant]').textContent = stage >= 3 ? `Weights sum to ${weights.reduce((a, b) => a + b, 0).toFixed(4)}.` : 'The normalization and weighted sum come next.';
    $('[data-prediction]').textContent = stage >= 4 ? `Prediction = ${prediction.toFixed(4)}, within [1.5, 2.8].` : 'Prediction: not revealed yet.';
    const captions = [
      'Predict first: at q = 3.5, which of these three observations should have the most influence?',
      'Measure distances along the input axis, not the vertical differences between observed values.',
      'Turn each distance into a positive Gaussian affinity. The bandwidth is fixed at 0.6.',
      'Divide by one shared sum. These are fractions of influence, not three independent scores.',
      'Each normalized weight multiplies its observed value. The three products add to one prediction.',
      time >= 36 ? 'Back at q = 3.5: the middle observation carries most of the influence, giving the printed prediction 2.7412.'
        : 'Move only the query. Rays, weights, products, and prediction all use the same current calculation.'
    ];
    $('[data-caption]').textContent = captions[stage];
    const width = Math.max(180, Math.round($('[data-plot]').getBoundingClientRect().width || 600));
    const stateKey = `${stage}/${query.toFixed(4)}/${width}`;
    if (stateKey !== previousKey) {
      previousKey = stateKey;
      const left = 34, right = width - 18, top = 18, bottom = 151;
      const x = k => left + (k - 0.5) / 5 * (right - left);
      const y = v => bottom - (v - 1) / 2.1 * (bottom - top);
      svg.setAttribute('viewBox', `0 0 ${width} 190`);
      svg.setAttribute('aria-label', `Query ${query.toFixed(2)}. Fixed observed values 1.5, 2.8, 1.8.${stage >= 4 ? ` Prediction ${prediction.toFixed(4)}.` : ''}`);
      let markup = `<line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" stroke="#8994a2"/>`;
      [1.5, 2, 2.5].forEach(v => { markup += `<text x="${left - 6}" y="${y(v) + 4}" text-anchor="end" fill="#596778" font-size="11">${v}</text>`; });
      if (stage >= 4) keys.forEach((key, i) => { markup += `<line x1="${x(key)}" y1="${y(values[i])}" x2="${x(query)}" y2="${y(prediction)}" stroke="#2f855a" stroke-width="${1 + 6 * weights[i]}" opacity="${0.18 + 0.62 * weights[i]}"/>`; });
      markup += `<line x1="${x(query)}" y1="${top + 5}" x2="${x(query)}" y2="${bottom}" stroke="#2b6cb0" stroke-dasharray="4 4"/>`;
      if (stage >= 1 && stage <= 3) keys.forEach((key, i) => {
        const level = bottom - 6 - i * 8;
        markup += `<path d="M${x(key)},${level - 3}v6m0,-3H${x(query)}m0,-3v6" fill="none" stroke="#2b6cb0" stroke-width="1"/>`;
      });
      keys.forEach((key, i) => {
        markup += `<circle cx="${x(key)}" cy="${y(values[i])}" r="5" fill="#7950b8"/><text x="${x(key)}" y="${bottom + 17}" text-anchor="middle" fill="#2b6cb0" font-size="12">${key}</text>`;
      });
      if (stage >= 4) markup += `<path d="M${x(query)},${y(prediction) - 7}l7,7 -7,7 -7,-7z" fill="#2f855a" stroke="white" stroke-width="1.5"/>`;
      markup += `<text x="${right}" y="187" text-anchor="end" fill="#2b6cb0" font-size="12">Key / query position</text>`;
      drawing.innerHTML = markup;
    }
    return `${captions[stage]} Query ${query.toFixed(2)}.${stage >= 4 ? ` Prediction ${prediction.toFixed(4)}.` : ''}`;
  }
  window.BookPlayback(root, render, () => { previousKey = ''; render(lastTime, reduced); });
})();
