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
  { id: "to-hyaluronic", brand: "The Ordinary", name: "Hyaluronic Acid 2% + B5 30 ml", category: "feuchtigkeit",
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
  { id: "paulas-bha", brand: "Paula's Choice", name: "Skin Perfecting 2% BHA Liquid 118 ml", category: "peeling", acid: "bha",
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
  { id: "to-retinol", brand: "The Ordinary", name: "Retinol 0.5% in Squalane 30 ml", category: "retinoid",
    chains: ["dm", "douglas", "sephora"], prices: { dm: 8.95, douglas: 9.90, sephora: 9.90 },
    skin: ["normal", "mischhaut", "trocken", "fettig"], concerns: ["falten", "pigmentflecken", "unreinheiten"], tags: ["parfuemfrei", "aktiv"], time: "abends" },
  { id: "garnier-vitc", brand: "Garnier", name: "Vitamin C Glow Booster Serum 30 ml", category: "serum",
    chains: ["dm", "rossmann"], prices: { dm: 12.95, rossmann: 12.99 },
    skin: ["normal", "mischhaut", "fettig"], concerns: ["pigmentflecken"], tags: ["leicht"], time: "morgens" },
);

// ---------- Hautpflege-Ergänzungen (Auswahl orientiert an öffentlich geteilten Tipps von Leon / @xskincare) ----------
PRODUCTS.push(
  { id: "balea-niacin-azelain", brand: "Balea", name: "Serum Niacinamid & Azelainsäure 30 ml", category: "serum",
    chains: ["dm"], prices: { dm: 4.95 },
    skin: ["fettig", "mischhaut", "normal"], concerns: ["unreinheiten", "roetungen", "pigmentflecken", "glanz"], tags: ["leicht"], time: "beides" },
  { id: "balea-hydro-serum", brand: "Balea", name: "Hydro Serum mit Glycerin & Panthenol 30 ml", category: "feuchtigkeit",
    chains: ["dm"], prices: { dm: 3.95 },
    skin: ["trocken", "normal", "mischhaut", "fettig"], concerns: ["trockenheit", "roetungen"], tags: ["parfuemfrei", "glycerin", "leicht"], time: "beides" },
  { id: "no-peeling-cleanser", brand: "Nø Cosmetics", name: "AHA/PHA Peeling Cleanser 150 ml", category: "reinigung",
    chains: ["dm", "rossmann"], prices: { dm: 8.95, rossmann: 8.99 },
    skin: ["fettig", "mischhaut", "normal"], concerns: ["unreinheiten", "pigmentflecken", "glanz"], tags: ["aktiv"], time: "abends" },
  { id: "no-120h-cream", brand: "Nø Cosmetics", name: "120h Hyper Moisture Cream 50 ml", category: "pflege",
    chains: ["dm", "rossmann"], prices: { dm: 9.95, rossmann: 9.99 },
    skin: ["fettig", "mischhaut", "normal"], concerns: ["trockenheit"], tags: ["leicht", "glycerin"], time: "beides" },
  { id: "eucerin-oilcontrol", brand: "Eucerin", name: "Oil Control Sun Gel-Creme LSF 50+ 50 ml", category: "sonnenschutz",
    chains: ["dm", "rossmann", "douglas"], prices: { dm: 19.95, rossmann: 19.99, douglas: 22.99 },
    skin: ["fettig", "mischhaut"], concerns: ["sonnenschutz", "glanz", "unreinheiten"], tags: ["leicht"], time: "morgens" },
  { id: "garnier-spf-fluid", brand: "Garnier", name: "Ambre Solaire Sensitive Expert+ Fluid LSF 50+", category: "sonnenschutz",
    chains: ["dm", "rossmann"], prices: { dm: 9.95, rossmann: 9.99 },
    skin: ["trocken", "normal", "mischhaut", "fettig"], concerns: ["sonnenschutz", "roetungen"], tags: ["leicht"], time: "morgens" },
  { id: "sunozon-fluid", brand: "Sun Ozon", name: "Sonnenfluid LSF 50 50 ml", category: "sonnenschutz",
    chains: ["rossmann"], prices: { rossmann: 3.99 },
    skin: ["normal", "mischhaut", "fettig"], concerns: ["sonnenschutz"], tags: ["leicht"], time: "morgens" },
  { id: "to-salicylic", brand: "The Ordinary", name: "Salicylic Acid 2% Solution 30 ml", category: "peeling", acid: "bha",
    chains: ["dm", "douglas", "sephora"], prices: { dm: 6.95, douglas: 7.50, sephora: 7.50 },
    skin: ["fettig", "mischhaut"], concerns: ["unreinheiten", "glanz"], tags: ["aktiv", "parfuemfrei"], time: "abends" },
  { id: "to-glycolic", brand: "The Ordinary", name: "Glycolic Acid 7% Exfoliating Toner 240 ml", category: "peeling", acid: "aha",
    chains: ["dm", "douglas", "sephora"], prices: { dm: 11.95, douglas: 12.90, sephora: 12.90 },
    skin: ["normal", "mischhaut", "trocken", "fettig"], concerns: ["pigmentflecken", "falten", "trockenheit"], tags: ["aktiv"], time: "abends" },
);

// ---------- Haarpflege ----------
// hair.types: glatt | wellig | lockig | kraus   hair.thick: fein | mittel | dick
// hair.scalp: fettig | normal | trocken | schuppen   hair.goals: volumen, feuchtigkeit, reparatur, glanz, locken, frizz, farbe, kopfhaut, dichte
// hair.color: true = besonders für gefärbtes/blondiertes Haar
const H = (types, thick, scalp, goals, extra = {}) => ({ types, thick, scalp, goals, ...extra });
const ALL_TYPES = ["glatt", "wellig", "lockig", "kraus"];
PRODUCTS.push(
  { id: "balea-volumen-shampoo", area: "haar", brand: "Balea", name: "Volumen Shampoo 300 ml", category: "shampoo",
    chains: ["dm"], prices: { dm: 0.95 }, hair: H(["glatt", "wellig"], ["fein"], ["fettig", "normal"], ["volumen", "haardicke"]), tags: [] },
  { id: "fructis-aloe-shampoo", area: "haar", brand: "Garnier Fructis", name: "Hair Food Aloe Vera Shampoo 350 ml", category: "shampoo",
    chains: ["dm", "rossmann"], prices: { dm: 4.45, rossmann: 4.49 }, hair: H(["glatt", "wellig"], ["fein", "mittel"], ["normal", "fettig"], ["feuchtigkeit", "glanz"]), tags: [] },
  { id: "balea-oilrepair-shampoo", area: "haar", brand: "Balea Professional", name: "Oil Repair Intensiv Shampoo 250 ml", category: "shampoo",
    chains: ["dm"], prices: { dm: 2.95 }, hair: H(ALL_TYPES, ["mittel", "dick"], ["normal", "trocken"], ["reparatur", "feuchtigkeit"]), tags: [] },
  { id: "cantu-shampoo", area: "haar", brand: "Cantu", name: "Shea Butter Sulfate-Free Cleansing Cream Shampoo", category: "shampoo",
    chains: ["dm", "rossmann"], prices: { dm: 7.95, rossmann: 7.99 }, hair: H(["lockig", "kraus", "wellig"], ["mittel", "dick"], ["normal", "trocken"], ["locken", "feuchtigkeit", "frizz"]), tags: ["sulfatfrei"] },
  { id: "hs-classic", area: "haar", brand: "Head & Shoulders", name: "Classic Clean Anti-Schuppen Shampoo 300 ml", category: "shampoo",
    chains: ["dm", "rossmann"], prices: { dm: 4.95, rossmann: 4.99 }, hair: H(ALL_TYPES, ["fein", "mittel", "dick"], ["schuppen"], ["kopfhaut"]), tags: [] },
  { id: "olaplex-4", area: "haar", brand: "Olaplex", name: "No. 4 Bond Maintenance Shampoo 250 ml", category: "shampoo",
    chains: ["douglas"], prices: { douglas: 29.95 }, hair: H(ALL_TYPES, ["fein", "mittel", "dick"], ["normal", "trocken"], ["reparatur", "farbe"], { color: true }), tags: ["sulfatfrei"] },
  { id: "johnfrieda-silber", area: "haar", brand: "John Frieda", name: "Sheer Blonde Go Blonder Violett-Shampoo", category: "shampoo",
    chains: ["dm", "rossmann", "douglas"], prices: { dm: 7.95, rossmann: 7.99, douglas: 9.99 }, hair: H(ALL_TYPES, ["fein", "mittel", "dick"], ["normal", "fettig"], ["farbe"], { color: true, blondOnly: true }), tags: [] },
  { id: "alpecin-c1", area: "haar", brand: "Alpecin", name: "Coffein-Shampoo C1 250 ml", category: "shampoo",
    chains: ["dm", "rossmann"], prices: { dm: 7.45, rossmann: 7.49 }, hair: H(["glatt", "wellig"], ["fein", "mittel"], ["normal", "fettig"], ["dichte", "kopfhaut", "wachstum"]), tags: [] },

  { id: "pantene-repair-spuelung", area: "haar", brand: "Pantene Pro-V", name: "Repair & Care Spülung 200 ml", category: "spuelung",
    chains: ["dm", "rossmann"], prices: { dm: 3.95, rossmann: 3.99 }, hair: H(["glatt", "wellig"], ["mittel", "dick"], ["normal", "trocken", "fettig"], ["reparatur", "glanz"]), tags: [] },
  { id: "elvital-dream-spuelung", area: "haar", brand: "L'Oréal Elvital", name: "Dream Length Spülung 200 ml", category: "spuelung",
    chains: ["dm", "rossmann"], prices: { dm: 3.45, rossmann: 3.49 }, hair: H(["glatt", "wellig"], ["fein", "mittel"], ["normal", "fettig"], ["reparatur", "glanz"]), tags: [] },
  { id: "balea-leicht-spuelung", area: "haar", brand: "Balea", name: "Volumen Spülung leicht 300 ml", category: "spuelung",
    chains: ["dm"], prices: { dm: 0.95 }, hair: H(["glatt", "wellig"], ["fein"], ["fettig", "normal"], ["volumen", "haardicke"]), tags: ["leicht"] },
  { id: "cantu-conditioner", area: "haar", brand: "Cantu", name: "Shea Butter Hydrating Cream Conditioner", category: "spuelung",
    chains: ["dm", "rossmann"], prices: { dm: 7.95, rossmann: 7.99 }, hair: H(["lockig", "kraus", "wellig"], ["mittel", "dick"], ["normal", "trocken"], ["locken", "feuchtigkeit", "frizz"]), tags: [] },

  { id: "fructis-papaya-maske", area: "haar", brand: "Garnier Fructis", name: "Hair Food Papaya 3in1 Maske 390 ml", category: "maske",
    chains: ["dm", "rossmann"], prices: { dm: 6.95, rossmann: 6.99 }, hair: H(ALL_TYPES, ["mittel", "dick"], ["normal", "trocken", "fettig"], ["reparatur", "feuchtigkeit"]), tags: [] },
  { id: "olaplex-3", area: "haar", brand: "Olaplex", name: "No. 3 Hair Perfector 100 ml", category: "maske",
    chains: ["dm", "douglas"], prices: { dm: 29.95, douglas: 29.95 }, hair: H(ALL_TYPES, ["fein", "mittel", "dick"], ["normal", "trocken", "fettig"], ["reparatur", "farbe", "haardicke"], { color: true }), tags: [] },
  { id: "k18-mask", area: "haar", brand: "K18", name: "Leave-in Molecular Repair Hair Mask 15 ml", category: "maske",
    chains: ["douglas", "sephora"], prices: { douglas: 32.00, sephora: 32.00 }, hair: H(ALL_TYPES, ["fein", "mittel", "dick"], ["normal", "trocken", "fettig"], ["reparatur", "farbe"], { color: true }), tags: [] },

  { id: "cantu-leavein", area: "haar", brand: "Cantu", name: "Shea Butter Leave-In Conditioning Repair Cream", category: "leavein",
    chains: ["dm", "rossmann"], prices: { dm: 8.95, rossmann: 8.99 }, hair: H(["lockig", "kraus"], ["mittel", "dick"], ["normal", "trocken"], ["locken", "feuchtigkeit", "frizz"]), tags: [] },
  { id: "moroccanoil-treatment", area: "haar", brand: "Moroccanoil", name: "Treatment Haaröl 100 ml", category: "leavein",
    chains: ["douglas", "sephora"], prices: { douglas: 41.95, sephora: 41.95 }, hair: H(ALL_TYPES, ["mittel", "dick"], ["normal", "trocken"], ["glanz", "frizz", "feuchtigkeit"]), tags: [] },
  { id: "gisou-oil", area: "haar", brand: "Gisou", name: "Honey Infused Hair Oil 50 ml", category: "leavein",
    chains: ["sephora"], prices: { sephora: 49.00 }, hair: H(ALL_TYPES, ["fein", "mittel", "dick"], ["normal", "trocken"], ["glanz", "frizz"]), tags: [] },
  { id: "elvital-leavein", area: "haar", brand: "L'Oréal Elvital", name: "Dream Length Wonder Water Leave-in", category: "leavein",
    chains: ["dm", "rossmann"], prices: { dm: 5.95, rossmann: 5.99 }, hair: H(["glatt", "wellig"], ["fein", "mittel"], ["normal", "fettig"], ["glanz", "reparatur"]), tags: ["leicht"] },

  { id: "gliss-hitzeschutz", area: "haar", brand: "Gliss", name: "Hitzeschutz-Spray Ultimate Repair 150 ml", category: "hitzeschutz",
    chains: ["dm", "rossmann"], prices: { dm: 4.95, rossmann: 4.99 }, hair: H(ALL_TYPES, ["fein", "mittel", "dick"], ["normal", "trocken", "fettig", "schuppen"], ["reparatur"]), tags: [] },
  { id: "ghd-heatprotect", area: "haar", brand: "ghd", name: "Bodyguard Hitzeschutzspray 120 ml", category: "hitzeschutz",
    chains: ["douglas"], prices: { douglas: 19.95 }, hair: H(ALL_TYPES, ["fein", "mittel", "dick"], ["normal", "trocken", "fettig", "schuppen"], ["glanz"]), tags: [] },

  { id: "batiste-trocken", area: "haar", brand: "Batiste", name: "Trockenshampoo Original 200 ml", category: "styling",
    chains: ["dm", "rossmann"], prices: { dm: 4.45, rossmann: 4.49 }, hair: H(["glatt", "wellig"], ["fein", "mittel"], ["fettig"], ["volumen"]), tags: [] },
  { id: "briogeo-scalp", area: "haar", brand: "Briogeo", name: "Scalp Revival Charcoal + Coconut Oil Micro-Exfoliating Shampoo", category: "kopfhaut",
    chains: ["sephora"], prices: { sephora: 39.00 }, hair: H(ALL_TYPES, ["fein", "mittel", "dick"], ["fettig", "schuppen", "trocken"], ["kopfhaut"]), tags: [] },
  { id: "plantur39-shampoo", area: "haar", brand: "Plantur 39", name: "Phyto-Coffein-Shampoo 250 ml", category: "shampoo",
    chains: ["dm", "rossmann"], prices: { dm: 6.95, rossmann: 6.99 }, hair: H(ALL_TYPES, ["fein", "mittel", "dick"], ["normal", "fettig", "trocken"], ["dichte", "kopfhaut", "wachstum"]), tags: [] },
  { id: "alpecin-liquid", area: "haar", brand: "Alpecin", name: "Coffein Liquid Kopfhaut-Tonikum 200 ml", category: "kopfhaut",
    chains: ["dm", "rossmann"], prices: { dm: 9.95, rossmann: 9.99 }, hair: H(ALL_TYPES, ["fein", "mittel", "dick"], ["normal", "fettig", "trocken"], ["dichte", "kopfhaut", "wachstum"]), tags: [] },
  { id: "balea-kopfhaut-serum", area: "haar", brand: "Balea", name: "Kopfhaut-Serum beruhigend 50 ml", category: "kopfhaut",
    chains: ["dm"], prices: { dm: 3.95 }, hair: H(ALL_TYPES, ["fein", "mittel", "dick"], ["trocken", "schuppen"], ["kopfhaut"]), tags: [] },
);

const POPULAR = ["cerave-creme", "to-niacinamide", "lrp-uvmune", "rare-blush", "balea-hyaluron"];

// ---------- Erweiterung: weitere Produkte (Demo-Preise, ca.) ----------
const SK = (id, brand, name, category, chains, prices, skin, concerns, tags, time, extra = {}) =>
  ({ id, brand, name, category, chains, prices, skin, concerns, tags, time, ...extra });
const MU = (id, brand, name, chains, prices) =>
  ({ id, brand, name, category: "makeup", chains, prices, skin: [], concerns: [], tags: [], time: null });
const HP = (id, brand, name, category, chains, prices, hair, tags = []) =>
  ({ id, area: "haar", brand, name, category, chains, prices, hair, tags });
const DRO = ["dm", "rossmann"];
const ALLT = ["glatt", "wellig", "lockig", "kraus"], ALLTH = ["fein", "mittel", "dick"];

PRODUCTS.push(
  // Hautpflege
  SK("cerave-hydrating-cleanser", "CeraVe", "Feuchtigkeitsspendende Reinigungslotion 236 ml", "reinigung", ["dm", "rossmann", "douglas"], { dm: 11.95, rossmann: 11.99, douglas: 13.99 }, ["trocken", "normal"], ["trockenheit", "roetungen"], ["parfuemfrei", "glycerin"], "beides"),
  SK("lrp-toleriane-cleanser", "La Roche-Posay", "Toleriane Sanftes Reinigungsfluid 400 ml", "reinigung", ["dm", "rossmann", "douglas"], { dm: 17.95, rossmann: 17.99, douglas: 19.99 }, ["trocken", "normal", "mischhaut"], ["roetungen", "trockenheit"], ["parfuemfrei"], "beides"),
  SK("eucerin-dermopure-gel", "Eucerin", "DermoPure Reinigungsgel 200 ml", "reinigung", ["dm", "rossmann", "douglas"], { dm: 12.95, rossmann: 12.99, douglas: 14.99 }, ["fettig", "mischhaut"], ["unreinheiten", "glanz"], [], "beides"),
  SK("bioderma-sebium-gel", "Bioderma", "Sébium Gel Moussant 200 ml", "reinigung", ["dm", "rossmann", "douglas"], { dm: 13.95, rossmann: 13.99, douglas: 15.99 }, ["fettig", "mischhaut"], ["unreinheiten", "glanz"], ["parfuemfrei"], "beides"),
  SK("alverde-klaer-gel", "alverde", "Klärendes Waschgel Heilerde 150 ml", "reinigung", ["dm"], { dm: 2.45 }, ["fettig", "mischhaut"], ["unreinheiten", "glanz"], [], "beides"),
  SK("to-azelaic", "The Ordinary", "Azelaic Acid Suspension 10% 30 ml", "serum", ["dm", "douglas", "sephora"], { dm: 9.95, douglas: 10.90, sephora: 10.90 }, ["fettig", "mischhaut", "normal"], ["roetungen", "unreinheiten", "pigmentflecken"], ["parfuemfrei"], "beides"),
  SK("isana-hyaluron-booster", "Isana", "Hyaluron Booster Serum 30 ml", "feuchtigkeit", ["rossmann"], { rossmann: 3.99 }, ["trocken", "normal", "mischhaut"], ["trockenheit", "falten"], [], "beides"),
  SK("paulas-aha-gel", "Paula's Choice", "Skin Perfecting 8% AHA Gel Exfoliant 100 ml", "peeling", ["douglas"], { douglas: 36.00 }, ["normal", "trocken", "mischhaut"], ["pigmentflecken", "falten", "trockenheit"], ["aktiv", "parfuemfrei"], "abends", { acid: "aha" }),
  SK("neutrogena-hydroboost", "Neutrogena", "Hydro Boost Aqua Gel 50 ml", "pflege", DRO, { dm: 14.95, rossmann: 14.99 }, ["fettig", "mischhaut", "normal"], ["trockenheit"], ["leicht", "glycerin"], "beides"),
  SK("nivea-soft", "Nivea", "Soft Erfrischende Feuchtigkeitscreme 200 ml", "pflege", DRO, { dm: 4.45, rossmann: 4.49 }, ["normal", "trocken", "mischhaut"], ["trockenheit"], ["glycerin"], "beides"),
  SK("cerave-pm-lotion", "CeraVe", "Feuchtigkeitsspendende Nachtcreme 52 ml", "pflege", ["dm", "rossmann", "douglas"], { dm: 15.95, rossmann: 15.99, douglas: 17.99 }, ["fettig", "mischhaut", "normal"], ["unreinheiten", "glanz", "trockenheit"], ["parfuemfrei", "leicht"], "abends"),
  SK("lrp-cicaplast", "La Roche-Posay", "Cicaplast Baume B5+ 40 ml", "pflege", ["dm", "rossmann", "douglas"], { dm: 11.95, rossmann: 11.99, douglas: 13.99 }, ["trocken", "normal", "mischhaut"], ["roetungen", "trockenheit"], ["parfuemfrei", "reichhaltig"], "abends"),
  SK("kiehls-ufc", "Kiehl's", "Ultra Facial Cream 50 ml", "pflege", ["douglas", "sephora"], { douglas: 34.00, sephora: 34.00 }, ["trocken", "normal"], ["trockenheit"], ["glycerin", "reichhaltig"], "beides"),
  SK("isdin-fusion-water", "ISDIN", "Fusion Water Magic LSF 50 50 ml", "sonnenschutz", ["douglas"], { douglas: 29.95 }, ["fettig", "mischhaut", "normal", "trocken"], ["sonnenschutz", "pigmentflecken"], ["leicht"], "morgens"),
  SK("balea-spf-fluid", "Balea", "Sonnenfluid Gesicht LSF 50 50 ml", "sonnenschutz", ["dm"], { dm: 3.95 }, ["normal", "mischhaut", "fettig"], ["sonnenschutz"], ["leicht"], "morgens"),

  // Make-up
  MU("maybelline-fitme", "Maybelline", "Fit Me Matte + Poreless Foundation", ["dm", "rossmann", "douglas"], { dm: 9.95, rossmann: 9.99, douglas: 11.99 }),
  MU("loreal-truematch", "L'Oréal Paris", "True Match Foundation", ["dm", "rossmann", "douglas"], { dm: 12.95, rossmann: 12.99, douglas: 14.99 }),
  MU("essence-camouflage", "essence", "Camouflage+ Matt Concealer", DRO, { dm: 3.95, rossmann: 3.95 }),
  MU("catrice-lashchanger", "Catrice", "Lash Changer Volume Mascara", DRO, { dm: 4.95, rossmann: 4.99 }),
  MU("maybelline-lifter", "Maybelline", "Lifter Gloss", ["dm", "rossmann", "douglas"], { dm: 9.95, rossmann: 9.99, douglas: 11.99 }),
  MU("nars-concealer", "NARS", "Radiant Creamy Concealer", ["douglas", "sephora"], { douglas: 33.00, sephora: 33.00 }),
  MU("benefit-gimmebrow", "Benefit", "Gimme Brow+ Volumizing Brow Gel", ["douglas", "sephora"], { douglas: 27.00, sephora: 27.00 }),
  MU("ct-pillowtalk", "Charlotte Tilbury", "Matte Revolution Lipstick Pillow Talk", ["douglas"], { douglas: 36.00 }),
  MU("fenty-profiltr", "Fenty Beauty", "Pro Filt'r Soft Matte Foundation", ["sephora"], { sephora: 38.00 }),
  MU("rare-luminizer", "Rare Beauty", "Positive Light Liquid Luminizer", ["sephora"], { sephora: 28.00 }),

  // Haare – Shampoo
  HP("schauma-kraft", "Schauma", "Kraft & Vitalität Shampoo 400 ml", "shampoo", DRO, { dm: 1.45, rossmann: 1.49 }, H(["glatt", "wellig"], ["fein", "mittel"], ["normal", "fettig"], ["glanz"])),
  HP("guhl-volumen-shampoo", "Guhl", "Langzeit Volumen Shampoo 250 ml", "shampoo", DRO, { dm: 4.45, rossmann: 4.49 }, H(["glatt", "wellig"], ["fein"], ["normal", "fettig"], ["volumen", "haardicke"])),
  HP("isana-repair-shampoo", "Isana Professional", "Repair Shampoo 300 ml", "shampoo", ["rossmann"], { rossmann: 1.79 }, H(ALLT, ["mittel", "dick"], ["normal", "trocken"], ["reparatur"])),
  HP("pantene-repair-shampoo", "Pantene Pro-V", "Repair & Care Shampoo 300 ml", "shampoo", DRO, { dm: 3.95, rossmann: 3.99 }, H(["glatt", "wellig"], ["mittel", "dick"], ["normal", "trocken"], ["reparatur", "glanz"])),
  HP("fructis-banane-shampoo", "Garnier Fructis", "Hair Food Banane Shampoo 350 ml", "shampoo", DRO, { dm: 4.45, rossmann: 4.49 }, H(ALLT, ["mittel", "dick"], ["normal", "trocken"], ["feuchtigkeit"])),
  HP("balea-locken-shampoo", "Balea", "Locken Shampoo 300 ml", "shampoo", ["dm"], { dm: 1.25 }, H(["wellig", "lockig"], ["fein", "mittel"], ["normal"], ["locken", "frizz"])),
  HP("seborin-coffein", "Seborin", "Coffein Shampoo gegen Haarausfall 250 ml", "shampoo", DRO, { dm: 3.95, rossmann: 3.99 }, H(["glatt", "wellig"], ["fein", "mittel"], ["normal", "fettig"], ["dichte", "kopfhaut"])),
  HP("kerastase-bain-satin", "Kérastase", "Nutritive Bain Satin Shampoo 250 ml", "shampoo", ["douglas"], { douglas: 32.95 }, H(ALLT, ["mittel", "dick"], ["normal", "trocken"], ["feuchtigkeit", "glanz"])),
  HP("redken-abc-shampoo", "Redken", "Acidic Bonding Concentrate Shampoo 300 ml", "shampoo", ["douglas"], { douglas: 29.90 }, H(ALLT, ALLTH, ["normal", "trocken"], ["reparatur", "farbe"], { color: true }), ["sulfatfrei"]),
  HP("davines-oi-shampoo", "Davines", "OI Shampoo 250 ml", "shampoo", ["douglas"], { douglas: 26.50 }, H(ALLT, ALLTH, ["normal"], ["glanz", "frizz"]), ["sulfatfrei"]),

  // Haare – Spülung
  HP("gliss-repair-spuelung", "Gliss", "Ultimate Repair Spülung 200 ml", "spuelung", DRO, { dm: 3.45, rossmann: 3.49 }, H(ALLT, ["mittel", "dick"], ["normal", "trocken", "fettig"], ["reparatur"])),
  HP("isana-repair-spuelung", "Isana Professional", "Repair Spülung 300 ml", "spuelung", ["rossmann"], { rossmann: 1.79 }, H(ALLT, ["mittel", "dick"], ["normal", "trocken"], ["reparatur", "feuchtigkeit"])),
  HP("guhl-volumen-spuelung", "Guhl", "Langzeit Volumen Spülung 200 ml", "spuelung", DRO, { dm: 4.45, rossmann: 4.49 }, H(["glatt", "wellig"], ["fein"], ["normal", "fettig"], ["volumen", "haardicke"]), ["leicht"]),
  HP("olaplex-5", "Olaplex", "No. 5 Bond Maintenance Conditioner 250 ml", "spuelung", ["douglas"], { douglas: 29.95 }, H(ALLT, ALLTH, ["normal", "trocken", "fettig"], ["reparatur", "farbe"], { color: true })),
  HP("fructis-banane-spuelung", "Garnier Fructis", "Hair Food Banane Spülung 200 ml", "spuelung", DRO, { dm: 4.45, rossmann: 4.49 }, H(ALLT, ["mittel", "dick"], ["normal", "trocken"], ["feuchtigkeit", "frizz"])),

  // Haare – Kur
  HP("gliss-repair-kur", "Gliss", "Ultimate Repair Kur 300 ml", "maske", DRO, { dm: 4.95, rossmann: 4.99 }, H(ALLT, ["mittel", "dick"], ["normal", "trocken", "fettig"], ["reparatur"])),
  HP("balea-plex-maske", "Balea Professional", "Plex Bond Repair Maske 150 ml", "maske", ["dm"], { dm: 3.95 }, H(ALLT, ALLTH, ["normal", "trocken", "fettig"], ["reparatur", "farbe", "haardicke"], { color: true })),
  HP("fructis-kokos-maske", "Garnier Fructis", "Hair Food Kokosnuss 3in1 Maske 390 ml", "maske", DRO, { dm: 6.95, rossmann: 6.99 }, H(["wellig", "lockig", "kraus"], ["mittel", "dick"], ["normal", "trocken"], ["locken", "frizz", "feuchtigkeit"])),
  HP("redken-abc-maske", "Redken", "Acidic Bonding Concentrate Intensive Treatment 250 ml", "maske", ["douglas"], { douglas: 32.90 }, H(ALLT, ALLTH, ["normal", "trocken"], ["reparatur", "farbe"], { color: true })),

  // Haare – Leave-in und Öl
  HP("gliss-oel-elixier", "Gliss", "Öl-Elixier Ultimate Oil 75 ml", "leavein", DRO, { dm: 6.45, rossmann: 6.49 }, H(ALLT, ["mittel", "dick"], ["normal", "trocken"], ["glanz", "frizz"])),
  HP("balea-haaroel", "Balea Professional", "Oil Repair Haaröl 100 ml", "leavein", ["dm"], { dm: 2.95 }, H(ALLT, ["mittel", "dick"], ["normal", "trocken"], ["glanz", "frizz", "reparatur"])),
  HP("olaplex-7", "Olaplex", "No. 7 Bonding Oil 30 ml", "leavein", ["douglas", "sephora"], { douglas: 29.95, sephora: 29.95 }, H(ALLT, ALLTH, ["normal", "trocken", "fettig"], ["glanz", "reparatur", "farbe"], { color: true })),
  HP("cantu-curling-cream", "Cantu", "Coconut Curling Cream 340 g", "leavein", DRO, { dm: 8.95, rossmann: 8.99 }, H(["lockig", "kraus"], ["mittel", "dick"], ["normal", "trocken"], ["locken", "frizz"])),
  HP("sheamoisture-smoothie", "SheaMoisture", "Coconut & Hibiscus Curl Enhancing Smoothie 340 g", "leavein", ["dm"], { dm: 12.95 }, H(["lockig", "kraus"], ["mittel", "dick"], ["normal", "trocken"], ["locken", "feuchtigkeit", "frizz"])),

  // Haare – Hitzeschutz
  HP("tresemme-hitzeschutz", "TRESemmé", "Hitzeschutz Spray 200 ml", "hitzeschutz", DRO, { dm: 4.95, rossmann: 4.99 }, H(ALLT, ALLTH, ["normal", "trocken", "fettig", "schuppen"], ["glanz"])),
  HP("balea-hitzeschutz", "Balea", "Hitzeschutz Spray 150 ml", "hitzeschutz", ["dm"], { dm: 1.95 }, H(ALLT, ["fein", "mittel"], ["normal", "fettig", "trocken", "schuppen"], []), ["leicht"]),

  // Haare – Styling
  HP("got2b-powder", "got2b", "Volumen Puder Powder'ful 10 g", "styling", DRO, { dm: 4.45, rossmann: 4.49 }, H(["glatt", "wellig"], ["fein"], ["fettig", "normal"], ["volumen", "haardicke"])),
  HP("taft-volumen-mousse", "Taft", "Volumen Schaumfestiger 150 ml", "styling", DRO, { dm: 2.95, rossmann: 2.99 }, H(["glatt", "wellig"], ["fein", "mittel"], ["normal", "fettig"], ["volumen", "haardicke"])),
  HP("moroccanoil-curl-cream", "Moroccanoil", "Intense Curl Cream 300 ml", "styling", ["douglas"], { douglas: 33.95 }, H(["lockig", "kraus"], ["mittel", "dick"], ["normal", "trocken"], ["locken", "frizz"])),

  // Haare – Kopfhaut
  HP("to-hair-density", "The Ordinary", "Multi-Peptide Serum for Hair Density 60 ml", "kopfhaut", ["dm", "douglas", "sephora"], { dm: 19.95, douglas: 21.90, sephora: 21.90 }, H(ALLT, ALLTH, ["normal", "fettig", "trocken"], ["dichte", "kopfhaut", "wachstum"])),
);

// Ziele "kräftigeres Haar" und "Haarwachstum"
PRODUCTS.push(
  HP("elvital-fibralogy-shampoo", "L'Oréal Elvital", "Fibralogy Shampoo für mehr Haarfülle 250 ml", "shampoo", DRO, { dm: 4.95, rossmann: 4.99 }, H(["glatt", "wellig"], ["fein", "mittel"], ["normal", "fettig"], ["haardicke", "volumen"])),
  HP("elvital-fibralogy-spuelung", "L'Oréal Elvital", "Fibralogy Spülung für mehr Haarfülle 200 ml", "spuelung", DRO, { dm: 4.95, rossmann: 4.99 }, H(["glatt", "wellig"], ["fein", "mittel"], ["normal", "fettig"], ["haardicke", "volumen"]), ["leicht"]),
  HP("kerastase-densifique", "Kérastase", "Densifique Bain Densité Shampoo 250 ml", "shampoo", ["douglas"], { douglas: 32.95 }, H(ALLT, ["fein", "mittel"], ["normal", "fettig"], ["haardicke", "volumen", "dichte"])),
  HP("plantur39-tonikum", "Plantur 39", "Coffein-Tonikum 200 ml", "kopfhaut", DRO, { dm: 9.95, rossmann: 9.99 }, H(ALLT, ALLTH, ["normal", "fettig", "trocken"], ["wachstum", "dichte", "kopfhaut"])),
  HP("balea-wachstum-serum", "Balea", "Haarwachstums-Serum mit Koffein 100 ml", "kopfhaut", ["dm"], { dm: 4.95 }, H(ALLT, ALLTH, ["normal", "fettig", "trocken"], ["wachstum", "kopfhaut"])),
);

// ---------- Weitere Filialen in allen Bezirken (ungefähre Demo-Standorte) ----------
const ST = (id, chain, area, district, lat, lng) => ({ id, chain, area, district, lat, lng });
STORES.push(
  // dm
  ST("dm-spandau", "dm", "Spandau Arcaden", "Spandau", 52.5363, 13.2045),
  ST("dm-gesundbr", "dm", "Gesundbrunnen-Center", "Wedding", 52.5484, 13.3880),
  ST("dm-gropius", "dm", "Gropius Passagen", "Neukölln", 52.4310, 13.4600),
  ST("dm-eastgate", "dm", "Eastgate", "Marzahn", 52.5440, 13.5490),
  ST("dm-tempelhof", "dm", "Tempelhofer Damm", "Tempelhof", 52.4700, 13.3850),
  ST("dm-zehlendorf", "dm", "Teltower Damm", "Zehlendorf", 52.4330, 13.2590),
  ST("dm-koepenick", "dm", "Forum Köpenick", "Köpenick", 52.4590, 13.5800),
  ST("dm-schoeneweide", "dm", "Schöneweide", "Treptow", 52.4555, 13.5100),
  ST("dm-pankow", "dm", "Rathaus-Center Pankow", "Pankow", 52.5690, 13.4100),
  ST("dm-weissensee", "dm", "Berliner Allee", "Weißensee", 52.5530, 13.4610),
  ST("dm-hohenschoen", "dm", "Linden-Center", "Hohenschönhausen", 52.5520, 13.5040),
  ST("dm-maerkisches", "dm", "Märkisches Zentrum", "Reinickendorf", 52.6000, 13.3560),
  ST("dm-tegel", "dm", "Hallen am Borsigturm", "Tegel", 52.5850, 13.2850),
  ST("dm-moabit", "dm", "Turmstraße", "Moabit", 52.5262, 13.3440),
  ST("dm-warschauer", "dm", "Warschauer Straße", "Friedrichshain", 52.5060, 13.4500),
  ST("dm-mehringdamm", "dm", "Mehringdamm", "Kreuzberg", 52.4930, 13.3880),
  ST("dm-schoeneberg", "dm", "Hauptstraße", "Schöneberg", 52.4900, 13.3560),
  ST("dm-rosenthaler", "dm", "Rosenthaler Platz", "Mitte", 52.5297, 13.4015),
  ST("dm-hermannstr", "dm", "Hermannstraße", "Neukölln", 52.4720, 13.4290),
  ST("dm-hellersdorf", "dm", "Helle Mitte", "Hellersdorf", 52.5365, 13.6040),

  // Rossmann
  ST("ro-spandau", "rossmann", "Altstadt Spandau", "Spandau", 52.5370, 13.2020),
  ST("ro-gesundbr", "rossmann", "Gesundbrunnen-Center", "Wedding", 52.5480, 13.3870),
  ST("ro-gropius", "rossmann", "Gropius Passagen", "Neukölln", 52.4300, 13.4610),
  ST("ro-eastgate", "rossmann", "Eastgate", "Marzahn", 52.5436, 13.5480),
  ST("ro-hellersdorf", "rossmann", "Helle Mitte", "Hellersdorf", 52.5370, 13.6050),
  ST("ro-koepenick", "rossmann", "Forum Köpenick", "Köpenick", 52.4585, 13.5810),
  ST("ro-adlershof", "rossmann", "Adlershof", "Treptow", 52.4350, 13.5450),
  ST("ro-pankow", "rossmann", "Rathaus-Center Pankow", "Pankow", 52.5695, 13.4105),
  ST("ro-schoenh", "rossmann", "Schönhauser Allee Arcaden", "Prenzlauer Berg", 52.5415, 13.4130),
  ST("ro-warschauer", "rossmann", "Warschauer Straße", "Friedrichshain", 52.5070, 13.4510),
  ST("ro-friedr", "rossmann", "Friedrichstraße", "Mitte", 52.5180, 13.3885),
  ST("ro-schoeneberg", "rossmann", "Hauptstraße", "Schöneberg", 52.4905, 13.3550),
  ST("ro-tempelhof", "rossmann", "Tempelhofer Damm", "Tempelhof", 52.4710, 13.3860),
  ST("ro-zehlendorf", "rossmann", "Teltower Damm", "Zehlendorf", 52.4335, 13.2585),
  ST("ro-maerkisches", "rossmann", "Märkisches Zentrum", "Reinickendorf", 52.6005, 13.3555),
  ST("ro-tegel", "rossmann", "Gorkistraße", "Tegel", 52.5880, 13.2870),
  ST("ro-wilmersd", "rossmann", "Wilmersdorfer Straße", "Charlottenburg", 52.5075, 13.3070),
  ST("ro-hohenschoen", "rossmann", "Linden-Center", "Hohenschönhausen", 52.5525, 13.5035),
  ST("ro-kotti", "rossmann", "Kottbusser Tor", "Kreuzberg", 52.4990, 13.4180),
  ST("ro-friedenau", "rossmann", "Rheinstraße", "Friedenau", 52.4710, 13.3290),

  // Douglas
  ST("do-spandau", "douglas", "Spandau Arcaden", "Spandau", 52.5365, 13.2040),
  ST("do-ringcenter", "douglas", "Ring-Center", "Friedrichshain", 52.5143, 13.4790),
  ST("do-gropius", "douglas", "Gropius Passagen", "Neukölln", 52.4312, 13.4598),
  ST("do-eastgate", "douglas", "Eastgate", "Marzahn", 52.5438, 13.5492),
  ST("do-koepenick", "douglas", "Forum Köpenick", "Köpenick", 52.4592, 13.5803),
  ST("do-maerkisches", "douglas", "Märkisches Zentrum", "Reinickendorf", 52.6002, 13.3562),
  ST("do-schoenh", "douglas", "Schönhauser Allee Arcaden", "Prenzlauer Berg", 52.5417, 13.4127),
  ST("do-friedr", "douglas", "Friedrichstraße", "Mitte", 52.5155, 13.3888),
  ST("do-zehlendorf", "douglas", "Zehlendorf Mitte", "Zehlendorf", 52.4338, 13.2595),

  // Sephora
  ST("se-alex", "sephora", "Alexanderplatz", "Mitte", 52.5208, 13.4125),
  ST("se-schloss", "sephora", "Schloßstraße", "Steglitz", 52.4580, 13.3210),
);
