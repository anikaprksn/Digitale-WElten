# BeautyFinder

Kosmetikprodukte in Geschäften finden – mit Bestandsanzeige auf der Stadtkarte (Start: Berlin).

Gib ein Produkt ein und sieh sofort, bei welcher Filiale von **dm, Rossmann, Douglas oder Sephora**
es gerade vorrätig ist – statt von Laden zu Laden zu laufen. Dazu ein **Haut-Check** (Routine für morgens/abends und die aktuelle Jahreszeit, angelehnt an Tipps von
Leon / @xskincare) und ein **Haar-Check** für die passende Haarpflege.

> ⚠️ Prototyp: Filialstandorte, Preise und Bestände sind **Demo-Daten**.

## Starten
Keine Installation nötig – nur einen lokalen Webserver im Projektordner starten:

```bash
python3 -m http.server 8000
```

Dann <http://localhost:8000> im Browser öffnen (auch am Handy im selben WLAN über die IP des Rechners).

## Aufbau
```
index.html          Oberfläche (Tabs „Finden“ und „Haut-Check“)
css/styles.css      Design (mobil zuerst, Dark Mode)
js/data.js          Demo-Daten: Händler, Filialen, Produkte
js/app.js           Suche, Karte, Bestandslogik, Fragebogen
vendor/leaflet/     Kartenbibliothek Leaflet 1.9.4 (BSD-2-Lizenz)
fonts/              Source Serif 4 und Inter (SIL Open Font License)
docs/KONZEPT.md     Idee, Datenquellen, Datenschutz, nächste Schritte
```

Karte: © OpenStreetMap-Mitwirkende (offene Daten, ODbL). Ersatzdienste: OSM France, CARTO.
Bezirksgrenzen: Amt für Statistik Berlin-Brandenburg (CC BY).
Schriften: Source Serif 4 (Überschriften, Lesetext) und Inter (Bedienelemente), beide SIL Open Font License.
