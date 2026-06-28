// HUD overlays for system exploration: the lore InfoPanel (system overview +
// history/resources + civilisation + planets with mini-icons), a hover Tooltip
// with a curiosity-gap teaser, a discovery Legend/counter, and a fade Overlay
// for the warp transition. All plain DOM, styled via classes in styles.css.

const STATUS_COLOR = {
  inhabited: '#7dffb0',
  ruins: '#ffb066',
  wild: '#5aa0ff',
  blackhole: '#c8b0ff',
};

// magenta — hand-crafted easter-egg systems (#13/#19/#20)
const SPECIAL_COLOR = '#e879ff';

const TYPE_LABEL = {
  lava: 'Лавовая',
  rocky: 'Каменистая',
  desert: 'Пустынная',
  terran: 'Земного типа',
  ocean: 'Океаническая',
  ice: 'Ледяная',
  gas: 'Газовый гигант',
};

/** A CSS "mini planet": a lit sphere (highlight + terminator shadow) + a ring. */
function planetIcon(p) {
  const base = p.type === 'lava' ? '#ff7a2e' : p.def && p.def.c2 ? p.def.c2 : '#8a8a90';
  const grad = `radial-gradient(circle at 33% 30%, rgba(255,255,255,0.9), ${base} 42%, rgba(0,0,0,0.6) 100%)`;
  const ring = p.hasRings ? '<span class="pi-ring"></span>' : '';
  return `<span class="pi">${ring}<span class="pi-ball" style="background:${grad}"></span></span>`;
}

function planetLabel(p) {
  if (p.label) return p.label; // hand-named special-system planets (#13/#19/#20)
  if (p.biomeLabel && (p.inhabited || p.ruined)) return p.biomeLabel;
  return TYPE_LABEL[p.type] || p.type;
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
  if (p.inhabited) return 'Живой обитаемый мир — сердце местной цивилизации. Вокруг него вращаются станции, спутники и корабли.';
  if (p.colony) return 'Колония переселенцев: на ночной стороне горят огни поселений, рядом висит орбитальный хаб.';
  if (p.obliterated) return 'От планеты остались лишь медленно расходящиеся обломки — её разнесли в пыль.';
  if (p.destroyed) return 'Мёртвый мир со шрамом катастрофы: гигантский кратер пересекает кору.';
  if (p.robotic) return 'Мёртвый мир, где машины до сих пор обслуживают опустевшие города.';
  if (p.ruined) return 'Безжизненные руины давно исчезнувшей цивилизации.';
  return WILD_DESC[p.type] || 'Дикий, нетронутый мир.';
}

function planetFeatures(p) {
  const t = [];
  if (p.inhabited) t.push('<span class="tag tag-live">обитаема</span>');
  else if (p.colony) t.push('<span class="tag tag-live">колония</span>');
  if (p.ruined) {
    const l = p.obliterated ? 'уничтожена' : p.destroyed ? 'кратер' : p.robotic ? 'роботы' : 'руины';
    t.push(`<span class="tag tag-ruin">${l}</span>`);
  }
  if (p.hasRings) t.push('<span class="tag">кольца</span>');
  if (p.moons && p.moons.length) t.push(`<span class="tag">${p.moons.length} ◐ луны</span>`);
  if (p.civObjects && p.civObjects.station) t.push('<span class="tag">орбитальная станция</span>');
  if (p.colonyStation) t.push('<span class="tag">орбитальный хаб</span>');
  if (p.gasStation) t.push('<span class="tag">газовый коллектор</span>');
  return t;
}

export class InfoPanel {
  constructor({ onBack, onBackToSystem }) {
    this.onBack = onBack;
    this.onBackToSystem = onBackToSystem;
    this._mode = 'system'; // 'system' | 'planet' | 'ship'
    const el = document.createElement('div');
    el.id = 'system-panel';
    el.innerHTML = `
      <button class="sp-back" type="button">← Назад к галактике</button>
      <div class="sp-status"></div>
      <h1 class="sp-name"></h1>
      <div class="sp-star"></div>
      <p class="sp-desc"></p>

      <div class="sp-section">
        <div class="sp-sec-title">Об этой системе</div>
        <div class="sp-meta"></div>
        <p class="sp-history"></p>
        <div class="sp-res-block">
          <div class="sp-res-title">Ресурсы</div>
          <div class="sp-res"></div>
        </div>
      </div>

      <div class="sp-section sp-civ">
        <div class="sp-sec-title">Цивилизация</div>
        <div class="sp-race-head"></div>
        <p class="sp-race-desc"></p>
      </div>

      <div class="sp-section sp-planets-sec">
        <div class="sp-sec-title">Планеты</div>
        <ul class="sp-planets"></ul>
      </div>

      <div class="sp-fact"></div>
    `;
    document.body.appendChild(el);
    this.el = el;
    this._backBtn = el.querySelector('.sp-back');
    this._backBtn.addEventListener('click', () => this._back());
    this._r = {
      status: el.querySelector('.sp-status'),
      resTitle: el.querySelector('.sp-res-title'),
      name: el.querySelector('.sp-name'),
      star: el.querySelector('.sp-star'),
      desc: el.querySelector('.sp-desc'),
      meta: el.querySelector('.sp-meta'),
      history: el.querySelector('.sp-history'),
      res: el.querySelector('.sp-res'),
      resBlock: el.querySelector('.sp-res-block'),
      civ: el.querySelector('.sp-civ'),
      raceHead: el.querySelector('.sp-race-head'),
      raceDesc: el.querySelector('.sp-race-desc'),
      planets: el.querySelector('.sp-planets'),
      planetsSec: el.querySelector('.sp-planets-sec'),
      fact: el.querySelector('.sp-fact'),
    };
  }

