(function () {
  'use strict';

  /* ============================ НАСТРОЙКИ ============================ */
  const CUSTOM_CURSOR = true; // курсор-семечко
  const RIPPLE_ENABLED = true; // круги от нажатия
  const RIPPLE_MAX_RADIUS_PX = 46;
  const RIPPLE_MS = 550;
  const HIDE_HINT_AFTER_FIRST_SOW = true; // убрать надпись после первого нажатия
  // где нажатие игнорируется (поля ввода и меню шапки)
  const IGNORE_SELECTOR =
    'input, textarea, select, .nav, .burger, .logo, .place-switch, .icon-btn, .avatar';
  const RESPECT_REDUCED_MOTION = true;
  /* ================================================================== */

  const hint = document.getElementById('sowHint');

  if (
    RESPECT_REDUCED_MOTION &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    if (hint) hint.remove();
    return;
  }

  if (CUSTOM_CURSOR) document.body.classList.add('sow-cursor');

  const active = new Set(); // id нажатых указателей
  let hintHidden = false;

  function addRipple(x, y) {
    if (!RIPPLE_ENABLED) return;
    const el = document.createElement('div');
    el.className = 'sow-ripple';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.setProperty('--r', RIPPLE_MAX_RADIUS_PX + 'px');
    el.style.setProperty('--ms', RIPPLE_MS + 'ms');
    el.addEventListener('animationend', () => el.remove());
    document.body.append(el);
  }

  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest && e.target.closest(IGNORE_SELECTOR)) return;

    active.add(e.pointerId);
    document.body.classList.add('is-sowing'); // «сеющий» курсор
    addRipple(e.clientX, e.clientY);

    if (HIDE_HINT_AFTER_FIRST_SOW && hint && !hintHidden) {
      hintHidden = true;
      hint.classList.add('is-hidden');
    }
  });

  const release = (e) => {
    active.delete(e.pointerId);
    if (!active.size) document.body.classList.remove('is-sowing');
  };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
})();
