#!/usr/bin/env node
// Independent numerical and picture checks; no test dependency ships with the book.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const {execFileSync}=require('node:child_process');
const {ROOT,read,entry,chapterSource,numbers,close,canonicalMarkup,drawnMarkup,fixture,
  registerTransportTests,registerBeatHoldTest,registerGrammarTests}=require('./html-tests/excerpt-harness.cjs');
const {staticFrame}=require('./render_static_frames.cjs');

const NAME='preference-ruler-excerpt',scene=entry(NAME),widths=[240,296,360,519,520,553,713,1000];
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
// Every drawn coordinate is serialized at 0.0001 px, so a last-bit libm difference
// cannot change the static SVG bytes. Raw probabilities, scores and camera state keep
// the 1e-12 checks above; only positions read back from the SVG use this tolerance.
const closePixel=(actual,expected)=>{
  close(actual,expected,5.1e-5);
  assert.equal(actual,Number(actual.toFixed(4)),`${actual} is not serialized at 0.0001 px`);
};
const closePixels=(actual,expected)=>{assert.equal(actual.length,expected.length);expected.forEach((value,j)=>closePixel(actual[j],value));};
// Independently view Bradley-Terry as a two-candidate normalized exponential,
// rather than copying the player's signed sigmoid implementation.
const probability=(scores,pair)=>{
  const a=scores[pair[0]],b=scores[pair[1]],largest=Math.max(a,b);
  const left=Math.exp(a-largest),right=Math.exp(b-largest);return left/(left+right);
};
// The oracle owns the arithmetic, never the clock: it takes the shift the player
// publishes and recomputes everything that must follow from it. When the shift is
// where is asserted separately, at named times, in the arrival tests below.
function reference(source,commonShift) {
  const currentScores=source.scores.map(score=>score+commonShift);
  const baseGap=source.scores[source.pair[0]]-source.scores[source.pair[1]];
  const gap=currentScores[source.pair[0]]-currentScores[source.pair[1]];
  const midpoint=(source.scores[source.pair[0]]+source.scores[source.pair[1]])/2;
  const cameraTravel=0.6*Math.max(1,Math.abs(baseGap)/2);
  const cameraOffset=commonShift-Math.max(-cameraTravel,Math.min(cameraTravel,commonShift));
  return {commonShift,currentScores,baseGap,gap,
    probability:probability(currentScores,source.pair),baseProbability:probability(source.scores,source.pair),
    cameraOffset,cameraCenter:midpoint+cameraOffset,cameraTravel,rulerExtent:Math.abs(baseGap)/2+cameraTravel+1};
}
function verifyState(state,source) {
  assert(state.shiftProgress>=0&&state.shiftProgress<=1);close(state.commonShift,source.shift*state.shiftProgress);
  const want=reference(source,state.commonShift);
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
  const visited=new Set();let previous=0;
  for(let n=0;n<=160;n++) {
    const time=n/4,state=f.w.BookPreferenceRuler.buildState(time);verifyState(state,source);
    assert(state.commonShift>=previous,`the shift retreats at ${time}s`);previous=state.commonShift;
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
    for(const time of [0,20,25,27,28.5,30,32,33.5,35,40]) verifyState(f.w.BookPreferenceRuler.buildState(time,false,source),source);
    assert.equal(JSON.stringify(source),before);
  }
});

test('preference ruler: reversing the ordered comparison complements probability, not the scores',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  for(const time of [0,25,28.5,30,33.5,35,40]) {
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
    verifyState(state,source);close(state.commonShift,source.shift);close(state.probability,probability(scores,source.pair));
  }
});

test('preference ruler: malformed scores and comparisons cannot silently change the witness',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  for(const altered of [{...source,scores:[1]},{...source,scores:[NaN,0,-1]},
    {...source,pair:[0,0]},{...source,pair:[0,3]},{...source,pair:[-1,2]},
    {...source,pair:[0.5,2]},{...source,pair:[0]},{...source,shift:Infinity}])
    assert.throws(()=>f.w.BookPreferenceRuler.buildState(40,false,altered),/finite|score|pair|indices|index|distinct|shift/i);
});

