#!/usr/bin/env node
// Independent local derivatives and activation-factor products. No training,
// recurrent-gate fixture, or claim about a complete network Jacobian.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const {execFileSync}=require('node:child_process');
const {ROOT,read,entry,chapterSource,numbers,close,canonicalMarkup,fixture,
  registerTransportTests,registerBeatHoldTest,registerGrammarTests}=require('./html-tests/excerpt-harness.cjs');
const {staticFrame}=require('./render_static_frames.cjs');

const NAME='derivative-gates-excerpt',scene=entry(NAME);
const FIXTURE={domain:[-6,6],samples:300,maxGates:10};
const widths=[240,296,360,519,520,553,559,560,713];
const PIXEL_EPSILON=5.1e-10;
const attr=(node,key)=>Number(node.getAttribute(key));
const data=(f,key)=>JSON.parse(f.root.dataset[key]);
const visible=node=>Boolean(node&&!node.closest('[hidden]'));
const drawing=f=>f.$('[data-drawing]');
const numericTokens=text=>(text.match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi)||[]).map(Number);
const closeTree=(actual,expected,epsilon=1e-12)=>{
  if(Array.isArray(expected)) {
    assert(Array.isArray(actual));assert.equal(actual.length,expected.length);
    expected.forEach((value,index)=>closeTree(actual[index],value,epsilon));
  } else close(actual,expected,epsilon);
};
const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
const ease=value=>{const x=clamp(value,0,1);return x*x*(3-2*x);};
// cosh is independent of the player's signed/stable exponential evaluation.
const sigmoid=z=>1/(1+Math.exp(-z));
const sigmoidDerivative=z=>1/(4*Math.cosh(z/2)**2);
const reluDerivative=z=>z>0?1:0; // PyTorch's convention at the nonsmooth zero.
const factorProduct=k=>Array.from({length:k},()=>0.25).reduce((product,value)=>product*value,1);
function oracle(time,source=FIXTURE,reduced=false) {
  const t=clamp(Number.isFinite(time)?time:0,0,40),stage=Math.min(7,Math.floor(t/5));
  const held=reduced?scene.beats[stage]:t;
  const z=source.domain[1]*ease((held-12)/3),kind=stage===5?'relu':'sigmoid';
  const activation=kind==='relu'?Math.max(0,z):sigmoid(z),factor=kind==='relu'?reluDerivative(z):sigmoidDerivative(z);
  const localProgress=stage===0?0:stage===1?ease((held-7)/3):stage===3?ease((held-17)/3):1;
  const localPassed=localProgress>=0.5;
  const travel=clamp((held-30)/5,0,1)*(source.maxGates+1);
  const gateCount=Math.min(source.maxGates,Math.floor(travel));
  return{stage,held,z,sigmoid:sigmoid(z),sigmoidGate:sigmoidDerivative(z),reluGate:reluDerivative(z),
    ceiling:0.25,gateCount,bound:factorProduct(gateCount),kind,activation,factor,localProgress,localPassed,
    signalValue:localPassed?factor:1,backwardVisible:stage>=1,chainVisible:stage>=6};
}
function verifyState(state,time,source=FIXTURE,reduced=false) {
  const expected=oracle(time,source,reduced);
  for(const[key,value]of Object.entries(expected)) {
    if(typeof value==='boolean'||typeof value==='string')assert.equal(state[key],value,key);else close(state[key],value);
  }
  assert.equal(state.bound,expected.bound,'integer powers of a quarter are exact binary fractions');
  assert.equal(state.curve.length,source.samples);
  state.curve.forEach((point,index)=>{
    const z=source.domain[0]+(source.domain[1]-source.domain[0])*index/(source.samples-1);
    close(point.z,z);close(point.sigmoid,sigmoid(z));close(point.sigmoidGate,sigmoidDerivative(z));assert.equal(point.reluGate,reluDerivative(z));
    assert(point.sigmoidGate>0&&point.sigmoidGate<=0.25);
  });
  assert.equal(state.bounds.length,source.maxGates+1);
  state.bounds.forEach((point,k)=>{assert.equal(point.k,k);assert.equal(point.value,factorProduct(k));});
  return expected;
}

