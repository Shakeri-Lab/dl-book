#!/usr/bin/env node
// Independent arithmetic and geometry; these test-only dependencies never ship.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const {ROOT,read,entry,chapterSource,numbers,close,canonicalMarkup,fixture,
  registerTransportTests,registerBeatHoldTest,registerGrammarTests}=require('./html-tests/excerpt-harness.cjs');
const {staticFrame}=require('./render_static_frames.cjs');

const NAME='svd-circle-excerpt',scene=entry(NAME),widths=[240,296,360,519,520,553,713];
const dot=(a,b)=>a.reduce((total,value,j)=>total+value*b[j],0);
const columns=a=>a[0].map((_,j)=>a.map(row=>row[j]));
const product=(a,b)=>a.map(row=>columns(b).map(column=>dot(row,column)));
const apply=(a,x)=>a.map(row=>dot(row,x));
const difference=(a,b)=>a.map((row,i)=>row.map((value,j)=>value-b[i][j]));
const rotation=angle=>[[Math.cos(angle),-Math.sin(angle)],[Math.sin(angle),Math.cos(angle)]];
const diagonal=scales=>[[scales[0],0],[0,scales[1]]];
const det=a=>a[0][0]*a[1][1]-a[0][1]*a[1][0];
const norm=x=>Math.hypot(...x);
const identity=[[1,0],[0,1]];
const closeTree=(actual,expected,epsilon=1e-12)=>{
  if(Array.isArray(expected)) {
    assert(Array.isArray(actual));assert.equal(actual.length,expected.length);
    expected.forEach((value,j)=>closeTree(actual[j],value,epsilon));
  } else close(actual,expected,epsilon);
};
const matrixNorms=a=>{
  // Singular values from the two eigenvalues of A^T A, without a scene helper.
  const gram=product(columns(a),a),trace=gram[0][0]+gram[1][1];
  const gap=Math.hypot(gram[0][0]-gram[1][1],2*gram[0][1]);
  return {operator:Math.sqrt(Math.max(0,(trace+gap)/2)),frobenius:Math.sqrt(trace)};
};
const data=(f,key)=>JSON.parse(f.root.dataset[key]);
const attr=(node,key)=>Number(node.getAttribute(key));
const visible=node=>Boolean(node&&!node.closest('[hidden]'));
const declared=f=>({leftAngleDegrees:Number(f.root.dataset.leftAngleDegrees),
  rightAngleDegrees:Number(f.root.dataset.rightAngleDegrees),
  singularValues:data(f,'singularValues'),sampleCount:Number(f.root.dataset.sampleCount)});
const drawing=f=>f.$('[data-drawing]');
const screen=(f,x)=>{const origin=data(f,'origin'),unit=Number(f.root.dataset.pixelsPerUnit);
  return [origin[0]+unit*x[0],origin[1]-unit*x[1]];};
