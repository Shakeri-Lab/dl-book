#!/usr/bin/env node
// Test-only oracles and interaction checks. No dependency here ships to readers.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, close, canonicalMarkup, drawnMarkup,
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
  const values=node.textContent.replace(/−/g,'-').match(/[-+]?(?:\d*\.)?\d+/g);
  assert(values && values.length,`numeric label missing: ${node.textContent}`);
  return Number(values.at(-1));
};
const alternatives=[
  {query:[1,0,0,0],keys:[[0,0,0,0],[2,0,0,0],[-2,0,0,0],[4,0,0,0]],valid:[false,true,false,false]},
  {query:[1,-1,0.5,2],keys:[[1,2,0,-1],[0.5,0,-2,1],[2,-1,1,0],[0,1,0,1]],valid:[true,false,true,false]},
  {query:[0,0,0,0],keys:[[1,2,3,4],[2,3,4,5],[3,4,5,6],[4,5,6,7]],valid:[true,true,true,true]}
];
const withFixture=(t,fx)=>{
  const f=fixture(t,NAME);
  for(const key of ['query','keys','valid']) f.root.dataset[key]=JSON.stringify(fx[key]);
  f.load(); f.open(); return f;
};
// Independent direct dot products and exponentials. This bounded witness needs no
// numerical stabilization. `c` is the contribution of one padded slot to the shared sum:
// null shows the audit's own raw scores, 1 is the zeroed score (exp 0), 0 is the mask
// (exp of negative infinity), and anything between is a padded score of ln c.
function exact(fx,c) {
  assert(fx.valid.some(Boolean));
  const raw=fx.keys.map(key=>sum(key.map((value,j)=>value*fx.query[j]))/Math.sqrt(fx.query.length));
  const scores=raw.map((score,j)=>fx.valid[j]||c===null?score:Math.log(c));
  const exponentials=raw.map((score,j)=>fx.valid[j]||c===null?Math.exp(score):c),denominator=sum(exponentials);
  const weights=exponentials.map(value=>value/denominator);
  return {raw,scores,exponentials,denominator,weights,
    paddedMass:sum(weights.filter((_,j)=>!fx.valid[j]))};
}
// The published state is one number, c, and everything that follows from it. The clock
// enters only through the facts the timeline promises: raw scores before 5 s, the zeroed
// row held through 27 s, the mask finished at 30 s. Between 27 s and 30 s the test reads c
// and checks that the whole picture is the softmax of that c; it never recomputes easing.
function checkState(f,fx,time) {
  const d=f.root.dataset,pads=fx.valid.includes(false);
  const c=time<5?null:Number(d.padContribution);
  if(time<5) {assert.equal(d.mode,'raw'); assert.equal(d.padContribution,'');}
  else if(time<=27) {assert.equal(c,1,`the wrong repair holds at ${time}s`); assert.equal(d.mode,'zeroed');}
  else if(time>=30) {assert.equal(c,0,`the mask is finished at ${time}s`); assert.equal(d.mode,'masked');}
  else {assert(c>=0&&c<=1,`c = ${c} at ${time}s`); assert.equal(d.mode,c===1?'zeroed':c===0?'masked':'pushing');}
  const want=exact(fx,c);
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
      assert.equal(score.textContent,'−∞');
    } else {
      close(got.scores[j],want.scores[j],1e-12);
      close(numericText(score),want.scores[j],0.00051);
    }
    close(got.exponentials[j],want.exponentials[j],1e-12);
    close(got.weights[j],want.weights[j],1e-12);
    close(got.weights[j],got.exponentials[j]/got.denominator,1e-15);
    assert(Number.isFinite(got.weights[j]) && got.weights[j]>=0 && got.weights[j]<=1);
  }
  close(got.denominator,want.denominator,1e-12); assert(got.denominator>0);
  close(sum(got.weights),1,1e-12); close(got.paddedMass,want.paddedMass,1e-12);
  assert.equal(Number(d.validCount),fx.valid.filter(Boolean).length);
  if(!pads) assert.equal(got.paddedMass,0);
  return {...want,c};
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
  f.seek(24); const wrong=checkState(f,fx,24);
  close(wrong.paddedMass,0.5371642708778381,1e-7);
});

