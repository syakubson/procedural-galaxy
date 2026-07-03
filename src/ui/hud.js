// HUD overlays for system exploration: the lore InfoPanel (system overview +
// history/resources + civilisation + planets with mini-icons), a hover Tooltip
// with a curiosity-gap teaser, a discovery Legend/counter, and a fade Overlay
// for the warp transition. All plain DOM, styled via classes in styles.css.

// vivid status palette — matches the brighter, higher-contrast galaxy markers
const STATUS_COLOR = {
  inhabited: '#5fe0a0', // jade
  ruins: '#f0a24e', // amber
  wild: '#74c4f2', // sky-blue
  blackhole: '#c9a24a', // brass void
};

// magenta — hand-crafted easter-egg systems (#13/#19/#20)
const SPECIAL_COLOR = '#d98ae8';

// drop the trailing franchise tag from authored lore: «… uprising. (Star Wars)»
// → «… uprising.» We keep in-prose parentheticals (spectral class «(G)», a name
// alias «(Dune)», «(Battle of Yavin)») — only known universe tags are stripped.
const UNIVERSE_TAG = /\s*\((?:Star\s?Wars|Dead\s?Space|Dune|Avatar|Interstellar|Halo|Mass\s?Effect|Alien[s]?|Warhammer)[^)]*\)\s*$/i;
function stripUniverseTag(text) {
  return typeof text === 'string' ? text.replace(UNIVERSE_TAG, '') : text;
}

const TYPE_LABEL = {
  lava: 'Лавовая',
  rocky: 'Каменистая',
  desert: 'Пустынная',
  terran: 'Земного типа',
  ocean: 'Океаническая',
  ice: 'Ледяная',
  gas: 'Газовый гигант',
};

export function planetLabel(p) {
  if (p.label) return p.label; // hand-named special-system planets (#13/#19/#20)
  if (p.biomeLabel && (p.inhabited || p.ruined)) return p.biomeLabel;
  return TYPE_LABEL[p.type] || p.type;
}

// Subtitle for the focused-planet card. Biome names must beat the generic
// archetype description: applyBiome() re-types every living/ruined homeworld
// as terran, so TYPE_DESC[p.type] alone would call each of them
// «Землеподобный мир» no matter how icy or scorched the biome actually is.
function planetSubtitle(p) {
  if (p.biomeLabel && (p.inhabited || p.ruined)) return p.biomeLabel;
  return TYPE_DESC[p.type] || planetLabel(p);
}

// --- a very short status hook for the in-scene diegetic labels (#5). Plain
// wild worlds return null (the biome line already says enough). ---------------
export function planetMiniDesc(p) {
  if (p.inhabited) return 'дом цивилизации';
  if (p.colony) {
    // colonyKind (systemData.js): settlements on liveable bands, pressurised
    // domes on hostile ones, the odd terraformed temperate rock.
    if (p.colonyKind === 'dome') return 'купольная база';
    if (p.colonyKind === 'terraformed') return 'терраформированная колония';
    return 'колония-поселение';
  }
  if (p.obliterated) return 'обломки мира';
  if (p.destroyed) return 'мёртвый мир, кратер';
  if (p.robotic) return 'мёртвый мир машин';
  if (p.ruined) return 'безжизненные руины';
  return null;
}
/** Accent colour for a planet's diegetic pin (matches the status palette). */
export function planetAccent(p) {
  if (p.inhabited || p.colony) return STATUS_COLOR.inhabited;
  if (p.ruined) return STATUS_COLOR.ruins;
  return '#aeb8ee';
}
/** A status badge glyph for the diegetic label (#6): home world / colony /
 *  ruins / plain lifeless world — each gets its own mark. */
export function planetStatusIcon(p) {
  if (p.inhabited) return '🏛'; // civilisation homeworld
  if (p.colony) return '🚩'; // colony
  if (p.ruined) return '💀'; // ruins
  return '🌑'; // lifeless world
}

