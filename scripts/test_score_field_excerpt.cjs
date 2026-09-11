#!/usr/bin/env node
// Test-only arithmetic and DOM checks; no dependency enters the published book.
// The manuscript owns the fixture. These tests differentiate its Gaussian density
// independently of the player's responsibility-weighted implementation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, close, canonicalMarkup,
  fixture, registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'score-field-excerpt', scene = entry(NAME);
const widths = [240,296,360,519,520,553,713];
const sum = values => values.reduce((total, value) => total + value, 0);
const attr = (node, name) => Number(node.getAttribute(name));
const drawing = f => f.$('[data-drawing]');
const declared = f => ({means:numbers(f.root.dataset.means), scale:Number(f.root.dataset.scale),
  priors:numbers(f.root.dataset.priors), domain:numbers(f.root.dataset.domain)});
function actual(f) {
  return {x:Number(f.root.dataset.probe), weights:JSON.parse(f.root.dataset.responsibilities),
    pulls:JSON.parse(f.root.dataset.pulls), score:Number(f.root.dataset.score), density:Number(f.root.dataset.density)};
}
// p' / p from differentiated normalized Gaussian component densities. The player
// instead normalizes exponentials before weighting component pulls. A central
// finite difference below supplies a third path through the same identity.
function exact(fx, x) {
  const components = fx.means.map((mean, i) => fx.priors[i]
    * Math.exp(-((x-mean)**2)/(2*fx.scale**2))/(fx.scale*Math.sqrt(2*Math.PI)));
  const density = sum(components);
  const slopes = components.map((p, i) => p*(fx.means[i]-x)/fx.scale**2);
  return {density, score:sum(slopes)/density,
    weights:components.map(p=>p/density), pulls:slopes.map(dp=>dp/density)};
}
// For the fixed equal-weight symmetric mixture, factoring out exp(-8(x^2+4)/9)
// gives p proportional to that factor times cosh(32x/9). Differentiating its log
// gives this closed form, separately verified with the verify-math SymPy helper.
const symmetricScore = x => (16/9)*(-x+2*Math.tanh(32*x/9));
const symmetricDerivative = x => (16/9)*(-1+(64/9)*(1-Math.tanh(32*x/9)**2));
function checkState(f, fx, expectedX) {
  const got = actual(f), want = exact(fx, got.x);
  if (expectedX !== undefined) close(got.x, expectedX);
  assert(got.x >= fx.domain[0] && got.x <= fx.domain[1]);
  assert.equal(got.weights.length, 2); assert.equal(got.pulls.length, 2);
  got.weights.forEach((w,i) => {assert(w>0 && w<=1); close(w,want.weights[i],2e-12);});
  close(sum(got.weights),1,2e-12);
  got.pulls.forEach((pull,i) => close(pull,want.pulls[i],3e-12));
  close(sum(got.pulls),got.score,3e-12);
  close(got.score,want.score,3e-12); close(got.density,want.density,2e-12);
  assert(got.density>0 && Number.isFinite(got.density));
  return got;
}

