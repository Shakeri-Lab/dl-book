#!/usr/bin/env node
// Test-only arithmetic and DOM checks; no dependency enters the published book.
// The manuscript owns the rule, the start, the learning rate, the step count and the
// grid; the eight-point dataset is a declared schematic variant. These tests rerun the
// chapter's own loop independently of the player and differentiate the loss numerically,
// so the drawn path, the drawn arrows and the drawn bars each have a second source.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const {ROOT,read,entry,chapterSource,numbers,close,canonicalMarkup,
  fixture,registerTransportTests,registerBeatHoldTest,registerGrammarTests}=require('./html-tests/excerpt-harness.cjs');
const {staticFrame}=require('./render_static_frames.cjs');

const NAME='downhill-bowl-excerpt', scene=entry(NAME);
const widths=[240,296,375,559,560,713,900];
const attr=(node,name)=>Number(node.getAttribute(name));
const drawing=f=>f.$('[data-drawing]');
const visible=node=>!node.closest('[hidden]')&&!node.hasAttribute('hidden');

// A printed number read back the way a reader reads it: U+2212 for minus, four decimals,
// or a mantissa times a power of ten in Unicode superscripts. Hyphen-minus, e-notation
// and raw doubles are not numbers this scene may print, so they fail here rather than parse.
const SUPERSCRIPT='⁰¹²³⁴⁵⁶⁷⁸⁹';
function shown(text) {
  const match=/^([+−]?)(\d+(?:\.\d+)?)(?: × 10(⁻?)([⁰¹²³⁴⁵⁶⁷⁸⁹]+))?$/.exec(text.trim());
  assert(match,`not a house-style number: "${text}"`);
  const exponent=match[4]?Number([...match[4]].map(digit=>SUPERSCRIPT.indexOf(digit)).join(''))*(match[3]?-1:1):0;
  return (match[1]==='−'?-1:1)*Number(match[2])*10**exponent;
}
// Hyphen-minus before a digit, or a mantissa followed by e and an exponent.
const ASCII_MATH=/(?:^|[^\w])-\s?\d|\d(?:\.\d+)?e[-+]?\d/i;

// --- A second implementation of the chapter's own loop -------------------------------
// Written the way chapters/part1/01-linear-regression.qmd:326-331 writes it, subtracting
// `rate * 2 * mean(err * x)` from w and `rate * 2 * mean(err)` from b, twenty times.
const mean=values=>values.reduce((total,value)=>total+value,0)/values.length;
function chapterWalk(xs,ys,start,rate,count) {
  let [w,b]=start;
  const points=[[w,b]], lengths=[], gradients=[];
  for (let k=0;k<count;k++) {
    const err=xs.map((x,i)=>(w*x+b)-ys[i]);
    const gw=2*mean(err.map((e,i)=>e*xs[i])), gb=2*mean(err);
    const dw=rate*gw, db=rate*gb;
    gradients.push([gw,gb]); lengths.push(Math.hypot(dw,db));
    w-=dw; b-=db; points.push([w,b]);
  }
  return {points,lengths,gradients};
}
const lossOf=(xs,ys)=>(w,b)=>mean(xs.map((x,i)=>(w*x+b-ys[i])**2));
function declared(f) {
  const xs=numbers(f.root.dataset.xs), residuals=numbers(f.root.dataset.residuals);
  const [genW,genB]=numbers(f.root.dataset.generating);
  return {xs,residuals,genW,genB,ys:xs.map((x,i)=>genW*x+genB+residuals[i]),
    start:numbers(f.root.dataset.start),rate:Number(f.root.dataset.rate),
    steps:Number(f.root.dataset.steps),grid:numbers(f.root.dataset.grid),
    levels:Number(f.root.dataset.levels)};
}
// The witness numbers the scene prints, recomputed here rather than typed in.
const reference=(()=>{
  const f0={xs:[-0.8,-0.4,-0.1,0.2,0.5,0.9,1.3,1.6],residuals:[0.18,-0.22,0.1,-0.14,0.21,-0.09,-0.19,0.15]};
  const ys=f0.xs.map((x,i)=>2.5*x-1.0+f0.residuals[i]);
  const run=chapterWalk(f0.xs,ys,[-0.5,2.0],0.25,20);
  return {...f0,ys,...run};
})();

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