test('mask before softmax: zero is a contribution of one, whereas exclusion has contribution zero', t=>{
  const f=fixture(t,NAME),fx=declared(f); f.load(); f.open();
  for(let n=0;n<=160;n++) {const time=n/4;f.seek(time);checkState(f,fx,time);}
  f.seek(24); const wrong=checkState(f,fx,24);
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

test('mask before softmax: the mask is one continuous glide on the same picture, recomputed from c', t=>{
  const f=fixture(t,NAME),fx=declared(f); f.load(); f.open();
  f.seek(24); const wrong=checkState(f,fx,24);
  f.seek(30); const right=checkState(f,fx,30);
  let previous=null;
  for(let n=0;n<=200;n++) {
    const time=25+n/40; f.seek(time);
    const state=checkState(f,fx,time),d=f.root.dataset;
    // Softmax of the shown scores at every instant, not a blend of two answers.
    close(sum(array(f,'weights')),1,1e-12);
    array(f,'weights').forEach((weight,j)=>close(weight,state.exponentials[j]/state.denominator,1e-12));
    for(const j of [2,3]) assert.equal(state.exponentials[j],state.c,'a padded slot contributes exactly c');
    close(Number(d.normalizationSum),right.denominator+2*state.c,1e-12);
    // Hold still on the announced edit for at least two seconds, then finish on the beat.
    if(time<=27) assert.equal(state.c,1);
    if(time>=30) {assert.equal(state.c,0); assert.equal(Number(d.paddedMass),0);}
    if(previous) {
      assert(state.c<=previous.c,`c rises at ${time}s`);
      assert(state.paddedMass<=previous.paddedMass,`PAD share rises at ${time}s`);
      assert(state.denominator<=previous.denominator,`the shared sum rises at ${time}s`);
      for(const j of [0,1]) assert(state.weights[j]>=previous.weights[j],`real key ${j+1} loses weight at ${time}s`);
      if(time>27.2&&time<30) assert(state.paddedMass<previous.paddedMass,`the glide stalls at ${time}s`);
    }
    previous=state;
  }
  // The same mass is redistributed: what padding loses, the real keys gain.
  close(wrong.paddedMass,(right.weights[0]-wrong.weights[0])+(right.weights[1]-wrong.weights[1]),1e-12);
  // The glide arrives exactly on the beat, not before it and not after it.
  f.seek(29.99); assert(Number(f.root.dataset.padContribution)>0);
  assert(Number(f.root.dataset.paddedMass)>0&&Number(f.root.dataset.paddedMass)<1e-3);
  for(const time of [30,30.01,32.5,35,40]) {f.seek(time); assert.equal(Number(f.root.dataset.paddedMass),0);}
});

test('mask before softmax: motion exists in normal playback, and reduced motion holds one still per beat', t=>{
  const f=fixture(t,NAME),fx=declared(f); f.load(); f.open();
  const heights=(time,kind)=>{f.seek(time);return [0,1,2,3].map(j=>attr(f.$(`[data-${kind}-bar="${j}"]`),'height'));};
  const frames=[26,27.5,29].map(time=>(f.seek(time),drawnMarkup(f)));
  assert.equal(new Set(frames).size,3,'the picture moves between 26 s, 27.5 s and 29 s');
  // The padded exponential bars are the tracked object: they shrink as the real weights grow.
  const [e26,e275,e29,e30]=[26,27.5,29,30].map(time=>heights(time,'exp'));
  for(const j of [2,3]) assert(e26[j]>e275[j]&&e275[j]>e29[j]&&e29[j]>e30[j]&&e30[j]===0);
  for(const j of [0,1]) assert(e26[j]===e30[j],'real exponentials never move');
  const [w26,w275,w29,w30]=[26,27.5,29,30].map(time=>heights(time,'weight'));
  for(const j of [2,3]) assert(w26[j]>w275[j]&&w275[j]>w29[j]&&w29[j]>w30[j]&&w30[j]===0);
  for(const j of [0,1]) assert(w26[j]<w275[j]&&w275[j]<w29[j]&&w29[j]<w30[j]);
  // Each reveal grows from its baseline, then holds.
  for(const [kind,start] of [['exp',10],['weight',20]]) {
    const [a,b,c,d,e]=[start,start+1,start+2,start+3,start+4.9].map(time=>heights(time,kind));
    for(const j of [0,1,2,3]) {
      assert.equal(a[j],0,`${kind} bar ${j} starts on its baseline`);
      assert(a[j]<b[j]&&b[j]<c[j]&&c[j]<d[j],`${kind} bar ${j} grows`); assert.equal(d[j],e[j],`${kind} bar ${j} holds`);
    }
  }
  const bracket=time=>(f.seek(time),[f.$('[data-sum-bracket]'),f.$('[data-leak-bracket]')].map(node=>node.getAttribute('d')).join('|'));
  assert.equal(new Set([15.5,16.5,17.5,18].map(bracket)).size,4,'the shared bracket draws across');
  assert.equal(bracket(18),bracket(24.9),'and then holds');

  const r=fixture(t,NAME,{reduced:true}); r.load(); r.open();
  r.seek(25); const still=drawnMarkup(r); checkState(r,fx,25);
  for(const time of [26,27.5,29,29.99]) {r.seek(time); assert.equal(drawnMarkup(r),still,`reduced motion moves at ${time}s`);}
  // Beat 5's still is the wrong picture with the edit announced; beat 6's is the finished mask.
  assert.equal(r.root.dataset.padContribution,'1'); assert.match(r.$('[data-mode-label]').textContent,/−∞/);
  assert(visible(r.$('[data-push-cue="2"]'))); assert.equal(r.$('[data-score="2"]').textContent,'0');
  close(numericText(r.$('[data-padded-mass]')),exact(fx,1).paddedMass,0.00051);
  r.seek(30); checkState(r,fx,30); assert.equal(r.root.dataset.padContribution,'0');
  f.seek(30); assert.equal(drawnMarkup(r),drawnMarkup(f),'both modes park on the same finished picture');
  // Every beat's reduced still is the normal timeline's picture at the end of that beat's motion.
  for(const [beat,settled] of [[10,13],[15,18],[20,23],[25,25]]) {
    r.seek(beat); f.seek(settled);
    assert.equal(canonicalMarkup(drawing(r).innerHTML),canonicalMarkup(drawing(f).innerHTML),`reduced still for the beat at ${beat}s`);
  }
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
  for(const fx of alternatives) {
    const f=withFixture(t,fx);
    for(const time of [0,5,10,15,20,25,27.5,28.5,29.5,30,35,40]) {f.seek(time);checkState(f,fx,time);}
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
    const got=checkState(f,changed,30),baseline=exact(fx,0);
    got.raw.forEach((score,j)=>close(score,baseline.raw[j]+shift,1e-12));
    got.weights.forEach((weight,j)=>close(weight,baseline.weights[j],1e-12));
  }
});

test('mask before softmax: each level waits for its beat, and nothing drawn is ever wiped', t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  const shown=selector=>[...drawing(f).querySelectorAll(selector)].map(node=>Boolean(visible(node)));
  const all=(selector,want,time)=>{
    const got=shown(selector); assert(got.length>0,selector);
    assert(got.every(value=>value===want),`${selector} ${want?'missing':'early'} at ${time}s`);
  };
  // [selector, first second it is on the picture]. From then on it never leaves.
  const reveals=[['[data-key],[data-score],[data-exp-baseline],[data-weight-baseline]',0],
    ['[data-exp-bar],[data-exp-link],[data-exp-label]',10],['[data-exp-value]',13],
    ['[data-sum-bracket]',15.05],['[data-sum-value]',18],['[data-weight-bar],[data-divide-label]',20],
    ['[data-weight-value],[data-padded-mass],[data-mass-bracket]',23],['[data-guard]',35]];
  for(let n=0;n<=800;n++) {
    const time=n/20; f.seek(time);
    for(const [selector,start] of reveals) all(selector,time>=start,time);
    // The wine half of the bracket, and the push cue, exist only while they are true.
    if(time<15||time>=30) all('[data-leak-bracket]',false,time);
    if(time>=18&&time<30) all('[data-leak-bracket]',true,time);
    all('[data-push-cue]',time>=25&&time<30,time);
    if(time<23) {
      const accessible=[f.$('[data-figure] svg').getAttribute('aria-label'),f.$('[data-caption]').textContent,
        f.$('[data-controls] input[type="range"]').getAttribute('aria-valuetext'),drawing(f).textContent].join(' ');
      assert.doesNotMatch(accessible,/0\.537|53\.7|0\.409|0\.591|0\.189|0\.273|0\.269/,
        `the computed mass is disclosed at ${time}s, before the reader sees normalization`);
    }
  }
});

test('mask before softmax: printed numbers measure the current bars and denominator', t=>{
  const f=fixture(t,NAME),fx=declared(f); f.load(); f.open();
  for(const time of [13,14,18,19,23,24,25,26,27.5,28.25,29,29.75,30,35,40]) {
    f.seek(time); const want=checkState(f,fx,time);
    for(let j=0;j<4;j++) close(numericText(f.$(`[data-exp-value="${j}"]`)),want.exponentials[j],0.00051);
    if(time>=18) assert.match(f.$('[data-sum-value]').textContent,/^sum = \d\.\d{4}$/);
    if(time>=18) close(numericText(f.$('[data-sum-value]')),want.denominator,0.00051);
    if(time<23) continue;
    // Real keys carry their own weight; the padded weights are read as ONE share.
    assert.deepEqual([...drawing(f).querySelectorAll('[data-weight-value]')].map(node=>node.dataset.weightValue),['0','1']);
    for(const j of [0,1]) close(numericText(f.$(`[data-weight-value="${j}"]`)),want.weights[j],0.00051);
    close(numericText(f.$('[data-padded-mass]')),want.paddedMass,0.00051);
  }
  // Exact values print exactly: a contribution of one, a contribution of zero, a share of zero.
  f.seek(24); assert.deepEqual([2,3].map(j=>f.$(`[data-exp-value="${j}"]`).textContent),['1','1']);
  f.seek(30); assert.deepEqual([2,3].map(j=>f.$(`[data-exp-value="${j}"]`).textContent),['0','0']);
  assert.equal(f.$('[data-padded-mass]').textContent,'PAD share 0');
});

test('mask before softmax: wine marks leaking weight only; a padded share of zero is neutral', t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  const classes=selector=>f.$(selector).getAttribute('class')||'';
  for(const time of [13,18,24,26,28.5,29.9]) {
    f.seek(time);
    for(const j of [2,3]) {
      assert.match(classes(`[data-exp-bar="${j}"]`),/\bmbs-leak\b/); assert.match(classes(`[data-weight-bar="${j}"]`),/\bmbs-leak\b/);
      assert.match(classes(`[data-score="${j}"]`),/\bmbs-error\b/); assert.match(classes(`[data-exp-value="${j}"]`),/\bmbs-error\b/);
      assert.doesNotMatch(classes(`[data-exp-link="${j}"]`),/mbs-excluded/);
    }
    for(const j of [0,1]) assert.doesNotMatch(classes(`[data-exp-bar="${j}"]`)+classes(`[data-weight-bar="${j}"]`),/mbs-leak/);
    if(time>=23) {assert.match(classes('[data-padded-mass]'),/\bmbs-error\b/); assert.doesNotMatch(classes('[data-mass-bracket]'),/mbs-neutral/);}
  }
  for(const time of [30,33,37,40]) {
    f.seek(time);
    assert.doesNotMatch(classes('[data-padded-mass]'),/mbs-error/,'zero leakage is not an error');
    assert.match(classes('[data-mass-bracket]'),/\bmbs-neutral\b/);
    for(const j of [2,3]) {
      assert.doesNotMatch(classes(`[data-score="${j}"]`)+classes(`[data-exp-value="${j}"]`),/mbs-error/);
      assert.match(classes(`[data-exp-link="${j}"]`),/\bmbs-excluded\b/,'a masked column keeps its slot and quiets its arrow');
      assert.equal(attr(f.$(`[data-exp-bar="${j}"]`),'height'),0); assert.equal(attr(f.$(`[data-weight-bar="${j}"]`),'height'),0);
    }
  }
  // No dead styling: every mbs- class the stylesheet names is one the player or panel uses.
  const css=read('mask-before-softmax/player.css'),used=read('mask-before-softmax/player.js')+read('mask-before-softmax/panel.html');
  for(const [,name] of css.matchAll(/\.(mbs-[\w-]+)/g)) assert(used.includes(name),`player.css styles .${name}, which nothing applies`);
});

