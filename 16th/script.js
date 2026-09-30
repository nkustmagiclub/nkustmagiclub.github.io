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
  window.matchMedia('(min-width: 901px)').addEventListener('change', event => {
    if (event.matches) closeMenu();
  });
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
