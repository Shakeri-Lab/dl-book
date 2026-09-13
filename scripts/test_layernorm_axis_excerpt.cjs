#!/usr/bin/env node
// Independent token statistics and normalization-axis checks; no training or
// invented BatchNorm outputs for the axis-only contrast.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const {execFileSync}=require('node:child_process');
const {ROOT,read,entry,chapterSource,numbers,close,canonicalMarkup,fixture,
  registerTransportTests,registerBeatHoldTest,registerGrammarTests}=require('./html-tests/excerpt-harness.cjs');
const {staticFrame}=require('./render_static_frames.cjs');

const NAME='layernorm-axis-excerpt',scene=entry(NAME),widths=[240,296,360,519,520,553,559,560,713];
const FIXTURE={input:[[[1,3,5,7],[40,50,60,70]],[[-3,1,5,9],[2,2.5,3,3.5]]],normalizedShape:[4],selected:[0,0],eps:1e-5};
const data=(f,key)=>JSON.parse(f.root.dataset[key]);
const attr=(node,key)=>Number(node.getAttribute(key));
const visible=node=>Boolean(node&&!node.closest('[hidden]'));
const drawing=f=>f.$('[data-drawing]');
const numericTokens=text=>(text.match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi)||[]).map(Number);
const PIXEL_EPSILON=5.1e-10;
const closePixel=(actual,expected)=>close(actual,expected,PIXEL_EPSILON);
const closeTree=(actual,expected,epsilon=1e-12)=>{
  if(Array.isArray(expected)) {
    assert(Array.isArray(actual));assert.equal(actual.length,expected.length);
    expected.forEach((value,j)=>closeTree(actual[j],value,epsilon));
  } else close(actual,expected,epsilon);
};
const mean=values=>values.reduce((total,value)=>total+value,0)/values.length;
const variance=values=>{const center=mean(values);return mean(values.map(value=>(value-center)**2));};
const smooth=value=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
function oracle(source) {
  return source.input.flatMap((batch,b)=>batch.map((raw,t)=>{
    const center=mean(raw),v=variance(raw),denominator=Math.sqrt(v+source.eps);
    const centered=raw.map(value=>value-center),normalized=centered.map(value=>value/denominator);
    return {batch:b,token:t,raw,mean:center,variance:v,centered,denominator,normalized,
      outputMean:mean(normalized),outputVariance:v/(v+source.eps)};
  }));
}
function verifyState(state,source,time,reduced=false) {
  const rows=oracle(source),selectedIndex=source.selected[0]*source.input[0].length+source.selected[1];
  assert.equal(state.rows.length,rows.length);assert.equal(state.featureCount,source.normalizedShape[0]);
  assert.equal(state.selectedIndex,selectedIndex);
  rows.forEach((expected,j)=>Object.entries(expected).forEach(([key,value])=>closeTree(state.rows[j][key],value)));
  for(const [key,value] of Object.entries(rows[selectedIndex]))closeTree(state.selectedRow[key],value);
  const held=reduced?scene.beats.filter(beat=>beat<=time).at(-1):time;
  const centerProgress=smooth((held-12)/3),scaleProgress=smooth((held-22)/3);
  const denominator=1+(rows[selectedIndex].denominator-1)*scaleProgress;
  close(state.held,held);close(state.centerProgress,centerProgress);close(state.scaleProgress,scaleProgress);
  close(state.currentDivisor,denominator);
  closeTree(state.currentValues,rows[selectedIndex].raw.map(value=>(value-rows[selectedIndex].mean*centerProgress)/denominator));
  return rows;
}

