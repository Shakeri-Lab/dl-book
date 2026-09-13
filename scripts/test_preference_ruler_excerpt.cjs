#!/usr/bin/env node
// Independent numerical and picture checks; no test dependency ships with the book.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const {execFileSync}=require('node:child_process');
const {ROOT,read,entry,chapterSource,numbers,close,canonicalMarkup,fixture,
  registerTransportTests,registerBeatHoldTest,registerGrammarTests}=require('./html-tests/excerpt-harness.cjs');
const {staticFrame}=require('./render_static_frames.cjs');

const NAME='preference-ruler-excerpt',scene=entry(NAME),widths=[240,296,360,519,520,553,713];
const data=(f,key)=>JSON.parse(f.root.dataset[key]);
const attr=(node,key)=>Number(node.getAttribute(key));
const visible=node=>Boolean(node&&!node.closest('[hidden]'));
const drawing=f=>f.$('[data-drawing]');
const declared=f=>({scores:data(f,'scores'),pair:data(f,'pair'),shift:Number(f.root.dataset.shift)});
const numericTokens=text=>(text.match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi)||[]).map(Number);
function markerPosition(node) {
  const transform=node.getAttribute('transform');assert.match(transform,/^translate\([^)]*\)$/);
  const position=numericTokens(transform);assert.equal(position.length,2);return position;
}
const closeTree=(actual,expected,epsilon=1e-12)=>{
  if(Array.isArray(expected)) {
    assert(Array.isArray(actual));assert.equal(actual.length,expected.length);
    expected.forEach((value,j)=>closeTree(actual[j],value,epsilon));
  } else close(actual,expected,epsilon);
};
// Only exp-derived SVG coordinates use the nine-decimal drawing convention.
// Raw probabilities and arithmetic continue to use the 1e-12 checks above.
const closePixel=(actual,expected)=>{
  close(actual,expected,5.1e-10);
  assert.equal(actual,Number(actual.toFixed(9)));
};
// Independently view Bradley-Terry as a two-candidate normalized exponential,
// rather than copying the player's signed sigmoid implementation.
const probability=(scores,pair)=>{
  const a=scores[pair[0]],b=scores[pair[1]],largest=Math.max(a,b);
  const left=Math.exp(a-largest),right=Math.exp(b-largest);return left/(left+right);
};
const ease=(time,start,end)=>{const t=Math.max(0,Math.min(1,(time-start)/(end-start)));return t*t*(3-2*t);};
function reference(source,time,reduced=false) {
  const t=reduced?scene.beats.filter(beat=>beat<=time).at(-1):time;
  const shiftProgress=(ease(t,22,25)+ease(t,27,30))/2,commonShift=source.shift*shiftProgress;
  const currentScores=source.scores.map(score=>score+commonShift);
  const baseGap=source.scores[source.pair[0]]-source.scores[source.pair[1]];
  const gap=currentScores[source.pair[0]]-currentScores[source.pair[1]];
  const midpoint=(source.scores[source.pair[0]]+source.scores[source.pair[1]])/2;
  const cameraTravel=0.6*Math.max(1,Math.abs(baseGap)/2);
  const cameraOffset=commonShift-Math.max(-cameraTravel,Math.min(cameraTravel,commonShift));
  return {shiftProgress,commonShift,currentScores,baseGap,gap,
    probability:probability(currentScores,source.pair),baseProbability:probability(source.scores,source.pair),
    cameraOffset,cameraCenter:midpoint+cameraOffset,cameraTravel,rulerExtent:Math.abs(baseGap)/2+cameraTravel+1};
}
function verifyState(state,source,time,reduced=false) {
  const want=reference(source,time,reduced);
  for(const [key,value] of Object.entries(want)) closeTree(state[key],value);
  closeTree(state.baseScores,source.scores);closeTree(state.pair,source.pair);
  close(state.gap,state.baseGap);close(state.probability,state.baseProbability);
  assert(Number.isFinite(state.probability)&&state.probability>=0&&state.probability<=1);
  return want;
}