test('mask before softmax: minus is U+2212 everywhere a reader or screen reader meets a number', t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  const range=f.$('[data-controls] input[type="range"]');
  let negatives=0;
  for(let n=0;n<=160;n++) {
    f.seek(n/4);
    for(const node of drawing(f).querySelectorAll('text')) {
      assert.doesNotMatch(node.textContent,/-/,`hyphen-minus in "${node.textContent}" at ${n/4}s`);
      if(/−/.test(node.textContent)) negatives++;
    }
    for(const spoken of [range.getAttribute('aria-valuetext'),f.$('[data-figure] svg').getAttribute('aria-label')]) {
      assert.doesNotMatch(spoken,/-\s*[\d.∞]|-Infinity|NaN|\de[-+]?\d/i,`ASCII math in "${spoken}"`);
    }
  }
  assert(negatives>300,'the row does print negative scores');
  f.seek(0); assert.equal(f.$('[data-score="0"]').textContent,'−0.350');
  f.seek(28.5); assert.match(f.$('[data-score="2"]').textContent,/^−\d+\.\d{3}$/);
  assert.match(range.getAttribute('aria-valuetext'),/Padded score −\d/);
  f.seek(30); assert.deepEqual([2,3].map(j=>f.$(`[data-score="${j}"]`).textContent),['−∞','−∞']);
  const panel=fixture(t,NAME);
  for(const node of panel.root.querySelectorAll('svg text')) assert.doesNotMatch(node.textContent,/-/,`static print: "${node.textContent}"`);
});

