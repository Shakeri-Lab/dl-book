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
        // Drawing coordinates are serialised at 0.0001 px; the state behind them is not rounded.
        const dx=Math.abs(coords[2]-x),dy=Math.abs(coords[3]-y);
        assert(dx<=26+1e-3&&dy<=17+1e-3);
        assert(Math.abs(dx-26)<1e-3||Math.abs(dy-17)<1e-3,'ends on the rectangle, not inside');
      }
    }
  }
});

// ---- Review pass, September 17, 2026 -------------------------------------------------
// JSDOM lays nothing out, so a label's box is estimated the way the gate-product suite
// does it: a generous advance per glyph at the label's real CSS size (0.6 em; capitals
// 0.75; a space 0.3; bold a little wider), spanning baseline - 0.72 s ... baseline + 0.2 s.
const CSS=read('greedy-tree/player.css');
const cssPx=selector=>{
  const rule=new RegExp(selector.replace(/[.*+?^${}()|[\]\\"=]/g,'\\$&')+'\\s*\\{[^}]*?font-size:\\s*(\\d+)px').exec(CSS);
  assert(rule,`player.css sizes ${selector}`); return Number(rule[1]);
};
const SIZE={base:cssPx('.gt-figure text'),small:cssPx('.gt-figure .gt-small'),
  heading:cssPx('.gt-figure .gt-heading'),muted:cssPx('.gt-figure [data-emphasis="muted"]')};
const GEOMETRY_WIDTHS=[240,247,296,302,360,519,559,560,640,713,1280];
const GEOMETRY_TIMES=[0,2,5,7,10,12,14,15,17,20,22,24,25,27,30,32,34,35,37,39.9,40];
const advance=text=>[...text].reduce((sum,ch)=>sum+(ch===' '?0.3:/[A-Z]/.test(ch)?0.75:0.6),0);
const shown=node=>!node.closest('[hidden]');
function labelBoxes(f) {
  return [...f.$('[data-drawing]').querySelectorAll('text')].filter(node=>shown(node)&&node.textContent).map(node=>{
    const cls=node.getAttribute('class')||'',emphasis=node.getAttribute('data-emphasis');
    const size=emphasis==='muted'?SIZE.muted:/\bgt-heading\b/.test(cls)?SIZE.heading:/\bgt-small\b/.test(cls)?SIZE.small:SIZE.base;
    const heavy=emphasis==='score'||node.dataset.current==='yes'?1.08:/\bgt-heading\b/.test(cls)?1.06:1;
    const group=node.closest('[data-node]'),[ox,oy]=group?JSON.parse(group.dataset.position):[0,0];
    const x=ox+Number(node.getAttribute('x')),y=oy+Number(node.getAttribute('y'));
    const width=advance(node.textContent)*size*heavy,anchor=node.getAttribute('text-anchor');
    const x0=anchor==='end'?x-width:anchor==='middle'?x-width/2:x;
    return {text:node.textContent,node,inNode:Boolean(group),x0,x1:x0+width,y0:y-0.72*size,y1:y+0.2*size};
  });
}
function segments(f) {
  return [...f.$('[data-drawing]').querySelectorAll('[data-edge],[data-other-edge]')].filter(shown).map(wire=>{
    const c=wire.getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number);
    assert.equal(c.length,4,'an edge is one straight segment');
    return {name:`${wire.dataset.from}→${wire.dataset.to}`,a:[c[0],c[1]],b:[c[2],c[3]]};
  });
}
// Does the segment come within `margin` of the box? Clip the segment against the grown box.
function segmentHitsBox(segment,box,margin) {
  const [x0,y0,x1,y1]=[box.x0-margin,box.y0-margin,box.x1+margin,box.y1+margin];
  const [ax,ay]=segment.a,dx=segment.b[0]-ax,dy=segment.b[1]-ay;
  let lo=0,hi=1;
  for(const [p,q] of [[-dx,ax-x0],[dx,x1-ax],[-dy,ay-y0],[dy,y1-ay]]) {
    if(p===0){if(q<0)return false;continue;}
    const r=q/p; if(p<0)lo=Math.max(lo,r); else hi=Math.min(hi,r);
    if(lo>hi)return false;
  }
  return true;
}
// Does the ring's stroke (radius r, half-width `margin`) pass through the box?
function ringHitsBox(ring,box,margin) {
  const nearestX=Math.max(box.x0,Math.min(ring.cx,box.x1)),nearestY=Math.max(box.y0,Math.min(ring.cy,box.y1));
  const nearest=Math.hypot(nearestX-ring.cx,nearestY-ring.cy);
  const farthest=Math.max(...[[box.x0,box.y0],[box.x1,box.y0],[box.x0,box.y1],[box.x1,box.y1]]
    .map(([x,y])=>Math.hypot(x-ring.cx,y-ring.cy)));
  return nearest<=ring.r+margin&&farthest>=ring.r-margin;
}

test('Greedy tree: no label is crossed by an edge, by a resting frontier ring, or by another label, at either layout',t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  const layouts=new Set();
  for(const reduced of [false,true]) {
    if(reduced) f.reduce();
    for(const width of GEOMETRY_WIDTHS) {
      f.resize(width); layouts.add(f.root.dataset.layout);
      for(const time of GEOMETRY_TIMES) {
        f.seek(time);
        const where=`at ${width}px, ${time}s${reduced?' (reduced motion)':''}`;
        const [, ,boxWidth,boxHeight]=f.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/).map(Number);
        const boxes=labelBoxes(f),wires=segments(f);
        assert.equal(wires.filter(wire=>/^(?:BOS|A|Ax|B|By)→(?:A|Ax|AxEOS|B|By|ByEOS)$/.test(wire.name)).length,6,'the six tree edges are always drawn');
        for(const box of boxes) {
          assert(box.x0>=-0.5&&box.x1<=boxWidth+0.5,`"${box.text}" leaves the picture sideways ${where}: ${box.x0.toFixed(1)}…${box.x1.toFixed(1)} of ${boxWidth}`);
          assert(box.y0>=0&&box.y1<=boxHeight,`"${box.text}" leaves the picture vertically ${where}`);
          // 1.3 px is half the heaviest rail; 2.5 px leaves air a reader can see.
          for(const wire of wires)
            assert(!segmentHitsBox(wire,box,2.5),`edge ${wire.name} strikes "${box.text}" ${where}`);
        }
        // A ring is tested where it rests on a node (or on BOS), which is where the reader reads.
        // Mid-glide it necessarily sweeps along the edge it travels, labels and all.
        const stops=[JSON.parse(f.root.dataset.origin),...JSON.parse(f.root.dataset.nodePositions).flat()];
        for(const marker of [...f.$('[data-drawing]').querySelectorAll('[data-frontier]')].filter(shown)) {
          const ring={cx:Number(marker.getAttribute('cx')),cy:Number(marker.getAttribute('cy')),r:Number(marker.getAttribute('r'))};
          if(!stops.some(([x,y])=>Math.hypot(x-ring.cx,y-ring.cy)<1e-3)) continue;
          // Its stroke is 3 px when selected: 1.5 px half-width, plus 1 px of air.
          for(const box of boxes)
            assert(!ringHitsBox(ring,box,2.5),`the frontier ring cuts "${box.text}" ${where}`);
        }
        for(let i=0;i<boxes.length;i++) for(let j=i+1;j<boxes.length;j++) {
          const a=boxes[i],b=boxes[j];
          if(a.y1<=b.y0+0.5||b.y1<=a.y0+0.5) continue;
          assert(a.x1<=b.x0+0.5||b.x1<=a.x0+0.5,`"${a.text}" and "${b.text}" overlap ${where}`);
        }
      }
    }
  }
  assert.deepEqual([...layouts].sort(),['narrow','wide'],'both layouts were exercised');
});

