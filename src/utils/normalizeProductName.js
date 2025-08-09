// import fetch from 'node-fetch';

/* Normalisation des produits Open Food Facts:
 * - Détecte la marque (Coca-Cola, Monster, …)
 * - Catégorise (lait de vache vs laits végétaux: avoine, soja, coco, …)
 * - Simplifie le nom (nom canonique + éventuelle variante)
 */

const KNOWN_BRANDS = new Map([
  // Sodas / Energy
  ['coca', 'Coca-Cola'],
  ['coca-cola', 'Coca-Cola'],
  ['coke', 'Coca-Cola'],
  ['pepsi', 'Pepsi'],
  ['monster', 'Monster'],
  ['monster energy', 'Monster'],
  ['red bull', 'Red Bull'],
  // Laits / Boissons
  ['candia', 'Candia'],
  ['lactel', 'Lactel'],
  ['president', 'Président'],
  // Eau
  ['evian', 'Evian'],
  ['vittel', 'Vittel'],
  ['volvic', 'Volvic']
]);

const PLANT_MILK_TOKENS = ['avoine', 'soja', 'amande', 'coco', 'riz', 'noisette', 'chanvre', 'cajou', 'amarante', 'quinoa'];
const NON_COW_MILK_ANIMAL_TOKENS = ['chèvre', 'chevre', 'brebis', 'bufflonne', 'bufflonne', 'jument'];

const CATEGORY_TAGS = {
  cowMilk: ['en:cow-milks', 'fr:laits-de-vache'],
  milks: ['en:milks', 'fr:laits'],
  plantMilks: [
    'en:plant-based-milks', 'fr:boissons-vegetales', 'fr:laits-vegetaux',
    'en:plant-milks', 'en:plant-based-beverages', 'fr:boissons-vegetales-sans-sucres-ajoutes'
  ],
  oatMilk: [
    'en:oat-milks', 'fr:laits-d-avoine', 'fr:boissons-a-l-avoine',
    'en:oat-drinks', 'en:oat-beverages', 'fr:boisson-a-l-avoine', 'fr:boissons-vegetales-a-l-avoine'
  ],
  soyMilk: [
    'en:soy-milks', 'fr:laits-de-soja', 'fr:boissons-au-soja',
    'en:soy-drinks', 'en:soy-beverages', 'fr:boisson-au-soja', 'fr:boisson-vegetale-au-soja'
  ],
  almondMilk: [
    'en:almond-milks', 'fr:laits-d-amande', 'fr:boissons-a-l-amande',
    'en:almond-drinks', 'en:almond-beverages', 'fr:boisson-vegetale-a-l-amande'
  ],
  coconutMilk: [
    'en:coconut-milks', 'fr:laits-de-coco', 'fr:boissons-a-la-noix-de-coco',
    'en:coconut-milk', 'en:coconut-drinks', 'en:coconut-beverages',
    'fr:boisson-vegetale-a-la-noix-de-coco', 'fr:boisson-a-la-noix-de-coco'
  ],
  energyDrinks: ['en:energy-drinks', 'fr:boissons-energisantes'],
  sodas: ['en:sodas', 'fr:sodas'],
  waters: ['en:waters', 'fr:eaux'],
};

// Mots à retirer de la normalisation (exclure uniquement les mots inutiles mais garder "pain", "lait", etc.)
const termsToRemove = [
  'demi-écrémé', 'demi écrémé', 'stérilisé', 'écrémé', 'entier', 'complet',
  'bte', '50cl', '1l', '25cl', 'pack', 'lot', 'boîte', 'bouteille',
  'pâte', 'pâtes', 'eau', 'minérale', 'gazeuse', 'plate', 'plateau',
  'sachet', 'kg', 'g', 'l', 'cl', 'ml', 'suprême', 'bio', 'marque', 'graines',
  'x', 'canette', 'litre', 'litres', 'the', 'mere', 'from', 'jam', 'sal', 'spag','ecreme', 'demi', 'demie'
];

// Mots courts ambigus exclus (plus strict, mais PAS "pain" ni "lait")
const forbiddenShortWords = [
  'the', 'bio', 'jus', 'eau', 'sel', 'riz', 'oeuf', 'oeufs', 'vin', 'col', 'pet', 'max', 'mix'
];

// Variantes marques et préfixes à gérer
const brandVariantsGroups = [
  ['redbull', 'redbull', 'red-bull', 'red bull'],
  ['haagen', 'dazs', 'häagen', 'häagen-dazs', 'haagen dazs'],
  ['cocacola', 'coca', 'cola', 'coca-cola'],
  ['sthubert', 'sainthubert', 'st-hubert', 'saint-hubert', 'hubert'],
];

