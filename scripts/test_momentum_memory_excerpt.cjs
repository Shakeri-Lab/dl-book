#!/usr/bin/env node
// Test-only arithmetic and DOM checks; no dependency enters the published book.
// The manuscript owns the velocity recursion, the range of beta and the "keep agreeing /
// flip sign" behaviour; the narrow valley, the start, the step length, the particular beta
// and the eight steps are a declared computed variant. These tests recompute both runs
// from the declared fixture independently of the player, differentiate the declared loss
// numerically to confirm the gradient, and check the two claims the whole scene rests on:
// the chain drawn on each rail is exactly the running sum beta^(t-j) g(j) term by term,
// and the same rule leaves one component folded onto zero while the other stacks.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const {ROOT,read,entry,chapterSource,numbers,close,canonicalMarkup,
  fixture,registerTransportTests,registerBeatHoldTest,registerGrammarTests}=require('./html-tests/excerpt-harness.cjs');
const {staticFrame}=require('./render_static_frames.cjs');

const NAME='momentum-memory-excerpt', scene=entry(NAME);
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
function declared(f) {
  const [across,along]=numbers(f.root.dataset.curvature);
  return {across,along,start:numbers(f.root.dataset.start),
    rate:Number(f.root.dataset.rate),beta:Number(f.root.dataset.beta),
    steps:Number(f.root.dataset.steps),levels:numbers(f.root.dataset.levels),
    window:numbers(f.root.dataset.window),rail:numbers(f.root.dataset.rail),
    leg:Number(f.root.dataset.leg)};
}
const lossAt=(fx,w)=>(fx.across*w[0]*w[0]+fx.along*w[1]*w[1])/2;
const gradAt=(fx,w)=>[fx.across*w[0],fx.along*w[1]];
// The declared loop, written out again: keep a running velocity, move along it.
function run(fx,memory) {
  let w=[...fx.start], v=[0,0];
  const path=[[...w]], grads=[], velocities=[];
  for (let t=0;t<fx.steps;t++) {
    const g=gradAt(fx,w);
    v=[memory*v[0]+g[0],memory*v[1]+g[1]];
    grads.push(g); velocities.push([...v]);
    w=[w[0]-fx.rate*v[0],w[1]-fx.rate*v[1]];
    path.push([...w]);
  }
  return {path,grads,velocities};
}
// The running sum as a sum, not a recursion: the form the rails draw.
const termsAfter=(fx,r,memory,count,axis)=>r.grads.slice(0,count).map((g,j)=>memory**(count-1-j)*g[axis]);
const signChanges=values=>values.filter((v,i)=>i&&Math.sign(v)!==Math.sign(values[i-1])).length;

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
// A link is drawn "M x y V rowY H next", so its own signed length is next − x.
const linkRun=node=>{
  const m=/^M (-?[\d.]+) (-?[\d.]+) V (-?[\d.]+) H (-?[\d.]+)/.exec(node.getAttribute('d'));
  assert(m,`a link is not a staircase: ${node.getAttribute('d')}`);
  return {x0:Number(m[1]),y0:Number(m[2]),row:Number(m[3]),x1:Number(m[4])};
};
const chainOf=(f,axis)=>[...drawing(f).querySelectorAll(`[data-link^="${axis}-"]`)].filter(visible).map(linkRun);
const railValue=(f,axis)=>f.$(`[data-value="${axis}"]`);