// --- orbital-structure info cards (#6): ring habitats, gas collectors, hubs --
const STRUCTURE_INFO = {
  ring: {
    kindLabel: 'Станция · город-кольцо',
    name: 'Орбитальный город-кольцо',
    desc: 'Огромная вращающаяся станция-кольцо: искусственную тяжесть здесь создаёт само вращение обода. Внутри — целый город: жилые ярусы, верфи и причалы для кораблей со всей системы.',
    meta: [
      ['Тип', 'кольцевой хабитат'],
      ['Население', 'десятки тысяч'],
      ['Назначение', 'столица орбиты, верфь и порт'],
    ],
  },
  collector: {
    kindLabel: 'Станция · сбор газа',
    name: 'Газовый коллектор',
    desc: 'Платформа висит в верхних облаках газового гиганта и черпает из них водород и гелий-3 — топливо для дальних перелётов. Снизу тянутся километровые заборники, сверху швартуются танкеры.',
    meta: [
      ['Тип', 'добывающая платформа'],
      ['Добыча', 'водород · гелий-3'],
      ['Назначение', 'топливо для флота'],
    ],
  },
  outpost: {
    kindLabel: 'Станция · форпост',
    name: 'Орбитальный хаб',
    desc: 'Скромный модульный форпост на орбите: причал, склады и узел связи с метрополией. Отсюда следят за погодой, кораблями и горизонтом.',
    meta: [
      ['Тип', 'модульный форпост'],
      ['Экипаж', 'небольшой гарнизон'],
      ['Назначение', 'причал и связь колонии'],
    ],
  },
};
export function structureCard(planet) {
  const base = STRUCTURE_INFO[planet.stationKind] || STRUCTURE_INFO.outpost;
  const stationName = planet.data && planet.data.stationName;
  // give it the named title («Заря» — a ring city) when the data has a name
  return stationName ? { ...base, name: `${stationName} — ${base.name.toLowerCase()}` } : base;
}

// --- planet detail copy (#6) -----------------------------------------------
const TYPE_DESC = {
  lava: 'Раскалённый вулканический мир',
  rocky: 'Каменистый безатмосферный мир',
  desert: 'Сухой пустынный мир',
  terran: 'Землеподобный мир',
  ocean: 'Океанический мир',
  ice: 'Ледяной, промёрзший мир',
  gas: 'Газовый гигант',
};
const WILD_DESC = {
  lava: 'Кипящие лавовые реки и чёрные базальтовые поля — ни воздуха, ни воды.',
  rocky: 'Голый камень в кратерах, без атмосферы и следов жизни.',
  desert: 'Бескрайние дюны и сухие ветра под жарким солнцем.',
  terran: 'Тёплый мир с водой и воздухом — здесь могла бы быть жизнь.',
  ocean: 'Сплошной океан от полюса до полюса под облачным небом.',
  ice: 'Замёрзший мир: ледяные равнины трещат в полной тишине.',
  gas: 'Исполин из водорода и гелия с вечными штормами в облаках.',
};

function planetDesc(p) {
  if (p.inhabited) {
    // #23: describe what actually orbits the world — a tribal people have no
    // satellites at all, an industrial one has its first probes but no stations,
    // and only a spacefaring civ rings its world with stations and ships.
    if (p.civLevel === 'tribal')
      return 'Живой обитаемый мир: его народ ещё живёт малыми племенами и не вышел в космос — небо над ним пусто, ни спутников, ни станций.';
    if (p.civLevel === 'industrial')
      return 'Живой обитаемый мир: цивилизация только осваивает орбиту — в небе уже кружат первые спутники, но станций и кораблей пока нет.';
    return 'Живой обитаемый мир — сердце космической цивилизации. Вокруг него вращаются станции, спутники и корабли.';
  }
  if (p.colony) return 'Колония переселенцев: на ночной стороне горят огни поселений, рядом висит орбитальный хаб.';
  if (p.obliterated) return 'От планеты остались лишь медленно расходящиеся обломки — её разнесли в пыль.';
  if (p.destroyed) return 'Мёртвый мир со шрамом катастрофы: гигантский кратер пересекает кору.';
  if (p.robotic) return 'Мёртвый мир, где машины до сих пор обслуживают опустевшие города.';
  if (p.ruined) return 'Безжизненные руины давно исчезнувшей цивилизации.';
  return WILD_DESC[p.type] || 'Дикий, нетронутый мир.';
}

