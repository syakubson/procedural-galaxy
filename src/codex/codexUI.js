// The codex panel: a full-screen modal listing every archetype the player has
// ever discovered, across every save (see codex.js's header — it's a
// PERMANENT, cross-party log). Built once and toggled via an `.open` class,
// the same opacity+transform+pointer-events idiom every other cartographer
// overlay uses (#help-panel) — never a display:none swap. Reads ONLY through
// codex.js's public API (list/progress/curiosities) and codexData.js's
// catalogs; it never touches storage.js directly.

import { catalogFor } from './codexData.js';
import { curiosities, list, progress } from './codex.js';
import { buildFor } from './codexViewer.js';

// Tab order + RU labels, as specified — deliberately NOT codexData's own
// CATEGORIES declaration order (that one groups by catalog-build order, this
// one is the reading order a player should browse the codex in). 'system' has
// no finite catalog (see codex.js's progress()) but still gets its own tab —
// the log of every system charted so far.
const TABS = [
  { id: 'system', label: 'Системы' },
  { id: 'planet', label: 'Планеты' },
  { id: 'race', label: 'Расы' },
  { id: 'ruin', label: 'Руины' },
  { id: 'ship', label: 'Корабли' },
  { id: 'station', label: 'Станции' },
  { id: 'phenomenon', label: 'Явления' },
];

export class CodexUI {
  /**
   * @param {object} deps
   * @param {import('../ui/objectViewer.js').ObjectViewer} deps.objectViewer the
   *   isolated-canvas viewer «Рассмотреть» opens a find in.
   * @param {() => import('../state/overlay.js').WorldOverlay} deps.getOverlay
   *   returns the CURRENT party's world overlay (a live getter, not a
   *   snapshot — the overlay instance is replaced whenever the seed changes).
   * @param {() => number} deps.getSystemTotal returns the current party's
   *   chartable system count — the denominator for the 'system' tab's
   *   progress line (there's no finite catalog to size it from).
   * @param {() => string} deps.getPartyId returns the CURRENT party's id. The
   *   codex log itself is cross-party (every galaxy's systems accumulate in
   *   the shelf), but the 'system' progress line must count only THIS party's
   *   finds — otherwise a seed change makes «Найдено X / Y» exceed its own
   *   denominator.
   */
  constructor({ objectViewer, getOverlay, getSystemTotal, getPartyId }) {
    this._objectViewer = objectViewer;
    this._getOverlay = getOverlay || (() => null);
    this._getSystemTotal = getSystemTotal || (() => 0);
    this._getPartyId = getPartyId || (() => null);
    this._activeCat = TABS[0].id;
    this._open = false;
    this._build();
  }

  get isOpen() {
    return this._open;
  }

  open() {
    this._open = true;
    this.el.classList.add('open');
    this.el.setAttribute('aria-hidden', 'false');
    this._render();
  }

  close() {
    this._open = false;
    this.el.classList.remove('open');
    this.el.setAttribute('aria-hidden', 'true');
  }

  /** Build the DOM once; every open() just re-renders its contents fresh. */
  _build() {
    const el = document.createElement('div');
    el.id = 'codex-panel';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="codex-backdrop"></div>' +
      '<div class="codex-card" role="dialog" aria-label="Кодекс">' +
      '<button type="button" class="codex-close" aria-label="Закрыть">×</button>' +
      '<div class="codex-title">Кодекс</div>' +
      '<div class="codex-tabs"></div>' +
      '<div class="codex-scroll">' +
      '<div class="codex-prog lg-prog"></div>' +
      '<div class="codex-shelf"></div>' +
      '<div class="codex-showcase">' +
      '<div class="codex-showcase-title">Витрина курьёзов</div>' +
      '<div class="codex-showcase-row"></div>' +
      '</div>' +
      '</div>' +
      '</div>';
    document.body.appendChild(el);
    this.el = el;

    this._r = {
      tabs: el.querySelector('.codex-tabs'),
      prog: el.querySelector('.codex-prog'),
      shelf: el.querySelector('.codex-shelf'),
      showcase: el.querySelector('.codex-showcase'),
      showcaseRow: el.querySelector('.codex-showcase-row'),
    };

    for (const tab of TABS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'codex-tab';
      btn.textContent = tab.label;
      btn.dataset.cat = tab.id;
      btn.addEventListener('click', () => {
        this._activeCat = tab.id;
        this._render();
      });
      this._r.tabs.appendChild(btn);
    }

    el.querySelector('.codex-close').addEventListener('click', () => this.close());
    el.querySelector('.codex-backdrop').addEventListener('click', () => this.close());
  }

