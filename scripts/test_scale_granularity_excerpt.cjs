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
const PIXEL_EPSILON=5.1e-10;
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

test('scale granularity: the same fixed ruler draws true global and subpixel local bin widths',t=>{
  const f=fixture(t,NAME);f.load();f.open();const want=oracle(FIXTURE);
  for(const width of widths) {
    f.resize(width);let fixedUnit;
    for(const time of [0,5,10,12.7,15,20,23.1,25,30,35,40]) {
      f.seek(time);const ruler=f.$('[data-ruler]'),origin=(attr(ruler,'x1')+attr(ruler,'x2'))/2;
      const viewHalfRange=want.globalHalfBin*1.15,unit=(attr(ruler,'x2')-attr(ruler,'x1'))/(2*viewHalfRange);
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

test('scale granularity: sampled row ticks are correctly spaced codes, not a coarser quantizer',t=>{
  const f=fixture(t,NAME);f.load();f.open();const want=oracle(FIXTURE);
  for(const width of widths) {
    f.resize(width);f.seek(20);
    const origin=Number(f.root.dataset.originX),unit=Number(f.root.dataset.pixelsPerUnit);
    const ticks=[...drawing(f).querySelectorAll('[data-row-tick]')].filter(visible);
    const codes=ticks.map(node=>Number(node.dataset.code));
    assert.deepEqual(codes,[-127,-96,-64,-32,0,32,64,96,127]);
    for(let j=0;j<ticks.length;j++) {
      const node=ticks[j],weight=codes[j]*want.rowScale;
      close(Number(node.dataset.weight),weight);closePixel(attr(node,'x1'),origin+unit*weight);
      closePixel(attr(node,'x2'),origin+unit*weight);
      if(j)close(attr(node,'x1')-attr(ticks[j-1],'x1'),(codes[j]-codes[j-1])*want.rowScale*unit,2*PIXEL_EPSILON);
    }
    assert.match(f.$('[data-resolution-label]').textContent,/(?:every 32 codes|32-code stride).*endpoints/);
    assert.equal(Number(f.root.dataset.qmax),127);close(Number(f.root.dataset.rowScale),0.01/127);
    for(const node of drawing(f).querySelectorAll('[data-axis-tick]')) {
      const weight=Number(node.dataset.weight);closePixel(attr(node,'x1'),origin+unit*weight);
    }
  }
});

test('scale granularity: mapping rays land on the interval and the actual maximum-magnitude marker',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  const smooth=t=>{const u=Math.max(0,Math.min(1,t));return u*u*(3-2*u);};
  for(const width of widths) {
    f.resize(width);
    for(const time of [10,12,12.75,13.5,14.25,15,20,22,22.75,23.5,24.25,25,40]) {
      f.seek(time);const state=f.w.BookScaleGranularity.buildState(time),unit=Number(f.root.dataset.pixelsPerUnit),origin=Number(f.root.dataset.originX);
      const ry=Number(f.root.dataset.rulerY),qy=Number(f.root.dataset.rangeY);
      const half=FIXTURE.quietMax*(1-smooth((time-12)/3)),endpoint=FIXTURE.quietMax*smooth((time-22)/3);
      close(state.currentIntervalHalfWidth,half);close(state.currentEndpoint,endpoint);
      const interval=f.$('[data-active-interval]');
      closePixel(attr(interval,'x1'),origin-half*unit);closePixel(attr(interval,'x2'),origin+half*unit);
      for(const node of drawing(f).querySelectorAll('[data-collapse-ray]')) {
        const sign=Number(node.dataset.collapseRay);
        closePixel(attr(node,'x1'),origin+sign*FIXTURE.quietMax*unit);close(attr(node,'y1'),qy+7);
        closePixel(attr(node,'x2'),origin+sign*half*unit);close(attr(node,'y2'),ry-5);
      }
      const marker=f.$('[data-endpoint]'),position=numericTokens(marker.getAttribute('transform'));
      assert.match(marker.getAttribute('transform'),/^translate\([^)]*\)$/);
      closeTree(position,[origin+endpoint*unit,ry],PIXEL_EPSILON);
      assert.equal(marker.tagName.toLowerCase(),'polygon');assert.equal(numericTokens(marker.getAttribute('points')).length,8);
      const ray=f.$('[data-endpoint-ray]');closePixel(attr(ray,'x1'),origin+FIXTURE.quietMax*unit);
      close(attr(ray,'y1'),qy+7);closePixel(attr(ray,'x2'),position[0]);close(attr(ray,'y2'),ry-7);
      if(time>22&&time<25)assert(!visible(f.$('[data-witness-label]')),'motion is not a new intermediate quantized endpoint');
    }
  }
});

test('scale granularity: reveal order withholds the answer and never interpolates scale or byte arithmetic',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const time of [0,4.99,5,9.99,10,12.5,14.99,15,19.99,20,23.5,24.99,25,29.99,30,35,40]) {
    f.seek(time);const state=f.w.BookScaleGranularity.buildState(time);
    verifyState(state,FIXTURE);
    for(const [selector,start] of [['[data-scale-value]',5],['[data-zero-bin]',10],['[data-endpoint]',20],
      ['[data-witness-label]',25],['[data-error-label]',25],['[data-metadata-label]',30],['[data-payload-label]',30]])
      assert.equal(visible(f.$(selector)),time>=start,`${selector} at ${time}`);
    assert.equal(visible(f.$('[data-active-interval]')),time<20);
    assert.equal(visible(f.$('[data-zero-point]')),time>=15&&time<20);
    const formula=f.$('[data-formula]');assert.equal(formula.classList.contains('sg-global-shown'),time>=5);
    assert.equal(formula.classList.contains('sg-row-shown'),time>=20);assert.equal(formula.classList.contains('sg-error-shown'),time>=25);
    if(time<15)assert.doesNotMatch(f.$('[data-figure] svg').getAttribute('aria-label'),/maps.*zero|erases/);
    if(time>=30) {
      assert.match(f.$('[data-metadata-label]').textContent,/FP32 scales: 4 B → 256 B/);
      assert.match(f.$('[data-payload-label]').textContent,/(?:code payload|codes) unchanged: 16,384 B/);
    }
  }
});