registerTransportTests(NAME,{witness:/30\.3916/,anchors:['momentum-memory-playback-help'],width:713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('momentum memory: the mechanism it draws is the chapter\'s own printed passage', t => {
  const f=fixture(t,NAME), chapter=chapterSource(NAME);
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal),literal);
  // Every literal this panel mirrors, in the exact form the manifest should name.
  for (const literal of [
    '\\vect{v}^{(t)} = \\beta\\,\\vect{v}^{(t-1)} + \\nabla \\loss(\\vect{w}^{(t)}), \\qquad',
    '\\vect{w}^{(t+1)} = \\vect{w}^{(t)} - \\alpha\\,\\vect{v}^{(t)},',
    '$$ {#eq-momentum}',
    'with $\\beta \\in [0.9, 0.99]$.',
    'the iterate zigzags across the steep direction while inching along the\nshallow one.',
    'in directions where\ngradients keep agreeing, speed builds; in directions where they flip sign every step,\nthey cancel.',
    'The fix is to give the update a memory. Keep a running **velocity** that\naccumulates gradients, and move along the velocity instead of the raw gradient:',
    // The declared beta is the low end of the printed range, and the chapter's own value.
    'momentum=0.9',
    // The chapter's rule-of-thumb step length, and the race that this panel is not.
    'plain SGD often starts around\n$\\alpha = 0.1$',
    '#| label: fig-race'])
    assert(chapter.includes(literal),literal);
  assert.equal(scene.qmd,'chapters/part1/04-training-loss-sgd.qmd');
  assert.equal(scene.anchor.type,'before-heading');
  assert.equal(scene.anchor.target,'Adam: adaptive steps per knob');
  assert(chapter.includes(`## ${scene.anchor.target}`));
  assert.deepEqual(scene.beats,[0,5,10,15,20,25,30,35]); assert.equal(scene.duration,40);
  const filter=fs.readFileSync(path.join(ROOT,scene.filter),'utf8');
  assert.match(filter,/^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
  // The equation the panel links to is one this chapter really defines.
  for (const link of f.root.querySelectorAll('a[href^="#eq-"]'))
    assert(chapter.includes(`{${link.getAttribute('href')}}`),link.getAttribute('href'));
});

test('momentum memory: the declared valley is a narrow bowl the chapter\'s beta is legal in', t => {
  const f=fixture(t,NAME), fx=declared(f);
  assert(fx.across>0&&fx.along>0,'a genuine bowl, so "downhill" means something');
  assert(fx.across/fx.along>=20,`curvature ratio ${fx.across/fx.along} is not a narrow valley`);
  // beta inside the chapter's printed range, and the low end of it.
  assert(fx.beta>=0.9&&fx.beta<=0.99,`beta ${fx.beta} is outside the chapter's range`);
  assert.equal(fx.beta,0.9);
  // The whole point of the start: both components of the first gradient are the same
  // number, so nothing the scene shows can be blamed on one direction's gradient being
  // bigger than the other's.
  const g0=gradAt(fx,fx.start);
  close(g0[0],g0[1],1e-12); close(g0[0],10,1e-12);
  // The gradient of the declared loss, by central differences, at several probes.
  for (const w of [fx.start,[0.1,4],[-0.2,-3],[0,0.5]]) {
    const h=1e-6, g=gradAt(fx,w);
    close((lossAt(fx,[w[0]+h,w[1]])-lossAt(fx,[w[0]-h,w[1]]))/(2*h),g[0],1e-6);
    close((lossAt(fx,[w[0],w[1]+h])-lossAt(fx,[w[0],w[1]-h]))/(2*h),g[1],1e-6);
  }
  // Plain SGD sits exactly on the across direction's oscillation boundary and crawls
  // along the shallow one: the pathology the chapter names, not a diverging run.
  close(fx.rate*fx.across,2,1e-12);
  assert(fx.rate*fx.along<0.1,'the shallow direction is not a crawl at this step length');
  // The outermost level curve is the one through the declared start, so the start sits on
  // the valley's own wall and every drawn point of both runs stays inside it.
  close(fx.levels[0],lossAt(fx,fx.start),1e-12);
  assert.deepEqual([...fx.levels].sort((a,b)=>b-a),fx.levels,'the rings are declared outermost first');
  for (const memory of [0,fx.beta])
    for (const w of run(fx,memory).path) assert(lossAt(fx,w)<=fx.levels[0]+1e-9,`${w} leaves the drawn valley`);
});

test('momentum memory: both runs are the declared loop, rerun independently', t => {
  const f=fixture(t,NAME), fx=declared(f); f.load(); f.open();
  const plain=run(fx,0), heavy=run(fx,fx.beta);
  const got=JSON.parse(f.root.dataset.sgdPath), momentum=JSON.parse(f.root.dataset.momentumPath);
  assert.equal(got.length,fx.steps+1); assert.equal(momentum.length,fx.steps+1);
  got.forEach((p,k)=>{close(p[0],plain.path[k][0],1e-9); close(p[1],plain.path[k][1],1e-9);});
  momentum.forEach((p,k)=>{close(p[0],heavy.path[k][0],1e-9); close(p[1],heavy.path[k][1],1e-9);});
  JSON.parse(f.root.dataset.velocities).forEach((v,k)=>{
    close(v[0],heavy.velocities[k][0],1e-9); close(v[1],heavy.velocities[k][1],1e-9);});
  JSON.parse(f.root.dataset.gradients).forEach((g,k)=>{
    close(g[0],heavy.grads[k][0],1e-9); close(g[1],heavy.grads[k][1],1e-9);});
  // Same start, same step length: the only difference between the two runs is the memory.
  close(got[0][0],momentum[0][0],0); close(got[0][1],momentum[0][1],0);
  for (let k=0;k<fx.steps;k++) {
    // Plain SGD moves by minus the rate times the bare gradient…
    const g=gradAt(fx,plain.path[k]);
    close(plain.path[k+1][0]-plain.path[k][0],-fx.rate*g[0],1e-12);
    close(plain.path[k+1][1]-plain.path[k][1],-fx.rate*g[1],1e-12);
    // …and momentum by minus the same rate times the velocity, which is the running sum.
    close(heavy.path[k+1][0]-heavy.path[k][0],-fx.rate*heavy.velocities[k][0],1e-12);
    close(heavy.path[k+1][1]-heavy.path[k][1],-fx.rate*heavy.velocities[k][1],1e-12);
    for (const axis of [0,1])
      close(heavy.velocities[k][axis],
        termsAfter(fx,heavy,fx.beta,k+1,axis).reduce((total,term)=>total+term,0),1e-12);
  }
});

test('momentum memory: one rule, opposite outcomes, because of the signs alone', t => {
  const f=fixture(t,NAME), fx=declared(f);
  const plain=run(fx,0), heavy=run(fx,fx.beta);
  // Plain SGD's across gradient flips sign at every single step; its along gradient never
  // does. That is the chapter's sentence, literally true of the declared run.
  assert.equal(signChanges(plain.grads.map(g=>g[0])),fx.steps-1);
  assert.equal(signChanges(plain.grads.map(g=>g[1])),0);
  // Under momentum the across gradient still reverses repeatedly, the along one never.
  assert(signChanges(heavy.grads.map(g=>g[0]))>=3,'the across direction stops disagreeing');
  assert.equal(signChanges(heavy.grads.map(g=>g[1])),0,'an along contribution disagrees');
  const acrossV=heavy.velocities.map(v=>v[0]), alongV=heavy.velocities.map(v=>v[1]);
  const one=gradAt(fx,fx.start)[0];
  // The selective claim, as arithmetic: the across sum never outgrows the single first
  // contribution, the along sum passes three of them, and the two started equal.
  close(acrossV[0],alongV[0],1e-12);
  assert(Math.max(...acrossV.map(Math.abs))<=one+1e-12,'the across sum outgrew one contribution');
  assert(Math.max(...alongV)>3*one,'the along sum never reaches three contributions');
  close(Math.max(...acrossV.map(Math.abs)),10,1e-12);
  close(Math.max(...alongV),33.716365625,1e-9);
  close(acrossV.at(-1),2.835539,1e-9);
  close(alongV.at(-1),30.3916407265625,1e-9);
  // Every reversal subtracts: after a sign flip the sum is smaller than the decayed
  // history it landed on, which is what "they cancel" means term by term.
  for (let k=1;k<fx.steps;k++) if (Math.sign(heavy.grads[k][0])!==Math.sign(acrossV[k-1]))
    assert(Math.abs(acrossV[k])<Math.abs(fx.beta*acrossV[k-1]),`step ${k+1} did not cancel`);
  // And with nothing disagreeing the along sum is larger than its decayed history, every
  // step, which is what "speed builds" means.
  for (let k=1;k<fx.steps;k++) assert(alongV[k]>fx.beta*alongV[k-1],`step ${k+1} did not build`);
  // Momentum crosses the valley floor far less often per unit of progress: the zigzag the
  // chapter says damps itself. Both runs take the same number of steps.
  const crossings=r=>signChanges(r.path.map(p=>p[0]));
  const travelled=r=>Math.abs(r.path[0][1]-r.path[fx.steps][1]);
  assert.equal(crossings(plain),fx.steps);
  assert(crossings(heavy)*travelled(plain)*4<crossings(plain)*travelled(heavy),
    'momentum does not cross the floor far less often per unit of progress');
  close(travelled(plain),3.365795687109376,1e-9);
  close(travelled(heavy),10.675364450390628,1e-9);
});

test('momentum memory: each rail draws the running sum term by term and its tip is the velocity', t => {
  for (const width of [375,713]) {
    const f=fixture(t,NAME,{width}), fx=declared(f); f.load(); f.open();
    const heavy=run(fx,fx.beta);
    const zero=Number(f.root.dataset.railZero), scale=Number(f.root.dataset.railScale);
    // Rest at the end of each momentum step, where the chain holds whole terms.
    for (let count=1;count<=fx.steps;count++) {
      f.seek(15+2.5*count-0.1);
      for (const [axis,name] of [[0,'across'],[1,'along']]) {
        const links=chainOf(f,name), want=termsAfter(fx,heavy,fx.beta,count,axis);
        assert.equal(links.length,want.length,`${name} chain has ${links.length} terms after ${count} steps`);
        // Head to tail: every link starts where the last one ended, the first at zero.
        close(links[0].x0,zero,1e-3);
        links.forEach((link,k)=>{
          close((link.x1-link.x0)/scale,want[k],2e-3);
          if (k) close(link.x0,links[k-1].x1,1e-3);
        });
        // The tip of the chain IS the velocity, on the rail and in the printed number.
        const tip=links.at(-1).x1;
        close((tip-zero)/scale,heavy.velocities[count-1][axis],2e-3);
        close(shown(railValue(f,name).textContent),
          Number(heavy.velocities[count-1][axis].toFixed(4)),0);
        close(Number(f.root.dataset[axis?'vAlong':'vAcross']),heavy.velocities[count-1][axis],1e-9);
      }
    }
    // The two rails share one scale and one zero, so the two chains are comparable by eye.
    const rails=[...drawing(f).querySelectorAll('[data-rail]')];
    assert.equal(rails.length,2);
    // The band on each rail is the first contribution, the same number in both directions.
    for (const band of drawing(f).querySelectorAll('.mm-band'))
      close(attr(band,'width')/scale,20,1e-6);
  }
});

test('momentum memory: inside a step the picture performs the recursion in its printed order', t => {
  const f=fixture(t,NAME,{width:713}), fx=declared(f); f.load(); f.open();
  const heavy=run(fx,fx.beta);
  const scale=Number(f.root.dataset.railScale);
  const total=axis=>chainOf(f,axis?'along':'across').reduce((sum,link)=>sum+(link.x1-link.x0),0)/scale;
  // Step three: the sum first shrinks by beta with no new term, then the new term arrives,
  // and only then does the iterate move.
  const at=fraction=>f.seek(Number((15+2.5*2+2.5*fraction).toFixed(4)));
  at(0); assert.equal(f.root.dataset.phaseName,'shrink');
  for (const axis of [0,1]) close(total(axis),heavy.velocities[1][axis],2e-3);
  assert.equal(chainOf(f,'across').length,2,'a term arrives during the shrink');
  at(0.3); assert.equal(f.root.dataset.phaseName,'shrink');
  // Part way through the shrink the whole chain has contracted by that much of the way
  // toward beta, and nothing has been added to it.
  const part=1-(1-fx.beta)*(0.3/0.36);
  for (const axis of [0,1]) close(total(axis),part*heavy.velocities[1][axis],2e-3);
  assert.equal(chainOf(f,'across').length,2,'a term arrives during the shrink');
  at(0.5); assert.equal(f.root.dataset.phaseName,'add');
  assert.equal(chainOf(f,'across').length,3,'the new term is not being added');
  at(0.8); assert.equal(f.root.dataset.phaseName,'move');
  for (const axis of [0,1]) close(total(axis),heavy.velocities[2][axis],2e-3);
  at(0.9); assert.equal(f.root.dataset.phaseName,'move');
  // The formula lights the half the picture is performing, and never both.
  const lit=()=>[...f.$('[data-formula]').classList].filter(name=>name.endsWith('-lit'));
  at(0.2); assert.deepEqual(lit(),['mm-decay-lit']);
  at(0.55); assert.deepEqual(lit(),['mm-add-lit']);
  at(0.9); assert.deepEqual(lit(),[]);
  // Plain SGD is the same machinery with nothing kept: one term, which collapses to
  // nothing before the next arrives.
  for (const fraction of [0.1,0.5,0.9]) {
    f.seek(Number((5+4.6/8*(3+fraction)).toFixed(4)));
    assert(chainOf(f,'across').length<=1,'plain SGD keeps a second term');
    assert(chainOf(f,'along').length<=1,'plain SGD keeps a second term');
  }
  f.seek(9.9);
  const plain=run(fx,0);
  for (const [axis,name] of [[0,'across'],[1,'along']])
    close(shown(railValue(f,name).textContent),Number(plain.grads.at(-1)[axis].toFixed(4)),0);
});

test('momentum memory: the answer is withheld until the picture has shown it', t => {
  const f=fixture(t,NAME); f.load(); f.open();
  const spoiler=/\b(?:cancel\w*|wipe\w*|stack\w*|tripl\w*|outgrew|selectiv\w*|damp\w*|opposite)\b/i;
  for (const time of [0,2,4.99,5,7,9.99,10,12,14.99,15,16,17.4,18.4]) {
    f.seek(time);
    assert.equal(f.root.dataset.revealed,'false',`revealed at ${time}s`);
    const accessible=[f.$('[data-caption]').textContent,
      f.$('[data-figure] svg').getAttribute('aria-label'),
      f.$('[data-controls] input[type="range"]').getAttribute('aria-valuetext'),
      [...drawing(f).querySelectorAll('text')].filter(visible).map(node=>node.textContent).join(' ')].join(' ');
    assert.doesNotMatch(accessible,spoiler,`a prediction prompt announces its answer at ${time}s`);
    // Once momentum starts, nothing separates the two directions until the second term
    // begins to arrive: both rails carry the very same number.
    const across=railValue(f,'across'), along=railValue(f,'along');
    if (time>=15&&visible(across)) close(shown(across.textContent),shown(along.textContent),0);
    assert(!visible(f.$('[data-end-label="momentum"]')),`an end label is exposed at ${time}s`);
  }
  // The reveal is the picture's own: the second step's term finishes arriving at 19.4s.
  f.seek(19.39); assert.equal(f.root.dataset.revealed,'false');
  f.seek(19.4); assert.equal(f.root.dataset.revealed,'true');
  close(Number(f.root.dataset.vAcross),-1,1e-9);
  close(Number(f.root.dataset.vAlong),18.5,1e-9);
  // Two still seconds separate the prediction from it, and the prediction beat asks.
  assert(19.4-scene.beats[2]>=2);
  f.seek(12); assert.match(f.$('[data-caption]').textContent,/\?$/);
});

test('momentum memory: each beat reveals exactly what its caption describes', t => {
  const f=fixture(t,NAME,{reduced:true}), fx=declared(f); f.load(); f.open();
  const state=time=>{
    f.seek(time);
    return {stage:Number(f.root.dataset.stage),
      sgd:Number(Number(f.root.dataset.sgdWalk).toFixed(4)),
      mom:Number(Number(f.root.dataset.momentumStep).toFixed(4)),
      links:[chainOf(f,'across').length,chainOf(f,'along').length],
      across:Number(Number(f.root.dataset.vAcross).toFixed(4)),
      along:Number(Number(f.root.dataset.vAlong).toFixed(4)),
      legs:visible(f.$('[data-leg="across"]')),
      ends:visible(f.$('[data-end-label="sgd"]')),
      counter:visible(f.$('[data-counter]'))?f.$('[data-counter]').textContent:'',
      sgdPath:visible(f.$('[data-path="sgd"]')),momPath:visible(f.$('[data-path="momentum"]'))};
  };
  const want=[
    {stage:0,sgd:0,mom:0,links:[0,0],across:0,along:0,legs:true,ends:false,counter:'',sgdPath:false,momPath:false},
    {stage:1,sgd:8,mom:0,links:[1,1],across:-10,along:6.9834,legs:true,ends:false,counter:'step 8 of 8',sgdPath:true,momPath:false},
    {stage:2,sgd:8,mom:0,links:[0,0],across:0,along:0,legs:true,ends:false,counter:'',sgdPath:true,momPath:false},
    {stage:3,sgd:8,mom:1.96,links:[2,2],across:-1,along:18.5,legs:true,ends:false,counter:'step 2 of 8',sgdPath:true,momPath:true},
    {stage:4,sgd:8,mom:3.96,links:[4,4],across:1.79,along:30.0162,legs:true,ends:false,counter:'step 4 of 8',sgdPath:true,momPath:true},
    {stage:5,sgd:8,mom:5.96,links:[6,6],across:-2.3941,along:33.7164,legs:true,ends:false,counter:'step 6 of 8',sgdPath:true,momPath:true},
    {stage:6,sgd:8,mom:7.96,links:[8,8],across:2.8355,along:30.3916,legs:true,ends:false,counter:'step 8 of 8',sgdPath:true,momPath:true},
    {stage:7,sgd:8,mom:8,links:[8,8],across:2.8355,along:30.3916,legs:false,ends:true,counter:'step 8 of 8',sgdPath:true,momPath:true}
  ];
  scene.beats.forEach((beat,index)=>assert.deepEqual(state(beat),want[index],`beat ${index} at ${beat}s`));
  // The plain run is live ink while it plays and a ghost once it is the thing momentum is
  // compared with, so two orange paths are still two paths without colour.
  f.seek(7); assert.match(f.$('[data-path="sgd"]').getAttribute('class'),/mm-live/);
  f.seek(12); assert.doesNotMatch(f.$('[data-path="sgd"]').getAttribute('class'),/mm-live/);
  // The closing frame prints how far each run is from the bottom after the same eight steps.
  f.seek(scene.duration);
  const plain=run(fx,0), heavy=run(fx,fx.beta);
  const distance=name=>shown(f.$(`[data-value="${name}"]`).textContent.replace(/ (?:to go|past)$/,''));
  close(distance('sgd'),Number(Math.abs(plain.path[fx.steps][1]).toFixed(4)),0);
  close(distance('momentum'),Number(Math.abs(heavy.path[fx.steps][1]).toFixed(4)),0);
  // One run is still short of the bottom, the other has run through it.
  assert.match(f.$('[data-value="sgd"]').textContent,/ to go$/);
  assert.match(f.$('[data-value="momentum"]').textContent,/ past$/);
  assert(plain.path[fx.steps][1]>0&&heavy.path[fx.steps][1]<0);
});

test('momentum memory: every printed number is house style and every mark stays inside the picture', t => {
  for (const width of widths) {
    const f=fixture(t,NAME,{width}); f.load(); f.open();
    const [,,boxW,boxH]=f.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/).map(Number);
    for (const time of [0,5,7,10,15,17,19.5,20,22,25,27,30,32,35,39.9,scene.duration]) {
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
        shown(text.replace(/ (?:to go|past)$/,''));
      }
      const wording=[...texts.map(node=>node.textContent),f.$('[data-caption]').textContent,
        f.$('[data-figure] svg').getAttribute('aria-label'),
        f.$('[data-controls] input[type="range"]').getAttribute('aria-valuetext')];
      for (const text of wording) assert.doesNotMatch(text,ASCII_MATH,`ASCII arithmetic in "${text}"`);
      // Nothing that claims to be in parameter space is drawn outside the valley.
      const left=Number(f.root.dataset.plotLeft), right=Number(f.root.dataset.plotRight);
      const top=Number(f.root.dataset.plotTop), bottom=Number(f.root.dataset.plotBottom);
      for (const [,x,y] of f.$('[data-iterate]').getAttribute('d').matchAll(/([ML]) (-?[\d.]+) (-?[\d.]+)/g)
        .map(m=>[m[1],Number(m[2]),Number(m[3])]))
        assert(x>=left-6&&x<=right+6&&y>=top-6&&y<=bottom+6,`the iterate leaves the valley at ${time}s`);
      // And every link stays on its own rail's stack rather than climbing into the valley.
      for (const axis of ['across','along'])
        for (const link of chainOf(f,axis))
          assert(link.row>bottom&&link.row<boxH,`a ${axis} link is drawn outside its rail at ${time}s`);
    }
  }
});