registerTransportTests(NAME,{witness:/0\.999|0\.0000|mean/i,anchors:['layernorm-axis-playback-help'],width:713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('LayerNorm axis: the exact tensor and last-axis operation are the chapter audit',t=>{
  const f=fixture(t,NAME),chapter=chapterSource(NAME);f.load();f.open();
  assert.equal(scene.qmd,'chapters/part4/14-self-attention-transformer.qmd');
  assert.equal(scene.duration,40);assert.deepEqual(scene.beats,[0,5,10,15,20,25,30,35]);
  assert.deepEqual(data(f,'fixture'),FIXTURE);
  for(const literal of scene.fixture.literals)assert(chapter.includes(literal),literal);
  assert(chapter.includes('normalized = nn.functional.layer_norm(audit, (4,))'));
  assert(chapter.includes('normalized.var(dim=-1, unbiased=False)'));
  assert.match(chapter,/without aggregating statistics\s+across other tokens or examples/);
  assert.equal(typeof f.w.BookLayerNormAxis.buildState,'function');
  verifyState(f.w.BookLayerNormAxis.buildState(40),FIXTURE,40);
});

test('LayerNorm axis: each token has its own population mean, variance and denominator',t=>{
  const f=fixture(t,NAME);f.load();f.open();const state=f.w.BookLayerNormAxis.buildState(40);
  const rows=verifyState(state,FIXTURE,40);
  closeTree(rows.map(row=>row.mean),[4,55,3,2.75]);
  closeTree(rows.map(row=>row.variance),[5,125,20,0.3125]);
  for(const row of state.rows) {
    close(mean(row.normalized),0);close(variance(row.normalized),row.variance/(row.variance+FIXTURE.eps));
    assert(row.outputVariance<1&&row.outputVariance>0);
  }
  closeTree(rows.map(row=>row.outputVariance),[0.999998000004,0.9999999200000064,0.99999950000025,0.9999680010239672]);
  assert(Math.abs(rows[0].normalized[0]-rows[3].normalized[0])>1e-5,
    'epsilon makes coincident-looking profiles slightly different, not mathematically identical');
});

test('LayerNorm axis: changing any other token or batch cannot alter the selected token',t=>{
  const f=fixture(t,NAME);f.load();f.open();const base=f.w.BookLayerNormAxis.buildState(40);
  for(const [batch,token] of [[0,1],[1,0],[1,1]]) {
    const source=JSON.parse(JSON.stringify(FIXTURE));source.input[batch][token]=[100,-200,300,400];
    const state=f.w.BookLayerNormAxis.buildState(40,false,source);verifyState(state,source,40);
    closeTree(state.selectedRow.normalized,base.selectedRow.normalized,0);
    const changed=batch*2+token;
    for(let j=0;j<state.rows.length;j++)if(j!==changed)closeTree(state.rows[j].normalized,base.rows[j].normalized,0);
    assert.notDeepEqual(Array.from(state.rows[changed].normalized),Array.from(base.rows[changed].normalized));
  }
  // A batch-wide or token-wide denominator would depend on these other values.
  const flattened=FIXTURE.input.flat(2);assert.notEqual(mean(flattened),base.selectedRow.mean);
  assert.notEqual(variance(flattened),base.selectedRow.variance);
  // Features within one token do share statistics: change one feature and the
  // other three outputs move too, unlike changing an unrelated token above.
  for(let changedFeature=0;changedFeature<4;changedFeature++) {
    const own=JSON.parse(JSON.stringify(FIXTURE));own.input[0][0][changedFeature]+=1;
    const changed=f.w.BookLayerNormAxis.buildState(40,false,own);verifyState(changed,own,40);
    for(let feature=0;feature<4;feature++)
      assert(Math.abs(changed.selectedRow.normalized[feature]-base.selectedRow.normalized[feature])>1e-3);
    for(let row=1;row<4;row++)closeTree(changed.rows[row].normalized,base.rows[row].normalized,0);
  }
});

test('LayerNorm axis: temporal BatchNorm groups examples and tokens, while LayerNorm groups features',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const source of [FIXTURE,
    {input:[[[1,2,4],[3,0,-3],[6,6,6]]],normalizedShape:[3],selected:[0,2],eps:0.02},
    {input:[[[1,2]],[[3,4]],[[7,8]]],normalizedShape:[2],selected:[2,0],eps:1e-5}
  ]) {
    const rowCount=source.input.length*source.input[0].length,features=source.normalizedShape[0];
    const rowIndices=Array.from({length:rowCount},(_,index)=>index);
    const featureIndices=Array.from({length:features},(_,index)=>index);
    for(const time of [0,4.99,5,15,25,35,40]) {
      const state=f.w.BookLayerNormAxis.buildState(time,false,source);verifyState(state,source,time);
      assert.equal(state.bnFeature,0);assert.equal(state.bnVisible,time<5);
      assert.deepEqual(JSON.parse(JSON.stringify(state.bnGroups)),featureIndices.map(()=>rowIndices));
      assert.deepEqual(JSON.parse(JSON.stringify(state.lnGroups)),rowIndices.map(()=>featureIndices));
      for(let feature=0;feature<features;feature++) {
        const members=state.bnGroups[feature].map(row=>[state.rows[row].batch,state.rows[row].token,feature]);
        const expected=source.input.flatMap((batch,b)=>batch.map((_,token)=>[b,token,feature]));
        assert.deepEqual(JSON.parse(JSON.stringify(members)),expected);
      }
    }
  }
});