registerTransportTests(NAME,{witness:/about 172 times smaller/,
  anchors:['downhill-bowl-playback-help'],width:713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('downhill bowl: every structural constant is the chapter\'s own printed literal', t => {
  const f=fixture(t,NAME), fx=declared(f), chapter=chapterSource(NAME);
  assert.deepEqual(fx.start,[-0.5,2]); assert.equal(fx.rate,0.25); assert.equal(fx.steps,20);
  assert.deepEqual(fx.grid,[-1.5,5.5,-4,3]); assert.equal(fx.genW,2.5); assert.equal(fx.genB,-1);
  assert.equal(fx.levels,25);
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal),literal);
  // Every literal this panel mirrors, in the exact form the manifest should name.
  for (const literal of [
    'imagine standing on it *blindfolded*, trying to find the lowest valley. You\ncannot see the valley, but you can feel the slope under your feet.',
    'With two parameters, $(w,b)$, this scalar becomes a surface over the parameter plane.\nThat surface is the **loss landscape**.',
    'y1 = 2.5 * x1 - 1.0 + 0.3 * torch.randn(60)',
    'w, b, path = -0.5, 2.0, []',
    'for _ in range(20):',
    '    w -= 0.25 * float(2 * (err * x1).mean())',
    '    b -= 0.25 * float(2 * err.mean())',
    '    np.linspace(-1.5, 5.5, 100),',
    '    np.linspace(-4.0, 3.0, 100),',
    'ax2d.contour(W, B, L, levels=25, cmap="Blues", alpha=0.85)',
    'ax2d.plot(2.5, -1.0, "k*", ms=12, label="data-generating parameters")',
    'Gradient descent needs only the local slope, not a view of the whole bowl.',
    // The seed is what makes the figure's own sixty points unreproducible here.
    'torch.manual_seed(6050)','x1 = torch.randn(60)'])
    assert(chapter.includes(literal),literal);
  assert.equal(scene.qmd,'chapters/part1/01-linear-regression.qmd');
  assert.equal(scene.anchor.type,'before-heading');
  assert.equal(scene.anchor.target,'Build the complete model three ways');
  assert(chapter.includes(`## ${scene.anchor.target}`));
  assert.deepEqual(scene.beats,[0,5,10,15,20,25,30,35]); assert.equal(scene.duration,40);
  const filter=fs.readFileSync(path.join(ROOT,scene.filter),'utf8');
  assert.match(filter,/^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
});

test('downhill bowl: the declared dataset lies on the chapter\'s own generating line', t => {
  const f=fixture(t,NAME), fx=declared(f);
  assert.equal(fx.xs.length,fx.residuals.length);
  assert(fx.xs.length>=6,'a bowl needs enough points to be well conditioned');
  fx.xs.forEach((x,i)=>close(fx.ys[i]-(2.5*x-1.0),fx.residuals[i],1e-12));
  close(mean(fx.residuals),0,1e-15);
  fx.residuals.forEach(r=>assert(Math.abs(r)<0.25,'the declared spread stays small beside the line'));
  fx.xs.forEach((x,i)=>assert(fx.xs.slice(i+1).every(other=>other!==x),'x values are distinct'));
  // Positive definite Hessian, so the loss really is a bowl rather than a trough.
  const m1=mean(fx.xs), m2=mean(fx.xs.map(x=>x*x));
  assert(m2-m1*m1>0.2,`variance ${m2-m1*m1} leaves the bowl too narrow to draw`);
  // And gradient descent at the chapter's own rate converges on it: every eigenvalue of
  // I - rate*H must sit strictly inside the unit interval, or the walk would diverge.
  const trace=m2+1, gap=Math.hypot(m2-1,2*m1);
  for (const lambda of [(trace+gap)/2,(trace-gap)/2]) {
    const factor=1-fx.rate*2*lambda;
    assert(Math.abs(factor)<1,`rate ${fx.rate} gives contraction ${factor}`);
    assert(factor>0,'a positive factor keeps the walk monotone rather than oscillating');
  }
});

test('downhill bowl: the drawn path is the chapter\'s loop, rerun independently', t => {
  const f=fixture(t,NAME), fx=declared(f); f.load(); f.open();
  const want=chapterWalk(fx.xs,fx.ys,fx.start,fx.rate,fx.steps);
  const got=JSON.parse(f.root.dataset.path), lengths=JSON.parse(f.root.dataset.stepLengths);
  assert.equal(got.length,fx.steps+1); assert.equal(lengths.length,fx.steps);
  got.forEach((point,k)=>{close(point[0],want.points[k][0],1e-9); close(point[1],want.points[k][1],1e-9);});
  lengths.forEach((length,k)=>close(length,want.lengths[k],1e-9));
  close(got[0][0],-0.5,0); close(got[0][1],2,0);
  // The published witnesses, to the four decimals the picture prints.
  close(want.lengths[0],1.0548489394961962,1e-12);
  close(want.lengths[19],0.006133054440247569,1e-12);
  assert.equal(Math.round(want.lengths[0]/want.lengths[19]),172);
});

test('downhill bowl: each step is exactly minus the learning rate times the gradient', t => {
  const f=fixture(t,NAME), fx=declared(f); f.load(); f.open();
  const loss=lossOf(fx.xs,fx.ys), points=JSON.parse(f.root.dataset.path);
  const lengths=JSON.parse(f.root.dataset.stepLengths), h=1e-5;
  for (let k=0;k<fx.steps;k++) {
    const [w,b]=points[k];
    // A central difference of the loss: a second route to the gradient the player uses.
    const gw=(loss(w+h,b)-loss(w-h,b))/(2*h), gb=(loss(w,b+h)-loss(w,b-h))/(2*h);
    const move=[points[k+1][0]-w,points[k+1][1]-b];
    close(move[0],-fx.rate*gw,2e-6); close(move[1],-fx.rate*gb,2e-6);
    // The scene's whole claim: the step length IS the learning rate times the slope.
    close(Math.hypot(move[0],move[1]),lengths[k],1e-9);
    close(lengths[k],fx.rate*Math.hypot(gw,gb),2e-6);
    // Downhill: the step and the gradient point opposite ways, and the loss falls.
    assert(move[0]*gw+move[1]*gb<0);
    assert(loss(points[k+1][0],points[k+1][1])<loss(w,b));
    if (k) assert(lengths[k]<lengths[k-1],`step ${k+1} is not shorter than step ${k}`);
  }
});

test('downhill bowl: the answer is withheld until the walk has played', t => {
  const f=fixture(t,NAME); f.load(); f.open();
  const spoiler=/\b(?:shrink|shrank|shrinking|shorter|smaller|decreas\w*|no,|yes,)\b/i;
  for (const time of [0,2,4.99,5,9.99,12,14.99,15,17,19.99]) {
    f.seek(time);
    assert.equal(f.root.dataset.revealed,'false',`revealed at ${time}s`);
    assert(!visible(f.$('[data-ladder]')),`the shelf of bars is drawn at ${time}s`);
    for (const bar of drawing(f).querySelectorAll('[data-bar]'))
      assert(!visible(bar),`a step-length bar is exposed at ${time}s`);
    assert(!visible(f.$('[data-star]')),`the star is exposed at ${time}s`);
    assert(!visible(f.$('[data-value="ratio"]')),`the ratio badge is exposed at ${time}s`);
    // At most the start, the first landing and the point in between are on the trail.
    const trail=f.$('[data-trail]').getAttribute('d');
    assert((trail.match(/[ML]/g)||[]).length<=2,`the trail runs past the first step at ${time}s`);
    const accessible=[f.$('[data-caption]').textContent,
      f.$('[data-figure] svg').getAttribute('aria-label'),
      f.$('[data-controls] input[type="range"]').getAttribute('aria-valuetext')].join(' ');
    assert.doesNotMatch(accessible,spoiler,`a prediction prompt announces its answer at ${time}s`);
  }
  f.seek(20); assert.equal(f.root.dataset.revealed,'true');
  assert(visible(f.$('[data-ladder]')));
});

test('downhill bowl: each beat reveals exactly what its caption describes', t => {
  const f=fixture(t,NAME,{reduced:true}); f.load(); f.open();
  const state=time=>{
    f.seek(time);
    return {stage:Number(f.root.dataset.stage),walk:Number(f.root.dataset.walk),
      ghost:visible(f.$('[data-ghost]')),step:visible(f.$('[data-step-arrow-group]')),
      quarters:visible(f.$('[data-quarter="0.25"]')),ladder:visible(f.$('[data-ladder]')),
      star:visible(f.$('[data-star]')),badge:visible(f.$('[data-value="ratio"]')),
      contours:Number(f.root.dataset.contourOpacity),
      bars:[...drawing(f).querySelectorAll('[data-bar]')].filter(visible).length};
  };
  const want=[
    {stage:0,walk:0,ghost:false,step:false,quarters:false,ladder:false,star:false,badge:false,contours:0,bars:0},
    {stage:1,walk:0,ghost:true,step:false,quarters:false,ladder:false,star:false,badge:false,contours:0,bars:0},
    {stage:2,walk:0,ghost:true,step:true,quarters:true,ladder:false,star:false,badge:false,contours:0,bars:0},
    {stage:3,walk:1,ghost:false,step:true,quarters:false,ladder:false,star:false,badge:false,contours:0,bars:1},
    {stage:4,walk:10,ghost:false,step:true,quarters:false,ladder:true,star:false,badge:false,contours:0,bars:10},
    {stage:5,walk:20,ghost:false,step:true,quarters:false,ladder:true,star:false,badge:false,contours:0,bars:20},
    {stage:6,walk:20,ghost:true,step:true,quarters:false,ladder:true,star:true,badge:false,contours:1,bars:20},
    {stage:7,walk:20,ghost:true,step:true,quarters:false,ladder:true,star:true,badge:true,contours:1,bars:20}
  ];
  scene.beats.forEach((beat,index)=>{
    const got=state(beat);
    // A bar exists only for a step already taken; at stage 3 the shelf itself is not drawn.
    assert.deepEqual({...got,bars:got.ladder?got.bars:0},{...want[index],bars:want[index].ladder?want[index].bars:0},
      `beat ${index} at ${beat}s`);
  });
  // The contours belong to the reader, never the walker: nothing of them before the reveal.
  for (const time of [0,10,20,25,29.3]) {f.seek(time); assert.equal(Number(f.root.dataset.contourOpacity),0);}
});

test('downhill bowl: the step arrow is the gradient arrow scaled by the learning rate', t => {
  const f=fixture(t,NAME), fx=declared(f); f.load(); f.open();
  const vector=selector=>{
    const d=f.$(selector).getAttribute('d');
    const points=[...d.matchAll(/[ML] (-?[\d.]+) (-?[\d.]+)/g)].map(m=>[Number(m[1]),Number(m[2])]);
    return [points[1][0]-points[0][0],points[1][1]-points[0][1]];
  };
  // Both arrows are drawn at their true length only once each has finished growing.
  for (const time of [13,14.99,32,37,39.9]) {
    f.seek(time);
    const full=vector('[data-ghost-arrow]'), step=vector('[data-step-arrow]');
    assert(Math.hypot(...full)>0,`no gradient arrow at ${time}s`);
    close(step[0],fx.rate*full[0],4e-4); close(step[1],fx.rate*full[1],4e-4);
    // The quarter ticks sit on the shared ray, the first at the step arrow's own tip.
    const unit=Number(f.root.dataset.unit), index=Number(f.root.dataset.stepIndex);
    close(Math.hypot(...full)/unit,reference.gradients[index].reduce((s,v)=>s+v*v,0)**0.5,3e-4);
    close(Math.hypot(...step)/unit,reference.lengths[index],3e-4);
  }
  // And the walker really lands on that tip: the arrow drawn as advice at 13s and the
  // trail's second vertex once the step has been taken are the same point.
  f.seek(13);
  const tail=[...f.$('[data-step-arrow]').getAttribute('d').matchAll(/[ML] (-?[\d.]+) (-?[\d.]+)/g)]
    .map(m=>[Number(m[1]),Number(m[2])])[0];
  const advice=vector('[data-step-arrow]');
  f.seek(20);
  const walked=[...f.$('[data-trail]').getAttribute('d').matchAll(/[ML] (-?[\d.]+) (-?[\d.]+)/g)]
    .map(m=>[Number(m[1]),Number(m[2])]);
  assert.equal(walked.length,2,'one step taken, one segment drawn');
  close(walked[0][0],tail[0],1e-3); close(walked[0][1],tail[1],1e-3);
  close(walked[1][0],tail[0]+advice[0],1e-3); close(walked[1][1],tail[1]+advice[1],1e-3);
});

test('downhill bowl: every drawn contour really is a level set, equally spaced in loss', t => {
  const f=fixture(t,NAME,{width:713}), fx=declared(f); f.load(); f.open(); f.seek(scene.duration);
  const loss=lossOf(fx.xs,fx.ys);
  const left=Number(f.root.dataset.plotLeft), bottom=Number(f.root.dataset.plotBottom);
  const unit=Number(f.root.dataset.unit);
  const toW=x=>fx.grid[0]+(x-left)/unit, toB=y=>fx.grid[2]+(bottom-y)/unit;
  const rings=[...drawing(f).querySelectorAll('[data-ring]')];
  assert.equal(rings.length,fx.levels-1,'one ring per level, as the figure draws them');
  const levels=rings.map(ring=>{
    const points=[...ring.getAttribute('d').matchAll(/[ML] (-?[\d.]+) (-?[\d.]+)/g)]
      .map(m=>loss(toW(Number(m[1])),toB(Number(m[2]))));
    assert(points.length>=48,'a ring is sampled finely enough to read as a curve');
    const spread=Math.max(...points)-Math.min(...points);
    assert(spread<2e-3,`a drawn ring varies by ${spread} in loss, so it is not a level set`);
    return mean(points);
  });
  const gaps=levels.slice(1).map((level,k)=>level-levels[k]);
  gaps.forEach(gap=>close(gap,gaps[0],1e-2));
  assert(gaps[0]>0,'levels ascend');
  // Equally spaced levels are what makes crowded rings mean a steep surface.
  const minimum=Math.min(...levels);
  assert(loss(2.5,-1.0)<minimum,'the generating parameters sit inside the innermost ring');
});

test('downhill bowl: the bars are the step lengths on one shared scale', t => {
  for (const width of [375,713]) {
    const f=fixture(t,NAME,{width}); f.load(); f.open(); f.seek(scene.duration);
    const narrow=f.root.dataset.layout==='narrow';
    const scale=Number(f.root.dataset.barScale);
    const bars=[...drawing(f).querySelectorAll('[data-bar]')];
    assert.equal(bars.length,reference.lengths.length);
    bars.forEach((bar,k)=>{
      const drawn=narrow?attr(bar,'height'):attr(bar,'width');
      close(drawn,reference.lengths[k]*scale,1e-3);
      assert(drawn>=0,'a bar never has negative length');
    });
    // The first and last bars carry the two numbers the picture prints.
    close(shown(f.$('[data-value="first"]').textContent),Number(reference.lengths[0].toFixed(4)),0);
    close(shown(f.$('[data-value="last"]').textContent),Number(reference.lengths[19].toFixed(4)),0);
    assert.equal(f.$('[data-value="ratio"]').textContent,`× ${Math.round(reference.lengths[0]/reference.lengths[19])}`);
    // The bars are stacked along one axis at a constant pitch, so their lengths compare.
    const along=bars.map(bar=>narrow?attr(bar,'x'):attr(bar,'y'));
    const pitch=along.slice(1).map((value,k)=>value-along[k]);
    pitch.forEach(gap=>close(gap,pitch[0],1e-9));
  }
});

test('downhill bowl: every printed number is house style and every mark stays inside the picture', t => {
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
      const printed=[...drawing(f).querySelectorAll('[data-value]')];
      for (const node of printed) {
        const text=node.textContent.trim();
        if (text==='·') {assert(!visible(node),'a withheld number is not drawn'); continue;}
        shown(text.replace(/^(?:‖∇L‖|η‖∇L‖|×) ?/,''));
      }
      const wording=[...texts.map(node=>node.textContent),f.$('[data-caption]').textContent,
        f.$('[data-figure] svg').getAttribute('aria-label'),
        f.$('[data-controls] input[type="range"]').getAttribute('aria-valuetext')];
      for (const text of wording) assert.doesNotMatch(text,ASCII_MATH,`ASCII arithmetic in "${text}"`);
      // Nothing is drawn outside the parameter plane that claims to be inside it.
      const left=Number(f.root.dataset.plotLeft), right=Number(f.root.dataset.plotRight);
      const top=Number(f.root.dataset.plotTop), bottom=Number(f.root.dataset.plotBottom);
      for (const dot of [...drawing(f).querySelectorAll('[data-walker], [data-trail-dot]')].filter(visible)) {
        assert(attr(dot,'cx')>=left-1&&attr(dot,'cx')<=right+1,`a walk mark leaves the plane at ${time}s`);
        assert(attr(dot,'cy')>=top-1&&attr(dot,'cy')<=bottom+1,`a walk mark leaves the plane at ${time}s`);
      }
    }
  }
});