registerTransportTests(NAME,{witness:/9\.5[34]|one in a million/,anchors:['derivative-gates-playback-help'],width:713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('Derivative gates: fixture and operation come from the existing Chapter 5 witness',t=>{
  const f=fixture(t,NAME),chapter=chapterSource(NAME);f.load();f.open();
  assert.deepEqual(data(f,'fixture'),FIXTURE);
  assert.equal(scene.qmd,'chapters/part1/05-backpropagation.qmd');assert.equal(scene.duration,40);
  assert.deepEqual(scene.beats,[0,5,10,15,20,25,30,35]);
  for(const literal of scene.fixture.literals)assert(chapter.includes(literal),literal);
  assert(chapter.includes('z = torch.linspace(-6, 6, 300)'));
  assert(chapter.includes('sigmoid_gate = sig * (1 - sig)'));
  assert(chapter.includes('relu_gate = (z > 0).float()'));
  assert.match(chapter,/At the kink.*PyTorch uses derivative.*0/s);
  verifyState(f.w.BookDerivativeGates.buildState(40),40);
});

test('Derivative gates: the sigmoid ceiling is analytic, not the maximum sampled on an even grid',t=>{
  const f=fixture(t,NAME);f.load();f.open();const build=f.w.BookDerivativeGates.buildState;
  const zero=build(10);assert.equal(zero.z,0);assert.equal(zero.sigmoid,0.5);assert.equal(zero.sigmoidGate,0.25);
  assert(!zero.curve.some(point=>point.z===0),'the manuscript 300-point linspace omits zero');
  assert(Math.max(...zero.curve.map(point=>point.sigmoidGate))<zero.ceiling);
  for(const point of zero.curve) {
    close(0.25-point.sigmoidGate,(sigmoid(point.z)-0.5)**2);
    close(point.sigmoidGate,sigmoidDerivative(-point.z));assert(point.sigmoidGate>0);
  }
  const negative=zero.curve[0],positive=build(15);close(negative.sigmoidGate,0.002466509291360048);
  close(positive.sigmoidGate,negative.sigmoidGate);assert(negative.sigmoidGate>0&&positive.sigmoidGate>0);
});

test('Derivative gates: ReLU zero is the declared kink convention, not an open gate',t=>{
  const f=fixture(t,NAME);f.load();f.open();const build=f.w.BookDerivativeGates.buildState;
  for(const time of [0,5,9.999,10,11,12,12.001,15,25,29.999,30,40]) {
    const state=build(time);verifyState(state,time);assert.equal(state.reluGate,state.z>0?1:0);
  }
  assert.equal(build(10).reluGate,0);assert.equal(build(12).reluGate,0);assert.equal(build(15).reluGate,1);
});

test('Derivative gates: quarter products count activation gates and stay positive without a magnitude floor',t=>{
  const f=fixture(t,NAME);f.load();f.open();const build=f.w.BookDerivativeGates.buildState;
  for(let step=0;step<=160;step++) {
    const time=25+step/10,state=build(time);verifyState(state,time);
    assert(Number.isInteger(state.gateCount));assert(state.gateCount>=0&&state.gateCount<=10);assert(state.bound>0);
  }
  const final=build(40);assert.equal(final.gateCount,10);assert.equal(final.bound,9.5367431640625e-7);
  assert(final.bound<1e-6);assert.equal(build(25).bound,1);assert.equal(build(30,true).gateCount,0);
  for(let k=1;k<=10;k++)assert.equal(final.bounds[k].value/final.bounds[k-1].value,0.25);
});

test('Derivative gates: a near-one sigmoid activation can transmit a tiny local backward sensitivity',t=>{
  const f=fixture(t,NAME);f.load();f.open();const build=f.w.BookDerivativeGates.buildState;
  for(const time of [0,5,7,8.5,10,12,13.5,15,17,18.5,20,25,30,35,40])verifyState(build(time),time);
  const centered=build(10),saturated=build(20),activeRelu=build(25);
  assert.equal(centered.activation,0.5);assert.equal(centered.factor,0.25);
  close(saturated.activation,0.9975273768433653);close(saturated.factor,0.002466509291360048);
  assert(saturated.activation>0.99&&saturated.signalValue<0.003);
  assert(saturated.activation>centered.activation&&saturated.factor<centered.factor);
  assert.equal(activeRelu.kind,'relu');assert.equal(activeRelu.activation,6);assert.equal(activeRelu.factor,1);
  assert.equal(activeRelu.signalValue,1);
  for(const time of [5,7.5,8.499,15,17.5,18.499])assert.equal(build(time).signalValue,1);
  for(const time of [8.5,10,18.5,20])assert.equal(build(time).signalValue,build(time).factor);
});

test('Derivative gates: bounded alternative fixtures remain correct and inputs are not mutated',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const source of [
    {domain:[-4,8],samples:101,maxGates:6},
    {domain:[-1,2],samples:2,maxGates:1},
    {domain:[-30,30],samples:301,maxGates:100}
  ]) {
    const before=JSON.stringify(source);
    for(const time of [0,5,8.5,10,13.5,15,20,25,28.4,30,35,40]) {
      verifyState(f.w.BookDerivativeGates.buildState(time,false,source),time,source);
      verifyState(f.w.BookDerivativeGates.buildState(time,true,source),time,source,true);
    }
    assert.equal(JSON.stringify(source),before);
  }
});