test('LayerNorm axis: row translations cancel, while fixed epsilon qualifies scale invariance',t=>{
  const f=fixture(t,NAME);f.load();f.open();const base=f.w.BookLayerNormAxis.buildState(40);
  const shifted=JSON.parse(JSON.stringify(FIXTURE));shifted.input[0][0]=shifted.input[0][0].map(value=>value+128);
  const translated=f.w.BookLayerNormAxis.buildState(40,false,shifted);verifyState(translated,shifted,40);
  closeTree(translated.selectedRow.normalized,base.selectedRow.normalized);
  for(const factor of [0.01,2,-2]) {
    const changed=JSON.parse(JSON.stringify(FIXTURE));changed.input[0][0]=changed.input[0][0].map(value=>factor*value);
    const state=f.w.BookLayerNormAxis.buildState(40,false,changed);verifyState(state,changed,40);
    const adjusted={...FIXTURE,eps:FIXTURE.eps/factor**2};
    const equivalent=f.w.BookLayerNormAxis.buildState(40,false,adjusted);
    closeTree(state.selectedRow.normalized,equivalent.selectedRow.normalized.map(value=>Math.sign(factor)*value));
    assert(Math.abs(state.selectedRow.outputVariance-base.selectedRow.outputVariance)>1e-7);
  }
});

test('LayerNorm axis: alternative rectangular tensors, selected rows and constant features are valid',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const source of [
    {input:[[[2,2,2,2]]],normalizedShape:[4],selected:[0,0],eps:1e-5},
    {input:[[[1,2,4],[3,0,-3],[6,6,6]]],normalizedShape:[3],selected:[0,2],eps:0.02},
    {input:[[[1,2]],[[3,4]],[[7,8]]],normalizedShape:[2],selected:[2,0],eps:1e-5},
    {...FIXTURE,selected:[1,1],eps:0.3},
    {input:[[[1,3,5,7,9],[0,1,0,1,0]],[[2,4,6,8,10],[-1,-2,-3,-4,-5]]],normalizedShape:[5],selected:[1,0],eps:0.01}
  ]) {
    const before=JSON.stringify(source);
    for(const time of [0,5,10,12.5,15,20,22.5,25,30,35,40])verifyState(f.w.BookLayerNormAxis.buildState(time,false,source),source,time);
    assert.equal(JSON.stringify(source),before);
    const final=f.w.BookLayerNormAxis.buildState(40,false,source);
    for(const row of final.rows)if(row.variance===0) {
      closeTree(row.normalized,row.raw.map(()=>0),0);close(row.outputVariance,0);assert(Number.isFinite(row.denominator));
    }
  }
});

test('LayerNorm axis: ragged shapes, invalid selection and nonpositive epsilon fail explicitly',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const patch of [{input:[]},{input:[[]]},{input:[[[]]]},{input:[[[1,2],[1]]]},{input:[[[1,2]],[[1,2],[3,4]]]},
    {input:[[[1,NaN,3,4]]]},{normalizedShape:[2]},{normalizedShape:[]},{normalizedShape:[2,2]},
    {selected:[-1,0]},{selected:[0,2]},{selected:[0.5,0]},{selected:[0]},{eps:0},{eps:-1},{eps:NaN},{eps:Infinity}])
    assert.throws(()=>f.w.BookLayerNormAxis.buildState(40,false,{...FIXTURE,...patch}),/shape|finite|positive|select|row|feature|tensor|rectangular|input|epsilon|eps/i);
});

test('LayerNorm axis: motion performs centering before scaling and reduced motion holds each beat',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const time of [0,5,10,12,12.75,13.5,15,20,22,22.75,23.5,25,30,35,40]) {
    const state=f.w.BookLayerNormAxis.buildState(time);verifyState(state,FIXTURE,time);
    if(time<=12)closeTree(state.currentValues,FIXTURE.input[0][0]);
    if(time>=15&&time<=22)closeTree(state.currentValues,[-3,-1,1,3]);
    if(time>=25)closeTree(state.currentValues,state.selectedRow.normalized);
    verifyState(f.w.BookLayerNormAxis.buildState(time,true),FIXTURE,time,true);
  }
});

