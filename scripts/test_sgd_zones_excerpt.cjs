#!/usr/bin/env node
// Test-only arithmetic and DOM checks; no dependency enters the published book.
// The manuscript owns the decomposition, the unbiasedness statement, batch_size = 4 and
// the two zones; the twenty-point dataset, its batching, the walk and the drawing scales
// are declared schematic variants. These tests recompute every gradient from the declared
// points independently of the player, differentiate the batch losses numerically, and
// check the two claims the whole scene rests on: the five batch gradients average exactly
// to the full one, and their noise vectors are exactly the same at every parameter vector.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const {ROOT,read,entry,chapterSource,numbers,close,canonicalMarkup,
  fixture,registerTransportTests,registerBeatHoldTest,registerGrammarTests}=require('./html-tests/excerpt-harness.cjs');
const {staticFrame}=require('./render_static_frames.cjs');

const NAME='sgd-zones-excerpt', scene=entry(NAME);
const widths=[240,296,375,559,560,713,900];
const attr=(node,name)=>Number(node.getAttribute(name));
const drawing=f=>f.$('[data-drawing]');
const visible=node=>!node.closest('[hidden]')&&!node.hasAttribute('hidden');

// A printed number read back the way a reader reads it: U+2212 for minus, four decimals,
// or a mantissa times a power of ten in Unicode superscripts. Hyphen-minus, e-notation and
// raw doubles are not numbers this scene may print, so they fail here rather than parse.
const SUPERSCRIPT='⁰¹²³⁴⁵⁶⁷⁸⁹';
function shown(text) {
  const match=/^([+−]?)(\d+(?:\.\d+)?)(?: × 10(⁻?)([⁰¹²³⁴⁵⁶⁷⁸⁹]+))?$/.exec(text.trim());
  assert(match,`not a house-style number: "${text}"`);
  const exponent=match[4]?Number([...match[4]].map(digit=>SUPERSCRIPT.indexOf(digit)).join(''))*(match[3]?-1:1):0;
  return (match[1]==='−'?-1:1)*Number(match[2])*10**exponent;
}
// Hyphen-minus before a digit, or a mantissa followed by e and an exponent.
const ASCII_MATH=/(?:^|[^\w])-\s?\d|\d(?:\.\d+)?e[-+]?\d/i;

// --- A second implementation of the scene's arithmetic --------------------------------
const mean=values=>values.reduce((total,value)=>total+value,0)/values.length;
function declared(f) {
  const xs=numbers(f.root.dataset.xs), flat=numbers(f.root.dataset.residuals);
  const size=Number(f.root.dataset.batch);
  const [lineW,lineB]=numbers(f.root.dataset.line);
  const residuals=Array.from({length:flat.length/size},(_,k)=>flat.slice(k*size,(k+1)*size));
  const ys=residuals.map(row=>row.map((r,j)=>lineW*xs[j]+lineB+r));
  const allX=[],allY=[];
  ys.forEach(row=>row.forEach((y,j)=>{allX.push(xs[j]); allY.push(y);}));
  return {xs,size,residuals,ys,allX,allY,lineW,lineB,
    start:numbers(f.root.dataset.start),rate:Number(f.root.dataset.rate),
    steps:Number(f.root.dataset.steps),order:numbers(f.root.dataset.order),
    window:numbers(f.root.dataset.window),kappa:Number(f.root.dataset.arrow),
    span:Number(f.root.dataset.span)};
}
// The mean-squared-error gradient the chapter differentiates, written out again here.
const gradient=(w,b,px,py)=>{
  const err=px.map((x,i)=>w*x+b-py[i]);
  return [2*mean(err.map((e,i)=>e*px[i])),2*mean(err)];
};
const lossOf=(px,py)=>(w,b)=>mean(px.map((x,i)=>(w*x+b-py[i])**2));
const full=(fx,w,b)=>gradient(w,b,fx.allX,fx.allY);
const batch=(fx,w,b,k)=>gradient(w,b,fx.xs,fx.ys[k]);
const noiseAt=(fx,w,b)=>{
  const g=full(fx,w,b);
  return fx.ys.map((_,k)=>{const gb=batch(fx,w,b,k); return [gb[0]-g[0],gb[1]-g[1]];});
};
function chapterWalk(fx) {
  let [w,b]=fx.start;
  const points=[[w,b]];
  for (let t=0;t<fx.steps;t++) {
    const gb=batch(fx,w,b,fx.order[t]);
    w-=fx.rate*gb[0]; b-=fx.rate*gb[1]; points.push([w,b]);
  }
  return points;
}
// The five signed angles of the batch directions about the full descent direction.
function spread(fx,w,b) {
  const g=full(fx,w,b), size=Math.hypot(...g), u=[-g[0]/size,-g[1]/size];
  return fx.ys.map((_,k)=>{
    const gb=batch(fx,w,b,k), d=[-gb[0],-gb[1]];
    return Math.atan2(u[0]*d[1]-u[1]*d[0],d[0]*u[0]+d[1]*u[1])*180/Math.PI;
  });
}
// A handful of parameter vectors spread over and beyond the declared window.
const PROBES=[[-1.1,0.6],[-2,1.5],[-2.48,1.98],[-0.62,0.12],[0.4,3.2],[-5,-2]];

