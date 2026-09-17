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
// Drawing coordinates are serialised at 0.0001 px. The published state is never rounded,
// so every arithmetic comparison below keeps the 1e-12 default.
const PX=1e-4;
// What the mounted player publishes: the fixed old coordinates once, and the turning
// basis, new coordinates and components whenever the angle changes. The oracle below
// recomputes all of it from the panel's declared fixture.
const published=f=>({angle:Number(f.root.dataset.angle),z:json(f,'originalCoordinates'),
  rotatedBasis:json(f,'rotatedBasis'),coordinates:json(f,'coordinates'),components:json(f,'components')});
const screen=(f,point)=>{const origin=json(f,'origin'),unit=Number(f.root.dataset.pixelsPerUnit);
  return [origin[0]+unit*point[0],origin[1]-unit*point[1]];};
const chart=(source,vector)=>columns(source.basis).map(axis=>dot(axis,vector));
function mount(t,source,options={}) {
  const f=fixture(t,NAME,options);
  if(source) {
    f.root.dataset.basis=JSON.stringify(source.basis);f.root.dataset.input=JSON.stringify(source.input);
    f.root.dataset.turnDegrees=String(source.turnDegrees);
  }
  return f;
}
function pathShaft(node) {
  // All arrowheads follow the initial M ... L ... shaft. Read the drawn geometry,
  // so a detached arrow cannot pass.
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
  close(state.angle,angle);closeTree(state.z,z);
  closeTree(state.rotatedBasis,rotated);closeTree(state.coordinates,code);
  closeTree(state.coordinates,apply(columns(Q),state.z));
  closeTree(state.components,components);
  closeTree(add(...state.components),reconstruction);
  // The identity itself, on the basis the player published: (VQ)(VQ)^T = V V^T.
  closeTree(outerProjector(state.rotatedBasis),P);
  closeTree(product(P,P),P);closeTree(columns(P),P);
  closeTree(product(columns(state.rotatedBasis),state.rotatedBasis),identity(2));
  closeTree(product(Q,columns(Q)),identity(2));
  const residual=subtract(source.input,add(...state.components));
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

test('same subspace: the intro points at the note that states the identity, not at whatever sits above the panel',t=>{
  const f=fixture(t,NAME),intro=f.$('.mechanism-intro').textContent,chapter=chapterSource(NAME);
  assert.doesNotMatch(intro,/\babove\b/i,'a callout about SVD and tanh sits directly above the insertion point');
  assert.match(intro,/orthogonal-basis identity in this section's note/);
  const title=/“([^”]+?)\.?”/.exec(intro);
  assert(title,'the intro names the note by its title');
  // The pointer is true only while that note, holding the identity, sits in the same
  // section as the panel: after the section's H2 and before the heading the panel precedes.
  const section=chapter.indexOf('\n## Make PCA learnable'),note=chapter.indexOf(`\n## ${title[1]}\n`);
  const identity=chapter.indexOf('(\\matr{V}_k\\matr{Q})(\\matr{V}_k\\matr{Q})^\\top'),anchor=chapter.indexOf(`\n## ${scene.anchor.target}`);
  assert(section>=0&&note>section&&identity>note&&anchor>identity,'section, note, identity and insertion point appear in that order');
  // "This section" is true only if no other section heading intervenes: every later
  // "## " line before the panel must be the title line of a callout.
  const lines=chapter.slice(section+1,anchor).split('\n');
  lines.forEach((line,index)=>{
    if(index>0&&/^## /.test(line)) assert.match(lines[index-1],/^:::+ \{\.callout-/,`a section heading intervenes: ${line}`);
  });
});

test('same subspace: the changing encoder and decoder preserve projection and residual at every time',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  const baselineResidual=norm(subtract(source.input,project(source.basis,source.input)));
  const angles=new Set();
  for(let n=0;n<=160;n++) {
    f.seek(n/4);
    const state=published(f),want=verifyState(state,source,state.angle);angles.add(state.angle);
    close(norm(want.residual),baselineResidual);
  }
  assert(angles.size>10,'the oracle saw the basis at many intermediate angles, not only at rest');
});

test('same subspace: negative angles and complete turns work for arbitrary orthonormal ambient bases',t=>{
  const a=Math.SQRT1_2,shipped=declared(fixture(t,NAME));
  const fixtures=[shipped,
    {basis:[[a,0],[a,0],[0,1]],input:[0.7,-0.3,0.25]},
    {basis:[[1,0],[0,-1],[0,0]],input:[0.2,-0.6,0.4]},
    {basis:[[a,0],[0,a],[a,0],[0,-a]],input:[0.3,0.6,-0.2,0.7]}
  ];
  for(const sample of fixtures) for(const degrees of [-720,-360,-135,-60,-17,0,30,60,90,180,360,765]) {
    const source={...sample,turnDegrees:degrees},f=mount(t,source);f.load();f.open();f.seek(40);
    const want=verifyState(published(f),source,degrees*Math.PI/180);
    closeTree([attr(f.$('[data-point]'),'cx'),attr(f.$('[data-point]'),'cy')],screen(f,chart(source,want.reconstruction)),PX);
    assert.deepEqual(declared(f),source,'the player does not rotate or rewrite its declared fixture');
  }
});

test('same subspace: Q transpose is necessary; rotating only one map changes the reconstruction',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();f.seek(40);
  const want=verifyState(published(f),source,source.turnDegrees*Math.PI/180);
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
  const source=declared(fixture(t,NAME));
  const invalid=[{...source,basis:[[1,0],[0,2],[0,0]]},
    {...source,basis:[[1,1],[0,0],[0,0]]},{...source,basis:[[1],[0],[0]]},
    {...source,input:[1,2]},{...source,input:[NaN,0,0]},
    {...source,turnDegrees:Infinity}];
  for(const altered of invalid) {
    const f=mount(t,altered);
    assert.throws(()=>f.load(),/basis|orthonormal|finite|input/i);
    assert(!f.root.dataset.ready,'a rejected fixture never mounts a player');
    assert.match(drawing(f).textContent,/same projector/,'the script-free print is left in place');
  }
});

test('same subspace: each turn finishes at its beat and holds while the reader inspects the new coordinates',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  const total=source.turnDegrees*Math.PI/180,angleAt=(g,time)=>{g.seek(time);return Number(g.root.dataset.angle);};
  for(const [time,fraction] of [[0,0],[5,0],[10,0],[12,0],[13.5,0.25],[15,0.5],
    [16,0.5],[17,0.5],[18.5,0.75],[20,1],[25,1],[30,1],[35,1],[40,1]])
    close(angleAt(f,time),total*fraction);
  for(const [from,to,start,end] of [[12,15,0,total/2],[17,20,total/2,total]]) {
    let previous=start;
    for(let n=0;n<=20;n++) {
      const angle=angleAt(f,from+(to-from)*n/20);
      assert(angle>=previous-1e-12&&angle<=end+1e-12);previous=angle;
    }
    close(previous,end);
  }
  const still=fixture(t,NAME,{reduced:true});still.load();still.open();
  for(const [time,fraction] of [[10,0],[12.5,0],[14.99,0],[15,0.5],[18,0.5],[19.99,0.5],[20,1],[39,1]])
    close(angleAt(still,time),total*fraction);
});

