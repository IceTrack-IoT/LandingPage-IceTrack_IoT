/**
 * IceTrack — Landing page interactions
 *
 *  1. Header: mobile navigation drawer (aria-expanded), scrolled state, scroll-spy
 *  2. Live telemetry simulation: new sensor reading every 4 s, scenario switcher,
 *     sparkline, sync counter, live clocks
 *  3. Fleet console mirror: status filters, search, map pins, threshold table, KPIs, ticker
 *  4. Field app mockup: alert acknowledgement and QR provisioning demo
 *  5. Solutions role tabs, marquee pause controls, reveal-on-scroll
 *
 * Depends on scripts/i18n.js (window.IceTrackI18n) and re-renders on `icetrack:langchange`.
 */
(() => {
  'use strict';

  const SPRITE = 'public/assets/icons/sprite.svg';
  const TICK_MS = 1000;
  const READING_EVERY_S = 4;

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const t = (key, vars) => (window.IceTrackI18n ? window.IceTrackI18n.t(key, vars) : key);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopNav = window.matchMedia('(min-width: 1024px)');

  const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const iconHref = (name) => `${SPRITE}#icon-${name}`;
  const fmtTemp = (value) => (value == null ? '— —' : `${value.toFixed(1)} °C`);
  const pad = (n) => String(n).padStart(2, '0');
  const clockString = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

  /* ------------------------------------------------------------------
   * Data model
   * ------------------------------------------------------------------ */
  const SCENARIOS = {
    normal: { tone: 'success', status: 'normal', target: -18.4, load: '3.2 kW · 78%', alerts: 0, badgeIcon: 'wifi', alertIcon: 'check' },
    drift: { tone: 'warning', status: 'warning', target: -16.3, load: '3.9 kW · 96%', alerts: 1, badgeIcon: 'wifi', alertIcon: 'alert-triangle' },
    breach: { tone: 'danger', status: 'critical', target: -8.5, load: '0.0 kW', alerts: 2, badgeIcon: 'wifi', alertIcon: 'alert-triangle' },
    offline: { tone: 'offline', status: 'offline', target: null, load: '—', alerts: 1, badgeIcon: 'wifi-off', alertIcon: 'alert-triangle' },
  };

  // Steady-state readings while the cold room is healthy (tabular digits keep the width fixed).
  const NORMAL_READINGS = [-18.4, -18.2, -18.5, -18.3, -18.4, -18.6, -18.2, -18.5];

  const STATUS_TONE = { normal: 'success', warning: 'warning', critical: 'danger', offline: 'offline', ack: 'brand' };

  // CR-02 mirrors the hero console; CH-07 can be acknowledged from the phone.
  const FLEET = [
    { code: 'CR-02', name: 'fleet.cr02', zone: 'zone.frozen', min: -20, max: -16, x: 7, y: 24, live: true },
    { code: 'FR-04', name: 'fleet.fr04', zone: 'zone.frozen', min: -25, max: -18, x: 20, y: 42, cur: -18.6, status: 'warning' },
    { code: 'CH-07', name: 'fleet.ch07', zone: 'zone.chilled', min: 0, max: 4, x: 56, y: 24, cur: 9.6, status: 'critical', ackable: true },
    { code: 'CH-03', name: 'fleet.ch03', zone: 'zone.chilled', min: 1, max: 5, x: 71, y: 42, cur: 2.8, status: 'normal' },
    { code: 'DK-01', name: 'fleet.dk01', zone: 'zone.ambient', min: 2, max: 8, x: 8, y: 77, cur: null, status: 'offline' },
  ];

  const state = {
    scenario: 'normal',
    temp: -18.4,
    history: [-18.3, -18.4, -18.25, -18.35, -18.5, -18.4, -18.3, -18.2, -18.35, -18.45, -17.9, -17.3, -17.2, -17.6, -18.1, -18.4, -18.5, -18.35, -18.25, -18.4, -18.55, -18.45, -18.35, -18.3, -18.4],
    syncAgo: 12,
    normalIndex: 0,
    seconds: 0,
    filter: 'all',
    query: '',
    ack: false,
    scanPhase: 'idle',
  };

  const assetStatus = (asset) => {
    if (asset.live) return SCENARIOS[state.scenario].status;
    if (asset.ackable && state.ack) return 'ack';
    return asset.status;
  };
  const assetTemp = (asset) => {
    if (asset.live) return state.scenario === 'offline' ? null : state.temp;
    return asset.cur;
  };
  const matchesFilter = (status, filter) => filter === 'all' || status === filter || (filter === 'critical' && status === 'ack');
  const matchesQuery = (asset) => {
    if (!state.query) return true;
    const haystack = `${asset.code} ${t(asset.name)} ${t(asset.zone)}`.toLowerCase();
    return haystack.includes(state.query);
  };
  const fleetRows = () =>
    FLEET.map((asset) => {
      const status = assetStatus(asset);
      return {
        ...asset,
        status,
        tone: STATUS_TONE[status],
        temp: assetTemp(asset),
        visible: matchesFilter(status, state.filter) && matchesQuery(asset),
      };
    });

  /* ------------------------------------------------------------------
   * 1. Header
   * ------------------------------------------------------------------ */
  const initHeader = () => {
    const header = $('[data-header]');
    const nav = $('[data-nav]');
    const toggle = $('[data-nav-toggle]');
    if (!header || !nav || !toggle) return;

    const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

    const setOpen = (open, { returnFocus = false } = {}) => {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      header.classList.toggle('has-open-nav', open);
      document.documentElement.classList.toggle('has-nav-open', open);
      if (open) {
        const firstLink = $('a', nav);
        if (firstLink) firstLink.focus({ preventScroll: true });
      } else if (returnFocus) {
        toggle.focus();
      }
    };

    toggle.addEventListener('click', () => setOpen(!isOpen()));

    nav.addEventListener('click', (event) => {
      if (event.target.closest('a') && isOpen()) setOpen(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen()) setOpen(false, { returnFocus: true });
    });

    // Close on outside click — the backdrop is the header's ::after, so its target is the header itself.
    document.addEventListener('click', (event) => {
      if (!isOpen()) return;
      if (event.target === header || !header.contains(event.target)) setOpen(false);
    });

    // Close when keyboard focus leaves the header while the drawer is open.
    header.addEventListener('focusout', (event) => {
      if (isOpen() && event.relatedTarget && !header.contains(event.relatedTarget)) setOpen(false);
    });

    desktopNav.addEventListener('change', (event) => {
      if (event.matches && isOpen()) setOpen(false);
    });

    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  };

  const initScrollSpy = () => {
    const links = $$('[data-nav-link]');
    if (!links.length || !('IntersectionObserver' in window)) return;

    const byId = new Map(links.map((link) => [link.hash.slice(1), link]));
    const setActive = (id) => {
      links.forEach((link) => {
        const active = link.hash.slice(1) === id;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(byId.has(entry.target.id) ? entry.target.id : null);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );

    ['top', 'solutions', 'features', 'about', 'hardware', 'get-started'].forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  };

  /* ------------------------------------------------------------------
   * 2. Live telemetry card
   * ------------------------------------------------------------------ */
  const tel = {
    card: $('[data-telemetry]'),
    badge: $('[data-tel-badge]'),
    badgeIcon: $('[data-tel-badge-icon]'),
    kpi: $('[data-tel-kpi]'),
    temp: $('[data-tel-temp]'),
    alert: $('[data-tel-alert]'),
    live: $('[data-tel-live]'),
    load: $('[data-tel-load]'),
    loadText: $('[data-tel-load-text]'),
    alerts: $('[data-tel-alerts]'),
    alertsText: $('[data-tel-alerts-text]'),
    alertsIcon: $('[data-tel-alerts-icon]'),
    sync: $('[data-tel-sync]'),
    ghost: $('[data-ghost-temp]'),
    spark: {
      band: $('[data-spark-band]'),
      upper: $('[data-spark-upper]'),
      lower: $('[data-spark-lower]'),
      upperLabel: $('[data-spark-upper-label]'),
      lowerLabel: $('[data-spark-lower-label]'),
      area: $('[data-spark-area]'),
      line: $('[data-spark-line]'),
      dot: $('[data-spark-dot]'),
    },
  };

  const renderTemperature = () => {
    if (tel.temp) tel.temp.textContent = fmtTemp(state.temp);
    if (tel.ghost) tel.ghost.textContent = `${state.temp.toFixed(1)}°`;
  };

  const renderSync = () => {
    if (!tel.sync) return;
    const ago = t('unit.seconds', { n: state.syncAgo });
    tel.sync.innerHTML = t('tel.synced', { ago: `<span class="metric__value num">${escapeHtml(ago)}</span>` });
  };

  const renderSparkline = () => {
    const s = tel.spark;
    if (!s.line) return;
    const values = state.history;
    const lo = Math.min(-21, Math.min(...values) - 1);
    const hi = Math.max(-15, Math.max(...values) + 1);
    const y = (v) => 12 + ((hi - v) / (hi - lo)) * 104;
    const points = values.map((v, i) => `${i * 20},${y(v).toFixed(1)}`).join(' ');
    const bandTop = y(-16);
    const bandBottom = y(-20);
    const setY = (line, value) => {
      line.setAttribute('y1', value.toFixed(1));
      line.setAttribute('y2', value.toFixed(1));
    };

    s.line.setAttribute('points', points);
    s.area.setAttribute('points', `${points} 480,132 0,132`);
    s.band.setAttribute('y', bandTop.toFixed(1));
    s.band.setAttribute('height', (bandBottom - bandTop).toFixed(1));
    setY(s.upper, bandTop);
    setY(s.lower, bandBottom);
    s.upperLabel.setAttribute('y', Math.max(10, bandTop - 4).toFixed(1));
    s.lowerLabel.setAttribute('y', Math.min(130, bandBottom + 12).toFixed(1));
    s.dot.setAttribute('cy', y(values[values.length - 1]).toFixed(1));
  };

  const renderScenario = () => {
    const key = state.scenario;
    const sc = SCENARIOS[key];
    if (!tel.card) return;

    tel.card.setAttribute('data-tone', sc.tone);
    tel.badge.textContent = t(`scenario.${key}.badge`);
    tel.badgeIcon.setAttribute('href', iconHref(sc.badgeIcon));
    tel.kpi.textContent = t(`scenario.${key}.kpi`);
    tel.live.textContent = t(`scenario.${key}.live`);
    tel.load.textContent = sc.load;
    tel.loadText.textContent = t(`scenario.${key}.load`);
    tel.alerts.textContent = String(sc.alerts);
    tel.alertsText.textContent = t(`scenario.${key}.alerts`);
    tel.alertsIcon.setAttribute('href', iconHref(sc.alertIcon));

    $$('[data-scenario]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-scenario') === key));
    });
  };

  // The alert lives in a polite live region — only rewrite it when the message actually changes.
  const renderAlert = () => {
    if (!tel.alert) return;
    const msg = t(`scenario.${state.scenario}.msg`);
    if (!msg) {
      tel.alert.innerHTML = '';
      return;
    }
    tel.alert.innerHTML = `
      <div class="alert-toast" data-tone="${SCENARIOS[state.scenario].tone}">
        <svg class="icon" aria-hidden="true"><use href="${iconHref('bell-ringing')}"></use></svg>
        <span>${escapeHtml(msg)}</span>
      </div>`;
  };

  const takeReading = () => {
    const sc = SCENARIOS[state.scenario];
    let next;
    if (state.scenario === 'normal' && Math.abs(state.temp - sc.target) <= 0.4) {
      next = NORMAL_READINGS[state.normalIndex % NORMAL_READINGS.length];
      state.normalIndex += 1;
    } else {
      const pull = state.scenario === 'normal' ? 0.45 : 0.3;
      const noise = (Math.random() - 0.5) * 0.3;
      next = state.temp + (sc.target - state.temp) * pull + noise;
    }
    state.temp = Math.round(next * 10) / 10;
    state.history = [...state.history.slice(1), state.temp];
    state.syncAgo = 0;

    renderTemperature();
    renderSparkline();
    renderFleet();
  };

  const setScenario = (key) => {
    if (!SCENARIOS[key] || key === state.scenario) return;
    state.scenario = key;
    // Make the next tick deliver a fresh reading so the change is visible right away.
    state.seconds = READING_EVERY_S - 1;
    renderScenario();
    renderAlert();
    renderFleet();
  };

  const initTelemetry = () => {
    $$('[data-scenario]').forEach((btn) => {
      btn.addEventListener('click', () => setScenario(btn.getAttribute('data-scenario')));
    });
  };

  /* ------------------------------------------------------------------
   * 3. Fleet console, ticker, phone mirror
   * ------------------------------------------------------------------ */
  const fleetEls = {
    rows: $('[data-fleet-rows]'),
    pins: $('[data-map-pins]'),
    empty: $('[data-fleet-empty]'),
    status: $('[data-filter-status]'),
    online: $('[data-kpi-online]'),
    alerts: $('[data-kpi-alerts]'),
    search: $('[data-fleet-search]'),
    phoneTemp: $('[data-phone-cr02]'),
    phoneChip: $('[data-phone-cr02-chip]'),
    ticker: $('[data-ticker]'),
    tickerTrack: $('[data-ticker-track]'),
  };

  const renderTicker = (rows) => {
    if (!fleetEls.tickerTrack) return;
    const items = rows
      .map((r) => ({ code: r.code, val: fmtTemp(r.temp), label: t(`status.${r.status}`), tone: r.tone }))
      .concat([
        { code: 'GW-01', val: t('ticker.gateway'), label: t('status.online'), tone: 'success' },
        { code: t('ticker.fleet'), val: '412.6 kWh', label: t('ticker.energy'), tone: 'brand' },
        { code: t('ticker.uptime'), val: '99.98%', label: t('ticker.allSystems'), tone: 'success' },
      ]);

    const group = items
      .map(
        (item) => `
        <li class="ticker__item" data-tone="${item.tone}">
          <span class="dot" aria-hidden="true"></span>
          <span class="ticker__code">${escapeHtml(item.code)}</span>
          <span class="ticker__val num">${escapeHtml(item.val)}</span>
          <span class="ticker__status">${escapeHtml(item.label)}</span>
        </li>`
      )
      .join('');

    // Two identical halves make the -50% translate loop seamless; the copy is hidden from assistive tech.
    fleetEls.tickerTrack.innerHTML = `
      <ul class="ticker__group" role="list">${group}</ul>
      <ul class="ticker__group" role="list" aria-hidden="true">${group}</ul>`;
    fleetEls.ticker.hidden = false;
  };

  function renderFleet() {
    const rows = fleetRows();

    if (fleetEls.rows) {
      fleetEls.rows.innerHTML = rows
        .map(
          (r) => `
          <tr data-tone="${r.tone}" class="${r.visible ? '' : 'is-dimmed'}">
            <th scope="row">${escapeHtml(r.code)} <span class="fleet-table__name">${escapeHtml(t(r.name))}</span></th>
            <td>${escapeHtml(t(r.zone))}</td>
            <td class="cell-num num">${fmtTemp(r.min)}</td>
            <td class="cell-num num">${fmtTemp(r.max)}</td>
            <td class="cell-num cell-current num">${fmtTemp(r.temp)}</td>
            <td><span class="status-pill"><span class="dot" aria-hidden="true"></span>${escapeHtml(t(`status.${r.status}`))}</span></td>
          </tr>`
        )
        .join('');
    }

    if (fleetEls.pins) {
      fleetEls.pins.innerHTML = rows
        .map(
          (r) => `
          <span class="map-pin${r.visible ? '' : ' is-dimmed'}" data-tone="${r.tone}" style="--x: ${r.x}%; --y: ${r.y}%">
            <span class="dot${r.status === 'critical' ? ' is-pulsing' : ''}" aria-hidden="true"></span>
            <b>${escapeHtml(r.code)}</b>
            <span class="map-pin__val num">${fmtTemp(r.temp)}</span>
          </span>`
        )
        .join('');
    }

    const visibleCount = rows.filter((r) => r.visible).length;
    if (fleetEls.empty) fleetEls.empty.hidden = visibleCount > 0;
    if (fleetEls.status) fleetEls.status.textContent = t('filter.status', { n: visibleCount, total: rows.length });

    // Chip counts ignore the free-text search so they always describe the whole fleet.
    $$('[data-filter-count]').forEach((el) => {
      const filter = el.getAttribute('data-filter-count');
      el.textContent = String(rows.filter((r) => matchesFilter(r.status, filter)).length);
    });

    const activeAlerts = rows.filter((r) => r.status === 'critical' || r.status === 'warning').length;
    if (fleetEls.alerts) {
      fleetEls.alerts.textContent = String(activeAlerts);
      fleetEls.alerts.classList.toggle('is-clear', activeAlerts === 0);
    }
    if (fleetEls.online) fleetEls.online.textContent = String(state.scenario === 'offline' ? 45 : 46);

    const cr02 = rows.find((r) => r.live);
    if (cr02 && fleetEls.phoneTemp) fleetEls.phoneTemp.textContent = fmtTemp(cr02.temp);
    if (cr02 && fleetEls.phoneChip) {
      fleetEls.phoneChip.setAttribute('data-tone', cr02.tone);
      fleetEls.phoneChip.textContent = t(`status.${cr02.status}`);
    }

    renderTicker(rows);
  }

  const initFleet = () => {
    $$('[data-filter]').forEach((chip) => {
      chip.addEventListener('click', () => {
        state.filter = chip.getAttribute('data-filter');
        $$('[data-filter]').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
        renderFleet();
      });
    });

    if (fleetEls.search) {
      fleetEls.search.addEventListener('input', () => {
        state.query = fleetEls.search.value.trim().toLowerCase();
        renderFleet();
      });
    }
  };

  /* ------------------------------------------------------------------
   * 4. Field app mockup
   * ------------------------------------------------------------------ */
  const phoneEls = {
    alert: $('[data-phone-alert]'),
    acked: $('[data-phone-acked]'),
    ack: $('[data-ack]'),
    undo: $('[data-undo]'),
    scan: $('[data-scan]'),
    scanLabel: $('[data-scan-label]'),
    scanIcon: $('[data-scan-icon]'),
    scanStatus: $('[data-scan-status]'),
  };

  const renderAck = () => {
    if (phoneEls.alert) phoneEls.alert.hidden = state.ack;
    if (phoneEls.acked) phoneEls.acked.hidden = !state.ack;
  };

  const SCAN_COPY = { idle: 'phone.scan', scanning: 'phone.scanning', paired: 'phone.paired' };
  let scanTimer = null;

  const renderScan = () => {
    const { scan, scanLabel, scanIcon, scanStatus } = phoneEls;
    if (!scan) return;
    scan.setAttribute('data-phase', state.scanPhase);
    scan.setAttribute('aria-busy', String(state.scanPhase === 'scanning'));
    scanLabel.textContent = t(SCAN_COPY[state.scanPhase]);
    scanIcon.setAttribute('href', iconHref(state.scanPhase === 'paired' ? 'circle-check' : 'qrcode'));
    scanStatus.textContent = state.scanPhase === 'paired' ? t('phone.pairedStatus') : '';
  };

  const initPhone = () => {
    if (phoneEls.ack) {
      phoneEls.ack.addEventListener('click', () => {
        state.ack = true;
        renderAck();
        renderFleet();
        if (phoneEls.undo) phoneEls.undo.focus();
      });
    }
    if (phoneEls.undo) {
      phoneEls.undo.addEventListener('click', () => {
        state.ack = false;
        renderAck();
        renderFleet();
        if (phoneEls.ack) phoneEls.ack.focus();
      });
    }
    if (phoneEls.scan) {
      phoneEls.scan.addEventListener('click', () => {
        if (state.scanPhase !== 'idle') return;
        state.scanPhase = 'scanning';
        renderScan();
        window.clearTimeout(scanTimer);
        scanTimer = window.setTimeout(() => {
          state.scanPhase = 'paired';
          renderScan();
          scanTimer = window.setTimeout(() => {
            state.scanPhase = 'idle';
            renderScan();
          }, 3200);
        }, 1400);
      });
    }
  };

  /* ------------------------------------------------------------------
   * 5. Solutions tabs, marquees, reveal
   * ------------------------------------------------------------------ */
  const initTabs = () => {
    const tablist = $('[data-tabs]');
    if (!tablist) return;
    const tabs = $$('[role="tab"]', tablist);

    const select = (tab, { focus = false } = {}) => {
      tabs.forEach((item) => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
        const panel = document.getElementById(item.getAttribute('aria-controls'));
        if (panel) {
          panel.hidden = !selected;
          if (selected) panel.classList.add('is-visible');
        }
      });
      if (focus) tab.focus();
    };

    tablist.addEventListener('click', (event) => {
      const tab = event.target.closest('[role="tab"]');
      if (tab) select(tab);
    });

    tablist.addEventListener('keydown', (event) => {
      const index = tabs.indexOf(document.activeElement);
      if (index < 0) return;
      const moves = { ArrowRight: index + 1, ArrowDown: index + 1, ArrowLeft: index - 1, ArrowUp: index - 1, Home: 0, End: tabs.length - 1 };
      if (!(event.key in moves)) return;
      event.preventDefault();
      const next = (moves[event.key] + tabs.length) % tabs.length;
      select(tabs[next], { focus: true });
    });
  };

  const initMarquees = () => {
    $$('[data-marquee-toggle]').forEach((button) => {
      button.addEventListener('click', () => {
        const paused = button.getAttribute('aria-pressed') !== 'true';
        button.setAttribute('aria-pressed', String(paused));
        const marquee = button.closest('[data-marquee]');
        if (marquee) marquee.classList.toggle('is-paused', paused);
      });
    });
  };

  const initReveal = () => {
    const items = $$('.reveal');
    if (!items.length) return;
    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0 }
    );
    items.forEach((el) => observer.observe(el));
  };

  /* ------------------------------------------------------------------
   * Clock loop (paused while the tab is hidden)
   * ------------------------------------------------------------------ */
  const clocks = $$('[data-clock]');
  const renderClocks = () => {
    const now = clockString();
    clocks.forEach((el) => { el.textContent = now; });
  };

  const tick = () => {
    state.seconds += 1;
    renderClocks();
    if (state.seconds % READING_EVERY_S === 0 && state.scenario !== 'offline') {
      takeReading();
    } else {
      state.syncAgo += 1;
    }
    renderSync();
  };

  let timer = null;
  const start = () => {
    if (timer === null) timer = window.setInterval(tick, TICK_MS);
  };
  const stop = () => {
    window.clearInterval(timer);
    timer = null;
  };

  /* ------------------------------------------------------------------
   * Boot
   * ------------------------------------------------------------------ */
  const renderAll = () => {
    renderScenario();
    renderAlert();
    renderTemperature();
    renderSync();
    renderSparkline();
    renderFleet();
    renderAck();
    renderScan();
  };

  initHeader();
  initScrollSpy();
  initTelemetry();
  initFleet();
  initPhone();
  initTabs();
  initMarquees();
  initReveal();

  renderClocks();
  renderAll();
  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

  document.addEventListener('icetrack:langchange', renderAll);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  start();
})();
