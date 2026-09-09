(() => {
  document.querySelectorAll('.mechanism-excerpt[data-player]').forEach(root => {
    if (root.dataset.loader) return;
    root.dataset.loader = 'ready';
    let loading = false;
    const status = root.querySelector('[data-load-status]');
    function request(src, success) {
      const script = document.createElement('script');
      script.src = src;
      function fail() {
        script.remove(); loading = false;
        status.textContent = 'The player could not load. The static diagram and walkthrough remain available. Close and reopen to retry.';
      }
      script.onerror = fail;
      script.onload = () => { if (!success()) fail(); };
      document.head.append(script);
    }
    function loadScene() {
      request(root.dataset.player, () => {
        if (!root.dataset.ready) return false;
        status.textContent = ''; return true;
      });
    }
    function load() {
      if (!root.open || loading || root.dataset.ready) return;
      loading = true; status.textContent = 'Loading animation controls…';
      if (window.BookPlayback) loadScene();
      else request(root.dataset.playback, () => {
        if (!window.BookPlayback) return false;
        loadScene(); return true;
      });
    }
    root.addEventListener('toggle', load);
    function openTarget() {
      const id = location.hash.slice(1);
      const target = document.getElementById(id);
      if (target && (target === root || root.contains(target))) {
        root.open = true;
        let ancestor = target;
        while (ancestor && ancestor !== root) {
          if (ancestor.tagName === 'DETAILS') ancestor.open = true;
          ancestor = ancestor.parentElement;
        }
        load();
      }
    }
    window.addEventListener('hashchange', openTarget);
    openTarget();
  });
})();