test('scale granularity: actual geometry is finite, subpixel serialized, and readable without slide shrinking',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  const style=f.d.createElement('style');style.textContent=read('scale-granularity/player.css');f.d.head.append(style);
  for(const width of widths) {
    f.resize(width);
    for(const time of [0,5,10,12.1234567,13.3333333,15,20,22.1234567,23.3333333,25,30,35,40]) {
      f.seek(time);const svg=f.$('[data-figure] svg'),box=numbers(svg.getAttribute('viewBox'));
      assert.equal(box[2],width);
      const state=f.w.BookScaleGranularity.buildState(time);
      for(const key of ['globalScale','rowScale','rowErrorBound','scaleRatio','currentEndpoint','currentIntervalHalfWidth'])
        assert.equal(Number(f.root.dataset[key]),state[key],'pixel serialization must not round model state');
      for(const node of [...drawing(f).querySelectorAll('text')].filter(visible)) {
        assert(parseFloat(f.w.getComputedStyle(node).fontSize)>=12,`small label at ${width}px: ${node.textContent}`);
        assert(attr(node,'x')>=0&&attr(node,'x')<=width);assert(attr(node,'y')>=0&&attr(node,'y')<=box[3]);
      }
      for(const node of drawing(f).querySelectorAll('*'))for(const key of ['x','x1','x2','y','y1','y2','cx','cy','width','height']) {
        if(!node.hasAttribute(key))continue;
        const value=attr(node,key);assert(Number.isFinite(value));assert.equal(value,Number(value.toFixed(9)));
        if(visible(node))assert(value>=0&&value<=(key.startsWith('x')||key==='width'?width:box[3]));
      }
      for(const node of drawing(f).querySelectorAll('[d],[transform]')) {
        const encoded=node.getAttribute('d')||node.getAttribute('transform');
        for(const value of numericTokens(encoded))assert.equal(value,Number(value.toFixed(9)));
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
  const times=[0,5,10,12.1,13.7,15,20,22.1,23.7,25,30,35,40];
  const snapshots=times.map(time=>{f.seek(time);return snapshot();});
  f.play();f.tick(1111);f.resize(296);f.seek(23.1);f.resize(713);
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
