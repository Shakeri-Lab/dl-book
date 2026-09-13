#!/usr/bin/env node
// Test-only linear algebra and picture checks; no test dependency ships.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const {ROOT,read,entry,chapterSource,numbers,close,canonicalMarkup,fixture,
  registerTransportTests,registerBeatHoldTest,registerGrammarTests}=require('./html-tests/excerpt-harness.cjs');
const {staticFrame}=require('./render_static_frames.cjs');

const NAME='same-subspace-excerpt',scene=entry(NAME);
const widths=[240,296,360,519,520,553,713];
const sum=values=>values.reduce((total,value)=>total+value,0);
const dot=(a,b)=>sum(a.map((value,j)=>value*b[j]));
const add=(a,b)=>a.map((value,j)=>value+b[j]);
const subtract=(a,b)=>a.map((value,j)=>value-b[j]);
const norm=a=>Math.sqrt(dot(a,a));
const columns=a=>a[0].map((_,j)=>a.map(row=>row[j]));
const project=(basis,x)=>basis.map(row=>sum(columns(basis).map((column,j)=>row[j]*dot(column,x))));
const outerProjector=basis=>basis.map(left=>basis.map(right=>dot(left,right)));
const apply=(matrix,x)=>matrix.map(row=>dot(row,x));
const product=(a,b)=>a.map(row=>columns(b).map(column=>dot(row,column)));
const identity=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>Number(i===j)));
const closeTree=(actual,expected,epsilon=1e-12)=>{
  if(Array.isArray(expected)) {
    assert(Array.isArray(actual));assert.equal(actual.length,expected.length);
    expected.forEach((value,j)=>closeTree(actual[j],value,epsilon));
  } else close(actual,expected,epsilon);
};
const attr=(node,key)=>Number(node.getAttribute(key));
const json=(f,key)=>JSON.parse(f.root.dataset[key]);
const drawing=f=>f.$('[data-drawing]');
const visible=node=>node&&!node.closest('[hidden]');
const declared=f=>({basis:json(f,'basis'),input:json(f,'input'),turnDegrees:Number(f.root.dataset.turnDegrees)});
const screen=(f,point)=>{const origin=json(f,'origin'),unit=Number(f.root.dataset.pixelsPerUnit);
  return [origin[0]+unit*point[0],origin[1]-unit*point[1]];};
function pathShaft(node) {
  // All arrowheads follow the initial M ... L ... shaft. Read geometry, not its
  // duplicated data-start/data-end receipt, so a detached arrow cannot pass.
  const match=/^M\s+([-+\deE.]+)\s+([-+\deE.]+)\s+L\s+([-+\deE.]+)\s+([-+\deE.]+)/.exec(node.getAttribute('d'));
  assert(match,'the arrow has an inspectable straight shaft');
  return [match.slice(1,3).map(Number),match.slice(3,5).map(Number)];
}
function verifyState(state,source,angle) {
  const c=Math.cos(angle),s=Math.sin(angle),Q=[[c,-s],[s,c]],V=source.basis;
  const rotated=V.map(row=>[row[0]*c+row[1]*s,-row[0]*s+row[1]*c]);
  // Compute the new code directly as dot products with the rotated ambient
  // basis. This independently checks the player's Q-transpose latent route.
  const z=columns(V).map(axis=>dot(axis,source.input));
  const code=columns(rotated).map(axis=>dot(axis,source.input));
  const components=columns(rotated).map((axis,j)=>axis.map(value=>value*code[j]));
  const reconstruction=project(V,source.input),P=outerProjector(V);
  close(state.angle,angle);closeTree(state.Q,Q);closeTree(state.basis,V);closeTree(state.z,z);
  closeTree(state.rotatedBasis,rotated);closeTree(state.coordinates,code);
  closeTree(state.components,components);closeTree(state.reconstruction,reconstruction);
  closeTree(add(...state.components),reconstruction);
  closeTree(state.projector,P);closeTree(state.referenceProjector,P);
  closeTree(product(P,P),P);closeTree(columns(P),P);
  closeTree(product(columns(rotated),rotated),identity(2));
  closeTree(product(state.Q,columns(state.Q)),identity(2));
  closeTree(state.chartBasis,Q);
  closeTree(state.chartComponents,components.map(component=>columns(V).map(axis=>dot(axis,component))));
  closeTree(state.chartPoint,z);
  const residual=subtract(source.input,state.reconstruction);
  columns(V).forEach(axis=>close(dot(axis,residual),0));
  return {Q,rotated,z,code,components,reconstruction,P,residual};
}