// --- planet physical data (#2): the visual radius is unitless; map it to a
// plausible diameter (km) and an Earth-mass, then list what the world is made of.
const KM_PER_UNIT = 19500; // a terran world (r≈0.65) ≈ 12,700 km, like Earth
const TYPE_DENSITY = { lava: 1.0, rocky: 0.95, desert: 0.9, terran: 1.0, ocean: 0.95, ice: 0.5, gas: 0.22 };
const PLANET_RES = {
  lava: ['редкоземельные металлы', 'тяжёлые изотопы', 'сера'],
  rocky: ['железо и никель', 'силикаты', 'редкие металлы'],
  desert: ['кремний', 'соли и руды', 'следы воды'],
  terran: ['вода', 'органика', 'плодородная почва'],
  ocean: ['вода', 'биомасса', 'растворённые соли'],
  ice: ['водяной лёд', 'аммиак', 'летучие соединения'],
  gas: ['водород', 'гелий-3', 'аммиак'],
};

function groupThousands(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); // narrow no-break space
}
function planetDiameterKm(p) {
  return Math.round((p.radius * KM_PER_UNIT) / 100) * 100;
}
function planetMassEarth(p) {
  const d = TYPE_DENSITY[p.type] || 1;
  return 3.59 * Math.pow(p.radius, 3) * d; // calibrated so an Earth-size world ≈ 1⊕
}
function fmtEarths(m) {
  if (m >= 10) return String(Math.round(m));
  if (m >= 1) return m.toFixed(1);
  if (m >= 0.01) return m.toFixed(2);
  return '<0.01';
}
function fmtSolar(m) {
  if (m >= 10) return String(Math.round(m));
  if (m >= 1) return m.toFixed(1);
  return m.toFixed(2);
}
/** Star mass line (#8): how heavy the sun is in Suns (handles binaries). */
function starMassLine(data) {
  const m = data.star.solarMass;
  if (m == null) return '';
  if (data.binary && data.binary.star2.solarMass != null) {
    return `<span><b>Массы звёзд:</b> ≈ ${fmtSolar(m)} + ${fmtSolar(data.binary.star2.solarMass)} ☉</span>`;
  }
  return `<span><b>Масса звезды:</b> ≈ ${fmtSolar(m)} ☉ (Солнц)</span>`;
}

