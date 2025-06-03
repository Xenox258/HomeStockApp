// src/utils/normalizeProductName.js

// Liste des mots à ignorer pour la normalisation
const termsToRemove = [
  'demi-écrémé', 'demi écrémé', 'stérilisé', 'écrémé', 'entier', 'complet',
  'bte', '50cl', '1l', '25cl', 'pack de', 'lot de', 'boîte de', 'bouteille de',
  'pâte', 'pâtes', 'eau', 'minérale', 'gazeuse', 'plate', 'plateau',
  'sachet', 'kg', 'g', 'l', 'cl', 'ml', 'suprême', 'bio', 'marque', 'graines'
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
    .sort();                              // trie pour comparaison insensible à l’ordre
}

// Vérifie si deux produits ont au moins un mot racine commun
export function haveCommonStems(wordsA, wordsB) {
  const setA = new Set(wordsA);
  return wordsB.some(word => setA.has(word));
}
