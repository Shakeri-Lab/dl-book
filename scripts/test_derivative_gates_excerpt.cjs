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
const widths=[240,287,288,296,360,519,520,553,559,560,713];
// Drawing coordinates are serialized at 0.0001 px; the mathematical state is never rounded.
const PIXEL_DIGITS=4,PIXEL_EPSILON=5.1e-5;
// Marks on the face are checked against the face's own frame as the DOM declares it, and
// that frame is serialized too: mid-compression both sides carry a 0.0001 px rounding.
const FACE_EPSILON=3e-4;
const attr=(node,key)=>Number(node.getAttribute(key));
const data=(f,key)=>JSON.parse(f.root.dataset[key]);
const visible=node=>Boolean(node&&!node.closest('[hidden]'));
const drawing=f=>f.$('[data-drawing]');
const slider=f=>f.$('[data-z-slider]');
const scrubber=f=>f.$('[data-controls] input[type=range]');
const picture=f=>f.$('[data-figure] svg');
// The reader's own z: set the real range and fire the event a drag fires.
const drag=(f,z)=>{slider(f).value=String(z);slider(f).dispatchEvent(new f.w.Event('input',{bubbles:true}));};
const press=(f,key,init={},target=f.$('[data-pane]'))=>target.dispatchEvent(
  new f.w.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true,...init}));
const styled=f=>{const style=f.d.createElement('style');style.textContent=read('derivative-gates/player.css');f.d.head.append(style);return f;};
// The full-precision state the page publishes. Geometry tests check the drawing against it;
// verifyMath and the TIMELINE witnesses check the state itself, independently.
const published=f=>{
  const d=f.root.dataset,n=key=>Number(d[key]),b=key=>d[key]==='true';
  return{z:n('z'),kind:d.kind,factor:n('factor'),activation:n('activation'),localProgress:n('localProgress'),
    probeOpacity:n('probeOpacity'),signalValue:n('signalValue'),revealed:b('revealed'),delivered:b('delivered'),kink:b('kink'),
    gateCount:n('gateCount'),bound:n('bound'),travel:n('travel'),marker:n('marker'),hops:n('hops'),rulerExponent:n('rulerExponent'),actMix:n('actMix'),
    backwardVisible:b('backwardVisible'),ceilingVisible:b('ceilingVisible'),chainVisible:b('chainVisible'),override:d.override};
};
const shownText=f=>[...drawing(f).querySelectorAll('text')].filter(visible);
const numericTokens=text=>(text.match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi)||[]).map(Number);
const closeTree=(actual,expected,epsilon=1e-12)=>{
  if(Array.isArray(expected)) {
    assert(Array.isArray(actual));assert.equal(actual.length,expected.length);
    expected.forEach((value,index)=>closeTree(actual[index],value,epsilon));
  } else close(actual,expected,epsilon);
};
// cosh is independent of the player's signed/stable exponential evaluation.
const sigmoid=z=>1/(1+Math.exp(-z));
const sigmoidDerivative=z=>1/(4*Math.cosh(z/2)**2);
const reluDerivative=z=>z>0?1:0; // PyTorch's convention at the nonsmooth zero.
const factorProduct=k=>Array.from({length:k},()=>0.25).reduce((product,value)=>product*value,1);
// Independent mathematics, keyed by the input the player REPORTS, never by the clock: the
// suite owns no copy of the player's stage or easing logic, so a timing defect cannot hide
// inside a mirrored formula. Timing is asserted separately, as literal named-time witnesses.
function verifyMath(state,source=FIXTURE) {
  const relu=state.kind==='relu';assert(relu||state.kind==='sigmoid');
  assert(state.z>=source.domain[0]&&state.z<=source.domain[1]);
  close(state.sigmoid,sigmoid(state.z));close(state.sigmoidGate,sigmoidDerivative(state.z));
  assert.equal(state.reluGate,reluDerivative(state.z));
  close(state.activation,relu?Math.max(0,state.z):sigmoid(state.z));
  close(state.factor,relu?reluDerivative(state.z):sigmoidDerivative(state.z));
  assert.equal(state.kink,relu&&state.z===0);
  assert.equal(state.ceiling,0.25);
  assert(Number.isInteger(state.gateCount)&&state.gateCount>=0&&state.gateCount<=source.maxGates);
  assert.equal(state.bound,factorProduct(state.gateCount),'integer powers of a quarter are exact binary fractions');
  // The ruler reads log10 of the value: a whole number of steps is log10(.25^k), and the marker never leaves the chain's reach.
  assert(state.marker>=0&&state.marker<=source.maxGates);close(state.rulerExponent,state.marker*Math.log10(0.25));
  assert(Math.abs(state.marker-state.gateCount)<=0.5+1e-9,'the marker and the packet count the same gates');
  assert.equal(state.curve.length,source.samples);
  state.curve.forEach((point,index)=>{
    const z=source.domain[0]+(source.domain[1]-source.domain[0])*index/(source.samples-1);
    close(point.z,z);close(point.sigmoid,sigmoid(z));close(point.sigmoidGate,sigmoidDerivative(z));assert.equal(point.reluGate,reluDerivative(z));
    assert(point.sigmoidGate>0&&point.sigmoidGate<=0.25);
  });
  assert.equal(state.bounds.length,source.maxGates+1);
  state.bounds.forEach((point,k)=>{assert.equal(point.k,k);assert.equal(point.value,factorProduct(k));close(point.exponent,Math.log10(factorProduct(k)),1e-9);});
}
// The timeline the receipt states, as literal witnesses. `z` is a fraction of the domain's
// upper end; `probe` is the unit probe's position (0 output side, 1 input side) and `drawn`
// whether it is on the picture; `printed` says whether the multiplier shows its factor
// (the delivered value is printed beside the packet once it rests at the input side);
// `area` is the packet's filled area (unit, the quarter measured at zero, or the saturated
// factor at the domain's upper end); `gates` counts the chain factors crossed and `steps`
// the marker's whole steps on the log ruler (a fraction of the chain's length).
const TIMELINE=[
  {time:0,stage:0,z:0,probe:0,drawn:true,printed:false,area:'unit',gates:0,steps:0},
  {time:5,stage:1,z:0,probe:0,drawn:true,printed:false,area:'unit',gates:0,steps:0},
  {time:7,stage:1,z:0,probe:0,drawn:true,printed:false,area:'unit',gates:0,steps:0},
  {time:8,stage:1,z:0,probe:0.5,drawn:true,printed:true,area:'quarter',gates:0,steps:0},
  {time:9,stage:1,z:0,probe:1,drawn:true,printed:true,area:'quarter',gates:0,steps:0},
  {time:10,stage:2,z:0,probe:1,drawn:true,printed:true,area:'quarter',gates:0,steps:0},
  {time:12,stage:2,z:0,probe:1,drawn:true,printed:true,area:'quarter',gates:0,steps:0},
  {time:13.5,stage:2,z:0.5,drawn:false,printed:false,gates:0,steps:0},
  {time:15,stage:3,z:1,probe:0,drawn:true,printed:false,area:'unit',gates:0,steps:0},
  {time:17,stage:3,z:1,probe:0,drawn:true,printed:false,area:'unit',gates:0,steps:0},
  {time:18,stage:3,z:1,probe:0.5,drawn:true,printed:true,area:'saturated',gates:0,steps:0},
  {time:19,stage:3,z:1,probe:1,drawn:true,printed:true,area:'saturated',gates:0,steps:0},
  {time:20,stage:4,z:1,probe:1,drawn:true,printed:true,area:'saturated',gates:0,steps:0},
  // ReLU asks for no prediction: its slope is on the multiplier at once, and the probe leaves after
  // one second and passes whole, so it rests delivered before the stage starts to move at 28.5 s.
  {time:25,stage:5,relu:true,z:1,probe:0,drawn:true,printed:true,area:'unit',gates:0,steps:0},
  {time:26,stage:5,relu:true,z:1,probe:0,drawn:true,printed:true,area:'unit',gates:0,steps:0},
  {time:27,stage:5,relu:true,z:1,probe:0.5,drawn:true,printed:true,area:'unit',gates:0,steps:0},
  {time:28,stage:5,relu:true,z:1,probe:1,drawn:true,printed:true,area:'unit',gates:0,steps:0},
  {time:28.5,stage:5,relu:true,z:1,probe:1,drawn:true,printed:true,area:'unit',gates:0,steps:0},
  {time:29.25,stage:5,relu:true,z:1,probe:1,drawn:true,printed:true,area:'unit',gates:0,steps:0,act:0.5},
  {time:30,stage:6,z:1,probe:1,drawn:true,printed:true,area:'saturated',gates:0,steps:0},
  {time:30.5,stage:6,z:1,probe:1,drawn:true,printed:true,area:'saturated',gates:0,steps:0},
  {time:32.75,stage:6,z:1,probe:1,drawn:true,printed:true,area:'saturated',gates:0.5,steps:0.5},
  {time:35,stage:7,z:1,probe:1,drawn:true,printed:true,area:'saturated',gates:1,steps:1},
  {time:40,stage:7,z:1,probe:1,drawn:true,printed:true,area:'saturated',gates:1,steps:1}
];
// Reduced motion: one still per five-second beat. Each is the beat's first frame, except the
// ReLU beat (its delivered probe, 28 s) and the depth beat (its halfway point, 32.75 s).
const REST=[0,5,10,15,20,28,32.75,35];
const STILLS=REST.map(time=>TIMELINE.find(row=>row.time===time));
function verifyWitness(state,row,source=FIXTURE) {
  const high=source.domain[1],label=`at ${row.time}s`;
  assert.equal(state.stage,row.stage,label);assert.equal(state.kind,row.relu?'relu':'sigmoid',label);
  close(state.z,row.z*high);assert.equal(state.dragged,false);
  assert.equal(state.probeOpacity>0,row.drawn,`probe drawn ${label}`);
  if(row.drawn){assert.equal(state.probeOpacity,1,label);close(state.localProgress,row.probe);}
  assert.equal(state.revealed,row.printed,`factor printed ${label}`);
  assert.equal(state.delivered,row.printed&&row.probe===1,`delivered value printed ${label}`);
  if(row.area)close(state.signalValue,{unit:1,quarter:0.25,saturated:sigmoidDerivative(high)}[row.area]);
  assert.equal(state.gateCount,Math.round(row.gates*source.maxGates),label);close(state.marker,row.steps*source.maxGates,1e-9);
  assert.equal(state.backwardVisible,row.time>=5);assert.equal(state.ceilingVisible,row.time>=8);assert.equal(state.chainVisible,row.time>=30);
  // Two acts: the component picture has the whole stage until 28.5 s and is the strip over the chain from 30 s.
  close(state.actMix,row.act===undefined?(row.time>=30?1:0):row.act);
  verifyMath(state,source);
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
  verifyWitness(f.w.BookDerivativeGates.buildState(40),TIMELINE.at(-1));
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
  // The reader's z = 0 is the same exact identity, including a negative zero from the control.
  for(const z of [0,-0,'0'])for(const time of [0,16,40]){const s=build(time,false,FIXTURE,z);assert.equal(s.sigmoid,0.5);assert.equal(s.sigmoidGate,0.25);assert(Object.is(s.z,0));}
});

test('Derivative gates: ReLU zero is the declared kink convention, not an open gate',t=>{
  const f=fixture(t,NAME);f.load();f.open();const build=f.w.BookDerivativeGates.buildState;
  for(const time of [0,5,9.999,10,11,12,12.001,15,25,29.999,30,40]) {
    const state=build(time);verifyMath(state);assert.equal(state.reluGate,state.z>0?1:0);
  }
  assert.equal(build(10).reluGate,0);assert.equal(build(12).reluGate,0);assert.equal(build(15).reluGate,1);
  // On the picture: the ReLU face keeps an explicit vertex at zero, and at that vertex there is
  // no tangent and the multiplier does not call PyTorch's zero a slope.
  f.seek(28.5);
  for(const[z,label,tangent,packet]of [[3,'× slope = 1',true,true],[0.1,'× slope = 1',true,true],[0,'× 0 (kink rule)',false,false],[-0.1,'× slope = 0',true,false],[-6,'× slope = 0',true,false]]) {
    drag(f,z);const state=published(f);assert.equal(state.kind,'relu');assert.equal(state.kink,z===0);
    assert.equal(f.$('[data-factor-value]').textContent,label);assert.equal(visible(f.$('[data-tangent]')),tangent,`tangent at z=${z}`);
    assert.equal(visible(f.$('[data-local-pulse]')),packet,'a zero factor delivers no filled area');assert(visible(f.$('[data-local-locator]')),'the hollow ring still says where');
    assert.equal(f.$('[data-downstream-value]').textContent,z>0?'1':'0');
    assert.equal(f.$('[data-activation-value]').textContent,`a = ${z>0?z:0}`);
    if(z===0)assert.match(slider(f).getAttribute('aria-valuetext'),/PyTorch’s convention at the kink, not a slope/);
  }
  assert.doesNotMatch(f.$('[data-activation-curve="relu"]').getAttribute('d'),/[QCA]/,'a kink is two straight segments, not a rounded corner');
});