export class InfoPanel {
  constructor({ onBack, onBackToSystem }) {
    this.onBack = onBack;
    this.onBackToSystem = onBackToSystem;
    this._mode = 'system'; // 'system' | 'planet' | 'ship' | 'structure'
    const el = document.createElement('div');
    el.id = 'system-panel';
    el.innerHTML = `
      <h1 class="sp-name"></h1>
      <div class="sp-status"></div>
      <div class="sp-star"></div>
      <div class="sp-flourish">✦</div>
      <p class="sp-desc"></p>

      <div class="sp-section sp-about">
        <div class="sp-about-title sp-sec-title">Об этой системе</div>
        <div class="sp-meta"></div>
        <p class="sp-history"></p>
        <div class="sp-res-block">
          <div class="sp-res-title sp-sec-title">Ресурсы</div>
          <div class="sp-res"></div>
        </div>
      </div>

      <div class="sp-section sp-civ">
        <div class="sp-sec-title">Цивилизация</div>
        <div class="sp-race-head"></div>
        <p class="sp-race-desc"></p>
      </div>
    `;
    document.body.appendChild(el);
    this.el = el;

    // #4: the "Back" control lives OUTSIDE the panel, fixed top-left, so it's
    // always crisp and reachable. It steps up one level (planet→system→galaxy).
    const back = document.createElement('button');
    back.id = 'nav-back';
    back.type = 'button';
    back.textContent = '← Назад';
    back.addEventListener('click', () => this._back());
    document.body.appendChild(back);
    this.backEl = back;

    // #10: the «did you know» tidbit lives in its own card, top-right.
    const fact = document.createElement('div');
    fact.id = 'fact-box';
    document.body.appendChild(fact);
    this.factEl = fact;

    // #15: a side callout parked next to the ranging reticle — carries the
    // focused object's name + type + description (moved out of the left panel).
    const fc = document.createElement('div');
    fc.id = 'focus-callout';
    fc.innerHTML =
      '<div class="fc-name"></div>' +
      '<div class="fc-sub"></div>' +
      '<div class="fc-desc"></div>' +
      '<div class="fc-meta-title">Характеристики</div>' +
      '<div class="fc-meta"></div>' +
      '<div class="fc-res-title">Ресурсы</div>' +
      '<div class="fc-res"></div>';
    document.body.appendChild(fc);
    this.focusEl = fc;
    this._fc = {
      name: fc.querySelector('.fc-name'),
      sub: fc.querySelector('.fc-sub'),
      desc: fc.querySelector('.fc-desc'),
      metaTitle: fc.querySelector('.fc-meta-title'),
      meta: fc.querySelector('.fc-meta'),
      resTitle: fc.querySelector('.fc-res-title'),
      res: fc.querySelector('.fc-res'),
    };
    this.focusActive = false;

    this._r = {
      status: el.querySelector('.sp-status'),
      aboutTitle: el.querySelector('.sp-about-title'),
      resTitle: el.querySelector('.sp-res-title'),
      name: el.querySelector('.sp-name'),
      star: el.querySelector('.sp-star'),
      desc: el.querySelector('.sp-desc'),
      meta: el.querySelector('.sp-meta'),
      history: el.querySelector('.sp-history'),
      res: el.querySelector('.sp-res'),
      resBlock: el.querySelector('.sp-res-block'),
      about: el.querySelector('.sp-about'),
      civ: el.querySelector('.sp-civ'),
      raceHead: el.querySelector('.sp-race-head'),
      raceDesc: el.querySelector('.sp-race-desc'),
      flourish: el.querySelector('.sp-flourish'),
    };

    // keep the ✦ divider exactly as wide as the title above it (fires on every
    // name change / font load, so it never ends up too short or too long)
    if (window.ResizeObserver) {
      this._flourishRO = new ResizeObserver(() => {
        if (this._r.flourish && this._r.name) {
          this._r.flourish.style.width = `${this._r.name.offsetWidth}px`;
        }
      });
      this._flourishRO.observe(this._r.name);
    }
  }

  /** Fill the civilisation block from a race object (alive or extinct). */
  _setRace(race) {
    const r = this._r;
    if (race) {
      r.civ.style.display = '';
      r.raceHead.innerHTML =
        `<span class="race-name">${race.name}</span>` +
        `<span class="tag ${race.extinct ? 'tag-ruin' : 'tag-live'}">${race.stageLabel}</span>`;
      r.raceDesc.innerHTML = race.lore
        ? race.lore.map((para) => `<p>${para}</p>`).join('')
        : `<p>${race.description || ''}</p>`;
    } else {
      r.civ.style.display = 'none';
    }
  }

  /** Show/hide the top-right fact card (#10) — only the system view has one. */
  _setFact(fact) {
    if (fact) {
      this.factEl.innerHTML = `<div class="fact-head">✦ Заметка на полях</div><p></p>`;
      this.factEl.querySelector('p').textContent = fact;
      this.factEl.classList.add('visible');
    } else {
      this.factEl.classList.remove('visible');
    }
  }

  /** Fill the side callout: focused object's name + type + description +
   *  characteristics (mono data rows) + resources (chips). */
  _setFocusCallout(name, sub, desc, metaHtml, resHtml) {
    const fc = this._fc;
    // name + type already head the left panel — keep them out of the callout to
    // avoid duplication; the callout is purely the spec sheet (desc + data + res).
    fc.name.style.display = 'none';
    fc.sub.style.display = 'none';
    fc.desc.textContent = desc || '';
    fc.desc.style.display = desc ? '' : 'none';
    fc.meta.innerHTML = metaHtml || '';
    fc.meta.style.display = metaHtml ? '' : 'none';
    fc.metaTitle.style.display = metaHtml ? '' : 'none';
    fc.res.innerHTML = resHtml || '';
    fc.res.style.display = resHtml ? '' : 'none';
    fc.resTitle.style.display = resHtml ? '' : 'none';
    this.focusActive = !!(desc || metaHtml || resHtml);
  }
  _clearFocusCallout() {
    this.focusActive = false;
    this.focusEl.classList.remove('visible');
  }