test('mask before softmax: a live value is spoken in one place, and few numbers are emphasised at once', t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  const svg=f.$('[data-figure] svg'),range=f.$('[data-controls] input[type="range"]'),label=svg.getAttribute('aria-label');
  assert.doesNotMatch(label,/\d\.\d/,'the picture describes its structure; it does not recite values');
  for(let n=0;n<=160;n++) {
    const time=n/4; f.seek(time);
    assert.equal(svg.getAttribute('aria-label'),label,`the picture's name changes at ${time}s`);
    assert.doesNotMatch(f.$('[data-caption]').textContent,/\d\.\d/,'the caption carries no live value');
    const emphasised=[...drawing(f).querySelectorAll('text')].filter(node=>visible(node)
      &&/\d|∞/.test(node.textContent)&&!/\bmbs-muted\b/.test(node.getAttribute('class')||'')
      &&!['data-key','data-mode-label','data-context','data-guard'].some(name=>node.hasAttribute(name)));
    assert(emphasised.length<=8,`${emphasised.length} emphasised numbers at ${time}s: ${emphasised.map(node=>node.textContent).join(' | ')}`);
  }
  f.seek(28.5); const spoken=range.getAttribute('aria-valuetext');
  assert.equal(spoken.match(/\d\.\d{4}/g).length,1,`one share, once: ${spoken}`);
});

