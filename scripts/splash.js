/*
 * Ripe · заставка: серый экран, на котором семечки плавно перетекают
 * одна в другую (имитация загрузки). Больше на экране ничего нет.
 */
(function () {
  "use strict";

  /* ============================ НАСТРОЙКИ ============================ */
  const SPLASH_MIN_MS = 800; // минимальное время показа заставки
  const SPLASH_FRAME_MS = 90; // сколько длится переход к следующему семечку (меньше = быстрее)
  const SPLASH_SEED_SIZE_PX = 64; // размер области семечки на экране
  const SPLASH_SPIN_DEG_PER_SEC = 0; // плавное вращение семечки (0 = без вращения)
  /* ================================================================== */

  const SOURCES = window.RIPE_SEED_SOURCES || [];
  const start = Date.now();
  let rafId = 0;
  let stopped = false;

  const smooth = (x) => x * x * (3 - 2 * x); // плавное ускорение/замедление

  function startCycle() {
    const box = document.getElementById("splashSeeds");
    if (!box || !SOURCES.length) return;
    box.style.width = box.style.height = SPLASH_SEED_SIZE_PX + "px";

    // все семечки лежат стопкой, показываем их через opacity — без подмены src,
    // поэтому нет мигания и подгрузки в процессе
    const imgs = SOURCES.map((src) => {
      const img = new Image();
      img.alt = "";
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startCycle);
  } else {
    startCycle();
  }

  window.addEventListener("load", () => {
    const splash = document.getElementById("splash");
    if (!splash) return;
    const wait = Math.max(0, SPLASH_MIN_MS - (Date.now() - start));
    setTimeout(() => {
      splash.classList.add("hidden");
      // после завершения fade-out (0.4s) останавливаем анимацию
      setTimeout(() => {
        stopped = true;
        cancelAnimationFrame(rafId);
      }, 500);
    }, wait);
  });
})();