registerTransportTests(NAME,{witness:/same projector/,anchors:['same-subspace-playback-help'],width:713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('same subspace: the manuscript owns the identity while the point and turn are explicitly schematic',t=>{
  const f=fixture(t,NAME),source=declared(f),chapter=chapterSource(NAME);
  assert.equal(scene.qmd,'chapters/interludes/making-pca-learnable.qmd');
  assert.equal(scene.anchor.type,'before-heading');assert.equal(scene.anchor.target,'What if the map could bend?');
  assert.equal(scene.duration,40);assert.deepEqual(scene.beats,[0,5,10,15,20,25,30,35]);
  assert.equal(f.root.dataset.evidenceClass,'schematic');
  assert.equal(source.basis.length,3);assert.equal(source.input.length,3);
  closeTree(product(columns(source.basis),source.basis),identity(2));
  assert(norm(subtract(source.input,project(source.basis,source.input)))>0,
    'the chosen ambient point has a genuine discarded component, even though the picture looks along its projection');
  for(const literal of scene.fixture.literals) assert(chapter.includes(literal),literal);
  assert.match(chapter,/orthogonal[\s\S]*reconstruction projector stays fixed/);
  assert.match(chapter,/not a claim that every optimizer run succeeds/);
});

test('same subspace: the changing encoder and decoder preserve projection and residual at every time',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  assert.equal(typeof f.w.BookSameSubspace.buildState,'function');
  const baselineResidual=norm(subtract(source.input,project(source.basis,source.input)));
  for(let n=0;n<=160;n++) {
    const time=n/4;f.seek(time);
    const state=f.w.BookSameSubspace.buildState(time),want=verifyState(state,source,Number(f.root.dataset.angle));
    for(const [attribute,key] of [['rotation','Q'],['coordinates','coordinates'],['originalCoordinates','z'],
      ['rotatedBasis','rotatedBasis'],['components','components'],['reconstruction','reconstruction'],
      ['projector','projector'],['referenceProjector','referenceProjector'],['chartBasis','chartBasis'],
      ['chartPoint','chartPoint'],['chartComponents','chartComponents']]) closeTree(json(f,attribute),state[key]);
    close(norm(want.residual),baselineResidual);
  }
});

test('same subspace: negative angles and complete turns work for arbitrary orthonormal ambient bases',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  const a=Math.SQRT1_2;
  const fixtures=[declared(f),
    {basis:[[a,0],[a,0],[0,1]],input:[0.7,-0.3,0.25]},
    {basis:[[1,0],[0,-1],[0,0]],input:[0.2,-0.6,0.4]},
    {basis:[[a,0],[0,a],[a,0],[0,-a]],input:[0.3,0.6,-0.2,0.7]}
  ];
  for(const sample of fixtures) for(const degrees of [-720,-360,-135,-60,-17,0,30,60,90,180,360,765]) {
    const source={...sample,turnDegrees:degrees},before=JSON.stringify(source);
    const state=f.w.BookSameSubspace.buildState(40,false,source);
    verifyState(state,source,degrees*Math.PI/180);
    assert.equal(JSON.stringify(source),before,'the arithmetic does not rotate or mutate its input data');
  }
});