test('preference ruler: the shift waits out the prediction, then arrives in two glides that end on beats',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  // Named times, not a second copy of the easing: still through the whole prediction
  // beat and the two seconds that open each later beat; half way at 30 s; done at 35 s.
  for(const [time,fraction] of [[0,0],[20,0],[22,0],[23.5,0],[24.99,0],[25,0],[26,0],[27,0],[28.5,0.25],
    [30,0.5],[31,0.5],[32,0.5],[33.5,0.75],[35,1],[37,1],[40,1]]) {
    const state=f.w.BookPreferenceRuler.buildState(time);verifyState(state,source);close(state.commonShift,source.shift*fraction);
  }
  // Reduced motion holds each beat's opening state: the object jumps, beat by beat.
  const held=state=>JSON.stringify({...state,time:0});
  for(const [time,beat,fraction] of [[0,0,0],[21,20,0],[24.99,20,0],[25,25,0],[28.5,25,0],[29.99,25,0],
    [30,30,0.5],[33.5,30,0.5],[34.99,30,0.5],[35,35,1],[39,35,1],[40,35,1]]) {
    const state=f.w.BookPreferenceRuler.buildState(time,true);verifyState(state,source);
    close(state.commonShift,source.shift*fraction);assert.equal(held(state),held(f.w.BookPreferenceRuler.buildState(beat)));
  }
});

test('preference ruler: camera pan changes the origin, not marker distances or ruler units',t=>{
  for(const shift of [37,-37]) {
    const f=fixture(t,NAME);f.root.dataset.shift=String(shift);const source=declared(f);f.load();f.open();
    for(const width of widths) {
      f.resize(width);let fixedUnit,initialMarker;
      for(const time of [0,5,10,15,20,25,27.1,28.5,30,32.1,33.5,35,40]) {
        f.seek(time);const want=reference(source,Number(f.root.dataset.commonShift)),unit=Number(f.root.dataset.pixelsPerUnit);
        const center=Number(f.root.dataset.rulerCenterX),y=Number(f.root.dataset.rulerY);
        assert(unit>0);if(fixedUnit===undefined)fixedUnit=unit;close(unit,fixedUnit);
        const points=source.pair.map(index=>[center+unit*(want.currentScores[index]-want.cameraCenter),y]);
        for(let j=0;j<2;j++) {
          const node=f.$(`[data-score-marker="${j}"]`);
          assert.equal(Number(node.dataset.scoreIndex),source.pair[j]);
          closePixels(markerPosition(node),points[j]);closePixels(JSON.parse(node.dataset.position),points[j]);
          assert(points[j][0]>=Number(f.root.dataset.rulerMinX)&&points[j][0]<=Number(f.root.dataset.rulerMaxX));
        }
        close(points[0][0]-points[1][0],unit*want.gap);
        if(time===0)initialMarker=points[0][0];
        if(time>=30) close(points[0][0]-initialMarker,Math.sign(shift)*unit*want.cameraTravel);
      }
    }
  }
});

test('preference ruler: drawn ticks track the moving score origin and span the whole ruler at every width',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  // A tick is withheld only within this clearance of a ruler end, so the end caps stay clean.
  const END_CLEARANCE=8;
  for(const width of widths) {
    f.resize(width);
    for(const time of [0,5,20,27.1,28.5,30,32.1,33.5,35,40]) {
      f.seek(time);const unit=Number(f.root.dataset.pixelsPerUnit),center=Number(f.root.dataset.rulerCenterX),offset=Number(f.root.dataset.cameraCenter);
      const low=Number(f.root.dataset.rulerMinX),high=Number(f.root.dataset.rulerMaxX);
      closeTree([attr(f.$('[data-ruler]'),'x1'),attr(f.$('[data-ruler]'),'x2')],[low,high]);close(high-low,width-48);
      const ticks=[...drawing(f).querySelectorAll('[data-ruler-tick]')].filter(visible);
      const labels=[...drawing(f).querySelectorAll('[data-ruler-tick-label]')].filter(visible);
      assert(ticks.length>=3);assert.equal(labels.length,time>=5?ticks.length:0,'tick labels wait for the scores');
      const values=ticks.map((tick,j)=>{
        const score=Number(tick.dataset.score);assert(Number.isFinite(score));
        closePixel(attr(tick,'x1'),center+unit*(score-offset));assert.equal(attr(tick,'x2'),attr(tick,'x1'));
        if(time>=5) {
          assert.equal(attr(labels[j],'x'),attr(tick,'x1'));
          assert.equal(Number(labels[j].textContent.replace('\u2212','-')),score);
        }
        return score;
      });
      const step=values[1]-values[0];assert(step>0);
      for(let j=1;j<ticks.length;j++) {
        close(values[j]-values[j-1],step);
        close(attr(ticks[j],'x1')-attr(ticks[j-1],'x1'),unit*step,1.1e-4);
      }
      // The pool is sized from the ruler's pixel span: no width, and no pan, may leave an
      // end of the ruler without ticks (the fixed pool of 17 ran out above about 880 px).
      const first=attr(ticks[0],'x1'),last=attr(ticks.at(-1),'x1'),spacing=unit*step;
      assert(first-low>=END_CLEARANCE&&high-last>=END_CLEARANCE);
      assert(first-low<spacing+END_CLEARANCE+1e-3,`${width}px at ${time}s: no tick for ${(first-low).toFixed(1)}px at the ruler's left end`);
      assert(high-last<spacing+END_CLEARANCE+1e-3,`${width}px at ${time}s: no tick for ${(high-last).toFixed(1)}px at the ruler's right end`);
      if(time>=35) assert(values.some(value=>value>=36),'final ticks must describe scores near37, not an unchanged zero-origin ruler');
    }
  }
});

