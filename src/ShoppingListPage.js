import React, { useContext } from 'react';
import { StockContext } from './StockContext';

export default function ShoppingListPage() {
  const { stock, idealStock, normalizeProductName } = useContext(StockContext);

  console.log('Stock actuel:', stock);
  console.log('Stock idéal:', idealStock);
  console.log('normalizeProductName function:', normalizeProductName);

  const shoppingList = idealStock.map((idealProduct) => {
    const normalizedIdealName = normalizeProductName(idealProduct.nom);
    console.log(`Produit idéal: ${idealProduct.nom} -> normalisé: ${normalizedIdealName}`);
    
    const currentProduct = stock.find((p) => {
      const normalizedStockName = normalizeProductName(p.nom);
      console.log(`Stock: ${p.nom} -> normalisé: ${normalizedStockName}`);
      return normalizedStockName === normalizedIdealName;
    });
    
    const currentQuantite = currentProduct ? currentProduct.quantite : 0;
    const neededQuantite = Math.max(0, idealProduct.quantite - currentQuantite);

    console.log(`${idealProduct.nom}: besoin de ${neededQuantite} (idéal: ${idealProduct.quantite}, actuel: ${currentQuantite})`);

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