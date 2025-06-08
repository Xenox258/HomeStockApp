import fetch from 'node-fetch';

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

// Exclusions par catégorie
const categoryExclusions = {
  'lait': ['coco', 'amande', 'soja', 'riz', 'avoine'],
  'pain': ['sucre', 'perdu'],
  'pates': ['brisée', 'feuilletée'],
};


// Ingrédients exclus (ne doivent pas matcher si seuls)
const excludedIngredients = ['fraise', 'peche', 'abricot', 'chocolat', 'vanille'];

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

function isCategoryExcluded(category, scannedWords) {
  const excl = categoryExclusions[category];
  if (!excl) return false;
  return scannedWords.some(word => excl.includes(word));
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
