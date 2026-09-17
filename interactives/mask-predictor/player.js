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
  // The captions name the audit's two counts in words; refuse a fixture they would misdescribe.
  if (active[0].length !== 3 || active[1].length !== 4) throw Error('mask-predictor captions expect three and four scored targets');
  // Fixture-only facts are published once, at mount, never per frame.
  root.dataset.activePredictors = JSON.stringify(active);
  root.dataset.excludedPredictors = JSON.stringify(excluded);
  root.dataset.counts = active.map(row => row.length).join(' ');
  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = $('[data-drawing]'), formula = $('[data-formula]'), caption = $('[data-caption]');
  const beats = pane.dataset.beats.split(/\s+/).map(Number);
  const stages = ['Predict', 'One-slot shift', 'Open gate', 'Earlier response', 'Excluded outputs', 'Score check', 'Prompt boundary', 'Summary'];
  const captions = [
    'Does the predictor at the last prompt slot contribute to the response score?',
    'Each output reads the whole prefix through its slot. Its next target sits below and supplies the mask.',
    'Sequence A: the last prompt predictor scores “birds”, the first response target. Three targets count.',
    'Sequence B starts its response earlier, so four targets count. Slot 0 still predicts a prompt token.',
    'Change only excluded outputs. The inputs, targets, masks, and included scores stay fixed.',
    'Each changed output is multiplied by zero and stops at its gate. Neither sequence score changes.',
    'The last prompt predictor counts because its next target belongs to the response.',
    'Inputs stay available as context. Target masks select which log-probabilities enter the sum.'
  ];
  // The picture is described once, without the caption's sentence or any earned number.
  const pictures = [
    'six input slots; a marker rests under the last prompt slot.',
    'each slot’s output sits above its next target and that target’s mask gate; open gates feed the score row. A marker follows one output.'
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
  const rails = [0,1].map(j => add('line', {class: 'mp-rail', 'data-score-rail': String(j)}));
  const rows = tokens.map((row, b) => {
    const group = add('g', {'data-row': String(b)});
    const inputs = row.slice(0, -1).map((token, i) => {
      const cell = add('g', {'data-token-slot': `${b}:${i}`}, '', group);
      const role = label(`${i < masks[b].indexOf(1) ? 'prompt' : 'response'} ${i}`, 'mp-label', 12, cell);
      const rect = add('rect', {class: 'mp-token', rx: 4}, '', cell);
      const text = add('text', {class: 'mp-input', 'font-size': 14, 'text-anchor': 'middle',
        'data-token': String(token), 'data-token-label': ''}, labels[token], cell);
      return {cell, role, rect, text};
    });
    const predictors = row.slice(0, -1).map((_, i) => {
      const included = Boolean(masks[b][i + 1]);
      const g = add('g', {'data-predictor': `${b}:${i}`, 'data-target-slot': String(i + 1),
        'data-included': String(included), class: included ? 'mp-included' : 'mp-excluded'}, '', group);
      const wire = add('line', {class: 'mp-wire'}, '', g);
      const wireHead = add('path', {class: 'mp-output'}, '', g);
      const outputBox = add('rect', {class: 'mp-output-box', rx: 4, 'data-output-box': `${b}:${i}`}, '', g);
      const output = add('text', {class: 'mp-output', 'font-size': 12, 'text-anchor': 'middle',
        'data-output-symbol': `${b}:${i}`}, 'log prob', g);
      // A supplied target selects a score; it is not emitted by the model.
      const targetWire = add('line', {class: 'mp-target-wire'}, '', g);
      const targetHead = add('path', {class: 'mp-target'}, '', g);
      const target = add('g', {'data-shifted-target': `${b}:${i + 1}`}, '', g);
      const targetBox = add('rect', {class: 'mp-target-box', rx: 4}, '', target);
      const targetText = add('text', {class: 'mp-target', 'font-size': 14, 'text-anchor': 'middle',
        'data-target-token': String(row[i + 1]), 'data-target-label': ''}, labels[row[i + 1]], target);
      const gate = add('text', {class: 'mp-gate', 'font-size': 14, 'text-anchor': 'middle',
        'data-target-mask': `${b}:${i + 1}`}, `× ${masks[b][i + 1]}`, target);
      // An open gate's route runs on into the score rail; a closed gate's route ends at a stop bar.
      const path = add('path', {class: 'mp-route', 'data-next-route': `${b}:${i}`}, '', g);
      const end = add('path', {class: included ? 'mp-output' : 'mp-stop', 'data-gate-end': included ? 'open' : 'stop'}, '', g);
      return {group:g, wire, wireHead, outputBox, output, targetWire, targetHead,
        target, targetBox, targetText, gate, path, end};
    });
    return {group, inputs, predictors};
  });
  const rowLabels = [0,1].map(() => ({input:label('input'), target:label('target'), given:label('(given)'), score:label('score')}));
  const countA = add('text', {class:'mp-target', 'font-size':14, 'data-value':'count-a'}, `A: ${active[0].length}`);
  const countB = add('text', {class:'mp-target', 'font-size':14, 'data-value':'count-b'}, `B: ${active[1].length}`);
  const countLabel = label('scored targets');
  const change = label('0', 'mp-ink', 22);
  change.dataset.value = 'change';
  const changeLabel = label('change in either score');
  // The one tracked object: a marker that carries one output to its gate, and on if the gate is open.
  const packet = add('g', {'data-packet': ''});
  add('circle', {class: 'mp-packet-ring', r: 6.5}, '', packet);
  const core = add('circle', {class: 'mp-packet-core', r: 3}, '', packet);
  const stops = ['input', 'output', 'gate', 'score'];
  const where = ['under the input', 'beside the output', 'at the gate', 'in the score row'];
  // Its itinerary, as [time, stop] keys: equal neighbours rest, different neighbours glide, and
  // every glide that leads into a beat finishes on it. Sequence B is on screen for beats 3 to 5.
  const lastPrompt = active[0][0], earlierPrompt = excluded[1][0];
  const itinerary = [
    {until: beats[3], row: 0, slot: lastPrompt, keys: [[0,0], [beats[2]-3,0], [beats[2]-2.1,1],
      [beats[2]-1.6,1], [beats[2],2], [beats[2]+1.8,2], [beats[2]+3,3], [beats[3],3]]},
    {until: beats[6], row: 1, slot: earlierPrompt, keys: [[beats[3],0], [beats[4]-1.2,0], [beats[4],1],
      [beats[5]-2.5,1], [beats[5],2], [beats[6],2]]},
    {until: Infinity, row: 0, slot: lastPrompt, keys: [[beats[6],1], [beats[7]-2.5,1], [beats[7],3],
      [Number(pane.dataset.duration),3]]}
  ];
  let width = 713, narrow = false, height = 302, last = 0, reduced = false, tracks = [];
  const px = value => Number(value.toFixed(4));
  function geometry(i) {
    const columns = narrow ? 3 : 6, left = 44, step = (width-left-6)/columns;
    const x = left+step*((i%columns)+.5), y = 32+Math.floor(i/columns)*200, cell = Math.min(66,step-15);
    return {x, y, step, cell, output:Math.min(60,step-17), elbow:x+step/2-4, pass:x+cell/2-12, gate:y+152, rail:y+182};
  }
  // The marker's road through one column: input port, output, dogleg, gate, and the drop to the rail.
  function track(i) {
    const g = geometry(i), out = Math.min(g.x+g.output/2+8, g.elbow);
    const points = [[g.x,g.y+54], [g.x,g.y+82], [out,g.y+82], [g.elbow,g.y+82], [g.elbow,g.gate],
      [g.pass+9,g.gate], [g.pass,g.gate], [g.pass,g.rail]];
    const along = [0];
    for (let k=1;k<points.length;k++) along.push(along[k-1]+Math.abs(points[k][0]-points[k-1][0])+Math.abs(points[k][1]-points[k-1][1]));
    return {points, along, stop:[along[0], along[2], along[5], along[7]]};
  }
  function place(road, s) {
    let k = 1; while (k < road.points.length-1 && s > road.along[k]) k++;
    const span = road.along[k]-road.along[k-1], u = span ? (s-road.along[k-1])/span : 1;
    const [ax,ay] = road.points[k-1], [bx,by] = road.points[k];
    return [px(ax+(bx-ax)*u), px(ay+(by-ay)*u)];
  }
  function measure() {
    width = Math.max(240,figure.getBoundingClientRect().width || 713);
    narrow = width<520; height = narrow ? 502 : 302;
    root.dataset.layout = narrow ? 'narrow' : 'wide';
  }
  // Everything that depends only on the fixture and the pane width is laid out here, once per width.
  function layout() {
    attrs(svg,{viewBox:`0 0 ${width} ${height}`}); attrs(title,{x:width/2,y:20});
    rows.forEach((r,b) => {
      r.inputs.forEach((cell,i) => {
        const {x,y,cell:w} = geometry(i);
        attrs(cell.role,{x,y:y+12}); attrs(cell.rect,{x:x-w/2,y:y+19,width:w,height:26}); attrs(cell.text,{x,y:y+37});
      });
      r.predictors.forEach((p,i) => {
        const {x,y,cell:w,output:ow,elbow,pass,gate,rail} = geometry(i), included = Boolean(masks[b][i+1]);
        attrs(p.wire,{x1:x,x2:x,y1:y+47,y2:y+66});
        attrs(p.wireHead,{d:`M ${x-3} ${y+64} L ${x} ${y+70} L ${x+3} ${y+64} Z`});
        attrs(p.outputBox,{x:x-ow/2,y:y+70,width:ow,height:24}); attrs(p.output,{x,y:y+86});
        attrs(p.targetWire,{x1:x,x2:x,y1:y+116,y2:y+100});
        attrs(p.targetHead,{d:`M ${x-3} ${y+104} L ${x} ${y+97} L ${x+3} ${y+104} Z`});
        attrs(p.targetBox,{x:x-w/2,y:y+118,width:w,height:47});
        attrs(p.targetText,{x,y:y+136}); attrs(p.gate,{x:x-w/2+22,y:y+157});
        attrs(p.path,{d:`M ${x+ow/2+1} ${y+82} H ${elbow} V ${gate} H ${pass}${included ? ` V ${rail-6}` : ''}`});
        attrs(p.end,{d:included ? `M ${pass-3.5} ${rail-7} L ${pass} ${rail-1} L ${pass+3.5} ${rail-7} Z`
          : `M ${pass} ${gate-6} V ${gate+6}`});
      });
    });
    [0,1].forEach(j => {
      const first = geometry(narrow ? 3*j : 0), end = geometry(narrow ? 3*j+2 : 5), r = rowLabels[j];
      attrs(rails[j],{x1:first.x-first.cell/2,x2:end.x+end.cell/2,y1:first.rail,y2:first.rail});
      attrs(r.input,{x:20,y:first.y+36}); attrs(r.target,{x:20,y:first.y+138}); attrs(r.given,{x:20,y:first.y+153});
      attrs(r.score,{x:20,y:first.rail+4});
    });
    const receiptY = height-55;
    attrs(countLabel,{x:width/2-52,y:receiptY}); attrs(countA,{x:width/2+2,y:receiptY}); attrs(countB,{x:width/2+48,y:receiptY});
    attrs(change,{x:width/2,y:height-28}); attrs(changeLabel,{x:width/2,y:height-10});
    tracks = itinerary.map(leg => track(leg.slot)); drawn = -1;
  }
  // What a beat changes, written when the beat (or the layout) changes and not once per frame.
  let drawn = -1;
  function scene(stage, sequence) {
    attrs(svg,{'aria-label':`Sequence ${'AB'[sequence]}: ${pictures[Math.min(stage,1)]}`});
    root.dataset.sequence = 'AB'[sequence]; root.dataset.stage = String(stage);
    root.dataset.scoreChange = stage>=5 ? '0' : 'unrevealed';
    root.dataset.perturbation = stage>=4 ? 'excluded-output-logits-only' : 'none';
    title.textContent = `Sequence ${'AB'[sequence]}`;
    rows.forEach((r,b) => {
      show(r.group,b===sequence);
      r.predictors.forEach((p,i) => {
        // A held step change, not a pulse: the altered outputs are relabelled and stay that way.
        const changed = !masks[b][i+1] && stage>=4;
        show(p.group,stage>=1);
        attrs(p.outputBox,{'stroke-width':changed ? 2.2 : 1.3});
        p.output.textContent = changed ? 'changed' : 'log prob';
        p.output.dataset.state = changed ? 'changed' : 'original';
      });
    });
    rowLabels.forEach((r,j) => {
      const on = j===0||narrow;
      show(r.input,on); show(r.target,stage>=1&&on); show(r.given,stage>=1&&on); show(r.score,stage>=1&&on);
      show(rails[j],stage>=1&&on);
    });
    show(countLabel,stage>=2); show(countA,stage>=2); show(countB,stage>=3);
    show(change,stage>=5); show(changeLabel,stage>=5);
    formula.classList.toggle('mp-shown',stage>=1);
    formula.classList.toggle('mp-mask-lit',stage===1||stage>=4);
    formula.classList.toggle('mp-logp-lit',stage>=2&&stage<=3);
    if (caption.textContent!==captions[stage]) caption.textContent=captions[stage];
  }
  function render(time, reduceMotion) {
    last = time; reduced = reduceMotion;
    const stage = beats.reduce((s,beat,i) => time>=beat ? i : s,0);
    const held = reduceMotion ? beats[stage] : time;
    const sequence = stage>=3 && stage<=5 ? 1 : 0;
    if (stage!==drawn) { scene(stage,sequence); drawn = stage; }
    // Per frame, only the marker: where it is on its itinerary now.
    const at = itinerary.findIndex(leg => held<leg.until), leg = itinerary[at], road = tracks[at];
    let k = 0; while (k<leg.keys.length-2 && held>=leg.keys[k+1][0]) k++;
    const [t0,a] = leg.keys[k], [t1,b] = leg.keys[k+1];
    const u = Math.max(0,Math.min(1,(held-t0)/(t1-t0))), ease = u*u*(3-2*u);
    const [cx,cy] = place(road, road.stop[a]+(road.stop[b]-road.stop[a])*ease);
    const resting = a===b || u===0 ? a : u===1 ? b : -1;
    const blocked = resting===2 && !masks[leg.row][leg.slot+1];
    attrs(packet,{transform:`translate(${cx} ${cy})`,'data-slot':`${leg.row}:${leg.slot}`,
      'data-at':resting<0 ? 'moving' : stops[resting],'data-state':blocked ? 'blocked' : 'carried'});
    show(core,!blocked);
    return `${stages[stage]}. Sequence ${'AB'[sequence]}; marker ${resting<0 ? 'moving' : blocked ? 'stopped at the gate' : where[resting]}.`;
  }
  const typeset = () => {
    const done = () => { root.dataset.typeset=root.querySelector('mjx-container') ? 'mathjax' : 'none'; };
    if (window.MathJax && typeof window.MathJax.typesetPromise==='function' && !root.querySelector('mjx-container')) {
      window.MathJax.typesetPromise([root]).then(done,done);
    } else done();
  };
  measure(); layout();
  window.BookPlayback(root,render,() => { measure(); layout(); render(last,reduced); }); typeset();
})();
