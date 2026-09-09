#!/usr/bin/env node
// Test-only JSDOM. No dependency from this file enters the published book.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {createRequire} = require('node:module');
const {JSDOM} = createRequire(path.join(__dirname, 'html-tests/package.json'))('jsdom');
const read = name => fs.readFileSync(path.join(__dirname, '../interactives', name), 'utf8');
const shared = read('shared/playback.js'), loader = read('shared/loader.js');
const ids = {'kernel-weighting': 'kernel-weighting-excerpt', 'bert-ledger': 'bert-ledger-excerpt'};
const close = (a, b, epsilon = 1e-12) => assert(Math.abs(a - b) <= epsilon, `${a} != ${b}`);
// Attribute-token order is not drawing state; preserve every class and CSS value.
const canonicalMarkup = markup => markup
  .replace(/ class="([^"]*)"/g, (_, value) => value.trim()
    ? ` class="${value.trim().split(/\s+/).sort().join(' ')}"` : '')
  .replace(/ style="([^"]*)"/g, (_, value) => {
    const declarations=value.split(';').map(s=>s.trim()).filter(Boolean).sort();
    return declarations.length ? ` style="${declarations.join('; ')}"` : '';
  });

function fixture(t, scene, options = {}) {
  const markup = read(`${scene}/panel.html`).replace('<!-- PLAYER_CONTROLS -->', read('shared/controls.html'));
  const dom = new JSDOM(markup, {runScripts: 'outside-only', pretendToBeVisual: true,
    url: `https://book.example/chapters/part4/chapter.html${options.hash || ''}`});
  const w = dom.window, d = w.document, root = d.getElementById(ids[scene]);
  const $ = s => root.querySelector(s), frames = new Map();
  let now = 0, serial = 0, hidden = false, full = null, width = 600, motionChange;
  Object.defineProperty(w.performance, 'now', {value: () => now});
  Object.defineProperty(d, 'hidden', {get: () => hidden});
  Object.defineProperty(d, 'fullscreenElement', {get: () => full});
  w.requestAnimationFrame = fn => { frames.set(++serial, fn); return serial; };
  w.cancelAnimationFrame = id => frames.delete(id);
  const motion = {matches: Boolean(options.reduced), addEventListener(_, fn) { motionChange = fn; }};
  w.matchMedia = () => motion;
  w.HTMLDialogElement.prototype.showModal = function() { this.open = true; };
  w.HTMLDialogElement.prototype.close = function() { this.open = false; this.dispatchEvent(new w.Event('close')); };
  const rect = (x, y, a, b) => ({left:x, top:y, width:a, height:b, right:x+a, bottom:y+b});
  w.Element.prototype.getBoundingClientRect = function() {
    if (this.dataset.box) {
      const i = ['input','target','prediction','loss'].indexOf(this.dataset.box);
      return rect(10 + (i % 2) * width / 2, 20 + Math.floor(i / 2) * 150, width / 2 - 28, 114);
    }
    return rect(10, 20, width, 264);
  };
  let onResize;
  w.ResizeObserver = class { constructor(fn) { onResize = fn; } observe() {} };
  if (options.nativeFullscreen) {
    Object.defineProperty(d, 'fullscreenEnabled', {value: true});
    $('[data-pane]').requestFullscreen = async () => {
      if (options.nativeFullscreen === 'reject') throw Error('denied');
      full = $('[data-pane]'); d.dispatchEvent(new w.Event('fullscreenchange'));
    };
    d.exitFullscreen = async () => {full = null; d.dispatchEvent(new w.Event('fullscreenchange'));};
  }
  t.after(async () => {
    // JSDOM queues native details-toggle events outside the fake RAF clock.
    // Let them settle while the window is alive, with deferred loaders closed.
    root.open=false;
    await new Promise(resolve=>setTimeout(resolve,0));
    w.close();
  });
  const trigger = (element, event) => element.dispatchEvent(new w.Event(event));
  const f = {
    w, d, root, $, frames,
    load() { w.eval(shared); w.eval(read(`${scene}/player.js`)); },
    open() { root.open = true; trigger(root, 'toggle'); },
    shut() { root.open = false; trigger(root, 'toggle'); },
    seek(time) { $('input[type=range]').value = String(time); trigger($('input[type=range]'), 'input'); },
    play() { $('[data-action=play]').click(); },
    speed(value) { $('[data-speed]').value = String(value); trigger($('[data-speed]'), 'change'); },
    tick(ms, deliver = true) {
      now += ms;
      if (deliver) { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn(now)); }
    },
    hide() {hidden = true; trigger(d, 'visibilitychange');},
    resize(next) {width = next; onResize();},
    reduce() {motion.matches = true; motionChange();},
    key(key, target = $('[data-pane]')) { target.dispatchEvent(new w.KeyboardEvent('keydown', {key, bubbles:true, cancelable:true})); },
    scripts() {return [...d.querySelectorAll('script[src]')];},
    finishScript() {
      const script = f.scripts().at(-1);
      w.eval(script.src.includes('/shared/') ? shared : read(`${scene}/player.js`));
      trigger(script, 'load');
    },
    get time() {return Number(root.dataset.time);},
    get playing() {return root.dataset.playing === 'true';}
  };
  return f;
}