test('Derivative gates: quarter products count activation gates and stay positive without a magnitude floor',t=>{
  const f=fixture(t,NAME);f.load();f.open();const build=f.w.BookDerivativeGates.buildState;
  for(let step=0;step<=160;step++) {
    const time=25+step/10,state=build(time);verifyMath(state);assert(state.bound>0);
  }
  const final=build(40);assert.equal(final.gateCount,10);assert.equal(final.bound,9.5367431640625e-7);
  assert(final.bound<1e-6);assert.equal(build(25).bound,1);assert.equal(build(30).gateCount,0);
  assert.equal(build(30,true).gateCount,5,'the reduced-motion still of the depth beat is its halfway point');
  for(let k=1;k<=10;k++)assert.equal(final.bounds[k].value/final.bounds[k-1].value,0.25);
  // Equal ratios are equal steps on a log ruler: that is the mechanism the ruler draws.
  for(let k=1;k<=10;k++)close(final.bounds[k].exponent-final.bounds[k-1].exponent,Math.log10(0.25),1e-12);
  close(final.rulerExponent,Math.log10(9.5367431640625e-7),1e-9);assert(final.rulerExponent<-6&&final.rulerExponent>-6.1);
});

test('Derivative gates: a near-one sigmoid activation can transmit a tiny local backward sensitivity',t=>{
  const f=fixture(t,NAME);f.load();f.open();const build=f.w.BookDerivativeGates.buildState;
  for(const row of TIMELINE)verifyWitness(build(row.time),row);
  STILLS.forEach((row,index)=>{
    // Reduced motion holds the beat's own still for the whole beat, to its last instant.
    for(const time of [5*index,5*index+2.5,5*index+4.999]){verifyWitness(build(time,true),row);assert.equal(build(time,true).held,REST[index]);}
  });
  const centered=build(10),saturated=build(20),activeRelu=build(28);
  assert.equal(centered.activation,0.5);assert.equal(centered.factor,0.25);
  close(saturated.activation,0.9975273768433653);close(saturated.factor,0.002466509291360048);
  assert(saturated.activation>0.99&&saturated.signalValue<0.003);
  assert(saturated.activation>centered.activation&&saturated.factor<centered.factor);
  assert.equal(activeRelu.kind,'relu');assert.equal(activeRelu.activation,6);assert.equal(activeRelu.factor,1);
  assert.equal(activeRelu.signalValue,1);
  // A probe carries one unit until it meets the multiplier; from there it carries the factor.
  for(const time of [5,7.5,7.999,15,17.5,17.999,25,26.9])assert.equal(build(time).signalValue,1);
  for(const time of [8,10,12,18,20,27,28,29])assert.equal(build(time).signalValue,build(time).factor);
});

test('Derivative gates: bounded alternative fixtures remain correct and inputs are not mutated',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const source of [
    {domain:[-4,8],samples:101,maxGates:6},
    {domain:[-1,2],samples:2,maxGates:2},
    {domain:[-30,30],samples:301,maxGates:100}
  ]) {
    const before=JSON.stringify(source);
    for(const row of TIMELINE)verifyWitness(f.w.BookDerivativeGates.buildState(row.time,false,source),row,source);
    STILLS.forEach((row,index)=>verifyWitness(f.w.BookDerivativeGates.buildState(5*index+3.3,true,source),row,source));
    for(const time of [8.5,13.1,18.4,28.4,32.2])verifyMath(f.w.BookDerivativeGates.buildState(time,false,source),source);
    // A requested z is clamped to the source's own domain.
    for(const[z,expected]of [[source.domain[0]-5,source.domain[0]],[source.domain[1]+5,source.domain[1]],[0.5,0.5]]) {
      const state=f.w.BookDerivativeGates.buildState(16,false,source,z);assert.equal(state.z,expected);assert(state.dragged);verifyMath(state,source);
    }
    assert.equal(JSON.stringify(source),before);
  }
});

test('Derivative gates: invalid domains, sampling and gate counts fail before drawing',t=>{
  const f=fixture(t,NAME);f.load();f.open();const build=f.w.BookDerivativeGates.buildState;
  for(const patch of [{domain:[]},{domain:[-6]},{domain:[0,6]},{domain:[-6,0]},{domain:[2,6]},
    {domain:[6,-6]},{domain:[-31,6]},{domain:[-6,31]},{domain:[-6,Infinity]},{domain:[NaN,6]},
    {samples:1},{samples:2001},{samples:4.5},{samples:NaN},{maxGates:0},{maxGates:1},{maxGates:101},{maxGates:2.5}])
    assert.throws(()=>build(40,false,{...FIXTURE,...patch}),/domain|finite|sample|gate|integer|bound|zero|range/i);
  for(const[time,clock]of [[NaN,0],[Infinity,0],[-Infinity,0],[-10,0],[70,40]]) {
    const state=build(time);assert.equal(state.time,clock);verifyWitness(state,TIMELINE.find(row=>row.time===clock));
  }
  // A request that is not a number is the timeline, not a crash or a NaN picture.
  for(const bad of [null,undefined,NaN,'x',Infinity])assert.equal(build(16,false,FIXTURE,bad===undefined?null:bad).dragged,false);
});

// The component's face, read back from the DOM: the box it lives in, the declared plot
// region, and the map from (z, a) to pixels on the face's own vertical scale.
function faceOf(f) {
  const face=f.$('[data-face]'),box=f.$('[data-activation-node]'),n=key=>Number(face.dataset[key]);
  const left=n('left'),top=n('top'),width=n('width'),height=n('height'),ymax=n('yMax');
  return{face,left,top,width,height,ymax,needle:n('needle'),kind:face.dataset.kind,
    box:{x0:attr(box,'x'),y0:attr(box,'y'),x1:attr(box,'x')+attr(box,'width'),y1:attr(box,'y')+attr(box,'height')},
    px:z=>left+(z+6)/12*width,py:value=>top+height*(1-value/ymax),zAt:x=>-6+(x-left)/width*12};
}

test('Derivative gates: the component’s face is its activation curve, and the tangent there is the multiplier’s cause',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const width of widths) {
    f.resize(width);
    const check=label=>{
      const state=published(f),g=faceOf(f),relu=state.kind==='relu';
      assert.equal(g.face.dataset.quantity,'activation-function');assert.equal(g.kind,state.kind);assert.equal(g.ymax,relu?6:1,'each face states its own vertical scale');
      // A component with a face, not a plot: the face sits inside the box, with no grid, axis or tick labels beyond its two rails.
      assert(g.left-g.needle>=g.box.x0+4&&g.left+g.width+g.needle<=g.box.x1-4&&g.top>g.box.y0&&g.top+g.height<g.box.y1,`face inside the component at ${width}px`);
      const stageArea=width*numbers(picture(f).getAttribute('viewBox'))[3],boxArea=(g.box.x1-g.box.x0)*(g.box.y1-g.box.y0);
      assert(g.box.x1-g.box.x0<=260&&g.box.y1-g.box.y0<=200&&boxArea<=0.25*stageArea,`the component stays a component, not a large curve plot (${width}px)`);
      assert.equal(g.face.querySelectorAll('.dg-rail').length,2);assert.equal(g.face.querySelectorAll('[class*="grid"], [class*="axis"]').length,0);
      assert.equal(f.$('[data-rail-label="top"]').textContent,relu?'6':'1');assert.equal(f.$('[data-rail-label="floor"]').textContent,'0');
      assert.equal(f.$('[data-activation-name]').textContent,relu?'ReLU':'sigmoid');
      // Exactly one curve is the face, by substitution and never by fading.
      for(const kind of ['sigmoid','relu'])assert.equal(visible(f.$(`[data-activation-curve="${kind}"]`)),kind===state.kind,label);
      const curve=numericTokens(f.$(`[data-activation-curve="${state.kind}"]`).getAttribute('d'));
      if(!relu) {
        assert.equal(curve.length,600);
        for(let index=0;index<300;index++){const z=-6+12*index/299;closeTree(curve.slice(2*index,2*index+2),[g.px(z),g.py(sigmoid(z))],FACE_EPSILON);}
      } else closeTree(curve,[g.px(-6),g.py(0),g.px(0),g.py(0),g.px(6),g.py(6)],FACE_EPSILON);
      // The operating point rides the curve.
      const output=relu?Math.max(0,state.z):sigmoid(state.z),slope=relu?reluDerivative(state.z):sigmoidDerivative(state.z);
      const marker=f.$('[data-activation-marker]'),tangent=f.$('[data-tangent]'),link=f.$('[data-slope-link]'),multiplier=f.$('[data-local-multiplier]');
      closeTree([attr(marker,'cx'),attr(marker,'cy')],[g.px(state.z),g.py(output)],FACE_EPSILON);
      // The tangent is the slope at that point, drawn as a needle of one length: only its tilt changes.
      assert.equal(visible(tangent),state.backwardVisible&&!state.kink,`tangent ${label}`);
      if(visible(tangent)) {
        const[x1,y1,x2,y2]=['x1','y1','x2','y2'].map(key=>attr(tangent,key));
        assert(x2>x1);close(Math.hypot(x2-x1,y2-y1),2*g.needle,1e-3);
        closeTree([(x1+x2)/2,(y1+y2)/2],[g.px(state.z),g.py(output)],FACE_EPSILON);
        closeTree([y1,y2],[g.py(output+slope*(g.zAt(x1)-state.z)),g.py(output+slope*(g.zAt(x2)-state.z))],3*FACE_EPSILON);
        for(const[x,y]of [[x1,y1],[x2,y2]])assert(x>=g.box.x0+3&&x<=g.box.x1-3&&y>=g.box.y0+3&&y<=g.box.y1-3,`tangent leaves the component at z=${state.z}, ${width}px`);
      }
      // The slope link ties that point to the multiplier it feeds: one vertical drop onto the box's top edge.
      assert.equal(visible(link),state.backwardVisible,label);
      closeTree([attr(link,'x1'),attr(link,'y1'),attr(link,'x2'),attr(link,'y2')],[g.px(state.z),g.py(output),g.px(state.z),attr(multiplier,'y')],FACE_EPSILON);
      assert(attr(link,'x2')>=attr(multiplier,'x')&&attr(link,'x2')<=attr(multiplier,'x')+attr(multiplier,'width'),'the link lands on the multiplier');
      if(state.backwardVisible)assert.match(f.$('[data-factor-value]').textContent,state.kink?/^× 0 \(kink rule\)$/:/^× slope = (?:\?|[\d.]+)$/);
    };
    for(const time of [0,5,8.5,10,12.1234567,13.5,14.9,15,20,25,27.5,28.9,29.6,30,40]){f.seek(time);verifyMath(f.w.BookDerivativeGates.buildState(time));check(`at ${time}s`);}
    // Both faces in act 1, the ReLU face through the compression, the sigmoid face in the strip.
    for(const time of [2,16,27.5,28.9,29.5,29.95,38])for(const z of [-6,-3.3,-0.1,0,0.1,1,2.5,6]){f.seek(time);drag(f,z);check(`dragged to ${z} at ${time}s`);}
  }
  const css=read('derivative-gates/player.css');assert.doesNotMatch(css,/\[data-face\][^{]*\{[^}]*opacity/);
});