test('Derivative gates: invalid domains, sampling and gate counts fail before drawing',t=>{
  const f=fixture(t,NAME);f.load();f.open();const build=f.w.BookDerivativeGates.buildState;
  for(const patch of [{domain:[]},{domain:[-6]},{domain:[0,6]},{domain:[-6,0]},{domain:[2,6]},
    {domain:[6,-6]},{domain:[-31,6]},{domain:[-6,31]},{domain:[-6,Infinity]},{domain:[NaN,6]},
    {samples:1},{samples:2001},{samples:4.5},{samples:NaN},{maxGates:0},{maxGates:101},{maxGates:2.5}])
    assert.throws(()=>build(40,false,{...FIXTURE,...patch}),/domain|finite|sample|gate|integer|bound|zero|range/i);
  for(const time of [NaN,Infinity,-Infinity,-10,70])verifyState(build(time),time);
});

test('Derivative gates: secondary insets show actual activation functions and correctly scaled local tangents',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const width of widths) {
    f.resize(width);const fixed={};
    for(const time of [0,5,8.5,10,12.1234567,13.5,14.9,15,20,25,30,40]) {
      f.seek(time);const expected=oracle(time);
      for(const kind of ['sigmoid','relu']) {
        const inset=f.$(`[data-inset="${kind}"]`),frame=numericTokens(inset.querySelector('.dg-axis').getAttribute('d'));
        assert.equal(frame.length,6);const[left,top,,bottom,right]=frame;
        if(!fixed[kind])fixed[kind]=frame;closeTree(frame,fixed[kind],0);
        assert.equal(inset.dataset.quantity,'activation-function');
        assert.equal(inset.dataset.active,String(expected.kind===kind));
        const ymax=kind==='sigmoid'?1:6,xunit=(right-left)/12,yunit=(bottom-top)/ymax;
        const px=z=>left+(z+6)*xunit,py=value=>bottom-value*yunit;
        close(Number(inset.dataset.yMax),ymax);
        const curve=numericTokens(f.$(`[data-activation-curve="${kind}"]`).getAttribute('d'));
        if(kind==='sigmoid') {
          assert.equal(curve.length,600);
          for(let index=0;index<300;index++) {
            const z=-6+12*index/299;closeTree(curve.slice(2*index,2*index+2),[px(z),py(sigmoid(z))],2*PIXEL_EPSILON);
          }
        } else closeTree(curve,[px(-6),py(0),px(0),py(0),px(6),py(6)],2*PIXEL_EPSILON);
        const output=kind==='sigmoid'?sigmoid(expected.z):Math.max(0,expected.z),slope=kind==='sigmoid'?sigmoidDerivative(expected.z):reluDerivative(expected.z);
        const marker=f.$(`[data-activation-marker="${kind}"]`),tangent=f.$(`[data-tangent="${kind}"]`);
        closeTree([attr(marker,'cx'),attr(marker,'cy')],[px(expected.z),py(output)],PIXEL_EPSILON);
        assert.equal(visible(tangent),kind==='sigmoid'||expected.z!==0,'ReLU has a kink, not a classical zero tangent');
        if(visible(tangent)) {
          const za=-6+(attr(tangent,'x1')-left)/xunit,zb=-6+(attr(tangent,'x2')-left)/xunit;
          assert(zb>za&&za>=-6-PIXEL_EPSILON&&zb<=6+PIXEL_EPSILON);
          closeTree([attr(tangent,'y1'),attr(tangent,'y2')],[py(output+slope*(za-expected.z)),py(output+slope*(zb-expected.z))],3*PIXEL_EPSILON);
        }
      }
    }
  }
  assert.match(f.$('[data-inset-note]').textContent,/own vertical axes/);
});

