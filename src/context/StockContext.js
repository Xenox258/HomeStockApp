import React, { createContext, useState } from 'react';
import { normalizeProductName, haveCommonStems, matchesShoppingItem } from 'utils/normalizeProductName';

export const StockContext = createContext();

export const StockProvider = ({ children }) => {
  const [stock, setStock] = useState([]);
  const [idealStock, setIdealStock] = useState([]);
  const [manualShoppingList, setManualShoppingList] = useState([]); // NEW

  const addManualShoppingItem = (nom, quantite = 1, meta = {}) => {
    const name = nom.trim();
    if (!name) return;
    setManualShoppingList(prev => {
      const existing = prev.find(i => i.nom.toLowerCase() === name.toLowerCase());
      if (existing) {
        return prev.map(i =>
          i.nom.toLowerCase() === name.toLowerCase()
            ? { ...i, quantite: i.quantite + quantite }
            : i
        );
      }
      return [...prev, {
        id: Date.now().toString(36),
        nom: name,
        quantite,
        ...meta,
        addedAt: Date.now(),
        manual: true
      }];
    });
  };

  const updateManualShoppingItem = (id, patch) => {
    setManualShoppingList(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  };

  const removeManualShoppingItem = (id) => {
    setManualShoppingList(prev => prev.filter(i => i.id !== id));
  };

  const clearPurchasedManualItems = () => {
    setManualShoppingList(prev => prev.filter(i => !i.purchased));
  };

  // Assure que normalizeProductName, haveCommonStems, matchesShoppingItem sont importés
  const adjustManualListAfterStockChange = (productName, delta = 1) => {
    if (delta <= 0) return;
    const addedStems = normalizeProductName(productName);

    setManualShoppingList(prev => {
      if (!prev.length) return prev;

      let remaining = delta;
      const next = [];
      for (const item of prev) {
        if (remaining > 0) {
          const match =
            matchesShoppingItem(productName, item.nom) ||
            matchesShoppingItem(item.nom, productName) ||
            haveCommonStems(addedStems, normalizeProductName(item.nom));

          if (match) {
            if (item.quantite > remaining) {
              // Réduire la quantité
              next.push({ ...item, quantite: item.quantite - remaining });
              remaining = 0;
            } else {
              // Consommé entièrement (ne pas pousser)
              remaining -= item.quantite;
            }
            continue;
          }
        }
        next.push(item);
      }
      return next;
    });
  };

  const addToStock = (product) => {
    const scannedStems = normalizeProductName(product.nom);

    setStock(prevStock => {
      const found = prevStock.find(p =>
        haveCommonStems(normalizeProductName(p.nom), scannedStems)
      );

      let addedQty = 1;

      if (found) {
        const updated = prevStock.map(p =>
          haveCommonStems(normalizeProductName(p.nom), scannedStems)
            ? {
                ...p,
                quantite: p.quantite + 1,
                imageUrl: p.imageUrl || product.imageUrl || null,
                nutriScore: p.nutriScore || product.nutriScore || null
              }
            : p
        );
        // décrémenter la liste manuelle
        adjustManualListAfterStockChange(found.nom, addedQty);
        return updated;
      } else {
        const newList = [...prevStock, {
          ...product,
          quantite: 1,
          imageUrl: product.imageUrl || null,
          nutriScore: product.nutriScore || null
        }];
        adjustManualListAfterStockChange(product.nom, addedQty);
        return newList;
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
        manualShoppingList,          // NEW
        addManualShoppingItem,
        updateManualShoppingItem,
        removeManualShoppingItem,
        clearPurchasedManualItems,
        addToStock,
        updateStock,
        removeFromStock,
        setIdealStockForProduct,
        removeFromIdealStock,
        normalizeProductName,
        matchesShoppingItem,
      }}
    >
      {children}
    </StockContext.Provider>
  );
};