test('same subspace: axes, projection drops, and the decoder appear in their explanatory order',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const time of [0,4.99,5,9.99,10,12.5,15,20,24.99,25,30,35,40]) {
    f.seek(time);
    for(const node of drawing(f).querySelectorAll('[data-axis],[data-axis-label]'))
      assert.equal(Boolean(visible(node)),time>=5);
    for(const node of drawing(f).querySelectorAll('[data-projection],[data-foot],[data-coordinate-label]'))
      assert.equal(Boolean(visible(node)),time>=10);
    for(const node of drawing(f).querySelectorAll('[data-component]')) assert.equal(Boolean(visible(node)),time>=25);
    for(const node of drawing(f).querySelectorAll('[data-ghost-axis]'))
      assert.equal(Boolean(visible(node)),Math.abs(Number(f.root.dataset.angle))>1e-12);
    const formula=f.$('[data-formula]');
    assert.equal(formula.classList.contains('ss-encoder-shown'),time>=15);
    assert.equal(formula.classList.contains('ss-decoder-shown'),time>=25);
    assert.equal(formula.classList.contains('ss-projector-shown'),time>=30);
  }
});

// Review pass, September 17, 2026. Between 12 s and 15 s the axis and coordinate labels
// already read v′ and z′ while the side label still said "basis V / read both projections".
const labels=f=>{
  const text=selector=>[...drawing(f).querySelectorAll(selector)].map(node=>node.textContent);
  return {primed:[...text('[data-axis-label]'),...text('[data-coordinate-label]')].map(value=>/′/.test(value)),
    map:f.$('[data-map-label]').textContent,route:f.$('[data-route-label]').textContent,
    ghosts:[...drawing(f).querySelectorAll('[data-ghost-axis],[data-ghost-label]')].map(node=>Boolean(visible(node)))};
};
function assertLabelsAgree(f,time) {
  const seen=labels(f),turned=seen.primed[0];
  assert.deepEqual(seen.primed,Array(4).fill(turned),`all four labels are primed together at ${time}s`);
  assert.deepEqual(seen.ghosts,Array(3).fill(turned),`the dashed original axes and their legend follow the primes at ${time}s`);
  if(/basis$/.test(seen.map)) assert.equal(seen.map,turned?'turned basis':'original basis',`side label at ${time}s`);
  if(/projections|coordinates/.test(seen.route))
    assert.equal(seen.route,turned?'new coordinates':'read both projections',`route label at ${time}s`);
  return turned;
}