  /** Redraw the active tab's shelf + progress line + the curiosities showcase
   *  (the showcase spans every category, so it's refreshed on every render). */
  _render() {
    for (const btn of this._r.tabs.children) btn.classList.toggle('on', btn.dataset.cat === this._activeCat);

    const cat = this._activeCat;
    const catalog = catalogFor(cat); // null for 'system' — no finite catalog
    if (cat === 'system') {
      // Progress is scoped to the CURRENT party (numerator and denominator
      // from the same galaxy) — the shelf below still lists every party's
      // systems, since the codex log itself never resets.
      const partyId = this._getPartyId();
      const found = list(cat).filter((e) => e.batchId === partyId).length;
      this._r.prog.innerHTML = `В этой галактике: <b>${found}</b> / ${this._getSystemTotal()}`;
    } else {
      const { found, total: totalCount } = progress(cat);
      this._r.prog.innerHTML = `Найдено <b>${found}</b> / ${totalCount}`;
    }

    this._r.shelf.innerHTML = '';
    if (catalog) {
      // a full shelf, every catalog slot in its fixed place — discovered ones
      // show their name, the rest stay anonymous placeholders (counted in the
      // progress line, never spoiled by name).
      const byKey = new Map(list(cat).map((e) => [e.archetypeKey, e]));
      for (const c of catalog) {
        const entry = byKey.get(c.archetypeKey);
        this._r.shelf.appendChild(entry ? this._slot(entry) : this._unknownSlot());
      }
    } else {
      // 'system' has no catalog to lay out in advance — just the discovery log.
      const entries = list(cat);
      if (!entries.length) {
        const empty = document.createElement('div');
        empty.className = 'codex-empty';
        empty.textContent = 'Пока ничего не найдено.';
        this._r.shelf.appendChild(empty);
      } else {
        for (const entry of entries) this._r.shelf.appendChild(this._slot(entry));
      }
    }

    this._r.showcaseRow.innerHTML = '';
    const curios = curiosities();
    this._r.showcase.classList.toggle('empty', !curios.length);
    for (const entry of curios) this._r.showcaseRow.appendChild(this._slot(entry));
  }

  /** A discovered entry's card: label (+ a curiosity mark) and, for anything
   *  codexViewer.js can actually rebuild, a «Рассмотреть» button. 'system' has
   *  no standalone find (codexViewer.buildFor returns a no-op for it) — no
   *  button there. */
  _slot(entry) {
    const el = document.createElement('div');
    el.className = 'codex-slot found';
    const curio = entry.curiosity ? '<span class="codex-curio" title="Курьёз">✦</span>' : '';
    el.innerHTML = `<div class="codex-slot-label">${entry.label}${curio}</div>`;
    if (entry.category !== 'system') {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'codex-slot-btn';
      btn.textContent = 'Рассмотреть';
      btn.addEventListener('click', () => this._view(entry));
      el.appendChild(btn);
    }
    return el;
  }

  /** An uncounted catalog slot the player hasn't reached yet — a shape, not a name. */
  _unknownSlot() {
    const el = document.createElement('div');
    el.className = 'codex-slot unknown';
    el.innerHTML = '<div class="codex-slot-label">?</div>';
    return el;
  }

  /** Rebuild the exact find behind `entry` and hand it to the isolated
   *  object viewer (codexViewer.js drives the SAME generators/classes the
   *  live game already used — no new visuals). */
  _view(entry) {
    const build = buildFor(entry, { overlay: this._getOverlay() });
    this._objectViewer.open(build);
  }
}