for (const scene of Object.keys(ids)) {
  test(`${scene}: static fallback has complete witness and no exposed dead controls`, t => {
    const f = fixture(t, scene);
    assert(!f.root.open); assert(f.$('[data-controls]').hidden);
    assert.match(f.root.textContent, scene === 'kernel-weighting' ? /2\.7412/ : /selected = 1/);
    assert.equal(f.$('.mechanism-transcript').open, false);
    assert.equal(f.scripts().length, 0);
  });
  test(`${scene}: transport and scene load only on open, once, and never autoplay`, t => {
    const f = fixture(t, scene); f.w.eval(loader); f.w.eval(loader);
    assert.equal(f.scripts().length, 0);
    f.open(); assert.equal(f.scripts().length, 1); assert.match(f.scripts()[0].src, /shared\/playback/);
    f.finishScript(); assert.equal(f.scripts().length, 2);
    f.finishScript(); assert.equal(f.root.dataset.ready, 'true'); assert(!f.playing); assert.equal(f.frames.size, 0);
    f.shut(); f.open(); assert.equal(f.scripts().length, 2);
  });
  for (const anchor of [ids[scene], scene === 'kernel-weighting' ? 'kernel-playback-help' : 'bert-playback-help']) {
    test(`${scene}: direct anchor ${anchor} opens paused and reveals nested help`, t => {
      const f = fixture(t, scene, {hash:`#${anchor}`}); f.w.eval(loader);
      assert(f.root.open); assert.equal(f.scripts().length, 1);
      f.finishScript(); f.finishScript(); assert(!f.playing);
      if (anchor.endsWith('help')) assert(f.d.getElementById(anchor).closest('details').open);
    });
  }
  test(`${scene}: failed transport and failed scene each preserve fallback and can retry`, t => {
    const f = fixture(t, scene); f.w.eval(loader); f.open();
    f.scripts()[0].dispatchEvent(new f.w.Event('error'));
    assert.equal(f.scripts().length, 0); assert.match(f.$('[data-load-status]').textContent, /could not load/);
    assert(f.$('[data-controls]').hidden);
    f.shut(); f.open(); f.finishScript();
    f.scripts().at(-1).dispatchEvent(new f.w.Event('error'));
    assert.equal(f.scripts().length, 1); assert(f.$('[data-controls]').hidden);
    f.shut(); f.open(); f.finishScript(); assert.equal(f.root.dataset.ready, 'true');
  });
  test(`${scene}: malformed script load is not reported as ready`, t => {
    const f = fixture(t, scene); f.w.eval(loader); f.open(); f.finishScript();
    f.scripts().at(-1).dispatchEvent(new f.w.Event('load'));
    assert(!f.root.dataset.ready); assert.match(f.$('[data-load-status]').textContent, /could not load/);
  });
  test(`${scene}: 1.5x default, fractional pause, changed speed, replay, and idempotent setup`, t => {
    const f = fixture(t, scene); f.load(); f.load(); f.open();
    assert.equal(f.$('[data-speed]').value, '1.5'); f.play(); assert.equal(f.frames.size, 1);
    f.tick(1100, false); f.play(); close(f.time, 1.65); assert.equal(f.frames.size, 0);
    f.play(); f.tick(1000); close(f.time, 3.15); f.speed(2); f.tick(1000); close(f.time, 5.15);
    f.tick(30000); assert.equal(f.time, 40); assert(!f.playing);
    assert.equal(f.$('[data-action=play]').getAttribute('aria-label'), 'Replay');
    f.play(); assert.equal(f.time, 0); assert(f.playing);
  });
  test(`${scene}: scrubbing is deterministic and stops playback`, t => {
    const f = fixture(t, scene); f.load(); f.open();
    const sceneMarkup = () => canonicalMarkup(f.$('[data-pane]').innerHTML.replace(/aria-valuetext="[^"]*"/g, ''));
    f.seek(24.375); const first = sceneMarkup();
    f.play(); f.tick(3000); f.seek(5); f.seek(24.375);
    assert.equal(sceneMarkup(), first); assert(!f.playing); assert.equal(f.frames.size, 0);
  });
  test(`${scene}: pane keyboard and native control keys remain separate`, t => {
    const f = fixture(t, scene); f.load(); f.open();
    f.key('ArrowRight'); assert.equal(f.time, 2.5);
    f.key('End'); assert.equal(f.time, 40); f.key('Home'); assert.equal(f.time, 0);
    f.key(' '); assert(f.playing); f.key('Escape'); assert(!f.playing);
    f.key('End', f.$('[data-speed]')); assert.equal(f.time, 0);
    f.key(' ', f.$('[data-action=play]')); assert(!f.playing);
  });
  test(`${scene}: close, hidden tab, and page exit pause the clock`, t => {
    const f = fixture(t, scene); f.load(); f.open(); f.play(); f.tick(1000); f.shut(); assert(!f.playing);
    f.open(); assert(!f.playing); f.play(); f.hide(); assert(!f.playing);
    f.root.dispatchEvent(new f.w.Event('toggle')); assert.equal(f.frames.size, 0);
    f.w.dispatchEvent(new f.w.Event('pagehide')); assert.equal(f.frames.size, 0);
  });
  test(`${scene}: expanded view moves the same pane, retains time, and exits paused`, t => {
    const f = fixture(t, scene); f.load(); f.open(); f.seek(12.5);
    const pane = f.$('[data-pane]'); f.$('[data-action=fullscreen]').click();
    assert(f.$('dialog').open); assert.equal(pane.parentElement, f.$('dialog'));
    f.play(); f.tick(1000); f.$('[data-action=fullscreen]').click();
    assert(!f.$('dialog').open); assert(!f.playing); close(f.time, 14);
    assert.equal(pane, f.$('[data-pane]')); assert.notEqual(pane.parentElement, f.$('dialog'));
  });
  test(`${scene}: native fullscreen exits paused; denied fullscreen is recoverable`, async t => {
    const f = fixture(t, scene, {nativeFullscreen:true}); f.load(); f.open();
    f.$('[data-action=fullscreen]').click(); assert.equal(f.d.fullscreenElement, f.$('[data-pane]'));
    f.play(); await f.d.exitFullscreen(); assert(!f.playing);
    const denied = fixture(t, scene, {nativeFullscreen:'reject'}); denied.load(); denied.open();
    denied.$('[data-action=fullscreen]').click(); await new Promise(resolve => setImmediate(resolve));
    assert.match(denied.$('[data-notice]').textContent, /unavailable/); denied.play(); assert(denied.playing);
  });
  test(`${scene}: resizing and reduced motion never start the paused clock`, t => {
    const f = fixture(t, scene); f.load(); f.open(); f.seek(25.1);
    f.resize(280); f.reduce(); assert.equal(f.time, 25.1); assert(!f.playing); assert.equal(f.frames.size, 0);
    assert.equal(f.root.querySelectorAll('[data-action]').length, 2);
  });
}

test('kernel: manuscript witness agrees with independently evaluated stable softmax', t => {
  const f = fixture(t, 'kernel-weighting'); f.load(); f.seek(40);
  const logs = [1,3,5].map(k => -((3.5-k)**2)/(2*.6**2));
  const exp = logs.map(l => Math.exp(l - Math.max(...logs))), sum = exp.reduce((a,b)=>a+b);
  const reference = exp.map(a => a/sum), actual = JSON.parse(f.root.dataset.weights);
  actual.forEach((a,i) => close(a,reference[i]));
  const prediction = reference.reduce((a,w,i)=>a+w*[1.5,2.8,1.8][i],0);
  close(Number(f.root.dataset.prediction), prediction);
  assert.equal(prediction.toFixed(4), '2.7412');
  assert.deepEqual(actual.map(w=>w.toFixed(4)), ['0.0002','0.9413','0.0585']);
});
test('kernel: no-script calculation matches every rounded final readout', t => {
  const f = fixture(t, 'kernel-weighting');
  const selectors = ['[data-distance]', '[data-affinity]', '[data-weight]', '[data-product]'];
  const before = selectors.map(s => [...f.root.querySelectorAll(s)].map(n => n.textContent));
  f.load(); f.seek(40);
  assert.deepEqual(selectors.map(s => [...f.root.querySelectorAll(s)].map(n => n.textContent)), before);
});
test('kernel: every scrub position preserves positivity, normalization, and convex-hull bound', t => {
  const f = fixture(t, 'kernel-weighting'); f.load();
  for (let i=0;i<=400;i++) {
    f.seek(i/10); const weights=JSON.parse(f.root.dataset.weights), p=Number(f.root.dataset.prediction);
    assert(weights.every(w=>w>=0 && w<=1)); close(weights.reduce((a,b)=>a+b),1);
    assert(p>=1.5 && p<=2.8); close(p, weights.reduce((s,w,j)=>s+w*[1.5,2.8,1.8][j],0));
  }
});
test('kernel: only query moves; witness returns exactly; unrevealed fields are not false zeros', t => {
  const f = fixture(t, 'kernel-weighting'); f.load();
  assert.equal(f.$('[data-weight]').textContent, '·');
  for (const [time,q] of [[0,3.5],[20,3.5],[22,1],[27,3],[32,5],[36,3.5],[40,3.5]]) {
    f.seek(time); close(Number(f.root.dataset.query),q);
    assert.match(f.$('.kernel-settings').textContent,/0.60 \(fixed\)/);
  }
  f.seek(23.137); f.reduce(); close(Number(f.root.dataset.query)*4,Math.round(Number(f.root.dataset.query)*4));
});
test('kernel: responsive plot uses actual width and keeps all rays on their observation endpoints', t => {
  const f=fixture(t,'kernel-weighting'); f.load(); f.seek(24); f.resize(280);
  assert.equal(f.$('.kernel-plot svg').getAttribute('viewBox'),'0 0 280 190');
  const rays=[...f.root.querySelectorAll('line[stroke="#2f855a"]')]; assert.equal(rays.length,3);
  const circles=[...f.root.querySelectorAll('circle')];
  rays.forEach((ray,i)=>{close(+ray.getAttribute('x1'),+circles[i].getAttribute('cx'));close(+ray.getAttribute('y1'),+circles[i].getAttribute('cy'));});
});
test('BERT: canonical five Boolean rows partition selection; visibility is separate', t => {
  const f=fixture(t,'bert-ledger'); f.load(); const rows=JSON.parse(f.root.dataset.ledgers);
  const expected={eligible:[1,2,3,4,5,6,7,8],selected:[2,4,7,8],mask_sites:[2,7],random_sites:[4],unchanged_sites:[8]};
  for(const [name,indices] of Object.entries(expected)) assert.deepEqual(rows[name].flatMap((bit,i)=>bit?[i]:[]),indices);
  for(let i=0;i<12;i++) {
    assert.equal(+rows.mask_sites[i]+ +rows.random_sites[i]+ +rows.unchanged_sites[i],+rows.selected[i]);
    assert(!rows.selected[i] || rows.eligible[i]);
  }
  assert.deepEqual(JSON.parse(f.root.dataset.corrupted),['[CLS]','the','[MASK]','bank','bank','after','the','[MASK]','today','[SEP]','[PAD]','[PAD]']);
});
test('BERT: each branch routes corrupted input and original target to distinct destinations', t => {
  const f=fixture(t,'bert-ledger'); f.load();
  for(const [time,i,input,target,scored,visible] of [[13,2,'[MASK]','quiet',true,true],[19,4,'bank','rose',true,true],[27,8,'today','today',true,true],[33,3,'bank',null,false,true],[35,9,'[SEP]',null,false,true],[37,10,'[PAD]',null,false,false],[40,8,'today','today',true,true]]) {
    f.seek(time); assert.equal(+f.root.dataset.position,i); assert.equal(f.$('[data-input]').textContent,input);
    assert.equal(f.$('[data-target]').textContent,target||'Not a loss target');
    assert.equal(f.root.dataset.selected,String(scored)); assert.equal(f.root.dataset.visible,String(visible));
    assert.equal(f.root.dataset.scored,String(scored));
    assert.equal(f.$('[data-ray=target]').style.display,scored?'':'none');
    assert.equal(f.$('[data-ray=prediction]').style.display,scored?'':'none');
    assert.equal(f.$('[data-ray=input]').style.display,visible?'':'none');
    assert.match(f.$('[data-loss]').textContent,scored?/−log p/:/No direct term/);
  }
});
test('BERT: prediction cards and loss remain symbolic, never invented model outputs', t => {
  const f=fixture(t,'bert-ledger'); f.load();
  for(const [time,index,term] of [[13,2,'Yes: −log p₂(quiet)'],[19,4,'Yes: −log p₄(rose)'],[27,8,'Yes: −log p₈(today)'],[40,8,'Yes: −log p₈(today)']]) {
    f.seek(time);
    assert.equal(f.$('[data-output]').textContent,`Prediction at ${index}`);
    assert.equal(f.$('[data-loss]').textContent,term);
    assert.equal(f.root.dataset.prediction,undefined);
    assert.equal(f.root.dataset.probability,undefined);
  }
  assert.match(f.$('.mechanism-boundary').textContent,/No model probabilities or measured losses are supplied/);
  assert.match(f.$('.mechanism-boundary').textContent,/illustrate branches, not the population/);
});
test('BERT: originals persist while the complete input changes jointly at four seconds', t => {
  const f=fixture(t,'bert-ledger');
  const original=['[CLS]','the','quiet','bank','rose','after','the','rain','today','[SEP]','[PAD]','[PAD]'];
  const originals=()=>[...f.root.querySelectorAll('.bert-original')].map(n=>n.textContent);
  const inputs=()=>[...f.root.querySelectorAll('[data-token] b')].map(n=>n.textContent);
  assert.deepEqual(originals(),original);
  assert.equal(f.$('[data-input]').textContent,'today');
  f.load();
  for(const time of [0,3.99,4,7.99,9,15,22,31,35,37,40]) {
    f.seek(time);
    assert.deepEqual(originals(),original);
    assert.deepEqual(inputs(),time<4?original:JSON.parse(f.root.dataset.corrupted));
    const chosen=[...f.root.querySelectorAll('[data-token]')].flatMap((n,i)=>n.classList.contains('is-selected')?[i]:[]);
    assert.deepEqual(chosen,time<4?[]:[2,4,7,8]);
  }
  assert.match(f.$('[data-visibility]').textContent,/bookkeeping, not an extra model input/);
  assert.match(f.$('[data-visibility]').textContent,/all 10 nonpadding tokens/);
});
test('BERT: setup preserves the prediction question and every case waits for both routes', t => {
  const f=fixture(t,'bert-ledger'); f.load();
  for(const time of [0,2,3.99,4,6,7.99]) {
    f.seek(time);
    assert.equal(f.root.dataset.scored,'false');
    assert.equal(f.$('[data-loss]').textContent,'Does it count?');
    for(const name of ['input','target','prediction']) {
      assert.equal(+f.$(`[data-ray=${name}]`).dataset.progress,0);
      assert.equal(f.$(`[data-ray=${name}]`).style.display,'none');
    }
  }
  for(const [start,duration] of [[8,6],[14,6],[20,8]]) {
    f.seek(start+duration*.75-.01);
    assert.equal(f.root.dataset.scored,'false');
    assert.doesNotMatch(f.$('[data-loss]').textContent,/Yes:|−log/);
    f.seek(start+duration*.75);
    assert.equal(f.root.dataset.scored,'true');
    assert.match(f.$('[data-loss]').textContent,/^Yes: −log/);
  }
});
test('BERT: progressive rays independently follow input, saved target, then prediction', t => {
  const f=fixture(t,'bert-ledger'); f.load();
  // Fixture rectangles establish the two separate inputs to loss, never a
  // saved-label connection into the encoder. These are geometry, not learned data.
  const destinations={input:'M136,116L136,145',target:'M436,116L436,145',prediction:'M274,207L295,207'};
  const clamp=n=>Math.max(0,Math.min(1,n));
  for(const [start,duration] of [[8,6],[14,6],[20,8]]) {
    for(const fraction of [0,.125,.25,.375,.5,.625,.75,.875]) {
      f.seek(start+duration*fraction);
      for(const [name,offset] of [['input',0],['target',1],['prediction',2]]) {
        const expected=clamp(4*fraction-offset), ray=f.$(`[data-ray=${name}]`), pulse=f.$(`[data-pulse=${name}]`);
        assert.equal(ray.getAttribute('d'),destinations[name]);
        close(+ray.dataset.progress,expected);
        close(+ray.style.strokeDashoffset,1-expected);
        assert.equal(ray.style.display,expected>0?'':'none');
        assert.equal(pulse.style.display,expected>0&&expected<1?'':'none');
        assert.equal(ray.getAttribute('marker-end'),expected===1?`url(#bert-${name}-arrow)`:'none');
        const coordinates=ray.getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number);
        close(+pulse.getAttribute('cx'),coordinates[0]+(coordinates[2]-coordinates[0])*expected);
        close(+pulse.getAttribute('cy'),coordinates[1]+(coordinates[3]-coordinates[1])*expected);
      }
    }
  }
});
test('BERT: unselected context has an input route but never an original-target or loss route', t => {
  const f=fixture(t,'bert-ledger'); f.load();
  for(const time of [28,28.75,29.5,31,33,35,37]) {
    f.seek(time);
    assert.equal(f.root.dataset.selected,'false');
    assert.equal(f.root.dataset.scored,'false');
    for(const name of ['target','prediction']) {
      assert.equal(+f.$(`[data-ray=${name}]`).dataset.progress,0);
      assert.equal(f.$(`[data-pulse=${name}]`).style.display,'none');
    }
    assert.doesNotMatch(f.$('[data-loss]').textContent,/Yes:|−log/);
  }
  f.seek(35);
  assert.equal(f.root.dataset.visible,'true');
  assert.equal(+f.$('[data-ray=input]').dataset.progress,1);
  f.seek(37);
  assert.equal(f.root.dataset.visible,'false');
  assert.equal(+f.$('[data-ray=input]').dataset.progress,0);
  assert.match(f.$('[data-input-note]').textContent,/Blocked as an attention key/);
});
test('BERT: Boolean ledgers stay secondary, closed, and addressable by a direct anchor', t => {
  const f=fixture(t,'bert-ledger');
  assert.equal(f.$('#bert-ledger-bits').open,false);
  assert.equal(f.$('#bert-ledger-transcript').open,false);
  f.load(); f.open(); f.seek(27);
  assert.equal(f.$('#bert-ledger-bits').open,false);
  assert.deepEqual([...f.root.querySelectorAll('[data-bit]')].map(n=>n.textContent),['1','1','0','0','1']);
  const anchored=fixture(t,'bert-ledger',{hash:'#bert-ledger-bits'});
  anchored.w.eval(loader); anchored.finishScript(); anchored.finishScript();
  assert(anchored.root.open); assert(anchored.$('#bert-ledger-bits').open); assert(!anchored.playing);
});
test('BERT: reduced motion quantizes each ray and never shows a moving dot', t => {
  const f=fixture(t,'bert-ledger',{reduced:true}); f.load(); f.open();
  for(const time of [0,4,8,8.75,9.5,10.25,11,11.75,12.5,15,23,30,35,37,40]) {
    f.seek(time);
    for(const name of ['input','target','prediction']) {
      assert([0,1].includes(+f.$(`[data-ray=${name}]`).dataset.progress));
      assert.equal(f.$(`[data-pulse=${name}]`).style.display,'none');
    }
    assert(!f.playing);
  }
  const live=fixture(t,'bert-ledger'); live.load(); live.open(); live.seek(10.25);
  assert.equal(+live.$('[data-ray=target]').dataset.progress,.5);
  live.reduce();
  assert.equal(+live.$('[data-ray=target]').dataset.progress,0);
  assert.equal(live.$('[data-pulse=target]').style.display,'none');
  close(live.time,10.25); assert(!live.playing);
});
test('BERT: a midpoint scrub reconstructs rays exactly and pause preserves their fractional progress', t => {
  const f=fixture(t,'bert-ledger'); f.load(); f.open();
  const routes=()=>['input','target','prediction'].map(name=>({
    ray:canonicalMarkup(f.$(`[data-ray=${name}]`).outerHTML),
    pulse:canonicalMarkup(f.$(`[data-pulse=${name}]`).outerHTML)
  }));
  f.seek(10.375); const expected=routes();
  f.seek(40); f.seek(4); f.seek(10.375); assert.deepEqual(routes(),expected);
  f.play(); f.tick(100,false); f.play();
  close(f.time,10.525); assert(!f.playing); assert.equal(f.frames.size,0);
  const paused=routes(); f.tick(1000); assert.deepEqual(routes(),paused);
  f.seek(10.525); assert.deepEqual(routes(),paused);
});
test('BERT: corruption is joint, never just the highlighted token; resize remeasures rays', t => {
  const f=fixture(t,'bert-ledger'); f.load();
  for(const time of [4,6,10,16,24,30,35,37,40]) {
    f.seek(time);
    assert.deepEqual([...f.root.querySelectorAll('[data-token] b')].map(n=>n.textContent),JSON.parse(f.root.dataset.corrupted));
  }
  const before=f.$('[data-ray=target]').getAttribute('d'); f.resize(280);
  assert.notEqual(f.$('[data-ray=target]').getAttribute('d'),before);
  assert.equal(f.$('.bert-rays').getAttribute('viewBox'),'0 0 280 264');
});
test('integration: only the two named figure cells receive excerpts; LaTeX guard is first', () => {
  const filter = fs.readFileSync(path.join(__dirname, '../filters/mechanism-excerpts.lua'), 'utf8');
  assert.match(filter, /^--[^\n]*\nif not FORMAT:match\("\^html"\) then return \{\} end/);
  assert.match(filter, /cell-fig-kernel-lookup/); assert.match(filter, /cell-fig-mlm-policy/);
  assert.match(filter, /assert\(inserted == 1/);
  const config = fs.readFileSync(path.join(__dirname, '../_quarto.yml'), 'utf8');
  for (const asset of ['shared/playback.js', 'kernel-weighting/player.js', 'bert-ledger/player.js'])
    assert(config.includes(`interactives/${asset}`));
});
