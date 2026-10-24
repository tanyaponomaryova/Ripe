const start = Date.now();
window.addEventListener('load', () => {
  const splash = document.getElementById('splash');
  if (!splash) return;
  const wait = Math.max(0, 800 - (Date.now() - start));
  setTimeout(() => splash.classList.add('hidden'), wait);
});
