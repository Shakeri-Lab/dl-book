#!/usr/bin/env node
// Independent interval, storage and drawing checks; no training or runtime claim.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const {ROOT,read,entry,chapterSource,numbers,close,canonicalMarkup,fixture,
  registerTransportTests,registerBeatHoldTest,registerGrammarTests}=require('./html-tests/excerpt-harness.cjs');
const {staticFrame}=require('./render_static_frames.cjs');

const NAME='scale-granularity-excerpt',scene=entry(NAME),widths=[240,296,360,519,520,553,713];
const FIXTURE={bits:8,rows:64,cols:256,quietMax:0.01,loudMax:10,scaleBytes:4};
const data=(f,key)=>JSON.parse(f.root.dataset[key]);
const attr=(node,key)=>Number(node.getAttribute(key));
const visible=node=>Boolean(node&&!node.closest('[hidden]'));
const drawing=f=>f.$('[data-drawing]');
// Drawing coordinates are serialized to 0.0001 px; the mathematical state is not rounded.
const PIXEL_EPSILON=5.1e-5;
const closePixel=(actual,expected)=>close(actual,expected,PIXEL_EPSILON);
const numericTokens=text=>(text.match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi)||[]).map(Number);
const closeTree=(actual,expected,epsilon=1e-12)=>{
  if(Array.isArray(expected)) {
    assert(Array.isArray(actual));assert.equal(actual.length,expected.length);
    expected.forEach((value,j)=>closeTree(actual[j],value,epsilon));
  } else close(actual,expected,epsilon);
};
// Torch's ties-to-even rule, independent of the player. No fixture lies on a
// global half-step; local ties are included to verify the nearest-point bound.
function roundEven(value) {
  const lower=Math.floor(value),fraction=value-lower;
  return fraction<0.5?lower:fraction>0.5?lower+1:lower%2===0?lower:lower+1;
}
function quantize(value,scale,qmax) {
  const code=Math.max(-qmax,Math.min(qmax,roundEven(value/scale)));
  return {code,reconstruction:code*scale,error:Math.abs(value-code*scale)};
}
function oracle(source) {
  const qmax=2**(source.bits-1)-1,globalScale=source.loudMax/qmax,rowScale=source.quietMax/qmax;
  return {qmax,globalScale,rowScale,globalHalfBin:globalScale/2,rowHalfBin:rowScale/2,
    quietRange:[-source.quietMax,source.quietMax],allGlobalZero:source.quietMax<globalScale/2,
    magnitudeEndpoint:source.quietMax,globalCode:0,globalReconstruction:0,
    rowCode:qmax,rowReconstruction:source.quietMax,
    payloadBytes:source.rows*source.cols*source.bits/8,
    globalMetadataBytes:source.scaleBytes,rowMetadataBytes:source.rows*source.scaleBytes};
}
function verifyState(state,source) {
  for(const [key,value] of Object.entries(oracle(source))) {
    if(typeof value==='boolean')assert.equal(state[key],value,key);else closeTree(state[key],value);
  }
}

