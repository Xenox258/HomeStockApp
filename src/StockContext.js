import React, { createContext, useState } from 'react';
import { normalizeProductName, haveCommonStems, matchesShoppingItem } from './utils/normalizeProductName';

export const StockContext = createContext();

export const StockProvider = ({ children }) => {
  const [stock, setStock] = useState([]);
  const [idealStock, setIdealStock] = useState([]);

  const addToStock = (product) => {
    const scannedStems = normalizeProductName(product.nom);

    setStock((prevStock) => {
      const found = prevStock.find((p) =>
        haveCommonStems(normalizeProductName(p.nom), scannedStems)
      );

      if (found) {
        return prevStock.map((p) =>
          haveCommonStems(normalizeProductName(p.nom), scannedStems)
            ? { ...p, quantite: p.quantite + 1 }
            : p
        );
      } else {
        return [...prevStock, { ...product, quantite: 1 }];
      }
    });

    // 🎯 NOUVEAU: Vérification automatique avec la liste de courses
    setIdealStock((prevIdealStock) => {
      return prevIdealStock.map((idealProduct) => {
        // Utiliser la nouvelle fonction de matching pour la liste de courses
        if (matchesShoppingItem(product.nom, idealProduct.nom)) {
          const currentInStock = stock.find((s) => 
            haveCommonStems(normalizeProductName(s.nom), normalizeProductName(idealProduct.nom))
          );
          const currentQty = currentInStock ? currentInStock.quantite : 0;
          
          // Vérifier si on a maintenant assez en stock
          if (currentQty + 1 >= idealProduct.quantite) {
            console.log(`📦 Objectif atteint pour "${idealProduct.nom}" grâce à "${product.nom}"`);
          } else {
            console.log(`📈 Progression pour "${idealProduct.nom}": ${currentQty + 1}/${idealProduct.quantite}`);
          }
        }
        return idealProduct;
      });
    });
  };

  const setIdealStockForProduct = (nom, quantite) => {
    const normalizedStems = normalizeProductName(nom);

    setIdealStock((prevIdealStock) => {
      const found = prevIdealStock.find((p) =>
        haveCommonStems(normalizeProductName(p.nom), normalizedStems)
      );
      if (found) {
        return prevIdealStock.map((p) =>
          haveCommonStems(normalizeProductName(p.nom), normalizedStems)
            ? { ...p, quantite }
            : p
        );
      } else {
        return [...prevIdealStock, { nom, quantite }];
      }
    });
  };

  const updateStock = (code, newQuantity, newName) => {
    setStock((prevStock) => {
      if (newQuantity <= 0) {
        return prevStock.filter((p) => p.code !== code);
      } else {
        return prevStock.map((p) =>
          p.code === code 
            ? { ...p, quantite: newQuantity, nom: newName || p.nom } 
            : p
        );
      }
    });
  };

  const removeFromStock = (code) => {
    setStock((prevStock) => prevStock.filter((p) => p.code !== code));
  };

  const removeFromIdealStock = (productName) => {
    setIdealStock((prevIdealStock) => 
      prevIdealStock.filter((p) => p.nom !== productName)
    );
  };

  return (
    <StockContext.Provider
      value={{
        stock,
        idealStock,
        addToStock,
        updateStock,
        removeFromStock,
        setIdealStockForProduct,
        removeFromIdealStock,
        normalizeProductName,
        matchesShoppingItem, // 🆕 Exporter la nouvelle fonction
      }}
    >
      {children}
    </StockContext.Provider>
  );
};