test('preference ruler: probability is the actual position on a zero-to-one ruler, not an offset badge',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  for(const width of widths) {
    f.resize(width);
    for(const time of [15,20,25,28.5,30,33.5,35,40]) {
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
      for(const time of [10,20,25,28.5,30,33.5,35,40]) {
        f.seek(time);const bracket=f.$('[data-gap-bracket]'),d=bracket.getAttribute('d');
        assert.match(d,/^M\s/);assert.equal((d.match(/L/g)||[]).length,3);
        assert.doesNotMatch(d,/[ACHQSTV]/i);
        const coordinates=numericTokens(d);assert.equal(coordinates.length,8);
        const first=markerPosition(f.$('[data-score-marker="0"]')),second=markerPosition(f.$('[data-score-marker="1"]'));
        closeTree([coordinates[0],coordinates[2]],[second[0],second[0]]);
        closeTree([coordinates[4],coordinates[6]],[first[0],first[0]]);
        close(coordinates[1],coordinates[7]);close(coordinates[3],coordinates[5]);
        assert(coordinates[3]>coordinates[1]);
        close(coordinates[4]-coordinates[2],Number(f.root.dataset.pixelsPerUnit)*Number(f.root.dataset.gap),1.1e-4);
        closePixel(attr(f.$('[data-gap-value]'),'x'),(first[0]+second[0])/2);
        assert.equal(Number(f.$('[data-gap-value]').textContent.replace('gap ','').replace('\u2212','-')),Number(f.root.dataset.gap));
        assert.equal(f.$('[data-gap-value]').textContent,pair[0]===0?'gap 2':'gap \u22122');
      }
    }
  }
});

test('preference ruler: reveal order withholds the probability until the gap, and the shift until the prediction is over',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  for(const time of [0,4.99,5,9.99,10,14.99,15,19.99,20,24.99,25,30,34.99,35,40]) {
    f.seek(time);
    for(const node of drawing(f).querySelectorAll('[data-score-value]')) assert.equal(visible(node),time>=5);
    assert.equal(visible(f.$('[data-gap-value]')),time>=10);
    for(const key of ['data-probability-fill','data-probability-marker','data-probability-value'])
      assert.equal(visible(f.$(`[${key}]`)),time>=15);
    assert.equal(visible(f.$('[data-shift-value]')),time>=25);assert.equal(visible(f.$('[data-context]')),time<25);
    assert.equal(visible(f.$('[data-probability-ghost]')),time>=20);
    const formula=f.$('[data-formula]');
    assert.equal(formula.classList.contains('pr-base-shown'),time>=15);
    assert.equal(formula.classList.contains('pr-shift-shown'),time>=20);
    assert.equal(formula.classList.contains('pr-cancelled'),time>=35);
  }
});

