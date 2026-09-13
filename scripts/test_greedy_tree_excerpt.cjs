#!/usr/bin/env node
// Independent probability-tree oracle. No model execution or training evidence.
const assert = require('node:assert/strict');
const test = require('node:test');
const {entry, read, chapterSource, close, fixture, canonicalMarkup,
  registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'greedy-tree-excerpt';
const scene = entry(NAME);
const FIXTURE = {root:[0.60,0.40], next:[0.55,0.95], eos:[0.80,0.95]};
const TIMES = [0,2.5,5,7.5,10,12.5,15,18,20,22.5,25,27.5,30,32.5,35,40];
const WIDTHS = [240,296,360,519,559,560,713];
const plain = value => JSON.parse(JSON.stringify(value));

function oracle(source = FIXTURE) {
  const [a,b] = source.root, [x,y] = source.next, [ae,be] = source.eos;
  const probabilities = values => values.sort((left,right) => right-left);
  return {
    root:probabilities([a,b]),
    prefix:probabilities([a*x,b*y,a*(1-x),b*(1-y)]),
    final:probabilities([a*x*ae,b*y*be,a*x*(1-ae),b*y*(1-be)]),
    greedy:a*x*ae, alternative:b*y*be,
    others:[a*(1-x),b*(1-y),a*x*(1-ae),b*y*(1-be)]
  };
}
function checkCandidates(rows, expected, kept) {
  assert.equal(rows.length, expected.length);
  rows.forEach((row,index) => {
    close(row.probability,expected[index]);
    close(Math.exp(row.logProbability),row.probability);
    assert.equal(row.kept,index<kept);
    assert(Array.isArray(row.tokens));
  });
}
function checkState(state,source = FIXTURE) {
  const wanted = oracle(source);
  close(state.greedyJoint,wanted.greedy);
  close(state.alternativeJoint,wanted.alternative);
  checkCandidates(state.rootCandidates,wanted.root,2);
  checkCandidates(state.prefixCandidates,wanted.prefix,2);
  checkCandidates(state.finalCandidates,wanted.final,2);
  close(state.maxOtherBound,Math.max(...wanted.others));
  assert(state.maxOtherBound<state.alternativeJoint);
  assert(state.greedyJoint<state.alternativeJoint);
  assert(state.finalCandidates.slice(0,2).every(row=>row.done));
  assert(state.finalCandidates.slice(2).every(row=>!row.done));
}

registerTransportTests(NAME,{witness:/0\.264[\s\S]*0\.361|0\.361[\s\S]*0\.264/,width:713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('Greedy tree: fixture is shared with the static chapter, not the trained date results',t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  assert.deepEqual(plain(JSON.parse(f.root.dataset.fixture)),FIXTURE);
  assert.equal(scene.qmd,'chapters/part3/11-encoder-decoder.qmd');
  assert.deepEqual(scene.beats,[0,5,10,15,20,25,30,35]);
  assert.equal(scene.duration,40);
  const chapter=chapterSource(NAME);
  for(const literal of scene.fixture.literals) assert(chapter.includes(literal),literal);
  assert.match(chapter,/tbl-greedy-tree/);
  assert.match(chapter,/specified toy decoder, not a measured model/);
  assert.match(chapter,/finite beam does not guarantee/);
  assert.match(chapter,/### Search exposes alternatives/);
});

test('Greedy tree: every conditional distribution and enumerated frontier is normalized',t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  const state=f.w.BookGreedyTree.buildState(40);
  close(FIXTURE.root.reduce((a,b)=>a+b,0),1);
  FIXTURE.next.concat(FIXTURE.eos).forEach(p=>close(p+(1-p),1));
  checkState(state);
  close(state.rootCandidates.reduce((sum,row)=>sum+row.probability,0),1);
  close(state.prefixCandidates.reduce((sum,row)=>sum+row.probability,0),1);
  close(state.finalCandidates.reduce((sum,row)=>sum+row.probability,0),0.71);
  // After pruning, this is retained prefix mass, not a newly normalized posterior.
  assert.notEqual(state.finalCandidates.reduce((sum,row)=>sum+row.probability,0),1);
});

test('Greedy tree: local winners lose globally, with all omitted continuations bounded',t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  const state=f.w.BookGreedyTree.buildState(40);
  checkState(state);
  close(state.greedyJoint,264/1000);
  close(state.alternativeJoint,361/1000);
  close(state.maxOtherBound,27/100);
  close(state.alternativeJoint-state.maxOtherBound,91/1000);
  assert(FIXTURE.root[0]>FIXTURE.root[1]);
  assert(FIXTURE.next[0]>1-FIXTURE.next[0]);
  assert(FIXTURE.eos[0]>1-FIXTURE.eos[0]);
  // Even arbitrary continuation probabilities cannot increase a prefix's mass.
  for(const bound of oracle().others) for(const continuation of [0,0.01,0.2,0.75,1])
    assert(bound*continuation<=state.maxOtherBound);
});

test('Greedy tree: beam ranks cumulative probabilities, not isolated last-edge probabilities',t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  const state=f.w.BookGreedyTree.buildState(30);
  close(state.prefixCandidates[0].probability,.38);
  close(state.prefixCandidates[1].probability,.33);
  close(state.prefixCandidates[2].probability,.27);
  close(state.prefixCandidates[3].probability,.02);
  close(state.finalCandidates[0].probability,.361);
  close(state.finalCandidates[1].probability,.264);
  close(state.finalCandidates[2].probability,.066);
  close(state.finalCandidates[3].probability,.019);
});