  show(data) {
    const r = this._r;
    this._mode = 'system';
    this.backEl.textContent = '← Назад к галактике';
    this.backEl.classList.add('visible');
    r.aboutTitle.textContent = 'Об этой системе';
    const color = data.event ? '#ffcf6e' : data.special ? SPECIAL_COLOR : STATUS_COLOR[data.status];
    r.status.textContent = (data.event ? '✦ СОБЫТИЕ · ' : '') + data.statusLabel;
    r.status.style.color = color;
    r.status.style.borderColor = color;
    r.name.textContent = data.name;
    // #18: a binary system must read as two suns, not one.
    r.star.textContent = data.binary
      ? `Двойная звезда · ${data.star.label} + ${data.binary.star2.label}`
      : `${data.star.label} — ${data.star.desc}`;
    r.about.style.display = '';
    r.desc.style.display = '';
    r.desc.textContent = stripUniverseTag(data.description);
    this._clearFocusCallout(); // the system view has no focus callout

    // about: age + star mass (#8) + use + history; NO resources here (#3)
    r.meta.innerHTML =
      `<span><b>Возраст:</b> ${data.ageGyr} млрд лет</span>` +
      starMassLine(data) +
      `<span><b>Назначение:</b> ${data.useFor}</span>`;
    r.history.textContent = stripUniverseTag(data.history);
    r.resBlock.style.display = 'none';

    this._setFact(data.fact); // tidbit → top-right (#10)

    // the civilisation story lives ONLY on its home planet's card now, not here.
    this._setRace(null);

    this.el.scrollTop = 0;
    this.el.classList.add('visible');
  }

  /** Planet detail card (#2) — diameter, mass, resources; cinematic. */
  showPlanet(p, name) {
    const r = this._r;
    this._mode = 'planet';
    this.backEl.textContent = '← Назад к системе';
    this.backEl.classList.add('visible');
    r.aboutTitle.textContent = 'О планете';
    const color = p.inhabited || p.colony ? STATUS_COLOR.inhabited : p.ruined ? STATUS_COLOR.ruins : STATUS_COLOR.wild;
    r.status.textContent = p.inhabited ? 'Обитаемая планета' : p.colony ? 'Колония' : p.ruined ? 'Мёртвый мир' : 'Планета';
    r.status.style.color = color;
    r.status.style.borderColor = color;
    r.name.textContent = name || planetLabel(p);
    r.star.textContent = planetSubtitle(p);
    // label + description + characteristics + resources all live in the side
    // callout by the reticle now; the left panel keeps status/name + civilisation.
    r.desc.textContent = '';
    r.desc.style.display = 'none';
    const moonN = p.moons ? p.moons.length : 0;
    const metaHtml =
      `<span><b>Диаметр:</b> ≈ ${groupThousands(planetDiameterKm(p))} км</span>` +
      `<span><b>Масса:</b> ≈ ${fmtEarths(planetMassEarth(p))} ⊕ (Земли)</span>` +
      (moonN ? `<span><b>Луны:</b> ${moonN}</span>` : '');
    const res = p.obliterated ? [] : PLANET_RES[p.type] || [];
    const resHtml = res.map((x) => `<span class="chip">${x}</span>`).join('');
    this._setFocusCallout(name || planetLabel(p), planetSubtitle(p), stripUniverseTag(p.ref || planetDesc(p)), metaHtml, resHtml);
    r.history.textContent = '';
    r.about.style.display = 'none'; // characteristics + resources moved to the callout

    // civilisation lore on the home planet — alive OR dead (#7): a ruined world
    // still tells the story of who lived (and died) there.
    this._setRace((p.inhabited || p.ruined) && p.race ? p.race : null);
    this._setFact(null);
    this.el.scrollTop = 0;
    this.el.classList.add('visible');
  }

