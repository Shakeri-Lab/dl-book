#!/usr/bin/env node
// Test-only JSDOM harness for the mechanism excerpts. No dependency from this file
// enters the published book, and nothing here is a test file: `node --test` is given
// the scene suites, which require this module for the parts every scene shares.
//
// What lives here: the JSDOM fixture, the markup canonicaliser, and the transport
// suite each scene inherits through registerTransportTests(). What does not: a
// scene's arithmetic or Boolean invariants, which are the whole reason the scene
// exists and belong beside it in its own suite.
//
// The stage strip (`.mechanism-stages`) is not part of this contract. The three scenes
// that shipped before the visual grammar — convolution, kernel-weighting, bert-ledger —
// keep one and test it in their own suites; a scene written to the grammar
// (docs/animation-authoring.md, "Visual grammar") has none. Every generic check below
// reads the stage from root.dataset.stage (or the key a suite names), never from a
// strip; stageLabels() returns [] for a panel without one; and registerGrammarTests()
// is the opt-in suite for the picture / formula / caption shape.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {JSDOM} = require('jsdom');

const ROOT = path.join(__dirname, '..', '..');
const read = name => fs.readFileSync(path.join(ROOT, 'interactives', name), 'utf8');
const shared = read('shared/playback.js'), loader = read('shared/loader.js');

// interactives/manifest.json is the build-time index the Lua filter, the fixture audit
// and these tests all read, so a scene's duration and beats are stated exactly once.
const manifest = JSON.parse(read('manifest.json'));
// Scenes are addressable by either name a caller is likely to have: the panel id the
// manifest publishes, or the directory under interactives/.
const entry = name => {
  const found = manifest.scenes.find(scene => scene.id === name || scene.scene === name);
  assert(found, `interactives/manifest.json indexes no scene called ${name}`);
  return found;
};
const chapterSource = name => fs.readFileSync(path.join(ROOT, entry(name).qmd), 'utf8');

const numbers = value => value.trim().split(/\s+/).map(Number);
const clockText = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const close = (a, b, epsilon = 1e-12) => assert(Math.abs(a - b) <= epsilon, `${a} != ${b}`);
// Attribute-token order is not drawing state; preserve every class and CSS value.
const canonicalMarkup = markup => markup
  .replace(/ class="([^"]*)"/g, (_, value) => value.trim()
    ? ` class="${value.trim().split(/\s+/).sort().join(' ')}"` : '')
  .replace(/ style="([^"]*)"/g, (_, value) => {
    const declarations=value.split(';').map(s=>s.trim()).filter(Boolean).sort();
    return declarations.length ? ` style="${declarations.join('; ')}"` : '';
  });

// Per-scene fixture defaults, so a scene that measures its own elements declares that
// once instead of every suite passing the same map. registerTransportTests() feeds the
// same registry, and an explicit option at a call site still wins.
const configured = new Map();
function configure(name, options = {}) {
  const key = entry(name).scene;
  const merged = {...(configured.get(key) || {}), ...options};
  configured.set(key, merged);
  return merged;
}