// Exclusions par catégorie (actuellement inutilisé -> commenté pour enlever le warning ESLint)
// const categoryExclusions = {
//   'lait': ['coco', 'amande', 'soja', 'riz', 'avoine'],
//   'pain': ['sucre', 'perdu'],
//   'pates': ['brisée', 'feuilletée'],
// };


// Ingrédients exclus (ne doivent pas matcher si seuls)
// const excludedIngredients = ['fraise', 'peche', 'abricot', 'chocolat', 'vanille'];

// --- Utilitaires ---

function normalizeString(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // retirer accents
    .replace(/[^a-z0-9\s]/g, ' ')     // garder uniquement lettres et chiffres et espaces
    .replace(/\s+/g, ' ')             // réduire espaces multiples
    .trim();
}
function normalizeWords(name) {
  return normalizeString(name)
    .split(' ')
    .map(word => normalizeString(word))  // AJOUTÉ
    .filter(word =>
      word.length >= 3 &&
      !termsToRemove.includes(word) &&
      !forbiddenShortWords.includes(word)
    );
}


function normalizeBrand(brand) {
  return normalizeString(brand).replace(/\s|-/g, ''); // enlever espaces et tirets pour comparer
}

function isBrandVariant(wordA, wordB) {
  // Normaliser (sans accents, espaces, tirets)
  const normA = normalizeBrand(wordA);
  const normB = normalizeBrand(wordB);

  for (const group of brandVariantsGroups) {
    if (group.includes(normA) && group.includes(normB)) return true;
  }

  // Gérer "st" vs "saint" en début de mot (ex: sthubert vs sainthubert)
  const stRe = /^st/;
  const saintRe = /^saint/;

  if (
    (stRe.test(normA) && normB.replace(saintRe, 'st') === normA) ||
    (saintRe.test(normA) && normB.replace(stRe, 'saint') === normA)
  ) return true;
  if (normA.replace(/[^a-z]/g, '') === normB.replace(/[^a-z]/g, '')) return true;

  return false;
}

// Pour la catégorie "lait" : exclure si c'est un ingrédient secondaire
function matchesCategoryLait(productName, shoppingItem) {
  const scannedWords = normalizeWords(productName);
  if (scannedWords.includes('coco') || scannedWords.includes('amande') || scannedWords.includes('soja') || scannedWords.includes('riz') || scannedWords.includes('avoine')) {
    return false;
  }
  if (scannedWords.includes('chocolat') && scannedWords.includes('lait')) return false;
  return true;
}

// Fonction simple de similarité basée sur Jaccard (intersection / union)
export function calculateSimilarity(a, b) {
  const wordsA = Array.isArray(a) ? a : normalizeWords(a);
  const wordsB = Array.isArray(b) ? b : normalizeWords(b);

  if (!wordsA.length || !wordsB.length) return 0;

  let score = 0;
  for (const wa of wordsA) {
    for (const wb of wordsB) {
      if (wa === wb) score += 1;
      else if (wa.includes(wb) || wb.includes(wa)) score += 0.5;
    }
  }

  return score / Math.max(wordsA.length, wordsB.length);
}


// --- Fonction principale ---

export function matchesShoppingItem(productName, shoppingItem) {
  
  if (!productName || !shoppingItem) return false;
  

  const productWords = normalizeProductName(productName);
  const shoppingWords = normalizeProductName(shoppingItem);

  // 1. Cas catégorie "lait" spécifique
  if (shoppingWords.includes('lait')) {
    if (!matchesCategoryLait(productName, shoppingItem)) {
      return false; // exclure "lait" comme ingrédient secondaire
    }
  }

  // 2. Vérifier correspondance stricte sur marques (ex: Kelloggs / Kellogg's)
  const brandMatch = shoppingWords.some(sw =>
    productWords.some(pw => isBrandVariant(pw, sw))
  );
  if (brandMatch) return true;

  // 3. Similarité globale pondérée
  const similarity = calculateSimilarity(productWords, shoppingWords);
if (similarity >= 0.6) return true; // seuil plus strict


  // 4. Cas particulier : on évite que "cola" matche "coca" par exemple
  const genericWords = ['cola', 'energy', 'original'];
  for (const gw of genericWords) {
    if (shoppingWords.includes(gw) && !productWords.includes(gw)) {
      return false;
    }
  }

  // 5. Cas particulier pain, pates etc. on accepte certaines correspondances
  if (shoppingWords.includes('pain') && productWords.includes('baguette')) return true;
  if (shoppingWords.includes('pates') && productWords.includes('spaghetti')) return true;
  if (shoppingWords.includes('pain') && productWords.some(w => ['bague', 'trad', 'ficel'].includes(w.slice(0, 5)))) return true;


  // 6. Matching strict sur intersection mots
  const commonWords = productWords.filter(word => shoppingWords.includes(word));
  if (commonWords.length === shoppingWords.length) return true;

  // 7. Matching partiel (concaténation) pour mots composés
  const concatShopping = shoppingWords.join('');
  const concatProduct = productWords.join('');
  if (concatProduct.includes(concatShopping) || concatShopping.includes(concatProduct)) {
    return true;
  }

  return false;
}