registerTransportTests(NAME,{witness:/256/,anchors:['scale-granularity-playback-help'],width:713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('scale granularity: the interval and storage fixture comes from the existing chapter audit',t=>{
  const f=fixture(t,NAME),chapter=chapterSource(NAME);f.load();f.open();
  assert.equal(scene.qmd,'chapters/part5/17-peft-quantization.qmd');
  assert.deepEqual(scene.anchor,{type:'before-heading',target:'What a quantization workflow protects'});
  assert.match(chapter,/^### What a quantization workflow protects\s*$/m);
  assert.equal(scene.duration,40);assert.deepEqual(scene.beats,[0,5,10,15,20,25,30,35]);
  assert(chapter.includes('QUANT_D_IN, QUANT_D_OUT = 256, 64'));
  assert.match(chapter,/def make_quantization_problem\(\s*seed: int = 1701,/);
  assert(chapter.includes('torch.logspace(-2, 1, QUANT_D_OUT)'));
  assert(chapter.includes('directions.abs().amax(dim=1, keepdim=True)'));
  assert(chapter.includes('metadata_bytes = scale.numel() * 4'));
  assert(chapter.includes('payload_bytes = codes.numel() * bits / 8'));
  for(const literal of scene.fixture.literals) assert(chapter.includes(literal),literal);
  assert.equal(typeof f.w.BookScaleGranularity.buildState,'function');
  assert.deepEqual(data(f,'fixture'),FIXTURE);
  verifyState(f.w.BookScaleGranularity.buildState(40),FIXTURE);
});

test('scale granularity: the whole quiet interval lies strictly within the global zero bin',t=>{
  const f=fixture(t,NAME);f.load();f.open();const state=f.w.BookScaleGranularity.buildState(40);
  verifyState(state,FIXTURE);assert.equal(state.qmax,127);
  close(state.globalHalfBin-FIXTURE.quietMax,373/12700);
  for(let index=0;index<=2048;index++) {
    const weight=-FIXTURE.quietMax+2*FIXTURE.quietMax*index/2048;
    assert(Math.abs(weight)<state.globalHalfBin);
    const rounded=quantize(weight,state.globalScale,state.qmax);
    assert.equal(rounded.code,0);assert.equal(rounded.reconstruction,0);
  }
  close(FIXTURE.quietMax/state.globalScale,0.127);
});

test('scale granularity: a row maximum is recovered, but generic quiet weights still incur error',t=>{
  const f=fixture(t,NAME);f.load();f.open();const state=f.w.BookScaleGranularity.buildState(40);
  close(state.rowScale,0.01/127);
  for(const sign of [-1,1]) {
    const endpoint=quantize(sign*FIXTURE.quietMax,state.rowScale,state.qmax);
    assert.equal(endpoint.code,sign*127);close(endpoint.reconstruction,sign*FIXTURE.quietMax);
  }
  let inexact=0;
  for(let index=0;index<=1000;index++) {
    const weight=FIXTURE.quietMax*(2*index/1000-1),rounded=quantize(weight,state.rowScale,state.qmax);
    assert(rounded.error<=state.rowHalfBin+1e-15);if(rounded.error>1e-8)inexact++;
    const actual=f.w.BookScaleGranularity.quantize(weight,state.rowScale,state.qmax);
    assert(actual.code===rounded.code);close(actual.reconstructed,rounded.reconstruction);close(actual.error,rounded.error);
  }
  assert(inexact>900,'a finer row grid is not exact recovery of arbitrary values');
  for(const half of [-125.5,-3.5,-2.5,-0.5,0.5,2.5,3.5,125.5]) {
    const rounded=quantize(half*state.rowScale,state.rowScale,state.qmax);
    close(rounded.error,state.rowHalfBin);assert.equal(Math.abs(roundEven(half))%2,0);
    // A unit scale leaves exact binary half ties, independently of division roundoff.
    const actual=f.w.BookScaleGranularity.quantize(half,1,state.qmax);
    assert.equal(actual.code,roundEven(half));close(actual.error,0.5);
  }
});

test('scale granularity: alternative valid fixtures preserve the interval proof and nearest-point bound',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const source of [
    {...FIXTURE,bits:4,quietMax:0.1,loudMax:2,rows:3,cols:10},
    {...FIXTURE,bits:3,quietMax:0.02,loudMax:1,rows:2,cols:16},
    {...FIXTURE,quietMax:0.001,loudMax:1,rows:7,cols:9},
    {...FIXTURE,quietMax:0.039,loudMax:10,rows:1,cols:3},
  ]) {
    const original=JSON.stringify(source);
    for(const time of [0,5,10,12.5,15,20,23.5,25,30,35,40]) {
      const state=f.w.BookScaleGranularity.buildState(time,false,source);verifyState(state,source);
      for(let index=0;index<=100;index++) {
        const weight=source.quietMax*(2*index/100-1);
        assert.equal(quantize(weight,state.globalScale,state.qmax).code,0);
        assert(quantize(weight,state.rowScale,state.qmax).error<=state.rowHalfBin+1e-15);
      }
    }
    assert.equal(JSON.stringify(source),original);
  }
});

test('scale granularity: invalid shapes, bit widths and non-collapsing regimes are rejected',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const patch of [{bits:1},{bits:2.5},{rows:0},{rows:1.5},{cols:-1},{scaleBytes:0},
    {quietMax:0},{quietMax:-0.01},{quietMax:Infinity},{loudMax:0},{loudMax:NaN},
    {quietMax:FIXTURE.loudMax/(2*127)},{quietMax:0.04}])
    assert.throws(()=>f.w.BookScaleGranularity.buildState(40,false,{...FIXTURE,...patch}),
      /finite|positive|integer|bit|range|quiet|scale|regime|row|column/i);
});

test('scale granularity: metadata increases while the ideal eight-bit payload is unchanged',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(let time=0;time<=40;time+=0.25) {
    const state=f.w.BookScaleGranularity.buildState(time);verifyState(state,FIXTURE);
    assert.equal(state.payloadBytes,16384);assert.equal(state.globalMetadataBytes,4);
    assert.equal(state.rowMetadataBytes,256);
    assert.equal(state.rowMetadataBytes-state.globalMetadataBytes,252);
    assert.equal(state.payloadBytes+state.globalMetadataBytes,16388);
    assert.equal(state.payloadBytes+state.rowMetadataBytes,16640);
  }
});

// The ruler's geometry as the DOM states it, never as the player computes it.
const frame=f=>{
  const ruler=f.$('[data-ruler]'),origin=(attr(ruler,'x1')+attr(ruler,'x2'))/2;
  return {ruler,origin,unit:(attr(ruler,'x2')-attr(ruler,'x1'))/(2*oracle(FIXTURE).globalHalfBin*1.15),
    ry:Number(f.root.dataset.rulerY),qy:Number(f.root.dataset.rangeY)};
};
// Each grid tick is one "M x y1 L x y2" stroke; data-codes names the code each stroke draws.
const ticks=node=>{
  const xy=numericTokens(node.getAttribute('d')||''),codes=JSON.parse(node.dataset.codes||'[]');
  assert.equal(xy.length,4*codes.length,'one vertical stroke per published code');
  return codes.map((code,j)=>{assert.equal(xy[4*j],xy[4*j+2],'grid ticks are vertical');
    return {code,x:xy[4*j],top:Math.min(xy[4*j+1],xy[4*j+3]),bottom:Math.max(xy[4*j+1],xy[4*j+3])};});
};
const shownText=f=>[...drawing(f).querySelectorAll('text')].filter(visible);
const opacity=node=>visible(node)?Number(node.getAttribute('opacity')??1):0;