  show(data) {
    const r = this._r;
    this._mode = 'system';
    this._backBtn.textContent = '← Назад к галактике';
    if (r.resTitle) r.resTitle.textContent = 'Ресурсы';
    const color = data.special ? SPECIAL_COLOR : STATUS_COLOR[data.status];
    r.status.textContent = data.statusLabel;
    r.status.style.color = color;
    r.status.style.borderColor = color;
    r.name.textContent = data.name;
    // #18: a binary system must read as two suns, not one.
    r.star.textContent = data.binary
      ? `Двойная звезда · ${data.star.label} + ${data.binary.star2.label}`
      : `${data.star.label} — ${data.star.desc}`;
    r.desc.textContent = data.description;

    // about: age + use + history + resources
    r.meta.innerHTML =
      `<span><b>Возраст:</b> ${data.ageGyr} млрд лет</span>` +
      `<span><b>Назначение:</b> ${data.useFor}</span>`;
    r.history.textContent = data.history;
    const res = data.resources || [];
    r.res.innerHTML = res.map((x) => `<span class="chip">${x}</span>`).join('');
    r.resBlock.style.display = res.length ? '' : 'none';

    // physics "did you know" tidbit
    r.fact.textContent = data.fact ? '💡 ' + data.fact : '';
    r.fact.style.display = data.fact ? '' : 'none';

    // planets section hidden for star-less objects (black holes)
    r.planetsSec.style.display = data.planets && data.planets.length ? '' : 'none';

    // civilisation (only if a planet here is inhabited and has a race)
    const home = data.planets.find((p) => p.inhabited && p.race);
    if (home) {
      r.civ.style.display = '';
      r.raceHead.innerHTML =
        `<span class="race-name">${home.race.name}</span>` +
        `<span class="tag tag-live">${home.race.stageLabel}</span>`;
      r.raceDesc.textContent = home.race.description;
    } else {
      r.civ.style.display = 'none';
    }

    // planets
    r.planets.innerHTML = '';
    for (const p of data.planets) {
      const li = document.createElement('li');
      const tags = [];
      if (p.inhabited) tags.push('<span class="tag tag-live">обитаема</span>');
      else if (p.colony) tags.push('<span class="tag tag-live">колония</span>');
      if (p.ruined) {
        const lbl = p.obliterated ? 'уничтожена' : p.destroyed ? 'кратер' : p.robotic ? 'роботы' : 'руины';
        tags.push(`<span class="tag tag-ruin">${lbl}</span>`);
      }
      if (p.hasRings) tags.push('<span class="tag">кольца</span>');
      if (p.moons.length) tags.push(`<span class="tag">${p.moons.length} ◐</span>`);
      // mark planets that belong to a special easter-egg system
      if (data.special) tags.push(`<span class="tag" style="border-color:${SPECIAL_COLOR};color:${SPECIAL_COLOR}">✦</span>`);
      li.innerHTML =
        planetIcon(p) +
        `<span class="pt">${planetLabel(p)}</span>` +
        `<span class="tags">${tags.join('')}</span>`;
      r.planets.appendChild(li);
    }

    // scroll back to top for the new system
    this.el.scrollTop = 0;
    this.el.classList.add('visible');
  }