test('Derivative gates: inactive insets keep text contrast and differ by a dashed curve, not opacity',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  const style=f.d.createElement('style');style.textContent=read('derivative-gates/player.css');f.d.head.append(style);
  for(const time of [0,20,25,30,40]) {
    f.seek(time);
    for(const kind of ['sigmoid','relu']) {
      const inset=f.$(`[data-inset="${kind}"]`),active=inset.dataset.active==='true';
      const elements=[inset,...inset.querySelectorAll('*')];
      for(const node of elements) {
        const opacity=f.w.getComputedStyle(node).opacity;
        assert(opacity===''||Number(opacity)===1,`${kind} ${node.tagName} is faded at ${time}s`);
      }
      const curve=f.$(`[data-activation-curve="${kind}"]`),dash=f.w.getComputedStyle(curve).strokeDasharray;
      if(active)assert(dash===''||dash==='none','active curve remains solid');
      else assert.deepEqual(numericTokens(dash),[3,2],'inactive curve uses a redundant pattern cue');
    }
  }
});

test('Derivative gates: the same component carries forward values and a reverse local probe',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const width of widths) {
    f.resize(width);
    for(const time of [0,5,7.1234567,8.5,10,13.5,15,17.5,18.5,20,25,30,40]) {
      f.seek(time);const expected=oracle(time),input=f.$('[data-input-node]'),output=f.$('[data-output-node]'),component=f.$('[data-activation-node]');
      const lx=attr(input,'cx'),rx=attr(output,'cx'),fy=attr(input,'cy'),cx=attr(component,'x')+attr(component,'width')/2;
      assert(lx<cx&&cx<rx);assert.equal(attr(output,'cy'),fy);
      closeTree(numericTokens(f.$('[data-forward-left]').getAttribute('d')),[lx+attr(input,'r'),fy,attr(component,'x'),fy],PIXEL_EPSILON);
      closeTree(numericTokens(f.$('[data-forward-right]').getAttribute('d')),[attr(component,'x')+attr(component,'width'),fy,rx-attr(output,'r'),fy],PIXEL_EPSILON);
      const multiplier=f.$('[data-local-multiplier]'),by=attr(multiplier,'y')+attr(multiplier,'height')/2;
      close(attr(multiplier,'x')+attr(multiplier,'width')/2,cx);assert(by>fy);
      closeTree(numericTokens(f.$('[data-cache-link]').getAttribute('d')),[cx,attr(component,'y')+attr(component,'height'),cx,attr(multiplier,'y')],PIXEL_EPSILON);
      closeTree(numericTokens(f.$('[data-reverse-wire]').getAttribute('d')),[rx,by,lx,by],PIXEL_EPSILON);
      for(const node of f.root.querySelectorAll('[data-forward-arrow]')) {
        const p=numericTokens(node.getAttribute('d'));assert(p[2]>p[0]&&p[2]>p[4],'forward arrow must point right');
      }
      for(const node of f.root.querySelectorAll('[data-reverse-arrow]')) {
        const p=numericTokens(node.getAttribute('d'));assert(p[2]<p[0]&&p[2]<p[4],'backward arrow must point left');
      }
      const pulse=f.$('[data-local-pulse]'),ring=f.$('[data-local-locator]');
      const center=[rx+(lx-rx)*expected.localProgress,by];
      closeTree([attr(pulse,'cx'),attr(pulse,'cy')],center,PIXEL_EPSILON);closeTree([attr(ring,'cx'),attr(ring,'cy')],center,PIXEL_EPSILON);
      close(attr(pulse,'r'),14*Math.sqrt(expected.signalValue),PIXEL_EPSILON);
      close((attr(pulse,'r')/14)**2,expected.signalValue,2*PIXEL_EPSILON);
      assert.equal(attr(ring,'r'),16,'the hollow locator must not encode a changing sensitivity');
      assert.equal(Number(f.root.dataset.signalValue),f.w.BookDerivativeGates.buildState(time).signalValue);
      assert.equal(f.$('[data-activation-name]').textContent,expected.kind==='relu'?'ReLU':'sigmoid');
      if(expected.localPassed)assert.notEqual(f.$('[data-downstream-value]').textContent,'?');
      else assert.equal(f.$('[data-downstream-value]').textContent,'?');
      assert.match(f.$('[data-upstream-value]').textContent,/unit probe.*1/);
    }
  }
  assert.match(f.$('[data-signal-legend]').textContent,/filled area.*sensitivity.*ring.*location/);
  const css=read('derivative-gates/player.css');assert.match(css,/\.dg-locator\s*\{[^}]*fill:\s*none/);
  assert.match(css,/\.dg-sensitivity\s*\{[^}]*fill:\s*var\(--dg-error\)/);
});

