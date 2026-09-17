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
// A printed number, read back the way a reader reads it: U+2212 for minus, four decimals,
// or a mantissa times a power of ten in Unicode superscripts. Hyphen-minus, e-notation and
// raw doubles are not numbers this scene may print, so they fail here rather than parse.
const SUPERSCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹';
function shown(text) {
  const match = /^([+−]?)(\d+(?:\.\d+)?)(?: × 10(⁻?)([⁰¹²³⁴⁵⁶⁷⁸⁹]+))?$/.exec(text.trim());
  assert(match, `not a house-style number: "${text}"`);
  const exponent = match[4] ? Number([...match[4]].map(digit => SUPERSCRIPT.indexOf(digit)).join('')) * (match[3] ? -1 : 1) : 0;
  return (match[1] === '−' ? -1 : 1) * Number(match[2]) * 10 ** exponent;
}
// Hyphen-minus before a digit, or a mantissa followed by e and an exponent.
const ASCII_MATH = /(?:^|[^\w])-\s?\d|\d(?:\.\d+)?e[-+]?\d/i;
// Drawing coordinates are serialised at 0.0001 px; the state on the root is not rounded.
const PIXEL = 6e-5;
// What is drawn, read from the picture alone: the printed numbers and the arrows' directions.
function picture(f) {
  const value = selector => f.$(selector).textContent;
  const direction = node => {const run = attr(node,'data-end')-attr(node,'data-start'); return Math.abs(run) < 0.01 ? 0 : Math.sign(run);};
  return {hidden:f.$('[data-sum-geometry]').hasAttribute('hidden'),
    x:shown(value('[data-value="x"]').replace(/^x = /,'')),
    weights:[0,1].map(i => shown(value(`[data-responsibility="${i}"]`).replace(/^weight \d: /,''))),
    pulls:[0,1].map(i => shown(value(`[data-pull-value="${i}"]`))),
    directions:[0,1].map(i => direction(f.$(`[data-pull="${i}"]`))),
    sum:shown(value('[data-value="score"]')), sumText:value('[data-value="score"]'),
    sumDirection:direction(f.$('[data-score-arrow]')),
    zeroRing:!f.$('[data-zero-result]').hasAttribute('hidden'),
    curves:f.$('[data-density-curve]').getAttribute('d')+f.$('[data-score-curve]').getAttribute('d')};
}
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
  const printed=f.$('[data-value="score"]').textContent;
  assert.equal(printed,'−4.7 × 10⁻⁶','a tiny nonzero score is a mantissa and a power of ten, not e-notation');
  assert(shown(printed)<0,'the visible readout must not round this near-mode score to a false exact zero');
  close(shown(printed),got.score,5e-8);
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
      close(attr(density,'cx'),px,PIXEL); close(attr(score,'cx'),px,PIXEL);
      close(attr(density,'cy'),densityBase-got.density*densityScale,PIXEL);
      close(attr(score,'cy'),scoreZero-got.score*scoreScale,PIXEL);
      for(const guide of drawing(f).querySelectorAll('[data-probe-guide]')) {
        close(attr(guide,'x1'),px,PIXEL); close(attr(guide,'x2'),px,PIXEL);
      }
    }
  }
});