test('scale granularity: the same fixed ruler draws true global and subpixel local bin widths',t=>{
  const f=fixture(t,NAME);f.load();f.open();const want=oracle(FIXTURE);
  for(const width of widths) {
    f.resize(width);let fixedUnit;
    for(const time of [0,5,10,12.7,15,17,20,23.1,25,30,35,40]) {
      f.seek(time);const {ruler,origin,unit}=frame(f);
      if(fixedUnit===undefined)fixedUnit=unit;close(unit,fixedUnit);
      close(Number(f.root.dataset.pixelsPerUnit),unit);close(Number(f.root.dataset.originX),origin);
      const half=time>=20?want.rowHalfBin:want.globalHalfBin,bin=f.$('[data-zero-bin]');
      closePixel(attr(bin,'x'),origin-half*unit);closePixel(attr(bin,'width'),2*half*unit);
      close(Number(f.root.dataset.currentBinHalf),half);
      assert(attr(bin,'x')>=attr(ruler,'x1'));assert(attr(bin,'x')+attr(bin,'width')<=attr(ruler,'x2')+2*PIXEL_EPSILON);
      if(time>=20)assert(attr(bin,'width')<1,'the tiny local bin must not be falsely widened to a visible minimum');
      const path=f.$('[data-quiet-range]').getAttribute('d'),xy=numericTokens(path),y=Number(f.root.dataset.rangeY);
      assert.equal(xy.length,12);assert.doesNotMatch(path,/[ACHQSTV]/i);
      const low=origin-FIXTURE.quietMax*unit,high=origin+FIXTURE.quietMax*unit;
      closeTree(xy,[low,y-5,low,y+5,low,y,high,y,high,y-5,high,y+5],PIXEL_EPSILON);
    }
  }
});

test('scale granularity: a hollow locator and a leader find the sub-pixel local bin without widening it',t=>{
  const f=fixture(t,NAME);f.load();f.open();const want=oracle(FIXTURE);
  assert.match(read('scale-granularity/player.css'),/\.sg-locator\s*\{[^}]*fill:\s*none/,'a locator is hollow: it supplies no magnitude');
  for(const width of widths) {
    f.resize(width);
    for(const time of [10,15,17]) {
      f.seek(time);assert(visible(f.$('[data-zero-bin]')));
      assert(!visible(f.$('[data-bin-locator]')),'a bin hundreds of pixels wide needs no locator');
      assert(!visible(f.$('[data-bin-leader]')));
    }
    for(const time of [20,25,40]) {
      f.seek(time);const {origin,unit,ry}=frame(f),bin=f.$('[data-zero-bin]'),ring=f.$('[data-bin-locator]'),leader=f.$('[data-bin-leader]');
      closePixel(attr(bin,'width'),2*want.rowHalfBin*unit);assert(attr(bin,'width')<1);
      assert(visible(ring)&&visible(leader)&&visible(f.$('[data-bin-label]')));
      assert.equal(ring.tagName.toLowerCase(),'circle');assert.equal(ring.getAttribute('class'),'sg-locator');
      // The ring sits on the hairline, clear of the grid tick that would otherwise hide it.
      close(attr(ring,'cx'),origin,PIXEL_EPSILON);
      const zero=ticks(f.$('[data-grid-ticks]')).find(tick=>tick.code===0);
      assert(attr(bin,'y')<zero.top&&attr(bin,'y')+attr(bin,'height')>zero.bottom,'the true-width bin shows beyond the code-0 tick');
      assert(attr(ring,'cy')-attr(ring,'r')>zero.bottom,'the locator is below the tick, not painted over it');
      assert(attr(ring,'cy')+attr(ring,'r')<=attr(bin,'y')+attr(bin,'height')+PIXEL_EPSILON,'the locator encircles the bin itself');
      assert(attr(ring,'cy')>ry);
      // The leader starts on the ring and ends just above the label it serves.
      const reach=Math.hypot(attr(leader,'x1')-attr(ring,'cx'),attr(leader,'y1')-attr(ring,'cy'));
      assert(Math.abs(reach-attr(ring,'r'))<0.2,`leader starts ${reach}px from the ring centre`);
      const label=f.$('[data-bin-label]');assert.match(label.textContent,/^zero bin: 1000× narrower$/);
      assert(attr(leader,'y2')<attr(label,'y')-10&&attr(leader,'y2')>attr(label,'y')-20);
      if(time>=25) {
        const error=f.$('[data-error-label]');assert(visible(error));
        assert.equal(error.textContent,'rounding error ≤ s/2 = 3.937 × 10⁻⁵');
        close(attr(error,'x'),attr(label,'x'));assert(attr(error,'y')-attr(label,'y')<=24,'the bound hangs from the bin callout');
        assert.match(error.getAttribute('class'),/\bsg-error\b/);
      }
    }
  }
});