// A drawn text's box, estimated: JSDOM lays nothing out, so a conservative advance width
// per character stands in for a measurement. Overlap or an edge crossing here is a real
// collision at the real font, because the estimate is generous.
function textBox(node) {
  const size=Number(node.getAttribute('font-size')||12), text=(node.textContent||'').trim();
  const width=text.length*size*0.56, anchor=node.getAttribute('text-anchor')||'start';
  const x=attr(node,'x'), y=attr(node,'y');
  const left=anchor==='middle'?x-width/2:anchor==='end'?x-width:x;
  return {left,right:left+width,top:y-size*0.8,bottom:y+size*0.3,text};
}
const overlaps=(a,b)=>a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;
const points=node=>[...node.getAttribute('d').matchAll(/[ML] (-?[\d.]+) (-?[\d.]+)/g)]
  .map(m=>[Number(m[1]),Number(m[2])]);

registerTransportTests(NAME,{witness:/÷ 22/,anchors:['sgd-zones-playback-help'],width:713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('sgd zones: the mechanism it draws is the chapter\'s own printed passage', t => {
  const f=fixture(t,NAME), fx=declared(f), chapter=chapterSource(NAME);
  assert.equal(fx.size,4);
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal),literal);
  // Every literal this panel mirrors, in the exact form the manifest should name.
  for (const literal of [
    'batch_size = 4',
    'batches = torch.randperm(len(x1)).reshape(-1, batch_size)',
    '\\nabla\\loss_{\\mathcal B}(\\vect{w})\n= \\nabla\\loss(\\vect{w}) + \\vect{\\xi}_{\\mathcal B},\n\\qquad\n\\E[\\vect{\\xi}_{\\mathcal B}]=\\vect{0}.',
    '\\E\\bigl[\\nabla \\loss_{\\mathcal{B}}(\\vect{w})\\bigr] = \\nabla \\loss(\\vect{w}).',
    'Each estimate is noisy; its average direction is right.',
    'Far from the optimum, the full gradient is large relative to the batch noise, so most\nbatch directions make useful progress and their mean is the full descent direction.',
    'Near the optimum, the full gradient shrinks while batches can still disagree ("go\nleft" — "go right"). A finite learning rate then makes the iterate bounce in what we\nwill call the **region of confusion**:',
    '    assert torch.allclose(directions.mean(0), full_direction, atol=2e-6)',
    '1. Shuffle the training data.',
    'think 32 examples against a million',
    // The seed is what makes the figure's own eighty points unreproducible here.
    'torch.manual_seed(6050)','x1 = torch.randn(80)'])
    assert(chapter.includes(literal),literal);
  assert.equal(scene.qmd,'chapters/part1/04-training-loss-sgd.qmd');
  assert.equal(scene.anchor.type,'before-heading');
  assert.equal(scene.anchor.target,'The learning rate');
  assert(chapter.includes(`## ${scene.anchor.target}`));
  assert.deepEqual(scene.beats,[0,5,10,15,20,25,30,35]); assert.equal(scene.duration,40);
  const filter=fs.readFileSync(path.join(ROOT,scene.filter),'utf8');
  assert.match(filter,/^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
});

test('sgd zones: the declared dataset is five equal batches whose optimum is the declared line', t => {
  const f=fixture(t,NAME), fx=declared(f);
  assert.equal(fx.residuals.length,5,'five batches, as the walk\'s epochs assume');
  fx.residuals.forEach(row=>assert.equal(row.length,fx.size,'every batch has batch_size points'));
  assert.equal(fx.allX.length,20);
  // Every batch carries the same four x levels, which is what makes the noise exact.
  fx.ys.forEach((row,k)=>row.forEach((y,j)=>close(y-(fx.lineW*fx.xs[j]+fx.lineB),fx.residuals[k][j],1e-12)));
  fx.xs.forEach((x,i)=>assert(fx.xs.slice(i+1).every(other=>other!==x),'x levels are distinct'));
  // Residuals that sum to zero, unweighted and x-weighted, put the empirical optimum
  // exactly on the declared line rather than near it.
  close(fx.residuals.flat().reduce((s,r)=>s+r,0),0,1e-12);
  close(fx.residuals.reduce((s,row)=>s+row.reduce((t,r,j)=>t+r*fx.xs[j],0),0),0,1e-12);
  fx.residuals.flat().forEach(r=>assert(Math.abs(r)<0.6,'the declared spread stays beside the line'));
  const g=full(fx,fx.lineW,fx.lineB);
  close(g[0],0,1e-12); close(g[1],0,1e-12);
  f.load(); f.open();
  assert.deepEqual(JSON.parse(f.root.dataset.optimum),[fx.lineW,fx.lineB]);
  // A genuine bowl: positive definite Hessian, so "downhill" means something.
  const m1=mean(fx.allX), m2=mean(fx.allX.map(x=>x*x));
  assert(m2-m1*m1>0.2,`variance ${m2-m1*m1} leaves the bowl too narrow to draw`);
  for (const lambda of [m2+1+Math.hypot(m2-1,2*m1),m2+1-Math.hypot(m2-1,2*m1)].map(v=>v/2)) {
    const factor=1-fx.rate*2*lambda;
    assert(Math.abs(factor)<1,`rate ${fx.rate} gives contraction ${factor}`);
  }
});

test('sgd zones: the minibatch gradient is unbiased at every parameter vector, exactly', t => {
  const f=fixture(t,NAME), fx=declared(f);
  for (const [w,b] of PROBES) {
    const g=full(fx,w,b);
    const average=[mean(fx.ys.map((_,k)=>batch(fx,w,b,k)[0])),mean(fx.ys.map((_,k)=>batch(fx,w,b,k)[1]))];
    // The chapter's own assertion, at a far tighter tolerance than its 2e-6.
    close(average[0],g[0],1e-12); close(average[1],g[1],1e-12);
    // And a second route to each batch gradient: central differences of its own loss.
    const h=1e-5;
    fx.ys.forEach((yv,k)=>{
      const loss=lossOf(fx.xs,yv), gb=batch(fx,w,b,k);
      close((loss(w+h,b)-loss(w-h,b))/(2*h),gb[0],2e-6);
      close((loss(w,b+h)-loss(w,b-h))/(2*h),gb[1],2e-6);
    });
  }
});

test('sgd zones: the noise vectors are the same at every parameter vector and sum to zero', t => {
  const f=fixture(t,NAME), fx=declared(f); f.load(); f.open();
  const reference=noiseAt(fx,...PROBES[0]);
  for (const [w,b] of PROBES) {
    const here=noiseAt(fx,w,b);
    here.forEach((v,k)=>{close(v[0],reference[k][0],1e-12); close(v[1],reference[k][1],1e-12);});
  }
  close(reference.reduce((s,v)=>s+v[0],0),0,1e-12);
  close(reference.reduce((s,v)=>s+v[1],0),0,1e-12);
  const published=JSON.parse(f.root.dataset.xi);
  published.forEach((v,k)=>{close(v[0],reference[k][0],1e-9); close(v[1],reference[k][1],1e-9);});
  // The witnesses the picture and the receipt print.
  const floor=Math.sqrt(mean(reference.map(v=>v[0]*v[0]+v[1]*v[1])));
  close(floor,0.556066542780628,1e-12);
  close(Number(f.root.dataset.noiseFloor),floor,1e-12);
  close(Math.hypot(...full(fx,...fx.start)),2.881405906844782,1e-12);
  // Signal five times the noise at the start, and the five directions all within a right
  // angle of the true one: the far zone is a claim this fixture actually satisfies.
  const far=spread(fx,...fx.start);
  assert(Math.max(...far.map(Math.abs))<15,`fan half-angle ${Math.max(...far.map(Math.abs))} is not a narrow fan`);
  assert.equal(Math.max(...far.map(Math.abs)).toFixed(2),'10.19');
  // At the optimum the full gradient is zero, so every batch direction is its own noise:
  // the five point into four different quadrants, which is the other zone.
  const here=spread(fx,fx.lineW+1e-12,fx.lineB);
  const quadrants=new Set(noiseAt(fx,fx.lineW,fx.lineB).map(v=>`${v[0]>0}${v[1]>0}`));
  assert(quadrants.size>=3,'the batch directions at the optimum do not disagree');
  assert(Math.max(...here.map(Math.abs))>90,'no batch points away from the vanished descent direction');
});

test('sgd zones: the walk is the declared loop, rerun independently, and never settles', t => {
  const f=fixture(t,NAME), fx=declared(f); f.load(); f.open();
  assert.equal(fx.order.length,fx.steps);
  // Every epoch uses each batch exactly once, as the chapter's step 3 prescribes.
  for (let e=0;e*5<fx.order.length;e++)
    assert.deepEqual([...fx.order.slice(e*5,e*5+5)].sort(),[0,1,2,3,4],`epoch ${e} is not a permutation`);
  const want=chapterWalk(fx), got=JSON.parse(f.root.dataset.path);
  assert.equal(got.length,fx.steps+1);
  got.forEach((point,k)=>{close(point[0],want[k][0],1e-9); close(point[1],want[k][1],1e-9);});
  assert.deepEqual(JSON.parse(f.root.dataset.batchOrder),fx.order);
  const floor=Number(f.root.dataset.noiseFloor);
  const signal=want.map(([w,b])=>Math.hypot(...full(fx,w,b)));
  assert(signal[0]>5*floor,'the walk does not start in the signal-dominated zone');
  const entered=signal.findIndex(value=>value<floor);
  assert(entered>0&&entered<fx.steps/2,`the signal crosses the floor at step ${entered}`);
  // Never settling: after it arrives, the distance to the optimum stays off zero and keeps
  // going both up and down. A monotone tail would be convergence, not milling.
  const tail=want.slice(entered+2).map(([w,b])=>Math.hypot(w-fx.lineW,b-fx.lineB));
  assert(tail.length>10);
  assert(Math.min(...tail)>0.005,'the iterate reaches the optimum, so nothing mills');
  assert(tail.some((d,i)=>i&&d>tail[i-1])&&tail.some((d,i)=>i&&d<tail[i-1]),'the tail is monotone');
  // And it stays inside the region the scene draws.
  const ellipse=Number(f.root.dataset.noiseFloor)/2;
  assert(Math.max(...tail)<ellipse*1.35,'the milling leaves the region the picture shades');
  // Every step is exactly minus the rate times one batch gradient, and only one.
  for (let k=0;k<fx.steps;k++) {
    const gb=batch(fx,want[k][0],want[k][1],fx.order[k]);
    close(want[k+1][0]-want[k][0],-fx.rate*gb[0],1e-12);
    close(want[k+1][1]-want[k][1],-fx.rate*gb[1],1e-12);
  }
});

test('sgd zones: the drawn tips are one rigid shape riding on the full arrow\'s head', t => {
  const f=fixture(t,NAME,{width:713}), fx=declared(f); f.load(); f.open();
  const unit=Number(f.root.dataset.unit);
  const edgesAt=time=>{
    f.seek(time);
    const tips=[...drawing(f).querySelectorAll('[data-tip]')].map(node=>[attr(node,'cx'),attr(node,'cy')]);
    assert.equal(tips.length,5);
    const head=points(f.$('[data-mean-arrow]'))[1];
    // Each tip is the full arrow's head displaced by the drawn noise vector, so the
    // offsets are the fixture's own xi at the drawing scale.
    const offsets=tips.map(tip=>[(tip[0]-head[0])/unit/fx.kappa,(tip[1]-head[1])/unit/fx.kappa]);
    return {head,offsets,centroid:[mean(tips.map(p=>p[0])),mean(tips.map(p=>p[1]))]};
  };
  const xi=noiseAt(fx,...fx.start);
  const reference=edgesAt(12);
  for (const time of [12,14.9,18,23,28,33,39.9,40]) {
    const now=edgesAt(time);
    now.offsets.forEach((offset,k)=>{
      // Screen y grows downward, so a positive xi in b draws as a negative offset.
      close(offset[0],-xi[k][0],2e-3); close(offset[1],xi[k][1],2e-3);
      close(offset[0],reference.offsets[k][0],2e-3);
      close(offset[1],reference.offsets[k][1],2e-3);
    });
    // Unbiasedness on the picture: the tips' centroid is the full arrow's own head.
    close(now.centroid[0],now.head[0],1e-3); close(now.centroid[1],now.head[1],1e-3);
  }
  // The full arrow really is the declared magnification of the full gradient.
  for (const time of [3,12,22,33,39.9]) {
    f.seek(time);
    const iterate=Number(f.root.dataset.walk)>=0;
    assert(iterate);
    const [tail,head]=points(f.$('[data-mean-arrow]'));
    close(Math.hypot(head[0]-tail[0],head[1]-tail[1])/unit/fx.kappa,Number(f.root.dataset.signal),3e-3);
  }
});

test('sgd zones: the ruler moves one mark and never the other', t => {
  for (const width of [375,713]) {
    const f=fixture(t,NAME,{width}); f.load(); f.open();
    const zero=Number(f.root.dataset.rulerZero), scale=Number(f.root.dataset.rulerScale);
    const noiseX=[], signalX=[];
    for (let time=0;time<=scene.duration;time+=0.5) {
      f.seek(Number(time.toFixed(2)));
      const mark=points(f.$('[data-signal-mark]'));
      signalX.push(mean(mark.map(p=>p[0])));
      noiseX.push(attr(f.$('[data-noise-mark]'),'x1'));
      close(mean(mark.map(p=>p[0])),zero+Number(f.root.dataset.signal)*scale,1e-3);
    }
    noiseX.forEach(x=>close(x,noiseX[0],0));
    close(noiseX[0],zero+Number(f.root.dataset.noiseFloor)*scale,1e-3);
    assert(signalX[0]>noiseX[0],'the signal does not start above the floor');
    assert(signalX.at(-1)<noiseX[0],'the signal does not end below the floor');
    assert(signalX[0]-signalX.at(-1)>0.4*(signalX[0]-zero),'the signal mark barely moves');
    // Every printed size on the ruler is the quantity its mark stands on.
    f.seek(scene.duration);
    close(shown(f.$('[data-value="signal"]').textContent.replace('signal ‖∇L‖ ','')),
      Number(Number(f.root.dataset.signal).toFixed(4)),0);
    close(shown(f.$('[data-value="noise"]').textContent.replace('noise ‖ξ‖ ','')),
      Number(Number(f.root.dataset.noiseFloor).toFixed(4)),0);
    assert.equal(f.$('[data-value="ratio"]').textContent,
      `÷ ${Math.round(2.881405906844782/Number(f.root.dataset.signal))}`);
  }
});

test('sgd zones: the answer is withheld until the walk has played', t => {
  const f=fixture(t,NAME); f.load(); f.open();
  const spoiler=/\b(?:confus\w*|disagree\w*|every direction|opposite|bounce|mill\w*|useless)\b/i;
  for (const time of [0,2,4.99,5,9.99,12,14.99,15,17,19.99]) {
    f.seek(time);
    assert.equal(f.root.dataset.revealed,'false',`revealed at ${time}s`);
    assert(!visible(f.$('[data-confusion]')),`the region is drawn at ${time}s`);
    assert.equal(Number(f.root.dataset.confusion),0,`the region is fading in at ${time}s`);
    assert(!visible(f.$('[data-ghost]')),`the start ghost is exposed at ${time}s`);
    assert.equal(f.$('[data-value="ratio"]').textContent,'·');
    // Up to the moment beat 3 poses its prediction the signal still dominates: the far
    // zone is never contradicted before the walk begins. Between 15s and 20s the mark
    // crosses the floor in plain sight, which is the operation the next caption names.
    if (time<=15) assert(Number(f.root.dataset.snr)>1,`the signal is already under the floor at ${time}s`);
    const accessible=[f.$('[data-caption]').textContent,
      f.$('[data-figure] svg').getAttribute('aria-label'),
      f.$('[data-controls] input[type="range"]').getAttribute('aria-valuetext'),
      [...drawing(f).querySelectorAll('text')].filter(visible).map(node=>node.textContent).join(' ')].join(' ');
    assert.doesNotMatch(accessible,spoiler,`a prediction prompt announces its answer at ${time}s`);
  }
  f.seek(20); assert.equal(f.root.dataset.revealed,'true');
  f.seek(25); assert(visible(f.$('[data-confusion]')));
  assert.match(f.$('[data-confusion-label]').textContent,/region of confusion/);
});

test('sgd zones: each beat reveals exactly what its caption describes', t => {
  const f=fixture(t,NAME,{reduced:true}); f.load(); f.open();
  const state=time=>{
    f.seek(time);
    return {stage:Number(f.root.dataset.stage),walk:Number(f.root.dataset.walk),
      fan:[...drawing(f).querySelectorAll('[data-batch-arrow]')].filter(visible).length,
      tips:[...drawing(f).querySelectorAll('[data-tip]')].filter(visible).length,
      outline:visible(f.$('[data-outline]')),legs:visible(f.$('[data-noise]')),
      centre:visible(f.$('[data-centre]')),noise:visible(f.$('[data-noise-mark]')),
      confusion:Number(f.root.dataset.confusion),ghost:visible(f.$('[data-ghost]')),
      trail:visible(f.$('[data-trail]'))};
  };
  const want=[
    {stage:0,walk:0,fan:0,tips:0,outline:false,legs:false,centre:false,noise:false,confusion:0,ghost:false,trail:false},
    {stage:1,walk:0,fan:5,tips:5,outline:false,legs:false,centre:false,noise:false,confusion:0,ghost:false,trail:false},
    {stage:2,walk:0,fan:5,tips:5,outline:true,legs:true,centre:true,noise:true,confusion:0,ghost:false,trail:false},
    {stage:3,walk:6.25,fan:5,tips:5,outline:true,legs:false,centre:true,noise:true,confusion:0,ghost:false,trail:true},
    {stage:4,walk:11.625,fan:5,tips:5,outline:true,legs:false,centre:true,noise:true,confusion:0,ghost:false,trail:true},
    {stage:5,walk:18.75,fan:5,tips:5,outline:true,legs:false,centre:true,noise:true,confusion:1,ghost:false,trail:true},
    {stage:6,walk:25,fan:5,tips:5,outline:true,legs:false,centre:true,noise:true,confusion:1,ghost:false,trail:true},
    {stage:7,walk:25,fan:5,tips:5,outline:true,legs:false,centre:true,noise:true,confusion:1,ghost:true,trail:true}
  ];
  scene.beats.forEach((beat,index)=>assert.deepEqual(state(beat),want[index],`beat ${index} at ${beat}s`));
  // The region belongs to the reader, never to the iterate: nothing of it before its beat.
  for (const time of [0,10,20,24.3]) {f.seek(time); assert.equal(Number(f.root.dataset.confusion),0);}
  // And in ordinary motion the glide runs entirely inside the 0.6 s before the beat.
  const live=fixture(t,NAME); live.load(); live.open();
  live.seek(24.39); assert.equal(Number(live.root.dataset.confusion),0);
  live.seek(24.7); close(Number(live.root.dataset.confusion),0.5,1e-9);
  live.seek(25); assert.equal(Number(live.root.dataset.confusion),1);
});

test('sgd zones: every printed number is house style and every mark stays inside the picture', t => {
  for (const width of widths) {
    const f=fixture(t,NAME,{width}); f.load(); f.open();
    const [,,boxW,boxH]=f.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/).map(Number);
    for (const time of [0,5,10,15,20,25,30,35,39.9,scene.duration]) {
      f.seek(time);
      const texts=[...drawing(f).querySelectorAll('text')].filter(visible);
      const boxes=texts.map(textBox);
      boxes.forEach((box,i)=>{
        assert(box.left>=-0.5&&box.right<=boxW+0.5&&box.top>=-0.5&&box.bottom<=boxH+0.5,
          `"${box.text}" leaves the ${width}px picture at ${time}s: ${JSON.stringify(box)}`);
        boxes.slice(i+1).forEach(other=>assert(!overlaps(box,other),
          `"${box.text}" and "${other.text}" collide at ${width}px, ${time}s`));
      });
      for (const node of drawing(f).querySelectorAll('[data-value]')) {
        const text=node.textContent.trim();
        if (text==='·') {assert(!visible(node),'a withheld number is not drawn'); continue;}
        shown(text.replace(/^(?:signal ‖∇L‖|noise ‖ξ‖|÷) ?/,''));
      }
      const wording=[...texts.map(node=>node.textContent),f.$('[data-caption]').textContent,
        f.$('[data-figure] svg').getAttribute('aria-label'),
        f.$('[data-controls] input[type="range"]').getAttribute('aria-valuetext')];
      for (const text of wording) assert.doesNotMatch(text,ASCII_MATH,`ASCII arithmetic in "${text}"`);
      // Nothing that claims to be in parameter space is drawn outside the plane.
      const left=Number(f.root.dataset.plotLeft), right=Number(f.root.dataset.plotRight);
      const top=Number(f.root.dataset.plotTop), bottom=Number(f.root.dataset.plotBottom);
      for (const tip of [...drawing(f).querySelectorAll('[data-tip]')].filter(visible)) {
        assert(attr(tip,'cx')>=left-1&&attr(tip,'cx')<=right+1,`an arrow tip leaves the plane at ${time}s`);
        assert(attr(tip,'cy')>=top-1&&attr(tip,'cy')<=bottom+1,`an arrow tip leaves the plane at ${time}s`);
      }
      for (const [x,y] of points(f.$('[data-iterate]'))) {
        assert(x>=left-6&&x<=right+6&&y>=top-6&&y<=bottom+6,`the iterate leaves the plane at ${time}s`);
      }
    }
  }
});