registerTransportTests(NAME,{witness:/0\.881/,anchors:['preference-ruler-playback-help'],width:713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('preference ruler: the scores, comparison and shift are the manuscript witness',t=>{
  const f=fixture(t,NAME),source=declared(f),chapter=chapterSource(NAME);
  assert.equal(scene.qmd,'chapters/part5/18-alignment.qmd');
  assert.equal(scene.duration,40);assert.deepEqual(scene.beats,[0,5,10,15,20,25,30,35]);
  assert.deepEqual(source,{scores:[1,0,-1],pair:[0,2],shift:37});
  assert(chapter.includes(`transitive_scores = torch.tensor([${source.scores.map(value=>value.toFixed(1)).join(', ')}])`));
  assert(chapter.includes(`fitted_transitive + ${source.shift.toFixed(1)}`));
  for(const literal of scene.fixture.literals) assert(chapter.includes(literal),literal);
  assert.match(chapter,/Only differences are identified/);
  close(probability(source.scores,source.pair),0.8807970779778823);
});

test('preference ruler: every scrubbed shift preserves the gap and its independently computed probability',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  assert.equal(typeof f.w.BookPreferenceRuler.buildState,'function');
  const visited=new Set();
  for(let n=0;n<=160;n++) {
    const time=n/4,state=f.w.BookPreferenceRuler.buildState(time);verifyState(state,source,time);
    f.seek(time);visited.add(state.commonShift.toFixed(3));
    for(const key of ['baseGap','gap','probability','baseProbability','commonShift','cameraOffset','cameraCenter','cameraTravel','rulerExtent'])
      close(Number(f.root.dataset[key]),state[key]);
    closeTree(data(f,'currentScores'),state.currentScores);
  }
  assert(visited.has('0.000')&&visited.has('37.000'));assert(visited.size>20);
});

test('preference ruler: shifts of either sign and alternative pairs use the same numerical contract',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const source of [
    {scores:[1,0,-1],pair:[0,2],shift:-37},
    {scores:[-2,3,0.25],pair:[1,2],shift:120},
    {scores:[4,4,-100],pair:[0,1],shift:-120},
    {scores:[-5,2,9,0.5],pair:[3,0],shift:0},
    {scores:[1,0,-1],pair:[0,2],shift:1000}
  ]) {
    const before=JSON.stringify(source);
    for(const time of [0,22,23.5,25,27,28.5,30,40]) verifyState(f.w.BookPreferenceRuler.buildState(time,false,source),source,time);
    assert.equal(JSON.stringify(source),before);
  }
});

test('preference ruler: reversing the ordered comparison complements probability, not the scores',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  for(const time of [0,23.5,25,28.5,30,40]) {
    const forward=f.w.BookPreferenceRuler.buildState(time,false,source);
    const backward=f.w.BookPreferenceRuler.buildState(time,false,{...source,pair:[...source.pair].reverse()});
    closeTree(backward.currentScores,forward.currentScores);close(backward.gap,-forward.gap);
    close(backward.probability,1-forward.probability);close(forward.probability+backward.probability,1);
  }
});

test('preference ruler: an unequal shift or a rescaling is not an origin change',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  const builder=f.w.BookPreferenceRuler.buildState,baseline=builder(40,false,source);
  const changed=source.scores.map((score,j)=>score+Number(j===source.pair[0]));
  const oneShift=builder(40,false,{...source,scores:changed});
  const doubled=builder(40,false,{...source,scores:source.scores.map(score=>2*score)});
  const halved=builder(40,false,{...source,scores:source.scores.map(score=>score/2)});
  close(oneShift.gap,baseline.gap+1);close(oneShift.probability,probability(changed,source.pair));
  assert(oneShift.probability>baseline.probability);
  close(doubled.gap,2*baseline.gap);close(halved.gap,baseline.gap/2);
  assert(doubled.probability>baseline.probability&&halved.probability<baseline.probability);
  const unrelated=builder(40,false,{...source,scores:[1,1000,-1]});close(unrelated.probability,baseline.probability);
});

test('preference ruler: extreme finite gaps do not overflow the probability computation',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const scores of [[1000,-1000],[-1000,1000],[1000,1000]]) {
    const source={scores,pair:[0,1],shift:37};
    const state=f.w.BookPreferenceRuler.buildState(40,false,source);
    verifyState(state,source,40);close(state.probability,probability(scores,source.pair));
  }
});