registerTransportTests(NAME, {witness:/opposite pulls of minus and plus 1\.7778/,
  anchors:['score-field-playback-help'], width:713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('score field: fixture and insertion are the existing analytic manuscript example', t => {
  const f = fixture(t, NAME), fx = declared(f), chapter = chapterSource(NAME);
  assert.deepEqual(fx,{means:[-2,2],scale:0.75,priors:[0.5,0.5],domain:[-5,5]});
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal),literal);
  for (const literal of ['score_x = np.linspace(-5.0, 5.0, 600)',
    'score_means = np.array([-2.0, 2.0])','score_scale = 0.75',
    'score_prior = np.array([0.5, 0.5])']) assert(chapter.includes(literal));
  assert.equal(scene.anchor.type,'after-cell'); assert.equal(scene.anchor.target,'cell-fig-score-mixture');
  assert.equal(scene.qmd,'chapters/part5/19-generative.qmd');
  assert.deepEqual(scene.beats,[0,4,10,14,18,23,28,32,36]); assert.equal(scene.duration,40);
  const filter=fs.readFileSync(path.join(ROOT,scene.filter),'utf8');
  assert.match(filter,/^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
});

test('score field: opening withholds the answer visually and through accessible labels', t => {
  const f=fixture(t,NAME); f.load(); f.open();
  for (const time of [0,2,3.99,4,7,9.99]) {
    f.seek(time); assert.equal(f.root.dataset.revealed,'false');
    for (const node of drawing(f).querySelectorAll('[data-pull], [data-score-arrow], [data-value="score"]'))
      assert(node.closest('[hidden]'),`answer mark exposed at ${time}s: ${node.outerHTML}`);
    const accessible=[f.$('[data-caption]').textContent,f.$('[data-figure] svg').getAttribute('aria-label'),
      f.$('[data-controls] input[type="range"]').getAttribute('aria-valuetext')].join(' ');
    assert.doesNotMatch(accessible,/\b(?:pulls cancel|they cancel|score (?:is|=) zero|score (?:is|=) 0|is (?:a )?(?:minimum|valley))\b/i,
      'a prediction prompt must not announce its answer before the reveal');
  }
  f.seek(10); assert.equal(f.root.dataset.revealed,'true');
});

test('score field: normalized responsibilities and weighted pulls equal the independent density derivative throughout the sweep', t => {
  const f=fixture(t,NAME),fx=declared(f); f.load(); f.open();
  const h=1e-4;
  for (let n=0;n<=160;n++) {
    f.seek(n/4); const got=checkState(f,fx);
    close(got.score,symmetricScore(got.x),4e-12);
    const finite=(Math.log(exact(fx,got.x+h).density)-Math.log(exact(fx,got.x-h).density))/(2*h);
    close(got.score,finite,1.1e-7);
    assert(Math.abs(got.score)<=6,'the displayed score axis must contain the entire sweep');
  }
});

test('score field: exact witness holds arrive before the reader is asked to read them', t => {
  const f=fixture(t,NAME),fx=declared(f); f.load(); f.open();
  for (const [times,x] of [[[0,2,4],-5],[[10,12,14],-1],[[18,21,23],0],[[28,30,32],1],[[36,38,40],5]])
    for (const time of times) {f.seek(time); checkState(f,fx,x);}
  for (const [start,end,from,to] of [[4,10,-5,-1],[14,18,-1,0],[23,28,0,1],[32,36,1,5]]) {
    let previous=from;
    for(let n=1;n<=20;n++) {
      f.seek(start+(end-start)*n/20); const got=checkState(f,fx);
      assert(got.x>=previous && got.x<=to); previous=got.x;
    }
    close(previous,to);
  }
  f.seek(10); const left=actual(f);
  close(left.weights[0],0.999184677458,1e-12);
  close(left.pulls[0],-1.77632831548,1e-11); close(left.pulls[1],0.00434838689,1e-11);
  close(left.score,-1.77197992859,1e-11);
  f.seek(28); const right=actual(f);
  close(right.weights[0],left.weights[1]); close(right.weights[1],left.weights[0]);
  close(right.pulls[0],-left.pulls[1]); close(right.pulls[1],-left.pulls[0]);
  close(right.score,-left.score); close(right.density,left.density);
});

test('score field: midpoint cancellation is a low-density minimum, not a mode', t => {
  const f=fixture(t,NAME),fx=declared(f); f.load(); f.open(); f.seek(18);
  const got=checkState(f,fx,0);
  assert.deepEqual(got.weights,[0.5,0.5]); close(got.pulls[0],-16/9); close(got.pulls[1],16/9);
  assert.equal(got.score,0); close(symmetricDerivative(0),880/81);
  const midpoint=exact(fx,0).density;
  assert(exact(fx,-0.1).density>midpoint && exact(fx,0.1).density>midpoint);
  assert(exact(fx,-2).density>midpoint && exact(fx,2).density>midpoint);
  const words=f.$('[data-caption]').textContent+' '+f.$('[data-figure] svg').getAttribute('aria-label');
  assert.match(words,/cancel|zero/i); assert.match(words,/low|valley|minimum/i);
  assert.doesNotMatch(words,/(?:zero|cancel)[^.]{0,35}(?:therefore|means) (?:a )?(?:mode|high probability)/i);
});

test('score field: the component means are not rounded into exact mixture critical points', t => {
  const f=fixture(t,NAME),fx=declared(f); f.load(); f.open();
  // Locate x=2 on the prescribed final sweep without assuming its easing function.
  let low=32,high=36;
  for(let n=0;n<45;n++) {const mid=(low+high)/2; f.seek(mid); if(actual(f).x<2) low=mid; else high=mid;}
  f.seek((low+high)/2); const got=checkState(f,fx);
  close(got.x,2,1e-10); close(got.score,-4.73483167039e-6,2e-10);
  assert(got.score<0 && got.score!==0,'the second component mean is very near a mode, not exactly at one');
  const shown=Number(f.$('[data-value="score"]').textContent.replaceAll('−','-'));
  assert(shown<0,'the visible readout must not round this near-mode score to a false exact zero');
  close(shown,got.score,5e-8);
  assert(exact(fx,-2).score>0); assert(exact(fx,1.99999).score>0);
  assert.doesNotMatch(read('score-field/panel.html'),/(?:means|centers)[^.]{0,40}(?:are|equal) (?:the )?(?:modes|zeros)/i);
});

test('score field: changing the declared mixture changes every computed quantity', t => {
  const f=fixture(t,NAME);
  f.root.dataset.means='-1.5 2.5'; f.root.dataset.priors='0.4 0.6'; f.root.dataset.scale='1.1';
  const fx=declared(f); f.load(); f.open();
  for(const time of [0,7,10,18,25,28,34,40]) {f.seek(time); checkState(f,fx);}
  f.seek(18); assert.notEqual(actual(f).score,0,'a literal symmetric answer cannot substitute for the fixture');
});

test('score field: seek order, resizing, and playback history cannot change a frame', t => {
  const f=fixture(t,NAME); f.load(); f.open();
  const snapshot=()=>JSON.stringify({picture:canonicalMarkup(f.$('[data-figure]').innerHTML),
    formula:canonicalMarkup(f.$('[data-formula]').outerHTML),caption:f.$('[data-caption]').innerHTML,
    state:actual(f),stage:f.root.dataset.stage});
  const times=[0,4,7.5,10,14,16.5,18,23,25.3,28,32,34.2,36,40];
  const frames=times.map(time=>{f.seek(time);return snapshot();});
  f.play(); f.tick(750); f.resize(296); f.seek(18); f.resize(713);
  assert.deepEqual(times.toReversed().map(time=>{f.seek(time);return snapshot();}),frames.toReversed());
  assert.equal(f.root.querySelectorAll('input[type="range"]').length,1,'only the shared timeline, not a new sampling or scale dial');
});

test('score field: phone reflow keeps all marks in the pane and labels readable', t => {
  const f=fixture(t,NAME); f.load(); f.open();
  for(const width of widths) {
    f.resize(width);
    for(const time of [4,10,18,28,36,40]) {
      f.seek(time); const svg=f.$('[data-figure] svg'),box=numbers(svg.getAttribute('viewBox'));
      assert.equal(box[2],width); assert.equal(svg.getAttribute('preserveAspectRatio'),'xMinYMin meet');
      assert.equal(f.root.dataset.layout,width<520?'narrow':'wide');
      for(const node of drawing(f).querySelectorAll('text')) {
        assert(attr(node,'font-size')>=12,`unreadable label at ${width}px: ${node.textContent}`);
        assert(attr(node,'x')>=0 && attr(node,'x')<=width,`text x out of pane: ${node.textContent}`);
        assert(attr(node,'y')>=0 && attr(node,'y')<=box[3],`text y out of pane: ${node.textContent}`);
      }
      for(const node of drawing(f).querySelectorAll('circle')) {
        assert(attr(node,'cx')-attr(node,'r')>=0 && attr(node,'cx')+attr(node,'r')<=width);
        assert(attr(node,'cy')-attr(node,'r')>=0 && attr(node,'cy')+attr(node,'r')<=box[3]);
      }
      for(const node of drawing(f).querySelectorAll('line'))
        for(const [coordinate,limit] of [['x1',width],['x2',width],['y1',box[3]],['y2',box[3]]])
          assert(attr(node,coordinate)>=0 && attr(node,coordinate)<=limit,`${coordinate} leaves pane at ${width}px`);
    }
  }
});

test('score field: both plots use the probe coordinate and explicit independent vertical rulers', t => {
  const f=fixture(t,NAME),fx=declared(f); f.load(); f.open();
  const pathPoints=node=>[...node.getAttribute('d').matchAll(/[ML]\s*([-\d.]+)\s+([-\d.]+)/g)]
    .map(match=>[Number(match[1]),Number(match[2])]);
  for(const width of widths) {
    f.resize(width); f.seek(18);
    const d=f.root.dataset,left=Number(d.plotLeft),right=Number(d.plotRight);
    const scoreZero=Number(d.scoreZero),scoreScale=Number(d.scoreScale);
    const densityBase=Number(d.densityBaseline),densityScale=Number(d.densityScale);
    assert.equal(Number(d.scoreMin),-6); assert.equal(Number(d.scoreMax),6);
    assert(scoreScale>0 && densityScale>0 && right>left);
    const xAt=px=>fx.domain[0]+(px-left)/(right-left)*(fx.domain[1]-fx.domain[0]);
    const scorePoints=pathPoints(f.$('[data-score-curve]'));
    assert(scorePoints.length>=200,'sample the fixed curve densely enough to inspect its roots');
    close(scorePoints[0][0],left,0.001); close(scorePoints.at(-1)[0],right,0.001);
    for(const [px,py] of scorePoints) {
      const score=(scoreZero-py)/scoreScale;
      // SVG path coordinates are rounded to three decimals; propagate x rounding
      // through the steepest derivative near zero (880/81 < 11).
      close(score,symmetricScore(xAt(px)),11*0.0005*10/(right-left)+0.0005/scoreScale+1e-7);
      assert(py>=scoreZero-6*scoreScale && py<=scoreZero+6*scoreScale);
    }
    const densityPoints=pathPoints(f.$('[data-density-curve]')).slice(1,-1);
    assert.equal(densityPoints.length,scorePoints.length);
    for(const [px,py] of densityPoints)
      close((densityBase-py)/densityScale,exact(fx,xAt(px)).density,0.001*10/(right-left)+0.0005/densityScale);
    for(const time of [0,7,10,16,18,26,28,34,40]) {
      f.seek(time); const got=actual(f),px=left+(got.x-fx.domain[0])/(fx.domain[1]-fx.domain[0])*(right-left);
      const density=f.$('[data-probe-dot="density"]'),score=f.$('[data-probe-dot="score"]');
      close(attr(density,'cx'),px); close(attr(score,'cx'),px);
      close(attr(density,'cy'),densityBase-got.density*densityScale);
      close(attr(score,'cy'),scoreZero-got.score*scoreScale);
    }
  }
});

test('score field: signed arrows add tip-to-tail on one shared magnitude ruler', t => {
  const f=fixture(t,NAME),fx=declared(f); f.load(); f.open();
  const normalize=text=>Number(text.replaceAll('−','-'));
  for(const width of widths) {
    f.resize(width);
    for(const time of [10,14,16,18,21,25,28,32,34,36,40]) {
      f.seek(time); const got=checkState(f,fx),d=f.root.dataset;
      const origin=Number(d.pullOrigin),scale=Number(d.pullScale);
      assert(scale>0);
      const arrows=[f.$('[data-pull="0"]'),f.$('[data-pull="1"]'),f.$('[data-score-arrow]')];
      const values=[...got.pulls,got.score];
      arrows.forEach((arrow,i)=>{
        const start=attr(arrow,'data-start'),end=attr(arrow,'data-end');
        close(attr(arrow,'data-magnitude'),values[i]);
        close(end-start,values[i]*scale,2e-10);
        assert(start>=0 && start<=width && end>=0 && end<=width);
        const segment=/^M\s+([-\d.e+]+)\s+([-\d.e+]+)\s+L\s+([-\d.e+]+)\s+([-\d.e+]+)/i.exec(arrow.getAttribute('d'));
        assert(segment,'the path exposes its actual horizontal arrow segment');
        close(Number(segment[1]),start); close(Number(segment[3]),end);
        close(Number(segment[2]),Number(segment[4]));
        const label=i<2?f.$(`[data-pull-value="${i}"]`):f.$('[data-value="score"]');
        close(normalize(label.textContent),values[i],5.00001e-5);
      });
      close(attr(arrows[0],'data-start'),origin);
      close(attr(arrows[1],'data-start'),attr(arrows[0],'data-end'));
      close(attr(arrows[2],'data-start'),origin);
      close(attr(arrows[2],'data-end'),attr(arrows[1],'data-end'));
      if(got.x===0) {
        close(attr(arrows[0],'data-end')-origin,-(attr(arrows[1],'data-end')-attr(arrows[1],'data-start')));
        close(attr(arrows[2],'data-end'),origin);
        assert(!f.$('[data-zero-result]').hasAttribute('hidden'),'zero sum needs a visible result mark, not a vanished arrow');
      }
    }
  }
});

test('score field: the white label halo cannot override the signed arrow strokes', t => {
  const f=fixture(t,NAME); f.load(); f.open(); f.seek(18);
  const css=read('score-field/player.css');
  const halo=css.match(/([^{}]+)\{[^{}]*paint-order\s*:\s*stroke\s*;[^{}]*stroke\s*:\s*white\s*;[^{}]*\}/);
  assert(halo,'the label halo remains available where a curve crosses a numeral');
  const selectors=halo[1].trim().split(',').map(selector=>selector.trim());
  assert.deepEqual(selectors,['.score-field-figure text[data-value]',
    '.score-field-figure text[data-responsibility]']);
  for(const arrow of drawing(f).querySelectorAll('[data-pull], [data-score-arrow]')) {
    assert(arrow.hasAttribute('data-magnitude'));
    assert(!arrow.hasAttribute('data-value'),'data-value is reserved for textual readouts');
    for(const selector of selectors) assert(!arrow.matches(selector),'a white numeral halo must not repaint a wine arrow');
  }
  assert(f.$('[data-value="score"]').matches(selectors[0]));
});

test('score field: wide and narrow script-free prints equal the current final frame', async t => {
  const generated=await staticFrame(NAME);
  assert.equal(generated.before,generated.after,'regenerate with render_static_frames.cjs score-field');
  const f=fixture(t,NAME),narrow=f.$('[data-static-frame="narrow"]');
  assert(narrow); assert.equal(narrow.dataset.width,'296');
  const height=Number(narrow.dataset.height);
  const ids=[...f.root.querySelectorAll('[id]')].map(node=>node.id);
  assert.equal(ids.length,new Set(ids).size,'static prints do not share local IDs');
  f.load(); f.open(); f.seek(40); f.resize(296);
  assert.equal(f.root.querySelectorAll('[data-static-frame="narrow"]').length,0);
  assert.equal(numbers(f.$('[data-figure] svg').getAttribute('viewBox'))[3],height);
  const css=read('score-field/player.css');
  assert.match(css,/@container\s*\(max-width:\s*519px\)/);
  assert.match(css,new RegExp(`aspect-ratio:\\s*296\\s*/\\s*${height}`));
});

test('score field: local inspection is not a sample, a learned score, or reverse diffusion', t => {
  const f=fixture(t,NAME),boundary=f.$('.mechanism-boundary').textContent;
  assert.match(boundary,/fixed|analytic/i); assert.match(boundary,/not[\s\S]{0,45}(?:sampl|trajectory)/i);
  assert.match(boundary,/reverse diffusion/i); assert.match(boundary,/not[\s\S]{0,45}(?:ascent|sampl)/i);
  const source=read('score-field/player.js');
  assert.doesNotMatch(source,/Math\.random|fetch\(|import\(|setInterval\(/);
  assert.doesNotMatch(read('score-field/panel.html'),/@eq-/);
  assert(!read('score-field/player.css').includes('#c05621'),'fixed component means are not learnable parameters');
});