test('same subspace: the primes, the dashed reference and the side label switch together while the basis turns',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(let n=0;n<=800;n++) assertLabelsAgree(f,(f.seek(n/20),n/20));
  for(const width of [296,713]) {
    f.resize(width);
    for(const time of [10,11,11.9,12]) {
      f.seek(time);assert.equal(assertLabelsAgree(f,time),false);
      assert.equal(labels(f).map,'original basis');assert.equal(labels(f).route,'read both projections');
    }
    for(const time of [12.05,12.5,13,13.5,14,14.9,15,16,18.5,20,24.9]) {
      f.seek(time);assert.equal(assertLabelsAgree(f,time),true,`the basis has left its original position at ${time}s`);
      assert.equal(labels(f).map,'turned basis');assert.equal(labels(f).route,'new coordinates');
    }
  }
});

test('same subspace: under reduced motion every beat is one self-consistent still',t=>{
  const f=fixture(t,NAME,{reduced:true});f.load();f.open();
  for(let n=0;n<=800;n++) assertLabelsAgree(f,(f.seek(n/20),n/20));
  for(const time of [10,12.5,13.5,14.9]) {
    f.seek(time);assert.equal(assertLabelsAgree(f,time),false,`the beat-2 still has not turned at ${time}s`);
    assert.equal(Number(f.root.dataset.angle),0);assert.equal(labels(f).map,'original basis');
    assert.equal(labels(f).route,'read both projections');
  }
  for(const time of [15,16,19.9,20,24.9]) {
    f.seek(time);assert.equal(assertLabelsAgree(f,time),true);
    assert.equal(labels(f).map,'turned basis');assert.equal(labels(f).route,'new coordinates');
  }
});

