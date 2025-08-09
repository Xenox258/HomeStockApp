import React, { createContext, useState, useEffect, useRef } from 'react';
import { normalizeProductName, haveCommonStems, matchesShoppingItem } from 'utils/normalizeProductName';

export const StockContext = createContext();

export const StockProvider = ({ children }) => {
  const [stock, setStock] = useState([]);
  const [idealStock, setIdealStock] = useState([]);
  const [manualShoppingList, setManualShoppingList] = useState([]);

  const hydratedRef = useRef(false);
  const LS_KEY = 'homestock:v1';

  // Hydration
  useEffect(() => {
    if (hydratedRef.current) return;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.stock) setStock(parsed.stock);
        if (parsed.idealStock) setIdealStock(parsed.idealStock);
        if (parsed.manualShoppingList) setManualShoppingList(parsed.manualShoppingList);
      }
    } catch(e){ console.warn('Hydration error', e); }
    hydratedRef.current = true;
  }, []);

  // Sauvegarde (throttle simple)
  useEffect(() => {
    if (!hydratedRef.current) return;
    const payload = JSON.stringify({ stock, idealStock, manualShoppingList });
    localStorage.setItem(LS_KEY, payload);
  }, [stock, idealStock, manualShoppingList]);

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
      let updated;
      if (found) {
        updated = prevStock.map(p =>
          haveCommonStems(normalizeProductName(p.nom), scannedStems)
            ? {
                ...p,
                quantite: p.quantite + 1,
                imageUrl: p.imageUrl || product.imageUrl || null,
                nutriScore: p.nutriScore || product.nutriScore || null
              }
            : p
        );
        adjustManualListAfterStockChange(found.nom, addedQty);
      } else {
        updated = [...prevStock, {
          ...product,
            quantite: 1,
            imageUrl: product.imageUrl || null,
            nutriScore: product.nutriScore || null
        }];
        adjustManualListAfterStockChange(product.nom, addedQty);
      }
      return updated;
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
    setStock(prev => prev.map(p => {
      if (p.code !== code) return p;
      const oldQty = p.quantite;
      const nextQty = newQuantity <= 0 ? 0 : newQuantity;
      if (nextQty > oldQty) {
        adjustManualListAfterStockChange(newName || p.nom, nextQty - oldQty);
      }
      return { ...p, quantite: nextQty, nom: newName || p.nom };
    }).filter(p => p.quantite > 0));
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
        manualShoppingList,
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