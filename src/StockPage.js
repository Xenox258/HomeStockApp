import React, { useContext, useState } from 'react';
import { StockContext } from './StockContext';

export default function StockPage() {
  const { stock, updateStock, removeFromStock } = useContext(StockContext);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editQuantity, setEditQuantity] = useState(0);

  const handleEdit = (product) => {
    setEditingProduct(product.code);
    setEditQuantity(product.quantite);
  };

  const handleSave = (product) => {
    updateStock(product.code, editQuantity);
    setEditingProduct(null);
  };

  const handleCancel = () => {
    setEditingProduct(null);
    setEditQuantity(0);
  };

  const handleDelete = (product) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${product.nom}" ?`)) {
      removeFromStock(product.code);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "auto" }}>
      <h1>Stock Actuel</h1>
      {stock.length === 0 ? (
        <p>Aucun produit dans le stock.</p>
      ) : (
        <div>
          {stock.map((product) => (
            <div key={product.code} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px',
              margin: '5px 0',
              backgroundColor: '#f5f5f5',
              borderRadius: '5px',
              gap: '10px'
            }}>
              <div style={{ flex: 1 }}>
                <strong>{product.nom}</strong>
                <br />
                <small>Code: {product.code}</small>
              </div>
              
              {editingProduct === product.code ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                    min="0"
                    style={{ width: '60px', padding: '5px' }}
                  />
                  <button 
                    onClick={() => handleSave(product)}
                    style={{ padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                  >
                    ✓
                  </button>
                  <button 
                    onClick={handleCancel}
                    style={{ padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                  >
                    ✗
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 'bold', minWidth: '60px' }}>
                    Qté: {product.quantite}
                  </span>
                  <button 
                    onClick={() => handleEdit(product)}
                    style={{ padding: '5px 10px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                  >
                    Modifier
                  </button>
                  <button 
                    onClick={() => handleDelete(product)}
                    style={{ padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}