  /** Ship detail card (#6) — flagships & traffic. `ship` carries a flagship's
   *  own name + unique story (#H), if any. */
  showShip(role, faction, ship) {
    const r = this._r;
    this._mode = 'ship';
    this.backEl.textContent = '← Назад к системе';
    this.backEl.classList.add('visible');
    r.aboutTitle.textContent = 'Характеристики';
    const color = '#bcd0ff';
    const named = ship && ship.name;
    r.status.textContent = named ? 'Флагман флота' : `Корабль · ${role.size}`;
    r.status.style.color = color;
    r.status.style.borderColor = color;
    r.name.textContent = named || role.name;
    r.star.textContent = faction && faction.name ? `Флот: ${faction.name}` : 'Корабль';
    // story + label + specs all move to the side callout by the reticle (#15)
    r.desc.textContent = '';
    r.desc.style.display = 'none';
    const metaHtml =
      `<span><b>Класс:</b> ${role.name}</span>` +
      `<span><b>Длина:</b> ${role.lengthM} м</span>` +
      `<span><b>Скорость:</b> ${role.speed}</span>` +
      `<span><b>Экипаж:</b> ${role.crew}</span>` +
      `<span><b>Вооружение:</b> ${role.arm}</span>`;
    this._setFocusCallout(
      named || role.name,
      faction && faction.name ? `Флот: ${faction.name}` : 'Корабль',
      stripUniverseTag(ship && ship.lore ? ship.lore.join(' ') : role.desc),
      metaHtml,
      '',
    );
    r.history.textContent = '';
    r.about.style.display = 'none';
    this._setRace(null);
    this._setFact(null);
    this.el.scrollTop = 0;
    this.el.classList.add('visible');
  }

  /** Structure detail card (#6) — stations, gas collectors, orbital hubs. */
  showStructure(info, faction) {
    const r = this._r;
    this._mode = 'structure';
    this.backEl.textContent = '← Назад к системе';
    this.backEl.classList.add('visible');
    r.aboutTitle.textContent = 'Характеристики';
    const color = '#bcd0ff';
    r.status.textContent = info.kindLabel;
    r.status.style.color = color;
    r.status.style.borderColor = color;
    r.name.textContent = info.name;
    r.star.textContent = faction && faction.name ? `Постройка флота: ${faction.name}` : 'Орбитальная постройка';
    r.desc.textContent = '';
    r.desc.style.display = 'none';
    const metaHtml = (info.meta || []).map(([k, v]) => `<span><b>${k}:</b> ${v}</span>`).join('');
    this._setFocusCallout(info.name, info.kindLabel, stripUniverseTag(info.desc), metaHtml, '');
    r.history.textContent = '';
    r.about.style.display = 'none';
    this._setRace(null);
    this._setFact(null);
    this.el.scrollTop = 0;
    this.el.classList.add('visible');
  }

  _back() {
    if (this._mode !== 'system') {
      if (this.onBackToSystem) this.onBackToSystem();
    } else if (this.onBack) {
      this.onBack();
    }
  }

  hide() {
    this.el.classList.remove('visible');
    this.backEl.classList.remove('visible');
    this.factEl.classList.remove('visible');
    this._clearFocusCallout();
  }
}

export class Tooltip {
  constructor() {
    const el = document.createElement('div');
    el.id = 'system-tooltip';
    document.body.appendChild(el);
    this.el = el;
  }

