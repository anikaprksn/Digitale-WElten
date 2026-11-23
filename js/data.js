/*
 * BeautyFinder – Demo-Daten
 * ---------------------------------------------------------------
 * ACHTUNG: Filialstandorte sind ungefähre Demo-Standorte, Preise sind
 * Circa-Werte und alle Bestände werden simuliert. Für den echten
 * Betrieb müssen diese Daten von den Händlern (API/Feed) kommen –
 * siehe docs/KONZEPT.md.
 */

const CHAINS = {
  dm:       { name: "dm",       color: "#3b5bab" },
  rossmann: { name: "Rossmann", color: "#dc2626" },
  douglas:  { name: "Douglas",  color: "#0f766e" },
  sephora:  { name: "Sephora",  color: "#111827" },
};

const STORES = [
  // dm
  { id: "dm-alex",       chain: "dm", area: "Alexanderplatz",        district: "Mitte",                lat: 52.5199, lng: 13.4151 },
  { id: "dm-friedr",     chain: "dm", area: "Friedrichstraße",       district: "Mitte",                lat: 52.5172, lng: 13.3887 },
  { id: "dm-schoenh",    chain: "dm", area: "Schönhauser Allee",     district: "Prenzlauer Berg",      lat: 52.5418, lng: 13.4125 },
  { id: "dm-kotti",      chain: "dm", area: "Kottbusser Damm",       district: "Kreuzberg",            lat: 52.4932, lng: 13.4210 },
  { id: "dm-wilmersd",   chain: "dm", area: "Wilmersdorfer Straße",  district: "Charlottenburg",       lat: 52.5082, lng: 13.3062 },
  { id: "dm-kms",        chain: "dm", area: "Karl-Marx-Straße",      district: "Neukölln",             lat: 52.4792, lng: 13.4381 },
  { id: "dm-schloss",    chain: "dm", area: "Schloßstraße",          district: "Steglitz",             lat: 52.4575, lng: 13.3218 },
  { id: "dm-frankf",     chain: "dm", area: "Frankfurter Allee",     district: "Friedrichshain",       lat: 52.5148, lng: 13.4610 },

  // Rossmann
  { id: "ro-alex",       chain: "rossmann", area: "Alexanderplatz",  district: "Mitte",                lat: 52.5216, lng: 13.4108 },
  { id: "ro-potsdamer",  chain: "rossmann", area: "Potsdamer Platz", district: "Tiergarten",           lat: 52.5094, lng: 13.3762 },
  { id: "ro-ringcenter", chain: "rossmann", area: "Ring-Center",     district: "Friedrichshain",       lat: 52.5141, lng: 13.4786 },
  { id: "ro-turm",       chain: "rossmann", area: "Turmstraße",      district: "Moabit",               lat: 52.5266, lng: 13.3418 },
  { id: "ro-bergmann",   chain: "rossmann", area: "Bergmannstraße",  district: "Kreuzberg",            lat: 52.4889, lng: 13.3952 },
  { id: "ro-hermann",    chain: "rossmann", area: "Hermannplatz",    district: "Neukölln",             lat: 52.4868, lng: 13.4243 },
  { id: "ro-schloss",    chain: "rossmann", area: "Schloßstraße",    district: "Steglitz",             lat: 52.4602, lng: 13.3243 },
  { id: "ro-wedding",    chain: "rossmann", area: "Müllerstraße",    district: "Wedding",              lat: 52.5469, lng: 13.3590 },

  // Douglas
  { id: "do-tauentzien", chain: "douglas", area: "Tauentzienstraße", district: "Charlottenburg",       lat: 52.5018, lng: 13.3412 },
  { id: "do-alexa",      chain: "douglas", area: "Alexa",            district: "Mitte",                lat: 52.5189, lng: 13.4163 },
  { id: "do-mall",       chain: "douglas", area: "Mall of Berlin",   district: "Mitte",                lat: 52.5103, lng: 13.3803 },
  { id: "do-schloss",    chain: "douglas", area: "Schloßstraße",     district: "Steglitz",             lat: 52.4588, lng: 13.3197 },
  { id: "do-gesundbr",   chain: "douglas", area: "Gesundbrunnen-Center", district: "Wedding",          lat: 52.5487, lng: 13.3884 },

  // Sephora
  { id: "se-kudamm",     chain: "sephora", area: "Kurfürstendamm",   district: "Charlottenburg",       lat: 52.5032, lng: 13.3297 },
  { id: "se-mall",       chain: "sephora", area: "Mall of Berlin",   district: "Mitte",                lat: 52.5108, lng: 13.3812 },
  { id: "se-friedr",     chain: "sephora", area: "Friedrichstraße",  district: "Mitte",                lat: 52.5151, lng: 13.3893 },
];

