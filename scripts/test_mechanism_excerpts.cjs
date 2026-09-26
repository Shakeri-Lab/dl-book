#!/usr/bin/env node
// Test-only JSDOM. No dependency from this file enters the published book.
// The JSDOM fixture, the markup canonicaliser, and the transport suite every scene
// inherits live in scripts/html-tests/excerpt-harness.cjs. What stays here is the part
// no harness can supply: the arithmetic and the Boolean invariants of these two scenes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {read, loader, manifest, entry, chapterSource, numbers, close, canonicalMarkup,
  configure, fixture, registerTransportTests} = require('./html-tests/excerpt-harness.cjs');
const ids = {'kernel-weighting': 'kernel-weighting-excerpt', 'bert-ledger': 'bert-ledger-excerpt'};
// The manuscript owns every fixture; each panel is its one in-repo mirror, and
// interactives/manifest.json is the build-time index that names the chapter literals behind it.
// scripts/audit_excerpt_fixtures.py holds those three together, so the references below are read
// from the panel and the manifest instead of being typed here a second time.
// Read the declared fixture from the closed panel: once the transport mounts, the kernel player
// republishes data-query as the moving query, and only returns it to this value at rest.
function kernelFixture(f) {
  assert(!f.root.dataset.ready, 'read the declared fixture before the player mounts');
  return {keys: numbers(f.root.dataset.keys), values: numbers(f.root.dataset.values),
    bandwidth: Number(f.root.dataset.bandwidth), query: Number(f.root.dataset.query)};
}
function bertFixture(f) {
  const rail = f.$('[data-token-rail]');
  return {tokens: [...rail.querySelectorAll('[data-token] .bert-original')].map(cell => cell.textContent),
    eligible: numbers(rail.dataset.eligible), selected: numbers(rail.dataset.selected),
    mask: numbers(rail.dataset.maskSites), random: numbers(rail.dataset.randomSites),
    replacement: rail.dataset.randomReplacement};
}

// The BERT scene computes every ray endpoint from four measured boxes, and JSDOM lays
// nothing out, so this suite supplies that grid to the harness. An element without
// data-box takes the harness's pane-sized default, which is what the kernel plot reads.
const bertBoxes = ['input', 'target', 'prediction', 'loss'];
configure('bert-ledger', {rects: (element, {width, rect}) => {
  if (!element.dataset.box) return null;
  const index = bertBoxes.indexOf(element.dataset.box);
  return rect(10 + (index % 2) * width / 2, 20 + Math.floor(index / 2) * 150, width / 2 - 28, 114);
}});

registerTransportTests(ids['kernel-weighting'], {
  witness: /2\.7412/,
  anchors: ['kernel-playback-help']
});
registerTransportTests(ids['bert-ledger'], {
  witness: /selected = 1/,
  anchors: ['bert-playback-help'],
  // This scene has published its stage as data-beat since it shipped. New scenes write
  // data-stage, which is what interactives/_template/player.js sets and the harness
  // looks for unless a suite says otherwise.
  stage: 'beat'
});