test('preference ruler: malformed scores and comparisons cannot silently change the witness',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  for(const altered of [{...source,scores:[1]},{...source,scores:[NaN,0,-1]},
    {...source,pair:[0,0]},{...source,pair:[0,3]},{...source,pair:[-1,2]},
    {...source,pair:[0.5,2]},{...source,pair:[0]},{...source,shift:Infinity}])
    assert.throws(()=>f.w.BookPreferenceRuler.buildState(40,false,altered),/finite|score|pair|indices|index|distinct|shift/i);
});

test('preference ruler: shift arrivals and reduced-motion holds agree with the declared beats',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  for(const [time,fraction] of [[0,0],[20,0],[22,0],[23.5,0.25],[25,0.5],
    [26,0.5],[27,0.5],[28.5,0.75],[30,1],[35,1],[40,1]]) {
    const state=f.w.BookPreferenceRuler.buildState(time);verifyState(state,source,time);close(state.commonShift,source.shift*fraction);
  }
  for(const time of [0,21,23.5,24.99,25,27.5,29.99,30,39,40])
    verifyState(f.w.BookPreferenceRuler.buildState(time,true),source,time,true);
});

test('preference ruler: camera pan changes the origin, not marker distances or ruler units',t=>{
  for(const shift of [37,-37]) {
    const f=fixture(t,NAME);f.root.dataset.shift=String(shift);const source=declared(f);f.load();f.open();
    for(const width of widths) {
      f.resize(width);let fixedUnit,initialMarker;
      for(const time of [0,5,10,15,20,22.1,23.5,25,27.1,28.5,30,35,40]) {
        f.seek(time);const want=reference(source,time),unit=Number(f.root.dataset.pixelsPerUnit);
        const center=Number(f.root.dataset.rulerCenterX),y=Number(f.root.dataset.rulerY);
        assert(unit>0);if(fixedUnit===undefined)fixedUnit=unit;close(unit,fixedUnit);
        const points=source.pair.map(index=>[center+unit*(want.currentScores[index]-want.cameraCenter),y]);
        for(let j=0;j<2;j++) {
          const node=f.$(`[data-score-marker="${j}"]`);
          assert.equal(Number(node.dataset.scoreIndex),source.pair[j]);
          closeTree(markerPosition(node),points[j]);closeTree(JSON.parse(node.dataset.position),points[j]);
          assert(points[j][0]>=Number(f.root.dataset.rulerMinX)&&points[j][0]<=Number(f.root.dataset.rulerMaxX));
        }
        close(points[0][0]-points[1][0],unit*want.gap);
        if(time===0)initialMarker=points[0][0];
        if(time>=30) close(points[0][0]-initialMarker,Math.sign(shift)*unit*want.cameraTravel);
      }
    }
  }
});

test('preference ruler: drawn ticks and their numerical labels track the moving score origin',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const width of widths) {
    f.resize(width);
    for(const time of [5,23.1,23.5,25,28.1,28.5,30,40]) {
      f.seek(time);const unit=Number(f.root.dataset.pixelsPerUnit),center=Number(f.root.dataset.rulerCenterX),offset=Number(f.root.dataset.cameraCenter);
      const ticks=[...drawing(f).querySelectorAll('[data-ruler-tick]')].filter(visible);
      const labels=[...drawing(f).querySelectorAll('[data-ruler-tick-label]')].filter(visible);
      assert(ticks.length>=3);assert.equal(labels.length,ticks.length);
      const values=ticks.map((tick,j)=>{
        const score=Number(tick.dataset.score);assert(Number.isFinite(score));
        close(attr(tick,'x1'),center+unit*(score-offset));close(attr(tick,'x2'),attr(tick,'x1'));
        close(attr(labels[j],'x'),attr(tick,'x1'));
        close(Number(labels[j].textContent.replace('\u2212','-')),score);
        return score;
      });
      for(let j=1;j<ticks.length;j++) {
        assert(values[j]>values[j-1]);
        close(attr(ticks[j],'x1')-attr(ticks[j-1],'x1'),unit*(values[j]-values[j-1]),1e-10);
      }
      if(time>=30) assert(values.some(value=>value>=36),'final ticks must describe scores near37, not an unchanged zero-origin ruler');
    }
  }
});

