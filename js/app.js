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
      const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#2459d6";
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
        const hay = norm(`${p.brand} ${p.name} ${p.category}`);
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

  function render() {
    const rows = computeRows();
    renderFilters();
    renderProductCard(state.product);
    renderResults(rows);
    updateMarkers(rows);
  }

  // ---------- Haut-Check ----------
  function season(d = new Date()) {
    const m = d.getMonth() + 1;
    if (m === 12 || m <= 2) return "winter";
    if (m <= 5) return "fruehling";
    if (m <= 8) return "sommer";
    return "herbst";
  }
  const SEASON_LABEL = { winter: "den Winter", fruehling: "den Frühling", sommer: "den Sommer", herbst: "den Herbst" };
  const SEASON_TIP = {
    winter: "Heizungsluft und Kälte entziehen der Haut Feuchtigkeit – setz auf reichhaltigere Pflege. Sonnenschutz morgens trotzdem nicht vergessen, vor allem bei viel Zeit draußen.",
    herbst: "Die Haut stellt sich auf trockene Heizungsluft um: Feuchtigkeit nachlegen, Peelings eher sanft dosieren.",
    fruehling: "Die UV-Strahlung steigt schnell an – jetzt wieder konsequent LSF tragen und auf leichtere Texturen wechseln.",
    sommer: "Leichte Texturen, hoher LSF und regelmäßiges Nachcremen. Abends gründlich reinigen (Sonnencreme, Schweiß).",
  };
  const CONCERN_LABEL = { unreinheiten: "Unreinheiten", trockenheit: "Trockenheit", roetungen: "Rötungen", glanz: "Glanz", falten: "Fältchen", pigmentflecken: "Pigmentflecken", sonnenschutz: "UV-Schutz" };
  const SKIN_LABEL = { trocken: "trockene Haut", fettig: "fettige Haut", mischhaut: "Mischhaut", normal: "normale Haut" };
  const STEP_LABEL = { reinigung: "Reinigen", serum: "Serum", pflege: "Pflegen", sonnenschutz: "Sonnenschutz" };

  const answers = { skinType: null, concerns: new Set(), sensitive: null, outdoor: null, budget: null };

  function scoreProduct(p, a, slot, sea) {
    const minPrice = Math.min(...Object.values(p.prices));
    if (minPrice > Number(a.budget)) return null;
    if (p.time !== "beides" && p.time !== slot) return null;
    let s = p.time === slot ? 1 : 0; // Produkte, die speziell für die Tageszeit gedacht sind, leicht bevorzugen
    const why = [];
    if (p.skin.includes(a.skinType)) { s += 3; why.push(`passt zu ${SKIN_LABEL[a.skinType]}`); }
    const hits = p.concerns.filter((c) => a.concerns.has(c));
    s += hits.length * 2;
    if (hits.length) why.push(hits.map((c) => CONCERN_LABEL[c]).join(", "));
    const ff = p.tags.includes("parfuemfrei");
    if (a.sensitive === "ja") { s += ff ? 3 : -3; }
    if (a.sensitive === "manchmal" && ff) s += 1;
    if (ff && a.sensitive !== "nein") why.push("parfümfrei");
    if ((sea === "winter" || sea === "herbst") && p.tags.includes("reichhaltig") && a.skinType !== "fettig") { s += 1.5; why.push("reichhaltig für die Heizungssaison"); }
    if ((sea === "sommer" || sea === "fruehling") && p.tags.includes("leicht")) { s += 1.5; why.push("leichte Textur"); }
    // Verfügbarkeit in der Nähe leicht bevorzugen
    const near = STORES.filter((st) => p.chains.includes(st.chain) && km(state.user, st) < 4)
      .map((st) => stockFor(st, p)).filter((x) => x.status !== "out").length;
    s += Math.min(near, 4) * 0.25;
    return { p, s, why };
  }

  function pick(category, slot, a, sea, exclude = new Set()) {
    return PRODUCTS.filter((p) => p.category === category && !exclude.has(p.id))
      .map((p) => scoreProduct(p, a, slot, sea))
      .filter(Boolean)
      .sort((x, y) => y.s - x.s)[0] || null;
  }

  function nearestAvailable(p) {
    return STORES.filter((s) => p.chains.includes(s.chain))
      .map((s) => ({ s, st: stockFor(s, p), d: km(state.user, s) }))
      .filter((x) => x.st.status !== "out")
      .sort((x, y) => x.d - y.d)[0];
  }

  function buildRoutine(a) {
    const sea = season();
    const morning = [], evening = [];
    morning.push(["reinigung", pick("reinigung", "morgens", a, sea)]);
    const mSerum = a.concerns.size ? pick("serum", "morgens", a, sea) : null;
    if (mSerum) morning.push(["serum", mSerum]);
    morning.push(["pflege", pick("pflege", "morgens", a, sea)]);
    morning.push(["sonnenschutz", pick("sonnenschutz", "morgens", a, sea)]);
    evening.push(["reinigung", pick("reinigung", "abends", a, sea)]);
    const eSerum = pick("serum", "abends", a, sea, new Set(mSerum ? [mSerum.p.id] : []));
    if (eSerum) evening.push(["serum", eSerum]);
    evening.push(["pflege", pick("pflege", "abends", a, sea)]);

    const stepHtml = ([cat, r], i) => {
      if (!r) return `<li class="step"><span class="step-n">${i + 1}</span><div><b>${STEP_LABEL[cat]}</b><br><span class="muted">Kein passendes Produkt im Budget gefunden.</span></div></li>`;
      const near = nearestAvailable(r.p);
      const where = near ? `${PIN}${esc(CHAINS[near.s.chain].name)} ${esc(near.s.area)} · ${fmtKm(near.d)}` : "Gerade nirgends vorrätig";
      return `
        <li class="step">
          <span class="step-n">${i + 1}</span>
          <div class="step-body">
            <div class="step-cat">${STEP_LABEL[cat]}</div>
            <div class="step-prod"><b>${esc(r.p.brand)}</b> ${esc(r.p.name)}</div>
            ${r.why.length ? `<div class="step-why">${esc(r.why.join(" · "))}</div>` : ""}
            <div class="step-where">${where}</div>
          </div>
          <button type="button" class="ghost-btn" data-find="${r.p.id}">Finden</button>
        </li>`;
    };

    const extra = [];
    if (a.outdoor === "viel") extra.push("Du bist viel draußen: Sonnenschutz alle 2 Stunden nachlegen.");
    if (a.concerns.has("unreinheiten") && a.sensitive === "ja") extra.push("Bei empfindlicher Haut Wirkstoffe wie BHA langsam einführen (2–3× pro Woche).");
    if (a.concerns.has("roetungen")) extra.push("Bei anhaltenden Rötungen lieber dermatologisch abklären lassen.");

    $("#routine").innerHTML = `
      <div class="season-tip"><b>Tipp für ${SEASON_LABEL[sea]}:</b> ${SEASON_TIP[sea]}</div>
      <div class="routine-cols">
        <div class="routine-col"><h3>${SUN}Morgens</h3><ol>${morning.map(stepHtml).join("")}</ol></div>
        <div class="routine-col"><h3>${MOON}Abends</h3><ol>${evening.map(stepHtml).join("")}</ol></div>
      </div>
      ${extra.length ? `<ul class="extra">${extra.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
      <p class="disclaimer">Diese Empfehlungen ersetzen keine ärztliche oder dermatologische Beratung.</p>
      <button type="button" class="link-btn" id="routine-reset">Fragebogen neu starten</button>`;
    $("#routine").hidden = false;
    $("#routine").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function initSkin() {
    $("#season-label").textContent = SEASON_LABEL[season()];
    document.querySelectorAll(".choices").forEach((group) => {
      group.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const { name, type } = group.dataset;
        const v = btn.dataset.value;
        if (type === "multi") {
          btn.classList.toggle("on");
          answers[name].has(v) ? answers[name].delete(v) : answers[name].add(v);
        } else {
          group.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b === btn));
          answers[name] = v;
        }
      });
    });
    $("#skin-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const missing = ["skinType", "sensitive", "outdoor", "budget"].filter((k) => !answers[k]);
      const err = $("#skin-error");
      if (missing.length) { err.textContent = "Bitte beantworte die Fragen 1, 3, 4 und 5."; err.hidden = false; return; }
      err.hidden = true;
      buildRoutine(answers);
    });
    $("#routine").addEventListener("click", (e) => {
      const find = e.target.closest("[data-find]");
      if (find) { switchTab("tab-search"); selectProduct(find.dataset.find); return; }
      if (e.target.id === "routine-reset") {
        answers.skinType = answers.sensitive = answers.outdoor = answers.budget = null;
        answers.concerns.clear();
        document.querySelectorAll(".choices button.on").forEach((b) => b.classList.remove("on"));
        $("#routine").hidden = true;
        $("#skin-form").scrollIntoView({ behavior: "smooth" });
      }
    });
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
  }

  // ---------- Start ----------
  initMap();
  bind();
  initSkin();
  render();
  const initial = new URLSearchParams(location.search).get("p");
  if (initial && productById(initial)) selectProduct(initial, { updateUrl: false });
})();