test('mask before softmax: a held picture costs no DOM writes, and fixture facts are published once', t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  f.seek(23.2);
  const records=[];
  const observer=new f.w.MutationObserver(list=>records.push(...list));
  observer.observe(f.root,{attributes:true,childList:true,characterData:true,subtree:true,attributeOldValue:true});
  f.play(); for(let n=0;n<10;n++) f.tick(100);
  records.push(...observer.takeRecords()); observer.disconnect();
  assert(f.time>24.5&&f.time<25,'the window stays inside the hold');
  const touched=records.filter(record=>!record.target.closest('[data-controls]')
    &&!['data-time','data-playing'].includes(record.attributeName));
  assert.deepEqual(touched.map(record=>`${record.target.nodeName} ${record.attributeName||record.type}`),[]);
  // During the glide only what c changes is rewritten: never the fixture's own entries.
  const moving=[]; const glide=new f.w.MutationObserver(list=>moving.push(...list));
  f.seek(27.2); glide.observe(f.root,{attributes:true});
  f.play(); for(let n=0;n<10;n++) f.tick(100);
  moving.push(...glide.takeRecords()); glide.disconnect();
  const names=new Set(moving.map(record=>record.attributeName));
  for(const name of ['data-raw-scores','data-valid-count','data-mask-role','data-exp-pixels-per-unit','data-weight-pixels-per-unit','data-bar-width'])
    assert(!names.has(name),`${name} is rewritten during playback`);
  assert(names.has('data-pad-contribution'));
});