/*
 * Produktkatalog
 * chains:    bei welchen Händlern das Produkt grundsätzlich gelistet ist
 * prices:    Circa-Preise je Händler (Demo)
 * category:  reinigung | serum | pflege | sonnenschutz | makeup
 * skin:      passende Hauttypen
 * concerns:  adressierte Hautthemen
 * tags:      z. B. parfuemfrei, reichhaltig, leicht
 * time:      morgens | abends | beides  (für die Routine)
 */
const PRODUCTS = [
  { id: "cerave-creme", brand: "CeraVe", name: "Feuchtigkeitscreme 340 g", category: "pflege",
    chains: ["dm", "rossmann", "douglas"], prices: { dm: 16.95, rossmann: 16.99, douglas: 18.99 },
    skin: ["trocken", "normal", "mischhaut"], concerns: ["trockenheit", "roetungen"], tags: ["parfuemfrei", "reichhaltig"], time: "beides" },
  { id: "cerave-gel", brand: "CeraVe", name: "Schäumendes Reinigungsgel 236 ml", category: "reinigung",
    chains: ["dm", "rossmann", "douglas"], prices: { dm: 11.95, rossmann: 11.99, douglas: 13.99 },
    skin: ["fettig", "mischhaut", "normal"], concerns: ["unreinheiten", "glanz"], tags: ["parfuemfrei"], time: "beides" },
  { id: "to-niacinamide", brand: "The Ordinary", name: "Niacinamide 10% + Zinc 1% 30 ml", category: "serum",
    chains: ["dm", "douglas", "sephora"], prices: { dm: 6.95, douglas: 7.50, sephora: 7.50 },
    skin: ["fettig", "mischhaut", "normal"], concerns: ["unreinheiten", "glanz", "pigmentflecken"], tags: ["parfuemfrei", "leicht"], time: "beides" },
  { id: "to-hyaluronic", brand: "The Ordinary", name: "Hyaluronic Acid 2% + B5 30 ml", category: "serum",
    chains: ["dm", "douglas", "sephora"], prices: { dm: 8.95, douglas: 9.90, sephora: 9.90 },
    skin: ["trocken", "normal", "mischhaut", "fettig"], concerns: ["trockenheit", "falten"], tags: ["parfuemfrei", "leicht"], time: "beides" },
  { id: "lrp-uvmune", brand: "La Roche-Posay", name: "Anthelios UVMune 400 Fluid LSF 50+", category: "sonnenschutz",
    chains: ["dm", "rossmann", "douglas"], prices: { dm: 21.95, rossmann: 21.99, douglas: 24.99 },
    skin: ["trocken", "normal", "mischhaut", "fettig"], concerns: ["sonnenschutz", "pigmentflecken", "roetungen"], tags: ["parfuemfrei", "leicht"], time: "morgens" },
  { id: "lrp-effaclar", brand: "La Roche-Posay", name: "Effaclar Duo+M 40 ml", category: "pflege",
    chains: ["dm", "rossmann", "douglas"], prices: { dm: 19.95, rossmann: 19.99, douglas: 22.99 },
    skin: ["fettig", "mischhaut"], concerns: ["unreinheiten", "glanz"], tags: ["leicht"], time: "beides" },
  { id: "balea-hyaluron", brand: "Balea", name: "Hyaluron Feuchtigkeitscreme 50 ml", category: "pflege",
    chains: ["dm"], prices: { dm: 2.95 },
    skin: ["normal", "mischhaut", "trocken"], concerns: ["trockenheit"], tags: [], time: "beides" },
  { id: "balea-mizellen", brand: "Balea", name: "Mizellenwasser 400 ml", category: "reinigung",
    chains: ["dm"], prices: { dm: 1.95 },
    skin: ["normal", "trocken", "mischhaut"], concerns: ["roetungen"], tags: ["parfuemfrei"], time: "abends", remover: true },
  { id: "isana-hyaluron", brand: "Isana", name: "Hyaluron Tagescreme LSF 15 50 ml", category: "pflege",
    chains: ["rossmann"], prices: { rossmann: 3.49 },
    skin: ["normal", "mischhaut", "trocken"], concerns: ["trockenheit", "falten"], tags: [], time: "morgens" },
  { id: "isana-reinigung", brand: "Isana", name: "Clear Waschgel 150 ml", category: "reinigung",
    chains: ["rossmann"], prices: { rossmann: 2.29 },
    skin: ["fettig", "mischhaut"], concerns: ["unreinheiten", "glanz"], tags: [], time: "beides" },
  { id: "sundance-fluid", brand: "Sundance", name: "Sonnenfluid Sensitiv LSF 50 50 ml", category: "sonnenschutz",
    chains: ["dm"], prices: { dm: 4.45 },
    skin: ["normal", "trocken", "mischhaut", "fettig"], concerns: ["sonnenschutz"], tags: ["parfuemfrei"], time: "morgens" },
  { id: "bioderma-sensibio", brand: "Bioderma", name: "Sensibio H2O Mizellenwasser 250 ml", category: "reinigung",
    chains: ["dm", "rossmann", "douglas"], prices: { dm: 12.95, rossmann: 12.99, douglas: 14.99 },
    skin: ["trocken", "normal", "mischhaut"], concerns: ["roetungen", "trockenheit"], tags: ["parfuemfrei"], time: "abends", remover: true },
  { id: "eucerin-filler", brand: "Eucerin", name: "Hyaluron-Filler Tagespflege LSF 30", category: "pflege",
    chains: ["dm", "rossmann", "douglas"], prices: { dm: 27.95, rossmann: 27.99, douglas: 32.99 },
    skin: ["trocken", "normal"], concerns: ["falten", "trockenheit"], tags: ["reichhaltig"], time: "morgens" },
  { id: "paulas-bha", brand: "Paula's Choice", name: "Skin Perfecting 2% BHA Liquid 118 ml", category: "serum",
    chains: ["douglas"], prices: { douglas: 36.00 },
    skin: ["fettig", "mischhaut"], concerns: ["unreinheiten", "glanz"], tags: ["parfuemfrei", "aktiv"], time: "abends" },
  { id: "clinique-surge", brand: "Clinique", name: "Moisture Surge 100H 50 ml", category: "pflege",
    chains: ["douglas", "sephora"], prices: { douglas: 39.99, sephora: 39.99 },
    skin: ["trocken", "normal", "mischhaut"], concerns: ["trockenheit"], tags: ["parfuemfrei", "leicht"], time: "beides" },
  { id: "essence-lash", brand: "essence", name: "Lash Princess False Lash Mascara", category: "makeup",
    chains: ["dm", "rossmann"], prices: { dm: 4.95, rossmann: 4.95 },
    skin: [], concerns: [], tags: [], time: null },
  { id: "catrice-concealer", brand: "Catrice", name: "True Skin High Cover Concealer", category: "makeup",
    chains: ["dm", "rossmann"], prices: { dm: 5.95, rossmann: 5.99 },
    skin: [], concerns: [], tags: [], time: null },
  { id: "maybelline-skyhigh", brand: "Maybelline", name: "Lash Sensational Sky High Mascara", category: "makeup",
    chains: ["dm", "rossmann", "douglas"], prices: { dm: 12.95, rossmann: 12.99, douglas: 14.99 },
    skin: [], concerns: [], tags: [], time: null },
  { id: "nyx-butter", brand: "NYX Professional Makeup", name: "Butter Gloss", category: "makeup",
    chains: ["dm", "rossmann", "douglas"], prices: { dm: 6.95, rossmann: 6.99, douglas: 7.99 },
    skin: [], concerns: [], tags: [], time: null },
  { id: "rare-blush", brand: "Rare Beauty", name: "Soft Pinch Liquid Blush", category: "makeup",
    chains: ["sephora"], prices: { sephora: 25.00 },
    skin: [], concerns: [], tags: [], time: null },
  { id: "fenty-gloss", brand: "Fenty Beauty", name: "Gloss Bomb Universal Lip Luminizer", category: "makeup",
    chains: ["sephora"], prices: { sephora: 22.00 },
    skin: [], concerns: [], tags: [], time: null },
  { id: "benefit-hoola", brand: "Benefit", name: "Hoola Matte Bronzer", category: "makeup",
    chains: ["douglas", "sephora"], prices: { douglas: 36.00, sephora: 36.00 },
    skin: [], concerns: [], tags: [], time: null },
  { id: "sephora-cleansing", brand: "Sephora Collection", name: "Cleansing Water 200 ml", category: "reinigung",
    chains: ["sephora"], prices: { sephora: 9.99 },
    skin: ["normal", "mischhaut", "trocken"], concerns: ["roetungen"], tags: [], time: "abends", remover: true },
  { id: "avene-cicalfate", brand: "Avène", name: "Cicalfate+ Reparierende Creme 40 ml", category: "pflege",
    chains: ["douglas"], prices: { douglas: 14.99 },
    skin: ["trocken", "normal", "mischhaut", "fettig"], concerns: ["roetungen", "trockenheit"], tags: ["parfuemfrei", "reichhaltig"], time: "abends" },
];

PRODUCTS.push(
  { id: "to-retinol", brand: "The Ordinary", name: "Retinol 0.5% in Squalane 30 ml", category: "serum",
    chains: ["dm", "douglas", "sephora"], prices: { dm: 8.95, douglas: 9.90, sephora: 9.90 },
    skin: ["normal", "mischhaut", "trocken", "fettig"], concerns: ["falten", "pigmentflecken", "unreinheiten"], tags: ["parfuemfrei", "aktiv"], time: "abends" },
  { id: "garnier-vitc", brand: "Garnier", name: "Vitamin C Glow Booster Serum 30 ml", category: "serum",
    chains: ["dm", "rossmann"], prices: { dm: 12.95, rossmann: 12.99 },
    skin: ["normal", "mischhaut", "fettig"], concerns: ["pigmentflecken"], tags: ["leicht"], time: "morgens" },
);

const POPULAR = ["cerave-creme", "to-niacinamide", "lrp-uvmune", "rare-blush", "balea-hyaluron"];
