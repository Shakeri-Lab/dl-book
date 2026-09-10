// Scene skeleton. Copy to interactives/SCENE/player.js and replace the placeholders.
// Contract with interactives/shared/playback.js:
//   window.BookPlayback(root, render, layout?)
//   render(time, reduced) -> the aria description for the scrubber. It must be a pure
//     function of (time, reduced): scrubbing to a time reconstructs the same values,
//     focus and geometry whatever the playback history was. It must never measure the
//     DOM — the transport calls it on every animation frame — and it must set
//     root.dataset.stage, which is the shared handle the generic beat tests read.
//   layout() -> optional; the only place that measures, called on resize, fullscreen
//     and disclosure toggles.
//
// The pane is one picture, one formula, one caption (docs/animation-authoring.md,
// "Visual grammar"). The picture is built ONCE: the static SVG in panel.html is the
// final frame, this script takes a reference to every mark it will move, and render()
// only sets attributes on those references — a translate for "add a constant", a scale
// on the whole group for "multiply by a shared factor", a hidden attribute for "not yet
// revealed". Nothing is rebuilt with innerHTML per frame. The formula's TeX is never
// rewritten: render() toggles classes on the formula wrapper and the \class{…} spans
// MathJax produced take the highlight or the strike from player.css.
(() => {
  const root = document.getElementById('SCENE_ID');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  // The panel is the one in-repo mirror of the manuscript fixture
  // (chapters/partN/NN-….qmd:LINES). interactives/manifest.json names those literals and
  // scripts/audit_excerpt_fixtures.py keeps the chapter and this panel together, so
  // nothing below retypes a number the manuscript owns.
  const declared = name => root.dataset[name].trim().split(/\s+/).map(Number);
  const inputs = declared('inputs');
  const parameter = Number(root.dataset.parameter);
  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  const drawing = svg.querySelector('[data-drawing]');
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  // Beats are declared on the pane, so the timeline is stated once. Every beat is a
  // boundary the picture crosses: that is what lets the arrow keys land where the
  // mechanism changes. There is no stage strip to read names from — name the beats
  // here, in data-beats order, and keep the transcript's items in the same order.
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration = Number(pane.dataset.duration || beats.at(-1));
  const stageAt = time => beats.reduce((stage, beat, index) => (time >= beat ? index : stage), 0);
  const STAGES = ['Ask', '…', '…', '…', 'Hold'];
  // One caption per stage, at most twenty words, saying what is happening NOW. A caption
  // must not carry a moving number: the live number sits on the picture.
  const CAPTIONS = ['…?', '…', '…', '…', '…'];

  // --- The picture, built once ---------------------------------------------------
  // Every mark the player moves is looked up once, here, by its data-mark name. The
  // static SVG already draws the final frame, so these are references into markup that
  // exists without script; a missing mark is a panel bug and fails loudly at mount.
  const mark = name => {
    const node = svg.querySelector(`[data-mark="${name}"]`);
    if (!node) throw Error(`SCENE: panel.html draws no [data-mark="${name}"]`);
    return node;
  };
  const marks = {object: mark('object'), value: mark('object').querySelector('[data-value]'), ghost: mark('ghost')};
  // A mark the final frame does not show — a nudge in flight, a moving copy — is created
  // once too, appended to the drawing, and hidden until its beat. The shared stylesheet's
  // `.mechanism-excerpt [hidden] { display: none }` reaches SVG elements as well.
  const NS = 'http://www.w3.org/2000/svg';
  const make = (tag, attributes) => {
    const node = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
    return node;
  };
  marks.packet = drawing.appendChild(make('rect', {'data-mark': 'packet', x: 117, y: 250, width: 36, height: 0, class: 'SCENE-input'}));
  const show = (node, visible) => visible ? node.removeAttribute('hidden') : node.setAttribute('hidden', '');

  // Geometry: the one place a quantity becomes a coordinate. panel.html draws its
  // scenery in the same units, so the two agree by construction. Only the wide/narrow
  // choice depends on a measurement, and layout() is the only caller that measures.
  const GEOMETRY = {
    wide: {viewBox: '0 0 1100 340', baseline: 250, unit: 20, slot: index => 135 + 55 * index},
    narrow: {viewBox: '0 0 400 780', baseline: 250, unit: 20, slot: index => 90 + 70 * index}
  };
  let lastTime = 0, reduced = false, previousKey = '', mode = 'wide';

  // The only measurement in the file, called from layout() and once before mounting.
  function measure() {
    mode = (figure.getBoundingClientRect().width || 600) < 600 ? 'narrow' : 'wide';
  }

  function render(time, reducedMotion) {
    lastTime = time; reduced = reducedMotion;
    const stage = stageAt(time);
    // Reduced motion holds each beat's state instead of moving between them, so the
    // render at a beat and just after it is the same picture. Derive every continuous
    // quantity from `held`, never from `time`.
    const held = reducedMotion ? beats[stage] : time;
    const span = (beats[stage + 1] === undefined ? duration : beats[stage + 1]) - beats[stage];
    const fraction = span > 0 ? Math.max(0, Math.min(1, (held - beats[stage]) / span)) : 1;

    // …the scene's own arithmetic, computed from `inputs`, `parameter` and `fraction`.
    const shift = stage === 3 ? fraction * parameter : stage > 3 ? parameter : 0;
    const witness = inputs.reduce((total, value) => total + value, 0) * parameter;

    // Publish the state the tests read. dataset.stage is the shared handle; anything
    // else a scene-specific test needs goes beside it, as its own data-* attribute.
    root.dataset.stage = String(stage);
    root.dataset.witness = String(witness);

    // Redraw only when the picture actually changes, and only from cached geometry.
    const stateKey = `${stage}/${fraction.toFixed(4)}/${mode}`;
    if (stateKey !== previousKey) {
      previousKey = stateKey;
      const g = GEOMETRY[mode];
      svg.setAttribute('viewBox', g.viewBox);
      // Motion IS the mechanism. Adding a constant is a translation of the object…
      marks.object.setAttribute('transform', `translate(0 ${(-g.unit * shift).toFixed(2)})`);
      // …multiplying by a shared factor is the whole group scaling about the baseline.
      marks.packet.setAttribute('transform', `translate(0 ${g.baseline}) scale(1 ${(1 + fraction).toFixed(4)}) translate(0 ${-g.baseline})`);
      show(marks.packet, stage === 1);
      // Reveal, never fake: a quantity this stage has not reached is "·", not 0; a mark
      // the beat has not reached is absent, not drawn at zero.
      marks.value.textContent = stage >= 2 ? witness.toFixed(4) : '·';
      show(marks.ghost, stage >= 3);
      // The formula: classes on the wrapper only. The TeX never changes.
      formula.classList.toggle('is-shown', stage >= 1);
      formula.classList.toggle('is-part', stage >= 2);
      formula.classList.toggle('is-struck', stage >= 4);
    }

    // A polite live region must be written only when it changes; render() runs every frame.
    const sentence = CAPTIONS[stage];
    if (caption.textContent !== sentence) caption.textContent = sentence;

    // Scrubber-only wording: the caption sentence is already spoken by the live region,
    // so aria-valuetext names the stage and the witness instead of repeating it.
    return `${STAGES[stage]}. …${stage >= 2 ? ` ${witness.toFixed(4)}.` : ''}`;
  }

  // One typeset call after mount, guarded. MathJax's lazyAlwaysTypeset list already
  // covers span[id^="eq-"], so on the book page the formula is normally typeset before
  // this runs and the call is skipped; it is here for a page that opened the disclosure
  // before MathJax finished. Without MathJax the TeX source stays readable — the no-JS
  // behaviour everywhere in the book — and data-typeset says which happened.
  function typeset() {
    const done = () => { root.dataset.typeset = root.querySelector('mjx-container') ? 'mathjax' : 'none'; };
    const mathjax = window.MathJax;
    if (mathjax && typeof mathjax.typesetPromise === 'function' && !root.querySelector('mjx-container')) {
      mathjax.typesetPromise([root]).then(done, done);
    } else done();
  }

  measure();
  window.BookPlayback(root, render, () => { measure(); previousKey = ''; render(lastTime, reduced); });
  typeset();
})();