test('Greedy tree: every beat parks its rings on nodes, so the ring check above covers every held picture',t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  for(const width of [296,713]) {
    f.resize(width);
    for(const time of [...scene.beats,scene.duration]) {
      f.seek(time);
      const stops=[JSON.parse(f.root.dataset.origin),...JSON.parse(f.root.dataset.nodePositions).flat()];
      const rings=[...f.$('[data-drawing]').querySelectorAll('[data-frontier]')].filter(shown);
      assert(rings.length>=1);
      for(const marker of rings)
        assert(stops.some(([x,y])=>Math.hypot(x-Number(marker.getAttribute('cx')),y-Number(marker.getAttribute('cy')))<1e-3),
          `a ring is still in flight at the ${time}s beat`);
    }
  }
});

test('Greedy tree: phone labels sit on the outer side of their rail; the desktop score clears the winner ring',t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  for(const width of [240,296,302,559]) {
    f.resize(width); f.seek(40);
    assert.equal(f.root.dataset.layout,'narrow');
    const positions=JSON.parse(f.root.dataset.nodePositions);
    for(const box of labelBoxes(f)) {
      const id=box.node.dataset.cumulative||box.node.dataset.rank||box.node.dataset.conditional||box.node.dataset.context;
      if(!id) continue;
      const branch=id.startsWith('A')?0:1,rail=positions[branch][0][0];
      if(box.node.dataset.conditional&&id.length===1) {
        // A first-token factor labels a BOS diagonal: the whole box lies on that diagonal's outer side.
        const wire=segments(f).find(segment=>segment.name===`BOS→${id}`);
        const side=([x,y])=>Math.sign((wire.b[0]-wire.a[0])*(y-wire.a[1])-(wire.b[1]-wire.a[1])*(x-wire.a[0]));
        const outward=side([branch===0?0:width,(wire.a[1]+wire.b[1])/2]);
        for(const corner of [[box.x0,box.y0],[box.x1,box.y0],[box.x0,box.y1],[box.x1,box.y1]])
          assert.equal(side(corner),outward,`"${box.text}" straddles its diagonal at ${width}px`);
        continue;
      }
      if(branch===0) assert(box.x1<rail-2.5,`"${box.text}" is not left of the left rail at ${width}px`);
      else assert(box.x0>rail+2.5,`"${box.text}" is not right of the right rail at ${width}px`);
    }
    assert(SIZE.base>=13&&SIZE.small>=12&&SIZE.muted>=12,'labels move; their native type size does not shrink');
  }
  f.resize(713); f.seek(40);
  const ring=f.$('[data-frontier]:not([hidden])'),score=labelBoxes(f).find(box=>box.node.dataset.cumulative==='ByEOS');
  assert.equal(ring.dataset.selected,'yes');
  assert.equal(score.text,'p 0.361');
  assert(score.y1<Number(ring.getAttribute('cy'))-Number(ring.getAttribute('r'))-1.5,'the winning score sits above the ring, not under its top arc');
});