test('scale granularity: sampled row ticks are correctly spaced codes, not a coarser quantizer',t=>{
  const f=fixture(t,NAME);f.load();f.open();const want=oracle(FIXTURE);
  for(const width of widths) {
    f.resize(width);
    for(const time of [20,40]) {
      f.seek(time);const {origin,unit,ruler}=frame(f),drawn=ticks(f.$('[data-grid-ticks]'));
      assert.deepEqual(drawn.map(tick=>tick.code),[-127,-96,-64,-32,0,32,64,96,127]);
      drawn.forEach((tick,j)=>{
        closePixel(tick.x,origin+unit*tick.code*want.rowScale);
        if(j)close(tick.x-drawn[j-1].x,(tick.code-drawn[j-1].code)*want.rowScale*unit,2*PIXEL_EPSILON);
      });
      assert(!visible(f.$('[data-grid-fading]')),'no half-faded tick survives into the still');
      const note=[...drawing(f).querySelectorAll('[data-resolution-line]')].filter(visible);
      assert.match(note.map(node=>node.textContent).join(' '),/^ticks(?: drawn)?: every 32nd code \+ endpoints$/);
      const first=drawn[0].x;
      for(const node of note) {
        assert.equal(node.getAttribute('text-anchor'),'end');
        assert(attr(node,'x')<=first-10,'the sampling note stops short of the first tick and its ray');
        assert(attr(node,'x')>attr(ruler,'x1'));
      }
    }
    assert.equal(Number(f.root.dataset.qmax),127);close(Number(f.root.dataset.rowScale),0.01/127);
  }
});

test('scale granularity: axis ticks sit at the round weights they print; bin edges are labelled as s/2',t=>{
  const f=fixture(t,NAME);f.load();f.open();const want=oracle(FIXTURE);
  for(const width of widths) {
    f.resize(width);
    for(const time of [0,12,20,40]) {
      f.seek(time);const {origin,unit}=frame(f);
      const marks=[...drawing(f).querySelectorAll('[data-axis-tick]')],labels=[...drawing(f).querySelectorAll('[data-axis-label]')];
      assert.deepEqual(marks.map(node=>Number(node.dataset.weight)),[-0.02,0,0.02]);
      assert.deepEqual(labels.map(node=>node.textContent),['−0.02','0','0.02']);
      marks.forEach((node,j)=>{
        const weight=Number(node.dataset.weight);
        closePixel(attr(node,'x1'),origin+unit*weight);closePixel(attr(node,'x2'),origin+unit*weight);
        // The printed label is the tick's own weight, to the digit: no 0.0197 called 0.02.
        assert.equal(Number(labels[j].textContent.replace('−','-')),weight);
        close(attr(labels[j],'x'),attr(node,'x1'));
      });
    }
    f.seek(12);const {origin,unit}=frame(f),edges=[...drawing(f).querySelectorAll('[data-bin-edge-label]')];
    assert.deepEqual(edges.map(node=>node.textContent),['−s/2','s/2']);
    edges.forEach((node,j)=>{assert(visible(node));closePixel(attr(node,'x'),origin+(j?1:-1)*want.globalHalfBin*unit);});
    assert.equal(f.$('[data-bin-label]').textContent,'shared zero bin: ±s/2 = ±0.03937');
    f.seek(20);for(const node of edges)assert(!visible(node),'the shared edges are gone once the bin is local');
  }
});

test('scale granularity: mapping rays follow the row\'s image; the endpoint marker only ever lands on its own code',t=>{
  const f=fixture(t,NAME);f.load();f.open();const want=oracle(FIXTURE);
  for(const width of widths) {
    f.resize(width);let previous;
    for(let time=0;time<=40+1e-9;time+=0.25) {
      f.seek(time);const {origin,unit,ry,qy}=frame(f);
      const half=Number(f.root.dataset.imageHalfWidth),interval=f.$('[data-active-interval]');
      assert(visible(interval),'the tracked interval never leaves the picture');
      assert(half>=0&&half<=FIXTURE.quietMax+1e-15);
      closePixel(attr(interval,'x1'),origin-half*unit);closePixel(attr(interval,'x2'),origin+half*unit);
      close(attr(interval,'y1'),ry);close(attr(interval,'y2'),ry);
      for(const node of drawing(f).querySelectorAll('[data-collapse-ray]')) {
        const sign=Number(node.dataset.collapseRay);assert.equal(visible(node),time>=10);
        closePixel(attr(node,'x1'),origin+sign*FIXTURE.quietMax*unit);close(attr(node,'y1'),qy+7);
        closePixel(attr(node,'x2'),origin+sign*half*unit);close(attr(node,'y2'),ry-5);
      }
      // Exact at the beats; monotone inside the two glides; untouched elsewhere.
      if(time<=12||time>=20)close(half,FIXTURE.quietMax);
      if(time>=15&&time<=17)assert.equal(half,0);
      if(previous!==undefined&&time>12&&time<=15)assert(half<=previous);
      if(previous!==undefined&&time>17&&time<=20)assert(half>=previous);
      const dot=f.$('[data-zero-point]');assert.equal(visible(dot),half<FIXTURE.quietMax*(1-1e-3));
      if(visible(dot)){close(attr(dot,'cx'),origin,PIXEL_EPSILON);close(attr(dot,'cy'),ry);assert(attr(dot,'r')<=4.5+PIXEL_EPSILON);}
      previous=half;
      const marker=f.$('[data-endpoint]'),position=numericTokens(marker.getAttribute('transform'));
      assert.match(marker.getAttribute('transform'),/^translate\([^)]*\)$/);
      assert.equal(marker.tagName.toLowerCase(),'polygon');assert.equal(numericTokens(marker.getAttribute('points')).length,8);
      assert.equal(visible(marker),time>22,`endpoint marker at ${time}`);
      // Wherever it is drawn, it is above code 127's own position: never on code 0.
      closePixel(position[0],origin+want.rowReconstruction*unit);
      assert(position[1]>=qy-PIXEL_EPSILON&&position[1]<=ry+PIXEL_EPSILON);
      if(time>=25)close(position[1],ry);
      if(time<25)assert(!visible(f.$('[data-witness-label]')),'the landing is named only once it has happened');
    }
    f.seek(40);const last=ticks(f.$('[data-grid-ticks]')).at(-1),landed=numericTokens(f.$('[data-endpoint]').getAttribute('transform'));
    assert.equal(last.code,127);closePixel(landed[0],last.x);
    assert.equal(f.$('[data-witness-code]').textContent,'code 127');assert.equal(f.$('[data-witness-label]').textContent,'= 0.01 exactly');
    for(const node of [f.$('[data-witness-code]'),f.$('[data-witness-label]')]) {
      assert.equal(node.getAttribute('text-anchor'),'start');assert(attr(node,'x')>=landed[0]+8,'the label sits beside the marker, not on it');
    }
  }
});

