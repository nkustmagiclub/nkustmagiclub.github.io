/* Keep existing inbound section links useful on the public event edition. */
(() => {
  'use strict';
  const aliases = { '#tickets': '#information' };
  const target = aliases[window.location.hash];
  if (target) {
    document.querySelector(target)?.scrollIntoView({ block: 'start' });
  }
})();