test('sgd zones: the layout reflows once and the picture keeps equal scale on both axes', t => {
  for (const width of widths) {
    const f=fixture(t,NAME,{width}); f.load(); f.open(); f.seek(scene.duration);
    const fx=declared(f);
    assert.equal(f.root.dataset.layout,width<560?'narrow':'wide',`${width}px`);
    const [,,boxW,boxH]=f.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/).map(Number);
    assert.deepEqual([boxW,boxH],width<560?[296,380]:[713,545]);
    const unit=Number(f.root.dataset.unit);
    const left=Number(f.root.dataset.plotLeft), right=Number(f.root.dataset.plotRight);
    const top=Number(f.root.dataset.plotTop), bottom=Number(f.root.dataset.plotBottom);
    // One pixel per parameter unit in both directions, which is what makes an angle
    // between two drawn arrows the angle between the two gradients.
    close((right-left)/(fx.window[1]-fx.window[0]),unit,1e-9);
    close((bottom-top)/(fx.window[3]-fx.window[2]),unit,1e-9);
  }
  // Resizing a live player rebuilds the same picture the fresh render gives.
  const wide=fixture(t,NAME,{width:713}); wide.load(); wide.open(); wide.seek(24.375);
  wide.resize(375); wide.resize(713);
  const fresh=fixture(t,NAME,{width:713}); fresh.load(); fresh.open(); fresh.seek(24.375);
  assert.equal(canonicalMarkup(wide.$('[data-figure]').innerHTML),
    canonicalMarkup(fresh.$('[data-figure]').innerHTML));
});