test('Derivative gates: each backward chain crossing multiplies filled area without shrinking the locator',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const width of widths) {
    f.resize(width);let fixed;
    for(const time of [30,30.01,30.4544,30.4546,31,31.9,32.5,33.7,34.5454,34.5456,35,40]) {
      f.seek(time);const expected=oracle(time),curve=numericTokens(f.$('[data-chain-wire]').getAttribute('d'));
      const points=Array.from({length:curve.length/2},(_,i)=>curve.slice(2*i,2*i+2));
      assert.equal(points.length,12);if(!fixed)fixed=points;closeTree(points,fixed,0);
      closeTree(data(f,'chainPoints'),points,PIXEL_EPSILON);
      const gates=[...drawing(f).querySelectorAll('[data-gate]')];assert.equal(gates.length,10);
      gates.forEach((gate,i)=>{
        closeTree([attr(gate,'cx'),attr(gate,'cy')],points[i+1],PIXEL_EPSILON);
        assert.equal(gate.dataset.passed,String(i<expected.gateCount));
        assert.equal(f.$(`[data-gate-index="${i+1}"]`).textContent,String(i+1));
        assert.match(f.$(`[data-gate-label="${i+1}"]`).textContent,/¼|1\/4/);
        const arrow=numericTokens(f.$(`[data-chain-arrow="${i+1}"]`).getAttribute('d'));
        const dx=points[i+2][0]-points[i+1][0],dy=points[i+2][1]-points[i+1][1];
        const tail=[(arrow[0]+arrow[4])/2,(arrow[1]+arrow[5])/2];
        assert((arrow[2]-tail[0])*dx+(arrow[3]-tail[1])*dy>0,'chain arrow follows the next component');
      });
      assert.equal(new Set(gates.map(g=>attr(g,'cy'))).size,width<280?3:width<560?2:1,'phone chain reflows, without shrinking its components');
      const travel=clamp((time-30)/5,0,1)*11,segment=Math.min(10,Math.floor(travel)),fraction=travel-segment;
      const center=points[segment].map((value,axis)=>value+(points[segment+1][axis]-value)*fraction);
      const pulse=f.$('[data-chain-pulse]'),ring=f.$('[data-chain-locator]');
      closeTree([attr(pulse,'cx'),attr(pulse,'cy')],center,2*PIXEL_EPSILON);closeTree([attr(ring,'cx'),attr(ring,'cy')],center,2*PIXEL_EPSILON);
      assert.equal(attr(ring,'r'),16);assert.equal(attr(pulse,'r'),14*2**(-expected.gateCount));
      assert.equal((attr(pulse,'r')/14)**2,expected.bound,'area matches exact binary quarter powers with no lower floor');
      assert(attr(pulse,'r')>0);assert.equal(Number(f.root.dataset.bound),expected.bound);
      assert.equal(f.$('[data-factor-chain]').dataset.quantity,'sigmoid-activation-factor-ceiling');
      assert.match(f.$('[data-chain-note]').textContent,/best case.*weights omitted/i);
      assert.match(f.$('[data-bound-value]').textContent,new RegExp(`^${expected.gateCount} factors: at most `));
      if(time>=35) {
        assert.match(f.$('[data-bound-value]').textContent,/9\.54e-7/);
        assert(expected.bound>expected.sigmoidGate**10,'the chain is a ceiling, not ten copies of the saturated witness');
      }
    }
  }
});