  /** Planet detail card in the same panel (#6). */
  showPlanet(p) {
    const r = this._r;
    this._mode = 'planet';
    this._backBtn.textContent = '← Назад к системе';
    if (r.resTitle) r.resTitle.textContent = 'Что на планете';
    const color = p.inhabited || p.colony ? STATUS_COLOR.inhabited : p.ruined ? STATUS_COLOR.ruins : STATUS_COLOR.wild;
    r.status.textContent = p.inhabited ? 'Обитаемая планета' : p.colony ? 'Колония' : p.ruined ? 'Мёртвый мир' : 'Планета';
    r.status.style.color = color;
    r.status.style.borderColor = color;
    r.name.textContent = planetLabel(p);
    r.star.textContent = TYPE_DESC[p.type] || planetLabel(p);
    r.desc.textContent = planetDesc(p);
    r.meta.innerHTML =
      `<span><b>Радиус:</b> ${p.radius.toFixed(2)} (усл.)</span>` +
      `<span><b>Орбита:</b> ${p.orbit.toFixed(1)}</span>` +
      `<span><b>Луны:</b> ${p.moons ? p.moons.length : 0}</span>` +
      `<span><b>Кольца:</b> ${p.hasRings ? 'есть' : 'нет'}</span>`;
    r.history.textContent = '';
    const feats = planetFeatures(p);
    r.res.innerHTML = feats.join('');
    r.resBlock.style.display = feats.length ? '' : 'none';
    if (p.inhabited && p.race) {
      r.civ.style.display = '';
      r.raceHead.innerHTML =
        `<span class="race-name">${p.race.name}</span>` + `<span class="tag tag-live">${p.race.stageLabel}</span>`;
      r.raceDesc.textContent = p.race.description;
    } else {
      r.civ.style.display = 'none';
    }
    r.planetsSec.style.display = 'none';
    r.fact.style.display = 'none';
    this.el.scrollTop = 0;
    this.el.classList.add('visible');
  }

  /** Ship detail card in the same panel (#7). */
  showShip(role, faction) {
    const r = this._r;
    this._mode = 'ship';
    this._backBtn.textContent = '← Назад к системе';
    const color = '#bcd0ff';
    r.status.textContent = `Корабль · ${role.size}`;
    r.status.style.color = color;
    r.status.style.borderColor = color;
    r.name.textContent = role.name;
    r.star.textContent = faction && faction.name ? `Флот: ${faction.name}` : 'Корабль';
    r.desc.textContent = role.desc;
    r.meta.innerHTML =
      `<span><b>Длина:</b> ${role.lengthM} м</span>` +
      `<span><b>Скорость:</b> ${role.speed}</span>` +
      `<span><b>Экипаж:</b> ${role.crew}</span>` +
      `<span><b>Вооружение:</b> ${role.arm}</span>` +
      `<span><b>Назначение:</b> ${role.purpose}</span>`;
    r.history.textContent = faction && faction.lore ? faction.lore : '';
    r.resBlock.style.display = 'none';
    r.civ.style.display = 'none';
    r.planetsSec.style.display = 'none';
    r.fact.style.display = 'none';
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
    // a little real info on hover (#9), then a curiosity-gap teaser
    let info;
    if (data.kind === 'blackhole') {
      info = data.star.label;
    } else {
      const n = data.planets ? data.planets.length : 0;
      const home = data.planets && data.planets.find((p) => p.inhabited);
      // #17: planet count + star, and for inhabited worlds the civ stage + race
      const starName = data.binary
        ? `двойная: ${data.star.label.replace(/\s*\(.\)/, '')} + ${data.binary.star2.label.replace(/\s*\(.\)/, '')}`
        : data.star.label.replace(/\s*\(.\)/, '');
      let extra = '';
      if (home) {
        extra = ` · ${home.civLabel}` + (home.race ? ` · ${home.race.name}` : '');
      }
      info = `${starName} · планет: ${n}${extra}`;
    }
    const teaser = visited
      ? '<span class="tt-teaser tt-seen">✓ исследована · открыть снова</span>'
      : '<span class="tt-teaser">нажмите, чтобы исследовать →</span>';
    this.el.innerHTML =
      `<b>${data.name}</b>` +
      `<span style="color:${STATUS_COLOR[data.status]}">${data.statusLabel}</span>` +
      `<span class="tt-info">${info}</span>` +
      teaser;
    this.el.style.left = `${x + 16}px`;
    this.el.style.top = `${y + 14}px`;
    this.el.classList.add('visible');
  }

  /** A lightweight hover card for a planet / ship in the system view (#6/#7). */
  showSimple(title, sub, x, y) {
    this.el.innerHTML = `<b>${title}</b><span class="tt-teaser">${sub}</span>`;
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
      <div class="lg-title">Системы</div>
      <div class="lg-row"><span class="lg-dot" style="background:${STATUS_COLOR.inhabited}"></span>обитаемые</div>
      <div class="lg-row"><span class="lg-dot" style="background:${STATUS_COLOR.wild}"></span>дикие</div>
      <div class="lg-row"><span class="lg-dot" style="background:${STATUS_COLOR.ruins}"></span>руины</div>
      <div class="lg-row"><span class="lg-dot" style="background:${SPECIAL_COLOR}"></span>особые</div>
      <div class="lg-prog">Исследовано <b>0</b> / 0</div>
    `;
    document.body.appendChild(el);
    this.el = el;
    this._prog = el.querySelector('.lg-prog');
  }

  setProgress(n, total) {
    this._prog.innerHTML = `Исследовано <b>${n}</b> / ${total}`;
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