test('mask before softmax: every bar starts at zero on its shared ruler and stays inside its band', t=>{
  const cases=[declared(fixture(t,NAME)),...alternatives];
  for(const [index,fx] of cases.entries()) {
    const f=withFixture(t,fx);
    for(const width of index?[296,713]:widths) {
      f.resize(width); let previous;
      for(const time of [13,18,23,25,27.5,28.5,29.5,30,35,40]) {
        f.seek(time); const want=checkState(f,fx,time),d=f.root.dataset;
        const state={expBase:attr(f.$('[data-exp-baseline="0"]'),'y1'),expScale:Number(d.expPixelsPerUnit),
          weightBase:attr(f.$('[data-weight-baseline="0"]'),'y1'),weightScale:Number(d.weightPixelsPerUnit)};
        assert(Object.values(state).every(value=>Number.isFinite(value)&&value>0));
        if(previous) assert.deepEqual(state,previous,'masking changes values, not the chart rulers');
        previous=state;
        // The band ends where the row above it prints: the arrow tip, then the divide label.
        const ceilings={exp:Number(/ V ([\d.]+)/.exec(f.$('[data-exp-link="0"]').getAttribute('d'))[1]),
          weight:attr(f.$('[data-divide-label]'),'y')};
        for(const [kind,values,base,scale] of [
          ['exp',want.exponentials,state.expBase,state.expScale],
          ['weight',time>=23?want.weights:null,state.weightBase,state.weightScale]
        ]) {
          if(!values) continue;
          const bars=[...drawing(f).querySelectorAll(`[data-${kind}-bar]`)]; assert.equal(bars.length,4);
          for(let j=0;j<4;j++) {
            const bar=f.$(`[data-${kind}-bar="${j}"]`);
            const baseline=f.$(`[data-${kind}-baseline="${j}"]`);
            close(attr(baseline,'y1'),base); close(attr(baseline,'y2'),base);
            close(Number(bar.dataset.magnitude),values[j],1e-12);
            // Drawing coordinates are serialized to 0.0001 px; the state above is not rounded.
            close(attr(bar,'height'),values[j]*scale,1e-4);
            close(attr(bar,'y')+attr(bar,'height'),base,1e-4);
            assert(attr(bar,'y')>=ceilings[kind]+4,`${kind} bar ${j} rises to ${attr(bar,'y')} past ${ceilings[kind]} at ${time}s`);
            if(j) assert(attr(bars[j-1],'x')+attr(bars[j-1],'width')<attr(bar,'x'));
          }
        }
      }
    }
  }
  // The weight ruler is set by the fixture, not by a constant a larger weight would overflow.
  const single=withFixture(t,alternatives[0]); single.seek(30);
  assert.equal(Math.max(...array(single,'weights')),1);
  assert(attr(single.$('[data-weight-bar="1"]'),'height')>100);
});

