#!/usr/bin/env node
// Independent token statistics and normalization-axis checks; no training or
// invented BatchNorm outputs. The closing perturbation test (a declared computed
// variant: one neighbor token doubled) is checked from the DOM at named times: the
// pooled-mean pointer is the mean of the feature column as drawn, LayerNorm's pointer
// and profile never move, and no answer is shown while a caption asks for a prediction.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const {execFileSync}=require('node:child_process');
const {ROOT,read,entry,chapterSource,numbers,close,canonicalMarkup,drawnMarkup,fixture,
  registerTransportTests,registerBeatHoldTest,registerGrammarTests}=require('./html-tests/excerpt-harness.cjs');
const {staticFrame}=require('./render_static_frames.cjs');

const NAME='layernorm-axis-excerpt',scene=entry(NAME),widths=[240,296,360,519,520,553,559,560,713];
const FIXTURE={input:[[[1,3,5,7],[40,50,60,70]],[[-3,1,5,9],[2,2.5,3,3.5]]],normalizedShape:[4],selected:[0,0],eps:1e-5};
// The declared computed variant: example 1's second token doubled; BatchNorm's pool read on feature 1.
const VARIANT={neighbor:[0,1],factor:2,feature:0};
const perturbed=(source,change,factor=change.factor)=>({...source,input:source.input.map((batch,b)=>batch.map((row,t)=>
  b===change.neighbor[0]&&t===change.neighbor[1]?row.map(value=>value*factor):row.slice()))});
const columnMean=(source,feature)=>mean(source.input.flat().map(row=>row[feature]));
const data=(f,key)=>JSON.parse(f.root.dataset[key]);
const attr=(node,key)=>Number(node.getAttribute(key));
const visible=node=>Boolean(node&&!node.closest('[hidden]'));
const drawing=f=>f.$('[data-drawing]');
const numericTokens=text=>(text.match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi)||[]).map(Number);
const PIXEL_EPSILON=5.1e-5; // half the 4-decimal geometry serialisation step (0.0001 px), plus slack
// The picture prints a true minus sign (U+2212); parse it back before comparing numbers.
const printed=text=>Number(text.replace('−','-'));
const withStyle=f=>{const style=f.d.createElement('style');style.textContent=read('layernorm-axis/player.css');f.d.head.append(style);return f;};
const cell=(f,row,feature)=>f.$(`[data-input-cell="${row}:${feature}"]`);
// The tensor exactly as the table draws it: each numeral's unrounded source value.
const drawnTensor=f=>({...FIXTURE,input:[0,1].map(b=>[0,1].map(t=>[0,1,2,3].map(k=>Number(cell(f,2*b+t,k).dataset.valueSource))))});
const pointerX=node=>numericTokens(node.getAttribute('transform'))[0];
// The statistics line's scale, read back from what it prints: its two ends and their labels.
const statScale=f=>{
  const line=f.$('[data-stat-line]'),x1=attr(line,'x1'),x2=attr(line,'x2');
  const low=printed(f.$('[data-stat-end="low"]').textContent),high=printed(f.$('[data-stat-end="high"]').textContent);
  return Object.assign(value=>x1+(value-low)/(high-low)*(x2-x1),{low,high,x1,x2,y:attr(line,'y1')});
};
const TURN=[7.5,10];// the axis turn: still before it, finished exactly at the beat it leads into
const ANSWER=/\d\s*→|\(was |did not move|unchanged|moved from|doubled to/i;
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
  assert.deepEqual(data(f,'fixture'),FIXTURE);assert.deepEqual(data(f,'variant'),VARIANT);
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
      // Without a declared change there is no perturbation test, so the column's only
      // appearance is before the turn; the ghost carries it afterwards.
      assert.equal(state.bnFeature,0);assert.equal(state.bnVisible,time<TURN[1]);assert.equal(state.bnGhostVisible,time>TURN[0]);
      assert.deepEqual(JSON.parse(JSON.stringify(state.bnGroups)),featureIndices.map(()=>rowIndices));
      assert.deepEqual(JSON.parse(JSON.stringify(state.lnGroups)),rowIndices.map(()=>featureIndices));
      for(let feature=0;feature<features;feature++) {
        const members=state.bnGroups[feature].map(row=>[state.rows[row].batch,state.rows[row].token,feature]);
        const expected=source.input.flatMap((batch,b)=>batch.map((_,token)=>[b,token,feature]));
        assert.deepEqual(JSON.parse(JSON.stringify(members)),expected);
      }
    }
  }
  // The live BatchNorm column holds until the turn finishes, becomes a muted ghost through
  // LayerNorm's own beats, and lights up again for the perturbation test.
  for(const time of [0,4.99,5,7.5,8.75,9.99,10,20,29.99,30,35,40]) {
    const state=f.w.BookLayerNormAxis.buildState(time);
    assert.equal(state.bnVisible,time<10||time>=30,`live BatchNorm column at ${time}s`);
    assert.equal(state.bnGhostVisible,time>7.5&&time<30,`ghost column at ${time}s`);
    assert(state.bnVisible||state.bnGhostVisible,`the contrasted axis left the picture at ${time}s`);
    assert.equal(state.testVisible,time>=30);assert.equal(state.answerVisible,time>=35);
    assert.equal(state.bnFeature,VARIANT.feature);assert.equal(state.neighborIndex,1);
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
    // A tensor passed without a declared change has no perturbation test at all.
    assert.equal(final.testVisible,false);assert.equal(final.neighborIndex,-1);closeTree(final.liveRows.map(row=>row.raw),final.rows.map(row=>row.raw),0);
    // Any other existing token may be the declared neighbor: the same LayerNorm is re-run on the changed tensor.
    const tokens=source.input[0].length,selected=source.selected[0]*tokens+source.selected[1];
    for(let index=0;index<source.input.length*tokens;index++)if(index!==selected)for(const factor of [2,-3,0.5]) {
      const change={neighbor:[Math.floor(index/tokens),index%tokens],factor,feature:source.normalizedShape[0]-1};
      const state=f.w.BookLayerNormAxis.buildState(40,false,source,change),after=perturbed(source,change),expected=oracle(after);
      verifyState(state,source,40);assert.equal(state.neighborIndex,index);close(state.perturbFactor,factor);
      expected.forEach((row,j)=>Object.entries(row).forEach(([key,value])=>closeTree(state.liveRows[j][key],value)));
      closeTree(state.liveRows[selected].normalized,state.rows[selected].normalized,0);
      close(state.columnMeanBefore,columnMean(source,change.feature));close(state.columnMean,columnMean(after,change.feature));
    }
    assert.equal(JSON.stringify(source),before);
  }
});

