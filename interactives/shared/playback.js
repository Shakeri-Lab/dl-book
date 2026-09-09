// Transport extracted from the approved convolution player; no scene framework.
(() => {
  if (window.BookPlayback) return;
  window.BookPlayback = function mount(root, render, layout = () => {}) {
    if (root.dataset.ready) return;
    const $ = selector => root.querySelector(selector);
    const pane = $('[data-pane]'), play = $('[data-action="play"]');
    const range = $('input[type="range"]'), rate = $('[data-speed]');
    const fullscreen = $('[data-action="fullscreen"]'), dialog = $('dialog');
    const notice = $('[data-notice]');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const duration = Number(range.max), step = 2.5;
    let time = 0, speed = Number(rate.value), playing = false, frame = null;
    let anchorTime = 0, anchorClock = 0;
    const clock = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
    const label = (button, text) => {
      button.setAttribute('aria-label', text);
      button.title = text;
      button.querySelector('[data-button-label]').textContent = text;
    };
    function advance(now) {
      time = Math.min(duration, anchorTime + Math.max(0, now - anchorClock) * speed / 1000);
    }
    function draw() {
      const description = render(time, motion.matches);
      range.value = String(time);
      range.setAttribute('aria-valuetext', `${clock(time)} of ${clock(duration)}. ${description}`);
      $('[data-elapsed]').textContent = clock(time);
      root.dataset.time = String(time);
      root.dataset.playing = String(playing);
      label(play, playing ? 'Pause' : time === duration ? 'Replay' : 'Play');
      play.dataset.state = playing ? 'pause' : time === duration ? 'replay' : 'play';
      play.setAttribute('aria-pressed', String(playing));
    }
    function stop() {
      if (playing) advance(performance.now());
      playing = false;
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      draw();
    }
    function tick(now) {
      frame = null;
      if (!playing) return;
      advance(now);
      if (time >= duration) playing = false;
      draw();
      if (playing) frame = requestAnimationFrame(tick);
    }
    function start() {
      if (playing || !root.open || document.hidden) return;
      if (time >= duration) time = 0;
      playing = true;
      anchorTime = time; anchorClock = performance.now();
      draw();
      frame = requestAnimationFrame(tick);
    }
    function seek(value) {
      stop();
      time = Math.max(0, Math.min(duration, Number.isFinite(value) ? value : 0));
      draw();
    }
    const toggle = () => playing ? stop() : start();
    play.addEventListener('click', toggle);
    range.addEventListener('input', () => seek(Number(range.value)));
    rate.addEventListener('change', () => {
      if (playing) advance(performance.now());
      anchorTime = time; anchorClock = performance.now();
      speed = [0.5, 1, 1.5, 2].includes(Number(rate.value)) ? Number(rate.value) : 1;
      rate.value = String(speed);
      if (time >= duration) stop(); else draw();
    });
    const native = typeof pane.requestFullscreen === 'function' && document.fullscreenEnabled !== false;
    label(fullscreen, native ? 'Fullscreen' : 'Expand');
    fullscreen.addEventListener('click', async () => {
      notice.textContent = '';
      try {
        if (dialog.open) dialog.close();
        else if (document.fullscreenElement === pane) await document.exitFullscreen();
        else if (native) await pane.requestFullscreen();
        else {
          dialog.append(pane);
          pane.classList.add('is-expanded');
          try { dialog.showModal(); }
          catch (error) { dialog.before(pane); pane.classList.remove('is-expanded'); throw error; }
          label(fullscreen, 'Exit expanded view');
          fullscreen.setAttribute('aria-pressed', 'true');
          layout();
        }
      } catch (_) {
        notice.textContent = 'Fullscreen is unavailable here. The diagram still works on the page.';
      }
    });
    dialog.addEventListener('close', () => {
      stop(); dialog.before(pane); pane.classList.remove('is-expanded');
      label(fullscreen, native ? 'Fullscreen' : 'Expand');
      fullscreen.setAttribute('aria-pressed', 'false');
      layout();
      if (root.open) fullscreen.focus();
    });
    dialog.addEventListener('cancel', stop);
    let wasFullscreen = false;
    document.addEventListener('fullscreenchange', () => {
      const active = document.fullscreenElement === pane;
      label(fullscreen, active ? 'Exit fullscreen' : native ? 'Fullscreen' : 'Expand');
      fullscreen.setAttribute('aria-pressed', String(active));
      if (wasFullscreen && !active) stop();
      wasFullscreen = active; layout();
    });
    root.addEventListener('toggle', () => {
      if (!root.open) {
        stop();
        if (dialog.open) dialog.close();
        if (document.fullscreenElement === pane) document.exitFullscreen().catch(() => {});
      }
      layout();
    });
    root.addEventListener('keydown', event => { if (event.key === 'Escape') stop(); });
    pane.addEventListener('keydown', event => {
      if (event.target !== pane || event.altKey || event.ctrlKey || event.metaKey) return;
      if (![' ', 'k', 'K', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      if (event.repeat && [' ', 'k', 'K'].includes(event.key)) return;
      if ([' ', 'k', 'K'].includes(event.key)) toggle();
      else seek(event.key === 'Home' ? 0 : event.key === 'End' ? duration
        : time + (event.key === 'ArrowLeft' ? -step : step));
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
    window.addEventListener('pagehide', stop);
    motion.addEventListener('change', draw);
    window.addEventListener('resize', layout);
    if (typeof ResizeObserver === 'function') new ResizeObserver(layout).observe(pane);
    // Render the first state before exposing controls. Nothing autoplays.
    draw();
    $('[data-controls]').hidden = false;
    root.dataset.ready = 'true';
  };
})();