test('Derivative gates: forward witnesses precede backward transmission and the activation-only chain',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const time of [0,4.99,5,9.99,10,15,19.99,20,24.99,25,29.99,30,34.99,35,40]) {
    f.seek(time);const expected=oracle(time);
    for(const selector of ['[data-forward-network]','[data-activation-value]','[data-z-value]'])assert(visible(f.$(selector)));
    for(const selector of ['[data-backward-network]','[data-cache-link]','[data-local-pulse]','[data-signal-legend]'])
      assert.equal(visible(f.$(selector)),expected.backwardVisible);
    for(const selector of ['[data-factor-chain]','[data-chain-pulse]','[data-bound-value]'])
      assert.equal(visible(f.$(selector)),expected.chainVisible);
    const formula=f.$('[data-formula]');
    assert.equal(formula.classList.contains('dg-local-shown'),expected.backwardVisible);
    assert.equal(formula.classList.contains('dg-bound-shown'),expected.chainVisible);
    assert.equal(formula.classList.contains('dg-highlight-relu'),expected.kind==='relu');
    if(time<5)assert.doesNotMatch(f.$('[data-figure] svg').getAttribute('aria-label'),/multiplied|derivative|0\.25/);
    if(time<30)assert.doesNotMatch(f.$('[data-figure] svg').getAttribute('aria-label'),/\d+ gates|ceiling/);
  }
});

test('Derivative gates: narrow panes keep visible geometry readable and serialize pixels, not model values',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  const style=f.d.createElement('style');style.textContent=read('derivative-gates/player.css');f.d.head.append(style);
  for(const width of widths) {
    f.resize(width);
    for(const time of [0,5,8.1234567,10,13.1234567,15,20,25,28.1234567,30,35,40]) {
      f.seek(time);const state=f.w.BookDerivativeGates.buildState(time),box=numbers(f.$('[data-figure] svg').getAttribute('viewBox'));
      assert.equal(box[2],width);
      for(const key of ['z','sigmoid','sigmoidGate','reluGate','bound','gateCount'])assert.equal(Number(f.root.dataset[key]),state[key]);
      closeTree(data(f,'curve').map(point=>point.sigmoidGate),state.curve.map(point=>point.sigmoidGate),0);
      for(const node of [...drawing(f).querySelectorAll('text')].filter(visible)) {
        assert(parseFloat(f.w.getComputedStyle(node).fontSize)>=12,`small label at ${width}: ${node.textContent}`);
        assert(attr(node,'x')>=0&&attr(node,'x')<=width);assert(attr(node,'y')>=0&&attr(node,'y')<=box[3]);
      }
      for(const node of drawing(f).querySelectorAll('*'))for(const key of ['x','x1','x2','y','y1','y2','cx','cy','width','height']) {
        if(!node.hasAttribute(key))continue;const value=attr(node,key);assert(Number.isFinite(value));
        assert.equal(value,Number(value.toFixed(9)));
        if(visible(node)) {
          const limit=key.startsWith('x')||key==='cx'||key==='width'?width:box[3];
          assert(value>=0&&value<=limit,`${key}=${value} exceeds ${limit} at ${width}`);
        }
      }
      for(const node of drawing(f).querySelectorAll('[d]'))for(const value of numericTokens(node.getAttribute('d')))
        assert.equal(value,Number(value.toFixed(9)));
      for(const node of [...drawing(f).querySelectorAll('circle')].filter(visible)) {
        const x=attr(node,'cx'),y=attr(node,'cy'),r=attr(node,'r');
        assert(r>0&&Number.isFinite(r));assert.equal(r,Number(r.toFixed(9)));
        assert(x-r>=0&&x+r<=width,`circle extent [${x-r},${x+r}] exceeds width ${width}`);
        assert(y-r>=0&&y+r<=box[3]);
      }
      assert(drawing(f).querySelectorAll('*').length<180);
    }
  }
});

test('Derivative gates: arbitrary seek and resize histories reproduce drawing and full-precision state',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  const snapshot=()=>JSON.stringify({drawing:canonicalMarkup(f.$('[data-figure]').innerHTML),
    formula:canonicalMarkup(f.$('[data-formula]').outerHTML),caption:f.$('[data-caption]').innerHTML,
    state:Object.fromEntries(Object.entries(f.root.dataset).filter(([key])=>!['time','playing','typeset'].includes(key)))});
  const times=[0,5,7.3,8.7,10,12.3,14.7,15,20,25,27,28.1,30,32.7,35,40];
  const snapshots=times.map(time=>{f.seek(time);return snapshot();});
  f.play();f.tick(1733);f.resize(296);f.seek(31.4);f.resize(713);
  assert.deepEqual(times.toReversed().map(time=>{f.seek(time);return snapshot();}),snapshots.toReversed());
});