test('LayerNorm axis: ragged shapes, invalid selection and nonpositive epsilon fail explicitly',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const patch of [{input:[]},{input:[[]]},{input:[[[]]]},{input:[[[1,2],[1]]]},{input:[[[1,2]],[[1,2],[3,4]]]},
    {input:[[[1,NaN,3,4]]]},{normalizedShape:[2]},{normalizedShape:[]},{normalizedShape:[2,2]},
    {selected:[-1,0]},{selected:[0,2]},{selected:[0.5,0]},{selected:[0]},{eps:0},{eps:-1},{eps:NaN},{eps:Infinity}])
    assert.throws(()=>f.w.BookLayerNormAxis.buildState(40,false,{...FIXTURE,...patch}),/shape|finite|positive|select|row|feature|tensor|rectangular|input|epsilon|eps/i);
  // The perturbed token must be ANOTHER existing token; its factor finite; the pooled feature a real column.
  for(const patch of [{neighbor:[0,0]},{neighbor:[2,0]},{neighbor:[0,2]},{neighbor:[0.5,1]},{neighbor:[1]},{neighbor:null},
    {factor:NaN},{factor:Infinity},{feature:4},{feature:-1},{feature:0.5}])
    assert.throws(()=>f.w.BookLayerNormAxis.buildState(40,false,FIXTURE,{...VARIANT,...patch}),/neighbor|factor|feature/i);
  assert.throws(()=>f.w.BookLayerNormAxis.buildState(40,false,FIXTURE,'double it'),/neighbor|factor|feature/i);
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

test('LayerNorm axis: LayerNorm\'s outline encloses exactly one token\'s four feature cells, at every width',t=>{
  const f=fixture(t,NAME);f.load();f.open();const rows=oracle(FIXTURE);
  const inside=(node,box)=>attr(node,'x')>attr(box,'x')&&attr(node,'x')<attr(box,'x')+attr(box,'width')
    &&attr(node,'y')>attr(box,'y')&&attr(node,'y')<attr(box,'y')+attr(box,'height');
  for(const width of widths) {
    f.resize(width);
    for(const time of [0,5,7.5,10,15,25,30,34,40]) {
      f.seek(time);assert.equal(drawing(f).querySelectorAll('[data-input-cell]').length,16);
      for(let row=0;row<4;row++) {
        const cells=rows[row].raw.map((value,feature)=>{
          const node=cell(f,row,feature);assert.doesNotMatch(node.textContent,/-/,'printed minus is U+2212');
          // Every row but the declared neighbor prints the manuscript value at every time.
          if(row!==1||time<=30){assert.equal(printed(node.textContent),value);assert.equal(Number(node.dataset.valueSource),value);}
          return node;
        });
        assert(cells.every(node=>attr(node,'y')===attr(cells[0],'y')));
        for(let index=1;index<cells.length;index++)assert(attr(cells[index],'x')>attr(cells[index-1],'x'));
      }
      const selected=f.$('[data-selected-row]');assert.equal(visible(selected),time>TURN[0],'the turning highlight stays on screen through the perturbation test');
      if(visible(selected)&&time>=TURN[1]) {
        const members=[...drawing(f).querySelectorAll('[data-input-cell]')].filter(node=>inside(node,selected)).map(node=>node.dataset.inputCell);
        assert.deepEqual(members,['0:0','0:1','0:2','0:3'],'once turned, LayerNorm pools this token\'s features and no other row');
      }
      // The band on the perturbed row never reaches into LayerNorm's outline.
      const band=f.$('[data-neighbor-row]');assert.equal(visible(band),time>=30);
      if(time<TURN[1])continue;
      assert.deepEqual([...drawing(f).querySelectorAll('[data-input-cell]')].filter(node=>inside(node,band)).map(node=>node.dataset.inputCell),['1:0','1:1','1:2','1:3']);
      assert(attr(band,'y')>=attr(selected,'y')+attr(selected,'height'),'the two row boxes do not overlap');
    }
  }
});

test('LayerNorm axis: the opening BatchNorm column becomes a LayerNorm row, and both return for the test',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const width of widths) {
    f.resize(width);
    for(const time of [0,2.5,4.99,5,7.5,8.75,9.99,10,15,25,29.99,30,34,35,40]) {
      f.seek(time);const column=f.$('[data-bn-column]'),ghost=f.$('[data-bn-column-ghost]'),bracket=f.$('[data-bn-column-bracket]'),both=time>=30;
      assert(column&&bracket&&ghost,'the training-time BatchNorm reduction has explicit geometry');
      assert.equal(visible(column),time<TURN[1]||both);assert.equal(visible(bracket),time<TURN[1]||both);
      assert.equal(f.root.dataset.bnVisible,String(time<TURN[1]||both));
      // The ghost sits exactly where the live band does, so the column never appears to move.
      assert.equal(visible(ghost),time>TURN[0]&&!both);assert.equal(f.root.dataset.bnGhostVisible,String(time>TURN[0]&&!both));
      for(const key of ['x','y','width','height'])assert.equal(attr(ghost,key),attr(column,key));
      // Live band and ghost cross-fade: their inks always sum to one, so neither flashes.
      const live=Number(column.getAttribute('opacity'));
      close(live,both?1:1-Number(f.root.dataset.turnProgress),PIXEL_EPSILON);
      close(live+Number(ghost.getAttribute('opacity')),1,PIXEL_EPSILON);
      assert.equal(column.getAttribute('opacity'),bracket.getAttribute('opacity'),'the bracket fades with the band it names');
      assert(visible(column)||visible(ghost),`the contrasted axis left the picture at ${time}s`);
      const inColumn=[],cells=[...drawing(f).querySelectorAll('[data-input-cell]')];
      assert.equal(cells.length,16,'the BN contrast reuses, rather than replaces, the manuscript tensor');
      for(const node of cells) {
        const [row,feature]=node.dataset.inputCell.split(':').map(Number);
        if(row!==1||time<=30)assert.equal(printed(node.textContent),FIXTURE.input.flat()[row][feature]);
        if(attr(node,'x')>attr(column,'x')&&attr(node,'x')<attr(column,'x')+attr(column,'width')
          &&attr(node,'y')>attr(column,'y')&&attr(node,'y')<attr(column,'y')+attr(column,'height'))
          inColumn.push([row,feature]);
      }
      // The muted ghost keeps naming the same four cells, and never re-emphasises them.
      // Rows 1-3 are the ghost's alone; row 0 is heavy because LayerNorm's live group claims it.
      for(const node of cells)if(visible(ghost)&&!visible(column)&&[1,2,3].includes(Number(node.dataset.row))&&node.dataset.feature==='0')
        assert.match(node.getAttribute('class'),/la-idle/,'the ghost column leaves its numerals grey');
      assert.deepEqual(inColumn,[[0,0],[1,0],[2,0],[3,0]],
        'temporal BatchNorm pools one feature across both examples and both token positions');
      const xy=numericTokens(bracket.getAttribute('d'));
      assert.equal(xy.length,8);const ys=xy.filter((_,index)=>index%2===1);
      assert(Math.min(...ys)<=attr(cell(f,0,0),'y'));assert(Math.max(...ys)>=attr(cell(f,3,0),'y'));
      assert(Math.max(...xy.filter((_,index)=>index%2===0))<attr(column,'x'),'the side bracket stands clear of the band it names');
      assert(visible(f.$('[data-axis-key]')),'the contrasting reduction axes remain labeled');
      if(time<=TURN[0]) {
        assert(!visible(f.$('[data-selected-row]')));assert(!visible(f.$('[data-current-profile]')));
        assert.match(f.$('[data-figure] svg').getAttribute('aria-label'),/BatchNorm|batch normalization/i);
        assert.match(f.$('[data-caption]').textContent,/batchnorm|column/i);
      } else {
        assert(visible(f.$('[data-selected-row]')));assert(visible(f.$('[data-current-profile]')));
        if(time<30)assert.match(f.$('[data-caption]').textContent,/token|feature|mean|profile|centered|row/i);
      }
      if(both) {
        // The two groups cross in exactly one cell, the tracked token's own feature 1; the
        // perturbed row crosses BatchNorm's column in exactly one other, and LayerNorm's row in none.
        const selected=f.$('[data-selected-row]');
        assert(attr(selected,'x')>attr(column,'x')&&attr(selected,'y')>attr(column,'y'),'the row outline nests inside the column band, no coincident edges');
        assert.match(f.$('[data-figure] svg').getAttribute('aria-label'),/Both groups are outlined on the same tensor/);
      }
    }
  }
});