test('sgd zones: seeking reconstructs the whole published state, not just the drawing', t => {
  const f=fixture(t,NAME); f.load(); f.open();
  const snapshot=()=>({markup:canonicalMarkup(f.$('[data-pane]').innerHTML.replace(/aria-valuetext="[^"]*"/g,'')),
    state:JSON.stringify(f.root.dataset)});
  const probes=[0,4.4,9.9,12.5,17.25,21.6,26.75,31.4,36.5,39.9,scene.duration];
  const first=probes.map(time=>{f.seek(time); return snapshot();});
  f.play(); f.tick(6000); f.seek(3); f.play(); f.tick(2000);
  probes.forEach((time,index)=>{f.seek(time); assert.deepEqual(snapshot(),first[index],`replay differs at ${time}s`);});
  [...probes].reverse().forEach(time=>{
    const index=probes.indexOf(time);
    f.seek(time); assert.deepEqual(snapshot(),first[index],`reverse seek differs at ${time}s`);
  });
});

test('sgd zones: the committed static fallback is a fresh render of the final frame', async t => {
  const generated=await staticFrame(NAME);
  assert.equal(generated.before,generated.after,
    'interactives/sgd-zones/panel.html is stale: run scripts/render_static_frames.cjs sgd-zones');
  const panel=read('sgd-zones/panel.html');
  assert(panel.includes('<g data-static-frame="narrow"'),'a reflowing scene ships a narrow print');
  assert(/preserveAspectRatio="xMinYMin meet"/.test(panel));
  const narrow=/<g data-static-frame="narrow"[\s\S]*?<\/g>\s*<!-- \/static-frame-narrow -->/.exec(panel)[0];
  // Geometry is serialised at four decimals, as the contract requires.
  for (const [,value] of narrow.matchAll(/ (?:cx|cy|x1|y1|x2|y2|width|height)="(-?\d+\.\d+)"/g))
    assert(value.split('.')[1].length<=4,`${value} is serialised past 0.0001 px`);
  for (const [,value] of narrow.matchAll(/ d="([^"]*)"/g))
    for (const [,number] of value.matchAll(/(-?\d+\.\d+)/g))
      assert(number.split('.')[1].length<=4,`${number} is serialised past 0.0001 px`);
});

test('sgd zones: the panel names its schematic variants and its boundary', t => {
  const f=fixture(t,NAME);
  const boundary=f.$('.mechanism-boundary').textContent;
  assert.match(boundary,/unbiased, never a worse gradient/);
  assert.match(boundary,/the noise does not grow, the signal vanishes/);
  assert.match(boundary,/schematic/);
  assert.match(boundary,/never printed/);
  assert.match(boundary,/region of confusion is about the gradient estimate/);
  assert.match(boundary,/not about the loss/);
  assert.match(boundary,/rigidity is a property of this declared partition/);
  assert.match(boundary,/declared magnification/);
  assert.match(boundary,/deterministic list/);
  assert.match(boundary,/belongs to the next section/);
  assert.match(boundary,/Nothing is trained/);
  // One visible sentence; every further qualifier inside the closed scope disclosure.
  const scope=f.$('.mechanism-scope');
  assert.equal(scope.open,false);
  const lead=[...f.$('.mechanism-boundary').children].filter(node=>node.tagName==='P');
  assert.equal(lead.length,1,'the boundary shows exactly one sentence outside the disclosure');
  assert(lead[0].textContent.trim().split(/\s+/).length<=34);
  const check=f.$('.mechanism-check');
  assert.equal(check.open,false);
  assert(check.querySelector('summary').textContent.replace('Check yourself.','').trim().split(/\s+/).length<=40);
  assert(check.querySelector('p').textContent.trim().split(/\s+/).length<=70);
  assert.doesNotMatch(check.textContent,ASCII_MATH);
  // The transfer answer's numbers, recomputed from the declared fixture.
  const fx=declared(f);
  const twice=[fx.lineW+2*(fx.start[0]-fx.lineW),fx.lineB+2*(fx.start[1]-fx.lineB)];
  close(Math.hypot(...full(fx,...twice)),2*Math.hypot(...full(fx,...fx.start)),1e-12);
  const widest=values=>Math.max(...values.map(Math.abs));
  const answer=check.querySelector('p').textContent;
  assert(answer.includes(widest(spread(fx,...twice)).toFixed(2)),`5.39 degrees: ${widest(spread(fx,...twice))}`);
  assert(answer.includes(widest(spread(fx,...fx.start)).toFixed(2)));
  assert(answer.includes(Math.hypot(...full(fx,...fx.start)).toFixed(4)));
  assert(answer.includes(Math.hypot(...full(fx,...twice)).toFixed(4)));
  // Equation links point at anchors this chapter really defines.
  for (const link of f.root.querySelectorAll('a[href^="#eq-"]'))
    assert(chapterSource(NAME).includes(`{${link.getAttribute('href')}}`),link.getAttribute('href'));
});

test('sgd zones: the transcript lists one item per beat in the order they play', t => {
  const f=fixture(t,NAME); f.load(); f.open();
  const items=[...f.$('.mechanism-transcript ol').children];
  assert.equal(items.length,scene.beats.length);
  for (const item of items) assert.doesNotMatch(item.textContent,ASCII_MATH);
  const story=items.map(item=>item.textContent).join(' ');
  for (const number of ['(−1.1, 0.6)','2.8814','10.19','0.5561','twenty-five','twenty-two'])
    assert(story.includes(number),number);
});