const numericTokens=text=>(text.match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi)||[]).map(Number);
function pathPoints(node) {
  const d=node.getAttribute('d');assert.match(d,/^M/);assert.match(d,/Z\s*$/i);
  assert.doesNotMatch(d,/[ACHQSTV]/i,'circle samples use inspectable straight segments, not a separately fitted curve');
  const values=numericTokens(d);assert.equal(values.length%2,0);
  return Array.from({length:values.length/2},(_,j)=>values.slice(2*j,2*j+2));
}
function markerPosition(node) {
  const transform=node.getAttribute('transform');assert.match(transform,/^translate\([^)]*\)$/);
  const position=numericTokens(transform);assert.equal(position.length,2);return position;
}
const smooth=(time,from,to)=>{const u=Math.max(0,Math.min(1,(time-from)/(to-from)));return u*u*(3-2*u);};
const heldTime=time=>scene.beats.filter(beat=>beat<=time).at(-1);
function oracle(source,time,reduced=false) {
  const t=reduced?heldTime(time):time,a=source.leftAngleDegrees*Math.PI/180,b=source.rightAngleDegrees*Math.PI/180;
  const U=rotation(a),V=rotation(b),Sigma=diagonal(source.singularValues);
  const full=product(product(U,Sigma),columns(V));
  const rankOne=product(product(U,diagonal([source.singularValues[0],0])),columns(V));
  const progress=[smooth(t,7,10),smooth(t,12,15),smooth(t,17,20),smooth(t,27,30)];
  const scales=source.singularValues.map(value=>1+(value-1)*progress[1]);
  scales[1]*=1-progress[3];
  const current=product(product(rotation(a*progress[2]),diagonal(scales)),rotation(-b*progress[0]));
  const markerInputs=columns(V),markerOutputs=markerInputs.map(x=>apply(current,x));
  const input=Array.from({length:source.sampleCount},(_,j)=>{
    const angle=2*Math.PI*j/(source.sampleCount-1);return [Math.cos(angle),Math.sin(angle)];
  });
  return {U,V,Sigma,full,rankOne,current,progress,scales,markerInputs,markerOutputs,
    fullMarkerOutputs:markerInputs.map(x=>apply(full,x)),input,image:input.map(x=>apply(current,x))};
}
function verifyState(state,source,time,reduced=false) {
  const want=oracle(source,time,reduced);
  for(const [key,expected] of [['U',want.U],['V',want.V],['Sigma',want.Sigma],
    ['fullMap',want.full],['rankOneMap',want.rankOne],['currentMap',want.current],
    ['currentScales',want.scales],['inputPoints',want.input],['imagePoints',want.image],
    ['fullImagePoints',want.input.map(point=>apply(want.full,point))],
    ['markerInputs',want.markerInputs],['markerOutputs',want.markerOutputs],
    ['fullMarkerOutputs',want.fullMarkerOutputs]]) closeTree(state[key],expected);
  ['rotationProgress','stretchProgress','outputProgress','truncationProgress'].forEach((key,j)=>close(state[key],want.progress[j]));
  closeTree(product(columns(state.U),state.U),identity);closeTree(product(columns(state.V),state.V),identity);
  close(det(state.currentMap),want.scales[0]*want.scales[1]);
  assert.equal(state.rank,want.scales.filter(scale=>scale>0).length);
  close(state.discardedScale,source.singularValues[1]*want.progress[3]);
  return want;
}

registerTransportTests(NAME,{witness:/one retained direction/i,anchors:['svd-circle-playback-help'],width:713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('SVD circle: the fixture is the existing A1 map, not a new fitted example',t=>{
  const f=fixture(t,NAME),source=declared(f),chapter=chapterSource(NAME);
  assert.equal(scene.qmd,'chapters/appendices/a1-linear-algebra.qmd');
  assert.equal(scene.anchor.type,'after-cell');assert.equal(scene.anchor.target,'cell-fig-a1-svd');
  assert.equal(scene.duration,40);assert.deepEqual(scene.beats,[0,5,10,15,20,25,30,35]);
  assert.deepEqual(source,{leftAngleDegrees:30,rightAngleDegrees:-45,singularValues:[3,1],sampleCount:361});
  for(const literal of scene.fixture.literals) assert(chapter.includes(literal),literal);
  assert.match(chapter,/left_angle, right_angle = math\.pi \/ 6\.0, -math\.pi \/ 4\.0/);
  assert.match(chapter,/linear_map = left_basis @ torch\.diag\(torch\.tensor\(\[3\.0, 1\.0\]\)\) @ right_basis\.T/);
});

test('SVD circle: every interpolated map applies the factors in right-to-left order',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  assert.equal(typeof f.w.BookSVDCircle.buildState,'function');
  for(let n=0;n<=160;n++) {
    const time=n/4,state=f.w.BookSVDCircle.buildState(time);verifyState(state,source,time);
    f.seek(time);closeTree(data(f,'currentMap'),state.currentMap);
    closeTree(data(f,'markerOutputs'),state.markerOutputs);
  }
});

test('SVD circle: two distinguishable input directions reveal a rotation the circle alone cannot show',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  const builder=f.w.BookSVDCircle.buildState,U=rotation(source.leftAngleDegrees*Math.PI/180);
  closeTree(builder(0).markerOutputs,columns(rotation(source.rightAngleDegrees*Math.PI/180)));
  closeTree(builder(10).markerOutputs,identity);
  closeTree(builder(15).markerOutputs,[[3,0],[0,1]]);
  closeTree(builder(20).markerOutputs,[apply(U,[3,0]),apply(U,[0,1])]);
  closeTree(builder(30).markerOutputs,[apply(U,[3,0]),[0,0]]);
  for(const time of [0,8.5,10]) builder(time).imagePoints.forEach(point=>close(norm(point),1));
  assert(norm(builder(8.5).markerOutputs[0].map((value,j)=>value-builder(0).markerOutputs[0][j]))>0.1);
  f.seek(10);
  const first=f.$('[data-marker="0"]'),second=f.$('[data-marker="1"]');
  assert(first&&second);assert(visible(first)&&visible(second));
  assert.notEqual(first.querySelector('[data-marker-shape]').tagName,second.querySelector('[data-marker-shape]').tagName,
    'two differently shaped marks make their identity readable without color');
  assert.notEqual(f.$('[data-marker-label="0"]').textContent,f.$('[data-marker-label="1"]').textContent);
});