// Review pass, September 17, 2026. Half the shift used to run from 22 s to 25 s under the
// caption that asks for a prediction "before the shift", with the shift readout climbing.
test('preference ruler: while the caption asks for a prediction nothing about the shift is shown or said',t=>{
  for(const reduced of [false,true]) {
    const f=fixture(t,NAME,{reduced});f.load();f.open();
    const range=f.$('[data-controls] input[type=range]'),picture=f.$('[data-figure] svg');
    const spoken=()=>range.getAttribute('aria-valuetext').replace(/^\d+:\d\d of \d+:\d\d\. /,'');
    f.seek(19.99);const before=source=>[0,1].map(j=>markerPosition(f.$(`[data-score-marker="${j}"]`))[0]),rest=before();
    let asked=0;
    for(let n=0;n<=160;n++) {
      const time=n/4;f.seek(time);
      if(!/\bpredict\b|\?$/i.test(f.$('[data-caption]').textContent)) continue;
      asked++;
      assert.equal(Number(f.root.dataset.commonShift),0,`the shift has begun at ${time}s under a prediction caption`);
      assert.deepEqual(before(),rest,`a score mark has moved at ${time}s`);
      assert(!visible(f.$('[data-shift-value]')),`a shift readout is on the picture at ${time}s`);
      assert(!visible(f.$('[data-camera-note]')));
      assert.doesNotMatch(picture.getAttribute('aria-label'),/shift|addition/i);
      assert.doesNotMatch(spoken(),/\d/,`the scrubber announces a value at ${time}s: ${spoken()}`);
    }
    assert(asked>=40,'both prediction beats were visited');
    // The second prediction is a still from its first frame to its last: five seconds to think.
    f.seek(20);const still=drawnMarkup(f);assert.match(f.$('[data-caption]').textContent,/^Predict before the shift/);
    for(const time of [21,22,23,24,24.99]) {f.seek(time);assert.equal(drawnMarkup(f),still,`the prediction beat changes at ${time}s`);}
  }
});

test('preference ruler: each glide opens on two still seconds and ends on the beat its caption describes',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  const at=time=>(f.seek(time),drawnMarkup(f)),shift=time=>(f.seek(time),Number(f.root.dataset.commonShift));
  for(const [beat,arrival] of [[25,30],[30,35]]) {
    const parked=at(beat);
    for(const time of [beat+1,beat+2]) assert.equal(at(time),parked,`the picture parked at ${beat}s moves before ${time}s`);
    assert.notEqual(at(beat+2.5),parked);assert.notEqual(at(arrival-0.05),at(arrival));
    assert(shift(arrival-0.05)<shift(arrival));
  }
  // The arrival is what an arrow key lands on, and it then holds to the end.
  assert.equal(shift(30),18.5);assert.equal(shift(35),37);
  for(const time of [36,38,40]) assert.equal(at(time),at(35));
  // Nothing jumps: a twentieth of a second never carries the view more than one score unit
  // or a mark more than ten pixels (its whole on-screen travel is about thirty), at any width.
  for(const width of [296,713,1000]) {
    f.resize(width);f.seek(0);
    let center=Number(f.root.dataset.cameraCenter),x=markerPosition(f.$('[data-score-marker="0"]'))[0];
    for(let time=0.05;time<=40+1e-9;time+=0.05) {
      f.seek(Number(time.toFixed(2)));
      const nextCenter=Number(f.root.dataset.cameraCenter),nextX=markerPosition(f.$('[data-score-marker="0"]'))[0];
      assert(Math.abs(nextCenter-center)<1,`the view jumps ${nextCenter-center} units at ${time.toFixed(2)}s`);
      assert(Math.abs(nextX-x)<10,`mark A jumps ${nextX-x}px at ${time.toFixed(2)}s`);
      center=nextCenter;x=nextX;
    }
  }
});

test('preference ruler: the payoff is a rigid bracket and a probability mark that never leaves its ring',t=>{
  const f=fixture(t,NAME),source=declared(f);f.load();f.open();
  const p=probability(source.scores,source.pair);
  for(const width of widths) {
    f.resize(width);f.seek(20);
    const bracketWidth=()=>{const c=numericTokens(f.$('[data-gap-bracket]').getAttribute('d'));return c[4]-c[2];};
    const rest={bracket:bracketWidth(),mark:attr(f.$('[data-probability-marker]'),'cx'),scores:[0,1].map(j=>f.$(`[data-score-value="${j}"]`).textContent)};
    assert.deepEqual(rest.scores,['1','−1']);
    for(const time of [27.5,28.5,29.5,30,32.5,33.5,34.5,35,40]) {
      f.seek(time);
      close(bracketWidth(),rest.bracket,2.1e-4);assert.equal(f.$('[data-gap-value]').textContent,'gap 2');
      assert.equal(attr(f.$('[data-probability-marker]'),'cx'),rest.mark);
      assert.equal(attr(f.$('[data-probability-ghost]'),'cx'),rest.mark);assert(visible(f.$('[data-probability-ghost]')));
      assert.equal(f.$('[data-probability-value]').textContent,p.toFixed(3));
      // ... while the two scores themselves, and the shift, do change.
      assert.notDeepEqual([0,1].map(j=>f.$(`[data-score-value="${j}"]`).textContent),rest.scores);
      assert.match(f.$('[data-shift-value]').textContent,/^common shift \+\d/);
      for(const node of [f.$('[data-gap-value]'),f.$('[data-probability-value]')]) assert(node.classList.contains('pr-invariant'));
    }
    f.seek(40);assert.deepEqual([0,1].map(j=>f.$(`[data-score-value="${j}"]`).textContent),['38','36']);
    assert.equal(f.$('[data-shift-value]').textContent,'common shift +37');
  }
});