test('LayerNorm axis: the nonnumeric CNN sketch holds one channel and pools images plus both spatial axes',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const width of widths) {
    f.resize(width);
    for(const time of [0,4.99,5,7.5,7.6,20,40]) {
      f.seek(time);const sketch=f.$('[data-cnn-bn-schematic]');assert(sketch);
      // The sketch stands through the beat-1 still and hands its space to the plot as the turn starts.
      assert.equal(visible(sketch),time<=TURN[0]);
      assert.equal(visible(sketch),!visible(f.$('[data-plot-frame]')),'the sketch and the plot never share the space');
      if(time>TURN[0])continue;assert.equal(sketch.dataset.heldAxis,'channel');
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
  const f=fixture(t,NAME);f.load();f.open();
  for(const width of widths) {
    f.resize(width);let fixedUnit;
    // The ruler exists from the moment the turn opens the plot, never before it.
    for(const time of [7.5,8.75,10,12.1234567,13.5,15,20,22.1234567,23.5,25,30,34,35,40]) {
      f.seek(time);
      if(time<=TURN[0]){assert(!visible(f.$('[data-plot-frame]')));continue;}
      const state=f.w.BookLayerNormAxis.buildState(time),frame=numericTokens(f.$('[data-plot-frame]').getAttribute('d'));
      assert.equal(frame.length,6);const [left,top,,bottom,right]=frame;
      const yMin=-5,yMax=9,unit=(bottom-top)/(yMax-yMin);
      close(Number(f.root.dataset.yMin),yMin);close(Number(f.root.dataset.yMax),yMax);
      if(fixedUnit===undefined)fixedUnit=unit;close(unit,fixedUnit);
      close(Number(f.root.dataset.pixelsPerUnit),unit);
      const xs=[0,1,2,3].map(index=>attr(f.$(`[data-x-label="${index}"]`),'x'));
      assert(xs[0]>left&&xs.at(-1)<right);closeTree(data(f,'featureXs'),xs,PIXEL_EPSILON);
      // The plot's feature positions carry the table's own column names.
      [0,1,2,3].forEach(index=>assert.equal(f.$(`[data-x-label="${index}"]`).textContent,f.$(`[data-feature-heading="${index}"]`).textContent));
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
      // No other token's values, raw or normalized, are ever drawn on this token's ruler.
      assert.equal(drawing(f).querySelectorAll('[data-comparison-profile],[data-comparison-marker]').length,0);
      const numbered=[...drawing(f).querySelectorAll('[data-y-label]')].filter(visible).map(node=>printed(node.textContent));
      assert.deepEqual(numbered,[-4,0,4,8],'every guide is drawn; every other one is numbered');
      assert.equal([...drawing(f).querySelectorAll('[data-y-tick]')].filter(visible).length,7);
    }
  }
});

test('LayerNorm axis: means, divisor, output and the perturbation test reveal in causal order',t=>{
  const f=withStyle(fixture(t,NAME));f.load();f.open();
  for(const time of [0,4.99,5,7.5,7.6,8.75,9.99,10,12.5,15,19.99,20,23.5,24.99,25,29.99,30,32.9,34,34.99,35,40]) {
    f.seek(time);
    assert.equal(visible(f.$('[data-current-profile]')),time>TURN[0],'the profile arrives with the turn that selects its row');
    assert.equal(visible(f.$('[data-mean-line]')),time>=10);
    assert.equal(visible(f.$('[data-divisor-label]')),time>=20&&time<30);
    assert.equal(visible(f.$('[data-result-label]')),time>=25&&time<30);
    assert.equal(visible(f.$('[data-stat-strip]')),time>=30,'the statistics line arrives with the test and never before');
    const formula=f.$('[data-formula]');assert.equal(formula.classList.contains('la-mean-shown'),time>=10);
    assert.equal(formula.classList.contains('la-norm-shown'),time>=10);assert.equal(formula.classList.contains('la-variance-shown'),time>=25);
    assert.equal(formula.classList.contains('la-centering'),time>=10&&time<20);assert.equal(formula.classList.contains('la-scaling'),time>=20&&time<30);
    assert.equal(formula.classList.contains('la-testing'),time>=30,'during the test the sum over this token\'s features is lit');
    assert.equal(f.w.getComputedStyle(f.$('#eq-layernorm-axis-2')).visibility,time>=10?'visible':'hidden',
      'the x-minus-mean term must be readable during centering, not only after division');
    assert.equal(f.w.getComputedStyle(f.$('#eq-layernorm-axis-3')).visibility,time>=25?'visible':'hidden',
      'the variance identity arrives with the claim it qualifies');
    if(time<25)assert.doesNotMatch(f.$('[data-figure] svg').getAttribute('aria-label'),/unit variance|approximately unit/);
    if(time>=25&&time<30)assert.match(f.$('[data-result-label]').textContent,/variance.*0\.999998/);
  }
  assert.match(f.$('#eq-layernorm-axis-1').textContent,/\\class\{la-pool-term\}\{\\sum_k\}/);
});