  show(data, x, y, visited) {
    // Discovery mechanic: an undiscovered system is anonymous — hovering reveals
    // only "uncharted", never its status or contents (that's the reward for
    // diving in). The galactic-centre black hole (noFade) is always revealed.
    if (!visited && !data.noFade) {
      const label = data.special ? 'Неопознанный объект' : 'Неопознанная система';
      this.el.innerHTML =
        `<div class="tt-name">${label}</div>` +
        `<div class="tt-status" style="color:var(--parchment)">не исследована</div>` +
        `<div class="tt-teaser">Нажмите, чтобы исследовать →</div>`;
      this.el.style.left = `${x + 16}px`;
      this.el.style.top = `${y + 14}px`;
      this.el.classList.add('visible');
      return;
    }
    // a little real info on hover (#9) — laid out as aligned key→value rows
    // (a small table) rather than one long «·»-separated enumeration.
    const rows = [];
    if (data.kind === 'blackhole') {
      rows.push(['Объект', data.star.label]);
      if (data.star.desc) rows.push(['Масштаб', data.star.desc]);
    } else {
      const n = data.planets ? data.planets.length : 0;
      const home = data.planets && data.planets.find((p) => p.inhabited);
      if (data.binary) {
        rows.push([
          'Звёзды',
          `${data.star.label.replace(/\s*\(.\)/, '')} + ${data.binary.star2.label.replace(/\s*\(.\)/, '')}`,
        ]);
      } else {
        rows.push(['Звезда', data.star.label.replace(/\s*\(.\)/, '')]);
      }
      rows.push(['Планет', String(n)]);
      if (home) {
        rows.push(['Эпоха', home.civLabel]);
        if (home.race) rows.push(['Народ', home.race.name]);
      }
    }
    const rowsHtml = rows.map(([k, v]) => `<span class="tt-k">${k}</span><span class="tt-v">${v}</span>`).join('');
    const teaser = visited
      ? '<div class="tt-teaser tt-seen">✓ Исследована · открыть снова</div>'
      : '<div class="tt-teaser">Нажмите, чтобы исследовать →</div>';
    // special encounters read magenta with a ✦; otherwise the status palette
    const color = data.special ? SPECIAL_COLOR : STATUS_COLOR[data.status] || '#aab0e0';
    const mark = data.special ? '✦ ' : '';
    this.el.innerHTML =
      `<div class="tt-name">${data.name}</div>` +
      `<div class="tt-status" style="color:${color}">${mark}${data.statusLabel}</div>` +
      `<div class="tt-rows">${rowsHtml}</div>` +
      teaser;
    this.el.style.left = `${x + 16}px`;
    this.el.style.top = `${y + 14}px`;
    this.el.classList.add('visible');
  }

  /** A lightweight hover card for a planet / ship in the system view (#6/#7). */
  showSimple(title, sub, x, y) {
    this.el.innerHTML = `<div class="tt-name">${title}</div><div class="tt-teaser">${sub}</div>`;
    this.el.style.left = `${x + 16}px`;
    this.el.style.top = `${y + 14}px`;
    this.el.classList.add('visible');
  }

  hide() {
    this.el.classList.remove('visible');
  }
}

export class Legend {
  constructor() {
    const el = document.createElement('div');
    el.id = 'system-legend';
    el.innerHTML = `
      <div class="lg-title">Звёздная опись</div>
      <div class="lg-row"><span class="lg-dot" style="color:${STATUS_COLOR.inhabited}"></span>Обитаемые</div>
      <div class="lg-row"><span class="lg-dot" style="color:${STATUS_COLOR.wild}"></span>Дикие</div>
      <div class="lg-row"><span class="lg-dot" style="color:${STATUS_COLOR.ruins}"></span>Руины</div>
      <div class="lg-row"><span class="lg-dot" style="color:${SPECIAL_COLOR}"></span>Особые</div>
      <div class="lg-prog">Вписано в карту <b>0</b> / 0</div>
    `;
    document.body.appendChild(el);
    this.el = el;
    this._prog = el.querySelector('.lg-prog');
  }

  setProgress(n, total) {
    this._prog.innerHTML = `Вписано в карту <b>${n}</b> / ${total}`;
  }

  setVisible(v) {
    this.el.classList.toggle('visible', v);
  }
}

export class Overlay {
  constructor() {
    const el = document.createElement('div');
    el.id = 'warp-overlay';
    document.body.appendChild(el);
    this.el = el;
  }

  /** Fade to a target opacity over `ms`, resolving when done. */
  fadeTo(opacity, ms) {
    return new Promise((resolve) => {
      this.el.style.transition = `opacity ${ms}ms ease`;
      this.el.style.pointerEvents = opacity > 0.01 ? 'auto' : 'none';
      void this.el.offsetWidth; // force reflow so the transition applies
      this.el.style.opacity = String(opacity);
      setTimeout(resolve, ms);
    });
  }
}
