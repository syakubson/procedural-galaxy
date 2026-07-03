// First-flight onboarding: the declarative step list (stage 3). Each step is
// pure data — the FSM in onboarding.js owns all behaviour, so tuning the tour
// (texts, order, gating) never touches logic.
//
// Step shape:
//   id        — stable key (analytics / skippedAt bookkeeping)
//   body      — the RU coachmark text (short imperatives, cartographer tone)
//   advanceOn — 'manual' (button) or 'event:<name>' fired via app → notify()
//   when      — optional payload filter for event steps:
//                 { seed }  matches entry.data.seed  (enterSystem)
//                 { label } matches planet.data.label (focusPlanet)
//   next      — label of the manual-advance button (manual steps only)
//   action    — optional named helper button, resolved by onboarding.js
//                 ('showHome' → fly the galaxy camera to the Solar System)
//   glow      — optional DOM id to halo while the step is active
//   codexTab  — optional codex category the rail click lands on during this
//                 step (the tour's finds live under «Планеты», not «Системы»)
//
// The tour deliberately runs THROUGH the Solar System: rotate → zoom → fly
// home → enter → meet Earth → find it in the codex → back out. Every middle
// step advances on the player's own action, never on a «Далее» treadmill.

export const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Добро пожаловать, картограф',
    body: 'Перед тобой — целая галактика, выращенная из одного зерна. Короткий первый полёт — и она твоя.',
    advanceOn: 'manual',
    next: 'Начать',
  },
  {
    id: 'rotate',
    body: 'Зажми левую кнопку мыши и поверни галактику.',
    advanceOn: 'event:rotate',
  },
  {
    id: 'zoom',
    body: 'Колесо мыши приближает к месту под курсором. Клавиши Q и E — тоже зум.',
    advanceOn: 'event:zoom',
  },
  {
    id: 'find-sol',
    body: 'Среди тысяч звёзд есть наш дом. Нажми «Показать дом», затем кликни по пульсирующему маркеру, чтобы войти.',
    advanceOn: 'event:enterSystem',
    when: { seed: 'sol-system' },
    action: 'showHome',
  },
  {
    id: 'meet-sol',
    body: 'Это Солнечная система. Слева — досье: звезда, возраст, история. Планеты подписаны прямо на орбитах.',
    advanceOn: 'manual',
    next: 'Дальше',
  },
  {
    id: 'focus-earth',
    body: 'Кликни по Земле — рассмотрим её поближе.',
    advanceOn: 'event:focusPlanet',
    when: { label: 'Земля' },
  },
  {
    id: 'back',
    body: 'Земля записана в твой Кодекс. Теперь вернись к галактике: Esc делает шаг назад — нажми его дважды.',
    advanceOn: 'event:exitSystem',
  },
  {
    id: 'codex',
    body: 'Кодекс — вкладка у левого края: всё, что ты находишь, остаётся в нём навсегда. Загляни — Земля уже там.',
    advanceOn: 'event:codexClose', // advance when the panel CLOSES — the final card must arrive on a visible screen
    glow: 'codex-toggle',
    codexTab: 'planet',
  },
  {
    id: 'done',
    title: 'Первый полёт завершён',
    body: 'Дальше — свободный полёт: наводись на маркеры, ныряй в системы, собирай кодекс. Настройки — сверху справа.',
    advanceOn: 'manual',
    next: 'В путь',
  },
];
