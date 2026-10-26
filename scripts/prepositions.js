document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('p, h1, h2, h3, li').forEach((element) => {
    element.innerHTML = element.innerHTML.replace(
      /(^|\s)(в|во|к|ко|с|со|у|о|об|от|до|из|за|на|по|под|при|про|для|без|над|и|а|но|или|не|же|бы|то)\s+/gi,
      '$1$2&nbsp;'
    );
  });
});
