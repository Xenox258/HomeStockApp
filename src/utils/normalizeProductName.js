// src/utils/normalizeProductName.js

// Liste des mots à ignorer pour la normalisation
const termsToRemove = [
  'demi-écrémé', 'demi écrémé', 'stérilisé', 'écrémé', 'entier', 'complet',
  'bte', '50cl', '1l', '25cl', 'pack de', 'lot de', 'boîte de', 'bouteille de',
  'pâte', 'pâtes', 'eau', 'minérale', 'gazeuse', 'plate', 'plateau',
  'sachet', 'kg', 'g', 'l', 'cl', 'ml', 'suprême', 'bio', 'marque', 'graines',
  // Ajout de nouveaux termes pour améliorer le matching
  'x', 'pack', 'lot', 'boite', 'bouteille', 'canette', 'litre', 'litres'
];

// Mots-clés qui définissent les marques principales
const brandKeywords = [
  'coca', 'pepsi', 'sprite', 'fanta', 'orangina', 'monster', 'redbull', 'red', 'bull',
  'nutella', 'ferrero', 'kinder', 'danone', 'nestle', 'activia', 'actimel'
];

// Fonction de normalisation
export function normalizeProductName(name) {
  return name
    .toLowerCase()
    .normalize("NFD")                      // supprime les accents
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, "")             // enlève les caractères spéciaux
    .split(/\s+/)                         // divise en mots
    .filter(word => word.length > 2 && !termsToRemove.includes(word)) // filtre
    .map(word => word.slice(0, 5))        // coupe chaque mot à 5 lettres max (pour simplifier les racines)
    .sort();                              // trie pour comparaison insensible à l'ordre
}

// Vérifie si deux produits ont au moins un mot racine commun
export function haveCommonStems(wordsA, wordsB) {
  const setA = new Set(wordsA);
  return wordsB.some(word => setA.has(word));
}

// 🆕 NOUVELLE FONCTION : Matching spécialisé pour la liste de courses
export function matchesShoppingItem(scannedProductName, shoppingItemName) {
  const scannedWords = normalizeProductName(scannedProductName);
  const shoppingWords = normalizeProductName(shoppingItemName);
  
  console.log(`🔍 Comparaison: "${shoppingItemName}" (${shoppingWords.join(', ')}) vs "${scannedProductName}" (${scannedWords.join(', ')})`);
  
  // Cas 1: Si l'item de la liste est court (1-2 mots), on cherche ces mots dans le produit scanné
  if (shoppingWords.length <= 2) {
    const found = shoppingWords.every(shoppingWord => 
      scannedWords.some(scannedWord => 
        // Correspondance exacte ou inclusion
        scannedWord === shoppingWord || 
        scannedWord.includes(shoppingWord) || 
        shoppingWord.includes(scannedWord) ||
        // Similarité pour les marques (premiers caractères)
        (shoppingWord.length >= 3 && scannedWord.length >= 3 &&
         shoppingWord.substring(0, 3) === scannedWord.substring(0, 3))
      )
    );
    
    if (found) {
      console.log(`✅ Match trouvé (liste courte): "${shoppingItemName}" dans "${scannedProductName}"`);
      return true;
    }
  }
  
  // Cas 2: Vérification des marques principales
  const hasCommonBrand = brandKeywords.some(brand => {
    const brandInShopping = shoppingWords.some(word => word.includes(brand.slice(0, 4)));
    const brandInScanned = scannedWords.some(word => word.includes(brand.slice(0, 4)));
    return brandInShopping && brandInScanned;
  });
  
  if (hasCommonBrand) {
    console.log(`✅ Match trouvé (marque commune): "${shoppingItemName}" ≈ "${scannedProductName}"`);
    return true;
  }
  
  // Cas 3: Utiliser la méthode de correspondance normale mais avec un seuil plus permissif
  const hasCommonWords = haveCommonStems(scannedWords, shoppingWords);
  
  if (hasCommonWords) {
    console.log(`✅ Match trouvé (mots communs): "${shoppingItemName}" ≈ "${scannedProductName}"`);
    return true;
  }
  
  console.log(`❌ Pas de match: "${shoppingItemName}" vs "${scannedProductName}"`);
  return false;
}

// 🆕 NOUVELLE FONCTION : Calcul de similarité pour debug
export function calculateSimilarity(name1, name2) {
  const words1 = normalizeProductName(name1);
  const words2 = normalizeProductName(name2);
  
  if (!words1.length || !words2.length) return 0;
  
  const commonWords = words1.filter(word1 => 
    words2.some(word2 => 
      word1 === word2 || 
      word1.includes(word2) || 
      word2.includes(word1)
    )
  );
  
  return commonWords.length / Math.max(words1.length, words2.length);
}
