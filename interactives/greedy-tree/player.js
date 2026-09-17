(() => {
  const root = document.getElementById('greedy-tree-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector), fixture = JSON.parse(root.dataset.fixture);
  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number), duration = Number(pane.dataset.duration);
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const ease = x => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };
  const stageAt = time => beats.reduce((stage, beat, index) => time >= beat ? index : stage, 0);
  const names = ['Inspect the fixed tree', 'Greedy commits to A', 'Greedy extends A x',
    'Compare complete paths', 'Reset for beam width two', 'Keep both starts',
    'Rank all partial candidates', 'Include EOS and compare'];
  const captions = [
    'The first token favors A. Does that identify the better complete sequence?',
    'Greedy commits to A. The discarded B branch remains visible, but is no longer searched.',
    'Choose x after A. Multiply the two edge probabilities to score this partial sequence.',
    'Greedy ends at EOS. The discarded B branch contains a more likely completion.',
    'Reset the search, not the predictor. Every probability on the tree stays the same.',
    'Two alternatives, each one token deep. Beam width is not the number of tokens generated at once.',
    'Extend each prefix by one token. Its continuation probabilities belong to that prefix, not the neighboring branch.',
    'Ask for one answer: choose the best completed candidate. Keeping two candidates does not join their tokens.'
  ];
  function candidate(id, tokens, probability, done = false, logProbability = Math.log(probability)) {
    return { id, tokens, probability, logProbability, done, kept: false };
  }
  function ranked(items) {
    return items.sort((a, b) => b.probability - a.probability || a.id.localeCompare(b.id))
      .map((item, index) => ({ ...item, rank: index + 1, kept: index < 2 }));
  }
  function evaluate(source) {
    if (!source || !['root', 'next', 'eos'].every(key => Array.isArray(source[key])
      && source[key].length === 2 && source[key].every(p => Number.isFinite(p) && p > 0 && p < 1))
      || Math.abs(source.root[0] + source.root[1] - 1) > 1e-12)
      throw Error('greedy-tree: two finite probabilities in (0,1) per row, with root probabilities summing to one, required');
    const [a, b] = source.root, [x, y] = source.next, [ae, be] = source.eos;
    const prefix = [a * x, b * y], joints = [prefix[0] * ae, prefix[1] * be];
    const rootLogs = [Math.log(a), Math.log(b)];
    const prefixLogs = [rootLogs[0] + Math.log(x), rootLogs[1] + Math.log(y)];
    const rootCandidates = ranked([candidate('A', ['A'], a, false, rootLogs[0]),
      candidate('B', ['B'], b, false, rootLogs[1])]);
    const prefixCandidates = ranked([candidate('Ax', ['A', 'x'], prefix[0], false, prefixLogs[0]),
      candidate('By', ['B', 'y'], prefix[1], false, prefixLogs[1]),
      candidate('Aother', ['A', 'other'], a * (1 - x), false, rootLogs[0] + Math.log(1 - x)),
      candidate('Bother', ['B', 'other'], b * (1 - y), false, rootLogs[1] + Math.log(1 - y))]);
    const finalCandidates = ranked([candidate('AxEOS', ['A', 'x', 'EOS'], joints[0], true, prefixLogs[0] + Math.log(ae)),
      candidate('ByEOS', ['B', 'y', 'EOS'], joints[1], true, prefixLogs[1] + Math.log(be)),
      candidate('Axother', ['A', 'x', 'other'], prefix[0] * (1 - ae), false, prefixLogs[0] + Math.log(1 - ae)),
      candidate('Byother', ['B', 'y', 'other'], prefix[1] * (1 - be), false, prefixLogs[1] + Math.log(1 - be))]);
    const otherBounds = [...prefixCandidates, ...finalCandidates].filter(item => item.id.endsWith('other'))
      .map(item => ({ id: item.id, probability: item.probability }));
    const maxOtherBound = Math.max(...otherBounds.map(item => item.probability));
    // This authored tree leaves the other subtrees unspecified. Reject fixtures
    // that would require expanding them, rather than inventing their probabilities.
    if (!(a > b && x > .5 && y > .5 && ae > .5 && be > .5 && joints[1] > joints[0]
      && joints[1] > maxOtherBound && prefixCandidates.slice(0, 2).every(item => !item.id.endsWith('other'))
      && finalCandidates.slice(0, 2).every(item => item.done)))
      throw Error('greedy-tree: the bounded counterexample requires greedy A, both named prefixes retained, both EOS candidates retained, and B EOS above all omitted bounds');
    return { rootCandidates, prefixCandidates, finalCandidates, otherBounds, maxOtherBound,
      greedyBranch: 0, greedyPath: ['A', 'x', 'EOS'], greedyJoint: joints[0], alternativeJoint: joints[1], winnerBranch: 1,
      beamTrace: [rootCandidates, prefixCandidates, finalCandidates],
      conditional: { A: a, B: b, Ax: x, By: y, AxEOS: ae, ByEOS: be,
        Aother: 1 - x, Bother: 1 - y, Axother: 1 - ae, Byother: 1 - be } };
  }
  // The declared fixture never changes during playback: evaluate it once, frozen, so a
  // frame costs a lookup. Any other source (the suite's alternate trees) is evaluated fresh.
  const freeze = value => {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); }
    return value;
  };
  const declared = freeze(evaluate(fixture));
  function buildState(time, reducedMotion = false, source = fixture) {
    const values = source === fixture ? declared : evaluate(source), bounded = clamp(Number.isFinite(time) ? time : 0, 0, duration);
    const stage = stageAt(bounded), held = reducedMotion ? beats[stage] : bounded, mode = stage < 4 ? 'greedy' : 'beam';
    const earnedDepth = stage % 4;
    const travel = mode === 'greedy' ? ease((held - 2) / 3) + ease((held - 7) / 3) + ease((held - 12) / 3)
      : ease((held - 22) / 3) + ease((held - 27) / 3) + ease((held - 32) / 3);
    const retainedIds = earnedDepth === 0 ? ['BOS'] : mode === 'greedy' ? [['A'], ['Ax'], ['AxEOS']][earnedDepth - 1]
      : values.beamTrace[earnedDepth - 1].filter(item => item.kept).map(item => item.id);
    const prefixDepth = Math.max(0, earnedDepth - 1), beamWidth = mode === 'greedy' ? 1 : 2;
    const prefixIds = prefixDepth === 0 ? [['BOS']] : [['BOS', 'A', 'Ax'], ['BOS', 'B', 'By']]
      .slice(0, beamWidth).map(ids => ids.slice(0, prefixDepth + 1));
    const selectedId = earnedDepth === 3 ? (mode === 'greedy' ? 'AxEOS' : 'ByEOS') : null;
    return { ...values, stage, time: bounded, held, mode, earnedDepth, travel, retainedIds,
      prefixDepth, beamWidth, prefixIds, selectedId,
      comparisonVisible: stage === 3 || stage === 7, secondFrontierVisible: mode === 'beam' && (held > 22 || stage >= 5) };
  }
  window.BookGreedyTree = Object.freeze({ buildState });
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const drawing = svg.querySelector('[data-drawing]'); drawing.replaceChildren();
  const formula = $('[data-formula]'), caption = $('[data-caption]'), NS = 'http://www.w3.org/2000/svg';
  // Geometry only: 0.0001 px, so a last-bit libm difference cannot flip a digit in the
  // byte-compared static print. The probabilities themselves are never rounded.
  const pixel = value => Number(value.toFixed(4));
  function attrs(node, values) {
    for (const [key, value] of Object.entries(values)) node.setAttribute(key, typeof value === 'number' ? String(pixel(value)) : String(value));
  }
  function make(tag, attributes = {}, text = '', parent = drawing) {
    const node = document.createElementNS(NS, tag); attrs(node, attributes); node.textContent = text; parent.appendChild(node); return node;
  }
  const label = (text, cls = '', attributes = {}, parent = drawing) => make('text', { class: cls, 'text-anchor': 'middle', ...attributes }, text, parent);
  const show = (node, yes) => yes ? node.removeAttribute('hidden') : node.setAttribute('hidden', '');
  const path = points => points.map((point, i) => `${i ? 'L' : 'M'} ${pixel(point[0])} ${pixel(point[1])}`).join(' ');
  // JSDOM and a closed <details> measure no text, so a label is kept off a line with a
  // deliberately generous advance estimate (0.6 em a glyph) instead of getBBox().
  const SMALL = 12, textWidth = (text, size) => [...text].reduce((sum, ch) => sum + (ch === ' ' ? .3 : /[A-Z]/.test(ch) ? .75 : .6), 0) * size;
  const lookup = Object.fromEntries([...declared.rootCandidates, ...declared.prefixCandidates, ...declared.finalCandidates].map(item => [item.id, item]));
  const spoken = id => lookup[id].tokens.join(' ');
  const title = label('', 'gt-heading', { 'data-picture-title': '' });
  const edgeLegend = label('edges: next-token probability', 'gt-small gt-muted', { 'data-edge-legend': '' });
  const nodeLegend = label('nodes: joint probability', 'gt-small gt-muted', { 'data-node-legend': '' });
  const depthGuides = [1, 2, 3].map(depth => label(`depth ${depth}`, 'gt-small gt-depth', { 'data-depth-guide': depth }));
  const bos = make('circle', { r: 22, class: 'gt-root', 'data-root-node': '' });
  const bosName = label('BOS', 'gt-input');
  const ids = [['A', 'Ax', 'AxEOS'], ['B', 'By', 'ByEOS']], tokenNames = [['A', 'x', 'EOS'], ['B', 'y', 'EOS']];
  // Every printed number is a function of the declared fixture alone, so its text is written
  // once here; a frame only moves the frontier and switches visibility and emphasis.
  const nodes = ids.map((row, branch) => row.map((id, depth) => {
    const group = make('g', { class: 'gt-node-group', 'data-node': id });
    return { id, branch, depth, group,
      shape: make('rect', { x: -26, y: -17, width: 52, height: 34, rx: depth === 2 ? 3 : 8, class: 'gt-node' }, '', group),
      inner: depth === 2 ? make('rect', { x: -22, y: -13, width: 44, height: 26, rx: 1, class: 'gt-eos-inner' }, '', group) : null,
      name: label(tokenNames[branch][depth], '', { x: 0, y: 4 }, group),
      cumulative: label(`p ${lookup[id].probability.toFixed(3)}`, 'gt-probability', { 'data-cumulative': id, 'data-value': id }),
      rank: label(`#${lookup[id].rank}`, 'gt-probability', { 'data-rank': id }),
      status: label('', 'gt-small gt-muted', { 'data-node-status': id }) };
  }));
  const edges = nodes.map(row => row.map(node => ({
    wire: make('path', { class: 'gt-wire', 'data-edge': node.id, 'data-from': node.depth === 0 ? 'BOS' : ids[node.branch][node.depth - 1], 'data-to': node.id }),
    arrow: make('path', { class: 'gt-arrow', 'data-arrow': node.id }),
    probability: label(declared.conditional[node.id].toFixed(2), 'gt-probability gt-small', { 'data-conditional': node.id }),
    context: label(`given ${node.depth === 0 ? 'BOS' : tokenNames[node.branch].slice(0, node.depth).join(' ')}`, 'gt-input gt-small', { 'data-context': node.id })
  })));
  const otherIds = [['Aother', 'Axother'], ['Bother', 'Byother']];
  const others = otherIds.map((row, branch) => row.map((id, depth) => {
    const group = make('g', { 'data-other': id });
    return { id, branch, depth, group,
      wire: make('path', { class: 'gt-other-wire', 'data-other-edge': id, 'data-from': ids[branch][depth], 'data-to': id }, '', group),
      label: label(`other ${declared.conditional[id].toFixed(2)}`, 'gt-small gt-muted', { 'data-other-label': id }, group),
      bound: label(`≤ ${lookup[id].probability.toFixed(3)}`, 'gt-small gt-probability', { 'data-other-bound': id }, group) };
  }));
  const frontier = [0, 1].map(branch => make('circle', { r: 27, class: 'gt-frontier', 'data-frontier': branch, 'data-branch': branch }));
  const comparison = label(`${declared.alternativeJoint.toFixed(3)} > ${declared.greedyJoint.toFixed(3)}`, 'gt-probability', { 'data-comparison': '', 'data-emphasis': 'score' });
  const boundSummary = label(`other branches ≤ ${declared.maxOtherBound.toFixed(3)}`, 'gt-small gt-muted', { 'data-bound-summary': '' });
  Object.assign(root.dataset, { greedyJoint: String(declared.greedyJoint), alternativeJoint: String(declared.alternativeJoint),
    maxOtherBound: String(declared.maxOtherBound), rootCandidates: JSON.stringify(declared.rootCandidates),
    prefixCandidates: JSON.stringify(declared.prefixCandidates), finalCandidates: JSON.stringify(declared.finalCandidates),
    otherBounds: JSON.stringify(declared.otherBounds), conditional: JSON.stringify(declared.conditional) });
  let width = 713, rails = [], painted = -1, lastTime = 0, reduced = false;
  // Everything that depends only on the pane's width. Wide: two horizontal rails, labels
  // above and below them. Narrow: the rails turn vertical, so every label moves to the
  // OUTER side of its rail (left of the left column, right of the right one), where no
  // edge runs; the centre gutter holds only the depth guides and the `other` stubs.
  function layout() {
    width = Math.max(240, Math.round(figure.getBoundingClientRect().width || 713));
    const narrow = width < 560, height = narrow ? 650 : 490, GAP = 7;
    root.dataset.layout = narrow ? 'narrow' : 'wide';
    const origin = narrow ? [width / 2, 92] : [44, 220];
    // Wide: the first column stays far enough from BOS that the B diagonal arrives below
    // B's joint label instead of through it, even at the narrowest wide pane (560 px).
    const positions = nodes.map((row, branch) => row.map((_, depth) => narrow
      ? [width * (branch === 0 ? .28 : .72), 190 + 175 * depth]
      : [[Math.max(width * .24, 176), width * .57, width - 66][depth], branch === 0 ? 120 : 320]));
    rails = positions.map(row => [origin, ...row]);
    Object.assign(root.dataset, { nodePositions: JSON.stringify(positions.map(row => row.map(point => point.map(pixel)))),
      origin: JSON.stringify(origin.map(pixel)) });
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    attrs(title, { x: width / 2, y: 20 });
    attrs(edgeLegend, { x: narrow ? width / 2 : width * .29, y: narrow ? 40 : 42 });
    attrs(nodeLegend, { x: narrow ? width / 2 : width * .73, y: narrow ? 56 : 42 });
    // Narrow: the guide stands in the centre gutter just above its row of nodes, where two
    // resting rings (r = 27) leave it more room than at their equator.
    depthGuides.forEach((guide, index) => attrs(guide, { x: narrow ? width / 2 : positions[0][index][0],
      y: narrow ? positions[0][index][1] - 20 : 66 }));
    attrs(bos, { cx: origin[0], cy: origin[1] }); attrs(bosName, { x: origin[0], y: origin[1] + 4 });
    nodes.forEach((row, branch) => row.forEach((node, depth) => {
      const [x, y] = positions[branch][depth], side = branch === 0 ? -1 : 1, outer = side < 0 ? 'end' : 'start';
      attrs(node.group, { transform: `translate(${pixel(x)} ${pixel(y)})`, 'data-position': JSON.stringify([pixel(x), pixel(y)]) });
      // The joint sits above its node, clear of the frontier ring (r = 27) that rests there.
      // Narrow: beside the incoming rail rather than on it, with the rank beside the node.
      // Wide: the rank follows the joint on its right, where no BOS diagonal arrives.
      attrs(node.cumulative, narrow ? { x: x + side * GAP, y: y - 34, 'text-anchor': outer } : { x, y: y - 34, 'text-anchor': 'middle' });
      attrs(node.rank, narrow ? { x: x + side * 34, y: y + 4, 'text-anchor': outer } : { x: x + 33, y: y - 34, 'text-anchor': 'start' });
      attrs(node.status, { x, y: y + 41 });
      const edge = edges[branch][depth], from = depth === 0 ? origin : positions[branch][depth - 1];
      const dx = x - from[0], dy = y - from[1], length = Math.hypot(dx, dy), ux = dx / length, uy = dy / length;
      const rectangleRadius = Math.min(26 / Math.abs(ux), 17 / Math.abs(uy));
      const fromRadius = depth === 0 ? 22 : rectangleRadius, toRadius = rectangleRadius;
      const start = [from[0] + ux * fromRadius, from[1] + uy * fromRadius], end = [x - ux * toRadius, y - uy * toRadius];
      attrs(edge.wire, { d: path([start, end]) });
      attrs(edge.arrow, { d: path([[end[0] - 6 * ux - 3 * uy, end[1] - 6 * uy + 3 * ux], end,
        [end[0] - 6 * ux + 3 * uy, end[1] - 6 * uy - 3 * ux]]) });
      const mid = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
      if (depth === 0) {
        // A diagonal: push the label's box along the outward normal until it clears the line.
        const flip = (narrow ? -uy : ux) * side < 0 ? -1 : 1, normal = [-uy * flip, ux * flip];
        const reach = textWidth(edge.probability.textContent, SMALL) / 2 * Math.abs(normal[0]) + .46 * SMALL * Math.abs(normal[1]) + 5;
        attrs(edge.probability, { x: mid[0] + normal[0] * reach, y: mid[1] + normal[1] * reach + .26 * SMALL, 'text-anchor': 'middle' });
        attrs(edge.context, { x: mid[0], y: mid[1] + 20, 'text-anchor': 'middle' });
      } else if (narrow) {
        attrs(edge.probability, { x: x + side * GAP, y: mid[1] + 4, 'text-anchor': outer });
        attrs(edge.context, { x: x + side * GAP, y: mid[1] + 21, 'text-anchor': outer });
      } else {
        attrs(edge.probability, { x: mid[0], y: mid[1] - 12, 'text-anchor': 'middle' });
        attrs(edge.context, { x: mid[0], y: mid[1] + 20, 'text-anchor': 'middle' });
      }
    }));
    others.forEach((row, branch) => row.forEach(other => {
      const parent = positions[branch][other.depth], end = narrow ? [width / 2 + (branch === 0 ? -18 : 18), parent[1] + (branch === 0 ? 50 : 90)]
        : [parent[0] + 52, parent[1] + 58];
      attrs(other.wire, { d: path([[parent[0], parent[1] + 17], end]) });
      // Narrow: both stubs share the centre gutter, so keep their text off both rails.
      const half = textWidth(other.label.textContent, SMALL) / 2 + 6;
      const x = narrow ? clamp(end[0], positions[0][other.depth][0] + half, positions[1][other.depth][0] - half) : end[0];
      attrs(other.label, { x, y: end[1] + 15 }); attrs(other.bound, { x, y: end[1] + 32 });
    }));
    attrs(comparison, { x: width / 2, y: height - 40 }); attrs(boundSummary, { x: width / 2, y: height - 17 });
  }
  // Everything that changes only at a beat: what is visible, what is retained, and which
  // few numbers are in play. The newest depth is live; older numbers stay, muted. At the
  // two comparison beats only the completed scores and the comparison carry emphasis.
  function paint(state) {
    const newest = Math.max(0, state.earnedDepth - 1);
    const emphasis = (node, depth, score = false) => node.setAttribute('data-emphasis',
      state.comparisonVisible ? (score ? 'score' : 'muted') : depth === newest ? 'live' : 'muted');
    const candidateVisible = (branch, depth) => depth < state.earnedDepth && (state.mode === 'beam' || branch === 0 || state.comparisonVisible);
    function branchState(branch, depth) {
      if (state.mode === 'greedy') {
        if (branch === 1 && state.stage >= 1) return state.comparisonVisible ? 'counterfactual' : 'pruned';
        return depth < state.earnedDepth ? 'kept' : 'idle';
      }
      if (state.stage === 7 && branch === state.winnerBranch) return 'winner';
      return depth < state.earnedDepth ? 'kept' : 'idle';
    }
    Object.assign(root.dataset, { stage: String(state.stage), mode: state.mode, earnedDepth: String(state.earnedDepth),
      retainedIds: JSON.stringify(state.retainedIds), beamWidth: String(state.beamWidth), prefixDepth: String(state.prefixDepth),
      prefixIds: JSON.stringify(state.prefixIds), selectedId: state.selectedId || '', comparisonVisible: String(state.comparisonVisible) });
    // The picture's one spoken description. Candidates are named by their tokens, never by
    // internal ids; the scrubber's value text names the beat and repeats none of these numbers.
    svg.setAttribute('aria-label', `${names[state.stage]}. Fixed next-token probabilities.`
      + (state.earnedDepth ? ` Retained: ${state.retainedIds.map(spoken).join(', ')}.` : '')
      + ` Beam width ${state.beamWidth}; depth ${state.earnedDepth}.`
      + (state.selectedId ? ` If one answer is requested: ${spoken(state.selectedId)}.` : '')
      + (state.comparisonVisible ? ` Greedy joint ${state.greedyJoint.toFixed(3)}; alternative joint ${state.alternativeJoint.toFixed(3)}. Every other-branch bound is at most ${state.maxOtherBound.toFixed(3)}.` : ''));
    title.textContent = state.mode === 'greedy' ? `Greedy: width 1, depth ${state.earnedDepth}`
      : state.stage === 4 ? 'Same tree, reset the search' : state.stage === 7 ? 'Beam 2: one requested answer' : `Beam: width 2, depth ${state.earnedDepth}`;
    depthGuides.forEach((guide, index) => guide.setAttribute('data-current', state.earnedDepth === index + 1 ? 'yes' : 'no'));
    nodes.forEach((row, branch) => row.forEach((node, depth) => {
      const status = branchState(branch, depth), isPrefix = state.prefixIds.some(prefix => prefix.includes(node.id));
      const visible = candidateVisible(branch, depth), edge = edges[branch][depth];
      attrs(node.group, { 'data-state': status, 'data-prefix': isPrefix ? 'yes' : 'no', 'data-selected': state.selectedId === node.id ? 'yes' : 'no' });
      emphasis(node.cumulative, depth, depth === 2); show(node.cumulative, visible);
      emphasis(node.rank, depth, depth === 2); show(node.rank, visible && state.mode === 'beam' && depth === state.earnedDepth - 1);
      node.status.textContent = depth === 2 && state.comparisonVisible ? state.mode === 'greedy' ? (branch === 0 ? 'greedy' : 'missed')
        : branch === state.winnerBranch ? 'top choice' : 'runner-up' : '';
      show(node.status, Boolean(node.status.textContent));
      attrs(edge.wire, { 'data-state': status, 'data-prefix': isPrefix ? 'yes' : 'no' });
      emphasis(edge.probability, depth); show(edge.probability, depth === 0 || visible);
      show(edge.context, depth > 0 && visible);
    }));
    others.forEach((row, branch) => row.forEach(other => {
      show(other.group, state.earnedDepth >= other.depth + 2 && (state.mode === 'beam' || branch === 0 || state.comparisonVisible));
      emphasis(other.bound, other.depth + 1); show(other.bound, state.comparisonVisible || state.mode === 'beam');
    }));
    frontier.forEach((marker, branch) => marker.setAttribute('data-selected', state.selectedId === ids[branch][2] ? 'yes' : 'no'));
    show(comparison, state.comparisonVisible); show(boundSummary, state.comparisonVisible);
    formula.classList.toggle('gt-product-shown', state.earnedDepth >= 2);
    formula.classList.toggle('gt-log-shown', state.mode === 'beam' && state.earnedDepth >= 1);
    if (caption.textContent !== captions[state.stage]) caption.textContent = captions[state.stage];
  }
  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const state = buildState(time, reducedMotion);
    if (state.stage !== painted) { paint(state); painted = state.stage; }
    Object.assign(root.dataset, { held: String(state.held), travel: String(state.travel), secondFrontierVisible: String(state.secondFrontierVisible) });
    // The one moving object: the frontier ring(s), a pure function of time along the rails.
    frontier.forEach((marker, branch) => {
      const rail = rails[branch], segment = Math.min(2, Math.floor(state.travel)), fraction = state.travel - segment;
      const point = rail[segment].map((v, axis) => v + (rail[segment + 1][axis] - v) * fraction);
      attrs(marker, { cx: point[0], cy: point[1] });
      show(marker, state.selectedId ? state.selectedId === ids[branch][2] : branch === 0 || state.secondFrontierVisible);
    });
    const kept = state.retainedIds.length;
    return `${names[state.stage]}. ${state.comparisonVisible ? `${kept} completed candidate${kept === 1 ? '' : 's'} retained.`
      : `${kept} retained prefix${kept === 1 ? '' : 'es'}.`}`;
  }
  function typeset() {
    const done = () => { root.dataset.typeset = root.querySelector('mjx-container') ? 'mathjax' : 'none'; };
    const mathjax = window.MathJax;
    if (mathjax && typeof mathjax.typesetPromise === 'function' && !root.querySelector('mjx-container')) mathjax.typesetPromise([root]).then(done, done);
    else done();
  }
  layout(); window.BookPlayback(root, render, () => { layout(); render(lastTime, reduced); }); typeset();
})();
