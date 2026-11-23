# BeautyFinder – Konzept

## Problem
Wer ein bestimmtes Kosmetikprodukt sucht, läuft oft von Filiale zu Filiale (dm, Rossmann, Douglas, Sephora …),
nur um festzustellen, dass es ausverkauft ist oder gar nicht geführt wird.

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
| Kamera-Hautscan | Teaser („bald“) |

**Alle Bestände, Preise und Filialstandorte sind Demo-Daten** (`js/data.js`).

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
6. Geschäftsmodell: Affiliate/Click & Collect-Provision, gesponserte Platzierungen (klar gekennzeichnet), Daten-Insights für Händler
