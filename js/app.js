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
      const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#1b2f5e";
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
  const SEASON_NAME = { winter: "Winter", fruehling: "Frühling", sommer: "Sommer", herbst: "Herbst" };
  const SEASON_TIP = {
    winter: "Heizungsluft und Kälte entziehen der Haut Feuchtigkeit. Setz auf reichhaltigere Pflege und vergiss den Sonnenschutz am Morgen trotzdem nicht.",
    herbst: "Die Haut stellt sich auf trockene Heizungsluft um. Leg bei der Feuchtigkeit nach und dosiere Peelings eher sanft.",
    fruehling: "Die UV-Strahlung steigt schnell an. Trag jetzt wieder konsequent LSF und wechsle zu leichteren Texturen.",
    sommer: "Leichte Texturen, hoher LSF und regelmäßiges Nachcremen. Abends gründlich reinigen, um Sonnencreme und Schweiß zu entfernen.",
  };
  const CONCERN_LABEL = { unreinheiten: "Unreinheiten", trockenheit: "Trockenheit", roetungen: "Rötungen", glanz: "Glanz", falten: "Fältchen", pigmentflecken: "Pigmentflecken", sonnenschutz: "UV-Schutz" };
  const SKIN_LABEL = { trocken: "Trockene Haut", fettig: "Fettige Haut", mischhaut: "Mischhaut", normal: "Ausgeglichene Haut" };
  const SKIN_WHY = { trocken: "trockener Haut", fettig: "fettiger Haut", mischhaut: "Mischhaut", normal: "ausgeglichener Haut" };
  const STEP_LABEL = { abschminken: "Abschminken", reinigung: "Reinigen", serum: "Serum", pflege: "Pflegen", sonnenschutz: "Sonnenschutz" };

  // Fragen des Haut-Checks. single = eine Antwort (springt automatisch weiter), multi = mehrere.
  const QUESTIONS = [
    { key: "skinType", title: "Wie fühlt sich deine Haut im Laufe des Tages an?", options: [
      { v: "trocken", l: "Trocken", d: "Spannt, wirkt manchmal schuppig" },
      { v: "fettig", l: "Fettig", d: "Glänzt im ganzen Gesicht" },
      { v: "mischhaut", l: "Mischhaut", d: "Stirn, Nase und Kinn glänzen, Wangen sind eher trocken" },
      { v: "normal", l: "Ausgeglichen", d: "Weder besonders trocken noch fettig" } ] },
    { key: "afterWash", title: "Und eine Stunde nach dem Waschen, ohne Creme?", options: [
      { v: "spannt", l: "Sie spannt", d: "Ich will sofort eincremen" },
      { v: "angenehm", l: "Fühlt sich angenehm an", d: "Kein besonderes Gefühl" },
      { v: "glaenzt", l: "Sie glänzt schon wieder", d: "Vor allem in der T-Zone" } ] },
    { key: "concerns", multi: true, title: "Woran möchtest du gerade arbeiten?", hint: "Wähle alles, was zutrifft.", options: [
      { v: "unreinheiten", l: "Pickel und Unreinheiten" },
      { v: "trockenheit", l: "Trockene Stellen" },
      { v: "roetungen", l: "Rötungen" },
      { v: "glanz", l: "Glanz und große Poren" },
      { v: "falten", l: "Erste Fältchen" },
      { v: "pigmentflecken", l: "Pigmentflecken" } ] },
    { key: "sensitive", title: "Reagiert deine Haut empfindlich?", hint: "Zum Beispiel mit Brennen, Jucken oder Rötungen nach neuen Produkten.", options: [
      { v: "ja", l: "Ja, oft" }, { v: "manchmal", l: "Manchmal" }, { v: "nein", l: "Nein, kaum" } ] },
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
      { v: "normal", l: "Ausgewogen", d: "3 bis 4 Schritte" },
      { v: "ausfuehrlich", l: "Gerne ausführlich", d: "Ich nehme mir Zeit" } ] },
    { key: "budget", title: "Wie viel möchtest du pro Produkt ausgeben?", options: [
      { v: "15", l: "Bis 15 €" }, { v: "30", l: "Bis 30 €" }, { v: "999", l: "Egal" } ] },
  ];

  const answers = {};
  let qIndex = 0;

  // Antworten in ein Hautprofil übersetzen
  function profileFrom(a) {
    let skinType = a.skinType;
    if (skinType === "normal" && a.afterWash === "glaenzt") skinType = "mischhaut";
    if (skinType === "normal" && a.afterWash === "spannt") skinType = "trocken";
    const weights = {};
    (a.concerns || []).forEach((c) => { weights[c] = 2; });
    if (a.afterWash === "spannt") weights.trockenheit = Math.max(weights.trockenheit || 0, 1);
    if (a.afterWash === "glaenzt") weights.glanz = Math.max(weights.glanz || 0, 1);
    if (a.age === "30" || a.age === "40") weights.falten = Math.max(weights.falten || 0, a.age === "40" ? 1.5 : 1);
    if (a.outdoor === "viel") weights.pigmentflecken = Math.max(weights.pigmentflecken || 0, 1);
    return {
      skinType,
      weights,
      sensitive: a.sensitive,
      noFragrance: a.fragrance === "ohne" || a.sensitive === "ja",
      noActives: a.sensitive === "ja" || a.age === "u20",
      budget: Number(a.budget),
      routine: a.routine,
    };
  }

  function scoreProduct(p, pr, slot, sea, strict) {
    if (Math.min(...Object.values(p.prices)) > pr.budget) return null;
    if (p.time !== "beides" && p.time !== slot) return null;
    const ff = p.tags.includes("parfuemfrei");
    if (strict && pr.noFragrance && !ff) return null;
    if (strict && pr.noActives && p.tags.includes("aktiv")) return null;
    let s = p.time === slot ? 1 : 0;
    const why = [];
    if (p.skin.includes(pr.skinType)) { s += 3; why.push(`passt zu ${SKIN_WHY[pr.skinType]}`); }
    const hits = p.concerns.filter((c) => pr.weights[c]);
    hits.forEach((c) => { s += pr.weights[c]; });
    if (hits.length) why.push(hits.map((c) => CONCERN_LABEL[c]).join(", "));
    if (pr.sensitive === "ja") s += ff ? 3 : -3;
    if (pr.sensitive === "manchmal" && ff) s += 1;
    if (ff && (pr.noFragrance || pr.sensitive !== "nein")) why.push("parfümfrei");
    if ((sea === "winter" || sea === "herbst") && p.tags.includes("reichhaltig") && pr.skinType !== "fettig") { s += 1.5; why.push("reichhaltig für die Heizungssaison"); }
    if ((sea === "sommer" || sea === "fruehling") && p.tags.includes("leicht")) { s += 1.5; why.push("leichte Textur"); }
    // Verfügbarkeit in der Nähe leicht bevorzugen
    const near = STORES.filter((st) => p.chains.includes(st.chain) && km(state.user, st) < 4)
      .map((st) => stockFor(st, p)).filter((x) => x.status !== "out").length;
    s += Math.min(near, 4) * 0.25;
    return { p, s, why, relaxed: !strict && pr.noFragrance && !ff };
  }

  function pick(filter, slot, pr, sea, exclude = new Set()) {
    const run = (strict) => PRODUCTS.filter((p) => filter(p) && !exclude.has(p.id))
      .map((p) => scoreProduct(p, pr, slot, sea, strict)).filter(Boolean).sort((x, y) => y.s - x.s)[0];
    return run(true) || run(false) || null;
  }
  const inCat = (cat) => (p) => p.category === cat;

  function nearestAvailable(p) {
    return STORES.filter((s) => p.chains.includes(s.chain))
      .map((s) => ({ s, st: stockFor(s, p), d: km(state.user, s) }))
      .filter((x) => x.st.status !== "out")
      .sort((x, y) => x.d - y.d)[0];
  }

  function buildRoutine(a) {
    const sea = season();
    const pr = profileFrom(a);
    const minimal = pr.routine === "minimal", full = pr.routine === "ausfuehrlich";
    const hasConcerns = Object.keys(pr.weights).length > 0;
    const morning = [], evening = [];

    if (!minimal) morning.push(["reinigung", pick(inCat("reinigung"), "morgens", pr, sea)]);
    const mSerum = !minimal && (hasConcerns || full) ? pick(inCat("serum"), "morgens", pr, sea) : null;
    if (mSerum) morning.push(["serum", mSerum]);
    morning.push(["pflege", pick(inCat("pflege"), "morgens", pr, sea)]);
    morning.push(["sonnenschutz", pick(inCat("sonnenschutz"), "morgens", pr, sea)]);

    const doubleCleanse = a.makeup === "taeglich" || (a.makeup === "manchmal" && full);
    let remover = null;
    if (doubleCleanse) {
      remover = pick((p) => p.remover, "abends", pr, sea);
      if (remover) evening.push(["abschminken", remover]);
    }
    evening.push(["reinigung", pick((p) => p.category === "reinigung" && !(remover && p.remover), "abends", pr, sea)]);
    if (!minimal) {
      const eSerum = pick(inCat("serum"), "abends", pr, sea, new Set(mSerum ? [mSerum.p.id] : []));
      if (eSerum) evening.push(["serum", eSerum]);
    }
    evening.push(["pflege", pick(inCat("pflege"), "abends", pr, sea)]);

    const stepHtml = ([cat, r], i) => {
      if (!r) return `<li class="step"><span class="step-n">${i + 1}</span><div class="step-body"><div class="step-cat">${STEP_LABEL[cat]}</div><span class="muted">Kein passendes Produkt in deinem Budget gefunden.</span></div></li>`;
      const near = nearestAvailable(r.p);
      const where = near ? `${PIN}${esc(CHAINS[near.s.chain].name)} ${esc(near.s.area)} · ${fmtKm(near.d)}` : "Gerade nirgends vorrätig";
      return `
        <li class="step">
          <span class="step-n">${i + 1}</span>
          <div class="step-body">
            <div class="step-cat">${STEP_LABEL[cat]}</div>
            <div class="step-prod"><b>${esc(r.p.brand)}</b> ${esc(r.p.name)}</div>
            ${r.why.length ? `<div class="step-why">${esc(r.why.join(" · "))}</div>` : ""}
            ${r.relaxed ? `<div class="step-why warn">Enthält möglicherweise Duftstoffe. Im Budget gab es keine parfümfreie Alternative.</div>` : ""}
            <div class="step-foot">
              <span class="step-where">${where}</span>
              <button type="button" class="ghost-btn" data-find="${r.p.id}">Finden</button>
            </div>
          </div>
        </li>`;
    };

    const all = [...morning, ...evening].map(([, r]) => r).filter(Boolean);
    const tips = [];
    if (doubleCleanse) tips.push("Abends doppelt reinigen: erst mit Mizellenwasser Make-up und Sonnencreme lösen, dann mit dem Waschgel nachreinigen.");
    if (all.some((r) => r.p.tags.includes("aktiv"))) tips.push("Starte mit neuen Wirkstoffen wie Retinol oder BHA langsam, an 2 bis 3 Abenden pro Woche. Morgens dann immer LSF benutzen.");
    if (a.outdoor === "viel") tips.push("Du bist viel draußen. Trag den Sonnenschutz alle zwei Stunden neu auf, auch im Winter.");
    if (a.sleep === "wenig") tips.push("Zu wenig Schlaf zeigt sich oft als fahle Haut und Augenringe. Feuchtigkeit hilft kurzfristig, ausreichend Schlaf hilft langfristig mehr.");
    if (a.sleep === "stress") tips.push("Stress kann Unreinheiten und Rötungen verstärken. Bleib bei einer einfachen Routine und probier nicht zu viele neue Produkte gleichzeitig aus.");
    if (pr.weights.roetungen) tips.push("Wenn Rötungen länger anhalten, lass sie am besten dermatologisch abklären.");
    if (minimal) tips.push("Deine Routine ist bewusst kurz gehalten. Wenn du mehr willst, kannst du später ein Serum ergänzen.");

    const explicit = (a.concerns || []).map((c) => CONCERN_LABEL[c]);
    const focus = (explicit.length ? explicit : Object.keys(pr.weights).map((c) => CONCERN_LABEL[c])).slice(0, 3);
    const sensLabel = { ja: "Empfindlich", manchmal: "Leicht empfindlich", nein: "Robust" }[pr.sensitive];

    $("#skin-result").innerHTML = `
      <div class="result-head">
        <p class="eyebrow">Dein Ergebnis</p>
        <h2>${esc(SKIN_LABEL[pr.skinType])}${focus.length ? `, Fokus auf ${esc(focus.join(" und ").replace(/ und (?=.* und )/, ", "))}` : ""}</h2>
        <div class="profile-tags">
          <span>${esc(sensLabel)}</span>
          ${pr.noFragrance ? "<span>Parfümfrei</span>" : ""}
          <span>${esc(SEASON_NAME[sea])}-Routine</span>
          <span>${pr.budget > 100 ? "Ohne Budgetgrenze" : `Bis ${pr.budget} € pro Produkt`}</span>
        </div>
      </div>
      <div class="season-tip"><b>${esc(SEASON_NAME[sea])}:</b> ${SEASON_TIP[sea]}</div>
      <div class="routine-cols">
        <div class="routine-col"><h3>${SUN}Morgens</h3><ol>${morning.map(stepHtml).join("")}</ol></div>
        <div class="routine-col"><h3>${MOON}Abends</h3><ol>${evening.map(stepHtml).join("")}</ol></div>
      </div>
      ${tips.length ? `<div class="tips"><h3>Gut zu wissen</h3><ul>${tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>` : ""}
      <p class="disclaimer">Diese Empfehlungen ersetzen keine ärztliche oder dermatologische Beratung.</p>
      <button type="button" class="secondary-btn" id="quiz-restart">Haut-Check neu starten</button>`;
    showSkinView("result");
  }

  // ---------- Fragebogen (Schritt für Schritt) ----------
  function showSkinView(view) {
    ["intro", "quiz", "result"].forEach((v) => { $(`#skin-${v}`).hidden = v !== view; });
    window.scrollTo({ top: 0 });
  }

  function renderQuestion() {
    const q = QUESTIONS[qIndex];
    const total = QUESTIONS.length;
    const selected = q.multi ? new Set(answers[q.key] || []) : answers[q.key];
    $("#quiz-progress").style.width = `${((qIndex + 1) / total) * 100}%`;
    $("#quiz-count").textContent = `Frage ${qIndex + 1} von ${total}`;
    $("#quiz-body").innerHTML = `
      <h2 class="q-title" id="q-title">${esc(q.title)}</h2>
      ${q.hint ? `<p class="q-hint">${esc(q.hint)}</p>` : ""}
      <div class="options ${q.multi ? "multi" : ""}" role="${q.multi ? "group" : "radiogroup"}" aria-labelledby="q-title">
        ${q.options.map((o) => {
          const on = q.multi ? selected.has(o.v) : selected === o.v;
          return `<button type="button" class="option ${on ? "on" : ""}" data-v="${o.v}" role="${q.multi ? "checkbox" : "radio"}" aria-checked="${on}">
            <span class="o-text"><span class="o-label">${esc(o.l)}</span>${o.d ? `<span class="o-desc">${esc(o.d)}</span>` : ""}</span>
            <span class="o-check" aria-hidden="true"></span>
          </button>`;
        }).join("")}
      </div>`;
    const next = $("#quiz-next");
    next.hidden = !q.multi && !selected;
    next.textContent = qIndex === total - 1 ? "Ergebnis anzeigen" : q.multi && !selected.size ? "Überspringen" : "Weiter";
    $("#quiz-back").textContent = qIndex === 0 ? "Abbrechen" : "Zurück";
    $("#quiz-body").classList.remove("enter");
    void $("#quiz-body").offsetWidth;
    $("#quiz-body").classList.add("enter");
  }

  function nextQuestion() {
    if (qIndex < QUESTIONS.length - 1) { qIndex++; renderQuestion(); }
    else buildRoutine(answers);
  }

  function initSkin() {
    $("#season-name").textContent = SEASON_NAME[season()];
    $("#quiz-total").textContent = QUESTIONS.length;
    $("#quiz-start").addEventListener("click", () => { qIndex = 0; showSkinView("quiz"); renderQuestion(); });
    $("#quiz-back").addEventListener("click", () => {
      if (qIndex === 0) { showSkinView("intro"); return; }
      qIndex--; renderQuestion();
    });
    $("#quiz-next").addEventListener("click", nextQuestion);
    $("#quiz-body").addEventListener("click", (e) => {
      const btn = e.target.closest(".option");
      if (!btn) return;
      const q = QUESTIONS[qIndex];
      if (q.multi) {
        const set = new Set(answers[q.key] || []);
        set.has(btn.dataset.v) ? set.delete(btn.dataset.v) : set.add(btn.dataset.v);
        answers[q.key] = [...set];
        renderQuestionKeepAnim();
      } else {
        answers[q.key] = btn.dataset.v;
        document.querySelectorAll("#quiz-body .option").forEach((b) => {
          b.classList.toggle("on", b === btn); b.setAttribute("aria-checked", b === btn);
        });
        setTimeout(nextQuestion, 220);
      }
    });
    $("#skin-result").addEventListener("click", (e) => {
      const find = e.target.closest("[data-find]");
      if (find) { switchTab("tab-search"); selectProduct(find.dataset.find); return; }
      if (e.target.id === "quiz-restart") {
        Object.keys(answers).forEach((k) => delete answers[k]);
        showSkinView("intro");
      }
    });
  }

  // Bei Mehrfachauswahl nur Häkchen und Button aktualisieren, ohne Einblend-Animation
  function renderQuestionKeepAnim() {
    const q = QUESTIONS[qIndex];
    const set = new Set(answers[q.key] || []);
    document.querySelectorAll("#quiz-body .option").forEach((b) => {
      const on = set.has(b.dataset.v);
      b.classList.toggle("on", on); b.setAttribute("aria-checked", on);
    });
    $("#quiz-next").textContent = qIndex === QUESTIONS.length - 1 ? "Ergebnis anzeigen" : set.size ? "Weiter" : "Überspringen";
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
