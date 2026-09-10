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
    // A link into the excerpt opens the excerpt: the root itself, or anything
    // nested inside it, opening every <details> on the way down to the target.
    const target = document.getElementById(location.hash.slice(1));
    if (!target || (target !== root && !root.contains(target))) return;
    root.open = true;
    let ancestor = target;
    while (ancestor && ancestor !== root) {
      if (ancestor.tagName === 'DETAILS') ancestor.open = true;
      ancestor = ancestor.parentElement;
    }
    load();
  }
  window.addEventListener('hashchange', openTarget);
  openTarget();
})();
