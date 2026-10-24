/*
 * Ripe · Конструктор грядки — справочник культур и площадок.
 * Данные демонстрационные: сроки и урожай указаны примерно, для одной ячейки 1×1 м.
 */

window.RIPE_DATA = {
  /* Ссылка на главную страницу сервиса (страница коллеги). Поменяйте, если путь другой. */
  mainPageUrl: "index.html",

  plan: {
    place: "Опушка",
    tariff: "Грядка",
    cells: 4,
    care: "под ключ",
  },

  places: [
    { id: "opushka", name: "Опушка", note: "35 мин от дома", available: true },
    { id: "river", name: "Речной берег", note: "50 мин от дома", available: false },
    { id: "pines", name: "Сосновка", note: "55 мин от дома", available: false },
    { id: "pond", name: "Поле у пруда", note: "60 мин от дома", available: false },
  ],

  zones: {
    greenhouse: { name: "Теплица", why: "им нужно тепло и защита от погоды" },
    berries: { name: "Ягоды", why: "ягодная зона с подготовленной почвой" },
    open: { name: "Открытый грунт", why: "хватает солнца и места" },
  },

  categories: [
    { id: "all", name: "Все" },
    { id: "fast", name: "Быстрые" },
    { id: "greens", name: "Зелень" },
    { id: "veg", name: "Овощи" },
    { id: "berries", name: "Ягоды" },
  ],

  /* Стартовый набор с гарантией для тарифа «Грядка» (4 ячейки) */
  starterSet: ["tomato_cherry", "lettuce", "pea", "strawberry"],

  /* План «Свой выбор» на момент открытия страницы (как на экране 2.1) */
  initialOwnPlan: ["tomato_cherry", "tomato_bull", "strawberry", "basil"],

  cultures: [
    {
      id: "tomato_cherry", name: "Томат черри", category: "veg", fast: false,
      zone: "greenhouse", harvest: "~20 июля", weeks: 10, yieldKg: 3,
      difficulty: "средняя", good: ["basil", "pepper", "carrot"], bad: ["cucumber", "dill"],
      note: "Неприхотливый сорт: плодоносит до заморозков, если вовремя подвязывать.",
    },
    {
      id: "tomato_bull", name: "Томат «Бычье сердце»", category: "veg", fast: false,
      zone: "greenhouse", harvest: "~15 авг.", weeks: 14, yieldKg: 4,
      difficulty: "сложная", good: ["basil", "carrot"], bad: ["cucumber", "dill"],
      note: "Крупные плоды до 500 г. Нужны подвязка и пасынкование — садовник сделает это в формате «под ключ».",
    },
    {
      id: "pepper", name: "Перец сладкий", category: "veg", fast: false,
      zone: "greenhouse", harvest: "~25 авг.", weeks: 16, yieldKg: 2,
      difficulty: "сложная", good: ["basil", "tomato_cherry"], bad: ["pea"],
      note: "Долго растёт и любит тепло — только теплица.",
    },
    {
      id: "cucumber", name: "Огурец", category: "veg", fast: false,
      zone: "greenhouse", harvest: "~10 июля", weeks: 8, yieldKg: 4,
      difficulty: "средняя", good: ["dill", "pea"], bad: ["tomato_cherry", "tomato_bull"],
      note: "Любит влажный воздух, поэтому растёт в отдельной секции теплицы.",
    },
    {
      id: "strawberry", name: "Клубника ремонтантная", category: "berries", fast: false,
      zone: "berries", harvest: "~25 июля", weeks: 10, yieldKg: 1.5,
      difficulty: "средняя", good: ["garlic", "spinach"], bad: ["cabbage"],
      note: "Ремонтантный сорт плодоносит уже в первый сезон. Обычные сорта дают урожай со второго года.",
    },
    {
      id: "raspberry", name: "Малина", category: "berries", fast: false,
      zone: "berries", harvest: "со 2-го сезона", weeks: 0, yieldKg: 0.3,
      difficulty: "средняя", good: ["garlic"], bad: ["strawberry"], perennial: true,
      note: "Многолетний куст: в первый сезон укореняется, полноценный урожай — со второго года.",
    },
    {
      id: "basil", name: "Базилик", category: "greens", fast: false,
      zone: "open", harvest: "~1 июля", weeks: 6, yieldKg: 0.5,
      difficulty: "лёгкая", good: ["tomato_cherry", "tomato_bull", "pepper"], bad: [],
      note: "Рядом с томатами отпугивает вредителей и, по поверью, делает их слаще.",
    },
    {
      id: "lettuce", name: "Салат листовой", category: "greens", fast: true,
      zone: "open", harvest: "~10 июня", weeks: 4, yieldKg: 1,
      difficulty: "лёгкая", good: ["radish", "carrot", "strawberry"], bad: [],
      note: "Можно срезать несколько раз за сезон.",
    },
    {
      id: "radish", name: "Редис", category: "veg", fast: true,
      zone: "open", harvest: "~26 мая", weeks: 3, yieldKg: 1,
      difficulty: "лёгкая", good: ["lettuce", "pea", "carrot"], bad: ["cabbage"],
      note: "Самый быстрый результат: всходы через 5 дней, урожай через 3–4 недели.",
    },
    {
      id: "dill", name: "Укроп", category: "greens", fast: true,
      zone: "open", harvest: "~15 июня", weeks: 5, yieldKg: 0.4,
      difficulty: "лёгкая", good: ["cucumber", "cabbage"], bad: ["carrot", "tomato_cherry", "tomato_bull"],
      note: "Неприхотлив, легко пересевается сам.",
    },
    {
      id: "spinach", name: "Шпинат", category: "greens", fast: true,
      zone: "open", harvest: "~15 июня", weeks: 5, yieldKg: 0.6,
      difficulty: "лёгкая", good: ["strawberry", "radish"], bad: [],
      note: "Любит прохладу — лучше сеять в начале сезона.",
    },
    {
      id: "pea", name: "Горох", category: "veg", fast: false,
      zone: "open", harvest: "~5 июля", weeks: 8, yieldKg: 1.2,
      difficulty: "лёгкая", good: ["carrot", "radish", "cucumber"], bad: ["garlic", "pepper"],
      note: "Нужна опора — сажаем у края ячейки.",
    },
    {
      id: "carrot", name: "Морковь", category: "veg", fast: false,
      zone: "open", harvest: "~1 авг.", weeks: 12, yieldKg: 2.5,
      difficulty: "средняя", good: ["pea", "radish", "tomato_cherry", "lettuce"], bad: ["dill"],
      note: "Медленно всходит — первые две недели может казаться, что ничего не происходит.",
    },
    {
      id: "garlic", name: "Чеснок", category: "veg", fast: false,
      zone: "open", harvest: "~25 июля", weeks: 12, yieldKg: 0.8,
      difficulty: "лёгкая", good: ["strawberry", "raspberry"], bad: ["pea"],
      note: "Защищает ягоды от вредителей.",
    },
    {
      id: "cabbage", name: "Кольраби", category: "veg", fast: false,
      zone: "open", harvest: "~20 июля", weeks: 9, yieldKg: 2,
      difficulty: "средняя", good: ["dill"], bad: ["strawberry", "radish"],
      note: "Быстрая капуста: съедобный стеблеплод за 2 месяца.",
    },
  ],
};