test('score field: signed arrows add tip-to-tail on one shared magnitude ruler', t => {
  const f=fixture(t,NAME),fx=declared(f); f.load(); f.open();
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
        close(end-start,values[i]*scale,2*PIXEL);
        assert(start>=0 && start<=width && end>=0 && end<=width);
        const segment=/^M\s+([-\d.e+]+)\s+([-\d.e+]+)\s+L\s+([-\d.e+]+)\s+([-\d.e+]+)/i.exec(arrow.getAttribute('d'));
        assert(segment,'the path exposes its actual horizontal arrow segment');
        close(Number(segment[1]),start); close(Number(segment[3]),end);
        close(Number(segment[2]),Number(segment[4]));
        const label=i<2?f.$(`[data-pull-value="${i}"]`):f.$('[data-value="score"]');
        close(shown(label.textContent),values[i],5.00001e-5);
      });
      close(attr(arrows[0],'data-start'),origin);
      close(attr(arrows[1],'data-start'),attr(arrows[0],'data-end'));
      close(attr(arrows[2],'data-start'),origin);
      close(attr(arrows[2],'data-end'),attr(arrows[1],'data-end'));
      if(got.x===0) {
        close(attr(arrows[0],'data-end')-origin,-(attr(arrows[1],'data-end')-attr(arrows[1],'data-start')),2*PIXEL);
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

// --- Review pass, September 17, 2026 ------------------------------------------------

test('score field: every printed number uses U+2212 and powers of ten, never hyphen-minus or e-notation', t => {
  // The script-free panel first: both static prints and the picture's accessible name.
  const still=fixture(t,NAME),print=still.$('[data-figure] svg');
  const prints=[print.querySelector('[data-drawing]'),print.querySelector('[data-static-frame="narrow"]')];
  for(const group of prints) {
    const texts=[...group.querySelectorAll('text')].map(node=>node.textContent);
    assert(texts.length>=20,'a static print carries its labels');
    for(const text of texts) assert.doesNotMatch(text,ASCII_MATH,`ASCII math in the static print: "${text}"`);
    assert.equal(group.querySelector('[data-pull-value="0"]').textContent,'−4.5 × 10⁻¹⁵',
      'the final frame prints its tiny nonzero pull as a mantissa and a power of ten');
    assert.equal(group.querySelector('[data-responsibility="0"]').textContent,'weight 1: 3.6 × 10⁻¹⁶',
      'and the tiny weight that scales it is not printed as a false zero beside it');
    assert.equal(group.querySelector('[data-value="score"]').textContent,'−5.3333');
    for(const label of ['−5','−2','−6','mean −2']) assert(texts.includes(label),`axis label ${label} uses U+2212`);
  }
  assert.doesNotMatch(print.getAttribute('aria-label'),ASCII_MATH);
  // Then every frame, at both layouts, in every place a reader or a screen reader meets a number.
  const f=fixture(t,NAME); f.load(); f.open();
  for(const width of [713,296]) {
    f.resize(width);
    for(let n=0;n<=160;n++) {
      f.seek(n/4);
      const met=[...drawing(f).querySelectorAll('text')].map(node=>node.textContent);
      met.push(f.$('[data-figure] svg').getAttribute('aria-label'),f.$('[data-caption]').textContent,
        f.$('[data-controls] input[type="range"]').getAttribute('aria-valuetext'));
      for(const text of met) assert.doesNotMatch(text,ASCII_MATH,`ASCII math at ${n/4}s: "${text}"`);
      for(const node of drawing(f).querySelectorAll('[data-pull-value], [data-value="score"]')) shown(node.textContent);
    }
  }
  f.seek(18);
  assert.equal(f.$('[data-value="score"]').textContent,'0','an exact zero prints 0, not a run of rounded zeros');
  assert.equal(f.$('[data-value="x"]').textContent,'x = 0.00');
  f.seek(12); assert.equal(f.$('[data-value="x"]').textContent,'x = −1.00');
  assert.equal(f.$('[data-pull-value="0"]').textContent,'−1.7763');
  assert.equal(f.$('[data-pull-value="1"]').textContent,'+0.0043');
});

// One entry per thing a caption asserts about the picture. Each predicate reads only what
// is drawn: printed numbers and arrow directions. `previous` is the still of the beat
// before (reduced motion) or the frame before (normal playback).
const CLAIMS=[
  [/will the two local pulls reinforce each other or cancel\?$/, s=>assert(s.hidden,'the question sits over a withheld answer')],
  [/One probe inspects the fixed mixture/, s=>assert(s.hidden)],
  [/their sum is the score/, s=>{close(s.pulls[0]+s.pulls[1],s.sum,1.5e-4); assert.equal(s.sumDirection,Math.sign(s.sum));}],
  [/the right gains weight/, (s,previous,strict)=>assert(strict?s.weights[1]>previous.weights[1]:s.weights[1]>=previous.weights[1])],
  [/the left still dominates/, s=>assert(s.weights[0]>s.weights[1])],
  [/Equal weights/, s=>assert.equal(s.weights[0],s.weights[1])],
  [/give opposite pulls/, s=>{assert(s.pulls[0]<0 && s.pulls[1]>0); assert.deepEqual(s.directions,[-1,1]);}],
  [/They cancel/, s=>{assert.equal(s.sumText,'0'); assert.equal(s.sumDirection,0); assert(s.zeroRing);}],
  [/Right of the midpoint .* gives the right component more weight/, s=>assert(s.x<=0 || s.weights[1]>s.weights[0])],
  [/the right component dominates/, s=>assert(s.weights[1]>s.weights[0])],
  [/local score points right/, s=>{assert(s.sum>0); assert.equal(s.sumDirection,1);}],
  [/Before the right mean pull 2 points right; past it both pulls point left, and so does the score/, (s,_,__,fx)=>{
    if(s.x<fx.means[1]) {assert(s.pulls[1]>0); assert(s.directions[1]>=0);}
    if(s.x>fx.means[1]) {
      assert(s.pulls[0]<0 && s.pulls[1]<0 && s.sum<0,'both printed pulls and their sum are negative');
      assert(s.directions.every(direction=>direction<=0) && s.sumDirection<=0,'no arrow points right');
    }
  }],
  [/inspects a fixed field/, (s,_,__,___,first)=>assert.equal(s.curves,first.curves,'the sweep never redrew the field')]
];
function checkCaption(f,fx,previous,strict,first,used) {
  const caption=f.$('[data-caption]').textContent,state=picture(f);
  const matched=CLAIMS.filter(([pattern])=>pattern.test(caption));
  assert(matched.length>0,`no checkable claim recognised in "${caption}": extend CLAIMS when a caption is reworded`);
  for(const [pattern,check] of matched) {used.add(pattern); check(state,previous,strict,fx,first);}
  return state;
}

test('score field: under reduced motion every caption is true of the still it sits on', t => {
  const f=fixture(t,NAME,{reduced:true}),fx=declared(f); f.load(); f.open();
  const used=new Set(),stills=[]; let previous,first;
  for(const beat of scene.beats) {
    f.seek(beat);
    const state=checkCaption(f,fx,previous,true,first,used);
    first=first||state; previous=state; stills.push(state.x);
    f.seek(beat+1.5); assert.equal(picture(f).x,state.x,'the still holds for its whole beat');
  }
  // A hold rests on its witness; a sweep rests midway, where its sentence is about.
  assert.deepEqual(stills,[-5,-3,-1,-0.5,0,0.5,1,3,5]);
  assert.equal(used.size,CLAIMS.length,'every listed claim was exercised by some caption');
  // The defect this pins: at the old still for beat 7, x = 1, pull 2 was +1.776 under "both pulls point left".
  f.seek(32); const beyond=picture(f);
  assert(beyond.x>fx.means[1] && beyond.pulls.every(pull=>pull<0) && beyond.directions[1]===-1);
});

test('score field: in normal playback every caption stays true through the motion it introduces', t => {
  const f=fixture(t,NAME),fx=declared(f); f.load(); f.open();
  const used=new Set(); let previous,first;
  // Quarter seconds, stopping a quarter second short of the next beat, so four printed
  // decimals can still tell two nearly equal weights apart.
  for(let n=0;n<=160;n++) {
    const time=n/4;
    if(scene.beats.includes(time+0.25)) continue;
    f.seek(time);
    const state=checkCaption(f,fx,previous,false,first,used);
    first=first||state; previous=state;
  }
  assert.equal(used.size,CLAIMS.length);
});

test('score field: six live numbers, each beside its mark, and a sweep greys what it is not about', t => {
  const f=fixture(t,NAME); f.load(); f.open();
  const readouts=['[data-value="x"]','[data-responsibility="0"]','[data-responsibility="1"]',
    '[data-pull-value="0"]','[data-pull-value="1"]','[data-value="score"]'];
  assert.equal(f.$('[data-value="density"]'),null,'the density number is gone: the dot on the curve carries it');
  // No other text on the picture changes during the forty seconds.
  const texts=[...drawing(f).querySelectorAll('text')],live=new Set(readouts.map(selector=>f.$(selector)));
  const seen=new Map(texts.map(node=>[node,new Set()]));
  for(let n=0;n<=160;n++) {f.seek(n/4); for(const node of texts) seen.get(node).add(node.textContent);}
  for(const [node,values] of seen) assert(values.size===1 || live.has(node),`an unlisted number is live: ${[...values].slice(0,3).join(', ')}`);
  // What is emphasised, by beat.
  const muted=selector=>f.$(selector).classList.contains('sf-muted');
  const weightsOf=readouts.slice(1,3),pullsOf=readouts.slice(3);
  for(const [time,greyed] of [[12,[]],[16,pullsOf],[20,[]],[25,pullsOf],[30,[]],[34,weightsOf],[38,[]]]) {
    f.seek(time);
    for(const selector of readouts) assert.equal(muted(selector),greyed.includes(selector),`${selector} at ${time}s`);
  }
  for(const time of [2,7]) {
    f.seek(time); assert(f.$('[data-sum-geometry]').hasAttribute('hidden'),'before the reveal only x is on the picture');
    assert(!f.$('[data-value="x"]').closest('[hidden]'));
  }
  // At most four emphasised numbers change from one frame to the next, and none during a hold.
  let before=null;
  for(let n=0;n<=160;n++) {
    f.seek(n/4);
    const visible=!f.$('[data-sum-geometry]').hasAttribute('hidden');
    const now=readouts.map((selector,i)=>(i===0||visible)&&!muted(selector)?f.$(selector).textContent:null);
    if(before && f.root.dataset.stage===before.stage) {
      const changed=now.filter((text,i)=>text!==null && before.now[i]!==null && text!==before.now[i]).length;
      assert(changed<=4,`${changed} emphasised numbers change at once at ${n/4}s`);
      if([2,4,6,8].includes(Number(before.stage))) assert.equal(changed,0,'nothing changes while the reader reads');
    }
    before={now,stage:f.root.dataset.stage};
  }
  const css=read('score-field/player.css');
  assert.match(css,/\.score-field-figure text\.sf-muted\s*\{\s*fill:var\(--sf-scenery\);\s*\}/);
  // Beside its mark, at both layouts.
  for(const width of [713,296]) {
    f.resize(width);
    const guides=[...drawing(f).querySelectorAll('[data-probe-guide]')];
    assert.equal(guides.length,2,'the guide is broken across the label row between the plots');
    const gap=[attr(guides[0],'y2'),attr(guides[1],'y1')];
    assert(gap[1]-gap[0]>=40);
    for(const time of [0,7,12,16,20,26,30,34,38]) {
      f.seek(time);
      const x=f.$('[data-value="x"]');
      assert(Math.abs(attr(x,'x')-attr(guides[0],'x1'))<=20,`x rides with the probe at ${time}s`);
      // Nothing in the label row can be crossed by the guide, wherever the probe stands.
      for(const node of [x,f.$('[data-valley] text'),...drawing(f).querySelectorAll('[data-mean-label], [data-score-title]')])
        assert(attr(node,'y')-12>=gap[0] && attr(node,'y')<=gap[1],`"${node.textContent}" sits between the guide's two segments`);
      if(time<10) continue;
      const origin=Number(f.root.dataset.pullOrigin);
      const rows=[f.$('[data-pull="0"]'),f.$('[data-pull="1"]'),f.$('[data-score-arrow]')];
      const labels=[f.$('[data-pull-value="0"]'),f.$('[data-pull-value="1"]'),f.$('[data-value="score"]')];
      rows.forEach((arrow,i)=>{
        const extent=Math.max(origin,attr(arrow,'data-start'),attr(arrow,'data-end'));
        assert.notEqual(labels[i].getAttribute('text-anchor'),'end','a value is not parked at the far edge of the pane');
        close(attr(labels[i],'x')-extent,10,2*PIXEL);
        const row=Number(/^M\s+\S+\s+(\S+)/.exec(arrow.getAttribute('d'))[1]);
        assert(Math.abs(attr(labels[i],'y')-row)<=5,'the value shares its arrow\'s row');
      });
      assert.equal(attr(labels[1],'x'),attr(labels[2],'x'),'the second pull and the sum end at the same tip, so their values align');
    }
    [0,1].forEach(i=>{
      const weight=f.$(`[data-responsibility="${i}"]`);
      if(width>=520) {
        assert.equal(weight.getAttribute('text-anchor'),'middle');
        assert.equal(attr(weight,'x'),attr(f.$(`[data-mean="${i}"]`),'x1'),'each weight sits under its own component');
      } else assert.equal(attr(weight,'x'),i?width-8:8);
    });
  }
});

test('score field: the fixed field is drawn once per width, not once per frame', t => {
  const f=fixture(t,NAME); f.load(); f.open(); f.seek(0);
  const fixed=new Set([f.$('[data-density-curve]'),f.$('[data-score-curve]'),f.$('[data-valley] circle'),
    f.$('[data-pull-origin]'),...drawing(f).querySelectorAll('[data-mean], [data-mean-label], [data-score-title]')]);
  const layoutKeys=['data-plot-left','data-plot-right','data-score-zero','data-score-scale','data-density-baseline',
    'data-density-scale','data-pull-origin','data-pull-scale'];
  const observer=new f.w.MutationObserver(()=>{});
  observer.observe(f.$('[data-figure] svg'),{attributes:true,subtree:true});
  observer.observe(f.root,{attributes:true,attributeFilter:layoutKeys});
  const rewrites=()=>observer.takeRecords().filter(record=>fixed.has(record.target)
    || record.target===f.root || (record.target===f.$('[data-figure] svg') && record.attributeName==='viewBox'));
  for(let n=0;n<=80;n++) f.seek(n/2);
  assert.deepEqual(rewrites().map(record=>record.attributeName),[],'a frame rewrote something that depends only on the width');
  const before=f.$('[data-score-curve]').getAttribute('d');
  f.resize(296);
  assert(rewrites().length>=fixed.size,'a new width redraws the field');
  assert.notEqual(f.$('[data-score-curve]').getAttribute('d'),before);
  observer.disconnect();
  // The serialised picture carries no raw doubles: at most four decimals in any attribute.
  for(const time of [7,12,20,34,40]) {
    f.seek(time);
    for(const node of drawing(f).querySelectorAll('*')) for(const {name,value} of node.attributes)
      assert.doesNotMatch(value,/\d\.\d{5,}|\de[-+]?\d/i,`${name}="${value.slice(0,40)}" is an unrounded coordinate`);
  }
});

test('score field: live numbers are announced in one place, the scrubber value text', t => {
  const f=fixture(t,NAME); f.load(); f.open();
  const svg=f.$('[data-figure] svg'),range=f.$('[data-controls] input[type="range"]');
  const observer=new f.w.MutationObserver(()=>{});
  observer.observe(svg,{attributes:true,attributeFilter:['aria-label']});
  for(let n=0;n<=160;n++) {
    f.seek(n/4);
    assert.doesNotMatch(svg.getAttribute('aria-label'),/\d/,'the picture\'s name describes it; it does not recite live values');
  }
  assert(observer.takeRecords().length<=3,'and it is rewritten only when the description changes');
  observer.disconnect();
  f.seek(12);
  const spoken=range.getAttribute('aria-valuetext');
  for(const selector of ['[data-pull-value="0"]','[data-pull-value="1"]','[data-value="score"]'])
    assert(spoken.includes(f.$(selector).textContent),`${selector} is announced with the scrubber`);
  assert.match(spoken,/Weights 0\.9992 and 0\.0008\./);
  assert.match(fixture(t,NAME).$('[data-figure] svg').getAttribute('aria-label'),/^A fixed two-component density/,
    'the static print carries the same number-free name');
});
