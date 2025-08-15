import React, { createContext, useState, useEffect, useRef } from 'react';
import { normalizeProductName, haveCommonStems, matchesShoppingItem } from 'utils/normalizeProductName';

export const StockContext = createContext();

export const StockProvider = ({ children }) => {
  const [stock, setStock] = useState([]);
  const [groups, setGroups] = useState([]);
  const [idealStock, setIdealStock] = useState([]);              // (ré‑ajout)
  const [manualShoppingList, setManualShoppingList] = useState([]); // (ré‑ajout)

  // --- Groupes manuels (création simple) ---
  const addGroup = (name) => {
    const n = (name || '').trim();
    if (!n) return;
    setGroups(g => {
      // éviter doublon (insensible à la casse)
      if (g.some(x => x.name.toLowerCase() === n.toLowerCase())) return g;
      return [...g, { id: (crypto.randomUUID?.() || Date.now().toString(36)), name: n }];
    });
  };

  const assignProductToGroup = (code, groupId) => {
    setStock(prev => prev.map(p => p.code === code
      ? {
          ...p,
          groupId: groupId || null,
          groupName: groupId ? (groups.find(g => g.id === groupId)?.name || '') : null
        }
      : p
    ));
  };

  const hydratedRef = useRef(false);
  const migratedRef = useRef(false);          // <-- ajout
  const LS_KEY = 'homestock:v1';

  // Hydration
  useEffect(() => {
    if (hydratedRef.current) return;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.stock) setStock(parsed.stock);
        if (parsed.groups) {
          const cleaned = parsed.groups
            .filter(g => g && typeof g.name === 'string' && g.name.trim())
            .map(g => ({ ...g, name: g.name.trim() }));
          // --- Enlever tout groupe précréé type "fruit"
          const blacklist = new Set(['fruit','fruits','fruit & legumes','fruits','fruits & legumes','légumes','legumes']);
          const noDefaults = cleaned.filter(g => !blacklist.has(g.name.toLowerCase()));
          setGroups(noDefaults);
        }
        if (parsed.idealStock) setIdealStock(parsed.idealStock);
        if (parsed.manualShoppingList) setManualShoppingList(parsed.manualShoppingList);
      }
    } catch(e){ console.warn('Hydration error', e); }
    hydratedRef.current = true;
  }, []);

  // Sauvegarde
  useEffect(() => {
    if (!hydratedRef.current) return;
    const payload = JSON.stringify({
      stock,
      groups,
      idealStock,
      manualShoppingList
    });
    localStorage.setItem(LS_KEY, payload);
  }, [stock, groups, idealStock, manualShoppingList]);

  // Migration / cleanup automatique (doublons, groupes vides ou orphelins)
  useEffect(() => {
    if (!hydratedRef.current || migratedRef.current) return;
    migratedRef.current = true;

    setGroups(prev => {
      const blacklist = new Set(['fruit','fruits','fruit & legumes','fruits & legumes','légumes','legumes']);
      const cleaned = [];
      const seen = new Set();
      for (const g of prev) {
        if (!g || !g.name) continue;
        const name = g.name.trim();
        if (!name || blacklist.has(name.toLowerCase())) continue; // supprime encore si restait
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        cleaned.push({ id: g.id || Date.now().toString(36)+Math.random().toString(36).slice(2), name });
      }
      return cleaned;
    });

    // Retirer références à des groupes inexistants
    setStock(prev => prev.map(p => {
      if (!p.groupId) return p;
      const still = groups.some(g => g.id === p.groupId);
      if (still) return p;
      return { ...p, groupId: null, groupName: null };
    }));
  }, [groups, stock]);

  // --- Liste de courses manuelle ---
  const addManualShoppingItem = (nom, quantite = 1, meta = {}) => {
    const name = (nom || '').trim();
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

  // Décrémentation auto de la liste manuelle après ajout stock
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
              next.push({ ...item, quantite: item.quantite - remaining });
              remaining = 0;
            } else {
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

  // --- Stock ---
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
        adjustManualListAfterStockChange(found.nom, addedQty);
        return updated;
      } else {
        const updated = [...prevStock, {
          ...product,
          quantite: 1,
          imageUrl: product.imageUrl || null,
          nutriScore: product.nutriScore || null,
          groupId: null,
          groupName: null
        }];
        adjustManualListAfterStockChange(product.nom, addedQty);
        return updated;
      }
    });
  };

  const updateStock = (code, newQuantity, newName) => {
    setStock(prev => prev.map(p => {
      if (p.code !== code) return p;
      const oldQty = p.quantite;
      const nextQty = newQuantity <= 0 ? 0 : newQuantity;
      const nameToUse = newName || p.nom;
      if (nextQty > oldQty) {
        adjustManualListAfterStockChange(nameToUse, nextQty - oldQty);
      }
      return {
        ...p,
        quantite: nextQty,
        nom: nameToUse
      };
    }).filter(p => p.quantite > 0));
  };

  const removeFromStock = (code) => {
    setStock(prev => prev.filter(p => p.code !== code));
  };

  // --- Objectifs (idealStock) ---
  const setIdealStockForProduct = (nom, quantite) => {
    const normalizedStems = normalizeProductName(nom);
    setIdealStock(prevIdeal => {
      const found = prevIdeal.find(p =>
        haveCommonStems(normalizeProductName(p.nom), normalizedStems)
      );
      if (found) {
        return prevIdeal.map(p =>
          haveCommonStems(normalizeProductName(p.nom), normalizedStems)
            ? { ...p, quantite }
            : p
        );
      }
      return [...prevIdeal, { nom, quantite }];
    });
  };

  const removeFromIdealStock = (productName) => {
    setIdealStock(prev => prev.filter(p => p.nom !== productName));
  };

  // Valeur du contexte
  const value = {
    stock,
    idealStock,
    manualShoppingList,
    groups,
    addGroup,
    assignProductToGroup,
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
    matchesShoppingItem
  };

  return (
    <StockContext.Provider value={value}>
      {children}
    </StockContext.Provider>
  );
};