test('Derivative gates: the tangent’s tilt is a strictly decreasing function of |z|, flat at both ends',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const width of [713,296]) {
    f.resize(width);f.seek(16);
    const tilt=z=>{drag(f,z);const line=f.$('[data-tangent]');return Math.atan2(attr(line,'y1')-attr(line,'y2'),attr(line,'x2')-attr(line,'x1'))*180/Math.PI;};
    let previous=Infinity;
    for(let z=0;z<=6+1e-9;z+=0.5){const angle=tilt(z);assert(angle<previous&&angle>0,`tilt at z=${z}`);close(tilt(-z),angle,1e-3);previous=angle;}
    assert(tilt(0)>45,'steepest at zero');assert(tilt(6)<3&&tilt(-6)<3,'flat in both tails: the eye can see the factor die');
  }
});

test('Derivative gates: the same component carries forward values and a reverse local probe',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const width of widths) {
    f.resize(width);
    for(const time of [0,5,7.1234567,8,8.5,10,12.3,13.5,14.7,15,17.5,18,18.5,20,25,27.5,28.5,29,30,40]) {
      f.seek(time);const expected=published(f),input=f.$('[data-input-node]'),output=f.$('[data-output-node]'),component=f.$('[data-activation-node]');
      const lx=attr(input,'cx'),rx=attr(output,'cx'),fy=attr(input,'cy'),cx=attr(component,'x')+attr(component,'width')/2;
      assert(lx<cx&&cx<rx);assert.equal(attr(output,'cy'),fy);close(cx,width/2,PIXEL_EPSILON);
      closeTree(numericTokens(f.$('[data-forward-left]').getAttribute('d')),[lx+attr(input,'r'),fy,attr(component,'x'),fy],PIXEL_EPSILON);
      closeTree(numericTokens(f.$('[data-forward-right]').getAttribute('d')),[attr(component,'x')+attr(component,'width'),fy,rx-attr(output,'r'),fy],PIXEL_EPSILON);
      assert(attr(component,'x')-(lx+attr(input,'r'))>=6,'a wire is visible between the input and the component');
      const multiplier=f.$('[data-local-multiplier]'),by=attr(multiplier,'y')+attr(multiplier,'height')/2;
      close(attr(multiplier,'x')+attr(multiplier,'width')/2,cx);assert(by>attr(component,'y')+attr(component,'height'));
      closeTree(numericTokens(f.$('[data-reverse-wire]').getAttribute('d')),[rx,by,lx,by],PIXEL_EPSILON);
      for(const node of f.root.querySelectorAll('[data-forward-arrow]')) {
        const p=numericTokens(node.getAttribute('d'));assert(p[2]>p[0]&&p[2]>p[4],'forward arrow must point right');
      }
      for(const node of f.root.querySelectorAll('[data-reverse-arrow]')) {
        const p=numericTokens(node.getAttribute('d'));assert(p[2]<p[0]&&p[2]<p[4],'backward arrow must point left');
      }
      const pulse=f.$('[data-local-pulse]'),ring=f.$('[data-local-locator]'),probe=f.$('[data-local-probe]');
      // At either resting place the ring stands clear of the multiplier: a packet goes in on one side and comes out on the other.
      assert(lx+attr(ring,'r')<=attr(multiplier,'x')-2&&rx-attr(ring,'r')>=attr(multiplier,'x')+attr(multiplier,'width')+2,`ring clear of the multiplier at ${width}px`);
      const center=[rx+(lx-rx)*expected.localProgress,by];
      closeTree([attr(pulse,'cx'),attr(pulse,'cy')],center,PIXEL_EPSILON);closeTree([attr(ring,'cx'),attr(ring,'cy')],center,PIXEL_EPSILON);
      close(attr(pulse,'r'),14*Math.sqrt(expected.signalValue),PIXEL_EPSILON);
      close((attr(pulse,'r')/14)**2,expected.signalValue,1e-5);
      assert.equal(attr(ring,'r'),16,'the hollow locator must not encode a changing sensitivity');
      assert.equal(Number(f.root.dataset.signalValue),f.w.BookDerivativeGates.buildState(time).signalValue);
      close(attr(probe,'opacity'),expected.probeOpacity,PIXEL_EPSILON);
      assert.equal(visible(pulse),expected.backwardVisible&&attr(probe,'opacity')>0&&expected.signalValue>0,'an invisible probe is removed, not left transparent');
      assert(probe.compareDocumentPosition(multiplier)&f.w.Node.DOCUMENT_POSITION_FOLLOWING,'the probe passes under the multiplier, so its ring never crosses the printed factor');
      // The factor is printed, on the multiplier and at the input side, only once a probe has crossed.
      const printed=f.$('[data-factor-value]').textContent,delivered=f.$('[data-downstream-value]').textContent;
      if(expected.revealed){assert.match(printed,/^× slope = \d/);if(expected.kind==='sigmoid')assert(attr(pulse,'cx')<=cx+PIXEL_EPSILON);}
      else{assert.equal(printed,'× slope = ?');assert.equal(delivered,'?');}
      // A number sits beside the mark it measures: the delivered value waits for the packet to arrive.
      if(expected.delivered){assert.equal(delivered,printed.replace('× slope = ',''));close(attr(pulse,'cx'),lx,PIXEL_EPSILON);}
      else assert.equal(delivered,'?');
      assert.match(f.$('[data-upstream-value]').textContent,/^unit(?: probe)?: 1$/);
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
    // Ten gates in 4.5 s from 30.5 s: gate k is met at 30.275 + 0.45 k s. Literal counts, not a copied formula.
    for(const[time,count]of [[30,0],[30.5,0],[30.72,0],[30.73,1],[31.17,1],[31.18,2],[32.52,4],[32.53,5],[32.75,5],[34.32,8],[34.33,9],[34.77,9],[34.78,10],[35,10],[40,10]]) {
      f.seek(time);const expected=published(f),curve=numericTokens(f.$('[data-chain-wire]').getAttribute('d'));
      assert.equal(expected.gateCount,count,`gates crossed at ${time}s`);assert.equal(expected.bound,factorProduct(count));
      const points=Array.from({length:curve.length/2},(_,i)=>curve.slice(2*i,2*i+2));
      assert.equal(points.length,12);if(!fixed)fixed=points;closeTree(points,fixed,0);
      closeTree(data(f,'chainPoints'),points,PIXEL_EPSILON);
      const gates=[...drawing(f).querySelectorAll('[data-gate]')];assert.equal(gates.length,10);
      gates.forEach((gate,i)=>{
        closeTree([attr(gate,'cx'),attr(gate,'cy')],points[i+1],PIXEL_EPSILON);
        assert.equal(gate.dataset.passed,String(i<expected.gateCount));
        const index=f.$(`[data-gate-index="${i+1}"]`);assert.equal(index.textContent,String(i+1));
        // Where the path drops to the next row, the wire runs straight down from the gate: its number sits beside it.
        if(points[i+2][0]===points[i+1][0])assert(Math.abs(attr(index,'x')-points[i+1][0])>=attr(gate,'r')+6,`gate ${i+1}'s number lies under the wire at ${width}px`);
        else close(attr(index,'x'),points[i+1][0],PIXEL_EPSILON);
        assert.match(f.$(`[data-gate-label="${i+1}"]`).textContent,/¼|1\/4/);
        const arrow=numericTokens(f.$(`[data-chain-arrow="${i+1}"]`).getAttribute('d'));
        const dx=points[i+2][0]-points[i+1][0],dy=points[i+2][1]-points[i+1][1];
        const tail=[(arrow[0]+arrow[4])/2,(arrow[1]+arrow[5])/2];
        assert((arrow[2]-tail[0])*dx+(arrow[3]-tail[1])*dy>0,'chain arrow follows the next component');
        if(i)assert(Math.hypot(attr(gate,'cx')-attr(gates[i-1],'cx'),attr(gate,'cy')-attr(gates[i-1],'cy'))>=2*attr(gate,'r')+8,'gates do not touch');
      });
      assert.equal(new Set(gates.map(g=>attr(g,'cy'))).size,width<280?3:width<560?2:1,'phone chain reflows, without shrinking its components');
      const travel=expected.travel,segment=Math.min(10,Math.floor(travel)),fraction=travel-segment;
      assert.equal(Math.min(10,Math.floor(travel)),count);if(time<=30.5)assert.equal(travel,0);if(time>=35)assert.equal(travel,11);
      const center=points[segment].map((value,axis)=>value+(points[segment+1][axis]-value)*fraction);
      const pulse=f.$('[data-chain-pulse]'),ring=f.$('[data-chain-locator]');
      closeTree([attr(pulse,'cx'),attr(pulse,'cy')],center,2*PIXEL_EPSILON);closeTree([attr(ring,'cx'),attr(ring,'cy')],center,2*PIXEL_EPSILON);
      assert.equal(attr(ring,'r'),16);close(attr(pulse,'r'),14*2**(-count),PIXEL_EPSILON);
      assert(attr(pulse,'r')>0,'the drawn packet has no lower floor and never reaches zero');
      assert.equal(Number(f.root.dataset.bound),factorProduct(count),'the published area is the exact binary quarter power');
      assert(ring.compareDocumentPosition(gates[0])&f.w.Node.DOCUMENT_POSITION_FOLLOWING,'the chain probe passes under each gate');
      assert.equal(f.$('[data-factor-chain]').dataset.quantity,'sigmoid-activation-factor-ceiling');
      assert.match(f.$('[data-chain-note]').textContent,/best case.*weights omitted/i);
      assert.match(f.$('[data-bound-value]').textContent,new RegExp(`^${expected.gateCount} factor${expected.gateCount===1?'':'s'}: at most `));
      if(time>=35) {
        assert.equal(f.$('[data-bound-value]').textContent,'10 factors: at most 9.54 × 10⁻⁷');
        assert(expected.bound>sigmoidDerivative(6)**10,'the chain is a ceiling, not ten copies of the saturated witness');
        // At rest the locator stands clear of the last gate instead of overlapping it.
        assert(Math.hypot(attr(ring,'cx')-attr(gates[9],'cx'),attr(ring,'cy')-attr(gates[9],'cy'))>=attr(ring,'r')+attr(gates[9],'r'));
      }
    }
  }
});

// The ruler as the DOM draws it. Its scale is read from its own ticks, not from the player:
// the ticks at 1 and 10⁻² define exponent(x), and everything else is checked against that.
function rulerOf(f) {
  const ruler=f.$('[data-log-ruler]'),tickX=e=>numericTokens(f.$(`[data-ruler-tick="${e}"]`).getAttribute('d'))[0];
  const x0=tickX(0),x2=tickX(-2),y=numericTokens(f.$('[data-ruler-line]').getAttribute('d'))[1];
  return{ruler,x0,y,exponentAt:x=>-2*(x0-x)/(x0-x2),xAt:exponent=>x0-(x0-x2)*exponent/-2,tickX};
}

