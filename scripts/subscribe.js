/*
 * Ripe · подписка на главной: по отправке формы показываем уведомление.
 */
(function () {
  'use strict';

  /* ============================ НАСТРОЙКИ ============================ */
  const SUBSCRIBE_MESSAGE = 'Вы подписаны!';
  const TOAST_MS = 2400; // сколько висит уведомление
  /* ================================================================== */

  const form = document.querySelector('.form');
  const toastEl = document.getElementById('toast');
  if (!form || !toastEl) return;

  let timer;
  form.addEventListener('submit', (e) => {
    e.preventDefault(); // без перезагрузки страницы; валидацию e-mail делает браузер
    toastEl.textContent = SUBSCRIBE_MESSAGE;
    toastEl.classList.add('is-visible');
    clearTimeout(timer);
    timer = setTimeout(() => toastEl.classList.remove('is-visible'), TOAST_MS);
    form.reset();
  });
})();