test('same subspace: Q transpose is necessary; rotating only one map changes the reconstruction',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  const state=f.w.BookSameSubspace.buildState(40),want=verifyState(state,source,source.turnDegrees*Math.PI/180);
  assert(norm(subtract(want.code,want.z))>0.1,'the default nonzero turn genuinely changes coordinates');
  assert(want.code[1]<0,'the final second coordinate is negative, not its unsigned projection length');
  const wrongEncoder=apply(want.rotated,apply(want.Q,want.z));
  const fixedEncoder=apply(want.rotated,want.z);
  const fixedDecoder=apply(source.basis,want.code);
  for(const wrong of [wrongEncoder,fixedEncoder,fixedDecoder])
    assert(norm(subtract(wrong,want.reconstruction))>0.1);
  close(norm(want.code),norm(want.z));
});

test('same subspace: invalid dimensions and nonorthonormal bases cannot silently become projectors',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  const invalid=[{...source,basis:[[1,0],[0,2],[0,0]]},
    {...source,basis:[[1,1],[0,0],[0,0]]},{...source,basis:[[1],[0],[0]]},
    {...source,input:[1,2]},{...source,input:[NaN,0,0]},
    {...source,turnDegrees:Infinity}];
  for(const altered of invalid)
    assert.throws(()=>f.w.BookSameSubspace.buildState(40,false,altered),/basis|orthonormal|finite|input/i);
});

test('same subspace: each turn finishes at its beat and holds while the reader inspects the new coordinates',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  const total=source.turnDegrees*Math.PI/180,builder=f.w.BookSameSubspace.buildState;
  for(const [time,fraction] of [[0,0],[5,0],[10,0],[12,0],[13.5,0.25],[15,0.5],
    [16,0.5],[17,0.5],[18.5,0.75],[20,1],[25,1],[30,1],[35,1],[40,1]])
    close(builder(time).angle,total*fraction);
  for(const [from,to,start,end] of [[12,15,0,total/2],[17,20,total/2,total]]) {
    let previous=start;
    for(let n=0;n<=20;n++) {
      const angle=builder(from+(to-from)*n/20).angle;
      assert(angle>=previous-1e-12&&angle<=end+1e-12);previous=angle;
    }
    close(previous,end);
  }
  for(const [time,fraction] of [[10,0],[12.5,0],[14.99,0],[15,0.5],[18,0.5],[19.99,0.5],[20,1],[39,1]])
    close(builder(time,true).angle,total*fraction);
});

test('same subspace: axes, projection drops, and the decoder appear in their explanatory order',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const time of [0,4.99,5,9.99,10,12.5,15,20,24.99,25,30,35,40]) {
    f.seek(time);const state=f.w.BookSameSubspace.buildState(time);
    for(const node of drawing(f).querySelectorAll('[data-axis],[data-axis-label]'))
      assert.equal(Boolean(visible(node)),time>=5);
    for(const node of drawing(f).querySelectorAll('[data-projection],[data-foot],[data-coordinate-label]'))
      assert.equal(Boolean(visible(node)),time>=10);
    for(const node of drawing(f).querySelectorAll('[data-component]')) assert.equal(Boolean(visible(node)),time>=25);
    for(const node of drawing(f).querySelectorAll('[data-ghost-axis]'))
      assert.equal(Boolean(visible(node)),Math.abs(state.angle)>1e-12);
    const formula=f.$('[data-formula]');
    assert.equal(formula.classList.contains('ss-encoder-shown'),time>=15);
    assert.equal(formula.classList.contains('ss-decoder-shown'),time>=25);
    assert.equal(formula.classList.contains('ss-projector-shown'),time>=30);
  }
});

test('same subspace: the point is fixed because the computed components add to it, not because the drawing is frozen',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  for(const width of widths) {
    f.resize(width);let reference;
    for(const time of [0,5,10,13.5,15,18.5,20,25,30,40]) {
      f.seek(time);const state=f.w.BookSameSubspace.buildState(time),point=f.$('[data-point]');
      verifyState(state,source,state.angle);
      const position=[attr(point,'cx'),attr(point,'cy')];closeTree(position,screen(f,state.chartPoint));
      if(reference) closeTree(position,reference);else reference=position;
      const origin=json(f,'origin'),corner=screen(f,state.chartComponents[0]);
      for(let j=0;j<2;j++) {
        const arrow=f.$(`[data-component="${j}"]`),from=j===0?origin:corner,to=j===0?corner:position;
        closeTree(pathShaft(arrow),[from,to]);
        closeTree(JSON.parse(arrow.dataset.start),from);closeTree(JSON.parse(arrow.dataset.end),to);
      }
      const a=pathShaft(f.$('[data-component="0"]')),b=pathShaft(f.$('[data-component="1"]'));
      closeTree(a[1],b[0]);closeTree(b[1],position);
      const secondShaft=subtract(b[1],b[0]),secondChart=state.chartComponents[1];
      closeTree(secondShaft,[Number(f.root.dataset.pixelsPerUnit)*secondChart[0],-Number(f.root.dataset.pixelsPerUnit)*secondChart[1]]);
    }
  }
});