test('downhill bowl: the layout reflows once and the picture keeps equal scale on both axes', t => {
  for (const width of widths) {
    const f=fixture(t,NAME,{width}); f.load(); f.open(); f.seek(scene.duration);
    const fx=declared(f);
    const expected=width<560?'narrow':'wide';
    assert.equal(f.root.dataset.layout,expected,`${width}px`);
    const [,,boxW,boxH]=f.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/).map(Number);
    assert.deepEqual([boxW,boxH],width<560?[296,524]:[713,490]);
    const unit=Number(f.root.dataset.unit);
    const left=Number(f.root.dataset.plotLeft), right=Number(f.root.dataset.plotRight);
    const top=Number(f.root.dataset.plotTop), bottom=Number(f.root.dataset.plotBottom);
    // One pixel per parameter unit in both directions, which is what lets the reader see
    // each arrow meeting its ring at a right angle.
    close((right-left)/(fx.grid[1]-fx.grid[0]),unit,1e-9);
    close((bottom-top)/(fx.grid[3]-fx.grid[2]),unit,1e-9);
  }
  // Resizing a live player rebuilds the same picture the fresh render gives.
  const wide=fixture(t,NAME,{width:713}); wide.load(); wide.open(); wide.seek(24.375);
  wide.resize(375); wide.resize(713);
  const fresh=fixture(t,NAME,{width:713}); fresh.load(); fresh.open(); fresh.seek(24.375);
  assert.equal(canonicalMarkup(wide.$('[data-figure]').innerHTML),
    canonicalMarkup(fresh.$('[data-figure]').innerHTML));
});

