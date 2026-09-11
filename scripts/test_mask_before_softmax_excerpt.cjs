#!/usr/bin/env node
// Test-only oracles and interaction checks. No dependency here ships to readers.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, close, canonicalMarkup,
  fixture, registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME='mask-before-softmax-excerpt', scene=entry(NAME);
const widths=[240,296,360,519,520,553,599,600,713];
const sum=values=>values.reduce((total,value)=>total+value,0);
const attr=(node,name)=>Number(node.getAttribute(name));
const drawing=f=>f.$('[data-drawing]');
const visible=node=>node && !node.closest('[hidden]');
const declared=f=>({query:JSON.parse(f.root.dataset.query),keys:JSON.parse(f.root.dataset.keys),
  valid:JSON.parse(f.root.dataset.valid)});
const array=(f,key)=>JSON.parse(f.root.dataset[key]);
const numericText=node=>{
  const values=node.textContent.replace(/\u2212/g,'-').match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi);
  assert(values && values.length,`numeric label missing: ${node.textContent}`);
  return Number(values.at(-1))/(node.textContent.includes('%')?100:1);
};
// Independent direct dot products and exponentials. This bounded witness needs
// no numerical stabilization; exact exclusion is represented by -Infinity.
function exact(fx,mode) {
  assert(fx.valid.some(Boolean));
  const raw=fx.keys.map(key=>sum(key.map((value,j)=>value*fx.query[j]))/Math.sqrt(fx.query.length));
  const scores=raw.map((score,j)=>fx.valid[j]||mode==='raw'?score:mode==='zeroed'?0:-Infinity);
  const exponentials=scores.map(Math.exp),denominator=sum(exponentials);
  const weights=exponentials.map(value=>value/denominator);
  return {raw,scores,exponentials,denominator,weights,
    paddedMass:sum(weights.filter((_,j)=>!fx.valid[j]))};
}
const modeAt=time=>time<5?'raw':time<20?'zeroed':'masked';
function checkState(f,fx,time) {
  const mode=modeAt(time),want=exact(fx,mode),d=f.root.dataset;
  assert.equal(d.mode,mode);
  const got={raw:array(f,'rawScores'),scores:array(f,'shownScores'),exponentials:array(f,'expContributions'),
    weights:array(f,'weights'),denominator:Number(d.normalizationSum),paddedMass:Number(d.paddedMass)};
  for(const key of ['raw','scores','exponentials','weights']) assert.equal(got[key].length,4);
  for(let j=0;j<4;j++) {
    const key=f.$(`[data-key="${j}"]`),score=f.$(`[data-score="${j}"]`);
    assert(visible(key)&&visible(score),'masking scores must not delete the source-slot bookkeeping');
    assert.equal(key.dataset.valid,String(fx.valid[j]));
    assert.equal(key.textContent,fx.valid[j]?`key ${j+1}`:'PAD');
    close(got.raw[j],want.raw[j],1e-12);
    if(want.scores[j]===-Infinity) {
      assert.equal(got.scores[j],'-Infinity','infinity must not serialize as JSON null');
      assert.match(score.textContent,/[-\u2212]\s*\u221e/);
    } else {
      close(got.scores[j],want.scores[j],1e-12);
      close(numericText(score),want.scores[j],0.00051);
    }
    close(got.exponentials[j],want.exponentials[j],1e-12);
    close(got.weights[j],want.weights[j],1e-12);
    assert(Number.isFinite(got.weights[j]) && got.weights[j]>=0 && got.weights[j]<=1);
  }
  close(got.denominator,want.denominator,1e-12); assert(got.denominator>0);
  close(sum(got.weights),1,1e-12); close(got.paddedMass,want.paddedMass,1e-12);
  assert.equal(Number(d.validCount),fx.valid.filter(Boolean).length);
  return want;
}