test('same subspace: the picture names the bases in words; V, Q and VQ stay in the typeset formula line',t=>{
  const f=fixture(t,NAME);
  const pictureText=()=>[...f.$('[data-figure] svg').querySelectorAll('text')].map(node=>node.textContent);
  const wordsOnly=when=>{for(const text of pictureText())
    assert.doesNotMatch(text,/VQ|\bV\b|\bQ\b|\^|_|\bQT\b/,`plain-text matrix symbols on the picture ${when}: "${text}"`);};
  wordsOnly('in the script-free prints');
  const tex=f.formulas().map(span=>span.textContent).join(' ');
  assert.match(tex,/\\vect\{z\}'\}?=\\matr\{Q\}\^\{\\top\}/,'the encoder gives Q-transpose z');
  assert.match(tex,/\(\\matr\{V\}_k\\matr\{Q\}\)\\featurepart\{\\vect\{z\}'\}/,'the decoder uses V_k Q');
  f.load();f.open();
  const side=[];
  for(const beat of scene.beats) {f.seek(beat);wordsOnly(`at ${beat}s`);side.push(f.$('[data-map-label]').textContent);}
  assert.deepEqual(side,['','original basis','original basis','turned basis','turned basis','decode','basis changes cancel','same projector']);
  for(let n=0;n<=160;n++) {f.seek(n/4);wordsOnly(`at ${n/4}s`);}
});

test('same subspace: no test-only global; fixture and layout values are written once, turning values only while turning',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  assert.equal(f.w.BookSameSubspace,undefined,'the suite reads the published state; the player exports nothing');
  assert.deepEqual(Object.keys(f.root.dataset).filter(key=>!['player','playback','evidenceClass','basis','input','turnDegrees',
    'ready','duration','time','playing','typeset'].includes(key)).sort(),
    ['angle','axisExtent','components','coordinates','layout','origin','originalCoordinates','pixelsPerUnit','rotatedBasis','stage']);
  const written=(from,to)=>{
    f.seek(from);
    const observer=new f.w.MutationObserver(()=>{});
    observer.observe(f.root,{attributes:true});observer.observe(f.$('[data-figure] svg'),{attributes:true,childList:true,characterData:true,subtree:true});
    for(let time=from;time<=to+1e-9;time+=0.05) f.seek(Number(time.toFixed(4)));
    const records=observer.takeRecords();observer.disconnect();
    // data-time and data-playing belong to the shared transport, which writes them on every draw.
    return {root:[...new Set(records.filter(record=>record.target===f.root).map(record=>record.attributeName))]
        .filter(name=>!['data-time','data-playing'].includes(name)).sort(),
      picture:records.filter(record=>record.target!==f.root).length};
  };
  const turning=['data-angle','data-components','data-coordinates','data-rotated-basis'];
  assert.deepEqual(written(12.5,14.5).root,turning,'a glide rewrites the turning state and nothing static');
  for(const [from,to] of [[5.5,9.5],[15.5,16.9],[20.5,24.5],[35.5,39.5]]) {
    const hold=written(from,to);
    assert.deepEqual(hold.root,[],`the scene writes no state while the picture holds from ${from}s to ${to}s`);
    assert.equal(hold.picture,0,`the held picture is not redrawn from ${from}s to ${to}s`);
  }
  assert.deepEqual(written(12.5,14.5).root,turning);
  for(const path of drawing(f).querySelectorAll('path'))
    assert.deepEqual(path.getAttributeNames().filter(name=>/^data-(start|end)$/.test(name)),[],'an arrow carries its geometry once, in d');
});

test('same subspace: the point is fixed because the computed components add to it, not because the drawing is frozen',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  for(const width of widths) {
    f.resize(width);let reference;
    for(const time of [0,5,10,13.5,15,18.5,20,25,30,40]) {
      f.seek(time);const state=published(f),point=f.$('[data-point]'),want=verifyState(state,source,state.angle);
      const position=[attr(point,'cx'),attr(point,'cy')];closeTree(position,screen(f,chart(source,want.reconstruction)),PX);
      if(reference) closeTree(position,reference,PX);else reference=position;
      const origin=json(f,'origin'),corner=screen(f,chart(source,want.components[0]));
      for(let j=0;j<2;j++)
        closeTree(pathShaft(f.$(`[data-component="${j}"]`)),[j===0?origin:corner,j===0?corner:position],PX);
      const a=pathShaft(f.$('[data-component="0"]')),b=pathShaft(f.$('[data-component="1"]'));
      closeTree(a[1],b[0],PX);closeTree(b[1],position,PX);
      const unit=Number(f.root.dataset.pixelsPerUnit),second=chart(source,want.components[1]);
      closeTree(subtract(b[1],b[0]),[unit*second[0],-unit*second[1]],2*PX);
    }
  }
});

test('same subspace: rotating axes and perpendicular drops use the same chart and scale',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  for(const width of widths) {
    f.resize(width);
    for(const time of [10,13.5,15,18.5,20,25,40]) {
      f.seek(time);const state=published(f),want=verifyState(state,source,state.angle),origin=json(f,'origin');
      const extent=Number(f.root.dataset.axisExtent),unit=Number(f.root.dataset.pixelsPerUnit);
      assert(extent>0&&unit>0);
      for(let j=0;j<2;j++) {
        const axis=chart(source,columns(want.rotated)[j]);
        const start=[origin[0]-extent*axis[0],origin[1]+extent*axis[1]];
        const end=[origin[0]+extent*axis[0],origin[1]-extent*axis[1]];
        closeTree(pathShaft(f.$(`[data-axis="${j}"]`)),[start,end],PX);
        const drop=f.$(`[data-projection="${j}"]`),foot=f.$(`[data-foot="${j}"]`);
        const point=screen(f,chart(source,want.reconstruction)),projection=screen(f,chart(source,want.components[j]));
        closeTree([attr(drop,'x1'),attr(drop,'y1')],point,PX);
        closeTree([attr(drop,'x2'),attr(drop,'y2')],projection,PX);
        closeTree([attr(foot,'cx'),attr(foot,'cy')],projection,PX);
        close(dot(subtract([attr(drop,'x1'),attr(drop,'y1')],[attr(drop,'x2'),attr(drop,'y2')]),[axis[0],-axis[1]]),0,4*PX);
      }
    }
  }
});