test('LayerNorm axis: phone reflow retains readable labels and rounded pixels, not rounded statistics',t=>{
  const f=withStyle(fixture(t,NAME));f.load();f.open();
  for(const width of widths) {
    f.resize(width);
    for(const time of [0,5,10,13.3333333,15,20,23.3333333,25,30,34.1234567,35,40]) {
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
        const value=attr(node,key);assert(Number.isFinite(value));assert.equal(value,Number(value.toFixed(4)),'geometry is serialised at 0.0001 px');
        if(visible(node)&&!node.closest('[transform]')) {
          const limit=key.startsWith('x')||key==='cx'||key==='width'?width:box[3];
          assert(value>=0&&value<=limit,`${key}=${value} exceeds ${limit} at ${width}`);
        }
      }
      for(const node of drawing(f).querySelectorAll('[d],[transform]'))
        for(const value of numericTokens(node.getAttribute('d')||node.getAttribute('transform')))assert.equal(value,Number(value.toFixed(4)));
      if(width<560)assert(Number(f.root.dataset.plotTop)>Math.max(...data(f,'rowYs'))+30);
      else assert(Number(f.root.dataset.plotMinX)>Number(f.root.dataset.tableWidth));
      assert(drawing(f).querySelectorAll('*').length<120,'the comparison marks are gone; the picture stays small');
    }
  }
});

test('LayerNorm axis: arbitrary seeking and resize history reproduce the complete state',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  const snapshot=()=>JSON.stringify({drawing:canonicalMarkup(f.$('[data-figure]').innerHTML),
    formula:canonicalMarkup(f.$('[data-formula]').outerHTML),caption:f.$('[data-caption]').innerHTML,
    state:Object.fromEntries(Object.entries(f.root.dataset).filter(([key])=>!['time','playing','typeset'].includes(key)))});
  const times=[0,5,10,12.1,13.7,15,20,22.1,23.7,25,30,32.9,33.4,34.6,35,40];
  const snapshots=times.map(time=>{f.seek(time);return snapshot();});
  f.play();f.tick(1111);f.resize(296);f.seek(34.2);f.resize(713);
  assert.deepEqual(times.toReversed().map(time=>{f.seek(time);return snapshot();}),snapshots.toReversed());
});