registerTransportTests(NAME,{witness:/0\.409[\s\S]*0\.591/,
  anchors:['mask-before-softmax-playback-help'],width:713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('mask before softmax: the selected row belongs to the existing seeded padding audit', t=>{
  const f=fixture(t,NAME),fx=declared(f),chapter=chapterSource(NAME);
  assert.equal(scene.qmd,'chapters/part4/13-attention.qmd');
  assert.equal(scene.anchor.type,'after-cell'); assert.equal(scene.anchor.target,'cell-fig-padding-mask');
  assert.equal(scene.duration,40); assert.deepEqual(scene.beats,[0,5,10,15,20,25,30,35]);
  assert.equal(Number(f.root.dataset.sourceSeed),6050133);
  assert.equal(Number(f.root.dataset.batchIndex),1); assert.equal(Number(f.root.dataset.queryIndex),1);
  assert.equal(fx.query.length,4); assert.equal(fx.keys.length,4);
  assert(fx.keys.every(key=>key.length===4)); assert.deepEqual(fx.valid,[true,true,false,false]);
  for(const literal of scene.fixture.literals) assert(chapter.includes(literal),literal);
  for(const expression of ['torch.randn(2, 2, 4','torch.randn(2, 4, 4','torch.randn(2, 4, 3',
    'scores.masked_fill(~key_is_valid[:, None, :], -torch.inf)','torch.softmax(scores, dim=-1)'])
    assert(chapter.includes(expression),expression);
});

test('mask before softmax: direct dot products agree with the batched float32 witness, without widening book gates', t=>{
  const f=fixture(t,NAME),fx=declared(f); f.load(); f.open();
  // Reproduction recipe: Chapter 13 padding-mask-audit, seed 6050133,
  // (Q @ K.transpose(-2,-1) / sqrt(4))[1,1], float32. The scene receipt
  // docs/mask-before-softmax-excerpt.md records this generated row; these are
  // test tolerances, not book gate edits.
  const float32Scores=[-0.3497923016548157,0.018254060298204422,-0.23989452421665192,-0.25538283586502075];
  const float32Weights=[0.40901318192481995,0.5909868478775024,0,0];
  f.seek(0); const raw=checkState(f,fx,0);
  raw.raw.forEach((value,j)=>close(value,float32Scores[j],1e-7));
  // Omitting division by sqrt(d_k) is not a rounding difference.
  assert(Math.abs(raw.raw[0]*2-float32Scores[0])>0.3);
  f.seek(30); const masked=checkState(f,fx,30);
  masked.weights.forEach((value,j)=>close(value,float32Weights[j],1e-7));
  f.seek(15); const wrong=checkState(f,fx,15);
  close(wrong.paddedMass,0.5371642708778381,1e-7);
});

test('mask before softmax: zero is a contribution of one, whereas exclusion has contribution zero', t=>{
  const f=fixture(t,NAME),fx=declared(f); f.load(); f.open();
  for(let n=0;n<=80;n++) {const time=n/2;f.seek(time);checkState(f,fx,time);}
  f.seek(15); const wrong=checkState(f,fx,15);
  for(const j of [2,3]) {
    assert.equal(wrong.scores[j],0); assert.equal(wrong.exponentials[j],1);
    assert(wrong.weights[j]>0); close(wrong.weights[j],1/wrong.denominator,1e-12);
  }
  close(wrong.paddedMass,2/wrong.denominator,1e-12); assert(wrong.paddedMass>0.5);
  f.seek(30); const right=checkState(f,fx,30);
  for(const j of [2,3]) {
    assert.equal(right.scores[j],-Infinity); assert.equal(right.exponentials[j],0); assert.equal(right.weights[j],0);
  }
  close(right.denominator,Math.exp(right.raw[0])+Math.exp(right.raw[1]),1e-12);
  assert.equal(right.paddedMass,0);
  close(right.weights[0]+right.weights[1],1,1e-12);
  close(right.weights[0]/right.weights[1],Math.exp(right.raw[0]-right.raw[1]),1e-12);
});

test('mask before softmax: reject an all-masked row before exponentiation or a fabricated normalization', t=>{
  const f=fixture(t,NAME); f.root.dataset.valid=JSON.stringify([false,false,false,false]);
  let exponentiations=0;
  const exp=f.w.Math.exp;
  f.w.Math.exp=value=>{exponentiations++;return exp(value);};
  assert.throws(()=>f.load(),/every example needs at least one valid key/i);
  assert.equal(exponentiations,0,'there is no distribution to compute when every key is excluded');
  assert.notEqual(f.root.dataset.ready,'true');
  assert(!f.playing); assert.equal(f.frames.size,0);
});

test('mask before softmax: altered vectors and valid-key positions change the calculation, not hard-coded answers', t=>{
  const alternatives=[
    {query:[1,0,0,0],keys:[[0,0,0,0],[2,0,0,0],[-2,0,0,0],[4,0,0,0]],valid:[false,true,false,false]},
    {query:[1,-1,0.5,2],keys:[[1,2,0,-1],[0.5,0,-2,1],[2,-1,1,0],[0,1,0,1]],valid:[true,false,true,false]},
    {query:[0,0,0,0],keys:[[1,2,3,4],[2,3,4,5],[3,4,5,6],[4,5,6,7]],valid:[true,true,true,true]}
  ];
  for(const fx of alternatives) {
    const f=fixture(t,NAME);
    for(const key of ['query','keys','valid']) f.root.dataset[key]=JSON.stringify(fx[key]);
    f.load(); f.open();
    for(const time of [0,5,10,15,20,25,30,35,40]) {f.seek(time);checkState(f,fx,time);}
    const weights=array(f,'weights');
    weights.forEach((weight,j)=>{if(!fx.valid[j]) assert.equal(weight,0);});
    if(fx.valid.filter(Boolean).length===1) assert.equal(Math.max(...weights),1);
  }
});

test('mask before softmax: a common finite score shift cancels after excluding padded keys', t=>{
  const original=fixture(t,NAME),fx=declared(original),norm2=sum(fx.query.map(x=>x*x));
  for(const shift of [-3,0.75,4]) {
    const changed={...fx,keys:fx.keys.map(key=>key.map((x,j)=>x+shift*Math.sqrt(fx.query.length)*fx.query[j]/norm2))};
    const f=fixture(t,NAME); f.root.dataset.keys=JSON.stringify(changed.keys);
    f.load(); f.open(); f.seek(30);
    const got=checkState(f,changed,30),baseline=exact(fx,'masked');
    got.raw.forEach((score,j)=>close(score,baseline.raw[j]+shift,1e-12));
    got.weights.forEach((weight,j)=>close(weight,baseline.weights[j],1e-12));
  }
});

test('mask before softmax: the denominators and weights wait for their own explanatory beats', t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  for(const time of [0,4.99,5,9.99,10,14.99,15,19.99,20,24.99,25,29.99,30,35,40]) {
    f.seek(time); const stage=Math.min(7,Math.floor(time/5));
    const exps=stage===2||stage===3||stage>=5,weights=stage===3||stage>=6;
    for(const node of drawing(f).querySelectorAll('[data-exp-bar],[data-exp-value],[data-sum-bracket],[data-sum-value]'))
      assert.equal(Boolean(visible(node)),exps,`exponential stage at ${time}s`);
    for(const node of drawing(f).querySelectorAll('[data-weight-bar],[data-weight-value],[data-padded-mass]'))
      assert.equal(Boolean(visible(node)),weights,`normalized weights at ${time}s`);
    assert.equal(Boolean(visible(f.$('[data-guard]'))),stage===7);
    if(time<15) {
      const accessible=[f.$('[data-figure] svg').getAttribute('aria-label'),f.$('[data-caption]').textContent,
        f.$('[data-controls] input[type="range"]').getAttribute('aria-valuetext')].join(' ');
      assert.doesNotMatch(accessible,/0\.537|53\.7|0\.409|0\.591|0\.189|0\.273|0\.269/,
        'do not disclose the computed mass before the reader sees normalization');
    }
  }
});

test('mask before softmax: printed numbers measure the current bars and denominator', t=>{
  const f=fixture(t,NAME),fx=declared(f); f.load(); f.open();
  for(const time of [10,15,25,30,35,40]) {
    f.seek(time); const want=checkState(f,fx,time);
    for(let j=0;j<4;j++) {
      close(numericText(f.$(`[data-exp-value="${j}"]`)),want.exponentials[j],0.00051);
      if(time===15||time>=30) close(numericText(f.$(`[data-weight-value="${j}"]`)),want.weights[j],0.00051);
    }
    close(numericText(f.$('[data-sum-value]')),want.denominator,0.00051);
    if(time===15||time>=30) close(numericText(f.$('[data-padded-mass]')),want.paddedMass,0.00051);
  }
});

test('mask before softmax: every bar starts at zero on its shared exponential or probability ruler', t=>{
  const f=fixture(t,NAME),fx=declared(f); f.load(); f.open();
  for(const width of widths) {
    f.resize(width); let previous;
    for(const time of [10,15,25,30,35,40]) {
      f.seek(time); const want=checkState(f,fx,time),d=f.root.dataset;
      const state={expBase:attr(f.$('[data-exp-baseline="0"]'),'y1'),expScale:Number(d.expPixelsPerUnit),
        weightBase:attr(f.$('[data-weight-baseline="0"]'),'y1'),weightScale:Number(d.weightPixelsPerUnit)};
      assert(Object.values(state).every(value=>Number.isFinite(value)&&value>0));
      if(previous) assert.deepEqual(state,previous,'masking changes values, not the chart rulers');
      previous=state;
      for(const [kind,values,base,scale] of [
        ['exp',want.exponentials,state.expBase,state.expScale],
        ['weight',want.weights,state.weightBase,state.weightScale]
      ]) {
        const bars=[...drawing(f).querySelectorAll(`[data-${kind}-bar]`)]; assert.equal(bars.length,4);
        for(let j=0;j<4;j++) {
          const bar=f.$(`[data-${kind}-bar="${j}"]`);
          const baseline=f.$(`[data-${kind}-baseline="${j}"]`);
          close(attr(baseline,'y1'),base); close(attr(baseline,'y2'),base);
          close(attr(bar,'height'),values[j]*scale,1e-10);
          close(attr(bar,'y')+attr(bar,'height'),base,1e-10);
          if(j) assert(attr(bars[j-1],'x')+attr(bars[j-1],'width')<attr(bar,'x'));
        }
      }
    }
  }
});

test('mask before softmax: seeking and resizing reproduce all state, including the wrong-answer phase', t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  const snapshot=()=>JSON.stringify({picture:canonicalMarkup(f.$('[data-figure]').innerHTML),
    formula:canonicalMarkup(f.$('[data-formula]').outerHTML),caption:f.$('[data-caption]').innerHTML,
    state:Object.fromEntries(Object.entries(f.root.dataset).filter(([key])=>!['time','playing','typeset'].includes(key)))});
  const times=[0,5,9.9,10,14.7,15,19.99,20,24.9,25,29.99,30,35,40];
  const forward=times.map(time=>{f.seek(time);return snapshot();});
  f.play(); f.tick(733); f.resize(296); f.seek(15); f.resize(713);
  assert.deepEqual(times.toReversed().map(time=>{f.seek(time);return snapshot();}),forward.toReversed());
});