test('Greedy tree: few live numbers — the newest depth is live, the rest stay but muted',t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  const numbered=()=>[...f.$('[data-drawing]').querySelectorAll('[data-emphasis]')].filter(shown);
  const live=()=>numbered().filter(node=>node.dataset.emphasis!=='muted').map(node=>node.textContent).sort();
  const expected={
    2:['0.40','0.60'], 7:['0.40','0.60','p 0.600'], 12:['0.55','p 0.330'],
    17:['0.361 > 0.264','p 0.264','p 0.361'],
    22:['0.40','0.60'], 27:['#1','#2','0.40','0.60','p 0.400','p 0.600'],
    32:['#1','#2','0.55','0.95','p 0.330','p 0.380','≤ 0.020','≤ 0.270'],
    37:['#1','#2','0.361 > 0.264','p 0.264','p 0.361'], 40:['#1','#2','0.361 > 0.264','p 0.264','p 0.361']
  };
  for(const width of [296,713]) {
    f.resize(width);
    for(const time of TIMES.concat([2,7,12,17,22,27,32,37])) {
      f.seek(time);
      assert(live().length<=8,`${live().length} emphasised numbers at ${time}s: ${live().join(', ')}`);
      if(expected[time]) assert.deepEqual(live(),[...expected[time]].sort(),`numbers in play at ${time}s`);
    }
    // The limit frame mutes; it removes nothing the author approved.
    f.seek(40);
    const text=selector=>[...f.$('[data-drawing]').querySelectorAll(selector)].filter(shown).map(node=>node.textContent).sort();
    assert.deepEqual(text('[data-conditional]'),['0.40','0.55','0.60','0.80','0.95','0.95']);
    assert.deepEqual(text('[data-cumulative]'),['p 0.264','p 0.330','p 0.361','p 0.380','p 0.400','p 0.600']);
    assert.deepEqual(text('[data-other-label]'),['other 0.05','other 0.05','other 0.20','other 0.45']);
    assert.deepEqual(text('[data-other-bound]'),['≤ 0.019','≤ 0.020','≤ 0.066','≤ 0.270']);
    assert.deepEqual(text('[data-context]'),['given A','given A x','given B','given B y']);
    for(const node of f.$('[data-drawing]').querySelectorAll('[data-conditional],[data-other-bound]'))
      assert.equal(node.dataset.emphasis,'muted',`${node.textContent} is no longer in play once the products are shown`);
    for(const id of ['AxEOS','ByEOS']) assert.equal(f.$(`[data-cumulative="${id}"]`).dataset.emphasis,'score');
    assert.equal(f.$('[data-comparison]').dataset.emphasis,'score');
    assert.equal(f.$('[data-comparison]').textContent,'0.361 > 0.264');
    // An `other` stub is a bound on unexpanded mass, never a named token.
    for(const stub of f.$('[data-drawing]').querySelectorAll('[data-other]')) {
      assert.match(stub.querySelector('[data-other-label]').textContent,/^other 0\.\d\d$/);
      assert.match(stub.querySelector('[data-other-bound]').textContent,/^≤ 0\.\d{3}$/);
      assert.equal(stub.querySelectorAll('rect,circle').length,0,'a stub has no node of its own');
    }
  }
  assert.match(CSS,/\[data-emphasis="muted"\]\s*\{[^}]*fill:\s*var\(--gt-muted\)/);
  assert.match(CSS,/\[data-emphasis="score"\]\s*\{[^}]*font-weight:\s*700/);
});