// Normalisation principale : mots triés, tronqués à 5 caractères
export function normalizeProductName(name) {
  const words = normalizeWords(name)
    .map(word => word.slice(0, 5));

  // Cas spécial marques concaténées : "coca cola" → "cocac"
  if (words.length >= 2 && isBrandVariant(words[0], words[1])) {
    const concat = (words[0] + words[1]).slice(0, 5);
    return [concat, ...words.slice(2)].sort();
  }

  return words.sort();
}


export function haveCommonStems(stemsA, stemsB) {
  if (!Array.isArray(stemsA) || !Array.isArray(stemsB)) return false;
  return stemsA.some(stem => stemsB.includes(stem));
}

function deburr(str = '') {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function tokenize(text = '') {
  return deburr(text)
    .replace(/[^a-z0-9%+\- ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function unique(arr) {
  return Array.from(new Set(arr));
}

function offTags(off, keys) {
  // Concatène les tags OFF depuis plusieurs champs (ex: categories_tags, labels_tags, ingredients_tags)
  const all = [];
  for (const k of keys) {
    const v = off?.[k];
    if (Array.isArray(v)) all.push(...v);
    else if (typeof v === 'string') all.push(...v.split(','));
  }
  return unique(
    all
      .map((x) => x?.toString?.().toLowerCase().trim())
      .filter(Boolean)
  );
}

function hasAnyTag(off, list) {
  const tags = offTags(off, ['categories_tags', 'labels_tags', 'ingredients_tags', 'allergens_tags']);
  return tags.some((t) => list.includes(t));
}

function detectBrand(off) {
  const brandStr = deburr(off?.brands || '');
  const nameStr = deburr(off?.product_name || off?.generic_name || '');
  const candidates = unique([...tokenize(brandStr), ...tokenize(nameStr)]);

  for (const token of candidates) {
    if (KNOWN_BRANDS.has(token)) return KNOWN_BRANDS.get(token);
  }
  // fallback: première marque brute si présente
  const firstBrand = off?.brands?.split(',')?.[0]?.trim();
  return firstBrand || null;
}

function looksLikePlantMilkByText(off) {
  // Renommage logique: ne regarde plus les ingrédients, et exige un contexte boisson/lait dans le NOM
  const name = deburr(off?.product_name || off?.generic_name || '');
  if (!/\b(lait|milk|boisson|drink)\b/.test(name)) return false;
  return PLANT_MILK_TOKENS.some((t) => name.includes(t));
}

// AJUSTÉ: n’identifie “chèvre/brebis…” que si le NOM parle de lait/boisson
function looksLikeNonCowAnimalMilk(off) {
  const name = deburr(off?.product_name || off?.generic_name || '');
  if (!/\b(lait|milk|boisson|drink)\b/.test(name)) return false;
  return NON_COW_MILK_ANIMAL_TOKENS.some((t) => name.includes(t));
}

// Heuristique plus fine: type de boisson végétale depuis le NOM uniquement
function detectPlantMilkFromText(off) {
  const name = deburr(off?.product_name || off?.generic_name || '');
  if (!/\b(lait|milk|boisson|drink)\b/.test(name)) return null;
  if (/\bavoine|oat\b/.test(name)) return 'oat-milk';
  if (/\bsoja|soy\b/.test(name)) return 'soy-milk';
  if (/\bamande|almond\b/.test(name)) return 'almond-milk';
  if (/\bcoco|coconut\b/.test(name)) return 'coconut-milk';
  return null;
}

function detectMilkCategory(off) {
  // 1) Tags OFF précis d’abord
  if (hasAnyTag(off, CATEGORY_TAGS.cowMilk)) return 'cow-milk';
  if (hasAnyTag(off, CATEGORY_TAGS.oatMilk)) return 'oat-milk';
  if (hasAnyTag(off, CATEGORY_TAGS.soyMilk)) return 'soy-milk';
  if (hasAnyTag(off, CATEGORY_TAGS.almondMilk)) return 'almond-milk';
  if (hasAnyTag(off, CATEGORY_TAGS.coconutMilk)) return 'coconut-milk';

  // 2) Tag générique plant-milks -> essayer d’affiner via NOM, sinon plant-milk
  if (hasAnyTag(off, CATEGORY_TAGS.plantMilks)) {
    const specific = detectPlantMilkFromText(off);
    if (specific) return specific;
    return 'plant-milk';
  }

  // 3) Heuristiques NOM uniquement (évite “soja” dans ingrédients comme Nutella)
  const specificPlant = detectPlantMilkFromText(off);
  if (specificPlant) return specificPlant;
  if (looksLikeNonCowAnimalMilk(off)) return 'other-animal-milk';
  if (looksLikePlantMilkByText(off)) return 'plant-milk';

  // 4) Lait de vache heuristique seulement si le NOM contient lait/milk
  const name = deburr(off?.product_name || off?.generic_name || '');
  const nameMentionsMilk = /\b(lait|milk)\b/.test(name);
  const isMilkTagged = hasAnyTag(off, CATEGORY_TAGS.milks);
  const hasMilkAllergen = offTags(off, ['allergens_tags']).some((t) => t.endsWith(':milk'));
  if ((isMilkTagged || nameMentionsMilk) && hasMilkAllergen) return 'cow-milk';

  return null;
}

function detectBeverageCategory(off) {
  if (hasAnyTag(off, CATEGORY_TAGS.energyDrinks)) return 'energy-drink';
  if (hasAnyTag(off, CATEGORY_TAGS.sodas)) return 'soda';
  if (hasAnyTag(off, CATEGORY_TAGS.waters)) return 'water';
  return null;
}

function stripJunk(name) {
  // Retire volumes, pack, pourcentage, mentions inutiles
  let s = ' ' + deburr(name) + ' ';
  s = s
    .replace(/\b(\d+)\s?(cl|ml|l|g|kg)\b/g, ' ')
    .replace(/\b(x\s?\d+|pack|lot|bouteille|canette|brique|bouteilles)\b/g, ' ')
    .replace(/\b(0%\s?sucre|sans\s?sucre|light|leger|léger|bio|uht|entier|demi\s?ecreme|demi|ecreme|écrémé|demi-écrémé)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return s;
}

function detectVariantForBrand(brand, name) {
  const n = deburr(name);
  if (brand === 'Coca-Cola') {
    if (/\b(zero|sans sucre|0 ?%)\b/.test(n)) return 'Zero';
    if (/\b(light|diet)\b/.test(n)) return 'Light';
    if (/\b(cherry|cerise)\b/.test(n)) return 'Cherry';
    return null;
  }
  if (brand === 'Monster') {
    if (/\bultra\b/.test(n)) return 'Ultra';
    if (/\b(mango loco|mango)\b/.test(n)) return 'Mango Loco';
    if (/\bpipeline punch\b/.test(n)) return 'Pipeline Punch';
    return null;
  }
  return null;
}

function buildCanonicalName({ category, brand, rawName }) {
  // Règles “produits du quotidien”
  if (category === 'cow-milk') return 'lait';
  if (category === 'oat-milk') return 'lait d’avoine';
  if (category === 'soy-milk') return 'lait de soja';
  if (category === 'almond-milk') return 'lait d’amande';
  if (category === 'coconut-milk') return 'lait de coco';
  if (category === 'plant-milk') return 'boisson végétale';
  if (category === 'other-animal-milk') return 'lait (autre)';

  // Boissons de marque
  if (brand === 'Coca-Cola') return 'Coca-Cola';
  if (brand === 'Pepsi') return 'Pepsi';
  if (brand === 'Monster') return 'Monster Energy';
  if (brand === 'Red Bull') return 'Red Bull';

  // Sinon: nom nettoyé court
  const clean = stripJunk(rawName);
  return clean || rawName;
}

export function normalizeOFFProduct(off) {
  const rawName = off?.product_name || off?.generic_name || off?.product_name_fr || off?.product_name_en || '';
  const brand = detectBrand(off);
  const milkCat = detectMilkCategory(off);
  const bevCat = detectBeverageCategory(off);
  const category = milkCat || bevCat || null;

  const canonicalName = buildCanonicalName({ category, brand, rawName });
  const variant = brand ? detectVariantForBrand(brand, rawName) : null;

  // --- Nouveautés ---
  const nutri = (off?.nutrition_grade_fr || '').toLowerCase() || null;   // 'a'...'e'
  const imageUrl =
    off?.image_front_small_url ||
    off?.image_front_url ||
    off?.image_url ||
    null;
  const thumbUrl = off?.image_thumb_url || imageUrl;

  return {
    rawName: rawName?.trim() || null,
    canonicalName,
    brand: brand || null,
    category,
    variant,
    nutriScore: nutri,          // ex: 'a'
    imageUrl,                   // grande ou medium
    thumbUrl,                   // miniature fallback
    tags: offTags(off, ['categories_tags', 'labels_tags', 'ingredients_tags', 'allergens_tags'])
  };
}

// Normalise un texte libre (si tu saisis à la main, hors OFF)
export function normalizeFreeTextName(text) {
  const t = stripJunk(text);
  // Règles minimales pour la saisie libre:
  if (/\blait\b/.test(deburr(t))) return 'lait';
  return t;
}