test('momentum memory: the layout reflows once and the wide picture keeps equal scale', t => {
  for (const width of widths) {
    const f=fixture(t,NAME,{width}); f.load(); f.open(); f.seek(scene.duration);
    const fx=declared(f);
    assert.equal(f.root.dataset.layout,width<560?'narrow':'wide',`${width}px`);
    const [,,boxW,boxH]=f.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/).map(Number);
    assert.deepEqual([boxW,boxH],width<560?[296,390]:[713,486]);
    const along=Number(f.root.dataset.unitAlong), across=Number(f.root.dataset.unitAcross);
    const left=Number(f.root.dataset.plotLeft), right=Number(f.root.dataset.plotRight);
    const top=Number(f.root.dataset.plotTop), bottom=Number(f.root.dataset.plotBottom);
    close((right-left)/(fx.window[1]-fx.window[0]),along,1e-9);
    close((bottom-top)/(fx.window[3]-fx.window[2]),across,1e-9);
    // One pixel per parameter unit in both directions at the page's own figure width, so
    // the valley the reader sees there is as narrow as the declared curvature makes it.
    if (width>=560) {close(along,across,1e-9); close(along,50,1e-9);}
    else assert(across/along>1.5&&across/along<2.5,`narrow magnification ${across/along}`);
  }
  // Resizing a live player rebuilds the same picture the fresh render gives.
  const wide=fixture(t,NAME,{width:713}); wide.load(); wide.open(); wide.seek(24.375);
  wide.resize(375); wide.resize(713);
  const fresh=fixture(t,NAME,{width:713}); fresh.load(); fresh.open(); fresh.seek(24.375);
  assert.equal(canonicalMarkup(wide.$('[data-figure]').innerHTML),
    canonicalMarkup(fresh.$('[data-figure]').innerHTML));
});