test('SVD circle: transposing the wrong factor and reversing factor order produce detectably wrong witnesses',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  const want=oracle(source,20),wrongTranspose=product(product(want.U,want.Sigma),want.V);
  const wrongOrder=product(product(columns(want.V),want.Sigma),want.U);
  close(matrixNorms(difference(wrongTranspose,want.full)).frobenius,Math.sqrt(20));
  close(matrixNorms(difference(wrongOrder,want.full)).frobenius,Math.sqrt(3)-1);
  closeTree(f.w.BookSVDCircle.buildState(20).fullMap,want.full);
});

test('SVD circle: ellipse axes, rank and both truncation errors follow the singular values',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  const state=f.w.BookSVDCircle.buildState(40),want=verifyState(state,source,40);
  const residual=difference(state.fullMap,state.rankOneMap),errors=matrixNorms(residual);
  close(errors.operator,1);close(errors.frobenius,1);
  close(state.operatorError,errors.operator);close(state.frobeniusError,errors.frobenius);
  assert.equal(state.rank,1);close(det(state.rankOneMap),0);assert(matrixNorms(state.rankOneMap).frobenius>0);
  const gram=product(columns(state.fullMap),state.fullMap);
  close(gram[0][0]+gram[1][1],10);close(det(gram),9);
  want.fullMarkerOutputs.forEach((point,j)=>close(norm(point),source.singularValues[j]));
  close(dot(...want.fullMarkerOutputs),0);
});

test('SVD circle: removing the short axis is projection of the full ellipse, point for point',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  const state=f.w.BookSVDCircle.buildState(40),u=columns(state.U)[0];
  for(let j=0;j<source.sampleCount;j++) {
    const full=apply(state.fullMap,state.inputPoints[j]),projection=u.map(value=>value*dot(u,full));
    closeTree(state.imagePoints[j],projection);
    close(dot(u,full.map((value,k)=>value-projection[k])),0);
    close(det([u,state.imagePoints[j]]),0);
  }
  // The omitted input direction is a maximizing unit witness for operator error.
  close(norm(apply(difference(state.fullMap,state.rankOneMap),state.markerInputs[1])),state.operatorError);
});

test('SVD circle: alternate finite rotations and ordered scales obey the same map, including rank loss',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  // A nonzero first scale is the explicit domain of this one-retained-direction
  // illustration. A zero second scale still checks the rank-deficient boundary.
  for(const [left,right,scales] of [[-70,20,[5,2]],[135,-115,[2,2]],[0,0,[1,0.1]],
    [360,-360,[1,0]]]) {
    const source={leftAngleDegrees:left,rightAngleDegrees:right,singularValues:scales,sampleCount:33},before=JSON.stringify({left,right,scales});
    for(const time of [0,8.5,10,13.5,15,18.5,20,28.5,30,40])
      verifyState(f.w.BookSVDCircle.buildState(time,false,source),source,time);
    const final=f.w.BookSVDCircle.buildState(40,false,source),errors=matrixNorms(difference(final.fullMap,final.rankOneMap));
    close(final.operatorError,errors.operator);close(final.frobeniusError,errors.frobenius);
    close(final.operatorError,scales[1]);assert.equal(final.rank,Number(scales[0]>0));
    assert.equal(JSON.stringify({left,right,scales}),before);
  }
});

test('SVD circle: invalid factors cannot silently generate a non-SVD illustration',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  for(const altered of [{...source,leftAngleDegrees:NaN},{...source,rightAngleDegrees:Infinity},
    {...source,singularValues:[1,3]},{...source,singularValues:[3,-1]},
    {...source,singularValues:[3]},{...source,singularValues:[3,NaN]},
    {...source,singularValues:[0,0]},
    {...source,sampleCount:1},{...source,sampleCount:12.5}])
    assert.throws(()=>f.w.BookSVDCircle.buildState(40,false,altered),/finite|singular|sample|ordered|nonnegative|count/i);
});

test('SVD circle: each operation arrives at its beat, then holds; reduced motion shows only complete beat states',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  for(const time of [0,5,7,8.5,10,12,13.5,15,17,18.5,20,25,27,28.5,30,35,40])
    verifyState(f.w.BookSVDCircle.buildState(time),source,time);
  for(const time of [0,6,8.5,10,13.5,15,18.5,20,26,28.5,30,39,40])
    verifyState(f.w.BookSVDCircle.buildState(time,true),source,time,true);
});

