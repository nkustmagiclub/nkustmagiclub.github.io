(() => {
  'use strict';
  const hero = document.querySelector('.hero');
  const button = document.getElementById('open-door');
  const reveal = document.getElementById('door-reveal');
  const status = document.getElementById('door-status');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let opened = false;

  button.addEventListener('click', () => {
    if (opened) return;
    opened = true;
    button.setAttribute('aria-expanded', 'true');
    reveal.hidden = false;
    hero.classList.add('is-open');
    status.textContent = '門已開啟，歡迎走進阿本洛特。';
    const destination = reveal.querySelector('a');
    // Leave the clicked control available until focus has moved into the reveal.
    window.setTimeout(() => {
      if (document.activeElement === button) destination.focus({ preventScroll: true });
      button.hidden = true;
    }, reduceMotion.matches ? 0 : 1500);
  });

  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('mobile-nav');
  function closeMenu(returnFocus = false) {
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', '開啟導覽選單');
    if (returnFocus) toggle.focus();
  }
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    menu.hidden = expanded;
    toggle.setAttribute('aria-expanded', String(!expanded));
    toggle.setAttribute('aria-label', expanded ? '開啟導覽選單' : '關閉導覽選單');
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !menu.hidden) closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header') && !menu.hidden) closeMenu();
  });
  window.matchMedia('(min-width: 1351px)').addEventListener('change', event => {
    if (event.matches) closeMenu();
  });

  // A light, easing resistance in the opening scene; the rest scrolls natively.
  let scrollFrame = 0;
  let scrollTarget = window.scrollY;
  let lastFrameTime = 0;
  let touch = null;
  const heroBoundary = () => Math.max(1, hero.offsetTop + hero.offsetHeight - document.querySelector('.site-header').offsetHeight);
  const canDamp = () => !reduceMotion.matches && menu.hidden && window.scrollY < heroBoundary();
  const resistance = () => .52 + .48 * Math.min(1, window.scrollY / heroBoundary());
  function stopScroll() {
    window.cancelAnimationFrame(scrollFrame);
    scrollFrame = 0;
    lastFrameTime = 0;
    scrollTarget = window.scrollY;
  }
  function easeScroll(time) {
    const elapsed = lastFrameTime ? Math.min(time - lastFrameTime, 40) : 16.7;
    lastFrameTime = time;
    const distance = scrollTarget - window.scrollY;
    if (Math.abs(distance) < 1.5) {
      window.scrollTo({ top: scrollTarget, behavior: 'instant' });
      stopScroll();
      return;
    }
    window.scrollTo({ top: window.scrollY + distance * (1 - Math.exp(-elapsed / 75)), behavior: 'instant' });
    scrollFrame = window.requestAnimationFrame(easeScroll);
  }
  function dampScroll(delta, factor = resistance()) {
    if (!scrollFrame) scrollTarget = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    scrollTarget = Math.max(0, Math.min(maxScroll, scrollTarget + delta * factor));
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(easeScroll);
  }
  window.addEventListener('wheel', event => {
    if (!canDamp() || event.ctrlKey || event.shiftKey || event.deltaY <= 0 || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.cancelable) {
      stopScroll();
      return;
    }
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    dampScroll(event.deltaY * unit);
  }, { passive: false });
  window.addEventListener('touchstart', event => {
    stopScroll();
    touch = canDamp() && event.touches.length === 1 ? {
      x: event.touches[0].clientX, y: event.touches[0].clientY,
      time: performance.now(), velocity: 0, active: false
    } : null;
  }, { passive: true });
  window.addEventListener('touchmove', event => {
    if (!touch || event.touches.length !== 1 || reduceMotion.matches || !menu.hidden) {
      touch = null;
      stopScroll();
      return;
    }
    const finger = event.touches[0];
    const delta = touch.y - finger.clientY;
    const horizontal = touch.x - finger.clientX;
    const now = performance.now();
    if (!touch.active && (delta <= 0 || Math.abs(horizontal) > Math.abs(delta))) {
      touch = null;
      return;
    }
    if (!event.cancelable) return;
    event.preventDefault();
    touch.active = true;
    touch.velocity = delta / Math.max(8, now - touch.time);
    touch.x = finger.clientX;
    touch.y = finger.clientY;
    touch.time = now;
    dampScroll(delta, delta > 0 ? resistance() : 1);
  }, { passive: false });
  window.addEventListener('touchend', () => {
    if (touch?.active && performance.now() - touch.time < 100) {
      dampScroll(Math.min(140, Math.max(0, touch.velocity) * 90));
    }
    touch = null;
  }, { passive: true });
  window.addEventListener('touchcancel', () => { touch = null; stopScroll(); }, { passive: true });
  window.addEventListener('pointerdown', stopScroll, { passive: true });
  window.addEventListener('keydown', stopScroll);
  window.addEventListener('resize', stopScroll);
  reduceMotion.addEventListener('change', () => { touch = null; stopScroll(); });

  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.desktop-nav a').forEach(link => {
          if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
    });
  }, { rootMargin: '-15% 0px -55% 0px' }) : null;
  document.querySelectorAll('main > section').forEach(section => observer?.observe(section));
  document.documentElement.classList.add('js-ready');
})();
