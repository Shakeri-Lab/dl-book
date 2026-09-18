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
  // A token's role is its own mask entry spelt as a word: response where the mask is one,
  // prompt before the response, padding after it. The role belongs to the token, not to a slot.
  const roles = masks.map(row => row.map((mask, k) => mask ? 'response' : k < row.indexOf(1) ? 'prompt' : 'padding'));
  // Fixture-only facts are published once, at mount, never per frame.
  root.dataset.activePredictors = JSON.stringify(active);
  root.dataset.excludedPredictors = JSON.stringify(excluded);
  root.dataset.counts = active.map(row => row.length).join(' ');
  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = $('[data-drawing]'), formula = $('[data-formula]'), caption = $('[data-caption]');
  const beats = pane.dataset.beats.split(/\s+/).map(Number), duration = Number(pane.dataset.duration);
  const stages = ['Predict', 'One-slot slide', 'Open gate', 'Earlier response', 'Excluded outputs', 'Score check', 'Prompt boundary', 'Summary'];
  const captions = [
    'Does the predictor at the last prompt slot contribute to the response score?',
    'Targets are a copy of the tokens slid one slot left, roles attached. Each slot must predict the next token.',
    'The mask rides on the target: “birds” is a response token, so prompt slot 2 is scored. Three targets count.',
    'Sequence B’s response starts one slot earlier. The same slide scores four targets; slot 0 still predicts a prompt token.',
    'Change only excluded outputs. The inputs, targets, masks, and included scores stay fixed.',
    'Each changed output is multiplied by zero and stops at its gate. Neither sequence score changes.',
    'The last prompt predictor counts because its next target belongs to the response.',
    'Inputs stay available as context. Target masks select which log-probabilities enter the sum.'
  ];
  // The picture is described once, without the caption's sentence, an earned number, or the answer.
  const pictures = [
    'six input slots, each token tagged with its role and feeding an output; a marker rests under the last prompt slot.',
    'a copy of the tokens, role tags attached, sits below the outputs and slides one slot to the left.',
    'each slot’s output sits above its next target; the target’s own role tag sets its gate, and open gates feed the score row. A marker follows one output.'
  ];
  const NS = 'http://www.w3.org/2000/svg';
  const add = (tag, values = {}, text = '', parent = drawing) => {
    const node = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(values)) node.setAttribute(key, value);
    if (text) node.textContent = text;
    parent.append(node); return node;
  };
  // Every coordinate is serialised at four decimals at most, whatever the pane width.
  const attrs = (node, values) => {
    for (const [key, value] of Object.entries(values))
      node.setAttribute(key, String(value).replace(/-?\d+\.\d{5,}(?:e-?\d+)?/g, number => String(Number(Number(number).toFixed(4)))));
  };
  const show = (node, on) => on ? node.removeAttribute('hidden') : node.setAttribute('hidden', '');
  const label = (text, cls = 'mp-label', size = 12, parent = drawing) =>
    add('text', {class: cls, 'font-size': size, 'text-anchor': 'middle'}, text, parent);
  // Heights inside one strip, measured from the strip's top.
  const Y = {slot: 12, input: 18, card: 36, word: 15, role: 30, rest: 65, output: 76, outputH: 24,
    target: 122, gated: 54, gateText: 47, gate: 43, rail: 192, pitch: 208};
  drawing.replaceChildren();
  svg.querySelector('[data-static-frame="narrow"]')?.remove();
  const title = label('Sequence A', 'mp-ink', 16);
  // The target tape slides under a bezel: a token that leaves the strip's left end is cut off there.
  const bezel = add('rect', {}, '', add('clipPath', {id: 'mask-predictor-tape-window'}));
  const rails = [0,1].map(j => add('line', {class: 'mp-rail', 'data-score-rail': String(j)}));
  const slotNumbers = Array.from({length: 6}, (_, i) => { const node = label(String(i)); node.dataset.slotNumber = String(i); return node; });
  // Phone wrap only: the return path from the left end of the second strip to the right end of the first.
  // It lies under the tape, so a travelling copy covers it rather than the other way round.
  const wrap = add('g', {'data-wrap-cue': ''});
  const wrapPath = add('path', {class: 'mp-wrap'}, '', wrap), wrapHead = add('path', {class: 'mp-wrap-head'}, '', wrap);
  // A token card is drawn around its own top-centre, so a copy of it can travel as one group:
  // the word and the role tag move together.
  const card = (parent, boxClass, wordClass, id, role, wordAttrs = {}) => {
    const rect = add('rect', {class: boxClass, rx: 4, y: 0, height: Y.card}, '', parent);
    const text = add('text', {class: wordClass, 'font-size': 14, 'text-anchor': 'middle', x: 0, y: Y.word, ...wordAttrs}, labels[id], parent);
    const tag = add('text', {class: `mp-role mp-role-${role}`, 'font-size': 12, 'text-anchor': 'middle', x: 0, y: Y.role,
      'data-role': role}, role, parent);
    return {rect, text, tag};
  };
  const rows = tokens.map((row, b) => {
    const group = add('g', {'data-row': String(b)});
    const inputs = row.slice(0, -1).map((token, i) => {
      const cell = add('g', {'data-token-slot': `${b}:${i}`}, '', group);
      return {cell, ...card(cell, 'mp-token', 'mp-input', token, roles[b][i], {'data-token': String(token), 'data-token-label': ''})};
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
      return {group: g, included, wire, wireHead, outputBox, output, targetWire, targetHead};
    });
    // The tape: one travelling copy of every token. Copy k starts under slot k and ends under
    // slot k − 1, where it is slot k − 1's target; the [PAD] copy has no slot to start under.
    const tape = add('g', {'data-tape': String(b), 'clip-path': 'url(#mask-predictor-tape-window)'}, '', group);
    const targets = row.slice(1).map((token, n) => {
      const k = n + 1, included = Boolean(masks[b][k]);
      const g = add('g', {'data-shifted-target': `${b}:${k}`, 'data-under-slot': String(n),
        class: included ? 'mp-included' : 'mp-excluded'}, '', tape);
      const parts = card(g, 'mp-ghost-box', 'mp-ghost', token, roles[b][k], {'data-target-token': String(token), 'data-target-label': ''});
      const gate = add('text', {class: 'mp-gate', 'font-size': 14, 'text-anchor': 'middle', y: Y.gateText,
        'data-target-mask': `${b}:${k}`}, `× ${masks[b][k]}`, g);
      return {group: g, k, gate, ...parts};
    });
    // A copy that leaves a strip by its left end: token 0 always, token 3 when the strips wrap.
    const leavers = [0, 3].map(k => {
      const g = add('g', {'data-leaving-copy': `${b}:${k}`}, '', tape);
      return {group: g, k, ...card(g, 'mp-ghost-box', 'mp-ghost', row[k], roles[b][k])};
    });
    // An open gate's route runs on into the score rail; a closed gate's route ends at a stop bar.
    const routes = predictors.map((p, i) => {
      const g = add('g', {'data-route': `${b}:${i}`, class: p.included ? 'mp-included' : 'mp-excluded'}, '', group);
      const path = add('path', {class: 'mp-route', 'data-next-route': `${b}:${i}`}, '', g);
      const end = add('path', {class: p.included ? 'mp-output' : 'mp-stop', 'data-gate-end': p.included ? 'open' : 'stop'}, '', g);
      return {group: g, path, end};
    });
    return {group, inputs, predictors, tape, targets, leavers, routes};
  });
  const rowLabels = [0,1].map(() => Object.fromEntries(Object.entries({slot: 'slot', input: 'input', copy: 'copy',
    target: 'target', given: '(given)', score: 'score'}).map(([name, text]) => {
    const node = label(text); node.dataset.rowLabel = name; return [name, node];
  })));
  const countA = add('text', {class:'mp-target', 'font-size':14, 'data-value':'count-a'}, `A: ${active[0].length}`);
  const countB = add('text', {class:'mp-target', 'font-size':14, 'data-value':'count-b'}, `B: ${active[1].length}`);
  const countLabel = label('scored targets');
  const change = label('0', 'mp-ink', 22);
  change.dataset.value = 'change';
  const changeLabel = label('change in either score');
  // The marker carries one output to its gate, and on into the score if the gate is open.
  const packet = add('g', {'data-packet': ''});
  add('circle', {class: 'mp-packet-ring', r: 6.5}, '', packet);
  const core = add('circle', {class: 'mp-packet-core', r: 3}, '', packet);
  const stops = ['input', 'output', 'gate', 'score'];
  const where = ['under the input', 'beside the output', 'at the gate', 'in the score row'];
  // Its itinerary, as [time, stop] keys: equal neighbours rest, different neighbours glide, and
  // every glide that leads into a beat finishes on it. Sequence B is on screen for beats 3 to 5.
  const lastPrompt = active[0][0], earlierPrompt = excluded[1][0];
  const itinerary = [
    {until: beats[3], row: 0, slot: lastPrompt, keys: [[0,0], [beats[2]+.4,0], [beats[2]+1.1,1],
      [beats[2]+2.3,2], [beats[2]+2.6,2], [beats[2]+3,3], [beats[3],3]]},
    {until: beats[6], row: 1, slot: earlierPrompt, keys: [[beats[3],0], [beats[4]-1.2,0], [beats[4],1],
      [beats[5]-2.5,1], [beats[5],2], [beats[6],2]]},
    {until: Infinity, row: 0, slot: lastPrompt, keys: [[beats[6],1], [beats[7]-2.5,1], [beats[7],3], [duration,3]]}
  ];
  // The tape's own clock. Sequence A: the copy drops, rests, slides, and holds still before its
  // gates appear on the next beat. Sequence B arrives already copied and repeats the same slide.
  const smooth = u => u*u*(3-2*u), ramp = (t, from, to) => smooth(Math.max(0, Math.min(1, (t-from)/(to-from))));
  const tapeAt = (time, sequence) => sequence
    ? {drop: 1, slide: ramp(time, beats[3]+.8, beats[3]+2), gated: time >= beats[3]+2.4}
    : {drop: ramp(time, beats[1], beats[1]+1), slide: ramp(time, beats[1]+1.6, beats[1]+2.8), gated: time >= beats[2]};
  // Reduced motion shows one still per beat: the moment inside the beat when what its caption
  // describes has finished and nothing that leads into the next beat has started.
  const rest = [beats[0], beats[2]-1, beats[3]-1, beats[3]+3.5, beats[4], beats[5], beats[6], beats[7]];
  let width = 713, narrow = false, height = 302, last = 0, reduced = false, tracks = [];
  let left = 44, step = 110, columns = 6;
  const px = value => Number(value.toFixed(4));
  const stripY = strip => 32 + strip*Y.pitch;
  // Column centre of tape position q inside a strip; q may be fractional and may lie outside it.
  const columnX = (q, strip) => left + step*(q - strip*columns + .5);
  function geometry(i) {
    // A card stays wide enough for its longest role tag on the smallest phones.
    const strip = Math.floor(i/columns), x = px(columnX(i, strip)), y = stripY(strip), cell = px(Math.min(66, step-10));
    return {x, y, cell, output: px(Math.min(60, step-17)), elbow: px(x+step/2-3), pass: px(x+cell/2-12), gate: y+Y.target+Y.gate, rail: y+Y.rail};
  }
  // The marker's road through one column: input port, output, dogleg, gate, and the drop to the rail.
  function track(i) {
    const g = geometry(i), out = Math.min(g.x+g.output/2+8, g.elbow), mid = g.y+Y.output+Y.outputH/2;
    const points = [[g.x,g.y+Y.rest], [g.x,mid], [out,mid], [g.elbow,mid], [g.elbow,g.gate],
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
    narrow = width<520; columns = narrow ? 3 : 6; step = (width-left-6)/columns;
    height = 32 + Y.pitch*(narrow ? 2 : 1) + 62;
    root.dataset.layout = narrow ? 'narrow' : 'wide';
  }
  // Everything that depends only on the fixture and the pane width is laid out here, once per width.
  function layout() {
    attrs(svg,{viewBox:`0 0 ${width} ${height}`}); attrs(title,{x:width/2,y:20});
    const cell = geometry(0).cell;
    attrs(bezel,{x:px(geometry(0).x-cell/2-10),y:0,width:px(width-(geometry(0).x-cell/2-10)),height});
    slotNumbers.forEach((node,i) => { const {x,y} = geometry(i); attrs(node,{x,y:y+Y.slot}); });
    rows.forEach((r,b) => {
      r.inputs.forEach((input,i) => {
        const {x,y,cell:w} = geometry(i);
        attrs(input.cell,{transform:`translate(${px(x)} ${px(y+Y.input)})`}); attrs(input.rect,{x:-w/2,width:w});
      });
      for (const copy of [...r.targets, ...r.leavers]) attrs(copy.rect,{x:-cell/2,width:cell});
      r.targets.forEach(t => attrs(t.gate,{x:-cell/2+22}));
      r.predictors.forEach((p,i) => {
        const {x,y,output:ow,elbow,pass,gate,rail} = geometry(i), top = y+Y.output, mid = top+Y.outputH/2, under = top+Y.outputH;
        attrs(p.wire,{x1:x,x2:x,y1:y+Y.input+Y.card+2,y2:top-4});
        attrs(p.wireHead,{d:`M ${x-3} ${top-6} L ${x} ${top} L ${x+3} ${top-6} Z`});
        attrs(p.outputBox,{x:x-ow/2,y:top,width:ow,height:Y.outputH}); attrs(p.output,{x,y:top+16});
        attrs(p.targetWire,{x1:x,x2:x,y1:y+Y.target-2,y2:under+6});
        attrs(p.targetHead,{d:`M ${x-3} ${under+10} L ${x} ${under+3} L ${x+3} ${under+10} Z`});
        attrs(r.routes[i].path,{d:`M ${x+ow/2+1} ${mid} H ${elbow} V ${gate} H ${pass}${p.included ? ` V ${rail-6}` : ''}`});
        attrs(r.routes[i].end,{d:p.included ? `M ${pass-3.5} ${rail-7} L ${pass} ${rail-1} L ${pass+3.5} ${rail-7} Z`
          : `M ${pass} ${gate-6} V ${gate+6}`});
      });
    });
    [0,1].forEach(j => {
      const first = geometry(narrow ? 3*j : 0), end = geometry(narrow ? 3*j+2 : 5), r = rowLabels[j];
      attrs(rails[j],{x1:first.x-first.cell/2,x2:end.x+end.cell/2,y1:first.rail,y2:first.rail});
      attrs(r.slot,{x:22,y:first.y+Y.slot}); attrs(r.input,{x:22,y:first.y+Y.input+22});
      attrs(r.copy,{x:22,y:first.y+Y.target+22});
      attrs(r.target,{x:22,y:first.y+Y.target+20}); attrs(r.given,{x:22,y:first.y+Y.target+35});
      attrs(r.score,{x:22,y:first.rail+4});
    });
    if (narrow) {
      const from = geometry(3), to = geometry(2), xl = from.x-from.cell/2-6, xr = to.x+to.cell/2+9;
      const y2 = from.y+Y.target+Y.card/2, y1 = to.y+Y.target+Y.card/2, gap = from.y-7;
      attrs(wrapPath,{d:`M ${px(xl+5)} ${y2} H ${px(xl)} V ${gap} H ${px(xr)} V ${y1} H ${px(xr-4)}`});
      attrs(wrapHead,{d:`M ${px(xr-3)} ${y1-3.5} L ${px(xr-9)} ${y1} L ${px(xr-3)} ${y1+3.5} Z`});
    } else { wrapPath.removeAttribute('d'); wrapHead.removeAttribute('d'); }
    const receiptY = height-55;
    attrs(countLabel,{x:width/2-52,y:receiptY}); attrs(countA,{x:width/2+2,y:receiptY}); attrs(countB,{x:width/2+48,y:receiptY});
    attrs(change,{x:width/2,y:height-28}); attrs(changeLabel,{x:width/2,y:height-10});
    tracks = itinerary.map(leg => track(leg.slot)); drawn = ''; taped = ['', ''];
  }
  // What a beat (or a gate reveal) changes, written when it changes and not once per frame.
  let drawn = '', taped = ['', ''];
  function scene(stage, sequence, gated, copied) {
    attrs(svg,{'aria-label':`Sequence ${'AB'[sequence]}: ${pictures[gated ? 2 : copied ? 1 : 0]}`});
    root.dataset.sequence = 'AB'[sequence]; root.dataset.stage = String(stage);
    root.dataset.scoreChange = stage>=5 ? '0' : 'unrevealed';
    root.dataset.perturbation = stage>=4 ? 'excluded-output-logits-only' : 'none';
    title.textContent = `Sequence ${'AB'[sequence]}`;
    rows.forEach((r,b) => {
      show(r.group,b===sequence);
      // Excluded branches are muted only once the gates are on the picture.
      r.group.setAttribute('class', gated ? 'mp-gated' : 'mp-open');
      r.predictors.forEach((p,i) => {
        // A held step change, not a pulse: the altered outputs are relabelled and stay that way.
        const changed = !p.included && stage>=4;
        attrs(p.outputBox,{'stroke-width':changed ? 2.2 : 1.3});
        p.output.textContent = changed ? 'changed' : 'log prob';
        p.output.dataset.state = changed ? 'changed' : 'original';
        show(p.targetWire,gated); show(p.targetHead,gated); show(r.routes[i].group,gated);
      });
      // Only after the slide do the copies take the target colour and their gates.
      r.targets.forEach(t => {
        attrs(t.rect,{class:gated ? 'mp-target-box' : 'mp-ghost-box',height:gated ? Y.gated : Y.card});
        attrs(t.text,{class:gated ? 'mp-target' : 'mp-ghost'}); show(t.gate,gated);
      });
    });
    rowLabels.forEach((r,j) => {
      const on = j===0||narrow;
      show(r.slot,on); show(r.input,on); show(r.copy,copied&&!gated&&on);
      show(r.target,gated&&on); show(r.given,gated&&on); show(r.score,gated&&on); show(rails[j],gated&&on);
    });
    show(wrap,narrow&&copied&&!gated);
    show(countLabel,stage>=2); show(countA,stage>=2); show(countB,stage>3||(stage===3&&gated));
    show(change,stage>=5); show(changeLabel,stage>=5);
    formula.classList.toggle('mp-shown',stage>=2);
    formula.classList.toggle('mp-next-lit',stage===2||stage===3||stage>=6);
    formula.classList.toggle('mp-logp-lit',stage===2||stage===3);
    formula.classList.toggle('mp-mask-lit',stage>=4);
    if (caption.textContent!==captions[stage]) caption.textContent=captions[stage];
  }
  // The slide itself. Copy k sits at tape position k − slide; each strip is a window on the tape,
  // so on the phone wrap the copy that leaves strip 2 by the left is the one entering strip 1 on the right.
  function tape(b, drop, slide) {
    const y = strip => px(stripY(strip)+Y.input+(Y.target-Y.input)*drop);
    const put = (copy, strip, opacity) => {
      // Attributes first, visibility last: serialised attribute order then never depends on playback history.
      attrs(copy.group,{transform:`translate(${px(columnX(copy.k-slide,strip))} ${y(strip)})`,opacity:px(opacity)});
      show(copy.group,drop>0&&opacity>0);
    };
    rows[b].targets.forEach(t => put(t,Math.floor((t.k-1)/columns),t.k%columns ? 1 : slide));
    rows[b].leavers.forEach(l => put(l,Math.floor(l.k/columns),l.k%columns ? 0 : 1-slide));
    show(rows[b].tape,drop>0);
  }
  function render(time, reduceMotion) {
    last = time; reduced = reduceMotion;
    const stage = beats.reduce((s,beat,i) => time>=beat ? i : s,0);
    const held = reduceMotion ? rest[stage] : time;
    const sequence = stage>=3 && stage<=5 ? 1 : 0;
    const {drop, slide, gated} = tapeAt(held,sequence);
    const phase = gated ? 'targets' : drop===0 ? 'none' : drop<1 ? 'copying' : slide===0 ? 'copied' : slide<1 ? 'sliding' : 'slid';
    const key = `${stage}|${sequence}|${gated}|${drop>0}`;
    if (key!==drawn) { scene(stage,sequence,gated,drop>0); drawn = key; }
    // The sequence off screen keeps its finished tape, so the picture never depends on playback history.
    [0,1].forEach(b => {
      const tapeKey = b===sequence ? `${drop}|${slide}` : '1|1';
      if (tapeKey!==taped[b]) { if (b===sequence) tape(b,drop,slide); else tape(b,1,1); taped[b] = tapeKey; }
    });
    if (root.dataset.tape!==phase) root.dataset.tape = phase;
    // Otherwise, per frame, only the marker: where it is on its itinerary now.
    const at = itinerary.findIndex(leg => held<leg.until), leg = itinerary[at], road = tracks[at];
    let k = 0; while (k<leg.keys.length-2 && held>=leg.keys[k+1][0]) k++;
    const [t0,a] = leg.keys[k], [t1,b] = leg.keys[k+1];
    const u = Math.max(0,Math.min(1,(held-t0)/(t1-t0))), ease = smooth(u);
    const [cx,cy] = place(road, road.stop[a]+(road.stop[b]-road.stop[a])*ease);
    const resting = a===b || u===0 ? a : u===1 ? b : -1;
    const blocked = resting===2 && !masks[leg.row][leg.slot+1];
    attrs(packet,{transform:`translate(${cx} ${cy})`,'data-slot':`${leg.row}:${leg.slot}`,
      'data-at':resting<0 ? 'moving' : stops[resting],'data-state':blocked ? 'blocked' : 'carried'});
    show(core,!blocked);
    const copy = {none:'', copying:' copy dropping;', copied:' copy under the inputs;', sliding:' copy sliding left;', slid:' copy one slot left;', targets:''}[phase];
    return `${stages[stage]}. Sequence ${'AB'[sequence]};${copy} marker ${resting<0 ? 'moving' : blocked ? 'stopped at the gate' : where[resting]}.`;
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
