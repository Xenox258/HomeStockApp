import React, { createContext, useState } from 'react';

export const StockContext = createContext();

// Liste de mots à supprimer pour normaliser les noms de produits
const termsToRemove = [
  'demi-écrémé', 'demi écrémé', 'stérilisé', 'écrémé', 'entier', 'complet',
  'bte', '50cl', '1l', '25cl', 'pack de', 'lot de', 'boîte de',
  'bouteille de', 'pâte', 'pâtes', 'eau', 'minérale', 'gazeuse',
  'plate', 'plateau', 'sachet', 'kg', 'g', 'l', 'cl', 'ml'
];

const normalizeProductName = (name) => {
  let normalizedName = name.toLowerCase().trim();

  // Normalisation Unicode pour enlever les accents
  normalizedName = normalizedName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Suppression des termes un par un
  termsToRemove.forEach((term) => {
    // Remplace les espaces et tirets dans le terme par une regex flexible
    const termNormalized = term.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const regex = new RegExp(`\\b${termNormalized.replace(/[\s-]/g, '[\\s-]*')}\\b`, 'gi');
    normalizedName = normalizedName.replace(regex, '').trim();
  });

  // Nettoie les espaces multiples et tirets
  normalizedName = normalizedName.replace(/[\s-]+/g, ' ').trim();

  return normalizedName;
};



export const StockProvider = ({ children }) => {
  const [stock, setStock] = useState([]);
  const [idealStock, setIdealStock] = useState([]);

const addToStock = (product) => {
  const normalizedName = normalizeProductName(product.nom);

  setStock((prevStock) => {
    const found = prevStock.find((p) => normalizeProductName(p.nom) === normalizedName);
    if (found) {
      return prevStock.map((p) =>
        normalizeProductName(p.nom) === normalizedName
          ? { ...p, quantite: p.quantite + 1 }
          : p
      );
    } else {
      // Garde le nom original dans stock, ne remplace pas par normalizedName
      return [...prevStock, { ...product, quantite: 1 }];
    }
  });
};


const setIdealStockForProduct = (nom, quantite) => {
  const normalizedName = normalizeProductName(nom);

  setIdealStock((prevIdealStock) => {
    const found = prevIdealStock.find((p) => normalizeProductName(p.nom) === normalizedName);
    if (found) {
      return prevIdealStock.map((p) =>
        normalizeProductName(p.nom) === normalizedName ? { ...p, quantite } : p
      );
    } else {
      // Garde nom original, ne normalise pas
      return [...prevIdealStock, { nom, quantite }];
    }
  });
};

const updateStock = (code, newQuantity) => {
  setStock((prevStock) => {
    if (newQuantity <= 0) {
      // Si la quantité est 0 ou négative, supprimer le produit
      return prevStock.filter((p) => p.code !== code);
    } else {
      // Sinon, mettre à jour la quantité
      return prevStock.map((p) =>
        p.code === code ? { ...p, quantite: newQuantity } : p
      );
    }
  });
};

const removeFromStock = (code) => {
  setStock((prevStock) => prevStock.filter((p) => p.code !== code));
};

  return (
    <StockContext.Provider value={{ 
      stock, 
      idealStock, 
      addToStock, 
      updateStock, 
      removeFromStock, 
      setIdealStockForProduct, 
      normalizeProductName 
    }}>
      {children}
    </StockContext.Provider>
  );
};
