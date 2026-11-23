/* BeautyFinder – App-Logik (Vanilla JS, keine Build-Tools nötig) */
(() => {
  "use strict";

  // ---------- Konstanten ----------
  const DEFAULT_POS = { lat: 52.5219, lng: 13.4132, label: "Alexanderplatz" };
  const BERLIN_BOUNDS = { minLat: 52.33, maxLat: 52.68, minLng: 13.08, maxLng: 13.77 };
  const css = (v, fb) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || fb;
  const STATUS = {
    in:  { label: "Verfügbar",       color: css("--ok", "#1f9d55") },
    low: { label: "Nur noch wenige", color: css("--warn", "#d48806") },
    out: { label: "Ausverkauft",     color: css("--off", "#9aa5b4") },
  };

  const svg = (d, cls = "ic") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const PIN = svg('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>', "ic sm");
  const SUN = svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>');
  const DROP = svg('<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>');
  const CAL = svg('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>');
  const MOON = svg('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>');

  // ---------- State ----------
  const state = {
    product: null,
    chains: new Set(Object.keys(CHAINS)),
    onlyAvailable: false,
    user: { ...DEFAULT_POS },
  };

  // ---------- Helpers ----------
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss");
  const euro = (n) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
  const productById = (id) => PRODUCTS.find((p) => p.id === id);

  function km(a, b) {
    const R = 6371, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  const fmtKm = (d) => (d < 1 ? `${Math.round(d * 1000 / 10) * 10} m` : `${d.toLocaleString("de-DE", { maximumFractionDigits: 1 })} km`);

  // Deterministischer Hash -> simulierter, aber stabiler Bestand (ändert sich stündlich)
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function stockFor(store, product) {
    if (!product.chains.includes(store.chain)) return null; // Händler führt das Produkt nicht
    const hour = Math.floor(Date.now() / 3.6e6);
    const h = hash(`${store.id}|${product.id}|${hour}`);
    const r = h % 100;
    const qty = r < 22 ? 0 : r < 45 ? 1 + (h % 3) : 4 + (h % 9);
    return {
      qty,
      status: qty === 0 ? "out" : qty <= 3 ? "low" : "in",
      updatedMin: 2 + (h % 48),
      price: product.prices[store.chain],
    };
  }

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2800);
  }

  // ---------- Karte ----------
  let map = null, userMarker = null;
  const storeMarkers = new Map();

  function initMap() {
    if (!window.L) {
      $("#map").innerHTML = '<p class="map-fallback">Karte konnte nicht geladen werden (offline?). Die Liste funktioniert trotzdem.</p>';
      return;
    }
    map = L.map("map", { zoomControl: false, minZoom: 10, maxBounds: [[52.2, 12.8], [52.8, 14.0]] }).setView([52.505, 13.39], 12);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Stadtplan von OpenStreetMap (offene Daten, Lizenz ODbL – nur Quellenangabe nötig).
    // Lädt OSM nicht, springt die App automatisch auf einen Ersatzdienst um.
    const dark = window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches
      && document.documentElement.dataset.theme !== "light";
    if (dark) map.getContainer().classList.add("dark-map");
    const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende';
    const DIST_ATTR = ' · Bezirke <a href="https://www.statistik-berlin-brandenburg.de/">AfS BB</a>';
    const PROVIDERS = [
      { url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: OSM_ATTR + DIST_ATTR, maxZoom: 19 },
      { url: "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png", attribution: OSM_ATTR + " · OSM France" + DIST_ATTR, maxZoom: 19 },
      { url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", attribution: OSM_ATTR + " · CARTO" + DIST_ATTR, maxZoom: 19 },
    ];
    let providerIdx = 0, tiles = null;
    const useProvider = (i) => {
      if (tiles) map.removeLayer(tiles);
      const pv = PROVIDERS[i];
      let loaded = 0, failed = 0;
      tiles = L.tileLayer(pv.url, { maxZoom: pv.maxZoom, attribution: pv.attribution, className: "base-tiles" }).addTo(map);
      tiles.on("tileload", () => { loaded++; });
      tiles.on("tileerror", () => {
        if (loaded > 0 || ++failed !== 4) return;
        if (providerIdx < PROVIDERS.length - 1) useProvider(++providerIdx);
        else toast("Stadtplan lädt gerade nicht – die Bezirkskarte wird angezeigt");
      });
    };
    useProvider(0);

    // Berliner Bezirke – immer sichtbar, auch ohne Internet-Kartenkacheln
    if (typeof BERLIN_DISTRICTS !== "undefined") {
      const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#0d1838";
      const base = { color: accent, weight: 1.4, opacity: 0.55, fillColor: accent, fillOpacity: 0.035 };
      L.geoJSON(BERLIN_DISTRICTS, {
        style: () => base,
        bubblingMouseEvents: true,
        onEachFeature: (f, layer) => {
          layer.bindTooltip(f.properties.name.replace("-", "-<br>"), {
            permanent: true, direction: "center", className: "district-label",
          });
          layer.on("mouseover", () => layer.setStyle({ fillOpacity: 0.09, weight: 2 }));
          layer.on("mouseout", () => layer.setStyle(base));
        },
      }).addTo(map);
    }

    STORES.forEach((s) => {
      const m = L.circleMarker([s.lat, s.lng], { radius: 7, weight: 2, bubblingMouseEvents: false, pane: "markerPane" }).addTo(map);
      m.on("click", () => focusStore(s.id, false));
      storeMarkers.set(s.id, m);
    });

    userMarker = L.marker([state.user.lat, state.user.lng], {
      icon: L.divIcon({ className: "user-pin", html: "<span></span>", iconSize: [18, 18] }),
      zIndexOffset: 1000,
    }).addTo(map).bindTooltip("Du", { direction: "top", offset: [0, -8] });

    map.on("click", (e) => {
      setUser({ lat: e.latlng.lat, lng: e.latlng.lng, label: "gewählter Punkt" });
      toast("Standort auf der Karte gesetzt");
    });
  }

  function popupHtml(store, stock) {
    const chain = CHAINS[store.chain];
    let body = '<span class="muted">Produkt suchen, um Bestand zu sehen</span>';
    if (state.product) {
      body = stock
        ? `<strong style="color:${STATUS[stock.status].color}">${STATUS[stock.status].label}</strong>${stock.qty ? ` · ${stock.qty} Stück` : ""}<br>${euro(stock.price)}`
        : '<span class="muted">Nicht im Sortiment</span>';
    }
    return `<div class="popup"><b>${esc(chain.name)}</b> · ${esc(store.area)}<br><small>${esc(store.district)} · ${fmtKm(km(state.user, store))}</small><div>${body}</div></div>`;
  }

  function updateMarkers(rows) {
    if (!map) return;
    const visible = new Map(rows.map((r) => [r.store.id, r]));
    STORES.forEach((s) => {
      const m = storeMarkers.get(s.id);
      const row = visible.get(s.id);
      const chainOn = state.chains.has(s.chain);
      if (!chainOn || (state.product && !row)) { m.setStyle({ opacity: 0, fillOpacity: 0 }); m.closePopup(); m.unbindPopup(); return; }
      let fill = CHAINS[s.chain].color, stroke = "#ffffff", radius = 6;
      if (state.product && row) {
        fill = STATUS[row.stock.status].color;
        stroke = CHAINS[s.chain].color;
        radius = row.stock.status === "out" ? 6 : 9;
      }
      m.setStyle({ color: stroke, fillColor: fill, fillOpacity: 0.95, opacity: 1, weight: 3 });
      m.setRadius(radius);
      m.bindPopup(popupHtml(s, row && row.stock));
    });
  }

  function setUser(pos) {
    state.user = pos;
    if (userMarker) userMarker.setLatLng([pos.lat, pos.lng]);
    render();
  }

  // ---------- Suche ----------
  function searchProducts(q) {
    const n = norm(q.trim());
    if (!n) return [];
    const words = n.split(/\s+/);
    return PRODUCTS
      .map((p) => {
        const hay = norm(`${p.brand} ${p.name} ${CAT_LABEL[p.category] || p.category} ${p.area === "haar" ? "haare haar" : ""}`);
        if (!words.every((w) => hay.includes(w))) return null;
        const score = norm(p.brand).startsWith(n) ? 0 : hay.startsWith(n) ? 1 : 2;
        return { p, score };
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score)
      .slice(0, 7)
      .map((x) => x.p);
  }

  function showSuggestions(list) {
    const ul = $("#suggestions");
    if (!list.length) {
      ul.innerHTML = `<li class="none">Kein Produkt gefunden – im echten Betrieb kommt hier der komplette Händlerkatalog.</li>`;
      ul.hidden = false;
      return;
    }
    ul.innerHTML = list.map((p, i) =>
      `<li role="option" data-id="${p.id}" ${i === 0 ? 'aria-selected="true"' : ""}><b>${esc(p.brand)}</b> ${esc(p.name)}</li>`
    ).join("");
    ul.hidden = false;
  }

  function selectProduct(id, { updateUrl = true } = {}) {
    const p = productById(id);
    if (!p) return;
    state.product = p;
    $("#search-input").value = `${p.brand} ${p.name}`;
    $("#search-clear").hidden = false;
    $("#suggestions").hidden = true;
    if (updateUrl) history.replaceState(null, "", `?p=${encodeURIComponent(id)}`);
    render();
    fitToResults();
  }

  function clearProduct() {
    state.product = null;
    $("#search-input").value = "";
    $("#search-clear").hidden = true;
    $("#suggestions").hidden = true;
    history.replaceState(null, "", location.pathname);
    render();
    if (map) map.setView([52.505, 13.39], 12);
  }

  // ---------- Ergebnisse ----------
  function computeRows() {
    if (!state.product) return [];
    const order = { in: 0, low: 1, out: 2 };
    return STORES
      .filter((s) => state.chains.has(s.chain))
      .map((s) => ({ store: s, stock: stockFor(s, state.product), dist: km(state.user, s) }))
      .filter((r) => r.stock && (!state.onlyAvailable || r.stock.status !== "out"))
      .sort((a, b) => order[a.stock.status] - order[b.stock.status] || a.dist - b.dist);
  }

  function renderProductCard(p) {
    const card = $("#product-card");
    if (!p) { card.hidden = true; return; }
    const all = STORES.filter((s) => p.chains.includes(s.chain)).map((s) => stockFor(s, p));
    const avail = all.filter((x) => x.status !== "out").length;
    const prices = Object.values(p.prices);
    const min = Math.min(...prices), max = Math.max(...prices);
    card.innerHTML = `
      <div class="pc-top">
        <div>
          <div class="pc-brand">${esc(p.brand)}</div>
          <div class="pc-name">${esc(p.name)}</div>
        </div>
        <div class="pc-price">${min === max ? euro(min) : `${euro(min)} – ${euro(max)}`}</div>
      </div>
      <div class="pc-meta">
        ${p.chains.map((c) => `<span class="chain-tag" style="--c:${CHAINS[c].color}">${esc(CHAINS[c].name)}</span>`).join("")}
        <span class="pc-avail"><b>${avail}</b> von ${all.length} Filialen haben es da</span>
      </div>`;
    card.hidden = false;
  }

  function renderResults(rows) {
    const ul = $("#results");
    const summary = $("#results-summary");
    const p = state.product;
    $("#empty-state").hidden = !!p;
    if (!p) { ul.innerHTML = ""; summary.innerHTML = ""; return; }

    const missing = [...state.chains].filter((c) => !p.chains.includes(c)).map((c) => CHAINS[c].name);
    const nearest = rows.find((r) => r.stock.status !== "out");
    summary.innerHTML = [
      nearest ? `Nächste Filiale mit Bestand: <b>${esc(CHAINS[nearest.store.chain].name)} ${esc(nearest.store.area)}</b> (${fmtKm(nearest.dist)} von ${esc(state.user.label)})` : "Gerade in keiner Filiale vorrätig.",
      missing.length ? `<span class="muted">${esc(missing.join(", "))} ${missing.length > 1 ? "führen" : "führt"} dieses Produkt nicht.</span>` : "",
    ].filter(Boolean).join("<br>");

    if (!rows.length) {
      ul.innerHTML = `<li class="no-results">Keine passende Filiale – Filter anpassen?</li>`;
      return;
    }

    ul.innerHTML = rows.map(({ store, stock, dist }) => {
      const chain = CHAINS[store.chain];
      const st = STATUS[stock.status];
      const qtyText = stock.status === "out" ? "" : stock.status === "low" ? `noch ${stock.qty} Stück` : `${stock.qty} Stück`;
      const action = stock.status === "out"
        ? `<button type="button" class="ghost-btn" data-action="notify" data-store="${store.id}">Benachrichtigen</button>`
        : `<button type="button" class="ghost-btn" data-action="reserve" data-store="${store.id}">Reservieren</button>`;
      return `
        <li class="result ${stock.status}" data-store="${store.id}" tabindex="0">
          <div class="r-chain" style="--c:${chain.color}">${esc(chain.name)}</div>
          <div class="r-main">
            <div class="r-title">${esc(store.area)} <span class="muted">· ${esc(store.district)}</span></div>
            <div class="r-sub">${fmtKm(dist)} · ${euro(stock.price)} · aktualisiert vor ${stock.updatedMin} Min.</div>
            <div class="r-actions">
              ${action}
              <a class="ghost-btn" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}">Route</a>
            </div>
          </div>
          <div class="r-status" style="--s:${st.color}">
            <span class="pill">${st.label}</span>
            <small>${qtyText}</small>
          </div>
        </li>`;
    }).join("");
  }

  function focusStore(id, pan = true) {
    document.querySelectorAll(".result.active").forEach((el) => el.classList.remove("active"));
    const el = document.querySelector(`.result[data-store="${id}"]`);
    if (el) { el.classList.add("active"); if (!pan) el.scrollIntoView({ behavior: "smooth", block: "nearest" }); }
    const m = storeMarkers.get(id);
    if (map && m) {
      if (pan) map.flyTo(m.getLatLng(), Math.max(map.getZoom(), 14), { duration: 0.6 });
      m.openPopup();
    }
  }

  function fitToResults() {
    if (!map) return;
    const pts = computeRows().filter((r) => r.stock.status !== "out").slice(0, 6).map((r) => [r.store.lat, r.store.lng]);
    pts.push([state.user.lat, state.user.lng]);
    if (pts.length > 1) map.fitBounds(pts, { padding: [40, 40], maxZoom: 14 });
  }

  function renderFilters() {
    $("#chain-filters").innerHTML = Object.entries(CHAINS).map(([key, c]) =>
      `<button type="button" class="chip ${state.chains.has(key) ? "on" : ""}" data-chain="${key}" style="--c:${c.color}" aria-pressed="${state.chains.has(key)}">${esc(c.name)}</button>`
    ).join("");
  }

  // ---------- Stöbern nach Kategorie ----------
  const CAT_LABEL = {
    reinigung: "Reinigung", serum: "Wirkstoff-Serum", feuchtigkeit: "Feuchtigkeitsserum", peeling: "Peeling", retinoid: "Vitamin A",
    pflege: "Gesichtscreme", sonnenschutz: "Sonnenschutz", makeup: "Make-up",
    shampoo: "Shampoo", spuelung: "Spülung", maske: "Haarkur", leavein: "Leave-in und Öl", hitzeschutz: "Hitzeschutz", styling: "Styling", kopfhaut: "Kopfhaut",
  };
  const BROWSE = [
    { key: "haut", label: "Hautpflege", match: (p) => !p.area && p.category !== "makeup" },
    { key: "makeup", label: "Make-up", match: (p) => p.category === "makeup" },
    { key: "haar", label: "Haare", match: (p) => p.area === "haar" },
  ];
  let browseKey = "haut";
  function renderBrowse() {
    $("#browse-tabs").innerHTML = BROWSE.map((b) =>
      `<button type="button" role="tab" aria-selected="${b.key === browseKey}" class="${b.key === browseKey ? "on" : ""}" data-browse="${b.key}">${esc(b.label)}</button>`).join("");
    const group = BROWSE.find((b) => b.key === browseKey);
    const items = PRODUCTS.filter(group.match);
    const cats = [...new Set(Object.keys(CAT_LABEL).filter((c) => items.some((p) => p.category === c)))];
    $("#browse-list").innerHTML = cats.map((c) => `
      <li class="browse-group"><span class="browse-cat">${esc(CAT_LABEL[c])}</span>
        <ul>${items.filter((p) => p.category === c).map((p) => `
          <li><button type="button" class="browse-item" data-pick="${p.id}">
            <span><b>${esc(p.brand)}</b> ${esc(p.name)}</span>
            <span class="browse-price">ab ${euro(minPrice(p))}</span>
          </button></li>`).join("")}</ul>
      </li>`).join("");
  }

  function render() {
    const rows = computeRows();
    renderFilters();
    renderProductCard(state.product);
    renderResults(rows);
    updateMarkers(rows);
  }

  // ---------- Gemeinsames für Haut- und Haar-Check ----------
  function season(d = new Date()) {
    const m = d.getMonth() + 1;
    if (m === 12 || m <= 2) return "winter";
    if (m <= 5) return "fruehling";
    if (m <= 8) return "sommer";
    return "herbst";
  }
  const SEASON_NAME = { winter: "Winter", fruehling: "Frühling", sommer: "Sommer", herbst: "Herbst" };

  const nearBonus = (p) => Math.min(STORES.filter((st) => p.chains.includes(st.chain) && km(state.user, st) < 4)
    .map((st) => stockFor(st, p)).filter((x) => x.status !== "out").length, 4) * 0.25;
  const minPrice = (p) => Math.min(...Object.values(p.prices));

  function nearestAvailable(p) {
    return STORES.filter((s) => p.chains.includes(s.chain))
      .map((s) => ({ s, st: stockFor(s, p), d: km(state.user, s) }))
      .filter((x) => x.st.status !== "out")
      .sort((x, y) => x.d - y.d)[0];
  }

  // Ein Schritt der Routine. r = { p, why, note, relaxed } oder { plain: "Text" }
  function stepHtml(label, r, i) {
    if (!r) return `<li class="step"><span class="step-n">${i + 1}</span><div class="step-body"><div class="step-cat">${esc(label)}</div><span class="muted">Kein passendes Produkt in deinem Budget gefunden.</span></div></li>`;
    if (r.plain) return `<li class="step"><span class="step-n">${i + 1}</span><div class="step-body"><div class="step-cat">${esc(label)}</div><div class="step-prod">${esc(r.plain)}</div>${r.note ? `<div class="step-note">${esc(r.note)}</div>` : ""}</div></li>`;
    const near = nearestAvailable(r.p);
    const where = near ? `${PIN}${esc(CHAINS[near.s.chain].name)} ${esc(near.s.area)} · ${fmtKm(near.d)}` : "Gerade nirgends vorrätig";
    return `
      <li class="step">
        <span class="step-n">${i + 1}</span>
        <div class="step-body">
          <div class="step-cat">${esc(label)}</div>
          <div class="step-prod"><b>${esc(r.p.brand)}</b> ${esc(r.p.name)}</div>
          ${r.note ? `<div class="step-note">${esc(r.note)}</div>` : ""}
          ${r.why && r.why.length ? `<div class="step-why">${esc(r.why.join(" · "))}</div>` : ""}
          ${r.relaxed ? `<div class="step-why warn">Enthält möglicherweise Duftstoffe. Im Budget gab es keine parfümfreie Alternative.</div>` : ""}
          <div class="step-foot">
            <span class="step-where">${where}</span>
            <button type="button" class="ghost-btn" data-find="${r.p.id}">Finden</button>
          </div>
        </div>
      </li>`;
  }

  const listJoin = (arr) => arr.join(" und ").replace(/ und (?=.* und )/g, ", ");

  // Fragebogen-Baustein: eine Frage pro Bildschirm, Fortschritt, Zurück, Ergebnis
  function createQuiz(prefix, questions, onDone) {
    const answers = {};
    let idx = 0;
    const el = (n) => $(`#${prefix}-${n}`);
    const show = (view) => { ["intro", "quiz", "result"].forEach((v) => { el(v).hidden = v !== view; }); window.scrollTo({ top: 0 }); };

    function render(animate = true) {
      const q = questions[idx];
      const selected = q.multi ? new Set(answers[q.key] || []) : answers[q.key];
      el("progress").style.width = `${((idx + 1) / questions.length) * 100}%`;
      el("count").textContent = `Frage ${idx + 1} von ${questions.length}`;
      if (animate) {
        el("body").innerHTML = `
          <h2 class="q-title" id="${prefix}-qtitle">${esc(q.title)}</h2>
          ${q.hint ? `<p class="q-hint">${esc(q.hint)}</p>` : ""}
          <div class="options ${q.multi ? "multi" : ""}" role="${q.multi ? "group" : "radiogroup"}" aria-labelledby="${prefix}-qtitle">
            ${q.options.map((o) => `<button type="button" class="option" data-v="${o.v}" role="${q.multi ? "checkbox" : "radio"}" aria-checked="false">
                <span class="o-text"><span class="o-label">${esc(o.l)}</span>${o.d ? `<span class="o-desc">${esc(o.d)}</span>` : ""}</span>
                <span class="o-check" aria-hidden="true"></span>
              </button>`).join("")}
          </div>`;
        el("body").classList.remove("enter"); void el("body").offsetWidth; el("body").classList.add("enter");
      }
      el("body").querySelectorAll(".option").forEach((b) => {
        const on = q.multi ? selected.has(b.dataset.v) : selected === b.dataset.v;
        b.classList.toggle("on", on); b.setAttribute("aria-checked", on);
      });
      const last = idx === questions.length - 1;
      el("next").hidden = !q.multi && !selected;
      el("next").textContent = last ? "Ergebnis anzeigen" : q.multi && !selected.size ? "Überspringen" : "Weiter";
      el("back").textContent = idx === 0 ? "Abbrechen" : "Zurück";
    }
    const next = () => {
      if (idx < questions.length - 1) { idx++; render(); }
      else { el("result").innerHTML = onDone(answers) + `<button type="button" class="secondary-btn" data-restart>Neu starten</button>`; show("result"); }
    };

    el("total").textContent = questions.length;
    el("start").addEventListener("click", () => { idx = 0; show("quiz"); render(); });
    el("back").addEventListener("click", () => { if (idx === 0) { show("intro"); return; } idx--; render(); });
    el("next").addEventListener("click", next);
    el("body").addEventListener("click", (e) => {
      const btn = e.target.closest(".option");
      if (!btn) return;
      const q = questions[idx];
      if (q.multi) {
        const set = new Set(answers[q.key] || []);
        set.has(btn.dataset.v) ? set.delete(btn.dataset.v) : set.add(btn.dataset.v);
        answers[q.key] = [...set];
        render(false);
      } else {
        answers[q.key] = btn.dataset.v;
        render(false);
        setTimeout(next, 220);
      }
    });
    el("result").addEventListener("click", (e) => {
      const find = e.target.closest("[data-find]");
      if (find) { switchTab("tab-search"); selectProduct(find.dataset.find); return; }
      if (e.target.closest("[data-restart]")) { Object.keys(answers).forEach((k) => delete answers[k]); show("intro"); }
    });
  }

  // =====================================================================
  // HAUT-CHECK
  // Die Routine-Logik orientiert sich an Pflegegrundsätzen, die der Skinfluencer
  // Leon (@xskincare) öffentlich teilt (Quelle: Presseberichte, siehe docs/KONZEPT.md):
  //  - Hauttyp-Test: 60 Minuten nach dem Waschen ohne Creme fühlen
  //  - Morgens: Niacinamid- oder Vitamin-C-Serum, dann Feuchtigkeit, Creme, LSF
  //  - Feuchtigkeit: Glycerin/Panthenol oft wirksamer als nur Hyaluron
  //  - AHA und BHA an unterschiedlichen Abenden im Wechsel
  //  - Poren: Niacinamid, BHA, Vitamin A – Poren sind normal und nicht "wegzumachen"
  //  - Gereizte Haut: Routine reduzieren, morgens nur Wasser, keine Säuren/Retinol/Alkohol
  // =====================================================================
  const SKIN_SEASON_TIP = {
    winter: "Heizungsluft und Kälte entziehen der Haut Feuchtigkeit. Setz auf reichhaltigere Pflege und vergiss den Sonnenschutz am Morgen trotzdem nicht.",
    herbst: "Die Haut stellt sich auf trockene Heizungsluft um. Leg bei der Feuchtigkeit nach und dosiere Peelings eher sanft.",
    fruehling: "Die UV-Strahlung steigt schnell an. Trag jetzt wieder konsequent Sonnenschutz, im frühen Frühjahr reicht oft LSF 30.",
    sommer: "Leichte Texturen, hoher LSF und regelmäßiges Nachcremen. Abends gründlich reinigen, um Sonnencreme und Schweiß zu entfernen.",
  };
  const CONCERN_LABEL = { unreinheiten: "Unreinheiten", trockenheit: "Trockenheit", roetungen: "Rötungen", glanz: "Glanz & Poren", falten: "Fältchen", pigmentflecken: "Pigmentflecken", sonnenschutz: "UV-Schutz" };
  const SKIN_LABEL = { trocken: "Trockene Haut", fettig: "Fettige Haut", mischhaut: "Mischhaut", normal: "Ausgeglichene Haut" };
  const SKIN_WHY = { trocken: "trockener Haut", fettig: "fettiger Haut", mischhaut: "Mischhaut", normal: "ausgeglichener Haut" };

  const SKIN_QUESTIONS = [
    { key: "skinType", title: "Wie fühlt sich deine Haut im Laufe des Tages an?", options: [
      { v: "trocken", l: "Trocken", d: "Spannt, wirkt manchmal schuppig" },
      { v: "fettig", l: "Fettig", d: "Glänzt im ganzen Gesicht" },
      { v: "mischhaut", l: "Mischhaut", d: "Stirn, Nase und Kinn glänzen, Wangen sind eher trocken" },
      { v: "normal", l: "Ausgeglichen", d: "Weder besonders trocken noch fettig" } ] },
    { key: "afterWash", title: "Kleiner Test: Wie fühlt sich deine Haut 60 Minuten nach dem Waschen an, ohne Creme?", options: [
      { v: "spannt", l: "Sie spannt", d: "Eher trockene Haut" },
      { v: "angenehm", l: "Angenehm", d: "Eher ausgeglichene Haut" },
      { v: "tzone", l: "Nur Stirn und Nase glänzen", d: "Eher Mischhaut" },
      { v: "glaenzt", l: "Sie glänzt überall", d: "Eher fettige Haut" } ] },
    { key: "concerns", multi: true, title: "Woran möchtest du gerade arbeiten?", hint: "Wähle alles, was zutrifft.", options: [
      { v: "unreinheiten", l: "Pickel und Unreinheiten" },
      { v: "trockenheit", l: "Trockene Stellen" },
      { v: "roetungen", l: "Rötungen" },
      { v: "glanz", l: "Glanz und sichtbare Poren" },
      { v: "falten", l: "Erste Fältchen" },
      { v: "pigmentflecken", l: "Pigmentflecken oder fahler Teint" } ] },
    { key: "sensitive", title: "Reagiert deine Haut empfindlich?", hint: "Zum Beispiel mit Brennen, Jucken oder Rötungen nach neuen Produkten.", options: [
      { v: "ja", l: "Ja, sie ist gerade gereizt" }, { v: "manchmal", l: "Manchmal" }, { v: "nein", l: "Nein, kaum" } ] },
    { key: "fragrance", title: "Wie verträgst du Duftstoffe in Pflegeprodukten?", options: [
      { v: "ok", l: "Problemlos" },
      { v: "ohne", l: "Lieber ohne", d: "Wir empfehlen dann nur parfümfreie Produkte" },
      { v: "unsicher", l: "Weiß ich nicht" } ] },
    { key: "age", title: "Wie alt bist du?", hint: "Die Haut verändert sich mit den Jahren, das beeinflusst die passenden Wirkstoffe.", options: [
      { v: "u20", l: "Unter 20" }, { v: "20", l: "20 bis 29" }, { v: "30", l: "30 bis 39" }, { v: "40", l: "40 oder älter" } ] },
    { key: "makeup", title: "Wie oft trägst du Make-up?", options: [
      { v: "taeglich", l: "Täglich" }, { v: "manchmal", l: "Ab und zu" }, { v: "selten", l: "Selten oder nie" } ] },
    { key: "outdoor", title: "Wie viel Zeit verbringst du draußen?", options: [
      { v: "wenig", l: "Kaum", d: "Meist drinnen, Büro oder Uni" },
      { v: "mittel", l: "Täglich etwas", d: "Wege zu Fuß oder mit dem Rad" },
      { v: "viel", l: "Viel", d: "Sport oder Arbeit draußen" } ] },
    { key: "sleep", title: "Wie geht es dir gerade mit Schlaf und Stress?", options: [
      { v: "gut", l: "Gut", d: "Meist 7 bis 8 Stunden Schlaf" },
      { v: "wenig", l: "Zu wenig Schlaf", d: "Oft unter 6 Stunden" },
      { v: "stress", l: "Viel Stress", d: "Prüfungen, Job oder Unruhe" } ] },
    { key: "routine", title: "Wie viel Zeit möchtest du in deine Routine stecken?", options: [
      { v: "minimal", l: "So wenig wie möglich", d: "2 bis 3 Schritte" },
      { v: "normal", l: "Ausgewogen", d: "3 bis 5 Schritte" },
      { v: "ausfuehrlich", l: "Gerne ausführlich", d: "Mit Peelings und Wirkstoffen im Wechsel" } ] },
    { key: "budget", title: "Wie viel möchtest du pro Produkt ausgeben?", options: [
      { v: "15", l: "Bis 15 €" }, { v: "30", l: "Bis 30 €" }, { v: "999", l: "Egal" } ] },
  ];

  function skinProfile(a) {
    let skinType = a.skinType;
    const test = { spannt: "trocken", tzone: "mischhaut", glaenzt: "fettig" }[a.afterWash];
    if (skinType === "normal" && test) skinType = test; // der 60-Minuten-Test entscheidet bei "ausgeglichen"
    const weights = {};
    (a.concerns || []).forEach((c) => { weights[c] = 2; });
    const soft = (c, w) => { weights[c] = Math.max(weights[c] || 0, w); };
    if (a.afterWash === "spannt") soft("trockenheit", 1);
    if (a.afterWash === "glaenzt" || a.afterWash === "tzone") soft("glanz", 1);
    if (a.age === "30" || a.age === "40") soft("falten", a.age === "40" ? 1.5 : 1);
    if (a.outdoor === "viel") soft("pigmentflecken", 1);
    return {
      skinType, weights,
      sensitive: a.sensitive,
      irritated: a.sensitive === "ja",
      noFragrance: a.fragrance === "ohne" || a.sensitive === "ja",
      noActives: a.sensitive === "ja" || a.age === "u20",
      budget: Number(a.budget),
    };
  }

  function skinScore(p, pr, slot, sea, strict) {
    if (minPrice(p) > pr.budget) return null;
    if (p.time !== "beides" && p.time !== slot) return null;
    const ff = p.tags.includes("parfuemfrei");
    if (strict && pr.noFragrance && !ff) return null;
    if (pr.noActives && p.tags.includes("aktiv")) return null;
    let s = p.time === slot ? 1 : 0;
    const why = [];
    if (p.skin.includes(pr.skinType)) { s += 3; why.push(`passt zu ${SKIN_WHY[pr.skinType]}`); }
    const hits = p.concerns.filter((c) => pr.weights[c]);
    hits.forEach((c) => { s += pr.weights[c]; });
    if (hits.length) why.push(hits.map((c) => CONCERN_LABEL[c]).join(", "));
    if (p.tags.includes("glycerin")) { s += 2; why.push("mit Glycerin für tiefe Feuchtigkeit"); }
    if (pr.sensitive === "ja") s += ff ? 3 : -3;
    if (pr.sensitive === "manchmal" && ff) s += 1;
    if (ff && (pr.noFragrance || pr.sensitive !== "nein")) why.push("parfümfrei");
    if ((sea === "winter" || sea === "herbst") && p.tags.includes("reichhaltig") && pr.skinType !== "fettig") { s += 1.5; why.push("reichhaltig für die Heizungssaison"); }
    if ((sea === "sommer" || sea === "fruehling") && p.tags.includes("leicht")) { s += 1.5; why.push("leichte Textur"); }
    s += nearBonus(p);
    return { p, s, why, relaxed: !strict && pr.noFragrance && !ff };
  }

  function skinPick(filter, slot, pr, sea, exclude = new Set()) {
    const run = (strict) => PRODUCTS.filter((p) => !p.area && filter(p) && !exclude.has(p.id))
      .map((p) => skinScore(p, pr, slot, sea, strict)).filter(Boolean).sort((x, y) => y.s - x.s)[0];
    return run(true) || run(false) || null;
  }
  const cat = (c) => (p) => p.category === c;

  function skinResult(a) {
    const sea = season();
    const pr = skinProfile(a);
    const minimal = a.routine === "minimal", full = a.routine === "ausfuehrlich";
    const has = (c) => !!pr.weights[c];
    const morning = [], evening = [];
    const used = new Set();
    const add = (list, label, r) => { if (r) { list.push([label, r]); if (r.p) used.add(r.p.id); } };

    // Morgens
    if (pr.irritated) add(morning, "Reinigen", { plain: "Nur lauwarmes Wasser", note: "Bei gereizter Haut morgens auf Reinigungsprodukte verzichten." });
    else if (!minimal) add(morning, "Reinigen", skinPick((p) => p.category === "reinigung" && !p.tags.includes("aktiv") && !p.remover, "morgens", pr, sea));
    if (!pr.irritated && (!minimal || Object.keys(pr.weights).length)) {
      const wantVitC = has("pigmentflecken") && !has("unreinheiten") && !has("glanz");
      const serum = skinPick((p) => p.category === "serum" && (wantVitC ? /Vitamin C/i.test(p.name) : !/Vitamin C/i.test(p.name)), "morgens", pr, sea)
        || skinPick(cat("serum"), "morgens", pr, sea);
      if (serum) serum.note = /Vitamin C/i.test(serum.p.name) ? "Vitamin C morgens für einen frischeren Teint" : "Niacinamid verfeinert Poren und beruhigt";
      add(morning, "Wirkstoff-Serum", serum);
    }
    if (!minimal) add(morning, "Feuchtigkeit", skinPick(cat("feuchtigkeit"), "morgens", pr, sea));
    add(morning, "Pflegen", skinPick(cat("pflege"), "morgens", pr, sea));
    add(morning, "Sonnenschutz", skinPick(cat("sonnenschutz"), "morgens", pr, sea));

    // Abends
    const doubleCleanse = a.makeup === "taeglich" || (a.makeup === "manchmal" && full);
    let remover = null;
    if (doubleCleanse) { remover = skinPick((p) => p.remover, "abends", pr, sea); add(evening, "Abschminken", remover); }
    add(evening, "Reinigen", skinPick((p) => p.category === "reinigung" && !(remover && p.remover) && !p.tags.includes("aktiv"), "abends", pr, sea));
    let exfoliants = [];
    if (!minimal && !pr.noActives) {
      const wantBHA = has("unreinheiten") || has("glanz");
      const wantAHA = has("pigmentflecken") || has("falten") || has("trockenheit");
      const bha = wantBHA ? skinPick((p) => p.category === "peeling" && p.acid === "bha", "abends", pr, sea) : null;
      const aha = wantAHA && (full || !bha) ? skinPick((p) => p.category === "peeling" && p.acid === "aha", "abends", pr, sea) : null;
      if (bha && aha) { bha.note = "2–3 Abende pro Woche, im Wechsel mit dem AHA"; aha.note = "An anderen Abenden als das BHA, nie zusammen"; }
      else if (bha) bha.note = "2–3 Abende pro Woche";
      else if (aha) aha.note = "2–3 Abende pro Woche";
      if (bha) { add(evening, "BHA-Peeling", bha); exfoliants.push(bha); }
      if (aha) { add(evening, "AHA-Peeling", aha); exfoliants.push(aha); }
      if ((has("falten") || (full && has("glanz"))) && (full || !exfoliants.length)) {
        const ret = skinPick(cat("retinoid"), "abends", pr, sea);
        if (ret) { ret.note = exfoliants.length ? "An peelingfreien Abenden, langsam steigern" : "Mit 2 Abenden pro Woche starten"; add(evening, "Vitamin A", ret); exfoliants.push(ret); }
      }
    }
    if (!minimal) add(evening, "Feuchtigkeit", skinPick(cat("feuchtigkeit"), "abends", pr, sea));
    add(evening, "Pflegen", skinPick(cat("pflege"), "abends", pr, sea));

    const tips = [];
    if (pr.irritated) tips.push("Gereizte Haut braucht weniger, nicht mehr: keine Säuren, kein Retinol, keine alkoholhaltigen Produkte. Gib der Haut 2 bis 6 Wochen und führe Wirkstoffe danach langsam wieder ein.");
    if (exfoliants.length) tips.push("Benutze AHA, BHA und Vitamin A nicht am selben Abend. Wechsle sie ab und trag morgens immer Sonnenschutz.");
    if (has("glanz")) tips.push("Poren sind normal und lassen sich nicht wegmachen. Niacinamid, BHA und Vitamin A können sie aber sichtbar verfeinern.");
    if (doubleCleanse) tips.push("Abends doppelt reinigen: erst mit Mizellenwasser Make-up und Sonnencreme lösen, dann mit dem Waschgel nachreinigen.");
    if (a.outdoor === "viel") tips.push("Du bist viel draußen. Trag den Sonnenschutz alle zwei Stunden neu auf, auch im Winter.");
    if (a.sleep === "wenig") tips.push("Zu wenig Schlaf zeigt sich oft als fahle Haut und Augenringe. Feuchtigkeit hilft kurzfristig, ausreichend Schlaf hilft langfristig mehr.");
    if (a.sleep === "stress") tips.push("Stress kann Unreinheiten und Rötungen verstärken. Probier nicht zu viele neue Produkte gleichzeitig aus.");
    if (pr.weights.roetungen) tips.push("Wenn Rötungen länger anhalten, lass sie am besten dermatologisch abklären.");

    const explicit = (a.concerns || []).map((c) => CONCERN_LABEL[c]);
    const focus = (explicit.length ? explicit : Object.keys(pr.weights).map((c) => CONCERN_LABEL[c])).slice(0, 3);
    const sensLabel = { ja: "Gerade gereizt", manchmal: "Leicht empfindlich", nein: "Robust" }[pr.sensitive];

    return `
      <div class="result-head">
        <p class="eyebrow">Dein Ergebnis</p>
        <h2>${esc(SKIN_LABEL[pr.skinType])}${focus.length ? `, Fokus auf ${esc(listJoin(focus))}` : ""}</h2>
        <div class="profile-tags">
          <span>${esc(sensLabel)}</span>
          ${pr.noFragrance ? "<span>Parfümfrei</span>" : ""}
          <span>${esc(SEASON_NAME[sea])}-Routine</span>
          <span>${pr.budget > 100 ? "Ohne Budgetgrenze" : `Bis ${pr.budget} € pro Produkt`}</span>
        </div>
      </div>
      <div class="season-tip"><b>${esc(SEASON_NAME[sea])}:</b> ${SKIN_SEASON_TIP[sea]}</div>
      <div class="routine-cols">
        <div class="routine-col"><h3>${SUN}Morgens</h3><ol>${morning.map(([l, r], i) => stepHtml(l, r, i)).join("")}</ol></div>
        <div class="routine-col"><h3>${MOON}Abends</h3><ol>${evening.map(([l, r], i) => stepHtml(l, r, i)).join("")}</ol></div>
      </div>
      ${tips.length ? `<div class="tips"><h3>Gut zu wissen</h3><ul>${tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>` : ""}
      <p class="disclaimer">Die Empfehlungen orientieren sich an Pflegegrundsätzen, die der Skinfluencer Leon (@xskincare) öffentlich teilt. Es besteht keine Kooperation. Sie ersetzen keine ärztliche oder dermatologische Beratung.</p>`;
  }

  // =====================================================================
  // HAAR-CHECK
  // =====================================================================
  const HAIR_GOAL_LABEL = { volumen: "Volumen", feuchtigkeit: "Feuchtigkeit", reparatur: "Reparatur", glanz: "Glanz", locken: "definierte Locken", frizz: "weniger Frizz", farbe: "Farbschutz", kopfhaut: "Kopfhautpflege", dichte: "Fülle", haarausfall: "Haarausfall vorbeugen", wachstum: "mehr Haarwachstum", haardicke: "kräftigeres Haar" };
  const HAIR_TYPE_LABEL = { glatt: "Glattes Haar", wellig: "Welliges Haar", lockig: "Lockiges Haar", kraus: "Krauses Haar" };
  const HAIR_SEASON_TIP = {
    winter: "Heizungsluft und Mützen machen Haare trocken und elektrisch. Gönn den Längen öfter eine Kur und geh nur mit trockenen Haaren raus.",
    herbst: "Im Herbst fallen oft etwas mehr Haare aus, das ist meist normal. Pflege die Kopfhaut sanft und die Längen mit etwas mehr Feuchtigkeit.",
    fruehling: "Im Frühling ist ein guter Moment für einen Spitzenschnitt, um Winterspliss loszuwerden.",
    sommer: "Sonne, Salz- und Chlorwasser trocknen das Haar aus. Nach dem Baden ausspülen und Leave-in mit UV-Schutz nutzen.",
  };

  const HAIR_QUESTIONS = [
    { key: "hairType", title: "Wie fallen deine Haare, wenn sie lufttrocknen?", options: [
      { v: "glatt", l: "Glatt", d: "Fallen gerade, ohne Wellen" },
      { v: "wellig", l: "Wellig", d: "Leichte S-Wellen" },
      { v: "lockig", l: "Lockig", d: "Deutliche Locken oder Korkenzieher" },
      { v: "kraus", l: "Kraus", d: "Sehr enge Locken, Coils oder Zickzack-Muster" } ] },
    { key: "thick", title: "Wie dick ist ein einzelnes Haar?", hint: "Reib ein Haar zwischen den Fingern.", options: [
      { v: "fein", l: "Fein", d: "Kaum zu spüren" },
      { v: "mittel", l: "Mittel", d: "Gut zu spüren" },
      { v: "dick", l: "Dick", d: "Fühlt sich kräftig an, fast wie ein Faden" } ] },
    { key: "length", title: "Wie lang sind deine Haare?", options: [
      { v: "kurz", l: "Kurz", d: "Bis zum Kinn" },
      { v: "mittel", l: "Mittellang", d: "Bis zur Schulter" },
      { v: "lang", l: "Lang", d: "Bis zur Brust oder zum Rücken" },
      { v: "sehrlang", l: "Sehr lang", d: "Bis zur Taille oder länger" } ] },
    { key: "scalp", title: "Wie ist deine Kopfhaut?", options: [
      { v: "fettig", l: "Fettet schnell", d: "Nach 1 bis 2 Tagen strähnig" },
      { v: "normal", l: "Unauffällig" },
      { v: "trocken", l: "Trocken", d: "Spannt oder juckt" },
      { v: "schuppen", l: "Schuppen", d: "Sichtbare Schuppen auf Kopfhaut oder Kleidung" } ] },
    { key: "lengths", title: "Und wie fühlen sich die Längen und Spitzen an?", options: [
      { v: "gesund", l: "Weich und gesund" },
      { v: "trocken", l: "Trocken und strohig" },
      { v: "spliss", l: "Spliss und Haarbruch" } ] },
    { key: "color", title: "Sind deine Haare gefärbt oder blondiert?", options: [
      { v: "natur", l: "Nein, Naturhaar" },
      { v: "gefaerbt", l: "Gefärbt oder getönt" },
      { v: "blondiert", l: "Blondiert oder Strähnchen" } ] },
    { key: "heat", title: "Wie oft benutzt du Föhn, Glätteisen oder Lockenstab?", options: [
      { v: "taeglich", l: "Fast täglich" }, { v: "manchmal", l: "Ab und zu" }, { v: "nie", l: "Kaum oder nie", d: "Meist lufttrocknen" } ] },
    { key: "wash", title: "Wie oft wäschst du deine Haare?", options: [
      { v: "taeglich", l: "Täglich" }, { v: "zwei", l: "Alle 2 bis 3 Tage" }, { v: "selten", l: "Einmal pro Woche oder seltener" } ] },
    { key: "goals", multi: true, title: "Was wünschst du dir für deine Haare?", hint: "Wähle alles, was zutrifft.", options: [
      { v: "volumen", l: "Mehr Volumen" },
      { v: "glanz", l: "Mehr Glanz" },
      { v: "feuchtigkeit", l: "Mehr Feuchtigkeit" },
      { v: "frizz", l: "Weniger Frizz" },
      { v: "locken", l: "Definierte Locken" },
      { v: "farbe", l: "Farbe länger erhalten oder Gelbstich vermeiden" },
      { v: "wachstum", l: "Mehr Haarwachstum" },
      { v: "haardicke", l: "Kräftigeres, dickeres Haar" },
      { v: "haarausfall", l: "Haarausfall vorbeugen" } ] },
    { key: "budget", title: "Wie viel möchtest du pro Produkt ausgeben?", options: [
      { v: "10", l: "Bis 10 €" }, { v: "30", l: "Bis 30 €" }, { v: "999", l: "Egal" } ] },
  ];

  function hairProfile(a) {
    const w = {};
    (a.goals || []).forEach((g) => { w[g] = 2; });
    const soft = (g, v) => { w[g] = Math.max(w[g] || 0, v); };
    if (a.lengths === "trocken") soft("feuchtigkeit", 1.5);
    if (a.lengths === "spliss") soft("reparatur", 2);
    if (a.color === "gefaerbt") { soft("farbe", 1.5); soft("reparatur", 0.5); }
    if (a.color === "blondiert") { soft("reparatur", 2); soft("farbe", 1); }
    if (a.hairType === "lockig" || a.hairType === "kraus") { soft("locken", 1); soft("frizz", 1); soft("feuchtigkeit", 1); }
    if (a.heat === "taeglich") soft("reparatur", 1);
    if (a.scalp === "schuppen") soft("kopfhaut", 3);
    if (a.scalp === "trocken") soft("kopfhaut", 1.5);
    if (a.scalp === "fettig" && a.thick === "fein") soft("volumen", 1);
    if (w.haarausfall) { soft("dichte", 2.5); soft("kopfhaut", 1.5); }
    if (w.wachstum) { soft("dichte", 1.5); soft("kopfhaut", 1.5); soft("reparatur", 1); }
    if (w.haardicke) { soft("volumen", 1.5); soft("reparatur", 1); }
    if (a.length === "lang") { soft("reparatur", 1); soft("feuchtigkeit", 0.5); }
    if (a.length === "sehrlang") { soft("reparatur", 1.5); soft("feuchtigkeit", 1); }
    return { ...a, w, budget: Number(a.budget) };
  }

  function hairScore(p, pr) {
    const h = p.hair;
    if (minPrice(p) > pr.budget) return null;
    if (h.blondOnly && pr.color !== "blondiert") return null;
    let s = 0;
    const why = [];
    if (h.types.includes(pr.hairType)) { s += 3; why.push(`für ${HAIR_TYPE_LABEL[pr.hairType].replace(/^./, (c) => c.toLowerCase())}`); } else s -= 2;
    if (h.thick.includes(pr.thick)) s += 2; else s -= 1;
    if (h.scalp.includes(pr.scalp)) s += p.category === "shampoo" ? 3 : 1; else if (p.category === "shampoo") s -= 3;
    const hits = h.goals.filter((g) => pr.w[g]);
    hits.forEach((g) => { s += pr.w[g]; });
    if (hits.length) why.push(hits.map((g) => HAIR_GOAL_LABEL[g]).join(", "));
    if (h.color && pr.color !== "natur") { s += 1; why.push("für gefärbtes Haar"); }
    if (p.tags.includes("sulfatfrei") && (pr.color !== "natur" || pr.hairType === "lockig" || pr.hairType === "kraus")) { s += 1; why.push("sulfatfrei"); }
    if (p.tags.includes("leicht") && pr.thick === "fein") { s += 1; why.push("leicht, beschwert nicht"); }
    s += nearBonus(p);
    return { p, s, why };
  }

  const hairPick = (c, pr, filter = () => true) => PRODUCTS.filter((p) => p.area === "haar" && p.category === c && filter(p))
    .map((p) => hairScore(p, pr)).filter(Boolean).sort((x, y) => y.s - x.s)[0] || null;

  function hairResult(a) {
    const sea = season();
    const pr = hairProfile(a);
    const curly = pr.hairType === "lockig" || pr.hairType === "kraus";
    const short = pr.length === "kurz", long = pr.length === "lang" || pr.length === "sehrlang";
    const lossFocus = !!(pr.w.haarausfall || pr.w.wachstum);
    const washDay = [], extras = [];
    const add = (list, label, r) => { if (r) list.push([label, r]); };

    const shampoo = pr.scalp === "schuppen"
      ? hairPick("shampoo", pr, (p) => p.hair.goals.includes("kopfhaut") && !p.hair.goals.includes("dichte"))
      : hairPick("shampoo", pr, (p) => !(p.hair.blondOnly));
    if (shampoo) shampoo.note = pr.wash === "taeglich" ? "Bei täglicher Wäsche einmal kurz aufschäumen reicht" : "Vor allem auf die Kopfhaut, die Längen werden beim Ausspülen mitgereinigt";
    add(washDay, "Waschen", shampoo);
    const cond = hairPick("spuelung", pr);
    if (cond) cond.note = short ? "Eine kleine Menge reicht, nur in die Längen" : long ? "Großzügig in Längen und Spitzen, 2 bis 3 Minuten einwirken lassen" : "Nur in Längen und Spitzen, 2 bis 3 Minuten einwirken lassen";
    add(washDay, "Pflegen", cond);
    if (curly || long || (!short && (pr.w.glanz || pr.w.frizz || pr.lengths !== "gesund"))) {
      const leave = hairPick("leavein", pr);
      if (leave) leave.note = curly ? "Ins nasse Haar kneten, nicht trocken bürsten" : long ? "In die Spitzen, bei sehr langen Haaren auch in die unteren Längen" : "Ein bis zwei Pumpstöße in die Spitzen";
      add(washDay, curly ? "Leave-in" : "Leave-in oder Öl", leave);
    }
    if (pr.heat !== "nie") {
      const hp = hairPick("hitzeschutz", pr);
      if (hp) hp.note = "Vor jedem Föhnen oder Glätten";
      add(washDay, "Hitzeschutz", hp);
    }

    if (short ? (pr.lengths === "spliss" || pr.color === "blondiert") : (long || pr.lengths !== "gesund" || pr.color !== "natur" || pr.heat === "taeglich" || pr.w.feuchtigkeit || pr.w.haardicke || pr.w.wachstum)) {
      const mask = hairPick("maske", pr);
      if (mask) mask.note = "Einmal pro Woche statt der Spülung";
      add(extras, "Kur", mask);
    }
    if (pr.color === "blondiert") {
      const silver = hairPick("shampoo", pr, (p) => p.hair.blondOnly);
      if (silver) silver.note = "Einmal pro Woche gegen Gelbstich";
      add(extras, "Silbershampoo", silver);
    }
    let lossTonic = null;
    if (lossFocus) {
      lossTonic = hairPick("kopfhaut", pr, (p) => p.hair.goals.includes("dichte") || p.hair.goals.includes("wachstum"));
      if (lossTonic) lossTonic.note = "Täglich auf die Kopfhaut auftragen und sanft einmassieren, nicht ausspülen";
      add(extras, "Kopfhaut-Tonikum", lossTonic);
    }
    if (pr.scalp === "trocken" || pr.scalp === "schuppen") {
      const sc = hairPick("kopfhaut", pr, (p) => (!shampoo || p.id !== shampoo.p.id) && (!lossTonic || p.id !== lossTonic.p.id) && !p.hair.goals.includes("dichte"));
      if (sc) sc.note = "Auf die Kopfhaut auftragen, nicht ausspülen";
      add(extras, "Kopfhaut", sc);
    }
    if (pr.scalp === "fettig" && pr.wash !== "selten") {
      const dry = hairPick("styling", pr);
      if (dry) dry.note = "Zwischen den Wäschen, um einen Tag zu gewinnen";
      add(extras, "Zwischendurch", dry);
    }

    const tips = [];
    if (pr.scalp === "schuppen") tips.push("Benutze das Anti-Schuppen-Shampoo 2 bis 3 Mal pro Woche. Wenn es nach 4 Wochen nicht besser wird, lass die Kopfhaut ärztlich anschauen.");
    if (pr.w.wachstum) {
      tips.push("Haare wachsen etwa 1 Zentimeter pro Monat, schneller geht es kaum. Damit die Länge auch ankommt, ist weniger Haarbruch das Wichtigste: Hitzeschutz, sanftes Entwirren und regelmäßig die Spitzen schneiden.");
      tips.push("Massiere die Kopfhaut täglich ein paar Minuten, das fördert die Durchblutung. Wichtig sind auch genug Schlaf, Eiweiß, Eisen, Zink und Biotin in der Ernährung.");
    }
    if (pr.w.haardicke) tips.push("Wie dick ein einzelnes Haar ist, ist größtenteils angeboren. Pflege mit Proteinen, leichte Spülungen und Volumen-Styling lassen die Haare aber kräftiger und fülliger wirken, und Bond-Kuren beugen Haarbruch vor.");
    if (pr.w.haarausfall) {
      tips.push("50 bis 100 Haare am Tag zu verlieren ist normal. Fallen deutlich mehr aus, werden die Haare sichtbar dünner oder entstehen kahle Stellen, lass das ärztlich abklären. Oft stecken zum Beispiel Eisenmangel, die Schilddrüse oder Hormone dahinter.");
      tips.push("Vorbeugen kannst du so: straffe Zöpfe und enge Haargummis vermeiden, sanft und nur nass mit grobem Kamm entwirren, die Kopfhaut beim Waschen massieren und ausgewogen essen, mit genug Eiweiß, Eisen und Zink.");
    }
    if (lossFocus) tips.push("Koffein-Shampoos und Kopfhaut-Seren pflegen die Kopfhaut, ersetzen bei echtem Haarausfall aber keine Behandlung.");
    if (long) tips.push("Lange Haare brauchen Schutz in den Spitzen: alle 10 bis 12 Wochen schneiden, nachts locker flechten oder auf Seide schlafen und Haargummis ohne Metall benutzen.");
    if (short) tips.push("Bei kurzen Haaren reicht wenig Produkt. Kur und Öl brauchst du meist nur, wenn die Haare gefärbt oder strapaziert sind.");
    if (curly) tips.push("Locken mögen Feuchtigkeit: nur nass entwirren, mit einem Mikrofaser-Tuch oder T-Shirt trocknen und möglichst wenig anfassen.");
    if (pr.heat === "taeglich") tips.push("Föhn auf mittlerer Stufe und Glätteisen höchstens auf 180 °C. Lass die Haare zwischendurch auch mal lufttrocknen.");
    if (pr.scalp === "fettig" && pr.wash === "taeglich") tips.push("Tägliches Waschen ist in Ordnung, wenn das Shampoo mild ist. Spülung und Öl gehören nur in die Längen.");
    if (pr.color === "blondiert") tips.push("Blondiertes Haar ist besonders empfindlich. Eine Bond-Kur einmal pro Woche hilft, Haarbruch vorzubeugen.");
    if (pr.lengths === "spliss") tips.push("Spliss lässt sich nicht reparieren, nur verhindern. Lass die Spitzen alle 8 bis 12 Wochen schneiden.");

    const goals = ((a.goals || []).length ? a.goals : Object.keys(pr.w).sort((x, y) => pr.w[y] - pr.w[x])).map((g) => HAIR_GOAL_LABEL[g]);
    const thickLabel = { fein: "Feines Haar", mittel: "Mittelstarkes Haar", dick: "Kräftiges Haar" }[pr.thick];
    const scalpLabel = { fettig: "Schnell fettende Kopfhaut", normal: "Unauffällige Kopfhaut", trocken: "Trockene Kopfhaut", schuppen: "Schuppen" }[pr.scalp];

    return `
      <div class="result-head">
        <p class="eyebrow">Dein Ergebnis</p>
        <h2>${esc(HAIR_TYPE_LABEL[pr.hairType])}${goals.length ? `, Fokus auf ${esc(listJoin(goals.slice(0, 3)))}` : ""}</h2>
        <div class="profile-tags">
          <span>${esc({ kurz: "Kurze Haare", mittel: "Mittellange Haare", lang: "Lange Haare", sehrlang: "Sehr lange Haare" }[pr.length])}</span>
          <span>${esc(thickLabel)}</span>
          <span>${esc(scalpLabel)}</span>
          ${pr.color !== "natur" ? `<span>${pr.color === "blondiert" ? "Blondiert" : "Gefärbt"}</span>` : ""}
          <span>${pr.budget > 100 ? "Ohne Budgetgrenze" : `Bis ${pr.budget} € pro Produkt`}</span>
        </div>
      </div>
      <div class="season-tip"><b>${esc(SEASON_NAME[sea])}:</b> ${HAIR_SEASON_TIP[sea]}</div>
      <div class="routine-cols">
        <div class="routine-col"><h3>${DROP}Am Waschtag</h3><ol>${washDay.map(([l, r], i) => stepHtml(l, r, i)).join("")}</ol></div>
        ${extras.length ? `<div class="routine-col"><h3>${CAL}Ab und zu</h3><ol>${extras.map(([l, r], i) => stepHtml(l, r, i)).join("")}</ol></div>` : ""}
      </div>
      ${tips.length ? `<div class="tips"><h3>Gut zu wissen</h3><ul>${tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>` : ""}
      <p class="disclaimer">Diese Empfehlungen ersetzen keine ärztliche oder dermatologische Beratung.</p>`;
  }

  function initChecks() {
    document.querySelectorAll(".season-name").forEach((n) => { n.textContent = SEASON_NAME[season()]; });
    createQuiz("skin", SKIN_QUESTIONS, skinResult);
    createQuiz("hair", HAIR_QUESTIONS, hairResult);
  }

  // ---------- Tabs ----------
  function switchTab(id) {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.id === id));
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === id));
    if (id === "tab-search" && map) setTimeout(() => map.invalidateSize(), 50);
    window.scrollTo({ top: 0 });
  }

  // ---------- Events ----------
  function bind() {
    const input = $("#search-input");
    input.addEventListener("input", () => {
      $("#search-clear").hidden = !input.value;
      if (!input.value.trim()) { $("#suggestions").hidden = true; return; }
      showSuggestions(searchProducts(input.value));
    });
    input.addEventListener("focus", () => { if (input.value.trim() && !state.product) showSuggestions(searchProducts(input.value)); });
    $("#search-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const first = searchProducts(input.value)[0];
      if (first) selectProduct(first.id); else showSuggestions([]);
    });
    $("#suggestions").addEventListener("mousedown", (e) => {
      const li = e.target.closest("li[data-id]");
      if (li) { e.preventDefault(); selectProduct(li.dataset.id); }
    });
    document.addEventListener("click", (e) => { if (!e.target.closest(".search-box")) $("#suggestions").hidden = true; });
    $("#search-clear").addEventListener("click", clearProduct);

    $("#chain-filters").addEventListener("click", (e) => {
      const chip = e.target.closest("[data-chain]");
      if (!chip) return;
      const c = chip.dataset.chain;
      if (state.chains.has(c) && state.chains.size === 1) { toast("Mindestens ein Händler muss aktiv sein"); return; }
      state.chains.has(c) ? state.chains.delete(c) : state.chains.add(c);
      render();
    });
    $("#only-available").addEventListener("change", (e) => { state.onlyAvailable = e.target.checked; render(); });

    $("#locate-btn").addEventListener("click", () => {
      if (!navigator.geolocation) { toast("Standort wird nicht unterstützt"); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          const inBerlin = lat > BERLIN_BOUNDS.minLat && lat < BERLIN_BOUNDS.maxLat && lng > BERLIN_BOUNDS.minLng && lng < BERLIN_BOUNDS.maxLng;
          if (!inBerlin) { toast("Du bist nicht in Berlin – tippe auf die Karte, um einen Startpunkt zu wählen"); return; }
          setUser({ lat, lng, label: "deinem Standort" });
          if (map) map.flyTo([lat, lng], 14);
        },
        () => toast("Standort nicht verfügbar – tippe auf die Karte, um ihn zu setzen"),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });

    $("#results").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (btn) {
        const store = STORES.find((s) => s.id === btn.dataset.store);
        const where = `${CHAINS[store.chain].name} ${store.area}`;
        toast(btn.dataset.action === "reserve"
          ? `Demo: Reservierung bei ${where} würde hier starten`
          : `Wir sagen dir Bescheid, sobald es bei ${where} wieder da ist (Demo)`);
        return;
      }
      if (e.target.closest("a")) return;
      const li = e.target.closest(".result");
      if (li) focusStore(li.dataset.store);
    });
    $("#results").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.classList.contains("result")) focusStore(e.target.dataset.store);
    });

    $("#popular-list").innerHTML = POPULAR.map((id) => {
      const p = productById(id);
      return `<button type="button" class="chip pop" data-pop="${id}">${esc(p.brand)} ${esc(p.name.split(" ").slice(0, 3).join(" "))}</button>`;
    }).join("");
    $("#popular-list").addEventListener("click", (e) => {
      const b = e.target.closest("[data-pop]");
      if (b) selectProduct(b.dataset.pop);
    });

    document.querySelectorAll(".tab-btn").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));
    document.querySelectorAll(".footer-col [data-tab]").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));

    renderBrowse();
    $("#browse-tabs").addEventListener("click", (e) => {
      const b = e.target.closest("[data-browse]");
      if (b) { browseKey = b.dataset.browse; renderBrowse(); }
    });
    $("#browse-list").addEventListener("click", (e) => {
      const b = e.target.closest("[data-pick]");
      if (b) { selectProduct(b.dataset.pick); window.scrollTo({ top: 0, behavior: "smooth" }); }
    });
  }

  // ---------- Start ----------
  initMap();
  bind();
  initChecks();
  render();
  const initial = new URLSearchParams(location.search).get("p");
  if (initial && productById(initial)) selectProduct(initial, { updateUrl: false });
})();