test('mask before softmax: narrow and wide layouts keep live labels and bars inside their measured picture', t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  for(const width of widths) {
    f.resize(width);
    for(const time of [...scene.beats,40]) {
      f.seek(time); const svg=f.$('[data-figure] svg'),box=numbers(svg.getAttribute('viewBox'));
      assert.equal(box[2],width); assert.equal(svg.getAttribute('preserveAspectRatio'),'xMinYMin meet');
      for(const node of [...drawing(f).querySelectorAll('text')].filter(visible)) {
        assert(attr(node,'font-size')>=12,`undersized label at ${width}px: ${node.textContent}`);
        assert(attr(node,'x')>=0&&attr(node,'x')<=width);
        assert(attr(node,'y')>=0&&attr(node,'y')<=box[3]);
      }
      for(const node of [...drawing(f).querySelectorAll('rect')].filter(visible)) {
        assert(attr(node,'x')>=0&&attr(node,'x')+attr(node,'width')<=width+1e-10);
        assert(attr(node,'y')>=0&&attr(node,'y')+attr(node,'height')<=box[3]+1e-10);
      }
      assert(drawing(f).querySelectorAll('*').length<250,'four keys need no large drawing payload');
    }
  }
});

test('mask before softmax: both generated static prints retain the correct distribution and guard', async t=>{
  const generated=await staticFrame(NAME);
  assert.equal(generated.before,generated.after,'regenerate the mask-before-softmax static frames');
  const f=fixture(t,NAME),narrow=f.$('[data-static-frame="narrow"]');
  assert(narrow); assert.equal(narrow.dataset.width,'296');
  const height=Number(narrow.dataset.height),ids=[...f.root.querySelectorAll('[id]')].map(node=>node.id);
  assert.equal(ids.length,new Set(ids).size);
  for(const print of [drawing(f),narrow]) {
    const values=[...print.querySelectorAll('[data-weight-value]')].map(numericText);
    assert.equal(values.length,4);
    close(values[0],0.40901318192481995,0.00051); close(values[1],0.5909868478775024,0.00051);
    assert.equal(values[2],0); assert.equal(values[3],0);
    assert(print.querySelector('[data-guard]').textContent.trim());
  }
  f.load(); f.open(); f.seek(40); f.resize(296);
  assert.equal(f.root.querySelectorAll('[data-static-frame="narrow"]').length,0);
  assert.equal(numbers(f.$('[data-figure] svg').getAttribute('viewBox'))[3],height);
  const css=read('mask-before-softmax/player.css');
  assert.match(css,/@container\s*\(max-width:\s*\d+px\)/);
  assert.match(css,new RegExp(`aspect-ratio:\\s*296\\s*/\\s*${height}`));
});

test('mask before softmax: padding, causal visibility, and target-loss selection stay distinct and HTML-only', t=>{
  const f=fixture(t,NAME),boundary=f.$('.mechanism-boundary').textContent;
  assert.match(boundary,/source.padding|source padding|padded (?:source|key)/i);
  assert.match(boundary,/causal/i); assert.match(boundary,/target.loss|loss mask/i);
  assert.match(boundary,/all.masked|at least one (?:real|valid) key/i);
  assert.match(boundary,/seed|computed|audit|fixture/i);
  f.load(); f.open();
  assert.equal(f.root.querySelectorAll('input[type="range"]').length,1,'only the transport scrubber');
  assert.equal(f.root.querySelectorAll('[data-action]').length,2);
  const filter=fs.readFileSync(path.join(ROOT,scene.filter),'utf8');
  assert.match(filter,/^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
  assert.doesNotMatch(read('mask-before-softmax/player.js'),/Math\.random|fetch\(|import\(|setInterval\(/);
  assert.doesNotMatch(read('mask-before-softmax/panel.html'),/@eq-/);
});
