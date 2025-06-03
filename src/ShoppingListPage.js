import React, { useContext } from 'react';
import { StockContext } from './StockContext';

export default function ShoppingListPage() {
  const { stock, idealStock } = useContext(StockContext);
  const { normalizeProductName, haveCommonStems } = require('./utils/normalizeProductName');

  const shoppingList = idealStock.map((idealProduct) => {
    const normalizedIdeal = normalizeProductName(idealProduct.nom);

    const currentProduct = stock.find((p) => {
      const normalizedStock = normalizeProductName(p.nom);
      return haveCommonStems(normalizedStock, normalizedIdeal);
    });

    const currentQuantite = currentProduct ? currentProduct.quantite : 0;
    const neededQuantite = Math.max(0, idealProduct.quantite - currentQuantite);

    return { ...idealProduct, neededQuantite };
  }).filter((product) => product.neededQuantite > 0);

  return (
    <div>
      <h1>Liste de Courses</h1>
      <ul>
        {shoppingList.map((product) => (
          <li key={product.nom}>
            {product.nom} - Quantité nécessaire : {product.neededQuantite}
          </li>
        ))}
      </ul>
    </div>
  );
}