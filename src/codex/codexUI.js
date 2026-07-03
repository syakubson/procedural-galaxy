// The codex panel: a full-screen modal listing every archetype the player has
// ever discovered, across every save (see codex.js's header — it's a
// PERMANENT, cross-party log). Built once and toggled via an `.open` class,
// the same opacity+transform+pointer-events idiom every other cartographer
// overlay uses (#help-panel) — never a display:none swap.
//
// The shelf is a gallery of cards, optionally split into sections (ships by
// faction, «Особое» by системы/объекты/планеты): a discovered card shows a
// rendered thumbnail (thumbnails.js) and opens a detail dialog on click; an
// undiscovered slot shows a per-category placeholder glyph (codexIcons.js) —
// counted, never named (except announced-but-future entries, shown by name).
// The detail dialog carries the full description plus «Рассмотреть» (the
// isolated 3D viewer) and «Перейти к объекту» (warp to it in the live galaxy).
//
// Reads ONLY through codex.js's public API and codexData.js's catalogs/
// describeEntry; it never touches storage.js directly.

import { catalogFor, describeEntry, isRebuildable, racePlanetRef, specialGroup } from './codexData.js';
import { list, progress } from './codex.js';
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
  { id: 'special', label: 'Особое' },
];

// Which placeholder glyph a special find uses, by its Особое sub-group.
const SPECIAL_GROUP_ICON = { Системы: 'system', Объекты: 'phenomenon', Планеты: 'planet' };

/** The codexIcons glyph key for an entry — a special find picks its glyph by
 *  sub-group, everything else by its category. */
function iconKeyFor(entry) {
  if (entry.category === 'special') return SPECIAL_GROUP_ICON[specialGroup(entry.archetypeKey)] || 'phenomenon';
  return entry.category;
}

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

  /** Redraw the active tab's shelf + progress line. */
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
      // count against DISCOVERABLE archetypes only — future placeholder races
      // (never obtainable yet) don't drag the denominator below 100%.
      total = catalog.filter((c) => !c.future).length;
      found = progress(cat).found;
      this._r.progLabel.innerHTML = `Найдено <b>${found}</b> / ${total}`;
    }
    const pct = total > 0 ? Math.min(100, Math.round((found / total) * 100)) : 0;
    this._r.progBar.style.width = `${pct}%`;

    this._r.shelf.innerHTML = '';
    if (catalog) {
      // every catalog slot in its fixed place — discovered ones show a thumbnail
      // + name, the rest stay placeholders. Grouped catalogs (ships/stations by
      // faction, «Особое» by sub-group) get a section header per group.
      const byKey = new Map(list(cat).map((e) => [e.archetypeKey, e]));
      let curGroup = null;
      for (const c of catalog) {
        if (c.group && c.group !== curGroup) {
          curGroup = c.group;
          const h = document.createElement('div');
          h.className = 'codex-section';
          h.textContent = c.group;
          this._r.shelf.appendChild(h);
        }
        const entry = byKey.get(c.archetypeKey);
        this._r.shelf.appendChild(entry ? this._card(entry) : this._lockedCard(c, cat));
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

    this._startThumbs();
  }

  /** A discovered entry's card: a thumbnail (rendered lazily) over a placeholder
   *  glyph, its name. Clicking opens the detail dialog. */
  _card(entry) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `codex-tile found cat-${entry.category}`;
    const thumb = document.createElement('div');
    thumb.className = 'codex-thumb';
    thumb.innerHTML = `<span class="codex-thumb-icon">${categoryIcon(iconKeyFor(entry))}</span>`;
    const name = document.createElement('div');
    name.className = 'codex-tile-name';
    const label = document.createElement('span');
    label.textContent = entry.label; // textContent, not innerHTML — labels are data, never markup
    name.appendChild(label);
    el.appendChild(thumb);
    el.appendChild(name);
    el.addEventListener('click', () => this._openDetail(entry));
    // queue the real thumbnail (entries with no 3D form keep the glyph)
    if (isRebuildable(entry)) this._thumbQueue.push({ entry, thumb, gen: this._thumbGen });
    return el;
  }

  /** An unreached catalog slot: the placeholder glyph, dimmed. Anonymous ("?")
   *  for a normal undiscovered find; an announced-but-future entry (a race not
   *  in the game yet) shows its name and a «скоро» tag instead. */
  _lockedCard(c, category) {
    const el = document.createElement('div');
    el.className = `codex-tile locked cat-${category}${c.future ? ' future' : ''}`;
    const iconKey = category === 'special' ? SPECIAL_GROUP_ICON[c.group] || 'phenomenon' : category;
    const thumb = document.createElement('div');
    thumb.className = 'codex-thumb';
    thumb.innerHTML = `<span class="codex-thumb-icon">${categoryIcon(iconKey)}</span>`;
    const name = document.createElement('div');
    name.className = 'codex-tile-name';
    if (c.future) {
      const label = document.createElement('span');
      label.textContent = c.label;
      const soon = document.createElement('span');
      soon.className = 'codex-soon';
      soon.textContent = 'скоро';
      name.append(label, soon);
    } else {
      name.innerHTML = '<span>?</span>';
    }
    el.append(thumb, name);
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
    this._r.detailSub.textContent = info.subtitle;
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

    // thumbnail: the same render the shelf uses, or the group glyph for a find
    // with no standalone 3D object (a system, a race).
    const url = isRebuildable(entry) ? thumbnailFor(entry, { overlay: this._getOverlay() }) : null;
    this._r.detailThumb.className = `codex-detail-thumb cat-${entry.category}`;
    if (url) {
      this._r.detailThumb.style.backgroundImage = `url("${url}")`;
      this._r.detailThumb.innerHTML = '';
    } else {
      this._r.detailThumb.style.backgroundImage = '';
      this._r.detailThumb.innerHTML = `<span class="codex-thumb-icon">${categoryIcon(iconKeyFor(entry))}</span>`;
    }

    this._r.detailActions.innerHTML = '';
    if (isRebuildable(entry)) {
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

  /** Can the live galaxy warp to this find? A special always resolves to its
   *  hand-crafted system; a real named race to its homeworld (a future race
   *  has none); everything else needs a recorded seed. */
  _canNavigate(entry) {
    if (entry.category === 'special') return true;
    if (entry.category === 'race') return !!racePlanetRef(entry.archetypeKey);
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
