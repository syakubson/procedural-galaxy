// The codex panel: a full-screen modal listing every archetype the player has
// ever discovered, across every save (see codex.js's header — it's a
// PERMANENT, cross-party log). Built once and toggled via an `.open` class,
// the same opacity+transform+pointer-events idiom every other cartographer
// overlay uses (#help-panel) — never a display:none swap.
//
// The shelf is a gallery of cards: a discovered card shows a rendered
// thumbnail (thumbnails.js) of the actual find and opens a detail dialog on
// click; an undiscovered slot shows a per-category placeholder glyph
// (codexIcons.js) — counted, never named. The detail dialog carries the full
// description plus two actions: «Рассмотреть» (the isolated 3D viewer) and
// «Перейти к объекту» (warp to it in the live galaxy, via onNavigate).
//
// Reads ONLY through codex.js's public API (list/progress/curiosities) and
// codexData.js's catalogs/describeEntry; it never touches storage.js directly.

import { catalogFor, describeEntry } from './codexData.js';
import { curiosities, list, progress } from './codex.js';
import { categoryIcon } from './codexIcons.js';
import { buildFor } from './codexViewer.js';
import { thumbnailFor, releaseThumbnailRenderer } from './thumbnails.js';

// Tab order + RU labels. 'system' has no finite catalog (see codex.js's
// progress()) but still gets its own tab — the log of every system charted.
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
   *   returns the CURRENT party's world overlay (a live getter — the overlay
   *   instance is replaced whenever the seed changes).
   * @param {() => number} deps.getSystemTotal returns the current party's
   *   chartable system count — the denominator for the 'system' tab.
   * @param {() => string} deps.getPartyId returns the CURRENT party's id, so the
   *   'system' progress can count only THIS galaxy's finds.
   * @param {(entry: object) => void} deps.onNavigate warp to a find in the live
   *   galaxy (closes the codex first). Given a codex Entry.
   */
  constructor({ objectViewer, getOverlay, getSystemTotal, getPartyId, onNavigate }) {
    this._objectViewer = objectViewer;
    this._getOverlay = getOverlay || (() => null);
    this._getSystemTotal = getSystemTotal || (() => 0);
    this._getPartyId = getPartyId || (() => null);
    this._onNavigate = onNavigate || (() => {});
    this._activeCat = TABS[0].id;
    this._open = false;
    this._detailEntry = null;
    this._thumbGen = 0; // bumps each render → invalidates in-flight thumbnail jobs
    this._thumbQueue = [];
    this._thumbRaf = 0;
    this._build();
  }

  /** True while the panel itself is open (the detail dialog only lives inside
   *  an open panel). */
  get isOpen() {
    return this._open;
  }

  get isDetailOpen() {
    return !!this._detailEntry;
  }

  open() {
    this._open = true;
    this.el.classList.add('open');
    this.el.setAttribute('aria-hidden', 'false');
    this._render();
  }

  /** Redraw the shelf if the codex is currently open — for callers that change
   *  what's discovered while the panel is up (e.g. reveal-all). A no-op when
   *  closed, since open() renders fresh anyway. */
  refresh() {
    if (this._open) this._render();
  }

  close() {
    this._closeDetail();
    this._open = false;
    this._stopThumbs();
    this.el.classList.remove('open');
    this.el.setAttribute('aria-hidden', 'true');
    // free the thumbnail renderer's WebGL context while the codex is idle
    releaseThumbnailRenderer();
  }

  /** One Escape step: close the detail dialog first if it's up, else the whole
   *  panel. Returns nothing — main.js calls this only when the panel is open. */
  escape() {
    if (this._detailEntry) this._closeDetail();
    else this.close();
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
      '<div class="codex-prog"><div class="codex-prog-label lg-prog"></div><div class="codex-prog-bar"><i></i></div></div>' +
      '<div class="codex-scroll">' +
      '<div class="codex-shelf"></div>' +
      '<div class="codex-showcase">' +
      '<div class="codex-showcase-title">Витрина курьёзов</div>' +
      '<div class="codex-showcase-row"></div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      this._detailMarkup();
    document.body.appendChild(el);
    this.el = el;

    this._r = {
      tabs: el.querySelector('.codex-tabs'),
      progLabel: el.querySelector('.codex-prog-label'),
      progBar: el.querySelector('.codex-prog-bar > i'),
      shelf: el.querySelector('.codex-shelf'),
      showcase: el.querySelector('.codex-showcase'),
      showcaseRow: el.querySelector('.codex-showcase-row'),
      detail: el.querySelector('.codex-detail'),
      detailThumb: el.querySelector('.codex-detail-thumb'),
      detailSub: el.querySelector('.codex-detail-sub'),
      detailTitle: el.querySelector('.codex-detail-title'),
      detailDesc: el.querySelector('.codex-detail-desc'),
      detailFacts: el.querySelector('.codex-detail-facts'),
      detailActions: el.querySelector('.codex-detail-actions'),
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
    el.querySelector('.codex-detail-backdrop').addEventListener('click', () => this._closeDetail());
    el.querySelector('.codex-detail-close').addEventListener('click', () => this._closeDetail());
  }

  _detailMarkup() {
    return (
      '<div class="codex-detail" aria-hidden="true">' +
      '<div class="codex-detail-backdrop"></div>' +
      '<div class="codex-detail-card" role="dialog" aria-label="Находка">' +
      '<button type="button" class="codex-detail-close" aria-label="Закрыть">×</button>' +
      '<div class="codex-detail-thumb"></div>' +
      '<div class="codex-detail-body">' +
      '<div class="codex-detail-sub"></div>' +
      '<div class="codex-detail-title"></div>' +
      '<div class="codex-detail-desc"></div>' +
      '<dl class="codex-detail-facts"></dl>' +
      '<div class="codex-detail-actions"></div>' +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }

  /** Redraw the active tab's shelf + progress + the curiosities showcase (the
   *  showcase spans every category, so it's refreshed on every render). */
  _render() {
    this._stopThumbs();
    this._thumbGen++;
    for (const btn of this._r.tabs.children) btn.classList.toggle('on', btn.dataset.cat === this._activeCat);

    const cat = this._activeCat;
    const catalog = catalogFor(cat); // null for 'system' — no finite catalog
    let found;
    let total;
    if (cat === 'system') {
      // Progress is scoped to the CURRENT party (numerator and denominator from
      // the same galaxy) — the shelf below still lists every party's systems.
      const partyId = this._getPartyId();
      found = list(cat).filter((e) => e.batchId === partyId).length;
      total = this._getSystemTotal();
      this._r.progLabel.innerHTML = `В этой галактике: <b>${found}</b> / ${total}`;
    } else {
      const p = progress(cat);
      found = p.found;
      total = p.total;
      this._r.progLabel.innerHTML = `Найдено <b>${found}</b> / ${total}`;
    }
    const pct = total > 0 ? Math.min(100, Math.round((found / total) * 100)) : 0;
    this._r.progBar.style.width = `${pct}%`;

    this._r.shelf.innerHTML = '';
    if (catalog) {
      // a full shelf, every catalog slot in its fixed place — discovered ones
      // show a thumbnail + name, the rest stay category placeholders (counted
      // in the progress line, never spoiled by name).
      const byKey = new Map(list(cat).map((e) => [e.archetypeKey, e]));
      for (const c of catalog) {
        const entry = byKey.get(c.archetypeKey);
        this._r.shelf.appendChild(entry ? this._card(entry) : this._lockedCard(cat));
      }
    } else {
      // 'system' has no catalog to lay out in advance — just the discovery log.
      const entries = list(cat);
      if (!entries.length) {
        const empty = document.createElement('div');
        empty.className = 'codex-empty';
        empty.textContent = 'Пока ничего не найдено. Заходите в системы, чтобы наносить их на карту.';
        this._r.shelf.appendChild(empty);
      } else {
        for (const entry of entries) this._r.shelf.appendChild(this._card(entry));
      }
    }

    this._r.showcaseRow.innerHTML = '';
    const curios = curiosities();
    this._r.showcase.classList.toggle('empty', !curios.length);
    for (const entry of curios) this._r.showcaseRow.appendChild(this._card(entry));

    this._startThumbs();
  }

  /** A discovered entry's card: a thumbnail (rendered lazily) over a category
   *  placeholder, its name, and a curiosity mark. Clicking opens the detail
   *  dialog. */
  _card(entry) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `codex-tile found cat-${entry.category}`;
    const thumb = document.createElement('div');
    thumb.className = 'codex-thumb';
    thumb.innerHTML = `<span class="codex-thumb-icon">${categoryIcon(entry.category)}</span>`;
    const name = document.createElement('div');
    name.className = 'codex-tile-name';
    const label = document.createElement('span');
    label.textContent = entry.label; // textContent, not innerHTML — labels are data, never markup
    name.appendChild(label);
    if (entry.curiosity) {
      const star = document.createElement('span');
      star.className = 'codex-curio';
      star.title = 'Курьёз';
      star.textContent = '✦';
      name.appendChild(star);
    }
    el.appendChild(thumb);
    el.appendChild(name);
    el.addEventListener('click', () => this._openDetail(entry));
    // queue the real thumbnail (system entries have none → keep the glyph)
    if (entry.category !== 'system') this._thumbQueue.push({ entry, thumb, gen: this._thumbGen });
    return el;
  }

  /** An unreached catalog slot: the category's placeholder glyph, dimmed and
   *  unnamed — a shape that says "planet" or "ship", never which one. */
  _lockedCard(category) {
    const el = document.createElement('div');
    el.className = `codex-tile locked cat-${category}`;
    el.innerHTML =
      `<div class="codex-thumb"><span class="codex-thumb-icon">${categoryIcon(category)}</span></div>` +
      '<div class="codex-tile-name"><span>?</span></div>';
    return el;
  }

  // --- lazy thumbnail queue: render one per animation frame so opening the
  //     panel stays instant even with a full 54-ship shelf ------------------
  _startThumbs() {
    if (!this._thumbQueue.length || this._thumbRaf) return;
    this._thumbRaf = requestAnimationFrame(() => this._drainThumbs());
  }

  _stopThumbs() {
    if (this._thumbRaf) cancelAnimationFrame(this._thumbRaf);
    this._thumbRaf = 0;
    this._thumbQueue = [];
  }

  _drainThumbs() {
    this._thumbRaf = 0;
    const job = this._thumbQueue.shift();
    if (job && job.gen === this._thumbGen) {
      const url = thumbnailFor(job.entry, { overlay: this._getOverlay() });
      if (url) {
        job.thumb.style.backgroundImage = `url("${url}")`;
        job.thumb.classList.add('rendered');
      }
    }
    if (this._thumbQueue.length) this._thumbRaf = requestAnimationFrame(() => this._drainThumbs());
  }

  // --- detail dialog --------------------------------------------------------
  _openDetail(entry) {
    this._detailEntry = entry;
    const info = describeEntry(entry);
    this._r.detailSub.textContent = info.subtitle + (entry.curiosity ? ' · курьёз' : '');
    this._r.detailTitle.textContent = info.title;
    this._r.detailDesc.textContent = info.desc || '';
    this._r.detailDesc.classList.toggle('empty', !info.desc);

    this._r.detailFacts.innerHTML = '';
    for (const [k, v] of info.facts || []) {
      const dt = document.createElement('dt');
      dt.textContent = k;
      const dd = document.createElement('dd');
      dd.textContent = v;
      this._r.detailFacts.append(dt, dd);
    }

    // thumbnail: the same render the shelf uses, or the category glyph for a
    // system (no 3D object).
    const url = thumbnailFor(entry, { overlay: this._getOverlay() });
    this._r.detailThumb.className = `codex-detail-thumb cat-${entry.category}`;
    if (url) {
      this._r.detailThumb.style.backgroundImage = `url("${url}")`;
      this._r.detailThumb.innerHTML = '';
    } else {
      this._r.detailThumb.style.backgroundImage = '';
      this._r.detailThumb.innerHTML = `<span class="codex-thumb-icon">${categoryIcon(entry.category)}</span>`;
    }

    this._r.detailActions.innerHTML = '';
    if (entry.category !== 'system') {
      this._r.detailActions.appendChild(this._actionBtn('Рассмотреть', 'primary', () => this._view(entry)));
    }
    if (this._canNavigate(entry)) {
      this._r.detailActions.appendChild(this._actionBtn('Перейти к объекту', 'ghost', () => this._navigate(entry)));
    }

    this._r.detail.classList.add('open');
    this._r.detail.setAttribute('aria-hidden', 'false');
  }

  _closeDetail() {
    this._detailEntry = null;
    this._r.detail.classList.remove('open');
    this._r.detail.setAttribute('aria-hidden', 'true');
  }

  _actionBtn(label, variant, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `codex-action ${variant}`;
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
  }

  /** Can the live galaxy warp to this find? Systems/planets/stations carry a
   *  seed; phenomena resolve to a fixed special system in main.js. Older ship
   *  records without a seed can't be located precisely, so they're view-only. */
  _canNavigate(entry) {
    if (entry.category === 'phenomenon') return true;
    return !!(entry.sourceRef && entry.sourceRef.seed);
  }

  /** Rebuild the exact find and hand it to the isolated 3D object viewer
   *  (codexViewer drives the SAME generators/classes the live game used). */
  _view(entry) {
    const build = buildFor(entry, { overlay: this._getOverlay() });
    this._objectViewer.open(build);
  }

  /** Close the codex and ask the app to warp to this find in the live galaxy. */
  _navigate(entry) {
    this.close();
    this._onNavigate(entry);
  }
}
