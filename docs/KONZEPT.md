# BeautyFinder – Konzept

## Problem
Wer ein bestimmtes Kosmetikprodukt sucht, läuft oft von Filiale zu Filiale (dm, Rossmann, Douglas, Sephora …),
nur um festzustellen, dass es ausverkauft ist oder gar nicht geführt wird. Viele bestellen deshalb seit der
Corona-Pandemie lieber online – mit Verpackung, Lieferfahrten und Rücksendungen. BeautyFinder soll lokales
Einkaufen so bequem machen wie online bestellen.

## Lösung
Eine App, in die man ein Produkt eingibt und sofort sieht:

- **welche Filialen** in der Nähe es führen (Stadtkarte, Start: Berlin),
- **ob es gerade vorrätig ist** (verfügbar / nur noch wenige / ausverkauft),
- **wie weit** die Filiale entfernt ist und was es dort kostet.

Ergänzend: **Haut-Check** – Fragebogen (später Kamera-Hautscan), der eine Routine für Morgen/Abend
und die aktuelle Jahreszeit vorschlägt – mit Produkten, die man direkt in der Nähe bekommt.

## Was der Prototyp zeigt
| Funktion | Status |
|---|---|
| Produktsuche mit Vorschlägen | ✅ |
| Karte Berlin mit Filialen, farbig nach Bestand | ✅ |
| Filter nach Händler, „nur verfügbar“ | ✅ |
| Sortierung: verfügbar zuerst, dann Entfernung | ✅ |
| Standort per GPS oder Tipp auf die Karte | ✅ |
| Route (Google Maps), Reservieren / Benachrichtigen | Demo-Buttons |
| Haut-Fragebogen → Routine (morgens/abends, Jahreszeit, Budget, empfindliche Haut) | ✅ |
| Haar-Fragebogen → Pflegeroutine (Waschtag / ab und zu) | ✅ |
| Stöbern nach Kategorie (Hautpflege, Make-up, Haare) | ✅ |
| Kamera-Hautscan | Teaser („bald“) |

**Alle Bestände, Preise und Filialstandorte sind Demo-Daten** (`js/data.js`).

## Haut-Check: Grundlage der Empfehlungen
Die Routine-Logik orientiert sich an Pflegegrundsätzen, die der Skinfluencer **Leon (@xskincare)** öffentlich teilt.
Es besteht **keine Kooperation**; Grundlage sind Presseberichte über seine Tipps (Stand 2023–2025, nicht seine Originalbeiträge):

- Hauttyp-Test: Gesicht waschen, 60 Minuten ohne Creme warten – spannt sie, glänzt sie, oder nur die T-Zone?
- Morgens: Niacinamid- oder Vitamin-C-Serum, dann Feuchtigkeit, Creme, Sonnenschutz
- Feuchtigkeit: Glycerin, Panthenol oder Polyglutaminsäure sind oft wirksamer als reines Hyaluron
- AHA und BHA an unterschiedlichen Tagen im Wechsel
- Poren sind normal; Niacinamid, BHA und Vitamin A können sie verfeinern
- Gereizte Haut: Routine reduzieren, morgens nur Wasser, keine Säuren, kein Retinol, keine alkoholhaltigen Produkte, 2–6 Wochen Geduld
- Genannte Produkte u. a.: Balea Niacinamid-/Azelainsäure-Serum, Nø Cosmetics AHA/PHA Peeling Cleanser und 120h Hyper Moisture Cream,
  Eucerin Oil Control LSF 50+, Garnier LSF-Fluid 50+, Sun Ozon Sonnenfluid LSF 50