test('LayerNorm axis: both static fallback frames retain the final evidence without controls',async t=>{
  const generated=await staticFrame(NAME);assert.equal(generated.before,generated.after,'regenerate LayerNorm static frames');
  const f=fixture(t,NAME),narrow=f.$('[data-static-frame="narrow"]');assert(narrow);
  assert.equal(narrow.dataset.width,'296');const height=Number(narrow.dataset.height);
  const ids=[...f.root.querySelectorAll('[id]')].map(node=>node.id);assert.equal(ids.length,new Set(ids).size);
  // Script-free, either print alone tells the new story: the doubled neighbor, the pooled
  // mean's move, the unmoved token statistics and profile, under the consequence caption.
  for(const frame of [drawing(f),narrow]) {
    const text=name=>frame.querySelector(name).textContent;
    assert.deepEqual([0,1,2,3].map(k=>printed(frame.querySelector(`[data-input-cell="1:${k}"]`).textContent)),[80,100,120,140]);
    assert.match(text('[data-bn-label]'),/BN f1 column mean 10 → 20/);assert.match(text('[data-ln-label]'),/LN row mean 4: did not move/);
    assert.match(text('[data-group-label]'),/ex1 · t2 × 2 \(was 40, 50, 60, 70\)/);assert.match(text('[data-profile-title]'),/did not move/);
    assert.deepEqual([0,1,2,3].map(k=>text(`[data-current-value="${k}"]`)),['−1.342','−0.447','0.447','1.342']);
    for(const name of ['[data-bn-column]','[data-selected-row]','[data-neighbor-row]','[data-stat-strip]','[data-bn-ghost]'])
      assert(!frame.querySelector(name).closest('[hidden]'),`${name} is part of the final frame`);
    assert(frame.querySelector('[data-cnn-bn-schematic]').hasAttribute('hidden'));
  }
  assert.match(f.$('[data-caption]').textContent,/does not depend on batchmates or sequence length.*BatchNorm's statistics do.*[Bb]efore learned scale and shift/);
  assert.match(f.$('[data-figure] svg').getAttribute('aria-label'),/doubled to 80, 100, 120, 140\. The pooled mean moved from 10 to 20\. This token's mean, variance and normalized profile did not move/);
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

// ---- The perturbation test (value redesign, September 18, 2026) ----

test('LayerNorm axis: the perturbation is the declared variant, and of BatchNorm only the pooled mean is computed',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  const after=perturbed(FIXTURE,VARIANT),before=oracle(FIXTURE),then=oracle(after);
  // The arithmetic the receipt declares, from the fixture alone.
  assert.deepEqual(after.input[0][1],[80,100,120,140]);
  assert.equal(columnMean(FIXTURE,0),(1+40-3+2)/4);assert.equal(columnMean(FIXTURE,0),10);
  assert.equal(columnMean(after,0),(1+80-3+2)/4);assert.equal(columnMean(after,0),20);
  assert.equal(then[0].mean,4);assert.equal(then[0].variance,5);closeTree(then[0].normalized,before[0].normalized,0);
  assert.deepEqual(then[0].normalized.map(value=>Number(value.toFixed(3))),[-1.342,-0.447,0.447,1.342]);
  // The doubled token's own statistics change (mean 55 to 110, variance 125 to 500); its LayerNorm
  // output moves only through epsilon, and is never drawn.
  close(then[1].mean,110);close(then[1].variance,500);
  for(const row of [2,3])closeTree(then[row].normalized,before[row].normalized,0);
  const state=f.w.BookLayerNormAxis.buildState(40);
  then.forEach((row,j)=>Object.entries(row).forEach(([key,value])=>closeTree(state.liveRows[j][key],value)));
  close(state.columnMeanBefore,10);close(state.columnMean,20);close(state.perturbFactor,2);
  assert.equal(Object.keys(state).filter(key=>/bn.*(normal|output)|batch.*(normal|output)/i.test(key)).length,0,'no BatchNorm output exists in the state');
  f.seek(40);
  assert.deepEqual(drawnTensor(f).input,after.input);
  assert.equal(f.$('[data-bn-label]').textContent,'BN f1 column mean 10 → 20');assert.equal(f.$('[data-ln-label]').textContent,'LN row mean 4: did not move');
  assert.equal(Object.keys(f.root.dataset).filter(key=>/bn.*(normal|output)|batch.*(normal|output)/i.test(key)).length,0);
  // The scale is fixed by the fixture and the declared variant, and its printed end is not the answer.
  const scale=statScale(f);assert.equal(scale.low,0);assert.equal(scale.high,25);assert.notEqual(scale.high,columnMean(after,0));
});

test('LayerNorm axis: the neighbor\'s motion drives BatchNorm\'s pointer and nothing of LayerNorm\'s',t=>{
  const f=fixture(t,NAME);f.load();f.open();const base=oracle(FIXTURE)[0];
  for(const width of [296,713]) {
    f.resize(width);f.seek(25);
    const restProfile=f.$('[data-current-profile]').getAttribute('d'),restLabels=[0,1,2,3].map(k=>f.$(`[data-current-value="${k}"]`).textContent);
    const restMarks=[0,1,2,3].map(k=>f.$(`[data-current-marker="${k}"]`).getAttribute('cy'));
    f.seek(30);const scale=statScale(f),lnRest=f.$('[data-ln-pointer]').getAttribute('transform');
    closePixel(pointerX(f.$('[data-ln-pointer]')),scale(4));closePixel(pointerX(f.$('[data-bn-pointer]')),scale(10));
    let last=-Infinity;const factors=new Map();
    for(let step=0;step<=200;step++) {
      const time=Number((30+step*0.05).toFixed(2));f.seek(time);const tensor=drawnTensor(f),neighbor=tensor.input[0][1];
      // One shared factor scales the whole neighbor row; every other row is the manuscript's.
      const factor=neighbor[0]/FIXTURE.input[0][1][0];factors.set(time,factor);
      closeTree(neighbor,FIXTURE.input[0][1].map(value=>value*factor));
      for(const [b,tk] of [[0,0],[1,0],[1,1]])assert.deepEqual(tensor.input[b][tk],FIXTURE.input[b][tk]);
      // BatchNorm's pointer IS the mean of the feature-1 column as drawn, on the fixed scale.
      const pooled=columnMean(tensor,0),x=pointerX(f.$('[data-bn-pointer]'));
      closePixel(x,scale(pooled));close(Number(f.$('[data-bn-pointer]').dataset.valueSource),pooled);
      assert(x>=last-PIXEL_EPSILON,'the pooled mean never retreats');last=x;
      assert.deepEqual([statScale(f).x1,statScale(f).x2,statScale(f).low,statScale(f).high],[scale.x1,scale.x2,scale.low,scale.high],'the scale itself never moves');
      // LayerNorm, re-run on the tensor as drawn, returns the same row statistics and output, bit for bit.
      const live=oracle(tensor)[0];assert.equal(live.mean,base.mean);assert.equal(live.variance,base.variance);closeTree(live.normalized,base.normalized,0);
      closeTree(data(f,'liveRows')[0].normalized,base.normalized,0);closeTree(data(f,'liveRows')[1].raw,neighbor,0);
      assert.equal(f.$('[data-ln-pointer]').getAttribute('transform'),lnRest,`LayerNorm's pointer moved at ${time}s`);
      assert.equal(f.$('[data-current-profile]').getAttribute('d'),restProfile,`the normalized profile moved at ${time}s`);
      assert.deepEqual([0,1,2,3].map(k=>f.$(`[data-current-value="${k}"]`).textContent),restLabels);
      assert.deepEqual([0,1,2,3].map(k=>f.$(`[data-current-marker="${k}"]`).getAttribute('cy')),restMarks);
      // The hollow "was here" mark and its tie appear only once the two ends are visibly apart.
      const apart=Math.abs(x-scale(10))>=2;
      assert.equal(visible(f.$('[data-bn-ghost]')),apart);assert.equal(visible(f.$('[data-bn-tie]')),apart);
      closePixel(pointerX(f.$('[data-bn-ghost]')),scale(10));
      if(apart){closePixel(attr(f.$('[data-bn-tie]'),'x1'),scale(10));closePixel(attr(f.$('[data-bn-tie]'),'x2'),x);}
    }
    // Named times: still through the prediction, a glide that ends AT the final beat, then rest.
    for(const time of [30,31,32.95])assert.equal(factors.get(time),1,`the neighbor is untouched at ${time}s`);
    assert(factors.get(33.5)>1&&factors.get(33.5)<factors.get(34)&&factors.get(34)<factors.get(34.5)&&factors.get(34.5)<2);
    close(factors.get(34),1.5,1e-9);
    for(const time of [35,37.5,40])assert.equal(factors.get(time),2,`the glide has finished by ${time}s`);
    f.seek(40);assert(pointerX(f.$('[data-bn-pointer]'))-scale(10)>=(width<560?60:120),'the pooled mean\'s move is large enough to see');
    // Mid-glide numerals are whole numbers for reading; the source values stay unrounded.
    f.seek(33.7);for(let k=0;k<4;k++){const node=cell(f,1,k);assert.match(node.textContent,/^\d+$/);assert.equal(printed(node.textContent),Math.round(Number(node.dataset.valueSource)));}
  }
});

test('LayerNorm axis: no answer is drawn, labelled or announced while a caption asks for a prediction',t=>{
  const f=fixture(t,NAME);f.load();f.open();const range=f.$('[data-controls] input[type=range]');
  const spans=[];let answered=null;
  for(let step=0;step<=800;step++) {
    const time=Number((step*0.05).toFixed(2));f.seek(time);
    const caption=f.$('[data-caption]').textContent,asks=/\?\s*$/.test(caption.trim());
    if(asks&&(!spans.length||spans.at(-1).end!==undefined&&time-spans.at(-1).end>0.051))spans.push({start:time,end:time,caption});
    else if(asks)spans.at(-1).end=time;
    const everyText=[...drawing(f).querySelectorAll('text')].map(node=>node.textContent).join(' | ');
    const label=f.$('[data-figure] svg').getAttribute('aria-label'),spoken=range.getAttribute('aria-valuetext');
    if(time<35) {
      // Not even a hidden node holds the outcome before the perturbation has finished playing.
      assert.doesNotMatch(everyText,ANSWER,`the drawing holds the answer at ${time}s`);
      assert.doesNotMatch(label,ANSWER,`the picture's name gives the answer away at ${time}s`);assert.doesNotMatch(spoken,ANSWER);
    } else if(answered===null)answered=time;
    if(asks&&time>=30) {
      assert.deepEqual(drawnTensor(f).input,FIXTURE.input,`the neighbor has started to move under the question at ${time}s`);
      closePixel(pointerX(f.$('[data-bn-pointer]')),statScale(f)(10));
      assert(!visible(f.$('[data-bn-ghost]'))&&!visible(f.$('[data-bn-tie]')));
      assert.equal(f.$('[data-bn-label]').textContent,'BN f1 column mean 10');assert.equal(f.$('[data-ln-label]').textContent,'LN row mean 4');
      assert.doesNotMatch(`${label} ${spoken}`,/\b20\b/);
    }
    if(asks&&time<5) {
      // The opening question (which axis?) is not answered by an early LayerNorm outline or profile.
      assert(!visible(f.$('[data-selected-row]'))&&!visible(f.$('[data-current-profile]')));assert.doesNotMatch(label,/LayerNorm groups/);
    }
    if(time>=30&&time<35&&!asks)assert.match(caption,/^The neighbor doubles\./,'the question is withdrawn before the neighbor moves');
  }
  assert.deepEqual(spans.map(span=>[span.start,span.end]),[[0,4.95],[30,32.95]],'two questions: which axis, then what moves');
  assert.match(spans[1].caption,/^Predict:.*neighbor.*double.*What moves/);
  assert.equal(answered,35,'the outcome is stated only once the perturbation has played');
  f.seek(35);
  assert.match(f.$('[data-bn-label]').textContent,/10 → 20/);assert.match(f.$('[data-ln-label]').textContent,/did not move/);
  assert.match(f.$('[data-profile-title]').textContent,/did not move/);assert.match(range.getAttribute('aria-valuetext'),/Pooled mean 10 to 20; token profile unchanged/);
});

test('LayerNorm axis: every reduced-motion still is the full-motion frame at its beat — a before and an after',t=>{
  const full=fixture(t,NAME),still=fixture(t,NAME,{reduced:true});
  for(const f of [full,still]){f.load();f.open();}
  scene.beats.forEach((beat,index)=>{
    const end=index+1<scene.beats.length?scene.beats[index+1]:scene.duration;
    full.seek(beat);const expected=drawnMarkup(full);
    for(const time of [beat,(beat+end)/2,end-0.01])
      {still.seek(time);assert.equal(drawnMarkup(still),expected,`the still at ${time}s is not the frame at the ${beat}s beat`);}
  });
  // Beat 6 is the BEFORE still under the question; beat 7 the AFTER still under the consequence.
  still.seek(34.9);
  assert.deepEqual(drawnTensor(still).input,FIXTURE.input);assert.match(still.$('[data-caption]').textContent,/^Predict:/);
  assert(!visible(still.$('[data-bn-ghost]')));assert.doesNotMatch(drawing(still).textContent,ANSWER);
  still.seek(35);
  assert.deepEqual(drawnTensor(still).input,perturbed(FIXTURE,VARIANT).input);assert.match(still.$('[data-caption]').textContent,/does not depend on batchmates/);
  assert(visible(still.$('[data-bn-ghost]')));closePixel(pointerX(still.$('[data-bn-pointer]')),statScale(still)(20));
  closePixel(pointerX(still.$('[data-ln-pointer]')),statScale(still)(4));
  // Under reduced motion no frame shows a half-doubled row.
  for(let time=30;time<=40;time+=0.25){still.seek(time);assert([1,2].includes(drawnTensor(still).input[0][1][0]/40));}
});

// JSDOM lays nothing out, so a label's box is estimated the way the other suites do it: a generous
// advance per glyph at the label's computed font size (0.6 em; capitals 0.75; a space 0.3; semibold a
// little wider), spanning baseline − 0.72 s … baseline + 0.22 s.
const advance=text=>[...text].reduce((sum,ch)=>sum+(ch===' '?0.3:/[A-Z]/.test(ch)?0.75:0.6),0);
function textBox(f,node) {
  const size=parseFloat(f.w.getComputedStyle(node).fontSize),heavy=/la-active/.test(node.getAttribute('class')||'')?1.06:1;
  const w=advance(node.textContent)*size*heavy,x=attr(node,'x'),y=attr(node,'y'),anchor=node.getAttribute('text-anchor');
  const x0=anchor==='middle'?x-w/2:anchor==='end'?x-w:x;
  return {text:node.textContent,x0,x1:x0+w,y0:y-0.72*size,y1:y+0.22*size};
}
const overlap=(a,b,margin=0)=>a.x0<b.x1+margin&&b.x0<a.x1+margin&&a.y0<b.y1+margin&&b.y0<a.y1+margin;

test('LayerNorm axis: labels collide with nothing — each other, a rest line, a pointer, a group edge or the picture edge',t=>{
  const f=withStyle(fixture(t,NAME));f.load();f.open();
  const rest=[0,5,10,15,20,25,30,32.9,35,40],moving=[13.5,23.5,33.6,34,34.6];
  for(const width of [296,302,360,519,520,560,640,713]) {
    f.resize(width);const height=numbers(f.$('[data-figure] svg').getAttribute('viewBox'))[3];
    for(const time of [...rest,...moving]) {
      f.seek(time);const where=`${time}s at ${width}px`;
      const nodes=[...drawing(f).querySelectorAll('text')].filter(node=>visible(node)&&node.textContent),texts=nodes.map(node=>textBox(f,node));
      for(const label of texts)assert(label.x0>=0&&label.x1<=width&&label.y0>=0&&label.y1<=height,`"${label.text}" leaves the picture, ${where}`);
      for(let a=0;a<texts.length;a++)for(let b=a+1;b<texts.length;b++)
        assert(!overlap(texts[a],texts[b]),`"${texts[a].text}" overlaps "${texts[b].text}", ${where}`);
      if(time>=30) {
        // Neither pointer, nor the hollow mark, nor the tie touches a label; each label sits on its own side of the line.
        const scale=statScale(f);
        for(const [name,y0,y1] of [['[data-ln-pointer]',-16,-3],['[data-bn-pointer]',3,16],['[data-bn-ghost]',3,16]]) {
          const node=f.$(name);if(!visible(node))continue;
          const x=pointerX(node),mark={x0:x-8,x1:x+8,y0:scale.y+y0,y1:scale.y+y1};
          for(const label of texts)assert(!overlap(mark,label,1),`${name} touches "${label.text}", ${where}`);
        }
        assert(textBox(f,f.$('[data-ln-label]')).y1<scale.y-16&&textBox(f,f.$('[data-bn-label]')).y0>scale.y+16);
        // Each label rides with its pointer unless the picture's edge holds it back.
        const bn=textBox(f,f.$('[data-bn-label]')),x=pointerX(f.$('[data-bn-pointer]'));
        assert(bn.x0<=x&&x<=bn.x1,`BatchNorm's label has left its pointer, ${where}`);
        const ln=textBox(f,f.$('[data-ln-label]'));assert(ln.x0<=pointerX(f.$('[data-ln-pointer]'))&&pointerX(f.$('[data-ln-pointer]'))<=ln.x1);
      }
      if(!rest.includes(time)||time<5)continue;
      // At rest no value label rides the zero line or the mean line, and the endpoint labels clear the axis.
      const lines=[f.$('[data-zero-line]'),f.$('[data-mean-line]')].filter(visible).map(node=>attr(node,'y1'));
      for(let k=0;k<4;k++) {
        const label=textBox(f,f.$(`[data-current-value="${k}"]`));
        for(const y of lines)assert(y<label.y0-1||y>label.y1+1,`"${label.text}" rides a rest line, ${where}`);
        assert(label.x0>=Number(f.root.dataset.plotMinX)+1&&label.x1<=Number(f.root.dataset.plotMaxX)-1,`"${label.text}" crosses the plot frame, ${where}`);
      }
      // Table numerals stay inside the group boxes that claim them.
      for(const [name,members] of [['[data-selected-row]',[0,1,2,3].map(k=>cell(f,0,k))],['[data-bn-column]',[0,1,2,3].map(r=>cell(f,r,0))],['[data-neighbor-row]',[0,1,2,3].map(k=>cell(f,1,k))]]) {
        const group=f.$(name);if(!visible(group))continue;
        for(const node of members) {
          const label=textBox(f,node);
          assert(label.x0>=attr(group,'x')+1&&label.x1<=attr(group,'x')+attr(group,'width')-1&&label.y0>=attr(group,'y')&&label.y1<=attr(group,'y')+attr(group,'height'),
            `"${label.text}" does not fit ${name}, ${where}`);
        }
      }
    }
  }
});

test('LayerNorm axis: only the numerals in play are emphasised, and the picture stays within its budget',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  const tiers=()=>{const out={heavy:[],plain:[],idle:[]};
    for(const node of drawing(f).querySelectorAll('[data-input-cell]')) {
      const cls=node.getAttribute('class');(/la-active/.test(cls)?out.heavy:/la-input/.test(cls)?out.plain:out.idle).push(node.dataset.inputCell);
      assert.equal(/la-idle/.test(cls),!/la-input/.test(cls));
    }return out;};
  for(const width of [296,713]) {
    f.resize(width);
    // Before and during the turn the live column is heavy; once it is a ghost, only the token's row is.
    for(const time of [2,5,7.5]){f.seek(time);assert.deepEqual(tiers(),{heavy:['0:0','1:0','2:0','3:0'],plain:[],idle:['0:1','0:2','0:3','1:1','1:2','1:3','2:1','2:2','2:3','3:1','3:2','3:3']});}
    f.seek(8.75);assert.deepEqual(tiers().heavy,['0:0','0:1','0:2','0:3','1:0','2:0','3:0'],'both groups are in play while the highlight turns');
    for(const time of [10,12,17,22,27]){f.seek(time);const now=tiers();assert.deepEqual(now.heavy,['0:0','0:1','0:2','0:3']);assert.equal(now.plain.length,0);assert.equal(now.idle.length,12);}
    for(const time of [30,34,40]) {
      f.seek(time);
      // Heavy: what a visible group pools (the token's row, feature 1's column). Plain blue: the rest of the moving row.
      assert.deepEqual(tiers(),{heavy:['0:0','0:1','0:2','0:3','1:0','2:0','3:0'],plain:['1:1','1:2','1:3'],idle:['2:1','2:2','2:3','3:1','3:2','3:3']});
      assert.match(f.$('[data-row-name="1"]').getAttribute('class'),/la-input/);assert.match(f.$('[data-row-name="2"]').getAttribute('class'),/la-idle/);
    }
    for(const time of [0,7,8.75,12,17,22,27,31,34,40]) {
      f.seek(time);
      const emphasised=[...drawing(f).querySelectorAll('.la-active,[data-current-value],[data-mean-label],[data-divisor-label],[data-result-label],[data-ln-label],[data-bn-label]')].filter(visible);
      assert(emphasised.length<=14,`${emphasised.length} emphasised numbers at ${time}s`);
      assert.equal(drawing(f).querySelectorAll('[data-row-bracket],[data-row-identity],[data-scope-label],[data-scope-return],[data-x-axis-label]').length,0,'retired marks stay retired');
    }
  }
});

test('LayerNorm axis: the transcript, boundary and receipt-bound variant tell the perturbation story',t=>{
  const f=fixture(t,NAME),items=[...f.root.querySelectorAll('.mechanism-transcript ol li')].map(node=>node.textContent.replace(/\s+/g,' ').trim());
  assert.equal(items.length,scene.beats.length,'one transcript item per beat');
  assert.match(items[6],/both groups are outlined/i);assert.match(items[6],/prediction/i);assert.match(items[6],/40, 50, 60, 70 to 80, 100, 120, 140/);
  assert.match(items[6],/slides from 10 to 20/);assert.match(items[6],/do not move/);assert.match(items[6],/run again on the changed tensor/i);
  assert.doesNotMatch(items.join(' '),/nearly coincide|marker shapes/,'the retired comparison beat is gone from the transcript');
  assert.match(items[7],/does not depend on its batchmates or on sequence length/);assert.match(items[7],/before learned scale and shift/);
  assert.match(items[7],/−1\.342, −0\.447, 0\.447, 1\.342/);
  const boundary=f.$('.mechanism-boundary'),scope=boundary.querySelector('details.mechanism-scope');
  assert.equal(boundary.querySelectorAll(':scope > p').length,1,'one visible lead sentence');assert.equal(scope.open,false);
  assert.match(scope.textContent,/computed variant of the audit tensor, not new data/);assert.match(scope.textContent,/no BatchNorm output is computed/);
  assert.match(scope.textContent,/10 before and 20 after/);assert.match(scope.textContent,/rounded to whole numbers/);
  assert.equal(f.root.querySelectorAll('details.mechanism-scope').length,2,'scope, and the author-requested image-versus-sequence explanation');
  assert.match(f.$('.mechanism-question').textContent,/neighboring token.*change.*\?$/);
  assert.match(f.$('.mechanism-intro').textContent,/Decide beforehand/);
  // The manifest's declared variants are owned elsewhere; the panel's data-variant is the in-repo mirror the player reads.
  assert.doesNotMatch(read('layernorm-axis/player.js'),/\b(80|100|120|140)\b/,'the doubled row is computed, never typed');
});

// ---- The axis turn (author feedback, September 18, 2026: "make the transition more smooth") ----

const rectOf=node=>['x','y','width','height'].map(key=>attr(node,key));
const edgesOf=node=>{const [x,y,w,h]=rectOf(node);return [x,y,x+w,y+h];};

test('LayerNorm axis: one rectangle turns continuously from the column to the row, and its two ends are exact',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const width of widths) {
    f.resize(width);
    // The turn's two ends: the live BatchNorm column at its start, LayerNorm's row at its finish.
    f.seek(TURN[0]);const column=rectOf(f.$('[data-bn-column]'));
    f.seek(TURN[1]);const highlight=f.$('[data-selected-row]'),row=rectOf(highlight);
    const cells=[0,1,2,3].map(k=>cell(f,0,k)),pivot=cell(f,0,0);
    assert.notDeepEqual(column,row,'the two ends are different rectangles');
    assert(column[3]>column[2]&&row[2]>row[3],'one is vertical, the other horizontal');
    // Every sample between them, at 0.05 s — the reader's eye follows one rectangle, never a cut.
    const samples=[];
    for(let step=0;step*0.05<=TURN[1]-TURN[0]+1e-9;step++) {
      const time=Number((TURN[0]+step*0.05).toFixed(4));f.seek(time);
      assert.equal(visible(f.$('[data-selected-row]')),time>TURN[0],`the turning highlight at ${time}s`);
      samples.push({time,edges:time>TURN[0]?edgesOf(f.$('[data-selected-row]')):[column[0],column[1],column[0]+column[2],column[1]+column[3]]});
      // The rectangle always contains the one cell the two axes share, so the turn pivots there.
      const [x0,y0,x1,y1]=samples.at(-1).edges;
      assert(attr(pivot,'x')>x0&&attr(pivot,'x')<x1&&attr(pivot,'y')>y0&&attr(pivot,'y')<y1,`the shared cell left the highlight at ${time}s`);
    }
    const ends=[[column[0],row[0]],[column[1],row[1]],[column[0]+column[2],row[0]+row[2]],[column[1]+column[3],row[1]+row[3]]];
    for(let edge=0;edge<4;edge++) {
      const [start,finish]=ends[edge],span=Math.abs(finish-start);
      // Smoothstep over the declared span moves at most 1.5/span of the way per second.
      const bound=1.5/(TURN[1]-TURN[0])*0.05*span+2*PIXEL_EPSILON;
      for(let j=1;j<samples.length;j++) {
        const step=samples[j].edges[edge]-samples[j-1].edges[edge];
        assert(Math.abs(step)<=bound,`edge ${edge} jumps ${step.toFixed(4)} px at ${samples[j].time}s (bound ${bound.toFixed(4)})`);
        assert(step*(finish-start)>=-2*PIXEL_EPSILON,`edge ${edge} doubles back at ${samples[j].time}s`);
      }
      closeTree(samples[0].edges[edge],start,PIXEL_EPSILON);closeTree(samples.at(-1).edges[edge],finish,PIXEL_EPSILON);
      // Smoothstep starts and ends at rest: the turn eases in and out rather than cutting.
      assert(Math.abs(samples[1].edges[edge]-start)<Math.abs(samples[Math.floor(samples.length/2)].edges[edge]-samples[Math.floor(samples.length/2)-1].edges[edge])+PIXEL_EPSILON);
    }
    // At the beat it leads into, the highlight IS the row — not a rounded approximation of it.
    f.seek(TURN[1]);assert.deepEqual(rectOf(f.$('[data-selected-row]')),row);
    for(const time of [10,15,25,30,40]){f.seek(time);assert.deepEqual(rectOf(f.$('[data-selected-row]')),row,`the row moved at ${time}s`);}
    for(let k=0;k<4;k++)assert(attr(cells[k],'x')>row[0]&&attr(cells[k],'x')<row[0]+row[2]);
    close(Number(f.root.dataset.turnProgress),1);
  }
});