test('LayerNorm axis: each bracket selects one token across its actual four feature cells',t=>{
  const f=fixture(t,NAME);f.load();f.open();const rows=oracle(FIXTURE);
  for(const width of widths) {
    f.resize(width);
    for(const time of [0,5,15,25,30,40]) {
      f.seek(time);assert.equal(drawing(f).querySelectorAll('[data-input-cell]').length,16);
      for(let row=0;row<4;row++) {
        const cells=rows[row].raw.map((value,feature)=>{
          const node=f.$(`[data-input-cell="${row}:${feature}"]`);assert.equal(Number(node.textContent),value);
          assert.equal(Number(node.dataset.valueSource),value);return node;
        });
        assert(cells.every(node=>attr(node,'y')===attr(cells[0],'y')));
        for(let index=1;index<cells.length;index++)assert(attr(cells[index],'x')>attr(cells[index-1],'x'));
        const bracket=f.$(`[data-row-bracket="${row}"]`),xy=numericTokens(bracket.getAttribute('d'));
        assert.equal(xy.length,8);assert.equal(visible(bracket),time>=30||(time>=5&&row===0));
        const low=attr(cells[0],'x')-10,high=attr(cells.at(-1),'x')+10,y=attr(cells[0],'y');
        closeTree(xy,[low,y+6,low,y+10,high,y+10,high,y+6],2*PIXEL_EPSILON);
        if(row<3)assert(xy[3]<attr(f.$(`[data-input-cell="${row+1}:0"]`),'y'));
      }
      const selected=f.$('[data-selected-row]');assert.equal(visible(selected),time>=5&&time<30);
      if(visible(selected))for(let feature=0;feature<4;feature++) {
        const node=f.$(`[data-input-cell="0:${feature}"]`);
        assert(attr(node,'x')>attr(selected,'x')&&attr(node,'x')<attr(selected,'x')+attr(selected,'width'));
        assert(attr(node,'y')>attr(selected,'y')&&attr(node,'y')<attr(selected,'y')+attr(selected,'height'));
      }
    }
  }
});

test('LayerNorm axis: the opening BatchNorm column becomes a LayerNorm row, not a different tensor',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const width of widths) {
    f.resize(width);
    for(const time of [0,2.5,4.99,5,10,15,25,30,40]) {
      f.seek(time);const column=f.$('[data-bn-column]'),bracket=f.$('[data-bn-column-bracket]');
      assert(column&&bracket,'the training-time BatchNorm reduction has explicit geometry');
      assert.equal(visible(column),time<5);assert.equal(visible(bracket),time<5);
      assert.equal(f.root.dataset.bnVisible,String(time<5));
      const inColumn=[],cells=[...drawing(f).querySelectorAll('[data-input-cell]')];
      assert.equal(cells.length,16,'the BN contrast reuses, rather than replaces, the manuscript tensor');
      for(const cell of cells) {
        const [row,feature]=cell.dataset.inputCell.split(':').map(Number);
        assert.equal(Number(cell.textContent),FIXTURE.input.flat()[row][feature]);
        if(attr(cell,'x')>attr(column,'x')&&attr(cell,'x')<attr(column,'x')+attr(column,'width')
          &&attr(cell,'y')>attr(column,'y')&&attr(cell,'y')<attr(column,'y')+attr(column,'height'))
          inColumn.push([row,feature]);
      }
      assert.deepEqual(inColumn,[[0,0],[1,0],[2,0],[3,0]],
        'temporal BatchNorm pools one feature across both examples and both token positions');
      const xy=numericTokens(bracket.getAttribute('d'));
      assert.equal(xy.length,8);const ys=xy.filter((_,index)=>index%2===1);
      assert(Math.min(...ys)<=attr(f.$('[data-input-cell="0:0"]'),'y'));
      assert(Math.max(...ys)>=attr(f.$('[data-input-cell="3:0"]'),'y'));
      assert(visible(f.$('[data-axis-key]')),'the contrasting reduction axes remain labeled');
      if(time<5) {
        assert(!visible(f.$('[data-selected-row]')));assert(!visible(f.$('[data-current-profile]')));
        assert.match(f.$('[data-figure] svg').getAttribute('aria-label'),/BatchNorm|batch normalization/i);
        assert.match(f.$('[data-caption]').textContent,/batchnorm|training|column/i);
      } else if(time<30) {
        assert(visible(f.$('[data-selected-row]')));assert(visible(f.$('[data-current-profile]')));
        assert.match(f.$('[data-caption]').textContent,/token|feature|mean|profile|centered/i);
      }
    }
  }
});

