(() => {
  const root = document.getElementById('bert-ledger-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  // The rail is the one in-repo mirror of the manuscript fixture
  // (chapters/part4/15-bert-pretraining.qmd:269-283): its cells carry the twelve tokens and its
  // attributes carry the Boolean rows as position lists. interactives/manifest.json names those
  // literals and scripts/audit_excerpt_fixtures.py keeps the chapter and this rail together.
  const rail = $('[data-token-rail]');
  const original = [...rail.querySelectorAll('[data-token] .bert-original')].map(cell => cell.textContent);
  const row = name => {
    const sites = new Set(rail.dataset[name].trim().split(/\s+/).filter(Boolean).map(Number));
    return original.map((_, index) => sites.has(index));
  };
  const eligible = row('eligible'), selected = row('selected');
  const mask_sites = row('maskSites'), random_sites = row('randomSites');
  // Derived exactly as the chapter derives it: selected & ~mask_sites & ~random_sites.
  const unchanged_sites = selected.map((bit, i) => bit && !mask_sites[i] && !random_sites[i]);
  const visible = original.map(token => token !== '[PAD]');
  const replacement = rail.dataset.randomReplacement;
  const corrupted = original.map((token, i) => mask_sites[i] ? '[MASK]' : random_sites[i] ? replacement : token);
  const ledgers = {eligible, selected, mask_sites, random_sites, unchanged_sites};
  const scenes = [
    {start: 0, until: 4, index: 8, phase: 0, kind: 'ask', title: 'Predict before playing'},
    {start: 4, until: 8, index: 8, phase: 0, kind: 'setup', title: 'Change the input; save the originals'},
    {start: 8, until: 14, index: 2, phase: 1, kind: 'case', title: 'Masked: quiet becomes [MASK]'},
    {start: 14, until: 20, index: 4, phase: 2, kind: 'case', title: 'Replaced: rose becomes bank'},
    {start: 20, until: 26, index: 8, phase: 3, kind: 'case', title: 'Unchanged, but chosen'},
    {start: 26, until: 32, index: 3, phase: 4, kind: 'case', title: 'Also unchanged, but NOT chosen'},
    {start: 32, until: 35, index: 9, phase: 4, kind: 'boundary', title: 'Special does not mean invisible'},
    {start: 35, until: 38, index: 10, phase: 4, kind: 'boundary', title: 'Padding is a separate control'},
    {start: 38, until: Infinity, index: 8, phase: 3, kind: 'recap', title: 'Chosen is what makes it count'}
  ];
  const clamp = n => Math.max(0, Math.min(1, n));
  const colors = {input: '#2b6cb0', target: '#7950b8', prediction: '#2f855a'};
  let previousKey = '', progress = {}, reduced = false;
  const geometry = {};
  function drawRays() {
    for (const [name, points] of Object.entries(geometry)) {
      const amount = progress[name] || 0;
      const ray = $(`[data-ray="${name}"]`), pulse = $(`[data-pulse="${name}"]`);
      ray.style.display = amount > 0 ? '' : 'none';
      ray.style.strokeDasharray = '1';
      ray.style.strokeDashoffset = String(1 - amount);
      ray.setAttribute('marker-end', amount >= 1 ? `url(#bert-${name}-arrow)` : 'none');
      pulse.style.display = amount > 0 && amount < 1 && !reduced ? '' : 'none';
      pulse.setAttribute('cx', points[0] + (points[2] - points[0]) * amount);
      pulse.setAttribute('cy', points[1] + (points[3] - points[1]) * amount);
      pulse.setAttribute('fill', colors[name]);
      ray.dataset.progress = String(amount);
    }
  }
  function layout() {
    const bounds = $('[data-flow]').getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    $('.bert-rays').setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    const box = name => $(`[data-box="${name}"]`).getBoundingClientRect();
    for (const [name, from, to, horizontal] of [
      ['input', 'input', 'prediction', false],
      ['target', 'target', 'loss', false],
      ['prediction', 'prediction', 'loss', true]]) {
      const a = box(from), b = box(to);
      const points = horizontal
        ? [a.right - bounds.left + 2, a.top + a.height / 2 - bounds.top,
          b.left - bounds.left - 5, b.top + b.height / 2 - bounds.top]
        : [a.left + a.width / 2 - bounds.left, a.bottom - bounds.top + 2,
          b.left + b.width / 2 - bounds.left, b.top - bounds.top - 5];
      geometry[name] = points;
      const ray = $(`[data-ray="${name}"]`);
      ray.setAttribute('d', `M${points[0]},${points[1]}L${points[2]},${points[3]}`);
      ray.setAttribute('stroke', colors[name]);
    }
    drawRays();
  }
  function render(time, reducedMotion) {
    const scene = scenes.find(s => time < s.until), i = scene.index;
    reduced = reducedMotion;
    const preparing = scene.kind === 'ask' || scene.kind === 'setup';
    // Boundary scenes draw their routes on the same ramp as the cases, so [SEP] and
    // [PAD] arrive rather than appearing complete the instant the scene starts.
    const timed = scene.kind === 'case' || scene.kind === 'boundary';
    const fraction = timed ? (time - scene.start) / (scene.until - scene.start) : preparing ? 0 : 1;
    const beat = Math.min(3, Math.floor(fraction * 4));
    // Drawing order is explanatory, not separate forward passes or masks.
    progress = {
      input: visible[i] ? clamp(fraction * 4) : 0,
      target: selected[i] ? clamp(fraction * 4 - 1) : 0,
      prediction: selected[i] ? clamp(fraction * 4 - 2) : 0
    };
    if (reduced) Object.keys(progress).forEach(name => { progress[name] = progress[name] >= 1 ? 1 : 0; });
    const scored = !preparing && selected[i] && beat === 3;
    const outputReady = !preparing && beat >= 1;
    // One branch clause, used by the ledger line and by the scrubber. The caption is a
    // live region, so aria-valuetext must not carry the caption sentence as well.
    const branch = scene.kind === 'ask' ? 'predict first.' : mask_sites[i] ? 'selected; masked.'
      : random_sites[i] ? 'selected; randomly replaced.'
        : unchanged_sites[i] ? 'selected; unchanged.' : 'not selected.';
    const key = `${scene.start}/${beat}`;
    root.dataset.position = String(i);
    root.dataset.selected = String(selected[i]);
    root.dataset.visible = String(visible[i]);
    root.dataset.scored = String(scored);
    root.dataset.beat = String(beat);
    if (key !== previousKey) {
      previousKey = key;
      [...root.querySelectorAll('[data-token]')].forEach((token, index) => {
        const input = scene.kind === 'ask' ? original[index] : corrupted[index];
        const chosen = scene.kind !== 'ask' && selected[index];
        token.querySelector('b').textContent = input;
        token.querySelector('.bert-change').textContent = input === original[index] ? '=' : '↓';
        token.querySelector('[data-choice]').textContent = chosen ? (random_sites[index] ? 'chosen*' : 'chosen') : '';
        token.classList.toggle('is-selected', chosen);
        token.classList.toggle('is-changed', input !== original[index]);
        token.classList.toggle('is-focus', index === i);
        token.setAttribute('aria-label', `Position ${index}. Original ${original[index]}; input ${input}.${chosen ? ' Chosen for target selection.' : ''}${random_sites[index] && input !== original[index] ? ' Input is one illustrative random replacement.' : ''}${index === i ? ' Focused.' : ''}${!visible[index] ? ' Padding; blocked as attention key.' : ''}`);
      });
      $('[data-case]').textContent = scene.title;
      $('[data-focus]').textContent = `Position ${i}: ${original[i]}`;
      Object.entries(ledgers).forEach(([name, flags]) => {
        const bit = $(`[data-bit="${name}"]`);
        bit.textContent = scene.kind === 'ask' ? '?' : String(Number(flags[i]));
        bit.dataset.value = scene.kind === 'ask' ? '' : String(Number(flags[i]));
      });
      $('[data-branch]').textContent = `Position ${i}: ${branch}`;
      $('[data-input]').textContent = scene.kind === 'ask' ? original[i] : corrupted[i];
      $('[data-input-heading]').textContent = visible[i] ? 'In BERT’s input' : 'Padding token';
      $('[data-input-note]').textContent = visible[i] ? 'One position in the full corrupted context' : 'Blocked as an attention key';
      $('[data-target]').textContent = preparing || selected[i] ? original[i] : 'Not a loss target';
      $('[data-target-note]').textContent = preparing || selected[i] ? 'A loss target, not an extra BERT input' : 'No original-label route into this loss';
      $('[data-output]').textContent = !outputReady ? 'Prediction comes next' : visible[i] ? `Prediction at ${i}` : 'No scored prediction';
      $('[data-output-note]').textContent = visible[i] ? 'Uses every visible context position' : 'PAD is blocked as a key';
      $('[data-loss]').textContent = preparing ? 'Does it count?' : scored
        ? `Yes: −log p${String(i).replace(/[0-9]/g, d => '₀₁₂₃₄₅₆₇₈₉'[Number(d)])}(${original[i]})`
        : !selected[i] && outputReady ? 'No direct term' : 'Follow the two paths';
      $('[data-loss-note]').textContent = preparing ? 'Predict before the routes meet.' : scored
        ? 'One term in the selected-position mean' : !selected[i] && outputReady
          ? visible[i] ? 'Still useful as context' : 'Excluded from target selection'
          : 'Original label + current prediction';
      for (const name of ['target', 'loss']) $(`[data-box="${name}"]`).classList.toggle('is-muted', !preparing && !selected[i]);
      $('[data-box="input"]').classList.toggle('is-muted', !visible[i]);
      $('[data-box="prediction"]').classList.toggle('is-muted', !visible[i]);
      $('[data-box="prediction"]').classList.toggle('is-waiting', !outputReady);
      $('[data-box="loss"]').classList.toggle('is-arrived', scored);
      [...root.querySelectorAll('.mechanism-stages span')].forEach((node, index) => node.classList.toggle('is-current', index === scene.phase));
      let caption;
      if (scene.kind === 'ask') caption = 'Today is unchanged. Does choosing it make its prediction count?';
      else if (scene.kind === 'setup') caption = 'Save originals; change input copies. “Chosen” is bookkeeping, not input.';
      else if (scene.kind === 'recap') caption = 'Changed input? Optional. Chosen target? Its prediction counts.';
      else if (scene.kind === 'boundary') caption = visible[i]
        ? '[SEP] supplies context but is not a target.'
        : 'PAD is blocked as a key, unlike [MASK].';
      else if (mask_sites[i]) caption = 'Input: [MASK]. Target: quiet. The saved original goes to the loss.';
      else if (random_sites[i]) caption = 'Input: bank. Target: rose. The target stays the original token.';
      else if (selected[i]) caption = scored ? 'Unchanged AND chosen: today still counts.'
        : 'Today stays visible and was chosen. Follow its prediction to the loss.';
      else caption = 'Bank is unchanged but not chosen. It supplies context, not a direct loss.';
      // Same rule as the kernel scene: a polite live region is written only when it changes,
      // and the beat guard above fires several times inside one scene.
      const captionNode = $('[data-caption]');
      if (captionNode.textContent !== caption) captionNode.textContent = caption;
      layout();
    }
    drawRays();
    return `Position ${i}, ${original[i]}: ${branch}`;
  }
  // The fixture never changes while the scene runs; serialise the inspectable copy once.
  root.dataset.ledgers = JSON.stringify(ledgers);
  root.dataset.corrupted = JSON.stringify(corrupted);
  root.dataset.original = JSON.stringify(original);
  window.BookPlayback(root, render, layout);
})();