test('LayerNorm axis: the contrasted axis is never off the picture, live or ghost',t=>{
  const f=withStyle(fixture(t,NAME));f.load();f.open();
  for(const width of [296,713]) {
    f.resize(width);
    for(let time=0;time<=40;time+=0.25) {
      f.seek(Number(time.toFixed(2)));
      const column=f.$('[data-bn-column]'),ghost=f.$('[data-bn-column-ghost]');
      assert(visible(column)||visible(ghost),`no BatchNorm column at ${time}s: the contrast is lost`);
      // The ghost is secondary: no fill, a lighter stroke than the live band's, and never emphasised type.
      if(visible(ghost)) {
        const style=f.w.getComputedStyle(ghost);assert.equal(style.fill,'none');assert(style.strokeDasharray);
        assert(parseFloat(style.strokeWidth)<parseFloat(f.w.getComputedStyle(column).strokeWidth));
      }
    }
    // The ghost stands from the turn through every LayerNorm beat and yields to the live band at the test.
    for(const time of [7.5,10,12,15,20,25,29.99,30,35,40]) {
      f.seek(time);assert.equal(visible(f.$('[data-bn-column-ghost]')),time>TURN[0]&&time<30,`ghost at ${time}s`);
    }
  }
});

test('LayerNorm axis: reduced motion shows the turn as two stills, the column and the row',t=>{
  const still=fixture(t,NAME,{reduced:true});still.load();still.open();
  const rect=()=>visible(still.$('[data-selected-row]'))?rectOf(still.$('[data-selected-row]')):null;
  // Beats 0 and 1 hold the column; the turn's finished state is the still from beat 2 on.
  for(const time of [0,2.5,4.99,5,7.5,9.99]) {
    still.seek(time);assert.equal(rect(),null,`reduced motion is mid-turn at ${time}s`);
    assert(visible(still.$('[data-bn-column]'))&&!visible(still.$('[data-bn-column-ghost]')));
    assert(visible(still.$('[data-cnn-bn-schematic]'))&&!visible(still.$('[data-plot-frame]')));
    close(Number(still.root.dataset.turnProgress),0);
  }
  still.seek(10);const row=rect();assert(row);
  for(const time of [10,12.5,14.99,15,20,25]) {
    still.seek(time);assert.deepEqual(rect(),row,`the reduced still at ${time}s is not the finished turn`);
    assert(visible(still.$('[data-bn-column-ghost]'))&&!visible(still.$('[data-bn-column]')),`the ghost is missing at ${time}s`);
    close(Number(still.root.dataset.turnProgress),1);
  }
  // Every reduced still is a coherent frame: no half-turned rectangle exists anywhere on the timeline.
  const seen=new Set();
  for(let time=0;time<=40;time+=0.05){still.seek(Number(time.toFixed(2)));seen.add(still.root.dataset.turnProgress);}
  assert.deepEqual([...seen].map(Number).sort((a,b)=>a-b),[0,1]);
});

test('LayerNorm axis: the transcript describes the turn and the ghost it leaves behind',t=>{
  const f=fixture(t,NAME),items=[...f.root.querySelectorAll('.mechanism-transcript ol li')].map(node=>node.textContent.replace(/\s+/g,' ').trim());
  assert.match(items[1],/one highlight turns/i);assert.match(items[1],/pivots about the one cell the two groups share/i);
  assert.match(items[1],/muted dashed outline until the closing test/i);assert.match(items[1],/rather than a swap/i);
  assert.doesNotMatch(items[1],/at five seconds, the selection changes/i,'the hard swap is gone from the transcript');
});