test('downhill bowl: seeking reconstructs the whole published state, not just the drawing', t => {
  const f=fixture(t,NAME); f.load(); f.open();
  const snapshot=()=>({markup:canonicalMarkup(f.$('[data-pane]').innerHTML.replace(/aria-valuetext="[^"]*"/g,'')),
    state:JSON.stringify(f.root.dataset)});
  const probes=[0,4.4,9.9,12.5,17.25,21.6,26.75,31.4,36.5,39.9,scene.duration];
  const first=probes.map(time=>{f.seek(time); return snapshot();});
  f.play(); f.tick(6000); f.seek(3); f.play(); f.tick(2000);
  probes.forEach((time,index)=>{f.seek(time); assert.deepEqual(snapshot(),first[index],`replay differs at ${time}s`);});
  // Backwards, too: the render is a function of time and nothing else.
  [...probes].reverse().forEach(time=>{
    const index=probes.indexOf(time);
    f.seek(time); assert.deepEqual(snapshot(),first[index],`reverse seek differs at ${time}s`);
  });
});

test('downhill bowl: the committed static fallback is a fresh render of the final frame', async t => {
  const generated=await staticFrame(NAME);
  assert.equal(generated.before,generated.after,
    'interactives/downhill-bowl/panel.html is stale: run scripts/render_static_frames.cjs downhill-bowl');
  const panel=read('downhill-bowl/panel.html');
  assert(panel.includes('<g data-static-frame="narrow"'),'a reflowing scene ships a narrow print');
  assert(/preserveAspectRatio="xMinYMin meet"/.test(panel));
  // Local ids in the narrow print are namespaced, so its clip path cannot resolve to the
  // wide drawing's rectangle.
  const narrow=/<g data-static-frame="narrow"[\s\S]*?<\/g>\s*<!-- \/static-frame-narrow -->/.exec(panel)[0];
  assert(narrow.includes('id="db-plot-clip--static-narrow"'));
  assert(narrow.includes('url(#db-plot-clip--static-narrow)'));
  assert(!narrow.includes('url(#db-plot-clip)'));
  // Geometry is serialised at four decimals, as the contract requires.
  for (const [,value] of narrow.matchAll(/ (?:cx|cy|x1|y1|x2|y2|width|height)="(-?\d+\.\d+)"/g))
    assert(value.split('.')[1].length<=4,`${value} is serialised past 0.0001 px`);
});

test('downhill bowl: the panel names its schematic variant and its boundary', t => {
  const f=fixture(t,NAME);
  const boundary=f.$('.mechanism-boundary').textContent;
  assert.match(boundary,/quadratic bowl is the special case/);
  assert.match(boundary,/nothing drawn here is a measured training run/);
  assert.match(boundary,/full-batch gradient descent/);
  assert.match(boundary,/schematic/);
  assert.match(boundary,/sixty points are seeded and never printed/);
  assert.match(boundary,/drawing device/);
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
  // The transfer answer's number is this fixture's first step, doubled.
  const doubled=2*reference.lengths[0];
  assert(check.querySelector('p').textContent.includes(doubled.toFixed(4)));
  assert.doesNotMatch(check.textContent,ASCII_MATH);
  // Equation links point at anchors this chapter really defines.
  for (const link of f.root.querySelectorAll('a[href^="#eq-"]'))
    assert(chapterSource(NAME).includes(`{${link.getAttribute('href')}}`),link.getAttribute('href'));
});

test('downhill bowl: the transcript lists one item per beat in the order they play', t => {
  const f=fixture(t,NAME); f.load(); f.open();
  const items=[...f.$('.mechanism-transcript ol').children];
  assert.equal(items.length,scene.beats.length);
  for (const item of items) assert.doesNotMatch(item.textContent,ASCII_MATH);
  const story=items.map(item=>item.textContent).join(' ');
  for (const number of ['4.2194','1.0548','0.0061','2.4682','172']) assert(story.includes(number),number);
  assert(story.includes('0.0502')&&story.includes('1.1000'),'the first landing is recorded');
  close(reference.points[1][0],0.0501875,1e-12); close(reference.points[1][1],1.1,1e-12);
  close(reference.points[20][0],2.4682188237996345,1e-12);
  close(reference.points[20][1],-0.9816385277849736,1e-12);
});