test('same subspace: rotating axes and perpendicular drops use the same chart and scale',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const width of widths) {
    f.resize(width);
    for(const time of [10,13.5,15,18.5,20,25,40]) {
      f.seek(time);const state=f.w.BookSameSubspace.buildState(time),origin=json(f,'origin');
      const extent=Number(f.root.dataset.axisExtent),unit=Number(f.root.dataset.pixelsPerUnit);
      assert(extent>0&&unit>0);
      for(let j=0;j<2;j++) {
        const axis=columns(state.chartBasis)[j];
        const start=[origin[0]-extent*axis[0],origin[1]+extent*axis[1]];
        const end=[origin[0]+extent*axis[0],origin[1]-extent*axis[1]];
        closeTree(pathShaft(f.$(`[data-axis="${j}"]`)),[start,end]);
        const drop=f.$(`[data-projection="${j}"]`),foot=f.$(`[data-foot="${j}"]`);
        const point=screen(f,state.chartPoint),projection=screen(f,state.chartComponents[j]);
        closeTree([attr(drop,'x1'),attr(drop,'y1')],point);
        closeTree([attr(drop,'x2'),attr(drop,'y2')],projection);
        closeTree([attr(foot,'cx'),attr(foot,'cy')],projection);
        close(dot(subtract(point,projection),[axis[0],-axis[1]]),0,1e-10);
      }
    }
  }
});

test('same subspace: negative turns keep a visible original-basis reference and prime the changed coordinates',t=>{
  for(const degrees of [-60,-135,60]) {
    const f=fixture(t,NAME);f.root.dataset.turnDegrees=String(degrees);f.load();f.open();f.seek(20);
    assert([...drawing(f).querySelectorAll('[data-ghost-axis]')].every(visible));
    for(const node of drawing(f).querySelectorAll('[data-axis-label],[data-coordinate-label]'))
      assert.match(node.textContent,/[\u2032']/);
  }
});

test('same subspace: alternate ambient points reach their own reconstructed chart position',t=>{
  const a=Math.SQRT1_2,source={basis:[[a,0],[0,1],[a,0]],input:[0.4,-0.2,0.6],turnDegrees:-45};
  const f=fixture(t,NAME);f.root.dataset.basis=JSON.stringify(source.basis);
  f.root.dataset.input=JSON.stringify(source.input);f.root.dataset.turnDegrees=String(source.turnDegrees);
  f.load();f.open();
  for(const time of [0,15,20,25,40]) {
    f.seek(time);const state=f.w.BookSameSubspace.buildState(time);verifyState(state,source,state.angle);
    closeTree([attr(f.$('[data-point]'),'cx'),attr(f.$('[data-point]'),'cy')],screen(f,state.chartPoint));
  }
});

test('same subspace: arbitrary seek and resize histories reproduce the complete published frame',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  const snapshot=()=>JSON.stringify({drawing:canonicalMarkup(f.$('[data-figure]').innerHTML),
    formula:canonicalMarkup(f.$('[data-formula]').outerHTML),caption:f.$('[data-caption]').innerHTML,
    state:Object.fromEntries(Object.entries(f.root.dataset).filter(([key])=>!['time','playing','typeset'].includes(key)))});
  const times=[0,5,10,12.2,14.3,15,17.7,19.8,20,25,30,35,40];
  const first=times.map(time=>{f.seek(time);return snapshot();});
  f.play();f.tick(1111);f.resize(296);f.seek(18.4);f.resize(713);
  assert.deepEqual(times.toReversed().map(time=>{f.seek(time);return snapshot();}),first.toReversed());
});

test('same subspace: mobile reflow retains readable labels and complete visible geometry',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const width of widths) {
    f.resize(width);
    for(const time of [0,5,10,13.5,15,18.5,20,25,30,35,40]) {
      f.seek(time);const svg=f.$('[data-figure] svg'),box=numbers(svg.getAttribute('viewBox'));
      assert.equal(box[2],width);assert.equal(svg.getAttribute('preserveAspectRatio'),'xMinYMin meet');
      assert.equal(f.root.dataset.layout,width<520?'narrow':'wide');
      for(const node of [...drawing(f).querySelectorAll('text')].filter(visible)) {
        assert(attr(node,'font-size')>=12,`small text at ${width}px: ${node.textContent}`);
        assert(attr(node,'x')>=0&&attr(node,'x')<=width);assert(attr(node,'y')>=0&&attr(node,'y')<=box[3]);
      }
      for(const node of [...drawing(f).querySelectorAll('circle')].filter(visible)) {
        assert(attr(node,'cx')-attr(node,'r')>=0&&attr(node,'cx')+attr(node,'r')<=width);
        assert(attr(node,'cy')-attr(node,'r')>=0&&attr(node,'cy')+attr(node,'r')<=box[3]);
      }
      for(const node of [...drawing(f).querySelectorAll('line')].filter(visible))
        for(const [coordinate,limit] of [['x1',width],['x2',width],['y1',box[3]],['y2',box[3]]])
          assert(attr(node,coordinate)>=0&&attr(node,coordinate)<=limit);
      assert(drawing(f).querySelectorAll('*').length<150);
    }
  }
});

