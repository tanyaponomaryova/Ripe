/*
 * Ripe · семечки на фоне главной.
 * Зажми кнопку мыши (или палец) и води — за курсором сыплются семечки,
 * падают вниз и исчезают за нижним краем страницы.
 * Пути до картинок — в scripts/seed-config.js.
 */
(function () {
  'use strict';

  /* ============================ НАСТРОЙКИ ============================ */
  // --- Частота появления ---
  const SPAWN_ON_PRESS = 3; // сколько семечек сразу при нажатии
  const SPAWN_DISTANCE_PX = 130; // 1 семечко на каждые N px движения (меньше = гуще)
  const SPAWN_HOLD_PER_SEC = 0; // семечек в секунду, если держим на месте (0 = не сыпать)

  // --- Вид ---
  const SIZE_MIN_PX = 30; // ширина семечки, от
  const SIZE_MAX_PX = 50; // ...и до
  const OPACITY = 1; // прозрачность 0..1
  const START_SPREAD_PX = 10; // разброс места появления вокруг курсора

  // --- Физика (px и секунды) ---
  const GRAVITY = 600; // ускорение вниз, px/с²
  const MAX_FALL_SPEED = 900; // предельная скорость падения, px/с
  const START_VX = 60; // случайная горизонтальная скорость при появлении, ±px/с
  const START_VY_MIN = -120; // начальная вертикальная скорость (минус = вверх)
  const START_VY_MAX = 40;
  const SWAY_AMPLITUDE = 25; // покачивание из стороны в сторону, px/с (0 = выкл)
  const SWAY_SPEED = 3; // скорость покачивания
  const SPIN_MAX = 4; // вращение, ±рад/с

  // --- Прочее ---
  const MAX_SEEDS = 400; // потолок количества семечек на экране
  const IGNORE_SELECTOR =
    'input, textarea, select, .nav, .burger, .logo, .place-switch, .icon-btn, .avatar'; // где нажатие не сыплет семечки (поля ввода и меню шапки)
  const LOCK_SCROLL_IF_PAGE_FITS = true; // на телефоне: если страница не скроллится, не даём браузеру перехватывать жест
  const RESPECT_REDUCED_MOTION = true; // отключить, если в системе включено «уменьшить анимацию»
  /* ================================================================== */

  if (
    RESPECT_REDUCED_MOTION &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
    return;

  const SOURCES = window.RIPE_SEED_SOURCES || [];
  if (!SOURCES.length) return;

  /* ---------- Холст на заднем плане ---------- */
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    zIndex: '-1', // позади контента
    pointerEvents: 'none',
  });
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  let W = 0;
  let H = 0;
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    updateTouchAction();
  }

  function updateTouchAction() {
    if (!LOCK_SCROLL_IF_PAGE_FITS) return;
    const fits =
      document.documentElement.scrollHeight <= window.innerHeight + 1;
    document.body.style.touchAction = fits ? 'none' : '';
  }

  /* ---------- Картинки ---------- */
  const images = [];
  SOURCES.forEach((src) => {
    const img = new Image();
    img.onload = () => images.push(img);
    img.onerror = () => console.warn('Семечка не загрузилась:', src);
    img.src = src;
  });

  /* ---------- Семечки ---------- */
  const seeds = [];
  const rand = (a, b) => a + Math.random() * (b - a);

  function spawn(x, y) {
    if (!images.length || seeds.length >= MAX_SEEDS) return;
    const img = images[Math.floor(Math.random() * images.length)];
    const w = rand(SIZE_MIN_PX, SIZE_MAX_PX);
    const aspect = img.naturalWidth ? img.naturalHeight / img.naturalWidth : 1;
    seeds.push({
      img,
      w,
      h: w * aspect,
      x: x + rand(-START_SPREAD_PX, START_SPREAD_PX),
      y: y + rand(-START_SPREAD_PX, START_SPREAD_PX),
      vx: rand(-START_VX, START_VX),
      vy: rand(START_VY_MIN, START_VY_MAX),
      rot: rand(0, Math.PI * 2),
      vr: rand(-SPIN_MAX, SPIN_MAX),
      phase: rand(0, Math.PI * 2),
    });
    startLoop();
  }

  let rafId = 0;
  let last = 0;
  let time = 0;
  function startLoop() {
    if (rafId) return;
    last = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;

    // удержание на месте
    if (SPAWN_HOLD_PER_SEC > 0) {
      for (const p of pointers.values()) {
        p.holdAcc += SPAWN_HOLD_PER_SEC * dt;
        while (p.holdAcc >= 1) {
          p.holdAcc -= 1;
          spawn(p.x, p.y);
        }
      }
    }

    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = OPACITY;

    for (let i = seeds.length - 1; i >= 0; i--) {
      const s = seeds[i];
      s.vy = Math.min(MAX_FALL_SPEED, s.vy + GRAVITY * dt);
      s.x +=
        (s.vx + Math.sin(time * SWAY_SPEED + s.phase) * SWAY_AMPLITUDE) * dt;
      s.y += s.vy * dt;
      s.rot += s.vr * dt;

      // ушла за нижний край — удаляем
      if (s.y - s.h > H) {
        seeds.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.drawImage(s.img, -s.w / 2, -s.h / 2, s.w, s.h);
      ctx.restore();
    }

    if (seeds.length || pointers.size) {
      rafId = requestAnimationFrame(frame);
    } else {
      rafId = 0;
      ctx.clearRect(0, 0, W, H);
    }
  }

  /* ---------- Ввод: мышь и касания (pointer events) ---------- */
  const pointers = new Map(); // pointerId -> {x, y, acc, holdAcc}

  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest && e.target.closest(IGNORE_SELECTOR)) return;
    pointers.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
      acc: 0,
      holdAcc: 0,
    });
    for (let i = 0; i < SPAWN_ON_PRESS; i++) spawn(e.clientX, e.clientY);
    if (SPAWN_HOLD_PER_SEC > 0) startLoop();
  });

  window.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    const dist = Math.hypot(dx, dy);
    if (!dist) return;

    // равномерно рассыпаем семечки вдоль отрезка движения
    let travelled = SPAWN_DISTANCE_PX - p.acc;
    while (travelled <= dist) {
      const t = travelled / dist;
      spawn(p.x + dx * t, p.y + dy * t);
      travelled += SPAWN_DISTANCE_PX;
    }
    p.acc = (p.acc + dist) % SPAWN_DISTANCE_PX;
    p.x = e.clientX;
    p.y = e.clientY;
  });

  const release = (e) => pointers.delete(e.pointerId);
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);

  // чтобы при протяжке мышью не выделялся текст
  document.addEventListener('selectstart', (e) => {
    if (!pointers.size) return;
    const el = e.target.nodeType === 1 ? e.target : e.target.parentElement;
    if (!(el && el.closest(IGNORE_SELECTOR))) e.preventDefault();
  });

  window.addEventListener('resize', resize);
  window.addEventListener('load', updateTouchAction);
  resize();
})();
