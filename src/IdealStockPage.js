import React, { useContext, useState } from 'react';
import { StockContext } from './StockContext';

export default function IdealStockPage() {
  const { setIdealStockForProduct } = useContext(StockContext);
  const [nom, setNom] = useState('');
  const [quantite, setQuantite] = useState(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIdealStockForProduct(nom, quantite);
    setNom('');
    setQuantite(1);
  };

  return (
    <div>
      <h1>Définir le Stock Idéal</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Nom du produit"
          required
        />
        <input
          type="number"
          value={quantite}
          onChange={(e) => setQuantite(parseInt(e.target.value))}
          placeholder="Quantité idéale"
          required
        />
        <button type="submit">Ajouter</button>
      </form>
    </div>
  );
}