test('transport: a pane-declared duration drives the range, clock, End key, and readout', t => {
  const f = fixture(t, 'kernel-weighting');
  // No shipped pane overrides the markup range yet; the mechanism must still hold.
  f.$('[data-pane]').dataset.duration = '24';
  f.load();
  assert.equal(f.$('input[type=range]').max, '24');
  assert.equal(f.root.dataset.duration, '24');
  assert.equal(f.$('[data-controls] [data-duration]').textContent, ' / 0:24');
  assert(f.$('.mechanism-stages'), 'the duration text belongs to the clock, never to the pane');
  f.key('End'); assert.equal(f.time, 24);
  assert.match(f.$('input[type=range]').getAttribute('aria-valuetext'), /^0:24 of 0:24\. /);
  f.seek(40); assert.equal(f.time, 24);
});
test('kernel: manuscript witness agrees with independently evaluated stable softmax', t => {
  const f = fixture(t, 'kernel-weighting');
  const {keys, values, bandwidth, query} = kernelFixture(f);
  f.load(); f.seek(40);
  const logs = keys.map(k => -((query-k)**2)/(2*bandwidth**2));
  const exp = logs.map(l => Math.exp(l - Math.max(...logs))), sum = exp.reduce((a,b)=>a+b);
  const reference = exp.map(a => a/sum), actual = JSON.parse(f.root.dataset.weights);
  actual.forEach((a,i) => close(a,reference[i]));
  const prediction = reference.reduce((a,w,i)=>a+w*values[i],0);
  close(Number(f.root.dataset.prediction), prediction);
  // The chapter's printed witness. Recomputing the panel's own numbers cannot reach it by
  // accident, so this is where the mirror stops being self-referential.
  assert.equal(prediction.toFixed(4), '2.7412');
  assert.deepEqual(actual.map(w=>w.toFixed(4)), ['0.0002','0.9413','0.0585']);
});
test('kernel: the captions read the declared fixture instead of retyping the chapter', t => {
  const f = fixture(t, 'kernel-weighting');
  const {query, bandwidth} = kernelFixture(f);
  f.load();
  const caption = f.$('[data-caption]');
  f.seek(0); assert(caption.textContent.includes(`q = ${query}`), caption.textContent);
  f.seek(10); assert(caption.textContent.includes(`fixed at ${bandwidth}`), caption.textContent);
  f.seek(38);
  assert(caption.textContent.includes(Number(f.root.dataset.prediction).toFixed(4)), caption.textContent);
});
test('kernel: moving the declared fixture moves every caption number with it', t => {
  const f = fixture(t, 'kernel-weighting');
  // Not a manuscript edit: this proves the sentences are computed, so a real chapter
  // change could not leave a stale number behind in the scene script.
  f.root.dataset.query = '2.5'; f.root.dataset.bandwidth = '0.9';
  f.load();
  const caption = f.$('[data-caption]');
  f.seek(0); assert.match(caption.textContent, /q = 2\.5,/);
  f.seek(10); assert.match(caption.textContent, /fixed at 0\.9\./);
  f.seek(38);
  assert(caption.textContent.includes(Number(f.root.dataset.prediction).toFixed(4)), caption.textContent);
  assert(!caption.textContent.includes('2.7412'), 'no chapter number survives a moved fixture');
});
test('kernel: no-script calculation matches every rounded final readout', t => {
  const f = fixture(t, 'kernel-weighting');
  const selectors = ['[data-distance]', '[data-affinity]', '[data-weight]', '[data-product]'];
  const before = selectors.map(s => [...f.root.querySelectorAll(s)].map(n => n.textContent));
  f.load(); f.seek(40);
  assert.deepEqual(selectors.map(s => [...f.root.querySelectorAll(s)].map(n => n.textContent)), before);
});
test('kernel: every scrub position preserves positivity, normalization, and convex-hull bound', t => {
  const f = fixture(t, 'kernel-weighting');
  const {values} = kernelFixture(f); f.load();
  const lowest = Math.min(...values), highest = Math.max(...values);
  for (let i=0;i<=400;i++) {
    f.seek(i/10); const weights=JSON.parse(f.root.dataset.weights), p=Number(f.root.dataset.prediction);
    assert(weights.every(w=>w>=0 && w<=1)); close(weights.reduce((a,b)=>a+b),1);
    assert(p>=lowest && p<=highest); close(p, weights.reduce((s,w,j)=>s+w*values[j],0));
  }
});
test('kernel: only query moves; witness returns exactly; unrevealed fields are not false zeros', t => {
  const f = fixture(t, 'kernel-weighting');
  const {keys, bandwidth, query} = kernelFixture(f); f.load();
  assert.equal(f.$('[data-weight]').textContent, '·');
  const first = keys[0], last = keys[keys.length-1];
  // The sweep leaves the chapter's printed query, reaches the outermost keys, and returns to it:
  // at rest the live data-query is again the value the panel declares.
  for (const [time,q] of [[0,query],[20,query],[22,first],[27,(first+last)/2],[32,last],[36,query],[40,query]]) {
    f.seek(time); close(Number(f.root.dataset.query),q);
    assert(f.$('.kernel-settings').textContent.includes(`${bandwidth.toFixed(2)} (fixed)`));
  }
  f.seek(23.137); f.reduce(); close(Number(f.root.dataset.query)*4,Math.round(Number(f.root.dataset.query)*4));
});
test('kernel: responsive plot uses actual width and keeps all rays on their observation endpoints', t => {
  const f=fixture(t,'kernel-weighting'); f.load(); f.seek(24); f.resize(280);
  assert.equal(f.$('.kernel-plot svg').getAttribute('viewBox'),'0 0 280 190');
  const rays=[...f.root.querySelectorAll('line[stroke="#2f855a"]')]; assert.equal(rays.length,3);
  const circles=[...f.root.querySelectorAll('circle')];
  rays.forEach((ray,i)=>{close(+ray.getAttribute('x1'),+circles[i].getAttribute('cx'));close(+ray.getAttribute('y1'),+circles[i].getAttribute('cy'));});
});
test('kernel: the stage strip lights nothing during the question, then exactly its own stage', t => {
  const f = fixture(t, 'kernel-weighting'); f.load();
  const labels = [...f.root.querySelectorAll('.mechanism-stages span')];
  assert.deepEqual(labels.map(node => node.textContent),
    ['Distance', 'Affinity', 'Normalize', 'Mix', 'Move']);
  const lit = () => labels.filter(node => node.classList.contains('is-current')).map(n => n.textContent);
  // The 0-4 s beat asks the reader to predict; no step of the calculation has run yet.
  for (const time of [0, 2, 3.999]) { f.seek(time); assert.deepEqual(lit(), [], `lit at ${time}`); }
  for (const [time, stage] of [[4, 'Distance'], [8, 'Affinity'], [12, 'Normalize'],
    [16, 'Mix'], [20, 'Move'], [40, 'Move']]) {
    f.seek(time); assert.deepEqual(lit(), [stage], `one own label at ${time}`);
  }
});
test('kernel: the observed-value range is the hull of the panel values, on screen and in the fallback', t => {
  const f = fixture(t, 'kernel-weighting');
  const {values} = kernelFixture(f);
  const cards = [...f.root.querySelectorAll('.kernel-cards h4 .target-role')]
    .map(node => Number(node.textContent.replace(/[^\d.]/g, '')));
  assert.deepEqual(cards, values, 'the cards print the values the panel declares');
  const hull = `[${Math.min(...values)}, ${Math.max(...values)}]`;
  const fallback = f.$('[data-prediction]').textContent;
  assert(fallback.includes(hull), `static witness "${fallback}" does not carry ${hull}`);
  f.load(); f.seek(40);
  const rendered = f.$('[data-prediction]').textContent;
  assert(rendered.includes(hull), `rendered witness "${rendered}" does not carry ${hull}`);
  // One sentence: the player computes the bracket the static panel prints.
  assert.equal(rendered, fallback);
  assert(f.$('.kernel-plot svg').getAttribute('aria-label')
    .includes(`Fixed observed values ${values.join(', ')}.`));
});
test('kernel: the panel declares exactly the chapter’s keys, values, bandwidth, and query', t => {
  const f = fixture(t, 'kernel-weighting');
  const {keys, values, bandwidth, query} = kernelFixture(f);
  // Parse the chapter independently. The manifest names these literals and
  // scripts/audit_excerpt_fixtures.py checks they are still there; this checks the panel
  // that mirrors them, so no fixture number reaches a player without a manuscript behind it.
  const source = chapterSource('kernel-weighting');
  const array = name => {
    const found = source.match(new RegExp(`^${name} = np\\.array\\(([^)]*)\\)`, 'm'));
    assert(found, `${name} is not in ${entry('kernel-weighting').qmd}`);
    return found[1].match(/-?\d+(?:\.\d+)?/g).map(Number);
  };
  assert.deepEqual(keys, array('keys3'), 'declared keys');
  assert.deepEqual(values, array('values3'), 'declared observed values');
  assert.deepEqual([query], array('query3'), 'declared query');
  const declared = source.match(/gaussian_attention\([^)]*bandwidth=([\d.]+)\)/);
  assert(declared, 'the chapter calls the lookup with an explicit bandwidth');
  assert.equal(bandwidth, Number(declared[1]), 'declared bandwidth');
  // The chapter's own literals are what the audit pins; fail here too if they move.
  for (const literal of entry('kernel-weighting').fixture.literals) assert(source.includes(literal));
});
test('kernel: the caption is a polite atomic live region', t => {
  const f = fixture(t, 'kernel-weighting');
  const caption = f.$('[data-caption]');
  assert.equal(caption.getAttribute('aria-live'), 'polite');
  assert.equal(caption.getAttribute('aria-atomic'), 'true');
  f.load(); f.seek(0);
  const first = caption.textContent;
  f.seek(8); assert.notEqual(caption.textContent, first, 'the region announces a changed caption');
});
test('kernel: playing frames measure nothing; the layout callback re-measures', t => {
  const f = fixture(t, 'kernel-weighting'); f.load(); f.open(); f.seek(20);
  const measured = f.w.Element.prototype.getBoundingClientRect;
  let calls = 0;
  f.w.Element.prototype.getBoundingClientRect = function (...args) { calls += 1; return measured.apply(this, args); };
  f.play();
  // Past 20 s the query moves, so every one of these frames redraws the plot.
  for (let i = 0; i < 60; i++) f.tick(16);
  assert(f.playing); assert(f.time > 20.9);
  assert.equal(calls, 0, 'render() must not force a synchronous layout on any frame');
  f.resize(280);
  assert(calls > 0, 'the layout callback re-measures the plot');
  assert.equal(f.$('.kernel-plot svg').getAttribute('viewBox'), '0 0 280 190');
  f.w.Element.prototype.getBoundingClientRect = measured;
  // The cache is filled at mount, so the first paint is already the measured width.
  const narrow = fixture(t, 'kernel-weighting', {width: 320}); narrow.load();
  assert.equal(narrow.$('.kernel-plot svg').getAttribute('viewBox'), '0 0 320 190');
});
test('kernel: the plot names its value axis and the legend covers every drawn mark', t => {
  const f = fixture(t, 'kernel-weighting'); f.load(); f.seek(40);
  const axis = [...f.root.querySelectorAll('.kernel-plot text')].filter(n => n.textContent === 'value');
  assert.equal(axis.length, 1, 'the value axis is named once');
  assert.match(axis[0].getAttribute('transform'), /rotate\(-90/);
  assert.match(f.$('.kernel-plot').textContent, /Key \/ query position/);
  const legend = f.$('.kernel-legend');
  for (const pattern of [/Observed value/, /Prediction/, /Query/, /Distance/])
    assert.match(legend.textContent, pattern);
  const swatches = [...legend.querySelectorAll('svg')];
  assert.equal(swatches.length, 2);
  swatches.forEach(swatch => assert.equal(swatch.getAttribute('aria-hidden'), 'true'));
  // Each swatch repeats the mark it names: same dash pattern, same bracket stroke, same colour.
  f.seek(10);
  const drawn = [...f.root.querySelectorAll('[data-drawing] line, [data-drawing] path')];
  const query = drawn.find(node => node.getAttribute('stroke-dasharray') === '4 4');
  assert.equal(legend.querySelector('line').getAttribute('stroke-dasharray'), query.getAttribute('stroke-dasharray'));
  const bracket = drawn.find(node => (node.getAttribute('d') || '').includes('v6m0,-3'));
  assert.match(legend.querySelector('path').getAttribute('d'), /v6m0,-3/);
  for (const mark of [query, bracket]) assert.equal(mark.getAttribute('stroke'), '#2b6cb0');
  const marks = [...legend.querySelectorAll('svg line, svg path')];
  assert.equal(marks.length, 2);
  marks.forEach(mark => assert.equal(mark.getAttribute('stroke'), 'currentColor'));
  assert.equal(legend.querySelectorAll('.input-role').length, 2, 'both new entries carry the input palette role');
  assert(read('shared/player.css').includes('.input-role { color: #2b6cb0; }'),
    'currentColor in the swatches resolves to the colour the plot draws with');
});
test('BERT: canonical five Boolean rows partition selection; visibility is separate', t => {
  const f=fixture(t,'bert-ledger'); const declared=bertFixture(f);
  f.load(); const rows=JSON.parse(f.root.dataset.ledgers);
  // The rail declares four rows; the chapter derives the fifth, and so does this test.
  const unchanged=declared.selected.filter(i=>!declared.mask.includes(i)&&!declared.random.includes(i));
  const expected={eligible:declared.eligible,selected:declared.selected,
    mask_sites:declared.mask,random_sites:declared.random,unchanged_sites:unchanged};
  for(const [name,indices] of Object.entries(expected)) assert.deepEqual(rows[name].flatMap((bit,i)=>bit?[i]:[]),indices);
  for(let i=0;i<12;i++) {
    assert.equal(+rows.mask_sites[i]+ +rows.random_sites[i]+ +rows.unchanged_sites[i],+rows.selected[i]);
    assert(!rows.selected[i] || rows.eligible[i]);
  }
  assert.deepEqual(JSON.parse(f.root.dataset.corrupted),declared.tokens.map((token,i)=>
    declared.mask.includes(i)?'[MASK]':declared.random.includes(i)?declared.replacement:token));
  // The three blobs are a mount-time snapshot of the fixture, not per-state bookkeeping:
  // once written they are never rewritten, however far the reader scrubs.
  const marker='["rewritten"]';
  for(const name of ['ledgers','corrupted','original']) f.root.dataset[name]=marker;
  f.open(); for(const time of [0,4,13,25,33.5,37,40]) f.seek(time);
  for(const name of ['ledgers','corrupted','original']) assert.equal(f.root.dataset[name],marker);
});
test('BERT: the rail declares exactly the chapter’s twelve tokens and Boolean rows', t => {
  const f = fixture(t, 'bert-ledger');
  const declared = bertFixture(f);
  const source = chapterSource('bert-ledger');
  const tokens = source.match(/ledger_tokens = \[([\s\S]*?)\n\]/)[1].match(/"([^"]*)"/g)
    .map(quoted => quoted.slice(1, -1));
  assert.deepEqual(declared.tokens, tokens, 'the rail carries the chapter’s sequence');
  // Expand the chapter's own two spellings of a Boolean row and read the True positions.
  const row = name => {
    const found = source.match(new RegExp(`^${name} = np\\.array\\(([\\s\\S]*?)\\)$`, 'm'));
    assert(found, `${name} is not in ${entry('bert-ledger').qmd}`);
    return found[1]
      .replace(/\[(True|False)\]\s*\*\s*(\d+)/g, (_, value, count) => Array(Number(count)).fill(value).join(','))
      .match(/True|False/g)
      .flatMap((word, index) => word === 'True' ? [index] : []);
  };
  assert.deepEqual(declared.eligible, row('eligible'), 'declared eligible positions');
  assert.deepEqual(declared.selected, row('selected'), 'declared selected positions');
  assert.deepEqual(declared.mask, row('mask_sites'), 'declared mask sites');
  assert.deepEqual(declared.random, row('random_sites'), 'declared random sites');
  // The replacement token is the panel's illustrative choice, but it may only be a token the
  // chapter itself prints, and the rail must say so where the reader sees it.
  assert(tokens.includes(declared.replacement), 'the replacement is one of the chapter’s tokens');
  assert.match(f.$('[data-footnote]').textContent, /illustrative random replacement/);
  for (const literal of entry('bert-ledger').fixture.literals) assert(source.includes(literal));
});
test('BERT: each branch routes corrupted input and original target to distinct destinations', t => {
  const f=fixture(t,'bert-ledger'); const declared=bertFixture(f); f.load();
  const corrupted=declared.tokens.map((token,i)=>
    declared.mask.includes(i)?'[MASK]':declared.random.includes(i)?declared.replacement:token);
  // Each scene's focus position is choreography; what it must show is the fixture's.
  for(const [time,i] of [[13,2],[19,4],[25,8],[31,3],[34,9],[37,10],[40,8]]) {
    const scored=declared.selected.includes(i), visible=declared.tokens[i]!=='[PAD]';
    f.seek(time); assert.equal(+f.root.dataset.position,i);
    assert.equal(f.$('[data-input]').textContent,corrupted[i]);
    assert.equal(f.$('[data-target]').textContent,scored?declared.tokens[i]:'Not a loss target');
    assert.equal(f.root.dataset.selected,String(scored)); assert.equal(f.root.dataset.visible,String(visible));
    assert.equal(f.root.dataset.scored,String(scored));
    assert.equal(f.$('[data-ray=target]').style.display,scored?'':'none');
    assert.equal(f.$('[data-ray=prediction]').style.display,scored?'':'none');
    assert.equal(f.$('[data-ray=input]').style.display,visible?'':'none');
    assert.match(f.$('[data-loss]').textContent,scored?/−log p/:/No direct term/);
  }
});
test('BERT: prediction cards and loss remain symbolic, never invented model outputs', t => {
  const f=fixture(t,'bert-ledger'); const declared=bertFixture(f); f.load();
  // The symbolic form is typed; the token inside it is the one the chapter saved.
  for(const [time,index,term] of [[13,2,'−log p₂'],[19,4,'−log p₄'],[25,8,'−log p₈'],[40,8,'−log p₈']]) {
    f.seek(time);
    assert.equal(f.$('[data-output]').textContent,`Prediction at ${index}`);
    assert.equal(f.$('[data-loss]').textContent,`Yes: ${term}(${declared.tokens[index]})`);
    assert.equal(f.root.dataset.prediction,undefined);
    assert.equal(f.root.dataset.probability,undefined);
  }
  assert.match(f.$('.mechanism-boundary').textContent,/No model probabilities or measured losses are supplied/);
  assert.match(f.$('.mechanism-boundary').textContent,/illustrate branches, not the population/);
});
test('BERT: originals persist while the complete input changes jointly at four seconds', t => {
  const f=fixture(t,'bert-ledger'); const declared=bertFixture(f);
  const originals=()=>[...f.root.querySelectorAll('.bert-original')].map(n=>n.textContent);
  const inputs=()=>[...f.root.querySelectorAll('[data-token] b')].map(n=>n.textContent);
  // Snapshot the saved originals before the player mounts; nothing it does may rewrite them.
  const original=originals();
  assert.deepEqual(original,declared.tokens);
  assert.equal(f.$('[data-input]').textContent,declared.tokens[8],'the question opens on position 8');
  f.load();
  for(const time of [0,3.99,4,7.99,9,15,22,29,34,37,40]) {
    f.seek(time);
    assert.deepEqual(originals(),original);
    assert.deepEqual(inputs(),time<4?original:JSON.parse(f.root.dataset.corrupted));
    const chosen=[...f.root.querySelectorAll('[data-token]')].flatMap((n,i)=>n.classList.contains('is-selected')?[i]:[]);
    assert.deepEqual(chosen,time<4?[]:declared.selected);
  }
  assert.match(f.$('[data-visibility]').textContent,/bookkeeping, not an extra model input/);
  assert.match(f.$('[data-visibility]').textContent,/all 10 nonpadding tokens/);
});
test('BERT: setup preserves the prediction question and every case waits for both routes', t => {
  const f=fixture(t,'bert-ledger'); f.load();
  for(const time of [0,2,3.99,4,6,7.99]) {
    f.seek(time);
    assert.equal(f.root.dataset.scored,'false');
    assert.equal(f.$('[data-loss]').textContent,'Does it count?');
    for(const name of ['input','target','prediction']) {
      assert.equal(+f.$(`[data-ray=${name}]`).dataset.progress,0);
      assert.equal(f.$(`[data-ray=${name}]`).style.display,'none');
    }
  }
  for(const [start,duration] of [[8,6],[14,6],[20,6]]) {
    f.seek(start+duration*.75-.01);
    assert.equal(f.root.dataset.scored,'false');
    assert.doesNotMatch(f.$('[data-loss]').textContent,/Yes:|−log/);
    f.seek(start+duration*.75);
    assert.equal(f.root.dataset.scored,'true');
    assert.match(f.$('[data-loss]').textContent,/^Yes: −log/);
  }
});
test('BERT: progressive rays independently follow input, saved target, then prediction', t => {
  const f=fixture(t,'bert-ledger'); f.load();
  // Fixture rectangles establish the two separate inputs to loss, never a
  // saved-label connection into the encoder. These are geometry, not learned data.
  const destinations={input:'M136,116L136,145',target:'M436,116L436,145',prediction:'M274,207L295,207'};
  const clamp=n=>Math.max(0,Math.min(1,n));
  for(const [start,duration] of [[8,6],[14,6],[20,6]]) {
    for(const fraction of [0,.125,.25,.375,.5,.625,.75,.875]) {
      f.seek(start+duration*fraction);
      for(const [name,offset] of [['input',0],['target',1],['prediction',2]]) {
        const expected=clamp(4*fraction-offset), ray=f.$(`[data-ray=${name}]`), pulse=f.$(`[data-pulse=${name}]`);
        assert.equal(ray.getAttribute('d'),destinations[name]);
        close(+ray.dataset.progress,expected);
        close(+ray.style.strokeDashoffset,1-expected);
        assert.equal(ray.style.display,expected>0?'':'none');
        assert.equal(pulse.style.display,expected>0&&expected<1?'':'none');
        assert.equal(ray.getAttribute('marker-end'),expected===1?`url(#bert-${name}-arrow)`:'none');
        const coordinates=ray.getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number);
        close(+pulse.getAttribute('cx'),coordinates[0]+(coordinates[2]-coordinates[0])*expected);
        close(+pulse.getAttribute('cy'),coordinates[1]+(coordinates[3]-coordinates[1])*expected);
      }
    }
  }
});
test('BERT: unselected context has an input route but never an original-target or loss route', t => {
  const f=fixture(t,'bert-ledger'); f.load();
  for(const time of [26.5,27.5,29,31,33.5,36,37.9]) {
    f.seek(time);
    assert.equal(f.root.dataset.selected,'false');
    assert.equal(f.root.dataset.scored,'false');
    for(const name of ['target','prediction']) {
      assert.equal(+f.$(`[data-ray=${name}]`).dataset.progress,0);
      assert.equal(f.$(`[data-pulse=${name}]`).style.display,'none');
    }
    assert.doesNotMatch(f.$('[data-loss]').textContent,/Yes:|−log/);
  }
  f.seek(33.5);
  assert.equal(f.root.dataset.visible,'true');
  assert.equal(+f.$('[data-ray=input]').dataset.progress,1);
  f.seek(37);
  assert.equal(f.root.dataset.visible,'false');
  assert.equal(+f.$('[data-ray=input]').dataset.progress,0);
  assert.match(f.$('[data-input-note]').textContent,/Blocked as an attention key/);
});
test('BERT: Boolean ledgers stay secondary, closed, and addressable by a direct anchor', t => {
  const f=fixture(t,'bert-ledger');
  assert.equal(f.$('#bert-ledger-bits').open,false);
  assert.equal(f.$('#bert-ledger-transcript').open,false);
  f.load(); f.open(); f.seek(25);
  assert.equal(f.$('#bert-ledger-bits').open,false);
  assert.deepEqual([...f.root.querySelectorAll('[data-bit]')].map(n=>n.textContent),['1','1','0','0','1']);
  const anchored=fixture(t,'bert-ledger',{hash:'#bert-ledger-bits'});
  anchored.w.eval(loader); anchored.finishScript(); anchored.finishScript();
  assert(anchored.root.open); assert(anchored.$('#bert-ledger-bits').open); assert(!anchored.playing);
});
test('BERT: reduced motion quantizes each ray and never shows a moving dot', t => {
  const f=fixture(t,'bert-ledger',{reduced:true}); f.load(); f.open();
  for(const time of [0,4,8,8.75,9.5,10.25,11,11.75,12.5,15,23,30,33.5,37,40]) {
    f.seek(time);
    for(const name of ['input','target','prediction']) {
      assert([0,1].includes(+f.$(`[data-ray=${name}]`).dataset.progress));
      assert.equal(f.$(`[data-pulse=${name}]`).style.display,'none');
    }
    assert(!f.playing);
  }
  const live=fixture(t,'bert-ledger'); live.load(); live.open(); live.seek(10.25);
  assert.equal(+live.$('[data-ray=target]').dataset.progress,.5);
  live.reduce();
  assert.equal(+live.$('[data-ray=target]').dataset.progress,0);
  assert.equal(live.$('[data-pulse=target]').style.display,'none');
  close(live.time,10.25); assert(!live.playing);
});
test('BERT: a midpoint scrub reconstructs rays exactly and pause preserves their fractional progress', t => {
  const f=fixture(t,'bert-ledger'); f.load(); f.open();
  const routes=()=>['input','target','prediction'].map(name=>({
    ray:canonicalMarkup(f.$(`[data-ray=${name}]`).outerHTML),
    pulse:canonicalMarkup(f.$(`[data-pulse=${name}]`).outerHTML)
  }));
  f.seek(10.375); const expected=routes();
  f.seek(40); f.seek(4); f.seek(10.375); assert.deepEqual(routes(),expected);
  f.play(); f.tick(100,false); f.play();
  close(f.time,10.525); assert(!f.playing); assert.equal(f.frames.size,0);
  const paused=routes(); f.tick(1000); assert.deepEqual(routes(),paused);
  f.seek(10.525); assert.deepEqual(routes(),paused);
});
test('BERT: corruption is joint, never just the highlighted token; resize remeasures rays', t => {
  const f=fixture(t,'bert-ledger'); f.load();
  for(const time of [4,6,10,16,24,30,33.5,37,40]) {
    f.seek(time);
    assert.deepEqual([...f.root.querySelectorAll('[data-token] b')].map(n=>n.textContent),JSON.parse(f.root.dataset.corrupted));
  }
  const before=f.$('[data-ray=target]').getAttribute('d'); f.resize(280);
  assert.notEqual(f.$('[data-ray=target]').getAttribute('d'),before);
  assert.equal(f.$('.bert-rays').getAttribute('viewBox'),'0 0 280 264');
});
test('BERT: boundary scenes ramp their input route instead of arriving complete', t => {
  const f=fixture(t,'bert-ledger'); f.load(); f.open();
  const input=()=>+f.$('[data-ray=input]').dataset.progress;
  // The case before [SEP] ends with a finished route; the new scene must start from nothing.
  f.seek(31.99); assert.equal(input(),1);
  f.seek(32); assert.equal(input(),0);
  assert.equal(f.$('[data-ray=input]').style.display,'none');
  assert.equal(f.$('[data-ray=input]').getAttribute('marker-end'),'none');
  // [SEP] runs 32-35, so the shared clamp(4 * fraction) reaches one three quarters of a second in.
  for(const [time,expected] of [[32.1875,.25],[32.375,.5],[32.5625,.75],[32.75,1],[34,1],[34.99,1]]) {
    f.seek(time); close(input(),expected);
    assert.equal(f.$('[data-ray=input]').getAttribute('marker-end'),expected===1?'url(#bert-input-arrow)':'none');
  }
  f.seek(32.75); assert.equal(f.$('[data-pulse=input]').style.display,'none');
  f.seek(32.375); assert.equal(f.$('[data-pulse=input]').style.display,'');
  // [SEP] is never a target, so only the input route is ever drawn there.
  for(const time of [32,32.75,34.99]) {
    f.seek(time);
    for(const name of ['target','prediction']) assert.equal(+f.$(`[data-ray=${name}]`).dataset.progress,0);
  }
  // Padding has no input route at all; its scene ramps nothing.
  for(const time of [35,35.75,37,37.99]) {
    f.seek(time); assert.equal(+f.root.dataset.position,10); assert.equal(input(),0);
  }
  // The recap is a held summary, not a scene that redraws: it is complete on arrival.
  f.seek(38); assert.equal(+f.root.dataset.position,8); assert.equal(input(),1);
  for(const name of ['target','prediction']) assert.equal(+f.$(`[data-ray=${name}]`).dataset.progress,1);
});
test('BERT: declared beats are exactly the scene starts', t => {
  const f=fixture(t,'bert-ledger'); f.load();
  const beats=f.$('[data-pane]').dataset.beats.trim().split(/\s+/).map(Number);
  const title=time=>{f.seek(time); return f.$('[data-case]').textContent;};
  assert.equal(beats[0],0);
  const titles=beats.map(beat=>title(beat));
  assert.equal(new Set(titles).size,beats.length,'every scene announces a distinct case');
  beats.forEach((beat,index)=>{
    if(beat>0) assert.notEqual(title(beat-.01),titles[index],`a scene starts at ${beat}`);
    assert.equal(title(beat+.01),titles[index],`no scene starts just after ${beat}`);
  });
  assert.equal(title(40),titles.at(-1),'the last beat holds to the end');
});
test('BERT: the no-script rail is the t=40 rail, changed marks and all', t => {
  const rail=f=>[...f.root.querySelectorAll('[data-token]')].map(node=>({
    original:node.querySelector('.bert-original').textContent,
    input:node.querySelector('b').textContent,
    glyph:node.querySelector('.bert-change').textContent,
    choice:node.querySelector('[data-choice]').textContent,
    selected:node.classList.contains('is-selected'),
    changed:node.classList.contains('is-changed')
  }));
  const still=fixture(t,'bert-ledger');
  const played=fixture(t,'bert-ledger'); played.load(); played.open(); played.seek(40);
  const original=JSON.parse(played.root.dataset.original), corrupted=JSON.parse(played.root.dataset.corrupted);
  const {selected,random_sites}=JSON.parse(played.root.dataset.ledgers);
  const expected=original.map((token,i)=>({
    original:token, input:corrupted[i], glyph:corrupted[i]===token?'=':'↓',
    choice:selected[i]?(random_sites[i]?'chosen*':'chosen'):'',
    selected:Boolean(selected[i]), changed:corrupted[i]!==token}));
  assert.deepEqual(rail(played),expected,'the rendered end state follows the fixture');
  assert.deepEqual(rail(still),rail(played),'the reader without scripts sees the same rail');
  assert.deepEqual(rail(still).flatMap((row,i)=>row.changed?[i]:[]),[2,4,7],'three inputs differ from their original');
  assert.equal(rail(still).filter(row=>row.glyph==='=').length,9,'the other nine columns are marked unchanged');
});
test('BERT: the illustrative replacement is marked at the cell and footnoted under the rail', t => {
  const f=fixture(t,'bert-ledger');
  const footnote=f.$('[data-footnote]');
  assert(footnote,'the rail carries a footnote');
  assert.equal(f.$('[data-token-rail]').nextElementSibling,footnote,'it sits directly under the rail');
  assert.match(footnote.textContent,/position 4/i);
  assert.match(footnote.textContent,/illustrative random replacement/);
  assert.doesNotMatch(f.$('.mechanism-boundary').textContent,/illustrative random replacement/,
    'the caveat left the distant boundary paragraph');
  const choices=()=>[...f.root.querySelectorAll('[data-choice]')].map(n=>n.textContent);
  const label=index=>f.$(`[data-token="${index}"]`).getAttribute('aria-label');
  f.load();
  f.seek(0);
  assert.deepEqual(choices().filter(Boolean),[],'nothing is chosen before the corruption beat');
  assert.doesNotMatch(label(4),/illustrative/);
  for(const time of [4,10,25,40]) {
    f.seek(time);
    assert.deepEqual(choices(),['','','chosen','','chosen*','','','chosen','chosen','','',''],
      'only the replaced position carries the marker');
    assert.match(label(4),/Input is one illustrative random replacement\./);
    assert.match(label(4),/input bank/);
    for(const other of [2,7,8]) assert.doesNotMatch(label(other),/illustrative/);
  }
});
test('BERT: the caption announces itself as one atomic polite update', t => {
  const f=fixture(t,'bert-ledger');
  const caption=f.$('[data-caption]');
  assert.equal(caption.getAttribute('aria-live'),'polite');
  assert.equal(caption.getAttribute('aria-atomic'),'true');
  f.load(); f.seek(0); const first=caption.textContent;
  f.seek(13); assert.notEqual(caption.textContent,first);
});
test('integration: the manifest, not the filter, names the chapters; LaTeX guard is first', () => {
  const filter = fs.readFileSync(path.join(__dirname, '../filters/mechanism-excerpts.lua'), 'utf8');
  assert.match(filter, /^--[^\n]*\nif not FORMAT:match\("\^html"\) then return \{\} end/);
  // What used to be an if/elseif over two chapter names is now a read of the index.
  assert.match(filter, /manifest\.json/);
  assert.match(filter, /pandoc\.json\.decode/, 'the manifest is decoded, not parsed by hand');
  for (const type of ['after-cell', 'before-cell', 'before-heading'])
    assert(filter.includes(`"${type}"`), `the filter places no ${type} anchor`);
  assert.match(filter, /assert\(inserted == 1/, 'each scene still fails closed');
  assert.match(filter, /block\.level == 2 or block\.level == 3/,
    'exact subsection anchors place optional replays outside code panels');
  for (const typed of ['cell-fig-kernel-lookup', 'cell-fig-mlm-policy', 'kernel-weighting', 'bert-ledger'])
    assert(!filter.includes(typed), `${typed} is manifest data; the filter must not retype it`);
  const config = fs.readFileSync(path.join(__dirname, '../_quarto.yml'), 'utf8');
  for (const asset of ['shared/playback.js', 'kernel-weighting/player.js', 'bert-ledger/player.js'])
    assert(config.includes(`interactives/${asset}`));
});
test('integration: the manifest indexes every shipped scene, its filter, and its fetched asset', () => {
  const config = fs.readFileSync(path.join(__dirname, '../_quarto.yml'), 'utf8');
  const section = (key, text) => {
    const start = text.indexOf(`\n${key}`);
    assert(start >= 0, `${key} is missing from _quarto.yml`);
    const rest = text.slice(start + 1 + key.length);
    const end = rest.search(/\n\S/);
    return end < 0 ? rest : rest.slice(0, end);
  };
  const resources = section('  resources:', config), filters = section('filters:', config);
  const listed = value => new RegExp(`^\\s+- ${value.replace(/[/.]/g, '\\$&')}$`, 'm');
  assert.equal(manifest.schemaVersion, 1);
  assert(manifest.scenes.length >= Object.keys(ids).length);
  for (const scene of manifest.scenes) {
    for (const asset of ['panel.html', 'player.js'])
      assert(fs.existsSync(path.join(__dirname, '../interactives', scene.scene, asset)), `${scene.id} ${asset}`);
    // Only the scene script is fetched by a reader. Panels, styles and the manifest are read
    // from the project directory while the book builds, so nothing else belongs here.
    assert.match(resources, listed(`interactives/${scene.scene}/player.js`), `${scene.id} is not published`);
    assert.match(filters, listed(scene.filter), `${scene.id} has no registered filter`);
    const lua = fs.readFileSync(path.join(__dirname, '..', scene.filter), 'utf8');
    if (/manifest\.json/.test(lua)) {
      // A manifest-driven filter names no scene and no cell: this entry is its input, so
      // what it must still prove is that it can place an anchor of this kind at all.
      assert(lua.includes(`"${scene.anchor.type}"`),
        `${scene.filter} reads the manifest but places no ${scene.anchor.type} anchor`);
    } else {
      assert(lua.includes(scene.anchor.target), `${scene.filter} does not anchor on ${scene.anchor.target}`);
      assert(lua.includes(scene.scene), `${scene.filter} never loads ${scene.scene}`);
    }
    assert.equal(scene.transport === 'shared',
      read(`${scene.scene}/panel.html`).includes('data-playback='), `${scene.id} transport`);
  }
  assert.match(resources, listed('interactives/shared/playback.js'));
  assert(!config.includes('interactives/manifest.json'),
    'the manifest is a build-time index, not a published site resource');
});
test('integration: the scene template is a skeleton, never a shipped scene', () => {
  const template = path.join(__dirname, '../interactives/_template');
  for (const file of ['panel.html', 'player.js', 'player.css', 'README.md'])
    assert(fs.existsSync(path.join(template, file)), `the template is missing ${file}`);
  assert(fs.readFileSync(path.join(template, 'panel.html'), 'utf8').includes('<!-- PLAYER_CONTROLS -->'),
    'a copied panel must already carry the control placeholder the filter substitutes');
  assert.equal(manifest.scenes.filter(scene => scene.scene === '_template').length, 0,
    'no manifest entry may name the template, or the filter would try to ship it');
  const config = fs.readFileSync(path.join(__dirname, '../_quarto.yml'), 'utf8');
  assert(!config.includes('_template'), 'the template is never a published resource');
});
test('integration: the template README documents a receipt row the fixture audit can read', () => {
  // The README is the document a new scene's author follows. Its provenance-row example is
  // parsed by scripts/audit_excerpt_fixtures.py, so it is checked against that script's own
  // pattern rather than against a copy of it: a three-column row fails the audit loudly for
  // a chapter row and silently stops checking a lecture row, and no test said so.
  const audit = fs.readFileSync(path.join(__dirname, 'audit_excerpt_fixtures.py'), 'utf8');
  const source = /^HASH_ROW_RE = re\.compile\(r"(.+)", re\.M\)$/m.exec(audit);
  assert(source, 'audit_excerpt_fixtures.py no longer defines HASH_ROW_RE on one line');
  const rowPattern = new RegExp(source[1], 'm');
  const readme = fs.readFileSync(path.join(__dirname, '../interactives/_template/README.md'), 'utf8');
  // Every row-shaped example the README shows, with the placeholders filled in exactly as
  // an author copying it would fill them.
  const examples = (readme.match(/\|[^\n`]*`[^`\n]+`[^\n]*\|/g) || [])
    .map(example => example
      .replace('`<64 hex>`', '`' + 'a1b2c3d4'.repeat(8) + '`')
      .replace('`chapters/…qmd`', '`chapters/part1/02-logistic-softmax.qmd`')
      .replace(/\\`/g, '`').trim());
  assert(examples.length > 0, 'the template README shows no provenance row at all');
  for (const example of examples) {
    assert(rowPattern.test(example),
      `the template README shows a provenance row the audit cannot parse:\n  ${example}`);
  }
  // The rule itself, not only an example that happens to obey it.
  assert.match(readme, /two columns/i,
    'the README does not say the provenance row has exactly two columns');
});
