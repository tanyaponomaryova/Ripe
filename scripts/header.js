/*
 * Ripe · шапка сайта (общая для всех страниц)
 * — бургер-меню на мобильных;
 * — выпадающий список площадок;
 * — ссылка на главную из RIPE_DATA.mainPageUrl.
 * Требует scripts/cultures.js (window.RIPE_DATA), подключённого раньше.
 */
(function () {
  "use strict";

  const D = window.RIPE_DATA;
  const header = document.querySelector(".app-header");
  if (!header) return;

  /* ---------------------------------------------------------- Бургер */

  const burger = header.querySelector(".burger");
  const nav = header.querySelector(".nav");

  function setMenu(open) {
    header.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  }

  burger.addEventListener("click", (e) => {
    e.stopPropagation();
    setMenu(!header.classList.contains("is-open"));
  });

  // Закрываем по клику вне шапки, по ссылке в меню и при переходе на десктоп
  document.addEventListener("click", (e) => {
    if (!header.contains(e.target)) setMenu(false);
  });
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) setMenu(false);
  });
  window.matchMedia("(min-width: 1025px)").addEventListener("change", (e) => {
    if (e.matches) setMenu(false);
  });

  /* ---------------------------------------------------------- Площадки */

  const placeBtn = document.getElementById("placeBtn");
  const placeMenu = document.getElementById("placeMenu");

  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === false || v == null) continue;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat()) if (c != null) node.append(c);
    return node;
  }

  function togglePlaces(force) {
    const open = force ?? placeBtn.getAttribute("aria-expanded") !== "true";
    placeBtn.setAttribute("aria-expanded", String(open));
    placeMenu.hidden = !open;
  }

  function renderPlaces() {
    placeMenu.replaceChildren(
      ...D.places.map((p) =>
        el(
          "li",
          { role: "none" },
          el(
            "button",
            {
              type: "button",
              role: "menuitemradio",
              class: "place-option" + (p.name === D.plan.place ? " is-current" : ""),
              "aria-checked": String(p.name === D.plan.place),
              disabled: !p.available,
              title: p.available ? "" : "Смена площадки недоступна в этой версии",
              onclick: () => togglePlaces(false),
            },
            el("span", { class: "place-option__check", "aria-hidden": "true", text: p.name === D.plan.place ? "✓" : "" }),
            el(
              "span",
              { class: "place-option__text" },
              el("strong", { text: p.name }),
              el("span", { text: p.available ? p.note : `${p.note} · недоступно в демо` })
            )
          )
        )
      )
    );
  }

  placeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePlaces();
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".place-switch")) togglePlaces(false);
  });

  /* ---------------------------------------------------------- Общее */

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    togglePlaces(false);
    if (header.classList.contains("is-open")) {
      setMenu(false);
      burger.focus();
    }
  });

  document.querySelectorAll("[data-main-link]").forEach((a) => (a.href = D.mainPageUrl));
  renderPlaces();
})();