test('Derivative gates: depth is ten EQUAL steps on a stated log ruler, ending at 9.54 × 10⁻⁷, while active ReLU stays at 1',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const width of widths) {
    f.resize(width);f.seek(30);const g=rulerOf(f),marker=f.$('[data-ruler-marker]');
    // A log scale, stated: whole powers of ten at equal spacing, labelled in typeset powers, 1 on the right.
    assert.equal(g.ruler.dataset.scale,'log10');assert.match(f.$('[data-ruler-title]').textContent,/log scale/);
    assert.deepEqual([...g.ruler.querySelectorAll('[data-ruler-label]')].map(node=>node.textContent),['1','10⁻²','10⁻⁴','10⁻⁶']);
    for(const e of [0,-2,-4,-6]){close(g.exponentAt(g.tickX(e)),e,1e-3);close(attr(f.$(`[data-ruler-label="${e}"]`),'x'),g.tickX(e),PIXEL_EPSILON);}
    assert(g.tickX(-6)<g.tickX(-4)&&g.tickX(-4)<g.tickX(-2)&&g.tickX(-2)<g.x0,'smaller is further left, the way the backward signal travels');
    const line=numericTokens(f.$('[data-ruler-line]').getAttribute('d'));assert(line[0]>=0&&line[0]<g.xAt(Math.log10(0.25**10))&&line[2]>g.x0&&line[2]<=width);
    // The marker rests after k gates exactly where log10(.25^k) is on that ruler: 30.5 + 0.45 k s, literal times.
    const rests=[];
    for(let k=0;k<=10;k++) {
      f.seek(k===10?35:Number((30.5+0.45*k).toFixed(2)));const x=attr(marker,'cx');rests.push(x);
      close(g.exponentAt(x),Math.log10(0.25**k),2e-3);close(attr(marker,'cy'),g.y,1e-3);
      const hops=[...g.ruler.querySelectorAll('[data-hop]')].filter(visible);assert.equal(hops.length,k,`${k} finished hops stay drawn`);
      hops.forEach((hop,i)=>{
        const d=numericTokens(hop.getAttribute('d'));closeTree([d[0],d[1],d[4],d[5]],[rests[i],g.y,rests[i+1],g.y],2e-3);
        assert(d[3]<g.y-4,'a hop is an arc above the ruler');close(d[2],(d[0]+d[4])/2,PIXEL_EPSILON);
        close(attr(hop,'stroke-dashoffset'),0,1e-9);
      });
    }
    // Equal steps, to the pixel: multiplying by a constant is a constant move on a log ruler.
    for(let k=1;k<=10;k++)close(rests[k-1]-rests[k],(rests[0]-rests[10])/10,1e-3);
    assert(rests[10]<g.tickX(-6)&&g.tickX(-6)-rests[10]<(rests[0]-rests[1])/10,'ten gates land just past one in a million');
    assert(rests[10]>=6&&rests[0]<=width-6);
    // Mid-hop the marker is on its arc, and the arc is drawn as far as the marker has come.
    for(const[time,k]of [[30.6,1],[31.1,2],[32.62,5],[34.9,10]]) {
      f.seek(time);const hop=f.$(`[data-hop="${k}"]`),d=numericTokens(hop.getAttribute('d')),x=attr(marker,'cx'),s=(d[0]-x)/(d[0]-d[4]);
      assert(s>0&&s<1&&visible(hop));close(attr(marker,'cy'),d[1]-2*(d[1]-d[3])*s*(1-s),1e-3);
      close(attr(hop,'stroke-dashoffset'),attr(hop,'stroke-dasharray')*(1-s),2e-3);
      assert.equal([...g.ruler.querySelectorAll('[data-hop]')].filter(visible).length,k);
      assert(attr(hop,'stroke-dasharray')>=d[0]-d[4],'an arc is at least as long as its chord');
    }
    // The active-ReLU path: one mark at 1 that never moves, named as active, beside the moving sigmoid marker.
    const relu=f.$('[data-relu-marker]'),fixedPath=relu.getAttribute('d');
    for(const time of [30,32.75,35,40]) {
      f.seek(time);assert.equal(relu.getAttribute('d'),fixedPath);assert(visible(relu));
      const p=numericTokens(relu.getAttribute('d'));close((p[2]+p[6])/2,g.x0,PIXEL_EPSILON);close((p[1]+p[5])/2,g.y,PIXEL_EPSILON);
      assert.match(f.$('[data-relu-label]').textContent,/active ReLU.*stays at 1/);
    }
    assert(relu.compareDocumentPosition(marker)&f.w.Node.DOCUMENT_POSITION_FOLLOWING,'the moving marker is drawn over the fixed one it starts on');
    f.seek(40);assert.equal(f.$('[data-bound-value]').textContent,'10 factors: at most 9.54 × 10⁻⁷');
    assert.match(f.$('[data-chain-scope]').textContent,/Tiny is not zero.*not the full gradient/);assert(visible(f.$('[data-chain-scope]')));
    f.seek(32);assert(!visible(f.$('[data-chain-scope]')));
  }
  // The ruler does not depend on z: the reader's z moves the component, not the best-case chain.
  f.resize(713);f.seek(33);const before=canonicalMarkup(f.$('[data-factor-chain]').outerHTML);drag(f,-4);
  assert.equal(canonicalMarkup(f.$('[data-factor-chain]').outerHTML),before);
});

test('Derivative gates: forward witnesses precede backward transmission and the activation-only chain',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const time of [0,4.99,5,7.99,8,9.99,10,15,19.99,20,24.99,25,29.99,30,34.99,35,40]) {
    // The backward lane appears at 5 s, ReLU stands in from 25 s to 30 s, the chain appears at 30 s.
    f.seek(time);const expected={backwardVisible:time>=5,ceilingVisible:time>=8,chainVisible:time>=30,kind:time>=25&&time<30?'relu':'sigmoid'};
    for(const selector of ['[data-forward-network]','[data-activation-value]','[data-z-value]','[data-face]','[data-activation-marker]'])assert(visible(f.$(selector)));
    for(const selector of ['[data-backward-network]','[data-slope-link]','[data-tangent]','[data-local-locator]','[data-signal-legend]'])
      assert.equal(visible(f.$(selector)),expected.backwardVisible,`${selector} at ${time}s`);
    for(const selector of ['[data-factor-chain]','[data-chain-pulse]','[data-bound-value]','[data-log-ruler]','[data-ruler-marker]','[data-relu-marker]'])
      assert.equal(visible(f.$(selector)),expected.chainVisible);
    const formula=f.$('[data-formula]');
    assert.equal(formula.classList.contains('dg-local-shown'),expected.backwardVisible);
    assert.equal(formula.classList.contains('dg-ceiling-shown'),expected.ceilingVisible,'the quarter ceiling is the first answer: its formula waits for the reveal');
    assert.equal(formula.classList.contains('dg-bound-shown'),expected.chainVisible);
    assert.equal(formula.classList.contains('dg-highlight-relu'),expected.kind==='relu');
    if(time<5)assert.doesNotMatch(picture(f).getAttribute('aria-label'),/multiplied|derivative|0\.25/);
    if(time<30)assert.doesNotMatch(picture(f).getAttribute('aria-label'),/\d+ gates|ceiling|ruler/);
  }
  const css=read('derivative-gates/player.css');
  assert.match(css,/\.dg-formula:not\(\.dg-ceiling-shown\) #eq-derivative-gates-2/);
});

// Everything a reader or a screen reader can meet at this instant, with the input's own
// label and clause removed: z is the forward story and passes through small values as it
// leaves zero, so it is not a leaked factor. What remains must not name a factor.
function readerFacing(f) {
  assert.match(f.$('[data-z-readout]').textContent,/^z = [\d.]+$/,'the control’s readout is z and nothing else');
  return[...shownText(f).filter(node=>!node.hasAttribute('data-z-value')).map(node=>node.textContent),
    picture(f).getAttribute('aria-label').replace(/At z [^,]*,/,''),scrubber(f).getAttribute('aria-valuetext'),
    slider(f).getAttribute('aria-valuetext').replace(/^z = [^ ]*\. /,''),f.$('[data-caption]').textContent];
}
const leaks=text=>numericTokens(text).some(value=>value>0&&value<0.25)||/0\.00\d|⁻|multiplied by/.test(text);

test('Derivative gates: the first factor, one quarter, is withheld everywhere until the probe crosses',t=>{
  for(const width of [713,296]) {
    const f=fixture(t,NAME,{width});f.load();f.open();let reveal=null;
    for(let step=0;reveal===null;step++) {
      const time=Number((5+step*0.05).toFixed(2));assert(time<10,'the first probe never reveals its factor');f.seek(time);
      if(f.$('[data-factor-value]').textContent!=='× slope = ?'){reveal=time;break;}
      assert.match(f.$('[data-caption]').textContent,/Predict/);assert.equal(f.$('[data-downstream-value]').textContent,'?');
      for(const text of readerFacing(f))assert(!/0\.25|quarter|¼|1\/4/.test(text),`the first answer leaks at ${time}s (${width}px): "${text}"`);
      assert(!f.$('[data-formula]').classList.contains('dg-ceiling-shown'),`the ceiling formula answers the question at ${time}s`);
      assert.equal(attr(f.$('[data-local-pulse]'),'r'),14,'only a whole unit probe is on the lane');
      // The cause is on the picture from the start of the question: the tangent and its link to the multiplier.
      assert(visible(f.$('[data-tangent]'))&&visible(f.$('[data-slope-link]')));
    }
    assert(reveal>=7.9&&reveal<=8.05,`first reveal at ${reveal}s`);assert.equal(f.$('[data-factor-value]').textContent,'× slope = 0.25');
    assert(f.$('[data-formula]').classList.contains('dg-ceiling-shown'));
    const still=()=>canonicalMarkup(f.$('[data-figure]').innerHTML);
    f.seek(5);const predicting=still();for(const time of [5.5,6,6.5,7]){f.seek(time);assert.equal(still(),predicting,`the picture moves at ${time}s while the reader is predicting`);}
  }
});

test('Derivative gates: the saturated factor is withheld from the picture, the label, the scrubber and the z control until the probe crosses',t=>{
  for(const width of [713,296]) {
    const f=fixture(t,NAME,{width});f.load();f.open();
    const multiplier=f.$('[data-local-multiplier]'),center=attr(multiplier,'x')+attr(multiplier,'width')/2;
    const printed=()=>f.$('[data-factor-value]').textContent,delivered=()=>f.$('[data-downstream-value]').textContent;
    const pulse=f.$('[data-local-pulse]'),probe=f.$('[data-local-probe]'),output=attr(f.$('[data-output-node]'),'cx'),input=attr(f.$('[data-input-node]'),'cx');
    // The measurement at zero stands, in full, until the input starts to move.
    f.seek(12);assert.equal(printed(),'× slope = 0.25');assert.equal(delivered(),'0.25');assert.equal(attr(pulse,'cx'),input);assert.equal(attr(pulse,'r'),7);
    let reveal=null,faded=null,ready=null;
    for(let step=0;reveal===null;step++) {
      const time=Number((12.05+step*0.05).toFixed(2));assert(time<20,'the probe never reveals the factor');
      f.seek(time);
      if(printed()!=='× slope = ?'){reveal=time;break;}
      assert.equal(delivered(),'?',`delivered value shown at ${time}s`);
      for(const text of readerFacing(f))assert(!leaks(text),`the answer leaks at ${time}s (${width}px): "${text}"`);
      assert.doesNotMatch(slider(f).getAttribute('aria-valuetext'),/dies|largest/,'the control does not describe the answer either');
      assert.match(slider(f).getAttribute('aria-valuetext'),/withheld until the probe crosses/);
      // The stale packet is never redrawn smaller: it fades at its measured size where it lay,
      // and the only other packet on the lane is a whole unit probe on the output side.
      if(visible(pulse)) {
        if(attr(pulse,'cx')===input){assert.equal(attr(pulse,'r'),7,`stale packet resized at ${time}s`);assert(time<13&&faded===null);}
        else{assert.equal(attr(pulse,'r'),14,`a shrunken probe is visible at ${time}s`);assert(attr(pulse,'cx')>center);if(faded===null)faded=time;
          if(attr(pulse,'cx')===output&&attr(probe,'opacity')===1&&ready===null)ready=time;}
      } else if(faded===null)faded=time;
    }
    assert(faded<=12.65,`the stale packet is still drawn at ${faded}s`);
    assert(ready!==null&&ready<=15,'a whole unit probe waits on the output side by the beat');
    // Two still seconds to predict, then the crossing; the revealed factor then holds two seconds before the next caption.
    assert(reveal>=17&&reveal<=18,`reveal at ${reveal}s`);
    assert(attr(pulse,'cx')<=center+PIXEL_EPSILON,'the factor is printed only once the probe has reached the multiplier');
    assert.equal(printed(),'× slope = 0.002467');close(attr(pulse,'r'),14*Math.sqrt(sigmoidDerivative(6)),PIXEL_EPSILON);
    const still=()=>canonicalMarkup(f.$('[data-figure]').innerHTML);
    f.seek(15);const predicting=still();for(const time of [15.5,16,16.5,17]){f.seek(time);assert.equal(still(),predicting,`the picture moves at ${time}s while the reader is predicting`);}
    for(const time of [reveal,19,20,22.5,24.99]){f.seek(time);assert.equal(printed(),'× slope = 0.002467');assert.equal(delivered(),time<19?'?':'0.002467');}
    // No flash across the hand-over: either side of 12 s and of the beat at 15 s the probe is the same mark.
    const mark=()=>[attr(pulse,'cx'),attr(pulse,'cy'),attr(pulse,'r'),attr(probe,'opacity')];
    for(const[before,after]of [[12,12.001],[14.999,15]]){f.seek(before);const a=mark();f.seek(after);closeTree(mark(),a,0.01);}
    f.seek(13.5);assert(!visible(pulse),'no packet is on the lane while nothing is being measured');
    // The forward story stays in full view through the glide, and the cause moves with it: the point
    // rides up the S, the link follows it, and the tangent tilts flat. That motion is the honest hint.
    let z=-1,slope=Infinity,x=-1,y=Infinity;
    for(const time of [12.3,13,13.5,14,14.9,15]) {
      f.seek(time);const state=published(f),tangent=f.$('[data-tangent]'),dot=f.$('[data-activation-marker]'),link=f.$('[data-slope-link]');assert(state.z>z);z=state.z;
      assert.match(f.$('[data-z-value]').textContent,/^z = \d/);assert.match(f.$('[data-activation-value]').textContent,/^a = 0\.\d/);
      const rise=(attr(tangent,'y1')-attr(tangent,'y2'))/(attr(tangent,'x2')-attr(tangent,'x1'));assert(visible(tangent)&&rise<slope&&rise>0);slope=rise;
      assert(attr(dot,'cx')>x&&attr(dot,'cy')<y);x=attr(dot,'cx');y=attr(dot,'cy');assert.equal(attr(link,'x1'),x);assert.equal(attr(link,'x2'),x);
      close(Number(slider(f).value),state.z,1e-9);
    }
    assert(slope<0.05,'by the beat the needle is visibly flat');
  }
});