test('Greedy tree: playback never changes the decoder probabilities',t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  const build=f.w.BookGreedyTree.buildState;
  const reference=plain(build(40));
  for(const time of TIMES) {
    const state=build(time); checkState(state);
    for(const key of ['rootCandidates','prefixCandidates','finalCandidates','greedyJoint','alternativeJoint'])
      assert.deepEqual(plain(state[key]),reference[key],`${key} at ${time}`);
  }
});

test('Greedy tree: beam width is capacity, not prefix depth or the current candidate count',t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  const paths=[['BOS','A','Ax'],['BOS','B','By']];
  for(const time of TIMES) for(const reduced of [false,true]) {
    const state=f.w.BookGreedyTree.buildState(time,reduced);
    const stage=Math.min(7,Math.floor(time/5)),depth=stage%4;
    const width=stage<4?1:2,prefixDepth=Math.max(0,depth-1);
    const expected=prefixDepth===0?[['BOS']]:paths.slice(0,width).map(row=>row.slice(0,prefixDepth+1));
    assert.equal(state.beamWidth,width,`capacity at ${time}`);
    assert.equal(state.prefixDepth,prefixDepth,`parent depth at ${time}`);
    assert.deepEqual(plain(state.prefixIds),expected,`conditioning paths at ${time}`);
    assert(state.retainedIds.length<=state.beamWidth);
    if(depth===0) assert.equal(state.retainedIds.length,1,'one BOS prefix before expansion, even with beam width two');
    checkState(state);
  }
});

test('Greedy tree: each conditional names its own prefix, with only parent nodes highlighted',t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  const contexts={Ax:'given A',By:'given B',AxEOS:'given A x',ByEOS:'given B y'};
  const prefixes=[[],[],['A'],['A','Ax'],[],[],['A','B'],['A','Ax','B','By']];
  for(const width of [296,713]) {
    f.resize(width);
    for(const time of TIMES) {
      f.seek(time);
      const stage=Math.min(7,Math.floor(time/5));
      for(const [id,text] of Object.entries(contexts)) {
        const label=f.$(`[data-context="${id}"]`),conditional=f.$(`[data-conditional="${id}"]`);
        assert(label,`context for ${id}`);
        assert.equal(label.textContent,text);
        assert.equal(label.hasAttribute('hidden'),conditional.hasAttribute('hidden'),`${id} context and conditional reveal together`);
      }
      const actual=[...f.$('[data-drawing]').querySelectorAll('[data-node][data-prefix="yes"]')]
        .map(node=>node.dataset.node).sort();
      assert.deepEqual(actual,[...prefixes[stage]].sort(),`parent paths at ${time}`);
      for(const node of f.$('[data-drawing]').querySelectorAll('[data-node]'))
        assert.equal(node.dataset.prefix,prefixes[stage].includes(node.dataset.node)?'yes':'no');
      for(const depth of [1,2,3]) {
        const guide=f.$(`[data-depth-guide="${depth}"]`);
        assert(guide,`depth ${depth} guide`);
        assert.match(guide.textContent,new RegExp(`\\b${depth}\\b`));
        assert.equal(guide.dataset.current,stage%4===depth?'yes':'no');
      }
    }
  }
});