// JSDOM measures no text, so label extents are estimates read off the browser preview:
// "same reconstruction" is about 124 px wide at 13 px, an axis label about 20 px.
const LABEL=126,TIP=20;
test('same subspace: the point label sits outside the plane on a leader, clear of every axis tip and its label',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const width of widths) {
    f.resize(width);
    for(const time of [0,5,10,12.5,13.5,15,16,17.5,18.5,20,25,30,35,40]) {
      f.seek(time);const where=`at ${width}px, ${time}s`;
      const plane=f.$('[data-plane]'),point=f.$('[data-point]'),text=f.$('[data-point-label]'),leader=f.$('[data-point-leader]');
      assert(visible(text)&&visible(leader));
      const span=text.getAttribute('text-anchor')==='end'?[attr(text,'x')-LABEL,attr(text,'x')]:[attr(text,'x'),attr(text,'x')+LABEL];
      const box={left:span[0],right:span[1],top:attr(text,'y')-11,bottom:attr(text,'y')+3};
      assert(box.left>=0&&box.right<=width,`the label's estimated extent stays inside the picture ${where}`);
      // The axis tips and their labels sweep a ring just inside the plane's edge, which is
      // where the label used to sit. Its nearest corner is now beyond that ring.
      const nearest=[Math.max(box.left,Math.min(box.right,attr(plane,'cx'))),box.bottom];
      assert(norm(subtract(nearest,[attr(plane,'cx'),attr(plane,'cy')]))>=attr(plane,'r')+12,`the point label is outside the plane ${where}`);
      for(const tip of drawing(f).querySelectorAll('[data-axis-label]')) {
        const apart=attr(tip,'x')+TIP/2+4<box.left||attr(tip,'x')-TIP/2-4>box.right||attr(tip,'y')-11>box.bottom+4||attr(tip,'y')+3<box.top-4;
        assert(apart,`an axis label meets the point label ${where}`);
      }
      const from=[attr(leader,'x1'),attr(leader,'y1')],to=[attr(leader,'x2'),attr(leader,'y2')];
      close(norm(subtract(from,[attr(point,'cx'),attr(point,'cy')])),9,PX);
      assert(to[1]>box.bottom&&to[1]-box.bottom<=8,`the leader ends just under the label ${where}`);
      assert(to[0]>=box.left&&to[0]<=box.right,`the leader meets the label, not the space beside it ${where}`);
    }
  }
});

test('same subspace: negative turns keep a visible original-basis reference and prime the changed coordinates',t=>{
  for(const degrees of [-60,-135,60]) {
    const f=fixture(t,NAME);f.root.dataset.turnDegrees=String(degrees);f.load();f.open();f.seek(20);
    assert([...drawing(f).querySelectorAll('[data-ghost-axis]')].every(visible));
    for(const node of drawing(f).querySelectorAll('[data-axis-label],[data-coordinate-label]'))
      assert.match(node.textContent,/[\u2032']/);
    assert.equal(f.$('[data-map-label]').textContent,'turned basis');
  }
});

test('same subspace: alternate ambient points reach their own reconstructed chart position',t=>{
  const a=Math.SQRT1_2,source={basis:[[a,0],[0,1],[a,0]],input:[0.4,-0.2,0.6],turnDegrees:-45};
  const f=mount(t,source);f.load();f.open();
  const shipped=fixture(t,NAME);shipped.load();shipped.open();shipped.seek(40);
  for(const time of [0,15,20,25,40]) {
    f.seek(time);const state=published(f),want=verifyState(state,source,state.angle);
    const position=[attr(f.$('[data-point]'),'cx'),attr(f.$('[data-point]'),'cy')];
    closeTree(position,screen(f,chart(source,want.reconstruction)),PX);
    assert(norm(subtract(position,[attr(shipped.$('[data-point]'),'cx'),attr(shipped.$('[data-point]'),'cy')]))>20,
      'a different ambient point is drawn somewhere else');
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