test('scale granularity: reduced motion never parks the maximum on code 0 of the local grid',t=>{
  const f=fixture(t,NAME,{reduced:true,width:713});f.load();f.open();const want=oracle(FIXTURE);
  for(const width of [713,296]) {
    f.resize(width);
    for(const time of [20,21,22.5,24.99]) {
      f.seek(time);const {origin,unit}=frame(f),interval=f.$('[data-active-interval]');
      assert(!visible(f.$('[data-endpoint]')),`no endpoint marker in the beat-4 still (${time}s)`);
      assert(!visible(f.$('[data-zero-point]')),'nothing is collapsed onto zero under the row scale');
      closePixel(attr(interval,'x1'),origin-FIXTURE.quietMax*unit);closePixel(attr(interval,'x2'),origin+FIXTURE.quietMax*unit);
      assert.deepEqual(ticks(f.$('[data-grid-ticks]')).map(tick=>tick.code),[-127,-96,-64,-32,0,32,64,96,127]);
      closePixel(attr(f.$('[data-zero-bin]'),'width'),2*want.rowHalfBin*unit);
      assert.equal(f.$('[data-scale-value]').textContent,'spacing s = 0.01/127 = 7.874 × 10⁻⁵');
      assert.match(f.$('[data-caption]').textContent,/own maximum sets the spacing.*spans the quiet range/);
    }
    // Each still is the finished picture its caption describes.
    f.seek(15);assert(visible(f.$('[data-zero-point]')));assert.equal(Number(f.root.dataset.imageHalfWidth),0);
    assert.equal(f.$('[data-collapse-label]').textContent,'all 256 weights → code 0');assert(visible(f.$('[data-collapse-label]')));
    f.seek(25);const {origin,unit,ry}=frame(f),landed=numericTokens(f.$('[data-endpoint]').getAttribute('transform'));
    assert(visible(f.$('[data-endpoint]')));closeTree(landed,[origin+FIXTURE.quietMax*unit,ry],PIXEL_EPSILON);
    assert(!visible(f.$('[data-bill]')),'the bill is not part of the error-bound still');
    f.seek(30);assert(visible(f.$('[data-bill]')));close(attr(f.$('[data-scales-bar]'),'width'),want.rowMetadataBytes*Number(f.root.dataset.bytePixels),PIXEL_EPSILON);
    assert.equal(f.$('[data-metadata-label]').textContent,'FP32 scales: 4 B → 256 B');
  }
});

test('scale granularity: the grid refines continuously around the fixed interval; nothing pops',t=>{
  const f=fixture(t,NAME);f.load();f.open();const want=oracle(FIXTURE);
  for(const width of [713,296]) {
    f.resize(width);let scale=Infinity,before=null,most=0;
    for(let step=0;step<=600;step++) {
      const time=17+step*0.005;f.seek(time);
      const {origin,unit,ruler}=frame(f),current=Number(f.root.dataset.currentScale);
      assert(step===0||step===600?current<=scale:current<scale,'the spacing only ever shrinks');scale=current;
      assert(current<=want.globalScale&&current>=want.rowScale);
      // The zero bin is true to the spacing at every instant, not only at the beats.
      closePixel(attr(f.$('[data-zero-bin]'),'width'),current*unit);closePixel(attr(f.$('[data-zero-bin]'),'x'),origin-current*unit/2);
      const full=ticks(f.$('[data-grid-ticks]')),fading=visible(f.$('[data-grid-fading]'))?ticks(f.$('[data-grid-fading]')):[];
      const ghost=opacity(f.$('[data-grid-fading]'));assert(ghost>=0&&ghost<=1);
      const drawn=new Map([...full.map(tick=>[tick.code,{x:tick.x,opacity:1}]),...fading.map(tick=>[tick.code,{x:tick.x,opacity:ghost}])]);
      assert.equal(drawn.size,full.length+fading.length,'no code is drawn twice');assert(drawn.has(0));
      for(const [code,tick] of drawn) {
        closePixel(tick.x,origin+code*current*unit);assert(drawn.has(-code),'the grid is symmetric');
        assert(Math.abs(code)<=want.qmax);assert(tick.x>=attr(ruler,'x1')-PIXEL_EPSILON&&tick.x<=attr(ruler,'x2')+PIXEL_EPSILON);
      }
      most=Math.max(most,full.length);
      if(before) {
        for(const code of new Set([...drawn.keys(),...before.drawn.keys()])) {
          const now=drawn.get(code),then=before.drawn.get(code);
          // A tick may enter only at a ruler end; anywhere else its ink changes gradually.
          const x=(now||then).x,entering=Math.min(x-attr(ruler,'x1'),attr(ruler,'x2')-x)<=(width>=520?9:4);
          if(!entering)assert(Math.abs((now?now.opacity:0)-(then?then.opacity:0))<=0.1,`code ${code} pops at ${time.toFixed(3)}s`);
          if(now&&then&&code)assert(Math.abs(now.x-origin)<Math.abs(then.x-before.origin)+PIXEL_EPSILON,'ticks flow inward');
        }
      }
      before={drawn,origin};
      // Text never interpolates: between the beats the header is the shared one or absent.
      const header=f.$('[data-scale-value]');
      assert.equal(header.textContent,time>=20?'spacing s = 0.01/127 = 7.874 × 10⁻⁵':'spacing s = 10/127 = 0.07874');
    }
    assert(most>=20,'ticks stream across the whole ruler before the stride thins them');
    close(scale,want.rowScale);
  }
});