test('Derivative gates: reduced-motion stills never pair the prediction with its answer, and each shows what its caption says',t=>{
  const f=fixture(t,NAME,{reduced:true});f.load();f.open();
  const printed=()=>f.$('[data-factor-value]').textContent,delivered=()=>f.$('[data-downstream-value]').textContent;
  const pulse=f.$('[data-local-pulse]'),output=attr(f.$('[data-output-node]'),'cx'),input=attr(f.$('[data-input-node]'),'cx');
  for(const time of [5,7.5,9.99]) { // beat 1: the first question, a whole probe waiting
    f.seek(time);assert.equal(printed(),'× slope = ?');assert.equal(delivered(),'?');assert.equal(attr(pulse,'cx'),output);assert.equal(attr(pulse,'r'),14);
    assert.match(f.$('[data-caption]').textContent,/Predict/);assert(!f.$('[data-formula]').classList.contains('dg-ceiling-shown'));
    for(const text of readerFacing(f))assert(!/0\.25|quarter|¼/.test(text),`the still at ${time}s answers its own question: "${text}"`);
  }
  for(const time of [10,12.5,14.99]) { // beat 2: the measurement at zero, delivered
    f.seek(time);assert.equal(printed(),'× slope = 0.25');assert.equal(delivered(),'0.25');assert.equal(f.$('[data-z-value]').textContent,'z = 0');
    assert.equal(attr(pulse,'cx'),input);assert.equal(attr(pulse,'r'),7);assert.match(f.$('[data-caption]').textContent,/one quarter/);
  }
  for(const time of [15,17.5,18.5,19.99]) { // beat 3: saturated, a whole probe waiting, nothing revealed
    f.seek(time);assert.equal(printed(),'× slope = ?');assert.equal(delivered(),'?');assert.equal(f.$('[data-z-value]').textContent,'z = 6');
    assert.equal(attr(pulse,'cx'),output);assert.equal(attr(pulse,'r'),14);assert(visible(pulse));
    assert.match(f.$('[data-caption]').textContent,/Predict/);
    for(const text of readerFacing(f))assert(!leaks(text),`the still at ${time}s answers its own question: "${text}"`);
  }
  for(const time of [20,24.99]) { // beat 4: the result
    f.seek(time);assert.equal(printed(),'× slope = 0.002467');assert.equal(delivered(),'0.002467');assert.equal(attr(pulse,'cx'),input);
    assert.doesNotMatch(f.$('[data-caption]').textContent,/Predict/);
  }
  for(const time of [25,27.5,29.99]) { // beat 5: ReLU, its probe delivered whole, as the caption says, still on the act-1 stage
    f.seek(time);assert.equal(printed(),'× slope = 1');assert.equal(delivered(),'1');assert.equal(attr(pulse,'cx'),input);assert.equal(attr(pulse,'r'),14);
    assert.match(f.$('[data-caption]').textContent,/passes whole/);assert.equal(f.$('[data-activation-value]').textContent,'a = 6');
  }
  for(const time of [30,32.5,34.99]) { // beat 6: the depth beat at its halfway point: five equal hops
    f.seek(time);assert.equal(f.$('[data-bound-value]').textContent,'5 factors: at most 0.0009766');
    assert.equal([...f.root.querySelectorAll('[data-hop]')].filter(visible).length,5);assert.match(f.$('[data-caption]').textContent,/equal steps/);
  }
  for(const time of [35,40]){f.seek(time);assert.equal(f.$('[data-bound-value]').textContent,'10 factors: at most 9.54 × 10⁻⁷');assert.equal([...f.root.querySelectorAll('[data-hop]')].filter(visible).length,10);}
  // A dragged z under reduced motion is still the reader's live experiment.
  f.seek(16);drag(f,-6);assert.equal(printed(),'× slope = 0.002467');assert.equal(f.$('[data-activation-value]').textContent,'a = 0.0025');
});

