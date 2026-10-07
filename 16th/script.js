/* Retry the original image if a supported WebP source fails to load or decode. */
(() => {
  'use strict';
  document.querySelectorAll('picture > img').forEach((img) => {
    const picture = img.parentElement;
    const fallbackSrc = img.getAttribute('src');
    if (!fallbackSrc || !picture.querySelector('source[type="image/webp"]')) return;

    let retried = false;
    const restoreOriginal = () => {
      if (retried) return;
      retried = true;
      // A <picture> source keeps winning over img.src until its srcset is removed.
      picture.querySelectorAll('source').forEach((source) => source.removeAttribute('srcset'));
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
      img.src = fallbackSrc;
    };
    img.addEventListener('error', restoreOriginal, { once: true });
    // Eager images can fail before this deferred script runs.
    if (img.complete && img.naturalWidth === 0) restoreOriginal();
  });
})();

/* Door interaction from the full edition; event details stay immediately available. */
(() => {
  'use strict';
  const stage = document.getElementById('door-stage');
  const button = document.getElementById('open-door');
  const reveal = document.getElementById('door-reveal');
  const status = document.getElementById('door-status');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (stage && button && reveal) {
    let opened = false;
    stage.classList.add('is-ready');
    reveal.hidden = true;
    button.hidden = false;
    button.addEventListener('click', () => {
      if (opened) return;
      opened = true;
      button.setAttribute('aria-expanded', 'true');
      reveal.hidden = false;
      // Paint the revealed layer's starting state before opening the panels.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        stage.classList.add('is-open');
        if (status) status.textContent = '門已開啟，主海報與立即報名按鈕已顯示。';
        window.setTimeout(() => {
          stage.classList.add('is-entered');
          const destination = reveal.querySelector('.reveal-link');
          if (document.activeElement === button) destination?.focus({ preventScroll: true });
          button.hidden = true;
        }, reduceMotion.matches ? 0 : 1700);
      }));
    });
  }
  // Preserve the old registration anchor without forcing scrolling elsewhere.
  if (window.location.hash === '#tickets') {
    document.getElementById('information')?.scrollIntoView({ block: 'start' });
  }
})();