test('scale granularity: one storage bar on one byte scale; the four-byte segment gets a locator, not a width',t=>{
  const f=fixture(t,NAME);f.load();f.open();const want=oracle(FIXTURE);
  for(const width of widths) {
    f.resize(width);
    for(const time of [0,20,26.9])  {f.seek(time);assert(!visible(f.$('[data-bill]')),`no bill at ${time}s`);}
    let last=0;
    for(const time of [27.7,28,28.5,29,29.5,30,35,40]) {
      f.seek(time);const {ruler}=frame(f),codes=f.$('[data-codes-bar]'),scales=f.$('[data-scales-bar]'),ring=f.$('[data-scales-locator]');
      assert(visible(codes)&&visible(scales));
      const perByte=attr(codes,'width')/want.payloadBytes;
      close(perByte,(attr(ruler,'x2')-attr(ruler,'x1'))/(want.payloadBytes+want.rowMetadataBytes),1e-7);
      closePixel(attr(codes,'x'),attr(ruler,'x1'));close(attr(scales,'x'),attr(codes,'x')+attr(codes,'width'),2*PIXEL_EPSILON);
      assert.equal(attr(scales,'y'),attr(codes,'y'));assert.equal(attr(scales,'height'),attr(codes,'height'));
      const drawnBytes=attr(scales,'width')/perByte;
      assert(drawnBytes>=want.globalMetadataBytes-1e-2&&drawnBytes<=want.rowMetadataBytes+1e-2);assert(drawnBytes>=last-1e-2,'metadata only grows');last=drawnBytes;
      if(time<=28) {
        close(drawnBytes,want.globalMetadataBytes,1e-2);assert(attr(scales,'width')<0.2,'four bytes stay sub-pixel: never inflated');
        assert(visible(ring));assert.equal(ring.getAttribute('class'),'sg-locator');
        close(attr(ring,'cx'),attr(scales,'x')+attr(scales,'width')/2,2*PIXEL_EPSILON);
        assert(attr(ring,'cy')-attr(ring,'r')>=attr(scales,'y')+attr(scales,'height'),'the locator sits off the bar, so it lends the segment no width');
      }
      if(time>=30) {
        close(drawnBytes,want.rowMetadataBytes,1e-2);close(attr(scales,'x')+attr(scales,'width'),attr(ruler,'x2'),3*PIXEL_EPSILON);
        assert(!visible(ring),'a segment wide enough to see needs no locator');assert(attr(scales,'width')>=2.5);
      }
      // Each number sits beside the mark it measures, and no byte count is interpolated.
      const payload=f.$('[data-payload-label]'),metadata=f.$('[data-metadata-label]');
      assert.equal(payload.textContent,time>=30?'8-bit codes: 16,384 B, unchanged':'8-bit codes: 16,384 B');
      assert.equal(metadata.textContent,time>=30?'FP32 scales: 4 B → 256 B':'FP32 scales: 4 B →');
      assert.equal(payload.getAttribute('text-anchor'),'start');closePixel(attr(payload,'x'),attr(codes,'x'));
      assert(attr(payload,'y')<attr(codes,'y')&&attr(payload,'y')>attr(codes,'y')-14);
      assert.equal(metadata.getAttribute('text-anchor'),'end');closePixel(attr(metadata,'x'),attr(ruler,'x2'));
      assert(attr(metadata,'y')>attr(codes,'y')+attr(codes,'height')&&attr(metadata,'y')<attr(codes,'y')+attr(codes,'height')+28);
    }
  }
});

test('scale granularity: the header is two lines, in ink only while it is the news; few numbers are loud at once',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  const style=f.d.createElement('style');style.textContent=read('scale-granularity/player.css');f.d.head.append(style);
  for(const width of [713,296]) {
    f.resize(width);
    for(const [index,beat] of [0,5,10,15,20,25,30,35].entries()) {
      f.seek(beat);assert.equal(drawing(f).querySelectorAll('[data-context]').length,0,'no bit-width and shape banner');
      const header=[f.$('[data-scale-source]'),f.$('[data-scale-value]')];
      for(const node of header) {
        assert.equal(visible(node),index>=1);
        assert.equal(/\bsg-muted\b/.test(node.getAttribute('class')),index!==1&&index!==4,`header emphasis at beat ${index}`);
      }
      assert.equal(header[0].textContent,index>=4?'this row: max |w| = 0.01':'loud row: max |w| = 10');
      const above=shownText(f).filter(node=>attr(node,'y')<Number(f.root.dataset.rangeY)-10);
      assert(above.length<=3,`at most two header lines and the row label above the picture, found ${above.length}`);
      const loud=shownText(f).filter(node=>!/\bsg-muted\b/.test(node.getAttribute('class')||'')&&/\d/.test(node.textContent));
      assert(loud.length<=8,`${loud.length} emphasised numbers at beat ${index}: ${loud.map(node=>node.textContent).join(' | ')}`);
      assert(shownText(f).length<=15,`${shownText(f).length} labels at beat ${index}`);
    }
  }
});