test('LayerNorm axis: the nonnumeric CNN sketch holds one channel and pools images plus both spatial axes',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const width of widths) {
    f.resize(width);
    for(const time of [0,4.99,5,20,40]) {
      f.seek(time);const sketch=f.$('[data-cnn-bn-schematic]');assert(sketch);
      assert.equal(visible(sketch),time<5);assert.equal(sketch.dataset.heldAxis,'channel');
      assert.deepEqual(sketch.dataset.pooledAxes.split(','),['N','H','W']);assert.equal(sketch.dataset.mode,'training');
      assert.match(sketch.getAttribute('aria-label'),/schematic/i);
      assert.match(sketch.getAttribute('aria-label'),/no activation values/i);
      assert.match(f.$('[data-cnn-title]').textContent,/BatchNorm.*training/);
      assert.match(f.$('[data-cnn-channel]').textContent,/one channel.*schematic/);
      assert.match(f.$('[data-cnn-axis-names]').textContent,/N.*H.*W/);
      assert.equal(sketch.querySelectorAll('[data-input-cell],[data-value],[data-value-source]').length,0,
        'the spatial sketch does not reuse token values or invent numerical BatchNorm results');
      const maps=[...sketch.querySelectorAll('[data-feature-map]')];assert.equal(maps.length,2);
      const points=maps.map((map,index)=>{
        const x=attr(map,'x'),y=attr(map,'y'),w=attr(map,'width'),h=attr(map,'height');
        assert(w>0&&h>0);assert(x>=0&&x+w<=width);assert(y>=0);
        if(index)assert(x>attr(maps[index-1],'x')+attr(maps[index-1],'width'));
        const positions=numericTokens(f.$(`[data-spatial-positions="${index}"]`).getAttribute('d'));
        assert(positions.length>=8&&positions.length%4===0);
        let horizontal=false,vertical=false;
        for(let i=0;i<positions.length;i+=4) {
          const [x1,y1,x2,y2]=positions.slice(i,i+4);
          assert(x1>=x-PIXEL_EPSILON&&x2<=x+w+PIXEL_EPSILON);
          assert(y1>=y-PIXEL_EPSILON&&y2<=y+h+PIXEL_EPSILON);
          if(x1===x2&&y1<y2)vertical=true;
          if(y1===y2&&x1<x2)horizontal=true;
        }
        assert(horizontal&&vertical,'both spatial directions participate, not only rows or columns');
        return[x+w/2,y+h];
      });
      const pool=numericTokens(f.$('[data-cnn-pool]').getAttribute('d'));
      assert.equal(pool.length,12);closeTree(pool.slice(0,2),points[0],2*PIXEL_EPSILON);
      closeTree(pool.slice(6,8),points[1],2*PIXEL_EPSILON);
      closePixel(pool[2],points[0][0]);closePixel(pool[4],points[1][0]);closePixel(pool[3],pool[5]);
      assert(pool[3]>Math.max(points[0][1],points[1][1]));
      const center=(points[0][0]+points[1][0])/2;
      closePixel(pool[8],center);closePixel(pool[10],center);closePixel(pool[9],pool[3]);assert(pool[11]>pool[9]);
      const statistics=f.$('[data-shared-statistics]');closePixel(attr(statistics,'x'),center);
      assert(attr(statistics,'y')>pool[11]);assert.match(statistics.textContent,/mean.*variance/);
    }
  }
});

