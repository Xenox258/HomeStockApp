/* filepath: /home/teob/Documents/Perso/APP_Gest_Courses/gest_stock/src/StockPage.js */
import React, { useContext, useState } from 'react';
import { StockContext } from 'context/StockContext';
import 'styles/StockPage.css';

export default function StockPage() {
  const { stock, updateStock, removeFromStock } = useContext(StockContext);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editQuantity, setEditQuantity] = useState(0);
  const [editName, setEditName] = useState(''); // Nouveau state pour le nom

  const handleEdit = (product) => {
    setEditingProduct(product.code);
    setEditQuantity(product.quantite);
    setEditName(product.nom); // Initialiser avec le nom actuel
  };

  const handleSave = (product) => {
    updateStock(product.code, editQuantity, editName); // Passer le nouveau nom
    setEditingProduct(null);
    setEditName(''); // Reset du nom
  };

  const handleCancel = () => {
    setEditingProduct(null);
    setEditQuantity(0);
    setEditName(''); // Reset du nom
  };

  const handleDelete = (product) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${product.nom}" ?`)) {
      removeFromStock(product.code);
    }
  };

  return (
    <div className="stock-container">
      <div className="stock-header">
        <h1 className="stock-title">📋 Stock Actuel</h1>
        <p className="stock-subtitle">
          {stock.length === 0 
            ? "Aucun produit dans le stock" 
            : `${stock.length} produit${stock.length > 1 ? 's' : ''} en stock`
          }
        </p>
      </div>

      {stock.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>Stock vide</h3>
          <p>Commencez par scanner des produits pour les ajouter à votre stock</p>
        </div>
      ) : (
        <div className="stock-grid">
          {stock.map((product) => {
            const ns = (product.nutriScore || '').toLowerCase(); // 'a'...'e'
            return (
            <div key={product.code} className="product-card">
              <div className="product-header">
                <div className="product-info">
                  <div className="product-main-line">
                    {product.imageUrl
                      ? (
                        <img
                          src={product.imageUrl}
                          alt={product.nom}
                          className="product-thumb inline"
                          loading="lazy"
                        />
                      )
                      : (
                        <div className="product-thumb placeholder inline">
                          {product.nom?.[0]?.toUpperCase() || '🗂️'}
                        </div>
                      )
                    }
                    <h3 className="product-name">
                      {product.nom.charAt(0).toUpperCase() + product.nom.slice(1)}
                    </h3>
                  </div>
                  <span className="product-code">Code: {product.code}</span>

                  {ns && (
                    <div className="nutriscore-scale" aria-label={`Nutri-Score ${ns.toUpperCase()}`}>
                      {['a','b','c','d','e'].map(letter => (
                        <span
                          key={letter}
                          className={
                            'ns-letter ns-' + letter + (letter === ns ? ' active' : '')
                          }
                        >
                          {letter.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="quantity-badge">
                  {product.quantite}
                </div>
              </div>
              
              {editingProduct === product.code ? (
                <div className="edit-section">
                  <div className="name-input-container">
                    <label>Nouveau nom :</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="name-input"
                      placeholder="Nom du produit"
                    />
                  </div>
                  <div className="quantity-input-container">
                    <label>Nouvelle quantité :</label>
                    <input
                      type="number"
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                      min="0"
                      className="quantity-input"
                    />
                  </div>
                  <div className="edit-buttons">
                    <button 
                      onClick={() => handleSave(product)}
                      className="btn btn-save"
                    >
                      ✓ Sauvegarder
                    </button>
                    <button 
                      onClick={handleCancel}
                      className="btn btn-cancel"
                    >
                      ✗ Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="action-buttons">
                  <button 
                    onClick={() => handleEdit(product)}
                    className="btn btn-edit"
                  >
                    ✏️ Modifier
                  </button>
                  <button 
                    onClick={() => handleDelete(product)}
                    className="btn btn-delete"
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}