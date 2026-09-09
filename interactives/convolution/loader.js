(() => {
  const root = document.getElementById('convolution-excerpt');
  if (!root || root.dataset.loader) return;
  root.dataset.loader = 'ready';
  let loading = false;
  function load() {
    if (!root.open || loading || root.dataset.ready) return;
    loading = true;
    const status = root.querySelector('.conv-excerpt__loading');
    status.textContent = 'Loading animation controls…';
    const script = document.createElement('script');
    script.src = root.dataset.player;
    script.onload = () => { status.textContent = ''; };
    script.onerror = () => {
      loading = false;
      script.remove();
      status.textContent = 'The player could not load. Read the static calculation and walkthrough below, or close and reopen to retry.';
    };
    document.head.append(script);
  }
  root.addEventListener('toggle', load);
  function openTarget() {
    if (location.hash === '#convolution-excerpt') { root.open = true; load(); }
  }
  window.addEventListener('hashchange', openTarget);
  openTarget();
})();