test('preference ruler: probability is the actual position on a zero-to-one ruler, not an offset badge',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  for(const width of widths) {
    f.resize(width);
    for(const time of [15,20,23.5,25,28.5,30,35,40]) {
      f.seek(time);const p=probability(source.scores,source.pair),low=Number(f.root.dataset.probabilityMinX),high=Number(f.root.dataset.probabilityMaxX);
      const y=Number(f.root.dataset.probabilityY),position=low+p*(high-low);
      assert(high>low);const line=f.$('[data-probability-fill]'),mark=f.$('[data-probability-marker]');
      closeTree([attr(line,'x1'),attr(line,'y1')],[low,y]);
      closePixel(attr(line,'x2'),position);close(attr(line,'y2'),y);
      closePixel(attr(mark,'cx'),position);close(attr(mark,'cy'),y);
      closePixel(attr(f.$('[data-probability-value]'),'x'),Math.max(44,Math.min(width-44,position)));
      assert.equal(f.$('[data-probability-value]').textContent,p.toFixed(3));
      if(time>=20) {
        const ghost=f.$('[data-probability-ghost]');assert(visible(ghost));
        closePixel(attr(ghost,'cx'),position);close(attr(ghost,'cy'),y);
      }
    }
  }
});

test('preference ruler: the bracket joins the actual pair marks and its width measures their gap',t=>{
  for(const pair of [[0,2],[2,0]]) {
    const f=fixture(t,NAME);f.root.dataset.pair=JSON.stringify(pair);f.load();f.open();
    for(const width of widths) {
      f.resize(width);
      for(const time of [10,20,23.5,25,28.5,30,40]) {
        f.seek(time);const bracket=f.$('[data-gap-bracket]'),d=bracket.getAttribute('d');
        assert.match(d,/^M\s/);assert.equal((d.match(/L/g)||[]).length,3);
        assert.doesNotMatch(d,/[ACHQSTV]/i);
        const coordinates=numericTokens(d);assert.equal(coordinates.length,8);
        const first=markerPosition(f.$('[data-score-marker="0"]')),second=markerPosition(f.$('[data-score-marker="1"]'));
        closeTree([coordinates[0],coordinates[2]],[second[0],second[0]]);
        closeTree([coordinates[4],coordinates[6]],[first[0],first[0]]);
        close(coordinates[1],coordinates[7]);close(coordinates[3],coordinates[5]);
        assert(coordinates[3]>coordinates[1]);
        close(coordinates[4]-coordinates[2],Number(f.root.dataset.pixelsPerUnit)*Number(f.root.dataset.gap));
        close(attr(f.$('[data-gap-value]'),'x'),(first[0]+second[0])/2);
        assert.equal(Number(f.$('[data-gap-value]').textContent.replace('gap ','')),Number(f.root.dataset.gap));
      }
    }
  }
});

test('preference ruler: reveal order withholds the probability until after the score gap',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const time of [0,4.99,5,9.99,10,14.99,15,19.99,20,25,30,34.99,35,40]) {
    f.seek(time);
    for(const node of drawing(f).querySelectorAll('[data-score-value]')) assert.equal(visible(node),time>=5);
    assert.equal(visible(f.$('[data-gap-value]')),time>=10);
    for(const key of ['data-probability-fill','data-probability-marker','data-probability-value'])
      assert.equal(visible(f.$(`[${key}]`)),time>=15);
    assert.equal(visible(f.$('[data-shift-value]')),time>=20);
    assert.equal(visible(f.$('[data-probability-ghost]')),time>=20);
    const formula=f.$('[data-formula]');
    assert.equal(formula.classList.contains('pr-base-shown'),time>=15);
    assert.equal(formula.classList.contains('pr-shift-shown'),time>=20);
    assert.equal(formula.classList.contains('pr-cancelled'),time>=35);
  }
});

test('preference ruler: labels and actual line geometry stay readable at narrow widths',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  // The scene ships type size in its stylesheet, not presentation attributes.
  const style=f.d.createElement('style');style.textContent=read('preference-ruler/player.css');f.d.head.append(style);
  for(const width of widths) {
    f.resize(width);
    for(const time of [0,5,10,15,20,23.5,25,28.5,30,35,40]) {
      f.seek(time);const svg=f.$('[data-figure] svg'),box=numbers(svg.getAttribute('viewBox'));
      assert.equal(box[2],width);
      assert([null,'xMidYMid meet','xMinYMin meet'].includes(svg.getAttribute('preserveAspectRatio')));
      for(const node of [...drawing(f).querySelectorAll('text')].filter(visible)) {
        assert(parseFloat(f.w.getComputedStyle(node).fontSize)>=12,`small label at ${width}px: ${node.textContent}`);
        assert(attr(node,'x')>=0&&attr(node,'x')<=width);assert(attr(node,'y')>=0&&attr(node,'y')<=box[3]);
      }
      for(const node of [...drawing(f).querySelectorAll('line')].filter(visible))
        for(const [coordinate,limit] of [['x1',width],['x2',width],['y1',box[3]],['y2',box[3]]])
          assert(attr(node,coordinate)>=0&&attr(node,coordinate)<=limit);
      assert(drawing(f).querySelectorAll('*').length<150);
    }
  }
});

