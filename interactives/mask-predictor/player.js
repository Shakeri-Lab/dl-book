// Exact Chapter 18 fixture, with illustrative word aliases. No model is executed.
(() => {
  const root = document.getElementById('mask-predictor-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  const numbers = name => root.dataset[name].trim().split(/\s+/).map(Number);
  const tokens = [numbers('tokensA'), numbers('tokensB')];
  const masks = [numbers('maskA'), numbers('maskB')];
  const labels = root.dataset.tokenLabels.split('|');
  if (tokens.some(row => row.length !== 7 || row.some(id => !labels[id])) ||
      masks.some(row => row.length !== 7 || row.some(x => x !== 0 && x !== 1))) {
    throw Error('mask-predictor requires two seven-token rows, aliases and Boolean target masks');
  }
  const active = masks.map(row => row.slice(1).flatMap((mask, i) => mask ? [i] : []));
  const excluded = masks.map(row => row.slice(1).flatMap((mask, i) => mask ? [] : [i]));
  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = $('[data-drawing]'), formula = $('[data-formula]'), caption = $('[data-caption]');
  const beats = pane.dataset.beats.split(/\s+/).map(Number);
  const stages = ['Predict', 'One-slot shift', 'Sequence A', 'Sequence B', 'Excluded outputs', 'Zero change', 'Prompt boundary', 'Summary'];
  const captions = [
    'Does the predictor at the last prompt slot contribute to the response score?',
    'Align each predictor with its next target. The target supplies the mask.',
    'Sequence A: the last prompt predictor scores “birds”, the first response target.',
    'Sequence B starts its response earlier, so four target terms count.',
    'Change only excluded outputs. The inputs, targets, masks, and included scores stay fixed.',
    'The sequence scores do not change: each altered log-probability is multiplied by zero.',
    'The last prompt predictor counts because its next target belongs to the response.',
    'Inputs stay available as context. Target masks select which log-probabilities enter the sum.'
  ];
  const NS = 'http://www.w3.org/2000/svg';
  const add = (tag, values = {}, text = '', parent = drawing) => {
    const node = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(values)) node.setAttribute(key, value);
    if (text) node.textContent = text;
    parent.append(node); return node;
  };
  const attrs = (node, values) => {
    for (const [key, value] of Object.entries(values)) node.setAttribute(key, String(value));
  };
  const show = (node, on) => on ? node.removeAttribute('hidden') : node.setAttribute('hidden', '');
  const label = (text, cls = 'mp-label', size = 12, parent = drawing) =>
    add('text', {class: cls, 'font-size': size, 'text-anchor': 'middle'}, text, parent);
  drawing.replaceChildren();
  svg.querySelector('[data-static-frame="narrow"]')?.remove();
  const title = label('Sequence A', 'mp-ink', 16);
  const prefix = label('Each output uses the prefix through its input slot.', 'mp-label', 12);
  const rows = tokens.map((row, b) => {
    const group = add('g', {'data-row': String(b)});
    const inputs = row.slice(0, -1).map((token, i) => {
      const cell = add('g', {'data-token-slot': `${b}:${i}`}, '', group);
      const index = label(String(i), 'mp-label', 12, cell);
      const rect = add('rect', {class: 'mp-token', rx: 4}, '', cell);
      const text = add('text', {class: 'mp-input', 'font-size': 14, 'text-anchor': 'middle',
        'data-token': String(token), 'data-token-label': ''}, labels[token], cell);
      const role = label(i < masks[b].indexOf(1) ? 'prompt' : 'response', 'mp-label', 12, cell);
      return {cell, index, rect, text, role};
    });
    const predictors = row.slice(0, -1).map((_, i) => {
      const included = Boolean(masks[b][i + 1]);
      const g = add('g', {'data-predictor': `${b}:${i}`, 'data-target-slot': String(i + 1),
        'data-included': String(included), class: included ? 'mp-included' : 'mp-excluded'}, '', group);
      const wire = add('line', {class: 'mp-wire'}, '', g);
      const wireHead = add('path', {class: 'mp-output'}, '', g);
      const outputBox = add('rect', {class: 'mp-output-box', rx: 4, 'data-output-box': `${b}:${i}`}, '', g);
      const output = add('text', {class: 'mp-output', 'font-size': 12, 'text-anchor': 'middle',
        'data-output-symbol': `${b}:${i}`}, 'log-prob.', g);
      // A supplied target selects a score; it is not emitted by the model.
      const targetWire = add('line', {class: 'mp-target-wire'}, '', g);
      const targetHead = add('path', {class: 'mp-target'}, '', g);
      const target = add('g', {'data-shifted-target': `${b}:${i + 1}`}, '', g);
      const targetBox = add('rect', {class: 'mp-target-box', rx: 4}, '', target);
      const targetText = add('text', {class: 'mp-target', 'font-size': 14, 'text-anchor': 'middle',
        'data-target-token': String(row[i + 1]), 'data-target-label': ''}, labels[row[i + 1]], target);
      const gate = add('text', {class: 'mp-gate', 'font-size': 14, 'text-anchor': 'middle',
        'data-target-mask': `${b}:${i + 1}`}, `× ${masks[b][i + 1]}`, target);
      const path = add('path', {class: 'mp-route', 'data-next-route': `${b}:${i}`}, '', g);
      const head = add('path', {class: 'mp-output'}, '', g);
      return {group:g, wire, wireHead, outputBox, output, targetWire, targetHead,
        target, targetBox, targetText, gate, path, head};
    });
    return {group, inputs, predictors};
  });
  const rowLabels = [0,1].map(() => ({input:label('input'), target:label('target'), given:label('(given)')}));
  const countA = add('text', {class:'mp-target', 'font-size':14, 'data-value':'count-a'}, 'A: 3');
  const countB = add('text', {class:'mp-target', 'font-size':14, 'data-value':'count-b'}, 'B: 4');
  const countLabel = label('scored targets');
  const change = label('0', 'mp-error', 22);
  change.dataset.value = 'change';
  const changeLabel = label('change in either score');
  const focus = add('rect', {class:'mp-focus', rx:5, 'data-focus-pair':''});
  const focusDot = add('circle', {r:3, fill:'#232d4b', 'data-moving-pair':''});
  let width = 713, narrow = false, height = 302, last = 0, reduced = false;
  function geometry(i) {
    const columns = narrow ? 3 : 6, left = 44, step = (width-left-6)/columns;
    return {x:left+step*((i%columns)+.5), y:50+Math.floor(i/columns)*180,
      step, cell:Math.min(66,step-15), output:Math.min(60,step-17)};
  }
  function measure() {
    width = Math.max(240,figure.getBoundingClientRect().width || 713);
    narrow = width<520; height = narrow ? 482 : 302;
    root.dataset.layout = narrow ? 'narrow' : 'wide';
  }
  function render(time, reduceMotion) {
    last = time; reduced = reduceMotion;
    const stage = beats.reduce((s,beat,i) => time>=beat ? i : s,0);
    const held = reduceMotion ? beats[stage] : time;
    const sequence = stage>=3 && stage<=5 ? 1 : 0;
    attrs(svg,{viewBox:`0 0 ${width} ${height}`, 'aria-label':`${captions[stage]} Sequence ${'AB'[sequence]}.`});
    root.dataset.sequence = 'AB'[sequence]; root.dataset.stage = String(stage);
    root.dataset.activePredictors = JSON.stringify(active);
    root.dataset.excludedPredictors = JSON.stringify(excluded);
    root.dataset.counts = active.map(row=>row.length).join(' ');
    root.dataset.scoreChange = stage>=5 ? '0' : 'unrevealed';
    root.dataset.perturbation = stage>=4 ? 'excluded-output-logits-only' : 'none';
    title.textContent = `Sequence ${'AB'[sequence]}`;
    attrs(title,{x:width/2,y:20}); attrs(prefix,{x:width/2,y:39});
    prefix.textContent = narrow ? 'Each output uses the prefix so far.' : 'Each output uses the prefix through its input slot.';
    rows.forEach((r,b) => {
      show(r.group,b===sequence);
      r.inputs.forEach((cell,i) => {
        const {x,y,cell:w} = geometry(i);
        attrs(cell.index,{x,y:y+12}); attrs(cell.rect,{x:x-w/2,y:y+19,width:w,height:26});
        attrs(cell.text,{x,y:y+37}); attrs(cell.role,{x,y:y+58});
      });
      r.predictors.forEach((p,i) => {
        const {x,y,cell:w,output:ow,step} = geometry(i), included = Boolean(masks[b][i+1]);
        show(p.group,stage>=1);
        const changed = !included && stage>=4;
        const pulse = stage===4 && changed ? .7*(1+Math.sin((held-beats[4])*3)) : 0;
        attrs(p.wire,{x1:x,x2:x,y1:y+61,y2:y+71});
        attrs(p.wireHead,{d:`M ${x-3} ${y+68} L ${x} ${y+74} L ${x+3} ${y+68} Z`});
        attrs(p.outputBox,{x:x-ow/2,y:y+74,width:ow,height:24,'stroke-width':(changed ? 2+pulse : 1.3).toFixed(3)});
        attrs(p.output,{x,y:y+90}); p.output.textContent = changed ? 'changed' : 'log-prob.';
        p.output.dataset.state = changed ? 'changed' : 'original';
        attrs(p.targetWire,{x1:x,x2:x,y1:y+120,y2:y+104});
        attrs(p.targetHead,{d:`M ${x-3} ${y+108} L ${x} ${y+101} L ${x+3} ${y+108} Z`});
        attrs(p.targetBox,{x:x-w/2,y:y+122,width:w,height:47});
        attrs(p.targetText,{x,y:y+140}); attrs(p.gate,{x,y:y+161});
        const elbow = x+step/2-3;
        attrs(p.path,{d:`M ${x+ow/2+1} ${y+86} H ${elbow} V ${y+156} H ${x+19}`});
        attrs(p.head,{d:`M ${x+22} ${y+153} L ${x+17} ${y+156} L ${x+22} ${y+159} Z`});
      });
    });
    rowLabels.forEach((r,j) => {
      const y=50+180*j;
      attrs(r.input,{x:20,y:y+36}); attrs(r.target,{x:20,y:y+139}); attrs(r.given,{x:20,y:y+155});
      show(r.input,j===0||narrow); show(r.target,stage>=1&&(j===0||narrow)); show(r.given,stage>=1&&(j===0||narrow));
    });
    const receiptY=height-55;
    attrs(countLabel,{x:width/2-52,y:receiptY}); attrs(countA,{x:width/2+2,y:receiptY}); attrs(countB,{x:width/2+48,y:receiptY});
    show(countLabel,stage>=2); show(countA,stage>=2); show(countB,stage>=3);
    attrs(change,{x:width/2,y:height-28}); attrs(changeLabel,{x:width/2,y:height-10});
    show(change,stage>=5); show(changeLabel,stage>=5);
    const focusOn = stage===1||stage===2||stage===3||stage===6;
    const i=active[sequence][0], {x,y,cell:w}=geometry(i);
    attrs(focus,{x:x-w/2-3,y:y+70,width:w+6,height:102});
    const phase = stage===1 ? Math.max(0,Math.min(1,(held-beats[1])/3)) : 1;
    attrs(focusDot,{cx:x,cy:y+119-17*phase}); show(focus,focusOn); show(focusDot,focusOn);
    root.dataset.focusPair = focusOn ? `${sequence}:${i}->${i+1}` : 'none';
    formula.classList.toggle('mp-shown',stage>=1);
    formula.classList.toggle('mp-mask-lit',stage===1||stage>=4);
    formula.classList.toggle('mp-logp-lit',stage>=2&&stage<=3);
    if (caption.textContent!==captions[stage]) caption.textContent=captions[stage];
    return `${stages[stage]}. ${stage>=3 ? 'Three and four scored targets.' : ''}${stage>=5 ? ' Zero score change.' : ''}`;
  }
  const typeset = () => {
    const done = () => { root.dataset.typeset=root.querySelector('mjx-container') ? 'mathjax' : 'none'; };
    if (window.MathJax && typeof window.MathJax.typesetPromise==='function' && !root.querySelector('mjx-container')) {
      window.MathJax.typesetPromise([root]).then(done,done);
    } else done();
  };
  measure(); window.BookPlayback(root,render,() => { measure(); render(last,reduced); }); typeset();
})();
