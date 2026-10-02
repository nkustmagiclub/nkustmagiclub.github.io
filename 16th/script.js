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