test('LayerNorm axis: paths, marks and the moving mean use one fixed value ruler',t=>{
  const f=fixture(t,NAME);f.load();f.open();const expectedRows=oracle(FIXTURE);
  for(const width of widths) {
    f.resize(width);let fixedUnit;
    for(const time of [5,10,12.1234567,13.5,15,20,22.1234567,23.5,25,30,35,40]) {
      f.seek(time);const state=f.w.BookLayerNormAxis.buildState(time),frame=numericTokens(f.$('[data-plot-frame]').getAttribute('d'));
      assert.equal(frame.length,6);const [left,top,,bottom,right]=frame;
      const yMin=-5,yMax=9,unit=(bottom-top)/(yMax-yMin);
      close(Number(f.root.dataset.yMin),yMin);close(Number(f.root.dataset.yMax),yMax);
      if(fixedUnit===undefined)fixedUnit=unit;close(unit,fixedUnit);
      close(Number(f.root.dataset.pixelsPerUnit),unit);
      const xs=[0,1,2,3].map(index=>attr(f.$(`[data-x-label="${index}"]`),'x'));
      assert(xs[0]>left&&xs.at(-1)<right);closeTree(data(f,'featureXs'),xs,PIXEL_EPSILON);
      const screen=values=>values.flatMap((value,index)=>[xs[index],bottom-(value-yMin)*unit]);
      const actual=numericTokens(f.$('[data-current-profile]').getAttribute('d'));
      closeTree(actual,screen(state.currentValues),2*PIXEL_EPSILON);
      closeTree(numericTokens(f.$('[data-raw-ghost]').getAttribute('d')),screen(FIXTURE.input[0][0]),2*PIXEL_EPSILON);
      for(let feature=0;feature<4;feature++) {
        const node=f.$(`[data-current-marker="${feature}"]`);
        closePixel(attr(node,'cx'),actual[2*feature]);closePixel(attr(node,'cy'),actual[2*feature+1]);
      }
      const line=f.$('[data-mean-line]'),currentMean=mean(state.currentValues);
      closePixel(attr(line,'y1'),bottom-(currentMean-yMin)*unit);closePixel(attr(line,'y2'),attr(line,'y1'));
      closePixel(attr(f.$('[data-zero-line]'),'y1'),bottom+yMin*unit);
      for(let row=1;row<4;row++) {
        const path=f.$(`[data-comparison-profile="${row}"]`),points=screen(expectedRows[row].normalized);
        assert.equal(visible(path),time>=30);closeTree(numericTokens(path.getAttribute('d')),points,2*PIXEL_EPSILON);
        for(let feature=0;feature<4;feature++) {
          const node=f.$(`[data-comparison-marker="${row}:${feature}"]`);
          assert.equal(visible(node),time>=30);assert.match(node.getAttribute('transform'),/^translate\([^)]*\)$/);
          closeTree(numericTokens(node.getAttribute('transform')),points.slice(2*feature,2*feature+2),2*PIXEL_EPSILON);
        }
      }
      // The near-coincident outputs remain at their computed coordinates; shapes
      // distinguish them without jittering or importing another row's raw70.
      if(time>=30)assert.notEqual(f.$('[data-comparison-profile="1"]').getAttribute('d'),f.$('[data-comparison-profile="3"]').getAttribute('d'));
    }
  }
});

test('LayerNorm axis: means, divisor and output statements reveal in causal order',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  const style=f.d.createElement('style');style.textContent=read('layernorm-axis/player.css');f.d.head.append(style);
  for(const time of [0,4.99,5,9.99,10,12.5,15,19.99,20,23.5,24.99,25,29.99,30,34.99,35,40]) {
    f.seek(time);
    assert.equal(visible(f.$('[data-current-profile]')),time>=5);
    assert.equal(visible(f.$('[data-mean-line]')),time>=10);
    assert.equal(visible(f.$('[data-divisor-label]')),time>=20&&time<30);
    assert.equal(visible(f.$('[data-result-label]')),time>=25&&time<30);
    assert.equal(visible(f.$('[data-scope-label]')),time>=30);
    assert.equal(visible(f.$('[data-comparison-profile="1"]')),time>=30);
    const formula=f.$('[data-formula]');assert.equal(formula.classList.contains('la-mean-shown'),time>=10);
    assert.equal(formula.classList.contains('la-norm-shown'),time>=10);assert.equal(formula.classList.contains('la-boundary-shown'),time>=35);
    assert.equal(f.w.getComputedStyle(f.$('#eq-layernorm-axis-2')).visibility,time>=10?'visible':'hidden',
      'the x-minus-mean term must be readable during centering, not only after division');
    if(time<25)assert.doesNotMatch(f.$('[data-figure] svg').getAttribute('aria-label'),/unit variance|approximately unit/);
    if(time>=25&&time<30)assert.match(f.$('[data-result-label]').textContent,/variance.*0\.999998/);
  }
});