Quellen: [wmn.de – 10 Must-Haves](https://www.wmn.de/lifestyle/skincare-routine-alle-hauttypen-leon-xskincare-id760339),
[wmn.de – Hautbarriere](https://www.wmn.de/beauty/face-body/skincare-routine-hautbarriere-influencer-leon-id758969),
[wmn.de – 10 unter 10 €](https://www.wmn.de/beauty/face-body/skincare-basics-hautpflege-leon-xskincare-id760337),
[wmn.de – Glycerin statt Hyaluron](https://www.wmn.de/beauty/face-body/hautpflege-leon-xskincare-hautpflege-tipp-2025-id754030),
[hautwahrheit.de – Frühlingsroutine](https://hautwahrheit.de/fruehling.php),
[GRAZIA – Interview](https://www.grazia-magazin.de/beauty/leon-von-xskincare-der-skinfluencer-im-grossen-beauty-talk-mit-grazia-52758.html)

Für eine echte Veröffentlichung sollte man Leon fragen, ob er namentlich genannt werden möchte – oder eine Kooperation anbieten.

## Haar-Check
10 Fragen (Haarstruktur, Haardicke, Haarlänge, Kopfhaut, Längen, Färbung, Hitze-Styling, Waschrhythmus, Wünsche, Budget) →
Routine „Am Waschtag“ (Shampoo, Spülung, Leave-in, Hitzeschutz) und „Ab und zu“ (Kur, Silbershampoo, Kopfhaut, Trockenshampoo).
Ziel „Haarausfall vorbeugen“: Koffein-Shampoo, Kopfhaut-Tonikum und Vorbeugetipps.
Bei Schuppen, die nicht besser werden, und bei Haarausfall verweist die App auf ärztlichen Rat.

Katalog (Demo): 121 Produkte, davon 61 Haarpflege.
Ziele im Haar-Check u. a.: mehr Haarwachstum, kräftigeres Haar, Haarausfall vorbeugen.

## Die größte Herausforderung: echte Bestandsdaten
dm und Rossmann zeigen Filialverfügbarkeit bereits in ihren eigenen Apps/Webseiten – es gibt aber **keine
öffentlichen Schnittstellen** dafür. Mögliche Wege:

1. **Partnerschaften / offizielle Feeds** – der saubere Weg. Pitch an Händler: mehr Laufkundschaft,
   weniger Frust, Daten zur Nachfrage („wonach wird in Kreuzberg gesucht, was ihr nicht habt?“).
   Realistischer Einstieg: kleinere Ketten, unabhängige Parfümerien oder Marken selbst.
2. **Affiliate-/Produktfeeds** (z. B. über Affiliate-Netzwerke) – liefern Katalog und Preise, meist aber keine Filialbestände.
3. **Crowdsourcing** – Nutzer melden „hab’s gesehen / war leer“ (wie Wetter-Apps mit Community-Meldungen). Gut für den Start, aber ungenau.
4. **Scraping** der Händlerseiten – technisch möglich, rechtlich riskant (AGB, Datenbankrecht) → nicht empfehlenswert.

Empfehlung: Start mit **Crowdsourcing + 1–2 Partnern** in Berlin, um den Nutzen zu beweisen.

## Haut-Check / Kamera-Scan – zu beachten
- **Datenschutz (DSGVO):** Gesichtsfotos und Hautzustand können Gesundheitsdaten bzw. biometrische Daten sein
  (Art. 9 DSGVO) → ausdrückliche Einwilligung, Analyse möglichst **auf dem Gerät**, Fotos nicht speichern.
- **Keine medizinischen Aussagen:** sonst droht Einstufung als Medizinprodukt (MDR). Formulierungen wie
  „Pflegeempfehlung“ statt „Diagnose“; Hinweis auf Hautarzt bei Auffälligkeiten.
- **Fairness:** Hautanalyse-Modelle müssen auf allen Hauttönen gleich gut funktionieren.

## Mögliche nächste Schritte
1. Nutzerinterviews: Wie oft passiert das Problem? Welche Produkte? (z. B. 10–15 Gespräche)
2. Echter Produktkatalog (EAN/Barcode) + Barcode-Scanner in der App
3. Crowdsourcing-Meldungen („Gerade gesehen“) als erste echte Datenquelle
4. Gespräch mit einem Händler/einer Marke über einen Bestands-Feed
5. Native App (z. B. React Native/Flutter) sobald das Konzept bestätigt ist
6. Geschäftsmodell: Click & Collect-Provision, Gutschein-Aktionen für den Einkauf vor Ort, gesponserte Platzierungen (klar gekennzeichnet), Daten-Insights für Händler