test('same subspace: wide and narrow script-free prints reproduce the final calculated geometry',async t=>{
  const generated=await staticFrame(NAME);
  assert.equal(generated.before,generated.after,'regenerate the same-subspace static frames');
  const f=fixture(t,NAME),narrow=f.$('[data-static-frame="narrow"]');
  assert(narrow);assert.equal(narrow.dataset.width,'296');
  const height=Number(narrow.dataset.height),ids=[...f.root.querySelectorAll('[id]')].map(node=>node.id);
  assert.equal(ids.length,new Set(ids).size);
  for(const print of [drawing(f),narrow]) {
    assert.match(print.textContent,/same projector/);
    assert.equal(print.querySelectorAll('[data-axis]').length,2);
    assert.equal(print.querySelectorAll('[data-component]').length,2);
    assert(print.querySelector('[data-point]'));
  }
  f.load();f.open();f.seek(40);f.resize(296);
  assert.equal(f.root.querySelectorAll('[data-static-frame="narrow"]').length,0);
  assert.equal(numbers(f.$('[data-figure] svg').getAttribute('viewBox'))[3],height);
  const css=read('same-subspace/player.css');
  assert.match(css,/@container\s*\(max-width:\s*519px\)/);
  assert.match(css,new RegExp(`aspect-ratio:\\s*296\\s*/\\s*${height}`));
});

test('same subspace: this coordinate illustration is not a claim about training or the later rank-one experiment',t=>{
  const f=fixture(t,NAME),boundary=f.$('.mechanism-boundary').textContent;
  assert.match(boundary,/fixed subspace/);assert.match(boundary,/not a training trajectory/i);
  assert.match(boundary,/not measured values/i);assert.match(boundary,/both maps change together/i);
  assert.match(boundary,/one-dimensional[\s\S]*sign flip[\s\S]*not this two-axis rotation/i);
  f.load();f.open();assert.equal(f.root.querySelectorAll('input[type="range"]').length,1);
  const filter=fs.readFileSync(path.join(ROOT,scene.filter),'utf8');
  assert.match(filter,/^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
  assert.doesNotMatch(read('same-subspace/player.js'),/Math\.random|fetch\(|import\(|setInterval\(/);
  assert.doesNotMatch(read('same-subspace/panel.html'),/@eq-/);
});