test('LayerNorm axis: phone reflow retains readable labels and rounded pixels, not rounded statistics',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  const style=f.d.createElement('style');style.textContent=read('layernorm-axis/player.css');f.d.head.append(style);
  for(const width of widths) {
    f.resize(width);
    for(const time of [0,5,10,13.3333333,15,20,23.3333333,25,30,35,40]) {
      f.seek(time);const state=f.w.BookLayerNormAxis.buildState(time),svg=f.$('[data-figure] svg'),box=numbers(svg.getAttribute('viewBox'));
      assert.equal(box[2],width);
      for(const key of ['currentDivisor','currentMean','currentVariance'])assert.equal(Number(f.root.dataset[key]),state[key]);
      closeTree(data(f,'currentValues'),state.currentValues,0);
      const expectedRows=oracle(FIXTURE),actualRows=data(f,'rows');
      for(let row=0;row<4;row++)closeTree(actualRows[row].normalized,expectedRows[row].normalized);
      for(const node of [...drawing(f).querySelectorAll('text')].filter(visible)) {
        assert(parseFloat(f.w.getComputedStyle(node).fontSize)>=12,`small label at ${width}px: ${node.textContent}`);
        assert(attr(node,'x')>=0&&attr(node,'x')<=width);assert(attr(node,'y')>=0&&attr(node,'y')<=box[3]);
      }
      for(const feature of [0,3]) {
        const label=f.$(`[data-current-value="${feature}"]`);if(!visible(label))continue;
        // A conservative numerical-glyph width at the actual 13px type size.
        // Browser review remains authoritative; this catches the prior 14px
        // endpoint gutter that put -1.342 across the vertical axis.
        const halfWidth=label.textContent.length*parseFloat(f.w.getComputedStyle(label).fontSize)*0.6/2;
        assert(attr(label,'x')-halfWidth>=Number(f.root.dataset.plotMinX)+1);
        assert(attr(label,'x')+halfWidth<=Number(f.root.dataset.plotMaxX)-1);
      }
      for(const node of drawing(f).querySelectorAll('*'))for(const key of ['x','x1','x2','y','y1','y2','cx','cy','width','height']) {
        if(!node.hasAttribute(key))continue;
        const value=attr(node,key);assert(Number.isFinite(value));assert.equal(value,Number(value.toFixed(9)));
        if(visible(node)&&!node.closest('[transform]')) {
          const limit=key.startsWith('x')||key==='cx'||key==='width'?width:box[3];
          assert(value>=0&&value<=limit,`${key}=${value} exceeds ${limit} at ${width}`);
        }
      }
      for(const node of drawing(f).querySelectorAll('[d],[transform]'))
        for(const value of numericTokens(node.getAttribute('d')||node.getAttribute('transform')))assert.equal(value,Number(value.toFixed(9)));
      if(width<560)assert(Number(f.root.dataset.plotTop)>Math.max(...data(f,'rowYs'))+30);
      else assert(Number(f.root.dataset.plotMinX)>Number(f.root.dataset.tableWidth));
      assert(drawing(f).querySelectorAll('*').length<180);
    }
  }
});

test('LayerNorm axis: arbitrary seeking and resize history reproduce the complete state',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  const snapshot=()=>JSON.stringify({drawing:canonicalMarkup(f.$('[data-figure]').innerHTML),
    formula:canonicalMarkup(f.$('[data-formula]').outerHTML),caption:f.$('[data-caption]').innerHTML,
    state:Object.fromEntries(Object.entries(f.root.dataset).filter(([key])=>!['time','playing','typeset'].includes(key)))});
  const times=[0,5,10,12.1,13.7,15,20,22.1,23.7,25,30,35,40];
  const snapshots=times.map(time=>{f.seek(time);return snapshot();});
  f.play();f.tick(1111);f.resize(296);f.seek(23.1);f.resize(713);
  assert.deepEqual(times.toReversed().map(time=>{f.seek(time);return snapshot();}),snapshots.toReversed());
});

test('LayerNorm axis: both static fallback frames retain the final evidence without controls',async t=>{
  const generated=await staticFrame(NAME);assert.equal(generated.before,generated.after,'regenerate LayerNorm static frames');
  const f=fixture(t,NAME),narrow=f.$('[data-static-frame="narrow"]');assert(narrow);
  assert.equal(narrow.dataset.width,'296');const height=Number(narrow.dataset.height);
  const ids=[...f.root.querySelectorAll('[id]')].map(node=>node.id);assert.equal(ids.length,new Set(ids).size);
  for(const frame of [drawing(f),narrow])assert.match(frame.textContent,/mean|variance|var/i);
  f.load();f.open();f.seek(40);f.resize(296);
  assert.equal(f.root.querySelectorAll('[data-static-frame="narrow"]').length,0);
  assert.equal(numbers(f.$('[data-figure] svg').getAttribute('viewBox'))[3],height);
});