test('preference ruler: printed and spoken numbers use U+2212 and an explicit plus, never ASCII minus or e-notation',t=>{
  for(const shift of [37,-37]) {
    const f=fixture(t,NAME);f.root.dataset.shift=String(shift);f.load();f.open();
    const range=f.$('[data-controls] input[type=range]'),picture=f.$('[data-figure] svg');
    for(const width of [296,713]) {
      f.resize(width);
      for(let n=0;n<=160;n++) {
        f.seek(n/4);
        const texts=[...drawing(f).querySelectorAll('text')].filter(visible).map(node=>node.textContent);
        for(const text of [...texts,picture.getAttribute('aria-label'),range.getAttribute('aria-valuetext')]) {
          assert.doesNotMatch(text,/-/,`ASCII hyphen-minus at ${n/4}s in "${text}"`);
          assert.doesNotMatch(text,/\de[+−-]?\d/i,`e-notation at ${n/4}s in "${text}"`);
          assert.doesNotMatch(text,/\d\.\d{4,}/,`an unrounded double at ${n/4}s in "${text}"`);
        }
      }
    }
    f.seek(7);
    assert.equal(f.$('[data-score-value="1"]').textContent,'−1');
    assert([...drawing(f).querySelectorAll('[data-ruler-tick-label]')].filter(visible).some(node=>node.textContent==='−1'));
    assert.match(picture.getAttribute('aria-label'),/Scores 1 and −1\./);
    f.seek(40);
    assert.equal(f.$('[data-shift-value]').textContent,shift>0?'common shift +37':'common shift −37');
    assert.match(picture.getAttribute('aria-label'),shift>0?/Common shift \+37\.$/:/Common shift −37\.$/);
  }
});

test('preference ruler: live values are described once, on the picture, and the scrubber only names the stage',t=>{
  const f=fixture(t,NAME);f.load();f.open();
  const range=f.$('[data-controls] input[type=range]'),picture=f.$('[data-figure] svg'),named=new Set();
  for(const time of [0,5,10,15,20,25,28.5,30,33.5,35,40]) {
    f.seek(time);const spoken=range.getAttribute('aria-valuetext').replace(/^\d+:\d\d of \d+:\d\d\. /,'');
    assert.match(spoken,/^[A-Z][^.\d]*\.$/,`the scrubber repeats a value at ${time}s: ${spoken}`);named.add(spoken);
    assert(picture.getAttribute('aria-label').startsWith(spoken));
  }
  assert.equal(named.size,scene.beats.length);
  f.seek(40);assert.equal(picture.getAttribute('aria-label'),'No identifiable zero. Scores 38 and 36. Difference 2. Modeled preference probability 0.881. Common shift +37.');
});

test('preference ruler: every drawn coordinate, live or printed, is serialized at 0.0001 px',t=>{
  const long=/\d\.\d{5,}/;
  const panel=fixture(t,NAME);
  for(const frame of [drawing(panel),panel.$('[data-static-frame="narrow"]')]) {
    assert(frame.querySelectorAll('[data-ruler-tick]').length>=5);
    assert.doesNotMatch(frame.outerHTML,long,'a static print carries an unrounded coordinate');
  }
  const f=fixture(t,NAME);f.load();f.open();
  for(const width of widths) {
    f.resize(width);
    for(const time of [0,20,27.7,28.5,30,33.3,35,40]) {f.seek(time);assert.doesNotMatch(drawing(f).outerHTML,long,`${width}px at ${time}s`);}
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
  const times=[0,5,10,15,20,22.1,25,27.2,28.4,29.6,30,32.3,33.7,35,40];
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