test('SVD circle: the actual curve and two marker rays follow the computed map at one fixed ruler',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  for(const width of widths) {
    f.resize(width);let initialUnit,initialOrigin;
    for(const time of [0,5,8.5,10,13.5,15,18.5,20,25,28.5,30,35,40]) {
      f.seek(time);const state=f.w.BookSVDCircle.buildState(time),want=oracle(source,time);
      const unit=Number(f.root.dataset.pixelsPerUnit),origin=data(f,'origin');assert(unit>0);
      close(Number(f.root.dataset.rulerExtent),Math.max(1,source.singularValues[0])+0.4);
      if(initialUnit===undefined) {initialUnit=unit;initialOrigin=origin;}
      close(unit,initialUnit);closeTree(origin,initialOrigin);
      closeTree(pathPoints(f.$('[data-outline]')),want.image.map(point=>screen(f,point)),1e-9);
      closeTree(pathPoints(f.$('[data-full-ghost]')),want.input.map(point=>screen(f,apply(want.full,point))),1e-9);
      for(let j=0;j<2;j++) {
        const marker=f.$(`[data-marker="${j}"]`),ray=f.$(`[data-ray="${j}"]`),point=screen(f,state.markerOutputs[j]);
        closeTree(markerPosition(marker),point);closeTree(JSON.parse(marker.dataset.position),point);
        closeTree([attr(ray,'x1'),attr(ray,'y1')],origin);closeTree([attr(ray,'x2'),attr(ray,'y2')],point);
      }
    }
  }
});

test('SVD circle: the error segment measures the discarded short direction without a cosmetic offset',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const width of widths) {
    f.resize(width);f.seek(40);const state=f.w.BookSVDCircle.buildState(40),ray=f.$('[data-error-ray]');
    assert(visible(ray));const start=[attr(ray,'x1'),attr(ray,'y1')],end=[attr(ray,'x2'),attr(ray,'y2')];
    closeTree(start,screen(f,state.fullMarkerOutputs[1]));closeTree(end,data(f,'origin'));
    close(norm(start.map((value,j)=>value-end[j]))/Number(f.root.dataset.pixelsPerUnit),state.operatorError);
    closeTree(markerPosition(f.$('[data-marker="1"]')),data(f,'origin'));
    const parsed=numericTokens(f.$('[data-value="error"]').textContent);assert(parsed.includes(1));
  }
});

test('SVD circle: prediction precedes the marks, scale labels, retained ellipse and error witness',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const time of [0,4.99,5,10,14.99,15,20,24.99,25,28.5,30,34.99,35,40]) {
    f.seek(time);
    for(const node of drawing(f).querySelectorAll('[data-marker],[data-marker-label],[data-ray]'))
      assert.equal(visible(node),time>=5);
    assert.equal(visible(f.$('[data-value="stretch-0"]')),time>=15);
    assert.equal(visible(f.$('[data-value="stretch-1"]')),time>=15&&time<30);
    if(time>=30) assert.match(f.$('[data-marker-label="1"]').textContent,/0/);
    assert.equal(visible(f.$('[data-full-ghost]')),time>=25);
    assert.equal(visible(f.$('[data-error-ray]')),time>=35);
    assert.equal(visible(f.$('[data-value="error"]')),time>=35);
  }
});

test('SVD circle: phone reflow preserves type size and the entire sampled curve',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const width of widths) {
    f.resize(width);
    for(const time of [0,5,8.5,10,13.5,15,18.5,20,25,28.5,30,35,40]) {
      f.seek(time);const svg=f.$('[data-figure] svg'),box=numbers(svg.getAttribute('viewBox'));
      assert.equal(box[2],width);assert.equal(svg.getAttribute('preserveAspectRatio'),'xMinYMin meet');
      for(const node of [...drawing(f).querySelectorAll('text')].filter(visible)) {
        assert(attr(node,'font-size')>=12,`small label at ${width}px: ${node.textContent}`);
        assert(attr(node,'x')>=0&&attr(node,'x')<=width);assert(attr(node,'y')>=0&&attr(node,'y')<=box[3]);
      }
      for(const key of ['data-outline','data-full-ghost']) for(const point of pathPoints(f.$(`[${key}]`))) {
        assert(point[0]>=0&&point[0]<=width);assert(point[1]>=0&&point[1]<=box[3]);
      }
      for(const node of [...drawing(f).querySelectorAll('line')].filter(visible))
        for(const [coordinate,limit] of [['x1',width],['x2',width],['y1',box[3]],['y2',box[3]]])
          assert(attr(node,coordinate)>=0&&attr(node,coordinate)<=limit);
      assert(drawing(f).querySelectorAll('*').length<150);
    }
  }
});