test('Greedy tree: two retained completions remain alternatives when one answer is requested',t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  for(const time of TIMES) {
    f.seek(time);
    const stage=Math.min(7,Math.floor(time/5));
    const expected=stage===3?'AxEOS':stage===7?'ByEOS':null;
    const state=f.w.BookGreedyTree.buildState(time);
    assert.equal(state.selectedId,expected);
    const selected=[...f.$('[data-drawing]').querySelectorAll('[data-node][data-selected="yes"]')];
    assert.deepEqual(selected.map(node=>node.dataset.node),expected?[expected]:[]);
    for(const node of f.$('[data-drawing]').querySelectorAll('[data-node]'))
      assert.equal(node.dataset.selected,node.dataset.node===expected?'yes':'no');
    if(expected) {
      const rings=[...f.$('[data-drawing]').querySelectorAll('[data-frontier]:not([hidden])')];
      assert.equal(rings.length,1,'only the top completion keeps a frontier ring');
      assert.equal(rings[0].dataset.selected,'yes');
      assert.equal(f.$(`[data-node-status="${expected}"]`).textContent,stage===3?'greedy':'top choice');
      assert(state.finalCandidates.find(row=>row.id===expected).done,'selected sequence includes EOS');
      const other=expected==='AxEOS'?'ByEOS':'AxEOS';
      assert.equal(f.$(`[data-node-status="${other}"]`).textContent,stage===3?'missed':'runner-up');
    }
    if(stage===7) {
      assert.equal(state.retainedIds.length,2,'beam retains two finished candidates');
      assert.equal(selected.length,1,'only its highest scoring completion is the top choice');
      assert.equal(f.$('[data-node="ByEOS"]').dataset.state,'winner');
    }
  }
});

test('Greedy tree: transferable cues do not relabel search as speculative verification',t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  assert.doesNotMatch(f.root.textContent,/\b(?:EAGLE|DSpark|speculative|acceptance)\b/i);
  for(const time of TIMES) {
    f.seek(time);
    assert.doesNotMatch(f.$('[data-drawing]').textContent+' '+f.$('[data-caption]').textContent,
      /\b(?:EAGLE|DSpark|speculative|acceptance|accepted|rejected)\b/i);
    if(time>=25) assert.match(f.$('[data-picture-title]').textContent,/\b(?:width|two|2)\b/i);
  }
  const boundary=f.$('.mechanism-boundary').textContent;
  assert.match(read('greedy-tree/panel.html'),/\\featurepart\{y_\{&lt;t\},c\}/,
    'the formula carries the same blue supplied-prefix role as the diagram');
  assert.match(boundary,/predictor stays fixed/i);
  assert.match(boundary,/chapter's code keeps the ranked list for inspection/,
    'the optional one-answer illustration does not change the chapter helper return contract');
  assert.match(boundary,/not renormalized over the beam/);
  assert.match(boundary,/other[\s\S]*groups unexpanded alternatives; its mass bounds every completion/i);
});

test('Greedy tree: each log score adds the next conditional log to its parent',t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  const state=f.w.BookGreedyTree.buildState(40);
  const candidates=Object.fromEntries([...state.rootCandidates,...state.prefixCandidates,
    ...state.finalCandidates].map(row=>[row.id,row]));
  for(const id of ['A','B'])
    assert.equal(candidates[id].logProbability,Math.log(state.conditional[id]));
  for(const [id,parent] of [['Ax','A'],['By','B'],['Aother','A'],['Bother','B'],
    ['AxEOS','Ax'],['ByEOS','By'],['Axother','Ax'],['Byother','By']])
    assert.equal(candidates[id].logProbability,
      candidates[parent].logProbability+Math.log(state.conditional[id]));
});

