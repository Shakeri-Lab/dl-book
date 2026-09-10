// Book-sized adaptation of Chapter 7's PatchScore scene. No runtime dependencies.
// Immutable input and kernel are read from the static, accessible witness.
(() => {
  const root = document.getElementById('convolution-excerpt');
  if (!root || root.dataset.ready) return;
  const matrix = name => root.querySelector(`[data-matrix="${name}"]`);
  const cells = name => [...matrix(name).querySelectorAll(':scope > span')];
  const input = cells('input').map(cell => Number(cell.textContent));
  const kernel = cells('kernel').map(cell => Number(cell.textContent.replace('−', '-')));
  const positions = [[0, 0], [0, 1], [1, 1], [1, 0]];
  const productsAt = ([row, col]) => kernel.map((weight, i) =>
    weight * input[(row + Math.floor(i / 3)) * 4 + col + i % 3]);
  const sumAt = position => productsAt(position).reduce((sum, value) => sum + value, 0);
  const outputCells = cells('output');
  const productCells = cells('products');
  const play = root.querySelector('[data-action="play"]');
  const slider = root.querySelector('input[type="range"]');
  const caption = root.querySelector('.conv-excerpt__caption');
  const calculation = root.querySelector('.conv-excerpt__calculation');
  const stage = root.querySelector('.conv-excerpt__player');
  const speedControl = root.querySelector('[data-speed]');
  const grids = root.querySelector('.conv-excerpt__grids');
  const rays = root.querySelector('.conv-excerpt__rays');
  const fullscreen = root.querySelector('[data-action="fullscreen"]');
  const dialog = root.querySelector('.conv-excerpt__dialog');
  const notice = root.querySelector('.conv-excerpt__notice');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let step = 0;
  let time = 0;
  let speed = Number(speedControl.value);
  let playing = false;
  let frame = null;
  let anchorTime = 0;
  let anchorClock = 0;
  let drawnStep = -1;
  const lastStep = 15;
  const phaseSeconds = 2.5;
  const duration = (lastStep + 1) * phaseSeconds;
  const number = value => Object.is(value, -0) ? '0' : String(value);
  const formatTime = value => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
  // One declared duration fills the scrubber range, the printed clock, and the readout.
  slider.max = String(duration);
  root.querySelector('.conv-excerpt__controls [data-duration]').textContent = ` / ${formatTime(duration)}`;
  root.dataset.duration = String(duration);
  function labelButton(button, label) {
    button.setAttribute('aria-label', label);
    button.title = label;
    button.querySelector('.conv-excerpt__sr-only').textContent = label;
  }
  function advance(now) {
    time = Math.min(duration, anchorTime + Math.max(0, now - anchorClock) * speed / 1000);
  }
  function stop() {
    if (playing) advance(performance.now());
    playing = false;
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
    draw();
  }
  function drawStep() {
    const visit = Math.floor(step / 4), phase = step % 4;
    const [row, col] = positions[visit];
    const products = productsAt(positions[visit]);
    const sum = sumAt(positions[visit]);
    const written = phase >= 2 ? visit + 1 : visit;
    matrix('input').setAttribute('aria-label', phase === 3 && visit < 3
      ? `Input: four rows of 0, 0, 1, 1. Sliding from row ${row + 1}, column ${col + 1} to row ${positions[visit + 1][0] + 1}, column ${positions[visit + 1][1] + 1}; no new output is computed while moving.`
      : `Input: four rows of 0, 0, 1, 1. Selected patch begins at row ${row + 1}, column ${col + 1}.`);
    productCells.forEach((cell, i) => { cell.textContent = phase >= 1 ? number(products[i]) : '·'; });
    matrix('products').setAttribute('aria-label', phase >= 1
      ? `Nine products, by row: ${products.map(number).join(', ')}.` : 'Nine products, not computed yet.');
    outputCells.forEach((cell, i) => {
      const visitIndex = positions.findIndex(([r, c]) => r * 2 + c === i);
      const isWritten = visitIndex < written;
      cell.textContent = isWritten ? number(sumAt(positions[visitIndex])) : '·';
      cell.classList.toggle('is-written', isWritten);
      cell.classList.toggle('is-active', i === row * 2 + col);
    });
    matrix('output').setAttribute('aria-label', 'Output, by row: ' +
      outputCells.map(cell => cell.textContent === '·' ? 'not computed' : cell.textContent).join(', ') + '.');
    calculation.replaceChildren();
    if (phase >= 2) {
      products.forEach((value, i) => {
        if (i) calculation.append(' + ');
        const term = document.createElement('span');
        term.dataset.term = String(i);
        term.textContent = number(value);
        calculation.append(term);
      });
      calculation.append(' = ');
      const result = document.createElement('strong');
      result.textContent = number(sum);
      calculation.append(result);
    } else {
      const pixel = input[row * 4 + col + 2], weight = kernel[2];
      calculation.textContent = phase === 0 ? 'Select one patch before computing its score.'
        : `Traced pair: ${number(pixel)} × ${number(weight)} = ${number(products[2])}. The same rule applies at all nine positions.`;
    }
    const where = `row ${row + 1}, column ${col + 1}`;
    const captions = [
      `Place the window at ${where}. Only these nine input pixels contribute to the outlined output cell.`,
      `Follow the rays: input (${row + 1}, ${col + 3}) and kernel (1, 3) meet at ×, then reach product (1, 3). Predict the sum of all nine products.`,
      `All nine products, including zeros, feed the + point. The green ray writes their sum, ${number(sum)}, into the output at ${where}.`,
      visit === 3 ? 'Complete: every valid patch crosses the edge, so all four outputs are 4. The same local rule was reused everywhere.'
        : 'Keep the written output. Slide the window one pixel ' + (visit === 0 ? 'right.' : visit === 1 ? 'down.' : 'left.') + ' The next patch gets its own calculation.',
    ];
    caption.textContent = captions[phase];
    root.querySelectorAll('.conv-excerpt__stages span').forEach((node, i) => node.classList.toggle('is-current', i === phase));
    // The step is announced once, by the scrubber's aria-valuetext. No second label.
    root.dataset.step = String(step);
  }
  function drawRays() {
    rays.replaceChildren();
    const visit = Math.floor(step / 4), phase = step % 4;
    const [row, col] = positions[visit];
    const inputIndex = row * 4 + col + 2;
    for (const name of ['input', 'kernel', 'products']) {
      cells(name).forEach((cell, i) => cell.classList.toggle('is-component',
        phase === 1 && i === (name === 'input' ? inputIndex : 2)));
    }
    const hidden = !root.open || (phase !== 1 && phase !== 2);
    rays.toggleAttribute('hidden', hidden);
    if (hidden) return;
    const bounds = grids.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    rays.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    const box = element => {
      const r = element.getBoundingClientRect();
      return { left: r.left - bounds.left, right: r.right - bounds.left,
        top: r.top - bounds.top, bottom: r.bottom - bounds.top,
        x: (r.left + r.right) / 2 - bounds.left,
        y: (r.top + r.bottom) / 2 - bounds.top, width: r.width, height: r.height };
    };
    const node = (tag, attrs, parent = rays) => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
      Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, String(value)));
      parent.append(element);
      return element;
    };
    const defs = node('defs', {});
    // Knock out the text centers, so a ray can never obscure a matrix digit.
    const mask = node('mask', { id: 'convolution-ray-text', maskUnits: 'userSpaceOnUse',
      x: 0, y: 0, width: bounds.width, height: bounds.height }, defs);
    node('rect', { width: bounds.width, height: bounds.height, fill: 'white' }, mask);
    for (const name of ['input', 'kernel', 'products', 'output']) {
      cells(name).forEach(cell => {
        const r = box(cell), w = Math.min(22, r.width * .65), h = Math.min(24, r.height * .65);
        node('rect', { x: r.x - w / 2, y: r.y - h / 2, width: w, height: h, fill: 'black' }, mask);
      });
    }
    function ray(kind, from, to, d, term) {
      const attrs = { 'data-ray': kind, 'data-from': from, 'data-to': to,
        d, mask: 'url(#convolution-ray-text)' };
      if (term !== undefined) attrs['data-term'] = term;
      if (kind !== 'term') {
        const id = `convolution-arrow-${kind}`;
        const marker = node('marker', { id, viewBox: '0 0 10 10', refX: 9, refY: 5,
          markerWidth: 5, markerHeight: 5, orient: 'auto-start-reverse' }, defs);
        node('path', { d: 'M 0 0 L 10 5 L 0 10 Z', fill:
          kind === 'input' ? '#2b6cb0' : kind === 'output' ? '#2f855a' : '#263445' }, marker);
        attrs['marker-end'] = `url(#${id})`;
      }
      node('path', attrs);
    }
    function operation(name, symbol, x, y) {
      const group = node('g', { 'data-operation': name });
      node('circle', { cx: x, cy: y, r: 15 }, group);
      node('text', { x, y }, group).textContent = symbol;
    }
    const inputBox = box(matrix('input')), kernelBox = box(matrix('kernel'));
    const productBox = box(matrix('products'));
    const productCard = box(matrix('products').parentElement);
    const inputCard = box(matrix('input').parentElement);
    const outputCard = box(matrix('output').parentElement);
    const x = (productCard.right + outputCard.left) / 2;
    if (phase === 1) {
      // One stationary witness is legible at every speed; the sum uses all nine.
      const a = box(cells('input')[inputIndex]), b = box(cells('kernel')[2]);
      const p = box(productCells[2]);
      const y = (inputCard.bottom + productCard.top) / 2;
      const ax = inputBox.right + 5, bx = kernelBox.right + 5;
      ray('input', `input:${inputIndex}`, 'multiply',
        `M ${a.right - 4} ${a.bottom - 4} L ${ax} ${a.bottom - 4} L ${ax} ${y} L ${x - 16} ${y}`);
      ray('kernel', 'kernel:2', 'multiply',
        `M ${b.right - 4} ${b.bottom - 4} L ${bx} ${b.bottom - 4} L ${bx} ${y} L ${x + 16} ${y}`);
      ray('product', 'multiply', 'products:2',
        `M ${x} ${y + 16} L ${x} ${p.y} L ${p.right - 3} ${p.y}`);
      operation('multiply', '×', x, y);
    } else {
      const y = productBox.y;
      productCells.forEach((cell, i) => {
        const r = box(cell), endY = y + (i - 4) * 2;
        ray('term', `products:${i}`, 'sum',
          `M ${r.right - 4} ${r.bottom - 4} C ${productBox.right + 5} ${r.bottom - 4}, ${x - 20} ${endY}, ${x - 15} ${endY}`, i);
      });
      const out = box(outputCells[row * 2 + col]);
      ray('output', 'sum', `output:${row * 2 + col}`,
        `M ${x + 16} ${y} C ${outputCard.left} ${y}, ${out.left + 4} ${y}, ${out.left + 4} ${out.y}`);
      operation('sum', '+', x, y);
    }
  }
  function draw() {
    step = Math.min(lastStep, Math.floor(time / phaseSeconds));
    if (step !== drawnStep) { drawStep(); drawnStep = step; drawRays(); }
    const visit = Math.floor(step / 4), phase = step % 4;
    const [row, col] = positions[visit];
    const fraction = Math.min(1, (time - step * phaseSeconds) / phaseSeconds);
    // The moving window is visual only. Arithmetic changes at exact phase
    // boundaries, never at a fractional pixel, and Pause freezes both clocks.
    const blend = phase === 3 && visit < 3 && !reducedMotion.matches ? fraction : 0;
    const [nextRow, nextCol] = positions[Math.min(3, visit + 1)];
    const windowBox = root.querySelector('.conv-excerpt__window');
    windowBox.style.left = `${(col + (nextCol - col) * blend) * 25}%`;
    windowBox.style.top = `${(row + (nextRow - row) * blend) * 25}%`;
    slider.value = String(time);
    slider.setAttribute('aria-valuetext', `${formatTime(time)} of ${formatTime(duration)}. Step ${step + 1} of 16. ${['Place', 'Multiply', 'Sum', 'Slide'][phase]}. Patch ${visit + 1} of 4.`);
    root.querySelector('[data-elapsed]').textContent = formatTime(time);
    root.dataset.time = String(time);
    root.dataset.playing = String(playing);
    labelButton(play, playing ? 'Pause' : time === duration ? 'Replay' : 'Play');
    play.dataset.state = playing ? 'pause' : time === duration ? 'replay' : 'play';
  }
  function tick(now) {
    frame = null;
    if (!playing) return;
    advance(now);
    if (time >= duration) playing = false;
    draw();
    if (playing) frame = window.requestAnimationFrame(tick);
  }
  function start() {
    if (playing || !root.open || document.hidden) return;
    if (time >= duration) time = 0;
    playing = true;
    anchorTime = time;
    anchorClock = performance.now();
    draw();
    frame = window.requestAnimationFrame(tick);
  }
  function togglePlay() { if (playing) stop(); else start(); }
  function seek(value) {
    stop();
    time = Math.max(0, Math.min(duration, Number.isFinite(value) ? value : 0));
    draw();
  }
  play.addEventListener('click', togglePlay);
  slider.addEventListener('input', () => seek(Number(slider.value)));
  speedControl.addEventListener('change', () => {
    if (playing) advance(performance.now());
    anchorTime = time;
    anchorClock = performance.now();
    speed = [0.5, 1, 1.5, 2].includes(Number(speedControl.value)) ? Number(speedControl.value) : 1;
    speedControl.value = String(speed);
    if (time >= duration) stop(); else draw();
  });
  const nativeFullscreen = typeof stage.requestFullscreen === 'function' && document.fullscreenEnabled !== false;
  fullscreen.hidden = false;
  labelButton(fullscreen, nativeFullscreen ? 'Fullscreen' : 'Expand');
  function expand() {
    dialog.append(stage);
    stage.classList.add('is-expanded');
    try { dialog.showModal(); }
    catch (error) {
      dialog.before(stage);
      stage.classList.remove('is-expanded');
      throw error;
    }
    labelButton(fullscreen, 'Exit expanded view');
    fullscreen.dataset.state = 'contract';
    drawRays();
  }
  dialog.addEventListener('close', () => {
    stop();
    dialog.before(stage);
    stage.classList.remove('is-expanded');
    labelButton(fullscreen, nativeFullscreen ? 'Fullscreen' : 'Expand');
    fullscreen.dataset.state = 'expand';
    drawRays();
    if (root.open) fullscreen.focus();
  });
  dialog.addEventListener('cancel', stop);
  fullscreen.addEventListener('click', async () => {
    notice.textContent = '';
    try {
      if (dialog.open) dialog.close();
      else if (document.fullscreenElement === stage) await document.exitFullscreen();
      else if (nativeFullscreen) await stage.requestFullscreen();
      else expand();
    } catch (_) {
      notice.textContent = 'Fullscreen is unavailable in this browser window. You can still play and resize the diagram on the page.';
    }
  });
  let wasFullscreen = false;
  document.addEventListener('fullscreenchange', () => {
    const active = document.fullscreenElement === stage;
    labelButton(fullscreen, active ? 'Exit fullscreen' : nativeFullscreen ? 'Fullscreen' : 'Expand');
    fullscreen.dataset.state = active ? 'contract' : 'expand';
    if (wasFullscreen && !active) stop();
    wasFullscreen = active;
    drawRays();
  });
  root.addEventListener('toggle', () => {
    if (!root.open) {
      stop();
      if (dialog.open) dialog.close();
      if (document.fullscreenElement === stage) document.exitFullscreen().catch(() => {});
    }
    drawRays();
  });
  root.addEventListener('keydown', event => { if (event.key === 'Escape') stop(); });
  stage.addEventListener('keydown', event => {
    // Native controls retain their own keys; shortcuts apply only to the player.
    if (event.target !== stage || event.altKey || event.ctrlKey || event.metaKey) return;
    if ([' ', 'k', 'K', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      if (event.repeat && [' ', 'k', 'K'].includes(event.key)) return;
      if ([' ', 'k', 'K'].includes(event.key)) togglePlay();
      else seek(event.key === 'Home' ? 0 : event.key === 'End' ? duration
        : time + (event.key === 'ArrowLeft' ? -phaseSeconds : phaseSeconds));
    }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', stop);
  reducedMotion.addEventListener('change', draw);
  // Recompute only on phase or layout changes, never continuously while paused.
  if (typeof ResizeObserver === 'function') new ResizeObserver(drawRays).observe(grids);
  window.addEventListener('resize', drawRays);
  // No clock or motion starts until Play is explicitly requested.
  root.querySelector('.conv-excerpt__controls').hidden = false;
  root.querySelector('.conv-excerpt__timeline').hidden = false;
  root.querySelector('.conv-excerpt__keyboard').hidden = false;
  root.dataset.ready = 'true';
  draw();
  stop();
})();
