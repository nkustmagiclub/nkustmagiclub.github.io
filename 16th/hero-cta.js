/* Keep the sticky registration link out of the opening screen. */
(() => {
  'use strict';
  const header = document.querySelector('.site-header');
  const headerLink = document.querySelector('.header-registration');
  const mainLink = document.getElementById('hero-registration');
  if (!header || !headerLink || !mainLink) return;

  let scheduled = false;
  const update = () => {
    scheduled = false;
    const passed = mainLink.getBoundingClientRect().bottom <= header.getBoundingClientRect().bottom;
    headerLink.classList.toggle('is-visible', passed);
    headerLink.toggleAttribute('inert', !passed);
    if (passed) headerLink.removeAttribute('aria-hidden');
    else headerLink.setAttribute('aria-hidden', 'true');
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  update();
})();