test('mask before softmax: drawing coordinates are serialized at 0.0001 px', t=>{
  const f=fixture(t,NAME); f.load(); f.open(); f.resize(553);
  for(const time of [11.3,16.7,21.9,28.1,40]) {
    f.seek(time);
    for(const node of drawing(f).querySelectorAll('*')) for(const name of ['x','y','x1','x2','y1','y2','width','height','d','opacity']) {
      const value=node.getAttribute(name); if(value===null) continue;
      for(const number of value.match(/-?\d+\.\d+/g)||[]) assert(number.split('.')[1].length<=4,`${name}="${value}" at ${time}s`);
    }
  }
});

test('mask before softmax: seeking and resizing reproduce all state, including the glide', t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  const snapshot=()=>JSON.stringify({picture:canonicalMarkup(f.$('[data-figure]').innerHTML),
    formula:canonicalMarkup(f.$('[data-formula]').outerHTML),caption:f.$('[data-caption]').innerHTML,
    state:Object.fromEntries(Object.entries(f.root.dataset).filter(([key])=>!['time','playing','typeset'].includes(key)))});
  const times=[0,5,9.9,10,11.4,14.7,15,16.2,19.99,20,21.3,24.9,25,26.5,27.8,28.6,29.99,30,35,40];
  const forward=times.map(time=>{f.seek(time);return snapshot();});
  f.play(); f.tick(733); f.resize(296); f.seek(28.6); f.resize(713);
  assert.deepEqual(times.toReversed().map(time=>{f.seek(time);return snapshot();}),forward.toReversed());
});

test('mask before softmax: the formula lights exp 0 = 1 in the wrong regime and exp of minus infinity = 0 when masked', t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  const has=name=>f.$('[data-formula]').classList.contains(name);
  for(const time of [0,2,5,9.9]) {f.seek(time); assert(!has('mbs-zero-shown')&&!has('mbs-exclude-shown')&&!has('mbs-normalize-shown'),`the answer is withheld at ${time}s`);}
  for(const time of [10,14,18,24,25,27]) {f.seek(time); assert(has('mbs-zero-shown')&&has('mbs-zero-lit')&&!has('mbs-exclude-lit'),`wrong regime at ${time}s`);}
  f.seek(24.9); assert(!has('mbs-exclude-shown')); f.seek(25); assert(has('mbs-exclude-shown'),'the edit is announced');
  f.seek(28.5); assert(!has('mbs-zero-lit')&&!has('mbs-exclude-lit'),'neither identity describes a score in between');
  for(const time of [30,33,37,40]) {f.seek(time); assert(has('mbs-exclude-lit')&&!has('mbs-zero-lit'),`masked at ${time}s`);}
});