test('LayerNorm axis: square-root ULP differences cannot change generated static SVG bytes',()=>{
  // Exercise the real static generator in an isolated process; do not perturb
  // the fixture or reduce the independent 1e-12 arithmetic checks above.
  const diagnostic=String.raw`
    const assert=require('node:assert/strict');
    const harness=require(process.argv[1]+'/scripts/html-tests/excerpt-harness.cjs');
    const originalFixture=harness.fixture;
    let offset=0;
    const adjacent=value=>{
      const view=new DataView(new ArrayBuffer(8));view.setFloat64(0,value);
      view.setBigUint64(0,view.getBigUint64(0)+BigInt(offset));return view.getFloat64(0);
    };
    harness.fixture=(...args)=>{
      const f=originalFixture(...args),sqrt=f.w.Math.sqrt;
      f.w.Math.sqrt=value=>{const result=sqrt(value);return result>0&&Number.isFinite(result)?adjacent(result):result;};return f;
    };
    const {staticFrame}=require(process.argv[1]+'/scripts/render_static_frames.cjs');
    (async()=>{
      const base=await staticFrame('layernorm-axis');assert.equal(base.before,base.after);
      for(const ulps of [-4,-2,-1,1,2,4]) {
        offset=ulps;const next=await staticFrame('layernorm-axis');
        assert.equal(next.after,base.after,'static SVG changed under '+ulps+' ULPs of sqrt');
      }
    })().catch(error=>{console.error(error.message);process.exitCode=1;});
  `;
  execFileSync(process.execPath,['-e',diagnostic,ROOT],{stdio:'pipe',timeout:15000});
});

test('LayerNorm axis: the explanation is before affine rescaling and does not invent batch statistics',t=>{
  const f=fixture(t,NAME),boundary=f.$('.mechanism-boundary').textContent;
  assert.match(boundary,/before.*(?:learned|affine)|(?:learned|affine).*not/i);
  assert.match(boundary,/epsilon|eps|ε|positive stability constant/i);assert.match(boundary,/approximat(?:e|ely)|slightly|not exactly|less than|nearly/i);
  assert.match(boundary,/token|feature/i);assert.match(boundary,/batch|other tokens|independen|never across tokens or examples/i);
  f.load();f.open();assert.equal(f.root.querySelectorAll('input[type="range"]').length,1);
  const filter=fs.readFileSync(path.join(ROOT,scene.filter),'utf8');
  assert.match(filter,/^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
  assert.doesNotMatch(read('layernorm-axis/player.js'),/Math\.random|fetch\(|import\(|setInterval\(/);
  assert.doesNotMatch(read('layernorm-axis/panel.html'),/@eq-/);
});

test('LayerNorm axis: the image and sequence explanation states the training, padding and evaluation boundaries',t=>{
  const f=fixture(t,NAME),paragraphs=[...f.root.querySelectorAll('.mechanism-explanation')];
  assert.equal(paragraphs.length,2,'one short explanation for spatial sharing and one for token-local statistics');
  const [images,sequences]=paragraphs.map(node=>node.textContent.replace(/\s+/g,' ').trim());
  assert.match(images,/one convolutional channel/i);assert.match(images,/across images and positions/i);
  assert.match(images,/fixed image size is not a requirement of BatchNorm/i);
  assert.match(images,/by default,? evaluation uses running statistics/i);
  assert.match(sequences,/temporal BatchNorm.*B,\s*T/i);
  assert.match(sequences,/unmasked padding enters those statistics/i);
  assert.match(sequences,/masked pooling gives longer sequences more entries/i);
  assert.match(sequences,/with (?:a|that) token.s input features held fixed/i);
  assert.match(sequences,/padding elsewhere or different batchmates cannot change its LayerNorm result/i);
  assert.match(sequences,/same calculation in training and evaluation/i);
  assert.match(sequences,/attention and loss masks are still needed/i);
  const transcript=f.$('.mechanism-transcript').textContent.replace(/\s+/g,' ');
  assert.match(transcript,/naive temporal BatchNorm pooling.*causal.*future positions/i);
  assert.match(transcript,/attention may already have mixed context into those features/i,
    'token-local normalization is not a claim that the whole Transformer ignores context');
  for(const paragraph of paragraphs)assert(!paragraph.closest('[data-pane]'),
    'the compact explanation does not turn the animation picture into a prose dashboard');
});