test('scale granularity: no hyphen-minus, e-notation or raw double reaches a reader or a screen reader',t=>{
  const spoken=f=>[...[...f.root.querySelectorAll('[data-pane] svg text')].map(node=>node.textContent),
    ...[...f.root.querySelectorAll('[data-pane] svg[aria-label]')].map(node=>node.getAttribute('aria-label')),
    f.$('[data-caption]').textContent,f.$('[data-controls] input[type=range]').getAttribute('aria-valuetext')||''];
  const clean=(text,where)=>{
    assert.doesNotMatch(text,/-\s*[\d.]|-s\b/,`hyphen-minus before a quantity ${where}: "${text}"`);
    assert.doesNotMatch(text,/\d[eE][-+−]?\d/,`e-notation ${where}: "${text}"`);
    assert.doesNotMatch(text,/\d\.\d{6,}/,`raw double ${where}: "${text}"`);
  };
  const script=fixture(t,NAME);for(const text of spoken(script))clean(text,'in the static print');
  assert.match(script.root.querySelector('[data-static-frame="narrow"]').textContent,/7\.874 × 10⁻⁵.*−0\.02.*3\.937 × 10⁻⁵/s);
  const f=fixture(t,NAME);f.load();f.open();
  for(const width of [713,296]) {
    f.resize(width);
    for(const time of [0,5,10,13.5,15,18.2,19.6,20,23,25,28.4,30,35,40]) {f.seek(time);for(const text of spoken(f))clean(text,`at ${time}s`);}
  }
  f.seek(40);const label=f.$('[data-figure] svg').getAttribute('aria-label');
  assert.match(label,/Row spacing 7\.874 × 10⁻⁵\./);assert.match(label,/bounded by 3\.937 × 10⁻⁵\./);assert.match(label,/16,384 bytes/);
  // A value is announced in one place: the scrubber names the state and carries no number.
  assert.doesNotMatch(f.$('[data-controls] input[type=range]').getAttribute('aria-valuetext').replace(/^\d+:\d\d of \d+:\d\d\. /,''),/\d/);
  assert.equal(f.$('[data-quiet-label]').textContent,'quiet row: −0.01 ≤ w ≤ 0.01');
  f.seek(7);assert.deepEqual([...drawing(f).querySelectorAll('[data-offscreen-code]')].filter(visible).map(node=>node.textContent),['← code −1','code 1 →']);
});

test('scale granularity: reveal order withholds the answer and never interpolates scale or byte arithmetic',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const time of [0,4.99,5,9.99,10,12.5,14.99,15,16.99,18.5,19.99,20,23.5,24.99,25,26.99,27.7,29.99,30,35,40]) {
    f.seek(time);const state=f.w.BookScaleGranularity.buildState(time);
    verifyState(state,FIXTURE);
    for(const [selector,start] of [['[data-grid-ticks]',5],['[data-zero-bin]',10],['[data-witness-code]',25],
      ['[data-witness-label]',25],['[data-error-label]',25],['[data-bill]',27],['[data-metadata-label]',27],['[data-payload-label]',27]])
      assert.equal(visible(f.$(selector)),time>=start,`${selector} at ${time}`);
    // The shared header and labels bow out while the grid refines; the local ones arrive on the beat.
    assert.equal(visible(f.$('[data-scale-value]')),(time>=5&&time<17.7)||time>=20,`header at ${time}`);
    assert.equal(visible(f.$('[data-collapse-label]')),time>=15&&time<17.7,`collapse label at ${time}`);
    assert.equal(visible(f.$('[data-offscreen-code]')),time>=5&&time<17.5,`off-ruler codes at ${time}`);
    assert.equal([...drawing(f).querySelectorAll('[data-resolution-line]')].some(visible),time>=20);
    assert(visible(f.$('[data-active-interval]')));
    const formula=f.$('[data-formula]');assert.equal(formula.classList.contains('sg-global-shown'),time>=5);
    assert.equal(formula.classList.contains('sg-row-shown'),time>=20);assert.equal(formula.classList.contains('sg-error-shown'),time>=25);
    const label=f.$('[data-figure] svg').getAttribute('aria-label');
    if(time<15)assert.doesNotMatch(label,/maps.*zero|erases/);
    if(time<5) {
      // The prediction shares the screen with no part of its answer.
      assert.doesNotMatch(label,/spacing|zero bin|bytes/i);
      assert.deepEqual(shownText(f).map(node=>node.textContent),['quiet row: −0.01 ≤ w ≤ 0.01','−0.02','0','0.02']);
    }
    for(const node of shownText(f))for(const value of numericTokens(node.textContent.replace(/−/g,'-').replace(/10⁻⁵/g,'').replace(/,/g,'')))
      assert([0,0.01,0.02,0.03937,0.07874,1,2,3.937,4,7.874,8,10,32,127,256,1000,16384].includes(Math.abs(value)),`undeclared number ${value} in "${node.textContent}" at ${time}s`);
  }
});

