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
  window.matchMedia('(min-width: 1101px)').addEventListener('change', event => {
    if (event.matches) closeMenu();
  });

  // One deliberate downward gesture leaves the opening scene for the story.
  const header = document.querySelector('.site-header');
  const story = document.getElementById('story');
  let transitionFrame = 0;
  let transitioning = false;
  let gestureUntil = 0;
  let lastWheelTime = 0;
  let wheelDistance = 0;
  let touch = null;
  const inOpening = () => menu.hidden && window.scrollY < hero.offsetTop + hero.offsetHeight - header.offsetHeight - 2;
  const storyTop = () => Math.max(0, story.offsetTop - header.offsetHeight - 16);
  function stopTransition() {
    window.cancelAnimationFrame(transitionFrame);
    transitionFrame = 0;
    transitioning = false;
    gestureUntil = 0;
    wheelDistance = 0;
    touch = null;
  }
  function enterStory() {
    const target = storyTop();
    const start = window.scrollY;
    const started = performance.now();
    wheelDistance = 0;
    gestureUntil = started + 800;
    if (reduceMotion.matches) {
      window.scrollTo({ top: target, behavior: 'instant' });
      return;
    }
    transitioning = true;
    function step(time) {
      const progress = Math.min(1, (time - started) / 600);
      const eased = 1 - Math.pow(1 - progress, 3);
      window.scrollTo({ top: start + (target - start) * eased, behavior: 'instant' });
      if (progress < 1) transitionFrame = window.requestAnimationFrame(step);
      else {
        transitionFrame = 0;
        transitioning = false;
        gestureUntil = performance.now() + 180;
      }
    }
    transitionFrame = window.requestAnimationFrame(step);
  }
  window.addEventListener('wheel', event => {
    if (!event.cancelable || event.ctrlKey || event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if (event.deltaY < 0) { stopTransition(); return; }
    if (event.deltaY === 0 || !menu.hidden) return;
    const now = performance.now();
    // Consume the remaining trackpad momentum instead of skipping past the story.
    if (transitioning || now < gestureUntil) {
      event.preventDefault();
      gestureUntil = now + 180;
      return;
    }
    if (!inOpening()) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    const delta = event.deltaY * unit;
    wheelDistance = now - lastWheelTime > 160 ? delta : wheelDistance + delta;
    lastWheelTime = now;
    if (wheelDistance >= 12) enterStory();
  }, { passive: false });
  window.addEventListener('touchstart', event => {
    stopTransition();
    if (inOpening() && event.touches.length === 1) {
      touch = { x: event.touches[0].clientX, y: event.touches[0].clientY, active: false };
    }
  }, { passive: true });
  window.addEventListener('touchmove', event => {
    if (!touch || event.touches.length !== 1 || !menu.hidden) return;
    const finger = event.touches[0];
    const delta = touch.y - finger.clientY;
    const horizontal = Math.abs(touch.x - finger.clientX);
    if (!touch.active && horizontal > Math.abs(delta) && horizontal > 12) {
      touch = null;
      return;
    }
    if (!event.cancelable || (!touch.active && delta <= 0)) return;
    event.preventDefault();
    if (!touch.active && delta >= 32) {
      touch.active = true;
      enterStory();
    }
  }, { passive: false });
  window.addEventListener('touchend', () => { touch = null; }, { passive: true });
  window.addEventListener('touchcancel', stopTransition, { passive: true });
  window.addEventListener('pointerdown', stopTransition, { passive: true });
  window.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if (event.target.closest('a,button,input,textarea,select,[contenteditable="true"]')) return;
    if (['ArrowDown', 'PageDown', ' '].includes(event.key) && (inOpening() || transitioning)) {
      event.preventDefault();
      if (!transitioning && performance.now() >= gestureUntil) enterStory();
    } else if (['ArrowUp', 'PageUp', 'Home', 'End', 'Escape'].includes(event.key)) stopTransition();
  });
  window.addEventListener('resize', stopTransition);
  reduceMotion.addEventListener('change', stopTransition);

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