function fixture(t, name, options = {}) {
  const scene = entry(name);
  options = {...(configured.get(scene.scene) || {}), ...options};
  const markup = read(`${scene.scene}/panel.html`)
    .replace('<!-- PLAYER_CONTROLS -->', read('shared/controls.html'));
  const dom = new JSDOM(markup, {runScripts: 'outside-only', pretendToBeVisual: true,
    url: `https://book.example/chapters/part4/chapter.html${options.hash || ''}`});
  const w = dom.window, d = w.document, root = d.getElementById(scene.id);
  assert(root, `${scene.scene}/panel.html declares no element with id ${scene.id}`);
  const $ = s => root.querySelector(s), frames = new Map();
  let now = 0, serial = 0, hidden = false, full = null, width = options.width || 600, motionChange;
  Object.defineProperty(w.performance, 'now', {value: () => now});
  Object.defineProperty(d, 'hidden', {get: () => hidden});
  Object.defineProperty(d, 'fullscreenElement', {get: () => full});
  w.requestAnimationFrame = fn => { frames.set(++serial, fn); return serial; };
  w.cancelAnimationFrame = id => frames.delete(id);
  const motion = {matches: Boolean(options.reduced), addEventListener(_, fn) { motionChange = fn; }};
  w.matchMedia = () => motion;
  // MathJax is absent in JSDOM, as it is for a reader with scripts blocked: the TeX
  // source inside each span[id^="eq-"] is what the panel shows. A suite that wants to
  // prove the player's one guarded typeset call passes `mathjax`:
  //   'stub'     typesetPromise records its call in f.typesets and plants an
  //              mjx-container in every untypeset eq- span, as MathJax would;
  //   'typeset'  the same stub, but every eq- span already holds an mjx-container, as
  //              the page's lazy typesetter leaves it — the player must not call again;
  //   'reject'   the same stub, and the promise rejects.
  const typesets = [];
  const plant = span => { if (!span.querySelector('mjx-container')) span.append(d.createElement('mjx-container')); };
  const formulas = () => [...root.querySelectorAll('span[id^="eq-"]')];
  if (['stub', 'typeset', 'reject'].includes(options.mathjax)) {
    if (options.mathjax === 'typeset') formulas().forEach(plant);
    w.MathJax = {typesetPromise: async roots => {
      typesets.push(roots);
      if (options.mathjax === 'reject') throw Error('typeset failed');
      roots.forEach(node => node.querySelectorAll('span[id^="eq-"]').forEach(plant));
    }};
  }
  w.HTMLDialogElement.prototype.showModal = function() { this.open = true; };
  w.HTMLDialogElement.prototype.close = function() { this.open = false; this.dispatchEvent(new w.Event('close')); };
  const rect = (x, y, a, b) => ({left:x, top:y, width:a, height:b, right:x+a, bottom:y+b});
  // A scene that measures elements supplies its own rect map: (element, {width, rect})
  // returning a rectangle, or nothing to take the pane-sized default. JSDOM lays nothing
  // out, so these rectangles are the geometry every ray endpoint is computed from.
  w.Element.prototype.getBoundingClientRect = function() {
    const own = options.rects && options.rects(this, {width, rect});
    return own || rect(10, 20, width, 264);
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
    w, d, root, $, frames, scene, typesets, formulas,
    load() { w.eval(shared); w.eval(read(`${scene.scene}/player.js`)); },
    open() { root.open = true; trigger(root, 'toggle'); },
    shut() { root.open = false; trigger(root, 'toggle'); },
    seek(time) { $('[data-controls] input[type=range]').value = String(time); trigger($('[data-controls] input[type=range]'), 'input'); },
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
      w.eval(script.src.includes('/shared/') ? shared : read(`${scene.scene}/player.js`));
      trigger(script, 'load');
    },
    get time() {return Number(root.dataset.time);},
    get playing() {return root.dataset.playing === 'true';}
  };
  return f;
}

// What the scene itself draws, with the transport's own bar taken out: the control bar
// prints a clock that ticks whether or not the mechanism changes, so comparing it would
// make "this beat changes something" true by construction.
function drawnMarkup(f) {
  const pane = f.$('[data-pane]').cloneNode(true);
  pane.querySelectorAll('[data-controls], [data-notice]').forEach(node => node.remove());
  return canonicalMarkup(pane.innerHTML);
}