test('Derivative gates: z is the one parameter control, a real range outside the transport, inert until mount',t=>{
  const bare=fixture(t,NAME),control=slider(bare),css=read('derivative-gates/player.css');
  assert.equal(control.type,'range');assert(!control.closest('[data-controls]'),'a second range must never become the clock');
  assert(control.closest('[data-pane]')&&control.closest('[data-figure]'),'the control sits with the lane it drives');
  assert.equal(bare.root.querySelectorAll('input[type="range"]').length,2,'the scrubber and z: a second knob would be a second scene');
  assert.equal(bare.root.querySelectorAll('[data-controls] input[type="range"]').length,1);
  assert(control.disabled,'inert until the player mounts');
  assert.match(css,/#derivative-gates-excerpt:not\(\[data-ready\]\) \.dg-slider\s*\{[^}]*visibility:\s*hidden/,'and hidden until then');
  assert.match(css,/\.dg-slider\s*\{[^}]*position:\s*absolute/,'out of flow: the script-free panel reserves no room for it');
  // The declared domain of the chapter's own plot, in both directions, with its ticks.
  assert.deepEqual([control.min,control.max,control.step],['-6','6','0.1']);assert.deepEqual([Number(control.min),Number(control.max)],FIXTURE.domain);
  assert.deepEqual([...bare.root.querySelectorAll(`#${control.getAttribute('list')} option`)].map(option=>Number(option.value)),[-6,-3,0,3,6]);
  assert.deepEqual([...bare.root.querySelectorAll('.dg-slider-ticks span')].map(node=>node.textContent),['−6','−3','0','3','6']);
  assert(control.getAttribute('aria-label'));assert.equal(bare.$(`label[for="${control.id}"]`).textContent,'z');
  assert.equal(bare.$('[data-z-readout]').getAttribute('for'),control.id);assert.equal(bare.$('[data-z-display]').getAttribute('aria-hidden'),null);
  const f=fixture(t,NAME);f.load();f.open();
  assert(!slider(f).disabled);assert.equal(f.root.querySelectorAll('input[type="range"]').length,2,'the scrubber and z: a second knob would be a second scene');
  assert.equal(f.$('[data-z-display]').getAttribute('aria-hidden'),'true','while the player runs the control itself speaks z');
  // The static attribute is the final frame's own sentence, so the two cannot drift.
  f.seek(40);assert.equal(slider(f).getAttribute('aria-valuetext'),control.getAttribute('aria-valuetext'));
  assert.equal(f.$('[data-z-readout]').textContent,bare.$('[data-z-readout]').textContent);assert.equal(Number(slider(f).value),Number(control.getAttribute('value')));
  // The timeline drives it for the passive viewer: 0, then the glide, then the domain's edge.
  for(const[time,z]of [[0,0],[11.9,0],[13.5,3],[15,6],[27,6],[40,6]]){f.seek(time);close(Number(slider(f).value),z,1e-9);assert.equal(f.$('[data-z-readout]').textContent,`z = ${z}`);assert.equal(f.root.dataset.override,'');}
  // The picture keeps a band clear for it, right under the lane, at every width.
  for(const width of widths) {
    f.resize(width);
    for(const time of [0,20,27.5,29,29.7,30,40])for(const z of [null,-6,0]) {
      f.seek(time);if(z!==null)drag(f,z);
      // In both acts, and all the way through the compression, the band follows the lane it serves.
      const[top,bottom]=f.root.dataset.sliderBand.split(' ').map(Number);close(parseFloat(f.$('[data-z-control]').style.top),top,1e-3);close(bottom-top,50);
      const lane=attr(f.$('[data-local-multiplier]'),'y')+attr(f.$('[data-local-multiplier]'),'height');assert(top>lane&&top-lane<130,`the control sits under the lane it drives (${top-lane} at ${width}px, ${time}s)`);
      assert(bottom<=numbers(picture(f).getAttribute('viewBox'))[3]);
      for(const node of shownText(f)){const y=attr(node,'y');assert(y+3<=top||y-12>=bottom,`"${node.textContent}" runs under the z control at ${width}px, ${time}s`);}
      for(const node of [...drawing(f).querySelectorAll('circle')].filter(visible))assert(attr(node,'cy')+attr(node,'r')<=top||attr(node,'cy')-attr(node,'r')>=bottom);
    }
  }
});

test('Derivative gates: dragging z pauses, recomputes the whole local picture, and shows the symmetric death two frames cannot',t=>{
  const f=fixture(t,NAME);f.load();f.open();f.seek(16);f.play();f.tick(400);
  drag(f,-6);assert(!f.playing);assert.equal(f.frames.size,0);assert.equal(f.root.dataset.override,'slider');
  assert.equal(slider(f).value,'-6','the pause redraw must not move the requested thumb back to the timeline');
  const time=f.time,read_=()=>({...published(f),a:f.$('[data-activation-value]').textContent,zText:f.$('[data-z-value]').textContent,
    factorText:f.$('[data-factor-value]').textContent,delivered:f.$('[data-downstream-value]').textContent,r:attr(f.$('[data-local-pulse]'),'r'),
    x:attr(f.$('[data-activation-marker]'),'cx'),y:attr(f.$('[data-activation-marker]'),'cy'),readout:f.$('[data-z-readout]').textContent});
  // Quiet forward AND quiet backward at -6; loud forward, quiet backward at +6; the same tiny slope on both sides.
  const low=read_();drag(f,6);const high=read_();drag(f,0);const middle=read_();
  assert.equal(low.a,'a = 0.0025');assert.equal(high.a,'a = 0.9975');assert.equal(middle.a,'a = 0.5');
  assert.equal(low.factorText,'× slope = 0.002467');assert.equal(high.factorText,low.factorText);assert.equal(middle.factorText,'× slope = 0.25');
  assert.deepEqual([low.zText,middle.zText,high.zText],['z = −6','z = 0','z = 6']);assert.deepEqual([low.readout,middle.readout,high.readout],['z = −6','z = 0','z = 6']);
  close(low.factor,high.factor);assert.equal(middle.factor,0.25);close(low.activation+high.activation,1);
  assert(low.x<middle.x&&middle.x<high.x&&low.y>middle.y&&middle.y>high.y,'the point rides the S');
  // Everything follows every dragged value: state, labels, delivered area; widest at zero, symmetric, monotone in |z|.
  let previous=Infinity;
  for(let step=0;step<=60;step++) {
    const z=step/10;drag(f,z);const right=read_();drag(f,-z);const left=read_();
    assert.equal(right.z,z);assert.equal(left.z,z?-z:0);verifyMath(f.w.BookDerivativeGates.buildState(time,false,FIXTURE,z));
    close(right.factor,sigmoidDerivative(z));close(left.factor,right.factor);assert(right.factor<previous);previous=right.factor;
    for(const side of [left,right]) {
      assert(side.revealed&&side.delivered&&side.backwardVisible&&side.override==='slider');assert.equal(side.localProgress,1);
      close(side.r,14*Math.sqrt(side.factor),PIXEL_EPSILON);assert.equal(side.delivered_,undefined);
      assert.match(side.factorText,/^× slope = 0\.\d+$/);assert.equal(side.delivered,side.factorText.replace('× slope = ',''));
      close(Number(side.factorText.replace('× slope = ','')),side.factor,side.factor*6e-4);
    }
    close(right.activation,sigmoid(z));close(left.activation+right.activation,1);assert.equal(f.time,time);assert(!f.playing);
  }
  // Out-of-range and off-step requests are clamped to the domain and rounded to the control's step.
  for(const[asked,got]of [[9,6],[-9,-6],[2.449,2.4],[-0.04,0],[0.05000001,0.1]]){drag(f,asked);assert.equal(published(f).z,got);assert.equal(slider(f).value,String(got));}
  // Before the backward lane exists the drag brings it: dragging is the reader's experiment.
  f.seek(2);assert(!visible(f.$('[data-backward-network]')));drag(f,1.5);
  for(const selector of ['[data-backward-network]','[data-tangent]','[data-slope-link]','[data-local-pulse]'])assert(visible(f.$(selector)));
  assert.equal(f.$('[data-factor-value]').textContent,'× slope = 0.1491');assert(f.$('[data-formula]').classList.contains('dg-ceiling-shown'));
});

test('Derivative gates: any timeline action resumes the timeline’s z; keys on the control never seek',t=>{
  const f=fixture(t,NAME);f.load();f.open();f.seek(18.5);
  drag(f,-2.5);const time=f.time;
  f.resize(296);assert.equal(published(f).z,-2.5);assert.equal(f.time,time);assert.equal(slider(f).value,'-2.5');
  f.$('[data-action=fullscreen]').click();assert.equal(published(f).z,-2.5);f.$('[data-action=fullscreen]').click();assert.equal(published(f).z,-2.5);
  f.speed(2);assert.equal(published(f).z,-2.5);assert(!f.playing);f.resize(713);
  for(const key of ['ArrowRight','ArrowLeft','Home','End',' ','k'])f.key(key,slider(f));
  assert.equal(f.time,time,'the control’s keys do not reach the pane’s beat seeking');assert(!f.playing);assert.equal(f.root.dataset.override,'slider');
  for(const action of [()=>f.seek(18.5),()=>f.key('Home'),()=>f.key('End'),()=>f.play(),()=>f.key('ArrowLeft'),()=>f.key('ArrowRight'),
    ()=>f.key(' '),()=>f.key('k'),()=>press(f,'ArrowLeft',{shiftKey:true})]) {
    drag(f,-2.5);assert.equal(f.root.dataset.override,'slider');action();assert.equal(f.root.dataset.override,'');
    assert.notEqual(published(f).z,-2.5);assert(published(f).z===0||published(f).z===6,'the drag is a detour, not a new default');
    assert.equal(Number(slider(f).value),published(f).z);if(f.playing)f.play();
  }
  // Returning restores the timeline's own discipline: at 16 s the factor is withheld again.
  f.seek(16);drag(f,3);assert.match(f.$('[data-factor-value]').textContent,/^× slope = 0\.0/);f.seek(16);
  assert.equal(f.$('[data-factor-value]').textContent,'× slope = ?');assert.match(f.$('[data-caption]').textContent,/Predict/);
});

test('Derivative gates: a key the transport ignores leaves the dragged z alone, even across a resize',t=>{
  const f=fixture(t,NAME);f.load();f.open();f.seek(18.5);
  const ignored=[];
  for(const modifier of ['altKey','ctrlKey','metaKey'])
    for(const key of ['ArrowLeft','ArrowRight','Home','End',' ','k','K'])ignored.push([key,{[modifier]:true}]);
  for(const key of [' ','k','K'])ignored.push([key,{repeat:true}]);
  for(const[key,init]of ignored) {
    const name=`${Object.keys(init)[0]}+${JSON.stringify(key)}`;
    drag(f,-2.5);const time=f.time;press(f,key,init);
    assert.equal(f.time,time,`${name} must not seek`);assert(!f.playing,`${name} must not play`);
    assert.equal(f.root.dataset.override,'slider',`${name} ended the drag although the transport ignored it`);
    f.resize(296);assert.equal(published(f).z,-2.5);assert.equal(slider(f).value,'-2.5',`${name}, then a resize, snapped the thumb back to the timeline`);
    assert.equal(f.$('[data-z-readout]').textContent,'z = −2.5');assert.equal(f.$('[data-factor-value]').textContent,'× slope = 0.0701');
    f.resize(713);assert.equal(published(f).z,-2.5);assert.equal(f.time,time);
  }
  // A key aimed at another control inside the pane is not the pane's key either.
  drag(f,-2.5);f.key('Home',f.$('[data-speed]'));assert.equal(f.root.dataset.override,'slider');f.resize(520);assert.equal(published(f).z,-2.5);
});

test('Derivative gates: a dragged z is announced by the control alone, in one sentence that says what z does',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  const words=text=>text.trim().split(/\s+/).length,captions=new Set();
  for(const[time,kind]of [[2,'sigmoid'],[16,'sigmoid'],[28.5,'relu'],[38,'sigmoid']]) {
    f.seek(time);const named=scrubber(f).getAttribute('aria-valuetext'),onTimeline=picture(f).getAttribute('aria-label');
    const labels=new Set(),said=new Set();
    for(const z of [-6,-2.5,0,1.5,6]) {
      drag(f,z);const spoken=slider(f).getAttribute('aria-valuetext'),state=published(f);assert.equal(state.kind,kind);
      assert(spoken.startsWith(`z = ${f.$('[data-z-value]').textContent.slice(4)}. `),spoken);
      assert(spoken.includes(`output ${f.$('[data-activation-value]').textContent.slice(4)}`),'the control speaks the output exactly as drawn');
      if(!state.kink)assert(spoken.includes(`the tangent’s slope, ${f.$('[data-downstream-value]').textContent}.`),`the control speaks the multiplier exactly as drawn: ${spoken}`);
      assert.match(spoken,kind==='relu'?/Active ReLU passes one; inactive ReLU passes zero\.$/:/largest at z = 0 and dies toward both ends\.$/,'the value text says what the value does');
      // The picture's description and the scrubber do not repeat the live values.
      labels.add(picture(f).getAttribute('aria-label'));assert.equal(scrubber(f).getAttribute('aria-valuetext'),named,'the scrubber still names the timeline’s beat');
      f.speed(2);f.speed(1.5);assert.equal(scrubber(f).getAttribute('aria-valuetext'),named);
      said.add(f.$('[data-caption]').textContent);
    }
    assert.equal(labels.size,1,'one description for the whole drag, not a per-value readout');const[label]=labels;
    assert.notEqual(label,onTimeline);assert.match(label,/z slider, which announces their values/);
    assert.doesNotMatch(label.replace(/Best-case.*$/,''),/\d/,`the dragged description carries no live number: ${label}`);
    assert.equal(said.size,1,'a polite region is not rewritten on every drag step');const[sentence]=said;captions.add(sentence);
    assert(words(sentence)<=20,sentence);assert.match(sentence,/^You set z\./);
  }
  assert.equal(captions.size,2,'one drag sentence per face');
  // The live region is written once when a drag starts and not again while it continues.
  f.seek(16);const observer=new f.w.MutationObserver(()=>{});observer.observe(f.$('[data-caption]'),{childList:true,characterData:true,subtree:true});
  for(let z=-6;z<=6;z+=0.5)drag(f,z);assert.equal(observer.takeRecords().length,1);observer.disconnect();
});