test('scale granularity: actual geometry is finite, subpixel serialized, and readable without slide shrinking',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  const style=f.d.createElement('style');style.textContent=read('scale-granularity/player.css');f.d.head.append(style);
  for(const width of widths) {
    f.resize(width);
    for(const time of [0,5,10,12.1234567,13.3333333,15,17.7654321,19.1234567,20,22.1234567,23.3333333,25,28.7654321,30,35,40]) {
      f.seek(time);const svg=f.$('[data-figure] svg'),box=numbers(svg.getAttribute('viewBox'));
      assert.equal(box[2],width);
      const state=f.w.BookScaleGranularity.buildState(time);
      for(const key of ['currentScale','currentBinHalf','imageHalfWidth','drawnScaleBytes'])
        assert.equal(Number(f.root.dataset[key]),state[key],'pixel serialization must not round model state');
      for(const key of ['globalScale','rowScale','rowErrorBound','scaleRatio'])assert.equal(Number(f.root.dataset[key]),state[key]);
      for(const node of shownText(f)) {
        assert(parseFloat(f.w.getComputedStyle(node).fontSize)>=12,`small label at ${width}px: ${node.textContent}`);
        assert(attr(node,'x')>=0&&attr(node,'x')<=width);assert(attr(node,'y')>=0&&attr(node,'y')<=box[3]);
      }
      for(const node of drawing(f).querySelectorAll('*'))for(const key of ['x','x1','x2','y','y1','y2','cx','cy','r','width','height']) {
        if(!node.hasAttribute(key))continue;
        const value=attr(node,key);assert(Number.isFinite(value));assert.equal(value,Number(value.toFixed(4)));
        if(visible(node))assert(value>=0&&value<=(key.startsWith('x')||key==='cx'||key==='width'?width:box[3]));
      }
      for(const node of drawing(f).querySelectorAll('[d],[transform]')) {
        // An empty path (no fading ticks) is a legitimate drawing state.
        const encoded=node.getAttribute('d')||node.getAttribute('transform')||'';
        for(const value of numericTokens(encoded))assert.equal(value,Number(value.toFixed(4)));
      }
      assert(drawing(f).querySelectorAll('*').length<100);
    }
  }
});

test('scale granularity: arbitrary seek and resize history reproduce the complete drawing state',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  const snapshot=()=>JSON.stringify({drawing:canonicalMarkup(f.$('[data-figure]').innerHTML),
    formula:canonicalMarkup(f.$('[data-formula]').outerHTML),caption:f.$('[data-caption]').innerHTML,
    state:Object.fromEntries(Object.entries(f.root.dataset).filter(([key])=>!['time','playing','typeset'].includes(key)))});
  const times=[0,5,10,12.1,13.7,15,17.3,18.9,20,22.1,23.7,25,27.2,28.9,30,35,40];
  const snapshots=times.map(time=>{f.seek(time);return snapshot();});
  f.play();f.tick(1111);f.resize(296);f.seek(18.4);f.seek(23.1);f.resize(713);
  assert.deepEqual(times.toReversed().map(time=>{f.seek(time);return snapshot();}),snapshots.toReversed());
});

test('scale granularity: generated wide and narrow fallback frames are the complete final explanation',async t=>{
  const generated=await staticFrame(NAME);assert.equal(generated.before,generated.after,'regenerate scale-granularity static frames');
  const f=fixture(t,NAME),narrow=f.$('[data-static-frame="narrow"]');assert(narrow);
  assert.equal(narrow.dataset.width,'296');const height=Number(narrow.dataset.height);
  const ids=[...f.root.querySelectorAll('[id]')].map(node=>node.id);assert.equal(ids.length,new Set(ids).size);
  for(const frame of [drawing(f),narrow]) {
    assert.match(frame.textContent,/256/);assert.match(frame.textContent,/16,?384/);
  }
  f.load();f.open();f.seek(40);f.resize(296);
  assert.equal(f.root.querySelectorAll('[data-static-frame="narrow"]').length,0);
  assert.equal(numbers(f.$('[data-figure] svg').getAttribute('viewBox'))[3],height);
});

test('scale granularity: the optional picture claims neither exact rows nor hardware speed',t=>{
  const f=fixture(t,NAME),boundary=f.$('.mechanism-boundary').textContent;
  assert.match(boundary,/endpoint|maximum.magnitude|max.magnitude/i);
  assert.match(boundary,/not.*(?:exact|every|all)|(?:other|arbitrary).*round/i);
  assert.match(boundary,/runtime|latency|speed|throughput/i);
  assert.match(boundary,/interval|not.*(?:sample|raw)|raw.*(?:unavailable|not)/i);
  f.load();f.open();assert.equal(f.root.querySelectorAll('input[type="range"]').length,1);
  const filter=fs.readFileSync(path.join(ROOT,scene.filter),'utf8');
  assert.match(filter,/^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
  assert.doesNotMatch(read('scale-granularity/player.js'),/Math\.random|fetch\(|import\(|setInterval\(/);
  assert.doesNotMatch(read('scale-granularity/panel.html'),/@eq-/);
});
