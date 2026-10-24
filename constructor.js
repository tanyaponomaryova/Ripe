/*
 * Ripe · Конструктор грядки (экраны 2.1–2.3)
 * Поиск и фильтры культур, распределение по ячейкам и зонам (клик «+» или drag & drop),
 * динамические подсказки, сводка урожая, карточка культуры (2.2), «Кто посадит» (2.3),
 * выпадающий список площадок.
 */
(function () {
  "use strict";

  const D = window.RIPE_DATA;
  const byId = Object.fromEntries(D.cultures.map((c) => [c.id, c]));
  const ZONE_ORDER = ["greenhouse", "berries", "open"];
  const CELLS = D.plan.cells;

  const state = {
    mode: "own", // "own" — свой выбор, "starter" — стартовый набор
    plans: {
      own: fit(D.initialOwnPlan),
      starter: fit(D.starterSet),
    },
    query: "",
    category: "all",
    saved: false,
    dirty: false,
    planting: { who: "gardener", date: "" },
  };

  function fit(list) {
    const out = list.slice(0, CELLS);
    while (out.length < CELLS) out.push(null);
    return out;
  }

  const cells = () => state.plans[state.mode];
  const isStarter = () => state.mode === "starter";
  const freeIndex = () => cells().indexOf(null);
  const filled = () => cells().filter(Boolean);
  const countOf = (id) => cells().filter((x) => x === id).length;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const el = (tag, attrs = {}, ...children) => {
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
  };
  const fmtKg = (n) => (Math.round(n * 10) / 10).toString().replace(".", ",");

  /* ---------------------------------------------------------- Изменения плана */

  function setCell(index, id) {
    if (isStarter()) return;
    cells()[index] = id;
    markDirty();
    renderPlan();
  }

  function addCulture(id) {
    if (isStarter()) return;
    const i = freeIndex();
    if (i === -1) {
      toast("Все ячейки заняты — освободите одну, чтобы добавить культуру");
      return;
    }
    setCell(i, id);
    toast(`${byId[id].name} → ${D.zones[byId[id].zone].name}`);
  }

  function removeCell(index) {
    if (isStarter()) return;
    const name = byId[cells()[index]].name;
    setCell(index, null);
    toast(`${name} убран из плана`);
  }

  function markDirty() {
    state.dirty = true;
    renderSaveStatus();
  }

  /* ---------------------------------------------------------- Список культур */

  function renderCategories() {
    const box = $("#categoryChips");
    box.replaceChildren(
      ...D.categories.map((cat) =>
        el("button", {
          type: "button",
          class: "chip" + (state.category === cat.id ? " is-selected" : ""),
          "aria-pressed": String(state.category === cat.id),
          text: cat.name,
          onclick: () => {
            state.category = cat.id;
            renderCategories();
            renderList();
          },
        })
      )
    );
  }

  function visibleCultures() {
    const q = state.query.trim().toLowerCase();
    return D.cultures.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q)) return false;
      if (state.category === "all") return true;
      if (state.category === "fast") return c.fast;
      return c.category === state.category;
    });
  }

  function renderList() {
    const list = $("#cultureList");
    const items = visibleCultures();
    const full = freeIndex() === -1;
    $("#cultureCount").textContent = `${items.length} из ${D.cultures.length}`;

    if (!items.length) {
      list.replaceChildren(
        el("li", { class: "culture-empty" },
          el("p", { text: `Ничего не нашли по запросу «${state.query}».` }),
          el("button", { type: "button", class: "link", text: "Сбросить поиск", onclick: resetSearch })
        )
      );
      return;
    }

    list.replaceChildren(
      ...items.map((c) => {
        const inPlan = countOf(c.id);
        let addLabel = "+";
        let addTitle = `Добавить «${c.name}» в свободную ячейку`;
        let disabled = false;
        if (isStarter()) {
          addLabel = inPlan ? "в наборе" : "—";
          addTitle = "Чтобы менять культуры, переключитесь на «Свой выбор»";
          disabled = true;
        } else if (full) {
          disabled = true;
          addTitle = "Все ячейки заняты";
        }
        return el(
          "li",
          {
            class: "culture" + (inPlan ? " is-in-plan" : ""),
            draggable: isStarter() ? "false" : "true",
            "data-id": c.id,
            ondragstart: (e) => {
              e.dataTransfer.setData("text/plain", c.id);
              e.dataTransfer.effectAllowed = "copy";
              document.body.classList.add("is-dragging");
            },
            ondragend: () => document.body.classList.remove("is-dragging"),
          },
          el("span", { class: "culture__thumb", "aria-hidden": "true" }),
          el(
            "button",
            { type: "button", class: "culture__open", onclick: () => openCulture(c.id), title: "Открыть карточку культуры" },
            el("span", { class: "culture__name", text: c.name }),
            el("span", {
              class: "culture__meta",
              text: `${D.zones[c.zone].name} · ${c.perennial ? c.harvest : "урожай " + c.harvest}`,
            })
          ),
          inPlan && !isStarter() ? el("span", { class: "culture__badge", text: `×${inPlan}` }) : null,
          el("button", {
            type: "button",
            class: "culture__add" + (isStarter() ? " is-text" : ""),
            text: addLabel,
            title: addTitle,
            "aria-label": addTitle,
            disabled,
            onclick: () => addCulture(c.id),
          })
        );
      })
    );
  }

  function resetSearch() {
    state.query = "";
    state.category = "all";
    $("#cultureSearch").value = "";
    renderCategories();
    renderList();
    $("#cultureSearch").focus();
  }

  /* ---------------------------------------------------------- Ячейки и зоны */

  function renderCells() {
    const root = $("#cellZones");
    const groups = {};
    cells().forEach((id, i) => {
      const key = id ? byId[id].zone : "free";
      (groups[key] = groups[key] || []).push(i);
    });

    const zoneBlocks = [...ZONE_ORDER, "free"]
      .filter((z) => groups[z])
      .map((z) =>
        el(
          "div",
          { class: "zone" + (z === "free" ? " zone--free" : "") },
          el("p", { class: "zone__label", text: z === "free" ? "Свободные ячейки" : D.zones[z].name }),
          el("div", { class: "zone__cells" }, groups[z].map(renderCell))
        )
      );
    root.replaceChildren(...zoneBlocks);

    $("#cellsHint").textContent = isStarter()
      ? "Стартовый набор уже расставлен и подобран под зоны площадки — он точно вырастет."
      : "Перетащите культуру из списка в ячейку или нажмите «+». Зону система выберет сама.";
    $("#cellsCounter").textContent = `${filled().length} из ${CELLS} занято`;
  }

  function renderCell(index) {
    const id = cells()[index];
    const c = id && byId[id];
    const cell = el(
      "div",
      {
        class: "cell" + (c ? " is-filled" : " is-free") + (isStarter() ? " is-locked" : ""),
        "data-index": String(index),
        role: "group",
        "aria-label": c ? `Ячейка ${index + 1}: ${c.name}` : `Ячейка ${index + 1}: свободна`,
      },
      c
        ? [
            el("button", { type: "button", class: "cell__name", text: c.name, onclick: () => openCulture(c.id) }),
            el("span", { class: "cell__meta", text: c.perennial ? c.harvest : `урожай ${c.harvest}` }),
            isStarter()
              ? null
              : el("button", {
                  type: "button",
                  class: "cell__remove",
                  "aria-label": `Убрать «${c.name}» из ячейки`,
                  title: "Убрать",
                  text: "✕",
                  onclick: () => removeCell(index),
                }),
          ]
        : el("span", { class: "cell__placeholder", text: isStarter() ? "—" : "Перетащите сюда" })
    );

    if (!isStarter()) {
      cell.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        cell.classList.add("is-over");
      });
      cell.addEventListener("dragleave", () => cell.classList.remove("is-over"));
      cell.addEventListener("drop", (e) => {
        e.preventDefault();
        cell.classList.remove("is-over");
        document.body.classList.remove("is-dragging");
        const dropped = e.dataTransfer.getData("text/plain");
        if (!byId[dropped]) return;
        const replaced = cells()[index];
        setCell(index, dropped);
        toast(
          replaced
            ? `${byId[replaced].name} заменён на ${byId[dropped].name}`
            : `${byId[dropped].name} → ${D.zones[byId[dropped].zone].name}`
        );
      });
    }
    return cell;
  }

  /* ---------------------------------------------------------- Подсказки */

  function computeHints() {
    const ids = filled();
    const unique = [...new Set(ids)];
    const hints = [];
    if (!ids.length) {
      return [{ type: "info", text: "Добавьте культуры: перетащите их из списка в ячейки или нажмите «+»." }];
    }

    // Зоны
    for (const z of ZONE_ORDER) {
      const inZone = unique.filter((id) => byId[id].zone === z);
      if (z === "greenhouse" && inZone.length) {
        hints.push({ type: "ok", text: `${listNames(inZone)} — в теплицу: ${D.zones[z].why}.` });
      }
    }

    // Совместимость
    const pairs = [];
    for (let i = 0; i < unique.length; i++)
      for (let j = i + 1; j < unique.length; j++) pairs.push([byId[unique[i]], byId[unique[j]]]);

    for (const [a, b] of pairs) {
      // Про соседство пишем только для культур в одной зоне: в разных зонах они не растут рядом
      if (a.zone !== b.zone) continue;
      const bad = a.bad.includes(b.id) || b.bad.includes(a.id);
      const good = a.good.includes(b.id) || b.good.includes(a.id);
      if (bad) {
        const tomatoCucumber = [a.id, b.id].includes("cucumber");
        if (tomatoCucumber) {
          hints.push({ type: "warn", text: `${a.name} и ${b.name}: нужна разная влажность — посадим в разные секции теплицы.` });
        } else {
          hints.push({ type: "warn", text: `${a.name} и ${b.name} плохо уживаются рядом. Садовник посадит их в разных концах зоны «${D.zones[a.zone].name}», но лучше заменить одну из культур.` });
        }
      } else if (good) {
        hints.push({ type: "ok", text: `${a.name} и ${b.name} — хорошие соседи.` });
      }
    }

    // Особенности культур
    for (const id of unique) {
      const c = byId[id];
      if (c.perennial) hints.push({ type: "warn", text: `${c.name} — многолетняя культура: урожай со 2-го сезона. Ячейку стоит продлить на следующий год.` });
      if (id === "strawberry") hints.push({ type: "ok", text: "Клубника ремонтантная даст урожай уже в первый сезон." });
      if (id === "pea") hints.push({ type: "info", text: "Горох посадим у края ячейки — ему нужна опора." });
      const n = countOf(id);
      if (n > 1) hints.push({ type: "info", text: `${c.name} в ${n} ячейках: урожай ≈ ${fmtKg(c.yieldKg * n)} кг.` });
    }

    const hard = unique.filter((id) => byId[id].difficulty === "сложная");
    if (hard.length >= 2) {
      hints.push({ type: "info", text: `${listNames(hard)} — сложные культуры. С форматом «${D.plan.care}» за ними присмотрит садовник.` });
    }

    const fast = unique.filter((id) => byId[id].fast);
    if (!fast.length && !isStarter()) {
      hints.push({ type: "info", text: "Нет быстрых культур: первый урожай будет не раньше июля. Редис или салат дадут результат уже через 3–4 недели." });
    }

    if (freeIndex() === -1 && !isStarter()) {
      hints.push({ type: "info", text: `Все ${CELLS} ячейки заняты. Чтобы добавить культуру, освободите ячейку.` });
    }
    return hints;
  }

  function listNames(ids) {
    const names = ids.map((id) => byId[id].name);
    if (names.length === 1) return names[0];
    return names.slice(0, -1).join(", ") + " и " + names[names.length - 1];
  }

  function renderHints() {
    const icons = { ok: "✓", warn: "!", info: "i" };
    $("#hintList").replaceChildren(
      ...computeHints().map((h) =>
        el("li", { class: `hint hint--${h.type}` },
          el("span", { class: "hint__icon", "aria-hidden": "true", text: icons[h.type] }),
          el("span", { text: h.text })
        )
      )
    );
  }

  /* ---------------------------------------------------------- Сводка */

  function renderSummary() {
    const unique = [...new Set(filled())];
    const rows = $("#summaryRows");
    if (!unique.length) {
      rows.replaceChildren(el("li", { class: "summary__empty", text: "Пока пусто — добавьте хотя бы одну культуру." }));
    } else {
      rows.replaceChildren(
        ...unique.map((id) => {
          const c = byId[id];
          const n = countOf(id);
          return el(
            "li",
            { class: "summary__row" },
            el("span", { class: "summary__name" },
              el("strong", { text: c.name + (n > 1 ? ` ×${n}` : "") }),
              el("span", { text: c.perennial ? c.harvest : `с ${c.harvest.replace("~", "~")}` })
            ),
            el("span", { class: "summary__kg", text: `≈ ${fmtKg(c.yieldKg * n)} кг` })
          );
        })
      );
    }
    const total = filled().reduce((s, id) => s + byId[id].yieldKg, 0);
    $("#summaryTotal").textContent = `≈ ${fmtKg(total)} кг`;

    const first = unique
      .map((id) => byId[id])
      .filter((c) => c.weeks > 0)
      .sort((a, b) => a.weeks - b.weeks)[0];
    $("#summaryFirst").textContent = first ? `${first.harvest} · ${first.name.toLowerCase()}` : "—";

    $("#saveBtn").disabled = !unique.length;
  }

  function renderSaveStatus() {
    const s = $("#saveStatus");
    if (state.saved && !state.dirty) {
      const who = state.planting.who === "gardener" ? "посадит садовник" : "посадите сами";
      const when = state.planting.date ? ", " + formatDate(state.planting.date) : "";
      s.textContent = `План сохранён · ${who}${when}`;
      s.className = "save-status is-saved";
    } else if (state.saved && state.dirty) {
      s.textContent = "Есть несохранённые изменения";
      s.className = "save-status is-dirty";
    } else {
      s.textContent = "Дальше: выберем, кто посадит — вы или садовник";
      s.className = "save-status";
    }
  }

  function renderPlan() {
    renderCells();
    renderHints();
    renderSummary();
    renderList();
    renderSaveStatus();
  }

  /* ---------------------------------------------------------- Режим: стартовый набор / свой выбор */

  function setMode(mode) {
    state.mode = mode;
    $$(".segmented__btn").forEach((b) => {
      const on = b.dataset.mode === mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    $("#starterNote").hidden = mode !== "starter";
    markDirty();
    renderPlan();
  }

  /* ---------------------------------------------------------- Модальные окна */

  let lastFocus = null;

  function openModal(id) {
    lastFocus = document.activeElement;
    const m = document.getElementById(id);
    m.hidden = false;
    document.body.classList.add("has-modal");
    const focusable = m.querySelector("[data-autofocus]") || m.querySelector("button, input, [href]");
    if (focusable) focusable.focus();
  }

  function closeModal(id) {
    const m = document.getElementById(id);
    if (!m || m.hidden) return;
    m.hidden = true;
    if (!$$(".modal").some((x) => !x.hidden)) document.body.classList.remove("has-modal");
    if (lastFocus) lastFocus.focus();
  }

  function trapFocus(e) {
    const m = $$(".modal").find((x) => !x.hidden);
    if (!m || e.key !== "Tab") return;
    const f = $$("button:not([disabled]), input:not([disabled]), [href]", m).filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  }

  /* 2.2 Карточка культуры */
  function openCulture(id) {
    const c = byId[id];
    const names = (ids) => (ids.length ? ids.map((x) => byId[x].name.toLowerCase()).join(", ") : "—");
    $("#cultureTitle").textContent = c.name;
    const chips = [
      el("span", { class: "chip is-static", text: D.zones[c.zone].name }),
      el("span", { class: "chip is-static", text: "Сложность: " + c.difficulty }),
    ];
    if (c.fast) chips.push(el("span", { class: "chip is-static", text: "Быстрая" }));
    $("#cultureChips").replaceChildren(...chips);
    $("#cultureFacts").replaceChildren(
      ...[
        ["Зона", D.zones[c.zone].name],
        ["Первый урожай", c.harvest],
        ["Урожай с ячейки", `≈ ${fmtKg(c.yieldKg)} кг за сезон`],
        ["Хорошие соседи", names(c.good)],
        ["Плохие соседи", names(c.bad)],
      ].map(([k, v]) => el("div", { class: "kv" }, el("dt", { text: k }), el("dd", { text: v })))
    );
    $("#cultureNote").textContent = c.note;

    const add = $("#cultureAdd");
    const inPlan = countOf(id);
    let reason = "";
    if (isStarter()) reason = "В режиме «Стартовый набор» культуры не меняются.";
    else if (freeIndex() === -1) reason = "Все ячейки заняты — освободите одну в плане.";
    add.disabled = Boolean(reason);
    add.textContent = inPlan ? "Добавить ещё в одну ячейку" : "Добавить в ячейку";
    add.onclick = () => {
      addCulture(id);
      closeModal("modalCulture");
    };
    $("#cultureReason").textContent = reason || (inPlan ? `Уже в плане: ${inPlan} ${inPlan === 1 ? "ячейка" : "ячейки"}.` : "");
    openModal("modalCulture");
  }

  /* 2.3 Кто посадит */
  function openWho() {
    const date = $("#plantDate");
    // Сезон посадки: 15 мая – 30 июня. Если он уже прошёл, предлагаем следующий год.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let year = today.getFullYear();
    if (today > new Date(year, 5, 30)) year += 1;
    const seasonStart = new Date(year, 4, 15);
    const min = today > seasonStart ? today : seasonStart;
    const iso = (d) =>
      d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    date.min = iso(min);
    date.max = iso(new Date(year, 5, 30));
    if (!date.value) date.value = date.min;
    $$('input[name="who"]').forEach((r) => (r.checked = r.value === state.planting.who));
    syncWho();
    openModal("modalWho");
  }

  function syncWho() {
    const who = $('input[name="who"]:checked').value;
    $$(".option").forEach((o) => o.classList.toggle("is-selected", o.querySelector("input").checked));
    $("#plantDateLabel").textContent = who === "self" ? "Когда приедете сажать" : "Дата посадки";
    $("#plantDateNote").textContent =
      who === "self"
        ? "Садовник подготовит ячейки и рассаду к вашему приезду."
        : "Пришлём фотоотчёт после посадки. Если будут заморозки, перенесём дату.";
  }

  function confirmWho() {
    const date = $("#plantDate");
    if (!date.value || date.value < date.min || date.value > date.max) {
      date.focus();
      date.setAttribute("aria-invalid", "true");
      $("#plantDateNote").textContent = "Выберите дату в сезон посадки: с 15 мая по 30 июня.";
      return;
    }
    date.removeAttribute("aria-invalid");
    state.planting = { who: $('input[name="who"]:checked').value, date: date.value };
    state.saved = true;
    state.dirty = false;
    closeModal("modalWho");
    renderSaveStatus();
    toast("План посадок сохранён");
  }

  function formatDate(iso) {
    const m = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
    const [y, mo, d] = iso.split("-").map(Number);
    return y === new Date().getFullYear() ? `${d} ${m[mo - 1]}` : `${d} ${m[mo - 1]} ${y}`;
  }

  /* ---------------------------------------------------------- Площадки (выпадающий список) */

  function renderPlaces() {
    const menu = $("#placeMenu");
    menu.replaceChildren(
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
            el("span", { class: "place-option__text" },
              el("strong", { text: p.name }),
              el("span", { text: p.available ? p.note : `${p.note} · недоступно в демо` })
            )
          )
        )
      )
    );
  }

  function togglePlaces(force) {
    const btn = $("#placeBtn");
    const open = force ?? btn.getAttribute("aria-expanded") !== "true";
    btn.setAttribute("aria-expanded", String(open));
    $("#placeMenu").hidden = !open;
  }

  /* ---------------------------------------------------------- Toast */

  let toastTimer;
  function toast(text) {
    const t = $("#toast");
    t.textContent = text;
    t.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-visible"), 2400);
  }

  /* ---------------------------------------------------------- Инициализация */

  function init() {
    $$("[data-main-link]").forEach((a) => (a.href = D.mainPageUrl));

    $("#cultureSearch").addEventListener("input", (e) => {
      state.query = e.target.value;
      renderList();
    });

    $$(".segmented__btn").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));

    $("#saveBtn").addEventListener("click", openWho);
    $("#whoConfirm").addEventListener("click", confirmWho);
    $$('input[name="who"]').forEach((r) => r.addEventListener("change", syncWho));

    $$("[data-close]").forEach((b) => b.addEventListener("click", () => closeModal(b.dataset.close)));
    $$(".modal").forEach((m) =>
      m.addEventListener("mousedown", (e) => {
        if (e.target === m) closeModal(m.id);
      })
    );

    $("#placeBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      togglePlaces();
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".place-switch")) togglePlaces(false);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const open = $$(".modal").find((x) => !x.hidden);
        if (open) closeModal(open.id);
        else togglePlaces(false);
      }
      trapFocus(e);
    });

    renderPlaces();
    renderCategories();
    renderPlan();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