test('Derivative gates: both script-free prints equal the final frame and preserve the positive witness',async t=>{
  const generated=await staticFrame(NAME);assert.equal(generated.before,generated.after,'regenerate derivative-gate static frames');
  const f=fixture(t,NAME),narrow=f.$('[data-static-frame="narrow"]');assert(narrow);
  assert.equal(narrow.dataset.width,'296');const height=Number(narrow.dataset.height);
  const ids=[...f.root.querySelectorAll('[id]')].map(node=>node.id);assert.equal(ids.length,new Set(ids).size);
  for(const frame of [drawing(f),narrow])assert.match(frame.textContent,/9\.5[34]|one in a million/);
  f.load();f.open();f.seek(40);f.resize(296);
  assert.equal(f.root.querySelectorAll('[data-static-frame="narrow"]').length,0);
  assert.equal(numbers(f.$('[data-figure] svg').getAttribute('viewBox'))[3],height);
});

test('Derivative gates: exp or sqrt ULP differences cannot change generated static SVG bytes',()=>{
  const diagnostic=String.raw`
    const assert=require('node:assert/strict');
    const harness=require(process.argv[1]+'/scripts/html-tests/excerpt-harness.cjs');
    const originalFixture=harness.fixture;let offset=0,method='exp';
    const adjacent=value=>{
      const view=new DataView(new ArrayBuffer(8));view.setFloat64(0,value);
      view.setBigUint64(0,view.getBigUint64(0)+BigInt(offset));return view.getFloat64(0);
    };
    harness.fixture=(...args)=>{
      const f=originalFixture(...args),original=f.w.Math[method];
      f.w.Math[method]=value=>{const result=original(value);return result>0&&Number.isFinite(result)?adjacent(result):result;};return f;
    };
    const {staticFrame}=require(process.argv[1]+'/scripts/render_static_frames.cjs');
    (async()=>{
      const base=await staticFrame('derivative-gates');assert.equal(base.before,base.after);
      for(const name of ['exp','sqrt'])for(const ulps of [-4,-2,-1,1,2,4]) {
        method=name;offset=ulps;const next=await staticFrame('derivative-gates');
        assert.equal(next.after,base.after,'static SVG changed under '+ulps+' ULPs of '+name);
      }
    })().catch(error=>{console.error(error.message);process.exitCode=1;});
  `;
  execFileSync(process.execPath,['-e',diagnostic,ROOT],{stdio:'pipe',timeout:15000});
});

test('Derivative gates: the scope is activation factors, not measured training or a full gradient bound',t=>{
  const f=fixture(t,NAME),boundary=f.$('.mechanism-boundary').textContent.replace(/\s+/g,' ');
  assert.match(boundary,/activation|local derivative/i);assert.match(boundary,/weight/i);
  const explanation=[boundary,f.$('.mechanism-transcript').textContent].join(' ').replace(/\s+/g,' ');
  assert.match(explanation,/not.*(?:complete|full).*(?:gradient|Jacobian)|(?:complete|full).*(?:gradient|Jacobian).*not/i);
  assert.match(explanation,/PyTorch.*(?:zero|0)|(?:zero|0).*PyTorch/i);
  assert.match(explanation,/positive|nonzero|non-zero/i);
  assert.match(explanation,/not.*(?:observed loss|measured).*gradient/i);
  assert.match(explanation,/not ten simulated forward activations|not a simulated forward network/i);
  assert.match(explanation,/does not cross an uncomputed weight matrix/i);
  assert.doesNotMatch(read('derivative-gates/player.js'),/Math\.random|fetch\(|import\(|setInterval\(|SIG_NORMS|RELU_NORMS|gradient_diagnostic|LSTM|b_f/);
  f.load();f.open();assert.equal(f.root.querySelectorAll('input[type="range"]').length,1,'only the timeline is adjustable');
  const filter=fs.readFileSync(path.join(ROOT,scene.filter),'utf8');
  assert.match(filter,/^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
  assert.doesNotMatch(read('derivative-gates/panel.html'),/@eq-/);
});
