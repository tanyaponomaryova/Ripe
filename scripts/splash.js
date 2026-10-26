/*
 * Ripe · заставка: фоновая картинка на весь экран (при каждой загрузке
 * страницы — другая), по центру плавно сменяют друг друга семечки
 * (имитация загрузки). Больше на экране ничего нет.
 */
(function () {
  'use strict';

  /* ============================ НАСТРОЙКИ ============================ */
  // Фоновые картинки: при каждой загрузке выбирается одна из списка
  const SPLASH_BACKGROUNDS = ['img/splash/bg-1.png', 'img/splash/bg-2.png'];
  const SPLASH_AVOID_REPEAT = true; // не показывать подряд один и тот же фон

  // Семечки заставки (отдельный набор, не тот, что сыплется на главной)
  const SPLASH_SEED_SOURCES = [
    'img/splash/01.svg',
    'img/splash/02.svg',
    'img/splash/03.svg',
    'img/splash/04.svg',
    'img/splash/05.svg',
    'img/splash/06.svg',
    'img/splash/07.svg',
    'img/splash/08.svg',
    'img/splash/09.svg',
    'img/splash/10.svg',
    'img/splash/11.svg',
    'img/splash/12.svg',
    'img/splash/13.svg',
    'img/splash/14.svg',
    'img/splash/15.svg',
    'img/splash/16.svg',
    'img/splash/17.svg',
    'img/splash/18.svg',
    'img/splash/19.svg',
  ];

  const SPLASH_MIN_MS = 800; // минимальное время показа заставки
  const SPLASH_FRAME_MS = 200; // сколько длится переход к следующему семечку (меньше = быстрее)
  const SPLASH_SEED_SIZE_PX = 64; // размер области семечки на экране
  const SPLASH_SPIN_DEG_PER_SEC = 0; // плавное вращение семечки (0 = без вращения)
  /* ================================================================== */

  const SOURCES = SPLASH_SEED_SOURCES;
  const start = Date.now();
  let rafId = 0;
  let stopped = false;

  /* ---------- Фон: выбираем сразу, чтобы не было вспышки серого ---------- */
  (function pickBackground() {
    if (!SPLASH_BACKGROUNDS.length) return;
    const KEY = 'ripe:splashBg';
    let idx = Math.floor(Math.random() * SPLASH_BACKGROUNDS.length);
    try {
      if (SPLASH_AVOID_REPEAT && SPLASH_BACKGROUNDS.length > 1) {
        const prev = Number(localStorage.getItem(KEY));
        while (idx === prev)
          idx = Math.floor(Math.random() * SPLASH_BACKGROUNDS.length);
      }
      localStorage.setItem(KEY, String(idx));
    } catch (e) {
      /* localStorage недоступен — просто случайный фон */
    }
    const url = SPLASH_BACKGROUNDS[idx];
    const style = document.createElement('style');
    style.textContent = `#splash{background-image:url("${url}");}`;
    document.head.append(style);
    new Image().src = url; // предзагрузка
  })();

  const smooth = (x) => x * x * (3 - 2 * x); // плавное ускорение/замедление

  function startCycle() {
    const box = document.getElementById('splashSeeds');
    if (!box || !SOURCES.length) return;
    box.style.width = box.style.height = SPLASH_SEED_SIZE_PX + 'px';

    // все семечки лежат стопкой, показываем их через opacity — без подмены src,
    // поэтому нет мигания и подгрузки в процессе
    const imgs = SOURCES.map((src) => {
      const img = new Image();
      img.alt = '';
      img.src = src;
      box.append(img);
      return img;
    });
    const n = imgs.length;
    const t0 = performance.now();

    function frame(now) {
      if (stopped) return;
      const elapsed = now - t0;
      const pos = (elapsed / SPLASH_FRAME_MS) % n; // «позиция» между семечками
      for (let i = 0; i < n; i++) {
        let d = Math.abs(pos - i);
        d = Math.min(d, n - d); // расстояние по кругу
        // соседние семечки перетекают друг в друга, сумма прозрачностей = 1
        imgs[i].style.opacity = d < 1 ? smooth(1 - d) : 0;
      }
      if (SPLASH_SPIN_DEG_PER_SEC) {
        box.style.transform = `rotate(${(elapsed / 1000) * SPLASH_SPIN_DEG_PER_SEC}deg)`;
      }
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startCycle);
  } else {
    startCycle();
  }

  window.addEventListener('load', () => {
    const splash = document.getElementById('splash');
    if (!splash) return;
    const wait = Math.max(0, SPLASH_MIN_MS - (Date.now() - start));
    setTimeout(() => {
      splash.classList.add('hidden');
      // после завершения fade-out (0.4s) останавливаем анимацию
      setTimeout(() => {
        stopped = true;
        cancelAnimationFrame(rafId);
      }, 500);
    }, wait);
  });
})();
