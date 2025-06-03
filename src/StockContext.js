import React, { createContext, useState } from 'react';
import { normalizeProductName, haveCommonStems } from './utils/normalizeProductName';

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

  const updateStock = (code, newQuantity) => {
    setStock((prevStock) => {
      if (newQuantity <= 0) {
        return prevStock.filter((p) => p.code !== code);
      } else {
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
    <StockContext.Provider
      value={{
        stock,
        idealStock,
        addToStock,
        updateStock,
        removeFromStock,
        setIdealStockForProduct,
        normalizeProductName,
      }}
    >
      {children}
    </StockContext.Provider>
  );
};