test('preference ruler: arbitrary seeking and resize history reproduce the complete state',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  const snapshot=()=>JSON.stringify({drawing:canonicalMarkup(f.$('[data-figure]').innerHTML),
    formula:canonicalMarkup(f.$('[data-formula]').outerHTML),caption:f.$('[data-caption]').innerHTML,
    state:Object.fromEntries(Object.entries(f.root.dataset).filter(([key])=>!['time','playing','typeset'].includes(key)))});
  const times=[0,5,10,15,20,22.1,23.7,25,27.2,29.6,30,35,40];
  const snapshots=times.map(time=>{f.seek(time);return snapshot();});
  f.play();f.tick(1111);f.resize(296);f.seek(28.1);f.resize(713);
  assert.deepEqual(times.toReversed().map(time=>{f.seek(time);return snapshot();}),snapshots.toReversed());
});

test('preference ruler: generated wide and narrow static frames remain complete without playback',async t=>{
  const generated=await staticFrame(NAME);assert.equal(generated.before,generated.after,'regenerate preference-ruler static frames');
  const f=fixture(t,NAME),narrow=f.$('[data-static-frame="narrow"]');assert(narrow);
  assert.equal(narrow.dataset.width,'296');const height=Number(narrow.dataset.height);
  const ids=[...f.root.querySelectorAll('[id]')].map(node=>node.id);assert.equal(ids.length,new Set(ids).size);
  for(const frame of [drawing(f),narrow]) assert.match(frame.textContent,/0\.881/);
  f.load();f.open();f.seek(40);f.resize(296);
  assert.equal(f.root.querySelectorAll('[data-static-frame="narrow"]').length,0);
  assert.equal(numbers(f.$('[data-figure] svg').getAttribute('viewBox'))[3],height);
});

test('preference ruler: a few ULPs in exp cannot change either generated static SVG',()=>{
  // Isolate the instrumentation from every other suite and run the real static
  // generator. Only exp(-2) is perturbed; no input fixture or math gate changes.
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
      const f=originalFixture(...args),exp=f.w.Math.exp;
      f.w.Math.exp=value=>value===-2?adjacent(exp(value)):exp(value);return f;
    };
    const {staticFrame}=require(process.argv[1]+'/scripts/render_static_frames.cjs');
    (async()=>{
      const base=await staticFrame('preference-ruler');
      assert.equal(base.before,base.after,'the committed static frames must first be current');
      for(const ulps of [-4,-2,-1,1,2,4]) {
        offset=ulps;const next=await staticFrame('preference-ruler');
        assert.equal(next.after,base.after,'static SVG changed under '+ulps+' ULPs of exp(-2)');
      }
    })().catch(error=>{console.error(error.message);process.exitCode=1;});
  `;
  execFileSync(process.execPath,['-e',diagnostic,ROOT],{stdio:'pipe',timeout:15000});
});

test('preference ruler: HTML-only explanation does not fabricate training or an absolute reward zero',t=>{
  const f=fixture(t,NAME),boundary=f.$('.mechanism-boundary').textContent;
  assert.match(boundary,/training|trained|fit|fitting/i);assert.match(boundary,/scale|scaling|rescal/i);
  assert.match(boundary,/same prompt|one prompt|prompt-dependent/i);
  assert.match(boundary,/camera|pan|viewport follows/i);
  f.load();f.open();assert.equal(f.root.querySelectorAll('input[type="range"]').length,1);
  const filter=fs.readFileSync(path.join(ROOT,scene.filter),'utf8');
  assert.match(filter,/^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
  assert.doesNotMatch(read('preference-ruler/player.js'),/Math\.random|fetch\(|import\(|setInterval\(/);
  assert.doesNotMatch(read('preference-ruler/panel.html'),/@eq-/);
});