test('Greedy tree: the picture names candidates by their tokens, and numbers are announced in one place',t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  const range=f.$('[data-controls] input[type=range]'),picture=f.$('[data-figure] svg');
  const retained={7:'A',12:'A x',17:'A x EOS',27:'A, B',32:'B y, A x',37:'B y EOS, A x EOS',40:'B y EOS, A x EOS'};
  for(const time of TIMES.concat([2,7,12,17,22,27,32,37])) {
    f.seek(time);
    const spoken=picture.getAttribute('aria-label');
    assert.doesNotMatch(spoken,/AxEOS|ByEOS|\bAx\b|\bBy\b|other\b(?!-)/,`internal ids in "${spoken}"`);
    assert.doesNotMatch(spoken,/\d-\d|\de[-+]?\d/,'no ASCII minus or e-notation');
    if(retained[time]) assert(spoken.includes(` Retained: ${retained[time]}.`),`${time}s: ${spoken}`);
    // The scrubber names the beat; the probabilities are spoken by the picture alone.
    const valuetext=range.getAttribute('aria-valuetext').replace(/^\d+:\d\d of \d+:\d\d\. /,'');
    assert.doesNotMatch(valuetext,/\d\.\d/,`the scrubber repeats a probability at ${time}s: ${valuetext}`);
    assert.doesNotMatch(f.$('[data-caption]').textContent,/0\.\d/,'captions carry no live number');
  }
  assert.match(read('greedy-tree/panel.html'),/<svg[^>]*aria-label="[^"]*Retained: B y EOS, A x EOS\./,'the static print says the same');
});

test('Greedy tree: within a beat only the frontier moves; fixture and layout work is not redone per frame',t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  const still=()=>{
    const copy=f.$('[data-drawing]').cloneNode(true);
    copy.querySelectorAll('[data-frontier]').forEach(node=>node.remove());
    return canonicalMarkup(copy.innerHTML);
  };
  for(const width of [296,713]) {
    f.resize(width);
    for(const [from,to] of [[2.2,4.8],[7.2,9.9],[12.1,14.9],[22.5,24.9],[27.1,29.9],[32.1,34.9]]) {
      f.seek(from); const before=still(),ring=f.$('[data-frontier="0"]').getAttribute('cx')+','+f.$('[data-frontier="0"]').getAttribute('cy');
      f.seek(to);
      assert.equal(still(),before,`something besides the ring changed between ${from}s and ${to}s`);
      assert.notEqual(f.$('[data-frontier="0"]').getAttribute('cx')+','+f.$('[data-frontier="0"]').getAttribute('cy'),ring,'the ring is the moving object');
    }
  }
  // Fixture-only publications are written once at mount, not on every frame.
  f.seek(12); const candidates=f.root.dataset.finalCandidates;
  f.root.dataset.finalCandidates='sentinel'; f.seek(13); f.seek(31);
  assert.equal(f.root.dataset.finalCandidates,'sentinel','a frame does not re-serialise the fixture');
  f.root.dataset.finalCandidates=candidates;
  // Geometry is serialised at 0.0001 px and nowhere finer.
  f.seek(33.3);
  for(const node of f.$('[data-drawing]').querySelectorAll('*')) for(const key of ['x','y','cx','cy','d','transform']) {
    if(!node.hasAttribute(key)) continue;
    for(const token of node.getAttribute(key).match(/-?\d+\.\d+/g)||[])
      assert(token.split('.')[1].length<=4,`${key}="${node.getAttribute(key)}" is finer than 0.0001 px`);
  }
});