// The transport suite every scene inherits. Options:
//   witness  RegExp the static, script-free panel must already print.
//   anchors  extra nested disclosure ids that a direct link must open.
//   rects    (element, {width, rect}) => rect, for scenes that measure.
//   stage    the root data-* key naming the scene's stage; default 'stage'.
function registerTransportTests(name, options = {}) {
  const scene = entry(name);
  configure(name, options);
  const label = scene.scene, duration = scene.duration, beats = scene.beats;
  const stageKey = options.stage || 'stage';
  // Probe times are written as the seconds the shipped forty-second scenes have always
  // used and scaled to whatever duration a scene declares, so a shorter scene inherits
  // the same checks at the same points of its timeline.
  const at = seconds => Number((seconds / 40 * duration).toFixed(4));

  test(`${label}: static fallback has complete witness and no exposed dead controls`, t => {
    const f = fixture(t, name);
    assert(!f.root.open); assert(f.$('[data-controls]').hidden);
    assert(options.witness, `${label} must declare the witness its static panel prints`);
    assert.match(f.root.textContent, options.witness);
    assert.equal(f.$('.mechanism-transcript').open, false);
    assert.equal(f.scripts().length, 0);
  });
  test(`${label}: transport and scene load only on open, once, and never autoplay`, t => {
    const f = fixture(t, name); f.w.eval(loader); f.w.eval(loader);
    assert.equal(f.scripts().length, 0);
    f.open(); assert.equal(f.scripts().length, 1); assert.match(f.scripts()[0].src, /shared\/playback/);
    f.finishScript(); assert.equal(f.scripts().length, 2);
    f.finishScript(); assert.equal(f.root.dataset.ready, 'true'); assert(!f.playing); assert.equal(f.frames.size, 0);
    f.shut(); f.open(); assert.equal(f.scripts().length, 2);
  });
  for (const anchor of [scene.id, ...(options.anchors || [])]) {
    test(`${label}: direct anchor ${anchor} opens paused and reveals nested help`, t => {
      const f = fixture(t, name, {hash:`#${anchor}`}); f.w.eval(loader);
      assert(f.root.open); assert.equal(f.scripts().length, 1);
      f.finishScript(); f.finishScript(); assert(!f.playing);
      if (anchor !== scene.id) assert(f.d.getElementById(anchor).closest('details').open);
    });
  }
  test(`${label}: failed transport and failed scene each preserve fallback and can retry`, t => {
    const f = fixture(t, name); f.w.eval(loader); f.open();
    f.scripts()[0].dispatchEvent(new f.w.Event('error'));
    assert.equal(f.scripts().length, 0); assert.match(f.$('[data-load-status]').textContent, /could not load/);
    assert(f.$('[data-controls]').hidden);
    f.shut(); f.open(); f.finishScript();
    f.scripts().at(-1).dispatchEvent(new f.w.Event('error'));
    assert.equal(f.scripts().length, 1); assert(f.$('[data-controls]').hidden);
    f.shut(); f.open(); f.finishScript(); assert.equal(f.root.dataset.ready, 'true');
  });
  test(`${label}: malformed script load is not reported as ready`, t => {
    const f = fixture(t, name); f.w.eval(loader); f.open(); f.finishScript();
    f.scripts().at(-1).dispatchEvent(new f.w.Event('load'));
    assert(!f.root.dataset.ready); assert.match(f.$('[data-load-status]').textContent, /could not load/);
  });
  test(`${label}: 1.5x default, fractional pause, changed speed, replay, and idempotent setup`, t => {
    const f = fixture(t, name); f.load(); f.load(); f.open();
    assert.equal(f.$('[data-speed]').value, '1.5'); f.play(); assert.equal(f.frames.size, 1);
    f.tick(1100, false); f.play(); close(f.time, 1.65); assert.equal(f.frames.size, 0);
    f.play(); f.tick(1000); close(f.time, 3.15); f.speed(2); f.tick(1000); close(f.time, 5.15);
    f.tick((duration + 5) * 1000); assert.equal(f.time, duration); assert(!f.playing);
    assert.equal(f.$('[data-action=play]').getAttribute('aria-label'), 'Replay');
    f.play(); assert.equal(f.time, 0); assert(f.playing);
  });
  test(`${label}: scrubbing is deterministic and stops playback`, t => {
    const f = fixture(t, name); f.load(); f.open();
    const sceneMarkup = () => canonicalMarkup(f.$('[data-pane]').innerHTML.replace(/aria-valuetext="[^"]*"/g, ''));
    f.seek(at(24.375)); const first = sceneMarkup();
    f.play(); f.tick(3000); f.seek(at(5)); f.seek(at(24.375));
    assert.equal(sceneMarkup(), first); assert(!f.playing); assert.equal(f.frames.size, 0);
  });
  test(`${label}: pane keyboard and native control keys remain separate`, t => {
    const f = fixture(t, name); f.load(); f.open();
    // One Right lands on the first declared beat after zero, whatever that scene calls it.
    f.key('ArrowRight'); assert.equal(f.time, beats[1]);
    f.key('End'); assert.equal(f.time, duration); f.key('Home'); assert.equal(f.time, 0);
    f.key(' '); assert(f.playing); f.key('Escape'); assert(!f.playing);
    f.key('End', f.$('[data-speed]')); assert.equal(f.time, 0);
    f.key(' ', f.$('[data-action=play]')); assert(!f.playing);
  });
  test(`${label}: close, hidden tab, and page exit pause the clock`, t => {
    const f = fixture(t, name); f.load(); f.open(); f.play(); f.tick(1000); f.shut(); assert(!f.playing);
    f.open(); assert(!f.playing); f.play(); f.hide(); assert(!f.playing);
    f.root.dispatchEvent(new f.w.Event('toggle')); assert.equal(f.frames.size, 0);
    f.w.dispatchEvent(new f.w.Event('pagehide')); assert.equal(f.frames.size, 0);
  });
  test(`${label}: expanded view moves the same pane, retains time, and exits paused`, t => {
    const f = fixture(t, name); f.load(); f.open(); f.seek(at(12.5));
    const pane = f.$('[data-pane]'); f.$('[data-action=fullscreen]').click();
    assert(f.$('dialog').open); assert.equal(pane.parentElement, f.$('dialog'));
    f.play(); f.tick(1000); f.$('[data-action=fullscreen]').click();
    assert(!f.$('dialog').open); assert(!f.playing); close(f.time, at(12.5) + 1.5);
    assert.equal(pane, f.$('[data-pane]')); assert.notEqual(pane.parentElement, f.$('dialog'));
  });
  test(`${label}: native fullscreen exits paused; denied fullscreen is recoverable`, async t => {
    const f = fixture(t, name, {nativeFullscreen:true}); f.load(); f.open();
    f.$('[data-action=fullscreen]').click(); assert.equal(f.d.fullscreenElement, f.$('[data-pane]'));
    f.play(); await f.d.exitFullscreen(); assert(!f.playing);
    const denied = fixture(t, name, {nativeFullscreen:'reject'}); denied.load(); denied.open();
    denied.$('[data-action=fullscreen]').click(); await new Promise(resolve => setImmediate(resolve));
    assert.match(denied.$('[data-notice]').textContent, /unavailable/); denied.play(); assert(denied.playing);
  });
  test(`${label}: resizing and reduced motion never start the paused clock`, t => {
    const f = fixture(t, name); f.load(); f.open(); f.seek(at(25.1));
    f.resize(280); f.reduce(); assert.equal(f.time, at(25.1)); assert(!f.playing); assert.equal(f.frames.size, 0);
    assert.equal(f.root.querySelectorAll('[data-action]').length, 2);
  });
  test(`${label}: play and fullscreen expose no pressed state, only data-state`, t => {
    const f = fixture(t, name); f.load(); f.open();
    const controls = f.$('[data-controls]'), play = f.$('[data-action=play]');
    assert.equal(controls.querySelectorAll('[aria-pressed]').length, 0,
      'buttons whose accessible name changes are actions, not toggles');
    assert.equal(play.dataset.state, 'play');
    f.play(); assert.equal(play.dataset.state, 'pause');
    f.play(); assert.equal(play.dataset.state, 'play');
    f.seek(duration); assert.equal(play.dataset.state, 'replay');
    assert.equal(controls.querySelectorAll('[aria-pressed]').length, 0);
  });
  test(`${label}: fullscreen flips data-state to contract and back in both paths`, async t => {
    const f = fixture(t, name); f.load(); f.open();
    const button = f.$('[data-action=fullscreen]');
    assert.equal(button.dataset.state, 'expand');
    button.click();
    assert(f.$('dialog').open); assert.equal(button.dataset.state, 'contract');
    assert.equal(button.getAttribute('aria-pressed'), null);
    button.click();
    assert(!f.$('dialog').open); assert.equal(button.dataset.state, 'expand');
    const n = fixture(t, name, {nativeFullscreen: true}); n.load(); n.open();
    const native = n.$('[data-action=fullscreen]');
    assert.equal(native.dataset.state, 'expand');
    native.click(); await Promise.resolve();
    assert.equal(n.d.fullscreenElement, n.$('[data-pane]'));
    assert.equal(native.dataset.state, 'contract');
    native.click(); await Promise.resolve();
    assert.equal(n.d.fullscreenElement, null);
    assert.equal(native.dataset.state, 'expand');
    assert.equal(native.getAttribute('aria-pressed'), null);
  });
  test(`${label}: one declared duration fills the scrubber range, the clock, and the readout`, t => {
    const f = fixture(t, name); f.load();
    const range = f.$('[data-controls] input[type=range]');
    assert.equal(f.root.dataset.duration, String(duration));
    assert.equal(range.max, f.root.dataset.duration);
    assert.equal(f.$('[data-controls] [data-duration]').textContent, ` / ${clockText(duration)}`);
    assert.equal(f.$('[data-elapsed]').textContent, clockText(0));
    f.seek(duration);
    assert.match(range.getAttribute('aria-valuetext'),
      new RegExp(`^${clockText(duration)} of ${clockText(duration)}\\. `));
  });
  test(`${label}: arrow keys visit exactly the declared beats, then the duration`, t => {
    const f = fixture(t, name); f.load(); f.open();
    const declared = f.$('[data-pane]').dataset.beats.trim().split(/\s+/).map(Number);
    assert.deepEqual(declared, beats);
    assert.deepEqual(declared, [...declared].sort((a, b) => a - b), 'beats are declared in ascending order');
    const forward = [];
    for (let i = 0; i <= declared.length; i++) { f.key('ArrowRight'); forward.push(f.time); }
    assert.deepEqual(forward, [...declared.slice(1), duration, duration], 'Right stops on each beat, then the duration');
    const backward = [];
    for (let i = 0; i <= declared.length; i++) { f.key('ArrowLeft'); backward.push(f.time); }
    assert.deepEqual(backward, [...declared].reverse().concat(0), 'Left retraces the same beats to zero');
    assert(!f.playing); assert.equal(f.frames.size, 0);
  });
  test(`${label}: every declared beat is a boundary the drawing actually crosses`, t => {
    const f = fixture(t, name); f.load(); f.open();
    for (const beat of beats) {
      f.seek(beat);
      assert(f.root.dataset[stageKey] !== undefined && f.root.dataset[stageKey] !== '',
        `${label} publishes no data-${stageKey} at ${beat}s, so no test can name its stage`);
      if (beat === 0) continue;
      const before = (f.seek(Math.max(0, beat - 0.01)), drawnMarkup(f));
      const on = (f.seek(beat), drawnMarkup(f));
      assert.notEqual(on, before, `${label} draws the same thing either side of the beat at ${beat}s`);
    }
  });
  test(`${label}: reduced motion holds each beat instead of moving between them`, t => {
    const f = fixture(t, name, {reduced: true}); f.load(); f.open();
    for (const beat of beats) {
      const on = (f.seek(beat), drawnMarkup(f));
      const after = (f.seek(Math.min(duration, beat + 0.01)), drawnMarkup(f));
      assert.equal(after, on, `${label} keeps moving just after the beat at ${beat}s under reduced motion`);
    }
    assert(!f.playing); assert.equal(f.frames.size, 0);
  });
  test(`${label}: the caption live region is written once per change, not once per frame`, t => {
    const f = fixture(t, name); f.load(); f.open();
    const caption = f.$('[data-caption]');
    const observer = new f.w.MutationObserver(() => {});
    observer.observe(caption, {childList: true, characterData: true, subtree: true});
    const texts = [caption.textContent];
    f.play();
    // 100 delivered frames at the 1.5x default: fifteen seconds of content, crossing
    // several caption boundaries and several beat boundaries inside one caption.
    for (let n = 0; n < 100; n++) {
      f.tick(100);
      if (caption.textContent !== texts.at(-1)) texts.push(caption.textContent);
    }
    close(f.time, 15);
    const records = observer.takeRecords();
    observer.disconnect();
    assert(texts.length > 2, 'the window must cross more than one caption');
    assert.equal(records.length, texts.length - 1,
      'a polite region must mutate only when the sentence changes');
  });
  test(`${label}: the scrubber names the state without repeating the live caption`, t => {
    const f = fixture(t, name); f.load(); f.open();
    const caption = f.$('[data-caption]'), range = f.$('[data-controls] input[type=range]');
    for (const beat of [...beats, duration]) {
      for (const time of [beat, Math.min(duration, beat + 0.5)]) {
        f.seek(time);
        const spoken = caption.textContent.trim(), valuetext = range.getAttribute('aria-valuetext');
        assert(spoken.length > 0, `${label} has no caption at ${time}s`);
        assert.match(valuetext, /^\d+:\d\d of \d+:\d\d\. \S/, `${label} at ${time}s must still describe the state`);
        assert(!valuetext.includes(spoken),
          `${label} at ${time}s announces the caption twice:\n  caption   ${spoken}\n  valuetext ${valuetext}`);
      }
    }
  });
}

// The strict form of "reduced-motion discrete reveals at beat boundaries": walk the WHOLE
// reduced timeline and require exactly one drawn state per beat interval, not merely the
// same state at `beat` and `beat + 0.01`. A scene that quantises a continuous quantity
// into several stops inside one beat satisfies the sampled check in registerTransportTests
// and fails this one, which is the difference the plan's hard rule is about.
//
// It is opt-in rather than part of registerTransportTests because the two players shipped
// before this harness existed — kernel-weighting and bert-ledger — do not hold their beats
// (measured: kernel beats 5/6/7 render 11/17/7 distinct states, BERT beats 2-7 render
// 4/4/4/2/2/2). Making them hold is a change to two already-reviewed scenes, so it is the
// author's call, not a side effect of a test helper. Every scene written against
// interactives/_template calls this.
function registerBeatHoldTest(name, options = {}) {
  const scene = entry(name);
  configure(name, options);
  const label = scene.scene, duration = scene.duration, beats = scene.beats;
  const step = options.step || 0.05;
  test(`${label}: reduced motion holds exactly one state across every whole beat`, t => {
    const f = fixture(t, name, {reduced: true}); f.load(); f.open();
    for (let index = 0; index < beats.length; index++) {
      const start = beats[index];
      const end = index + 1 < beats.length ? beats[index + 1] : duration;
      const states = new Map();
      for (let time = start; time < end - 1e-9; time += step) {
        const at = Number(time.toFixed(4));
        f.seek(at);
        if (!states.has(drawnMarkup(f))) states.set(drawnMarkup(f), at);
      }
      assert.equal(states.size, 1,
        `${label} renders ${states.size} states inside the beat [${start}, ${end}) under `
        + `reduced motion, first seen at ${[...states.values()].join('s, ')}s`);
    }
    // The end of the timeline is a state a reader can rest on too.
    const last = (f.seek(duration), drawnMarkup(f));
    f.seek(Math.max(0, duration - step));
    assert.equal(drawnMarkup(f), last, `${label} still moves at the end of the timeline`);
    assert(!f.playing); assert.equal(f.frames.size, 0);
  });
}

// The stage strip is optional: [] when a panel has none. Only the pre-grammar scenes'
// own suites read it; nothing generic does.
const stageLabels = f => [...f.root.querySelectorAll('.mechanism-stages span')].map(node => node.textContent.trim());

// The visual grammar every scene written from interactives/_template follows
// (docs/animation-authoring.md, "Visual grammar"): one picture, one typeset formula
// line, one caption, no strip and no cards; TeX in eq- wrappers that playback never
// rewrites; one guarded typeset call after mount; captions within the text budget and
// held long enough to read; a static fallback that is the final frame. Opt-in, like
// registerBeatHoldTest, and for the same reason: convolution, kernel-weighting and
// bert-ledger predate the grammar, and retrofitting them is the author's call. JSDOM
// never typesets, so these check the TeX source, the ids, the \class{} names and the
// state the player publishes — never rendered math. Options:
//   words   caption word budget; default 20.
//   hold    seconds a caption must stand before the next replaces it; default 2.
function registerGrammarTests(name, options = {}) {
  const scene = entry(name);
  configure(name, options);
  const label = scene.scene, duration = scene.duration, beats = scene.beats;
  const budget = options.words || 20, hold = options.hold === undefined ? 2 : options.hold;
  const settle = () => new Promise(resolve => setImmediate(resolve));
  // The control bar carries icon SVGs; the picture is the SVG that is not one of them.
  const pictures = f => [...f.$('[data-pane]').querySelectorAll('svg')].filter(node => !node.closest('[data-controls]'));
  const midpoints = beats.map((beat, index) => (beat + (index + 1 < beats.length ? beats[index + 1] : duration)) / 2);
  const probes = [...new Set([...beats, ...midpoints, duration])].sort((a, b) => a - b);
  // What the formula publishes, TeX removed: the classes on its wrapper, the classes on
  // the root, and any data-formula* the player writes — every way a scene may animate a
  // formula by state rather than by rewriting its source.
  const formulaState = f => {
    const wrapper = f.$('[data-formula]').cloneNode(true);
    wrapper.querySelectorAll('span[id^="eq-"]').forEach(span => { span.textContent = ''; });
    const published = Object.entries(f.root.dataset).filter(([key]) => key.startsWith('formula'));
    return `${canonicalMarkup(wrapper.outerHTML)}|${f.root.className}|${JSON.stringify(published)}`;
  };
  const source = f => f.formulas().map(span => span.textContent);

  test(`${label}: the pane is one picture, one formula line and one caption`, t => {
    const f = fixture(t, name);
    const picture = pictures(f);
    assert.equal(picture.length, 1, 'one inline SVG is the whole picture');
    assert(picture[0].querySelector('title'), 'the picture names itself with an SVG title');
    assert(picture[0].querySelector('[data-drawing]'), 'the picture is drawn inside [data-drawing]');
    assert.equal(f.root.querySelectorAll('[data-pane] [data-formula]').length, 1, 'one formula line');
    assert.equal(f.root.querySelectorAll('[data-pane] [data-caption]').length, 1, 'one caption line');
    assert.equal(f.root.querySelectorAll('[data-pane] .mechanism-stages').length, 0, 'no stage strip');
    assert.equal(f.root.querySelectorAll('[data-pane] table, [data-pane] dl').length, 0,
      'no side tables, no readout cards: a number sits on the picture beside its mark');
  });
  test(`${label}: formulas are TeX in eq- wrappers whose \\class names player.css styles`, t => {
    const f = fixture(t, name);
    const spans = f.formulas();
    assert(spans.length > 0, 'the panel holds at least one eq- span');
    assert.equal(new Set(spans.map(span => span.id)).size, spans.length, 'eq- ids are unique');
    const css = read(`${scene.scene}/player.css`);
    for (const span of spans) {
      assert.match(span.id, new RegExp(`^eq-${scene.scene}-`), `${span.id} is prefixed eq-${scene.scene}-`);
      assert(span.closest('[data-formula]') || span.closest('svg'), `${span.id} sits in the formula line or on the picture`);
      const tex = span.textContent.trim();
      assert.match(tex, /^(\\\(|\\\[)[\s\S]+(\\\)|\\\])$/, `${span.id} wraps TeX in \\( \\) or \\[ \\]`);
      assert.equal(span.querySelectorAll('sub, sup, code').length, 0, `${span.id} is TeX, not HTML markup`);
      for (const [, cls] of tex.matchAll(/\\class\{([^}]*)\}/g)) {
        assert.match(cls, /^[A-Za-z_][\w-]*$/, `\\class{${cls}} in ${span.id} is one CSS class name`);
        assert(css.includes(`.${cls}`), `player.css styles .${cls}, so toggling it changes something`);
      }
    }
    // Caption and picture text are prose and labels; caret-and-parenthesis math is not.
    const prose = [f.$('[data-caption]').textContent,
      ...[...pictures(f)[0].querySelectorAll('text')].map(node => node.textContent)];
    for (const text of prose) assert.doesNotMatch(text, /\^\(|\be\^\w|\bexp\(/, `ASCII math in "${text}"`);
  });
  test(`${label}: playback animates the formula by state and never rewrites its TeX`, t => {
    const f = fixture(t, name); f.load(); f.open();
    const before = source(f), states = new Set();
    assert(before.length > 0, 'the panel holds at least one eq- span to keep unchanged');
    for (const time of probes) {
      f.seek(time); states.add(formulaState(f));
      assert.deepEqual(source(f), before, `TeX rewritten by ${time}s`);
    }
    assert(states.size > 1, 'the formula changes state at least once across the timeline');
  });
  test(`${label}: one guarded typeset call after mount; none when the page already typeset`, async t => {
    const absent = fixture(t, name); absent.load(); absent.open(); await settle();
    assert.equal(absent.root.dataset.ready, 'true');
    assert.equal(absent.root.dataset.typeset, 'none', 'without MathJax the panel says so');
    const stub = fixture(t, name, {mathjax: 'stub'}); stub.load(); stub.open(); await settle();
    assert.equal(stub.typesets.length, 1, 'exactly one typesetPromise call');
    assert(stub.typesets[0].some(node => node === stub.root || stub.root.contains(node)), 'the one call covers this panel');
    assert.equal(stub.root.dataset.typeset, 'mathjax');
    const typeset = fixture(t, name, {mathjax: 'typeset'}); typeset.load(); typeset.open(); await settle();
    assert.equal(typeset.typesets.length, 0, 'a panel the lazy typesetter already finished is not typeset again');
    assert.equal(typeset.root.dataset.typeset, 'mathjax');
    const rejected = fixture(t, name, {mathjax: 'reject'}); rejected.load(); rejected.open(); await settle();
    assert.equal(rejected.root.dataset.ready, 'true', 'a failed typeset does not take the player down');
    assert.equal(rejected.root.dataset.typeset, 'none');
    assert.deepEqual(source(rejected), source(absent), 'the TeX source survives a failed typeset');
  });
  test(`${label}: every caption is within the word budget and stands long enough to read`, t => {
    const f = fixture(t, name); f.load(); f.open();
    const caption = () => f.$('[data-caption]').textContent.trim();
    for (const time of probes) {
      f.seek(time);
      const words = caption().split(/\s+/).filter(Boolean);
      assert(words.length > 0 && words.length <= budget,
        `${label} caption at ${time}s has ${words.length} words: "${caption()}"`);
    }
    // Walk the clock: each caption but the last must stand for `hold` seconds before the
    // next replaces it. A reveal holds; nothing flashes.
    const runs = [];
    for (let time = 0; time <= duration + 1e-9; time += 0.05) {
      const at = Number(time.toFixed(4));
      f.seek(at);
      if (!runs.length || runs.at(-1).text !== caption()) runs.push({text: caption(), start: at});
    }
    for (let index = 0; index + 1 < runs.length; index++) {
      const stood = runs[index + 1].start - runs[index].start;
      assert(stood + 1e-9 >= hold,
        `${label} caption "${runs[index].text}" stands only ${stood.toFixed(2)}s from ${runs[index].start}s`);
    }
  });
  test(`${label}: the static fallback is the final frame, carrying every witness value`, t => {
    const f = fixture(t, name);
    const values = [...f.root.querySelectorAll('[data-pane] [data-value]')];
    assert(values.length > 0, 'the picture writes at least one [data-value] number');
    const printed = values.map(node => node.textContent.trim());
    assert(printed.every(text => text && text !== '·'), `the static fallback withholds nothing: ${printed.join(', ')}`);
    const last = f.$('[data-caption]').textContent.trim();
    assert(last, 'the static caption is present');
    f.load(); f.open(); f.seek(duration);
    assert.deepEqual(values.map(node => node.textContent.trim()), printed, 'the t = duration render prints the static values');
    assert.equal(f.$('[data-caption]').textContent.trim(), last, 'the static caption is the last caption');
  });
}

module.exports = {
  ROOT, read, shared, loader, manifest, entry, chapterSource,
  numbers, clockText, close, canonicalMarkup, drawnMarkup, stageLabels,
  configure, fixture, registerTransportTests, registerBeatHoldTest, registerGrammarTests
};