test('Derivative gates: every printed number is typeset, and is announced on the picture only',async t=>{
  // e-notation or a hyphen-minus sign; and a raw double: more than four significant digits in one decimal.
  const significant=token=>token.replace('.','').replace(/^0+/,'').length;
  const raw={test:text=>/\de[-+]?\d|(?:^|[\s(=×])-\d/i.test(text)||(text.match(/\d+\.\d+/g)||[]).some(token=>significant(token)>4)};
  const f=fixture(t,NAME);f.load();f.open();
  const everything=g=>[...[...drawing(g).querySelectorAll('text')].map(node=>node.textContent),picture(g).getAttribute('aria-label'),
    scrubber(g).getAttribute('aria-valuetext'),slider(g).getAttribute('aria-valuetext'),g.$('[data-z-readout]').textContent,g.$('[data-caption]').textContent];
  for(const width of [713,296])for(const reduced of [false,true]) {
    const g=reduced?fixture(t,NAME,{reduced:true,width}):f;if(reduced){g.load();g.open();}else f.resize(width);
    for(let step=0;step<=400;step++) {
      g.seek(step/10);
      for(const text of everything(g))assert(!raw.test(text),`untypeset number at ${step/10}s: "${text}"`);
    }
    // Every value the control can reach, on both faces.
    for(const time of [16,28.5])for(let step=-60;step<=60;step++){g.seek(time);drag(g,step/10);for(const text of everything(g))assert(!raw.test(text),`untypeset number at z=${step/10}: "${text}"`);}
  }
  // Rule 7: the scrubber names the state; the numbers live on the picture and in its one description.
  for(const time of [0,2.5,5,8,10,13.5,15,18,20,25,30,32.5,35,40]) {
    f.seek(time);assert.doesNotMatch(scrubber(f).getAttribute('aria-valuetext').replace(/^\d+:\d\d of \d+:\d\d\. /,''),/\d/,`the scrubber repeats a number at ${time}s`);
  }
  f.seek(40);assert.match(picture(f).getAttribute('aria-label'),/10 gates, ceiling 9\.54 × 10⁻⁷\./);
  assert.equal(f.$('[data-bound-value]').textContent,'10 factors: at most 9.54 × 10⁻⁷');
  f.seek(34);assert.equal(f.$('[data-bound-value]').textContent,'8 factors: at most 1.53 × 10⁻⁵');
  f.seek(32.75);assert.equal(f.$('[data-bound-value]').textContent,'5 factors: at most 0.0009766');
  // Both script-free prints and the static description carry the same typeset witness.
  const bare=fixture(t,NAME),prints=[drawing(bare),bare.$('[data-static-frame="narrow"]')];
  for(const print of prints){assert.match(print.textContent,/at most 9\.54 × 10⁻⁷/);for(const node of print.querySelectorAll('text'))assert(!raw.test(node.textContent),node.textContent);}
  assert.match(picture(bare).getAttribute('aria-label'),/ceiling 9\.54 × 10⁻⁷\./);
  assert(!raw.test(picture(bare).getAttribute('aria-label')));assert(!raw.test(slider(bare).getAttribute('aria-valuetext')));
  assert(raw.test('ceiling 9.5367431640625e-7')&&raw.test('at most 9.54e-7')&&raw.test('z = -6')&&raw.test('0.24651'),'the detector itself must see the old defects');
});

test('Derivative gates: fixture tables and width-only geometry are built once, not every frame',t=>{
  const f=fixture(t,NAME);f.load();f.open();const build=f.w.BookDerivativeGates.buildState;
  assert.equal(build(3).curve,build(27).curve,'the 300-point curve is one frozen table, not rebuilt per call');
  assert.equal(build(3).bounds,build(27).bounds);assert(Object.isFrozen(build(3).curve)&&Object.isFrozen(build(3).curve[0]));
  // Watch three stretches of one playback: act 1, the 1.5 s compression into the strip, act 2.
  const watch=(until,after=()=>{})=>{
    const records=[],observer=new f.w.MutationObserver(list=>records.push(...list));
    observer.observe(f.root,{attributes:true,subtree:true,attributeOldValue:true});
    while(f.time<until-1e-9&&f.playing)f.tick(50);after();
    records.push(...observer.takeRecords());observer.disconnect();return records;
  };
  const moved=records=>records.filter(record=>record.attributeName==='d'||record.attributeName==='data-slider-band'
    ||(record.target.tagName==='text'&&['x','y'].includes(record.attributeName))).map(record=>`${record.target.tagName.toLowerCase()}@${record.attributeName}`);
  f.play();const actOne=watch(28.3),glide=watch(30.05),actTwo=watch(40,()=>{for(let z=-6;z<=6;z+=0.5)drag(f,z);}); // and a whole drag
  assert.equal(f.time,40);
  for(const records of [actOne,glide,actTwo])for(const name of ['data-curve','data-bounds','data-chain-points','data-ceiling','data-layout','data-stage-height','viewBox','stroke-dasharray'])
    assert(!records.some(record=>record.attributeName===name),`${name} is rewritten during playback`);
  assert.deepEqual([...new Set(moved(actOne))],[],'act 1 rebuilds no path and moves no label');
  assert.deepEqual([...new Set(moved(actTwo))],[],'act 2 and a whole drag rebuild no path and move no label');
  assert(moved(glide).includes('path@d')&&moved(glide).includes('text@y'),'the compression is a re-layout at native type size, not a scaled-down group');
  assert(!glide.some(record=>record.target.closest&&record.target.closest('[data-factor-chain]')&&['d','x','y','cx','cy'].includes(record.attributeName)),'the chain is laid out once, where act 2 needs it');
  assert.equal(f.root.querySelectorAll('[data-drawing] [transform]').length,0);
  assert.equal(data(f,'curve').length,300);assert.equal(data(f,'bounds').length,11);
  // While the reader is predicting (5-7 s and 15-17 s) the picture is still, and a still frame writes nothing to it.
  for(const start of [5.2,15.2]) {
    f.seek(start);const quiet=new f.w.MutationObserver(()=>{});
    quiet.observe(f.$('[data-figure]'),{attributes:true,childList:true,characterData:true,subtree:true});
    f.play();for(let n=0;n<10;n++)f.tick(100);f.play();close(f.time,start+1.5);
    assert.equal(quiet.takeRecords().length,0,'frames inside a hold must not touch the drawing or the control');quiet.disconnect();
  }
  // A width change is what rebuilds them, and only a real one.
  const before=f.$('[data-activation-curve="sigmoid"]').getAttribute('d');
  f.resize(713);assert.equal(f.$('[data-activation-curve="sigmoid"]').getAttribute('d'),before);
  f.resize(296);assert.notEqual(f.$('[data-activation-curve="sigmoid"]').getAttribute('d'),before);assert.equal(f.root.dataset.layout,'narrow');
});

test('Derivative gates: a one-gate fixture is refused before drawing; the two-gate minimum draws finite geometry',t=>{
  const one=fixture(t,NAME);one.root.dataset.fixture=JSON.stringify({...FIXTURE,maxGates:1});
  assert.throws(()=>one.load(),/2-100 gates/);assert(!one.root.dataset.ready);assert(slider(one).disabled,'a refused panel leaves the control inert');
  assert(one.$('[data-static-frame="narrow"]'),'a refused fixture leaves the static print in place');
  const two=fixture(t,NAME);two.root.dataset.fixture=JSON.stringify({...FIXTURE,maxGates:2});two.load();two.open();
  for(const width of widths) {
    two.resize(width);
    for(const time of [0,30,32.5,40]) {
      two.seek(time);assert.equal(drawing(two).querySelectorAll('[data-gate]').length,2);assert.equal(drawing(two).querySelectorAll('[data-hop]').length,2);
      for(const node of drawing(two).querySelectorAll('*'))for(const{name,value}of [...node.attributes]) {
        assert.doesNotMatch(value,/NaN|Infinity|undefined/,`${name}="${value}" at ${width}px`);
        if(['x','y','cx','cy','r','x1','x2','y1','y2'].includes(name))assert(Number.isFinite(Number(value)));
      }
      assert.doesNotMatch(picture(two).getAttribute('viewBox'),/NaN/);
    }
    two.seek(40);assert.equal(two.$('[data-bound-value]').textContent,'2 factors: at most 0.0625');
    // Its ruler only reaches 10^-1.2: whole powers of ten inside that reach, still on one log scale.
    assert.deepEqual([...two.root.querySelectorAll('[data-ruler-label]')].map(node=>node.textContent),['1','10⁻¹']);
  }
});

test('Derivative gates: narrow panes keep visible geometry readable and serialize pixels, not model values',t=>{
  const f=styled(fixture(t,NAME));f.load();f.open();
  for(const width of widths) {
    f.resize(width);
    for(const time of [0,5,8.1234567,10,13.1234567,15,20,25,28.1234567,30,32.6234567,35,40]) {
      f.seek(time);const state=f.w.BookDerivativeGates.buildState(time),box=numbers(picture(f).getAttribute('viewBox'));
      assert.equal(box[2],width);
      for(const key of ['z','sigmoid','sigmoidGate','reluGate','bound','gateCount','marker','rulerExponent'])assert.equal(Number(f.root.dataset[key]),state[key]);
      closeTree(data(f,'curve').map(point=>point.sigmoidGate),state.curve.map(point=>point.sigmoidGate),0);
      for(const node of [...drawing(f).querySelectorAll('text')].filter(visible)) {
        assert(parseFloat(f.w.getComputedStyle(node).fontSize)>=12,`small label at ${width}: ${node.textContent}`);
        assert(attr(node,'x')>=0&&attr(node,'x')<=width);assert(attr(node,'y')>=0&&attr(node,'y')<=box[3]);
      }
      for(const node of drawing(f).querySelectorAll('*'))for(const key of ['x','x1','x2','y','y1','y2','cx','cy','width','height','stroke-dashoffset','stroke-dasharray']) {
        if(!node.hasAttribute(key))continue;const value=attr(node,key);assert(Number.isFinite(value));
        assert.equal(value,Number(value.toFixed(PIXEL_DIGITS)));
        if(visible(node)&&!key.startsWith('stroke')) {
          const limit=key.startsWith('x')||key==='cx'||key==='width'?width:box[3];
          assert(value>=0&&value<=limit,`${key}=${value} exceeds ${limit} at ${width}`);
        }
      }
      for(const node of drawing(f).querySelectorAll('[d]'))for(const value of numericTokens(node.getAttribute('d')))
        assert.equal(value,Number(value.toFixed(PIXEL_DIGITS)));
      for(const node of [...drawing(f).querySelectorAll('circle')].filter(visible)) {
        const x=attr(node,'cx'),y=attr(node,'cy'),r=attr(node,'r');
        assert(r>0&&Number.isFinite(r));assert.equal(r,Number(r.toFixed(PIXEL_DIGITS)));
        assert(x-r>=0&&x+r<=width,`circle extent [${x-r},${x+r}] exceeds width ${width}`);
        assert(y-r>=0&&y+r<=box[3]);
      }
      assert(drawing(f).querySelectorAll('*').length<140,'one picture, not a dashboard');
    }
  }
});

test('Derivative gates: every label stays inside the picture, off its neighbours and off the boxes it does not belong to, at every width',t=>{
  // Estimated advances, the approach the gate-product suite uses: JSDOM lays out no text. The
  // classes are a common sans-serif's (Arial's, wider than the book's Source Sans): narrow
  // letters and punctuation, wide letters, capitals, arrows, superscripts, and the rest.
  const advance=(text,size)=>[...text].reduce((total,ch)=>total+(ch===' '?0.28:/[←→]/.test(ch)?1:/[◆mwMW]/.test(ch)?0.85:/[A-Z]/.test(ch)?0.7
    :/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/.test(ch)?0.4:/[.,:;·'’ijlI()]/.test(ch)?0.28:/[ftr]/.test(ch)?0.34:0.58),0)*size;
  const f=styled(fixture(t,NAME));f.load();f.open();
  for(const width of widths) {
    f.resize(width);
    const inspect=label=>{
      const height=numbers(picture(f).getAttribute('viewBox'))[3],extents=[];
      for(const node of shownText(f)) {
        const size=parseFloat(f.w.getComputedStyle(node).fontSize),anchor=node.getAttribute('text-anchor'),x=attr(node,'x'),y=attr(node,'y'),line=node.textContent,w=advance(line,size);
        const[x0,x1]=anchor==='end'?[x-w,x]:anchor==='middle'?[x-w/2,x+w/2]:[x,x+w];
        assert(x0>=-0.5&&x1<=width+0.5,`"${line}" spans [${x0.toFixed(1)}, ${x1.toFixed(1)}] outside the ${width}px picture, ${label}`);
        assert(y-0.72*size>=0&&y+0.2*size<=height,`"${line}" leaves the picture vertically, ${label}`);
        extents.push({node,x0,x1,y0:y-0.72*size,y1:y+0.2*size,line});
      }
      for(let i=0;i<extents.length;i++)for(let j=i+1;j<extents.length;j++) {
        const a=extents[i],b=extents[j];if(a.y1<=b.y0+0.5||b.y1<=a.y0+0.5)continue;
        assert(a.x1<=b.x0+0.5||b.x1<=a.x0+0.5,`"${a.line}" and "${b.line}" overlap at ${width}px, ${label}`);
      }
      // A box holds its own labels and no one else's: the component its face labels, the multiplier its factor.
      const boxes=[[f.$('[data-activation-node]'),e=>Boolean(e.node.closest('[data-face]'))],[f.$('[data-local-multiplier]'),e=>e.node.hasAttribute('data-factor-value')]];
      for(const[rect,owns]of boxes) {
        if(!visible(rect))continue;const x0=attr(rect,'x'),y0=attr(rect,'y'),x1=x0+attr(rect,'width'),y1=y0+attr(rect,'height');
        for(const e of extents) {
          if(owns(e))assert(e.x0>=x0+2&&e.x1<=x1-2&&e.y0>=y0+1&&e.y1<=y1-1,`"${e.line}" leaves its box at ${width}px, ${label}`);
          else assert(e.x1<=x0-1||e.x0>=x1+1||e.y1<=y0||e.y0>=y1,`"${e.line}" runs into a box at ${width}px, ${label}`);
        }
      }
      // Face labels keep clear of the moving marks: the point, its tangent, and the curve's own end.
      const dot=f.$('[data-activation-marker]'),tangent=f.$('[data-tangent]');
      for(const e of extents.filter(e=>e.node.closest('[data-face]'))) {
        const marks=[[attr(dot,'cx'),attr(dot,'cy')]];
        if(visible(tangent))for(let s=0;s<=1;s+=0.125)marks.push([attr(tangent,'x1')+(attr(tangent,'x2')-attr(tangent,'x1'))*s,attr(tangent,'y1')+(attr(tangent,'y2')-attr(tangent,'y1'))*s]);
        for(const[x,y]of marks)assert(x<e.x0-2||x>e.x1+2||y<e.y0-2||y>e.y1+2,`a moving mark crosses "${e.line}" at ${width}px, ${label}`);
      }
      // Labels stay off the chain's gates (the ×¼ inside each gate is the gate's own).
      for(const gate of [...drawing(f).querySelectorAll('[data-gate]')].filter(visible))for(const e of extents.filter(e=>!e.node.hasAttribute('data-gate-label'))) {
        const cx=attr(gate,'cx'),cy=attr(gate,'cy'),r=attr(gate,'r'),nx=Math.max(e.x0,Math.min(cx,e.x1)),ny=Math.max(e.y0,Math.min(cy,e.y1));
        assert(Math.hypot(nx-cx,ny-cy)>=r,`"${e.line}" touches gate ${gate.dataset.gate} at ${width}px`);
      }
    };
    for(const time of [0,6,8.5,11,13.5,16,18.5,22,26.5,28.2,28.8,29.3,29.9,30,31,32.75,34.2,37,40]){f.seek(time);inspect(`${time}s`);}
    for(const time of [2,16,27.5,29.4,40])for(let z=-6;z<=6;z+=0.5){f.seek(time);drag(f,z);inspect(`z=${z} dragged at ${time}s`);}
  }
});

// Vertical extents of what is drawn, read from the DOM: every visible mark of the component
// picture (with the z control's band) and, separately, of the chain and its ruler.
function stageExtents(f) {
  const size=node=>parseFloat(f.w.getComputedStyle(node).fontSize),spans={component:[],chain:[]};
  for(const node of [...drawing(f).querySelectorAll('text, circle, rect, line, path')].filter(visible)) {
    const ys=node.tagName==='text'?[attr(node,'y')-0.72*size(node),attr(node,'y')+0.2*size(node)]
      :node.tagName==='circle'?[attr(node,'cy')-attr(node,'r'),attr(node,'cy')+attr(node,'r')]
      :node.tagName==='rect'?[attr(node,'y'),attr(node,'y')+attr(node,'height')]
      :node.tagName==='line'?[attr(node,'y1'),attr(node,'y2')]
      :numericTokens(node.getAttribute('d')).filter((_,index)=>index%2===1);
    spans[node.closest('[data-factor-chain]')?'chain':'component'].push([Math.min(...ys),Math.max(...ys)]);
  }
  spans.component.push(f.root.dataset.sliderBand.split(' ').map(Number));
  const extent=list=>list.length?{top:Math.min(...list.map(span=>span[0])),bottom:Math.max(...list.map(span=>span[1]))}:null;
  // The tallest empty horizontal band inside the stage, the margins above and below included.
  const emptiest=(list,height)=>{let reach=0,gap=0;for(const[top,bottom]of [...list].sort((a,b)=>a[0]-b[0])){gap=Math.max(gap,top-reach);reach=Math.max(reach,bottom);}return Math.max(gap,height-reach);};
  return{component:extent(spans.component),chain:extent(spans.chain),emptiest:height=>emptiest([...spans.component,...spans.chain],height)};
}

test('Derivative gates: two acts share one constant stage: no reserved band before the depth beat, no overlap after it',t=>{
  for(const width of [713,296]) {
    const f=styled(fixture(t,NAME,{width}));f.load();f.open();
    // One viewBox for the whole timeline, a drag and both acts: nothing below the picture ever jumps.
    f.seek(0);const box=picture(f).getAttribute('viewBox'),height=numbers(box)[3];assert.equal(numbers(box)[2],width);
    for(let step=0;step<=160;step++){f.seek(step/4);assert.equal(picture(f).getAttribute('viewBox'),box,`viewBox changes at ${step/4}s`);}
    f.seek(40);assert.equal(picture(f).getAttribute('viewBox'),box);drag(f,-3);assert.equal(picture(f).getAttribute('viewBox'),box);
    assert.equal(picture(f).getAttribute('preserveAspectRatio'),'xMinYMin meet');assert.equal(Number(f.root.dataset.stageHeight),height);
    // Act 1: no mark of the chain exists, and the component picture has the whole stage.
    let actOne=null;
    for(const time of [0,2,6,8.5,13.5,18.5,22,26,28,28.5]) {
      f.seek(time);assert.equal(published(f).actMix,0,`act 1 at ${time}s`);
      const chain=f.$('[data-factor-chain]');assert(!visible(chain));
      for(const node of chain.querySelectorAll('*'))assert(!visible(node),`a chain mark is drawn at ${time}s`);
      const stage=stageExtents(f);assert.equal(stage.chain,null);
      assert(stage.component.top<=16&&stage.component.bottom>=height-45&&stage.component.bottom<=height,`the component picture spans [${stage.component.top}, ${stage.component.bottom}] of ${height} at ${width}px`);
      if(time>=5)assert(stage.emptiest(height)<=0.14*height,`an empty band of ${stage.emptiest(height).toFixed(0)} units at ${time}s, ${width}px`);
      if(actOne===null)actOne=stage.component.bottom;else close(stage.component.bottom,actOne,1e-9);
    }
    // The compression: monotone, a fraction of the stage at every step, finished on the beat it leads into.
    let mix=0,bottom=actOne;
    for(let time=28.5;time<=30+1e-9;time+=0.1) {
      f.seek(Number(time.toFixed(1)));const state=published(f),stage=stageExtents(f);
      assert(state.actMix>=mix&&stage.component.bottom<=bottom+1e-9,`the strip grows back at ${time.toFixed(1)}s`);mix=state.actMix;bottom=stage.component.bottom;
      if(time<30-1e-9)assert.equal(stage.chain,null,'the chain waits for the beat');
    }
    assert.equal(mix,1);f.seek(29.25);close(published(f).actMix,0.5);
    // Act 2: the strip and the chain both fit, one above the other, and the control sits between them.
    for(const time of [30,31,32.75,34,35,40])for(const z of [null,-6,0,6]) {
      f.seek(time);if(z!==null)drag(f,z);assert.equal(published(f).actMix,1);
      const stage=stageExtents(f),[bandTop,bandBottom]=f.root.dataset.sliderBand.split(' ').map(Number);
      assert(stage.component.bottom<=bottom+1e-9&&stage.component.bottom===bandBottom,'the control’s band closes the strip');
      assert(stage.chain.top>=bandBottom+4,`the chain starts ${stage.chain.top-bandBottom} units under the control at ${width}px`);
      assert(stage.chain.bottom<=height&&stage.component.top>=0);assert(stage.emptiest(height)<=0.14*height);
      assert(bandBottom<=0.6*height&&bandBottom<=0.65*actOne,'a compact strip: well under two thirds of what the picture took in act 1');
      // Still a component with a legible face: native type, a face tall enough to show the tilt.
      for(const node of shownText(f))assert(parseFloat(f.w.getComputedStyle(node).fontSize)>=12);
      assert(faceOf(f).height>=40&&faceOf(f).width>=80);close(parseFloat(f.$('[data-z-control]').style.top),bandTop,1e-3);
    }
    f.seek(40);const tilt=z=>{drag(f,z);const line=f.$('[data-tangent]');return Math.atan2(attr(line,'y1')-attr(line,'y2'),attr(line,'x2')-attr(line,'x1'))*180/Math.PI;};
    assert(tilt(0)>35&&tilt(6)<3&&tilt(-6)<3,'the strip’s tangent still tilts visibly');
    // Reduced motion: the act-1 layout for beats 0-5, the act-2 layout for the depth beats, each one still.
    const r=styled(fixture(t,NAME,{reduced:true,width}));r.load();r.open();
    for(const time of [0,7,12,17,22,25,29.99]){r.seek(time);assert.equal(published(r).actMix,0);close(stageExtents(r).component.bottom,actOne,1e-9);assert.equal(stageExtents(r).chain,null);}
    for(const time of [30,33,35,40]){r.seek(time);assert.equal(published(r).actMix,1);close(stageExtents(r).component.bottom,bottom,1e-9);assert(stageExtents(r).chain.top>=bottom+4);}
    assert.equal(picture(r).getAttribute('viewBox'),box);
  }
});

test('Derivative gates: arbitrary seek, drag and resize histories reproduce drawing and full-precision state',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  const snapshot=()=>JSON.stringify({drawing:canonicalMarkup(f.$('[data-figure]').innerHTML),
    formula:canonicalMarkup(f.$('[data-formula]').outerHTML),caption:f.$('[data-caption]').innerHTML,thumb:Number(slider(f).value),spoken:slider(f).getAttribute('aria-valuetext'),
    state:Object.fromEntries(Object.entries(f.root.dataset).filter(([key])=>!['time','playing','typeset'].includes(key)))});
  const times=[0,5,7.3,8.7,10,12.3,14.7,15,20,25,27,28.1,30,32.7,35,40];
  const snapshots=times.map(time=>{f.seek(time);return snapshot();});
  f.play();f.tick(1733);drag(f,-3.3);f.resize(296);f.seek(31.4);drag(f,4);f.resize(713);
  assert.deepEqual(times.toReversed().map(time=>{f.seek(time);return snapshot();}),snapshots.toReversed());
  // A dragged picture depends on the dragged z and the beat alone, not on how it was reached.
  f.seek(16);drag(f,-3.3);const direct=snapshot();f.seek(16);drag(f,5);drag(f,0);drag(f,-3.3);assert.equal(snapshot(),direct);
});

test('Derivative gates: both script-free prints equal the final frame and preserve the positive witness',async t=>{
  const generated=await staticFrame(NAME);assert.equal(generated.before,generated.after,'regenerate derivative-gate static frames');
  const f=fixture(t,NAME),narrow=f.$('[data-static-frame="narrow"]');assert(narrow);
  assert.equal(narrow.dataset.width,'296');const height=Number(narrow.dataset.height);
  const ids=[...f.root.querySelectorAll('[id]')].map(node=>node.id);assert.equal(ids.length,new Set(ids).size);
  for(const frame of [drawing(f),narrow]) {
    assert.match(frame.textContent,/9\.5[34]|one in a million/);assert.match(frame.textContent,/log scale/);assert.match(frame.textContent,/active ReLU path: stays at 1/);
    assert.equal(frame.querySelectorAll('[data-hop]:not([hidden])').length,10,'the print keeps all ten equal hops');
    assert.equal(frame.querySelector('[data-factor-value]').textContent,'× slope = 0.002467');
  }
  // The phone print's box is the narrow layout's own aspect ratio.
  assert.match(read('derivative-gates/player.css'),new RegExp(`aspect-ratio:\\s*296\\s*/\\s*${height}\\b`));
  f.load();f.open();f.seek(40);f.resize(296);
  assert.equal(f.root.querySelectorAll('[data-static-frame="narrow"]').length,0);
  assert.equal(numbers(picture(f).getAttribute('viewBox'))[3],height);
});

test('Derivative gates: exp, sqrt, hypot or log10 ULP differences cannot change generated static SVG bytes',()=>{
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
      f.w.Math[method]=(...values)=>{const result=original(...values);return result>0&&Number.isFinite(result)?adjacent(result):result;};return f;
    };
    const {staticFrame}=require(process.argv[1]+'/scripts/render_static_frames.cjs');
    (async()=>{
      const base=await staticFrame('derivative-gates');assert.equal(base.before,base.after);
      for(const name of ['exp','sqrt','hypot','log10'])for(const ulps of [-4,-2,-1,1,2,4]) {
        method=name;offset=ulps;const next=await staticFrame('derivative-gates');
        assert.equal(next.after,base.after,'static SVG changed under '+ulps+' ULPs of '+name);
      }
    })().catch(error=>{console.error(error.message);process.exitCode=1;});
  `;
  execFileSync(process.execPath,['-e',diagnostic,ROOT],{stdio:'pipe',timeout:30000});
});

test('Derivative gates: the scope is activation factors, not measured training or a full gradient bound',t=>{
  const f=fixture(t,NAME),boundary=f.$('.mechanism-boundary'),text=boundary.textContent.replace(/\s+/g,' ');
  assert.match(text,/activation|local derivative/i);assert.match(text,/weight/i);
  // One visible lead sentence; every further qualifier sits in the closed scope disclosure.
  const lead=[...boundary.children].filter(node=>node.tagName==='P');assert.equal(lead.length,1);
  assert.equal(lead[0].textContent.trim().split(/(?<=[.!?])\s+/).length,1);assert(lead[0].textContent.trim().split(/\s+/).length<=30);
  assert.equal(boundary.querySelectorAll('details.mechanism-scope').length,1);assert(!boundary.querySelector('details.mechanism-scope').open);
  const explanation=[text,f.$('.mechanism-transcript').textContent].join(' ').replace(/\s+/g,' ');
  assert.match(explanation,/not.*(?:complete|full).*(?:gradient|Jacobian)|(?:complete|full).*(?:gradient|Jacobian).*not/i);
  assert.match(explanation,/PyTorch.*(?:zero|0)|(?:zero|0).*PyTorch/i);
  assert.match(explanation,/positive|nonzero|non-zero/i);
  assert.match(explanation,/not.*(?:observed loss|measured).*gradient/i);
  assert.match(explanation,/not ten simulated forward activations|not a simulated forward network/i);
  assert.match(explanation,/does not cross an uncomputed weight matrix/i);
  // What the redesign added is scoped too: the face's own vertical scale, the log ruler as a device, the dragged values as computed.
  assert.match(text,/own vertical scale/i);assert.match(text,/logarithmic scale/i);assert.match(text,/computed from the chapter’s formulas|computed from the chapter's formulas/i);
  assert.match(text,/convention and not a slope/i);
  assert.doesNotMatch(read('derivative-gates/player.js'),/Math\.random|fetch\(|import\(|setInterval\(|SIG_NORMS|RELU_NORMS|gradient_diagnostic|LSTM|b_f/);
  assert.match(f.$('#derivative-gates-playback-help').textContent,/one parameter control/);
  assert.equal(f.$('.mechanism-transcript ol').children.length,scene.beats.length,'one transcript item per beat');
  const filter=fs.readFileSync(path.join(ROOT,scene.filter),'utf8');
  assert.match(filter,/^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
  assert.doesNotMatch(read('derivative-gates/panel.html'),/@eq-/);
});