test('Greedy tree: the comparison lines end inside the picture, so the formula line under it cannot collide',t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  for(const width of [240,302,713]) {
    f.resize(width);
    for(const time of [17,40]) {
      f.seek(time);
      const height=Number(f.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/)[3]);
      const boxes=labelBoxes(f),last=boxes.find(box=>box.node.hasAttribute('data-bound-summary'));
      const comparison=boxes.find(box=>box.node.hasAttribute('data-comparison'));
      assert(comparison&&last,'both lines are shown at the comparison beats');
      assert(comparison.y1<last.y0,'the comparison stands above the bound summary');
      assert(last.y1<=height-10,'and the summary leaves a margin above the formula line');
      assert.equal(Math.max(...boxes.map(box=>box.y1)),last.y1,'nothing is drawn lower than the summary');
    }
  }
  // The formula is a sibling BELOW the svg, in normal flow; its two spans may wrap.
  assert.equal(f.$('[data-formula]').previousElementSibling,f.$('[data-figure]'));
  assert.match(CSS,/\.gt-formula \{[^}]*flex-wrap:\s*wrap/);
});

test('Greedy tree: the script-free phone print is anchored to the top of the box its stylesheet reserves',()=>{
  // The static svg keeps the wide viewBox; scripts off and narrow, player.css reshapes the box
  // to the narrow print's ratio. Without a YMin anchor the default xMidYMid centres the wide
  // viewBox in that tall box: a blank band above the print and the same overflow below it.
  const panel=read('greedy-tree/panel.html');
  const svg=/<svg viewBox="0 0 (\d+) (\d+)"[^>]*>/.exec(panel);
  assert(svg,'the static svg declares its wide viewBox');
  assert.match(svg[0],/preserveAspectRatio="xMidYMin meet"/);
  const narrow=/<g data-static-frame="narrow" data-width="(\d+)" data-height="(\d+)" transform="scale\(([\d.]+)\)">/.exec(panel);
  assert(narrow,'the narrow print declares its size and scale');
  close(Number(narrow[3]),Number(svg[1])/Number(narrow[1]),1e-4);
  assert(CSS.includes(`aspect-ratio: ${narrow[1]} / ${narrow[2]}`),'player.css reserves exactly the narrow print');
  // Both prints carry the muted/score emphasis, so the fallback is as quiet as the live frame.
  for(const print of [/<g data-drawing>[\s\S]*?<!-- \/static-frame -->/.exec(panel)[0],/<g data-static-frame="narrow"[\s\S]*?<!-- \/static-frame-narrow -->/.exec(panel)[0]]) {
    assert.equal((print.match(/data-emphasis="score"/g)||[]).length,5,'two scores, two ranks, one comparison');
    assert.equal((print.match(/data-emphasis="live"/g)||[]).length,0);
    assert((print.match(/data-emphasis="muted"/g)||[]).length>=14,'factors, earlier joints and bounds are muted');
  }
});

test('Greedy tree: no new runtime, iframe or parameter control',()=>{
  const panel=read('greedy-tree/panel.html'),script=read('greedy-tree/player.js');
  assert(!/<iframe|<video|<canvas/i.test(panel));
  assert(!/React|Babel|setInterval|eval\(/.test(script));
  assert(!/<input/.test(panel),'all controls belong to shared transport');
  assert.match(panel,/Finite-width beam search need not find the global optimum/);
});