test('mask before softmax: narrow and wide layouts keep live labels and bars inside their measured picture', t=>{
  const f=fixture(t,NAME); f.load(); f.open();
  for(const width of widths) {
    f.resize(width);
    for(const time of [...scene.beats,13,18,23,27.5,28.5,29.5,40]) {
      f.seek(time); const svg=f.$('[data-figure] svg'),box=numbers(svg.getAttribute('viewBox'));
      assert.equal(box[2],width); assert.equal(svg.getAttribute('preserveAspectRatio'),'xMinYMin meet');
      for(const node of [...drawing(f).querySelectorAll('text')].filter(visible)) {
        assert(attr(node,'font-size')>=12,`undersized label at ${width}px: ${node.textContent}`);
        // Every label is centred or starts at its x: half its estimated width must fit.
        const half=node.getAttribute('text-anchor')==='middle'?node.textContent.length*attr(node,'font-size')*0.27:0;
        assert(attr(node,'x')-half>=0&&attr(node,'x')+half<=width,`"${node.textContent}" leaves the ${width}px picture at ${time}s`);
        assert(attr(node,'y')>=0&&attr(node,'y')<=box[3]);
      }
      for(const node of [...drawing(f).querySelectorAll('rect')].filter(visible)) {
        assert(attr(node,'x')>=0&&attr(node,'x')+attr(node,'width')<=width+1e-10);
        assert(attr(node,'y')>=0&&attr(node,'y')+attr(node,'height')<=box[3]+1e-10);
      }
      // The sum rides the centre of its bracket, which never leaves the four columns.
      const sumX=attr(f.$('[data-sum-value]'),'x');
      assert(sumX>=attr(f.$('[data-key="0"]'),'x')&&sumX<=attr(f.$('[data-key="3"]'),'x'));
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
    assert.equal(values.length,2,'the two real keys carry the whole row');
    close(values[0],0.40901318192481995,0.00051); close(values[1],0.5909868478775024,0.00051);
    assert.equal(print.querySelector('[data-padded-mass]').textContent,'PAD share 0');
    assert.deepEqual([2,3].map(j=>print.querySelector(`[data-score="${j}"]`).textContent),['−∞','−∞']);
    assert.deepEqual([2,3].map(j=>print.querySelector(`[data-exp-value="${j}"]`).textContent),['0','0']);
    close(numericText(print.querySelector('[data-sum-value]')),1.7233,0.00051);
    assert(print.querySelector('[data-guard]').textContent.trim());
    assert(!print.querySelector('[data-guard]').hasAttribute('hidden'));
  }
  f.load(); f.open(); f.seek(40); f.resize(296);
  assert.equal(f.root.querySelectorAll('[data-static-frame="narrow"]').length,0);
  assert.equal(numbers(f.$('[data-figure] svg').getAttribute('viewBox'))[3],height);
  const css=read('mask-before-softmax/player.css');
  assert.match(css,/@container\s*\(max-width:\s*\d+px\)/);
  assert.match(css,new RegExp(`aspect-ratio:\\s*296\\s*/\\s*${height}`));
});

test('mask before softmax: the transcript tells the same eight beats with the fixture\'s own numbers', t=>{
  const f=fixture(t,NAME),fx=declared(f),items=[...f.root.querySelectorAll('.mechanism-transcript ol li')];
  assert.equal(items.length,scene.beats.length);
  const wrong=exact(fx,1),right=exact(fx,0);
  const allowed=[wrong.denominator,right.denominator,wrong.paddedMass,right.weights[0],right.weights[1]].map(value=>value.toFixed(4));
  const printed=items.flatMap(item=>item.textContent.match(/\d+\.\d+/g)||[]);
  assert(printed.length>=5);
  for(const value of printed) assert(allowed.includes(value),`the transcript prints ${value}, which the fixture does not produce`);
  for(const item of items) assert.doesNotMatch(item.textContent,/\bexp\(|-\d|-inf/i,`ASCII math in the transcript: ${item.textContent}`);
  assert.match(items[5].textContent,/toward negative infinity/i); assert.match(items[5].textContent,/real keys/i);
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