test('Greedy tree: supported alternate trees preserve arithmetic without mutation',t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  for(const source of [
    {root:[.65,.35],next:[.51,.99],eos:[.60,.99]},
    {root:[.55,.45],next:[.60,.90],eos:[.75,.90]}
  ]) {
    const before=JSON.stringify(source);
    for(const time of TIMES) checkState(f.w.BookGreedyTree.buildState(time,false,source),source);
    assert.equal(JSON.stringify(source),before);
  }
});

test('Greedy tree: invalid or incomplete fixtures fail closed',t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  const build=f.w.BookGreedyTree.buildState;
  for(const patch of [{root:[]},{root:[.6]},{root:[.6,.6]},
    {root:[NaN,.4]},{next:[0,.95]},{next:[.55,Infinity]},
    {eos:[1.1,.95]},{eos:[.8]}, {next:[.1,.2]}])
    assert.throws(()=>build(40,false,{...FIXTURE,...patch}));
});

test('Greedy tree: scrubbing back over the pruning decision restores the same drawn state',t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  for(const width of WIDTHS) {
    f.resize(width);
    for(const time of TIMES) {
      f.seek(time);
      const expected=canonicalMarkup(f.$('[data-drawing]').innerHTML);
      f.seek(40); f.seek(0); f.seek(17); f.seek(time);
      assert.equal(canonicalMarkup(f.$('[data-drawing]').innerHTML),expected);
    }
  }
});

test('Greedy tree: the static final-frame SVG is current at both widths',async()=>{
  const generated=await staticFrame(NAME);
  assert.equal(generated.before,generated.after);
});

test('Greedy tree: narrow frames reflow the tree, not the text size',t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  const css=read('greedy-tree/player.css');
  assert(!/font-size:\s*(?:[1-9]|10|11)px\b/.test(css),'essential labels stay at least12px');
  for(const width of WIDTHS) {
    f.resize(width); f.seek(40);
    const box=f.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/).map(Number);
    close(box[2],width);
    for(const label of f.$('[data-drawing]').querySelectorAll('text[x][y]')) {
      const x=Number(label.getAttribute('x')),y=Number(label.getAttribute('y'));
      assert(x>=0&&x<=box[2],`${label.textContent}:x=${x}`);
      assert(y>=0&&y<=box[3],`${label.textContent}:y=${y}`);
    }
  }
});

test('Greedy tree: drawn edges stop at nodes and the frontier reaches the earned depth',t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  for(const width of WIDTHS) {
    f.resize(width);
    for(const [time,depth] of [[5,0],[10,1],[15,2],[25,0],[30,1],[35,2]]) {
      f.seek(time);
      const positions=JSON.parse(f.root.dataset.nodePositions);
      for(const branch of [0,1]) {
        const marker=f.$(`[data-frontier="${branch}"]`);
        if(marker.hasAttribute('hidden')) continue;
        close(Number(marker.getAttribute('cx')),positions[branch][depth][0]);
        close(Number(marker.getAttribute('cy')),positions[branch][depth][1]);
      }
      for(const wire of f.$('[data-drawing]').querySelectorAll('[data-edge]')) {
        const coords=wire.getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number);
        assert.equal(coords.length,4);
        const target=f.$(`[data-node="${wire.dataset.to}"]`);
        const [x,y]=JSON.parse(target.dataset.position);
        const dx=Math.abs(coords[2]-x),dy=Math.abs(coords[3]-y);
        assert(dx<=26+1e-8&&dy<=17+1e-8);
        assert(Math.abs(dx-26)<1e-8||Math.abs(dy-17)<1e-8,'ends on the rectangle, not inside');
      }
    }
  }
});

test('Greedy tree: no new runtime, iframe or parameter control',()=>{
  const panel=read('greedy-tree/panel.html'),script=read('greedy-tree/player.js');
  assert(!/<iframe|<video|<canvas/i.test(panel));
  assert(!/React|Babel|setInterval|eval\(/.test(script));
  assert(!/<input/.test(panel),'all controls belong to shared transport');
  assert.match(panel,/Finite-width beam search need not find the global optimum/);
});