test('SVD circle: marker-label envelopes stay inside both pane edges, not just their anchors',t=>{
  for(const leftAngle of [30,180]) {
    const f=fixture(t,NAME);f.root.dataset.leftAngleDegrees=String(leftAngle);f.load();f.open();
    for(const width of widths) {
      f.resize(width);
      for(const time of [15,17,20,30,40]) {
        f.seek(time);
        for(const node of [...drawing(f).querySelectorAll('[data-marker-label]')].filter(visible)) {
          // JSDOM has no text layout. Use a conservative character allowance to
          // guard the edge-placement rule; browser QA still owns actual glyphs.
          const allowance=Array.from(node.textContent).length*7.5,x=attr(node,'x');
          const anchor=node.getAttribute('text-anchor');
          assert(['start','middle','end'].includes(anchor));
          const left=x-(anchor==='end'?allowance:anchor==='middle'?allowance/2:0);
          const right=left+allowance;
          assert(left>=10-1e-12&&right<=width-10+1e-12,
            `${node.textContent} estimated extent [${left}, ${right}] leaves the 10px gutter at ${width}px, ${time}s`);
        }
      }
    }
  }
});

test('SVD circle: seeking and resizing reproduce the whole scene state without changing the fixture',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  const snapshot=()=>JSON.stringify({drawing:canonicalMarkup(f.$('[data-figure]').innerHTML),
    formula:canonicalMarkup(f.$('[data-formula]').outerHTML),caption:f.$('[data-caption]').innerHTML,
    state:Object.fromEntries(Object.entries(f.root.dataset).filter(([key])=>!['time','playing','typeset'].includes(key)))});
  const times=[0,5,8.1,10,13.6,15,18.8,20,25,28.3,30,35,40],original=declared(f);
  const snapshots=times.map(time=>{f.seek(time);return snapshot();});
  f.play();f.tick(1111);f.resize(296);f.seek(17.2);f.resize(713);
  assert.deepEqual(times.toReversed().map(time=>{f.seek(time);return snapshot();}),snapshots.toReversed());
  assert.deepEqual(declared(f),original);
});

test('SVD circle: generated script-free wide and narrow frames match the final state',async t=>{
  const generated=await staticFrame(NAME);assert.equal(generated.before,generated.after,'regenerate the SVD static frames');
  const f=fixture(t,NAME),narrow=f.$('[data-static-frame="narrow"]');assert(narrow);
  assert.equal(narrow.dataset.width,'296');const height=Number(narrow.dataset.height);
  const ids=[...f.root.querySelectorAll('[id]')].map(node=>node.id);assert.equal(ids.length,new Set(ids).size);
  for(const frame of [drawing(f),narrow]) {
    assert(frame.querySelector('[data-outline]'));assert(frame.querySelector('[data-full-ghost]'));
    assert.match(frame.textContent,/one retained direction/i);assert.match(frame.textContent,/error 1/);
  }
  f.load();f.open();f.seek(40);f.resize(296);
  assert.equal(f.root.querySelectorAll('[data-static-frame="narrow"]').length,0);
  assert.equal(numbers(f.$('[data-figure] svg').getAttribute('viewBox'))[3],height);
});

test('SVD circle: the square rotation example does not claim that all SVD factors are rotations or that small means noise',t=>{
  const f=fixture(t,NAME),boundary=f.$('.mechanism-boundary').textContent;
  assert.match(boundary,/reflect/i);assert.match(boundary,/denois|noise|semantic/i);
  assert.match(boundary,/matrix[- ]norm|operator|Frobenius/i);
  assert.match(boundary,/fixed|not trained|not training/i);
  f.load();f.open();assert.equal(f.root.querySelectorAll('input[type="range"]').length,1);
  const filter=fs.readFileSync(path.join(ROOT,scene.filter),'utf8');
  assert.match(filter,/^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
  assert.doesNotMatch(read('svd-circle/player.js'),/Math\.random|fetch\(|import\(|setInterval\(/);
  assert.doesNotMatch(read('svd-circle/panel.html'),/@eq-/);
});