test('momentum memory: seeking reconstructs the whole published state, not just the drawing', t => {
  const f=fixture(t,NAME); f.load(); f.open();
  const snapshot=()=>({markup:canonicalMarkup(f.$('[data-pane]').innerHTML.replace(/aria-valuetext="[^"]*"/g,'')),
    state:JSON.stringify(f.root.dataset)});
  const probes=[0,4.4,7.75,9.9,12.5,16.2,18.9,21.3,26.75,31.4,34.8,36.5,39.9,scene.duration];
  const first=probes.map(time=>{f.seek(time); return snapshot();});
  f.play(); f.tick(6000); f.seek(3); f.play(); f.tick(2000);
  probes.forEach((time,index)=>{f.seek(time); assert.deepEqual(snapshot(),first[index],`replay differs at ${time}s`);});
  [...probes].reverse().forEach(time=>{
    const index=probes.indexOf(time);
    f.seek(time); assert.deepEqual(snapshot(),first[index],`reverse seek differs at ${time}s`);
  });
});

test('momentum memory: the committed static fallback is a fresh render of the final frame', async t => {
  const generated=await staticFrame(NAME);
  assert.equal(generated.before,generated.after,
    'interactives/momentum-memory/panel.html is stale: run scripts/render_static_frames.cjs momentum-memory');
  const panel=read('momentum-memory/panel.html');
  assert(panel.includes('<g data-static-frame="narrow"'),'a reflowing scene ships a narrow print');
  assert(/preserveAspectRatio="xMinYMin meet"/.test(panel));
  const narrow=/<g data-static-frame="narrow"[\s\S]*?<\/g>\s*<!-- \/static-frame-narrow -->/.exec(panel)[0];
  // Local ids in the second print are namespaced, so its clip path cannot resolve to the
  // wide geometry, and geometry is serialised at four decimals as the contract requires.
  assert(narrow.includes('id="mm-plot-clip--static-narrow"'));
  assert(narrow.includes('url(#mm-plot-clip--static-narrow)'));
  for (const [,value] of narrow.matchAll(/ (?:cx|cy|x|y|x1|y1|x2|y2|width|height)="(-?\d+\.\d+)"/g))
    assert(value.split('.')[1].length<=4,`${value} is serialised past 0.0001 px`);
  for (const [,value] of narrow.matchAll(/ d="([^"]*)"/g))
    for (const [,number] of value.matchAll(/(-?\d+\.\d+)/g))
      assert(number.split('.')[1].length<=4,`${number} is serialised past 0.0001 px`);
});

test('momentum memory: the panel names its computed variants and its boundary', t => {
  const f=fixture(t,NAME), fx=declared(f);
  const boundary=f.$('.mechanism-boundary').textContent;
  assert.match(boundary,/not a larger learning rate/);
  assert.match(boundary,/both runs here use the same/);
  assert.match(boundary,/quadratic valley is the easy case/);
  assert.match(boundary,/schematic/);
  assert.match(boundary,/low end of the chapter's printed range/);
  assert.match(boundary,/same recursion with nothing kept/);
  assert.match(boundary,/oscillation boundary/);
  assert.match(boundary,/Nothing is trained/);
  assert.match(boundary,/Nesterov/); assert.match(boundary,/Adam/);
  assert.match(boundary,/out of scope here/);
  // One visible sentence; every further qualifier inside the closed scope disclosure.
  const scope=f.$('.mechanism-scope');
  assert.equal(scope.open,false);
  const lead=[...f.$('.mechanism-boundary').children].filter(node=>node.tagName==='P');
  assert.equal(lead.length,1,'the boundary shows exactly one sentence outside the disclosure');
  assert(lead[0].textContent.trim().split(/\s+/).length<=34);
  assert(lead[0].textContent.includes(String(fx.rate)),'the shared step length is named');
  const check=f.$('.mechanism-check');
  assert.equal(check.open,false);
  assert(check.querySelector('summary').textContent.replace('Check yourself.','').trim().split(/\s+/).length<=40);
  assert(check.querySelector('p').textContent.trim().split(/\s+/).length<=70);
  assert.doesNotMatch(check.textContent,ASCII_MATH);
  // The transfer answer's numbers: a constant gradient drives the sum to g/(1 − beta), an
  // alternating one only to g/(1 + beta), and raising beta separates them further.
  const answer=check.querySelector('p').textContent;
  const g=gradAt(fx,fx.start)[0];
  const settle=(b,sign)=>{let v=0; for (let k=0;k<4000;k++) v=b*v+(sign?(-1)**k*g:g); return v;};
  for (const [b,agree,alternate,ratio] of [[0.9,100,5.2632,19],[0.95,200,5.1282,39]]) {
    close(g/(1-b),agree,1e-9); close(g/(1+b),alternate,5e-5);
    close(Math.abs(settle(b,false)),agree,1e-6);
    close(Math.abs(settle(b,true)),alternate,5e-5);
    close((1+b)/(1-b),ratio,1e-9);
    assert(answer.includes(String(agree)),`${agree}`);
    assert(answer.includes(alternate.toFixed(4)),`${alternate}`);
    assert(answer.includes(String(ratio)),`${ratio}`);
  }
  assert(answer.includes(String(fx.beta))&&answer.includes('0.95'));
  // And it is a transfer, not a reading: neither settling value is anywhere on the picture.
  f.load(); f.open();
  for (const time of [0,10,20,30,scene.duration]) {
    f.seek(time);
    const printed=[...f.$('[data-drawing]').querySelectorAll('text')].map(node=>node.textContent).join(' ');
    for (const value of ['100','200','5.2632','5.1282']) assert(!printed.includes(value),`${value} is drawn`);
  }
});

test('momentum memory: the transcript lists one item per beat in the order they play', t => {
  const f=fixture(t,NAME); f.load(); f.open();
  const items=[...f.$('.mechanism-transcript ol').children];
  assert.equal(items.length,scene.beats.length);
  for (const item of items) assert.doesNotMatch(item.textContent,ASCII_MATH);
  const story=items.map(item=>item.textContent).join(' ');
  for (const number of ['(0.25, 10)','6.6342','18.5','30.0162','33.7164','2.8355','30.3916','0.6754'])
    assert(story.includes(number),number);
});
